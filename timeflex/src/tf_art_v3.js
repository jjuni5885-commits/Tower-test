// ===== tf_art_v3.js : 타임플렉스 v1.3 코드 그림 적 (앞, 뒤, 옆 세 방향 + 관절 걸음) =====
// 사용자 결정(11-14 22:43): 제미나이 원화 대신 탑, 맵과 같은 화풍의 코드 그림. "분위기에 맞도록 정말 최선을 다해서"
// 화풍: 탑과 같은 굵은 먹갈색 외곽선(TFI), 2~3단 명암(enJF), 3등신 남짓, 시간 균열 푸른 금(tfRune)을 가슴에 하나
// 움직임: 사람은 엉덩이, 무릎, 어깨, 팔꿈치 관절로 걷고(디딘 발이 땅에 붙도록 몸 높이를 다리 길이로 계산),
//   앞 모습은 무릎을 들어 올리며 다가오고, 뒤 모습은 등과 망토가 보이며 멀어짐. 네발 짐승은 대각선 걸음(트롯)
// 연결: art_enemy.js enemyFrames → x3Frames(k, S, E). X3[적 키] 또는 X3A[그림 키]에 설정이 있으면 이 그림, 없으면 옛 그림
var X3_NF = 8;
var X3 = {}, X3A = {};
function x3c(c, k) { return k > 0 ? enLit(c, k) : enShd(c, -k); }
function x3L(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function x3Rot(p, o, an) { var c = Math.cos(an), s = Math.sin(an), dx = p[0] - o[0], dy = p[1] - o[1]; return [o[0] + dx * c - dy * s, o[1] + dx * s + dy * c]; }

// ---------- 무기 (손 위치 h, 방향 an: 0이면 위로 곧게, + 는 앞으로 기울기) ----------
function x3Weapon(x, U, h, an, w, side) {
  if (!w) return;
  var t = w.t, c = w.c || '#8a5a32', m = w.m || '#c9ccd2', L = U * (w.L || 1), d = [Math.sin(an), -Math.cos(an)];
  function P(u, v) { return [h[0] + d[0] * u + -d[1] * v, h[1] + d[1] * u + d[0] * v]; }
  if (t === 'club') {
    e4Pill(x, P(-U * 0.04, 0), P(U * 0.2, 0), U * 0.035, U * 0.06, c);
    e4Ov(x, P(U * 0.25, 0)[0], P(U * 0.25, 0)[1], U * 0.07, U * 0.055, c, an - Math.PI / 2, { d: U * 0.02 });
    if (!enMode) [[0.2, 0.05], [0.27, -0.05], [0.31, 0.03]].forEach(function (q) { var p = P(U * q[0], U * q[1]); e4Dot(x, p[0], p[1], U * 0.012, '#e8e0cc'); });
  } else if (t === 'spear' || t === 'pike' || t === 'trident' || t === 'halberd') {
    var top = P(L * 0.42, 0), bot = P(-L * 0.2, 0);
    e4Line(x, [bot, top], Math.max(1.2, U * 0.022), c);
    if (t === 'trident') { [-1, 0, 1].forEach(function (k) { e4F(x, e4Po([P(L * 0.42, U * 0.035 * k - U * 0.01), P(L * 0.52, U * 0.035 * k), P(L * 0.42, U * 0.035 * k + U * 0.01)]), m, { d: 0, lw: 0.9 }); }); e4Line(x, [P(L * 0.42, -U * 0.04), P(L * 0.42, U * 0.04)], U * 0.016, m); }
    else e4F(x, e4Po([P(L * 0.4, -U * 0.03), P(L * 0.52, 0), P(L * 0.4, U * 0.03), P(L * 0.38, 0)]), m, { d: 0, lw: 0.9 });
    if (t === 'halberd') e4F(x, e4Bl([P(L * 0.34, 0), P(L * 0.3, U * 0.08), P(L * 0.4, U * 0.09), P(L * 0.4, 0)]), m, { d: 0, lw: 0.9 });
    if (w.flag) e4F(x, e4Po([P(L * 0.36, 0), P(L * 0.3, -U * 0.09), P(L * 0.24, 0)]), w.flag, { d: 0, lw: 0.8 });
  } else if (t === 'sword' || t === 'gladius' || t === 'cutlass' || t === 'katana') {
    var bl = t === 'gladius' ? 0.2 : t === 'katana' ? 0.34 : 0.28, cv = t === 'cutlass' ? U * 0.03 : t === 'katana' ? U * 0.012 : 0;
    e4F(x, e4Bl([P(U * 0.03, -U * 0.022), P(U * bl * 0.6, -U * 0.024 - cv), P(U * bl, -cv * 1.4), P(U * bl * 0.6, U * 0.02 - cv * 0.6), P(U * 0.03, U * 0.022)]), m, { d: 0, lw: 0.9, hi: 0.5 });
    e4Pill(x, P(0, -U * 0.04), P(0, U * 0.04), U * 0.02, U * 0.02, w.g || '#d7a640');
    e4Pill(x, P(-U * 0.05, 0), P(0, 0), U * 0.025, U * 0.025, c);
  } else if (t === 'axe') {
    e4Pill(x, P(-U * 0.06, 0), P(U * 0.26, 0), U * 0.026, U * 0.026, c);
    e4F(x, e4Bl([P(U * 0.17, 0), P(U * 0.14, U * 0.1), P(U * 0.27, U * 0.12), P(U * 0.27, 0)]), m, { d: 0, lw: 0.9 });
  } else if (t === 'khopesh') {
    e4Pill(x, P(-U * 0.04, 0), P(U * 0.08, 0), U * 0.025, U * 0.025, c);
    e4F(x, e4Bl([P(U * 0.06, -U * 0.015), P(U * 0.2, -U * 0.03), P(U * 0.28, U * 0.05), P(U * 0.24, U * 0.08), P(U * 0.2, U * 0.02), P(U * 0.07, U * 0.015)]), m, { d: 0, lw: 0.9, hi: 0.5 });
  } else if (t === 'staff') {
    e4Line(x, [P(-L * 0.25, 0), P(L * 0.36, 0)], Math.max(1.2, U * 0.024), c);
    var tp = P(L * 0.4, 0);
    if (w.top === 'skull') { e4Ov(x, tp[0], tp[1], U * 0.045, U * 0.04, '#efe6cf', 0, { d: U * 0.01 }); if (!enMode) { e4Dot(x, tp[0] - U * 0.015, tp[1], U * 0.01, TFI); e4Dot(x, tp[0] + U * 0.015, tp[1], U * 0.01, TFI); } }
    else if (w.top === 'ankh') { e4Line(x, [P(L * 0.36, -U * 0.04), P(L * 0.36, U * 0.04)], U * 0.018, m); if (!enMode) { x.strokeStyle = m; x.lineWidth = U * 0.018; x.beginPath(); x.ellipse(tp[0] + d[0] * U * 0.02, tp[1] + d[1] * U * 0.02, U * 0.025, U * 0.03, an, 0, 7); x.stroke(); } else e4Ov(x, tp[0], tp[1], U * 0.03, U * 0.035, m, an, { d: 0 }); }
    else { e4Ov(x, tp[0], tp[1], U * 0.04, U * 0.04, w.orb || '#7fe6ff', 0, { d: 0, hi: 0.7 }); if (!enMode) { x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, tp[0], tp[1], U * 0.11, w.orb || '#7fe6ff', 0.45); x.restore(); } }
    if (w.feather && !enMode) e4F(x, e4Bl([P(L * 0.3, U * 0.02), P(L * 0.24, U * 0.07), P(L * 0.16, U * 0.06)]), w.feather, { d: 0, lw: 0.8 });
  } else if (t === 'torch') {
    e4Pill(x, P(-U * 0.04, 0), P(U * 0.16, 0), U * 0.026, U * 0.032, c);
    if (!enMode) { var fp = P(U * 0.22, 0); x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, fp[0], fp[1], U * 0.12, '#ffb040', 0.5); x.restore(); e4F(x, e4Bl([P(U * 0.17, -U * 0.04), P(U * 0.3, 0), P(U * 0.17, U * 0.04)]), '#ffb43c', { d: 0, lw: 0.6, hi: 0.6 }); }
  } else if (t === 'bow') {
    var b0 = P(-U * 0.16, 0), b1 = P(U * 0.16, 0), bc = P(0, U * 0.1);
    e4Line(x, [b0, bc, b1], Math.max(1.2, U * 0.022), c);
    if (!enMode) { x.strokeStyle = '#efe6cf'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(b0[0], b0[1]); x.lineTo(b1[0], b1[1]); x.stroke(); }
  } else if (t === 'rifle' || t === 'smg' || t === 'blaster' || t === 'musket') {
    var gl = t === 'smg' ? 0.2 : t === 'musket' ? 0.4 : 0.32;
    e4F(x, e4Po([P(-U * 0.06, -U * 0.025), P(U * gl * 0.55, -U * 0.02), P(U * gl * 0.55, U * 0.022), P(U * 0.04, U * 0.03), P(-U * 0.02, U * 0.07), P(-U * 0.08, U * 0.05)]), c, { d: 0, lw: 0.9 });
    e4Line(x, [P(U * gl * 0.5, -U * 0.005), P(U * gl, -U * 0.005)], U * 0.022, w.m || '#3a3f45');
    if (t === 'blaster' && !enMode) { var mz = P(U * gl, 0); x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, mz[0], mz[1], U * 0.06, '#7dff9a', 0.6); x.restore(); }
  } else if (t === 'dagger') {
    e4F(x, e4Po([P(U * 0.02, -U * 0.016), P(U * 0.12, 0), P(U * 0.02, U * 0.016)]), m, { d: 0, lw: 0.8 });
    e4Pill(x, P(-U * 0.03, 0), P(U * 0.02, 0), U * 0.02, U * 0.02, c);
  } else if (t === 'net') {
    if (!enMode) { x.strokeStyle = '#d8c79a'; x.lineWidth = 0.8; for (var i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(h[0] + i * U * 0.02, h[1]); x.lineTo(h[0] + i * U * 0.035, h[1] + U * 0.12); x.stroke(); } }
  } else if (t === 'drum') {
    e4Ov(x, h[0], h[1] + U * 0.02, U * 0.09, U * 0.06, w.c || '#b8432f', 0, { d: U * 0.02 });
  }
}
function x3Shield(x, U, cx, cy, sh, view, flip) {
  if (!sh) return;
  var c = sh.c || '#9a5a2a', c2 = sh.c2 || '#d7a640', t = sh.t, k = view === 's' ? 0.55 : 1;
  if (t === 'scutum') {
    e4F(x, e4Bl([[cx - U * 0.1 * k, cy - U * 0.16], [cx + U * 0.1 * k, cy - U * 0.16], [cx + U * 0.11 * k, cy + U * 0.14], [cx - U * 0.11 * k, cy + U * 0.14]]), c, { d: U * 0.025 });
    if (!enMode) { e4Ov(x, cx, cy, U * 0.035 * k, U * 0.035, c2, 0, { d: 0, lw: 0.8 }); x.strokeStyle = c2; x.lineWidth = U * 0.012; x.beginPath(); x.moveTo(cx - U * 0.07 * k, cy - U * 0.11); x.lineTo(cx + U * 0.07 * k, cy + U * 0.1); x.moveTo(cx + U * 0.07 * k, cy - U * 0.11); x.lineTo(cx - U * 0.07 * k, cy + U * 0.1); x.stroke(); }
  } else if (t === 'kite') {
    e4F(x, e4Bl([[cx - U * 0.09 * k, cy - U * 0.13], [cx + U * 0.09 * k, cy - U * 0.13], [cx + U * 0.08 * k, cy + U * 0.02], [cx, cy + U * 0.17], [cx - U * 0.08 * k, cy + U * 0.02]]), c, { d: U * 0.02 });
    if (!enMode) e4F(x, e4Po([[cx - U * 0.015 * k, cy - U * 0.12], [cx + U * 0.015 * k, cy - U * 0.12], [cx + U * 0.015 * k, cy + U * 0.13], [cx - U * 0.015 * k, cy + U * 0.13]]), c2, { d: 0, lw: 0 });
  } else {
    var r = U * (t === 'buckler' ? 0.075 : 0.12);
    e4Ov(x, cx, cy, r * k, r, c, 0, { d: r * 0.25 });
    if (!enMode) { x.strokeStyle = c2; x.lineWidth = Math.max(1, r * 0.14); x.beginPath(); x.ellipse(cx, cy, r * k * 0.78, r * 0.78, 0, 0, 7); x.stroke(); e4Ov(x, cx, cy, r * 0.25 * k, r * 0.25, c2, 0, { d: 0, lw: 0.7 }); }
  }
}

// ---------- 머리 (중심 hc, 반지름 r, view f/b/s) ----------
function x3Head(x, U, hc, r, view, o, p) {
  var sk = o.skin || '#d9a273', hx = hc[0], hy = hc[1], side = view === 's', back = view === 'b', hat = o.hat || {}, hair = o.hair || {}, fc = o.face || {};
  // 뒤 머리카락(긴 머리, 갈기)
  if (hair.s === 'long' || hair.s === 'mane' || hair.s === 'braid') {
    var hl = hair.s === 'mane' ? 1.25 : 1.05;
    e4F(x, e4Bl(side ? [[hx - r * 0.2, hy - r * 0.9], [hx - r * 1.15, hy - r * 0.2], [hx - r * 1.0 * hl, hy + r * 1.1 * hl], [hx - r * 0.2, hy + r * 0.8]] : [[hx - r * 1.05, hy - r * 0.4], [hx + r * 1.05, hy - r * 0.4], [hx + r * 1.0 * hl, hy + r * 1.05 * hl], [hx - r * 1.0 * hl, hy + r * 1.05 * hl]]), hair.c || '#3a2a1e', { d: r * 0.2 });
  }
  // 얼굴형
  var fs = side ? e4Bl([[hx - r * 0.9, hy - r * 0.2], [hx - r * 0.55, hy - r * 0.95], [hx + r * 0.45, hy - r * 0.95], [hx + r * 0.95, hy - r * 0.2], [hx + r * 1.08, hy + r * 0.25], [hx + r * 0.9, hy + r * 0.75], [hx + r * 0.2, hy + r * 1.0], [hx - r * 0.7, hy + r * 0.7]])
    : e4Bl([[hx - r * 0.95, hy - r * 0.1], [hx - r * 0.7, hy - r * 0.92], [hx + r * 0.7, hy - r * 0.92], [hx + r * 0.95, hy - r * 0.1], [hx + r * 0.78, hy + r * 0.72], [hx, hy + r * (o.jaw || 1.02)], [hx - r * 0.78, hy + r * 0.72]]);
  var skin = fc.t === 'wrap' ? '#d9ccaa' : fc.t === 'skull' ? '#ece2c8' : sk;
  e4F(x, fs, skin, { d: r * 0.22, gx: side ? 0.6 : 0.4 });
  // 귀
  if (!hat.full && fc.t !== 'wrap' && fc.t !== 'skull') {
    if (side) e4Ov(x, hx - r * 0.25, hy + r * 0.05, r * 0.2, r * 0.26, sk, 0, { d: r * 0.06 });
    else { e4Ov(x, hx - r * 0.98, hy + r * 0.05, r * 0.16, r * 0.24, sk, 0, { d: r * 0.05 }); e4Ov(x, hx + r * 0.98, hy + r * 0.05, r * 0.16, r * 0.24, sk, 0, { d: r * 0.05 }); }
  }
  // 얼굴
  if (!back && !enMode) {
    var ew = fc.glow || null, eyeC = { w: fc.ew || '#fffbea', ir: fc.ir || null, pr: 0.55, px: side ? 0.35 : 0, py: 0.05 };
    var ex = side ? [hx + r * 0.55] : [hx - r * 0.38, hx + r * 0.38], ey = hy - r * 0.05;
    if (fc.t === 'wrap') {
      x.save(); x.clip(fs.p); x.strokeStyle = '#b8a77e'; x.lineWidth = Math.max(0.8, r * 0.1);
      for (var i = -3; i <= 4; i++) { x.beginPath(); x.moveTo(hx - r * 1.2, hy + i * r * 0.28); x.lineTo(hx + r * 1.2, hy + i * r * 0.28 - r * 0.2); x.stroke(); } x.restore();
      ex.forEach(function (q) { e4Dot(x, q, ey, r * 0.15, '#ffd84a'); x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, q, ey, r * 0.45, '#ffcf40', 0.5); x.restore(); });
    } else if (fc.t === 'skull') {
      ex.forEach(function (q) { e4Dot(x, q, ey, r * 0.22, TFI); e4Dot(x, q, ey, r * 0.08, '#7fe6ff'); });
      x.fillStyle = TFI; for (var j = -2; j <= 2; j++) x.fillRect(hx + (side ? r * 0.55 : 0) + j * r * 0.16 - r * 0.05, hy + r * 0.55, r * 0.1, r * 0.18);
    } else {
      ex.forEach(function (q) { e4Eye(x, q, ey, r * 0.2, r * 0.22, eyeC); if (ew) { x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, q, ey, r * 0.4, ew, 0.4); x.restore(); } });
      // 성난 눈썹
      x.strokeStyle = fc.brow || TFI; x.lineWidth = Math.max(1, r * 0.13); x.lineCap = 'round';
      ex.forEach(function (q, n) { var dir = side ? 1 : (n ? 1 : -1); x.beginPath(); x.moveTo(q - dir * r * 0.24, ey - r * 0.36); x.lineTo(q + dir * r * 0.14, ey - r * 0.24); x.stroke(); });
      // 코, 입
      if (side) { e4Ov(x, hx + r * 1.05, hy + r * 0.2, r * 0.14, r * 0.12, x3c(skin, -0.12), 0, { d: 0, lw: 0.6 }); }
      x.strokeStyle = TFI; x.lineWidth = Math.max(0.8, r * 0.09);
      var mx = side ? hx + r * 0.7 : hx, my = hy + r * 0.5;
      if (fc.mouth === 'teeth') { x.fillStyle = '#fffbea'; x.beginPath(); x.ellipse(mx, my, r * 0.24, r * 0.1, 0, 0, 7); x.fill(); x.stroke(); }
      else { x.beginPath(); x.moveTo(mx - r * 0.2, my + r * 0.04); x.quadraticCurveTo(mx, my - r * 0.06, mx + r * 0.2, my + r * 0.04); x.stroke(); }
      if (fc.tusk) { e4F(x, e4Po([[mx - r * 0.2, my], [mx - r * 0.16, my - r * 0.28], [mx - r * 0.1, my]]), '#fffbea', { d: 0, lw: 0.6 }); if (!side) e4F(x, e4Po([[mx + r * 0.1, my], [mx + r * 0.16, my - r * 0.28], [mx + r * 0.2, my]]), '#fffbea', { d: 0, lw: 0.6 }); }
      if (fc.paint) { x.fillStyle = fc.paint; ex.forEach(function (q) { x.fillRect(q - r * 0.22, ey + r * 0.25, r * 0.44, r * 0.1); }); }
    }
  }
  // 수염
  if (o.beard && !back) e4F(x, e4Bl(side ? [[hx + r * 0.2, hy + r * 0.45], [hx + r * 0.95, hy + r * 0.5], [hx + r * 0.7, hy + r * 1.35], [hx + r * 0.1, hy + r * 1.0]] : [[hx - r * 0.7, hy + r * 0.45], [hx + r * 0.7, hy + r * 0.45], [hx + r * 0.45, hy + r * 1.3], [hx, hy + r * 1.5], [hx - r * 0.45, hy + r * 1.3]]), o.beard, { d: r * 0.12 });
  // 앞머리, 머리 위
  if (!hat.t && hair.s && hair.s !== 'bald') {
    var hc2 = hair.c || '#3a2a1e', sp = hair.s === 'shag' || hair.s === 'mane';
    var top = side ? [[hx - r * 0.95, hy + r * 0.2], [hx - r * 1.05, hy - r * 0.6], [hx - r * 0.4, hy - r * 1.15], [hx + r * 0.5, hy - r * 1.1], [hx + r * 0.9, hy - r * 0.45], [hx + r * 0.3, hy - r * 0.5], [hx - r * 0.3, hy - r * 0.2]]
      : back ? [[hx - r * 1.0, hy + r * 0.5], [hx - r * 1.0, hy - r * 0.6], [hx, hy - r * 1.15], [hx + r * 1.0, hy - r * 0.6], [hx + r * 1.0, hy + r * 0.5]]
      : [[hx - r * 1.0, hy + r * 0.1], [hx - r * 0.95, hy - r * 0.7], [hx, hy - r * 1.18], [hx + r * 0.95, hy - r * 0.7], [hx + r * 1.0, hy + r * 0.1], [hx + r * 0.6, hy - r * 0.45], [hx, hy - r * 0.35], [hx - r * 0.6, hy - r * 0.45]];
    if (sp) top = top.map(function (q, i) { return [q[0] + (i % 2 ? r * 0.12 : -r * 0.06), q[1] + (i % 2 ? -r * 0.1 : 0)]; });
    e4F(x, sp ? e4Po(top) : e4Bl(top), hc2, { d: r * 0.18 });
    if (hair.s === 'top') e4Ov(x, hx - (side ? r * 0.3 : 0), hy - r * 1.15, r * 0.3, r * 0.26, hc2, 0, { d: r * 0.08 });
  }
  if (hat.t) x3Hat(x, U, hc, r, view, hat, p);
  if (o.feather && !hat.t) { [-1, 0, 1].forEach(function (k) { if (side && k) return; e4F(x, e4Bl([[hx + k * r * 0.35, hy - r * 0.85], [hx + k * r * 0.5 - r * 0.1, hy - r * 1.7], [hx + k * r * 0.5 + r * 0.12, hy - r * 1.65]]), k ? o.feather : '#f0e2b6', { d: 0, lw: 0.8 }); }); e4Line(x, side ? [[hx - r * 0.95, hy - r * 0.55], [hx + r * 0.9, hy - r * 0.55]] : [[hx - r * 0.98, hy - r * 0.5], [hx + r * 0.98, hy - r * 0.5]], r * 0.22, o.band || '#b8432f'); }
}
function x3Hat(x, U, hc, r, view, h, p) {
  var hx = hc[0], hy = hc[1], side = view === 's', c = h.c || '#9aa3ad', c2 = h.c2 || '#d7a640', t = h.t;
  function dome(rr, low) { e4F(x, e4Bl(side ? [[hx - r * 1.08 * rr, hy + r * low], [hx - r * 1.0 * rr, hy - r * 0.7], [hx, hy - r * 1.18 * rr], [hx + r * 0.9 * rr, hy - r * 0.65], [hx + r * 1.05 * rr, hy - r * 0.15], [hx + r * 0.3, hy - r * 0.3]] : [[hx - r * 1.08 * rr, hy + r * low], [hx - r * 1.0 * rr, hy - r * 0.7], [hx, hy - r * 1.2 * rr], [hx + r * 1.0 * rr, hy - r * 0.7], [hx + r * 1.08 * rr, hy + r * low], [hx, hy - r * 0.3]]), c, { d: r * 0.25, hi: 0.45 }); }
  if (t === 'nemes') {
    var lap = side ? [[hx - r * 1.15, hy + r * 1.3], [hx - r * 1.05, hy - r * 0.6], [hx, hy - r * 1.15], [hx + r * 0.75, hy - r * 0.7], [hx + r * 0.5, hy - r * 0.2], [hx - r * 0.3, hy + r * 0.3], [hx - r * 0.5, hy + r * 1.3]] : [[hx - r * 1.5, hy + r * 1.4], [hx - r * 1.15, hy - r * 0.55], [hx, hy - r * 1.18], [hx + r * 1.15, hy - r * 0.55], [hx + r * 1.5, hy + r * 1.4], [hx + r * 0.85, hy + r * 1.3], [hx + r * 0.8, hy - r * 0.35], [hx, hy - r * 0.55], [hx - r * 0.8, hy - r * 0.35], [hx - r * 0.85, hy + r * 1.3]];
    if (view === 'b') lap = [[hx - r * 1.5, hy + r * 1.4], [hx - r * 1.15, hy - r * 0.55], [hx, hy - r * 1.18], [hx + r * 1.15, hy - r * 0.55], [hx + r * 1.5, hy + r * 1.4], [hx, hy + r * 1.7]];
    var s = e4F(x, e4Bl(lap), c, { d: r * 0.2 });
    if (!enMode) { x.save(); x.clip(s.p); x.strokeStyle = c2; x.lineWidth = r * 0.16; for (var i = -6; i < 8; i++) { x.beginPath(); x.moveTo(hx - r * 2, hy + i * r * 0.32); x.lineTo(hx + r * 2, hy + i * r * 0.32); x.stroke(); } x.restore(); x.lineWidth = enLW; x.strokeStyle = TFI; x.stroke(s.p); }
    if (view === 'f' && h.cobra) e4F(x, e4Bl([[hx - r * 0.12, hy - r * 0.75], [hx, hy - r * 1.05], [hx + r * 0.12, hy - r * 0.75]]), '#e8b83a', { d: 0, lw: 0.7 });
  } else if (t === 'galea' || t === 'crest') {
    dome(1.02, -0.05);
    if (side) e4F(x, e4Bl([[hx - r * 0.9, hy - r * 0.75], [hx - r * 0.3, hy - r * 1.6], [hx + r * 0.5, hy - r * 1.55], [hx + r * 0.85, hy - r * 0.95], [hx, hy - r * 1.1]]), h.crest || '#c8352a', { d: r * 0.1 });
    else e4F(x, e4Bl([[hx - r * 0.22, hy - r * 0.95], [hx - r * 0.18, hy - r * 1.65], [hx + r * 0.18, hy - r * 1.65], [hx + r * 0.22, hy - r * 0.95]]), h.crest || '#c8352a', { d: r * 0.05 });
    if (!side) { e4F(x, e4Po([[hx - r * 1.05, hy - r * 0.15], [hx - r * 0.75, hy - r * 0.15], [hx - r * 0.7, hy + r * 0.7], [hx - r * 1.0, hy + r * 0.6]]), c, { d: 0, lw: 0.8 }); e4F(x, e4Po([[hx + r * 1.05, hy - r * 0.15], [hx + r * 0.75, hy - r * 0.15], [hx + r * 0.7, hy + r * 0.7], [hx + r * 1.0, hy + r * 0.6]]), c, { d: 0, lw: 0.8 }); }
  } else if (t === 'horn') {
    dome(1.05, -0.1);
    [-1, 1].forEach(function (k) { if (side && k < 0) return; var bx = side ? hx - r * 0.1 : hx + k * r * 0.85; tfHorn(x, [bx, hy - r * 0.55], [bx + (side ? -r * 0.3 : k * r * 0.7), hy - r * 0.95], [bx + (side ? -r * 0.1 : k * r * 0.55), hy - r * 1.7], r * 0.26, r * 0.04, '#efe2c2'); });
    if (!enMode && !side) e4Line(x, [[hx, hy - r * 0.95], [hx, hy - r * 0.2]], r * 0.16, c2);
  } else if (t === 'kettle') {
    dome(0.95, -0.25);
    e4F(x, enEl(hx, hy - r * 0.32, r * 1.45, r * (side ? 0.22 : 0.3), 0), c, { d: r * 0.08 });
  } else if (t === 'conical') {
    e4F(x, e4Bl([[hx - r * 1.12, hy - r * 0.25], [hx, hy - r * 1.55], [hx + r * 1.12, hy - r * 0.25], [hx, hy - r * 0.45]]), c, { d: r * 0.2, hi: 0.45 });
    if (h.tassel) e4Ov(x, hx, hy - r * 1.55, r * 0.16, r * 0.16, h.tassel, 0, { d: 0, lw: 0.7 });
  } else if (t === 'hood') {
    e4F(x, e4Bl(side ? [[hx - r * 1.2, hy + r * 0.9], [hx - r * 1.15, hy - r * 0.6], [hx, hy - r * 1.25], [hx + r * 0.85, hy - r * 0.8], [hx + r * 0.95, hy - r * 0.1], [hx + r * 0.3, hy - r * 0.4], [hx - r * 0.3, hy + r * 0.9]] : view === 'b' ? [[hx - r * 1.15, hy + r * 1.0], [hx - r * 1.12, hy - r * 0.6], [hx, hy - r * 1.3], [hx + r * 1.12, hy - r * 0.6], [hx + r * 1.15, hy + r * 1.0]] : [[hx - r * 1.2, hy + r * 1.0], [hx - r * 1.15, hy - r * 0.6], [hx, hy - r * 1.3], [hx + r * 1.15, hy - r * 0.6], [hx + r * 1.2, hy + r * 1.0], [hx + r * 0.85, hy + r * 0.9], [hx + r * 0.85, hy - r * 0.35], [hx, hy - r * 0.75], [hx - r * 0.85, hy - r * 0.35], [hx - r * 0.85, hy + r * 0.9]]), c, { d: r * 0.25 });
  } else if (t === 'turban' || t === 'bandana') {
    e4F(x, e4Bl(side ? [[hx - r * 1.05, hy - r * 0.15], [hx - r * 0.95, hy - r * 0.85], [hx, hy - r * (t === 'turban' ? 1.4 : 1.15)], [hx + r * 0.9, hy - r * 0.8], [hx + r * 0.95, hy - r * 0.3], [hx, hy - r * 0.4]] : [[hx - r * 1.05, hy - r * 0.2], [hx - r * 1.0, hy - r * 0.85], [hx, hy - r * (t === 'turban' ? 1.45 : 1.18)], [hx + r * 1.0, hy - r * 0.85], [hx + r * 1.05, hy - r * 0.2], [hx, hy - r * 0.45]]), c, { d: r * 0.2 });
    if (t === 'bandana' && (side || view === 'b')) e4F(x, e4Bl([[hx - r * 0.95, hy - r * 0.5], [hx - r * 1.5, hy - r * 0.2 + Math.sin(p * 12.6) * r * 0.15], [hx - r * 1.4, hy + r * 0.2], [hx - r * 0.9, hy - r * 0.2]]), c, { d: 0, lw: 0.8 });
  } else if (t === 'tricorn') {
    e4F(x, e4Bl(side ? [[hx - r * 1.4, hy - r * 0.35], [hx - r * 0.9, hy - r * 1.1], [hx + r * 0.6, hy - r * 1.15], [hx + r * 1.35, hy - r * 0.4], [hx, hy - r * 0.55]] : [[hx - r * 1.55, hy - r * 0.5], [hx - r * 1.0, hy - r * 1.2], [hx, hy - r * 0.95], [hx + r * 1.0, hy - r * 1.2], [hx + r * 1.55, hy - r * 0.5], [hx, hy - r * 0.35]]), c, { d: r * 0.15 });
    if (!enMode && view === 'f') { x.fillStyle = '#efe6cf'; x.beginPath(); x.arc(hx, hy - r * 0.8, r * 0.16, 0, 7); x.fill(); }
  } else if (t === 'brodie' || t === 'stahl' || t === 'cap' || t === 'visor' || t === 'beret') {
    if (t === 'beret') e4F(x, e4Bl(side ? [[hx - r * 1.0, hy - r * 0.4], [hx - r * 0.6, hy - r * 1.15], [hx + r * 0.7, hy - r * 1.1], [hx + r * 1.0, hy - r * 0.6], [hx, hy - r * 0.55]] : [[hx - r * 1.05, hy - r * 0.45], [hx - r * 0.7, hy - r * 1.15], [hx + r * 0.8, hy - r * 1.2], [hx + r * 1.15, hy - r * 0.7], [hx + r * 0.9, hy - r * 0.45]]), c, { d: r * 0.15 });
    else {
      dome(t === 'stahl' ? 1.08 : 1.04, t === 'stahl' ? 0.25 : -0.05);
      if (t === 'brodie') e4F(x, enEl(hx, hy - r * 0.38, r * 1.4, r * (side ? 0.18 : 0.26), 0), c, { d: r * 0.06 });
      if (t === 'cap' || t === 'visor') e4F(x, side ? e4Bl([[hx + r * 0.5, hy - r * 0.35], [hx + r * 1.45, hy - r * 0.2], [hx + r * 0.9, hy - r * 0.05]]) : enEl(hx, hy - r * 0.3, r * 0.95, r * 0.2, 0), x3c(c, -0.15), { d: 0, lw: 0.8 });
      if (t === 'visor' && view !== 'b') e4F(x, side ? e4Bl([[hx + r * 0.15, hy - r * 0.45], [hx + r * 1.05, hy - r * 0.45], [hx + r * 1.05, hy + r * 0.1], [hx + r * 0.3, hy + r * 0.05]]) : e4Bl([[hx - r * 0.85, hy - r * 0.45], [hx + r * 0.85, hy - r * 0.45], [hx + r * 0.8, hy + r * 0.1], [hx - r * 0.8, hy + r * 0.1]]), h.v || '#6fe3ff', { d: 0, lw: 0.8, hi: 0.7 });
      if (h.net && !enMode) { x.strokeStyle = 'rgba(40,50,20,0.5)'; x.lineWidth = 0.7; for (var j = -3; j <= 3; j++) { x.beginPath(); x.moveTo(hx + j * r * 0.3, hy - r * 1.1); x.lineTo(hx + j * r * 0.35, hy - r * 0.2); x.stroke(); } }
    }
  } else if (t === 'crown') {
    e4F(x, e4Po([[hx - r * 0.9, hy - r * 0.55], [hx - r * 0.95, hy - r * 1.35], [hx - r * 0.5, hy - r * 1.0], [hx, hy - r * 1.5], [hx + r * 0.5, hy - r * 1.0], [hx + r * 0.95, hy - r * 1.35], [hx + r * 0.9, hy - r * 0.55]]), c || '#e8b83a', { d: r * 0.1, hi: 0.5 });
  } else if (t === 'wolf') {
    e4F(x, e4Bl(side ? [[hx - r * 1.4, hy + r * 1.0], [hx - r * 1.1, hy - r * 0.8], [hx, hy - r * 1.25], [hx + r * 1.3, hy - r * 0.9], [hx + r * 1.4, hy - r * 0.45], [hx + r * 0.5, hy - r * 0.4], [hx - r * 0.5, hy + r * 1.0]] : [[hx - r * 1.4, hy + r * 1.1], [hx - r * 1.15, hy - r * 0.7], [hx, hy - r * 1.3], [hx + r * 1.15, hy - r * 0.7], [hx + r * 1.4, hy + r * 1.1], [hx + r * 0.9, hy - r * 0.4], [hx - r * 0.9, hy - r * 0.4]]), c || '#8e8a86', { d: r * 0.2 });
    [-1, 1].forEach(function (k) { if (side && k < 0) return; var bx = side ? hx + r * 0.1 : hx + k * r * 0.65; e4F(x, e4Po([[bx - r * 0.25, hy - r * 1.0], [bx + (side ? 0 : k * r * 0.1), hy - r * 1.6], [bx + r * 0.25, hy - r * 1.0]]), c || '#8e8a86', { d: 0, lw: 0.8 }); });
    if (!enMode && view !== 'b') { var ey2 = hy - r * 0.75; (side ? [hx + r * 0.9] : [hx - r * 0.35, hx + r * 0.35]).forEach(function (q) { e4Dot(x, q, ey2, r * 0.1, '#ffd84a'); }); }
  }
}

// ---------- 사람 ----------
// o: b 체격, hs 머리 크기, skin, hair{s,c}, hat{t,c,c2,crest}, beard, face{t,mouth,tusk,glow,paint}, top{t,c,c2}, bot{t,c}, feet{t,c}, sleeve, belt,
//    cape, wpn{t,c,m,L,hold}, sh{t,c,c2}, pack, neck(목걸이 색), rune(false면 없음), hunch(구부정), robe(긴 옷)
function x3Man(x, H, p, view, o) {
  var U = H, a = p * Math.PI * 2, b = o.b || 1, side = view === 's', back = view === 'b';
  var T1 = U * 0.14, T2 = U * 0.13, ank = U * 0.03, hipW = U * 0.066 * b, shW = U * 0.135 * b, torL = U * 0.215, hr = U * 0.155 * (o.hs || 1);
  var sk = o.skin || '#d9a273', top = o.top || {}, bot = o.bot || {}, feet = o.feet || {}, slv = o.sleeve || (top.t === 'armor' || top.t === 'coat' || top.t === 'robe' || top.t === 'uniform' ? top.c : sk);
  var legC = bot.t === 'pants' || bot.t === 'robe' ? bot.c : (o.legs || sk), footC = feet.c || (feet.t === 'bare' || !feet.t ? sk : '#5a3a24');
  var gait = o.gait || 1, ph = [a, a + Math.PI];   // 0: 가까운 다리(옆모습 오른쪽 앞), 1: 먼 다리
  EN_ONE = TFI;
  var bodyC = top.c || sk, armW = U * 0.066 * Math.sqrt(b), legW = U * 0.08 * Math.sqrt(b);
  // ----- 옆모습 -----
  if (side) {
    var legs = ph.map(function (f) {
      var th = 0.48 * gait * Math.sin(f), kn = 0.1 + 0.95 * gait * Math.max(0, Math.cos(f)) * (0.6 + 0.4 * Math.max(0, Math.sin(f + 0.6)));
      var K = [Math.sin(th) * T1, Math.cos(th) * T1], A = [K[0] + Math.sin(th - kn) * T2, K[1] + Math.cos(th - kn) * T2];
      return { th: th, kn: kn, K: K, A: A, sw: Math.cos(f) > 0 };
    });
    var hipH = Math.max(legs[0].A[1], legs[1].A[1]) + ank, lean = (o.lean == null ? 0.07 : o.lean) + 0.02 * Math.sin(a * 2), hy = -hipH, hip = [0, hy];
    var sh = [Math.sin(lean) * torL, hy - Math.cos(lean) * torL], hc = [sh[0] + Math.sin(lean) * U * 0.04 + U * 0.015, sh[1] - hr * 0.95 - U * 0.02];
    if (o.hunch) { sh[0] += U * 0.04; sh[1] += U * 0.03; hc = [sh[0] + U * 0.07, sh[1] - hr * 0.6]; }
    function leg(i, dark) {
      var L = legs[i], K = [hip[0] + L.K[0], hip[1] + L.K[1]], A = [hip[0] + L.A[0], hip[1] + L.A[1]], col = dark ? x3c(legC, -0.18) : legC, fc = dark ? x3c(footC, -0.15) : footC;
      e4Pill(x, hip, K, legW, legW * 0.88, col); e4Pill(x, K, A, legW * 0.88, legW * 0.72, col);
      var toe = L.sw ? -0.25 : 0, fl = U * 0.075;
      if (feet.t === 'boot') e4Pill(x, [A[0], A[1] - U * 0.04], [A[0], A[1] + U * 0.005], legW * 0.82, legW * 0.82, fc);
      e4F(x, e4Bl([[A[0] - fl * 0.35, A[1] - U * 0.012], [A[0] + fl * 0.75, A[1] - U * 0.005 + toe * fl], [A[0] + fl * 0.85, A[1] + U * 0.025 + toe * fl], [A[0] - fl * 0.35, A[1] + U * 0.028]]), fc, { d: U * 0.008 });
      if (feet.t === 'sandal' && !enMode) { x.strokeStyle = '#7a4a24'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(A[0] - U * 0.02, A[1] - U * 0.03); x.lineTo(A[0] + U * 0.03, A[1] + U * 0.01); x.stroke(); }
    }
    function arm(i, front) {
      var f = ph[i] + Math.PI, wp = front && o.wpn, sw = (wp ? 0.18 : 0.62) * Math.sin(f), up = wp ? (o.wpn.hold != null ? o.wpn.hold : 0.75) + sw : sw - 0.05, el = wp ? 1.1 : 0.35 + 0.35 * Math.max(0, Math.sin(f));
      if (o.zombie) { up = 1.45 + 0.08 * Math.sin(f); el = 0.1; }
      var S = [sh[0] + (front ? U * 0.0 : -U * 0.02), sh[1] + U * 0.03], E = [S[0] + Math.sin(up) * U * 0.12, S[1] + Math.cos(up) * U * 0.12], Hd = [E[0] + Math.sin(up + el) * U * 0.11, E[1] + Math.cos(up + el) * U * 0.11];
      var col = front ? slv : x3c(slv, -0.2), skc = front ? sk : x3c(sk, -0.2);
      if (!front && o.sh) x3Shield(x, U, Hd[0] + U * 0.02, Hd[1] - U * 0.03, o.sh, 's');
      e4Pill(x, S, E, armW, armW * 0.9, col); e4Pill(x, E, Hd, armW * 0.9, armW * 0.8, slv === sk ? skc : col);
      e4Ov(x, Hd[0], Hd[1], armW * 0.55, armW * 0.52, skc, 0, { d: armW * 0.1 });
      if (wp) x3Weapon(x, U, Hd, (o.wpn.ang != null ? o.wpn.ang : 0.35) + 0.12 * Math.sin(f), o.wpn, 1);
      if (front && o.sh && !o.wpn) x3Shield(x, U, Hd[0] + U * 0.05, Hd[1] - U * 0.04, o.sh, 's');
    }
    if (o.cape) e4F(x, e4Bl([[sh[0] - U * 0.04, sh[1]], [sh[0] - U * 0.2 - Math.sin(a) * U * 0.02, hy + U * 0.05], [sh[0] - U * 0.17, hy + U * 0.16], [sh[0] + U * 0.0, hy + U * 0.08]]), o.cape, { d: U * 0.03 });
    if (o.pack) e4F(x, e4Bl([[sh[0] - U * 0.05, sh[1] + U * 0.02], [sh[0] - U * 0.14, sh[1] + U * 0.04], [sh[0] - U * 0.14, hy - U * 0.01], [sh[0] - U * 0.04, hy - U * 0.02]]), o.pack, { d: U * 0.02 });
    arm(1, false); leg(1, true);
    // 몸통
    var cw = U * 0.118 * b, tor = e4Bl([[sh[0] - cw * 0.85, sh[1] - U * 0.01], [sh[0] + cw * 0.8, sh[1] + U * 0.005], [hip[0] + cw * (o.belly ? 1.25 : 0.95), hip[1] - torL * 0.4], [hip[0] + cw * 0.85, hip[1] + U * 0.02], [hip[0] - cw * 0.85, hip[1] + U * 0.02], [hip[0] - cw * 0.95, hip[1] - torL * 0.5]]);
    e4F(x, tor, bodyC, { d: U * 0.035, gx: 0.6 });
    x3TopDeco(x, U, tor, top, sh, hip, cw, 's', p);
    x3Bot(x, U, bot, hip, cw, 's', a);
    if (o.belt) e4Line(x, [[hip[0] - cw * 0.9, hip[1] - U * 0.01], [hip[0] + cw * 0.95, hip[1] - U * 0.015]], U * 0.024, o.belt);
    if (o.rune !== false) tfRune(x, sh[0] + cw * 0.15, (sh[1] + hy) / 2, U * 0.03, p);
    leg(0, false);
    if (o.neck) e4Line(x, [[sh[0] - cw * 0.3, sh[1] + U * 0.01], [sh[0] + cw * 0.5, sh[1] + U * 0.04]], U * 0.02, o.neck);
    x3Head(x, U, hc, hr, 's', o, p);
    arm(0, true);
    return;
  }
  // ----- 앞, 뒤 모습 -----
  var sway = Math.sin(a) * U * 0.018, bob = U * 0.016 * Math.abs(Math.cos(a)), hy2 = -(T1 + T2 + ank) - bob + U * 0.01, roll = 0.04 * Math.sin(a);
  var hips = [[-hipW + sway, hy2], [hipW + sway, hy2]];
  function fleg(i) {
    // i 0: 화면 왼쪽 다리. 앞 모습이면 오른다리(가까운 다리 위상 ph[0]) 왼쪽에
    var f = ph[back ? 1 - i : i], lift = Math.max(0, Math.sin(f)) * gait, H0 = hips[i], spread = (i ? 1 : -1) * U * 0.01;
    var foot = [H0[0] + spread * 1.4, -lift * U * 0.085], knee = [H0[0] + spread + (i ? 1 : -1) * lift * U * 0.012, H0[1] + (T1 * (1 - 0.32 * lift))];
    var col = legC, fc = footC, near = lift > 0.05 && !back;
    e4Pill(x, H0, knee, legW, legW * 0.9, col); e4Pill(x, knee, [foot[0], foot[1] - U * 0.02], legW * 0.9, legW * 0.74, col);
    if (feet.t === 'boot') e4Pill(x, [foot[0], foot[1] - U * 0.05], [foot[0], foot[1] - U * 0.01], legW * 0.84, legW * 0.84, fc);
    var fs = near ? 1 + 0.2 * lift : 1;
    e4F(x, e4Bl([[foot[0] - U * 0.04 * fs, foot[1] - U * 0.02], [foot[0] + U * 0.04 * fs, foot[1] - U * 0.02], [foot[0] + U * 0.045 * fs, foot[1] + U * 0.012 * fs], [foot[0] - U * 0.045 * fs, foot[1] + U * 0.012 * fs]]), fc, { d: U * 0.008 });
  }
  var cw2 = U * 0.13 * b, shY = hy2 - torL + U * 0.01, hcx = sway * 0.6, hc2 = [hcx, shY - hr * 0.95 - U * 0.012];
  if (o.hunch) hc2[1] += U * 0.04;
  function farm(i) {
    // i 0: 화면 왼쪽 팔. 걸음과 반대로 흔들림: 앞으로 오는 팔은 손이 아래, 앞으로(조금 커짐)
    var f = ph[back ? i : 1 - i] + Math.PI, sw = Math.sin(f), dir = i ? 1 : -1, wp = o.wpn && (back ? i === 0 : i === 1);
    var S = [dir * shW + sway, shY + U * 0.035], up = wp ? 0.5 : 0.08 + 0.05 * sw, Hd;
    if (o.zombie && !back) { Hd = [dir * shW * 0.7 + sway, shY + U * 0.09]; e4Pill(x, S, Hd, armW, armW * 0.85, slv); e4Ov(x, Hd[0], Hd[1] + U * 0.01, armW * 0.6, armW * 0.55, sk, 0, { d: 0 }); return; }
    var E = [S[0] + dir * Math.sin(up) * U * 0.05, S[1] + U * 0.115 - (wp ? U * 0.02 : 0)];
    Hd = wp ? [E[0] - dir * U * 0.02, E[1] + U * 0.05] : [E[0] + dir * U * 0.01, E[1] + U * 0.1 - sw * U * 0.03 * (back ? -1 : 1)];
    if (o.sh && !wp && !back) { e4Pill(x, S, E, armW, armW * 0.9, slv); x3Shield(x, U, E[0] + dir * U * 0.04, E[1] + U * 0.02, o.sh, 'f'); return; }
    e4Pill(x, S, E, armW, armW * 0.9, slv); e4Pill(x, E, Hd, armW * 0.9, armW * 0.82, slv === sk ? sk : slv);
    var hs = 1 + (back ? -0.08 : 0.12) * sw;
    e4Ov(x, Hd[0], Hd[1], armW * 0.56 * hs, armW * 0.52 * hs, sk, 0, { d: armW * 0.1 });
    if (wp) x3Weapon(x, U, Hd, dir * (o.wpn.fang != null ? o.wpn.fang : 0.25), o.wpn, 0);
  }
  if (back && o.sh) x3Shield(x, U, sway + U * 0.0, shY + U * 0.12, o.sh, 'b');
  if (!back && o.cape) e4F(x, e4Bl([[-shW * 1.05 + sway, shY], [shW * 1.05 + sway, shY], [shW * 1.25 + sway, hy2 + U * 0.14], [-shW * 1.25 + sway, hy2 + U * 0.14]]), x3c(o.cape, -0.25), { d: 0 });
  fleg(0); fleg(1);
  // 몸통
  var tor2 = e4Bl([[-shW * 0.95 + sway, shY - U * 0.01], [shW * 0.95 + sway, shY - U * 0.01], [cw2 * (o.belly ? 1.2 : 0.95) + sway, hy2 - torL * 0.35], [cw2 * 0.8 + sway, hy2 + U * 0.025], [-cw2 * 0.8 + sway, hy2 + U * 0.025], [-cw2 * (o.belly ? 1.2 : 0.95) + sway, hy2 - torL * 0.35]]);
  x.save(); if (!enMode) { x.translate(sway, hy2); x.rotate(roll); x.translate(-sway, -hy2); }
  e4F(x, tor2, bodyC, { d: U * 0.035 });
  x3TopDeco(x, U, tor2, top, [sway, shY], [sway, hy2], cw2, view, p);
  x3Bot(x, U, bot, [sway, hy2], cw2, view, a);
  if (o.belt) e4Line(x, [[-cw2 * 0.85 + sway, hy2 - U * 0.005], [cw2 * 0.85 + sway, hy2 - U * 0.005]], U * 0.026, o.belt);
  if (!back && o.rune !== false) tfRune(x, sway + cw2 * 0.25, (shY + hy2) / 2 - U * 0.02, U * 0.03, p);
  if (!back && o.neck) e4Line(x, [[-cw2 * 0.45 + sway, shY + U * 0.015], [sway, shY + U * 0.05], [cw2 * 0.45 + sway, shY + U * 0.015]], U * 0.018, o.neck);
  if (back && o.pack) e4F(x, e4Bl([[-cw2 * 0.7 + sway, shY + U * 0.02], [cw2 * 0.7 + sway, shY + U * 0.02], [cw2 * 0.65 + sway, hy2 - U * 0.02], [-cw2 * 0.65 + sway, hy2 - U * 0.02]]), o.pack, { d: U * 0.02 });
  x.restore();
  farm(0); farm(1);
  if (back && o.cape) e4F(x, e4Bl([[-shW * 1.0 + sway, shY - U * 0.005], [shW * 1.0 + sway, shY - U * 0.005], [shW * 1.2 + sway + Math.sin(a) * U * 0.01, hy2 + U * 0.16], [-shW * 1.2 + sway - Math.sin(a) * U * 0.01, hy2 + U * 0.16]]), o.cape, { d: U * 0.03 });
  x3Head(x, U, hc2, hr, view, o, p);
}
// 윗옷 무늬: 털, 갑옷 띠, 옷깃
function x3TopDeco(x, U, tor, top, sh, hip, cw, view, p) {
  if (enMode || !top.t) return;
  x.save(); x.clip(tor.p);
  if (top.t === 'fur') { x.fillStyle = x3c(top.c, 0.22); for (var i = 0; i < 9; i++) { var px = sh[0] - cw + (i % 3) * cw * 0.8 + (i * 7 % 5) * U * 0.004, py = sh[1] + Math.floor(i / 3) * U * 0.07 + U * 0.03; x.beginPath(); x.moveTo(px, py); x.lineTo(px + U * 0.02, py + U * 0.04); x.lineTo(px - U * 0.012, py + U * 0.035); x.fill(); } if (top.bare) { x.fillStyle = top.bare; x.beginPath(); x.moveTo(sh[0] + cw * 0.4, sh[1] - U * 0.02); x.lineTo(sh[0] + cw * 1.2, sh[1]); x.lineTo(sh[0] + cw * 1.1, (sh[1] + hip[1]) / 2); x.closePath(); x.fill(); } }
  else if (top.t === 'armor' || top.t === 'lorica') { x.strokeStyle = x3c(top.c, -0.35); x.lineWidth = Math.max(0.8, U * 0.012); for (var j = 1; j < 5; j++) { var yy = sh[1] + (hip[1] - sh[1]) * j / 5; x.beginPath(); x.moveTo(sh[0] - cw * 1.4, yy); x.lineTo(sh[0] + cw * 1.4, yy + (view === 's' ? U * 0.01 : 0)); x.stroke(); } if (top.c2) { x.fillStyle = top.c2; x.fillRect(sh[0] - cw * 1.5, sh[1] - U * 0.005, cw * 3, U * 0.03); } }
  else if (top.t === 'mail') { x.fillStyle = x3c(top.c, -0.25); for (var m = 0; m < 40; m++) { var mx = sh[0] - cw + (m % 8) * cw * 0.28, my = sh[1] + Math.floor(m / 8) * U * 0.05; x.beginPath(); x.arc(mx, my, U * 0.008, 0, 7); x.fill(); } }
  else if (top.t === 'robe' || top.t === 'tunic' || top.t === 'coat' || top.t === 'uniform' || top.t === 'vest') {
    if (top.c2) { x.fillStyle = top.c2; if (view === 'f') { x.fillRect(sh[0] - U * 0.015, sh[1], U * 0.03, hip[1] - sh[1]); } else if (view === 's') x.fillRect(sh[0] + cw * 0.3, sh[1], U * 0.025, hip[1] - sh[1]); }
    if (top.t === 'uniform' || top.t === 'coat') { x.fillStyle = x3c(top.c, -0.25); [0.3, 0.55].forEach(function (q) { var yy = sh[1] + (hip[1] - sh[1]) * q; if (view !== 'b') { x.fillRect(sh[0] - cw * 0.75, yy, cw * 0.45, U * 0.035); if (view === 'f') x.fillRect(sh[0] + cw * 0.3, yy, cw * 0.45, U * 0.035); } }); }
    if (top.t === 'vest') { x.fillStyle = top.c3 || '#e8e0cc'; if (view === 'f') x.fillRect(sh[0] - cw * 0.3, sh[1], cw * 0.6, hip[1] - sh[1]); }
  }
  if (top.strap) { x.strokeStyle = top.strap; x.lineWidth = U * 0.022; x.beginPath(); if (view === 'b') { x.moveTo(sh[0] + cw, sh[1]); x.lineTo(sh[0] - cw, hip[1]); } else { x.moveTo(sh[0] - cw, sh[1]); x.lineTo(sh[0] + cw, hip[1]); } x.stroke(); }
  x.restore(); x.lineWidth = enLW; x.strokeStyle = TFI; x.stroke(tor.p);
}
// 아래옷: 털 치마, 킬트, 긴 옷자락
function x3Bot(x, U, bot, hip, cw, view, a) {
  if (!bot.t || bot.t === 'pants') return;
  var hx = hip[0], hy = hip[1], c = bot.c || '#7a5a3a', L = bot.t === 'robe' ? U * 0.28 : bot.t === 'kilt' ? U * 0.11 : U * 0.12, k = view === 's' ? 0.9 : 1, sw = Math.sin(a) * U * 0.015;
  var pts = [[hx - cw * 0.95 * k, hy - U * 0.02], [hx + cw * 0.95 * k, hy - U * 0.02], [hx + cw * (bot.t === 'robe' ? 1.25 : 1.15) * k + sw, hy + L], [hx - cw * (bot.t === 'robe' ? 1.25 : 1.15) * k + sw, hy + L]];
  if (bot.t === 'fur' || bot.t === 'loin') { pts = [pts[0], pts[1], [pts[2][0], pts[2][1] - U * 0.02], [hx + cw * 0.5 * k + sw, hy + L], [hx + sw, hy + L - U * 0.025], [hx - cw * 0.5 * k + sw, hy + L], [pts[3][0], pts[3][1] - U * 0.02]]; e4F(x, e4Po(pts), c, { d: U * 0.02 }); }
  else { var s = e4F(x, e4Bl(pts), c, { d: U * 0.02 }); if (bot.t === 'kilt' && !enMode) { x.save(); x.clip(s.p); x.strokeStyle = x3c(c, -0.3); x.lineWidth = Math.max(0.8, U * 0.01); for (var i = -4; i <= 4; i++) { x.beginPath(); x.moveTo(hx + i * cw * 0.25, hy); x.lineTo(hx + i * cw * 0.3, hy + L); x.stroke(); } x.restore(); x.lineWidth = enLW; x.strokeStyle = TFI; x.stroke(s.p); } }
  if (bot.c2 && !enMode) { x.fillStyle = bot.c2; x.fillRect(hx - cw * 1.2, hy - U * 0.025, cw * 2.4, U * 0.025); }
}

// ---------- 네발 짐승 ----------
// o: c 털, c2 배, kind cat|dog|horse|mammoth|rhino|boar|elephant|tiger|bull, stripe, tusk, horn, mane, len 몸길이, tall 다리, fur(덥수룩), crown, rider(사람 설정)
function x3Beast(x, H, p, view, o) {
  var U = H, a = p * Math.PI * 2, c = o.c || '#a8743e', c2 = o.c2 || x3c(c, 0.25), k = o.kind || 'dog', side = view === 's', back = view === 'b';
  var len = U * (o.len || 0.85), legL = U * (o.tall || 0.3), bodyR = U * (o.thick || 0.2), legW = U * (o.legw || 0.085);
  EN_ONE = TFI;
  var gph = [a, a + Math.PI, a + Math.PI, a];   // 앞 가까이, 앞 멀리, 뒤 가까이, 뒤 멀리(트롯)
  var bob = U * 0.012 * Math.abs(Math.cos(a)), by = -legL - bodyR * 0.75 - bob;
  if (side) {
    var fx = len * 0.32, bx = -len * 0.32;
    function sleg(i, dark) {
      var f = gph[i], th = 0.42 * Math.sin(f), lift = Math.max(0, Math.cos(f)), base = [i < 2 ? fx : bx, by + bodyR * 0.45];
      var L = legL + bodyR * 0.3, col = dark ? x3c(c, -0.2) : c;
      var P = e4Paw(x, base[0], base[1], L - lift * U * 0.03, th, legW * (k === 'mammoth' || k === 'elephant' ? 1.45 : k === 'rhino' || k === 'bull' ? 1.25 : 1), col, { hind: i >= 2, bend: 0.1 + 0.25 * lift, paw: k === 'horse' ? '#3a2a20' : (k === 'mammoth' || k === 'elephant' || k === 'rhino' ? x3c(c, -0.12) : col) });
      return P;
    }
    if (o.tail !== false) { var tb = [bx - len * 0.12, by - bodyR * 0.3]; if (k === 'horse') e4F(x, e4Bl([tb, [tb[0] - U * 0.12, tb[1] + U * 0.05 + Math.sin(a) * U * 0.02], [tb[0] - U * 0.1, tb[1] + U * 0.2], [tb[0] - U * 0.02, tb[1] + U * 0.05]]), o.mc || '#3a2a20', { d: U * 0.02 }); else e4Line(x, [tb, [tb[0] - U * 0.1, tb[1] + U * 0.02 + Math.sin(a) * U * 0.03], [tb[0] - U * (k === 'cat' || k === 'tiger' ? 0.2 : 0.12), tb[1] - U * (k === 'cat' || k === 'tiger' ? 0.1 : -0.06)]], U * (k === 'cat' || k === 'tiger' ? 0.035 : 0.025), x3c(c, -0.1)); }
    sleg(1, true); sleg(3, true);
    var body = e4Bl([[bx - len * 0.22, by + bodyR * 0.2], [bx - len * 0.15, by - bodyR * 0.85], [0, by - bodyR * (o.hump ? 1.25 : 1.0)], [fx + len * 0.1, by - bodyR * (o.hump ? 1.1 : 0.95)], [fx + len * 0.2, by - bodyR * 0.2], [fx + len * 0.1, by + bodyR * 0.75], [0, by + bodyR * 0.85], [bx - len * 0.12, by + bodyR * 0.75]]);
    e4F(x, body, c, { d: bodyR * 0.3, gx: 0.45 });
    if (!enMode) {
      x.save(); x.clip(body.p);
      x.fillStyle = c2; x.beginPath(); x.ellipse(0, by + bodyR * 0.85, len * 0.42, bodyR * 0.45, 0, 0, 7); x.fill();
      if (o.stripe) { x.strokeStyle = o.stripe; x.lineWidth = U * 0.022; x.lineCap = 'round'; for (var s = -3; s <= 3; s++) { x.beginPath(); x.moveTo(s * len * 0.11, by - bodyR * 1.0); x.quadraticCurveTo(s * len * 0.11 + U * 0.02, by - bodyR * 0.3, s * len * 0.11 - U * 0.01, by + bodyR * 0.1); x.stroke(); } }
      if (o.fur) { x.fillStyle = x3c(c, -0.18); for (var q = 0; q < 14; q++) { var qx = bx - len * 0.15 + q * len * 0.05, qy = by + bodyR * (0.4 + (q % 3) * 0.12); x.beginPath(); x.moveTo(qx, qy); x.lineTo(qx + U * 0.015, qy + U * 0.05); x.lineTo(qx - U * 0.01, qy + U * 0.04); x.fill(); } }
      x.restore(); x.lineWidth = enLW; x.strokeStyle = TFI; x.stroke(body.p);
    }
    if (o.saddle) e4F(x, e4Bl([[-len * 0.12, by - bodyR * 0.95], [len * 0.12, by - bodyR * 0.95], [len * 0.1, by - bodyR * 0.2], [-len * 0.1, by - bodyR * 0.2]]), o.saddle, { d: U * 0.02 });
    if (o.tfr !== false) tfRune(x, -len * 0.05, by - bodyR * 0.2, U * 0.035, p);
    sleg(2, false); sleg(0, false);
    x3BeastHead(x, U, [fx + len * 0.18, by - bodyR * (k === 'horse' ? 1.05 : 0.45)], o, 's', a);
    if (o.rider) { x.save(); if (!enMode) x.translate(0, by - bodyR * 0.75); else x.translate(0, by - bodyR * 0.75); x3Rider(x, U, o.rider, p, 's'); x.restore(); }
    return;
  }
  // 앞, 뒤 모습: 몸은 동그랗게, 다리 넷(먼 다리는 작고 어둡게 안쪽), 걸음은 다리 들기
  var w = U * (o.wide || 0.24), legX = [w * 0.62, -w * 0.62];
  function fleg(xx, f, far) {
    var lift = Math.max(0, Math.sin(f)), top = [xx, by + bodyR * 0.3], ft = [xx * (far ? 0.85 : 1.05), -lift * U * 0.07 - (far ? U * 0.02 : 0)];
    var col = far ? x3c(c, -0.22) : c, ww = legW * (k === 'mammoth' || k === 'elephant' ? 1.45 : 1.1) * (far ? 0.85 : 1);
    e4Pill(x, top, [ft[0], ft[1] - U * 0.02], ww, ww * 0.82, col);
    e4Ov(x, ft[0], ft[1] - U * 0.015, ww * 0.6, ww * 0.32, k === 'horse' ? '#3a2a20' : x3c(col, -0.12), 0, { d: 0 });
  }
  fleg(legX[0] * 0.75, gph[back ? 0 : 1], true); fleg(legX[1] * 0.75, gph[back ? 1 : 3], true);
  if (back && o.tail !== false) e4Line(x, [[0, by - bodyR * 0.2], [Math.sin(a * 2) * U * 0.04, by + bodyR * 0.5], [Math.sin(a * 2 + 1) * U * 0.03, by + bodyR * 0.9]], U * 0.03, k === 'horse' ? (o.mc || '#3a2a20') : x3c(c, -0.1));
  var body2 = e4Bl([[-w, by], [-w * 0.85, by - bodyR * 0.95], [0, by - bodyR * (o.hump ? 1.3 : 1.05)], [w * 0.85, by - bodyR * 0.95], [w, by], [w * 0.75, by + bodyR * 0.8], [-w * 0.75, by + bodyR * 0.8]]);
  if (back) { e4F(x, body2, c, { d: bodyR * 0.25 }); if (o.tail !== false && k !== 'horse') e4Line(x, [[0, by - bodyR * 0.3], [Math.sin(a * 2) * U * 0.05, by - bodyR * 0.1], [Math.sin(a * 2 + 1) * U * 0.04, by + bodyR * 0.5]], U * 0.03, x3c(c, -0.1)); }
  else e4F(x, body2, c, { d: bodyR * 0.25 });
  if (!enMode && o.stripe) { x.save(); x.clip(body2.p); x.strokeStyle = o.stripe; x.lineWidth = U * 0.02; for (var s2 = -2; s2 <= 2; s2++) { x.beginPath(); x.moveTo(s2 * w * 0.4, by - bodyR); x.lineTo(s2 * w * 0.45, by - bodyR * 0.4); x.stroke(); } x.restore(); }
  if (o.saddle && back) e4F(x, e4Bl([[-w * 0.5, by - bodyR * 0.9], [w * 0.5, by - bodyR * 0.9], [w * 0.4, by - bodyR * 0.3], [-w * 0.4, by - bodyR * 0.3]]), o.saddle, { d: U * 0.02 });
  fleg(legX[0], gph[back ? 2 : 0], false); fleg(legX[1], gph[back ? 3 : 2], false);
  if (o.rider) { x.save(); x.translate(0, by - bodyR * 0.7); x3Rider(x, U, o.rider, p, view); x.restore(); }
  if (!back) { var fo = Object.assign({}, o, { head: (o.head || 0.13) * (k === 'horse' ? 1.15 : k === 'mammoth' || k === 'elephant' ? 1.1 : 1.35) }); x3BeastHead(x, U, [0, by - bodyR * (k === 'horse' ? 1.0 : 0.05)], fo, 'f', a); }
  else if (k !== 'mammoth' && k !== 'elephant') { e4Ov(x, 0, by - bodyR * 1.0, U * 0.09, U * 0.07, c, 0, { d: U * 0.02 }); }
}
function x3BeastHead(x, U, hc, o, view, a) {
  var k = o.kind || 'dog', c = o.c || '#a8743e', hr = U * (o.head || 0.13), hx = hc[0], hy = hc[1], side = view === 's';
  if (k === 'mammoth' || k === 'elephant') {
    var tr = Math.sin(a) * 0.15;
    if (side) {
      e4F(x, e4Bl([[hx - hr * 0.8, hy - hr * 1.2], [hx + hr * 0.6, hy - hr * 1.3], [hx + hr * 1.1, hy - hr * 0.3], [hx + hr * 0.9, hy + hr * 0.5], [hx - hr * 0.3, hy + hr * 0.7]]), c, { d: hr * 0.25 });
      e4Ov(x, hx - hr * 0.35, hy - hr * 0.1, hr * 0.55, hr * 0.75, x3c(c, -0.12), 0.2, { d: hr * 0.15 });   // 귀
      e4F(x, e4Bl([[hx + hr * 0.7, hy + hr * 0.1], [hx + hr * 1.2, hy + hr * 0.6], [hx + hr * (1.25 + tr), hy + hr * 1.6], [hx + hr * (0.95 + tr), hy + hr * 2.0], [hx + hr * (0.8 + tr), hy + hr * 1.55], [hx + hr * 0.7, hy + hr * 0.7], [hx + hr * 0.35, hy + hr * 0.4]]), c, { d: hr * 0.12 });   // 코
      if (o.tusk) e4F(x, e4Bl([[hx + hr * 0.75, hy + hr * 0.45], [hx + hr * 1.6, hy + hr * 0.9], [hx + hr * 2.0, hy + hr * 0.2], [hx + hr * 1.85, hy + hr * 0.15], [hx + hr * 1.5, hy + hr * 0.6], [hx + hr * 0.85, hy + hr * 0.25]]), o.tusk, { d: hr * 0.06, hi: 0.5 });
      if (!enMode) e4Eye(x, hx + hr * 0.55, hy - hr * 0.35, hr * 0.13, hr * 0.15, { w: '#fffbea', ir: '#c02010', pr: 0.55, px: 0.3 });
      if (o.crown) e4F(x, e4Po([[hx - hr * 0.4, hy - hr * 1.15], [hx - hr * 0.35, hy - hr * 1.75], [hx - hr * 0.05, hy - hr * 1.4], [hx + hr * 0.2, hy - hr * 1.85], [hx + hr * 0.4, hy - hr * 1.4], [hx + hr * 0.7, hy - hr * 1.7], [hx + hr * 0.65, hy - hr * 1.15]]), o.crown, { d: hr * 0.08, hi: 0.5 });
      if (o.hair) e4F(x, e4Po([[hx - hr * 0.8, hy - hr * 1.1], [hx - hr * 0.4, hy - hr * 1.6], [hx - hr * 0.1, hy - hr * 1.2], [hx + hr * 0.2, hy - hr * 1.55], [hx + hr * 0.5, hy - hr * 1.2]]), o.hair, { d: 0, lw: 0.8 });
    } else {
      [-1, 1].forEach(function (s) { e4Ov(x, hx + s * hr * 1.05, hy - hr * 0.2, hr * 0.65, hr * 0.85, x3c(c, -0.12), s * 0.25, { d: hr * 0.15 }); });
      e4F(x, e4Bl([[hx - hr * 0.95, hy - hr * 0.6], [hx, hy - hr * 1.35], [hx + hr * 0.95, hy - hr * 0.6], [hx + hr * 0.7, hy + hr * 0.6], [hx - hr * 0.7, hy + hr * 0.6]]), c, { d: hr * 0.25 });
      if (o.tusk) [-1, 1].forEach(function (s) { e4F(x, e4Bl([[hx + s * hr * 0.35, hy + hr * 0.4], [hx + s * hr * 1.0, hy + hr * 1.5], [hx + s * hr * 0.6, hy + hr * 1.9], [hx + s * hr * 0.55, hy + hr * 1.7], [hx + s * hr * 0.7, hy + hr * 1.4], [hx + s * hr * 0.2, hy + hr * 0.6]]), o.tusk, { d: 0, hi: 0.5 }); });
      e4F(x, e4Bl([[hx - hr * 0.3, hy + hr * 0.2], [hx + hr * 0.3, hy + hr * 0.2], [hx + hr * (0.25 + tr), hy + hr * 1.5], [hx + hr * tr, hy + hr * 2.1], [hx - hr * (0.25 - tr), hy + hr * 1.5]]), c, { d: hr * 0.1 });
      if (!enMode) [-1, 1].forEach(function (s) { e4Eye(x, hx + s * hr * 0.45, hy - hr * 0.3, hr * 0.13, hr * 0.15, { w: '#fffbea', ir: '#c02010', pr: 0.55, px: 0 }); });
      if (o.crown) e4F(x, e4Po([[hx - hr * 0.55, hy - hr * 1.0], [hx - hr * 0.6, hy - hr * 1.65], [hx - hr * 0.25, hy - hr * 1.3], [hx, hy - hr * 1.8], [hx + hr * 0.25, hy - hr * 1.3], [hx + hr * 0.6, hy - hr * 1.65], [hx + hr * 0.55, hy - hr * 1.0]]), o.crown, { d: hr * 0.08, hi: 0.5 });
      if (o.hair) e4F(x, e4Po([[hx - hr * 0.6, hy - hr * 1.0], [hx - hr * 0.3, hy - hr * 1.6], [hx, hy - hr * 1.2], [hx + hr * 0.3, hy - hr * 1.6], [hx + hr * 0.6, hy - hr * 1.0]]), o.hair, { d: 0, lw: 0.8 });
    }
    return;
  }
  var cat = k === 'cat' || k === 'tiger', horse = k === 'horse', rhino = k === 'rhino' || k === 'boar' || k === 'bull';
  if (side) {
    var sn = horse ? 1.3 : rhino ? 1.0 : cat ? 0.55 : 0.9;
    if (horse && o.mane !== false) e4F(x, e4Po([[hx - hr * 1.6, hy + hr * 1.6], [hx - hr * 1.3, hy + hr * 0.5], [hx - hr * 0.9, hy - hr * 0.4], [hx - hr * 0.2, hy - hr * 1.0], [hx - hr * 0.6, hy - hr * 0.2], [hx - hr * 1.0, hy + hr * 0.9]]), o.mc || '#3a2a20', { d: 0 });
    if (horse) e4F(x, e4Bl([[hx - hr * 1.4, hy + hr * 1.4], [hx - hr * 0.7, hy - hr * 0.5], [hx + hr * 0.1, hy - hr * 0.6], [hx - hr * 0.4, hy + hr * 1.2]]), o.c, { d: hr * 0.15 });
    var hs = e4Bl([[hx - hr * 0.8, hy + hr * 0.4], [hx - hr * 0.7, hy - hr * 0.7], [hx + hr * 0.2, hy - hr * 0.85], [hx + hr * (0.4 + sn * 0.6), hy - hr * 0.4], [hx + hr * (0.6 + sn), hy + hr * 0.2], [hx + hr * (0.5 + sn), hy + hr * 0.65], [hx + hr * 0.1, hy + hr * 0.8]]);
    e4F(x, hs, c, { d: hr * 0.25 });
    if (cat || k === 'dog') e4F(x, e4Po([[hx - hr * 0.6, hy - hr * 0.6], [hx - hr * 0.45, hy - hr * (cat ? 1.25 : 1.45)], [hx - hr * 0.05, hy - hr * 0.75]]), c, { d: 0, lw: 0.9 });
    if (horse) e4F(x, e4Po([[hx - hr * 0.3, hy - hr * 0.7], [hx - hr * 0.25, hy - hr * 1.3], [hx + hr * 0.05, hy - hr * 0.75]]), c, { d: 0, lw: 0.9 });
    if (o.horn) { e4F(x, e4Bl([[hx + hr * (0.25 + sn * 0.75), hy - hr * 0.3], [hx + hr * (0.45 + sn * 0.85), hy - hr * 1.9], [hx + hr * (0.85 + sn * 0.75), hy - hr * 0.15]]), o.horn, { d: 0, hi: 0.5 }); e4F(x, e4Bl([[hx + hr * (0.0 + sn * 0.6), hy - hr * 0.6], [hx + hr * (0.1 + sn * 0.6), hy - hr * 1.15], [hx + hr * (0.3 + sn * 0.6), hy - hr * 0.55]]), o.horn, { d: 0, hi: 0.5 }); }
    if (o.horns) tfHorn(x, [hx - hr * 0.2, hy - hr * 0.6], [hx + hr * 0.3, hy - hr * 1.1], [hx + hr * 0.9, hy - hr * 1.0], hr * 0.25, hr * 0.05, o.horns);
    if (o.tusk && k !== 'mammoth') e4F(x, e4Bl([[hx + hr * (0.3 + sn), hy + hr * 0.45], [hx + hr * (0.4 + sn), hy - hr * 0.2], [hx + hr * (0.55 + sn), hy + hr * 0.5]]), o.tusk, { d: 0 });
    if (o.sabre) e4F(x, e4Bl([[hx + hr * 0.75, hy + hr * 0.45], [hx + hr * 0.82, hy + hr * 1.3], [hx + hr * 0.95, hy + hr * 0.5]]), '#fffbea', { d: 0, lw: 0.8 });
    if (!enMode) {
      e4Eye(x, hx + hr * 0.25, hy - hr * 0.25, hr * 0.16, hr * 0.17, { w: '#fff3b0', ir: cat ? '#7ab030' : '#c02010', pr: 0.5, px: 0.3 });
      x.strokeStyle = TFI; x.lineWidth = Math.max(1, hr * 0.1); x.beginPath(); x.moveTo(hx + hr * 0.02, hy - hr * 0.5); x.lineTo(hx + hr * 0.45, hy - hr * 0.38); x.stroke();
      e4Dot(x, hx + hr * (0.5 + sn), hy + hr * 0.15, hr * 0.09, TFI);
      x.beginPath(); x.moveTo(hx + hr * (0.2 + sn * 0.7), hy + hr * 0.55); x.lineTo(hx + hr * (0.5 + sn * 0.8), hy + hr * 0.5); x.stroke();
    }
    if (o.mane && !horse) e4F(x, e4Mane(hx - hr * 0.2, hy, Math.PI * 0.5, Math.PI * 1.6, hr * 0.8, hr * 1.4, 6, a), o.mane, { d: 0 });
    return;
  }
  // 앞 얼굴
  var fw = hr * (horse ? 0.75 : 1.0), fl = horse ? 1.4 : rhino ? 1.0 : 0.85;
  if (o.mane && !horse) e4F(x, e4Mane(hx, hy, 0, Math.PI * 2, hr * 1.0, hr * 1.5, 9, a), o.mane, { d: 0 });
  if (cat || k === 'dog') [-1, 1].forEach(function (s) { e4F(x, e4Po([[hx + s * hr * 0.35, hy - hr * 0.7], [hx + s * hr * 0.75, hy - hr * (cat ? 1.25 : 1.45)], [hx + s * hr * 0.9, hy - hr * 0.45]]), c, { d: 0, lw: 0.9 }); });
  if (horse) [-1, 1].forEach(function (s) { e4F(x, e4Po([[hx + s * hr * 0.25, hy - hr * 0.8], [hx + s * hr * 0.4, hy - hr * 1.35], [hx + s * hr * 0.55, hy - hr * 0.7]]), c, { d: 0, lw: 0.9 }); });
  if (o.horns) [-1, 1].forEach(function (s) { tfHorn(x, [hx + s * hr * 0.6, hy - hr * 0.6], [hx + s * hr * 1.2, hy - hr * 0.9], [hx + s * hr * 1.4, hy - hr * 1.5], hr * 0.22, hr * 0.05, o.horns); });
  e4F(x, e4Bl([[hx - fw, hy - hr * 0.2], [hx - fw * 0.75, hy - hr * 0.85], [hx + fw * 0.75, hy - hr * 0.85], [hx + fw, hy - hr * 0.2], [hx + fw * 0.6, hy + hr * fl], [hx - fw * 0.6, hy + hr * fl]]), c, { d: hr * 0.25 });
  e4Ov(x, hx, hy + hr * (fl * 0.7), fw * 0.55, hr * 0.38, o.c2 || x3c(c, 0.25), 0, { d: hr * 0.08 });
  if (o.horn) e4F(x, e4Bl([[hx - hr * 0.25, hy + hr * 0.55], [hx, hy - hr * 0.9], [hx + hr * 0.25, hy + hr * 0.55]]), o.horn, { d: 0, hi: 0.5 });
  if (o.sabre) [-1, 1].forEach(function (s) { e4F(x, e4Bl([[hx + s * hr * 0.25, hy + hr * 0.85], [hx + s * hr * 0.3, hy + hr * 1.6], [hx + s * hr * 0.4, hy + hr * 0.85]]), '#fffbea', { d: 0, lw: 0.8 }); });
  if (o.tusk && k !== 'mammoth') [-1, 1].forEach(function (s) { e4F(x, e4Bl([[hx + s * hr * 0.4, hy + hr * 0.8], [hx + s * hr * 0.6, hy + hr * 0.1], [hx + s * hr * 0.55, hy + hr * 0.85]]), o.tusk, { d: 0 }); });
  if (!enMode) {
    [-1, 1].forEach(function (s) { e4Eye(x, hx + s * fw * 0.45, hy - hr * 0.2, hr * 0.15, hr * 0.17, { w: '#fff3b0', ir: cat ? '#7ab030' : '#c02010', pr: 0.5, px: 0 }); x.strokeStyle = TFI; x.lineWidth = Math.max(1, hr * 0.1); x.beginPath(); x.moveTo(hx + s * fw * 0.75, hy - hr * 0.48); x.lineTo(hx + s * fw * 0.15, hy - hr * 0.36); x.stroke(); });
    e4Dot(x, hx, hy + hr * (fl * 0.55), hr * 0.12, TFI);
  }
}
// 탈것 위 사람(허리 위만): 짐승 등에서
function x3Rider(x, U, r, p, view) {
  var o = Object.assign({}, r, { bot: {}, feet: {} }), hr = U * 0.11 * (o.hs || 1), a = p * Math.PI * 2, side = view === 's', b = o.b || 1, cw = U * 0.1 * b;
  var y0 = -Math.abs(Math.cos(a)) * U * 0.012, sh = [side ? U * 0.02 : 0, y0 - U * 0.2], tor = e4Bl(side ? [[sh[0] - cw * 0.8, sh[1]], [sh[0] + cw * 0.8, sh[1]], [cw * 0.9, y0], [-cw * 0.9, y0]] : [[-cw, sh[1]], [cw, sh[1]], [cw * 0.9, y0], [-cw * 0.9, y0]]);
  if (view === 'b' && o.cape) e4F(x, e4Bl([[-cw, sh[1]], [cw, sh[1]], [cw * 1.2, y0 + U * 0.05], [-cw * 1.2, y0 + U * 0.05]]), o.cape, { d: 0 });
  e4F(x, tor, (o.top && o.top.c) || '#8a6a4a', { d: U * 0.03 });
  x3TopDeco(x, U, tor, o.top || {}, sh, [0, y0], cw, view, p);
  var armC = o.sleeve || (o.top && o.top.c) || '#8a6a4a', Hd = side ? [sh[0] + U * 0.1, sh[1] + U * 0.1] : [cw * 1.1, sh[1] + U * 0.1];
  e4Pill(x, [side ? sh[0] : cw * 0.9, sh[1] + U * 0.02], Hd, U * 0.05, U * 0.045, armC);
  e4Ov(x, Hd[0], Hd[1], U * 0.028, U * 0.026, o.skin || '#d9a273', 0, { d: 0 });
  if (o.wpn) x3Weapon(x, U, Hd, side ? 0.6 : 0.3, o.wpn, side);
  x3Head(x, U, [sh[0] + (side ? U * 0.015 : 0), sh[1] - hr * 0.95], hr, view, o, p);
}

// ---------- 프레임 굽기 ----------
function x3Cfg(k, E) {
  var c = X3[k] || (E && E.art && X3A[E.art]);
  if (typeof c === 'function') c = c(k, E);
  return c || null;
}
function x3Frames(k, S, E) {
  var o = x3Cfg(k, E); if (!o) return null;
  var vis = enVis(E), H = vis * S * (o.sc || (o.rig === 'beast' ? 1 : 1.14)), n = X3_NF, V = {};
  enLW = Math.max(1, S * 0.02); EN_RIMW = 0;
  var ol = Math.max(1.3, S * (0.024 + 0.005 * vis)), fn = o.rig === 'beast' ? x3Beast : x3Man;
  ['s', 'f', 'b'].forEach(function (v) {
    var fr = [], wh = [];
    for (var i = 0; i < n; i++) { var tr = enMake(H, ol, function (x) { fn(x, H, i / n, v, o); }); fr.push({ c: tr.c, ax: tr.ax, ay: tr.ay }); wh.push({ c: tr.wh, ax: tr.ax, ay: tr.ay }); }
    V[v] = { fr: fr, wh: wh };
  });
  return { fr: V.s.fr, wh: V.s.wh, n: n, h: vis * S, views: V, img: 1, icon: V.f.fr[0], t3: 1 };
}
// 시험: __td.x3Sheet('caveman,hunter', 90) → 각 적의 옆, 앞, 뒤 걸음 8장씩
function x3Sheet(keys, S) {
  var rows = [], W = 0, Hs = 0;
  String(keys).split(',').forEach(function (k) {
    var E = ENEMIES[k]; if (!E) return; var F = x3Frames(k, S, E); if (!F) return;
    ['s', 'f', 'b'].forEach(function (v) { var V = F.views[v], w = 0, h = 0; V.fr.forEach(function (f) { w += f.c.width + 6; h = Math.max(h, f.ay + 6); }); rows.push({ V: V, w: w, h: h, k: k, v: v }); W = Math.max(W, w); Hs += h + 8; });
  });
  var c = mkC(W + 110, Math.max(1, Hs)), x = cx2(c); x.fillStyle = '#9fc06a'; x.fillRect(0, 0, c.width, c.height);
  var y = 0;
  rows.forEach(function (r) {
    var xx = 110, base = y + r.h; x.fillStyle = '#000'; x.font = '13px sans-serif'; x.fillText(r.k + ' ' + r.v, 4, y + 16);
    x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(110, base, W, 1);
    r.V.fr.forEach(function (f) { x.drawImage(f.c, xx, base - f.ay); xx += f.c.width + 6; });
    y += r.h + 8;
  });
  return c.toDataURL('image/png');
}
