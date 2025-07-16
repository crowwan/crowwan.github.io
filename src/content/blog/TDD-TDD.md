---
title: "TDD? TDD!"
pubDate: 2025-07-16
description: "“가능한 모든 유효하지 않은 상태를 타입으로 표현 불가능하게 만든다면?” 이 질문에서 타입 주도 개발(Type-Driven Development)은 시작됩니다."
tags: ["React", "typescript"]
---

## 🎯 타입으로 설계하기: 타입스크립트로 배우는 타입 주도 개발

> “가능한 모든 유효하지 않은 상태를 타입으로 표현 불가능하게 만든다면?”
이 질문에서 타입 주도 개발(Type-Driven Development)은 시작됩니다.

함수형 언어인 F# 커뮤니티에서 제시한 Designing with Types 철학은, 복잡한 시스템에서도 타입 시스템만으로 많은 버그를 미연에 방지할 수 있음을 보여줍니다.
이 글에서는 해당 철학을 타입스크립트 기반으로 재해석하고, 실용적인 코드 예제와 함께 설명해보려 합니다.

---

## 🧱 원칙: 유효하지 않은 상태는 표현되지 않도록!

대부분의 버그는 “불가능한 상태”가 시스템에 들어왔을 때 발생합니다.
예를 들어 이런 코드를 봅시다:

```ts
type Order = {
  orderId: string;
  status: 'Draft' | 'Submitted';
  submittedAt?: Date;
};

```
이 타입은 이런 객체도 허용합니다:
```ts
const order: Order = {
  orderId: 'O-123',
  status: 'Draft',
  submittedAt: new Date(), // ❌ Draft인데 submittedAt이 있음?
};
```

▶ 타입 시스템은 허용했지만, 도메인에서는 불가능한 상태죠.
이런 경우는 런타임에서만 잡히며, 테스트하지 않으면 그대로 운영에 올라갈 수 있습니다.



### ✅ 해결: 의미 있는 상태로 분리하자

```ts
type DraftOrder = {
  type: 'Draft';
  orderId: string;
};

type SubmittedOrder = {
  type: 'Submitted';
  orderId: string;
  submittedAt: Date;
};

type Order = DraftOrder | SubmittedOrder;
```

이제 이런 오류는 컴파일 타임에 잡힙니다:

```ts
const order: Order = {
  type: 'Draft',
  orderId: 'O-123',
  submittedAt: new Date(), // ❌ 오류! Draft에 submittedAt 없음
};
```

### ❓ 그런데 Order 유니언 타입은 언제 써야 할까?

DraftOrder와 SubmittedOrder를 따로 나눴는데, 그럼 Order = Draft | Submitted 타입은 어떤 용도일까요?

#### 👉 그 자체로 의미가 있습니다.
- Order는 **“어떤 상태든 올 수 있는 전체 집합”**을 나타냅니다.
- 즉, 특정 시점에 주문이 Draft일 수도 Submitted일 수도 있다면, 그 둘을 아우르는 추상 타입이 필요합니다.

예를 들어, 리스트 화면에서는 어떤 주문이든 상태와 상관없이 보여줘야 한다면:

```ts
function renderOrder(order: Order) {
  switch (order.type) {
    case 'Draft':
      return `임시 저장됨: ${order.orderId}`;
    case 'Submitted':
      return `제출 완료: ${order.orderId} at ${order.submittedAt.toISOString()}`;
  }
}

```
#### 📌 요약하자면:
>- DraftOrder / SubmittedOrder: 상태에 따라 분리된 구체 타입 (구현, 유효성 검증, 전이 함수 등에서 사용)
- Order: 상태와 상관없이 모든 주문을 다뤄야 할 때 사용하는 추상 타입 (UI, 목록, 조회, 정책 판단 등에서 사용)

---

### 🧬 상태 전이도 타입으로 설계하자

단지 상태를 정의하는 것뿐 아니라, 어떤 상태에서 어떤 상태로만 전이 가능한지도 타입으로 제한할 수 있습니다.
```ts
function submit(order: DraftOrder): SubmittedOrder {
  return {
    type: 'Submitted',
    orderId: order.orderId,
    submittedAt: new Date(),
  };
}

```
▶ 이 함수는 DraftOrder만 받을 수 있으며,
SubmittedOrder는 항상 이 함수를 통해서만 생성된다는 것을 타입으로 보장합니다.

---

### 📧 입력값 유효성도 타입으로 분리하자

```ts
type RawEmail = string;

type Email = {
  type: 'Email';
  value: string;
};

function parseEmail(input: RawEmail): Email | Error {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input)
    ? { type: 'Email', value: input }
    : new Error('Invalid email');
}
```

이제 유효한 이메일만 Email 타입을 가지며,
그 외는 런타임에서 안전하게 분기 처리할 수 있습니다.

---

### ✨ 타입 주도 개발의 이점

|항목|	전통적설계|	타입 주도 설계
|-|-|-|
|상태 모델링	|하나의 타입에서 모든 상태 표현|	각 상태를 분리된 타입으로 표현
|전이 검증|	런타임 조건문|	타입으로 안전하게 전이 제한
|에러 처리|	boolean이나 예외|	Result, Either, Discriminated Union으로 명시적 처리
|IDE 지원|	약함|	강력한 자동완성, 리팩토링, 타입 추론 가능
|문서화|	주석 기반|	타입 자체가 도메인 문서 역할


---

📚 참고

원문: https://fsharpforfunandprofit.com/posts/designing-with-types-single-case-dus/
