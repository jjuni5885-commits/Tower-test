// ===== art_enemy_ch3.js : 3장 강철 전선 적 19종 + 잠수함 잠수 모습 (EN3) =====
// 방식은 art_enemy.js 그대로: EN_DRAW[k] = { n, top, f(x, H, p) }, 세 번 그리기(크기 재기 → 외곽선 → 색칠), 오른쪽이 진행 방향
// 탈것은 통통 튀지 않는다: 바퀴, 궤도, 프로펠러가 프레임마다 돌고 차체만 살짝 흔들린다
// 땅 적은 발밑(0, 0) 기준. 위에서 본 적(top: 1)은 e3Top이 몸 가운데를 돌림 중심(기준점 위 H * 0.46 / 3)에 맞춘다
var E3K = '#1a222b'; // 지금 그리는 적의 외곽선 색 (적마다 처음에 정함)
var E3 = { ol: '#6f8a44', olD: '#566e38', olL: '#93ab5e', tan: '#cba86a', tanD: '#a8854d', st: '#7d91a8', stD: '#5b6d84', stL: '#a9bacb', gun: '#4a5461', gunL: '#6d7989', tire: '#2a2e36', or: '#ff8a1c', red: '#ff3b2f', gl: '#86dcee', glD: '#2b4a5e', wh: '#edf1f4', hull: '#96a3b1', deck: '#586371', navy: '#35455c', skin: '#f1c9a0', yel: '#ffd23a', smoke: '#e8e6e0' };

// ---------- 공통 도구 ----------
function e3Pass(x, s, lw) {
  if (!enMode) return false;
  var w = enLW * (lw || 1);
  if (enMode === 2) { enBBbox(x, s.x0, s.y0, s.x1, s.y1, enOL + w); return true; }
  x.fillStyle = E3K; x.fill(s.p); x.lineWidth = enOL * 2 + w; x.strokeStyle = E3K; x.stroke(s.p);
  return true;
}
// 금속 칠: 또렷한 3단 명암. sh: 'v' 위 밝고 아래 어둡게(기본), 'c' 가운데 밝고 양 가장자리 어둡게(위에서 본 선체), 'm' 대각선 금속 반사, 'f' 단색
function e3F(x, s, c, o) {
  o = o || {};
  if (e3Pass(x, s, o.lw)) return s;
  var sh = o.sh || 'v', g, L = mixc(c, '#ffffff', o.hi == null ? 0.26 : o.hi), D = mixc(c, E3K, o.lo == null ? 0.34 : o.lo);
  if (sh === 'f' || s.h() < 2.2) x.fillStyle = c;
  else if (sh === 'c') {
    g = x.createLinearGradient(0, s.y0, 0, s.y1);
    g.addColorStop(0, D); g.addColorStop(0.13, D); g.addColorStop(0.2, c); g.addColorStop(0.34, c); g.addColorStop(0.41, L); g.addColorStop(0.59, L); g.addColorStop(0.66, c); g.addColorStop(0.8, c); g.addColorStop(0.87, D); g.addColorStop(1, D);
    x.fillStyle = g;
  } else if (sh === 'm') {
    g = x.createLinearGradient(s.x0, s.y0, s.x0 + s.w() * 0.55, s.y1);
    g.addColorStop(0, mixc(c, '#ffffff', 0.6)); g.addColorStop(0.28, L); g.addColorStop(0.46, c); g.addColorStop(0.6, D); g.addColorStop(0.74, L); g.addColorStop(1, D);
    x.fillStyle = g;
  } else {
    var a = o.a == null ? 0.3 : o.a, b = o.b == null ? 0.7 : o.b;
    g = x.createLinearGradient(0, s.y0, 0, s.y1);
    g.addColorStop(0, L); g.addColorStop(Math.max(0, a - 0.04), L); g.addColorStop(a + 0.04, c); g.addColorStop(b - 0.04, c); g.addColorStop(Math.min(1, b + 0.04), D); g.addColorStop(1, D);
    x.fillStyle = g;
  }
  x.fill(s.p);
  if (o.ln !== 0) { x.lineWidth = enLW * (o.lw || 1); x.strokeStyle = o.lc || mixc(c, E3K, 0.8); x.stroke(s.p); }
  return s;
}
function e3Els(cx, cy, rx, ry, rot) { var s = shp(); s.p.ellipse(cx, cy, Math.max(0.3, rx), Math.max(0.3, ry), rot || 0, 0, Math.PI * 2); var m = rot ? Math.max(rx, ry) : 0; s.ext(cx - (m || rx), cy - (m || ry)); s.ext(cx + (m || rx), cy + (m || ry)); return s; }
function e3Rr(x, x0, y0, w, h, r, c, o) { return e3F(x, shp().rrect(x0, y0, w, h, r), c, o); }
function e3Po(x, pts, c, o) { return e3F(x, shp().poly(pts), c, o); }
function e3Rp(x, pts, r, c, o) { return e3F(x, enRPoly(pts, r), c, o); }
function e3El(x, cx, cy, rx, ry, c, o) { return e3F(x, e3Els(cx, cy, rx, ry), c, o); }
function e3Bl(x, pts, c, o) { return e3F(x, shp().blob(pts), c, o); }
// H 배율 좌표 → 실제 좌표
function e3S(H, pts, dy) { var o = []; for (var i = 0; i < pts.length; i++) o.push([pts[i][0] * H, pts[i][1] * H + (dy || 0)]); return o; }
function e3Pill(x, a, b, w0, w1, c, o) {
  var s = shp(), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, an = Math.atan2(ny, nx), P = s.p, r0 = w0 / 2, r1 = w1 / 2;
  P.moveTo(a[0] + nx * r0, a[1] + ny * r0); P.lineTo(b[0] + nx * r1, b[1] + ny * r1);
  P.arc(b[0], b[1], r1, an, an - Math.PI, true); P.lineTo(a[0] - nx * r0, a[1] - ny * r0);
  P.arc(a[0], a[1], r0, an + Math.PI, an, true); P.closePath();
  var m = Math.max(r0, r1); s.ext(Math.min(a[0], b[0]) - m, Math.min(a[1], b[1]) - m); s.ext(Math.max(a[0], b[0]) + m, Math.max(a[1], b[1]) + m);
  return e3F(x, s, c, o);
}
// 선(포신, 안테나, 파이프). 외곽선 단계에서는 굵은 먹선
function e3Ln(x, pts, lw, c, cap) {
  var i, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  if (enMode === 2) { for (i = 0; i < pts.length; i++) { x0 = Math.min(x0, pts[i][0]); y0 = Math.min(y0, pts[i][1]); x1 = Math.max(x1, pts[i][0]); y1 = Math.max(y1, pts[i][1]); } enBBbox(x, x0, y0, x1, y1, lw / 2 + enOL); return; }
  x.save(); x.lineCap = cap || 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
  if (enMode) { x.lineWidth = lw + enOL * 2; x.strokeStyle = E3K; x.stroke(); }
  else { x.lineWidth = lw; x.strokeStyle = c; x.stroke(); if (lw > 2.4) { x.translate(0, -lw * 0.2); x.lineWidth = lw * 0.26; x.globalAlpha = 0.5; x.strokeStyle = '#ffffff'; x.stroke(); } }
  x.restore();
}
// --- 아래는 색칠 단계에만 그리는 잔 디테일 ---
function e3Pl(x, pts, a, w, c) { // 패널 선
  if (enMode) return;
  x.save(); x.globalAlpha = a == null ? 0.45 : a; x.strokeStyle = c || E3K; x.lineWidth = Math.max(0.7, enLW * (w || 0.8)); x.lineCap = 'butt'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.stroke(); x.restore();
}
function e3Hi(x, pts, w, a) { // 금속 하이라이트 줄
  if (enMode) return;
  x.save(); x.globalAlpha = a == null ? 0.6 : a; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.7, w); x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.stroke(); x.restore();
}
function e3Rv(x, pts, r) { // 리벳
  if (enMode) return;
  r = Math.max(0.5, r);
  for (var i = 0; i < pts.length; i++) {
    x.fillStyle = 'rgba(14,18,26,0.55)'; x.beginPath(); x.arc(pts[i][0], pts[i][1], r, 0, 7); x.fill();
    if (r > 0.8) { x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.arc(pts[i][0] - r * 0.3, pts[i][1] - r * 0.35, r * 0.45, 0, 7); x.fill(); }
  }
}
function e3Box(x, x0, y0, w, h, c, a) { if (enMode) return; x.save(); x.globalAlpha = a == null ? 1 : a; x.fillStyle = c; x.fillRect(x0, y0, w, h); x.restore(); }
function e3Dot(x, cx, cy, r, c, a) { if (enMode) return; x.save(); x.globalAlpha = a == null ? 1 : a; x.fillStyle = c; x.beginPath(); x.arc(cx, cy, Math.max(0.4, r), 0, 7); x.fill(); x.restore(); }
// 경고 빗금: 이미 칠한 모양 s 위에 대각선 줄무늬
function e3Haz(x, s, c1, c2, w) {
  if (enMode) return;
  w = Math.max(1.6, w);
  x.save(); x.clip(s.p); x.fillStyle = c1; x.fillRect(s.x0 - 1, s.y0 - 1, s.w() + 2, s.h() + 2); x.strokeStyle = c2; x.lineWidth = w; x.lineCap = 'butt';
  for (var q = s.x0 - s.h() - w * 2; q < s.x1 + w; q += w * 2.1) { x.beginPath(); x.moveTo(q, s.y1 + 1); x.lineTo(q + s.h() + 2, s.y0 - 1); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(s.x0 - 1, s.y0 - 1, s.w() + 2, s.h() * 0.3);
  x.restore();
  x.lineWidth = enLW * 0.9; x.strokeStyle = E3K; x.stroke(s.p);
}
// 표식등 (빛남)
function e3Lamp(x, cx, cy, r, c, glow) {
  r = Math.max(0.9, r);
  e3F(x, e3Els(cx, cy, r, r), c, { sh: 'f', lw: 0.7 });
  if (!enMode && r > 1.2) { x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.arc(cx - r * 0.28, cy - r * 0.3, r * 0.38, 0, 7); x.fill(); }
  if (glow) enGlow(x, cx, cy, r * glow, c, 0.6);
}
// 차량 밑 접지 그림자 (길쭉한 차체가 땅에 붙어 보이게)
function e3Shd(x, cx, rx, ry) {
  if (enMode === 2) { enBBbox(x, cx - rx, -ry, cx + rx, ry, 0); return; }
  if (enMode) return;
  x.save(); x.fillStyle = 'rgba(10,8,20,0.3)'; x.beginPath(); x.ellipse(cx, ry * 0.15, rx, ry, 0, 0, 7); x.fill(); x.restore();
}
// 연기, 먼지, 물거품: 외곽선 없이 부드럽게
function e3Puff(x, cx, cy, r, c, a) {
  if (enMode === 2) { enBBbox(x, cx - r, cy - r, cx + r, cy + r, 0); return; }
  if (enMode) return;
  x.save(); x.globalAlpha = a; x.fillStyle = c; x.beginPath(); x.arc(cx, cy, Math.max(0.4, r), 0, 7); x.fill();
  x.globalAlpha = a * 0.6; x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx - r * 0.25, cy - r * 0.28, r * 0.5, 0, 7); x.fill(); x.restore();
}
// 배기 연기 줄기: (cx, cy)에서 (dx, dy) 방향으로 흩어짐. p로 흘러감
function e3Smoke(x, cx, cy, dx, dy, r, p, c) {
  for (var i = 0; i < 3; i++) { var t = (i + p) / 3; e3Puff(x, cx + dx * t + Math.sin(i * 2.1) * r * 0.25, cy + dy * t, r * (0.55 + t * 0.75), c || E3.smoke, 0.6 * (1 - t * 0.85)); }
}
// 엔진 불꽃: (x0, y)에서 왼쪽(뒤)으로 len, 굵기 w
function e3Jet(x, x0, y, len, w, col) {
  if (enMode === 2) { enBBbox(x, x0 - len, y - w * 0.6, x0, y + w * 0.6, 0); return; }
  if (enMode) return;
  var L = [[1, 1, col || '#ff7a1a', 0.9], [0.7, 0.66, '#ffc83a', 0.95], [0.4, 0.36, '#fffbe0', 1]];
  x.save();
  for (var i = 0; i < 3; i++) { var l = len * L[i][0], h = w * L[i][1] / 2; x.globalAlpha = L[i][3]; x.fillStyle = L[i][2]; x.beginPath(); x.moveTo(x0, y - h); x.quadraticCurveTo(x0 - l * 0.45, y - h * 1.15, x0 - l, y); x.quadraticCurveTo(x0 - l * 0.45, y + h * 1.15, x0, y + h); x.closePath(); x.fill(); }
  x.restore();
  enGlow(x, x0 - len * 0.25, y, w * 1.3, '#ff9a3a', 0.5);
}
// 도는 날개: 흐릿한 원반 + 날개 nb장 (외곽선 없음)
function e3Prop(x, cx, cy, r, rot, nb, o) {
  if (enMode === 2) { enBBbox(x, cx - r, cy - r, cx + r, cy + r, 0); return; }
  if (enMode) return;
  o = o || {};
  x.save(); x.translate(cx, cy);
  x.globalAlpha = o.da == null ? 0.2 : o.da; x.fillStyle = '#eef4f8'; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill();
  x.globalAlpha = 0.5; x.strokeStyle = '#f4f8fb'; x.lineWidth = Math.max(0.7, r * 0.07); x.beginPath(); x.arc(0, 0, r * 0.95, 0, 7); x.stroke();
  x.rotate(rot);
  for (var i = 0; i < nb; i++) {
    x.rotate(Math.PI * 2 / nb);
    x.globalAlpha = 0.22; x.fillStyle = '#10161e'; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, r * 0.96, -0.5, 0.06); x.closePath(); x.fill(); // 잔상
    x.globalAlpha = o.ba == null ? 0.78 : o.ba; x.fillStyle = o.bc || '#1e252e'; x.beginPath(); x.moveTo(r * 0.1, -r * 0.05); x.lineTo(r * 0.97, -r * (o.bw || 0.07)); x.lineTo(r * 0.97, r * (o.bw || 0.07)); x.lineTo(r * 0.1, r * 0.05); x.closePath(); x.fill();
    if (o.ol) { x.globalAlpha = 0.7; x.strokeStyle = o.ol; x.lineWidth = Math.max(0.6, enLW * 0.7); x.stroke(); }
    if (o.tip) { x.fillStyle = o.tip; x.fillRect(r * 0.84, -r * (o.bw || 0.07), r * 0.13, r * (o.bw || 0.07) * 2); }
  }
  x.restore();
}
// 바퀴: 타이어 + 구멍 셋 뚫린 휠 (rot으로 굴러감, 한 바퀴 주기 = 120도)
function e3Wheel(x, cx, cy, r, rot, hub) {
  e3F(x, e3Els(cx, cy, r, r), E3.tire, { hi: 0.2, lo: 0.3, a: 0.2, b: 0.76 });
  if (enMode) return;
  var i, an;
  x.save(); x.translate(cx, cy); x.rotate(rot);
  x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = Math.max(0.7, r * 0.12); x.lineCap = 'butt';
  for (i = 0; i < 12; i++) { an = i / 12 * Math.PI * 2; x.beginPath(); x.moveTo(Math.cos(an) * r * 0.76, Math.sin(an) * r * 0.76); x.lineTo(Math.cos(an) * r * 0.99, Math.sin(an) * r * 0.99); x.stroke(); }
  x.fillStyle = hub; x.beginPath(); x.arc(0, 0, r * 0.58, 0, 7); x.fill();
  x.strokeStyle = mixc(hub, E3K, 0.75); x.lineWidth = Math.max(0.6, enLW * 0.7); x.stroke();
  x.fillStyle = mixc(hub, E3K, 0.78);
  for (i = 0; i < 3; i++) { an = i / 3 * Math.PI * 2; x.beginPath(); x.arc(Math.cos(an) * r * 0.33, Math.sin(an) * r * 0.33, r * 0.14, 0, 7); x.fill(); }
  x.fillStyle = mixc(hub, '#ffffff', 0.5); x.beginPath(); x.arc(0, 0, r * 0.13, 0, 7); x.fill();
  x.restore();
  x.save(); x.globalAlpha = 0.4; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.7, r * 0.09); x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, r * 0.87, Math.PI * 1.15, Math.PI * 1.55); x.stroke(); x.restore();
}
// 보기륜(궤도 안 바퀴)
function e3Hub(x, cx, cy, r, rot, c) {
  e3F(x, e3Els(cx, cy, r, r), c, { lw: 0.7, hi: 0.32, lo: 0.3 });
  if (enMode || r < 1.6) return;
  x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = mixc(c, E3K, 0.75);
  for (var i = 0; i < 3; i++) { var an = i / 3 * Math.PI * 2; x.beginPath(); x.arc(Math.cos(an) * r * 0.5, Math.sin(an) * r * 0.5, r * 0.2, 0, 7); x.fill(); }
  x.fillStyle = mixc(c, '#ffffff', 0.5); x.beginPath(); x.arc(0, 0, r * 0.2, 0, 7); x.fill(); x.restore();
}
// 무한궤도: x0~x1, 바닥 yb, 높이 h. ph 0~1(마디 흐름), nw 보기륜 수. 위가 길고 아래가 짧은 사다리꼴 띠
function e3Track(x, x0, x1, yb, h, ph, nw, hub) {
  var cut = h * 0.42, s = enRPoly([[x0, yb - h * 0.62], [x0 + h * 0.2, yb - h], [x1 - h * 0.2, yb - h], [x1, yb - h * 0.62], [x1 - cut, yb], [x0 + cut, yb]], h * 0.22);
  e3F(x, s, E3.tire, { hi: 0.22, lo: 0.2, a: 0.16, b: 0.84 });
  if (!enMode) {
    var d = Math.max(2.4, h * 0.2), off = ph * d, q;
    x.save(); x.clip(s.p); x.strokeStyle = 'rgba(255,255,255,0.3)'; x.lineWidth = Math.max(0.8, d * 0.3); x.lineCap = 'butt';
    for (q = x0 - d * 2; q < x1 + d * 2; q += d) { x.beginPath(); x.moveTo(q + off, yb - h - 1); x.lineTo(q + off, yb - h * 0.85); x.moveTo(q + d - off, yb + 1); x.lineTo(q + d - off, yb - h * 0.13); x.stroke(); }
    x.restore();
    var inn = enRPoly([[x0 + h * 0.2, yb - h * 0.6], [x0 + h * 0.34, yb - h * 0.84], [x1 - h * 0.34, yb - h * 0.84], [x1 - h * 0.2, yb - h * 0.6], [x1 - cut - h * 0.06, yb - h * 0.14], [x0 + cut + h * 0.06, yb - h * 0.14]], h * 0.16);
    x.fillStyle = '#12161d'; x.fill(inn.p);
  }
  var wr = h * 0.27, sp = (x1 - x0 - cut * 2 - wr * 1.2) / Math.max(1, nw - 1), rot = ph * Math.PI * 2 / 3;
  for (var i = 0; i < nw; i++) e3Hub(x, x0 + cut + wr * 0.6 + sp * i, yb - wr - h * 0.12, wr, rot, hub);
  e3Hub(x, x0 + h * 0.34, yb - h * 0.63, wr * 0.72, rot, mixc(hub, E3K, 0.2)); e3Hub(x, x1 - h * 0.34, yb - h * 0.63, wr * 0.72, rot, mixc(hub, E3K, 0.2));
}
// 유리창: 어두운 유리에 비친 하늘빛 줄
function e3Glass(x, s, c) {
  e3F(x, s, c || E3.glD, { sh: 'f', lw: 0.8 });
  if (enMode) return;
  x.save(); x.clip(s.p); x.fillStyle = 'rgba(134,220,238,0.75)'; x.beginPath(); x.moveTo(s.x0 - 1, s.y0 - 1); x.lineTo(s.x0 + s.w() * 0.62, s.y0 - 1); x.lineTo(s.x0 + s.w() * 0.2, s.y1 + 1); x.lineTo(s.x0 - 1, s.y1 + 1); x.closePath(); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.moveTo(s.x0 + s.w() * 0.2, s.y0 - 1); x.lineTo(s.x0 + s.w() * 0.38, s.y0 - 1); x.lineTo(s.x0 + s.w() * 0.08, s.y1 + 1); x.lineTo(s.x0 - s.w() * 0.1, s.y1 + 1); x.closePath(); x.fill(); x.restore();
}
// 안테나 + 주황 삼각 깃발 (글자, 표식 없음)
function e3Ant(x, bx, by, tx, ty, w, flag, fl) {
  e3Ln(x, [[bx, by], [tx, ty]], Math.max(0.9, w), '#c9d2dc');
  if (flag) e3Po(x, [[tx, ty], [tx - flag, ty + flag * (0.28 + (fl || 0))], [tx - flag * 0.1, ty + flag * 0.62]], E3.or, { sh: 'f', lw: 0.7 });
}

// ---------- 보병: 헬멧과 배낭의 3등신 병사 (옆모습 걷기) ----------
EN_DRAW.soldier = { f: function (x, H, p) {
  var u = H, a = p * Math.PI * 2, sw = Math.sin(a), bob = -Math.abs(sw) * u * 0.02, ol = E3.ol, olD = E3.olD;
  E3K = '#1b2a1c';
  function leg(ph, far) {
    var s = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * u * 0.055, hy = -u * 0.31 + bob, fx = -u * 0.01 + s * u * 0.14, fy = -u * 0.055 - lift, c = far ? mixc(ol, E3K, 0.3) : ol;
    e3Pill(x, [-u * 0.02, hy], [fx, fy - u * 0.02], u * 0.13, u * 0.105, c, { lw: 0.8 });
    e3Rr(x, fx - u * 0.065, fy - u * 0.035, u * 0.17, u * 0.09, u * 0.04, far ? '#2a2f2a' : '#3a4038', { lw: 0.8, hi: 0.2 });
  }
  leg(a + Math.PI, 1);
  // 배낭 + 말아 올린 모포
  e3Rr(x, -u * 0.35, -u * 0.63 + bob, u * 0.22, u * 0.3, u * 0.05, E3.tan);
  e3Pl(x, [[-u * 0.33, -u * 0.5 + bob], [-u * 0.15, -u * 0.5 + bob]], 0.5);
  e3Rr(x, -u * 0.365, -u * 0.71 + bob, u * 0.25, u * 0.1, u * 0.05, olD);
  // 몸통
  e3Rr(x, -u * 0.18, -u * 0.64 + bob, u * 0.33, u * 0.37, u * 0.1, ol);
  e3Box(x, -u * 0.17, -u * 0.36 + bob, u * 0.31, u * 0.05, '#3a4038');
  e3Rr(x, u * 0.0, -u * 0.5 + bob, u * 0.11, u * 0.1, u * 0.02, E3.tanD, { lw: 0.7 });
  leg(a, 0);
  // 머리: 살색 얼굴, 어두운 고글, 턱 가리개
  var hy = -u * 0.76 + bob;
  e3El(x, u * 0.03, hy, u * 0.135, u * 0.13, E3.skin, { hi: 0.2, lo: 0.2 });
  e3Rr(x, -u * 0.06, hy + u * 0.035, u * 0.21, u * 0.085, u * 0.035, olD, { lw: 0.7 });
  e3Glass(x, shp().rrect(u * 0.045, hy - u * 0.06, u * 0.13, u * 0.085, u * 0.03));
  // 헬멧
  var hs = shp(), P = hs.p, hx0 = -u * 0.17, hx1 = u * 0.2, hb = hy - u * 0.035;
  P.moveTo(hx0, hb); P.bezierCurveTo(hx0 - u * 0.01, hb - u * 0.27, hx1, hb - u * 0.27, hx1, hb - u * 0.02); P.lineTo(hx1 + u * 0.035, hb + u * 0.02); P.lineTo(hx0 - u * 0.015, hb + u * 0.035); P.closePath();
  hs.ext(hx0 - u * 0.015, hb - u * 0.21); hs.ext(hx1 + u * 0.035, hb + u * 0.035);
  e3F(x, hs, olD, { hi: 0.34, a: 0.34, b: 0.78 });
  e3Pl(x, [[hx0, hb - u * 0.035], [hx1, hb - u * 0.05]], 0.5);
  e3Hi(x, [[-u * 0.08, hb - u * 0.15], [u * 0.0, hb - u * 0.175]], u * 0.022, 0.6);
  // 소총 + 팔
  var gy = -u * 0.48 + bob + sw * u * 0.008;
  e3Ln(x, [[-u * 0.1, gy + u * 0.03], [u * 0.12, gy - u * 0.02]], u * 0.075, '#6b4a2e', 'butt');
  e3Ln(x, [[u * 0.08, gy - u * 0.015], [u * 0.44, gy - u * 0.075]], u * 0.045, E3.gun, 'butt');
  e3Ln(x, [[u * 0.2, gy], [u * 0.22, gy + u * 0.08]], u * 0.04, E3.gun, 'butt');
  e3Pill(x, [-u * 0.05, -u * 0.57 + bob], [u * 0.14, gy - u * 0.01], u * 0.12, u * 0.095, ol, { lw: 0.8 });
  e3El(x, u * 0.16, gy - u * 0.01, u * 0.05, u * 0.048, '#3a4038', { lw: 0.7 });
} };

// ---------- 오토바이 정찰병: 사막색 정찰 오토바이, 숙인 자세, 주황 고글과 목도리 ----------
EN_DRAW.biker = { n: 4, f: function (x, H, p) {
  var u = H, a = p * Math.PI * 2, rot = a / 3, b = Math.sin(a) * u * 0.008, r = u * 0.175, tn = '#c4a160';
  E3K = '#241f18';
  e3Shd(x, 0, u * 0.5, u * 0.05);
  e3Puff(x, -u * (0.56 + p * 0.14), -u * 0.07, u * (0.05 + p * 0.03), '#eadfc6', 0.55 - p * 0.35);
  e3Puff(x, -u * (0.74 + p * 0.1), -u * 0.1, u * (0.07 + p * 0.02), '#eadfc6', 0.3 - p * 0.2);
  e3Wheel(x, -u * 0.31, -r, r, rot, E3.gunL); e3Wheel(x, u * 0.33, -r, r, rot, E3.gunL);
  e3Ln(x, [[u * 0.33, -r], [u * 0.2, -u * 0.52 + b]], u * 0.05, '#aeb8c2');
  e3Ln(x, [[-u * 0.31, -r], [-u * 0.05, -u * 0.27 + b]], u * 0.055, E3.gun);
  e3Ln(x, [[u * 0.04, -u * 0.2 + b], [-u * 0.2, -u * 0.2 + b], [-u * 0.47, -u * 0.31 + b]], u * 0.045, '#b9c2cc');
  e3Rr(x, -u * 0.13, -u * 0.36 + b, u * 0.27, u * 0.19, u * 0.035, E3.gun);
  e3Pl(x, [[-u * 0.1, -u * 0.3 + b], [u * 0.1, -u * 0.3 + b]], 0.5, 0.8, '#cfd6de'); e3Pl(x, [[-u * 0.1, -u * 0.25 + b], [u * 0.1, -u * 0.25 + b]], 0.5, 0.8, '#cfd6de');
  e3Rr(x, -u * 0.4, -u * 0.43 + b, u * 0.19, u * 0.14, u * 0.03, E3.olD); // 뒤 짐
  e3Rr(x, -u * 0.27, -u * 0.47 + b, u * 0.3, u * 0.08, u * 0.035, '#33373e', { lw: 0.8 }); // 안장
  e3Rp(x, e3S(u, [[0.0, -0.52], [0.2, -0.56], [0.27, -0.46], [0.2, -0.38], [0.0, -0.38]], b), u * 0.05, tn); // 연료통
  e3Po(x, e3S(u, [[0.2, -0.36], [0.47, -0.36], [0.5, -0.3], [0.44, -0.33], [0.22, -0.31]], 0), tn, { lw: 0.8 }); // 앞 흙받이
  e3Lamp(x, u * 0.27, -u * 0.5 + b, u * 0.045, E3.yel, 2.2);
  // 라이더
  e3Pill(x, [-u * 0.1, -u * 0.47 + b], [u * 0.09, -u * 0.42 + b], u * 0.13, u * 0.11, '#8a7448', { lw: 0.8 });
  e3Pill(x, [u * 0.09, -u * 0.42 + b], [u * 0.03, -u * 0.25 + b], u * 0.1, u * 0.085, '#8a7448', { lw: 0.8 });
  e3Rr(x, -u * 0.02, -u * 0.26 + b, u * 0.13, u * 0.07, u * 0.03, '#33373e', { lw: 0.7 });
  e3Rr(x, -u * 0.24, -u * 0.74 + b, u * 0.15, u * 0.2, u * 0.04, E3.olD, { lw: 0.8 }); // 등짐
  e3Pill(x, [-u * 0.09, -u * 0.5 + b], [u * 0.06, -u * 0.71 + b], u * 0.2, u * 0.19, tn);
  var fl = Math.sin(a) * 0.035;
  e3Po(x, e3S(u, [[0.03, -0.75], [-0.2, -0.79 + fl], [-0.33, -0.73 - fl], [-0.2, -0.7 + fl], [0.02, -0.69]], b), E3.or, { sh: 'f', lw: 0.8 }); // 목도리
  e3Pill(x, [u * 0.05, -u * 0.69 + b], [u * 0.2, -u * 0.54 + b], u * 0.1, u * 0.085, tn, { lw: 0.8 });
  e3El(x, u * 0.21, -u * 0.53 + b, u * 0.045, u * 0.045, '#33373e', { lw: 0.7 });
  e3El(x, u * 0.12, -u * 0.83 + b, u * 0.12, u * 0.115, '#3d444e', { hi: 0.4 });
  e3Rr(x, u * 0.14, -u * 0.875 + b, u * 0.105, u * 0.08, u * 0.03, E3.or, { sh: 'f', lw: 0.7 });
  e3Hi(x, [[u * 0.17, -u * 0.855 + b], [u * 0.2, -u * 0.855 + b]], u * 0.018, 0.9);
  e3Hi(x, [[u * 0.04, -u * 0.9 + b], [u * 0.1, -u * 0.925 + b]], u * 0.02, 0.6);
} };

// ---------- 무장 지프: 지붕 없는 녹색 지프, 뒤에 선 기관총 사수 ----------
EN_DRAW.jeep = { n: 4, f: function (x, H, p) {
  var u = H, a = p * Math.PI * 2, rot = a / 3, b = Math.sin(a) * u * 0.008, r = u * 0.155, ol = E3.ol, olD = E3.olD;
  E3K = '#1b2a1c';
  e3Shd(x, 0, u * 0.56, u * 0.055);
  e3Puff(x, -u * (0.62 + p * 0.1), -u * 0.1, u * (0.05 + p * 0.03), '#e6e2d6', 0.5 - p * 0.3);
  e3Ant(x, -u * 0.44, -u * 0.48 + b, -u * 0.5, -u * 0.99 + b, u * 0.018, u * 0.11, Math.sin(a) * 0.12);
  e3El(x, -u * 0.535, -u * 0.37 + b, u * 0.055, u * 0.135, E3.tire, { hi: 0.2 }); // 예비 바퀴
  // 사수 (뒤)
  e3Rr(x, -u * 0.36, -u * 0.68 + b, u * 0.17, u * 0.24, u * 0.05, E3.olL);
  e3El(x, -u * 0.27, -u * 0.74 + b, u * 0.08, u * 0.075, E3.skin, { lw: 0.7 });
  e3Rp(x, e3S(u, [[-0.37, -0.76], [-0.34, -0.87], [-0.2, -0.87], [-0.16, -0.76]], b), u * 0.04, olD, { hi: 0.34 });
  // 운전병
  e3El(x, -u * 0.01, -u * 0.55 + b, u * 0.075, u * 0.07, E3.skin, { lw: 0.7 });
  e3Rp(x, e3S(u, [[-0.1, -0.57], [-0.07, -0.67], [0.05, -0.67], [0.09, -0.57]], b), u * 0.04, olD, { hi: 0.34 });
  // 기관총
  e3Ln(x, [[-u * 0.19, -u * 0.48 + b], [-u * 0.17, -u * 0.7 + b]], u * 0.04, E3.gun);
  e3Ln(x, [[-u * 0.27, -u * 0.71 + b], [u * 0.1, -u * 0.8 + b]], u * 0.05, E3.gun, 'butt');
  e3Rr(x, -u * 0.25, -u * 0.72 + b, u * 0.12, u * 0.085, u * 0.015, olD, { lw: 0.7 });
  // 차체
  e3Rr(x, -u * 0.46, -u * 0.24 + b, u * 0.94, u * 0.1, u * 0.03, E3.gun);
  e3Po(x, e3S(u, [[0.1, -0.46], [0.16, -0.46], [0.11, -0.71], [0.06, -0.71]], b), '#bfeaf2', { sh: 'f', lw: 0.9, lc: E3K }); // 앞 유리
  e3Rp(x, e3S(u, [[-0.5, -0.2], [-0.5, -0.47], [-0.1, -0.47], [-0.09, -0.4], [0.11, -0.4], [0.14, -0.48], [0.46, -0.45], [0.53, -0.36], [0.53, -0.2]], b), u * 0.03, ol, { a: 0.26, b: 0.72 });
  e3Po(x, e3S(u, [[0.14, -0.48], [0.46, -0.45], [0.42, -0.5], [0.17, -0.53]], b), E3.olL, { sh: 'f', lw: 0.8 }); // 보닛 윗면
  e3Pl(x, e3S(u, [[-0.1, -0.4], [-0.1, -0.22]], b), 0.5); e3Pl(x, e3S(u, [[0.12, -0.4], [0.12, -0.22]], b), 0.5);
  e3Pl(x, e3S(u, [[0.24, -0.46], [0.24, -0.4]], b), 0.4); e3Pl(x, e3S(u, [[0.3, -0.455], [0.3, -0.4]], b), 0.4); e3Pl(x, e3S(u, [[0.36, -0.45], [0.36, -0.4]], b), 0.4);
  e3Rr(x, -u * 0.44, -u * 0.44 + b, u * 0.11, u * 0.17, u * 0.02, E3.tan, { lw: 0.7 }); // 기름통
  e3Pl(x, e3S(u, [[-0.42, -0.42], [-0.35, -0.29]], b), 0.4); e3Pl(x, e3S(u, [[-0.35, -0.42], [-0.42, -0.29]], b), 0.4);
  e3Rv(x, e3S(u, [[-0.26, -0.43], [-0.18, -0.43], [0.0, -0.36], [0.06, -0.36]], b), u * 0.012);
  e3Hi(x, e3S(u, [[-0.47, -0.455], [-0.13, -0.455]], b), u * 0.016, 0.5);
  e3Lamp(x, u * 0.5, -u * 0.36 + b, u * 0.04, E3.yel, 2.2);
  e3Rr(x, u * 0.49, -u * 0.27 + b, u * 0.085, u * 0.06, u * 0.015, E3.gun, { lw: 0.7 });
  // 흙받이 + 바퀴
  [-0.3, 0.31].forEach(function (wx) { e3Rp(x, e3S(u, [[wx - 0.2, -0.22], [wx - 0.15, -0.36], [wx + 0.15, -0.36], [wx + 0.2, -0.22], [wx + 0.15, -0.26], [wx - 0.15, -0.26]], b), u * 0.03, olD, { lw: 0.8 }); });
  e3Wheel(x, -u * 0.3, -r, r, rot, E3.olL); e3Wheel(x, u * 0.31, -r, r, rot, E3.olL);
} };

// ---------- 장갑차: 사막색 쐐기형 8륜 장갑차, 작은 기관포탑 ----------
EN_DRAW.apc = { n: 4, f: function (x, H, p) {
  var u = H, a = p * Math.PI * 2, rot = a / 3, b = Math.sin(a) * u * 0.006, r = u * 0.108, tn = E3.tan, tnD = E3.tanD;
  E3K = '#2a2116';
  e3Shd(x, 0, u * 0.6, u * 0.055);
  e3Smoke(x, -u * 0.56, -u * 0.42 + b, -u * 0.2, -u * 0.16, u * 0.05, p);
  e3Ant(x, -u * 0.4, -u * 0.6 + b, -u * 0.46, -u * 1.02 + b, u * 0.016, u * 0.08, Math.sin(a) * 0.12);
  // 포탑
  e3Ln(x, [[u * 0.14, -u * 0.735 + b], [u * 0.66, -u * 0.755 + b]], u * 0.055, E3.gun, 'butt');
  e3Ln(x, [[u * 0.56, -u * 0.751 + b], [u * 0.67, -u * 0.755 + b]], u * 0.085, E3.gun, 'butt');
  e3Rp(x, e3S(u, [[-0.22, -0.6], [-0.17, -0.81], [0.13, -0.83], [0.28, -0.71], [0.28, -0.6]], b), u * 0.03, tn, { a: 0.3 });
  e3Po(x, e3S(u, [[-0.17, -0.81], [0.13, -0.83], [0.08, -0.865], [-0.14, -0.85]], b), mixc(tn, '#ffffff', 0.3), { sh: 'f', lw: 0.8 });
  e3Rr(x, u * 0.16, -u * 0.8 + b, u * 0.09, u * 0.13, u * 0.025, tnD, { lw: 0.8 });
  e3Rr(x, -u * 0.1, -u * 0.905 + b, u * 0.14, u * 0.06, u * 0.02, tnD, { lw: 0.7 });
  e3Lamp(x, -u * 0.12, -u * 0.71 + b, u * 0.028, E3.red, 0);
  e3Rv(x, e3S(u, [[-0.02, -0.66], [0.08, -0.66]], b), u * 0.011);
  // 차체
  e3Rp(x, e3S(u, [[-0.54, -0.16], [-0.55, -0.44], [-0.46, -0.6], [0.26, -0.6], [0.5, -0.45], [0.56, -0.3], [0.5, -0.16]], b), u * 0.035, tn, { a: 0.24, b: 0.66 });
  e3Po(x, e3S(u, [[-0.46, -0.6], [0.26, -0.6], [0.2, -0.645], [-0.42, -0.645]], b), mixc(tn, '#ffffff', 0.3), { sh: 'f', lw: 0.8 }); // 지붕 윗면
  e3Pl(x, e3S(u, [[-0.54, -0.42], [0.5, -0.42]], b), 0.4);
  e3Pl(x, e3S(u, [[0.26, -0.6], [0.3, -0.42], [0.3, -0.2]], b), 0.45);
  e3Rr(x, -u * 0.36, -u * 0.39 + b, u * 0.2, u * 0.17, u * 0.02, mixc(tn, E3K, 0.1), { lw: 0.7, sh: 'f' }); // 옆문
  e3Dot(x, -u * 0.2, -u * 0.3 + b, u * 0.014, E3K, 0.6);
  e3Rr(x, -u * 0.08, -u * 0.38 + b, u * 0.17, u * 0.08, u * 0.015, E3.olD, { lw: 0.7 }); // 짐 상자
  e3Glass(x, shp().poly(e3S(u, [[0.33, -0.52], [0.44, -0.45], [0.42, -0.4], [0.32, -0.42]], b)));
  e3Rv(x, e3S(u, [[-0.5, -0.47], [-0.4, -0.55], [-0.28, -0.55], [-0.16, -0.55], [-0.04, -0.55], [0.08, -0.55], [0.2, -0.55], [0.4, -0.36], [0.47, -0.36]], b), u * 0.011);
  e3Hi(x, e3S(u, [[-0.45, -0.585], [0.24, -0.585]], b), u * 0.014, 0.45);
  e3Lamp(x, u * 0.51, -u * 0.3 + b, u * 0.03, E3.yel, 2.2);
  var hz = shp().poly(e3S(u, [[-0.54, -0.25], [-0.44, -0.25], [-0.44, -0.18], [-0.54, -0.18]], b)); e3F(x, hz, E3.or, { sh: 'f', lw: 0.6 }); e3Haz(x, hz, E3.or, '#22252b', u * 0.022);
  e3Rr(x, -u * 0.5, -u * 0.2 + b, u * 0.98, u * 0.06, u * 0.02, E3.gun, { lw: 0.7 });
  [-0.37, -0.13, 0.13, 0.37].forEach(function (wx) { e3Wheel(x, u * wx, -r, r, rot, tnD); });
} };

// ---------- 전차: 짙은 녹색 주력 전차, 긴 포신, 궤도 ----------
EN_DRAW.tank = { n: 4, f: function (x, H, p) {
  var u = H, a = p * Math.PI * 2, b = Math.sin(a) * u * 0.006, ol = '#5f7a3c', olD = '#48602f', olL = '#84a052';
  E3K = '#172317';
  e3Shd(x, 0, u * 0.62, u * 0.06);
  e3Smoke(x, -u * 0.55, -u * 0.42 + b, -u * 0.22, -u * 0.2, u * 0.055, p);
  e3Ant(x, -u * 0.22, -u * 0.72 + b, -u * 0.3, -u * 1.04 + b, u * 0.016, u * 0.09, Math.sin(a) * 0.12);
  e3Track(x, -u * 0.56, u * 0.54, 0, u * 0.27, p, 5, '#6c7a58');
  // 차체
  e3Rp(x, e3S(u, [[-0.54, -0.18], [-0.55, -0.4], [-0.45, -0.48], [0.34, -0.48], [0.58, -0.33], [0.55, -0.18]], b), u * 0.03, ol, { a: 0.3, b: 0.7 });
  e3Po(x, e3S(u, [[-0.45, -0.48], [0.34, -0.48], [0.3, -0.515], [-0.42, -0.515]], b), olL, { sh: 'f', lw: 0.8 });
  e3Po(x, e3S(u, [[-0.57, -0.265], [0.57, -0.265], [0.58, -0.205], [-0.58, -0.205]], b), olD, { sh: 'f', lw: 0.8 }); // 궤도 덮개
  e3Rv(x, e3S(u, [[-0.48, -0.235], [-0.32, -0.235], [-0.16, -0.235], [0.0, -0.235], [0.16, -0.235], [0.32, -0.235], [0.48, -0.235]], b), u * 0.011);
  e3Pl(x, e3S(u, [[0.34, -0.48], [0.38, -0.27]], b), 0.45); e3Pl(x, e3S(u, [[-0.3, -0.48], [-0.3, -0.27]], b), 0.4);
  e3Rr(x, -u * 0.51, -u * 0.44 + b, u * 0.16, u * 0.11, u * 0.02, olD, { lw: 0.7 }); // 뒤 연장통
  e3Lamp(x, u * 0.47, -u * 0.36 + b, u * 0.028, E3.yel, 2);
  // 포신
  e3Ln(x, [[u * 0.2, -u * 0.63 + b], [u * 0.8, -u * 0.65 + b]], u * 0.07, olD, 'butt');
  e3Ln(x, [[u * 0.42, -u * 0.637 + b], [u * 0.55, -u * 0.641 + b]], u * 0.098, olD, 'butt');
  e3Ln(x, [[u * 0.74, -u * 0.648 + b], [u * 0.83, -u * 0.651 + b]], u * 0.108, E3.gun, 'butt');
  // 포탑
  e3Rr(x, -u * 0.44, -u * 0.7 + b, u * 0.12, u * 0.16, u * 0.02, olD, { lw: 0.7 }); // 포탑 뒤 바구니
  e3Rp(x, e3S(u, [[-0.37, -0.48], [-0.34, -0.71], [-0.2, -0.77], [0.13, -0.77], [0.3, -0.65], [0.32, -0.48]], b), u * 0.04, ol, { a: 0.32, b: 0.72 });
  e3Po(x, e3S(u, [[-0.2, -0.77], [0.13, -0.77], [0.08, -0.81], [-0.17, -0.81]], b), olL, { sh: 'f', lw: 0.8 });
  e3Rr(x, u * 0.2, -u * 0.72 + b, u * 0.11, u * 0.17, u * 0.03, olD, { lw: 0.8 }); // 포방패
  e3Rr(x, -u * 0.13, -u * 0.865 + b, u * 0.17, u * 0.075, u * 0.03, olD, { lw: 0.8 }); // 전차장 해치
  e3Ln(x, [[-u * 0.02, -u * 0.885 + b], [u * 0.15, -u * 0.925 + b]], u * 0.032, E3.gun, 'butt');
  e3Pl(x, e3S(u, [[-0.02, -0.76], [-0.02, -0.6]], b), 0.4);
  e3Rv(x, e3S(u, [[-0.28, -0.68], [-0.28, -0.6], [0.08, -0.71], [0.16, -0.6]], b), u * 0.011);
  e3Hi(x, e3S(u, [[-0.31, -0.7], [-0.2, -0.755], [0.11, -0.755]], b), u * 0.016, 0.5);
  var hz = shp().poly(e3S(u, [[-0.3, -0.575], [0.14, -0.575], [0.14, -0.52], [-0.31, -0.52]], b)); e3F(x, hz, E3.or, { sh: 'f', lw: 0.6 }); e3Haz(x, hz, E3.or, '#22252b', u * 0.022);
} };

// ---------- 보행 로봇: 강철색 역관절 2족 보행기, 붉은 외눈, 쌍포 ----------
EN_DRAW.mech = { f: function (x, H, p) {
  var u = H, a = p * Math.PI * 2, st = E3.st, stD = E3.stD, bob = -Math.abs(Math.cos(a)) * u * 0.018, tl = Math.sin(a) * 0.025;
  E3K = '#182230';
  function leg(ph, far) {
    var s = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * u * 0.075, hip = [-u * 0.03, -u * 0.47 + bob], ft = [u * 0.02 + s * u * 0.17, -u * 0.05 - lift];
    var knee = [(hip[0] + ft[0]) / 2 - u * 0.17, (hip[1] + ft[1]) / 2 - u * 0.03], ank = [ft[0] - u * 0.02, ft[1] - u * 0.11];
    var c = far ? mixc(st, E3K, 0.32) : st, c2 = far ? mixc(stD, E3K, 0.3) : stD;
    e3Pill(x, hip, knee, u * 0.15, u * 0.11, c);
    e3Pill(x, knee, ank, u * 0.085, u * 0.07, c2, { lw: 0.8 });
    if (!far) e3Hi(x, [[knee[0] + u * 0.02, knee[1] + u * 0.015], [ank[0] - u * 0.005, ank[1] - u * 0.02]], u * 0.014, 0.5);
    e3El(x, knee[0], knee[1], u * 0.07, u * 0.07, far ? c2 : E3.or, { lw: 0.8 });
    e3Rp(x, [[ft[0] - u * 0.14, ft[1] + u * 0.05], [ft[0] - u * 0.09, ft[1] - u * 0.07], [ft[0] + u * 0.07, ft[1] - u * 0.08], [ft[0] + u * 0.2, ft[1] + u * 0.05]], u * 0.025, c2, { lw: 0.9 });
  }
  leg(a + Math.PI, 1);
  x.save(); x.translate(0, -u * 0.5 + bob); x.rotate(tl); x.translate(0, u * 0.5);
  e3Smoke(x, -u * 0.34, -u * 0.86, -u * 0.16, -u * 0.14, u * 0.04, p);
  e3Ant(x, -u * 0.16, -u * 0.86, -u * 0.22, -u * 1.02, u * 0.014, 0, 0);
  e3Rr(x, -u * 0.38, -u * 0.86, u * 0.12, u * 0.26, u * 0.03, stD, { lw: 0.8 }); // 등 배기통
  e3Pl(x, [[-u * 0.36, -u * 0.78], [-u * 0.28, -u * 0.78]], 0.5); e3Pl(x, [[-u * 0.36, -u * 0.72], [-u * 0.28, -u * 0.72]], 0.5);
  // 먼 쪽 포
  e3Ln(x, [[u * 0.08, -u * 0.72], [u * 0.5, -u * 0.72]], u * 0.045, mixc(E3.gun, E3K, 0.25), 'butt');
  // 조종실
  e3Rp(x, [[-u * 0.3, -u * 0.46], [-u * 0.32, -u * 0.8], [-u * 0.18, -u * 0.9], [u * 0.16, -u * 0.9], [u * 0.36, -u * 0.74], [u * 0.36, -u * 0.56], [u * 0.2, -u * 0.44]], u * 0.05, st, { a: 0.28, b: 0.7 });
  e3Po(x, [[-u * 0.18, -u * 0.9], [u * 0.16, -u * 0.9], [u * 0.1, -u * 0.94], [-u * 0.14, -u * 0.94]], E3.stL, { sh: 'f', lw: 0.8 });
  e3Rp(x, [[u * 0.1, -u * 0.8], [u * 0.2, -u * 0.84], [u * 0.33, -u * 0.72], [u * 0.33, -u * 0.63], [u * 0.14, -u * 0.63]], u * 0.02, '#1c2733', { sh: 'f', lw: 0.8 }); // 눈 홈
  e3Lamp(x, u * 0.24, -u * 0.71, u * 0.052, E3.red, 2.6);
  e3Pl(x, [[-u * 0.3, -u * 0.6], [u * 0.12, -u * 0.6]], 0.45); e3Pl(x, [[-u * 0.06, -u * 0.89], [-u * 0.06, -u * 0.6]], 0.4);
  var hz = shp().poly([[-u * 0.28, -u * 0.57], [u * 0.1, -u * 0.57], [u * 0.1, -u * 0.51], [-u * 0.28, -u * 0.51]]); e3F(x, hz, E3.or, { sh: 'f', lw: 0.6 }); e3Haz(x, hz, E3.or, '#22252b', u * 0.022);
  e3Rv(x, [[-u * 0.25, -u * 0.76], [-u * 0.25, -u * 0.66], [-u * 0.13, -u * 0.84], [u * 0.04, -u * 0.84]], u * 0.011);
  e3Hi(x, [[-u * 0.26, -u * 0.8], [-u * 0.16, -u * 0.875], [u * 0.12, -u * 0.875]], u * 0.016, 0.5);
  // 가까운 쪽 쌍포
  e3Ln(x, [[u * 0.06, -u * 0.6], [u * 0.56, -u * 0.6]], u * 0.045, E3.gun, 'butt'); e3Ln(x, [[u * 0.06, -u * 0.53], [u * 0.56, -u * 0.53]], u * 0.045, E3.gun, 'butt');
  e3Rr(x, -u * 0.12, -u * 0.66, u * 0.3, u * 0.19, u * 0.035, stD, { a: 0.3 });
  e3Rr(x, u * 0.46, -u * 0.635, u * 0.05, u * 0.14, u * 0.01, E3.gun, { lw: 0.7 });
  e3El(x, -u * 0.02, -u * 0.565, u * 0.045, u * 0.045, E3.stL, { lw: 0.7 });
  x.restore();
  e3Rr(x, -u * 0.13, -u * 0.52 + bob, u * 0.22, u * 0.1, u * 0.04, E3.gun, { lw: 0.8 }); // 골반
  leg(a, 0);
} };

// ---------- 보급 트럭: 녹색 운전석 + 황토색 천막 짐칸, 주황 경광등과 수리 표식(톱니) ----------
EN_DRAW.truck = { n: 4, f: function (x, H, p) {
  var u = H, a = p * Math.PI * 2, rot = a / 3, b = Math.sin(a) * u * 0.007, r = u * 0.13, ol = E3.ol, olD = E3.olD, tn = '#d2b278';
  E3K = '#1e2619';
  e3Shd(x, 0, u * 0.62, u * 0.055);
  e3Smoke(x, u * 0.13, -u * 0.8 + b, -u * 0.2, -u * 0.16, u * 0.045, p);
  e3Ln(x, [[u * 0.13, -u * 0.5 + b], [u * 0.13, -u * 0.8 + b]], u * 0.05, '#aeb8c2', 'butt'); // 배기통
  e3Rr(x, -u * 0.55, -u * 0.26 + b, u * 1.07, u * 0.09, u * 0.02, E3.gun, { lw: 0.8 });
  // 천막 짐칸
  e3Rp(x, e3S(u, [[-0.57, -0.3], [-0.57, -0.68], [-0.48, -0.76], [0.0, -0.76], [0.08, -0.68], [0.08, -0.3]], b), u * 0.05, tn, { a: 0.3, b: 0.74 });
  [-0.42, -0.26, -0.1].forEach(function (rx) { e3Pl(x, e3S(u, [[rx, -0.75], [rx, -0.32]], b), 0.35); e3Hi(x, e3S(u, [[rx + 0.02, -0.72], [rx + 0.02, -0.5]], b), u * 0.012, 0.35); });
  e3Rr(x, -u * 0.58, -u * 0.36 + b, u * 0.67, u * 0.12, u * 0.02, ol, { a: 0.3 }); // 짐칸 난간
  e3Rv(x, e3S(u, [[-0.52, -0.3], [-0.38, -0.3], [-0.24, -0.3], [-0.1, -0.3], [0.03, -0.3]], b), u * 0.011);
  // 수리 표식: 주황 톱니바퀴
  var gx = -u * 0.25, gy = -u * 0.55 + b, gr = u * 0.085, gs = shp(), i;
  for (i = 0; i < 16; i++) { var an = i / 16 * Math.PI * 2 + a / 8, rr = (i % 2 ? 1 : 0.74) * gr, qx = gx + Math.cos(an) * rr, qy = gy + Math.sin(an) * rr; if (i) gs.p.lineTo(qx, qy); else gs.p.moveTo(qx, qy); gs.ext(qx, qy); }
  gs.p.closePath(); e3F(x, gs, E3.or, { sh: 'f', lw: 0.7 }); e3Dot(x, gx, gy, gr * 0.34, tn, 1);
  // 운전석
  e3Rp(x, e3S(u, [[0.14, -0.2], [0.14, -0.64], [0.22, -0.7], [0.42, -0.7], [0.55, -0.5], [0.57, -0.2]], b), u * 0.04, ol, { a: 0.26, b: 0.7 });
  e3Glass(x, shp().poly(e3S(u, [[0.3, -0.64], [0.42, -0.64], [0.51, -0.48], [0.3, -0.48]], b)));
  e3Pl(x, e3S(u, [[0.26, -0.66], [0.26, -0.24]], b), 0.45); e3Dot(x, u * 0.3, -u * 0.4 + b, u * 0.013, E3K, 0.6);
  e3Hi(x, e3S(u, [[0.17, -0.63], [0.23, -0.675], [0.4, -0.675]], b), u * 0.015, 0.5);
  e3Rr(x, u * 0.25, -u * 0.77 + b, u * 0.1, u * 0.075, u * 0.03, E3.or, { sh: 'f', lw: 0.7 }); // 경광등
  enGlow(x, u * 0.3, -u * 0.74 + b, u * (0.1 + (p < 0.5 ? 0.08 : 0)), E3.or, p < 0.5 ? 0.75 : 0.3);
  e3Lamp(x, u * 0.54, -u * 0.34 + b, u * 0.032, E3.yel, 2.2);
  e3Rr(x, u * 0.5, -u * 0.26 + b, u * 0.1, u * 0.07, u * 0.015, E3.gun, { lw: 0.7 });
  e3Rr(x, -u * 0.1, -u * 0.24 + b, u * 0.17, u * 0.09, u * 0.015, olD, { lw: 0.7 }); // 공구함
  [-0.4, -0.14, 0.37].forEach(function (wx) { e3Wheel(x, u * wx, -r, r, rot, E3.olL); });
} };

// ---------- 위에서 본 적 (top: 1) 공통 ----------
// 몸 가운데를 (0, 0)으로 옮기고 fn(w, icon)을 부른다. w = 진행 방향에 수직인 쪽으로 쓸 수 있는 반폭
// 그리는 쪽은 기준점 높이의 0.75 지점을 돌림 중심으로 쓰므로, 그림 위쪽 경계를 고정해 프레임이 바뀌어도 중심이 몸 가운데에 있게 한다
// 아이콘(enemyFrames가 90도 돌려 부름)은 돌림을 알아채 ia 각도(오른쪽 0, 위 -)의 보기 좋은 모습으로 바꾼다
function e3Top(x, H, ia, fn) {
  var cy = -H * 0.46 / 3, m = x.getTransform ? x.getTransform() : null, icon = !!m && Math.abs(m.b) > 0.5 && Math.abs(m.a) < 0.5;
  var pd = Math.ceil(EN_RIMW * 1.2) + 1, w = Math.max(H * 0.2, H * 0.46 - pd - enOL - enLW);
  x.save(); x.translate(0, cy);
  if (icon) x.rotate(-Math.PI / 2 + (ia == null ? -0.6 : ia));
  fn(w, icon);
  x.restore();
  if (!icon && enMode === 2) enBB[1] = cy - H * 0.46 + pd;
}
// 배 뒤 흰 물살: 뱃머리 xb, 배꼬리 xs, 선체 반폭 hb, 꼬리 길이 len (외곽선 없음)
function e3Wake(x, xb, xs, hb, len, p, w, ic) {
  if (ic) len *= 0.45; // 아이콘에서는 짧게 (배가 작아 보이지 않게)
  var ym = Math.min(w, hb * (ic ? 1.5 : 2.2)), i, sd;
  if (enMode === 2) { enBBbox(x, xs - len, -ym, xb, ym, 0); return; }
  if (enMode) return;
  x.save();
  for (sd = -1; sd <= 1; sd += 2) {
    x.globalAlpha = 0.45; x.fillStyle = '#d9f1fb';
    x.beginPath(); x.moveTo(xb, 0); x.quadraticCurveTo(lerp(xb, xs, 0.4), sd * hb * 1.3, xs - len * 0.8, sd * ym); x.lineTo(xs - len * 0.5, sd * ym * 0.6); x.quadraticCurveTo(lerp(xb, xs, 0.5), sd * hb * 0.9, xb, 0); x.fill();
    x.globalAlpha = 0.92; x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(xb + hb * 0.12, 0); x.quadraticCurveTo(lerp(xb, xs, 0.3), sd * hb * 1.22, lerp(xb, xs, 0.85), sd * hb * 1.36); x.quadraticCurveTo(lerp(xb, xs, 0.35), sd * hb * 0.96, xb, 0); x.fill();
  }
  x.globalAlpha = 0.55; x.fillStyle = '#e6f6fc'; x.beginPath(); x.moveTo(xs + hb * 0.6, -hb * 0.78); x.quadraticCurveTo(xs - len * 0.5, -hb * 0.72, xs - len, 0); x.quadraticCurveTo(xs - len * 0.5, hb * 0.72, xs + hb * 0.6, hb * 0.78); x.fill();
  for (i = 0; i < 6; i++) { var t = (i + p * 2) / 7; x.globalAlpha = 0.95 * (1 - t); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(xs - len * t * 0.92, (i % 2 ? 1 : -1) * hb * 0.36 * (1 - t * 0.4), Math.max(0.5, hb * (0.36 - t * 0.2)), 0, 7); x.fill(); }
  x.restore();
}
// 위에서 본 선체: 뾰족한 뱃머리(xb), 반폭 hb, 배꼬리 xs (둥글기 sr)
function e3Hull(xb, xs, hb, k, sr) {
  var s = shp(), P = s.p, L = xb - xs; k = k == null ? 0.42 : k; sr = sr == null ? 0.12 : sr;
  P.moveTo(xb, 0); P.quadraticCurveTo(xb - L * k * 0.55, -hb * 1.02, xb - L * k, -hb); P.lineTo(xs + L * sr, -hb * 0.94); P.quadraticCurveTo(xs, -hb * 0.9, xs, -hb * 0.45);
  P.lineTo(xs, hb * 0.45); P.quadraticCurveTo(xs, hb * 0.9, xs + L * sr, hb * 0.94); P.lineTo(xb - L * k, hb); P.quadraticCurveTo(xb - L * k * 0.55, hb * 1.02, xb, 0); P.closePath();
  s.ext(xs, -hb); s.ext(xb, hb); return s;
}
// 모양 안에만 칠하는 띠 (색칠 단계)
function e3Band(x, s, x0, y0, w, h, c, a) { if (enMode) return; x.save(); x.clip(s.p); x.globalAlpha = a == null ? 1 : a; x.fillStyle = c; x.fillRect(x0, y0, w, h); x.restore(); }
// 위에서 본 앞 프로펠러(옆으로 선 원반): 흐릿한 띠 + 날
function e3PropE(x, cx, cy, ry, ph) {
  if (enMode === 2) { enBBbox(x, cx - ry * 0.25, cy - ry, cx + ry * 0.25, cy + ry, 0); return; }
  if (enMode) return;
  x.save(); x.globalAlpha = 0.4; x.fillStyle = '#f2f7fa'; x.beginPath(); x.ellipse(cx, cy, ry * 0.22, ry, 0, 0, 7); x.fill();
  x.globalAlpha = 0.85; x.strokeStyle = '#1e252e'; x.lineCap = 'round'; x.lineWidth = Math.max(0.8, ry * 0.16); var l = ry * (0.45 + 0.5 * Math.abs(Math.cos(ph)));
  x.beginPath(); x.moveTo(cx, cy - l); x.lineTo(cx, cy + l); x.stroke(); x.restore();
}

// ---------- 드론: 검은 X자 4발 드론, 붉은 외눈 ----------
EN_DRAW.drone = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.45, function (w) {
  var a = p * Math.PI * 2, pr = w * 0.44, rc = w - pr, Q = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  E3K = '#141a23';
  Q.forEach(function (q) { e3Ln(x, [[0, 0], [q[0] * rc, q[1] * rc]], w * 0.2, E3.gunL); });
  // 보호 고리 안에서 도는 프로펠러
  Q.forEach(function (q, i) {
    var cx = q[0] * rc, cy = q[1] * rc;
    e3El(x, cx, cy, pr, pr, '#9aa6b4', { sh: 'f' });
    e3El(x, cx, cy, pr * 0.7, pr * 0.7, '#222a35', { sh: 'f', lw: 0.6 });
    e3Prop(x, cx, cy, pr * 0.68, a / 2 * q[0] * q[1] + i, 2, { da: 0.4, bw: 0.2, bc: '#e6ecf1', ba: 0.95 });
    e3Dot(x, cx, cy, pr * 0.2, E3.or, 1);
  });
  e3Rp(x, [[-w * 0.46, -w * 0.2], [-w * 0.3, -w * 0.36], [w * 0.28, -w * 0.34], [w * 0.56, -w * 0.14], [w * 0.56, w * 0.14], [w * 0.28, w * 0.34], [-w * 0.3, w * 0.36], [-w * 0.46, w * 0.2]], w * 0.1, '#5b6879', { sh: 'c' });
  e3Po(x, [[-w * 0.24, -w * 0.33], [-w * 0.05, -w * 0.32], [-w * 0.05, w * 0.32], [-w * 0.24, w * 0.33]], E3.or, { sh: 'f', lw: 0.6 });
  e3Lamp(x, w * 0.32, 0, w * 0.16, E3.red, 2.4);
}); } };

// ---------- 공격 헬기: 녹색 날씬한 동체, 로켓 포드 단 보조 날개, 큰 회전 날개 ----------
EN_DRAW.heli = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.5, function (w) {
  var u = H, a = p * Math.PI * 2, ol = '#627d3e', olD = '#4a6130';
  E3K = '#152116';
  e3Po(x, [[-u * 0.16, -u * 0.05], [-u * 0.64, -u * 0.022], [-u * 0.64, u * 0.022], [-u * 0.16, u * 0.05]], ol, { sh: 'c' });
  e3Po(x, [[-u * 0.48, 0], [-u * 0.52, -u * 0.14], [-u * 0.6, -u * 0.14], [-u * 0.61, 0], [-u * 0.6, u * 0.14], [-u * 0.52, u * 0.14]], olD, { sh: 'f', lw: 0.8 });
  e3Ln(x, [[-u * (0.7 + 0.03 * Math.cos(a)), -u * 0.055], [-u * (0.56 - 0.03 * Math.cos(a)), -u * 0.055]], u * 0.022, '#232a33'); // 꼬리 로터
  e3Box(x, -u * 0.42, -u * 0.035, u * 0.045, u * 0.07, E3.or);
  // 보조 날개와 무장
  e3Po(x, [[u * 0.12, 0], [u * 0.07, -w * 0.8], [-u * 0.02, -w * 0.8], [-u * 0.06, 0], [-u * 0.02, w * 0.8], [u * 0.07, w * 0.8]], olD, { sh: 'f', lw: 0.8 });
  [-1, 1].forEach(function (sd) {
    e3Rr(x, -u * 0.06, sd * w * 0.78 - u * 0.04, u * 0.22, u * 0.08, u * 0.035, E3.gun, { sh: 'c', lw: 0.8 });
    e3Box(x, u * 0.12, sd * w * 0.78 - u * 0.028, u * 0.03, u * 0.056, E3.or);
    e3Ln(x, [[-u * 0.02, sd * w * 0.44], [u * 0.15, sd * w * 0.44]], u * 0.035, E3.wh, 'butt'); e3Box(x, u * 0.12, sd * w * 0.44 - u * 0.0175, u * 0.035, u * 0.035, E3.red);
  });
  // 동체
  e3Bl(x, [[u * 0.58, 0], [u * 0.44, -u * 0.09], [u * 0.12, -u * 0.135], [-u * 0.14, -u * 0.115], [-u * 0.27, -u * 0.045], [-u * 0.27, u * 0.045], [-u * 0.14, u * 0.115], [u * 0.12, u * 0.135], [u * 0.44, u * 0.09]], ol, { sh: 'c' });
  [-1, 1].forEach(function (sd) { e3Rr(x, -u * 0.14, sd * u * 0.105 - u * 0.03, u * 0.17, u * 0.06, u * 0.02, E3.gun, { lw: 0.7 }); });
  e3Glass(x, shp().blob([[u * 0.53, 0], [u * 0.44, -u * 0.06], [u * 0.33, -u * 0.065], [u * 0.31, 0], [u * 0.33, u * 0.065], [u * 0.44, u * 0.06]]));
  e3Glass(x, shp().rrect(u * 0.15, -u * 0.07, u * 0.13, u * 0.14, u * 0.035));
  e3Ln(x, [[u * 0.54, 0], [u * 0.66, 0]], u * 0.028, E3.gun, 'butt');
  e3Pl(x, [[-u * 0.02, -u * 0.12], [-u * 0.02, u * 0.12]], 0.4); e3Lamp(x, -u * 0.63, 0, u * 0.02, E3.red, 2.4);
  e3Prop(x, u * 0.04, 0, w, a / 4, 4, { da: 0.2, bw: 0.062, bc: '#e4eaef', ba: 0.95, ol: '#152116', tip: E3.or });
  e3El(x, u * 0.04, 0, u * 0.05, u * 0.05, E3.gun, { lw: 0.8 }); e3Dot(x, u * 0.04, 0, u * 0.02, '#aeb8c2', 1);
}); } };

// ---------- 전투기: 회청색 후퇴익 쌍발기, 날개 끝 미사일, 엔진 불꽃 ----------
EN_DRAW.jet = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.62, function (w) {
  var u = H, i = Math.round(p * 4) % 4, fl = [1, 0.72, 0.92, 0.64][i], st = '#93a6ba', stD = '#6e8198', wt = w - u * 0.025;
  E3K = '#152030';
  e3Jet(x, -u * 0.47, -u * 0.045, u * 0.34 * fl, u * 0.09); e3Jet(x, -u * 0.47, u * 0.045, u * 0.34 * fl, u * 0.09);
  [-1, 1].forEach(function (sd) {
    var wg = shp().poly([[u * 0.18, sd * u * 0.05], [-u * 0.2, sd * wt], [-u * 0.36, sd * wt], [-u * 0.3, sd * u * 0.05]]);
    e3F(x, wg, st, { sh: 'f' }); e3Band(x, wg, -u * 0.4, sd * wt - (sd > 0 ? u * 0.1 : 0), u * 0.3, u * 0.1, E3.or);
    e3Pl(x, [[-u * 0.27, sd * u * 0.1], [-u * 0.32, sd * wt * 0.9]], 0.4); e3Pl(x, [[u * 0.02, sd * u * 0.12], [-u * 0.2, sd * wt * 0.72]], 0.3); e3Band(x, wg, -u * 0.4, sd * wt * 0.42 - u * 0.012, u * 0.5, u * 0.024, stD, 0.7);
    e3Po(x, [[-u * 0.3, sd * u * 0.04], [-u * 0.46, sd * u * 0.22], [-u * 0.56, sd * u * 0.22], [-u * 0.5, sd * u * 0.04]], stD, { sh: 'f', lw: 0.8 });
    e3Ln(x, [[-u * 0.36, sd * wt], [-u * 0.12, sd * wt]], u * 0.035, E3.wh, 'butt'); e3Box(x, -u * 0.155, sd * wt - u * 0.0175, u * 0.04, u * 0.035, E3.red);
  });
  e3Bl(x, [[u * 0.64, 0], [u * 0.42, -u * 0.052], [u * 0.1, -u * 0.09], [-u * 0.3, -u * 0.09], [-u * 0.48, -u * 0.075], [-u * 0.48, u * 0.075], [-u * 0.3, u * 0.09], [u * 0.1, u * 0.09], [u * 0.42, u * 0.052]], st, { sh: 'c' });
  [-1, 1].forEach(function (sd) {
    e3Rr(x, u * 0.1, sd * u * 0.09 - u * 0.022, u * 0.13, u * 0.044, u * 0.01, '#232a35', { sh: 'f', lw: 0.7 }); // 흡입구
    e3Ln(x, [[-u * 0.26, sd * u * 0.07], [-u * 0.44, sd * u * 0.105]], u * 0.028, stD, 'butt'); // 수직 꼬리날개
    e3Rr(x, -u * 0.53, sd * u * 0.045 - u * 0.034, u * 0.075, u * 0.068, u * 0.015, E3.gun, { lw: 0.7 });
  });
  e3Glass(x, shp().blob([[u * 0.45, 0], [u * 0.36, -u * 0.042], [u * 0.2, -u * 0.048], [u * 0.15, 0], [u * 0.2, u * 0.048], [u * 0.36, u * 0.042]]));
  e3Bl(x, [[u * 0.65, 0], [u * 0.55, -u * 0.03], [u * 0.5, 0], [u * 0.55, u * 0.03]], E3.gun, { sh: 'f', lw: 0.7 });
  e3Pl(x, [[u * 0.1, 0], [-u * 0.44, 0]], 0.35); e3Pl(x, [[-u * 0.1, -u * 0.085], [-u * 0.1, u * 0.085]], 0.35);
}); } };

// ---------- 폭격기: 짙은 녹색 큰 날개, 프로펠러 엔진 4개, 유리 기수 ----------
EN_DRAW.bomber = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.55, function (w) {
  var u = H, a = p * Math.PI * 2, ol = '#5a7144', olD = '#465a36';
  E3K = '#141d15';
  [-1, 1].forEach(function (sd) {
    var wg = shp().poly([[u * 0.25, sd * u * 0.05], [u * 0.11, sd * w], [-u * 0.06, sd * w], [-u * 0.21, sd * u * 0.05]]);
    e3F(x, wg, ol, { sh: 'f' }); e3Band(x, wg, -u * 0.2, sd > 0 ? w - u * 0.065 : -w, u * 0.5, u * 0.065, E3.or);
    e3Band(x, wg, -u * 0.25, sd * w * 0.52 - u * 0.012, u * 0.6, u * 0.024, olD, 0.8);
    e3Po(x, [[-u * 0.3, sd * u * 0.04], [-u * 0.34, sd * u * 0.27], [-u * 0.45, sd * u * 0.27], [-u * 0.44, sd * u * 0.04]], olD, { sh: 'f', lw: 0.8 });
    [0.34, 0.7].forEach(function (k, j) {
      var ey = sd * w * k, ex = u * (0.17 - k * 0.1);
      e3Rr(x, ex - u * 0.12, ey - u * 0.042, u * 0.27, u * 0.084, u * 0.035, '#77838f', { sh: 'c', lw: 0.8 });
      e3El(x, ex + u * 0.155, ey, u * 0.024, u * 0.034, '#e3e9ee', { lw: 0.6 });
      e3PropE(x, ex + u * 0.175, ey, Math.min(u * 0.115, w * 0.3), a + j * 1.3 + (sd > 0 ? 0.7 : 0));
    });
  });
  e3Bl(x, [[u * 0.46, 0], [u * 0.39, -u * 0.07], [u * 0.1, -u * 0.088], [-u * 0.34, -u * 0.06], [-u * 0.48, -u * 0.03], [-u * 0.48, u * 0.03], [-u * 0.34, u * 0.06], [u * 0.1, u * 0.088], [u * 0.39, u * 0.07]], ol, { sh: 'c' });
  e3Ln(x, [[-u * 0.32, 0], [-u * 0.48, 0]], u * 0.032, olD, 'butt');
  e3Glass(x, shp().blob([[u * 0.45, 0], [u * 0.4, -u * 0.05], [u * 0.33, -u * 0.056], [u * 0.32, 0], [u * 0.33, u * 0.056], [u * 0.4, u * 0.05]]));
  e3Glass(x, shp().rrect(u * 0.2, -u * 0.05, u * 0.085, u * 0.1, u * 0.02));
  e3Pl(x, [[u * 0.16, -u * 0.038], [-u * 0.18, -u * 0.038], [-u * 0.18, u * 0.038], [u * 0.16, u * 0.038], [u * 0.16, -u * 0.038]], 0.45); e3Pl(x, [[u * 0.16, 0], [-u * 0.18, 0]], 0.35);
  e3El(x, -u * 0.25, 0, u * 0.042, u * 0.042, E3.gun, { lw: 0.7 }); e3Ln(x, [[-u * 0.27, -u * 0.013], [-u * 0.35, -u * 0.013]], u * 0.015, E3.gun, 'butt'); e3Ln(x, [[-u * 0.27, u * 0.013], [-u * 0.35, u * 0.013]], u * 0.015, E3.gun, 'butt');
  e3Hi(x, [[u * 0.34, -u * 0.022], [-u * 0.1, -u * 0.022]], u * 0.012, 0.3);
  e3Lamp(x, -u * 0.47, 0, u * 0.018, E3.red, 2.4);
}); } };

// ---------- 순항 미사일: 흰 몸, 붉은 탄두, 작은 날개, 긴 불꼬리 ----------
EN_DRAW.missile = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.6, function (w) {
  var u = H, i = Math.round(p * 4) % 4, fl = [1, 0.7, 0.9, 0.62][i];
  E3K = '#1a222e';
  e3Puff(x, -u * (0.72 + p * 0.1), (i % 2 ? 1 : -1) * u * 0.02, u * 0.07, '#f2f2ee', 0.4 - p * 0.25); e3Puff(x, -u * (0.58 + p * 0.1), 0, u * 0.055, '#f2f2ee', 0.55 - p * 0.3);
  e3Jet(x, -u * 0.3, 0, u * 0.4 * fl, u * 0.13);
  e3Po(x, [[-u * 0.16, 0], [-u * 0.28, -u * 0.15], [-u * 0.36, -u * 0.15], [-u * 0.32, 0], [-u * 0.36, u * 0.15], [-u * 0.28, u * 0.15]], E3.or, { sh: 'f', lw: 0.8 });
  e3Po(x, [[u * 0.12, 0], [-u * 0.03, -w * 0.96], [-u * 0.12, -w * 0.96], [-u * 0.07, 0], [-u * 0.12, w * 0.96], [-u * 0.03, w * 0.96]], '#b9c4d0', { sh: 'f', lw: 0.8 });
  var body = shp().rrect(-u * 0.33, -u * 0.06, u * 0.66, u * 0.12, u * 0.05); e3F(x, body, E3.wh, { sh: 'c', lo: 0.3 });
  e3Band(x, body, u * 0.17, -u * 0.1, u * 0.04, u * 0.2, '#22252b'); e3Band(x, body, -u * 0.22, -u * 0.1, u * 0.035, u * 0.2, E3.or);
  e3Bl(x, [[u * 0.5, 0], [u * 0.38, -u * 0.06], [u * 0.27, -u * 0.06], [u * 0.27, u * 0.06], [u * 0.38, u * 0.06]], E3.red, { sh: 'c', lo: 0.3 });
  e3Pl(x, [[u * 0.14, 0], [-u * 0.3, 0]], 0.3);
}); } };

// ---------- 고속정: 흰 선체에 주황 띠, 앞 기관포, 선외기 둘, 긴 물살 ----------
EN_DRAW.boat = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.4, function (w, ic) {
  var u = H, hb = Math.min(w * 0.6, u * 0.19);
  E3K = '#172636';
  e3Wake(x, u * 0.5, -u * 0.4, hb, u * 0.55, p, w, ic);
  [-1, 1].forEach(function (sd) { e3Rr(x, -u * 0.49, sd * hb * 0.48 - u * 0.04, u * 0.12, u * 0.08, u * 0.02, E3.gun, { lw: 0.8 }); e3Box(x, -u * 0.47, sd * hb * 0.48 - u * 0.02, u * 0.04, u * 0.04, E3.or); });
  var hull = e3Hull(u * 0.56, -u * 0.4, hb, 0.5, 0.06); e3F(x, hull, '#e6ebef', { sh: 'c', lo: 0.3 });
  if (!enMode) { x.save(); x.clip(hull.p); x.lineWidth = u * 0.07; x.strokeStyle = E3.or; x.stroke(hull.p); x.restore(); x.lineWidth = enLW; x.strokeStyle = E3K; x.stroke(hull.p); }
  e3F(x, e3Hull(u * 0.4, -u * 0.34, hb * 0.66, 0.45, 0.06), '#8492a2', { sh: 'f', lw: 0.7 });
  e3Rr(x, -u * 0.16, -hb * 0.5, u * 0.26, hb, u * 0.03, '#4b5665', { sh: 'c', lw: 0.8 });
  e3Glass(x, shp().poly([[u * 0.1, -hb * 0.5], [u * 0.19, -hb * 0.36], [u * 0.19, hb * 0.36], [u * 0.1, hb * 0.5]]));
  e3Rv(x, [[-u * 0.1, -hb * 0.2], [-u * 0.1, hb * 0.2]], u * 0.02);
  e3El(x, u * 0.3, 0, u * 0.05, u * 0.05, E3.gun, { lw: 0.8 }); e3Ln(x, [[u * 0.32, 0], [u * 0.47, 0]], u * 0.03, E3.gun, 'butt');
  e3Lamp(x, -u * 0.26, 0, u * 0.022, E3.red, 2.2);
}); } };

// ---------- 구축함: 길고 날씬한 회청색 군함, 앞뒤 함포, 함교와 굴뚝, 도는 레이더 ----------
EN_DRAW.destroyer = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.38, function (w, ic) {
  var u = H, hb = Math.min(w * 0.62, u * 0.16), a = p * Math.PI;
  E3K = '#16212d';
  e3Wake(x, u * 0.6, -u * 0.58, hb, u * 0.42, p, w, ic);
  var hull = e3Hull(u * 0.67, -u * 0.6, hb, 0.4, 0.1); e3F(x, hull, E3.hull, { sh: 'c' });
  e3F(x, e3Hull(u * 0.57, -u * 0.55, hb * 0.72, 0.38, 0.1), '#6b7888', { sh: 'f', lw: 0.6 });
  // 헬기 갑판: 노란 원과 가운데 점
  if (!enMode) { x.save(); x.strokeStyle = '#ffd23a'; x.lineWidth = Math.max(0.8, u * 0.012); x.beginPath(); x.arc(-u * 0.46, 0, hb * 0.42, 0, 7); x.stroke(); x.restore(); }
  e3Dot(x, -u * 0.46, 0, u * 0.012, '#ffd23a', 1);
  // 뒤 함포
  e3Ln(x, [[-u * 0.3, 0], [-u * 0.41, 0]], u * 0.03, '#3a4452', 'butt'); e3El(x, -u * 0.28, 0, hb * 0.44, hb * 0.44, E3.stL, { lw: 0.8 }); e3Dot(x, -u * 0.275, 0, hb * 0.16, E3.stD, 1);
  // 굴뚝 + 연기, 주황 구명정
  e3Puff(x, -u * (0.16 + p * 0.06), -hb * 0.1, hb * 0.48, '#d8d8d2', 0.5 - p * 0.2); e3Puff(x, -u * (0.25 + p * 0.06), hb * 0.15, hb * 0.6, '#d8d8d2', 0.3 - p * 0.12);
  e3Rr(x, -u * 0.15, -hb * 0.42, u * 0.12, hb * 0.84, hb * 0.32, E3.gun, { sh: 'c', lw: 0.8 }); e3Box(x, -u * 0.07, -hb * 0.36, u * 0.024, hb * 0.72, E3.or);
  [-1, 1].forEach(function (sd) { e3Rr(x, -u * 0.17, sd * hb * 0.66 - u * 0.016, u * 0.08, u * 0.032, u * 0.016, E3.or, { sh: 'f', lw: 0.6 }); });
  // 함교: 아래층, 위층(앞쪽 창 띠), 도는 레이더
  e3Rr(x, -u * 0.01, -hb * 0.7, u * 0.25, hb * 1.4, u * 0.03, '#b9c4cf', { sh: 'c' });
  e3Rr(x, u * 0.07, -hb * 0.52, u * 0.14, hb * 1.04, u * 0.02, '#e1e7ed', { sh: 'f', lw: 0.8 });
  e3Box(x, u * 0.185, -hb * 0.46, u * 0.018, hb * 0.92, '#22303e', 0.9); e3Box(x, u * 0.075, -hb * 0.5, u * 0.11, u * 0.012, '#22303e', 0.8); e3Box(x, u * 0.075, hb * 0.5 - u * 0.012, u * 0.11, u * 0.012, '#22303e', 0.8);
  e3El(x, u * 0.03, 0, u * 0.026, u * 0.026, E3.gun, { lw: 0.7 });
  e3Ln(x, [[u * 0.03 - Math.cos(a) * u * 0.08, -Math.sin(a) * u * 0.08], [u * 0.03 + Math.cos(a) * u * 0.08, Math.sin(a) * u * 0.08]], u * 0.02, '#f2f5f8', 'butt');
  // 수직 발사관 (어두운 칸 6개)
  e3Rr(x, u * 0.255, -hb * 0.4, u * 0.075, hb * 0.8, u * 0.008, '#2a323d', { sh: 'f', lw: 0.7 });
  [[0.275, -0.2], [0.31, -0.2], [0.275, 0.2], [0.31, 0.2]].forEach(function (q) { e3Dot(x, u * q[0], hb * q[1], Math.max(0.6, u * 0.009), '#9fb0c2', 1); });
  // 앞 함포
  e3Ln(x, [[u * 0.42, 0], [u * 0.58, 0]], u * 0.032, '#3a4452', 'butt'); e3El(x, u * 0.4, 0, hb * 0.5, hb * 0.5, E3.stL, { lw: 0.8 }); e3Dot(x, u * 0.395, 0, hb * 0.18, E3.stD, 1);
  e3Rv(x, [[u * 0.52, -hb * 0.08], [u * 0.52, hb * 0.08], [-u * 0.38, -hb * 0.45], [-u * 0.38, hb * 0.45]], u * 0.01);
  e3Lamp(x, -u * 0.57, 0, u * 0.016, E3.red, 2.4);
}); } };

// ---------- 잠수함: 검푸른 시가 모양 선체, 함교탑과 잠망경, 꼬리 십자 날개 ----------
function e3SubS(u, k) {
  var s = shp(), P = s.p, hb = u * 0.135 * k;
  P.moveTo(u * 0.6, 0); P.bezierCurveTo(u * 0.58, -hb, u * 0.36, -hb, u * 0.12, -hb); P.lineTo(-u * 0.28, -hb * 0.88); P.quadraticCurveTo(-u * 0.5, -hb * 0.6, -u * 0.63, 0);
  P.quadraticCurveTo(-u * 0.5, hb * 0.6, -u * 0.28, hb * 0.88); P.lineTo(u * 0.12, hb); P.bezierCurveTo(u * 0.36, hb, u * 0.58, hb, u * 0.6, 0); P.closePath();
  s.ext(-u * 0.63, -hb); s.ext(u * 0.6, hb); return s;
}
EN_DRAW.submarine = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.38, function (w, ic) {
  var u = H, nv = '#3d4f69', nvD = '#2a384d';
  E3K = '#0f151e';
  e3Wake(x, u * 0.5, -u * 0.56, u * 0.115, u * 0.36, p, w, ic);
  e3Po(x, [[-u * 0.44, 0], [-u * 0.5, -u * 0.15], [-u * 0.58, -u * 0.15], [-u * 0.58, u * 0.15], [-u * 0.5, u * 0.15]], nvD, { sh: 'f', lw: 0.8 });
  var hull = e3SubS(u, 1); e3F(x, hull, nv, { sh: 'c', hi: 0.24 });
  e3Band(x, hull, u * 0.4, -u * 0.2, u * 0.04, u * 0.4, E3.or); e3Band(x, hull, -u * 0.36, -u * 0.2, u * 0.03, u * 0.4, E3.or);
  e3Rr(x, -u * 0.4, -u * 0.03, u * 0.86, u * 0.06, u * 0.03, '#566a88', { sh: 'f', lw: 0.6 });
  e3Rv(x, [[u * 0.33, 0], [u * 0.25, 0], [-u * 0.22, 0], [-u * 0.3, 0]], u * 0.013);
  e3Po(x, [[u * 0.13, -u * 0.06], [u * 0.1, -u * 0.15], [u * 0.04, -u * 0.15], [u * 0.03, -u * 0.06], [u * 0.03, u * 0.06], [u * 0.04, u * 0.15], [u * 0.1, u * 0.15], [u * 0.13, u * 0.06]], nvD, { sh: 'f', lw: 0.8 });
  e3Bl(x, [[u * 0.2, 0], [u * 0.16, -u * 0.07], [-u * 0.02, -u * 0.07], [-u * 0.07, 0], [-u * 0.02, u * 0.07], [u * 0.16, u * 0.07]], nvD, { sh: 'c', hi: 0.3 });
  e3El(x, u * 0.11, 0, u * 0.026, u * 0.026, '#aeb8c2', { lw: 0.7 }); e3El(x, u * 0.03, -u * 0.015, u * 0.016, u * 0.016, '#aeb8c2', { lw: 0.6 });
  e3Lamp(x, -u * 0.02, u * 0.02, u * 0.016, E3.red, 2.4);
}); } };
// 잠수 중: 물속 어두운 그림자 + 물 위로 나온 잠망경과 가는 물살 (그림자는 외곽선도 흰 번쩍임도 없음)
EN_DRAW.submarine_sub = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.38, function (w) {
  var u = H, i;
  E3K = '#0f151e';
  if (enMode === 2) enBBbox(x, -u * 0.68, -u * 0.17, u * 0.64, u * 0.17, 0);
  if (!enMode) {
    x.save(); x.fillStyle = '#082036';
    x.globalAlpha = 0.2; x.fill(e3SubS(u * 1.06, 1.25).p); x.globalAlpha = 0.3; x.fill(e3SubS(u, 1.0).p); x.globalAlpha = 0.28; x.fill(e3SubS(u * 0.94, 0.72).p);
    x.globalAlpha = 0.22; x.beginPath(); x.ellipse(u * 0.06, 0, u * 0.13, u * 0.06, 0, 0, 7); x.fill();
    // 잠망경 물살
    x.fillStyle = '#ffffff';
    for (var sd = -1; sd <= 1; sd += 2) { x.globalAlpha = 0.8; x.beginPath(); x.moveTo(u * 0.17, 0); x.quadraticCurveTo(u * 0.02, sd * u * 0.035, -u * (0.2 + p * 0.03), sd * u * 0.1); x.quadraticCurveTo(u * 0.0, sd * u * 0.07, u * 0.13, sd * u * 0.02); x.fill(); }
    for (i = 0; i < 4; i++) { var t = (i + p) / 4; x.globalAlpha = 0.7 * (1 - t); x.beginPath(); x.arc(u * 0.06 - t * u * 0.4, (i % 2 ? 1 : -1) * u * 0.012, u * (0.022 - t * 0.008), 0, 7); x.fill(); }
    x.restore();
  }
  e3El(x, u * 0.12, 0, u * 0.04, u * 0.04, '#7b8898', { lw: 0.8 });
  e3Dot(x, u * 0.135, 0, u * 0.018, E3.gl, 1);
}); } };
// 잠수 모습도 enemyFrames가 크기를 알 수 있게 (자료 뼈대에 없을 때만)
if (ENEMIES.submarine && !ENEMIES.submarine_sub) { ENEMIES.submarine_sub = { name: ENEMIES.submarine.name, dom: 's', hp: ENEMIES.submarine.hp, spd: ENEMIES.submarine.spd, gold: 0, leak: ENEMIES.submarine.leak, size: ENEMIES.submarine.size, desc: ENEMIES.submarine.desc, alt: 'submarine' }; }

// ================= 보스 =================
// ---------- 거대 전차: 강철색 괴물 전차. 쌍열 주포탑 + 앞쪽 부포탑, 장갑 치마, 경고 빗금 쟁기날, 배기통 둘 ----------
EN_DRAW.bigtank = { n: 4, f: function (x, H, p) {
  var u = H * 0.94, a = p * Math.PI * 2, b = Math.sin(a) * u * 0.005, st = '#66768c', stD = '#4c5a6d', stL = '#8fa0b5', i;
  E3K = '#121a25';
  e3Shd(x, u * 0.02, u * 0.74, u * 0.06);
  e3Smoke(x, -u * 0.57, -u * 0.8 + b, -u * 0.2, -u * 0.17, u * 0.05, p, '#cfcfca'); e3Smoke(x, -u * 0.49, -u * 0.85 + b, -u * 0.2, -u * 0.17, u * 0.045, (p + 0.5) % 1, '#cfcfca');
  e3Ant(x, -u * 0.36, -u * 0.86 + b, -u * 0.44, -u * 1.1 + b, u * 0.012, u * 0.07, Math.sin(a) * 0.12);
  e3Ln(x, [[-u * 0.57, -u * 0.46 + b], [-u * 0.57, -u * 0.79 + b]], u * 0.05, '#939fac', 'butt'); e3Ln(x, [[-u * 0.49, -u * 0.46 + b], [-u * 0.49, -u * 0.84 + b]], u * 0.05, '#939fac', 'butt');
  e3Box(x, -u * 0.595, -u * 0.7 + b, u * 0.05, u * 0.02, '#3a4350'); e3Box(x, -u * 0.515, -u * 0.74 + b, u * 0.05, u * 0.02, '#3a4350');
  e3Track(x, -u * 0.67, u * 0.63, 0, u * 0.29, p, 7, '#7a889e');
  // 차체
  e3Rp(x, e3S(u, [[-0.65, -0.2], [-0.66, -0.4], [-0.57, -0.47], [0.4, -0.47], [0.67, -0.33], [0.65, -0.2]], b), u * 0.025, st, { a: 0.3, b: 0.72 });
  e3Po(x, e3S(u, [[-0.57, -0.47], [0.4, -0.47], [0.35, -0.505], [-0.53, -0.505]], b), stL, { sh: 'f', lw: 0.8 });
  e3Pl(x, e3S(u, [[0.4, -0.47], [0.44, -0.33]], b), 0.45);
  e3Lamp(x, u * 0.52, -u * 0.375 + b, u * 0.022, E3.yel, 2.2); e3Lamp(x, u * 0.59, -u * 0.335 + b, u * 0.022, E3.yel, 2.2);
  // 장갑 치마 5장 (맨 앞 장은 경고 빗금)
  for (i = 0; i < 5; i++) {
    var px = -0.64 + i * 0.252, ps = shp().rrect(u * px, -u * 0.335 + b, u * 0.24, u * 0.155, u * 0.012);
    e3F(x, ps, i % 2 ? mixc(stD, '#566e38', 0.35) : mixc(st, '#566e38', 0.45), { a: 0.25, b: 0.75, lw: 0.9 });
    if (i === 4) e3Haz(x, ps, E3.or, '#22252b', u * 0.03);
    e3Rv(x, [[u * (px + 0.03), -u * 0.305 + b], [u * (px + 0.21), -u * 0.305 + b], [u * (px + 0.03), -u * 0.21 + b], [u * (px + 0.21), -u * 0.21 + b]], u * 0.009);
  }
  // 쟁기날
  var bl = shp().poly(e3S(u, [[0.63, -0.33], [0.72, -0.3], [0.77, -0.07], [0.66, -0.035]], 0)); e3F(x, bl, E3.gun, { a: 0.3 });
  e3Haz(x, shp().poly(e3S(u, [[0.63, -0.33], [0.72, -0.3], [0.735, -0.23], [0.64, -0.25]], 0)), E3.or, '#22252b', u * 0.025);
  e3Rv(x, e3S(u, [[0.69, -0.17], [0.71, -0.09]], 0), u * 0.01);
  // 앞 부포탑
  e3Ln(x, [[u * 0.36, -u * 0.553 + b], [u * 0.8, -u * 0.567 + b]], u * 0.042, stD, 'butt'); e3Ln(x, [[u * 0.75, -u * 0.565 + b], [u * 0.82, -u * 0.567 + b]], u * 0.064, E3.gun, 'butt');
  e3Rp(x, e3S(u, [[0.11, -0.47], [0.14, -0.6], [0.24, -0.635], [0.38, -0.625], [0.45, -0.55], [0.45, -0.47]], b), u * 0.025, st, { a: 0.32 });
  e3Rr(x, u * 0.2, -u * 0.665 + b, u * 0.1, u * 0.04, u * 0.015, stD, { lw: 0.7 }); e3Lamp(x, u * 0.33, -u * 0.565 + b, u * 0.02, E3.red, 2.4);
  e3Rv(x, e3S(u, [[0.17, -0.52], [0.27, -0.52]], b), u * 0.009);
  // 주포탑 받침 + 쌍열 주포
  e3Rp(x, e3S(u, [[-0.52, -0.47], [-0.5, -0.585], [0.1, -0.585], [0.14, -0.47]], b), u * 0.02, stD, { a: 0.3 });
  [-0.785, -0.695].forEach(function (by, j) {
    var c = j ? stD : mixc(stD, E3K, 0.2);
    e3Ln(x, [[u * 0.18, u * by + b], [u * 0.88, u * (by - 0.012) + b]], u * 0.055, c, 'butt');
    e3Ln(x, [[u * 0.42, u * (by - 0.004) + b], [u * 0.54, u * (by - 0.006) + b]], u * 0.078, c, 'butt');
    e3Ln(x, [[u * 0.82, u * (by - 0.011) + b], [u * 0.9, u * (by - 0.012) + b]], u * 0.084, E3.gun, 'butt');
  });
  e3Rr(x, -u * 0.6, -u * 0.78 + b, u * 0.12, u * 0.15, u * 0.02, stD, { lw: 0.8 }); // 포탑 뒤 바구니
  e3Rp(x, e3S(u, [[-0.51, -0.585], [-0.48, -0.81], [-0.33, -0.89], [0.04, -0.89], [0.23, -0.77], [0.25, -0.63], [0.21, -0.585]], b), u * 0.035, st, { a: 0.3, b: 0.72 });
  e3Po(x, e3S(u, [[-0.33, -0.89], [0.04, -0.89], [-0.01, -0.93], [-0.29, -0.93]], b), stL, { sh: 'f', lw: 0.8 });
  e3Rr(x, u * 0.13, -u * 0.84 + b, u * 0.13, u * 0.21, u * 0.03, stD, { a: 0.3 }); // 포방패
  var hz = shp().poly(e3S(u, [[-0.46, -0.675], [0.1, -0.675], [0.1, -0.625], [-0.47, -0.625]], b)); e3F(x, hz, E3.or, { sh: 'f', lw: 0.6 }); e3Haz(x, hz, E3.or, '#22252b', u * 0.028);
  e3Pl(x, e3S(u, [[-0.2, -0.88], [-0.2, -0.69]], b), 0.4); e3Pl(x, e3S(u, [[-0.46, -0.76], [0.1, -0.76]], b), 0.3);
  [-0.4, -0.35, -0.3].forEach(function (tx) { e3Ln(x, [[u * tx, -u * 0.72 + b], [u * (tx + 0.03), -u * 0.79 + b]], u * 0.03, E3.gun, 'butt'); }); // 연막탄 발사관
  e3Rv(x, e3S(u, [[-0.44, -0.8], [-0.12, -0.84], [0.02, -0.84], [-0.12, -0.72], [0.02, -0.72]], b), u * 0.009);
  e3Hi(x, e3S(u, [[-0.45, -0.8], [-0.32, -0.87], [0.02, -0.87]], b), u * 0.012, 0.5);
  e3Rr(x, -u * 0.22, -u * 0.965 + b, u * 0.17, u * 0.07, u * 0.03, stD, { lw: 0.8 }); // 전차장 해치
  e3Ln(x, [[-u * 0.1, -u * 0.985 + b], [u * 0.06, -u * 1.02 + b]], u * 0.022, E3.gun, 'butt');
  e3Lamp(x, -u * 0.17, -u * 0.985 + b, u * 0.026, E3.red, 3);
  e3Ln(x, [[-u * 0.02, -u * 0.92 + b], [-u * 0.02, -u * 0.98 + b]], u * 0.014, '#c9d2dc'); e3El(x, -u * 0.02, -u * 0.99 + b, u * 0.045, u * 0.018, '#dfe6ec', { sh: 'f', lw: 0.7 }); // 레이더
} };

// ---------- 공중 요새: 거대한 강철 비행선. 덕트 팬 6개, 등 포탑 3개, 유리 함교, 경고 띠, 드론 격납구 ----------
EN_DRAW.fortress = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.42, function (w) {
  var u = H, a = p * Math.PI * 2, st = '#70849b', stD = '#536579', stL = '#9db0c4', fr = Math.min(u * 0.1, w * 0.26), fy = w - fr;
  E3K = '#121a26';
  // 꼬리 날개
  [-1, 1].forEach(function (sd) {
    var fin = shp().poly([[-u * 0.4, sd * u * 0.08], [-u * 0.55, sd * u * 0.3], [-u * 0.67, sd * u * 0.3], [-u * 0.62, sd * u * 0.05]]);
    e3F(x, fin, stD, { sh: 'f' }); e3Band(x, fin, -u * 0.7, sd > 0 ? u * 0.24 : -u * 0.3, u * 0.4, u * 0.06, E3.or); e3Lamp(x, -u * 0.61, sd * u * 0.285, u * 0.013, E3.red, 2.4);
  });
  // 팬 지지대 + 덕트 팬 (좌우 3쌍)
  [0.32, -0.02, -0.36].forEach(function (fx, j) {
    [-1, 1].forEach(function (sd) {
      e3Ln(x, [[u * fx, sd * u * 0.12], [u * fx, sd * fy]], u * 0.05, stD, 'butt');
      e3El(x, u * fx, sd * fy, fr, fr, E3.gunL, { sh: 'f' });
      e3El(x, u * fx, sd * fy, fr * 0.78, fr * 0.78, '#1b232d', { sh: 'f', lw: 0.7 });
      e3Prop(x, u * fx, sd * fy, fr * 0.76, a / 3 * sd + j * 0.7, 3, { da: 0.3, bw: 0.12, bc: '#aeb9c5', ba: 0.9 });
      e3El(x, u * fx, sd * fy, fr * 0.2, fr * 0.2, E3.or, { sh: 'f', lw: 0.6 });
    });
  });
  // 선체
  var hull = shp().blob([[u * 0.66, 0], [u * 0.52, -u * 0.13], [u * 0.2, -u * 0.215], [-u * 0.2, -u * 0.205], [-u * 0.5, -u * 0.12], [-u * 0.64, 0], [-u * 0.5, u * 0.12], [-u * 0.2, u * 0.205], [u * 0.2, u * 0.215], [u * 0.52, u * 0.13]]);
  e3F(x, hull, st, { sh: 'c', lw: 1.2 });
  if (!enMode) {
    x.save(); x.clip(hull.p);
    // 경고 띠
    var q, bw = u * 0.035; x.fillStyle = E3.or; x.fillRect(-u * 0.21, -u * 0.3, u * 0.07, u * 0.6);
    x.strokeStyle = '#22252b'; x.lineWidth = bw * 0.55; x.lineCap = 'butt';
    for (q = -u * 0.3; q < u * 0.3; q += bw * 1.15) { x.beginPath(); x.moveTo(-u * 0.215, q + bw * 0.7); x.lineTo(-u * 0.135, q); x.stroke(); }
    // 장갑판 이음매
    x.globalAlpha = 0.4; x.strokeStyle = E3K; x.lineWidth = Math.max(0.8, enLW * 0.9);
    [0.44, 0.24, 0.06, -0.3, -0.46].forEach(function (lx) { x.beginPath(); x.moveTo(u * lx, -u * 0.3); x.quadraticCurveTo(u * (lx + 0.03), 0, u * lx, u * 0.3); x.stroke(); });
    x.beginPath(); x.moveTo(-u * 0.6, -u * 0.105); x.lineTo(u * 0.5, -u * 0.105); x.moveTo(-u * 0.6, u * 0.105); x.lineTo(u * 0.5, u * 0.105); x.stroke();
    x.restore();
  }
  e3Rr(x, -u * 0.5, -u * 0.04, u * 0.98, u * 0.08, u * 0.04, stL, { sh: 'f', lw: 0.8 }); // 등뼈
  e3Rv(x, [[u * 0.5, -u * 0.07], [u * 0.5, u * 0.07], [u * 0.14, -u * 0.17], [u * 0.14, u * 0.17], [-u * 0.38, -u * 0.13], [-u * 0.38, u * 0.13]], u * 0.01);
  // 드론 격납구 (좌우 2개씩)
  [-1, 1].forEach(function (sd) { [0.13, -0.09].forEach(function (hx0) { e3Rr(x, u * hx0, sd * u * 0.14 - u * 0.022, u * 0.1, u * 0.044, u * 0.01, '#1b232d', { sh: 'f', lw: 0.7 }); e3Dot(x, u * (hx0 + 0.085), sd * u * 0.14, u * 0.009, E3.red, 1); }); });
  // 유리 함교
  e3Glass(x, shp().blob([[u * 0.63, 0], [u * 0.55, -u * 0.075], [u * 0.45, -u * 0.095], [u * 0.43, 0], [u * 0.45, u * 0.095], [u * 0.55, u * 0.075]]));
  // 등 포탑 3개 (가운데가 큰 쌍열)
  [[0.32, 0.05, 1], [0.0, 0.07, 2], [-0.32, 0.05, 1]].forEach(function (t) {
    var tx = u * t[0], r = u * t[1];
    if (t[2] === 2) { e3Ln(x, [[tx, -r * 0.4], [tx + r * 2.7, -r * 0.4]], r * 0.42, '#3a4452', 'butt'); e3Ln(x, [[tx, r * 0.4], [tx + r * 2.7, r * 0.4]], r * 0.42, '#3a4452', 'butt'); }
    else { e3Ln(x, [[tx, -r * 0.32], [tx + r * 2.6, -r * 0.32]], r * 0.36, '#3a4452', 'butt'); e3Ln(x, [[tx, r * 0.32], [tx + r * 2.6, r * 0.32]], r * 0.36, '#3a4452', 'butt'); }
    e3El(x, tx, 0, r, r, stD, { lw: 0.9 }); e3El(x, tx - r * 0.1, 0, r * 0.52, r * 0.52, stL, { sh: 'f', lw: 0.7 });
  });
  e3Ln(x, [[-u * 0.46, 0], [-u * 0.67, 0]], u * 0.035, stD, 'butt'); // 수직 꼬리날개
  e3Lamp(x, u * 0.65, 0, u * 0.014, E3.red, 2.6); e3Lamp(x, -u * 0.66, 0, u * 0.016, E3.red, 2.6);
}); } };

// ---------- 항공모함: 비스듬한 착함 갑판과 사출 갑판, 오른쪽 함교, 갑판 위 함재기, 큰 물살 ----------
function e3MiniJet(x, cx, cy, s, rot) {
  x.save(); x.translate(cx, cy); x.rotate(rot);
  e3Po(x, [[s * 0.2, 0], [-s * 0.3, -s * 0.52], [-s * 0.52, -s * 0.52], [-s * 0.4, 0], [-s * 0.52, s * 0.52], [-s * 0.3, s * 0.52]], '#a9b9c9', { sh: 'f', lw: 0.7 });
  e3Bl(x, [[s * 0.75, 0], [s * 0.4, -s * 0.13], [-s * 0.6, -s * 0.13], [-s * 0.6, s * 0.13], [s * 0.4, s * 0.13]], '#c3cfdb', { sh: 'c', lw: 0.7 });
  e3Dot(x, s * 0.3, 0, s * 0.09, E3.glD, 1); e3Box(x, -s * 0.5, -s * 0.52, s * 0.14, s * 0.1, E3.or); e3Box(x, -s * 0.5, s * 0.42, s * 0.14, s * 0.1, E3.or);
  x.restore();
}
EN_DRAW.carrier = { n: 4, top: 1, f: function (x, H, p) { e3Top(x, H, -0.36, function (w, ic) {
  var u = H, a = p * Math.PI, dk = '#5b6777', i;
  E3K = '#121a24';
  e3Wake(x, u * 0.66, -u * 0.64, u * 0.2, u * 0.3, p, w, ic);
  // 선체: 갑판 아래로 뱃머리와 옆구리가 보임
  var hull = e3Hull(u * 0.78, -u * 0.68, u * 0.2, 0.36, 0.05); e3F(x, hull, '#8a98a8', { sh: 'c', lw: 1.2 });
  e3Band(x, hull, u * 0.62, -u * 0.3, u * 0.03, u * 0.6, E3.or);
  // 비행 갑판: 왼쪽(위)으로 비스듬한 착함 갑판, 오른쪽(아래)으로 함교 자리
  var wy = Math.min(w, u * 0.36), sy = Math.min(w, u * 0.3);
  var deck = enRPoly([[u * 0.6, -u * 0.105], [u * 0.635, -u * 0.05], [u * 0.635, u * 0.06], [u * 0.58, u * 0.13], [u * 0.36, u * 0.185], [u * 0.31, sy], [-u * 0.12, sy], [-u * 0.18, u * 0.2], [-u * 0.62, u * 0.2], [-u * 0.67, u * 0.14], [-u * 0.67, -u * 0.16], [-u * 0.6, -u * 0.205], [-u * 0.36, -u * 0.225], [-u * 0.24, -wy], [u * 0.14, -wy], [u * 0.29, -u * 0.195], [u * 0.5, -u * 0.155]], u * 0.018);
  e3F(x, deck, dk, { sh: 'f', lw: 1.2 });
  if (!enMode) {
    x.save(); x.clip(deck.p);
    x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(-u * 0.7, -u * 0.4, u * 1.4, u * 0.34);
    x.fillStyle = 'rgba(10,14,20,0.16)'; x.fillRect(-u * 0.7, u * 0.12, u * 1.4, u * 0.3);
    // 승강기
    x.fillStyle = '#727e8b'; x.fillRect(-u * 0.43, u * 0.095, u * 0.15, u * 0.105); x.fillRect(u * 0.31, -u * 0.19, u * 0.13, u * 0.085);
    x.strokeStyle = 'rgba(18,26,36,0.6)'; x.lineWidth = Math.max(0.7, enLW * 0.8); x.strokeRect(-u * 0.43, u * 0.095, u * 0.15, u * 0.105); x.strokeRect(u * 0.31, -u * 0.19, u * 0.13, u * 0.085);
    // 갑판 테두리 흰 선
    x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = u * 0.02; x.stroke(deck.p);
    // 사출 갑판 줄 2개
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = Math.max(0.8, u * 0.011); x.lineCap = 'butt';
    x.beginPath(); x.moveTo(u * 0.1, -u * 0.055); x.lineTo(u * 0.62, -u * 0.055); x.moveTo(u * 0.14, u * 0.065); x.lineTo(u * 0.62, u * 0.065); x.stroke();
    // 비스듬한 착함 갑판: 흰 가장자리 줄 + 노란 점선 + 착함 줄
    var ax0 = -u * 0.67, ay0 = u * 0.03, ax1 = u * 0.17, ay1 = -u * 0.3, dx = ax1 - ax0, dy = ay1 - ay0, L = Math.hypot(dx, dy), nx = -dy / L * u * 0.08, ny = dx / L * u * 0.08;
    x.fillStyle = 'rgba(14,20,28,0.22)'; x.beginPath(); x.moveTo(ax0 + nx, ay0 + ny); x.lineTo(ax1 + nx, ay1 + ny); x.lineTo(ax1 - nx, ay1 - ny); x.lineTo(ax0 - nx, ay0 - ny); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(ax0 + nx, ay0 + ny); x.lineTo(ax1 + nx, ay1 + ny); x.moveTo(ax0 - nx, ay0 - ny); x.lineTo(ax1 - nx, ay1 - ny); x.stroke();
    x.strokeStyle = '#ffd23a'; x.lineWidth = Math.max(0.9, u * 0.014); x.setLineDash([u * 0.045, u * 0.03]); x.beginPath(); x.moveTo(ax0, ay0); x.lineTo(ax1, ay1); x.stroke(); x.setLineDash([]);
    x.strokeStyle = 'rgba(225,232,240,0.75)'; x.lineWidth = Math.max(0.6, u * 0.007);
    for (i = 0; i < 4; i++) { var t = 0.14 + i * 0.065; x.beginPath(); x.moveTo(ax0 + dx * t + nx * 0.9, ay0 + dy * t + ny * 0.9); x.lineTo(ax0 + dx * t - nx * 0.9, ay0 + dy * t - ny * 0.9); x.stroke(); }
    // 배꼬리 경고 띠
    x.fillStyle = E3.or; x.fillRect(-u * 0.68, -u * 0.3, u * 0.035, u * 0.6); x.fillStyle = '#22252b'; for (i = 0; i < 9; i++) x.fillRect(-u * 0.68, -u * 0.22 + i * u * 0.054, u * 0.035, u * 0.027);
    x.restore();
  }
  // 함재기: 사출 갑판에 둘, 승강기와 뒤 갑판, 착함 갑판 옆에 하나씩
  e3MiniJet(x, u * 0.36, -u * 0.055, u * 0.115, 0); e3MiniJet(x, u * 0.2, u * 0.065, u * 0.115, 0);
  e3MiniJet(x, -u * 0.35, u * 0.13, u * 0.105, -0.55); e3MiniJet(x, -u * 0.55, u * 0.125, u * 0.105, -0.55); e3MiniJet(x, -u * 0.03, -wy + u * 0.075, u * 0.105, 0.42);
  // 사출기 뒤 화염 막이판, 갑판 요원(색 점), 노란 견인차, 뒤쪽 헬기
  e3Rr(x, u * 0.255, -u * 0.09, u * 0.02, u * 0.07, u * 0.005, '#a9b6c4', { sh: 'f', lw: 0.7 }); e3Rr(x, u * 0.095, u * 0.03, u * 0.02, u * 0.07, u * 0.005, '#a9b6c4', { sh: 'f', lw: 0.7 });
  [[0.46, 0.0, E3.yel], [0.5, -0.1, E3.red], [0.1, -0.12, '#6fe08a'], [-0.2, 0.02, E3.yel], [-0.26, 0.15, '#ffffff'], [0.0, 0.12, E3.red], [-0.48, -0.02, '#6fe08a']].forEach(function (q) { e3Dot(x, u * q[0], u * q[1], Math.max(0.7, u * 0.009), q[2], 1); });
  e3Rr(x, -u * 0.17, u * 0.1, u * 0.045, u * 0.03, u * 0.008, E3.yel, { sh: 'f', lw: 0.7 });
  e3El(x, -u * 0.52, -u * 0.105, u * 0.045, u * 0.022, '#6f8a44', { sh: 'f', lw: 0.7 }); e3Ln(x, [[-u * 0.56, -u * 0.105], [-u * 0.6, -u * 0.105]], u * 0.01, '#6f8a44', 'butt');
  e3Prop(x, -u * 0.515, -u * 0.105, u * 0.055, a / 2, 4, { da: 0.25, bw: 0.1, bc: '#eef2f5', ba: 0.9 });
  // 방어 포탑
  [[0.55, 0.1], [-0.61, -0.16], [0.42, -0.135], [-0.61, 0.15]].forEach(function (q) { e3El(x, u * q[0], u * q[1], u * 0.022, u * 0.022, '#aebccb', { lw: 0.7 }); e3Ln(x, [[u * q[0], u * q[1]], [u * (q[0] + 0.045), u * q[1]]], u * 0.012, E3.gun, 'butt'); });
  // 함교 (오른쪽 뱃전): 굴뚝과 연기, 2층 함교와 창, 도는 레이더, 둥근 안테나 덮개
  var iy = sy - u * 0.125;
  e3Box(x, -u * 0.105, iy - u * 0.012, u * 0.39, u * 0.02, '#0c1118', 0.35); // 함교 그림자
  e3Puff(x, -u * (0.1 + p * 0.05), iy + u * 0.05, u * 0.04, '#d8d8d2', 0.5 - p * 0.2); e3Puff(x, -u * (0.19 + p * 0.05), iy + u * 0.06, u * 0.05, '#d8d8d2', 0.3 - p * 0.12);
  e3Rr(x, -u * 0.09, iy, u * 0.37, u * 0.115, u * 0.02, '#b3bfcb', { sh: 'c' });
  e3Rr(x, -u * 0.07, iy + u * 0.02, u * 0.1, u * 0.075, u * 0.03, E3.gun, { sh: 'c', lw: 0.8 }); e3Box(x, -u * 0.015, iy + u * 0.026, u * 0.02, u * 0.063, E3.or);
  e3Rr(x, u * 0.06, iy + u * 0.012, u * 0.15, u * 0.09, u * 0.015, '#e0e6ec', { sh: 'f', lw: 0.8 });
  e3Box(x, u * 0.19, iy + u * 0.018, u * 0.016, u * 0.078, '#22303e', 0.9); e3Box(x, u * 0.066, iy + u * 0.016, u * 0.135, u * 0.013, '#22303e', 0.9);
  e3El(x, u * 0.115, iy + u * 0.06, u * 0.016, u * 0.016, E3.gun, { lw: 0.6 });
  e3Ln(x, [[u * 0.115 - Math.cos(a) * u * 0.065, iy + u * 0.06 - Math.sin(a) * u * 0.065], [u * 0.115 + Math.cos(a) * u * 0.065, iy + u * 0.06 + Math.sin(a) * u * 0.065]], u * 0.018, '#f2f5f8', 'butt');
  e3El(x, u * 0.245, iy + u * 0.058, u * 0.026, u * 0.026, '#f2f5f8', { lw: 0.7, hi: 0.1 });
  e3Lamp(x, u * 0.03, iy + u * 0.058, u * 0.013, E3.red, 2.6); e3Lamp(x, u * 0.745, 0, u * 0.013, E3.red, 2.6);
}); } };

// ---------- 강철 거신: 육중한 2족 보행 병기. 어깨 미사일 포드, 빛나는 가슴 코어, 붉은 눈, 팔뚝 대포 ----------
EN_DRAW.titan = { n: 6, f: function (x, H, p) {
  var u = H * 0.86, a = p * Math.PI * 2, bob = -Math.abs(Math.cos(a)) * u * 0.014, st = '#66768c', stD = '#485567', stL = '#93a4b9', ol = '#6b8443', olD = '#536a36', i;
  E3K = '#111925';
  function leg(ph, far) {
    var s = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * u * 0.06, hip = [-u * 0.03, -u * 0.53 + bob], ft = [u * 0.0 + s * u * 0.17, -u * 0.035 - lift];
    var ank = [ft[0] - u * 0.03, ft[1] - u * 0.1], knee = [(hip[0] + ank[0]) / 2 + u * 0.1, (hip[1] + ank[1]) / 2 - u * 0.02];
    var c = far ? mixc(st, E3K, 0.36) : st, cD = far ? mixc(stD, E3K, 0.36) : stD, cA = far ? mixc(olD, E3K, 0.36) : ol;
    e3Pill(x, hip, knee, u * 0.19, u * 0.15, cD);
    e3Pill(x, knee, ank, u * 0.16, u * 0.21, c);
    var dx = ank[0] - knee[0], dy = ank[1] - knee[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    e3Po(x, [[knee[0] - nx * u * 0.1 + dx * 0.08, knee[1] - ny * u * 0.1 + dy * 0.08], [ank[0] - nx * u * 0.135, ank[1] - ny * u * 0.135], [ank[0] - nx * u * 0.02, ank[1] - ny * u * 0.02], [knee[0] + dx * 0.08, knee[1] + dy * 0.08]], cA, { a: 0.3, lw: 0.9 }); // 정강이 장갑
    e3El(x, knee[0], knee[1], u * 0.085, u * 0.085, far ? cD : E3.or, { lw: 0.9 }); if (!far) e3Dot(x, knee[0], knee[1], u * 0.035, '#22252b', 0.85);
    e3Rp(x, [[ft[0] - u * 0.17, ft[1] + u * 0.035], [ft[0] - u * 0.14, ft[1] - u * 0.1], [ft[0] + u * 0.07, ft[1] - u * 0.12], [ft[0] + u * 0.25, ft[1] - u * 0.03], [ft[0] + u * 0.25, ft[1] + u * 0.035]], u * 0.025, cD, { a: 0.3 });
    if (!far) { e3Po(x, [[ft[0] + u * 0.1, ft[1] - u * 0.092], [ft[0] + u * 0.245, ft[1] - u * 0.026], [ft[0] + u * 0.245, ft[1] + u * 0.03], [ft[0] + u * 0.1, ft[1] + u * 0.03]], stL, { sh: 'f', lw: 0.8 }); e3Hi(x, [[hip[0] + u * 0.05, hip[1] + u * 0.05], [knee[0] + u * 0.02, knee[1] - u * 0.07]], u * 0.014, 0.35); }
  }
  leg(a + Math.PI, 1);
  var by = bob, sw = Math.sin(a) * 0.05;
  // 먼 쪽 팔 (집게손)
  e3Pill(x, [u * 0.18, -u * 0.92 + by], [u * 0.33, -u * 0.7 + by - sw * u * 0.3], u * 0.13, u * 0.12, mixc(st, E3K, 0.36));
  e3Po(x, [[u * 0.27, -u * 0.72 + by], [u * 0.43, -u * 0.68 + by], [u * 0.4, -u * 0.58 + by], [u * 0.36, -u * 0.64 + by], [u * 0.31, -u * 0.58 + by], [u * 0.25, -u * 0.63 + by]], mixc(E3.gun, E3K, 0.2), { lw: 0.8 });
  // 등 동력부 + 배기 연기
  e3Smoke(x, -u * 0.45, -u * 1.13 + by, -u * 0.18, -u * 0.16, u * 0.045, p, '#cfcfca');
  e3Ln(x, [[-u * 0.4, -u * 0.96 + by], [-u * 0.46, -u * 1.12 + by]], u * 0.05, '#939fac', 'butt'); e3Ln(x, [[-u * 0.33, -u * 0.96 + by], [-u * 0.37, -u * 1.14 + by]], u * 0.045, '#939fac', 'butt');
  e3Rp(x, [[-u * 0.47, -u * 0.66 + by], [-u * 0.49, -u * 0.94 + by], [-u * 0.41, -u * 1.0 + by], [-u * 0.2, -u * 1.0 + by], [-u * 0.2, -u * 0.66 + by]], u * 0.03, stD, { a: 0.3 });
  for (i = 0; i < 3; i++) e3Pl(x, [[-u * 0.46, -u * (0.88 - i * 0.06) + by], [-u * 0.32, -u * (0.88 - i * 0.06) + by]], 0.55);
  // 먼 쪽 어깨 포드
  e3Rp(x, [[u * 0.04, -u * 1.03 + by], [u * 0.04, -u * 1.21 + by], [u * 0.33, -u * 1.21 + by], [u * 0.36, -u * 1.03 + by]], u * 0.02, mixc(olD, E3K, 0.3), { lw: 0.9 });
  [[0.315, -1.165], [0.325, -1.09]].forEach(function (q) { e3Dot(x, u * q[0], u * q[1] + by, u * 0.022, '#141a22', 1); e3Dot(x, u * q[0], u * q[1] + by, u * 0.012, E3.red, 1); });
  // 허리 + 골반
  e3Rr(x, -u * 0.15, -u * 0.68 + by, u * 0.29, u * 0.12, u * 0.02, E3.gun, { lw: 0.9 });
  e3Pl(x, [[-u * 0.05, -u * 0.67 + by], [-u * 0.05, -u * 0.58 + by]], 0.5); e3Pl(x, [[u * 0.05, -u * 0.67 + by], [u * 0.05, -u * 0.58 + by]], 0.5);
  e3Rp(x, [[-u * 0.21, -u * 0.45 + by], [-u * 0.2, -u * 0.6 + by], [u * 0.18, -u * 0.6 + by], [u * 0.2, -u * 0.47 + by], [u * 0.06, -u * 0.4 + by], [-u * 0.1, -u * 0.4 + by]], u * 0.025, stD, { a: 0.3 });
  var hz = shp().poly([[u * 0.03, -u * 0.57 + by], [u * 0.17, -u * 0.57 + by], [u * 0.18, -u * 0.48 + by], [u * 0.07, -u * 0.43 + by], [u * 0.03, -u * 0.43 + by]]); e3F(x, hz, E3.or, { sh: 'f', lw: 0.7 }); e3Haz(x, hz, E3.or, '#22252b', u * 0.028);
  leg(a, 0);
  // 가슴
  e3Rp(x, [[-u * 0.26, -u * 0.63 + by], [-u * 0.3, -u * 0.92 + by], [-u * 0.19, -u * 1.04 + by], [u * 0.2, -u * 1.04 + by], [u * 0.36, -u * 0.92 + by], [u * 0.37, -u * 0.75 + by], [u * 0.23, -u * 0.63 + by]], u * 0.04, st, { a: 0.3, b: 0.72 });
  e3Po(x, [[u * 0.02, -u * 1.0 + by], [u * 0.19, -u * 1.0 + by], [u * 0.325, -u * 0.9 + by], [u * 0.335, -u * 0.77 + by], [u * 0.22, -u * 0.67 + by], [u * 0.02, -u * 0.67 + by]], stL, { a: 0.3, b: 0.74, lw: 0.9 }); // 앞가슴 판
  e3Pl(x, [[-u * 0.25, -u * 0.8 + by], [u * 0.02, -u * 0.8 + by]], 0.45);
  e3Rv(x, [[-u * 0.2, -u * 0.88 + by], [-u * 0.2, -u * 0.72 + by], [-u * 0.05, -u * 0.88 + by], [-u * 0.05, -u * 0.72 + by], [u * 0.06, -u * 0.96 + by], [u * 0.06, -u * 0.71 + by]], u * 0.009);
  // 가슴 코어
  var cx = u * 0.2, cy = -u * 0.84 + by, cr = u * 0.09, pu = 0.5 + 0.5 * Math.sin(a * 2);
  e3El(x, cx, cy, cr, cr, E3.gun, { lw: 0.9 });
  e3El(x, cx, cy, cr * 0.72, cr * 0.72, '#ff9a1e', { sh: 'f', lw: 0.7 });
  e3Dot(x, cx, cy, cr * 0.48, '#ffe27a', 1); e3Dot(x, cx - cr * 0.1, cy - cr * 0.12, cr * 0.22, '#ffffff', 0.95);
  enGlow(x, cx, cy, cr * (2.2 + pu * 0.5), '#ffab3a', 0.5 + pu * 0.2);
  // 머리: 앞으로 내민 투구, 붉은 눈 띠, 뿔 안테나
  e3Ln(x, [[u * 0.2, -u * 1.13 + by], [u * 0.13, -u * 1.27 + by]], u * 0.02, '#c9d2dc');
  e3Rp(x, [[u * 0.12, -u * 1.02 + by], [u * 0.13, -u * 1.13 + by], [u * 0.24, -u * 1.17 + by], [u * 0.37, -u * 1.11 + by], [u * 0.39, -u * 1.03 + by], [u * 0.3, -u * 1.0 + by]], u * 0.025, stL, { a: 0.34 });
  e3Po(x, [[u * 0.25, -u * 1.105 + by], [u * 0.385, -u * 1.085 + by], [u * 0.385, -u * 1.045 + by], [u * 0.25, -u * 1.055 + by]], '#ff4a35', { sh: 'f', lw: 0.7 });
  e3Dot(x, u * 0.34, -u * 1.07 + by, u * 0.014, '#ffe3d8', 1); enGlow(x, u * 0.33, -u * 1.07 + by, u * 0.1, E3.red, 0.75);
  // 가까운 쪽 어깨 미사일 포드
  var pod = enRPoly([[-u * 0.36, -u * 0.98 + by], [-u * 0.38, -u * 1.22 + by], [-u * 0.34, -u * 1.26 + by], [u * 0.04, -u * 1.26 + by], [u * 0.08, -u * 1.22 + by], [u * 0.1, -u * 0.98 + by]], u * 0.02);
  e3F(x, pod, ol, { a: 0.26, b: 0.74 });
  e3Po(x, [[-u * 0.34, -u * 1.26 + by], [u * 0.04, -u * 1.26 + by], [u * 0.0, -u * 1.295 + by], [-u * 0.31, -u * 1.295 + by]], E3.olL, { sh: 'f', lw: 0.8 });
  e3Rr(x, -u * 0.09, -u * 1.225 + by, u * 0.175, u * 0.215, u * 0.015, '#2a323d', { sh: 'f', lw: 0.8 }); // 발사구 면
  [[-0.045, -1.18], [0.04, -1.18], [-0.045, -1.115], [0.04, -1.115], [-0.045, -1.05], [0.04, -1.05]].forEach(function (q) { e3Dot(x, u * q[0], u * q[1] + by, u * 0.029, '#10151c', 1); e3Dot(x, u * q[0], u * q[1] + by, u * 0.019, E3.red, 1); e3Dot(x, u * q[0] - u * 0.005, u * q[1] + by - u * 0.006, u * 0.007, '#ffffff', 0.9); });
  var hz2 = shp().poly([[-u * 0.355, -u * 1.045 + by], [-u * 0.11, -u * 1.045 + by], [-u * 0.11, -u * 0.995 + by], [-u * 0.352, -u * 0.995 + by]]); e3F(x, hz2, E3.or, { sh: 'f', lw: 0.6 }); e3Haz(x, hz2, E3.or, '#22252b', u * 0.026);
  e3Pl(x, [[-u * 0.23, -u * 1.25 + by], [-u * 0.23, -u * 1.05 + by]], 0.4);
  e3Rv(x, [[-u * 0.33, -u * 1.2 + by], [-u * 0.33, -u * 1.09 + by], [-u * 0.13, -u * 1.2 + by], [-u * 0.13, -u * 1.09 + by]], u * 0.009);
  e3Hi(x, [[-u * 0.35, -u * 1.21 + by], [-u * 0.325, -u * 1.245 + by], [-u * 0.14, -u * 1.245 + by]], u * 0.012, 0.5);
  // 가까운 쪽 팔: 어깨 관절, 위팔, 쌍열 팔뚝 대포
  x.save(); x.translate(-u * 0.1, -u * 0.92 + by); x.rotate(sw);
  e3Pill(x, [0, 0], [-u * 0.04, u * 0.2], u * 0.17, u * 0.15, st);
  [0.235, 0.315].forEach(function (gy) { e3Ln(x, [[u * 0.2, u * gy], [u * 0.6, u * (gy + 0.02)]], u * 0.055, E3.gun, 'butt'); e3Ln(x, [[u * 0.54, u * (gy + 0.017)], [u * 0.62, u * (gy + 0.021)]], u * 0.08, '#3a4350', 'butt'); });
  var fa = enRPoly([[-u * 0.14, u * 0.14], [u * 0.2, u * 0.17], [u * 0.27, u * 0.22], [u * 0.27, u * 0.35], [u * 0.2, u * 0.4], [-u * 0.14, u * 0.38]], u * 0.035);
  e3F(x, fa, stL, { a: 0.3, b: 0.72 }); e3Band(x, fa, u * 0.1, u * 0.1, u * 0.05, u * 0.32, E3.or);
  e3Pl(x, [[-u * 0.03, u * 0.15], [-u * 0.03, u * 0.38]], 0.45); e3Rv(x, [[-u * 0.09, u * 0.2], [-u * 0.09, u * 0.33], [u * 0.22, u * 0.25], [u * 0.22, u * 0.33]], u * 0.009);
  e3Hi(x, [[-u * 0.11, u * 0.175], [u * 0.18, u * 0.2]], u * 0.012, 0.5);
  e3El(x, 0, 0, u * 0.105, u * 0.105, stD, { lw: 0.9 }); e3El(x, 0, 0, u * 0.048, u * 0.048, E3.or, { sh: 'f', lw: 0.7 });
  x.restore();
} };
