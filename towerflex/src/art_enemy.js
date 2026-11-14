// ===== art_enemy.js : 적 27종 (귀염판 v1.2: 말랑 젤리 아기 마스코트, v1.3: 새 적 6종). 오른쪽을 보고 통통 뛰는 모습, 기준점은 발 밑 =====
// enemyFrames(k, S) → { fr[n], wh[n](맞을 때 흰 실루엣 + > < 눈), n(걷기 8, 박쥐와 와이번 6), h, kneel(바르칸), icon(거미 둘만: 아이콘용 얼굴 바로 선 모습) }
var EN_SPR = {};
var NFR = 8;
// 적이 화면에서 차지하는 높이(칸 단위). 작은 적일수록 더 키워 폰에서도 또렷하게
function enVis(E) { return E.boss ? E.size * 1.3 : 0.5 + E.size * 1.15; }

// ---------- 그리기 단계와 색 ----------
// 한 장을 세 번 그림: 2 크기 재기(그리지 않음) → 1 외곽선(모양마다 그 색의 진한 색으로 굵은 테) → 0 색칠
// 끝나면 얇은 흰 스티커 테두리를 뒤에 깔고(풀밭, 아군 탑과 확실히 갈림), 외곽선 그림은 흰 실루엣(맞을 때 번쩍, > < 눈)으로 바꿈
var enLW = 1, enOL = 2, enMode = 0, enBB = null;
var EN_CC = {}, EN_EYEK = '#2a1238', EN_EYES = [], EN_ONE = null, EN_RIMW = 0;
function enHsl(c) {
  var A = hx(c), r = A[0] / 255, g = A[1] / 255, b = A[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
  if (d > 1e-6) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; if (h < 0) h += 1; }
  return [h, s, l];
}
function enRgb(h, s, l) {
  h = ((h % 1) + 1) % 1; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  var C = (1 - Math.abs(2 * l - 1)) * s, X = C * (1 - Math.abs((h * 6) % 2 - 1)), m = l - C / 2, k = Math.floor(h * 6), r = 0, g = 0, b = 0;
  if (k === 0) { r = C; g = X; } else if (k === 1) { r = X; g = C; } else if (k === 2) { g = C; b = X; } else if (k === 3) { g = X; b = C; } else if (k === 4) { r = X; b = C; } else { r = C; b = X; }
  return hexOf((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
// 같은 빛깔의 진한 색(외곽선). 노랑은 주황 쪽, 초록은 청록 쪽으로 살짝 돌려 탁해지지 않게. 옅은 색(흰, 크림, 은)은 그 적의 기본 외곽선 EN_ONE
function enInk(c) {
  var v = EN_CC[c]; if (v) return v;
  var A = hx(c), ch = (Math.max(A[0], A[1], A[2]) - Math.min(A[0], A[1], A[2])) / 255, q = enHsl(c), h = q[0], s = q[1];
  if (ch < 0.22 || q[2] > 0.95) return EN_ONE || '#4e3a96';
  if (h > 0.1 && h < 0.2) h -= 0.045; else if (h >= 0.2 && h < 0.5) h += 0.035;
  return (EN_CC[c] = enRgb(h, Math.min(1, 0.5 + s * 0.38), h > 0.05 && h < 0.2 ? 0.29 : 0.31));
}
function enShd(c, k) { return mixc(c, enInk(c), k); }
function enLit(c, k) { return mixc(c, '#ffffff', k); }
function enEl(cx, cy, rx, ry, rot) { return shp().ell(cx, cy, rx, ry, rot); }
function enBBpt(m, px, py) { var X = m.a * px + m.c * py + m.e, Y = m.b * px + m.d * py + m.f; if (X < enBB[0]) enBB[0] = X; if (Y < enBB[1]) enBB[1] = Y; if (X > enBB[2]) enBB[2] = X; if (Y > enBB[3]) enBB[3] = Y; }
function enBBbox(x, x0, y0, x1, y1, pad) {
  if (!x.getTransform) return;
  var m = x.getTransform(); x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  enBBpt(m, x0, y0); enBBpt(m, x1, y0); enBBpt(m, x0, y1); enBBpt(m, x1, y1);
}
// 외곽선, 크기 재기 단계면 처리하고 true (외곽선 색은 col 의 진한 색)
function enPass(x, s, lw, col) {
  if (!enMode) return false;
  var w = enLW * (lw || 1);
  if (enMode === 2) { enBBbox(x, s.x0, s.y0, s.x1, s.y1, enOL + w); return true; }
  var k = enInk(col); x.fillStyle = k; x.fill(s.p); x.lineWidth = enOL * 2 + w; x.strokeStyle = k; x.stroke(s.p);
  return true;
}
// 안쪽 띠: 모양으로 자르고 (dx,dy)만큼 민 모양을 뺀 나머지를 칠함 → 반대편 가장자리만 남음
var EN_DM = typeof DOMMatrix !== 'undefined' && typeof Path2D !== 'undefined' && !!Path2D.prototype.addPath;
function enCres(x, s, col, dx, dy, a) {
  if (!EN_DM) return;
  var q = new Path2D(), pad = Math.abs(dx) + Math.abs(dy) + 2;
  q.rect(s.x0 - pad, s.y0 - pad, s.w() + pad * 2, s.h() + pad * 2);
  q.addPath(s.p, new DOMMatrix([1, 0, 0, 1, dx, dy]));
  x.save(); x.clip(s.p); x.globalAlpha *= a; x.fillStyle = col; x.fill(q, 'evenodd'); x.restore();
}
// 젤리 칠: 왼쪽 위 부드러운 밝음 → 바탕 → 가장자리 살짝 진하게, 아래쪽 은은한 그늘 초승달, 위쪽 흰 테두리광, 안쪽 선
// o: oc 외곽선 기준색, hi lo 밝기, d 그늘 폭, sk sa 그늘 색과 진하기, rim 1 이면 위쪽 흰 테두리광(몸통만), ln 0 이면 선 없음, lw 선 굵기
function enJF(x, s, c, o) {
  o = o || {};
  if (enPass(x, s, o.lw, o.oc || c)) return;
  var w = s.w(), h = s.h(), m = Math.max(w, h), mn = Math.min(w, h);
  var gx = s.x0 + w * (o.gx == null ? 0.34 : o.gx), gy = s.y0 + h * (o.gy == null ? 0.24 : o.gy);
  var g = x.createRadialGradient(gx, gy, m * 0.02, gx, gy, m * 0.88);
  g.addColorStop(0, enLit(c, o.hi == null ? 0.5 : o.hi)); g.addColorStop(0.45, c); g.addColorStop(1, enShd(c, o.lo == null ? 0.12 : o.lo));
  x.fillStyle = g; x.fill(s.p);
  var d = o.d == null ? mn * 0.13 : o.d;
  if (d > 0.7 && mn > 6) enCres(x, s, enShd(c, o.sk == null ? 0.32 : o.sk), -d * 0.25, -d, o.sa == null ? 0.5 : o.sa);
  if (o.rim === 1 && mn > 14) enCres(x, s, '#ffffff', d * 0.3 + 0.5, d * 0.45 + 0.5, o.ra == null ? 0.35 : o.ra);
  if (o.ln !== 0) { x.lineWidth = enLW * (o.lw || 1); x.strokeStyle = o.lc || enInk(o.oc || c); x.stroke(s.p); }
}
// 금속(투구, 왕관): 대각선 반사 띠
function enMtl(x, s, c, o) {
  o = o || {};
  if (enPass(x, s, o.lw, o.oc || c)) return;
  var g = x.createLinearGradient(s.x0, s.y0, s.x0 + s.w() * 0.7, s.y1);
  g.addColorStop(0, enLit(c, 0.8)); g.addColorStop(0.3, enLit(c, 0.3)); g.addColorStop(0.5, c); g.addColorStop(0.64, enShd(c, 0.18)); g.addColorStop(0.8, enLit(c, 0.25)); g.addColorStop(1, enShd(c, 0.22));
  x.fillStyle = g; x.fill(s.p);
  var d = Math.min(s.w(), s.h()) * 0.12; if (d > 1) enCres(x, s, enShd(o.oc || c, 0.35), -d * 0.3, -d, 0.4);
  if (o.ln !== 0) { x.lineWidth = enLW * (o.lw || 1); x.strokeStyle = enInk(o.oc || c); x.stroke(s.p); }
}
// 빛 (가산 혼합). 외곽선 단계에서는 그리지 않음
function enGlow(x, cx, cy, r, col, a) {
  if (enMode === 2) { enBBbox(x, cx - r, cy - r, cx + r, cy + r, 0); return; }
  if (enMode) return;
  x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy, r, col, a); x.restore();
}
// 반짝 광택 (색칠 단계만)
function enGloss(x, cx, cy, rx, ry, rot, a) {
  if (enMode) return;
  x.save(); x.globalAlpha = a == null ? 0.7 : a; x.fillStyle = '#ffffff';
  x.beginPath(); x.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), rot || 0, 0, Math.PI * 2); x.fill(); x.restore();
}
function enDot(x, cx, cy, r, col, a) {
  r = Math.max(0.4, r);
  if (enMode === 2) { enBBbox(x, cx - r, cy - r, cx + r, cy + r, enOL); return; }
  if (enMode === 1) { x.fillStyle = enInk(col); x.beginPath(); x.arc(cx, cy, r + enOL * 0.7, 0, Math.PI * 2); x.fill(); return; }
  if (a != null) { x.save(); x.globalAlpha = a; } x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); if (a != null) x.restore();
}
function enOv(x, cx, cy, rx, ry, col, rot, o) { var s = enEl(cx, cy, rx, ry, rot); enJF(x, s, col, o || { d: Math.min(rx, ry) * 0.3, rim: 0 }); return s; }
function enBall(x, cx, cy, r, col, oc) { return enOv(x, cx, cy, r, r * 0.95, col, 0, { d: r * 0.3, rim: 0, hi: 0.45, oc: oc }); }
// 둥근 끝 막대 (다리, 손잡이)
function enPill(x, a, b, w0, w1, col, o) {
  var s = shp(), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, an = Math.atan2(ny, nx), P = s.p, r0 = w0 / 2, r1 = w1 / 2;
  P.moveTo(a[0] + nx * r0, a[1] + ny * r0); P.lineTo(b[0] + nx * r1, b[1] + ny * r1);
  P.arc(b[0], b[1], r1, an, an - Math.PI, true); P.lineTo(a[0] - nx * r0, a[1] - ny * r0);
  P.arc(a[0], a[1], r0, an + Math.PI, an, true); P.closePath();
  var m = Math.max(r0, r1); s.ext(Math.min(a[0], b[0]) - m, Math.min(a[1], b[1]) - m); s.ext(Math.max(a[0], b[0]) + m, Math.max(a[1], b[1]) + m);
  enJF(x, s, col, o || { d: Math.min(w0, w1) * 0.22, rim: 0 });
  return s;
}
// 줄기, 막대 같은 선 (외곽선 단계에서는 그 색의 진한 색으로 굵게)
function enLine(x, pts, lw, col) {
  var P = new Path2D(), i; P.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 3) P.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else for (i = 1; i < pts.length; i++) P.lineTo(pts[i][0], pts[i][1]);
  if (enMode === 2) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }); enBBbox(x, x0, y0, x1, y1, lw / 2 + enOL); return; }
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (enMode) { x.lineWidth = lw + enOL * 2; x.strokeStyle = enInk(col); x.stroke(P); return; }
  x.lineWidth = lw; x.strokeStyle = col; x.stroke(P);
  if (lw > 3) { x.save(); x.translate(-lw * 0.18, -lw * 0.18); x.lineWidth = lw * 0.28; x.strokeStyle = 'rgba(255,255,255,0.5)'; x.stroke(P); x.restore(); }
}
// 고리 (냄비 손잡이)
function enRing(x, cx, cy, rx, ry, lw, col, oc) {
  if (enMode === 2) { enBBbox(x, cx - rx, cy - ry, cx + rx, cy + ry, lw / 2 + enOL); return; }
  x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  if (enMode) { x.lineWidth = lw + enOL * 2; x.strokeStyle = enInk(oc || col); x.stroke(); }
  else { x.lineWidth = lw; x.strokeStyle = col; x.stroke(); x.lineWidth = Math.max(0.6, lw * 0.3); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.6); x.stroke(); }
  x.restore();
}
// 잎 (밑동 bx,by 에서 각도 a, 길이 len, 폭 wd)
function enLf(x, bx, by, a, len, wd, col) {
  var tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len, nx = -Math.sin(a) * wd, ny = Math.cos(a) * wd;
  var lf = shp().blob([[bx, by], [lerp(bx, tx, 0.42) + nx, lerp(by, ty, 0.42) + ny], [tx, ty], [lerp(bx, tx, 0.42) - nx, lerp(by, ty, 0.42) - ny]]);
  enJF(x, lf, col, { d: 0, rim: 0, lw: 0.8, hi: 0.35 });
  if (!enMode) { x.strokeStyle = rgba(enInk(col), 0.5); x.lineWidth = enLW * 0.6; x.beginPath(); x.moveTo(bx, by); x.lineTo(lerp(bx, tx, 0.7), lerp(by, ty, 0.7)); x.stroke(); }
  return lf;
}
// 새싹: 줄기 + 잎 두 장 (흔들림 t)
function enSprout(x, bx, by, sz, t, col) {
  col = col || '#5fd46e';
  enLine(x, [[bx, by + sz * 0.15], [bx + sz * 0.05, by - sz * 0.25], [bx + sz * 0.02, by - sz * 0.45]], Math.max(1, sz * 0.13), enShd(col, 0.15));
  enLf(x, bx + sz * 0.02, by - sz * 0.42, -Math.PI / 2 - 0.95 - t, sz * 0.62, sz * 0.24, col);
  enLf(x, bx + sz * 0.02, by - sz * 0.42, -Math.PI / 2 + 0.85 - t, sz * 0.52, sz * 0.21, enLit(col, 0.12));
}
function enFlower(x, cx, cy, r, pet, mid) {
  for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * Math.PI * 0.4; enOv(x, cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.46, r * 0.46, pet, 0, { d: r * 0.1, rim: 0, lw: 0.7 }); }
  enOv(x, cx, cy, r * 0.36, r * 0.36, mid, 0, { d: r * 0.08, rim: 0, lw: 0.7, hi: 0.6 });
}
function enStar(x, cx, cy, r, col, rot) {
  var s = shp(), pts = [];
  for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + (rot || 0) + i * Math.PI / 5, rr = i % 2 ? r * 0.52 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  s.poly(pts); enJF(x, s, col, { d: r * 0.12, rim: 0, lw: 0.8, hi: 0.45 });
  return s;
}
function enHeart(x, hx, hy, k, col) {
  var ht = shp(); ht.p.moveTo(hx, hy + k * 0.9); ht.p.bezierCurveTo(hx - k * 1.3, hy + k * 0.1, hx - k * 0.75, hy - k * 0.95, hx, hy - k * 0.35); ht.p.bezierCurveTo(hx + k * 0.75, hy - k * 0.95, hx + k * 1.3, hy + k * 0.1, hx, hy + k * 0.9); ht.p.closePath(); ht.ext(hx - k * 1.1, hy - k * 0.9); ht.ext(hx + k * 1.1, hy + k * 0.9);
  enJF(x, ht, col, { d: k * 0.2, rim: 0, lw: 0.8 }); enGloss(x, hx - k * 0.45, hy - k * 0.35, k * 0.2, k * 0.12, -0.6, 0.85);
  return ht;
}
// 수정 (육각 기둥, 밑동 bx,by 에서 각도 a 로 길이 L)
function enCrystal(x, bx, by, L, a, col) {
  x.save(); x.translate(bx, by); x.rotate(a);
  var w = L * 0.24, s = shp().poly([[-w, L * 0.1], [-w * 1.05, -L * 0.62], [0, -L], [w * 1.05, -L * 0.62], [w, L * 0.1]]);
  enJF(x, s, col, { d: w * 0.3, rim: 0, hi: 0.6, gx: 0.2, gy: 0.3 });
  if (!enMode) { x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.moveTo(-w * 0.6, L * 0.02); x.lineTo(-w * 0.62, -L * 0.6); x.lineTo(-w * 0.1, -L * 0.88); x.lineTo(-w * 0.15, L * 0.02); x.closePath(); x.fill(); }
  x.restore();
}
// 펄럭이는 띠 (목도리, 두건 꼬리, 망토 끈)
function enRib(x, x0, y0, len, wd, ang, wave, col) {
  var pts = [], n = 6, i;
  for (i = 0; i <= n; i++) { var u = i / n, a = ang + Math.sin(wave + u * 3) * 0.35 * u; pts.push([x0 + Math.cos(a) * len * u, y0 + Math.sin(a) * len * u, wd * (1 - u * 0.4)]); }
  var s = shp(), P = s.p; P.moveTo(pts[0][0], pts[0][1] - pts[0][2] / 2);
  for (i = 1; i <= n; i++) { P.lineTo(pts[i][0], pts[i][1] - pts[i][2] / 2); s.ext(pts[i][0], pts[i][1] - pts[i][2] / 2); }
  P.quadraticCurveTo(pts[n][0] - wd * 0.35, pts[n][1], pts[n][0], pts[n][1] + pts[n][2] / 2);
  for (i = n; i >= 0; i--) { P.lineTo(pts[i][0], pts[i][1] + pts[i][2] / 2); s.ext(pts[i][0], pts[i][1] + pts[i][2] / 2); }
  P.closePath(); s.ext(x0, y0 - wd / 2);
  enJF(x, s, col, { d: wd * 0.2, rim: 0 });
  return s;
}
// 머리 덮개(두건): 타원 (cx,cy,rx,ry) 위쪽 호 a0→a1, 아래 가장자리는 높이 yb 를 지나는 곡선
function enCapS(cx, cy, rx, ry, a0, a1, yb) {
  var s = shp(), P = s.p, x0 = cx + Math.cos(a0) * rx, y0 = cy + Math.sin(a0) * ry, x1 = cx + Math.cos(a1) * rx, y1 = cy + Math.sin(a1) * ry, yc = (yb - (y0 + y1) / 8) / 0.75;
  P.moveTo(x0, y0); P.ellipse(cx, cy, rx, ry, 0, a0, a1, false);
  P.bezierCurveTo(x1 - rx * 0.3, yc, x0 + rx * 0.3, yc, x0, y0); P.closePath();
  s.ext(cx - rx, cy - ry); s.ext(cx + rx, Math.max(y0, y1, yb));
  return s;
}
// 뼈 (리본 매듭, 비녀)
function enBone(x, cx, cy, L, col) {
  enJF(x, shp().rrect(cx - L * 0.42, cy - L * 0.1, L * 0.84, L * 0.2, L * 0.1), col, { d: L * 0.04, rim: 0 });
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (q) { enBall(x, cx + q[0] * L * 0.44, cy + q[1] * L * 0.11, L * 0.14, col); });
}
function enBow(x, cx, cy, s, col) {
  [-1, 1].forEach(function (sd) { enJF(x, shp().blob([[cx, cy], [cx + sd * s * 0.55, cy - s * 0.55], [cx + sd * s * 1.05, cy - s * 0.3], [cx + sd * s * 1.0, cy + s * 0.35], [cx + sd * s * 0.5, cy + s * 0.45]]), sd < 0 ? col : enShd(col, 0.08), { d: s * 0.1, rim: 0 }); });
  enOv(x, cx, cy, s * 0.3, s * 0.32, enShd(col, 0.05), 0, { d: s * 0.06, rim: 0 });
}

// ---------- 얼굴 ----------
// 큰 반짝 눈: 진한 보라 타원, 아래쪽 은은한 색 반사, 큰 흰 반짝이 1 + 작은 것 2
function enEyeO(x, cx, cy, rx, ry, iris) {
  iris = iris || '#a77bff';
  var g = x.createLinearGradient(cx, cy - ry, cx, cy + ry);
  g.addColorStop(0, '#1e0b2c'); g.addColorStop(0.55, '#3b1a56'); g.addColorStop(1, mixc(iris, '#3b1a56', 0.35));
  x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill();
  x.save(); x.clip(); x.fillStyle = rgba(enLit(iris, 0.3), 0.7); x.beginPath(); x.ellipse(cx + rx * 0.1, cy + ry * 1.05, rx * 0.72, ry * 0.42, 0, 0, Math.PI * 2); x.fill(); x.restore();
  x.fillStyle = '#ffffff';
  x.beginPath(); x.ellipse(cx - rx * 0.24, cy - ry * 0.36, rx * 0.5, ry * 0.36, -0.3, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(cx + rx * 0.38, cy + ry * 0.3, rx * 0.2, 0, Math.PI * 2); x.fill();
  if (ry > 3.5) { x.beginPath(); x.arc(cx + rx * 0.46, cy - ry * 0.16, rx * 0.1, 0, Math.PI * 2); x.fill(); }
}
// 감은 눈 (행복한 ∩)
function enShut(x, cx, cy, rx, ry) {
  x.save(); x.strokeStyle = EN_EYEK; x.lineCap = 'round'; x.lineWidth = Math.max(1.2, ry * 0.3);
  x.beginPath(); x.arc(cx, cy + ry * 0.38, rx * 0.95, Math.PI * 1.12, Math.PI * 1.88); x.stroke(); x.restore();
}
function enBlush(x, cx, cy, rx, ry, col, a) {
  a = a == null ? 0.75 : a; x.save(); x.translate(cx, cy); x.scale(1, ry / rx);
  var g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(0.55, rgba(col, a * 0.75)); g.addColorStop(1, rgba(col, 0));
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, Math.PI * 2); x.fill(); x.restore();
}
// 맞을 때 흰 실루엣에 그릴 눈 위치 기록 (색칠 단계에서만, 캔버스 좌표로)
function enEyeRec(x, cx, cy, rx, ry, sd) {
  if (enMode || !x.getTransform) return;
  var m = x.getTransform(), det = m.a * m.d - m.b * m.c;
  EN_EYES.push({ x: m.a * cx + m.c * cy + m.e, y: m.b * cx + m.d * cy + m.f, rx: rx * Math.hypot(m.a, m.b), ry: ry * Math.hypot(m.c, m.d), r: Math.atan2(m.b, m.a), sd: det < 0 ? -sd : sd });
}
// > < 질끈 감은 눈 (sd 1: 왼쪽 눈 '>', -1: 오른쪽 눈 '<')
function enOuch(x, e) {
  var a = e.rx * 0.95, b = e.ry * 0.62, s = e.sd;
  x.save(); x.translate(e.x, e.y); x.rotate(e.r); x.strokeStyle = EN_EYEK; x.lineWidth = Math.max(1.3, e.ry * 0.36); x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(-a * s, -b); x.lineTo(a * s * 0.85, 0); x.lineTo(-a * s, b); x.stroke(); x.restore();
}
// 짧은 눈썹: angry 찡그림, sad 시무룩
function enBrow(x, e1, e2, by, R, t) {
  var d = t === 'angry' ? 1 : -1;
  x.save(); x.strokeStyle = EN_EYEK; x.lineCap = 'round'; x.lineWidth = Math.max(1.2, R * 0.3);
  x.beginPath(); x.moveTo(e1 - R * 0.65, by - d * R * 0.22); x.lineTo(e1 + R * 0.45, by + d * R * 0.2); x.stroke();
  x.beginPath(); x.moveTo(e2 - R * 0.4, by + d * R * 0.18); x.lineTo(e2 + R * 0.5, by - d * R * 0.18); x.stroke();
  x.restore();
}
// 입: w(ω), wf(ω + 덧니), wt(ω + 혀), open(웃으며 벌린 입), tusk(엄니 둘), o(동그란), pout(뿌루퉁), wavy(울먹)
function enMouth(x, t, mx, my, R) {
  var u = R * 0.27;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = EN_EYEK; x.lineWidth = Math.max(1, R * 0.17);
  if (t === 'w' || t === 'wf' || t === 'wt') {
    if (t === 'wt') { x.fillStyle = '#ff6f9f'; x.beginPath(); x.ellipse(mx + u * 0.15, my + u * 0.55, u * 0.62, u * 0.75, 0, 0, Math.PI * 2); x.fill(); x.lineWidth = Math.max(0.8, R * 0.1); x.stroke(); x.lineWidth = Math.max(1, R * 0.17); }
    x.beginPath(); x.arc(mx - u, my - u * 0.2, u, 0.12 * Math.PI, 0.92 * Math.PI); x.moveTo(mx + u * 2, my - u * 0.2 + Math.sin(0.12 * Math.PI) * u); x.arc(mx + u, my - u * 0.2, u, 0.08 * Math.PI, 0.88 * Math.PI); x.stroke();
    if (t === 'wf') { x.fillStyle = '#ffffff'; x.lineWidth = Math.max(0.7, R * 0.08); x.beginPath(); x.moveTo(mx + u * 0.75, my + u * 0.55); x.lineTo(mx + u * 1.55, my + u * 0.5); x.lineTo(mx + u * 1.12, my + u * 1.3); x.closePath(); x.fill(); x.stroke(); }
  } else if (t === 'open') {
    x.beginPath(); x.moveTo(mx - u * 1.3, my - u * 0.4); x.quadraticCurveTo(mx, my - u * 0.1, mx + u * 1.3, my - u * 0.4); x.quadraticCurveTo(mx + u * 1.1, my + u * 1.5, mx, my + u * 1.5); x.quadraticCurveTo(mx - u * 1.1, my + u * 1.5, mx - u * 1.3, my - u * 0.4); x.closePath();
    x.fillStyle = '#8a1d4c'; x.fill(); x.save(); x.clip(); x.fillStyle = '#ff7aa8'; x.beginPath(); x.ellipse(mx + u * 0.15, my + u * 1.45, u * 0.95, u * 0.7, 0, 0, Math.PI * 2); x.fill(); x.restore(); x.stroke();
  } else if (t === 'tusk') {
    x.beginPath(); x.moveTo(mx - u * 1.5, my - u * 0.15); x.quadraticCurveTo(mx, my + u * 1.1, mx + u * 1.5, my - u * 0.15); x.stroke();
    x.fillStyle = '#ffffff'; x.lineWidth = Math.max(0.8, R * 0.1);
    [-1, 1].forEach(function (sd) { var tx = mx + sd * u * 0.95, ty = my + u * 0.42; x.beginPath(); x.moveTo(tx - u * 0.42, ty + u * 0.05); x.quadraticCurveTo(tx - u * 0.3, ty - u * 0.7, tx + sd * u * 0.12, ty - u * 1.25); x.quadraticCurveTo(tx + u * 0.38, ty - u * 0.5, tx + u * 0.42, ty + u * 0.05); x.closePath(); x.fill(); x.stroke(); });
  } else if (t === 'o') {
    x.fillStyle = '#8a1d4c'; x.beginPath(); x.ellipse(mx, my + u * 0.2, u * 0.55, u * 0.68, 0, 0, Math.PI * 2); x.fill(); x.stroke();
  } else if (t === 'pout') {
    x.beginPath(); x.arc(mx, my + u * 0.9, u * 0.95, 1.22 * Math.PI, 1.78 * Math.PI); x.stroke();
  } else if (t === 'wavy') {
    x.beginPath(); x.moveTo(mx - u * 1.2, my); for (var j = 1; j <= 4; j++) x.quadraticCurveTo(mx - u * 1.2 + (j - 0.5) * u * 0.6, my + (j % 2 ? -u * 0.4 : u * 0.4), mx - u * 1.2 + j * u * 0.6, my); x.stroke();
  }
  x.restore();
}
// 얼굴: (fx, fy) 두 눈 가운데, R 눈 세로 반지름. 가까운 눈(왼쪽)이 조금 크고 먼 눈(오른쪽)은 좁게 (3/4 얼굴). sym 이면 두 눈 같게
// o: iris 눈 아래 반사색, gap 눈 사이, ew 눈 가로 비, mouth, mh ms 입 높이와 크기, brow bh 눈썹, blush 볼 색(0 이면 없음), lash 속눈썹
function enFace(x, fx, fy, R, o, blink) {
  if (enMode) return;
  o = o || {};
  var g = R * (o.gap == null ? 1.3 : o.gap), rx = R * (o.ew == null ? 0.8 : o.ew), k2 = o.sym ? 1 : 0.84, e1 = fx - g, e2 = fx + g * (o.sym ? 1 : 0.9), bc = o.blush == null ? '#ff5c9d' : o.blush;
  if (bc) { enBlush(x, e1 - R * 0.42, fy + R * 1.12, R * 0.82, R * 0.45, bc, o.ba); enBlush(x, e2 + R * (o.sym ? 0.42 : 0.5), fy + R * 1.12, R * (o.sym ? 0.82 : 0.62), R * 0.42, bc, o.ba); }
  if (o.lash && !blink) { x.save(); x.strokeStyle = EN_EYEK; x.lineCap = 'round'; x.lineWidth = Math.max(1, R * 0.16); [[e1, -1, 1], [e2, 1, k2]].forEach(function (q) { for (var j = 0; j < 2; j++) { var an = -Math.PI / 2 + q[1] * (1.0 + j * 0.42); x.beginPath(); x.moveTo(q[0] + Math.cos(an) * rx * q[2] * 0.95, fy + Math.sin(an) * R * 0.95); x.lineTo(q[0] + Math.cos(an) * rx * q[2] * 1.5, fy + Math.sin(an) * R * 1.4); x.stroke(); } }); x.restore(); }
  if (blink || o.shut) { enShut(x, e1, fy, rx, R); enShut(x, e2, fy, rx * k2, R * 0.97); }
  else { enEyeO(x, e1, fy, rx, R, o.iris); enEyeO(x, e2, fy, rx * k2, R * (o.sym ? 1 : 0.97), o.iris); }
  if (o.brow) enBrow(x, e1, e2, fy - R * (o.bh || 1.35), R, o.brow);
  if (o.mouth !== 0) enMouth(x, o.mouth || 'w', (e1 + e2) / 2 + R * (o.sym ? 0 : 0.12), fy + R * (o.mh == null ? 1.2 : o.mh), R * (o.ms || 1));
  enEyeRec(x, e1, fy, rx, R, 1); enEyeRec(x, e2, fy, rx * k2, R * 0.97, -1);
}

// ---------- 통통 뛰는 찹쌀떡 몸 ----------
// 찹쌀떡 모양: 바닥 가운데 (cx, by), 폭 w, 높이 h. o.mid 가장 넓은 높이, o.tp 정수리 둥글기, o.bt 바닥 둥글기, o.lean 앞으로 쏠림
function enMoS(cx, by, w, h, o) {
  o = o || {};
  var s = shp(), P = s.p, hw = w / 2, top = by - h, mid = by - h * (o.mid == null ? 0.42 : o.mid), tp = o.tp == null ? 0.56 : o.tp, bt = o.bt == null ? 0.6 : o.bt, ln = w * (o.lean || 0);
  P.moveTo(cx, by);
  P.bezierCurveTo(cx + hw * bt, by, cx + hw, by - h * 0.05, cx + hw, mid);
  P.bezierCurveTo(cx + hw, top + h * 0.2, cx + ln + hw * tp, top, cx + ln, top);
  P.bezierCurveTo(cx + ln - hw * tp, top, cx - hw, top + h * 0.2, cx - hw, mid);
  P.bezierCurveTo(cx - hw, by - h * 0.05, cx - hw * bt, by, cx, by);
  P.closePath(); s.ext(cx - hw, top); s.ext(cx + hw, by);
  return s;
}
// 걷기 8장: [뜀 높이, 가로, 세로, 기울기]  0 웅크림, 1 박차기, 2 오름, 3 꼭대기, 4 내려옴, 5 착지 직전, 6 착지 찌그러짐(눈 깜빡), 7 회복
var EN_HOP = [[0, 1.08, 0.92, 0], [0.34, 0.92, 1.09, 0.06], [0.8, 0.96, 1.05, 0.05], [1, 1.0, 1.0, 0], [0.76, 0.97, 1.03, -0.04], [0.3, 0.95, 1.06, -0.05], [0, 1.14, 0.86, 0], [0, 0.99, 1.01, 0.02]];
// L: col 몸 색, w h 몸 폭 높이(H 배), hop 뜀 높이, sq 찌그러짐, tilt 기울기, es 눈 크기, fxo fyo 얼굴 위치, face 얼굴, fr 발 크기, feet 발 색(0 이면 없음),
//    arms 팔 색(없으면 팔 없음), still 1 이면 멈춘 자세, hops 걷기 8장 표(없으면 EN_HOP)
// 그리는 고리: back(맨 뒤) → 발 둘, 먼 팔 → behind → 몸(shape) → torso → 얼굴 → head → hold → 가까운 팔 → front
function enMo(x, H, p, L) {
  var i = L.still ? 0 : Math.round(p * 8) % 8, hp = L.still ? [0, 1, 1, 0] : (L.hops || EN_HOP)[i], k = L.sq == null ? 1 : L.sq;
  var G = { H: H, p: p, i: i, air: hp[0], lift: hp[0] * H * (L.hop == null ? 0.1 : L.hop), sx: 1 + (hp[1] - 1) * k, sy: 1 + (hp[2] - 1) * k, tl: hp[3] * (L.tilt == null ? 1 : L.tilt), blink: i === 6 && L.blink !== 0 };
  var fr = H * (L.fr == null ? 0.075 : L.fr);
  G.fr = fr; G.w = H * L.w; G.h = H * L.h; G.cx = H * (L.cx || 0); G.by = -fr * (L.fo == null ? 1.1 : L.fo); G.top = G.by - G.h;
  G.fx = G.cx + G.w * (L.fxo == null ? 0.12 : L.fxo); G.fy = G.by - G.h * (L.fyo == null ? 0.37 : L.fyo); G.R = G.h * (L.es == null ? 0.175 : L.es);
  var cx = G.cx, by = G.by, fc = L.feet == null ? enShd(L.col, 0.12) : L.feet, ac = L.arms || 0;
  // 발: 땅에서는 납작, 공중에서는 살짝 늘어뜨림. 팔: 꼭대기에서 번쩍(만세), 착지 때 내림
  var fdy = G.air * fr * 0.35, fsp = (G.sx - 1) * G.w * 0.6, up = G.air * 0.9 - (i === 6 ? 0.35 : 0);
  G.ff = [cx - G.w * 0.2 - fsp, -fr * 0.95 + fdy]; G.fn = [cx + G.w * 0.2 + fsp, -fr * 0.95 + fdy * 1.2];
  G.an = [cx + G.w * 0.47, by - G.h * (0.26 + up * 0.14)]; G.af = [cx - G.w * 0.46, by - G.h * (0.3 + up * 0.14)]; G.ar = G.w * (L.ar || 0.085); G.up = up;
  x.save();
  x.translate(cx, -G.lift); x.rotate(G.tl); x.scale(G.sx, G.sy); x.translate(-cx, 0);
  if (L.back) L.back(x, G);
  if (fc) { enOv(x, G.ff[0], G.ff[1], fr * 1.25, fr, enShd(fc, 0.15), 0, { d: fr * 0.35, rim: 0, hi: 0.3 }); enOv(x, G.fn[0], G.fn[1], fr * 1.3, fr, fc, 0, { d: fr * 0.35, rim: 0, hi: 0.35 }); }
  if (ac && L.farArm !== 0) enOv(x, G.af[0], G.af[1], G.ar * 1.05, G.ar * 0.85, enShd(ac, 0.12), -0.5 - up * 0.6, { d: G.ar * 0.3, rim: 0 });
  if (L.behind) L.behind(x, G);
  var body = L.shape ? L.shape(G) : enMoS(cx, by, G.w, G.h, L.so);
  G.body = body;
  enJF(x, body, L.col, { d: G.h * 0.1, hi: L.hi, rim: 1 });
  if (!enMode) { enGloss(x, cx - G.w * 0.23, G.top + G.h * 0.2, G.w * 0.12, G.h * 0.065, -0.6, 0.8); enGloss(x, cx - G.w * 0.33, G.top + G.h * 0.34, G.w * 0.035, G.w * 0.035, 0, 0.75); }
  if (L.torso) L.torso(x, G, body);
  if (L.face !== 0) enFace(x, G.fx, G.fy, G.R, L.face, G.blink);
  if (L.head) L.head(x, G);
  if (L.hold) L.hold(x, G);
  if (ac && L.nearArm !== 0) enOv(x, G.an[0], G.an[1], G.ar * 1.05, G.ar * 0.85, ac, 0.5 + up * 0.6, { d: G.ar * 0.3, rim: 0 });
  if (L.front) L.front(x, G);
  x.restore();
  return G;
}
// 망토: 등 위쪽에서 땅까지 뒤로 퍼짐, 밑단은 물결 (t 펄럭임)
function enCape(G, t) {
  var s = shp(), P = s.p, x0 = G.cx + G.w * 0.05, y0 = G.top + G.h * 0.22, yb = G.by + G.fr * 0.45, xl = G.cx - G.w * (0.86 + t);
  P.moveTo(x0, y0); P.quadraticCurveTo(G.cx - G.w * 0.45, G.top + G.h * 0.05, G.cx - G.w * (0.62 + t * 0.5), G.by - G.h * 0.45); P.quadraticCurveTo(xl + G.w * 0.05, G.by - G.h * 0.15, xl, yb);
  for (var j = 0; j < 3; j++) { var xa = lerp(xl, G.cx - G.w * 0.1, j / 3), xb = lerp(xl, G.cx - G.w * 0.1, (j + 1) / 3); P.quadraticCurveTo((xa + xb) / 2, yb + G.h * 0.07, xb, yb - (j === 2 ? G.h * 0.08 : 0)); }
  P.closePath(); s.ext(xl, G.top); s.ext(x0, yb + G.h * 0.07);
  return s;
}
// 동그란 귀 둘 (몸 뒤)
function enRoundEars(x, G, col, y, k) {
  [[-1, 1], [1, 0.85]].forEach(function (e) { var sd = e[0], ex = G.cx + sd * G.w * 0.38, ey = G.top + G.h * y; enOv(x, ex, ey, G.w * 0.12 * e[1] * k, G.w * 0.11 * e[1] * k, sd < 0 ? col : enShd(col, 0.08)); if (!enMode) enDot(x, ex + sd * G.w * 0.01, ey + G.h * 0.01, G.w * 0.055 * e[1] * k, '#ff8fb0', 0.9); });
}

// ---------- 적마다 그리기 ----------
var EN_DRAW = {};
// 고블린: 레몬 젤리, 옆으로 뾰족한 귀, 머리 새싹, 개구쟁이 덧니 하나
EN_DRAW.goblin = { f: function (x, H, p) {
  var col = '#ffe04a';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.76, h: 0.7, hop: 0.13, face: { iris: '#ff8fc8', mouth: 'wf' },
    behind: function (x, G) {
      var fl = (G.air - 0.4) * 0.12 + (G.i === 6 ? -0.08 : 0);
      [[-1, 1], [1, 0.84]].forEach(function (e) {
        var sd = e[0], k = e[1], bx = G.cx + sd * G.w * 0.34, by = G.by - G.h * 0.56, tx = bx + sd * G.w * 0.44 * k, ty = by - G.h * (0.1 + fl);
        var ear = shp().blob([[bx, by - G.h * 0.15], [lerp(bx, tx, 0.6), lerp(by, ty, 0.6) - G.h * 0.06], [tx, ty], [lerp(bx, tx, 0.55), lerp(by, ty, 0.55) + G.h * 0.07], [bx, by + G.h * 0.13]]);
        enJF(x, ear, sd < 0 ? col : enShd(col, 0.08), { d: 0, rim: 0 });
        if (!enMode) { var inn = shp().blob([[bx + sd * G.w * 0.05, by - G.h * 0.06], [lerp(bx, tx, 0.78), lerp(by, ty, 0.78)], [bx + sd * G.w * 0.05, by + G.h * 0.06]]); x.fillStyle = 'rgba(255,125,175,0.85)'; x.fill(inn.p); }
      });
    },
    head: function (x, G) { enSprout(x, G.cx - G.w * 0.03, G.top + G.h * 0.05, G.H * 0.21, (G.air - 0.4) * 0.3); }
  });
} };
// 오크: 복숭아 찹쌀떡, 작은 엄니 둘, 동그란 귀, 뼈 비녀 꽂은 산딸기색 상투
EN_DRAW.orc = { f: function (x, H, p) {
  var col = '#ffb48e', hair = '#e0507a';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.84, h: 0.74, hop: 0.09, sq: 0.9, fyo: 0.36, face: { iris: '#ff9a7a', mouth: 'tusk', mh: 1.25 },
    behind: function (x, G) { enRoundEars(x, G, col, 0.2, 1); },
    head: function (x, G) {
      var bx = G.cx - G.w * 0.06, by = G.top + G.h * 0.02, r = G.w * 0.15, t = (G.air - 0.4) * 0.12;
      x.save(); x.translate(bx, by); x.rotate(t);
      enOv(x, 0, -r * 0.62, r, r * 0.88, hair, 0, { d: r * 0.25 });
      enLine(x, [[-r * 1.35, -r * 0.4], [r * 1.35, -r * 0.85]], r * 0.42, '#fff8ee');
      enBall(x, -r * 1.38, -r * 0.5, r * 0.26, '#fff8ee'); enBall(x, -r * 1.3, -r * 0.24, r * 0.26, '#fff8ee'); enBall(x, r * 1.38, -r * 0.95, r * 0.26, '#fff8ee'); enBall(x, r * 1.42, -r * 0.68, r * 0.26, '#fff8ee');
      x.restore();
    }
  });
} };
// 다이어울프: 하늘색 아기 강아지, 큰 머리 작은 몸, 크림 주둥이, 세모 귀, 복슬 꼬리, 짧은 네 발, 혀 쏙
EN_DRAW.wolf = { f: function (x, H, p) {
  var col = '#7ccaff', cream = '#fff4e2', i = Math.round(p * 8) % 8, hp = EN_HOP[i], air = hp[0];
  var lift = air * H * 0.12, sx = 1 + (hp[1] - 1) * 0.8, sy = 1 + (hp[2] - 1) * 0.8, tl = -hp[3] * 1.6, fr = H * 0.065, reach = (air - 0.3) * H * 0.07;
  EN_ONE = enInk(col);
  x.save(); x.translate(0, -lift); x.rotate(tl); x.scale(sx, sy);
  function foot(fx, near) { var fy = -fr + air * fr * 0.5; enOv(x, fx, fy, fr * 1.25, fr, near ? col : enShd(col, 0.2), 0, { d: fr * 0.35, rim: 0, hi: 0.3 }); if (near && !enMode) enDot(x, fx + fr * 0.45, fy + fr * 0.12, fr * 0.32, '#ffc2d8', 0.95); }
  // 꼬리 (살랑살랑)
  var ta = -2.35 + Math.sin(p * Math.PI * 4) * 0.42, bx = -H * 0.36, by = -H * 0.33, L = H * 0.3, tx = bx + Math.cos(ta) * L, ty = by + Math.sin(ta) * L, nx = -Math.sin(ta), ny = Math.cos(ta);
  var tail = shp().blob([[bx + nx * L * 0.16, by + ny * L * 0.16], [lerp(bx, tx, 0.45) + nx * L * 0.38, lerp(by, ty, 0.45) + ny * L * 0.38], [tx + nx * L * 0.1, ty + ny * L * 0.1], [tx - nx * L * 0.06, ty - ny * L * 0.06], [lerp(bx, tx, 0.55) - nx * L * 0.28, lerp(by, ty, 0.55) - ny * L * 0.28], [bx - nx * L * 0.14, by - ny * L * 0.14]]);
  enJF(x, tail, col, { d: L * 0.1, rim: 0 });
  if (!enMode) { x.save(); x.clip(tail.p); x.fillStyle = cream; x.beginPath(); x.ellipse(tx, ty, L * 0.36, L * 0.3, ta, 0, Math.PI * 2); x.fill(); x.restore(); }
  foot(-H * 0.2 - reach, false); foot(H * 0.17 + reach, false);
  // 몸
  var body = shp().blob([[-H * 0.44, -H * 0.2], [-H * 0.4, -H * 0.44], [-H * 0.12, -H * 0.5], [H * 0.16, -H * 0.42], [H * 0.2, -H * 0.12], [H * 0.06, -H * 0.03], [-H * 0.3, -H * 0.03]]);
  enJF(x, body, col, { d: H * 0.04 });
  if (!enMode) { x.save(); x.clip(body.p); x.fillStyle = cream; x.beginPath(); x.ellipse(-H * 0.1, -H * 0.04, H * 0.24, H * 0.1, 0, 0, Math.PI * 2); x.fill(); x.restore(); enGloss(x, -H * 0.28, -H * 0.4, H * 0.07, H * 0.03, -0.4, 0.7); }
  foot(-H * 0.3 - reach, true);
  // 귀 (머리 뒤)
  var hx = H * 0.14, hy = -H * 0.5, hrx = H * 0.33, hry = H * 0.29, ef = i === 6 ? 0.1 : -air * 0.08;
  [[-0.42, 1], [0.32, 0.88]].forEach(function (e, j) {
    var ex = hx + e[0] * hrx, ey = hy - hry * 0.55, k = e[1], tx2 = ex - hrx * (0.12 + ef), ty2 = ey - hry * 0.95 * k;
    var ear = shp().blob([[ex - hrx * 0.36 * k, ey + hry * 0.2], [tx2, ty2], [ex + hrx * 0.34 * k, ey + hry * 0.12]]);
    enJF(x, ear, j ? enShd(col, 0.1) : col, { d: 0, rim: 0 });
    if (!enMode) { var inn = shp().blob([[ex - hrx * 0.16 * k, ey + hry * 0.08], [lerp(ex, tx2, 0.75), lerp(ey, ty2, 0.75)], [ex + hrx * 0.16 * k, ey + hry * 0.04]]); x.fillStyle = 'rgba(255,140,185,0.9)'; x.fill(inn.p); }
  });
  // 머리
  var head = enMoS(hx, hy + hry, hrx * 2, hry * 2, { mid: 0.42, tp: 0.62, bt: 0.7 });
  enJF(x, head, col, { d: hry * 0.16, rim: 1 });
  if (!enMode) { enGloss(x, hx - hrx * 0.45, hy - hry * 0.55, hrx * 0.22, hry * 0.1, -0.6, 0.8); enGloss(x, hx - hrx * 0.68, hy - hry * 0.3, hrx * 0.06, hrx * 0.06, 0, 0.75); }
  var mx = hx + hrx * 0.62, my = hy + hry * 0.42;
  enOv(x, mx, my, hrx * 0.38, hry * 0.3, cream, 0, { d: hry * 0.06, rim: 0, hi: 0.3 });
  enFace(x, hx + hrx * 0.12, hy - hry * 0.02, hry * 0.3, { iris: '#ffa0d0', mouth: 0, gap: 1.25 }, i === 6);
  if (!enMode) {
    var nx2 = mx + hrx * 0.22, ny2 = my - hry * 0.13, r = hry * 0.11;
    x.fillStyle = EN_EYEK; x.beginPath(); x.ellipse(nx2, ny2, r * 1.2, r * 0.9, 0, 0, Math.PI * 2); x.fill(); enGloss(x, nx2 - r * 0.35, ny2 - r * 0.4, r * 0.42, r * 0.24, 0, 0.9);
    enMouth(x, 'wt', mx - hrx * 0.02, my + hry * 0.05, hry * 0.26);
  }
  foot(H * 0.06 + reach, true);
  x.restore();
} };
// 철갑병: 라벤더 찹쌀떡, 양옆 손잡이 달린 은색 냄비 투구, 분홍 깃털
EN_DRAW.knight = { f: function (x, H, p) {
  var col = '#c2adff', steel = '#e4ebf7', so = '#8fa3d6';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.82, h: 0.74, hop: 0.07, sq: 0.8, fyo: 0.3, es: 0.165, face: { iris: '#8cc4ff', mouth: 'w', mh: 1.15 },
    behind: function (x, G) {
      var t = Math.sin(G.p * Math.PI * 2) * 0.12 - G.air * 0.12, L = G.h * 0.5;
      x.save(); x.translate(G.cx - G.w * 0.08, G.top + G.h * 0.02); x.rotate(-0.6 + t);
      enJF(x, shp().blob([[L * 0.08, L * 0.05], [-L * 0.24, -L * 0.42], [-L * 0.1, -L * 0.98], [L * 0.24, -L * 0.6], [L * 0.2, -L * 0.1]]), '#ff6fae', { d: L * 0.08, rim: 0 });
      if (!enMode) { x.strokeStyle = rgba(enInk('#ff6fae'), 0.5); x.lineWidth = enLW * 0.7; x.beginPath(); x.moveTo(L * 0.04, 0); x.quadraticCurveTo(-L * 0.05, -L * 0.5, -L * 0.08, -L * 0.88); x.stroke(); }
      x.restore();
    },
    head: function (x, G) {
      var cx = G.cx, hw = G.w * 1.0, ht = G.top - G.h * 0.07, hb = G.fy - G.R * 1.2, hh = hb - ht;
      [[-1, 1], [1, 0.9]].forEach(function (e) { enRing(x, cx + e[0] * hw * 0.53, ht + hh * 0.45, G.w * 0.085 * e[1], G.h * 0.075 * e[1], G.w * 0.04, steel, so); });
      enMtl(x, shp().rrect(cx - hw / 2, ht, hw, hh, Math.min(hw, hh) * 0.32), steel, { oc: so });
      enMtl(x, shp().rrect(cx - hw * 0.55, hb - G.h * 0.075, hw * 1.1, G.h * 0.105, G.h * 0.05), enShd(steel, 0.06), { oc: so });
      enBall(x, cx - G.w * 0.02, ht - G.h * 0.02, G.w * 0.065, steel, so);
      enGloss(x, cx - hw * 0.3, ht + hh * 0.42, hw * 0.05, hh * 0.24, 0.15, 0.85); enGloss(x, cx - hw * 0.17, ht + hh * 0.22, hw * 0.022, hh * 0.08, 0.15, 0.7);
    }
  });
} };
// 흡혈 박쥐: 분홍 솜뭉치, 작은 박쥐 날개, 뾰족 귀, 덧니 하나
EN_DRAW.bat = { n: 6, f: function (x, H, p) {
  var f = Math.sin(p * Math.PI * 2), col = '#ff94cc', wing = '#ff5fae', cy = -H * 0.4 - f * H * 0.03, r = H * 0.27;
  EN_ONE = enInk(col);
  [[1, 0.85], [-1, 1]].forEach(function (e) {
    var sd = e[0], k = e[1];
    x.save(); x.translate(sd * r * 0.62, cy - r * 0.05); x.scale(sd, 1); x.rotate(-f * 0.8 + 0.05);
    var L = H * 0.36 * k, wg = shp(), P = wg.p;
    P.moveTo(0, -r * 0.3); P.quadraticCurveTo(L * 0.45, -L * 0.62, L, -L * 0.42); P.quadraticCurveTo(L * 0.95, -L * 0.05, L * 0.78, L * 0.12);
    P.quadraticCurveTo(L * 0.66, -L * 0.04, L * 0.5, L * 0.16); P.quadraticCurveTo(L * 0.36, 0, L * 0.18, L * 0.2); P.quadraticCurveTo(L * 0.06, L * 0.1, 0, r * 0.25); P.closePath();
    wg.ext(0, -L * 0.62); wg.ext(L, L * 0.2); wg.ext(0, -r * 0.3); wg.ext(0, r * 0.25);
    enJF(x, wg, sd > 0 ? enShd(wing, 0.1) : wing, { d: L * 0.06, rim: 0 });
    if (!enMode) { x.strokeStyle = rgba(enInk(wing), 0.6); x.lineWidth = enLW * 0.8; x.beginPath(); x.moveTo(L * 0.06, 0); x.lineTo(L * 0.78, L * 0.1); x.moveTo(L * 0.08, -L * 0.04); x.lineTo(L * 0.5, L * 0.14); x.stroke(); }
    x.restore();
  });
  [[-0.38, 1], [0.32, 0.86]].forEach(function (e, i) { var bx = e[0] * r, by = cy - r * 0.62, tx = bx + r * (i ? 0.12 : -0.16), ty = by - r * 0.62 * e[1]; enJF(x, shp().blob([[bx - r * 0.3, by + r * 0.18], [tx, ty], [bx + r * 0.3, by + r * 0.18]]), i ? enShd(col, 0.08) : col, { d: 0, rim: 0 }); if (!enMode) { var inn = shp().blob([[bx - r * 0.13, by + r * 0.08], [lerp(bx, tx, 0.72), lerp(by, ty, 0.72)], [bx + r * 0.15, by + r * 0.08]]); x.fillStyle = 'rgba(255,90,160,0.75)'; x.fill(inn.p); } });
  [[-0.32, 0], [0.24, 1]].forEach(function (e) { enOv(x, e[0] * r, cy + r * 0.93, r * 0.17, r * 0.14, e[1] ? enShd(col, 0.15) : enShd(col, 0.25)); });
  var pts = [], n = 18; for (var i = 0; i < n; i++) { var an = i / n * Math.PI * 2, rr = r * (i % 2 ? 0.95 : 1.02); pts.push([Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.96]); }
  var body = shp().blob(pts); enJF(x, body, col, { d: r * 0.16, rim: 1 });
  if (!enMode) { x.save(); x.clip(body.p); x.fillStyle = rgba(enLit(col, 0.55), 0.9); x.beginPath(); x.ellipse(r * 0.15, cy + r * 0.7, r * 0.55, r * 0.34, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
  enGloss(x, -r * 0.42, cy - r * 0.5, r * 0.22, r * 0.12, -0.6, 0.8); enGloss(x, -r * 0.62, cy - r * 0.24, r * 0.06, r * 0.06, 0, 0.75);
  enFace(x, r * 0.14, cy + r * 0.08, r * 0.36, { iris: '#ff6fb8', mouth: 'wf', gap: 1.2 });
} };
// 그림자 추적자: 보라 반투명 젤리(속 공기방울), 남색 닌자 두건과 매듭 꼬리, 분홍 목도리, 찡그린 눈썹
EN_DRAW.stalker = { f: function (x, H, p) {
  var col = '#a88eff', hood = '#4b3fa6', scarf = '#ff6aae';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.76, h: 0.74, hop: 0.11, fyo: 0.44, es: 0.16, hi: 0.62, face: { iris: '#ff9ad8', mouth: 0, brow: 'angry', bh: 1.2 },
    back: function (x, G) {
      var wv = G.p * Math.PI * 4, kx = G.cx - G.w * 0.38, ky = G.top + G.h * 0.34;
      enRib(x, kx, ky, G.H * 0.3, G.H * 0.07, Math.PI * 0.96 - G.air * 0.2, wv, hood);
      enRib(x, kx, ky + G.H * 0.03, G.H * 0.22, G.H * 0.06, Math.PI * 0.8 - G.air * 0.15, wv + 1.4, enShd(hood, 0.15));
      enRib(x, G.cx - G.w * 0.38, G.fy + G.R * 1.7, G.H * 0.25, G.H * 0.075, Math.PI * 0.88 - G.air * 0.15, wv + 0.7, scarf);
    },
    torso: function (x, G, bs) {
      if (enMode) return;
      x.save(); x.clip(bs.p);
      [[-0.2, 0.2, 0.05], [-0.3, 0.32, 0.03], [0.12, 0.1, 0.03]].forEach(function (b) { x.fillStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.arc(G.cx + b[0] * G.w, G.by - b[1] * G.h, b[2] * G.w, 0, Math.PI * 2); x.fill(); });
      var sy = G.fy + G.R * 1.75, bw = G.R * 0.9, band = shp();
      band.p.moveTo(G.cx - G.w, sy - bw * 0.45); band.p.quadraticCurveTo(G.cx, sy + bw * 0.25, G.cx + G.w, sy - bw * 0.6); band.p.lineTo(G.cx + G.w, sy + bw * 0.55); band.p.quadraticCurveTo(G.cx, sy + bw * 1.35, G.cx - G.w, sy + bw * 0.6); band.p.closePath(); band.ext(G.cx - G.w, sy - bw); band.ext(G.cx + G.w, sy + bw * 1.4);
      enJF(x, band, scarf, { d: bw * 0.2, rim: 0 });
      x.restore();
    },
    head: function (x, G) {
      var hd = enCapS(G.cx + G.w * 0.01, G.by - G.h * 0.5, G.w * 0.535, G.h * 0.535, Math.PI + 0.12, Math.PI * 2 - 0.12, G.fy - G.R * 1.45);
      enJF(x, hd, hood, { d: G.h * 0.06 });
      enGloss(x, G.cx - G.w * 0.2, G.top + G.h * 0.14, G.w * 0.1, G.h * 0.05, -0.5, 0.6);
      enStar(x, G.cx + G.w * 0.14, G.fy - G.R * 2.05, G.R * 0.36, '#ffe066');
    }
  });
} };
// 오크 주술사: 귤색 찹쌀떡, 잎 깃털 머리장식, 작은 엄니, 하트 보석 지팡이(치유)
EN_DRAW.shaman = { f: function (x, H, p) {
  var col = '#ffa640', stick = '#a6e07c', gem = '#ff6f9f';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.8, h: 0.72, hop: 0.08, fyo: 0.37, arms: col, nearArm: 0, face: { iris: '#7fe6b0', mouth: 'tusk' },
    back: function (x, G) {
      var t = (G.air - 0.4) * 0.08, lx = G.cx - G.w * 0.06, ly = G.top + G.h * 0.16;
      [[-2.55, '#4fcf6a', 0.95], [-2.12, '#ffe066', 1.08], [-1.68, '#ff8fc0', 1.02], [-1.25, '#6fdc86', 0.9]].forEach(function (l, i) { enLf(x, lx, ly, l[0] + t * (i - 1.5), G.h * 0.52 * l[2], G.h * 0.12, l[1]); });
      var hx = G.af[0], hy = G.af[1], tx = hx - G.w * 0.05, ty = G.top - G.h * 0.3 + Math.sin(G.p * Math.PI * 2) * G.h * 0.02;
      enLine(x, [[hx + G.w * 0.05, G.by - G.fr * 0.2], [tx, ty]], G.w * 0.075, stick);
      enLf(x, tx, ty + G.h * 0.07, -0.35, G.h * 0.2, G.h * 0.07, '#5fd46e'); enLf(x, tx, ty + G.h * 0.07, -2.75, G.h * 0.17, G.h * 0.06, '#5fd46e');
      enGlow(x, tx, ty - G.h * 0.05, G.h * 0.34, '#ff9ac8', 0.55);
      enHeart(x, tx, ty - G.h * 0.05, G.h * 0.14, gem);
    }
  });
} };
// 새끼 거미 (위에서 본 모습, 진행 방향으로 돌려 그림): 크림 솜뭉치, 짧고 뭉툭한 분홍 다리 여덟, 앞쪽 얼굴(아래로 갈 때 바로 보임)
// 그리는 쪽에서 기준점 높이를 0.75배로 줄여 돌리므로, 몸 가운데를 기준점 위 R/3에 둠
function enSpider(x, H, p, o) {
  var R = H * 0.46, cy = -R / 3, a = p * Math.PI * 2, i = Math.round(p * 8) % 8, rb = R * (o.rb || 0.7), lw = o.lw || 1;
  EN_ONE = o.ink;
  if (o.back) o.back(x, cy, rb);
  // 다리: 양옆에만 넷씩, 짧고 통통하게 (앞 둘은 앞으로, 뒤 둘은 뒤로 살짝 굽음)
  for (var sd = -1; sd <= 1; sd += 2) for (var j = 0; j < 4; j++) {
    var ph = a + (j % 2) * Math.PI + (sd > 0 ? Math.PI : 0), th = sd * ([1.02, 1.36, 1.72, 2.06][j] + Math.sin(ph) * 0.1), bend = sd * (j < 2 ? -0.6 : 0.6);
    var c = sd < 0 ? o.leg : enShd(o.leg, 0.1), k0 = [Math.cos(th) * rb * 0.7, cy + Math.sin(th) * rb * 0.7], k1 = [Math.cos(th) * (rb + R * 0.13), cy + Math.sin(th) * (rb + R * 0.13)];
    var k2 = [k1[0] + Math.cos(th + bend) * R * 0.13 * lw, k1[1] + Math.sin(th + bend) * R * 0.13 * lw];
    enPill(x, k0, k1, R * 0.15 * lw, R * 0.14 * lw, c);
    enPill(x, k1, k2, R * 0.14 * lw, R * 0.13 * lw, c);
    if (!enMode) enDot(x, k2[0], k2[1], R * 0.05 * lw, o.tip || enLit(o.leg, 0.4), 0.9);
  }
  var pts = [], n = 16; for (var k = 0; k < n; k++) { var an = k / n * Math.PI * 2, rr = rb * (k % 2 ? 0.96 : 1.02); pts.push([Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.96]); }
  var body = shp().blob(pts); enJF(x, body, o.body, { d: rb * 0.16, gx: 0.3, gy: 0.3, rim: 1 });
  enGloss(x, -rb * 0.42, cy - rb * 0.45, rb * 0.22, rb * 0.12, -0.6, 0.8); enGloss(x, -rb * 0.62, cy - rb * 0.15, rb * 0.06, rb * 0.06, 0, 0.75);
  if (o.mark) o.mark(x, -rb * 0.52, cy, rb);
  x.save(); x.translate(rb * 0.22, cy); x.rotate(-Math.PI / 2);
  if (o.crown) o.crown(x, rb);
  enFace(x, 0, 0, rb * 0.25, { iris: o.iris, mouth: o.mouth || 'w', sym: 1, gap: 1.3, lash: o.lash, mh: 1.25 }, i === 6);
  x.restore();
}
EN_DRAW.spider = { top: 1, f: function (x, H, p) {
  enSpider(x, H, p, { body: '#fff1d4', leg: '#ff92c2', iris: '#ff8fc8', ink: '#c0508a', mouth: 'wf',
    back: function (x, cy, rb) { x.save(); x.translate(-rb * 0.92, cy); x.rotate(-Math.PI / 2); enBow(x, 0, 0, rb * 0.3, '#ff8fc8'); x.restore(); } });
} };
// 해골 병사: 흰 마시멜로, 연보라 눈두덩, 하트 콧구멍, 머리에 분홍 리본 묶은 뼈
EN_DRAW.skeleton = { f: function (x, H, p) {
  var col = '#fffaf3', lav = '#d6c8ff';
  EN_ONE = '#5d4ca8';
  enMo(x, H, p, {
    col: col, w: 0.75, h: 0.72, hop: 0.11, es: 0.17, hi: 0.3, face: { iris: '#b8a2ff', mouth: 'w', mh: 1.6, blush: '#ff8fc0' },
    torso: function (x, G) {
      if (enMode) return;
      var e1 = G.fx - G.R * 1.3, e2 = G.fx + G.R * 1.17;
      x.fillStyle = rgba(lav, 0.55); x.beginPath(); x.ellipse(e1, G.fy + G.R * 0.05, G.R * 1.2, G.R * 1.3, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(e2, G.fy + G.R * 0.05, G.R * 1.02, G.R * 1.26, 0, 0, Math.PI * 2); x.fill();
    },
    head: function (x, G) {
      if (!enMode) { var nx = G.fx + G.R * 0.04, ny = G.fy + G.R * 1.08, k = G.R * 0.26; x.fillStyle = '#6a58b0'; x.beginPath(); x.moveTo(nx, ny + k * 0.9); x.bezierCurveTo(nx - k * 1.3, ny + k * 0.1, nx - k * 0.75, ny - k * 0.95, nx, ny - k * 0.35); x.bezierCurveTo(nx + k * 0.75, ny - k * 0.95, nx + k * 1.3, ny + k * 0.1, nx, ny + k * 0.9); x.fill(); }
      x.save(); x.translate(G.cx - G.w * 0.2, G.top + G.h * 0.1); x.rotate(-0.5 + (G.air - 0.4) * 0.1);
      enBone(x, 0, 0, G.w * 0.4, col); enBow(x, 0, 0, G.w * 0.12, '#ff8fc0');
      x.restore();
    }
  });
} };
// 트롤: 큰 민트 이끼 찹쌀떡, 동그란 분홍 코, 머리에 새싹과 꽃, 이끼 얼룩
EN_DRAW.troll = { f: function (x, H, p) {
  var col = '#7fe2a8', moss = '#43c078', nose = '#ffa3bb';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.88, h: 0.78, hop: 0.05, sq: 0.7, fyo: 0.47, es: 0.14, fr: 0.07, face: { iris: '#6fc8ff', mouth: 'wt', mh: 2.05, gap: 1.5 },
    torso: function (x, G, bs) {
      if (enMode) return;
      x.save(); x.clip(bs.p); x.fillStyle = rgba(moss, 0.5);
      [[-0.3, 0.88, 0.22, 0.1], [-0.44, 0.64, 0.12, 0.08], [0.12, 0.96, 0.16, 0.07], [0.42, 0.7, 0.08, 0.06]].forEach(function (m) { x.beginPath(); x.ellipse(G.cx + m[0] * G.w, G.by - m[1] * G.h, m[2] * G.w, m[3] * G.h, -0.3, 0, Math.PI * 2); x.fill(); });
      x.fillStyle = rgba(enLit(col, 0.6), 0.75); x.beginPath(); x.ellipse(G.cx + G.w * 0.06, G.by - G.h * 0.1, G.w * 0.32, G.h * 0.15, 0, 0, Math.PI * 2); x.fill();
      x.restore();
    },
    head: function (x, G) {
      enOv(x, G.fx + G.R * 0.12, G.fy + G.R * 1.2, G.R * 0.7, G.R * 0.55, nose, 0, { d: G.R * 0.15, rim: 0, hi: 0.55 });
      enSprout(x, G.cx - G.w * 0.08, G.top + G.h * 0.05, G.H * 0.25, (G.air - 0.4) * 0.25, '#4fcf6a');
      enFlower(x, G.cx + G.w * 0.18, G.top + G.h * 0.07, G.h * 0.075, '#ff8fc0', '#ffe066');
    }
  });
} };
// 골렘: 청록 사탕 돌(깎인 면, 설탕 반짝이), 머리에 사탕 수정. 작은 자갈 정령은 새싹
// 둥근 모서리 다각형 (깎은 돌)
function enRPoly(pts, r) {
  var s = shp(), P = s.p, n = pts.length, m0 = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
  P.moveTo(m0[0], m0[1]);
  for (var i = 0; i < n; i++) { var a = pts[i], b = pts[(i + 1) % n]; P.arcTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, r); s.ext(a[0], a[1]); }
  P.closePath(); return s;
}
function enGolem(x, H, p, t) {
  var big = t === 'L', mid = t === 'M', col = '#45d0c8', i = Math.round(p * 8) % 8, hp = EN_HOP[i], k = big ? 0.55 : mid ? 0.75 : 1, hop = H * (big ? 0.035 : mid ? 0.06 : 0.11);
  var lift = hp[0] * hop, sx = 1 + (hp[1] - 1) * k, sy = 1 + (hp[2] - 1) * k, fr = H * 0.075, w = H * (big ? 0.9 : mid ? 0.82 : 0.84), h = H * (big ? 0.74 : mid ? 0.7 : 0.6), by = -fr * 1.05, top = by - h, cy = by - h * 0.5;
  EN_ONE = enInk(col);
  x.save(); x.translate(0, -lift); x.rotate(hp[3] * 0.6); x.scale(sx, sy);
  var up = hp[0] * 0.1 - (i === 6 ? 0.06 : 0);
  enOv(x, -w * 0.22, -fr * 0.95 + hp[0] * fr * 0.3, fr * 1.35, fr, enShd(col, 0.25)); enOv(x, w * 0.22, -fr * 0.95 + hp[0] * fr * 0.35, fr * 1.4, fr, enShd(col, 0.12));
  if (!(big || mid)) { } else enJF(x, enRPoly([[-w * 0.6, by - h * (0.42 + up)], [-w * 0.46, by - h * (0.56 + up)], [-w * 0.36, by - h * (0.38 + up)], [-w * 0.5, by - h * (0.24 + up)]], w * 0.04), enShd(col, 0.2), { d: w * 0.03, rim: 0 });
  if (big) { enCrystal(x, -w * 0.2, top + h * 0.16, h * 0.36, -0.4, '#ff8fc8'); enCrystal(x, w * 0.03, top + h * 0.1, h * 0.46, 0.04, '#ffe066'); enCrystal(x, w * 0.24, top + h * 0.16, h * 0.3, 0.42, '#c9b6ff'); }
  else if (mid) { enCrystal(x, -w * 0.1, top + h * 0.12, h * 0.38, -0.22, '#ff8fc8'); enCrystal(x, w * 0.13, top + h * 0.13, h * 0.28, 0.32, '#ffe066'); }
  if (!big && !mid) { var cw2 = (hp[0] - 0.4) * 0.1; enCrystal(x, -w * 0.2, top + h * 0.18, h * 0.36, -0.42 + cw2, '#ff8fc8'); enCrystal(x, -w * 0.06, top + h * 0.14, h * 0.48, -0.05 + cw2, '#ffe066'); enCrystal(x, w * 0.08, top + h * 0.17, h * 0.3, 0.3 + cw2, '#c9b6ff'); }
  var V = big ? [[-0.5, 1], [-0.52, 0.3], [-0.38, -0.12], [-0.2, -0.42], [0.18, -0.48], [0.44, -0.2], [0.52, 0.32], [0.5, 1]] : mid ? [[-0.5, 1], [-0.5, 0.25], [-0.3, -0.24], [0.04, -0.46], [0.36, -0.3], [0.52, 0.28], [0.5, 1]] : [[-0.5, 1], [-0.52, 0.12], [-0.3, -0.38], [0.22, -0.42], [0.5, -0.06], [0.5, 1]];
  var body = enRPoly(V.map(function (q) { return [q[0] * w, by - h + (q[1] + 0.5) / 1.5 * h]; }), w * 0.16);
  enJF(x, body, col, { d: h * 0.1, rim: 1 });
  if (!enMode) {
    x.save(); x.clip(body.p);
    x.fillStyle = rgba(enLit(col, 0.55), 0.5); x.beginPath(); x.moveTo(-w * 0.55, cy - h * 0.02); x.lineTo(-w * 0.3, top - h * 0.05); x.lineTo(w * 0.15, top - h * 0.05); x.lineTo(-w * 0.08, cy - h * 0.18); x.closePath(); x.fill();
    x.fillStyle = rgba(enShd(col, 0.35), 0.32); x.beginPath(); x.moveTo(w * 0.55, cy - h * 0.12); x.lineTo(w * 0.32, by + 2); x.lineTo(w * 0.6, by + 2); x.closePath(); x.fill();
    [[-0.32, 0.3], [0.34, 0.56], [-0.12, 0.1], [0.38, 0.2], [-0.4, 0.6]].forEach(function (s) { enGloss(x, s[0] * w, by - s[1] * h, w * 0.02, w * 0.02, 0, 0.85); });
    x.restore();
    enGloss(x, -w * 0.22, top + h * 0.2, w * 0.1, h * 0.05, -0.6, 0.75);
  }
  enFace(x, w * 0.12, by - h * 0.38, h * 0.17, { iris: '#ffd36a', mouth: big ? 'o' : 'w' }, i === 6);
  if (big || mid) enJF(x, enRPoly([[w * 0.42, by - h * (0.2 + up)], [w * 0.6, by - h * (0.34 + up)], [w * 0.66, by - h * (0.16 + up)], [w * 0.5, by - h * (0.04 + up)]], w * 0.04), col, { d: w * 0.03, rim: 0 });
  x.restore();
}
EN_DRAW.golemL = { f: function (x, H, p) { enGolem(x, H, p, 'L'); } };
EN_DRAW.golemM = { f: function (x, H, p) { enGolem(x, H, p, 'M'); } };
EN_DRAW.golemS = { f: function (x, H, p) { enGolem(x, H, p, 'S'); } };
// 와이번: 체리빛 아기 용, 노란 배, 작은 뿔, 복숭아색 날개, 하트 꼬리
EN_DRAW.wyvern = { n: 6, f: function (x, H, p) {
  var f = Math.sin(p * Math.PI * 2), col = '#ff6f88', belly = '#fff0b5', mem = '#ffb183', horn = '#ffe066', cy = -H * 0.36 + f * H * 0.03;
  EN_ONE = enInk(col);
  function wing(near) {
    var k = near ? 1 : 0.8;
    x.save(); x.translate(near ? -H * 0.05 : H * 0.03, cy - H * 0.1); x.rotate((near ? -0.2 : 0.05) - f * 0.7); x.scale(k, k);
    var L = H * 0.46, wg = shp(), P = wg.p;
    P.moveTo(0, 0); P.quadraticCurveTo(-L * 0.1, -L * 0.6, -L * 0.28, -L * 0.98); P.quadraticCurveTo(-L * 0.55, -L * 0.74, -L * 0.88, -L * 0.62);
    P.quadraticCurveTo(-L * 0.66, -L * 0.5, -L * 0.76, -L * 0.3); P.quadraticCurveTo(-L * 0.5, -L * 0.26, -L * 0.54, -L * 0.05); P.quadraticCurveTo(-L * 0.28, -L * 0.06, 0, L * 0.12); P.closePath();
    wg.ext(-L * 0.88, -L); wg.ext(0, L * 0.12);
    enJF(x, wg, near ? mem : enShd(mem, 0.15), { d: L * 0.05, rim: 0 });
    if (!enMode) { x.strokeStyle = near ? col : enShd(col, 0.15); x.lineCap = 'round'; x.lineWidth = Math.max(1.5, L * 0.07); x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-L * 0.1, -L * 0.6, -L * 0.28, -L * 0.98); x.stroke(); }
    x.restore();
  }
  wing(false);
  var tw = Math.sin(p * Math.PI * 2 + 1) * H * 0.04;
  enJF(x, shp().blob([[-H * 0.1, cy - H * 0.02], [-H * 0.3, cy + H * 0.06 + tw * 0.5], [-H * 0.46, cy + H * 0.02 + tw], [-H * 0.46, cy + H * 0.07 + tw], [-H * 0.28, cy + H * 0.16], [-H * 0.08, cy + H * 0.14]]), col, { d: H * 0.02, rim: 0 });
  enHeart(x, -H * 0.5, cy + H * 0.045 + tw, H * 0.065, '#ff4f7e');
  [[-0.08, 0], [0.08, 1]].forEach(function (l, i) { enOv(x, H * l[0], cy + H * 0.2 + Math.sin(p * Math.PI * 2 + i) * H * 0.012, H * 0.055, H * 0.045, i ? col : enShd(col, 0.2)); });
  var bd = enEl(-H * 0.02, cy + H * 0.04, H * 0.2, H * 0.18); enJF(x, bd, col, { d: H * 0.03 });
  if (!enMode) { x.save(); x.clip(bd.p); x.fillStyle = belly; x.beginPath(); x.ellipse(H * 0.06, cy + H * 0.12, H * 0.13, H * 0.12, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
  wing(true);
  var hx = H * 0.16, hy = cy - H * 0.17, hr = H * 0.2;
  [[-0.42, 0], [0.1, 1]].forEach(function (h, i) { var bx = hx + h[0] * hr, byy = hy - hr * 0.72; enJF(x, shp().blob([[bx - hr * 0.17, byy + hr * 0.14], [bx - hr * 0.26, byy - hr * 0.45], [bx + hr * 0.2, byy + hr * 0.08]]), i ? horn : enShd(horn, 0.15), { d: 0, rim: 0 }); });
  enJF(x, enEl(hx, hy, hr * 1.08, hr * 0.96), col, { d: hr * 0.16, rim: 1 });
  enOv(x, hx + hr * 0.8, hy + hr * 0.3, hr * 0.4, hr * 0.32, enLit(col, 0.18), 0, { d: hr * 0.08, rim: 0 });
  enGloss(x, hx - hr * 0.45, hy - hr * 0.5, hr * 0.22, hr * 0.12, -0.6, 0.8); enGloss(x, hx - hr * 0.7, hy - hr * 0.22, hr * 0.06, hr * 0.06, 0, 0.75);
  if (!enMode) { x.fillStyle = EN_EYEK; x.beginPath(); x.ellipse(hx + hr * 1.02, hy + hr * 0.2, hr * 0.06, hr * 0.05, 0, 0, Math.PI * 2); x.fill(); }
  enFace(x, hx + hr * 0.02, hy - hr * 0.04, hr * 0.32, { iris: '#ffb36a', mouth: 'wf', mh: 1.55, gap: 1.2 }, Math.round(p * 6) % 6 === 4);
} };
// 망령: 하얀 이불 유령(연보라 땡땡이), 물결 밑단, 고깔 잠꼬대 모자, 'o' 입. 둥실둥실
EN_DRAW.wraith = { f: function (x, H, p) {
  var a = p * Math.PI * 2, col = '#f8f5ff', cap = '#b9a2ff', r = H * 0.29, by = -H * 0.5 + Math.sin(a) * H * 0.04, i = Math.round(p * 8) % 8;
  EN_ONE = '#6a52c8';
  enGlow(x, 0, by, H * 0.48, '#c8b4ff', 0.25);
  var hem = by + r * 1.0, s = shp(), P = s.p, n = 4;
  P.moveTo(-r * 1.04, hem); P.bezierCurveTo(-r * 1.1, by - r * 0.4, -r * 0.62, by - r * 1.08, r * 0.05, by - r * 1.08); P.bezierCurveTo(r * 0.75, by - r * 1.08, r * 1.12, by - r * 0.4, r * 1.04, hem);
  for (var j = 0; j < n; j++) { var x0 = r * 1.04 - j * r * 2.08 / n, x1 = x0 - r * 2.08 / n, wv = Math.sin(a * 2 + j * 1.7) * r * 0.08; P.quadraticCurveTo((x0 + x1) / 2, hem + r * 0.34 + wv, x1, hem); }
  P.closePath(); s.ext(-r * 1.12, by - r * 1.08); s.ext(r * 1.12, hem + r * 0.42);
  [[-1, 1], [1, 0.85]].forEach(function (e) { enOv(x, e[0] * r * 1.0, by + r * 0.25 + Math.sin(a + e[0]) * r * 0.06, r * 0.2 * e[1], r * 0.16 * e[1], e[0] < 0 ? enShd(col, 0.1) : col, e[0] * 0.5); });
  enJF(x, s, col, { d: r * 0.2, sk: 0.22, sa: 0.55, hi: 0.3, rim: 1 });
  if (!enMode) { x.save(); x.clip(s.p); x.fillStyle = 'rgba(190,168,255,0.45)'; [[-0.62, -0.1], [-0.3, 0.55], [0.55, 0.62], [-0.75, 0.75]].forEach(function (d) { x.beginPath(); x.arc(d[0] * r, by + d[1] * r, r * 0.09, 0, Math.PI * 2); x.fill(); }); x.restore(); }
  enGloss(x, -r * 0.42, by - r * 0.62, r * 0.22, r * 0.11, -0.6, 0.85); enGloss(x, -r * 0.7, by - r * 0.3, r * 0.06, r * 0.06, 0, 0.75);
  var ct = Math.sin(a + 0.6) * 0.12, cb = by - r * 0.85;
  var cone = shp().blob([[-r * 0.62, cb + r * 0.12], [-r * 0.5, cb - r * 0.42], [-r * (0.85 + ct), cb - r * 0.55], [-r * (1.2 + ct), cb - r * 0.1], [-r * 1.0, cb - r * 0.25], [-r * 0.2, cb - r * 0.6], [r * 0.35, cb - r * 0.1], [r * 0.3, cb + r * 0.16]]);
  enJF(x, cone, cap, { d: r * 0.08, rim: 0 });
  enJF(x, shp().rrect(-r * 0.68, cb, r * 1.06, r * 0.2, r * 0.1), '#ffffff', { d: r * 0.03, rim: 0 });
  enBall(x, -r * (1.22 + ct), cb - r * 0.06, r * 0.15, '#ff9ccc');
  enFace(x, r * 0.2, by - r * 0.05, r * 0.3, { iris: '#a98bff', mouth: 'o', gap: 1.2, mh: 1.4 }, i === 5);
} };
// 공성 수레: 체리색 장난감 수레(흰 땡땡이), 노란 테, 하늘색 바퀴, 막대사탕 줄무늬 박치기, 분홍 깃발, 빼꼼 고블린과 오크
function enGobHead(x, cx, cy, r, t) {
  var col = '#ffe04a';
  [[-1, 1], [1, 0.84]].forEach(function (e) { var sd = e[0], bx = cx + sd * r * 0.7, tx = bx + sd * r * 0.8 * e[1]; enJF(x, shp().blob([[bx, cy - r * 0.32], [tx, cy - r * 0.42], [bx, cy + r * 0.26]]), sd < 0 ? col : enShd(col, 0.08), { d: 0, rim: 0 }); });
  enSprout(x, cx - r * 0.1, cy - r * 0.82, r * 0.6, Math.sin(t) * 0.2);
  enJF(x, enEl(cx, cy, r, r * 0.92), col, { d: r * 0.2 });
  enGloss(x, cx - r * 0.45, cy - r * 0.5, r * 0.25, r * 0.13, -0.6, 0.8);
  enFace(x, cx + r * 0.15, cy + r * 0.08, r * 0.3, { iris: '#ff8fc8', mouth: 'wf', gap: 1.25 });
}
function enOrcHead(x, cx, cy, r, t) {
  var col = '#ffb48e';
  [[-1, 1], [1, 0.85]].forEach(function (e) { enOv(x, cx + e[0] * r * 0.72, cy - r * 0.58, r * 0.28 * e[1], r * 0.26 * e[1], e[0] < 0 ? col : enShd(col, 0.08)); });
  enOv(x, cx - r * 0.1, cy - r * 0.95, r * 0.34, r * 0.3, '#e0507a', 0, { d: r * 0.08 });
  enJF(x, enEl(cx, cy, r, r * 0.92), col, { d: r * 0.2 });
  enGloss(x, cx - r * 0.45, cy - r * 0.5, r * 0.25, r * 0.13, -0.6, 0.8);
  enFace(x, cx + r * 0.15, cy + r * 0.05, r * 0.28, { iris: '#ff9a7a', mouth: 'tusk', gap: 1.3, mh: 1.3 });
}
EN_DRAW.wagon = { f: function (x, H, p) {
  var a = p * Math.PI * 2, bump = -Math.abs(Math.sin(a)) * H * 0.015, red = '#ff6b78', trim = '#ffd75a', tire = '#6fbfff';
  EN_ONE = enInk(red);
  function wheel(cx, r) {
    enJF(x, enEl(cx, -r, r, r), tire, { d: r * 0.14 });
    enJF(x, enEl(cx, -r, r * 0.66, r * 0.66), '#fff3c8', { d: r * 0.08, rim: 0 });
    if (!enMode) { x.save(); x.translate(cx, -r); x.rotate(a * 0.5); x.strokeStyle = '#ffb35a'; x.lineCap = 'round'; x.lineWidth = Math.max(1.2, r * 0.13); for (var i = 0; i < 4; i++) { var an = i * Math.PI / 4; x.beginPath(); x.moveTo(Math.cos(an) * r * 0.55, Math.sin(an) * r * 0.55); x.lineTo(-Math.cos(an) * r * 0.55, -Math.sin(an) * r * 0.55); x.stroke(); } x.restore(); }
    enBall(x, cx, -r, r * 0.24, '#ff6f9f');
    enGloss(x, cx - r * 0.5, -r * 1.5, r * 0.22, r * 0.1, -0.7, 0.8);
  }
  var px = -H * 0.4, py = -H * 0.56 + bump, fw = Math.sin(a * 2);
  enLine(x, [[px, py + H * 0.05], [px, py - H * 0.46]], H * 0.03, '#ffe2a8');
  enJF(x, shp().blob([[px, py - H * 0.45], [px + H * 0.14, py - H * 0.44 + fw * H * 0.015], [px + H * 0.28, py - H * 0.4 + fw * H * 0.03], [px + H * 0.14, py - H * 0.34 - fw * H * 0.01], [px, py - H * 0.3]]), '#ff8fc8', { d: H * 0.015, rim: 0 });
  enStar(x, px + H * 0.1, py - H * 0.385, H * 0.035, '#ffe066');
  enBall(x, px, py - H * 0.475, H * 0.028, trim);
  enGobHead(x, -H * 0.16, -H * 0.63 + bump - Math.abs(Math.sin(a)) * H * 0.04, H * 0.13, a);
  enOrcHead(x, H * 0.15, -H * 0.63 + bump - Math.abs(Math.sin(a + 1.3)) * H * 0.04, H * 0.14, a);
  var bx0 = -H * 0.48, bx1 = H * 0.4, byT = -H * 0.58 + bump, byB = -H * 0.2 + bump;
  var box = shp().rrect(bx0, byT, bx1 - bx0, byB - byT, H * 0.06); enJF(x, box, red, { d: H * 0.04, rim: 1 });
  if (!enMode) { x.save(); x.clip(box.p); x.fillStyle = 'rgba(255,255,255,0.55)'; [[-0.38, 0.35], [-0.22, 0.75], [0.25, 0.32], [0.32, 0.72], [-0.04, 0.5]].forEach(function (d) { x.beginPath(); x.arc(lerp(bx0, bx1, d[0] + 0.5), lerp(byT, byB, d[1]), H * 0.022, 0, Math.PI * 2); x.fill(); }); x.restore(); enGloss(x, bx0 + H * 0.12, byT + H * 0.1, H * 0.1, H * 0.025, -0.15, 0.6); }
  enJF(x, shp().rrect(bx0 - H * 0.025, byT - H * 0.03, bx1 - bx0 + H * 0.05, H * 0.075, H * 0.037), trim, { d: 0, rim: 0 });
  enHeart(x, (bx0 + bx1) / 2 - H * 0.03, (byT + byB) / 2 + H * 0.025, H * 0.075, '#ffd6e8');
  var rx0 = bx1 - H * 0.04, ry = -H * 0.42 + bump, ram = shp().rrect(rx0, ry - H * 0.065, H * 0.28, H * 0.13, H * 0.065);
  enJF(x, ram, '#fff6fa', { d: H * 0.02, oc: '#ff5f8f' });
  if (!enMode) { x.save(); x.clip(ram.p); x.strokeStyle = '#ff6f9f'; x.lineWidth = H * 0.035; for (var k = 0; k < 4; k++) { var sx2 = rx0 + k * H * 0.08; x.beginPath(); x.moveTo(sx2, ry + H * 0.08); x.lineTo(sx2 + H * 0.07, ry - H * 0.08); x.stroke(); } x.restore(); }
  enBall(x, rx0 + H * 0.29, ry, H * 0.06, trim);
  wheel(-H * 0.26, H * 0.17); wheel(H * 0.24, H * 0.17);
} };
// 흑마법사: 코발트 찹쌀떡, 남색 고깔 마법사 모자(노란 별, 끝이 뒤로 축), 별 지팡이
EN_DRAW.warlock = { f: function (x, H, p) {
  var col = '#8391ff', hat = '#3f42aa', star = '#ffe066';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.78, h: 0.64, hop: 0.08, fyo: 0.4, es: 0.19, arms: col, farArm: 0, face: { iris: '#ffd36a', mouth: 'w' },
    head: function (x, G) {
      var t = Math.sin(G.p * Math.PI * 2) * 0.1 + G.air * 0.12, bx = G.cx - G.w * 0.02, by = G.top + G.h * 0.24;
      var tipx = bx - G.w * (0.48 + t * 0.4), tipy = by - G.h * (0.95 - t * 0.2);
      var cone = shp().blob([[bx - G.w * 0.4, by + G.h * 0.02], [bx - G.w * 0.2, by - G.h * 0.48], [bx - G.w * 0.06, by - G.h * 0.86], [tipx, tipy], [bx + G.w * 0.12, by - G.h * 0.76], [bx + G.w * 0.27, by - G.h * 0.38], [bx + G.w * 0.4, by + G.h * 0.02]]);
      enJF(x, cone, hat, { d: G.h * 0.05 });
      [[-0.16, -0.32, 1], [0.12, -0.58, 0.72], [-0.04, -0.12, 0.6]].forEach(function (s) { enStar(x, bx + s[0] * G.w, by + s[1] * G.h, G.h * 0.075 * s[2], star); });
      enBall(x, tipx, tipy, G.h * 0.065, star);
      enJF(x, enEl(bx, by + G.h * 0.03, G.w * 0.6, G.h * 0.105), enLit(hat, 0.1), { d: G.h * 0.025 });
      enJF(x, shp().rrect(bx - G.w * 0.37, by - G.h * 0.085, G.w * 0.74, G.h * 0.08, G.h * 0.03), star, { d: 0, rim: 0 });
    },
    hold: function (x, G) {
      var hx = G.an[0], hy = G.an[1], tx = hx + G.w * 0.1, ty = hy - G.h * 0.62;
      enLine(x, [[hx - G.w * 0.02, hy + G.h * 0.06], [tx, ty]], G.w * 0.05, '#ffd2f0');
      enGlow(x, tx, ty, G.h * 0.32, '#d2a8ff', 0.6);
      enStar(x, tx, ty, G.h * 0.14, star, Math.sin(G.p * Math.PI * 2) * 0.2);
    }
  });
} };

// ---------- 우두머리 (더 크고, 왕관, 망토, 찡그린 귀여운 눈썹) ----------
// 오크 족장 그룸쉬: 큰 복숭아 찹쌀떡, 뿔 달린 금관, 빨간 망토, 엄니
EN_DRAW.grumsh = { f: function (x, H, p) {
  var col = '#ffaa86', cape = '#ff4f6e', gold = '#ffd24d';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.88, h: 0.76, hop: 0.045, sq: 0.7, tilt: 0.7, fyo: 0.36, es: 0.15, face: { iris: '#ff8a6a', mouth: 'tusk', ms: 1.3, brow: 'angry', bh: 1.4 },
    back: function (x, G) {
      var t = Math.sin(G.p * Math.PI * 2) * 0.05 + G.air * 0.08;
      var cp = enCape(G, t);
      enJF(x, cp, cape, { d: G.h * 0.06 });
      if (!enMode) { x.save(); x.clip(cp.p); x.fillStyle = 'rgba(255,214,90,0.95)'; x.fillRect(G.cx - G.w * 1.2, G.by - G.fr * 0.2 - G.h * 0.06, G.w * 1.2, G.h * 0.07); x.fillStyle = 'rgba(255,255,255,0.5)'; [[-0.62, 0.45], [-0.75, 0.2], [-0.48, 0.62]].forEach(function (d) { x.beginPath(); x.arc(G.cx + d[0] * G.w, G.by - d[1] * G.h, G.w * 0.025, 0, Math.PI * 2); x.fill(); }); x.restore(); }
    },
    behind: function (x, G) { enRoundEars(x, G, col, 0.24, 1); },
    head: function (x, G) {
      var cx = G.cx - G.w * 0.02, cb = G.top + G.h * 0.13, cw = G.w * 0.6, ch = G.h * 0.28;
      [[-1, 1], [1, 0.9]].forEach(function (e) { var sd = e[0], bx = cx + sd * cw * 0.42, by = cb - ch * 0.35; enJF(x, shp().blob([[bx - sd * cw * 0.05, by + ch * 0.25], [bx + sd * cw * 0.28 * e[1], by + ch * 0.05], [bx + sd * cw * 0.42 * e[1], by - ch * 0.75 * e[1]], [bx + sd * cw * 0.2, by - ch * 0.12], [bx, by - ch * 0.1]]), '#fff1d6', { d: ch * 0.05, rim: 0, oc: '#c8955a' }); });
      var pts = [[cx - cw / 2, cb], [cx - cw * 0.52, cb - ch * 0.62], [cx - cw * 0.26, cb - ch * 0.32], [cx, cb - ch], [cx + cw * 0.26, cb - ch * 0.32], [cx + cw * 0.52, cb - ch * 0.62], [cx + cw / 2, cb]];
      enMtl(x, shp().poly(pts), gold);
      [[cx - cw * 0.52, cb - ch * 0.62], [cx, cb - ch], [cx + cw * 0.52, cb - ch * 0.62]].forEach(function (q) { enBall(x, q[0], q[1], G.w * 0.035, gold); });
      enJF(x, shp().rrect(cx - cw * 0.54, cb - ch * 0.2, cw * 1.08, ch * 0.28, ch * 0.12), enShd(gold, 0.08), { d: 0, rim: 0 });
      enOv(x, cx, cb - ch * 0.42, G.w * 0.05, G.w * 0.055, '#ff4f6e', 0, { d: G.w * 0.01, rim: 0, hi: 0.7 });
    }
  });
} };
// 거미 여왕 아라크네 (위에서 본 모습): 큰 연보라 솜뭉치, 금관, 속눈썹, 등에 하트와 리본, 보라 다리
EN_DRAW.arachne = { top: 1, f: function (x, H, p) {
  enSpider(x, H, p, { body: '#e7b2ff', leg: '#a764ec', tip: '#ffb3d9', iris: '#ff6fb8', ink: '#6a3cc0', lash: 1, rb: 0.7, lw: 1.15, mouth: 'w',
    back: function (x, cy, rb) { x.save(); x.translate(-rb * 0.95, cy); x.rotate(-Math.PI / 2); enBow(x, 0, 0, rb * 0.34, '#ff6fae'); x.restore(); },
    mark: function (x, cx, cy, rb) { cx -= rb * 0.14; enHeart(x, cx, cy, rb * 0.17, '#ff5d9e'); [[-0.05, -0.36], [-0.05, 0.36], [0.24, -0.5], [0.24, 0.5]].forEach(function (d) { enDot(x, cx + d[0] * rb, cy + d[1] * rb, rb * 0.04, '#ffe066'); }); },
    crown: function (x, rb) {
      var cb = -rb * 0.3, cw = rb * 0.56, ch = rb * 0.3, pts = [[-cw / 2, cb], [-cw * 0.52, cb - ch * 0.62], [-cw * 0.26, cb - ch * 0.3], [0, cb - ch], [cw * 0.26, cb - ch * 0.3], [cw * 0.52, cb - ch * 0.62], [cw / 2, cb]];
      enMtl(x, shp().poly(pts), '#ffd24d');
      [[-cw * 0.52, cb - ch * 0.62], [0, cb - ch], [cw * 0.52, cb - ch * 0.62]].forEach(function (q) { enBall(x, q[0], q[1], rb * 0.05, '#ffd24d'); });
      enDot(x, 0, cb - ch * 0.35, rb * 0.055, '#ff5df0');
    } });
} };
// 서리 거인 요툰: 큰 하늘 얼음 찹쌀떡, 구름 같은 흰 눈 수염, 얼음 수정 왕관, 찡그린 눈썹, 몸에 눈송이
EN_DRAW.yotun = { f: function (x, H, p) {
  var col = '#9fd6ff', snow = '#ffffff';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.88, h: 0.78, hop: 0.04, sq: 0.7, tilt: 0.7, fyo: 0.52, es: 0.13, face: { iris: '#5fb8ff', mouth: 0, brow: 'angry', bh: 1.35, gap: 1.45 },
    torso: function (x, G, bs) {
      if (enMode) return;
      x.save(); x.clip(bs.p); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineCap = 'round'; x.lineWidth = Math.max(1, G.w * 0.012);
      [[-0.32, 0.3, 0.06], [0.36, 0.22, 0.045]].forEach(function (f) { var fx = G.cx + f[0] * G.w, fy = G.by - f[1] * G.h, r = G.w * f[2]; for (var k = 0; k < 3; k++) { var an = k * Math.PI / 3; x.beginPath(); x.moveTo(fx + Math.cos(an) * r, fy + Math.sin(an) * r); x.lineTo(fx - Math.cos(an) * r, fy - Math.sin(an) * r); x.stroke(); } });
      x.restore();
    },
    head: function (x, G) {
      var bx = G.fx - G.w * 0.02, by = G.fy + G.R * 1.45, bw = G.w * 0.36, bh = G.h * 0.28, pts = [[bx - bw, by - bh * 0.12]];
      for (var k = 1; k < 8; k++) { var an = Math.PI * (1 - k / 8), rr = k % 2 ? 1.0 : 0.86; pts.push([bx + Math.cos(an) * bw * rr, by + Math.sin(an) * bh * rr]); }
      pts.push([bx + bw, by - bh * 0.12]); pts.push([bx, by - bh * 0.02]);
      enJF(x, shp().blob(pts), snow, { d: bh * 0.14, sk: 0.25 });
      [-1, 1].forEach(function (sd) { enJF(x, shp().blob([[bx, by - bh * 0.06], [bx + sd * bw * 0.32, by - bh * 0.24], [bx + sd * bw * 0.62, by - bh * 0.02], [bx + sd * bw * 0.28, by + bh * 0.1]]), snow, { d: bh * 0.05, rim: 0 }); });
      enOv(x, bx + G.w * 0.01, by - bh * 0.2, G.w * 0.06, G.w * 0.05, '#ffb3c8', 0, { d: G.w * 0.01, rim: 0, hi: 0.6 });
      var cb = G.top + G.h * 0.1;
      [[-0.26, 0.26, -0.3, '#c9f2ff'], [-0.08, 0.36, -0.1, '#8fe6ff'], [0.1, 0.42, 0.08, '#c9f2ff'], [0.27, 0.3, 0.32, '#8fe6ff']].forEach(function (c) { enCrystal(x, G.cx + c[0] * G.w, cb + G.h * 0.02, G.h * c[1], c[2], c[3]); });
      enJF(x, shp().rrect(G.cx - G.w * 0.36, cb - G.h * 0.02, G.w * 0.72, G.h * 0.09, G.h * 0.045), snow, { d: G.h * 0.015, rim: 0 });
    }
  });
} };
// 잿빛 군주 바르칸: 보라 두건 찹쌀떡, 연보라 얼굴, 뾰족 금관, 남보라 망토(금 단), 빛나는 분홍 눈, 등에 멘 수정 칼
// 무릎 꿇은 모습: 납작 주저앉아 왕관 비뚤, 시무룩 눈썹, 울먹 입, 눈물, 앞에 꽂은 칼을 두 손으로
function enBarkan(x, H, p, kneel) {
  var col = '#7252dc', cape = '#40309a', skin = '#f3e9ff', gold = '#ffd24d', blade = '#cdb8ff';
  EN_ONE = enInk(col);
  function sword(x, bx, by, ang, L) {
    x.save(); x.translate(bx, by); x.rotate(ang);
    enJF(x, shp().poly([[0, -L * 0.07], [L * 0.86, -L * 0.07], [L, 0], [L * 0.86, L * 0.07], [0, L * 0.07]]), blade, { d: L * 0.02, hi: 0.6 });
    if (!enMode) { x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = Math.max(1, L * 0.02); x.beginPath(); x.moveTo(L * 0.06, -L * 0.022); x.lineTo(L * 0.86, -L * 0.022); x.stroke(); }
    enMtl(x, shp().rrect(-L * 0.04, -L * 0.17, L * 0.07, L * 0.34, L * 0.03), gold);
    enJF(x, shp().rrect(-L * 0.24, -L * 0.04, L * 0.21, L * 0.08, L * 0.04), '#4a3aa8', { d: 0, rim: 0 });
    enBall(x, -L * 0.26, 0, L * 0.055, gold);
    enDot(x, L * 0.0, 0, L * 0.03, '#ff5df0');
    x.restore();
  }
  return enMo(x, H, p, {
    col: col, w: kneel ? 0.98 : 0.86, h: kneel ? 0.62 : 0.78, hop: 0.04, sq: 0.7, tilt: 0.6, still: kneel ? 1 : 0, fyo: kneel ? 0.4 : 0.44, es: kneel ? 0.15 : 0.13, fxo: 0.14, arms: col, farArm: 0,
    face: kneel ? { iris: '#c9a2ff', mouth: 'wavy', brow: 'sad', bh: 1.35 } : { iris: '#ff6af0', mouth: 'pout', brow: 'angry', bh: 1.35 },
    back: function (x, G) {
      var t = kneel ? 0 : Math.sin(G.p * Math.PI * 2) * 0.05 + G.air * 0.08;
      var cp = enCape(G, t);
      enJF(x, cp, cape, { d: G.h * 0.06 });
      if (!enMode) { x.save(); x.clip(cp.p); x.fillStyle = 'rgba(255,214,90,0.95)'; x.fillRect(G.cx - G.w * 1.2, G.by - G.fr * 0.2 - G.h * 0.06, G.w * 1.2, G.h * 0.07); x.restore(); }
      if (!kneel) sword(x, G.cx - G.w * 0.36, G.top + G.h * 0.3, 0.55 + Math.sin(G.p * Math.PI * 2) * 0.03, G.H * 0.62);
    },
    torso: function (x, G, bs) {
      if (enMode) return;
      var fo = enEl(G.fx - G.R * 0.12, G.fy + G.R * 0.42, G.R * 2.6, G.R * 2.1);
      x.save(); x.clip(bs.p);
      var g = x.createLinearGradient(0, G.fy - G.R * 1.8, 0, G.fy + G.R * 2.4); g.addColorStop(0, '#d9c8ff'); g.addColorStop(0.35, skin); g.addColorStop(1, '#fff6ff');
      x.fillStyle = g; x.fill(fo.p); x.lineWidth = enLW * 1.2; x.strokeStyle = enShd(col, 0.3); x.stroke(fo.p);
      x.restore();
    },
    head: function (x, G) {
      var cy = G.top + G.h * 0.06, tilt = kneel ? 0.38 : 0;
      x.save(); x.translate(G.cx + (kneel ? G.w * 0.08 : 0), cy + (kneel ? G.h * 0.04 : 0)); x.rotate(tilt);
      var cw = G.w * 0.56, ch = G.h * 0.3, pts = [[-cw / 2, 0]];
      [[-0.42, 0.62], [-0.21, 0.85], [0, 1.0], [0.21, 0.85], [0.42, 0.62]].forEach(function (s) { pts.push([s[0] * cw - cw * 0.08, -ch * 0.2]); pts.push([s[0] * cw, -ch * s[1]]); pts.push([s[0] * cw + cw * 0.08, -ch * 0.2]); });
      pts.push([cw / 2, 0]);
      enMtl(x, shp().poly(pts), gold);
      [[-0.42, 0.62], [0, 1.0], [0.42, 0.62]].forEach(function (s) { enDot(x, s[0] * cw, -ch * s[1], G.w * 0.022, '#ff5df0'); });
      enOv(x, 0, -ch * 0.12, G.w * 0.045, G.w * 0.05, '#ff5df0', 0, { d: G.w * 0.01, rim: 0, hi: 0.7 });
      x.restore();
      if (kneel && !enMode) [[-1, 1], [1, 0.85]].forEach(function (e) { var tx = e[0] < 0 ? G.fx - G.R * 1.75 : G.fx + G.R * 1.55, ty = G.fy + G.R * 1.05, k = G.R * 0.42 * e[1]; x.fillStyle = '#9fe0ff'; x.beginPath(); x.moveTo(tx, ty - k); x.quadraticCurveTo(tx + k * 0.75, ty + k * 0.25, tx, ty + k * 0.7); x.quadraticCurveTo(tx - k * 0.75, ty + k * 0.25, tx, ty - k); x.fill(); enGloss(x, tx - k * 0.15, ty + k * 0.05, k * 0.15, k * 0.22, 0, 0.9); });
    },
    hold: kneel ? function (x, G) { var sx = G.cx + G.w * 0.52, L = G.H * 0.5; sword(x, sx, -L, Math.PI / 2, L); G.an = [sx, -L * 1.1]; } : null
  });
}
EN_DRAW.barkan = { f: function (x, H, p) { enBarkan(x, H, p, false); }, kneel: function (x, H) { enBarkan(x, H * 0.84, 0.25, true); } };

// ---------- v1.3 새 적 6종 (얼음 젤리, 불씨 도깨비, 거울 기사, 번개 토끼, 방패 수호자, 얼음불 쌍둥이 왕) ----------
// 번개 (가운데 cx,cy, 길이 s, rot 0 이면 위에서 아래로 내리침)
function enBolt(x, cx, cy, s, rot, col, lw, oc) {
  x.save(); x.translate(cx, cy); x.rotate(rot || 0);
  enJF(x, shp().poly([[s * 0.04, -s * 0.5], [s * 0.3, -s * 0.5], [s * 0.1, -s * 0.07], [s * 0.27, -s * 0.07], [-s * 0.16, s * 0.5], [-s * 0.02, s * 0.06], [-s * 0.21, s * 0.06]]), col, { d: s * 0.05, rim: 0, lw: lw || 0.8, hi: 0.55, oc: oc });
  x.restore();
}
// 눈송이 (가는 막대 셋 + 가지)
function enFlake(x, cx, cy, r, col, rot) {
  var lw = Math.max(1, r * 0.28), k, a, c, s;
  for (k = 0; k < 3; k++) { a = (rot || 0) + k * Math.PI / 3; c = Math.cos(a) * r; s = Math.sin(a) * r; enLine(x, [[cx + c, cy + s], [cx - c, cy - s]], lw, col); }
  if (r > 3) for (k = 0; k < 6; k++) { a = (rot || 0) + k * Math.PI / 3; var bx = cx + Math.cos(a) * r * 0.58, by = cy + Math.sin(a) * r * 0.58; [-0.75, 0.75].forEach(function (q) { enLine(x, [[bx, by], [bx + Math.cos(a + q) * r * 0.32, by + Math.sin(a + q) * r * 0.32]], lw * 0.75, col); }); }
  enDot(x, cx, cy, lw * 0.75, col);
}
// 반짝 별 (네 갈래, 색칠 단계만)
function enTwk(x, cx, cy, r, col, a) {
  if (enMode || r < 0.6) return;
  x.save(); x.globalAlpha = a == null ? 0.95 : a; x.fillStyle = col || '#ffffff'; x.beginPath();
  x.moveTo(cx, cy - r); x.quadraticCurveTo(cx, cy, cx + r * 0.7, cy); x.quadraticCurveTo(cx, cy, cx, cy + r); x.quadraticCurveTo(cx, cy, cx - r * 0.7, cy); x.quadraticCurveTo(cx, cy, cx, cy - r);
  x.fill(); x.restore();
}
// 촛불 불꽃: 밑동 (bx,by), 폭 w, 높이 h, 끝 기울기 lean(폭 배)
function enFlameS(bx, by, w, h, lean) {
  var s = shp(), P = s.p, r = w / 2, tx = bx + lean * w, ty = by - h;
  P.moveTo(tx, ty);
  P.bezierCurveTo(tx + w * 0.08, by - h * 0.62, bx + r * 1.08, by - h * 0.5, bx + r, by - r);
  P.arc(bx, by - r, r, 0, Math.PI, false);
  P.bezierCurveTo(bx - r * 1.08, by - h * 0.5, tx - w * 0.08, by - h * 0.62, tx, ty);
  P.closePath(); s.ext(Math.min(bx - r, tx), ty); s.ext(Math.max(bx + r, tx), by);
  return s;
}
function enFlame(x, bx, by, w, h, lean, glow) {
  if (glow) enGlow(x, bx, by - h * 0.4, h * 0.9, '#ffb060', glow);
  enJF(x, enFlameS(bx, by, w, h, lean), '#ff8a3c', { d: 0, rim: 0, hi: 0.35, gx: 0.5, gy: 0.75, oc: '#ff7a30' });
  if (enMode) return;
  var s2 = enFlameS(bx, by - w * 0.06, w * 0.64, h * 0.66, lean * 0.8), g = x.createLinearGradient(0, by - h * 0.7, 0, by);
  g.addColorStop(0, '#ffd23a'); g.addColorStop(1, '#ffe98a'); x.fillStyle = g; x.fill(s2.p);
  x.fillStyle = 'rgba(255,255,255,0.92)'; x.fill(enFlameS(bx, by - w * 0.1, w * 0.32, h * 0.34, lean * 0.6).p);
}
// 고드름 (밑동 가운데 cx,cy, 폭 w, 길이 L, 아래로)
function enIcicle(x, cx, cy, w, L, col) {
  enJF(x, shp().blob([[cx - w / 2, cy], [cx - w * 0.2, cy + L * 0.55], [cx, cy + L], [cx + w * 0.2, cy + L * 0.55], [cx + w / 2, cy]]), col, { d: 0, rim: 0, lw: 0.7, hi: 0.75, gx: 0.2 });
  enGloss(x, cx - w * 0.14, cy + L * 0.3, w * 0.08, L * 0.18, 0, 0.9);
}
// 볼 위치 (enFace 와 같은 셈: 가까운 볼, 먼 볼)
function enCheeks(G, gap) { var g = G.R * (gap || 1.3); return [[G.fx - g - G.R * 0.42, G.fy + G.R * 1.12], [G.fx + g * 0.9 + G.R * 0.5, G.fy + G.R * 1.12]]; }

// 얼음 젤리: 맑은 민트하늘 젤리(발 없이 바닥에 퍼진 물방울 몸), 머리에 서리 크림과 하늘 눈송이 핀, 볼 아래 작은 고드름. 몸 안에 얼음 결 반짝이
function enSlimeS(cx, by, w, h) {
  var s = shp(), P = s.p, hw = w / 2, top = by - h;
  P.moveTo(cx, by);
  P.bezierCurveTo(cx + hw * 0.8, by, cx + hw * 1.12, by + h * 0.01, cx + hw * 1.1, by - h * 0.07);
  P.bezierCurveTo(cx + hw * 1.06, by - h * 0.14, cx + hw * 0.96, by - h * 0.2, cx + hw * 0.96, by - h * 0.4);
  P.bezierCurveTo(cx + hw * 0.96, top + h * 0.16, cx + hw * 0.56, top, cx, top);
  P.bezierCurveTo(cx - hw * 0.56, top, cx - hw * 0.96, top + h * 0.16, cx - hw * 0.96, by - h * 0.4);
  P.bezierCurveTo(cx - hw * 0.96, by - h * 0.2, cx - hw * 1.06, by - h * 0.14, cx - hw * 1.1, by - h * 0.07);
  P.bezierCurveTo(cx - hw * 1.12, by + h * 0.01, cx - hw * 0.8, by, cx, by);
  P.closePath(); s.ext(cx - hw * 1.12, top); s.ext(cx + hw * 1.12, by);
  return s;
}
EN_DRAW.iceslime = { f: function (x, H, p) {
  var col = '#8deee9', pin = '#79cfff';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.86, h: 0.74, hop: 0.07, sq: 1.4, tilt: 0.5, feet: 0, fo: 0, fyo: 0.38, es: 0.185, hi: 0.72, face: { iris: '#6cc8ff', mouth: 'w', blush: '#ff6aa8' },
    shape: function (G) { return enSlimeS(G.cx, G.by, G.w, G.h); },
    torso: function (x, G, bs) {
      if (enMode) return;
      x.save(); x.clip(bs.p);
      // 맑은 속: 아래쪽이 비쳐 밝고, 얼음 결 사선 반짝
      x.fillStyle = 'rgba(236,255,255,0.6)'; x.beginPath(); x.ellipse(G.cx + G.w * 0.08, G.by - G.h * 0.16, G.w * 0.4, G.h * 0.18, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineCap = 'round'; x.lineWidth = Math.max(1, G.w * 0.025);
      [[-0.36, 0.26, 0.12], [0.34, 0.5, 0.08]].forEach(function (q) { var sx = G.cx + q[0] * G.w, sy = G.by - q[1] * G.h, L = q[2] * G.w; x.beginPath(); x.moveTo(sx - L * 0.5, sy + L * 0.5); x.lineTo(sx + L * 0.5, sy - L * 0.5); x.stroke(); });
      // 서리 크림: 정수리에 흰 서리가 물결처럼 덮이고 방울이 살짝 흘러내림
      var fy = G.top + G.h * 0.24, fr = shp(), P = fr.p, n = 5, k;
      P.moveTo(G.cx - G.w, G.top - 2); P.lineTo(G.cx - G.w, fy);
      for (k = 0; k < n; k++) { var x0 = G.cx - G.w * 0.6 + k * G.w * 1.2 / n, x1 = x0 + G.w * 1.2 / n, dp = k % 2 ? 0.07 : 0.12; P.quadraticCurveTo((x0 + x1) / 2, fy + G.h * dp, x1, fy - (k === 2 ? G.h * 0.02 : 0)); }
      P.lineTo(G.cx + G.w, fy); P.lineTo(G.cx + G.w, G.top - 2); P.closePath();
      var g = x.createLinearGradient(0, G.top, 0, fy + G.h * 0.1); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e4fbff');
      x.fillStyle = g; x.fill(P); x.strokeStyle = rgba(enInk(col), 0.35); x.lineWidth = enLW * 0.8; x.stroke(P);
      x.restore();
      [[-0.3, 0.68, 0.035], [0.12, 0.84, 0.025], [0.36, 0.3, 0.03]].forEach(function (b) { enTwk(x, G.cx + b[0] * G.w, G.by - b[1] * G.h, b[2] * G.w * 2.2, '#ffffff', 0.9); });
    },
    head: function (x, G) {
      // 볼 아래 작은 고드름 + 반짝
      enCheeks(G).forEach(function (c, j) { var k = j ? 0.85 : 1; enIcicle(x, c[0] + (j ? -G.R * 0.1 : G.R * 0.12), c[1] + G.R * 0.42, G.R * 0.42 * k, G.R * 0.75 * k, '#e2fbff'); });
      enTwk(x, enCheeks(G)[1][0] + G.R * 0.55, enCheeks(G)[1][1] + G.R * 0.25, G.R * 0.45, '#ffffff', 1);
      // 눈송이 핀 (머리 왼쪽 위, 통통 뛸 때 살짝 기울어짐)
      enFlake(x, G.cx - G.w * 0.2, G.top + G.h * 0.13, G.H * 0.1, pin, 0.26 + (G.air - 0.4) * 0.2);
    }
  });
} };
// 불씨 도깨비: 귤빛 주황 찹쌀떡(배는 노란 불빛), 머리 위 촛불 불꽃 한 송이, 크림색 작은 뿔 하나, 혀 쏙 장난꾸러기
EN_DRAW.ember = { f: function (x, H, p) {
  var col = '#ff9542', horn = '#fff1c9';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.78, h: 0.66, hop: 0.13, fyo: 0.38, es: 0.185, hi: 0.55, face: { iris: '#ffd36a', mouth: 'wt', blush: '#ff4a8a' },
    behind: function (x, G) {
      // 불꽃 (뛸 때 뒤로 휘날림, 깜빡깜빡)
      var a = G.p * Math.PI * 2, fl = 1 + Math.sin(a * 2) * 0.07, ln = -0.18 - G.air * 0.28 + Math.sin(a * 2 + 1) * 0.06;
      enFlame(x, G.cx - G.w * 0.04, G.top + G.h * 0.14, G.w * 0.38, G.h * 0.66 * fl, ln, 0.5);
    },
    torso: function (x, G, bs) {
      if (enMode) return;
      x.save(); x.clip(bs.p); var g = x.createRadialGradient(G.cx + G.w * 0.05, G.by - G.h * 0.12, 0, G.cx + G.w * 0.05, G.by - G.h * 0.12, G.w * 0.45);
      g.addColorStop(0, 'rgba(255,236,140,0.85)'); g.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = g; x.fillRect(G.cx - G.w, G.by - G.h, G.w * 2, G.h * 1.2); x.restore();
    },
    head: function (x, G) {
      // 뿔 하나 (앞쪽 정수리)
      var bx = G.cx + G.w * 0.22, by = G.top + G.h * 0.1, hw = G.w * 0.1, hh = G.h * 0.24;
      enJF(x, shp().blob([[bx - hw, by + hh * 0.2], [bx - hw * 0.5, by - hh * 0.4], [bx + hw * 0.55, by - hh], [bx + hw * 0.4, by - hh * 0.3], [bx + hw, by + hh * 0.15]]), horn, { d: 0, rim: 0, oc: '#e0904a' });
      // 짓궂은 눈썹 (한쪽만 쓱 올림)
      if (!enMode) {
        var g = G.R * 1.3, e1 = G.fx - g, e2 = G.fx + g * 0.9, by2 = G.fy - G.R * 1.4;
        x.save(); x.strokeStyle = EN_EYEK; x.lineCap = 'round'; x.lineWidth = Math.max(1.2, G.R * 0.28);
        x.beginPath(); x.moveTo(e1 - G.R * 0.6, by2 + G.R * 0.12); x.quadraticCurveTo(e1, by2 - G.R * 0.38, e1 + G.R * 0.5, by2 - G.R * 0.05); x.stroke();
        x.beginPath(); x.moveTo(e2 - G.R * 0.45, by2 + G.R * 0.1); x.lineTo(e2 + G.R * 0.45, by2 - G.R * 0.12); x.stroke();
        x.restore();
        // 불씨 두엇
        var a = G.p * Math.PI * 2;
        enDot(x, G.cx - G.w * 0.38, G.top - G.h * 0.08 - Math.sin(a) * G.h * 0.06, G.w * 0.03, '#ffd23a', 0.9);
        enDot(x, G.cx + G.w * 0.1, G.top - G.h * 0.32 - Math.cos(a) * G.h * 0.05, G.w * 0.022, '#ffb03a', 0.85);
      }
    }
  });
} };
// 거울 기사: 은빛 라벤더 찹쌀떡(금속 반사 띠), 은 투구 꼭대기에 하늘 깃털, 분홍 테 손거울 방패(무지개 반사 두 줄)
EN_DRAW.mirror = { f: function (x, H, p) {
  var col = '#d9d1f7', steel = '#eef2fb', so = '#8e98d2', frame = '#ff8ec6', plume = '#8fe4ff';
  EN_ONE = '#6252b8';
  enMo(x, H, p, {
    col: col, w: 0.8, h: 0.72, hop: 0.07, sq: 0.8, fyo: 0.34, fxo: 0.06, es: 0.17, hi: 0.75, arms: col, farArm: 0, face: { iris: '#a4c6ff', mouth: 'w', blush: '#ff6fae' },
    torso: function (x, G, bs) {
      if (enMode) return;
      x.save(); x.clip(bs.p); x.translate(G.cx, G.by - G.h * 0.5); x.rotate(-0.55);
      x.fillStyle = 'rgba(255,255,255,0.42)'; x.fillRect(-G.w * 0.62, -G.h * 0.08, G.w * 1.3, G.h * 0.09);
      x.fillStyle = 'rgba(180,170,240,0.28)'; x.fillRect(-G.w * 0.62, G.h * 0.06, G.w * 1.3, G.h * 0.05);
      x.restore();
    },
    head: function (x, G) {
      // 은 투구 (작은 반구 + 테) 와 꼭대기 하늘 깃털
      var cx = G.cx - G.w * 0.02, hb = G.top + G.h * 0.3, rx = G.w * 0.4, ry = G.h * 0.34, t = Math.sin(G.p * Math.PI * 2) * 0.1 - G.air * 0.14;
      x.save(); x.translate(cx, G.top - G.h * 0.01); x.rotate(-0.25 + t); var L = G.h * 0.48;
      enJF(x, shp().blob([[-L * 0.12, L * 0.08], [-L * 0.3, -L * 0.42], [-L * 0.16, -L * 0.96], [L * 0.2, -L * 0.62], [L * 0.16, L * 0.06]]), plume, { d: L * 0.07, rim: 0 });
      if (!enMode) { x.strokeStyle = rgba(enInk(plume), 0.5); x.lineWidth = enLW * 0.7; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-L * 0.08, -L * 0.5, -L * 0.14, -L * 0.85); x.stroke(); }
      x.restore();
      enMtl(x, enCapS(cx, hb, rx, ry, Math.PI + 0.05, Math.PI * 2 - 0.05, hb + G.h * 0.02), steel, { oc: so });
      enMtl(x, shp().rrect(cx - rx * 1.04, hb - G.h * 0.05, rx * 2.08, G.h * 0.09, G.h * 0.045), enShd(steel, 0.05), { oc: so });
      enBall(x, cx, G.top - G.h * 0.02, G.w * 0.055, steel, so);
      enGloss(x, cx - rx * 0.5, hb - ry * 0.55, rx * 0.12, ry * 0.2, 0.5, 0.85);
    },
    hold: function (x, G) {
      // 손거울 방패: 앞쪽에 세워 듦 (손잡이는 가까운 손)
      var mx = G.cx + G.w * 0.54, my = G.by - G.h * (0.62 + G.up * 0.06), r = G.H * 0.255, rx = r * 0.84, rot = 0.12;
      enPill(x, [mx - r * 0.06, my + r * 0.9], [G.an[0] - G.w * 0.02, G.an[1] + G.h * 0.12], r * 0.26, r * 0.22, frame);
      enJF(x, enEl(mx, my, rx, r, rot), frame, { d: r * 0.1, rim: 0, hi: 0.45 });
      var sf = enEl(mx + r * 0.02, my, rx * 0.74, r * 0.76, rot);
      if (enMode) return;
      var g = x.createLinearGradient(mx - rx, my - r, mx + rx, my + r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#dcecff'); g.addColorStop(1, '#b7cdfb');
      x.fillStyle = g; x.fill(sf.p);
      x.save(); x.clip(sf.p); x.translate(mx, my); x.rotate(-0.75);
      [[-0.32, 0.2], [0.18, 0.13]].forEach(function (b) {
        var y0 = b[0] * r, bw = b[1] * r, rg = x.createLinearGradient(0, y0, 0, y0 + bw);
        rg.addColorStop(0, 'rgba(255,140,200,0.75)'); rg.addColorStop(0.35, 'rgba(255,230,110,0.75)'); rg.addColorStop(0.65, 'rgba(130,240,190,0.75)'); rg.addColorStop(1, 'rgba(120,190,255,0.75)');
        x.fillStyle = rg; x.fillRect(-r * 1.5, y0, r * 3, bw);
      });
      x.restore();
      x.lineWidth = enLW; x.strokeStyle = enInk(frame); x.stroke(sf.p);
      enGloss(x, mx - rx * 0.38, my - r * 0.42, rx * 0.16, r * 0.1, -0.7, 0.95);
      enTwk(x, mx + rx * 0.32, my - r * 0.48, r * 0.3, '#ffffff', 1);
      [0, 1, 2, 3].forEach(function (k) { var an = k * Math.PI / 2 + Math.PI / 4; enDot(x, mx + Math.cos(an) * rx * 0.88, my + Math.sin(an) * r * 0.88, r * 0.06, '#fff4fa'); });
    }
  });
} };
// 번개 토끼: 레몬 노랑 아기 토끼(크림 배), 뒤로 휘날리는 긴 귀 끝은 하늘색 번개, 볼에 작은 번개 반짝, 하얀 솜꼬리. 달리는 듯 길쭉하게 날아오름
var EN_HOPB = [[0, 1.1, 0.9, 0.04], [0.42, 1.12, 0.92, 0.16], [0.86, 1.16, 0.89, 0.12], [1, 1.12, 0.92, 0.06], [0.74, 1.06, 0.96, -0.02], [0.32, 0.98, 1.03, -0.06], [0, 1.16, 0.85, 0.02], [0, 1.03, 0.98, 0.08]];
EN_DRAW.bunny = { icon: 7, f: function (x, H, p) {
  var col = '#fff07c', tip = '#d6f4ff', cream = '#fffbe8';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.78, h: 0.62, hop: 0.17, hops: EN_HOPB, fyo: 0.38, fxo: 0.16, es: 0.19, fr: 0.07, face: { iris: '#ffa0d0', mouth: 'w', mh: 1.3 },
    so: { lean: 0.06 },
    back: function (x, G) {
      // 바람 줄 (공중에서만)
      if (G.air > 0.2) [[0.3, 0.5, 1], [0.62, 0.36, 0.7]].forEach(function (q) { var y = G.by - G.h * q[0], L = G.w * q[1] * G.air; enLine(x, [[G.cx - G.w * 0.6 - L, y], [G.cx - G.w * 0.6, y]], Math.max(1.2, G.h * 0.06 * q[2]), '#fff9c8'); });
    },
    behind: function (x, G) {
      // 긴 귀 둘: 서 있을 땐 쫑긋, 뛰면 뒤로 휘날림 / 끝은 번개
      var sw = 0.3 + G.air * 0.78 + (G.i === 6 ? -0.12 : 0);
      [[1, 0.88, G.w * 0.1], [0, 1, -G.w * 0.08]].forEach(function (e) {
        var far = e[0], k = e[1], bx = G.cx + e[2], by = G.top + G.h * 0.16, a = -Math.PI / 2 - sw + far * 0.3, L = G.H * 0.6 * k, wd = G.w * 0.27 * k;
        var ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, tx = bx + ux * L * 0.78, ty = by + uy * L * 0.78;
        var ear = shp().blob([[bx - nx * wd * 0.4, by - ny * wd * 0.4], [bx + ux * L * 0.4 - nx * wd * 0.58, by + uy * L * 0.4 - ny * wd * 0.58], [tx - nx * wd * 0.46, ty - ny * wd * 0.46], [bx + ux * L * 0.9 - nx * wd * 0.1, by + uy * L * 0.9 - ny * wd * 0.1], [bx + ux * L * 0.9 + nx * wd * 0.1, by + uy * L * 0.9 + ny * wd * 0.1], [tx + nx * wd * 0.46, ty + ny * wd * 0.46], [bx + ux * L * 0.4 + nx * wd * 0.55, by + uy * L * 0.4 + ny * wd * 0.55], [bx + nx * wd * 0.4, by + ny * wd * 0.4]]);
        enJF(x, ear, far ? enShd(col, 0.1) : col, { d: wd * 0.12, rim: 0 });
        if (!enMode) { var inn = shp().blob([[bx + ux * L * 0.12, by + uy * L * 0.12], [bx + ux * L * 0.42 - nx * wd * 0.26, by + uy * L * 0.42 - ny * wd * 0.26], [bx + ux * L * 0.7, by + uy * L * 0.7], [bx + ux * L * 0.42 + nx * wd * 0.26, by + uy * L * 0.42 + ny * wd * 0.26]]); x.fillStyle = 'rgba(255,135,185,0.85)'; x.fill(inn.p); }
        enBolt(x, bx + ux * L * 0.95, by + uy * L * 0.95, L * 0.38, a - Math.PI / 2 - 0.15, far ? '#bfeaff' : tip, 0.8, col);
      });
      // 솜꼬리
      enBall(x, G.cx - G.w * 0.5, G.by - G.h * 0.3, G.w * 0.14, '#ffffff', enInk(col));
    },
    torso: function (x, G, bs) {
      if (enMode) return;
      x.save(); x.clip(bs.p); x.fillStyle = cream; x.beginPath(); x.ellipse(G.cx + G.w * 0.14, G.by - G.h * 0.06, G.w * 0.34, G.h * 0.22, 0, 0, Math.PI * 2); x.fill(); x.restore();
    },
    head: function (x, G) {
      if (enMode) return;
      // 분홍 코, 앞니 둘
      var nx = G.fx + G.R * 0.12, ny = G.fy + G.R * 0.92;
      x.fillStyle = '#ff7fae'; x.beginPath(); x.ellipse(nx, ny, G.R * 0.26, G.R * 0.18, 0, 0, Math.PI * 2); x.fill();
      var tw = G.R * 0.2, ty = G.fy + G.R * 1.36; x.fillStyle = '#ffffff'; x.strokeStyle = EN_EYEK; x.lineWidth = Math.max(0.7, G.R * 0.08);
      [-1, 1].forEach(function (s) { x.beginPath(); x.rect(nx + (s < 0 ? -tw : 0), ty, tw, tw * 1.15); x.fill(); x.stroke(); });
      // 볼에 작은 번개 반짝
      var c = enCheeks(G)[0]; enBolt(x, c[0] - G.R * 0.35, c[1] - G.R * 0.15, G.R * 1.0, 0.3, '#fffbd6', 0.7, '#ffa21a');
      enTwk(x, c[0] - G.R * 0.95, c[1] - G.R * 0.7, G.R * 0.35, '#ffffff', 0.95);
    }
  });
} };
// 방패 수호자: 연두 찹쌀떡(둥근 귀), 몸보다 큰 둥근 방패를 앞에 들고 빼꼼(하늘 테, 크림 판, 분홍 하트, 금 징), 다부진 눈썹
EN_DRAW.guard = { f: function (x, H, p) {
  var col = '#b4ea64', rimc = '#6cc2ff', plate = '#fff6e0', heart = '#ff6a9c', gold = '#ffd24d';
  EN_ONE = enInk(col);
  enMo(x, H, p, {
    col: col, w: 0.8, h: 0.68, hop: 0.06, sq: 0.8, fyo: 0.4, fxo: -0.19, es: 0.165, arms: col, farArm: 0, nearArm: 0, face: { iris: '#7fd0ff', mouth: 'w', brow: 'angry', bh: 1.3 },
    behind: function (x, G) { enRoundEars(x, G, col, 0.18, 1); },
    front: function (x, G) {
      var ry = G.H * 0.37, rx = ry * 0.8, sx = G.cx + G.w * 0.42, sy = G.by - G.h * 0.5 + G.up * G.h * 0.02;
      x.save(); x.translate(sx, sy); x.rotate(0.06 - G.tl * 0.5);
      enJF(x, enEl(0, 0, rx, ry), rimc, { d: ry * 0.1, rim: 0, hi: 0.5 });
      var pl = enEl(rx * 0.03, 0, rx * 0.76, ry * 0.79); enJF(x, pl, plate, { d: ry * 0.1, rim: 0, hi: 0.4, oc: '#d9a860' });
      enGlow(x, rx * 0.03, ry * 0.02, ry * 0.5, '#ffd0e0', 0.3);
      enHeart(x, rx * 0.04, ry * 0.06, ry * 0.42, heart);
      [0, 1, 2, 3, 4, 5].forEach(function (k) { var an = k * Math.PI / 3 + Math.PI / 6; enBall(x, Math.cos(an) * rx * 0.88, Math.sin(an) * ry * 0.885, ry * 0.055, gold); });
      enGloss(x, -rx * 0.5, -ry * 0.55, rx * 0.12, ry * 0.18, 0.5, 0.85);
      x.restore();
      // 방패 왼쪽 가장자리를 꼭 쥔 손
      enOv(x, sx - rx * 0.9, sy + ry * 0.12, G.ar * 1.15, G.ar * 0.95, col, 0.3, { d: G.ar * 0.3, rim: 0 });
    }
  });
} };
// 얼음불 쌍둥이 왕 (우두머리): 큰 젤리 몸 뒤쪽 반은 주황 불, 앞쪽 반은 하늘 얼음(가운데 흰 물결 경계), 반은 불꽃 반은 얼음 결정 금관, 보라 망토, 등에 불꽃 갈기, 어깨에 얼음 가시, 찡그린 눈썹
EN_DRAW.twinking = { f: function (x, H, p) {
  var fire = '#ff9a3e', ice = '#90d8ff', cape = '#7a5ae2', gold = '#ffd24d';
  EN_ONE = enInk(fire);
  function seam(G) {
    var pts = [], n = 16, y0 = G.top - G.h * 0.3, y1 = G.by + G.fr * 2, ph = G.p * Math.PI * 2;
    for (var k = 0; k <= n; k++) { var u = k / n, y = lerp(y0, y1, u); pts.push([G.cx + G.w * 0.03 + Math.sin(u * Math.PI * 3.2 + ph) * G.w * 0.05, y]); }
    return pts;
  }
  enMo(x, H, p, {
    col: fire, w: 0.9, h: 0.78, hop: 0.045, sq: 0.7, tilt: 0.7, fyo: 0.44, es: 0.14, fxo: 0.1, face: { iris: '#ffe08a', mouth: 'pout', brow: 'angry', bh: 1.4 },
    back: function (x, G) {
      var t = Math.sin(G.p * Math.PI * 2) * 0.05 + G.air * 0.08, cp = enCape(G, t * 0.7);
      enJF(x, cp, cape, { d: G.h * 0.06 });
      if (!enMode) { x.save(); x.clip(cp.p); x.fillStyle = 'rgba(255,214,90,0.95)'; x.fillRect(G.cx - G.w * 1.2, G.by - G.fr * 0.2 - G.h * 0.06, G.w * 1.2, G.h * 0.07); x.restore(); }
    },
    behind: function (x, G) {
      // 등 쪽 불꽃 갈기 셋, 어깨 앞쪽 얼음 가시 둘
      var a = G.p * Math.PI * 2;
      [[-0.44, 0.42, 0.3, -0.8], [-0.5, 0.64, 0.24, -0.95], [-0.36, 0.24, 0.26, -0.7]].forEach(function (f, j) { var fl = 1 + Math.sin(a * 2 + j * 2) * 0.08; enFlame(x, G.cx + f[0] * G.w, G.top + f[1] * G.h, G.w * 0.2, G.h * f[2] * fl, f[3] - G.air * 0.2 + Math.sin(a * 2 + j) * 0.08, 0); });
      enCrystal(x, G.cx + G.w * 0.4, G.top + G.h * 0.3, G.h * 0.26, 0.7, '#c9f2ff');
      enCrystal(x, G.cx + G.w * 0.47, G.top + G.h * 0.48, G.h * 0.18, 1.1, '#9fe6ff');
    },
    torso: function (x, G, bs) {
      // 앞쪽 반: 얼음 (외곽선도 얼음 색)
      var sp = seam(G), R = new Path2D(), k;
      R.moveTo(sp[0][0], sp[0][1]); for (k = 1; k < sp.length; k++) R.lineTo(sp[k][0], sp[k][1]);
      R.lineTo(G.cx + G.w * 2, sp[sp.length - 1][1]); R.lineTo(G.cx + G.w * 2, sp[0][1]); R.closePath();
      x.save(); x.clip(R); enJF(x, bs, ice, { d: G.h * 0.1, hi: 0.6, rim: 1 }); x.restore();
      if (enMode) return;
      x.save(); x.clip(bs.p);
      // 불 쪽: 노란 불빛과 불씨, 얼음 쪽: 눈송이와 반짝
      var g = x.createRadialGradient(G.cx - G.w * 0.22, G.by - G.h * 0.2, 0, G.cx - G.w * 0.22, G.by - G.h * 0.2, G.w * 0.42);
      g.addColorStop(0, 'rgba(255,232,130,0.7)'); g.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = g; x.fillRect(G.cx - G.w, G.by - G.h, G.w, G.h * 1.2);
      x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineCap = 'round'; x.lineWidth = Math.max(1, G.w * 0.012);
      [[0.3, 0.2, 0.05], [0.4, 0.42, 0.035]].forEach(function (f) { var fx = G.cx + f[0] * G.w, fy = G.by - f[1] * G.h, r = G.w * f[2]; for (var j = 0; j < 3; j++) { var an = j * Math.PI / 3; x.beginPath(); x.moveTo(fx + Math.cos(an) * r, fy + Math.sin(an) * r); x.lineTo(fx - Math.cos(an) * r, fy - Math.sin(an) * r); x.stroke(); } });
      // 가운데 물결 경계
      x.beginPath(); x.moveTo(sp[0][0], sp[0][1]); for (k = 1; k < sp.length; k++) x.lineTo(sp[k][0], sp[k][1]);
      x.lineJoin = 'round'; x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = Math.max(1.5, G.w * 0.022); x.stroke();
      x.restore();
      enGloss(x, G.cx + G.w * 0.18, G.top + G.h * 0.22, G.w * 0.05, G.h * 0.035, -0.5, 0.7);
      [[-0.36, 0.3], [-0.12, 0.12]].forEach(function (d, j) { enDot(x, G.cx + d[0] * G.w, G.by - d[1] * G.h, G.w * 0.018, j ? '#ffe066' : '#fff3a0', 0.9); });
      enTwk(x, G.cx + G.w * 0.22, G.by - G.h * 0.12, G.w * 0.05, '#ffffff', 0.95);
    },
    head: function (x, G) {
      // 왕관: 금 띠 위에 뒤쪽 불꽃 둘, 앞쪽 얼음 결정 둘, 가운데 보석
      var cx = G.cx + G.w * 0.02, cb = G.top + G.h * 0.13, cw = G.w * 0.62, a = G.p * Math.PI * 2;
      enFlame(x, cx - cw * 0.3, cb - G.h * 0.03, cw * 0.24, G.h * 0.3 * (1 + Math.sin(a * 2) * 0.06), -0.12, 0.35);
      enFlame(x, cx - cw * 0.08, cb - G.h * 0.04, cw * 0.26, G.h * 0.38 * (1 + Math.sin(a * 2 + 2) * 0.06), -0.06, 0);
      enCrystal(x, cx + cw * 0.14, cb, G.h * 0.36, 0.08, '#c9f2ff');
      enCrystal(x, cx + cw * 0.34, cb + G.h * 0.01, G.h * 0.27, 0.36, '#9fe6ff');
      enMtl(x, shp().rrect(cx - cw * 0.52, cb - G.h * 0.075, cw * 1.04, G.h * 0.14, G.h * 0.06), gold);
      enOv(x, cx + cw * 0.02, cb - G.h * 0.005, G.w * 0.045, G.w * 0.05, '#ff5df0', 0, { d: G.w * 0.01, rim: 0, hi: 0.7 });
      [-0.34, 0.36].forEach(function (u) { enDot(x, cx + cw * u, cb - G.h * 0.005, G.w * 0.018, u < 0 ? '#ff6a3a' : '#5fc8ff'); });
    }
  });
} };

// ---------- 스프라이트 만들기 ----------
var EN_MX = null;
// 세 번 그리기: 크기 재기 → 외곽선 → 색칠. 이미지 읽기 없이 꼭 맞는 크기로 만듦
function enMake(H, ol, fn) {
  enOL = ol;
  if (!EN_MX) EN_MX = cx2(mkC(2, 2));
  var mx = EN_MX, b = null;
  if (mx.getTransform) {
    enMode = 2; enBB = [1e9, 1e9, -1e9, -1e9];
    mx.setTransform(1, 0, 0, 1, 0, 0); mx.save(); fn(mx); mx.restore();
    b = enBB;
  }
  enMode = 0;
  if (!b || b[2] < b[0]) b = [-H * 1.1, -H * 1.5, H * 1.1, H * 0.45];
  var rw = EN_RIMW, pd = Math.ceil(rw * 1.2) + 1;
  var x0 = Math.floor(b[0]) - pd, y0 = Math.floor(b[1]) - pd, w = Math.ceil(b[2]) + pd - x0, h = Math.ceil(b[3]) + pd - y0;
  var c = mkC(w, h), x = cx2(c), cw = mkC(w, h), xw = cx2(cw);
  xw.translate(-x0, -y0); xw.lineJoin = 'round'; xw.lineCap = 'round';
  enMode = 1; xw.save(); fn(xw); xw.restore();
  x.drawImage(cw, 0, 0);
  x.translate(-x0, -y0); x.lineJoin = 'round'; x.lineCap = 'round';
  EN_EYES = []; enMode = 0; x.save(); fn(x); x.restore();
  // 외곽선 그림을 흰 실루엣으로(맞을 때 번쩍) → 대각선 네 방향으로 밀어 뒤에 깔아 흰 스티커 테두리
  xw.setTransform(1, 0, 0, 1, 0, 0); xw.globalCompositeOperation = 'source-in'; xw.fillStyle = '#ffffff'; xw.fillRect(0, 0, w, h); xw.globalCompositeOperation = 'source-over';
  if (rw > 0) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-over'; for (var i = 0; i < 4; i++) { var an = i * Math.PI / 2 + Math.PI / 4; x.drawImage(cw, Math.cos(an) * rw * 1.2, Math.sin(an) * rw * 1.2); } x.globalCompositeOperation = 'source-over'; }
  // 흰 실루엣 위에 > < 질끈 감은 눈
  for (var j = 0; j < EN_EYES.length; j++) enOuch(xw, EN_EYES[j]);
  return { c: c, ax: -x0, ay: -y0, wh: cw };
}
function enemyFrames(k, S) {
  var key = k + ':' + Math.round(S); if (EN_SPR[key]) return EN_SPR[key];
  var E = ENEMIES[k], vis = enVis(E), H = vis * S, D = EN_DRAW[k] || EN_DRAW[E.art] || EN_DRAW.goblin, n = D.n || NFR, out = { fr: [], wh: [], n: n, h: H };
  enLW = Math.max(1, S * 0.02); EN_RIMW = Math.max(1, S * 0.02); EN_ONE = null;
  var ol = Math.max(1.3, S * (0.024 + 0.005 * vis));
  for (var i = 0; i < n; i++) {
    var tr = enMake(H, ol, function (x) { D.f(x, H, i / n); });
    out.fr.push({ c: tr.c, ax: tr.ax, ay: tr.ay }); out.wh.push({ c: tr.wh, ax: tr.ax, ay: tr.ay });
  }
  if (D.kneel) { var kn = enMake(H, ol, function (x) { D.kneel(x, H); }); out.kneel = { c: kn.c, ax: kn.ax, ay: kn.ay }; }
  // 위에서 본 적(거미)은 전투에서 진행 방향으로 돌려 그리므로, 아이콘용으로 아래로 걷는 모습(얼굴 바로)을 따로 둠 (out.icon, 쓰는 쪽에서 fr.icon || fr.fr[1])
  if (D.icon != null) out.icon = out.fr[D.icon]; // 아이콘에 쓸 장면 (번개 토끼: 귀 쫑긋 선 모습)
  if (D.top) { var ic = enMake(H, ol, function (x) { var cy = -H * 0.46 / 3; x.translate(0, cy); x.rotate(Math.PI / 2); x.translate(0, -cy); D.f(x, H, 1 / n); }); out.icon = { c: ic.c, ax: ic.ax, ay: ic.ay }; }
  return (EN_SPR[key] = out);
}
