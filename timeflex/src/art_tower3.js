// ===== art_tower3.js : v2.0 새 탑 그림 7종(전함, 거북선, 신기전 화차, 비행장, 수호 병영, 장승, 서낭당) + 아군 유닛(비행기, 병사) =====
// 그림 계약(SPEC 6절): TW_EXT[키] = { spr(L, B, S) → { back, front, mounts, k }, parts(x, t, X, Y, S, time, info, g) }
// 원칙: 모든 그림은 '단위 좌표'(1 = 탑 크기 sz, 원점 = 탑 발밑 기준점)로 그린다. 움직이는 조각은 spr에서 한 번 구워 info.p에 두고 parts는 돌리고 옮기기만 한다.
// 다른 갈래가 알아 둘 것
//  - 배 두 종(선체째 출렁임), 장승 몸, 화차 수레는 parts가 그린다(back에는 받침이나 물 그림자만). 아이콘(towerIcon)도 parts를 부르므로 그대로 나온다
//  - parts가 읽는 탑 상태(없어도 가만히 있는 모습): t.aim(전함 포탑 회전, 화차 좌우와 치켜드는 각, 거북선 포문 쪽), t.fireT(0.35 기준 0~1로 바꿔 씀),
//    t.shots(전함 포신 번갈아 반동과 쏜 발사관, 화차 빈 구멍, 서낭당 던지는 부적), t.out(비행장 주기장 비움, 바뀔 때 이륙과 착륙), t.frozenT / t.stunT(움직임 멈춤), t.id(박자 어긋내기)
//  - 탑별 움직임 기억(화차 치켜든 각, 비행장 이륙 시각)은 탑 객체에 칸을 더하지 않고 WeakMap(T3_ST)에 둔다
//  - 받침과 계급장은 기존 twStageBack / twStageFront와 같은 크기와 모양이지만 6단계를 알아야 해서 따로 둠(t3StageBack, t3Badge). 얼음 덮개(t.frozenT)도 기존처럼 parts 끝에서 그린다(t3Frozen)
//  - 아군 유닛: t3PlaneSpr(v, S) → { c, ax, ay } 위에서 본 그림(오른쪽이 기수, 그릴 때 rotate), t3SoldierFrames(v, S) → { fr: [4], atk: [2] } 발밑 기준, 오른쪽을 봄(왼쪽은 drawSpr의 flip). 그림자는 그리는 쪽에서
var T3_KS = [1, 0.98, 1.0, 1.04, 1.09, 1.15, 1.22]; // 단계별 크기
var T3_MUL = { airbase: 1.08, shrine: 1.04 }; // 낮게 깔리는 탑은 조금 크게
var T3_PH = [0, 0, 0.05, 0.08, 0.1, 0.12, 0.14];    // 단계별 받침 높이
var T3W = 0.03;            // 지금 그리는 그림의 테두리 굵기(단위 좌표)
var T3_OL = '#2c1a3e';     // 실루엣 테두리 색
var T3_ST = typeof WeakMap !== 'undefined' ? new WeakMap() : null; // 탑별 움직임 기억(그리기 전용)
// ---------- 칠 도구(단위 좌표용: 픽셀 하한 없음) ----------
function t3Ink(c) { return mixc(c, '#2a183c', 0.72); }
function t3S(x, s, col, o) {
  o = o || {};
  if (o.flat) { x.fillStyle = col; x.fill(s.p); } else if (o.cyl) twCylG(x, s, col, o); else twFill(x, s, col, o);
  if (o.ink !== 0) { x.strokeStyle = t3Ink(o.inkc || col); x.lineWidth = T3W * (o.ink || 1); x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(s.p); }
  return s;
}
function t3Pg(x, pts, col, o) { return t3S(x, shp().poly(pts), col, o); }
function t3Bl(x, pts, col, o) { return t3S(x, shp().blob(pts), col, o); }
function t3R(x, x0, y0, w, h, r, col, o) { return t3S(x, shp().rrect(x0, y0, w, h, r), col, o); }
function t3E(x, cx, cy, rx, ry, col, o) { var s = shp(); s.p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); s.ext(cx - rx, cy - ry); s.ext(cx + rx, cy + ry); return t3S(x, s, col, o); }
function t3Path(x, pts) { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); }
function t3L(x, pts, col, w, k) { // 테두리 있는 굵은 선
  x.lineCap = 'round'; x.lineJoin = 'round'; t3Path(x, pts);
  x.strokeStyle = t3Ink(col); x.lineWidth = w + T3W * (k == null ? 1.6 : k); x.stroke(); x.strokeStyle = col; x.lineWidth = w; x.stroke();
}
function t3Hi(x, cx, cy, rx, ry, a, rot) { x.save(); x.globalAlpha = a == null ? 0.7 : a; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot == null ? -0.5 : rot, 0, Math.PI * 2); x.fill(); x.restore(); }
function t3Dot(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); }
// 상자(앞면 + 윗면 + 오른쪽 그늘면)
function t3Box(x, cx, by, w, h, d, col, o) {
  o = o || {}; var sk = o.sk == null ? d * 0.7 : o.sk, x0 = cx - w / 2, x1 = cx + w / 2, y0 = by - h;
  if (sk) t3Pg(x, [[x1, y0], [x1 + sk, y0 - d], [x1 + sk, by - d], [x1, by]], twSh(col, 0.34), { hi: 0.08, lo: 0.2 });
  var f = t3R(x, x0, y0, w, h, o.r || 0, col, { hi: 0.26, lo: 0.24 });
  if (d) t3Pg(x, [[x0, y0], [x0 + sk, y0 - d], [x1 + sk, y0 - d], [x1, y0]], o.top || twLt(col, 0.4), { hi: 0.3, lo: 0.06 });
  return f;
}
// 원통(윗면 타원)
function t3Cyl(x, cx, ty, rx, ry, h, col, o) {
  o = o || {}; var fl = o.flare || 1, s = shp(), p = s.p;
  p.moveTo(cx - rx, ty); p.lineTo(cx - rx * fl, ty + h); p.ellipse(cx, ty + h, rx * fl, ry * fl, 0, Math.PI, 0, true); p.lineTo(cx + rx, ty); p.ellipse(cx, ty, rx, ry, 0, 0, Math.PI, false); p.closePath();
  s.ext(cx - rx * Math.max(1, fl), ty - ry); s.ext(cx + rx * Math.max(1, fl), ty + h + ry * fl);
  t3S(x, s, col, { cyl: 1, hi: o.hi, lo: o.lo });
  if (o.bands) { x.save(); x.clip(s.p); o.bands.forEach(function (b) { x.fillStyle = b[2]; x.beginPath(); x.ellipse(cx, ty + h * b[0], rx * 1.2, ry * 1.2 + h * b[1], 0, 0, Math.PI); x.ellipse(cx, ty + h * b[0], rx * 1.2, ry * 1.2, 0, Math.PI, 0, true); x.fill(); }); x.restore(); x.strokeStyle = t3Ink(col); x.lineWidth = T3W; x.stroke(s.p); }
  if (!o.noTop) t3E(x, cx, ty, rx, ry, o.top || twLt(col, 0.3), { hi: 0.3, lo: 0.1 });
  return s;
}
// 기와 지붕: 양 끝이 들린 처마, 용마루, 기왓골
function t3Giwa(x, cx, by, w, h, col, o) {
  o = o || {}; var hw = w / 2, tw = hw * (o.top == null ? 0.42 : o.top), lift = h * (o.lift == null ? 0.22 : o.lift), s = shp(), p = s.p;
  p.moveTo(cx - hw, by - lift); p.quadraticCurveTo(cx - hw * 0.5, by + h * 0.06, cx, by + h * 0.04); p.quadraticCurveTo(cx + hw * 0.5, by + h * 0.06, cx + hw, by - lift);
  p.quadraticCurveTo(cx + hw * 0.62, by - h * 0.5, cx + tw, by - h); p.lineTo(cx - tw, by - h); p.quadraticCurveTo(cx - hw * 0.62, by - h * 0.5, cx - hw, by - lift); p.closePath();
  s.ext(cx - hw, by - h); s.ext(cx + hw, by + h * 0.06);
  t3S(x, s, col, { hi: 0.32, lo: 0.34 });
  x.save(); x.clip(s.p); x.strokeStyle = rgba(t3Ink(col), 0.5); x.lineWidth = T3W * 0.7;
  var n = o.n || 6; for (var i = 1; i < n; i++) { var k = i / n * 2 - 1; x.beginPath(); x.moveTo(cx + tw * k, by - h); x.quadraticCurveTo(cx + hw * 0.8 * k, by - h * 0.4, cx + hw * 0.98 * k, by + h * 0.1); x.stroke(); }
  x.fillStyle = rgba('#ffffff', 0.22); x.fillRect(cx - hw, by - h, w * 0.5, h * 0.3); x.restore();
  x.strokeStyle = t3Ink(col); x.lineWidth = T3W; x.stroke(s.p);
  // 처마 끝 띠, 용마루
  x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - hw, by - lift); x.quadraticCurveTo(cx - hw * 0.5, by + h * 0.06, cx, by + h * 0.04); x.quadraticCurveTo(cx + hw * 0.5, by + h * 0.06, cx + hw, by - lift);
  x.strokeStyle = t3Ink(col); x.lineWidth = h * 0.16 + T3W * 1.4; x.stroke(); x.strokeStyle = o.eave || twLt(col, 0.45); x.lineWidth = h * 0.16; x.stroke();
  t3L(x, [[cx - tw * 1.12, by - h], [cx + tw * 1.12, by - h]], o.ridge || twLt(col, 0.25), h * 0.17);
  if (o.tip) [-1, 1].forEach(function (sd) { t3E(x, cx + sd * tw * 1.14, by - h - h * 0.06, h * 0.11, h * 0.13, o.tip, { hi: 0.5 }); });
  return s;
}
// 빛 덩어리(가산 혼합, 미리 구운 그림): 픽셀 좌표
function t3Glow(x, px, py, r, col, a) { if (a <= 0 || r <= 0) return; x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(1, a); x.drawImage(glowSpr(col, 32), px - r, py - r, r * 2, r * 2); x.restore(); }
function t3Soft(x, px, py, r, col, a) { if (a <= 0 || r <= 0) return; x.save(); x.globalAlpha = Math.min(1, a); x.drawImage(softSpr(col, 32), px - r, py - r, r * 2, r * 2); x.restore(); }
// 펄럭이는 깃발(픽셀 좌표, 매 프레임 경로 하나): 깃대 위 끝 (px, py)에서 dir 쪽으로. tail = 1이면 제비 꼬리
function t3Flag(x, px, py, w, h, col, time, dir, tail, col2) {
  var n = 4, i, top = [], yy; dir = dir || 1;
  for (i = 0; i <= n; i++) top.push(py + Math.sin(time * 5.2 - i * 1.25) * h * 0.2 * (i / n));
  x.beginPath(); x.moveTo(px, py);
  for (i = 1; i <= n; i++) x.lineTo(px + dir * w * i / n, top[i]);
  if (tail) x.lineTo(px + dir * w * 0.78, top[n] + h * 0.5);
  for (i = n; i >= 0; i--) x.lineTo(px + dir * w * i / n, top[i] + h);
  x.closePath(); x.fillStyle = col; x.fill(); x.strokeStyle = T3_OL; x.lineWidth = Math.max(1, Math.min(w, h) * 0.14); x.lineJoin = 'round'; x.stroke();
  if (col2) { var xa = px + dir * w * 0.3, xb = px + dir * w * 0.56, ya = lerp(top[1], top[2], 0.2), yb = lerp(top[2], top[3], 0.24); x.beginPath(); x.moveTo(xa, ya); x.lineTo(xb, yb); x.lineTo(xb, yb + h); x.lineTo(xa, ya + h); x.closePath(); x.fillStyle = col2; x.fill(); }
}
// ---------- 받침, 물, 계급장 ----------
function t3StageBack(x, L, B, rnd, col) { // 단위 좌표, 원점 = 기준점. 받침 높이를 돌려줌
  var rx = 0.52, ry = 0.29, ph = T3_PH[L] || 0;
  if (L === 1) {
    var d = shp().ell(0, 0, rx * 0.9, ry * 0.86), g = x.createRadialGradient(-rx * 0.15, -ry * 0.2, 0, 0, 0, rx * 0.9);
    g.addColorStop(0, '#f8e2bd'); g.addColorStop(0.75, '#efcf9f'); g.addColorStop(1, 'rgba(232,190,140,0)'); x.fillStyle = g; x.fill(d.p);
    return 0;
  }
  var sc = L >= 4 ? mixc(BRC[B].stone, '#e9dccb', 0.3) : L === 3 ? '#f3dfc2' : '#e2d5c7';
  t3Cyl(x, 0, -ph, rx, ry, ph, sc, { top: twLt(sc, 0.32) });
  if (L >= 3) { var tc = L >= 4 ? BRC[B].trim : TC.gold; x.beginPath(); x.ellipse(0, -ph, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2); x.strokeStyle = t3Ink(tc); x.lineWidth = 0.03 + T3W; x.stroke(); x.strokeStyle = L >= 6 ? TC.gold : tc; x.lineWidth = 0.03; x.stroke(); }
  if (L >= 6) { x.beginPath(); x.ellipse(0, -ph, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2); x.strokeStyle = rgba(BRC[B].flag, 0.7); x.lineWidth = 0.014; x.setLineDash([0.04, 0.03]); x.stroke(); x.setLineDash([]); }
  return ph;
}
function t3WaterBack(x, sx) { // 물 위 그림자와 잔물결(정지 그림)
  x.save(); x.scale(1, 0.3); var g = x.createRadialGradient(0.03, 0.05, 0, 0.03, 0.05, 0.74 * sx);
  g.addColorStop(0, 'rgba(14,44,92,0.5)'); g.addColorStop(0.7, 'rgba(14,44,92,0.32)'); g.addColorStop(1, 'rgba(14,44,92,0)'); x.fillStyle = g; x.beginPath(); x.arc(0.03, 0.05, 0.74 * sx, 0, Math.PI * 2); x.fill(); x.restore();
  x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 0.018; x.lineCap = 'round';
  [[-0.5, 0.13, 0.2], [0.3, 0.16, 0.24], [-0.1, 0.2, 0.16]].forEach(function (r) { x.beginPath(); x.moveTo(r[0] * sx, r[1]); x.quadraticCurveTo((r[0] + r[2] / 2) * sx, r[1] + 0.025, (r[0] + r[2]) * sx, r[1]); x.stroke(); });
}
function t3Badge(x, L, B, y) { // 계급장: 기존 탑과 같은 방패(1~3 갈매기표, 갈래 별). 6단계는 금테와 별 셋
  var w = 0.18, h = 0.2, cy = y, base = L >= 4 ? BRC[B].shield : L === 3 ? '#ffc93c' : L === 2 ? '#b8b0e8' : '#eea55e';
  var sh = shp(), p = sh.p; p.moveTo(-w / 2 + w * 0.12, cy - h / 2); p.lineTo(w / 2 - w * 0.12, cy - h / 2); p.quadraticCurveTo(w / 2, cy - h / 2, w / 2, cy - h * 0.36); p.lineTo(w / 2, cy + h * 0.06); p.quadraticCurveTo(w * 0.46, cy + h * 0.36, 0, cy + h / 2); p.quadraticCurveTo(-w * 0.46, cy + h * 0.36, -w / 2, cy + h * 0.06); p.lineTo(-w / 2, cy - h * 0.36); p.quadraticCurveTo(-w / 2, cy - h / 2, -w / 2 + w * 0.12, cy - h / 2); p.closePath(); sh.ext(-w / 2, cy - h / 2); sh.ext(w / 2, cy + h / 2);
  twFill(x, sh, base, { hi: 0.45, lo: 0.2 }); x.strokeStyle = L >= 6 ? '#8a5a10' : twInkC(base); x.lineWidth = L >= 6 ? 0.034 : 0.02; x.lineJoin = 'round'; x.stroke(sh.p);
  if (L >= 6) { x.strokeStyle = '#ffd94a'; x.lineWidth = 0.016; x.stroke(sh.p); }
  t3Hi(x, -w * 0.22, cy - h * 0.3, w * 0.12, h * 0.06, 0.7);
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (L <= 3) { x.strokeStyle = '#ffffff'; x.lineWidth = 0.028; for (var i = 0; i < L; i++) { var yy = cy - h * 0.2 + i * h * 0.2 - (L - 1) * h * 0.06; x.beginPath(); x.moveTo(-w * 0.28, yy); x.lineTo(0, yy + h * 0.13); x.lineTo(w * 0.28, yy); x.stroke(); } }
  else { var n = L - 3; for (var j = 0; j < n; j++) { var sx = (j - (n - 1) / 2) * w * (n === 3 ? 0.3 : 0.38), sy = cy - h * 0.04 - (n === 3 && j === 1 ? h * 0.1 : 0), r0 = w * (n === 1 ? 0.3 : n === 2 ? 0.22 : 0.19), st = shp(); twStarP(st.p, sx, sy, r0, r0 * 0.48); st.ext(sx - r0, sy - r0); st.ext(sx + r0, sy + r0); x.strokeStyle = '#fff3b0'; x.lineWidth = r0 * 0.3; x.stroke(st.p); twFill(x, st, '#fff3b0', { hi: 0.5, lo: 0.1 }); } }
}
// ---------- 한 모습 굽기 ----------
// fn(D): D.g 바닥(테두리 없음), D.b 뒤 몸체, D.f 앞 몸체(둘 다 실루엣 테두리), D.part(이름, [x0, y0, x1, y1], 그리기, 테두리 0|1) → 움직이는 조각
function t3Make(key, L, B, S, fn) {
  var k = (T3_KS[L] || 1) * (T3_MUL[key] || 1), W = Math.ceil(S * 3.2), H = Math.ceil(S * 4), gx = W / 2, gy = Math.round(H * 0.86), u = S * 0.98 * k, water = TOWERS[key] && TOWERS[key].site === 'water';
  var cg = mkC(W, H), cb = mkC(W, H), cf = mkC(W, H), rnd = rngOf(hashStr(key) + L * 31 + B * 7), info = { p: {}, u: u, k: k }, sk0 = TW_SK, w0 = T3W, olr = Math.max(0.9, u * 0.017);
  var ctx = function (c, oy) { var x = cx2(c); x.setTransform(u, 0, 0, u, gx, gy + oy); x.lineJoin = 'round'; x.lineCap = 'round'; return x; };
  TW_SK = null; T3W = Math.max(1.15, u * 0.026) / u;
  try {
    var xg = ctx(cg, 0), ph = 0;
    if (water) t3WaterBack(xg, key === 'turtle' ? 0.92 : 1); else { xg.save(); xg.setTransform(1, 0, 0, 1, 0, 0); twShadow(xg, gx + u * 0.12, gy + u * 0.04, u * 0.62, u * 0.29, 0.42); xg.restore(); ph = t3StageBack(xg, L, B, rnd, TOWERS[key] && TOWERS[key].col); }
    var D = { g: ctx(cg, -ph * u), b: ctx(cb, -ph * u), f: ctx(cf, -ph * u), L: L, B: B, A: L >= 4 && B === 0, V: L >= 4 && B === 1, rnd: rnd, u: u, ph: ph, info: info, col: TOWERS[key] ? TOWERS[key].col : '#8888aa',
      part: function (name, bb, draw, ol) { return (info.p[name] = t3Bake(u, bb, draw, ol === 0 ? 0 : olr)); } };
    var r = fn(D) || {}; for (var q in r) info[q] = r[q];
    var xb = cx2(cg); xb.setTransform(1, 0, 0, 1, 0, 0); xb.drawImage(outlineC(cb, olr, T3_OL, 0.92), 0, 0);
    if (D.post) { var xp = ctx(cg, -ph * u); D.post(xp); }
    var fo = outlineC(cf, olr, T3_OL, 0.92), xf = cx2(fo); xf.setTransform(u, 0, 0, u, gx, gy); t3Badge(xf, L, B, water ? 0.2 : 0.18 - ph * 0.4);
    info.ph = ph; info.mounts = (info.mounts || [[0, -0.8]]).map(function (m) { return [m[0], m[1] - ph]; });
    info.back = trimSpr(spr(cg, gx, gy)); info.front = trimSpr(spr(fo, gx, gy));
  } finally { TW_SK = sk0; T3W = w0; }
  return info;
}
function t3Bake(u, bb, draw, olr) {
  var pad = Math.ceil(olr || 0) + 2, c = mkC((bb[2] - bb[0]) * u + pad * 2, (bb[3] - bb[1]) * u + pad * 2), x = cx2(c), ax = pad - bb[0] * u, ay = pad - bb[1] * u;
  x.translate(ax, ay); x.scale(u, u); x.lineJoin = 'round'; x.lineCap = 'round'; draw(x);
  return trimSpr(spr(olr ? outlineC(c, olr, T3_OL, 0.92) : c, ax, ay));
}
function t3Img(x, s, px, py) { if (s && !s.empty) x.drawImage(s.c, px - s.ax, py - s.ay); }
// 조각을 (px, py)에 돌려서, 납작하게(sy) 그리기
function t3Rot(x, s, px, py, ang, sy, ox, oy) { if (!s || s.empty) return; x.save(); x.translate(px, py); if (sy != null && sy !== 1) x.scale(1, sy); x.rotate(ang); x.drawImage(s.c, (ox || 0) - s.ax, (oy || 0) - s.ay); x.restore(); }
function t3Mem(t) { if (!T3_ST || !t || typeof t !== 'object') return {}; var m = T3_ST.get(t); if (!m) { m = {}; T3_ST.set(t, m); } return m; }
// 얼어붙은 탑 덮개(기존 탑과 같은 모양). wide: 배처럼 옆으로 긴 탑
function t3Frozen(x, X, Y, S, wide) {
  x.save(); x.globalAlpha = 0.5; x.fillStyle = '#d6f2ff'; x.beginPath(); x.ellipse(X, Y - S * (wide ? 0.34 : 0.5), S * (wide ? 0.66 : 0.42), S * (wide ? 0.46 : 0.62), 0, 0, Math.PI * 2); x.fill();
  x.globalAlpha = 0.9; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.025); x.stroke(); x.globalAlpha = 0.8; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(X - S * 0.2, Y - S * (wide ? 0.6 : 0.85), S * 0.06, S * 0.12, -0.4, 0, Math.PI * 2); x.fill(); x.restore();
}
function t3Reg(key, draw, parts, wide) {
  TW_EXT[key] = { spr: function (L, B, S) { return t3Make(key, L, B, S, draw); },
    parts: function (x, t, X, Y, S, time, info, g) { if (!info || !info.p) return; parts(x, t, X, Y, S, time, info, g); if (t.frozenT > 0) t3Frozen(x, X, Y, S, wide); } };
}
function t3FireK(t) { return t && t.fireT > 0 ? Math.min(1, t.fireT / 0.35) : 0; }
function t3Still(t) { return t && (t.frozenT > 0 || t.stunT > 0); }

// ===================== 전함 (물 칸 전용) =====================
// 1 포함 한 척 → 2 연장포 → 3 포탑 둘. A 미사일 순양함(수직 발사관, 레이더 돔) / B 드레드노트(3연장 거포 여러 기)
function t3Turret(D, name, sc, C, V, gold) {
  var hw = 0.088 * sc, a = -0.1 * sc, b = 0.105 * sc, bb = [-0.16 * sc, -0.14 * sc, 0.16 * sc, 0.14 * sc];
  var house = function () { var s = shp(), p = s.p; p.moveTo(b, -hw * 0.55); p.lineTo(b, hw * 0.55); p.lineTo(b - 0.05 * sc, hw); p.lineTo(a + 0.035 * sc, hw); p.quadraticCurveTo(a - 0.035 * sc, 0, a + 0.035 * sc, -hw); p.lineTo(b - 0.05 * sc, -hw); p.closePath(); s.ext(a - 0.02 * sc, -hw); s.ext(b, hw); return s; };
  D.part(name + 's', bb, function (x) { t3S(x, house(), twSh(C.tur, 0.42), { flat: 1 }); });
  D.part(name + 'h', bb, function (x) {
    var s = house(); t3S(x, s, C.tur, { flat: 1 });
    x.save(); x.clip(s.p); x.fillStyle = rgba(twLt(C.tur, 0.6), 0.75); x.beginPath(); x.ellipse(-0.01 * sc, 0, 0.07 * sc, hw * 0.62, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = V ? C.acc : rgba(twSh(C.tur, 0.5), 0.8); x.fillRect(b - 0.035 * sc, -hw, 0.018 * sc, hw * 2); x.restore();
    x.strokeStyle = t3Ink(C.tur); x.lineWidth = T3W; x.stroke(s.p);
    t3E(x, -0.03 * sc, 0, 0.026 * sc, 0.026 * sc, gold ? '#ffd24a' : twLt(C.tur, 0.25), { flat: 1, ink: 0.7 });
  });
  var bl = (V ? 0.3 : 0.25) * sc, bw = (V ? 0.044 : 0.036) * sc;
  D.part(name + 'b', [0, -bw, bl + 0.1 * sc, bw], function (x) {
    var g = x.createLinearGradient(0, -bw / 2, 0, bw / 2), bc = V ? '#59607a' : '#5f6c88'; g.addColorStop(0, twSh(bc, 0.2)); g.addColorStop(0.4, twLt(bc, 0.5)); g.addColorStop(1, twSh(bc, 0.35));
    var s = shp().rrect(0.05 * sc, -bw / 2, bl, bw, bw * 0.25); x.fillStyle = g; x.fill(s.p); x.strokeStyle = t3Ink(bc); x.lineWidth = T3W * 0.85; x.stroke(s.p);
    t3R(x, 0.05 * sc + bl - 0.04 * sc, -bw * 0.68, 0.04 * sc, bw * 1.36, bw * 0.2, gold ? '#ffd24a' : twSh(bc, 0.3), { flat: 1, ink: 0.8 });
    t3R(x, 0.06 * sc, -bw * 0.66, 0.05 * sc, bw * 1.32, bw * 0.2, twLt(C.tur, 0.1), { flat: 1, ink: 0.8 });
  });
  return { bl: bl + 0.05 * sc, gap: bw * 1.28 };
}
function t3Warship(D) {
  var L = D.L, A = D.A, V = D.V, hl = [0, 0.88, 0.94, 1, 1, 1.05, 1.1][L], X = function (v) { return v * hl; };
  var C = A ? { hull: '#86a9c8', deck: '#dfe8f0', sup: '#eef3f8', tur: '#a4c0da', acc: '#35c8f5', boot: '#2f66b0', fun: '#c9d6e4' }
    : V ? { hull: '#48597c', deck: '#dcbb8a', sup: '#7787a6', tur: '#62759a', acc: '#ffcf4a', boot: '#b5362f', fun: '#5a6a8a' }
      : { hull: '#5a7fa0', deck: '#cdd7e0', sup: '#93adc6', tur: '#7396b8', acc: '#ffd24a', boot: '#c4524a', fun: '#7f97b0' };
  // 포탑 자리: [x, y(갑판 위), 크기, 포신 수, 높이]
  var T = L === 1 ? [[0.2, -0.33, 0.95, 1, 0]] : L === 2 ? [[0.27, -0.335, 1.05, 2, 0]] : L === 3 ? [[0.33, -0.34, 1, 2, 0], [-0.4, -0.31, 1, 2, 0]]
    : A ? [[0.4, -0.35, L === 6 ? 1 : 0.9, 1, 0]]
      : L === 4 ? [[0.34, -0.34, 1.18, 3, 0], [-0.4, -0.31, 1.18, 3, 0]] : [[0.45, -0.35, L === 6 ? 1.24 : 1.1, 3, 0], [0.19, -0.36, L === 6 ? 1.24 : 1.1, 3, 0.085], [-0.42, -0.31, L === 6 ? 1.24 : 1.1, 3, 0]];
  var tinfo = [], vls = [], supX = V && L >= 5 ? -0.12 : A ? -0.04 : L === 1 ? -0.16 : -0.05;
  var tdone = {};
  T.forEach(function (q, i) { var nm = 't' + Math.round(q[2] * 100), r = tdone[nm] || (tdone[nm] = t3Turret(D, nm, q[2], C, V, L === 6)); tinfo.push({ x: X(q[0]), y: q[1] - q[4], sc: q[2], nb: q[3], bl: r.bl, gap: r.gap, nm: nm, hgt: 0.045 * q[2] }); });
  var oy = -0.05, fun = [], radar = null, flag = null, arr = null, heli = null;
  if (A) D.part('ms', [-0.05, -0.2, 0.05, 0.04], function (x) { t3R(x, -0.022, -0.15, 0.044, 0.17, 0.02, '#f4f6fa', { hi: 0.2, lo: 0.25 }); t3Pg(x, [[-0.024, -0.13], [0, -0.19], [0.024, -0.13]], '#e0483a', { flat: 1, ink: 0.8 }); x.fillStyle = C.acc; x.fillRect(-0.022, -0.06, 0.044, 0.022); });
  D.part('hull', [-0.85, -1.6, 0.9, 0.14], function (x) {
    // 선체 옆면
    var side = shp(), p = side.p;
    p.moveTo(X(-0.6), -0.27); p.quadraticCurveTo(X(-0.58), -0.2, X(-0.45), -0.2); p.lineTo(X(0.28), -0.24); p.quadraticCurveTo(X(0.5), -0.27, X(0.71), -0.41);
    p.quadraticCurveTo(X(0.63), -0.18, X(0.5), -0.01); p.lineTo(X(-0.46), 0.03); p.quadraticCurveTo(X(-0.61), 0.01, X(-0.635), -0.13); p.closePath(); side.ext(X(-0.64), -0.41); side.ext(X(0.71), 0.03);
    t3S(x, side, C.hull, { hi: 0.32, lo: 0.3 });
    x.save(); x.clip(side.p); x.fillStyle = C.boot; x.fillRect(-1, -0.07, 2, 0.2); x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(-1, -0.092, 2, 0.024);
    x.fillStyle = t3Ink(C.hull); for (var i = 0; i < 6; i++) { x.beginPath(); x.arc(X(-0.46 + i * 0.15), -0.15 - i * 0.004, 0.017, 0, Math.PI * 2); x.fill(); }
    if (L >= 6) { x.fillStyle = '#ffd24a'; x.fillRect(-1, -0.2, 2, 0.02); } else if (A) { x.fillStyle = C.acc; x.fillRect(-1, -0.2, 2, 0.022); }
    x.restore(); x.strokeStyle = t3Ink(C.hull); x.lineWidth = T3W; x.stroke(side.p);
    // 닻
    t3E(x, X(0.56), -0.2, 0.022, 0.03, '#3d4660', { flat: 1, ink: 0.6 });
    // 갑판
    var deck = shp(), q = deck.p;
    q.moveTo(X(-0.6), -0.27); q.quadraticCurveTo(X(-0.62), -0.37, X(-0.45), -0.39); q.lineTo(X(0.25), -0.43); q.quadraticCurveTo(X(0.5), -0.445, X(0.71), -0.41); q.quadraticCurveTo(X(0.5), -0.27, X(0.28), -0.24); q.lineTo(X(-0.45), -0.2); q.quadraticCurveTo(X(-0.58), -0.2, X(-0.6), -0.27); q.closePath(); deck.ext(X(-0.62), -0.445); deck.ext(X(0.71), -0.2);
    t3S(x, deck, C.deck, { hi: 0.3, lo: 0.16 });
    x.save(); x.clip(deck.p); x.strokeStyle = rgba(twSh(C.deck, 0.6), 0.3); x.lineWidth = T3W * 0.5; for (var j = 0; j < 4; j++) { x.beginPath(); x.moveTo(-1, -0.26 - j * 0.045); x.lineTo(1, -0.3 - j * 0.045); x.stroke(); }
    if (A) { x.fillStyle = rgba(C.acc, 0.5); x.beginPath(); x.ellipse(X(-0.42), -0.3, 0.1, 0.05, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#ffffff'; x.lineWidth = T3W * 0.8; x.beginPath(); x.ellipse(X(-0.42), -0.3, 0.07, 0.034, 0, 0, Math.PI * 2); x.stroke(); }
    x.restore(); x.strokeStyle = t3Ink(C.deck); x.lineWidth = T3W; x.stroke(deck.p);
    // 포탑 받침 고리
    tinfo.forEach(function (t) { if (t.hgt && T[tinfo.indexOf(t)][4]) t3Cyl(x, t.x, t.y, 0.105 * t.sc, 0.058 * t.sc, T[tinfo.indexOf(t)][4], twSh(C.sup, 0.1), { top: twSh(C.sup, 0.25) }); else t3E(x, t.x, t.y + 0.012, 0.105 * t.sc, 0.06 * t.sc, twSh(C.deck, 0.3), { flat: 1, ink: 0.7 }); });
    // 수직 발사관(A): 갑판의 덮개 격자
    var cell = function (cx, cy, nx, ny) {
      var cw = 0.062, chh = 0.04; t3Pg(x, [[cx - nx * cw / 2 - 0.015, cy + ny * chh / 2 + 0.012], [cx - nx * cw / 2 + 0.005, cy - ny * chh / 2 - 0.012], [cx + nx * cw / 2 + 0.025, cy - ny * chh / 2 - 0.02], [cx + nx * cw / 2 + 0.005, cy + ny * chh / 2 + 0.004]], '#566a8c', { flat: 1 });
      for (var a = 0; a < nx; a++) for (var b = 0; b < ny; b++) { var px = cx + (a - (nx - 1) / 2) * cw + (0.5 - b / ny) * 0.016, py = cy + (b - (ny - 1) / 2) * chh - a * 0.003; t3R(x, px - cw * 0.36, py - chh * 0.34, cw * 0.72, chh * 0.68, 0.006, '#e9f2fa', { flat: 1, ink: 0.55 }); vls.push([px, py + oy]); }
    };
    if (A) { if (L !== 5) cell(X(-0.36), -0.305, L === 6 ? 4 : 3, 2); if (L >= 5) cell(X(0.2), -0.335, 3, 2); }
    if (A && L === 5) { // 5단계: 함미 착륙장에 작은 헬기(날개는 parts에서 돎)
      var hx0 = X(-0.4), hy0 = -0.35, hc2 = '#3d5c8e'; t3L(x, [[hx0 - 0.07, hy0 + 0.05], [hx0 + 0.08, hy0 + 0.044]], '#4a5068', 0.014, 1);
      t3L(x, [[hx0 - 0.05, hy0 - 0.015], [hx0 - 0.2, hy0 - 0.055]], hc2, 0.026); t3Pg(x, [[hx0 - 0.21, hy0 - 0.04], [hx0 - 0.235, hy0 - 0.115], [hx0 - 0.17, hy0 - 0.06]], '#e0483a', { flat: 1, ink: 0.8 });
      t3E(x, hx0, hy0, 0.09, 0.056, hc2, { hi: 0.3, lo: 0.25 }); t3E(x, hx0 + 0.042, hy0 - 0.008, 0.04, 0.034, '#bff0ff', { flat: 1, ink: 0.7 }); x.fillStyle = '#ffd24a'; x.fillRect(hx0 - 0.06, hy0 + 0.012, 0.07, 0.014); t3L(x, [[hx0, hy0 - 0.05], [hx0, hy0 - 0.085]], '#4a5068', 0.016, 1);
      heli = [hx0, hy0 - 0.09];
    }
    // 굴뚝
    var funnel = function (fx, h, r) { t3Cyl(x, fx, -0.33 - h, r, r * 0.5, h, C.fun, { top: '#2b2238', bands: [[0.02, 0.2, V ? C.boot : A ? C.acc : '#3a3550']] }); fun.push([fx, -0.33 - h + oy]); };
    var sx = X(supX), by = -0.3;
    if (L === 1) { funnel(sx - 0.17, 0.2, 0.045); t3Box(x, sx, by, 0.22, 0.12, 0.07, C.sup); x.fillStyle = '#2f4668'; x.fillRect(sx - 0.085, by - 0.095, 0.17, 0.04); t3L(x, [[sx + 0.02, by - 0.19], [sx + 0.02, by - 0.42]], '#e8e2f0', 0.02); flag = [sx + 0.02, by - 0.42, '#ffd24a', null]; }
    else if (!A && !V) {
      funnel(sx - 0.2, 0.26, 0.05); if (L === 3) funnel(sx - 0.33, 0.2, 0.042);
      t3Box(x, sx, by, 0.3, 0.13, 0.08, C.sup); t3Box(x, sx + 0.02, by - 0.13, 0.2, 0.13, 0.07, twLt(C.sup, 0.15)); x.fillStyle = '#2f4668'; x.fillRect(sx - 0.06, by - 0.235, 0.16, 0.045); x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(sx - 0.05, by - 0.228, 0.03, 0.03);
      x.fillStyle = C.acc; x.fillRect(sx - 0.15, by - 0.045, 0.3, 0.025);
      t3L(x, [[sx + 0.04, by - 0.33], [sx + 0.04, by - (L === 3 ? 0.66 : 0.56)]], '#e8e2f0', 0.022); t3L(x, [[sx - 0.04, by - 0.48], [sx + 0.12, by - 0.48]], '#e8e2f0', 0.016);
      if (L === 3) radar = [sx + 0.04, by - 0.66, 0.075]; flag = [sx + 0.04, by - (L === 3 ? 0.61 : 0.56), '#ffd24a', '#e0483a'];
    } else if (A) {
      // 낮고 매끈한 함교 + 레이더 돔
      if (L === 6) { // 신의 방패함: 팔각 위상 배열 함교
        t3Box(x, sx, by, 0.42, 0.12, 0.08, C.sup);
        t3Pg(x, [[sx - 0.2, by - 0.12], [sx - 0.14, by - 0.42], [sx + 0.14, by - 0.42], [sx + 0.2, by - 0.12]], C.sup, { hi: 0.3, lo: 0.2 }); t3Pg(x, [[sx + 0.2, by - 0.12], [sx + 0.14, by - 0.42], [sx + 0.2, by - 0.47], [sx + 0.27, by - 0.19]], twSh(C.sup, 0.3)); t3Pg(x, [[sx - 0.14, by - 0.42], [sx - 0.08, by - 0.47], [sx + 0.2, by - 0.47], [sx + 0.14, by - 0.42]], twLt(C.sup, 0.5));
        t3Pg(x, [[sx - 0.11, by - 0.2], [sx - 0.08, by - 0.36], [sx + 0.08, by - 0.36], [sx + 0.11, by - 0.2]], '#1f5f9a', { flat: 1 }); x.fillStyle = C.acc; x.fillRect(sx - 0.07, by - 0.33, 0.14, 0.03); x.fillRect(sx - 0.085, by - 0.27, 0.17, 0.03);
        x.fillStyle = '#ffd24a'; x.fillRect(sx - 0.21, by - 0.04, 0.42, 0.022);
        t3L(x, [[sx + 0.03, by - 0.47], [sx + 0.03, by - 0.84]], '#e8e2f0', 0.024); t3L(x, [[sx - 0.06, by - 0.66], [sx + 0.12, by - 0.66]], '#e8e2f0', 0.016);
        radar = [sx + 0.03, by - 0.84, 0.11]; arr = [sx, by - 0.28];
        [[-0.17, -0.5, 0.07], [0.19, -0.56, 0.06]].forEach(function (d) { t3E(x, sx + d[0], by + d[1], d[2], d[2], '#ffffff', { hi: 0.2, lo: 0.3 }); t3Hi(x, sx + d[0] - d[2] * 0.35, by + d[1] - d[2] * 0.35, d[2] * 0.28, d[2] * 0.18, 0.9); });
      } else {
        t3Box(x, sx, by, 0.36, 0.11, 0.08, C.sup); t3Pg(x, [[sx - 0.13, by - 0.11], [sx - 0.09, by - 0.27], [sx + 0.11, by - 0.27], [sx + 0.15, by - 0.11]], twLt(C.sup, 0.1), { hi: 0.3, lo: 0.2 }); t3Pg(x, [[sx + 0.15, by - 0.11], [sx + 0.11, by - 0.27], [sx + 0.16, by - 0.31], [sx + 0.21, by - 0.17]], twSh(C.sup, 0.3));
        x.fillStyle = '#1f5f9a'; x.fillRect(sx - 0.09, by - 0.24, 0.19, 0.045); x.fillStyle = C.acc; x.fillRect(sx - 0.08, by - 0.232, 0.06, 0.028); x.fillStyle = C.acc; x.fillRect(sx - 0.18, by - 0.04, 0.36, 0.022);
        t3L(x, [[sx + 0.04, by - 0.3], [sx + 0.04, by - (L === 5 ? 0.7 : 0.58)]], '#e8e2f0', 0.022);
        var dr = L === 5 ? 0.075 : 0.065; t3E(x, sx - 0.1, by - 0.33, dr, dr, '#ffffff', { hi: 0.2, lo: 0.3 }); t3Hi(x, sx - 0.1 - dr * 0.35, by - 0.33 - dr * 0.35, dr * 0.28, dr * 0.18, 0.9);
        if (L === 5) { t3E(x, sx + 0.16, by - 0.26, 0.05, 0.05, '#ffffff', { hi: 0.2, lo: 0.3 }); }
        radar = [sx + 0.04, by - (L === 5 ? 0.7 : 0.58), L === 5 ? 0.095 : 0.08];
      }
    } else {
      // 드레드노트: 굴뚝 둘, 층층이 쌓은 탑형 함교
      funnel(sx - 0.2, L === 6 ? 0.36 : 0.3, 0.06); funnel(sx - 0.36, 0.25, 0.052);
      var n = L === 4 ? 2 : 3, w = 0.3, yy = by;
      for (var k = 0; k < n; k++) { var hh = k === 0 ? 0.14 : 0.12; t3Box(x, sx + k * 0.012, yy, w, hh, 0.07, k % 2 ? twLt(C.sup, 0.18) : C.sup); x.fillStyle = k === n - 1 ? '#ffe9a0' : '#2c3550'; x.fillRect(sx + k * 0.012 - w * 0.36, yy - hh + 0.03, w * 0.72, 0.036); yy -= hh; w *= 0.74; }
      x.fillStyle = C.boot; x.fillRect(sx - 0.15, by - 0.04, 0.3, 0.024);
      t3L(x, [[sx + 0.05, yy - 0.06], [sx + 0.05, yy - (L === 6 ? 0.42 : 0.32)]], '#e8e2f0', 0.024); t3L(x, [[sx - 0.05, yy - 0.2], [sx + 0.15, yy - 0.2]], '#e8e2f0', 0.018);
      flag = [sx + 0.05, yy - (L === 6 ? 0.38 : 0.31), '#e0483a', '#ffd24a'];
      if (L === 6) { t3E(x, sx + 0.05, yy - 0.44, 0.045, 0.045, '#ffd24a', { hi: 0.5 }); var cr = shp(); twStarP(cr.p, X(0.6), -0.36, 0.05, 0.022); cr.ext(X(0.6) - 0.05, -0.41); cr.ext(X(0.6) + 0.05, -0.31); t3S(x, cr, '#ffd24a', { ink: 0.7 }); }
    }
  });
  return { ship: 1, radar: radar, flag: flag, arr: arr, heli: heli, T: tinfo, vls: vls, fun: fun, oy: oy, hl: hl, A: A, V: V, acc: C.acc, mounts: [[tinfo[0].x + 0.1, tinfo[0].y + oy - 0.03]].concat(tinfo.slice(1).map(function (t) { return [t.x, t.y + oy - 0.03]; })) };
}
function t3Foam(x, u, X, Y, x0, x1, y, time, id, bow) { // 흘수선의 흰 물결(픽셀로 직접)
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = 'rgba(255,255,255,0.92)'; x.lineWidth = Math.max(1.3, u * 0.042);
  var n = 8, i; x.beginPath();
  for (i = 0; i <= n; i++) { var px = X + lerp(x0, x1, i / n) * u, py = Y + (y + Math.sin(time * 3.4 + i * 1.9 + id) * 0.013 + (i % 2) * 0.014 - (i / n) * 0.03) * u; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
  x.stroke();
  for (i = 0; i < 2; i++) { var ph = (time * 0.4 + i * 0.5 + id * 0.137) % 1; x.globalAlpha = (1 - ph) * 0.5; x.lineWidth = Math.max(1, u * 0.02); x.beginPath(); x.ellipse(X + (x0 + x1) / 2 * u, Y + (y + 0.02) * u, (x1 - x0) * (0.52 + ph * 0.16) * u, (0.1 + ph * 0.09) * u, 0, 0.25, Math.PI - 0.25); x.stroke(); }
  if (bow) { x.globalAlpha = 0.9; x.fillStyle = '#ffffff'; var b = Math.sin(time * 2.6 + id) * 0.01; x.beginPath(); x.ellipse(X + (x1 + 0.02) * u, Y + (y - 0.04 + b) * u, u * 0.05, u * 0.022, -0.5, 0, Math.PI * 2); x.fill(); }
  x.restore();
}
function t3WarshipParts(x, t, X, Y, S, time, info) {
  var p = info.p, u = info.u, id = t.id || 0, tm = t3Still(t) ? 0.3 : time, f = t3FireK(t), kick = f * f, aim = t.aim == null ? -0.6 : t.aim, sh = t.shots | 0, ca = Math.cos(aim), sa = Math.sin(aim);
  var bob = Math.sin(tm * 1.7 + id) * 0.016 * u, rot = Math.sin(tm * 1.25 + id * 2.1) * 0.016 - ca * kick * 0.04, oy = info.oy * u;
  x.save(); x.translate(X - ca * kick * 0.03 * u, Y + oy + bob - sa * kick * 0.012 * u); x.rotate(rot);
  // 굴뚝 연기
  if (info.fun.length && !info.A) for (var s = 0; s < 3; s++) { var ph = (tm * 0.45 + s / 3 + id * 0.3) % 1, fn = info.fun[0]; t3Soft(x, (fn[0] - 0.14 * ph - 0.02) * u, (fn[1] - info.oy - 0.06 - 0.36 * ph) * u, (0.05 + 0.1 * ph) * u, info.V ? '#3c3850' : '#f2f2fa', (1 - ph) * 0.6); }
  t3Img(x, p.hull, 0, 0);
  // 레이더 막대(돌아감)
  if (info.radar) { var rw = Math.cos(tm * 3 + id) * info.radar[2] * u, rx = info.radar[0] * u, ry = info.radar[1] * u; x.lineCap = 'round'; x.beginPath(); x.moveTo(rx - rw, ry); x.lineTo(rx + rw, ry - rw * 0.12); x.strokeStyle = T3_OL; x.lineWidth = Math.max(2.4, u * 0.06); x.stroke(); x.strokeStyle = info.A ? '#eaf6ff' : '#d6dbe8'; x.lineWidth = Math.max(1.2, u * 0.034); x.stroke(); }
  if (info.A) { var gl = 0.35 + 0.25 * Math.sin(tm * 2.4 + id); if (info.arr) t3Glow(x, info.arr[0] * u, info.arr[1] * u, u * 0.2, info.acc, gl + f * 0.5); }
  // 포탑: 옆면(아래) → 포신 → 윗면
  var T = info.T, i, j;
  for (i = 0; i < T.length; i++) { var q = T[i]; t3Rot(x, p[q.nm + 's'], q.x * u, (q.y + q.hgt) * u, aim, 0.78); }
  for (i = 0; i < T.length; i++) {
    var q2 = T[i], bs = p[q2.nm + 'b'];
    x.save(); x.translate(q2.x * u, (q2.y + q2.hgt * 0.5) * u); x.scale(1, 0.78); x.rotate(aim);
    for (j = 0; j < q2.nb; j++) { var mine = info.V || ((sh + i) % q2.nb) === j, rec = (mine ? 1 : 0.3) * kick * 0.085 * q2.sc * u; x.drawImage(bs.c, -bs.ax - rec, (j - (q2.nb - 1) / 2) * q2.gap * u - bs.ay); }
    x.restore();
    if (f > 0.55) { var mr = (f - 0.55) / 0.45; t3Glow(x, (q2.x + ca * (q2.bl + 0.06 * q2.sc)) * u, (q2.y + q2.hgt * 0.5 + sa * (q2.bl + 0.06 * q2.sc) * 0.78) * u, u * (0.1 + 0.16 * mr) * q2.sc, '#ffcf70', 0.5 + mr); }
  }
  for (i = 0; i < T.length; i++) { var q3 = T[i]; t3Rot(x, p[q3.nm + 'h'], q3.x * u, q3.y * u, aim, 0.78); }
  // 수직 발사관: 쏜 칸에서 불빛과 연기
  if (info.vls.length && f > 0) { var c = info.vls[sh % info.vls.length], cx = c[0] * u, cy = (c[1] - info.oy) * u; if (p.ms && f > 0.3) { x.save(); x.globalAlpha = Math.min(1, (f - 0.3) * 4); t3Img(x, p.ms, cx, cy - (1 - f) * 0.75 * u); x.restore(); t3Glow(x, cx, cy - (1 - f) * 0.75 * u + u * 0.05, u * 0.1, '#ffb040', f); } t3Glow(x, cx, cy - u * 0.03, u * (0.06 + 0.1 * f), '#ffd27a', 0.5 + f); t3Soft(x, cx - u * 0.02, cy - u * (0.08 + 0.2 * (1 - f)), u * (0.05 + 0.08 * (1 - f)), '#ffffff', f * 0.8); }
  // 헬기 날개
  if (info.heli) { var ha = tm * 26 + id, hx = info.heli[0] * u, hy = info.heli[1] * u; x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.ellipse(hx, hy, u * 0.16, u * 0.04, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = T3_OL; x.lineWidth = Math.max(1, u * 0.02); x.lineCap = 'round'; x.beginPath(); x.moveTo(hx - Math.cos(ha) * u * 0.16, hy - Math.sin(ha) * u * 0.04); x.lineTo(hx + Math.cos(ha) * u * 0.16, hy + Math.sin(ha) * u * 0.04); x.stroke(); }
  // 돛대 깃발
  if (info.flag) t3Flag(x, info.flag[0] * u, info.flag[1] * u, u * 0.15, u * 0.085, info.flag[2], tm + id, -1, 0, info.flag[3]);
  x.restore();
  t3Foam(x, u, X, Y + oy, -0.5 * info.hl, 0.53 * info.hl, 0.02, tm, id, 1);
}
t3Reg('warship', t3Warship, t3WarshipParts, 1);

// ===================== 거북선 (물 칸 전용) =====================
// 1 작은 거북선 → 2 → 3 철갑 가시와 뿔 달린 용머리. A 화룡 거북선(용머리가 크고 붉게 달아오름) / B 판옥 대장선(2층 누각, 깃발, 북)
function t3Hex(x, s, r, col, a) {
  x.save(); x.clip(s.p); x.strokeStyle = rgba(col, a); x.lineWidth = T3W * 0.75;
  var w = r * 1.732, row = 0;
  for (var y = s.y0; y < s.y1 + r; y += r * 1.3, row++) for (var xx = s.x0 - (row % 2) * w / 2; xx < s.x1 + w; xx += w) { x.beginPath(); for (var k = 0; k < 6; k++) { var an = Math.PI / 6 + k * Math.PI / 3, px = xx + Math.cos(an) * r, py = y + Math.sin(an) * r * 0.86; if (k) x.lineTo(px, py); else x.moveTo(px, py); } x.closePath(); x.stroke(); }
  x.restore();
}
// 용머리(오른쪽을 봄, 원점 = 목 밑동). open: 입 벌림 0~1
function t3DragonHead(x, hs, C, o, open) {
  x.save(); x.scale(hs, hs); var w0 = T3W; T3W = T3W / hs;
  var dc = C.drg, hy = -0.2;
  // 갈기(불꽃)
  if (o.mane) [[-0.02, -0.3, 0.1], [0.05, -0.34, 0.12], [-0.06, -0.2, 0.09], [0.0, -0.12, 0.08]].forEach(function (m, i) { t3Pg(x, [[m[0] + 0.04, m[1] + 0.07], [m[0] - m[2], m[1] - m[2] * 0.5], [m[0] - 0.01, m[1] - 0.01], [m[0] - m[2] * 0.6, m[1] - m[2] * 1.1], [m[0] + 0.07, m[1]]], i % 2 ? '#ffd24a' : '#ff8a3a', { hi: 0.3, lo: 0.1, ink: 0.8 }); });
  // 목
  var nk = limbShape(0, 0.03, 0.1, -0.15, 0.125, 0.1); t3S(x, nk, dc, { hi: 0.3, lo: 0.25 });
  x.save(); x.clip(nk.p); x.fillStyle = C.belly; x.beginPath(); x.ellipse(0.1, -0.03, 0.045, 0.13, 0.55, 0, Math.PI * 2); x.fill(); x.restore(); x.strokeStyle = t3Ink(dc); x.lineWidth = T3W; x.stroke(nk.p);
  // 뿔
  if (o.horn) [[0.06, -0.26, -0.07, -0.13], [0.11, -0.27, -0.01, -0.15]].forEach(function (h) { t3Pg(x, [[h[0] - 0.025, h[1] + 0.02], [h[0] + h[2], h[1] + h[3]], [h[0] + 0.03, h[1] + 0.005]], o.hornC || '#ffd24a', { hi: 0.5, lo: 0.2, ink: 0.8 }); });
  // 아래턱(벌어짐)
  x.save(); x.translate(0.12, hy + 0.045); x.rotate(open * 0.5);
  if (open > 0.05) { t3Pg(x, [[0, -0.02], [0.17, -0.005], [0.16, 0.02], [0, 0.02]], '#7a1f2a', { flat: 1, ink: 0 }); }
  t3R(x, -0.02, 0, 0.19, 0.045, 0.02, twSh(dc, 0.12), { hi: 0.2, lo: 0.25 });
  x.fillStyle = '#ffffff'; for (var i = 0; i < 3; i++) { x.beginPath(); x.moveTo(0.06 + i * 0.04, 0.004); x.lineTo(0.075 + i * 0.04, -0.03); x.lineTo(0.09 + i * 0.04, 0.004); x.fill(); }
  x.restore();
  // 머리와 주둥이
  var hd = shp(), p = hd.p; p.moveTo(0.03, hy - 0.01); p.quadraticCurveTo(0.04, hy - 0.1, 0.13, hy - 0.09); p.quadraticCurveTo(0.2, hy - 0.085, 0.24, hy - 0.05); p.quadraticCurveTo(0.33, hy - 0.06, 0.335, hy); p.quadraticCurveTo(0.335, hy + 0.045, 0.28, hy + 0.045); p.lineTo(0.1, hy + 0.05); p.quadraticCurveTo(0.03, hy + 0.06, 0.03, hy - 0.01); p.closePath(); hd.ext(0.03, hy - 0.1); hd.ext(0.335, hy + 0.06);
  t3S(x, hd, dc, { hi: 0.36, lo: 0.24 });
  x.fillStyle = '#ffffff'; for (var j = 0; j < 4; j++) { x.beginPath(); x.moveTo(0.15 + j * 0.042, hy + 0.044); x.lineTo(0.166 + j * 0.042, hy + 0.078); x.lineTo(0.182 + j * 0.042, hy + 0.044); x.fill(); }
  t3Dot(x, 0.31, hy - 0.022, 0.012, t3Ink(dc));
  // 눈과 눈썹
  t3E(x, 0.15, hy - 0.035, 0.034, 0.03, o.eye || '#fff6c8', { flat: 1, ink: 0.7 }); t3Dot(x, 0.16, hy - 0.032, 0.015, '#2a1830');
  t3L(x, [[0.105, hy - 0.075], [0.2, hy - 0.05]], o.hornC || twSh(dc, 0.3), 0.02, 1.2);
  // 수염
  if (o.whisk) { x.lineCap = 'round'; x.beginPath(); x.moveTo(0.3, hy + 0.01); x.quadraticCurveTo(0.4, hy + 0.0, 0.41, hy - 0.08); x.strokeStyle = t3Ink('#ffd24a'); x.lineWidth = 0.02 + T3W; x.stroke(); x.strokeStyle = o.hornC || '#ffd24a'; x.lineWidth = 0.02; x.stroke(); }
  t3Hi(x, 0.1, hy - 0.06, 0.03, 0.014, 0.6, -0.3);
  T3W = w0; x.restore();
}
function t3Turtle(D) {
  var L = D.L, A = D.A, V = D.V, hl = [0, 0.84, 0.92, 1, 1.02, 1.06, 1.1][L], X = function (v) { return v * hl; };
  var C = { wood: '#c2803f', woodD: '#96592f', shell: A ? (L === 6 ? '#2f5a48' : '#3f7250') : '#4f8a5a', rim: A ? '#de4a32' : L >= 3 ? '#ffd24a' : '#3f7048', drg: A ? (L === 6 ? '#f2a22e' : '#de4a32') : V ? '#4f8a5a' : '#62b070', belly: '#f8e08e', spike: A && L >= 5 ? '#ffb05a' : '#eef1f7' };
  var np = [0, 2, 3, 4, 4, 5, 5][L], no = [0, 2, 3, 4, 4, 4, 5][L], gw = V ? -0.36 : -0.25, oy = -0.05, ports = [], oars = [], flags = [], drum = null, seam = null;
  var hs = A ? [0, 0, 0, 0, 1.35, 1.6, 2][L] : V ? 0.95 : [0, 0.82, 0.95, 1.08][L], hx = X(0.5), hyy = gw - 0.07;
  var ho = { horn: L >= 3, whisk: L >= 3, mane: A && L >= 5, hornC: A ? '#ffd24a' : L >= 3 ? '#ffd24a' : null, eye: A ? '#ffe36a' : null };
  [0, 1].forEach(function (op) { D.part('h' + op, [-0.2 * hs, -0.5 * hs, 0.5 * hs, 0.14 * hs], function (x) { t3DragonHead(x, hs, C, ho, op ? 1 : 0); }); });
  D.part('hull', [-0.95, -1.75, 0.95, 0.14], function (x) {
    // 꼬리
    x.lineCap = 'round'; x.beginPath(); x.moveTo(X(-0.56), gw - 0.02); x.quadraticCurveTo(X(-0.72), gw - 0.04, X(-0.68), gw - 0.2); x.strokeStyle = t3Ink(C.drg); x.lineWidth = 0.07 + T3W * 1.5; x.stroke(); x.strokeStyle = C.drg; x.lineWidth = 0.07; x.stroke();
    // 선체 옆면(나무)
    var side = shp(), p = side.p;
    p.moveTo(X(-0.62), gw - 0.07); p.lineTo(X(-0.55), gw); p.lineTo(X(0.44), gw - 0.03); p.lineTo(X(0.57), gw - 0.11); p.quadraticCurveTo(X(0.57), -0.07, X(0.45), 0.0); p.lineTo(X(-0.46), 0.03); p.quadraticCurveTo(X(-0.6), 0.01, X(-0.63), -0.12); p.closePath(); side.ext(X(-0.63), gw - 0.11); side.ext(X(0.57), 0.03);
    t3S(x, side, C.wood, { hi: 0.3, lo: 0.3 });
    x.save(); x.clip(side.p); x.strokeStyle = rgba(t3Ink(C.wood), 0.4); x.lineWidth = T3W * 0.6; for (var i = 1; i < (V ? 6 : 4); i++) { x.beginPath(); x.moveTo(-1, 0.03 - i * 0.065); x.lineTo(1, 0.0 - i * 0.065); x.stroke(); }
    x.fillStyle = C.woodD; x.fillRect(-1, -0.035, 2, 0.1);
    if (V) { // 위층 방패판: 붉은색과 청록 번갈아
      for (var k = 0; k < 9; k++) { x.fillStyle = k % 2 ? '#2f8a86' : '#c2443a'; x.fillRect(X(-0.56) + k * hl * 0.125, gw - 0.04, hl * 0.125, 0.15); }
      x.fillStyle = '#ffd24a'; x.fillRect(-1, gw + 0.105, 2, 0.022);
    }
    x.restore(); x.strokeStyle = t3Ink(C.wood); x.lineWidth = T3W; x.stroke(side.p);
    // 포문
    var py = V ? gw + 0.055 : -0.125;
    for (var q = 0; q < np; q++) { var px = X(lerp(-0.4, 0.3, np === 1 ? 0.5 : q / (np - 1))), ppy = py - q * 0.004; t3R(x, px - 0.04, ppy - 0.036, 0.08, 0.072, 0.012, '#2a1c30', { flat: 1, inkc: V ? '#ffd24a' : '#6a3a20', ink: 0.9 }); t3E(x, px, ppy, 0.022, 0.022, '#56607a', { flat: 1, ink: 0.6 }); t3Dot(x, px, ppy, 0.009, '#15101e'); ports.push([px, ppy + oy]); }
    for (var r = 0; r < no; r++) oars.push([X(lerp(-0.34, 0.24, no === 1 ? 0.5 : r / (no - 1))), -0.03 + oy]);
    if (!V) {
      // 등껍질: 육각 철갑과 가시
      var sh = shp(), s = sh.p; s.moveTo(X(-0.57), gw + 0.005); s.bezierCurveTo(X(-0.56), gw - 0.3, X(-0.25), gw - 0.37, X(0.0), gw - 0.37); s.bezierCurveTo(X(0.26), gw - 0.37, X(0.45), gw - 0.28, X(0.47), gw - 0.025); s.quadraticCurveTo(X(0), gw + 0.06, X(-0.57), gw + 0.005); s.closePath(); sh.ext(X(-0.57), gw - 0.37); sh.ext(X(0.47), gw + 0.04);
      t3S(x, sh, C.shell, { hi: 0.36, lo: 0.34 });
      if (L >= 2) t3Hex(x, sh, 0.075, A && L === 6 ? '#ffb040' : t3Ink(C.shell), A && L === 6 ? 0.95 : 0.5);
      x.save(); x.clip(sh.p); x.strokeStyle = C.rim; x.lineWidth = 0.05; x.beginPath(); x.moveTo(X(-0.57), gw + 0.005); x.quadraticCurveTo(X(0), gw + 0.06, X(0.47), gw - 0.025); x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.2)'; x.beginPath(); x.ellipse(X(-0.2), gw - 0.27, 0.22 * hl, 0.06, -0.12, 0, Math.PI * 2); x.fill(); x.restore();
      x.strokeStyle = t3Ink(C.shell); x.lineWidth = T3W; x.stroke(sh.p);
      var top = function (xn) { var k = clamp((xn + 0.57) / 1.04, 0, 1); return gw - 0.37 * Math.pow(Math.sin(Math.PI * k), 0.6); };
      var rows = L === 1 ? [[4, 0.0]] : L === 2 ? [[5, 0.0], [3, 0.14]] : [[6, 0.0], [5, 0.13], [4, 0.24]];
      rows.forEach(function (rw, ri) { for (var i2 = 0; i2 < rw[0]; i2++) { var xn = lerp(-0.42, 0.34, (i2 + 0.5) / rw[0]) + ri * 0.02, sx = X(xn), sy = top(xn) + rw[1] + 0.012, lean = xn * 0.09, hh = ri ? 0.075 : 0.095; if (sy > gw - 0.04) continue; t3Pg(x, [[sx - 0.034, sy], [sx + lean, sy - hh], [sx + 0.034, sy]], C.spike, { hi: 0.5, lo: 0.3, ink: 0.75 }); } });
      if (A && L === 6) seam = [X(-0.05), gw - 0.18 + oy];
      if (L === 2) flags.push([X(-0.55), gw - 0.3, 0.15, 0.085, '#ffd24a', '#e0483a']);
      if (L >= 3) { t3L(x, [[X(-0.08), gw - 0.36], [X(-0.08), gw - 0.72]], '#8f5530', 0.03); t3E(x, X(-0.08), gw - 0.73, 0.03, 0.03, '#ffd24a', { hi: 0.5, ink: 0.7 }); flags.push([X(-0.08), gw - 0.7, 0.2, 0.11, A ? '#de4a32' : '#f6f0dc', A ? '#ffd24a' : '#e0483a']); }
      if (L === 2) t3L(x, [[X(-0.55), gw - 0.06], [X(-0.55), gw - 0.32]], '#8f5530', 0.026);
      if (A && L >= 5) [[-0.38, -0.06], [0.3, -0.07]].forEach(function (b) { if (L < 6 && b[0] > 0) return; t3Cyl(x, X(b[0]), gw + b[1] - 0.05, 0.045, 0.02, 0.05, '#4a4660', { top: '#ff9a3a' }); });
    } else {
      // 판옥선: 갑판과 누각
      var deck = shp(), d = deck.p; d.moveTo(X(-0.62), gw - 0.07); d.lineTo(X(-0.5), gw - 0.17); d.lineTo(X(0.45), gw - 0.2); d.lineTo(X(0.57), gw - 0.11); d.lineTo(X(0.44), gw - 0.03); d.lineTo(X(-0.55), gw); d.closePath(); deck.ext(X(-0.62), gw - 0.2); deck.ext(X(0.57), gw);
      t3S(x, deck, '#e2bd86', { hi: 0.3, lo: 0.16 });
      var cx = X(-0.08), by = gw - 0.07, two = L === 6, pw = L === 4 ? 0.36 : 0.42, ph = 0.17;
      // 기둥과 어두운 안쪽
      t3R(x, cx - pw / 2 + 0.02, by - ph, pw - 0.04, ph, 0, '#4a2a3a', { flat: 1 });
      for (var c = 0; c < 4; c++) t3L(x, [[cx - pw / 2 + 0.02 + c * (pw - 0.04) / 3, by], [cx - pw / 2 + 0.02 + c * (pw - 0.04) / 3, by - ph]], '#c8423a', 0.032);
      t3L(x, [[cx - pw / 2, by - 0.055], [cx + pw / 2, by - 0.055]], '#e8c070', 0.022);
      t3Giwa(x, cx, by - ph, pw + 0.2, 0.15, '#56617e', { eave: '#8f9ab8', tip: two ? '#ffd24a' : null });
      if (L >= 5) { var uy = by - ph - 0.15; t3Box(x, cx, uy + 0.01, pw * 0.56, 0.1, 0, two ? '#f3e6c8' : '#c8423a'); if (two) { x.fillStyle = '#c8423a'; x.fillRect(cx - pw * 0.2, uy - 0.07, pw * 0.4, 0.05); } t3Giwa(x, cx, uy - 0.09, pw * 0.56 + 0.18, two ? 0.15 : 0.12, two ? '#3f4f78' : '#56617e', { eave: two ? '#ffd24a' : '#8f9ab8', tip: '#ffd24a', n: 5 }); if (two) t3E(x, cx, uy - 0.27, 0.035, 0.045, '#ffd24a', { hi: 0.5 }); }
      // 북
      var dx = X(0.24), dy = gw - 0.15, dr = L === 6 ? 0.1 : 0.085; t3L(x, [[dx - dr * 0.7, dy + dr * 1.25], [dx, dy], [dx + dr * 0.7, dy + dr * 1.25]], '#8f5530', 0.026);
      t3E(x, dx + 0.03, dy, dr * 0.6, dr, '#c8423a', { hi: 0.2, lo: 0.3 }); t3E(x, dx, dy, dr * 0.6, dr, '#fbeed0', { hi: 0.3, lo: 0.15 }); x.fillStyle = '#c8423a'; x.beginPath(); x.ellipse(dx, dy, dr * 0.3, dr * 0.5, 0, Math.PI * 0.5, Math.PI * 1.5); x.fill(); x.fillStyle = '#2f6fb8'; x.beginPath(); x.ellipse(dx, dy, dr * 0.3, dr * 0.5, 0, -Math.PI * 0.5, Math.PI * 0.5); x.fill();
      drum = [dx, dy + oy, dr];
      // 깃대
      var fx = X(-0.5), fh = L === 6 ? 0.78 : L === 5 ? 0.6 : 0.5; t3L(x, [[fx, gw - 0.1], [fx, gw - 0.1 - fh]], '#8f5530', 0.028); t3E(x, fx, gw - 0.11 - fh, 0.028, 0.028, '#ffd24a', { hi: 0.5, ink: 0.7 });
      flags.push([fx, gw - 0.08 - fh, L === 6 ? 0.2 : 0.17, L === 6 ? 0.34 : 0.22, L === 6 ? '#3f6fd0' : '#c8423a', '#ffd24a', 1]);
      if (L >= 5) { var f2 = X(0.47); t3L(x, [[f2, gw - 0.14], [f2, gw - 0.5]], '#8f5530', 0.024); flags.push([f2, gw - 0.49, 0.14, 0.09, '#ffd24a', '#c8423a']); }
    }
  });
  return { ship: 1, oy: oy, hl: hl, A: A, V: V, L: L, ports: ports, oars: oars, flags: flags, drum: drum, seam: seam, head: [hx, hyy, hs], mounts: [[hx + 0.3 * hs, hyy - 0.17 * hs + oy]] };
}
function t3TurtleParts(x, t, X, Y, S, time, info) {
  var p = info.p, u = info.u, id = t.id || 0, tm = t3Still(t) ? 0.3 : time, f = t3FireK(t), kick = f * f, aim = t.aim == null ? 0.6 : t.aim, sh = t.shots | 0, sa = Math.sin(aim), i;
  var bob = Math.sin(tm * 1.5 + id) * 0.014 * u, rot = Math.sin(tm * 1.1 + id * 2.1) * 0.014, oy = info.oy * u;
  x.save(); x.translate(X, Y + oy + bob); x.rotate(rot);
  t3Img(x, p.hull, 0, 0);
  if (info.seam) t3Glow(x, info.seam[0] * u, (info.seam[1] - info.oy) * u, u * 0.42, '#ff8a3a', 0.2 + 0.14 * Math.sin(tm * 3 + id) + f * 0.3);
  // 깃발
  for (i = 0; i < info.flags.length; i++) { var fl = info.flags[i]; t3Flag(x, fl[0] * u, fl[1] * u, fl[2] * u, fl[3] * u, fl[4], tm + id + i, -1, fl[6], fl[5]); }
  // 북: 쏠 때 울림
  if (info.drum && f > 0) { x.save(); x.globalAlpha = f * 0.8; x.strokeStyle = '#fff3c0'; x.lineWidth = Math.max(1, u * 0.02); x.beginPath(); x.ellipse(info.drum[0] * u, (info.drum[1] - info.oy) * u, info.drum[2] * (0.8 + (1 - f) * 1.2) * u, info.drum[2] * (1.2 + (1 - f) * 1.4) * u, 0, 0, Math.PI * 2); x.stroke(); x.restore(); }
  // 노 젓기
  var no = info.oars.length, ow = Math.max(1.2, u * 0.028), ol = Math.max(1.4, u * 0.03), pass, OA = [];
  for (i = 0; i < no; i++) { var o = info.oars[i], a = Math.sin(tm * 2.3 + i * 0.7 + id) * 0.5, lift = Math.max(0, Math.cos(tm * 2.3 + i * 0.7 + id)) * 0.05, ox = o[0] * u, oy2 = (o[1] - info.oy) * u, ex = ox + Math.sin(a) * 0.16 * u, ey = oy2 + (0.15 - lift) * u; OA.push([ox, oy2, ex, ey, ex - Math.sin(a) * 0.05 * u, ey - 0.045 * u]); }
  x.lineCap = 'round';
  for (pass = 0; pass < 2; pass++) { x.beginPath(); for (i = 0; i < no; i++) { x.moveTo(OA[i][0], OA[i][1]); x.lineTo(OA[i][2], OA[i][3]); } x.strokeStyle = pass ? '#d8a060' : T3_OL; x.lineWidth = pass ? ow : ow + ol; x.stroke(); }
  for (pass = 0; pass < 2; pass++) { x.beginPath(); for (i = 0; i < no; i++) { x.moveTo(OA[i][4], OA[i][5]); x.lineTo(OA[i][2], OA[i][3]); } x.strokeStyle = pass ? '#f0c080' : T3_OL; x.lineWidth = pass ? ow * 2 : ow * 2 + ol; x.stroke(); }
  // 포문 섬광(가까운 쪽 현)
  if (f > 0.4 && info.ports.length) { var k = (f - 0.4) / 0.6; for (i = 0; i < info.ports.length; i++) { if (!info.V && info.ports.length > 2 && (i + sh) % 2) continue; var pt = info.ports[i]; t3Glow(x, pt[0] * u, (pt[1] - info.oy + (sa < -0.3 ? -0.02 : 0.03)) * u, u * (0.07 + 0.12 * k), '#ffd070', (sa < -0.3 ? 0.35 : 0.6) + k); } }
  // 용머리: 쏠 때 입을 벌리고 앞으로 내밂
  var H = info.head, open = f > 0.12, nod = Math.sin(tm * 1.4 + id) * 0.04 - (open ? 0.1 * kick : 0), hx = (H[0] + (open ? 0.04 * kick * H[2] : 0)) * u, hy = H[1] * u, mx = hx + 0.31 * H[2] * u, my = hy - 0.16 * H[2] * u;
  t3Rot(x, open ? p.h1 : p.h0, hx, hy, nod, 1);
  if (info.A && !open) t3Glow(x, mx - 0.03 * H[2] * u, my, u * 0.11 * H[2], '#ff7a2a', 0.35 + 0.2 * Math.sin(tm * 5 + id));
  if (open) { t3Soft(x, mx + u * 0.06 * H[2], my + u * 0.015, u * (0.1 + 0.16 * f) * Math.max(1, H[2] * 0.8), info.A ? '#ff5a1a' : '#ff8a2a', 0.55 + f * 0.4); t3Glow(x, mx + u * 0.07 * H[2], my + u * 0.015, u * (0.13 + 0.18 * f) * Math.max(1, H[2] * 0.8), info.A ? '#ffa040' : '#ffc060', 0.5 + f); }
  x.restore();
  t3Foam(x, u, X, Y + oy, -0.5 * info.hl, 0.5 * info.hl, 0.02, tm, id, 1);
}
t3Reg('turtle', t3Turtle, t3TurtleParts, 1);


// ===================== 신기전 화차 =====================
// 1 작은 수레와 화살통 → 2 → 3 스무 구멍. A 대신기전(굵은 로켓 화살 몇 발) / B 백발 화차(촘촘한 화살 구멍 수백)
function t3Wheel(x, cx, cy, r, col, far) {
  var rc = far ? twSh(col, 0.3) : col;
  x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, r * 0.86, 0, Math.PI * 2); x.strokeStyle = t3Ink(col); x.lineWidth = r * 0.26 + T3W * 1.7; x.stroke(); x.strokeStyle = rc; x.lineWidth = r * 0.26; x.stroke();
  for (var k = 0; k < 4; k++) { var a = k * Math.PI / 4 + 0.2; t3L(x, [[cx - Math.cos(a) * r * 0.76, cy - Math.sin(a) * r * 0.76], [cx + Math.cos(a) * r * 0.76, cy + Math.sin(a) * r * 0.76]], twLt(rc, 0.2), r * 0.11, 1.2); }
  x.beginPath(); x.arc(cx, cy, r * 0.99, 0, Math.PI * 2); x.strokeStyle = far ? '#4a4660' : '#5f5a78'; x.lineWidth = r * 0.07; x.stroke();
  t3E(x, cx, cy, r * 0.23, r * 0.23, far ? '#9a8a60' : '#ffd24a', { hi: 0.5, ink: 0.8 });
}
function t3Hwacha(D) {
  var L = D.L, A = D.A, V = D.V, red = '#c0503a', wood = '#cf8f4c', woodD = '#a56a38', iron = '#5c5874', gold = '#ffd24a';
  var wr = [0, 0.17, 0.185, 0.2, 0.2, 0.21, 0.225][L], bs = A ? [0, 0, 0, 0, 1, 1.1, 1.24][L] : V ? [0, 0, 0, 0, 1.12, 1.22, 1.36][L] : [0, 0.8, 0.9, 1][L];
  var nc = V ? [0, 0, 0, 0, 7, 9, 12][L] : [0, 3, 4, 5][L], nr = V ? [0, 0, 0, 0, 5, 6, 9][L] : [0, 2, 3, 4][L], n = A ? L - 1 : nc * nr;
  var pv = [0.0, -(wr * 2 + 0.1 + (V ? 0.05 : 0))], sl0 = -0.25 * bs, sl1 = 0.17 * bs, fh = (V ? 0.32 : 0.27) * bs, fw = (V ? 0.25 : 0.2) * bs, fsk = 0.075 * bs, flag = null;
  var O = [sl1, -fh / 2], U = [fw, -fsk], Vv = [0, fh], rk = [];
  // 수레(먼 바퀴, 채, 바닥, 받침 기둥)
  D.part('cart', [-0.75, -1.2, 0.6, 0.08], function (x) {
    t3Wheel(x, 0.12, -wr - 0.05, wr, woodD, 1);
    t3L(x, [[-0.2, -wr - 0.03], [-0.56, -0.03]], woodD, 0.045); t3L(x, [[-0.4, -wr * 0.55], [-0.4, -0.02]], woodD, 0.035);
    t3Pg(x, [[-0.3, -wr + 0.02], [-0.24, -wr - 0.07], [0.3, -wr - 0.07], [0.24, -wr + 0.02]], wood, { hi: 0.3, lo: 0.25 }); t3R(x, -0.3, -wr + 0.02, 0.54, 0.05, 0.01, woodD, { hi: 0.2, lo: 0.3 });
    t3L(x, [[-0.13, -wr - 0.03], [pv[0] - 0.02, pv[1] + 0.02]], L >= 3 ? iron : woodD, 0.05); t3L(x, [[0.17, -wr - 0.03], [pv[0] + 0.03, pv[1] + 0.02]], L >= 3 ? iron : woodD, 0.05);
    if (L >= 3) { var fx = -0.3, fy = -wr - 0.06; t3L(x, [[fx, fy], [fx, fy - 0.62]], woodD, 0.028); t3E(x, fx, fy - 0.63, 0.028, 0.028, gold, { hi: 0.5, ink: 0.7 }); flag = [fx, fy - 0.6, 0.17, 0.1, A ? '#e8862a' : V ? '#3f6fd0' : red, gold]; }
    if (L >= 5) { t3Cyl(x, -0.2, -wr - 0.2, 0.06, 0.03, 0.13, '#b8763c', { top: '#3a2a30', bands: [[0.3, 0.12, iron]] }); for (var i = 0; i < 3; i++) t3L(x, [[-0.23 + i * 0.03, -wr - 0.2], [-0.25 + i * 0.045, -wr - 0.36]], '#f0d090', 0.014, 1); }
  });
  D.part('wheel', [-0.4, -0.6, 0.4, 0.08], function (x) { t3Wheel(x, -0.06, -wr, wr, L >= 6 ? '#b8763c' : wood, 0); if (L >= 6) { x.beginPath(); x.arc(-0.06, -wr, wr * 0.99, 0, Math.PI * 2); x.strokeStyle = gold; x.lineWidth = wr * 0.07; x.stroke(); } });
  if (A) {
    // 대신기전: 틀 위에 굵은 로켓 화살
    var rl = 0.56 * bs, big = L === 6;
    D.part('rack', [-0.6, -0.5, 0.7, 0.3], function (x) {
      t3Pg(x, [[sl0 - 0.08, 0.1], [sl1 + 0.1, 0.1], [sl1 + 0.2, -0.02], [sl0 + 0.02, -0.02]], woodD, { hi: 0.25, lo: 0.25 });
      t3R(x, sl0 - 0.08, 0.1, sl1 - sl0 + 0.18, 0.045, 0.01, red, { hi: 0.25, lo: 0.3 });
      for (var i = 0; i < 4; i++) { var k = i / 3; t3L(x, [[lerp(sl0 - 0.06, sl1 + 0.08, k), 0.09], [lerp(sl0 + 0.04, sl1 + 0.18, k), -0.01]], iron, 0.026, 1.2); }
      if (big) { t3E(x, sl1 + 0.16, 0.06, 0.05, 0.05, gold, { hi: 0.5 }); t3E(x, sl0 - 0.04, 0.06, 0.05, 0.05, gold, { hi: 0.5 }); }
    });
    D.part('rk', [-0.1, -0.12, 0.9, 0.12], function (x) {
      var tr = 0.046 * bs;
      t3Pg(x, [[0, 0], [-0.03, -0.05], [0.07, -0.012], [0.07, 0.012], [-0.03, 0.05]], red, { hi: 0.3, lo: 0.2, ink: 0.8 });
      t3L(x, [[0.03, 0], [rl, 0]], '#ecd08a', 0.024 * bs);
      var tb = t3R(x, rl * 0.46, -tr, rl * 0.36, tr * 2, tr * 0.5, '#f6ecd2', { hi: 0.3, lo: 0.3 });
      x.save(); x.clip(tb.p); x.fillStyle = big ? gold : red; x.fillRect(rl * 0.5, -1, rl * 0.06, 2); x.fillRect(rl * 0.7, -1, rl * 0.06, 2); x.restore(); x.strokeStyle = t3Ink('#f6ecd2'); x.lineWidth = T3W; x.stroke(tb.p);
      t3Pg(x, [[rl - 0.01, -tr * 1.15], [rl + 0.13 * bs, 0], [rl - 0.01, tr * 1.15]], big ? gold : '#dfe4f0', { hi: 0.5, lo: 0.3 });
      t3Hi(x, rl * 0.6, -tr * 0.45, rl * 0.1, tr * 0.2, 0.7, 0);
    });
    for (var i = 0; i < n; i++) rk.push([sl0 - 0.06 + i * 0.03, 0.03 - i * 0.082 * bs]);
  } else {
    [0, 1].forEach(function (em) {
      D.part(em ? 'boxE' : 'box', [-0.6, -0.6, 0.8, 0.4], function (x) {
        var bc = V ? '#b04836' : red;
        // 윗면, 옆면
        t3Pg(x, [[sl0, -fh / 2], [sl0 + fw, -fh / 2 - fsk], [sl1 + fw, -fh / 2 - fsk], [sl1, -fh / 2]], twLt(bc, 0.3), { hi: 0.3, lo: 0.1 });
        var sd = t3R(x, sl0, -fh / 2, sl1 - sl0, fh, 0.012, bc, { hi: 0.28, lo: 0.3 });
        x.save(); x.clip(sd.p); x.fillStyle = V ? '#e9b860' : '#e2a85c'; x.fillRect(sl0 + (sl1 - sl0) * 0.14, -1, (sl1 - sl0) * 0.13, 2); x.fillRect(sl0 + (sl1 - sl0) * 0.7, -1, (sl1 - sl0) * 0.13, 2);
        x.strokeStyle = rgba(t3Ink(bc), 0.35); x.lineWidth = T3W * 0.6; for (var j = 1; j < 4; j++) { x.beginPath(); x.moveTo(sl0, -fh / 2 + fh * j / 4); x.lineTo(sl1, -fh / 2 + fh * j / 4); x.stroke(); }
        x.restore(); x.strokeStyle = t3Ink(bc); x.lineWidth = T3W; x.stroke(sd.p);
        if (L === 6) { x.strokeStyle = gold; x.lineWidth = 0.02; x.strokeRect(sl0 + 0.02, -fh / 2 + 0.02, sl1 - sl0 - 0.04, fh - 0.04); }
        // 앞면(화살 구멍)
        t3Pg(x, [[O[0], O[1]], [O[0] + U[0], O[1] + U[1]], [O[0] + U[0], O[1] + U[1] + Vv[1]], [O[0], O[1] + Vv[1]]], V ? '#6a3f2a' : '#7a4a2c', { hi: 0.15, lo: 0.2, inkc: L === 6 ? '#8a5a10' : null });
        var hr = Math.min(fw / nc, fh / nr) * 0.3;
        for (var r = 0; r < nr; r++) for (var c = 0; c < nc; c++) {
          var hx = O[0] + U[0] * (c + 0.5) / nc, hy = O[1] + U[1] * (c + 0.5) / nc + Vv[1] * (r + 0.5) / nr;
          t3Dot(x, hx, hy, hr * 1.1, '#24141c');
          if (!em) { t3Dot(x, hx + hr * 0.25, hy - hr * 0.2, hr * 0.92, (r + c) % 2 ? '#ffe9a0' : '#ffd24a'); if (hr > 0.012) { t3Dot(x, hx + hr * 0.4, hy - hr * 0.35, hr * 0.4, '#ffffff'); } }
        }
        if (!em && nc <= 5) { // 삐죽 나온 화살촉
          for (var c2 = 0; c2 < nc; c2++) { var tx = O[0] + U[0] * (c2 + 0.5) / nc, ty = O[1] + U[1] * (c2 + 0.5) / nc; t3Pg(x, [[tx - hr * 0.7, ty + hr * 0.4], [tx + hr * 1.3, ty - hr * 2.6], [tx + hr * 1.1, ty + hr * 0.4]], '#e6eaf4', { flat: 1, ink: 0.6 }); }
        }
      });
    });
  }
  return { hw: 1, A: A, V: V, n: n, nc: nc, nr: nr, pv: pv, O: O, U: U, Vv: Vv, rk: rk, flag: flag, fc: A ? [sl1 + 0.3, -0.06] : [O[0] + U[0] * 0.6, O[1] + U[1] * 0.5 + fh / 2], back: [sl0 - 0.05, 0], mounts: [[0.12, pv[1] - 0.16]] };
}
function t3HwachaParts(x, t, X, Y, S, time, info) {
  var p = info.p, u = info.u, id = t.id || 0, f = t3FireK(t), kick = f * f, aim = t.aim == null ? -0.6 : t.aim, dir = Math.cos(aim) >= 0 ? 1 : -1, sa = Math.sin(aim), m = t3Mem(t), n = info.n, sh = t.shots | 0, i;
  var still = t3Still(t), dt = m.tm == null ? 1 : clamp(time - m.tm, 0, 0.1); m.tm = time;
  // 발사틀: 쏠 때 치켜들고, 표적이 위쪽이면 더 듦
  var tgt = (f > 0 ? 0.66 : 0.36) - sa * 0.16; m.el = m.el == null || still ? (m.el == null ? tgt : m.el) : m.el + (tgt - m.el) * Math.min(1, dt * 14);
  // 빈 구멍: 쏘는 동안 차례로 비고, 멈추면 다시 참
  if (f <= 0) m.s0 = sh; var burst = Math.max(1, sh - (m.s0 == null ? sh - 1 : m.s0));
  if (f > 0) m.e = info.A ? clamp(burst, 1, n) : Math.min(n, Math.ceil(n * clamp(burst / 6 + (1 - f) * 0.9, 0.08, 1))); else m.e = Math.max(0, (m.e || 0) - dt * n * 2.2);
  var e = Math.round(m.e || 0);
  x.save(); x.translate(X - dir * kick * 0.04 * u, Y); x.scale(dir, 1);
  t3Img(x, p.cart, 0, 0);
  if (info.flag) { var fl = info.flag; t3Flag(x, fl[0] * u, fl[1] * u, fl[2] * u, fl[3] * u, fl[4], (still ? 0.3 : time) + id, -1, 0, fl[5]); }
  x.save(); x.translate(info.pv[0] * u, info.pv[1] * u); x.rotate(-m.el);
  if (f > 0.25) t3Soft(x, (info.back[0] - 0.1 - (1 - f) * 0.12) * u, 0.02 * u, u * (0.1 + 0.14 * (1 - f)), '#fff4e0', (f - 0.25) * 0.9);
  if (info.A) { t3Img(x, p.rack, 0, 0); for (i = n - 1; i >= 0; i--) if (i >= e) t3Img(x, p.rk, info.rk[i][0] * u, info.rk[i][1] * u); }
  else {
    t3Img(x, p.box, 0, 0);
    if (e > 0) {
      var O = info.O, U = info.U, V = info.Vv, nc = info.nc, nr = info.nr, r0 = Math.floor(e / nc), c0 = e - r0 * nc, P = function (a, b) { return [(O[0] + U[0] * a + V[0] * b) * u, (O[1] + U[1] * a + V[1] * b) * u]; }, q;
      x.save(); x.beginPath();
      if (r0 > 0) { q = P(0, 0); x.moveTo(q[0], q[1]); q = P(1, 0); x.lineTo(q[0], q[1]); q = P(1, r0 / nr); x.lineTo(q[0], q[1]); q = P(0, r0 / nr); x.lineTo(q[0], q[1]); x.closePath(); }
      if (c0 > 0 && r0 < nr) { q = P(0, r0 / nr); x.moveTo(q[0], q[1]); q = P(c0 / nc, r0 / nr); x.lineTo(q[0], q[1]); q = P(c0 / nc, (r0 + 1) / nr); x.lineTo(q[0], q[1]); q = P(0, (r0 + 1) / nr); x.lineTo(q[0], q[1]); x.closePath(); }
      x.clip(); t3Img(x, p.boxE, 0, 0); x.restore();
    }
  }
  if (f > 0.2) { var k = (f - 0.2) / 0.8; t3Soft(x, info.fc[0] * u, info.fc[1] * u, u * (0.12 + 0.12 * k), '#ff8a2a', 0.5 * k); t3Glow(x, (info.fc[0] + 0.06) * u, info.fc[1] * u, u * (0.16 + 0.22 * k), '#ffc860', 0.4 + k); }
  x.restore();
  t3Img(x, p.wheel, 0, 0);
  x.restore();
}
t3Reg('singijeon', t3Hwacha, t3HwachaParts);

// ===================== 아군 비행기(위에서 본 그림, 오른쪽이 기수) =====================
// t3PlaneSpr(v, S) → { c, ax, ay }: v 0 기본 전투기, 1 폭격기(폭격 편대), 2 요격기(요격 편대), 3 함재기. 길이 약 0.6~0.8칸
var T3_PL = [
  { c: ['#7fb2d6', '#5c94c0', '#ffd24a', '#c8f4ff'], f: [-0.3, 0.32, 0.06], w: [[0.11, 0.04], [-0.03, 0.28], [-0.14, 0.28], [-0.1, 0.04]], t: [[-0.21, 0.03], [-0.29, 0.14], [-0.35, 0.14], [-0.32, 0.03]], can: [0.1, 0.075, 0.034], mk: [-0.05, 0.17] },
  { c: ['#8fa3bd', '#7286a2', '#ff9a3a', '#d4eef8'], f: [-0.42, 0.4, 0.078], w: [[0.13, 0.05], [0.04, 0.45], [-0.07, 0.45], [-0.11, 0.05]], t: [[-0.3, 0.04], [-0.33, 0.19], [-0.42, 0.19], [-0.42, 0.04]], can: [0.27, 0.062, 0.046], eng: [0.17, 0.31], mk: [-0.02, 0.38] },
  { c: ['#f1f4f8', '#d3dce8', '#35c8f5', '#2f6fb0'], f: [-0.34, 0.4, 0.052], w: [[0.15, 0.03], [-0.2, 0.26], [-0.31, 0.26], [-0.26, 0.03]], t: [[0.22, 0.03], [0.13, 0.11], [0.08, 0.11], [0.11, 0.03]], can: [0.14, 0.085, 0.028], twin: 1, mk: [-0.17, 0.15] },
  { c: ['#5676a6', '#42608e', '#ffd24a', '#c8f4ff'], f: [-0.28, 0.3, 0.064], w: [[0.11, 0.045], [0.05, 0.3], [-0.06, 0.3], [-0.1, 0.045]], t: [[-0.2, 0.03], [-0.24, 0.14], [-0.3, 0.14], [-0.3, 0.03]], can: [0.08, 0.08, 0.037], prop: 1, mk: [0.0, 0.2] }];
function t3PlaneDraw(x, v) {
  var P = T3_PL[v] || T3_PL[0], C = P.c, f = P.f, F = { flat: 1 }, mir = function (pts) { return pts.map(function (q) { return [q[0], -q[1]]; }); };
  [P.w, mir(P.w)].forEach(function (w, i) {
    var s = t3Pg(x, w, C[1], F), sd = i ? -1 : 1;
    x.save(); x.clip(s.p); x.fillStyle = C[2]; x.fillRect(-1, sd > 0 ? P.w[1][1] - 0.06 : -P.w[1][1], 2, 0.06); x.fillStyle = rgba('#ffffff', 0.28); x.beginPath(); x.moveTo(w[0][0], w[0][1]); x.lineTo(w[1][0], w[1][1]); x.lineTo(w[1][0] - 0.035, w[1][1]); x.lineTo(w[0][0] - 0.05, w[0][1]); x.fill();
    if (v === 3) { x.fillStyle = rgba(t3Ink(C[1]), 0.6); x.fillRect(-1, sd * 0.15 - 0.006, 2, 0.012); }
    x.restore(); x.strokeStyle = t3Ink(C[1]); x.lineWidth = T3W; x.stroke(s.p);
    t3Dot(x, P.mk[0], sd * P.mk[1], 0.034, '#ffffff'); t3Dot(x, P.mk[0], sd * P.mk[1], 0.019, v === 2 ? C[2] : v === 1 ? '#3a4660' : '#e0483a');
    if (v === 2) t3L(x, [[-0.24, sd * 0.262], [-0.1, sd * 0.262]], '#e0483a', 0.02, 1.2);
  });
  [P.t, mir(P.t)].forEach(function (w) { t3Pg(x, w, v === 2 ? C[2] : C[1], F); });
  if (P.eng) P.eng.forEach(function (ey) { [1, -1].forEach(function (sd) { t3R(x, -0.05, sd * ey - 0.03, 0.2, 0.06, 0.03, twSh(C[0], 0.2), F); x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.ellipse(0.165, sd * ey, 0.012, 0.064, 0, 0, Math.PI * 2); x.fill(); t3Dot(x, 0.158, sd * ey, 0.015, C[2]); }); });
  if (P.twin) [1, -1].forEach(function (sd) { t3R(x, f[0] - 0.03, sd * 0.03 - 0.022, 0.1, 0.044, 0.01, '#4a5068', F); t3Dot(x, f[0] - 0.03, sd * 0.03, 0.016, '#ffb04a'); });
  else if (!P.prop && !P.eng) { t3R(x, f[0] - 0.02, -0.028, 0.06, 0.056, 0.01, '#4a5068', F); t3Dot(x, f[0] - 0.02, 0, 0.018, '#ffb04a'); }
  if (v === 3) t3L(x, [[f[0] - 0.07, 0], [f[0], 0]], '#2f2a40', 0.012, 1);
  // 몸통
  var s = shp(), p = s.p, x0 = f[0], x1 = f[1], hw = f[2], xm = x0 + (x1 - x0) * 0.62;
  p.moveTo(x0, -hw * 0.45); p.quadraticCurveTo(x0 + (x1 - x0) * 0.3, -hw * 1.12, xm, -hw); p.quadraticCurveTo(x1 - 0.03, -hw * 0.85, x1, 0); p.quadraticCurveTo(x1 - 0.03, hw * 0.85, xm, hw); p.quadraticCurveTo(x0 + (x1 - x0) * 0.3, hw * 1.12, x0, hw * 0.45); p.closePath(); s.ext(x0, -hw); s.ext(x1, hw);
  t3S(x, s, C[0], F);
  x.save(); x.clip(s.p); x.fillStyle = rgba('#ffffff', 0.4); x.beginPath(); x.ellipse((x0 + x1) / 2, -hw * 0.35, (x1 - x0) * 0.42, hw * 0.3, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = C[2]; x.fillRect(x1 - (v === 2 ? 0.09 : 0.07), -1, 0.2, 2); if (v === 1) { x.fillRect(-0.2, -1, 0.045, 2); x.fillRect(-0.12, -1, 0.02, 2); } if (v === 2) x.fillRect(x0 + 0.1, -1, 0.03, 2);
  x.fillStyle = rgba(t3Ink(C[0]), 0.55); x.fillRect(x0, -0.008, (x1 - x0) * 0.34, 0.016);
  x.restore(); x.strokeStyle = t3Ink(C[0]); x.lineWidth = T3W; x.stroke(s.p);
  // 조종석 유리
  t3E(x, P.can[0], 0, P.can[1], P.can[2], C[3], F); t3Hi(x, P.can[0] + P.can[1] * 0.2, -P.can[2] * 0.3, P.can[1] * 0.4, P.can[2] * 0.28, 0.85, 0);
  if (P.prop) { x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.ellipse(x1 + 0.012, 0, 0.014, 0.115, 0, 0, Math.PI * 2); x.fill(); t3Dot(x, x1 + 0.006, 0, 0.02, '#e0483a'); }
}
var T3_PLC = {};
function t3PlaneSpr(v, S) {
  v = v | 0; var key = v + ':' + Math.round(S); if (T3_PLC[key]) return T3_PLC[key];
  var w0 = T3W, sk0 = TW_SK; TW_SK = null; T3W = Math.max(1.1, S * 0.024) / S;
  try { return (T3_PLC[key] = t3Bake(S, [-0.55, -0.52, 0.55, 0.52], function (x) { t3PlaneDraw(x, v); }, Math.max(0.9, S * 0.016))); } finally { T3W = w0; TW_SK = sk0; }
}

// ===================== 비행장 =====================
// 1 풀밭 활주로와 격납고 → 2 관제탑 → 3 격납고 둘. A 폭격 편대(큰 폭격기 격납고, 폭탄 더미) / B 요격 편대(레이더, 미사일 걸이)
function t3Hangar(x, cx, by, w, h, d, col, o) {
  o = o || {}; var n = 6, arch = function (ox, oy, ww, hh) { var s = shp(), p = s.p, a = cx - ww / 2 + ox, b = cx + ww / 2 + ox, y = by + oy; p.moveTo(a, y); p.lineTo(a, y - hh * 0.3); p.bezierCurveTo(a, y - hh * 1.2, b, y - hh * 1.2, b, y - hh * 0.3); p.lineTo(b, y); p.closePath(); s.ext(a, y - hh); s.ext(b, y); return s; };
  for (var i = n; i >= 1; i--) { var k = i / n, s = arch(d * 0.55 * k, -d * k, w, h); t3S(x, s, i % 2 ? col : twLt(col, 0.2), { hi: 0.3, lo: 0.3, ink: i === n ? 1 : 0 }); }
  t3S(x, arch(0, 0, w, h), o.face || twLt(col, 0.5), { hi: 0.3, lo: 0.14 });
  var ds = arch(0, 0, w * 0.72, h * 0.74); t3S(x, ds, o.door || '#3a4868', { flat: 1 });
  if (o.stripe) { x.save(); x.setLineDash([0.035, 0.035]); x.strokeStyle = o.stripe; x.lineWidth = 0.028; x.stroke(ds.p); x.restore(); }
  x.save(); x.clip(ds.p); x.fillStyle = rgba(o.lit || '#ffd27a', 0.6); x.fillRect(cx - w / 2, by - h * 0.2, w, h * 0.2); x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(cx - w * 0.3, by - h, w * 0.12, h); x.restore(); x.strokeStyle = t3Ink(col); x.lineWidth = T3W; x.stroke(ds.p);
  if (o.mark) { t3Dot(x, cx, by - h * 0.86, h * 0.09, '#ffffff'); t3Dot(x, cx, by - h * 0.86, h * 0.05, o.mark); }
}
function t3Airbase(D) {
  var L = D.L, A = D.A, V = D.V, x = D.b, col = '#4f86a8', hc = A ? '#6f8cae' : V ? '#7fb6d8' : '#5f9cc6', pk = [], lights = [], beacon = null, radar = [], sock = null;
  // 활주로(받침 윗면 안쪽으로 자름)
  var g = D.g, top = shp().ell(0, 0, L === 1 ? 0.47 : 0.5, L === 1 ? 0.25 : 0.275);
  g.save(); g.clip(top.p);
  if (L >= 2) { g.fillStyle = L >= 4 ? '#aab6c6' : '#b9c2c6'; g.fillRect(-1, -1, 2, 2); }
  var rw = shp().poly([[-0.6, 0.01], [0.6, 0.07], [0.6, 0.22], [-0.6, 0.16]]); g.fillStyle = L === 1 ? '#c9a878' : '#6c7894'; g.fill(rw.p);
  g.strokeStyle = L === 1 ? 'rgba(255,255,255,0.7)' : '#ffffff'; g.lineWidth = 0.03; g.setLineDash([0.08, 0.05]); g.beginPath(); g.moveTo(-0.6, 0.085); g.lineTo(0.6, 0.145); g.stroke(); g.setLineDash([]);
  if (L >= 2) { g.lineWidth = 0.012; g.strokeStyle = '#ffd24a'; g.beginPath(); g.moveTo(-0.6, 0.02); g.lineTo(0.6, 0.08); g.moveTo(-0.6, 0.15); g.lineTo(0.6, 0.21); g.stroke(); }
  g.restore();
  for (var i = 0; i < 5; i++) { var lx = -0.36 + i * 0.18; lights.push([lx, 0.012 + (lx + 0.6) * 0.05]); }
  // 격납고
  var hb = -0.05;
  if (A) {
    t3Hangar(x, -0.1, hb, L === 6 ? 0.6 : 0.52, L === 6 ? 0.36 : L === 5 ? 0.33 : 0.3, 0.2, hc, { stripe: '#ff9a3a', face: '#93a6bc', mark: '#ff9a3a', lit: '#ffb04a' });
    if (L === 6) { t3Hangar(x, 0.33, hb - 0.02, 0.26, 0.2, 0.14, hc, { face: '#93a6bc', stripe: '#ffd24a' }); t3E(x, -0.1, hb - 0.46, 0.04, 0.04, '#ffd24a', { hi: 0.5 }); }
    // 폭탄 더미
    var nb = L === 4 ? 2 : 3; for (var b = 0; b < nb; b++) { var bx = 0.3 + (b % 2) * 0.09 - (b > 1 ? 0.045 : 0), byy = 0.0 - (b > 1 ? 0.06 : 0) + (L === 6 ? 0.03 : 0); t3R(x, bx - 0.05, byy - 0.05, 0.1, 0.065, 0.03, '#3d455e', { hi: 0.4, lo: 0.2 }); x.fillStyle = '#ffd24a'; x.fillRect(bx - 0.012, byy - 0.048, 0.022, 0.06); }
  } else if (V) {
    // 각진 요격기 격납고
    var hw = L === 6 ? 0.46 : 0.4, hh = 0.22;
    t3Pg(x, [[-0.12 - hw / 2 + 0.1, hb - hh - 0.14], [-0.12 + hw / 2 + 0.06, hb - hh - 0.14], [-0.12 + hw / 2 + 0.12, hb - 0.12], [-0.12 + hw / 2, hb], [-0.12 + hw / 2 - 0.04, hb - hh]], twSh(hc, 0.25));
    t3Pg(x, [[-0.12 - hw / 2 + 0.04, hb - hh], [-0.12 - hw / 2 + 0.1, hb - hh - 0.14], [-0.12 + hw / 2 + 0.06, hb - hh - 0.14], [-0.12 + hw / 2 - 0.04, hb - hh]], twLt(hc, 0.4), { hi: 0.3, lo: 0.1 });
    t3Pg(x, [[-0.12 - hw / 2, hb], [-0.12 - hw / 2 + 0.04, hb - hh], [-0.12 + hw / 2 - 0.04, hb - hh], [-0.12 + hw / 2, hb]], '#eef3f8', { hi: 0.2, lo: 0.2 });
    t3Pg(x, [[-0.12 - hw * 0.36, hb], [-0.12 - hw * 0.33, hb - hh * 0.72], [-0.12 + hw * 0.33, hb - hh * 0.72], [-0.12 + hw * 0.36, hb]], '#243a5c', { flat: 1 });
    x.fillStyle = '#35c8f5'; x.fillRect(-0.12 - hw * 0.4, hb - hh * 0.93, hw * 0.8, 0.03);
    // 미사일 걸이
    var nm = L === 4 ? 2 : 3; t3R(x, 0.34 - 0.08, hb + 0.02, 0.16, 0.04, 0.01, '#5a6680', { hi: 0.2, lo: 0.3 });
    for (var m = 0; m < nm; m++) { var mx = 0.3 + m * 0.045 - (nm - 2) * 0.02; t3L(x, [[mx, hb + 0.03], [mx + 0.05, hb - 0.15]], '#f4f6fa', 0.03); t3L(x, [[mx + 0.04, hb - 0.12], [mx + 0.055, hb - 0.17]], '#e0483a', 0.026, 1.2); }
  } else {
    t3Hangar(x, L === 3 ? -0.26 : -0.15, hb, L === 1 ? 0.38 : 0.36, L === 1 ? 0.27 : 0.26, 0.16, hc, { mark: '#ffd24a' });
    if (L === 3) t3Hangar(x, 0.08, hb - 0.03, 0.3, 0.22, 0.14, hc, { mark: '#ffd24a' });
  }
  // 관제탑
  if (L >= 2) {
    var tx = A ? (L === 6 ? -0.42 : 0.34) : V ? 0.14 : L === 3 ? 0.38 : 0.26, ty = A && L < 6 ? -0.1 : V ? -0.16 : -0.06, th = A ? 0.34 : V ? [0, 0, 0, 0, 0.46, 0.54, 0.66][L] : L === 2 ? 0.3 : 0.4;
    if (A && L === 6) ty = -0.02;
    t3Box(x, tx, ty, 0.085, th, 0.03, '#f1ece2'); x.fillStyle = hc; x.fillRect(tx - 0.042, ty - th * 0.5, 0.085, 0.035); x.fillRect(tx - 0.042, ty - th * 0.22, 0.085, 0.035);
    var cy = ty - th; t3Pg(x, [[tx - 0.065, cy], [tx - 0.095, cy - 0.095], [tx + 0.105, cy - 0.095], [tx + 0.075, cy]], '#dfe8f0', { hi: 0.3, lo: 0.2 });
    x.fillStyle = V ? '#35c8f5' : '#58c6ea'; x.beginPath(); x.moveTo(tx - 0.058, cy - 0.022); x.lineTo(tx - 0.078, cy - 0.078); x.lineTo(tx + 0.088, cy - 0.078); x.lineTo(tx + 0.068, cy - 0.022); x.fill(); x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(tx - 0.05, cy - 0.07, 0.035, 0.04);
    t3Pg(x, [[tx - 0.11, cy - 0.095], [tx - 0.08, cy - 0.13], [tx + 0.1, cy - 0.13], [tx + 0.12, cy - 0.095]], A ? '#ff9a3a' : V ? '#2f6fb0' : hc, { hi: 0.3, lo: 0.2 });
    t3L(x, [[tx + 0.01, cy - 0.13], [tx + 0.01, cy - 0.22]], '#e8e2f0', 0.018);
    beacon = [tx + 0.01, cy - 0.235];
  }
  // 레이더(B): 기둥만 그리고 접시는 parts에서 돌림
  if (V) { var rx = -0.4, ry = -0.02, rh = L === 4 ? 0.3 : 0.36; t3L(x, [[rx, ry], [rx, ry - rh]], '#cfd8e4', 0.04); t3Box(x, rx, ry, 0.11, 0.06, 0.03, '#8fa0b8'); radar.push([rx, ry - rh - 0.06, L === 6 ? 0.15 : 0.12]); if (L === 6) { t3L(x, [[0.42, -0.06], [0.42, -0.34]], '#cfd8e4', 0.034); radar.push([0.42, -0.38, 0.09]); } }
  // 풍향계 기둥
  var sx = L >= 4 ? 0.44 : -0.42, sy = L >= 4 ? 0.1 : 0.08; if (!(V && L === 6)) { t3L(D.f, [[sx, sy], [sx, sy - 0.26]], '#f1ece2', 0.012, 1.2); sock = [sx, sy - 0.25]; }
  // 주기된 비행기
  var pv = A ? 1 : V ? 2 : 0, psc = A ? 0.66 : 0.62;
  D.part('pk', [-0.4, -0.3, 0.4, 0.3], function (px) { var w0 = T3W; T3W = T3W * 0.6 / psc; px.rotate(0.05); px.scale(psc, psc * 0.68); px.rotate(-0.1); t3PlaneDraw(px, pv); T3W = w0; });
  pk = A ? (L === 4 ? [[-0.25, 0.09]] : L === 5 ? [[-0.27, 0.08], [0.27, 0.13]] : [[-0.28, 0.08], [0.28, 0.13], [0.02, 0.0]]) : V ? (L === 6 ? [[-0.27, 0.09], [0.27, 0.13], [0.0, 0.03]] : [[-0.26, 0.09], [0.26, 0.13]]) : L === 3 ? [[-0.26, 0.09], [0.26, 0.13]] : L === 2 ? [[-0.24, 0.1]] : [[0.2, 0.11]];
  return { pk: pk, lights: lights, beacon: beacon, radar: radar, sock: sock, V: V, A: A, mounts: [[0, -0.3]] };
}
function t3AirbaseParts(x, t, X, Y, S, time, info) {
  var p = info.p, u = info.u, id = t.id || 0, tm = t3Still(t) ? 0.3 : time, oy = -info.ph * u, i, out = t.out ? 1 : 0;
  x.save(); x.translate(X, Y + oy);
  // 활주로 등: 차례로 켜짐(비행기가 나가 있으면 빨리)
  var n = info.lights.length, on = Math.floor(tm * (out ? 9 : 4) + id) % (n + 2);
  x.fillStyle = '#ffd24a'; x.beginPath(); for (i = 0; i < n; i++) { var l = info.lights[i]; x.moveTo(l[0] * u + u * 0.014, l[1] * u); x.arc(l[0] * u, l[1] * u, u * 0.014, 0, Math.PI * 2); } x.fill();
  if (on < n) t3Glow(x, info.lights[on][0] * u, info.lights[on][1] * u, u * 0.08, '#fff3a0', 1);
  // 주기장: 나가 있으면 빔. 나갈 때는 활주로를 달려 떠오르고, 돌아올 때는 미끄러져 들어옴
  var m = t3Mem(t); if (m.out == null) m.out = out; if (out !== m.out) { m.out = out; m.ot = time; }
  var od = m.ot == null ? 9 : time - m.ot, ok = clamp(od / 0.55, 0, 1);
  if (!out || ok < 1) for (i = 0; i < info.pk.length; i++) {
    var q = info.pk[i], k = out ? ok : 1 - ok, kk = clamp(k * 1.25 - i * 0.12, 0, 1), k2 = kk * kk;
    if (kk >= 1) continue; x.globalAlpha = kk > 0.7 ? (1 - kk) / 0.3 : 1;
    t3Img(x, p.pk, (q[0] + (out ? k2 * 0.85 : -k2 * 0.8)) * u, (q[1] + (out ? k2 * 0.05 - Math.max(0, kk - 0.5) * 0.5 : -k2 * 0.12 - Math.max(0, kk - 0.4) * 0.3)) * u); x.globalAlpha = 1;
  }
  // 관제탑 등: 초록과 흰빛이 번갈아
  if (info.beacon) { var s = Math.sin(tm * 3.2 + id), b = info.beacon; x.fillStyle = s > 0 ? '#7dffa0' : '#ffffff'; x.strokeStyle = T3_OL; x.lineWidth = Math.max(1, u * 0.014); x.beginPath(); x.arc(b[0] * u, b[1] * u, u * 0.024, 0, Math.PI * 2); x.fill(); x.stroke(); t3Glow(x, b[0] * u, b[1] * u, u * (0.07 + 0.09 * Math.abs(s)), s > 0 ? '#7dffa0' : '#ffffff', 0.35 + 0.65 * Math.abs(s)); }
  // 레이더 접시: 돌아감
  for (i = 0; i < info.radar.length; i++) {
    var r = info.radar[i], c = Math.cos(tm * 2.2 + id + i * 1.7), rw = Math.max(0.12, Math.abs(c)) * r[2] * u, rx = r[0] * u, ry = r[1] * u;
    x.beginPath(); x.ellipse(rx, ry, rw, r[2] * 0.72 * u, 0, 0, Math.PI * 2); x.fillStyle = c > 0 ? '#f4f8fc' : '#9fb0c6'; x.fill(); x.strokeStyle = T3_OL; x.lineWidth = Math.max(1.1, u * 0.024); x.stroke();
    if (c > 0) { x.beginPath(); x.ellipse(rx, ry, rw * 0.55, r[2] * 0.4 * u, 0, 0, Math.PI * 2); x.strokeStyle = '#35c8f5'; x.lineWidth = Math.max(1, u * 0.016); x.stroke(); x.fillStyle = '#e0483a'; x.beginPath(); x.arc(rx, ry, u * 0.018, 0, Math.PI * 2); x.fill(); }
  }
  x.restore();
}
// 풍향계는 앞 그림(front) 위에 그려야 해서 받침 높이만 빼고 따로
function t3Sock(x, px, py, u, time) {
  var n = 3, sw = Math.sin(time * 2.1) * 0.12, lw = Math.max(1, u * 0.014);
  for (var i = 0; i < n; i++) { var a0 = i / n, a1 = (i + 1) / n, x0 = px + a0 * u * 0.2, x1 = px + a1 * u * 0.2, y0 = py + (Math.sin(time * 4.4 - a0 * 3) * 0.02 + sw * a0) * u, y1 = py + (Math.sin(time * 4.4 - a1 * 3) * 0.02 + sw * a1) * u, h0 = u * (0.05 - a0 * 0.025), h1 = u * (0.05 - a1 * 0.025);
    x.beginPath(); x.moveTo(x0, y0 - h0); x.lineTo(x1, y1 - h1); x.lineTo(x1, y1 + h1); x.lineTo(x0, y0 + h0); x.closePath(); x.fillStyle = i % 2 ? '#ffffff' : '#ff8a2a'; x.fill(); x.strokeStyle = T3_OL; x.lineWidth = lw; x.stroke(); }
}
t3Reg('airbase', t3Airbase, function (x, t, X, Y, S, time, info) { t3AirbaseParts(x, t, X, Y, S, time, info); if (info.sock) t3Sock(x, X + info.sock[0] * info.u, Y + (info.sock[1] - info.ph) * info.u, info.u, (t3Still(t) ? 0.3 : time) + (t.id || 0)); });

// ===================== 아군 병사(오른쪽을 봄, 키 0.5칸 안팎의 3등신) =====================
// t3SoldierFrames(v, S) → { fr: [걷기와 대기 4장], atk: [공격 2장] } 각 { c, ax, ay }(발밑 기준). v 0 창병, 1 방패병(철벽 방패대), 2 화랑 무사
function t3SoldierDraw(x, v, fr, atk) {
  var C = [{ tunic: '#8a6fb0', trim: '#ffd24a', helm: '#b4bcd0' }, { tunic: '#5a7fb8', trim: '#ffd24a', helm: '#d2dae8' }, { tunic: '#f6f3ea', trim: '#e8608f', helm: '#2a2238' }][v] || {}, skin = '#ffe2cf';
  var sw = atk ? (atk === 2 ? 0.04 : -0.02) : [0.04, 0, -0.04, 0][fr], bob = atk ? 0 : (fr % 2 ? -0.014 : 0), lean = atk === 2 ? 0.035 : atk === 1 ? -0.02 : 0, by = -0.125 + bob;
  // 다리와 신발
  [[-0.032, -sw], [0.032, sw]].forEach(function (l, i) { t3L(x, [[l[0] + lean * 0.4, by + 0.0], [l[0] + l[1], -0.02]], i ? '#5a4a70' : '#4a3c60', 0.04, 1.3); t3E(x, l[0] + l[1] + 0.012, -0.014, 0.034, 0.02, '#3a2a48', { flat: 1, ink: 0.6 }); });
  var hx = 0.012 + lean * 1.6, hy = by - 0.235, hr = 0.09, sx = 0.02 + lean, shy = by - 0.115, hand, s;
  // 뒤에 드는 것
  if (v === 2 && !atk) t3L(x, [[-0.05 + lean, by - 0.05], [-0.16, by - 0.0]], C.trim, 0.03, 1.2); // 휘날리는 띠
  if (v === 1) { var sx0 = -0.05 + lean; if (atk === 2) { t3L(x, [[sx0 + 0.07, by - 0.14], [0.3, by - 0.3]], '#e9eef6', 0.028); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 0.022; x.beginPath(); x.arc(0.06, by - 0.12, 0.28, -1.3, -0.35); x.stroke(); } else t3L(x, [[sx0, by - 0.08], [sx0 - 0.03, by - 0.3]], '#e9eef6', 0.026); }
  // 몸통
  if (v === 2) { s = t3Pg(x, [[-0.06 + lean, by - 0.15], [0.07 + lean, by - 0.15], [0.1 + lean * 0.5, by + 0.05], [-0.09 + lean * 0.5, by + 0.05]], C.tunic, { hi: 0.2, lo: 0.2 }); x.fillStyle = '#5a7fd0'; x.fillRect(-0.09, by + 0.02, 0.2, 0.03); x.strokeStyle = t3Ink(C.tunic); x.lineWidth = T3W; x.stroke(s.p); }
  else t3R(x, -0.072 + lean, by - 0.155, 0.145, 0.17, 0.05, C.tunic, { hi: 0.3, lo: 0.25 });
  x.fillStyle = C.trim; x.fillRect(-0.066 + lean, by - 0.05, 0.132, 0.024);
  // 머리
  t3E(x, hx, hy, hr, hr * 0.95, skin, { hi: 0.25, lo: 0.12, inkc: '#b87a60' });
  t3Dot(x, hx + 0.042, hy + 0.016, 0.017, '#2a1830'); t3Dot(x, hx + 0.037, hy + 0.01, 0.006, '#ffffff'); x.fillStyle = 'rgba(255,120,150,0.55)'; x.beginPath(); x.ellipse(hx + 0.02, hy + 0.045, 0.02, 0.012, 0, 0, Math.PI * 2); x.fill();
  if (v === 2) { // 상투, 머리띠, 깃
    s = shp(); s.p.ellipse(hx - 0.012, hy - 0.02, hr * 1.04, hr * 0.92, 0, Math.PI * 0.86, Math.PI * 1.92); s.p.closePath(); s.ext(hx - hr * 1.1, hy - hr); s.ext(hx + hr, hy); t3S(x, s, C.helm, { flat: 1 });
    t3E(x, hx - 0.02, hy - hr * 1.02, 0.034, 0.03, C.helm, { flat: 1 }); t3L(x, [[hx - hr * 0.95, hy - 0.035], [hx + hr * 0.9, hy - 0.055]], C.trim, 0.022, 1.1);
    t3Pg(x, [[hx - 0.03, hy - hr * 0.95], [hx - 0.15, hy - hr * 2.1], [hx - 0.09, hy - hr * 1.1]], '#ffffff', { flat: 1, ink: 0.6 });
  } else {
    s = shp(); s.p.ellipse(hx - 0.004, hy - 0.034, hr * 1.1, hr * 0.84, 0, Math.PI, Math.PI * 2); s.p.closePath(); s.ext(hx - hr * 1.1, hy - hr * 1.05); s.ext(hx + hr * 1.1, hy); t3S(x, s, C.helm, { hi: 0.5, lo: 0.25 });
    t3L(x, [[hx - hr * 1.12, hy - 0.034], [hx + hr * 1.2, hy - 0.03]], twSh(C.helm, 0.2), 0.02, 1.2);
    if (v === 1) t3Pg(x, [[hx - 0.01, hy - hr * 1.0], [hx - 0.09, hy - hr * 1.75], [hx - 0.1, hy - hr * 0.9]], '#e8608f', { hi: 0.3, lo: 0.2, ink: 0.8 }); else t3E(x, hx, hy - hr * 1.08, 0.022, 0.026, '#e0483a', { flat: 1, ink: 0.7 });
  }
  // 무기와 앞 팔
  if (v === 0) {
    var sp = atk === 1 ? [[-0.24, by - 0.115], [0.22, by - 0.125]] : atk === 2 ? [[-0.08, by - 0.1], [0.42, by - 0.11]] : [[-0.03, by + 0.07], [0.17, by - 0.44]], dx = sp[1][0] - sp[0][0], dy = sp[1][1] - sp[0][1], dl = Math.hypot(dx, dy), ux = dx / dl, uy = dy / dl;
    t3L(x, sp, '#c98a4a', 0.024); t3Pg(x, [[sp[1][0] - uy * 0.028, sp[1][1] + ux * 0.028], [sp[1][0] + ux * 0.085, sp[1][1] + uy * 0.085], [sp[1][0] + uy * 0.028, sp[1][1] - ux * 0.028]], '#eef1f7', { flat: 1, ink: 0.8 });
    hand = atk ? [sp[0][0] + dx * 0.45, sp[0][1] + dy * 0.45] : [0.075, by - 0.1];
    t3L(x, [[sx, shy], hand], C.tunic, 0.04, 1.2); t3E(x, hand[0], hand[1], 0.022, 0.022, skin, { flat: 1, inkc: '#b87a60', ink: 0.6 });
  } else if (v === 1) {
    var shx = 0.085 + lean + (atk === 1 ? 0.06 : 0);
    s = t3R(x, shx - 0.06, by - 0.2, 0.125, 0.225, 0.03, '#6f8fc8', { hi: 0.35, lo: 0.25 }); x.save(); x.clip(s.p); x.fillStyle = C.trim; x.fillRect(shx - 0.012, -1, 0.026, 2); x.fillRect(-1, by - 0.1, 2, 0.024); x.restore(); x.strokeStyle = t3Ink('#6f8fc8'); x.lineWidth = T3W; x.stroke(s.p);
    t3E(x, shx + 0.002, by - 0.088, 0.026, 0.026, '#fff0a0', { flat: 1, ink: 0.7 });
  } else {
    var sd = atk === 1 ? [[0.03, by - 0.16], [-0.1, by - 0.48]] : atk === 2 ? [[0.1, by - 0.08], [0.38, by - 0.02]] : [[0.08, by - 0.07], [0.27, by - 0.17]];
    if (atk === 2) { x.strokeStyle = 'rgba(255,236,246,0.95)'; x.lineWidth = 0.035; x.lineCap = 'round'; x.beginPath(); x.arc(0.06, by - 0.12, 0.31, -1.75, 0.25); x.stroke(); x.strokeStyle = rgba(C.trim, 0.8); x.lineWidth = 0.014; x.beginPath(); x.arc(0.06, by - 0.12, 0.345, -1.5, 0.15); x.stroke(); }
    t3L(x, sd, '#eef1f7', 0.024); t3L(x, [[sx, shy], sd[0]], C.tunic, 0.04, 1.2); t3E(x, sd[0][0], sd[0][1], 0.024, 0.024, '#ffd24a', { flat: 1, ink: 0.7 });
  }
}
var T3_SOC = {};
function t3SoldierFrames(v, S) {
  v = v | 0; var key = v + ':' + Math.round(S); if (T3_SOC[key]) return T3_SOC[key];
  var w0 = T3W, sk0 = TW_SK, out = { fr: [], atk: [] }, bb = [-0.4, -0.75, 0.55, 0.06], olr = Math.max(0.9, S * 0.016); TW_SK = null; T3W = Math.max(1.05, S * 0.022) / S;
  try {
    for (var i = 0; i < 4; i++) (function (i) { out.fr.push(t3Bake(S, bb, function (x) { t3SoldierDraw(x, v, i, 0); }, olr)); })(i);
    for (var j = 1; j <= 2; j++) (function (j) { out.atk.push(t3Bake(S, bb, function (x) { t3SoldierDraw(x, v, 0, j); }, olr)); })(j);
  } finally { T3W = w0; TW_SK = sk0; }
  return (T3_SOC[key] = out);
}


// ===================== 수호 병영 =====================
// 1 목책과 천막 → 2 망루 → 3 통나무 막사. A 철벽 방패대(방패가 걸린 석조 병영) / B 화랑 무사단(기와 지붕 수련장)
function t3Stakes(x, a0, a1, n, rx, ry, h, col, w) {
  for (var k = 0; k < n; k++) {
    var a = lerp(a0, a1, n === 1 ? 0.5 : k / (n - 1)), px = Math.cos(a) * rx, py = Math.sin(a) * ry, hw = (w || 0.034), s = shp();
    s.p.moveTo(px - hw, py); s.p.lineTo(px - hw, py - h + hw * 1.3); s.p.lineTo(px, py - h); s.p.lineTo(px + hw, py - h + hw * 1.3); s.p.lineTo(px + hw, py); s.p.closePath(); s.ext(px - hw, py - h); s.ext(px + hw, py);
    t3S(x, s, k % 2 ? col : twSh(col, 0.1), { hi: 0.32, lo: 0.3, ink: 0.85 });
  }
}
function t3Shield(x, cx, cy, r, col, o) {
  var s = shp(), p = s.p; p.moveTo(cx - r, cy - r); p.lineTo(cx + r, cy - r); p.lineTo(cx + r, cy + r * 0.2); p.quadraticCurveTo(cx + r * 0.9, cy + r * 1.0, cx, cy + r * 1.35); p.quadraticCurveTo(cx - r * 0.9, cy + r * 1.0, cx - r, cy + r * 0.2); p.closePath(); s.ext(cx - r, cy - r); s.ext(cx + r, cy + r * 1.35);
  t3S(x, s, col, { hi: 0.4, lo: 0.25 }); x.save(); x.clip(s.p); x.fillStyle = (o && o.band) || '#ffd24a'; x.fillRect(cx - r * 0.16, cy - r * 2, r * 0.32, r * 4); x.fillRect(cx - r * 2, cy - r * 0.3, r * 4, r * 0.3); x.restore();
  x.strokeStyle = t3Ink((o && o.rim) || col); x.lineWidth = T3W * ((o && o.rim) ? 1.5 : 1); x.stroke(s.p); if (o && o.rim) { x.strokeStyle = o.rim; x.lineWidth = T3W * 0.7; x.stroke(s.p); }
  t3E(x, cx, cy - r * 0.14, r * 0.26, r * 0.26, '#fff0a0', { flat: 1, ink: 0.7 });
}
function t3Barracks(D) {
  var L = D.L, A = D.A, V = D.V, x = D.b, f = D.f, col = '#8a6fb0', wood = '#c98a4a', woodD = '#a56a38', stone = '#c2c4d6', flags = [], bug = null, fires = [], door = null;
  var wt = function (tx, ty, th, roof, stoneLeg) { // 망루
    if (stoneLeg) t3Cyl(x, tx, ty - th, 0.085, 0.04, th, stone, { top: twLt(stone, 0.2) });
    else { [-1, 1].forEach(function (sd) { t3L(x, [[tx + sd * 0.085, ty], [tx + sd * 0.06, ty - th]], woodD, 0.032); }); t3L(x, [[tx - 0.08, ty - th * 0.2], [tx + 0.066, ty - th * 0.75]], woodD, 0.02, 1.2); t3L(x, [[tx + 0.08, ty - th * 0.2], [tx - 0.066, ty - th * 0.75]], woodD, 0.02, 1.2); }
    t3Box(x, tx, ty - th + 0.01, 0.22, 0.075, 0.05, stoneLeg ? stone : wood, { sk: 0.02 });
    bug = [tx - 0.02, ty - th - 0.065];
    if (roof) { [-1, 1].forEach(function (sd) { t3L(f, [[tx + sd * 0.09, ty - th - 0.06], [tx + sd * 0.09, ty - th - 0.26]], woodD, 0.022, 1.2); }); t3Pg(f, [[tx - 0.16, ty - th - 0.24], [tx + 0.01, ty - th - 0.42], [tx + 0.17, ty - th - 0.24]], roof, { hi: 0.35, lo: 0.3 }); t3E(f, tx + 0.01, ty - th - 0.43, 0.026, 0.026, '#ffd24a', { hi: 0.5, ink: 0.7 }); flags.push([tx + 0.01, ty - th - 0.62, 0.15, 0.09, roof, '#ffd24a', 1]); t3L(f, [[tx + 0.01, ty - th - 0.44], [tx + 0.01, ty - th - 0.62]], woodD, 0.018, 1.2); }
    else { t3L(x, [[tx + 0.09, ty - th - 0.05], [tx + 0.09, ty - th - 0.36]], woodD, 0.02, 1.2); flags.push([tx + 0.09, ty - th - 0.36, 0.15, 0.09, col, '#ffd24a', 1]); }
  };
  var rack = function (rx, ry, sword) { t3L(f, [[rx - 0.09, ry], [rx - 0.09, ry - 0.11]], woodD, 0.022, 1.2); t3L(f, [[rx + 0.09, ry], [rx + 0.09, ry - 0.11]], woodD, 0.022, 1.2); t3L(f, [[rx - 0.11, ry - 0.1], [rx + 0.11, ry - 0.1]], woodD, 0.024, 1.2);
    for (var i = 0; i < 3; i++) { var px = rx - 0.06 + i * 0.06; t3L(f, [[px - 0.01, ry + 0.01], [px + 0.02, ry - (sword ? 0.2 : 0.27)]], sword ? '#eef1f7' : '#d9a05c', 0.016, 1.1); if (!sword) t3Pg(f, [[px + 0.005, ry - 0.26], [px + 0.025, ry - 0.33], [px + 0.036, ry - 0.255]], '#eef1f7', { flat: 1, ink: 0.6 }); else t3L(f, [[px - 0.018, ry - 0.04], [px + 0.02, ry - 0.05]], '#ffd24a', 0.016, 1); } };
  if (!A && !V) {
    t3Stakes(x, Math.PI * 1.04, Math.PI * 1.96, 9, 0.46, 0.24, L === 1 ? 0.15 : 0.17, wood, 0.04);
    if (L <= 2) { // 천막
      var tx = L === 1 ? -0.03 : -0.15, tw2 = L === 1 ? 0.27 : 0.25, th3 = L === 1 ? 0.46 : 0.44, s = t3Pg(x, [[tx - tw2, 0.0], [tx, -th3], [tx + tw2, 0.0]], col, { hi: 0.4, lo: 0.3 }); x.save(); x.clip(s.p); x.fillStyle = '#ffd24a'; x.fillRect(tx - 0.3, -0.075, 0.6, 0.035); x.fillStyle = 'rgba(255,255,255,0.28)'; x.beginPath(); x.moveTo(tx, -th3); x.lineTo(tx - tw2, 0.0); x.lineTo(tx - tw2 * 0.5, 0.0); x.fill(); x.restore(); x.strokeStyle = t3Ink(col); x.lineWidth = T3W; x.stroke(s.p);
      t3Pg(x, [[tx - 0.075, 0.0], [tx, -0.24], [tx + 0.075, 0.0]], '#3a2a4a', { flat: 1 }); door = [tx, -0.09]; t3E(x, tx, -th3 - 0.01, 0.03, 0.03, '#ffd24a', { hi: 0.5, ink: 0.7 });
      if (L === 1) { t3L(x, [[tx + 0.3, 0.02], [tx + 0.3, -0.5]], woodD, 0.024, 1.2); flags.push([tx + 0.3, -0.5, 0.2, 0.12, col, '#ffd24a', -1]); }
    } else { // 통나무 막사
      t3Box(x, -0.17, -0.02, 0.36, 0.17, 0.0, wood); for (var i = 1; i < 4; i++) { x.strokeStyle = rgba(t3Ink(wood), 0.5); x.lineWidth = T3W * 0.7; x.beginPath(); x.moveTo(-0.35, -0.02 - i * 0.043); x.lineTo(0.01, -0.02 - i * 0.043); x.stroke(); }
      t3R(x, -0.215, -0.13, 0.09, 0.11, 0.03, '#3a2a4a', { flat: 1 }); door = [-0.17, -0.07];
      t3Pg(x, [[-0.41, -0.17], [-0.31, -0.41], [-0.02, -0.41], [0.07, -0.17]], col, { hi: 0.4, lo: 0.3 }); x.fillStyle = '#ffd24a'; x.fillRect(-0.37, -0.205, 0.41, 0.028);
    }
    if (L >= 2) wt(L === 2 ? 0.24 : 0.27, -0.04, L === 2 ? 0.4 : 0.5, L === 3 ? col : null);
    rack(-0.3, L === 1 ? 0.09 : 0.1);
    t3Stakes(f, Math.PI * 0.08, Math.PI * 0.3, 3, 0.47, 0.25, 0.15, wood, 0.04);
  } else if (A) {
    // 석조 병영: 성가퀴 돌벽, 아치문, 걸린 방패
    var w = L === 6 ? 0.66 : 0.58, h = L === 4 ? 0.3 : 0.34, by = 0.0, bx = -0.03;
    t3Stakes(x, Math.PI * 1.08, Math.PI * 1.92, 7, 0.47, 0.25, 0.13, stone, 0.05);
    if (L >= 5) [-1, 1].forEach(function (sd) { var tx2 = bx + sd * (w / 2 + 0.01), th2 = L === 6 ? 0.56 : 0.46; t3Cyl(x, tx2, by - th2 - 0.03, 0.085, 0.04, th2, twSh(stone, 0.06), { top: twLt(stone, 0.2), bands: [[0.12, 0.05, col]] }); t3Stakes(x, 0.2, Math.PI - 0.2, 3, 0.075, 0.03, 0.0, stone); for (var q = -1; q <= 1; q++) t3R(x, tx2 + q * 0.058 - 0.022, by - th2 - 0.085, 0.044, 0.06, 0.008, stone, { hi: 0.3, lo: 0.2, ink: 0.8 }); if (L === 6) { flags.push([tx2, by - th2 - 0.3, 0.14, 0.085, col, '#ffd24a', 1]); t3L(x, [[tx2, by - th2 - 0.06], [tx2, by - th2 - 0.3]], woodD, 0.018, 1.2); } else fires.push([tx2, by - th2 - 0.1]); });
    var wall = t3Box(x, bx, by, w, h, 0.07, stone, { sk: 0.02 });
    x.save(); x.clip(wall.p); x.strokeStyle = rgba(t3Ink(stone), 0.35); x.lineWidth = T3W * 0.6; for (var r = 1; r < 5; r++) { x.beginPath(); x.moveTo(bx - w / 2, by - h * r / 5); x.lineTo(bx + w / 2, by - h * r / 5); x.stroke(); for (var c = 0; c < 7; c++) { var vx = bx - w / 2 + (c + (r % 2) * 0.5) * w / 6.5; x.beginPath(); x.moveTo(vx, by - h * r / 5); x.lineTo(vx, by - h * (r - 1) / 5); x.stroke(); } }
    x.fillStyle = col; x.fillRect(bx - w / 2, by - h + 0.0, w, 0.04); x.restore(); x.strokeStyle = t3Ink(stone); x.lineWidth = T3W; x.stroke(wall.p);
    for (var m = 0; m < 6; m++) t3R(x, bx - w / 2 + 0.01 + m * (w - 0.07) / 5, by - h - 0.115, 0.055, 0.075, 0.01, stone, { hi: 0.3, lo: 0.2, ink: 0.85 });
    var dw = 0.14, dsh = shp(), dp = dsh.p; dp.moveTo(bx - dw / 2, by); dp.lineTo(bx - dw / 2, by - 0.12); dp.quadraticCurveTo(bx - dw / 2, by - 0.21, bx, by - 0.21); dp.quadraticCurveTo(bx + dw / 2, by - 0.21, bx + dw / 2, by - 0.12); dp.lineTo(bx + dw / 2, by); dp.closePath(); dsh.ext(bx - dw / 2, by - 0.21); dsh.ext(bx + dw / 2, by); t3S(x, dsh, '#3a2a4a', { flat: 1, inkc: woodD }); door = [bx, by - 0.08];
    var ns = L === 4 ? 2 : L === 5 ? 2 : 2, sr = L === 6 ? 0.06 : 0.055; [-1, 1].forEach(function (sd) { t3Shield(x, bx + sd * (w * 0.31), by - h * 0.52, sr, sd < 0 ? '#5a7fb8' : col, {}); });
    if (L === 6) { t3Box(x, bx, by - h - 0.07, 0.3, 0.2, 0.05, twLt(stone, 0.1), { sk: 0.02 }); for (var m2 = 0; m2 < 4; m2++) t3R(x, bx - 0.15 + 0.005 + m2 * 0.082, by - h - 0.27 - 0.065, 0.05, 0.07, 0.01, stone, { hi: 0.3, lo: 0.2, ink: 0.85 }); t3Shield(x, bx, by - h - 0.19, 0.075, '#5a7fb8', { rim: '#ffd24a' }); bug = [bx + 0.22, by - h - 0.13]; flags.push([bx + 0.0, by - h - 0.62, 0.17, 0.1, '#5a7fb8', '#ffd24a', 1]); t3L(x, [[bx, by - h - 0.33], [bx, by - h - 0.62]], woodD, 0.02, 1.2); }
    else { wt(L === 4 ? 0.3 : 0.0, by - h - (L === 4 ? -0.2 : 0.07), L === 4 ? 0.36 : 0.16, L === 5 ? col : null, L === 4); }
    rack(-0.3, 0.12);
  } else {
    // 기와 지붕 수련장
    var hw = L === 6 ? 0.6 : L === 5 ? 0.56 : 0.5, hh = 0.2, hy = -0.01, hx = -0.04, giwa = '#4f5a7a';
    t3Stakes(x, Math.PI * 1.08, Math.PI * 1.92, 9, 0.47, 0.25, 0.16, wood);
    // 나무 마루, 흰 벽, 붉은 기둥
    t3Box(x, hx, hy, hw + 0.06, 0.045, 0.03, wood, { sk: 0.0 });
    t3R(x, hx - hw / 2, hy - 0.045 - hh, hw, hh, 0, '#f6efe0', { hi: 0.2, lo: 0.18 });
    x.fillStyle = '#4a2a3a'; x.fillRect(hx - hw * 0.2, hy - 0.045 - hh * 0.82, hw * 0.4, hh * 0.82); door = [hx, hy - 0.12]; bug = [hx + hw * 0.34, hy - 0.115];
    for (var pc = 0; pc < 4; pc++) t3L(x, [[hx - hw / 2 + 0.015 + pc * (hw - 0.03) / 3, hy - 0.045], [hx - hw / 2 + 0.015 + pc * (hw - 0.03) / 3, hy - 0.045 - hh]], '#c8423a', 0.032);
    x.fillStyle = col; x.fillRect(hx - hw / 2, hy - 0.045 - hh, hw, 0.03);
    t3Giwa(x, hx, hy - 0.045 - hh, hw + 0.26, L === 4 ? 0.18 : 0.2, giwa, { eave: L === 6 ? '#ffd24a' : '#8f9ab8', tip: L >= 5 ? '#ffd24a' : null });
    if (L === 6) { var uy = hy - 0.045 - hh - 0.2; t3R(x, hx - hw * 0.26, uy - 0.1, hw * 0.52, 0.11, 0, '#f6efe0', { hi: 0.2, lo: 0.18 }); x.fillStyle = '#c8423a'; x.fillRect(hx - hw * 0.26, uy - 0.1, hw * 0.52, 0.03); t3Giwa(x, hx, uy - 0.1, hw * 0.52 + 0.24, 0.18, giwa, { eave: '#ffd24a', tip: '#ffd24a', n: 5 }); t3E(x, hx, uy - 0.3, 0.034, 0.045, '#ffd24a', { hi: 0.5 }); }
    // 깃발 장대
    var fp = L === 4 ? [[0.38, -0.02]] : [[0.39, -0.02], [-0.43, -0.03]]; fp.forEach(function (q, i) { var fh = L === 6 ? 0.72 : 0.56; t3L(x, [[q[0], q[1]], [q[0], q[1] - fh]], woodD, 0.022, 1.2); t3E(x, q[0], q[1] - fh - 0.01, 0.024, 0.024, '#ffd24a', { hi: 0.5, ink: 0.7 }); flags.push([q[0], q[1] - fh + 0.02, 0.13, L === 6 ? 0.3 : 0.24, i ? '#f6f3ea' : '#e8608f', i ? '#e8608f' : '#ffffff', q[0] > 0 ? 1 : -1, 1]); });
    // 수련 허수아비와 칼걸이
    t3L(f, [[0.26, 0.13], [0.26, -0.05]], woodD, 0.03); t3L(f, [[0.19, 0.0], [0.33, 0.0]], woodD, 0.026); t3E(f, 0.26, -0.07, 0.04, 0.04, '#e9cf9a', { hi: 0.3, lo: 0.2 }); x.fillStyle = '#c8423a'; f.fillStyle = '#c8423a'; f.fillRect(0.235, 0.03, 0.05, 0.04);
    rack(-0.29, 0.12, 1);
    if (L >= 5) { // 매화나무
      var bx2 = L === 6 ? -0.45 : 0.44, by2 = 0.04; if (L === 5) { bx2 = -0.45; } t3L(x, [[bx2, by2], [bx2 + 0.02, by2 - 0.2], [bx2 - 0.03, by2 - 0.34]], '#6a4638', 0.035); [[0, -0.36, 0.09], [-0.07, -0.3, 0.07], [0.07, -0.29, 0.07], [0.01, -0.44, 0.065]].forEach(function (b) { t3E(x, bx2 + b[0], by2 + b[1], b[2], b[2] * 0.85, '#ffb0cc', { hi: 0.4, lo: 0.2, ink: 0.8 }); });
      [[-0.03, -0.38], [0.05, -0.33], [0.0, -0.46], [-0.08, -0.29]].forEach(function (b) { t3Dot(x, bx2 + b[0], by2 + b[1], 0.014, '#ffffff'); });
      if (L === 5) flags.length = 1;
    }
  }
  return { flags: flags, bug: bug, fires: fires, door: door, A: A, V: V, mounts: [[0, -0.5]] };
}
function t3BarracksParts(x, t, X, Y, S, time, info) {
  var u = info.u, id = t.id || 0, tm = t3Still(t) ? 0.3 : time, f = t3FireK(t), i, oy = -info.ph * u;
  x.save(); x.translate(X, Y + oy);
  // 문 안 불빛
  if (info.door) t3Glow(x, info.door[0] * u, info.door[1] * u, u * 0.12, '#ffc060', 0.45 + 0.15 * Math.sin(tm * 2.6 + id) + f * 0.4);
  for (i = 0; i < info.fires.length; i++) { var fr = info.fires[i]; t3Glow(x, fr[0] * u, fr[1] * u, u * (0.11 + 0.03 * Math.sin(tm * 9 + i * 2)), '#ffb04a', 1); }
  // 나팔수: 주기적으로(또는 병사가 싸울 때) 나팔을 치켜들고 붊
  if (info.bug) {
    var b = info.bug, cyc = (tm * 0.22 + id * 0.37) % 1, blow = f > 0 || cyc < 0.16, bx = b[0] * u, by = b[1] * u, hr = u * 0.045, lw = Math.max(1, u * 0.016), ang = blow ? -0.5 + Math.sin(tm * 20) * 0.03 : 0.35;
    x.lineWidth = lw; x.strokeStyle = T3_OL; x.fillStyle = info.A ? '#5a7fb8' : info.V ? '#f6f3ea' : '#8a6fb0'; x.beginPath(); x.rect(bx - hr * 0.8, by, hr * 1.6, hr * 1.5); x.fill(); x.stroke();
    x.fillStyle = '#ffe2cf'; x.beginPath(); x.arc(bx, by - hr * 0.5, hr, 0, Math.PI * 2); x.fill(); x.stroke();
    x.fillStyle = info.V ? '#2a2238' : '#b4bcd0'; x.beginPath(); x.arc(bx, by - hr * 0.7, hr * 1.05, Math.PI, Math.PI * 2); x.closePath(); x.fill(); x.stroke();
    var hx2 = bx + hr * 0.9, hy2 = by - hr * 0.2, ex = hx2 + Math.cos(ang) * u * 0.13, ey = hy2 + Math.sin(ang) * u * 0.13; x.lineCap = 'round';
    x.beginPath(); x.moveTo(hx2, hy2); x.lineTo(ex, ey); x.strokeStyle = T3_OL; x.lineWidth = u * 0.03 + lw * 1.6; x.stroke(); x.strokeStyle = '#ffd24a'; x.lineWidth = u * 0.03; x.stroke();
    x.beginPath(); x.arc(ex, ey, u * 0.03, 0, Math.PI * 2); x.fillStyle = '#ffd24a'; x.fill(); x.strokeStyle = T3_OL; x.lineWidth = lw; x.stroke();
    if (blow) { x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = Math.max(1, u * 0.018); for (i = 1; i <= 2; i++) { var rr = u * (0.05 + i * 0.045 + ((tm * 3) % 1) * 0.03); x.beginPath(); x.arc(ex, ey, rr, ang - 0.6, ang + 0.6); x.stroke(); } }
  }
  for (i = 0; i < info.flags.length; i++) { var fl = info.flags[i]; if (fl[7]) t3Flag(x, fl[0] * u, fl[1] * u, fl[2] * u, fl[3] * u, fl[4], tm * 0.8 + id + i, fl[6], 1, fl[5]); else t3Flag(x, fl[0] * u, fl[1] * u, fl[2] * u, fl[3] * u, fl[4], tm + id + i * 1.3, fl[6], 0, fl[5]); }
  x.restore();
}
t3Reg('barracks', t3Barracks, t3BarracksParts);

// ===================== 장승 =====================
// 1 통나무 장승 → 2 관모와 수염 → 3 금줄, 오색 천, 솟대. A 천하대장군(붉은 관모의 큰 장승) / B 지하여장군(푸른 족두리). 눈이 빛나고 주기적으로 몸이 울림
function t3Sotdae(x, px, py, h, sd) { // 솟대: 장대 위 나무 새
  t3L(x, [[px, py], [px + sd * 0.01, py - h]], '#8a5a34', 0.022, 1.2);
  var bx = px + sd * 0.01, by = py - h - 0.03; t3E(x, bx, by, 0.06, 0.032, '#c98a4a', { hi: 0.35, lo: 0.25 }); t3E(x, bx + sd * 0.055, by - 0.035, 0.028, 0.026, '#c98a4a', { hi: 0.35, lo: 0.25 });
  t3Pg(x, [[bx + sd * 0.075, by - 0.045], [bx + sd * 0.125, by - 0.03], [bx + sd * 0.075, by - 0.022]], '#ffd24a', { flat: 1, ink: 0.7 }); t3Pg(x, [[bx - sd * 0.05, by - 0.01], [bx - sd * 0.11, by - 0.045], [bx - sd * 0.05, by + 0.015]], '#a56a38', { flat: 1, ink: 0.7 });
}
function t3Stones(x, cx, by, n, sc, rnd) { // 돌무더기
  var rows = n >= 6 ? [3, 2, 1] : n >= 3 ? [2, 1] : [1], y = by;
  rows.forEach(function (c, r) { for (var i = 0; i < c; i++) { var rx = (0.062 + rnd() * 0.02) * sc, px = cx + (i - (c - 1) / 2) * 0.105 * sc + (rnd() - 0.5) * 0.02, g = mixc('#b9bccc', '#9aa0b8', rnd()); t3E(x, px, y - rx * 0.62, rx, rx * 0.68, g, { hi: 0.45, lo: 0.3, ink: 0.85 }); } y -= 0.075 * sc; });
}
function t3Jangseung(D) {
  var L = D.L, A = D.A, V = D.V, x = D.b, f = D.f, rnd = D.rnd, h = [0, 0.64, 0.8, 0.92, 1.0, 1.08, 1.22][L], s = [0, 1.1, 1.17, 1.24, 1.34, 1.4, 1.52][L];
  var wood = A ? '#a8683a' : V ? '#b98a52' : '#a0703a', face = twLt(wood, 0.22), eyeC = A ? '#ff5a2a' : V ? '#4fe0ff' : '#ffd84a', hat = A ? '#d8452f' : V ? '#2f7fd8' : '#3a3048', yf = -h * 0.66, strips = [], wisps = L === 6 ? 3 : 0;
  // 솟대와 돌(뒤)
  if (L >= 3) t3Sotdae(x, 0.37, 0.0, L >= 6 ? 0.86 : 0.66, -1);
  if (L >= 5) t3Sotdae(x, -0.38, 0.0, L >= 6 ? 0.74 : 0.56, 1);
  D.part('body', [-0.75, -1.9, 0.75, 0.1], function (c) {
    var hwB = 0.105 * s, hwT = 0.128 * s, ps = shp(), p = ps.p;
    p.moveTo(-hwB, 0); p.lineTo(-hwT, -h + 0.05); p.quadraticCurveTo(-hwT, -h - 0.02, 0, -h - 0.03); p.quadraticCurveTo(hwT, -h - 0.02, hwT, -h + 0.05); p.lineTo(hwB, 0); p.quadraticCurveTo(0, 0.05, -hwB, 0); p.closePath(); ps.ext(-hwT, -h - 0.03); ps.ext(hwT, 0.03);
    // 여장군 머리 댕기(뒤)
    if (V) [-1, 1].forEach(function (sd) { t3E(c, sd * hwT * 1.0, -h + 0.06, 0.06 * s, 0.075 * s, '#2a2238', { flat: 1 }); if (L >= 5) t3L(c, [[sd * hwT * 1.05, -h + 0.1], [sd * hwT * 1.25, -h + 0.34]], '#e0483a', 0.035 * s, 1.2); });
    t3S(c, ps, wood, { cyl: 1, hi: 0.35, lo: 0.36 });
    c.save(); c.clip(ps.p);
    c.fillStyle = rgba(face, 0.75); c.beginPath(); c.ellipse(0, yf + 0.02 * s, hwT * 0.86, h * 0.3, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(t3Ink(wood), 0.32); c.lineWidth = T3W * 0.6; for (var g = 0; g < 5; g++) { var gx = (rnd() - 0.5) * hwT * 1.7; c.beginPath(); c.moveTo(gx, 0.02); c.quadraticCurveTo(gx + (rnd() - 0.5) * 0.04, -h * 0.2, gx + (rnd() - 0.5) * 0.02, -h * (0.3 + rnd() * 0.08)); c.stroke(); }
    if (V) { c.fillStyle = '#2a2238'; c.beginPath(); c.ellipse(0, -h + 0.0, hwT * 1.2, 0.1 * s, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = face; c.beginPath(); c.moveTo(-0.012, -h - 0.05); c.lineTo(0.012, -h - 0.05); c.lineTo(0.03 * s, -h + 0.1 * s); c.lineTo(-0.03 * s, -h + 0.1 * s); c.fill(); }
    // 몸의 무늬 띠(글자 대신 마름모 무늬)
    if (L >= 2) { c.fillStyle = rgba(t3Ink(wood), 0.5); c.fillRect(-0.04 * s, yf + 0.3 * s, 0.08 * s, -yf - 0.3 * s - 0.05); [A ? '#ffd24a' : '#e0483a', V ? '#4fe0ff' : '#ffd24a', A ? '#e0483a' : '#3f8fd8'].forEach(function (cc, i) { var dy = yf + 0.34 * s + i * 0.075 * s + 0.03; if (dy > -0.07) return; c.fillStyle = cc; c.beginPath(); c.moveTo(0, dy - 0.03 * s); c.lineTo(0.026 * s, dy); c.lineTo(0, dy + 0.03 * s); c.lineTo(-0.026 * s, dy); c.fill(); }); }
    c.restore(); c.strokeStyle = t3Ink(wood); c.lineWidth = T3W; c.stroke(ps.p);
    // 수염
    if (L >= 2 && !V) { var bd = [[-0.1 * s, yf + 0.17 * s]], nb = L >= 4 ? 5 : 3; for (var b = 0; b < nb; b++) { bd.push([(-0.1 + (b + 0.5) * 0.2 / nb) * s, yf + (L >= 4 ? 0.34 : 0.27) * s + (b === (nb - 1) / 2 ? 0.05 * s : 0)]); bd.push([(-0.1 + (b + 1) * 0.2 / nb) * s, yf + 0.19 * s]); } t3Pg(c, bd, A ? '#2a2238' : '#4a3a40', { flat: 1, ink: 0.8 }); }
    // 입: 이를 드러낸 웃음
    var mw = 0.18 * s, mh = 0.075 * s, my = yf + 0.1 * s, ms = t3R(c, -mw / 2, my, mw, mh, 0.025 * s, '#6a1f2a', { flat: 1 });
    c.fillStyle = '#fff8e8'; var nt = 4; for (var k = 0; k < nt; k++) c.fillRect(-mw / 2 + 0.012 * s + k * (mw - 0.024 * s) / nt + 0.004, my + 0.006, (mw - 0.024 * s) / nt - 0.008, mh * 0.5);
    if (A) [-1, 1].forEach(function (sd) { c.fillStyle = '#fff8e8'; c.beginPath(); c.moveTo(sd * mw * 0.42, my + mh); c.lineTo(sd * mw * 0.3, my + mh * 0.1); c.lineTo(sd * mw * 0.18, my + mh); c.fill(); });
    c.strokeStyle = t3Ink('#6a1f2a'); c.lineWidth = T3W; c.stroke(ms.p);
    // 코
    t3Bl(c, [[-0.03 * s, yf - 0.06 * s], [0.03 * s, yf - 0.06 * s], [0.055 * s, yf + 0.05 * s], [0, yf + 0.085 * s], [-0.055 * s, yf + 0.05 * s]], twLt(wood, 0.36), { hi: 0.35, lo: 0.2, ink: 0.9 });
    // 눈과 눈썹
    [-1, 1].forEach(function (sd) {
      t3E(c, sd * 0.068 * s, yf - 0.065 * s, 0.05 * s, 0.045 * s, '#fffbe8', { flat: 1 }); t3Dot(c, sd * 0.06 * s, yf - 0.058 * s, 0.024 * s, L >= 4 ? eyeC : '#2a1830'); t3Dot(c, sd * 0.06 * s, yf - 0.058 * s, 0.011 * s, L >= 4 ? '#ffffff' : '#000000');
      t3L(c, [[sd * 0.125 * s, yf - 0.15 * s], [sd * 0.02 * s, yf - 0.105 * s]], A ? '#2a2238' : V ? '#2a2238' : '#4a3a40', (V ? 0.022 : 0.034) * s, 1.1);
      if (V) t3Dot(c, sd * 0.085 * s, yf + 0.045 * s, 0.026 * s, '#e0483a');
    });
    if (V) t3Dot(c, 0, yf - 0.16 * s, 0.02 * s, '#e0483a');
    // 관모
    var ty = -h;
    if (A) {
      [-1, 1].forEach(function (sd) { t3E(c, sd * 0.225 * s, ty - 0.035 * s, 0.11 * s, 0.038 * s, hat, { hi: 0.3, lo: 0.25 }); t3E(c, sd * 0.225 * s, ty - 0.035 * s, 0.07 * s, 0.016 * s, '#ffd24a', { flat: 1, ink: 0 }); });
      t3R(c, -0.1 * s, ty - 0.2 * s, 0.2 * s, 0.16 * s, 0.05 * s, twSh(hat, 0.12), { hi: 0.25, lo: 0.25 }); t3R(c, -0.155 * s, ty - 0.095 * s, 0.31 * s, 0.13 * s, 0.045 * s, hat, { hi: 0.35, lo: 0.25 });
      c.fillStyle = '#ffd24a'; c.fillRect(-0.15 * s, ty + 0.005, 0.3 * s, 0.022 * s);
      if (L >= 5) { t3E(c, 0, ty - 0.045 * s, 0.035 * s, 0.035 * s, '#ffd24a', { hi: 0.5, ink: 0.8 }); }
      if (L === 6) { t3Pg(c, [[-0.03 * s, ty - 0.2 * s], [0, ty - 0.33 * s], [0.03 * s, ty - 0.2 * s]], '#ffd24a', { hi: 0.5, lo: 0.2 }); t3E(c, 0, ty - 0.34 * s, 0.03 * s, 0.03 * s, '#ff8a3a', { hi: 0.5 }); }
    } else if (V) {
      t3Pg(c, [[-0.085 * s, ty + 0.0], [-0.12 * s, ty - 0.13 * s], [0.12 * s, ty - 0.13 * s], [0.085 * s, ty + 0.0]], hat, { hi: 0.4, lo: 0.25 }); c.fillStyle = '#ffd24a'; c.fillRect(-0.09 * s, ty - 0.03 * s, 0.18 * s, 0.022 * s);
      ['#e0483a', '#7de08a', '#ffd24a'].forEach(function (cc, i) { if (L < 5 && i !== 1) return; t3E(c, (i - 1) * 0.075 * s, ty - 0.15 * s - (i === 1 ? 0.02 * s : 0), 0.03 * s, 0.03 * s, cc, { hi: 0.5, ink: 0.8 }); });
      if (L === 6) { t3L(c, [[0, ty - 0.19 * s], [0, ty - 0.3 * s]], '#ffd24a', 0.016 * s, 1.1); t3E(c, 0, ty - 0.32 * s, 0.035 * s, 0.035 * s, '#4fe0ff', { hi: 0.6 }); }
    } else if (L >= 2) {
      t3Pg(c, [[-0.16 * s, ty + 0.035], [-0.105 * s, ty - 0.12 * s], [0.105 * s, ty - 0.12 * s], [0.16 * s, ty + 0.035]], hat, { hi: 0.3, lo: 0.2 }); t3L(c, [[-0.2 * s, ty + 0.035], [0.2 * s, ty + 0.035]], hat, 0.03 * s);
      if (L === 3) { c.fillStyle = '#ffd24a'; c.fillRect(-0.13 * s, ty - 0.03 * s, 0.26 * s, 0.022 * s); }
    } else { t3E(c, 0, -h - 0.0, hwT * 0.8, 0.03, twLt(wood, 0.4), { flat: 1, ink: 0.7 }); }
    // 금줄: 새끼줄과 흰 종이
    if (L >= 3) {
      var ry = -h * 0.27, rw = hwB * 1.22;
      c.lineCap = 'round'; c.beginPath(); c.moveTo(-rw, ry - 0.02); c.quadraticCurveTo(0, ry + 0.06, rw, ry - 0.02); c.strokeStyle = t3Ink('#d9b56a'); c.lineWidth = 0.04 + T3W * 1.5; c.stroke(); c.strokeStyle = '#e6c67a'; c.lineWidth = 0.04; c.stroke();
      [-0.6, 0, 0.6].forEach(function (k, i) { var px = k * rw, py = ry + 0.03 - Math.abs(k) * 0.03; t3Pg(c, [[px - 0.018, py], [px + 0.018, py], [px + 0.022, py + 0.075], [px, py + 0.06], [px - 0.022, py + 0.075]], i === 1 && L >= 4 ? (A ? '#e0483a' : '#3f8fd8') : '#ffffff', { flat: 1, ink: 0.6 }); });
      var cols = ['#e0483a', '#3f8fd8', '#ffd24a', '#ffffff', '#4fae6a'], ns = L >= 5 ? 5 : L === 4 ? 4 : 3; for (var q = 0; q < ns; q++) strips.push([(q % 2 ? 1 : -1) * rw * (0.9 + (q >> 1) * 0.12), ry - 0.02 + (q >> 1) * 0.01, 0.13 + (q % 3) * 0.03, cols[q]]);
    }
  });
  // 발치의 돌무더기(앞)
  t3Stones(f, -0.24, 0.1, L >= 3 ? 3 : 1, 1, rnd); t3Stones(f, 0.25, 0.11, L >= 4 ? 6 : L >= 2 ? 3 : 1, L >= 4 ? 0.9 : 1, rnd);
  return { eyes: [[-0.068 * s, yf - 0.065 * s], [0.068 * s, yf - 0.065 * s]], eyeC: eyeC, s: s, h: h, strips: strips, wisps: wisps, A: A, V: V, L: L, mounts: [[0, yf - 0.06 * s]] };
}
function t3Strips(x, list, u, dx, w, time, ph) { // 나부끼는 천 조각들 [x, y, 길이, 색]: 테두리는 한 번에 긋고 색만 따로
  var n = list.length, P = [], i, k; if (!n) return;
  for (i = 0; i < n; i++) { var st = list[i], px = dx + st[0] * u, py = st[1] * u, len = st[2] * u, q = [px, py], f = ph + i * 1.7; for (k = 1; k <= 3; k++) q.push(px + Math.sin(time * 3.2 + f + k * 0.9) * w * 1.1 * k / 3 + Math.sin(time * 1.3 + f) * w * 0.8 * k / 3, py + len * k / 3); P.push(q); }
  x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
  for (i = 0; i < n; i++) { x.moveTo(P[i][0], P[i][1]); for (k = 1; k <= 3; k++) x.lineTo(P[i][k * 2], P[i][k * 2 + 1]); }
  x.strokeStyle = T3_OL; x.lineWidth = w + Math.max(1.6, w * 0.6); x.stroke(); x.lineWidth = w;
  for (i = 0; i < n; i++) { x.beginPath(); x.moveTo(P[i][0], P[i][1]); for (k = 1; k <= 3; k++) x.lineTo(P[i][k * 2], P[i][k * 2 + 1]); x.strokeStyle = list[i][3]; x.stroke(); }
}
function t3JangParts(x, t, X, Y, S, time, info) {
  var p = info.p, u = info.u, id = t.id || 0, tm = t3Still(t) ? 0.3 : time, f = t3FireK(t), cyc = (tm * 0.3 + id * 0.41) % 1, env = t3Still(t) ? 0 : Math.max(f, cyc < 0.12 ? Math.sin(cyc / 0.12 * Math.PI) : 0), dx = Math.sin(tm * 58) * 0.016 * u * env, oy = -info.ph * u, i, s = info.s;
  x.save(); x.translate(X, Y + oy);
  // 몸이 울릴 때 퍼지는 기운
  if (env > 0.03) { x.strokeStyle = info.eyeC; x.lineWidth = Math.max(1.2, u * 0.028); for (i = 0; i < 2; i++) { var k = (1 - env) * 0.5 + i * 0.3; x.globalAlpha = env * (0.75 - i * 0.3); x.beginPath(); x.ellipse(0, 0.02 * u, (0.3 + k * 0.5) * u, (0.16 + k * 0.26) * u, 0, 0, Math.PI * 2); x.stroke(); } x.globalAlpha = 1; }
  if (info.L >= 4 && env > 0.05) t3Glow(x, 0, -info.h * 0.6 * u, u * 0.55 * s, info.eyeC, env * 0.3);
  t3Img(x, p.body, dx, 0);
  t3Strips(x, info.strips, u, dx, Math.max(1.6, u * 0.034), tm, id);
  // 눈빛
  var ga = (info.L >= 4 ? 0.55 : 0.22) + 0.15 * Math.sin(tm * 2.6 + id) + env * 0.9, gr = u * (0.05 + 0.09 * env + (info.L >= 4 ? 0.012 : 0)) * s;
  for (i = 0; i < 2; i++) { var e = info.eyes[i]; t3Glow(x, dx + e[0] * u, e[1] * u, gr, info.eyeC, ga); if (env > 0.25) t3Glow(x, dx + e[0] * u, e[1] * u, gr * 0.5, '#ffffff', env); }
  // 6단계: 떠도는 불(천하대장군은 붉은 불, 지하여장군은 푸른 도깨비불)
  for (i = 0; i < info.wisps; i++) { var a = tm * 1.1 + i * 2.094 + id, wx = Math.cos(a) * 0.42 * u, wy = (-info.h * 0.55 + Math.sin(a) * 0.12 + Math.sin(tm * 3 + i) * 0.03) * u; t3Glow(x, wx, wy, u * 0.12, info.eyeC, 1); }
  x.restore();
}
t3Reg('jangseung', t3Jangseung, t3JangParts);


// ===================== 서낭당 =====================
// 1 돌무더기와 금줄 두른 당나무 → 2 작은 기와 사당 → 3 오색 천과 촛불. A 봉인 부적(봉인진이 그려진 돌 제단) / B 벽력 부적(북과 번개 무늬 깃발)
function t3Tree(x, tx, ty, sc, rnd, dark) {
  var g1 = dark ? '#3f7a52' : '#4f9a5a', g2 = dark ? '#356a48' : '#3f8a50';
  x.lineCap = 'round'; x.beginPath(); x.moveTo(tx - 0.02 * sc, ty); x.quadraticCurveTo(tx + 0.03 * sc, ty - 0.2 * sc, tx - 0.02 * sc, ty - 0.42 * sc); x.strokeStyle = t3Ink('#8a5a3a'); x.lineWidth = 0.085 * sc + T3W * 1.6; x.stroke(); x.strokeStyle = '#8a5a3a'; x.lineWidth = 0.085 * sc; x.stroke();
  t3L(x, [[tx, ty - 0.3 * sc], [tx + 0.14 * sc, ty - 0.44 * sc]], '#8a5a3a', 0.04 * sc); t3L(x, [[tx - 0.01 * sc, ty - 0.26 * sc], [tx - 0.13 * sc, ty - 0.4 * sc]], '#8a5a3a', 0.036 * sc);
  [[-0.15, -0.5, 0.15], [0.16, -0.52, 0.15], [0.0, -0.62, 0.2], [-0.1, -0.74, 0.14], [0.1, -0.76, 0.14]].forEach(function (b, i) { t3E(x, tx + b[0] * sc, ty + b[1] * sc, b[2] * sc, b[2] * sc * 0.82, i % 2 ? g1 : g2, { hi: 0.4, lo: 0.3 }); t3Hi(x, tx + (b[0] - 0.04) * sc, ty + (b[1] - 0.05) * sc, b[2] * sc * 0.35, b[2] * sc * 0.16, 0.3); });
  // 금줄
  x.beginPath(); x.moveTo(tx - 0.06 * sc, ty - 0.17 * sc); x.quadraticCurveTo(tx, ty - 0.12 * sc, tx + 0.065 * sc, ty - 0.18 * sc); x.strokeStyle = t3Ink('#d9b56a'); x.lineWidth = 0.034 * sc + T3W * 1.4; x.stroke(); x.strokeStyle = '#e6c67a'; x.lineWidth = 0.034 * sc; x.stroke();
  [-0.035, 0.03].forEach(function (k) { t3Pg(x, [[tx + k * sc - 0.014, ty - 0.14 * sc], [tx + k * sc + 0.014, ty - 0.14 * sc], [tx + k * sc + 0.018, ty - 0.085 * sc], [tx + k * sc - 0.018, ty - 0.085 * sc]], '#ffffff', { flat: 1, ink: 0.6 }); });
}
function t3TalismanDraw(x, w, h, col) { // 부적: 노란 종이에 붉은 무늬(글자 아님). 원점 = 위 가운데
  var s = t3R(x, -w / 2, 0, w, h, w * 0.08, col || '#ffe27a', { hi: 0.3, lo: 0.15 });
  x.save(); x.clip(s.p); x.strokeStyle = '#e0362a'; x.lineWidth = w * 0.1; x.lineJoin = 'round'; x.lineCap = 'round';
  x.beginPath(); x.moveTo(-w * 0.22, h * 0.16); x.lineTo(w * 0.22, h * 0.16); x.moveTo(-w * 0.2, h * 0.46); x.lineTo(w * 0.2, h * 0.56); x.lineTo(-w * 0.2, h * 0.68); x.lineTo(w * 0.16, h * 0.8); x.stroke();
  x.beginPath(); x.arc(0, h * 0.31, w * 0.13, 0, Math.PI * 2); x.stroke(); x.restore(); x.strokeStyle = t3Ink('#e0a020'); x.lineWidth = T3W * 0.8; x.stroke(s.p);
}
function t3Drum(x, cx, cy, r, gold) { // 세운 북과 받침
  t3L(x, [[cx - r * 0.75, cy + r * 1.25], [cx - r * 0.2, cy + r * 0.3]], '#8f5530', r * 0.2); t3L(x, [[cx + r * 1.1, cy + r * 1.2], [cx + r * 0.55, cy + r * 0.3]], '#8f5530', r * 0.2);
  var body = shp(), p = body.p; p.moveTo(cx, cy - r); p.lineTo(cx + r * 0.75, cy - r * 0.94); p.ellipse(cx + r * 0.75, cy, r * 0.5, r * 0.94, 0, -Math.PI / 2, Math.PI / 2); p.lineTo(cx, cy + r); p.closePath(); body.ext(cx, cy - r); body.ext(cx + r * 1.25, cy + r);
  t3S(x, body, '#c8423a', { hi: 0.25, lo: 0.3 }); x.save(); x.clip(body.p); x.fillStyle = gold ? '#ffd24a' : '#e9b860'; x.fillRect(cx + r * 0.16, cy - r, r * 0.1, r * 2); x.fillRect(cx + r * 0.62, cy - r, r * 0.1, r * 2); x.restore(); x.strokeStyle = t3Ink('#c8423a'); x.lineWidth = T3W; x.stroke(body.p);
  var fc = t3E(x, cx, cy, r * 0.55, r, '#fbeed0', { hi: 0.3, lo: 0.16, inkc: gold ? '#8a5a10' : null });
  x.save(); x.clip(fc.p); ['#e0483a', '#3f6fd0', '#ffd24a'].forEach(function (c, i) { x.fillStyle = c; x.beginPath(); x.moveTo(cx, cy); x.ellipse(cx, cy, r * 0.3, r * 0.55, 0, i * 2.094, i * 2.094 + 2.094); x.closePath(); x.fill(); }); x.restore();
  if (gold) { x.beginPath(); x.ellipse(cx, cy, r * 0.55, r, 0, 0, Math.PI * 2); x.strokeStyle = '#ffd24a'; x.lineWidth = T3W * 0.9; x.stroke(); }
}
function t3Shrine(D) {
  var L = D.L, A = D.A, V = D.V, x = D.b, f = D.f, rnd = D.rnd, hang = [], strips = [], candles = [], orbit = null, drum = null, flags = [], seal = null, cloud = null, giwa = '#d9a22e';
  var ts = A ? [0, 0, 0, 0, 0.92, 0.98, 1.06][L] : V ? [0, 0, 0, 0, 1.0, 1.06, 1.14][L] : [0, 0.8, 0.9, 1.02][L], tx = A ? -0.2 : V ? -0.22 : L === 1 ? -0.1 : -0.2, ty = A || V ? -0.08 : -0.04;
  t3Tree(x, tx, ty, ts, rnd, A || V);
  var cols = ['#e0483a', '#3f8fd8', '#ffd24a', '#ffffff', '#4fae6a'];
  if (L >= 3) for (var q = 0; q < (L >= 5 ? 5 : 4); q++) strips.push([tx + (-0.2 + q * 0.1) * ts, ty - (0.42 - Math.abs(q - 2) * 0.02) * ts, 0.14 + (q % 2) * 0.03, cols[q]]);
  // 사당
  var house = function (hx, hy, w, h, two) {
    t3R(x, hx - w / 2, hy - h, w, h, 0, '#f6efe0', { hi: 0.2, lo: 0.18 }); t3R(x, hx - w * 0.17, hy - h * 0.8, w * 0.34, h * 0.8, 0.01, '#5a2a30', { flat: 1 });
    [-1, 1].forEach(function (sd) { t3L(x, [[hx + sd * (w / 2 - 0.012), hy], [hx + sd * (w / 2 - 0.012), hy - h]], '#c8423a', 0.03); });
    x.fillStyle = '#3f8f7a'; x.fillRect(hx - w / 2, hy - h, w, 0.028);
    t3Giwa(x, hx, hy - h, w + 0.2, two ? 0.18 : 0.16, giwa, { eave: '#ffe9a0', ridge: two ? '#ffd24a' : '#8a5a20', tip: L >= 3 ? '#ffd24a' : null, n: 5 });
    t3R(x, hx - w / 2 - 0.03, hy - 0.012, w + 0.06, 0.035, 0.008, '#c9c2b6', { hi: 0.3, lo: 0.25 });
    return [hx, hy - h - (two ? 0.17 : 0.15)];
  };
  var top = null;
  if (!A && !V && L >= 2) { top = house(L === 2 ? 0.22 : 0.22, 0.0, L === 2 ? 0.3 : 0.36, L === 2 ? 0.19 : 0.22, 0); hang = L === 2 ? [[0.02, -0.33], [0.1, -0.31]] : [[-0.02, -0.4], [0.07, -0.37], [0.15, -0.35]]; if (L === 3) candles = [[0.14, 0.11], [0.34, 0.12]]; }
  if (L === 1) { hang = [[0.02, -0.32], [0.11, -0.33], [0.2, -0.31]]; x.strokeStyle = t3Ink('#d9b56a'); x.lineWidth = 0.014; x.beginPath(); x.moveTo(tx + 0.08 * ts, ty - 0.4 * ts); x.lineTo(0.27, -0.3); x.stroke(); t3L(x, [[0.27, 0.02], [0.27, -0.33]], '#8f5530', 0.026, 1.2); }
  if (A) {
    top = house(0.3, -0.07, 0.26, 0.18, L === 6);
    // 봉인진 돌 제단
    var ar = L === 6 ? 0.34 : L === 5 ? 0.3 : 0.27, ax = 0.06, ay = 0.07;
    t3Cyl(x, ax, ay - 0.06, ar, ar * 0.52, 0.06, '#b9bccc', { top: '#dfe1ea' });
    x.save(); x.translate(ax, ay - 0.06); x.scale(1, 0.52); x.strokeStyle = '#d8342a'; x.lineWidth = 0.022; x.beginPath(); x.arc(0, 0, ar * 0.82, 0, Math.PI * 2); x.stroke(); x.lineWidth = 0.014; x.beginPath(); x.arc(0, 0, ar * 0.5, 0, Math.PI * 2); x.stroke();
    for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4; x.beginPath(); x.moveTo(Math.cos(a) * ar * 0.56, Math.sin(a) * ar * 0.56); x.lineTo(Math.cos(a) * ar * 0.76, Math.sin(a) * ar * 0.76); x.stroke(); }
    x.strokeStyle = L === 6 ? '#ffb020' : '#d8342a'; x.lineWidth = 0.016; x.beginPath(); for (var k2 = 0; k2 < 5; k2++) { var a2 = -Math.PI / 2 + k2 * Math.PI * 4 / 5; if (k2) x.lineTo(Math.cos(a2) * ar * 0.5, Math.sin(a2) * ar * 0.5); else x.moveTo(Math.cos(a2) * ar * 0.5, Math.sin(a2) * ar * 0.5); } x.closePath(); x.stroke(); x.restore();
    seal = [ax, ay - 0.06, ar]; orbit = { c: [ax, ay - 0.36], rx: ar * 1.12, ry: ar * 0.34, n: L === 4 ? 3 : L === 5 ? 4 : 6 };
    candles = [[ax - ar - 0.03, ay + 0.02], [ax + ar + 0.03, ay + 0.03]];
  }
  if (V) {
    top = house(0.26, -0.1, 0.26, 0.17, L === 6);
    var dr = L === 6 ? 0.17 : L === 5 ? 0.145 : 0.125; t3Drum(f, 0.1, 0.02 - dr * 0.55, dr, L === 6); drum = [0.1, 0.02 - dr * 0.55, dr];
    var fp = L === 4 ? [[0.44, 0.02, 0.58]] : [[0.45, 0.02, L === 6 ? 0.8 : 0.66], [-0.45, 0.03, L === 6 ? 0.66 : 0.52]];
    fp.forEach(function (q2, i) { t3L(x, [[q2[0], q2[1]], [q2[0], q2[1] - q2[2]]], '#8f5530', 0.024, 1.2); t3E(x, q2[0], q2[1] - q2[2] - 0.012, 0.026, 0.026, '#ffd24a', { hi: 0.5, ink: 0.7 }); flags.push([q2[0], q2[1] - q2[2] + 0.02, 0.14, 0.26, '#3f6fd0', '#ffd24a', q2[0] > 0 ? -1 : 1]); });
    hang = [[-0.02, -0.42], [0.06, -0.4]];
    if (L === 6) { cloud = [tx + 0.02, ty - 0.98 * ts]; D.part('cloud', [-0.4, -0.2, 0.4, 0.2], function (c) { [[-0.16, 0.02, 0.12], [0.0, -0.03, 0.16], [0.17, 0.02, 0.12], [0.06, 0.06, 0.13], [-0.07, 0.06, 0.12]].forEach(function (b) { t3E(c, b[0], b[1], b[2], b[2] * 0.7, '#7a7a9c', { hi: 0.35, lo: 0.3, ink: 0 }); }); }); }
  }
  // 돌무더기(앞)
  if (L === 1) t3Stones(f, 0.24, 0.1, 6, 1.05, rnd); else if (!A && !V) t3Stones(f, -0.3, 0.13, 6, L === 2 ? 0.9 : 1, rnd); else t3Stones(f, -0.36, 0.14, 3, 0.9, rnd);
  D.part('tal', [-0.07, -0.01, 0.07, 0.19], function (c) { t3TalismanDraw(c, 0.08, 0.155, '#ffe45e'); });
  // 부적 줄
  if (hang.length && top) { x.strokeStyle = t3Ink('#d9b56a'); x.lineWidth = 0.012; x.beginPath(); x.moveTo(tx + 0.1 * ts, ty - 0.42 * ts); x.quadraticCurveTo((tx + top[0]) / 2 + 0.05, hang[0][1] + 0.03, top[0] - 0.1, top[1] + 0.12); x.stroke(); }
  return { hang: hang, strips: strips, candles: candles, orbit: orbit, drum: drum, flags: flags, seal: seal, cloud: cloud, A: A, V: V, L: L, mounts: [[0.05, -0.4]] };
}
function t3ShrineParts(x, t, X, Y, S, time, info) {
  var p = info.p, u = info.u, id = t.id || 0, tm = t3Still(t) ? 0.3 : time, f = t3FireK(t), sh = t.shots | 0, oy = -info.ph * u, i;
  x.save(); x.translate(X, Y + oy);
  // 봉인진 빛
  if (info.seal) { var sl = info.seal; x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(1, 0.3 + 0.15 * Math.sin(tm * 2.4 + id) + f * 0.6); x.drawImage(glowSpr(info.L === 6 ? '#ffb020' : '#ff5a3a', 32), (sl[0] - sl[2] * 1.3) * u, (sl[1] - sl[2] * 0.7) * u, sl[2] * 2.6 * u, sl[2] * 1.4 * u); x.restore(); }
  t3Strips(x, info.strips, u, 0, Math.max(1.6, u * 0.032), tm, id);
  // 걸린 부적: 나부끼고, 던질 때 하나가 빛나며 떠오름
  for (i = 0; i < info.hang.length; i++) {
    var h = info.hang[i], go = f > 0 && (sh % info.hang.length) === i, sw = Math.sin(tm * 2.8 + i * 1.9 + id) * 0.3 + Math.sin(tm * 6.1 + i) * 0.06, hx = h[0] * u, hy = (h[1] - (go ? (1 - f) * 0.1 : 0)) * u;
    if (go) t3Glow(x, hx, hy + u * 0.06, u * (0.12 + 0.12 * f), '#ffe27a', 0.4 + f);
    t3Rot(x, p.tal, hx, hy, go ? sw * 0.3 : sw, 1);
  }
  // 촛불
  for (i = 0; i < info.candles.length; i++) { var c = info.candles[i], cx = c[0] * u, cy = c[1] * u; x.fillStyle = '#fff6e0'; x.strokeStyle = T3_OL; x.lineWidth = Math.max(1, u * 0.014); x.beginPath(); x.rect(cx - u * 0.016, cy - u * 0.07, u * 0.032, u * 0.07); x.fill(); x.stroke(); t3Glow(x, cx, cy - u * (0.095 + 0.008 * Math.sin(tm * 11 + i * 3)), u * 0.07, '#ffc050', 1); }
  // 제단 위를 도는 부적(A)
  if (info.orbit) { var o = info.orbit, sp = 0.9 + f * 2.5; for (i = 0; i < o.n; i++) { var a = tm * sp * 0.9 + i * Math.PI * 2 / o.n + id, px = (o.c[0] + Math.cos(a) * o.rx) * u, py = (o.c[1] + Math.sin(a) * o.ry + Math.sin(tm * 2 + i) * 0.015 - f * 0.05) * u; if (f > 0 && (sh % o.n) === i) t3Glow(x, px, py + u * 0.06, u * 0.2, '#ffcf4a', 0.5 + f); t3Rot(x, p.tal, px, py, Math.cos(a) * 0.25, 1); }
    if (info.L === 6) t3Glow(x, o.c[0] * u, (o.c[1] + 0.06) * u, u * (0.16 + 0.03 * Math.sin(tm * 3)), '#ffcf4a', 0.55 + f * 0.4); }
  // 깃발과 북(B)
  for (i = 0; i < info.flags.length; i++) { var fl = info.flags[i]; t3Flag(x, fl[0] * u, fl[1] * u, fl[2] * u, fl[3] * u, fl[4], tm * 0.8 + id + i, fl[6], 1, fl[5]); }
  if (info.cloud) { var cl = info.cloud, cb = Math.sin(tm * 0.9 + id) * 0.02; t3Img(x, p.cloud, (cl[0] + cb) * u, cl[1] * u); var fk = (Math.sin(tm * 7.3 + id) > 0.86 || f > 0.5) ? 1 : 0; if (fk) { t3Glow(x, (cl[0] + cb) * u, cl[1] * u, u * 0.36, '#bfe0ff', 0.9); x.strokeStyle = '#fff6a0'; x.lineWidth = Math.max(1.4, u * 0.03); x.lineJoin = 'miter'; x.beginPath(); x.moveTo((cl[0] + 0.02) * u, (cl[1] + 0.06) * u); x.lineTo((cl[0] - 0.05) * u, (cl[1] + 0.19) * u); x.lineTo((cl[0] + 0.03) * u, (cl[1] + 0.19) * u); x.lineTo((cl[0] - 0.03) * u, (cl[1] + 0.33) * u); x.stroke(); } }
  x.restore();
}
function t3ShrineFront(x, t, X, Y, time, info) { // 북 울림은 앞 그림 위에
  if (!info.drum) return; var u = info.u, f = t3FireK(t), d = info.drum, cx = X + d[0] * u, cy = Y + (d[1] - info.ph) * u;
  if (f > 0) { x.save(); x.strokeStyle = '#fff3a0'; x.lineWidth = Math.max(1.2, u * 0.026); for (var i = 0; i < 2; i++) { x.globalAlpha = f * (0.9 - i * 0.35); x.beginPath(); x.ellipse(cx, cy, d[2] * (0.6 + (1 - f) * 0.7 + i * 0.3) * u, d[2] * (1.05 + (1 - f) * 1.0 + i * 0.4) * u, 0, 0, Math.PI * 2); x.stroke(); } x.restore(); t3Glow(x, cx, cy, u * d[2] * (1 + f), '#9fd0ff', f * 0.8); }
}
t3Reg('shrine', t3Shrine, function (x, t, X, Y, S, time, info) { t3ShrineParts(x, t, X, Y, S, time, info); if (info.drum) t3ShrineFront(x, t, X, Y, time, info); });
