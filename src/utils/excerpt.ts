// 글 발췌문(excerpt) 추출 헬퍼.
// description 이 있으면 그대로 쓰고, 없으면 마크다운 본문에서 깨끗한 텍스트를
// 뽑아 첫 문장 일부를 발췌로 만든다. index / blog 양쪽에서 재사용한다.

// 발췌 길이(글자). 이 범위 안에서 자연스러운 경계(공백)를 찾아 자른다.
const MIN_LEN = 90;
const MAX_LEN = 110;

/**
 * 마크다운 원문(body)에서 발췌에 부적합한 문법/블록을 제거하고
 * 사람이 읽는 평문만 남긴다.
 */
function stripMarkdown(body: string): string {
	let text = body;

	// frontmatter 제거 (혹시 body 에 포함된 경우 대비).
	text = text.replace(/^---\n[\s\S]*?\n---\n/, '');

	// 펜스 코드 블록 (``` 또는 ~~~) 통째로 제거.
	text = text.replace(/```[\s\S]*?```/g, ' ');
	text = text.replace(/~~~[\s\S]*?~~~/g, ' ');

	// HTML 주석 / 태그 제거.
	text = text.replace(/<!--[\s\S]*?-->/g, ' ');
	text = text.replace(/<\/?[a-zA-Z][^>]*>/g, ' ');

	// 이미지 ![alt](url) → 제거 (먼저, 링크보다 우선).
	text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
	// 링크 [텍스트](url) → 텍스트만.
	text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
	// 참조 링크 정의 줄 제거.
	text = text.replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, ' ');

	// 줄 단위 정리: 헤딩(#), 인용(>), 리스트 마커, 표 구분선 제거.
	text = text
		.split('\n')
		.map((line) => {
			let l = line;
			l = l.replace(/^\s{0,3}#{1,6}\s+/, ''); // 헤딩
			l = l.replace(/^\s{0,3}>\s?/, ''); // 인용
			l = l.replace(/^\s{0,3}[-*+]\s+/, ''); // 불릿 리스트
			l = l.replace(/^\s{0,3}\d+\.\s+/, ''); // 번호 리스트
			return l;
		})
		// 표 구분선(|---|---|) 같은 줄은 통째로 버린다.
		.filter((line) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(line) || line.trim() === '')
		.join('\n');

	// 인라인 강조/코드 마커 제거 (`, *, _, ~).
	text = text.replace(/`([^`]*)`/g, '$1');
	text = text.replace(/[*_~]+/g, '');

	// 수평선 제거.
	text = text.replace(/^\s*([-*_])(?:\s*\1){2,}\s*$/gm, ' ');

	// 공백 정리: 개행/연속 공백 → 단일 공백.
	text = text.replace(/\s+/g, ' ').trim();

	return text;
}

/**
 * description 또는 본문에서 발췌문을 만든다.
 * 코드/장식만 있어 본문이 비면 빈 문자열을 반환(목록에서 발췌 생략).
 */
export function getExcerpt(description: string | undefined, body: string | undefined): string {
	const desc = description?.trim();
	if (desc) return desc;

	const clean = stripMarkdown(body ?? '');
	if (!clean) return '';

	if (clean.length <= MAX_LEN) return clean;

	// MIN~MAX 구간에서 마지막 공백을 찾아 단어 중간 절단을 피한다.
	const window = clean.slice(0, MAX_LEN);
	const lastSpace = window.lastIndexOf(' ');
	const cut = lastSpace >= MIN_LEN ? lastSpace : MAX_LEN;

	return clean.slice(0, cut).trimEnd() + '…';
}
