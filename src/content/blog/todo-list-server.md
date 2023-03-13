---
title: "todo list server"
pubDate: 2023-03-13
description: "서버 구현이 어느 정도 완료된 것 같습니다. 폴더 구조는 아래와 같습니다. api sheet은 따로 만들지 않았습니다."
tags: ["솔로 프로젝트"]
---

서버 구현이 어느 정도 완료된 것 같습니다.
폴더 구조는 아래와 같습니다. api sheet은 따로 만들지 않았습니다.

![](https://velog.velcdn.com/images/crowwan/post/f5fde4ee-4556-4db7-99bf-ba138f0e0e90/image.png)

## app
실제 서버를 만들고 큰 라우터를 설정하는 곳입니다.
![](https://velog.velcdn.com/images/crowwan/post/498dc6f0-e6f8-4b3d-aef9-cd76e57e9d15/image.png)

먼저 큰 라우터는 이런 식으로 만들어질 것입니다.
`/user`로 요청이 오는 경우 `userRouter`에서 세부 라우팅을 구현하고 있고, `/todos`로 요청이 오는 경우는 `todoRouter`에서 세부 라우팅을 구현하고 있습니다.

## userRouter
`/user` 와 관련된 라우팅 처리를 하는 곳입니다.
![](https://velog.velcdn.com/images/crowwan/post/b64cc7f6-ffe9-4a75-8c82-12a42fc9d709/image.png)

기본적으로 `/login`이나 `/signup`에서 로그인 혹은 회원가입을 진행한 뒤 `/userinfo`라우터로 `redirect`를 진행하게 됩니다. 그 후, `/userinfo`에서 실질적으로 응답을 보내게 됩니다.

`/logout`의 경우는 단순히 브라우저 상의 쿠키를 지우는 기능을 수행합니다.

## userControllers
`/user` 라우터에서 사용되는 미들웨어들을 구현했습니다. 위에서 설명한 방식으로 동작하게 만들었습니다.

![](https://velog.velcdn.com/images/crowwan/post/c01f9fbe-b15f-4404-9e94-dd2d75d53de2/image.png)

쿠키를 이용해서 로그인을 구현했는데, 세션 방식이 아니라 단순히 쿠키에 userid를 넘겨주고 이것으로 로그인 여부를 확인하는 방식이기 때문에 유저 아이디를 직접 볼 수 있는 단점은 있지만, 기본적인 로그인 동작 방식과 조금은 유사하게 만들었다고 생각합니다. 

유저 정보는 `supabase`의 데이터 베이스에 저장합니다. 아이디와 비밀번호를 저장하고, 비밀번호의 경우는 `crypto`를 이용해서 `sha256`으로 해쉬화합니다.

이후 가능하면 세션 방식으로 바꿀 생각도 있습니다. 단순한 유사 로그인 기능이기 때문에 jwt방식은 너무 오버하다가 생각해 고려하지 않았습니다.

## todoRouter
`/todos` 경로로 오는 요청을 처리하는 라우터는 다음과 같이 처리를 했습니다. 
![](https://velog.velcdn.com/images/crowwan/post/461660dd-9baa-4982-93dc-cf83b3f0c0e0/image.png)
기본적으로 라우터에서 로그인 된 상태를 확인하기 위해서 라우터 처리 이전에 미들웨어로 처리를 했습니다.

단순히 `CRUD`작업이 구현된 상태입니다.

## todoControllers
라우터에서 동작하는 미들웨어들을 작성했습니다.
![](https://velog.velcdn.com/images/crowwan/post/7923f3c5-28ae-48f2-9165-c3c5f812f5c7/image.png)

todo 생성 당시 클라이언트에서 body에 uid를 담아서 주지 않게 하기 위해서 처리를 해주었습니다. 이유는 요청 해더에 이미 uid가 쿠키에 담겨 전달되기 때문이죠.

데이터 베이스에 저장하도록 구현을 했습니다. 에러 처리도 구현을 했는데 생각했던 방식으로 동작을 안하더군요. 

❗️ 예를 들면, 없는 데이터를 수정한다고 하면 에러를 보내지 않습니다. 만약 수정되는 column이 존재하는 것이라면 에러가 발생하지 않습니다. 단 column이 없다면 에러가 발생하는 것은 확인했습니다. 


## 데이터 베이스
데이터 베이스의 테이블들은 다음과 같습니다.

### todos table
![](https://velog.velcdn.com/images/crowwan/post/3ffc69ff-9934-497d-9858-02307086ae5e/image.png)

### users table
![](https://velog.velcdn.com/images/crowwan/post/768f1fe4-4401-4474-aceb-907f067c827c/image.png)


## 흠..
일단 서버를 완성했고, 동작 여부는 포스트맨으로 확인까지 한 상황입니다. 하지만, 언제나 실제 서비스와 연동해봐야 진짜 버그가 없는지 알 수 있죠. 일단은 이 정도로 하고 클라이언트와 연동을 해보려고 합니다.
