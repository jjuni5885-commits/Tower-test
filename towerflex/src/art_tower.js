// ===== art_tower.js : 탑 10종 그림 (귀염판 → v2.0: 1, 2, 3단계 + 갈래 A/B의 4, 5, 6단계 = 탑마다 9모습) =====
// v2.0(TW1): 6단계 궁극 그림 TB6(갈래마다 한 모습, 20개), 움직이는 부분 TWP(조준 회전, 반동, 맥동), 작은 칸용 실루엣 테두리(twOutlineUnder)
// 시험: python3 tools/tw1shot.py <이름> '<__tw.sheet 옵션>' (그림판), python3 tools/tw1shot.py cost (그림 만드는 시간, 프레임 시간), icons (아이콘)
// 탑 한 개 = 뒤 그림(back) + 움직이는 부분(머리, 궁수, 불꽃: 그릴 때) + 앞 그림(front, 앞쪽 성가퀴)
// 귀염판 원칙: 사탕 색, 둥근 모양, 자두빛 그늘, 같은 색 계열 테두리(잉크), 반짝 광택
var TC = { stone: '#efd8bb', stoneD: '#dcbc98', wood: '#f0ad62', woodD: '#c98048', iron: '#9d92cc', steel: '#c9c1ec', gold: '#ffd24a', bronze: '#f6a94c',
  royal: '#5fb2ff', red: '#ff6f9f', arcane: '#a98bff', ice: '#a6e8ff', fire: '#ff9a4a', poison: '#a6ec5c', slate: '#8a94d6',
  pink: '#ff8fc0', hot: '#ff5d9e', peach: '#ffb38a', lemon: '#ffe066', mint: '#7fe0c4', sky: '#7cc8ff', lav: '#b9a2ff', grape: '#8a6cff', cream: '#fff6e8', plum: '#4a2a5a', skin: '#ffe2cf' };
var TOWER_SPR = {};
// v2.0 새 탑 그림 등록: TW_EXT[탑 키] = { spr: function (L, B, S) → { back: {c, ax, ay}, front: {c, ax, ay}, mounts: [[dx, dy]], k: 배율 }, parts: function (x, t, X, Y, S, time, info, g) }
var TW_EXT = {};
var TW_IW = 1.5; // 지금 그리는 그림의 테두리 굵기
var TW_SK = null; // 지금 그리는 그림의 탑 스킨(null = 기본). 아래 칠 도구가 스킨일 때만 색을 바꿈 (맨 아래 '탑 스킨' 참고)
var TW_SZ = 60; // 스킨 무늬 크기 기준(지금 그리는 탑의 sz)
// ---------- 귀염판 칠 도구 ----------
function twSh(c, k) { if (TW_SK) c = twK(c); return mixc(c, '#5e3a7c', k); } // 자두빛 그늘
function twLt(c, k) { if (TW_SK) c = twK(c); return mixc(c, '#fffaf2', k); } // 크림빛 밝음
function twInkC(c) { if (TW_SK) c = twK(c); return mixc(c, '#4a2a5a', 0.62); }
function twInk(x, s, c, w, a) { x.save(); if (a != null) x.globalAlpha = a; x.strokeStyle = twInkC(c); x.lineWidth = w == null ? TW_IW : w; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(s.p); x.restore(); }
function twFill(x, s, base, o) {
  o = o || {};
  if (TW_SK) base = twK(base);
  var g = x.createLinearGradient(s.x0 + s.w() * (o.ax == null ? 0.2 : o.ax), s.y0, s.x0 + s.w() * (o.bx == null ? 0.78 : o.bx), s.y1);
  g.addColorStop(0, twLt(base, o.hi == null ? 0.38 : o.hi)); g.addColorStop(o.mid == null ? 0.45 : o.mid, base); g.addColorStop(1, twSh(base, o.lo == null ? 0.26 : o.lo));
  x.fillStyle = g; x.fill(s.p);
}
// 원통 음영: 왼쪽 반짝, 오른쪽 자두빛, 맨 끝 반사광
function twCylG(x, s, base, o) {
  o = o || {};
  if (TW_SK) base = twK(base);
  var g = x.createLinearGradient(s.x0, 0, s.x1, 0);
  g.addColorStop(0, twSh(base, 0.1)); g.addColorStop(0.16, twLt(base, o.hi == null ? 0.42 : o.hi)); g.addColorStop(0.34, twLt(base, 0.12));
  g.addColorStop(0.64, base); g.addColorStop(0.9, twSh(base, o.lo == null ? 0.3 : o.lo)); g.addColorStop(1, twSh(base, 0.17));
  x.fillStyle = g; x.fill(s.p);
}
function twShine(x, cx, cy, rx, ry, a, rot) { x.save(); x.globalAlpha = a == null ? 0.7 : a; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(cx, cy, Math.max(0.4, rx), Math.max(0.3, ry), rot == null ? -0.5 : rot, 0, Math.PI * 2); x.fill(); x.restore(); }
// 땅 그림자(자두빛)
function twShadow(x, cx, cy, rx, ry, a) {
  if (rx <= 0 || ry <= 0) return;
  x.save(); x.translate(cx, cy); x.scale(1, ry / rx);
  var g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, 'rgba(74,38,96,' + a + ')'); g.addColorStop(0.6, 'rgba(74,38,96,' + a * 0.55 + ')'); g.addColorStop(1, 'rgba(74,38,96,0)');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, Math.PI * 2); x.fill(); x.restore();
}
function twHeartP(p, cx, cy, r) {
  p.moveTo(cx, cy + r * 0.9);
  p.bezierCurveTo(cx - r * 1.35, cy + r * 0.02, cx - r * 0.8, cy - r * 1.1, cx, cy - r * 0.36);
  p.bezierCurveTo(cx + r * 0.8, cy - r * 1.1, cx + r * 1.35, cy + r * 0.02, cx, cy + r * 0.9);
  p.closePath();
}
function twStarP(p, cx, cy, r, ri, n) { n = n || 5; ri = ri || r * 0.5; for (var q = 0; q < n * 2; q++) { var rr = q % 2 ? ri : r, a = -Math.PI / 2 + q * Math.PI / n; if (q) p.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else p.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } p.closePath(); }
function twHeart(x, cx, cy, r, col) { var s = shp(); twHeartP(s.p, cx, cy, r); s.ext(cx - r * 1.1, cy - r * 0.9); s.ext(cx + r * 1.1, cy + r * 0.9); twFill(x, s, col, { hi: 0.35, lo: 0.2 }); twInk(x, s, col, TW_IW * 0.6); twShine(x, cx - r * 0.42, cy - r * 0.3, r * 0.22, r * 0.14, 0.75); return s; }
function twStar(x, cx, cy, r, col, ink) { if (TW_SK) col = twK(col); var s = shp(); twStarP(s.p, cx, cy, r); s.ext(cx - r, cy - r); s.ext(cx + r, cy + r); x.save(); x.lineJoin = 'round'; x.strokeStyle = col; x.lineWidth = r * 0.35; x.stroke(s.p); x.restore(); twFill(x, s, col, { hi: 0.4, lo: 0.15 }); if (ink !== 0) twInk(x, s, col, TW_IW * 0.5, 0.8); return s; }
// 반짝 별(네 갈래 빛)
function twTwinkle(x, cx, cy, r, a) { x.save(); x.globalAlpha = a == null ? 0.95 : a; x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(cx, cy - r); x.quadraticCurveTo(cx + r * 0.16, cy - r * 0.16, cx + r, cy); x.quadraticCurveTo(cx + r * 0.16, cy + r * 0.16, cx, cy + r); x.quadraticCurveTo(cx - r * 0.16, cy + r * 0.16, cx - r, cy); x.quadraticCurveTo(cx - r * 0.16, cy - r * 0.16, cx, cy - r); x.fill(); x.restore(); }
function twPill(x, cx, cy, w, h) { var r = Math.min(w, h) / 2; x.beginPath(); x.moveTo(cx - w / 2 + r, cy - h / 2); x.arcTo(cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2, r); x.arcTo(cx + w / 2, cy + h / 2, cx - w / 2, cy + h / 2, r); x.arcTo(cx - w / 2, cy + h / 2, cx - w / 2, cy - h / 2, r); x.arcTo(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2, r); x.closePath(); x.fill(); }
function twLeg(x, x0, y0, x1, y1, w0, w1, col) { var s = limbShape(x0, y0, x1, y1, w0, w1); twFill(x, s, col, { hi: 0.32, lo: 0.22 }); twInk(x, s, col, TW_IW * 0.8); return s; }
// 원통 벽돌: 둥근 알약 벽돌 몇 개와 옅은 줄눈(원통 곡면을 따라)
function twCylBricks(x, s, cx, topY, rx, ry, h, base, rows, cols, rnd) {
  x.save(); x.clip(s.p);
  var rh = h / rows;
  x.lineWidth = Math.max(0.6, TW_IW * 0.6); x.strokeStyle = rgba(twSh(base, 0.55), 0.3);
  for (var r = 1; r < rows; r++) { x.beginPath(); x.ellipse(cx, topY + rh * r, rx, ry, 0, 0.05, Math.PI - 0.05); x.stroke(); }
  for (var r2 = 0; r2 < rows; r2++) {
    var off = (r2 % 2) * 0.5;
    for (var c = 0; c < cols; c++) {
      if (rnd() > 0.62) continue;
      var u = (c + off + 0.5) / cols; if (u >= 1) u -= 1;
      var th = Math.PI * (1 - u), sn = Math.sin(th), bx = cx + Math.cos(th) * rx, by = topY + rh * (r2 + 0.5) + sn * ry;
      var bw = rx * sn * Math.PI / cols * 0.74, bh = rh * 0.58;
      if (bw < 2 || bh < 1.2) continue;
      x.fillStyle = rnd() < 0.72 ? rgba(twLt(base, 0.85), 0.7 * (0.3 + 0.7 * (1 - u))) : rgba(twSh(base, 0.35), 0.16);
      twPill(x, bx, by, bw, bh);
    }
  }
  x.restore();
}
function twPlanks(x, s, cx, rx, base, n) {
  x.save(); x.clip(s.p); x.strokeStyle = rgba(twSh(base, 0.5), 0.32); x.lineWidth = Math.max(0.6, TW_IW * 0.55);
  for (var i = 1; i < n; i++) { var px = cx - rx * Math.cos(i / n * Math.PI); x.beginPath(); x.moveTo(px, s.y0); x.lineTo(px, s.y1 + 2); x.stroke(); }
  x.restore();
}
function twCyl(x, cx, topY, rx, ry, h, col, rnd, o) {
  o = o || {};
  if (TW_SK && (o.stone || (o.wood && TW_SK.woodBody))) return twSkBody(x, cx, topY, rx, ry, h, col, rnd, o);
  var s = shp(); s.p.moveTo(cx - rx, topY); s.p.ellipse(cx, topY, rx, ry, 0, Math.PI, 0, true); s.p.lineTo(cx + rx, topY + h); s.p.ellipse(cx, topY + h, rx, ry, 0, 0, Math.PI, false); s.p.closePath();
  s.ext(cx - rx, topY); s.ext(cx + rx, topY + h + ry);
  twCylG(x, s, col, o);
  if (o.stone && rnd) twCylBricks(x, s, cx, topY, rx, ry, h, col, o.rows || Math.max(2, Math.round(h / (rx * 0.36))), o.cols || 5, rnd);
  if (o.wood) twPlanks(x, s, cx, rx, col, 7);
  // 땅 닿는 아래쪽 그늘
  x.save(); x.clip(s.p); var gb = x.createLinearGradient(0, topY + h - ry * 0.4, 0, topY + h + ry); gb.addColorStop(0, rgba(twSh(col, 0.6), 0)); gb.addColorStop(1, rgba(twSh(col, 0.6), 0.3)); x.fillStyle = gb; x.fillRect(cx - rx, topY + h - ry, rx * 2, ry * 2.2); x.restore();
  if (o.bands) o.bands.forEach(function (b) {
    var Y = topY + h * b, bh = Math.max(rx * 0.16, 2), bc = o.bandCol || TC.gold;
    var bs = shp(); bs.p.moveTo(cx - rx, Y); bs.p.ellipse(cx, Y, rx, ry, 0, Math.PI, 0, true); bs.p.lineTo(cx + rx, Y + bh); bs.p.ellipse(cx, Y + bh, rx, ry, 0, 0, Math.PI, false); bs.p.closePath(); bs.ext(cx - rx, Y); bs.ext(cx + rx, Y + bh + ry);
    twCylG(x, bs, bc, { hi: 0.55 }); twInk(x, bs, bc, TW_IW * 0.7);
  });
  twInk(x, s, col);
  var t = shp().ell(cx, topY, rx, ry);
  if (!o.noTop) { twFill(x, t, o.top || twLt(col, 0.18), { hi: 0.3, lo: 0.1 }); twInk(x, t, col, TW_IW * 0.85); }
  return { side: s, top: t };
}
// 성가퀴: 둥근 모서리 돌 블록, 갈래 색 모자. 뒤쪽은 back에, 앞쪽은 front에
function twMerlons(xb, xf, cx, topY, rx, ry, n, h, col, cap) {
  if (TW_SK && !cap) cap = TW_SK.mCap;
  for (var k = 0; k < n; k++) {
    var a = Math.PI + (k + 0.5) / n * Math.PI * 2, px = cx + Math.cos(a) * rx * 0.9, py = topY + Math.sin(a) * ry * 0.9, w = Math.PI * 2 * rx / n * 0.5;
    var front = Math.sin(a) > 0.05, x = front ? xf : xb;
    var hh = Math.max(h, w * 0.9), rr = Math.min(w, hh) * 0.3, m = shp().rrect(px - w / 2, py - hh, w, hh + ry * 0.16, rr);
    twFill(x, m, col, { hi: 0.4, lo: 0.26 });
    x.save(); x.clip(m.p);
    if (cap) { var cp = shp().rrect(px - w / 2 - 2, py - hh - 2, w + 4, hh * 0.44 + 2, 0); twFill(x, cp, cap, { hi: 0.45, lo: 0.18 }); x.strokeStyle = twInkC(cap); x.lineWidth = TW_IW * 0.6; x.beginPath(); x.moveTo(px - w / 2, py - hh * 0.56); x.lineTo(px + w / 2, py - hh * 0.56); x.stroke(); }
    else { x.fillStyle = rgba(twLt(col, 0.6), 0.75); x.fillRect(px - w / 2, py - hh, w, Math.max(1.5, hh * 0.22)); }
    x.restore();
    twInk(x, m, cap || col, TW_IW * 0.8);
    twShine(x, px - w * 0.2, py - hh + Math.min(w, hh) * 0.22, w * 0.1, w * 0.06, 0.65);
  }
}
// 깃발: 가운데 크림 띠, 아래는 물결, 가운데 하트
function twBanner(x, cx, topY, w, h, col, trim, emblem) {
  if (TW_SK) col = TW_SK.flag[col] || col;
  var s = shp(), p = s.p, n = 3, by = topY + h * 0.8;
  p.moveTo(cx - w / 2, topY); p.lineTo(cx + w / 2, topY); p.lineTo(cx + w / 2, by);
  for (var i = 0; i < n; i++) { var xa = cx + w / 2 - w * i / n, xb2 = cx + w / 2 - w * (i + 1) / n; p.quadraticCurveTo((xa + xb2) / 2, topY + h * 1.08, xb2, by); }
  p.closePath(); s.ext(cx - w / 2, topY); s.ext(cx + w / 2, topY + h);
  twFill(x, s, col, { hi: 0.34, lo: 0.28 });
  x.save(); x.clip(p); x.fillStyle = rgba(trim || '#fff6e8', 0.85); x.fillRect(cx - w * 0.17, topY, w * 0.34, h * 1.2); x.restore();
  twInk(x, s, col, TW_IW * 0.8);
  if (emblem && TW_SK && TW_SK.emblem) TW_SK.emblem(x, cx, topY + h * 0.44, w * 0.2, emblem);
  else if (emblem) twHeart(x, cx, topY + h * 0.44, w * 0.2, emblem);
  var rod = shp().rrect(cx - w * 0.64, topY - w * 0.1, w * 1.28, w * 0.15, w * 0.07); twFill(x, rod, TC.woodD, { hi: 0.4 }); twInk(x, rod, TC.woodD, TW_IW * 0.6);
  [-1, 1].forEach(function (sd) { var k = shp().ell(cx + sd * w * 0.66, topY - w * 0.025, w * 0.1, w * 0.1); twFill(x, k, TC.gold, { hi: 0.5 }); twInk(x, k, TC.gold, TW_IW * 0.5); });
}
// 작은 삼각 깃발 + 깃대
function twFlag(x, px, baseY, poleH, sz, col, sd) {
  sd = sd || 1;
  if (TW_SK) col = TW_SK.flag[col] || col;
  twLeg(x, px, baseY, px, baseY - poleH, sz * 0.026, sz * 0.022, TC.woodD);
  var fy = baseY - poleH, f = shp(); f.p.moveTo(px, fy + sz * 0.01); f.p.quadraticCurveTo(px + sd * sz * 0.1, fy + sz * 0.02, px + sd * sz * 0.2, fy + sz * 0.065); f.p.quadraticCurveTo(px + sd * sz * 0.1, fy + sz * 0.1, px, fy + sz * 0.13); f.p.closePath(); f.ext(px - sz * 0.2, fy); f.ext(px + sz * 0.2, fy + sz * 0.13);
  twFill(x, f, col, { hi: 0.35 }); twInk(x, f, col, TW_IW * 0.7);
  if (TW_SK) { TW_SK.finial(x, px, fy - sz * 0.012, sz * 0.026); return; }
  var b = shp().ell(px, fy - sz * 0.012, sz * 0.026, sz * 0.026); twFill(x, b, TC.gold, { hi: 0.5 }); twInk(x, b, TC.gold, TW_IW * 0.5);
}
// 고깔 지붕: 살짝 부푼 모양, 사탕 줄무늬, 처마 크림 방울, 꼭대기 구슬
function twRoof(x, cx, baseY, rx, ry, h, col, o) {
  o = o || {};
  if (TW_SK) return twSkRoof(x, cx, baseY, rx, ry, h, col, o);
  var ap = baseY - h, s = shp(), p = s.p;
  p.moveTo(cx - rx, baseY); p.quadraticCurveTo(cx - rx * 0.68, baseY - h * 0.52, cx, ap); p.quadraticCurveTo(cx + rx * 0.68, baseY - h * 0.52, cx + rx, baseY);
  p.ellipse(cx, baseY, rx, ry, 0, 0, Math.PI, false); p.closePath(); s.ext(cx - rx, ap); s.ext(cx + rx, baseY + ry);
  var g = x.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, twLt(col, 0.2)); g.addColorStop(0.3, twLt(col, 0.38)); g.addColorStop(0.62, col); g.addColorStop(1, twSh(col, 0.34));
  x.fillStyle = g; x.fill(p);
  x.save(); x.clip(p);
  var n = o.n || 6;
  if (o.stripe) {
    x.fillStyle = rgba(o.stripe, o.sa == null ? 0.6 : o.sa);
    for (var k = 0; k < n; k += 2) {
      var t0 = -Math.cos(k / n * Math.PI), t1 = -Math.cos((k + 1) / n * Math.PI);
      x.beginPath(); x.moveTo(cx, ap - 2);
      for (var q = 0; q <= 8; q++) { var tt = lerp(t0, t1, q / 8); x.lineTo(cx + rx * tt * 1.02, baseY + ry * Math.sqrt(Math.max(0, 1 - tt * tt)) + 2); }
      x.closePath(); x.fill();
    }
  }
  // 아래 그늘과 왼쪽 긴 광택
  var gs = x.createLinearGradient(0, baseY - h * 0.2, 0, baseY + ry); gs.addColorStop(0, rgba(twSh(col, 0.5), 0)); gs.addColorStop(1, rgba(twSh(col, 0.5), 0.28)); x.fillStyle = gs; x.fillRect(cx - rx, baseY - h * 0.2, rx * 2, h * 0.2 + ry);
  x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = Math.max(1, rx * 0.09); x.lineCap = 'round';
  x.beginPath(); x.moveTo(cx - rx * 0.12, ap + h * 0.16); x.quadraticCurveTo(cx - rx * 0.42, baseY - h * 0.45, cx - rx * 0.58, baseY - h * 0.08); x.stroke();
  x.restore();
  twInk(x, s, col);
  if (o.trim) { // 처마 띠
    x.save(); x.lineCap = 'round'; x.beginPath(); x.ellipse(cx, baseY, rx * 0.98, ry * 0.98, 0, 0.08, Math.PI - 0.08);
    x.strokeStyle = twInkC(o.trim); x.lineWidth = Math.max(1.5, rx * 0.1) + TW_IW * 1.3; x.stroke(); x.strokeStyle = o.trim; x.lineWidth = Math.max(1.5, rx * 0.1); x.stroke(); x.restore();
  }
  if (o.ball) { var bl = shp().ell(cx, ap - rx * 0.05, rx * 0.12, rx * 0.12); twFill(x, bl, o.ball, { hi: 0.5 }); twInk(x, bl, o.ball, TW_IW * 0.7); twShine(x, cx - rx * 0.04, ap - rx * 0.09, rx * 0.04, rx * 0.028, 0.9); }
  return s;
}
function twDeck(x, cx, topY, rx, ry, col, rnd) {
  var t = shp().ell(cx, topY, rx, ry); twFill(x, t, col, { hi: 0.32, lo: 0.18 });
  x.save(); x.clip(t.p); x.strokeStyle = rgba(twSh(col, 0.5), 0.32); x.lineWidth = Math.max(0.6, TW_IW * 0.55);
  for (var i = -4; i <= 4; i++) { x.beginPath(); x.moveTo(cx + rx * i / 4.6, topY - ry); x.lineTo(cx + rx * i / 4.6, topY + ry); x.stroke(); }
  x.restore(); twInk(x, t, col, TW_IW * 0.85);
}
function twRail(xb, xf, cx, topY, rx, ry, h, col) {
  [xb, xf].forEach(function (x, f) {
    for (var k = 0; k < 7; k++) {
      var a = (f ? 0.22 : Math.PI + 0.22) + k / 6 * (Math.PI - 0.44), px = cx + Math.cos(a) * rx, py = topY + Math.sin(a) * ry, pw = Math.max(1.6, h * 0.24);
      var ps = shp().rrect(px - pw / 2, py - h, pw, h, pw / 2); twFill(x, ps, col, { hi: 0.35 }); twInk(x, ps, col, TW_IW * 0.55);
    }
    x.lineCap = 'round'; x.beginPath(); if (f) x.ellipse(cx, topY - h, rx, ry, 0, 0.12, Math.PI - 0.12); else x.ellipse(cx, topY - h, rx, ry, 0, Math.PI + 0.12, Math.PI * 2 - 0.12);
    x.strokeStyle = twInkC(col); x.lineWidth = Math.max(1.4, rx * 0.075) + TW_IW * 1.2; x.stroke();
    x.strokeStyle = twLt(col, 0.2); x.lineWidth = Math.max(1.4, rx * 0.075); x.stroke();
  });
}
function twPosts(x, cx, gy, topY, rx, ry, col) {
  x.save(); x.strokeStyle = twInkC(col); x.lineCap = 'round'; x.lineWidth = Math.max(1, rx * 0.08) + TW_IW;
  var br = [[cx - rx * 0.84, gy + ry * 0.25, cx + rx * 0.84, topY + ry * 0.3], [cx + rx * 0.84, gy + ry * 0.25, cx - rx * 0.84, topY + ry * 0.3]];
  br.forEach(function (b) { x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(b[2], b[3]); x.stroke(); });
  x.strokeStyle = twSh(col, 0.08); x.lineWidth = Math.max(1, rx * 0.08); br.forEach(function (b) { x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(b[2], b[3]); x.stroke(); });
  x.restore();
  [[-0.78, -0.55], [0.78, -0.55], [-0.84, 0.5], [0.84, 0.5]].forEach(function (p, i) {
    var px = cx + p[0] * rx, pyT = topY + p[1] * ry * 0.6, pyB = gy + p[1] * ry * 0.5;
    twLeg(x, px, pyB, px * 0.98 + cx * 0.02, pyT, rx * 0.19, rx * 0.15, i < 2 ? twSh(col, 0.12) : col);
  });
}
// 화로: 연보라 그릇 + 금 테
function twBrazier(x, cx, cy, r, glow, bowl) {
  bowl = bowl || '#b9a2f0';
  var b = shp(); b.p.moveTo(cx - r, cy - r * 0.3); b.p.quadraticCurveTo(cx - r * 0.95, cy + r * 0.75, cx, cy + r * 0.8); b.p.quadraticCurveTo(cx + r * 0.95, cy + r * 0.75, cx + r, cy - r * 0.3); b.p.closePath(); b.ext(cx - r, cy - r * 0.3); b.ext(cx + r, cy + r * 0.8);
  twFill(x, b, bowl, { hi: 0.45 }); twInk(x, b, bowl, TW_IW * 0.7); twShine(x, cx - r * 0.5, cy + r * 0.1, r * 0.12, r * 0.22, 0.6, 0.4);
  var t = shp().ell(cx, cy - r * 0.3, r, r * 0.36); x.fillStyle = '#6a3a6e'; x.fill(t.p);
  x.save(); x.strokeStyle = TC.gold; x.lineWidth = Math.max(1, r * 0.16); x.beginPath(); x.ellipse(cx, cy - r * 0.3, r, r * 0.36, 0, 0, Math.PI * 2); x.stroke(); x.restore();
  if (glow) { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy - r * 0.4, r * 1.5, glow, 0.7); x.restore(); }
}
// 보석: 깎은 면 + 반짝
function twGem(x, cx, cy, r, col) {
  if (TW_SK && TW_SK.gem) return TW_SK.gem(x, cx, cy, r, col);
  var s = shp().poly([[cx, cy - r * 1.35], [cx + r * 0.8, cy - r * 0.25], [cx, cy + r], [cx - r * 0.8, cy - r * 0.25]]);
  x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy, r * 3.2, col, 0.5); x.restore();
  twFill(x, s, col, { hi: 0.5, lo: 0.25 });
  var l = shp().poly([[cx, cy - r * 1.35], [cx, cy + r], [cx - r * 0.8, cy - r * 0.25]]); x.fillStyle = rgba('#ffffff', 0.38); x.fill(l.p);
  var tp = shp().poly([[cx, cy - r * 1.35], [cx + r * 0.8, cy - r * 0.25], [cx - r * 0.8, cy - r * 0.25]]); x.fillStyle = rgba('#ffffff', 0.25); x.fill(tp.p);
  twInk(x, s, col, Math.max(0.7, r * 0.18));
  twTwinkle(x, cx - r * 0.3, cy - r * 0.55, r * 0.45, 0.95);
}
// 수정 구슬: 동그란 광택 구
function twOrb(x, cx, cy, r, col) {
  x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy, r * 2.4, col, 0.5); x.restore();
  var s = shp().ell(cx, cy, r, r), g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.32, twLt(col, 0.45)); g.addColorStop(0.78, col); g.addColorStop(1, twSh(col, 0.3));
  x.fillStyle = g; x.fill(s.p); twInk(x, s, col, Math.max(0.8, r * 0.13));
  twShine(x, cx - r * 0.36, cy - r * 0.42, r * 0.28, r * 0.17, 0.92, -0.6); twShine(x, cx + r * 0.4, cy + r * 0.36, r * 0.1, r * 0.07, 0.55);
  twTwinkle(x, cx + r * 0.45, cy - r * 0.55, r * 0.42, 0.9);
}
// 동그란 창(따뜻한 불빛)
function twWindow(x, cx, cy, w, h, glow) {
  var f = shp().rrect(cx - w / 2 - w * 0.18, cy - h / 2 - w * 0.18, w * 1.36, h + w * 0.36, w * 0.68); twFill(x, f, TC.cream, { hi: 0.3 }); twInk(x, f, TC.stoneD, TW_IW * 0.6);
  var s = shp().rrect(cx - w / 2, cy - h / 2, w, h, w / 2); var g = x.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); g.addColorStop(0, glow ? '#fff3b0' : '#7a5a9a'); g.addColorStop(1, glow ? '#ffb45a' : '#4a2a5a'); x.fillStyle = g; x.fill(s.p);
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = Math.max(0.6, w * 0.12); x.beginPath(); x.moveTo(cx, cy - h / 2); x.lineTo(cx, cy + h / 2); x.moveTo(cx - w / 2, cy); x.lineTo(cx + w / 2, cy); x.stroke(); x.restore();
}
// ---------- 탑 몸체 그리기 ----------
// 반환: {mount:[dx,dy](sz 단위), mounts:[...]}
var TB = {
  archer: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var A = L >= 4 && B === 0, V = L >= 4 && B === 1;
    if (L === 1) {
      var top = gy - sz * 0.92; twPosts(xb, gx, gy - sz * 0.06, top, sz * 0.36, sz * 0.2, TC.wood);
      twFlag(xb, gx - sz * 0.3, top - sz * 0.02, sz * 0.34, sz, TC.pink, -1);
      twCyl(xb, gx, top - sz * 0.02, sz * 0.4, sz * 0.22, sz * 0.08, TC.woodD, rnd, { wood: 1, noTop: 1 });
      twDeck(xb, gx, top - sz * 0.02, sz * 0.4, sz * 0.22, TC.wood, rnd);
      twRail(xb, xf, gx, top - sz * 0.02, sz * 0.38, sz * 0.2, sz * 0.12, TC.woodD);
      return { mounts: [[0, -0.98]] };
    }
    if (L === 2) {
      twCyl(xb, gx, gy - sz * 0.5, sz * 0.36, sz * 0.2, sz * 0.46, TC.stone, rnd, { stone: 1, rows: 3 });
      var top2 = gy - sz * 1.0; twPosts(xb, gx, gy - sz * 0.5, top2, sz * 0.34, sz * 0.19, TC.wood);
      twFlag(xb, gx - sz * 0.32, top2, sz * 0.34, sz, TC.lemon, -1);
      twCyl(xb, gx, top2, sz * 0.42, sz * 0.23, sz * 0.09, TC.woodD, rnd, { wood: 1, noTop: 1 }); twDeck(xb, gx, top2, sz * 0.42, sz * 0.23, TC.wood, rnd);
      twRail(xb, xf, gx, top2, sz * 0.4, sz * 0.21, sz * 0.12, TC.woodD);
      twBanner(xf, gx + sz * 0.02, gy - sz * 0.42, sz * 0.18, sz * 0.3, TC.lemon, '#ffffff', TC.hot);
      return { mounts: [[0, -1.06]] };
    }
    if (A) {
      var h = sz * (L === 5 ? 1.12 : 1.04), tp = gy - h, rH = sz * 0.66, rh2 = sz * (L === 5 ? 0.62 : 0.54);
      twCyl(xb, gx, tp, sz * 0.27, sz * 0.15, h - sz * 0.06, TC.stone, rnd, { stone: 1, rows: 6, cols: 4, bands: L === 5 ? [0.2, 0.62] : [0.2], bandCol: TC.sky });
      twWindow(xb, gx - sz * 0.05, tp + h * 0.42, sz * 0.07, sz * 0.11, 1);
      twCyl(xb, gx, tp - sz * 0.02, sz * 0.36, sz * 0.2, sz * 0.08, TC.sky, rnd, { top: '#eaf6ff' });
      // 지붕 기둥과 하늘색 고깔 지붕(높이 올려 궁수 얼굴이 보이게, 앞에 그려 머리 위를 덮음)
      [-1, 1].forEach(function (sd) { twLeg(xb, gx + sd * sz * 0.3, tp - sz * 0.05, gx + sd * sz * 0.29, tp - rH, sz * 0.055, sz * 0.05, TC.wood); });
      twRoof(xf, gx, tp - rH, sz * 0.46, sz * 0.18, rh2, TC.sky, { stripe: '#ffffff', ball: L === 5 ? null : TC.gold, trim: '#ffffff' });
      if (L === 5) twGem(xf, gx, tp - rH - rh2 - sz * 0.05, sz * 0.065, '#bff0ff');
      twBanner(xf, gx, gy - sz * 0.82, sz * 0.2, sz * 0.38, TC.sky, '#ffffff', TC.sky);
      return { mounts: [[0, -(h / sz) - 0.05]] };
    }
    if (V) {
      var h2 = sz * 0.82, tp2 = gy - h2, rx = sz * 0.48, ry = sz * 0.27;
      twCyl(xb, gx, tp2, rx, ry, h2 - sz * 0.04, TC.stone, rnd, { stone: 1, rows: 4, cols: 6, bands: L === 5 ? [0.0] : null, bandCol: TC.pink });
      twMerlons(xb, xf, gx, tp2, rx, ry, 10, sz * 0.13, TC.stone, TC.pink);
      twBanner(xf, gx - sz * 0.24, gy - sz * 0.58, sz * 0.16, sz * 0.32, TC.pink, '#ffffff', TC.hot);
      twBanner(xf, gx + sz * 0.24, gy - sz * 0.58, sz * 0.16, sz * 0.32, TC.pink, '#ffffff', TC.hot);
      if (L === 5) { twBrazier(xb, gx - rx * 0.92, tp2 - sz * 0.15, sz * 0.07, '#ff8ab8'); twBrazier(xb, gx + rx * 0.92, tp2 - sz * 0.15, sz * 0.07, '#ff8ab8'); }
      return { mounts: L === 5 ? [[-0.24, -0.92], [0.24, -0.92], [-0.1, -0.78], [0.12, -1.0]] : [[-0.2, -0.9], [0.22, -0.92], [0, -0.78]] };
    }
    var h3 = sz * 1.05, tp3 = gy - h3, rx3 = sz * 0.38, ry3 = sz * 0.21;
    twCyl(xb, gx, tp3, rx3, ry3, h3 - sz * 0.04, TC.stone, rnd, { stone: 1, rows: 5, cols: 5, bands: [0.04], bandCol: TC.gold });
    twMerlons(xb, xf, gx, tp3, rx3, ry3, 8, sz * 0.12, TC.stone);
    twBanner(xf, gx, gy - sz * 0.8, sz * 0.2, sz * 0.36, TC.lemon, '#ffffff', TC.hot);
    return { mounts: [[-0.12, -1.13], [0.14, -1.11]] };
  },
  catapult: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var F = L >= 4 && B === 0, G = L >= 4 && B === 1, big = L >= 3;
    if (L === 1) { gy += sz * 0.09; twCyl(xb, gx, gy - sz * 0.16, sz * 0.44, sz * 0.25, sz * 0.06, TC.woodD, rnd, { wood: 1, noTop: 1 }); }
    else twCyl(xb, gx, gy - sz * 0.16, sz * 0.46, sz * 0.26, sz * 0.14, G ? '#f3dbe8' : TC.stone, rnd, { stone: 1, rows: 1, cols: 6, noTop: 1 });
    var deck = shp().ell(gx, gy - sz * 0.16, sz * 0.46, sz * 0.26); twFill(xb, deck, TC.wood, { hi: 0.3, lo: 0.18 });
    xb.save(); xb.clip(deck.p); xb.strokeStyle = rgba(twSh(TC.wood, 0.5), 0.3); xb.lineWidth = Math.max(0.6, TW_IW * 0.55); for (var i = -4; i <= 4; i++) { xb.beginPath(); xb.moveTo(gx - sz * 0.5, gy - sz * 0.16 + i * sz * 0.055); xb.lineTo(gx + sz * 0.5, gy - sz * 0.16 + i * sz * 0.055); xb.stroke(); } xb.restore();
    twInk(xb, deck, TC.wood, TW_IW * 0.85);
    if (L === 2 || L === 3) twFlag(xb, gx - sz * 0.37, gy - sz * 0.2, sz * 0.44, sz, L === 3 ? TC.lemon : TC.pink, -1); // 2, 3단계: 깃발로 단계 구분
    if (L === 3) twFlag(xb, gx + sz * 0.37, gy - sz * 0.2, sz * 0.44, sz, TC.lemon, 1);
    var fc = G ? TC.woodD : TC.wood, fh = sz * (big ? 0.62 : 0.45);
    [-1, 1].forEach(function (sd) {
      var bx = gx + sd * sz * 0.2;
      twLeg(xb, bx - sz * 0.16, gy - sz * 0.16, bx, gy - sz * 0.16 - fh, sz * 0.075, sz * 0.065, sd < 0 ? twSh(fc, 0.12) : fc);
      twLeg(xb, bx + sz * 0.16, gy - sz * 0.12, bx, gy - sz * 0.16 - fh, sz * 0.075, sz * 0.065, sd < 0 ? twSh(fc, 0.16) : fc);
      if (L >= 2) { var bk = shp().rrect(bx - sz * 0.055, gy - sz * 0.21 - fh * 0.55, sz * 0.11, sz * 0.04, sz * 0.02); twFill(xb, bk, TC.iron, { hi: 0.4 }); twInk(xb, bk, TC.iron, TW_IW * 0.5); }
    });
    var ax = twLeg(xb, gx - sz * 0.22, gy - sz * 0.16 - fh, gx + sz * 0.22, gy - sz * 0.16 - fh, sz * 0.055, sz * 0.055, TC.iron);
    if (big) { var cw = shp().rrect(gx - sz * 0.13, gy - sz * 0.43, sz * 0.26, sz * 0.19, sz * 0.05); twFill(xb, cw, G ? '#c9b4e6' : TC.woodD, { hi: 0.35 }); twInk(xb, cw, G ? '#c9b4e6' : TC.woodD, TW_IW * 0.7); twShine(xb, gx - sz * 0.07, gy - sz * 0.39, sz * 0.03, sz * 0.015, 0.6); }
    if (F) { twBrazier(xf, gx + sz * 0.3, gy - sz * 0.1, sz * 0.08, '#ff9a4a'); twBanner(xf, gx - sz * 0.32, gy - sz * 0.5, sz * 0.13, sz * 0.26, TC.sky, '#ffffff', TC.sky); }
    if (G && L === 5) twBanner(xf, gx - sz * 0.32, gy - sz * 0.5, sz * 0.13, sz * 0.26, TC.pink, '#ffffff', TC.hot);
    // 거석: 동글동글 사탕 바위
    if (G) [[0.3, 0.06, 0.075, '#c8b6f2'], [0.42, 0.0, 0.06, '#ffc2a8'], [0.22, 0.13, 0.065, '#b5e2ff']].slice(0, L === 5 ? 3 : 2).forEach(function (r) { var rk = shp().ell(gx + r[0] * sz, gy - sz * 0.12 + r[1] * sz, r[2] * sz, r[2] * sz * 0.86); twFill(xf, rk, r[3], { hi: 0.45, lo: 0.25 }); twInk(xf, rk, r[3], TW_IW * 0.7); twShine(xf, gx + r[0] * sz - r[2] * sz * 0.35, gy - sz * 0.12 + r[1] * sz - r[2] * sz * 0.35, r[2] * sz * 0.3, r[2] * sz * 0.18, 0.7); });
    if (F) [-0.3, 0.32].forEach(function (ox, i) { if (i && L < 5) return; var pot = shp().ell(gx + ox * sz, gy - sz * 0.14, sz * 0.065, sz * 0.055); twFill(xf, pot, '#ff9a6a', { hi: 0.45 }); twInk(xf, pot, '#ff9a6a', TW_IW * 0.6); xf.save(); xf.globalCompositeOperation = 'lighter'; glowAt(xf, gx + ox * sz, gy - sz * 0.2, sz * 0.1, '#ffb04a', 0.8); xf.restore(); });
    return { mounts: [[0, -0.16 - fh / sz + (L === 1 ? 0.09 : 0)]], arm: (big ? 0.78 : L === 1 ? 0.5 : 0.6) + (G ? 0.1 : 0) };
  },
  arcane: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var Z = L >= 4 && B === 0, Bm = L >= 4 && B === 1;
    var hc = Z ? '#78aaff' : Bm ? '#ff8fcf' : '#a68cff', stc = Z ? TC.lemon : Bm ? '#fff6e8' : TC.lemon, bandC = Z ? TC.lemon : Bm ? TC.gold : TC.pink;
    if (TW_SK) { bandC = TW_SK.hatBand(bandC); stc = TW_SK.hatStar(stc); }
    twCyl(xb, gx, gy - sz * 0.14, sz * 0.4, sz * 0.22, sz * 0.12, '#e8def8', rnd, { stone: 1, rows: 1, cols: 6 });
    if (L === 3) [-1, 1].forEach(function (sd) { twLeg(xb, gx + sd * sz * 0.37, gy - sz * 0.18, gx + sd * sz * 0.4, gy - sz * 0.62, sz * 0.05, sz * 0.04, TC.gold); twStar(xb, gx + sd * sz * 0.4, gy - sz * 0.69, sz * 0.065, TC.lemon); }); // 3단계: 양옆 별 지팡이
    var h = sz * (L === 1 ? 0.78 : L === 2 ? 0.92 : 1.05) + (L >= 4 ? sz * 0.08 : 0), top = gy - sz * 0.14 - h, w0 = sz * 0.32, by = gy - sz * 0.2;
    // 마녀 모자 챙
    if (TW_SK && TW_SK.brim) TW_SK.brim(xb, gx, by, sz * 0.43, sz * 0.16, hc);
    else { var brim = shp().ell(gx, by, sz * 0.43, sz * 0.16); twFill(xb, brim, twSh(hc, 0.08), { hi: 0.3 }); twInk(xb, brim, hc); }
    // 오목한 고깔 몸체
    var sp = shp(), p = sp.p;
    p.moveTo(gx - w0, by); p.quadraticCurveTo(gx - w0 * 0.22, by - h * 0.3, gx - sz * 0.025, top); p.lineTo(gx + sz * 0.025, top); p.quadraticCurveTo(gx + w0 * 0.22, by - h * 0.3, gx + w0, by);
    p.ellipse(gx, by, w0, w0 * 0.36, 0, 0, Math.PI, false); p.closePath(); sp.ext(gx - w0, top); sp.ext(gx + w0, by + w0 * 0.36);
    twCylG(xb, sp, hc, { hi: 0.45 });
    xb.save(); xb.clip(sp.p);
    if (TW_SK) twSkHat(xb, gx, by, top, w0, h);
    // 띠
    xb.strokeStyle = twInkC(bandC); xb.lineWidth = h * 0.11 + TW_IW * 1.6; xb.beginPath(); xb.ellipse(gx, by - h * 0.13, w0 * 1.05, w0 * 0.3, 0, 0, Math.PI); xb.stroke();
    xb.strokeStyle = bandC; xb.lineWidth = h * 0.11; xb.stroke();
    // 빛나는 별 (단계만큼)
    xb.shadowColor = Z ? '#9fe0ff' : Bm ? '#ffc0e8' : '#ffe08a'; xb.shadowBlur = sz * 0.05;
    for (var r = 0; r < L + 1; r++) { var u = (r + 0.6) / (L + 1.6), yy = by - h * 0.26 - u * h * 0.56, ww = w0 * (1 - u) * 0.62, xx = gx + Math.sin(r * 2.3 + 1) * ww; var ss = shp(); twStarP(ss.p, xx, yy, sz * (0.035 - u * 0.012)); xb.fillStyle = stc; xb.fill(ss.p); }
    xb.restore();
    twInk(xb, sp, hc);
    if (L >= 3) twWindow(xb, gx + sz * 0.04, by - h * 0.36, sz * 0.06, sz * 0.08, 1);
    if (L >= 2) twCyl(xb, gx, top + sz * 0.05, sz * 0.08, sz * 0.04, sz * 0.05, TC.gold, rnd, { hi: 0.55 });
    if (Z) {
      for (var c = 0; c < 3; c++) { var cy = gy - sz * 0.32 - c * h * 0.27, rr = w0 * (1 - c * 0.27) + sz * 0.05; var ring = shp(); ring.p.ellipse(gx, cy, rr, rr * 0.36, 0, 0, Math.PI * 2); ring.p.ellipse(gx, cy, rr * 0.82, rr * 0.27, 0, 0, Math.PI * 2, true); ring.ext(gx - rr, cy - rr * 0.36); ring.ext(gx + rr, cy + rr * 0.36); twFill(xf, ring, TC.sky, { hi: 0.55 }); twInk(xf, ring, TC.sky, TW_IW * 0.6); }
      if (L === 5) [-1, 1].forEach(function (sd) { twLeg(xb, gx + sd * sz * 0.1, top + sz * 0.05, gx + sd * sz * 0.22, top - sz * 0.28, sz * 0.04, sz * 0.026, TC.gold); twGem(xb, gx + sd * sz * 0.22, top - sz * 0.33, sz * 0.04, '#bff0ff'); });
    }
    if (Bm) {
      [-1, 1].forEach(function (sd) { twLeg(xb, gx + sd * sz * 0.1, top + sz * 0.06, gx + sd * sz * 0.22, top - sz * 0.25, sz * 0.045, sz * 0.03, TC.gold); twHeart(xb, gx + sd * sz * 0.22, top - sz * 0.29, sz * 0.045, TC.hot); });
      if (L === 5) { var halo = shp(); halo.p.ellipse(gx, top - sz * 0.32, sz * 0.3, sz * 0.12, 0, 0, Math.PI * 2); halo.p.ellipse(gx, top - sz * 0.32, sz * 0.24, sz * 0.085, 0, 0, Math.PI * 2, true); halo.ext(gx - sz * 0.3, top - sz * 0.44); halo.ext(gx + sz * 0.3, top - sz * 0.2); twFill(xb, halo, TC.gold, { hi: 0.55 }); twInk(xb, halo, TC.gold, TW_IW * 0.6); }
    }
    return { mounts: [[0, -(gy - top) / sz - 0.3]] };
  },
  frost: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var H = L >= 4 && B === 0, Bz = L >= 4 && B === 1;
    twCyl(xb, gx, gy - sz * 0.36, sz * 0.36, sz * 0.2, sz * 0.32, '#9cc4f4', rnd, { stone: 1, rows: 2, cols: 5, top: '#e2f2ff', bands: [0.0], bandCol: '#ffffff' });
    // 녹아내린 눈 장식(앞 가장자리)
    var cA = H ? '#2f96ff' : Bz ? '#6cbcff' : '#45acff';
    var n = L === 1 ? 3 : L === 2 ? 4 : 5, R = sz * (0.14 + L * 0.025);
    for (var i = 0; i < n; i++) {
      // 깎은 면 수정: 왼쪽 면은 밝게, 오른쪽 면은 진하게
      var mid = i === Math.floor(n / 2), a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.36, len = R * (1.5 + (mid ? 1.3 : rnd() * 0.5)) * (H ? 1.15 : 1), w = R * 0.36;
      var bx = gx + (i - (n - 1) / 2) * R * 0.34, by = gy - sz * 0.38, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, tx = bx + ca * len, ty = by + sa * len, k2 = 0.74;
      var Lx = bx - nx * w, Ly = by - ny * w, Rx = bx + nx * w, Ry = by + ny * w, SLx = bx + ca * len * k2 - nx * w * 0.9, SLy = by + sa * len * k2 - ny * w * 0.9, SRx = bx + ca * len * k2 + nx * w * 0.9, SRy = by + sa * len * k2 + ny * w * 0.9;
      var lf = shp().poly([[Lx, Ly], [SLx, SLy], [tx, ty], [bx + ca * len * 0.1, by + sa * len * 0.1]]), rf = shp().poly([[bx + ca * len * 0.1, by + sa * len * 0.1], [tx, ty], [SRx, SRy], [Rx, Ry]]);
      twFill(xb, lf, twLt(cA, 0.55), { hi: 0.6, lo: 0.05 }); twFill(xb, rf, cA, { hi: 0.15, lo: 0.2 });
      var ol = shp().poly([[Lx, Ly], [SLx, SLy], [tx, ty], [SRx, SRy], [Rx, Ry]]); twInk(xb, ol, cA, TW_IW * 0.85);
      xb.save(); xb.strokeStyle = 'rgba(255,255,255,0.9)'; xb.lineWidth = Math.max(0.8, w * 0.2); xb.lineCap = 'round'; xb.beginPath(); xb.moveTo(Lx + ca * len * 0.2 + nx * w * 0.35, Ly + sa * len * 0.2 + ny * w * 0.35); xb.lineTo(SLx + nx * w * 0.3 - ca * len * 0.06, SLy + ny * w * 0.3 - sa * len * 0.06); xb.stroke(); xb.restore();
    }
    if (L >= 3 && !Bz) [-1, 1].forEach(function (sd) { twLeg(xb, gx + sd * sz * 0.22, gy - sz * 0.38, gx + sd * sz * 0.12, gy - sz * 0.92, sz * 0.04, sz * 0.03, '#d6ecff'); var sb = shp().ell(gx + sd * sz * 0.12, gy - sz * 0.95, sz * 0.045, sz * 0.045); twFill(xb, sb, '#ffffff', { lo: 0.15 }); twInk(xb, sb, '#bfe0ff', TW_IW * 0.6); });
    if (Bz) {
      // 눈 구슬: 유리 구 + 분홍 받침
      var gc = gy - sz * 0.82, gr = sz * 0.27, glass = shp().ell(gx, gc, gr, gr);
      xf.save(); xf.globalAlpha = 0.22; xf.fillStyle = '#eaf7ff'; xf.fill(glass.p); xf.restore();
      xf.save(); xf.strokeStyle = 'rgba(255,255,255,0.9)'; xf.lineWidth = Math.max(1, sz * 0.03); xf.beginPath(); xf.arc(gx, gc, gr * 0.78, Math.PI * 1.05, Math.PI * 1.45); xf.stroke(); xf.restore();
      twInk(xf, glass, '#9fd0ff', TW_IW * 0.9, 0.9);
      twShine(xf, gx - gr * 0.42, gc - gr * 0.5, gr * 0.16, gr * 0.09, 0.85);
      var rb = shp().ell(gx, gc + gr * 0.98, gr * 0.7, gr * 0.2); twFill(xf, rb, TC.pink, { hi: 0.4 }); twInk(xf, rb, TC.pink, TW_IW * 0.7);
    }
    xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, gy - sz * 0.7, sz * 0.5, '#9fdcff', 0.3); xb.restore();
    return { mounts: [[0, -0.8 - (L >= 3 ? 0.12 : 0)]] };
  },
  ballista: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var A = L >= 4 && B === 0, R = L >= 4 && B === 1, rx = sz * (A ? 0.45 : 0.42), ry = rx * 0.57, h = sz * (L === 1 ? 0.22 : L === 2 ? 0.28 : 0.32), sc = A ? '#eef0ff' : TC.stone;
    if (L === 1) { twCyl(xb, gx, gy - h, rx, ry, h, TC.wood, rnd, { wood: 1, top: '#f6c07e' }); twDeck(xb, gx, gy - h, rx * 0.94, ry * 0.94, TC.wood, rnd); }
    else twCyl(xb, gx, gy - h, rx, ry, h, sc, rnd, { stone: 1, rows: 2, cols: 6, bands: A ? [0.1, 0.62] : L >= 5 ? [0.08] : null, bandCol: A ? TC.sky : R ? TC.pink : TC.gold });
    if (L >= 3) twMerlons(xb, xf, gx, gy - h, rx, ry, 10, sz * (A ? 0.1 : 0.08), sc, A ? TC.sky : R ? TC.pink : null);
    if (A) for (var k = -2; k <= 2; k++) { var px = gx + k * rx * 0.36, py = gy + ry * (0.86 - Math.abs(k) * 0.12) - h * 0.45, sp = shp(); sp.p.moveTo(px - sz * 0.04, py); sp.p.quadraticCurveTo(px - sz * 0.01, py + sz * 0.09, px, py + sz * 0.1); sp.p.quadraticCurveTo(px + sz * 0.01, py + sz * 0.09, px + sz * 0.04, py); sp.p.closePath(); sp.ext(px - sz * 0.04, py); sp.ext(px + sz * 0.04, py + sz * 0.1); twFill(xf, sp, '#ffffff', { lo: 0.2 }); twInk(xf, sp, TC.sky, TW_IW * 0.6); }
    if (R) [-1, 1].forEach(function (sd) { var bx = gx + sd * rx * 0.95, by = gy - h * 0.2; twLeg(xb, bx, by, bx, by - sz * 0.32, sz * 0.035, sz * 0.035, TC.woodD); for (var j = 0; j < (L === 5 ? 5 : 3); j++) { var yy = by - sz * 0.08 - j * sz * 0.045; xb.strokeStyle = twInkC(TC.wood); xb.lineCap = 'round'; xb.lineWidth = Math.max(1, sz * 0.018) + TW_IW; xb.beginPath(); xb.moveTo(bx - sd * sz * 0.02, yy); xb.lineTo(bx + sd * sz * 0.16, yy - sz * 0.03); xb.stroke(); xb.strokeStyle = '#ffe8c0'; xb.lineWidth = Math.max(1, sz * 0.018); xb.stroke(); var tip = shp().ell(bx + sd * sz * 0.17, yy - sz * 0.032, sz * 0.018, sz * 0.018); twFill(xb, tip, TC.pink, { hi: 0.4 }); twInk(xb, tip, TC.pink, TW_IW * 0.5); } });
    var piv = shp().ell(gx, gy - h - sz * 0.04, sz * 0.15, sz * 0.085); twFill(xb, piv, L === 1 ? TC.woodD : TC.iron, { hi: 0.45 }); twInk(xb, piv, L === 1 ? TC.woodD : TC.iron, TW_IW * 0.7);
    return { mounts: [[0, -(h / sz) - 0.1]] };
  },
  bell: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var D = L >= 4 && B === 0, Hl = L >= 4 && B === 1;
    twCyl(xb, gx, gy - sz * 0.16, sz * 0.42, sz * 0.24, sz * 0.14, TC.stone, rnd, { stone: 1, rows: 1, cols: 6 });
    var pc = L === 1 ? TC.wood : '#fff3e6', ph = sz * (0.62 + L * 0.03), top = gy - sz * 0.16 - ph;
    [[-0.3, -0.12], [0.3, -0.12], [-0.34, 0.1], [0.34, 0.1]].forEach(function (p, i) { var x = i < 2 ? xb : xf; twLeg(x, gx + p[0] * sz, gy - sz * 0.16 + p[1] * sz, gx + p[0] * sz * 0.92, top + p[1] * sz * 0.5, sz * 0.075, sz * 0.065, i < 2 ? twSh(pc, 0.14) : pc); if (L >= 2) { var cp = shp().ell(gx + p[0] * sz * 0.92, top + p[1] * sz * 0.5 + sz * 0.02, sz * 0.05, sz * 0.025); twFill(x, cp, TC.gold, { hi: 0.5 }); twInk(x, cp, TC.gold, TW_IW * 0.5); } });
    var rc = L === 1 ? '#f0a65e' : L === 2 ? TC.lav : L === 3 ? TC.gold : D ? TC.sky : TC.pink;
    twRoof(xf, gx, top, sz * 0.5, sz * 0.2, sz * (0.36 + L * 0.03), rc, { stripe: '#ffffff', sa: L >= 3 ? 0.55 : 0.35, trim: twLt(rc, 0.45), ball: L < 3 ? TC.gold : null });
    if (L >= 3) twGem(xf, gx, top - sz * (0.38 + L * 0.03), sz * 0.045, Hl ? '#fff3b0' : D ? '#bff0ff' : '#ffe27a');
    return { mounts: [[0, -(gy - top) / sz + 0.3]], drum: D };
  },
  flame: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var Dr = L >= 4 && B === 0, Rg = L >= 4 && B === 1;
    var h = sz * (L === 1 ? 0.55 : 0.65), wc = '#ff9a7c', rw = sz * (L === 1 ? 0.3 : 0.32);
    twCyl(xb, gx, gy - h, rw, rw * 0.57, h - sz * 0.04, wc, rnd, { stone: 1, rows: 3, cols: 4, bands: L >= 2 ? [0.1] : null, bandCol: TC.lemon });
    // 앞쪽 아궁이: 노란 불빛
    var fw = sz * 0.2, fh = sz * 0.2, fy = gy - sz * 0.04 + rw * 0.5, ar = shp(); ar.p.moveTo(gx - fw / 2, fy); ar.p.lineTo(gx - fw / 2, fy - fh + fw / 2); ar.p.arc(gx, fy - fh + fw / 2, fw / 2, Math.PI, 0); ar.p.lineTo(gx + fw / 2, fy); ar.p.closePath(); ar.ext(gx - fw / 2, fy - fh); ar.ext(gx + fw / 2, fy);
    var ag = xb.createLinearGradient(0, fy - fh, 0, fy); ag.addColorStop(0, '#fff2a0'); ag.addColorStop(0.6, '#ffb040'); ag.addColorStop(1, '#ff7a3a'); xb.fillStyle = ag; xb.fill(ar.p); twInk(xb, ar, wc);
    xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, fy - fh * 0.4, fw * 1.1, '#ffb040', 0.5); xb.restore();
    var fl = shp(); fl.p.moveTo(gx, fy - fh * 0.82); fl.p.quadraticCurveTo(gx + fw * 0.34, fy - fh * 0.3, gx, fy - fh * 0.06); fl.p.quadraticCurveTo(gx - fw * 0.34, fy - fh * 0.3, gx, fy - fh * 0.82); xb.fillStyle = 'rgba(255,255,230,0.9)'; xb.fill(fl.p);
    if (Rg) [[-0.36, -0.08], [0.36, -0.08], [-0.3, 0.12], [0.3, 0.12]].forEach(function (p, i) { var x = i < 2 ? xb : xf; twLeg(x, gx + p[0] * sz, gy + p[1] * sz, gx + p[0] * sz, gy + p[1] * sz - sz * 0.32, sz * 0.065, sz * 0.055, TC.pink); twBrazier(x, gx + p[0] * sz, gy + p[1] * sz - sz * 0.34, sz * 0.07, '#ff9a4a', TC.gold); });
    if (!Dr) twBrazier(xb, gx, gy - h - sz * 0.02, sz * (0.18 + L * 0.02), '#ff8a3a', TC.gold);
    else { var piv = shp().ell(gx, gy - h, sz * 0.18, sz * 0.1); twFill(xb, piv, TC.gold, { hi: 0.45 }); twInk(xb, piv, TC.gold, TW_IW * 0.7); }
    if (L >= 3 && !Dr && !Rg) [-1, 1].forEach(function (sd) { twLeg(xf, gx + sd * sz * 0.2, gy - h - sz * 0.06, gx + sd * sz * 0.08, gy - h - sz * 0.5, sz * 0.035, sz * 0.028, TC.gold); var bb = shp().ell(gx + sd * sz * 0.08, gy - h - sz * 0.52, sz * 0.03, sz * 0.03); twFill(xf, bb, TC.pink, { hi: 0.45 }); twInk(xf, bb, TC.pink, TW_IW * 0.5); });
    return { mounts: [[0, -(h / sz) - (Dr ? 0.08 : 0.12)]], dragon: Dr, ring: Rg };
  },
  alchemy: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var Ac = L >= 4 && B === 0, Pl = L >= 4 && B === 1, liq = Pl ? '#c07aff' : Ac ? '#d8f04a' : '#8fea5a';
    twCyl(xb, gx, gy - sz * 0.2, sz * 0.44, sz * 0.25, sz * 0.18, TC.stone, rnd, { stone: 1, rows: 1, cols: 6, noTop: 1 }); twDeck(xb, gx, gy - sz * 0.2, sz * 0.44, sz * 0.25, TC.wood, rnd);
    // 선반의 플라스크(색색)
    var fcs = [liq, TC.pink, TC.sky, TC.lemon];
    for (var f = 0; f < 2 + L; f++) {
      var fx = gx - sz * 0.32 + f * sz * 0.13, fy = gy - sz * 0.25 - (f % 2) * sz * 0.04, fr = sz * 0.052, fc = fcs[f % 4];
      var nk = shp().rrect(fx - fr * 0.32, fy - fr * 1.75, fr * 0.64, fr * 1.0, fr * 0.2); twFill(xb, nk, '#f4f8ff', { lo: 0.2 }); twInk(xb, nk, '#b8c8e8', TW_IW * 0.5);
      var fl = shp().ell(fx, fy, fr, fr); twFill(xb, fl, fc, { hi: 0.4 }); twInk(xb, fl, fc, TW_IW * 0.55); twShine(xb, fx - fr * 0.35, fy - fr * 0.35, fr * 0.3, fr * 0.18, 0.8);
      var ck = shp().rrect(fx - fr * 0.36, fy - fr * 2.0, fr * 0.72, fr * 0.36, fr * 0.12); twFill(xb, ck, TC.woodD); twInk(xb, ck, TC.woodD, TW_IW * 0.4);
    }
    // 가마솥
    var r = sz * (0.25 + L * 0.015), cy = gy - sz * 0.42, pc = Pl ? '#7a58b8' : '#9a7ad8';
    var pot = shp(); pot.p.moveTo(gx - r, cy - r * 0.2); pot.p.bezierCurveTo(gx - r * 1.15, cy + r * 0.95, gx + r * 1.15, cy + r * 0.95, gx + r, cy - r * 0.2); pot.p.closePath(); pot.ext(gx - r * 1.1, cy - r * 0.2); pot.ext(gx + r * 1.1, cy + r * 0.8);
    twCylG(xb, pot, pc, { hi: 0.4 }); twInk(xb, pot, pc); twShine(xb, gx - r * 0.55, cy + r * 0.12, r * 0.12, r * 0.22, 0.5, 0.3);
    if (L >= 2) { var bd = shp().rrect(gx - r * 1.04, cy + r * 0.12, r * 2.08, r * 0.15, r * 0.07); twFill(xb, bd, TC.gold, { hi: 0.5 }); twInk(xb, bd, TC.gold, TW_IW * 0.6); }
    var lip = shp().ell(gx, cy - r * 0.2, r * 1.0, r * 0.34); twFill(xb, lip, twLt(pc, 0.2)); twInk(xb, lip, pc, TW_IW * 0.8);
    var lq = shp().ell(gx, cy - r * 0.18, r * 0.84, r * 0.26); twFill(xb, lq, liq, { hi: 0.45 }); twShine(xb, gx - r * 0.3, cy - r * 0.24, r * 0.2, r * 0.06, 0.7, 0);
    xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, cy - r * 0.25, r * 1.3, liq, 0.4); xb.restore();
    if (L >= 3) { var ch = shp().rrect(gx + r * 0.75, cy - r * 1.6, r * 0.34, r * 1.6, r * 0.12); twCylG(xb, ch, TC.pink, { hi: 0.4 }); xb.save(); xb.clip(ch.p); xb.fillStyle = 'rgba(255,255,255,0.7)'; for (var st = 0; st < 4; st++) xb.fillRect(gx + r * 0.7, cy - r * (1.42 - st * 0.4), r * 0.44, r * 0.14); xb.restore(); twInk(xb, ch, TC.pink, TW_IW * 0.7); twCyl(xb, gx + r * 0.92, cy - r * 1.6, r * 0.22, r * 0.08, r * 0.08, TC.lav, null, {}); }
    // 유리관
    if (L >= 2) { xf.save(); xf.lineCap = 'round'; xf.beginPath(); xf.moveTo(gx - r * 1.1, gy - sz * 0.26); xf.quadraticCurveTo(gx - r * 1.3, cy - r * 0.9, gx - r * 0.5, cy - r * 0.5); xf.strokeStyle = 'rgba(150,170,220,0.7)'; xf.lineWidth = Math.max(1, sz * 0.025) + TW_IW; xf.stroke(); xf.strokeStyle = 'rgba(235,250,255,0.95)'; xf.lineWidth = Math.max(1, sz * 0.025); xf.stroke(); xf.restore(); }
    return { mounts: [[0, -0.48]], liq: liq, chimney: L >= 3 ? [r * 0.91 / sz, -(gy - (cy - r * 1.7)) / sz] : null };
  },
  cannon: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var Big = L >= 4 && B === 0, Mul = L >= 4 && B === 1, rx = sz * (Big ? 0.47 : 0.44), ry = rx * 0.57, h = sz * (L === 1 ? 0.2 : L === 2 ? 0.3 : 0.4), sc = TC.stone;
    if (L === 1) {
      twCyl(xb, gx, gy - h, rx, ry, h, TC.wood, rnd, { wood: 1, top: '#f6c07e' }); twDeck(xb, gx, gy - h, rx * 0.94, ry * 0.94, TC.wood, rnd);
      for (var k = 0; k < 6; k++) { var a = 0.25 + k / 5 * (Math.PI - 0.5), bx = gx + Math.cos(a) * rx * 0.98, by = gy - h + Math.sin(a) * ry * 0.98; var bag = shp().ell(bx, by, sz * 0.085, sz * 0.055); twFill(xf, bag, '#ffd2a6', { hi: 0.4, lo: 0.25 }); twInk(xf, bag, '#e8a87a', TW_IW * 0.6); }
    } else {
      twCyl(xb, gx, gy - h, rx, ry, h - sz * 0.02, sc, rnd, { stone: 1, rows: 2, cols: 7, bands: Big ? [0.1, 0.62] : Mul ? [0.1] : L >= 3 ? [0.08] : null, bandCol: Big ? TC.sky : Mul ? TC.pink : TC.gold });
      if (L >= 3) twMerlons(xb, xf, gx, gy - h, rx, ry, 8, sz * (Big ? 0.11 : 0.09), sc, Big ? TC.sky : Mul ? TC.pink : null);
    }
    if (Mul) { var bx0 = gx + rx * 0.62, by0 = gy + ry * 0.35, rows = L === 5 ? [3, 2, 1] : [2, 1]; rows.forEach(function (n, r) { for (var i = 0; i < n; i++) { var cx = bx0 + (i - (n - 1) / 2) * sz * 0.085, cy = by0 - r * sz * 0.07; var ball = shp().ell(cx, cy, sz * 0.045, sz * 0.045); twFill(xf, ball, '#7a5ab0', { hi: 0.4 }); twInk(xf, ball, '#7a5ab0', TW_IW * 0.55); twShine(xf, cx - sz * 0.015, cy - sz * 0.016, sz * 0.013, sz * 0.009, 0.85); } }); }
    if (Big && L === 5) [-1, 1].forEach(function (sd) { twBanner(xf, gx + sd * rx * 0.55, gy - h * 0.85, sz * 0.13, sz * 0.26, TC.sky, '#ffffff', TC.sky); });
    return { mounts: [[0, -(h / sz) - 0.04]] };
  },
  mint: function (xb, xf, gx, gy, sz, L, B, rnd) {
    var C = L >= 4 && B === 0, V = L >= 4 && B === 1;
    var w = sz * (0.62 + L * 0.03), h = sz * (0.42 + L * 0.03), d = sz * 0.22, x0 = gx - w / 2, y0 = gy - sz * 0.05, wc = V ? '#fff0f6' : TC.stone;
    var side = shp().poly([[x0 + w, y0 - h], [x0 + w + d * 0.6, y0 - h - d * 0.5], [x0 + w + d * 0.6, y0 - d * 0.5], [x0 + w, y0]]); twFill(xb, side, twSh(wc, 0.3), { hi: 0.1 }); twInk(xb, side, wc);
    var front = shp().rrect(x0, y0 - h, w, h, sz * 0.02); twFill(xb, front, wc, { hi: 0.3, lo: 0.16 });
    xb.save(); xb.clip(front.p); xb.strokeStyle = rgba(twSh(wc, 0.5), 0.18); xb.lineWidth = Math.max(0.6, TW_IW * 0.55);
    for (var rr = 1; rr < 4; rr++) { xb.beginPath(); xb.moveTo(x0, y0 - h * rr / 4); xb.lineTo(x0 + w, y0 - h * rr / 4); xb.stroke(); }
    for (var bq = 0; bq < 7; bq++) { xb.fillStyle = rgba(twLt(wc, 0.8), 0.6); twPill(xb, x0 + w * (0.12 + rnd() * 0.76), y0 - h * (Math.floor(rnd() * 4) + 0.5) / 4, w * 0.16, h * 0.12); }
    if (TW_SK) twSkWall(xb, x0, y0, w, h);
    xb.restore(); twInk(xb, front, wc);
    var rc = L === 1 ? '#f0a65e' : L === 2 ? TC.lav : L === 3 ? TC.gold : C ? TC.sky : TC.pink;
    var roof = shp().poly([[x0 - sz * 0.07, y0 - h + sz * 0.03], [x0 + w * 0.5, y0 - h - sz * 0.36], [x0 + w + sz * 0.07, y0 - h + sz * 0.03]]);
    var roofS = shp().poly([[x0 + w * 0.5, y0 - h - sz * 0.36], [x0 + w * 0.5 + d * 0.6, y0 - h - sz * 0.36 - d * 0.5], [x0 + w + d * 0.6 + sz * 0.07, y0 - h - d * 0.5 + sz * 0.03], [x0 + w + sz * 0.07, y0 - h + sz * 0.03]]);
    if (TW_SK) twSkHouseRoof(xb, roof, roofS, rc, x0 + w * 0.5, y0 - h - sz * 0.36, x0 - sz * 0.07, x0 + w + sz * 0.07, y0 - h + sz * 0.03, sz, !V);
    else {
    twFill(xb, roofS, twSh(rc, 0.28)); twInk(xb, roofS, rc);
    twFill(xb, roof, rc, { hi: 0.42 });
    xb.save(); xb.clip(roof.p); xb.fillStyle = 'rgba(255,255,255,0.45)'; for (var s2 = 0; s2 < 3; s2++) { var yy = y0 - h - sz * 0.02 - s2 * sz * 0.11; xb.fillRect(x0 - sz * 0.1, yy - sz * 0.025, w + sz * 0.2, sz * 0.05); } xb.restore();
    twInk(xb, roof, rc);
    }
    if (L === 3) twFlag(xb, x0 + w * 0.3, y0 - h - sz * 0.2, sz * 0.34, sz, TC.pink, -1); // 3단계: 지붕 깃발
    if (L >= 2 && !V) { var chm = shp().rrect(x0 + w * 0.68, y0 - h - sz * 0.32, sz * 0.09, sz * 0.2, sz * 0.03); twFill(xb, chm, TC.peach); twInk(xb, chm, TC.peach, TW_IW * 0.7); var chT = shp().rrect(x0 + w * 0.68 - sz * 0.015, y0 - h - sz * 0.34, sz * 0.12, sz * 0.045, sz * 0.02); twFill(xb, chT, twLt(TC.peach, 0.2)); twInk(xb, chT, TC.peach, TW_IW * 0.6); }
    if (V) { var dr = sz * (L === 5 ? 0.17 : 0.13), dcx = x0 + w * 0.5, dcy = y0 - h - sz * 0.28, dm = shp(); dm.p.ellipse(dcx, dcy, dr, dr, 0, Math.PI, 0); dm.p.closePath(); dm.ext(dcx - dr, dcy - dr); dm.ext(dcx + dr, dcy); twFill(xb, dm, TC.gold, { hi: 0.6, lo: 0.3 }); twInk(xb, dm, TC.gold); twShine(xb, dcx - dr * 0.4, dcy - dr * 0.55, dr * 0.18, dr * 0.1, 0.85); twGem(xb, dcx, dcy - dr - sz * 0.04, sz * 0.035, '#ffd0e8'); }
    if (!V) { twWindow(xb, x0 + w * 0.22, y0 - h * 0.58, sz * 0.07, sz * 0.09, 1); twWindow(xb, x0 + w * 0.78, y0 - h * 0.58, sz * 0.07, sz * 0.09, 1); }
    var door = shp().rrect(gx - sz * 0.085, y0 - sz * 0.25, sz * 0.17, sz * 0.25, sz * 0.085); twFill(xb, door, V ? '#c9b8ee' : TC.woodD, { hi: 0.3 }); twInk(xb, door, V ? '#c9b8ee' : TC.woodD, TW_IW * 0.8);
    var knob = shp().ell(gx + sz * 0.045, y0 - sz * 0.11, sz * 0.016, sz * 0.016); twFill(xb, knob, TC.gold, { hi: 0.5 });
    if (!V) twHeart(xb, gx, y0 - sz * 0.17, sz * 0.03, TC.pink);
    if (C) { var aw = shp(), ap = aw.p; ap.moveTo(gx - sz * 0.2, y0 - sz * 0.31); ap.lineTo(gx + sz * 0.2, y0 - sz * 0.31); ap.lineTo(gx + sz * 0.25, y0 - sz * 0.2);
      for (var sc2 = 0; sc2 < 5; sc2++) { var xa = gx + sz * 0.25 - sz * 0.1 * sc2; ap.quadraticCurveTo(xa - sz * 0.05, y0 - sz * 0.15, xa - sz * 0.1, y0 - sz * 0.2); }
      ap.closePath(); aw.ext(gx - sz * 0.25, y0 - sz * 0.31); aw.ext(gx + sz * 0.25, y0 - sz * 0.15);
      xf.save(); xf.clip(ap); for (var st = 0; st < 6; st++) { xf.fillStyle = st % 2 ? '#ffffff' : TC.sky; xf.fillRect(gx - sz * 0.25 + st * sz * 0.085, y0 - sz * 0.32, sz * 0.085, sz * 0.2); } xf.restore(); twInk(xf, aw, TC.sky, TW_IW * 0.8);
      if (L === 5) { var cart = shp().rrect(gx - sz * 0.5, gy - sz * 0.2, sz * 0.2, sz * 0.12, sz * 0.03); twFill(xf, cart, TC.wood); twInk(xf, cart, TC.wood, TW_IW * 0.7); var wh = shp().ell(gx - sz * 0.45, gy - sz * 0.07, sz * 0.045, sz * 0.045); twFill(xf, wh, TC.pink, { hi: 0.4 }); twInk(xf, wh, TC.pink, TW_IW * 0.6); } }
    if (V) { var vd = shp().ell(gx, y0 - sz * 0.13, sz * 0.12, sz * 0.12); twFill(xb, vd, '#e2dcf6', { hi: 0.55 }); twInk(xb, vd, '#b8aee0'); var vh = shp().ell(gx, y0 - sz * 0.13, sz * 0.05, sz * 0.05); twFill(xb, vh, TC.pink, { hi: 0.4 }); twInk(xb, vh, TC.pink, TW_IW * 0.6); twShine(xb, gx - sz * 0.05, y0 - sz * 0.19, sz * 0.03, sz * 0.018, 0.8); }
    // 동전 더미
    for (var k = 0; k < 3 + L; k++) { var cx = gx + (k % 2 ? 1 : -1) * sz * (0.28 + (k >> 1) * 0.04), cyy = gy - sz * 0.02 - (k >> 1) * sz * 0.035; var cn = shp().ell(cx, cyy, sz * 0.065, sz * 0.028); twFill(xf, cn, TC.gold, { hi: 0.6 }); twInk(xf, cn, TC.gold, TW_IW * 0.55); }
    if (C) { var crate = shp().rrect(gx + sz * 0.3, gy - sz * 0.28, sz * 0.2, sz * 0.2, sz * 0.04); twFill(xf, crate, TC.wood); twInk(xf, crate, TC.wood, TW_IW * 0.7); xf.save(); xf.strokeStyle = twInkC(TC.wood); xf.lineWidth = TW_IW * 0.6; xf.beginPath(); xf.moveTo(gx + sz * 0.32, gy - sz * 0.26); xf.lineTo(gx + sz * 0.48, gy - sz * 0.1); xf.stroke(); xf.restore(); }
    // 간판: 동전 모양
    twLeg(xb, x0 - sz * 0.02, y0 - h * 0.7, x0 - sz * 0.16, y0 - h * 0.7, sz * 0.025, sz * 0.025, TC.woodD);
    var sg = shp().ell(x0 - sz * 0.16, y0 - h * 0.55, sz * 0.075, sz * 0.075); twFill(xb, sg, TC.gold, { hi: 0.6 }); twInk(xb, sg, TC.gold, TW_IW * 0.7); twStar(xb, x0 - sz * 0.16, y0 - h * 0.55, sz * 0.035, '#fff3b0', 0);
    var hh = 0.05 + h / sz;
    return { mounts: [[0, -0.6]], an: V ? { wheel: [0, -0.18, 0.075], coin: [0, -hh - 0.62] } : { chim: L >= 2 ? [(w * 0.18 + sz * 0.045) / sz, -hh - 0.34] : null, gear: [0, -hh - 0.13, 0.07 + L * 0.004], coin: [0, -hh - 0.52] } };
  }
};
// ===================== 6단계(궁극) 그림 도구와 몸체: 갈래마다 한 모습 (v2.0) =====================
function u6E(x, cx, cy, rx, ry, col, o) { o = o || {}; var s = shp().ell(cx, cy, rx, ry, o.rot); twFill(x, s, col, { hi: o.hi == null ? 0.42 : o.hi, lo: o.lo == null ? 0.24 : o.lo }); if (o.ink !== 0) twInk(x, s, o.ic || col, TW_IW * (o.iw || 0.85)); if (o.sh) twShine(x, cx - rx * 0.35, cy - ry * 0.4, rx * 0.22, ry * 0.14, 0.8); return s; }
function u6P(x, pts, col, o) { o = o || {}; var s = shp(); if (o.blob) s.blob(pts); else s.poly(pts); if (o.cyl) twCylG(x, s, col, { hi: o.hi }); else twFill(x, s, col, { hi: o.hi == null ? 0.4 : o.hi, lo: o.lo == null ? 0.24 : o.lo }); if (o.ink !== 0) twInk(x, s, o.ic || col, TW_IW * (o.iw || 0.85)); return s; }
function u6R(x, x0, y0, w, h, r, col, o) { o = o || {}; var s = shp().rrect(x0, y0, w, h, r); if (o.cyl) twCylG(x, s, col, { hi: o.hi }); else twFill(x, s, col, { hi: o.hi == null ? 0.4 : o.hi, lo: o.lo == null ? 0.24 : o.lo }); if (o.ink !== 0) twInk(x, s, o.ic || col, TW_IW * (o.iw || 0.85)); return s; }
// 굵은 선(테두리 + 색)
function u6Line(x, pts, w, col, quad) { x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); if (quad) x.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else for (var i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); twStrokeInk(x, col, w); x.restore(); }
// 큰 고리: 뒤 반쪽은 xb, 앞 반쪽은 xf
function u6Hoop(xb, xf, cx, cy, rx, ry, w, col, rot) {
  [[xb, Math.PI, Math.PI * 2], [xf, 0, Math.PI]].forEach(function (q) {
    var x = q[0]; x.save(); x.lineCap = 'butt'; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, q[1], q[2]); twStrokeInk(x, col, w);
    x.strokeStyle = rgba(twLt(col, 0.75), 0.85); x.lineWidth = Math.max(0.6, w * 0.26); x.beginPath(); x.ellipse(cx, cy - w * 0.2, rx, ry, rot || 0, q[1] + 0.3, q[2] - 0.3); x.stroke(); x.restore();
  });
}
// 깎은 얼음 가시(왼쪽 면 밝게, 오른쪽 면 진하게)
function u6Spike(x, bx, by, ang, len, w, col) {
  var ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca, tx = bx + ca * len, ty = by + sa * len, k = 0.7;
  var Lp = [bx - nx * w, by - ny * w], Rp = [bx + nx * w, by + ny * w], SL = [bx + ca * len * k - nx * w * 0.95, by + sa * len * k - ny * w * 0.95], SR = [bx + ca * len * k + nx * w * 0.95, by + sa * len * k + ny * w * 0.95], M = [bx + ca * len * 0.08, by + sa * len * 0.08];
  u6P(x, [Lp, SL, [tx, ty], M], twLt(col, 0.55), { hi: 0.6, lo: 0.05, ink: 0 }); u6P(x, [M, [tx, ty], SR, Rp], col, { hi: 0.15, lo: 0.2, ink: 0 });
  twInk(x, shp().poly([Lp, SL, [tx, ty], SR, Rp]), col, TW_IW * 0.9);
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = Math.max(0.8, w * 0.22); x.lineCap = 'round'; x.beginPath(); x.moveTo(Lp[0] + ca * len * 0.2 + nx * w * 0.4, Lp[1] + sa * len * 0.2 + ny * w * 0.4); x.lineTo(SL[0] + nx * w * 0.35 - ca * len * 0.06, SL[1] + ny * w * 0.35 - sa * len * 0.06); x.stroke(); x.restore();
}
// 날개: 깃털 세 장 (sd = -1 왼쪽, 1 오른쪽)
function u6Wing(x, cx, cy, sd, r, col) {
  for (var i = 2; i >= 0; i--) {
    var a = -0.42 - i * 0.44, len = r * (1 - i * 0.14), ex = cx + sd * Math.cos(a) * len, ey = cy + Math.sin(a) * len, s = shp();
    s.p.moveTo(cx, cy - r * 0.12); s.p.quadraticCurveTo(cx + sd * Math.cos(a) * len * 0.45, cy + Math.sin(a) * len * 1.15 - r * 0.22, ex, ey); s.p.quadraticCurveTo(cx + sd * Math.cos(a) * len * 0.7, cy + Math.sin(a) * len * 0.45 + r * 0.24, cx, cy + r * 0.2); s.p.closePath();
    s.ext(Math.min(cx, ex) - 2, cy - r * 1.1); s.ext(Math.max(cx, ex) + 2, cy + r * 0.3);
    twFill(x, s, col, { hi: 0.55, lo: 0.16 }); twInk(x, s, col === '#ffffff' ? '#a9c4f2' : col, TW_IW * 0.9);
  }
}
// 불꽃 한 송이(그려 둔 그림용)
function u6Flame(x, cx, cy, r, c0, c1) {
  var s = shp(); s.p.moveTo(cx, cy - r * 1.6); s.p.bezierCurveTo(cx + r * 0.95, cy - r * 0.5, cx + r, cy + r * 0.6, cx, cy + r * 0.7); s.p.bezierCurveTo(cx - r, cy + r * 0.6, cx - r * 0.95, cy - r * 0.5, cx, cy - r * 1.6); s.p.closePath(); s.ext(cx - r, cy - r * 1.6); s.ext(cx + r, cy + r * 0.7);
  x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy - r * 0.3, r * 2.2, c0 || '#ff9a4a', 0.5); x.restore();
  twFill(x, s, c0 || '#ff9a4a', { hi: 0.4, lo: 0.1 }); twInk(x, s, c0 || '#ff9a4a', TW_IW * 0.7);
  var q = shp(); q.p.moveTo(cx, cy - r * 0.75); q.p.bezierCurveTo(cx + r * 0.5, cy - r * 0.1, cx + r * 0.5, cy + r * 0.45, cx, cy + r * 0.5); q.p.bezierCurveTo(cx - r * 0.5, cy + r * 0.45, cx - r * 0.5, cy - r * 0.1, cx, cy - r * 0.75); x.fillStyle = c1 || '#fff0a0'; x.fill(q.p);
}
// 뭉게구름
function u6Cloud(x, cx, cy, r, col) {
  var ss = [[-0.72, 0.16, 0.55], [0, -0.2, 0.78], [0.72, 0.12, 0.6]].map(function (q) { return shp().ell(cx + q[0] * r, cy + q[1] * r, q[2] * r, q[2] * r * 0.85); });
  ss.forEach(function (s) { twInk(x, s, col, TW_IW * 1.7); }); ss.forEach(function (s) { twFill(x, s, col, { hi: 0.5, lo: 0.14 }); }); twShine(x, cx - r * 0.2, cy - r * 0.5, r * 0.2, r * 0.1, 0.8);
}
// 굽은 뿔 (sd 쪽으로 휘며 올라감)
function u6Horn(x, bx, by, sd, len, w, col) {
  var s = shp(), p = s.p; p.moveTo(bx - sd * w, by); p.quadraticCurveTo(bx + sd * len * 0.02, by - len * 0.7, bx + sd * len * 0.5, by - len); p.quadraticCurveTo(bx + sd * len * 0.42, by - len * 0.4, bx + sd * w * 1.3, by); p.closePath();
  s.ext(Math.min(bx - w, bx + sd * len * 0.5) - 1, by - len); s.ext(Math.max(bx + w, bx + sd * len * 0.5) + 1, by);
  twFill(x, s, col, { hi: 0.5, lo: 0.25 }); twInk(x, s, col, TW_IW);
  x.save(); x.clip(s.p); x.strokeStyle = rgba(twSh(col, 0.5), 0.4); x.lineWidth = Math.max(0.8, w * 0.22); for (var i = 1; i < 4; i++) { x.beginPath(); x.moveTo(bx - sd * w * 1.2, by - len * i * 0.22); x.lineTo(bx + sd * len * 0.5, by - len * i * 0.22 - len * 0.12); x.stroke(); } x.restore();
}
// 투석기 받침과 틀
function u6CatBase(xb, gx, gy, sz, col, rnd, band) { twCyl(xb, gx, gy - sz * 0.16, sz * 0.5, sz * 0.28, sz * 0.14, col, rnd, { stone: 1, rows: 1, cols: 7, noTop: 1, bands: band ? [0.0] : null, bandCol: band }); twDeck(xb, gx, gy - sz * 0.16, sz * 0.5, sz * 0.28, TC.wood, rnd); }
function u6CatFrame(xb, gx, gy, sz, fh, fc, lw, cap) {
  [-1, 1].forEach(function (sd) {
    var bx = gx + sd * sz * 0.22;
    twLeg(xb, bx - sz * 0.19, gy - sz * 0.16, bx, gy - sz * 0.16 - fh, lw, lw * 0.85, sd < 0 ? twSh(fc, 0.12) : fc);
    twLeg(xb, bx + sz * 0.19, gy - sz * 0.12, bx, gy - sz * 0.16 - fh, lw, lw * 0.85, sd < 0 ? twSh(fc, 0.16) : fc);
    u6R(xb, bx - sz * 0.075, gy - sz * 0.21 - fh * 0.55, sz * 0.15, sz * 0.055, sz * 0.02, cap, { hi: 0.5, iw: 0.6 });
    u6E(xb, bx, gy - sz * 0.16 - fh, sz * 0.065, sz * 0.065, cap, { hi: 0.5, iw: 0.7 });
  });
  twLeg(xb, gx - sz * 0.24, gy - sz * 0.16 - fh, gx + sz * 0.24, gy - sz * 0.16 - fh, sz * 0.065, sz * 0.065, TC.iron);
}
// 마법 모자 몸체. 반환: 꼭대기 y
function u6Hat(xb, gx, gy, sz, h, w0, hc, bandC, stc, n) {
  var by = gy - sz * 0.2, top = gy - sz * 0.14 - h;
  if (TW_SK) { bandC = TW_SK.hatBand(bandC); stc = TW_SK.hatStar(stc); }
  if (TW_SK && TW_SK.brim) TW_SK.brim(xb, gx, by, w0 * 1.36, sz * 0.17, hc); else { var brim = shp().ell(gx, by, w0 * 1.36, sz * 0.17); twFill(xb, brim, twSh(hc, 0.08), { hi: 0.3 }); twInk(xb, brim, hc); }
  var sp = shp(), p = sp.p;
  p.moveTo(gx - w0, by); p.quadraticCurveTo(gx - w0 * 0.22, by - h * 0.3, gx - sz * 0.03, top); p.lineTo(gx + sz * 0.03, top); p.quadraticCurveTo(gx + w0 * 0.22, by - h * 0.3, gx + w0, by);
  p.ellipse(gx, by, w0, w0 * 0.36, 0, 0, Math.PI, false); p.closePath(); sp.ext(gx - w0, top); sp.ext(gx + w0, by + w0 * 0.36);
  twCylG(xb, sp, hc, { hi: 0.45 });
  xb.save(); xb.clip(sp.p);
  if (TW_SK) twSkHat(xb, gx, by, top, w0, h);
  xb.strokeStyle = twInkC(bandC); xb.lineWidth = h * 0.1 + TW_IW * 1.6; xb.beginPath(); xb.ellipse(gx, by - h * 0.12, w0 * 1.05, w0 * 0.3, 0, 0, Math.PI); xb.stroke(); xb.strokeStyle = bandC; xb.lineWidth = h * 0.1; xb.stroke();
  for (var r = 0; r < n; r++) { var u = (r + 0.6) / (n + 0.6), yy = by - h * 0.26 - u * h * 0.56, ww = w0 * (1 - u) * 0.62, xx = gx + Math.sin(r * 2.3 + 1) * ww, ss = shp(); twStarP(ss.p, xx, yy, sz * (0.045 - u * 0.014)); xb.fillStyle = stc; xb.fill(ss.p); }
  xb.restore(); twInk(xb, sp, hc);
  return top;
}
// 아궁이(화염탑 앞)
function u6Arch(xb, gx, fy, fw, fh, wc) {
  var ar = shp(); ar.p.moveTo(gx - fw / 2, fy); ar.p.lineTo(gx - fw / 2, fy - fh + fw / 2); ar.p.arc(gx, fy - fh + fw / 2, fw / 2, Math.PI, 0); ar.p.lineTo(gx + fw / 2, fy); ar.p.closePath(); ar.ext(gx - fw / 2, fy - fh); ar.ext(gx + fw / 2, fy);
  var ag = xb.createLinearGradient(0, fy - fh, 0, fy); ag.addColorStop(0, '#fff2a0'); ag.addColorStop(0.6, '#ffb040'); ag.addColorStop(1, '#ff7a3a'); xb.fillStyle = ag; xb.fill(ar.p); twInk(xb, ar, wc);
  xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, fy - fh * 0.4, fw * 1.1, '#ffb040', 0.5); xb.restore();
}
// 플라스크 줄
function u6Flasks(xb, gx, gy, sz, n, cols) {
  for (var f = 0; f < n; f++) {
    var fx = gx - sz * 0.36 + f * sz * 0.72 / (n - 1), fy = gy - sz * 0.25 - (f % 2) * sz * 0.04, fr = sz * 0.055, fc = cols[f % cols.length];
    u6R(xb, fx - fr * 0.32, fy - fr * 1.75, fr * 0.64, fr * 1.0, fr * 0.2, '#f4f8ff', { lo: 0.2, ic: '#b8c8e8', iw: 0.5 });
    u6E(xb, fx, fy, fr, fr, fc, { hi: 0.4, iw: 0.6, sh: 1 });
  }
}
// 가마솥
function u6Pot(xb, gx, cy, r, pc, liq) {
  var pot = shp(); pot.p.moveTo(gx - r, cy - r * 0.2); pot.p.bezierCurveTo(gx - r * 1.15, cy + r * 0.95, gx + r * 1.15, cy + r * 0.95, gx + r, cy - r * 0.2); pot.p.closePath(); pot.ext(gx - r * 1.1, cy - r * 0.2); pot.ext(gx + r * 1.1, cy + r * 0.8);
  twCylG(xb, pot, pc, { hi: 0.4 }); twInk(xb, pot, pc); twShine(xb, gx - r * 0.55, cy + r * 0.12, r * 0.12, r * 0.22, 0.5, 0.3);
  u6R(xb, gx - r * 1.04, cy + r * 0.12, r * 2.08, r * 0.15, r * 0.07, TC.gold, { hi: 0.5, iw: 0.6 });
  var lip = shp().ell(gx, cy - r * 0.2, r * 1.0, r * 0.34); twFill(xb, lip, twLt(pc, 0.2)); twInk(xb, lip, pc, TW_IW * 0.8);
  var lq = shp().ell(gx, cy - r * 0.18, r * 0.84, r * 0.26); twFill(xb, lq, liq, { hi: 0.45 }); twShine(xb, gx - r * 0.3, cy - r * 0.24, r * 0.2, r * 0.06, 0.7, 0);
  xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, cy - r * 0.25, r * 1.3, liq, 0.4); xb.restore();
}
// 버섯
function u6Mush(x, bx, by, h, R, col, lean) {
  var tx = bx + (lean || 0), ty = by - h;
  twLeg(x, bx, by, tx, ty + R * 0.2, R * 0.5, R * 0.36, '#fff3e6');
  var c = shp(), p = c.p; p.moveTo(tx - R, ty + R * 0.28); p.bezierCurveTo(tx - R * 1.05, ty - R * 0.9, tx + R * 1.05, ty - R * 0.9, tx + R, ty + R * 0.28); p.quadraticCurveTo(tx, ty + R * 0.5, tx - R, ty + R * 0.28); p.closePath(); c.ext(tx - R, ty - R * 0.75); c.ext(tx + R, ty + R * 0.42);
  twFill(x, c, col, { hi: 0.45, lo: 0.26 }); twInk(x, c, col, TW_IW);
  x.fillStyle = 'rgba(255,255,255,0.92)'; [[-0.45, -0.1, 0.2], [0.3, -0.28, 0.16], [0.55, 0.08, 0.12], [-0.05, -0.42, 0.11]].forEach(function (q) { x.beginPath(); x.ellipse(tx + q[0] * R, ty + q[1] * R, q[2] * R, q[2] * R * 0.8, 0, 0, Math.PI * 2); x.fill(); });
}
// 집 몸체(조폐소): 앞벽, 옆벽, 지붕
function u6House(xb, gx, gy, sz, w, h, wc, rc, rh) {
  var d = sz * 0.24, x0 = gx - w / 2, y0 = gy - sz * 0.05;
  u6P(xb, [[x0 + w, y0 - h], [x0 + w + d * 0.6, y0 - h - d * 0.5], [x0 + w + d * 0.6, y0 - d * 0.5], [x0 + w, y0]], twSh(wc, 0.3), { hi: 0.1, ic: wc });
  var front = shp().rrect(x0, y0 - h, w, h, sz * 0.02); twFill(xb, front, wc, { hi: 0.3, lo: 0.16 });
  xb.save(); xb.clip(front.p); xb.strokeStyle = rgba(twSh(wc, 0.5), 0.18); xb.lineWidth = Math.max(0.6, TW_IW * 0.55);
  for (var rr = 1; rr < 4; rr++) { xb.beginPath(); xb.moveTo(x0, y0 - h * rr / 4); xb.lineTo(x0 + w, y0 - h * rr / 4); xb.stroke(); }
  if (TW_SK) twSkWall(xb, x0, y0, w, h);
  xb.restore(); twInk(xb, front, wc);
  if (rh) {
    var roof = shp().poly([[x0 - sz * 0.08, y0 - h + sz * 0.03], [x0 + w * 0.5, y0 - h - rh], [x0 + w + sz * 0.08, y0 - h + sz * 0.03]]);
    var roofS = shp().poly([[x0 + w * 0.5, y0 - h - rh], [x0 + w * 0.5 + d * 0.6, y0 - h - rh - d * 0.5], [x0 + w + d * 0.6 + sz * 0.08, y0 - h - d * 0.5 + sz * 0.03], [x0 + w + sz * 0.08, y0 - h + sz * 0.03]]);
    if (TW_SK) twSkHouseRoof(xb, roof, roofS, rc, x0 + w * 0.5, y0 - h - rh, x0 - sz * 0.08, x0 + w + sz * 0.08, y0 - h + sz * 0.03, sz, false);
    else { twFill(xb, roofS, twSh(rc, 0.28)); twInk(xb, roofS, rc); twFill(xb, roof, rc, { hi: 0.42 }); xb.save(); xb.clip(roof.p); xb.fillStyle = 'rgba(255,255,255,0.45)'; for (var s2 = 0; s2 < 4; s2++) { var yy = y0 - h - sz * 0.02 - s2 * sz * 0.12; xb.fillRect(x0 - sz * 0.1, yy - sz * 0.028, w + sz * 0.2, sz * 0.056); } xb.restore(); twInk(xb, roof, rc); }
  }
  return { x0: x0, y0: y0, d: d };
}
function u6Coins(x, pts, sz, r) { pts.forEach(function (q) { u6E(x, q[0], q[1], sz * (r || 0.07), sz * (r || 0.07) * 0.44, TC.gold, { hi: 0.6, iw: 0.6 }); }); }
var TB6 = {
  archer: function (xb, xf, gx, gy, sz, B, rnd) {
    if (B === 0) { // 천리안 신궁: 높고 가는 탑, 금빛 날개 사격대, 그 위에 거대한 금빛 활(움직이는 부분)
      var h = sz * 1.2, tp = gy - h;
      twCyl(xb, gx, tp, sz * 0.25, sz * 0.14, h - sz * 0.06, TC.stone, rnd, { stone: 1, rows: 7, cols: 4, bands: [0.18, 0.52, 0.84], bandCol: TC.sky });
      twWindow(xb, gx - sz * 0.04, tp + h * 0.36, sz * 0.075, sz * 0.12, 1);
      [-1, 1].forEach(function (sd) { u6Wing(xb, gx + sd * sz * 0.26, tp + sz * 0.12, sd, sz * 0.46, TC.gold); });
      twCyl(xb, gx, tp - sz * 0.04, sz * 0.44, sz * 0.245, sz * 0.12, TC.sky, rnd, { top: '#eaf6ff', bands: [0.0], bandCol: TC.gold });
      twBanner(xf, gx, gy - sz * 0.88, sz * 0.24, sz * 0.44, TC.sky, '#ffffff', TC.gold);
      xf.save(); xf.lineCap = 'round'; xf.beginPath(); xf.ellipse(gx, tp - sz * 0.075, sz * 0.43, sz * 0.24, 0, 0.25, Math.PI - 0.25); twStrokeInk(xf, TC.gold, sz * 0.05); xf.restore();
      return { mounts: [[0, -(h / sz) - 0.16]] };
    }
    // 화살비 군단: 세 층으로 쌓인 궁수대, 층마다 궁수
    var y1 = gy - sz * 0.46, y2 = y1 - sz * 0.36, y3 = y2 - sz * 0.33;
    twCyl(xb, gx, y1, sz * 0.52, sz * 0.29, sz * 0.42, TC.stone, rnd, { stone: 1, rows: 3, cols: 6, bands: [0.0], bandCol: TC.pink });
    twMerlons(xb, xf, gx, y1, sz * 0.52, sz * 0.29, 12, sz * 0.1, TC.stone, TC.pink);
    twCyl(xb, gx, y2, sz * 0.37, sz * 0.2, sz * 0.36, TC.stone, rnd, { stone: 1, rows: 2, cols: 5, bands: [0.0], bandCol: TC.pink });
    twMerlons(xb, xb, gx, y2, sz * 0.37, sz * 0.2, 9, sz * 0.085, TC.stone, TC.pink);
    twFlag(xb, gx, y3 - sz * 0.05, sz * 0.5, sz, TC.pink, 1);
    twCyl(xb, gx, y3, sz * 0.23, sz * 0.13, sz * 0.33, TC.stone, rnd, { stone: 1, rows: 2, cols: 4, bands: [0.0], bandCol: TC.gold });
    twMerlons(xb, xb, gx, y3, sz * 0.23, sz * 0.13, 7, sz * 0.075, TC.stone, TC.gold);
    [-1, 1].forEach(function (sd) { twBanner(xf, gx + sd * sz * 0.26, gy - sz * 0.3, sz * 0.15, sz * 0.26, TC.pink, '#ffffff', TC.hot); });
    return { mounts: [[-0.4, -0.56], [0.4, -0.56], [-0.25, -0.93], [0.26, -0.93], [0, -1.27]] };
  },
  catapult: function (xb, xf, gx, gy, sz, B, rnd) {
    if (B === 0) { // 유성 투석기: 불타는 운석 바구니(움직이는 부분), 양옆 큰 화덕, 금테 틀
      u6CatBase(xb, gx, gy, sz, '#f8d3c0', rnd, TC.gold);
      [-1, 1].forEach(function (sd) { twLeg(xb, gx + sd * sz * 0.42, gy - sz * 0.2, gx + sd * sz * 0.42, gy - sz * 0.62, sz * 0.07, sz * 0.06, TC.gold); twBrazier(xb, gx + sd * sz * 0.42, gy - sz * 0.68, sz * 0.12, '#ff9a4a', '#ff8f6a'); u6Flame(xb, gx + sd * sz * 0.42, gy - sz * 0.83, sz * 0.1); });
      u6CatFrame(xb, gx, gy, sz, sz * 0.74, '#e89a58', sz * 0.09, TC.gold);
      u6R(xb, gx - sz * 0.15, gy - sz * 0.5, sz * 0.3, sz * 0.23, sz * 0.06, '#ff8f6a', { hi: 0.45 }); xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, gy - sz * 0.39, sz * 0.24, '#ffb04a', 0.6); xb.restore(); twStar(xb, gx, gy - sz * 0.385, sz * 0.07, TC.lemon);
      [[-0.32, 0.02, 0.085], [0.34, 0.03, 0.095], [0.2, 0.11, 0.07]].forEach(function (r) { var mx = gx + r[0] * sz, my = gy - sz * 0.12 + r[1] * sz; xf.save(); xf.globalCompositeOperation = 'lighter'; glowAt(xf, mx, my, r[2] * sz * 2, '#ffa04a', 0.6); xf.restore(); u6E(xf, mx, my, r[2] * sz, r[2] * sz * 0.9, '#ff8a5a', { hi: 0.5, sh: 1 }); xf.fillStyle = '#ffe27a'; [[-0.3, 0.2], [0.35, -0.1], [0, 0.45]].forEach(function (q) { xf.beginPath(); xf.arc(mx + q[0] * r[2] * sz, my + q[1] * r[2] * sz, r[2] * sz * 0.16, 0, Math.PI * 2); xf.fill(); }); });
      return { mounts: [[0, -0.16 - 0.74]], arm: 0.92 };
    }
    // 산사태 투척기: 양옆에 쌓인 바위산, 굵은 틀, 집채만 한 바위(움직이는 부분)
    u6CatBase(xb, gx, gy, sz, '#f3dbe8', rnd, TC.pink);
    [[-0.5, -0.2, 0.17, '#c8b6f2'], [0.52, -0.2, 0.18, '#b5e2ff'], [-0.42, -0.46, 0.14, '#ffc2a8'], [0.45, -0.48, 0.15, '#c8b6f2'], [-0.5, -0.66, 0.1, '#b5e2ff'], [0.5, -0.7, 0.105, '#ffc2a8']].forEach(function (r) { u6E(xb, gx + r[0] * sz, gy + r[1] * sz, r[2] * sz, r[2] * sz * 0.9, r[3], { hi: 0.48, lo: 0.28, iw: 1, sh: 1 }); });
    u6CatFrame(xb, gx, gy, sz, sz * 0.72, TC.woodD, sz * 0.105, TC.iron);
    u6R(xb, gx - sz * 0.17, gy - sz * 0.52, sz * 0.34, sz * 0.26, sz * 0.06, '#c9b4e6', { hi: 0.4 }); u6R(xb, gx - sz * 0.19, gy - sz * 0.42, sz * 0.38, sz * 0.055, sz * 0.02, TC.iron, { hi: 0.5, iw: 0.6 });
    [[0.3, 0.05, 0.1, '#c8b6f2'], [0.44, -0.02, 0.075, '#ffc2a8'], [-0.34, 0.06, 0.09, '#b5e2ff'], [0.18, 0.13, 0.07, '#ffc2a8']].forEach(function (r) { u6E(xf, gx + r[0] * sz, gy - sz * 0.12 + r[1] * sz, r[2] * sz, r[2] * sz * 0.88, r[3], { hi: 0.48, lo: 0.26, sh: 1 }); });
    return { mounts: [[0, -0.16 - 0.72]], arm: 0.96 };
  },
  arcane: function (xb, xf, gx, gy, sz, B, rnd) {
    twCyl(xb, gx, gy - sz * 0.14, sz * 0.45, sz * 0.25, sz * 0.12, '#e8def8', rnd, { stone: 1, rows: 1, cols: 6, bands: [0.0], bandCol: B ? TC.gold : TC.lemon });
    if (B === 0) { // 천둥왕의 첨탑: 왕관 쓴 높은 첨탑, 양옆 번개 기둥, 번개 고리(움직이는 부분)
      [-1, 1].forEach(function (sd) { twLeg(xb, gx + sd * sz * 0.44, gy - sz * 0.2, gx + sd * sz * 0.5, gy - sz * 0.98, sz * 0.065, sz * 0.045, TC.gold); u6Spike(xb, gx + sd * sz * 0.5, gy - sz * 0.95, -Math.PI / 2 + sd * 0.1, sz * 0.26, sz * 0.055, '#5fc2ff'); });
      var h = sz * 1.28, w0 = sz * 0.33, top = u6Hat(xb, gx, gy, sz, h, w0, '#5b8cf5', TC.lemon, TC.lemon, 7);
      twWindow(xb, gx + sz * 0.04, gy - sz * 0.2 - h * 0.34, sz * 0.065, sz * 0.09, 1);
      for (var c = 0; c < 4; c++) { var cy = gy - sz * 0.33 - c * h * 0.2, rr = w0 * (1 - c * 0.2) + sz * 0.07, ring = shp(); ring.p.ellipse(gx, cy, rr, rr * 0.36, 0, 0, Math.PI * 2); ring.p.ellipse(gx, cy, rr * 0.8, rr * 0.26, 0, 0, Math.PI * 2, true); ring.ext(gx - rr, cy - rr * 0.36); ring.ext(gx + rr, cy + rr * 0.36); twFill(xf, ring, c % 2 ? TC.lemon : TC.sky, { hi: 0.55 }); twInk(xf, ring, c % 2 ? TC.lemon : TC.sky, TW_IW * 0.7); }
      u6P(xf, [[gx - sz * 0.1, top + sz * 0.13], [gx - sz * 0.15, top - sz * 0.04], [gx - sz * 0.055, top + sz * 0.04], [gx, top - sz * 0.1], [gx + sz * 0.055, top + sz * 0.04], [gx + sz * 0.15, top - sz * 0.04], [gx + sz * 0.1, top + sz * 0.13]], TC.gold, { hi: 0.6 });
      [-1, 1].forEach(function (sd) { u6Cloud(xf, gx + sd * sz * 0.4, gy - sz * 0.42, sz * 0.15, '#d6d0ff'); });
      return { mounts: [[0, -(gy - top) / sz - 0.36]], an: { rodL: [-0.5, -1.2], rodR: [0.5, -1.2] } };
    }
    // 별빛 붕괴포: 분홍 첨탑 위 금빛 초승달 받침에 거대한 별 구슬(움직이는 부분), 비스듬한 큰 고리
    var h2 = sz * 1.06, top2 = u6Hat(xb, gx, gy, sz, h2, sz * 0.33, '#ff86c8', TC.gold, '#fff6e8', 6);
    twWindow(xb, gx + sz * 0.04, gy - sz * 0.2 - h2 * 0.36, sz * 0.065, sz * 0.09, 1);
    var R = sz * 0.36, ccy = top2 - sz * 0.34;
    twLeg(xb, gx, top2 + sz * 0.06, gx, ccy + R - sz * 0.02, sz * 0.07, sz * 0.06, TC.gold);
    xb.save(); xb.lineCap = 'round'; xb.beginPath(); xb.arc(gx, ccy, R, -0.14 * Math.PI, 1.14 * Math.PI); twStrokeInk(xb, TC.gold, sz * 0.08); xb.strokeStyle = 'rgba(255,255,255,0.6)'; xb.lineWidth = sz * 0.02; xb.beginPath(); xb.arc(gx, ccy, R + sz * 0.012, 0.55 * Math.PI, 0.95 * Math.PI); xb.stroke(); xb.restore();
    [-1, 1].forEach(function (sd) { twStar(xb, gx + sd * R * Math.cos(0.14 * Math.PI), ccy - R * Math.sin(0.14 * Math.PI) - sz * 0.03, sz * 0.085, TC.lemon); });
    u6Hoop(xb, xf, gx, ccy, sz * 0.56, sz * 0.15, sz * 0.045, TC.gold, -0.3);
    return { mounts: [[0, -(gy - ccy) / sz]], an: { core: [0, -(gy - ccy) / sz] } };
  },
  frost: function (xb, xf, gx, gy, sz, B, rnd) {
    twCyl(xb, gx, gy - sz * 0.36, sz * 0.4, sz * 0.22, sz * 0.32, '#9cc4f4', rnd, { stone: 1, rows: 2, cols: 5, top: '#e2f2ff', bands: B ? [0.0] : [0.0, 0.66], bandCol: B ? TC.pink : '#ffffff' });
    if (B === 0) { // 절대영도: 넓게 벌어진 얼음 왕관과 큰 얼음 뿔 위로 거대한 얼음 결정이 떠 있음(움직이는 부분)
      [-1, 1].forEach(function (sd) { u6Spike(xb, gx + sd * sz * 0.4, gy - sz * 0.3, -Math.PI / 2 + sd * 0.4, sz * 0.82, sz * 0.085, '#2f8cff'); });
      for (var i = 0; i < 7; i++) { var d = i - 3; u6Spike(xb, gx + d * sz * 0.1, gy - sz * 0.38, -Math.PI / 2 + d * 0.24, sz * (0.5 - Math.abs(d) * 0.05), sz * 0.062, i % 2 ? '#45acff' : '#2f96ff'); }
      xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, gy - sz * 0.9, sz * 0.7, '#9fdcff', 0.32); xb.restore();
      [-0.3, 0.3].forEach(function (ox) { u6Spike(xf, gx + ox * sz, gy - sz * 0.1, -Math.PI / 2 + ox * 0.9, sz * 0.2, sz * 0.045, '#6cbcff'); });
      return { mounts: [[0, -1.3]] };
    }
    // 빙하 폭풍: 빙산 덩어리 사이에서 소용돌이(움직이는 부분)가 구름까지 솟음
    var berg = function (x, cx, by, w, hh, col) { u6P(x, [[cx - w / 2, by], [cx - w * 0.44, by - hh * 0.66], [cx - w * 0.14, by - hh], [cx + w * 0.2, by - hh * 0.84], [cx + w * 0.47, by - hh * 0.48], [cx + w / 2, by]], col, { hi: 0.35, lo: 0.3, iw: 1 }); u6P(x, [[cx - w * 0.44, by - hh * 0.66], [cx - w * 0.14, by - hh], [cx + w * 0.2, by - hh * 0.84], [cx + w * 0.02, by - hh * 0.56]], '#f2faff', { hi: 0.3, lo: 0.05, ink: 0 }); };
    berg(xb, gx - sz * 0.4, gy - sz * 0.22, sz * 0.42, sz * 0.66, '#6cbcff'); berg(xb, gx + sz * 0.42, gy - sz * 0.22, sz * 0.44, sz * 0.76, '#58aef8'); berg(xb, gx + sz * 0.02, gy - sz * 0.36, sz * 0.4, sz * 0.42, '#8fd0ff');
    u6Cloud(xb, gx - sz * 0.24, gy - sz * 1.2, sz * 0.2, '#dcebff'); u6Cloud(xb, gx + sz * 0.26, gy - sz * 1.18, sz * 0.19, '#cfe2ff');
    xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, gy - sz * 0.8, sz * 0.6, '#9fdcff', 0.3); xb.restore();
    u6Cloud(xf, gx, gy - sz * 1.1, sz * 0.25, '#f4faff');
    [-0.34, 0.36].forEach(function (ox) { u6E(xf, gx + ox * sz, gy - sz * 0.06, sz * 0.1, sz * 0.055, '#ffffff', { lo: 0.14, ic: '#bfe0ff', iw: 0.7 }); });
    return { mounts: [[0, -0.76]] };
  },
  ballista: function (xb, xf, gx, gy, sz, B, rnd) {
    var rx = sz * 0.48, ry = rx * 0.57, h = sz * 0.36;
    if (B === 0) { // 용잡이 노포: 용 뿔 전리품 둘, 가시 두른 흰 성대 위에 거대한 금빛 쌍활 작살포(움직이는 부분)
      [-1, 1].forEach(function (sd) { u6Horn(xb, gx + sd * sz * 0.42, gy - h * 0.5, sd, sz * 0.86, sz * 0.085, '#fff3d6'); });
      twCyl(xb, gx, gy - h, rx, ry, h, '#eef0ff', rnd, { stone: 1, rows: 2, cols: 6, bands: [0.1, 0.62], bandCol: TC.sky });
      twMerlons(xb, xf, gx, gy - h, rx, ry, 10, sz * 0.1, '#eef0ff', TC.gold);
      for (var k = -2; k <= 2; k++) { var px = gx + k * rx * 0.36, py = gy + ry * (0.86 - Math.abs(k) * 0.12) - h * 0.45; u6P(xf, [[px - sz * 0.045, py], [px, py + sz * 0.12], [px + sz * 0.045, py]], '#ffffff', { lo: 0.2, ic: TC.sky, iw: 0.7 }); }
      u6E(xb, gx, gy - h - sz * 0.04, sz * 0.2, sz * 0.115, TC.gold, { hi: 0.5, iw: 0.8 });
      return { mounts: [[0, -(h / sz) - 0.12]] };
    }
    // 폭풍 연노: 화살 다발 탄창 탑과 양옆 화살 걸이, 세 겹 연노(움직이는 부분)
    twCyl(xb, gx, gy - h, rx, ry, h, TC.stone, rnd, { stone: 1, rows: 2, cols: 6, bands: [0.08, 0.6], bandCol: TC.pink });
    twMerlons(xb, xf, gx, gy - h, rx, ry, 10, sz * 0.085, TC.stone, TC.pink);
    [-1, 1].forEach(function (sd) {
      var bx = gx + sd * rx * 1.0, by = gy - h * 0.2; twLeg(xb, bx, by, bx, by - sz * 0.56, sz * 0.045, sz * 0.045, TC.woodD); twFlag(xb, bx, by - sz * 0.54, sz * 0.2, sz, TC.pink, sd);
      for (var j = 0; j < 6; j++) { var yy = by - sz * 0.1 - j * sz * 0.065; u6Line(xb, [[bx - sd * sz * 0.02, yy], [bx + sd * sz * 0.17, yy - sz * 0.03]], Math.max(1, sz * 0.022), '#ffe8c0'); u6E(xb, bx + sd * sz * 0.18, yy - sz * 0.032, sz * 0.024, sz * 0.024, TC.pink, { hi: 0.4, iw: 0.6 }); }
    });
    u6R(xb, gx - sz * 0.15, gy - h - sz * 0.74, sz * 0.3, sz * 0.62, sz * 0.05, TC.woodD, { cyl: 1 }); u6R(xb, gx - sz * 0.17, gy - h - sz * 0.56, sz * 0.34, sz * 0.06, sz * 0.02, TC.pink, { hi: 0.5, iw: 0.6 }); u6R(xb, gx - sz * 0.17, gy - h - sz * 0.32, sz * 0.34, sz * 0.06, sz * 0.02, TC.pink, { hi: 0.5, iw: 0.6 });
    for (var a = -2; a <= 2; a++) { u6Line(xb, [[gx + a * sz * 0.055, gy - h - sz * 0.72], [gx + a * sz * 0.07, gy - h - sz * 0.9]], Math.max(1, sz * 0.022), '#ffe8c0'); u6P(xb, [[gx + a * sz * 0.07 - sz * 0.03, gy - h - sz * 0.89], [gx + a * sz * 0.075, gy - h - sz * 0.98], [gx + a * sz * 0.07 + sz * 0.03, gy - h - sz * 0.89]], TC.hot, { hi: 0.4, iw: 0.6 }); }
    u6E(xb, gx, gy - h - sz * 0.04, sz * 0.18, sz * 0.1, TC.iron, { hi: 0.45, iw: 0.8 });
    return { mounts: [[0, -(h / sz) - 0.12]] };
  },
  bell: function (xb, xf, gx, gy, sz, B, rnd) {
    twCyl(xb, gx, gy - sz * 0.16, sz * 0.46, sz * 0.26, sz * 0.14, TC.stone, rnd, { stone: 1, rows: 1, cols: 6, bands: [0.0], bandCol: B ? TC.gold : TC.sky });
    if (B === 0) { // 승전고: 지붕 대신 높은 기둥 사이에 걸린 거대한 북(움직이는 부분), 양옆 금 나팔, 깃발
      [-1, 1].forEach(function (sd) {
        var bx = gx + sd * sz * 0.36, by = gy - sz * 0.62, tx = gx + sd * sz * 0.8, ty = gy - sz * 1.12, nx = (ty - by), ny = -(tx - bx), nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
        u6P(xb, [[bx + nx * sz * 0.03, by + ny * sz * 0.03], [tx + nx * sz * 0.13, ty + ny * sz * 0.13], [tx - nx * sz * 0.13, ty - ny * sz * 0.13], [bx - nx * sz * 0.03, by - ny * sz * 0.03]], TC.gold, { hi: 0.6 });
        u6E(xb, tx, ty, sz * 0.14, sz * 0.085, TC.gold, { rot: Math.atan2(ny, nx), hi: 0.6 }); u6E(xb, tx + sd * sz * 0.005, ty - sz * 0.003, sz * 0.095, sz * 0.05, '#b87a2a', { rot: Math.atan2(ny, nx), hi: 0.1, ink: 0 });
      });
      [-1, 1].forEach(function (sd) { var px = gx + sd * sz * 0.43; twFlag(xb, px, gy - sz * 1.22, sz * 0.26, sz, TC.sky, sd); twCyl(xb, px, gy - sz * 1.22, sz * 0.07, sz * 0.038, sz * 1.08, '#fff3e6', rnd, { top: TC.gold, bands: [0.0, 0.46, 0.92], bandCol: TC.sky }); });
      twLeg(xb, gx - sz * 0.54, gy - sz * 1.2, gx + sz * 0.54, gy - sz * 1.2, sz * 0.09, sz * 0.09, TC.sky); [-1, 1].forEach(function (sd) { u6E(xb, gx + sd * sz * 0.56, gy - sz * 1.2, sz * 0.06, sz * 0.06, TC.gold, { hi: 0.55, iw: 0.7 }); });
      twGem(xb, gx, gy - sz * 1.31, sz * 0.055, '#bff0ff');
      return { mounts: [[0, -0.72]], drum: 1 };
    }
    // 천상의 종: 금빛 지붕 양옆으로 큰 흰 날개, 꼭대기 빛 고리, 큰 금종(움직이는 부분)
    var pc = '#fff3e6', ph = sz * 0.84, top = gy - sz * 0.16 - ph;
    [-1, 1].forEach(function (sd) { u6Wing(xb, gx + sd * sz * 0.3, top + sz * 0.02, sd, sz * 0.62, '#ffffff'); });
    [[-0.3, -0.12], [0.3, -0.12], [-0.34, 0.1], [0.34, 0.1]].forEach(function (p, i) { var x = i < 2 ? xb : xf; twLeg(x, gx + p[0] * sz, gy - sz * 0.16 + p[1] * sz, gx + p[0] * sz * 0.92, top + p[1] * sz * 0.5, sz * 0.08, sz * 0.07, i < 2 ? twSh(pc, 0.14) : pc); u6E(x, gx + p[0] * sz * 0.92, top + p[1] * sz * 0.5 + sz * 0.02, sz * 0.055, sz * 0.028, TC.gold, { hi: 0.5, iw: 0.5 }); });
    twRoof(xf, gx, top, sz * 0.52, sz * 0.21, sz * 0.54, '#ffd86a', { stripe: '#ffffff', sa: 0.6, trim: '#fff6c8' });
    u6Hoop(xf, xf, gx, top - sz * 0.74, sz * 0.2, sz * 0.07, sz * 0.04, TC.lemon);
    twStar(xf, gx, top - sz * 0.6, sz * 0.075, '#fff3b0');
    return { mounts: [[0, -(gy - top) / sz + 0.3]], an: { halo: [0, -(gy - top) / sz - 0.74] } };
  },
  flame: function (xb, xf, gx, gy, sz, B, rnd) {
    if (B === 0) { // 태양룡의 숨결: 탑 뒤로 큰 태양 원반, 그 앞에 금빛 용머리(움직이는 부분)
      var h = sz * 0.72, rw = sz * 0.34, wc = '#ff8f6a', scy = gy - h - sz * 0.26, R = sz * 0.54;
      for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2 + 0.26, rr = R * (i % 2 ? 0.84 : 1); u6P(xb, [[gx + Math.cos(a - 0.2) * R * 0.6, scy + Math.sin(a - 0.2) * R * 0.6], [gx + Math.cos(a) * rr, scy + Math.sin(a) * rr], [gx + Math.cos(a + 0.2) * R * 0.6, scy + Math.sin(a + 0.2) * R * 0.6]], i % 2 ? '#ff9a4a' : TC.gold, { hi: 0.5 }); }
      u6E(xb, gx, scy, R * 0.66, R * 0.66, TC.lemon, { hi: 0.55, lo: 0.12, ic: TC.gold, iw: 1.1 }); xb.save(); xb.strokeStyle = 'rgba(255,154,74,0.75)'; xb.lineWidth = Math.max(1, sz * 0.025); xb.beginPath(); xb.arc(gx, scy, R * 0.5, 0, Math.PI * 2); xb.stroke(); xb.restore();
      twCyl(xb, gx, gy - h, rw, rw * 0.57, h - sz * 0.04, wc, rnd, { stone: 1, rows: 4, cols: 4, bands: [0.08, 0.52], bandCol: TC.gold });
      u6Arch(xb, gx, gy - sz * 0.04 + rw * 0.5, sz * 0.22, sz * 0.22, wc);
      u6E(xb, gx, gy - h, sz * 0.21, sz * 0.12, TC.gold, { hi: 0.5, iw: 0.8 });
      [-1, 1].forEach(function (sd) { var px = gx + sd * sz * 0.42, py = gy + sz * 0.1; twLeg(xf, px, py, px, py - sz * 0.26, sz * 0.065, sz * 0.055, TC.gold); twBrazier(xf, px, py - sz * 0.3, sz * 0.085, '#ff9a4a', TC.gold); u6Flame(xf, px, py - sz * 0.41, sz * 0.07); });
      return { mounts: [[0, -(h / sz) - 0.1]], dragon: 1 };
    }
    // 지옥불 고리: 탑을 두른 큰 쇠고리를 따라 불꽃이 돎(움직이는 부분), 뿔 달린 큰 화로
    var h2 = sz * 0.62, rw2 = sz * 0.33, wc2 = '#ff8a72', hy = gy - sz * 0.7;
    u6Hoop(xb, xb, gx, hy, sz * 0.62, sz * 0.25, sz * 0.065, '#8a6ad0');
    twCyl(xb, gx, gy - h2, rw2, rw2 * 0.57, h2 - sz * 0.04, wc2, rnd, { stone: 1, rows: 3, cols: 4, bands: [0.1, 0.56], bandCol: TC.gold });
    u6Arch(xb, gx, gy - sz * 0.04 + rw2 * 0.5, sz * 0.21, sz * 0.21, wc2);
    [[-0.44, -0.06], [0.44, -0.06]].forEach(function (p) { twLeg(xb, gx + p[0] * sz, gy + p[1] * sz, gx + p[0] * sz, hy, sz * 0.07, sz * 0.06, TC.pink); });
    [-1, 1].forEach(function (sd) { u6Horn(xb, gx + sd * sz * 0.2, gy - h2 - sz * 0.06, sd, sz * 0.4, sz * 0.05, TC.gold); });
    twBrazier(xb, gx, gy - h2 - sz * 0.03, sz * 0.29, '#ff8a3a', TC.gold);
    xf.save(); xf.lineCap = 'butt'; xf.beginPath(); xf.ellipse(gx, hy, sz * 0.62, sz * 0.25, 0, 0, Math.PI); twStrokeInk(xf, '#8a6ad0', sz * 0.065); xf.strokeStyle = rgba(twLt('#8a6ad0', 0.75), 0.85); xf.lineWidth = Math.max(0.6, sz * 0.017); xf.beginPath(); xf.ellipse(gx, hy - sz * 0.013, sz * 0.62, sz * 0.25, 0, 0.3, Math.PI - 0.3); xf.stroke(); xf.restore();
    for (var q = 0; q < 5; q++) { var qa = 0.3 + q / 4 * (Math.PI - 0.6); u6E(xf, gx + Math.cos(qa) * sz * 0.62, hy + Math.sin(qa) * sz * 0.25, sz * 0.03, sz * 0.03, TC.gold, { hi: 0.6, iw: 0.5 }); }
    return { mounts: [[0, -(h2 / sz) - 0.14]], ring6: 1, an: { hoop: [0, -0.7, 0.62, 0.25] } };
  },
  alchemy: function (xb, xf, gx, gy, sz, B, rnd) {
    var liq = B ? '#c07aff' : '#d8f04a';
    twCyl(xb, gx, gy - sz * 0.2, sz * 0.46, sz * 0.26, sz * 0.18, TC.stone, rnd, { stone: 1, rows: 1, cols: 6, noTop: 1, bands: [0.0], bandCol: B ? TC.pink : TC.sky }); twDeck(xb, gx, gy - sz * 0.2, sz * 0.46, sz * 0.26, TC.wood, rnd);
    if (B === 0) { // 만물 용해액: 삼발이 위 거대한 유리 탱크에 끓는 용해액(움직이는 부분), 굽은 관과 줄무늬 굴뚝
      var r = sz * 0.37, cy = gy - sz * 0.8;
      var ch = u6R(xb, gx - sz * 0.5, cy - r * 1.5, sz * 0.13, r * 2.6, sz * 0.045, TC.pink, { cyl: 1, hi: 0.4, ink: 0 }); xb.save(); xb.clip(ch.p); xb.fillStyle = 'rgba(255,255,255,0.7)'; for (var st = 0; st < 6; st++) xb.fillRect(gx - sz * 0.52, cy - r * 1.36 + st * sz * 0.16, sz * 0.17, sz * 0.06); xb.restore(); twInk(xb, ch, TC.pink, TW_IW * 0.8); twCyl(xb, gx - sz * 0.435, cy - r * 1.5, sz * 0.085, sz * 0.035, sz * 0.035, TC.lav, null, {});
      u6Flasks(xb, gx, gy, sz, 7, [liq, TC.pink, TC.sky, TC.lemon]);
      [[-0.27, 0], [0.27, 0], [0, 0.06]].forEach(function (p) { twLeg(xb, gx + p[0] * sz, gy - sz * 0.22 + p[1] * sz, gx + p[0] * sz * 0.8, cy + r * 0.72, sz * 0.05, sz * 0.045, TC.gold); });
      u6Flame(xb, gx, gy - sz * 0.33, sz * 0.065);
      var tank = shp().ell(gx, cy, r, r); xb.save(); xb.globalAlpha = 0.5; xb.fillStyle = '#eaf7ff'; xb.fill(tank.p); xb.restore();
      xb.save(); xb.clip(tank.p); var lg = xb.createLinearGradient(0, cy - r * 0.25, 0, cy + r); lg.addColorStop(0, twLt(liq, 0.25)); lg.addColorStop(1, twSh(liq, 0.3)); xb.fillStyle = lg; xb.fillRect(gx - r, cy - r * 0.22, r * 2, r * 1.3); xb.restore();
      u6E(xb, gx, cy - r * 0.22, r * 0.97, r * 0.2, twLt(liq, 0.45), { hi: 0.3, lo: 0.05, ic: liq, iw: 0.6 });
      xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, cy + r * 0.2, r * 1.5, liq, 0.35); xb.restore();
      u6R(xb, gx - sz * 0.075, cy - r - sz * 0.13, sz * 0.15, sz * 0.19, sz * 0.03, '#f4f8ff', { lo: 0.2, ic: '#9fb8e8' }); u6R(xb, gx - sz * 0.1, cy - r - sz * 0.17, sz * 0.2, sz * 0.065, sz * 0.025, TC.gold, { hi: 0.55, iw: 0.7 });
      u6Line(xb, [[gx + sz * 0.05, cy - r - sz * 0.2], [gx + sz * 0.62, cy - r - sz * 0.3], [gx + sz * 0.56, cy + r * 0.3]], Math.max(1.2, sz * 0.04), '#e6f4ff', 1);
      u6R(xb, gx + sz * 0.5, cy + r * 0.26, sz * 0.12, sz * 0.07, sz * 0.02, TC.gold, { hi: 0.55, iw: 0.7 });
      twInk(xf, tank, '#7fb6ee', TW_IW * 1.25); xf.save(); xf.strokeStyle = 'rgba(255,255,255,0.92)'; xf.lineCap = 'round'; xf.lineWidth = Math.max(1, sz * 0.035); xf.beginPath(); xf.arc(gx, cy, r * 0.8, Math.PI * 1.08, Math.PI * 1.42); xf.stroke(); xf.restore(); twShine(xf, gx + r * 0.5, cy + r * 0.45, r * 0.09, r * 0.06, 0.6);
      xf.save(); xf.lineCap = 'round'; xf.beginPath(); xf.ellipse(gx, cy + r * 0.74, r * 0.72, r * 0.2, 0, 0.1, Math.PI - 0.1); twStrokeInk(xf, TC.gold, sz * 0.05); xf.restore();
      return { mounts: [[0, -0.8]], liq: liq, chimney: [-0.435, -(gy - (cy - r * 1.55)) / sz], an: { tank: [0, -0.8, 0.37], drip: [0.56, -(gy - (cy + r * 0.34)) / sz] } };
    }
    // 대역병: 큰 보라 가마솥 뒤로 얼룩 버섯 셋이 솟고 포자 구름이 피어오름(움직이는 부분)
    u6Mush(xb, gx + sz * 0.08, gy - sz * 0.5, sz * 0.86, sz * 0.2, '#b07aff', sz * 0.04);
    u6Mush(xb, gx - sz * 0.44, gy - sz * 0.26, sz * 0.74, sz * 0.21, '#ff8fd0', -sz * 0.05);
    u6Mush(xb, gx + sz * 0.47, gy - sz * 0.26, sz * 0.5, sz * 0.17, '#c58aff', sz * 0.04);
    u6Flasks(xb, gx, gy, sz, 7, [liq, TC.pink, '#b9a2ff', TC.lemon]);
    u6Pot(xb, gx, gy - sz * 0.44, sz * 0.36, '#7a58b8', liq);
    xf.save(); xf.lineCap = 'round'; xf.beginPath(); xf.moveTo(gx - sz * 0.4, gy - sz * 0.26); xf.quadraticCurveTo(gx - sz * 0.5, gy - sz * 0.76, gx - sz * 0.2, gy - sz * 0.62); xf.strokeStyle = 'rgba(150,170,220,0.75)'; xf.lineWidth = Math.max(1, sz * 0.03) + TW_IW; xf.stroke(); xf.strokeStyle = 'rgba(235,250,255,0.95)'; xf.lineWidth = Math.max(1, sz * 0.03); xf.stroke(); xf.restore();
    return { mounts: [[0, -0.5]], liq: liq, chimney: [0.12, -1.5], an: { m1: [0.12, -1.42], m2: [-0.49, -1.06], m3: [0.51, -0.8] } };
  },
  cannon: function (xb, xf, gx, gy, sz, B, rnd) {
    var rx = sz * 0.5, ry = rx * 0.57;
    if (B === 0) { // 성벽 파괴자: 낮고 넓은 성대 위에 탑보다 긴 거포(움직이는 부분), 큰 포탄과 깃발
      var h = sz * 0.44;
      twCyl(xb, gx, gy - h, rx, ry, h - sz * 0.02, TC.stone, rnd, { stone: 1, rows: 3, cols: 7, bands: [0.08, 0.5, 0.82], bandCol: TC.sky });
      twMerlons(xb, xf, gx, gy - h, rx, ry, 8, sz * 0.12, TC.stone, TC.gold);
      u6E(xb, gx, gy - h - sz * 0.02, sz * 0.3, sz * 0.17, TC.gold, { hi: 0.5, iw: 0.8 });
      [-1, 1].forEach(function (sd) { twBanner(xf, gx + sd * rx * 0.5, gy - h * 0.86, sz * 0.15, sz * 0.28, TC.sky, '#ffffff', TC.gold); });
      [[0.56, 0.2], [0.68, 0.11], [-0.6, 0.18]].forEach(function (p) { var bx = gx + p[0] * sz, by = gy + p[1] * sz, sh = shp(), q = sh.p; q.moveTo(bx - sz * 0.055, by); q.lineTo(bx - sz * 0.055, by - sz * 0.13); q.quadraticCurveTo(bx, by - sz * 0.27, bx + sz * 0.055, by - sz * 0.13); q.lineTo(bx + sz * 0.055, by); q.closePath(); sh.ext(bx - sz * 0.055, by - sz * 0.25); sh.ext(bx + sz * 0.055, by); twCylG(xf, sh, '#4f9cf0', { hi: 0.5 }); twInk(xf, sh, '#4f9cf0', TW_IW * 0.8); u6R(xf, bx - sz * 0.06, by - sz * 0.05, sz * 0.12, sz * 0.045, sz * 0.015, TC.gold, { hi: 0.55, iw: 0.6 }); });
      return { mounts: [[0, -(h / sz) - 0.08]] };
    }
    // 포화 요새: 본성과 양옆 작은 포탑, 세 포탑이 번갈아 쏨(움직이는 부분)
    var h2 = sz * 0.38;
    twCyl(xb, gx, gy - h2, rx, ry, h2 - sz * 0.02, TC.stone, rnd, { stone: 1, rows: 2, cols: 7, bands: [0.1], bandCol: TC.pink });
    twMerlons(xb, xf, gx, gy - h2, rx, ry, 8, sz * 0.1, TC.stone, TC.pink);
    [-1, 1].forEach(function (sd) { var px = gx + sd * sz * 0.45; twFlag(xb, px - sd * sz * 0.03, gy - sz * 0.84, sz * 0.36, sz, TC.pink, sd); twCyl(xb, px, gy - sz * 0.78, sz * 0.16, sz * 0.09, sz * 0.52, TC.stone, rnd, { stone: 1, rows: 3, cols: 3, bands: [0.0, 0.6], bandCol: TC.pink }); twMerlons(xb, xb, px, gy - sz * 0.78, sz * 0.16, sz * 0.09, 6, sz * 0.065, TC.stone, TC.pink); });
    twCyl(xb, gx, gy - sz * 0.68, sz * 0.28, sz * 0.16, sz * 0.3, TC.stone, rnd, { stone: 1, rows: 2, cols: 4, bands: [0.0], bandCol: TC.gold });
    twMerlons(xb, xb, gx, gy - sz * 0.68, sz * 0.28, sz * 0.16, 8, sz * 0.07, TC.stone, TC.pink);
    var bx0 = gx + rx * 0.2, by0 = gy + ry * 0.62; [3, 2, 1].forEach(function (n, r) { for (var i = 0; i < n; i++) { var cx = bx0 + (i - (n - 1) / 2) * sz * 0.1, cy = by0 - r * sz * 0.08; u6E(xf, cx, cy, sz * 0.052, sz * 0.052, '#7a5ab0', { hi: 0.4, iw: 0.6, sh: 1 }); } });
    return { mounts: [[0, -0.74], [-0.45, -0.84], [0.45, -0.84]] };
  },
  mint: function (xb, xf, gx, gy, sz, B, rnd) {
    if (B === 0) { // 황금 상단: 금 지붕 큰 상관 뒤로 금 돔 시계탑, 금화 실은 수레와 상자 더미
      var tx = gx + sz * 0.13, ty = gy - sz * 1.32;
      twFlag(xb, tx, ty - sz * 0.2, sz * 0.34, sz, TC.sky, 1);
      var dm = shp(); dm.p.ellipse(tx, ty, sz * 0.2, sz * 0.24, 0, Math.PI, 0); dm.p.closePath(); dm.ext(tx - sz * 0.2, ty - sz * 0.24); dm.ext(tx + sz * 0.2, ty); twFill(xb, dm, TC.gold, { hi: 0.6, lo: 0.3 }); twInk(xb, dm, TC.gold); twShine(xb, tx - sz * 0.08, ty - sz * 0.14, sz * 0.035, sz * 0.02, 0.85);
      twCyl(xb, tx, ty, sz * 0.18, sz * 0.09, sz * 0.9, TC.stone, rnd, { stone: 1, rows: 4, cols: 3, bands: [0.0, 0.34], bandCol: TC.sky });
      var H = u6House(xb, gx, gy, sz, sz * 0.86, sz * 0.58, TC.stone, TC.gold, sz * 0.42);
      twWindow(xb, H.x0 + sz * 0.16, H.y0 - sz * 0.38, sz * 0.08, sz * 0.1, 1); twWindow(xb, H.x0 + sz * 0.7, H.y0 - sz * 0.38, sz * 0.08, sz * 0.1, 1);
      u6R(xb, gx - sz * 0.1, H.y0 - sz * 0.27, sz * 0.2, sz * 0.27, sz * 0.1, TC.woodD, { hi: 0.3 }); twHeart(xb, gx, H.y0 - sz * 0.17, sz * 0.035, TC.pink);
      var aw = shp(), ap = aw.p, y0 = H.y0; ap.moveTo(gx - sz * 0.26, y0 - sz * 0.35); ap.lineTo(gx + sz * 0.26, y0 - sz * 0.35); ap.lineTo(gx + sz * 0.3, y0 - sz * 0.23); for (var sc2 = 0; sc2 < 6; sc2++) { var xa = gx + sz * 0.3 - sz * 0.1 * sc2; ap.quadraticCurveTo(xa - sz * 0.05, y0 - sz * 0.17, xa - sz * 0.1, y0 - sz * 0.23); } ap.closePath(); aw.ext(gx - sz * 0.3, y0 - sz * 0.35); aw.ext(gx + sz * 0.3, y0 - sz * 0.17);
      xf.save(); xf.clip(ap); for (var st2 = 0; st2 < 7; st2++) { xf.fillStyle = st2 % 2 ? '#ffffff' : TC.sky; xf.fillRect(gx - sz * 0.3 + st2 * sz * 0.09, y0 - sz * 0.36, sz * 0.09, sz * 0.2); } xf.restore(); twInk(xf, aw, TC.sky, TW_IW * 0.9);
      u6R(xf, gx - sz * 0.7, gy - sz * 0.2, sz * 0.3, sz * 0.15, sz * 0.03, TC.wood, { hi: 0.35 }); u6Coins(xf, [[gx - sz * 0.6, gy - sz * 0.22], [gx - sz * 0.5, gy - sz * 0.22], [gx - sz * 0.55, gy - sz * 0.27], [gx - sz * 0.55, gy - sz * 0.32]], sz, 0.075);
      [-0.64, -0.46].forEach(function (ox) { u6E(xf, gx + ox * sz, gy - sz * 0.03, sz * 0.055, sz * 0.055, TC.pink, { hi: 0.4, iw: 0.7 }); });
      u6R(xf, gx + sz * 0.4, gy - sz * 0.26, sz * 0.22, sz * 0.22, sz * 0.04, TC.wood, { hi: 0.35 }); u6R(xf, gx + sz * 0.5, gy - sz * 0.43, sz * 0.17, sz * 0.17, sz * 0.035, TC.woodD, { hi: 0.35 });
      u6Coins(xf, [[gx - sz * 0.3, gy + sz * 0.02], [gx - sz * 0.3, gy - sz * 0.02], [gx + sz * 0.3, gy + sz * 0.03], [gx + sz * 0.3, gy - sz * 0.01], [gx + sz * 0.3, gy - sz * 0.05]], sz);
      return { mounts: [[0, -0.7]], an: { gear: [0.13, -1.0, 0.11], coin: [0.13, -1.6] } };
    }
    // 용의 보물고: 금고 위에 산처럼 쌓인 금화 더미, 그 위에 웅크린 아기 용 조각
    var w = sz * 0.86, h = sz * 0.5, H2 = u6House(xb, gx, gy, sz, w, h, '#fff0f6', TC.pink, 0), x0 = H2.x0, yT = H2.y0 - h;
    u6R(xb, x0 - sz * 0.04, yT - sz * 0.05, w + sz * 0.08, sz * 0.09, sz * 0.03, TC.gold, { hi: 0.55 });
    var md = shp(), mp = md.p, ax = gx + sz * 0.03, ay = yT - sz * 0.5; mp.moveTo(x0 + sz * 0.02, yT - sz * 0.03); mp.bezierCurveTo(x0 + w * 0.12, yT - sz * 0.32, ax - sz * 0.2, ay, ax, ay); mp.bezierCurveTo(ax + sz * 0.2, ay, x0 + w * 0.92, yT - sz * 0.3, x0 + w + sz * 0.06, yT - sz * 0.03); mp.closePath(); md.ext(x0, ay); md.ext(x0 + w + sz * 0.06, yT);
    twFill(xb, md, TC.gold, { hi: 0.55, lo: 0.3 }); xb.save(); xb.clip(mp);
    for (var cr = 0; cr < 6; cr++) for (var cc = 0; cc < 9; cc++) { var px = x0 + (cc + (cr % 2) * 0.5) * w / 8, py = yT - sz * 0.04 - cr * sz * 0.085; xb.fillStyle = (cr + cc) % 3 ? 'rgba(255,246,190,0.75)' : 'rgba(214,140,40,0.35)'; xb.beginPath(); xb.ellipse(px, py, sz * 0.058, sz * 0.026, 0, 0, Math.PI * 2); xb.fill(); xb.strokeStyle = rgba(twInkC(TC.gold), 0.55); xb.lineWidth = Math.max(0.6, TW_IW * 0.5); xb.stroke(); }
    xb.restore(); twInk(xb, md, TC.gold, TW_IW * 1.1);
    twGem(xb, x0 + w * 0.2, yT - sz * 0.16, sz * 0.045, '#ff8fc0'); twGem(xb, x0 + w * 0.84, yT - sz * 0.15, sz * 0.045, '#8fdcff');
    // 아기 용 조각(민트빛 옥)
    var dc = '#5fd6b0', dx = ax, dy = ay - sz * 0.02;
    u6Line(xb, [[dx + sz * 0.14, dy - sz * 0.02], [dx + sz * 0.42, dy - sz * 0.02], [dx + sz * 0.34, dy + sz * 0.2]], sz * 0.075, dc, 1);
    [-1, 1].forEach(function (sd) { u6P(xb, [[dx + sd * sz * 0.06, dy - sz * 0.14], [dx + sd * sz * 0.36, dy - sz * 0.44], [dx + sd * sz * 0.3, dy - sz * 0.2], [dx + sd * sz * 0.2, dy - sz * 0.08]], TC.pink, { hi: 0.45 }); });
    u6E(xb, dx + sz * 0.03, dy - sz * 0.05, sz * 0.21, sz * 0.15, dc, { hi: 0.45, lo: 0.26, iw: 1 }); u6E(xb, dx + sz * 0.01, dy - sz * 0.0, sz * 0.12, sz * 0.085, '#fff6d8', { hi: 0.2, lo: 0.1, ink: 0 });
    [-1, 1].forEach(function (sd) { u6Horn(xb, dx - sz * 0.1 + sd * sz * 0.07, dy - sz * 0.36, sd, sz * 0.15, sz * 0.025, TC.lemon); });
    u6E(xb, dx - sz * 0.1, dy - sz * 0.26, sz * 0.14, sz * 0.125, dc, { hi: 0.45, lo: 0.24, iw: 1, sh: 1 }); u6E(xb, dx - sz * 0.2, dy - sz * 0.22, sz * 0.085, sz * 0.065, dc, { hi: 0.4, lo: 0.2, iw: 0.9 });
    [[-0.15, -0.29], [-0.05, -0.28]].forEach(function (e) { xb.fillStyle = '#ffffff'; xb.beginPath(); xb.ellipse(dx + e[0] * sz, dy + e[1] * sz, sz * 0.034, sz * 0.038, 0, 0, Math.PI * 2); xb.fill(); xb.fillStyle = '#3a2048'; xb.beginPath(); xb.ellipse(dx + e[0] * sz - sz * 0.008, dy + e[1] * sz + sz * 0.004, sz * 0.02, sz * 0.024, 0, 0, Math.PI * 2); xb.fill(); });
    // 금고 문
    u6E(xb, gx, H2.y0 - sz * 0.2, sz * 0.16, sz * 0.16, '#e2dcf6', { hi: 0.55, ic: '#b8aee0', iw: 1 }); u6E(xb, gx, H2.y0 - sz * 0.2, sz * 0.065, sz * 0.065, TC.pink, { hi: 0.4, iw: 0.7 }); twShine(xb, gx - sz * 0.07, H2.y0 - sz * 0.28, sz * 0.035, sz * 0.02, 0.8);
    u6Coins(xf, [[gx - sz * 0.5, gy + sz * 0.02], [gx - sz * 0.4, gy + sz * 0.05], [gx - sz * 0.5, gy - sz * 0.02], [gx - sz * 0.44, gy + sz * 0.0], [gx + sz * 0.46, gy + sz * 0.04], [gx + sz * 0.56, gy + sz * 0.01], [gx + sz * 0.5, gy - sz * 0.01], [gx + sz * 0.5, gy - sz * 0.05]], sz, 0.075);
    twGem(xf, gx - sz * 0.33, gy + sz * 0.0, sz * 0.04, '#8fdcff');
    return { mounts: [[0, -0.6]], an: { eye: [-0.07, -(gy - dy) / sz - 0.3], pile: [0.03, -(gy - yT) / sz - 0.2, 0.36], coin: [0.03, -(gy - ay) / sz - 0.62] } };
  }
};
// ---------- 단계가 한눈에 보이게: 크기, 받침, 계급장, 기둥 (v4.1) ----------
var KS = [1, 0.84, 0.93, 1.02, 1.08, 1.14, 1.2]; // 칸이 작아진 v2.0: 갈래 단계가 이웃 칸을 덜 덮게 조금 줄이고, 6단계는 옆이 아니라 위로 커짐
// 갈래 색: 0 하늘/민트, 1 분홍/복숭아
var BRC = [{ stone: '#8ccfff', trim: '#ffffff', glow: '#8fdcff', flag: '#3f9ff5', shield: '#3f9ff5' }, { stone: '#ffa6cc', trim: '#ffe27a', glow: '#ff9fd0', flag: '#ff4f95', shield: '#ff5d9e' }];
function stagePh(L) { return [0, 0, 0.05, 0.08, 0.1, 0.12, 0.17][L] || 0; }
function twStageBack(xb, gx, gy, sz, L, B, rnd) {
  if (TW_SK) return twSkStageBack(xb, gx, gy, sz, L, B, rnd);
  var rx = sz * 0.52, ry = rx * 0.56, ph = stagePh(L) * sz;
  if (L === 1) { // 쿠키빛 흙바닥
    var d = shp().ell(gx, gy, rx * 0.9, ry * 0.86), g = xb.createRadialGradient(gx - rx * 0.15, gy - ry * 0.2, 0, gx, gy, rx * 0.9);
    g.addColorStop(0, '#f8e2bd'); g.addColorStop(0.75, '#efcf9f'); g.addColorStop(1, 'rgba(232,190,140,0)');
    xb.fillStyle = g; xb.fill(d.p);
    xb.save(); xb.clip(d.p); for (var i = 0; i < 9; i++) { var px = gx + (rnd() - 0.5) * rx * 1.4, py = gy + (rnd() - 0.5) * ry * 1.2; xb.fillStyle = rnd() < 0.5 ? 'rgba(255,250,236,0.8)' : 'rgba(200,150,110,0.45)'; xb.beginPath(); xb.ellipse(px, py, sz * 0.02, sz * 0.014, 0, 0, Math.PI * 2); xb.fill(); } xb.restore();
    return;
  }
  var col = L >= 4 ? BRC[B].stone : L === 3 ? '#f6e2c6' : '#e4d6c8';
  if (L >= 6) { twStage6Base(xb, gx, gy, sz, B, rnd); twCyl(xb, gx, gy - ph, rx, ry, ph * 0.56, col, rnd, { top: twLt(col, 0.3) }); }
  else twCyl(xb, gx, gy - ph, rx, ry, ph, col, rnd, { top: twLt(col, 0.3) });
  // 윗면: 옅은 동심원 포석
  var tp = shp().ell(gx, gy - ph, rx * 0.96, ry * 0.96); xb.save(); xb.clip(tp.p); xb.strokeStyle = rgba(twSh(col, 0.4), 0.18); xb.lineWidth = Math.max(0.6, sz * 0.008);
  for (var r = 1; r < 3; r++) { xb.beginPath(); xb.ellipse(gx, gy - ph, rx * r / 3, ry * r / 3, 0, 0, Math.PI * 2); xb.stroke(); }
  xb.restore();
  if (L >= 3) { var tc = L >= 6 ? TC.gold : L >= 4 ? BRC[B].trim : TC.gold; xb.save(); xb.strokeStyle = twInkC(tc); xb.lineWidth = Math.max(1, sz * 0.028) + TW_IW; xb.beginPath(); xb.ellipse(gx, gy - ph, rx * 0.93, ry * 0.93, 0, 0, Math.PI * 2); xb.stroke(); xb.strokeStyle = tc; xb.lineWidth = Math.max(1, sz * 0.028); xb.stroke(); xb.restore();
    if (L >= 4 && L < 6) { xb.save(); xb.strokeStyle = rgba(BRC[B].flag, 0.5); xb.lineWidth = Math.max(0.8, sz * 0.012); xb.setLineDash([sz * 0.03, sz * 0.03]); xb.beginPath(); xb.ellipse(gx, gy - ph, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2); xb.stroke(); xb.restore(); } }
  if (L >= 4) [-1, 1].forEach(function (sd) { twPillar(xb, gx + sd * rx * 0.78, gy - ph - ry * 0.5, sz, L, B, rnd, 1); });
}
// 6단계 받침 아래층: 넓은 금빛 단 + 갈래 색 보석 네 개 (궁극 단계만)
function twStage6Base(xb, gx, gy, sz, B, rnd) {
  var rx = sz * 0.575, ry = rx * 0.56, ph = stagePh(6) * sz, C = BRC[B];
  twCyl(xb, gx, gy - ph * 0.44, rx, ry, ph * 0.44, TC.gold, rnd, { top: twLt(TC.gold, 0.4), hi: 0.6 });
  for (var i = 0; i < 5; i++) { var a = 0.28 + i / 4 * (Math.PI - 0.56), px = gx + Math.cos(a) * rx * 0.99, py = gy - ph * 0.2 + Math.sin(a) * ry * 0.99; var j = shp().ell(px, py, sz * 0.032, sz * 0.032); twFill(xb, j, i % 2 ? '#ffffff' : C.flag, { hi: 0.5 }); twInk(xb, j, C.flag, TW_IW * 0.6); }
}
// 갈래 단계 모서리 기둥: 4단계는 깃발, 5단계는 빛나는 머리, 6단계는 금띠 두른 높은 기둥에 금별
function twPillar(x, px, py, sz, L, B, rnd, plain) {
  var C = BRC[B], h = sz * (L >= 6 ? (plain ? 0.36 : 0.5) : L === 5 ? 0.42 : 0.3), w = sz * (L >= 6 ? 0.08 : 0.07);
  twCyl(x, px, py - h, w, w * 0.5, h, mixc(C.stone, C.flag, 0.25), rnd, L >= 6 ? { top: TC.gold, bands: plain ? [0.0, 0.8] : [0.0, 0.5, 0.86], bandCol: TC.gold } : { top: C.trim });
  if (L >= 6 && plain) { u6E(x, px, py - h - sz * 0.03, sz * 0.05, sz * 0.05, TC.gold, { hi: 0.6, iw: 0.7, sh: 1 }); }
  else if (L >= 6) { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, px, py - h - sz * 0.09, sz * 0.2, C.glow, 0.55); x.restore(); twStar(x, px, py - h - sz * 0.09, sz * 0.085, TC.gold); twShine(x, px - sz * 0.02, py - h - sz * 0.11, sz * 0.014, sz * 0.009, 0.9); }
  else if (L === 4) twFlag(x, px, py - h, sz * 0.22, sz, C.flag, 1);
  else if (B === 0) twGem(x, px, py - h - sz * 0.07, sz * 0.05, C.glow);
  else twBrazier(x, px, py - h - sz * 0.02, sz * 0.07, C.glow);
}
function twStageFront(xf, gx, gy, sz, L, B, rnd) {
  var rx = sz * 0.52, ry = rx * 0.56, ph = stagePh(L) * sz;
  if (L >= 5) [-1, 1].forEach(function (sd) { twPillar(xf, gx + sd * rx * (L >= 6 ? 0.98 : 0.9), gy - ph + ry * 0.55, sz, L, B, rnd); });
  var sk = TW_SK; TW_SK = null; // 계급장은 스킨과 상관없이 늘 같은 색
  // 계급장: 1~3단계는 갈매기표, 갈래는 색 방패와 별, 6단계는 금테 큰 방패에 왕관
  var w = sz * (L >= 6 ? 0.25 : 0.2), h = sz * (L >= 6 ? 0.27 : 0.22), cx = gx, cy = gy - ph * 0.4 + ry * (L >= 6 ? 0.7 : 0.62);
  if (L >= 6) { var gb = shp().ell(cx, cy - h * 0.02, w * 0.74, h * 0.66); twFill(xf, gb, TC.gold, { hi: 0.6, lo: 0.2 }); twInk(xf, gb, TC.gold, Math.max(1, sz * 0.02)); }
  var base = L >= 4 ? BRC[B].shield : L === 3 ? '#ffc93c' : L === 2 ? '#b8b0e8' : '#eea55e';
  var sh = shp(); sh.p.moveTo(cx - w / 2 + w * 0.12, cy - h / 2); sh.p.lineTo(cx + w / 2 - w * 0.12, cy - h / 2); sh.p.quadraticCurveTo(cx + w / 2, cy - h / 2, cx + w / 2, cy - h * 0.36); sh.p.lineTo(cx + w / 2, cy + h * 0.06); sh.p.quadraticCurveTo(cx + w * 0.46, cy + h * 0.36, cx, cy + h / 2); sh.p.quadraticCurveTo(cx - w * 0.46, cy + h * 0.36, cx - w / 2, cy + h * 0.06); sh.p.lineTo(cx - w / 2, cy - h * 0.36); sh.p.quadraticCurveTo(cx - w / 2, cy - h / 2, cx - w / 2 + w * 0.12, cy - h / 2); sh.p.closePath(); sh.ext(cx - w / 2, cy - h / 2); sh.ext(cx + w / 2, cy + h / 2);
  xf.save(); xf.shadowColor = 'rgba(74,38,96,0.45)'; xf.shadowBlur = sz * 0.03; xf.shadowOffsetY = sz * 0.012; xf.fillStyle = base; xf.fill(sh.p); xf.restore();
  twFill(xf, sh, base, { hi: 0.45, lo: 0.2 }); twInk(xf, sh, base, Math.max(1, sz * 0.018));
  twShine(xf, cx - w * 0.22, cy - h * 0.3, w * 0.12, h * 0.06, 0.7);
  xf.lineCap = 'round'; xf.lineJoin = 'round';
  if (L <= 3) {
    xf.strokeStyle = '#ffffff'; xf.lineWidth = Math.max(1.1, sz * 0.032);
    for (var i = 0; i < L; i++) { var yy = cy - h * 0.2 + i * h * 0.2 - (L - 1) * h * 0.06; xf.beginPath(); xf.moveTo(cx - w * 0.28, yy); xf.lineTo(cx, yy + h * 0.13); xf.lineTo(cx + w * 0.28, yy); xf.stroke(); }
  } else if (L >= 6) { // 왕관
    var cw = w * 0.62, chh = h * 0.42, cr = shp().poly([[cx - cw / 2, cy + chh * 0.5], [cx - cw * 0.58, cy - chh * 0.42], [cx - cw * 0.24, cy - chh * 0.02], [cx, cy - chh * 0.7], [cx + cw * 0.24, cy - chh * 0.02], [cx + cw * 0.58, cy - chh * 0.42], [cx + cw / 2, cy + chh * 0.5]]);
    xf.save(); xf.lineJoin = 'round'; xf.strokeStyle = '#fff3b0'; xf.lineWidth = Math.max(0.8, sz * 0.014); xf.stroke(cr.p); xf.restore(); twFill(xf, cr, '#fff6c8', { hi: 0.6, lo: 0.05 });
  } else {
    var n = L - 3; for (var j = 0; j < n; j++) { var sx = cx + (j - (n - 1) / 2) * w * 0.38, sy = cy - h * 0.04, r0 = w * (n === 1 ? 0.3 : 0.22);
      var st = shp(); twStarP(st.p, sx, sy, r0, r0 * 0.48); st.ext(sx - r0, sy - r0); st.ext(sx + r0, sy + r0);
      xf.save(); xf.strokeStyle = '#fff3b0'; xf.lineWidth = r0 * 0.3; xf.stroke(st.p); xf.restore(); twFill(xf, st, '#fff3b0', { hi: 0.5, lo: 0.1 }); }
  }
  TW_SK = sk;
}
function towerSpr(type, L, B, S) {
  var sid = twSkinId(), key = type + L + ':' + B + ':' + Math.round(S) + (sid === 'base' ? '' : ':' + sid); // 기본 스킨 키는 예전 그대로
  if (TOWER_SPR[key]) return TOWER_SPR[key];
  if (!TB[type] && !TW_EXT[type] && typeof tw2ArtStand === 'function') return (TOWER_SPR[key] = towerSpr(tw2ArtStand(type), Math.min(L, 5), B, S));   // [ENG2 고리] 그림이 아직 없는 새 탑은 비슷한 기존 탑 그림으로 대신(TW_EXT가 등록되면 안 쓰임)
  if (TW_EXT[type]) { var ex = TW_EXT[type].spr(L, B, S); TOWER_SPR[key] = ex; return ex; }
  L = clamp(L | 0, 1, 6); B = B ? 1 : 0;
  var U = L >= 6 && TB6[type], LL = L >= 6 && !U ? 5 : L; // 6단계 그림이 없는 탑은 5단계 그림으로 대신
  var lo = LL <= 3, k = KS[L], W = S * (U ? 2.76 : 2.16), H = S * (U ? 3.5 : lo ? 2.4 : 3.72), gx = W / 2, gy = H * (U ? 0.835 : lo ? 0.8125 : 0.88), sz = S * 0.98 * k, ph = stagePh(LL) * sz; // 낮은 단계는 작업 캔버스를 작게(만드는 시간 절약)
  var c0 = twScratch(0, W, H), cb = twScratch(1, W, H), cf = twScratch(2, W, H), x0 = cx2(c0), xb = cx2(cb), xf = cx2(cf), rnd = rngOf(hashStr(type) + L * 31 + B * 7);
  TW_IW = Math.max(1.1, sz * 0.022);
  TW_SK = sid === 'base' ? null : TW_SKINS[sid]; TW_SZ = sz;
  try {
    twShadow(x0, gx + sz * 0.12, gy + sz * 0.04, sz * (U ? 0.7 : 0.62), sz * (U ? 0.33 : 0.29), 0.42);
    if (U) { x0.save(); x0.globalCompositeOperation = 'lighter'; x0.translate(gx, gy - ph * 0.3); x0.scale(1, 0.56); glowAt(x0, 0, 0, sz * 0.95, BRC[B].glow, 0.5); x0.restore(); } // 궁극 단계 바닥 기운
    twStageBack(LL === 1 ? x0 : xb, gx, gy, sz, LL, B, rnd);
    var info = (U ? TB6[type](xb, xf, gx, gy - ph, sz, B, rnd) : TB[type](xb, xf, gx, gy - ph, sz, LL, B, rnd)) || {};
    twStageFront(xf, gx, gy, sz, LL, B, rnd);
    if (TW_SK && TW_SK.after) TW_SK.after(xb, xf, type, gx, gy - ph, sz, L, B, info);
  } finally { TW_SK = null; }
  // 받침 높이만큼 움직이는 부분도 올림 (단위: sz)
  if (ph) { var dy = ph / sz; info.mounts = (info.mounts || [[0, -1]]).map(function (m) { return [m[0], m[1] - dy]; }); if (info.chimney) info.chimney = [info.chimney[0], info.chimney[1] - dy]; if (info.an) for (var a in info.an) if (info.an[a]) info.an[a] = [info.an[a][0], info.an[a][1] - dy].concat(info.an[a].slice(2)); }
  info.k = k; info.ult = U ? 1 : 0;
  // 작은 칸에서도 또렷하게: 몸체 실루엣 둘레에 진한 자두빛 테두리를 깔아 바닥과 떼어 놓음 (그림자, 빛 번짐은 빼고)
  twOutlineUnder(x0, cb, cf, twScratch(3, W, H), Math.max(1.1, S * 0.022));
  x0.drawImage(cb, 0, 0);
  info.back = twTrimCopy(c0, gx, gy); info.front = twTrimCopy(cf, gx, gy);
  return (TOWER_SPR[key] = info);
}
// 그림 만들 때 쓰는 큰 작업 캔버스는 돌려 씀(탑 한 모습마다 새로 만들면 느린 폰에서 버벅임). 결과는 잘라 낸 작은 캔버스에만 남김
var TW_SCR = {}, TW_SCRN = 0; // 화면 크기가 여러 번 바뀌어 종류가 많아지면 비우고 다시 시작
function twScratch(i, W, H) {
  var w = Math.max(1, Math.ceil(W)), h = Math.max(1, Math.ceil(H)), k = i + ':' + w + 'x' + h, c = TW_SCR[k];
  if (!c) { if (++TW_SCRN > 24) { TW_SCR = {}; TW_SCRN = 1; } c = TW_SCR[k] = mkC(w, h); c.getContext('2d', { willReadFrequently: true }); return c; } // 잘라 낼 때 픽셀을 여러 번 읽으므로 읽기용 캔버스로
  var x = cx2(c); if (x.reset) x.reset(); else c.width = w; // 상태와 그림을 처음으로
  return c;
}
function twTrimCopy(c, ax, ay) { var t = trimSpr(spr(c, ax, ay)); if (t.c === c) { t = { c: mkC(1, 1), ax: 0, ay: 0, empty: 1 }; } return t; }
// 몸체 실루엣(뒤 + 앞 그림)을 자두빛으로 칠해 여덟 방향으로 밀어 깔기. 알파를 네 제곱해 빛 번짐처럼 옅은 곳은 테두리에서 뺌(픽셀 읽기 없이 합성만으로)
function twOutlineUnder(x0, cb, cf, m, r) {
  var mx = cx2(m); mx.drawImage(cb, 0, 0); mx.drawImage(cf, 0, 0);
  mx.globalCompositeOperation = 'destination-in'; mx.drawImage(m, 0, 0); mx.drawImage(m, 0, 0);
  mx.globalCompositeOperation = 'source-in'; mx.fillStyle = '#56306a'; mx.fillRect(0, 0, m.width, m.height);
  x0.save(); x0.globalAlpha = 0.62;
  for (var q = 0; q < 8; q++) { var an = q * Math.PI / 4; x0.drawImage(m, Math.cos(an) * r, Math.sin(an) * r); }
  x0.restore();
}
// ---------- 회전하는 머리(위에서 본 모양) ----------
var HEAD_SPR = {};
function twStrokeInk(x, col, w) { if (TW_SK) col = twK(col); x.strokeStyle = twInkC(col); x.lineWidth = w + TW_IW * 1.3; x.stroke(); x.strokeStyle = col; x.lineWidth = w; x.stroke(); }
function headSpr(type, L, B, S, fr) {
  var sid = twSkinId(), key = 'h' + type + L + ':' + B + ':' + Math.round(S) + (fr == null ? '' : ':' + fr) + (sid === 'base' ? '' : ':' + sid); if (HEAD_SPR[key]) return HEAD_SPR[key];
  var sk0 = TW_SK; TW_SK = sid === 'base' ? null : TW_SKINS[sid];
  try { return (HEAD_SPR[key] = twHeadDraw(type, L, B, S, fr)); } finally { TW_SK = sk0; }
}
// fr: 노포와 큰 활 0 장전 / 1 방금 쏨 / 2 되감는 중, 대포 'c' 포가 / 'b' 포신 하나 / 'h' 축, 용머리 0 입 다묾 / 1 입 벌림
function twHeadDraw(type, L, B, S, fr) {
  var U = L >= 6, W = S * (U ? 2.9 : 1.6), c = mkC(W, W), x = cx2(c), m = W / 2;
  TW_IW = Math.max(1.1, S * 0.02); x.lineCap = 'round'; x.lineJoin = 'round';
  if (type === 'ballista') twHdBallista(x, m, S, L, B, fr || 0);
  else if (type === 'cannon') twHdCannon(x, m, S, L, B, fr);
  else if (type === 'flame') twHdDragon(x, m, S, L, B, fr || 0);
  else if (type === 'archer') twHdBow(x, m, S, fr || 0);
  if (TW_SK && TW_SK.head) TW_SK.head(x, type, L, B, S, m);
  return trimSpr(spr(c, m, m));
}
function twHdBallista(x, m, S, L, B, fr) {
  var U = L >= 6, twin = L >= 4 && B === 1, heavy = L >= 4 && B === 0, sc = (heavy ? 1.18 : 1) * (0.9 + Math.min(L, 5) * 0.04) * (U ? (heavy ? 1.45 : 1.1) : 1);
  var col = L === 1 ? TC.wood : L === 2 ? TC.lav : L === 3 ? TC.gold : heavy ? (U ? TC.gold : TC.sky) : TC.pink;
  if (U && twin) sc = 1.32;
  var offs = twin && !U ? [-0.15, 0.15] : [0], sp = 0.36 * sc, bolts = U && twin ? [-0.15, 0, 0.15] : [0];
  var sx = (fr === 1 ? 0.19 : fr === 2 ? 0.02 : -0.1) * sc, bx = (fr === 1 ? 0.16 : 0.12) * sc, cv = (fr === 1 ? 0.24 : 0.3) * sc;
  offs.forEach(function (off) {
    var oy = m + off * S;
    var sth = U && twin ? 0.2 : 0.055, stock = shp().rrect(m - S * 0.28 * sc, oy - S * sth, S * 0.6 * sc, S * sth * 2, S * 0.05); twFill(x, stock, TC.woodD, { hi: 0.35 }); twInk(x, stock, TC.woodD);
    if (U && heavy) { x.beginPath(); x.moveTo(m + S * (bx - 0.1 * sc), oy - S * sp * 0.74); x.quadraticCurveTo(m + S * (cv - 0.1 * sc), oy, m + S * (bx - 0.1 * sc), oy + S * sp * 0.74); twStrokeInk(x, TC.sky, S * 0.06 * sc); }
    // 활(둥근 사탕 막대)
    x.beginPath(); x.moveTo(m + S * bx, oy - S * sp); x.quadraticCurveTo(m + S * cv, oy, m + S * bx, oy + S * sp); twStrokeInk(x, col, S * 0.075 * sc);
    x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = S * 0.02 * sc; x.beginPath(); x.moveTo(m + S * (bx + 0.01), oy - S * sp * 0.83); x.quadraticCurveTo(m + S * (cv - 0.05 * sc), oy - S * sp * 0.28, m + S * (cv - 0.065 * sc), oy - S * 0.02 * sc); x.stroke();
    [-1, 1].forEach(function (sd) { var tb = shp().ell(m + S * bx, oy + sd * S * sp * 1.03, S * 0.042 * sc, S * 0.042 * sc); twFill(x, tb, TC.gold, { hi: 0.5 }); twInk(x, tb, TC.gold, TW_IW * 0.7); });
    x.strokeStyle = 'rgba(255,248,236,0.97)'; x.lineWidth = Math.max(1.1, S * 0.016); x.beginPath(); x.moveTo(m + S * bx, oy - S * sp); x.lineTo(m + S * sx, oy); x.lineTo(m + S * bx, oy + S * sp); x.stroke();
    if (fr !== 1) bolts.forEach(function (bo) { // 큰 화살: 크림 대 + 분홍 깃 + 둥근 촉 (용잡이는 금 작살촉, 폭풍 연노는 세 발 나란히)
      var oy0 = oy; oy = oy0 + bo * S;
      var tip = m + S * (sx + 0.52 * sc);
      x.beginPath(); x.moveTo(m + S * sx, oy); x.lineTo(tip, oy); twStrokeInk(x, '#ffe8c0', S * 0.038);
      var hw = S * (U && heavy ? 0.1 : 0.058), hl = S * (U && heavy ? 0.2 : 0.12) * Math.min(sc, 1.3), hc = heavy && L >= 5 ? TC.gold : '#e6e2ff';
      var hd = shp().poly([[tip + hl * 0.85, oy], [tip - hl * 0.15, oy - hw], [tip + hl * 0.1, oy], [tip - hl * 0.15, oy + hw]]); twFill(x, hd, hc, { hi: 0.5 }); twInk(x, hd, hc, TW_IW * 0.85);
      var fx0 = m + S * sx, fl = shp().poly([[fx0 - S * 0.02, oy - S * 0.055], [fx0 + S * 0.07, oy], [fx0 - S * 0.02, oy + S * 0.055], [fx0 + S * 0.02, oy]]); twFill(x, fl, TC.hot, { hi: 0.3 }); twInk(x, fl, TC.hot, TW_IW * 0.6);
      oy = oy0;
    });
    if (L >= 2 && !(U && twin)) { var pl = shp().rrect(m - S * 0.08, oy - S * 0.09, S * 0.14, S * 0.18, S * 0.05); twFill(x, pl, TC.steel, { hi: 0.55 }); twInk(x, pl, TC.steel, TW_IW * 0.8); twShine(x, m - S * 0.045, oy - S * 0.05, S * 0.025, S * 0.014, 0.8); }
  });
  if (U && twin) { u6R(x, m - S * 0.4, m - S * 0.24, S * 0.3, S * 0.48, S * 0.07, TC.pink, { hi: 0.45, iw: 1 }); u6R(x, m - S * 0.33, m - S * 0.17, S * 0.16, S * 0.34, S * 0.05, '#fff0f6', { hi: 0.3, ic: TC.pink, iw: 0.7 }); [-1, 0, 1].forEach(function (q) { u6E(x, m - S * 0.25, m + q * S * 0.1, S * 0.036, S * 0.036, TC.hot, { hi: 0.4, iw: 0.6 }); }); }
  if (U && heavy) { u6E(x, m - S * 0.36 * sc, m, S * 0.1, S * 0.1, TC.gold, { hi: 0.55, sh: 1 }); u6E(x, m - S * 0.36 * sc, m, S * 0.04, S * 0.04, TC.sky, { hi: 0.4, iw: 0.6 }); }
}
function twCanSpec(L, B, S, mini) {
  var U = L >= 6, big = L >= 4 && B === 0, multi = L >= 4 && B === 1 ? (L >= 5 ? 4 : 2) : 1;
  if (mini) return { U: 0, big: 0, multi: 1, bc: '#ff5d9e', bw: S * 0.17, bl: S * 0.5, cs: 1, offs: [0] }; // 포화 요새 옆 포탑(한 문)
  if (U && !big) return { U: 1, big: 0, multi: 3, bc: '#ff5d9e', bw: S * 0.115, bl: S * 0.56, cs: 1.2, offs: [-0.14, 0, 0.14] }; // 포화 요새 본포(굵은 세 문)
  return { U: U, big: big, multi: multi, bc: L === 1 ? TC.bronze : L === 2 ? '#a99ae0' : L === 3 ? '#8f7ad8' : big ? (U ? '#3f86e8' : L === 5 ? '#4f9cf0' : '#62acf5') : (U ? '#ff5d9e' : '#ff7fb4'),
    bw: S * (big ? (U ? 0.31 : 0.2) : multi > 1 ? 0.075 : 0.12) * (0.92 + Math.min(L, 5) * 0.03), bl: S * (big ? (U ? 1.04 : 0.5) : 0.48), cs: U && big ? 1.5 : 1,
    offs: multi === 1 ? [0] : multi === 2 ? [-0.09, 0.09] : [-0.13, -0.045, 0.045, 0.13] };
}
function twHdCannon(x, m, S, L, B, fr) {
  var mini = typeof fr === 'string' && fr.charAt(0) === 'm'; if (mini) fr = fr.slice(1);
  var P = twCanSpec(L, B, S, mini), bc = TW_SK ? twK(P.bc) : P.bc, bw = P.bw, bl = P.bl, cs = P.cs;
  if (fr == null || fr === 'c') {
    var car = shp().rrect(m - S * 0.23 * cs, m - S * 0.2 * cs, S * 0.38 * cs, S * 0.4 * cs, S * 0.08); twFill(x, car, TC.woodD, { hi: 0.3 }); twInk(x, car, TC.woodD);
    if (P.U && P.big) [-1, 1].forEach(function (sd) { u6R(x, m - S * 0.2, m + sd * S * 0.25 - S * 0.05, S * 0.5, S * 0.1, S * 0.05, TC.gold, { hi: 0.55, iw: 0.7 }); });
  }
  var barrel = function (oy) {
    var br = shp(); br.p.moveTo(m - S * 0.12, oy - bw * 0.6); br.p.lineTo(m + bl - bw * 0.2, oy - bw * 0.48); br.p.quadraticCurveTo(m + bl, oy - bw * 0.48, m + bl, oy - bw * 0.3); br.p.lineTo(m + bl, oy + bw * 0.3); br.p.quadraticCurveTo(m + bl, oy + bw * 0.48, m + bl - bw * 0.2, oy + bw * 0.48); br.p.lineTo(m - S * 0.12, oy + bw * 0.6); br.p.quadraticCurveTo(m - S * 0.12 - bw * 0.5, oy, m - S * 0.12, oy - bw * 0.6); br.p.closePath(); br.ext(m - S * 0.12 - bw * 0.5, oy - bw * 0.6); br.ext(m + bl, oy + bw * 0.6);
    var g = x.createLinearGradient(0, oy - bw * 0.6, 0, oy + bw * 0.6); g.addColorStop(0, twLt(bc, 0.5)); g.addColorStop(0.35, bc); g.addColorStop(1, twSh(bc, 0.4)); x.fillStyle = g; x.fill(br.p);
    twInk(x, br, bc);
    // 포구 테와 금띠
    var lw = P.U && P.big ? S * 0.12 : S * 0.07, lk = P.U && P.big ? 0.78 : 0.64;
    var lip = shp().rrect(m + bl - lw, oy - bw * lk, lw, bw * lk * 2, S * 0.03); twFill(x, lip, P.big && L >= 5 ? TC.gold : twLt(bc, 0.25), { hi: 0.5 }); twInk(x, lip, bc, TW_IW * 0.8);
    (P.U && P.big ? [0.06, 0.34, 0.62] : [0.06]).forEach(function (u) { var rg = shp().rrect(m + S * u, oy - bw * 0.58, S * 0.045, bw * 1.16, S * 0.02); twFill(x, rg, TC.gold, { hi: 0.5 }); twInk(x, rg, TC.gold, TW_IW * 0.6); });
    x.fillStyle = '#3a2048'; x.beginPath(); x.ellipse(m + bl + S * 0.002, oy, S * 0.016, bw * 0.32, 0, 0, Math.PI * 2); x.fill();
    x.save(); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = Math.max(0.9, bw * 0.14); x.beginPath(); x.moveTo(m - S * 0.06, oy - bw * 0.3); x.lineTo(m + bl - S * 0.14, oy - bw * 0.26); x.stroke(); x.restore();
  };
  if (fr == null) P.offs.forEach(function (o) { barrel(m + o * S); }); else if (fr === 'b') barrel(m);
  if (fr == null || fr === 'h') { var hr = S * 0.09 * (P.U && P.big ? 1.5 : 1), hub = shp().ell(m - S * 0.12, m, hr, hr); twFill(x, hub, TC.gold, { hi: 0.5 }); twInk(x, hub, TC.gold); twShine(x, m - S * 0.12 - hr * 0.35, m - hr * 0.35, hr * 0.28, hr * 0.18, 0.8); }
}
// 용머리(위에서 본 모양): 둥근 머리 + 짧은 주둥이, 큰 눈, 노란 뿔, 분홍 지느러미 귀. 6단계 태양룡은 금빛에 불꽃 갈기
function twHdDragon(x, m, S, L, B, fr) {
  var U = L >= 6, dc = U ? '#ffb23e' : L === 5 ? '#5fd6b0' : TC.mint, hx0 = m - S * 0.05;
  if (U) { x.translate(m, m); x.scale(1.45, 1.45); x.translate(-m, -m); TW_IW /= 1.45;
    for (var i = 0; i < 7; i++) { var a = Math.PI * 0.5 + (i + 0.5) / 7 * Math.PI, px = hx0 + Math.cos(a) * S * 0.12, py = m + Math.sin(a) * S * 0.12; u6P(x, [[px + Math.cos(a + 1.3) * S * 0.05, py + Math.sin(a + 1.3) * S * 0.05], [hx0 + Math.cos(a) * S * (i % 2 ? 0.27 : 0.33), m + Math.sin(a) * S * (i % 2 ? 0.27 : 0.33)], [px + Math.cos(a - 1.3) * S * 0.05, py + Math.sin(a - 1.3) * S * 0.05]], i % 2 ? '#ff7a4a' : '#ff5d6e', { hi: 0.45, iw: 0.8 }); } }
  [-1, 1].forEach(function (sd) {
    var hn = shp(); hn.p.moveTo(hx0 - S * 0.08, m + sd * S * 0.09); hn.p.quadraticCurveTo(hx0 - S * 0.22, m + sd * S * 0.16, hx0 - S * 0.3, m + sd * S * 0.13); hn.p.quadraticCurveTo(hx0 - S * 0.2, m + sd * S * 0.07, hx0 - S * 0.12, m + sd * S * 0.03); hn.p.closePath(); hn.ext(hx0 - S * 0.3, m - S * 0.16); hn.ext(hx0, m + S * 0.16); twFill(x, hn, U ? '#fff6d8' : TC.lemon, { hi: 0.45 }); twInk(x, hn, TC.lemon, TW_IW * 0.8);
    var fin = shp().ell(hx0 + S * 0.0, m + sd * S * 0.15, S * 0.06, S * 0.035); twFill(x, fin, TC.pink, { hi: 0.4 }); twInk(x, fin, TC.pink, TW_IW * 0.7);
  });
  if (fr === 1) { // 입 벌림: 불빛 도는 입속 + 양옆으로 벌어진 턱
    var mo = shp().ell(hx0 + S * 0.24, m, S * 0.14, S * 0.11); x.fillStyle = '#ff7a3a'; x.fill(mo.p); twInk(x, mo, '#ff7a3a', TW_IW * 0.8); x.fillStyle = '#ffe27a'; x.beginPath(); x.ellipse(hx0 + S * 0.27, m, S * 0.085, S * 0.06, 0, 0, Math.PI * 2); x.fill();
    [-1, 1].forEach(function (sd) { x.save(); x.translate(hx0 + S * 0.05, m + sd * S * 0.055); x.rotate(sd * 0.3); var jw = shp().rrect(0, -S * 0.05, S * 0.31, S * 0.1, S * 0.05); twFill(x, jw, dc, { hi: 0.4, lo: 0.25 }); twInk(x, jw, dc); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(S * 0.27, -sd * S * 0.03, S * 0.018, 0, Math.PI * 2); x.fill(); x.restore(); });
  } else { var sn = shp().rrect(hx0 + S * 0.04, m - S * 0.1, S * 0.32, S * 0.2, S * 0.1); twFill(x, sn, dc, { hi: 0.4, lo: 0.25 }); twInk(x, sn, dc); }
  var hd = shp().ell(hx0, m, S * 0.16, S * 0.15); twFill(x, hd, dc, { hi: 0.45, lo: 0.25 }); twInk(x, hd, dc);
  // 주둥이 이음 다시 덮기
  if (fr !== 1) { x.fillStyle = TW_SK ? twK(dc) : dc; x.beginPath(); x.ellipse(hx0 + S * 0.11, m, S * 0.07, S * 0.085, 0, 0, Math.PI * 2); x.fill(); }
  [-1, 1].forEach(function (sd) {
    if (fr !== 1) { x.fillStyle = twSh(dc, 0.5); x.beginPath(); x.ellipse(hx0 + S * 0.32, m + sd * S * 0.04, S * 0.014, S * 0.011, 0, 0, Math.PI * 2); x.fill(); }
    var ey = m + sd * S * 0.075, ew = shp().ell(hx0 + S * 0.05, ey, S * 0.06, S * 0.055); twFill(x, ew, '#ffffff', { lo: 0.08 }); twInk(x, ew, dc, TW_IW * 0.9);
    x.fillStyle = '#3a2048'; x.beginPath(); x.ellipse(hx0 + S * 0.075, ey, S * 0.034, S * 0.036, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(hx0 + S * 0.064, ey - S * 0.014, S * 0.013, 0, Math.PI * 2); x.fill();
    if (fr !== 1) { x.fillStyle = 'rgba(255,130,170,0.6)'; x.beginPath(); x.ellipse(hx0 + S * 0.15, m + sd * S * 0.1, S * 0.03, S * 0.018, 0, 0, Math.PI * 2); x.fill(); }
  });
  twShine(x, hx0 - S * 0.07, m - S * 0.07, S * 0.04, S * 0.022, 0.6, -0.3);
  if (L >= 5) twStar(x, hx0 - S * 0.07, m, S * 0.045, U ? '#fff6d8' : TC.gold);
}
// 천리안 신궁의 큰 금빛 활(위에서 본 모양): 흰 몸통, 금 활, 망원 조준경
function twHdBow(x, m, S, fr) {
  var sx = fr === 1 ? 0.24 : fr === 2 ? 0.02 : -0.16, bx = fr === 1 ? 0.2 : 0.15, cv = fr === 1 ? 0.36 : 0.45, sp = 0.54;
  u6R(x, m - S * 0.36, m - S * 0.055, S * 0.74, S * 0.11, S * 0.05, '#eaf6ff', { hi: 0.3, ic: TC.sky });
  x.beginPath(); x.moveTo(m + S * bx, m - S * sp); x.quadraticCurveTo(m + S * cv, m, m + S * bx, m + S * sp); twStrokeInk(x, TC.gold, S * 0.095);
  x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = S * 0.026; x.beginPath(); x.moveTo(m + S * (bx + 0.012), m - S * sp * 0.84); x.quadraticCurveTo(m + S * (cv - 0.07), m - S * sp * 0.3, m + S * (cv - 0.09), m - S * 0.03); x.stroke();
  [-1, 1].forEach(function (sd) { u6E(x, m + S * (bx - 0.05), m + sd * S * (sp + 0.02), S * 0.09, S * 0.04, '#ffffff', { rot: sd * 0.5, lo: 0.12, ic: '#a9c4f2', iw: 0.7 }); u6E(x, m + S * bx, m + sd * S * sp, S * 0.05, S * 0.05, TC.sky, { hi: 0.5, iw: 0.7, sh: 1 }); });
  x.strokeStyle = 'rgba(255,252,240,0.98)'; x.lineWidth = Math.max(1.1, S * 0.018); x.beginPath(); x.moveTo(m + S * bx, m - S * sp); x.lineTo(m + S * sx, m); x.lineTo(m + S * bx, m + S * sp); x.stroke();
  if (fr !== 1) {
    var tip = m + S * (sx + 0.68); x.beginPath(); x.moveTo(m + S * sx, m); x.lineTo(tip, m); twStrokeInk(x, '#fff3c0', S * 0.04);
    u6P(x, [[tip + S * 0.15, m], [tip - S * 0.03, m - S * 0.085], [tip + S * 0.02, m], [tip - S * 0.03, m + S * 0.085]], TC.gold, { hi: 0.6 });
    var f0 = m + S * sx; u6P(x, [[f0 - S * 0.02, m - S * 0.06], [f0 + S * 0.08, m], [f0 - S * 0.02, m + S * 0.06], [f0 + S * 0.02, m]], TC.sky, { hi: 0.4, iw: 0.6 });
  }
  // 망원 조준경
  u6R(x, m - S * 0.3, m - S * 0.2, S * 0.44, S * 0.1, S * 0.05, '#ffffff', { lo: 0.2, ic: TC.sky }); u6R(x, m - S * 0.32, m - S * 0.215, S * 0.07, S * 0.13, S * 0.03, TC.gold, { hi: 0.55, iw: 0.7 }); u6R(x, m + S * 0.08, m - S * 0.225, S * 0.09, S * 0.15, S * 0.04, TC.gold, { hi: 0.55, iw: 0.7 });
  u6E(x, m + S * 0.17, m - S * 0.15, S * 0.025, S * 0.06, '#8fdcff', { hi: 0.6, iw: 0.6 });
}
// 탑 아이콘(메뉴용): 몸체를 작게 그린 이미지
function towerIcon(type, L, B, px) {
  // 넉넉한 캔버스에 그린 뒤 빈 곳을 잘라 칸 안에 맞춤 (윗부분, 계급장 잘림 방지)
  var S = px * 0.55, t = towerSpr(type, L || 1, B || 0, S), W = Math.ceil(px * 2.2), c = mkC(W, W), x = cx2(c), gx = W / 2, gy = W * 0.78;
  x.drawImage(t.back.c, gx - t.back.ax, gy - t.back.ay);
  drawTowerParts(x, { k: type, lvl: L || 1, br: B || 0, aim: -0.6, fireT: 0, side: 0, beamT: 0, born: -9 }, gx, gy, S * (t.k || 1), 1.2, t, null); // 1.2초 = 금화가 튀지 않고 종이 잠잠한 순간
  x.drawImage(t.front.c, gx - t.front.ax, gy - t.front.ay);
  var tr = trimSpr(spr(c, gx, gy)), o = mkC(px, px), ox = cx2(o), sc = Math.min(px * 0.96 / tr.c.width, px * 0.96 / tr.c.height, 1.5);
  var w = tr.c.width * sc, h = tr.c.height * sc; ox.drawImage(tr.c, (px - w) / 2, px - h - px * 0.02, w, h);
  return o;
}
// ---------- 움직이는 부분 그리기 (매 프레임) ----------
var PART_C = {};
// 꼬마 궁수 후드 색: 기본 민트초록, 매의 눈 하늘, 연사 분홍
var TW_HOOD = { base: '#6fd39a', a: '#6cb6ff', b: '#ff86ba' };
function archerCached(x, px, py, S, aim, draw, col, big) {
  var ab = Math.round(((aim % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * 16) % 16, db = draw > 0.66 ? 2 : draw > 0.25 ? 1 : 0;
  var key = 'ar' + col + (big ? 1 : 0) + ':' + ab + ':' + db + ':' + Math.round(S) + (TW_SK ? ':' + TW_SK.id : ''), s = PART_C[key];
  if (!s) { var c = mkC(S * 0.84, S * 0.64), cx = cx2(c); drawArcher(cx, S * 0.42, S * 0.53, S, ab / 16 * Math.PI * 2, [0, 0.5, 1][db], col, big); s = PART_C[key] = spr(c, S * 0.42, S * 0.53); }
  x.drawImage(s.c, px - s.ax, py - s.ay);
}
function gemCached(x, cx, cy, r, col) {
  var key = 'gm' + col + ':' + Math.round(r * 10) + (TW_SK ? ':' + TW_SK.id : ''), s = PART_C[key];
  if (!s) { var R = Math.ceil(r * 4), c = mkC(R * 2, R * 2); TW_IW = Math.max(0.9, r * 0.2); twGem(cx2(c), R, R, r, col); s = PART_C[key] = spr(c, R, R); }
  x.drawImage(s.c, cx - s.ax, cy - s.ay);
}
function twOrbCached(x, cx, cy, r, col) { var s = twOrbGet(r, col); x.drawImage(s.c, cx - s.ax, cy - s.ay); }
function partCached(key, w, h, ax, ay, fn) { if (TW_SK) key += ':' + TW_SK.id; var s = PART_C[key]; if (!s) { var c = mkC(w, h); fn(cx2(c)); s = PART_C[key] = spr(c, ax, ay); } return s; }
// 꼬마 궁수: 큰 머리, 반짝 눈, 볼터치, 귀 달린 후드, 분홍 활
function drawArcher(x, px, py, S, aim, draw, col, big) {
  var f = Math.cos(aim) >= 0 ? 1 : -1, sc = big ? 1.15 : 1, iw = Math.max(0.9, S * 0.013), ink = twInkC(col), skin = TC.skin, bunny = col === TW_HOOD.b, colR = TW_SK ? twK(col) : col;
  TW_IW = iw;
  x.save(); x.translate(px, py); x.scale(f * sc, sc); x.lineJoin = 'round'; x.lineCap = 'round';
  var a = Math.atan2(Math.sin(aim) * 0.6, Math.abs(Math.cos(aim)));
  var hy = -S * 0.205, hr = S * 0.088;
  // 귀(머리 뒤)
  if (bunny) [[-0.05, -0.2], [0.012, 0.1]].forEach(function (e) { var ex = S * e[0]; x.save(); x.translate(ex, hy - hr * 1.05); x.rotate(e[1]); var es2 = shp().ell(0, -S * 0.05, S * 0.026, S * 0.07); twFill(x, es2, col, { hi: 0.35 }); twInk(x, es2, col, iw); x.fillStyle = rgba('#ffc0d8', 0.9); x.beginPath(); x.ellipse(0, -S * 0.05, S * 0.011, S * 0.05, 0, 0, Math.PI * 2); x.fill(); x.restore(); });
  else [[-0.06, -0.35], [0.03, 0.3]].forEach(function (e) { var ex = S * e[0], ey = hy - hr * 0.62, es = shp(); x.save(); x.translate(ex, ey); x.rotate(e[1]); es.p.moveTo(-S * 0.032, S * 0.01); es.p.quadraticCurveTo(-S * 0.02, -S * 0.05, 0, -S * 0.062); es.p.quadraticCurveTo(S * 0.02, -S * 0.05, S * 0.032, S * 0.01); es.p.closePath(); es.ext(-S * 0.032, -S * 0.062); es.ext(S * 0.032, S * 0.01); var ec = TW_SK && TW_SK.ear || col; twFill(x, es, ec, { hi: 0.35 }); twInk(x, es, ec, iw); if (ec === col) { x.fillStyle = rgba('#ffc0d8', 0.85); x.beginPath(); x.moveTo(-S * 0.014, 0); x.lineTo(0, -S * 0.035); x.lineTo(S * 0.014, 0); x.closePath(); x.fill(); } x.restore(); });
  // 몸통(후드티)
  var body = shp(), bp = body.p;
  bp.moveTo(-S * 0.068, -S * 0.008); bp.quadraticCurveTo(-S * 0.078, -S * 0.09, -S * 0.04, -S * 0.118); bp.lineTo(S * 0.046, -S * 0.118); bp.quadraticCurveTo(S * 0.082, -S * 0.09, S * 0.072, -S * 0.008); bp.quadraticCurveTo(0, S * 0.01, -S * 0.068, -S * 0.008); bp.closePath();
  body.ext(-S * 0.08, -S * 0.12); body.ext(S * 0.082, S * 0.01);
  [-0.034, 0.036].forEach(function (u) { x.fillStyle = '#6a4a74'; x.beginPath(); x.ellipse(S * u, -S * 0.004, S * 0.026, S * 0.017, 0, 0, Math.PI * 2); x.fill(); });
  twFill(x, body, col, { hi: 0.38, lo: 0.22 }); twInk(x, body, col, iw);
  x.fillStyle = rgba(twLt(col, 0.7), 0.85); x.beginPath(); x.ellipse(S * 0.004, -S * 0.045, S * 0.03, S * 0.02, 0, 0, Math.PI * 2); x.fill();
  // 머리: 후드 + 얼굴
  var hood = shp().ell(-S * 0.006, hy, hr * 1.08, hr * 1.02); twFill(x, hood, col, { hi: 0.4, lo: 0.2 }); twInk(x, hood, col, iw);
  var face = shp().ell(S * 0.016, hy + hr * 0.14, hr * 0.8, hr * 0.74); twFill(x, face, skin, { hi: 0.3, lo: 0.1 }); twInk(x, face, '#e8a890', iw * 0.7);
  // 앞머리(후드 테두리)
  x.fillStyle = colR; x.beginPath(); x.ellipse(S * 0.012, hy - hr * 0.42, hr * 0.78, hr * 0.32, 0, Math.PI * 0.95, Math.PI * 2.05); x.fill();
  if (TW_SK && TW_SK.hood) TW_SK.hood(x, S, hy, hr, bunny);
  // 눈: 반짝이 두 점
  var ey = hy + hr * 0.18;
  [S * 0.006, S * 0.052].forEach(function (ex) {
    x.fillStyle = '#3a2148'; x.beginPath(); x.ellipse(ex, ey, S * 0.0135, S * 0.019, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(ex - S * 0.004, ey - S * 0.007, S * 0.0062, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(ex + S * 0.004, ey + S * 0.007, S * 0.0028, 0, Math.PI * 2); x.fill();
  });
  x.fillStyle = 'rgba(255,120,160,0.55)'; [-S * 0.012, S * 0.068].forEach(function (bx) { x.beginPath(); x.ellipse(bx, ey + S * 0.024, S * 0.013, S * 0.008, 0, 0, Math.PI * 2); x.fill(); });
  x.strokeStyle = '#a0506a'; x.lineWidth = Math.max(0.6, S * 0.006); x.beginPath(); x.moveTo(S * 0.022, ey + S * 0.027); x.quadraticCurveTo(S * 0.03, ey + S * 0.034, S * 0.038, ey + S * 0.027); x.stroke();
  // 활 팔
  x.save(); x.translate(S * 0.03, -S * 0.08); x.rotate(a);
  var pull = draw * S * 0.05;
  x.strokeStyle = ink; x.lineWidth = S * 0.032 + iw * 1.2; x.beginPath(); x.moveTo(0, 0); x.lineTo(S * 0.1, 0); x.stroke();
  x.strokeStyle = colR; x.lineWidth = S * 0.032; x.stroke();
  var hand = shp().ell(S * 0.105, 0, S * 0.019, S * 0.019); twFill(x, hand, skin, { lo: 0.1 }); twInk(x, hand, '#e8a890', iw * 0.6);
  x.beginPath(); x.moveTo(S * 0.11, -S * 0.12); x.quadraticCurveTo(S * 0.19, 0, S * 0.11, S * 0.12);
  x.strokeStyle = twInkC('#ff7fb0'); x.lineWidth = S * 0.026 + iw * 1.2; x.stroke(); x.strokeStyle = '#ff7fb0'; x.lineWidth = S * 0.026; x.stroke();
  [-1, 1].forEach(function (sd) { x.fillStyle = TC.gold; x.beginPath(); x.arc(S * 0.11, sd * S * 0.122, S * 0.014, 0, Math.PI * 2); x.fill(); });
  x.strokeStyle = 'rgba(255,250,240,0.95)'; x.lineWidth = Math.max(0.7, S * 0.008); x.beginPath(); x.moveTo(S * 0.11, -S * 0.12); x.lineTo(S * 0.095 - pull, 0); x.lineTo(S * 0.11, S * 0.12); x.stroke();
  if (draw > 0.2) { x.strokeStyle = '#ffe8c0'; x.lineWidth = Math.max(0.8, S * 0.012); x.beginPath(); x.moveTo(S * 0.095 - pull, 0); x.lineTo(S * 0.25, 0); x.stroke(); x.fillStyle = TC.hot; x.beginPath(); x.moveTo(S * 0.27, 0); x.lineTo(S * 0.24, -S * 0.016); x.lineTo(S * 0.24, S * 0.016); x.closePath(); x.fill(); }
  x.restore();
  x.restore();
}
function drawTowerParts(x, t, X, Y, S, time, info, g) {
  var sid = twSkinId(); TW_SK = sid === 'base' ? null : TW_SKINS[sid];
  try { twPartsDraw(x, t, X, Y, S, time, info, g); } finally { TW_SK = null; }
}
// ---------- 움직임 도구 ----------
// 쏜 뒤 반동(0~1): 쏜 순간 빠르게 최대, 그 뒤 천천히 풀림. fireT는 0.35(새 엔진)에서 줄어드는 초, 옛 엔진의 0.25, 0.3도 그대로 받음
function twKick(fT) { if (!(fT > 0)) return 0; var u = 1 - Math.min(0.35, fT) / 0.35; return u < 0.14 ? u / 0.14 : Math.pow(1 - (u - 0.14) / 0.86, 1.8); }
// 부드럽게 도는 조준 각도(그리기 전용 상태 t._ra, t._rt). 쏘는 순간에는 표적 방향에 딱 맞춤
function twAim(t, time) {
  var aim = typeof t.aim === 'number' && isFinite(t.aim) ? t.aim : -Math.PI / 2;
  if (t._ra == null || !(time >= t._rt) || time - t._rt > 0.4 || t.fireT > 0.3) t._ra = aim;
  else t._ra += angDiff(t._ra, aim) * Math.min(1, (time - t._rt) * 16);
  t._rt = time; return t._ra;
}
// 위에서 본 머리를 탑 위에 눕혀 돌려 그림
function twHeadAt(x, s, px, py, ang, dx, dy, sc) { x.save(); x.translate(px, py); x.scale(1, 0.78); x.rotate(ang); if (sc) x.scale(sc, sc); x.drawImage(s.c, -s.ax + (dx || 0), -s.ay + (dy || 0)); x.restore(); }
function twOrbGet(r, col) {
  var key = 'ob' + col + ':' + Math.round(r * 10) + (TW_SK ? ':' + TW_SK.id : ''), s = PART_C[key];
  if (!s) { var R = Math.ceil(r * 3), c = mkC(R * 2, R * 2); TW_IW = Math.max(0.9, r * 0.14); twOrb(cx2(c), R, R, r, col); s = PART_C[key] = spr(c, R, R); }
  return s;
}
function twBubSpr(S, col) { return partCached('bub' + col + ':' + Math.round(S), S * 0.16, S * 0.16, S * 0.08, S * 0.08, function (cx) { TW_IW = Math.max(0.9, S * 0.012); var b = shp().ell(S * 0.08, S * 0.08, S * 0.06, S * 0.06); twFill(cx, b, twLt(col, 0.35), { hi: 0.5, lo: 0.1 }); twInk(cx, b, col, TW_IW); twShine(cx, S * 0.06, S * 0.058, S * 0.018, S * 0.012, 0.9); }); }
function twShardSpr(S) { return partCached('shard:' + Math.round(S), S * 0.2, S * 0.3, S * 0.1, S * 0.15, function (cx) { TW_IW = Math.max(0.9, S * 0.014); u6Spike(cx, S * 0.1, S * 0.27, -Math.PI / 2, S * 0.24, S * 0.045, '#45acff'); }); }
function twStarSpr(S) { return partCached('twst:' + Math.round(S), S * 0.1, S * 0.1, S * 0.05, S * 0.05, function (cx) { TW_IW = Math.max(0.8, S * 0.01); twStar(cx, S * 0.05, S * 0.05, S * 0.035, TC.lemon); }); }
function twZigLine(x, x0, y0, x1, y1, seed, amp) { // 지그재그 번개 한 줄(시간 칸마다 모양이 바뀜)
  var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; x.beginPath(); x.moveTo(x0, y0);
  for (var i = 1; i < 5; i++) { var o = (twSkHash(seed + i * 1.7) - 0.5) * amp; x.lineTo(x0 + dx * i / 5 + nx * o, y0 + dy * i / 5 + ny * o); } x.lineTo(x1, y1); x.stroke();
}
function twPartsDraw(x, t, X, Y, S, time, info, g) {
  if (TW_EXT[t.k]) { if (TW_EXT[t.k].parts) TW_EXT[t.k].parts(x, t, X, Y, S, time, info, g); return; }
  var mts = info.mounts || [[0, -1]], m0 = mts[0], fz = t.frozenT > 0, P = TWP[t.k];
  // 얼거나 기절하면 움직임도 멈춤
  if (fz || t.stunT > 0) { if (t._zt == null) t._zt = time; time = t._zt; } else if (t._zt != null) t._zt = null;
  var fT = t.fireT > 0 ? Math.min(0.35, t.fireT) : 0;
  if (P) P(x, t, X, Y, S, time, info, { L: t.lvl, B: t.br, U: t.lvl >= 6 && info.ult ? 1 : 0, mts: mts, mx: X + m0[0] * S, my: Y + m0[1] * S, fT: fT, kick: twKick(fT), ra: twAim(t, time), shots: t.shots != null ? t.shots | 0 : (t.side || 0), an: info.an || {}, id: t.id || 0, R: Math.round(S) });
  if (info.ult && g && !(typeof RD !== 'undefined' && RD && RD.lowFx)) { // 궁극 단계 기운: 금빛 반짝이가 탑을 타고 오름 (전투 화면에서만)
    var tw = partCached('ultk:' + Math.round(S), S * 0.24, S * 0.24, S * 0.12, S * 0.12, function (cx) { cx.globalCompositeOperation = 'lighter'; glowAt(cx, S * 0.12, S * 0.12, S * 0.11, '#ffe9a0', 0.6); cx.globalCompositeOperation = 'source-over'; twTwinkle(cx, S * 0.12, S * 0.12, S * 0.1, 1); });
    for (var ui = 0; ui < 3; ui++) { var up = time * 0.55 + ui * 0.333 + (t.id || 0) * 0.173, uf = up % 1, uc = Math.floor(up) * 7.3 + ui * 3.1, ud = Math.sin(uf * Math.PI); x.globalAlpha = ud; x.drawImage(tw.c, X + (twSkHash(uc) - 0.5) * S * 0.95 - tw.ax * ud, Y - S * 0.15 - uf * S * (0.7 + twSkHash(uc + 1.7) * 0.7) - tw.ay * ud, tw.c.width * ud, tw.c.height * ud); }
    x.globalAlpha = 1;
  }
  if (TW_SK && TW_SK.anim && g) twSkAnim(x, t, X, Y, S, time, info); // 전투 화면에서만(메뉴 아이콘은 정지 그림)
  if (fz) { x.save(); x.globalAlpha = 0.5; x.fillStyle = '#d6f2ff'; x.beginPath(); x.ellipse(X, Y - S * 0.5, S * 0.42, S * 0.62, 0, 0, Math.PI * 2); x.fill(); x.globalAlpha = 0.9; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.025); x.stroke(); x.globalAlpha = 0.8; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(X - S * 0.2, Y - S * 0.85, S * 0.06, S * 0.12, -0.4, 0, Math.PI * 2); x.fill(); x.restore(); }
}
var TWP = {
  // 궁수: 표적을 따라 몸을 돌리고, 쏜 궁수는 뒤로 통 튀었다가 다시 시위를 당김. 6단계는 큰 활이 돌고 시위가 튕김 / 층층이 차례로 쏨
  archer: function (x, t, X, Y, S, time, info, q) {
    var col = q.L >= 4 ? (q.B === 0 ? TW_HOOD.a : TW_HOOD.b) : TW_HOOD.base, n = q.mts.length, who = q.shots % n, ca = Math.cos(q.ra), sa = Math.sin(q.ra);
    if (q.U && q.B === 0) {
      archerCached(x, q.mx - ca * S * 0.16, q.my + S * 0.06 - sa * S * 0.07, S, q.ra, q.fT > 0 ? 0 : 0.5, col, true);
      var hs = headSpr('archer', 6, 0, S, q.fT > 0.2 ? 1 : q.fT > 0.07 ? 2 : 0);
      twHeadAt(x, hs, q.mx + ca * S * (0.08 - q.kick * 0.09), q.my - S * 0.12 + sa * S * (0.05 - q.kick * 0.06), q.ra, 0, 0, 1.12);
      return;
    }
    for (var i = 0; i < n; i++) {
      var m = q.mts[i], rel = q.fT > 0 ? (q.U ? clamp((0.35 - q.fT) / 0.35 * 1.7 - i * 0.13, 0, 1) : i === who ? 1 - Math.min(1, q.fT / 0.3) : -1) : -1;
      var draw = rel < 0 ? 0.55 + 0.45 * Math.sin(time * 3 + i) : rel, hop = rel >= 0 && rel < 0.5 ? (0.5 - rel) * 2 : 0;
      archerCached(x, X + m[0] * S - ca * hop * S * 0.035, Y + m[1] * S - hop * S * 0.04, S, q.ra, clamp(draw, 0, 1), col, q.L >= 4 && q.B === 0);
    }
  },
  // 투석기: 쏘는 순간 팔이 앞으로 휙 넘어갔다가 천천히 되감김. 6단계 유성은 바구니에서 불꽃이 일렁임
  catapult: function (x, t, X, Y, S, time, info, q) {
    var L = q.L, B = q.B, U = q.U, f = Math.cos(q.ra) >= 0 ? 1 : -1, u = q.fT > 0 ? 1 - q.fT / 0.35 : 1;
    var sw = q.fT > 0 ? (u < 0.22 ? easeOut(u / 0.22) : 1 - easeIO((u - 0.22) / 0.78)) : 0, abk = Math.round(sw * 12), loaded = q.fT <= 0.08;
    var L2 = (info.arm || 0.6) * S, heavy = L >= 4 && B === 1, fire = L >= 4 && B === 0;
    var cs = partCached('cat' + L + B + ':' + abk + ':' + (loaded ? 1 : 0) + ':' + q.R, L2 * 2.9, L2 * 2.9, L2 * 1.45, L2 * 1.45, function (cx) {
      TW_IW = Math.max(1, S * 0.02);
      cx.translate(L2 * 1.45, L2 * 1.45); var an = -2.3 + abk / 12 * 1.6, ex = Math.cos(an) * L2, ey = Math.sin(an) * L2, wx = -Math.cos(an) * L2 * 0.3, wy = -Math.sin(an) * L2 * 0.3;
      twLeg(cx, wx, wy, ex, ey, S * (U ? 0.1 : 0.08), S * (U ? 0.075 : 0.06), heavy ? TC.woodD : U ? '#e89a58' : TC.wood);
      if (L >= 3) u6E(cx, wx, wy, S * (U ? 0.085 : 0.065), S * (U ? 0.085 : 0.065), U ? TC.gold : TC.iron, { hi: 0.5 });
      var cw = S * (U ? 0.14 : 0.1); u6E(cx, ex, ey, cw, cw * 0.68, U && fire ? TC.iron : TC.woodD, { hi: 0.35, iw: 1 });
      if (loaded) {
        if (fire) { cx.save(); cx.globalCompositeOperation = 'lighter'; glowAt(cx, ex, ey - S * 0.04, S * (U ? 0.3 : 0.17), '#ffa04a', 0.85); cx.restore(); }
        var rr = S * (heavy ? (U ? 0.175 : 0.1) : U ? 0.12 : 0.07), rc = fire ? (U ? '#ff8a5a' : '#ff9a6a') : heavy ? '#c8b6f2' : '#e6dcf0', ry0 = ey - rr * 0.7;
        u6E(cx, ex, ry0, rr, rr * 0.9, rc, { hi: 0.45, iw: 1, sh: 1 });
        if (U && fire) { cx.fillStyle = '#ffe27a'; [[-0.3, 0.25], [0.35, -0.05], [0.02, 0.5]].forEach(function (p) { cx.beginPath(); cx.arc(ex + p[0] * rr, ry0 + p[1] * rr, rr * 0.16, 0, Math.PI * 2); cx.fill(); }); }
      }
    });
    x.save(); x.translate(q.mx, q.my); x.scale(f, 1); x.drawImage(cs.c, -cs.ax, -cs.ay); x.restore();
    var pv = partCached('catpv:' + q.R, S * 0.14, S * 0.14, S * 0.07, S * 0.07, function (cx) { TW_IW = Math.max(0.9, S * 0.016); var ps = shp().ell(S * 0.07, S * 0.07, S * 0.05, S * 0.05); twFill(cx, ps, TC.iron, { hi: 0.5 }); twInk(cx, ps, TC.iron); twShine(cx, S * 0.055, S * 0.055, S * 0.017, S * 0.011, 0.85); });
    x.drawImage(pv.c, q.mx - pv.ax, q.my - pv.ay);
    if (U && fire && loaded) { // 운석 불꽃
      var an2 = -2.3 + sw * 1.6, fx = q.mx + f * Math.cos(an2) * L2, fy = q.my + Math.sin(an2) * L2 - S * 0.1;
      x.save(); x.globalCompositeOperation = 'lighter';
      for (var j = 0; j < 3; j++) { var ph = time * 10 + j * 2.1, d = S * (0.34 - j * 0.07); x.globalAlpha = 0.62 - j * 0.14; x.drawImage(glowSpr(j ? '#ff7a4a' : '#ffd060', 48), fx - d / 2 + Math.sin(ph) * S * 0.015, fy - d / 2 - j * S * 0.08 - Math.abs(Math.sin(ph * 1.3)) * S * 0.03, d, d); }
      x.restore();
    }
  },
  // 마법: 구슬이 둥실 뜨고 쏠 때 크게 맥동, 고리가 빨라짐. 6단계는 번개 고리 / 조여드는 자이로 고리
  arcane: function (x, t, X, Y, S, time, info, q) {
    var L = q.L, B = q.B, U = q.U, mx = q.mx, bob = Math.sin(time * 2.2) * S * 0.04, cy = q.my + bob, Z = L >= 4 && B === 0, Bm = L >= 4 && B === 1, gc = Z ? '#8fdcff' : Bm ? '#ff8ad8' : '#b892ff';
    var busy = t.busy != null ? clamp(+t.busy || 0, 0, 1) : (t.beamT > 0 && t.st && t.st.ramp ? Math.min(1, t.beamT / t.st.ramp) : 0);
    var pulse = 1 + q.kick * 0.45 + busy * 0.3 + (U ? 0.06 * Math.sin(time * 5) : 0), r0 = S * (U ? (Bm ? 0.165 : 0.115) : 0.075 + L * 0.009), gl = S * (U ? 1.05 : 0.9) * (1 + q.kick * 0.5 + busy * 0.3);
    x.save(); x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr(gc, 64), mx - gl / 2, cy - gl / 2, gl, gl); x.restore();
    if (U && Z) { // 번개 고리 둘: 미리 그린 지그재그 고리 석 장을 번갈아 돌려 찍음
      x.save(); x.globalCompositeOperation = 'lighter';
      for (var j = 0; j < 2; j++) {
        var v = (Math.floor(time * 13) + j * 2) % 3, zs = partCached('zig' + v + ':' + q.R, S * 1.3, S * 1.3, S * 0.65, S * 0.65, function (cx) {
          var m = S * 0.65, rr0 = S * 0.5, n = 30; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.beginPath();
          for (var i = 0; i <= 23; i++) { var a = i / n * Math.PI * 2, jt = 1 + (twSkHash(v * 17.3 + i * 1.3) - 0.5) * (i % 2 ? 0.3 : 0.08); if (i) cx.lineTo(m + Math.cos(a) * rr0 * jt, m + Math.sin(a) * rr0 * jt); else cx.moveTo(m + Math.cos(a) * rr0 * jt, m + Math.sin(a) * rr0 * jt); }
          cx.strokeStyle = 'rgba(90,170,255,0.6)'; cx.lineWidth = Math.max(2.4, S * 0.06); cx.stroke(); cx.strokeStyle = 'rgba(240,250,255,1)'; cx.lineWidth = Math.max(1.2, S * 0.022); cx.stroke();
        }), kk = 0.74 + j * 0.42;
        x.setTransform(1, 0, 0, 1, 0, 0); x.translate(mx, cy + S * (0.22 + j * 0.3)); x.scale(kk, kk * 0.32); x.rotate(time * (j ? -2.2 : 3)); x.drawImage(zs.c, -zs.ax, -zs.ay);
      }
      x.restore();
    }
    var os = twOrbGet(r0, gc); x.drawImage(os.c, mx - os.ax * pulse, cy - os.ay * pulse, os.c.width * pulse, os.c.height * pulse);
    // 도는 고리
    var sp = 1.5 + busy * 4 + q.kick * 4;
    x.save(); x.strokeStyle = rgba(twLt(gc, 0.3), 0.85); x.lineWidth = Math.max(1.1, S * 0.018); x.lineCap = 'round';
    if (U && Bm) { // 자이로 고리 셋: 쏠 때 안으로 조여듦
      for (var j2 = 0; j2 < 3; j2++) { var rr = r0 * (1.55 + j2 * 0.45) * (1 - q.kick * 0.28); x.beginPath(); x.ellipse(mx, cy, rr, rr * (0.28 + 0.5 * Math.abs(Math.sin(time * (0.9 + j2 * 0.5) + j2 * 2))), time * (0.7 + j2 * 0.4) * (j2 % 2 ? -1 : 1), 0, Math.PI * 2); x.strokeStyle = twInkC(TC.gold); x.lineWidth = Math.max(1.6, S * 0.034); x.stroke(); x.strokeStyle = j2 === 1 ? '#fff3b0' : TC.gold; x.lineWidth = Math.max(1, S * 0.02); x.stroke(); }
    } else for (var r = 0; r < (L >= 3 ? 2 : 1); r++) { var a1 = time * (sp + r) % (Math.PI * 2); x.beginPath(); x.ellipse(mx, cy, S * (0.18 + r * 0.06) * (U ? 1.35 : 1), S * (0.055 + r * 0.02) * (U ? 1.35 : 1), Math.sin(time * 0.7 + r) * 0.5, a1, a1 + 4.2); x.stroke(); }
    x.restore();
    if (L >= 3) { var stS = twStarSpr(S), no = U ? 5 : 3; for (var o = 0; o < no; o++) { var a2 = time * (1.3 + q.kick * 3) + o * Math.PI * 2 / no, od = U ? 0.36 : 0.25; x.drawImage(stS.c, mx + Math.cos(a2) * S * od - stS.ax, cy + Math.sin(a2) * S * od * 0.32 + S * 0.08 - stS.ay); } }
    if (Z) { // 번개 불꽃(가끔), 6단계는 양옆 기둥에서 구슬로 번개가 튐
      x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
      var tb = Math.floor(time * 11);
      if (twSkHash(tb * 1.9 + q.id) < 0.3 || q.fT > 0.2) { x.strokeStyle = 'rgba(200,240,255,0.95)'; x.lineWidth = Math.max(1, S * 0.016); twZigLine(x, mx, cy, mx + (twSkHash(tb + 3.1) - 0.5) * S * 0.5, cy + S * (0.25 + twSkHash(tb + 5.7) * 0.3), tb * 3.3, S * 0.12); }
      if (U) [q.an.rodL, q.an.rodR].forEach(function (rd, i) { if (!rd || !(q.fT > 0.1 || twSkHash(tb * 2.3 + i * 3.3 + q.id) > 0.6)) return; x.strokeStyle = 'rgba(130,200,255,0.6)'; x.lineWidth = Math.max(2, S * 0.045); twZigLine(x, X + rd[0] * S, Y + rd[1] * S, mx, cy, tb * 5.1 + i * 9, S * 0.14); x.strokeStyle = 'rgba(245,252,255,0.98)'; x.lineWidth = Math.max(1, S * 0.018); twZigLine(x, X + rd[0] * S, Y + rd[1] * S, mx, cy, tb * 5.1 + i * 9, S * 0.14); });
      x.restore();
    }
  },
  // 서리: 눈 결정이 돌다가 쏠 때 확 커지고 냉기 고리가 퍼짐. 6단계는 떠 있는 큰 얼음 결정 / 소용돌이
  frost: function (x, t, X, Y, S, time, info, q) {
    var L = q.L, U = q.U, Bz = L >= 4 && q.B === 1, mx = q.mx, my = q.my, k = q.kick, i, a, gd = S * 0.7 * (1 + k * 0.7) * (U ? 1.25 : 1);
    x.save(); x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr('#9fdcff', 64), mx - gd / 2, my - gd / 2, gd, gd);
    x.globalAlpha = 0.25 + (0.5 + 0.5 * Math.sin(time * 2)) * 0.2 + k * 0.4; x.drawImage(glowSpr('#ffffff', 32), mx - S * 0.1, my - S * 0.1, S * 0.2, S * 0.2); x.restore();
    if (U && !Bz) {
      var cr = partCached('frCr:' + q.R, S * 0.56, S * 0.86, S * 0.28, S * 0.43, function (cx) {
        TW_IW = Math.max(1.1, S * 0.02); var m = S * 0.28, c = S * 0.43, w = S * 0.19, h = S * 0.38, col = '#3f9cff';
        cx.save(); cx.globalCompositeOperation = 'lighter'; glowAt(cx, m, c, S * 0.28, '#9fdcff', 0.5); cx.restore();
        u6P(cx, [[m, c - h], [m - w, c - h * 0.2], [m, c + h * 0.05]], twLt(col, 0.6), { hi: 0.6, lo: 0.0, ink: 0 }); u6P(cx, [[m, c - h], [m + w, c - h * 0.2], [m, c + h * 0.05]], twLt(col, 0.22), { hi: 0.3, lo: 0.1, ink: 0 });
        u6P(cx, [[m - w, c - h * 0.2], [m, c + h * 0.05], [m, c + h]], twLt(col, 0.36), { hi: 0.3, lo: 0.1, ink: 0 }); u6P(cx, [[m + w, c - h * 0.2], [m, c + h * 0.05], [m, c + h]], col, { hi: 0.1, lo: 0.25, ink: 0 });
        twInk(cx, shp().poly([[m, c - h], [m + w, c - h * 0.2], [m, c + h], [m - w, c - h * 0.2]]), col, TW_IW * 1.2);
        cx.strokeStyle = 'rgba(255,255,255,0.75)'; cx.lineWidth = Math.max(0.8, S * 0.012); cx.beginPath(); cx.moveTo(m - w, c - h * 0.2); cx.lineTo(m, c + h * 0.05); cx.lineTo(m + w, c - h * 0.2); cx.moveTo(m, c - h); cx.lineTo(m, c + h); cx.stroke();
        twShine(cx, m - w * 0.42, c - h * 0.42, w * 0.14, h * 0.16, 0.85, 0.5); twTwinkle(cx, m + w * 0.5, c - h * 0.6, S * 0.05, 0.95);
      }), sh = twShardSpr(S), cyy = my + Math.sin(time * 1.6) * S * 0.035 - k * S * 0.06, sc = 1 + k * 0.14;
      for (var pass = 0; pass < 2; pass++) {
        for (i = 0; i < 5; i++) { a = time * (0.9 + k * 3) + i * 1.2566; if ((Math.sin(a) < 0) !== (pass === 0)) continue; var ss = 0.62 + 0.16 * Math.sin(a); x.drawImage(sh.c, mx + Math.cos(a) * S * 0.4 - sh.ax * ss, cyy + S * 0.1 + Math.sin(a) * S * 0.1 - sh.ay * ss, sh.c.width * ss, sh.c.height * ss); }
        if (!pass) x.drawImage(cr.c, mx - cr.ax * sc, cyy - cr.ay * sc, cr.c.width * sc, cr.c.height * sc);
      }
    } else if (U && Bz) { // 소용돌이: 아래는 좁고 위는 넓게, 쏠 때 더 빠르고 굵게
      x.save(); x.lineCap = 'round';
      for (i = 0; i < 7; i++) { var v = i / 6, yy = my + S * 0.36 - v * S * 0.78, rr = S * (0.09 + v * 0.27) * (1 + k * 0.2), a0 = (time * (5 + k * 7) + i * 1.1) % (Math.PI * 2), wx = Math.sin(time * 3 + i * 0.8) * S * 0.035 * (0.4 + v); x.beginPath(); x.ellipse(mx + wx, yy, rr, rr * 0.3, 0, a0, a0 + 4.7); x.strokeStyle = 'rgba(120,180,255,0.5)'; x.lineWidth = Math.max(2, S * 0.06); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = Math.max(1, S * 0.026); x.stroke(); }
      x.restore();
      var sh2 = twShardSpr(S); for (i = 0; i < 4; i++) { a = time * (2.4 + k * 4) + i * 1.571; var s2 = 0.5 + 0.12 * Math.sin(a); x.drawImage(sh2.c, mx + Math.cos(a) * S * (0.3 + i * 0.03) - sh2.ax * s2, my - S * (i * 0.13 - 0.1) + Math.sin(a) * S * 0.09 - sh2.ay * s2, sh2.c.width * s2, sh2.c.height * s2); }
    } else {
      var sn = partCached('frSn:' + q.R, S * 0.3, S * 0.3, S * 0.15, S * 0.15, function (cx) {
        var m = S * 0.15, r = S * 0.115; cx.lineCap = 'round'; cx.translate(m, m);
        [['#3f8fe8', Math.max(2.2, S * 0.05)], ['#ffffff', Math.max(1.1, S * 0.026)]].forEach(function (p) { cx.strokeStyle = p[0]; cx.lineWidth = p[1]; cx.beginPath(); for (var j = 0; j < 6; j++) { var an = j * Math.PI / 3, c = Math.cos(an), s = Math.sin(an); cx.moveTo(0, 0); cx.lineTo(c * r, s * r); [-1, 1].forEach(function (sd) { cx.moveTo(c * r * 0.6, s * r * 0.6); cx.lineTo(c * r * 0.6 + Math.cos(an + sd * 0.9) * r * 0.32, s * r * 0.6 + Math.sin(an + sd * 0.9) * r * 0.32); }); } cx.stroke(); });
      }), sc2 = (0.7 + Math.min(L, 5) * 0.08) * (1 + k * 0.6);
      x.save(); x.translate(mx, my - S * 0.03 + Math.sin(time * 2) * S * 0.025); x.rotate(time * 0.8 + k * 1.3); x.scale(sc2, sc2); x.drawImage(sn.c, -sn.ax, -sn.ay); x.restore();
      if (Bz) { x.fillStyle = 'rgba(255,255,255,0.95)'; for (i = 0; i < 10; i++) { a = time * (2 + k * 5) + i * 0.63; var r2 = S * (0.18 + 0.05 * Math.sin(i)); x.beginPath(); x.arc(mx + Math.cos(a) * r2, my + Math.sin(a) * r2 * 0.6, S * 0.022, 0, Math.PI * 2); x.fill(); } }
    }
    if (q.fT > 0) { var u = 1 - q.fT / 0.35; x.save(); x.globalAlpha = (1 - u) * 0.85; x.strokeStyle = '#eaf8ff'; x.lineWidth = Math.max(1.2, S * 0.045 * (1 - u * 0.6)); x.beginPath(); x.ellipse(X, Y - S * 0.3, S * (0.3 + u * 0.6), S * (0.17 + u * 0.33), 0, 0, Math.PI * 2); x.stroke(); x.restore(); }
  },
  // 노포: 표적을 따라 돌고, 쏘면 활이 펴지며 시위가 앞으로 튕기고 몸통이 뒤로 밀렸다 돌아옴
  ballista: function (x, t, X, Y, S, time, info, q) {
    var hs = headSpr('ballista', q.L, q.B, S, q.fT > 0.2 ? 1 : q.fT > 0.07 ? 2 : 0), rec = q.kick * S * (q.U && q.B === 0 ? 0.11 : 0.07);
    twHeadAt(x, hs, q.mx - Math.cos(q.ra) * rec, q.my - Math.sin(q.ra) * rec * 0.6, q.ra + (q.fT > 0.2 ? Math.sin(time * 70) * 0.03 : 0));
  },
  // 대포: 포가가 돌고, 쏜 포신만 뒤로 쑥 밀렸다 돌아옴(여러 문이면 번갈아), 포구 섬광. 6단계 포화 요새는 세 포탑이 번갈아 쏨
  cannon: function (x, t, X, Y, S, time, info, q) {
    var draw = function (px, py, L, B, sc, kick, shot, mini) {
      var pf = mini ? 'm' : '', P = twCanSpec(L, B, S, mini), hc = headSpr('cannon', L, B, S, pf + 'c'), hb = headSpr('cannon', L, B, S, pf + 'b'), hh = headSpr('cannon', L, B, S, pf + 'h'), n = P.offs.length, who = shot % n, rk = S * (P.big ? (P.U ? 0.2 : 0.14) : 0.1);
      x.save(); x.translate(px - Math.cos(q.ra) * kick * S * 0.035 * sc, py - Math.sin(q.ra) * kick * S * 0.02 * sc); x.scale(sc, 0.78 * sc); x.rotate(q.ra);
      x.drawImage(hc.c, -hc.ax, -hc.ay);
      for (var i = 0; i < n; i++) x.drawImage(hb.c, -hb.ax - (n === 1 || i === who ? kick * rk : 0), -hb.ay + P.offs[i] * S);
      x.drawImage(hh.c, -hh.ax, -hh.ay);
      if (kick > 0 && q.fT > 0.17) { var a = clamp((q.fT - 0.17) / 0.12, 0, 1), d = S * (P.big ? (P.U ? 0.9 : 0.6) : 0.4) * (0.5 + a * 0.6); x.globalCompositeOperation = 'lighter'; x.globalAlpha = a; x.drawImage(glowSpr('#ffe08a', 48), P.bl + S * 0.04 - d / 2, P.offs[n === 1 ? 0 : who] * S - d / 2, d, d); }
      x.restore();
    };
    if (q.U && q.B === 1) { var w3 = q.shots % 3; [1, 2, 0].forEach(function (i) { var m = q.mts[i] || q.mts[0], on = t.shots == null || w3 === i; draw(X + m[0] * S, Y + m[1] * S, 6, 1, i ? 0.6 : 0.95, on ? q.kick : 0, Math.floor(q.shots / 3), i ? 1 : 0); }); }
    else draw(q.mx, q.my, q.L, q.B, 1, q.kick, q.shots);
  },
  // 화염: 불꽃이 일렁이다 쏠 때 크게 치솟고 표적 쪽으로 쏠림. 용머리는 표적을 보며 입을 벌리고 고개를 내밂. 6단계 고리는 불꽃이 고리를 따라 돎
  flame: function (x, t, X, Y, S, time, info, q) {
    var L = q.L, U = q.U, mx = q.mx, my = q.my, firing = q.fT > 0, ca = Math.cos(q.ra), sa = Math.sin(q.ra), j, ph;
    if (info.dragon) {
      if (U) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.22 + 0.1 * Math.sin(time * 2.4) + (firing ? 0.25 : 0); x.drawImage(glowSpr('#ffd060', 64), mx - S * 0.55, my - S * 0.8, S * 1.1, S * 1.1); x.restore(); }
      var hs = headSpr('flame', L, q.B, S, firing ? 1 : 0), lun = firing ? S * (0.06 + 0.015 * Math.sin(time * 40)) : Math.sin(time * 1.8) * S * 0.01;
      twHeadAt(x, hs, mx + ca * lun, my + sa * lun * 0.6, q.ra + (firing ? Math.sin(time * 23) * 0.05 : Math.sin(time * 1.3) * 0.06));
      if (firing) { var d = S * (U ? 0.6 : 0.4), mr = S * (U ? 0.56 : 0.38); x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.75 + 0.2 * Math.sin(time * 31); x.drawImage(glowSpr('#ffb040', 48), mx + ca * mr - d / 2, my + sa * mr * 0.78 - d / 2, d, d); x.restore(); }
      return;
    }
    var fl = firing ? 1.5 : 0.8 + 0.08 * Math.sin(time * 3.1), lean = firing ? 0.07 : 0;
    x.save(); x.globalCompositeOperation = 'lighter';
    var pts = info.ring ? [[0, 0], [-0.36, 0.16], [0.36, 0.16], [-0.3, 0.38], [0.3, 0.38]] : [[0, 0]];
    pts.forEach(function (p, i) {
      var fx = mx + p[0] * S, fy = my + p[1] * S, sz = S * (i ? 0.1 : (info.ring6 ? 0.27 : 0.16 + Math.min(L, 5) * 0.015)) * fl;
      for (j = 0; j < 4; j++) { ph = time * 9 + j * 1.7 + i; x.globalAlpha = 0.55 - j * 0.1; x.drawImage(glowSpr(j < 2 ? '#ffc040' : '#ff6a6a', 48), fx - sz + Math.sin(ph) * S * 0.02 + ca * lean * S * j, fy - sz * (1.3 + j * 0.25) - Math.abs(Math.sin(ph * 1.3)) * S * 0.04, sz * 2, sz * 2); }
    });
    if (info.ring6 && q.an.hoop) { // 고리를 따라 도는 불꽃 여덟
      var h = q.an.hoop, sp = firing ? 5 : 1.4, n = 8;
      for (j = 0; j < n; j++) { var a = time * sp + j * Math.PI * 2 / n, back = Math.sin(a) < 0, px = X + h[0] * S + Math.cos(a) * h[2] * S, py = Y + h[1] * S + Math.sin(a) * h[3] * S, d2 = S * (firing ? 0.36 : 0.24) * (back ? 0.75 : 1) * (1 + 0.15 * Math.sin(time * 11 + j));
        x.globalAlpha = back ? 0.5 : 0.9; x.drawImage(glowSpr('#ff6a6a', 48), px - d2 / 2, py - d2 * 0.9, d2, d2); x.drawImage(glowSpr('#ffd060', 48), px - d2 * 0.3, py - d2 * 0.5, d2 * 0.6, d2 * 0.6); }
    }
    x.restore();
  },
  // 연금: 가마솥이 보글보글 끓고 국자가 젓고, 던질 때 용액이 튀어 오름. 6단계는 유리 탱크 속 거품과 떨어지는 방울 / 버섯 포자 구름
  alchemy: function (x, t, X, Y, S, time, info, q) {
    var L = q.L, U = q.U, mx = q.mx, my = q.my, liq = info.liq || '#8fea5a', firing = q.fT > 0, bs = twBubSpr(S, liq), i, ph, d;
    var tank = U && q.an.tank, rx = S * (U ? 0.3 : (0.25 + Math.min(L, 5) * 0.015) * 0.84), ry = rx * 0.3, sy = tank ? Y + (tank[1] - tank[2] * 0.22) * S : my;
    if (tank) { // 탱크 속에서 올라오는 거품
      for (i = 0; i < 6; i++) { ph = (time * (0.7 + (firing ? 1.2 : 0)) + i * 0.17 + q.id * 0.13) % 1; d = (0.5 + (i % 3) * 0.25) * (0.6 + ph * 0.5); x.globalAlpha = 0.9 * (1 - ph * ph); x.drawImage(bs.c, X + tank[0] * S + Math.sin(i * 2.4 + time * 1.3) * tank[2] * S * 0.55 - bs.ax * d, Y + tank[1] * S + tank[2] * S * (0.78 - ph * 0.98) - bs.ay * d, bs.c.width * d, bs.c.height * d); }
      x.globalAlpha = 1;
      if (q.an.drip) { ph = (time * 1.1 + q.id * 0.3) % 1; x.fillStyle = liq; x.globalAlpha = 1 - ph * 0.6; x.beginPath(); x.ellipse(X + q.an.drip[0] * S, Y + q.an.drip[1] * S + ph * ph * S * 0.42, S * 0.03, S * 0.045, 0, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1; }
    } else { // 국자: 가마솥을 빙빙 저음
      var a = time * (2.2 + (firing ? 4 : 0)), lx = mx + Math.cos(a) * rx * 0.5, ly = my + Math.sin(a) * ry * 0.5;
      x.save(); x.lineCap = 'round'; x.beginPath(); x.moveTo(lx, ly); x.lineTo(mx + Math.cos(a) * rx * 0.25, my - S * 0.36); twStrokeInk(x, TC.woodD, Math.max(1.4, S * 0.035)); x.restore();
      x.fillStyle = TC.gold; x.beginPath(); x.arc(mx + Math.cos(a) * rx * 0.25, my - S * 0.36, Math.max(1.2, S * 0.03), 0, Math.PI * 2); x.fill();
    }
    // 수면에서 부풀다 터지는 거품
    for (i = 0; i < 4; i++) { ph = (time * (0.9 + (firing ? 1.5 : 0)) + i * 0.27 + q.id * 0.13) % 1; var cyc = Math.floor(time * 0.9 + i * 0.27 + q.id * 0.13) * 3.7 + i * 5.1; d = Math.sin(ph * Math.PI) * (0.55 + twSkHash(cyc + 2) * 0.6); x.drawImage(bs.c, mx + (twSkHash(cyc) - 0.5) * rx * 1.3 - bs.ax * d, sy + (twSkHash(cyc + 1) - 0.5) * ry * 0.9 - S * 0.02 * d - bs.ay * d, bs.c.width * d, bs.c.height * d); }
    x.save(); x.globalCompositeOperation = 'lighter';
    for (var b = 0; b < 3; b++) { ph = (time * 0.9 + b * 0.33) % 1; x.globalAlpha = 0.8 * (1 - ph); x.drawImage(glowSpr(liq, 24), mx - S * 0.12 + b * S * 0.1 - S * 0.03, sy - ph * S * 0.18 - S * 0.03, S * 0.06, S * 0.06); }
    if (firing) { x.globalAlpha = q.kick * 0.7; d = S * (U ? 0.9 : 0.7); x.drawImage(glowSpr(liq, 64), mx - d / 2, sy - d / 2, d, d); }
    x.restore();
    if (firing) { var u = 1 - q.fT / 0.35; for (i = 0; i < 3; i++) { d = 0.8 - u * 0.4; x.drawImage(bs.c, mx + (i - 1) * rx * (0.3 + u * 0.5) - bs.ax * d, sy - Math.sin(u * Math.PI) * S * (0.26 + i * 0.07) - bs.ay * d, bs.c.width * d, bs.c.height * d); } }
    if (U && q.an.m1) { var pf = softSpr('#e2c4ff', 32); [q.an.m1, q.an.m2, q.an.m3].forEach(function (m, j) { for (var k2 = 0; k2 < 2; k2++) { var p2 = (time * 0.5 + j * 0.33 + k2 * 0.5) % 1, dd = S * (0.12 + p2 * 0.2); x.globalAlpha = 0.75 * (1 - p2); x.drawImage(pf, X + m[0] * S + Math.sin(time * 1.3 + j + k2 * 2) * S * 0.05 - dd / 2, Y + m[1] * S - p2 * S * 0.32 - dd / 2, dd, dd); } }); x.globalAlpha = 1; }
  },
  // 종: 스스로 주기적으로 크게 울리며 흔들리고 소리 물결이 퍼짐. 북은 채 두 개가 번갈아 두드리고 북이 울림
  bell: function (x, t, X, Y, S, time, info, q) {
    var L = q.L, B = q.B, U = q.U, mx = q.mx, my = q.my, tau = (time + q.id * 0.37) % 2.4, ring = Math.exp(-tau * 2.3) + q.kick * 0.6;
    if (info.drum) {
      var beat = (time * 2.6 + q.id * 0.37), tb = beat % 1, hit = Math.exp(-tb * 6), side = Math.floor(beat) % 2 ? 1 : -1, R = S * (U ? 0.33 : 0.17);
      var ds = U ? partCached('drumU:' + q.R, S * 0.8, S * 0.8, S * 0.4, S * 0.4, function (cx) {
        TW_IW = Math.max(1.1, S * 0.02); var m = S * 0.4;
        u6E(cx, m + S * 0.035, m - S * 0.01, S * 0.33, S * 0.33, twSh(TC.sky, 0.2), { hi: 0.2, iw: 1.1 }); u6E(cx, m, m, S * 0.33, S * 0.33, TC.sky, { hi: 0.45, iw: 1.1 });
        for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2; u6E(cx, m + Math.cos(a) * S * 0.29, m + Math.sin(a) * S * 0.29, S * 0.026, S * 0.026, TC.gold, { hi: 0.6, iw: 0.5 }); }
        u6E(cx, m, m, S * 0.245, S * 0.245, '#fff6e8', { hi: 0.3, lo: 0.14, ic: TC.gold, iw: 1 }); twStar(cx, m, m, S * 0.11, TC.gold); twShine(cx, m - S * 0.12, m - S * 0.14, S * 0.05, S * 0.025, 0.8);
      }) : partCached('bell' + L + B + ':' + q.R, S * 0.44, S * 0.42, S * 0.22, S * 0.03, function (cx) {
        TW_IW = Math.max(1, S * 0.018); cx.translate(S * 0.22, S * 0.03); cx.lineJoin = 'round';
        var dr = twCyl(cx, 0, S * 0.12, S * 0.17, S * 0.08, S * 0.14, TC.sky, null, { top: '#fff6e8', bands: [0.0, 0.8], bandCol: TC.gold });
        cx.save(); cx.clip(dr.side.p); cx.strokeStyle = 'rgba(255,255,255,0.9)'; cx.lineWidth = Math.max(0.8, S * 0.012); cx.beginPath(); for (var q2 = 0; q2 <= 6; q2++) { var qx = -S * 0.17 + q2 * S * 0.057; cx.lineTo(qx, S * (q2 % 2 ? 0.26 : 0.17)); } cx.stroke(); cx.restore();
      });
      var sc = 1 + hit * (U ? 0.08 : 0.06), dy0 = U ? 0 : -S * 0.06;
      x.drawImage(ds.c, mx - ds.ax * sc, my + dy0 - ds.ay * sc, ds.c.width * sc, ds.c.height * sc);
      // 북채 둘: 번갈아 내리침
      var tx = U ? 0 : 0, ty = U ? 0 : S * 0.04;
      [-1, 1].forEach(function (sd) { var dn = sd === side ? hit : 0, hx = mx + sd * R * (U ? 1.5 : 1.45), hy = my + ty - R * (U ? 1.0 : 0.9), ex = mx + sd * R * (U ? 0.42 : 0.45), ey = my + ty - R * (U ? 0.1 : -0.35), kx = lerp(hx - sd * R * 0.2, ex, 0.35 + dn * 0.65), ky = lerp(hy - R * 0.45, ey, 0.35 + dn * 0.65);
        x.save(); x.lineCap = 'round'; x.beginPath(); x.moveTo(hx, hy); x.lineTo(kx, ky); twStrokeInk(x, TC.woodD, Math.max(1.4, S * (U ? 0.045 : 0.03))); x.restore();
        x.fillStyle = TC.hot; x.strokeStyle = twInkC(TC.hot); x.lineWidth = Math.max(0.8, S * 0.012); x.beginPath(); x.arc(kx, ky, Math.max(1.6, S * (U ? 0.06 : 0.04)), 0, Math.PI * 2); x.fill(); x.stroke(); });
      if (hit > 0.2) { x.save(); x.globalAlpha = hit; x.strokeStyle = '#ffffff'; x.lineCap = 'round'; x.lineWidth = Math.max(1.2, S * 0.03); [-1, 1].forEach(function (sd) { for (var j = 0; j < 2; j++) { var rr = R * (1.25 + tb * 1.6 + j * 0.3); x.beginPath(); x.arc(mx, my + ty, rr, sd > 0 ? -0.5 : Math.PI - 0.5, sd > 0 ? 0.5 : Math.PI + 0.5); x.stroke(); } }); x.restore(); }
      return;
    }
    var sw = Math.sin(tau * 10) * Math.min(1, ring) * 0.5 + Math.sin(time * 1.4) * 0.05, holy = L >= 4 && B === 1, bsc = U ? 1.5 : 1;
    if (holy) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.5 + 0.2 * Math.sin(time * 3) + Math.min(0.3, ring * 0.3); var gd = S * (U ? 1.0 : 0.8) * (1 + Math.min(1, ring) * 0.25); x.drawImage(glowSpr('#fff0a0', 64), mx - gd / 2, my + S * 0.1 - gd / 2 - S * 0.25, gd, gd); x.restore(); }
    var bs = partCached('bell' + L + B + ':' + q.R, S * 0.44, S * 0.42, S * 0.22, S * 0.03, function (cx) {
      TW_IW = Math.max(1, S * 0.018); cx.translate(S * 0.22, S * 0.03); cx.lineJoin = 'round';
      var bc = holy ? '#ffe27a' : TC.gold;
      var bl = shp(); bl.p.moveTo(-S * 0.06, S * 0.02); bl.p.quadraticCurveTo(-S * 0.09, S * 0.17, -S * 0.14, S * 0.22); bl.p.quadraticCurveTo(0, S * 0.26, S * 0.14, S * 0.22); bl.p.quadraticCurveTo(S * 0.09, S * 0.17, S * 0.06, S * 0.02); bl.p.quadraticCurveTo(0, -S * 0.03, -S * 0.06, S * 0.02); bl.p.closePath(); bl.ext(-S * 0.14, -S * 0.02); bl.ext(S * 0.14, S * 0.25);
      twCylG(cx, bl, bc, { hi: 0.55 }); twInk(cx, bl, bc);
      twShine(cx, -S * 0.045, S * 0.07, S * 0.014, S * 0.045, 0.75, 0.25);
      // 리본
      [-1, 1].forEach(function (sd) { var rb = shp().ell(sd * S * 0.04, S * 0.005, S * 0.04, S * 0.025); twFill(cx, rb, TC.hot, { hi: 0.4 }); twInk(cx, rb, TC.hot, TW_IW * 0.6); });
      var kn = shp().ell(0, S * 0.006, S * 0.017, S * 0.017); twFill(cx, kn, TC.pink, { hi: 0.4 }); twInk(cx, kn, TC.hot, TW_IW * 0.6);
    });
    // 추: 종과 엇박자로 흔들림
    var py0 = my - S * 0.06, ca = sw * -1.5 * Math.min(1, 0.4 + ring);
    x.save(); x.translate(mx, py0); x.rotate(sw); if (bsc !== 1) x.scale(bsc, bsc); x.drawImage(bs.c, -bs.ax, -bs.ay); x.restore();
    x.fillStyle = TC.pink; x.strokeStyle = twInkC(TC.pink); x.lineWidth = Math.max(0.8, S * 0.012); x.beginPath(); x.arc(mx + Math.sin(sw * 0.4 - ca) * S * 0.25 * bsc * -1, py0 + Math.cos(sw * 0.4 - ca) * S * 0.25 * bsc, Math.max(1.5, S * 0.036 * bsc), 0, Math.PI * 2); x.fill(); x.stroke();
    if (ring > 0.22) { x.save(); x.globalAlpha = Math.min(1, ring); x.strokeStyle = holy ? '#fff6c0' : '#ffffff'; x.lineCap = 'round'; x.lineWidth = Math.max(1.2, S * 0.03); [-1, 1].forEach(function (sd) { for (var j = 0; j < 2; j++) { var rr = S * (0.26 + tau * 0.5 + j * 0.1) * bsc; x.beginPath(); x.arc(mx, my + S * 0.08, rr, sd > 0 ? -0.55 : Math.PI - 0.55, sd > 0 ? 0.55 : Math.PI + 0.55); x.stroke(); } }); x.restore(); }
    if (U && q.an.halo) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.45 + 0.25 * Math.sin(time * 2.6) + Math.min(0.3, ring * 0.3); x.drawImage(glowSpr('#fff0a0', 48), X + q.an.halo[0] * S - S * 0.3, Y + q.an.halo[1] * S - S * 0.3, S * 0.6, S * 0.6); x.restore(); }
  },
  // 조폐소: 굴뚝에서 솜구름이 피어오르고 톱니바퀴(금고는 손잡이)가 돌고, 금화가 지붕 위로 튀어 올라 빙글 돎
  mint: function (x, t, X, Y, S, time, info, q) {
    var an = q.an, i, ph, d;
    if (an.chim) { var pf = softSpr('#fff6ee', 32); for (i = 0; i < 3; i++) { ph = (time * 0.45 + i / 3 + q.id * 0.1) % 1; d = S * (0.1 + ph * 0.15); x.globalAlpha = 0.9 * (1 - ph); x.drawImage(pf, X + an.chim[0] * S + Math.sin(ph * 5 + i) * S * 0.035 + ph * S * 0.07 - d / 2, Y + an.chim[1] * S - ph * S * 0.36 - d / 2, d, d); } x.globalAlpha = 1; }
    [an.gear, an.wheel].forEach(function (gr, j) {
      if (!gr) return; var r = gr[2] * S, gs = partCached((j ? 'whl:' : 'gear:') + Math.round(r * 4), r * 2.6, r * 2.6, r * 1.3, r * 1.3, function (cx) {
        TW_IW = Math.max(1, S * 0.016); var m = r * 1.3, s = shp(), n = j ? 4 : 8, k;
        if (j) { cx.lineCap = 'round'; for (k = 0; k < n; k++) { cx.beginPath(); cx.moveTo(m, m); cx.lineTo(m + Math.cos(k * Math.PI / 2) * r, m + Math.sin(k * Math.PI / 2) * r); twStrokeInk(cx, TC.gold, Math.max(1.2, r * 0.26)); u6E(cx, m + Math.cos(k * Math.PI / 2) * r, m + Math.sin(k * Math.PI / 2) * r, r * 0.2, r * 0.2, TC.gold, { hi: 0.6, iw: 0.6 }); } u6E(cx, m, m, r * 0.36, r * 0.36, TC.pink, { hi: 0.45, iw: 0.8 }); return; }
        for (k = 0; k < n * 4; k++) { var a = k / (n * 4) * Math.PI * 2, rr = (k % 4 < 2) ? r : r * 0.74; if (k) s.p.lineTo(m + Math.cos(a) * rr, m + Math.sin(a) * rr); else s.p.moveTo(m + Math.cos(a) * rr, m + Math.sin(a) * rr); } s.p.closePath(); s.ext(m - r, m - r); s.ext(m + r, m + r);
        twFill(cx, s, TC.gold, { hi: 0.6, lo: 0.25 }); twInk(cx, s, TC.gold, TW_IW); u6E(cx, m, m, r * 0.3, r * 0.3, '#fff6c8', { hi: 0.3, ic: TC.gold, iw: 0.7 });
      });
      x.save(); x.translate(X + gr[0] * S, Y + gr[1] * S); x.rotate(time * (j ? 0.9 : 1.6) + q.id); x.drawImage(gs.c, -gs.ax, -gs.ay); x.restore();
    });
    var cp = an.coin || [0, -1.05], cph = ((time + q.id * 0.7) % 3.0) / 0.9;
    if (cph < 1) {
      var cs = partCached('coin:' + q.R, S * 0.24, S * 0.24, S * 0.12, S * 0.12, function (cx) { TW_IW = Math.max(1, S * 0.016); u6E(cx, S * 0.12, S * 0.12, S * 0.085, S * 0.085, TC.gold, { hi: 0.6, iw: 1.1 }); twStar(cx, S * 0.12, S * 0.12, S * 0.045, '#fff3b0', 0); });
      x.save(); x.translate(X + cp[0] * S, Y + cp[1] * S - Math.sin(cph * Math.PI) * S * 0.32); x.scale(Math.max(0.18, Math.abs(Math.cos(cph * Math.PI * 3))) * (q.U ? 1.3 : 1), q.U ? 1.3 : 1); x.drawImage(cs.c, -cs.ax, -cs.ay); x.restore();
    }
    if (Math.sin(time * 1.7 + q.id) > 0.9) { x.save(); x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr('#ffe08a', 32), q.mx - S * 0.1, q.my - S * 0.1 + S * 0.3, S * 0.2, S * 0.2); x.restore(); }
    if (an.pile) { // 금화 더미 반짝임
      var tw = partCached('twk6:' + q.R, S * 0.2, S * 0.2, S * 0.1, S * 0.1, function (cx) { twTwinkle(cx, S * 0.1, S * 0.1, S * 0.09, 1); });
      for (i = 0; i < 3; i++) { ph = time * 1.3 + i * 2.1 + q.id; var v = Math.sin(ph); if (v < 0.2) continue; var cyc = Math.floor(ph / 6.2832) * 5.3 + i * 3.1; d = (v - 0.2) / 0.8; x.globalAlpha = d; x.drawImage(tw.c, X + an.pile[0] * S + (twSkHash(cyc) - 0.5) * an.pile[2] * 2 * S - tw.ax * d, Y + an.pile[1] * S + (twSkHash(cyc + 1.3) - 0.5) * S * 0.3 - tw.ay * d, tw.c.width * d, tw.c.height * d); }
      x.globalAlpha = 1;
    }
    if (an.eye) { var bl = (time * 0.7 + q.id) % 4; if (bl < 0.5) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.sin(bl / 0.5 * Math.PI); x.drawImage(glowSpr('#fff0a0', 32), X + an.eye[0] * S - S * 0.14 - S * 0.04, Y + an.eye[1] * S - S * 0.14, S * 0.28, S * 0.28); x.restore(); } }
  }
};
// ===================== 탑 스킨 (상점에서 보석으로 사서 장착, v1.2) =====================
// SAVE.skin.tower: 'base'(기본) | 'berry'(딸기 포탑) | 'star'(별빛 포탑). SAVE나 SAVE.skin이 없거나 모르는 값이면 'base'
// 원리: 기본 그림 코드는 그대로 두고, 스킨일 때만 TW_SK 가 켜져
//  (1) 칠 도구(twFill, twCylG, twInk, twSh, twLt, twStar...)가 TW_SK.map 으로 색을 바꿔 칠하고
//  (2) 몸체(twCyl stone), 지붕(twRoof), 성가퀴 모자, 깃발 꼭지, 받침, 보석이 스킨 무늬로 그려진다.
// 기본 스킨은 TW_SK = null 이라 모든 고리가 그냥 지나감 → 예전 그림과 픽셀까지 같음. 캐시 키도 기본은 예전 그대로
// 쓰는 법: 장착을 바꾼 뒤 twSkinReset() (탑 그림, 메뉴 아이콘 캐시 비움), 상점 카드 그림은 twSkinPreview('berry', 96)
var TW_SKF = null; // twSkinPreview 가 잠깐 쓰는 강제 스킨 id
function twK(c) { return TW_SK.map[c] || c; }
function twSkinId() { var id = TW_SKF || (typeof SAVE !== 'undefined' && SAVE && SAVE.skin && SAVE.skin.tower); return id && TW_SKINS[id] ? id : 'base'; }
// 스킨을 바꾼 뒤 부름: 탑 몸체, 머리, 움직이는 부분 그림과 메뉴용 탑 아이콘(ui_art.js EN_ICON의 't…' 키) 캐시를 비움
function twSkinReset() {
  TOWER_SPR = {}; HEAD_SPR = {}; PART_C = {}; TW_STAMP = {};
  if (typeof EN_ICON !== 'undefined' && EN_ICON) for (var k in EN_ICON) if (/^t[a-z]+[1-6][01]\d+$/.test(k) && TOWERS[k.replace(/^t([a-z]+)[1-6][01]\d+$/, '$1')]) delete EN_ICON[k];
}
// 상점 카드용: 그 스킨의 대표 탑을 그린 px x px 캔버스(투명 바탕). 장착 상태는 안 바꿈. 기본 대표: 궁수탑 3단계
function twSkinPreview(id, px, type, L, B) {
  var f0 = TW_SKF; TW_SKF = TW_SKINS[id] ? id : 'base';
  try { return towerIcon(type || 'archer', L || 3, B || 0, px || 96); } finally { TW_SKF = f0; }
}
// 벽돌 무늬가 쓰던 만큼 난수를 똑같이 소비 (스킨에서도 뒤에 그리는 수정 길이 같은 모양이 기본과 같게)
function twBrickBurn(rx, h, rows, cols, rnd) {
  var rh = h / rows;
  for (var r2 = 0; r2 < rows; r2++) for (var c = 0; c < cols; c++) {
    if (rnd() > 0.62) continue;
    var u = (c + (r2 % 2) * 0.5 + 0.5) / cols; if (u >= 1) u -= 1;
    if (rx * Math.sin(Math.PI * (1 - u)) * Math.PI / cols * 0.74 < 2 || rh * 0.58 < 1.2) continue;
    rnd();
  }
}
// ---------- 스킨 몸체: 세로 색 넘김 + 원통 음영 + 무늬(딸기 씨 / 별, 반짝 점) ----------
function twSkBody(x, cx, topY, rx, ry, h, col, rnd, o) {
  var K = TW_SK, P = K.body;
  var s = shp(); s.p.moveTo(cx - rx, topY); s.p.ellipse(cx, topY, rx, ry, 0, Math.PI, 0, true); s.p.lineTo(cx + rx, topY + h); s.p.ellipse(cx, topY + h, rx, ry, 0, 0, Math.PI, false); s.p.closePath();
  s.ext(cx - rx, topY); s.ext(cx + rx, topY + h + ry);
  var gv = x.createLinearGradient(0, topY - ry * 0.3, 0, topY + h + ry);
  gv.addColorStop(0, P.top); gv.addColorStop(0.5, P.c); gv.addColorStop(1, P.low);
  x.fillStyle = gv; x.fill(s.p);
  x.save(); x.clip(s.p);
  twSkCylShade(x, cx, rx, topY - ry, h + ry * 2.2);
  twSkMarks(x, cx, topY, rx, ry, h, Math.round(cx * 7 + topY * 13 + rx * 31 + h * 17));
  var gb = x.createLinearGradient(0, topY + h - ry * 0.4, 0, topY + h + ry); gb.addColorStop(0, rgba(P.low, 0)); gb.addColorStop(1, rgba(twSh(P.low, 0.45), 0.35)); x.fillStyle = gb; x.fillRect(cx - rx, topY + h - ry, rx * 2, ry * 2.2);
  x.restore();
  if (o.stone && rnd) twBrickBurn(rx, h, o.rows || Math.max(2, Math.round(h / (rx * 0.36))), o.cols || 5, rnd);
  if (o.bands) o.bands.forEach(function (b) {
    var Y = topY + h * b, bh = Math.max(rx * 0.16, 2), bc = K.band(o.bandCol || TC.gold);
    var bs = shp(); bs.p.moveTo(cx - rx, Y); bs.p.ellipse(cx, Y, rx, ry, 0, Math.PI, 0, true); bs.p.lineTo(cx + rx, Y + bh); bs.p.ellipse(cx, Y + bh, rx, ry, 0, 0, Math.PI, false); bs.p.closePath(); bs.ext(cx - rx, Y); bs.ext(cx + rx, Y + bh + ry);
    twCylG(x, bs, bc, { hi: 0.55 }); twInk(x, bs, bc, TW_IW * 0.7);
  });
  twInk(x, s, P.ink);
  var t = shp().ell(cx, topY, rx, ry);
  if (!o.noTop) { twFill(x, t, P.face, { hi: 0.3, lo: 0.12 }); twInk(x, t, P.ink, TW_IW * 0.85); }
  if (K.gloss && h > rx * 0.45) twSkGloss(x, cx, topY, rx, ry, h);
  if (K.collar && h > rx * 0.5) K.collar(x, cx, topY, rx, ry, h);
  return { side: s, top: t };
}
// 딸기 몸체 물광: 왼쪽에 길쭉한 반짝 + 작은 점
function twSkGloss(x, cx, topY, rx, ry, h) {
  var gx = cx - rx * 0.58, gy = topY + ry * 0.55 + h * 0.36, gh = Math.min(h * 0.3, rx * 0.75);
  x.save(); x.globalAlpha = 0.5; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(gx, gy, Math.max(0.8, rx * 0.075), gh, 0.08, 0, Math.PI * 2); x.fill();
  x.globalAlpha = 0.65; x.beginPath(); x.arc(gx + rx * 0.02, gy + gh + rx * 0.13, Math.max(0.6, rx * 0.05), 0, Math.PI * 2); x.fill(); x.restore();
}
// 원통 음영 덧칠: 왼쪽 반짝, 오른쪽 자두빛 그늘 (twCylG와 같은 느낌)
function twSkCylShade(x, cx, rx, y, hh) {
  var g = x.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, 'rgba(94,58,124,0.16)'); g.addColorStop(0.16, 'rgba(255,250,242,0.42)'); g.addColorStop(0.34, 'rgba(255,250,242,0.12)');
  g.addColorStop(0.62, 'rgba(255,250,242,0)'); g.addColorStop(0.9, 'rgba(94,58,124,0.3)'); g.addColorStop(1, 'rgba(94,58,124,0.2)');
  x.fillStyle = g; x.fillRect(cx - rx, y, rx * 2, hh);
}
// 원통 곡면을 따라 엇갈린 격자에 무늬 하나씩 (가장자리는 좁게, 오른쪽 그늘 쪽은 흐리게)
function twSkMarks(x, cx, topY, rx, ry, h, seed) {
  var K = TW_SK, r = rngOf(seed), sz = TW_SZ, step = Math.max(sz * K.markStep, 3.2), rows = Math.max(1, Math.round(h / step)), cols = Math.max(4, Math.round(rx * 2 / step)), rh = h / rows;
  for (var i = 0; i < rows; i++) {
    var off = (i % 2) * 0.5;
    for (var c = 0; c < cols; c++) {
      var u = (c + off + 0.5) / cols; if (u >= 1) continue;
      var th = Math.PI * (1 - u), sn = Math.sin(th);
      if (sn < 0.28) continue;
      var px = cx + Math.cos(th) * rx, py = topY + rh * (i + 0.5) + sn * ry + (r() - 0.5) * rh * 0.25;
      K.mark(x, px, py, sz, sn, 1 - u * 0.45, r);
    }
  }
}
// 원뿔(지붕) 위 무늬
function twSkConeMarks(x, cx, ap, baseY, rx, ry, seed) {
  var K = TW_SK, r = rngOf(seed), sz = TW_SZ, h = baseY - ap, step = Math.max(sz * K.markStep * 1.05, 3.2), rows = Math.max(2, Math.round(h / step));
  for (var i = 1; i <= rows; i++) {
    var t = (i - 0.35) / rows, cols = Math.max(2, Math.round(rx * 2 * t / step));
    for (var c = 0; c < cols; c++) {
      var u = (c + (i % 2) * 0.5 + 0.5) / cols; if (u >= 1) continue;
      var th = Math.PI * (1 - u), sn = Math.sin(th);
      if (sn < 0.3) continue;
      K.mark(x, cx + Math.cos(th) * rx * t, ap + h * t + sn * ry * t, sz * 0.92, sn, 1 - u * 0.4, r);
    }
  }
}
// ---------- 딸기 조각 ----------
// 딸기 씨: 노란 물방울 + 살짝 파인 그늘 + 반짝
// 무늬 도장: 작은 그림을 한 번 그려 두고 찍음 (씨, 별가루가 많아도 그림 만드는 시간이 크게 안 늘게)
var TW_STAMP = {};
function twStamp(key, d, fn) { var k = key + ':' + Math.round(d * 4), c = TW_STAMP[k]; if (!c) { var n = Math.ceil(d * 2.6) + 2; c = mkC(n, n); fn(cx2(c), n / 2, d); TW_STAMP[k] = c; } return c; }
// 딸기 씨: 노란 물방울 + 살짝 파인 그늘 + 반짝 (원통 가장자리 쪽은 가로로 좁게, 그늘 쪽은 흐리게)
function twSkSeed(x, px, py, sz, sn, a, r) {
  if (r() < 0.12) return;
  var L = Math.max(1.3, sz * 0.034), st = twStamp('seed', L, function (c, m, d) {
    var w = d * 0.62; c.globalAlpha = 0.3; c.fillStyle = '#b8193f'; c.beginPath(); c.ellipse(m + w * 0.25, m + d * 0.22, w * 1.15, d * 1.05, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1; c.fillStyle = '#ffe680'; c.beginPath(); c.moveTo(m, m - d); c.quadraticCurveTo(m + w * 1.1, m + d * 0.2, m, m + d * 0.75); c.quadraticCurveTo(m - w * 1.1, m + d * 0.2, m, m - d); c.fill();
    if (d > 2.2) { c.globalAlpha = 0.85; c.fillStyle = '#fffbe6'; c.beginPath(); c.arc(m - w * 0.25, m - d * 0.2, Math.max(0.5, d * 0.22), 0, Math.PI * 2); c.fill(); }
  }), n = st.width, fx = Math.max(0.45, sn);
  x.globalAlpha = 0.45 + 0.55 * a; x.drawImage(st, px - n * fx / 2, py - n / 2, n * fx, n); x.globalAlpha = 1;
}
// 잎 하나: 밑동(bx,by)에서 ang 방향으로 len 길이, 뾰족한 끝 + 가운데 잎맥
function twSkLeaf(x, bx, by, ang, len, wid, col) {
  var dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, tx = bx + dx * len, ty = by + dy * len, mx = bx + dx * len * 0.45, my = by + dy * len * 0.45;
  var s = shp(), p = s.p;
  p.moveTo(bx + nx * wid * 0.22, by + ny * wid * 0.22); p.quadraticCurveTo(mx + nx * wid * 0.95, my + ny * wid * 0.95, tx, ty); p.quadraticCurveTo(mx - nx * wid * 0.95, my - ny * wid * 0.95, bx - nx * wid * 0.22, by - ny * wid * 0.22); p.closePath();
  s.ext(Math.min(bx, tx) - wid, Math.min(by, ty) - wid); s.ext(Math.max(bx, tx) + wid, Math.max(by, ty) + wid);
  twFill(x, s, col, { hi: 0.42, lo: 0.24 }); twInk(x, s, col, TW_IW * 0.75);
  if (len > 5) { x.save(); x.strokeStyle = rgba(twLt(col, 0.6), 0.85); x.lineWidth = Math.max(0.6, wid * 0.14); x.lineCap = 'round'; x.beginPath(); x.moveTo(bx + dx * len * 0.12, by + dy * len * 0.12); x.lineTo(bx + dx * len * 0.66, by + dy * len * 0.66); x.stroke(); x.restore(); }
}
// 딸기 꽃받침: 몸체 윗가장자리에 초록 잎이 빙 둘러 늘어짐 (뒤쪽 잎 먼저, 앞쪽 잎 나중)
function twSkCalyx(x, cx, topY, rx, ry, h) {
  var K = TW_SK, n = rx > TW_SZ * 0.3 ? 9 : 8, len = Math.min(h * 0.34, rx * 0.5, TW_SZ * 0.15), lv = [];
  for (var k = 0; k < n; k++) { var th = (k + 0.5) / n * Math.PI * 2 + 0.17; lv.push(th); }
  lv.sort(function (a, b) { return Math.sin(a) - Math.sin(b); });
  lv.forEach(function (th, i) {
    var sn = Math.sin(th), cs = Math.cos(th), bx = cx + cs * rx * 0.86, by = topY + sn * ry * 0.86;
    var ang = Math.atan2(sn * ry / rx + (sn > 0 ? 0.9 : 0.35), cs), L = len * (sn > 0 ? 1 : 0.62), W = len * (sn > 0 ? 0.62 : 0.5) * (0.6 + 0.4 * Math.abs(sn));
    twSkLeaf(x, bx, by, ang, L, W, sn > 0 ? K.leaf : twSh(K.leaf, 0.12));
  });
}
// 지붕 꼭대기 딸기 꼭지: 잎 다섯 장이 지붕을 덮고 꼭지 줄기가 톡
function twSkCrown(x, cx, cy, r) {
  var K = TW_SK;
  [[3.0, 0.82], [0.14, 0.82], [2.35, 1], [0.79, 1], [1.57, 0.92]].forEach(function (a) { twSkLeaf(x, cx, cy, a[0], r * a[1], r * 0.62, a[1] < 0.9 ? twSh(K.leaf, 0.1) : K.leaf); });
  twLeg(x, cx - r * 0.02, cy + r * 0.06, cx + r * 0.2, cy - r * 0.62, r * 0.26, r * 0.17, K.leafD);
  twShine(x, cx + r * 0.1, cy - r * 0.42, r * 0.05, r * 0.1, 0.6, 0.3);
}
// 작은 딸기(깃대 꼭지, 방울 대신)
function twSkBerry(x, cx, cy, r) {
  var K = TW_SK, s = shp(), p = s.p;
  p.moveTo(cx, cy + r * 1.15); p.bezierCurveTo(cx - r * 1.25, cy + r * 0.5, cx - r * 1.1, cy - r * 0.85, cx, cy - r * 0.7); p.bezierCurveTo(cx + r * 1.1, cy - r * 0.85, cx + r * 1.25, cy + r * 0.5, cx, cy + r * 1.15); p.closePath();
  s.ext(cx - r * 1.1, cy - r * 0.85); s.ext(cx + r * 1.1, cy + r * 1.15);
  twFill(x, s, K.body.c, { hi: 0.38, lo: 0.22 }); twInk(x, s, K.body.c, Math.max(0.6, TW_IW * 0.55));
  if (r > 1.6) { x.fillStyle = '#ffe680'; [[-0.4, 0.1], [0.38, 0.05], [0, 0.55], [-0.05, -0.15]].forEach(function (q) { x.beginPath(); x.arc(cx + q[0] * r, cy + q[1] * r, Math.max(0.45, r * 0.13), 0, Math.PI * 2); x.fill(); }); }
  [-1, 1].forEach(function (sd) { var lf = shp().ell(cx + sd * r * 0.42, cy - r * 0.72, r * 0.48, r * 0.24, sd * 0.45); twFill(x, lf, K.leaf, { hi: 0.4 }); });
  x.fillStyle = K.leafD; x.beginPath(); x.ellipse(cx, cy - r * 0.95, r * 0.14, r * 0.3, 0, 0, Math.PI * 2); x.fill();
}
// ---------- 별빛 조각 ----------
// 금별 + 은은한 빛
function twSkStarTip(x, cx, cy, r, glow) {
  x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy, r * 2.6, glow || '#ffe9a0', 0.55); x.restore();
  twStar(x, cx, cy, r, '#ffd65a');
  twShine(x, cx - r * 0.22, cy - r * 0.28, r * 0.16, r * 0.1, 0.9);
  twTwinkle(x, cx + r * 0.8, cy - r * 0.75, r * 0.42, 0.95);
}
// 밤하늘 무늬: 금별, 반짝, 별가루 점
function twSkStarMark(x, px, py, sz, sn, a, r) {
  var q = r();
  if (q < 0.36) return;
  var s = Math.max(1.4, sz * 0.03) * (0.7 + r() * 0.6), st;
  if (q < 0.64) { var gd = r() < 0.3; st = twStamp(gd ? 'dotG' : 'dotW', Math.max(0.5, s * 0.32), function (c, m, d) { c.fillStyle = gd ? '#ffe9a0' : '#ffffff'; c.beginPath(); c.arc(m, m, d, 0, Math.PI * 2); c.fill(); }); x.globalAlpha = (0.55 + r() * 0.4) * a; }
  else if (q < 0.8) { st = twStamp('twk', s * 1.15, function (c, m, d) { twTwinkle(c, m, m, d, 1); }); x.globalAlpha = 0.95 * a; }
  else { st = twStamp('star', s * 1.25, function (c, m, d) { var p = shp(); twStarP(p.p, m, m, d, d * 0.44); c.fillStyle = '#ffd65a'; c.fill(p.p); c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(m - d * 0.12, m - d * 0.12, d * 0.18, 0, Math.PI * 2); c.fill(); }); x.globalAlpha = 0.5 + 0.5 * a; }
  var n = st.width; x.drawImage(st, px - n / 2, py - n / 2); x.globalAlpha = 1;
}
// 별빛 몸체 윗가장자리 금테
function twSkGoldRim(x, cx, topY, rx, ry) {
  x.save(); x.lineCap = 'round'; x.beginPath(); x.ellipse(cx, topY + ry * 0.02, rx * 0.985, ry * 0.985, 0, 0.12, Math.PI - 0.12);
  x.strokeStyle = twInkC(TC.gold); x.lineWidth = Math.max(1.2, TW_SZ * 0.026) + TW_IW * 1.1; x.stroke(); x.strokeStyle = TC.gold; x.lineWidth = Math.max(1.2, TW_SZ * 0.026); x.stroke();
  x.strokeStyle = 'rgba(255,250,220,0.9)'; x.lineWidth = Math.max(0.6, TW_SZ * 0.008); x.beginPath(); x.ellipse(cx, topY + ry * 0.02 - TW_SZ * 0.004, rx * 0.985, ry * 0.985, 0, 0.5, 1.3); x.stroke();
  x.restore();
}
// 반짝임(움직이는 부분, 매 프레임): 탑 주변에서 작은 빛이 켜졌다 꺼짐. 느린 폰 모드(RD.lowFx)에서는 끔
function twSkHash(n) { var v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); }
function twSkAnim(x, t, X, Y, S, time, info) {
  var A = TW_SK.anim; if (typeof RD !== 'undefined' && RD && RD.lowFx) return;
  var m0 = (info.mounts || [[0, -1]])[0], top = Y + m0[1] * S - S * 0.12, id = (t.id || 0) * 1.37, R = Math.round(S);
  for (var i = 0; i < A.n; i++) {
    var ph = time * A.sp + i * 2.4 + id, v = Math.sin(ph); if (v < 0.3) continue;
    var cyc = Math.floor(ph / 6.2832) * 7.3 + i * 3.1 + id, k = (v - 0.3) / 0.7, col = A.cols[i % A.cols.length];
    var px = X + (twSkHash(cyc) - 0.5) * S * A.w, py = lerp(top, Y - S * 0.28, twSkHash(cyc + 1.7));
    var sp = partCached('twk' + col + ':' + R, S * 0.3, S * 0.3, S * 0.15, S * 0.15, function (cx) {
      cx.globalCompositeOperation = 'lighter'; glowAt(cx, S * 0.15, S * 0.15, S * 0.13, col, 0.55); cx.globalCompositeOperation = 'source-over';
      var r = S * 0.1, c0 = S * 0.15; cx.fillStyle = col; cx.beginPath(); cx.moveTo(c0, c0 - r); cx.quadraticCurveTo(c0 + r * 0.16, c0 - r * 0.16, c0 + r, c0); cx.quadraticCurveTo(c0 + r * 0.16, c0 + r * 0.16, c0, c0 + r); cx.quadraticCurveTo(c0 - r * 0.16, c0 + r * 0.16, c0 - r, c0); cx.quadraticCurveTo(c0 - r * 0.16, c0 - r * 0.16, c0, c0 - r); cx.fill();
      cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(c0, c0, r * 0.18, 0, Math.PI * 2); cx.fill();
    });
    var d = sp.c.width * k; x.globalAlpha = Math.min(1, k * 1.3); x.drawImage(sp.c, px - d / 2, py - d / 2, d, d); x.globalAlpha = 1;
  }
}
// 갈래 단계 보석 → 빛나는 금별 보석
function twSkStarGem(x, cx, cy, r, col) {
  x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy, r * 3.4, col, 0.55); x.restore();
  twStar(x, cx, cy - r * 0.15, r * 1.25, '#ffd65a');
  twShine(x, cx - r * 0.28, cy - r * 0.5, r * 0.2, r * 0.12, 0.9);
  twTwinkle(x, cx + r * 0.85, cy - r * 0.9, r * 0.5, 0.95);
}
function twSkStarEmblem(x, cx, cy, r) { twStar(x, cx, cy, r * 1.05, '#ffd65a'); twShine(x, cx - r * 0.25, cy - r * 0.3, r * 0.16, r * 0.1, 0.8); }
// ---------- 스킨 지붕 (고깔 모양은 기본과 같음) ----------
function twSkRoof(x, cx, baseY, rx, ry, h, col, o) {
  var K = TW_SK, R = K.roof(col), ap = baseY - h, s = shp(), p = s.p;
  p.moveTo(cx - rx, baseY); p.quadraticCurveTo(cx - rx * 0.68, baseY - h * 0.52, cx, ap); p.quadraticCurveTo(cx + rx * 0.68, baseY - h * 0.52, cx + rx, baseY);
  p.ellipse(cx, baseY, rx, ry, 0, 0, Math.PI, false); p.closePath(); s.ext(cx - rx, ap); s.ext(cx + rx, baseY + ry);
  var gv = x.createLinearGradient(0, ap, 0, baseY + ry); gv.addColorStop(0, R.top); gv.addColorStop(0.6, R.c); gv.addColorStop(1, R.low);
  x.fillStyle = gv; x.fill(p);
  x.save(); x.clip(p);
  var g = x.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, 'rgba(255,250,242,0.18)'); g.addColorStop(0.3, 'rgba(255,250,242,0.36)'); g.addColorStop(0.62, 'rgba(255,250,242,0)'); g.addColorStop(1, 'rgba(94,58,124,0.32)');
  x.fillStyle = g; x.fillRect(cx - rx, ap - 2, rx * 2, h + ry + 4);
  if (R.stripe) {
    x.fillStyle = R.stripe; var n = 6;
    for (var k = 0; k < n; k += 2) {
      var t0 = -Math.cos(k / n * Math.PI), t1 = -Math.cos((k + 1) / n * Math.PI);
      x.beginPath(); x.moveTo(cx, ap - 2);
      for (var q = 0; q <= 8; q++) { var tt = lerp(t0, t1, q / 8); x.lineTo(cx + rx * tt * 1.02, baseY + ry * Math.sqrt(Math.max(0, 1 - tt * tt)) + 2); }
      x.closePath(); x.fill();
    }
  }
  twSkConeMarks(x, cx, ap, baseY, rx, ry, Math.round(cx * 5 + baseY * 11 + rx * 3));
  var gs = x.createLinearGradient(0, baseY - h * 0.2, 0, baseY + ry); gs.addColorStop(0, rgba(R.low, 0)); gs.addColorStop(1, rgba(twSh(R.low, 0.4), 0.3)); x.fillStyle = gs; x.fillRect(cx - rx, baseY - h * 0.2, rx * 2, h * 0.2 + ry);
  x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = Math.max(1, rx * 0.08); x.lineCap = 'round';
  x.beginPath(); x.moveTo(cx - rx * 0.12, ap + h * 0.16); x.quadraticCurveTo(cx - rx * 0.42, baseY - h * 0.45, cx - rx * 0.58, baseY - h * 0.08); x.stroke();
  x.restore();
  twInk(x, s, R.ink);
  var tc = R.trim || (o.trim ? twK(o.trim) : null);
  if (tc) {
    x.save(); x.lineCap = 'round'; x.beginPath(); x.ellipse(cx, baseY, rx * 0.98, ry * 0.98, 0, 0.08, Math.PI - 0.08);
    x.strokeStyle = twInkC(tc); x.lineWidth = Math.max(1.5, rx * 0.1) + TW_IW * 1.3; x.stroke(); x.strokeStyle = tc; x.lineWidth = Math.max(1.5, rx * 0.1); x.stroke(); x.restore();
    if (K.piping) K.piping(x, cx, baseY, rx, ry, tc);
  }
  K.apex(x, cx, ap, rx, !!o.ball);
  return s;
}
// 돈탑(집) 지붕: 앞 삼각 + 옆면, 모양은 기본과 같고 색과 무늬만 스킨
function twSkHouseRoof(x, roof, roofS, rc, apx, apy, xl, xr, by, sz, crown) {
  var K = TW_SK, R = K.roof(rc);
  twFill(x, roofS, R.side || twSh(R.c, 0.16), { hi: 0.12 }); twInk(x, roofS, R.ink);
  var gv = x.createLinearGradient(0, apy, 0, by); gv.addColorStop(0, R.top); gv.addColorStop(0.6, R.c); gv.addColorStop(1, R.low); x.fillStyle = gv; x.fill(roof.p);
  x.save(); x.clip(roof.p);
  var g = x.createLinearGradient(xl, 0, xr, 0); g.addColorStop(0, 'rgba(255,250,242,0.3)'); g.addColorStop(0.45, 'rgba(255,250,242,0.06)'); g.addColorStop(1, 'rgba(94,58,124,0.22)'); x.fillStyle = g; x.fillRect(xl, apy, xr - xl, by - apy + 2);
  var r = rngOf(Math.round(apx * 3 + apy * 7)), hh = by - apy, step = Math.max(sz * K.markStep * 1.05, 3.2), rows = Math.max(2, Math.round(hh / step));
  for (var i = 1; i <= rows; i++) { var t = (i - 0.3) / rows, ww = (xr - xl) * t, cols = Math.max(1, Math.round(ww / step)); for (var c = 0; c < cols; c++) K.mark(x, apx - ww / 2 + (c + 0.5 + (i % 2 ? 0.25 : -0.25)) * ww / cols, apy + hh * t, sz * 0.92, 1, 1 - (c + 0.5) / cols * 0.4, r); }
  x.restore();
  twInk(x, roof, R.ink);
  var tc = R.trim || '#fff6ee';
  x.save(); x.lineCap = 'round'; x.beginPath(); x.moveTo(xl + sz * 0.02, by - sz * 0.005); x.lineTo(xr - sz * 0.02, by - sz * 0.005);
  x.strokeStyle = twInkC(tc); x.lineWidth = Math.max(1.5, sz * 0.04) + TW_IW * 1.3; x.stroke(); x.strokeStyle = tc; x.lineWidth = Math.max(1.5, sz * 0.04); x.stroke(); x.restore();
  if (crown) K.apex(x, apx, apy, sz * 0.36, true);
}
// 돈탑 벽 장식
function twSkWall(x, x0, y0, w, h) { var K = TW_SK; if (K.wall) K.wall(x, x0, y0, w, h); }
// 마법탑 모자 무늬(모자 모양 안에 잘라 그림)
function twSkHat(x, gx, by, top, w0, h) {
  var K = TW_SK, P = K.body, g = x.createLinearGradient(0, top, 0, by);
  g.addColorStop(0, rgba(P.top, 0.55)); g.addColorStop(0.6, rgba(P.top, 0)); x.fillStyle = g; x.fillRect(gx - w0 - 2, top - 2, w0 * 2 + 4, by - top + 4);
  var r = rngOf(Math.round(gx * 3 + by * 5)), step = Math.max(TW_SZ * K.markStep, 3.2), rows = Math.max(2, Math.round((by - top) / step));
  for (var i = 1; i < rows; i++) { var t = i / rows, ww = w0 * Math.pow(t, 1.6) * 2, cols = Math.max(1, Math.round(ww / step)); for (var c = 0; c < cols; c++) K.mark(x, gx - ww / 2 + (c + 0.5 + (i % 2 ? 0.2 : -0.2)) * ww / cols, top + (by - top) * t, TW_SZ * 0.9, 1, 1 - (c + 0.5) / cols * 0.4, r); }
  if (K.moon) twSkMoon(x, gx - w0 * 0.2, by - (by - top) * 0.3, Math.max(2, w0 * 0.2));
}
// 금빛 초승달 (별빛 마법 모자)
function twSkMoon(x, cx, cy, r) {
  var st = twStamp('moon', r, function (c, m, d) {
    c.fillStyle = '#ffd65a'; c.beginPath(); c.arc(m, m, d, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(m + d * 0.45, m - d * 0.3, d * 0.86, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(255,250,220,0.9)'; c.beginPath(); c.arc(m - d * 0.55, m + d * 0.05, d * 0.14, 0, Math.PI * 2); c.fill();
  }), n = st.width;
  x.drawImage(st, cx - n / 2, cy - n / 2);
}
// ---------- 스킨 받침(무대) ----------
function twSkStageBack(xb, gx, gy, sz, L, B, rnd) {
  var K = TW_SK, St = K.stage, rx = sz * 0.52, ry = rx * 0.56, ph = stagePh(L) * sz;
  if (K.aura) { xb.save(); xb.translate(gx, gy - ph * 0.5); xb.scale(1, 0.56); var ga = xb.createRadialGradient(0, 0, rx * 0.5, 0, 0, rx * 1.25); ga.addColorStop(0, rgba(K.aura, L === 1 ? 0.2 : 0.38)); ga.addColorStop(1, rgba(K.aura, 0)); xb.fillStyle = ga; xb.beginPath(); xb.arc(0, 0, rx * 1.25, 0, Math.PI * 2); xb.fill(); xb.restore(); }
  if (L === 1) { // 1단계 바닥: 스킨 빛 바닥 + 뿌린 무늬(딸기: 스프링클, 별빛: 별가루)
    var d = shp().ell(gx, gy, rx * 0.9, ry * 0.86), g = xb.createRadialGradient(gx - rx * 0.15, gy - ry * 0.2, 0, gx, gy, rx * 0.9);
    g.addColorStop(0, St.g0); g.addColorStop(0.75, St.g1); g.addColorStop(1, rgba(St.g1, 0));
    xb.fillStyle = g; xb.fill(d.p);
    xb.save(); xb.clip(d.p); for (var i = 0; i < 9; i++) { var px = gx + (rnd() - 0.5) * rx * 1.4, py = gy + (rnd() - 0.5) * ry * 1.2; K.sprinkle(xb, px, py, sz, rnd(), i); } xb.restore();
    return;
  }
  var side = L >= 4 ? St.br[B] : L === 3 ? St.side3 : St.side, top = L >= 4 ? St.brTop[B] : St.top;
  if (L >= 6) { twStage6Base(xb, gx, gy, sz, B, rnd); twCyl(xb, gx, gy - ph, rx, ry, ph * 0.56, side, rnd, { top: top }); }
  else twCyl(xb, gx, gy - ph, rx, ry, ph, side, rnd, { top: top });
  var tp = shp().ell(gx, gy - ph, rx * 0.96, ry * 0.96); xb.save(); xb.clip(tp.p); xb.strokeStyle = rgba(twSh(top, 0.4), 0.16); xb.lineWidth = Math.max(0.6, sz * 0.008);
  for (var r = 1; r < 3; r++) { xb.beginPath(); xb.ellipse(gx, gy - ph, rx * r / 3, ry * r / 3, 0, 0, Math.PI * 2); xb.stroke(); }
  xb.restore();
  if (L >= 3) { var tc = L >= 4 ? BRC[B].trim : TC.gold; xb.save(); xb.strokeStyle = twInkC(tc); xb.lineWidth = Math.max(1, sz * 0.028) + TW_IW; xb.beginPath(); xb.ellipse(gx, gy - ph, rx * 0.93, ry * 0.93, 0, 0, Math.PI * 2); xb.stroke(); xb.strokeStyle = tc; xb.lineWidth = Math.max(1, sz * 0.028); xb.stroke(); xb.restore(); }
  K.stageTop(xb, gx, gy - ph, rx, ry, sz, L, B);
  if (L >= 4) [-1, 1].forEach(function (sd) { twPillar(xb, gx + sd * rx * 0.78, gy - ph - ry * 0.5, sz, L, B, rnd, 1); });
}
// 딸기: 생크림 짜기(받침 윗가장자리, 지붕 처마)
function twSkCream(x, cx, cy, rx, ry, n, r, frontOnly) {
  var pts = [], st = twStamp('cream', r, function (c, m, d) {
    var o = shp(); o.p.moveTo(m - d, m + d * 0.3); o.p.bezierCurveTo(m - d * 1.1, m - d * 0.75, m - d * 0.2, m - d * 1.05, m + d * 0.05, m - d * 0.95); o.p.bezierCurveTo(m + d * 0.75, m - d * 0.85, m + d * 1.1, m - d * 0.3, m + d, m + d * 0.3); o.p.quadraticCurveTo(m, m + d * 0.8, m - d, m + d * 0.3); o.p.closePath();
    o.ext(m - d, m - d * 1.05); o.ext(m + d, m + d * 0.75);
    twFill(c, o, '#fffaf5', { hi: 0.6, lo: 0.1 }); twInk(c, o, '#f7cbd3', TW_IW * 0.55);
    c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); c.ellipse(m - d * 0.3, m - d * 0.42, d * 0.26, d * 0.16, -0.5, 0, Math.PI * 2); c.fill();
  }), w = st.width;
  for (var k = 0; k < n; k++) { var th = (k + 0.5) / n * Math.PI * 2, sn = Math.sin(th); if (frontOnly && sn < 0.05) continue; pts.push([cx + Math.cos(th) * rx, cy + sn * ry]); }
  pts.sort(function (a, b) { return a[1] - b[1]; });
  pts.forEach(function (q) { x.drawImage(st, q[0] - w / 2, q[1] - w / 2); });
}
var TW_SKINS = {
  berry: {
    id: 'berry', name: '딸기 포탑',
    body: { c: '#ff5a7a', top: '#ffa2bc', low: '#ee3b62', face: '#ffe0e8', ink: '#f25a7c' },
    leaf: '#5bd078', leafD: '#36a95c', markStep: 0.092, ear: '#5bd078', woodBody: 1, gloss: 1,
    anim: { n: 2, sp: 1.25, w: 0.62, cols: ['#ffffff'] },
    map: {
      '#efd8bb': '#fff3ee', '#dcbc98': '#f1c3c8', '#f0ad62': '#f9cf93', '#c98048': '#e6a365', '#f6c07e': '#fde0b5', '#f0a65e': '#f9cf93',
      '#9d92cc': '#5bd078', '#c9c1ec': '#d2f4d8', '#ff8fc0': '#ff9dbe', '#ff5d9e': '#ff4f74', '#b9a2f0': '#ffc7d6', '#ffb38a': '#ffc1cf',
      '#6fd39a': '#ff6284', '#ff86ba': '#ffa2c2',
      '#a68cff': '#ff5a7a', '#78aaff': '#ff5a7a', '#ff8fcf': '#ff92b4',
      '#7a5ab0': '#ff4f74', '#f6a94c': '#ff8aa3', '#a99ae0': '#ff6f8f', '#8f7ad8': '#f2577d', '#62acf5': '#ff5a7a', '#4f9cf0': '#ef4a70', '#ff7fb4': '#ff9dbe',
      '#9a7ad8': '#ff86a3', '#7a58b8': '#e8628a', '#fff0f6': '#fff3ee', '#c9b8ee': '#ffc7d6', '#e2dcf6': '#fff3ee', '#b8aee0': '#f1c3c8', '#ffd2a6': '#ffe3d6', '#e8a87a': '#f0b4b8'
    },
    flag: { '#ffe066': '#ffb2c8', '#ff8fc0': '#ffaac5' },
    band: function (c) { return c === TC.gold ? '#fff3ee' : twK(c); },
    hatBand: function (c) { return c === TC.gold ? '#fff3ee' : c === TC.pink ? '#fff3ee' : twK(c); },
    hatStar: function (c) { return c; },
    mark: twSkSeed, collar: twSkCalyx,
    roof: function (c) { return { c: '#ff5a7a', top: '#ff9ab5', low: '#ee3b62', ink: '#f25a7c', trim: '#fff6ee' }; },
    piping: function (x, cx, baseY, rx, ry) { twSkCream(x, cx, baseY, rx * 0.97, ry * 0.97, 11, Math.max(1.3, rx * 0.085), true); },
    apex: function (x, cx, ap, rx) { twSkCrown(x, cx, ap + rx * 0.04, rx * 0.36); },
    finial: function (x, px, py, r) { twSkBerry(x, px, py - r * 0.4, r * 1.7); },
    brim: function (x, gx, by, rx, ry) { // 마법탑 모자 챙 → 딸기 꽃받침
      var n = 10; for (var k = 0; k < n; k++) { var th = (k + 0.5) / n * Math.PI * 2 + 0.3, sn = Math.sin(th); if (sn > 0) continue; twSkLeaf(x, gx + Math.cos(th) * rx * 0.3, by + sn * ry * 0.3, Math.atan2(sn * ry / rx, Math.cos(th)), rx * 0.85, rx * 0.42, twSh(TW_SK.leaf, 0.1)); }
      for (var k2 = 0; k2 < n; k2++) { var t2 = (k2 + 0.5) / n * Math.PI * 2 + 0.3, s2 = Math.sin(t2); if (s2 <= 0) continue; twSkLeaf(x, gx + Math.cos(t2) * rx * 0.3, by + s2 * ry * 0.3, Math.atan2(s2 * ry / rx + 0.25, Math.cos(t2)), rx * 0.85, rx * 0.42, TW_SK.leaf); }
    },
    stage: { g0: '#fff4f2', g1: '#ffdde4', side: '#fff1ee', side3: '#fff4ec', top: '#fffaf6', br: ['#a9dcff', '#ffb3cb'], brTop: ['#fff8f2', '#fff8f2'] },
    stageTop: function (x, cx, cy, rx, ry, sz, L, B) { twSkCream(x, cx, cy, rx * (L >= 3 ? 0.84 : 0.9), ry * (L >= 3 ? 0.84 : 0.9), L >= 4 ? 16 : 13, sz * 0.034, false); },
    sprinkle: function (x, px, py, sz, q, i) { x.save(); x.translate(px, py); x.rotate(q * 6); x.fillStyle = ['#ff7d9c', '#ffe066', '#ffffff', '#8fdcb0', '#ffb0c8'][i % 5]; twPill(x, 0, 0, sz * 0.055, sz * 0.022); x.restore(); },
    hood: function (x, S, hy, hr, bunny) { if (bunny) return; x.fillStyle = '#ffe680'; [[-0.55, 0.1], [-0.62, -0.32], [0.7, -0.3]].forEach(function (q) { x.beginPath(); x.ellipse(-S * 0.006 + q[0] * hr, hy + q[1] * hr, Math.max(0.5, S * 0.006), Math.max(0.6, S * 0.009), 0, 0, Math.PI * 2); x.fill(); }); }
  },
  star: {
    id: 'star', name: '별빛 포탑',
    body: { c: '#5d61da', top: '#363c9c', low: '#a680f2', face: '#a49df4', ink: '#4c45b4' },
    markStep: 0.08, mCap: '#ffd65a', woodBody: 1, collar: twSkGoldRim, moon: 1, aura: '#c9b8ff',
    anim: { n: 3, sp: 1.7, w: 0.95, cols: ['#ffe9a0', '#ffffff', '#ffd65a'] },
    map: {
      '#efd8bb': '#dcd6ff', '#dcbc98': '#a49af0', '#f0ad62': '#b9b1fb', '#c98048': '#8a81e8', '#f6c07e': '#d6d0ff', '#f0a65e': '#b9b1fb',
      '#9d92cc': '#ffd65a', '#c9c1ec': '#fff0b8', '#ff8fc0': '#ff9fd8', '#ff5d9e': '#ff78c4', '#7cc8ff': '#8fb6ff', '#b9a2f0': '#cfc8ff', '#ffb38a': '#c9c2ff',
      '#6fd39a': '#8c88f4', '#ff86ba': '#ff9fd8',
      '#a68cff': '#6a64e2', '#78aaff': '#5b8af0', '#ff8fcf': '#c97ae8',
      '#7a5ab0': '#ffd65a', '#f6a94c': '#9b97f6', '#a99ae0': '#837ced', '#8f7ad8': '#6c64de', '#62acf5': '#5f8ff0', '#4f9cf0': '#4f80e8', '#ff7fb4': '#e48ad8',
      '#9a7ad8': '#7068e2', '#7a58b8': '#5a50c8', '#fff0f6': '#ece8ff', '#c9b8ee': '#b9b0ff', '#e2dcf6': '#ece8ff', '#b8aee0': '#a49af0', '#fff3e6': '#ece8ff', '#ffd2a6': '#dcd6ff', '#e8a87a': '#a49af0'
    },
    flag: { '#ffe066': '#6f73e8', '#ff8fc0': '#ff9fd8' },
    band: function (c) { return c === '#ffffff' ? '#dcd6ff' : c === TC.lemon ? TC.gold : twK(c); },
    hatBand: function (c) { return c === TC.pink ? TC.gold : c === TC.lemon ? '#ffe9a0' : c; },
    hatStar: function (c) { return c === TC.lemon ? '#ffd65a' : c; },
    mark: twSkStarMark, gem: twSkStarGem, emblem: twSkStarEmblem,
    roof: function (c) { return c === TC.sky ? { c: '#5b7fe8', top: '#36449e', low: '#8f9cf6', ink: '#4652b8', trim: TC.gold } : c === TC.pink ? { c: '#b26ee0', top: '#5e40a8', low: '#e48ad8', ink: '#7a48b4', trim: TC.gold } : { c: '#5d61da', top: '#363c9c', low: '#a680f2', ink: '#4c45b4', trim: TC.gold }; },
    apex: function (x, cx, ap, rx, ball) { if (ball) twSkStarTip(x, cx, ap - rx * 0.06, rx * 0.2); },
    finial: function (x, px, py, r) { twSkStarTip(x, px, py - r * 0.5, r * 1.9); },
    stage: { g0: '#f1eeff', g1: '#d8d0ff', side: '#e6e0ff', side3: '#ebe6ff', top: '#f6f3ff', br: ['#a3c0ff', '#ffb7e4'], brTop: ['#e6eeff', '#ffe6f6'] },
    stageTop: function (x, cx, cy, rx, ry, sz, L, B) {
      var r = rngOf(L * 7 + B * 3 + 11), n = 5 + L;
      for (var k = 0; k < n; k++) { var a = (k + r() * 0.5) / n * Math.PI * 2, rr = 0.5 + r() * 0.35, px = cx + Math.cos(a) * rx * rr, py = cy + Math.sin(a) * ry * rr; if (k % 2) twTwinkle(x, px, py, sz * 0.035, 0.9); else { x.fillStyle = '#ffd65a'; x.beginPath(); x.arc(px, py, Math.max(0.6, sz * 0.012), 0, Math.PI * 2); x.fill(); } }
    },
    sprinkle: function (x, px, py, sz, q, i) { if (i % 3 === 0) twTwinkle(x, px, py, sz * 0.04, 0.95); else { x.fillStyle = i % 3 === 1 ? '#ffd65a' : '#ffffff'; x.beginPath(); x.arc(px, py, Math.max(0.6, sz * 0.012 * (0.8 + q)), 0, Math.PI * 2); x.fill(); } },
    hood: function (x, S, hy, hr, bunny) { var st = shp(); twStarP(st.p, -S * 0.006 - hr * 0.55, hy - hr * 0.35, Math.max(1, hr * 0.32), Math.max(0.5, hr * 0.15)); x.fillStyle = '#ffd65a'; x.fill(st.p); },
    wall: function (x, x0, y0, w, h) { var r = rngOf(Math.round(x0 * 3 + y0)); for (var k = 0; k < 6; k++) { var px = x0 + w * (0.1 + r() * 0.8), py = y0 - h * (0.15 + r() * 0.75); if (k % 2) twTwinkle(x, px, py, TW_SZ * 0.03, 0.9); else { x.fillStyle = '#ffd65a'; x.beginPath(); x.arc(px, py, Math.max(0.6, TW_SZ * 0.011), 0, Math.PI * 2); x.fill(); } } }
  }
};
// 시험용(브라우저 콘솔): __tw.reset(), __tw.preview('berry', 96), __tw.id(), __tw.bench(90, 'star') (탑 몸체 70장 새로 그리는 ms)
function twSkinBench(S, id) {
  var f0 = TW_SKF, t0; TW_SKF = id || 'base'; TOWER_SPR = {}; t0 = performance.now();
  try { TW_BASE10.forEach(function (k) { [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [4, 1], [5, 1], [6, 1]].forEach(function (q) { towerSpr(k, q[0], q[1], S || 90); }); }); } finally { TW_SKF = f0; }
  var dt = performance.now() - t0; TOWER_SPR = {}; return Math.round(dt * 10) / 10;
}
// 시험용 그림판: __tw.sheet({ mode: 'forms'|'aim'|'fire', S: 90, z: 1, rows: ['archer', ...], skin: 'base', bg: '#7ec46a' }) → dataURL
//  forms: 탑 x (1, 2, 3, A4, A5, A6, B4, B5, B6) / aim: (탑, 단계, 갈래) x 조준 8방향 / fire: (탑, 단계, 갈래) x 쏜 뒤 시간 흐름 8장
function twTestSheet(o) {
  o = o || {};
  var S = o.S || 90, z = o.z || 1, mode = o.mode || 'forms', f0 = TW_SKF, rows = o.rows || TW_BASE10, forms = o.forms || [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [4, 1], [5, 1], [6, 1]];
  var list = [], cols, cw = S * (o.cw || 1.9), ch = S * (o.ch || 2.5);
  if (mode === 'forms') { cols = forms.length; rows.forEach(function (k) { forms.forEach(function (f) { list.push({ k: k, L: f[0], B: f[1], aim: o.aim == null ? 0.5 : o.aim, fT: o.fT || 0, time: o.time == null ? 0.3 : o.time }); }); }); }
  else if (mode === 'aim') { cols = 8; rows.forEach(function (r) { for (var i = 0; i < 8; i++) list.push({ k: r[0], L: r[1], B: r[2], aim: i * Math.PI / 4, fT: o.fT || 0, time: 0.3 + i * 0.07 }); }); }
  else { cols = 8; var fts = [0, 0.35, 0.31, 0.26, 0.2, 0.13, 0.06, 0.01]; rows.forEach(function (r) { fts.forEach(function (ft, i) { list.push({ k: r[0], L: r[1], B: r[2], aim: o.aim == null ? 0.5 : o.aim, fT: ft, time: 1.0 + (0.35 - ft) }); }); }); }
  var nr = Math.ceil(list.length / cols), c = mkC(cw * cols, ch * nr), x = cx2(c);
  TW_SKF = o.skin && TW_SKINS[o.skin] ? o.skin : 'base';
  try {
    x.fillStyle = o.bg || '#86cc74'; x.fillRect(0, 0, c.width, c.height);
    list.forEach(function (q, i) {
      var X = (i % cols + 0.5) * cw, Y = (Math.floor(i / cols) + 1) * ch - S * 0.45;
      // 칸 크기 표시(바닥 타일)
      x.fillStyle = (i + Math.floor(i / cols)) % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(40,90,40,0.10)'; x.fillRect(X - S / 2, Y - S * 0.3 - S / 2, S, S);
      var info = towerSpr(q.k, q.L, q.B, S), Sp = S * (info.k || 1);
      var t = { k: q.k, lvl: q.L, br: q.B, aim: q.aim, fireT: q.fT, side: i % 2, shots: i % 4, spin: q.time * 6, busy: q.fT > 0 ? 0.8 : 0, beamT: q.fT > 0 ? 2 : 0, born: -9, id: 1, frozenT: 0, stunT: 0 };
      drawSpr(x, info.back, X, Y); drawTowerParts(x, t, X, Y, Sp, q.time, info, null); drawSpr(x, info.front, X, Y);
    });
  } finally { TW_SKF = f0; }
  if (z > 1) { var c2 = mkC(c.width * z, c.height * z), x2 = cx2(c2); x2.imageSmoothingEnabled = !!o.smooth; x2.drawImage(c, 0, 0, c2.width, c2.height); c = c2; }
  return c.toDataURL();
}
var TW_BASE10 = ['archer', 'catapult', 'arcane', 'frost', 'ballista', 'bell', 'flame', 'alchemy', 'cannon', 'mint'];
// 시험용: 탑 한 모습(뒤, 앞 그림) 새로 만드는 시간(ms) 목록. __tw.cost(72) → { max, avg, worst, list }
function twTestCost(S, skin) {
  var f0 = TW_SKF, out = [], tot = 0, mx = 0, worst = ''; TW_SKF = skin || 'base';
  try { TW_BASE10.forEach(function (k) { [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [4, 1], [5, 1], [6, 1]].forEach(function (f) { TOWER_SPR = {}; HEAD_SPR = {}; var t0 = performance.now(); var info = towerSpr(k, f[0], f[1], S || 72); var c = mkC(8, 8); drawTowerParts(cx2(c), { k: k, lvl: f[0], br: f[1], aim: 0.4, fireT: 0.2, side: 0, born: -9, id: 1 }, 4, 4, (S || 72) * (info.k || 1), 0.5, info, null); var dt = performance.now() - t0; tot += dt; out.push(k + f[0] + (f[0] >= 4 ? 'AB'[f[1]] : '') + ' ' + dt.toFixed(1)); if (dt > mx) { mx = dt; worst = k + f[0] + ':' + f[1]; } }); }); } finally { TW_SKF = f0; }
  TOWER_SPR = {}; HEAD_SPR = {}; PART_C = {};
  return { max: +mx.toFixed(1), avg: +(tot / out.length).toFixed(1), worst: worst, list: out };
}
// 시험용: 움직이는 부분 그리기 시간(탑 n개, 프레임당 ms)
function twTestParts(S, n) {
  var c = mkC(400, 400), x = cx2(c), ts = [], i, t0, fr = 60; S = S || 72; n = n || 40;
  for (i = 0; i < n; i++) { var k = TW_BASE10[i % 10], L = 3 + (i % 4), B = (i >> 2) % 2; ts.push({ t: { k: k, lvl: L, br: B, aim: i, fireT: 0, side: 0, shots: 0, born: -9, id: i, frozenT: 0 }, info: towerSpr(k, L, B, S) }); }
  for (i = 0; i < 20; i++) ts.forEach(function (q) { q.t.fireT = (i % 7) * 0.05; drawTowerParts(x, q.t, 200, 300, S * q.info.k, i * 0.05, q.info, null); });
  x.getImageData(0, 0, 1, 1); t0 = performance.now();
  for (i = 0; i < fr; i++) ts.forEach(function (q, j) { q.t.fireT = ((i + j) % 21) / 60; q.t.aim += 0.02; q.t.shots = (i + j) >> 4; drawTowerParts(x, q.t, 200, 300, S * q.info.k, 1 + i / 60, q.info, null); });
  x.getImageData(0, 0, 1, 1);
  return +((performance.now() - t0) / fr).toFixed(2);
}
if (typeof window !== 'undefined') window.__tw = { reset: twSkinReset, preview: twSkinPreview, id: twSkinId, bench: twSkinBench, sheet: twTestSheet, spr: towerSpr, one: function (x, k, L, B, S, n, mode) { var info = towerSpr(k, L, B, S), t = { k: k, lvl: L, br: B, aim: 0.3, fireT: 0, side: 0, shots: 0, born: -9, id: 3, frozenT: 0 }, i; for (i = 0; i < 40; i++) { t.fireT = (i % 8) * 0.05; t.aim += 0.4; drawTowerParts(x, t, 350, 600, S * info.k, i * 0.05, info, null); } x.getImageData(0, 0, 1, 1); var t0 = performance.now(); for (i = 0; i < n; i++) { t.fireT = mode === 3 ? 0 : (i % 21) / 60; t.aim += 0.02; t.shots = i >> 4; if (mode !== 2 && mode !== 3) drawSpr(x, info.back, 350, 600); if (mode !== 1) drawTowerParts(x, t, 350, 600, S * info.k, 1 + i / 60, info, null); if (mode !== 2 && mode !== 3) drawSpr(x, info.front, 350, 600); } x.getImageData(0, 0, 1, 1); return performance.now() - t0; }, cost: twTestCost, parts: twTestParts, icon: function (k, L, B, px) { return towerIcon(k, L, B, px).toDataURL(); } };
