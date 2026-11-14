// ===== art_enemy_ch2.js : 2장 '저주받은 밤' 적 16종 + 흡혈귀의 박쥐 모습(vampbat) =====
// art_enemy.js 의 방식 그대로(세 번 그리기: 크기 재기 → 외곽선 → 색칠, EN_DRAW[k] = { n, top, f(x, H, p) }, 오른쪽이 진행 방향, 기준점은 발밑)
// 1장과 다른 점: 2.5~3등신, 남보라 먹색의 진한 외곽선, 오른쪽 아래 그늘과 왼쪽 위 달빛 테두리광(2~3단 명암), 빛나는 눈. 좌표는 H 배수, y 는 위가 +
var E2K = '#160c2c', E2MOON = '#c6e6ff', E2_CC = {};
// 외곽선 색: 그 빛깔의 아주 진한 색을 남보라 먹색 쪽으로 (옅은 무채색은 먹색 그대로)
function e2Ink(c) {
  var v = E2_CC[c]; if (v) return v;
  var q = enHsl(c);
  return (E2_CC[c] = q[1] < 0.12 ? E2K : mixc(enRgb(q[0], Math.min(1, 0.45 + q[1] * 0.4), 0.17), E2K, 0.45));
}
function e2Shd(c, k) { return mixc(c, e2Ink(c), k); }
function e2M(H, pts) { var o = [], i; for (i = 0; i < pts.length; i++) o.push([pts[i][0] * H, -pts[i][1] * H]); return o; }
// 칠: 위 왼쪽 밝음 → 바탕 → 아래 오른쪽 어두움, 그늘 초승달(오른쪽 아래), 달빛 테두리광(왼쪽 위), 안쪽 선
// o: oc 외곽선 기준색, d 그늘 폭, sa 그늘 진하기, rl 0 이면 달빛 없음, ra 달빛 진하기, rc 달빛 색, al 반투명(외곽선도 같이), ln 0 이면 선 없음, lw 선 굵기
function e2F(x, s, c, o) {
  o = o || {};
  var lw = enLW * (o.lw || 1), al = o.al == null ? 1 : o.al;
  if (enMode === 2) { enBBbox(x, s.x0, s.y0, s.x1, s.y1, enOL + lw); return s; }
  if (enMode === 1) { var k = e2Ink(o.oc || c); x.save(); x.globalAlpha *= al; x.fillStyle = k; x.fill(s.p); x.lineWidth = enOL * 2 + lw; x.strokeStyle = k; x.stroke(s.p); x.restore(); return s; }
  var w = s.w(), h = s.h(), mn = Math.min(w, h);
  x.save(); x.globalAlpha *= al;
  var g = x.createLinearGradient(s.x0 + w * 0.2, s.y0, s.x0 + w * 0.7, s.y1);
  g.addColorStop(0, mixc(c, '#ffffff', o.hi == null ? 0.14 : o.hi)); g.addColorStop(0.5, c); g.addColorStop(1, e2Shd(c, o.lo == null ? 0.28 : o.lo));
  x.fillStyle = g; x.fill(s.p);
  // 그늘과 달빛은 한 번만 잘라(clip) 두 띠를 같이 칠함 (모양으로 자르고, 밀어 놓은 같은 모양을 뺀 나머지 = 가장자리 띠)
  var d = o.d == null ? mn * 0.16 : o.d, big = enLW * 50 * 0.15, sh = d > 0.7 && mn > Math.max(5, big), rl = o.rl !== 0 && mn > Math.max(7, big * 1.3); // 작은 조각은 띠를 생략 (자르기가 가장 비쌈)
  if ((sh || rl) && EN_DM) {
    var ga = x.globalAlpha, q, rd = Math.max(0.9, Math.min(d * 0.55, enLW * 2.2)), pad = d * 1.5 + rd * 2 + 2;
    x.save(); x.clip(s.p);
    if (sh) { q = new Path2D(); q.rect(s.x0 - pad, s.y0 - pad, w + pad * 2, h + pad * 2); q.addPath(s.p, new DOMMatrix([1, 0, 0, 1, -d * 0.75, -d * 0.6])); x.globalAlpha = ga * (o.sa == null ? 0.55 : o.sa); x.fillStyle = e2Shd(c, 0.6); x.fill(q, 'evenodd'); }
    if (rl) { q = new Path2D(); q.rect(s.x0 - pad, s.y0 - pad, w + pad * 2, h + pad * 2); q.addPath(s.p, new DOMMatrix([1, 0, 0, 1, rd, rd])); x.globalAlpha = ga * (o.ra == null ? 0.7 : o.ra); x.fillStyle = o.rc || E2MOON; x.fill(q, 'evenodd'); }
    x.restore();
  }
  if (o.ln !== 0) { x.lineWidth = lw; x.strokeStyle = e2Ink(o.oc || c); x.stroke(s.p); }
  x.restore();
  return s;
}
function e2Bl(x, H, pts, c, o) { return e2F(x, shp().blob(e2M(H, pts)), c, o); }
function e2Po(x, H, pts, c, o) { return e2F(x, shp().poly(e2M(H, pts)), c, o); }
function e2El(x, H, cx, cy, rx, ry, c, rot, o) { return e2F(x, shp().ell(cx * H, -cy * H, rx * H, ry * H, rot || 0), c, o || { d: Math.min(rx, ry) * H * 0.34, rl: Math.min(rx, ry) > 0.07 ? 1 : 0 }); }
// 팔다리(굵기가 변하는 둥근 막대)
function e2Li(x, H, a, b, w0, w1, c, o) { return e2F(x, limbShape(a[0] * H, -a[1] * H, b[0] * H, -b[1] * H, w0 * H, w1 * H), c, o || { d: Math.min(w0, w1) * H * 0.3, rl: 0 }); }
// 선 (3점이면 곡선). nol 이면 외곽선 없이 색칠 단계에서만 (무늬, 꿰맨 자국)
function e2Ln(x, H, pts, lw, c, nol, al) {
  if (enMode && nol) return;
  var P = new Path2D(), q = e2M(H, pts), i, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; lw = Math.max(0.7, lw * H);
  P.moveTo(q[0][0], q[0][1]);
  if (q.length === 3) P.quadraticCurveTo(q[1][0], q[1][1], q[2][0], q[2][1]); else for (i = 1; i < q.length; i++) P.lineTo(q[i][0], q[i][1]);
  if (enMode === 2) { for (i = 0; i < q.length; i++) { x0 = Math.min(x0, q[i][0]); y0 = Math.min(y0, q[i][1]); x1 = Math.max(x1, q[i][0]); y1 = Math.max(y1, q[i][1]); } enBBbox(x, x0, y0, x1, y1, lw / 2 + enOL); return; }
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  if (enMode) { x.lineWidth = lw + enOL * 2; x.strokeStyle = e2Ink(c); x.stroke(P); }
  else { if (al != null) x.globalAlpha *= al; x.lineWidth = lw; x.strokeStyle = c; x.stroke(P); }
  x.restore();
}
// 색칠 단계에서만 칠하는 면 (입, 눈구멍, 무늬)
function e2Pt(x, H, pts, c, al, blob) {
  if (enMode) return;
  var s = blob ? shp().blob(e2M(H, pts)) : shp().poly(e2M(H, pts));
  x.save(); if (al != null) x.globalAlpha *= al; x.fillStyle = c; x.fill(s.p); x.restore();
}
function e2Dot(x, H, cx, cy, r, c, al) { if (enMode) return; x.save(); if (al != null) x.globalAlpha *= al; x.fillStyle = c; x.beginPath(); x.arc(cx * H, -cy * H, Math.max(0.5, r * H), 0, 6.2832); x.fill(); x.restore(); }
function e2Glow(x, H, cx, cy, r, c, a) { enGlow(x, cx * H, -cy * H, r * H, c, a); }
// 빛나는 눈: 번지는 빛 + 밝은 알맹이 + 흰 심. 맞을 때 > < 눈 자리도 기록
function e2Eye(x, H, cx, cy, rx, ry, c, sd, gl) {
  e2Glow(x, H, cx, cy, Math.max(rx, ry) * (gl || 3.2), c, 0.6);
  if (enMode) return;
  var X = cx * H, Y = -cy * H, RX = Math.max(0.7, rx * H), RY = Math.max(0.7, ry * H);
  x.fillStyle = c; x.beginPath(); x.ellipse(X, Y, RX, RY, 0, 0, 6.2832); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.92)'; x.beginPath(); x.ellipse(X - RX * 0.12, Y - RY * 0.12, RX * 0.5, RY * 0.5, 0, 0, 6.2832); x.fill();
  enEyeRec(x, X, Y, Math.max(RX, H * 0.035), Math.max(RY, H * 0.035), sd || 1);
}
// 모양 안에 줄무늬 (붕대, 호박 골, 나뭇결): 색칠 단계에서만
function e2Bands(x, s, n, slope, c, lw, al) {
  if (enMode) return;
  x.save(); x.clip(s.p); x.globalAlpha *= al == null ? 0.6 : al; x.strokeStyle = c; x.lineWidth = lw; x.lineCap = 'round';
  var h = s.h() / n, w = s.w();
  for (var i = 0; i <= n; i++) { var y = s.y0 + i * h + (i % 2 ? h * 0.18 : 0); x.beginPath(); x.moveTo(s.x0 - 2, y - w * slope * (i % 2 ? 1 : -0.6)); x.lineTo(s.x1 + 2, y + w * slope * (i % 2 ? 1 : -0.6)); x.stroke(); }
  x.restore();
}
// 박쥐 한 마리 (정면): (cx, cy) 몸 가운데(H 배수, y 위 +), L 날개 길이, f 날갯짓 -1 내림 ~ 1 올림
function e2Bat(x, H, cx, cy, L, f, col, eye, o) {
  o = o || {};
  var r = L * 0.3, mem = o.mem || col;
  [[1, 0.9], [-1, 1]].forEach(function (e) {
    var sd = e[0], k = L * e[1];
    x.save(); x.translate((cx + sd * r * 0.5) * H, -(cy + r * 0.15) * H); x.scale(sd, 1); x.rotate(-f * 0.8 - 0.12);
    var wg = e2Po(x, H, [[0, k * 0.18], [k * 0.4, k * 0.52], [k, k * 0.36], [k * 0.86, k * 0.04], [k * 0.78, -k * 0.24], [k * 0.6, -k * 0.02], [k * 0.47, -k * 0.28], [k * 0.31, -k * 0.04], [k * 0.17, -k * 0.24], [0, -k * 0.14]], sd > 0 ? e2Shd(mem, 0.22) : mem, { d: k * H * 0.04, rl: sd < 0 ? 1 : 0, oc: col });
    if (!enMode && k * H > 9) { x.save(); x.clip(wg.p); x.strokeStyle = e2Ink(col); x.globalAlpha = 0.75; x.lineWidth = Math.max(0.7, k * H * 0.035); x.beginPath(); x.moveTo(0, -k * H * 0.1); x.lineTo(k * H * 0.78, k * H * 0.24); x.moveTo(0, -k * H * 0.1); x.lineTo(k * H * 0.47, k * H * 0.28); x.moveTo(0, -k * H * 0.1); x.lineTo(k * H * 0.4, -k * H * 0.52); x.stroke(); x.restore(); }
    x.restore();
  });
  [[-1, 1], [1, 0.85]].forEach(function (e) { e2Po(x, H, [[cx + e[0] * r * 0.75, cy + r * 0.55], [cx + e[0] * r * 0.95, cy + r * 1.75 * e[1]], [cx + e[0] * r * 0.15, cy + r * 0.85]], e[0] < 0 ? col : e2Shd(col, 0.2), { d: 0, rl: 0 }); });
  if (o.back) o.back(r);
  e2Bl(x, H, [[cx - r, cy + r * 0.2], [cx - r * 0.8, cy + r * 1.0], [cx, cy + r * 1.15], [cx + r * 0.8, cy + r * 1.0], [cx + r, cy + r * 0.2], [cx + r * 0.55, cy - r * 0.9], [cx, cy - r * 1.2], [cx - r * 0.55, cy - r * 0.9]], col, { d: r * H * 0.3 });
  if (o.front) o.front(r);
  e2Eye(x, H, cx - r * 0.38, cy + r * 0.42, r * 0.24, r * 0.2, eye, 1, 2.6); e2Eye(x, H, cx + r * 0.42, cy + r * 0.42, r * 0.22, r * 0.18, eye, -1, 2.6);
}

// ---------- 일반 적 ----------
// 좀비: 이끼빛 살, 해진 보라 셔츠, 앞으로 축 늘어진 두 팔, 옆으로 꺾인 목, 짝짝이로 빛나는 눈. 발을 끌며 비틀비틀
EN_DRAW.zombie = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), sk = '#8fd6a2', sh = '#6a55b0', pt = '#3a3470', shoe = '#4a3558';
  EN_ONE = E2K;
  var lean = 0.2 + s * 0.08, hy = 0.28 + Math.abs(c) * 0.018;
  e2Li(x, H, [-0.08, hy], [-0.08 - s * 0.1, 0.05], 0.105, 0.085, e2Shd(pt, 0.3)); e2El(x, H, -0.06 - s * 0.1, 0.035, 0.08, 0.04, e2Shd(shoe, 0.3));
  e2Li(x, H, [0.03, hy], [0.03 + s * 0.1, 0.05], 0.11, 0.09, pt); e2El(x, H, 0.055 + s * 0.1, 0.035, 0.085, 0.042, shoe);
  x.save(); x.translate(-0.02 * H, -hy * H); x.rotate(lean);
  function arm(near) {
    var S = near ? [0.08, 0.27] : [-0.02, 0.29], sw = Math.sin(a - 1 + (near ? 0 : 0.9)) * 0.04, E = [S[0] + 0.15, S[1] - 0.03 + sw * 0.5], Hd = [E[0] + 0.1 + sw, E[1] - 0.11];
    e2Li(x, H, S, E, 0.105, 0.09, near ? sh : e2Shd(sh, 0.3));
    e2Li(x, H, E, Hd, 0.075, 0.06, near ? sk : e2Shd(sk, 0.3));
    e2El(x, H, Hd[0] + 0.02, Hd[1] - 0.04, 0.045, 0.055, near ? sk : e2Shd(sk, 0.3), 0.5, { d: 0.012 * H, rl: 0 });
  }
  arm(false);
  e2Po(x, H, [[-0.15, 0.05], [-0.12, -0.06], [-0.07, 0.0], [-0.03, -0.07], [0.02, -0.01], [0.07, -0.06], [0.14, 0.05]], e2Shd(sh, 0.15), { d: 0, rl: 0 });
  var body = e2Bl(x, H, [[-0.15, 0.0], [-0.17, 0.2], [-0.12, 0.33], [0.05, 0.35], [0.15, 0.25], [0.15, 0.02], [0, -0.02]], sh);
  if (!enMode) { x.save(); x.clip(body.p); x.fillStyle = sk; x.beginPath(); x.ellipse(0.07 * H, -0.08 * H, 0.04 * H, 0.05 * H, 0.3, 0, 6.2832); x.fill(); x.restore(); }
  e2Ln(x, H, [[0.03, 0.08], [0.11, 0.1]], 0.012, e2Ink(sk), 1, 0.7);
  // 머리: 왼쪽으로 꺾임
  x.save(); x.translate(0.05 * H, -0.33 * H); x.rotate(-lean - 0.34 + s * 0.07);
  e2Bl(x, H, [[-0.17, 0.02], [-0.18, 0.2], [-0.08, 0.33], [0.09, 0.32], [0.19, 0.2], [0.18, 0.03], [0.07, -0.04], [-0.07, -0.03]], sk);
  e2Po(x, H, [[-0.185, 0.14], [-0.215, 0.27], [-0.15, 0.285], [-0.15, 0.38], [-0.07, 0.34], [-0.02, 0.42], [0.035, 0.34], [0.12, 0.36], [0.085, 0.3], [0.02, 0.275], [-0.05, 0.27], [-0.11, 0.16]], '#2a2350', { d: 0.02 * H });
  e2Ln(x, H, [[-0.02, 0.26], [0.09, 0.22]], 0.012, '#3f6f5c', 1); e2Ln(x, H, [[0.01, 0.275], [0.02, 0.225]], 0.01, '#3f6f5c', 1); e2Ln(x, H, [[0.055, 0.26], [0.065, 0.21]], 0.01, '#3f6f5c', 1);
  e2Pt(x, H, [[-0.045, 0.2], [0.05, 0.225], [0.1, 0.16], [0.06, 0.085], [-0.03, 0.1]], '#1d2a3a', 1, 1); e2Pt(x, H, [[0.105, 0.19], [0.17, 0.2], [0.185, 0.13], [0.13, 0.1]], '#1d2a3a', 1, 1);
  e2Eye(x, H, 0.04, 0.145, 0.028, 0.028, '#e8ff6a', 1, 3.6); e2Eye(x, H, 0.148, 0.145, 0.017, 0.017, '#e8ff6a', -1, 3.6);
  e2Ln(x, H, [[-0.06, 0.2], [0.03, 0.245], [0.1, 0.215]], 0.016, '#2a2350', 1);
  e2Pt(x, H, [[0.0, 0.04], [0.08, 0.07], [0.17, 0.05], [0.15, -0.01], [0.05, -0.022]], '#1d2a3a', 1, 1);
  e2Pt(x, H, [[0.05, 0.058], [0.078, 0.062], [0.074, 0.03], [0.054, 0.03]], '#f3efd8'); e2Pt(x, H, [[0.105, 0.0], [0.13, 0.002], [0.125, 0.03], [0.108, 0.03]], '#f3efd8');
  x.restore();
  arm(true);
  x.restore();
} };
// 구울: 창백한 연보라 살, 네 발로 낮게 기는 길쭉한 팔다리, 등뼈 가시, 뒤로 젖힌 긴 귀, 벌어진 턱과 청록 눈
EN_DRAW.ghoul = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), sk = '#bfaee6', dk = '#7c68b8', bone = '#f3ecd8';
  EN_ONE = E2K;
  var bob = Math.abs(s) * 0.035, st = c * 0.025;
  function rear(ph, col, dx) { var q = Math.sin(a + ph), u = Math.max(0, -Math.cos(a + ph)) * 0.035, k = [-0.13 - q * 0.06 + dx, 0.17], f = [-0.27 - q * 0.14 + dx, 0.03 + u]; e2Li(x, H, [-0.22 + dx, 0.32 + bob], k, 0.12, 0.085, col); e2Li(x, H, k, f, 0.075, 0.05, col); e2El(x, H, f[0] + 0.035, f[1], 0.065, 0.03, col, 0, { d: 0, rl: 0 }); }
  function fore(ph, col, dx) { var q = Math.sin(a + ph), u = Math.max(0, Math.cos(a + ph)) * 0.04, k = [0.2 + q * 0.05 + dx, 0.18], f = [0.25 + q * 0.16 + dx, 0.03 + u]; e2Li(x, H, [0.14 + dx, 0.34 + bob], k, 0.1, 0.075, col); e2Li(x, H, k, f, 0.07, 0.05, col); e2El(x, H, f[0] + 0.04, f[1], 0.07, 0.03, col, 0, { d: 0, rl: 0 }); if (!enMode) for (var j = 0; j < 3; j++) e2Pt(x, H, [[f[0] + 0.05 + j * 0.022, f[1] + 0.018], [f[0] + 0.1 + j * 0.02, f[1] - 0.02], [f[0] + 0.045 + j * 0.022, f[1] - 0.015]], bone); }
  rear(Math.PI, e2Shd(dk, 0.25), 0.05); fore(Math.PI, e2Shd(dk, 0.25), 0.05);
  // 등뼈 가시
  for (var j = 0; j < 5; j++) { var u = j / 4, bx = lerp(-0.24, 0.12, u) - st, by = 0.47 + Math.sin(u * 3.1) * 0.08 + bob; e2Po(x, H, [[bx - 0.035, by - 0.02], [bx - 0.03, by + 0.075], [bx + 0.04, by - 0.02]], dk, { d: 0, rl: 0 }); }
  var body = e2Bl(x, H, [[-0.32 - st, 0.3 + bob], [-0.27 - st, 0.45 + bob], [-0.08, 0.56 + bob], [0.13 + st, 0.52 + bob], [0.25 + st, 0.41 + bob], [0.22 + st, 0.27 + bob], [0.0, 0.2 + bob], [-0.2, 0.22 + bob]], sk);
  if (!enMode) { x.save(); x.clip(body.p); x.strokeStyle = dk; x.globalAlpha = 0.7; x.lineWidth = Math.max(0.8, H * 0.016); x.lineCap = 'round'; for (j = 0; j < 4; j++) { x.beginPath(); x.moveTo((-0.14 + j * 0.075) * H, -(0.44 + bob) * H); x.quadraticCurveTo((-0.1 + j * 0.075) * H, -(0.34 + bob) * H, (-0.15 + j * 0.075) * H, -(0.25 + bob) * H); x.stroke(); } x.restore(); }
  rear(0, sk, 0); fore(0, sk, 0);
  // 머리: 낮게 내밀고 턱을 벌림
  var hy = bob * 0.6 + s * 0.012, jaw = 0.05 + Math.max(0, s) * 0.05;
  e2Po(x, H, [[0.27, 0.47 + hy], [0.07, 0.69 + hy], [0.34, 0.53 + hy]], e2Shd(sk, 0.25), { d: 0, rl: 0 });
  e2Bl(x, H, [[0.3, 0.31 + hy], [0.5, 0.33 + hy], [0.56, 0.3 - jaw + hy], [0.46, 0.22 - jaw + hy], [0.3, 0.24 + hy]], e2Shd(sk, 0.2), { d: 0.02 * H, rl: 0 });
  e2Pt(x, H, [[0.3, 0.36 + hy], [0.56, 0.37 + hy], [0.55, 0.3 - jaw + hy], [0.32, 0.29 + hy]], '#23173f');
  if (!enMode) for (j = 0; j < 4; j++) { e2Pt(x, H, [[0.37 + j * 0.05, 0.37 + hy], [0.395 + j * 0.05, 0.32 + hy], [0.42 + j * 0.05, 0.37 + hy]], bone); e2Pt(x, H, [[0.36 + j * 0.05, 0.3 - jaw + hy], [0.385 + j * 0.05, 0.345 - jaw + hy], [0.41 + j * 0.05, 0.3 - jaw + hy]], bone); }
  e2Bl(x, H, [[0.2, 0.44 + hy], [0.3, 0.55 + hy], [0.47, 0.53 + hy], [0.6, 0.43 + hy], [0.58, 0.36 + hy], [0.4, 0.345 + hy], [0.24, 0.33 + hy]], sk);
  e2Po(x, H, [[0.22, 0.5 + hy], [0.0, 0.7 + hy], [0.31, 0.56 + hy]], sk, { d: 0, rl: 0 });
  e2Dot(x, H, 0.44, 0.455 + hy, 0.05, '#23173f'); e2Dot(x, H, 0.545, 0.45 + hy, 0.032, '#23173f');
  e2Eye(x, H, 0.445, 0.455 + hy, 0.034, 0.03, '#5ffff0', 1); e2Eye(x, H, 0.545, 0.45 + hy, 0.02, 0.02, '#5ffff0', -1);
} };
// 원혼: 얼굴을 가린 긴 검은 머리, 앞으로 뻗은 긴 소매, 흩날리는 옥빛 옷자락이 반투명 꼬리로 사라짐. 둥실둥실
EN_DRAW.phantom = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), gown = '#d2f4ff', hair = '#1f1a44', oc = '#2f7fa8';
  EN_ONE = '#2f7fa8';
  var b = 0.05 + s * 0.03, w1 = Math.sin(a * 2) * 0.02, w2 = Math.sin(a * 2 + 1.5) * 0.025, w3 = c * 0.04;
  e2Glow(x, H, 0, 0.5 + b, 0.5, '#7fe6ff', 0.22);
  // 사라지는 꼬리
  e2Bl(x, H, [[-0.4, 0.12 + b + w3], [-0.52, 0.03 + b + w3 * 1.5], [-0.62, 0.06 + b + w3 * 2], [-0.5, 0.14 + b + w3]], gown, { al: 0.32, oc: oc, d: 0, rl: 0, ln: 0 });
  e2Bl(x, H, [[-0.2, 0.26 + b], [-0.36, 0.1 + b + w3 * 0.6], [-0.5, 0.05 + b + w3], [-0.42, 0.2 + b + w3 * 0.5], [-0.3, 0.3 + b]], gown, { al: 0.55, oc: oc, d: 0, rl: 0, ln: 0 });
  // 뒤로 흩날리는 머리
  e2Bl(x, H, [[0.1, 0.92 + b], [-0.04, 0.95 + b], [-0.17, 0.87 + b], [-0.22, 0.7 + b], [-0.27, 0.5 + b + w1], [-0.36, 0.34 + b + w2], [-0.24, 0.4 + b], [-0.16, 0.52 + b], [-0.08, 0.64 + b], [0.02, 0.7 + b]], hair, { d: 0.03 * H });
  // 옷
  var body = e2Bl(x, H, [[0.0, 0.69 + b], [0.12, 0.6 + b], [0.12, 0.4 + b], [0.17, 0.2 + b + w1], [0.07, 0.1 + b - w1], [-0.06, 0.15 + b + w2], [-0.2, 0.07 + b - w2], [-0.3, 0.1 + b + w3 * 0.4], [-0.25, 0.24 + b], [-0.18, 0.4 + b], [-0.13, 0.58 + b]], gown, { al: 0.94, oc: oc, d: 0.045 * H, rc: '#ffffff', ra: 0.7 });
  if (!enMode) { x.save(); x.clip(body.p); x.strokeStyle = 'rgba(70,150,190,0.5)'; x.lineWidth = Math.max(0.8, H * 0.014); x.lineCap = 'round'; [[-0.06, -0.1], [0.03, -0.02], [-0.14, -0.16]].forEach(function (q) { x.beginPath(); x.moveTo(q[0] * H + 0.03 * H, -(0.5 + b) * H); x.quadraticCurveTo(q[0] * H, -(0.34 + b) * H, (q[0] + q[1]) * H, -(0.13 + b) * H); x.stroke(); }); x.restore(); }
  // 소매와 손
  var ar = s * 0.02;
  e2Bl(x, H, [[0.02, 0.63 + b], [0.2, 0.635 + b + ar], [0.37, 0.6 + b + ar], [0.37, 0.5 + b + ar], [0.33, 0.38 + b + ar - w1], [0.27, 0.46 + b + ar], [0.13, 0.5 + b]], gown, { oc: oc, d: 0.025 * H, rc: '#ffffff', ra: 0.7 });
  e2Bl(x, H, [[0.36, 0.59 + b + ar], [0.45, 0.6 + b + ar], [0.49, 0.555 + b + ar], [0.44, 0.54 + b + ar], [0.47, 0.5 + b + ar], [0.37, 0.52 + b + ar]], '#eefcff', { oc: oc, d: 0, rl: 0 });
  // 얼굴과 앞머리
  e2El(x, H, 0.06, 0.78 + b, 0.115, 0.125, '#eefcff', 0, { oc: oc, d: 0.03 * H, rl: 0 });
  e2Pt(x, H, [[0.07, 0.7 + b], [0.12, 0.715 + b], [0.1, 0.675 + b]], '#17304f', 0.9, 1);
  e2Dot(x, H, 0.125, 0.775 + b, 0.036, '#17304f');
  e2Eye(x, H, 0.127, 0.775 + b, 0.024, 0.026, '#4ff2ff', -1, 3.6);
  e2Bl(x, H, [[-0.08, 0.9 + b], [0.08, 0.93 + b], [0.18, 0.86 + b], [0.185, 0.78 + b], [0.15, 0.83 + b], [0.09, 0.8 + b], [0.07, 0.62 + b + w1], [0.0, 0.6 + b + w1], [-0.02, 0.76 + b], [-0.1, 0.78 + b]], hair, { d: 0.02 * H, rl: 0 });
  e2Ln(x, H, [[0.0, 0.9 + b], [-0.1, 0.84 + b], [-0.16, 0.72 + b]], 0.014, E2MOON, 1, 0.6);
} };
// 호박머리: 불 켜진 호박 얼굴(세모 눈, 톱니 입), 꼬인 꼭지와 덩굴, 막대 팔을 벌린 허수아비 몸, 누더기 보라 외투. 뻣뻣하게 절뚝
EN_DRAW.pumpkin = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), or = '#ff9020', coat = '#603a86', wood = '#a8713f', straw = '#f2c44c';
  EN_ONE = E2K;
  x.save(); x.translate(0, -Math.abs(s) * 0.03 * H); x.rotate(s * 0.09);
  e2Li(x, H, [-0.07, 0.26], [-0.08 - s * 0.05, 0.05], 0.05, 0.045, e2Shd(wood, 0.25)); e2El(x, H, -0.06 - s * 0.05, 0.035, 0.07, 0.04, '#33264a', 0, { d: 0.01 * H, rl: 0 });
  e2Li(x, H, [0.06, 0.26], [0.07 + s * 0.05, 0.05], 0.05, 0.045, wood); e2El(x, H, 0.09 + s * 0.05, 0.035, 0.075, 0.04, '#3d2d58', 0, { d: 0.01 * H, rl: 0 });
  function arm(sd, sw) {
    var S = [sd * 0.13, 0.47], E = [sd * 0.4, 0.44 + sw];
    for (var j = -1; j <= 1; j++) e2Ln(x, H, [[E[0] - sd * 0.02, E[1]], [E[0] + sd * 0.08, E[1] + j * 0.06 - 0.01]], 0.022, straw);
    e2Li(x, H, S, E, 0.12, 0.1, sd < 0 ? e2Shd(coat, 0.2) : coat);
    e2Po(x, H, [[E[0] - sd * 0.07, E[1] - 0.05], [E[0] - sd * 0.03, E[1] - 0.12], [E[0], E[1] - 0.055], [E[0] + sd * 0.03, E[1] - 0.1], [E[0] + sd * 0.04, E[1] - 0.03]], sd < 0 ? e2Shd(coat, 0.2) : coat, { d: 0, rl: 0 });
  }
  arm(-1, s * 0.05);
  var body = e2Po(x, H, [[-0.17, 0.5], [-0.21, 0.21], [-0.14, 0.14], [-0.09, 0.21], [-0.03, 0.13], [0.04, 0.2], [0.1, 0.13], [0.2, 0.22], [0.17, 0.5], [0.0, 0.55]], coat, { d: 0.035 * H });
  if (!enMode) { x.save(); x.clip(body.p); x.fillStyle = '#2fae9e'; x.fillRect(0.03 * H, -0.36 * H, 0.09 * H, 0.085 * H); x.strokeStyle = '#11403f'; x.lineWidth = Math.max(0.7, H * 0.01); x.setLineDash([H * 0.02, H * 0.016]); x.strokeRect(0.03 * H, -0.36 * H, 0.09 * H, 0.085 * H); x.restore(); }
  e2Ln(x, H, [[-0.18, 0.4], [0.0, 0.37], [0.18, 0.4]], 0.022, '#e0b860', 1);
  arm(1, -s * 0.05);
  // 호박 머리 (까딱까딱)
  x.save(); x.translate(0.01 * H, -0.52 * H); x.rotate(-s * 0.1 + 0.04);
  e2Glow(x, H, 0.02, 0.19, 0.42, '#ffa92c', 0.4);
  e2Bl(x, H, [[-0.03, 0.34], [-0.06, 0.43], [-0.01, 0.5], [0.07, 0.49], [0.05, 0.44], [0.03, 0.4], [0.05, 0.34]], '#5f9440', { d: 0.01 * H, rl: 0 });
  e2Ln(x, H, [[0.05, 0.4], [0.16, 0.47], [0.13, 0.38]], 0.016, '#5f9440');
  e2El(x, H, -0.13, 0.185, 0.13, 0.165, e2Shd(or, 0.16), 0, { d: 0.035 * H }); e2El(x, H, 0.15, 0.185, 0.13, 0.165, e2Shd(or, 0.22), 0, { d: 0.035 * H, rl: 0 });
  e2El(x, H, 0.01, 0.18, 0.165, 0.19, or, 0, { d: 0.04 * H, hi: 0.25 });
  var fl = 0.85 + 0.15 * Math.sin(a * 3);
  [[0, 0.012, '#7a2c06', 1], [0, 0, '#ffe46e', fl]].forEach(function (L) {
    var dy = L[1];
    e2Pt(x, H, [[-0.115, 0.26 + dy], [-0.02, 0.2 + dy], [-0.1, 0.185 + dy]], L[2], L[3]); e2Pt(x, H, [[0.06, 0.2 + dy], [0.16, 0.26 + dy], [0.14, 0.185 + dy]], L[2], L[3]);
    e2Pt(x, H, [[0.02, 0.18 + dy], [0.045, 0.145 + dy], [0.0, 0.145 + dy]], L[2], L[3]);
    e2Pt(x, H, [[-0.12, 0.12 + dy], [-0.07, 0.1 + dy], [-0.04, 0.13 + dy], [0.0, 0.09 + dy], [0.045, 0.13 + dy], [0.085, 0.1 + dy], [0.16, 0.125 + dy], [0.11, 0.04 + dy], [0.065, 0.075 + dy], [0.02, 0.03 + dy], [-0.03, 0.075 + dy], [-0.075, 0.045 + dy]], L[2], L[3]);
  });
  enEyeRec(x, -0.075 * H, -0.215 * H, 0.05 * H, 0.04 * H, 1); enEyeRec(x, 0.115 * H, -0.215 * H, 0.05 * H, 0.04 * H, -1);
  x.restore();
  x.restore();
} };
// 박쥐 떼: 호박색 눈의 남보라 박쥐 세 마리가 엇박으로 날갯짓
EN_DRAW.bats = { n: 6, f: function (x, H, p) {
  var a = p * 6.2832, col = '#5a49b0';
  EN_ONE = E2K;
  e2Bat(x, H, -0.3, 0.66 + Math.sin(a + 2) * 0.02, 0.21, Math.sin(a + 2.2), e2Shd(col, 0.18), '#ffb648');
  e2Bat(x, H, -0.24, 0.22 + Math.sin(a + 4) * 0.02, 0.19, Math.sin(a + 4.1), e2Shd(col, 0.1), '#ffb648');
  e2Bat(x, H, 0.12, 0.44 - Math.sin(a) * 0.025, 0.34, Math.sin(a), col, '#ffc24a');
} };
// 마녀: 끝이 꺾인 뾰족 모자, 뒤로 날리는 망토와 옥빛 머리, 빗자루 앞에 호박 등불. 둥실 떠서 날아감
EN_DRAW.witch = { n: 8, f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), dress = '#6a3aa6', hat = '#4a2f8c', skin = '#dccbf2', hair = '#8fe8d8', straw = '#e3ad40';
  EN_ONE = E2K;
  var b = 0.06 + s * 0.02, f1 = Math.sin(a + 1) * 0.03, f2 = Math.sin(a + 2.2) * 0.045;
  // 빗자루
  e2Bl(x, H, [[-0.3, 0.26 + b], [-0.42, 0.35 + b], [-0.58, 0.36 + b + f2], [-0.63, 0.26 + b + f2 * 0.6], [-0.58, 0.14 + b - f2 * 0.3], [-0.42, 0.16 + b]], straw, { d: 0.03 * H });
  e2Ln(x, H, [[-0.42, 0.3 + b], [-0.58, 0.31 + b + f2]], 0.012, e2Ink(straw), 1, 0.6); e2Ln(x, H, [[-0.42, 0.22 + b], [-0.58, 0.2 + b]], 0.012, e2Ink(straw), 1, 0.6);
  // 망토와 머리칼 (뒤)
  e2Bl(x, H, [[0.05, 0.62 + b], [-0.1, 0.63 + b], [-0.3, 0.6 + b + f1], [-0.5, 0.5 + b + f2], [-0.36, 0.45 + b + f1], [-0.4, 0.33 + b + f2], [-0.14, 0.33 + b]], hat, { d: 0.035 * H });
  e2Bl(x, H, [[0.04, 0.8 + b], [-0.06, 0.74 + b], [-0.2, 0.7 + b + f1], [-0.33, 0.62 + b + f2], [-0.18, 0.61 + b + f1], [-0.05, 0.62 + b], [0.03, 0.66 + b]], hair, { d: 0.02 * H });
  e2Ln(x, H, [[-0.36, 0.24 + b], [0.46, 0.31 + b]], 0.04, '#9a6a3c');
  e2Ln(x, H, [[-0.31, 0.2 + b], [-0.32, 0.31 + b]], 0.03, '#35c3b4');
  // 등불
  e2Ln(x, H, [[0.44, 0.31 + b], [0.45, 0.2 + b - f1 * 0.3]], 0.012, '#3b2470');
  e2Glow(x, H, 0.45, 0.14 + b, 0.26, '#ffa42c', 0.55);
  e2F(x, shp().rrect(0.405 * H, -(0.2 + b - f1 * 0.3) * H, 0.09 * H, 0.11 * H, 0.03 * H), '#ffb62e', { d: 0.012 * H, rl: 0, hi: 0.5, oc: '#8a3a08' });
  e2Dot(x, H, 0.45, 0.14 + b - f1 * 0.3, 0.022, '#fff6c8');
  // 다리, 몸, 팔
  e2Li(x, H, [0.07, 0.26 + b], [0.15, 0.1 + b], 0.075, 0.06, '#35c3b4');
  e2Ln(x, H, [[0.075, 0.2 + b], [0.14, 0.215 + b]], 0.02, '#3b2470', 1); e2Ln(x, H, [[0.105, 0.145 + b], [0.165, 0.16 + b]], 0.02, '#3b2470', 1);
  e2Bl(x, H, [[0.1, 0.11 + b], [0.2, 0.13 + b], [0.3, 0.09 + b], [0.21, 0.04 + b], [0.11, 0.05 + b]], '#2a1d4a', { d: 0.01 * H, rl: 0 });
  e2Bl(x, H, [[-0.11, 0.28 + b], [-0.13, 0.44 + b], [-0.04, 0.6 + b], [0.1, 0.6 + b], [0.17, 0.44 + b], [0.16, 0.27 + b], [0.07, 0.19 + b], [-0.05, 0.21 + b]], dress);
  e2Li(x, H, [0.08, 0.54 + b], [0.25, 0.35 + b], 0.1, 0.075, e2Shd(dress, 0.12)); e2El(x, H, 0.265, 0.335 + b, 0.04, 0.04, skin, 0, { d: 0.01 * H, rl: 0 });
  // 머리, 모자
  e2Po(x, H, [[0.19, 0.74 + b], [0.3, 0.69 + b], [0.19, 0.675 + b]], skin, { d: 0, rl: 0 });
  e2El(x, H, 0.1, 0.72 + b, 0.118, 0.112, skin, 0, { d: 0.03 * H, rl: 0 });
  e2Dot(x, H, 0.155, 0.735 + b, 0.036, '#2a1d4a'); e2Eye(x, H, 0.158, 0.735 + b, 0.024, 0.024, '#9dff7a', -1);
  e2Ln(x, H, [[0.13, 0.665 + b], [0.17, 0.65 + b], [0.21, 0.675 + b]], 0.012, '#2a1d4a', 1);
  x.save(); x.translate(0.08 * H, -(0.81 + b) * H); x.rotate(-0.14 + s * 0.03);
  var cone = e2Bl(x, H, [[-0.11, 0.0], [-0.08, 0.14], [-0.1, 0.25], [-0.2 + f1, 0.32], [-0.26 + f1, 0.27], [-0.14 + f1 * 0.5, 0.23], [0.0, 0.18], [0.1, 0.0]], hat, { d: 0.025 * H });
  if (!enMode) { x.save(); x.clip(cone.p); x.fillStyle = '#35c3b4'; x.fillRect(-0.2 * H, -0.075 * H, 0.4 * H, 0.05 * H); x.fillStyle = '#ffb62e'; x.fillRect(-0.03 * H, -0.085 * H, 0.06 * H, 0.07 * H); x.restore(); }
  e2El(x, H, 0.0, 0.0, 0.22, 0.05, e2Shd(hat, -0.25), 0, { d: 0.012 * H });
  x.restore();
} };
// 미라: 누런 붕대로 감은 육중한 몸, 앞으로 뻣뻣이 뻗은 두 팔, 풀려 날리는 붕대 끈, 어두운 틈에서 빛나는 한쪽 눈, 청록과 금 목걸이
EN_DRAW.mummy = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), bd = '#eadfbe', bs = '#b9a57c', gold = '#e8b53a';
  EN_ONE = '#3d2f4e';
  var tl = s * 0.045, hy = 0.25 + Math.abs(c) * 0.012;
  function rib(x0, y0, len, wd, ang, ph, col) { var pts = [], n = 5, i; for (i = 0; i <= n; i++) { var u = i / n, an = ang + Math.sin(a + ph + u * 4) * 0.45 * u; pts.push([x0 + Math.cos(an) * len * u, y0 + Math.sin(an) * len * u]); } var up = [], dn = []; for (i = 0; i <= n; i++) { up.push([pts[i][0], pts[i][1] + wd / 2]); dn.unshift([pts[i][0], pts[i][1] - wd / 2]); } e2Po(x, H, up.concat(dn), col, { d: 0, rl: 0 }); }
  e2Li(x, H, [-0.09, hy], [-0.09 - s * 0.07, 0.06], 0.14, 0.12, e2Shd(bd, 0.3)); e2El(x, H, -0.07 - s * 0.07, 0.04, 0.09, 0.045, e2Shd(bd, 0.3), 0, { d: 0.012 * H, rl: 0 });
  e2Li(x, H, [0.05, hy], [0.05 + s * 0.07, 0.06], 0.15, 0.125, bd); e2El(x, H, 0.08 + s * 0.07, 0.04, 0.095, 0.047, bd, 0, { d: 0.012 * H, rl: 0 });
  x.save(); x.translate(0, -hy * H); x.rotate(0.06 + tl);
  rib(-0.1, 0.62, 0.42, 0.05, -Math.PI * 0.5 - 0.55, 1.3, e2Shd(bd, 0.12));
  // 뒤 팔
  e2Li(x, H, [0.04, 0.37], [0.36, 0.4 - s * 0.02], 0.12, 0.1, e2Shd(bd, 0.28));
  var body = e2Bl(x, H, [[-0.18, -0.02], [-0.21, 0.24], [-0.14, 0.42], [0.1, 0.43], [0.19, 0.26], [0.17, -0.02], [0.0, -0.05]], bd);
  e2Bands(x, body, 6, 0.12, bs, Math.max(0.8, H * 0.016), 0.75);
  // 목걸이
  e2Bl(x, H, [[-0.12, 0.39], [0.0, 0.31], [0.13, 0.385], [0.1, 0.44], [-0.1, 0.44]], '#22b3a6', { d: 0.012 * H, rl: 0 });
  e2Ln(x, H, [[-0.11, 0.39], [0.0, 0.325], [0.12, 0.385]], 0.018, gold, 1);
  // 머리
  var head = e2Bl(x, H, [[-0.14, 0.44], [-0.16, 0.6], [-0.08, 0.72], [0.09, 0.72], [0.18, 0.6], [0.16, 0.45], [0.02, 0.4]], bd);
  e2Bands(x, head, 5, 0.1, bs, Math.max(0.8, H * 0.014), 0.75);
  e2Pt(x, H, [[-0.07, 0.64], [0.05, 0.6], [0.185, 0.6], [0.18, 0.545], [0.02, 0.54], [-0.04, 0.58]], '#241a3c', 1, 1);
  e2Ln(x, H, [[-0.13, 0.665], [0.03, 0.655], [0.165, 0.665]], 0.03, gold, 1); e2Dot(x, H, 0.07, 0.662, 0.024, '#22b3a6'); e2Dot(x, H, 0.064, 0.668, 0.008, '#ffffff', 0.8);
  e2Eye(x, H, 0.095, 0.572, 0.034, 0.024, '#3ff5e0', 1, 4);
  e2Dot(x, H, 0.158, 0.572, 0.011, '#3ff5e0', 0.7);
  // 앞 팔과 늘어진 끈
  var ay = 0.33 + s * 0.02;
  rib(0.3, ay - 0.04, 0.2, 0.028, -Math.PI * 0.5 - 0.3, 2.2, bs);
  var arm = e2Li(x, H, [0.08, 0.34], [0.38, ay], 0.135, 0.11, bd);
  e2Bands(x, arm, 4, 0.5, bs, Math.max(0.8, H * 0.014), 0.7);
  e2El(x, H, 0.41, ay, 0.06, 0.055, e2Shd(bd, 0.1), 0, { d: 0.015 * H, rl: 0 });
  x.restore();
} };
// 풍뎅이: 위에서 본 청록 등딱지와 금빛 가슴판, 집게 뿔, 여섯 다리로 재빠르게 (진행 방향으로 돌려 그림)
EN_DRAW.scarab = { top: 1, f: function (x, H, p) {
  var R = H * 0.56, cy = 0.46 / 3, a = p * 6.2832, k = R / H, shell = '#18b8a8', gold = '#f0bc3c', dk = '#2a2356';
  EN_ONE = E2K;
  for (var sd = -1; sd <= 1; sd += 2) for (var j = 0; j < 3; j++) {
    var ph = a * 2 + j * 2.1 + (sd > 0 ? Math.PI : 0), bx = (0.42 - j * 0.34) * k, th = (0.9 + j * 0.42) + Math.sin(ph) * 0.3;
    var k1 = [bx + Math.cos(th) * 0.5 * k, cy + sd * (0.3 + Math.sin(th) * 0.32) * k], k2 = [k1[0] + (j === 0 ? 0.2 : -0.16) * k, k1[1] + sd * 0.2 * k];
    e2Ln(x, H, [[bx, cy + sd * 0.3 * k], k1, k2], 0.085 * k, dk);
  }
  [-1, 1].forEach(function (sd) { e2Bl(x, H, [[0.78 * k, cy + sd * 0.1 * k], [1.0 * k, cy + sd * 0.2 * k], [1.08 * k, cy + sd * 0.05 * k], [0.96 * k, cy + sd * 0.1 * k], [0.8 * k, cy + sd * 0.02 * k]], gold, { d: 0, rl: 0 }); });
  e2El(x, H, 0.76 * k, cy, 0.17 * k, 0.24 * k, dk, 0, { d: 0.03 * R, rl: 0 });
  e2El(x, H, 0.44 * k, cy, 0.27 * k, 0.43 * k, gold, 0, { d: 0.05 * R, hi: 0.4 });
  var el = e2Bl(x, H, [[0.28 * k, cy + 0.5 * k], [-0.3 * k, cy + 0.56 * k], [-0.74 * k, cy + 0.3 * k], [-0.74 * k, cy - 0.3 * k], [-0.3 * k, cy - 0.56 * k], [0.28 * k, cy - 0.5 * k]], shell, { d: 0.09 * R, hi: 0.35 });
  if (!enMode) {
    x.save(); x.clip(el.p);
    x.strokeStyle = e2Ink(shell); x.lineWidth = Math.max(0.8, R * 0.05); x.beginPath(); x.moveTo(0.3 * R, -cy * H); x.lineTo(-0.8 * R, -cy * H); x.stroke();
    x.strokeStyle = 'rgba(240,188,60,0.85)'; x.lineWidth = Math.max(0.8, R * 0.045);
    [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(0.2 * R, -cy * H + sd * 0.22 * R); x.quadraticCurveTo(-0.3 * R, -cy * H + sd * 0.32 * R, -0.62 * R, -cy * H + sd * 0.14 * R); x.stroke(); });
    x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.ellipse(-0.1 * R, -cy * H - 0.3 * R, 0.26 * R, 0.07 * R, 0.1, 0, 6.2832); x.fill();
    x.restore();
  }
  e2Eye(x, H, 0.85 * k, cy + 0.14 * k, 0.05 * k, 0.05 * k, '#ffb040', 1, 2.4); e2Eye(x, H, 0.85 * k, cy - 0.14 * k, 0.05 * k, 0.05 * k, '#ffb040', -1, 2.4);
} };
// 늑대인간: 굽은 등, 땅에 닿을 듯한 큰 앞발과 발톱, 곤두선 갈기, 긴 주둥이와 송곳니, 호박색 눈, 찢어진 바지. 성큼성큼
EN_DRAW.werewolf = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), fur = '#6a7cb0', lt = '#a9b6dc', mane = '#363d70', pants = '#573576', bone = '#f3ecd8';
  EN_ONE = E2K;
  var bob = Math.abs(c) * 0.025, hy = 0.3 + bob;
  function leg(q, col, dx) { var k = [-0.02 + q * 0.08 + dx, 0.17], f = [-0.1 + q * 0.13 + dx, 0.07 + Math.max(0, q) * 0.02]; e2Li(x, H, [-0.1 + dx, hy], k, 0.15, 0.1, pants === col ? pants : col); e2Li(x, H, k, f, 0.085, 0.065, col === pants ? fur : e2Shd(fur, 0.3)); e2El(x, H, f[0] + 0.06, 0.035, 0.1, 0.04, col === pants ? fur : e2Shd(fur, 0.3), 0, { d: 0.01 * H, rl: 0 }); }
  function arm(q, near) {
    var col = near ? fur : e2Shd(fur, 0.3), S = near ? [0.13, 0.63 + bob] : [0.2, 0.62 + bob], E = [S[0] + 0.05 + q * 0.05, S[1] - 0.24], Hd = [E[0] + 0.1 + q * 0.12, E[1] - 0.2 + Math.abs(q) * 0.03];
    e2Li(x, H, S, E, 0.15, 0.12, col); e2Li(x, H, E, Hd, 0.13, 0.15, col);
    for (var j = 0; j < 3; j++) e2Po(x, H, [[Hd[0] + 0.02 + j * 0.035, Hd[1] - 0.02], [Hd[0] + 0.1 + j * 0.03, Hd[1] - 0.1], [Hd[0] - 0.01 + j * 0.035, Hd[1] - 0.06]], bone, { d: 0, rl: 0 });
    e2El(x, H, Hd[0] + 0.02, Hd[1] - 0.01, 0.085, 0.075, col, 0, { d: 0.02 * H, rl: 0 });
  }
  // 꼬리
  var tw = Math.sin(a + 1) * 0.05;
  e2Bl(x, H, [[-0.2, 0.36 + bob], [-0.36, 0.44 + bob + tw], [-0.5, 0.6 + bob + tw * 1.6], [-0.42, 0.42 + bob + tw], [-0.3, 0.3 + bob], [-0.2, 0.28 + bob]], mane, { d: 0.02 * H });
  arm(-s, false); leg(-s, e2Shd(pants, 0.3), 0.05);
  leg(s, pants, -0.02);
  e2Po(x, H, [[-0.2, hy + 0.02], [-0.19, hy - 0.11], [-0.13, hy - 0.05], [-0.08, hy - 0.13], [-0.02, hy - 0.05], [0.04, hy - 0.11], [0.08, hy + 0.02]], pants, { d: 0, rl: 0 });
  // 갈기 (등 가시)
  for (var j = 0; j < 5; j++) { var u = j / 4, bx = lerp(-0.2, 0.16, u), by = lerp(0.6, 0.84, Math.sin(u * 1.57)) + bob; e2Po(x, H, [[bx - 0.06, by - 0.05], [bx - 0.1 + u * 0.05, by + 0.1], [bx + 0.05, by - 0.02]], mane, { d: 0, rl: 0 }); }
  var body = e2Bl(x, H, [[-0.21, 0.27 + bob], [-0.27, 0.5 + bob], [-0.15, 0.75 + bob], [0.08, 0.82 + bob], [0.27, 0.68 + bob], [0.25, 0.45 + bob], [0.1, 0.31 + bob], [-0.05, 0.25 + bob]], fur, { d: 0.05 * H });
  if (!enMode) { x.save(); x.clip(body.p); x.fillStyle = lt; x.beginPath(); x.ellipse(0.16 * H, -(0.45 + bob) * H, 0.1 * H, 0.15 * H, 0.3, 0, 6.2832); x.fill(); x.restore(); }
  // 머리
  var hb = bob + s * 0.012;
  e2Po(x, H, [[0.16, 0.8 + hb], [0.1, 1.0 + hb], [0.27, 0.86 + hb]], e2Shd(fur, 0.25), { d: 0, rl: 0 });
  e2Bl(x, H, [[0.3, 0.56 + hb], [0.5, 0.56 + hb], [0.57, 0.5 + hb], [0.48, 0.46 + hb], [0.3, 0.48 + hb]], e2Shd(fur, 0.15), { d: 0.01 * H, rl: 0 });
  e2Bl(x, H, [[0.17, 0.62 + hb], [0.2, 0.8 + hb], [0.34, 0.86 + hb], [0.45, 0.76 + hb], [0.62, 0.68 + hb], [0.64, 0.6 + hb], [0.5, 0.56 + hb], [0.3, 0.54 + hb]], fur, { d: 0.03 * H });
  e2Po(x, H, [[0.24, 0.82 + hb], [0.24, 1.03 + hb], [0.37, 0.84 + hb]], fur, { d: 0, rl: 0 });
  e2Pt(x, H, [[0.27, 0.86 + hb], [0.255, 0.97 + hb], [0.33, 0.86 + hb]], '#b98ad0', 0.8);
  e2Dot(x, H, 0.625, 0.655 + hb, 0.03, '#1c1436');
  if (!enMode) [0.4, 0.47, 0.54].forEach(function (tx, j) { e2Pt(x, H, [[tx, 0.565 + hb], [tx + 0.022, 0.51 + hb - (j ? 0 : 0.015)], [tx + 0.045, 0.565 + hb]], bone); });
  e2Pt(x, H, [[0.33, 0.74 + hb], [0.44, 0.7 + hb], [0.36, 0.69 + hb]], '#1c1436');
  e2Eye(x, H, 0.385, 0.71 + hb, 0.032, 0.022, '#ffb23a', 1, 3.6);
  e2Ln(x, H, [[0.3, 0.77 + hb], [0.45, 0.72 + hb]], 0.02, mane, 1);
  arm(s, true);
} };
// 흡혈귀: 머리 뒤로 높이 선 깃, 진홍 안감의 검은 망토, 창백한 얼굴과 뾰족한 이마 머리선, 붉게 빛나는 눈. 미끄러지듯 걷는다
EN_DRAW.vampire = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), cape = '#3a2b74', lin = '#d02f55', skin = '#ece4f7', hair = '#191233', vest = '#463a80';
  EN_ONE = E2K;
  var b = Math.abs(c) * 0.012, hw = s * 0.025;
  e2Bl(x, H, [[-0.2, 0.68 + b], [-0.28, 0.4 + b], [-0.31, 0.07 + hw], [-0.1, 0.04], [0.1, 0.05], [0.27, 0.05 - hw], [0.23, 0.4 + b], [0.17, 0.68 + b], [0.0, 0.72 + b]], lin, { d: 0.03 * H, rl: 0 });
  e2Li(x, H, [-0.05, 0.3 + b], [-0.06 - s * 0.05, 0.06], 0.085, 0.07, e2Shd(vest, 0.4)); e2Bl(x, H, [[-0.11 - s * 0.05, 0.07], [-0.02 - s * 0.05, 0.08], [0.06 - s * 0.05, 0.03], [-0.02 - s * 0.05, 0.005], [-0.11 - s * 0.05, 0.01]], hair, { d: 0, rl: 0 });
  e2Li(x, H, [0.06, 0.3 + b], [0.07 + s * 0.05, 0.06], 0.085, 0.07, e2Shd(vest, 0.3)); e2Bl(x, H, [[0.02 + s * 0.05, 0.07], [0.11 + s * 0.05, 0.08], [0.19 + s * 0.05, 0.03], [0.11 + s * 0.05, 0.005], [0.02 + s * 0.05, 0.01]], hair, { d: 0, rl: 0 });
  var body = e2Bl(x, H, [[-0.1, 0.28 + b], [-0.13, 0.62 + b], [0.0, 0.68 + b], [0.13, 0.62 + b], [0.12, 0.28 + b]], vest, { d: 0.03 * H, rl: 0 });
  e2Pt(x, H, [[-0.04, 0.66 + b], [0.08, 0.66 + b], [0.03, 0.45 + b]], '#f1ecff');
  e2Dot(x, H, 0.025, 0.4 + b, 0.014, '#e8b53a'); e2Dot(x, H, 0.025, 0.34 + b, 0.014, '#e8b53a');
  e2Glow(x, H, 0.02, 0.61 + b, 0.07, '#ff4a66', 0.6); e2Dot(x, H, 0.02, 0.615 + b, 0.026, '#ff4a66'); e2Dot(x, H, 0.014, 0.622 + b, 0.01, '#ffffff', 0.8);
  // 망토 앞자락
  e2Bl(x, H, [[-0.2, 0.68 + b], [-0.31, 0.38 + b], [-0.33, 0.07 + hw], [-0.2, 0.03], [-0.12, 0.3 + b], [-0.06, 0.63 + b]], cape, { d: 0.035 * H });
  e2Bl(x, H, [[0.16, 0.68 + b], [0.24, 0.4 + b], [0.29, 0.05 - hw], [0.19, 0.03], [0.13, 0.3 + b], [0.1, 0.62 + b]], e2Shd(cape, 0.2), { d: 0.03 * H, rl: 0 });
  // 망토를 든 앞 팔 (박쥐 날개처럼)
  var ay = 0.52 + b + s * 0.015;
  e2Po(x, H, [[0.11, 0.66 + b], [0.36, ay + 0.04], [0.4, 0.26 + hw], [0.31, 0.34], [0.27, 0.17 - hw], [0.2, 0.32], [0.14, 0.24]], cape, { d: 0.03 * H });
  e2Bl(x, H, [[0.34, ay + 0.045], [0.42, ay + 0.06], [0.45, ay + 0.01], [0.4, ay - 0.01], [0.42, ay - 0.04], [0.34, ay - 0.02]], skin, { d: 0, rl: 0 });
  // 높은 깃
  e2Po(x, H, [[0.17, 0.66 + b], [0.26, 0.99 + b], [0.07, 0.8 + b], [0.05, 0.68 + b]], lin, { d: 0.02 * H, rl: 0, oc: cape });
  e2Po(x, H, [[-0.2, 0.66 + b], [-0.25, 1.0 + b], [-0.06, 0.82 + b], [-0.03, 0.68 + b]], cape, { d: 0.02 * H });
  // 머리
  e2Bl(x, H, [[-0.1, 0.72 + b], [-0.125, 0.84 + b], [-0.05, 0.94 + b], [0.08, 0.94 + b], [0.15, 0.84 + b], [0.13, 0.73 + b], [0.02, 0.675 + b]], skin, { d: 0.03 * H, rl: 0 });
  e2Bl(x, H, [[-0.135, 0.8 + b], [-0.11, 0.955 + b], [0.02, 0.995 + b], [0.14, 0.95 + b], [0.165, 0.83 + b], [0.1, 0.895 + b], [0.035, 0.835 + b], [-0.03, 0.9 + b], [-0.095, 0.85 + b]], hair, { d: 0.02 * H });
  e2Pt(x, H, [[-0.07, 0.835 + b], [0.0, 0.8 + b], [-0.06, 0.79 + b]], '#3a2a55', 0.9); e2Pt(x, H, [[0.05, 0.8 + b], [0.125, 0.835 + b], [0.115, 0.79 + b]], '#3a2a55', 0.9);
  e2Eye(x, H, -0.03, 0.805 + b, 0.03, 0.02, '#ff3f58', 1, 3.4); e2Eye(x, H, 0.085, 0.805 + b, 0.027, 0.018, '#ff3f58', -1, 3.4);
  e2Ln(x, H, [[-0.02, 0.74 + b], [0.03, 0.725 + b], [0.08, 0.74 + b]], 0.011, '#5a3a6a', 1);
  e2Pt(x, H, [[-0.002, 0.738 + b], [0.022, 0.732 + b], [0.008, 0.7 + b]], '#ffffff'); e2Pt(x, H, [[0.04, 0.732 + b], [0.064, 0.738 + b], [0.054, 0.7 + b]], '#ffffff');
} };
// 관 수레: 실크해트 쓴 장의사 해골이 끄는 수레, 초승달 문양의 관, 살짝 열린 틈으로 청록 빛과 눈동자
EN_DRAW.coffin = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), wood = '#7a4f7c', wd2 = '#56345e', cart = '#8a5c40', gold = '#e8b53a', bone = '#f3ecd8';
  EN_ONE = E2K;
  x.save(); x.translate(-0.1 * H, 0);
  var bp = Math.abs(s) * 0.012;
  function wheel(cx, r) {
    e2El(x, H, cx, r, r, r, '#5b3d33', 0, { d: r * H * 0.2, rl: 1 });
    e2El(x, H, cx, r, r * 0.68, r * 0.68, '#a47a52', 0, { d: 0, rl: 0 });
    if (!enMode) { x.save(); x.translate(cx * H, -r * H); x.rotate(a * 0.5); x.strokeStyle = '#5b3d33'; x.lineCap = 'round'; x.lineWidth = Math.max(1, r * H * 0.16); for (var i = 0; i < 4; i++) { var an = i * 0.7854; x.beginPath(); x.moveTo(Math.cos(an) * r * H * 0.62, Math.sin(an) * r * H * 0.62); x.lineTo(-Math.cos(an) * r * H * 0.62, -Math.sin(an) * r * H * 0.62); x.stroke(); } x.restore(); }
    e2El(x, H, cx, r, r * 0.22, r * 0.22, gold, 0, { d: 0, rl: 0 });
  }
  // 끌채와 해골 장의사
  e2Ln(x, H, [[0.3, 0.26 + bp], [0.56, 0.37]], 0.035, cart);
  var sx = 0.62, lg = s * 0.07;
  e2Ln(x, H, [[sx - 0.02, 0.33], [sx - 0.04 - lg, 0.18], [sx - 0.07 - lg, 0.04]], 0.04, e2Shd(bone, 0.3)); e2Ln(x, H, [[sx - 0.09 - lg, 0.03], [sx - 0.01 - lg, 0.03]], 0.04, e2Shd(bone, 0.3));
  e2Ln(x, H, [[sx, 0.33], [sx + 0.05 + lg, 0.18], [sx + 0.03 + lg, 0.04]], 0.045, bone); e2Ln(x, H, [[sx + 0.01 + lg, 0.03], [sx + 0.1 + lg, 0.03]], 0.045, bone);
  var rb = e2Bl(x, H, [[sx - 0.07, 0.32], [sx - 0.085, 0.5], [sx + 0.0, 0.57], [sx + 0.09, 0.5], [sx + 0.07, 0.32]], '#2c2150', { d: 0.02 * H });
  if (!enMode) { x.save(); x.clip(rb.p); x.strokeStyle = bone; x.lineWidth = Math.max(0.9, H * 0.022); x.lineCap = 'round'; for (var i = 0; i < 3; i++) { x.beginPath(); x.moveTo((sx - 0.05) * H, -(0.37 + i * 0.055) * H); x.quadraticCurveTo((sx + 0.02) * H, -(0.35 + i * 0.055) * H, (sx + 0.07) * H, -(0.38 + i * 0.055) * H); x.stroke(); } x.restore(); }
  e2Ln(x, H, [[sx + 0.03, 0.5], [sx - 0.02, 0.4], [sx - 0.07, 0.375]], 0.04, bone);
  var hy = 0.66 + Math.abs(c) * 0.012;
  e2Bl(x, H, [[sx - 0.02, hy - 0.11], [sx + 0.1, hy - 0.1], [sx + 0.11, hy - 0.04], [sx + 0.0, hy - 0.04]], e2Shd(bone, 0.12), { d: 0, rl: 0 });
  e2El(x, H, sx + 0.03, hy, 0.1, 0.092, bone, 0, { d: 0.022 * H, rl: 0, oc: '#3d2f4e' });
  e2Dot(x, H, sx + 0.035, hy - 0.005, 0.03, '#241a3c'); e2Dot(x, H, sx + 0.1, hy - 0.005, 0.024, '#241a3c');
  e2Eye(x, H, sx + 0.04, hy - 0.005, 0.014, 0.014, '#5ffff0', 1, 3); e2Eye(x, H, sx + 0.102, hy - 0.005, 0.012, 0.012, '#5ffff0', -1, 3);
  e2El(x, H, sx + 0.02, hy + 0.075, 0.15, 0.028, '#2c2150', -0.08, { d: 0, rl: 0 });
  var hat = e2Po(x, H, [[sx - 0.065, hy + 0.08], [sx - 0.085, hy + 0.25], [sx + 0.085, hy + 0.265], [sx + 0.1, hy + 0.09]], '#2c2150', { d: 0.02 * H });
  if (!enMode) { x.save(); x.clip(hat.p); x.fillStyle = '#35c3b4'; x.fillRect((sx - 0.1) * H, -(hy + 0.135) * H, 0.22 * H, 0.04 * H); x.restore(); }
  // 수레, 관
  e2F(x, shp().rrect(-0.56 * H, -(0.3 + bp) * H, 0.9 * H, 0.08 * H, 0.02 * H), cart, { d: 0.02 * H, rl: 0 });
  e2Glow(x, H, -0.14, 0.42 + bp, 0.34, '#3ff5e0', 0.3);
  e2Po(x, H, [[-0.5, 0.42 + bp], [0.08, 0.42 + bp], [0.25, 0.48 + bp], [0.25, 0.32 + bp], [0.08, 0.29 + bp], [-0.5, 0.29 + bp]], wd2, { d: 0.02 * H, rl: 0 });
  e2Pt(x, H, [[-0.5, 0.445 + bp], [0.08, 0.445 + bp], [0.25, 0.505 + bp], [0.25, 0.465 + bp], [0.08, 0.405 + bp], [-0.5, 0.405 + bp]], '#12091f');
  e2Eye(x, H, -0.2, 0.425 + bp, 0.016, 0.013, '#e8ff6a', 1, 2.6); e2Eye(x, H, -0.13, 0.425 + bp, 0.016, 0.013, '#e8ff6a', -1, 2.6);
  var ld = Math.max(0, s) * 0.012;
  var lid = e2Po(x, H, [[-0.48, 0.52 + bp + ld], [0.03, 0.7 + bp + ld], [0.2, 0.665 + bp + ld], [0.255, 0.505 + bp + ld], [0.08, 0.445 + bp + ld], [-0.5, 0.445 + bp + ld]], wood, { d: 0.035 * H });
  if (!enMode) {
    x.save(); x.clip(lid.p); x.strokeStyle = 'rgba(232,181,58,0.9)'; x.lineWidth = Math.max(0.9, H * 0.016); x.lineJoin = 'round';
    var q = e2M(H, [[-0.42, 0.5 + bp + ld], [0.03, 0.645 + bp + ld], [0.16, 0.625 + bp + ld], [0.2, 0.52 + bp + ld], [0.07, 0.48 + bp + ld], [-0.43, 0.475 + bp + ld]]); x.beginPath(); q.forEach(function (v, i) { if (i) x.lineTo(v[0], v[1]); else x.moveTo(v[0], v[1]); }); x.closePath(); x.stroke();
    x.fillStyle = gold; x.beginPath(); x.arc(-0.05 * H, -(0.545 + bp + ld) * H, 0.05 * H, 0, 6.2832); x.fill(); x.fillStyle = wood; x.beginPath(); x.arc(-0.03 * H, -(0.555 + bp + ld) * H, 0.042 * H, 0, 6.2832); x.fill();
    x.restore();
  }
  wheel(-0.36, 0.14); wheel(0.14, 0.14);
  x.restore();
} };
// 저주 인형: 큰 삼베 머리, 짝짝이 단추 눈, 꿰맨 입, 진홍 털실 양갈래, 기운 옥색 원피스, 등에서 도는 금빛 태엽. 좌우로 까딱까딱
EN_DRAW.doll = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), face = '#ecdab6', yarn = '#c8385c', dress = '#2f9c94', gold = '#f0bc3c';
  EN_ONE = '#3d2f4e';
  var tk = s >= 0 ? 1 : -1, tl = tk * 0.1 * Math.min(1, Math.abs(s) * 2.2), hop = Math.pow(Math.abs(c), 4) * 0.035;
  x.save(); x.translate(0, -hop * H); x.rotate(tl);
  e2Li(x, H, [-0.07, 0.27], [-0.09 - s * 0.04, 0.06], 0.07, 0.06, e2Shd(face, 0.25)); e2El(x, H, -0.085 - s * 0.04, 0.04, 0.07, 0.042, '#33264a', 0, { d: 0.01 * H, rl: 0 });
  e2Li(x, H, [0.06, 0.27], [0.08 + s * 0.04, 0.06], 0.07, 0.06, face); e2El(x, H, 0.095 + s * 0.04, 0.04, 0.072, 0.042, '#3d2d58', 0, { d: 0.01 * H, rl: 0 });
  // 태엽
  e2Ln(x, H, [[-0.12, 0.3], [-0.3, 0.27]], 0.032, gold);
  var kw = 0.022 + Math.abs(Math.cos(a)) * 0.05;
  e2El(x, H, -0.33, 0.33, kw, 0.058, gold, 0, { d: 0.01 * H, rl: 0, hi: 0.4 }); e2El(x, H, -0.34, 0.215, kw, 0.058, gold, 0, { d: 0.01 * H, rl: 0, hi: 0.4 });
  e2Li(x, H, [-0.1, 0.46], [-0.27, 0.45 + s * 0.04], 0.07, 0.06, e2Shd(face, 0.2)); e2El(x, H, -0.29, 0.45 + s * 0.04, 0.045, 0.045, e2Shd(face, 0.2), 0, { d: 0, rl: 0 });
  var body = e2Bl(x, H, [[-0.1, 0.52], [-0.22, 0.25], [-0.11, 0.2], [0.0, 0.235], [0.11, 0.2], [0.22, 0.26], [0.11, 0.52]], dress, { d: 0.03 * H });
  if (!enMode) { x.save(); x.clip(body.p); x.fillStyle = '#ff9a2e'; x.fillRect(0.02 * H, -0.36 * H, 0.1 * H, 0.09 * H); x.strokeStyle = '#4a2a10'; x.lineWidth = Math.max(0.7, H * 0.012); x.setLineDash([H * 0.02, H * 0.018]); x.strokeRect(0.02 * H, -0.36 * H, 0.1 * H, 0.09 * H); x.restore(); }
  e2Li(x, H, [0.1, 0.46], [0.26, 0.32 - s * 0.04], 0.07, 0.06, face); e2El(x, H, 0.275, 0.305 - s * 0.04, 0.047, 0.047, face, 0, { d: 0, rl: 0 });
  // 머리 (몸과 반대로 까딱)
  x.save(); x.translate(0, -0.52 * H); x.rotate(-tl * 1.6);
  var pw = Math.sin(a + 1) * 0.02;
  e2Bl(x, H, [[-0.19, 0.3], [-0.33, 0.24], [-0.36, 0.05 + pw], [-0.27, 0.0], [-0.22, 0.14]], e2Shd(yarn, 0.15), { d: 0.02 * H, rl: 0 });
  e2Bl(x, H, [[0.2, 0.3], [0.33, 0.25], [0.35, 0.07 - pw], [0.27, 0.02], [0.22, 0.16]], e2Shd(yarn, 0.25), { d: 0.02 * H, rl: 0 });
  e2Bl(x, H, [[-0.21, 0.08], [-0.235, 0.25], [-0.13, 0.4], [0.11, 0.41], [0.235, 0.27], [0.21, 0.09], [0.0, 0.01]], face, { d: 0.045 * H });
  e2Bl(x, H, [[-0.23, 0.27], [-0.16, 0.43], [0.04, 0.48], [0.21, 0.4], [0.245, 0.28], [0.12, 0.36], [-0.03, 0.325], [-0.14, 0.35]], yarn, { d: 0.02 * H });
  e2Dot(x, H, -0.215, 0.28, 0.028, '#35c3b4'); e2Dot(x, H, 0.225, 0.29, 0.026, '#35c3b4');
  // 단추 눈
  e2Dot(x, H, -0.075, 0.2, 0.068, '#1d1436'); e2Dot(x, H, -0.075, 0.2, 0.05, '#3a2c66');
  e2Glow(x, H, -0.075, 0.2, 0.13, '#ff5fd0', 0.45); e2Dot(x, H, -0.095, 0.2, 0.013, '#ff9ae6'); e2Dot(x, H, -0.055, 0.2, 0.013, '#ff9ae6');
  e2Dot(x, H, 0.105, 0.21, 0.048, '#11403f'); e2Dot(x, H, 0.105, 0.21, 0.034, '#35c3b4');
  e2Ln(x, H, [[0.085, 0.23], [0.125, 0.19]], 0.012, '#f6eedc', 1); e2Ln(x, H, [[0.085, 0.19], [0.125, 0.23]], 0.012, '#f6eedc', 1);
  enEyeRec(x, -0.075 * H, -0.2 * H, 0.06 * H, 0.06 * H, 1); enEyeRec(x, 0.105 * H, -0.21 * H, 0.045 * H, 0.045 * H, -1);
  // 꿰맨 입
  e2Ln(x, H, [[-0.1, 0.1], [0.02, 0.055], [0.14, 0.11]], 0.014, '#3d2f4e', 1);
  if (!enMode) for (var j = 0; j < 5; j++) { var u = j / 4, mx = lerp(-0.08, 0.12, u), my = 0.1 - Math.sin(u * 3.14) * 0.04 + (u > 0.5 ? (u - 0.5) * 0.02 : 0); e2Ln(x, H, [[mx - 0.008, my + 0.024], [mx + 0.008, my - 0.024]], 0.012, '#3d2f4e', 1); }
  e2Ln(x, H, [[0.16, 0.33], [0.2, 0.2]], 0.01, '#8a7350', 1, 0.8);
  x.restore();
  x.restore();
} };
// 가고일: 각진 돌 날개, 굽은 뿔과 뾰족 귀, 웅크린 돌 몸에 금 간 자국과 이끼, 호박색 눈. 무겁게 날갯짓
EN_DRAW.gargoyle = { n: 8, f: function (x, H, p) {
  var a = p * 6.2832, f = Math.sin(a), st = '#8a96ba', dk = '#5c668c', moss = '#3fb39e';
  EN_ONE = E2K;
  var b = 0.04 - f * 0.025;
  [[1, 0.92], [-1, 1]].forEach(function (e) {
    var sd = e[0], k = e[1];
    x.save(); x.translate(sd * 0.1 * H, -(0.6 + b) * H); x.scale(sd * k, k); x.rotate(-f * 0.42 - 0.1);
    var wg = e2Po(x, H, [[0, 0.02], [0.16, 0.3], [0.46, 0.4], [0.6, 0.24], [0.52, 0.06], [0.5, -0.14], [0.37, -0.02], [0.3, -0.22], [0.17, -0.07], [0.04, -0.16]], sd > 0 ? e2Shd(dk, 0.15) : dk, { d: 0.03 * H });
    if (!enMode) { x.save(); x.clip(wg.p); x.strokeStyle = sd > 0 ? e2Shd(st, 0.2) : st; x.lineWidth = Math.max(1, H * 0.035); x.lineCap = 'round'; x.beginPath(); x.moveTo(0, 0); x.lineTo(0.46 * H, -0.36 * H); x.moveTo(0.1 * H, -0.12 * H); x.lineTo(0.5 * H, 0.1 * H); x.moveTo(0.06 * H, -0.05 * H); x.lineTo(0.3 * H, 0.18 * H); x.stroke(); x.restore(); }
    x.restore();
  });
  // 꼬리
  var tw = Math.sin(a + 1) * 0.03;
  e2Ln(x, H, [[-0.04, 0.3 + b], [-0.26, 0.14 + b], [-0.36, 0.3 + b + tw]], 0.05, dk);
  e2Po(x, H, [[-0.42, 0.3 + b + tw], [-0.36, 0.44 + b + tw], [-0.29, 0.3 + b + tw]], dk, { d: 0, rl: 0 });
  // 웅크린 다리
  [[-1, st], [1, e2Shd(st, 0.2)]].forEach(function (e) {
    var sd = e[0];
    e2Bl(x, H, [[sd * 0.05, 0.32 + b], [sd * 0.2, 0.36 + b], [sd * 0.25, 0.24 + b], [sd * 0.17, 0.13 + b], [sd * 0.06, 0.18 + b]], e[1], { d: 0.02 * H, rl: sd < 0 ? 1 : 0 });
    e2El(x, H, sd * 0.13, 0.1 + b, 0.085, 0.045, e[1], 0, { d: 0.01 * H, rl: 0 });
    if (!enMode) for (var j = -1; j <= 1; j++) e2Pt(x, H, [[sd * 0.13 + j * 0.05 - 0.015, 0.085 + b], [sd * 0.13 + j * 0.055, 0.03 + b], [sd * 0.13 + j * 0.05 + 0.015, 0.085 + b]], '#f3ecd8');
  });
  var body = e2Bl(x, H, [[-0.15, 0.3 + b], [-0.18, 0.5 + b], [-0.09, 0.63 + b], [0.09, 0.63 + b], [0.18, 0.5 + b], [0.15, 0.3 + b], [0.0, 0.24 + b]], st, { d: 0.04 * H });
  if (!enMode) {
    x.save(); x.clip(body.p);
    x.fillStyle = rgba(moss, 0.85); x.beginPath(); x.ellipse(-0.12 * H, -(0.56 + b) * H, 0.08 * H, 0.05 * H, -0.5, 0, 6.2832); x.fill();
    x.strokeStyle = e2Ink(st); x.lineWidth = Math.max(0.8, H * 0.014); x.lineJoin = 'round'; x.beginPath(); x.moveTo(0.02 * H, -(0.56 + b) * H); x.lineTo(0.06 * H, -(0.48 + b) * H); x.lineTo(0.02 * H, -(0.43 + b) * H); x.lineTo(0.07 * H, -(0.36 + b) * H); x.stroke();
    x.restore();
  }
  // 팔 (무릎 위에)
  [[-1, st], [1, e2Shd(st, 0.2)]].forEach(function (e) { var sd = e[0]; e2Li(x, H, [sd * 0.16, 0.55 + b], [sd * 0.13, 0.33 + b], 0.085, 0.075, e[1]); e2El(x, H, sd * 0.12, 0.3 + b, 0.055, 0.05, e[1], 0, { d: 0.01 * H, rl: 0 }); });
  // 머리
  var hy = 0.0;
  x.save(); x.translate(0, -(0.68 + b) * H); x.scale(1.22, 1.22);
  [[-1, st], [1, e2Shd(st, 0.2)]].forEach(function (e) {
    var sd = e[0];
    e2Po(x, H, [[sd * 0.12, hy + 0.06], [sd * 0.25, hy + 0.04], [sd * 0.13, hy - 0.03]], e[1], { d: 0, rl: 0 });
    e2Po(x, H, [[sd * 0.03, hy + 0.11], [sd * 0.1, hy + 0.2], [sd * 0.13, hy + 0.33], [sd * 0.19, hy + 0.17], [sd * 0.14, hy + 0.07]], '#3f4670', { d: 0, rl: 0 });
  });
  e2Bl(x, H, [[-0.12, hy - 0.07], [-0.15, hy + 0.05], [-0.07, hy + 0.14], [0.07, hy + 0.14], [0.15, hy + 0.05], [0.12, hy - 0.07], [0.0, hy - 0.13]], st, { d: 0.03 * H });
  e2Pt(x, H, [[-0.13, hy + 0.08], [-0.01, hy + 0.035], [0.0, hy + 0.06], [0.01, hy + 0.035], [0.13, hy + 0.08], [0.11, hy + 0.03], [0.02, hy + 0.0], [-0.02, hy + 0.0], [-0.11, hy + 0.03]], '#2a2748');
  e2Eye(x, H, -0.065, hy + 0.03, 0.032, 0.02, '#ffa92c', 1, 3.4); e2Eye(x, H, 0.065, hy + 0.03, 0.032, 0.02, '#ffa92c', -1, 3.4);
  e2Pt(x, H, [[-0.07, hy - 0.05], [0.0, hy - 0.035], [0.07, hy - 0.05], [0.04, hy - 0.085], [-0.04, hy - 0.085]], '#2a2748');
  e2Pt(x, H, [[-0.065, hy - 0.08], [-0.045, hy - 0.025], [-0.025, hy - 0.08]], '#f3ecd8'); e2Pt(x, H, [[0.025, hy - 0.08], [0.045, hy - 0.025], [0.065, hy - 0.08]], '#f3ecd8');
  x.restore();
} };
// 흡혈귀의 박쥐 모습: 진홍 날개막과 작은 높은 깃, 창백한 얼굴 털, 붉은 눈과 송곳니
EN_DRAW.vampbat = { n: 6, f: function (x, H, p) {
  var a = p * 6.2832, col = '#2b1f55', lin = '#c22a4e', cy = 0.46 - Math.sin(a) * 0.03, L = 0.5;
  EN_ONE = E2K;
  e2Bat(x, H, 0, cy, L, Math.sin(a), col, '#ff3f58', { mem: lin,
    back: function (r) { [-1, 1].forEach(function (sd) { e2Po(x, H, [[sd * r * 0.3, cy + r * 0.2], [sd * r * 1.25, cy + r * 1.35], [sd * r * 1.0, cy - r * 0.1]], sd < 0 ? lin : e2Shd(lin, 0.25), { d: 0, rl: 0, oc: col }); }); },
    front: function (r) {
      e2Pt(x, H, [[-r * 0.55, cy - r * 0.15], [0, cy + r * 0.25], [r * 0.55, cy - r * 0.15], [r * 0.3, cy - r * 0.8], [0, cy - r * 0.95], [-r * 0.3, cy - r * 0.8]], '#ece4f7', 0.95, 1);
      e2Pt(x, H, [[-r * 0.22, cy - r * 0.02], [-r * 0.06, cy - r * 0.02], [-r * 0.13, cy - r * 0.32]], '#ffffff'); e2Pt(x, H, [[r * 0.08, cy - r * 0.02], [r * 0.24, cy - r * 0.02], [r * 0.17, cy - r * 0.32]], '#ffffff');
    } });
} };
// 변신 모습용 자료가 없으면(ENG1 이 따로 넣지 않았을 때) enemyFrames 가 쓸 최소 자료를 넣어 둠
if (!ENEMIES.vampbat) ENEMIES.vampbat = { name: '흡혈 박쥐', dom: 'a', hp: 200, spd: 1.6, gold: 0, leak: 1, size: 0.6, desc: '흡혈귀가 변신한 모습.', fly: 1, form: 1 };

// ---------- 우두머리 ----------
// 불꽃(푸른 혼불, 등불): 밑동 (bx, by), 폭 w, 높이 h, 기울기 lean
function e2Flm(x, H, bx, by, w, h, lean, col, core) {
  e2Bl(x, H, [[bx - w * 0.5, by + h * 0.12], [bx - w * 0.42, by + h * 0.5], [bx + lean, by + h], [bx + w * 0.42, by + h * 0.45], [bx + w * 0.5, by + h * 0.1], [bx, by - h * 0.06]], col, { d: 0, rl: 0, hi: 0.3, lo: 0.1 });
  e2Pt(x, H, [[bx - w * 0.24, by + h * 0.14], [bx - w * 0.16, by + h * 0.4], [bx + lean * 0.5, by + h * 0.66], [bx + w * 0.2, by + h * 0.36], [bx + w * 0.24, by + h * 0.12], [bx, by + h * 0.02]], core, 0.95, 1);
}
// 호박 대왕: 골이 깊은 거대한 호박 몸에 불타는 눈과 톱니 입, 가시 덩굴 왕관, 굵은 덩굴 팔(한쪽엔 꼬마 호박 등불), 뿌리 발, 해진 보라 망토. 육중하게 뒤뚱뒤뚱
EN_DRAW.pumpking = { n: 6, f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), or = '#ff931f', dk = '#ec7412', vine = '#46a05c', vd = '#2c6e48', cape = '#4f2d84', hot = '#ffe66e';
  EN_ONE = E2K; H *= 0.94;
  var w = s * 0.03;
  x.save(); x.translate(0, -Math.abs(c) * 0.014 * H); x.rotate(s * 0.035);
  // 망토
  e2Po(x, H, [[-0.36, 0.74], [-0.57, 0.42], [-0.62, 0.07 + w], [-0.52, 0.14], [-0.44, 0.04], [-0.35, 0.13], [-0.25, 0.05], [-0.12, 0.12], [0.12, 0.12], [0.25, 0.05], [0.35, 0.13], [0.44, 0.04], [0.52, 0.14], [0.62, 0.07 - w], [0.57, 0.42], [0.36, 0.74]], cape, { d: 0, rl: 0 });
  // 뿌리 발
  [[-1, e2Shd(vd, 0.2)], [1, vd]].forEach(function (e) {
    var sd = e[0], q = sd * s * 0.035, fx = sd * 0.22 + q, lift = Math.max(0, sd * c) * 0.025;
    for (var j = -1; j <= 1; j++) e2Ln(x, H, [[fx, 0.08 + lift], [fx + j * 0.09 + 0.02, 0.025 + lift]], 0.05, e[1]);
    e2Li(x, H, [sd * 0.19, 0.22], [fx, 0.08 + lift], 0.17, 0.13, e[1]);
  });
  // 덩굴 팔 (뒤: 꼬마 호박 등불을 든 팔)
  var sw = Math.sin(a + 0.8) * 0.035;
  e2Ln(x, H, [[-0.42, 0.5], [-0.7, 0.44], [-0.72, 0.68 + sw]], 0.085, vd); e2Ln(x, H, [[-0.72, 0.68 + sw], [-0.72, 0.8 + sw], [-0.62, 0.78 + sw]], 0.055, vd);
  e2Bl(x, H, [[-0.72, 0.7 + sw], [-0.86, 0.78 + sw], [-0.9, 0.66 + sw], [-0.8, 0.62 + sw]], vine, { d: 0.01 * H, rl: 0 });
  e2Ln(x, H, [[-0.66, 0.6 + sw], [-0.63, 0.46 + sw * 1.6]], 0.016, vd);
  e2Glow(x, H, -0.63, 0.38 + sw * 1.6, 0.24, '#ffa92c', 0.5);
  e2El(x, H, -0.63, 0.38 + sw * 1.6, 0.1, 0.085, or, 0, { d: 0.02 * H, rl: 0 });
  e2Pt(x, H, [[-0.69, 0.41 + sw * 1.6], [-0.65, 0.39 + sw * 1.6], [-0.68, 0.38 + sw * 1.6]], hot); e2Pt(x, H, [[-0.61, 0.39 + sw * 1.6], [-0.57, 0.41 + sw * 1.6], [-0.58, 0.38 + sw * 1.6]], hot);
  e2Pt(x, H, [[-0.69, 0.355 + sw * 1.6], [-0.63, 0.34 + sw * 1.6], [-0.57, 0.355 + sw * 1.6], [-0.63, 0.31 + sw * 1.6]], hot);
  // 덩굴 팔 (앞: 가시 달린 채찍 덩굴)
  var sn = Math.sin(a - 0.6) * 0.04;
  e2Ln(x, H, [[0.42, 0.48], [0.72, 0.42], [0.74, 0.7 + sn]], 0.09, vine); e2Ln(x, H, [[0.74, 0.7 + sn], [0.75, 0.86 + sn], [0.62, 0.84 + sn]], 0.06, vine); e2Ln(x, H, [[0.62, 0.84 + sn], [0.56, 0.8 + sn], [0.62, 0.76 + sn]], 0.04, vine);
  [[0.6, 0.47, 0.5], [0.73, 0.56, 2.8], [0.75, 0.74 + sn, 0.2]].forEach(function (t) { e2Po(x, H, [[t[0] - 0.03, t[1]], [t[0] + Math.cos(t[2]) * 0.09, t[1] + Math.sin(t[2]) * 0.09], [t[0] + 0.03, t[1] + 0.01]], '#f3ecd8', { d: 0, rl: 0, oc: vd }); });
  e2Bl(x, H, [[0.74, 0.72 + sn], [0.88, 0.8 + sn], [0.93, 0.68 + sn], [0.82, 0.63 + sn]], vine, { d: 0.01 * H, rl: 0 });
  // 몸: 호박 골 다섯 쪽
  e2Glow(x, H, 0, 0.44, 0.6, '#ff9a24', 0.32);
  e2El(x, H, -0.36, 0.44, 0.19, 0.29, e2Shd(dk, 0.12), 0, { d: 0.05 * H }); e2El(x, H, 0.36, 0.44, 0.19, 0.29, e2Shd(dk, 0.34), 0, { d: 0, rl: 0 });
  e2El(x, H, -0.19, 0.44, 0.21, 0.335, dk, 0, { d: 0, rl: 1 }); e2El(x, H, 0.2, 0.44, 0.21, 0.335, e2Shd(dk, 0.16), 0, { d: 0.05 * H, rl: 0 });
  e2El(x, H, 0.0, 0.43, 0.215, 0.355, or, 0, { d: 0.05 * H, hi: 0.28 });
  // 얼굴: 깎아 낸 테두리(어두운 주황) 위에 불빛
  var fl = 0.86 + 0.14 * Math.sin(a * 3);
  [[0.014, '#7a2a04', 1], [0, hot, fl]].forEach(function (L) {
    var d = L[0];
    e2Pt(x, H, [[-0.33, 0.65 + d], [-0.07, 0.5 + d], [-0.1, 0.45 + d], [-0.29, 0.47 + d]], L[1], L[2]); e2Pt(x, H, [[0.07, 0.5 + d], [0.33, 0.65 + d], [0.29, 0.47 + d], [0.1, 0.45 + d]], L[1], L[2]);
    e2Pt(x, H, [[-0.035, 0.44 + d], [-0.01, 0.4 + d], [-0.05, 0.4 + d]], L[1], L[2]); e2Pt(x, H, [[0.035, 0.44 + d], [0.05, 0.4 + d], [0.01, 0.4 + d]], L[1], L[2]);
    e2Pt(x, H, [[-0.36, 0.37 + d], [-0.28, 0.3 + d], [-0.21, 0.36 + d], [-0.14, 0.29 + d], [-0.07, 0.35 + d], [0, 0.28 + d], [0.07, 0.35 + d], [0.14, 0.29 + d], [0.21, 0.36 + d], [0.28, 0.3 + d], [0.36, 0.37 + d],
      [0.31, 0.23 + d], [0.23, 0.15 + d], [0.17, 0.22 + d], [0.1, 0.13 + d], [0.05, 0.2 + d], [0, 0.12 + d], [-0.05, 0.2 + d], [-0.1, 0.13 + d], [-0.17, 0.22 + d], [-0.23, 0.15 + d], [-0.31, 0.23 + d]], L[1], L[2]);
  });
  e2Pt(x, H, [[-0.27, 0.57], [-0.13, 0.5], [-0.24, 0.49]], '#fffbe0', 0.9); e2Pt(x, H, [[0.13, 0.5], [0.27, 0.57], [0.24, 0.49]], '#fffbe0', 0.9);
  e2Glow(x, H, 0, 0.4, 0.42, '#ffd24a', 0.5);
  enEyeRec(x, -0.2 * H, -0.53 * H, 0.1 * H, 0.07 * H, 1); enEyeRec(x, 0.2 * H, -0.53 * H, 0.1 * H, 0.07 * H, -1);
  // 덩굴 왕관
  var cy = 0.775;
  e2Bl(x, H, [[-0.2, cy + 0.02], [-0.42, cy + 0.07], [-0.5, cy - 0.04], [-0.36, cy - 0.06]], vine, { d: 0.012 * H, rl: 0 }); e2Bl(x, H, [[0.2, cy + 0.02], [0.42, cy + 0.08], [0.5, cy - 0.03], [0.36, cy - 0.06]], e2Shd(vine, 0.2), { d: 0.012 * H, rl: 0 });
  [[-0.25, 0.2, -0.05], [0.25, 0.2, 0.05], [-0.13, 0.27, -0.025], [0.13, 0.27, 0.025], [0, 0.36, -0.012]].forEach(function (t, j) {
    e2Po(x, H, [[t[0] - 0.075, cy - 0.01], [t[0] + t[2] - 0.035, cy + t[1] * 0.62], [t[0] + t[2] * 1.9, cy + t[1]], [t[0] + t[2] + 0.04, cy + t[1] * 0.58], [t[0] + 0.075, cy - 0.01]], j === 4 ? '#5cb86c' : j % 2 ? e2Shd(vd, 0.1) : vd, { d: 0.02 * H, rl: j % 2 ? 0 : 1 });
    e2Glow(x, H, t[0] + t[2] * 1.9, cy + t[1] - 0.01, 0.07, '#ffb23a', 0.75); e2Dot(x, H, t[0] + t[2] * 1.9, cy + t[1] - 0.016, 0.013, '#ffe9a0');
  });
  var ring = e2El(x, H, 0, cy, 0.34, 0.07, vd, 0, { d: 0.02 * H });
  if (!enMode) { x.save(); x.clip(ring.p); x.strokeStyle = vine; x.lineWidth = Math.max(1, H * 0.02); for (var j = -5; j <= 5; j++) { x.beginPath(); x.moveTo((j * 0.06 - 0.02) * H, -(cy - 0.06) * H); x.lineTo((j * 0.06 + 0.03) * H, -(cy + 0.06) * H); x.stroke(); } x.restore(); }
  x.restore();
} };
// 흡혈 백작: 박쥐 날개처럼 펼친 진홍 안감의 큰 망토, 머리 위로 솟은 높은 깃, 금테 연미복과 흰 가슴 장식, 창백한 얼굴에 붉은 눈, 작은 금관. 땅에서 살짝 떠서 다가온다
EN_DRAW.count = { n: 6, f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), cape = '#231a4a', lin = '#bd2449', skin = '#ece4f7', hair = '#151030', coat = '#3a2e78', gold = '#e8b53a';
  EN_ONE = E2K; H *= 0.8;
  var b = 0.05 + s * 0.015, fl = s * 0.09, Z = 1.22;
  e2Glow(x, H, 0, 0.06, 0.3, '#b03cff', 0.25);
  // 날개 망토
  [[1, 0.94], [-1, 1]].forEach(function (e) {
    var sd = e[0], k = 0.92 * e[1];
    x.save(); x.translate(sd * 0.12 * H, -(0.1 + (0.64 + b) * Z) * H); x.scale(sd, 1); x.rotate(-fl - 0.04);
    var wp = [[0, 0.04], [0.24, 0.26], [0.5, 0.33], [0.57, 0.45], [0.6, 0.3], [0.82, 0.1], [0.7, -0.04], [0.74, -0.36], [0.55, -0.28], [0.52, -0.6], [0.34, -0.47], [0.26, -0.76], [0.13, -0.56], [0.03, -0.4]];
    e2Po(x, H, wp.map(function (t) { return [t[0] * k, t[1] * k]; }), cape, { d: 0, rl: 0 });
    e2Pt(x, H, wp.map(function (t) { return [(0.4 + (t[0] - 0.4) * 0.86) * k, (-0.12 + (t[1] + 0.12) * 0.88) * k]; }), sd > 0 ? e2Shd(lin, 0.2) : lin);
    // 날개막 주름: 몸 쪽과 한 칸 건너 한 칸을 어둡게
    [[[0.03, 0.06], [0.24, 0.26], [0.5, 0.31], [0.26, -0.76], [0.13, -0.56], [0.03, -0.4]], [[0.5, 0.31], [0.74, -0.36], [0.55, -0.28], [0.52, -0.6]]].forEach(function (q, j) { e2Pt(x, H, q.map(function (t) { return [(0.4 + (t[0] - 0.4) * 0.86) * k, (-0.12 + (t[1] + 0.12) * 0.88) * k]; }), '#4a0c2c', j ? 0.2 : 0.3); });
    [[0.82, 0.1], [0.74, -0.36], [0.52, -0.6], [0.26, -0.76]].forEach(function (t) { e2Ln(x, H, [[0.5 * k, 0.31 * k], [t[0] * k, t[1] * k]], 0.022, cape, 1); });
    e2Po(x, H, [[0, 0.07 * k], [0.24 * k, 0.29 * k], [0.5 * k, 0.36 * k], [0.57 * k, 0.47 * k], [0.6 * k, 0.3 * k], [0.5 * k, 0.24 * k], [0.26 * k, 0.17 * k], [0, -0.05 * k]], sd > 0 ? e2Shd(cape, 0.15) : cape, { d: 0.02 * H, rl: sd < 0 ? 1 : 0 });
    e2Bl(x, H, [[0.5 * k, 0.37 * k], [0.6 * k, 0.4 * k], [0.66 * k, 0.33 * k], [0.6 * k, 0.3 * k], [0.64 * k, 0.24 * k], [0.52 * k, 0.26 * k]], skin, { d: 0, rl: 0 });
    x.restore();
  });
  // 몸 (날개보다 또렷하게 조금 키움)
  x.save(); x.translate(0, -0.1 * H); x.scale(Z, Z); x.translate(0, 0.1 * H);
  [[-1, e2Shd(coat, 0.35)], [1, e2Shd(coat, 0.2)]].forEach(function (e) { var sd = e[0], q = sd * s * 0.012; e2Li(x, H, [sd * 0.055, 0.4 + b], [sd * 0.06 + q, 0.16 + b], 0.085, 0.065, e[1]); e2Bl(x, H, [[sd * 0.06 + q - 0.04, 0.2 + b], [sd * 0.06 + q + 0.045, 0.2 + b], [sd * 0.06 + q + 0.05, 0.1 + b], [sd * 0.06 + q + 0.02, 0.03 + b], [sd * 0.06 + q - 0.03, 0.1 + b]], hair, { d: 0.01 * H, rl: 0 }); });
  var body = e2Po(x, H, [[-0.14, 0.72 + b], [-0.15, 0.5 + b], [-0.17, 0.3 + b], [-0.07, 0.36 + b], [0, 0.44 + b], [0.07, 0.36 + b], [0.17, 0.3 + b], [0.15, 0.5 + b], [0.14, 0.72 + b], [0, 0.78 + b]], coat, { d: 0.035 * H });
  if (!enMode) { x.save(); x.clip(body.p); x.strokeStyle = gold; x.lineWidth = Math.max(1, H * 0.014); x.beginPath(); x.moveTo(-0.045 * H, -(0.74 + b) * H); x.lineTo(-0.06 * H, -(0.36 + b) * H); x.moveTo(0.045 * H, -(0.74 + b) * H); x.lineTo(0.06 * H, -(0.36 + b) * H); x.stroke(); x.fillStyle = lin; x.fillRect(-0.2 * H, -(0.52 + b) * H, 0.4 * H, 0.05 * H); x.restore(); }
  [0.47, 0.6].forEach(function (yy) { e2Dot(x, H, -0.085, yy + b - 0.03, 0.013, gold); e2Dot(x, H, 0.085, yy + b - 0.03, 0.013, gold); });
  e2Bl(x, H, [[-0.07, 0.76 + b], [0.07, 0.76 + b], [0.06, 0.66 + b], [0.03, 0.6 + b], [0, 0.64 + b], [-0.03, 0.6 + b], [-0.06, 0.66 + b]], '#f4efff', { d: 0.012 * H, rl: 0, oc: '#3d2f6e' });
  e2Glow(x, H, 0, 0.73 + b, 0.1, '#ff4a66', 0.7); e2El(x, H, 0, 0.735 + b, 0.03, 0.034, '#ff4a66', 0, { d: 0, rl: 0, hi: 0.5 }); e2Dot(x, H, -0.008, 0.745 + b, 0.009, '#ffffff', 0.9);
  // 높은 깃
  e2Po(x, H, [[0.15, 0.74 + b], [0.31, 1.13 + b], [0.07, 0.94 + b], [0.04, 0.78 + b]], e2Shd(lin, 0.15), { d: 0.02 * H, rl: 0, oc: cape });
  e2Po(x, H, [[-0.15, 0.74 + b], [-0.31, 1.13 + b], [-0.07, 0.94 + b], [-0.04, 0.78 + b]], lin, { d: 0.02 * H, rl: 0, oc: cape });
  // 머리
  var hy = 0.9 + b;
  e2Po(x, H, [[-0.1, hy + 0.05], [-0.2, hy + 0.1], [-0.11, hy - 0.02]], skin, { d: 0, rl: 0 }); e2Po(x, H, [[0.1, hy + 0.05], [0.2, hy + 0.1], [0.11, hy - 0.02]], e2Shd(skin, 0.15), { d: 0, rl: 0 });
  e2Bl(x, H, [[-0.105, hy - 0.05], [-0.125, hy + 0.06], [-0.06, hy + 0.14], [0.06, hy + 0.14], [0.125, hy + 0.06], [0.105, hy - 0.05], [0, hy - 0.125]], skin, { d: 0.03 * H, rl: 0 });
  e2Bl(x, H, [[-0.135, hy + 0.04], [-0.2, hy + 0.2], [-0.085, hy + 0.17], [0, hy + 0.2], [0.085, hy + 0.17], [0.2, hy + 0.2], [0.135, hy + 0.04], [0.075, hy + 0.1], [0, hy + 0.045], [-0.075, hy + 0.1]], hair, { d: 0.02 * H });
  e2Po(x, H, [[-0.075, hy + 0.15], [-0.085, hy + 0.23], [-0.04, hy + 0.19], [0, hy + 0.26], [0.04, hy + 0.19], [0.085, hy + 0.23], [0.075, hy + 0.15]], gold, { d: 0.008 * H, rl: 0 });
  e2Dot(x, H, 0, hy + 0.185, 0.016, '#ff4a66');
  e2Pt(x, H, [[-0.095, hy + 0.055], [-0.015, hy + 0.01], [-0.085, hy + 0.0]], '#3a2a55', 0.9); e2Pt(x, H, [[0.015, hy + 0.01], [0.095, hy + 0.055], [0.085, hy + 0.0]], '#3a2a55', 0.9);
  e2Eye(x, H, -0.052, hy + 0.018, 0.03, 0.018, '#ff3f58', 1, 3.6); e2Eye(x, H, 0.052, hy + 0.018, 0.03, 0.018, '#ff3f58', -1, 3.6);
  e2Ln(x, H, [[-0.05, hy - 0.055], [0, hy - 0.075], [0.055, hy - 0.045]], 0.01, '#5a3a6a', 1);
  e2Pt(x, H, [[-0.035, hy - 0.06], [-0.012, hy - 0.068], [-0.022, hy - 0.1]], '#ffffff'); e2Pt(x, H, [[0.015, hy - 0.068], [0.038, hy - 0.058], [0.028, hy - 0.1]], '#ffffff');
  x.restore();
  // 곁을 도는 꼬마 박쥐
  e2Bat(x, H, -0.56 + c * 0.05, 1.2 + b + s * 0.03, 0.15, Math.sin(a * 2 + 1), '#3a2c7a', '#ff6a7a');
  e2Bat(x, H, 0.6 - c * 0.05, 0.2 + b - s * 0.03, 0.13, Math.sin(a * 2 + 3), '#3a2c7a', '#ff6a7a');
} };
// 사신: 앞으로 처진 뾰족 두건 속 어둠에 푸른 두 눈, 머리 위로 크게 휘어 넘어가는 낫, 해진 남색 수의와 어깨 망토, 뼈 손에 든 혼불 등, 발 대신 타오르는 푸른 불. 둥실 떠서 온다
EN_DRAW.reaper = { f: function (x, H, p) {
  var a = p * 6.2832, s = Math.sin(a), c = Math.cos(a), robe = '#262058', man = '#40398e', steel = '#aebbe0', fire = '#46c8ff', core = '#d6f8ff', bone = '#f1ead8', wood = '#6a4f96';
  EN_ONE = E2K; H *= 0.8;
  var b = 0.08 + s * 0.02, w = s * 0.03, w2 = c * 0.025;
  e2Glow(x, H, 0, 0.2, 0.44, '#3fb4ff', 0.42);
  // 발밑 푸른 불 (뒤)
  [[-0.3, 0.1, 0.24], [-0.14, 0.13, 0.3], [0.04, 0.12, 0.34], [0.22, 0.12, 0.27]].forEach(function (t, j) { var fh = t[2] * (0.85 + 0.2 * Math.sin(a * 2 + j * 1.9)); e2Flm(x, H, t[0], 0.02 + b * 0.3, t[1] * 1.5, fh, Math.sin(a + j * 1.3) * 0.04 - 0.03, fire, core); });
  // 큰 낫: 자루는 등 뒤, 날은 머리 위를 넘어 앞으로
  x.save(); x.translate(-0.3 * H, -(0.56 + b) * H); x.rotate(0.04 + s * 0.025);
  e2Ln(x, H, [[-0.04, -0.5], [0.05, 0.66]], 0.05, wood);
  var bl = e2Bl(x, H, [[0.0, 0.58], [0.1, 0.76], [0.4, 0.84], [0.7, 0.72], [0.9, 0.46], [0.95, 0.14], [0.8, 0.38], [0.6, 0.56], [0.34, 0.63], [0.1, 0.5]], steel, { d: 0.05 * H, hi: 0.55, lo: 0.5, sa: 0.75, ra: 0.95, rc: '#ffffff', oc: '#3a4a8a' });
  if (!enMode) { x.save(); x.clip(bl.p); x.strokeStyle = '#6fe0ff'; x.lineWidth = Math.max(1.2, H * 0.03); x.lineCap = 'round'; var q = e2M(H, [[0.95, 0.12], [0.8, 0.36], [0.6, 0.54], [0.34, 0.61], [0.08, 0.48]]); x.beginPath(); x.moveTo(q[0][0], q[0][1]); x.quadraticCurveTo(q[1][0], q[1][1], q[2][0], q[2][1]); x.quadraticCurveTo(q[3][0], q[3][1], q[4][0], q[4][1]); x.stroke(); x.restore(); }
  e2Glow(x, H, 0.93, 0.18, 0.16, '#7fe6ff', 0.7);
  e2Po(x, H, [[-0.03, 0.56], [-0.1, 0.7], [0.02, 0.8], [0.12, 0.68], [0.1, 0.54]], '#7d8ab8', { d: 0.012 * H, rl: 0 });
  e2Dot(x, H, 0.02, 0.67, 0.026, '#6fe0ff');
  x.restore();
  // 수의
  var body = e2Po(x, H, [[-0.2, 0.74 + b], [-0.31, 0.5 + b], [-0.38, 0.22 + b + w], [-0.31, 0.11 + b], [-0.25, 0.21 + b], [-0.17, 0.08 + b + w2], [-0.1, 0.2 + b], [-0.03, 0.06 + b], [0.05, 0.19 + b], [0.12, 0.07 + b - w2], [0.19, 0.2 + b], [0.25, 0.1 + b], [0.32, 0.24 + b - w], [0.27, 0.5 + b], [0.18, 0.74 + b], [0, 0.8 + b]], robe, { d: 0.05 * H });
  if (!enMode) { x.save(); x.clip(body.p); x.strokeStyle = rgba(man, 0.95); x.lineWidth = Math.max(1, H * 0.022); x.lineCap = 'round'; [[-0.16, -0.24], [-0.04, -0.07], [0.09, 0.14], [0.18, 0.27]].forEach(function (t) { x.beginPath(); x.moveTo(t[0] * 0.6 * H, -(0.62 + b) * H); x.quadraticCurveTo(t[0] * H, -(0.4 + b) * H, t[1] * H, -(0.14 + b) * H); x.stroke(); }); x.restore(); }
  // 발밑 불 (앞, 작은 것)
  [[-0.22, 0.2], [0.13, 0.17]].forEach(function (t, j) { e2Flm(x, H, t[0], 0.0 + b * 0.3, 0.1, t[1] * (0.85 + 0.25 * Math.sin(a * 2 + j * 2.4 + 1)), Math.sin(a + j * 2) * 0.03, '#7fdcff', '#f0fdff'); });
  // 낫 자루를 쥔 뒤 팔
  e2Bl(x, H, [[-0.1, 0.75 + b], [-0.25, 0.73 + b], [-0.39, 0.63 + b], [-0.4, 0.49 + b], [-0.33, 0.52 + b], [-0.27, 0.45 + b], [-0.16, 0.56 + b]], e2Shd(robe, 0.12), { d: 0.03 * H });
  x.save(); x.translate(-0.3 * H, -(0.56 + b) * H); x.rotate(0.04 + s * 0.025); e2Ln(x, H, [[-0.04, -0.5], [0.002, 0.03]], 0.05, wood); e2Po(x, H, [[-0.075, -0.5], [-0.04, -0.58], [-0.005, -0.5]], '#7d8ab8', { d: 0, rl: 0 }); x.restore();
  e2El(x, H, -0.3, 0.55 + b, 0.055, 0.045, bone, 0, { d: 0, rl: 0, oc: '#3d2f4e' });
  if (!enMode) for (var j = 0; j < 3; j++) e2Ln(x, H, [[-0.335 + j * 0.022, 0.575 + b], [-0.325 + j * 0.022, 0.53 + b]], 0.008, '#3d2f4e', 1);
  // 어깨 망토
  e2Po(x, H, [[-0.25, 0.78 + b], [-0.36, 0.58 + b], [-0.27, 0.62 + b], [-0.21, 0.53 + b], [-0.13, 0.61 + b], [-0.05, 0.54 + b], [0.04, 0.61 + b], [0.12, 0.53 + b], [0.2, 0.61 + b], [0.3, 0.56 + b], [0.22, 0.78 + b], [0, 0.84 + b]], man, { d: 0.03 * H });
  // 두건과 어둠 속 눈
  var hy = 0.75 + b;
  e2Bl(x, H, [[-0.2, hy], [-0.255, hy + 0.18], [-0.15, hy + 0.31], [0.03, hy + 0.345], [0.23, hy + 0.3], [0.335, hy + 0.2], [0.24, hy + 0.035], [0.0, hy - 0.05]], robe, { d: 0.045 * H });
  e2Pt(x, H, [[-0.05, hy + 0.03], [-0.1, hy + 0.17], [0.01, hy + 0.265], [0.16, hy + 0.255], [0.25, hy + 0.165], [0.19, hy + 0.03]], '#080512', 1, 1);
  e2Pt(x, H, [[0.02, hy + 0.115], [0.2, hy + 0.115], [0.17, hy + 0.04], [0.05, hy + 0.04]], '#8fb0d8', 0.22, 1);
  e2Eye(x, H, 0.055, hy + 0.15, 0.034, 0.03, '#6fe6ff', 1, 3.8); e2Eye(x, H, 0.165, hy + 0.15, 0.028, 0.026, '#6fe6ff', -1, 3.8);
  e2Ln(x, H, [[-0.2, hy + 0.05], [-0.2, hy + 0.21], [-0.08, hy + 0.3]], 0.016, man, 1, 0.8);
  // 혼불 등을 든 앞 팔
  var ly = Math.sin(a + 1.2) * 0.02, lx = 0.43, lt = 0.42 + b + ly * 1.6;
  e2Ln(x, H, [[lx - 0.01, 0.55 + b + ly], [lx, lt]], 0.014, '#8f9cc4');
  e2Glow(x, H, lx, lt - 0.09, 0.34, '#46c8ff', 0.6);
  e2F(x, shp().rrect((lx - 0.065) * H, -lt * H, 0.13 * H, 0.18 * H, 0.03 * H), '#1b2a55', { d: 0.01 * H, rl: 0 });
  e2Pt(x, H, [[lx - 0.042, lt - 0.15], [lx - 0.034, lt - 0.08], [lx, lt - 0.02], [lx + 0.034, lt - 0.09], [lx + 0.042, lt - 0.15]], fire, 1, 1);
  e2Pt(x, H, [[lx - 0.02, lt - 0.15], [lx, lt - 0.07], [lx + 0.02, lt - 0.15]], core, 1, 1);
  e2Bl(x, H, [[0.08, 0.76 + b], [0.24, 0.72 + b], [0.42, 0.63 + b + ly], [0.44, 0.48 + b + ly], [0.36, 0.53 + b + ly], [0.29, 0.44 + b], [0.12, 0.55 + b]], robe, { d: 0.03 * H });
  e2El(x, H, 0.425, 0.56 + b + ly, 0.05, 0.042, bone, 0, { d: 0, rl: 0, oc: '#3d2f4e' });
} };
// 전투 크기에서 1장 적(통통한 찹쌀떡)과 덩치가 맞도록, 가늘거나 낮은 적은 조금 키워 그림 (기준점과 외곽선 굵기는 그대로)
(function () {
  var K = { zombie: 1.14, ghoul: 1.2, phantom: 1.13, pumpkin: 1.18, bats: 1.3, witch: 1.1, mummy: 1.1, werewolf: 1.06, vampire: 1.12, coffin: 1.04, doll: 1.24, gargoyle: 1.06, vampbat: 1.14 };
  Object.keys(K).forEach(function (k) { var f0 = EN_DRAW[k].f, m = K[k]; EN_DRAW[k].f = function (x, H, p) { f0(x, H * m, p); }; });
})();
// 적별 대표색 (처치 솜구름, 도감 바탕 같은 데 쓰라고 내어 둠. 그림에는 쓰지 않음)
var E2_TINT = { zombie: '#8fd6a2', ghoul: '#bfaee6', phantom: '#d2f4ff', pumpkin: '#ff9020', bats: '#5a49b0', witch: '#6a3aa6', mummy: '#eadfbe', scarab: '#18b8a8', werewolf: '#6a7cb0', vampire: '#d02f55', coffin: '#7a4f7c', doll: '#c8385c', gargoyle: '#8a96ba', vampbat: '#c22a4e', pumpking: '#ff931f', count: '#bd2449', reaper: '#46c8ff' };
