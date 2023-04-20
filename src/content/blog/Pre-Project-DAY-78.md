---
title: "Pre-Project DAY 7,8"
pubDate: 2023-04-20
description: "페이지를 담당하는 컴포넌트들이 중복되는 컴포넌트들을 가지고 있는 경우가 있다. 특히, 사이드 바가 그렇다. 이건 어느 웹 사이트나 마찬가지일 것이다. 이때 사용할 수 있는 방법이 리액트 라우터에서 네스팅 방식을 사용하는 것이다. 그렇게 했을 때 <Outlet /컴포넌트..."
tags: ["팀 프로젝트"]
heroImage: "https://velog.velcdn.com/images/crowwan/post/346db0ce-a371-4176-8cea-01158ec14118/image.png"
---

## 📌 프리 프로젝트 7일차

### 🪢 컴포넌트 컴포지션

페이지를 담당하는 컴포넌트들이 중복되는 컴포넌트들을 가지고 있는 경우가 있다. 특히, 사이드 바가 그렇다. 이건 어느 웹 사이트나 마찬가지일 것이다. 이때 사용할 수 있는 방법이 리액트 라우터에서 네스팅 방식을 사용하는 것이다. 그렇게 했을 때 `<Outlet />`컴포넌트를 이용하여 바뀌는 부분만 갈아끼우는 방법으로 중복된 컴포넌트를 사용할 수 있다. 

우리가 만드는 페이지 역시 그런 경우가 많았다. 하지만, 다른 점이 왼쪽 네비게이션이 있지만, 오른쪽 어사이드바는 없는 경우도 있고, 푸터가 없는 경우도 있고, 그랬다. 즉, 하나의 템플릿 페이지와 `<Outlet />`으로는 처리가 힘들었다. 그래서 사용한 방법이 컴포넌트 컴포지션이었다.

아래는 템플릿을 담당하는 컴포넌트다.

![](https://velog.velcdn.com/images/crowwan/post/dda3a603-bbfd-4254-ab04-8b0005a62cea/image.png)

템플릿의 경우 필요한 페이지만 적용을 할 것이고, 그 페이지들은 필수적으로 푸터, 사이드바를 포함한다.


아래의 사진은 모든 라우터 데이터이다. 템플릿이 필요한지 그렇지 않은지를 따로 관리하고 있다.
![](https://velog.velcdn.com/images/crowwan/post/d923485c-8351-4669-804c-0ed0f760fbf9/image.png)

라우팅은 아래와 같이 작성했다. 로그인 기능은 구현되지 않았기 때문에 임시로 해놓았다.

![](https://velog.velcdn.com/images/crowwan/post/2a209cd6-f3f2-4f02-b57d-86d16b3ce652/image.png)



## 📌 프리 프로젝트 8일차

### 💻 json server
json server를 이용해서 목업 서버를 구현했다. 

백엔드에서 전달받은 데이터베이스 ERD는 다음과 같다.

![](https://velog.velcdn.com/images/crowwan/post/35b955cd-e357-40c9-a2d9-1e5d9b1a501d/image.png)

이를 기반으로 `db.json`을 구성했다.

서버 커스터마이징을 하려고 했지만, `lowdb`를 불러올 때 esmodule방식을 지원을 안해서 그런지 실패했다.

json server를 사용하려면 다음과 같이 하면된다.

```shell
$ cd ./client
$ json-server --watch db.json --port 3001
```
