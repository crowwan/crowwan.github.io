---
title: "E2E 테스트 인프라, Docker + EKS 삽질기 (그리고 EC2로 돌아온 이유)"
pubDate: 2026-01-03
description: "\"제대로 해보자\"며 Docker + EKS로 시작했습니다. 3일 만에 포기하고 EC2로 돌아왔습니다. 그 삽질의 기록과, 오버엔지니어링에서 배운 것들."
tags: ["aws", "e2e", "playwright", "오버엔지니어링"]
---

> "제대로 해보자"며 Docker + EKS로 시작했습니다.
> 3일 만에 포기하고 EC2로 돌아왔습니다.
> 그 삽질의 기록과, 오버엔지니어링에서 배운 것들.

---

## 🎯 시작: "이왕 하는 거 제대로 하자"

회사에서 제대로 된 E2E 테스트가 없는 상황에서 뒤늦게 테스트들을 추가하게 되었습니다. 하나 둘 테스트가 늘어나면서 이 테스트들이 실제 가치를 발휘할 수 있어야 한다는 팀장님의 요청이 있었습니다.

요구사항은 단순했습니다:

- Dev 환경에서 정기 E2E 테스트 실행
- 실패 시 팀 알림
- 개발자가 필요할 때 수동 실행 가능

하지만 저는 이렇게 생각했습니다:

> "어차피 만들 거, Docker 이미지로 만들고 EKS에 올리자.
> 나중에 스케일링도 되고, CI/CD 파이프라인에도 붙이기 좋잖아."

**첫 번째 실수는 여기서 시작됐습니다.**

---

## 🐳 1일차: Dockerfile 작성

"간단하겠지"라고 생각했습니다.

```dockerfile
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
CMD ["pnpm", "nx", "e2e", "e2e-cloud"]
```

**현실:**

- 모노레포 전체를 COPY하니 이미지가 **4GB**
- `.dockerignore` 최적화 시작
- `node_modules` 캐싱을 위한 multi-stage build 고민
- Private npm 패키지(`@imago-cloud`) 인증 문제 발생

```dockerfile
# Azure Artifacts 인증을 위한 ARG
ARG NPM_TOKEN
RUN echo "//pkgs.dev.azure.com/.../:_password=${NPM_TOKEN}" >> .npmrc
```

1일차가 끝날 때쯤, Dockerfile은 **80줄**이 넘어갔고
아직 EKS는 시작도 못 했습니다.

---

## ☸️ 2일차: EKS 설정 시작

Dockerfile이 어느 정도 완성되자, EKS 설정을 시작했습니다.

**해야 할 일 목록:**

- ECR 레포지토리 생성
- EKS 클러스터 설정 (기존 클러스터 사용? 새로 생성?)
- IAM 역할 및 정책 설정
- Kubernetes Deployment, CronJob 매니페스트 작성
- Secret 관리 (테스트 계정 비밀번호, npm 토큰)
- VPC/Subnet 네트워크 확인

```yaml
# e2e-cronjob.yaml (작성 중 포기)
apiVersion: batch/v1
kind: CronJob
metadata:
  name: e2e-cloud-test
spec:
  schedule: "0 9 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: e2e-runner
              image: xxxx.dkr.ecr.ap-northeast-2.amazonaws.com/e2e-runner:latest
              env:
                - name: STAGE
                  value: "qa"
              # ... Secret 마운트는 어떻게 하지?
              # ... Playwright 브라우저가 컨테이너에서 제대로 돌까?
```

**2일차 끝날 때 상황:**

- ECR에 이미지는 올렸음
- 로컬 Docker에서는 테스트가 돌아감
- **EKS Pod에서 Chromium 실행 시 크래시 발생**
- "headless Chrome in container" 구글링 시작...

---

## 🤯 3일차: 현타

3일째 아침, 저는 이런 상태였습니다:

```
✅ Dockerfile 작성 (80줄, multi-stage)
✅ ECR 이미지 푸시
✅ 로컬 Docker 테스트 성공
🔄 EKS CronJob 설정 중...
❌ 컨테이너 내 Chromium 크래시 디버깅 중
❌ Secret 관리 방식 미결정
❌ 네트워크 설정 미완료
❌ 실제 E2E 테스트는 아직 한 번도 Dev에서 안 돌려봄
```

그리고 문득 이런 생각이 들었습니다:

> **"잠깐, 내가 지금 뭘 하고 있는 거지?"**

요구사항을 다시 봤습니다:

- Dev 환경에서 정기 E2E 테스트 실행 ← **아직 한 번도 못 함**
- 실패 시 팀 알림 ← **인프라도 못 만듦**
- 수동 실행 가능 ← **SSH로 EC2 들어가면 바로 되는데?**

저는 "E2E 테스트 실행"이 아니라 **"EKS 인프라 구축"**을 하고 있었습니다.

---

## 🔄 방향 전환: EC2로 돌아가자

점심 먹고 결정했습니다.

> "EC2에 레포 clone해서 직접 돌리자.
> 지금 당장 테스트가 돌아가는 게 더 중요하다."

### EC2 구축 타임라인

| 시간  | 작업                                   | 상태 |
| ----- | -------------------------------------- | ---- |
| 14:00 | EC2 인스턴스 생성                      | ✅   |
| 14:15 | Node.js, pnpm 설치                     | ✅   |
| 14:30 | Azure DevOps SSH 키 설정               | ✅   |
| 15:00 | 레포 clone, npm 패키지 설치            | ✅   |
| 15:30 | Playwright 브라우저 설치               | ✅   |
| 16:00 | **첫 E2E 테스트 Dev 환경에서 성공** 🎉 | ✅   |

**2시간.**

Docker + EKS로 3일 동안 못 한 걸, EC2로 **2시간 만에** 해결했습니다.

```bash
# 이게 전부였습니다
ssh ec2devtest
cd ~/dentbird-solutions
STAGE=dev pnpm nx e2e e2e-cloud
```

---

## 💡 오버엔지니어링의 징후들

돌아보니, 처음부터 경고 신호가 있었습니다.

### 1. "나중에 필요할 것 같아서"

- "나중에 스케일링하려면 EKS가 좋지"
  → 하루에 2-3번 돌릴 E2E 테스트에 스케일링이 필요할까?

- "CI/CD 파이프라인에 붙이려면 컨테이너가 좋지"
  → SSH 명령어 한 줄이면 되는데?

- "다른 프로젝트에서도 재사용하려면..."
  → 지금 이 프로젝트 하나도 못 돌리고 있는데?

### 2. 본질을 잊음

**목표**: E2E 테스트를 QA에서 돌리기
**현실**: Dockerfile 최적화, EKS IAM 정책, Chromium 컨테이너 이슈...

수단이 목적이 되어버렸습니다.

### 3. "제대로" 해야 한다는 강박

- "EC2에 직접 배포하는 건 좀 구식 아니야?"
- "요즘은 다 컨테이너로 하잖아"
- "나중에 관리하기 힘들 텐데..."

이런 생각들이 판단을 흐리게 했습니다.

---

## 🛠️ 지금의 아키텍처

```
┌──────────────────────────────────────────────────┐
│  EC2 Instance (Amazon Linux 2023)                │
│  ┌────────────────────────────────────────────┐  │
│  │ dentbird-solutions (Git Clone)             │  │
│  │ ├── apps/e2e/cloud/                        │  │
│  │ ├── apps/e2e/account/                      │  │
│  │ └── apps/e2e/backoffice/                   │  │
│  └────────────────────────────────────────────┘  │
│  Node.js 20 + pnpm 10 + Playwright              │
└──────────────────────────────────────────────────┘
         ▲
         │ SSH (VPN)
    개발자 / CI Pipeline
```

단순합니다. 그리고 **잘 돌아갑니다.**

---

## 🚀 자동화 로드맵

"단순하게 시작하고, 필요할 때 확장한다"는 원칙으로 자동화를 진행했습니다.

### Phase 1: Cron 스케줄링 ⏰

```bash
# 매일 오전 9시, 오후 6시 자동 실행
0 9,18 * * * cd ~/dentbird-solutions && STAGE=dev pnpm nx e2e e2e-cloud >> /var/log/e2e.log 2>&1
```

### Phase 2: Teams 알림 🔔

테스트 결과를 Teams Webhook으로 즉시 알림.


### Phase 3: Claude Code 자동화 🤖

여기서 한 단계 더 나아갔습니다. **Claude Code**를 EC2에 설치해서 "변경사항 감지 → 관련 테스트 선별 → 실행 → 알림"까지 자동화했습니다.

```
┌─────────────────────────────────────────────────────────────────┐
│  Cron (매 10분)                                                  │
│  └─ git pull → 변경 감지                                         │
│      └─ Claude Code 실행                                         │
│          └─ 변경 파일 분석 → 관련 TC 추출 → 테스트 실행           │
│              └─ 결과 → TC Manager API + Teams 알림               │
└─────────────────────────────────────────────────────────────────┘
```

**핵심 아이디어**: Claude가 변경된 코드를 보고 "이 변경이면 이 TC들을 돌려야겠다"를 판단합니다.

```bash
# 크론잡 설정
*/10 * * * * /home/ec2-user/e2e-cron-wrapper.sh
```

실패한 TC가 있으면? Claude가 자동으로 수정을 시도하고 PR까지 생성합니다.

**"단순하게 시작하고, 필요할 때 확장한다"**는 원칙을 지키면서도, AI를 활용해 자동화의 수준을 높일 수 있었습니다.


---

## 📚 배운 것들

### 1. YAGNI (You Aren't Gonna Need It)

"나중에 필요할 것 같아서" 미리 만드는 건
대부분 **시간 낭비**입니다.

### 2. 작동하는 소프트웨어가 먼저

완벽한 인프라 < **지금 당장 돌아가는 테스트**

### 3. 복잡함은 비용이다

- **EKS**: 학습 곡선 + 설정 시간 + 디버깅 시간 + 유지보수
- **EC2**: SSH 접속해서 명령어 실행

어떤 게 더 비용이 적을까요?

### 4. "요즘 트렌드"를 경계하자

"요즘 다들 쿠버네티스 쓰잖아"
→ 근데 **우리 상황에 맞아?**

---

## 마무리

3일간의 삽질 끝에 깨달았습니다.

**좋은 엔지니어링은 "최신 기술을 쓰는 것"이 아니라
"문제에 맞는 해결책을 찾는 것"입니다.**

EC2 직접 배포가 "구식"처럼 느껴질 수 있습니다.
하지만 2시간 만에 문제를 해결하고,
지금도 매일 안정적으로 E2E 테스트가 돌아가고 있습니다.

나중에 정말 EKS가 필요해지면, 그때 전환하면 됩니다.

---

**TL;DR:**

- Docker + EKS로 3일 삽질
- EC2로 2시간 만에 해결
- 오버엔지니어링 주의
- 작동하는 게 먼저, 확장은 나중에
