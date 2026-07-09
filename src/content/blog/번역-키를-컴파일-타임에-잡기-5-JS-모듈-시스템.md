---
title: "번역 키를 컴파일 타임에 잡기 #5 — JS 모듈 시스템, 모듈이냐 스크립트냐"
series: "번역 키를 컴파일 타임에 잡기"
seriesOrder: 5
pubDate: 2026-07-09
description: "#3에서 declare module 한 줄로 번역 키를 잠갔는데, 그게 왜 아무도 import 안 해도 프로그램 전역에 퍼지는지는 안 풀렸다. 그걸 이해하려고 TypeScript를 잠깐 내려놓고 그 밑 JS 모듈 시스템으로 내려갔다 — 모듈이냐 스크립트냐를 누가 정하고, ESM과 CommonJS는 왜 다른가."
tags: ["TypeScript", "i18n", "회고"]
---

> #3에서 `declare module` 한 조각으로 번역 키를 잠갔고, #4에서 그 타입이 어떻게 조립되는지 봤다. 그런데 그 선언이 *왜 아무도 import 안 해도 프로그램 전체에 퍼지고, barrel로 내보내면 다른 앱까지 오염시키는지*는 아직 안 풀었다(다음 글 주제). 그걸 이해하려면 TypeScript를 잠깐 내려놓고, 그 밑에 깔린 **JS 모듈 시스템** 자체로 내려가야 한다. 이번 글은 그 토대다 — "파일이 모듈이다/스크립트다"가 무슨 뜻인지, 누가 그걸 정하는지, ESM과 CommonJS가 어떻게 다른지.

## 1. 왜 파일마다 스코프가 필요한가

JavaScript는 원래 **모듈 시스템이 없었다.** 여러 `<script>`를 나열하면, 각 파일의 최상위(top-level) 선언이 전부 **하나의 전역 스코프에 합쳐진다.** 그래서 서로 다른 파일이 같은 이름을 쓰면 부딪힌다.

```js
// a.js
const config = { theme: 'dark' };

// b.js
const config = { lang: 'ko' };   // 💥 같은 전역 스코프에 'config' 두 번
```

이걸 TypeScript에서 겪으면 이런 에러가 뜬다.

```
SyntaxError: Cannot redeclare block-scoped variable 'config'.
```

여기서 나도 처음엔 헷갈렸던 걸 하나 짚자. 이 충돌을 "호이스팅" 탓으로 알기 쉬운데, 따져보니 원인은 **"스코프 공유"** 였다. 호이스팅(선언이 실행 전에 스코프에 등록되는 것)은 충돌이 *드러나는 시점*이지 원인이 아니다. 증거는 간단하다 — 스코프를 분리하면 호이스팅은 **똑같이** 일어나는데도 충돌이 사라진다. 즉 충돌을 만드는 변수는 "호이스팅되느냐"가 아니라 "같은 스코프를 공유하느냐"다.

> 참고로 부딪히는 건 **블록 스코프 선언(`let`/`const`/`class`)** 뿐이다. `var`와 `function`은 전역에서 재선언해도 조용히 덮어쓴다(에러 없음). 그래서 에러 메시지도 정확히 "**block-scoped** variable"이라고 말한다.

이 문제의 해결책이 **파일마다 스코프를 나누는 것** — 그게 **모듈**이다. 모듈이 되면 그 파일의 최상위 선언은 그 파일 안에 갇히고(`export`하지 않는 한 밖에서 안 보임), 다른 파일의 같은 이름과 부딪히지 않는다.

![왼쪽 스크립트 패널 — a.js와 b.js가 각각 const config를 선언하고, 화살표가 둘 다 하나의 '전역 스코프(합쳐짐)' 상자로 들어가 같은 이름이 두 번 등록되며 Cannot redeclare 에러가 난다. 오른쪽 모듈 패널 — a.js와 b.js가 각자 자기 스코프 버블 안에 const config를 담아 서로 독립이라 충돌이 없다. 아래 캡션: 호이스팅은 등록 시점일 뿐 원인은 공유 스코프](/blog/js-module-system/module-vs-script-scope.svg)

이 "격리"가 이번 시리즈 전체의 열쇠다 — 다음 글에서 `declare module`이 이 격리를 **깨고** 프로그램 전역으로 퍼지는 게 왜 위험한지 이야기하려면, 먼저 격리가 기본값이라는 걸 알아야 한다.

## 2. 모듈이냐 스크립트냐 — 누가 정하나

그럼 "이 파일은 모듈"이라고 **누가 정하나?** 답이 하나가 아니다. 사실 **실행 환경(호스트)이 먼저 정하고, 정적 도구는 그걸 흉내 낸다.**

ECMAScript 스펙은 최상위 파싱 목표(parse goal)를 두 개 정의한다 — **Script**와 **Module**. 그리고 *어느 목표로 파싱할지는 엔진이 콘텐츠를 보고 정하는 게 아니라, 코드를 로드하는 호스트가 정한다.* 엔진(V8 등)은 시키는 대로 파싱만 한다.

![가운데 질문 상자 '이 파일은 모듈인가?'에서 세 갈래로 뻗는다. 브라우저 갈래: script type=module 여부(로드 방식). Node 갈래: .mjs/.cjs 확장자와 package.json의 type 필드(확장자·설정). TypeScript·번들러 갈래: 파일 안 import/export/import.meta 콘텐츠(정적 근사). 아래 캡션: 실행 환경이 진실을 정하고, 정적 도구는 그것을 근사한다](/blog/js-module-system/who-decides-module.svg)

- **브라우저** (호스트 = HTML): `<script type="module">`이면 모듈, 그냥 `<script>`면 스크립트다. **콘텐츠로 자동 승격되지 않는다** — classic 스크립트에 `import`를 쓰면 모듈로 바뀌는 게 아니라 `SyntaxError`가 난다.
- **Node.js** (호스트 = 모듈 로더): 확장자 `.mjs`(항상 ESM)·`.cjs`(항상 CommonJS)가 파일 단위 결정, `.js`는 가장 가까운 `package.json`의 `"type"` 필드(`"module"` → ESM, 없거나 `"commonjs"` → CommonJS)로 정한다. 콘텐츠 기반 감지는 **`"type"`이 없는 "애매한" `.js`에 한한 최후 fallback**이다(그마저도 성능 비용이 있어 Node 공식이 `"type"` 명시를 권장한다).
- **TypeScript·번들러** (정적 도구): 런타임 전에 스코프를 정해야 하니 호스트에게 물어볼 수 없다. 그래서 **콘텐츠**(최상위 `import`/`export`/`import.meta`)로 판단한다. 이게 우리가 흔히 아는 "import 있으면 모듈" 규칙의 정체 — **컴파일러의 관점**이다.

### 최상위 import/export가 정확히 무엇인가

"최상위(top-level)"는 함수·블록 **안이 아닌** 파일 바로 그 층을 말한다. 무엇이 파일을 모듈로 만드는지 정확히 나누면:

| ✅ 모듈로 만든다 | ❌ 만들지 않는다 |
|---|---|
| `import x from '…'` / `import { a }` / `import * as ns` | **동적 `import('…')`** — import *문*이 아니라 호출 표현식 |
| **사이드이펙트 import** `import './styles.css'` | 함수·블록 안의 것 |
| **`import type` / `export type`** (타입 전용이어도 카운트) | (그 외 일반 코드) |
| `export const/function` / `export default` / `export * from` | |
| **빈 `export {}`** — 아무것도 안 내보내지만 "모듈로 만들기"용 관용구 | |
| **`import.meta`** 표현식 | |

동적 `import()`만 있는 파일이 여전히 스크립트인 건, 그게 실행 중에 부르는 함수 호출이지 정적 선언이 아니기 때문이다.

앞의 `Cannot redeclare` 충돌을 한 파일에서 없애는 가장 가벼운 방법이 바로 `export {}` 한 줄 — "이 파일은 모듈"이라고 컴파일러에 알리는 신호다.

> ⚠️ 단 `export {}`를 "존중"하는 건 **콘텐츠로 판단하는 정적 도구(TS·번들러)** 뿐이다. 브라우저는 이걸 무시하고 `<script>` 타입으로만 정하니, classic 스크립트로 로드하면 오히려 `export`가 `SyntaxError`가 된다. 파일 하나가 아니라 프로젝트 전체를 모듈로 통일하려면 TS의 `moduleDetection: "force"`(타입체크 전용)나 package.json `"type": "module"`(런타임 포맷까지)을 쓴다.

### 헷갈리는 `module*` 4형제

이름이 비슷해 자주 섞이는 TypeScript 옵션들 — 축이 전부 다르다.

| 옵션 | 무엇을 정하나 | 축 |
|---|---|---|
| **`module`** | **출력** JS의 모듈 문법 (ESM / CommonJS / UMD …) | emit(출력) |
| `moduleResolution` | `import 'x'`를 **어느 파일로 찾을지** (node / nodenext / bundler) | 입력 해석 |
| `moduleDetection` | 파일이 **모듈이냐 스크립트냐** (스코프) | 분류 |
| `target` | 모듈 외 문법의 **JS 버전** (arrow / async 등, es2020 / esnext) | 문법 다운레벨 |

한 가지 함의 — TS의 판단은 "런타임을 흉내 내는 근사"라, 그 결과가 실제 로드 방식과 어긋나면 깨진다. TS가 import/export를 보고 모듈로 컴파일했는데(`module: esnext`) 그 산출물을 classic `<script>`로 로드하면 `SyntaxError`가 나는 식이다. 그래서 언제나 **"이 코드가 어디서 실행되나"가 첫 질문**이다.

## 3. 모듈 시스템이란 — CommonJS vs ES Modules

여기서 한 걸음 물러서자. **"모듈 시스템"**이란 파일에 대해 이 네 가지를 규정하는 규칙 + 런타임 기계다: ① 파일에 자기 스코프를 주고, ② 무엇을 내보낼지(export), ③ 무엇이 필요한지(import) 선언하게 하고, ④ 그것을 로드·해석·연결·평가한다.

JS엔 원래 이게 없었으니(1절), 여러 시스템이 그 공백을 메우려 등장했다.

| 시스템 | 등장 / 무대 | 문법 |
|---|---|---|
| **CommonJS (CJS)** | 2009, Node(서버) | `require` / `module.exports` |
| AMD | 브라우저(RequireJS), 지금은 역사 | `define()` 콜백 |
| UMD | 라이브러리 배포용 래퍼 | 위 둘 + 전역 겸용 |
| **ES Modules (ESM)** | 2015(ES6), **언어 표준** | `import` / `export` |

오늘날 실질적으로 남은 둘은 **CommonJS**(CommonJS 명세를 Node가 구현)와 **ES Modules**(ECMAScript 언어 표준)다.

### 오해 방지 — "CommonJS = 전역 스코프"가 아니다

1절의 "전역 스코프 충돌"은 **모듈 시스템이 *없는* 경우**(브라우저 classic `<script>`) 이야기지 CommonJS 이야기가 아니다. Node는 CommonJS 파일도 함수로 감싸서 **각자 스코프를 준다.**

```js
(function (exports, require, module, __filename, __dirname) {
  // 모듈 코드가 여기 들어간다
});
```

Node 공식 문서 그대로: *"It keeps top-level variables ... scoped to the module rather than the global object."* 그러니 **CommonJS도 "모듈"이라 자기 스코프가 있다.** 모듈 시스템(ESM이든 CJS든)의 공통 목적은 "파일에 자기 스코프 주기"이고, 차이는 그 위의 **문법·로딩·바인딩**이다.

### 핵심 차이

| 축 | CommonJS | ES Modules |
|---|---|---|
| 문법 | `require()` / `module.exports` | `import` / `export` |
| 표준 | CommonJS 명세(Node 구현) | ECMAScript 언어 표준 |
| 로딩 | **동기** — 즉시 읽고 실행, 끝날 때까지 블록 | **비동기 가능** — 네트워크 로딩 대응 |
| 구조 | **동적** — 아무 데서나·조건부·변수 경로 호출 | **정적** — top-level 고정, 파싱 타임에 확정 |
| 바인딩 | require 시점의 exports **객체를 받음** | **live binding** — 내보낸 변수를 실시간 추적 |
| tree-shaking | 어려움(동적) | 가능(정적) |

특히 **live binding**이 ESM만의 성질이다(MDN): *"import ... read-only live bindings ... updated by the module that exported the binding, but cannot be re-assigned by the importing module."*

```js
// counter.js
export let count = 0;
setInterval(() => { count++; }, 1000);

// main.js
import { count } from './counter.js';
console.log(count); // 0
setTimeout(() => console.log(count), 2500); // 2 ← exporter가 바꾼 값이 실시간 반영
// count = 99;  ❌ TypeError — 읽기 전용
```

CommonJS였다면 `require` 시점의 값을 받고, 이후 exporter의 변수 변화는 자동으로 따라오지 않는다. 이 차이가 왜 생기는지가 다음 절이다.

## 4. 정적 vs 동적, 동기 vs 비동기 — 헷갈리는 세 축

여기서 많은 사람이(나도) 헷갈린다. "CommonJS는 동기라서 live binding이 안 되는 거 아냐?" — **아니다.** 세 개의 다른 축이 섞여 있다.

- **정적 / 동적 구조** — 코드를 *실행 안 하고 파싱만으로* import/export를 알 수 있나? (분석 가능성)
- **동기 / 비동기 로딩** — 모듈 로딩이 *블록하나*? (타이밍)
- **live binding** — import가 exporter 변수 변화를 반영하나? (바인딩 의미)

이 셋을 한 번에 설명하는 열쇠가 **로딩 단계 모델**이다. ESM은 로딩이 **세 단계**로 나뉜다.

![위쪽 ESM 3단계 — ①구성/파싱(import를 정적으로 찾아 의존성 그래프) → ②링크(export마다 메모리 슬롯 할당, import를 그 슬롯에 연결, 여기서 live binding 생성) → ③평가(코드 실행, 슬롯에 값 채움). 세 상자가 화살표로 이어지고, ①에 '정적', ②에 'live binding', ①②를 ③ 전에 할 수 있다는 '비동기 가능' 주석이 붙는다. 아래쪽 CommonJS 1단계 — require → 즉시 실행 → module.exports 반환의 단일 상자. 링크 단계가 없어 live binding 없음, 동기, 동적이라 표기](/blog/js-module-system/esm-three-phases-vs-cjs.svg)

1. **구성/파싱(Construction)** — 코드를 파싱해 `import`를 *정적으로* 찾아 의존성 그래프를 만든다. (아직 실행 안 함)
2. **링크(Instantiation)** — export마다 메모리 슬롯을 할당하고, import를 그 슬롯에 **연결**한다. ← **live binding이 여기서 생긴다**(값 복사가 아니라 슬롯 참조 연결).
3. **평가(Evaluation)** — 그제서야 코드를 실행해 슬롯에 값을 채운다.

CommonJS는 **한 단계**다: `require` → 파일을 즉시 실행 → 그 시점의 `module.exports`를 반환. 링크 단계가 없다.

이 모델이 네 가지를 전부 설명한다:

- **정적** ← 1단계가 파싱만으로 그래프를 안다
- **live binding** ← 2단계가 슬롯을 연결한다 (CJS엔 이 단계가 없으니 그냥 값/객체를 받는다 → 실시간 추적 불가). **동기/비동기와 무관하다.**
- **비동기 가능** ← 1·2단계(fetch·link)를 3단계(실행) *전에*, 병렬로 할 수 있다
- **CJS = 동기 + 동적 + no live binding** ← 전부 한 패스에서 벌어지니까

### 그래서 세 축은 연결돼 있나 — 그렇다, 방향이 중요하다

> **비동기 로딩이라는 *목표*가 정적 구조라는 *설계*를 요구했고, 정적 구조에서 링크 단계가 생기니 live binding·tree-shaking이 *부산물*로 따라왔다.**

왜 비동기가 정적을 "요구"하나 — 브라우저에서 모듈을 네트워크로 비동기 로딩하려면 **실행하기 전에 의존성을 다 알아야** 병렬로 미리 받아올 수 있다. 그런데 의존성을 실행 전에 알려면? **정적 구조여야 한다.** `require`처럼 동적이면 "뭘 받아올지"를 실행해야 아는데, 실행하려면 이미 받아와 있어야 하니 **닭-달걀**이 된다. 그래서 ESM은 **비동기를 위해 정적을 택했다.**

반대로 CommonJS는 **동기**(디스크에서 즉시 읽음, 서버라 빠름)라 그런 압박이 없었다 → 동적이어도 됐고 → 링크 단계 없이 값을 반환한다.

![인과 사슬 다이어그램. 위 줄: '비동기 로딩 필요(브라우저)' → '실행 전 의존성 파악 필요' → '정적 구조 채택'(강조), 여기서 두 갈래로 '링크 단계 → live binding'과 '파싱으로 그래프 확정 → tree-shaking'이 뻗는다. 아래 줄(대조): 'CommonJS: 동기(디스크 즉시)' → '동적이어도 OK' → '링크 없음 → live binding 없음'. 캡션: 동기/비동기는 동기(motivation), 정적/동적은 메커니즘, live binding은 결과](/blog/js-module-system/static-async-causality.svg)

그러니 **"동기라서 live binding이 안 된다"가 아니라, "CommonJS는 (동기라 가능했던) 동적·단일패스 설계라 링크 단계가 없어서 live binding이 없다"**가 정확한 표현이다. 동기/비동기는 *동기(motivation)*, 정적/동적은 *메커니즘*, live binding은 *결과*다.

## 정리 — 그리고 다음 글

- JS엔 원래 모듈 시스템이 없어 **전역 스코프 공유 → 이름 충돌**이 생긴다. 원인은 호이스팅이 아니라 **스코프 공유**.
- 그 해결이 **모듈**(파일마다 자기 스코프). "모듈이냐 스크립트냐"는 **실행 환경이 먼저 정하고**(브라우저=`type="module"`, Node=확장자/`type`), **정적 도구(TS·번들러)는 콘텐츠로 근사**한다.
- **CommonJS**와 **ES Modules**는 둘 다 자기 스코프를 주는 모듈 시스템이지만, ESM은 **정적·표준·live binding·비동기 가능**, CJS는 **동적·Node·동기·객체 반환**이다.
- 이 차이는 **로딩 단계**에서 갈린다 — ESM 3단계(구성→링크→평가), CJS 1단계. "정적이라 비동기가 되고, 정적이라 링크 단계가 생겨 live binding·tree-shaking이 따라온다."

이 "정적 구조"가 다음 글의 무대다. TypeScript가 정적으로 모듈을 분석할 수 있기 때문에 — 그리고 모듈의 타입 선언이 파일에 갇히기 때문에 — `declare module`이라는 특별한 선언이 그 격리를 **깨고** 프로그램 전역에 퍼질 수 있다. 다음 글에서는 그 **모듈 augmentation**이 어떻게 동작하고, 어디까지 전파되며, barrel export가 왜 다른 앱까지 타입을 오염시키는지 판다.
