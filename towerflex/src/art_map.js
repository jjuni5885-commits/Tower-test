// ===== art_map.js : 테마, 땅, 길, 물/용암, 소품, 성문 (귀염판) =====
// 귀염판: 밝은 사탕 색 땅, 크림빛 길(가장 또렷하게), 둥근 소품, 자두빛 그늘, 밝은 파스텔 마무리
// 칠 도구(twFill, twInk, twShadow, twShine...)는 art_tower.js 함수(같은 묶음 안이라 어디서나 부를 수 있음)
var THEME = {
  meadow: { g: ['#5fc256', '#79d160', '#95dd6e'], patch: '#b2e57c', grass: ['#3fa448', '#58bb50', '#86d867', '#c6f28c'], dirt: ['#cf9258', '#f7d6a0', '#ffe8c2', '#fff7e4'], road: 'dirt',
    tree: ['#2c9550', '#47ba60', '#76d76e', '#c4f59c'], trunk: '#a8693f', rock: '#cfc5e2', moss: '#8edb68', flowers: ['#ff8fc0', '#ffe066', '#ffffff', '#b9a2ff', '#ff9f7a', '#7cc8ff'], water: ['#36aee6', '#66cff6', '#d4f6ff'], shore: '#f3e2b2',
    light: '#fff6d8', lightA: 0.16, shade: '#7a5aa0', amb: 'pollen', props: ['tree', 'tree2', 'bush', 'flowers', 'tree', 'rock', 'mushred'], a: 'bush', b: 'rock', c: 'tree', C: 'bigrock' },
  forest: { g: ['#3aa864', '#4cb870', '#66c87e'], patch: '#8ad68a', grass: ['#2a9456', '#40aa64', '#68c676', '#a8e89a'], dirt: ['#bd8456', '#efcc98', '#f9dfb4', '#fff2da'], road: 'dirt',
    tree: ['#1c7a50', '#2f9c5e', '#58c06e', '#a6ec96'], trunk: '#9a5e3c', rock: '#c6c8de', moss: '#7ed47a', flowers: ['#ffd1e8', '#ffe066', '#ffffff', '#ff9fc6'], water: ['#2fa6c8', '#5ac6e0', '#ccf6ff'], shore: '#e4d8a8',
    light: '#fff2cc', lightA: 0.12, shade: '#3a5a8a', amb: 'leaves', props: ['tree', 'pine', 'tree', 'bush', 'mushred', 'pine'], a: 'bush', b: 'stump', c: 'tree', C: 'bigtree' },
  swamp: { g: ['#58b896', '#6ec6a2', '#88d4b2'], patch: '#a6e0bc', grass: ['#3a9878', '#50ae88', '#78c89c', '#b4ecc8'], dirt: ['#a8805a', '#e0bf92', '#efd5ac', '#fbe9cc'], road: 'mud',
    tree: ['#2a7a66', '#3a9c78', '#5cba8c', '#a8e8c0'], trunk: '#8a6448', rock: '#bcc8d8', moss: '#7ad0a0', flowers: ['#ffb8e0', '#fff0a0', '#ffffff', '#c8b0ff'], water: ['#25b2aa', '#55d4c4', '#d0fff4'], shore: '#d6ecbe',
    light: '#f2fff2', lightA: 0.1, shade: '#3a6a9a', amb: 'fog', props: ['dead', 'reeds', 'tree', 'rock', 'mushred', 'reeds'], a: 'reeds', b: 'stump', c: 'dead', C: 'bigrock' },
  deepforest: { g: ['#2c8a88', '#389a94', '#4cada0'], patch: '#6aa8bc', grass: ['#1e7472', '#2c8c86', '#46a896', '#8cdcc4'], dirt: ['#a2845e', '#e6cc9e', '#f2dcb6', '#fff2dc'], road: 'dirt',
    tree: ['#17646a', '#278680', '#44a690', '#9ce4c8'], trunk: '#7a5646', rock: '#b8b2de', moss: '#9ae6c8', flowers: ['#d8b8ff', '#9fe8ff', '#ffb8e8'], water: ['#2898b0', '#4cc0d2', '#c4f6ff'], shore: '#a4d8bc',
    light: '#eaf8ff', lightA: 0.08, shade: '#3a3a8a', amb: 'spores', props: ['bigtree', 'pine', 'tree', 'mush', 'rock', 'mush'], a: 'mush', b: 'stump', c: 'tree', C: 'bigtree' },
  canyon: { g: ['#ef9468', '#f5a87a', '#fbbf90'], patch: '#ffd2a2', grass: ['#d47e54', '#e69464', '#f6b080', '#ffd6ac'], dirt: ['#c8694a', '#ffe6c0', '#fff3dc', '#ffffff'], road: 'sand',
    tree: ['#4a9a52', '#62b45e', '#88cc6e', '#ccee9a'], trunk: '#a0684a', rock: '#f08868', moss: '#ffd08a', flowers: ['#ff8fc0', '#ffe066', '#ffffff'], water: ['#33b0d0', '#66cee6', '#d4f8ff'], shore: '#ffdcae',
    light: '#fff2d6', lightA: 0.18, shade: '#a04a72', amb: 'dust', props: ['sandrock', 'cactus', 'drybush', 'sandrock', 'mesa', 'cactus'], a: 'drybush', b: 'sandrock', c: 'pillarRock', C: 'mesa' },
  snow: { g: ['#d2def4', '#e4edfa', '#f6faff'], patch: '#eadff6', grass: ['#c6d4f0', '#d8e4f8', '#ecf2fc', '#ffffff'], dirt: ['#7f94d4', '#b2c4f0', '#c8d6f6', '#eef4ff'], road: 'snow',
    tree: ['#2a8486', '#3aa496', '#5ec2aa', '#ffffff'], trunk: '#8a6450', rock: '#b6c2e2', moss: '#ffffff', flowers: ['#ffffff'], water: ['#96cbf0', '#bfe2fa', '#f2fbff'], shore: '#c8d6f2',
    light: '#ffffff', lightA: 0.12, shade: '#8a76c4', amb: 'snow', ice: 1, props: ['pine', 'pine', 'rock', 'snowpile', 'pine', 'snowman'], a: 'snowpile', b: 'rock', c: 'pine', C: 'icecrystal' },
  ruins: { g: ['#8ccb7c', '#a2d78c', '#b8e39e'], patch: '#d4cee8', grass: ['#6cb268', '#84c478', '#a6d890', '#d6f2b2'], dirt: ['#9a88c0', '#e6dcf2', '#f2ecfa', '#ffffff'], road: 'cobble',
    tree: ['#36985a', '#52b26a', '#7ccc7a', '#c8f0a6'], trunk: '#9a6a4a', rock: '#ddd2ee', moss: '#98d878', flowers: ['#ff8fc0', '#ffe066', '#b9a2ff', '#ffffff', '#ff9f7a'], water: ['#52b6d8', '#7ccee8', '#d8f6ff'], shore: '#e8dcc6',
    light: '#fff6e2', lightA: 0.08, shade: '#7a5a9a', amb: 'ash', props: ['pillar', 'tree', 'flowers', 'rock', 'dead', 'grave'], a: 'rubble', b: 'grave', c: 'pillar', C: 'shrine' },
  volcano: { g: ['#8a5848', '#9c6854', '#b07a62'], patch: '#c4886c', grass: ['#6a4234', '#825242', '#a06a54', '#cc9478'], dirt: ['#5a3226', '#ecc192', '#f6d6ae', '#fff2dc'], road: 'gravel',
    tree: ['#a8344a', '#e0525e', '#ff8a6a', '#ffd29a'], trunk: '#5a3a30', rock: '#6e4840', moss: '#ff8a6a', flowers: ['#ff9a6a', '#ffd06a', '#ff7aa8'], water: ['#ff6a5a', '#ffa05a', '#ffe58a'], shore: '#4a2a24',
    light: '#ffe6c8', lightA: 0.14, shade: '#6a2a5a', amb: 'embers', lava: 1, props: ['basalt', 'charred', 'obsid', 'basalt', 'rock', 'obsid'], a: 'obsid', b: 'basalt', c: 'charred', C: 'bigbasalt' },
  dark: { g: ['#4a3c84', '#584896', '#6a58a8'], patch: '#7a64ba', grass: ['#3a2e70', '#4a3c86', '#6c5aaa', '#a68ee0'], dirt: ['#2c2258', '#c6b6f2', '#dacff8', '#f6f0ff'], road: 'obsidian',
    tree: ['#3c2a7a', '#5a44a6', '#8a6ad0', '#d8c4ff'], trunk: '#4a3a6a', rock: '#8a7ac4', moss: '#ff9ad8', flowers: ['#ff9ad8', '#9fe8ff', '#fff0a0', '#c8a8ff'], water: ['#5a3ab0', '#7a5ad0', '#d4bcff'], shore: '#2e2458',
    light: '#f2e4ff', lightA: 0.1, shade: '#2a1a5a', amb: 'motes', props: ['spike', 'darkcrystal', 'dead', 'spike', 'rubble', 'dead'], a: 'rubble', b: 'spike', c: 'darkcrystal', C: 'obelisk' }
};

// ---------- 소품 그림 (스프라이트, 땅 닿는 점이 기준) ----------
var PROP_CACHE = {};
function propSpr(kind, th, S, seed) {
  var key = kind + ':' + th + ':' + Math.round(S) + ':' + seed;
  if (PROP_CACHE[key]) return PROP_CACHE[key];
  var T = THEME[th], f = PROPS[kind] || PROPS.rock;
  TW_IW = Math.max(0.9, S * 0.022);
  return (PROP_CACHE[key] = trimSpr(f(S, T, rngOf(seed * 7919 + hashStr(kind)), seed, th)));
}
function canvasFor(S, w, h, gyF) { var c = mkC(S * w, S * h); return { c: c, x: cx2(c), gx: S * w / 2, gy: S * h * gyF }; }
// 둥근 덩어리 모양: 바깥 테두리는 한 번만(속 선 없이)
function mpBlobs(x, blobs, pal, R, o) {
  o = o || {};
  var cs = shp(), iw = TW_IW * (o.iw || 1);
  blobs.forEach(function (b) { cs.ell(b[0], b[1], b[2], b[2] * (b[3] || 0.92)); });
  x.fillStyle = twInkC(pal[0]); blobs.forEach(function (b) { x.beginPath(); x.ellipse(b[0], b[1], b[2] + iw, b[2] * (b[3] || 0.92) + iw, 0, 0, Math.PI * 2); x.fill(); });
  twFill(x, cs, pal[1], { hi: 0.12, lo: 0.2, mid: 0.5 });
  x.save(); x.clip(cs.p);
  // 덩어리마다 왼쪽 위 밝은 면(셀 그림자 느낌)
  blobs.forEach(function (b) { x.fillStyle = rgba(pal[2], 0.95); x.beginPath(); x.ellipse(b[0] - b[2] * 0.2, b[1] - b[2] * 0.26, b[2] * 0.7, b[2] * 0.62 * (b[3] || 0.92), 0, 0, Math.PI * 2); x.fill(); });
  blobs.forEach(function (b) { x.fillStyle = rgba(pal[3], 0.55); x.beginPath(); x.ellipse(b[0] - b[2] * 0.32, b[1] - b[2] * 0.4, b[2] * 0.32, b[2] * 0.24, -0.4, 0, Math.PI * 2); x.fill(); });
  x.restore();
  coreShadow(x, cs, pal[0], R * 0.2, 0.45);
  // 속 경계는 오른쪽 아래 짧은 호만
  x.save(); x.strokeStyle = rgba(twInkC(pal[0]), 0.35); x.lineWidth = iw * 0.7; x.lineCap = 'round';
  blobs.slice(1).forEach(function (b) { if (b[1] > blobs[0][1] + R * 0.05) return; x.beginPath(); x.ellipse(b[0], b[1], b[2], b[2] * (b[3] || 0.92), 0, 0.25, 1.35); x.stroke(); });
  x.restore();
  return cs;
}
function treeCanopy(x, cxp, cyp, R, pal, rnd, n) {
  n = n || 5;
  var blobs = [[cxp, cyp, R * 0.6]];
  for (var k = 0; k < n; k++) { var a = Math.PI * (0.95 + k / (n - 1) * 1.1) + (rnd() - 0.5) * 0.25, d = R * (0.42 + rnd() * 0.08); blobs.push([cxp + Math.cos(a) * d, cyp + Math.sin(a) * d * 0.78, R * (0.42 + rnd() * 0.1)]); }
  blobs.push([cxp - R * 0.32, cyp + R * 0.22, R * 0.44]); blobs.push([cxp + R * 0.34, cyp + R * 0.2, R * 0.42]);
  var cs = mpBlobs(x, blobs, pal, R);
  twShine(x, cxp - R * 0.38, cyp - R * 0.5, R * 0.1, R * 0.06, 0.8);
  return cs;
}
// 열매/꽃 점
function mpDots(x, cs, n, cols, r, rnd) {
  x.save(); x.clip(cs.p);
  for (var i = 0; i < n; i++) { var px = cs.x0 + cs.w() * (0.15 + rnd() * 0.7), py = cs.y0 + cs.h() * (0.15 + rnd() * 0.6), c = cols[Math.floor(rnd() * cols.length)]; x.fillStyle = twInkC(c); x.beginPath(); x.arc(px, py, r + TW_IW * 0.6, 0, Math.PI * 2); x.fill(); x.fillStyle = c; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.arc(px - r * 0.35, py - r * 0.35, r * 0.35, 0, Math.PI * 2); x.fill(); }
  x.restore();
}
function mpTrunk(x, gx, gy, w, h, col) {
  var ts = shp(), p = ts.p; p.moveTo(gx - w * 0.85, gy + w * 0.12); p.quadraticCurveTo(gx - w * 0.45, gy - h * 0.2, gx - w * 0.42, gy - h); p.lineTo(gx + w * 0.42, gy - h); p.quadraticCurveTo(gx + w * 0.45, gy - h * 0.2, gx + w * 0.9, gy + w * 0.12); p.quadraticCurveTo(gx, gy + w * 0.3, gx - w * 0.85, gy + w * 0.12); p.closePath(); ts.ext(gx - w * 0.9, gy - h); ts.ext(gx + w * 0.9, gy + w * 0.3);
  twCylG(x, ts, col, { hi: 0.35 }); twInk(x, ts, col); return ts;
}
// 꽃 한 송이(꽃잎 5장)
function mpFlower(x, px, py, r, col, cen) {
  x.fillStyle = col;
  for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2 - Math.PI / 2; x.beginPath(); x.ellipse(px + Math.cos(a) * r * 0.62, py + Math.sin(a) * r * 0.5, r * 0.46, r * 0.4, a, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = cen || '#ffd23a'; x.beginPath(); x.arc(px, py, r * 0.34, 0, Math.PI * 2); x.fill();
}
var PROPS = {
  tree: function (S, T, rnd, seed) {
    var o = canvasFor(S, 1.5, 1.9, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * (0.92 + rnd() * 0.16);
    twShadow(x, gx + sz * 0.14, gy, sz * 0.55, sz * 0.2, 0.4);
    mpTrunk(x, gx, gy, sz * 0.11, sz * 0.46, T.trunk);
    var cs = treeCanopy(x, gx, gy - sz * 0.68, sz * 0.46, T.tree, rnd, 5);
    if (T === THEME.meadow && seed % 2 === 0) mpDots(x, cs, 5, ['#ff6f8f', '#ff8fc0'], sz * 0.032, rnd);
    return spr(o.c, gx, gy);
  },
  tree2: function (S, T, rnd, seed) { return PROPS.tree(S * 0.82, T, rnd, seed + 1); },
  bigtree: function (S, T, rnd) {
    var o = canvasFor(S, 2.4, 2.8, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * 1.6;
    twShadow(x, gx + sz * 0.14, gy, sz * 0.58, sz * 0.2, 0.42);
    [-1, 1].forEach(function (sd) { var rt = limbShape(gx + sd * sz * 0.06, gy - sz * 0.04, gx + sd * sz * 0.2, gy + sz * 0.02, sz * 0.08, sz * 0.04); twFill(x, rt, T.trunk, { hi: 0.3 }); twInk(x, rt, T.trunk); });
    mpTrunk(x, gx, gy, sz * 0.12, sz * 0.5, T.trunk);
    var cs = treeCanopy(x, gx, gy - sz * 0.76, sz * 0.52, T.tree, rnd, 6);
    if (T.amb === 'spores') mpDots(x, cs, 6, ['#d8b8ff', '#9fe8ff'], sz * 0.025, rnd);
    return spr(o.c, gx, gy);
  },
  pine: function (S, T, rnd) {
    var o = canvasFor(S, 1.3, 2.0, 0.92), x = o.x, gx = o.gx, gy = o.gy, sz = S * (0.9 + rnd() * 0.18), snow = !!T.ice;
    twShadow(x, gx + sz * 0.14, gy, sz * 0.46, sz * 0.17, 0.4);
    mpTrunk(x, gx, gy, sz * 0.09, sz * 0.3, T.trunk);
    for (var t = 0; t < 3; t++) {
      var u = t / 2, R = sz * (0.46 - u * 0.17), by = gy - sz * (0.24 + u * 0.42), hh = sz * (0.44 - u * 0.06);
      var s = shp(), p = s.p; p.moveTo(gx, by - hh); p.quadraticCurveTo(gx + R * 0.35, by - hh * 0.45, gx + R, by); p.quadraticCurveTo(gx, by + R * 0.42, gx - R, by); p.quadraticCurveTo(gx - R * 0.35, by - hh * 0.45, gx, by - hh); p.closePath(); s.ext(gx - R, by - hh); s.ext(gx + R, by + R * 0.3);
      var c1 = mixc(T.tree[1], T.tree[2], u * 0.4);
      twFill(x, s, c1, { hi: 0.25, lo: 0.25, ax: 0.1, bx: 0.9 });
      x.save(); x.clip(s.p); x.fillStyle = rgba(T.tree[2], 0.9); x.beginPath(); x.moveTo(gx, by - hh); x.quadraticCurveTo(gx - R * 0.15, by - hh * 0.3, gx - R * 0.55, by + R * 0.05); x.quadraticCurveTo(gx - R * 0.8, by - hh * 0.2, gx, by - hh); x.fill();
      if (snow) { x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(gx, by - hh - 2); x.quadraticCurveTo(gx + R * 0.3, by - hh * 0.55, gx + R * 0.62, by - hh * 0.3); x.quadraticCurveTo(gx + R * 0.3, by - hh * 0.38, gx + R * 0.1, by - hh * 0.28); x.quadraticCurveTo(gx - R * 0.2, by - hh * 0.4, gx - R * 0.6, by - hh * 0.28); x.quadraticCurveTo(gx - R * 0.3, by - hh * 0.55, gx, by - hh - 2); x.fill(); }
      x.restore();
      twInk(x, s, T.tree[0]);
    }
    if (snow) twShine(x, gx - sz * 0.08, gy - sz * 0.98, sz * 0.03, sz * 0.02, 0.9);
    return spr(o.c, gx, gy);
  },
  // 귀염판: 마른 나무 대신 솜사탕 나무 (테마 꽃 색 잎)
  dead: function (S, T, rnd) {
    var o = canvasFor(S, 1.5, 1.9, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * (0.88 + rnd() * 0.16);
    var fc = T.flowers[0], pal = [twSh(fc, 0.35), fc, twLt(fc, 0.35), '#ffffff'];
    twShadow(x, gx + sz * 0.14, gy, sz * 0.5, sz * 0.18, 0.38);
    mpTrunk(x, gx, gy, sz * 0.1, sz * 0.5, T.trunk);
    var cs = treeCanopy(x, gx, gy - sz * 0.7, sz * 0.42, pal, rnd, 4);
    if (T.amb === 'motes' || T.amb === 'fog') mpDots(x, cs, 4, ['#fff0a0', '#9fe8ff'], sz * 0.03, rnd);
    return spr(o.c, gx, gy);
  },
  // 용암 지대: 귤빛 단풍 나무 + 반짝 열매
  charred: function (S, T, rnd) {
    var o = canvasFor(S, 1.5, 1.9, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * (0.9 + rnd() * 0.16);
    twShadow(x, gx + sz * 0.14, gy, sz * 0.5, sz * 0.18, 0.4);
    mpTrunk(x, gx, gy, sz * 0.1, sz * 0.48, '#7a4a3a');
    var cs = treeCanopy(x, gx, gy - sz * 0.7, sz * 0.43, ['#c43a52', '#ff6a6a', '#ffa07a', '#ffe0a8'], rnd, 4);
    mpDots(x, cs, 4, ['#ffe066', '#ffffff'], sz * 0.028, rnd);
    return spr(o.c, gx, gy);
  },
  bush: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 0.9, 0.82), x = o.x, gx = o.gx, gy = o.gy, sz = S * (0.55 + rnd() * 0.12);
    twShadow(x, gx + sz * 0.1, gy, sz * 0.58, sz * 0.2, 0.36);
    var R = sz * 0.5, blobs = [[gx, gy - R * 0.62, R * 0.62], [gx - R * 0.55, gy - R * 0.36, R * 0.46], [gx + R * 0.56, gy - R * 0.36, R * 0.46], [gx - R * 0.22, gy - R * 0.95, R * 0.4], [gx + R * 0.26, gy - R * 0.9, R * 0.38]];
    var cs = mpBlobs(x, blobs, [T.tree[0], T.tree[1], T.tree[2], T.tree[3]], R);
    mpDots(x, cs, 3 + Math.floor(rnd() * 3), T.flowers.slice(0, 2), sz * 0.05, rnd);
    return spr(o.c, gx, gy);
  },
  // 사막 선인장(둥근 통 선인장 + 꽃)
  drybush: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 1.1, 0.85), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.58;
    twShadow(x, gx + sz * 0.12, gy, sz * 0.5, sz * 0.16, 0.36);
    var b = shp().ell(gx, gy - sz * 0.32, sz * 0.34, sz * 0.34); twCylG(x, b, '#6cc070', { hi: 0.45 });
    x.save(); x.clip(b.p); x.strokeStyle = rgba('#2c7a48', 0.45); x.lineWidth = Math.max(0.8, sz * 0.02); for (var i = -2; i <= 2; i++) { x.beginPath(); x.ellipse(gx, gy - sz * 0.32, sz * 0.34 * Math.abs(i) / 2.4 + 0.5, sz * 0.36, 0, 0, Math.PI * 2); x.stroke(); } x.restore();
    twInk(x, b, '#4aa860');
    mpFlower(x, gx + sz * 0.04, gy - sz * 0.66, sz * 0.12, '#ff8fc0');
    return spr(o.c, gx, gy);
  },
  cactus: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 1.5, 0.88), x = o.x, gx = o.gx, gy = o.gy, sz = S * (0.7 + rnd() * 0.15), cc = '#62b866';
    twShadow(x, gx + sz * 0.12, gy, sz * 0.4, sz * 0.13, 0.36);
    [-1, 1].forEach(function (sd) { var ay = gy - sz * (sd < 0 ? 0.42 : 0.55), ar = shp(), p = ar.p; p.moveTo(gx + sd * sz * 0.1, ay); p.lineTo(gx + sd * sz * 0.28, ay); p.quadraticCurveTo(gx + sd * sz * 0.36, ay, gx + sd * sz * 0.36, ay - sz * 0.08); p.lineTo(gx + sd * sz * 0.36, ay - sz * 0.26); p.quadraticCurveTo(gx + sd * sz * 0.36, ay - sz * 0.33, gx + sd * sz * 0.29, ay - sz * 0.33); p.quadraticCurveTo(gx + sd * sz * 0.22, ay - sz * 0.33, gx + sd * sz * 0.22, ay - sz * 0.26); p.lineTo(gx + sd * sz * 0.22, ay - sz * 0.12); p.lineTo(gx + sd * sz * 0.1, ay - sz * 0.12); p.closePath(); ar.ext(gx - sz * 0.4, ay - sz * 0.35); ar.ext(gx + sz * 0.4, ay); twFill(x, ar, cc, { hi: 0.4 }); twInk(x, ar, cc); });
    var bd = shp().rrect(gx - sz * 0.13, gy - sz * 0.85, sz * 0.26, sz * 0.86, sz * 0.13); twCylG(x, bd, cc, { hi: 0.45 });
    x.save(); x.clip(bd.p); x.strokeStyle = rgba('#2c7a48', 0.4); x.lineWidth = Math.max(0.8, sz * 0.018); [-0.05, 0.05].forEach(function (u) { x.beginPath(); x.moveTo(gx + u * sz, gy - sz * 0.84); x.lineTo(gx + u * sz, gy); x.stroke(); }); x.restore();
    twInk(x, bd, cc);
    mpFlower(x, gx, gy - sz * 0.86, sz * 0.09, '#ff8fc0');
    return spr(o.c, gx, gy);
  },
  // 부들(동글 갈색 이삭)
  reeds: function (S, T, rnd) {
    var o = canvasFor(S, 1.0, 1.3, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.7;
    twShadow(x, gx + sz * 0.1, gy, sz * 0.42, sz * 0.13, 0.3);
    x.lineCap = 'round';
    for (var i = 0; i < 9; i++) {
      var bx = gx + (rnd() - 0.5) * sz * 0.6, h = sz * (0.5 + rnd() * 0.55), lean = (rnd() - 0.5) * sz * 0.25, col = rnd() < 0.5 ? T.grass[1] : T.grass[2];
      x.strokeStyle = twInkC(col); x.lineWidth = sz * 0.05 + TW_IW; x.beginPath(); x.moveTo(bx, gy); x.quadraticCurveTo(bx, gy - h * 0.5, bx + lean, gy - h); x.stroke();
      x.strokeStyle = col; x.lineWidth = sz * 0.05; x.stroke();
      if (i % 2 === 0) { var cat = shp().rrect(bx + lean * 0.9 - sz * 0.035, gy - h * 0.98 - sz * 0.13, sz * 0.07, sz * 0.15, sz * 0.035); twFill(x, cat, '#b07850', { hi: 0.4 }); twInk(x, cat, '#b07850', TW_IW * 0.7); }
    }
    return spr(o.c, gx, gy);
  },
  // 버섯: 깊은 숲은 빛나는 연보라, 그 밖은 빨간 갓 흰 점
  mush: function (S, T, rnd) {
    var o = canvasFor(S, 1.0, 0.95, 0.82), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.62, glow = T.amb === 'spores';
    twShadow(x, gx + sz * 0.1, gy, sz * 0.5, sz * 0.15, 0.34);
    var m = [[-0.18, 0.38, 0.19], [0.14, 0.26, 0.14], [0.32, 0.15, 0.09]];
    m.forEach(function (q, i) {
      var mx = gx + q[0] * sz, h = q[1] * sz, r = q[2] * sz, cc = glow ? (i === 1 ? '#8fe0ff' : '#c8a2ff') : '#ff5a6a';
      var st = shp().rrect(mx - r * 0.3, gy - h, r * 0.6, h + r * 0.05, r * 0.25); twFill(x, st, '#fff4e4', { hi: 0.2, lo: 0.2 }); twInk(x, st, '#e8c8a8', TW_IW * 0.7);
      if (glow) { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, mx, gy - h - r * 0.2, r * 1.8, cc, 0.4); x.restore(); }
      var cs = shp(); cs.p.moveTo(mx - r, gy - h + r * 0.12); cs.p.bezierCurveTo(mx - r * 1.02, gy - h - r * 1.0, mx + r * 1.02, gy - h - r * 1.0, mx + r, gy - h + r * 0.12); cs.p.quadraticCurveTo(mx, gy - h + r * 0.4, mx - r, gy - h + r * 0.12); cs.p.closePath(); cs.ext(mx - r, gy - h - r * 0.75); cs.ext(mx + r, gy - h + r * 0.35);
      twFill(x, cs, cc, { hi: 0.4, lo: 0.25 }); twInk(x, cs, cc);
      x.fillStyle = 'rgba(255,255,255,0.92)'; [[-0.42, -0.3, 0.17], [0.22, -0.48, 0.13], [0.5, -0.12, 0.1], [-0.05, -0.08, 0.09]].forEach(function (d) { x.beginPath(); x.arc(mx + d[0] * r, gy - h + d[1] * r, d[2] * r, 0, Math.PI * 2); x.fill(); });
    });
    return spr(o.c, gx, gy);
  },
  mushred: function (S, T, rnd) { return PROPS.mush(S * 0.9, { amb: '', grass: T.grass }, rnd); },
  // 꽃 무더기
  flowers: function (S, T, rnd) {
    var o = canvasFor(S, 1.0, 0.7, 0.8), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.6;
    twShadow(x, gx + sz * 0.06, gy, sz * 0.5, sz * 0.12, 0.25);
    var lv = shp(); [[-0.2, -0.08, 0.2], [0.18, -0.06, 0.2], [0, -0.14, 0.22]].forEach(function (b) { lv.ell(gx + b[0] * sz, gy + b[1] * sz, b[2] * sz, b[2] * sz * 0.6); });
    twFill(x, lv, T.grass[1], { hi: 0.3 }); twInk(x, lv, T.grass[0], TW_IW * 0.8);
    for (var i = 0; i < 6; i++) { var fx = gx + (rnd() - 0.5) * sz * 0.7, fy = gy - sz * (0.14 + rnd() * 0.2), fc = T.flowers[Math.floor(rnd() * T.flowers.length)]; x.save(); x.fillStyle = twInkC(fc); x.beginPath(); x.arc(fx, fy, sz * 0.085, 0, Math.PI * 2); x.fill(); x.restore(); mpFlower(x, fx, fy, sz * 0.075, fc); }
    return spr(o.c, gx, gy);
  },
  stump: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 1.0, 0.82), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.6;
    twShadow(x, gx + sz * 0.12, gy, sz * 0.6, sz * 0.2, 0.38);
    var side = shp(), p = side.p; p.moveTo(gx - sz * 0.4, gy - sz * 0.28); p.lineTo(gx + sz * 0.4, gy - sz * 0.28); p.quadraticCurveTo(gx + sz * 0.42, gy - sz * 0.05, gx + sz * 0.52, gy + sz * 0.02); p.quadraticCurveTo(gx, gy + sz * 0.16, gx - sz * 0.52, gy + sz * 0.02); p.quadraticCurveTo(gx - sz * 0.42, gy - sz * 0.05, gx - sz * 0.4, gy - sz * 0.28); p.closePath(); side.ext(gx - sz * 0.52, gy - sz * 0.28); side.ext(gx + sz * 0.52, gy + sz * 0.16);
    twCylG(x, side, T.trunk, { hi: 0.35 }); twInk(x, side, T.trunk);
    var top = shp().ell(gx, gy - sz * 0.28, sz * 0.4, sz * 0.18); twFill(x, top, '#f2c890', { hi: 0.25, lo: 0.1 });
    x.save(); x.clip(top.p); x.strokeStyle = 'rgba(176,112,70,0.5)'; x.lineWidth = Math.max(0.7, sz * 0.02); for (var r = 1; r < 4; r++) { x.beginPath(); x.ellipse(gx, gy - sz * 0.28, sz * 0.4 * r / 4, sz * 0.18 * r / 4, 0, 0, Math.PI * 2); x.stroke(); } x.restore();
    twInk(x, top, T.trunk, TW_IW * 0.9);
    // 새싹
    var lf = shp().ell(gx + sz * 0.22, gy - sz * 0.38, sz * 0.07, sz * 0.04, -0.5); twFill(x, lf, T.grass[2] || '#86d867', { hi: 0.4 }); twInk(x, lf, T.grass[0] || '#3fa448', TW_IW * 0.6);
    return spr(o.c, gx, gy);
  },
  rock: function (S, T, rnd) { return rockSpr(S, T, rnd, 0.62 + rnd() * 0.12, T.rock, T.ice ? '#ffffff' : T.moss, 0.6); },
  bigrock: function (S, T, rnd) { return rockSpr(S, T, rnd, 1.5, T.rock, T.ice ? '#ffffff' : T.moss, 0.85); },
  snowpile: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 0.8, 0.82), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.55;
    twShadow(x, gx + sz * 0.1, gy, sz * 0.6, sz * 0.18, 0.3);
    var cs = mpBlobs(x, [[gx, gy - sz * 0.2, sz * 0.36, 0.7], [gx - sz * 0.3, gy - sz * 0.1, sz * 0.26, 0.7], [gx + sz * 0.32, gy - sz * 0.1, sz * 0.24, 0.7]], ['#9eb2e0', '#e8f0fc', '#ffffff', '#ffffff'], sz * 0.4);
    twTwinkle(x, gx - sz * 0.15, gy - sz * 0.32, sz * 0.07, 0.9);
    return spr(o.c, gx, gy);
  },
  snowman: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 1.4, 0.88), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.62;
    twShadow(x, gx + sz * 0.1, gy, sz * 0.45, sz * 0.14, 0.34);
    var b1 = shp().ell(gx, gy - sz * 0.26, sz * 0.3, sz * 0.27), b2 = shp().ell(gx, gy - sz * 0.68, sz * 0.22, sz * 0.21);
    [b1, b2].forEach(function (b) { twFill(x, b, '#f4f8ff', { hi: 0.5, lo: 0.18 }); twInk(x, b, '#9eb2e0'); });
    var sc = shp().rrect(gx - sz * 0.22, gy - sz * 0.52, sz * 0.44, sz * 0.08, sz * 0.04); twFill(x, sc, '#ff6f9f', { hi: 0.4 }); twInk(x, sc, '#ff6f9f', TW_IW * 0.7);
    var hat = shp().rrect(gx - sz * 0.13, gy - sz * 1.02, sz * 0.26, sz * 0.18, sz * 0.04); twFill(x, hat, '#7cc8ff'); twInk(x, hat, '#7cc8ff', TW_IW * 0.8);
    x.fillStyle = '#3a2148'; [-0.07, 0.07].forEach(function (u) { x.beginPath(); x.arc(gx + u * sz, gy - sz * 0.72, sz * 0.025, 0, Math.PI * 2); x.fill(); });
    x.fillStyle = '#ff9a4a'; x.beginPath(); x.moveTo(gx, gy - sz * 0.67); x.lineTo(gx + sz * 0.13, gy - sz * 0.64); x.lineTo(gx, gy - sz * 0.62); x.fill();
    x.fillStyle = 'rgba(255,120,160,0.5)'; [-0.12, 0.12].forEach(function (u) { x.beginPath(); x.ellipse(gx + u * sz, gy - sz * 0.63, sz * 0.035, sz * 0.02, 0, 0, Math.PI * 2); x.fill(); });
    return spr(o.c, gx, gy);
  },
  // 돌무더기 → 사탕 돌 몇 개
  rubble: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 0.8, 0.8), x = o.x, gx = o.gx, gy = o.gy;
    twShadow(x, gx + S * 0.06, gy, S * 0.38, S * 0.12, 0.28);
    var cols = [T.rock, mixc(T.rock, T.flowers[0], 0.35), mixc(T.rock, '#ffffff', 0.3)];
    for (var i = 0; i < 4; i++) { var s2 = rockSpr(S * (0.3 + rnd() * 0.16), T, rnd, 0.8, cols[i % 3], null, 0.5); drawSpr(x, s2, gx + (i - 1.5) * S * 0.16 + (rnd() - 0.5) * S * 0.06, gy - (i % 2) * S * 0.06); }
    if (T.amb === 'motes') twTwinkle(x, gx + S * 0.12, gy - S * 0.25, S * 0.06, 0.9);
    return spr(o.c, gx, gy);
  },
  basalt: function (S, T, rnd) { var s = rockSpr(S, T, rnd, 0.7, '#7a4e44', null, 0.75); lavaCracks(s, S, rnd); return s; },
  bigbasalt: function (S, T, rnd) { var s = rockSpr(S, T, rnd, 1.5, '#7a4e44', null, 0.9); lavaCracks(s, S, rnd); return s; },
  mesa: function (S, T, rnd) { return mesaSpr(S, rnd, 1.3, 0.5); },
  pillarRock: function (S, T, rnd) { return sandRock(S, rnd, 0.8, 1.0); },
  sandrock: function (S, T, rnd) {
    var sz = 0.58 + rnd() * 0.28, tl = 0.55 + rnd() * 0.45, s = sandRock(S, rnd, sz, tl), v = rnd(), x = cx2(s.c), top = s.ay - S * sz * 0.5 * tl * 1.4 * 1.15;
    if (v < 0.3) mpFlower(x, s.ax - S * 0.06, top + S * 0.02, S * 0.045, v < 0.15 ? '#ff8fc0' : '#ffe066');
    else if (v < 0.55) { var pb = rockSpr(S * 0.32, T, rnd, 0.8, '#ffb08a', null, 0.5); x.drawImage(pb.c, Math.min(s.c.width - pb.c.width, s.ax + S * 0.12), s.ay - pb.ay + S * 0.02); }
    return s;
  },
  spike: function (S, T, rnd) { return crystalSpr(S, rnd, ['#7a5ac8', '#b090ff', '#f0e4ff'], 0.55, '#c8a8ff'); },
  obsid: function (S, T, rnd) { return crystalSpr(S * 0.8, rnd, ['#e0506a', '#ff8a7a', '#ffe0c8'], 0.45, '#ffa07a'); },
  icecrystal: function (S, T, rnd) { return crystalSpr(S * 1.7, rnd, ['#4a9ae0', '#8ccaff', '#f0faff'], 0.8, '#bfefff'); },
  darkcrystal: function (S, T, rnd) { return crystalSpr(S * 1.05, rnd, ['#c04a9a', '#ff8ad0', '#ffe8f6'], 0.7, '#ff9ad8'); },
  // 파스텔 대리석 기둥 + 덩굴 꽃
  pillar: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 1.9, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.9, h = sz * (0.8 + rnd() * 0.45), w = sz * 0.3, col = T.rock;
    twShadow(x, gx + sz * 0.14, gy, sz * 0.45, sz * 0.15, 0.36);
    var base = shp().rrect(gx - w * 0.78, gy - sz * 0.12, w * 1.56, sz * 0.13, sz * 0.04); twFill(x, base, col); twInk(x, base, col);
    var cl = shp().rrect(gx - w / 2, gy - sz * 0.1 - h, w, h, w * 0.18); twCylG(x, cl, col, { hi: 0.45 });
    x.save(); x.clip(cl.p); x.strokeStyle = rgba(twSh(col, 0.4), 0.35); x.lineWidth = Math.max(0.8, w * 0.05); for (var f = 1; f < 4; f++) { var fx = gx - w * 0.5 + w * (0.5 - 0.5 * Math.cos(f / 4 * Math.PI)); x.beginPath(); x.moveTo(fx, gy - h); x.lineTo(fx, gy); x.stroke(); } x.restore();
    twInk(x, cl, col);
    var cap = shp().rrect(gx - w * 0.7, gy - sz * 0.16 - h, w * 1.4, sz * 0.1, sz * 0.04); twFill(x, cap, twLt(col, 0.3)); twInk(x, cap, col);
    // 덩굴
    x.save(); x.strokeStyle = twInkC(T.grass[1]); x.lineWidth = Math.max(1, sz * 0.03) + TW_IW; x.lineCap = 'round'; x.beginPath(); x.moveTo(gx - w * 0.5, gy - sz * 0.1); x.bezierCurveTo(gx + w * 0.6, gy - h * 0.3, gx - w * 0.6, gy - h * 0.6, gx + w * 0.3, gy - h * 0.85); x.stroke(); x.strokeStyle = T.grass[2]; x.lineWidth = Math.max(1, sz * 0.03); x.stroke(); x.restore();
    for (var k = 0; k < 3; k++) mpFlower(x, gx + (k - 1) * w * 0.4, gy - h * (0.25 + k * 0.27), sz * 0.055, T.flowers[k % T.flowers.length]);
    return spr(o.c, gx, gy);
  },
  // 비석 대신 꽃 화분 돌
  grave: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 1.1, 0.85), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.7, col = T.rock;
    twShadow(x, gx + sz * 0.1, gy, sz * 0.5, sz * 0.16, 0.34);
    var pot = shp(), p = pot.p; p.moveTo(gx - sz * 0.34, gy - sz * 0.36); p.lineTo(gx + sz * 0.34, gy - sz * 0.36); p.lineTo(gx + sz * 0.26, gy); p.quadraticCurveTo(gx, gy + sz * 0.05, gx - sz * 0.26, gy); p.closePath(); pot.ext(gx - sz * 0.34, gy - sz * 0.36); pot.ext(gx + sz * 0.34, gy + sz * 0.05);
    twCylG(x, pot, col, { hi: 0.45 }); twInk(x, pot, col);
    var rim2 = shp().rrect(gx - sz * 0.38, gy - sz * 0.42, sz * 0.76, sz * 0.1, sz * 0.05); twFill(x, rim2, twLt(col, 0.3)); twInk(x, rim2, col);
    var lv = shp(); [[-0.18, -0.48, 0.16], [0.16, -0.5, 0.15], [0, -0.58, 0.17]].forEach(function (b) { lv.ell(gx + b[0] * sz, gy + b[1] * sz, b[2] * sz, b[2] * sz * 0.75); }); twFill(x, lv, T.grass[1], { hi: 0.3 }); twInk(x, lv, T.grass[0], TW_IW * 0.8);
    for (var i = 0; i < 4; i++) mpFlower(x, gx + (i - 1.5) * sz * 0.16, gy - sz * (0.56 + (i % 2) * 0.1), sz * 0.075, T.flowers[i % T.flowers.length]);
    twHeart(x, gx, gy - sz * 0.18, sz * 0.06, T.flowers[0]);
    return spr(o.c, gx, gy);
  },
  // 사당 → 둥근 분수
  shrine: function (S, T, rnd) {
    var o = canvasFor(S, 2.4, 2.6, 0.88), x = o.x, gx = o.gx, gy = o.gy, sz = S * 1.5, col = T.rock;
    twShadow(x, gx + sz * 0.12, gy, sz * 0.72, sz * 0.24, 0.4);
    var bw = twCyl(x, gx, gy - sz * 0.2, sz * 0.62, sz * 0.25, sz * 0.18, col, rnd, { stone: 1, rows: 1, cols: 8, top: twLt(col, 0.3) });
    var wt = shp().ell(gx, gy - sz * 0.2, sz * 0.54, sz * 0.2), g = x.createLinearGradient(0, gy - sz * 0.4, 0, gy); g.addColorStop(0, '#9fe6ff'); g.addColorStop(1, '#4fb8f0'); x.fillStyle = g; x.fill(wt.p); twInk(x, wt, '#4fb8f0', TW_IW * 0.8);
    x.save(); x.clip(wt.p); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = Math.max(1, sz * 0.012); for (var r = 1; r < 3; r++) { x.beginPath(); x.ellipse(gx, gy - sz * 0.2, sz * 0.18 * r, sz * 0.065 * r, 0, 0, Math.PI * 2); x.stroke(); } x.restore();
    twCyl(x, gx, gy - sz * 0.62, sz * 0.08, sz * 0.035, sz * 0.42, col, null, {});
    var bowl = shp(), p = bowl.p; p.moveTo(gx - sz * 0.3, gy - sz * 0.66); p.quadraticCurveTo(gx, gy - sz * 0.48, gx + sz * 0.3, gy - sz * 0.66); p.closePath(); bowl.ext(gx - sz * 0.3, gy - sz * 0.66); bowl.ext(gx + sz * 0.3, gy - sz * 0.52); twFill(x, bowl, col, { hi: 0.4 }); twInk(x, bowl, col);
    var bt = shp().ell(gx, gy - sz * 0.66, sz * 0.3, sz * 0.09); twFill(x, bt, '#8adcff', { hi: 0.4 }); twInk(x, bt, col, TW_IW * 0.8);
    x.save(); x.strokeStyle = 'rgba(200,240,255,0.9)'; x.lineWidth = Math.max(1, sz * 0.02); x.lineCap = 'round'; [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(gx, gy - sz * 0.86); x.quadraticCurveTo(gx + sd * sz * 0.2, gy - sz * 0.95, gx + sd * sz * 0.27, gy - sz * 0.68); x.stroke(); }); x.restore();
    var top = shp().ell(gx, gy - sz * 0.86, sz * 0.06, sz * 0.06); twFill(x, top, '#ff8fc0', { hi: 0.4 }); twInk(x, top, '#ff8fc0', TW_IW * 0.7);
    for (var i = 0; i < 5; i++) mpFlower(x, gx + (i - 2) * sz * 0.24, gy - sz * 0.02 + (i % 2) * sz * 0.03, sz * 0.05, T.flowers[i % T.flowers.length]);
    return spr(o.c, gx, gy);
  },
  // 오벨리스크 → 별 달린 수정 첨탑
  obelisk: function (S, T, rnd) {
    var o = canvasFor(S, 2.2, 3.0, 0.88), x = o.x, gx = o.gx, gy = o.gy, sz = S * 1.5;
    twShadow(x, gx + sz * 0.15, gy, sz * 0.56, sz * 0.19, 0.42);
    twCyl(x, gx, gy - sz * 0.16, sz * 0.5, sz * 0.2, sz * 0.14, '#8a76c8', rnd, { stone: 1, rows: 1, cols: 7 });
    x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, gx, gy - sz * 1.0, sz * 0.8, '#c8a8ff', 0.35); x.restore();
    var ob = shp().poly([[gx - sz * 0.22, gy - sz * 0.2], [gx - sz * 0.14, gy - sz * 1.3], [gx, gy - sz * 1.48], [gx + sz * 0.14, gy - sz * 1.3], [gx + sz * 0.22, gy - sz * 0.2]]);
    twCylG(x, ob, '#b49aff', { hi: 0.5 });
    var lf = shp().poly([[gx - sz * 0.22, gy - sz * 0.2], [gx - sz * 0.14, gy - sz * 1.3], [gx, gy - sz * 1.48], [gx - sz * 0.02, gy - sz * 0.2]]); x.fillStyle = 'rgba(255,255,255,0.3)'; x.fill(lf.p);
    twInk(x, ob, '#8a6ad8');
    x.save(); x.clip(ob.p); x.shadowColor = '#ffd0f0'; x.shadowBlur = sz * 0.04; for (var k = 0; k < 4; k++) { var st = shp(); twStarP(st.p, gx + (k % 2 ? 0.05 : -0.05) * sz, gy - sz * (0.4 + k * 0.24), sz * 0.04); x.fillStyle = k % 2 ? '#fff0a0' : '#ffd0f0'; x.fill(st.p); } x.restore();
    twStar(x, gx, gy - sz * 1.6, sz * 0.12, '#ffe066');
    x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, gx, gy - sz * 1.6, sz * 0.3, '#ffe066', 0.5); x.restore();
    return spr(o.c, gx, gy);
  },
  hay: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 0.9, 0.82), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.6;
    twShadow(x, gx + sz * 0.12, gy, sz * 0.58, sz * 0.18, 0.36);
    var s = shp().ell(gx, gy - sz * 0.3, sz * 0.5, sz * 0.32); twFill(x, s, '#ffd36a', { hi: 0.4 }); twInk(x, s, '#e8a840');
    x.save(); x.clip(s.p); x.strokeStyle = 'rgba(232,168,64,0.6)'; x.lineWidth = Math.max(0.8, sz * 0.02); for (var i = -2; i <= 2; i++) { x.beginPath(); x.ellipse(gx + i * sz * 0.16, gy - sz * 0.3, sz * 0.08, sz * 0.3, 0, 0, Math.PI * 2); x.stroke(); } x.restore();
    return spr(o.c, gx, gy);
  },
  // 보물 상자: 분홍 뚜껑, 금 테, 하트 자물쇠
  chest: function (S, T, rnd) {
    var o = canvasFor(S, 1.1, 1.0, 0.82), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.64;
    twShadow(x, gx + sz * 0.1, gy, sz * 0.6, sz * 0.18, 0.4);
    var w = sz * 0.8, h = sz * 0.42, front = shp().rrect(gx - w / 2, gy - h, w, h, sz * 0.06);
    twFill(x, front, '#f0a860', { hi: 0.35 }); twInk(x, front, '#c98048');
    var lid = shp(); lid.p.moveTo(gx - w / 2, gy - h); lid.p.bezierCurveTo(gx - w / 2, gy - h - sz * 0.34, gx + w / 2, gy - h - sz * 0.34, gx + w / 2, gy - h); lid.p.closePath(); lid.ext(gx - w / 2, gy - h - sz * 0.26); lid.ext(gx + w / 2, gy - h);
    twFill(x, lid, '#ff7fb0', { hi: 0.42 }); twInk(x, lid, '#ff7fb0');
    [-0.3, 0.3].forEach(function (u) { var b = shp().rrect(gx + u * w - sz * 0.045, gy - h - sz * 0.22, sz * 0.09, h + sz * 0.22, sz * 0.03); twFill(x, b, '#ffd24a', { hi: 0.5 }); twInk(x, b, '#e8a830', TW_IW * 0.7); });
    twHeart(x, gx, gy - h + sz * 0.02, sz * 0.085, '#ffd24a');
    twShine(x, gx - w * 0.28, gy - h - sz * 0.14, sz * 0.06, sz * 0.03, 0.8);
    return spr(o.c, gx, gy);
  }
};
// 둥근 사탕 돌 (art_fx.js 돌 탄도 이것을 씀: rockSpr(S, T, rnd, size, col, cap, tall))
function rockSpr(S, T, rnd, size, col, cap, tall, snowy) {
  var o = canvasFor(S, Math.max(1.1, size * 1.5), Math.max(1.0, size * (0.9 + tall)), 0.86), x = o.x, gx = o.gx, gy = o.gy, R = S * size * 0.5, H = R * tall * 1.4;
  var iw = Math.max(0.9, Math.min(TW_IW, R * 0.09)); // 탄으로 쓰는 작은 돌도 테두리가 굵지 않게
  twShadow(x, gx + R * 0.2, gy + R * 0.02, R * 1.15, R * 0.38, 0.38);
  var n = 7, pts = [];
  for (var k = 0; k < n; k++) { var a = Math.PI + k / (n - 1) * Math.PI, rr = R * (0.86 + rnd() * 0.2); pts.push([gx + Math.cos(a) * rr, gy - H * 0.3 + Math.sin(a) * H * (0.72 + rnd() * 0.2)]); }
  pts.push([gx + R * 1.0, gy - R * 0.05]); pts.push([gx + R * 0.55, gy + R * 0.14]); pts.push([gx - R * 0.55, gy + R * 0.14]); pts.push([gx - R * 1.0, gy - R * 0.05]);
  var s = shp().blob(pts);
  twFill(x, s, col, { hi: 0.3, lo: 0.32 });
  // 윗면 밝게
  x.save(); x.clip(s.p); x.fillStyle = rgba(twLt(col, snowy ? 0.6 : 0.35), 0.85); x.beginPath(); x.ellipse(gx - R * 0.1, gy - H * 0.62, R * 0.72, H * 0.36, -0.1, 0, Math.PI * 2); x.fill();
  if (cap) { x.fillStyle = rgba(cap, cap === '#ffffff' ? 0.95 : 0.85); x.beginPath(); x.ellipse(gx - R * 0.15, gy - H * 0.78, R * 0.66, H * 0.3, -0.15, 0, Math.PI * 2); x.fill(); }
  x.restore();
  coreShadow(x, s, twSh(col, 0.4), R * 0.22, 0.4);
  twInk(x, s, col, iw);
  twShine(x, gx - R * 0.4, gy - H * 0.62, R * 0.14, R * 0.08, 0.8, -0.4);
  return spr(o.c, gx, gy);
}
// 산호빛 사암 돌(줄무늬)
function sandRock(S, rnd, size, tall) {
  var s = rockSpr(S, THEME.canyon, rnd, size, '#f2906c', null, tall), x = cx2(s.c), R = S * size * 0.5;
  x.save(); x.globalCompositeOperation = 'source-atop';
  for (var b = 0; b < 4; b++) { var y = s.ay - R * tall * 1.2 + b * R * 0.36 + rnd() * R * 0.06; x.strokeStyle = b % 2 ? 'rgba(255,214,170,0.55)' : 'rgba(200,90,90,0.22)'; x.lineWidth = Math.max(1, R * 0.08); x.beginPath(); x.moveTo(0, y); x.quadraticCurveTo(s.c.width / 2, y + R * 0.1 * (rnd() - 0.3), s.c.width, y + R * 0.04); x.stroke(); }
  x.restore();
  return s;
}
// 탁자 바위(메사): 아래가 넓은 둥근 언덕 + 줄무늬 + 위에 작은 덤불
function mesaSpr(S, rnd, size, tall) {
  var o = canvasFor(S, Math.max(1.2, size * 1.5), size * (0.7 + tall) + 0.5, 0.86), x = o.x, gx = o.gx, gy = o.gy, rx = S * size * 0.5, ry = rx * 0.5, h = S * size * tall;
  twShadow(x, gx + rx * 0.2, gy + ry * 0.15, rx * 1.25, ry * 0.8, 0.38);
  var bs = shp(), p = bs.p;
  p.moveTo(gx - rx * 1.05, gy);
  p.bezierCurveTo(gx - rx * 1.02, gy - h * 0.55, gx - rx * 0.92, gy - h - ry * 0.1, gx - rx * 0.62, gy - h - ry * 0.32);
  p.quadraticCurveTo(gx, gy - h - ry * 0.78, gx + rx * 0.62, gy - h - ry * 0.32);
  p.bezierCurveTo(gx + rx * 0.92, gy - h - ry * 0.1, gx + rx * 1.02, gy - h * 0.55, gx + rx * 1.05, gy);
  p.quadraticCurveTo(gx, gy + ry * 0.5, gx - rx * 1.05, gy); p.closePath();
  bs.ext(gx - rx * 1.05, gy - h - ry * 0.6); bs.ext(gx + rx * 1.05, gy + ry * 0.3);
  twCylG(x, bs, '#f28a68', { hi: 0.4 });
  x.save(); x.clip(bs.p);
  for (var b = 0; b < 4; b++) { var y0 = gy - h * (0.15 + b * 0.24); x.strokeStyle = b % 2 ? 'rgba(255,222,186,0.6)' : 'rgba(205,85,95,0.22)'; x.lineWidth = Math.max(1.2, S * 0.035); x.beginPath(); x.moveTo(gx - rx * 1.1, y0); x.bezierCurveTo(gx - rx * 0.4, y0 + ry * 0.35 + (rnd() - 0.5) * S * 0.03, gx + rx * 0.4, y0 + ry * 0.3, gx + rx * 1.1, y0 - S * 0.01); x.stroke(); }
  var ts = shp().ell(gx, gy - h - ry * 0.3, rx * 0.66, ry * 0.42); twFill(x, ts, '#ffcca0', { hi: 0.35, lo: 0.1 });
  x.restore();
  twInk(x, bs, '#f28a68');
  twShine(x, gx - rx * 0.62, gy - h * 0.55, rx * 0.06, h * 0.2, 0.45, 0.2);
  // 위에 둥근 덤불 + 꽃
  var bu = mpBlobs(x, [[gx - rx * 0.18, gy - h - ry * 0.42, rx * 0.17], [gx - rx * 0.02, gy - h - ry * 0.5, rx * 0.14], [gx + rx * 0.2, gy - h - ry * 0.38, rx * 0.12]], ['#3f9a52', '#62b862', '#8ed676', '#d0f0a0'], rx * 0.2);
  mpFlower(x, gx - rx * 0.05, gy - h - ry * 0.62, S * 0.045, '#ff8fc0');
  return spr(o.c, gx, gy);
}
// 초콜릿 돌의 분홍 주황 빛 금
function lavaCracks(s, S, rnd) {
  var x = cx2(s.c); x.save(); x.globalCompositeOperation = 'source-atop'; x.strokeStyle = 'rgba(255,150,110,0.95)'; x.lineWidth = Math.max(1, S * 0.022); x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = '#ff8a6a'; x.shadowBlur = S * 0.06;
  for (var i = 0; i < 3; i++) { var px = s.ax + (rnd() - 0.5) * S * 0.5, py = s.ay - rnd() * S * 0.4 - S * 0.05; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * S * 0.16, py + S * 0.1); x.lineTo(px + (rnd() - 0.5) * S * 0.16, py + S * 0.2); x.stroke(); }
  x.restore();
}
// 수정 무리: 깎은 면 + 반짝
function crystalSpr(S, rnd, cols, size, glow) {
  var o = canvasFor(S, 1.2, 1.7, 0.88), x = o.x, gx = o.gx, gy = o.gy, R = S * size * 0.5;
  twShadow(x, gx + R * 0.25, gy, R * 1.1, R * 0.34, 0.38);
  if (glow) { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, gx, gy - R * 0.8, R * 2.0, glow, 0.3); x.restore(); }
  var n = 5, order = [0, 4, 1, 3, 2];
  order.forEach(function (i) {
    var a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.4 + (rnd() - 0.5) * 0.16, L = R * (1.1 + rnd() * 1.2) * (i === 2 ? 1.45 : 1), w = R * (0.3 + rnd() * 0.1);
    var bx = gx + (i - 2) * R * 0.3, by = gy - R * 0.04, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, tx = bx + ca * L, ty = by + sa * L, k2 = 0.72;
    var Lx = bx - nx * w, Ly = by - ny * w, Rx = bx + nx * w, Ry = by + ny * w, SLx = bx + ca * L * k2 - nx * w * 0.9, SLy = by + sa * L * k2 - ny * w * 0.9, SRx = bx + ca * L * k2 + nx * w * 0.9, SRy = by + sa * L * k2 + ny * w * 0.9;
    var lf = shp().poly([[Lx, Ly], [SLx, SLy], [tx, ty], [bx, by]]), rf = shp().poly([[bx, by], [tx, ty], [SRx, SRy], [Rx, Ry]]);
    twFill(x, lf, cols[2], { hi: 0.5, lo: 0.1 }); twFill(x, rf, cols[1], { hi: 0.1, lo: 0.25 });
    var ol = shp().poly([[Lx, Ly], [SLx, SLy], [tx, ty], [SRx, SRy], [Rx, Ry]]); twInk(x, ol, cols[0], TW_IW * 0.9);
    x.save(); x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = Math.max(0.8, w * 0.2); x.lineCap = 'round'; x.beginPath(); x.moveTo(Lx + ca * L * 0.15 + nx * w * 0.4, Ly + sa * L * 0.15 + ny * w * 0.4); x.lineTo(SLx + nx * w * 0.35 - ca * L * 0.05, SLy + ny * w * 0.35 - sa * L * 0.05); x.stroke(); x.restore();
  });
  twTwinkle(x, gx - R * 0.3, gy - R * 1.5, R * 0.3, 0.95);
  if (glow) { x.save(); x.globalCompositeOperation = 'lighter'; for (var k = 0; k < 3; k++) glowAt(x, gx + (rnd() - 0.5) * R, gy - R * (0.5 + rnd() * 1.4), R * 0.3, glow, 0.45); x.restore(); }
  return spr(o.c, gx, gy);
}

// ---------- 성문 (지킬 곳): 귀여운 파스텔 성 ----------
function gateSpr(S, th) {
  var key = 'gate:' + th + ':' + Math.round(S); if (PROP_CACHE[key]) return PROP_CACHE[key];
  var T = THEME[th], o = canvasFor(S, 2.2, 2.4, 0.86), x = o.x, gx = o.gx, gy = o.gy, sz = S, rnd = rngOf(77);
  TW_IW = Math.max(1, sz * 0.022);
  var stone = th === 'snow' ? '#eef0ff' : th === 'canyon' ? '#fff0dc' : th === 'volcano' ? '#fbe6dc' : th === 'dark' ? '#efe6ff' : '#fff4e6';
  var roofC = th === 'dark' ? '#ff8ad0' : th === 'snow' ? '#7cb8ff' : '#ff7fb0', roofC2 = th === 'snow' ? '#ff8fc0' : '#7cc8ff';
  twShadow(x, gx + sz * 0.15, gy + sz * 0.02, sz * 1.0, sz * 0.3, 0.45);
  // 가운데 문루
  var wall = shp().rrect(gx - sz * 0.52, gy - sz * 0.92, sz * 1.04, sz * 0.94, sz * 0.04);
  twFill(x, wall, stone, { hi: 0.3, lo: 0.2 });
  x.save(); x.clip(wall.p); x.strokeStyle = rgba(twSh(stone, 0.5), 0.2); x.lineWidth = Math.max(0.8, sz * 0.012);
  for (var r = 1; r < 6; r++) { x.beginPath(); x.moveTo(gx - sz * 0.52, gy - sz * 0.92 + r * sz * 0.16); x.lineTo(gx + sz * 0.52, gy - sz * 0.92 + r * sz * 0.16); x.stroke(); }
  for (var b = 0; b < 10; b++) { x.fillStyle = rgba(twLt(stone, 0.9), 0.8); twPill(x, gx + (rnd() - 0.5) * sz * 0.9, gy - sz * 0.92 + (Math.floor(rnd() * 6) + 0.5) * sz * 0.16, sz * 0.14, sz * 0.08); }
  x.restore();
  twInk(x, wall, twSh(stone, 0.2));
  // 성가퀴(분홍 모자)
  for (var m = 0; m < 5; m++) { var mx = gx - sz * 0.52 + m * sz * 0.22 + sz * 0.015; var mm = shp().rrect(mx, gy - sz * 1.06, sz * 0.15, sz * 0.17, sz * 0.045); twFill(x, mm, stone, { hi: 0.3 }); x.save(); x.clip(mm.p); twFill(x, shp().rrect(mx - 2, gy - sz * 1.08, sz * 0.15 + 4, sz * 0.08, 0), roofC, { hi: 0.4 }); x.restore(); twInk(x, mm, roofC, TW_IW * 0.8); }
  // 아치 문
  var arch = shp(); arch.p.moveTo(gx - sz * 0.27, gy + sz * 0.01); arch.p.lineTo(gx - sz * 0.27, gy - sz * 0.42); arch.p.arc(gx, gy - sz * 0.42, sz * 0.27, Math.PI, 0); arch.p.lineTo(gx + sz * 0.27, gy + sz * 0.01); arch.p.closePath(); arch.ext(gx - sz * 0.27, gy - sz * 0.69); arch.ext(gx + sz * 0.27, gy);
  twFill(x, arch, twSh(stone, 0.08), { hi: 0.1 }); twInk(x, arch, twSh(stone, 0.25));
  var door = shp(); door.p.moveTo(gx - sz * 0.21, gy); door.p.lineTo(gx - sz * 0.21, gy - sz * 0.4); door.p.arc(gx, gy - sz * 0.4, sz * 0.21, Math.PI, 0); door.p.lineTo(gx + sz * 0.21, gy); door.p.closePath(); door.ext(gx - sz * 0.21, gy - sz * 0.61); door.ext(gx + sz * 0.21, gy);
  twFill(x, door, '#e89a5c', { hi: 0.35, lo: 0.25 });
  x.save(); x.clip(door.p); x.strokeStyle = 'rgba(176,100,60,0.45)'; x.lineWidth = Math.max(0.8, sz * 0.014); for (var k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(gx + k * sz * 0.085, gy - sz * 0.62); x.lineTo(gx + k * sz * 0.085, gy); x.stroke(); }
  x.fillStyle = '#ffd24a'; [0.12, 0.32].forEach(function (u) { x.fillRect(gx - sz * 0.22, gy - sz * u - sz * 0.02, sz * 0.44, sz * 0.035); }); x.restore();
  twInk(x, door, '#c87a48');
  twHeart(x, gx, gy - sz * 0.47, sz * 0.06, '#ff7fb0');
  // 양쪽 둥근 탑 + 고깔 지붕 + 깃발
  [-1, 1].forEach(function (sd) {
    var tx = gx + sd * sz * 0.64, tw = sz * 0.32, th2 = sz * 1.16;
    twCyl(x, tx, gy - th2, tw, tw * 0.36, th2, stone, rnd, { stone: 1, rows: 6, cols: 4, top: twLt(stone, 0.2) });
    twWindow(x, tx - sd * sz * 0.02, gy - th2 * 0.6, sz * 0.08, sz * 0.12, 1);
    var rc = sd < 0 ? roofC : roofC2;
    twRoof(x, tx, gy - th2 + sz * 0.02, tw * 1.12, tw * 0.4, sz * 0.62, rc, { stripe: '#ffffff', sa: 0.55, trim: twLt(rc, 0.45), ball: '#ffd24a' });
    var fy = gy - th2 - sz * 0.62;
    twLeg(x, tx, fy - sz * 0.02, tx, fy - sz * 0.32, sz * 0.025, sz * 0.02, '#c98048');
    var fl = shp(); fl.p.moveTo(tx, fy - sz * 0.32); fl.p.quadraticCurveTo(tx + sd * sz * 0.16, fy - sz * 0.36, tx + sd * sz * 0.32, fy - sz * 0.27); fl.p.quadraticCurveTo(tx + sd * sz * 0.16, fy - sz * 0.22, tx, fy - sz * 0.17); fl.p.closePath(); fl.ext(tx - sz * 0.32, fy - sz * 0.36); fl.ext(tx + sz * 0.32, fy - sz * 0.17);
    twFill(x, fl, '#ffe066', { hi: 0.4 }); x.save(); x.clip(fl.p); x.fillStyle = 'rgba(255,127,176,0.85)'; for (var q = 0; q < 3; q++) x.fillRect(tx + sd * sz * (0.05 + q * 0.1) - sz * 0.025, fy - sz * 0.4, sz * 0.05, sz * 0.25); x.restore(); twInk(x, fl, '#ffb84a', TW_IW * 0.8);
  });
  // 등불 두 개: 탑 안쪽에 걸림 (render.js 횃불 빛 자리: 문 옆 0.36, 높이 0.62)
  [-1, 1].forEach(function (sd) {
    var lx = gx + sd * sz * 0.36, ly = gy - sz * 0.62;
    twLeg(x, lx, ly - sz * 0.1, lx, ly - sz * 0.14, sz * 0.02, sz * 0.02, '#c98048');
    var lb = shp().rrect(lx - sz * 0.045, ly - sz * 0.1, sz * 0.09, sz * 0.13, sz * 0.04); var lg = x.createLinearGradient(0, ly - sz * 0.1, 0, ly + sz * 0.03); lg.addColorStop(0, '#fff6c0'); lg.addColorStop(1, '#ffb84a'); x.fillStyle = lg; x.fill(lb.p); twInk(x, lb, '#ffb84a', TW_IW * 0.8);
    var lc = shp().rrect(lx - sz * 0.06, ly - sz * 0.12, sz * 0.12, sz * 0.035, sz * 0.015); twFill(x, lc, roofC, { hi: 0.4 }); twInk(x, lc, roofC, TW_IW * 0.6);
    x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, lx, ly - sz * 0.04, sz * 0.14, '#ffc060', 0.5); x.restore();
  });
  // 가운데 깃발: 하늘색 + 흰 하트
  twBanner(x, gx, gy - sz * 0.9, sz * 0.3, sz * 0.32, roofC2, '#ffffff', '#ff7fb0');
  // 문 앞 꽃
  for (var f = 0; f < 6; f++) { var fx = gx + (f < 3 ? -1 : 1) * sz * (0.36 + (f % 3) * 0.09), fy2 = gy + sz * 0.02 - (f % 2) * sz * 0.03; mpFlower(x, fx, fy2, sz * 0.045, T.flowers[f % T.flowers.length] === '#ffffff' ? '#ff8fc0' : T.flowers[f % T.flowers.length]); }
  return (PROP_CACHE[key] = trimSpr(spr(o.c, gx, gy)));
}

// ---------- 배경 한 장 굽기 ----------
// view: {W, H, S, ox, oy} (기기 화소)
function mpSmooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function renderBackground(g, view) {
  var T = THEME[g.M.theme], W = view.W, H = view.H, S = view.S, ox = view.ox, oy = view.oy;
  var c = mkC(W, H), x = cx2(c), rnd = rngOf(hashStr(g.M.id) + 3), N = makeNoise(hashStr(g.M.id));
  var wx0 = -ox / S, wy0 = -oy / S, wx1 = (W - ox) / S, wy1 = (H - oy) / S;
  TW_IW = Math.max(1, S * 0.02);
  function sxy(wx, wy) { return [ox + wx * S, oy + wy * S]; }
  // 1) 땅: 낮은 해상도 노이즈, 셀 그림처럼 부드러운 두세 단계 색
  var gr = 12, GW = Math.ceil((wx1 - wx0) * gr) + 2, GH = Math.ceil((wy1 - wy0) * gr) + 2;
  var lc = mkC(GW, GH), lx = cx2(lc), id = lx.createImageData(GW, GH), d = id.data;
  var C0 = hx(T.g[0]), C1 = hx(T.g[1]), C2 = hx(T.g[2]), CP = hx(T.patch);
  for (var j = 0; j < GH; j++) for (var i = 0; i < GW; i++) {
    var wx = wx0 + i / gr, wy = wy0 + j / gr;
    var n = N.fbm(wx * 0.4, wy * 0.4, 3), m = N.fbm(wx * 0.23 + 40, wy * 0.23 + 10, 3), q = N.fbm(wx * 0.5 + 90, wy * 0.5 + 31, 2);
    var v = mpSmooth(0.4, 0.56, n), hl = mpSmooth(0.55, 0.62, m) * 0.85, pt = mpSmooth(0.62, 0.68, q) * 0.55;
    var r = C0[0] + (C1[0] - C0[0]) * v, gg = C0[1] + (C1[1] - C0[1]) * v, b = C0[2] + (C1[2] - C0[2]) * v;
    r += (C2[0] - r) * hl; gg += (C2[1] - gg) * hl; b += (C2[2] - b) * hl;
    r += (CP[0] - r) * pt; gg += (CP[1] - gg) * pt; b += (CP[2] - b) * pt;
    var k = (j * GW + i) * 4; d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
  }
  lx.putImageData(id, 0, 0);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(lc, 0, 0, GW, GH, ox + wx0 * S, oy + wy0 * S, GW / gr * S, GH / gr * S);
  // 2) 땅 장식: 귀여운 풀포기, 꽃, 반짝이, 조약돌
  var area = (wx1 - wx0) * (wy1 - wy0), isPathCell = function (wx, wy) { var cc = Math.floor(wx), rr = Math.floor(wy); return cc >= 0 && rr >= 0 && cc < g.cols && rr < g.rows && g.kind[rr * g.cols + cc] === 'p'; };
  var liqAt = function (wx, wy) { var cc = Math.floor(wx), rr = Math.floor(wy); if (cc < 0 || rr < 0 || cc >= g.cols || rr >= g.rows) return false; var kk = g.kind[rr * g.cols + cc]; return kk === 'water' || kk === 'lava'; };
  var th = g.M.theme, sparkle = T.ice || th === 'dark', ember = !!T.lava;
  x.lineCap = 'round'; x.lineJoin = 'round';
  // 무리 지은 장식: 노이즈가 높은 곳에만 풀포기와 꽃 무리 (나머지는 깨끗하게 비움)
  var nC = Math.round(area * (T.ice ? 0.9 : ember ? 0.7 : th === 'canyon' ? 0.8 : th === 'dark' ? 0.9 : 1.5));
  var flP = th === 'meadow' ? 0.85 : th === 'ruins' ? 0.7 : th === 'forest' || th === 'swamp' ? 0.45 : th === 'deepforest' ? 0.5 : 0.2;
  for (var qq = 0; qq < nC; qq++) {
    var cwx = wx0 + rnd() * (wx1 - wx0), cwy = wy0 + rnd() * (wy1 - wy0);
    if (N.fbm(cwx * 0.7 + 5, cwy * 0.7 + 9, 2) < 0.45 || liqAt(cwx, cwy) || isPathCell(cwx, cwy)) continue;
    var nt = 2 + Math.floor(rnd() * 4);
    for (var t2 = 0; t2 < nt; t2++) {
      var twx = cwx + (rnd() - 0.5) * 0.7, twy = cwy + (rnd() - 0.5) * 0.45, p = sxy(twx, twy);
      if (liqAt(twx, twy) || isPathCell(twx, twy)) continue;
      if (T.ice) { // 눈 둔덕 + 연보라 그늘
        x.fillStyle = rgba(T.shade, 0.16); x.beginPath(); x.ellipse(p[0] + S * 0.02, p[1] + S * 0.02, S * 0.12, S * 0.045, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(p[0], p[1], S * 0.11, S * 0.04, 0, 0, Math.PI * 2); x.fill();
        continue;
      }
      if (ember) { // 작은 초콜릿 돌
        var er = S * (0.025 + rnd() * 0.02); x.fillStyle = rgba(twSh(T.g[0], 0.3), 0.6); x.beginPath(); x.ellipse(p[0] + er * 0.2, p[1] + er * 0.3, er * 1.15, er * 0.8, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = T.grass[3]; x.beginPath(); x.ellipse(p[0], p[1], er, er * 0.7, 0, 0, Math.PI * 2); x.fill(); continue;
      }
      // 풀포기: 둥근 잎 3장(채운 모양)
      var hh = S * (0.07 + rnd() * 0.05), cA = rnd() < 0.55 ? T.grass[2] : T.grass[3];
      for (var b2 = -1; b2 <= 1; b2++) {
        var ang = -Math.PI / 2 + b2 * 0.6 + (rnd() - 0.5) * 0.2, len = hh * (b2 ? 0.72 : 1), bw = S * 0.016, tx2 = p[0] + Math.cos(ang) * len, ty2 = p[1] + Math.sin(ang) * len, nx2 = -Math.sin(ang) * bw, ny2 = Math.cos(ang) * bw;
        x.fillStyle = rgba(T.grass[0], 0.5); x.beginPath(); x.moveTo(p[0] - nx2 + S * 0.006, p[1] - ny2 + S * 0.008); x.quadraticCurveTo(p[0] + Math.cos(ang) * len * 0.5 - nx2 * 1.4 + S * 0.006, p[1] + Math.sin(ang) * len * 0.5 - ny2 * 1.4 + S * 0.008, tx2 + S * 0.006, ty2 + S * 0.008); x.quadraticCurveTo(p[0] + Math.cos(ang) * len * 0.5 + nx2 * 1.4 + S * 0.006, p[1] + Math.sin(ang) * len * 0.5 + ny2 * 1.4 + S * 0.008, p[0] + nx2 + S * 0.006, p[1] + ny2 + S * 0.008); x.fill();
        x.fillStyle = cA; x.beginPath(); x.moveTo(p[0] - nx2, p[1] - ny2); x.quadraticCurveTo(p[0] + Math.cos(ang) * len * 0.5 - nx2 * 1.4, p[1] + Math.sin(ang) * len * 0.5 - ny2 * 1.4, tx2, ty2); x.quadraticCurveTo(p[0] + Math.cos(ang) * len * 0.5 + nx2 * 1.4, p[1] + Math.sin(ang) * len * 0.5 + ny2 * 1.4, p[0] + nx2, p[1] + ny2); x.fill();
      }
    }
    // 꽃 무리
    if (rnd() < flP && !T.ice && !ember) {
      var nfl = 2 + Math.floor(rnd() * 4), fcs = T.flowers[Math.floor(rnd() * T.flowers.length)];
      for (var fl2 = 0; fl2 < nfl; fl2++) {
        var fwx = cwx + (rnd() - 0.5) * 0.6, fwy = cwy + (rnd() - 0.5) * 0.4, p3 = sxy(fwx, fwy), fr = S * (0.03 + rnd() * 0.018), fc = rnd() < 0.7 ? fcs : T.flowers[Math.floor(rnd() * T.flowers.length)];
        if (liqAt(fwx, fwy) || isPathCell(fwx, fwy)) continue;
        if (th === 'deepforest') { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, p3[0], p3[1], fr * 2.6, fc, 0.5); x.restore(); }
        x.fillStyle = rgba(T.grass[0], 0.4); x.beginPath(); x.ellipse(p3[0] + fr * 0.2, p3[1] + fr * 0.6, fr * 0.95, fr * 0.38, 0, 0, Math.PI * 2); x.fill();
        mpFlower(x, p3[0], p3[1], fr, fc, fc === '#ffe066' ? '#ff9a4a' : '#ffd23a');
      }
    }
  }
  // 반짝이(눈, 밤), 불씨(용암), 조약돌
  var nF = area * (T.ice ? 1.2 : th === 'dark' ? 1.4 : ember ? 0.8 : 0.35);
  for (var f = 0; f < nF; f++) {
    var wx3 = wx0 + rnd() * (wx1 - wx0), wy3 = wy0 + rnd() * (wy1 - wy0), p4 = sxy(wx3, wy3);
    if (isPathCell(wx3, wy3) || liqAt(wx3, wy3)) continue;
    if (sparkle) { twTwinkle(x, p4[0], p4[1], S * (0.022 + rnd() * 0.03), th === 'dark' ? 0.7 : 0.9); continue; }
    if (ember) { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, p4[0], p4[1], S * 0.05, rnd() < 0.5 ? '#ff7a8a' : '#ffc070', 0.55); x.restore(); continue; }
    var pc = mixc(T.rock, T.g[1], 0.3), pr = S * (0.02 + rnd() * 0.018);
    x.fillStyle = rgba(twSh(pc, 0.5), 0.45); x.beginPath(); x.ellipse(p4[0] + pr * 0.2, p4[1] + pr * 0.35, pr * 1.1, pr * 0.7, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = twLt(pc, 0.25); x.beginPath(); x.ellipse(p4[0], p4[1], pr, pr * 0.66, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.ellipse(p4[0] - pr * 0.35, p4[1] - pr * 0.25, pr * 0.35, pr * 0.2, 0, 0, Math.PI * 2); x.fill();
  }
  // 3) 물, 용암
  paintLiquids(x, g, view, T, rnd);
  // 4) 길
  paintRoads(x, g, view, T, rnd, N);
  // 5) 바깥 여백 소품(격자 밖) 굽기
  var props = [];
  for (var py = Math.floor(wy0) - 1; py < Math.ceil(wy1) + 1; py++) for (var px = Math.floor(wx0) - 1; px < Math.ceil(wx1) + 1; px++) {
    var inside = px >= 0 && py >= 0 && px < g.cols && py < g.rows;
    if (inside) continue;
    // 길 연장선 근처는 비움
    var nearRoad = false;
    g.paths.forEach(function (pp) { for (var s3 = 0; s3 < pp.n; s3 += 6) if (Math.abs(pp.xs[s3] - (px + 0.5)) < 1.2 && Math.abs(pp.ys[s3] - (py + 0.5)) < 1.2) { nearRoad = true; break; } });
    if (nearRoad) continue;
    var dens = 0.62 + N.n2(px * 0.7, py * 0.7) * 0.5;
    if (rnd() > dens) continue;
    if (g.mwF && g.mwF.at(px + 0.5, py + 0.5) > 0.3) continue;   // [MB] 격자 밖으로 이어진 물 위에는 뭍 소품을 놓지 않음
    props.push({ k: T.props[Math.floor(rnd() * T.props.length)], x: px + 0.2 + rnd() * 0.6, y: py + 0.4 + rnd() * 0.5, seed: Math.floor(rnd() * 6) });
  }
  props.sort(function (a, b) { return a.y - b.y; });
  props.forEach(function (pr) { var sp = propSpr(pr.k, g.M.theme, S, pr.seed); var p4 = sxy(pr.x, pr.y); drawSpr(x, sp, p4[0], p4[1]); });
  // 6) 색 보정: 밝은 파스텔 빛(왼쪽 위 따뜻, 오른쪽 아래 은은한 테마 그늘), 어두운 테두리 없음
  x.save();
  x.globalCompositeOperation = 'soft-light';
  var lg = x.createLinearGradient(0, 0, W, H); lg.addColorStop(0, rgba(T.light, 0.7)); lg.addColorStop(0.55, 'rgba(128,128,128,0)'); lg.addColorStop(1, rgba(T.shade, 0.45));
  x.fillStyle = lg; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  // 격자 밖은 옅은 파스텔 막(전장에 시선이 가도록, 어둡게 하지 않음)
  var gx0 = ox, gy0 = oy, gx1 = ox + g.cols * S, gy1 = oy + g.rows * S;
  x.fillStyle = rgba(T.light, th === 'dark' ? 0.08 : 0.14);
  x.fillRect(0, 0, W, Math.max(0, gy0)); x.fillRect(0, gy1, W, Math.max(0, H - gy1)); x.fillRect(0, gy0, Math.max(0, gx0), gy1 - gy0); x.fillRect(gx1, gy0, Math.max(0, W - gx1), gy1 - gy0);
  x.restore();
  return c;
}
function liquidMask(g, kind, thr) {
  var r = 12, mw = (g.cols + 4) * r, mh = (g.rows + 4) * r, m = mkC(mw, mh), x = cx2(m), any = false;
  x.fillStyle = '#ffffff';
  for (var rr = 0; rr < g.rows; rr++) for (var c = 0; c < g.cols; c++) {
    if (g.kind[rr * g.cols + c] !== kind) continue; any = true;
    var x0 = (c + 2) * r, y0 = (rr + 2) * r, w = r, h = r;
    if (c === 0) { x0 -= r * 2; w += r * 2; } if (c === g.cols - 1) w += r * 2; if (rr === 0) { y0 -= r * 2; h += r * 2; } if (rr === g.rows - 1) h += r * 2;
    x.fillRect(x0, y0, w, h);
  }
  if (!any) return null;
  var id = x.getImageData(0, 0, mw, mh), d = id.data, a = new Float32Array(mw * mh), t = new Float32Array(mw * mh), R = 5;
  for (var i = 0; i < mw * mh; i++) a[i] = d[i * 4 + 3] / 255;
  for (var pass = 0; pass < 2; pass++) {
    for (var y = 0; y < mh; y++) { var s2 = 0; for (var k = -R; k <= R; k++) s2 += a[y * mw + clamp(k, 0, mw - 1)]; for (var xx = 0; xx < mw; xx++) { t[y * mw + xx] = s2 / (2 * R + 1); s2 += a[y * mw + clamp(xx + R + 1, 0, mw - 1)] - a[y * mw + clamp(xx - R, 0, mw - 1)]; } }
    for (var xx2 = 0; xx2 < mw; xx2++) { var s3 = 0; for (var k2 = -R; k2 <= R; k2++) s3 += t[clamp(k2, 0, mh - 1) * mw + xx2]; for (var y2 = 0; y2 < mh; y2++) { a[y2 * mw + xx2] = s3 / (2 * R + 1); s3 += t[clamp(y2 + R + 1, 0, mh - 1) * mw + xx2] - t[clamp(y2 - R, 0, mh - 1) * mw + xx2]; } }
  }
  for (var j = 0; j < mw * mh; j++) { var v = clamp((a[j] - thr) / 0.08 + 0.5, 0, 1); d[j * 4] = d[j * 4 + 1] = d[j * 4 + 2] = 255; d[j * 4 + 3] = Math.round(v * v * (3 - 2 * v) * 255); }
  x.putImageData(id, 0, 0);
  return { c: m, r: r };
}
function drawMask(x, M, view) { var S = view.S; x.imageSmoothingEnabled = true; x.drawImage(M.c, view.ox - 2 * S, view.oy - 2 * S, M.c.width / M.r * S, M.c.height / M.r * S); }
function paintLiquids(x, g, view, T, rnd) {
  var S = view.S, W = view.W, H = view.H;
  ['water', 'lava'].forEach(function (kind) {
    if (kind === 'water' && !T.ice && typeof mwPaintSea === 'function') { mwPaintSea(x, g, view, T, rnd); return; }   // [MB] 바다 그리기는 art_map3.js
    var M = liquidMask(g, kind, 0.5), Mo = liquidMask(g, kind, 0.36);
    if (!M) return;
    var lava = kind === 'lava', ice = !!T.ice && !lava, cols = lava ? ['#ff6478', '#ff9e50', '#ffe58a'] : T.water;
    // 물가: 테마 물가색 띠 + 진한 테두리 선
    var shoreC = lava ? '#6a3a30' : T.shore;
    var Mi = liquidMask(g, kind, 0.3), ink = mkC(W, H), ix = cx2(ink); drawMask(ix, Mi, view); ix.globalCompositeOperation = 'source-in'; ix.fillStyle = twInkC(shoreC); ix.fillRect(0, 0, W, H); x.save(); x.globalAlpha = lava ? 0.9 : 0.5; x.drawImage(ink, 0, 0); x.restore();
    var sh = mkC(W, H), sx = cx2(sh); drawMask(sx, Mo, view); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = shoreC; sx.fillRect(0, 0, W, H);
    if (lava) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.45; var gl = mkC(W, H), gx2 = cx2(gl); drawMask(gx2, liquidMask(g, kind, 0.22), view); gx2.globalCompositeOperation = 'source-in'; gx2.fillStyle = 'rgba(255,120,90,0.5)'; gx2.fillRect(0, 0, W, H); x.drawImage(gl, 0, 0); x.restore(); }
    x.drawImage(sh, 0, 0);
    // 물 면
    var L = mkC(W, H), lx = cx2(L);
    var gr = lx.createLinearGradient(0, 0, W * 0.4, H); gr.addColorStop(0, cols[1]); gr.addColorStop(0.5, cols[0]); gr.addColorStop(1, twSh(cols[0], 0.15));
    lx.fillStyle = gr; lx.fillRect(0, 0, W, H);
    lx.lineCap = 'round'; lx.lineJoin = 'round';
    if (lava) {
      // 사탕 용암: 주황 노랑 얼룩 + 밝은 소용돌이 + 둥근 거품
      for (var bl = 0; bl < 36; bl++) { lx.globalAlpha = 0.5; lx.drawImage(softSpr(rnd() < 0.6 ? '#ffa048' : '#ffd36a', 32), rnd() * W - S, rnd() * H - S * 0.6, S * 2.4, S * 1.3); } lx.globalAlpha = 1;
      lx.strokeStyle = 'rgba(255,240,170,0.55)'; lx.lineWidth = Math.max(1.5, S * 0.035);
      for (var sw = 0; sw < 70; sw++) { var cx0 = rnd() * W, cy0 = rnd() * H, rr0 = S * (0.12 + rnd() * 0.16); lx.beginPath(); lx.arc(cx0, cy0, rr0, rnd() * 6, 0); lx.stroke(); }
      for (var i = 0; i < 90; i++) { var bx = rnd() * W, by = rnd() * H, br = S * (0.03 + rnd() * 0.05); lx.fillStyle = 'rgba(230,60,120,0.5)'; lx.beginPath(); lx.arc(bx + br * 0.2, by + br * 0.2, br, 0, Math.PI * 2); lx.fill(); lx.fillStyle = 'rgba(255,214,140,0.95)'; lx.beginPath(); lx.arc(bx, by, br * 0.8, 0, Math.PI * 2); lx.fill(); lx.fillStyle = '#ffffff'; lx.beginPath(); lx.arc(bx - br * 0.3, by - br * 0.3, br * 0.25, 0, Math.PI * 2); lx.fill(); }
    } else if (ice) {
      lx.strokeStyle = 'rgba(255,255,255,0.75)'; lx.lineWidth = Math.max(1, S * 0.016);
      for (var c2 = 0; c2 < 40; c2++) { var sx2 = rnd() * W, sy2 = rnd() * H; lx.beginPath(); lx.moveTo(sx2, sy2); for (var z = 0; z < 3; z++) { sx2 += (rnd() - 0.5) * S * 0.5; sy2 += (rnd() - 0.5) * S * 0.3; lx.lineTo(sx2, sy2); } lx.stroke(); }
      lx.fillStyle = 'rgba(255,255,255,0.32)'; for (var h2 = 0; h2 < 26; h2++) { lx.save(); lx.translate(rnd() * W, rnd() * H); lx.rotate(-0.5); lx.fillRect(-S * 0.5, -S * 0.04, S, S * 0.08); lx.restore(); }
      for (var tw = 0; tw < 40; tw++) twTwinkle(lx, rnd() * W, rnd() * H, S * (0.03 + rnd() * 0.04), 0.9);
    } else {
      // 하늘 반사와 하얀 잔물결
      for (var rf = 0; rf < 14; rf++) { lx.globalAlpha = 0.22; lx.drawImage(softSpr(cols[2], 32), rnd() * W - S, rnd() * H - S * 0.3, S * 2.4, S * 0.6); }
      lx.globalAlpha = 1; lx.strokeStyle = 'rgba(255,255,255,0.6)'; lx.lineWidth = Math.max(1.2, S * 0.02);
      for (var w = 0; w < 90; w++) { var wx = rnd() * W, wy = rnd() * H, L2 = S * (0.1 + rnd() * 0.18); lx.beginPath(); lx.moveTo(wx, wy); lx.quadraticCurveTo(wx + L2 / 2, wy - S * 0.035, wx + L2, wy); lx.stroke(); }
      if (g.M.theme === 'swamp' || g.M.theme === 'meadow') {
        // 연잎 + 분홍 꽃
        var nLp = g.M.theme === 'swamp' ? 70 : 24;
        for (var lp = 0; lp < nLp; lp++) {
          var lx2 = rnd() * W, ly2 = rnd() * H, lr = S * (0.08 + rnd() * 0.07), a0 = rnd() * 6;
          lx.fillStyle = twInkC('#5cc46a'); lx.beginPath(); lx.ellipse(lx2, ly2, lr + TW_IW, lr * 0.62 + TW_IW, 0, 0, Math.PI * 2); lx.fill();
          lx.fillStyle = '#6fd47a'; lx.beginPath(); lx.ellipse(lx2, ly2, lr, lr * 0.62, 0, a0, a0 + Math.PI * 1.8); lx.lineTo(lx2, ly2); lx.fill();
          lx.fillStyle = 'rgba(200,255,190,0.7)'; lx.beginPath(); lx.ellipse(lx2 - lr * 0.3, ly2 - lr * 0.2, lr * 0.35, lr * 0.18, 0, 0, Math.PI * 2); lx.fill();
          if (rnd() < 0.3) mpFlower(lx, lx2 + lr * 0.2, ly2 - lr * 0.15, lr * 0.45, '#ff9fd0', '#fff0a0');
        }
      }
    }
    lx.globalCompositeOperation = 'destination-in'; drawMask(lx, M, view);
    x.drawImage(L, 0, 0);
    // 가장자리 하얀 물거품 띠
    var E = mkC(W, H), ex = cx2(E); drawMask(ex, M, view); ex.globalCompositeOperation = 'source-in'; ex.fillStyle = lava ? 'rgba(255,236,160,0.85)' : rgba('#ffffff', ice ? 0.65 : 0.7); ex.fillRect(0, 0, W, H);
    ex.globalCompositeOperation = 'destination-out'; drawMask(ex, liquidMask(g, kind, 0.6), view);
    x.drawImage(E, 0, 0);
  });
}
function paintRoads(x, g, view, T, rnd, N) {
  var S = view.S, ox = view.ox, oy = view.oy;
  var pathsDraw = g.M.paths.map(function (w) {
    // 바깥으로 길게 늘려 화면 끝까지 이어 보이게
    var a = w[0], b = w[1], dx = Math.sign(a[0] - b[0]), dy = Math.sign(a[1] - b[1]);
    var w2 = w.slice(); w2[0] = [a[0] + dx * 6, a[1] + dy * 6];
    return buildPath(w2, 0.5);
  });
  var road = T.road, D = T.dirt;
  var edge = shp(), main = shp();
  pathsDraw.forEach(function (p) {
    for (var i = 0; i < p.n; i += 2) {
      var wx = p.xs[i], wy = p.ys[i], j = N.n2(wx * 1.7, wy * 1.7);
      var X = ox + wx * S, Y = oy + wy * S;
      edge.ell(X, Y, S * (0.475 + j * 0.03), S * (0.475 + j * 0.03));
      main.ell(X, Y, S * (0.4 + j * 0.02), S * (0.4 + j * 0.02));
    }
  });
  function trace(p, step) { x.beginPath(); for (var i = 0; i < p.n; i += step) { var X = ox + p.xs[i] * S, Y = oy + p.ys[i] * S; if (!i) x.moveTo(X, Y); else x.lineTo(X, Y); } }
  // 길가 그늘(풀 위로 살짝) + 진한 테두리 + 밝은 길 면
  x.save(); x.translate(S * 0.02, S * 0.05); x.fillStyle = rgba(twSh(D[0], 0.4), 0.3); x.fill(edge.p); x.restore();
  x.fillStyle = D[0]; x.fill(edge.p);
  x.fillStyle = D[1]; x.fill(main.p);
  x.save(); x.clip(main.p); x.lineCap = 'round'; x.lineJoin = 'round';
  // 가운데 밝은 결
  pathsDraw.forEach(function (p) { x.strokeStyle = rgba(D[2], 0.75); x.lineWidth = S * 0.36; trace(p, 3); x.stroke(); x.strokeStyle = rgba(D[3], 0.35); x.lineWidth = S * 0.14; trace(p, 3); x.stroke(); });
  if (road === 'cobble' || road === 'obsidian' || road === 'gravel') {
    // 동글동글 포장돌(색이 비슷해 길 모양은 또렷하게 남김)
    var stones = road === 'cobble' ? [D[1], '#ead8f2', '#f6e2ea', '#e2eef8'] : road === 'obsidian' ? [D[1], '#d4c4fa', '#ccbdf4', '#e2d8fc'] : [D[1], '#f2ca9c', '#e8b688', '#f6d4ae'];
    pathsDraw.forEach(function (p) {
      for (var i = 0; i < p.n; i += 3) {
        var ii = Math.min(p.n - 2, i), dx = p.xs[ii + 1] - p.xs[ii], dy = p.ys[ii + 1] - p.ys[ii], L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
        var row = Math.floor(i / 3);
        for (var k = -2; k <= 2; k++) {
          var off = (k + (row % 2 ? 0.5 : 0)) * 0.18; if (Math.abs(off) > 0.32) continue;
          if (rnd() < 0.15) continue;
          var wx = p.xs[i] - dy * off, wy = p.ys[i] + dx * off, X = ox + wx * S, Y = oy + wy * S;
          var sz = S * (road === 'gravel' ? 0.055 + rnd() * 0.02 : 0.068 + rnd() * 0.015), base = stones[Math.floor(rnd() * stones.length)], an = Math.atan2(dy, dx);
          x.fillStyle = rgba(twSh(D[0], 0.2), 0.28); x.beginPath(); x.ellipse(X + sz * 0.1, Y + sz * 0.22, sz, sz * 0.74, an, 0, Math.PI * 2); x.fill();
          x.fillStyle = base; x.beginPath(); x.ellipse(X, Y, sz * 0.92, sz * 0.68, an, 0, Math.PI * 2); x.fill();
          x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.ellipse(X - sz * 0.25, Y - sz * 0.2, sz * 0.38, sz * 0.22, an, 0, Math.PI * 2); x.fill();
        }
      }
    });
    if (road === 'obsidian') for (var e2 = 0; e2 < 50; e2++) { var p5 = pathsDraw[e2 % pathsDraw.length], s5 = Math.floor(rnd() * p5.n); twTwinkle(x, ox + p5.xs[s5] * S + (rnd() - 0.5) * S * 0.5, oy + p5.ys[s5] * S + (rnd() - 0.5) * S * 0.5, S * 0.035, 0.85); }
    if (road === 'gravel') { x.globalCompositeOperation = 'lighter'; for (var e = 0; e < 30; e++) { var p0 = pathsDraw[e % pathsDraw.length], si = Math.floor(rnd() * p0.n); glowAt(x, ox + p0.xs[si] * S + (rnd() - 0.5) * S * 0.5, oy + p0.ys[si] * S + (rnd() - 0.5) * S * 0.5, S * 0.05, '#ff9a6a', 0.35); } x.globalCompositeOperation = 'source-over'; }
  } else {
    // 흙, 모래, 진흙, 눈길: 옅은 바퀴 자국 + 조약돌 + 테마 장식
    pathsDraw.forEach(function (p) {
      [-0.17, 0.17].forEach(function (off) {
        x.strokeStyle = rgba(D[0], road === 'snow' ? 0.16 : 0.13); x.lineWidth = S * 0.045; x.beginPath();
        for (var i = 0; i < p.n - 1; i += 3) { var dx = p.xs[i + 1] - p.xs[i], dy = p.ys[i + 1] - p.ys[i], L = Math.hypot(dx, dy) || 1; var X = ox + (p.xs[i] - dy / L * off) * S, Y = oy + (p.ys[i] + dx / L * off) * S; if (!i) x.moveTo(X, Y); else x.lineTo(X, Y); }
        x.stroke();
      });
    });
    var cnt = 0; pathsDraw.forEach(function (p) { cnt += p.n; });
    for (var q = 0; q < cnt / 14; q++) {
      var p1 = pathsDraw[Math.floor(rnd() * pathsDraw.length)], k2 = Math.floor(rnd() * p1.n), X1 = ox + p1.xs[k2] * S + (rnd() - 0.5) * S * 0.6, Y1 = oy + p1.ys[k2] * S + (rnd() - 0.5) * S * 0.6, r = S * (0.016 + rnd() * 0.018);
      x.fillStyle = rgba(twSh(D[0], 0.1), 0.35); x.beginPath(); x.ellipse(X1 + r * 0.2, Y1 + r * 0.3, r * 1.2, r * 0.85, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = D[3]; x.beginPath(); x.ellipse(X1, Y1, r * 1.1, r * 0.75, 0, 0, Math.PI * 2); x.fill();
    }
    if (road === 'mud') { for (var pu = 0; pu < cnt / 70; pu++) { var p2 = pathsDraw[0], k3 = Math.floor(rnd() * p2.n), PX = ox + p2.xs[k3] * S + (rnd() - 0.5) * S * 0.3, PY = oy + p2.ys[k3] * S + (rnd() - 0.5) * S * 0.3; x.fillStyle = rgba(twSh(D[0], 0.2), 0.5); x.beginPath(); x.ellipse(PX, PY + S * 0.01, S * 0.13, S * 0.065, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#7fd8c8'; x.beginPath(); x.ellipse(PX, PY, S * 0.11, S * 0.05, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.ellipse(PX - S * 0.04, PY - S * 0.015, S * 0.035, S * 0.012, 0, 0, Math.PI * 2); x.fill(); } }
    if (road === 'snow') { // 작은 발자국
      for (var fp = 0; fp < cnt / 40; fp++) { var p6 = pathsDraw[Math.floor(rnd() * pathsDraw.length)], k6 = Math.floor(rnd() * (p6.n - 2)), dx6 = p6.xs[k6 + 1] - p6.xs[k6], dy6 = p6.ys[k6 + 1] - p6.ys[k6], L6 = Math.hypot(dx6, dy6) || 1, an6 = Math.atan2(dy6, dx6);
        for (var st = 0; st < 2; st++) { var sd6 = st ? 1 : -1, FX = ox + (p6.xs[k6] - dy6 / L6 * 0.07 * sd6 + dx6 / L6 * 0.12 * st) * S, FY = oy + (p6.ys[k6] + dx6 / L6 * 0.07 * sd6 + dy6 / L6 * 0.12 * st) * S; x.fillStyle = rgba(D[0], 0.3); x.beginPath(); x.ellipse(FX, FY, S * 0.03, S * 0.02, an6, 0, Math.PI * 2); x.fill(); } }
      for (var sp6 = 0; sp6 < cnt / 30; sp6++) { var p7 = pathsDraw[Math.floor(rnd() * pathsDraw.length)], k7 = Math.floor(rnd() * p7.n); twTwinkle(x, ox + p7.xs[k7] * S + (rnd() - 0.5) * S * 0.6, oy + p7.ys[k7] * S + (rnd() - 0.5) * S * 0.6, S * 0.025, 0.8); }
    }
  }
  x.restore();
  // 길 위쪽 안 그늘(살짝 파인 느낌, 길 모양이 더 또렷)
  var ins = mkC(view.W, view.H), isx = cx2(ins); isx.fillStyle = twSh(D[0], 0.1); isx.fill(main.p); isx.globalCompositeOperation = 'destination-out'; isx.translate(0, S * 0.055); isx.fill(main.p);
  x.save(); x.globalAlpha = 0.32; x.drawImage(ins, 0, 0); x.restore();
  if (typeof mwBridges === 'function') { mwBridges(x, g, view, T, rnd); return; }   // [MB] 다리는 art_map3.js (아래는 그 파일이 없을 때만)
  // 다리 (물, 용암 위): 꿀빛 널빤지
  g.paths.forEach(function (p) {
    for (var i = 0; i < p.n; i += 3) {
      var cc = Math.floor(p.xs[i]), rr = Math.floor(p.ys[i]);
      if (cc < 0 || rr < 0 || cc >= g.cols || rr >= g.rows) continue;
      var nb = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(function (o) { var c2 = cc + o[0], r2 = rr + o[1]; if (c2 < 0 || r2 < 0 || c2 >= g.cols || r2 >= g.rows) return false; var kk = THEME_LIQ(g, c2, r2); return kk && (o[0] === 0 && o[1] === 0 ? false : true); });
      if (!nb) continue;
      var ii = Math.min(p.n - 2, i), dx = p.xs[ii + 1] - p.xs[ii], dy = p.ys[ii + 1] - p.ys[ii], L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      var X = ox + p.xs[i] * S, Y = oy + p.ys[i] * S, stone = T.lava || T.road === 'cobble';
      x.save(); x.translate(X, Y); x.rotate(Math.atan2(dy, dx));
      var pw = S * 0.115, ph = S * 0.9, col = T.lava ? '#eaa868' : stone ? '#e4d6f0' : '#f0b068';
      x.fillStyle = 'rgba(74,38,96,0.3)'; x.fillRect(-pw / 2 + S * 0.03, -ph / 2 + S * 0.05, pw, ph);
      var pl = shp().rrect(-pw / 2 + S * 0.008, -ph / 2, pw - S * 0.016, ph, S * 0.03); twFill(x, pl, mixc(col, '#ffffff', rnd() * 0.15), { hi: 0.3, lo: 0.2 }); twInk(x, pl, col, TW_IW * 0.8);
      x.fillStyle = twInkC(col); [-1, 1].forEach(function (sd) { x.beginPath(); x.arc(0, sd * ph * 0.38, S * 0.014, 0, Math.PI * 2); x.fill(); });
      x.restore();
    }
  });
}
function THEME_LIQ(g, c, r) { var k = g.kind[r * g.cols + c]; return k === 'water' || k === 'lava'; }
