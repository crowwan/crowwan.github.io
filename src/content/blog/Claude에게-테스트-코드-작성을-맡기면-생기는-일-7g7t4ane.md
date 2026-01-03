---
title: "Claude에게 테스트 코드 작성을 맡기면 생기는 일"
pubDate: 2026-01-03
description: "AI와 협업하는 테스트 자동화 워크플로우"
tags: ["Claude", "MCP", "자동화", "테스트"]
---

> AI와 협업하는 테스트 자동화 워크플로우

## 🤔 테스트 코드, 누가 작성하나요?

테스트 코드 작성은 중요하지만... 솔직히 귀찮습니다.

TC(Test Case)는 Qase에 잘 정리되어 있는데, 막상 코드로 옮기려면:

- TC 내용 확인하고
- 어떤 파일에 테스트를 작성할지 고민하고
- 패턴에 맞게 코드 작성하고
- TC ID 연결하고...

> "이거 Claude한테 시키면 안 될까?"

그래서 만들었습니다. **Qase MCP + Claude** 워크플로우.

---

## 🎯 목표: Claude가 TC 보고 테스트 코드 작성하기

핵심 아이디어는 간단합니다:

1. **Qase에 TC가 있다** → Claude가 MCP로 직접 조회
2. **로컬에 상태 추적 파일이 있다** → 어떤 TC가 자동화 안 됐는지 파악
3. **Claude에게 요청** → TC 기반으로 테스트 코드 생성
4. **jest-qase-reporter** → 테스트 결과가 Qase에 자동 동기화

---

## 🔧 구성 요소

### 1. Qase MCP 설정

Claude Code가 Qase API를 직접 호출할 수 있게 해주는 MCP 서버입니다.

```json
{
    "servers": {
          "mcp-qase": {
                  "command": "npx",
                  "args": ["-y", "mcp-qase"],
                  "env": {
                            "QASE_API_TOKEN": "<your-token>"
                  }
          }
    }
}
```

이제 Claude에게 이렇게 말할 수 있습니다:

> "Qase에서 CROWN 프로젝트의 Suite 133에 있는 TC 목록을 조회해줘"

### 2. 로컬 상태 추적 파일

Qase의 TC를 로컬에서 추적하는 JSON 파일입니다.

```json
{
    "summary": { "total": 70, "automated": 48, "notStarted": 22 },
    "testCases": [{
          "id": 13255,
          "title": "[Path] Path Default 값 확인",
          "automationStatus": "not_started",
          "recommendedApproach": "component",
          "targetFile": "src/renderer/components/SoftwareItem.tsx"
    }]
}
```

핵심 필드:
- `automationStatus`: not_started → in_progress → automated
- `recommendedApproach`: unit, component, main-process, e2e
- `targetFile`: 테스트 대상 파일 경로

### 3. jest-qase-reporter

테스트 결과를 Qase에 자동으로 동기화합니다.

```typescript
it(qase(13255, "exe 파일 검색 실패 시 에러 표시"), () => {
    // 테스트 로직
});
```

---

## 💬 Claude에게 테스트 작성 요청하기

### 기본 요청

> TC 13255 "[Path] Path Default 값 확인"에 대한 테스트 코드를 작성해줘.
> recommendedApproach: component
> targetFile: src/renderer/components/SoftwareItem.tsx

Claude는:
1. Qase MCP로 TC 상세 내용 조회
2. targetFile 컴포넌트 분석
3. recommendedApproach에 맞는 테스트 패턴 적용
4. qase(TC_ID) 데코레이터로 TC 연결

### 배치 요청

> automationStatus가 "not_started"이고 category가 "Port"인 TC들의 테스트 코드를 작성해줘.

여러 TC를 한 번에 처리할 수 있습니다.

---

## 📝 테스트 코드 패턴

### unit (상수, 유틸 함수)

```typescript
describe("PORT_SOFTWARE_LIST", () => {
    it(qase(13250, "MILLBOX 기본 포트는 8321"), () => {
          const millbox = PORT_SOFTWARE_LIST.find(s => s.id === "MILLBOX");
          expect(millbox?.defaultPort).toBe(8321);
    });
});
```

### component (React 컴포넌트)

```typescript
describe("SoftwareItem", () => {
    it(qase(13254, "exe 파일 검색 성공 시 경로 표시"), () => {
          renderWithTheme(<SoftwareItem config={hyperDent} path="/path/to/file.exe" />);
      expect(screen.getByDisplayValue("/path/to/file.exe")).toBeInTheDocument();
});
});
```

---

## 🎉 결과

이 워크플로우의 장점:

1. **TC → 테스트 코드 변환 자동화**: Claude가 TC 보고 테스트 코드 생성
2. **일관된 패턴**: recommendedApproach별로 표준화된 패턴 적용
3. **추적 가능**: JSON 파일로 자동화 진행 상황 파악
4. **양방향 동기화**: 테스트 결과가 Qase에 자동 기록

**즉, TC만 잘 작성해두면 테스트 코드 작성은 Claude와 함께 빠르게 처리할 수 있습니다.**

---

## 📚 마무리

테스트 코드 작성이 귀찮다면, **구조화된 워크플로우**로 해결하세요.

1. TC를 Qase에 잘 정리한다
2. 로컬 JSON으로 상태를 추적한다
3. Claude에게 TC 기반 테스트 코드 생성을 요청한다
4. jest-qase-reporter로 결과를 자동 동기화한다

**AI는 반복적인 코드 작성을 대신해주고, 개발자는 TC 설계와 검증에 집중할 수 있습니다.**

---

**TL;DR:**
- Qase MCP로 Claude가 TC 직접 조회
- JSON 파일로 자동화 상태 추적
- Claude에게 TC 기반 테스트 코드 생성 요청
- 개발자는 TC 설계에 집중, 코드 작성은 AI와 협업
