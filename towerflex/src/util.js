// ===== util.js : 수학, 난수, 노이즈, 색 =====
var VERSION = 'v2.3.1';
// ---------- v2.0 등록 고리 (docs/ENGINE.md). 어느 파일에서든 끼울 수 있게 맨 앞 파일에 둠. 등록돼 있으면 그것을 쓰고 없으면 기존 동작 ----------
// 논리: TW_ACT[kind](g, t, dt), TW_INIT[kind](g, t), TW_SOLD[kind](g, t), EN_AB[적 키] = { spawn, tick, hurt, die }, PROJ_UPD[p.kind](g, p, dt) → true면 끝, UNIT_UPD[u.kind](g, u, dt) → true면 없앰, RULES[규칙 키] = { init, tick, ... }
// 그리기: PROJ_DRAW[p.kind](x, g, p, S, time), UNIT_DRAW[u.kind](x, g, u, S, time), FX_EV[사건 이름](g, ev). 덮개는 함수 EN_OVER, TW_OVER를 정의하면 불림
var TW_ACT = {}, TW_INIT = {}, TW_SOLD = {}, EN_AB = {}, PROJ_UPD = {}, UNIT_UPD = {}, RULES = {};
var PROJ_DRAW = {}, UNIT_DRAW = {}, FX_EV = {};
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function d2(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function hyp(ax, ay, bx, by) { return Math.sqrt(d2(ax, ay, bx, by)); }
function rngOf(seed) {
  var s = seed >>> 0;
  return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function easeOut(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t) * (1 - t); }
function easeIn(t) { t = clamp(t, 0, 1); return t * t * t; }
function easeIO(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeBack(t) { t = clamp(t, 0, 1); var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function angDiff(a, b) { var d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
function fmt(n) { n = Math.floor(n); return n >= 10000 ? (Math.floor(n / 1000) / 10) + '만' : String(n); }

// ---------- 값 노이즈 ----------
function makeNoise(seed) {
  var r = rngOf(seed), N = 256, v = new Float32Array(N * N);
  for (var i = 0; i < v.length; i++) v[i] = r();
  function sm(t) { return t * t * (3 - 2 * t); }
  function n2(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var x0 = xi & 255, y0 = yi & 255, x1 = (x0 + 1) & 255, y1 = (y0 + 1) & 255;
    var a = v[y0 * N + x0], b = v[y0 * N + x1], c = v[y1 * N + x0], d = v[y1 * N + x1];
    var u = sm(xf), w = sm(yf);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  }
  function fbm(x, y, oct) {
    var s = 0, amp = 0.5, f = 1, tot = 0;
    for (var o = 0; o < (oct || 4); o++) { s += n2(x * f + o * 17.3, y * f + o * 9.1) * amp; tot += amp; amp *= 0.5; f *= 2.03; }
    return s / tot;
  }
  return { n2: n2, fbm: fbm };
}

// ---------- 색 ----------
var _hxc = {};
function hx(c) {
  var k = _hxc[c]; if (k) return k;
  var s = c.charAt(0) === '#' ? c.slice(1) : c;
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  k = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  _hxc[c] = k; return k;
}
function hexOf(r, g, b) { return '#' + ((1 << 24) | (clamp(Math.round(r), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(b), 0, 255)).toString(16).slice(1); }
function mixc(a, b, t) { var A = hx(a), B = hx(b); return hexOf(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
// 밝게: 따뜻한 빛 쪽으로, 어둡게: 차가운 그늘 쪽으로 (그림이 덜 밋밋해짐)
function lit(c, k) { return mixc(c, '#fff4d8', k); }
function drk(c, k) { return mixc(c, '#14121f', k); }
function rgba(c, a) { var A = hx(c); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
