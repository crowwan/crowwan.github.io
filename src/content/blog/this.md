---
title: "this"
pubDate: 2022-12-29
description: "this에 대해 정확하게 알고 있다고 생각했지만, 전혀 아니었다. 제대로 알기 위해서 여러가지 실험을 했고 어느 정도 감이 잡힌 것 같기 때문에 포스팅을 한다."
tags: ["JavaScript"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/6c513cc3-ad25-42a1-9168-435f10e38d8b/image.png"
---

`this`에 대해 정확하게 알고 있다고 생각했지만, 전혀 아니었다.
제대로 알기 위해서 여러가지 실험을 했고 어느 정도 감이 잡힌 것 같기 때문에 포스팅을 한다.

---
## this
객체의 메소드가 호출되었을 때 그 객체의 프로퍼티에 접근하는 방법이 필요하다. 이럴 때 사용할 수 있는 것이 `this`이다. `this`는 자신이 속한 객체나 생성할 인스턴스를 의미한다. 즉, 자신이 속한 객체나 생성할 인스턴스의 프로퍼티를 가져다 사용할 수 있게 된 것이다.

> 일반적인 경우 `this`는 `window` 객체에 바인딩되어 있다. 

`this`는 코드 어디서든 참조될 수 있는데, 그때마다 `this`는 다른 값을 가지고 있다. `this`는 정적으로 정해진 값이 아니라는 말이다.  함수 내부에서 this를 사용한 경우가 그러하다.


그렇다면 어떤 기준으로 동적으로 정해질까.

결론적으로 호출한 방식에 따라서 결정된다고 보면 된다. 먼저, `this`를 호출하는 경우를 살펴보자. 

`함수`는 일반 함수, 메소드, 콜백함수, 중첩함수, 화살표 함수, 생성자 함수 정도로 구분할 수 있다. 

각 함수마다 `this`에 바인딩되는 객체가 달라진다. 그렇기 때문에 정적이 아닌 동적으로 결정되는 것이다.

### 일반함수
일반함수의 `this`는 `전역객체`를 가리킨다. 브라우저면 `window`가 되겠고, node환경이면 `global`이 되겠다. 즉, 일반 함수를 호출했을 때 내부의 `this`는 `window`가 된다는 것이다.
```javascript
function whereIsThis(){
  console.log(this);
}
whereIsThis(); // window
```
그렇다면 앞서 설명한 내용에서 생각해보자. 앞서 `this`는 호출하는 방식에 따라 결정된다고 했다. 
> **일반함수로 호출할 경우 `this`는 `window`객체에 바인딩되게 되는 것이다.**

### 메소드
메소드는 `this`는 호출한 객체가 바인딩되게 된다. 
```javascript
var obj = {
    a: this, // 2. 일반적인 경우 this는 window,
    b: function() {
      console.log(this) // 3. 메소드의 경우 this는 객체
    }
}

console.log(obj.b); // {window, f} (obj 객체)
```
위 코드를 실행하면 객체가 출력되게 되는데 그 객체가 바로 obj객체이다. 호출한 객체가 바인딩 된다는 것은 **객체를 생성할 때 `this`가 정해지는 것이 아니라 호출할 때 정해진다는 것이다.**

``` javascript
var obj1 = {
    x: 'obj1 x', // 2. 일반적인 경우 this는 window,
    b: function() {
      console.log(this.x) // 3. 메소드의 경우 this는 객체
    }
}

obj1.b(); // 'obj1 x'

var obj2 = {
    x :'obj2 x',
    m : obj1.b // obj1의 메소드 b를 가지고 메소드를 선언 => obj4.m === obj.b true
}
obj2.m(); // 'obj2 x'
```
위의 코드를 보면 `obj1`의 메소드를 가지고 `obj2`의 메소드를 생성했다. 두 메소드가 같은지 비교를 하면 `true`가 나온다. 즉, 같은 함수를 참조하고 있다는 것이다. 그런데 메소드 호출은 다르지만 같은 메소드를 참조하고 있는데도 불구하고 `this`의 값이 다른 것을 볼 수 있다. 바로 호출한 객체에 `this`가 바인딩 되기 때문이다. 이렇게 코드를 작성하는 경우는 없지만, 호출한 객체에 바인딩된다는 의미를 보기 위해서 예시를 들어봤다.

> 메소드 함수의 `this`는 호출한 객체에 바인딩된다.

### 콜백함수, 중첩함수
**콜백함수와 중첩함수의 경우는 일반함수와 같기 때문에 `window`객체가 바인딩된다.**

```javascript
var x = 'window x';
function outer(){
    var x = 'outer x'
    console.log(this.x); // 일반함수 호출 => 전역객체의 x
    function inner(){
        var x = 'inner x' // 중첩함수 호출 => 전역객체의 x
        console.log(this.x);
    }
    inner();
}
outer();

// window x
// window x
```

```javascript
var x = 'window x';

// test를 호출하면 일반 호출이기 때문에 this는 `window`가 된다.
function outer(a){
    var x = 'outer x';
    console.log('outer',this.x);
    a();
}

// 콜백함수의 this는 window다.
outer(function (){
  var x = 'inner x'
    console.log('inner',this.x);
})
// outer window x
// inner window x
```
위 코드를 봤을 때도 납득이 가지만, 여기서 멈출 수 없다. 일반함수로 호출했기 때문에 `outer`함수의 `this`가 `window`로 바인딩되는 것은 알지만 콜백함수가 만약 자신을 인자로 받은 함수 즉, 고차함수의 `this`로 바인딩된다고 생각할 수 있지 않을까? 나만 그렇게 생각할 수도 있지만, 그래도 실험을 해봤다. 이 의문은 중첩함수도 똑같다.

만약 메소드가 콜백함수를 받는다면, 메소드의 `this`는 호출한 객체일 것이고, 만약 콜백함수의 `this`가 자신을 인자로 받은 함수의 `this`로 바인딩된다면, 콜백함수의 `this`도 메소드를 호출한 객체가 될 것이다. 

``` javascript
var obj = {
    a: this, // 2. 일반적인 경우 this는 window,
    x: 'object x',
    b: function(callback) {
      var x = 'method x';
      console.log('method',this.x) // 3. 메소드의 경우 this는 객체
        function t (){
            console.log('inner',this.x);
        }
      	callback();
        t();
    },

}
obj.b(function(){
  var x = 'callback x';
  console.log('callback', this.x);
})
// method object x (메소드 의 this)
// callback window x => 콜백 함수는 고차함수가 아닌 window가 바인딩된다.
// inner window x
```
위의 코드를 실행하면 나의 궁금증이 해결된다.

### 생성자 함수
생성자 함수는 조금 다를 수 있다. 생성자 함수는 이 함수 자체를 바인딩하는 것이 아니라 **미래에 생성될 인스턴스**를 `this`에 바인딩한다.

```javascript
function Circle(x){
  this.x = x;
}

const instance = new Circle(5);
instance.x; // 5
```
생성자 함수로 호출하는 방식은 `new`키워드를 사용하는 방법이 있다. 이러면 각 함수 자체가 `this`에 바인딩되는 것이 아닌 인스턴스가 바인딩되기 때문에 여러개의 인스턴스를 생성하더라도 각각의 프로퍼티는 독립적인 것이 된다.

### 화살표 함수
이것 때문에 많은 실험을 했다. 화살표 함수는 **`this`에 상위 스코프의 `this`가 바인딩된다고 들었다. 스코프는 정의된 위치에 따라 정해지기 마련이다.** 즉, 화살표 함수가 어디에 정의되었는지에 따라 `this`가 정해지는 것이다. 이것은 정적 컨텍스트를 따른다고 볼 수 있다. 여기서의 정적과 동적은 값이 정해졌다는 것이 아니라 컨택스트가 정해졌다는 것이다. 

이것을 알아보기 위해서 여러 실험을 했다. 우선, 전역에서 화살표함수를 선언하고 호출하면 `this`는 언제나 `window`일 테니까 하지 않았고, 궁금한 건 콜백으로 화살표함수를 넣을 때, 미리 선언한 상태에서 인자로 넘겨줄 때와 그냥 인자에서 바로 선언할 때가 궁금했다.

비교하기 위해서 아래와 같은 코드를 작성했다.

```javascript
var a = 'window a'
var obj3 = {
    a : 'a',
    m(){
        console.log(this.a);
        (()=>{
            console.log(this.a)
        })()
        const arrow = ()=>{
            console.log(this.a);
        }
        arrow();
        function test(arrow){
            let a = 'b'; 
            console.log(this.a); // window의 a
            arrow(); // window의 a이지 않을까 정의된 위치면 obj3
        }
        test(arrow);
    }
}
obj3.m();
// a  => 메소드 출력
// a  => 메소드의 중첩함수로 화살표함수를 즉시 실행
// a  => 메소드의 중첩함수로 화살표함수를 선언 후 실행
// window a => 메소드의 중첩함수로 일반함수 test를 선언 후 호출
// a  => 선언된 화살표 함수를 콜백으로 보낸 경우 
// 만약 콜백 함수를 따르면 window a겠지만, 그렇지 않으면 정의된 위치인 obj3의 a가 될 것이다.
```
먼저 `obj3`의 `this.a`는 `obj3`의 프로퍼티 `a`를 가리킨다. 다음 화살표 함수를 즉시실행하여 `this`를 참조했을때 자신이 정의된 위치인 `obj3`의 `this`가 바인딩되기 때문에, `obj3.a`의 값이 출력된다. 만약 일반함수였다면, `window a`가 출력됐을 것이다. 다음 출력은 메소드에 중첩되어있으니 `window a`가 출력되는 것이 맞고, 마지막으로 콜백 함수의 `this`를 보니 자신이 정의된 객체가 바인딩 된 것을 알 수 있다.
