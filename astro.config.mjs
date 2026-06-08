// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://crowwan.github.io',
	integrations: [mdx(), sitemap()],
	markdown: {
		shikiConfig: {
			// 앰버톤 웜 다크 테마. 다크 테크 디자인 시스템과 결.
			theme: 'vesper',
			// 긴 줄을 가로 스크롤 대신 줄바꿈으로 처리해 가독성 확보.
			wrap: true,
		},
	},
});
