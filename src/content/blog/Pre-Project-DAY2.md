---
title: "Pre-Project DAY2"
pubDate: 2023-04-12
description: "할 것들? - 트렐로 - 슬랙? - 깃 플로우 정하기 - 컨벤션 정하기 (코드, 커밋) - 피그마 어떻게 할지"
tags: ["팀 프로젝트"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/d900da4d-9c3e-4093-965f-0b2f1a0d43f5/image.png"
---

## ❗️프리 프로젝트 팀장
코드스테이츠 프리 프로젝트를 시작했다. (2023/04/11)
프리프로젝트 팀장을 하게 되면서 프로젝트 준비를 처음으로 해보게 되었다.

## 📄 협의 할 것(예상)
팀장이 되고 나서 협의할 것들을 나름 생가했다.
> 
처음 백앤드와 맞춰볼 것
- 페이지를 어떻게 나눌지
- ajax요청은 어떤 걸 할지(api)
- 배포는 어떤 식으로 할 지

> 할 것들?
- 트렐로
- 슬랙?
- 깃 플로우 정하기
- 컨벤션 정하기 (코드, 커밋)
- 피그마 어떻게 할지

## ✏️ 팀원 협의 사항

### 1일차

> 회의 내용
- 칸반 : 프론트 / 백 칸반을 나눠서 할까? 
	- 현재 프론트 칸반은 트렐로를 이용 중
- 깃 브랜치 작업
	- 최상위 레포지토리에서 BE / FE 브랜치를 나누고 각 파트별 진행
- 깃 플로우
	- FE -> dev -> feat/{features} 형식으로 진행할 예정
    
### 2일차
 > 회의 내용
 - 트렐로 인원 추가 및 사용법 공유
 - 코드 컨벤션 / 커밋 컨벤션 정하기
 - 깃 플로우 확인
 - 초기 세팅 전 협의 (사용 라이브러리 결정)
 - 기본적으로 제작할 페이지 상의(5개로 결정)
 

---
## 🖥️ 코드 컨벤션

 > **문자열을 처리할 때는 백틱(`)용 하용도록 합니다.**



> **문장이 종료될 때는 세미콜론을 붙여줍니다.**


> 🐫 **함수명, 변수명은 카멜케이스로 작성합니다. 
(ex. rocket launch Duration→ rocketLunchDuration)**

> 😃 **들여쓰기는 공백 2칸으로 한다.**

> ☝ **가독성을 위해 한 줄에 하나의 문장만 작성합니다.**

> **주석은 설명하려는 구문에 맞춰 들여쓰기 합니다.**
  ```jsx
  // Good
  function someFunction() {
    ...
    // statement에 관한 주석
    statements
  }
  ```

> **연산자 사이에는 공백을 추가하여 가독성을 높입니다.**
```jsx
a+b+c+d // bad
a + b + c + d // good
```

> ☝ **콤마 다음에 값이 올 경우 공백을 추가하여 가독성을 높입니다.**
```jsx
var arr = [1,2,3,4]; //bad
var arr = [1, 2, 3, 4]; //good
```

> 🔠 생성자 함수명, 컴포넌트명의 맨 앞글자는 대문자로 합니다.
```jsx
function Person(){}
```

## 📕 사용 라이브러리

🤔 style : styled-components

🤔 전역 상태 관리 : Redux toolkit

🤔 데이터 패칭 : axios

🤔 프록시 : http-proxy-middleware ( 추후 결정 해도 괜찮을 듯 )

🤔  주소이동 : react-router-dom

🤔  아이콘 : react-icons

🤔 mocking : json-server (devDep)


## 📝 git push 방법
``` bash
$git pull origin dev
$git branch feat/test
$git checkout feat/test # 작업용 브랜치

$git add .
$git commit -m 'feat: 테스트' 
$git push origin feat/test

# PR을 날린다. -> feat/test에? : 그 이후에 dev에는 어떻게 합치냐 // 서로 코드를 보고 dev에 합친다.
```

```bash
# PR 충돌 시 로컬에서 할 것
$git checkout dev
$git pull origin dev
$git checkout feat/test
$git merge dev # 변경사항 반영 여부 결정

$git add .
$git commit -m 'feat: 메시지'
$git push origin feat/test

# 진행

# 원격 레포지토리에서 삭제한 브랜치 로컬에 반영하는 방법
$git branch -a # 원격에서 삭제한 브랜치가 로컬에선 보일 수 있음
$git fetch --prune # 삭제된 브랜치가 로컬에서도 안보이게 반영됨
```

## 💻 커밋 컨벤션
### 1. 커밋 유형 지정

- 커밋 유형은 영어 대문자로 작성하기
    
    
    | 커밋 유형 | 의미 |
    | --- | --- |
    | Feat | 새로운 기능 추가 |
    | Fix | 버그 수정 |
    | Docs | 문서 수정 |
    | Style | 코드 formatting, 세미콜론 누락, 코드 자체의 변경이 없는 경우 |
    | Refactor | 코드 리팩토링 |
    | Test | 테스트 코드, 리팩토링 테스트 코드 추가 |
    | Chore | 패키지 매니저 수정, 그 외 기타 수정 ex) .gitignore |
    | Design | CSS 등 사용자 UI 디자인 변경 |
    | Comment | 필요한 주석 추가 및 변경 |
    | Rename | 파일 또는 폴더 명을 수정하거나 옮기는 작업만인 경우 |
    | Remove | 파일을 삭제하는 작업만 수행한 경우 |
    | !BREAKING CHANGE | 커다란 API 변경의 경우 |
    | !HOTFIX | 급하게 치명적인 버그를 고쳐야 하는 경우 |
    | Setting | 기본 세팅 변경의 경우 |

### 2. 제목과 본문을 빈행으로 분리

- 커밋 유형 이후 제목과 본문은 한글로 작성하여 내용이 잘 전달될 수 있도록 할 것
- 본문에는 변경한 내용과 이유 설명 (어떻게보다는 무엇 & 왜를 설명)

### 3. 제목 첫 글자는 대문자로, 끝에는 `.` 금지

### 4. 제목은 영문 기준 50자 이내로 할 것

### 5. 자신의 코드가 직관적으로 바로 파악할 수 있다고 생각하지 말자

### 6. 여러가지 항목이 있다면 글머리 기호를 통해 가독성 높이기

```
- 변경 내용 1
- 변경 내용 2
- 변경 내용 3
```
