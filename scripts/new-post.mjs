// 오늘 날짜 frontmatter 가 채워진 빈 글 파일을 만든다.
//
// 사용법:
//   node scripts/new-post.mjs "글 제목"
//   npm run new -- "글 제목"

import { writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '..', 'src', 'content', 'blog');

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
	console.error('사용법: node scripts/new-post.mjs "글 제목"');
	process.exit(1);
}

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// 파일명용 slug: 공백을 하이픈으로, 위험 문자 제거(한글 유지).
const slug = title
	.replace(/[/\\?%*:|"<>]/g, '')
	.replace(/\s+/g, '-')
	.replace(/-+/g, '-')
	.replace(/^-|-$/g, '');

const fileName = `${today}-${slug}.md`;
const filePath = join(BLOG_DIR, fileName);

const exists = await access(filePath).then(
	() => true,
	() => false,
);
if (exists) {
	console.error(`이미 존재함: ${fileName}`);
	process.exit(1);
}

const escapedTitle = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const template = `---
title: "${escapedTitle}"
pubDate: ${today}
description: ""
tags: []
---

여기에 내용을 작성하세요.
`;

await writeFile(filePath, template, 'utf-8');
console.log(`생성됨: src/content/blog/${fileName}`);
