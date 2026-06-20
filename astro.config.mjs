// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkCjkFriendly from 'remark-cjk-friendly';

// https://astro.build/config
export default defineConfig({
	site: 'https://crowwan.github.io',
	integrations: [mdx(), sitemap()],
	markdown: {
		// CJK(한글) 본문에서 닫는 ** / * 앞이 구두점이고 뒤에 한글이 붙어도
		// 강조가 인식되도록 CommonMark flanking 규칙을 완화한다.
		remarkPlugins: [remarkCjkFriendly],
		shikiConfig: {
			// 라이트 페이퍼 본문 속 다크 코드 카드 대비. 웜 다크 톤이라 매거진 결과 어울린다.
			theme: 'vesper',
			// 긴 줄을 가로 스크롤 대신 줄바꿈으로 처리해 가독성 확보.
			wrap: true,
		},
	},
});
