// ===== art_enemy_ch4.js : 4장 도깨비 고개 적 18종 (한국 전통 요괴) =====
// 방식은 art_enemy.js 그대로: EN_DRAW[k] = { n, top, f(x, H, p) }, 세 번 그리기(크기 재기 → 외곽선 → 색칠), 맞을 때 흰 실루엣, 오른쪽이 진행 방향, 기준점은 발밑
// 1장과 다른 점: 외곽선은 먹색 하나(e4INK)로 굵게, 칠은 민화처럼 2~3단 명암(젤리 광택 없음), 단청 오방색(청, 적, 황, 백, 흑), 2.5~3등신, 통통 튀지 않고 걷기, 달리기, 둥실 떠가기
var e4INK = '#1d1726', e4K = '#0a0a0a'; // e4K: 무채색 기준색 → enInk 가 그 적의 EN_ONE(먹색)을 돌려줌
var e4C = { R: '#d9463c', B: '#2f6db5', G: '#3f9f8c', Y: '#f3b630', W: '#f7f2e6', K: '#2b2536', GOLD: '#f6cb4c', PALE: '#e6ecf2', FIRE: '#49a8ff', WOOD: '#a5673a' };

// ---------- 도우미 ----------
function e4F(x, s, col, o) {
  o = o || {};
  enJF(x, s, col, { oc: o.oc || e4K, lw: o.lw == null ? 1.1 : o.lw, hi: o.hi == null ? 0.2 : o.hi, lo: o.lo == null ? 0.14 : o.lo, d: o.d, sk: o.sk == null ? 0.4 : o.sk, sa: o.sa == null ? 0.6 : o.sa, rim: o.rim || 0, ra: o.ra, gx: o.gx, gy: o.gy, ln: o.ln, lc: o.lc });
  return s;
}
function e4Bl(pts) { return shp().blob(pts); }
function e4Po(pts) { return shp().poly(pts); }
function e4Ov(x, cx, cy, rx, ry, col, rot, o) { return e4F(x, enEl(cx, cy, rx, ry, rot), col, o); }
function e4Pill(x, a, b, w0, w1, col, lw) { return enPill(x, a, b, w0, w1, col, { oc: e4K, d: Math.min(w0, w1) * 0.22, rim: 0, hi: 0.2, lo: 0.14, sk: 0.4, sa: 0.6, lw: lw || 1 }); }
function e4Line(x, pts, lw, col) { enLine(x, pts, lw, enMode === 1 ? e4K : col); }
// 점: 색칠 단계만 (ol 이면 외곽선에도 들어감)
function e4Dot(x, cx, cy, r, col, ol) {
  r = Math.max(0.4, r);
  if (enMode === 2) { if (ol) enBBbox(x, cx - r, cy - r, cx + r, cy + r, enOL); return; }
  if (enMode === 1) { if (ol) { x.fillStyle = EN_ONE || e4INK; x.beginPath(); x.arc(cx, cy, r + enOL * 0.7, 0, Math.PI * 2); x.fill(); } return; }
  x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
}
function e4Clip(x, s, fn) { if (enMode) return; x.save(); x.clip(s.p); fn(); x.restore(); }
// 붓 획: 곡선(a → c 를 거쳐 → b)을 따라 굵기가 w0 에서 w1 로 변하는 먹선 (색칠 단계만)
function e4Brush(x, a, c, b, w0, w1, col, al) {
  if (enMode) return;
  var n = 6, L = [], R = [], i;
  for (i = 0; i <= n; i++) {
    var t = i / n, u = 1 - t, px = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], py = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1];
    var dx = u * (c[0] - a[0]) + t * (b[0] - c[0]), dy = u * (c[1] - a[1]) + t * (b[1] - c[1]), l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * t) / 2;
    L.push([px - dy / l * w, py + dx / l * w]); R.push([px + dy / l * w, py - dx / l * w]);
  }
  x.save(); if (al != null) x.globalAlpha = al; x.fillStyle = col || e4INK; x.beginPath(); x.moveTo(L[0][0], L[0][1]);
  for (i = 1; i <= n; i++) x.lineTo(L[i][0], L[i][1]);
  for (i = n; i >= 0; i--) x.lineTo(R[i][0], R[i][1]);
  x.closePath(); x.fill(); x.restore();
}
// 민화 눈: 흰자 + 먹 테 + 작은 눈동자(px, py 쪽으로 쏠림) + 반짝점. o: w 흰자 색, pc 눈동자 색, pr 눈동자 크기, ir 홍채 색
function e4Eye(x, cx, cy, rx, ry, o) {
  if (enMode) return;
  o = o || {};
  x.save();
  x.fillStyle = o.w || '#fffdf2'; x.strokeStyle = o.k || e4INK; x.lineWidth = Math.max(0.9, ry * 0.26);
  x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); x.stroke();
  var pr = ry * (o.pr || 0.48), px = cx + rx * (o.px == null ? 0.28 : o.px), py = cy + ry * (o.py || 0);
  if (o.ir) { x.fillStyle = o.ir; x.beginPath(); x.arc(px, py, Math.min(rx, ry) * 0.78, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = o.pc || e4INK; x.beginPath(); x.arc(px, py, pr, 0, Math.PI * 2); x.fill();
  if (ry > 2) { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(px - pr * 0.4, py - pr * 0.4, Math.max(0.5, pr * 0.36), 0, Math.PI * 2); x.fill(); }
  x.restore();
  enEyeRec(x, cx, cy, rx, ry, o.sd || 1);
}
// 갈기, 수염, 털: 가운데 (cx, cy) 둘레 a0 → a1 로 뾰족뾰족한 부채 (r0 골, r1 끝), n 가닥, ph 흔들림
function e4Mane(cx, cy, a0, a1, r0, r1, n, ph, ry) {
  var pts = [[cx, cy]], i, m = n * 2;
  for (i = 0; i <= m; i++) { var an = lerp(a0, a1, i / m), r = i % 2 ? r1 * (1 + 0.07 * Math.sin((ph || 0) + i * 1.7)) : r0; an += i % 2 ? 0.1 * Math.sin((ph || 0) + i) : 0; pts.push([cx + Math.cos(an) * r, cy + Math.sin(an) * r * (ry || 1)]); }
  return shp().poly(pts);
}
// 사람 다리: 엉덩이 (hx, hy) 에서 발까지 두 마디. ph 걸음 위상, st 보폭, lf 발 드는 높이, fw 발 길이
function e4Leg(x, hx, hy, ph, st, lf, w, col, shoe, fw) {
  var s = Math.sin(ph), c = Math.max(0, Math.cos(ph)), fx = hx + s * st, fy = -c * lf - fw * 0.5, kx = (hx + fx) / 2 + st * 0.45 * c + w * 0.1, ky = (hy + fy) / 2;
  e4Pill(x, [hx, hy], [kx, ky], w, w * 0.9, col); e4Pill(x, [kx, ky], [fx, fy], w * 0.9, w * 0.74, col);
  e4Ov(x, fx + fw * 0.32, fy + fw * 0.12, fw, fw * 0.5, shoe, -c * 0.25, { d: fw * 0.14 });
  return [fx, fy];
}
// 사람 팔: 어깨에서 th(아래 0, 앞 +) 방향으로. band 팔찌 색
function e4Arm(x, sx, sy, La, th, w, col, band) {
  var hx = sx + Math.sin(th) * La, hy = sy + Math.cos(th) * La;
  e4Pill(x, [sx, sy], [hx, hy], w, w * 0.85, col);
  if (band) e4Pill(x, [lerp(sx, hx, 0.7), lerp(sy, hy, 0.7)], [lerp(sx, hx, 0.82), lerp(sy, hy, 0.82)], w * 0.98, w * 0.95, band, 0.8);
  e4Ov(x, hx, hy, w * 0.58, w * 0.54, col, 0, { d: w * 0.12 });
  return [hx, hy];
}
// 네발 짐승 다리: 어깨나 엉덩이 (bx, by) 에서 길이 L, 흔들림 각 th(앞 +). o: hind 뒷다리(무릎이 뒤로), paw 발 색, bend 굽힘
function e4Paw(x, bx, by, L, th, w, col, o) {
  o = o || {};
  var px = bx + Math.sin(th) * L, py = Math.min(-w * 0.34, by + Math.cos(th) * L), k = o.hind ? -1 : 1, bend = (o.bend == null ? 0.14 : o.bend) * L * k;
  var mx = (bx + px) / 2 + Math.cos(th) * bend, my = (by + py) / 2 - Math.sin(th) * bend;
  e4Pill(x, [bx, by], [mx, my], w, w * 0.8, col); e4Pill(x, [mx, my], [px, py], w * 0.8, w * 0.64, col);
  e4Ov(x, px + w * 0.16, py + w * 0.04, w * 0.55, w * 0.36, o.paw || col, 0, { d: w * 0.1 });
  return [px, py];
}
// 꼬리(여우, 털 뭉치): 밑동 (bx, by) 에서 ang 방향 길이 L, 폭 w, 끝이 curl 만큼 휨. tip 끝 색
function e4Tail(x, bx, by, ang, L, w, col, tip, curl, o) {
  var c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c;
  function P(u, v) { var cu = (curl || 0) * u * u * L; return [bx + c * u * L + nx * (v * w + cu), by + s * u * L + ny * (v * w + cu)]; }
  var sh = shp().blob([P(0, 0.3), P(0.3, 0.8), P(0.72, 1.0), P(1.04, 0.15), P(0.8, -0.8), P(0.4, -0.62), P(0, -0.3)]);
  e4F(x, sh, col, o || { d: w * 0.3 });
  if (tip && !enMode) { var t = P(1.0, 0.1); x.save(); x.clip(sh.p); x.fillStyle = tip; x.beginPath(); x.arc(t[0], t[1], L * 0.24, 0, Math.PI * 2); x.fill(); x.restore(); x.lineWidth = enLW; x.strokeStyle = EN_ONE || e4INK; x.stroke(sh.p); }
  return P(1.0, 0.1);
}
// 여우불, 귀기 (푸른 작은 불꽃): 밑동 (bx, by), 크기 s, 기울기 lean
function e4Fire(x, bx, by, s, lean, col, glow) {
  col = col || e4C.FIRE;
  if (glow) enGlow(x, bx, by - s * 0.5, s * 1.6, col, glow);
  e4F(x, enFlameS(bx, by, s * 0.8, s * 1.5, lean || 0), col, { d: 0, hi: 0.35, lw: 0.8, oc: '#1c3f8f' });
  if (!enMode && s > 3) { x.fillStyle = 'rgba(235,252,255,0.9)'; x.fill(enFlameS(bx, by - s * 0.08, s * 0.4, s * 0.75, (lean || 0) * 0.7).p); }
}
// 호피 줄무늬: 모양 안에 붓 획 (list: [x0, y0, x1, y1, 굵기])
function e4Stripes(x, s, list, col) {
  e4Clip(x, s, function () { list.forEach(function (q) { var mx = (q[0] + q[2]) / 2 + (q[3] - q[1]) * 0.18, my = (q[1] + q[3]) / 2 - (q[2] - q[0]) * 0.18; e4Brush(x, [q[0], q[1]], [mx, my], [q[2], q[3]], q[4], q[4] * 0.15, col || e4INK); }); });
}
// 위에서 본 적(top: 1): 그리는 쪽이 기준점 위 ay/4 를 중심으로 돌리므로, 그림 상자를 위아래 hh 로 고정하고 몸 가운데 높이를 돌려줌
function e4Top(x, hh) { var pd = Math.ceil(EN_RIMW * 1.2) + 1, cy = -(hh + pd) / 3; if (enMode === 2) enBBbox(x, -1, cy - hh, 1, cy + hh, 0); return cy; }
// 물결 고리 (바다 적 발밑): 색칠 단계만
function e4Ripple(x, cx, cy, rx, ry, a, ph) {
  if (enMode === 2) { enBBbox(x, cx - rx, cy - ry, cx + rx, cy + ry, 1); return; }
  if (enMode) return;
  x.save(); x.lineCap = 'round';
  x.fillStyle = 'rgba(210,240,255,' + (a * 0.35) + ')'; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(255,255,255,' + a + ')'; x.lineWidth = Math.max(1, ry * 0.22);
  for (var i = 0; i < 3; i++) { var a0 = (ph || 0) + i * 2.1; x.beginPath(); x.ellipse(cx, cy, rx * (0.72 + i * 0.13), ry * (0.72 + i * 0.13), 0, a0, a0 + 1.5); x.stroke(); }
  x.restore();
}

// ---------- 도깨비 (졸개와 대장이 같이 씀) ----------
// 울퉁불퉁한 나무 방망이: 손 (bx, by) 에서 ang 방향(위가 0)으로 길이 L, 머리 폭 w
function e4Club(x, bx, by, ang, L, w, col, gold) {
  x.save(); x.translate(bx, by); x.rotate(ang);
  e4F(x, shp().rrect(-w * 0.15, -L * 0.42, w * 0.3, L * 0.54, w * 0.1), enShd(col, 0.2), { lw: 0.9 });
  var hd = e4Bl([[-w * 0.2, -L * 0.34], [-w * 0.54, -L * 0.5], [-w * 0.4, -L * 0.64], [-w * 0.6, -L * 0.8], [-w * 0.36, -L * 0.99], [w * 0.05, -L * 1.04], [w * 0.46, -L * 0.95], [w * 0.5, -L * 0.77], [w * 0.62, -L * 0.62], [w * 0.4, -L * 0.47], [w * 0.2, -L * 0.34]]);
  e4F(x, hd, col, { lw: 1.3, d: w * 0.16 });
  [[-0.2, -0.55, 0.13], [0.22, -0.66, 0.15], [-0.14, -0.82, 0.14], [0.2, -0.9, 0.1], [0.3, -0.5, 0.09]].forEach(function (q) { e4Ov(x, q[0] * w, q[1] * L, q[2] * w, q[2] * w, gold ? e4C.GOLD : enLit(col, 0.3), 0, { d: q[2] * w * 0.35, lw: 0.7, hi: 0.5 }); });
  e4F(x, shp().rrect(-w * 0.21, -L * 0.37, w * 0.42, L * 0.055, w * 0.04), gold ? e4C.GOLD : '#e9dcae', { lw: 0.8, d: 0 });
  x.restore();
}
// o: skin, hair, horn(뿔 색), horns(1|2), boss, belt(띠 색), wood
function e4Dok(x, H, p, o) {
  var a = p * Math.PI * 2, sw = Math.sin(a), bob = Math.abs(Math.cos(a)), sk = o.skin, skD = enShd(sk, 0.3), hair = o.hair, B = o.boss ? 1 : 0;
  var hr = H * (B ? 0.165 : 0.185), shY = -H * (B ? 0.69 : 0.55), hipY = -H * (B ? 0.36 : 0.26), bw = H * (B ? 0.3 : 0.19), lw = H * (B ? 0.15 : 0.11), La = H * (B ? 0.36 : 0.27), wk = B ? 0.66 : 1;
  var cxh = H * 0.07, cyh = shY - hr * (B ? 0.5 : 0.6), i;
  EN_ONE = e4INK;
  x.save(); x.translate(0, -bob * H * 0.02); x.rotate(sw * (B ? 0.03 : 0.05));
  // 먼 팔, 다리
  e4Arm(x, -bw * 0.72, shY + H * 0.08, La, -sw * 0.6 - 0.12, lw * 0.95, skD, B ? enShd(e4C.GOLD, 0.2) : 0);
  e4Leg(x, -H * (B ? 0.1 : 0.075), hipY, a + Math.PI, H * 0.12, H * 0.055, lw * 1.05, skD, skD, H * (B ? 0.1 : 0.085));
  e4Leg(x, H * (B ? 0.11 : 0.085), hipY, a, H * 0.12, H * 0.055, lw * 1.1, sk, sk, H * (B ? 0.105 : 0.09));
  // 몸통
  var body = e4Bl([[-bw * 1.02, shY + H * 0.06], [-bw * 0.62, shY - H * 0.035], [bw * 0.62, shY - H * 0.035], [bw * 1.02, shY + H * 0.06], [bw * 0.95 * wk, hipY], [0, hipY + H * 0.04], [-bw * 0.95 * wk, hipY]]);
  e4F(x, body, sk, { lw: 1.3, d: H * 0.035 });
  e4Clip(x, body, function () { x.fillStyle = rgba(enLit(sk, 0.4), 0.55); x.beginPath(); x.ellipse(bw * 0.2, (shY + hipY) / 2 + H * 0.03, bw * 0.55, (hipY - shY) * 0.34, 0, 0, Math.PI * 2); x.fill(); });
  e4Brush(x, [-bw * 0.5, shY + H * 0.1], [bw * 0.1, shY + H * 0.16], [bw * 0.7, shY + H * 0.09], H * 0.012, H * 0.004, e4INK, 0.6);
  // 호피 치마: 톱니 밑단, 붓 줄무늬
  var wy = hipY - H * 0.1, hy = hipY + H * (B ? 0.12 : 0.11), sw2 = bw * wk, sp = [[-sw2 * 1.0, wy], [sw2 * 1.0, wy], [sw2 * 1.2, hy - H * 0.03]], nt = 5;
  for (i = 0; i < nt; i++) { var u0 = sw2 * 1.2 - (i + 0.5) * sw2 * 2.4 / nt, u1 = sw2 * 1.2 - (i + 1) * sw2 * 2.4 / nt; sp.push([u0 + sw * H * 0.008, hy + H * 0.035]); sp.push([u1, hy - H * (i === nt - 1 ? 0.03 : 0.012)]); }
  var skirt = e4Po(sp);
  e4F(x, skirt, e4C.Y, { lw: 1.2, d: H * 0.03 });
  e4Stripes(x, skirt, [[-sw2 * 0.8, wy, -sw2 * 0.95, hy], [-sw2 * 0.35, wy, -sw2 * 0.45, hy - H * 0.01], [sw2 * 0.1, wy, sw2 * 0.05, hy], [sw2 * 0.52, wy, sw2 * 0.62, hy - H * 0.01], [sw2 * 0.95, wy, sw2 * 1.1, hy - H * 0.03]].map(function (q) { return [q[0], q[1], q[2], q[3], H * 0.04]; }));
  // 허리띠와 매듭
  e4F(x, shp().rrect(-sw2 * 1.03, wy - H * 0.03, sw2 * 2.06, H * 0.06, H * 0.02), o.belt, { lw: 0.9, d: H * 0.012 });
  enRib(x, -sw2 * 0.75, wy + H * 0.01, H * 0.17, H * 0.05, Math.PI * 0.62 + sw * 0.15, a * 2, o.belt);
  if (B) {
    // 대장: 단청 무늬 어깨 갑옷(청, 적, 금), 금 목걸이
    [[-1, 0.9], [1, 1]].forEach(function (q) {
      var sx = q[0] * bw * 0.86, sy = shY + H * 0.045, r = H * 0.1 * q[1], pad = e4Bl([[sx - r * 1.2, sy + r * 0.5], [sx - r * 0.9, sy - r * 0.7], [sx, sy - r * 1.0], [sx + r * 0.9, sy - r * 0.7], [sx + r * 1.2, sy + r * 0.5], [sx, sy + r * 0.85]]);
      e4F(x, pad, q[0] < 0 ? enShd(e4C.B, 0.15) : e4C.B, { lw: 1.1, d: r * 0.2 });
      e4Clip(x, pad, function () { x.fillStyle = e4C.R; x.beginPath(); x.ellipse(sx, sy + r * 0.75, r * 1.3, r * 0.5, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = e4C.GOLD; x.lineWidth = Math.max(1, r * 0.16); x.beginPath(); x.ellipse(sx, sy + r * 0.75, r * 1.3, r * 0.5, 0, 0, Math.PI * 2); x.stroke(); x.fillStyle = e4C.GOLD; x.beginPath(); x.arc(sx, sy - r * 0.3, r * 0.22, 0, Math.PI * 2); x.fill(); });
    });
  }
  for (i = 0; i < 5; i++) { var nu = (i - 2) / 2; e4Dot(x, cxh - H * 0.03 + nu * bw * 0.55, shY + H * (B ? 0.115 : 0.1) - nu * nu * H * 0.035, H * (B ? 0.022 : 0.02), B ? e4C.GOLD : (i % 2 ? e4C.R : '#f1e3bd'), 1); }
  // 머리: 뒤 갈기 → 수염 → 귀 → 얼굴 → 앞머리 → 뿔
  e4F(x, e4Mane(cxh - hr * 0.1, cyh, -1.0, -4.25, hr * 1.0, hr * (B ? 1.62 : 1.5), 6, a), hair, { lw: 1.3, d: hr * 0.16, lc: enLit(hair, 0.25) });
  e4F(x, e4Mane(cxh + hr * 0.15, cyh + hr * 0.45, 0.25, 2.75, hr * 0.7, hr * (B ? 1.45 : 1.08), B ? 5 : 4, a + 1), hair, { lw: 1.1, d: hr * 0.1 });
  e4F(x, e4Bl([[cxh - hr * 0.78, cyh - hr * 0.3], [cxh - hr * 1.5, cyh - hr * 0.55], [cxh - hr * 0.85, cyh + hr * 0.25]]), skD, { lw: 0.9, d: 0 });
  var head = e4Bl([[cxh - hr * 0.98, cyh - hr * 0.2], [cxh - hr * 0.62, cyh - hr * 0.95], [cxh + hr * 0.45, cyh - hr * 0.98], [cxh + hr * 1.0, cyh - hr * 0.3], [cxh + hr * 1.06, cyh + hr * 0.5], [cxh + hr * 0.5, cyh + hr * 0.98], [cxh - hr * 0.5, cyh + hr * 0.95], [cxh - hr * 1.02, cyh + hr * 0.45]]);
  e4F(x, head, sk, { lw: 1.3, d: hr * 0.2, rim: 0 });
  var cap = e4Po([[cxh - hr * 1.0, cyh - hr * 0.15], [cxh - hr * 0.86, cyh - hr * 0.82], [cxh - hr * 0.3, cyh - hr * 1.12], [cxh + hr * 0.5, cyh - hr * 1.08], [cxh + hr * 0.98, cyh - hr * 0.62], [cxh + hr * 1.0, cyh - hr * 0.38], [cxh + hr * 0.72, cyh - hr * 0.6], [cxh + hr * 0.5, cyh - hr * 0.4], [cxh + hr * 0.22, cyh - hr * 0.66], [cxh - hr * 0.02, cyh - hr * 0.42], [cxh - hr * 0.3, cyh - hr * 0.66], [cxh - hr * 0.55, cyh - hr * 0.36], [cxh - hr * 0.78, cyh - hr * 0.5]]);
  e4F(x, cap, hair, { lw: 1, d: hr * 0.1, hi: 0.3 });
  (o.horns === 2 ? [[-0.5, -0.35, 1.25], [0.52, 0.4, 1.1]] : [[0.08, 0.22, 1]]).forEach(function (q) {
    var bx = cxh + q[0] * hr, by = cyh - hr * 0.86, L = hr * (B ? 1.15 : 1.1) * q[2], tx = bx + q[1] * L * 0.7, ty = by - L;
    var hn = e4Bl([[bx - hr * 0.27, by + hr * 0.12], [bx - hr * 0.12 + q[1] * L * 0.25, by - L * 0.55], [tx, ty], [bx + hr * 0.2 + q[1] * L * 0.4, by - L * 0.45], [bx + hr * 0.3, by + hr * 0.1]]);
    e4F(x, hn, o.horn, { lw: 1, d: hr * 0.08, hi: 0.5 });
    e4Brush(x, [bx - hr * 0.2, by - L * 0.15], [bx, by - L * 0.22], [bx + hr * 0.24, by - L * 0.12], hr * 0.07, hr * 0.03, enShd(o.horn, 0.5), 0.8);
    e4Brush(x, [bx - hr * 0.1 + q[1] * L * 0.2, by - L * 0.45], [bx + q[1] * L * 0.25, by - L * 0.5], [bx + hr * 0.16 + q[1] * L * 0.3, by - L * 0.42], hr * 0.06, hr * 0.02, enShd(o.horn, 0.5), 0.8);
  });
  // 얼굴 (귀면와): 부리부리한 눈, 굵은 눈썹, 주먹코, 엄니 드러낸 큰 웃음
  if (!enMode) {
    var ey = cyh - hr * 0.1, e1 = cxh + hr * 0.02, e2 = cxh + hr * 0.64;
    e4Eye(x, e1, ey, hr * 0.27, hr * 0.29, { px: 0.3, py: 0.15, pr: 0.42 }); e4Eye(x, e2, ey, hr * 0.22, hr * 0.27, { px: 0.3, py: 0.15, pr: 0.42, sd: -1 });
    e4Brush(x, [e1 - hr * 0.42, ey - hr * 0.62], [e1 - hr * 0.05, ey - hr * 0.52], [e1 + hr * 0.3, ey - hr * 0.28], hr * 0.2, hr * 0.09, o.brow || e4INK);
    e4Brush(x, [e2 + hr * 0.34, ey - hr * 0.6], [e2 + hr * 0.05, ey - hr * 0.5], [e2 - hr * 0.22, ey - hr * 0.28], hr * 0.18, hr * 0.08, o.brow || e4INK);
    x.fillStyle = enShd(sk, 0.22); x.strokeStyle = e4INK; x.lineWidth = Math.max(0.8, hr * 0.06);
    x.beginPath(); x.ellipse(cxh + hr * 0.36, cyh + hr * 0.24, hr * 0.2, hr * 0.14, 0, 0, Math.PI * 2); x.fill(); x.stroke();
    var mo = new Path2D(), m0 = [cxh - hr * 0.45, cyh + hr * 0.42], m1 = [cxh + hr * 0.95, cyh + hr * 0.36];
    mo.moveTo(m0[0], m0[1]); mo.quadraticCurveTo(cxh + hr * 0.3, cyh + hr * 0.6, m1[0], m1[1]); mo.quadraticCurveTo(cxh + hr * 0.4, cyh + hr * 1.08, m0[0], m0[1]); mo.closePath();
    x.fillStyle = '#6e1d2c'; x.fill(mo);
    x.save(); x.clip(mo); x.fillStyle = '#fffaf0'; x.beginPath(); x.moveTo(m0[0], m0[1] - hr * 0.2); x.lineTo(m1[0], m1[1] - hr * 0.2); x.lineTo(m1[0], m1[1] + hr * 0.02); x.quadraticCurveTo(cxh + hr * 0.3, cyh + hr * 0.74, m0[0], m0[1] + hr * 0.04); x.closePath(); x.fill();
    x.strokeStyle = rgba(e4INK, 0.55); x.lineWidth = Math.max(0.6, hr * 0.035); for (i = 1; i < 5; i++) { x.beginPath(); x.moveTo(lerp(m0[0], m1[0], i / 5), cyh + hr * 0.3); x.lineTo(lerp(m0[0], m1[0], i / 5), cyh + hr * 0.75); x.stroke(); }
    x.restore();
    x.lineWidth = Math.max(0.9, hr * 0.07); x.strokeStyle = e4INK; x.stroke(mo);
    x.fillStyle = '#fffaf0'; x.lineWidth = Math.max(0.7, hr * 0.05);
    [[-0.2, 1], [0.66, 0.9]].forEach(function (q) { var fx = cxh + q[0] * hr, fy = cyh + hr * 0.78; x.beginPath(); x.moveTo(fx - hr * 0.11 * q[1], fy); x.lineTo(fx, fy - hr * 0.42 * q[1]); x.lineTo(fx + hr * 0.11 * q[1], fy - hr * 0.04); x.closePath(); x.fill(); x.stroke(); });
  }
  // 가까운 팔: 방망이를 앞으로 치켜듦 (걸음마다 까딱)
  var el = [bw * 1.2, shY + H * (B ? 0.24 : 0.2)], hb = [bw * (B ? 1.5 : 1.62), shY + H * (B ? 0.12 : 0.05) - sw * H * 0.012];
  e4Club(x, hb[0], hb[1], (B ? 0.5 : 0.3) + sw * 0.07, H * (B ? 0.6 : 0.62), H * (B ? 0.25 : 0.2), o.wood || e4C.WOOD, B);
  e4Pill(x, [bw * 0.8, shY + H * 0.08], el, lw, lw * 0.92, sk); e4Pill(x, el, hb, lw * 0.92, lw * 0.82, sk);
  if (B) e4Pill(x, [lerp(el[0], hb[0], 0.45), lerp(el[1], hb[1], 0.45)], [lerp(el[0], hb[0], 0.7), lerp(el[1], hb[1], 0.7)], lw * 0.95, lw * 0.9, e4C.GOLD, 0.8);
  e4Ov(x, hb[0], hb[1], lw * 0.6, lw * 0.56, sk, 0, { d: lw * 0.12 });
  x.restore();
}
// 도깨비: 뇌록빛 살갗, 덥수룩한 검은 갈기, 뿔 하나, 호피 치마에 붉은 띠, 나무 방망이를 어깨에 걸치고 건들건들
EN_DRAW.dokkaebi = { f: function (x, H, p) { e4Dok(x, H, p, { skin: e4C.G, hair: '#2e2840', horn: '#f4e3b4', horns: 1, belt: e4C.R }); } };

// 도깨비불: 푸른 불꽃 세 갈래, 장난기 있는 눈, 흘러가는 불씨
EN_DRAW.wisp = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, f = Math.sin(a), r = H * 0.21, cy = -H * 0.34 + f * H * 0.025, col = '#3c8cf2';
  EN_ONE = '#173070';
  enGlow(x, 0, cy - r * 0.4, H * 0.52, '#5ab4ff', 0.5);
  [[-1.75, 0.55, 0.44, 0], [-1.3, -1.25, 0.32, 2.2]].forEach(function (q) { var t = Math.sin(a + q[3]); e4F(x, enFlameS(q[0] * r + t * r * 0.12, cy + q[1] * r + r * 0.3, r * q[2] * 1.3, r * q[2] * 2.5, -0.55), '#6cbcff', { d: 0, hi: 0.5, lw: 0.8 }); });
  x.save(); x.translate(0, cy); x.rotate(-0.36 + f * 0.05);
  e4F(x, enFlameS(-r * 0.55, r * 0.9, r * 0.95, r * (2.05 + f * 0.22), -0.5), col, { d: 0, ln: 0 });
  e4F(x, enFlameS(r * 0.52, r * 0.95, r * 0.85, r * (1.75 - f * 0.22), 0.3), col, { d: 0, ln: 0 });
  e4F(x, enFlameS(0, r, r * 2.0, r * (3.05 + Math.cos(a) * 0.16), -0.2 + f * 0.1), col, { d: 0, ln: 0, hi: 0.3 });
  if (!enMode) {
    x.fillStyle = '#86d8ff'; x.fill(enFlameS(0, r * 0.9, r * 1.5, r * 2.15, -0.16 + f * 0.08).p);
    x.fillStyle = '#e6fbff'; x.fill(enFlameS(r * 0.02, r * 0.8, r * 1.02, r * 1.3, -0.1).p);
  }
  x.restore();
  if (!enMode) {
    var ex = r * 0.12, ey = cy + r * 0.02;
    e4Eye(x, ex - r * 0.3, ey, r * 0.22, r * 0.3, { w: '#ffffff', pc: '#12285c', pr: 0.62, px: 0.2, k: '#173070' }); e4Eye(x, ex + r * 0.34, ey, r * 0.19, r * 0.28, { w: '#ffffff', pc: '#12285c', pr: 0.62, px: 0.2, k: '#173070', sd: -1 });
    e4Brush(x, [ex - r * 0.62, ey - r * 0.52], [ex - r * 0.3, ey - r * 0.5], [ex - r * 0.08, ey - r * 0.32], r * 0.13, r * 0.05, '#173070');
    e4Brush(x, [ex + r * 0.62, ey - r * 0.5], [ex + r * 0.36, ey - r * 0.48], [ex + r * 0.16, ey - r * 0.32], r * 0.12, r * 0.05, '#173070');
    x.strokeStyle = '#173070'; x.lineWidth = Math.max(0.9, r * 0.09); x.lineCap = 'round'; x.beginPath(); x.moveTo(ex - r * 0.2, ey + r * 0.42); x.quadraticCurveTo(ex + r * 0.05, ey + r * 0.62, ex + r * 0.3, ey + r * 0.4); x.stroke();
  }
} };

// 달걀귀신: 이목구비 없는 매끈한 달걀 얼굴이 한쪽으로 기울고, 등 뒤로 허리까지 늘어진 검은 머리채, 쪽빛 고름, 축 늘어진 긴 소매, 발 없이 떠서 뒤로 흐르는 소복 자락
EN_DRAW.egg = { f: function (x, H, p) {
  var a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), W = '#f4f1ea', ind = '#3a5fa8', hair = '#241f2e', sw = s * H * 0.02, oy = -H * 0.075 + s * H * 0.018;
  EN_ONE = '#3b3558';
  x.save(); x.translate(0, oy); x.rotate(0.04 + c * 0.02);
  // 등 뒤로 허리까지 늘어진 검은 머리채 (끝이 갈라져 흔들림)
  e4F(x, e4Bl([[-H * 0.0, -H * 0.82], [-H * 0.19, -H * 0.8], [-H * 0.28, -H * 0.58], [-H * 0.31 - sw, -H * 0.34], [-H * 0.29 - sw * 1.5, -H * 0.17], [-H * 0.22 - sw, -H * 0.31], [-H * 0.19 - sw * 1.3, -H * 0.2], [-H * 0.12, -H * 0.4], [-H * 0.04, -H * 0.6]]), hair, { d: H * 0.02, lw: 1.2, hi: 0.3, lc: '#5a5478' });
  // 소복 치마: 아래로 갈수록 뒤로 흘러 가늘어짐 (발 없음)
  var sk = e4Bl([[-H * 0.15, -H * 0.5], [H * 0.16, -H * 0.5], [H * 0.23, -H * 0.3], [H * 0.21, -H * 0.11], [H * 0.09, -H * 0.005 + sw * 0.5], [-H * 0.1, H * 0.0 - sw * 0.5], [-H * 0.29 - sw, -H * 0.04 + c * H * 0.015], [-H * 0.43, -H * 0.13 + c * H * 0.02], [-H * 0.26, -H * 0.13], [-H * 0.19, -H * 0.3]]);
  e4F(x, sk, W, { d: H * 0.05, sk: 0.3, lw: 1.3 });
  e4Clip(x, sk, function () { x.strokeStyle = 'rgba(70,70,120,0.28)'; x.lineWidth = Math.max(0.8, H * 0.012); [[-0.06, -0.3], [0.04, -0.12], [0.13, 0.0]].forEach(function (q) { x.beginPath(); x.moveTo(q[0] * H, -H * 0.46); x.quadraticCurveTo(q[0] * H + H * 0.03, -H * 0.2, q[1] * H, -H * 0.04); x.stroke(); }); x.fillStyle = 'rgba(150,170,235,0.35)'; x.beginPath(); x.ellipse(-H * 0.34, -H * 0.08, H * 0.15, H * 0.09, 0, 0, Math.PI * 2); x.fill(); });
  // 먼 소매 (축 늘어짐)
  e4F(x, e4Bl([[-H * 0.13, -H * 0.57], [-H * 0.21, -H * 0.4], [-H * 0.22 - sw, -H * 0.17], [-H * 0.12 - sw, -H * 0.19], [-H * 0.06, -H * 0.42]]), enShd(W, 0.16), { d: H * 0.02, sk: 0.3, lw: 1.1 });
  var top = e4Bl([[-H * 0.185, -H * 0.57], [0, -H * 0.64], [H * 0.18, -H * 0.57], [H * 0.2, -H * 0.4], [0, -H * 0.36], [-H * 0.2, -H * 0.4]]);
  e4F(x, top, W, { d: H * 0.025, sk: 0.3, lw: 1.2 });
  // 쪽빛 고름
  enRib(x, -H * 0.03, -H * 0.48, H * 0.25, H * 0.045, Math.PI * 0.5 + 0.15 - s * 0.12, a * 2, ind);
  e4Ov(x, -H * 0.03, -H * 0.485, H * 0.036, H * 0.03, ind, 0, { d: 0, lw: 0.8 });
  // 가까운 소매: 손끝 없이 길게 늘어져 흔들림
  e4F(x, e4Bl([[H * 0.03, -H * 0.58], [H * 0.17, -H * 0.56], [H * 0.25, -H * 0.38], [H * 0.24 + sw, -H * 0.13], [H * 0.11 + sw, -H * 0.11], [H * 0.09, -H * 0.33], [H * 0.01, -H * 0.45]]), W, { d: H * 0.03, sk: 0.34, lw: 1.2 });
  // 기운 목과 달걀 머리 (뒤통수에만 검은 머리)
  x.save(); x.translate(H * 0.02, -H * 0.6); x.rotate(0.3 + s * 0.05);
  var cy = -H * 0.18, head = e4Bl([[-H * 0.155, cy + H * 0.05], [-H * 0.13, cy - H * 0.17], [0, cy - H * 0.24], [H * 0.135, cy - H * 0.17], [H * 0.165, cy + H * 0.05], [H * 0.1, cy + H * 0.18], [-H * 0.09, cy + H * 0.18]]);
  e4F(x, head, '#fdfbf2', { d: H * 0.04, sk: 0.26, sa: 0.55, hi: 0.5, lw: 1.3 });
  e4F(x, e4Bl([[-H * 0.17, cy + H * 0.0], [-H * 0.155, cy - H * 0.15], [-H * 0.05, cy - H * 0.265], [H * 0.03, cy - H * 0.25], [-H * 0.06, cy - H * 0.19], [-H * 0.115, cy - H * 0.08], [-H * 0.13, cy + H * 0.04]]), hair, { d: 0, lw: 1.1, hi: 0.3, lc: '#5a5478' });
  if (!enMode) {
    x.fillStyle = 'rgba(96,90,150,0.14)'; x.beginPath(); x.ellipse(H * 0.0, cy + H * 0.0, H * 0.035, H * 0.024, 0, 0, Math.PI * 2); x.ellipse(H * 0.095, cy, H * 0.03, H * 0.022, 0, 0, Math.PI * 2); x.fill();
    enGloss(x, H * 0.03, cy - H * 0.15, H * 0.035, H * 0.018, -0.4, 0.85);
  }
  x.restore();
  x.restore();
} };

// 처녀귀신: 여러 갈래로 흩날리는 검은 머리카락, 크게 드러난 창백한 얼굴, 꼬리처럼 흐르는 흰 소복, 앞으로 뻗어 축 늘어뜨린 두 손, 보랏빛 짧은 고름(붉은색은 핏자국처럼 보여 뺌). 둥실
EN_DRAW.maiden = { f: function (x, H, p) {
  var a = p * Math.PI * 2, f = Math.sin(a), g = Math.cos(a), W = '#f1f0f4', hair = '#26202f', skin = '#eef1f7', oy = -H * 0.08 + f * H * 0.03, i;
  EN_ONE = '#2a2440';
  enGlow(x, -H * 0.02, -H * 0.45 + oy, H * 0.55, '#7fb6ff', 0.22);
  x.save(); x.translate(0, oy); x.rotate(0.03 + g * 0.02);
  var hx = H * 0.1, hy = -H * 0.72;
  // 뒤로 흩날리는 머리카락 다섯 갈래 (가닥 사이가 떠 보이게)
  for (i = 0; i < 5; i++) { var j = [0, 4, 1, 3, 2][i]; e4Tail(x, hx - H * 0.07, hy - H * 0.06 + j * H * 0.035, Math.PI + 0.75 - j * 0.36 + Math.sin(a + j * 1.2) * 0.1, H * (0.3 + 0.045 * j), H * 0.045, hair, 0, (j % 2 ? 0.3 : -0.3), { d: H * 0.008, lw: 1, hi: 0.32, lc: '#5a5478' }); }
  // 소복
  var rb = e4Bl([[H * 0.0, -H * 0.6], [H * 0.22, -H * 0.57], [H * 0.26, -H * 0.38], [H * 0.23, -H * 0.18], [H * 0.09, -H * 0.045 + f * H * 0.015], [-H * 0.13, H * 0.0 - g * H * 0.015], [-H * 0.35 - f * H * 0.02, -H * 0.045 + g * H * 0.02], [-H * 0.5, -H * 0.15 + g * H * 0.025], [-H * 0.28, -H * 0.14], [-H * 0.13, -H * 0.26], [-H * 0.1, -H * 0.44]]);
  e4F(x, rb, W, { d: H * 0.045, sk: 0.34, lw: 1.3 });
  e4Clip(x, rb, function () { x.strokeStyle = 'rgba(80,80,140,0.3)'; x.lineWidth = Math.max(0.8, H * 0.012); x.beginPath(); x.moveTo(H * 0.06, -H * 0.4); x.quadraticCurveTo(0, -H * 0.2, -H * 0.3, -H * 0.08); x.moveTo(H * 0.16, -H * 0.36); x.quadraticCurveTo(H * 0.1, -H * 0.16, -H * 0.1, -H * 0.06); x.stroke(); x.fillStyle = 'rgba(150,180,255,0.35)'; x.beginPath(); x.ellipse(-H * 0.38, -H * 0.1, H * 0.16, H * 0.1, 0, 0, Math.PI * 2); x.fill(); });
  enRib(x, H * 0.13, -H * 0.5, H * 0.13, H * 0.036, Math.PI * 0.7 + f * 0.15, a * 2, '#8a5fd0');
  enRib(x, H * 0.13, -H * 0.5, H * 0.1, H * 0.034, Math.PI * 0.45 + g * 0.12, a * 2 + 1, '#7350b8');
  e4Ov(x, H * 0.135, -H * 0.5, H * 0.03, H * 0.026, '#8a5fd0', 0, { d: 0, lw: 0.8 });
  // 앞으로 뻗은 소매와 늘어뜨린 손 (먼 쪽, 가까운 쪽)
  [[0.035, -0.04, 0.88, 1], [0, 0, 1, 0]].forEach(function (q) {
    var sx = H * (0.14 + q[0]), sy = H * (-0.54 + q[1]), k = q[2], wx = sx + H * 0.33 * k, wy = sy - H * 0.01 + f * H * 0.012;
    e4F(x, e4Bl([[wx - H * 0.012, wy + H * 0.01], [wx + H * 0.04, wy + H * 0.06], [wx + H * 0.025, wy + H * 0.15 + g * H * 0.01], [wx - H * 0.02, wy + H * 0.08]]), q[3] ? enShd(skin, 0.18) : skin, { d: 0, lw: 0.8 });
    e4F(x, e4Bl([[sx - H * 0.05, sy - H * 0.045], [wx, wy - H * 0.04], [wx + H * 0.03, wy + H * 0.03], [wx - H * 0.05, wy + H * 0.15 + f * H * 0.015], [sx + H * 0.02, sy + H * 0.13], [sx - H * 0.06, sy + H * 0.06]]), q[3] ? enShd(W, 0.16) : W, { d: H * 0.025, sk: 0.34, lw: 1.1 });
  });
  // 얼굴: 크게, 눈 밑 그늘과 작은 입
  var head = e4Bl([[hx - H * 0.155, hy - H * 0.02], [hx - H * 0.11, hy - H * 0.175], [hx + H * 0.1, hy - H * 0.175], [hx + H * 0.165, hy - H * 0.01], [hx + H * 0.11, hy + H * 0.14], [hx + H * 0.02, hy + H * 0.19], [hx - H * 0.1, hy + H * 0.13]]);
  e4F(x, head, skin, { d: H * 0.03, sk: 0.3, lw: 1.2 });
  if (!enMode) {
    var ey = hy + H * 0.01, e1 = hx - H * 0.035, e2 = hx + H * 0.085;
    x.fillStyle = 'rgba(90,70,140,0.36)'; x.beginPath(); x.ellipse(e1, ey + H * 0.006, H * 0.05, H * 0.045, 0, 0, Math.PI * 2); x.ellipse(e2, ey + H * 0.006, H * 0.046, H * 0.043, 0, 0, Math.PI * 2); x.fill();
    e4Eye(x, e1, ey, H * 0.036, H * 0.028, { w: '#ffffff', pc: '#2a2440', pr: 0.62, px: 0.2 }); e4Eye(x, e2, ey, H * 0.032, H * 0.027, { w: '#ffffff', pc: '#2a2440', pr: 0.62, px: 0.2, sd: -1 });
    x.fillStyle = '#7a3a5a'; x.beginPath(); x.ellipse(hx + H * 0.04, hy + H * 0.115, H * 0.022, H * 0.012, 0, 0, Math.PI * 2); x.fill();
  }
  // 가르마 탄 앞머리와 얼굴 옆으로 흘러내린 가는 가닥 둘
  e4F(x, e4Bl([[hx - H * 0.17, hy + H * 0.0], [hx - H * 0.13, hy - H * 0.18], [hx + H * 0.0, hy - H * 0.235], [hx + H * 0.13, hy - H * 0.18], [hx + H * 0.18, hy - H * 0.01], [hx + H * 0.12, hy - H * 0.09], [hx + H * 0.02, hy - H * 0.13], [hx - H * 0.07, hy - H * 0.07], [hx - H * 0.12, hy + H * 0.05]]), hair, { d: H * 0.015, lw: 1.1, hi: 0.32, lc: '#5a5478' });
  e4Tail(x, hx - H * 0.125, hy - H * 0.0, Math.PI * 0.5 + 0.12 + f * 0.06, H * 0.36, H * 0.032, hair, 0, 0.2, { d: 0, lw: 0.9, hi: 0.32 });
  e4Tail(x, hx + H * 0.155, hy - H * 0.03, Math.PI * 0.5 - 0.05 + g * 0.06, H * 0.2, H * 0.026, hair, 0, -0.2, { d: 0, lw: 0.9, hi: 0.32 });
  x.restore();
} };

// 구미호: 낮고 유연한 흰 여우. 뾰족한 주둥이와 큰 삼각 귀, 치켜 올라간 붉은 눈매, 몸보다 큰 아홉 꼬리 부채(끝은 주홍, 여우불 셋). 가볍게 달림
// 여우 머리 (구미호와 천년 구미호가 같이 씀): 볼털, 뾰족한 주둥이, 큰 삼각 귀, 치켜 올라간 눈매
function e4FoxHead(x, hx, hy, hr, o, a) {
  var W = o.col, sh = enShd(W, 0.2);
  [[0.34, 0.88, 1], [-0.4, 1, 0]].forEach(function (q) {
    var ex = hx + q[0] * hr, ey = hy - hr * 0.5, k = q[1], ear = e4Po([[ex - hr * 0.46 * k, ey + hr * 0.25], [ex - hr * 0.16, ey - hr * 1.55 * k], [ex + hr * 0.52 * k, ey + hr * 0.2]]);
    e4F(x, ear, q[2] ? sh : W, { d: 0, lw: 1.1 });
    if (!enMode) { x.fillStyle = o.ear; x.beginPath(); x.moveTo(ex - hr * 0.22 * k, ey + hr * 0.15); x.lineTo(ex - hr * 0.13, ey - hr * 1.05 * k); x.lineTo(ex + hr * 0.28 * k, ey + hr * 0.12); x.closePath(); x.fill(); }
  });
  e4F(x, e4Mane(hx - hr * 0.35, hy + hr * 0.3, 1.1, 3.5, hr * 0.5, hr * 1.12, 3, a), W, { d: 0, lw: 1 });
  var head = e4Bl([[hx - hr * 0.95, hy - hr * 0.05], [hx - hr * 0.62, hy - hr * 0.74], [hx + hr * 0.12, hy - hr * 0.86], [hx + hr * 0.78, hy - hr * 0.42], [hx + hr * 1.5, hy + hr * 0.1], [hx + hr * 2.05, hy + hr * 0.42], [hx + hr * 1.5, hy + hr * 0.68], [hx + hr * 0.6, hy + hr * 0.82], [hx - hr * 0.3, hy + hr * 0.92], [hx - hr * 0.95, hy + hr * 0.55]]);
  e4F(x, head, W, { d: hr * 0.18, sk: 0.28, lw: 1.3 });
  if (enMode) return;
  var ex2 = hx + hr * 0.4, ey2 = hy - hr * 0.1, O = [ex2 - hr * 0.46, ey2 - hr * 0.24], I = [ex2 + hr * 0.44, ey2 + hr * 0.14];
  x.fillStyle = o.eye; x.strokeStyle = o.ink; x.lineWidth = Math.max(0.8, hr * 0.07);
  x.beginPath(); x.moveTo(O[0], O[1]); x.quadraticCurveTo(ex2 + hr * 0.12, ey2 - hr * 0.42, I[0], I[1]); x.quadraticCurveTo(ex2 - hr * 0.1, ey2 + hr * 0.2, O[0], O[1]); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = o.ink; x.beginPath(); x.ellipse(ex2 + hr * 0.02, ey2 - hr * 0.07, hr * 0.06, hr * 0.17, -0.35, 0, Math.PI * 2); x.fill();
  e4Brush(x, I, [ex2 + hr * 0.1, ey2 - hr * 0.5], [O[0] - hr * 0.5, O[1] - hr * 0.42], hr * 0.07, hr * 0.17, o.mark);
  x.fillStyle = o.mark; x.beginPath(); x.moveTo(hx + hr * 0.2, hy - hr * 0.78); x.quadraticCurveTo(hx + hr * 0.42, hy - hr * 0.55, hx + hr * 0.3, hy - hr * 0.38); x.quadraticCurveTo(hx + hr * 0.08, hy - hr * 0.55, hx + hr * 0.2, hy - hr * 0.78); x.fill();
  e4Brush(x, [hx - hr * 0.55, hy + hr * 0.25], [hx - hr * 0.3, hy + hr * 0.3], [hx - hr * 0.05, hy + hr * 0.26], hr * 0.1, hr * 0.03, o.mark, 0.9);
  e4Brush(x, [hx - hr * 0.5, hy + hr * 0.5], [hx - hr * 0.28, hy + hr * 0.52], [hx - hr * 0.08, hy + hr * 0.46], hr * 0.09, hr * 0.03, o.mark, 0.9);
  x.fillStyle = o.ink; x.beginPath(); x.ellipse(hx + hr * 1.98, hy + hr * 0.4, hr * 0.14, hr * 0.12, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = o.ink; x.lineWidth = Math.max(0.8, hr * 0.07); x.lineCap = 'round'; x.beginPath(); x.moveTo(hx + hr * 1.9, hy + hr * 0.56); x.quadraticCurveTo(hx + hr * 1.3, hy + hr * 0.74, hx + hr * 0.85, hy + hr * 0.5); x.stroke();
  enEyeRec(x, ex2, ey2, hr * 0.34, hr * 0.24, -1);
}
// 아홉 꼬리 부채: 바깥 꼬리부터 그려 가운데가 맨 앞. 꼬리 끝 자리들을 돌려줌
function e4FoxTails(x, bx, by, TL, a0, a1, a, o, wk) {
  var tips = [], n = 9, i, sh = enShd(o.col, 0.2);
  for (i = 0; i < n; i++) {
    var j = [0, 8, 1, 7, 2, 6, 3, 5, 4][i], u = j / (n - 1), an = lerp(a0, a1, u) + Math.sin(a + j * 0.7) * 0.06, k = 0.8 + 0.2 * Math.sin(u * Math.PI);
    tips[j] = e4Tail(x, bx, by, an, TL * k, TL * wk * k, i < 4 ? sh : o.col, o.tip, (u - 0.5) * 0.45, { d: TL * 0.045, lw: 1.1, sk: 0.34 });
  }
  return tips;
}
EN_DRAW.gumiho = { f: function (x, H, p) {
  var a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), o = { col: '#fbf7ee', ink: '#3a2c3a', tip: e4C.R, ear: '#f08a84', eye: '#ffd24a', mark: e4C.R }, W = o.col, sh = enShd(W, 0.2), L = H * 0.15, by = -(L + H * 0.03), th = s * 0.8, ar = s * H * 0.015;
  EN_ONE = o.ink;
  x.save(); x.translate(0, -Math.abs(s) * H * 0.03); x.rotate(c * 0.06);
  var tips = e4FoxTails(x, -H * 0.2, by - H * 0.1, H * 0.62, -0.5, -2.95, a, o, 0.21);
  e4Paw(x, H * 0.13, by, L, th - 0.3, H * 0.055, sh); e4Paw(x, -H * 0.16, by, L, -th - 0.3, H * 0.06, sh, { hind: 1 });
  // 낮고 유연한 몸: 등은 걸음에 따라 굽었다 펴짐, 허리는 잘록
  var body = e4Bl([[-H * 0.28, by - H * 0.08], [-H * 0.13, by - H * 0.19 - ar], [H * 0.1, by - H * 0.17 - ar], [H * 0.25, by - H * 0.09], [H * 0.21, by + H * 0.03], [H * 0.03, by + H * 0.015], [-H * 0.13, by + H * 0.045], [-H * 0.28, by + H * 0.02]]);
  e4F(x, body, W, { d: H * 0.03, sk: 0.3, lw: 1.3 });
  e4Ov(x, -H * 0.17, by - H * 0.02, H * 0.1, H * 0.085, W, -0.3, { d: H * 0.02, sk: 0.3, lw: 0.9, lc: mixc(W, o.ink, 0.4) });
  e4Paw(x, H * 0.15, by + H * 0.01, L, th + 0.2, H * 0.06, W); e4Paw(x, -H * 0.18, by + H * 0.01, L, -th + 0.2, H * 0.065, W, { hind: 1 });
  // 목과 가슴털
  var hx = H * 0.3, hy = by - H * 0.2, hr = H * 0.135;
  e4F(x, e4Bl([[H * 0.08, by - H * 0.15], [hx - hr * 0.6, hy - hr * 0.2], [hx + hr * 0.2, hy + hr * 0.7], [H * 0.25, by], [H * 0.12, by + H * 0.02]]), W, { d: H * 0.02, ln: 0 });
  e4F(x, e4Mane(H * 0.2, by - H * 0.04, 0.3, 2.1, H * 0.05, H * 0.115, 3, a), W, { d: 0, lw: 0.9 });
  e4FoxHead(x, hx, hy, hr, o, a);
  [1, 4, 7].forEach(function (j, n) { e4Fire(x, tips[j][0], tips[j][1] + H * 0.015, H * (0.085 + 0.012 * Math.sin(a + n * 2)), -0.35, e4C.FIRE, n === 1 ? 0.4 : 0); });
  x.restore();
} };

// 갓 (옆에서 본 모습): 넓은 양태 + 대우 + 구슬 갓끈
function e4Gat(x, cx, cy, w, tilt, col) {
  x.save(); x.translate(cx, cy); x.rotate(tilt || 0);
  e4F(x, e4Po([[-w * 0.26, 0], [-w * 0.21, -w * 0.5], [w * 0.21, -w * 0.5], [w * 0.26, 0]]), col, { d: w * 0.05, lw: 1.1, hi: 0.35 });
  var brim = enEl(0, 0, w, w * 0.17);
  e4F(x, brim, col, { d: w * 0.03, lw: 1.2, hi: 0.4, gy: 0.1 });
  if (!enMode) { x.strokeStyle = 'rgba(205,210,245,0.75)'; x.lineWidth = Math.max(0.8, w * 0.03); x.beginPath(); x.ellipse(0, 0, w * 0.9, w * 0.13, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); x.beginPath(); x.ellipse(0, -w * 0.01, w * 0.3, w * 0.06, 0, 0, Math.PI); x.stroke(); }
  x.restore();
}
// 저승사자: 검은 도포와 큰 갓, 창백한 얼굴, 푸른 불이 든 초롱을 들고 소리 없이 걸음
EN_DRAW.saja = { f: function (x, H, p) {
  var a = p * Math.PI * 2, sw = Math.sin(a), bob = Math.abs(Math.cos(a)), K = '#332d48', K2 = '#453e60', pale = '#e2e9f2', j;
  EN_ONE = '#15111f';
  x.save(); x.translate(0, -bob * H * 0.01); x.rotate(0.035);
  [[-1, a + Math.PI], [1, a]].forEach(function (q) { e4Ov(x, q[0] * H * 0.05 + Math.sin(q[1]) * H * 0.07 + H * 0.03, -H * 0.03 - Math.max(0, Math.cos(q[1])) * H * 0.018, H * 0.07, H * 0.032, '#14101c', 0, { d: 0 }); });
  // 도포 자락
  var hem = -H * 0.045, rb = shp(), P = rb.p, hw = H * 0.235, n = 4;
  P.moveTo(-H * 0.15, -H * 0.62); P.quadraticCurveTo(-H * 0.19, -H * 0.3, -hw, hem);
  for (j = 0; j < n; j++) { var x0 = -hw + j * hw * 2 / n, x1 = x0 + hw * 2 / n; P.quadraticCurveTo((x0 + x1) / 2, hem + H * 0.045 + Math.sin(a + j * 1.6) * H * 0.014, x1, hem); }
  P.quadraticCurveTo(H * 0.2, -H * 0.3, H * 0.15, -H * 0.62); P.closePath(); rb.ext(-hw, -H * 0.62); rb.ext(hw, hem + H * 0.06);
  e4F(x, rb, K, { d: H * 0.05, lw: 1.4, hi: 0.36, sk: 0.5, lc: '#7d77a8', rim: 1, ra: 0.3 });
  e4Clip(x, rb, function () {
    x.strokeStyle = 'rgba(150,150,205,0.4)'; x.lineWidth = Math.max(0.8, H * 0.012); [-0.45, 0.3].forEach(function (u) { x.beginPath(); x.moveTo(u * H * 0.16, -H * 0.4); x.quadraticCurveTo(u * H * 0.3, -H * 0.2, u * H * 0.42 + sw * H * 0.01, hem + H * 0.03); x.stroke(); });
    x.fillStyle = pale; x.beginPath(); x.moveTo(-H * 0.03, -H * 0.62); x.lineTo(H * 0.075, -H * 0.47); x.lineTo(H * 0.1, -H * 0.5); x.lineTo(H * 0.05, -H * 0.62); x.closePath(); x.fill(); x.beginPath(); x.moveTo(H * 0.14, -H * 0.62); x.lineTo(H * 0.075, -H * 0.47); x.lineTo(H * 0.055, -H * 0.5); x.lineTo(H * 0.09, -H * 0.62); x.closePath(); x.fill();
  });
  // 허리 끈(세조대)과 술
  e4Line(x, [[-H * 0.16, -H * 0.4], [0, -H * 0.375], [H * 0.17, -H * 0.4]], Math.max(1, H * 0.02), '#9fc4ee');
  e4Line(x, [[H * 0.0, -H * 0.38], [-H * 0.02 - sw * H * 0.012, -H * 0.3], [-H * 0.01 - sw * H * 0.02, -H * 0.22]], Math.max(1, H * 0.018), '#9fc4ee');
  // 먼 소매
  e4F(x, e4Bl([[-H * 0.14, -H * 0.58], [-H * 0.2, -H * 0.4], [-H * 0.22 - sw * H * 0.015, -H * 0.24], [-H * 0.1, -H * 0.28], [-H * 0.06, -H * 0.5]]), K2, { d: H * 0.025, lw: 1.1, lc: '#6a6490' });
  // 초롱: 막대 끝에 매달려 흔들림
  var hd = [H * 0.27, -H * 0.43], tp = [H * 0.43, -H * 0.52], lx = tp[0] - sw * H * 0.02, ly = tp[1] + H * 0.1;
  e4Line(x, [hd, tp], Math.max(1.2, H * 0.022), '#7a5a3c');
  e4Line(x, [tp, [lx, ly - H * 0.045]], Math.max(0.9, H * 0.012), '#3a3550');
  enGlow(x, lx, ly + H * 0.02, H * 0.26, '#6fc4ff', 0.6);
  var lan = e4Bl([[lx - H * 0.055, ly - H * 0.03], [lx + H * 0.055, ly - H * 0.03], [lx + H * 0.07, ly + H * 0.03], [lx + H * 0.045, ly + H * 0.085], [lx - H * 0.045, ly + H * 0.085], [lx - H * 0.07, ly + H * 0.03]]);
  e4F(x, lan, '#dff2ff', { d: H * 0.012, lw: 1, hi: 0.5, sk: 0.2 });
  e4Clip(x, lan, function () { x.fillStyle = '#4aa8ff'; x.fill(enFlameS(lx, ly + H * 0.07, H * 0.05, H * 0.085, sw * 0.2).p); x.fillStyle = '#ffffff'; x.fill(enFlameS(lx, ly + H * 0.065, H * 0.025, H * 0.045, 0).p); x.strokeStyle = 'rgba(40,50,90,0.5)'; x.lineWidth = Math.max(0.6, H * 0.008); [-0.03, 0.03].forEach(function (u) { x.beginPath(); x.moveTo(lx + u * H, ly - H * 0.04); x.lineTo(lx + u * H * 1.2, ly + H * 0.09); x.stroke(); }); });
  e4F(x, shp().rrect(lx - H * 0.045, ly - H * 0.052, H * 0.09, H * 0.028, H * 0.008), K, { d: 0, lw: 0.8 }); e4F(x, shp().rrect(lx - H * 0.035, ly + H * 0.078, H * 0.07, H * 0.024, H * 0.008), K, { d: 0, lw: 0.8 });
  e4Line(x, [[lx, ly + H * 0.1], [lx + sw * H * 0.01, ly + H * 0.16]], Math.max(1, H * 0.016), e4C.R);
  // 머리, 얼굴
  var hx = H * 0.055, hy = -H * 0.725, head = e4Bl([[hx - H * 0.1, hy - H * 0.02], [hx - H * 0.08, hy - H * 0.13], [hx + H * 0.08, hy - H * 0.13], [hx + H * 0.11, hy], [hx + H * 0.075, hy + H * 0.12], [hx + H * 0.01, hy + H * 0.155], [hx - H * 0.07, hy + H * 0.1]]);
  e4F(x, e4Bl([[hx - H * 0.11, hy - H * 0.1], [hx - H * 0.13, hy + H * 0.06], [hx - H * 0.06, hy + H * 0.1], [hx, hy - H * 0.1]]), '#1b1626', { d: 0, lw: 0.9 });
  e4F(x, head, pale, { d: H * 0.025, sk: 0.34, lw: 1.2 });
  if (!enMode) {
    var ey = hy + H * 0.005, e1 = hx + H * 0.005, e2 = hx + H * 0.07;
    x.fillStyle = 'rgba(40,36,80,0.5)'; x.beginPath(); x.ellipse((e1 + e2) / 2, hy - H * 0.06, H * 0.13, H * 0.06, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(60,50,110,0.45)'; x.beginPath(); x.ellipse(e1, ey, H * 0.032, H * 0.024, 0, 0, Math.PI * 2); x.ellipse(e2, ey, H * 0.028, H * 0.022, 0, 0, Math.PI * 2); x.fill();
    e4Brush(x, [e1 - H * 0.03, ey - H * 0.012], [e1, ey - H * 0.002], [e1 + H * 0.028, ey + H * 0.006], H * 0.02, H * 0.008, '#15111f'); e4Brush(x, [e2 + H * 0.03, ey - H * 0.012], [e2, ey - H * 0.002], [e2 - H * 0.022, ey + H * 0.006], H * 0.018, H * 0.008, '#15111f');
    x.fillStyle = '#8fd8ff'; x.beginPath(); x.arc(e1 + H * 0.006, ey, Math.max(0.6, H * 0.007), 0, Math.PI * 2); x.arc(e2 + H * 0.004, ey, Math.max(0.6, H * 0.006), 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#4a3a5a'; x.lineCap = 'round'; x.lineWidth = Math.max(0.8, H * 0.012); x.beginPath(); x.moveTo(hx + H * 0.015, hy + H * 0.09); x.quadraticCurveTo(hx + H * 0.045, hy + H * 0.078, hx + H * 0.075, hy + H * 0.092); x.stroke();
    enEyeRec(x, e1, ey, H * 0.03, H * 0.025, 1); enEyeRec(x, e2, ey, H * 0.026, H * 0.024, -1);
  }
  // 갓끈 (구슬)
  for (j = 0; j < 4; j++) e4Dot(x, hx - H * 0.085 + j * H * 0.012, hy + H * 0.02 + j * H * 0.045 + (j === 3 ? 0 : 0), Math.max(0.7, H * 0.013), j % 2 ? '#e8b84a' : '#f4f0e6', 0);
  e4Gat(x, hx - H * 0.005, hy - H * 0.085, H * 0.31, -0.06 + sw * 0.012, '#2c2640');
  // 가까운 소매: 초롱 막대를 쥔 손
  e4F(x, e4Bl([[-H * 0.02, -H * 0.6], [H * 0.14, -H * 0.58], [H * 0.3, -H * 0.47], [H * 0.31, -H * 0.38], [H * 0.2, -H * 0.24 + sw * H * 0.008], [H * 0.06, -H * 0.3], [-H * 0.04, -H * 0.44]]), K, { d: H * 0.035, lw: 1.3, hi: 0.36, sk: 0.5, lc: '#7d77a8', rim: 1, ra: 0.3 });
  e4Ov(x, hd[0] + H * 0.01, hd[1], H * 0.035, H * 0.032, pale, 0, { d: 0, lw: 0.8 });
  x.restore();
} };

// 불가사리: 쇠를 먹는 민화 속 괴수. 곰 몸에 코끼리 코, 쇳빛 비늘과 등 가시, 달아오른 입속. 육중한 걸음
EN_DRAW.bulgasari = { f: function (x, H, p) {
  var a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), col = '#5d6f8a', lt = '#a9b6c8', dk = enShd(col, 0.32), L = H * 0.22, by = -(L + H * 0.04), i;
  EN_ONE = '#1b1d2c';
  x.save(); x.translate(0, -Math.abs(c) * H * 0.012); x.rotate(s * 0.012);
  // 꼬리 (소꼬리)
  e4Line(x, [[-H * 0.4, by - H * 0.12], [-H * 0.52, by - H * 0.16 + s * H * 0.02], [-H * 0.55, by - H * 0.02 + s * H * 0.03]], Math.max(1.5, H * 0.035), col);
  e4F(x, e4Mane(-H * 0.55, by - H * 0.03 + s * H * 0.03, 0.6, 2.6, H * 0.03, H * 0.09, 3, a), '#2c3146', { d: 0, lw: 0.8 });
  e4Paw(x, H * 0.2, by, L, s * 0.38 - 0.1, H * 0.15, dk, { bend: 0.06, paw: dk }); e4Paw(x, -H * 0.24, by, L, -s * 0.38 - 0.1, H * 0.16, dk, { hind: 1, bend: 0.06, paw: dk });
  // 등 가시 (몸 뒤)
  for (i = 0; i < 6; i++) { var u = i / 5, sx = lerp(-H * 0.36, H * 0.16, u), sy = by - H * (0.26 + 0.1 * Math.sin(u * Math.PI)); e4F(x, e4Po([[sx - H * 0.055, sy + H * 0.05], [sx - H * 0.035, sy - H * 0.075], [sx + H * 0.055, sy + H * 0.04]]), lt, { d: 0, lw: 1, hi: 0.5 }); if (!enMode) { x.fillStyle = '#ff9a3a'; x.beginPath(); x.moveTo(sx - H * 0.047, sy - H * 0.02); x.lineTo(sx - H * 0.035, sy - H * 0.075); x.lineTo(sx - H * 0.005, sy - H * 0.03); x.closePath(); x.fill(); } }
  var body = e4Bl([[-H * 0.44, by - H * 0.12], [-H * 0.3, by - H * 0.33], [0, by - H * 0.38], [H * 0.24, by - H * 0.3], [H * 0.33, by - H * 0.06], [H * 0.22, by + H * 0.1], [-H * 0.1, by + H * 0.13], [-H * 0.4, by + H * 0.08]]);
  e4F(x, body, col, { d: H * 0.06, lw: 1.5 });
  e4Clip(x, body, function () {
    x.fillStyle = rgba(lt, 0.75); x.beginPath(); x.ellipse(-H * 0.04, by + H * 0.15, H * 0.34, H * 0.1, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = rgba('#1b1d2c', 0.5); x.lineWidth = Math.max(0.8, H * 0.012);
    for (var r = 0; r < 4; r++) for (var q = 0; q < 7; q++) { var sx2 = -H * 0.42 + q * H * 0.115 + (r % 2) * H * 0.057, sy2 = by - H * 0.3 + r * H * 0.085; x.beginPath(); x.arc(sx2, sy2, H * 0.055, 0.15, Math.PI - 0.15); x.stroke(); }
  });
  e4Paw(x, H * 0.24, by + H * 0.01, L, -s * 0.38 + 0.08, H * 0.16, col, { bend: 0.06, paw: enShd(col, 0.1) }); e4Paw(x, -H * 0.28, by + H * 0.01, L, s * 0.38 + 0.08, H * 0.17, col, { hind: 1, bend: 0.06, paw: enShd(col, 0.1) });
  // 머리: 둥근 귀, 작은 사나운 눈, 엄니, 말아 올린 코
  var hx = H * 0.33, hy = by - H * 0.2, hr = H * 0.185;
  e4Ov(x, hx - hr * 0.55, hy - hr * 0.85, hr * 0.32, hr * 0.3, dk, 0, { d: 0, lw: 1 });
  var head = e4Bl([[hx - hr * 1.0, hy], [hx - hr * 0.6, hy - hr * 0.95], [hx + hr * 0.5, hy - hr * 0.9], [hx + hr * 1.0, hy - hr * 0.1], [hx + hr * 0.8, hy + hr * 0.8], [hx - hr * 0.4, hy + hr * 0.95]]);
  e4F(x, head, col, { d: hr * 0.22, lw: 1.4 });
  e4Ov(x, hx + hr * 0.15, hy - hr * 0.95, hr * 0.34, hr * 0.32, col, 0, { d: hr * 0.08, lw: 1 });
  // 코: 아래로 내려갔다 앞으로 말림
  var tk = Math.sin(a * 2) * H * 0.012, t0 = [hx + hr * 0.8, hy + hr * 0.2], t1 = [hx + hr * 1.35, hy + hr * 1.0 + tk], t2 = [hx + hr * 1.75, hy + hr * 0.75 + tk];
  e4Pill(x, t0, t1, hr * 0.62, hr * 0.42, col); e4Pill(x, t1, t2, hr * 0.42, hr * 0.3, col);
  if (!enMode) {
    x.strokeStyle = rgba('#1b1d2c', 0.5); x.lineWidth = Math.max(0.7, H * 0.01); for (i = 1; i < 4; i++) { var q2 = i / 4, px = lerp(t0[0], t1[0], q2), py = lerp(t0[1], t1[1], q2); x.beginPath(); x.moveTo(px - hr * 0.22, py - hr * 0.1); x.lineTo(px + hr * 0.2, py + hr * 0.12); x.stroke(); }
    // 달아오른 입
    x.fillStyle = '#ff8a2a'; x.strokeStyle = '#1b1d2c'; x.lineWidth = Math.max(0.8, hr * 0.07); x.beginPath(); x.moveTo(hx + hr * 0.1, hy + hr * 0.62); x.quadraticCurveTo(hx + hr * 0.5, hy + hr * 0.9, hx + hr * 0.85, hy + hr * 0.6); x.quadraticCurveTo(hx + hr * 0.5, hy + hr * 0.66, hx + hr * 0.1, hy + hr * 0.62); x.closePath(); x.fill(); x.stroke();
    e4Eye(x, hx + hr * 0.3, hy - hr * 0.22, hr * 0.2, hr * 0.17, { w: '#ffd24a', pc: '#1b1d2c', pr: 0.55, px: 0.25, sd: -1 });
    e4Brush(x, [hx - hr * 0.08, hy - hr * 0.62], [hx + hr * 0.25, hy - hr * 0.52], [hx + hr * 0.62, hy - hr * 0.3], hr * 0.17, hr * 0.07, '#1b1d2c');
  }
  e4F(x, e4Bl([[hx + hr * 0.35, hy + hr * 0.55], [hx + hr * 0.75, hy + hr * 1.1], [hx + hr * 0.62, hy + hr * 0.5]]), '#fff6dc', { d: 0, lw: 0.8 });
  enGlow(x, hx + hr * 0.5, hy + hr * 0.7, hr * 0.7, '#ff9a3a', 0.35);
  x.restore();
} };

// 장산범: 흰 털의 큰 범. 넓적한 머리와 둥근 귀, 굵은 앞발과 솟은 어깨, 옅은 줄무늬, 긴 꼬리, 목과 등에만 뒤로 날리는 긴 갈기, 서늘하게 빛나는 눈으로 포효하며 낮게 달림
EN_DRAW.jangsan = { f: function (x, H, p) {
  var a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), W = '#eef3f7', sh = '#bccadb', st = '#8fa3c0', ink = '#27304a', L = H * 0.17, by = -(L + H * 0.04), th = s * 0.75, i;
  EN_ONE = ink;
  x.save(); x.translate(0, -Math.abs(s) * H * 0.025); x.rotate(c * 0.05 + 0.03);
  // 긴 꼬리: 뒤로 뻗어 끝이 치켜 올라감, 옅은 고리 줄무늬, 짙은 끝
  var tw = Math.sin(a + 1) * H * 0.025, t0 = [-H * 0.4, by - H * 0.1], t1 = [-H * 0.62, by - H * 0.08 + tw], t2 = [-H * 0.74, by - H * 0.26 + tw];
  e4Line(x, [t0, [-H * 0.52, by - H * 0.04 + tw * 0.5], t1], H * 0.075, W); e4Line(x, [t1, [-H * 0.72, by - H * 0.1 + tw], t2], H * 0.07, W);
  e4Ov(x, t2[0], t2[1] - H * 0.01, H * 0.045, H * 0.05, '#4a5878', 0, { d: 0, lw: 0.8 });
  if (!enMode) { x.strokeStyle = st; x.lineWidth = H * 0.026; x.lineCap = 'butt'; [[-0.48, -0.075, 1.4, 0.4], [-0.56, -0.07, 1.5, 0.8], [-0.66, -0.1, 0.7, 1], [-0.72, -0.18, 0.2, 1]].forEach(function (q) { var qx = q[0] * H, qy = by + q[1] * H + tw * q[3]; x.beginPath(); x.moveTo(qx - Math.cos(q[2]) * H * 0.04, qy - Math.sin(q[2]) * H * 0.04); x.lineTo(qx + Math.cos(q[2]) * H * 0.04, qy + Math.sin(q[2]) * H * 0.04); x.stroke(); }); }
  e4Paw(x, H * 0.12, by, L, th - 0.3, H * 0.115, sh, { paw: sh, bend: 0.1 }); e4Paw(x, -H * 0.27, by, L, -th - 0.3, H * 0.105, sh, { hind: 1, paw: sh, bend: 0.1 });
  // 몸: 어깨가 솟고 허리는 낮게
  var body = e4Bl([[-H * 0.43, by - H * 0.1], [-H * 0.28, by - H * 0.2], [-H * 0.02, by - H * 0.2], [H * 0.2, by - H * 0.27], [H * 0.31, by - H * 0.12], [H * 0.25, by + H * 0.07], [-H * 0.08, by + H * 0.08], [-H * 0.4, by + H * 0.05]]);
  e4F(x, body, W, { d: H * 0.04, sk: 0.3, lw: 1.5 });
  e4Stripes(x, body, [[-0.34, -0.2, -0.3, 0.0], [-0.22, -0.22, -0.17, -0.02], [-0.09, -0.22, -0.05, -0.03], [0.04, -0.24, 0.07, -0.05]].map(function (q) { return [q[0] * H, by + q[1] * H, q[2] * H, by + q[3] * H, H * 0.05]; }), st);
  e4Ov(x, H * 0.17, by - H * 0.08, H * 0.13, H * 0.14, W, 0.2, { d: H * 0.03, sk: 0.3, lw: 1, lc: mixc(W, ink, 0.45) });
  e4Paw(x, H * 0.18, by + H * 0.015, L, th + 0.2, H * 0.13, W, { paw: W, bend: 0.1 }); e4Paw(x, -H * 0.3, by + H * 0.015, L, -th + 0.2, H * 0.115, W, { hind: 1, paw: W, bend: 0.1 });
  // 목과 등 갈기: 뒤로 날리는 긴 털 다섯 가닥
  for (i = 0; i < 5; i++) { var u = i / 4, bx = lerp(-H * 0.12, H * 0.24, u); e4Tail(x, bx, by - H * (0.19 + u * 0.08), Math.PI + 0.38 - u * 0.12 + Math.sin(a + i * 1.3) * 0.1, H * (0.24 + u * 0.06), H * 0.05, i % 2 ? W : sh, 0, -0.25, { d: H * 0.012, lw: 1, sk: 0.3 }); }
  // 머리: 넓적하고 크게, 낮게 내밀어 포효
  var hx = H * 0.36, hy = by - H * 0.1, hr = H * 0.185, jo = hr * (0.16 + 0.08 * Math.sin(a * 2));
  e4F(x, e4Mane(hx - hr * 0.45, hy + hr * 0.15, 0.9, 3.7, hr * 0.6, hr * 1.2, 4, a + 2), W, { d: hr * 0.08, lw: 1.1, sk: 0.3 });
  [[0.12, 0.26, 1], [-0.42, 0.3, 0]].forEach(function (q) { var ex = hx + q[0] * hr, ey = hy - hr * 0.88; e4Ov(x, ex, ey, hr * q[1], hr * q[1], q[2] ? sh : W, 0, { d: 0, lw: 1 }); e4Dot(x, ex + hr * 0.02, ey + hr * 0.04, hr * q[1] * 0.5, '#7f93b3', 0); });
  e4F(x, e4Bl([[hx + hr * 0.15, hy + hr * 0.15], [hx + hr * 1.15, hy + hr * 0.15], [hx + hr * 1.0, hy + hr * 0.7 + jo], [hx + hr * 0.1, hy + hr * 0.65]]), '#3b2a55', { d: 0, lw: 0.9 });
  e4F(x, e4Bl([[hx + hr * 0.05, hy + hr * 0.42], [hx + hr * 0.6, hy + hr * 0.6 + jo * 0.6], [hx + hr * 1.02, hy + hr * 0.56 + jo], [hx + hr * 1.05, hy + hr * 0.78 + jo], [hx + hr * 0.35, hy + hr * 1.0 + jo * 0.5], [hx - hr * 0.35, hy + hr * 0.8]]), W, { d: hr * 0.08, sk: 0.3, lw: 1.2 });
  var head = e4Bl([[hx - hr * 0.95, hy - hr * 0.1], [hx - hr * 0.62, hy - hr * 0.86], [hx + hr * 0.25, hy - hr * 0.95], [hx + hr * 0.85, hy - hr * 0.55], [hx + hr * 1.3, hy - hr * 0.22], [hx + hr * 1.4, hy + hr * 0.08], [hx + hr * 1.12, hy + hr * 0.24], [hx + hr * 0.35, hy + hr * 0.28], [hx - hr * 0.2, hy + hr * 0.62], [hx - hr * 0.9, hy + hr * 0.55]]);
  e4F(x, head, W, { d: hr * 0.16, sk: 0.3, lw: 1.5 });
  e4Stripes(x, head, [[-0.3, -0.95, -0.22, -0.5, 0.15], [0.02, -0.98, 0.04, -0.58, 0.15], [0.32, -0.9, 0.28, -0.6, 0.12], [-0.95, -0.05, -0.5, 0.08, 0.13], [-0.85, 0.35, -0.45, 0.32, 0.12]].map(function (q) { return [hx + q[0] * hr, hy + q[1] * hr, hx + q[2] * hr, hy + q[3] * hr, hr * q[4]]; }), st);
  if (!enMode) {
    var ex = hx + hr * 0.52, ey = hy - hr * 0.36;
    enGlow(x, ex, ey, hr * 0.7, '#9fe8ff', 0.45);
    x.fillStyle = '#d6fbff'; x.strokeStyle = ink; x.lineWidth = Math.max(0.8, hr * 0.06);
    x.beginPath(); x.moveTo(ex - hr * 0.34, ey - hr * 0.1); x.quadraticCurveTo(ex + hr * 0.05, ey - hr * 0.3, ex + hr * 0.36, ey + hr * 0.1); x.quadraticCurveTo(ex - hr * 0.05, ey + hr * 0.2, ex - hr * 0.34, ey - hr * 0.1); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = ink; x.beginPath(); x.ellipse(ex + hr * 0.04, ey - hr * 0.02, hr * 0.05, hr * 0.13, -0.2, 0, Math.PI * 2); x.fill();
    e4Brush(x, [ex - hr * 0.55, ey - hr * 0.42], [ex - hr * 0.05, ey - hr * 0.42], [ex + hr * 0.45, ey - hr * 0.05], hr * 0.17, hr * 0.06, ink);
    x.fillStyle = '#4a5878'; x.beginPath(); x.ellipse(hx + hr * 1.3, hy - hr * 0.08, hr * 0.14, hr * 0.11, 0.3, 0, Math.PI * 2); x.fill();
    // 송곳니 (위 둘, 아래 하나), 혀
    x.fillStyle = '#c9a6e0'; x.beginPath(); x.ellipse(hx + hr * 0.6, hy + hr * 0.56 + jo * 0.6, hr * 0.28, hr * 0.1, 0.15, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fffaf0'; x.lineWidth = Math.max(0.7, hr * 0.05);
    [[1.02, 0.2, 0.36, 1], [0.7, 0.24, 0.22, 1], [0.95, 0.6, -0.3, 0]].forEach(function (q) { var fx = hx + q[0] * hr, fy = hy + q[1] * hr + (q[3] ? 0 : jo); x.beginPath(); x.moveTo(fx - hr * 0.09, fy); x.lineTo(fx, fy + hr * q[2]); x.lineTo(fx + hr * 0.09, fy); x.closePath(); x.fill(); x.stroke(); });
    x.fillStyle = ink; [[0.85, 0.02], [0.98, 0.1], [0.72, 0.1]].forEach(function (q) { x.beginPath(); x.arc(hx + q[0] * hr, hy + q[1] * hr, Math.max(0.5, hr * 0.028), 0, Math.PI * 2); x.fill(); });
    enEyeRec(x, ex, ey, hr * 0.3, hr * 0.22, -1);
  }
  x.restore();
} };

// 어둑시니: 땅에서 솟아 굽어보는 검은 그림자 덩어리, 노란 두 눈과 톱니 웃음, 연기 같은 손. 일렁이며 다가옴
EN_DRAW.eoduksini = { f: function (x, H, p) {
  var a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), K = '#33284f', i;
  EN_ONE = '#120d20';
  function wv(k) { return Math.sin(a + k) * H * 0.018; }
  enGlow(x, H * 0.05, -H * 0.55, H * 0.6, '#6a4ad0', 0.22);
  // 바닥 그림자 웅덩이
  e4Ov(x, 0, -H * 0.035, H * 0.36 + s * H * 0.01, H * 0.06, '#1a1430', 0, { d: 0, lw: 1 });
  // 연기 손 (뒤)
  e4F(x, e4Bl([[-H * 0.22, -H * 0.5], [-H * 0.42 + wv(1), -H * 0.42], [-H * 0.5 + wv(2), -H * 0.22], [-H * 0.4, -H * 0.3], [-H * 0.38, -H * 0.16 + wv(3)], [-H * 0.3, -H * 0.3], [-H * 0.2, -H * 0.3]]), '#231b3a', { d: 0, lw: 1.1, lc: '#5a4a90' });
  // 몸: 좁은 밑동에서 넓은 어깨로, 머리는 앞으로 굽음. 가장자리는 연기 혀
  var body = e4Bl([[-H * 0.2, -H * 0.04], [-H * 0.16 + wv(0), -H * 0.3], [-H * 0.34 + wv(1), -H * 0.52], [-H * 0.3, -H * 0.72 + wv(2)], [-H * 0.22, -H * 0.86], [-H * 0.12 + wv(3), -H * 0.98 + wv(1)], [-H * 0.02, -H * 0.9], [H * 0.1 + wv(4), -H * 1.0 + wv(2)], [H * 0.2, -H * 0.86], [H * 0.36 + wv(5), -H * 0.8], [H * 0.4, -H * 0.58 + wv(0)], [H * 0.32 + wv(2), -H * 0.38], [H * 0.2, -H * 0.24], [H * 0.24 + wv(3), -H * 0.04]]);
  e4F(x, body, K, { d: H * 0.07, lw: 1.5, hi: 0.4, sk: 0.55, lc: '#7a66c0', rim: 1, ra: 0.26 });
  e4Clip(x, body, function () { x.fillStyle = 'rgba(120,90,220,0.22)'; x.beginPath(); x.ellipse(-H * 0.1, -H * 0.7, H * 0.2, H * 0.24, -0.3, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(8,4,20,0.45)'; x.beginPath(); x.ellipse(H * 0.08, -H * 0.2, H * 0.3, H * 0.2, 0, 0, Math.PI * 2); x.fill(); });
  // 앞 손: 갈퀴 같은 연기
  e4F(x, e4Bl([[H * 0.24, -H * 0.5], [H * 0.44 + wv(2), -H * 0.46], [H * 0.56 + wv(4), -H * 0.3], [H * 0.47, -H * 0.36], [H * 0.5 + wv(1), -H * 0.2], [H * 0.4, -H * 0.3], [H * 0.38, -H * 0.17 + wv(5)], [H * 0.3, -H * 0.32]]), '#33284e', { d: 0, lw: 1.1, lc: '#5a4a90' });
  if (!enMode) {
    var ex = H * 0.1, ey = -H * 0.68 + wv(1) * 0.5, r = H * 0.075;
    enGlow(x, ex + H * 0.02, ey, H * 0.3, '#ffd84a', 0.35);
    [[-0.11, 1, 1], [0.13, 0.85, -1]].forEach(function (q) {
      var cx = ex + q[0] * H, k = q[1];
      x.fillStyle = '#ffd84a'; x.strokeStyle = '#120d20'; x.lineWidth = Math.max(0.9, r * 0.14);
      x.beginPath(); x.moveTo(cx - r * 1.1 * k, cy0(q[2]) - r * 0.5); x.quadraticCurveTo(cx, ey - r * 0.1, cx + r * 1.1 * k, cy0(-q[2]) - r * 0.5); x.quadraticCurveTo(cx + r * 0.6 * k, ey + r * 0.95, cx, ey + r * 0.85); x.quadraticCurveTo(cx - r * 0.8 * k, ey + r * 0.8, cx - r * 1.1 * k, cy0(q[2]) - r * 0.5); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#120d20'; x.beginPath(); x.ellipse(cx + r * 0.2, ey + r * 0.25, r * 0.16, r * 0.42, 0, 0, Math.PI * 2); x.fill();
      enEyeRec(x, cx, ey + r * 0.2, r * 0.9 * k, r * 0.7, q[2]);
    });
    // 톱니 웃음
    var m0 = ex - H * 0.13, m1 = ex + H * 0.2, my = ey + H * 0.19, nT = 6; x.fillStyle = '#ffe98a'; x.strokeStyle = '#120d20'; x.lineWidth = Math.max(0.8, H * 0.012); x.beginPath(); x.moveTo(m0, my - H * 0.02);
    for (i = 0; i < nT; i++) { var u0 = lerp(m0, m1, (i + 0.5) / nT), u1 = lerp(m0, m1, (i + 1) / nT), dip = Math.sin((i + 0.5) / nT * Math.PI) * H * 0.045; x.lineTo(u0, my + dip - H * 0.035); x.lineTo(u1, my + Math.sin((i + 1) / nT * Math.PI) * H * 0.045 - (i === nT - 1 ? H * 0.02 : 0)); }
    x.quadraticCurveTo((m0 + m1) / 2, my + H * 0.14, m0, my - H * 0.02); x.closePath(); x.fill(); x.stroke();
  }
  function cy0(sd) { return -H * 0.68 + wv(1) * 0.5 - sd * H * 0.012; }
} };

// 장구 (옆으로 멘 모습): 가운데가 잘록한 나무 통, 왼쪽 붉은 편, 오른쪽 푸른 편, 흰 조임줄
function e4Janggu(x, cx, cy, w, h, t) {
  x.save(); x.translate(cx, cy); x.rotate(t || 0);
  var bd = e4Bl([[-w * 0.5, -h * 0.5], [-w * 0.1, -h * 0.2], [w * 0.1, -h * 0.2], [w * 0.5, -h * 0.5], [w * 0.5, h * 0.5], [w * 0.1, h * 0.2], [-w * 0.1, h * 0.2], [-w * 0.5, h * 0.5]]);
  e4F(x, bd, '#b86a34', { d: h * 0.12, lw: 1.1 });
  e4Clip(x, bd, function () { x.strokeStyle = '#fff6e0'; x.lineWidth = Math.max(0.7, h * 0.05); for (var i = 0; i < 4; i++) { var u = -w * 0.42 + i * w * 0.28; x.beginPath(); x.moveTo(u, -h * 0.5); x.lineTo(u + w * 0.14, h * 0.5); x.moveTo(u + w * 0.14, -h * 0.5); x.lineTo(u, h * 0.5); x.stroke(); } });
  e4Ov(x, -w * 0.5, 0, w * 0.1, h * 0.58, e4C.R, 0, { d: w * 0.03, lw: 1 }); e4Ov(x, w * 0.5, 0, w * 0.1, h * 0.58, e4C.B, 0, { d: w * 0.03, lw: 1 });
  x.restore();
}
// 탈광대: 웃는 나무 탈(초승달 눈, 큰 코, 턱이 따로 노는 웃음), 색동 소매와 긴 한삼, 삼색 띠, 장구를 메고 어깨춤을 추며 걸음
EN_DRAW.tal = { f: function (x, H, p) {
  var a = p * Math.PI * 2, sw = Math.sin(a), co = Math.cos(a), bob = Math.abs(co), W = '#f6f1e4', mask = '#dba25c', i;
  EN_ONE = e4INK;
  x.save(); x.translate(0, -bob * H * 0.03); x.rotate(sw * 0.07);
  var shY = -H * 0.56, hipY = -H * 0.28;
  // 뒤 팔: 한삼을 위로 휘날림
  var up = -2.2 + sw * 0.5, ax = -H * 0.14, ay = shY + H * 0.04, hx0 = ax + Math.sin(up) * H * 0.2, hy0 = ay + Math.cos(up) * H * 0.2;
  enRib(x, hx0, hy0, H * 0.36, H * 0.085, Math.PI * 1.08 - sw * 0.5, a * 2, W);
  e4Pill(x, [ax, ay], [hx0, hy0], H * 0.1, H * 0.085, e4C.Y);
  e4Leg(x, -H * 0.06, hipY, a + Math.PI, H * 0.1, H * 0.085, H * 0.115, enShd(W, 0.18), '#221c2c', H * 0.075);
  e4Leg(x, H * 0.07, hipY, a, H * 0.1, H * 0.085, H * 0.12, W, '#2b2536', H * 0.08);
  // 몸: 흰 저고리, 삼색 띠(적, 청, 황)
  var body = e4Bl([[-H * 0.18, shY + H * 0.04], [0, shY - H * 0.03], [H * 0.18, shY + H * 0.04], [H * 0.19, hipY + H * 0.03], [0, hipY + H * 0.07], [-H * 0.19, hipY + H * 0.03]]);
  e4F(x, body, W, { d: H * 0.03, sk: 0.3, lw: 1.2 });
  e4Clip(x, body, function () {
    x.lineWidth = H * 0.05; x.lineCap = 'butt';
    x.strokeStyle = e4C.R; x.beginPath(); x.moveTo(-H * 0.2, shY + H * 0.02); x.lineTo(H * 0.2, hipY - H * 0.01); x.stroke();
    x.strokeStyle = e4C.B; x.beginPath(); x.moveTo(H * 0.2, shY + H * 0.02); x.lineTo(-H * 0.2, hipY - H * 0.01); x.stroke();
    x.strokeStyle = e4C.Y; x.beginPath(); x.moveTo(-H * 0.22, hipY - H * 0.015); x.lineTo(H * 0.22, hipY - H * 0.015); x.stroke();
  });
  x.lineWidth = enLW; if (!enMode) { x.strokeStyle = e4INK; x.stroke(body.p); }
  enRib(x, -H * 0.16, hipY - H * 0.01, H * 0.2, H * 0.05, Math.PI * 0.68 - sw * 0.25, a * 2, e4C.R);
  // 장구
  e4Janggu(x, H * 0.09, hipY - H * 0.06, H * 0.38, H * 0.18, -0.1 + sw * 0.05);
  // 탈: 검은 탈보 → 나무 탈 → 따로 노는 턱
  var hx = H * 0.05, hy = -H * 0.77, hr = H * 0.19, jaw = (0.5 - 0.5 * Math.cos(a * 2)) * hr * 0.12;
  e4F(x, e4Bl([[hx - hr * 0.9, hy - hr * 0.9], [hx + hr * 0.2, hy - hr * 1.15], [hx + hr * 0.7, hy - hr * 0.8], [hx - hr * 0.2, hy + hr * 0.2], [hx - hr * 1.0, hy + hr * 0.75 + sw * hr * 0.05], [hx - hr * 1.25, hy]]), '#231d2e', { d: hr * 0.1, lw: 1.1, lc: '#5a5478' });
  e4F(x, e4Bl([[hx - hr * 0.5, hy + hr * 0.55 + jaw], [hx + hr * 0.75, hy + hr * 0.5 + jaw], [hx + hr * 0.55, hy + hr * 1.08 + jaw], [hx - hr * 0.2, hy + hr * 1.1 + jaw]]), enShd(mask, 0.1), { d: hr * 0.08, lw: 1 });
  var mk = e4Bl([[hx - hr * 0.82, hy - hr * 0.2], [hx - hr * 0.55, hy - hr * 0.95], [hx + hr * 0.5, hy - hr * 0.98], [hx + hr * 0.95, hy - hr * 0.25], [hx + hr * 0.9, hy + hr * 0.5], [hx + hr * 0.1, hy + hr * 0.72], [hx - hr * 0.66, hy + hr * 0.5]]);
  e4F(x, mk, mask, { d: hr * 0.18, lw: 1.3, hi: 0.35 });
  if (!enMode) {
    // 초승달 눈과 눈웃음 주름, 큰 코, 입
    var ey = hy - hr * 0.2, e1 = hx - hr * 0.12, e2 = hx + hr * 0.55;
    [[e1, 0.34, 1], [e2, 0.27, -1]].forEach(function (q) {
      x.fillStyle = e4INK; x.beginPath(); x.moveTo(q[0] - hr * q[1], ey + hr * 0.08); x.quadraticCurveTo(q[0], ey - hr * 0.34, q[0] + hr * q[1], ey + hr * 0.08); x.quadraticCurveTo(q[0], ey - hr * 0.1, q[0] - hr * q[1], ey + hr * 0.08); x.closePath(); x.fill();
      e4Brush(x, [q[0] - hr * q[1] * 1.1, ey - hr * 0.3], [q[0], ey - hr * 0.58], [q[0] + hr * q[1] * 1.1, ey - hr * 0.32], hr * 0.1, hr * 0.04, '#7a4a22');
      enEyeRec(x, q[0], ey, hr * q[1] * 0.8, hr * 0.2, q[2]);
    });
    e4Brush(x, [e1 - hr * 0.5, ey + hr * 0.25], [e1 - hr * 0.3, ey + hr * 0.42], [e1 + hr * 0.05, ey + hr * 0.4], hr * 0.03, hr * 0.07, '#7a4a22', 0.9);
    x.fillStyle = enShd(mask, 0.16); x.strokeStyle = e4INK; x.lineWidth = Math.max(0.8, hr * 0.06);
    x.beginPath(); x.moveTo(hx + hr * 0.2, ey + hr * 0.02); x.quadraticCurveTo(hx + hr * 0.62, ey + hr * 0.3, hx + hr * 0.5, ey + hr * 0.56); x.quadraticCurveTo(hx + hr * 0.2, ey + hr * 0.62, hx + hr * 0.12, ey + hr * 0.42); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#5a1826'; x.beginPath(); x.moveTo(hx - hr * 0.42, hy + hr * 0.52); x.quadraticCurveTo(hx + hr * 0.2, hy + hr * 0.7, hx + hr * 0.8, hy + hr * 0.48); x.lineTo(hx + hr * 0.7, hy + hr * 0.62 + jaw); x.quadraticCurveTo(hx + hr * 0.2, hy + hr * 0.84 + jaw, hx - hr * 0.36, hy + hr * 0.66 + jaw); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#e8684a'; x.beginPath(); x.arc(hx - hr * 0.45, hy + hr * 0.2, hr * 0.13, 0, Math.PI * 2); x.arc(hx + hr * 0.78, hy + hr * 0.16, hr * 0.1, 0, Math.PI * 2); x.fill();
  }
  // 앞 팔: 색동 소매, 궁채로 장구를 침, 한삼 자락
  var th = 0.75 + sw * 0.35, sx = H * 0.15, sy = shY + H * 0.05, hx1 = sx + Math.sin(th) * H * 0.21, hy1 = sy + Math.cos(th) * H * 0.21, sl = limbShape(sx, sy, hx1, hy1, H * 0.115, H * 0.1);
  e4F(x, sl, W, { d: H * 0.02, lw: 1.1 });
  e4Clip(x, sl, function () { var cols = [e4C.R, e4C.Y, e4C.B, e4C.G, e4C.R]; for (i = 0; i < 5; i++) { var u = 0.2 + i * 0.17; x.strokeStyle = cols[i]; x.lineWidth = H * 0.045; x.beginPath(); x.moveTo(lerp(sx, hx1, u) - Math.cos(th) * H * 0.1, lerp(sy, hy1, u) + Math.sin(th) * H * 0.1); x.lineTo(lerp(sx, hx1, u) + Math.cos(th) * H * 0.1, lerp(sy, hy1, u) - Math.sin(th) * H * 0.1); x.stroke(); } });
  if (!enMode) { x.lineWidth = enLW; x.strokeStyle = e4INK; x.stroke(sl.p); }
  enRib(x, hx1, hy1, H * 0.26, H * 0.075, Math.PI * 0.55 - sw * 0.4, a * 2 + 1, W);
  e4Line(x, [[hx1, hy1], [hx1 - H * 0.02, hy1 + H * 0.12]], Math.max(1, H * 0.02), '#7a5a3c');
  x.restore();
} };

// 창귀 호랑이: 민화 까치호랑이의 익살스러운 왕방울 눈, 붓으로 그은 줄무늬, 둥글게 말아 올린 꼬리, 등 위로 푸른 귀기
EN_DRAW.horangi = { f: function (x, H, p) {
  var a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), col = '#f0a034', wh = '#fff3d6', dk = enShd(col, 0.25), L = H * 0.24, by = -(L + H * 0.035), th = s * 0.62, i;
  EN_ONE = e4INK;
  x.save(); x.translate(0, -Math.abs(s) * H * 0.025); x.rotate(c * 0.045);
  // 꼬리: S 자로 말아 올림
  var tw = Math.sin(a + 1) * H * 0.02, tp = [[-H * 0.36, by - H * 0.1], [-H * 0.56, by - H * 0.16], [-H * 0.58 + tw, by - H * 0.42], [-H * 0.44 + tw, by - H * 0.52]];
  e4Line(x, [tp[0], tp[1], tp[2]], H * 0.085, col); e4Line(x, [tp[2], [tp[2][0] + H * 0.02, tp[2][1] - H * 0.08], tp[3]], H * 0.08, col);
  e4Ov(x, tp[3][0] + H * 0.02, tp[3][1] + H * 0.01, H * 0.055, H * 0.05, '#2b2536', 0, { d: 0, lw: 0.8 });
  if (!enMode) { x.strokeStyle = e4INK; x.lineWidth = H * 0.028; x.lineCap = 'butt'; [[-0.47, -0.135, 0.3], [-0.565, -0.25, 1.4], [-0.575, -0.36, 1.6]].forEach(function (q) { var qx = q[0] * H + tw * (q[2] > 1 ? 0.6 : 0), qy = by + q[1] * H; x.beginPath(); x.moveTo(qx - Math.cos(q[2]) * H * 0.045, qy - Math.sin(q[2]) * H * 0.045); x.lineTo(qx + Math.cos(q[2]) * H * 0.045, qy + Math.sin(q[2]) * H * 0.045); x.stroke(); }); }
  e4Paw(x, H * 0.16, by, L, th - 0.25, H * 0.11, dk, { paw: dk }); e4Paw(x, -H * 0.26, by, L, -th - 0.25, H * 0.12, dk, { hind: 1, paw: dk });
  var body = e4Bl([[-H * 0.42, by - H * 0.1], [-H * 0.26, by - H * 0.24], [H * 0.08, by - H * 0.24], [H * 0.26, by - H * 0.12], [H * 0.24, by + H * 0.08], [-H * 0.1, by + H * 0.11], [-H * 0.4, by + H * 0.06]]);
  e4F(x, body, col, { d: H * 0.05, lw: 1.5 });
  e4Clip(x, body, function () { x.fillStyle = wh; x.beginPath(); x.ellipse(-H * 0.06, by + H * 0.13, H * 0.3, H * 0.075, 0, 0, Math.PI * 2); x.fill(); });
  e4Stripes(x, body, [[-0.36, -0.26, -0.33, -0.02], [-0.25, -0.28, -0.2, -0.04], [-0.13, -0.28, -0.1, -0.05], [0, -0.28, 0.02, -0.06], [0.11, -0.26, 0.1, -0.06]].map(function (q) { return [q[0] * H, by + q[1] * H, q[2] * H, by + q[3] * H, H * 0.055]; }));
  e4Paw(x, H * 0.2, by + H * 0.01, L, th + 0.2, H * 0.115, col, { paw: wh }); e4Paw(x, -H * 0.3, by + H * 0.01, L, -th + 0.2, H * 0.125, col, { hind: 1, paw: wh });
  // 푸른 귀기 (창귀): 등 위에 떠도는 불 셋
  [[-0.3, 0.42, 0.11, 0], [-0.08, 0.5, 0.14, 2.1], [0.12, 0.4, 0.09, 4.2]].forEach(function (q) { e4Fire(x, q[0] * H, by - q[1] * H + Math.sin(a + q[3]) * H * 0.02, H * q[2], -0.45, e4C.FIRE, 0.4); });
  // 머리: 정면을 반쯤 돌아봄
  var hx = H * 0.27, hy = by - H * 0.2, hr = H * 0.21;
  [[-0.62, 1], [0.5, 0]].forEach(function (q) { var ex = hx + q[0] * hr, ey = hy - hr * 0.78; e4Ov(x, ex, ey, hr * 0.27, hr * 0.26, q[1] ? dk : col, 0, { d: 0, lw: 1 }); e4Dot(x, ex, ey + hr * 0.04, hr * 0.13, '#2b2536', 0); });
  var head = e4Bl([[hx - hr * 1.02, hy - hr * 0.1], [hx - hr * 0.6, hy - hr * 0.92], [hx + hr * 0.5, hy - hr * 0.92], [hx + hr * 1.02, hy - hr * 0.1], [hx + hr * 0.85, hy + hr * 0.7], [hx, hy + hr * 0.95], [hx - hr * 0.8, hy + hr * 0.7]]);
  e4F(x, head, col, { d: hr * 0.18, lw: 1.5 });
  e4Clip(x, head, function () { x.fillStyle = wh; x.beginPath(); x.ellipse(hx + hr * 0.12, hy + hr * 0.62, hr * 0.62, hr * 0.44, 0, 0, Math.PI * 2); x.fill(); });
  e4Stripes(x, head, [[-0.2, -0.95, -0.12, -0.5, 0.16], [0.12, -0.95, 0.1, -0.55, 0.16], [0.42, -0.9, 0.34, -0.55, 0.14], [-1.0, -0.1, -0.55, 0.05, 0.14], [-0.9, 0.35, -0.5, 0.35, 0.13], [1.0, -0.1, 0.72, 0.05, 0.12]].map(function (q) { return [hx + q[0] * hr, hy + q[1] * hr, hx + q[2] * hr, hy + q[3] * hr, hr * q[4]]; }));
  if (!enMode) {
    var ey2 = hy - hr * 0.12, e1 = hx - hr * 0.3, e2 = hx + hr * 0.5;
    e4Eye(x, e1, ey2, hr * 0.3, hr * 0.3, { w: '#fff8a8', ir: '#b7d94a', pr: 0.26, px: 0.35, py: 0.1 }); e4Eye(x, e2, ey2 - hr * 0.02, hr * 0.26, hr * 0.28, { w: '#fff8a8', ir: '#b7d94a', pr: 0.26, px: -0.2, py: 0.12, sd: -1 });
    e4Brush(x, [e1 - hr * 0.4, ey2 - hr * 0.45], [e1, ey2 - hr * 0.56], [e1 + hr * 0.36, ey2 - hr * 0.36], hr * 0.12, hr * 0.05); e4Brush(x, [e2 + hr * 0.36, ey2 - hr * 0.46], [e2, ey2 - hr * 0.55], [e2 - hr * 0.3, ey2 - hr * 0.36], hr * 0.11, hr * 0.05);
    var nx = hx + hr * 0.14, ny = hy + hr * 0.36;
    x.fillStyle = '#c8553e'; x.strokeStyle = e4INK; x.lineWidth = Math.max(0.8, hr * 0.055); x.beginPath(); x.moveTo(nx - hr * 0.2, ny - hr * 0.08); x.lineTo(nx + hr * 0.2, ny - hr * 0.08); x.lineTo(nx, ny + hr * 0.12); x.closePath(); x.fill(); x.stroke();
    x.lineCap = 'round'; x.beginPath(); x.moveTo(nx, ny + hr * 0.12); x.lineTo(nx, ny + hr * 0.26); x.moveTo(nx - hr * 0.42, ny + hr * 0.22); x.quadraticCurveTo(nx - hr * 0.2, ny + hr * 0.44, nx, ny + hr * 0.26); x.quadraticCurveTo(nx + hr * 0.2, ny + hr * 0.44, nx + hr * 0.42, ny + hr * 0.22); x.stroke();
    x.fillStyle = '#fffaf0'; [[-0.2, 1], [0.2, 1]].forEach(function (q) { x.beginPath(); x.moveTo(nx + q[0] * hr - hr * 0.07, ny + hr * 0.33); x.lineTo(nx + q[0] * hr, ny + hr * 0.52); x.lineTo(nx + q[0] * hr + hr * 0.07, ny + hr * 0.33); x.closePath(); x.fill(); x.stroke(); });
    x.fillStyle = e4INK; [[-0.5, 0.2], [-0.42, 0.34], [0.72, 0.18], [0.66, 0.32]].forEach(function (q) { x.beginPath(); x.arc(hx + q[0] * hr, hy + q[1] * hr + hr * 0.25, Math.max(0.5, hr * 0.03), 0, Math.PI * 2); x.fill(); });
  }
  x.restore();
} };

// 까마귀 떼: 검푸른 까마귀 셋이 엇박으로 날갯짓
function e4Crow(x, cx, cy, r, f, far) {
  var K = far ? '#3a3560' : '#443d70', wg = far ? '#544c88' : '#655ca6';
  // 꽁지
  e4F(x, e4Po([[cx - r * 0.7, cy - r * 0.1], [cx - r * 1.7, cy - r * 0.25], [cx - r * 1.6, cy + r * 0.25], [cx - r * 0.7, cy + r * 0.3]]), K, { d: 0, lw: 0.9, lc: '#6a62a0' });
  // 먼 날개
  x.save(); x.translate(cx - r * 0.1, cy - r * 0.2); x.rotate(-f * 0.95 - 0.15);
  e4F(x, e4Po([[0, r * 0.2], [-r * 0.5, -r * 1.5], [-r * 0.2, -r * 1.2], [r * 0.05, -r * 1.75], [r * 0.3, -r * 1.25], [r * 0.6, -r * 1.5], [r * 0.6, r * 0.1]]), enShd(wg, 0.35), { d: 0, lw: 0.9 });
  x.restore();
  // 몸과 머리
  e4F(x, e4Bl([[cx - r * 0.95, cy], [cx - r * 0.3, cy - r * 0.55], [cx + r * 0.6, cy - r * 0.45], [cx + r * 0.75, cy + r * 0.2], [cx, cy + r * 0.6], [cx - r * 0.7, cy + r * 0.4]]), K, { d: r * 0.2, lw: 1.1, hi: 0.35, lc: '#6a62a0' });
  e4Ov(x, cx + r * 0.75, cy - r * 0.35, r * 0.48, r * 0.44, K, 0, { d: r * 0.12, lw: 1.1, hi: 0.4, lc: '#6a62a0' });
  e4F(x, e4Po([[cx + r * 1.1, cy - r * 0.5], [cx + r * 1.85, cy - r * 0.15], [cx + r * 1.1, cy - r * 0.08]]), '#e2a23a', { d: 0, lw: 0.9 });
  if (!enMode) { x.fillStyle = '#ff5a4a'; x.beginPath(); x.arc(cx + r * 0.86, cy - r * 0.42, Math.max(0.7, r * 0.12), 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + r * 0.83, cy - r * 0.46, Math.max(0.4, r * 0.05), 0, Math.PI * 2); x.fill(); enEyeRec(x, cx + r * 0.86, cy - r * 0.42, r * 0.22, r * 0.2, -1); }
  // 가까운 날개
  x.save(); x.translate(cx + r * 0.05, cy - r * 0.05); x.rotate(-f * 1.05 + 0.1);
  var w2 = e4Po([[r * 0.45, r * 0.25], [-r * 0.55, r * 0.15], [-r * 0.95, -r * 1.55], [-r * 0.55, -r * 1.25], [-r * 0.3, -r * 1.9], [0, -r * 1.3], [r * 0.3, -r * 1.65], [r * 0.5, -r * 0.9]]);
  e4F(x, w2, wg, { d: r * 0.15, lw: 1.1, hi: 0.4, lc: '#7a72b0' });
  e4Clip(x, w2, function () { x.strokeStyle = 'rgba(150,140,220,0.6)'; x.lineWidth = Math.max(0.6, r * 0.07); [[-0.5, -1.2], [-0.15, -1.3], [0.2, -1.2]].forEach(function (q) { x.beginPath(); x.moveTo(q[0] * r * 0.3, -r * 0.1); x.lineTo(q[0] * r, q[1] * r); x.stroke(); }); });
  x.restore();
}
EN_DRAW.crows = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2;
  EN_ONE = '#15122a';
  e4Crow(x, -H * 0.42, -H * 0.66 + Math.sin(a + 1) * H * 0.015, H * 0.1, Math.sin(a + 2.1), 1);
  e4Crow(x, -H * 0.36, -H * 0.14 + Math.sin(a + 3) * H * 0.015, H * 0.11, Math.sin(a + 4.2), 1);
  e4Crow(x, H * 0.14, -H * 0.42 + Math.sin(a) * H * 0.02, H * 0.15, Math.sin(a), 0);
} };

// 물귀신: 물 위로 솟은 윗몸, 물풀이 엉긴 길고 젖은 머리, 앞으로 뻗은 창백한 두 손. 발밑은 물결 고리
EN_DRAW.mulgwisin = { f: function (x, H, p) {
  var a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), hair = '#28504f', skin = '#c6e6de', weed = '#6fc25a', oy = s * H * 0.025, i;
  EN_ONE = '#10262c';
  e4Ripple(x, 0, -H * 0.03, H * 0.4, H * 0.1, 0.8, a);
  x.save(); x.translate(0, oy);
  var hx = H * 0.0, hy = -H * 0.58, hr = H * 0.2;
  // 뻗은 팔 (먼 쪽)
  var rc = c * H * 0.02;
  function arm(dy, k, far) {
    var sx = H * 0.1, sy = -H * 0.36 + dy, wx = sx + H * 0.33 * k + rc, wy = sy - H * 0.12 * k + s * H * 0.015, col = far ? enShd(skin, 0.22) : skin;
    e4Pill(x, [sx, sy], [wx, wy], H * 0.085, H * 0.06, col);
    for (var j = 0; j < 4; j++) { var fa = -1.0 + j * 0.42 + s * 0.08; e4Pill(x, [wx, wy], [wx + Math.cos(fa) * H * 0.085, wy + Math.sin(fa) * H * 0.085], H * 0.03, H * 0.016, col, 0.7); }
    e4Ov(x, wx, wy, H * 0.04, H * 0.036, col, 0, { d: 0, lw: 0.8 });
  }
  arm(-H * 0.02, 0.88, 1);
  // 머리채: 머리에서 물까지 흘러내림
  var hb = shp(), P = hb.p, n = 5, hw = H * 0.27, bot = -H * 0.04 - oy;
  P.moveTo(hx - hr * 0.9, hy - hr * 0.5); P.quadraticCurveTo(hx, hy - hr * 1.35, hx + hr * 0.95, hy - hr * 0.45);
  P.quadraticCurveTo(hx + hr * 1.25, hy + hr * 0.6, hw, bot);
  for (i = 0; i < n; i++) { var x0 = hw - i * hw * 2 / n, x1 = x0 - hw * 2 / n; P.quadraticCurveTo((x0 + x1) / 2, bot - H * 0.07 - Math.sin(a + i * 1.4) * H * 0.012, x1, bot); }
  P.quadraticCurveTo(hx - hr * 1.3, hy + hr * 0.6, hx - hr * 0.9, hy - hr * 0.5); P.closePath(); hb.ext(-hw, hy - hr * 1.2); hb.ext(hw, bot);
  e4F(x, hb, hair, { d: H * 0.05, lw: 1.4, hi: 0.4, lc: '#5f9a94', rim: 1, ra: 0.28 });
  // 얼굴: 머리카락 사이로 드러난 창백한 한쪽
  var fc = e4Bl([[hx + hr * 0.02, hy - hr * 0.5], [hx + hr * 0.62, hy - hr * 0.35], [hx + hr * 0.72, hy + hr * 0.3], [hx + hr * 0.35, hy + hr * 0.78], [hx - hr * 0.05, hy + hr * 0.5]]);
  e4F(x, fc, skin, { d: hr * 0.12, lw: 1, sk: 0.3 });
  if (!enMode) {
    var ex = hx + hr * 0.38, ey = hy + hr * 0.02;
    x.fillStyle = 'rgba(20,50,60,0.45)'; x.beginPath(); x.ellipse(ex, ey, hr * 0.26, hr * 0.22, 0, 0, Math.PI * 2); x.fill();
    e4Eye(x, ex, ey, hr * 0.19, hr * 0.17, { w: '#f4ffb0', pc: '#10262c', pr: 0.4, px: 0.3, sd: -1 });
    x.strokeStyle = '#10262c'; x.lineCap = 'round'; x.lineWidth = Math.max(0.8, hr * 0.07); x.beginPath(); x.moveTo(hx + hr * 0.2, hy + hr * 0.48); x.quadraticCurveTo(hx + hr * 0.4, hy + hr * 0.4, hx + hr * 0.58, hy + hr * 0.5); x.stroke();
    // 머리카락 결
    e4Clip(x, hb, function () { x.strokeStyle = 'rgba(110,170,160,0.45)'; x.lineWidth = Math.max(0.7, H * 0.012); [-0.7, -0.35, 0.75].forEach(function (u) { x.beginPath(); x.moveTo(hx + u * hr * 0.7, hy - hr * 0.7); x.quadraticCurveTo(hx + u * hr * 1.2, hy + hr * 0.5, u * hw * 0.85, bot - H * 0.05); x.stroke(); }); });
  }
  // 얼굴 위로 내려온 젖은 가닥
  e4F(x, e4Bl([[hx - hr * 0.5, hy - hr * 0.95], [hx + hr * 0.5, hy - hr * 0.9], [hx + hr * 0.22, hy - hr * 0.3], [hx + hr * 0.1, hy + hr * 0.75 + s * hr * 0.04], [hx - hr * 0.05, hy + hr * 0.2], [hx - hr * 0.35, hy + hr * 0.6]]), hair, { d: 0, lw: 1, hi: 0.3 });
  // 물풀
  [[-0.75, -0.85, 0.5, 2.3], [0.1, -1.18, 0.42, 1.2], [0.8, -0.6, 0.5, 0.9]].forEach(function (q, j) { enLf(x, hx + q[0] * hr, hy + q[1] * hr, q[3] + Math.sin(a + j * 2) * 0.15, hr * q[2] * 1.6, hr * 0.2, j === 1 ? '#7cc85a' : weed); });
  arm(H * 0.03, 1, 0);
  x.restore();
  e4Ripple(x, H * 0.02, -H * 0.02, H * 0.3, H * 0.06, 0.9, -a);
} };

// 수적선 (위에서 본 모습, 오른쪽이 뱃머리): 작은 목선, 누런 돛, 노 넷, 도깨비 수적 둘, 붉은 깃발, 뒤로 흰 물살
function e4DokTop(x, cx, cy, r, club) {
  e4Ov(x, cx - r * 0.25, cy, r * 0.85, r * 1.15, e4C.Y, 0, { d: r * 0.15, lw: 0.9 });
  if (club) e4Club(x, cx + r * 0.2, cy + r * 1.0, 1.35, r * 2.6, r * 0.8, e4C.WOOD, 0);
  e4F(x, e4Mane(cx, cy, 1.2, 5.1, r * 0.7, r * 1.25, 5, 0), '#2e2840', { d: 0, lw: 0.9 });
  e4Ov(x, cx + r * 0.1, cy, r * 0.82, r * 0.8, e4C.G, 0, { d: r * 0.2, lw: 1 });
  e4F(x, e4Bl([[cx - r * 0.1, cy - r * 0.28], [cx + r * 0.75, cy], [cx - r * 0.1, cy + r * 0.28]]), '#f4e3b4', { d: 0, lw: 0.8 });
}
EN_DRAW.pirate = { top: 1, f: function (x, H, p) {
  var a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), wood = '#a56c3c', deck = '#dcab6c', hh = H * 0.36, cy = e4Top(x, hh), Lh = H * 0.46, bw = H * 0.19, i;
  EN_ONE = '#231a20';
  // 물살 (색칠 단계만)
  if (!enMode) {
    x.save(); x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = Math.max(1, H * 0.022);
    for (i = 0; i < 3; i++) { var ph = (p + i / 3) % 1, wx = -Lh * (0.75 + ph * 0.5), sp = bw * (0.7 + ph * 0.9); x.globalAlpha = 0.8 * (1 - ph); x.beginPath(); x.moveTo(wx + H * 0.08, cy - sp); x.quadraticCurveTo(wx - H * 0.02, cy, wx + H * 0.08, cy + sp); x.stroke(); }
    x.globalAlpha = 0.55; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(Lh * 0.86, cy, H * 0.05, bw * 0.75, 0, -1.2, 1.2); x.fill();
    x.restore();
  }
  // 노 넷
  [[-0.5, -1], [0.1, -1], [-0.5, 1], [0.1, 1]].forEach(function (q, j) {
    var ox = q[0] * Lh, sd = q[1], sw2 = Math.sin(a + (j % 2) * 0.6) * 0.5, ex = ox - Math.sin(sw2) * H * 0.16, ey = cy + sd * (bw * 0.9 + Math.cos(sw2) * H * 0.15);
    e4Line(x, [[ox, cy + sd * bw * 0.7], [ex, ey]], Math.max(1.2, H * 0.022), '#8a5a34');
    e4Ov(x, ex, ey, H * 0.035, H * 0.02, '#c08a52', sd * 1.2 - sw2 * sd, { d: 0, lw: 0.8 });
  });
  // 선체
  var hull = e4Bl([[-Lh, cy - bw * 0.72], [-Lh * 0.45, cy - bw * 1.02], [Lh * 0.3, cy - bw * 0.95], [Lh * 0.82, cy - bw * 0.42], [Lh * 1.04, cy], [Lh * 0.82, cy + bw * 0.42], [Lh * 0.3, cy + bw * 0.95], [-Lh * 0.45, cy + bw * 1.02], [-Lh, cy + bw * 0.72], [-Lh * 1.03, cy]]);
  e4F(x, hull, wood, { d: H * 0.03, lw: 1.5 });
  var dk = e4Bl([[-Lh * 0.86, cy - bw * 0.5], [-Lh * 0.4, cy - bw * 0.74], [Lh * 0.28, cy - bw * 0.68], [Lh * 0.72, cy - bw * 0.26], [Lh * 0.84, cy], [Lh * 0.72, cy + bw * 0.26], [Lh * 0.28, cy + bw * 0.68], [-Lh * 0.4, cy + bw * 0.74], [-Lh * 0.86, cy + bw * 0.5]]);
  e4F(x, dk, deck, { d: H * 0.02, lw: 0.9, sk: 0.3 });
  e4Clip(x, dk, function () { x.strokeStyle = 'rgba(90,50,20,0.45)'; x.lineWidth = Math.max(0.7, H * 0.01); for (i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(-Lh, cy + i * bw * 0.22); x.lineTo(Lh, cy + i * bw * 0.22); x.stroke(); } });
  // 뱃머리 붉은 띠, 고물 깃발
  e4F(x, e4Bl([[Lh * 0.74, cy - bw * 0.36], [Lh * 1.02, cy], [Lh * 0.74, cy + bw * 0.36], [Lh * 0.86, cy]]), e4C.R, { d: 0, lw: 0.9 });
  enRib(x, -Lh * 0.95, cy - bw * 0.3, H * 0.2, H * 0.07, Math.PI * 1.0 + s * 0.12, a * 2, e4C.R);
  // 수적: 고물의 키잡이, 이물의 방망이꾼
  e4DokTop(x, -Lh * 0.55, cy + bw * 0.1, H * 0.075, 0);
  e4DokTop(x, Lh * 0.48, cy - bw * 0.05, H * 0.07, 1);
  // 돛: 가로 활대에 누런 돛폭이 앞으로 부풂 (대나무 살 무늬)
  var sx = Lh * 0.02, bl = Math.sin(a) * H * 0.012, sail = e4Bl([[sx - H * 0.035, cy - hh * 0.8], [sx + H * 0.12 + bl, cy - hh * 0.45], [sx + H * 0.15 + bl, cy], [sx + H * 0.12 + bl, cy + hh * 0.45], [sx - H * 0.035, cy + hh * 0.8], [sx - H * 0.01, cy]]);
  e4F(x, sail, '#ecd08e', { d: H * 0.025, lw: 1.3, hi: 0.35, sk: 0.3 });
  e4Clip(x, sail, function () {
    x.strokeStyle = 'rgba(120,80,30,0.5)'; x.lineWidth = Math.max(0.7, H * 0.011); for (i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(sx - H * 0.05, cy + i * hh * 0.21); x.lineTo(sx + H * 0.2, cy + i * hh * 0.21); x.stroke(); }
    x.fillStyle = e4C.R; x.beginPath(); x.arc(sx + H * 0.065, cy, H * 0.05, 0, Math.PI * 2); x.fill(); x.fillStyle = e4C.B; x.beginPath(); x.arc(sx + H * 0.065, cy, H * 0.05, 0.4, 0.4 + Math.PI); x.fill();
  });
  e4Line(x, [[sx - H * 0.03, cy - hh * 0.84], [sx - H * 0.03, cy + hh * 0.84]], Math.max(1.3, H * 0.024), '#7a4e2c');
  e4Dot(x, sx - H * 0.03, cy, H * 0.028, '#5a381e', 1);
} };

// ---------- 보스 ----------
// 도깨비 대장: 붉은 살갗에 거대한 몸, 금빛 두 뿔, 흰 갈기와 수염, 단청 어깨 갑옷과 금 목걸이, 금 박은 큰 방망이
EN_DRAW.duryeok = { n: 6, f: function (x, H, p) { e4Dok(x, H, p, { boss: 1, skin: '#c9483c', hair: '#2b2f52', horn: e4C.GOLD, horns: 2, belt: e4C.B, wood: '#7a4a2e', brow: e4C.GOLD }); } };

// 천년 구미호: 푸른 여우불 위에 앉아 떠서 다가오는 은빛 큰 여우. 등 뒤로 화면을 채우는 아홉 꼬리 부채와 끝마다 여우불, 풍성한 가슴털, 푸른 눈매, 입 앞의 여우구슬
EN_DRAW.cheonho = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, s = Math.sin(a), o = { col: '#f3f5fb', ink: '#222a4c', tip: '#6fc0ff', ear: '#7ab6ff', eye: '#8fe8ff', mark: '#3f86f0', sock: '#cfe0ff' }, W = o.col, sh = enShd(W, 0.2), lift = H * 0.085 + s * H * 0.014;
  EN_ONE = o.ink;
  enGlow(x, 0, -H * 0.06, H * 0.5, '#5ab4ff', 0.45);
  // 뒤쪽 여우불
  [[-0.33, 0.14, 0], [-0.13, 0.25, 1.3], [0.1, 0.2, 2.6], [0.31, 0.15, 3.9]].forEach(function (q) { e4Fire(x, q[0] * H, -H * 0.005, H * q[1] * (1 + 0.14 * Math.sin(a + q[2])), -0.25 + Math.sin(a + q[2]) * 0.12, '#3f8cf2', 0); });
  x.save(); x.translate(0, -lift);
  var tips = e4FoxTails(x, -H * 0.13, -H * 0.2, H * 0.84, -0.72, -3.42, a, o, 0.185);
  // 먼 앞다리, 엉덩이, 뒷발
  e4Pill(x, [H * 0.2, -H * 0.42], [H * 0.245, -H * 0.1], H * 0.065, H * 0.045, sh); e4Ov(x, H * 0.265, -H * 0.07, H * 0.045, H * 0.03, sh, 0, { d: 0, lw: 0.9 });
  e4Ov(x, -H * 0.04, -H * 0.2, H * 0.2, H * 0.165, W, -0.25, { d: H * 0.04, sk: 0.3, lw: 1.4 });
  e4Ov(x, H * 0.085, -H * 0.068, H * 0.09, H * 0.04, o.sock, 0, { d: H * 0.01, lw: 1 });
  // 곧게 세운 윗몸
  var body = e4Bl([[-H * 0.13, -H * 0.3], [-H * 0.07, -H * 0.5], [H * 0.06, -H * 0.62], [H * 0.21, -H * 0.57], [H * 0.26, -H * 0.4], [H * 0.2, -H * 0.2], [H * 0.04, -H * 0.13], [-H * 0.1, -H * 0.17]]);
  e4F(x, body, W, { d: H * 0.04, sk: 0.3, lw: 1.4 });
  e4Pill(x, [H * 0.14, -H * 0.4], [H * 0.165, -H * 0.1], H * 0.075, H * 0.05, W); e4Ov(x, H * 0.185, -H * 0.068, H * 0.052, H * 0.033, o.sock, 0, { d: 0, lw: 0.9 });
  // 풍성한 가슴털 두 겹
  e4F(x, e4Mane(H * 0.16, -H * 0.5, -0.1, 2.4, H * 0.08, H * 0.21, 5, a), W, { d: H * 0.02, sk: 0.3, lw: 1.1 });
  e4F(x, e4Mane(H * 0.17, -H * 0.55, 0.2, 2.2, H * 0.05, H * 0.13, 3, a + 1), W, { d: 0, lw: 0.9 });
  e4FoxHead(x, H * 0.19, -H * 0.75, H * 0.128, o, a);
  x.restore();
  // 앞쪽 여우불, 꼬리 끝 여우불, 여우구슬
  [[-0.24, 0.1, 0.6], [-0.02, 0.16, 2.0], [0.2, 0.11, 3.4]].forEach(function (q) { e4Fire(x, q[0] * H, H * 0.0, H * q[1] * (1 + 0.14 * Math.sin(a + q[2])), -0.2 + Math.sin(a + q[2]) * 0.12, e4C.FIRE, 0); });
  tips.forEach(function (t, i) { e4Fire(x, t[0], t[1] - lift + H * 0.02, H * (0.075 + 0.014 * Math.sin(a + i * 1.3)), -0.3 + Math.sin(a + i) * 0.15, e4C.FIRE, i % 3 === 1 ? 0.45 : 0); });
  var ox = H * 0.54, oy = -H * 0.68 - lift + Math.sin(a + 1) * H * 0.015;
  enGlow(x, ox, oy, H * 0.2, '#7fd0ff', 0.75);
  e4Fire(x, ox - H * 0.012, oy - H * 0.01, H * 0.085, -0.5, e4C.FIRE, 0);
  e4Ov(x, ox, oy, H * 0.048, H * 0.048, '#c8eeff', 0, { d: H * 0.012, hi: 0.7, lw: 1, oc: '#1c3f8f' });
  enGloss(x, ox - H * 0.015, oy - H * 0.018, H * 0.015, H * 0.01, -0.5, 0.9);
} };

// 이무기 (위에서 본 모습, 오른쪽이 머리): 뿔 없는 거대한 검푸른 뱀. 긴 몸이 꿈틀거리며 머리와 등 일부만 물 위로 드러나고 나머지는 물속에 어른거림
EN_DRAW.imugi = { top: 1, f: function (x, H, p) {
  var a = p * Math.PI * 2, hh = H * 0.33, cy = e4Top(x, hh), N = 36, col = '#2c5d6e', lt = '#86cdb8', dk = '#14303c', K = Math.PI * 2 * 1.45, X0 = -H * 0.8, X1 = H * 0.42, i, C = [], Lp = [], Rp = [], em = [];
  EN_ONE = '#0e1a26';
  if (enMode === 2) enBBbox(x, -H * 0.86, cy - hh, H * 0.74, cy + hh, 0);
  for (i = 0; i <= N; i++) {
    var u = i / N, X = lerp(X0, X1, u), A = H * 0.17 * (1 - 0.72 * u * u), ph = u * K + a, Y = cy + Math.sin(ph) * A, dY = Math.cos(ph) * A * K / (X1 - X0), l = Math.hypot(1, dY);
    var hw = H * 0.098 * Math.min(1, 0.1 + u * 3.4) * (u > 0.82 ? lerp(1, 0.86, (u - 0.82) / 0.18) : 1);
    C.push([X, Y, hw]); Lp.push([X + dY / l * hw, Y - hw / l]); Rp.push([X - dY / l * hw, Y + hw / l]);
    em.push(u > 0.78 || Math.sin(u * K * 0.9 + a + 2.4) > -0.5);
  }
  // 물속에 잠긴 몸 (색칠 단계만, 흐리게)
  if (!enMode) {
    x.save(); x.globalAlpha = 0.45; x.fillStyle = '#123a52'; x.beginPath(); x.moveTo(Lp[0][0], Lp[0][1]);
    for (i = 1; i <= N; i++) x.lineTo(Lp[i][0], Lp[i][1]);
    for (i = N; i >= 0; i--) x.lineTo(Rp[i][0], Rp[i][1]);
    x.closePath(); x.fill();
    x.globalAlpha = 0.3; x.strokeStyle = '#9fe0d0'; x.lineWidth = Math.max(1, H * 0.014); x.beginPath(); for (i = 2; i <= N; i++) { if (i === 2) x.moveTo(C[i][0], C[i][1]); else x.lineTo(C[i][0], C[i][1]); } x.stroke();
    x.restore();
  }
  function run(s0, s1) {
    if (s1 - s0 < 2) return;
    var pts = [], j;
    for (j = s0; j <= s1; j++) pts.push(Lp[j]);
    for (j = s1; j >= s0; j--) pts.push(Rp[j]);
    if (!enMode) [s0, s1].forEach(function (q) { if (q >= N || q <= 0) return; x.save(); x.fillStyle = 'rgba(235,250,255,0.4)'; x.beginPath(); x.arc(C[q][0], C[q][1], C[q][2] * 1.35, 0, Math.PI * 2); x.fill(); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = Math.max(1, H * 0.016); x.setLineDash([H * 0.05, H * 0.04]); x.beginPath(); x.arc(C[q][0], C[q][1], C[q][2] * 1.5, 0, Math.PI * 2); x.stroke(); x.restore(); });
    var sh = e4Po(pts);
    e4F(x, sh, col, { d: H * 0.03, lw: 1.6, sk: 0.5 });
    e4Clip(x, sh, function () {
      x.lineJoin = 'round'; x.lineCap = 'butt';
      x.strokeStyle = rgba(dk, 0.7); x.lineWidth = Math.max(0.8, H * 0.012); x.beginPath(); for (j = s0; j <= s1; j++) { x.moveTo(Lp[j][0], Lp[j][1]); x.lineTo(Rp[j][0], Rp[j][1]); } x.stroke();
      x.strokeStyle = dk; x.lineWidth = H * 0.07; x.beginPath(); for (j = s0; j <= s1; j++) { if (j === s0) x.moveTo(C[j][0], C[j][1]); else x.lineTo(C[j][0], C[j][1]); } x.stroke();
      x.fillStyle = lt; for (j = Math.max(1, s0); j < s1; j++) { if (j % 2) continue; var qa = C[j - 1], qb = C[j + 1], qc = C[j], r = qc[2] * 0.42; x.beginPath(); x.moveTo(qa[0], qa[1]); x.lineTo(qc[0] + (qb[1] - qa[1]) * 0.5 * r / (H * 0.035), qc[1] - (qb[0] - qa[0]) * 0.5 * r / (H * 0.035)); x.lineTo(qb[0], qb[1]); x.lineTo(qc[0] - (qb[1] - qa[1]) * 0.5 * r / (H * 0.035), qc[1] + (qb[0] - qa[0]) * 0.5 * r / (H * 0.035)); x.closePath(); x.fill(); }
    });
  }
  var i0 = -1;
  for (i = 0; i <= N + 1; i++) { var e = i <= N && em[i]; if (e && i0 < 0) i0 = i; if (!e && i0 >= 0) { run(i0, i - 1); i0 = -1; } }
  // 머리
  var hd = C[N], pv = C[N - 3], ang = Math.atan2(hd[1] - pv[1], hd[0] - pv[0]) * 0.8, wv = Math.sin(a + 1) * H * 0.02;
  x.save(); x.translate(hd[0] - H * 0.03, hd[1]); x.rotate(ang); x.scale(1.15, 1.15);
  if (!enMode) { x.save(); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineCap = 'round'; x.lineWidth = Math.max(1, H * 0.018); [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(H * 0.2, sd * H * 0.06); x.quadraticCurveTo(H * 0.05, sd * H * 0.15, -H * 0.12, sd * H * 0.2); x.stroke(); }); x.restore(); }
  [-1, 1].forEach(function (sd) { e4Line(x, [[H * 0.2, sd * H * 0.035], [H * 0.23, sd * H * 0.13], [H * 0.08, sd * H * 0.165 + wv * sd]], Math.max(1.2, H * 0.016), '#eadfb6'); });
  var head = e4Bl([[-H * 0.08, -H * 0.075], [H * 0.02, -H * 0.118], [H * 0.12, -H * 0.088], [H * 0.21, -H * 0.052], [H * 0.255, 0], [H * 0.21, H * 0.052], [H * 0.12, H * 0.088], [H * 0.02, H * 0.118], [-H * 0.08, H * 0.075]]);
  e4F(x, head, col, { d: H * 0.03, lw: 1.7, sk: 0.5 });
  e4Clip(x, head, function () {
    x.fillStyle = lt; x.beginPath(); x.moveTo(-H * 0.1, -H * 0.022); x.quadraticCurveTo(H * 0.08, -H * 0.055, H * 0.2, 0); x.quadraticCurveTo(H * 0.08, H * 0.055, -H * 0.1, H * 0.022); x.closePath(); x.fill();
    x.fillStyle = dk; [-0.03, 0.035, 0.1].forEach(function (q) { x.beginPath(); x.ellipse(q * H, 0, H * 0.012, H * 0.022, 0, 0, Math.PI * 2); x.fill(); });
  });
  [-1, 1].forEach(function (sd) {
    e4Ov(x, -H * 0.02, sd * H * 0.08, H * 0.03, H * 0.022, lt, 0, { d: 0, lw: 0.9 });
    if (enMode) return;
    var ex = H * 0.1, ey = sd * H * 0.06;
    x.fillStyle = '#ffd94a'; x.strokeStyle = '#0e1a26'; x.lineWidth = Math.max(0.9, H * 0.012); x.beginPath(); x.ellipse(ex, ey, H * 0.036, H * 0.023, sd * 0.4, 0, Math.PI * 2); x.fill(); x.stroke();
    x.fillStyle = '#0e1a26'; x.beginPath(); x.ellipse(ex + H * 0.004, ey, H * 0.022, H * 0.007, sd * 0.4, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(H * 0.215, sd * H * 0.022, Math.max(0.6, H * 0.008), 0, Math.PI * 2); x.fill();
    enEyeRec(x, ex, ey, H * 0.03, H * 0.022, sd);
  });
  enGlow(x, H * 0.1, 0, H * 0.16, '#ffe07a', 0.3);
  x.restore();
} };

// 용 (하늘, 옆모습): 청룡. 구불구불 물결치는 긴 몸, 사슴뿔, 붉은 갈기와 등지느러미, 누런 배 비늘, 긴 수염, 세 발톱, 입 앞의 불타는 여의주
EN_DRAW.yong = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, N = 26, col = '#2f7dc0', bel = '#f3cf6a', fin = '#e2523a', horn = '#f6e7bd', dk = '#16305e', K = Math.PI * 2 * 1.2, X0 = -H * 0.66, X1 = H * 0.22, i, C = [], T = [], B = [];
  EN_ONE = '#14203c';
  for (i = 0; i <= N; i++) {
    var u = i / N, X = lerp(X0, X1, u), A = H * 0.19 * (1 - 0.55 * u), ph = u * K + a, Y = -H * 0.44 - H * 0.14 * u * u + Math.sin(ph) * A;
    var dY = (Math.cos(ph) * A * K - H * 0.28 * u) / (X1 - X0), l = Math.hypot(1, dY), hw = H * 0.092 * Math.min(1, 0.12 + u * 3.5) * (u > 0.85 ? lerp(1, 0.85, (u - 0.85) / 0.15) : 1);
    C.push([X, Y, hw, dY, l]); T.push([X + dY / l * hw, Y - hw / l]); B.push([X - dY / l * hw, Y + hw / l]);
  }
  // 다리: 위 마디 + 발 + 세 발톱 (far 먼 쪽)
  function leg(k, far, po) {
    var c = C[k], bx = lerp(c[0], B[k][0], 0.5) + (far ? H * 0.03 : 0), by = lerp(c[1], B[k][1], 0.5), th = 0.55 + Math.sin(a + po) * 0.4, cl = far ? enShd(col, 0.3) : col;
    var kx = bx + Math.sin(th) * H * 0.085, ky = by + Math.cos(th) * H * 0.085, fx = kx + Math.sin(th + 1.0) * H * 0.065, fy = ky + Math.cos(th + 1.0) * H * 0.065;
    e4Pill(x, [bx, by], [kx, ky], H * 0.062, H * 0.045, cl); e4Pill(x, [kx, ky], [fx, fy], H * 0.045, H * 0.036, cl);
    for (var j = -1; j <= 1; j++) { var ca = th + 1.3 + j * 0.55; e4Line(x, [[fx, fy], [fx + Math.sin(ca) * H * 0.05, fy + Math.cos(ca) * H * 0.05]], Math.max(1.1, H * 0.016), horn); }
    e4Ov(x, fx, fy, H * 0.026, H * 0.024, cl, 0, { d: 0, lw: 0.8 });
  }
  var kf = Math.round(N * 0.76), kh = Math.round(N * 0.36);
  leg(kf, 1, 1.5); leg(kh, 1, 4.2);
  // 꼬리 끝 불꽃 털
  e4F(x, e4Mane(C[0][0] + H * 0.02, C[0][1], Math.PI - 0.9 + Math.atan(C[1][3]), Math.PI + 0.9 + Math.atan(C[1][3]), H * 0.03, H * 0.14, 4, a), fin, { d: 0, lw: 1.1 });
  // 등지느러미: 뒤로 누운 톱니
  var fp = [T[2]], j;
  for (i = 2; i < N - 1; i++) { var c0 = C[i], mx = (T[i][0] + T[i + 1][0]) / 2, my = (T[i][1] + T[i + 1][1]) / 2; fp.push([mx + c0[3] / c0[4] * H * 0.07 - H * 0.045 / c0[4], my - H * 0.07 / c0[4] - c0[3] / c0[4] * H * 0.045]); fp.push(T[i + 1]); }
  for (j = N - 1; j >= 2; j--) fp.push([C[j][0], C[j][1]]);
  e4F(x, e4Po(fp), fin, { d: 0, lw: 1.1, hi: 0.3 });
  // 몸
  var bp = [];
  for (i = 0; i <= N; i++) bp.push(T[i]);
  for (i = N; i >= 0; i--) bp.push(B[i]);
  var body = e4Po(bp);
  e4F(x, body, col, { d: H * 0.028, lw: 1.7, sk: 0.45 });
  e4Clip(x, body, function () {
    // 배 비늘 띠
    x.fillStyle = bel; x.beginPath(); x.moveTo(B[0][0], B[0][1]);
    for (i = 1; i <= N; i++) x.lineTo(B[i][0], B[i][1]);
    for (i = N; i >= 0; i--) x.lineTo(lerp(C[i][0], B[i][0], 0.36), lerp(C[i][1], B[i][1], 0.36));
    x.closePath(); x.fill();
    x.strokeStyle = rgba('#8a5a1c', 0.7); x.lineWidth = Math.max(0.8, H * 0.01); x.beginPath(); for (i = 1; i <= N; i++) { x.moveTo(B[i][0], B[i][1]); x.lineTo(lerp(C[i][0], B[i][0], 0.36), lerp(C[i][1], B[i][1], 0.36)); } x.stroke();
    // 등 비늘 (꼬리 쪽으로 볼록한 호), 등줄기 빛
    x.strokeStyle = rgba(dk, 0.6); x.lineWidth = Math.max(0.8, H * 0.011);
    x.beginPath(); for (i = 2; i <= N; i++) { var c1 = C[i], th = Math.atan(c1[3]), sx = lerp(c1[0], T[i][0], i % 2 ? 0.15 : 0.6) + Math.cos(th) * c1[2] * 0.3, sy = lerp(c1[1], T[i][1], i % 2 ? 0.15 : 0.6) + Math.sin(th) * c1[2] * 0.3, r1 = c1[2] * 0.42; x.moveTo(sx + Math.cos(th + Math.PI - 1.1) * r1, sy + Math.sin(th + Math.PI - 1.1) * r1); x.arc(sx, sy, r1, th + Math.PI - 1.1, th + Math.PI + 1.1); } x.stroke();
    x.strokeStyle = 'rgba(190,235,255,0.5)'; x.lineWidth = Math.max(1, H * 0.014); x.beginPath(); for (i = 1; i <= N; i++) { var qx = lerp(C[i][0], T[i][0], 0.78), qy = lerp(C[i][1], T[i][1], 0.78); if (i === 1) x.moveTo(qx, qy); else x.lineTo(qx, qy); } x.stroke();
  });
  leg(kf, 0, 0); leg(kh, 0, 2.7);
  // 머리
  var hd = C[N], wv = Math.sin(a + 0.6) * H * 0.02, jo = H * (0.014 + 0.008 * Math.sin(a));
  x.save(); x.translate(hd[0] - H * 0.02, hd[1]); x.rotate(Math.atan(hd[3]) * 0.5 - 0.06); x.scale(1.22, 1.22);
  // 먼 뿔, 먼 수염
  e4Line(x, [[H * 0.05, -H * 0.06], [H * 0.02, -H * 0.16], [-H * 0.08, -H * 0.21]], H * 0.026, enShd(horn, 0.25));
  e4Line(x, [[H * 0.22, -H * 0.05], [H * 0.34, -H * 0.11 - wv], [H * 0.27, -H * 0.2 - wv * 0.5]], Math.max(1.1, H * 0.013), enShd(horn, 0.2));
  // 갈기
  e4F(x, e4Mane(-H * 0.02, -H * 0.02, 1.9, 4.5, H * 0.07, H * 0.22, 6, a), fin, { d: H * 0.02, lw: 1.2, hi: 0.3 });
  // 턱수염, 입속, 아래턱
  e4F(x, e4Mane(H * 0.03, H * 0.07, 0.7, 2.5, H * 0.03, H * 0.1, 3, a + 1), fin, { d: 0, lw: 0.9 });
  e4F(x, e4Bl([[-H * 0.02, H * 0.02], [H * 0.2, H * 0.015], [H * 0.18, H * 0.06 + jo], [0, H * 0.075]]), '#8a1f2e', { d: 0, lw: 0.9 });
  e4F(x, e4Bl([[-H * 0.05, H * 0.045], [H * 0.06, H * 0.04 + jo * 0.5], [H * 0.19, H * 0.035 + jo], [H * 0.175, H * 0.066 + jo], [H * 0.05, H * 0.09 + jo * 0.5], [-H * 0.06, H * 0.088]]), bel, { d: H * 0.012, lw: 1.1 });
  // 가까운 뿔 (가지 하나)
  e4Line(x, [[H * 0.01, -H * 0.07], [-H * 0.03, -H * 0.17], [-H * 0.15, -H * 0.215]], H * 0.03, horn);
  e4Line(x, [[-H * 0.035, -H * 0.14], [-H * 0.03, -H * 0.2], [H * 0.01, -H * 0.245]], H * 0.022, horn);
  var head = e4Bl([[-H * 0.095, -H * 0.03], [-H * 0.05, -H * 0.098], [H * 0.03, -H * 0.105], [H * 0.1, -H * 0.072], [H * 0.17, -H * 0.062], [H * 0.235, -H * 0.05], [H * 0.255, -H * 0.012], [H * 0.2, H * 0.022], [H * 0.08, H * 0.03], [-H * 0.02, H * 0.066], [-H * 0.095, H * 0.05]]);
  e4F(x, head, col, { d: H * 0.025, lw: 1.6, sk: 0.45 });
  e4Ov(x, H * 0.225, -H * 0.04, H * 0.032, H * 0.027, enLit(col, 0.2), 0, { d: H * 0.008, lw: 0.9 });
  if (!enMode) {
    x.fillStyle = '#fffaf0'; x.strokeStyle = '#14203c'; x.lineWidth = Math.max(0.6, H * 0.007);
    [[0.2, 0.03], [0.165, 0.022], [0.13, 0.02], [0.095, 0.02]].forEach(function (q, n) { var tx = q[0] * H, ty = H * 0.022, tl = H * (n ? q[1] : 0.034); x.beginPath(); x.moveTo(tx - H * 0.012, ty); x.lineTo(tx, ty + tl); x.lineTo(tx + H * 0.012, ty); x.closePath(); x.fill(); x.stroke(); });
    x.fillStyle = '#14203c'; x.beginPath(); x.arc(H * 0.238, -H * 0.04, Math.max(0.6, H * 0.008), 0, Math.PI * 2); x.fill();
    e4Eye(x, H * 0.075, -H * 0.042, H * 0.032, H * 0.026, { w: '#ffe24a', pc: '#14203c', pr: 0.5, px: 0.3, sd: -1 });
    e4Brush(x, [-H * 0.01, -H * 0.09], [H * 0.07, -H * 0.1], [H * 0.135, -H * 0.055], H * 0.034, H * 0.012, dk);
  }
  // 가까운 수염: 길게 흘러 뒤로 말림
  e4Line(x, [[H * 0.235, -H * 0.02], [H * 0.37, H * 0.02 + wv], [H * 0.3, H * 0.15 + wv * 0.6]], Math.max(1.3, H * 0.017), horn);
  x.restore();
  // 여의주: 불타는 구슬
  var ox = hd[0] + H * 0.43, oy = hd[1] + H * 0.09 + Math.sin(a) * H * 0.014;
  enGlow(x, ox, oy, H * 0.2, '#ffe07a', 0.7);
  e4F(x, enFlameS(ox - H * 0.012, oy + H * 0.02, H * 0.085, H * 0.17 + Math.sin(a * 2) * H * 0.012, -0.75), '#ff8a2a', { d: 0, lw: 0.9, hi: 0.4 });
  e4F(x, enFlameS(ox + H * 0.02, oy + H * 0.035, H * 0.05, H * 0.1, -0.5), '#ffc23a', { d: 0, lw: 0.8, hi: 0.4 });
  e4Ov(x, ox, oy, H * 0.05, H * 0.05, '#fff4c8', 0, { d: H * 0.012, hi: 0.7, lw: 1.1 });
  enGloss(x, ox - H * 0.016, oy - H * 0.018, H * 0.016, H * 0.01, -0.5, 0.95);
} };
