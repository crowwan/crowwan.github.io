// 핀북 App Store 링크. 핀북 페이지(소개·지원·출시 안내)는 모두 여기서 가져다 쓴다.

// 앱 번호(Apple ID, 9~10자리 숫자). App Store Connect › 핀북 › 앱 정보 › 일반 정보의 'Apple ID' 값.
// 정식 출시 날 이 값을 넣고 머지한다.
export const PINBOOK_APP_STORE_ID = '';

// 배포 빌드(npm run build)에서 번호가 9~10자리 숫자가 아니면(비어 있을 때 포함) 빌드를 멈춘다.
// 실수로 머지돼도 배포가 막혀 지금 사이트가 그대로 남는다. dev 서버에서는 빈 번호로도 화면을 볼 수 있다.
const APP_STORE_ID_PATTERN = /^\d{9,10}$/;
if (import.meta.env.PROD && !APP_STORE_ID_PATTERN.test(PINBOOK_APP_STORE_ID)) {
	throw new Error(
		`핀북 App Store 앱 번호가 비어 있거나 9~10자리 숫자가 아니에요(지금 값: "${PINBOOK_APP_STORE_ID}"). ` +
			'src/data/pinbook.ts 의 PINBOOK_APP_STORE_ID 에 App Store Connect 의 Apple ID(9~10자리 숫자)를 넣고 다시 빌드해 주세요.',
	);
}

export const PINBOOK_APP_STORE_URL = `https://apps.apple.com/kr/app/id${PINBOOK_APP_STORE_ID}`;
