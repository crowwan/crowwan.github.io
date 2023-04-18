---
title: "Pre-Project DAY 5,6"
pubDate: 2023-04-18
description: "병합이 완료된 이후, 레이아웃 정리는 팀장이 진행 후 dev브랜치에 올려 다른 팀원들이 최종 결과를 pull했다."
tags: ["팀 프로젝트"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/01602f65-a3e1-447e-a16c-d3a029e2c6bf/image.png"
---

## 📌 프리프로젝트 5일차

### 💻 진행 상황
각 팀원들이 자신에게 할당된 레이아웃 제작 후 병합을 시도했다.
당연히 병합 도중 충돌은 불가피하게 발생할 것을 알고 있었고, 이는 한 명의 PR이 `merge`되면 다른 사람들이 로컬에서 `pull`을 받아 충돌을 해결하고 다시 `push`하는 방식으로 진행했다.

병합이 완료된 이후, 레이아웃 정리는 팀장이 진행 후 `dev`브랜치에 올려 다른 팀원들이 최종 결과를 `pull`했다.

이후 새롭게 자신의 개발 파트를 정해서 수요일까지 진행하는 것으로 결정했다.

![](https://velog.velcdn.com/images/crowwan/post/f94146db-44d5-43bb-a5ad-5d6335192d51/image.png)


## 📌 프리프로젝트 6일차

### 💻 진행 상황
각자 진행한 것들을 확인했고, 어느 정도 디자인이 끝나보여서 일단 병합 후 계속 진행하기로 했다. 현재는 디자인 작업만 우선적으로 할 예정이고 수요일에 페이지가 끝나게 되면 실제 기능을 추가하는 작업은 금요일까지 진행하기로 정했다.

## 🤔 고민했던 부분

진행 도중 고민되는 부분이 생겼는데, 크게 다음과 같다
> 1. 폴더구조
2. 리팩토링
3. 라우팅 처리

### 🗂️ 폴더 구조
폴더 구조는 처음에 내가 이전 투두 리스트를 진행했던 폴더 구조를 기반으로 작업하기로 했다.
``` shell
├── src
│   ├── components # 기본적인 컴포넌트 폴더
│   ├── layouts    # 레이아웃을 담당하는 컴포넌트 폴더
│   ├── styles     # 스타일과 관련된 컴포넌트 폴더 (글로벌 스타일 / 공통으로 사용가능한 스타일 컴포넌트)
│   ├── pages      # 페이지를 담당하는 컴포넌트 폴더
│   ├── data
│   ├── hooks 		
│   ├── app
│   ├── features
│   ├── App.jsx
│   └── index.js
```
위와 같이 폴더 구조를 만드니 많은 컴포넌트가 생겼을 때 해당 컴포넌트가 어디서 사용되는지 구분하기 힘들고 필요한 컴포넌트를 찾기도 어려웠다. 그래서 폴더 구조를 수정해야한다는 생각이 내 머릿속에 가득 찼다. 

팀원들과 협의 후 팀원들도 비슷한 생각을 하고 있었기 때문에 바로 폴더 구조를 다시 잡게 되었다. 의미를 가진 컴포넌트를 하나의 폴더로 만들어 그 안에 사용하는 컴포넌트들을 넣는 방식으로 진행했다. 수정된 상태는 아래와 같다.

```shell
src
 ┣ app
 ┣ components
 ┃ ┣ ui
 ┃ ┃ ┣ Button.jsx
 ┃ ┃ ┣ ButtonMain.jsx
 ┃ ┃ ┣ ButtonSub.jsx
 ┃ ┃ ┣ LogoImg.jsx
 ┃ ┃ ┗ Pagination.jsx
 ┃ ┗ HeaderContentSection.jsx
 ┣ data
 ┃ ┗ routerData.js
 ┣ features
 ┣ hooks
 ┃ ┗ useDropDown.js
 ┣ images
 ┃ ┗ icon1.jpeg
 ┣ layouts
 ┃ ┣ Aside
 ┃ ┃ ┣ Aside.jsx
 ┃ ┃ ┗ TagsBlock.jsx
 ┃ ┣ Footer
 ┃ ┃ ┗ Footer.jsx
 ┃ ┣ Header
 ┃ ┃ ┣ Header.jsx
 ┃ ┃ ┣ HeaderButtonContainer.jsx
 ┃ ┃ ┣ HeaderMenu.jsx
 ┃ ┃ ┣ Logo.jsx
 ┃ ┃ ┣ SearchBar.jsx
 ┃ ┃ ┣ SearchHint.jsx
 ┃ ┃ ┗ SearchHintItem.jsx
 ┃ ┣ Main
 ┃ ┃ ┗ Main.jsx
 ┃ ┗ Nav
 ┃ ┃ ┣ Nav.jsx
 ┃ ┃ ┣ NavMenu.jsx
 ┃ ┃ ┗ NewNavMenu.jsx
 ┣ pages
 ┃ ┣ 404
 ┃ ┃ ┣ Content.jsx
 ┃ ┃ ┣ NotFound.jsx
 ┃ ┃ ┣ NotFoundImage.jsx
 ┃ ┃ ┗ SolutionItem.jsx
 ┃ ┣ Ask
 ┃ ┃ ┣ AskPage.jsx
 ┃ ┃ ┣ ContentForm.jsx
 ┃ ┃ ┣ QuestionReview.jsx
 ┃ ┃ ┣ TipBox.jsx
 ┃ ┃ ┣ VersatileBlueButton.jsx
 ┃ ┃ ┣ VersatileForm.jsx
 ┃ ┃ ┗ WritingGuideBox.jsx
 ┃ ┣ Login
 ┃ ┃ ┣ Login.jsx
 ┃ ┃ ┣ OriginLogin.jsx
 ┃ ┃ ┗ SocialLogin.jsx
 ┃ ┣ Main
 ┃ ┃ ┣ MainHeaderSection.jsx
 ┃ ┃ ┣ MainItem.jsx
 ┃ ┃ ┗ MainPage.jsx
 ┃ ┣ Register
 ┃ ┃ ┣ Register.jsx
 ┃ ┃ ┣ SignupInfo.jsx
 ┃ ┃ ┗ SoInfo.jsx
 ┃ ┗ Template.jsx
 ┣ styles
 ┃ ┣ GlobalStyles.jsx
 ┃ ┣ StyledDropDown.jsx
 ┃ ┗ StyledTItle.jsx
 ┣ App.jsx
 ┗ index.js
```
폴더의 깊이가 최소 한 개 증가했지만, 구분은 확실히 잘 되는 것 같다. 이 상태를 유지할 것이다. 

### 🔨 리팩토링
리팩토링은 최대한 마지막에 진해할 생각이었다. 프로젝트 진행 기간이 길지 않기 때문에 중간 중간 리팩토링을 진행하면서 시간을 맞출 자신이 없다. 그래서 일단 구현이 완료되면 그 이후에 리팩토링을 진행할 생각이었지만, 눈에 밟히는 부분들은 내가 정리할 예정이다. 컴포넌트 추출이 가능한 것들은 최대한 충돌이 나지 않을 선에서 건드릴 것이다. 


### 🪢 라우팅 처리
리액트 라우터 돔을 사용하기 때문에 라우터를 만들어서 컴포넌트들을 이어줘야 한다. 항상 고민되는 것이었는데, 이번에 또 그 고민이 생겼다. 각 페이지 별로 공통으로 들어가는 컴포넌트가 있으면 네스팅을 통해 `Outlet`컴포넌트를 활용하면 되지만, 어느 페이지에는 있고, 어느 페이지에는 없는 컴포넌트가 있다. 주로 푸터와 사이드 바가 그렇다. 이를 해결할 방법을 현재 고민중인데, 지금은 아래와 같은 상태이다.

![](https://velog.velcdn.com/images/crowwan/post/f89c7a66-f804-4ab7-b710-52bef5a39d0c/image.png)

라우터 데이터에는 아래와 같이 들어가 있다.
![](https://velog.velcdn.com/images/crowwan/post/c2dfcdda-62e9-4a0f-a776-d9ebf12e4c76/image.png)
지금 생각 하는 방법은 위 라우터 데이터에 다른 페이지도 넣고, 모두 `Template` 컴포넌트에 네스팅 처리를 한 뒤, 각 페이지 별로, `withFooter, withSidebars` 컴포넌트와 결합하는 방식을 생각중이다.

기본적으로 함수 컴포넌트를 사용하기 때문에, 함수형 기법인 커링 방식을 이용하면 간단히 구현 가능할 것이라고 생각한다. 

이 내용은 7일차에 팀원들과 협의 후 진행해볼 생각이다.
