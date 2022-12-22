---
title: "scroll bar 조작"
pubDate: 2022-12-22
description: "HTML문서를 작성하다 보면 그 내용이 길어져 화면을 벗어나는 경우가 있습니다. 이런 경우 브라우저에서 자동으로 스크롤 바를 제공합니다. (overflow가 auto혹은 scroll인 상태의 경우입니다.)"
tags: ["CSS"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/335b599c-5862-4d46-8cad-d2aa564d8c21/image.png"
---

HTML문서를 작성하다 보면 그 내용이 길어져 화면을 벗어나는 경우가 있습니다. 이런 경우 브라우저에서 자동으로 스크롤 바를 제공합니다. (`overflow`가 `auto`혹은 `scroll`인 상태의 경우입니다.)

그런데 몇 웹사이트를 보면 스크롤이 되지만 스크롤 바는 보이지 않는 경우를 보신 경우가 있을 거에요. 이렇게 스크롤 바를 개발자가 조작할 수 있는 방법에 대해 알아보겠습니다.

크롬을 기준으로 설명드린다는 것을 알아 두세요.

---
먼저 스크롤을 안보이게 하고 싶으면 크롬의 스크롤바에 관한 가상 요소 선택자를 이용합니다.
`::--webkit-scrollbar`를 이용하는 것이죠.

**이 가상 요소 선택자는 Blink와 Webkit 기반의 브라우저에서만 사용 가능합니다.**
Chrome, Edge, Opera, Safari, iOS 등이 해당됩니다. 


!codepen[crowwan/embed/JjBoqpO?default-tab=html%2Cresult]

위의 코드를 확인해보면 `body` 요소의 높이는 `1000px`로 기존 화면을 벗어나게 됩니다. 이때 스크롤이 생기지 않게 크롬의 스크롤을 `display: none`을 통해 안보이게 만들었습니다. 하지만 스크롤 동작은 잘 되네요.

#### 스크롤 관련 가상 요소 선택자
- `::-webkit-scrollbar` — 스크롤바 전체.
- `::-webkit-scrollbar-button` — 스크롤바의 버튼 (한 번 누를 때마다 위아래로 한 줄씩 오르내리는 위아래 화살표).
- `::-webkit-scrollbar-thumb` — 드래그할 수 있는 스크롤 손잡이.
- `::-webkit-scrollbar-track` — 흰색 막대 위에 회색 바가 존재할 경우의 스크롤바의 트랙(진행 표시줄).
- `::-webkit-scrollbar-track-piece` — 손잡이에 의해 덮이지 않은 트랙(진행 표시줄)의 부분.
- `::-webkit-scrollbar-corner` — 수평 스크롤바와 수직 스크롤바가 교차하는 곳의 하단 모서리. 주로 브라우저 창의 우측 하단 모서리에 위치한다.
- `::-webkit-resizer` — 몇몇 요소들의 하단 모서리에 나타나는, 드래그 할 수 있는 사이즈 변경 손잡이.
