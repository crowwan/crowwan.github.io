---
title: "useRef"
pubDate: 2023-02-21
description: "리액트 훅 중 useRef에 대해 알아보자. 보통 리액트에서 변하는 값을 다룰 때는 상태를 이용하게 된다. 또한, 리액트에서는 특정 DOM객체에 접근하고 싶을 때 document.querySelector과 같은 방법은 권장하지 않는다. 이럴 때 사용을 고려해볼 수 있는..."
tags: ["React"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/5a658ff9-00f8-493b-b367-8353c89f10eb/image.jpg"
---

리액트 훅 중 `useRef`에 대해 알아보자.
보통 리액트에서 변하는 값을 다룰 때는 상태를 이용하게 된다. 또한, 리액트에서는 특정 `DOM`객체에 접근하고 싶을 때 `document.querySelector`과 같은 방법은 권장하지 않는다. 이럴 때 사용을 고려해볼 수 있는 것이 바로 `ref`이다.

## useRef
함수 컴포넌트에서 사용하는 훅 중 `useRef`는 위에서 말한 경우에서 사용할 수 있다. 
useRef는 `.current`프로퍼티로 전달된 인자로 초기화된 변경 가능한 `ref객체`를 반환한다.
아래의 예시를 보자
```jsx
function App(){
  
  const testRef = useRef(1);
  console.log("render");
  useEffect(() => {
    console.log(testRef);
  }, [testRef]);
  return (<div>app</div>)
}
```
위 코드에서 `useEffect`를 이용해서 `App`컴포넌트가 마운트 될 때 `inputRef`를 출력해보았다.
![](https://velog.velcdn.com/images/crowwan/post/1683dd7b-4b3e-49db-bf11-077e0abc079c/image.png)
그랬을 때 위와 같은 모습이 출력된다. 즉, `useRef`는 특별한 것이 아니라 `current`라는 프로퍼티의 값으로 초기에 넘겨준 인자를 할당하여 단순히 객체를 반환하는 것이다.




### useRef를 쓰면 어떻게 될까?
`useRef`를 사용하게 되면 값을 저장할 수 있는 상자를 만든다고 생각하면 된다. 그러면 `useState`를 이용해서 상태를 만들면 되는 것이 아닌가?

하고 생각할 수 있지만, 둘은 차이가 있다. 값이 변할 때 상태의 경우 상태를 변화시키는 함수를 사용하게 되지만, `useRef`를 이용하면 직접 값을 바꿀 수 있다. 또한, 상태는 변경된다면 리렌더링이 일어나게 되는데 `useRef`를 이용하면 리렌더링이 일어나지 않는다는 차이가 있다.

또한 `dom`요소에 `ref`속성을 이용해서 해당 `dom`객체를 저장하고 있을 수 있다.

## dom을 이용하는 법

그렇다면 `DOM객체`는 어떻게 가져올 수 있을까? 바로 `ref`속성을 이용하는 것이다. 아래 예시를 보자.

```jsx
function App(){
  
  const testRef = useRef(1);
  console.log("render");
  useEffect(() => {
    console.log(testRef);
  }, [testRef]);
  return (<div ref={testRef}>app</div>)
}
```
![](https://velog.velcdn.com/images/crowwan/post/e6304531-9a66-46ed-954a-ea8a912bb766/image.png)

위와 같은 결과가 나온다. `ref`에 `useRef`로 생성한 상자를 넣어주게 되면 그 `dom`객체가 저장되게 된다. 실제로 `document.querySelector`를 이용해서 특정 요소를 찾거나 하는 것과 비슷하다. 리액트에서 `dom`객체에 접근해야할 때 사용할 수 있다.

### focus
주로 사용될 수 있는 경우는 `input`의 `focus`를 하는 것이다.
```jsx
function App(){
  
  const testRef = useRef();
  
  useEffect(() => {
    testRef.curretn.focus();
  }, []);
  return (<input ref={testRef}>app</input>)
}
```
위와 같이 작성하게 되면 처음 `App`컴포넌트가 마운트 될 때 `input`에 포커싱이 될 것이다.

## 리렌더링이 되지 않는다.
리렌더링이 되지 않는 점을 이용하면 다음과 같은 방식을 고려할 수 있다.

> 자동완성이 필요없는 input의 값을 가져올 때

보통 `input`값을 가져오게 된다면 `input`의 값을 저장할 상태를 만들고, `onChange`이벤트를 이용해서 값이 변할 때마다 상태도 변하게 하는 방법을 사용한다. 이 경우는 자동 완성 기능을 구현할 때 사용할 수 있다. 하지만, 단점은 `input`의 값이 변할 때마다 리렌더링이 계속된다는 것이다. 

자동완성이 필요없다면 굳이 리렌더링이 될 필요가 없고, 엔터나 특정 버튼을 눌렀을 때만 값을 가지고 있으면 된다. 그때 `useRef`를 사용하면 리렌더링 없이 그 값을 가져올 수 있다. (변화할 때마다 값을 갱신할 수 있지만, 그냥 input.current.value를 가져오는 것이 더 편할 것이라 생각한다.)

``` jsx
const userModal =
  (api) =>
  ({ setShow, setUser, title }) => {
    const idRef = useRef();
    const pwRef = useRef();
    // const [id, setId] = useState("");
    // const [pw, setPw] = useState("");
    // const onIdChange = (e) => {
    //   setId(e.target.value);
    // };
    // const onPwChange = (e) => {
    //   setPw(e.target.value);
    // };
    const onSubmitClick = () => {
      if (api(idRef.current.value, pwRef.current.value)) {
        setUser(idRef.current.value);
        setShow("");
      }
    };
    return (
      <Modal title={title} setShow={setShow}>
        <ModalContent text="id">
          <input className="modal__body" ref={idRef} />
        </ModalContent>
        <ModalContent text="password">
          <input className="modal__body" ref={pwRef} />
        </ModalContent>
        <button className="modal__btnList--btn btn" onClick={onSubmitClick}>
          SUBMIT
        </button>
      </Modal>
    );
  };
```
위의 코드는 실제로 내가 프로젝트에서 사용한 것이다. 모달창에 인풋을 띄워 아이디와 비밀번호를 입력받는데, 처음에는 그 값을 상태로 관리했지만, 필요없는 리렌더링이 생긴다고 판단하여 그냥 `useRef`를 이용해서 `submit`버튼을 눌렀을 때만 그 값을 가져오는 방식으로 수정했다. 실제로 렌더링은 줄어들었다. 좋은 효과라고 생각은 되지만, 인풋에 값을 입력하는 것이 큰 비용이 드는 리렌더링이 아닌 경우는(나의 프로젝트와 같은) 꼭 필요한 방식은 아니라고 생각한다.
