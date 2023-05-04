---
title: "타입 스크립트 eslint 적용하기"
pubDate: 2023-05-04
description: "eslint-plugin-react@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest √ Would you like to install them now? · No / Yes √..."
tags: ["팀 프로젝트"]
---

## 타입스크립트 eslint 적용하기
### default config 지우기
package.json 에서 아래에 해당하는 부분을 지운다. CRA로 프로젝트를 생성하면 기본적으로 설정이 되는 것이다.
``` js
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
```

### .eslintrc.json
```shell
npx eslint --init
```
위 명령어를 통해 eslint 설정을 시작한다.
``` shell
√ How would you like to use ESLint? · problems
√ What type of modules does your project use? · esm
√ Which framework does your project use? · react
√ Does your project use TypeScript? · No / Yes
√ Where does your code run? · browser
√ What format do you want your config file to be in? · JSON
The config that you've selected requires the following dependencies:

eslint-plugin-react@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest
√ Would you like to install them now? · No / Yes
√ Which package manager do you want to use? · npm
Installing eslint-plugin-react@latest, @typescript-eslint/eslint-plugin@latest, @typescript-eslint/parser@latest
```
위와 같이 설정을 했다. 이후 생성된 .eslintrc.json 파일을 아래처럼 바꾼다.

```js
{
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
      "react",
      "react-hooks",
      "@typescript-eslint",
      "prettier"	
    ],
    "rules": {
      "react/react-in-jsx-scope": "off",
      "spaced-comment": "error",
      "quotes": ["error", "single"],
      "no-duplicate-imports": "error"
      },
    "settings": { 
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx", ".js"] 
      }, 
      "import/resolver": { 
        "typescript": "./tsconfig.json" 
      }
    }
  
}
```

### .prettierrc.json

```js
{
    "semi": true, // 세미콜론(;) 사용 여부
    "tabWidth": 2, // 탭 너비
    "printWidth": 80, // 자동 줄 바꿈이 되는 길이
    "singleQuote": true, // 싱클 쿼테이션('') 적용 여부
    "trailingComma": "none", // 여러줄일때 후행 콤마 방식
    "jsxSingleQuote": true, // JSX에 싱글 퀘테이션 사용 여부
}
```

자동 포메팅
```js
{
    "[typescript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "editor.formatOnSave": true // format on save에 체크되어 있으면 자동으로 추가 되는 키값
}
```

### tsconfig.json 
```js
{
 "compilerOptions": {

  "target": "es5", // 'es3', 'es5', 'es2015', 'es2016', 'es2017','es2018', 'esnext' 가능
  "module": "commonjs", //무슨 import 문법 쓸건지 'commonjs', 'amd', 'es2015', 'esnext'
  "allowJs": true, // js 파일들 ts에서 import해서 쓸 수 있는지 
  "checkJs": true, // 일반 js 파일에서도 에러체크 여부 
  "jsx": "preserve", // tsx 파일을 jsx로 어떻게 컴파일할 것인지 'preserve', 'react-native', 'react'
  "declaration": true, //컴파일시 .d.ts 파일도 자동으로 함께생성 (현재쓰는 모든 타입이 정의된 파일)
  "outFile": "./", //모든 ts파일을 js파일 하나로 컴파일해줌 (module이 none, amd, system일 때만 가능)
  "outDir": "./", //js파일 아웃풋 경로바꾸기
  "rootDir": "./", //루트경로 바꾸기 (js 파일 아웃풋 경로에 영향줌)
  "removeComments": true, //컴파일시 주석제거 

  "strict": true, //strict 관련, noimplicit 어쩌구 관련 모드 전부 켜기
  "noImplicitAny": true, //any타입 금지 여부
  "strictNullChecks": true, //null, undefined 타입에 이상한 짓 할시 에러내기 
  "strictFunctionTypes": true, //함수파라미터 타입체크 강하게 
  "strictPropertyInitialization": true, //class constructor 작성시 타입체크 강하게
  "noImplicitThis": true, //this 키워드가 any 타입일 경우 에러내기
  "alwaysStrict": true, //자바스크립트 "use strict" 모드 켜기

  "noUnusedLocals": true, //쓰지않는 지역변수 있으면 에러내기
  "noUnusedParameters": true, //쓰지않는 파라미터 있으면 에러내기
  "noImplicitReturns": true, //함수에서 return 빼먹으면 에러내기 
  "noFallthroughCasesInSwitch": true, //switch문 이상하면 에러내기 
 }
}
```


## 참고
https://yelee.tistory.com/57
https://velog.io/@he0_077/React-Typescript-eslint-prettier-%EC%84%A4%EC%A0%95
