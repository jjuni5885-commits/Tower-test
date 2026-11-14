// ===== art_tower2.js : v2.0 새 탑 7종 그림 (대공포, 유도탄 포대, 기관포탑, 저격탑, 다연장 로켓, 레이저 탑, 테슬라 코일) =====
// 방식: 장난감 디오라마. 받침(콘크리트, 강철 포대)은 spr에서 한 번 굽고, 포탑은 작은 입체 조각(상자, 원통, 공, 판)으로 짜서
//       조준 방향 32조각마다 한 번씩 구워 둔 그림을 parts에서 옮겨 그린다(매 프레임 그라디언트, 경로 계산 없음).
// 좌표: 포탑 기준 u(앞, 조준 방향), v(옆), w(위). 단위는 탑 크기 U(= 칸 한 변 x 단계 배율). 화면 = (x, y * 0.6 - z * 0.8)
// 다른 갈래가 알아 둘 것
//  - 쓰는 탑 상태: t.aim, t.fireT(0.35 기준), t.shots, t.spin(라디안으로 가정), t.busy, t.frozenT, t.st.rate, t.id. 전부 없어도 가만히 선 모습으로 그린다
//    (t.shots가 없으면 fireT가 다시 커지는 순간을 세고, t.spin이 없으면 fireT 동안 스스로 돌린다)
//  - 메뉴 아이콘(g 없음)과 아직 한 번도 쏘지 않은 탑은 앞쪽 비스듬한 자세(0.62 라디안), 2.2초 넘게 쏘지 않으면 좌우로 천천히 살핀다
//  - 로켓: 0.45초 넘게 쉬었다가 shots가 늘면 새 일제 사격으로 보고 발사관을 차례로 비운다(shots를 로켓마다 올려도, 일제 사격마다 한 번 올려도 됨)
//  - 유도탄: shots가 1 늘 때마다 발사대(칸) 하나가 비고 재장전 시간의 0.75배(0.5~2.2초) 뒤에 다시 찬다
//  - 실제 포구 위치: towerSpr(...)가 돌려준 info.muzzle(t) → { x, y } (탑 기준점에서 px, 지금 쏘는 포신). info.mounts[0]은 포 높이의 가운데 한 점
//  - 탑 스킨(berry, star)은 새 탑 색에 반영하지 않는다
//  - 시험: python3 tools/tw2shot.py sheet|aim|fire|icons|perf|battle [키 또는 all] [S] [맵] → shots/tw2_*.png
var T2_SQ = 0.6, T2_CZ = 0.8, T2_NB = 32, T2_LD = [-0.42, 0.36, 0.83];
var T2_KS = [1, 0.96, 1.0, 1.04, 1.08, 1.12, 1.17]; // 단계별 크기
var t2IW = 1.5; // 지금 굽는 그림의 외곽선 굵기
var T2_O = {};
var T2C = { conc: '#dccfbb', concD: '#b7a690', steel: '#a3aecb', steelD: '#76809f', gun: '#6b7496', dark: '#484d70', brass: '#eab750', white: '#f6f2ea', red: '#f0604e', amber: '#ffc440', cyan: '#6fe3ff',
  sand: '#dcbb80', wood: '#c08a55', olive: '#8a9c6a', glass: '#9fe6ff', gold: '#ffd24a', black: '#2c2a40' };
var T2_TONE = {};
var T2_ST = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
var T2_LOOK = {};
// 색 한 벌: [밝은 면, 기본, 그늘, 외곽선]
function t2Tone(c) { var t = T2_TONE[c]; if (!t) t = T2_TONE[c] = [mixc(c, '#fff8ea', 0.36), c, mixc(c, '#47306e', 0.36), mixc(c, '#26152f', 0.76)]; return t; }
// 대표색을 조금 더 선명하게(작은 화면에서 탑마다 색으로 구별)
function t2Viv(c, k) { var A = hx(c), m = (A[0] + A[1] + A[2]) / 3; k = k || 1.45; return hexOf(m + (A[0] - m) * k, m + (A[1] - m) * k, m + (A[2] - m) * k); }
// ---------- 작은 입체 투영 ----------
function t2T(a, e, ep, oz) { return { ca: Math.cos(a), sa: Math.sin(a), ce: Math.cos(e || 0), se: Math.sin(e || 0), pu: ep ? ep[0] : 0, pw: ep ? ep[1] : 0, oz: oz || 0, x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; }
// 포탑 좌표 → [화면 x, 화면 y, 깊이, 세계 x, y, z] (단위 U)
function t2P(T, u, v, w) {
  var du = u - T.pu, dw = w - T.pw, u2 = T.pu + du * T.ce - dw * T.se, w2 = T.pw + du * T.se + dw * T.ce;
  var X = u2 * T.ca - v * T.sa, Y = u2 * T.sa + v * T.ca, Z = w2 + T.oz;
  return [X, Y * T2_SQ - Z * T2_CZ, Y * T2_CZ + Z * T2_SQ, X, Y, Z];
}
function t2BB(T, x, y, m) { if (x - m < T.x0) T.x0 = x - m; if (y - m < T.y0) T.y0 = y - m; if (x + m > T.x1) T.x1 = x + m; if (y + m > T.y1) T.y1 = y + m; }
function t2Face(x, S, fill, ink, lw) {
  x.beginPath(); x.moveTo(S[0][0], S[0][1]); for (var i = 1; i < S.length; i++) x.lineTo(S[i][0], S[i][1]); x.closePath();
  x.fillStyle = fill; x.fill(); if (ink) { x.strokeStyle = ink; x.lineWidth = lw; x.stroke(); }
}
// 면의 밝기 단계: 세계 좌표 점 3개로 법선을 구해 보이는지와 색을 정함. 안 보이면 -1
function t2Lit(W0, W1, W3) {
  var ax = W1[3] - W0[3], ay = W1[4] - W0[4], az = W1[5] - W0[5], bx = W3[3] - W0[3], by = W3[4] - W0[4], bz = W3[5] - W0[5];
  var nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= l; ny /= l; nz /= l;
  var vis = ny * T2_CZ + nz * T2_SQ, b = nx * T2_LD[0] + ny * T2_LD[1] + nz * T2_LD[2];
  return [vis, b];
}
function t2ToneOf(b) { return b > 0.5 ? 0 : b > -0.05 ? 1 : 2; }
// ['box', u, v, w, 길이, 너비, 높이, 색, { tu, tv: 윗면 축소, ts: 윗면 앞뒤 밀기, stripe: 윗면 띠 색, zb }]
function t2CmdBox(T, U, p) {
  var o = p[8] || T2_O, hu = p[4] / 2, hv = p[5] / 2, hw = p[6] / 2, tn = t2Tone(p[7]), P = [], i, iw = t2IW;
  for (i = 0; i < 8; i++) {
    var top = i & 4, ku = top && o.tu != null ? o.tu : 1, kv = top && o.tv != null ? o.tv : 1;
    var q = t2P(T, p[1] + (i & 1 ? hu : -hu) * ku + (top ? o.ts || 0 : 0), p[2] + (i & 2 ? hv : -hv) * kv, p[3] + (top ? hw : -hw));
    q[0] *= U; q[1] *= U; P.push(q); t2BB(T, q[0], q[1], iw);
  }
  var F = [[1, 3, 7, 5], [0, 4, 6, 2], [2, 6, 7, 3], [0, 1, 5, 4], [4, 5, 7, 6], [0, 2, 3, 1]], faces = [], c = t2P(T, p[1], p[2], p[3]), stripe = null;
  F.forEach(function (f, fi) {
    var lv = t2Lit(P[f[0]], P[f[1]], P[f[3]]); if (lv[0] <= 0.01) return;
    faces.push([[P[f[0]], P[f[1]], P[f[2]], P[f[3]]], tn[t2ToneOf(lv[1])]]);
    if (fi === 4 && o.stripe) { var a = P[4], b = P[5], cc = P[7], d = P[6], m = function (p0, p1, t) { return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]; }; stripe = [m(a, d, 0.32), m(b, cc, 0.32), m(b, cc, 0.68), m(a, d, 0.68)]; }
  });
  return { d: c[2] + (o.zb || 0), f: function (x) {
    for (var k = 0; k < faces.length; k++) t2Face(x, faces[k][0], faces[k][1], tn[3], iw);
    if (stripe) t2Face(x, stripe, o.stripe, null);
  } };
}
// ['cyl', u0, v0, w0, u1, v1, w1, r0, r1, 색, { hole: 끝(B)에 구멍, cap: 가까운 끝 색, zb }]  방향이 자유로운 원통(포신, 통, 기둥)
function t2CmdCyl(T, U, p) {
  var A = t2P(T, p[1], p[2], p[3]), B = t2P(T, p[4], p[5], p[6]), r0 = p[7] * U, r1 = p[8] * U, tn = t2Tone(p[9]), o = p[10] || T2_O, iw = t2IW;
  var ax = A[0] * U, ay = A[1] * U, bx = B[0] * U, by = B[1] * U, dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy);
  var wx = B[3] - A[3], wy = B[4] - A[4], wz = B[5] - A[5], wl = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1, cg = (wy * T2_CZ + wz * T2_SQ) / wl, ec = Math.abs(cg);
  var ang = L > 0.05 ? Math.atan2(dy, dx) : 0, nx = L > 0.05 ? -dy / L : 0, ny = L > 0.05 ? dx / L : -1;
  if (nx * 0.5 + ny * 0.85 > 0) { nx = -nx; ny = -ny; } // n = 밝은 쪽(왼쪽 위)
  var m = Math.max(r0, r1) + iw; t2BB(T, ax, ay, m); t2BB(T, bx, by, m);
  var nearB = cg >= 0, fx = nearB ? ax : bx, fy = nearB ? ay : by, fr = nearB ? r0 : r1, qx = nearB ? bx : ax, qy = nearB ? by : ay, qr = nearB ? r1 : r0;
  return { d: (A[2] + B[2]) / 2 + (o.zb || 0), f: function (x) {
    x.strokeStyle = tn[3]; x.lineWidth = Math.min(iw, Math.max(0.7, fr * 0.38)); // 작은 조각은 외곽선도 가늘게(뭉개짐 방지)
    x.beginPath(); x.ellipse(fx, fy, Math.max(0.4, fr * ec), Math.max(0.4, fr), ang, 0, 6.2832); x.fillStyle = o.far || (qr < fr - 0.5 ? tn[1] : tn[2]); x.fill(); x.stroke(); // 이쪽으로 좁아지는 원뿔이면 옆면이 보이는 것
    if (L > 0.6) {
      x.beginPath(); x.moveTo(ax + nx * r0, ay + ny * r0); x.lineTo(bx + nx * r1, by + ny * r1); x.lineTo(bx - nx * r1, by - ny * r1); x.lineTo(ax - nx * r0, ay - ny * r0); x.closePath(); x.fillStyle = tn[1]; x.fill();
      x.beginPath(); x.moveTo(ax - nx * r0, ay - ny * r0); x.lineTo(bx - nx * r1, by - ny * r1); x.lineTo(bx - nx * r1 * 0.34, by - ny * r1 * 0.34); x.lineTo(ax - nx * r0 * 0.34, ay - ny * r0 * 0.34); x.closePath(); x.fillStyle = tn[2]; x.fill();
      x.beginPath(); x.moveTo(ax + nx * r0 * 0.74, ay + ny * r0 * 0.74); x.lineTo(bx + nx * r1 * 0.74, by + ny * r1 * 0.74); x.lineTo(bx + nx * r1 * 0.36, by + ny * r1 * 0.36); x.lineTo(ax + nx * r0 * 0.36, ay + ny * r0 * 0.36); x.closePath(); x.fillStyle = tn[0]; x.fill();
      x.lineWidth = Math.min(iw, Math.max(0.8, Math.max(r0, r1) * 0.7));
      x.beginPath(); x.moveTo(ax + nx * r0, ay + ny * r0); x.lineTo(bx + nx * r1, by + ny * r1); x.moveTo(ax - nx * r0, ay - ny * r0); x.lineTo(bx - nx * r1, by - ny * r1); x.stroke();
    }
    x.lineWidth = Math.min(iw, Math.max(0.7, qr * 0.38));
    x.beginPath(); x.ellipse(qx, qy, Math.max(0.4, qr * ec), Math.max(0.4, qr), ang, 0, 6.2832); x.fillStyle = o.cap || tn[0]; x.fill(); x.stroke();
    if (o.hole && nearB) { x.beginPath(); x.ellipse(qx, qy, Math.max(0.3, qr * ec * 0.58), Math.max(0.3, qr * 0.58), ang, 0, 6.2832); x.fillStyle = tn[3]; x.fill(); }
  } };
}
// ['sph', u, v, w, r, 색, { dome: 반구, glow: 빛 색(표식등), zb }]
function t2CmdSph(T, U, p) {
  var c = t2P(T, p[1], p[2], p[3]), r = p[4] * U, tn = t2Tone(p[5]), o = p[6] || T2_O, cx = c[0] * U, cy = c[1] * U, iw = t2IW;
  t2BB(T, cx, cy, r + iw + (o.glow ? r * 2.2 : 0));
  return { d: c[2] + (o.zb || 0), f: function (x) {
    if (o.glow) { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy, r * 3, o.glow, 0.6); x.restore(); }
    x.save(); x.beginPath();
    if (o.dome) { x.ellipse(cx, cy, r, r, 0, Math.PI, 6.2832); x.ellipse(cx, cy, r, r * T2_SQ, 0, 0, Math.PI); } else x.arc(cx, cy, r, 0, 6.2832);
    x.fillStyle = tn[2]; x.fill(); x.clip();
    x.fillStyle = tn[1]; x.beginPath(); x.arc(cx - r * 0.16, cy - r * 0.2, r * 0.84, 0, 6.2832); x.fill();
    x.fillStyle = tn[0]; x.beginPath(); x.arc(cx - r * 0.3, cy - r * 0.36, r * 0.46, 0, 6.2832); x.fill();
    x.fillStyle = '#ffffff'; x.globalAlpha = o.glow ? 0.95 : 0.8; x.beginPath(); x.arc(cx - r * 0.34, cy - r * 0.4, r * (o.glow ? 0.3 : 0.17), 0, 6.2832); x.fill();
    x.restore();
    x.beginPath(); if (o.dome) { x.ellipse(cx, cy, r, r, 0, Math.PI, 6.2832); x.ellipse(cx, cy, r, r * T2_SQ, 0, 0, Math.PI); } else x.arc(cx, cy, r, 0, 6.2832);
    x.strokeStyle = tn[3]; x.lineWidth = Math.min(iw, Math.max(0.7, r * 0.42)); x.stroke();
  } };
}
// ['poly', [[u, v, w]...], 색, { two: 양면, flat: 명암 없이, noink, zb }]
function t2CmdPoly(T, U, p) {
  var pts = p[1], tn = t2Tone(p[2]), o = p[3] || T2_O, S = [], d = 0, i, iw = t2IW;
  for (i = 0; i < pts.length; i++) { var q = t2P(T, pts[i][0], pts[i][1], pts[i][2]); q[0] *= U; q[1] *= U; S.push(q); d += q[2]; t2BB(T, q[0], q[1], iw); }
  var lv = t2Lit(S[0], S[1], S[S.length - 1]), b = lv[1];
  if (lv[0] <= 0.005) { if (!o.two) return null; b = -b; }
  var fill = o.flat ? tn[1] : tn[t2ToneOf(b)];
  return { d: d / pts.length + (o.zb || 0), f: function (x) { t2Face(x, S, fill, o.noink ? null : tn[3], iw * (o.lw || 1)); } };
}
// ['hoop', u, v, w, r, 색, 굵기, half(0 뒤쪽 반, 1 앞쪽 반)]  수평 고리(난간, 번개 고리 틀)
function t2CmdHoop(T, U, p) {
  var c = t2P(T, p[1], p[2], p[3]), r = p[4] * U, tn = t2Tone(p[5]), lw = p[6] * U, half = p[7], cx = c[0] * U, cy = c[1] * U, iw = t2IW;
  t2BB(T, cx, cy, r + lw + iw);
  return { d: c[2] + (half ? 0.4 : -0.4), f: function (x) {
    x.beginPath(); x.ellipse(cx, cy, r, r * T2_SQ, 0, half ? 0 : Math.PI, half ? Math.PI : 6.2832);
    x.strokeStyle = tn[3]; x.lineWidth = lw + iw * 1.6; x.stroke(); x.strokeStyle = tn[half ? 1 : 2]; x.lineWidth = lw; x.stroke();
    x.beginPath(); x.ellipse(cx, cy - lw * 0.22, r, r * T2_SQ, 0, half ? 0.5 : Math.PI + 0.4, half ? Math.PI - 1.2 : 6.2832 - 1.4); x.strokeStyle = tn[0]; x.lineWidth = lw * 0.4; x.stroke();
  } };
}
// ['dots', [[u, v, w]...], r, 색, axis(0 앞, 3 뒤), n각, { zb, ink }]  같은 방향의 구멍 여러 개를 한 번에 칠함(발사관)
function t2CmdDots(T, U, p) {
  var cs = p[1], r = p[2], tn = t2Tone(p[3]), back = p[4] === 3, n = p[5] || 8, o = p[6] || T2_O, i, k, d = 0, iw = t2IW, P = [];
  if (!cs.length) return null;
  var q0 = t2P(T, cs[0][0], cs[0][1], cs[0][2]), q1 = t2P(T, cs[0][0] + (back ? -1 : 1), cs[0][1], cs[0][2]);
  if ((q1[4] - q0[4]) * T2_CZ + (q1[5] - q0[5]) * T2_SQ <= 0.02) return null; // 등을 돌린 면
  for (i = 0; i < cs.length; i++) { var pts = []; for (k = 0; k < n; k++) { var a = k / n * 6.2832 + (o.a0 || 0), q = t2P(T, cs[i][0], cs[i][1] + Math.cos(a) * r, cs[i][2] + Math.sin(a) * r); pts.push(q[0] * U, q[1] * U); if (!k) d += q[2]; t2BB(T, q[0] * U, q[1] * U, iw); } P.push(pts); }
  return { d: d / cs.length + (o.zb || 0), f: function (x) {
    x.beginPath(); for (var i = 0; i < P.length; i++) { var pt = P[i]; x.moveTo(pt[0], pt[1]); for (var k = 2; k < pt.length; k += 2) x.lineTo(pt[k], pt[k + 1]); x.closePath(); }
    x.fillStyle = o.flat ? tn[1] : tn[3]; x.fill(); if (o.ink) { x.strokeStyle = tn[3]; x.lineWidth = iw * 0.6; x.stroke(); }
  } };
}
function t2Cmds(prims, T, U) {
  var out = [], c, p;
  for (var i = 0; i < prims.length; i++) {
    p = prims[i]; if (!p) continue;
    c = p[0] === 'box' ? t2CmdBox(T, U, p) : p[0] === 'cyl' ? t2CmdCyl(T, U, p) : p[0] === 'sph' ? t2CmdSph(T, U, p) : p[0] === 'hoop' ? t2CmdHoop(T, U, p) : p[0] === 'dots' ? t2CmdDots(T, U, p) : t2CmdPoly(T, U, p);
    if (c) out.push(c);
  }
  out.sort(function (a, b) { return a.d - b.d; });
  return out;
}
// 고정 그림(받침, 소품)을 곧장 그림: x는 땅 기준점으로 옮겨 둔 상태
function t2Draw(x, prims, U, a) {
  var T = t2T(a || 0, 0, null, 0), cm = t2Cmds(prims, T, U);
  x.lineJoin = 'round'; x.lineCap = 'round';
  for (var i = 0; i < cm.length; i++) cm[i].f(x);
}
// ---------- 조각 만들기 도우미 ----------
// 포신: u0에서 앞으로 len. o.mz 포구 제동기 길이, o.mk 굵기 배율, o.jk 뿌리 덧통 길이, o.jc 덧통 색, o.fl 나팔 소염기
function t2Brl(P, u0, v, w, len, r, col, o) {
  o = o || T2_O; var mz = o.mz || 0, e = u0 + len;
  if (o.jk) P.push(['cyl', u0, v, w, u0 + o.jk, v, w, r * 1.5, r * 1.5, o.jc || col]);
  P.push(['cyl', u0 + (o.jk || 0) * 0.9, v, w, e - mz, v, w, r, r * 0.92, col, mz ? null : { hole: 1 }]);
  if (o.fl) P.push(['cyl', e - mz, v, w, e, v, w, r * 0.95, r * (o.mk || 1.7), o.mc || T2C.dark, { hole: 1 }]);
  else if (mz) P.push(['cyl', e - mz, v, w, e, v, w, r * (o.mk || 1.6), r * (o.mk || 1.6), o.mc || T2C.dark, { hole: 1 }]);
}
// 원판(구멍, 렌즈): axis 0 = 앞(+u)을 봄, 2 = 위(+w)를 봄
function t2Disc(u, v, w, r, col, axis, o) {
  var pts = [], n = (o && o.n) || 10;
  for (var i = 0; i < n; i++) { var a = (i / n * 6.2832 + ((o && o.a0) || 0)) * (axis === 3 ? -1 : 1), c = Math.cos(a) * r, s = Math.sin(a) * r; pts.push(axis === 2 ? [u + c, v + s, w] : [u, v + c, w + s]); }
  return ['poly', pts, col, o];
}
// 미사일: u0(꼬리)에서 앞으로 len. o.body, nose, fin, band 색, o.nl 코 길이 비율, o.boost 굵은 1단, o.fk 날개 크기
function t2Msl(P, u0, v, w, len, r, o) {
  o = o || T2_O; var C = T2C, bc = o.body || C.white, nc = o.nose || C.red, fc = o.fin || nc, e = u0 + len, ub = e - len * (o.nl || 0.24), fw = r * (o.fk || 2.6), fl = len * 0.2, m0 = u0;
  P.push(['poly', [[u0 - 0.01, v, w - fw], [u0 + fl, v, w - r * 0.6], [u0 + fl, v, w + r * 0.6], [u0 - 0.01, v, w + fw]], fc, { two: 1 }]);
  P.push(['poly', [[u0 - 0.01, v - fw, w], [u0 + fl, v - r * 0.6, w], [u0 + fl, v + r * 0.6, w], [u0 - 0.01, v + fw, w]], fc, { two: 1 }]);
  P.push(['cyl', u0 - 0.03, v, w, u0, v, w, r * 0.6, r * 0.78, C.dark]);
  if (o.boost) { P.push(['cyl', u0, v, w, u0 + len * 0.26, v, w, r * 1.3, r * 1.3, bc]); P.push(['cyl', u0 + len * 0.26, v, w, u0 + len * 0.33, v, w, r * 1.3, r, o.band || nc]); m0 = u0 + len * 0.33; }
  P.push(['cyl', m0, v, w, u0 + len * 0.5, v, w, r, r, bc]);
  P.push(['cyl', u0 + len * 0.5, v, w, u0 + len * 0.57, v, w, r * 1.05, r * 1.05, o.band || nc]);
  P.push(['cyl', u0 + len * 0.57, v, w, ub, v, w, r, r, bc]);
  P.push(['cyl', ub, v, w, e, v, w, r, r * 0.12, nc]);
}
// 쌓은 원통(띠 있는 받침): segs = [[높이, 반지름, 색, 윗 반지름]...] → 끝 높이
function t2Stack(P, u, v, w, segs) { segs.forEach(function (s) { P.push(['cyl', u, v, w, u, v, w + s[0], s[1], s[3] == null ? s[1] : s[3], s[2]]); w += s[0]; }); return w; }
function t2Lamp(u, v, w, r, col) { return ['sph', u, v, w, r, col, { glow: col }]; }
// ---------- 받침: 단계가 오를수록 커지고 장갑판과 표식등이 붙는다 ----------
// 돌려주는 값: { b: 뒤 조각, f: 앞 조각, pz: 윗면 높이 }
function t2Base(L, B, col) {
  var b = [], f = [], C = T2C, pz, i, a;
  if (L === 1) pz = t2Stack(b, 0, 0, 0, [[0.06, 0.45, C.conc], [0.035, 0.31, C.steel]]);
  else if (L === 2) {
    pz = t2Stack(b, 0, 0, 0, [[0.12, 0.47, C.conc], [0.04, 0.35, C.steel]]);
    for (i = 0; i < 6; i++) { a = i / 6 * 6.2832 + 0.5; b.push(['sph', Math.cos(a) * 0.41, Math.sin(a) * 0.41, 0.12, 0.022, C.steelD]); }
  } else if (L === 3) {
    pz = t2Stack(b, 0, 0, 0, [[0.05, 0.49, C.conc], [0.045, 0.505, col], [0.075, 0.49, C.conc], [0.045, 0.37, C.steel]]);
    for (i = 0; i < 8; i++) { a = i / 8 * 6.2832 + 0.4; b.push(['sph', Math.cos(a) * 0.43, Math.sin(a) * 0.43, 0.17, 0.022, C.steelD]); }
    [-1, 1].forEach(function (sd) { f.push(t2Lamp(sd * 0.4, 0.27, 0.19, 0.035, C.amber)); });
  } else {
    var st = B ? C.sand : C.steel, tr = L === 6 ? C.gold : B ? C.amber : C.cyan, r = 0.465 + (L - 4) * 0.012, h = 0.07 + (L - 4) * 0.012;
    pz = t2Stack(b, 0, 0, 0, [[h, r, st], [0.045, r + 0.016, L === 6 ? C.gold : col], [h, r, st], [0.05, r - 0.11, B ? C.steelD : C.steelD]]);
    // 앞쪽 장갑판(기울어진 판 2, 4장)
    var pl = L === 6 ? [-1.25, -0.42, 0.42, 1.25] : [-0.95, 0.95], top = h * 2 + 0.045 + (L - 4) * 0.03 + 0.06;
    pl.forEach(function (da) {
      var a0 = Math.PI / 2 + da - 0.3, a1 = Math.PI / 2 + da + 0.3, r0 = r + 0.042, r1 = r - 0.02;
      f.push(['poly', [[Math.cos(a0) * r0, Math.sin(a0) * r0, 0], [Math.cos(a1) * r0, Math.sin(a1) * r0, 0], [Math.cos(a1) * r1, Math.sin(a1) * r1, top], [Math.cos(a0) * r1, Math.sin(a0) * r1, top]], B ? C.conc : C.steel, { two: 1 }]);
      var am = Math.PI / 2 + da; f.push(['poly', [[Math.cos(am - 0.12) * (r0 + 0.004), Math.sin(am - 0.12) * (r0 + 0.004), top * 0.25], [Math.cos(am + 0.12) * (r0 + 0.004), Math.sin(am + 0.12) * (r0 + 0.004), top * 0.25], [Math.cos(am + 0.12) * (r1 + 0.02), Math.sin(am + 0.12) * (r1 + 0.02), top * 0.75], [Math.cos(am - 0.12) * (r1 + 0.02), Math.sin(am - 0.12) * (r1 + 0.02), top * 0.75]], L === 6 ? C.gold : col, { two: 1, noink: 1, zb: 0.01 }]);
    });
    // 표식등
    var lm = L === 4 ? [-1.5, 1.5] : L === 5 ? [-1.5, 0, 1.5] : [-1.72, -0.84, 0.84, 1.72];
    lm.forEach(function (da) { var am = Math.PI / 2 + da; f.push(t2Lamp(Math.cos(am) * (r - 0.03), Math.sin(am) * (r - 0.03), h * 2 + 0.075, L === 6 ? 0.04 : 0.034, tr)); });
  }
  return { b: b, f: f, pz: pz };
}
// 계급장: 기존 탑과 같은 약속(1~3단계 갈매기표, 갈래는 색 방패와 별)
function t2Badge(x, cx, cy, sz, L, B) {
  var w = sz * 0.19, h = sz * 0.21, base = L >= 4 ? (B ? '#ff5d9e' : '#3f9ff5') : L === 3 ? '#ffc93c' : L === 2 ? '#b8b0e8' : '#eea55e', tn = t2Tone(base);
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  x.beginPath(); x.moveTo(cx - w / 2, cy - h / 2); x.lineTo(cx + w / 2, cy - h / 2); x.lineTo(cx + w / 2, cy + h * 0.08); x.quadraticCurveTo(cx + w * 0.44, cy + h * 0.38, cx, cy + h / 2); x.quadraticCurveTo(cx - w * 0.44, cy + h * 0.38, cx - w / 2, cy + h * 0.08); x.closePath();
  x.fillStyle = base; x.fill(); x.strokeStyle = tn[3]; x.lineWidth = Math.max(1.1, sz * 0.022); x.stroke();
  if (L <= 3) {
    x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, sz * 0.03);
    for (var i = 0; i < L; i++) { var yy = cy - h * 0.2 + i * h * 0.2 - (L - 1) * h * 0.06; x.beginPath(); x.moveTo(cx - w * 0.28, yy); x.lineTo(cx, yy + h * 0.13); x.lineTo(cx + w * 0.28, yy); x.stroke(); }
  } else {
    var n = L - 3; x.fillStyle = '#fff3b0';
    for (var j = 0; j < n; j++) { var sx = cx + (j - (n - 1) / 2) * w * 0.31, r0 = w * (n === 1 ? 0.3 : n === 2 ? 0.22 : 0.17); x.beginPath(); twStarP(x, sx, cy - h * 0.04, r0, r0 * 0.48); x.fill(); }
  }
  x.restore();
}
// ---------- 한 모습 만들기 (towerSpr가 캐시) ----------
function t2Spr(key, L, B, S) {
  L = clamp(L | 0, 1, 6) || 1; B = B ? 1 : 0;
  var k = T2_KS[L], U = S * k, W = S * 2.16, H = S * 3.72, gx = W / 2, gy = H * 0.88;
  var cb = mkC(W, H), cf = mkC(W, H), xb = cx2(cb), xf = cx2(cf), col = (TOWERS[key] && TOWERS[key].col) || '#8090a8';
  t2IW = Math.max(1.25, U * 0.03);
  twShadow(xb, gx + U * 0.12, gy + U * 0.04, U * 0.62, U * 0.29, 0.42);
  col = t2Viv(col); var bs = t2Base(L, B, col), lk = T2_LOOK[key](L, B, col, bs.pz);
  lk.pz = bs.pz + (lk.dz || 0); lk.iw = t2IW; lk.U = U; lk.col = col; lk.L = L; lk.B = B; lk.ord = []; if (!lk.ts) lk.ts = L === 1 ? 1.42 : L === 2 ? 1.36 : L === 3 ? 1.3 : 1.2;
  lk.groups.forEach(function (G) { G.cache = {}; }); lk.id = key + L + ':' + B + ':' + Math.round(U * 8);
  T2_LKS = T2_LKS.filter(function (q) { return q.id !== lk.id; }); T2_LKS.push(lk); // 같은 모습을 다시 만들면(스킨 바꿈 등) 옛 조각은 버림
  xb.translate(gx, gy); xf.translate(gx, gy);
  t2Draw(xb, bs.b.concat(lk.sb || []), U); t2Draw(xf, bs.f.concat(lk.sf || []), U);
  t2Badge(xf, 0, U * 0.26, U, L, B);
  var rb = ((Math.round((lk.rest == null ? 0.62 : lk.rest) / 6.2832 * T2_NB) % T2_NB) + T2_NB) % T2_NB; lk.groups.forEach(function (G) { if (!G.spin) t2Bake(lk, G, G.fixed || G.rot ? 0 : rb, 0); }); // 쉬는 자세는 미리 구워 둠
  var info = { back: trimSpr(spr(cb, gx, gy)), front: trimSpr(spr(cf, gx, gy)), mounts: [[0, -(lk.pz + (lk.mh || 0.3) * lk.ts) * T2_CZ]], k: k, look: lk };
  info.muzzle = function (t) { return t2MuzzleOf(t, info); };
  return info;
}
// 조각 묶음 하나를 한 방향으로 구움 → { c, ax, ay, vx, vy(반동 방향, px), mx, my(포구) }
var T2_NBAKE = 0, T2_LKS = [];
function t2Bake(lk, G, b, ph) {
  var key = b + ':' + ph, s = G.cache[key]; if (s) return s;
  if (T2_NBAKE > 8e6) { T2_NBAKE = 0; T2_LKS.forEach(function (q) { q.groups.forEach(function (g2) { g2.cache = {}; }); if (q.gems) q.gems.forEach(function (g2) { g2.cache = {}; }); }); } // 구운 조각이 800만 화소(약 32MB)를 넘으면 비우고 다시(메모리 상한)
  var a = b / T2_NB * 6.2832, ts = lk.ts, T = t2T(a, G.el, G.ep, lk.pz / ts), U = lk.U * ts, prims = G.prims;
  if (ph && G.ax) { // 총열 다발 회전(축 둘레)
    var an = ph / G.spin * 6.2832 / (G.sym || 1), ca = Math.cos(an), sa = Math.sin(an), v0 = G.ax[0], w0 = G.ax[1];
    prims = prims.map(function (p) { if (p[0] !== 'cyl' || !p[10] || !p[10].sp) return p; var q = p.slice(), dv = p[2] - v0, dw = p[3] - w0; q[2] = v0 + dv * ca - dw * sa; q[3] = w0 + dv * sa + dw * ca; dv = p[5] - v0; dw = p[6] - w0; q[5] = v0 + dv * ca - dw * sa; q[6] = w0 + dv * sa + dw * ca; return q; });
  }
  t2IW = lk.iw;
  var cm = t2Cmds(prims, T, U), pad = 2, w = Math.max(1, Math.ceil(T.x1 - T.x0)) + pad * 2, h = Math.max(1, Math.ceil(T.y1 - T.y0)) + pad * 2;
  if (!isFinite(w) || !isFinite(h)) { w = h = 2; T.x0 = T.y0 = 0; }
  var c = mkC(w, h), x = cx2(c); x.translate(pad - T.x0, pad - T.y0); x.lineJoin = 'round'; x.lineCap = 'round'; T2_NBAKE += w * h;
  for (var i = 0; i < cm.length; i++) cm[i].f(x);
  var o0 = t2P(T, 0, 0, 0), o1 = t2P(T, 1, 0, 0), mz = G.mz ? t2P(T, G.mz[0], G.mz[1], G.mz[2]) : null, gl = G.gl ? t2P(T, G.gl[0], G.gl[1], G.gl[2]) : null;
  s = G.cache[key] = { c: c, ax: pad - T.x0, ay: pad - T.y0, vx: (o1[0] - o0[0]) * U, vy: (o1[1] - o0[1]) * U, mx: mz ? mz[0] * U : 0, my: mz ? mz[1] * U : 0, gx: gl ? gl[0] * U : 0, gy: gl ? gl[1] * U : 0 };
  if (G.multi) { // 같은 조각을 여러 자리에(탄두). 다 차 있을 때는 한 장으로 합친 그림을 씀
    s.pts = G.multi.map(function (m) { var q = t2P(T, m[0], m[1], m[2]); return [(q[0] - o0[0]) * U, (q[1] - o0[1]) * U]; });
    var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; s.pts.forEach(function (q) { bx0 = Math.min(bx0, q[0]); by0 = Math.min(by0, q[1]); bx1 = Math.max(bx1, q[0]); by1 = Math.max(by1, q[1]); });
    var fc = mkC(bx1 - bx0 + w, by1 - by0 + h), fx = cx2(fc); T2_NBAKE += fc.width * fc.height; s.pts.forEach(function (q) { fx.drawImage(c, q[0] - bx0, q[1] - by0); });
    s.full = fc; s.fx = s.ax - bx0; s.fy = s.ay - by0;
  }
  return s;
}
// 한 프레임에 새 방향을 굽는 탑 수를 묶어 둠: 넘치면 그 탑은 한두 프레임 동안 직전 방향 그림을 그대로 씀(끊김 방지)
var T2_FR = { tm: -1, n: 0 };
function t2Order(lk, b) {
  var a = b / T2_NB * 6.2832, ds = lk.groups.map(function (G, i) { var T = t2T(G.fixed || G.rot ? 0 : a, G.el, G.ep, 0), c = G.c || [0, 0, 0]; return [t2P(T, c[0], c[1], c[2])[2] + (G.zb || 0), i]; });
  ds.sort(function (p, q) { return p[0] - q[0]; });
  return ds.map(function (d) { return d[1]; });
}
// 포구 섬광(색마다 한 번 구움): 빛 덩어리 + 흰 심 + 네 갈래 번쩍
var T2_FL = {};
function t2Flash(col) {
  var c = T2_FL[col]; if (c) return c;
  c = T2_FL[col] = mkC(64, 64); var x = cx2(c);
  glowAt(x, 32, 32, 32, col, 0.95); glowAt(x, 32, 32, 14, '#ffffff', 1); twTwinkle(x, 32, 32, 21, 0.8);
  return c;
}
function t2State(t) {
  var s = T2_ST ? T2_ST.get(t) : t._t2;
  if (!s) { s = { aim: null, tm: 0, fT: 0, cnt: 0, last: null, shotAt: -9, slot: [], s0: [], n: 0 }; if (T2_ST) T2_ST.set(t, s); else t._t2 = s; }
  return s;
}
// ---------- 움직이는 부분 (매 프레임): 구운 조각을 옮겨 그리기만 한다 ----------
function t2Parts(x, t, X, Y, S, time, info, g) {
  var lk = info && info.look; if (!lk) return;
  var st = t2State(t), now = time || 0, dt = clamp(now - st.tm, 0, 0.1); st.tm = now;
  if (T2_FR.tm !== now) { T2_FR.tm = now; T2_FR.n = 0; }
  // 메뉴 아이콘(g 없음)과 아직 한 번도 조준하지 않은 탑(처음 값 -90도)은 잘 보이는 앞쪽 비스듬한 자세로
  var fT = t.fireT > 0 ? t.fireT : 0, fk = Math.min(1, fT / 0.35), cnt;
  if (fT > 0 || t.busy > 0.02 || t.shots > 0) { st.ever = 1; st.actAt = now; }
  var aimT = !g || !st.ever || t.aim == null || !isFinite(t.aim) ? (lk.rest == null ? 0.62 : lk.rest) : t.aim;
  if (g && now - (st.actAt || -9) > 2.2) aimT += Math.sin(now * 0.7 + (t.id || 0) * 1.7) * 0.3; // 표적이 없으면 천천히 좌우로 살핌
  if (st.aim == null || !g) st.aim = aimT; else st.aim += angDiff(st.aim, aimT) * Math.min(1, dt * 18);
  if (t.shots != null) cnt = t.shots | 0; else { if (fT > st.fT + 0.04) st.cnt++; cnt = st.cnt; }
  st.fT = fT;
  var spn = t.spin != null ? t.spin : (st.sp = (st.sp || 0) + dt * fk * 34);
  if (st.last == null) st.last = cnt;
  if (cnt !== st.last) { // 방금 쐈음: 빈 발사대, 일제 사격 수 기억
    var ns = lk.slots || 0, rl = t.st && t.st.rate > 0 ? 1 / t.st.rate : 1.2;
    if (ns && lk.salvo) { // 일제 사격: 발사관이 차례로 비고, 재장전 동안 차례로 채워짐
      if (now - st.shotAt > 0.45) { var rr = clamp(rl, 0.7, 4), sg = Math.min(0.045, 0.4 / ns); for (var z = 0; z < ns; z++) { st.s0[z] = now + z * sg; st.slot[z] = now + sg * ns + rr * (0.3 + 0.55 * z / ns); } st.busyT = st.slot[ns - 1]; }
    } else if (ns) for (var q = st.last; q < cnt && q < st.last + ns; q++) { var zi = ((q % ns) + ns) % ns; st.s0[zi] = now; st.slot[zi] = now + Math.min(2.2, Math.max(0.5, rl * 0.75)); st.busyT = Math.max(st.busyT || 0, st.slot[zi]); }
    if (now - st.shotAt > (lk.reload || 0.9)) st.n = 0;
    st.n += cnt - st.last; st.shotAt = now; st.last = cnt;
  }
  var b = ((Math.round(st.aim / 6.2832 * T2_NB) % T2_NB) + T2_NB) % T2_NB;
  if (b !== st.b) { // 새 방향: 아직 안 구운 조각이 있고 이번 프레임 예산을 다 썼으면 직전 방향 유지
    var miss = 0; for (var gi = 0; gi < lk.groups.length; gi++) { var Gq = lk.groups[gi]; if (!Gq.fixed && !Gq.rot && !Gq.cache[b + ':0']) miss = 1; }
    if (miss && T2_FR.n >= 2 && st.b != null && g) b = st.b; else { T2_FR.n += miss; st.b = b; }
  }
  var ord = lk.ord[b] || (lk.ord[b] = t2Order(lk, b)), nA = lk.nAlt || 1, hot = ((cnt - 1) % nA + nA) % nA, i, G, s, opn = now - st.shotAt < (lk.openT || 1.8);
  if (lk.fx0) lk.fx0(x, t, X, Y, S, now, st, b, fk, cnt, lk);
  for (i = 0; i < ord.length; i++) {
    G = lk.groups[ord[i]];
    if (G.open != null && (G.open ? !opn : opn)) continue;
    var se = G.slot != null ? st.slot[G.slot] : null;
    if (se > now && !(st.s0[G.slot] > now)) continue;
    var gb = G.fixed ? 0 : G.rot ? ((Math.floor(now * G.rot / 6.2832 * T2_NB) % T2_NB) + T2_NB) % T2_NB : b;
    var ph = G.spin ? ((Math.floor(spn * (G.spinK || G.spin * (G.sym || 1) / 6.2832)) % G.spin) + G.spin) % G.spin : 0, ox = 0, oy = 0;
    s = t2Bake(lk, G, gb, ph);
    var act = G.alt == null || G.alt === hot;
    if (G.rec && fk > 0 && act) { var rk = G.rec * fk * fk; ox = -s.vx * rk; oy = -s.vy * rk; }
    if (se != null && now - se < 0.3) { var sk = 1 - (now - se) / 0.3; ox -= s.vx * 0.22 * sk; oy -= s.vy * 0.22 * sk; } // 새 탄이 밀려 올라옴
    if (G.bob) oy += Math.sin(now * G.bob[1] + (G.bob[2] || 0)) * G.bob[0] * S;
    if (s.pts) {
      if (!(st.busyT > now)) x.drawImage(s.full, X - s.fx + ox, Y - s.fy + oy);
      else for (var m = 0; m < s.pts.length; m++) if (!(st.slot[m] > now) || st.s0[m] > now) x.drawImage(s.c, X - s.ax + ox + s.pts[m][0], Y - s.ay + oy + s.pts[m][1]);
    }
    else x.drawImage(s.c, X - s.ax + ox, Y - s.ay + oy);
    if (G.gl) { var gp = (now * 0.3 + (t.id || 0) * 0.37) % 1; if (gp < 0.07) { var gs2 = S * 0.3 * Math.sin(gp / 0.07 * Math.PI); x.save(); x.globalCompositeOperation = 'lighter'; x.drawImage(t2Flash('#bfe8ff'), X + s.gx + ox - gs2 / 2, Y + s.gy + oy - gs2 / 2, gs2, gs2); x.restore(); } } // 조준경 반짝
    if (G.mz && act && fk > 0.62) { // 포구 섬광 자리
      var fs = S * (G.fz || 0.4) * (0.8 + fk * 0.6) * (G.spin ? 0.8 + 0.4 * ((ph + cnt) % 2) : 1);
      x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(1, (fk - 0.62) * 4);
      x.drawImage(t2Flash(lk.fc || '#ffd070'), X + s.mx + ox - fs / 2, Y + s.my + oy - fs / 2, fs, fs); x.restore();
    }
  }
  if (lk.fx) lk.fx(x, t, X, Y, S, now, st, b, fk, cnt, lk);
  if (t.frozenT > 0) { x.save(); x.globalAlpha = 0.5; x.fillStyle = '#d6f2ff'; x.beginPath(); x.ellipse(X, Y - S * 0.5, S * 0.42, S * 0.62, 0, 0, Math.PI * 2); x.fill(); x.globalAlpha = 0.9; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.025); x.stroke(); x.restore(); }
}
// 지금 쏘는 포구의 화면 위치(탑 기준점에서 px): 탄, 예광, 연기를 실제 포구에서 내고 싶을 때 씀. towerSpr(...)의 info.muzzle(t)로도 부를 수 있음. 없으면 null
function t2MuzzleOf(t, info) {
  var lk = info && info.look; if (!lk) return null;
  var st = t2State(t), b = st.b == null ? ((Math.round((lk.rest == null ? 0.62 : lk.rest) / 6.2832 * T2_NB) % T2_NB) + T2_NB) % T2_NB : st.b, nA = lk.nAlt || 1, cnt = t.shots != null ? t.shots | 0 : st.cnt, hot = ((cnt - 1) % nA + nA) % nA;
  for (var i = 0; i < lk.groups.length; i++) { var G = lk.groups[i]; if (!G.mz || (G.alt != null && G.alt !== hot)) continue; var s = t2Bake(lk, G, G.fixed ? 0 : b, 0); return { x: s.mx, y: s.my }; }
  return null;
}
// ===================== 대공포 (flak) =====================
// 1~3: 쌍열 → 방패 → 4연장. A 팔랑크스: 레이더 돔 + 회전 다총열 / B 고사포 진지: 굵은 쌍열 고사포 + 모래주머니 + 탄 더미
T2_LOOK.flak = function (L, B, col, pz) {
  var C = T2C, body = [], gs = [], sf = [], sb = [], A = L >= 4 && !B, K = L >= 4 && B, i, shc = mixc(col, '#4a8ae0', 0.4);
  if (!A && !K) {
    var el = 0.8, ep = [0.0, 0.2], bl = 0.4 + L * 0.06, br = 0.03 + L * 0.003;
    body.push(['cyl', 0, 0, 0, 0, 0, 0.11, 0.15 + L * 0.02, 0.11 + L * 0.02, C.steelD]);
    body.push(['box', -0.03, 0, 0.17, 0.22 + L * 0.02, 0.24 + L * 0.03, 0.12, col, { tu: 0.8, stripe: L >= 3 ? C.white : null }]);
    if (L >= 2) [-1, 1].forEach(function (sd) { // 방패
      var v0 = sd * 0.13, v1 = sd * (0.25 + L * 0.02);
      body.push(['poly', [[0.13, v0, 0.1], [0.13, v1, 0.1], [0.04, v1, 0.34 + L * 0.03], [0.04, v0, 0.4 + L * 0.03]], shc, { two: 1 }]);
      if (L >= 3) body.push(['poly', [[0.118, v0 + sd * 0.03, 0.18], [0.118, v1 - sd * 0.03, 0.18], [0.085, v1 - sd * 0.03, 0.27], [0.085, v0 + sd * 0.03, 0.27]], C.white, { two: 1, noink: 1, zb: 0.015 }]);
    });
    if (L >= 3) { body.push(['box', -0.2, 0, 0.16, 0.12, 0.2, 0.14, C.olive]); body.push(['cyl', -0.2, 0, 0.23, -0.2, 0, 0.3, 0.03, 0.03, C.dark]); body.push(['cyl', -0.22, 0, 0.32, -0.14, 0, 0.32, 0.034, 0.034, C.gun, { cap: C.glass }]); }
    [-1, 1].forEach(function (sd, gi) {
      var P = [], v = sd * 0.075;
      P.push(['box', 0.0, v, 0.21, 0.24, 0.085, L >= 3 ? 0.2 : 0.1, C.gun]);
      P.push(['box', -0.02, v, (L >= 3 ? 0.31 : 0.26) + 0.035, 0.09, 0.05, 0.07, C.brass]);
      if (L >= 3) { t2Brl(P, 0.1, v, 0.165, bl, br, C.steelD, { fl: 1, mz: 0.08 }); t2Brl(P, 0.1, v, 0.262, bl, br, C.steelD, { fl: 1, mz: 0.08 }); }
      else t2Brl(P, 0.1, v, 0.21, bl, br + 0.006, C.steelD, L >= 2 ? { fl: 1, mz: 0.08, jk: 0.12, jc: C.gun } : { mz: 0.05, mk: 1.35 });
      gs.push({ prims: P, c: [0.3, v, 0.3], el: el, ep: ep, rec: 0.1, alt: gi, mz: [0.1 + bl + 0.03, v, 0.21], fz: 0.3 });
    });
  } else if (A) {
    var dh = 0.2 + (L - 4) * 0.05, wh = mixc(col, '#ffffff', 0.72);
    t2Stack(body, 0, 0, 0, [[0.07, 0.25, C.steelD, 0.22]]);
    body.push(['box', -0.03, 0, 0.16, 0.32, L === 6 ? 0.22 : 0.26, 0.18, wh, { tu: 0.86, tv: 0.9 }]);
    var dz = t2Stack(body, -0.08, 0, 0.25, [[dh * 0.45, 0.15, wh], [0.045, 0.158, col], [dh * 0.55, 0.15, wh]]);
    body.push(['sph', -0.08, 0, dz, 0.15, wh, { dome: 1 }]);
    if (L >= 5) body.push(['cyl', -0.04, -0.21, 0.13, -0.04, 0.21, 0.13, 0.075, 0.075, C.gun]); // 탄통
    if (L === 6) { body.push(['cyl', -0.08, 0, dz + 0.12, -0.08, 0, dz + 0.3, 0.014, 0.01, C.dark]); body.push(t2Lamp(-0.08, 0, dz + 0.31, 0.032, C.red)); body.push(['cyl', -0.08, 0, dz + 0.02, -0.08, 0, dz + 0.06, 0.162, 0.162, C.gold]); }
    else if (L === 5) { body.push(['cyl', -0.08, 0, dz + 0.12, -0.08, 0, dz + 0.22, 0.013, 0.01, C.dark]); body.push(t2Lamp(-0.08, 0, dz + 0.23, 0.028, C.amber)); body.push(['box', -0.2, 0, 0.3, 0.035, 0.2, 0.12, C.steel]); }
    else body.push(['sph', -0.08, 0, dz + 0.13, 0.03, col]);
    (L === 6 ? [-0.2, 0.2] : [0]).forEach(function (v, gi) {
      var P = [], w0 = L === 6 ? 0.2 : 0.15, n = 6, rr = L === 4 ? 0.04 : 0.047;
      P.push(['cyl', 0.0, v, w0, 0.16, v, w0, rr + 0.035, rr + 0.035, C.gun]);
      for (var k = 0; k < n; k++) { var an = k / n * 6.2832 + 0.3; P.push(['cyl', 0.14, v + Math.cos(an) * rr, w0 + Math.sin(an) * rr, 0.6 + (L - 4) * 0.04, v + Math.cos(an) * rr, w0 + Math.sin(an) * rr, 0.019, 0.019, k % 2 ? C.dark : C.steelD, { sp: 1, hole: 1 }]); }
      P.push(['cyl', 0.4, v, w0, 0.45, v, w0, rr + 0.03, rr + 0.03, col]);
      P.push(['cyl', 0.57 + (L - 4) * 0.04, v, w0, 0.6 + (L - 4) * 0.04, v, w0, rr + 0.028, rr + 0.028, C.dark, { zb: -0.02 }]);
      gs.push({ prims: P, c: [0.35, v, 0.3], el: 0.62, ep: [0.02, w0], rec: 0.035, alt: L === 6 ? gi : null, mz: [0.66 + (L - 4) * 0.04, v, w0], fz: 0.3, spin: 3, sym: 3, ax: [v, w0] });
    });
  } else {
    var bl2 = 0.56 + (L - 4) * 0.09, br2 = 0.048 + (L - 4) * 0.008, sh = 0.42 + (L - 4) * 0.04;
    t2Stack(body, 0, 0, 0, [[0.08, 0.27, C.steelD, 0.24]]);
    body.push(['box', -0.04, 0, 0.17, 0.3, 0.34, 0.16, C.olive, { tu: 0.8 }]);
    [-1, 1].forEach(function (sd) {
      var v0 = sd * 0.16, v1 = sd * (0.33 + (L - 4) * 0.02);
      body.push(['poly', [[0.16, v0, 0.07], [0.17, v1, 0.07], [0.03, v1 * 0.92, sh], [0.03, v0, sh + 0.05]], shc, { two: 1 }]);
      body.push(['poly', [[0.13, v0 + sd * 0.03, 0.2], [0.13, v1 - sd * 0.03, 0.2], [0.085, v1 * 0.93 - sd * 0.03, 0.33], [0.085, v0 + sd * 0.03, 0.33]], L === 6 ? C.gold : C.white, { two: 1, noink: 1, zb: 0.015 }]);
    });
    if (L === 6) { body.push(['cyl', 0.0, -0.37, sh + 0.06, 0.0, 0.37, sh + 0.06, 0.036, 0.036, C.dark, { cap: C.glass }]); body.push(['cyl', 0.0, -0.37, sh + 0.06, 0.0, -0.3, sh + 0.06, 0.045, 0.045, C.gun, { cap: C.glass }]); body.push(['cyl', 0.0, 0.3, sh + 0.06, 0.0, 0.37, sh + 0.06, 0.045, 0.045, C.gun, { cap: C.glass }]); }
    [-1, 1].forEach(function (sd, gi) {
      var P = [], v = sd * 0.085, w0 = 0.24;
      P.push(['box', -0.02, v, w0, 0.3, 0.12, 0.13, C.gun]);
      t2Brl(P, 0.1, v, w0, bl2, br2, C.steelD, { jk: 0.2, jc: C.gun, mz: 0.12, mk: 1.75, mc: C.dark });
      if (L >= 5) P.push(['cyl', 0.02, v, w0 + 0.1, 0.3, v, w0 + 0.1, 0.03, 0.03, C.brass]);
      gs.push({ prims: P, c: [0.35, v, 0.4], el: 0.92, ep: [0.0, w0], rec: 0.16, alt: gi, mz: [0.1 + bl2 + 0.04, v, w0], fz: 0.46 });
    });
    // 모래주머니와 탄 더미(앞 그림)
    for (i = 0; i < (L >= 5 ? 9 : 6); i++) { var an2 = Math.PI * (0.2 + 0.6 * i / (L >= 5 ? 8 : 5)), rr2 = 0.56; sf.push(['cyl', Math.cos(an2 - 0.11) * rr2, Math.sin(an2 - 0.11) * rr2, 0.035, Math.cos(an2 + 0.11) * rr2, Math.sin(an2 + 0.11) * rr2, 0.035, 0.045, 0.045, C.sand]); }
    var ns = L === 4 ? 3 : L === 5 ? 5 : 7;
    for (i = 0; i < ns; i++) sf.push(['cyl', -0.36 + (i % 4) * 0.05 + (i > 3 ? 0.025 : 0), 0.2 + (i > 3 ? 0.05 : 0), pz, -0.36 + (i % 4) * 0.05 + (i > 3 ? 0.025 : 0), 0.2 + (i > 3 ? 0.05 : 0), pz + 0.15, 0.024, 0.014, C.brass]);
    sf.push(['box', 0.34, 0.2, pz + 0.045, 0.15, 0.1, 0.09, C.wood, { stripe: C.olive }]);
  }
  return { groups: [{ prims: body, c: [0, 0, 0.12] }].concat(gs), sf: sf, sb: sb, mh: 0.42, nAlt: gs.length > 1 ? 2 : 1, fc: '#ffd070' };
};
// ===================== 유도탄 포대 (sam) =====================
// 1~3: 미사일 1 → 2 → 2발 + 발사통과 도는 레이더. A 장거리 요격탄: 길쭉한 대형 미사일 2발 / B 다탄두: 벌집 발사함(덮개가 열림)
T2_LOOK.sam = function (L, B, col, pz) {
  var C = T2C, body = [], arm = [], gs = [], A = L >= 4 && !B, K = L >= 4 && B, el = A ? 0.85 : K ? 0.62 : 0.7, w0 = 0.27, i, wh = mixc(col, '#ffffff', 0.78);
  t2Stack(body, 0, 0, 0, [[0.07, L === 1 ? 0.17 : 0.24, C.steelD, L === 1 ? 0.14 : 0.21]]);
  if (!K) {
    var two = L >= 2, ml = A ? 0.7 + (L - 4) * 0.11 : L === 1 ? 0.62 : 0.5 + L * 0.045, mr = A ? 0.052 + (L - 4) * 0.006 : L === 1 ? 0.054 : 0.04 + L * 0.003, vs = two ? [-1, 1] : [0], dv = A ? 0.13 : 0.1;
    body.push(['box', -0.05, 0, 0.15, 0.24, two ? 0.3 : 0.18, 0.16, col, { tu: 0.82, stripe: L >= 3 ? wh : null }]);
    if (L >= 2) { body.push(['box', -0.2, 0, 0.13, 0.1, 0.18, 0.12, C.gun]); body.push(t2Lamp(-0.2, 0, 0.21, 0.028, '#7dff9a')); }
    arm.push(['box', 0.1, 0, w0 - 0.07, 0.46, two ? dv * 2 + 0.1 : 0.08, 0.045, C.gun]);
    vs.forEach(function (sd, si) {
      var v = sd * dv, P = [];
      if (L === 3 || A) arm.push(['box', -0.03, v, w0, 0.24 + (A ? 0.06 : 0), mr * 2.9, mr * 2.9, A ? wh : col, A ? { stripe: col } : null]);
      t2Msl(P, -0.12, v, w0, ml, mr, { nose: L === 6 ? C.gold : C.red, band: col, fin: A ? col : C.red, boost: A && L >= 5, nl: A ? 0.3 : 0.24, fk: A ? 2.9 : 2.5 });
      gs.push({ prims: P, c: [0.25, v, w0 + 0.12], el: el, ep: [0, 0.2], slot: si });
    });
    if (L >= 3) { // 가운데 기둥과 도는 레이더
      var mh = A ? 0.5 + (L - 4) * 0.05 : 0.44, pw = A ? 0.2 + (L - 4) * 0.04 : 0.17;
      body.push(['cyl', 0, 0, 0.2, 0, 0, mh, 0.028, 0.022, C.steelD]);
      var R = [['box', 0.012, 0, mh + 0.07, 0.03, pw * 2, 0.13, L === 6 ? C.gold : C.steel], ['cyl', 0, 0, mh - 0.02, 0, 0, mh + 0.02, 0.04, 0.04, C.gun], ['cyl', 0.03, 0, mh + 0.07, 0.1, 0, mh + 0.07, 0.012, 0.012, C.dark], ['sph', 0.11, 0, mh + 0.07, 0.024, C.red]];
      gs.push({ prims: R, c: [0, 0, mh + 0.2], rot: 2.4 });
    }
    gs.push({ prims: arm, c: [0.1, 0, w0 - 0.05], el: el, ep: [0, 0.2], mz: [-0.2, 0, w0], fz: 0.55 });
    return { groups: [{ prims: body, c: [0, 0, 0.1] }].concat(gs), mh: 0.45, slots: vs.length, fc: '#ffb45a', openT: 1.2 };
  }
  // B: 벌집 발사함
  var rows = L === 4 ? 2 : 3, cols = L === 6 ? 4 : 3, cr = 0.052, pv = cr * 2.05, pwz = cr * 1.82, lv = cols * pv + 0.09, lw = rows * pwz + 0.07, lu = 0.42 + (L - 4) * 0.03, uc = 0.1, uf = uc + lu / 2, wc = 0.2 + lw / 2, n = 0, cells = [];
  body.push(['box', -0.05, 0, 0.14, 0.26, 0.3, 0.14, C.gun, { tu: 0.82 }]);
  [-1, 1].forEach(function (sd) { body.push(['box', -0.02, sd * (lv / 2 + 0.03), 0.2, 0.14, 0.05, 0.26, C.steelD]); });
  arm.push(['box', uc, 0, wc, lu, lv, lw, col, { stripe: wh }]);
  arm.push(['box', uf - 0.03, 0, wc, 0.05, lv + 0.03, lw + 0.03, L === 6 ? C.gold : C.steel, { zb: 0.001 }]);
  var j; for (i = 0; i < rows; i++) for (j = 0; j < cols; j++) {
    var v = (j - (cols - 1) / 2) * pv + (i % 2 ? pv * 0.25 : -pv * 0.25), w = wc + (i - (rows - 1) / 2) * pwz;
    cells.push([v, 0, w - wc]); n++;
  }
  arm.push(['dots', cells.map(function (q) { return [uf + 0.001, q[0], wc + q[2]]; }), cr, C.black, 0, 6, { a0: 0.5236, zb: 0.02 }]);
  gs.push({ prims: [['cyl', uf - 0.02, 0, wc, uf + 0.045, 0, wc, cr * 0.66, cr * 0.3, C.red, { far: C.red, cap: C.white }]], multi: cells.map(function (q) { return [0, q[0], q[2]]; }), c: [uf + 0.03, 0, wc], el: el, ep: [0, 0.2], zb: 0.03, open: 1 });
  arm.push(t2Disc(uc - lu / 2, 0, wc, lw * 0.28, C.dark, 3, { zb: 0.02 }));
  // 덮개: 닫힘(칸마다 흰 육각 마개) / 열림(차양판이 위로 젖혀지고 탄두가 보임)
  var lid0 = [], lid1 = [['poly', [[uf, -lv / 2 - 0.01, wc + lw / 2 + 0.01], [uf, lv / 2 + 0.01, wc + lw / 2 + 0.01], [uf + lw * 0.2, lv / 2 + 0.01, wc + lw / 2 + lw * 0.42], [uf + lw * 0.2, -lv / 2 - 0.01, wc + lw / 2 + lw * 0.42]], C.steel, { two: 1 }]];
  lid0.push(['dots', cells.map(function (q) { return [uf + 0.012, q[0], wc + q[2]]; }), cr * 0.86, wh, 0, 6, { a0: 0.5236, flat: 1, ink: 1 }]);
  gs.push({ prims: lid0, c: [uf + 0.08, 0, wc], el: el, ep: [0, 0.2], open: 0, zb: 0.06 });
  gs.push({ prims: lid1, c: [uf - 0.1, 0, wc + lw], el: el, ep: [0, 0.2], open: 1 });
  if (L === 6) { body.push(['cyl', -0.2, 0, 0.2, -0.2, 0, 0.62, 0.024, 0.018, C.steelD]); body.push(t2Lamp(-0.2, 0, 0.64, 0.034, C.red)); }
  gs.push({ prims: arm, c: [uc, 0, wc], el: el, ep: [0, 0.2], mz: [uf + 0.08, 0, wc], fz: 0.6 });
  return { groups: [{ prims: body, c: [0, 0, 0.1] }].concat(gs), mh: 0.45, slots: n, fc: '#ffb45a', openT: 1.6 };
};
// ===================== 기관포탑 (gatling) =====================
// 회전 총열 다발: u0에서 앞으로 len, 총열 n개가 반지름 rr 둘레에. 총열에 sp 표시 → t2Bake가 축 둘레로 돌려 굽는다
function t2Rot(P, u0, v, w, len, n, rr, br, o) {
  o = o || T2_O; var C = T2C, e = u0 + len, k, an;
  P.push(['cyl', u0 - 0.1, v, w, u0 + 0.05, v, w, rr + br + 0.022, rr + br + 0.022, o.mc || C.gun]);
  for (k = 0; k < n; k++) { an = k / n * 6.2832 + 0.3; P.push(['cyl', u0 + 0.04, v + Math.cos(an) * rr, w + Math.sin(an) * rr, e, v + Math.cos(an) * rr, w + Math.sin(an) * rr, br, br, n % 2 ? C.dark : k % 2 ? C.dark : C.steelD, { sp: 1, hole: 1 }]); }
  P.push(['cyl', u0 + 0.05, v, w, e - 0.03, v, w, rr * 0.5, rr * 0.5, C.black, { zb: -0.05 }]);
  (o.rings || [0.55]).forEach(function (t) { P.push(['cyl', u0 + len * t, v, w, u0 + len * t + 0.045, v, w, rr + br * 1.25, rr + br * 1.25, o.rc || C.gun]); });
  P.push(['cyl', e - 0.05, v, w, e - 0.015, v, w, rr + br * 1.3, rr + br * 1.3, o.tc || C.dark, { zb: -0.03 }]);
}
// 1~3: 총열 3 → 4 → 6. A 철갑 개틀링: 굵은 6총열과 장갑 포탑 / B 쌍열 벌컨: 나란한 회전포 둘, 궁극은 달아오른 포구
T2_LOOK.gatling = function (L, B, col, pz) {
  var C = T2C, body = [], gs = [], A = L >= 4 && !B, K = L >= 4 && B, w0 = 0.22, hot = '#ff7a3a';
  t2Stack(body, 0, 0, 0, [[0.08, L === 1 ? 0.16 : 0.22 + (L >= 4 ? 0.03 : 0), C.steelD, L === 1 ? 0.13 : 0.19 + (L >= 4 ? 0.03 : 0)]]);
  if (!A && !K) {
    var n = L === 1 ? 3 : L === 2 ? 4 : 6, rr = 0.032 + L * 0.006, br = 0.021, len = 0.38 + L * 0.06, P = [];
    body.push(['box', -0.06, 0, 0.2, 0.26 + L * 0.02, 0.2 + L * 0.02, 0.17, col, { tu: 0.84, tv: 0.9, stripe: L >= 3 ? C.white : null }]);
    body.push(['box', -0.05, 0.16 + L * 0.01, 0.17, 0.16, 0.09, 0.13, C.olive]);
    if (L >= 2) [-1, 1].forEach(function (sd) { body.push(['poly', [[0.12, sd * 0.09, 0.1], [0.12, sd * 0.24, 0.1], [0.07, sd * 0.24, 0.36 + L * 0.01], [0.07, sd * 0.09, 0.36 + L * 0.01]], mixc(col, '#ffffff', 0.25), { two: 1 }]); });
    if (L >= 3) { body.push(['cyl', -0.2, -0.14, 0.2, -0.2, 0.14, 0.2, 0.085, 0.085, C.gun]); body.push(t2Lamp(-0.08, 0, 0.31, 0.028, C.amber)); }
    t2Rot(P, 0.1, 0, w0, len, n, rr, br);
    gs.push({ prims: P, c: [0.36, 0, w0 + 0.02], el: 0.14, ep: [0, w0], rec: 0.035, mz: [0.1 + len + 0.04, 0, w0], fz: 0.36, spin: 3, sym: n % 2 ? n : n / 2, ax: [0, w0] });
  } else if (A) {
    var rr2 = 0.06 + (L - 4) * 0.009, br2 = 0.027 + (L - 4) * 0.0045, len2 = 0.56 + (L - 4) * 0.07, P2 = [];
    body.push(['box', -0.06, 0, 0.2, 0.36, 0.32 + (L - 4) * 0.02, 0.2, C.steelD, { tu: 0.8, tv: 0.84 }]);
    body.push(['box', -0.08, 0, 0.325, 0.24, 0.22, 0.05, col, { tu: 0.85, stripe: L === 6 ? C.gold : C.white }]);
    body.push(['box', 0.13, 0, 0.21, 0.08, 0.26 + (L - 4) * 0.02, 0.24, col]);
    if (L >= 5) body.push(['cyl', -0.24, -0.17, 0.2, -0.24, 0.17, 0.2, 0.105, 0.105, C.gun]);
    if (L === 6) { [-1, 1].forEach(function (sd) { body.push(['box', -0.02, sd * 0.215, 0.17, 0.3, 0.05, 0.2, col, { tu: 0.8 }]); body.push(['cyl', -0.2, sd * 0.1, 0.36, -0.3, sd * 0.1, 0.44, 0.022, 0.026, C.dark]); }); body.push(t2Lamp(-0.02, 0, 0.375, 0.032, C.red)); }
    t2Rot(P2, 0.14, 0, w0, len2, 6, rr2, br2, { rings: L === 4 ? [0.5] : [0.34, 0.66], tc: L === 6 ? C.gold : C.dark, rc: L === 6 ? col : C.gun });
    gs.push({ prims: P2, c: [0.42, 0, w0 + 0.02], el: 0.14, ep: [0, w0], rec: 0.045, mz: [0.14 + len2 + 0.05, 0, w0], fz: 0.5 + (L - 4) * 0.05, spin: 3, sym: 3, ax: [0, w0] });
  } else {
    var rr3 = 0.038 + (L - 4) * 0.004, len3 = 0.5 + (L - 4) * 0.08, nb = L === 6 ? 6 : 5;
    body.push(['box', -0.06, 0, 0.2, 0.3, 0.2, 0.2, col, { tu: 0.84, stripe: L === 6 ? hot : C.white }]);
    body.push(['box', -0.02, 0, 0.34, 0.12, 0.1, 0.07, C.gun]); body.push(['cyl', 0.04, 0, 0.345, 0.07, 0, 0.345, 0.03, 0.03, C.dark, { cap: C.glass }]);
    if (L >= 5) body.push(['cyl', -0.22, -0.2, 0.19, -0.22, 0.2, 0.19, 0.09, 0.09, C.olive]);
    [-1, 1].forEach(function (sd, gi) {
      var P3 = [], v = sd * (0.14 + (L - 4) * 0.008);
      t2Rot(P3, 0.1, v, w0, len3, nb, rr3, 0.019, { rings: L === 4 ? [0.5] : [0.36, 0.68], tc: L === 6 ? hot : C.dark, mc: L === 6 ? C.dark : C.gun, rc: L === 6 ? C.steelD : C.gun });
      if (L === 6) P3.push(['sph', 0.1 + len3 + 0.0, v, w0, 0.03, hot, { glow: hot, zb: -0.2 }]);
      gs.push({ prims: P3, c: [0.36, v, w0 + 0.02], el: 0.14, ep: [0, w0], rec: 0.04, alt: gi, mz: [0.1 + len3 + 0.04, v, w0], fz: 0.4 + (L - 4) * 0.05, spin: 3, sym: nb % 2 ? nb : nb / 2, ax: [v, w0] });
    });
  }
  return { groups: [{ prims: body, c: [0, 0, 0.14] }].concat(gs), mh: 0.26, nAlt: K ? 2 : 1, fc: K && L === 6 ? '#ff8a3a' : '#ffd070' };
};
// ===================== 다연장 로켓 (rocket) =====================
// 발사관 6 → 12 → 20. A 집속 로켓: 굵은 흰 탄두 6 → 8 → 12 / B 소이 로켓: 가늘고 붉은 탄두 24 → 30 → 35. 일제 사격 때 차례로 비고 재장전 때 채워짐
T2_LOOK.rocket = function (L, B, col, pz) {
  var C = T2C, body = [], pod = [], gs = [], A = L >= 4 && !B, K = L >= 4 && B, el = 0.52, i, j, rows, cols, cr, wh = mixc(col, '#ffffff', 0.75);
  if (A) { rows = L === 6 ? 3 : 2; cols = L === 4 ? 3 : 4; cr = 0.062; } else if (K) { rows = L === 4 ? 4 : 5; cols = L === 6 ? 7 : 6; cr = 0.032; } else { rows = L + 1; cols = L + 2; cr = L === 1 ? 0.056 : L === 2 ? 0.046 : 0.038; }
  var pv = cr * 2.25, lv = cols * pv + 0.05, lw = rows * pv + 0.05, lu = (A ? 0.5 : 0.42) + (L >= 4 ? (L - 4) * 0.03 : L * 0.01), uc = 0.07, uf = uc + lu / 2, wc = 0.2 + lw / 2, cells = [];
  t2Stack(body, 0, 0, 0, [[0.08, L === 1 ? 0.2 : 0.25, C.steelD, L === 1 ? 0.17 : 0.22]]);
  body.push(['box', -0.06, 0, 0.14, 0.34, Math.min(0.4, lv * 0.8), 0.12, C.gun, { tu: 0.85 }]);
  [-1, 1].forEach(function (sd) { body.push(['box', -0.08, sd * (lv / 2 + 0.035), 0.2, 0.14, 0.05, 0.24, C.steelD, { tu: 0.6 }]); });
  if (L >= 2) { body.push(['box', -0.27, 0, 0.17, 0.12, 0.24, 0.16, A ? C.steel : K ? C.olive : col, { tu: 0.8 }]); body.push(['poly', [[-0.212, -0.09, 0.17], [-0.212, 0.09, 0.17], [-0.222, 0.09, 0.235], [-0.222, -0.09, 0.235]], C.glass, { two: 1, zb: 0.02 }]); }
  if (K) [-1, 1].forEach(function (sd) { body.push(['cyl', -0.3, sd * 0.2, 0.08, -0.3, sd * 0.2, 0.24, 0.05, 0.05, C.red]); });
  if (A && L >= 5) [-1, 1].forEach(function (sd) { body.push(['box', 0.0, sd * (lv / 2 + 0.085), 0.14, 0.34, 0.03, 0.2, col, { tu: 0.85 }]); });
  if (L === 6) body.push(t2Lamp(-0.27, 0, 0.27, 0.032, K ? C.amber : C.red));
  pod.push(['box', uc, 0, wc, lu, lv, lw, col, { stripe: wh }]);
  pod.push(['box', uf - 0.025, 0, wc, 0.05, lv + 0.03, lw + 0.03, L === 6 ? C.gold : A ? C.steel : C.gun, { zb: 0.001 }]);
  pod.push(['box', uc - lu / 2 + 0.03, 0, wc, 0.05, lv + 0.03, lw + 0.03, C.gun, { zb: 0.001 }]);
  if (L >= 2) pod.push(['box', uc - 0.02, 0, wc, 0.04, lv + 0.024, lw + 0.024, L >= 4 ? (A ? C.steel : C.dark) : C.gun, { zb: 0.0005 }]);
  for (i = 0; i < rows; i++) for (j = 0; j < cols; j++) {
    var v = (j - (cols - 1) / 2) * pv, w = wc + (i - (rows - 1) / 2) * pv;
    cells.push([0, v, w - wc]);
  }
  pod.push(['dots', cells.map(function (q) { return [uf + 0.001, q[1], wc + q[2]]; }), cr, C.black, 0, 8, { zb: 0.02 }]);
  pod.push(['dots', cells.map(function (q) { return [uc - lu / 2 - 0.001, q[1], wc + q[2]]; }), cr * 0.62, C.black, 3, 6, { zb: 0.02 }]);
  var nose = A ? [['cyl', uf - 0.02, 0, wc, uf + 0.04, 0, wc, cr * 0.74, cr * 0.7, C.white, { cap: C.white, far: C.white }], ['cyl', uf + 0.04, 0, wc, uf + 0.085, 0, wc, cr * 0.7, cr * 0.3, L === 6 ? C.gold : C.steel, { cap: C.red }]]
    : [['cyl', uf - 0.02, 0, wc, uf + 0.07, 0, wc, cr * 0.8, cr * 0.5, K ? C.red : C.white, { cap: K ? C.amber : C.red, far: K ? C.red : C.white }]];
  gs.push({ prims: nose, multi: cells, c: [uf + 0.04, 0, wc], el: el, ep: [-0.1, 0.2], zb: 0.03, rec: 0.05 });
  gs.push({ prims: pod, c: [uc, 0, wc], el: el, ep: [-0.1, 0.2], rec: 0.05, mz: [uf + 0.12, 0, wc], fz: A ? 0.7 : 0.6 });
  return { groups: [{ prims: body, c: [0, 0, 0.1] }].concat(gs), mh: 0.42, slots: cells.length, salvo: 1, fc: K ? '#ff7a3a' : '#ffb050' };
};
// ===================== 레이저 탑 (laser) =====================
// 팔면체 수정 조각(색마다 한 번 구움)
function t2Gem(P, u, v, w, r, h, col) {
  var top = [u, v, w + h], bot = [u, v, w - h * 0.8], q = [[u + r, v, w], [u, v + r, w], [u - r, v, w], [u, v - r, w]], i;
  for (i = 0; i < 4; i++) { P.push(['poly', [top, q[i], q[(i + 1) % 4]], col]); P.push(['poly', [bot, q[(i + 1) % 4], q[i]], col]); }
}
// 1~3: 렌즈 포신이 길어지고 고리가 늘어남. A 프리즘 탑: 가운데 큰 수정 + 떠서 도는 프리즘(쏠 때 표적 쪽으로 모임) / B 집속 광선포: 길고 굵은 포신과 냉각 핀
T2_LOOK.laser = function (L, B, col, pz) {
  var C = T2C, body = [], gs = [], A = L >= 4 && !B, K = L >= 4 && B, w0 = 0.26, P = [], i, hot = mixc(col, '#ffffff', 0.45);
  t2Stack(body, 0, 0, 0, [[0.08, L === 1 ? 0.17 : 0.23, C.steelD, L === 1 ? 0.14 : 0.2]]);
  if (A) {
    var ch = 0.3 + (L - 4) * 0.06, n = L === 4 ? 3 : L === 5 ? 4 : 6, cols = L === 6 ? ['#ff5a7a', '#ffb03a', '#ffe94a', '#5fe08a', '#4fb8ff', '#b07aff'] : [col, hot, col, hot];
    t2Stack(body, 0, 0, 0.08, [[0.07, 0.19, C.white, 0.15], [0.04, 0.16, L === 6 ? C.gold : col], [0.05, 0.12, C.white, 0.08]]);
    if (L >= 5) for (i = 0; i < 3; i++) { var pa = i * 2.0944 + 0.52; body.push(['cyl', Math.cos(pa) * 0.25, Math.sin(pa) * 0.25, 0.08, Math.cos(pa) * 0.25, Math.sin(pa) * 0.25, 0.2, 0.035, 0.026, L === 6 ? C.gold : C.steel]); body.push(['sph', Math.cos(pa) * 0.25, Math.sin(pa) * 0.25, 0.225, 0.034, hot, { glow: col }]); }
    var gem = []; t2Gem(gem, 0, 0, 0.36 + ch, 0.13 + (L - 4) * 0.015, ch, col);
    gs.push({ prims: gem, c: [0, 0, 0.5], fixed: 1, bob: [0.02, 2.2] });
    var lk = { groups: [{ prims: body, c: [0, 0, 0.1], fixed: 1 }].concat(gs), mh: 0.36 + ch, ts: 1.2, gems: [], gn: n, gr: 0.36 + (L - 4) * 0.03, gz: 0.3 + ch * 0.5, gc: col };
    for (i = 0; i < n; i++) { var gp = []; t2Gem(gp, 0, 0, 0, 0.075 + (L - 4) * 0.006, 0.14 + (L - 4) * 0.012, cols[i % cols.length]); lk.gems.push({ prims: gp, fixed: 1, cache: {}, col: cols[i % cols.length] }); }
    lk.fx0 = function (x, t, X, Y, S, now, st, b, fk, cnt, lk) { t2Prisms(x, t, X, Y, S, now, st, lk, 0); };
    lk.fx = function (x, t, X, Y, S, now, st, b, fk, cnt, lk) { t2Prisms(x, t, X, Y, S, now, st, lk, 1); };
    return lk;
  }
  var len = K ? 0.62 + (L - 4) * 0.12 : 0.3 + L * 0.07, br = K ? 0.062 + (L - 4) * 0.008 : 0.04 + L * 0.004, nr = K ? 5 + (L - 4) : L;
  body.push(['box', -0.04, 0, 0.17, 0.2, 0.2 + (K ? 0.06 : 0), 0.14, C.gun, { tu: 0.8 }]);
  [-1, 1].forEach(function (sd) { body.push(['box', 0.0, sd * (0.12 + (K ? 0.03 : 0)), 0.22, 0.1, 0.04, 0.2, C.steelD, { tu: 0.6 }]); });
  P.push(['box', -0.1, 0, w0, 0.24, 0.17 + (K ? 0.05 : 0), 0.17 + (K ? 0.03 : 0), col, { stripe: L >= 3 ? C.white : null }]);
  P.push(['cyl', -0.3 - (K ? 0.04 : 0), 0, w0, -0.2, 0, w0, br * 1.1, br * 1.25, C.gun, { cap: C.dark }]);
  P.push(['cyl', 0.0, 0, w0, len, 0, w0, br, br, K ? C.steel : C.white]);
  for (i = 0; i < nr; i++) { var u = K ? 0.08 + (len - 0.2) * i / (nr - 1) : 0.06 + (len - 0.14) * (nr > 1 ? i / (nr - 1) : 0.5); P.push(['cyl', u, 0, w0, u + (K ? 0.028 : 0.04), 0, w0, br * (K ? 1.75 : 1.45), br * (K ? 1.75 : 1.45), K ? (i % 2 ? C.gun : col) : col]); }
  P.push(['cyl', len, 0, w0, len + 0.05, 0, w0, br * 1.35, br * 1.5, L === 6 ? C.gold : C.gun, { cap: C.glass }]);
  if (K && L >= 5) [-1, 1].forEach(function (sd) { P.push(['cyl', -0.24, sd * 0.13, w0 - 0.02, 0.06, sd * 0.13, w0 - 0.02, 0.04, 0.04, C.white, { cap: col }]); });
  if (K && L === 6) for (i = 0; i < 3; i++) { var an = i / 3 * 6.2832 + 0.5; P.push(['cyl', len + 0.02, Math.cos(an) * br * 1.5, w0 + Math.sin(an) * br * 1.5, len + 0.17, Math.cos(an) * br * 1.0, w0 + Math.sin(an) * br * 1.0, 0.02, 0.008, C.gold]); }
  if (L >= 3 && !K) { var gm = []; t2Gem(gm, -0.1, 0, w0 + 0.17, 0.05, 0.08, hot); P = P.concat(gm); }
  if (L >= 2 && !K) [-1, 1].forEach(function (sd) { P.push(['cyl', -0.2, sd * 0.11, w0 - 0.02, -0.02, sd * 0.11, w0 - 0.02, 0.03, 0.03, C.white, { cap: col }]); });
  gs.push({ prims: P, c: [0.2, 0, w0 + 0.03], el: 0.16, ep: [0, w0], rec: 0.02, mz: [len + 0.07, 0, w0] });
  return { groups: [{ prims: body, c: [0, 0, 0.1] }].concat(gs), mh: 0.3, gc: col, fx: t2LensFx, mzG: 1, heat: K ? w0 : 0 };
};
// 렌즈 빛: 충전(t.busy)될수록 커지고 밝아짐. 쉬는 동안에는 은은하게 숨쉼
function t2LensFx(x, t, X, Y, S, now, st, b, fk, cnt, lk) {
  var G = lk.groups[lk.mzG], s = t2Bake(lk, G, b, 0), bz = clamp(t.busy || 0, 0, 1), on = Math.max(bz, fk > 0 ? 0.35 : 0), k = 0.22 + 0.1 * Math.sin(now * 3) + on * 0.9, r = S * (0.16 + on * 0.3);
  x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(1, k);
  x.drawImage(glowSpr(lk.gc, 48), X + s.mx - r, Y + s.my - r, r * 2, r * 2);
  if (on > 0.05) { x.globalAlpha = Math.min(1, on * 1.2); x.drawImage(glowSpr('#ffffff', 16), X + s.mx - r * 0.4, Y + s.my - r * 0.4, r * 0.8, r * 0.8); }
  if (lk.heat && bz > 0.35) { var hy = Y - (lk.pz + lk.heat * lk.ts) * S * T2_CZ, hr = S * 0.34; x.globalAlpha = (bz - 0.35) * 0.9; x.drawImage(glowSpr('#ff6a3a', 48), X + s.mx * 0.55 - hr, hy + (Y + s.my - hy) * 0.55 - hr, hr * 2, hr * 2); } // 오래 쏘면 냉각 핀이 달아오름
  x.restore();
}
// 떠 있는 프리즘: 평소엔 둘레를 돌고, 쏠 때(t.busy, fireT)는 표적 쪽으로 부채꼴로 모여 빛남. pass 0 = 뒤쪽, 1 = 앞쪽
function t2Prisms(x, t, X, Y, S, now, st, lk, pass) {
  var bz = clamp(t.busy || 0, 0, 1), on = bz > 0.03 || t.fireT > 0 ? 1 : 0, n = lk.gn, i, U = S * lk.ts;
  if (!pass) { st.ga = (st.ga == null ? on : st.ga + (on - st.ga) * 0.14); }
  var ga = st.ga || 0, aim = st.aim == null ? -0.6 : st.aim;
  for (i = 0; i < n; i++) {
    var a0 = now * 0.9 + i / n * 6.2832, a1 = aim + (i - (n - 1) / 2) * (1.5 / n), a = a0 + angDiff(a0, a1) * ga, sn = Math.sin(a);
    if ((sn >= 0 ? 1 : 0) !== pass) continue;
    var gx = X + Math.cos(a) * lk.gr * U, gy = Y + sn * lk.gr * U * T2_SQ - (lk.pz / lk.ts + lk.gz + Math.sin(now * 2.4 + i * 1.7) * 0.03) * U * T2_CZ, G = lk.gems[i], s = t2Bake(lk, G, 0, 0);
    if (bz > 0.02) { var r = S * (0.13 + 0.13 * bz); x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(1, 0.35 + bz * 0.6); x.drawImage(glowSpr(G.col, 32), gx - r, gy - r, r * 2, r * 2); x.restore(); }
    x.drawImage(s.c, gx - s.ax, gy - s.ay + lk.pz / lk.ts * U * T2_CZ);
  }
  if (pass) { var cr = S * (0.3 + bz * 0.35), cy = Y - (lk.pz + (lk.mh - 0.02) * lk.ts) * S * T2_CZ; x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.3 + 0.12 * Math.sin(now * 3) + bz * 0.55; x.drawImage(glowSpr(lk.gc, 48), X - cr, cy - cr, cr * 2, cr * 2); x.restore(); }
}
// ===================== 테슬라 코일 (tesla) =====================
// 1~3: 코일이 높아지고 고리와 애자 기둥이 늘어남. A 폭풍 코일: 코일 3개 + 번개 고리 / B EMP 발생기: 접시형 방출기 + 축전지
T2_LOOK.tesla = function (L, B, col, pz) {
  var C = T2C, P = [], A = L >= 4 && !B, K = L >= 4 && B, tips = [], cop = '#f0a060', i, an;
  function coil(u, v, h, r, n, ball) {
    var w = t2Stack(P, u, v, 0, [[0.06, r * 1.55, C.steelD, r * 1.3]]), k, wk, rk;
    P.push(['cyl', u, v, w, u, v, w + h, r * 0.5, r * 0.4, C.dark]);
    for (k = 0; k < n; k++) { wk = w + h * (k + 0.25) / n; rk = r * (1 - k / n * 0.28); P.push(['cyl', u, v, wk, u, v, wk + h / n * 0.55, rk, rk, k % 2 ? cop : col]); }
    P.push(['cyl', u, v, w + h, u, v, w + h + 0.04, r * 1.2, r * 1.2, L === 6 ? C.gold : C.steel]);
    P.push(['sph', u, v, w + h + 0.04 + ball * 0.75, ball, C.white]);
    tips.push([u, v, w + h + 0.04 + ball * 0.75, ball]);
  }
  function post(u, v, h) { P.push(['cyl', u, v, 0, u, v, h, 0.035, 0.028, C.white]); P.push(['cyl', u, v, h * 0.45, u, v, h * 0.6, 0.045, 0.045, col]); P.push(['sph', u, v, h + 0.03, 0.04, C.steel]); }
  if (!A && !K) {
    coil(0, 0, 0.26 + L * 0.09, 0.115 + L * 0.012, 2 + L, 0.065 + L * 0.012);
    if (L >= 2) for (i = 0; i < (L === 2 ? 2 : 4); i++) { an = L === 2 ? i * Math.PI : i * 1.5708 + 0.7854; post(Math.cos(an) * 0.3, Math.sin(an) * 0.3, 0.13 + L * 0.02); }
  } else if (A) {
    var ch = 0.4 + (L - 4) * 0.08, cr = 0.1 + (L - 4) * 0.008, rr = 0.24;
    for (i = 0; i < 3; i++) { an = -1.5708 + i * 2.0944; coil(Math.cos(an) * rr, Math.sin(an) * rr, ch + (i === 0 ? 0.1 : 0), cr, 4 + (L - 4), 0.07 + (L - 4) * 0.008); }
    var hz = 0.06 + ch * 0.62; [0, 1].forEach(function (h) { P.push(['hoop', 0, 0, hz, rr + 0.13, L === 6 ? C.gold : C.steel, 0.035, h]); });
    if (L >= 5) P.push(['sph', 0, 0, 0.12, 0.09, col, { glow: col }]);
    if (L === 6) { P.push(['cyl', 0, 0, 0, 0, 0, 0.08, 0.12, 0.1, C.gold]); [0, 1].forEach(function (h) { P.push(['hoop', 0, 0, hz + 0.16, rr + 0.02, col, 0.025, h]); }); }
  } else {
    var dh = 0.3 + (L - 4) * 0.05, dr = 0.27 + (L - 4) * 0.03, nc = L === 4 ? 2 : L === 5 ? 4 : 6;
    var w = t2Stack(P, 0, 0, 0, [[0.07, 0.17, C.steelD, 0.14], [dh - 0.07, 0.09, C.gun, 0.07], [0.03, 0.1, col]]);
    P.push(['cyl', 0, 0, w, 0, 0, w + 0.13, 0.09, dr, C.steel, { cap: mixc(col, '#ffffff', 0.35) }]);
    [0, 1].forEach(function (h) { P.push(['hoop', 0, 0, w + 0.13, dr, L === 6 ? C.gold : col, 0.03, h]); });
    P.push(['cyl', 0, 0, w + 0.06, 0, 0, w + 0.3, 0.03, 0.018, C.dark, { zb: 0.5 }]);
    P.push(['sph', 0, 0, w + 0.33, 0.055 + (L - 4) * 0.008, C.white, { zb: 0.5 }]); tips.push([0, 0, w + 0.33, 0.06]);
    for (i = 0; i < nc; i++) { // 축전지
      an = nc === 2 ? i * Math.PI : nc === 4 ? i * 1.5708 + 0.7854 : i * 1.0472; var cu = Math.cos(an) * 0.33, cv = Math.sin(an) * 0.33;
      t2Stack(P, cu, cv, 0, [[0.05, 0.07, C.steelD], [0.1, 0.06, C.white], [0.035, 0.066, col], [0.06, 0.06, C.white], [0.025, 0.045, cop]]);
    }
  }
  var lk = { groups: [{ prims: P, c: [0, 0, 0.2], fixed: 1 }], mh: (tips[0][2] || 0.5), tips: tips, gc: col, fx: t2TeslaFx, emp: K, ring: A ? [0.06 + (0.4 + (L - 4) * 0.08) * 0.62, 0.37] : null };
  return lk;
};
function t2Zap(x, x0, y0, x1, y1, amp, n) {
  x.beginPath(); x.moveTo(x0, y0);
  for (var i = 1; i < n; i++) { var k = i / n; x.lineTo(x0 + (x1 - x0) * k + (Math.random() - 0.5) * amp, y0 + (y1 - y0) * k + (Math.random() - 0.5) * amp); }
  x.lineTo(x1, y1); x.stroke();
}
// 코일 끝 불꽃: 쉬는 동안엔 가끔 작은 불꽃, 쏠 때(fireT)는 굵은 번개 가지와 번개 고리(A), 퍼지는 파동 고리(B)
function t2TeslaFx(x, t, X, Y, S, now, st, b, fk, cnt, lk) {
  var U = S * lk.ts, T = lk.tT || (lk.tT = t2T(0, 0, null, lk.pz / lk.ts)), tp = lk.tp || (lk.tp = lk.tips.map(function (q) { var p = t2P(T, q[0], q[1], q[2]); return [p[0], p[1], q[3]]; })), i, n = tp.length;
  var act = fk > 0 || t.busy > 0.05, lw = Math.max(1, S * 0.022), i0 = n > 1 ? Math.floor(now * 9) % n : 0, px = X + tp[i0][0] * U, py = Y + tp[i0][1] * U;
  x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
  // 빛: 탑 하나에 한 장(코일이 여럿이면 가운데에 크게)
  var gy = n > 1 ? Y + (tp[0][1] + tp[1][1]) * 0.5 * U : py, gr = S * ((n > 1 ? 0.42 : 0.22) + fk * 0.26 + 0.03 * Math.sin(now * 5));
  x.globalAlpha = 0.5 + fk * 0.5; x.drawImage(glowSpr(lk.gc, 48), (n > 1 ? X : px) - gr, gy - gr, gr * 2, gr * 2);
  if (act || Math.random() < 0.12) { // 코일 끝 불꽃 가지
    var a = Math.random() * 6.2832, d = S * (act ? 0.26 + Math.random() * 0.26 : 0.1 + Math.random() * 0.1);
    x.globalAlpha = 0.95; x.strokeStyle = '#efe8ff'; x.lineWidth = lw * (act ? 1.3 : 0.8); t2Zap(x, px, py, px + Math.cos(a) * d, py + Math.sin(a) * d * 0.8, S * 0.09, 4);
    if (act && n > 1) { var p1 = tp[(i0 + 1) % n]; x.lineWidth = lw; t2Zap(x, px, py, X + p1[0] * U, Y + p1[1] * U, S * 0.1, 5); }
  }
  if (lk.ring) { // 번개 고리
    var ry = Y - (lk.pz / lk.ts + lk.ring[0]) * U * T2_CZ, rr = lk.ring[1] * U, sa = now * 3.1;
    x.globalAlpha = 0.9; x.strokeStyle = '#ffffff'; x.lineWidth = lw * (1.2 + fk);
    x.beginPath(); x.ellipse(X, ry, rr, rr * T2_SQ, 0, sa, sa + 0.8 + fk * 1.2); x.stroke(); x.beginPath(); x.ellipse(X, ry, rr, rr * T2_SQ, 0, sa + 3.14, sa + 3.94 + fk * 1.2); x.stroke();
  }
  if (lk.emp && fk > 0) { // 퍼지는 파동
    var e = 1 - fk, er = S * (0.3 + e * 0.75), ey = Y + tp[0][1] * U + S * 0.2;
    x.globalAlpha = fk * 0.9; x.strokeStyle = '#bfe8ff'; x.lineWidth = lw * (2.4 - e); x.beginPath(); x.ellipse(X, ey, er, er * T2_SQ, 0, 0, 6.2832); x.stroke();
  }
  x.restore();
}
// ===================== 저격탑 (sniper) =====================
// 1: 모래주머니 둥지 → 2, 3: 감시탑이 높아짐. A 대물 저격총: 삼각대 위 아주 긴 총과 무릎쏴 사수 / B 관측 저격조: 엎드린 사수 + 관측경과 깃발 든 관측수
T2_LOOK.sniper = function (L, B, col, pz) {
  var C = T2C, fig = [], sp = [], gs = [], sb = [], sf = [], A = L >= 4 && !B, K = L >= 4 && B, th = [0, 0, 0.3, 0.46, 0.56, 0.64, 0.74][L], i, an, hc = mixc(col, C.dark, 0.45), tr = 0.17 + (L >= 4 ? 0.02 : 0), pr = 0.3 + (L >= 4 ? 0.03 + (L - 4) * 0.01 : 0), ts = L <= 3 ? 1.5 : 1.36;
  var wall = L >= 4 ? C.steel : C.conc, bc = mixc(col, '#ffffff', 0.2);
  if (L === 1) { for (i = 0; i < 9; i++) { an = i / 9 * 6.2832 + 0.2; (Math.sin(an) > 0.15 ? sf : sb).push(['cyl', Math.cos(an - 0.2) * 0.37, Math.sin(an - 0.2) * 0.37, pz + 0.045, Math.cos(an + 0.2) * 0.37, Math.sin(an + 0.2) * 0.37, pz + 0.045, 0.055, 0.055, C.sand]); } }
  else {
    // 가늘고 높은 감시탑 + 넓은 사격대(난간 띠는 대표색)
    var w = t2Stack(sb, 0, 0, pz, [[th * 0.22, tr + 0.07, wall, tr], [0.04, tr + 0.014, L === 6 ? C.gold : col], [th * 0.78 - 0.085, tr, wall], [0.045, pr, C.steelD]]);
    sb.push(['box', 0, tr * 0.9, pz + th * 0.5, 0.06, 0.03, 0.1, C.black]);
    sb.push(['hoop', 0, 0, w + 0.03, pr - 0.02, bc, 0.05, 0]); sf.push(['hoop', 0, 0, w + 0.03, pr - 0.02, bc, 0.05, 1]);
    if (L >= 3) [-1, 1].forEach(function (sd) { sf.push(['poly', [[sd * 0.13 - 0.045, tr + 0.03, pz + th - 0.07], [sd * 0.13 + 0.045, tr + 0.03, pz + th - 0.07], [sd * 0.13 + 0.045, tr + 0.03, pz + th - 0.24], [sd * 0.13, tr + 0.03, pz + th - 0.29], [sd * 0.13 - 0.045, tr + 0.03, pz + th - 0.24]], L >= 4 ? (B ? '#ff5d9e' : '#3f9ff5') : col, { two: 1 }]); });
    if (L >= 5) [-1, 1].forEach(function (sd) { sb.push(t2Lamp(sd * (pr - 0.02), -0.02, w + 0.1, 0.03, L === 6 ? C.gold : B ? C.amber : C.cyan)); });
  }
  var prone = function (P, v0, len, br) {
    [-1, 1].forEach(function (sd) { P.push(['cyl', -0.3, v0 + sd * 0.05, 0.03, -0.12, v0 + sd * 0.028, 0.035, 0.03, 0.034, C.gun]); P.push(['cyl', 0.0, v0 + sd * 0.06, 0.05, 0.13, v0 + sd * 0.02, 0.055, 0.026, 0.022, col]); });
    P.push(['cyl', -0.15, v0, 0.045, 0.03, v0, 0.065, 0.06, 0.066, col]);
    P.push(['sph', 0.08, v0, 0.1, 0.066, hc]);
    P.push(['box', 0.09, v0, 0.058, 0.14, 0.036, 0.045, C.wood]);
    t2Brl(P, 0.13, v0, 0.064, len, br, C.dark, { mz: 0.06, mk: 1.9 });
    P.push(['cyl', 0.13, v0, 0.108, 0.25, v0, 0.108, 0.024, 0.024, C.black, { cap: C.glass }]);
    [-1, 1].forEach(function (sd) { P.push(['cyl', 0.34, v0, 0.058, 0.38, v0 + sd * 0.055, 0.0, 0.011, 0.011, C.steelD]); });
  };
  var rec = 0.09, mz, fz = 0.45;
  if (A) {
    var len = 0.56 + (L - 4) * 0.11, br = 0.026 + (L - 4) * 0.003, rw = 0.17;
    fig.push(['cyl', -0.3, -0.04, 0.03, -0.12, -0.03, 0.035, 0.032, 0.036, C.gun]); fig.push(['cyl', -0.14, 0.05, 0.0, -0.1, 0.05, 0.12, 0.036, 0.032, C.gun]);
    fig.push(['cyl', -0.15, 0, 0.06, -0.09, 0, 0.21, 0.066, 0.062, col]);
    fig.push(['sph', -0.05, 0, 0.275, 0.068, L === 6 ? C.red : hc]);
    [-1, 1].forEach(function (sd) { fig.push(['cyl', -0.09, sd * 0.065, 0.19, 0.06, sd * 0.03, rw, 0.026, 0.022, col]); });
    fig.push(['box', 0.04, 0, rw, 0.26, 0.056, 0.07, C.gun]); fig.push(['box', -0.1, 0, rw - 0.01, 0.1, 0.044, 0.075, C.wood]);
    t2Brl(fig, 0.14, 0, rw, len, br, C.steelD, { mz: 0.1, mk: 2.2, mc: L === 6 ? C.gold : C.dark, jk: 0.16, jc: C.gun });
    fig.push(['cyl', 0.0, 0, rw + 0.07, 0.2 + (L - 4) * 0.02, 0, rw + 0.07, 0.03, 0.033, C.black, { cap: C.glass }]);
    if (L >= 5) fig.push(['cyl', 0.03, 0.055, rw - 0.05, 0.12, 0.055, rw - 0.05, 0.038, 0.038, L === 6 ? C.gold : C.brass]);
    sp.push(['cyl', 0.24, 0, rw - 0.03, 0.38, 0, 0, 0.014, 0.014, C.steelD]); [-1, 1].forEach(function (sd) { sp.push(['cyl', 0.24, 0, rw - 0.03, 0.14, sd * 0.13, 0, 0.014, 0.014, C.steelD]); });
    if (L >= 5) sp.push(['box', -0.04, 0.16, 0.045, 0.13, 0.08, 0.09, C.olive, { stripe: C.brass }]);
    rec = 0.13; fz = 0.62 + (L - 4) * 0.06; mz = [0.14 + len + 0.04, 0, rw];
    gs.push({ prims: sp, c: [0.1, 0, 0.02] });
    gs.push({ prims: fig, c: [0.2, 0, 0.16], rec: rec, mz: mz, fz: fz, gl: [0.21 + (L - 4) * 0.02, 0, rw + 0.07] });
  } else {
    var ln = K ? 0.44 + (L - 4) * 0.05 : 0.3 + L * 0.045, v0 = K ? -0.09 : 0;
    prone(fig, v0, ln, 0.019 + (K ? 0.003 : 0)); mz = [0.13 + ln + 0.03, v0, 0.064];
    if (L === 3) fig.push(['cyl', -0.17, v0, 0.07, 0.01, v0, 0.09, 0.074, 0.07, C.olive, { zb: -0.01 }]);
    if (K) {
      var sl = 0.16 + (L - 4) * 0.06, sr = 0.036 + (L - 4) * 0.006, sv = 0.12;
      sp.push(['cyl', -0.22, sv - 0.04, 0.03, -0.06, sv - 0.03, 0.035, 0.032, 0.036, C.gun]); sp.push(['cyl', -0.1, sv + 0.04, 0.0, -0.07, sv + 0.04, 0.11, 0.036, 0.032, C.gun]);
      sp.push(['cyl', -0.11, sv, 0.05, -0.07, sv, 0.2, 0.064, 0.06, col]); sp.push(['sph', -0.04, sv, 0.26, 0.066, hc]);
      sp.push(['cyl', 0.04, sv, 0.2, 0.04 + sl, sv, 0.2, sr, sr * 1.25, C.black, { cap: C.glass }]); sp.push(['cyl', -0.06, sv - 0.03, 0.17, 0.05, sv, 0.2, 0.024, 0.022, col]);
      sp.push(['cyl', 0.1, sv, 0.18, 0.2, sv, 0, 0.012, 0.012, C.steelD]); [-1, 1].forEach(function (sd) { sp.push(['cyl', 0.1, sv, 0.18, 0.03, sv + sd * 0.09, 0, 0.012, 0.012, C.steelD]); });
      var fh = 0.44 + (L - 4) * 0.06, fl = 0.22 + (L - 4) * 0.04;
      sp.push(['cyl', -0.2, sv + 0.05, 0, -0.2, sv + 0.05, fh, 0.015, 0.012, C.wood]);
      sp.push(['poly', [[-0.2, sv + 0.05, fh - 0.01], [-0.2 - fl, sv + 0.05, fh - 0.08], [-0.2, sv + 0.05, fh - 0.17]], C.red, { two: 1 }]);
      sp.push(['sph', -0.2, sv + 0.05, fh + 0.02, 0.025, L === 6 ? C.gold : C.brass]);
      if (L === 6) sp.push(t2Lamp(0.04 + sl + 0.01, sv, 0.26, 0.024, C.red));
      gs.push({ prims: sp, c: [0, sv, 0.12] });
    }
    gs.push({ prims: fig, c: [0.05, v0, 0.06], rec: rec, mz: mz, fz: fz, gl: [0.26, v0, 0.108] });
  }
  return { groups: gs, sb: sb, sf: sf, dz: L === 1 ? 0 : th, mh: A ? 0.17 : 0.07, fc: '#ffe090', ts: ts };
};
['flak', 'sam', 'gatling', 'rocket', 'laser', 'tesla', 'sniper'].forEach(function (k) { TW_EXT[k] = { spr: function (L, B, S) { return t2Spr(k, L, B, S); }, parts: t2Parts }; });
