---
title: "Pre-Project DAY3"
pubDate: 2023-04-13
description: "요구사항 정의서 완성본은 아래 링크에서 확인할 수 있다. https://www.notion.so/6c4ccc302ffb4c4ca3f6fc33a8588fc0?v=1df103092c344c07b92d77cd8e15fc58"
tags: ["팀 프로젝트"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/f8340209-c2a8-4b9a-a582-0153eb540740/image.png"
---

## 📌 프리프로젝트 3일차
3일차에는 BE와 사용자 요구사항 정의서에 대해 회의를 진행했다.
FE는 초기 설정을 진행했다.

## 📌 회의 내용

### 📝 사용자 요구사항 정의서

> 요구사항 정의서 완성본은 아래 링크에서 확인할 수 있다.
https://www.notion.so/6c4ccc302ffb4c4ca3f6fc33a8588fc0?v=1df103092c344c07b92d77cd8e15fc58

## 📌 FE 개발 초기 설정

프로젝트 개발 전 팀원들끼리 초기 설정을 맞춰야 하기 때문에 팀장인 내가 설정을 완료하고 그 내역을 각자 `pull`하는 방식으로 진행했다.

### 📝 라이브러리 설치
이전에 말해놓은 라이브러리를 모두 설치했다.

### 📝 lint 설정
`eslint`와 `prettier`를 초기 설정을 맞춰야 추후에 각자 개발하고 커밋했을 때 코드가 달라 문제가 생기는 일을 방지할 수 있다고 생각해 설정을 진행했다. 초기에는 기본 설정으로 진행해보려고 했지만, 문제가 생겼다.

```shell
npm install -D eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-prettier eslint-config-prettier
```
위 라이브러리를 설치하고, 

``` js
// .eslintrc.json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:import/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:prettier/recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "react/react-in-jsx-scope": 0,
    "react/jsx-uses-react": 0
  }
}
```
eslint 파일 설정을 위와 같이 했다.

prettier 파일 설정은 아래와 같다.

```js
{
  "singleQuote": false
}
```

위 방식은 리액트 컴포넌트의 확장자가 `.js`일 때는 문제가 없다. 하지만, 우리는 확장자를 `.jsx`로 맞추기로 했기 때문에 설정을 바꿨다. 이때 문제가 발생해서 그냥 airbnb 로 설정했다. 아래는 최종 설정 파일이다.

```shell
#npm
npm install eslint@^7.2.0 eslint-plugin-import@^2.22.1 eslint-plugin-jsx-a11y@^6.4.1 eslint-plugin-react@^7.21.5 eslint-plugin-react-hooks@^4 eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb prettier --save-dev

#yarn
yarn add eslint@^7.2.0 eslint-plugin-import@^2.22.1 eslint-plugin-jsx-a11y@^6.4.1 eslint-plugin-react@^7.21.5 eslint-plugin-react-hooks@^4 eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb prettier --dev
```

```js
// .eslintrc.json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "airbnb",
    "airbnb/hooks",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:prettier/recommended",
    "plugin:eslint/recommended",
    "prettier"
  ],
  "rules": {
    "react/prop-types": 0,
    "no-extra-semi": "error", // 확장자로 js와 jsx 둘다 허용하도록 수정
    "react/jsx-filename-extension": [1, { "extensions": ["js", "jsx"] }], // 화살표 함수의 파라미터가 하나일때 괄호 생략
    "arrow-parens": ["warn", "as-needed"], // 사용하지 않는 변수가 있을때 빌드에러가 나던 규칙 해제
    "no-unused-vars": ["off"], // 콘솔을 쓰면 에러가 나던 규칙 해제
    "no-console": ["off"], // export const 문을 쓸때 에러를 내는 규칙 해제
    "import/prefer-default-export": ["off"], // hooks의 의존성배열이 충분하지 않을때 강제로 의존성을 추가하는 규칙을 완화
    "react-hooks/exhaustive-deps": ["warn"], // props spreading을 허용하지 않는 규칙 해제
    "react/jsx-props-no-spreading": [1, { "custom": "ignore" }]
  }
}
```
prettier 설정도 추가했다.
```js
{
  "singleQuote": false,
  "semi": true,
  "useTabs": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 120,
  "arrowParens": "avoid"
}
```
이후 팀원들이 오류가 나지 않는 것을 확인한 후 각자 PR을 날려 테스트를 하고 모두 문제가 없는 것을 확인했다.

### 추가 오류 발생

이전에 개발한 Todo-list에도 eslint 설정을 적용했는데 빌드 시 오류가 났다.
> Failed to load plugin 'eslint' declared in '.eslintrc.json': Cannot find module 'eslint-plugin-eslint' 

위 오류였는데 `eslint-plugin-eslint`를 못 찾아서 안되길래 설치를 하려보니까 npm에 없는 것 같았다. 그래서 여러 방법을 시도하다 eslint 플러그인을 사용하지 않는 방향으로 갔다. 최종적으로 빌드까지 가능하게 만든 설정 파일은 아래와 같다.

```js
{
  "env": {
    "browser": true,
    "es2021": true
  },

  "extends": ["airbnb", "airbnb/hooks", "plugin:import/errors", "plugin:import/warnings", "prettier"],
  "rules": {
    "react/prop-types": 0,
    "no-extra-semi": "error", // 확장자로 js와 jsx 둘다 허용하도록 수정
    "react/react-in-jsx-scope": "off",
    "react/jsx-filename-extension": [1, { "extensions": ["js", "jsx"] }], // 화살표 함수의 파라미터가 하나일때 괄호 생략
    "arrow-parens": ["warn", "as-needed"], // 사용하지 않는 변수가 있을때 빌드에러가 나던 규칙 해제
    "no-unused-vars": ["off"], // 콘솔을 쓰면 에러가 나던 규칙 해제
    "no-console": ["off"], // export const 문을 쓸때 에러를 내는 규칙 해제
    "import/prefer-default-export": ["off"], // hooks의 의존성배열이 충분하지 않을때 강제로 의존성을 추가하는 규칙을 완화
    "react-hooks/exhaustive-deps": ["warn"], // props spreading을 허용하지 않는 규칙 해제
    "react/jsx-props-no-spreading": [1, { "custom": "ignore" }],
    "jsx-a11y/click-events-have-key-events": "off", // click 이벤트가 있으면 키보드 이벤트가 반드시 있어야 하는 규칙 해제
    "jsx-a11y/no-static-element-interactions": "off", // 인터렉티브한 태그가 아닌데 인터렉티브 이벤트가 있으면 안되는 규칙 해제
    "react/no-array-index-key": "off" // key로 index를 주면 안되는 규칙 해제
  }
}

```

## 📌 PR 방법

각 팀원이 개발 후 PR을 날릴 때 방식이 좀 복잡해서 정리한다.

### 📝 작업을 자신의 원격 레포에 push

```shell
$git pull origin dev
$git branch feat/test
$git checkout feat/test # 작업용 브랜치

$git add .
$git commit -m 'feat: 테스트'
$git push origin feat/test

# PR을 날린다. -> feat/test에? : 그 이후에 dev에는 어떻게 합치냐 // 서로 코드를 보고 dev에 합친다.
```

### 📝 git push 이후
>
- 자신의 원격 리포지토리에서 crowwan/dev 로 PR을 날린다.
- PR이 병합된 이후 pull request 탭에 들어가서 자신의 PR에 들어가면 자신의 원격 리포지토리에 있는 `feat/test` 브랜치를 지울 수 있다.
- 이후 원격 리포지토리에서 dev 브랜치로 이동 후 sync를 맞추고
- 로컬에서 pull 한다.

## 📍 참고
eslint / prettier 설정 : https://any-ting.tistory.com/94
