---
title: "Todo 앱에 TDD 적용해보기(2)"
series: "Todo 앱에 TDD 적용해보기"
seriesOrder: 2
pubDate: 2025-07-28
description: "이전에 Todo 앱의 요구사항을 정의하고 간단한 디자인을 만들어봤다. 이제 이 요구사항을 바탕으로 앱을 만들어보자. 이번 포스트에서는 앱 초기 설정을 진행해 볼 것이다."
tags: ["React", "TDD"]
---

이전에 Todo 앱의 요구사항을 정의하고 간단한 디자인을 만들어봤다. 이제 이 요구사항을 바탕으로 앱을 만들어보자. 이번 포스트에서는 앱 초기 설정을 진행해 볼 것이다.

디자인은 수정할 예정이다. 여기서 중요한 건, 디자인을 수정하는 것과 이전에 정의했던 요구사항 중 도메인과 관련된 요구사항은 별개로 디자인 수정이 도메인 요구사항에 영향을 주면 안 된다. 디자인은 도메인 요구사항을 사용자에게 보여주기 위한 도구이기 때문인다.

---
## 💻 앱 초기 설정하기

우선 vite를 이용해서 react 앱을 생성한다.

```bash
npm create vite@latest
```

https://ko.vite.dev/guide/#scaffolding-your-first-vite-project

위 공식 문서를 읽어보면 쉽게 리액트 앱을 만들 수 있다.

다음으로 초기 폴더 구조를 다음과 같은 형태로 만들었다.

```markdown
. 📂 vite-todo
└── 📂 src/
│  ├── 📄 App.css
│  ├── 📄 App.tsx
│  ├── 📄 index.css
│  ├── 📄 main.tsx
│  ├── 📄 vite-env.d.ts
├── 📄 README.md
├── 📄 index.html
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 tsconfig.app.json
├── 📄 tsconfig.json
├── 📄 tsconfig.node.json
└── 📄 vite.config.ts
```

---
## 📁 FSD 구조 적용하기

이번 앱을 만들 때는 FSD 구조를 적용해볼 생각이다. FSD는 기능 기반으로 설계된 프론트엔드 폴더 구조 형태이고, 커스텀이 쉬운 리액트 앱 아키텍처에 기준을 만들어 줄 수 있을 것 같아 적용해 볼 것 이다.

실제로 내가 이번에 앱을 개발하려는 방식과 잘 어울리는 폴더 구조일 것이라고 생각한다.

[자세한 내용은 공식 문서를 확인해보길 바란다](https://feature-sliced.github.io/documentation/)

우선 FSD 구조에 필요한 경로 설정을 해보자.

tsconfig 파일에 다음과 같이 path alias를 설정한다.

```json
"paths": {
  "@app/*": ["src/app/*"],
  "@entities/*": ["src/entities/*"],
  "@features/*": ["src/features/*"],
  "@shared/*": ["src/shared/*"],
  "@pages/*": ["src/pages/*"],
  "@widgets/*": ["src/widgets/*"]
}
```
이제 타입스크립트가 컴파일 시 경로 별칭을 사용하여 컴파일하게 된다.

하지만, 아직 build 및 런타임 시 별칭이 설정되지 않았다. 이는 vite 설정에서 해주면 된다.

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@pages': path.resolve(__dirname, 'src/pages'),
    },
  },
});
```
이제 각 레이어에 맞게 폴더를 생성하고 `App.tsx` 파일을 app폴더 하위로 이동시켜보자.

그랬더니 `main.tsx`에서 이렇게 파일을 불러올 수 있게 되었다.

```tsx
import App from '@app/App'; // path alias에 맞게 파일을 불러온다.
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```
그런데 import 순서가 좀 아쉽다. 그래서 eslint도 수정헀다.

```js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'import'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 0,
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'unknown'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'react-dom/**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'react-router-dom',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@app/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@pages/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@shared/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@widgets/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@features/**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
      },
    ],
  },
};
```

이제 확인해보면,

```tsx
import React from 'react';

import ReactDOM from 'react-dom/client';

import App from '@app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```
나쁘지 않다.

---

## 🤔 다음으로...
이제 다음 포스트에서는 요구사항을 기반으로 도메인 모델링을 해볼 예정이다.
[도메인 모델링에 대한 포스팅이 있으니 참고해보면 좋겠다.](https://velog.io/@crowwan/%ED%94%84%EB%A1%A0%ED%8A%B8%EC%97%94%EB%93%9C%EC%97%90%EC%84%9C-%EB%8F%84%EB%A9%94%EC%9D%B8-%EB%AA%A8%EB%8D%B8%EB%A7%81%EC%9D%B4-%ED%95%84%EC%9A%94%ED%95%9C-%EC%9D%B4%EC%9C%A0)
