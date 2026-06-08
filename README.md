# crowwan 블로그

Astro 로 만든 정적 개발 블로그. GitHub Pages user 사이트로 배포되며 주소는 <https://crowwan.github.io> 다.

- 프레임워크: [Astro](https://astro.build) (Content Collections 기반)
- 글 위치: `src/content/blog/*.md`
- 배포: `main` 브랜치에 push 하면 GitHub Actions 가 자동 빌드 & 배포

## 새 글 쓰는 법

1. `src/content/blog/` 에 마크다운 파일을 만든다. 파일명은 `YYYY-MM-DD-제목.md` 형식을 권장한다.

   ```
   src/content/blog/2026-06-08-오늘-배운-것.md
   ```

2. frontmatter 를 채운다. 필수는 `title`, `pubDate` 두 개다.

   ```markdown
   ---
   title: "오늘 배운 것"
   pubDate: 2026-06-08
   description: "한 줄 요약 (선택)"
   tags: ["회고", "개발"]        # 선택
   heroImage: "https://..."      # 대표 이미지 URL (선택)
   ---

   여기에 본문을 마크다운으로 작성한다.
   ```

   | 필드 | 필수 | 설명 |
   | --- | --- | --- |
   | `title` | O | 글 제목 |
   | `pubDate` | O | 발행일 (`YYYY-MM-DD`) |
   | `description` | X | 요약 |
   | `tags` | X | 태그 배열 |
   | `heroImage` | X | 대표 이미지 URL |

3. 커밋하고 `main` 에 push 하면 GitHub Actions 가 자동으로 배포한다. (글 목록은 발행일 역순으로 정렬된다.)

### 헬퍼로 빠르게 만들기

오늘 날짜 frontmatter 가 채워진 빈 글을 한 번에 만든다.

```bash
npm run new -- "글 제목"
# → src/content/blog/2026-06-08-글-제목.md 생성
```

## 로컬 미리보기

```bash
npm install        # 최초 1회
npm run dev        # http://localhost:7777
```

빌드 검증:

```bash
npm run build      # dist/ 생성. 배포 전 이걸로 깨지는지 확인
```

## velog 재마이그레이션

velog(@crowwan) 의 글을 다시 긁어 `src/content/blog/` 로 덮어쓴다. 같은 slug 파일은 덮어쓰므로 재실행해도 안전하다.

```bash
node scripts/migrate-velog.mjs
# 또는
npm run migrate
```

## 프로젝트 구조

```
.
├── .github/workflows/deploy.yml   # GitHub Pages 자동 배포
├── astro.config.mjs               # site: https://crowwan.github.io
├── scripts/
│   ├── migrate-velog.mjs          # velog → 마크다운 마이그레이션
│   └── new-post.mjs               # 새 글 생성 헬퍼
└── src/
    ├── content.config.ts          # 블로그 컬렉션 스키마(zod)
    ├── content/blog/*.md          # 글
    ├── pages/                     # 홈, 블로그 목록, about, rss
    ├── layouts/BlogPost.astro     # 글 레이아웃
    └── components/                # Header, Footer 등
```

## 발행일로 커밋 히스토리 만들기

velog 에서 마이그레이션한 글들을 **각 글의 실제 발행일(`pubDate`)로 git 커밋**해서, GitHub 기여 그래프(잔디)에 글의 실제 작성일이 반영되게 한다. 글마다 개별 커밋(`post: <제목>`)을 만들고, 마지막에 블로그 프레임워크 파일 전부를 현재 날짜로 한 번에 커밋(`chore: Astro 블로그 셋업`)한다.

> ⚠️ **반드시 먼저 `git config user.email` 을 crowwan 계정에 등록된 이메일로 설정해야 잔디에 반영된다.**
> 이메일이 GitHub 계정과 일치하지 않으면 커밋은 만들어져도 기여 그래프에 점이 찍히지 않는다.

순서:

```bash
git init
git config user.email "<crowwan 계정에 등록된 이메일>"   # ⚠️ 필수

npm run commit-history -- --dry-run   # 미리보기: 어떤 글이 어떤 날짜로 커밋될지 목록만 출력
npm run commit-history                # 실제 실행: 발행일 순서로 글별 커밋 생성

# 원격 추가 후 push
git remote add origin git@github.com:crowwan/crowwan.github.io.git
git push -u origin main
```

`--dry-run` 은 실제 커밋을 만들지 않고, 정렬된 글 목록과 각 글의 커밋 날짜만 보여준다. 실행 전 `user.email` 이 올바른지 스크립트가 출력해 주므로 한 번 더 확인하자.

## 최초 배포 설정 (1회)

1. GitHub 에 `crowwan/crowwan.github.io` 저장소를 만들고 push 한다.
2. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 설정한다.
3. 이후 `main` push 시마다 자동 배포된다.
