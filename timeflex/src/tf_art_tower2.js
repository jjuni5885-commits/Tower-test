// ===== tf_art_tower2.js : 타임플렉스 2~15장 시대 탑 그림 =====
// art_tower3.js의 틀(t3Reg, 단위 좌표: 1 = 탑 크기, 원점 = 발밑, 위가 음수)을 쓴다. 모든 탑은 '받침 + 시대 구조물(정지 그림)' + '겨누는 무기(조각)' + '사수(조각 두 장)'로 나뉜다
// ---------- 시대 병사(단위 좌표) ----------
// arm: 'bow' | 'crank' | 'torch' | 'staff' | 'none'. hat: 'nemes' | 'legion' | 'cone' | 'kettle' | 'tricorn' | 'visor' | 'monk'
function tfSold(x, cx, by, h, pose, arm, o) {
  o = o || {}; var sk = o.skin || '#d29a6a', tu = o.tunic || '#a84a3a', lg = o.legs || twSh(tu, 0.25);
  t3L(x, [[cx - h * 0.06, by - h * 0.32], [cx - h * 0.1, by]], lg, h * 0.08); t3L(x, [[cx + h * 0.06, by - h * 0.32], [cx + h * 0.1, by]], twSh(lg, 0.15), h * 0.08);
  t3Bl(x, [[cx - h * 0.14, by - h * 0.66], [cx + h * 0.12, by - h * 0.68], [cx + h * 0.16, by - h * 0.28], [cx - h * 0.16, by - h * 0.27]], tu, { hi: 0.3, lo: 0.25 });
  if (o.armor) t3Bl(x, [[cx - h * 0.12, by - h * 0.64], [cx + h * 0.11, by - h * 0.65], [cx + h * 0.13, by - h * 0.42], [cx - h * 0.13, by - h * 0.41]], o.armor, { hi: 0.45, lo: 0.2 });
  t3L(x, [[cx - h * 0.15, by - h * 0.35], [cx + h * 0.15, by - h * 0.36]], o.belt || '#4a3020', h * 0.035, 1);
  var hx = cx + h * 0.02, hy = by - h * 0.8;
  t3E(x, hx, hy, h * 0.14, h * 0.15, sk, { hi: 0.35, lo: 0.15 });
  t3Dot(x, hx + h * 0.07, hy - h * 0.01, h * 0.025, '#2a1810');
  tfHat(x, hx, hy, h, o.hat, o);
  var sx = cx + h * 0.06, sy = by - h * 0.6;
  if (arm === 'bow') {
    var bx = sx + h * 0.34, bt = by - h * 0.95, bb = by - h * 0.3;
    t3L(x, [[sx, sy], [bx, sy - h * 0.02]], sk, h * 0.07);
    x.strokeStyle = '#2a1a10'; x.lineWidth = h * 0.05; x.beginPath(); x.moveTo(bx - h * 0.02, bt); x.quadraticCurveTo(bx + h * 0.2, sy, bx - h * 0.02, bb); x.stroke();
    x.strokeStyle = o.bowCol || '#8a5a2a'; x.lineWidth = h * 0.03; x.stroke();
    var pull = pose ? bx - h * 0.02 : sx - h * 0.08;
    x.strokeStyle = '#efe6d0'; x.lineWidth = h * 0.012; x.beginPath(); x.moveTo(bx - h * 0.02, bt); x.lineTo(pull, sy); x.lineTo(bx - h * 0.02, bb); x.stroke();
    if (!pose) { t3L(x, [[sx - h * 0.04, sy], [pull + h * 0.02, sy]], sk, h * 0.065); t3L(x, [[pull, sy], [bx + h * 0.16, sy - h * 0.01]], '#c8a060', h * 0.02, 1); }
    else t3L(x, [[sx - h * 0.04, sy], [sx - h * 0.16, sy + h * 0.06]], sk, h * 0.065);
  } else if (arm === 'crank') {
    t3L(x, [[sx, sy], [sx + h * 0.2, sy + h * (pose ? 0.02 : 0.08)]], sk, h * 0.07); t3L(x, [[sx - h * 0.1, sy + h * 0.02], [sx + h * 0.14, sy + h * (pose ? 0.08 : 0.12)]], twSh(sk, 0.12), h * 0.065);
  } else if (arm === 'torch') {
    t3L(x, [[sx, sy], [sx + h * 0.16, sy - h * 0.18]], sk, h * 0.07); t3L(x, [[sx + h * 0.16, sy - h * 0.18], [sx + h * 0.2, sy - h * 0.42]], '#6a4a2a', h * 0.035, 1);
    t3E(x, sx + h * 0.2, sy - h * 0.48, h * 0.06, h * 0.09, '#ffb040', { flat: 1, ink: 0 });
  } else if (arm === 'staff') {
    t3L(x, [[sx, sy], [sx + h * 0.14, sy - h * (pose ? 0.3 : 0.12)]], sk, h * 0.07);
    t3L(x, [[sx + h * 0.14, sy + h * 0.3], [sx + h * 0.16, sy - h * 0.62]], o.staffCol || '#c8302a', h * 0.04, 1);
  }
}
function tfHat(x, hx, hy, h, hat, o) {
  var r = h * 0.15;
  if (hat === 'nemes') { t3Bl(x, [[hx - r * 1.15, hy + r * 1.05], [hx - r * 1.05, hy - r * 0.8], [hx + r * 0.3, hy - r * 1.1], [hx + r * 0.95, hy - r * 0.5], [hx + r * 0.5, hy - r * 0.3], [hx - r * 0.25, hy - r * 0.2], [hx - r * 0.35, hy + r * 1.1]], o.hatCol || '#e8c040', { hi: 0.4, lo: 0.2 }); for (var i = 0; i < 3; i++) t3L(x, [[hx - r * (1.05 - i * 0.03), hy - r * (0.3 - i * 0.4)], [hx - r * 0.3, hy - r * (0.15 - i * 0.4)]], '#2a4aa8', r * 0.14, 1); }
  else if (hat === 'legion') { t3Bl(x, [[hx - r * 1.05, hy + r * 0.2], [hx - r * 0.95, hy - r * 0.8], [hx + r * 0.3, hy - r * 1.1], [hx + r * 1.0, hy - r * 0.5], [hx + r * 0.9, hy - r * 0.25], [hx - r * 0.35, hy - r * 0.3], [hx - r * 0.55, hy + r * 0.45]], '#c8ccd4', { hi: 0.5, lo: 0.2 }); t3Bl(x, [[hx - r * 0.8, hy - r * 0.95], [hx - r * 0.2, hy - r * 1.6], [hx + r * 0.6, hy - r * 1.45], [hx + r * 0.5, hy - r * 1.0]], '#c8302a', { hi: 0.3, lo: 0.2 }); }
  else if (hat === 'cone') { t3Pg(x, [[hx - r * 1.1, hy - r * 0.35], [hx + r * 0.05, hy - r * 1.55], [hx + r * 1.1, hy - r * 0.4]], o.hatCol || '#6a6a72', { hi: 0.45, lo: 0.2 }); t3E(x, hx + r * 0.05, hy - r * 1.65, r * 0.2, r * 0.18, '#c8302a', {}); }
  else if (hat === 'kettle') { t3Bl(x, [[hx - r * 1.45, hy - r * 0.35], [hx - r * 0.8, hy - r * 0.55], [hx - r * 0.7, hy - r * 1.15], [hx + r * 0.7, hy - r * 1.2], [hx + r * 0.85, hy - r * 0.55], [hx + r * 1.45, hy - r * 0.4]], o.hatCol || '#a8acb4', { hi: 0.5, lo: 0.2 }); }
  else if (hat === 'tricorn') { t3Pg(x, [[hx - r * 1.35, hy - r * 0.5], [hx - r * 0.6, hy - r * 1.35], [hx + r * 0.4, hy - r * 1.25], [hx + r * 1.35, hy - r * 0.55], [hx + r * 0.2, hy - r * 0.7]], '#2a2026', { hi: 0.25, lo: 0.2 }); }
  else if (hat === 'visor') { t3Bl(x, [[hx - r * 1.05, hy + r * 0.5], [hx - r * 1.0, hy - r * 0.8], [hx + r * 0.3, hy - r * 1.15], [hx + r * 1.1, hy - r * 0.6], [hx + r * 1.1, hy + r * 0.5]], '#5a5a7a', { hi: 0.45, lo: 0.2 }); t3R(x, hx + r * 0.1, hy - r * 0.35, r * 1.0, r * 0.35, r * 0.1, '#7ff4ff', { flat: 1, ink: 0.6 }); }
  else if (hat === 'monk') { t3E(x, hx, hy - r * 0.15, r * 1.02, r * 0.95, o.skin || '#d29a6a', { hi: 0.4, lo: 0.1 }); t3L(x, [[hx - r * 0.95, hy - r * 0.5], [hx + r * 0.95, hy - r * 0.55]], '#e8c040', r * 0.18, 1); }
  else { t3Bl(x, [[hx - r * 1.05, hy + r * 0.2], [hx - r * 0.95, hy - r * 0.8], [hx + r * 0.2, hy - r * 1.05], [hx + r * 0.95, hy - r * 0.55], [hx + r * 0.1, hy - r * 0.55], [hx - r * 0.5, hy + r * 0.2]], o.hair || '#2a1e16', { hi: 0.2, lo: 0.1 }); }
}
// ---------- 공용 조각 ----------
function tfWheel(x, cx, cy, r, col) {
  t3E(x, cx, cy, r, r, col || '#7a5030', { hi: 0.3, lo: 0.2 }); t3E(x, cx, cy, r * 0.72, r * 0.72, twSh(col || '#7a5030', 0.25), { flat: 1, ink: 0.4 });
  for (var i = 0; i < 4; i++) { var a = i * Math.PI / 4; t3L(x, [[cx - Math.cos(a) * r * 0.7, cy - Math.sin(a) * r * 0.7], [cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7]], col || '#7a5030', r * 0.14, 1); }
  t3E(x, cx, cy, r * 0.2, r * 0.2, '#c8a040', { hi: 0.5 });
}
function tfBlocks(x, x0, y0, w, h, col, rows) { // 돌 벽(줄눈)
  t3R(x, x0, y0, w, h, 0.02, col, { hi: 0.25, lo: 0.3 });
  x.strokeStyle = rgba(twSh(col, 0.5), 0.6); x.lineWidth = 0.012; rows = rows || 3;
  for (var i = 1; i < rows; i++) { var yy = y0 + h * i / rows; x.beginPath(); x.moveTo(x0, yy); x.lineTo(x0 + w, yy); x.stroke(); for (var j = 0; j < 4; j++) { var xx = x0 + w * (j + (i % 2) * 0.5 + 0.25) / 4; if (xx < x0 + w) { x.beginPath(); x.moveTo(xx, yy - h / rows); x.lineTo(xx, yy); x.stroke(); } } }
}
function tfCrenel(x, x0, y, w, n, col) { var cw = w / (n * 2 - 1); for (var i = 0; i < n; i++) t3R(x, x0 + i * cw * 2, y - 0.09, cw, 0.1, 0.01, col, { hi: 0.3, lo: 0.25 }); }
// 조각을 겨눈 방향으로(왼쪽을 볼 때 뒤집어 뒤집힌 모습 방지)
function tfAim(x, s, px, py, ang) { if (!s || s.empty) return; x.save(); x.translate(px, py); x.rotate(ang); if (Math.cos(ang) < 0) x.scale(1, -1); x.drawImage(s.c, -s.ax, -s.ay); x.restore(); }
// 겨누는 탑 공용 움직임: 사수(man0/man1) + 무기(gun, 자루 끝이 원점, 오른쪽을 향함) + 빛(glow)
function tfEraParts(x, t, X, Y, S, time, info) {
  var u = info.u, f = t3FireK(t), still = t3Still(t), oy = -info.ph * u;
  if (info.men && info.p.man0) tfManParts(x, t, X, Y, S, time, info);
  x.save(); x.translate(X, Y + oy);
  if (info.gun) {
    var a = t.aim == null ? -0.35 : t.aim, ang = Math.atan2(Math.sin(a) * 0.78, Math.cos(a)), rk = f * (info.recoil || 0.06) * u;
    var g = info.gun, k = info.swing ? null : 1;
    if (info.swing) { // 던지는 팔: 쉴 때 뒤로 눕고 쏠 때 앞으로 젖힘(겨눈 쪽에 따라 뒤집힘)
      var dir = Math.cos(a) < 0 ? -1 : 1, rest = info.swing[0], fire = info.swing[1], aa = rest + (fire - rest) * (f > 0 ? Math.min(1, (1 - f) * 2.5) : 0);
      x.save(); x.translate(g[0] * u, g[1] * u); x.scale(dir, 1); x.rotate(aa); x.drawImage(info.p.gun.c, -info.p.gun.ax, -info.p.gun.ay); x.restore();
    } else tfAim(x, info.p.gun, g[0] * u - Math.cos(ang) * rk, g[1] * u - Math.sin(ang) * rk, ang);
    if (f > 0.5 && info.flash) { var L = info.flash * u; t3Glow(x, g[0] * u + Math.cos(ang) * L, g[1] * u + Math.sin(ang) * L, u * 0.2 * f, info.flashC || '#ffd27a', f); }
  }
  if (info.glow) { var pz = still ? 0.2 : 0.55 + 0.45 * Math.sin(time * 2.6 + (t.id || 0)); info.glow.forEach(function (q) { t3Glow(x, q[0] * u, q[1] * u, u * q[2] * (0.8 + pz * 0.3 + f * 0.4), q[3], 0.45 + pz * 0.35 + f * 0.3); }); }
  if (info.flags) info.flags.forEach(function (q) { t3Flag(x, q[0] * u, q[1] * u, q[2] * u, q[3] * u, q[4], still ? 0 : time + (t.id || 0), 1, q[5]); });
  if (info.orbit) for (var i = 0; i < info.orbit[0]; i++) { var o2 = (still ? 0 : time) * 1.3 + i * 6.283 / info.orbit[0]; t3Glow(x, Math.cos(o2) * info.orbit[1] * u, (info.orbit[2] + Math.sin(o2) * 0.08) * u, u * 0.08, info.orbit[3], 0.85); }
  x.restore();
}
function tfMen(D, arm, o, pts, sc) {
  sc = sc || 0.5;
  D.part('man0', [-0.5, -0.9, 0.7, 0.06], function (x) { tfSold(x, 0, 0, sc, 0, arm, o); });
  D.part('man1', [-0.5, -0.9, 0.7, 0.06], function (x) { tfSold(x, 0, 0, sc, 1, arm, o); });
  return pts;
}
function tfReg2(key, draw) { t3Reg(key, draw, tfEraParts); }

// ===================== 2장 전차 궁수대 =====================
// 1 이륜 전차와 궁수 → 2 말 장식과 깃 → 3 큰 바퀴, 차양. A 황금 전차(금 차체, 태양 원반) / B 쌍두 전차(궁수 둘)
tfReg2('chariot', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, body = A ? '#e8c040' : '#c8904a', top = 0.28 + Math.min(L, 3) * 0.03;
  t3L(b, [[-0.5, -0.2], [0.55, -0.26]], '#6a4a2a', 0.04, 1);
  t3Bl(b, [[-0.38, -top], [0.3, -top - 0.02], [0.4, -top + 0.16], [0.3, -0.14], [-0.38, -0.12]], body, { hi: 0.4, lo: 0.25 });
  t3L(b, [[-0.36, -top + 0.06], [0.32, -top + 0.05]], '#2a4aa8', 0.035, 1);
  if (L >= 3) { t3L(b, [[-0.35, -top], [-0.38, -top - 0.62]], '#6a4a2a', 0.03, 1); t3Pg(b, [[-0.5, -top - 0.62], [0.2, -top - 0.66], [0.15, -top - 0.56], [-0.48, -top - 0.54]], A ? '#2a4aa8' : '#efe6d0', { hi: 0.3, lo: 0.2 }); }
  if (A) { t3E(b, -0.38, -top - 0.75, 0.1, 0.1, '#ffd24a', { hi: 0.5 }); }
  tfWheel(f, -0.08, -0.17, 0.17 + Math.min(L, 3) * 0.015, A ? '#c8a040' : '#7a5030');
  var men = V ? [[-0.22, -top], [0.12, -top]] : [[-0.05, -top]];
  tfMen(D, 'bow', { tunic: '#efe6d0', armor: A ? '#e8c040' : null, hat: 'nemes', skin: '#b07a4a', bowCol: A ? '#e8c040' : '#8a5a2a' }, men, 0.46);
  return { men: men, mounts: men.map(function (m) { return [m[0] + 0.15, m[1] - 0.45]; }), glow: A && L >= 5 ? [[-0.38, -top - 0.75, 0.22, '#ffd24a']] : null };
});
// ===================== 2장 태양 오벨리스크 =====================
tfReg2('obelisk', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, h = 0.8 + Math.min(L, 6) * 0.07, glow = [];
  function ob(cx, hh, w) {
    t3Pg(b, [[cx - w, 0], [cx + w, 0], [cx + w * 0.7, -hh], [cx, -hh - w * 0.9], [cx - w * 0.7, -hh]], '#d8c090', { hi: 0.35, lo: 0.3 });
    t3Pg(b, [[cx + w * 0.7, -hh], [cx, -hh - w * 0.9], [cx - w * 0.7, -hh]], '#ffd24a', { hi: 0.5, lo: 0.1 });
    for (var i = 0; i < 4; i++) { var yy = -hh * (0.2 + i * 0.18); t3R(b, cx - w * 0.3, yy, w * 0.6, 0.03, 0.01, '#8a6a3a', { flat: 1, ink: 0.4 }); t3Dot(b, cx, yy - 0.05, 0.015, '#2a4aa8'); }
    glow.push([cx, -hh - w * 0.45, 0.16 + (A ? 0.06 : 0), '#ffd24a']);
  }
  t3R(b, -0.4, -0.08, 0.8, 0.08, 0.02, '#c8b080', { hi: 0.3, lo: 0.3 });
  if (V) { ob(-0.2, h * 0.85, 0.1); ob(0.22, h * 0.85, 0.1); if (L >= 5) { t3L(b, [[-0.3, -h * 0.85], [0.32, -h * 0.85]], '#c8b080', 0.06); } }
  else ob(0, h, 0.13);
  if (A) { t3E(f, 0, -h - 0.35, 0.2, 0.2, '#ffd24a', { hi: 0.5, lo: 0.2 }); t3E(f, 0, -h - 0.35, 0.11, 0.07, '#efe6d0', { flat: 1, ink: 0.6 }); t3Dot(f, 0, -h - 0.35, 0.04, '#2a4aa8'); glow = [[0, -h - 0.35, 0.3, '#ffd24a']]; }
  if (L >= 2) { [-0.34, 0.34].forEach(function (sx) { t3Cyl(f, sx, -0.22, 0.05, 0.025, 0.22, '#c8b080', { top: '#e8d8a8' }); t3E(f, sx, -0.26, 0.04, 0.05, '#ff9a3a', { flat: 1, ink: 0 }); }); }
  return { glow: glow, mounts: [[glow[0][0], glow[0][1]]] };
});
// ===================== 3장 스코르피오 노포 =====================
tfReg2('scorpio', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, hg = 0.36 + Math.min(L, 3) * 0.03;
  t3L(b, [[-0.25, 0], [0, -hg]], '#6a4a2a', 0.05); t3L(b, [[0.25, 0], [0, -hg]], '#6a4a2a', 0.05); t3L(f, [[0, 0.02], [0, -hg]], '#8a5a34', 0.05);
  if (L >= 2) t3R(b, -0.45, -0.1, 0.25, 0.1, 0.02, '#8a5a34', { hi: 0.3, lo: 0.2 });
  if (L >= 3) { t3L(b, [[0.4, 0], [0.42, -0.85]], '#6a4a2a', 0.03, 1); t3Pg(b, [[0.42, -0.85], [0.66, -0.82], [0.64, -0.62], [0.42, -0.65]], '#b0302a', { hi: 0.3, lo: 0.2 }); t3E(b, 0.53, -0.74, 0.05, 0.05, '#e8c040', {}); }
  var big = V ? 0.85 : A ? 1.15 : 1;
  D.part('gun', [-0.3 * big, -0.25 * big, 0.5 * big, 0.25 * big], function (x) {
    t3R(x, -0.22 * big, -0.04 * big, 0.6 * big, 0.08 * big, 0.02, '#8a5a34', { hi: 0.35, lo: 0.25 });
    t3R(x, -0.02 * big, -0.1 * big, 0.08 * big, 0.2 * big, 0.02, A ? '#e8c040' : '#a8a070', { hi: 0.4, lo: 0.2 });
    t3L(x, [[0.0, -0.08 * big], [-0.1 * big, -0.22 * big]], '#6a4a2a', 0.03 * big, 1); t3L(x, [[0.0, 0.08 * big], [-0.1 * big, 0.22 * big]], '#6a4a2a', 0.03 * big, 1);
    x.strokeStyle = '#efe6d0'; x.lineWidth = 0.01; x.beginPath(); x.moveTo(-0.1 * big, -0.22 * big); x.lineTo(-0.2 * big, 0); x.lineTo(-0.1 * big, 0.22 * big); x.stroke();
    t3L(x, [[-0.18 * big, 0], [0.42 * big, 0]], '#c8a060', 0.02, 1); t3Pg(x, [[0.4 * big, -0.03], [0.48 * big, 0], [0.4 * big, 0.03]], '#c8ccd4', {});
    if (V) { t3R(x, -0.2 * big, 0.06 * big, 0.5 * big, 0.06 * big, 0.02, '#8a5a34', {}); }
  });
  var men = [[-0.3, -0.02]];
  tfMen(D, 'crank', { tunic: '#b0302a', armor: '#c8ccd4', hat: 'legion' }, men, 0.46);
  return { men: men, gun: [0, -hg], recoil: 0.08, flash: 0.45, flashC: '#ffe0a0', mounts: [[0, -hg]] };
});
// ===================== 3장 오나거 =====================
tfReg2('onager', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, len = 0.55 + Math.min(L, 6) * 0.04;
  t3R(b, -0.48, -0.12, 0.96, 0.1, 0.02, '#6a4a2a', { hi: 0.3, lo: 0.25 }); t3R(f, -0.5, -0.06, 1.0, 0.08, 0.02, '#8a5a34', { hi: 0.3, lo: 0.25 });
  t3L(b, [[0.12, -0.12], [0.22, -0.5]], '#6a4a2a', 0.06); t3L(f, [[0.32, -0.04], [0.22, -0.5]], '#8a5a34', 0.06);
  t3L(f, [[0.06, -0.06], [0.22, -0.5]], '#8a5a34', 0.05);
  t3R(f, 0.12, -0.54, 0.2, 0.06, 0.02, A ? '#5a5a62' : '#c8a060', {});
  t3Cyl(f, -0.22, -0.16, 0.1, 0.05, 0.08, '#5a3a24', { top: '#7a5030' });
  if (L >= 3) [-0.36, 0.36].forEach(function (cx) { tfWheel(f, cx, -0.08, 0.1); });
  if (V) { t3E(b, -0.42, -0.2, 0.08, 0.1, '#a84a2a', { hi: 0.3 }); t3E(b, -0.32, -0.18, 0.07, 0.09, '#a84a2a', {}); }
  D.part('gun', [-0.1, -len - 0.1, 0.12, 0.08], function (x) {
    t3L(x, [[0, 0], [0, -len]], '#8a5a34', 0.05);
    if (V) { t3E(x, 0, -len - 0.02, 0.08, 0.08, '#a84a2a', { hi: 0.3 }); t3E(x, 0, -len - 0.06, 0.04, 0.03, '#ff9a3a', { flat: 1, ink: 0 }); }
    else t3E(x, 0, -len - 0.02, 0.09, 0.07, '#8a7a5a', { hi: 0.3, lo: 0.2 });
  });
  var men = [[-0.4, -0.02]];
  tfMen(D, 'crank', { tunic: '#b0302a', armor: '#c8ccd4', hat: 'legion' }, men, 0.44);
  return { men: men, gun: [-0.22, -0.2], swing: [-1.25, 0.25], mounts: [[-0.1, -0.6]] };
});
// ===================== 4장 연노 진지 =====================
tfReg2('repeater', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, top = 0.18 + Math.min(L, 6) * 0.03;
  t3R(b, -0.45, -top, 0.9, top, 0.02, '#6a3a22', { hi: 0.3, lo: 0.3 }); t3R(b, -0.5, -top - 0.05, 1.0, 0.07, 0.02, '#8a5a34', { hi: 0.35, lo: 0.25 });
  for (var i = 0; i < 5; i++) t3L(f, [[-0.44 + i * 0.22, 0.02], [-0.44 + i * 0.22, -top + 0.02]], '#5a3020', 0.03, 1);
  var flags = [[0.42, -top - 0.75, 0.24, 0.16, A ? '#2a6a3a' : V ? '#ff6a2a' : '#c8302a', 1]];
  t3L(b, [[0.42, -top], [0.42, -top - 0.75]], '#3a2614', 0.03, 1);
  if (L >= 3) { t3L(b, [[-0.42, -top], [-0.42, -top - 0.6]], '#3a2614', 0.03, 1); flags.push([-0.42, -top - 0.6, 0.18, 0.12, '#e8c040', 0]); }
  D.part('gun', [-0.2, -0.16, 0.45, 0.12], function (x) {
    t3R(x, -0.15, -0.04, 0.5, 0.08, 0.02, '#6a3a22', { hi: 0.35, lo: 0.25 });
    t3R(x, -0.05, -0.12, 0.18, 0.1, 0.02, A ? '#3a6a3a' : '#8a5a34', { hi: 0.35, lo: 0.2 });
    for (var k = 0; k < 3; k++) t3L(x, [[-0.02 + k * 0.05, -0.12], [-0.02 + k * 0.05, -0.15]], '#c8a060', 0.012, 1);
    t3L(x, [[0.25, -0.12], [0.3, 0], [0.25, 0.12]], '#3a2614', 0.025, 1);
    if (V) t3E(x, 0.36, 0, 0.03, 0.03, '#ff8a3a', { flat: 1, ink: 0 });
  });
  var men = [[-0.25, -top]];
  tfMen(D, 'crank', { tunic: '#3a5a8a', armor: '#5a4a3a', hat: 'cone', skin: '#d6a070' }, men, 0.46);
  return { men: men, gun: [0.02, -top - 0.24], flash: 0.35, flags: flags, mounts: [[0.05, -top - 0.25]] };
});
// ===================== 4장 화공 수레 =====================
tfReg2('firecart', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f;
  t3Bl(b, [[-0.42, -0.42], [0.3, -0.44], [0.36, -0.14], [-0.42, -0.12]], '#7a4a2a', { hi: 0.3, lo: 0.3 });
  t3Cyl(b, -0.1, -0.62, 0.17, 0.08, 0.22, A ? '#a8502a' : '#6a4a3a', { top: '#3a2614', bands: [[0.3, 0.02, '#3a2614'], [0.7, 0.02, '#3a2614']] });
  if (V) [-0.32, 0.18].forEach(function (cx) { t3E(b, cx, -0.52, 0.07, 0.08, '#a84a2a', { hi: 0.3 }); });
  tfWheel(f, -0.26, -0.12, 0.13); tfWheel(f, 0.2, -0.12, 0.13);
  t3L(f, [[0.3, -0.18], [0.6, -0.08]], '#6a4a2a', 0.035, 1);
  D.part('gun', [-0.05, -0.12, 0.42, 0.12], function (x) {
    t3R(x, 0, -0.035, 0.26, 0.07, 0.02, '#a86a3a', { hi: 0.45, lo: 0.2 });
    t3Bl(x, [[0.22, -0.08], [0.36, -0.1], [0.4, 0.0], [0.36, 0.08], [0.22, 0.06]], A ? '#e8c040' : '#c88a3a', { hi: 0.5, lo: 0.2 });
    t3Dot(x, 0.32, -0.04, 0.015, '#2a1810');
  });
  var men = [[-0.42, -0.02]];
  tfMen(D, 'torch', { tunic: '#c8302a', hat: 'cone', skin: '#d6a070' }, men, 0.42);
  return { men: men, gun: [0.05, -0.55], recoil: 0.02, flash: 0.42, flashC: '#ff8a3a', glow: L >= 5 ? [[-0.1, -0.64, 0.18, '#ff8a3a']] : null, mounts: [[0.3, -0.55]] };
});
// ===================== 5장 룬 비석 =====================
// 1 룬을 새긴 선돌 → 2 돌무지와 뿔 장식 → 3 키 큰 비석. A 폭풍의 비석(쇠고리 띠, 더 밝은 룬) / B 오로라 비석(작은 비석 둘이 둘러섬)
tfReg2('runestone', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, h = 0.72 + Math.min(L, 6) * 0.07, w = 0.17, glow = [];
  t3E(b, 0, -0.02, 0.32, 0.14, '#7a7e80', { hi: 0.3, lo: 0.2 });
  function stone(cx, hh, ww, x) {
    t3Bl(x, [[cx - ww, 0], [cx - ww * 1.1, -hh * 0.6], [cx - ww * 0.8, -hh * 0.95], [cx, -hh], [cx + ww * 0.85, -hh * 0.9], [cx + ww * 1.05, -hh * 0.5], [cx + ww, 0]], '#8e9496', { hi: 0.35, lo: 0.3 });
    x.strokeStyle = A ? '#9af4ff' : '#5fd8f0'; x.lineWidth = 0.022; x.lineCap = 'round';
    for (var i = 0; i < 4; i++) { var yy = -hh * (0.2 + i * 0.18), xx = cx + (i % 2 ? -ww * 0.2 : ww * 0.15); x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy - hh * 0.12); x.moveTo(xx, yy - hh * 0.04); x.lineTo(xx + ww * 0.35, yy - hh * 0.1); x.stroke(); }
    glow.push([cx, -hh * 0.55, 0.12 + ww * 0.4, A ? '#9af4ff' : '#5fd8f0']);
  }
  if (V) { stone(-0.32, h * 0.55, 0.09, b); stone(0.33, h * 0.5, 0.08, b); }
  if (L >= 2) { for (var k = 0; k < 5; k++) t3E(f, -0.24 + k * 0.12, -0.03, 0.06, 0.045, k % 2 ? '#8a8e90' : '#a2a6a8', { hi: 0.35, lo: 0.25 }); }
  stone(0, h, w, b);
  if (A) { t3R(b, -w * 1.05, -h * 0.72, w * 2.1, 0.05, 0.02, '#5a5a62', { hi: 0.4, lo: 0.2 }); t3R(b, -w * 1.08, -h * 0.32, w * 2.16, 0.05, 0.02, '#5a5a62', { hi: 0.4, lo: 0.2 }); }
  if (L >= 3) { t3L(b, [[-w * 0.6, -h * 0.97], [-w * 1.6, -h - 0.12], [-w * 1.3, -h - 0.26]], '#efe4c8', 0.035, 1); t3L(b, [[w * 0.6, -h * 0.97], [w * 1.6, -h - 0.12], [w * 1.3, -h - 0.26]], '#efe4c8', 0.035, 1); }
  return { glow: glow, orbit: V && L >= 5 ? [3, 0.4, -h * 0.5, '#7affc8'] : null, mounts: [[0, -h]] };
});
// ===================== 5장 겨울 뿔나팔 =====================
// 1 나무 단 위 큰 뿔나팔 → 2 눈 덮인 받침과 방패 → 3 망루. A 혹한의 나팔(서리 낀 쇠테) / B 눈보라 나팔(나팔 둘)
tfReg2('winterhorn', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, top = 0.2 + Math.min(L, 6) * 0.04, glow = [];
  if (L >= 3) top = tfDeck(b, f, 0, 0, 0.62, top + 0.14, '#7a5a3a');
  else { t3R(b, -0.32, -top, 0.64, top, 0.03, '#7a5a3a', { hi: 0.3, lo: 0.3 }); t3R(b, -0.36, -top - 0.05, 0.72, 0.07, 0.02, '#eef4f6', { hi: 0.4, lo: 0.1 }); }
  function horn(cx, cy, sc, flip) {
    var d = flip ? -1 : 1;
    t3Bl(b, [[cx - d * 0.3 * sc, cy + 0.02], [cx - d * 0.1 * sc, cy - 0.12 * sc], [cx + d * 0.2 * sc, cy - 0.3 * sc], [cx + d * 0.34 * sc, cy - 0.34 * sc], [cx + d * 0.36 * sc, cy - 0.14 * sc], [cx + d * 0.12 * sc, cy - 0.02 * sc], [cx - d * 0.28 * sc, cy + 0.06]], '#e8d8b0', { hi: 0.4, lo: 0.25 });
    t3E(b, cx + d * 0.35 * sc, cy - 0.24 * sc, 0.06 * sc, 0.11 * sc, A ? '#b8e8ff' : '#c8a060', { hi: 0.4, lo: 0.2 });
    t3L(b, [[cx - d * 0.05 * sc, cy - 0.09 * sc], [cx + d * 0.02 * sc, cy - 0.16 * sc]], A ? '#d8f4ff' : '#c8a040', 0.03, 1);
    glow.push([cx + d * 0.38 * sc, cy - 0.24 * sc, 0.16, '#cfeeff']);
  }
  t3L(b, [[0, -top], [0.02, -top - 0.2]], '#5a3a24', 0.04, 1);
  if (V) { horn(-0.12, -top - 0.18, 0.8, 1); horn(0.12, -top - 0.22, 0.85, 0); } else horn(0, -top - 0.2, 1 + (A ? 0.15 : 0), 0);
  if (L >= 2) { t3E(f, -0.34, -0.12, 0.1, 0.1, '#b0402a', { hi: 0.3, lo: 0.2 }); t3E(f, -0.34, -0.12, 0.03, 0.03, '#c8ccd4', {}); }
  return { glow: glow, orbit: L >= 4 ? [V ? 4 : 2, 0.42, -top - 0.15, '#e8f6ff'] : null, mounts: [[0.2, -top - 0.35]] };
});
// ===================== 6장 석궁 망루 =====================
tfReg2('crossbow', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, top = 0.4 + Math.min(L, 6) * 0.05;
  tfBlocks(b, -0.36, -top, 0.72, top, '#9a9488', 4);
  tfCrenel(f, -0.38, -top + 0.02, 0.76, 4, '#b0aa9e');
  t3R(b, -0.08, -top * 0.5, 0.06, 0.14, 0.03, '#2a2420', { flat: 1, ink: 0.4 });
  var flags = [];
  if (L >= 3) { t3L(b, [[0.3, -top], [0.32, -top - 0.65]], '#3a2a1a', 0.03, 1); flags.push([0.32, -top - 0.65, 0.22, 0.14, A ? '#2a2a36' : '#5a6a8a', 1]); }
  var big = A ? 1.15 : V ? 0.9 : 1;
  D.part('gun', [-0.2 * big, -0.24 * big, 0.45 * big, 0.24 * big], function (x) {
    t3R(x, -0.16 * big, -0.035 * big, 0.5 * big, 0.07 * big, 0.02, '#6a4a2a', { hi: 0.35, lo: 0.25 });
    x.strokeStyle = '#2a2430'; x.lineWidth = 0.05 * big; x.beginPath(); x.moveTo(0.06 * big, -0.22 * big); x.quadraticCurveTo(0.2 * big, 0, 0.06 * big, 0.22 * big); x.stroke();
    x.strokeStyle = A ? '#5a5a66' : '#a8acb4'; x.lineWidth = 0.03 * big; x.stroke();
    x.strokeStyle = '#efe6d0'; x.lineWidth = 0.01; x.beginPath(); x.moveTo(0.06 * big, -0.22 * big); x.lineTo(-0.12 * big, 0); x.lineTo(0.06 * big, 0.22 * big); x.stroke();
    t3L(x, [[-0.12 * big, 0], [0.36 * big, 0]], '#c8a060', 0.018, 1); t3Pg(x, [[0.34 * big, -0.03], [0.42 * big, 0], [0.34 * big, 0.03]], '#c8ccd4', {});
    if (V) t3R(x, -0.1 * big, -0.1 * big, 0.12 * big, 0.06 * big, 0.01, '#8a5a34', {});
  });
  var men = [[-0.22, -top]];
  tfMen(D, 'crank', { tunic: '#5a6a8a', armor: '#a8acb4', hat: 'kettle', skin: '#e0b088' }, men, 0.42);
  return { men: men, gun: [0.08, -top - 0.18], flash: 0.4, flashC: '#e8f0ff', flags: flags, mounts: [[0.08, -top - 0.18]] };
});
// ===================== 6장 트레뷰셋 =====================
tfReg2('trebuchet', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, hg = 0.62 + Math.min(L, 6) * 0.05, len = 0.75 + Math.min(L, 6) * 0.05;
  t3R(b, -0.45, -0.1, 0.9, 0.08, 0.02, '#5a3a24', {}); t3R(f, -0.48, -0.05, 0.96, 0.08, 0.02, '#7a5030', { hi: 0.3, lo: 0.25 });
  t3L(b, [[-0.3, -0.08], [0, -hg]], '#5a3a24', 0.06); t3L(b, [[0.3, -0.08], [0, -hg]], '#5a3a24', 0.06);
  t3L(f, [[-0.22, -0.02], [0.02, -hg]], '#7a5030', 0.06); t3L(f, [[0.22, -0.02], [0.02, -hg]], '#7a5030', 0.06);
  t3L(f, [[-0.16, -hg * 0.45], [0.16, -hg * 0.45]], '#7a5030', 0.04);
  if (L >= 3) [-0.36, 0.36].forEach(function (cx) { tfWheel(f, cx, -0.07, 0.09); });
  var flags = L >= 4 ? [[0.02, -hg - 0.05, 0.2, 0.12, A ? '#2a2a36' : '#b0302a', 1]] : null;
  D.part('gun', [-0.2, -len * 0.75, 0.2, len * 0.3], function (x) {
    t3L(x, [[0, len * 0.22], [0, -len * 0.7]], '#8a5a34', 0.045);
    t3Box(x, 0, len * 0.3, 0.2, 0.16, 0.04, A ? '#5a5a62' : '#7a6a5a', {});
    x.strokeStyle = '#3a2614'; x.lineWidth = 0.012; x.beginPath(); x.moveTo(0, -len * 0.7); x.lineTo(-0.08, -len * 0.55); x.stroke();
    t3E(x, -0.09, -len * 0.53, 0.06, 0.05, V ? '#a84a2a' : '#8a8478', { hi: 0.3 });
    if (V) t3E(x, -0.09, -len * 0.57, 0.035, 0.03, '#ff9a3a', { flat: 1, ink: 0 });
  });
  return { gun: [0.02, -hg], swing: [-1.1, 0.5], flags: flags, mounts: [[0, -hg - 0.3]] };
});
// ===================== 7장 항구 포대 =====================
tfReg2('fort', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, top = 0.3 + Math.min(L, 6) * 0.04, n = V ? 2 : 1;
  tfBlocks(b, -0.45, -top, 0.9, top, '#8a8478', 3);
  t3Pg(f, [[-0.5, 0.02], [0.5, 0.02], [0.45, -0.08], [-0.45, -0.08]], '#a8a294', { hi: 0.3, lo: 0.3 });
  tfCrenel(f, -0.46, -top + 0.02, 0.92, 5, '#a8a294');
  var flags = [];
  if (L >= 3) { t3L(b, [[-0.36, -top], [-0.38, -top - 0.65]], '#3a2a1a', 0.03, 1); flags.push([-0.38, -top - 0.65, 0.24, 0.15, A ? '#1a1414' : '#efe6d0', 0]); }
  if (L >= 2) { t3E(f, 0.32, -top - 0.05, 0.05, 0.05, '#2a2a30', {}); t3E(f, 0.4, -top - 0.04, 0.05, 0.05, '#2a2a30', {}); t3E(f, 0.36, -top - 0.12, 0.05, 0.05, '#2a2a30', {}); }
  var big = A ? 1.2 : 1;
  D.part('gun', [-0.12, -0.1 * big, 0.5 * big, 0.1 * big], function (x) {
    t3R(x, -0.08, -0.05 * big, 0.48 * big, 0.1 * big, 0.04 * big, '#2a2a34', { hi: 0.45, lo: 0.25 });
    t3R(x, 0.36 * big, -0.065 * big, 0.06, 0.13 * big, 0.02, '#3a3a44', {});
    t3R(x, -0.1, -0.06 * big, 0.06, 0.12 * big, 0.02, '#c8a040', {});
  });
  var guns = n === 2 ? [[-0.12, -top - 0.12], [0.18, -top - 0.12]] : [[0.0, -top - 0.12]];
  t3R(b, -0.16, -top - 0.1, 0.3 + (n - 1) * 0.3, 0.1, 0.02, '#6a4a2a', { hi: 0.3, lo: 0.2 });
  return { gun: guns[0], gun2: n === 2 ? guns[1] : null, recoil: 0.1, flash: 0.55 * big, flashC: '#ffd27a', flags: flags, mounts: guns };
});
// 두 문 포대: 두 번째 포도 그림
TW_EXT.fort.parts = (function (p0) { return function (x, t, X, Y, S, time, info, g) { p0(x, t, X, Y, S, time, info, g); if (info && info.gun2 && info.p) { var i2 = {}; for (var k in info) i2[k] = info[k]; i2.gun = info.gun2; i2.glow = null; i2.flags = null; i2.men = null; tfEraParts(x, t, X, Y, S, time, i2); } }; })(TW_EXT.fort.parts);
// ===================== 7장 갤리온 (물 칸) =====================
tfReg2('galleon', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, hull = A ? '#4a2e1e' : '#7a4a2a', masts = L >= 3 ? 2 : 1, sc = V ? '#efe6d0' : '#e8dcc0';
  for (var m = 0; m < masts; m++) {
    var mx = masts === 1 ? 0 : -0.18 + m * 0.36, top = -0.95 - (m === masts - 1 ? 0 : 0.1) - Math.min(L, 6) * 0.03;
    t3L(b, [[mx, -0.15], [mx, top]], '#5a3a24', 0.03, 1);
    [[0.12, 0.38, 0.2], [0.42, 0.66, 0.24]].forEach(function (q) { var y0 = top + q[0] * 0.95, y1 = top + q[1] * 0.95; t3Bl(b, [[mx - q[2], y0], [mx + q[2], y0], [mx + q[2] + 0.03, (y0 + y1) / 2], [mx + q[2], y1], [mx - q[2], y1], [mx - q[2] + 0.03, (y0 + y1) / 2]], sc, { hi: 0.35, lo: 0.25 }); });
    if (A && m === masts - 1) { t3Dot(b, mx, top + 0.25, 0.04, '#c8302a'); }
  }
  t3Pg(b, [[-0.55, -0.32], [-0.46, -0.12], [0.42, -0.12], [0.6, -0.28], [0.46, 0.04], [-0.44, 0.04]], hull, { hi: 0.3, lo: 0.3 });
  t3Pg(f, [[-0.55, -0.32], [-0.4, -0.38], [-0.3, -0.18], [-0.46, -0.12]], twLt(hull, 0.1), { hi: 0.3, lo: 0.2 });
  t3L(f, [[-0.44, -0.08], [0.44, -0.1]], A ? '#e8c040' : '#c8a060', 0.02, 1);
  var nc = V ? 3 : A ? 4 : 3; for (var c = 0; c < nc; c++) t3E(f, -0.3 + c * 0.6 / (nc - 1), -0.02, 0.025, 0.025, '#1a1a20', { flat: 1, ink: 0 });
  t3L(f, [[0.5, -0.24], [0.72, -0.34]], '#5a3a24', 0.02, 1);
  var mx2 = masts === 1 ? 0 : 0.18, ft = -0.95 - Math.min(L, 6) * 0.03;
  return { flags: [[mx2, ft, 0.2, 0.1, A ? '#1a1414' : '#c8302a', 1]], mounts: [[0, -0.1]], gun: null };
});
// ===================== 12장 박격포 진지 =====================
// 1 모래주머니 고리와 박격포 → 2 두 겹 고리, 탄약 상자 → 3 위장망 기둥. A 중박격포(굵은 포신) / B 연속 박격포(포신 둘)
tfReg2('mortar', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, rows = L >= 2 ? 2 : 1;
  function bags(x, back) { for (var r = 0; r < rows; r++) for (var i = 0; i < 7; i++) { var an = Math.PI * (i / 6), px = Math.cos(an) * 0.42, py = (back ? -1 : 1) * Math.sin(an) * 0.18 - r * 0.08 - 0.04; if (!back && Math.sin(an) < 0.15) continue; t3E(x, px, py, 0.09, 0.055, i % 2 ? '#c8b888' : '#b8a474', { hi: 0.3, lo: 0.25 }); } }
  bags(b, 1);
  if (L >= 2) { t3Box(b, 0.3, -0.06, 0.16, 0.1, 0.05, '#5a6a3a', {}); t3Box(b, -0.32, -0.08, 0.14, 0.09, 0.04, '#5a6a3a', {}); }
  if (L >= 3) { [-0.45, 0.45].forEach(function (sx) { t3L(b, [[sx, 0], [sx, -0.75]], '#5a4a30', 0.025, 1); }); t3Pg(b, [[-0.5, -0.75], [0.5, -0.78], [0.42, -0.66], [0, -0.7], [-0.42, -0.64]], '#4e6a3a', { hi: 0.2, lo: 0.2 }); }
  var bw = A ? 0.07 : 0.05, len = A ? 0.48 : 0.4;
  D.part('gun', [-0.12, -len - 0.05, 0.12, 0.06], function (x) {
    t3R(x, -bw, -len, bw * 2, len, bw * 0.4, '#3e4a2e', { hi: 0.45, lo: 0.25 });
    t3R(x, -bw * 1.3, -len - 0.02, bw * 2.6, 0.04, 0.01, '#2a3220', {});
    if (V) { t3R(x, bw * 1.2, -len * 0.9, bw * 1.6, len * 0.9, bw * 0.3, '#3e4a2e', { hi: 0.45, lo: 0.25 }); }
  });
  t3E(f, 0, -0.08, 0.12, 0.06, '#2a3220', { hi: 0.2 });
  t3L(f, [[0, -0.08], [-0.16, 0.0]], '#2a3220', 0.025, 1); t3L(f, [[0, -0.08], [0.16, 0.0]], '#2a3220', 0.025, 1);
  bags(f, 0);
  return { gun: [0, -0.1], swing: [0.45, 0.3], mounts: [[0.1, -0.5]] };
});
// ===================== 15장 궤도 포대 =====================
tfReg2('orbital', function (D) {
  var L = D.L, A = D.A, V = D.V, b = D.b, f = D.f, h = 0.5 + Math.min(L, 6) * 0.05;
  t3Cyl(b, 0, -0.12, 0.34, 0.15, 0.12, '#4a4a66', { top: '#6a6a8a' });
  [-1, 1].forEach(function (sd) { t3L(b, [[sd * 0.26, -0.1], [sd * 0.1, -h]], '#5a5a7a', 0.05); });
  t3R(b, -0.12, -h - 0.04, 0.24, 0.1, 0.03, '#6a6a8a', { hi: 0.4, lo: 0.25 });
  for (var i = 0; i < 4; i++) t3Dot(f, -0.24 + i * 0.16, -0.08, 0.02, i % 2 ? '#a07bff' : '#7ff4ff');
  if (L >= 3) [-0.4, 0.4].forEach(function (sx) { t3L(b, [[sx, -0.05], [sx, -0.55]], '#5a5a7a', 0.025, 1); t3E(b, sx, -0.58, 0.04, 0.04, '#a07bff', { flat: 1, ink: 0.4 }); });
  D.part('gun', [-0.15, -0.14, 0.45, 0.14], function (x) {
    t3R(x, -0.12, -0.08, 0.3, 0.16, 0.05, A ? '#7a6aa8' : '#8a8aaa', { hi: 0.5, lo: 0.25 });
    t3R(x, 0.15, -0.045, 0.2, 0.09, 0.03, '#5a5a7a', { hi: 0.4, lo: 0.2 });
    t3R(x, 0.33, -0.06, 0.04, 0.12, 0.02, '#a07bff', { flat: 1, ink: 0.5 });
    if (V) { t3R(x, 0.15, -0.12, 0.16, 0.05, 0.02, '#5a5a7a', {}); t3R(x, 0.15, 0.07, 0.16, 0.05, 0.02, '#5a5a7a', {}); }
  });
  return { gun: [0, -h - 0.02], recoil: 0.03, flash: 0.38, flashC: '#c8a8ff', glow: [[0, -h * 0.35, 0.12, '#a07bff']], orbit: L >= 5 ? [V ? 3 : 1, 0.42, -h - 0.2, '#7ff4ff'] : null, mounts: [[0, -h]] };
});
// 갈래 색: 하늘색과 분홍 대신 시대 빛깔(A 청동과 붉은 기, B 청회색 돌과 쪽빛 기)
BRC[0] = { stone: '#b8a688', trim: '#e0b860', glow: '#ffcf7a', flag: '#b0402a', shield: '#b84a32' };
BRC[1] = { stone: '#8c9698', trim: '#d8dee0', glow: '#8fe0ff', flag: '#2f6f8f', shield: '#3a7aa0' };
