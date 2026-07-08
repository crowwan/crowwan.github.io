// 시리즈(연재) 관련 헬퍼.
// SERIES(consts.ts) 에 등록된 시리즈만 다루며, series 그룹핑/정렬을
// 시리즈 목록·개별·개별 글 네비 세 곳에서 공유한다.

import type { CollectionEntry } from 'astro:content';
import { SERIES } from '../consts';

type BlogPost = CollectionEntry<'blog'>;

// 시리즈 목록 페이지 카드 하나에 필요한 요약.
export interface SeriesSummary {
	// 표시명(= frontmatter series, SERIES 키).
	name: string;
	slug: string;
	description: string;
	// seriesOrder 오름차순 글 목록.
	posts: BlogPost[];
	// 시리즈 내 최신/최초 글 발행일.
	latest: Date;
	earliest: Date;
}

// 특정 시리즈에 속한 글들을 seriesOrder 오름차순으로 반환한다.
export function getSeriesPosts(posts: BlogPost[], seriesName: string): BlogPost[] {
	return posts
		.filter((post) => post.data.series === seriesName)
		.sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
}

// SERIES 에 등록되고 실제 글이 한 편 이상 있는 시리즈만 요약으로 만든다.
// 정렬: 각 시리즈 최신 글 발행일 내림차순(최근 연재가 위).
// 방어: SERIES 에 없는 series 값을 쓰는 글이 있으면 빌드 로그로 드러낸다.
export function getAllSeries(posts: BlogPost[]): SeriesSummary[] {
	const known = new Set(Object.keys(SERIES));
	for (const post of posts) {
		const name = post.data.series;
		if (name && !known.has(name)) {
			console.warn(`[series] "${post.id}" 의 series "${name}" 가 SERIES 매핑에 없어 무시됩니다.`);
		}
	}

	const summaries: SeriesSummary[] = [];
	for (const [name, meta] of Object.entries(SERIES)) {
		const seriesPosts = getSeriesPosts(posts, name);
		if (seriesPosts.length === 0) continue;
		const times = seriesPosts.map((post) => post.data.pubDate.valueOf());
		summaries.push({
			name,
			slug: meta.slug,
			description: meta.description,
			posts: seriesPosts,
			latest: new Date(Math.max(...times)),
			earliest: new Date(Math.min(...times)),
		});
	}

	summaries.sort((a, b) => b.latest.valueOf() - a.latest.valueOf());
	return summaries;
}
