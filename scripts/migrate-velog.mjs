// velog(@crowwan) 글 전체를 GraphQL API 로 긁어 src/content/blog/*.md 로 저장한다.
// 재실행 가능(idempotent): 같은 slug 파일은 덮어쓴다.
//
// 사용법: node scripts/migrate-velog.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'content', 'blog');

const ENDPOINT = 'https://v2.velog.io/graphql';
const USERNAME = 'crowwan';
const PAGE_LIMIT = 50;
const SLEEP_MS = 250;

const POSTS_QUERY = `
query($username:String,$limit:Int,$cursor:ID){
  posts(username:$username,limit:$limit,cursor:$cursor){ id title url_slug released_at tags }
}`;

const POST_QUERY = `
query($username:String,$url_slug:String){
  post(username:$username,url_slug:$url_slug){ title released_at tags series{name} body thumbnail }
}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function gql(query, variables) {
	const res = await fetch(ENDPOINT, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ query, variables }),
	});
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} ${res.statusText}`);
	}
	const json = await res.json();
	if (json.errors) {
		throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
	}
	return json.data;
}

// cursor 페이지네이션으로 전체 글 목록 수집.
async function fetchAllPostMetas() {
	const metas = [];
	let cursor = '';
	for (;;) {
		const data = await gql(POSTS_QUERY, {
			username: USERNAME,
			limit: PAGE_LIMIT,
			cursor,
		});
		const page = data.posts ?? [];
		metas.push(...page);
		console.log(`  목록 ${metas.length}개 수집 (이번 페이지 ${page.length}개)`);
		if (page.length < PAGE_LIMIT) break;
		cursor = page[page.length - 1].id;
		await sleep(SLEEP_MS);
	}
	return metas;
}

async function fetchPostBody(url_slug) {
	const data = await gql(POST_QUERY, { username: USERNAME, url_slug });
	return data.post;
}

// YYYY-MM-DD 로 변환.
function toDate(isoString) {
	if (!isoString) return '';
	return new Date(isoString).toISOString().slice(0, 10);
}

// YAML 문자열 안전 처리: 항상 더블쿼트로 감싸고 백슬래시/쿼트 이스케이프.
function yamlString(value) {
	const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	return `"${escaped}"`;
}

function yamlStringArray(values) {
	if (!values || values.length === 0) return '[]';
	return `[${values.map((v) => yamlString(v)).join(', ')}]`;
}

// 파일시스템 위험 문자만 정리하고 한글은 유지.
function safeFileName(url_slug) {
	return String(url_slug)
		.replace(/[/\\?%*:|"<>]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

// 본문 첫 문단에서 description 생성(마크다운 기호 일부 제거, 길이 제한).
function makeDescription(body) {
	if (!body) return '';
	const firstParagraph = body
		.split(/\n{2,}/)
		.map((p) => p.trim())
		.find((p) => p.length > 0 && !p.startsWith('![') && !p.startsWith('#'));
	if (!firstParagraph) return '';
	const plain = firstParagraph
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[#*`>_~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return plain.length > 150 ? `${plain.slice(0, 150)}...` : plain;
}

function buildMarkdown(post) {
	const lines = ['---'];
	lines.push(`title: ${yamlString(post.title)}`);
	lines.push(`pubDate: ${toDate(post.released_at)}`);
	const description = makeDescription(post.body);
	if (description) lines.push(`description: ${yamlString(description)}`);
	if (post.tags && post.tags.length > 0) {
		lines.push(`tags: ${yamlStringArray(post.tags)}`);
	}
	if (post.thumbnail) lines.push(`heroImage: ${yamlString(post.thumbnail)}`);
	lines.push('---');
	lines.push('');
	lines.push((post.body ?? '').trimEnd());
	lines.push('');
	return lines.join('\n');
}

async function main() {
	await mkdir(OUT_DIR, { recursive: true });

	console.log('velog 글 목록 수집 중...');
	const metas = await fetchAllPostMetas();
	console.log(`총 ${metas.length}개 글 발견.\n`);

	let saved = 0;
	const usedNames = new Set();
	for (const meta of metas) {
		try {
			const post = await fetchPostBody(meta.url_slug);
			if (!post) {
				console.warn(`  건너뜀(본문 없음): ${meta.url_slug}`);
				continue;
			}
			// 목록의 url_slug 를 파일명으로 쓰되 충돌 시 인덱스 부여.
			let name = safeFileName(meta.url_slug) || `post-${saved + 1}`;
			if (usedNames.has(name)) {
				name = `${name}-${saved + 1}`;
			}
			usedNames.add(name);

			const md = buildMarkdown(post);
			await writeFile(join(OUT_DIR, `${name}.md`), md, 'utf-8');
			saved += 1;
			console.log(`  [${saved}/${metas.length}] 저장: ${name}.md`);
		} catch (err) {
			console.error(`  실패: ${meta.url_slug} — ${err.message}`);
		}
		await sleep(SLEEP_MS);
	}

	console.log(`\n완료: ${saved}개 글 저장됨 → ${OUT_DIR}`);
}

main().catch((err) => {
	console.error('마이그레이션 실패:', err);
	process.exit(1);
});
