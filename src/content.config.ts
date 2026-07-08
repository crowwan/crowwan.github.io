import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// `src/content/blog/` 디렉토리의 Markdown / MDX 파일을 로드한다.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// frontmatter 스키마 (zod) — 최소 필드만 강제한다.
	schema: z.object({
		title: z.string(),
		// 문자열을 Date 객체로 변환한다.
		pubDate: z.coerce.date(),
		description: z.string().optional(),
		tags: z.array(z.string()).optional(),
		// velog 썸네일 등 원격 URL 또는 로컬 경로 문자열.
		heroImage: z.string().optional(),
		updatedDate: z.coerce.date().optional(),
		// 시리즈(연재) 표시명 — src/consts.ts 의 SERIES 매핑 키와 일치해야 한다.
		series: z.string().optional(),
		// 시리즈 내 순서(1부터).
		seriesOrder: z.number().optional(),
	}),
});

export const collections = { blog };
