---
title: "번역 키를 컴파일 타임에 잡기 #3 — JSON을 타입으로, 도구 없이 declare module로 키 잠그기"
pubDate: 2026-07-07
description: "번역 함수의 key를 '실제 존재하는 키들의 집합'으로 좁히는 타입을 직접 만든다. 내가 짜는 건 약 10줄, 중첩 키 평탄화 같은 어려운 부분은 i18next 타입이 이미 해뒀다. resolveJsonModule·typeof·declare module로 조립하는 과정."
tags: ["TypeScript", "i18n", "회고"]
---

> #2에서 "번역 함수의 `key`를 유효 키 집합으로 좁히면 오타·미정의·네임스페이스 오용이 컴파일 에러가 된다"를 봤다. 이번 글은 **그 타입을 실제로 만드는 방법**이다. 놀라운 부분: 우리가 직접 짜는 건 약 10줄이고, 중첩 키 평탄화 같은 어려운 부분은 **i18next가 이미 타입으로 짜뒀다.**

## 1. 큰 그림 — 어디까지 내가 짜고, 어디부터 라이브러리가 하나

목표는 번역 함수 시그니처를 이렇게 바꾸는 것이다.

```ts
function t(key: string): string        // Before — 무엇이든 통과
function t(key: '유효키1' | '유효키2' | …): string   // After — 유효 키만
```

이 union을 만드는 일을 역할로 나누면:

| 단계 | 누가 | TypeScript 기능 |
|---|:---:|---|
| JSON을 타입으로 | **나** | `resolveJsonModule` + `typeof import` |
| 런타임 병합 반영 | **나** | `Omit` + intersection(`&`) |
| 라이브러리에 꽂기 | **나** | `declare module` 선언 병합 |
| 중첩 키 평탄화(`a.b.c`) | i18next | `keyof` + 인덱스 접근 + 재귀 |
| 네임스페이스 조립(`ns:key`) | i18next | 템플릿 리터럴 타입 |
| 복수형·context·keyPrefix | i18next | 조건부 타입 + `infer` |

![타입 만들기의 역할 분담 — 왼쪽(내가 짜는 3단계): JSON을 typeof 로 타입화 → Omit/intersection 으로 런타임 병합 반영 → declare module 로 꽂기(약 10줄). 오른쪽(i18next 가 하는 것): 중첩 평탄화·네임스페이스 조립·복수형을 keyof/템플릿리터럴/조건부타입으로 자동 처리. 나는 재료(JSON 타입)만 넘긴다](/blog/i18n-json-to-type/type-build-roles.svg)

## 2. Step 1 — JSON을 타입으로 (`resolveJsonModule` + `typeof`)

번역 키는 대개 JSON 파일에 있다.

```jsonc
// en.json
{ "user": { "profile": { "title": "My Profile" } }, "close": "Close" }
```

`tsconfig`에 `resolveJsonModule: true`를 켜면 이 JSON을 import할 수 있고, TypeScript가 그 구조를 **타입으로 추론**한다.

```ts
import type en from './en.json';
type Resources = typeof en;
// → { user: { profile: { title: string } }; close: string }
```

여기 중요한 성질이 하나 있다. **JSON import는 키(프로퍼티 이름)는 정확히 주지만, 값 타입은 넓게(`string`) 준다.** 우리가 키 정합성에 필요한 건 **키뿐**이라 값이 넓은 건 상관없다.

> **왜 "값이 넓다"가 중요한가 — 로케일 완전성은 여기서 안 된다.** "영어 파일의 키가 한국어 파일에도 다 있는가"(완전성)를 타입으로 검사하려는 시도가 있다. 하지만 JSON import가 값을 넓게 추론하는 탓에 구조적 타이핑상 키 누락을 못 잡는다(실측: `satisfies`로 시도했으나 0건 검출 + 컴파일 시간 증가). `as const`로 값을 리터럴화하는 codegen을 하면 값은 얻지만 **완전성이 자동으로 따라오진 않는다** — 완전성은 애초에 "여러 파일의 키 집합 대조"라는 별개 문제이기 때문이다. 그래서 완전성은 타입이 아니라 **별도 스크립트**로 두는 게 맞다. (이 글의 타입은 "코드가 부르는 키가 존재하는가"만 담당한다.)

## 3. Step 2 — 중첩 평탄화는 내가 안 짠다 (라이브러리가 함)

우리 키는 `user.profile.title`(중첩)이나 `settings:theme`(ns:key) 형태다. 이걸 순수 타입으로 union화하려면 재귀 타입이 필요한데 — 다행히 i18next가 이미 다 짜뒀다. 다만 **그 안에서 무슨 일이 일어나는지**는 알아둘 가치가 있다. 조각으로 분해해 보자.

### 조각 A — `keyof` : 키만 뽑기

```ts
type T = { user: { name: string }; close: string };
type K = keyof T;   // → 'user' | 'close'
```

### 조각 B — 인덱스 접근 `T[K]` : 값 꺼내기

```ts
type V = T['user'];        // → { name: string }
type All = T[keyof T];     // → { name: string } | string   (인덱스에 union → 값도 union)
```

`T[keyof T]`가 **"모든 값의 union"** 이 되는 트릭을 기억하자.

### 조각 C — 매핑된 타입 : 값을 "변환"하며 union 뽑기

여기서 흔히 헷갈리는 지점 하나. 이런 코드를 보면:

```ts
type Values<T> = { [K in keyof T]: T[K] }[keyof T];
```

`{ [K in keyof T]: T[K] }`는 값을 **그대로**(`T[K]`) 돌려놓은 항등 매핑이라 **`T`와 완전히 같다.** 그러니 이건 그냥 `T[keyof T]`와 다를 게 없다 — 매핑을 쓸 이유가 없다. `tsc`로 확인해도 동일하다:

```ts
type T = { a: number; b: string };
type V1 = T[keyof T];                          // number | string
type V2 = { [K in keyof T]: T[K] }[keyof T];   // number | string  ← V1 과 똑같음
```

매핑이 **의미를 갖는 건 값 자리에서 "키 `K`를 참조하거나 값을 변환"할 때뿐**이다:

```ts
type V3 = { [K in keyof T]: K }[keyof T];                    // 'a' | 'b'   ← 값자리에 키
type V4 = { [K in keyof T]: `${K & string}?` }[keyof T];     // 'a?' | 'b?' ← 키를 변환
```

`T[keyof T]`는 값만 주고 "그 값이 **어느 키**에서 왔는지"를 잃는다. 키를 경로에 붙이려면(`user.name`) 반드시 매핑이 필요하다.

### 조각 D — 조건부 타입 + `infer` : "더 파고들까, 여기서 끝낼까"

```ts
type IsObject<V> = V extends object ? 'GO_DEEPER' : 'LEAF';
```

`A extends B ? X : Y` — B에 맞으면 X, 아니면 Y. `infer`는 패턴 안에서 부분을 추출한다. i18next가 keyPrefix를 벗겨낼 때 이걸 쓴다(실측 코드):

```ts
Keys extends `${KPrefix}${Sep}${infer Key}` ? Key : never
//            'settings.theme' 에서 'theme' 만 infer 로 뽑음
```

### 조각 E — 템플릿 리터럴 : 경로 잇기

```ts
type Path = `${'user'}.${'name'}`;   // → 'user.name'
```

### 조립 — `FlattenKeys` (재귀) + 실전 함정

다섯 조각을 합치면 중첩 객체를 점 표기 키 union으로 펴는 타입이 된다.

```ts
// ⚠️ 이 "순진한" 버전은 실제로는 컴파일 에러(TS2589)가 난다
type FlattenKeys<T> = {
  [K in keyof T]: T[K] extends object
    ? `${K & string}.${FlattenKeys<T[K]> & string}`   // 재귀 + 템플릿
    : `${K & string}`;
}[keyof T];
```

여기가 블로그 예제로 자주 보이지만 **함정**이다. 위 버전을 `tsc`에 돌리면 `TS2589: Type instantiation is excessively deep and possibly infinite`가 난다. TypeScript가 재귀의 종료를 정적으로 확신하지 못해서다. **바깥에 `T extends object ?` 가드를 하나 씌워야** 컴파일러가 종료를 인식한다:

```ts
type FlattenKeys<T> = T extends object          // ← 이 가드가 있어야 TS2589 안 남
  ? {
      [K in keyof T]: T[K] extends object
        ? `${K & string}.${FlattenKeys<T[K]> & string}`
        : `${K & string}`;
    }[keyof T]
  : never;

type R = FlattenKeys<{ user: { name: string; addr: { city: string } }; close: string }>;
// → 'user.name' | 'user.addr.city' | 'close'   (tsc 확인)
```

손으로 한 스텝씩 따라가면:

```
FlattenKeys<{ user: { name: string; addr: {city:string} }; close: string }>

 K='user': 값이 객체 → `user.${ FlattenKeys<{name; addr}> }`
              ├ K='name': string(끝) → 'name'          ⇒ 'user.name'
              └ K='addr': 객체 → `addr.${ FlattenKeys<{city}> }`
                             └ K='city': string(끝) → 'city'  ⇒ 'user.addr.city'
 K='close': string(끝) → 'close'

[keyof T] 로 값 union 추출 ⇒ 'user.name' | 'user.addr.city' | 'close'
```

재귀는 leaf(string)에서 멈추므로 무한 루프가 안 된다.

![FlattenKeys 평가 트레이스 — 중첩 객체 user, name, addr, city, close 가 재귀적으로 펴지는 과정. 값이 객체면 점 표기로 파고들고 문자열이면 키 이름에서 멈춘다. 마지막에 값들을 union 으로 추출해 user.name, user.addr.city, close 세 키가 나온다](/blog/i18n-json-to-type/flatten-trace.svg)

### i18next 실제 코드와의 대응

방금 만든 조각들이 i18next 타입 정의(공개 npm 패키지)에 그대로 있다.

```ts
// [E · 경로 잇기] 중첩 키를 . 으로 조립
type JoinKeys<K1, K2> = `${K1 & string}${Sep}${K2 & string}`;

// [E · ns 붙이기] 네임스페이스를 : 로 조립
type AppendNamespace<Ns, Keys> = `${Ns & string}:${Keys & string}`;

// [D · 조건부 + infer] keyPrefix 를 벗겨 나머지 키만 추출
type ParseByPrefix<Keys, KPrefix> =
  Keys extends `${KPrefix}${Sep}${infer Key}` ? Key : never;

// [A+B+C+D+E · 재귀] 위를 조합해 전체 키 union 생성 → ParseKeys<...>
```

**우리는 이걸 안 짠다.** Step 1의 `Resources`만 넘기면 i18next의 `ParseKeys`가 이 트레이스를 자동으로 돌려 전체 키 union을 만든다.

## 4. Step 3 — `CustomTypeOptions` 선언 병합으로 꽂기

그럼 `Resources`를 어디에 넘기나? i18next는 `CustomTypeOptions`라는 인터페이스를 **비어 있는 채로** 내보낸다(실측):

```ts
// i18next 내부
export interface CustomTypeOptions {}   // ← 사용자가 채우라고 비워둔 구멍
```

여기에 **선언 병합(declaration merging)** — 같은 인터페이스를 다시 선언하면 TypeScript가 합쳐주는 기본 동작 — 을 쓴다. 단, 다른 모듈의 인터페이스라 **모듈 augmentation** 형태로 감싸야 한다:

```ts
import type en from './en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof en;
  }
}
```

이 순간 i18next의 `ParseKeys`가 우리 `en` 구조를 재료로 전체 키 union을 만들고, `t`의 파라미터가 그걸로 좁혀진다.

![선언 병합 — i18next 가 export 한 빈 interface CustomTypeOptions {} 와, 우리가 declare module 'i18next' 안에 선언한 같은 이름 interface(resources: typeof en)가 TypeScript 에 의해 하나로 합쳐진다. 그 결과 t 의 key 파라미터가 유효 키 union 으로 좁혀진다](/blog/i18n-json-to-type/declaration-merge.svg)

> ⚠️ 주의 두 가지. (1) 전역에 그냥 `interface CustomTypeOptions {}`를 쓰면 i18next의 것과 **안 합쳐진다** — 반드시 `declare module 'i18next'`로 감싸야 한다. (2) 이 선언은 **ambient(전역)** 라 import 없이 프로그램 전체에 적용된다. 편리하지만, 이게 어디까지 전파되는지·barrel로 export하면 왜 다른 앱까지 오염되는지는 **모듈 augmentation의 평가 방식**을 알아야 안전하게 다룰 수 있다 — 이 주제는 별도 글(#4)에서 판다.

## 5. Step 4·5 — 네임스페이스·구분자, 그리고 런타임 병합

키가 여러 파일(네임스페이스)로 나뉘어 있으면 `settings:theme`처럼 `ns:key` 형태를 쓴다. 기본값과 다르면 구분자와 기본 네임스페이스도 함께 선언하면 된다(i18next 기본은 `keySeparator: '.'`, `nsSeparator: ':'`):

```ts
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: Resources;
    keySeparator: '.';
    nsSeparator: ':';
  }
}
```

한 가지 더. 런타임에 리소스를 **합쳐서** 쓰는 경우(예: 공통 번들을 특정 네임스페이스에 병합)엔 타입이 그걸 자동으로 못 본다. `Omit` + intersection으로 손수 반영한다:

```ts
type Resources = Omit<typeof en, 'settings'> & {
  settings: typeof en.settings & typeof sharedEn;   // 런타임 병합 반영
};
```

## 6. 최종 형태 (이게 전부)

```ts
import type en from './en.json';
import type sharedEn from './shared.json';

type Resources = Omit<typeof en, 'settings'> & {
  settings: typeof en.settings & typeof sharedEn;
};

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: Resources;
    keySeparator: '.';
    nsSeparator: ':';
  }
}
```

약 10줄. 나머지(수백 개 키의 union, 중첩 평탄화, ns 조립)는 i18next 타입이 자동으로 처리한다.

## 7. "도구 없이"의 실체

이런 걸 코드 생성기(코드를 훑어 `.d.ts`를 뽑아주는 도구)로 하기도 한다. 하지만 그런 도구의 핵심은 **코드를 AST로 파싱해 키를 추출하는 것**이고, 그 추출기는 보통 수천 줄 규모다.

**타입 경로는 그 추출을 통째로 우회한다.** JSON을 `typeof`로 타입화하고, 코드의 `t()` 인자를 그 타입에 대조하는 일은 **`tsc`가 이미 무료로** 해준다. 게다가 JSON이 곧 타입이라 **키가 바뀌면 자동 최신화**된다(생성물 재생성 없음). 우리가 쓴 건 `typeof import` + `Omit`/`&` + `declare module` — 전부 순수 TypeScript 기본기다. (빌드 시간 증가는 실측상 한 자릿수 %대로, 타입은 런타임에 소거되니 앱 성능엔 영향이 없다 — 1편의 결론 그대로.)

## 정리 — 그리고 다음 글

- **Step 1**: `resolveJsonModule` + `typeof import`로 JSON을 타입화. 키는 정확, 값은 넓게(완전성은 별도 스크립트).
- **Step 2**: 중첩 평탄화·ns 조립은 i18next가 `keyof`·인덱스 접근·조건부 타입·템플릿 리터럴·재귀로 처리한다. 우리는 재료만 넘긴다. (재귀 타입엔 `T extends object ?` 가드가 필요하다는 실전 함정도 봤다.)
- **Step 3~5**: `declare module`로 `CustomTypeOptions`에 선언 병합. ns/구분자·런타임 병합은 옵션.

다음 글에서는 남은 두 조각을 판다. (1) **동적 키**(`t(변수)`)가 왜 타입을 "과하게 막고", union/enum으로 어떻게 안전하게 좁히는가. (2) **모듈 augmentation**이 빌드 시 어떻게 평가되고, 어디까지 전파되며, barrel export가 왜 다른 앱까지 타입을 오염시키는가.
