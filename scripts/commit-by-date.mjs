// velog 에서 마이그레이션한 글들을 각 글의 실제 발행일(pubDate)로 git 커밋하는 스크립트.
// 목적: GitHub 기여 그래프(잔디)에 글의 실제 작성일이 반영되게 하는 것.
//
// 동작 요약
//  1. src/content/blog/*.md 의 frontmatter 에서 pubDate, title 을 읽는다.
//  2. pubDate 오름차순(과거→최근)으로 정렬한다.
//  3. 글마다 GIT_AUTHOR_DATE / GIT_COMMITTER_DATE 를 pubDate 로 설정해 개별 커밋한다.
//  4. 나머지 프레임워크 파일은 마지막에 현재 날짜로 한 번에 커밋한다.
//
// --dry-run 인자를 주면 실제 커밋 없이 커밋될 목록만 출력한다.

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const blogDir = join(projectRoot, "src", "content", "blog");

const isDryRun = process.argv.includes("--dry-run");

// 간단한 frontmatter 파서.
// 외부 패키지(gray-matter) 추가를 피하기 위해 필요한 필드(title, pubDate)만 직접 파싱한다.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();
    // 양쪽을 감싼 따옴표 제거 (title: "..." 형태)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return data;
}

// pubDate(YYYY-MM-DD) 를 커밋 시각용 ISO 형식으로 변환한다.
// 시간 정보가 없으므로 정오(12:00:00)로 고정한다.
function toCommitDate(pubDate) {
  return `${pubDate}T12:00:00`;
}

function readPosts() {
  const files = readdirSync(blogDir).filter((f) => f.endsWith(".md"));
  const posts = [];

  for (const file of files) {
    const fullPath = join(blogDir, file);
    const raw = readFileSync(fullPath, "utf-8");
    const { title, pubDate } = parseFrontmatter(raw);

    if (!pubDate) {
      console.warn(`⚠️  pubDate 없음, 건너뜀: ${file}`);
      continue;
    }

    posts.push({
      file,
      path: fullPath,
      relPath: relative(projectRoot, fullPath),
      title: title ?? file,
      pubDate,
    });
  }

  // pubDate 오름차순 정렬. 같은 날짜면 파일명으로 안정 정렬.
  posts.sort((a, b) => {
    if (a.pubDate !== b.pubDate) return a.pubDate < b.pubDate ? -1 : 1;
    return a.file < b.file ? -1 : 1;
  });

  return posts;
}

function git(args, extraEnv) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    env: { ...process.env, ...(extraEnv ?? {}) },
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function ensureGitRepo() {
  try {
    execFileSync("git", ["rev-parse", "--git-dir"], {
      cwd: projectRoot,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

function currentUserEmail() {
  try {
    return execFileSync("git", ["config", "user.email"], {
      cwd: projectRoot,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
}

function main() {
  const posts = readPosts();

  // 안전장치 1: git 저장소인지 확인
  if (!ensureGitRepo()) {
    console.error(
      [
        "❌ 아직 git 저장소가 아닙니다.",
        "",
        "먼저 아래를 실행하세요:",
        "  git init",
        '  git config user.email "<crowwan 계정에 등록된 이메일>"',
        "",
        "(잔디에 반영되려면 crowwan 계정에 등록된 이메일로 커밋해야 합니다.)",
      ].join("\n"),
    );
    process.exit(1);
  }

  // 안전장치 2: 어떤 이메일로 커밋되는지 사전 고지
  const email = currentUserEmail();
  console.log("─".repeat(60));
  console.log(`현재 git user.email : ${email || "(설정 안 됨)"}`);
  if (!email) {
    console.log(
      '⚠️  user.email 이 설정되지 않았습니다. git config user.email "<crowwan 이메일>" 먼저 설정하세요.',
    );
  }
  console.log(`커밋할 글 수        : ${posts.length}개`);
  console.log(`모드                : ${isDryRun ? "DRY-RUN (실제 커밋 안 함)" : "실제 커밋"}`);
  console.log("─".repeat(60));

  const total = posts.length;
  posts.forEach((post, idx) => {
    const n = idx + 1;
    const commitDate = toCommitDate(post.pubDate);
    const progress = `[${n}/${total}] ${post.pubDate}  ${post.title}`;

    if (isDryRun) {
      console.log(progress);
      return;
    }

    git(["add", "--", post.relPath]);
    git(["commit", "-m", `post: ${post.title}`], {
      GIT_AUTHOR_DATE: commitDate,
      GIT_COMMITTER_DATE: commitDate,
    });
    console.log(progress);
  });

  // 글 커밋이 끝난 뒤, 나머지 프레임워크 파일 전부를 현재 날짜로 한 번에 커밋한다.
  if (isDryRun) {
    console.log("─".repeat(60));
    console.log("[마지막] chore: Astro 블로그 셋업  (현재 날짜로 나머지 전부 커밋)");
    console.log("─".repeat(60));
    console.log("\nℹ️  dry-run 이므로 실제 커밋은 만들어지지 않았습니다.");
    return;
  }

  git(["add", "-A"]);
  // 추가로 스테이징된 변경이 있을 때만 커밋한다.
  const staged = execFileSync("git", ["diff", "--cached", "--name-only"], {
    cwd: projectRoot,
    encoding: "utf-8",
  }).trim();

  if (staged) {
    git(["commit", "-m", "chore: Astro 블로그 셋업"]);
    console.log("─".repeat(60));
    console.log("[마지막] chore: Astro 블로그 셋업  (현재 날짜로 나머지 전부 커밋)");
  } else {
    console.log("─".repeat(60));
    console.log("ℹ️  글 외에 커밋할 나머지 파일이 없습니다.");
  }

  console.log("─".repeat(60));
  console.log("✅ 완료. `git log --oneline` 로 확인하세요.");
  console.log("   원격 추가 후 push: git remote add origin <repo> && git push -u origin main");
}

main();
