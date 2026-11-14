// ===== tf_art_tower.js : 타임플렉스 시대 탑 그림 (1장 원시: 돌팔매 터, 투창 터, 모닥불 터, 토템 기둥) + 탄 모양(TF_PJ) =====
// art_tower3.js의 틀(t3Reg, t3Make, 단위 좌표: 1 = 탑 크기, 원점 = 발밑)을 그대로 쓴다. 움직이는 사람(던지는 자세)은 조각으로 두 장 구워 parts가 쏠 때 바꿔 그림
var TFT = { wood: '#a8743e', woodD: '#7a5028', woodL: '#c99a5e', hide: '#d6b07a', hideD: '#b08a56', stone: '#b9b1a4', stoneD: '#8e877c', bone: '#efe4c8', skin: '#d79a62', hair: '#3a2a20', fur: '#8a5a34', red: '#c8483a', ochre: '#e0a040', rune: '#5ff0ff', leaf: '#7a9a46' };
// ---------- 공용 ----------
// 작은 원시인(단위 좌표). pose 0 준비, 1 던짐. arm: 'sling' | 'spear' | 'drum'. sc 크기(키), dir 1 오른쪽
function tfMan(x, cx, by, sc, pose, arm, o) {
  o = o || {}; var h = sc, sk = o.skin || TFT.skin;
  t3L(x, [[cx - h * 0.06, by - h * 0.32], [cx - h * 0.1, by]], sk, h * 0.08); t3L(x, [[cx + h * 0.06, by - h * 0.32], [cx + h * 0.1, by]], twSh(sk, 0.15), h * 0.08);
  // 몸통 + 털옷
  t3Bl(x, [[cx - h * 0.13, by - h * 0.66], [cx + h * 0.12, by - h * 0.68], [cx + h * 0.15, by - h * 0.32], [cx - h * 0.15, by - h * 0.3]], sk, { hi: 0.3, lo: 0.2 });
  t3Pg(x, [[cx - h * 0.16, by - h * 0.55], [cx + h * 0.08, by - h * 0.68], [cx + h * 0.17, by - h * 0.28], [cx + h * 0.06, by - h * 0.24], [cx - h * 0.03, by - h * 0.3], [cx - h * 0.12, by - h * 0.23], [cx - h * 0.18, by - h * 0.3]], o.fur || TFT.fur, { hi: 0.25, lo: 0.25 });
  // 머리
  t3E(x, cx + h * 0.02, by - h * 0.8, h * 0.14, h * 0.15, sk, { hi: 0.35, lo: 0.15 });
  t3Bl(x, [[cx - h * 0.15, by - h * 0.74], [cx - h * 0.13, by - h * 0.94], [cx + h * 0.05, by - h * 0.99], [cx + h * 0.16, by - h * 0.88], [cx + h * 0.04, by - h * 0.86], [cx - h * 0.06, by - h * 0.72]], o.hair || TFT.hair, { hi: 0.2, lo: 0.1 });
  if (o.band) t3L(x, [[cx - h * 0.14, by - h * 0.86], [cx + h * 0.15, by - h * 0.88]], o.band, h * 0.035, 1);
  t3Dot(x, cx + h * 0.09, by - h * 0.81, h * 0.025, '#2a1810');
  // 팔과 무기
  var sx = cx + h * 0.06, sy = by - h * 0.6;
  if (arm === 'sling') {
    if (!pose) { t3L(x, [[sx, sy], [sx - h * 0.12, sy - h * 0.28], [sx - h * 0.05, sy - h * 0.5]], sk, h * 0.07); x.strokeStyle = '#6a4a2a'; x.lineWidth = h * 0.02; x.beginPath(); x.moveTo(sx - h * 0.05, sy - h * 0.5); x.quadraticCurveTo(sx - h * 0.35, sy - h * 0.62, sx - h * 0.3, sy - h * 0.35); x.stroke(); t3E(x, sx - h * 0.3, sy - h * 0.34, h * 0.05, h * 0.045, TFT.stone, {}); }
    else { t3L(x, [[sx, sy], [sx + h * 0.2, sy - h * 0.12], [sx + h * 0.36, sy - h * 0.2]], sk, h * 0.07); x.strokeStyle = '#6a4a2a'; x.lineWidth = h * 0.02; x.beginPath(); x.moveTo(sx + h * 0.36, sy - h * 0.2); x.quadraticCurveTo(sx + h * 0.5, sy - h * 0.1, sx + h * 0.42, sy + h * 0.06); x.stroke(); }
  } else if (arm === 'spear') {
    if (!pose) { t3L(x, [[sx, sy], [sx - h * 0.14, sy - h * 0.16], [sx - h * 0.12, sy - h * 0.34]], sk, h * 0.07); t3L(x, [[sx - h * 0.45, sy - h * 0.2], [sx + h * 0.45, sy - h * 0.52]], TFT.wood, h * 0.035, 1); t3Pg(x, [[sx + h * 0.43, sy - h * 0.48], [sx + h * 0.58, sy - h * 0.6], [sx + h * 0.44, sy - h * 0.58]], TFT.stone, {}); }
    else t3L(x, [[sx, sy], [sx + h * 0.22, sy - h * 0.1], [sx + h * 0.38, sy - h * 0.06]], sk, h * 0.07);
  } else if (arm === 'drum') {
    t3L(x, [[sx, sy], [sx + h * 0.14, sy - (pose ? h * 0.3 : h * 0.12)]], sk, h * 0.07);
  }
  if (o.rune) { t3Glow(x, cx - h * 0.02, by - h * 0.48, h * 0.1, TFT.rune, 0.6); }
}
// 돌무더기(받침 위)
function tfStones(x, cx, by, w, h, rnd, col) {
  var n = Math.round(5 + w * 6), i;
  for (i = 0; i < n; i++) { var t = i / (n - 1), px = cx + (t - 0.5) * w * 1.6 + (rnd() - 0.5) * 0.05, row = i % 2, py = by - row * h * 0.45 - (rnd() * 0.03), r = 0.07 + rnd() * 0.05; t3E(x, px, py - r * 0.6, r, r * 0.75, i % 3 ? col || TFT.stone : twSh(col || TFT.stone, 0.12), { hi: 0.35, lo: 0.25 }); }
  for (i = 0; i < 3; i++) { var px2 = cx + (i - 1) * w * 0.4, r2 = 0.08 + rnd() * 0.03; t3E(x, px2, by - h * 0.85 - r2 * 0.5, r2, r2 * 0.75, TFT.stone, { hi: 0.4, lo: 0.2 }); }
}
// 나무 기둥 망루 바닥(네 기둥 + 널판). 반환: 바닥 높이
function tfDeck(xb, xf, cx, by, w, hgt, col) {
  [[-1, xb], [1, xb]].forEach(function (q) { t3L(q[1], [[cx + q[0] * w * 0.42, by - 0.02], [cx + q[0] * w * 0.36, by - hgt]], twSh(col, 0.1), 0.06); });
  t3L(xb, [[cx - w * 0.4, by - hgt * 0.35], [cx + w * 0.38, by - hgt * 0.7]], twSh(col, 0.2), 0.03); t3L(xb, [[cx + w * 0.4, by - hgt * 0.35], [cx - w * 0.38, by - hgt * 0.7]], twSh(col, 0.2), 0.03);
  [[-1, xf], [1, xf]].forEach(function (q) { t3L(q[1], [[cx + q[0] * w * 0.48, by + 0.03], [cx + q[0] * w * 0.42, by - hgt]], col, 0.065); });
  t3R(xb, cx - w * 0.55, by - hgt - 0.05, w * 1.1, 0.08, 0.02, TFT.woodL, { hi: 0.35, lo: 0.25 });
  return hgt + 0.05;
}
// 가죽 지붕(삼각 천막)
function tfTent(x, cx, top, w, h, col, deco) {
  t3Pg(x, [[cx - w / 2, top], [cx + w * 0.05, top - h], [cx + w / 2, top]], col, { hi: 0.3, lo: 0.25 });
  t3L(x, [[cx - w * 0.05, top - h - 0.06], [cx + w * 0.05, top - h], [cx + w * 0.16, top - h - 0.07]], TFT.wood, 0.025, 1);
  if (deco) { x.strokeStyle = deco; x.lineWidth = 0.022; x.beginPath(); x.moveTo(cx - w * 0.3, top - h * 0.3); x.lineTo(cx - w * 0.1, top - h * 0.55); x.lineTo(cx + w * 0.1, top - h * 0.3); x.lineTo(cx + w * 0.3, top - h * 0.55); x.stroke(); }
}
// 가죽 깃발(단위 좌표): 깃대 끝 (px, py)에서 오른쪽으로
function tfFlag(x, px, py, w, h, col) { t3Pg(x, [[px, py], [px + w * 0.5, py + h * 0.08], [px + w, py + h * 0.02], [px + w * 0.82, py + h * 0.5], [px + w, py + h], [px + w * 0.5, py + h * 0.9], [px, py + h]], col, { hi: 0.3, lo: 0.2 }); }
// 해골(소뼈) 장식
function tfSkull(x, cx, cy, s) {
  t3Bl(x, [[cx - s, cy - s * 0.3], [cx - s * 0.6, cy - s * 0.9], [cx + s * 0.6, cy - s * 0.9], [cx + s, cy - s * 0.3], [cx + s * 0.35, cy + s], [cx - s * 0.35, cy + s]], TFT.bone, { hi: 0.4, lo: 0.2 });
  t3L(x, [[cx - s * 0.8, cy - s * 0.6], [cx - s * 1.5, cy - s * 1.1], [cx - s * 1.4, cy - s * 1.7]], TFT.bone, s * 0.32, 1); t3L(x, [[cx + s * 0.8, cy - s * 0.6], [cx + s * 1.5, cy - s * 1.1], [cx + s * 1.4, cy - s * 1.7]], TFT.bone, s * 0.32, 1);
  t3Dot(x, cx - s * 0.35, cy - s * 0.25, s * 0.2, '#2a1810'); t3Dot(x, cx + s * 0.35, cy - s * 0.25, s * 0.2, '#2a1810');
}
function tfFeathers(x, cx, cy, s, n, cols) {
  for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.35, ex = cx + Math.cos(a) * s, ey = cy + Math.sin(a) * s; t3Bl(x, [[cx, cy], [cx + Math.cos(a - 0.15) * s * 0.6, cy + Math.sin(a - 0.15) * s * 0.6], [ex, ey], [cx + Math.cos(a + 0.15) * s * 0.6, cy + Math.sin(a + 0.15) * s * 0.6]], cols[i % cols.length], { hi: 0.3, lo: 0.2 }); }
}

// ===================== 돌팔매 터 =====================
// 1 돌무더기 위 투척꾼 → 2 높은 돌무더기와 말뚝 → 3 나무 망루와 가죽 지붕. A 눈 밝은 투척꾼(높은 망루, 소뼈와 깃털, 붉은 깃발) / B 연속 돌팔매(넓은 단에 투척꾼 둘, 돌 바구니)
function tfSlingDraw(D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, rnd = D.rnd, top = 0, men = [];
  if (L <= 2) { tfStones(b, 0, 0, 0.42 + L * 0.06, 0.2 + L * 0.1, rnd); top = 0.18 + L * 0.1; if (L === 2) { t3L(b, [[-0.38, 0], [-0.4, -0.5]], TFT.wood, 0.05); t3L(f, [[0.4, 0.02], [0.42, -0.45]], TFT.wood, 0.05); tfSkull(b, -0.4, -0.52, 0.06); } men.push([0, -top]); }
  else if (!A && !V) { top = tfDeck(b, f, 0, 0, 0.7, 0.42, TFT.wood); tfTent(b, -0.05, -top - 0.02, 0.62, 0.32, TFT.hide, TFT.red); men.push([0.06, -top]); }
  else if (A) {
    var hg = [0, 0, 0, 0, 0.62, 0.74, 0.86][L]; top = tfDeck(b, f, 0, 0, 0.62, hg, TFT.woodD);
    tfTent(b, -0.08, -top - 0.08, 0.58, 0.3 + L * 0.03, TFT.hideD, TFT.ochre);
    t3L(b, [[0.3, -top], [0.32, -top - 0.62]], TFT.wood, 0.035); tfFlag(b, 0.32, -top - 0.62, 0.24, 0.13, TFT.red);
    tfSkull(f, 0, -hg * 0.45, 0.08); if (L >= 5) tfFeathers(f, -0.32, -top + 0.02, 0.18, 3, ['#d9463c', '#f3b630', '#ffffff']);
    if (L >= 6) { t3Glow(b, 0.32, -top - 0.62, 0.2, TFT.rune, 0.5); tfFeathers(f, 0.32, -top + 0.02, 0.18, 3, ['#f3b630', '#d9463c', '#ffffff']); }
    men.push([0.08, -top]);
  } else {
    top = 0.22 + (L - 4) * 0.04; t3R(b, -0.55, -top, 1.1, top, 0.04, TFT.stoneD, { hi: 0.3, lo: 0.3 }); t3R(b, -0.6, -top - 0.06, 1.2, 0.08, 0.02, TFT.woodL, { hi: 0.35, lo: 0.25 });
    tfStones(f, 0, 0.02, 0.5, 0.18, rnd); t3E(b, -0.42, -top - 0.12, 0.13, 0.1, TFT.hideD, { hi: 0.3, lo: 0.2 });
    for (var q = 0; q < 4; q++) t3E(b, -0.48 + q * 0.04, -top - 0.2, 0.04, 0.035, TFT.stone, {});
    if (L >= 6) { t3L(b, [[0.5, -top], [0.52, -top - 0.65]], TFT.wood, 0.035); tfFlag(b, 0.52, -top - 0.65, 0.22, 0.12, TFT.ochre); }
    men.push([-0.18, -top]); men.push([0.22, -top]); if (L >= 6) men.push([0.02, -top - 0.02]);
  }
  var sc = 0.5 + (L >= 4 ? 0.04 : 0);
  D.part('man0', [-0.5, -0.72, 0.5, 0.06], function (x) { tfMan(x, 0, 0, sc, 0, 'sling', { band: L >= 4 ? (A ? TFT.red : TFT.ochre) : null, rune: L >= 6 }); });
  D.part('man1', [-0.5, -0.72, 0.6, 0.06], function (x) { tfMan(x, 0, 0, sc, 1, 'sling', { band: L >= 4 ? (A ? TFT.red : TFT.ochre) : null, rune: L >= 6 }); });
  return { men: men, mounts: men.map(function (m) { return [m[0] + 0.15, m[1] - 0.55]; }) };
}
function tfManParts(x, t, X, Y, S, time, info) {
  var p = info.p, u = info.u, f = t3FireK(t), oy = -info.ph * u, n = info.men.length, still = t3Still(t);
  x.save(); x.translate(X, Y + oy);
  for (var i = 0; i < n; i++) {
    var m = info.men[i], shot = !still && f > 0 && (n === 1 || ((t.shots || 0) % n) === i), bob = still ? 0 : Math.sin(time * 3 + i * 2 + (t.id || 0)) * 0.006 * u;
    var flip = t.aim != null && Math.cos(t.aim) < -0.2;
    x.save(); x.translate(m[0] * u, m[1] * u + bob); if (flip) x.scale(-1, 1);
    t3Img(x, shot ? p.man1 : p.man0, 0, 0); x.restore();
  }
  x.restore();
}
t3Reg('sling', tfSlingDraw, tfManParts);

// ===================== 투창 터 =====================
// 1 통나무 받침과 창걸이, 투창꾼 → 2 뼈 울타리 → 3 매머드 뼈 틀. A 매머드 사냥창(통나무로 만든 큰 투창기, 커다란 창이 표적을 겨눔) / B 쌍 투창(투창꾼 둘)
function tfSpearDraw(D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, rnd = D.rnd, men = [], big = null;
  // 바닥 통나무
  t3L(b, [[-0.45, -0.05], [0.45, -0.08]], TFT.woodD, 0.1); t3L(f, [[-0.4, 0.02], [0.4, 0.0]], TFT.wood, 0.1);
  // 창걸이(세운 창들)
  var nsp = L >= 3 ? 4 : 3;
  for (var i = 0; i < nsp; i++) { var sx = -0.42 + i * 0.07; t3L(b, [[sx, -0.04], [sx + 0.05, -0.72 - (i % 2) * 0.05]], TFT.woodL, 0.022, 1); t3Pg(b, [[sx + 0.03, -0.7 - (i % 2) * 0.05], [sx + 0.07, -0.86 - (i % 2) * 0.05], [sx + 0.08, -0.7 - (i % 2) * 0.05]], TFT.stone, {}); }
  if (L >= 2) { for (var j = 0; j < 3; j++) t3L(f, [[0.22 + j * 0.1, 0.02], [0.24 + j * 0.11, -0.28 - (j % 2) * 0.06]], TFT.bone, 0.035, 1); }
  if (L >= 3 && !A) { t3L(b, [[-0.5, -0.05], [-0.3, -0.85], [0.1, -0.95]], TFT.bone, 0.05); t3L(b, [[0.5, -0.05], [0.35, -0.75], [0.1, -0.95]], TFT.bone, 0.05); }
  if (A) {
    // 큰 투창기: A자 통나무 틀 위에 굴대, 큰 창은 조각으로 표적을 겨눔
    var hg = [0, 0, 0, 0, 0.42, 0.48, 0.56][L];
    t3L(b, [[-0.36, 0], [0, -hg]], TFT.woodD, 0.07); t3L(b, [[0.36, 0], [0, -hg]], TFT.woodD, 0.07);
    t3L(f, [[-0.3, 0.02], [0.02, -hg + 0.02]], TFT.wood, 0.07); t3L(f, [[0.3, 0.02], [0.02, -hg + 0.02]], TFT.wood, 0.07);
    t3E(f, 0, -hg, 0.07, 0.07, TFT.bone, { hi: 0.4, lo: 0.2 });
    tfSkull(f, 0, -hg * 0.42, 0.07);
    if (L >= 6) { t3L(b, [[-0.4, -0.05], [-0.45, -1.0]], TFT.bone, 0.06); t3L(b, [[0.4, -0.05], [0.45, -1.0]], TFT.bone, 0.06); t3Glow(b, 0, -hg, 0.25, TFT.rune, 0.45); }
    var len = 0.85 + (L - 4) * 0.12;
    D.part('big', [-len * 0.5, -0.1, len * 0.55, 0.1], function (x) { t3L(x, [[-len * 0.45, 0], [len * 0.38, 0]], TFT.woodL, 0.045, 1); t3Pg(x, [[len * 0.36, -0.05], [len * 0.55, 0], [len * 0.36, 0.05]], L >= 6 ? '#9adfff' : TFT.stone, { hi: 0.4, lo: 0.2 }); [-0.42, -0.36].forEach(function (k) { t3Pg(x, [[len * k, 0], [len * k - 0.06, -0.06], [len * k - 0.02, 0]], TFT.red, { flat: 1 }); }); });
    big = [0, -hg];
    men.push([-0.32, -0.04]);
  } else if (V) { men.push([-0.2, -0.05]); men.push([0.18, -0.05]); if (L >= 6) men.push([0, -0.08]); }
  else men.push([0.05, -0.05]);
  var sc = 0.52;
  D.part('man0', [-0.6, -0.8, 0.7, 0.06], function (x) { tfMan(x, 0, 0, sc, 0, 'spear', { band: L >= 4 ? (A ? TFT.red : TFT.ochre) : null, rune: L >= 6 }); });
  D.part('man1', [-0.6, -0.8, 0.7, 0.06], function (x) { tfMan(x, 0, 0, sc, 1, 'spear', { band: L >= 4 ? (A ? TFT.red : TFT.ochre) : null, rune: L >= 6 }); });
  return { men: men, big: big, mounts: big ? [[big[0], big[1]]] : men.map(function (m) { return [m[0] + 0.2, m[1] - 0.6]; }) };
}
function tfSpearParts(x, t, X, Y, S, time, info) {
  tfManParts(x, t, X, Y, S, time, info);
  if (!info.big) return;
  var u = info.u, f = t3FireK(t), a = t.aim == null ? -0.3 : t.aim, back = f > 0 ? (1 - f) : 1;
  x.save(); x.translate(X + info.big[0] * u, Y + (info.big[1] - info.ph) * u);
  if (back > 0.05) t3Rot(x, info.p.big, Math.cos(a) * -0.12 * u * (1 - back), Math.sin(a) * -0.12 * u * (1 - back) * 0.78, Math.atan2(Math.sin(a) * 0.78, Math.cos(a)), 1);
  x.restore();
}
t3Reg('spear', tfSpearDraw, tfSpearParts);

// ===================== 모닥불 터 =====================
// 1 돌 둘레 모닥불 → 2 장작이 쌓인 큰 불 → 3 돌 화덕과 소뼈 틀. A 들불(높은 화덕과 가죽 풀무) / B 불 고리(작은 불 구덩이 여럿이 둥글게)
function tfFireDraw(D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, rnd = D.rnd, fires = [], r = 0.3 + Math.min(L, 3) * 0.05;
  function ring(cx, cy, rr, back) {
    var n = 9;
    for (var i = 0; i < n; i++) { var a = Math.PI * 2 * i / n, px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.5, s = 0.06 + rnd() * 0.025; if ((Math.sin(a) < 0) === !!back) t3E(back ? b : f, px, py - s * 0.5, s, s * 0.75, i % 2 ? TFT.stone : TFT.stoneD, { hi: 0.35, lo: 0.25 }); }
  }
  if (V) {
    var nn = L >= 6 ? 4 : 3;
    t3E(b, 0, -0.02, 0.42, 0.22, '#5a3a28', { flat: 1, ink: 0 });
    for (var k = 0; k < nn; k++) { var a = Math.PI * 2 * k / nn + 0.4, cx = Math.cos(a) * 0.3, cy = Math.sin(a) * 0.15 - 0.02; ring(cx, cy, 0.12, 1); t3L(b, [[cx - 0.08, cy], [cx + 0.08, cy - 0.02]], TFT.woodD, 0.035); ring(cx, cy, 0.12, 0); fires.push([cx, cy, 0.55]); }
    if (L >= 5) { t3L(b, [[-0.05, -0.02], [0, -0.75]], TFT.bone, 0.05); tfSkull(b, 0, -0.78, 0.08); }
  } else {
    if (L >= 3) { t3Cyl(b, 0, -0.16 - (A ? (L - 3) * 0.06 : 0), r, r * 0.5, 0.16 + (A ? (L - 3) * 0.06 : 0), TFT.stoneD, { top: '#5a3a28' }); }
    var by = L >= 3 ? -0.16 - (A ? (L - 3) * 0.06 : 0) : 0;
    ring(0, by, r, 1);
    // 장작
    t3L(b, [[-r * 0.6, by - 0.02], [r * 0.5, by - 0.08]], TFT.woodD, 0.05); t3L(b, [[r * 0.6, by - 0.02], [-r * 0.4, by - 0.1]], TFT.wood, 0.05);
    if (L >= 2) t3L(b, [[-r * 0.2, by + 0.02], [r * 0.1, by - 0.16]], TFT.woodD, 0.045);
    ring(0, by, r, 0);
    if (L >= 3 && !A) { t3L(b, [[-r - 0.05, 0], [-r * 0.6, by - 0.75], [0, by - 0.82]], TFT.bone, 0.045); t3L(b, [[r + 0.05, 0], [r * 0.6, by - 0.75], [0, by - 0.82]], TFT.bone, 0.045); tfSkull(b, 0, by - 0.84, 0.065); }
    if (A) { // 가죽 풀무와 깃발
      t3Bl(b, [[-r - 0.2, by - 0.05], [-r - 0.05, by - 0.2], [-r + 0.05, by - 0.08], [-r - 0.08, by + 0.05]], TFT.hideD, { hi: 0.3, lo: 0.2 }); t3L(b, [[-r + 0.02, by - 0.1], [-r * 0.5, by - 0.08]], TFT.woodD, 0.03);
      t3L(b, [[r + 0.05, 0], [r + 0.08, by - 0.95]], TFT.wood, 0.035); tfFlag(b, r + 0.08, by - 0.95, 0.22, 0.12, TFT.red);
      if (L >= 6) t3Glow(b, 0, by - 0.3, 0.4, '#ff8a3a', 0.4);
    }
    fires.push([0, by, 0.7 + Math.min(L, 6) * 0.08 + (A ? 0.15 : 0)]);
  }
  return { fires: fires, mounts: fires.map(function (q) { return [q[0], q[1] - 0.25]; }) };
}
function tfFlame(x, cx, by, w, h, t, ph) {
  var cols = ['rgba(255,110,40,0.95)', 'rgba(255,190,60,0.95)', 'rgba(255,245,190,0.95)'];
  for (var i = 0; i < 3; i++) {
    var k = 1 - i * 0.3, ww = w * k, hh = h * k * (1 + 0.12 * Math.sin(t * 9 + ph + i)), lean = Math.sin(t * 5 + ph * 2 + i) * ww * 0.25;
    x.fillStyle = cols[i]; x.beginPath(); x.moveTo(cx - ww, by); x.quadraticCurveTo(cx - ww * 0.9, by - hh * 0.55, cx + lean, by - hh); x.quadraticCurveTo(cx + ww * 0.9, by - hh * 0.55, cx + ww, by); x.closePath(); x.fill();
  }
}
function tfFireParts(x, t, X, Y, S, time, info) {
  var u = info.u, oy = -info.ph * u, f = t3FireK(t), still = t3Still(t), tm = still ? 0.2 : time;
  x.save(); x.translate(X, Y + oy);
  info.fires.forEach(function (q, i) {
    var w = 0.11 * q[2] * u, h = (0.3 + 0.12 * f) * q[2] * u * (still ? 0.6 : 1);
    t3Glow(x, q[0] * u, (q[1] - 0.12) * u, w * 3.2, '#ff8a3a', 0.45 + f * 0.3);
    tfFlame(x, q[0] * u, q[1] * u, w, h, tm, i * 1.7 + (t.id || 0));
  });
  x.restore();
}
t3Reg('bonfire', tfFireDraw, tfFireParts);

// ===================== 토템 기둥 =====================
// 1 얼굴 새긴 나무 기둥 → 2 날개 판 → 3 뿔과 깃털. A 전쟁 북(커다란 가죽 북과 북 치는 이) / B 정령 토템(빛나는 눈, 떠도는 정령 불)
function tfTotemDraw(D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, h = 0.8 + Math.min(L, 6) * 0.08, w = 0.17, faces = Math.min(3, 1 + Math.floor((L + 1) / 2)), eyes = [], col = V ? '#8a6a9a' : TFT.wood;
  t3E(b, 0, -0.02, 0.26, 0.12, TFT.stoneD, { hi: 0.3, lo: 0.2 });
  t3R(b, -w, -h, w * 2, h, 0.05, col, { hi: 0.3, lo: 0.3 });
  for (var i = 0; i < faces; i++) {
    var fy = -h + 0.12 + i * (h - 0.2) / faces, fc = [TFT.red, TFT.ochre, '#3f8fb0'][i % 3];
    t3R(b, -w * 0.9, fy, w * 1.8, 0.05, 0.01, fc, { hi: 0.3, lo: 0.2 });
    t3E(b, -w * 0.4, fy + 0.12, 0.04, 0.035, '#f6eed8', {}); t3E(b, w * 0.4, fy + 0.12, 0.04, 0.035, '#f6eed8', {});
    t3Dot(b, -w * 0.4, fy + 0.12, 0.018, '#2a1810'); t3Dot(b, w * 0.4, fy + 0.12, 0.018, '#2a1810');
    t3R(b, -w * 0.45, fy + 0.19, w * 0.9, 0.035, 0.01, '#2a1810', { flat: 1 });
    if (i === 0) eyes = [[-w * 0.4, fy + 0.12], [w * 0.4, fy + 0.12]];
  }
  if (L >= 2) { // 날개 판
    [-1, 1].forEach(function (sd) { t3Pg(b, [[sd * w, -h + 0.18], [sd * (w + 0.3), -h + 0.06], [sd * (w + 0.26), -h + 0.2], [sd * (w + 0.1), -h + 0.28], [sd * w, -h + 0.3]], TFT.ochre, { hi: 0.35, lo: 0.25 }); t3L(b, [[sd * (w + 0.05), -h + 0.2], [sd * (w + 0.22), -h + 0.13]], TFT.red, 0.02, 1); });
  }
  if (L >= 3) { // 뿔과 깃털
    t3L(b, [[-w * 0.6, -h], [-w * 1.6, -h - 0.16], [-w * 1.3, -h - 0.3]], TFT.bone, 0.04, 1); t3L(b, [[w * 0.6, -h], [w * 1.6, -h - 0.16], [w * 1.3, -h - 0.3]], TFT.bone, 0.04, 1);
    tfFeathers(b, 0, -h, 0.22, 3, ['#d9463c', '#f3b630', '#ffffff']);
  }
  if (A) { // 전쟁 북
    var dx = 0.32, dy = -0.2;
    t3Cyl(f, dx, dy - 0.05, 0.16, 0.07, 0.2, TFT.hideD, { top: TFT.hide });
    t3L(f, [[dx - 0.14, dy + 0.15], [dx - 0.16, dy + 0.22]], TFT.woodD, 0.03); t3L(f, [[dx + 0.14, dy + 0.15], [dx + 0.16, dy + 0.22]], TFT.woodD, 0.03);
    if (L >= 6) t3Glow(f, dx, dy - 0.05, 0.2, TFT.rune, 0.4);
  }

  return { eyes: eyes, eyeC: V ? '#c79bff' : A ? '#ff9a4a' : '#ffd86a', wisps: V ? L - 3 : 0, h: h, drum: A ? [0.32, -0.25] : null, mounts: [[0, -h * 0.7]] };
}
function tfTotemParts(x, t, X, Y, S, time, info) {
  var u = info.u, oy = -info.ph * u, still = t3Still(t), tm = still ? 0.3 : time, pulse = still ? 0 : 0.5 + 0.5 * Math.sin(tm * 2.4 + (t.id || 0));
  x.save(); x.translate(X, Y + oy);
  info.eyes.forEach(function (e) { t3Glow(x, e[0] * u, e[1] * u, u * (0.05 + 0.03 * pulse), info.eyeC, 0.5 + pulse * 0.4); });
  if (info.drum && !still) { var hit = Math.max(0, Math.sin(tm * 6)); if (hit > 0.9) t3Glow(x, info.drum[0] * u, info.drum[1] * u, u * 0.25, '#ffd86a', (hit - 0.9) * 6); }
  for (var i = 0; i < info.wisps; i++) { var a = tm * 1.2 + i * 2.094 + (t.id || 0); t3Glow(x, Math.cos(a) * 0.38 * u, (-info.h * 0.6 + Math.sin(a) * 0.1) * u, u * 0.1, info.eyeC, 0.9); }
  x.restore();
}
t3Reg('totem', tfTotemDraw, tfTotemParts);

// ===================== 탄 모양 (render.js가 tw.k로 찾아 부름; true면 기본 그리기 건너뜀) =====================
var TF_PJ = {};
function tfPjArc(p, S) {
  var u = p.u || 0, z = arcAt(p, u), X = WX(p.x), Y = WY(p.y), u2 = Math.min(1, u + 0.03), z2 = arcAt(p, u2), nx = lerp(p.sx, p.tx, u2), ny = lerp(p.sy, p.ty, u2);
  return { X: X, Y: Y, hx: X, hy: Y - z * S, ang: Math.atan2((WY(ny) - z2 * S) - (Y - z * S), WX(nx) - X) };
}
// 돌팔매: 빙글 도는 돌멩이와 흙빛 꼬리
TF_PJ.sling = function (x, p, tw, S) {
  if (p.kind !== 'arrow') return false;
  if (p.zs == null) { p.zs = p.h0 || 0.6; p.xs = 0; }
  var q = tfPjArc(p, S), r = S * (p.big || p.crit ? 0.085 : 0.06);
  shadowAt(x, q.X, q.Y, S * 0.07, S * 0.03, 0.3);
  streakAt(x, q.hx, q.hy, q.ang, S * 0.35, r * 1.2, p.crit ? '#ffe066' : '#c9a06a', 0.6);
  x.save(); x.translate(q.hx, q.hy); x.rotate((p.t || 0) * 14);
  x.fillStyle = '#8e877c'; x.strokeStyle = '#2a1e14'; x.lineWidth = Math.max(1, S * 0.018);
  x.beginPath(); x.moveTo(-r, -r * 0.3); x.lineTo(-r * 0.3, -r); x.lineTo(r * 0.8, -r * 0.6); x.lineTo(r, r * 0.4); x.lineTo(0, r); x.lineTo(-r * 0.8, r * 0.6); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.arc(-r * 0.3, -r * 0.35, r * 0.3, 0, Math.PI * 2); x.fill();
  x.restore();
  return true;
};
// 투창: 나무 자루와 돌 촉, 빨간 깃 (bolt 탄은 곧게 날아감)
TF_PJ.spear = function (x, p, tw, S) {
  if (p.kind !== 'bolt') return false;
  var X = WX(p.x), Y = WY(p.y), ang = Math.atan2(p.vy || 0, p.vx || 1), len = S * (p.lvl >= 4 && p.br === 0 ? 0.9 : 0.62);
  shadowAt(x, X, WY(p.y + 0.35), S * 0.12, S * 0.03, 0.25);
  x.save(); x.translate(X, Y); x.rotate(ang); x.lineCap = 'round';
  x.strokeStyle = '#2a1e14'; x.lineWidth = Math.max(2, S * 0.05); x.beginPath(); x.moveTo(-len * 0.5, 0); x.lineTo(len * 0.35, 0); x.stroke();
  x.strokeStyle = '#c99a5e'; x.lineWidth = Math.max(1, S * 0.028); x.stroke();
  x.fillStyle = p.st && p.st.shred ? '#9adfff' : '#b9b1a4'; x.strokeStyle = '#2a1e14'; x.lineWidth = Math.max(1, S * 0.016);
  x.beginPath(); x.moveTo(len * 0.33, -S * 0.05); x.lineTo(len * 0.56, 0); x.lineTo(len * 0.33, S * 0.05); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#c8483a'; x.beginPath(); x.moveTo(-len * 0.5, 0); x.lineTo(-len * 0.42, -S * 0.06); x.lineTo(-len * 0.36, 0); x.lineTo(-len * 0.42, S * 0.06); x.closePath(); x.fill();
  x.restore();
  return true;
};
