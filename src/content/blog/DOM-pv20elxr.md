---
title: "DOM"
pubDate: 2023-01-31
description: "자바스크립트가 생긴 목적은 HTML과 CSS만으로 이루어진 기존의 웹 페이지의 특정 기능들을 수행할 수 있게 하기 위해서 만들어진 프로그래밍 언어인데요. 즉, HTML요소들을 조작할 수 있게 하는 것이 주된 목표였죠. 또, HTML은 브라우저 내에서 사용하는 마크업 언..."
tags: ["JavaScript"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/6fe7cb58-2fe9-447d-a29e-67c722b84806/image.png"
---

![](https://blog.kakaocdn.net/dn/eeKeQD/btreIWxANwU/R1gZqkWcOeFqQryQXmhNgk/img.jpg)
## DOM이 뭘까
자바스크립트를 공부하게 되면 DOM이라는 것에 대해 들어볼 것입니다. 사실 DOM은 자바스크립트의 본래 목적을 위해서 반드시 알고 있어야 하는 개념입니다.

자바스크립트가 생긴 목적은 HTML과 CSS만으로 이루어진 기존의 웹 페이지의 특정 기능들을 수행할 수 있게 하기 위해서 만들어진 프로그래밍 언어인데요. 즉, HTML요소들을 조작할 수 있게 하는 것이 주된 목표였죠. 또, HTML은 브라우저 내에서 사용하는 마크업 언어이기 때문에 자바스크립트는 브라우저에서만 동작하는 언어였습니다. 그렇다면, 자바스크립트는 어떻게 HTML과 CSS를 조작할 수 있을까요?

## 렌더링 엔진
먼저, 브라우저가 어떤 식으로 동작하는 지 설명하겠습니다.

브라우저는 사용자가 리소스를 서버에 요청하고 결과를 응답받아 브라우저에 보여줍니다. 이때 사용하는 것이 URI인데, 흔히 웹 페이지의 주소라고 하는 것이죠. 이 URI에 사용자가 어떤 값을 담아 서버에 요청하면 서버는 그에 맞는 리소스를 응답으로 제공하게 됩니다.

이후 요청 받은 내용을 렌더링 엔진이 브라우저에 렌더링하게 됩니다.
![](https://d2.naver.com/content/images/2015/06/helloworld-59361-1.png)
이미지 출처 : https://d2.naver.com/helloworld/59361

렌더링 엔진은 동기적으로 HTML문서를 읽어내려 갑니다. 그러면서 HTML문서를 파싱해 DOM노드로 변환하는데요. 중간에 CSS를 읽어오는 link태그나 style태그를 만나게 되면, HTML을 읽는 것을 중단하고 CSS파일을 읽게 됩니다. CSS파일도 HTML처럼 파싱하면서 CSSOM트리를 생성하게 되죠. 이 작업이 끝나면 다시 중단된 지점부터 HTML을 읽어 내려갑니다.

이후 DOM트리와 CSSOM트리가 만들어 지면, 렌더 트리로 결합되게 됩니다. 렌더 트리는 HTML요소의 레이아웃을 계산하는 데 사용되고, 브라우저에 렌더링하는 페인팅처리에 입력됩니다.

이런 렌더 트리를 생성하는 과정은 브라우저에서 레이아웃의 변화가 있거나 렌더링의 변화가 있을 때 다시 생성되고, 그러면 레이아웃 계산과 페인팅 처리가 또 실행됩니다. 즉, 너무 반복적인 재렌더링은 성능에 악영향을 끼칠 수 있습니다.

## DOM트리
여기서 생성된 DOM이 무엇인지 알아봅시다. DOM은 HTML문서의 구조와 정보를 표현하며 이를 제어할 수 있는, 메소드와 프로퍼티를 제공하는 트리형태의 자료구조입니다.

HTML의 요소들은 특정 노드로 변환되게 됩니다.

- 문서 노드 : HTML문서 자체를 표현한 노드이다.
- 요소 노드 : HTML의 요소 즉, 태그를 나타내는 노드이다.
- 어트리뷰트 노드 : HTML 태그의 어트리뷰트를 나타내는 노드로 해당 태그의 노드와 연결된다.
- 텍스트 노드 : HTML 태그 내부의 텍스트를 나타내는 노드로 해당 태그의 노드와 연결된다.

크게 나누면 이렇게 나눌 수 있는데요. 요소 노드는 각 태그마다 다른 노드로 변환되고, 트리 구조를 가집니다. 즉, 모든 HTML 노드는 문서노드부터 시작되어 부모 자식 관계로 트리 형태를 이루며 생성되게 되죠. 이것을 DOM 트리 구조라고 합니다.

## DOM 사용해보기
자바스크립트에서 html 문서의 특정 태그에 해당하는 노드에 접근해보려고 합니다. 이 때는 document 객체의 메소드를 이용할 수 있습니다.

### querySelector()
`document.querySelector`는 document객체의 메소드입니다. css를 작성할 때 사용하는 선택자를 이용해서 같은 선택자를 가지는 노드를 반환하게 됩니다.
```javascript
const $input = document.querySelector('input.username-input');
```
위와 같은 형식으로 노드를 받아올 수 있습니다. 단, 같은 선택자로 찾을 수 있는 노드가 여러 개일 경우 첫번째 요소를 반환합니다.

`querySelector`는 `document`만 가지고 있는 메소드가 아니라 `dom`객체가 가지고 있는 메소드이기 때문에 꼭 `document`로 호출할 필요는 없습니다.
```javascript
const $ul = document.querySelector('.list-container');

const $li = $ul.querySelector('.list-item');
```


### querySelectorAll()
만약 내가 특정 선택자를 가진 모든 요소가 필요한 경우 사용할 수 있는 메소드입니다. 해당하는 모든 요소를 `NodeList`에 담아 반환합니다.
```javascript
const $divs = document.querySelectorAll('div');
```
여기서 `NodeList`를 반환한다는 것이 중요합니다. `NodeList`는 유사 배열 객체입니다. 배열처럼 접근이 가능하지만, 배열의 메소드를 가지고 있지 않다는 의미입니다.

`querySelector`와 마찬가지로 `dom`객체가 가지고 있는 메소드입니다.

### 웹 요소의 내용 가져오고 수정하기
웹 요소를 `querySelector`로 찾았다면, 그 요소가 가진 내용을 수정하거나 추가하는 방식으로 프로그래밍을 해야합니다. 그때 사용할 수 있는 프로퍼티를 알아봅시다.

> - `Element.innerText` 
 - `Element.innerHTML`
 - `Element.textContent`
 
 위 세 가지 프로퍼티를 이용하면 웹 요소에 내용을 가져오고, 수정하고, 추가할 수 있습니다.
 
#### innerText
요소와 그 자손의 렌더링 된 텍스트 콘텐츠를 나타냅니다. 이 프로퍼티는 웹 브라우저에서 보이는 내용만 가져옵니다. 만약, `display:none`으로 화면에서 보이지 않게 만든 요소가 있다면 가져오지 않습니다. 또 소스에는 공백이 많더라도 화면에 보이는 것처럼 1개의 공백만 가져오게 됩니다.
 
 
``` javascript
document.querySelector('#root').innerText
```

#### innerHTML
요소(element) 내에 포함 된 HTML 또는 XML 마크업을 가져오거나 설정합니다.
요소(element)의 자손의 HTML 직렬화를 포함하는 DOMString 입니다. innerHTML 의 값을 설정(대입)하면 요소의 모든 자손이 제거되고, 문자열 htmlString에 지정된 HTML을 파싱하고, 생성된 노드로 대체합니다.

문자열을 이용해서 `html`태그를 생성할 수 있기 때문에 탬플릿 리터럴과 사용하면 쉽게 `html`을 동적으로 생성할 수 있습니다.

```javascript
const tmpl = `
<div>title</div>
<div>content</div>
`
const root = document.querySelector('#root');
root.innerHTML = tmpl;
```

> `innerHTML`은 자바스크립트 코드를 넣을 수 있기 때문에 보안 위협이 있습니다.

#### textContent
노드와 그 자손의 텍스트 콘텐츠를 표현합니다. HTMLElement.innerTEXT와 헷갈릴 수 있습니다.
둘의 차이는 아래와 같습니다.

> - textContent는 `<script>`와 `<style>` 요소를 포함한 모든 요소의 콘텐츠를 가져옵니다. 반면 innerText는 "사람이 읽을 수 있는" 요소만 처리합니다.
- textContent는 노드의 모든 요소를 반환합니다. 그에 비해 innerText는 스타일링을 고려하며, "숨겨진" 요소의 텍스트는 반환하지 않습니다.
- 또한, innerText의 CSS 고려로 인해, innerText 값을 읽으면 최신 계산값을 반영하기 위해 리플로우가 발생합니다. (리플로우 계산은 비싸므로 가능하면 피해야 합니다)
- Internet Explorer 기준, innerText를 수정하면 요소의 모든 자식 노드를 제거하고, 모든 자손 텍스트 노드를 영구히 파괴합니다. 이로 인해, 해당 텍스트 노드를 이후에 다른 노드는 물론 같은 노드에 삽입하는 것도 불가능합니다.

```javascript
document.querySelector('#root').textContent
```

## 자바스크립트로 스타일 수정하기
### css속성 접근
`dom`을 이용해서 해당 요소의 css속성을 설정할 수 있습니다. 이때 사용하는 것이 `style`인데요. `요소.style.속성명`의 형태로 사용하면 됩니다.

```javascript
const $title = document.querySelector('.title');
$title.style.backgroundColor = 'black';
```

위의 형태로 작성하면 됩니다. 여기서 주의할 점은 `css`의 경우 속성명을 `-`을 이용해 이었지만, 자바스크립트에서는 `-`를 연산자로 인식하기 때문에 그런 방식을 사용하지 않고, `카멜케이스`를 이용해서 작성합니다.

`background-color`를 `backgroundColor`의 형태로 작성하는 것이죠.

### class 접근
`dom`을 이용해서 해당 요소의 class도 접근할 수 있습니다. 동적으로 `class`를 추가하거나, 삭제하는 것이 가능하죠. 바로 `classList`를 이용하면 됩니다.
```javascript
const $title = document.querySelector('.title');
$title.style.backgroundColor = 'black';

// 추가
$title.classList.add('black');
// 삭제
$title.classList.remove('black');
// 토글
$title.classList.toggle('black');

// 특정 클래스를 가지고 있는지 여부
$title.classList.contains('black');
```

보통 자바스크립트를 이용해서 `dom`을 조작할 때는 클래스를 이용하게 됩니다.
특정 클래스가 있을 때는 화면에 보여지지 않게 하고, 없으면 보여지는 방식도 가능하게 되죠.
