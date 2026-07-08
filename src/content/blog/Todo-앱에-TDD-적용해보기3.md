---
title: "Todo 앱에 TDD 적용해보기(3)"
series: "Todo 앱에 TDD 적용해보기"
seriesOrder: 3
pubDate: 2025-08-20
description: "먼저 Todo 앱에서 사용될 기본적인 Todo 엔티티를 생성해보자."
tags: ["React", "TDD", "typescript"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/cb8d1ca1-ceaa-427c-b838-bfb4503ba5a7/image.png"
---

## 📄 Todo entity

먼저 Todo 앱에서 사용될 기본적인 Todo 엔티티를 생성해보자.

```text
entities
 ┗ Todo
 ┃ ┣ index.ts // 기본적으로 외부에서 접근 가능한 것들은 이 파일에서 export 해야한다.
 ┃ ┗ model.ts

```

Todo 라는 데이터의 모델을 만들어 볼 생각이다.

---

## ❗️Branded type
간단하게 Todo 타입을 선언해보자면 이렇게 할 수 있을 것이다.

```ts
export type Todo = {
  id: string;
  text: string; // 사용자 표시 텍스트 (최대 50자)
  completed: boolean;
  createdAt: string; // ISO 날짜 문자열
};
```
이제 Todo의 text에 대한 비지니스 로직을 작성해보자. (명칭은 조금 변경하는 게 좋을 것 같아. 너무 일반적이면 나중에 문제가 생기는 경우가 좀 있었다.) 

어떤 게 Todo에 대한 비지니스 규칙이 일까?

![](https://velog.velcdn.com/images/crowwan/post/cb8d1ca1-ceaa-427c-b838-bfb4503ba5a7/image.png)

이 내용이 비지니스 규칙이라고 할 수 있다. 단순 UI에서 한 줄로 보이기 위해서나 기술적 한계로 인한 내용이 아닌, `NF-3: 사용자 경험(UX)은 단순하고 직관적이어야 하며, 감정적 부담 없이 빠르게 메모하듯이 입력할 수 있어야 한다.` 라는 요구사항에 맞게 비지니스 핵심 로직을 담고 있다고 볼 수 있다.

그럼 이 내용을 담은 함수 타입을 만들어보자.

```ts
// Todo/model.ts
export type Todo = {
  id: string;
  text: string; // 사용자 표시 텍스트 (최대 50자)
  completed: boolean;
  createdAt: string; // ISO 날짜 문자열
};

type isValidTodoText = (text: string) => boolean;
```

이렇게 만들게 되면서 `isValidTodoText`는 Todo라는 도메인에서 사용되는 함수가 된다.

여기서 중요하다고 생각하는 것은 `Todo라는 도메인에서` 다. 내가 만든 함수의 경우 목적은 Todo text가 50자를 넘는지 확인하기 위해서 유효성 검사를 하는 목적이지만, 사실 string을 받고 boolean을 리턴하는 함수이기 때문에 Todo text가 아닌 다른 문자열이 이 함수의 인자로 들어오는 것도 가능하다. 

즉, 함수가 호출되는 시점에서(런타임에서) 에러가 발생하는 경우가 생길 수 있다. 도메인에 맞게 호출되어야 하는 함수이지만, 예상치 못한 같은 타입의 다른 도메인 데이터가 들어갈 수 있는 것이 문제다.

이런 문제를 컴파일 단계에서 잡을 수 있으면 정말 좋을 것 같다. 이유는 항상 명확하게 보장된 함수 인자 타입을 받을 수 있다는 것이고, 이로 인해 런타임에서 다른 타입에 데이터를 받아 사용하여 발생할 수 있는 문제를 피할 수 있다.

그럼 어떻게 타입을 선언하면 될까?

```ts
// Todo/model.ts
type TodoText = string;
```

단순히 이렇게만 하면 될 것 같지만, 실제로 컴파일 에러가 나는지 확인해보면 아무 string 타입만 넘겨줘도 문제없이 돌아갈 것이다. 이걸 해결할 방법은 아래와 같이 Branded 타입을 사용하는 것이다.

```ts 
//shared/types/branded.ts
export type Branded<T, B> = T & { __brand: B };


// Todo/model.ts
type TodoId = Branded<string, 'TodoId'>;
type TodoText = Branded<string, 'TodoText'>;
```
이렇게 선언하게 되면, 단순 string을 `isValidTodoText`함수에 넣었을 때 컴파일 에러가 발생한다.

코드를 마저 구현해보고 보여주겠다.

``` ts
// Todo/model.ts
import { Branded } from '@shared/types/branded';

type TodoId = Branded<string, 'TodoId'>;
type TodoText = Branded<string, 'TodoText'>;

export type Todo = {
  id: TodoId;
  text: TodoText; // 사용자 표시 텍스트 (최대 50자)
  completed: boolean;
  createdAt: string; // ISO 날짜 문자열
};

type IsValidTodoText = (text: TodoText) => boolean;

const isValidTodoText: IsValidTodoText = (text) => {
  const MAX_TODO_TEXT_LENGTH = 50;
  return text.length > 0 && text.length <= MAX_TODO_TEXT_LENGTH;
};

```

위와 같이 구현할 수 있을 것이다. 이제 컴파일 에러가 나는지 확인해보자.
![](https://velog.velcdn.com/images/crowwan/post/877fdbc0-d20c-4764-b57b-37c1aa7c1c94/image.png)

그냥 문자열을 넣으려고 하면 에러가 발생한다. 이 컴파일 에러를 해결하려면, type assertion을 사용하거나, 실제 `TodoText` 타입으로 변수를 선언하는 방법밖에 없을 것이다.
