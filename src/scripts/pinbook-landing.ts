// 핀북 소개 페이지(/pinbook) 인터랙션.
// 1 지도: 누르면 사진이 날아가 꽂히고 나라가 칠해짐 / 2 벌집: 빈 칸을 누르면 참 /
// 3 쓰는 법: 스크롤 따라 폰 화면이 바뀜 / 화면에 들어오면 살짝 떠오름.
// 움직임 줄이기 설정이면 모션 없이 결과만 보여 준다.
import { paintPhoto } from './pinbook-photos';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const darkScheme = matchMedia('(prefers-color-scheme: dark)');

// ── 1 · 지도 ──

interface Land {
	path: Path2D;
	cx: number;
	cy: number;
	rx: number;
	ry: number;
	fill: number;
	visited: boolean;
}
// 사진이 꽂힐 자리. 땅 중심에서 (u·가로 반지름, v·세로 반지름) 만큼 떨어진 곳.
// 땅 기준이라 화면 크기나 땅 배치(넓은 화면 ↔ 좁은 화면)가 바뀌어도 제 땅에 남는다.
interface Spot {
	land: number;
	u: number;
	v: number;
}
interface Pin extends Spot {
	photo: number;
	t: number;
	ring: number;
	ringTo: number;
}
interface Flight extends Spot {
	photo: number;
	sx: number;
	sy: number;
	cx: number;
	cy: number;
	t: number;
	rot: number;
}
interface Ripple {
	x: number;
	y: number;
	t: number;
}
type LandShape = readonly [number, number, number, number];

// 땅 덩어리 [중심 x, 중심 y, 가로 반지름, 세로 반지름] (캔버스 크기 비율).
// 넓은 화면: 카드·폰 뒤까지 깔리는 첫 화면 전체 지도.
const WIDE_LANDS: readonly LandShape[] = [
	[0.07, 0.3, 0.15, 0.2],
	[0.26, 0.7, 0.18, 0.16],
	[0.52, 0.2, 0.13, 0.15],
	[0.7, 0.6, 0.12, 0.24],
	[0.9, 0.22, 0.09, 0.13],
	[0.14, 0.9, 0.13, 0.09],
	[0.55, 0.92, 0.17, 0.09],
	[0.96, 0.78, 0.07, 0.14],
	[0.4, 0.45, 0.07, 0.08],
];
// 좁은 화면: 카드와 폰 사이의 낮은 지도 띠. 땅 개수를 같게 둬 칠한 나라가 이어진다.
const BAND_LANDS: readonly LandShape[] = [
	[0.13, 0.27, 0.14, 0.18],
	[0.33, 0.7, 0.15, 0.17],
	[0.52, 0.27, 0.12, 0.16],
	[0.74, 0.62, 0.12, 0.2],
	[0.9, 0.2, 0.08, 0.13],
	[0.1, 0.8, 0.08, 0.1],
	[0.56, 0.9, 0.1, 0.07],
	[0.93, 0.85, 0.05, 0.09],
	[0.33, 0.3, 0.06, 0.09],
];
// CSS 의 좁은 화면 기준과 같아야 한다(index.astro).
const narrowLayout = matchMedia('(max-width: 780px)');

// 한 땅 안에서 사진이 꽂힐 수 있는 자리 후보
// (좁은 화면의 작은 땅에서도 두 자리가 핀 하나로 합쳐지지 않을 만큼 벌린다)
const LANDING_SPOTS: ReadonlyArray<readonly [number, number]> = [
	[-0.4, 0.15],
	[0.4, 0.15],
	[0, -0.3],
	[0, 0],
];
const THEMES_PER_CITY = 6;
// 이 거리 안에 떨어지면 같은 도시 핀에 쌓인다.
const SAME_PIN_DISTANCE = 22;
// 첫 착지 자리는 카드·폰 가장자리와 캔버스 끝에서 이만큼 떨어뜨린다.
const CLEAR_MARGIN = 16;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeBack = (t: number) => {
	const c = 1.7;
	return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
const pixelRatio = () => Math.min(devicePixelRatio || 1, 2);

function setupMap(root: HTMLElement) {
	const canvas = root.querySelector('#map');
	const countryEl = root.querySelector('#sCountry');
	const photoEl = root.querySelector('#sPhoto');
	if (!(canvas instanceof HTMLCanvasElement) || !countryEl || !photoEl) return;
	const g = canvas.getContext('2d');
	if (!g) return;
	// 지도를 가리는 것(넓은 화면에서 카드와 폰)
	const covers = Array.from(root.querySelectorAll('.hero .card, .hero .phone'));
	startMap(root, canvas, g, countryEl, photoEl, covers);
}

function startMap(
	root: HTMLElement,
	canvas: HTMLCanvasElement,
	g: CanvasRenderingContext2D,
	countryEl: Element,
	photoEl: Element,
	covers: Element[],
) {
	let width = 0;
	let height = 0;
	let lands: Land[] = [];
	let pins: Pin[] = [];
	let flights: Flight[] = [];
	let ripples: Ripple[] = [];
	let photoCount = 0;

	const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

	function buildLands() {
		// 매번 같은 모양이 나오게 고정 씨앗 난수
		let seed = 11;
		const rnd = () => {
			seed = (seed * 9301 + 49297) % 233280;
			return seed / 233280;
		};
		const shapes = narrowLayout.matches ? BAND_LANDS : WIDE_LANDS;
		lands = shapes.map(([x, y, w, h], i) => {
			const cx = x * width;
			const cy = y * height;
			const rx = w * width;
			const ry = h * height;
			const points: Array<[number, number]> = [];
			for (let k = 0; k <= 28; k++) {
				const a = (k / 28) * Math.PI * 2;
				const r = 0.8 + rnd() * 0.32;
				points.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
			}
			const path = new Path2D();
			path.moveTo(points[0][0], points[0][1]);
			for (let k = 1; k < points.length; k++) {
				const [px, py] = points[k - 1];
				const [qx, qy] = points[k];
				path.quadraticCurveTo(px, py, (px + qx) / 2, (py + qy) / 2);
			}
			path.closePath();
			const old = lands.at(i);
			return { path, cx, cy, rx, ry, fill: old?.fill ?? 0, visited: old?.visited ?? false };
		});
	}

	// 땅 기준 자리 → 캔버스 좌표
	function spotPoint(spot: Spot) {
		const l = lands[spot.land];
		return { x: l.cx + spot.u * l.rx, y: l.cy + spot.v * l.ry };
	}

	function resize() {
		const rect = canvas.getBoundingClientRect();
		const ratio = pixelRatio();
		width = rect.width;
		height = rect.height;
		canvas.width = Math.round(width * ratio);
		canvas.height = Math.round(height * ratio);
		buildLands();
		draw();
	}

	function landAt(x: number, y: number) {
		// isPointInPath 의 점은 변환 전(실제 픽셀) 좌표
		return lands.findIndex((l) => g.isPointInPath(l.path, x * (canvas.width / width), y * (canvas.height / height)));
	}

	// 카드·폰에 가리지 않고 캔버스 안쪽인 자리인지
	function isClear(x: number, y: number) {
		if (x < CLEAR_MARGIN || y < CLEAR_MARGIN || x > width - CLEAR_MARGIN || y > height - CLEAR_MARGIN) return false;
		const origin = canvas.getBoundingClientRect();
		return covers.every((el) => {
			const r = el.getBoundingClientRect();
			const left = r.left - origin.left - CLEAR_MARGIN;
			const top = r.top - origin.top - CLEAR_MARGIN;
			const right = r.right - origin.left + CLEAR_MARGIN;
			const bottom = r.bottom - origin.top + CLEAR_MARGIN;
			return x < left || x > right || y < top || y > bottom;
		});
	}

	// 첫 착지: 세 장이 두 나라로(앞 나라에 두 장). 가리지 않은 자리가 있는 땅 중 오른쪽부터 고른다.
	function pickFirstLandings(): Spot[] {
		const candidates = lands
			.map((l, land) => {
				const spots = LANDING_SPOTS.map(([u, v]) => ({ land, u, v })).filter((spot) => {
					const p = spotPoint(spot);
					return isClear(p.x, p.y);
				});
				// 같은 땅의 두 자리는 핀이 겹치지 않게 떨어진 것만
				const apart = spots.filter((spot) => {
					const p = spotPoint(spot);
					const q = spotPoint(spots[0]);
					return spot === spots[0] || Math.hypot(p.x - q.x, p.y - q.y) >= SAME_PIN_DISTANCE * 1.5;
				});
				return { cx: l.cx, spots: apart };
			})
			.sort((a, b) => b.cx - a.cx);
		const first = candidates.find((c) => c.spots.length >= 2);
		const second = candidates.find((c) => c !== first && c.spots.length >= 1);
		if (!first || !second) return [];
		return [first.spots[0], second.spots[0], first.spots[1]];
	}

	function draw() {
		const ratio = pixelRatio();
		g.setTransform(ratio, 0, 0, ratio, 0, 0);
		g.clearRect(0, 0, width, height);
		const paper = token('--pb-bg');
		const visited = token('--lp-visited');
		const landLine = token('--lp-land-line');
		const visitedLine = token('--lp-visited-line');
		const accent = token('--pb-accent');
		const surface = token('--pb-surface');

		for (const l of lands) {
			g.fillStyle = paper;
			g.fill(l.path);
			if (l.fill > 0) {
				g.save();
				g.globalAlpha = l.fill;
				g.fillStyle = visited;
				g.fill(l.path);
				g.restore();
			}
			g.lineWidth = 1.2;
			g.strokeStyle = l.fill > 0.5 ? visitedLine : landLine;
			g.stroke(l.path);
		}
		for (const r of ripples) {
			g.beginPath();
			g.arc(r.x, r.y, r.t * 26, 0, Math.PI * 2);
			g.strokeStyle = accent;
			g.globalAlpha = 1 - r.t;
			g.lineWidth = 2;
			g.stroke();
			g.globalAlpha = 1;
		}
		for (const pin of pins) {
			const { x, y } = spotPoint(pin);
			const radius = 9 * (pin.t < 1 ? easeBack(pin.t) : 1);
			// 도시 링: 채운 테마 칸만큼
			g.beginPath();
			g.arc(x, y, radius + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, pin.ring));
			g.strokeStyle = accent;
			g.lineWidth = 2.5;
			g.stroke();
			g.save();
			g.beginPath();
			g.arc(x, y, radius, 0, Math.PI * 2);
			g.clip();
			paintPhoto(g, x - radius, y - radius, radius * 2, pin.photo);
			g.restore();
			g.beginPath();
			g.arc(x, y, radius, 0, Math.PI * 2);
			g.lineWidth = 2;
			g.strokeStyle = surface;
			g.stroke();
		}
		for (const f of flights) {
			// 2차 베지어 곡선을 따라 날아가며 작아진다
			const target = spotPoint(f);
			const t = easeInOut(f.t);
			const x = (1 - t) * (1 - t) * f.sx + 2 * (1 - t) * t * f.cx + t * t * target.x;
			const y = (1 - t) * (1 - t) * f.sy + 2 * (1 - t) * t * f.cy + t * t * target.y;
			const size = 34 - t * 18;
			g.save();
			g.translate(x, y);
			g.rotate((1 - t) * f.rot);
			g.shadowColor = 'rgba(0,0,0,.25)';
			g.shadowBlur = 8;
			g.fillStyle = surface;
			g.fillRect(-size / 2 - 3, -size / 2 - 3, size + 6, size + 6);
			g.shadowBlur = 0;
			paintPhoto(g, -size / 2, -size / 2, size, f.photo);
			g.restore();
		}
	}

	let lastTime = 0;
	let running = false;
	function tick(time: number) {
		const dt = Math.min(0.05, (time - (lastTime || time)) / 1000);
		lastTime = time;
		let busy = false;
		for (const f of flights) {
			f.t += dt / 0.9;
			busy = true;
		}
		for (const f of flights.filter((f) => f.t >= 1)) land(f, f.photo);
		flights = flights.filter((f) => f.t < 1);
		for (const pin of pins) {
			if (pin.t < 1) {
				pin.t = Math.min(1, pin.t + dt / 0.45);
				busy = true;
			}
			if (pin.ring < pin.ringTo) {
				pin.ring = Math.min(pin.ringTo, pin.ring + dt / 0.6);
				busy = true;
			}
		}
		for (const l of lands) {
			if (l.visited && l.fill < 1) {
				l.fill = Math.min(1, l.fill + dt / 0.6);
				busy = true;
			}
		}
		for (const r of ripples) {
			r.t += dt / 0.6;
			busy = true;
		}
		ripples = ripples.filter((r) => r.t < 1);
		draw();
		if (busy) {
			requestAnimationFrame(tick);
		} else {
			running = false;
			lastTime = 0;
		}
	}
	function kick() {
		if (running) return;
		running = true;
		requestAnimationFrame(tick);
	}

	function setStat(el: Element, value: number) {
		el.textContent = String(value);
		// 같은 클래스를 다시 붙여 튀는 모션을 재시작
		el.classList.remove('bump');
		void el.getBoundingClientRect();
		el.classList.add('bump');
	}

	function land(spot: Spot, photo: number) {
		const target = lands[spot.land];
		const at = spotPoint(spot);
		const near = pins.find((p) => {
			const q = spotPoint(p);
			return Math.hypot(q.x - at.x, q.y - at.y) < SAME_PIN_DISTANCE;
		});
		if (near) {
			near.ringTo = Math.min(1, near.ringTo + 1 / THEMES_PER_CITY);
			near.photo = photo;
			near.t = 0.4;
		} else {
			pins.push({ ...spot, photo, t: 0, ring: 0, ringTo: 1 / THEMES_PER_CITY });
		}
		const firstVisit = !target.visited;
		target.visited = true;
		photoCount++;
		setStat(photoEl, photoCount);
		if (firstVisit) setStat(countryEl, lands.filter((l) => l.visited).length);
	}

	function shoot(spot: Spot) {
		const photo = photoCount + flights.length;
		if (reduceMotion.matches) {
			// 모션 없이 결과만: 바로 꽂고 칠한다
			land(spot, photo);
			lands[spot.land].fill = 1;
			for (const pin of pins) {
				pin.t = 1;
				pin.ring = pin.ringTo;
			}
			draw();
			return;
		}
		const target = spotPoint(spot);
		const sx = width * 0.5 + (Math.random() - 0.5) * width * 0.2;
		const sy = height + 40;
		flights.push({
			...spot,
			photo,
			sx,
			sy,
			cx: (sx + target.x) / 2 + (Math.random() - 0.5) * 120,
			cy: Math.min(sy, target.y) - height * 0.35,
			t: 0,
			rot: (Math.random() - 0.5) * 0.8,
		});
		kick();
	}

	canvas.addEventListener('click', (e) => {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const landIndex = landAt(x, y);
		if (landIndex >= 0) {
			const l = lands[landIndex];
			shoot({ land: landIndex, u: (x - l.cx) / l.rx, v: (y - l.cy) / l.ry });
		} else if (!reduceMotion.matches) {
			// 바다를 누르면 물결만
			ripples.push({ x, y, t: 0 });
			kick();
		}
	});

	resize();
	// 창 크기, 좁은 화면 전환(지도 띠), 글꼴 로딩 등으로 크기가 바뀌면 다시 그린다.
	new ResizeObserver(resize).observe(canvas);
	// 다크 모드 전환(사이트는 시스템 설정만 따름) 시 새 색으로 다시 그린다.
	darkScheme.addEventListener('change', draw);
	reduceMotion.addEventListener('change', draw);

	pickFirstLandings().forEach((spot, i) => {
		setTimeout(() => shoot(spot), reduceMotion.matches ? 0 : 500 + i * 380);
	});
}

// ── 2 · 벌집 ──

const RING_LENGTH = 289;
const CELL_COUNT = 6;

function setupHive(root: HTMLElement) {
	const hive = root.querySelector('#hive');
	const ring = root.querySelector('#ring');
	const countEl = root.querySelector('#dexCount');
	const msg = root.querySelector('#dexMsg');
	const resetButton = root.querySelector('#dexReset');
	if (!(hive instanceof HTMLElement) || !(ring instanceof SVGElement) || !countEl || !msg) return;
	if (!(resetButton instanceof HTMLButtonElement)) return;
	startHive(hive, ring, countEl, msg, resetButton);
}

function startHive(hive: HTMLElement, ring: SVGElement, countEl: Element, msg: Element, resetButton: HTMLButtonElement) {
	const cells = Array.from(hive.querySelectorAll<HTMLButtonElement>('.hx'));
	// 처음부터 차 있던 칸(다시 하기에서 남겨 둔다)
	const initiallyFull = new Set(cells.filter((c) => c.classList.contains('full')));

	function update() {
		const filled = cells.filter((c) => c.classList.contains('full')).length;
		countEl.textContent = `${filled}/${CELL_COUNT}`;
		ring.style.strokeDashoffset = String(RING_LENGTH * (1 - filled / CELL_COUNT));
		for (const cell of cells) {
			const theme = cell.dataset.t ?? '';
			cell.setAttribute('aria-label', cell.classList.contains('full') ? `${theme}, 사진 있음` : `${theme}에 사진 넣기`);
		}
		if (filled === CELL_COUNT) {
			hive.classList.add('done');
			countEl.textContent = '완성!';
			msg.textContent = '오사카 완성! 이제 다른 도시로';
			resetButton.hidden = false;
		} else {
			msg.textContent = filled > 2 ? `${CELL_COUNT - filled}칸 남았어요` : '빈 칸을 눌러 채워 보세요';
		}
	}

	hive.addEventListener('click', (e) => {
		const cell = e.target instanceof Element ? e.target.closest('.hx') : null;
		if (!cell || cell.classList.contains('full')) return;
		cell.classList.add('full');
		update();
	});
	resetButton.addEventListener('click', () => {
		hive.classList.remove('done');
		for (const cell of cells) {
			if (!initiallyFull.has(cell)) cell.classList.remove('full');
		}
		resetButton.hidden = true;
		update();
	});
	update();
}

// ── 3 · 쓰는 법 ──

function setupHow(root: HTMLElement) {
	const stickImg = root.querySelector('#stickImg');
	if (!(stickImg instanceof HTMLImageElement)) return;
	const steps = Array.from(root.querySelectorAll<HTMLElement>('.step'));
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
				const current = entry.target;
				for (const step of steps) step.classList.toggle('on', step === current);
				const src = current.dataset.img;
				const alt = current.dataset.alt;
				if (!src || stickImg.getAttribute('src') === src) continue;
				const swap = () => {
					stickImg.src = src;
					if (alt) stickImg.alt = alt;
				};
				if (reduceMotion.matches) {
					swap();
					continue;
				}
				stickImg.style.opacity = '0';
				setTimeout(() => {
					swap();
					stickImg.style.opacity = '1';
				}, 160);
			}
		},
		{ rootMargin: '-45% 0px -45% 0px' },
	);
	for (const step of steps) observer.observe(step);
}

// ── 나타나기: 화면에 들어오면 (처음 화면에 이미 있는 건 바로 보임) ──

function setupRise(root: HTMLElement) {
	root.classList.add('is-js');
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.remove('pre');
				observer.unobserve(entry.target);
			}
		},
		{ threshold: 0.15 },
	);
	for (const el of root.querySelectorAll('.rise')) {
		if (reduceMotion.matches || el.getBoundingClientRect().top < innerHeight) el.classList.remove('pre');
		else observer.observe(el);
	}
}

const landingRoot = document.querySelector('.lp');
if (landingRoot instanceof HTMLElement) {
	setupRise(landingRoot);
	setupMap(landingRoot);
	setupHive(landingRoot);
	setupHow(landingRoot);
}
