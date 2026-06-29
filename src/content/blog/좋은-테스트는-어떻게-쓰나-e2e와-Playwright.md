---
title: "좋은 테스트는 어떻게 쓰나 — e2e와 Playwright"
pubDate: 2026-06-29
description: "1·2편이 '무엇을, 어디에'였다면 이번 편은 '그래서 어떻게 쓰나'다. e2e를 Playwright로 — 왜 그렇게 생겨먹었는지 따라가면 e2e의 본질이 보인다."
tags: ["테스트", "Playwright", "회고"]
---

> 1·2편이 "무엇을, 어디에"였다면 이번 편은 "그래서 *어떻게* 쓰나"다.
> e2e를 Playwright로 — 왜 그렇게 생겨먹었는지 따라가면 e2e의 본질이 보인다.

> 이 글은 "좋은 테스트란 무엇인가" 시리즈의 3편(e2e와 Playwright)이다.

---

## 들어가며

[1편](/blog/좋은-테스트는-구현이-아니라-동작을-검증한다/)에서 "무엇이 좋은 테스트인가"에 답했다. 좋은 테스트는 구현이 아니라 **동작**을 검증하고, 그 판정 기준은 **클라이언트**("이 코드를 호출해서 쓰는 쪽")가 의존하느냐였다. [2편](/blog/좋은-테스트는-어디에-두나/)에선 그 좋은 테스트를 단위·통합·e2e 중 *어디에* 둘지를 다뤘다.

이번 편은 그 칼날을 **e2e**에, 도구는 **Playwright**로 든다. 1·2편이 "무엇을·어디에"였다면, 이 글은 "그래서 *어떻게* 쓰나"다. Playwright를 처음 잡는 사람을 위한 글이지만, 단순한 API 나열은 아니다. **왜 Playwright가 그렇게 생겨먹었는지** — locator는 왜 요소를 늦게 찾고, 어썰션 앞엔 왜 `await`이 붙고, 클릭은 왜 가려진 버튼을 못 누르는지 — 그 이유를 따라가면 e2e의 본질이 보인다.

---

## 1. e2e란, 그리고 왜 신뢰도가 높은가

e2e(end-to-end) 테스트는 어떤 동작을 검증할 때 **클라이언트–서버 통신을 포함한 시스템 전반을 real로 띄워** 사용자 시점의 전체 경로를 확인한다. 실제 사용자가 마주하는 서비스와 거의 같은 모습이라, 단위·통합 테스트보다 **신뢰도가 높다.** 여기서 신뢰도란 *"이 테스트가 통과하면 웬만해선 실제로도 잘 동작한다"*는 믿음이다.

왜 더 신뢰할 수 있나. 1편에서 다룬 개념을 빌리면 — 단위·통합 테스트는 협력 객체를 stub/mock으로 바꿔놓고 **계약을 *가정***한다. 그런데 stub은 내가 가정한 형태로만 응답한다. **stub이 거짓말을 해도 단위 테스트는 모른다.** e2e는 그 의존성들을 실제로 띄워, 가정이 아니라 진짜를 통과시킨다. 그래서 1편의 클라이언트 개념이 여기선 한 칸 더 나아간다 — **e2e에서 클라이언트는 실제 서비스 사용자다.**

다만 정확히 해둘 게 둘 있다.

첫째, **e2e가 통합과 구별되는 본질은 "계약을 검증해서"가 아니라 "out-of-process 의존성을 real로 건드려서"다.** 계약 검증은 거기서 따라오는 *결과*다. 둘째, e2e라고 *모든 걸* real로 띄우진 않는다. **결제·메일·외부 OAuth 같은 외부 서드파티 경계는 여전히 가짜(fake)로 대체한다.** 그러니 정확한 그림은 — *"내 시스템 전체를 real로 띄우되, 외부 경계만 fake"*다.

그리고 신뢰도엔 대가가 있다. **환경 구축이 어렵고, 느리고, 잘 깨진다(flaky).** 그래서 모든 기능을 e2e로 덮으려 하면 안 된다. 2편의 결론 그대로 — **critical path(핵심 사용자 경로)에만** 두고, 나머지는 더 싸고 빠른 단위·통합으로 내린다. "신뢰도가 높다"는 "많이 짜라"가 아니다.

---

## 2. 테스트의 기본 골격은 그대로다 — 셋업·액션·어썰션·티어다운

e2e도 테스트인 이상 작성법의 뼈대는 다른 테스트와 같다.

- **셋업(setup)** — 테스트할 상황을 만드는 사전 환경 구성
- **액션(action)** — 검증하려는 결과를 만드는 동작 (e2e에선 실제 사용자 플로우)
- **어썰션(assertion)** — 그 결과가 기대와 맞는지 판정
- **티어다운(teardown)** — 다음 테스트를 위해 환경·상태를 정리

그리고 1편 원칙은 e2e에서도 유효하다 — **구현(내부 state)이 아니라 클라이언트(=사용자)가 알아야 하는 동작을 검증**한다. 화면에 무엇이 보이고, 클릭하면 무엇이 일어나는가. 내부 변수가 어떤 값인지가 아니라.

---

## 3. 셋업과 티어다운 — 독립성을 지키는 한 쌍

**셋업**은 매 테스트가 공통으로 필요로 하는 준비를 묶는다. stub·mock·seed 데이터를 심거나, 특정 페이지에 미리 진입하거나, 선행 동작을 수행해 두는 일이다. Playwright에선 hook으로 건다.

```ts
test.beforeEach(async ({ page }) => { /* 매 테스트 전 */ })
test.beforeAll(async () => { /* describe(파일) 단위로 한 번 */ })
```

`beforeEach`는 **매 테스트 직전**, `beforeAll`은 그 **describe의 모든 테스트 전 한 번**만 돈다.

셋업엔 함정이 있다. **한 테스트의 셋업·동작이 다른 테스트를 오염시키면 안 된다.** 테스트는 서로 독립이어야 — 실행 순서가 바뀌어도, 하나만 따로 돌려도 같은 결과가 나와야 한다. 그래서 짝이 되는 게 **티어다운**이다.

```ts
test.afterEach(async () => { /* 매 테스트 후 정리 */ })
test.afterAll(async () => { /* describe 끝나고 한 번 */ })
```

티어다운은 셋업으로 만든 환경, 그리고 테스트 도중 mutate된 상태를 되돌려 **다음 테스트와의 독립성**을 지킨다.

---

## 4. Locator — 요소가 아니라 "찾는 방법"

액션을 하려면 먼저 동작할 요소를 잡아야 한다. Playwright는 이때 **locator**를 쓴다. 나도 여기서 처음에 헷갈렸다.

> **locator는 DOM 요소를 담은 객체가 아니다. 그 요소를 *찾는 방법*을 캡슐화한 객체다.**

```ts
const submit = page.getByRole('button', { name: 'Submit' })
```

이 한 줄은 아직 아무 요소도 찾지 않았다. *"Submit이라는 이름의 버튼을 이렇게 찾아라"*는 **방법을 선언**했을 뿐이다. 실제로 DOM을 뒤지는 순간은 — 그 locator로 **동작을 하거나 평가를 할 때**다.

```ts
await submit.click()   // ← 이 순간 비로소 요소를 찾는다
```

그래서 locator는 **매번 다시 찾는다(re-resolve).** 같은 locator를 두 번 쓰면 두 번 다 그 시점의 DOM에서 새로 찾는다. 이 "늦게, 매번 찾는" 성질이 뒤에 나올 auto-waiting의 토대다.

![Locator는 요소가 아니라 찾는 방법 — 선언 시점엔 DOM을 보지 않고, 동작·평가하는 순간에 매번 resolve된다](/blog/good-test-e2e-playwright/locator-lazy.svg)

요소를 찾는 방법은 사용자가 화면을 인지하는 방식과 가깝게 쓰는 게 좋다 — `getByRole`(역할+이름), `getByText`(텍스트), `getByLabel`(폼 라벨). 적당한 게 없을 때만 `getByTestId`로 내려간다. (Testing Library를 써봤다면 익숙할 텐데, 실제로 이 방향성은 그쪽과 닮았다.)

---

## 5. Actionability와 auto-waiting — 왜, 무엇을 기다리나

동작 직전, Playwright는 그 요소가 **조작 가능한 상태(actionable)인지** 확인하고, 그렇게 될 때까지 자동으로 기다린다. 확인 항목은 다섯이다.

- **Visible** — 보이는가 (빈 영역·`visibility:hidden`이 아닌가)
- **Stable** — 흔들리지 않는가 (애니메이션 등으로 움직이지 않고 두 프레임 연속 같은 위치)
- **Receives events** — 클릭 지점의 hit target인가 (다른 요소에 *가려지지 않았는가*)
- **Enabled** — 비활성(`disabled`)이 아닌가
- **Editable** — (폼 입력일 때) 수정 가능한가 (readonly가 아닌가)

여기서 정확히 짚을 두 가지가 있다.

**(1) actionability와 "요소를 찾는 것"은 별개다.** disabled 버튼은 DOM에 **있으므로 locator가 찾는다.** 다만 click의 `Enabled` 체크를 통과 못 해 — *요소를 못 찾는 게 아니라* — **동작을 미루고 기다리다 timeout으로 실패**한다. "찾았지만 아직 누를 수 없다"이지 "못 찾는다"가 아니다.

**(2) 다섯 항목을 항상 다 보는 게 아니다. 동작마다 다르다.**

| 동작 | 확인하는 항목 |
|---|---|
| `click()` | Visible, Stable, Receives events, Enabled |
| `fill()` | Visible, Enabled, Editable |
| `hover()` | Visible, Stable, Receives events |
| `selectOption()` | Visible, Enabled |
| `press()` | (없음) |

`fill`은 Stable·Receives events를 안 보고, `click`은 Editable을 안 본다. 동작이 실제로 필요로 하는 조건만 검사한다.

이 모든 대기는 비동기다. 그래서 Playwright의 동작은 **Promise**다 — 요소가 actionable해지는 걸 기다렸다가 resolve된다. 그러니 거의 모든 동작 앞에 `await`이 붙는다.

---

## 6. Web-first 어썰션과 flaky — `await`의 위치가 전부다

요소 찾기·동작만 기다리는 게 아니다. **어썰션도 기다린다.** 이게 Playwright의 핵심 설계, **web-first assertion**이다.

왜 중요한가. e2e는 결과가 **시스템 전반의 흐름에 걸쳐** 나타난다. 데이터를 받아오고, 렌더하고, 화면에 뜨기까지 — 매 실행마다 걸리는 시간이 다르다. 그 결과가 나타날 때까지 **실제 사용자처럼 기다려야** 한다. web-first 어썰션은 조건이 만족될 때까지 자동으로 재시도(retry)한다.

```ts
// ✅ web-first — 조건이 만족될 때까지 retry
await expect(locator).toBeVisible()
```

`await`이 **`expect` 전체 앞에** 붙는 게 핵심이다. 반대로 이렇게 쓰면 flaky해진다.

```ts
// ❌ 즉시평가 — 그 순간의 스냅샷. retry 없음
expect(await locator.isVisible()).toBe(true)
```

여기선 `await`이 **안쪽**에 있다. `isVisible()`로 *지금 이 순간의 값*을 먼저 뽑아 일반 `expect`에 넣었다. 요소가 0.1초 뒤에 나타난다면? 이 테스트는 실패한다. 나타나는 타이밍에 따라 결과가 들쭉날쭉 — 바로 **flaky**다. **단언에 즉시평가를 쓰면 retry가 빠진다.** web-first는 이 문제를 없애려고 택한 방식이다.

![flaky를 가르는 건 await의 위치 — 즉시평가는 한 점에서 떠본 스냅샷이라 요소가 늦으면 실패하고, web-first는 조건이 만족될 때까지 폴링하며 retry한다](/blog/good-test-e2e-playwright/await-position.svg)

그렇다고 즉시평가가 늘 나쁜 건 아니다. **값을 뽑아 계산해야 할 땐** 정당하다. 단, 함정이 하나 있다.

> 카운트의 기본값이 "0"인 화면을 생각해보자. 데이터가 도착하기 *전에* 카운트를 즉시평가하면 — 멀쩡히 0을 얻는다. 로딩 중인데도 "0"이라 통과해버린다.

그래서 값을 뽑기 *전에* **먼저 web-first 어썰션으로 로드를 동기화**해야 한다.

```ts
// 먼저 web-first로 "데이터가 떴다"를 보장하고 (= 로드 동기화)
await expect(totalCount).toHaveText('5')
// 그 다음에 값을 뽑아 계산한다
const n = Number(await todayCount.innerText())
```

DOM이 아닌 값(API 응답, 계산 결과)을 기다려야 하면 `expect.poll`, 임의 조건 블록이면 `expect.toPass`를 쓴다.

```ts
await expect.poll(async () => (await api.get('/status')).code).toBe(200)
```

**auto-waiting과 web-first 어썰션은 서로 다른 지점에서 작동**한다는 걸 기억해두자. auto-waiting은 *액션(click/fill) 직전*에 걸리고, web-first 어썰션은 *결과를 단언*할 때 retry한다. 액션이 없는 순수 동기화(데이터 로드 대기 등)는 auto-waiting이 안 걸리니, 반드시 어썰션이나 `waitFor`로 명시해야 한다.

---

## 7. Trusted 이벤트 — 진짜 입력을 쏜다

Playwright는 click·fill 같은 동작을 **실제 브라우저 입력 파이프라인에 직접** 흘려보낸다. 스크립트로 이벤트 객체를 만들어 `dispatchEvent`하는 방식이 아니다.

이 차이가 왜 중요한가. 웹 표준에는 `Event.isTrusted`라는 게 있다 — 실제 사용자 제스처로 발생한 이벤트는 `true`, 스크립트로 만든 합성(synthetic) 이벤트는 `false`다. 그리고 **브라우저는 `isTrusted=false`인 합성 이벤트에 대해, 사용자 제스처를 요구하는 보안 민감 API를 제대로 실행하지 않는다** — 파일 선택창 열기, 클립보드 접근, 팝업, 전체화면 같은 것들. (단, 합성 이벤트라도 *일반* 클릭 핸들러·상태 변경·라우팅은 대부분 동작한다. "합성이면 아무것도 안 된다"는 아니다.)

> 출처를 정확히: `isTrusted`는 **웹 표준** 용어다. Playwright 문서가 "trusted"라고 부르는 게 아니라, *실제 입력 파이프라인으로 쏘기 때문에 결과적으로 trusted 이벤트가 된다.*

이게 신뢰도 있는 테스트를 가능하게 한다. 그리고 5절의 **Receives events** 체크와 맞물린다 — 합성 `dispatchEvent`는 타겟을 직접 지정하니 **모달에 가려진 요소도 클릭**할 수 있다. 하지만 Playwright의 진짜 클릭은 좌표로 입력을 쏘므로, **가려진 요소엔 닿지 못한다.** 실제 사용자가 가려진 버튼을 누를 수 없는 것과 똑같다.

![모달이 버튼을 가린 상황 — 합성 이벤트는 타겟을 직접 지정해 모달을 뚫고 도달하지만, Playwright의 진짜 입력은 좌표로 발사돼 모달에 막힌다(receives events 실패)](/blog/good-test-e2e-playwright/trusted-hit-test.svg)

(그래서 가림을 무시하고 강제로 누르려면 `dispatchEvent`나 `click({ force: true })`로 actionability 체크를 *우회*해야 하는데, 이건 "실제 사용자 조건"을 포기하는 거라 권장되지 않는다.)

---

## 8. 픽스처 — 셋업/티어다운을 "필요할 때만" 가져다 쓴다

테스트를 쓰다 보면 같은 셋업·티어다운을 여러 테스트가 공유하게 된다. 이때 쓰는 게 **픽스처(fixture)** 다. 픽스처는 셋업과 티어다운을 하나의 단위로 묶어 이름 붙인 것이다.

```ts
export const test = base.extend({
  seededData: async ({}, use) => {
    await seed()              // ← 셋업
    await use(data)           // ← 이 픽스처를 쓰는 테스트가 실행되는 지점
    await cleanup()           // ← 티어다운
  },
})
```

`use()` **이전이 셋업, 이후가 티어다운**이다. 값을 내보낼 땐 `use(data)`로 넘기고, 값이 필요 없으면 셋업/티어다운만 둬도 된다.

hook과의 **결정적 차이는 on-demand**다. `beforeEach`/`afterEach`는 그 범위의 모든 테스트에 *무조건* 실행된다. 픽스처는 **테스트가 인자로 *요청할 때만*** 셋업된다.

```ts
test('데이터가 필요한 테스트', async ({ page, seededData }) => { /* seed 됨 */ })
test('데이터가 필요 없는 테스트', async ({ page }) => { /* seed 안 됨 */ })
```

`seededData`를 인자로 적은 테스트만 시드를 받는다. 필요 없으면 안 쓰면 그만이다.

픽스처에도 **스코프**가 있다. test 스코프는 매 테스트마다, worker 스코프는 워커당 한 번 셋업되어 여러 테스트가 **공유**한다.

```ts
seededData: [async ({}, use) => { /* ... */ }, { scope: 'worker' }]
```

나도 처음엔 *"셋업은 매 테스트마다 독립적으로 돈다"*고 생각했는데, 따져보니 정확하지 않았다. **셋업 빈도는 스코프가 결정**한다. worker 스코프는 공유된다. 그러면 테스트 격리는 어떻게 지키나? Playwright가 **page·context를 매 테스트 새로 만들어** 격리를 보장한다. 그래서 무거운 셋업은 worker로 공유하되 — **read-only일 때만 안전**하다. 상태를 mutate하는 셋업을 worker로 공유하면 테스트끼리 간섭해 격리가 깨진다.

Playwright는 **빌트인 픽스처**도 준다 — `page`, `context`, `browser`, `browserName`, `request`. 여기에 우리가 **커스텀 픽스처**로 원하는 환경을 더할 수 있고, 픽스처끼리 조합(한 픽스처가 다른 픽스처에 의존)도 된다. **option 픽스처**로 만들면 기본값을 두고 테스트별로 오버라이드할 수 있다.

```ts
test.use({ locale: 'ko' })   // 이 파일/describe에서만 기본값을 덮어씀
```

### storageState — 인증 상태 재사용, 단 "절반"

e2e에서 매 테스트마다 로그인 UI를 거치는 건 낭비다. 그래서 인증 상태를 저장해 재사용하는 **storageState**가 있다. 로그인 한 번 한 뒤 컨텍스트의 **cookie · localStorage · IndexedDB를 JSON으로 저장**하고(주의: **sessionStorage는 제외**), 이후 테스트가 그걸 주입해 로그인 상태로 시작한다.

```ts
test.use({ storageState: 'auth/user.json' })
```

원리는 단순하다 — 로그인하면 서버가 인증 자격(세션 쿠키나 토큰)을 브라우저에 심는다. storageState는 **그 저장소를 통째로 떠놨다가 다시 심는다.** 그러면 서버 입장에선 "이미 인증된 요청"으로 보인다.

![storageState는 인증의 절반만 복원한다 — 브라우저 측 cookie·localStorage·IndexedDB는 JSON으로 복원하지만, 쿠키가 가리키는 서버 측 세션 저장소는 건드리지 못한다](/blog/good-test-e2e-playwright/storagestate-half.svg)

여기에 중요한 한계가 있다. **storageState가 복원하는 건 브라우저 측 상태뿐이다 — 인증의 절반이다.**

- **토큰 방식**(JWT를 localStorage에): 토큰 자체가 자격이라 storageState만으로 충분하다.
- **서버사이드 세션 방식**(쿠키 = 서버 세션을 가리키는 *포인터*): 쿠키를 복원해도 **서버 측에 대응 세션이 없으면** 서버가 "그런 세션 없음" 하고 로그인 페이지로 튕긴다. → 서버 측 세션도 함께 맞춰줘야 한다.
- **토큰을 메모리에만** 들고 헤더에 싣는 방식: 메모리는 저장소가 아니라 storageState가 못 잡는다. 다만 보통 refresh 자격이 쿠키에 있어 앱이 부팅하며 재발급한다. 그것마저 없다면 `setExtraHTTPHeaders` 등으로 토큰을 주입해야 하는데 — 이건 실제 로그인 흐름을 건너뛰는 거라 그만큼 신뢰도를 내준다.

즉 *"인증 상태는 기본적으로 클라이언트 상태이고, 서버 처리가 더 필요하면 따로 해줘야 한다"* — 이 한 문장이 storageState를 정확히 요약한다.

---

## 9. Page Object Model — 중복을 한곳으로

테스트를 쌓다 보면 같은 요소·동작이 여러 테스트에 흩어진다. 이걸 페이지 단위로 모으는 게 **Page Object Model(POM)** 이다. 한 페이지의 요소(locator)와 동작(메서드)을 클래스에 선언해 두고, 테스트는 그걸 가져다 쓴다.

```ts
class LoginPage {
  readonly email = this.page.getByLabel('Email')
  readonly password = this.page.getByLabel('Password')
  readonly submit = this.page.getByRole('button', { name: 'Sign in' })

  constructor(private page: Page) {}

  async login(email: string, pw: string) {
    await this.email.fill(email)
    await this.password.fill(pw)
    await this.submit.click()
  }
}
```

가장 큰 이점은 **유지보수**다. 페이지의 요소나 흐름이 바뀌어도 **테스트를 일일이 고치는 게 아니라 PO 한 곳만** 고치면 된다. 그래서 테스트에서 `page.locator()`를 직접 쓰는 대신, 셀렉터는 PO에 모은다.

### PO에 어썰션을 둬도 되나? — Fowler의 예외

흔히 "PO에 어썰션을 넣지 마라"고 한다. Martin Fowler도 같은 입장이다 — *"Page objects ... should not make assertions themselves"* (데이터 접근 책임과 단언 로직이 섞여 PO가 비대해진다). 하지만 그는 **예외**를 명시한다.

> *"These assertions are those that check the **invariants of a page** ... rather than **specific things that a test is probing**."*

갈리는 기준은 **"이게 맞나?(검증)" vs "동작이 완료됐나?(불변식·동기화)"** 다.

- ❌ PO에 두면 안 되는 것: **테스트가 검증하려는 특정 기대**. "로그인하면 대시보드가 보인다" 같은 판정은 테스트의 몫이다.
- ✅ PO에 둬도 되는 것: **메서드의 완료를 보장하는 동기화 단언/대기**. 예컨대 "탭 전환" 메서드가 전환이 *끝날 때까지* 기다리지 않고 반환하면, 호출한 테스트가 전환 도중의 화면을 평가하는 race에 빠진다. 그래서 그런 메서드는 안에서 web-first로 "전환이 끝났다"를 단언해 **캡슐화**하는 게 오히려 권장되는 방식이다.

이건 6절과 연결된다 — auto-waiting은 *액션 시점*에만 걸리니, 액션이 없는 완료 보장은 PO 메서드 안에 web-first 단언이나 `waitFor`로 넣어야 한다.

### PO 설계, 몇 가지 실전 규칙

- **locator는 `readonly` 필드, 동작은 메서드**로.
- **DOM 상태에 따라 가리키는 대상이 달라지는 locator**(목록의 N번째 등)는 필드로 고정하지 말고 **메서드 안에서 매번 조회**한다.
- **한 번만 쓰는 locator는 PO에 넣지 않는다(YAGNI).**
- **외부 서비스에 의존하는 로직**(메일함 조회 등)은 PO가 아니라 테스트 헬퍼로 뺀다 — PO는 페이지만 알아야 한다.

이 규칙들의 공통 목적은 하나다 — PO가 모든 걸 떠안는 **god class**가 되지 않게 하는 것.

---

## 마무리

Playwright의 거의 모든 설계는 한 문장으로 꿰인다 — **"실제 사용자처럼."** locator를 늦게·매번 찾는 것, 동작 전에 actionable을 기다리는 것, 어썰션을 retry하는 것, 진짜 입력을 쏘아 가려진 요소를 못 누르는 것까지. 전부 *사람이 화면 앞에서 실제로 하는 일*을 흉내 내려는 장치다.

그래서 e2e가 신뢰도가 높다. 그리고 같은 이유로 느리고 비싸다. 1·2편의 결론이 여기서 다시 만난다 — **e2e는 사용자가 실제로 보는 동작을, critical path에 한해, 사용자처럼 검증한다.** 그게 좋은 e2e 테스트라고 본다.

이걸로 "좋은 테스트란 무엇인가" 세 편을 닫는다. 무엇이 좋은 테스트인가(1편), 어디에 두나(2편), 그리고 e2e는 어떻게 쓰나(3편).
