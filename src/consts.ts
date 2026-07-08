// 사이트 전역 데이터. `import` 로 어디서든 불러 쓸 수 있다.

export const SITE_TITLE = 'crowwan';
export const SITE_DESCRIPTION = 'crowwan 의 개발 블로그 — 매일 쌓는 기록';

// Google Analytics 4 측정 ID. 공개 식별자라 커밋해도 안전하다.
export const GA_MEASUREMENT_ID = 'G-F8ZYMBESPD';

// 시리즈(연재) 중앙 매핑.
// 키: 글 frontmatter 의 series 값(표시명, 한글). 값: URL slug 와 소개 문구.
// 여기 등록된 시리즈만 /series 목록·개별 페이지가 생성된다.
export const SERIES: Record<string, { slug: string; description: string }> = {
	'번역 키를 컴파일 타임에 잡기': {
		slug: 'i18n-type-safe',
		description:
			'번역 키를 그냥 문자열이 아니라 타입으로 다뤄, 오타·미정의 키를 컴파일 타임에 잡아가는 과정.',
	},
	'좋은 테스트': {
		slug: 'good-tests',
		description: '무엇을·어디에·어떻게 — 구현이 아니라 동작을 검증하는 테스트를 찾아간 기록.',
	},
	'Todo 앱에 TDD 적용해보기': {
		slug: 'todo-tdd',
		description: 'Todo 앱을 만들며 TDD 사이클을 직접 굴려본 연습 기록.',
	},
};
