// ===== tf_art_enemy.js : 타임플렉스 시대 적 그림 (1장 원시) =====
// art_enemy.js 방식 그대로(EN_DRAW[k] = { n, top, f(x, H, p) }, 오른쪽이 진행 방향, 기준점은 발밑). 도우미는 4장(art_enemy_ch4.js)의 먹선 도구 e4*를 빌려 씀
// 시간 침략자 표식: 모든 시대 적의 몸 어딘가에 푸른 시간 균열 무늬(tfRune)가 빛난다. 같은 군단으로 보이게
var TFC = { skin: '#d79a62', skinD: '#b0763f', fur: '#8a5a34', furL: '#b98552', furD: '#5e3b22', hair: '#3a2a20', bone: '#efe4c8', wood: '#9b6b3e', rune: '#5ff0ff', stone: '#a7a29a', leaf: '#6f8f3a' };
var TF_INK = '#21170f';
// 푸른 시간 균열 무늬: 번개 모양 금 + 빛 (색칠 단계만)
function tfRune(x, cx, cy, r, ph) {
  if (enMode) return;
  var a = 0.75 + 0.25 * Math.sin((ph || 0) * Math.PI * 2);
  x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, cx, cy, r * 2.2, TFC.rune, 0.35 * a); x.restore();
  x.save(); x.strokeStyle = 'rgba(160,250,255,' + a + ')'; x.lineWidth = Math.max(0.8, r * 0.28); x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(cx - r * 0.2, cy - r); x.lineTo(cx + r * 0.25, cy - r * 0.25); x.lineTo(cx - r * 0.25, cy + r * 0.15); x.lineTo(cx + r * 0.2, cy + r); x.stroke(); x.restore();
}
// 털 덩어리 가장자리(삐죽삐죽): 점 목록을 따라 바깥으로 털 끝을 낸다
function tfFurBlob(pts, k) {
  var out = [], n = pts.length, cx = 0, cy = 0, i;
  pts.forEach(function (p) { cx += p[0] / n; cy += p[1] / n; });
  for (i = 0; i < n; i++) {
    var a = pts[i], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = mx - cx, dy = my - cy, l = Math.hypot(dx, dy) || 1;
    out.push(a); out.push([mx + dx / l * k, my + dy / l * k]);
  }
  return shp().poly(out);
}
// 굽은 뿔, 상아: 곡선 a → c → b 를 따라 굵기 w0 에서 w1 로 가늘어지는 덩어리
function tfHorn(x, a, c, b, w0, w1, col, o) {
  var n = 8, L = [], R = [], i;
  for (i = 0; i <= n; i++) {
    var t = i / n, u = 1 - t, px = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], py = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1];
    var dx = u * (c[0] - a[0]) + t * (b[0] - c[0]), dy = u * (c[1] - a[1]) + t * (b[1] - c[1]), l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * t) / 2;
    L.push([px - dy / l * w, py + dx / l * w]); R.push([px + dy / l * w, py - dx / l * w]);
  }
  return e4F(x, shp().poly(L.concat(R.reverse())), col, o || { d: w0 * 0.2, lw: 1.1, hi: 0.35 });
}
// ---------- 사람(부족 전사, 사냥꾼, 주술사) ----------
// o: skin, fur(옷), hair, weapon('club'|'spear'|'staff'), hood(사냥꾼 털가죽 위장), mask(주술사 뼈 가면), crouch(웅크림 0~1), big(덩치)
function tfHuman(x, H, p, o) {
  var a = p * Math.PI * 2, s = Math.sin(a), bob = Math.abs(Math.cos(a)) * H * 0.025, cr = o.crouch || 0, big = o.big || 1;
  var hipY = -H * (0.36 - cr * 0.05), shY = -H * (0.66 - cr * 0.08), hx = H * (0.02 + cr * 0.06), hy = -H * (0.8 - cr * 0.1), hr = H * 0.165;
  var w = H * 0.085 * big, sk = o.skin, fur = o.fur;
  EN_ONE = TF_INK;
  x.save(); x.translate(0, -bob);
  // 먼 다리, 먼 팔
  e4Leg(x, -H * 0.03, hipY, a + Math.PI, H * 0.11, H * 0.06, w, enShd(sk, 0.18), enShd(TFC.furD, 0.1), H * 0.07);
  var farTh = o.weapon === 'staff' ? 0.5 : -0.5 - s * 0.3;
  e4Arm(x, -H * 0.06, shY + H * 0.03, H * 0.24, farTh, w * 0.85, enShd(sk, 0.18), null);
  // 등 뒤 털가죽 망토(사냥꾼)
  if (o.hood) {
    var cape = tfFurBlob([[-H * 0.02, shY - H * 0.08], [-H * 0.3 - s * H * 0.02, hipY + H * 0.02], [-H * 0.28, -H * 0.12], [-H * 0.04, -H * 0.16], [H * 0.12, hipY], [H * 0.1, shY]], H * 0.03);
    e4F(x, cape, o.hood, { d: H * 0.04, lw: 1.2 });
    e4Stripes(x, cape, [[-0.2, -0.5, -0.12, -0.3, 0.035], [-0.24, -0.34, -0.14, -0.2, 0.03]].map(function (q) { return [q[0] * H, q[1] * H, q[2] * H, q[3] * H, H * q[4]]; }), enShd(o.hood, 0.35));
  }
  e4Leg(x, H * 0.05, hipY, a, H * 0.11, H * 0.06, w, sk, TFC.furD, H * 0.07);
  // 몸통: 털가죽 옷(한쪽 어깨)
  var torso = e4Bl([[-H * 0.1 * big, shY], [H * 0.1 * big, shY - H * 0.01], [H * 0.13 * big, hipY - H * 0.04], [H * 0.09, hipY + H * 0.03], [-H * 0.1, hipY + H * 0.03], [-H * 0.13 * big, hipY - H * 0.05]]);
  e4F(x, torso, sk, { d: H * 0.04, lw: 1.3 });
  var tunic = tfFurBlob([[-H * 0.13 * big, shY + H * 0.08], [H * 0.06, shY - H * 0.02], [H * 0.14 * big, hipY - H * 0.02], [H * 0.1, hipY + H * 0.07], [-H * 0.12, hipY + H * 0.08]], H * 0.025);
  e4F(x, tunic, fur, { d: H * 0.03, lw: 1.2 });
  if (!enMode) { x.save(); x.clip(tunic.p); x.fillStyle = enShd(fur, 0.3); [[-0.05, -0.5], [0.06, -0.44], [-0.02, -0.4], [0.08, -0.55]].forEach(function (q) { x.beginPath(); x.ellipse(q[0] * H, q[1] * H + cr * H * 0.05, H * 0.02, H * 0.014, 0.4, 0, Math.PI * 2); x.fill(); }); x.restore(); }
  if (o.necklace) { e4Line(x, [[-H * 0.07, shY + H * 0.03], [0, shY + H * 0.07], [H * 0.08, shY + H * 0.02]], H * 0.012, TFC.bone); [[-0.04, 0.06], [0.02, 0.075], [0.06, 0.05]].forEach(function (q) { e4Ov(x, q[0] * H, shY + q[1] * H, H * 0.012, H * 0.022, TFC.bone, 0, { d: 0, lw: 0.6 }); }); }
  tfRune(x, -H * 0.02, (shY + hipY) / 2 - H * 0.02, H * 0.035, p);
  // 머리
  var head = e4Bl([[hx - hr, hy + hr * 0.1], [hx - hr * 0.8, hy - hr * 0.75], [hx + hr * 0.3, hy - hr * 0.95], [hx + hr * 0.95, hy - hr * 0.35], [hx + hr * 1.05, hy + hr * 0.25], [hx + hr * 0.7, hy + hr * 0.85], [hx - hr * 0.4, hy + hr * 0.95]]);
  e4F(x, head, sk, { d: hr * 0.2, lw: 1.4 });
  if (o.mask) {
    var mk = e4Bl([[hx - hr * 0.15, hy - hr * 0.7], [hx + hr * 1.1, hy - hr * 0.5], [hx + hr * 1.2, hy + hr * 0.3], [hx + hr * 0.6, hy + hr * 0.9], [hx - hr * 0.1, hy + hr * 0.6]]);
    e4F(x, mk, TFC.bone, { d: hr * 0.1, lw: 1.2 });
    if (!enMode) { x.fillStyle = '#1a1410'; [[0.25, -0.15], [0.8, -0.1]].forEach(function (q) { x.beginPath(); x.ellipse(hx + q[0] * hr, hy + q[1] * hr, hr * 0.17, hr * 0.13, 0, 0, Math.PI * 2); x.fill(); }); x.fillStyle = TFC.rune; [[0.25, -0.15], [0.8, -0.1]].forEach(function (q) { x.beginPath(); x.arc(hx + q[0] * hr, hy + q[1] * hr, hr * 0.07, 0, Math.PI * 2); x.fill(); }); }
    // 깃털 장식
    [[-0.3, -1.0, -0.5], [0.0, -1.15, -0.15], [0.3, -1.05, 0.25]].forEach(function (q, j) { e4Pill(x, [hx + q[0] * hr * 0.5, hy - hr * 0.6], [hx + q[0] * hr, hy + q[1] * hr - hr * 0.35], hr * 0.16, hr * 0.06, j === 1 ? '#d9463c' : '#f3b630', 0.8); });
  } else if (!enMode) {
    var ey = hy - hr * 0.08, e1 = hx + hr * 0.22, e2 = hx + hr * 0.72;
    e4Eye(x, e1, ey, hr * 0.17, hr * 0.17, { w: '#fffbe8', ir: o.hood ? '#d9b84a' : '#7a4a22', pr: 0.42, px: 0.3 });
    e4Eye(x, e2, ey - hr * 0.02, hr * 0.13, hr * 0.15, { w: '#fffbe8', ir: o.hood ? '#d9b84a' : '#7a4a22', pr: 0.42, px: 0.2, sd: -1 });
    e4Brush(x, [e1 - hr * 0.25, ey - hr * 0.32], [e1, ey - hr * 0.38], [e2 + hr * 0.15, ey - hr * 0.28], hr * 0.16, hr * 0.08, o.hair);
    x.strokeStyle = TF_INK; x.lineWidth = Math.max(0.8, hr * 0.08); x.lineCap = 'round';
    x.beginPath(); x.moveTo(hx + hr * 0.45, hy + hr * 0.5); x.quadraticCurveTo(hx + hr * 0.62, hy + hr * 0.42, hx + hr * 0.8, hy + hr * 0.5); x.stroke();
    // 얼굴 칠(붉은 흙 두 줄)
    x.strokeStyle = 'rgba(200,70,50,0.85)'; x.lineWidth = Math.max(0.8, hr * 0.07); x.beginPath(); x.moveTo(hx + hr * 0.05, hy + hr * 0.18); x.lineTo(hx + hr * 0.3, hy + hr * 0.22); x.moveTo(hx + hr * 0.08, hy + hr * 0.3); x.lineTo(hx + hr * 0.3, hy + hr * 0.34); x.stroke();
  }
  // 머리카락 또는 털모자
  if (o.hood) {
    var hd = tfFurBlob([[hx - hr * 1.15, hy + hr * 0.4], [hx - hr * 1.0, hy - hr * 0.8], [hx + hr * 0.2, hy - hr * 1.2], [hx + hr * 0.9, hy - hr * 0.8], [hx + hr * 1.0, hy - hr * 0.35], [hx + hr * 0.3, hy - hr * 0.5], [hx - hr * 0.5, hy + hr * 0.2]], hr * 0.12);
    e4F(x, hd, o.hood, { d: hr * 0.2, lw: 1.3 });
    [[-0.55, -1.15], [0.35, -1.2]].forEach(function (q) { e4F(x, e4Po([[hx + q[0] * hr - hr * 0.18, hy - hr * 0.85], [hx + q[0] * hr, hy + q[1] * hr - hr * 0.25], [hx + q[0] * hr + hr * 0.2, hy - hr * 0.9]]), o.hood, { d: 0, lw: 1 }); });
  } else if (!o.mask) {
    var hair = tfFurBlob([[hx - hr * 1.1, hy + hr * 0.45], [hx - hr * 1.05, hy - hr * 0.7], [hx - hr * 0.2, hy - hr * 1.2], [hx + hr * 0.75, hy - hr * 0.95], [hx + hr * 0.9, hy - hr * 0.55], [hx + hr * 0.1, hy - hr * 0.6], [hx - hr * 0.45, hy - hr * 0.05], [hx - hr * 0.55, hy + hr * 0.5]], hr * 0.16);
    e4F(x, hair, o.hair, { d: hr * 0.15, lw: 1.2 });
    if (o.beard) e4F(x, tfFurBlob([[hx + hr * 0.2, hy + hr * 0.55], [hx + hr * 1.0, hy + hr * 0.45], [hx + hr * 0.75, hy + hr * 1.05], [hx + hr * 0.3, hy + hr * 0.95]], hr * 0.1), o.hair, { d: 0, lw: 1 });
  }
  // 가까운 팔과 무기
  var th = o.weapon === 'club' ? 0.9 + Math.max(0, s) * 0.9 : o.weapon === 'spear' ? 1.2 : o.weapon === 'staff' ? 0.4 : 0.3 + s * 0.4;
  var hand = e4Arm(x, H * 0.07, shY + H * 0.03, H * 0.24, th, w * 0.9, sk, o.band || null);
  if (o.weapon === 'club') e4Club(x, hand[0], hand[1], -0.2 + th * 0.6, H * 0.36, H * 0.13, TFC.wood);
  else if (o.weapon === 'spear') { e4Line(x, [[hand[0] - H * 0.28, hand[1] + H * 0.08], [hand[0] + H * 0.34, hand[1] - H * 0.1]], H * 0.03, TFC.wood); e4F(x, e4Po([[hand[0] + H * 0.32, hand[1] - H * 0.07], [hand[0] + H * 0.46, hand[1] - H * 0.15], [hand[0] + H * 0.33, hand[1] - H * 0.15]]), TFC.stone, { d: 0, lw: 1 }); }
  else if (o.weapon === 'staff') {
    var top = [hand[0] + H * 0.05, hand[1] - H * 0.42];
    e4Line(x, [[hand[0] - H * 0.02, hand[1] + H * 0.18], top], H * 0.028, TFC.bone);
    e4Ov(x, top[0], top[1] - H * 0.03, H * 0.06, H * 0.055, TFC.bone, 0, { d: H * 0.01, lw: 1 });
    if (!enMode) { x.fillStyle = '#1a1410'; x.beginPath(); x.arc(top[0] + H * 0.015, top[1] - H * 0.035, H * 0.014, 0, Math.PI * 2); x.arc(top[0] - H * 0.02, top[1] - H * 0.035, H * 0.012, 0, Math.PI * 2); x.fill(); }
    tfRune(x, top[0], top[1] - H * 0.03, H * 0.05, p + 0.3);
  }
  x.restore();
}
EN_DRAW.caveman = { f: function (x, H, p) { tfHuman(x, H, p, { skin: TFC.skin, fur: TFC.fur, hair: TFC.hair, weapon: 'club', beard: 1, necklace: 1 }); } };
EN_DRAW.hunter = { f: function (x, H, p) { tfHuman(x, H, p, { skin: '#c48a58', fur: '#6e5638', hair: '#2a2018', weapon: 'spear', hood: '#7d8a5a', crouch: 0.6 }); } };
EN_DRAW.cshaman = { f: function (x, H, p) { tfHuman(x, H, p, { skin: '#c98e5c', fur: '#4e4a6a', hair: '#1e1a22', weapon: 'staff', mask: 1, necklace: 1, crouch: 0.2 }); } };

// ---------- 네발 짐승 ----------
// 몸통과 네 다리, 머리는 콜백. o: col, belly, len(몸 길이), ht(몸 높이), leg, legW, run(뛰는 정도), fur(털 끝 길이)
function tfBeast(x, H, p, o, head) {
  var a = p * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), run = o.run || 0, L = H * o.leg, by = -(L + H * 0.03), len = H * o.len, ht = H * o.ht, col = o.col, dk = enShd(col, 0.28), th = s * (0.5 + run * 0.35);
  EN_ONE = TF_INK;
  x.save(); x.translate(0, -Math.abs(s) * H * (0.015 + run * 0.03)); x.rotate(c * 0.03 * (1 + run));
  if (o.tail) o.tail(x, by, a);
  e4Paw(x, len * 0.36, by, L, th - 0.15, H * o.legW, dk, { paw: o.paw ? enShd(o.paw, 0.2) : dk, bend: o.bend }); e4Paw(x, -len * 0.4, by, L, -th - 0.15, H * o.legW * 1.05, dk, { hind: 1, paw: o.paw ? enShd(o.paw, 0.2) : dk, bend: o.bend });
  var pts = [[-len * 0.56, by - ht * 0.15], [-len * 0.42, by - ht * 0.82], [-len * 0.05, by - ht * (o.hump || 0.95)], [len * 0.35, by - ht * 0.88], [len * 0.52, by - ht * 0.35], [len * 0.4, by + ht * 0.2], [-len * 0.1, by + ht * 0.26], [-len * 0.5, by + ht * 0.15]];
  var body = o.fur ? tfFurBlob(pts, H * o.fur) : e4Bl(pts);
  e4F(x, body, col, { d: ht * 0.12, lw: 1.5 });
  if (o.belly) e4Clip(x, body, function () { x.fillStyle = o.belly; x.beginPath(); x.ellipse(0, by + ht * 0.25, len * 0.45, ht * 0.22, 0, 0, Math.PI * 2); x.fill(); });
  if (o.marks) o.marks(x, body, by, ht, len);
  tfRune(x, -len * 0.12, by - ht * 0.45, H * 0.04, p);
  e4Paw(x, len * 0.4, by + ht * 0.05, L, th + 0.2, H * o.legW * 1.05, col, { paw: o.paw || col, bend: o.bend }); e4Paw(x, -len * 0.38, by + ht * 0.05, L, -th + 0.2, H * o.legW * 1.1, col, { hind: 1, paw: o.paw || col, bend: o.bend });
  head(x, len * 0.5, by - ht * 0.55, a, by, ht, len);
  x.restore();
}
// 검치호: 황갈색 큰 고양이, 등 줄무늬, 위로 긴 송곳니 둘
EN_DRAW.sabertooth = { f: function (x, H, p) {
  var col = '#d8a04a', wh = '#f6e6c4';
  tfBeast(x, H, p, { col: col, belly: wh, len: 0.78, ht: 0.3, leg: 0.24, legW: 0.1, run: 1, paw: wh,
    tail: function (x, by, a) { e4Line(x, [[-H * 0.38, by - H * 0.18], [-H * 0.52, by - H * 0.22 + Math.sin(a) * H * 0.03], [-H * 0.58, by - H * 0.12]], H * 0.06, col); },
    marks: function (x, body, by, ht, len) { e4Stripes(x, body, [[-0.3, -0.85, -0.26, -0.45], [-0.15, -0.95, -0.12, -0.5], [0.0, -0.95, 0.02, -0.5], [0.15, -0.9, 0.15, -0.5]].map(function (q) { return [q[0] * len, by + q[1] * ht, q[2] * len, by + q[3] * ht, H * 0.045]; }), '#7a4a22'); }
  }, function (x, hx, hy, a) {
    var hr = H * 0.17; hx += hr * 0.3;
    [[-0.55, 1], [0.35, 0]].forEach(function (q) { e4Ov(x, hx + q[0] * hr, hy - hr * 0.8, hr * 0.26, hr * 0.24, q[1] ? enShd(col, 0.25) : col, 0, { d: 0, lw: 1 }); });
    var head = e4Bl([[hx - hr * 1.0, hy - hr * 0.1], [hx - hr * 0.6, hy - hr * 0.88], [hx + hr * 0.5, hy - hr * 0.85], [hx + hr * 1.15, hy - hr * 0.1], [hx + hr * 1.0, hy + hr * 0.55], [hx, hy + hr * 0.75], [hx - hr * 0.8, hy + hr * 0.5]]);
    e4F(x, head, col, { d: hr * 0.18, lw: 1.5 });
    e4Clip(x, head, function () { x.fillStyle = wh; x.beginPath(); x.ellipse(hx + hr * 0.5, hy + hr * 0.45, hr * 0.62, hr * 0.38, 0, 0, Math.PI * 2); x.fill(); });
    // 긴 송곳니 둘
    [[0.42, 1], [0.78, 0.85]].forEach(function (q) { e4F(x, e4Po([[hx + q[0] * hr - hr * 0.1, hy + hr * 0.5], [hx + q[0] * hr + hr * 0.02, hy + hr * (0.5 + 0.75 * q[1])], [hx + q[0] * hr + hr * 0.1, hy + hr * 0.5]]), '#fffaf0', { d: 0, lw: 1 }); });
    if (!enMode) {
      e4Eye(x, hx + hr * 0.15, hy - hr * 0.2, hr * 0.22, hr * 0.2, { w: '#fff6a0', ir: '#e0a020', pr: 0.3, px: 0.4 });
      e4Eye(x, hx + hr * 0.7, hy - hr * 0.22, hr * 0.17, hr * 0.19, { w: '#fff6a0', ir: '#e0a020', pr: 0.3, px: 0.3, sd: -1 });
      e4Brush(x, [hx - hr * 0.1, hy - hr * 0.5], [hx + hr * 0.2, hy - hr * 0.62], [hx + hr * 0.45, hy - hr * 0.42], hr * 0.12, hr * 0.04);
      x.fillStyle = '#5a3424'; x.beginPath(); x.moveTo(hx + hr * 0.9, hy + hr * 0.08); x.lineTo(hx + hr * 1.12, hy + hr * 0.08); x.lineTo(hx + hr * 1.02, hy + hr * 0.24); x.closePath(); x.fill();
    }
  });
} };
// 털코뿔소: 회갈색 긴 털, 코 위 큰 뿔과 작은 뿔
EN_DRAW.rhino = { f: function (x, H, p) {
  var col = '#8c7a62', fl = '#6e5c46';
  tfBeast(x, H, p, { col: col, len: 0.84, ht: 0.36, leg: 0.22, legW: 0.12, run: 0.35, fur: 0.03, hump: 1.05, bend: 0.08,
    tail: function (x, by) { e4Line(x, [[-H * 0.42, by - H * 0.2], [-H * 0.5, by - H * 0.08]], H * 0.035, fl); },
    marks: function (x, body, by, ht, len) { e4Stripes(x, body, [[-0.4, -0.7, -0.3, -0.2], [-0.2, -0.85, -0.1, -0.3], [0.05, -0.85, 0.12, -0.35], [0.28, -0.75, 0.32, -0.3]].map(function (q) { return [q[0] * len, by + q[1] * ht, q[2] * len, by + q[3] * ht, H * 0.03]; }), fl); }
  }, function (x, hx, hy) {
    var hr = H * 0.18; hx += hr * 0.5; hy += hr * 0.35;
    var head = tfFurBlob([[hx - hr * 0.9, hy - hr * 0.75], [hx + hr * 0.4, hy - hr * 0.6], [hx + hr * 1.3, hy + hr * 0.0], [hx + hr * 1.25, hy + hr * 0.6], [hx + hr * 0.2, hy + hr * 0.75], [hx - hr * 0.8, hy + hr * 0.4]], hr * 0.08);
    e4F(x, head, enLit(col, 0.06), { d: hr * 0.2, lw: 1.5 });
    tfHorn(x, [hx + hr * 0.85, hy + hr * 0.05], [hx + hr * 1.35, hy - hr * 0.2], [hx + hr * 1.55, hy - hr * 1.35], hr * 0.55, hr * 0.06, '#efe0bc');
    tfHorn(x, [hx + hr * 0.35, hy - hr * 0.45], [hx + hr * 0.55, hy - hr * 0.6], [hx + hr * 0.6, hy - hr * 1.05], hr * 0.32, hr * 0.05, '#e4d4ac');
    e4Ov(x, hx - hr * 0.55, hy - hr * 0.8, hr * 0.17, hr * 0.27, col, -0.4, { d: 0, lw: 1 });
    if (!enMode) { e4Eye(x, hx + hr * 0.12, hy - hr * 0.15, hr * 0.14, hr * 0.13, { w: '#fff0c0', ir: '#4a2a18', pr: 0.5, px: 0.3 }); e4Brush(x, [hx - hr * 0.12, hy - hr * 0.36], [hx + hr * 0.1, hy - hr * 0.45], [hx + hr * 0.32, hy - hr * 0.28], hr * 0.13, hr * 0.04); }
  });
} };
// 매머드: 붉은 갈색 긴 털, 휘어 올라간 상아, 코, 등에 탄 전사(king이면 뼈 왕관과 빛나는 균열)
function tfMammoth(x, H, p, king) {
  var col = king ? '#6e3f2a' : '#8a4e2e', fl = enShd(col, 0.3), ivory = king ? '#ffe9a8' : '#f4e8cc';
  tfBeast(x, H, p, { col: col, len: 0.86, ht: 0.48, leg: 0.27, legW: 0.15, run: 0, fur: 0.045, hump: 1.12, bend: 0.03,
    tail: function (x, by) { e4Line(x, [[-H * 0.44, by - H * 0.3], [-H * 0.5, by - H * 0.12]], H * 0.03, fl); },
    marks: function (x, body, by, ht, len) {
      e4Stripes(x, body, [[-0.42, -0.6, -0.36, 0.1], [-0.25, -0.85, -0.2, 0.1], [-0.05, -0.92, 0.0, 0.1], [0.15, -0.85, 0.2, 0.1], [0.32, -0.7, 0.36, 0.05]].map(function (q) { return [q[0] * len, by + q[1] * ht, q[2] * len, by + q[3] * ht, H * 0.035]; }), fl);
      if (king) { tfRune(x, -len * 0.25, by - ht * 0.5, H * 0.07, p); tfRune(x, len * 0.1, by - ht * 0.62, H * 0.06, p + 0.5); }
    }
  }, function (x, hx, hy, a, by, ht, len) {
    var hr = H * 0.24; hx += hr * 0.05; hy -= hr * 0.35;
    // 등에 탄 전사 (king은 뼈 깃발)
    if (!king) { x.save(); x.translate(-len * 0.08, by - ht * 1.0); tfRider(x, H * 0.42, a); x.restore(); }
    else { e4Line(x, [[-len * 0.15, by - ht * 0.95], [-len * 0.2, by - ht * 1.75]], H * 0.025, TFC.wood); e4F(x, e4Po([[-len * 0.2, by - ht * 1.75], [len * 0.12, by - ht * 1.62 + Math.sin(a) * H * 0.02], [-len * 0.18, by - ht * 1.45]]), '#b8433a', { d: 0, lw: 1 }); tfRune(x, -len * 0.08, by - ht * 1.6, H * 0.035, a / 6.28); }
    var head = tfFurBlob([[hx - hr * 0.9, hy + hr * 0.2], [hx - hr * 0.7, hy - hr * 0.95], [hx + hr * 0.3, hy - hr * 1.15], [hx + hr * 0.95, hy - hr * 0.5], [hx + hr * 0.95, hy + hr * 0.4], [hx + hr * 0.2, hy + hr * 0.8], [hx - hr * 0.6, hy + hr * 0.7]], hr * 0.1);
    e4F(x, head, enLit(col, 0.05), { d: hr * 0.2, lw: 1.5 });
    // 코: 아래로 늘어졌다가 끝이 말림 (걸음에 흔들림)
    var sw = Math.sin(a) * hr * 0.15, k1 = [hx + hr * 0.75, hy + hr * 0.2], k2 = [hx + hr * 1.0 + sw, hy + hr * 1.2], k3 = [hx + hr * 0.8 + sw, hy + hr * 1.9];
    e4Pill(x, k1, k2, hr * 0.42, hr * 0.3, enLit(col, 0.05)); e4Pill(x, k2, k3, hr * 0.3, hr * 0.2, enLit(col, 0.05));
    e4Ov(x, k3[0] + hr * 0.08, k3[1] + hr * 0.02, hr * 0.13, hr * 0.1, enLit(col, 0.05), 0, { d: 0, lw: 1 });
    // 상아: 앞아래로 뻗었다 위로 크게 휨
    tfHorn(x, [hx + hr * 0.5, hy + hr * 0.55], [hx + hr * 1.6, hy + hr * 1.55], [hx + hr * 1.85, hy + hr * 0.25], hr * 0.32, hr * 0.06, enShd(ivory, 0.14));
    tfHorn(x, [hx + hr * 0.6, hy + hr * 0.5], [hx + hr * 1.85, hy + hr * 1.45], [hx + hr * 2.05, hy + hr * 0.05], hr * 0.36, hr * 0.06, ivory);
    e4Ov(x, hx - hr * 0.35, hy - hr * 0.05, hr * 0.3, hr * 0.4, enShd(col, 0.12), -0.3, { d: 0, lw: 1.1 });
    if (!enMode) { e4Eye(x, hx + hr * 0.32, hy - hr * 0.3, hr * 0.13, hr * 0.12, { w: king ? '#c8f8ff' : '#fff0c0', ir: king ? TFC.rune : '#3a2014', pr: 0.5, px: 0.3 }); e4Brush(x, [hx + hr * 0.1, hy - hr * 0.52], [hx + hr * 0.32, hy - hr * 0.6], [hx + hr * 0.55, hy - hr * 0.45], hr * 0.12, hr * 0.04); }
    if (king) {   // 뼈 왕관
      [[-0.45, -1.05, -0.4], [-0.1, -1.25, -0.1], [0.25, -1.2, 0.25], [0.55, -0.95, 0.5]].forEach(function (q) { e4F(x, e4Po([[hx + q[0] * hr - hr * 0.12, hy - hr * 0.8], [hx + q[0] * hr + Math.sin(q[2]) * hr * 0.2, hy + q[1] * hr - hr * 0.3], [hx + q[0] * hr + hr * 0.12, hy - hr * 0.82]]), TFC.bone, { d: 0, lw: 1 }); });
    }
  });
}
// 매머드 등에 탄 작은 전사(상반신만): H는 이 전사의 키
function tfRider(x, H, a) {
  var hr = H * 0.17, hy = -H * 0.62, sk = TFC.skin;
  e4F(x, tfFurBlob([[-H * 0.12, -H * 0.05], [-H * 0.1, -H * 0.38], [H * 0.12, -H * 0.4], [H * 0.14, -H * 0.05]], H * 0.03), TFC.fur, { d: H * 0.04, lw: 1.2 });
  e4F(x, e4Bl([[-hr, hy], [-hr * 0.6, hy - hr * 0.9], [hr * 0.6, hy - hr * 0.9], [hr, hy], [hr * 0.6, hy + hr * 0.85], [-hr * 0.6, hy + hr * 0.85]]), sk, { d: hr * 0.2, lw: 1.2 });
  e4F(x, tfFurBlob([[-hr * 1.05, hy + hr * 0.3], [-hr * 0.9, hy - hr * 0.8], [hr * 0.6, hy - hr * 1.05], [hr * 0.95, hy - hr * 0.4], [-hr * 0.2, hy - hr * 0.4]], hr * 0.15), TFC.hair, { d: 0, lw: 1.1 });
  if (!enMode) { e4Eye(x, hr * 0.3, hy - hr * 0.05, hr * 0.17, hr * 0.17, { w: '#fffbe8', ir: '#7a4a22', pr: 0.42, px: 0.3 }); }
  var hand = e4Arm(x, H * 0.08, -H * 0.36, H * 0.22, 1.6 + Math.sin(a) * 0.4, H * 0.07, sk, null);
  e4Line(x, [[hand[0] - H * 0.05, hand[1] + H * 0.05], [hand[0] + H * 0.12, hand[1] - H * 0.35]], H * 0.025, TFC.wood);
  e4F(x, e4Po([[hand[0] + H * 0.1, hand[1] - H * 0.33], [hand[0] + H * 0.15, hand[1] - H * 0.48], [hand[0] + H * 0.16, hand[1] - H * 0.32]]), TFC.stone, { d: 0, lw: 0.9 });
}
EN_DRAW.mammoth = { f: function (x, H, p) { tfMammoth(x, H, p, 0); } };
EN_DRAW.mammothKing = { n: 6, f: function (x, H, p) { tfMammoth(x, H, p, 1); } };

// ---------- 익룡 (하늘) ----------
EN_DRAW.ptero = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, f = Math.sin(a), col = '#a86a4a', mem = '#c98a62', dk = enShd(col, 0.3), cy = -H * 0.55 + f * H * 0.04;
  EN_ONE = TF_INK;
  function wing(sd, far) {
    var up = f * 0.6, sx = H * 0.02, sy = cy - H * 0.04, k = far ? 0.8 : 1, ex = sx - H * 0.05, ey = sy - H * (0.3 + up * 0.25) * k, tx = sx - H * 0.62 * k, ty = sy - H * (0.2 + up * 0.5) * k;
    var w = e4Po([[sx + H * 0.06, sy], [ex, ey], [tx, ty], [sx - H * 0.4 * k, sy - H * 0.02 - up * H * 0.08], [sx - H * 0.3, sy + H * 0.06], [sx - H * 0.18, sy + H * 0.04], [sx - H * 0.05, sy + H * 0.08]]);
    e4F(x, w, far ? enShd(mem, 0.2) : mem, { d: H * 0.03, lw: 1.2 });
    e4Line(x, [[sx + H * 0.04, sy], [ex, ey], [tx, ty]], H * 0.025, far ? enShd(col, 0.3) : col);
  }
  wing(1, 1);
  // 몸과 꼬리
  e4Ov(x, -H * 0.04, cy + H * 0.02, H * 0.16, H * 0.085, col, -0.1, { d: H * 0.02, lw: 1.3 });
  e4Line(x, [[-H * 0.18, cy + H * 0.03], [-H * 0.32, cy + H * 0.06]], H * 0.025, col);
  e4Paw(x, -H * 0.06, cy + H * 0.06, H * 0.1, 0.4, H * 0.035, dk, {});
  tfRune(x, -H * 0.06, cy + H * 0.02, H * 0.03, p);
  // 머리: 긴 부리 + 뒤로 뻗은 볏
  var hx = H * 0.14, hy = cy - H * 0.06;
  e4F(x, e4Po([[hx - H * 0.02, hy - H * 0.02], [hx - H * 0.24, hy - H * 0.14], [hx - H * 0.04, hy - H * 0.07]]), '#d9463c', { d: 0, lw: 1 });
  e4Ov(x, hx, hy, H * 0.07, H * 0.06, col, 0, { d: H * 0.015, lw: 1.2 });
  e4F(x, e4Po([[hx + H * 0.04, hy - H * 0.03], [hx + H * 0.3, hy + H * 0.02], [hx + H * 0.04, hy + H * 0.04]]), '#e8d4a0', { d: 0, lw: 1.1 });
  if (!enMode) e4Eye(x, hx + H * 0.015, hy - H * 0.01, H * 0.024, H * 0.022, { w: '#fff6a0', ir: '#e0a020', pr: 0.5, px: 0.3 });
  wing(1, 0);
} };

// ---------- 통나무 뗏목 (바다) ----------
EN_DRAW.raft = { f: function (x, H, p) {
  var a = p * Math.PI * 2, rk = Math.sin(a) * 0.04, wy = -H * 0.12;
  EN_ONE = TF_INK;
  e4Ripple(x, 0, wy + H * 0.06, H * 0.55, H * 0.12, 0.8, a);
  x.save(); x.translate(0, wy + Math.sin(a) * H * 0.015); x.rotate(rk);
  for (var i = 0; i < 4; i++) { var yy = -H * 0.02 - i * H * 0.045; e4Pill(x, [-H * 0.42 + i * H * 0.02, yy], [H * 0.42 - i * H * 0.02, yy - H * 0.01], H * 0.07, H * 0.065, i % 2 ? '#9b6b3e' : '#8a5c32'); }
  e4Line(x, [[-H * 0.28, -H * 0.2], [-H * 0.26, H * 0.02]], H * 0.02, '#c9a86a'); e4Line(x, [[H * 0.26, -H * 0.2], [H * 0.28, H * 0.02]], H * 0.02, '#c9a86a');
  // 노 젓는 전사 둘
  x.save(); x.translate(-H * 0.24, -H * 0.17); tfRider(x, H * 0.44, a); x.restore();
  x.save(); x.translate(H * 0.22, -H * 0.17); tfRider(x, H * 0.42, a + 1.5); x.restore();
  // 돛 대신 가죽 깃발
  e4Line(x, [[H * 0.02, -H * 0.18], [H * 0.0, -H * 0.72]], H * 0.025, TFC.wood);
  e4F(x, e4Po([[H * 0.0, -H * 0.74], [-H * 0.3, -H * 0.64 + Math.sin(a) * H * 0.03], [H * 0.0, -H * 0.52]]), '#c9a06a', { d: H * 0.02, lw: 1 });
  tfRune(x, -H * 0.1, -H * 0.63, H * 0.035, p);
  x.restore();
} };
