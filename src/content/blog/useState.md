---
title: "useState"
pubDate: 2023-02-22
description: "함수 컴포넌트에서 상태를 다룰 때 사용하는 훅은 useState입니다. 그냥 변수를 사용하면 되는 것을 왜 state를 사용해야할까요?"
tags: ["React"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/583fcf38-c2f3-454e-9479-16fb29c1192b/image.jpg"
---

함수 컴포넌트에서 상태를 다룰 때 사용하는 훅은 `useState`입니다. 
그냥 변수를 사용하면 되는 것을 왜 state를 사용해야할까요?


## 일반 변수 vs state 변수
```jsx
export default function App() {
  let testCount = 0;
  const [count, setCount] = useState(0);
  // setCount 상태에 새로운 값을 넣어주고 => 값이 변경되었으니까 이걸 반영해서 렌더링을 다시해야된다.
  // setCount 알아서 재 렌더링을 한다.
  return (
    <div className="App">
      {testCount}
      <br />
      {count}
      <br />
      <button
        onClick={() => {
          testCount += 1;
          console.log(testCount);
        }}
      >
        testCount
      </button>
      <button
        onClick={() => {
          setCount((prev) => prev + 1);
          console.log(count);
        }}
      >
        count
      </button>
    </div>
  );
}

```

위의 코드를 보게 되면 버튼을 눌렀을 때 각각 일반 변수와 state변수의 값을 1 증가시키는 이벤트가 달려있습니다. 

실제로 눌렀을 때 값이 변화하는지 확인해봅시다. 콘솔창을 열어서 보면 됩니다. 

![](https://velog.velcdn.com/images/crowwan/post/5036fa5d-3128-4ee7-8ce9-2f3e2dad21d7/image.png)

위 사진은 버튼을 각 한 번씩 눌렀을 때 결과입니다. 

브라우저 창을 보시면 위의 숫자가 `testCount`이고 아래가 `count` 값입니다. 

### 리렌더링 차이

그런데 뭔가 이상합니다. `testcount`의 값은 0인데 `count`의 값은 1로 변경이 되었네요. 하지만 출력된 콘솔창을 보면 `testcount`의 값이 증가한 것을 볼 수 있죠. 즉, 값은 변경이 되었는데 화면에 반영이 되지 않았다는 것이죠.

이는 자바스크립트로 화면에 어떤 변화하는 데이터를 보여줄 때도 같습니다. 값이 변하면, 그 변한 값을 다시 렌더링해서 반영해야하죠. 하지만, 리액트에서 훅을 이용해 상태를 만들면 그 값이 상태 변경 함수를 통해 변경되었을 때 알아서 리렌더링이 됩니다. 그렇기 때문에 위의 결과가 나타난 것이죠.

### 변수 값 유지
그렇다면 단순히 리렌더링의 차이만으로 상태를 사용해야하는 것일까요? 아래의 사진을 또 봅시다.

![](https://velog.velcdn.com/images/crowwan/post/891dfad6-f711-4c07-bbf0-a69291988cf3/image.png)

아래의 사진은 testcount의 값을 충분히 증가시키고 count버튼을 눌러 리렌더링을 한 것입니다. 분명 일반 변수는 값이 변하고 리렌더링이 되지 않아 문제였는데, 그러면 상태를 변경했을 때는 리렌더링이 되니까 count 버튼을 눌렀을 때 testcount값이 반영이 되어야 하는 것이 아닐까요?
왜 반영이 되지 않을까요? 

그 이유는 함수 컴포넌트가 리렌더링이 될 때 그 함수 자체가 다시 실행되기 때문입니다. 그렇기 때문에 일반 변수가 다시 선언이 되어 초기값을 가지고 있게 되는 것이죠. 하지만 상태 변수는 그 값이 유지되기 때문에 리렌더링이 되어도 화면에 잘 반영이 되는 것이죠.


### 동기 vs 비동기
![](https://velog.velcdn.com/images/crowwan/post/5036fa5d-3128-4ee7-8ce9-2f3e2dad21d7/image.png)
또 이상한 점이 있습니다. 첫번째 사진을 다시 봐보죠. 위의 경우는 버튼을 각각 한 번씩 누른 후 값을 콘솔에 출력해주고 있습니다.

```jsx
<button
  onClick={() => {
    testCount += 1;
    console.log(testCount);
  }}
  >
  testCount
</button>
<button
  onClick={() => {
    setCount((prev) => prev + 1);
    console.log(count);
  }}
  >
```
위 코드에서 확인할 수 있습니다. 그런데 왜 count는 증가된 값이 보이지 않을까요??
그 이유는 `setCount`가 비동기로 동작하기 때문입니다. 비동기에 대한 설명은 제 포스팅에 있으니 한 번 참고하시면 될 것이고, 비동기로 동작하기 때문에 이전 상태 값이 출력이 되는 것이라고 생각하면 됩니다.

그렇다면 왜 이 현상을 알아야 할까요?

```jsx
<button
  onClick={() => {
    setCount((prev) => prev + 1);
    setAr((prev) => [...prev, count]);
    console.log("count", count);
  }}
  >
  count
</button>
<ul>
  {ar.map((a) => (
    <li>{a}</li>
  ))}
</ul>
```
위 코드는 count가 증가하면 그 값을 증가한 값을 ar에 넣어주고 화면에 보여주는 방식으로 구현 했습니다. 

![](https://velog.velcdn.com/images/crowwan/post/c678696b-158f-4a4a-96f7-e8e747ac4110/image.png)
하지만 버튼을 눌렀을 때 증가한 값이 아닌 이전 상태의 값이 추가가 되네요. 이렇게 비동기로 동작하는 문제를 만나게 되면 우리가 원하는 상태 값을 가지고 오지 못하는 경우가 생길 수 있습니다.

이렇게 비동기적으로 변하는 상태 값을 내가 원하는 시점에 원하는 값을 가져오게 하기 위해서 사용할 수 있는 방법은 위의 상태 변경 함수에 함수를 인자로 넣어 사용하는 방법이 있고, 또 `useEffect`를 이용해서 처리하는 방법이 있습니다.

이에 대해서는 다음 포스트에서 설명하도록 하겠습니다.
