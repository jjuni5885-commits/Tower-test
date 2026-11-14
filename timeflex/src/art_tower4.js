// ===== art_tower4.js : 합체 탑 8종 + 관리자 전용 탑 2종 + 수호룡 (TW4) =====
// 합체 탑은 한 모습(L = 1)에 강화 2번(L = 2, 3)이 장식과 빛, 크기를 더한다. 공통 표식: 남색 2단 받침 + 금테 + 도는 빛 고리
// 구조: spr(L, B, S)가 뒤/앞 그림과 움직이는 조각(info.P)을 한 번에 굽고, parts는 조각을 돌리고 옮겨 그리기만 한다
// 단위: u = S * k (k = 탑 배율). mounts와 P의 좌표는 모두 u 단위(parts가 받는 S가 곧 u)
var T4C = { navy: '#5960b4', navyD: '#3b3f80', gun: '#4a5288', gunD: '#333a66', steel: '#8fa6d6', steelL: '#c4d3f2', gold: '#ffcf3f', goldD: '#f0a52a', red: '#ff5a6e', cyan: '#8fe6ff', wood: '#c98048', woodD: '#9a5a36', white: '#fff6e8' };
var T4_FINE = true; // 작은 크기(u < 62)에서는 잔 장식을 생략해 뭉개지지 않게
function t4K(L) { return 1.3 + (L - 1) * 0.07; }
function t4InkC(c) { return mixc(c, '#2a1a48', 0.74); }
function t4Ink(x, s, c, w) { x.save(); x.strokeStyle = t4InkC(c); x.lineWidth = w == null ? TW_IW : w; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(s.p); x.restore(); }
function t4P(x, s, col, o) { twFill(x, s, col, o); t4Ink(x, s, col, o && o.iw); return s; }
// 금속: 날카로운 하이라이트 줄이 있는 가로(또는 세로) 음영
function t4MetalG(x, s, col, vert) {
  var g = vert ? x.createLinearGradient(0, s.y0, 0, s.y1) : x.createLinearGradient(s.x0, 0, s.x1, 0);
  g.addColorStop(0, twSh(col, 0.14)); g.addColorStop(0.13, twLt(col, 0.18)); g.addColorStop(0.22, twLt(col, 0.74)); g.addColorStop(0.3, twLt(col, 0.2)); g.addColorStop(0.56, col); g.addColorStop(0.86, twSh(col, 0.44)); g.addColorStop(1, twSh(col, 0.26));
  x.fillStyle = g; x.fill(s.p);
}
function t4Metal(x, s, col, vert, iw) { t4MetalG(x, s, col, vert); t4Ink(x, s, col, iw); return s; }
function t4Poly(x, pts, col, o) { return t4P(x, shp().poly(pts), col, o); }
function t4Ell(x, cx, cy, rx, ry, col, o) { return t4P(x, shp().ell(cx, cy, rx, ry), col, o); }
function t4RR(x, x0, y0, w, h, r, col, o) { return t4P(x, shp().rrect(x0, y0, w, h, r), col, o); }
function t4Line(x, x0, y0, x1, y1, w, col) { x.save(); x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.strokeStyle = t4InkC(col); x.lineWidth = w + TW_IW * 1.4; x.stroke(); x.strokeStyle = col; x.lineWidth = w; x.stroke(); x.restore(); }
function t4Limb(x, x0, y0, x1, y1, w0, w1, col, metal) { var s = limbShape(x0, y0, x1, y1, w0, w1); if (metal) t4MetalG(x, s, col, Math.abs(x1 - x0) > Math.abs(y1 - y0)); else twFill(x, s, col, { hi: 0.34, lo: 0.24 }); t4Ink(x, s, col, TW_IW * 0.85); return s; }
function t4EllStroke(x, cx, cy, rx, ry, col, w, a0, a1) { x.save(); x.lineCap = 'round'; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, a0 == null ? 0 : a0, a1 == null ? Math.PI * 2 : a1); x.strokeStyle = t4InkC(col); x.lineWidth = w + TW_IW * 1.3; x.stroke(); x.strokeStyle = col; x.lineWidth = w; x.stroke(); x.restore(); }
function t4Glow(x, cx, cy, r, col, a) { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy, r, col, a == null ? 0.6 : a); x.restore(); }
// 원통(진한 테두리판): o.metal, o.top, o.bands, o.bandCol, o.noTop, o.deco(x, s)
function t4Cyl(x, cx, topY, rx, ry, h, col, o) {
  o = o || {};
  var s = shp(); s.p.moveTo(cx - rx, topY); s.p.ellipse(cx, topY, rx, ry, 0, Math.PI, 0, true); s.p.lineTo(cx + rx, topY + h); s.p.ellipse(cx, topY + h, rx, ry, 0, 0, Math.PI, false); s.p.closePath();
  s.ext(cx - rx, topY); s.ext(cx + rx, topY + h + ry);
  if (o.metal) t4MetalG(x, s, col); else twCylG(x, s, col, o);
  if (o.deco) { x.save(); x.clip(s.p); o.deco(x, s); x.restore(); }
  if (o.bands) o.bands.forEach(function (b) {
    var Y = topY + h * b, bh = Math.max(rx * (o.bandH || 0.14), 2), bc = o.bandCol || T4C.gold;
    var bs = shp(); bs.p.moveTo(cx - rx, Y); bs.p.ellipse(cx, Y, rx, ry, 0, Math.PI, 0, true); bs.p.lineTo(cx + rx, Y + bh); bs.p.ellipse(cx, Y + bh, rx, ry, 0, 0, Math.PI, false); bs.p.closePath(); bs.ext(cx - rx, Y); bs.ext(cx + rx, Y + bh + ry);
    t4MetalG(x, bs, bc); t4Ink(x, bs, bc, TW_IW * 0.7);
  });
  t4Ink(x, s, col);
  var t = shp().ell(cx, topY, rx, ry);
  if (!o.noTop) { twFill(x, t, o.top || twLt(col, 0.22), { hi: 0.3, lo: 0.14 }); t4Ink(x, t, col, TW_IW * 0.85); }
  return { side: s, top: t };
}
// 상자(3/4 시점): 앞면 + 윗면 + 오른쪽 옆면. (x0, yb) = 앞면 왼쪽 아래
function t4Box(x, x0, yb, w, h, dx, dy, col, o) {
  o = o || {};
  var side = shp().poly([[x0 + w, yb - h], [x0 + w + dx, yb - h - dy], [x0 + w + dx, yb - dy], [x0 + w, yb]]); twFill(x, side, twSh(col, 0.36), { hi: 0.06, lo: 0.2 }); t4Ink(x, side, col);
  var top = shp().poly([[x0, yb - h], [x0 + dx, yb - h - dy], [x0 + w + dx, yb - h - dy], [x0 + w, yb - h]]); twFill(x, top, o.top || twLt(col, 0.34), { hi: 0.3, lo: 0.05 }); t4Ink(x, top, col);
  var fr = shp().rrect(x0, yb - h, w, h, Math.min(w, h) * 0.06); if (o.metal) t4MetalG(x, fr, col); else twFill(x, fr, col, { hi: 0.32, lo: 0.24 }); t4Ink(x, fr, col);
  return { fr: fr, top: top, side: side };
}
function t4Rivets(x, pts, r, col) { if (!T4_FINE) return; pts.forEach(function (p) { x.fillStyle = t4InkC(col); x.beginPath(); x.arc(p[0], p[1], r * 1.5, 0, Math.PI * 2); x.fill(); x.fillStyle = twLt(col, 0.55); x.beginPath(); x.arc(p[0] - r * 0.25, p[1] - r * 0.25, r, 0, Math.PI * 2); x.fill(); }); }
// 경고 줄무늬 띠(모양 안에)
function t4Hazard(x, s, c1, c2, w) { x.save(); x.clip(s.p); x.fillStyle = c1; x.fillRect(s.x0, s.y0, s.w(), s.h()); x.fillStyle = c2; for (var q = s.x0 - s.h(); q < s.x1 + s.h(); q += w * 2) { x.beginPath(); x.moveTo(q, s.y1); x.lineTo(q + w, s.y1); x.lineTo(q + w + s.h(), s.y0); x.lineTo(q + s.h(), s.y0); x.closePath(); x.fill(); } x.restore(); t4Ink(x, s, c1, TW_IW * 0.7); }
// 작은 마름모 보석(빛 번짐 없이, 받침 단추용)
function t4Stud(x, cx, cy, r, col) { var s = shp().poly([[cx, cy - r], [cx + r * 0.85, cy], [cx, cy + r], [cx - r * 0.85, cy]]); twFill(x, s, col, { hi: 0.6, lo: 0.2 }); t4Ink(x, s, col, TW_IW * 0.6); twShine(x, cx - r * 0.25, cy - r * 0.3, r * 0.22, r * 0.14, 0.9); }
// ---------- 합체 탑 공통 받침: 남색 2단 + 금테 + 보석 단추 + 앞 문장(강화 수만큼 보석) ----------
function t4Base(xb, xf, gx, gy, u, L, rnd, col, gem) {
  twShadow(xb, gx + u * 0.1, gy + u * 0.05, u * 0.74, u * 0.35, 0.46);
  xb.save(); xb.translate(gx, gy); xb.scale(1, 0.56); glowAt(xb, 0, 0, u * 0.82, T4C.gold, 0.2 + L * 0.07); xb.restore();
  var c1 = col || T4C.navy, y1 = gy - u * 0.06, y2 = y1 - u * 0.075;
  t4Cyl(xb, gx, y1, u * 0.58, u * 0.325, u * 0.06, c1, { top: twLt(c1, 0.1) });
  t4EllStroke(xb, gx, y1, u * 0.545, u * 0.3, T4C.gold, Math.max(1.6, u * 0.03));
  t4Cyl(xb, gx, y2, u * 0.48, u * 0.27, u * 0.075, twLt(c1, 0.14), { top: twLt(c1, 0.3) });
  // 룬 눈금
  if (T4_FINE) { t4EllStroke(xb, gx, y2, u * 0.45, u * 0.25, T4C.gold, Math.max(1, u * 0.018)); }
  xb.save(); if (!T4_FINE) xb.globalAlpha = 0; xb.strokeStyle = rgba(gem || T4C.cyan, 0.85); xb.lineWidth = Math.max(1, u * 0.014); xb.setLineDash([u * 0.03, u * 0.045]); xb.beginPath(); xb.ellipse(gx, y2, u * 0.39, u * 0.215, 0, 0, Math.PI * 2); xb.stroke(); xb.restore();
  // 보석 단추(강화할수록 늘어남)
  var n = 1 + L * 2;
  for (var i = 0; i < n; i++) { var a = Math.PI * (0.5 + (i - (n - 1) / 2) * 0.17); if ((L === 1 && i === 1) || !T4_FINE) continue; t4Stud(xf, gx + Math.cos(a) * u * 0.57, y1 + u * 0.035 + Math.sin(a) * u * 0.32, u * 0.034, i % 2 ? T4C.gold : (gem || T4C.cyan)); }
  t4Crest(xf, gx, y1 + u * 0.36, u, L, gem || T4C.cyan);
  return y2;
}
// 앞 문장: 금 날개 + 가운데 보석(강화하면 날개가 커지고 왕관이 붙음)
function t4Crest(x, cx, cy, u, L, gem) {
  var w = u * (0.11 + L * 0.02);
  [-1, 1].forEach(function (sd) {
    for (var f = 0; f < 1 + L; f++) { var s = shp(), p = s.p, ox = cx + sd * u * 0.035, len = w * (1.5 - f * 0.3), yy = cy - u * 0.01 + f * u * 0.028;
      p.moveTo(ox, yy - u * 0.02); p.quadraticCurveTo(ox + sd * len * 0.6, yy - u * 0.05, ox + sd * len, yy - u * 0.035); p.quadraticCurveTo(ox + sd * len * 0.6, yy + u * 0.012, ox, yy + u * 0.02); p.closePath(); s.ext(Math.min(ox, ox + sd * len), yy - u * 0.05); s.ext(Math.max(ox, ox + sd * len), yy + u * 0.02);
      twFill(x, s, T4C.gold, { hi: 0.55, lo: 0.3 }); t4Ink(x, s, T4C.gold, TW_IW * 0.6); }
  });
  var pl = shp().poly([[cx, cy - u * 0.075], [cx + u * 0.06, cy - u * 0.02], [cx + u * 0.045, cy + u * 0.05], [cx, cy + u * 0.08], [cx - u * 0.045, cy + u * 0.05], [cx - u * 0.06, cy - u * 0.02]]);
  x.save(); x.shadowColor = 'rgba(40,20,70,0.5)'; x.shadowBlur = u * 0.03; x.shadowOffsetY = u * 0.012; x.fillStyle = T4C.gold; x.fill(pl.p); x.restore();
  twFill(x, pl, T4C.gold, { hi: 0.6, lo: 0.34 }); t4Ink(x, pl, T4C.goldD, Math.max(1, u * 0.018));
  t4Stud(x, cx, cy, u * 0.036, gem);
  if (L >= 2) { var cr = shp().poly([[cx - u * 0.05, cy - u * 0.085], [cx - u * 0.06, cy - u * 0.135], [cx - u * 0.025, cy - u * 0.11], [cx, cy - u * 0.15], [cx + u * 0.025, cy - u * 0.11], [cx + u * 0.06, cy - u * 0.135], [cx + u * 0.05, cy - u * 0.085]]); twFill(x, cr, L >= 3 ? '#fff0a0' : T4C.gold, { hi: 0.6, lo: 0.25 }); t4Ink(x, cr, T4C.goldD, TW_IW * 0.6);
    if (L >= 3) [-0.06, 0, 0.06].forEach(function (o, i) { x.fillStyle = i === 1 ? '#ff6f9f' : '#7fe0ff'; x.beginPath(); x.arc(cx + o * u, cy - u * (i === 1 ? 0.152 : 0.138), u * 0.012, 0, Math.PI * 2); x.fill(); }); }
}
// 탑 한 모습 굽기: body(xb, xf, gx, gy, u, L, rnd, P)가 그리고 P(조각과 mounts)를 채운다
function t4Spr(key, L, S, body) {
  L = clamp(L || 1, 1, 3);
  var k = t4K(L), u = S * k, W = Math.ceil(S * 3.8), H = Math.ceil(S * 4.9), gx = Math.round(W / 2), gy = Math.round(H * 0.83);
  var cb = mkC(W, H), cf = mkC(W, H), xb = cx2(cb), xf = cx2(cf), rnd = rngOf(hashStr(key) + L * 31), P = { u: u }, info = { P: P }, sk = TW_SK, iw = TW_IW;
  TW_SK = null; TW_IW = Math.max(1, u * 0.024); T4_FINE = u >= 62;
  xb.lineJoin = xf.lineJoin = 'round'; xb.lineCap = xf.lineCap = 'round';
  try { body(xb, xf, gx, gy, u, L, rnd, P); } finally { TW_SK = sk; TW_IW = iw; }
  info.mounts = P.mounts || [[0, -1]]; info.k = k;
  info.back = trimSpr(spr(cb, gx, gy)); info.front = trimSpr(spr(cf, gx, gy));
  return info;
}
// 조각 굽기: fn(x, m)이 가운데 (m, m)에 그린다(오른쪽이 앞). 반환 {c, ax, ay}
function t4Piece(w, h, ax, ay, fn) { var c = mkC(w, h), x = cx2(c); x.lineJoin = 'round'; x.lineCap = 'round'; fn(x, ax, ay); return trimSpr(spr(c, ax, ay)); }
function t4Dark(s, col, a) { var c = silhouette(s.c, col || '#2a1a48'); if (a != null && a < 1) { var d = mkC(c.width, c.height), dx = cx2(d); dx.globalAlpha = a; dx.drawImage(c, 0, 0); c = d; } return spr(c, s.ax, s.ay); }
// 위에서 본 조각을 표적 방향으로 돌려 그리기(세로로 눌러 3/4 시점에 맞춤)
function t4Rot(x, s, px, py, ang, sq, sc) { x.save(); x.translate(px, py); x.scale(sc || 1, (sq == null ? 0.78 : sq) * (sc || 1)); x.rotate(ang); x.drawImage(s.c, -s.ax, -s.ay); x.restore(); }
function t4Add(x, c, px, py, r, a) { x.globalAlpha = a; x.drawImage(c, px - r, py - r, r * 2, r * 2); }
function t4Aim(t) { return t.aim == null ? -0.6 : t.aim; }
function t4Fire(t) { return t.fireT > 0 ? Math.min(1, t.fireT / 0.35) : 0; }
// 합체 탑 공통: 받침을 도는 빛 고리(앞쪽 반만, 뒤는 몸체에 가려짐) + 얼음 덮개
function t4Halo(x, t, X, Y, S, time, col, r) {
  r = r || 0.63; var cy = Y - S * 0.03, n = (t.lvl || 1) >= 2 ? 3 : 2, rx = S * r, ry = rx * 0.56, V0 = -0.42, V1 = Math.PI + 0.42, len = 1.25, i, k;
  x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
  var gs = glowSpr(col, 24);
  for (i = 0; i < n; i++) {
    var a = (time * 1.2 + i * Math.PI * 2 / n + (t.id || 0)) % (Math.PI * 2);
    for (k = 0; k < 2; k++) { // 앞쪽 반(과 옆)만 보임: 뒤는 몸체에 가려짐
      var a0 = a - k * Math.PI * 2, s0 = Math.max(a0, V0), e0 = Math.min(a0 + len, V1); if (e0 - s0 < 0.06) continue;
      x.beginPath(); x.ellipse(X, cy, rx, ry, 0, s0, e0); x.strokeStyle = rgba(col, 0.22); x.lineWidth = Math.max(2, S * 0.06); x.stroke();
      var s1 = Math.max(s0, a0 + len * 0.4); if (e0 - s1 > 0.04) { x.beginPath(); x.ellipse(X, cy, rx, ry, 0, s1, e0); x.strokeStyle = rgba(col, 0.6); x.lineWidth = Math.max(1, S * 0.024); x.stroke(); }
      if (a0 + len <= V1 && a0 + len >= V0) t4Add(x, gs, X + Math.cos(a0 + len) * rx, cy + Math.sin(a0 + len) * ry, S * 0.09, 0.85);
    }
  }
  x.restore();
}
function t4Frozen(x, t, X, Y, S) {
  if (!(t.frozenT > 0)) return;
  x.save(); x.globalAlpha = 0.5; x.fillStyle = '#d6f2ff'; x.beginPath(); x.ellipse(X, Y - S * 0.6, S * 0.5, S * 0.75, 0, 0, Math.PI * 2); x.fill(); x.globalAlpha = 0.9; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.025); x.stroke(); x.globalAlpha = 0.8; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(X - S * 0.24, Y - S * 1.0, S * 0.07, S * 0.14, -0.4, 0, Math.PI * 2); x.fill(); x.restore();
}
// 돌아가는 판(레이더): 앞뒤 두 장을 가로로 눌러 그림
function t4Spin(x, front, back, px, py, ang) { var c = Math.cos(ang), s = c >= 0 ? front : back, w = Math.max(0.1, Math.abs(c)); x.save(); x.translate(px, py); x.scale(w, 1); x.drawImage(s.c, -s.ax, -s.ay); x.restore(); }

// =====================================================================
// 1. 이지스 방공망 (대공포 + 유도탄 포대): 강철 벙커 + 사방 기관포 + 도는 미사일 발사함 + 레이더
// =====================================================================
function t4AAPod(x, px, py, u, sd, sc, P) {
  var r = u * 0.085 * sc, dx = sd * 0.62, dy = -0.78;
  [-1, 1].forEach(function (o) { var bx = px + o * r * 0.42, ex = bx + dx * u * 0.25 * sc, ey = py + dy * u * 0.25 * sc; t4Limb(x, bx, py - r * 0.3, ex, ey, u * 0.036 * sc, u * 0.028 * sc, T4C.gunD, 1); t4Limb(x, ex - dx * u * 0.02, ey - dy * u * 0.02, ex + dx * u * 0.035 * sc, ey + dy * u * 0.035 * sc, u * 0.046 * sc, u * 0.046 * sc, T4C.steelL); });
  var b = shp().ell(px, py, r, r); t4MetalG(x, b, T4C.steel); t4Ink(x, b, T4C.steel); twShine(x, px - r * 0.35, py - r * 0.4, r * 0.25, r * 0.15, 0.85);
  t4EllStroke(x, px, py + r * 0.55, r * 0.95, r * 0.4, T4C.gold, Math.max(1, u * 0.016), 0.2, Math.PI - 0.2);
  P.muz.push([(px + dx * u * 0.3 * sc), (py + dy * u * 0.3 * sc)]);
}
function t4AegisHead(u, L) {
  var W = Math.ceil(u * 1.4), n = L >= 2 ? 4 : 3;
  return t4Piece(W, W, W / 2, W / 2, function (x, m) {
    t4Ell(x, m, m, u * 0.27, u * 0.27, T4C.navy, { hi: 0.3 }); t4EllStroke(x, m, m, u * 0.23, u * 0.23, T4C.gold, Math.max(1, u * 0.02));
    var bw = u * 0.5, bh = u * (L >= 2 ? 0.52 : 0.44), x0 = m - u * 0.26, col = '#5f8fe6';
    t4RR(x, x0 - u * 0.05, m - bh * 0.36, u * 0.09, bh * 0.72, u * 0.02, T4C.gunD);
    var box = shp().rrect(x0, m - bh / 2, bw, bh, u * 0.05); twFill(x, box, col, { hi: 0.45, lo: 0.3 }); t4Ink(x, box, col);
    for (var i = 0; i < n; i++) {
      var cy = m - bh / 2 + bh * (i + 0.5) / n, th = bh / n;
      var tube = shp().rrect(x0 + u * 0.03, cy - th * 0.38, bw - u * 0.06, th * 0.76, th * 0.3); t4MetalG(x, tube, '#bcd4fa', 1); t4Ink(x, tube, col, TW_IW * 0.6);
      // 미사일 머리(흰 몸 + 빨간 코)
      var nx = x0 + bw - u * 0.08, hw = th * 0.33, ms = shp(); ms.p.moveTo(nx, cy - hw); ms.p.lineTo(nx + u * 0.12, cy - hw); ms.p.quadraticCurveTo(nx + u * 0.22, cy - hw * 0.5, nx + u * 0.25, cy); ms.p.quadraticCurveTo(nx + u * 0.22, cy + hw * 0.5, nx + u * 0.12, cy + hw); ms.p.lineTo(nx, cy + hw); ms.p.closePath(); ms.ext(nx, cy - hw); ms.ext(nx + u * 0.25, cy + hw);
      twFill(x, ms, '#fffaf2', { hi: 0.3, lo: 0.25 }); x.save(); x.clip(ms.p); x.fillStyle = T4C.red; x.fillRect(nx + u * 0.13, cy - th, u * 0.14, th * 2); x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(nx, cy - hw, u * 0.25, hw * 0.5); x.restore(); t4Ink(x, ms, '#ff7a8c', TW_IW * 0.75);
    }
    // 금 앞 틀과 가운데 띠
    t4RR(x, x0 + bw - u * 0.1, m - bh / 2 - u * 0.014, u * 0.05, bh + u * 0.028, u * 0.02, T4C.gold, { hi: 0.55 });
    t4RR(x, x0 + u * 0.12, m - bh / 2 - u * 0.014, u * 0.05, bh + u * 0.028, u * 0.02, L >= 3 ? T4C.gold : T4C.navy, { hi: 0.4 });
    if (L >= 3) [-1, 1].forEach(function (sd) { t4Poly(x, [[x0 + u * 0.02, m + sd * bh * 0.5], [x0 + u * 0.3, m + sd * bh * 0.5], [x0 + u * 0.1, m + sd * (bh * 0.5 + u * 0.09)], [x0 - u * 0.06, m + sd * (bh * 0.5 + u * 0.07)]], T4C.gold, { hi: 0.5 }); });
    twShine(x, x0 + u * 0.08, m - bh * 0.36, u * 0.05, u * 0.018, 0.7, 0);
  });
}
function t4RadarPanel(u, L, back) {
  var w = u * (0.56 + L * 0.04), h = u * 0.3, W = Math.ceil(w + u * 0.12), H = Math.ceil(h + u * 0.12);
  return t4Piece(W, H, W / 2, H / 2, function (x, mx, my) {
    var s = shp(), p = s.p; p.moveTo(mx - w / 2, my - h * 0.32); p.quadraticCurveTo(mx, my - h * 0.62, mx + w / 2, my - h * 0.32); p.lineTo(mx + w * 0.42, my + h * 0.4); p.quadraticCurveTo(mx, my + h * 0.56, mx - w * 0.42, my + h * 0.4); p.closePath(); s.ext(mx - w / 2, my - h * 0.5); s.ext(mx + w / 2, my + h * 0.5);
    twFill(x, s, back ? T4C.gun : '#9fc4f8', { hi: back ? 0.15 : 0.5, lo: 0.3 });
    x.save(); x.clip(s.p); x.strokeStyle = back ? rgba(T4C.gunD, 0.9) : 'rgba(255,255,255,0.75)'; x.lineWidth = Math.max(0.8, u * 0.012);
    for (var i = -4; i <= 4; i++) { x.beginPath(); x.moveTo(mx + i * w * 0.11, my - h); x.lineTo(mx + i * w * 0.1, my + h); x.stroke(); }
    for (var j = -1; j <= 1; j++) { x.beginPath(); x.moveTo(mx - w, my + j * h * 0.25 - h * 0.05); x.quadraticCurveTo(mx, my + j * h * 0.25 - h * 0.14, mx + w, my + j * h * 0.25 - h * 0.05); x.stroke(); }
    x.restore();
    x.save(); x.strokeStyle = t4InkC(T4C.gold); x.lineWidth = Math.max(1.4, u * 0.034) + TW_IW; x.stroke(s.p); x.strokeStyle = back ? T4C.goldD : T4C.gold; x.lineWidth = Math.max(1.4, u * 0.034); x.stroke(s.p); x.restore();
    if (!back) { t4Ell(x, mx, my - h * 0.04, u * 0.05, u * 0.05, T4C.cyan, { hi: 0.7 }); twShine(x, mx - u * 0.015, my - h * 0.04 - u * 0.02, u * 0.016, u * 0.01, 0.95); }
    else t4RR(x, mx - u * 0.03, my - h * 0.3, u * 0.06, h * 0.6, u * 0.02, T4C.gunD);
  });
}
TW_EXT.fz_aegis = {
  spr: function (L, B, S) {
    return t4Spr('fz_aegis', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var by = t4Base(xb, xf, gx, gy, u, L, rnd, T4C.navy, '#8fe6ff'), h1 = u * 0.3, t1 = by - h1, h2 = u * 0.3, top = t1 - h2, col = '#a4c2f4', col2 = '#7da8ea';
      P.muz = [];
      // 아래층: 넓은 장갑 벙커
      t4Cyl(xb, gx, t1, u * 0.43, u * 0.24, h1, col, { bands: [0.7], bandH: 0.12, top: '#d3e2fb', deco: function (x, s) {
        x.strokeStyle = rgba(t4InkC(col), T4_FINE ? 0.5 : 0); x.lineWidth = Math.max(0.8, u * 0.012);
        for (var i = 1; i < 6; i++) { var px = gx - u * 0.43 * Math.cos(i / 6 * Math.PI); x.beginPath(); x.moveTo(px, t1); x.lineTo(px, t1 + h1 + u * 0.25); x.stroke(); }
        var Y = t1 + h1 * 0.2, hz = shp(); hz.p.moveTo(gx - u * 0.43, Y); hz.p.ellipse(gx, Y, u * 0.43, u * 0.24, 0, Math.PI, 0, true); hz.p.lineTo(gx + u * 0.43, Y + u * 0.08); hz.p.ellipse(gx, Y + u * 0.08, u * 0.43, u * 0.24, 0, 0, Math.PI, false); hz.p.closePath(); hz.ext(gx - u * 0.43, Y); hz.ext(gx + u * 0.43, Y + u * 0.32);
        t4Hazard(x, hz, '#ffb93a', '#3f4688', u * 0.055);
      } });
      // 뒤 기관포 둘(위층 뒤에서 솟음)
      t4AAPod(xb, gx - u * 0.36, t1 - u * 0.1, u, -1, 0.95, P); t4AAPod(xb, gx + u * 0.36, t1 - u * 0.1, u, 1, 0.95, P);
      // 위층: 좁은 포탑 기둥
      t4Cyl(xb, gx, top, u * 0.31, u * 0.175, h2, col2, { metal: 1, bands: [0.04, 0.74], bandH: 0.14, top: '#c3d8f8' });
      var win = shp().rrect(gx - u * 0.16, top + h2 * 0.5, u * 0.2, u * 0.075, u * 0.035); xb.fillStyle = '#2f3470'; xb.fill(win.p); t4Ink(xb, win, col2, TW_IW * 0.7); xb.fillStyle = T4C.cyan; twPill(xb, gx - u * 0.07, top + h2 * 0.5 + u * 0.036, u * 0.13, u * 0.03); t4Glow(xb, gx - u * 0.06, top + h2 * 0.5 + u * 0.036, u * 0.12, T4C.cyan, 0.5);
      if (L >= 2) [-1, 1].forEach(function (sd) { t4Poly(xb, [[gx + sd * u * 0.3, top + u * 0.1], [gx + sd * u * 0.47, top - u * 0.04], [gx + sd * u * 0.43, top + u * 0.16], [gx + sd * u * 0.31, top + u * 0.26]], T4C.gold, { hi: 0.55 }); });
      t4Ell(xb, gx, top, u * 0.25, u * 0.14, T4C.navy, { hi: 0.25 });
      // 앞 기관포 둘
      t4AAPod(xf, gx - u * 0.45, by - u * 0.13, u, -1, 1.15, P); t4AAPod(xf, gx + u * 0.45, by - u * 0.13, u, 1, 1.15, P);
      P.muz = P.muz.map(function (m) { return [(m[0] - gx) / u, (m[1] - gy) / u]; });
      var my = (top - u * 0.1 - gy) / u; P.my = my; P.mounts = [[0, my]];
      P.head = t4AegisHead(u, L); P.headD = t4Dark(P.head, T4C.navyD);
      P.rf = t4RadarPanel(u, L, 0); P.rb = t4RadarPanel(u, L, 1);
      P.mastH = 0.52 + L * 0.04;
      P.mast = t4Piece(Math.ceil(u * 0.3), Math.ceil(u * (P.mastH + 0.12)), u * 0.15, u * (P.mastH + 0.06), function (x, mx, my2) {
        t4Limb(x, mx, my2, mx, my2 - u * P.mastH, u * 0.07, u * 0.045, T4C.steel, 1);
        t4RR(x, mx - u * 0.07, my2 - u * 0.05, u * 0.14, u * 0.07, u * 0.025, T4C.gold, { hi: 0.5 });
        t4RR(x, mx - u * 0.05, my2 - u * P.mastH * 0.55, u * 0.1, u * 0.04, u * 0.02, T4C.navy);
      });
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, aim = t4Aim(t), f = t4Fire(t), mx = X, my = Y + P.my * S, i;
    t4Halo(x, t, X, Y, S, time, '#8fdcff');
    var rec = f > 0 ? Math.sin(f * Math.PI) * S * 0.08 : 0, hx = mx - Math.cos(aim) * rec, hy = my - Math.sin(aim) * rec * 0.78;
    t4Rot(x, P.headD, hx, hy + S * 0.07, aim); t4Rot(x, P.head, hx, hy, aim);
    // 돛대와 레이더
    x.drawImage(P.mast.c, mx - P.mast.ax, my - S * 0.04 - P.mast.ay);
    var ry = my - S * (P.mastH + 0.08);
    t4Spin(x, P.rf, P.rb, mx, ry, time * 2.4 + (t.id || 0));
    x.save(); x.globalCompositeOperation = 'lighter';
    if (Math.sin(time * 5 + (t.id || 0)) > 0) t4Add(x, glowSpr('#ff5a6e', 24), mx, ry - S * 0.2, S * 0.09, 0.9);
    if (f > 0) {
      var fl = glowSpr('#ffd27a', 48), sm = softSpr('#ffffff', 32);
      t4Add(x, fl, hx + Math.cos(aim) * S * 0.55, hy + Math.sin(aim) * S * 0.43, S * (0.16 + 0.3 * f), f);
      t4Add(x, sm, hx - Math.cos(aim) * S * 0.42, hy - Math.sin(aim) * S * 0.33, S * (0.34 - 0.16 * f), 0.7 * f);
      for (i = 0; i < P.muz.length; i++) if ((Math.floor(time * 22) + i) % 2) t4Add(x, fl, X + P.muz[i][0] * S, Y + P.muz[i][1] * S, S * 0.13, 0.95);
    }
    x.restore();
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 2. 천상궁 (궁수탑 + 노포): 흰 대리석 탑 위에 탑보다 큰 금빛 대궁, 빛의 화살
// =====================================================================
function t4BowLimbs(x, m, u, sc, col, w0, w1, ink) {
  var P0 = [-0.02, -0.78], P1 = [0.2, -0.76], P2 = [0.38, -0.42], P3 = [0.22, 0], s = shp(), N = 12;
  [-1, 1].forEach(function (sd) {
    var Lp = [], Rp = [];
    for (var i = 0; i <= N; i++) {
      var t = i / N, a = 1 - t;
      var px = a * a * a * P0[0] + 3 * a * a * t * P1[0] + 3 * a * t * t * P2[0] + t * t * t * P3[0], py = a * a * a * P0[1] + 3 * a * a * t * P1[1] + 3 * a * t * t * P2[1] + t * t * t * P3[1];
      var dx = 3 * a * a * (P1[0] - P0[0]) + 6 * a * t * (P2[0] - P1[0]) + 3 * t * t * (P3[0] - P2[0]), dy = 3 * a * a * (P1[1] - P0[1]) + 6 * a * t * (P2[1] - P1[1]) + 3 * t * t * (P3[1] - P2[1]), l = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, Math.pow(t, 0.7)) / 2;
      Lp.push([m + (px - dy / l * w) * u * sc, m + sd * (py + dx / l * w) * u * sc]); Rp.push([m + (px + dy / l * w) * u * sc, m + sd * (py - dx / l * w) * u * sc]);
    }
    s.poly(Lp.concat(Rp.reverse()));
  });
  var g = x.createLinearGradient(m, 0, m + u * 0.4 * sc, 0); g.addColorStop(0, twSh(col, 0.2)); g.addColorStop(0.55, col); g.addColorStop(1, twLt(col, 0.5)); x.fillStyle = g; x.fill(s.p);
  if (ink) t4Ink(x, s, col);
  return s;
}
function t4Feather(x, ox, oy, ang, len, wid, col) {
  x.save(); x.translate(ox, oy); x.rotate(ang);
  var s = shp(), p = s.p; p.moveTo(0, -wid * 0.3); p.quadraticCurveTo(len * 0.55, -wid, len, -wid * 0.1); p.quadraticCurveTo(len * 0.6, wid * 0.55, 0, wid * 0.3); p.closePath(); s.ext(0, -wid); s.ext(len, wid);
  twFill(x, s, col, { hi: 0.6, lo: 0.28 }); t4Ink(x, s, col, TW_IW * 0.7);
  x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = Math.max(0.6, wid * 0.12); x.beginPath(); x.moveTo(len * 0.1, -wid * 0.05); x.quadraticCurveTo(len * 0.5, -wid * 0.4, len * 0.85, -wid * 0.12); x.stroke();
  x.restore();
}
function t4Wing(x, px, py, sd, len, u, col, n) { for (var i = (n || 3) - 1; i >= 0; i--) t4Feather(x, px, py + i * u * 0.035, sd > 0 ? -0.75 + i * 0.36 : Math.PI + 0.75 - i * 0.36, len * (1 - i * 0.16), u * 0.085, i % 2 ? twLt(col, 0.35) : col); }
function t4BowPiece(u, L) {
  var W = Math.ceil(u * 2.1), sc = 1 + (L - 1) * 0.04;
  return t4Piece(W, W, W / 2, W / 2, function (x, m) {
    // 노포 몸통(레일)
    t4RR(x, m - u * 0.4, m - u * 0.06, u * 0.66, u * 0.12, u * 0.04, '#8a5a3c', { hi: 0.3 });
    t4RR(x, m - u * 0.3, m - u * 0.085, u * 0.36, u * 0.17, u * 0.05, '#8fc4ff', { hi: 0.5 }); twShine(x, m - u * 0.2, m - u * 0.05, u * 0.05, u * 0.014, 0.8, 0);
    t4RR(x, m - u * 0.43, m - u * 0.075, u * 0.08, u * 0.15, u * 0.03, T4C.gold, { hi: 0.5 });
    // 금빛 대궁
    t4BowLimbs(x, m, u, sc, T4C.gold, 0.06, 0.15 + L * 0.012, 1);
    t4BowLimbs(x, m + u * 0.014, u, sc, '#fff4b8', 0.014, 0.045, 0);
    if (L >= 2) t4BowLimbs(x, m - u * 0.02, u, sc, '#7fc8ff', 0.012, 0.03, 0);
    // 깃 장식과 손잡이 보석
    [-1, 1].forEach(function (sd) {
      t4Feather(x, m + u * 0.2 * sc, m + sd * u * 0.1, sd * 2.2, u * (0.2 + L * 0.03), u * 0.07, '#8fd0ff'); if (L >= 3) t4Feather(x, m + u * 0.24 * sc, m + sd * u * 0.2, sd * 1.9, u * 0.24, u * 0.06, '#ffffff');
      var tx = m - u * 0.02 * sc, ty = m + sd * u * 0.78 * sc; t4Ell(x, tx, ty, u * 0.05, u * 0.05, T4C.gold, { hi: 0.6 }); t4Stud(x, tx + u * 0.03, ty - sd * u * 0.09, u * 0.035, '#8fe6ff');
    });
    t4RR(x, m + u * 0.15 * sc, m - u * 0.1, u * 0.12, u * 0.2, u * 0.05, T4C.goldD, { hi: 0.5 });
    twGem(x, m + u * 0.21 * sc, m + u * 0.015, u * 0.055, '#8fe6ff');
  });
}
function t4ArrowPiece(u, L) {
  var W = Math.ceil(u * 1.5), H = Math.ceil(u * 0.5);
  return t4Piece(W, H, u * 0.2, H / 2, function (x, ox, oy) {
    var len = u * 1.05;
    x.save(); x.globalCompositeOperation = 'lighter'; x.translate(ox + len * 0.5, oy); x.scale(1, 0.2); glowAt(x, 0, 0, len * 0.62, '#ffe680', 0.75); x.restore();
    var sh = shp().rrect(ox, oy - u * 0.032, len * 0.86, u * 0.064, u * 0.03); x.fillStyle = '#fffbe0'; x.fill(sh.p); t4Ink(x, sh, '#ffc93c', TW_IW * 0.6);
    var hd = shp().poly([[ox + len, oy], [ox + len * 0.8, oy - u * 0.085], [ox + len * 0.85, oy], [ox + len * 0.8, oy + u * 0.085]]); twFill(x, hd, '#fff2a0', { hi: 0.7, lo: 0.1 }); t4Ink(x, hd, T4C.goldD, TW_IW * 0.7);
    [-1, 1].forEach(function (sd) { var fl = shp().poly([[ox - u * 0.02, oy + sd * u * 0.075], [ox + u * 0.16, oy + sd * u * 0.015], [ox + u * 0.02, oy + sd * u * 0.015]]); twFill(x, fl, '#8fe6ff', { hi: 0.6 }); t4Ink(x, fl, '#5fb2ff', TW_IW * 0.5); });
    twTwinkle(x, ox + len * 0.93, oy, u * 0.09, 0.95);
  });
}
TW_EXT.fz_skybow = {
  spr: function (L, B, S) {
    return t4Spr('fz_skybow', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var by = t4Base(xb, xf, gx, gy, u, L, rnd, T4C.navy, '#ffe680'), h = u * 0.74, top = by - h, st = '#f6ecd8';
      // 뒤 날개(강화할수록 커짐)
      [-1, 1].forEach(function (sd) { t4Wing(xb, gx + sd * u * 0.2, top + u * 0.14, sd, u * (0.3 + L * 0.07), u, T4C.gold, 2 + L); });
      t4Cyl(xb, gx, top, u * 0.25, u * 0.14, h, st, { hi: 0.5, bands: [0.16, 0.62], bandH: 0.2, bandCol: '#7fc0ff', deco: function (x, s) { twCylBricks(x, s, gx, top, u * 0.25, u * 0.14, h, st, 6, 4, rnd); } });
      twWindow(xb, gx - u * 0.05, top + h * 0.44, u * 0.075, u * 0.12, 1);
      twBanner(xb, gx + u * 0.02, top + h * 0.72, u * 0.17, u * 0.26, '#5fb2ff', '#fff6e8', null);
      // 넓은 받침대 + 금 모자 성가퀴
      t4Cyl(xb, gx, top - u * 0.05, u * 0.39, u * 0.215, u * 0.09, '#8fc8ff', { top: '#eef7ff', bands: [0.5], bandH: 0.1 });
      twMerlons(xb, xb, gx, top - u * 0.05, u * 0.39, u * 0.215, 10, u * 0.09, st, T4C.gold);
      t4Ell(xb, gx, top - u * 0.07, u * 0.16, u * 0.09, T4C.gold, { hi: 0.5 });
      t4Cyl(xb, gx, top - u * 0.16, u * 0.07, u * 0.04, u * 0.09, T4C.steel, { metal: 1 });
      if (L >= 3) { // 후광
        var hy = top - u * 0.3; xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, hy, u * 0.7, '#ffe680', 0.35); xb.restore();
        t4EllStroke(xb, gx, hy, u * 0.5, u * 0.5, '#ffe9a0', Math.max(1.2, u * 0.03));
        if (T4_FINE) for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 + 0.39; twTwinkle(xb, gx + Math.cos(a) * u * 0.5, hy + Math.sin(a) * u * 0.5, u * 0.05, 0.9); }
      }
      P.my = (top - u * 0.27 - gy) / u; P.mounts = [[0, P.my]];
      P.bow = t4BowPiece(u, L); P.arrow = t4ArrowPiece(u, L); P.tipX = -0.02 * (1 + (L - 1) * 0.04); P.tipY = 0.78 * (1 + (L - 1) * 0.04);
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, aim = t4Aim(t), f = t4Fire(t), mx = X, my = Y + P.my * S, pull, aa, q;
    t4Halo(x, t, X, Y, S, time, '#ffe9a0');
    if (f > 0.72) { q = (1 - f) / 0.28; pull = -0.14 * Math.sin(q * Math.PI * 3) * (1 - q * 0.6); aa = 0; } else { q = 1 - f / 0.72; pull = easeOut(q); aa = q; }
    var rec = f > 0.72 ? S * 0.06 * (f - 0.72) / 0.28 : 0, sxp = S * (P.tipX - 0.3 * pull);
    x.save(); x.translate(mx - Math.cos(aim) * rec, my - Math.sin(aim) * rec * 0.8); x.scale(1, 0.8); x.rotate(aim);
    x.drawImage(P.bow.c, -P.bow.ax, -P.bow.ay);
    // 시위
    x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(S * P.tipX, -S * P.tipY); x.lineTo(sxp, 0); x.lineTo(S * P.tipX, S * P.tipY);
    x.strokeStyle = 'rgba(90,60,40,0.6)'; x.lineWidth = Math.max(2, S * 0.036); x.stroke(); x.strokeStyle = '#fffdf0'; x.lineWidth = Math.max(1.1, S * 0.02); x.stroke();
    if (aa > 0.02) { x.globalAlpha = aa; x.drawImage(P.arrow.c, sxp - P.arrow.ax, -P.arrow.ay); x.globalAlpha = 1; }
    x.restore();
    x.save(); x.globalCompositeOperation = 'lighter';
    var tx = mx + Math.cos(aim) * S * (0.75 - 0.3 * pull), ty = my + Math.sin(aim) * S * (0.75 - 0.3 * pull) * 0.8;
    if (aa > 0.5) t4Add(x, glowSpr('#ffe680', 32), tx, ty, S * (0.16 + 0.05 * Math.sin(time * 6)), 0.75 * aa);
    if (f > 0.5) { var k = (f - 0.5) / 0.5; t4Add(x, glowSpr('#fff2b0', 64), mx + Math.cos(aim) * S * 0.45, my + Math.sin(aim) * S * 0.36, S * (0.3 + 0.5 * k), k); t4Add(x, glowSpr('#8fe6ff', 48), mx, my, S * 0.5, 0.5 * k); }
    x.restore();
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 3. 거포 요새 (대포탑 + 투석기): 두꺼운 성벽 포대 + 초대형 포신 + 투석 팔 장전 기중기
// =====================================================================
function t4FortHead(u, L) {
  var W = Math.ceil(u * 2.2), sc = 1 + (L - 1) * 0.06;
  return t4Piece(W, W, W / 2, W / 2, function (x, m) {
    var bc = '#4d5594', bl = u * 0.86 * sc, bw = u * 0.3 * sc;
    // 포가(나무 + 쇠 띠)와 바퀴
    [-1, 1].forEach(function (sd) { t4RR(x, m - u * 0.26, m + sd * u * 0.25 * sc - u * 0.05, u * 0.34, u * 0.1, u * 0.04, '#6a4a3a', { hi: 0.25 }); });
    t4RR(x, m - u * 0.36, m - u * 0.23 * sc, u * 0.5, u * 0.46 * sc, u * 0.06, T4C.wood, { hi: 0.35 });
    [-0.26, -0.02].forEach(function (o) { t4RR(x, m + o * u, m - u * 0.235 * sc, u * 0.05, u * 0.47 * sc, u * 0.02, T4C.gun, { hi: 0.4 }); });
    // 포신
    var br = shp(), p = br.p, x0 = m - u * 0.3; p.moveTo(x0, m - bw * 0.56); p.lineTo(m + bl - bw * 0.2, m - bw * 0.42); p.lineTo(m + bl, m - bw * 0.42); p.lineTo(m + bl, m + bw * 0.42); p.lineTo(m + bl - bw * 0.2, m + bw * 0.42); p.lineTo(x0, m + bw * 0.56); p.quadraticCurveTo(x0 - bw * 0.5, m, x0, m - bw * 0.56); p.closePath(); br.ext(x0 - bw * 0.5, m - bw * 0.56); br.ext(m + bl, m + bw * 0.56);
    t4Metal(x, br, bc, 1);
    // 금 고리와 포구
    [0.02, 0.3, 0.56].forEach(function (o, i) { var rw = bw * (1.16 - i * 0.1); t4Metal(x, shp().rrect(m + o * u * sc, m - rw / 2, u * 0.055, rw, u * 0.02), T4C.gold, 1, TW_IW * 0.7); });
    t4Metal(x, shp().rrect(m + bl - u * 0.12, m - bw * 0.6, u * 0.13, bw * 1.2, u * 0.035), L >= 2 ? T4C.gold : '#c0563e', 1);
    if (L >= 3) [-1, 1].forEach(function (sd) { t4Poly(x, [[m + bl - u * 0.1, m + sd * bw * 0.58], [m + bl + u * 0.06, m + sd * bw * 0.8], [m + bl + u * 0.01, m + sd * bw * 0.5]], T4C.gold, { hi: 0.6 }); });
    x.fillStyle = '#231a3c'; x.beginPath(); x.ellipse(m + bl + u * 0.004, m, u * 0.022, bw * 0.3, 0, 0, Math.PI * 2); x.fill();
    t4Ell(x, x0 - bw * 0.3, m, u * 0.07, u * 0.07, T4C.gold, { hi: 0.6 });
    specLine(x, x0 + u * 0.05, m - bw * 0.3, m + bl - u * 0.16, m - bw * 0.24, Math.max(1, bw * 0.1), 0.75);
    t4Stud(x, m - u * 0.14, m, u * 0.05, '#ff7a4a');
  });
}
function t4CraneArm(u, L, ball) {
  var W = Math.ceil(u * 1.6);
  return t4Piece(W, W, W / 2, W / 2, function (x, m) {
    t4Limb(x, m - u * 0.2, m, m + u * 0.52, m, u * 0.085, u * 0.06, T4C.wood);
    [0.1, 0.3].forEach(function (o) { t4RR(x, m + o * u, m - u * 0.045, u * 0.04, u * 0.09, u * 0.015, T4C.gun, { hi: 0.4 }); });
    t4RR(x, m - u * 0.3, m - u * 0.08, u * 0.17, u * 0.2, u * 0.04, T4C.gun, { hi: 0.4 }); t4Stud(x, m - u * 0.215, m + u * 0.02, u * 0.04, T4C.gold);
    // 집게와 포환
    var cx = m + u * 0.56, cy = m + u * 0.02;
    if (ball) { t4Ell(x, cx, cy + u * 0.08, u * 0.115, u * 0.115, '#3f4478', { hi: 0.5, lo: 0.4 }); twShine(x, cx - u * 0.04, cy + u * 0.04, u * 0.035, u * 0.02, 0.85); if (L >= 2) t4Glow(x, cx, cy + u * 0.08, u * 0.2, '#ff8a3a', 0.45); }
    x.save(); x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy + u * 0.07, u * 0.13, Math.PI * 1.05, Math.PI * 1.95); x.strokeStyle = t4InkC(T4C.gold); x.lineWidth = u * 0.04 + TW_IW; x.stroke(); x.strokeStyle = T4C.gold; x.lineWidth = u * 0.04; x.stroke(); x.restore();
    t4Ell(x, m, m, u * 0.055, u * 0.055, T4C.gold, { hi: 0.6 });
  });
}
TW_EXT.fz_fortress = {
  spr: function (L, B, S) {
    return t4Spr('fz_fortress', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var by = t4Base(xb, xf, gx, gy, u, L, rnd, T4C.navy, '#ff9a4a'), h = u * 0.44, top = by - h, st = '#eed6b4', rx = u * 0.46, ry = u * 0.26;
      // 기중기 받침(뒤 왼쪽 A자 틀)
      var ax = gx - u * 0.36, ay = top - u * 0.62;
      t4Limb(xb, gx - u * 0.48, top + u * 0.04, ax, ay, u * 0.075, u * 0.055, T4C.woodD); t4Limb(xb, gx - u * 0.2, top - u * 0.1, ax, ay, u * 0.075, u * 0.055, T4C.wood);
      t4Limb(xb, gx - u * 0.43, top - u * 0.22, gx - u * 0.27, top - u * 0.3, u * 0.045, u * 0.045, T4C.gun, 1);
      // 성벽 포대
      t4Cyl(xb, gx, top, rx, ry, h, st, { hi: 0.5, bands: [0.0], bandH: 0.1, bandCol: '#c0563e', top: '#d9b98c', deco: function (x, s) { if (T4_FINE) twCylBricks(x, s, gx, top, rx, ry, h, st, 4, 7, rnd); } });
      // 버팀벽, 포문, 성문
      [-1, 1].forEach(function (sd) { t4Poly(xb, [[gx + sd * u * 0.27, top + u * 0.3], [gx + sd * u * 0.39, top + u * 0.27], [gx + sd * u * 0.47, by + u * 0.2], [gx + sd * u * 0.29, by + u * 0.25]], twSh(st, 0.12), { hi: 0.3 });
        var em = shp().rrect(gx + sd * u * 0.2 - u * 0.035, top + u * 0.3, u * 0.07, u * 0.1, u * 0.035); xb.fillStyle = '#3a2a4a'; xb.fill(em.p); t4Ink(xb, em, st, TW_IW * 0.7); });
      var gate = shp(); gate.p.moveTo(gx - u * 0.1, by + u * 0.24); gate.p.lineTo(gx - u * 0.1, top + u * 0.4); gate.p.quadraticCurveTo(gx - u * 0.1, top + u * 0.28, gx, top + u * 0.28); gate.p.quadraticCurveTo(gx + u * 0.1, top + u * 0.28, gx + u * 0.1, top + u * 0.4); gate.p.lineTo(gx + u * 0.1, by + u * 0.24); gate.p.closePath(); gate.ext(gx - u * 0.1, top + u * 0.28); gate.ext(gx + u * 0.1, by + u * 0.24);
      twFill(xb, gate, '#8a5a3c', { hi: 0.3 }); xb.save(); xb.clip(gate.p); xb.strokeStyle = rgba('#3a2030', 0.6); xb.lineWidth = Math.max(0.8, u * 0.012); for (var i = -2; i <= 2; i++) { xb.beginPath(); xb.moveTo(gx + i * u * 0.04, top); xb.lineTo(gx + i * u * 0.04, by + u * 0.3); xb.stroke(); } xb.fillStyle = T4C.gun; xb.fillRect(gx - u * 0.12, top + u * 0.42, u * 0.24, u * 0.035); xb.restore(); t4Ink(xb, gate, T4C.goldD); t4Stud(xb, gx, top + u * 0.34, u * 0.03, T4C.gold);
      twMerlons(xb, xb, gx, top, rx, ry, 10, u * 0.11, st, '#c0563e');
      t4Ell(xb, gx, top - u * 0.01, u * 0.3, u * 0.17, '#b08a64', { hi: 0.2 });
      if (L >= 2) [-1, 1].forEach(function (sd) { twBanner(xf, gx + sd * u * 0.3, top + u * 0.12, u * 0.12, u * 0.22, '#e8504a', '#ffe27a', null); });
      if (L >= 3) [-1, 1].forEach(function (sd) { var px = gx + sd * u * 0.5, py = by + u * 0.08; t4Limb(xf, px, py, px + sd * u * 0.1, py - u * 0.17, u * 0.1, u * 0.085, T4C.gun, 0); t4Ell(xf, px + sd * u * 0.1, py - u * 0.18, u * 0.05, u * 0.035, T4C.gold, { hi: 0.5 }); t4Ell(xf, px, py + u * 0.01, u * 0.07, u * 0.045, T4C.gold, { hi: 0.5 }); });
      P.my = (top - u * 0.15 - gy) / u; P.mounts = [[0, P.my]]; P.cr = [(ax - gx) / u, (ay - gy) / u];
      t4Ell(xb, ax, ay, u * 0.06, u * 0.06, T4C.gun, { hi: 0.4 });
      P.head = t4FortHead(u, L); P.headD = t4Dark(P.head, '#3a2a4a'); P.arm1 = t4CraneArm(u, L, 1); P.arm0 = t4CraneArm(u, L, 0); P.bl = 0.86 * (1 + (L - 1) * 0.06);
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, aim = t4Aim(t), f = t4Fire(t), mx = X, my = Y + P.my * S, ca = Math.cos(aim), sa = Math.sin(aim);
    t4Halo(x, t, X, Y, S, time, '#ffc27a');
    var rec = f > 0 ? Math.sin(Math.pow(f, 0.6) * Math.PI) * S * 0.2 : 0, hx = mx - ca * rec, hy = my - sa * rec * 0.78;
    t4Rot(x, P.headD, hx, hy + S * 0.08, aim); t4Rot(x, P.head, hx, hy, aim);
    // 장전 기중기: 쏜 뒤 팔이 내려와 새 포환을 넣고 올라감
    var arm = -1.02 + (f > 0 ? Math.sin(f * Math.PI) * 1.2 : 0) + Math.sin(time * 1.4 + (t.id || 0)) * 0.03, as = f > 0.08 && f < 0.55 ? P.arm0 : P.arm1;
    x.save(); x.translate(X + P.cr[0] * S, Y + P.cr[1] * S); x.rotate(arm); x.drawImage(as.c, -as.ax, -as.ay); x.restore();
    if (f > 0) {
      x.save(); x.globalCompositeOperation = 'lighter';
      var d = S * (P.bl + 0.08), fx = hx + ca * d, fy = hy + sa * d * 0.78, k = Math.max(0, (f - 0.45) / 0.55);
      if (k > 0) { t4Add(x, glowSpr('#ffb04a', 64), fx, fy, S * (0.35 + 0.55 * k), k); t4Add(x, glowSpr('#ffffff', 32), fx, fy, S * 0.22 * k, k); }
      x.globalCompositeOperation = 'source-over';
      var sm = softSpr('#fff6e8', 32), e = 1 - f;
      for (var i = 0; i < 3; i++) { var an = aim + (i - 1) * 0.5; t4Add(x, sm, fx + Math.cos(an) * S * 0.3 * e, fy + Math.sin(an) * S * 0.24 * e - S * 0.1 * e, S * (0.14 + 0.2 * e), 0.6 * f); }
      x.restore();
    }
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 4. 뇌신탑 (마법탑 + 테슬라 코일): 수정 첨탑 + 층층이 도는 번개 고리 + 꼭대기 방전 구슬
// =====================================================================
function t4Crystal(x, cx, by, w, h, col, tilt, tipc) {
  tilt = tilt || 0; var sh = h * 0.76, tx = cx + tilt * h, mid = cx + tilt * sh;
  var pts = [[cx - w * 0.38, by], [mid - w / 2, by - sh], [tx, by - h], [mid + w / 2, by - sh], [cx + w * 0.38, by]];
  var s = shp().poly(pts), g = x.createLinearGradient(0, by - h, 0, by); g.addColorStop(0, twLt(tipc || col, 0.6)); g.addColorStop(0.4, tipc ? mixc(tipc, col, 0.6) : col); g.addColorStop(1, twSh(col, 0.32)); x.fillStyle = g; x.fill(s.p);
  x.fillStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.moveTo(pts[0][0], by); x.lineTo(pts[1][0], pts[1][1]); x.lineTo(tx, by - h); x.lineTo(mid - w * 0.1, by - sh); x.lineTo(cx - w * 0.08, by); x.closePath(); x.fill();
  x.fillStyle = rgba(twSh(col, 0.7), 0.42); x.beginPath(); x.moveTo(pts[4][0], by); x.lineTo(pts[3][0], pts[3][1]); x.lineTo(tx, by - h); x.lineTo(mid + w * 0.16, by - sh); x.lineTo(cx + w * 0.14, by); x.closePath(); x.fill();
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = Math.max(0.8, w * 0.045); x.lineJoin = 'round'; x.beginPath(); x.moveTo(tx, by - h); x.lineTo(mid - w * 0.1, by - sh); x.lineTo(cx - w * 0.08, by); x.stroke(); x.restore();
  t4Ink(x, s, col);
  return s;
}
function t4CoilRing(xb, xf, cx, cy, rx, ry, w, col) {
  t4EllStroke(xb, cx, cy, rx, ry, twSh(col, 0.2), w, Math.PI, Math.PI * 2);
  t4EllStroke(xf, cx, cy, rx, ry, col, w, 0, Math.PI);
  xf.save(); xf.strokeStyle = 'rgba(255,255,255,0.75)'; xf.lineWidth = Math.max(0.7, w * 0.3); xf.lineCap = 'round'; xf.beginPath(); xf.ellipse(cx, cy - w * 0.15, rx, ry, 0, Math.PI * 0.55, Math.PI * 0.85); xf.stroke(); xf.restore();
  [0.25, 0.75].forEach(function (q) { t4Stud(xf, cx + Math.cos(q * Math.PI) * rx, cy + Math.sin(q * Math.PI) * ry, w * 0.9, '#8fe6ff'); });
}
function t4Bolt(x, x0, y0, x1, y1, n, jit, lw, col) {
  var dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  x.beginPath(); x.moveTo(x0, y0);
  for (var i = 1; i < n; i++) { var q = i / n, o = (Math.random() - 0.5) * jit; x.lineTo(x0 + dx * q + nx * o, y0 + dy * q + ny * o); }
  x.lineTo(x1, y1);
  x.lineJoin = 'miter'; x.strokeStyle = col || 'rgba(140,170,255,0.55)'; x.lineWidth = lw * 2.4; x.stroke(); x.strokeStyle = 'rgba(245,250,255,0.95)'; x.lineWidth = lw; x.stroke();
}
TW_EXT.fz_storm = {
  spr: function (L, B, S) {
    return t4Spr('fz_storm', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var by = t4Base(xb, xf, gx, gy, u, L, rnd, T4C.navy, '#c9a8ff'), col = '#8f7cf0', H = u * (1.0 + L * 0.13), n = 2 + L, i, rw = Math.max(1.8, u * 0.05);
      // 뒤쪽 수정
      [[-0.3, 0.44, 0.15, -0.16], [0.3, 0.48, 0.15, 0.14]].forEach(function (c) { t4Crystal(xb, gx + c[0] * u, by + u * 0.02, c[2] * u, c[1] * u, '#7a8cf5', c[3], '#8fe6ff'); });
      // L3: 양옆 보조 첨탑(꼭대기 작은 구슬에서 본체로 번개가 이어짐)
      P.py = [];
      if (L >= 3) [-1, 1].forEach(function (sd) { var px = gx + sd * u * 0.5, pb = by + u * 0.1; t4Cyl(xb, px, pb - u * 0.08, u * 0.09, u * 0.05, u * 0.08, T4C.gold, { metal: 1, top: '#fff0a8' }); t4Crystal(xb, px, pb - u * 0.07, u * 0.13, u * 0.56, '#7fc4ff', sd * 0.03, '#ffffff'); P.py.push([(px + sd * u * 0.017 - gx) / u, (pb - u * 0.7 - gy) / u]); });
      t4Cyl(xb, gx, by - u * 0.07, u * 0.25, u * 0.14, u * 0.08, T4C.gold, { metal: 1, top: '#fff0a8' });
      P.rings = [];
      for (i = 0; i < n; i++) { var q = (i + 0.9) / (n + 0.9), cy = by - u * 0.08 - H * q * 0.8, rx = u * lerp(0.42, 0.19, q); P.rings.push([(cy - gy) / u, rx / u]); }
      P.rings.forEach(function (r) { t4EllStroke(xb, gx, gy + r[0] * u, r[1] * u, r[1] * u * 0.36, twSh('#ffb84a', 0.25), rw, Math.PI, Math.PI * 2); });
      t4Crystal(xb, gx, by - u * 0.06, u * 0.36, H, col, 0, '#7fe0ff');
      xb.save(); xb.globalCompositeOperation = 'lighter'; glowAt(xb, gx, by - H * 0.5, u * 0.3, '#b9a2ff', 0.4); xb.restore();
      // 꼭대기 금 발톱(L2부터 구슬을 받침)
      var ty = by - u * 0.06 - H;
      if (L >= 2) [-1, 1].forEach(function (sd) { var s = shp(), p = s.p; p.moveTo(gx + sd * u * 0.05, ty + u * 0.2); p.quadraticCurveTo(gx + sd * u * 0.26, ty + u * 0.06, gx + sd * u * 0.17, ty - u * 0.2); p.quadraticCurveTo(gx + sd * u * 0.17, ty + u * 0.04, gx + sd * u * 0.02, ty + u * 0.12); p.closePath(); s.ext(gx - u * 0.26, ty - u * 0.2); s.ext(gx + u * 0.26, ty + u * 0.2); twFill(xb, s, T4C.gold, { hi: 0.6, lo: 0.3 }); t4Ink(xb, s, T4C.goldD, TW_IW * 0.8); });
      P.rings.forEach(function (r) { var cy = gy + r[0] * u, rx = r[1] * u;
        t4EllStroke(xf, gx, cy, rx, rx * 0.36, '#ffc24a', rw, 0, Math.PI);
        xf.save(); xf.strokeStyle = 'rgba(255,255,255,0.85)'; xf.lineWidth = Math.max(0.8, rw * 0.3); xf.lineCap = 'round'; xf.beginPath(); xf.ellipse(gx, cy - rw * 0.15, rx, rx * 0.36, 0, Math.PI * 0.55, Math.PI * 0.85); xf.stroke(); xf.restore();
        if (T4_FINE) [0.22, 0.78].forEach(function (a) { t4Stud(xf, gx + Math.cos(a * Math.PI) * rx, cy + Math.sin(a * Math.PI) * rx * 0.36, rw * 0.9, '#8fe6ff'); }); });
      [[-0.37, 0.28, 0.13, -0.2], [0.37, 0.26, 0.12, 0.22]].forEach(function (c) { t4Crystal(xf, gx + c[0] * u, by + u * 0.13, c[2] * u, c[1] * u, '#a98bff', c[3], '#ffffff'); });
      P.oy = (ty - u * (0.13 + L * 0.02) - gy) / u; P.mounts = [[0, P.oy]]; P.or = 0.115 + L * 0.022; P.mid = (by - H * 0.5 - gy) / u;
      var R = Math.ceil(u * 0.55); P.orb = t4Piece(R * 2, R * 2, R, R, function (x, m) { TW_IW = Math.max(1, u * 0.02); twOrb(x, m, m, u * P.or, L >= 3 ? '#c9b4ff' : '#b9a2ff'); if (L >= 3) twStar(x, m, m, u * 0.06, '#fff6c0', 0); });
      P.shard = t4Piece(Math.ceil(u * 0.24), Math.ceil(u * 0.4), u * 0.12, u * 0.2, function (x, mx, my) { t4Crystal(x, mx, my + u * 0.15, u * 0.11, u * 0.3, '#8fe6ff', 0, '#ffffff'); });
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, aim = t4Aim(t), f = t4Fire(t), busy = t.busy || 0, id = t.id || 0, oy = Y + P.oy * S + Math.sin(time * 2.2 + id) * S * 0.03, i, q, L = t.lvl || 1, pw = 0.5 + 0.5 * Math.max(f, busy), lw = Math.max(1, S * 0.014);
    t4Halo(x, t, X, Y, S, time, '#c9a8ff');
    // 떠 있는 수정 조각: L1 둘, L2 넷, L3 여섯(두 궤도). 첨탑 뒤로 돌아간 것은 가림
    var ns = L * 2, my = Y + P.mid * S;
    for (i = 0; i < ns; i++) { var hi = i % 2 && L >= 2, sa = time * (hi ? -1.1 : 0.9) + i * Math.PI * 2 / ns + id, R = S * (hi ? 0.5 : 0.62), cx = Math.cos(sa) * R, sn = Math.sin(sa); if (sn < 0 && Math.abs(cx) < S * 0.24) continue; x.drawImage(P.shard.c, X + cx - P.shard.ax, (hi ? oy + S * 0.22 : my) + sn * R * 0.3 + Math.sin(time * 3 + i) * S * 0.02 - P.shard.ay); }
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
    // 층층이 도는 번개 고리(강화할수록 겹이 늘고 밝아짐)
    var gl = glowSpr('#bfe0ff', 24);
    for (i = 0; i < P.rings.length; i++) {
      var r = P.rings[i], cy = Y + r[0] * S, rx = r[1] * S * 1.05, a0 = time * (2.6 + i * 0.8) * (i % 2 ? -1 : 1) + i * 2, len = 1.2 + pw * 0.9 + L * 0.2;
      for (q = 0; q < (pw > 0.75 || (L >= 2 && i % 2 === 0) ? 2 : 1); q++) { var a = a0 + q * Math.PI; x.beginPath(); x.ellipse(X, cy, rx, rx * 0.36, 0, a, a + len);
        if (!q) { x.strokeStyle = 'rgba(120,170,255,' + (0.5 * pw) + ')'; x.lineWidth = Math.max(2.4, S * 0.085); x.stroke(); } x.beginPath(); x.ellipse(X, cy, rx, rx * 0.36, 0, a + len * 0.35, a + len); x.strokeStyle = 'rgba(245,250,255,' + (0.55 + 0.45 * pw) + ')'; x.lineWidth = Math.max(1, S * 0.024); x.stroke();
        var hd = (i % 2 ? a : a + len); t4Add(x, gl, X + Math.cos(hd) * rx, cy + Math.sin(hd) * rx * 0.36, S * 0.11, 0.95); x.globalAlpha = 1; }
      // 고리 사이를 타고 오르는 불꽃
      if (i + 1 < P.rings.length && (Math.floor(time * 9) + i + id) % 3 === 0) { var r2 = P.rings[i + 1], ja = Math.random() * Math.PI; t4Bolt(x, X + Math.cos(ja) * rx, cy + Math.sin(ja) * rx * 0.36, X + Math.cos(ja) * r2[1] * S, Y + r2[0] * S + Math.sin(ja) * r2[1] * S * 0.36, 3, S * 0.06, lw * 0.7); }
    }
    // 보조 첨탑 → 구슬
    for (i = 0; i < P.py.length; i++) { var px = X + P.py[i][0] * S, py = Y + P.py[i][1] * S; t4Add(x, glowSpr('#9fe6ff', 24), px, py, S * 0.13, 0.9); x.globalAlpha = 1; if ((Math.floor(time * 12) + i) % 2 || f > 0) t4Bolt(x, px, py, X, oy, 5, S * 0.12, lw * 0.9); }
    t4Add(x, glowSpr('#b9a2ff', 64), X, oy, S * (0.44 + 0.08 * L + 0.34 * Math.max(f, busy)), 0.75); x.globalAlpha = 1;
    // 꼭대기 방전: 표적 쪽 큰 가지 번개 + 사방 잔가지 + 충격 고리
    if (f > 0) {
      var an = aim + (Math.random() - 0.5) * 0.25, len2 = S * (0.75 + 0.15 * L) * (0.45 + 0.55 * f), ex = X + Math.cos(an) * len2, ey = oy + Math.sin(an) * len2 * 0.8, mx2 = (X + ex) / 2, my2 = (oy + ey) / 2;
      t4Bolt(x, X, oy, ex, ey, 7, S * 0.2, lw * 1.6);
      for (i = 0; i < 2; i++) { var fa = an + (i ? 0.7 : -0.7); t4Bolt(x, mx2, my2, mx2 + Math.cos(fa) * len2 * 0.45, my2 + Math.sin(fa) * len2 * 0.36, 4, S * 0.1, lw); }
      for (i = 0; i < 1 + L; i++) { var ra = Math.random() * Math.PI * 2, rl = S * (0.25 + Math.random() * 0.2); t4Bolt(x, X, oy, X + Math.cos(ra) * rl, oy + Math.sin(ra) * rl * 0.8, 3, S * 0.08, lw * 0.7); }
      t4Add(x, glowSpr('#ffffff', 48), X, oy, S * (0.2 + 0.3 * f), f); t4Add(x, gl, ex, ey, S * 0.2, f);
      x.globalAlpha = f; x.strokeStyle = '#d8ccff'; x.lineWidth = Math.max(1.5, S * 0.05 * f); x.beginPath(); x.ellipse(X, oy, S * (0.2 + 0.6 * (1 - f)), S * (0.12 + 0.34 * (1 - f)), 0, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
    } else if (g && Math.random() < 0.3) { var a2 = Math.random() * Math.PI * 2, l2 = S * (0.2 + Math.random() * 0.14); t4Bolt(x, X, oy, X + Math.cos(a2) * l2, oy + Math.sin(a2) * l2, 3, S * 0.07, lw * 0.7); }
    x.restore();
    x.drawImage(P.orb.c, X - P.orb.ax, oy - P.orb.ay);
    if (L >= 3) { x.save(); x.strokeStyle = '#ffe680'; x.lineWidth = Math.max(1, S * 0.022); x.beginPath(); x.ellipse(X, oy, S * (P.or + 0.1), S * (P.or + 0.1) * 0.32, Math.sin(time * 1.3) * 0.35, 0, Math.PI * 2); x.stroke(); x.restore(); }
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 5. 빙염탑 (서리탑 + 화염탑): 얼음 결정 첨탑 + 불타는 화로 탑, 가운데 금 고리 안에서 두 기운이 소용돌이
// =====================================================================
function t4Swirl(u) {
  var R = Math.ceil(u * 0.3);
  return t4Piece(R * 2, R * 2, R, R, function (x, m) {
    var r = u * 0.2;
    [['#6fd8ff', '#e8fbff', 0], ['#ff8a3a', '#fff0a0', Math.PI]].forEach(function (c) {
      x.save(); x.translate(m, m); x.rotate(c[2]);
      var s = shp(), p = s.p; p.moveTo(0, -r); p.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false); p.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true); p.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2, false); p.closePath(); s.ext(-r, -r); s.ext(r, r);
      var g = x.createRadialGradient(r * 0.3, 0, r * 0.05, 0, 0, r); g.addColorStop(0, c[1]); g.addColorStop(1, c[0]); x.fillStyle = g; x.fill(s.p);
      x.fillStyle = c[1]; x.beginPath(); x.arc(0, r / 2, r * 0.17, 0, Math.PI * 2); x.fill();
      x.restore();
    });
    x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = Math.max(1, u * 0.014); x.beginPath(); x.arc(m, m, r, 0, Math.PI * 2); x.stroke();
  });
}
TW_EXT.fz_frostfire = {
  spr: function (L, B, S) {
    return t4Spr('fz_frostfire', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var by = t4Base(xb, xf, gx, gy, u, L, rnd, T4C.navy, '#8fe6ff'), hI = u * (1.0 + L * 0.07), hF = u * (0.72 + L * 0.05), ix = gx - u * 0.2, fx = gx + u * 0.22, i;
      // 얼음 쪽: 눈 둔덕 + 결정 무리
      t4Ell(xb, ix - u * 0.02, by + u * 0.02, u * 0.27, u * 0.12, '#eaf8ff', { hi: 0.5, lo: 0.2 });
      t4Crystal(xb, ix - u * 0.19, by + u * 0.03, u * 0.14, u * 0.52, '#8fd4ff', -0.2, '#ffffff');
      t4Crystal(xb, ix + u * 0.1, by, u * 0.13, u * 0.46, '#7fc4ff', 0.1, '#ffffff');
      t4Crystal(xb, ix, by + u * 0.02, u * 0.26, hI, '#6fc4ff', -0.02, '#f2fdff');
      if (L >= 2) t4Crystal(xb, ix - u * 0.12, by - hI * 0.42, u * 0.09, u * 0.3, '#a8e4ff', -0.45, '#ffffff');
      // 불 쪽: 용암 금이 간 검붉은 탑 + 큰 화로
      var top = by - hF, fc = '#b4533f';
      t4Cyl(xb, fx, top, u * 0.15, u * 0.085, hF, fc, { bands: [0.08, 0.9], bandH: 0.22, deco: function (x, s) {
        if (T4_FINE) twCylBricks(x, s, fx, top, u * 0.15, u * 0.085, hF, fc, 6, 3, rnd);
        x.lineCap = 'round'; x.lineJoin = 'round';
        for (var q = 0; q < 2; q++) { x.beginPath(); var px = fx - u * 0.06 + q * u * 0.09, py = top + hF * (0.2 + q * 0.1); x.moveTo(px, py); for (var k = 0; k < 5; k++) { px += (rnd() - 0.5) * u * 0.09; py += hF * 0.13; x.lineTo(px, py); } x.strokeStyle = '#ff7a2a'; x.lineWidth = Math.max(1.4, u * 0.03); x.stroke(); x.strokeStyle = '#ffe680'; x.lineWidth = Math.max(0.7, u * 0.012); x.stroke(); }
      } });
      t4Ell(xb, fx, by + u * 0.03, u * 0.2, u * 0.08, '#6a3a4a', { hi: 0.2 });
      twBrazier(xb, fx, top - u * 0.09, u * (0.2 + L * 0.012), '#ff9a4a', '#e8a04a');
      if (L >= 3) [-1, 1].forEach(function (sd) { t4Limb(xb, fx + sd * u * 0.14, top + u * 0.1, fx + sd * u * 0.3, top - u * 0.08, u * 0.05, u * 0.03, T4C.gold); t4Stud(xb, fx + sd * u * 0.31, top - u * 0.11, u * 0.04, '#ff7a4a'); });
      // 가운데 금 고리(앞)
      var cy = by - u * 0.44, r = u * 0.2;
      xf.save(); xf.fillStyle = 'rgba(40,30,80,0.82)'; xf.beginPath(); xf.arc(gx, cy, r, 0, Math.PI * 2); xf.fill(); xf.restore();
      t4EllStroke(xb, gx, cy, r * 1.14, r * 1.14, T4C.gold, Math.max(1.6, u * 0.055));
      for (i = 0; i < 4; i++) { var a = i * Math.PI / 2 + Math.PI / 4; t4Stud(xb, gx + Math.cos(a) * r * 1.14, cy + Math.sin(a) * r * 1.14, u * 0.034, i % 2 ? '#8fe6ff' : '#ff8a4a'); }
      // 고리는 뒤 그림에(소용돌이가 그 위에), 어두운 속은 뒤 그림으로 옮김
      xb.save(); xb.fillStyle = '#2c2456'; xb.beginPath(); xb.arc(gx, cy, r, 0, Math.PI * 2); xb.fill(); xb.restore(); xf.clearRect(gx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);
      P.cy = (cy - gy) / u; P.mounts = [[0, P.cy]]; P.ice = [(ix - u * 0.02 * hI / u - gx) / u, (by + u * 0.02 - hI - gy) / u]; P.fire = [(fx - gx) / u, (top - u * 0.16 - gy) / u];
      P.swirl = t4Swirl(u);
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, f = t4Fire(t), cy = Y + P.cy * S, sh = (t.shots || 0) % 2, L = t.lvl || 1, i, id = t.id || 0;
    t4Halo(x, t, X, Y, S, time, (Math.floor(time * 0.5) % 2) ? '#ffc27a' : '#9fe0ff');
    // 소용돌이
    var sc = 1 + 0.25 * f + 0.05 * Math.sin(time * 3);
    x.save(); x.translate(X, cy); x.rotate(time * (2.4 + (t.busy || 0) * 3) + f * 2); x.scale(sc, sc); x.drawImage(P.swirl.c, -P.swirl.ax, -P.swirl.ay); x.restore();
    x.save(); x.globalCompositeOperation = 'lighter';
    // 화로 불꽃
    var fx = X + P.fire[0] * S, fy = Y + P.fire[1] * S, fl = (f > 0 && sh ? 1.5 : 1) * (0.2 + L * 0.015);
    for (i = 0; i < 4; i++) { var ph = time * 9 + i * 1.7 + id, sz = S * fl * (1 - i * 0.14); t4Add(x, glowSpr(i < 2 ? '#ffc040' : '#ff6a4a', 48), fx + Math.sin(ph) * S * 0.025, fy - sz * (0.3 + i * 0.42) - Math.abs(Math.sin(ph * 1.3)) * S * 0.04, sz, 0.6 - i * 0.1); }
    // 얼음 빛과 눈가루
    var ixp = X + P.ice[0] * S, iy = Y + P.ice[1] * S, pu = 0.5 + 0.5 * Math.sin(time * 2.6 + id);
    t4Add(x, glowSpr('#9fe6ff', 48), ixp, iy + S * 0.1, S * (0.28 + (f > 0 && !sh ? 0.25 * f : 0)), 0.55 + 0.3 * pu);
    t4Add(x, glowSpr('#ffffff', 24), ixp, iy, S * (0.07 + 0.05 * pu), 0.9);
    x.globalAlpha = 0.9; x.fillStyle = '#f2fdff';
    for (i = 0; i < 5; i++) { var q = (time * 0.35 + i * 0.2 + id * 0.13) % 1; x.beginPath(); x.arc(ixp + Math.sin(i * 2.4 + time) * S * 0.2, iy + q * S * 0.9, S * 0.016, 0, Math.PI * 2); x.fill(); }
    // 가운데 빛, 쏠 때 파동 고리
    t4Add(x, glowSpr(sh ? '#ffb04a' : '#8fe6ff', 48), X, cy, S * (0.3 + 0.4 * f), 0.45 + 0.5 * f);
    if (f > 0) { var e = 1 - f; x.globalAlpha = f; x.strokeStyle = sh ? '#ffb04a' : '#bff0ff'; x.lineWidth = Math.max(1.5, S * 0.05 * f); x.beginPath(); x.ellipse(X, cy + S * 0.1, S * (0.25 + 0.7 * e), S * (0.2 + 0.4 * e), 0, 0, Math.PI * 2); x.stroke(); }
    x.restore();
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 6. 강철 비 (기관포탑 + 다연장 로켓): 장갑 포탑 + 양옆 개틀링 + 위쪽 로켓 발사함
// =====================================================================
function t4ArsGuns(u, L, fr) {
  var W = Math.ceil(u * 1.9);
  return t4Piece(W, W, W / 2, W / 2, function (x, m) {
    var bc = '#c8964e';
    [-1, 1].forEach(function (sd) {
      var gy = m + sd * u * 0.34;
      // 총열 다발(도는 모습: 장마다 밝은 줄 자리가 다름)
      for (var b = 0; b < 3; b++) { var oy = gy + (b - 1) * u * 0.048; t4Metal(x, shp().rrect(m + u * 0.08, oy - u * 0.021, u * 0.56, u * 0.042, u * 0.02), b === fr ? '#e4ebff' : '#8f9cd0', 1, TW_IW * 0.6); }
      t4Metal(x, shp().rrect(m + u * 0.34, gy - u * 0.09, u * 0.05, u * 0.18, u * 0.02), T4C.gold, 1, TW_IW * 0.7);
      t4Metal(x, shp().rrect(m + u * 0.58, gy - u * 0.095, u * 0.07, u * 0.19, u * 0.03), T4C.steelL, 1, TW_IW * 0.7);
      t4RR(x, m - u * 0.16, gy - u * 0.12, u * 0.3, u * 0.24, u * 0.06, T4C.gun, { hi: 0.4 });
      t4RR(x, m - u * 0.2, gy - u * 0.08, u * 0.08, u * 0.16, u * 0.03, '#e8b23a', { hi: 0.5 });
      // 탄띠
      x.fillStyle = '#ffd24a'; for (var q = 0; q < 4; q++) twPill(x, m - u * 0.08 + q * u * 0.055, gy - sd * u * 0.15, u * 0.035, u * 0.07);
    });
    // 가운데 장갑 몸통
    t4RR(x, m - u * 0.3, m - u * 0.24, u * 0.52, u * 0.48, u * 0.08, bc, { hi: 0.4, lo: 0.3 });
    t4Poly(x, [[m + u * 0.2, m - u * 0.22], [m + u * 0.36, m - u * 0.1], [m + u * 0.36, m + u * 0.1], [m + u * 0.2, m + u * 0.22]], twSh(bc, 0.1), { hi: 0.4 });
    t4Rivets(x, [[m - u * 0.25, m - u * 0.19], [m - u * 0.25, m + u * 0.19], [m + u * 0.16, m - u * 0.19], [m + u * 0.16, m + u * 0.19]], Math.max(0.8, u * 0.013), bc);
    if (L >= 3) [-1, 1].forEach(function (sd) { t4Poly(x, [[m - u * 0.34, m + sd * u * 0.2], [m - u * 0.5, m + sd * u * 0.3], [m - u * 0.3, m + sd * u * 0.06]], T4C.gold, { hi: 0.55 }); });
  });
}
function t4ArsPod(u, L) {
  var W = Math.ceil(u * 1.2), n = L >= 2 ? 4 : 3;
  return t4Piece(W, W, W / 2, W / 2, function (x, m) {
    var bw = u * 0.5, bh = u * (L >= 2 ? 0.42 : 0.36), x0 = m - u * 0.26, col = '#e0683e';
    t4RR(x, x0 - u * 0.04, m - bh * 0.34, u * 0.08, bh * 0.68, u * 0.02, T4C.gunD);
    t4RR(x, x0, m - bh / 2, bw, bh, u * 0.05, col, { hi: 0.42, lo: 0.3 });
    t4Hazard(x, shp().rrect(x0 + u * 0.05, m - bh / 2 + u * 0.012, u * 0.07, bh - u * 0.024, u * 0.01), '#ffcf3f', '#3f4688', u * 0.03);
    for (var i = 0; i < n; i++) {
      var cy = m - bh / 2 + bh * (i + 0.5) / n, th = bh / n, nx = x0 + bw - u * 0.06, hw = th * 0.32;
      x.fillStyle = rgba('#5a2030', 0.55); x.fillRect(x0 + u * 0.15, cy - th * 0.5, bw - u * 0.2, Math.max(0.8, u * 0.01));
      var ms = shp(); ms.p.moveTo(nx, cy - hw); ms.p.lineTo(nx + u * 0.07, cy - hw); ms.p.quadraticCurveTo(nx + u * 0.15, cy - hw * 0.5, nx + u * 0.17, cy); ms.p.quadraticCurveTo(nx + u * 0.15, cy + hw * 0.5, nx + u * 0.07, cy + hw); ms.p.lineTo(nx, cy + hw); ms.p.closePath(); ms.ext(nx, cy - hw); ms.ext(nx + u * 0.17, cy + hw);
      twFill(x, ms, '#fff2d8', { hi: 0.3, lo: 0.3 }); x.save(); x.clip(ms.p); x.fillStyle = '#ffb13a'; x.fillRect(nx + u * 0.08, cy - th, u * 0.1, th * 2); x.restore(); t4Ink(x, ms, '#e08a3a', TW_IW * 0.7);
    }
    t4RR(x, x0 + bw - u * 0.085, m - bh / 2 - u * 0.012, u * 0.045, bh + u * 0.024, u * 0.02, T4C.gold, { hi: 0.55 });
    twShine(x, x0 + u * 0.22, m - bh * 0.33, u * 0.06, u * 0.018, 0.7, 0);
  });
}
TW_EXT.fz_arsenal = {
  spr: function (L, B, S) {
    return t4Spr('fz_arsenal', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var by = t4Base(xb, xf, gx, gy, u, L, rnd, T4C.navy, '#ffb13a'), h1 = u * 0.34, t1 = by - h1, top = t1 - u * 0.16, col = '#d2a25c';
      // 뒤 안테나
      t4Limb(xb, gx + u * 0.3, t1 + u * 0.05, gx + u * 0.36, t1 - u * (0.6 + L * 0.06), u * 0.035, u * 0.02, T4C.steel, 0); t4Ell(xb, gx + u * 0.362, t1 - u * (0.62 + L * 0.06), u * 0.035, u * 0.035, T4C.red, { hi: 0.5 });
      t4Cyl(xb, gx, t1, u * 0.43, u * 0.24, h1, col, { bands: [0.0, 0.8], bandH: 0.1, bandCol: T4C.gun, top: '#ecd09a', deco: function (x, s) {
        x.strokeStyle = rgba(t4InkC(col), T4_FINE ? 0.5 : 0); x.lineWidth = Math.max(0.8, u * 0.012);
        for (var i = 1; i < 7; i++) { var px = gx - u * 0.43 * Math.cos(i / 7 * Math.PI); x.beginPath(); x.moveTo(px, t1); x.lineTo(px, t1 + h1 + u * 0.25); x.stroke(); }
        // 탄띠(황동 탄알 줄)
        for (var q = 0; q < 11; q += T4_FINE ? 1 : 2) { var a = Math.PI * (0.08 + q * 0.084), bx = gx + Math.cos(a) * u * 0.43, byy = t1 + h1 * 0.5 + Math.sin(a) * u * 0.24; x.fillStyle = t4InkC('#ffd24a'); twPill(x, bx, byy, u * 0.05, u * 0.105); x.fillStyle = '#ffd24a'; twPill(x, bx, byy, u * 0.032, u * 0.088); x.fillStyle = '#fff3b0'; twPill(x, bx - u * 0.006, byy - u * 0.015, u * 0.012, u * 0.04); }
      } });
      t4Cyl(xb, gx, top, u * 0.3, u * 0.17, u * 0.16, T4C.gun, { metal: 1, bands: [0.55], bandH: 0.12, top: '#7c86c0' });
      // 앞 탄통 둘
      [-1, 1].forEach(function (sd) { var px = gx + sd * u * 0.44, py = by - u * 0.14; t4Cyl(xf, px, py, u * 0.1, u * 0.055, u * 0.2, '#7f8fd0', { metal: 1, bands: [0.2, 0.7], bandH: 0.3, top: '#c4d3f2' }); t4Stud(xf, px, py + u * 0.13, u * 0.035, T4C.red); });
      if (L >= 2) t4Hazard(xf, shp().rrect(gx - u * 0.16, by + u * 0.0, u * 0.32, u * 0.05, u * 0.02), '#ffcf3f', '#3f4688', u * 0.04);
      P.my = (top - u * 0.1 - gy) / u; P.mounts = [[0, P.my - 0.16]];
      P.guns = [t4ArsGuns(u, L, 0), t4ArsGuns(u, L, 1), t4ArsGuns(u, L, 2)]; P.gunsD = t4Dark(P.guns[0], '#34376e');
      P.pod = t4ArsPod(u, L); P.podD = t4Dark(P.pod, '#5a2a3a');
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, aim = t4Aim(t), f = t4Fire(t), mx = X, my = Y + P.my * S, ca = Math.cos(aim), sa = Math.sin(aim), i;
    t4Halo(x, t, X, Y, S, time, '#ffc27a');
    var fr = t.spin ? Math.floor(t.spin * 4) % 3 : (f > 0 ? Math.floor(time * 30) % 3 : 0); if (fr < 0) fr += 3;
    var sk = f > 0 ? (Math.random() - 0.5) * S * 0.03 : 0;
    t4Rot(x, P.gunsD, mx, my + S * 0.07, aim); t4Rot(x, P.guns[fr], mx + sk, my, aim);
    var rec = f > 0.5 ? (f - 0.5) * 2 * S * 0.07 : 0, px = mx - ca * rec, py = my - S * 0.17 - sa * rec * 0.78;
    t4Rot(x, P.podD, px, py + S * 0.1, aim); t4Rot(x, P.pod, px, py, aim);
    if (f > 0) {
      x.save(); x.globalCompositeOperation = 'lighter';
      var fl = glowSpr('#ffd27a', 32);
      for (i = -1; i <= 1; i += 2) if ((Math.floor(time * 28) + (i > 0)) % 2) t4Add(x, fl, mx + (ca * 0.72 - sa * 0.34 * i) * S, my + (sa * 0.72 + ca * 0.34 * i) * S * 0.78, S * (0.14 + Math.random() * 0.08), 1);
      if (f > 0.5) { var k = (f - 0.5) * 2; t4Add(x, glowSpr('#ff8a3a', 48), px + ca * S * 0.5, py + sa * S * 0.39, S * (0.2 + 0.25 * k), k); t4Add(x, softSpr('#ffffff', 32), px - ca * S * 0.4, py - sa * S * 0.31, S * 0.26, 0.6 * k); }
      x.restore();
    }
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 물 위 합체 탑 공통: 물결, 금빛 물 고리
// =====================================================================
function t4Water(xb, gx, cy, u, rx, ry, L) {
  xb.save(); xb.translate(gx, cy); xb.scale(1, ry / rx); glowAt(xb, 0, 0, rx * 1.1, T4C.gold, 0.14 + L * 0.05); xb.restore();
  xb.save(); xb.fillStyle = 'rgba(24,52,110,0.28)'; xb.beginPath(); xb.ellipse(gx + u * 0.04, cy + u * 0.05, rx * 0.95, ry * 0.8, 0, 0, Math.PI * 2); xb.fill();
  // 선체 둘레 흰 거품 띠 + 바깥 잔물결 호 + 금빛 호(합체 표식)
  xb.lineCap = 'round'; xb.strokeStyle = 'rgba(255,255,255,0.8)'; xb.lineWidth = Math.max(1.4, u * 0.04); xb.beginPath(); xb.ellipse(gx, cy + u * 0.03, rx * 0.9, ry * 0.72, 0, 0.12, Math.PI - 0.12); xb.stroke();
  xb.strokeStyle = 'rgba(255,255,255,0.5)'; xb.lineWidth = Math.max(1, u * 0.022);
  [[0.3, 1.2], [1.7, 2.75], [3.5, 4.1], [5.3, 5.9]].forEach(function (a) { xb.beginPath(); xb.ellipse(gx, cy + u * 0.03, rx * 1.04, ry * 1.02, 0, a[0], a[1]); xb.stroke(); });
  xb.strokeStyle = rgba(T4C.gold, 0.75); xb.lineWidth = Math.max(1, u * 0.02);
  [[0.75, 1.5], [2.1, 2.6], [4.5, 5.0]].forEach(function (a) { xb.beginPath(); xb.ellipse(gx, cy + u * 0.03, rx * 1.16, ry * 1.2, 0, a[0], a[1]); xb.stroke(); });
  xb.restore();
}
// =====================================================================
// 7. 항공모함 (전함 + 비행장): 3/4 시점 비행 갑판 + 함교 + 갑판 위 함재기
// =====================================================================
function t4Jet(u, col) {
  var W = Math.ceil(u * 0.44);
  return t4Piece(W, W, W / 2, W / 2, function (x, m) {
    var iw = TW_IW; TW_IW = Math.max(0.8, u * 0.014);
    t4Poly(x, [[m + u * 0.02, m], [m - u * 0.1, m - u * 0.15], [m - u * 0.15, m - u * 0.15], [m - u * 0.08, m], [m - u * 0.15, m + u * 0.15], [m - u * 0.1, m + u * 0.15]], col, { hi: 0.4 });
    t4Poly(x, [[m - u * 0.12, m], [m - u * 0.18, m - u * 0.07], [m - u * 0.2, m - u * 0.07], [m - u * 0.17, m], [m - u * 0.2, m + u * 0.07], [m - u * 0.18, m + u * 0.07]], twSh(col, 0.15), { hi: 0.3 });
    var b = shp(); b.p.moveTo(m - u * 0.18, m - u * 0.03); b.p.lineTo(m + u * 0.08, m - u * 0.035); b.p.quadraticCurveTo(m + u * 0.19, m, m + u * 0.08, m + u * 0.035); b.p.lineTo(m - u * 0.18, m + u * 0.03); b.p.closePath(); b.ext(m - u * 0.18, m - u * 0.035); b.ext(m + u * 0.19, m + u * 0.035);
    twFill(x, b, '#eef2fb', { hi: 0.3, lo: 0.3 }); t4Ink(x, b, '#8fa6d6');
    x.fillStyle = '#4fc8ff'; twPill(x, m + u * 0.06, m, u * 0.07, u * 0.035); x.fillStyle = T4C.red; x.beginPath(); x.arc(m - u * 0.07, m - u * 0.09, u * 0.016, 0, Math.PI * 2); x.arc(m - u * 0.07, m + u * 0.09, u * 0.016, 0, Math.PI * 2); x.fill();
    TW_IW = iw;
  });
}
TW_EXT.fz_carrier = {
  spr: function (L, B, S) {
    return t4Spr('fz_carrier', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var oy = gy - u * 0.04, hc = '#8fb0dc', dk = '#55679c', q;
      function PT(a, b) { return [gx + a * u, oy + b * u]; }
      function PL(c, pts, close) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); if (close) c.closePath(); }
      t4Water(xb, gx, oy - u * 0.02, u, u * 0.9, u * 0.3, L);
      // 높은 선체 옆면 + 어두운 뱃머리 면
      var hull = shp().poly([PT(-0.8, -0.38), PT(0.54, -0.38), PT(0.86, -0.54), PT(0.74, -0.18), PT(0.48, 0.02), PT(-0.7, 0.02)]);
      twFill(xb, hull, hc, { hi: 0.34, lo: 0.3 });
      xb.save(); xb.clip(hull.p);
      xb.fillStyle = rgba(twSh(hc, 0.6), 0.5); PL(xb, [PT(0.54, -0.38), PT(0.86, -0.54), PT(0.74, -0.18), PT(0.48, 0.02)], 1); xb.fill();
      xb.fillStyle = '#e0504e'; xb.fillRect(gx - u, oy - u * 0.075, u * 2, u * 0.12); xb.fillStyle = 'rgba(255,255,255,0.5)'; xb.fillRect(gx - u, oy - u * 0.09, u * 2, u * 0.018);
      xb.fillStyle = 'rgba(255,255,255,0.3)'; xb.fillRect(gx - u, oy - u * 0.38, u * 2, u * 0.06);
      for (q = 0; q < 6; q++) { var hx = gx - u * 0.62 + q * u * 0.2; xb.fillStyle = '#2f3a6a'; xb.beginPath(); xb.arc(hx, oy - u * 0.21, u * 0.036, 0, Math.PI * 2); xb.fill(); xb.fillStyle = '#ffe680'; xb.beginPath(); xb.arc(hx, oy - u * 0.21, u * 0.02, 0, Math.PI * 2); xb.fill(); }
      xb.restore(); t4Ink(xb, hull, hc);
      // 비행 갑판
      var deck = shp().poly([PT(-0.84, -0.38), PT(0.56, -0.38), PT(0.9, -0.55), PT(0.66, -0.84), PT(-0.62, -0.84)]);
      twFill(xb, deck, dk, { hi: 0.36, lo: 0.08 });
      xb.save(); xb.clip(deck.p);
      xb.fillStyle = 'rgba(255,255,255,0.16)'; PL(xb, [PT(-0.84, -0.38), PT(-0.16, -0.38), PT(0.12, -0.84), PT(-0.62, -0.84)], 1); xb.fill();
      xb.strokeStyle = '#ffffff'; xb.lineWidth = Math.max(1.2, u * 0.028); xb.setLineDash([u * 0.11, u * 0.07]); PL(xb, [PT(-0.74, -0.61), PT(0.82, -0.61)]); xb.stroke(); xb.setLineDash([]);
      xb.strokeStyle = '#ffd24a'; xb.lineWidth = Math.max(1, u * 0.022); PL(xb, [PT(-0.78, -0.42), PT(0.34, -0.8)]); xb.stroke();
      if (T4_FINE) { xb.strokeStyle = 'rgba(255,255,255,0.7)'; xb.lineWidth = Math.max(0.8, u * 0.012); for (q = 0; q < 3; q++) { PL(xb, [PT(-0.7 + q * 0.07, -0.4), PT(-0.56 + q * 0.07, -0.82)]); xb.stroke(); } }
      xb.restore(); t4Ink(xb, deck, dk);
      // 금테(합체 표식)와 가장자리 등
      xb.save(); xb.lineJoin = 'round'; PL(xb, [PT(-0.84, -0.38), PT(0.56, -0.38), PT(0.9, -0.55)]); xb.strokeStyle = t4InkC(T4C.gold); xb.lineWidth = Math.max(1.6, u * 0.04) + TW_IW; xb.stroke(); xb.strokeStyle = T4C.gold; xb.lineWidth = Math.max(1.6, u * 0.04); xb.stroke(); xb.restore();
      for (q = 0; q < 5; q++) { var lp = PT(-0.52 + q * 0.27, -0.84); xb.fillStyle = q % 2 ? '#8fe6ff' : '#ffe680'; xb.beginPath(); xb.arc(lp[0], lp[1], Math.max(1, u * 0.022), 0, Math.PI * 2); xb.fill(); }
      if (L >= 3) { var fh = PT(0.9, -0.55); t4Wing(xb, fh[0] - u * 0.08, fh[1] + u * 0.06, -1, u * 0.3, u, T4C.gold, 2); twGem(xb, fh[0] + u * 0.01, fh[1] - u * 0.03, u * 0.065, '#8fe6ff'); }
      // 뱃머리 물보라
      xb.fillStyle = 'rgba(255,255,255,0.9)'; [[0.62, 0.0, 0.07], [0.72, -0.06, 0.055], [0.52, 0.04, 0.05]].forEach(function (w) { var wp = PT(w[0], w[1]); xb.beginPath(); xb.ellipse(wp[0], wp[1], u * w[2], u * w[2] * 0.6, 0, 0, Math.PI * 2); xb.fill(); });
      // 높은 함교(앞 그림)
      var ix = gx + u * 0.1, ib = oy - u * 0.33, ic = '#a9c0e6';
      t4Box(xf, ix, ib, u * 0.4, u * 0.27, u * 0.11, u * 0.075, ic);
      t4Hazard(xf, shp().rrect(ix, ib - u * 0.055, u * 0.4, u * 0.05, u * 0.01), '#ffcf3f', '#3f4688', u * 0.04);
      xf.fillStyle = '#ffe680'; for (q = 0; q < 4; q++) xf.fillRect(ix + u * 0.05 + q * u * 0.085, ib - u * 0.19, u * 0.05, u * 0.06);
      t4Box(xf, ix + u * 0.05, ib - u * 0.27, u * 0.3, u * 0.2, u * 0.09, u * 0.06, '#c4d6f2');
      var win = shp().rrect(ix + u * 0.07, ib - u * 0.43, u * 0.26, u * 0.085, u * 0.03); xf.fillStyle = '#2f3a6a'; xf.fill(win.p); xf.fillStyle = T4C.cyan; for (q = 0; q < 3; q++) xf.fillRect(ix + u * 0.085 + q * u * 0.082, ib - u * 0.415, u * 0.065, u * 0.055); t4Ink(xf, win, ic, TW_IW * 0.7);
      if (L >= 2) { t4Box(xf, ix + u * 0.1, ib - u * 0.47, u * 0.18, u * 0.11, u * 0.06, u * 0.04, T4C.gold); }
      t4Cyl(xf, ix + u * 0.4, ib - u * 0.5, u * 0.06, u * 0.034, u * 0.2, '#55608c', { metal: 1, bands: [0.0], bandH: 0.5, bandCol: T4C.red, top: '#2f3a6a' });
      var mt = ib - u * (0.86 + L * 0.05); t4Limb(xf, ix + u * 0.19, ib - u * 0.46, ix + u * 0.19, mt, u * 0.05, u * 0.032, T4C.steel, 0);
      t4Line(xf, ix + u * 0.1, ib - u * 0.7, ix + u * 0.28, ib - u * 0.7, Math.max(1, u * 0.022), T4C.steel);
      var fg = shp().poly([[ix + u * 0.19, mt + u * 0.04], [ix + u * 0.02, mt + u * 0.09], [ix + u * 0.19, mt + u * 0.14]]); twFill(xf, fg, L >= 2 ? T4C.gold : T4C.red, { hi: 0.4 }); t4Ink(xf, fg, T4C.red, TW_IW * 0.6);
      var gp = PT(0.66, -0.62); t4Ell(xb, gp[0], gp[1], u * 0.08, u * 0.05, '#2f3a6a', { hi: 0.2 });
      P.gun = [(gp[0] - gx) / u, (gp[1] - u * 0.035 - gy) / u]; P.rad = [(ix + u * 0.19 - gx) / u, (mt - u * 0.06 - gy) / u];
      P.mounts = [[-0.2, (oy - u * 0.7 - gy) / u]];
      P.jets = [[-0.5, -0.69, -0.06], [-0.3, -0.5, -0.36], [-0.1, -0.7, -0.06], [-0.6, -0.48, -0.36]].slice(0, 1 + L).map(function (j) { return [j[0], (oy + j[1] * u - gy) / u, j[2]]; });
      P.jet = t4Jet(u * 1.2, '#4f8ef0'); P.jetD = t4Dark(P.jet, '#1c2450', 0.45);
      P.rf = t4RadarPanel(u * 0.6, 1, 0); P.rb = t4RadarPanel(u * 0.6, 1, 1);
      P.ciws = t4Piece(Math.ceil(u * 0.6), Math.ceil(u * 0.6), u * 0.3, u * 0.3, function (x, m) { [-1, 1].forEach(function (sd) { t4Metal(x, shp().rrect(m, m + sd * u * 0.035 - u * 0.018, u * 0.24, u * 0.036, u * 0.014), T4C.gunD, 1, TW_IW * 0.6); }); t4Ell(x, m, m, u * 0.085, u * 0.085, '#eef2fb', { hi: 0.4, lo: 0.3 }); t4Ell(x, m - u * 0.01, m, u * 0.035, u * 0.035, T4C.red, { hi: 0.4 }); });
      var cp = PT(0.74, -0.62); P.cat = [(cp[0] - gx) / u, (cp[1] - gy) / u]; P.lane = (oy - u * 0.61 - gy) / u;
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, aim = t4Aim(t), f = t4Fire(t), i, id = t.id || 0;
    t4Halo(x, t, X, Y - S * 0.06, S, time, '#9fe0ff', 0.88);
    // 함재기(나가 있으면 빈 갑판에 유도등이 흐름)
    if (!t.out) for (i = 0; i < P.jets.length; i++) { var j = P.jets[i], jx = X + j[0] * S, jy = Y + j[1] * S; t4Rot(x, P.jetD, jx + S * 0.025, jy + S * 0.045, j[2], 0.62); t4Rot(x, P.jet, jx, jy, j[2], 0.62); }
    else { x.save(); x.globalCompositeOperation = 'lighter'; for (i = 0; i < 5; i++) { var q = (time * 1.4 + i * 0.2) % 1; t4Add(x, glowSpr('#ffe680', 16), X + (-0.7 + q * 1.4) * S, Y + P.lane * S, S * 0.06, 1 - q); } x.restore(); }
    var gx2 = X + P.gun[0] * S, gy2 = Y + P.gun[1] * S; t4Rot(x, P.ciws, gx2, gy2, aim);
    x.save(); x.globalCompositeOperation = 'lighter';
    if (f > 0) { if (Math.floor(time * 26) % 2) t4Add(x, glowSpr('#ffd27a', 32), gx2 + Math.cos(aim) * S * 0.28, gy2 + Math.sin(aim) * S * 0.22, S * 0.15, 1); x.globalCompositeOperation = 'source-over'; t4Add(x, softSpr('#ffffff', 32), X + P.cat[0] * S, Y + P.cat[1] * S - S * 0.12 * (1 - f), S * (0.12 + 0.22 * (1 - f)), 0.7 * f); x.globalCompositeOperation = 'lighter'; }
    if (Math.sin(time * 4 + id) > 0.2) t4Add(x, glowSpr('#ff5a6e', 16), X + P.rad[0] * S, Y + P.rad[1] * S - S * 0.12, S * 0.08, 0.9);
    x.restore();
    t4Spin(x, P.rf, P.rb, X + P.rad[0] * S, Y + P.rad[1] * S, time * 2.2 + id);
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 8. 화룡선 (거북선 + 신기전 화차): 용머리 둘 + 등에 신기전 발사틀을 얹은 큰 거북선
// =====================================================================
function t4DragonHead(u, L, open) {
  var W = Math.ceil(u * 0.9);
  return t4Piece(W, W, u * 0.3, W / 2, function (x, ox, oy) {
    var c = '#ffc23a', jaw = open ? 0.42 : 0.08;
    // 갈기(붉은 불꽃 모양)
    for (var i = 0; i < 4; i++) t4Poly(x, [[ox - u * 0.02 - i * u * 0.035, oy - u * 0.1 + i * u * 0.05], [ox - u * 0.2 - i * u * 0.02, oy - u * 0.17 + i * u * 0.09], [ox - u * 0.04 - i * u * 0.03, oy + i * u * 0.06]], i % 2 ? '#ff8a3a' : '#e8483e', { hi: 0.4 });
    // 뿔
    [[-0.02, -0.2, -0.16, -0.3], [0.05, -0.2, 0.0, -0.33]].forEach(function (h) { t4Limb(x, ox + h[0] * u, oy + h[1] * u + u * 0.08, ox + h[2] * u, oy + h[3] * u, u * 0.05, u * 0.018, '#fff2c8'); });
    // 아래턱
    x.save(); x.translate(ox + u * 0.02, oy + u * 0.03); x.rotate(jaw);
    var lj = shp(), p = lj.p; p.moveTo(-u * 0.04, 0); p.lineTo(u * 0.3, -u * 0.01); p.quadraticCurveTo(u * 0.36, u * 0.03, u * 0.3, u * 0.07); p.quadraticCurveTo(u * 0.1, u * 0.12, -u * 0.04, u * 0.08); p.closePath(); lj.ext(-u * 0.04, -u * 0.01); lj.ext(u * 0.36, u * 0.12);
    twFill(x, lj, twSh(c, 0.1), { hi: 0.3 }); t4Ink(x, lj, c);
    x.fillStyle = '#fffaf0'; for (var q = 0; q < 3; q++) { x.beginPath(); x.moveTo(u * (0.1 + q * 0.07), 0); x.lineTo(u * (0.125 + q * 0.07), -u * 0.045); x.lineTo(u * (0.15 + q * 0.07), 0); x.closePath(); x.fill(); }
    x.restore();
    if (open) { x.fillStyle = '#7a1c2c'; x.beginPath(); x.moveTo(ox + u * 0.04, oy + u * 0.03); x.lineTo(ox + u * 0.32, oy + u * 0.0); x.lineTo(ox + u * 0.3, oy + u * 0.13); x.closePath(); x.fill(); t4Glow(x, ox + u * 0.26, oy + u * 0.06, u * 0.16, '#ffb04a', 0.9); }
    // 윗머리와 주둥이
    var hd = shp(); p = hd.p; p.moveTo(ox - u * 0.1, oy + u * 0.04); p.quadraticCurveTo(ox - u * 0.14, oy - u * 0.16, ox + u * 0.02, oy - u * 0.17); p.quadraticCurveTo(ox + u * 0.12, oy - u * 0.16, ox + u * 0.18, oy - u * 0.1); p.quadraticCurveTo(ox + u * 0.3, oy - u * 0.13, ox + u * 0.37, oy - u * 0.06); p.quadraticCurveTo(ox + u * 0.4, oy, ox + u * 0.34, oy + u * 0.03); p.lineTo(ox + u * 0.02, oy + u * 0.05); p.closePath(); hd.ext(ox - u * 0.14, oy - u * 0.17); hd.ext(ox + u * 0.4, oy + u * 0.05);
    twFill(x, hd, c, { hi: 0.5, lo: 0.25 }); t4Ink(x, hd, c);
    x.fillStyle = '#fffaf0'; for (q = 0; q < 3; q++) { x.beginPath(); x.moveTo(ox + u * (0.14 + q * 0.07), oy + u * 0.03); x.lineTo(ox + u * (0.165 + q * 0.07), oy + u * 0.075); x.lineTo(ox + u * (0.19 + q * 0.07), oy + u * 0.03); x.closePath(); x.fill(); }
    // 눈, 콧구멍, 수염
    t4Ell(x, ox + u * 0.06, oy - u * 0.075, u * 0.05, u * 0.045, '#ffffff', { hi: 0.1, lo: 0.05 }); x.fillStyle = '#b01c3c'; x.beginPath(); x.ellipse(ox + u * 0.072, oy - u * 0.072, u * 0.026, u * 0.032, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(ox + u * 0.064, oy - u * 0.084, u * 0.01, 0, Math.PI * 2); x.fill();
    t4Line(x, ox + u * 0.0, oy - u * 0.13, ox + u * 0.13, oy - u * 0.105, u * 0.022, '#e8483e');
    x.fillStyle = '#7a3a1c'; x.beginPath(); x.ellipse(ox + u * 0.33, oy - u * 0.06, u * 0.015, u * 0.01, -0.3, 0, Math.PI * 2); x.fill();
    x.save(); x.strokeStyle = '#e8483e'; x.lineWidth = Math.max(1, u * 0.02); x.lineCap = 'round'; x.beginPath(); x.moveTo(ox + u * 0.34, oy - u * 0.02); x.quadraticCurveTo(ox + u * 0.46, oy - u * 0.1, ox + u * 0.42, oy - u * 0.2); x.stroke(); x.restore();
    twShine(x, ox - u * 0.02, oy - u * 0.12, u * 0.04, u * 0.02, 0.7);
  });
}
function t4Rack(u, L) {
  var W = Math.ceil(u * 0.9), H = Math.ceil(u * 0.8), cols = 3 + L, rows = 2 + (L >= 2 ? 1 : 0);
  return t4Piece(W, H, u * 0.3, u * 0.62, function (x, ox, oy) {
    var bl = [ox - u * 0.06, oy - u * 0.04], br = [ox + u * 0.36, oy - u * 0.12], tr = [ox + u * 0.24, oy - u * 0.48], tl = [ox - u * 0.18, oy - u * 0.4], ex = [-u * 0.12, u * 0.07];
    // 다리와 옆면
    t4Limb(x, ox - u * 0.12, oy - u * 0.28, ox - u * 0.2, oy + u * 0.0, u * 0.05, u * 0.05, T4C.woodD); t4Limb(x, ox + u * 0.18, oy - u * 0.14, ox + u * 0.16, oy + u * 0.02, u * 0.05, u * 0.05, T4C.wood);
    t4Poly(x, [tl, [tl[0] + ex[0], tl[1] + ex[1]], [bl[0] + ex[0], bl[1] + ex[1]], bl], T4C.woodD, { hi: 0.2 });
    t4Poly(x, [bl, [bl[0] + ex[0], bl[1] + ex[1]], [br[0] + ex[0], br[1] + ex[1]], br], twSh(T4C.woodD, 0.2), { hi: 0.1 });
    var face = t4Poly(x, [bl, br, tr, tl], '#c0503a', { hi: 0.4, lo: 0.25 });
    // 화살 구멍과 불화살 촉
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var a = (c + 0.5) / cols, b = (r + 0.5) / rows, px = lerp(lerp(bl[0], br[0], a), lerp(tl[0], tr[0], a), b), py = lerp(lerp(bl[1], br[1], a), lerp(tl[1], tr[1], a), b), rr = u * 0.34 / cols * 0.36;
      x.fillStyle = '#3a1a2a'; x.beginPath(); x.ellipse(px, py, rr, rr * 0.9, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ffd24a'; x.beginPath(); x.moveTo(px + rr * 1.5, py - rr * 1.4); x.lineTo(px + rr * 0.3, py - rr * 0.5); x.lineTo(px - rr * 0.4, py + rr * 0.3); x.lineTo(px + rr * 0.5, py - rr * 0.1); x.closePath(); x.fill();
    }
    x.save(); x.strokeStyle = t4InkC(T4C.gold); x.lineWidth = Math.max(1.2, u * 0.03) + TW_IW; x.stroke(face.p); x.strokeStyle = T4C.gold; x.lineWidth = Math.max(1.2, u * 0.03); x.stroke(face.p); x.restore();
  });
}
TW_EXT.fz_dragonship = {
  spr: function (L, B, S) {
    return t4Spr('fz_dragonship', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var U = u, GX = gx; u = u * 0.8; gx -= U * 0.13; var oy = gy - U * 0.08, wc = '#a8663e', sc = '#4fa272', q;
      function PT(a, b) { return [gx + a * u, oy + b * u]; }
      t4Water(xb, gx - u * 0.04, oy + u * 0.03, u, u * 0.92, u * 0.28, L);
      // 노
      for (q = 0; q < 4; q++) t4Limb(xb, gx - u * 0.5 + q * u * 0.3, oy - u * 0.14, gx - u * 0.62 + q * u * 0.3, oy + u * 0.16, u * 0.03, u * 0.045, '#e8c08a');
      // 용 목 둘(뒤 그림)
      var n1 = PT(0.78, -0.98), n2 = PT(0.96, -0.62);
      t4Limb(xb, gx + u * 0.62, oy - u * 0.4, n1[0], n1[1], u * 0.17, u * 0.12, '#4fa272'); t4Limb(xb, gx + u * 0.72, oy - u * 0.3, n2[0], n2[1], u * 0.16, u * 0.11, '#5fb282');
      [[0.62, -0.4, n1], [0.72, -0.3, n2]].forEach(function (nk) { for (var i = 1; i < 4; i++) { var a = i / 4, px = lerp(gx + nk[0] * u, nk[2][0], a), py = lerp(oy + nk[1] * u, nk[2][1], a); t4Poly(xb, [[px - u * 0.09, py - u * 0.02], [px - u * 0.15, py - u * 0.09], [px - u * 0.05, py - u * 0.08]], '#e8483e', { hi: 0.4 }); xb.fillStyle = 'rgba(255,230,130,0.8)'; xb.beginPath(); xb.ellipse(px + u * 0.03, py + u * 0.02, u * 0.04, u * 0.02, -0.6, 0, Math.PI * 2); xb.fill(); } });
      // 선체
      var hull = shp(), p = hull.p, a0 = PT(-0.86, -0.34), a1 = PT(0.86, -0.34);
      p.moveTo(a0[0], a0[1]); p.lineTo(a1[0], a1[1]); p.quadraticCurveTo(gx + u * 0.84, oy + u * 0.0, gx + u * 0.56, oy + u * 0.08); p.lineTo(gx - u * 0.6, oy + u * 0.08); p.quadraticCurveTo(gx - u * 0.84, oy + u * 0.02, a0[0], a0[1]); p.closePath(); hull.ext(gx - u * 0.86, oy - u * 0.34); hull.ext(gx + u * 0.86, oy + u * 0.08);
      twFill(xb, hull, wc, { hi: 0.32, lo: 0.34 });
      xb.save(); xb.clip(hull.p); xb.strokeStyle = rgba('#4a2030', 0.45); xb.lineWidth = Math.max(0.8, u * 0.012); for (q = 1; q < 4; q++) { xb.beginPath(); xb.moveTo(gx - u, oy - u * 0.34 + q * u * 0.1); xb.quadraticCurveTo(gx, oy - u * 0.3 + q * u * 0.1, gx + u, oy - u * 0.34 + q * u * 0.1); xb.stroke(); }
      xb.fillStyle = '#d8504e'; xb.fillRect(gx - u, oy - u * 0.34, u * 2, u * 0.06); xb.restore(); t4Ink(xb, hull, wc);
      // 포문과 포구
      for (q = 0; q < 4; q++) { var gxp = gx - u * 0.5 + q * u * 0.3, gyp = oy - u * 0.16; t4RR(xb, gxp - u * 0.055, gyp - u * 0.05, u * 0.11, u * 0.1, u * 0.02, '#3a2030'); t4Ell(xb, gxp, gyp, u * 0.035, u * 0.035, T4C.gun, { hi: 0.5 }); xb.fillStyle = '#1c1430'; xb.beginPath(); xb.arc(gxp, gyp, u * 0.016, 0, Math.PI * 2); xb.fill(); }
      // 등딱지(육각 철갑 + 금 가시)
      var shl = shp(); p = shl.p; p.moveTo(a0[0] - u * 0.02, a0[1]); p.quadraticCurveTo(gx - u * 0.7, oy - u * 0.78, gx - u * 0.1, oy - u * 0.8); p.quadraticCurveTo(gx + u * 0.6, oy - u * 0.8, a1[0] + u * 0.02, a1[1]); p.closePath(); shl.ext(gx - u * 0.88, oy - u * 0.8); shl.ext(gx + u * 0.88, oy - u * 0.34);
      twFill(xb, shl, sc, { hi: 0.45, lo: 0.32 });
      xb.save(); xb.clip(shl.p); xb.strokeStyle = rgba('#1c4a3a', 0.6); xb.lineWidth = Math.max(0.9, u * 0.014);
      var hs = u * 0.115; for (var r = 0; r < 5; r++) for (var c = -8; c < 9; c++) { var hx = gx + c * hs * 1.5, hy = oy - u * 0.36 - r * hs * 0.87 * 1.0 - (c % 2 ? hs * 0.43 : 0); xb.beginPath(); for (var k = 0; k < 6; k++) { var an = k * Math.PI / 3; if (k) xb.lineTo(hx + Math.cos(an) * hs, hy + Math.sin(an) * hs * 0.5); else xb.moveTo(hx + hs, hy); } xb.closePath(); xb.stroke(); }
      xb.fillStyle = 'rgba(255,255,255,0.22)'; xb.beginPath(); xb.ellipse(gx - u * 0.3, oy - u * 0.66, u * 0.36, u * 0.07, -0.12, 0, Math.PI * 2); xb.fill(); xb.restore(); t4Ink(xb, shl, sc);
      for (q = 0; q < 9; q++) { var sx = gx - u * 0.68 + q * u * 0.17, sy = oy - u * 0.36 - Math.sin((q + 0.5) / 9 * Math.PI) * u * 0.36 * (q % 2 ? 0.55 : 0.95); if (Math.abs(sx - (gx - u * 0.2)) < u * 0.26 && sy < oy - u * 0.6) continue; t4Poly(xb, [[sx - u * 0.03, sy], [sx, sy - u * 0.085], [sx + u * 0.03, sy]], T4C.gold, { hi: 0.6 }); }
      // 금 뱃전 띠(합체 표식)
      xb.save(); xb.strokeStyle = t4InkC(T4C.gold); xb.lineWidth = Math.max(1.4, u * 0.04) + TW_IW; xb.lineCap = 'round'; xb.beginPath(); xb.moveTo(a0[0], a0[1]); xb.lineTo(a1[0], a1[1]); xb.stroke(); xb.strokeStyle = T4C.gold; xb.lineWidth = Math.max(1.4, u * 0.04); xb.stroke(); xb.restore();
      for (q = 0; q < 7; q++) t4Stud(xb, gx - u * 0.72 + q * u * 0.24, oy - u * 0.34, u * 0.028, q % 2 ? '#ff7a4a' : '#8fe6ff');
      // 꼬리 깃발
      if (L >= 2) { t4Limb(xb, gx - u * 0.8, oy - u * 0.36, gx - u * 0.86, oy - u * 0.86, u * 0.03, u * 0.02, T4C.woodD); var fg = shp().poly([[gx - u * 0.86, oy - u * 0.86], [gx - u * 0.6, oy - u * 0.8], [gx - u * 0.85, oy - u * 0.7]]); twFill(xb, fg, '#e8483e', { hi: 0.4 }); t4Ink(xb, fg, '#e8483e', TW_IW * 0.6); }
      P.heads = [[(n1[0] - GX) / U, (n1[1] - gy) / U, 1.0], [(n2[0] - GX) / U, (n2[1] - gy) / U, 0.85]];
      P.rk = [(gx - u * 0.24 - GX) / U, (oy - u * 0.74 - gy) / U]; P.mounts = [[-0.1, P.rk[1] - 0.3], [P.heads[0][0] + 0.3, P.heads[0][1]]];
      P.h0 = t4DragonHead(U * 0.9, L, 0); P.h1 = t4DragonHead(U * 0.9, L, 1); P.rack = t4Rack(U * 0.92, L);
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, f = t4Fire(t), i, id = t.id || 0, aim = t4Aim(t);
    t4Halo(x, t, X - S * 0.13, Y - S * 0.06, S, time, '#ffc27a', 0.8);
    // 신기전 발사틀: 쏠 때 뒤로 밀리고 불똥
    var kick = f > 0 ? Math.sin(f * Math.PI) * S * 0.06 : 0, rx = X + P.rk[0] * S - kick, ry = Y + P.rk[1] * S + kick * 0.5;
    x.drawImage(P.rack.c, rx - P.rack.ax, ry - P.rack.ay);
    // 용머리 둘: 쏠 때 입을 벌리고 불을 뿜음
    var open = f > 0.12, dir = Math.cos(aim) >= 0 ? 1 : -1; // 표적이 왼쪽이면 머리를 뒤로 돌림
    for (i = 0; i < 2; i++) {
      var h = P.heads[i], hx = X + h[0] * S - (dir < 0 ? S * 0.1 : 0), hy = Y + h[1] * S + Math.sin(time * 1.8 + i * 1.7 + id) * S * 0.025 - (dir < 0 ? S * 0.04 : 0), hs = open ? P.h1 : P.h0, rot = clamp(Math.sin(aim) * 0.35, -0.35, 0.35) + (open ? -0.12 : 0) + Math.sin(time * 1.1 + i) * 0.04;
      x.save(); x.translate(hx, hy); x.scale(dir * h[2], h[2]); x.rotate(rot); x.drawImage(hs.c, -hs.ax, -hs.ay); x.restore();
      if (open) { x.save(); x.globalCompositeOperation = 'lighter'; for (var q = 0; q < 4; q++) { var d = S * (0.34 + q * 0.16) * h[2], ph = time * 14 + q * 1.3 + i; t4Add(x, glowSpr(q < 2 ? '#ffd040' : '#ff6a3a', 48), hx + dir * Math.cos(rot) * d, hy + Math.sin(rot) * d + S * 0.05 + Math.sin(ph) * S * 0.02, S * (0.12 + q * 0.05) * (0.6 + f), 0.85 - q * 0.15); } x.restore(); }
    }
    if (f > 0) { x.save(); x.globalCompositeOperation = 'lighter'; t4Add(x, glowSpr('#ffb04a', 48), rx + S * 0.16, ry - S * 0.36, S * (0.2 + 0.3 * f), f); for (i = 0; i < 3; i++) t4Add(x, glowSpr('#fff0a0', 16), rx + S * (0.1 + Math.random() * 0.3), ry - S * (0.3 + Math.random() * 0.3), S * 0.05, 1); x.restore(); }
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 9. 천벌포 (관리자 전용): 상아빛 금 받침 + 위성 접시 + 하늘로 오르는 금빛 조준 광선 + 도는 위성
// =====================================================================
function t4Dish(u, L) {
  var W = Math.ceil(u * 1.5), H = Math.ceil(u * 1.3);
  return t4Piece(W, H, W / 2, u * 0.86, function (x, mx, my) {
    var rx = u * (0.5 + L * 0.03), ry = rx * 0.4, cy = my - u * 0.24;
    // 그릇 바깥(아래)
    var bowl = shp(), p = bowl.p; p.moveTo(mx - rx, cy); p.quadraticCurveTo(mx - rx * 0.8, cy + u * 0.34, mx, cy + u * 0.36); p.quadraticCurveTo(mx + rx * 0.8, cy + u * 0.34, mx + rx, cy); p.closePath(); bowl.ext(mx - rx, cy); bowl.ext(mx + rx, cy + u * 0.36);
    t4MetalG(x, bowl, '#f2e6cc'); x.save(); x.clip(bowl.p); x.strokeStyle = rgba('#c9a04a', 0.7); x.lineWidth = Math.max(0.8, u * 0.014); for (var i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(mx + i * rx * 0.27, cy); x.quadraticCurveTo(mx + i * rx * 0.2, cy + u * 0.2, mx + i * rx * 0.06, cy + u * 0.4); x.stroke(); } x.restore(); t4Ink(x, bowl, T4C.goldD);
    t4RR(x, mx - u * 0.08, cy + u * 0.3, u * 0.16, u * 0.12, u * 0.04, T4C.gold, { hi: 0.55 });
    // 안쪽 면
    var rim = shp().ell(mx, cy, rx, ry), g = x.createRadialGradient(mx - rx * 0.2, cy - ry * 0.2, rx * 0.05, mx, cy, rx); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#d8f2ff'); g.addColorStop(1, '#7fbcf0'); x.fillStyle = g; x.fill(rim.p);
    x.save(); x.clip(rim.p); x.strokeStyle = T4_FINE ? 'rgba(80,130,210,0.5)' : 'rgba(80,130,210,0)'; x.lineWidth = Math.max(0.8, u * 0.012); for (var r = 1; r < 4; r++) { x.beginPath(); x.ellipse(mx, cy + ry * 0.12 * (3 - r) / 3, rx * r / 4, ry * r / 4, 0, 0, Math.PI * 2); x.stroke(); } for (var k = 0; k < 8; k++) { x.beginPath(); x.moveTo(mx, cy + ry * 0.1); x.lineTo(mx + Math.cos(k * Math.PI / 4) * rx, cy + Math.sin(k * Math.PI / 4) * ry); x.stroke(); } x.restore();
    x.save(); x.strokeStyle = t4InkC(T4C.gold); x.lineWidth = Math.max(1.6, u * 0.045) + TW_IW; x.stroke(rim.p); x.strokeStyle = T4C.gold; x.lineWidth = Math.max(1.6, u * 0.045); x.stroke(rim.p); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = Math.max(0.8, u * 0.014); x.beginPath(); x.ellipse(mx, cy - u * 0.008, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.6); x.stroke(); x.restore();
    for (k = 0; k < 6; k++) { var a = k * Math.PI / 3 + 0.5; t4Stud(x, mx + Math.cos(a) * rx, cy + Math.sin(a) * ry, u * 0.03, ['#ff6f9f', '#8fe6ff', '#a6ec5c'][k % 3]); }
    // 급전부(세 다리 + 빛나는 구슬)
    var fy = cy - u * 0.42;
    [[-0.62, 0.3], [0.62, 0.3], [0.0, -0.75]].forEach(function (q) { t4Line(x, mx + q[0] * rx, cy + q[1] * ry, mx, fy, Math.max(1.3, u * 0.028), T4C.steelL); });
    t4Glow(x, mx, fy, u * 0.26, '#ffe680', 0.8);
    twOrb(x, mx, fy, u * 0.075, '#ffd23a');
  });
}
function t4Sat(u) {
  var W = Math.ceil(u * 0.5);
  return t4Piece(W, W, W / 2, W / 2, function (x, m) {
    [-1, 1].forEach(function (sd) { var pn = shp().rrect(m + sd * u * 0.05 - (sd < 0 ? u * 0.14 : 0), m - u * 0.045, u * 0.14, u * 0.09, u * 0.015); twFill(x, pn, '#5f9ae8', { hi: 0.5 }); x.save(); x.clip(pn.p); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = Math.max(0.6, u * 0.008); for (var i = 1; i < 3; i++) { x.beginPath(); x.moveTo(pn.x0 + pn.w() * i / 3, pn.y0); x.lineTo(pn.x0 + pn.w() * i / 3, pn.y1); x.stroke(); } x.restore(); t4Ink(x, pn, '#5f9ae8', TW_IW * 0.6); });
    t4RR(x, m - u * 0.05, m - u * 0.06, u * 0.1, u * 0.12, u * 0.03, T4C.gold, { hi: 0.6 }); t4Ell(x, m, m + u * 0.07, u * 0.035, u * 0.02, '#fff6e8'); x.fillStyle = T4C.red; x.beginPath(); x.arc(m, m - u * 0.075, u * 0.016, 0, Math.PI * 2); x.fill();
  });
}
TW_EXT.omega = {
  spr: function (L, B, S) {
    return t4Spr('omega', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var by = t4Base(xb, xf, gx, gy, u, L, rnd, '#f4e4c4', '#ff6f9f'), h = u * 0.3, top = by - h, iv = '#fff3dc', i;
      // 금 날개 지느러미
      [-1, 1].forEach(function (sd) { t4Wing(xb, gx + sd * u * 0.24, top + u * 0.16, sd, u * (0.34 + L * 0.06), u, T4C.gold, 3); });
      t4Cyl(xb, gx, top, u * 0.3, u * 0.17, h, iv, { hi: 0.5, bands: [0.0, 0.42, 0.84], bandH: 0.14, top: '#ffffff' });
      // 무지개 보석 띠
      for (i = 0; i < 5; i++) { var a = Math.PI * (0.14 + i * 0.18); t4Stud(xb, gx + Math.cos(a) * u * 0.3, top + h * 0.3 + Math.sin(a) * u * 0.17, u * 0.036, ['#ff6f9f', '#ffb13a', '#a6ec5c', '#8fe6ff', '#b9a2ff'][i]); }
      // 조준 멍에(금 팔 둘) + 조준기
      var py = top - u * 0.4;
      [-1, 1].forEach(function (sd) { t4Limb(xb, gx + sd * u * 0.2, top, gx + sd * u * 0.36, py, u * 0.09, u * 0.06, T4C.gold); t4Ell(xb, gx + sd * u * 0.36, py, u * 0.06, u * 0.06, '#fff6e8', { hi: 0.4 }); t4Stud(xb, gx + sd * u * 0.36, py, u * 0.035, '#8fe6ff'); });
      t4Cyl(xb, gx, top - u * 0.1, u * 0.1, u * 0.055, u * 0.1, T4C.steel, { metal: 1 });
      if (L >= 2) { t4Limb(xf, gx - u * 0.42, by + u * 0.02, gx - u * 0.42, by - u * 0.3, u * 0.05, u * 0.04, iv); twGem(xf, gx - u * 0.42, by - u * 0.38, u * 0.05, '#8fe6ff'); t4Limb(xf, gx + u * 0.42, by + u * 0.02, gx + u * 0.42, by - u * 0.3, u * 0.05, u * 0.04, iv); twGem(xf, gx + u * 0.42, by - u * 0.38, u * 0.05, '#ff8fc0'); }
      P.py = (py - u * 0.02 - gy) / u; P.fy = -0.66; P.mounts = [[0, P.py - 0.66]];
      P.dish = t4Dish(u, L); P.sat = t4Sat(u);
      // 조준 광선(세로 빛기둥)
      P.beam = t4Piece(Math.ceil(u * 0.4), Math.ceil(u * 1.5), u * 0.2, u * 1.5, function (x, mx, my) {
        var g = x.createLinearGradient(0, my, 0, 0); g.addColorStop(0, 'rgba(255,220,90,0.95)'); g.addColorStop(0.5, 'rgba(255,220,90,0.5)'); g.addColorStop(1, 'rgba(255,220,90,0)');
        var gh = x.createLinearGradient(0, 0, u * 0.4, 0); gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(0.5, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gh; x.fillRect(0, 0, u * 0.4, my); x.globalCompositeOperation = 'source-in'; x.fillStyle = g; x.fillRect(0, 0, u * 0.4, my);
        x.globalCompositeOperation = 'source-over'; var gc = x.createLinearGradient(0, my, 0, 0); gc.addColorStop(0, 'rgba(255,255,255,0.95)'); gc.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gc; x.fillRect(mx - u * 0.02, 0, u * 0.04, my);
      });
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, aim = t4Aim(t), f = t4Fire(t), busy = t.busy || 0, L = t.lvl || 1, id = t.id || 0, py = Y + P.py * S, rot = Math.cos(aim) * 0.28 + Math.sin(time * 0.9 + id) * 0.03, i;
    t4Halo(x, t, X, Y, S, time, '#ffe680');
    // 도는 위성(뒤쪽 반)
    var sats = [];
    for (i = 0; i < L; i++) { var sa = time * 1.3 + i * Math.PI * 2 / L + id, sx = X + Math.cos(sa) * S * 0.78, sy = py - S * 0.5 + Math.sin(sa) * S * 0.2; sats.push([sx, sy, Math.sin(sa)]); if (Math.sin(sa) < 0) x.drawImage(P.sat.c, sx - P.sat.ax, sy - P.sat.ay); }
    var ca = Math.cos(rot), sr = Math.sin(rot);
    x.save(); x.translate(X, py); x.rotate(rot);
    x.drawImage(P.dish.c, -P.dish.ax, -P.dish.ay);
    // 금빛 조준 광선: 접시 급전부에서 하늘로
    x.globalCompositeOperation = 'lighter';
    var bw = 0.5 + 0.15 * Math.sin(time * 7) + busy * 0.5 + f * 2.2, fy = P.fy * S;
    x.globalAlpha = Math.min(1, 0.6 + 0.4 * f + 0.3 * busy); x.drawImage(P.beam.c, -P.beam.ax * bw, fy - P.beam.ay * (1 + 0.25 * f), P.beam.c.width * bw, P.beam.c.height * (1 + 0.25 * f));
    // 빛 알갱이가 타고 올라감
    var gs = glowSpr('#fff2a0', 16);
    for (i = 0; i < 4; i++) { var q = (time * 0.9 + i * 0.25) % 1; t4Add(x, gs, 0, fy - q * S * 1.3, S * 0.06, (1 - q) * 0.9); }
    x.globalAlpha = 1;
    if (f > 0) { t4Add(x, glowSpr('#ffffff', 64), 0, -S * 0.26, S * (0.5 + 0.5 * f), f); t4Add(x, glowSpr('#ffd23a', 64), 0, fy, S * (0.4 + 0.5 * f), f); x.globalAlpha = f; x.strokeStyle = '#fff2a0'; x.lineWidth = Math.max(1.5, S * 0.045 * f); x.beginPath(); x.ellipse(0, -S * 0.24, S * (0.5 + 0.5 * (1 - f)), S * (0.2 + 0.2 * (1 - f)), 0, 0, Math.PI * 2); x.stroke(); }
    x.restore();
    for (i = 0; i < sats.length; i++) if (sats[i][2] >= 0) x.drawImage(P.sat.c, sats[i][0] - P.sat.ax, sats[i][1] - P.sat.ay);
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 10. 수호룡 둥지 (관리자 전용): 바위 둥지 + 알 + 금은보화, 용이 집에 있으면 웅크리고 잠
// =====================================================================
function t4Rock(x, cx, cy, w, h, col, rnd) {
  var s = shp().blob([[cx - w * 0.5, cy], [cx - w * 0.46, cy - h * 0.7], [cx - w * 0.1, cy - h * (0.95 + rnd() * 0.1)], [cx + w * 0.38, cy - h * 0.8], [cx + w * 0.52, cy - h * 0.1], [cx + w * 0.2, cy + h * 0.12], [cx - w * 0.25, cy + h * 0.12]]);
  twFill(x, s, col, { hi: 0.4, lo: 0.34 });
  x.save(); x.clip(s.p); x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.ellipse(cx - w * 0.14, cy - h * 0.72, w * 0.26, h * 0.16, -0.3, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#ff8a3a'; x.lineWidth = Math.max(1, w * 0.035); x.lineCap = 'round'; x.beginPath(); x.moveTo(cx + w * 0.1, cy - h * 0.5); x.lineTo(cx + w * 0.2, cy - h * 0.25); x.lineTo(cx + w * 0.12, cy); x.stroke(); x.strokeStyle = '#ffe680'; x.lineWidth = Math.max(0.6, w * 0.013); x.stroke(); x.restore();
  t4Ink(x, s, col);
}
function t4Egg(x, cx, cy, r, col) {
  var s = shp(), p = s.p; p.moveTo(cx, cy - r * 1.3); p.bezierCurveTo(cx + r * 0.85, cy - r * 1.25, cx + r * 1.05, cy + r * 0.2, cx, cy + r * 0.75); p.bezierCurveTo(cx - r * 1.05, cy + r * 0.2, cx - r * 0.85, cy - r * 1.25, cx, cy - r * 1.3); p.closePath(); s.ext(cx - r, cy - r * 1.3); s.ext(cx + r, cy + r * 0.75);
  twFill(x, s, col, { hi: 0.5, lo: 0.3 }); x.save(); x.clip(s.p); x.fillStyle = '#ffd24a'; [[-0.3, -0.5, 0.16], [0.35, -0.1, 0.2], [-0.2, 0.25, 0.14], [0.2, -0.85, 0.12]].forEach(function (d) { x.beginPath(); x.arc(cx + d[0] * r, cy + d[1] * r, d[2] * r, 0, Math.PI * 2); x.fill(); }); x.restore();
  t4Ink(x, s, col); twShine(x, cx - r * 0.35, cy - r * 0.75, r * 0.2, r * 0.12, 0.85);
}
function t4Coins(x, cx, cy, w, h, n, rnd, u) {
  var m = shp().blob([[cx - w / 2, cy], [cx - w * 0.3, cy - h * 0.7], [cx, cy - h], [cx + w * 0.3, cy - h * 0.7], [cx + w / 2, cy], [cx, cy + h * 0.2]]); twFill(x, m, '#ffc93c', { hi: 0.55, lo: 0.35 }); t4Ink(x, m, T4C.goldD);
  x.save(); x.clip(m.p); for (var i = 0; i < n; i++) { var px = cx + (rnd() - 0.5) * w * 0.85, py = cy - rnd() * h * 0.85, r = u * 0.035; x.fillStyle = t4InkC(T4C.goldD); x.beginPath(); x.ellipse(px, py, r * 1.25, r * 0.75, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = rnd() < 0.5 ? '#ffe680' : '#ffd24a'; x.beginPath(); x.ellipse(px, py - r * 0.12, r, r * 0.55, 0, 0, Math.PI * 2); x.fill(); } x.restore();
}
// 용 머리(옆모습, 오른쪽): 붉은 금빛 서양 용. open이면 입을 벌림
function t4WyrmHead(x, ox, oy, u, awake, open, L) {
  var c = '#e8483e', p, q;
  [[-0.06, -0.1, -0.26, -0.22], [0.0, -0.11, -0.17, -0.3]].forEach(function (h) { t4Limb(x, ox + h[0] * u, oy + h[1] * u, ox + h[2] * u, oy + h[3] * u, u * 0.065, u * 0.018, '#ffd24a'); });
  // 볏(뒤통수 지느러미)
  t4Poly(x, [[ox - u * 0.12, oy - u * 0.08], [ox - u * 0.27, oy - u * 0.04], [ox - u * 0.16, oy + u * 0.02], [ox - u * 0.25, oy + u * 0.09], [ox - u * 0.1, oy + u * 0.06]], '#ffb13a', { hi: 0.5 });
  if (open) {
    x.save(); x.translate(ox - u * 0.02, oy + u * 0.04); x.rotate(0.5);
    var lj = shp(); p = lj.p; p.moveTo(-u * 0.06, -u * 0.02); p.lineTo(u * 0.27, -u * 0.02); p.quadraticCurveTo(u * 0.33, u * 0.02, u * 0.27, u * 0.06); p.quadraticCurveTo(u * 0.08, u * 0.1, -u * 0.06, u * 0.06); p.closePath(); lj.ext(-u * 0.06, -u * 0.02); lj.ext(u * 0.33, u * 0.1);
    twFill(x, lj, twSh(c, 0.12), { hi: 0.3 }); t4Ink(x, lj, c);
    x.fillStyle = '#fffaf0'; for (q = 0; q < 3; q++) { x.beginPath(); x.moveTo(u * (0.08 + q * 0.065), -u * 0.02); x.lineTo(u * (0.105 + q * 0.065), -u * 0.065); x.lineTo(u * (0.13 + q * 0.065), -u * 0.02); x.closePath(); x.fill(); }
    x.restore();
    x.fillStyle = '#7a1c2c'; x.beginPath(); x.moveTo(ox, oy + u * 0.04); x.lineTo(ox + u * 0.3, oy + u * 0.02); x.lineTo(ox + u * 0.25, oy + u * 0.17); x.closePath(); x.fill(); t4Glow(x, ox + u * 0.24, oy + u * 0.09, u * 0.17, '#ffb04a', 0.9);
  }
  var hd = shp(); p = hd.p; p.moveTo(ox - u * 0.14, oy + u * 0.02); p.quadraticCurveTo(ox - u * 0.17, oy - u * 0.14, ox - u * 0.02, oy - u * 0.15); p.quadraticCurveTo(ox + u * 0.1, oy - u * 0.14, ox + u * 0.16, oy - u * 0.08); p.quadraticCurveTo(ox + u * 0.3, oy - u * 0.09, ox + u * 0.33, oy - u * 0.01); p.quadraticCurveTo(ox + u * 0.33, oy + u * (open ? 0.04 : 0.07), ox + u * 0.2, oy + u * (open ? 0.05 : 0.08)); p.quadraticCurveTo(ox, oy + u * (open ? 0.08 : 0.12), ox - u * 0.14, oy + u * 0.02); p.closePath(); hd.ext(ox - u * 0.17, oy - u * 0.15); hd.ext(ox + u * 0.33, oy + u * 0.12);
  twFill(x, hd, c, { hi: 0.42, lo: 0.3 }); if (!open) { x.save(); x.clip(hd.p); x.fillStyle = '#ffc23a'; x.beginPath(); x.ellipse(ox + u * 0.1, oy + u * 0.1, u * 0.24, u * 0.05, -0.1, 0, Math.PI * 2); x.fill(); x.restore(); } t4Ink(x, hd, c);
  if (open) { x.fillStyle = '#fffaf0'; for (q = 0; q < 3; q++) { x.beginPath(); x.moveTo(ox + u * (0.12 + q * 0.065), oy + u * 0.045); x.lineTo(ox + u * (0.145 + q * 0.065), oy + u * 0.095); x.lineTo(ox + u * (0.17 + q * 0.065), oy + u * 0.04); x.closePath(); x.fill(); } }
  x.fillStyle = '#5a1420'; x.beginPath(); x.ellipse(ox + u * 0.29, oy - u * 0.03, u * 0.014, u * 0.01, 0, 0, Math.PI * 2); x.fill();
  if (awake) { t4Ell(x, ox + u * 0.045, oy - u * 0.06, u * 0.05, u * 0.042, '#ffe680', { hi: 0.3, lo: 0.05 }); x.fillStyle = '#3a1020'; x.beginPath(); x.ellipse(ox + u * 0.055, oy - u * 0.06, u * 0.014, u * 0.034, 0, 0, Math.PI * 2); x.fill(); t4Line(x, ox - u * 0.02, oy - u * 0.115, ox + u * 0.11, oy - u * 0.085, u * 0.022, '#b01c3c'); }
  else { x.save(); x.strokeStyle = '#5a1420'; x.lineWidth = Math.max(1, u * 0.018); x.lineCap = 'round'; x.beginPath(); x.moveTo(ox, oy - u * 0.05); x.quadraticCurveTo(ox + u * 0.04, oy - u * 0.02, ox + u * 0.085, oy - u * 0.05); x.stroke(); x.restore(); }
  if (L >= 3) twGem(x, ox - u * 0.04, oy - u * 0.14, u * 0.04, '#8fe6ff');
  twShine(x, ox - u * 0.06, oy - u * 0.1, u * 0.04, u * 0.018, 0.7);
}
// 펼친 날개 한 장(어깨 기준, 오른쪽 위로 뻗음)
function t4WyrmWing(u, L) {
  var k = 0.74 + (L - 1) * 0.07;
  return t4Piece(Math.ceil(u * 1.25), Math.ceil(u * 1.4), u * 0.14, u * 1.2, function (x, ox, oy) {
    function Q(a, b) { return [ox + a * u * k, oy + b * u * k]; }
    var el = Q(0.15, -0.44), tp = [Q(0.42, -0.98), Q(0.8, -0.74), Q(0.86, -0.3), Q(0.58, 0.02)], rt = Q(0.08, 0.1), s = shp(), p = s.p, i;
    p.moveTo(ox, oy); p.lineTo(el[0], el[1]); p.lineTo(tp[0][0], tp[0][1]);
    for (i = 0; i < 3; i++) { var a = tp[i], b = tp[i + 1]; p.quadraticCurveTo((a[0] + b[0]) / 2 - u * 0.1, (a[1] + b[1]) / 2 + u * 0.08, b[0], b[1]); }
    p.quadraticCurveTo((tp[3][0] + rt[0]) / 2, (tp[3][1] + rt[1]) / 2 - u * 0.1, rt[0], rt[1]); p.closePath(); s.ext(ox, oy - u * 1.1 * k); s.ext(ox + u * 0.9 * k, oy + u * 0.12);
    var g = x.createRadialGradient(el[0], el[1], u * 0.05, el[0], el[1], u * 0.8 * k); g.addColorStop(0, '#ff6f3a'); g.addColorStop(0.55, '#ffb13a'); g.addColorStop(1, '#ffe680'); x.fillStyle = g; x.fill(s.p); t4Ink(x, s, '#d85a2a');
    tp.forEach(function (e, j) { t4Line(x, el[0], el[1], e[0], e[1], Math.max(1.2, u * (0.04 - j * 0.004)), '#d8382e'); });
    t4Limb(x, ox, oy, el[0], el[1], u * 0.1, u * 0.065, '#d8382e');
    t4Poly(x, [[el[0] - u * 0.03, el[1] - u * 0.02], [el[0] - u * 0.02, el[1] - u * 0.16], [el[0] + u * 0.05, el[1] - u * 0.04]], '#fff2c8', { hi: 0.3 });
    if (L >= 2) tp.slice(0, 3).forEach(function (e) { t4Stud(x, e[0], e[1], u * 0.03, '#ffe680'); });
  });
}
// 둥지 위에 앉아 목을 든 용(오른쪽을 봄). 기준점 = 앉은 자리
function t4Wyrm(u, L, open) {
  return t4Piece(Math.ceil(u * 1.5), Math.ceil(u * 2.1), u * 0.72, u * 1.78, function (x, mx, my) {
    var c = '#e8483e', gd = '#ffc23a', i, p;
    function Q(a, b) { return [mx + a * u, my + b * u]; }
    // 꼬리: 둥지를 감아 앞으로
    var tl = shp(); p = tl.p; p.moveTo(mx - u * 0.2, my - u * 0.22); p.quadraticCurveTo(mx - u * 0.66, my - u * 0.12, mx - u * 0.52, my + u * 0.08); p.quadraticCurveTo(mx - u * 0.3, my + u * 0.24, mx + u * 0.2, my + u * 0.15); p.lineTo(mx + u * 0.3, my + u * 0.07); p.quadraticCurveTo(mx - u * 0.2, my + u * 0.1, mx - u * 0.36, my + u * 0.0); p.quadraticCurveTo(mx - u * 0.44, my - u * 0.08, mx - u * 0.2, my - u * 0.06); p.closePath(); tl.ext(mx - u * 0.66, my - u * 0.22); tl.ext(mx + u * 0.3, my + u * 0.24);
    twFill(x, tl, c, { hi: 0.35, lo: 0.3 }); t4Ink(x, tl, c);
    t4Poly(x, [[mx + u * 0.2, my + u * 0.04], [mx + u * 0.42, my + u * 0.08], [mx + u * 0.28, my + u * 0.24], [mx + u * 0.27, my + u * 0.13]], gd, { hi: 0.5 });
    // 목(S자) + 등 가시
    var nk = [[0.0, -0.5, 0.27], [-0.08, -0.8, 0.22], [0.02, -1.06, 0.19], [0.2, -1.2, 0.17]];
    for (i = 0; i < 3; i++) { var a = Q(nk[i][0], nk[i][1]), b = Q(nk[i + 1][0], nk[i + 1][1]); t4Poly(x, [[a[0] - u * 0.1, a[1] - u * 0.04], [(a[0] + b[0]) / 2 - u * 0.2, (a[1] + b[1]) / 2 - u * 0.02], [b[0] - u * 0.08, b[1] + u * 0.02]], '#ffd24a', { hi: 0.5 }); }
    for (i = 0; i < 3; i++) { var a2 = Q(nk[i][0], nk[i][1]), b2 = Q(nk[i + 1][0], nk[i + 1][1]); t4Limb(x, a2[0], a2[1], b2[0], b2[1], nk[i][2] * u, nk[i + 1][2] * u, c); }
    // 목 앞쪽 금 비늘
    for (i = 0; i < 5; i++) { var q = i / 4, sx = lerp(lerp(0.09, 0.02, q), lerp(0.1, 0.22, q), q), sy = lerp(-0.56, -1.12, q); x.fillStyle = t4InkC(gd); x.beginPath(); x.ellipse(mx + sx * u, my + sy * u, u * 0.062, u * 0.04, -0.5, 0, Math.PI * 2); x.fill(); x.fillStyle = gd; x.beginPath(); x.ellipse(mx + sx * u, my + sy * u, u * 0.048, u * 0.028, -0.5, 0, Math.PI * 2); x.fill(); }
    // 몸통(가슴을 편 자세) + 금 배
    var bd = shp().blob([Q(-0.36, -0.14), Q(-0.32, -0.5), Q(-0.1, -0.7), Q(0.18, -0.64), Q(0.32, -0.36), Q(0.26, -0.06), Q(0, 0.05)]);
    twFill(x, bd, c, { hi: 0.42, lo: 0.34 }); x.save(); x.clip(bd.p); x.fillStyle = gd; x.beginPath(); x.ellipse(mx + u * 0.2, my - u * 0.3, u * 0.14, u * 0.34, 0.12, 0, Math.PI * 2); x.fill(); x.strokeStyle = rgba('#b0702a', 0.65); x.lineWidth = Math.max(0.8, u * 0.012); for (i = 0; i < 6; i++) { x.beginPath(); x.moveTo(mx + u * 0.05, my - u * (0.56 - i * 0.1)); x.quadraticCurveTo(mx + u * 0.2, my - u * (0.52 - i * 0.1), mx + u * 0.36, my - u * (0.56 - i * 0.1)); x.stroke(); } x.restore(); t4Ink(x, bd, c);
    if (L >= 2) { t4EllStroke(x, mx + u * 0.02, my - u * 0.58, u * 0.2, u * 0.07, T4C.gold, Math.max(1.5, u * 0.045), -0.2, Math.PI + 0.2); t4Stud(x, mx + u * 0.1, my - u * 0.52, u * 0.045, '#8fe6ff'); }
    // 뒷다리와 발톱
    t4Ell(x, mx - u * 0.1, my - u * 0.13, u * 0.21, u * 0.18, twSh(c, 0.08), { hi: 0.35, lo: 0.3 });
    t4Ell(x, mx + u * 0.1, my + u * 0.03, u * 0.14, u * 0.065, c, { hi: 0.35 });
    for (i = 0; i < 3; i++) t4Poly(x, [[mx + u * (0.13 + i * 0.055), my + u * 0.02], [mx + u * (0.2 + i * 0.055), my + u * 0.085], [mx + u * (0.15 + i * 0.055), my + u * 0.07]], '#fff2c8', { hi: 0.3, iw: TW_IW * 0.6 });
    // 앞발
    t4Limb(x, mx + u * 0.22, my - u * 0.44, mx + u * 0.36, my - u * 0.24, u * 0.09, u * 0.065, c);
    for (i = 0; i < 2; i++) t4Poly(x, [[mx + u * (0.36 + i * 0.04), my - u * 0.25], [mx + u * (0.43 + i * 0.04), my - u * 0.19], [mx + u * (0.37 + i * 0.04), my - u * 0.2]], '#fff2c8', { hi: 0.3, iw: TW_IW * 0.6 });
    t4WyrmHead(x, mx + u * 0.27, my - u * 1.23, u * 1.2, 1, open, L);
  });
}
TW_EXT.dragon = {
  spr: function (L, B, S) {
    return t4Spr('dragon', L, S, function (xb, xf, gx, gy, u, L, rnd, P) {
      var rc = '#8f88b8', cy = gy - u * 0.14, i;
      twShadow(xb, gx + u * 0.1, gy + u * 0.05, u * 0.8, u * 0.37, 0.48);
      xb.save(); xb.translate(gx, gy); xb.scale(1, 0.56); glowAt(xb, 0, 0, u * 0.95, '#ffb13a', 0.36 + L * 0.08); xb.restore();
      // 금테 두른 바위 단(관리자 전용 표식) + 뒤 바위
      [[-0.54, -0.08, 0.34, 0.5], [-0.28, -0.22, 0.34, 0.66 + L * 0.05], [0.2, -0.24, 0.36, 0.6 + L * 0.04], [0.54, -0.1, 0.34, 0.48]].forEach(function (r) { t4Rock(xb, gx + r[0] * u, cy + r[1] * u + u * 0.2, r[2] * u, r[3] * u, rc, rnd); });
      t4Ell(xb, gx, cy + u * 0.03, u * 0.58, u * 0.3, '#7a5a4a', { hi: 0.2 });
      t4Ell(xb, gx, cy, u * 0.48, u * 0.23, '#4a3040', { hi: 0.1 });
      for (i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2, px = gx + Math.cos(a) * u * 0.53, py = cy + u * 0.03 + Math.sin(a) * u * 0.265; t4Limb(xb, px - Math.sin(a) * u * 0.09, py + Math.cos(a) * u * 0.05, px + Math.sin(a) * u * 0.09 + (rnd() - 0.5) * u * 0.05, py - Math.cos(a) * u * 0.05 - rnd() * u * 0.04, u * 0.045, u * 0.035, i % 3 ? '#c98a52' : '#e8b87a'); }
      t4EllStroke(xb, gx, cy + u * 0.03, u * 0.6, u * 0.315, T4C.gold, Math.max(1.4, u * 0.03), 0.1, Math.PI - 0.1);
      // 둥지 속 금화(용이 나가 있을 때 보임)
      t4Coins(xb, gx - u * 0.04, cy + u * 0.02, u * 0.6, u * 0.14, 16, rnd, u);
      // 발치의 금은보화(앞 그림): 양옆 금화 더미, 보석, 왕관, 알
      t4Rock(xf, gx - u * 0.56, cy + u * 0.36, u * 0.26, u * 0.22, twLt(rc, 0.1), rnd); t4Rock(xf, gx + u * 0.58, cy + u * 0.34, u * 0.24, u * 0.2, twLt(rc, 0.1), rnd);
      t4Coins(xf, gx - u * 0.3, cy + u * 0.36, u * (0.36 + L * 0.03), u * (0.15 + L * 0.03), 12 + L * 3, rnd, u);
      t4Coins(xf, gx + u * 0.3, cy + u * 0.36, u * (0.38 + L * 0.03), u * (0.13 + L * 0.03), 12 + L * 3, rnd, u);
      t4Egg(xf, gx - u * 0.06, cy + u * 0.36, u * 0.08, '#ff7a4a'); if (L >= 2) t4Egg(xf, gx + u * 0.1, cy + u * 0.38, u * 0.07, '#ffb13a'); if (L >= 3) t4Egg(xf, gx - u * 0.48, cy + u * 0.3, u * 0.07, '#ff5a8a');
      twGem(xf, gx - u * 0.32, cy + u * 0.25, u * 0.05, '#ff6f9f'); twGem(xf, gx + u * 0.4, cy + u * 0.27, u * 0.048, '#8fe6ff'); if (L >= 2) twGem(xf, gx + u * 0.22, cy + u * 0.22, u * 0.045, '#a6ec5c'); if (L >= 3) twGem(xf, gx - u * 0.18, cy + u * 0.24, u * 0.045, '#b9a2ff');
      var kx = gx + u * 0.26, ky = cy + u * 0.42; t4Poly(xf, [[kx - u * 0.08, ky], [kx - u * 0.095, ky - u * 0.1], [kx - u * 0.04, ky - u * 0.055], [kx, ky - u * 0.125], [kx + u * 0.04, ky - u * 0.055], [kx + u * 0.095, ky - u * 0.1], [kx + u * 0.08, ky]], '#ffe27a', { hi: 0.6 }); t4Stud(xf, kx, ky - u * 0.035, u * 0.025, '#ff6f9f');
      t4Crest(xf, gx, cy + u * 0.52, u, L, '#ff7a4a');
      P.cy = (cy - gy) / u; P.mounts = [[0.3, P.cy - 1.2]];
      P.b0 = t4Wyrm(u, L, 0); P.b1 = t4Wyrm(u, L, 1); P.wing = t4WyrmWing(u, L);
    });
  },
  parts: function (x, t, X, Y, S, time, info, g) {
    var P = info.P, f = t4Fire(t), id = t.id || 0, cy = Y + P.cy * S, i, aim = t4Aim(t), dir = Math.cos(aim) >= 0 ? 1 : -1;
    t4Halo(x, t, X, Y, S, time, '#ffc27a', 0.68);
    x.save(); x.globalCompositeOperation = 'lighter';
    if (!t.out) t4Add(x, glowSpr('#ffb13a', 64), X, cy - S * 0.6, S * (0.9 + 0.06 * Math.sin(time * 2 + id) + 0.2 * f), 0.4 + 0.3 * f);
    else for (i = 0; i < 3; i++) { var ph = (time * 0.7 + i * 0.33 + id * 0.1) % 1; t4Add(x, glowSpr('#fff2a0', 16), X + Math.sin(i * 5.3 + Math.floor(time * 0.7 + i * 0.33) * 2.1) * S * 0.26, cy - S * 0.04, S * 0.08 * Math.sin(ph * Math.PI), Math.sin(ph * Math.PI)); }
    x.restore();
    if (!t.out) {
      var br = 1 + Math.sin(time * 1.7 + id) * 0.02, fl = Math.sin(time * 2.3 + id) * 0.09 - f * 0.22, b = f > 0.05 ? P.b1 : P.b0, sy = cy + S * 0.08;
      x.save(); x.translate(X, sy); x.scale(dir, 1);
      // 날개 둘(몸 뒤): 천천히 퍼덕이고 쏠 때 활짝
      x.save(); x.translate(S * 0.04, -S * 0.6); x.rotate(-0.34 + fl); x.drawImage(P.wing.c, -P.wing.ax, -P.wing.ay); x.restore();
      x.save(); x.translate(-S * 0.16, -S * 0.56); x.scale(-1, 1); x.rotate(-0.3 + fl); x.drawImage(P.wing.c, -P.wing.ax, -P.wing.ay); x.restore();
      x.scale(1, br); x.drawImage(b.c, -b.ax, -b.ay);
      x.globalCompositeOperation = 'lighter';
      if (f > 0.05) for (i = 0; i < 4; i++) t4Add(x, glowSpr(i > 1 ? '#ff6a3a' : '#ffd040', 48), S * (0.74 + i * 0.16), -S * (1.1 - i * 0.03) + Math.sin(time * 14 + i) * S * 0.02, S * (0.12 + i * 0.055) * (0.6 + f), 0.9 - i * 0.17);
      else { var q = (time * 0.5 + id * 0.3) % 1; x.globalCompositeOperation = 'source-over'; t4Add(x, softSpr('#ffffff', 32), S * (0.66 + q * 0.08), -S * (1.26 + q * 0.2), S * (0.04 + 0.07 * q), 0.55 * (1 - q)); }
      x.restore();
      // 솟는 불티
      x.save(); x.globalCompositeOperation = 'lighter'; for (i = 0; i < 4; i++) { var e = (time * 0.45 + i * 0.25 + id * 0.07) % 1; t4Add(x, glowSpr(i % 2 ? '#ffd040' : '#ff8a3a', 16), X + Math.sin(i * 2.7 + id) * S * 0.5 + Math.sin(time * 2 + i) * S * 0.04, cy + S * 0.1 - e * S * 1.3, S * 0.05, (1 - e) * 0.9); } x.restore();
    }
    t4Frozen(x, t, X, Y, S);
  }
};

// =====================================================================
// 수호룡(아군 유닛): 위에서 본 붉은 금빛 서양식 날개 용, 오른쪽을 향함. 날갯짓 4장
// =====================================================================
function t4DragonTop(x, m, S, fl) {
  var sp = [1, 0.82, 0.56, 0.82][fl], sw = [0, 0.1, 0.2, 0.08][fl], c = '#e8483e', i;
  TW_IW = Math.max(1, S * 0.022);
  // 꼬리
  var ty = [0.03, 0, -0.03, 0][fl] * S, tl = shp(), p = tl.p; p.moveTo(m - S * 0.2, m - S * 0.08); p.quadraticCurveTo(m - S * 0.5, m - S * 0.05 + ty, m - S * 0.74, m + ty * 2); p.quadraticCurveTo(m - S * 0.5, m + S * 0.05 + ty, m - S * 0.2, m + S * 0.08); p.closePath(); tl.ext(m - S * 0.74, m - S * 0.1); tl.ext(m - S * 0.2, m + S * 0.1);
  twFill(x, tl, c, { hi: 0.35, lo: 0.3 }); t4Ink(x, tl, c);
  t4Poly(x, [[m - S * 0.7, m + ty * 2 - S * 0.07], [m - S * 0.86, m + ty * 2.4], [m - S * 0.7, m + ty * 2 + S * 0.07], [m - S * 0.75, m + ty * 2]], '#ffc23a', { hi: 0.5 });
  // 날개(박쥐 날개: 뼈 셋 + 물결 뒷전)
  [-1, 1].forEach(function (sd) {
    var sh = [m + S * 0.08, m + sd * S * 0.1], el = [m + S * (0.3 - sw), m + sd * S * 0.42 * sp], tp = [m + S * (0.06 - sw * 1.6), m + sd * S * 0.86 * sp];
    var f1 = [m - S * (0.22 + sw), m + sd * S * 0.66 * sp], f2 = [m - S * (0.34 + sw * 0.6), m + sd * S * 0.4 * sp], rt = [m - S * 0.2, m + sd * S * 0.09];
    var w = shp(), q = w.p; q.moveTo(sh[0], sh[1]); q.quadraticCurveTo(m + S * (0.26 - sw * 0.5), m + sd * S * 0.2 * sp, el[0], el[1]); q.quadraticCurveTo(m + S * (0.24 - sw), m + sd * S * 0.7 * sp, tp[0], tp[1]);
    q.quadraticCurveTo((tp[0] + f1[0]) / 2 + S * 0.08, (tp[1] + f1[1]) / 2 - sd * S * 0.05, f1[0], f1[1]); q.quadraticCurveTo((f1[0] + f2[0]) / 2 + S * 0.09, (f1[1] + f2[1]) / 2 - sd * S * 0.02, f2[0], f2[1]); q.quadraticCurveTo((f2[0] + rt[0]) / 2 + S * 0.07, (f2[1] + rt[1]) / 2 + sd * S * 0.02, rt[0], rt[1]); q.closePath();
    w.ext(m - S * 0.6, m - S * 0.9); w.ext(m + S * 0.4, m + S * 0.9);
    var g = x.createLinearGradient(m, m, m, m + sd * S * 0.86 * sp); g.addColorStop(0, '#ff8a3a'); g.addColorStop(0.6, '#ffc23a'); g.addColorStop(1, '#ffe680'); x.fillStyle = g; x.fill(w.p); t4Ink(x, w, '#e06a2a');
    [tp, f1, f2].forEach(function (e, k) { t4Line(x, el[0], el[1], e[0], e[1], Math.max(1, S * (0.03 - k * 0.005)), '#d8382e'); });
    t4Line(x, sh[0], sh[1], el[0], el[1], Math.max(1.2, S * 0.045), '#d8382e');
    t4Poly(x, [[el[0] + S * 0.02, el[1] - sd * S * 0.02], [el[0] + S * 0.1, el[1] + sd * S * 0.04], [el[0], el[1] + sd * S * 0.03]], '#fff2c8', { hi: 0.3 });
  });
  // 발
  [[0.14, 0.15], [-0.14, 0.14]].forEach(function (l) { [-1, 1].forEach(function (sd) { t4Ell(x, m + l[0] * S, m + sd * l[1] * S, S * 0.07, S * 0.045, twSh(c, 0.12), { hi: 0.3 }); }); });
  // 몸통 + 금빛 등 가시
  var bd = shp().blob([[m - S * 0.3, m], [m - S * 0.2, m - S * 0.14], [m + S * 0.14, m - S * 0.15], [m + S * 0.34, m - S * 0.08], [m + S * 0.34, m + S * 0.08], [m + S * 0.14, m + S * 0.15], [m - S * 0.2, m + S * 0.14]]);
  twFill(x, bd, c, { hi: 0.45, lo: 0.3 }); t4Ink(x, bd, c);
  for (i = 0; i < 6; i++) { var sx = m - S * 0.26 + i * S * 0.1; t4Poly(x, [[sx - S * 0.035, m], [sx, m - S * 0.035], [sx + S * 0.05, m], [sx, m + S * 0.035]], '#ffd24a', { hi: 0.55, iw: TW_IW * 0.6 }); }
  // 머리: 뿔 둘, 주둥이, 눈
  [-1, 1].forEach(function (sd) { t4Limb(x, m + S * 0.42, m + sd * S * 0.07, m + S * 0.26, m + sd * S * 0.2, S * 0.055, S * 0.016, '#fff2c8'); });
  var hd = shp(), hp = hd.p; hp.moveTo(m + S * 0.34, m - S * 0.1); hp.quadraticCurveTo(m + S * 0.5, m - S * 0.13, m + S * 0.56, m - S * 0.07); hp.quadraticCurveTo(m + S * 0.7, m - S * 0.06, m + S * 0.72, m); hp.quadraticCurveTo(m + S * 0.7, m + S * 0.06, m + S * 0.56, m + S * 0.07); hp.quadraticCurveTo(m + S * 0.5, m + S * 0.13, m + S * 0.34, m + S * 0.1); hp.closePath(); hd.ext(m + S * 0.34, m - S * 0.13); hd.ext(m + S * 0.72, m + S * 0.13);
  twFill(x, hd, twLt(c, 0.06), { hi: 0.45, lo: 0.25 }); t4Ink(x, hd, c);
  [-1, 1].forEach(function (sd) { x.fillStyle = '#ffe680'; x.beginPath(); x.ellipse(m + S * 0.5, m + sd * S * 0.065, S * 0.032, S * 0.022, sd * 0.4, 0, Math.PI * 2); x.fill(); x.fillStyle = '#3a1020'; x.beginPath(); x.ellipse(m + S * 0.505, m + sd * S * 0.065, S * 0.012, S * 0.018, sd * 0.4, 0, Math.PI * 2); x.fill(); x.fillStyle = '#5a1420'; x.beginPath(); x.arc(m + S * 0.67, m + sd * S * 0.025, S * 0.01, 0, Math.PI * 2); x.fill(); });
  twShine(x, m + S * 0.05, m - S * 0.07, S * 0.08, S * 0.025, 0.6, 0);
}
var T4_DRG = {};
function t4DragonFrames(S) {
  var key = Math.round(S); if (T4_DRG[key]) return T4_DRG[key];
  var out = { fr: [], n: 4 }, W = Math.ceil(S * 2.1), iw = TW_IW, sk = TW_SK; TW_SK = null;
  try { for (var i = 0; i < 4; i++) { var c = mkC(W, W), x = cx2(c); x.lineJoin = 'round'; x.lineCap = 'round'; t4DragonTop(x, W / 2, S, i); out.fr.push(trimSpr(spr(outlineC(c, Math.max(1, S * 0.016), '#3a1430', 0.85), W / 2, W / 2))); } } finally { TW_IW = iw; TW_SK = sk; }
  return (T4_DRG[key] = out);
}
