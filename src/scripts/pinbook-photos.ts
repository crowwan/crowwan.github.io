// 핀북 소개 페이지의 사진 견본: 앱 견본처럼 하늘 그라데이션 + 산.
// 지도 캔버스(날아가는 사진·핀)와 벌집 칸(CSS 배경)이 같은 색을 쓴다.

// [하늘 위, 하늘 아래, 산]
type Palette = readonly [string, string, string];

const PALETTES: readonly Palette[] = [
	['#B9D3E3', '#E8D8C2', '#6E8B5E'],
	['#F2B07A', '#F6D6A8', '#5B3A3A'],
	['#9FB8C8', '#DDE5E8', '#4E6B78'],
	['#E9A07E', '#F3CBA5', '#7A3B2E'],
	['#C7D3BF', '#EEE7D6', '#7C8F63'],
	['#2E3B55', '#C46B4A', '#1E2433'],
];

const paletteOf = (photo: number): Palette => PALETTES[photo % PALETTES.length];

// 캔버스에 (x, y) 에서 한 변 size 인 사진 견본을 그린다.
export function paintPhoto(g: CanvasRenderingContext2D, x: number, y: number, size: number, photo: number) {
	const [skyTop, skyBottom, mountain] = paletteOf(photo);
	const sky = g.createLinearGradient(x, y, x, y + size);
	sky.addColorStop(0, skyTop);
	sky.addColorStop(1, skyBottom);
	g.fillStyle = sky;
	g.fillRect(x, y, size, size);
	g.fillStyle = mountain;
	g.beginPath();
	g.moveTo(x, y + size);
	g.lineTo(x + size * 0.38, y + size * 0.48);
	g.lineTo(x + size * 0.6, y + size * 0.68);
	g.lineTo(x + size * 0.78, y + size * 0.52);
	g.lineTo(x + size, y + size * 0.75);
	g.lineTo(x + size, y + size);
	g.closePath();
	g.fill();
}

// 같은 견본을 CSS background 값으로 (벌집 칸용, 빌드 때 HTML 에 넣는다).
export function photoBackground(photo: number): string {
	const [skyTop, skyBottom, mountain] = paletteOf(photo);
	return `linear-gradient(162deg, transparent 0 55%, ${mountain} 55.5% 100%) bottom/100% 60% no-repeat, linear-gradient(${skyTop}, ${skyBottom})`;
}
