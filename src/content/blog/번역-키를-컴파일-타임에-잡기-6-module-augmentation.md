---
title: "번역 키를 컴파일 타임에 잡기 #6 — 남의 라이브러리 타입을 내 코드에서 확장하기, module augmentation"
series: "번역 키를 컴파일 타임에 잡기"
seriesOrder: 6
pubDate: 2026-07-15
description: "#3에서 declare module 한 줄로 번역 키를 잠갔는데, 그게 왜 아무도 import 안 해도 프로그램 전역에 퍼지는지가 남아 있었다. i18next의 빈 interface를 채우는 module augmentation을 밑바닥까지 파고, barrel export가 왜 다른 앱까지 타입을 오염시키는지까지 내려갔다."
tags: ["TypeScript", "i18n", "회고"]
---

> #3에서 `declare module` 한 조각으로 번역 키를 잠갔고, #5에서 그 밑에 깔린 JS 모듈 시스템("모듈이냐 스크립트냐", 파일마다 자기 스코프)을 봤다. 이번 글은 그 두 개를 잇는다 — **내 코드에서 남의 라이브러리(i18next) 타입을 어떻게 확장하고, 그 확장이 왜 아무도 import 안 해도 프로그램 전체에 퍼지며, barrel로 내보내면 왜 다른 앱까지 타입을 오염시키는가.** #5가 파일마다 스코프가 격리된다는 내용이었다면, 여기서는 module augmentation이 program 단위로 어떻게 적용되는지를 본다.

## 1. 목표 — `t()`가 부르는 키를 컴파일 타임에 잡기

우리가 원하는 건 이거다. `t('user.greeting')`처럼 번역 키를 문자열로 부를 때, **그 키가 실제로 로케일 파일에 존재하는지를 tsc/IDE가 작성 시점에 검사**해주는 것. 오타(`t('user.greetng')`)나 존재하지 않는 키를 런타임 전에 잡고 싶다.

문제는 `t`가 i18next 라이브러리의 함수라는 점이다. **i18next의 타입을 내가 바꿔야** 하는데, 그건 내 코드가 아니라 `node_modules` 안에 있다. 그런데 i18next는 이걸 위해 구멍 하나를 열어뒀다. 실제 타입 정의를 열어보면 이렇게 생겼다.

```ts
// node_modules/i18next 안 — 사용자가 채우라고 비워둔 구멍
export interface CustomTypeOptions {}
```

주석까지 친절하게 달려 있다 — *"This interface can be augmented by users to add types."* 이 **빈 인터페이스**가 확장점이다. 우리가 할 일은 여기에 우리의 키 타입을 채우는 것. 그런데 "남이 정의한 빈 인터페이스를 내가 채운다"는 게 정확히 어떻게 가능한가? 그 답이 이 글 전체다. 먼저 **왜 하필 `interface`인가**부터.

## 2. 곁길 — `type` vs `interface`, 왜 하필 interface인가

TypeScript에서 타입에 이름을 붙이는 방법은 크게 둘이다.

- **`type` (타입 별칭)** — 어떤 타입 *표현식*에 이름표를 다는 것. 그래서 뭐든 표현할 수 있다: 유니온(`A | B`), 원시타입(`type Id = string`), 튜플, 매핑 타입, 조건부 타입…
- **`interface`** — *객체 형태*에 타입을 지정하는 것. 유니온이나 원시타입은 표현 못 한다. 대신 하나의 성질이 있다 — **열려 있다.**

이 "열려 있다"가 핵심이다. **같은 이름의 `interface`를 여러 번 선언하면 TypeScript가 하나로 합친다**(선언 병합, declaration merging — 켜고 끄는 설정이 아니라 언어 기본 동작). 반면 `type`은 같은 이름을 두 번 쓰면 그냥 에러다.

```ts
// type — 닫혀 있다
type Box = { width: number };
type Box = { height: number };   // ❌ Duplicate identifier 'Box'

// interface — 열려 있다
interface Box { width: number }
interface Box { height: number }
// ✅ Box = { width: number; height: number }
```

![type은 같은 이름 재선언이 Duplicate identifier 에러로 막히고(닫힌 별칭), interface는 같은 이름이 하나로 병합된다(열린 계약). 하단에 병합 규칙: 같은 이름 멤버는 같은 타입이면 OK, 다른 타입이면 TS2717(좁힘도 불가), 다른 이름은 추가, 메소드는 오버로드](/blog/module-augmentation/type-vs-interface-merge.svg)

병합에는 규칙이 있는데, 나중에 나올 오염과 직결되니 지금 짚어두자.

- **같은 이름의 non-function 멤버**: 타입이 **같아야만** 병합된다(그냥 중복 제거). 타입이 다르면 **에러**다. 나도 "나중 선언이 오버라이드하겠거니" 생각하기 쉬웠는데 아니었다 — 단순히 타입을 좁히는 것조차 안 된다.
- **다른 이름 멤버**: 그냥 추가된다.
- **메소드(함수 시그니처)**: 같은 이름이면 오버로드로 취급해 둘 다 살아남는다.

왜 `interface`만 이렇게 열려 있나? **객체는 확장될 수 있다는 걸 언어가 의도적으로 허용하기 때문**이다(라이브러리 타입·전역 타입을 밖에서 덧붙이라고). `type`은 완결된 단일 표현식이라, 같은 이름을 두 번 정의하면 "어느 게 맞느냐"가 모호해서 에러다.

> 확장 방식도 다르다. `interface`는 `extends`로 상속하듯 확장한다 — #4에서 "타입은 집합"으로 봤듯, 속성을 *더하면* 값의 집합은 *좁아져* 자식이 부모의 **부분집합**이 된다. `type`은 `&`(교집합)로 합성한다. 차이 하나 — `extends`는 비호환 오버라이드를 **즉시 에러**(TS2430)로 잡지만, `&`로 같은 프로퍼티를 다른 타입으로 합성하면 조용히 **`never`**가 된다(정의 시점엔 에러 없이, 나중에 그 자리에 값을 넣으려 할 때 터진다). 확장 가능한 라이브러리 API가 `type`+`&`이 아니라 빈 `interface`를 노출하는 이유 중 하나가 이 "시끄러운 실패"다.

그래서 i18next의 `CustomTypeOptions`가 **빈 `interface`**인 것이다. 우리는 같은 이름 `interface`를 다시 선언해 **병합으로** 그 구멍을 채우기만 하면 된다. 단, 문제가 하나 있다.

## 3. `declare module` — 내 스코프가 아니라 *남의* 스코프를 다시 연다

병합은 **같은 스코프 안에서만** 일어난다. #5에서 봤듯 모듈은 파일마다 자기 스코프를 갖는다. 그런데 `CustomTypeOptions`는 **i18next 모듈 *안*에** 산다. 내 파일에서 그냥 이렇게 쓰면?

```ts
// myfile.ts — ❌ 안 됨
import { CustomTypeOptions } from 'i18next';
interface CustomTypeOptions { resources: /* 내 키 타입 */ }
```

이건 **내 파일 스코프의 별개 인터페이스**(`myfile::CustomTypeOptions`)가 될 뿐, i18next의 것과는 다른 스코프라 병합되지 않는다. 타입이 안 꽂힌다.

병합이 되려면 **i18next의 스코프 안으로 들어가야** 한다. 그 도구가 `declare module`이다 — 남의 모듈 스코프를 *다시 여는* 것.

```ts
// i18next.d.ts — ✅
import type en from './locales/en.json';   // (역할은 §4에서)

declare module 'i18next' {                   // ← i18next의 스코프를 다시 연다
  interface CustomTypeOptions {              // ← 이제 i18next 스코프 안의 선언
    resources: { translation: typeof en };   //    → i18next의 빈 것과 병합됨
  }
}
```

![왼쪽은 내 파일에서 CustomTypeOptions를 import해 재선언하는 방식 — myfile 스코프의 별개 인터페이스라 i18next 것과 병합되지 않아 타입이 안 꽂힘. 오른쪽은 declare module 'i18next' 블록으로 i18next 스코프를 다시 열어 그 안에서 선언 — 같은 스코프라 병합됨. 하단: 타입을 가져오는 게 아니라 남의 스코프로 들어가는 것](/blog/module-augmentation/declare-module-reopen-scope.svg)

멘탈 모델을 정확히 하자. **타입을 내 쪽으로 "가져오는" 게 아니라, `declare module`로 i18next의 스코프에 "들어가서" 그 안에서 같은 이름 인터페이스를 선언해 병합하는 것이다.** 공식 문서 표현으로는 augmentation이 *"원본과 같은 파일에서 선언된 것처럼 병합"*된다.

## 4. 함정 — 같은 문법, 정반대 의미 (`import` 한 줄이 스위치)

그런데 §3 코드 맨 위의 `import type en`은 뭘 하는 걸까? "`typeof en` 타입 재료를 가져오려는 것"으로 보이지만, **더 결정적인 역할이 따로 있다.**

`declare module "i18next"`라는 **똑같은 문법**은, **담긴 파일이 모듈이냐 스크립트냐**에 따라 뜻이 정반대로 갈린다.

![같은 declare module 'i18next' 코드 두 개. 위: top-level import가 있어 파일이 모듈이면 module augmentation(기존 i18next에 덧붙임). 아래: import가 없어 스크립트면 ambient module 선언(그런 모듈이 있다고 새로 선언 → 원본과 충돌). 하단: i18next 공식 예제가 import 'i18next' 한 줄을 두는 이유 = 파일을 모듈로 만들기 위해서](/blog/module-augmentation/ambient-vs-augmentation.svg)

- 파일이 **모듈**(top-level `import`/`export` 있음) → `declare module`은 **module augmentation** — 기존 i18next에 *덧붙인다*. ✅
- 파일이 **스크립트**(import/export 없음) → **ambient module 선언** — "i18next라는 모듈이 존재한다"고 *새로 선언*한다 → 진짜 i18next와 충돌. 💥

그래서 `import type en`은 타입 재료인 동시에 — 사실 더 중요하게는 — **이 파일을 스크립트에서 모듈로 뒤집는 스위치**다. 이게 없으면 augmentation이 ambient 선언으로 뒤바뀐다. 증거: i18next 공식 예제는 값도 안 쓰는 `import 'i18next';` 한 줄을 맨 위에 둔다 — 오직 파일을 모듈로 만들기 위해서다. 값도 안 쓰는 이 import가 파일의 모듈성을 지탱하는 셈이고, `typeof import('./locales/en.json')`로 인라인하며 이 import를 지우면 파일이 스크립트가 되어 augmentation이 ambient 선언으로 바뀐다.

## 5. program 모델 — 왜 아무도 import 안 해도 전역에 퍼지나

#5에서 "모듈 선언은 파일에 갇힌다"고 했는데, **augmentation은 안 갇힌다.** 그걸 이해하려면 TypeScript가 타입을 검사하는 단위, **program**을 알아야 한다.

**TypeScript는 파일을 하나씩 따로 보지 않는다. 함께 속한 파일들을 하나의 "program"으로 묶어, 그 전체를 한꺼번에 병합·검사한다.** program에 어떤 파일이 들어가는지는 두 경로로 정해진다.

1. **tsconfig 설정** — `include`/`files` glob에 잡히거나(`exclude`로 빠지거나), `types`/`typeRoots`로 편입. ★ `include`의 `src/**/*.ts`는 **`.d.ts`도 잡는다**(`.ts`로 끝나니까). 우리 `i18next.d.ts`가 program에 들어오는 경로가 이거다.
2. **import 그래프** — 어떤 파일에서 시작해 `import`/`export … from`/`import type`을 따라 **도달 가능한 모든 파일**. 그 파일들의 import도 재귀적으로.

program이 확정되면 TypeScript는 그 안의 선언을 **전역에서 병합**한다 — 같은 스코프 interface 병합, 모든 `declare module 'i18next'` augmentation을 i18next에 병합. 그리고 여기서 결정적 비대칭이 생긴다.

![왼쪽: 일반 선언(export const x)은 파일에 갇혀 import한 곳에서만 보이고 다른 파일은 못 본다. 오른쪽: 하나의 program 상자 안에 i18next.d.ts가 glob으로 편입되면, 아무도 그 파일을 import 안 해도 program 안 모든 t() 호출에 적용된다 — SettingDialog·ExportDialog는 세이프(이점), 딸려 들어온 shared-lib의 동적 t(변수)는 깨짐(부작용). 하단: 일반 선언은 import해야 보임 / augmentation은 program에 있기만 하면 전역](/blog/module-augmentation/scope-isolation-vs-spread.svg)

- **일반 선언**(`export const x`)은 import한 곳에서만 보인다.
- **augmentation**은 그 파일이 **program 구성원이기만 하면**, `t()`를 부르는 파일이 그 `.d.ts`를 **import 안 해도** program 전체에 적용된다.

이건 이점이자 부작용이다. 이점 — program 안 모든 다이얼로그의 `t()`가 한 번에 타입 세이프해진다. 부작용 — augmentation이 얹히는 순간 내가 import하는 **모든 shared-lib**의 `t()`까지 strict해진다. (실제로 이 방식을 적용했을 때, 예상 못 한 shared-lib의 동적 `t(변수)` 호출이 컴파일을 깼다. `string`은 키 유니온보다 넓어서 거부되기 때문 — 리터럴 키만 몇 개 테스트했을 땐 안 보이던 파장이 전체 typecheck에서야 드러났다. 이건 §8에서.)

## 6. barrel — 격리가 새는 경로

그럼 이 "전역"은 어디까지인가? 딱 **하나의 program까지**다. 그리고 모노레포에선 **앱/lib마다 자기 tsconfig → 자기 program**이다. 이게 앱 간 격리의 정체다 — lib의 augmentation은 lib program에서만 적용되고, 다른 앱은 별개 program이라 안 닿는다.

단, 이 격리는 그 파일이 다른 program에 안 닿을 때만 성립한다. 여기서 barrel(`export * from`으로 이웃 모듈을 재수출하는 `index.ts`)이 관여한다.

![모노레포의 두 program. Program E(lib)는 i18next.d.ts를 glob으로 편입해 내부 다이얼로그가 세이프. index.ts barrel은 공개 진입점. Program A(app)는 별개 tsconfig로 barrel을 import. 아래 두 갈래 — 왼쪽(초록): barrel이 i18next.d.ts를 재수출 안 하면 app의 어느 경로로도 도달 못 해 Program A에 안 들어옴, 격리(listFilesOnly 목록에 없음). 오른쪽(빨강): barrel이 export *로 누출하면 import 그래프로 도달해 Program A에 편입, app의 i18next도 lib 키로 augment되어 TS2717(app이 자기 augmentation 있을 때)/TS2345(없을 때)](/blog/module-augmentation/barrel-leak-two-programs.svg)

barrel의 성질을 정확히 보자. **`export * from`은 소비자가 하나만 import해도, 재수출된 이웃 전체를 소비자의 그래프에 끌어올린다.** (TypeScript가 barrel의 export 목록을 알려면 `export *` 대상을 다 로드해야 하기 때문.) 그 이웃 중에 augmentation 파일이 끼어 있으면 —

- barrel이 그걸 **재수출 안 하면**: app의 어느 경로로도 도달 못 함 → Program A에 안 들어옴 → app의 i18next는 그대로. **격리.** ✅
- barrel이 `export *`로 **누출하면**: import 그래프를 타고 Program A에 편입 → app의 i18next도 (그것도 lib의 키로) augment됨. **오염.** 💥

즉 별개 tsconfig는 **필요조건일 뿐 자동 방화벽이 아니다.** 파일이 다른 program에 안 들어가려면 그 program의 glob에도, **import 그래프에도** 안 닿아야 하고, 후자를 지키는 게 barrel 규율이다. 요지 하나 — **augmentation `.d.ts`는 자기 lib의 glob에만 넣고, 밖으로 나가는 barrel엔 재수출하지 않는다.**

## 7. 오염의 두 가지 증상 — TS2717과 TS2345

barrel이 augmentation을 누출했을 때 실제로 뭐가 터지나? 소비자 앱이 **자기 augmentation을 갖고 있느냐**로 갈린다.

![두 경우. ① 소비자도 자기 augmentation 있음 — 한 program에 augmentation 둘(누출된 lib 것 resources:A + app 것 resources:B)이 같은 프로퍼티를 다른 타입으로 선언 → 병합 규칙 위반 → TS2717 충돌. ② 소비자는 augmentation 없음 — 충돌은 없지만 app의 i18next가 lib 키(A)로 augment돼, app 자기 유효 키 호출이 lib 키 union에 없어 TS2345로 깨짐. 하단: 두 경우 다 격리가 barrel 누출로 깨진 것, 병합은 오버라이드가 아니라 충돌](/blog/module-augmentation/ts2717-collision.svg)

- **소비자도 자기 augmentation이 있으면**: 한 program 안에 `CustomTypeOptions.resources`가 두 번, 서로 다른 타입으로 선언된다 → §2의 병합 규칙("같은 이름 non-function 멤버는 같은 타입이어야") 위반 → **`TS2717: Subsequent property declarations must have the same type`**. "마지막이 이긴다"가 아니라 하드 에러다.
- **소비자가 augmentation이 없으면**: 충돌은 없지만, app의 i18next가 lib의 키로 잘못 좁혀진다 → app이 자기 유효 키로 `t()`를 부르면 lib 키 유니온에 없어서 **TS2345**. 유효한 호출이 되레 깨진다.

두 증상 다 뿌리는 하나다 — 격리("각 program이 i18next를 *자기 방식으로* 본다")가 barrel 누출로 깨진 것.

## 8. 마무리 — 이 모든 게 "빌드 시 전역 평가"라, 부분 프로브론 못 본다

`declare module`은 타입 전용이라 JS로는 흔적이 0이다(#1의 타입 소거). 비용은 빌드 시간뿐. 하지만 그 평가는 **program 전체를 로드하며 전역에서** 일어난다(§5). 그래서 마지막 교훈이 나온다.

나는 이 방식을 검증할 때 처음엔 리터럴 키 몇 개로 red/green 프로브만 돌렸다 — `t('valid')`는 통과, `t('typo')`는 에러. 깔끔해 보였다. 그런데 augmentation을 실제로 얹고 **전체 `tsc`를 끝까지 돌리자**, 프로브엔 없던 shared-lib의 동적 `t(변수)`가 컴파일을 깼다. augmentation은 program-전역이라, 몇 파일만 보고 "되네"로 일반화할 수 없었던 것이다.

그래서 이 기법을 다룰 때 손에 쥐어야 할 도구 둘:

- **`tsc --listFilesOnly`** — 어떤 파일이 program에 들어갔는지 목록을 그대로 찍는다. "lib program엔 augmentation이 있고, app program엔 없다"를 추론이 아니라 **출력으로** 증명한다(§6 격리 검증의 결정적 도구).
- **전체 typecheck 완주** — 리터럴 프로브의 red/green을 program 전체로 일반화하지 말 것. augmentation의 진짜 파장(전역)은 `tsc -p tsconfig.json`을 끝까지 돌려야 드러난다.

## 정리 — 그리고 시리즈를 닫으며

- 라이브러리 타입을 내 코드에서 확장하는 건 **빈 `interface`라는 확장점 + 선언 병합**으로 가능하다. `type`은 병합이 안 되니 애초에 이 방식에 못 낀다.
- 병합은 **같은 스코프 안에서만** 일어나므로, 남의 모듈 인터페이스를 채우려면 `declare module`로 **그 모듈의 스코프를 다시 열어야** 한다. 내 스코프로 가져오는 게 아니다.
- 그 파일은 **모듈이어야** `declare module`이 augmentation이 된다 — top-level import 한 줄이 스위치(아니면 ambient 선언으로 뒤바뀌어 충돌).
- augmentation은 **program에 포함되기만 하면 전역**에 퍼진다(import 불필요) — #5의 "파일 격리"를 깨는 유일한 종류의 선언. 이게 축복(다 세이프)이자 위험(shared-lib까지).
- 그래서 앱 간 격리는 **program 경계**로 지켜지고, **barrel `export *`가 그 경계를 넘겨 누출**하면 다른 앱이 오염된다(TS2717 / TS2345).
- 전부 빌드 시 전역 평가라, **부분 프로브론 못 보고 전체 typecheck·`--listFilesOnly`로 확인**해야 한다.

여섯 편에 걸쳐, "번역 키 오타가 런타임에야 터진다"는 작은 불편에서 출발해 — 타입 소거(#1), 왜 타입인가와 shift-left(#2), JSON을 타입으로(#3), 타입을 집합으로(#4), JS 모듈 시스템(#5), 그리고 오늘 module augmentation까지 내려왔다. 결국 하나의 `declare module` 블록이 왜 그렇게 동작하는지를 이해하는 데, 언어의 선언 병합부터 컴파일러의 program 모델, 모노레포의 빌드 경계까지 필요했다.
