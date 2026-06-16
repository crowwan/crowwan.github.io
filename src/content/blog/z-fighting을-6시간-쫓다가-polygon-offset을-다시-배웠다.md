---
title: "z-fighting을 6시간 쫓다가 polygon offset을 다시 배웠다"
pubDate: 2026-06-16
description: "VTK에선 정상이던 화면이 three.js로 옮기자 두 군데서 깨졌다. 결론은 셰이더 한 줄이지만, 거기까지의 경로가 사실상 전부였다."
tags: ["three.js", "WebGL", "3D", "회고", "디버깅"]
---

> VTK에선 정상이던 화면이 three.js로 옮기자 두 군데서 깨졌다.
> 결론은 셰이더 한 줄이지만, **거기까지의 경로가 사실상 전부였다.**

---

치과 CAD 뷰어를 VTK 기반에서 three.js로 옮기는 마이그레이션을 진행했다. 스캔한 치아 메시 위에 보철물(crown)이나 모델(die) 메시를 얹어 보여주는 3D 뷰어다. VTK에선 정상이던 화면이 three.js로 전환하자 두 군데서 깨졌다.

이 글은 그 두 증상을 추적하며 거친 여러 번의 오진과, 최종 원인이었던 polygon offset의 두 가지 한계, 그리고 그것을 `gl_FragDepth`로 우회한 과정을 정리한 것이다.

![z-fighting 플리커: 스캔 메시가 모델 위 무작위 픽셀에 비쳐 자글거린다 → gl_FragDepth로 분리하면 깨끗해진다](/blog/zfighting-fragdepth/04-zfight-flicker.svg)

## 두 개의 증상 — 사실은 다른 문제였다

처음에는 한 문제로 판단했다. 실제로는 **서로 다른 두 종류의 z-fighting**이었고, 이 둘을 한 덩어리로 묶어 본 것이 디버깅이 길어진 핵심 원인이었다.

**증상 A — 자연치 위의 흰 점.** 모델 메시가 스캔 메시 위에 그려질 때, 겹치는 영역에 흰 점이 자글자글 떴다. 두 메시가 같은 치아 표면을 각자 그리고 있어 **depth가 정확히 동일**했다(coincident). depth가 같으면 깊이 테스트에 승자가 없어, 매 픽셀 어느 쪽이 이길지 비결정적으로 정해진다.

**증상 B — 보철물 표면의 회색 선.** 줌아웃이나 카메라 회전 시 보철물 표면에 가느다란 회색 선이 어른거렸다. 원인은 **보철물 안쪽 면의 테두리**가 바깥 면을 뚫고 비치는 것이었다. 같은 메시의 바깥 면과 안쪽 면이 동일한 depth를 가져 발생하는 self z-fighting이다.

| | 증상 A: 흰 점 | 증상 B: 회색 선 |
|---|---|---|
| 정체 | 두 메시(모델↔스캔)가 같은 면 중복 → **coincident** z-fight | 한 메시의 바깥/안쪽 면이 같은 depth → **self** z-fight |
| 핵심 | depth가 같아 tie-breaker 없음 | depth가 같아 tie-breaker 없음 |

![두 종류의 z-fighting 비교: A는 두 메시가 같은 depth로 겹친 coincident, B는 한 메시의 바깥·안쪽 면이 grazing 가장자리에서 충돌하는 self](/blog/zfighting-fragdepth/01-zfight-two-types.svg)

근본 원인은 둘 다 "depth가 같다"지만, 하나는 메시 두 개 사이, 다른 하나는 메시 하나 내부의 문제라 해결 방향이 달랐다.

## 오진의 행렬

z-fighting으로 보이는 증상은 원인이 여럿이고 해결책도 제각각이다. 그래서 의심되는 원인을 하나씩 결정적 실험으로 배제해 나갔으나, 대부분 빗나갔다.

**오진 1 — displacement로 모델을 앞으로.** 모델 메시의 정점을 normal 방향으로 0.01mm 부풀려 스캔보다 항상 앞에 오도록 했다. 흰 점이 사라졌다. 그러나 **텍스처가 있는 케이스에서만 정상**이었고, 텍스처 없는 단색 스캔에선 흰 점이 그대로였다. 텍스처 유무로 결과가 갈린 이유는 끝내 단정하지 못했고, 텍스처 패턴이 잔여 fight를 시각적으로 가린 것이라는 가설이 가장 유력했다. 결국 displacement는 근본 해결이 아니었다. 또한 displacement는 self z-fighting(증상 B)에는 애초에 무력하다. 한 메시를 자기 자신으로부터 분리할 수 없기 때문이다.

**오진 2 — normal 계산.** 레거시 뷰어와 음영(shading)이 미묘하게 달라, 굴곡이 심한 부분에서 normal 차이로 회색 선이 생긴다고 의심했다. normal 계산 방식을 레거시와 동일하게 맞췄으나 증상은 그대로였다. 이후 측정 결과 두 방식의 normal은 corner의 85~91%에서 1° 미만으로 사실상 동일했다. 원인이 아니었다.

**오진 3 — aliasing.** supersampling을 2배로 올리자 회색 선이 **옅어졌다.** aliasing으로 판단해 AA 방식을 여러 차례 바꿨다. 그러나 **옅어질 뿐 사라지지는 않았다.** 옅어진다는 것은 표면 샘플링이 관련은 있다는 의미지만, 완전히 제거되지 않는다는 것은 주 원인이 아니라는 의미였다.

오진이 쌓이면서 한 가지가 분명해졌다. **"VTK에선 정상"이라는 비교 기준을 정작 VTK 소스로 직접 확인한 적이 없었다.** 그것이 결국 답이었다.

## 범인은 polygon offset의 두 가지 한계

VTK 쪽 렌더링을 분석하니, coincident 면을 분리하기 위해 **fragment shader에서 깊이를 직접 보정**하고 있었다. three.js의 기본 mapper에는 그 처리가 없었다. three.js가 의존하는 것은 표준 **polygon offset**인데, 이 방식은 해당 케이스에서 두 가지 이유로 무력했다.

**한계 1 — 정밀도가 거칠다.** polygon offset이 더하는 bias는 depth buffer 정밀도 단위로 양자화된다. 일반적인 3D 씬의 z-fighting(벽에 붙인 데칼처럼 의도적으로 겹친 면)은 이 정도 bias로 충분히 분리된다. 대부분의 렌더링은 이 방식으로 문제가 없다. 그러나 치아 메시는 두 개의 별도 메시가 **동일한 물리적 표면**을 그리는, 차이가 사실상 0인 coincident 케이스였다. 거친 bias로는 안정적으로 분리되지 않았다.

**한계 2 — 환경 의존적이다.** polygon offset 공식에는 하드웨어가 구분 가능한 최소 depth 단위 `r`이 포함되는데, 이 `r`이 **드라이버/GPU마다 다르다.** 동일 코드가 환경에 따라 다르게 렌더링될 수 있다는 의미다.

결정적으로 polygon offset은 **self z-fighting(증상 B)을 구조적으로 해결하지 못한다.** 같은 material의 모든 폴리곤에 동일한 offset이 적용되므로, 한 메시의 바깥 면과 안쪽 면은 같은 양만큼 이동해 상대적 깊이차가 그대로 유지된다.

## 곁가지: polygon offset 공식은 왜 두 항인가

polygon offset의 깊이는 면의 기울기에 비례한다고 이해하기 쉽지만, 정확히는 **두 항**으로 구성되며 각각 담당이 다르다.

```
offset = factor × m   +   r × units
         └─ 기울기 항 ─┘     └─ 상수 항 ─┘
```

- **첫째 항 `factor × m`** — `m`은 면의 화면공간 깊이 기울기(픽셀 한 칸당 깊이 변화량)다. **비스듬히 누운(grazing) 면**을 담당한다. 면이 가파르게 기울수록 픽셀당 깊이 점프가 커지므로 offset도 그에 비례해 커진다.
- **둘째 항 `r × units`** — 기울기와 무관한 **상수 바닥값**이다. **정면을 보는 면**을 담당한다. 면이 카메라를 정면으로 향하면 기울기가 0이라 첫째 항이 사라지므로, 최소한의 분리를 이 상수 항이 보장한다.

첫째 항은 grazing 각, 둘째 항은 정면 각을 담당하며, 둘이 합쳐 전 각도를 커버한다. `glPolygonOffset`의 파라미터가 두 개(`factor`, `units`)인 이유다.

![polygon offset 공식의 두 항: 정면(head-on)에선 기울기 m이 0에 가까워 상수 항이 분리를 담당하고, grazing에선 기울기 항이 커져 그것만으로 분리된다. fix는 상수 항(units)을 0으로 둔다](/blog/zfighting-fragdepth/02-polygon-offset-two-terms.svg)

## 해법: 공식을 fragment shader로 옮기고, 상수 항을 0으로

VTK의 방식은 이 polygon offset **공식 자체를 rasterizer가 아닌 fragment shader로 이전한 것**이었다. depth를 `gl_FragDepth`로 직접 기록한다.

```glsl
gl_FragDepth = gl_FragCoord.z
             + factor * length(vec2(dFdx(z), dFdy(z)))  // 기울기 항
             + CONST  * offset;                          // 상수 항
```

`length(vec2(dFdx(z), dFdy(z)))`가 기울기 `m`이고, 하드웨어 `r`은 **하드코딩된 상수(1/65536, 16비트 깊이 정밀도)** 로 대체했다. three.js에서는 `material.onBeforeCompile`로 셰이더에 주입할 수 있다. 범용 예시는 다음과 같다.

```js
material.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <dithering_fragment>',
    `#include <dithering_fragment>
     float slope = length(vec2(dFdx(gl_FragCoord.z), dFdy(gl_FragCoord.z)));
     gl_FragDepth = gl_FragCoord.z + 2.0 * slope;`
  );
};
```

핵심 결정은 두 가지였다.

**(1) 상수 항(units)을 0으로.** 둘째 항을 제거하면 기울기 항만 남는다. 효과는 두 가지다. 첫째, **깊이 정밀도에 묶인 상수(`r`)에 의존하지 않으므로** 환경 독립적이 된다. 둘째, 남는 offset이 고정 상수가 아니라 **해당 지점의 geometry가 요구하는 만큼**의 값이 된다.

정면(기울기 0)에선 분리가 되지 않는다는 우려가 가능하다. 그러나 **회색 선이 발생하는 조건이 바로 줌아웃/회전, 즉 grazing 각**이다. fight가 가장 심한 grazing 각에서 기울기 항이 최대가 되는 구조이므로, 상수 바닥값 없이 기울기 항만으로 충분했다. 이는 우연이 아니라, 레거시 뷰어가 해당 면들의 offset 기본값을 `factor=2, offset=0`으로 설정해 둔 결과다. 임의로 튜닝한 값이 아니라 렌더링 엔진의 전역 기본 동작을 그대로 맞춘 것이며, 그 덕에 기존 뷰어와 픽셀 단위로 일치했다.

**(2) tier별로 방향을 다르게.** 이 부분이 의외로 중요한 디테일이었다.

| 대상 | 처리 | 방향 |
|---|---|---|
| 보철물(self z-fight) | gl_FragDepth | 뒤로 (+) |
| 스캔 | gl_FragDepth | 뒤로 (+) |
| 모델(die/base) | 미적용 | — |

![tier별 방향 분기: 모델을 앞으로 밀면 보철물을 뚫고 나오지만(왼쪽 ✗), 스캔만 뒤로 밀면 보철물·마진·베이스·스캔 layering이 보존된다(오른쪽 ✓)](/blog/zfighting-fragdepth/03-fix-tier-directions.svg)

초기 displacement 접근은 "모델을 **앞으로** 당긴다"였으나, 최종 해법은 반대로 **스캔을 뒤로 민다.** 모델을 앞으로 밀면 그 위에 얹힌 보철물까지 뚫고 나오기 때문이다. 모델에는 offset을 적용하지 않아 `보철물 > 마진 > 베이스/die > 스캔` 겹침 순서를 보존했다. 같은 셰이더라도 **적용 대상과 방향**이 결과를 결정했다.

비용도 존재한다. `gl_FragDepth`를 사용하면 early-z(픽셀 렌더링 전에 깊이로 미리 폐기하는 최적화)가 비활성화된다. 따라서 모든 메시가 아니라 **보철물과 스캔에만** 적용해 비용을 한정했다. polygon offset이 rasterizer 단계에서 동작해 이 비용이 없다는 것이 본래 장점이었던 만큼, 그것을 포기하는 대신 적용 범위를 좁힌 것이다.

## 남는 것

- **"보인다 ≠ 맞다."** displacement로 흰 점이 사라진 듯 보였으나 텍스처 케이스만 가려진 것이었고, supersampling으로 옅어진 현상을 aliasing으로 단정했으나 주 원인이 아니었다. 결과 기반 직관은 결정적 실험 이전까지는 가설일 뿐이다.
- **비교 기준부터 의심한다.** "VTK는 정상"이 디버깅 내내 전제였으나, 그 VTK가 *왜* 정상인지를 소스로 확인하지 않았다. 그 안에 답(coincident 면을 셰이더로 분리하는 로직)이 그대로 들어 있었다.
- **마이그레이션은 "드러나지 않던 암묵 동작"을 잃는 일이다.** polygon offset은 양쪽 모두 존재했으나, 한쪽은 그 위에 fragment-level 깊이 보정을 추가하고 있었다. 라이브러리를 교체하면 API는 이전되지만 이런 암묵적 보정은 조용히 누락된다. z-fighting은 그 손실이 픽셀로 드러난 지점이었다.
