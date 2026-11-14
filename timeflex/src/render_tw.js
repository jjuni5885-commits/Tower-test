// ===== render_tw.js : v2.0 탑, 탄, 아군 유닛, 변신과 합체 연출 그리기 (REN1) =====
// 조각 그림은 art_fx2.js(rt...Spr), 여기는 움직임과 순서. 고리: PROJ_DRAW, UNIT_DRAW, FX_EV (docs/ENGINE.md 5절)
// render.js에서 부르는 곳: rdFrame 바닥 자국 뒤 rtGround, drawProjectiles 앞 rtUnder, drawParts 뒤 rtOver, drawTower 앞뒤 rtTwPre / rtTwPost
// 좌표: 칸(x, y)과 높이 z(칸). 화면은 WX(x), WY(y) - z * S

// ---------- 전용 입자 (연기, 불덩이, 파편, 불티, 물방울). 상한을 넘으면 오래된 것부터 버림 ----------
var RTP = [], RT_MAXP = 220, RT_DEC = [], RT_LN = [], RT_SEQ = [], RT_BEAM = {}, RT_BAN = [];
function rtCap() { return RD.lowFx ? RT_MAXP >> 1 : RT_MAXP; }
function rtBusy() { return RD.lowFx || RTP.length > rtCap() * 0.7 || fxBusy(); }
function rtAdd(o) { var c = rtCap(); if (c <= 0) return o; if (RTP.length >= c) RTP.shift(); o.t = -(o.dl || 0); RTP.push(o); return o; }
function rtRnd(a, b) { return a + Math.random() * (b - a); }
// 연기 한 뭉치: tone w 흰, g 회색, d 검은, o 불빛, b 물보라, p 보라. s0 → s1 지름(칸)
function rtSmoke(x, y, z, tone, s0, s1, life, o) {
  o = o || {};
  return rtAdd({ k: 'sm', x: x, y: y, z: z, img: rtSmokeSpr(tone, (Math.random() * 3) | 0), s0: s0, s1: s1, life: life, a: o.a == null ? 0.85 : o.a, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz == null ? 0.25 : o.vz, dr: o.dr == null ? 1.6 : o.dr, rot: Math.random() * 6.28, vr: rtRnd(-0.8, 0.8), ov: o.ov || 0, dl: o.dl || 0 });
}
function rtSparks(x, y, z, n, sp, col, life, up) {
  for (var i = 0; i < n; i++) { var a = Math.random() * 6.2832, v = sp * rtRnd(0.5, 1.2); rtAdd({ k: 'sp', x: x, y: y, z: z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: (up || 0) * rtRnd(0.3, 1), grav: up ? 9 : 0, dr: 2.5, life: life * rtRnd(0.7, 1.2), col: col, w: 0.05, ov: 1 }); }
}
function rtEmbers(x, y, z, n, sp, col, life) {
  for (var i = 0; i < n; i++) { var a = Math.random() * 6.2832, v = sp * rtRnd(0.3, 1); rtAdd({ k: 'em', x: x, y: y, z: z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: rtRnd(0.8, 2.4), grav: 6, dr: 1, life: life * rtRnd(0.7, 1.3), col: col, s0: rtRnd(0.07, 0.12), ov: 1 }); }
}
function rtChunks(x, y, z, n, sp, kind) {
  for (var i = 0; i < n; i++) { var a = Math.random() * 6.2832, v = sp * rtRnd(0.5, 1.1); rtAdd({ k: 'ck', x: x, y: y, z: z + 0.1, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.65, vz: rtRnd(2.2, 4.6), grav: 10, life: rtRnd(0.55, 0.9), img: rtChunkSpr(kind, i % 3), s0: rtRnd(0.1, 0.17), rot: Math.random() * 6, vr: rtRnd(-12, 12), ov: 1 }); }
}
// 충격파 고리: flat이면 땅에 누운 타원
function rtRing(x, y, z, r, col, life, flat, dl) { return rtAdd({ k: 'rg', x: x, y: y, z: z, r: r, col: col, life: life, flat: flat ? 1 : 0, dl: dl || 0, ov: 1 }); }
function rtDecal(k, x, y, r, life) { if (RT_DEC.length >= (RD.lowFx ? 8 : 14)) RT_DEC.shift(); RT_DEC.push({ k: k, x: x, y: y, r: r, t: 0, life: life, rot: Math.random() * 6.28 }); }
function rtStep(dt) {
  var i, p;
  for (i = RTP.length - 1; i >= 0; i--) {
    p = RTP[i]; p.t += dt; if (p.t >= p.life) { RTP.splice(i, 1); continue; } if (p.t < 0) continue;
    if (p.vx) p.x += p.vx * dt; if (p.vy) p.y += p.vy * dt;
    if (p.vz) { p.z += p.vz * dt; if (p.grav) { p.vz -= p.grav * dt; if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.3; p.vx *= 0.5; p.vy *= 0.5; if (p.k === 'dr') p.life = Math.min(p.life, p.t + 0.05); } } }
    if (p.dr) { var f = Math.max(0, 1 - p.dr * dt); p.vx *= f; p.vy *= f; if (!p.grav && p.vz) p.vz *= f; }
    if (p.vr) p.rot += p.vr * dt;
  }
  for (i = RT_DEC.length - 1; i >= 0; i--) { RT_DEC[i].t += dt; if (RT_DEC[i].t >= RT_DEC[i].life) RT_DEC.splice(i, 1); }
  for (i = RT_LN.length - 1; i >= 0; i--) { RT_LN[i].t += dt; if (RT_LN[i].t >= RT_LN[i].life) RT_LN.splice(i, 1); }
  for (i = RT_BAN.length - 1; i >= 0; i--) { RT_BAN[i].t += dt; if (RT_BAN[i].t >= RT_BAN[i].life) RT_BAN.splice(i, 1); }
  for (i = RT_SEQ.length - 1; i >= 0; i--) { var q = RT_SEQ[i]; q.t += dt; rtSeqTick(q, dt); if (q.t >= q.T) { if (q.tw && q.tw.rtSq === q) q.tw.rtSq = null; RT_SEQ.splice(i, 1); } }
}
function rtDrawP(x, S, ov) {
  var add = 0, i, p, u, d, a, X, Y;
  for (i = 0; i < RTP.length; i++) {
    p = RTP[i]; if ((p.ov || 0) !== ov || p.t < 0) continue;
    u = p.t / p.life; X = WX(p.x); Y = WY(p.y) - (p.z || 0) * S;
    if (p.k === 'sm') {
      d = lerp(p.s0, p.s1, easeOut(u)) * S; a = p.a * (u < 0.12 ? u / 0.12 : 1 - (u - 0.12) / 0.88); a *= a > 0.5 ? 1 : 0.6 + a * 0.8;
      if (add) { x.globalCompositeOperation = 'source-over'; add = 0; }
      x.globalAlpha = a > 1 ? 1 : a;
      x.drawImage(p.img, X - d / 2, Y - d / 2, d, d);
    } else if (p.k === 'fb') {
      d = lerp(p.s0, p.s1, easeOut(Math.min(1, u * 1.5))) * S; a = u < 0.45 ? 1 : 1 - (u - 0.45) / 0.55;
      if (add) { x.globalCompositeOperation = 'source-over'; add = 0; }
      x.globalAlpha = a; var c2 = Math.cos(p.rot || 0) * d / 96, s2 = Math.sin(p.rot || 0) * d / 96; x.setTransform(c2, s2, -s2, c2, X, Y); x.drawImage(p.img, -48, -48); x.setTransform(1, 0, 0, 1, 0, 0);
    } else if (p.k === 'gl') {
      d = lerp(p.s0, p.s1, easeOut(u)) * S; if (!add) { x.globalCompositeOperation = 'lighter'; add = 1; }
      x.globalAlpha = (p.a || 1) * (1 - u); x.drawImage(glowSpr(p.col, 64), X - d / 2, Y - d / 2, d, d);
    } else if (p.k === 'sp') {
      var vx = p.vx * S, vy = p.vy * S - (p.vz || 0) * S, L = Math.max(S * 0.08, Math.hypot(vx, vy) * 0.05);
      if (!add) { x.globalCompositeOperation = 'lighter'; add = 1; }
      streakAt(x, X, Y, Math.atan2(vy, vx), L, S * (p.w || 0.05), p.col, 1 - u * u); x.globalCompositeOperation = 'lighter';
    } else if (p.k === 'em') {
      d = p.s0 * S * (1 - u * 0.5); if (!add) { x.globalCompositeOperation = 'lighter'; add = 1; }
      x.globalAlpha = 1 - u * u; x.drawImage(glowSpr(p.col, 16), X - d, Y - d, d * 2, d * 2);
    } else if (p.k === 'ck') {
      d = p.s0 * S; if (add) { x.globalCompositeOperation = 'source-over'; add = 0; }
      x.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; var c3 = Math.cos(p.rot) * d / 20, s3 = Math.sin(p.rot) * d / 20; x.setTransform(c3, s3, -s3, c3, X, Y); x.drawImage(p.img, -10, -10); x.setTransform(1, 0, 0, 1, 0, 0);
    } else if (p.k === 'dr') {
      d = p.s0 * S; if (add) { x.globalCompositeOperation = 'source-over'; add = 0; }
      x.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; x.drawImage(fxImg('drop', p.col || '#cfeaff', d), X - d / 2, Y - d / 2, d, d);
    } else if (p.k === 'wc') {
      // 물기둥: 솟구쳤다가 주저앉음
      var hk = u < 0.3 ? easeOut(u / 0.3) : 1 - easeIn((u - 0.3) / 0.7) * 0.75, wk = u < 0.3 ? 0.7 + 0.3 * (u / 0.3) : 1 + (u - 0.3) * 0.5, w = p.w * S * wk, h = p.h * S * hk;
      if (add) { x.globalCompositeOperation = 'source-over'; add = 0; }
      x.globalAlpha = u > 0.6 ? (1 - u) / 0.4 : 1; x.drawImage(rtWaterColSpr(), X - w / 2, Y - h, w, h);
    } else if (p.k === 'rg') {
      d = p.r * S * 2.37 * (0.25 + 0.75 * easeOut(u)); if (add) { x.globalCompositeOperation = 'source-over'; add = 0; }
      x.globalAlpha = (1 - u) * (1 - u * 0.5); x.drawImage(rtRingSpr(p.col), X - d / 2, Y - d * (p.flat ? 0.3 : 0.5), d, d * (p.flat ? 0.6 : 1));
    } else if (p.k === 'sl') {
      // 봉인 문양: 세워진 채 돌며 번쩍
      d = p.s0 * S * (0.55 + 0.6 * easeOut(u)); if (!add) { x.globalCompositeOperation = 'lighter'; add = 1; }
      x.globalAlpha = 1 - u * u; var c5 = Math.cos(p.t * 4 + p.rot) * d / 128, s5 = Math.sin(p.t * 4 + p.rot) * d / 128; x.setTransform(c5, s5, -s5, c5, X, Y); x.drawImage(rtSealSpr(p.col), -64, -64); x.setTransform(1, 0, 0, 1, 0, 0);
    } else if (p.k === 'sw') {
      // 칼 궤적: 흰 초승달
      if (add) { x.globalCompositeOperation = 'source-over'; add = 0; }
      x.globalAlpha = 1 - u; x.lineCap = 'round'; x.strokeStyle = '#ffffff'; x.lineWidth = S * 0.07 * (1 - u * 0.6); x.beginPath(); x.arc(X, Y, p.s0 * S, p.ang - 1.1 + u * 0.6, p.ang + 0.9 + u * 0.6); x.stroke();
      x.strokeStyle = p.col; x.lineWidth = S * 0.025; x.beginPath(); x.arc(X, Y, p.s0 * S * 1.15, p.ang - 0.9 + u * 0.6, p.ang + 0.7 + u * 0.6); x.stroke(); x.lineCap = 'butt';
    } else if (p.k === 'mz') {
      // 포구 섬광
      d = p.s0 * S * (0.7 + 0.5 * u); if (!add) { x.globalCompositeOperation = 'lighter'; add = 1; }
      x.globalAlpha = 1 - u * u; var c4 = Math.cos(p.ang) * d / 96, s4 = Math.sin(p.ang) * d / 96; x.setTransform(c4, s4, -s4 * 0.85, c4 * 0.85, X, Y); x.drawImage(p.img, -16, -32); x.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
}

// ---------- 폭발 (사건 blast): 번쩍임 → 불덩이 → 충격파 고리 → 파편과 불티 → 연기 → 바닥 자국 ----------
var RT_GLC = { he: '#ffd27a', fire: '#ff9a4a', flak: '#ffc27a', emp: '#7ce8ff', ice: '#bfeaff', holy: '#fff0a0', water: '#dff4ff', dark: '#b070f0' };
function rtBlast(g, x, y, r, k, z) {
  r = clamp(r || 0.6, 0.25, 3.2); k = RT_FBC[k] ? k : 'he'; z = z == null ? (k === 'flak' ? 0.75 : 0) : z;
  var busy = rtBusy(), air = z > 0.3, i, a, v, n, q = Math.sqrt(r);
  rtAdd({ k: 'gl', x: x, y: y, z: z + 0.1, s0: r * 1.8, s1: r * 3.4, life: 0.17, col: RT_GLC[k], a: 0.9, ov: 1 });
  if (k === 'water') {
    rtAdd({ k: 'wc', x: x, y: y, z: 0, w: 0.5 + r * 0.7, h: 0.9 + r * 1.7, life: 0.8, ov: 1 });
    rtRing(x, y, 0, r * 1.2, '#dff4ff', 0.4, 1); rtDecal('ripple', x, y, r * 1.3, 1.3);
    for (i = 0, n = busy ? 4 : 9; i < n; i++) { a = Math.random() * 6.2832; v = rtRnd(0.8, 2.2) * q; rtAdd({ k: 'dr', x: x, y: y, z: 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: rtRnd(2.5, 5), grav: 10, life: 0.9, s0: rtRnd(0.07, 0.13), col: i % 2 ? '#ffffff' : '#bfe4fa', ov: 1 }); }
    for (i = 0; i < (busy ? 1 : 3); i++) rtSmoke(x + rtRnd(-0.3, 0.3) * r, y + rtRnd(-0.15, 0.15) * r, 0.1, 'b', r * 0.5, r * 1.1, rtRnd(0.5, 0.8), { vz: 0.5, a: 0.7, ov: 1 });
    fxShake(Math.min(0.06, 0.015 + r * 0.02)); return;
  }
  // 불덩이: 가운데 큰 것 하나와 곁 덩이
  rtAdd({ k: 'fb', x: x, y: y, z: z + r * 0.12, s0: r * 0.8, s1: r * (k === 'flak' ? 1.5 : 2.1), life: k === 'fire' ? 0.42 : k === 'flak' ? 0.22 : 0.3, img: rtFireSpr(k), rot: Math.random() * 6.28, ov: 1 });
  if (k !== 'flak' && k !== 'emp') for (i = 0, n = busy ? 1 : 3; i < n; i++) { a = Math.random() * 6.2832; rtAdd({ k: 'fb', x: x + Math.cos(a) * r * 0.45, y: y + Math.sin(a) * r * 0.3, z: z + r * rtRnd(0.1, 0.4), s0: r * 0.35, s1: r * rtRnd(0.9, 1.25), life: rtRnd(0.24, 0.36), img: rtFireSpr(k), rot: Math.random() * 6.28, vz: 0.6, ov: 1, dl: 0.03 + i * 0.03 }); }
  rtRing(x, y, z, r * 1.25, RT_GLC[k], 0.32, !air); if (r >= 0.9 && !busy) rtRing(x, y, z, r * 1.8, '#ffffff', 0.4, !air, 0.05);
  if (k === 'he' || k === 'fire') {
    if (!busy) rtSparks(x, y, z + 0.15, Math.round(5 + r * 4), 5 * q, '#ffd86a', 0.26, air ? 0 : 2.5);
    if (!air && !busy) rtChunks(x, y, z, Math.round(3 + r * 3), 2.6 * q, 'rock');
    for (i = 0, n = busy ? 2 : Math.round(4 + r * 2); i < n; i++) { a = i / n * 6.2832 + Math.random(); v = rtRnd(0.4, 1.1) * r; rtSmoke(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.2, z + 0.15, i % 3 ? 'd' : 'g', r * 0.5, r * rtRnd(1.0, 1.4), rtRnd(0.7, 1.15), { vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: rtRnd(0.5, 1.0), a: 0.8, ov: 1, dl: 0.08 }); }
    if (k === 'fire') { rtEmbers(x, y, z + 0.1, busy ? 3 : 8, 2.2 * q, '#ff9a3a', 0.9); for (i = 0; i < (busy ? 2 : 5); i++) rtAdd({ k: 'fb', x: x + rtRnd(-0.5, 0.5) * r, y: y + rtRnd(-0.3, 0.3) * r, z: z + 0.1, s0: r * 0.3, s1: r * 0.6, life: rtRnd(0.4, 0.6), img: rtFireSpr('fire'), rot: Math.random() * 6, vz: rtRnd(0.8, 1.6), ov: 1, dl: 0.1 + i * 0.04 }); }
    if (!air && (r >= 0.5 || RT_DEC.length < 6)) rtDecal('scorch', x, y, r * 0.78, k === 'fire' ? 3.6 : 2.8);
    fxShake(Math.min(0.13, 0.025 + r * 0.04));
  } else if (k === 'flak') {
    // 검은 연기 꽃: 여섯 뭉치가 둥글게 피어 오래 남음
    for (i = 0, n = busy ? 3 : 6; i < n; i++) { a = i / n * 6.2832 + Math.random() * 0.4; rtSmoke(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.15, z, 'd', r * 0.55, r * 1.05, rtRnd(0.7, 1.0), { vx: Math.cos(a) * r * 1.5, vy: Math.sin(a) * r * 1.2, vz: 0.05, dr: 4, a: 0.88, ov: 1, dl: 0.04 }); }
    rtSmoke(x, y, z, 'd', r * 0.7, r * 1.1, 0.8, { vz: 0.1, a: 0.85, ov: 1, dl: 0.05 });
    if (!busy) rtSparks(x, y, z, 5, 4 * q, '#ffd86a', 0.2, 0);
  } else if (k === 'emp') {
    rtRing(x, y, z, r * 1.6, '#7ce8ff', 0.42, !air, 0.07);
    for (i = 0, n = busy ? 2 : 5; i < n; i++) { a = i / n * 6.2832 + Math.random(); rtBolt([[x, y, z + 0.25], [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, z + 0.2]], '#7ce8ff', 0.22, 0.6); }
    if (!busy) rtSparks(x, y, z + 0.2, 6, 4 * q, '#9ff0ff', 0.25, 0);
  } else if (k === 'ice') {
    if (!busy) { rtChunks(x, y, z, Math.round(4 + r * 3), 2.4 * q, 'ice'); for (i = 0; i < 4; i++) { a = Math.random() * 6.2832; addP({ k: 'flake', x: x, y: y, z: z + 0.3, vx: Math.cos(a) * r * 2, vy: Math.sin(a) * r * 1.3, dr: 3, life: rtRnd(0.5, 0.8), size: 0.08, col: '#9fd4ff', rot: Math.random() * 6, vr: rtRnd(-3, 3) }); } }
    for (i = 0; i < (busy ? 2 : 4); i++) { a = Math.random() * 6.2832; rtSmoke(x, y, z + 0.1, 'b', r * 0.5, r * 1.1, rtRnd(0.5, 0.8), { vx: Math.cos(a) * r, vy: Math.sin(a) * r * 0.6, vz: 0.3, a: 0.75, ov: 1 }); }
    if (!air) rtDecal('frost', x, y, r * 1.1, 3);
  } else if (k === 'holy') {
    addP({ k: 'pillar', x: x, y: y, col: '#ffe9a0', life: 0.55, w: 0.5 + r * 0.6 });
    if (!busy) { fxRays(x, y, z + 0.3, 7, r * 1.3); fxTwinkles(x, y, z + 0.3, 6, ['#fff6c8', '#ffe27a', '#ffffff'], 2.2 * q, 0.08, 0.5); }
    if (!air) rtDecal('seal', x, y, r * 1.1, 1.3);
  } else if (k === 'dark') {
    for (i = 0, n = busy ? 3 : 6; i < n; i++) { a = i / n * 6.2832; rtSmoke(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.4, z + 0.2, 'p', r * 0.6, r * 1.0, rtRnd(0.6, 0.9), { vx: -Math.sin(a) * r * 1.6, vy: Math.cos(a) * r, vz: 0.2, dr: 3, a: 0.8, ov: 1 }); }
    if (!busy) rtSparks(x, y, z + 0.2, 7, 3.5 * q, '#c890ff', 0.3, 0);
    if (!air) rtDecal('dark', x, y, r, 3);
  }
  // 주변 적이 바깥으로 출렁
  if (g && !air) for (i = 0, n = 0; i < g.enemies.length && n < 8; i++) { var be = g.enemies[i], bd = r + 0.4; if (!be.dead && Math.abs(be.x - x) < bd && Math.abs(be.y - y) < bd) { fxJelly(be, be.x - x, be.y - y, 1); n++; } }
}

// ---------- 포구 위치: 탑 그림의 탄 나가는 자리(mounts) + 겨눈 방향으로 포신 길이. 표는 [포신 길이, 좌우 벌림, 섬광 크기, 섬광 색] ----------
var RT_MZ = { archer: [0.12, 0, 0.3, 'y'], catapult: [0.1, 0, 0.3, 'y'], arcane: [0, 0, 0.3, 'b'], frost: [0, 0, 0.3, 'b'], ballista: [0.3, 0, 0.35, 'y'], flame: [0.3, 0, 0.4, 'r'], alchemy: [0, 0, 0.3, 'y'], cannon: [0.48, 0, 0.9, 'y'],
  flak: [0.5, 0.07, 0.55, 'y'], sam: [0.26, 0.1, 0.7, 'y'], gatling: [0.5, 0.045, 0.45, 'y'], sniper: [0.62, 0, 0.6, 'y'], rocket: [0.34, 0.11, 0.6, 'r'], laser: [0.3, 0, 0.4, 'r'], tesla: [0, 0, 0.4, 'b'], airbase: [0.2, 0, 0.3, 'y'],
  warship: [0.52, 0.08, 1.0, 'y'], turtle: [0.42, 0, 0.7, 'y'], singijeon: [0.36, 0.1, 0.5, 'r'], jangseung: [0, 0, 0.3, 'y'], barracks: [0, 0, 0.3, 'y'], shrine: [0.1, 0, 0.35, 'y'], omega: [0, 0, 0.6, 'b'], dragon: [0.2, 0, 0.5, 'r'],
  fz_skybow: [0.4, 0, 0.7, 'y'], fz_fortress: [0.62, 0.1, 1.3, 'y'], fz_storm: [0, 0, 0.6, 'b'], fz_frostfire: [0, 0, 0.6, 'b'], fz_aegis: [0.4, 0.14, 0.8, 'y'], fz_arsenal: [0.5, 0.12, 0.7, 'y'], fz_carrier: [0.5, 0.1, 0.9, 'y'], fz_dragonship: [0.55, 0, 0.9, 'r'], _: [0.3, 0, 0.45, 'y'] };
function rtMuzzle(t) {
  var m = RT_MZ[t.k] || RT_MZ._, a = t.aim == null ? -Math.PI / 2 : t.aim, mo, kk = 1, info = null, S = RD.view.S, f = m[2] * (0.85 + 0.05 * (t.lvl || 1));
  try { info = towerSpr(t.k, t.lvl, t.br, S); kk = info.k || 1; } catch (e) { }
  // 탑 그림이 실제 포구를 알려 주면(info.muzzle(t) → 탑 발밑 기준 화소 {x, y}) 그것을 우선
  if (info && typeof info.muzzle === 'function') { var q = null; try { q = info.muzzle(t); } catch (e2) { } if (q && q.x === q.x && q.y === q.y) return { x: t.x + q.x / S, y: t.y, z: -0.3 - q.y / S, ang: a, f: f, c: m[3] }; }
  try { mo = mountOf(t, S); } catch (e3) { mo = { xs: 0, zs: 0.6 }; }
  var sd = m[1] ? ((t.shots || 0) % 2 ? 1 : -1) * m[1] * kk : 0, c = Math.cos(a), s = Math.sin(a), L = m[0] * kk;
  return { x: t.x + (t.k === 'archer' ? mo.xs : 0) + c * L - s * sd, y: t.y + (s * L + c * sd) * 0.8, z: mo.zs, ang: a, f: f, c: m[3] };
}

// ---------- 탄 공통 ----------
// 화면에서 움직이는 방향(높이 변화까지 반영). 처음에는 p.ang
function rtAng(p, X, Y) {
  var ux = X - RD.shx, uy = Y - RD.shy, a = p._a;
  if (p._X != null) { var dx = ux - p._X, dy = uy - p._Y; if (dx * dx + dy * dy > 0.4) { var na = Math.atan2(dy, dx); a = a == null ? na : a + angDiff(a, na) * 0.7; } }
  else if (a == null) a = p.ang != null ? p.ang : p.tgt ? Math.atan2(p.tgt.y - p.y, p.tgt.x - p.x) : -Math.PI / 2;
  p._X = ux; p._Y = uy; return (p._a = a);
}
// 지나온 길 위에 일정한 간격(step 칸)으로 꼬리 입자를 놓는다: fn(x, y, z). 속도와 프레임 수에 상관없이 간격이 고름. 돌려주는 값 = 놓은 개수
function rtTrail(p, step, fn) {
  var z = p.z || 0; if (p._tx == null) { p._tx = p.x; p._ty = p.y; p._tz = z; p._td = step * 0.5; return 0; }
  var dx = p.x - p._tx, dy = p.y - p._ty, dz = z - p._tz, d = Math.hypot(dx, dy, dz), n = 0, max = RD.lowFx ? 2 : 6; if (d < 1e-5) return 0;
  if (RD.lowFx) step *= 1.8; else if (RTP.length > RT_MAXP * 0.6) step *= 1.5;   // 붐비면 꼬리를 성기게
  for (var s0 = step - p._td; s0 <= d && n < max; s0 += step) { n++; if (fn) fn(p._tx + dx * s0 / d, p._ty + dy * s0 / d, p._tz + dz * s0 / d); }
  p._td = (p._td + d) % step; p._tx = p.x; p._ty = p.y; p._tz = z; return n;
}
function rtPK(p) { return Math.min(1.3, (0.86 + 0.045 * (p.lvl || 1)) * (1 + 0.4 * Math.min(1, +p.big || 0))); }
function rtZ(p, d) { return p.z == null ? d : p.z; }
// 분사 불꽃: 꼬리(tx, ty)에서 뒤로
function rtExhaust(x, tx, ty, a, len, wid, kind) {
  var fl = rtFlameSpr(kind || 'o'), f = 0.75 + Math.random() * 0.5, c = Math.cos(a), s = Math.sin(a), kx = len * f / 64, ky = wid * (0.85 + Math.random() * 0.3) / 24;
  x.globalCompositeOperation = 'lighter'; x.setTransform(c * kx, s * kx, -s * ky, c * ky, tx, ty); x.drawImage(fl, -64, -12); x.setTransform(1, 0, 0, 1, 0, 0);
  var gr = wid * 1.3; x.globalAlpha = 0.8; x.drawImage(glowSpr(kind === 'b' ? '#7cc8ff' : '#ffb04a', 16), tx - gr, ty - gr, gr * 2, gr * 2); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
}
function rtVar(p, d) { return p.v != null ? p.v : d; }

// ---------- 탄 그리기 (SPEC 7절) ----------
// 유도 미사일: 본체 회전, 깜빡이는 분사 불꽃, 뭉게뭉게 남는 흰 연기 꼬리, 땅 그림자
PROJ_DRAW.missile = function (x, g, p, S, time) {
  var z = rtZ(p, 0.75), X = WX(p.x), Y = WY(p.y) - z * S, a = rtAng(p, X, Y), k = rtPK(p), tw = p.src && p.src.tw;
  var v = rtVar(p, p.sub ? 2 : !tw ? 0 : tw.k === 'warship' || tw.k === 'fz_carrier' ? 3 : tw.k === 'sam' && tw.lvl >= 4 ? (tw.br ? 2 : 1) : 0), sp = rtMissileSpr(S, v);
  var c = Math.cos(a), s = Math.sin(a), hl = sp.c.width * 0.5 * k - S * 0.07 * k, tx = X - c * hl, ty = Y - s * hl, ox = c * hl / S, oy = s * hl / S;
  if (z > 0.1) shadowAt(x, X, WY(p.y), S * 0.2 * k, S * 0.07 * k, 0.22);
  var n = rtTrail(p, 0.15, function (px, py, pz) { rtSmoke(px - ox + rtRnd(-0.03, 0.03), py - oy + rtRnd(-0.03, 0.03), pz, 'w', 0.17 * k, rtRnd(0.42, 0.56) * k, rtRnd(0.7, 1.0), { vx: -c * 0.4, vy: -s * 0.4, vz: 0.1, a: 0.92 }); });
  if (n && !RD.lowFx) rtSmoke(p.x - ox, p.y - oy, z, 'o', 0.12 * k, 0.24 * k, 0.15, { vx: -c * 1.2, vy: -s * 1.2, vz: 0, a: 0.9 });
  rtExhaust(x, tx, ty, a, S * 0.42 * k, S * 0.15 * k, v === 1 || v === 3 ? 'b' : 'o');
  fxBlitS(x, sp, X, Y, a, k);
};
// 로켓: 포물선(z), 굵은 불꼬리와 회색 연기
PROJ_DRAW.rocket = function (x, g, p, S, time) {
  var z = rtZ(p, 0.5), X = WX(p.x), Y = WY(p.y) - z * S, a = rtAng(p, X, Y), k = rtPK(p), fire = p.el === 'fire' || p.fire, sp = rtRocketSpr(S, rtVar(p, fire ? 1 : p.big ? 2 : 0));
  var c = Math.cos(a), s = Math.sin(a), hl = sp.c.width * 0.5 * k - S * 0.07 * k, tx = X - c * hl, ty = Y - s * hl, ox = c * hl / S, oy = s * hl / S;
  shadowAt(x, X, WY(p.y), S * 0.14 * k, S * 0.05 * k, 0.2);
  rtTrail(p, 0.2, function (px, py, pz) { rtSmoke(px - ox + rtRnd(-0.03, 0.03), py - oy, pz, 'g', 0.11 * k, rtRnd(0.26, 0.36) * k, rtRnd(0.4, 0.6), { vx: -c * 0.4, vy: -s * 0.4, vz: 0.1, a: 0.7 }); });
  streakAt(x, tx, ty, a, S * 0.7 * k, S * 0.13 * k, fire ? '#ff5a2a' : '#ff9a3c', 0.85);
  rtExhaust(x, tx, ty, a, S * 0.36 * k, S * 0.13 * k, 'o');
  fxBlitS(x, sp, X, Y, a, k);
  if (fire && Math.random() < 0.4) rtEmbers(p.x, p.y, z, 1, 0.6, '#ff8a3a', 0.4);
};
// 신기전: 휘청이며 날고 불똥을 흘림
PROJ_DRAW.sinarrow = function (x, g, p, S, time) {
  var z = rtZ(p, 0.5), X = WX(p.x), Y = WY(p.y) - z * S, a0 = rtAng(p, X, Y), k = rtPK(p), ph = (p.t || 0) * 30 + (p._ph || (p._ph = Math.random() * 6.28)), wob = Math.sin(ph) * 0.1, a = a0 + wob;
  var sp = rtSinArrowSpr(S, rtVar(p, p.big ? 1 : 0)), c = Math.cos(a), s = Math.sin(a), off = Math.sin(ph * 0.5) * S * 0.035, hl = sp.c.width * 0.22 * k;
  X += -Math.sin(a0) * off; Y += Math.cos(a0) * off;
  shadowAt(x, X, WY(p.y), S * 0.12, S * 0.04, 0.18);
  if (rtTrail(p, 0.24)) { rtSmoke(p.x - c * 0.2, p.y - s * 0.2, z, 'w', 0.07 * k, 0.17 * k, 0.4, { a: 0.55, vz: 0.1 }); if (!RD.lowFx) rtAdd({ k: 'em', x: p.x - c * 0.12, y: p.y - s * 0.12, z: z, vx: -c * 0.8 + rtRnd(-0.5, 0.5), vy: -s * 0.8 + rtRnd(-0.5, 0.5), vz: rtRnd(-0.2, 0.6), grav: 5, life: rtRnd(0.3, 0.5), col: Math.random() < 0.5 ? '#ffd23a' : '#ff8a3a', s0: rtRnd(0.06, 0.1), ov: 0 }); }
  streakAt(x, X - c * hl * 0.2, Y - s * hl * 0.2, a, S * 0.5 * k, S * 0.09 * k, '#ffb03a', 0.8);
  rtExhaust(x, X - c * hl * 0.1, Y - s * hl * 0.1, a, S * 0.24 * k, S * 0.1 * k, 'g');
  fxBlitS(x, sp, X, Y, a, k);
};
// 대공탄: 작은 탄과 짧은 예광
PROJ_DRAW.flakshell = function (x, g, p, S, time) {
  var z = rtZ(p, 0.6), X = WX(p.x), Y = WY(p.y) - z * S, a = rtAng(p, X, Y), k = rtPK(p);
  streakAt(x, X, Y, a, S * 0.5 * k, S * 0.085 * k, '#ffc23a', 0.9); fxBlitS(x, rtShellSpr(S, 'flak'), X, Y, a, k);
};
// 예광탄: 노란 빛줄기와 흰 심
PROJ_DRAW.bullet = function (x, g, p, S, time) {
  var z = rtZ(p, 0.5), X = WX(p.x), Y = WY(p.y) - z * S, a = rtAng(p, X, Y), k = rtPK(p), col = (p.el && EL_COL[p.el]) || (p.ap ? '#ff7a3a' : '#ffd23a'), r = S * 0.09 * k;
  x.globalCompositeOperation = 'lighter'; streakAt(x, X, Y, a, S * 0.75 * k, S * 0.11 * k, col, 0.95); x.globalCompositeOperation = 'source-over';
  streakAt(x, X, Y, a, S * 0.34 * k, S * 0.05 * k, '#ffffff', 1);
  x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr(col, 16), X - r, Y - r, r * 2, r * 2); x.globalCompositeOperation = 'source-over';
};
// 함포탄: 큰 포탄, 옅은 포연, 가까워질수록 짙어지는 땅 그림자
PROJ_DRAW.navshell = function (x, g, p, S, time) {
  var z = rtZ(p, 0.6), X = WX(p.x), Y = WY(p.y) - z * S, a = rtAng(p, X, Y), k = rtPK(p), sh = clamp(1 - z / 2.5, 0.25, 1);
  shadowAt(x, WX(p.x), WY(p.y), S * 0.2 * k * (1.5 - sh * 0.5), S * 0.08 * k * (1.5 - sh * 0.5), 0.14 + 0.2 * sh);
  if (rtTrail(p, 0.26)) rtSmoke(p.x - Math.cos(a) * 0.15, p.y - Math.sin(a) * 0.15, z, 'g', 0.1 * k, 0.24 * k, 0.4, { a: 0.5, vz: 0.05 });
  streakAt(x, X, Y, a, S * 0.6 * k, S * 0.15 * k, '#ffe2a8', 0.5); fxBlitS(x, rtShellSpr(S, 'nav'), X, Y, a, k);
};
// 포환: 무쇠 공이 구르듯 날아감
PROJ_DRAW.ball = function (x, g, p, S, time) {
  var z = rtZ(p, 0.4), X = WX(p.x), Y = WY(p.y) - z * S, a = rtAng(p, X, Y), k = rtPK(p);
  shadowAt(x, WX(p.x), WY(p.y), S * 0.12 * k, S * 0.05 * k, 0.28);
  if (rtTrail(p, 0.3)) rtSmoke(p.x, p.y, z, 'g', 0.09 * k, 0.2 * k, 0.32, { a: 0.5, vz: 0.05 });
  streakAt(x, X, Y, a, S * 0.42 * k, S * 0.17 * k, '#d8d0e0', 0.55); fxBlitS(x, rtShellSpr(S, 'ball'), X, Y, 0, k);
};
// 폭탄: 위에서 떨어지고 땅 그림자가 점점 커짐
PROJ_DRAW.bomb = function (x, g, p, S, time) {
  var z = rtZ(p, 1), z0 = p._z0 || (p._z0 = Math.max(z, 0.5)), f = clamp(1 - z / z0, 0, 1), X = WX(p.x), Y = WY(p.y) - z * S, a = rtAng(p, X, Y), k = rtPK(p), GX = WX(p.x), GY = WY(p.y);
  shadowAt(x, GX, GY, S * (0.1 + 0.26 * f) * k, S * (0.04 + 0.1 * f) * k, 0.16 + 0.3 * f);
  x.globalAlpha = 0.35 + 0.4 * f; x.strokeStyle = '#ff5a4a'; x.lineWidth = Math.max(1.5, S * 0.03); x.beginPath(); x.ellipse(GX, GY, S * 0.3 * k * (1.3 - 0.3 * f), S * 0.19 * k * (1.3 - 0.3 * f), 0, 0, 6.2832); x.stroke(); x.globalAlpha = 1;
  streakAt(x, X, Y, a, S * 0.5 * k, S * 0.1 * k, '#ffffff', 0.45); fxBlitS(x, rtShellSpr(S, 'bomb'), X, Y, a, k);
};
// 부적: 종이가 팔랑이며 날고 금빛 꼬리
PROJ_DRAW.talisman = function (x, g, p, S, time) {
  var z = rtZ(p, 0.6), X = WX(p.x), Y = WY(p.y) - z * S, a = rtAng(p, X, Y), k = rtPK(p), ph = (p.t || 0) * 15 + (p._ph || (p._ph = Math.random() * 6.28)), tw = p.src && p.src.tw, v = rtVar(p, tw && tw.lvl >= 4 && tw.br === 1 ? 1 : 0);
  var sp = rtTalismanSpr(S, v), fy = 0.35 + 0.65 * Math.abs(Math.cos(ph)), ra = a + Math.PI / 2 + Math.sin(ph * 0.6) * 0.35, c = Math.cos(ra) * k, s = Math.sin(ra) * k, col = v ? '#8fc8ff' : '#ffe27a', gr = S * 0.3 * k;
  x.globalCompositeOperation = 'lighter'; streakAt(x, X, Y, a, S * 0.7 * k, S * 0.16 * k, col, 0.7); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.6; x.drawImage(glowSpr(col, 32), X - gr, Y - gr, gr * 2, gr * 2); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.setTransform(c * fy, s * fy, -s, c, X, Y); x.drawImage(sp.c, -sp.ax, -sp.ay); x.setTransform(1, 0, 0, 1, 0, 0);
  if (!RD.lowFx && Math.random() < 0.35) addP({ k: 'twk', x: p.x, y: p.y, z: z, vx: rtRnd(-0.4, 0.4), vy: rtRnd(-0.3, 0.3), life: 0.35, size: 0.05, col: col, rot: 0, vr: 3 });
};
// 어뢰: 물속 그림자 같은 몸통과 흰 항적
PROJ_DRAW.torpedo = function (x, g, p, S, time) {
  var X = WX(p.x), Y = WY(p.y), a = rtAng(p, X, Y), k = rtPK(p), c = Math.cos(a), s = Math.sin(a);
  rtTrail(p, 0.16, function (px, py) { rtSmoke(px - c * 0.2 + rtRnd(-0.04, 0.04), py - s * 0.2 + rtRnd(-0.04, 0.04), 0, 'b', 0.09 * k, rtRnd(0.2, 0.28) * k, rtRnd(0.6, 0.9), { vz: 0, a: 0.75, dr: 0 }); });
  streakAt(x, X - c * S * 0.1, Y - s * S * 0.1, a, S * 1.0 * k, S * 0.22 * k, '#ffffff', 0.55);
  x.globalAlpha = 0.82; fxBlitS(x, rtShellSpr(S, 'torp'), X, Y, a, k); x.globalAlpha = 1;
  x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = Math.max(1, S * 0.025); x.beginPath(); x.arc(X + c * S * 0.16 * k, Y + s * S * 0.16 * k, S * 0.11 * k, a - 1.1, a + 1.1); x.stroke();
};

// ---------- 줄 효과: 예광 줄기(tracer), 번개(chain), 하늘 광선 ----------
function rtBolt(pts, col, life, w) { if (RT_LN.length > 26) RT_LN.shift(); RT_LN.push({ k: 'bolt', pts: pts, col: col || '#9fd4ff', t: 0, life: life || 0.24, w: w || 1, sd: (Math.random() * 1e6) | 0 }); }
function rtBoltDraw(x, S, q) {
  var u = q.t / q.life, r = rngOf(q.sd + ((q.t / 0.05) | 0) * 131), path = new Path2D(), pts = q.pts, jit = S * 0.13, i, j;
  for (i = 0; i < pts.length - 1; i++) {
    var A = pts[i], B = pts[i + 1], X0 = WX(A[0]), Y0 = WY(A[1]) - (A[2] || 0) * S, X1 = WX(B[0]), Y1 = WY(B[1]) - (B[2] || 0) * S, dx = X1 - X0, dy = Y1 - Y0, L = Math.hypot(dx, dy) || 1, n = clamp(Math.round(L / (S * 0.3)), 2, 7), nx = -dy / L, ny = dx / L, lx = X0, ly = Y0;
    path.moveTo(X0, Y0);
    for (j = 1; j <= n; j++) {
      var f = j / n, o = j < n ? (r() - 0.5) * 2 * jit : 0, px = X0 + dx * f + nx * o, py = Y0 + dy * f + ny * o; path.lineTo(px, py);
      // 곁가지
      if (j < n && r() < 0.34 && !RD.lowFx) { var ba = Math.atan2(dy, dx) + (r() < 0.5 ? 1 : -1) * (0.5 + r() * 0.7), bl = S * (0.18 + r() * 0.22), mx = px + Math.cos(ba) * bl * 0.5 + (r() - 0.5) * jit * 0.6, my = py + Math.sin(ba) * bl * 0.5 + (r() - 0.5) * jit * 0.6; path.lineTo(mx, my); path.lineTo(px + Math.cos(ba) * bl, py + Math.sin(ba) * bl); path.moveTo(px, py); }
      lx = px; ly = py;
    }
  }
  var lw = S * 0.085 * q.w, al = 1 - u * u;
  x.lineCap = 'round'; x.lineJoin = 'round'; x.globalCompositeOperation = 'lighter';
  x.globalAlpha = 0.3 * al; x.strokeStyle = q.col; x.lineWidth = lw * 2.2; x.stroke(path);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.95 * al; x.strokeStyle = q.col; x.lineWidth = lw; x.stroke(path);
  x.globalAlpha = al; x.strokeStyle = '#ffffff'; x.lineWidth = lw * 0.42; x.stroke(path);
  x.lineCap = 'butt'; x.lineJoin = 'miter'; x.globalAlpha = 1;
}
// 광선 한 줄: 넓은 빛무리(더하기) + 흰 심
function rtBeamLine(x, X0, Y0, X1, Y1, w, col, a) {
  var dx = X1 - X0, dy = Y1 - Y0, L = Math.hypot(dx, dy); if (L < 1) return;
  var c = dx / L, s = dy / L, b = rtBeamSpr(col);
  x.setTransform(c, s, -s, c, X0, Y0); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.5 * (a == null ? 1 : a); x.drawImage(b, 0, -w * 1.4, L, w * 2.8);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = a == null ? 1 : a; x.drawImage(b, 0, -w * 0.75, L, w * 1.5);
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
}
function rtFlare(x, X, Y, d, col, rot, a) { var f = rtFlareSpr(col), c = Math.cos(rot) * d / 64, s = Math.sin(rot) * d / 64; x.globalCompositeOperation = 'lighter'; x.globalAlpha = a == null ? 1 : a; x.setTransform(c, s, -s, c, X, Y); x.drawImage(f, -32, -32); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
function rtLines(x, g, S, time) {
  for (var i = 0; i < RT_LN.length; i++) {
    var q = RT_LN[i], u = q.t / q.life;
    if (q.k === 'bolt') rtBoltDraw(x, S, q);
    else if (q.k === 'tr') {
      // 예광 줄기: 머리가 빠르게 지나가고 뒤에 가는 빛이 잠깐 남음
      var X0 = WX(q.x0), Y0 = WY(q.y0) - q.z0 * S, X1 = WX(q.x1), Y1 = WY(q.y1) - q.z1 * S, a = Math.atan2(Y1 - Y0, X1 - X0), L = Math.hypot(X1 - X0, Y1 - Y0), hu = Math.min(1, u * 2.2), hx = lerp(X0, X1, hu), hy = lerp(Y0, Y1, hu);
      if (q.sn) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.7 * (1 - u); x.strokeStyle = q.col; x.lineWidth = Math.max(1.5, S * 0.05 * (1 - u * 0.5)); x.beginPath(); x.moveTo(X0, Y0); x.lineTo(X1, Y1); x.stroke(); x.globalAlpha = 1 - u; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.02); x.stroke(); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
      if (hu < 1 || u < 0.5) { x.globalCompositeOperation = 'lighter'; streakAt(x, hx, hy, a, Math.min(L * (q.sn ? 0.9 : 0.6), S * (q.sn ? 2.4 : 1.3)) * q.w, S * 0.1 * q.w, q.col, 1 - u * 0.6); x.globalCompositeOperation = 'source-over'; streakAt(x, hx, hy, a, Math.min(L * 0.3, S * 0.5), S * 0.045 * q.w, '#ffffff', 1 - u * 0.5); }
    } else if (q.k === 'sky') {
      // 천벌포: 하늘에서 내리꽂는 빛기둥. 가늘게 조준 → 굵게 터짐 → 가늘어지며 사라짐
      var GX = WX(q.x), GY = WY(q.y), w = S * q.r * (u < 0.18 ? 0.12 + u * 0.6 : u < 0.55 ? 0.9 + 0.1 * Math.sin(time * 60) : 0.9 * (1 - (u - 0.55) / 0.45)), al = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45;
      rtBeamLine(x, GX, -S, GX, GY, w, q.col, al); rtFlare(x, GX, GY, S * q.r * 2.6 * (0.6 + al * 0.6), q.col, time * 3, al);
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.7 * al; x.drawImage(glowSpr(q.col, 64), GX - S * q.r * 1.6, GY - S * q.r * 0.9, S * q.r * 3.2, S * q.r * 1.8); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    }
  }
}
// 탑 광선(beam2): 탑 상태 t.beams = [[x0, y0, x1, y1, 굵기 0~1]...](t.fireT > 0일 때), t.busy(세기 0~1), t.beamTgt(주 표적). 첫 줄은 포구에서 시작, 갈라진 줄(프리즘)은 무지개색
// 사건 beamOn에 표적이 실려 오면({tw, en | tgts | x1, y1, pierce}) 그것을 그림
var RT_BCOL = { laser: '#ff4f7a', fz_storm: '#a08cff', omega: '#ffe27a', arcane: '#ff8ad8', _: '#ff5a8a' };
function rtBeams(x, g, S, time) {
  for (var i = 0; i < g.towers.length; i++) {
    var t = g.towers[i], ev = RT_BEAM[t.id], st = t.st || {}, segs = null, j;
    if (t.stunT > 0 || t.frozenT > 0 || t.rtSq) continue;
    if (t.beams && t.beams.length && t.fireT > 0) segs = t.beams;
    else if (ev) { segs = []; (ev.tgts || [ev.en || ev.tgt]).forEach(function (e) { if (e && !e.dead) segs.push([t.x, t.y, e.x, e.y, 1, e]); }); if (ev.x1 != null) segs.push([t.x, t.y, ev.x1, ev.y1, 1]); }
    else if (st.kind === 'beam2' && t.beamTgt && !t.beamTgt.dead && t.fireT > 0) segs = [[t.x, t.y, t.beamTgt.x, t.beamTgt.y, 1]];
    if (!segs || !segs.length) continue;
    var f = clamp(t.busy == null ? 0.6 : t.busy, 0.12, 1), line = !!st.line || (ev && ev.pierce), ult = t.lvl >= 6, base = line && ult ? '#ffd23a' : RT_BCOL[t.k] || RT_BCOL._, m = rtMuzzle(t), MX = WX(m.x), MY = WY(m.y) - m.z * S;
    var w0 = S * (0.07 + 0.13 * f) * (1 + 0.1 * Math.sin(time * 45 + t.id)) * (line ? 1.45 : 1), mt = t.beamTgt && !t.beamTgt.dead ? t.beamTgt : null, mz = mt ? (mt.kind === 'obs' ? 0.3 : fxBodyZ(mt)) : 0.35;
    for (j = 0; j < segs.length && j < 9; j++) {
      var b = segs[j], own = Math.abs(b[0] - t.x) < 0.01 && Math.abs(b[1] - t.y) < 0.01, e = b[5], ez = e ? fxBodyZ(e) : mt && Math.abs(b[2] - mt.x) < 0.01 && Math.abs(b[3] - mt.y) < 0.01 ? mz : 0.35;
      var X0 = own ? MX : WX(b[0]), Y0 = own ? MY : WY(b[1]) - mz * S, X1 = WX(b[2]), Y1 = WY(b[3]) - ez * S, sub = !own, col = sub ? FX_RAIN[(j - 1 + 6) % 6] : ult && !line && segs.length > 1 ? '#ffffff' : base, w = w0 * (sub ? 0.45 + 0.4 * (b[4] == null ? 1 : b[4]) : 1);
      rtBeamLine(x, X0, Y0, X1, Y1, w, col === '#ffffff' ? '#ffd0e0' : col);
      if (!RD.lowFx) for (var q = 0; q < (sub ? 1 : 2); q++) { var bu = (time * 2.2 + q * 0.5 + j * 0.3) % 1; rtFlare(x, lerp(X0, X1, bu), lerp(Y0, Y1, bu), w * 2.6, col, time * 4, 0.8); }
      rtFlare(x, X1, Y1, S * (0.3 + 0.5 * f) * (sub ? 0.7 : 1), col, -time * 5 + j, 1);
      if (Math.random() < 0.3 && !rtBusy() && RD.live !== false) rtSparks(b[2], b[3], ez, 1, 2.2, lit(col, 0.4), 0.22, 1.5);
    }
    rtFlare(x, MX, MY, S * (0.3 + 0.3 * f), base, time * 6, 1);
  }
}

// ---------- 사건 연출 (FX_EV) ----------
FX_EV.blast = function (g, ev) { if (ev.orbital) return; if (ev.k === 'orbital' || ev.k === 'sky') { rtSkyBeam(g, ev.x, ev.y, ev.r || 1); return; } rtBlast(g, ev.x, ev.y, ev.sub ? (ev.r || 0.6) * 0.8 : ev.r, ev.k, ev.z); };   // orbital: 1 = 천벌포(orbital 사건이 따로 옴)
FX_EV.orbital = function (g, ev) { rtSkyBeam(g, ev.x, ev.y, ev.r || 1); };
function rtSkyBeam(g, x, y, r) {
  if (RT_LN.length > 26) RT_LN.shift(); RT_LN.push({ k: 'sky', x: x, y: y, r: r, col: '#ffe27a', t: 0, life: 0.7 });
  rtDecal('scorch', x, y, r * 1.1, 5); rtRing(x, y, 0, r * 1.6, '#ffe27a', 0.45, 1, 0.12); rtRing(x, y, 0, r * 2.3, '#ffffff', 0.5, 1, 0.2);
  rtAdd({ k: 'fb', x: x, y: y, z: 0.2, s0: r * 0.8, s1: r * 2.4, life: 0.45, img: rtFireSpr('holy'), rot: 0, ov: 1, dl: 0.12 });
  rtChunks(x, y, 0, 6, 3.2, 'rock'); rtEmbers(x, y, 0.2, 8, 3, '#ffd86a', 1.0);
  for (var i = 0; i < 5; i++) { var a = i / 5 * 6.2832; rtSmoke(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.25, 0.2, 'd', r * 0.6, r * 1.4, rtRnd(0.9, 1.3), { vx: Math.cos(a) * r, vy: Math.sin(a) * r * 0.6, vz: 0.8, a: 0.8, ov: 1, dl: 0.3 }); }
  fxShake(0.14); if (fxScreenOk() && !(RD.fxFlCd > 0)) { RD.flash = Math.max(RD.flash, 0.16); RD.flashCol = '#fff6d0'; RD.fxFlCd = 0.35; }
}
// 포구 섬광 {tw, n(발 수), paper(부적), arrow(화살), rocket}: 겨눈 쪽으로 뻗는 별빛과 작은 포연
FX_EV.muzzle = function (g, ev) {
  var t = ev.tw; if (!t) return; var m = rtMuzzle(t), big = m.f >= 0.8, c = Math.cos(m.ang), s = Math.sin(m.ang), i;
  if (ev.paper || ev.arrow) {   // 부적, 화살: 불빛 없이 반짝임만
    rtAdd({ k: 'gl', x: m.x, y: m.y, z: m.z, s0: 0.3, s1: 0.7, life: 0.16, col: ev.paper ? '#ffe27a' : '#ffffff', a: 0.8, ov: 1 });
    if (!rtBusy()) addP({ k: 'twk', x: m.x, y: m.y, z: m.z, size: 0.14, col: ev.paper ? '#ffe27a' : '#ffffff', life: 0.18, rot: 0, vr: 4 });
    return;
  }
  rtAdd({ k: 'mz', x: m.x, y: m.y, z: m.z, ang: m.ang, s0: m.f * (ev.big ? 1.4 : 1), life: big ? 0.11 : 0.075, img: rtMuzzleSpr(ev.rocket ? 'r' : m.c), ov: 1 });
  if (big || ev.rocket || (!rtBusy() && Math.random() < 0.3)) for (i = 0; i < (big ? 3 : 1); i++) rtSmoke(m.x + c * 0.1, m.y + s * 0.08, m.z, 'g', m.f * 0.22, m.f * rtRnd(0.4, 0.6), rtRnd(0.35, 0.6), { vx: c * rtRnd(0.6, 1.6), vy: s * rtRnd(0.5, 1.2), vz: 0.25, a: 0.6, dr: 3, ov: 1 });
  if (big) fxShake(0.012);
};
// 미사일, 로켓 발사 {tw, n(발 수), u(쏜 유닛), x, y, z, sky, mega}: 발사대 뒤로 뿜는 흰 연기와 번쩍임
FX_EV.launch = function (g, ev) {
  var t = ev.tw, u = ev.u, m, i; if (!t && !u) return;
  if (u) { rtAdd({ k: 'gl', x: u.x, y: u.y, z: u.z || 0.9, s0: 0.3, s1: 0.8, life: 0.14, col: '#ffd27a', a: 0.9, ov: 1 }); rtSmoke(u.x, u.y, u.z || 0.9, 'w', 0.12, 0.3, 0.4, { a: 0.7, vz: 0 }); return; }
  m = rtMuzzle(t); var c = Math.cos(m.ang), s = Math.sin(m.ang), n = rtBusy() ? 3 : Math.min(10, 5 + (ev.n || 1) + (ev.mega ? 3 : 0));
  rtAdd({ k: 'gl', x: m.x, y: m.y, z: m.z, s0: 0.5, s1: ev.mega ? 1.6 : 1.1, life: 0.14, col: '#ffd27a', a: 0.9, ov: 1 });
  if (ev.sky) { for (i = 0; i < n; i++) { var a = i / n * 6.2832; rtSmoke(t.x, t.y + 0.2, 0.1, 'w', 0.18, rtRnd(0.45, 0.65), rtRnd(0.6, 0.9), { vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.1, vz: 0.2, a: 0.85, dr: 3, ov: i % 2 }); } return; }
  rtAdd({ k: 'mz', x: m.x - c * 0.25, y: m.y - s * 0.2, z: m.z, ang: m.ang + Math.PI, s0: 0.7, life: 0.12, img: rtMuzzleSpr('y'), ov: 1 });
  for (i = 0; i < n; i++) { var sp = rtRnd(0.8, 2.4), wb = rtRnd(-0.5, 0.5); rtSmoke(m.x - c * 0.15, m.y - s * 0.12, m.z * rtRnd(0.6, 1), 'w', 0.16, rtRnd(0.42, 0.62), rtRnd(0.6, 1.0), { vx: -(c * Math.cos(wb) - s * Math.sin(wb)) * sp, vy: -(s * Math.cos(wb) + c * Math.sin(wb)) * sp * 0.8, vz: rtRnd(0, 0.5), a: 0.85, dr: 2.6, ov: i % 2 }); }
  if (!rtBusy()) for (i = 0; i < 3; i++) rtSmoke(t.x + rtRnd(-0.25, 0.25), t.y + 0.3 + rtRnd(-0.08, 0.08), 0.05, 'g', 0.2, 0.5, 0.7, { vx: rtRnd(-0.8, 0.8), vy: rtRnd(-0.2, 0.3), vz: 0.15, a: 0.5 });
};
// 예광 줄기 {x0, y0, z0, x1, y1, z1, k: 'bullet' | 'sniper' | 'plane' | 'icpt', tw, u, en, crit}: 탑 자리에서 시작하면 포구로 옮김
FX_EV.tracer = function (g, ev) {
  var sn = ev.k === 'sniper' || ev.k === 'snipe' || ev.k === 'rail', z0 = ev.z0, z1 = ev.z1, x0 = ev.x0, y0 = ev.y0, t = ev.tw, m;
  if (t && !ev.u && t.aim != null && (x0 == null || (Math.abs(x0 - t.x) < 0.01 && Math.abs(y0 - t.y) < 0.01))) { m = rtMuzzle(t); x0 = m.x; y0 = m.y; z0 = m.z; }
  if (x0 == null || ev.x1 == null) return;
  if (z1 == null) z1 = ev.en && !ev.en.dead ? fxBodyZ(ev.en) : 0.3; if (z0 == null) z0 = ev.k === 'plane' ? 0.9 : 0.55;
  if (RT_LN.length > 26) RT_LN.shift();
  var col = ev.col || (ev.el && EL_COL[ev.el]) || (sn ? (ev.crit ? '#ffe27a' : '#bfe8ff') : ev.k === 'icpt' ? '#9ff0ff' : ev.k === 'ap' ? '#ff8a3a' : '#ffd23a');
  RT_LN.push({ k: 'tr', x0: x0, y0: y0, z0: z0, x1: ev.x1, y1: ev.y1, z1: z1, sn: sn ? 1 : 0, w: sn ? (ev.crit ? 1.7 : 1.3) : ev.k === 'plane' ? 0.8 : 1, col: col, t: 0, life: sn ? 0.32 : 0.11 });
  if (!rtBusy() || sn) { rtSparks(ev.x1, ev.y1, z1, sn ? 5 : 2, sn ? 4 : 2.6, sn ? '#e8f6ff' : '#ffe27a', 0.18, 1.5); if (sn) rtAdd({ k: 'gl', x: ev.x1, y: ev.y1, z: z1, s0: 0.4, s1: ev.crit ? 1.3 : 0.9, life: 0.14, col: col, a: 0.9, ov: 1 }); }
};
// 연쇄 번개 {pts: [[x, y(높이만큼 올린 값)] 또는 [x, y, z]...], tw, lvl, k(쏜 탑 키 또는 'emp' | 'gold'), el, sky}
var RT_BOLTC = { tesla: '#a8b8ff', fz_storm: '#c8a8ff', shrine: '#ffe27a', arcane: '#c8a8ff', emp: '#7ce8ff', gold: '#ffe27a', holy: '#ffe27a' };
FX_EV.chain = function (g, ev) {
  var pts = ev.pts; if (!pts || pts.length < 2) return; var t = ev.tw, i;
  var col = ev.col || (ev.el && ev.el !== 'bolt' && EL_COL[ev.el]) || (t && t.k === 'tesla' && t.lvl >= 4 && t.br === 1 ? '#7ce8ff' : RT_BOLTC[ev.k] || '#a8b8ff');
  rtBolt(pts, col, ev.sky ? 0.3 : 0.26, (0.8 + (ev.lvl || 3) * 0.08) * (ev.sky ? 1.3 : 1));
  for (i = 1; i < pts.length; i++) { var z = pts[i][2] || 0; rtAdd({ k: 'gl', x: pts[i][0], y: pts[i][1], z: z, s0: 0.35, s1: ev.sky ? 1.2 : 0.8, life: 0.16, col: col, a: 0.9, ov: 1 }); if (!rtBusy()) rtSparks(pts[i][0], pts[i][1], z, 3, 2.6, '#ffffff', 0.2, 1.2); }
  if (ev.sky) { var e = pts[pts.length - 1]; rtRing(e[0], e[1] + 0.3, 0, 0.7, col, 0.3, 1); fxShake(0.02); }
  if (ev.k === 'emp') rtBlast(g, pts[0][0], pts[0][1], ev.r || 1.2, 'emp', pts[0][2] || 0.4);
};
// 범위 없는 탄이 맞음 {x, y, z, k(탄 종류 또는 'sword'), en, el, tw, crit}
FX_EV.impact = function (g, ev) {
  var k = ev.k, x = ev.x, y = ev.y, z = ev.z || 0.3, col = (ev.el && EL_COL[ev.el]) || null, busy = rtBusy();
  if (ev.en && ev.tw && !ev.en.dead) fxJelly(ev.en, ev.en.x - ev.tw.x, ev.en.y - ev.tw.y, 0.5);
  if (k === 'talisman') { rtAdd({ k: 'sl', x: x, y: y, z: z + 0.1, s0: 0.75, col: col || '#ffe27a', life: 0.45, rot: Math.random() * 6, ov: 1 }); rtAdd({ k: 'gl', x: x, y: y, z: z, s0: 0.5, s1: 1.1, life: 0.2, col: '#ffe27a', a: 0.8, ov: 1 }); if (!busy) fxConfetti(x, y, z, 3, 1.6, 0.05, 0.6, ['#ffe89a', '#fff6d0', '#e8443a']); }
  else if (k === 'sword') { rtAdd({ k: 'sw', x: x, y: y, z: z + 0.15, s0: ev.crit ? 0.36 : 0.26, ang: ev.u ? Math.atan2(y - ev.u.y, x - ev.u.x) : 0, col: ev.crit ? '#ffe27a' : '#bfe8ff', life: 0.18, ov: 1 }); if (!busy) rtSparks(x, y, z + 0.1, ev.crit ? 4 : 2, 2.4, '#ffffff', 0.16, 1.2); }
  else if (k === 'sinarrow') { rtAdd({ k: 'gl', x: x, y: y, z: z, s0: 0.3, s1: 0.7, life: 0.14, col: col || '#ffb04a', a: 0.9, ov: 1 }); if (!busy) { rtEmbers(x, y, z, 2, 1.6, '#ffb03a', 0.4); rtSmoke(x, y, z, 'g', 0.12, 0.3, 0.35, { a: 0.6, ov: 1 }); } }
  else if (k === 'torpedo') rtBlast(g, x, y, 0.45, 'water', 0);
  else if (k === 'missile' || k === 'rocket' || k === 'navshell' || k === 'ball' || k === 'bomb') rtBlast(g, x, y, 0.35, 'he', z);
  else { rtAdd({ k: 'gl', x: x, y: y, z: z, s0: 0.22, s1: 0.55, life: 0.1, col: col || '#ffe27a', a: 0.9, ov: 1 }); if (!busy) rtSparks(x, y, z, 2, 2.6, col || '#ffe27a', 0.16, 1.5); }
};
// 능력 봉인이 걸리는 순간 {en, x, y}: 금빛 문양이 적 위에서 번쩍
FX_EV.seal = function (g, ev) { var z = ev.en && !ev.en.dead ? fxBodyZ(ev.en) : 0.4; rtAdd({ k: 'sl', x: ev.x, y: ev.y, z: z, s0: 0.9, col: '#ffe27a', life: 0.5, rot: 0, ov: 1 }); rtRing(ev.x, ev.y, z, 0.5, '#ffe27a', 0.3, 0); };
// 병사가 쓰러짐 {x, y}
FX_EV.unitDown = function (g, ev) { fxPuffs(ev.x, ev.y, 0.15, 4, ['#ffffff', '#efe6f4'], 1.2, 0.14, 0.4); fxStar1(ev.x, ev.y, 0.4, 0.12, '#bfe8ff', 0.3); };
FX_EV.beamOn = function (g, ev) { if (ev.tw && (ev.tgts || ev.en || ev.tgt || ev.x1 != null)) RT_BEAM[ev.tw.id] = ev; };   // 표적이 실려 오면 그것을, 아니면 탑 상태(t.beams)를 그림
FX_EV.beamOff = function (g, ev) { if (ev.tw) delete RT_BEAM[ev.tw.id]; };
// 비행기 출격: 활주로 먼지와 바람줄
FX_EV.planeOut = function (g, ev) {
  var t = ev.tw; if (!t) return; var a = ev.ang != null ? ev.ang : t.aim != null ? t.aim : -0.5, c = Math.cos(a), s = Math.sin(a), i;
  for (i = 0; i < (rtBusy() ? 2 : 5); i++) rtSmoke(t.x - c * i * 0.12, t.y + 0.25 - s * i * 0.08, 0.05, 'w', 0.14, rtRnd(0.3, 0.45), rtRnd(0.4, 0.7), { vx: -c * rtRnd(0.6, 1.6), vy: -s * rtRnd(0.4, 1.2), vz: 0.2, a: 0.6, dl: i * 0.03 });
  for (i = 0; i < 3; i++) rtAdd({ k: 'sp', x: t.x, y: t.y + (i - 1) * 0.08, z: 0.3, vx: c * 6, vy: s * 5, vz: 1.2, dr: 2, life: 0.3, col: '#ffffff', w: 0.04, ov: 1, dl: i * 0.04 });
};

// ---------- 변신과 합체 ----------
// 강화 사건: 4, 6단계는 바로 뒤에 transform이 와서 큰 연출을 하므로 여기서는 화력 글자와 소리만
FX_EV.upgrade = function (g, e) {
  if (!(e.lvl === 4 || e.lvl === 6) || !e.tw) return false;
  var s1 = towerStats(e.k, e.lvl, e.br), s0 = towerStats(e.k, e.lvl - 1, e.lvl >= 5 ? e.br : 0), p1 = powerOf(s1), p0 = powerOf(s0);
  if (p0 > 0 && p1 > p0) { addP({ k: 'text', x: e.x, y: e.y + 0.15, z: 0.2, vz: 0.35, txt: '화력 +' + Math.round((p1 / p0 - 1) * 100) + '%', col: '#ffe066', life: 1.9, dl: 0.55, big: false }); }
  sfx('upgradeBig', 0.6); vib(e.lvl >= 6 ? 40 : 25);
  return true;
};
FX_EV.transform = function (g, ev) {
  var t = ev.tw; if (!t) return; var ult = ev.ult || ev.lvl >= 6, L0 = Math.max(1, (ev.lvl || t.lvl) - 1), B0 = L0 >= 4 ? (ev.br == null ? t.br : ev.br) : 0;
  var q = { k: 'tf', tw: t, t: 0, T: ult ? 1.25 : 0.95, cut: ult ? 0.6 : 0.42, L0: L0, B0: B0, ult: ult ? 1 : 0, col: ult ? '#ffe27a' : BRC[t.br ? 1 : 0].glow, name: towerTitle(t.k, t.lvl, t.br), x: t.x, y: t.y };
  t.rtSq = q; t.upAt = null; RT_SEQ.push(q);
  addP({ k: 'pillar', x: t.x, y: t.y + 0.3, col: q.col, life: q.cut + 0.35, w: ult ? 1.5 : 1.1 });
  ringFx(t.x, t.y + 0.3, 0.7, q.col, 0.4, 0.07);
};
FX_EV.fuse = function (g, ev) {
  var t = ev.tw; if (!t) return;
  var q = { k: 'fu', tw: t, a: ev.a, b: ev.b, t: 0, T: 1.5, cut: 0.9, col: (TOWERS[t.k] && TOWERS[t.k].col) || '#ffe27a', name: TOWERS[t.k] ? TOWERS[t.k].name : '', x: t.x, y: t.y };
  if (q.a && q.a.x == null) q.a = null; if (q.b && q.b.x == null) q.b = null;
  if (q.a && Math.abs(q.a.x - t.x) < 0.01 && Math.abs(q.a.y - t.y) < 0.01 && q.b) { q.ax = q.a.x - (q.b.x - q.a.x) * 0.35; q.ay = q.a.y - (q.b.y - q.a.y) * 0.35; } else if (q.a) { q.ax = q.a.x; q.ay = q.a.y; }
  if (q.b && Math.abs(q.b.x - t.x) < 0.01 && Math.abs(q.b.y - t.y) < 0.01 && q.a) { q.bx = q.b.x - (q.a.x - q.b.x) * 0.35; q.by = q.b.y - (q.a.y - q.b.y) * 0.35; } else if (q.b) { q.bx = q.b.x; q.by = q.b.y; }
  t.rtSq = q; RT_SEQ.push(q);
  addP({ k: 'pillar', x: t.x, y: t.y + 0.3, col: '#ffffff', life: q.cut + 0.3, w: 1.6 });
};
function rtBanner(head, name, x, y, col, big) { RT_BAN.push({ head: head, name: name, x: x, y: y, col: col, big: big ? 1 : 0, t: 0, life: big ? 1.9 : 1.5 }); if (RT_BAN.length > 3) RT_BAN.shift(); }
function rtSeqTick(q, dt) {
  var t = q.tw, u = q.t / q.cut, a, i;
  if (q.t < q.cut) {
    // 모으는 동안: 빛 알갱이가 탑으로 빨려 들어감
    if (dt > 0 && !RD.lowFx && Math.random() < 0.7) { a = Math.random() * 6.2832; var d = rtRnd(0.8, 1.4) * (q.k === 'fu' ? 1.4 : 1); addP({ k: 'twk', x: q.x + Math.cos(a) * d, y: q.y + 0.1 + Math.sin(a) * d * 0.6, z: rtRnd(0.2, 1.2), vx: -Math.cos(a) * d * 2.4, vy: -Math.sin(a) * d * 1.5, life: 0.4, size: rtRnd(0.06, 0.1), col: fxPick([q.col, '#ffffff', '#ffe066']), rot: 0, vr: 4 }); }
    return;
  }
  if (q.fired) return; q.fired = 1;
  // 터지는 순간
  var big = q.k === 'fu' || q.ult, z = 0.7;
  rtAdd({ k: 'gl', x: q.x, y: q.y, z: z, s0: 1.4, s1: big ? 5 : 3.4, life: 0.3, col: '#ffffff', a: 1, ov: 1 });
  rtAdd({ k: 'fb', x: q.x, y: q.y, z: z, s0: 0.8, s1: big ? 3.0 : 2.0, life: 0.3, img: rtFireSpr('holy'), rot: 0, ov: 1 });
  rtRing(q.x, q.y + 0.3, 0, big ? 2.4 : 1.5, q.col, 0.45, 1); rtRing(q.x, q.y + 0.3, 0, big ? 3.4 : 2.1, '#ffffff', 0.55, 1, 0.07); rtRing(q.x, q.y, z, big ? 1.5 : 1.0, '#ffffff', 0.3, 0);
  fxRays(q.x, q.y, z, big ? 12 : 8, big ? 2.0 : 1.4); fxStarRing(q.x, q.y, z, fxN(big ? 12 : 8), big ? 1.6 : 1.1, 0.11);
  fxConfetti(q.x, q.y + 0.3, 1.0, big ? 30 : 16, 2.8, 0.06, 1.2); fxTwinkles(q.x, q.y, z, big ? 10 : 6, [q.col, '#ffffff', '#ffe066'], 3, 0.09, 0.6);
  if (q.k === 'fu') { rtEmbers(q.x, q.y, z, 10, 3.4, q.col, 1.0); rtDecal('seal', q.x, q.y + 0.3, 1.5, 1.6); }
  fxShake(q.k === 'fu' ? 0.13 : q.ult ? 0.09 : 0.05); vib(q.k === 'fu' ? [40, 30, 80] : q.ult ? 50 : 25);
  if (fxScreenOk() && big) { RD.flash = Math.max(RD.flash, q.k === 'fu' ? 0.3 : 0.2); RD.flashCol = '#fffbe8'; }
  rtBanner(q.k === 'fu' ? '합체!' : q.ult ? '궁극 변신!' : '변신!', q.name, q.x, q.y, q.col, big);
  if (t) t.upAt = null;
}
// 이름 띠: 어두운 남색 띠에 금빛 테두리, 위에 작은 머리말, 아래 큰 이름. 한 번 구워 둠
function rtBannerC(b, S) {
  if (b.cv) return b.cv;
  var dpr = RD.view.dpr || 1, fsN = Math.round(Math.max(S * (b.big ? 0.46 : 0.4), 14 * dpr)), fsH = Math.round(fsN * 0.74), c = mkC(8, 8), x = cx2(c), fN = fsN + 'px CUTE, PRT, sans-serif', fH = fsH + 'px CUTE, PRT, sans-serif';
  x.font = fN; var wN = x.measureText(b.name).width; x.font = fH; var wH = x.measureText(b.head).width, maxW = RD.view.W * 0.92;
  if (wN + fsN * 2.2 > maxW) { fsN = Math.max(10, Math.floor(fsN * maxW / (wN + fsN * 2.2))); fN = fsN + 'px CUTE, PRT, sans-serif'; x.font = fN; wN = x.measureText(b.name).width; }
  var pad = Math.round(fsN * 1.1), W = Math.ceil(Math.max(wN, wH) + pad * 2), bh = Math.round(fsN * 1.5), H = Math.ceil(bh + fsH * 1.25), lw = Math.max(2, Math.round(fsN * 0.09)), by = H - bh, nt = Math.round(fsN * 0.5);
  c.width = W; c.height = H; x = cx2(c); x.lineJoin = 'round'; x.textAlign = 'center'; x.textBaseline = 'middle';
  // 띠 (양 끝이 제비 꼬리)
  x.beginPath(); x.moveTo(lw, by + lw); x.lineTo(W - lw, by + lw); x.lineTo(W - lw - nt, by + bh / 2); x.lineTo(W - lw, H - lw); x.lineTo(lw, H - lw); x.lineTo(lw + nt, by + bh / 2); x.closePath();
  var g = x.createLinearGradient(0, by, 0, H); g.addColorStop(0, '#3a2f78'); g.addColorStop(1, '#1e1848'); x.fillStyle = g; x.fill();
  x.strokeStyle = '#ffd86a'; x.lineWidth = lw; x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(nt + lw * 2, by + lw * 2.2); x.lineTo(W - nt - lw * 2, by + lw * 2.2); x.stroke();
  x.font = fN; x.lineWidth = lw * 2; x.strokeStyle = '#120c30'; x.strokeText(b.name, W / 2, by + bh / 2 + fsN * 0.04); x.fillStyle = '#ffffff'; x.fillText(b.name, W / 2, by + bh / 2 + fsN * 0.04);
  x.font = fH; var hy = by - fsH * 0.12 + lw; x.lineWidth = lw * 2.6; x.strokeStyle = '#3a1848'; x.strokeText(b.head, W / 2, hy); x.lineWidth = lw * 1.1; x.strokeStyle = '#ffffff'; x.strokeText(b.head, W / 2, hy);
  var hg = x.createLinearGradient(0, hy - fsH * 0.5, 0, hy + fsH * 0.5); hg.addColorStop(0, '#fff7a8'); hg.addColorStop(0.5, '#ffd23a'); hg.addColorStop(1, '#ff8a3a'); x.fillStyle = hg; x.fillText(b.head, W / 2, hy);
  if (fxFontOk(fsN)) b.cv = c;
  return c;
}
function rtBanners(x, S) {
  for (var i = 0; i < RT_BAN.length; i++) {
    var b = RT_BAN[i], c = rtBannerC(b, S), u = b.t / b.life, sc = b.t < 0.2 ? easeBack(b.t / 0.2) : 1, al = u > 0.82 ? (1 - u) / 0.18 : 1, v = RD.view, w = c.width * sc, h = c.height * sc;
    var X = clamp(WX(b.x), w / 2 + 4, v.W - w / 2 - 4), Y = Math.max(WY(b.y) - S * (1.75 + easeOut(Math.min(1, u * 2)) * 0.25), v.top * v.dpr + h / 2 + 4);
    x.globalAlpha = al; x.drawImage(c, X - w / 2, Y - h / 2, w, h);
  }
  x.globalAlpha = 1;
}
// 합체 중 재료 탑 둘의 허깨비: 빛줄기에 끌려 새 자리로 모임
function rtSeqDraw(x, g, S, time) {
  for (var i = 0; i < RT_SEQ.length; i++) {
    var q = RT_SEQ[i]; if (q.k !== 'fu' || q.t >= q.cut) continue;
    var u = q.t / q.cut, e = easeIn(u), CX = WX(q.x), CY = WY(q.y) - S * 0.5;
    [[q.a, q.ax, q.ay], [q.b, q.bx, q.by]].forEach(function (it, n) {
      var a = it[0]; if (!a) return;
      var wx = lerp(it[1], q.x, e), wy = lerp(it[2], q.y, e), lift = Math.sin(u * Math.PI) * 0.35 + e * 0.2, X = WX(wx), Y = WY(wy + 0.3) - lift * S, sc = 1 - e * 0.35, col = (TOWERS[a.k] && TOWERS[a.k].col) || '#ffffff';
      rtBeamLine(x, X, Y - S * 0.5 * sc, CX, CY - lift * S * 0.5, S * (0.05 + 0.1 * u), col, 0.5 + 0.5 * u);
      try {
        var info = towerSpr(a.k, a.lvl, a.br, S), kk = info.k || 1;
        x.save(); x.translate(X, Y); x.scale(sc, sc); x.translate(-X, -Y); drawSpr(x, info.back, X, Y); drawTowerParts(x, a, X, Y, S * kk, time, info, g); drawSpr(x, info.front, X, Y); x.restore();
      } catch (er) { x.restore(); }
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.35 + 0.65 * u; var gr = S * (0.9 + 0.5 * u) * sc; x.drawImage(glowSpr(n ? '#ffe9a0' : '#bfe8ff', 64), X - gr, Y - S * 0.55 * sc - gr, gr * 2, gr * 2); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    });
    rtFlare(x, CX, CY, S * (0.5 + 1.6 * u), '#fff2b0', time * 5, 0.6 + 0.4 * u);
  }
}

// ---------- 탑 그리기 앞뒤 (render.js drawTower가 부름) ----------
// 앞: 물결(수상 탑), 발밑 빛 고리(6단계, 합체, 관리자). 돌려주는 값: 연출 중이면 { hide, L, B, sx, sy, glow }
function rtTwPre(x, g, t, S, time) {
  var T = TOWERS[t.k] || {}, X = WX(t.x), Y = WY(t.y + 0.3), q = t.rtSq, rq = null, sp = T.fusion || T.admin, top = t.lvl >= 6 || sp;
  if (q) {
    if (q.t < q.cut) { var u = q.t / q.cut; if (q.k === 'fu') return { hide: 1 }; var w = Math.sin(u * Math.PI * 4) * 0.07 * u; rq = { L: q.L0, B: q.B0, sx: 1 - w, sy: 1 + w * 1.4 + u * 0.05, glow: u * u * 1.15 }; }
    else { var v = Math.min(1, (q.t - q.cut) / 0.24), sc = 0.5 + 0.5 * easeBack(v); rq = { sx: sc, sy: sc * (1 + (1 - v) * 0.25), glow: Math.max(0, 1 - (q.t - q.cut) / 0.4) }; }
  }
  if (T.site === 'water') {
    // 물결: 선체 둘레로 퍼지는 타원 두 겹
    x.lineWidth = Math.max(1, S * 0.03); x.strokeStyle = '#ffffff';
    for (var i = 0; i < 2; i++) { var ph = (time * 0.45 + i * 0.5 + t.id * 0.13) % 1; x.globalAlpha = 0.55 * (1 - ph); x.beginPath(); x.ellipse(X, Y - S * 0.06, S * (0.42 + ph * 0.3), S * (0.17 + ph * 0.12), 0, 0, 6.2832); x.stroke(); }
    x.globalAlpha = 1;
  }
  if (top) {
    var kk = 1; try { kk = towerSpr(t.k, (rq && rq.L) || t.lvl, rq && rq.L ? rq.B : t.br, S).k || 1; } catch (e) { }
    var col = T.fusion ? T.col || '#ffe27a' : T.admin ? '#ffd23a' : BRC[t.br ? 1 : 0].glow, r = S * (sp ? 0.66 : 0.6) * Math.max(1, kk), pa = 0.5 + 0.5 * Math.sin(time * 2.4 + t.id), a = time * (T.fusion ? 0.9 : 0.6) + t.id, c = Math.cos(a) * r / 54, s = Math.sin(a) * r / 54;
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.3 + 0.14 * pa; x.drawImage(glowSpr(col, 64), X - r * 1.3, Y - r * 0.62, r * 2.6, r * 1.24);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.75 + 0.2 * pa; x.setTransform(c, s * 0.5, -s, c * 0.5, X, Y - S * 0.06 * kk); x.drawImage(rtAuraSpr(col, T.fusion ? 1 : 0), -64, -64);
    if (sp) { x.globalAlpha = 0.6; x.setTransform(c * 0.74, -s * 0.37, s * 0.74, c * 0.37, X, Y - S * 0.06 * kk); x.drawImage(rtAuraSpr('#ffffff', 0), -64, -64); }
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
    if (sp) rtOrbs(x, t, X, Y, S, time, col, 0);
  }
  return rq;
}
// 합체 탑을 도는 빛 구슬 둘: 뒤쪽 반은 탑 뒤에, 앞쪽 반은 탑 앞에
function rtOrbs(x, t, X, Y, S, time, col, front) {
  for (var i = 0; i < 2; i++) {
    var a = time * 1.7 + i * Math.PI + t.id, sn = Math.sin(a); if ((sn > 0) !== !!front) continue;
    var ox = X + Math.cos(a) * S * 0.56, oy = Y - S * 0.55 + sn * S * 0.2, r = S * (0.1 + 0.03 * sn);
    x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr(i ? '#ffffff' : col, 32), ox - r * 2.2, oy - r * 2.2, r * 4.4, r * 4.4); x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(ox, oy, r * 0.55, 0, 6.2832); x.fill();
  }
}
// 뒤: 앞쪽 빛 구슬, 6단계 반짝임, 변신 중 빛 덮개
function rtTwPost(x, g, t, X, Y, Sp, S, time, rq) {
  var T = TOWERS[t.k] || {}, sp = T.fusion || T.admin;
  if (sp) rtOrbs(x, t, X, Y, S, time, T.fusion ? T.col || '#ffe27a' : '#ffd23a', 1);
  if ((t.lvl >= 6 || sp) && !RD.lowFx && RD.live !== false && Math.random() < 0.07) addP({ k: 'twk', x: t.x + rtRnd(-0.4, 0.4), y: t.y + 0.25, z: rtRnd(0.1, 1.0), vz: 0.5, life: 0.7, size: rtRnd(0.05, 0.09), col: fxPick(['#ffffff', '#ffe066', T.col || BRC[t.br ? 1 : 0].glow]), rot: 0, vr: 3 });
  if (rq && rq.glow > 0.01) {
    var gl = Math.min(1, rq.glow), w = Sp * 1.9, h = Sp * 2.5;
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = gl; x.drawImage(glowSpr('#fff6d8', 64), X - w / 2, Y - h * 0.78, w, h);
    if (rq.glow > 0.55) { x.globalCompositeOperation = 'source-over'; x.globalAlpha = Math.min(1, (rq.glow - 0.55) * 2.4); x.drawImage(softSpr('#ffffff', 64), X - w * 0.42, Y - h * 0.66, w * 0.84, h * 0.84); }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
}

// ---------- 아군 유닛 (g.units) ----------
// 모습 번호: u.v가 있으면 그것, 없으면 주인 탑의 갈래로 (a 기본, b 갈래 A, c 갈래 B, d 항공모함)
function rtUnitV(u, a, b, c, d) { var tw = u.tw || {}, k = u.k || tw.k, lv = u.lvl || tw.lvl || 1, br = u.br != null ? u.br : tw.br; return u.v != null ? u.v : k === 'fz_carrier' ? d : lv >= 4 ? (br ? c : b) : a; }
// 전투기 {x, y, ang, z(0 지상 ~ 1 비행), st: 'park' | 'out' | 'back', bank, fireT}: 선회하며 기울고, 땅 그림자와 날개 끝 비행운, 기총 불빛. 대기 중(park)은 탑 그림이 그림
UNIT_DRAW.plane = function (x, g, u, S, time) {
  if (u.st === 'park') { u._tx = null; u._pa = null; return; }
  var z = u.z == null ? 0.9 : u.z * 0.9, X = WX(u.x), Y = WY(u.y) - z * S, a = u.ang || 0, v = rtUnitV(u, 0, 1, 2, 3), sp = typeof t3PlaneSpr === 'function' ? t3PlaneSpr(v, S) : rtPlaneFallback(S), bank = u.bank;
  if (bank == null) { var da = u._pa == null ? 0 : angDiff(u._pa, a); u._bk = (u._bk || 0) * 0.86 + clamp(da * 7, -1, 1) * 0.14; bank = u._bk; } u._pa = a;
  var ab = Math.min(1, Math.abs(bank)), fy = 1 - ab * 0.5, c = Math.cos(a), s = Math.sin(a), hk = clamp(z / 0.9, 0.3, 1);
  shadowAt(x, X + S * 0.12 * hk, WY(u.y) + S * 0.06 * hk, S * 0.3, S * 0.12, 0.3 - 0.08 * hk);
  if (z > 0.4 && !RD.lowFx) rtTrail(u, 0.2, function (px, py, pz) { for (var i = -1; i <= 1; i += 2) rtSmoke(px - c * 0.1 - s * i * 0.24 * fy, py - s * 0.1 + c * i * 0.24 * fy, z, 'w', 0.05, 0.12 + ab * 0.08, 0.45, { a: 0.45 + ab * 0.45, vz: 0, dr: 0 }); });
  var tx = X - c * S * 0.3, ty = Y - s * S * 0.3, gr = S * 0.13; x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.8; x.drawImage(glowSpr(v === 2 ? '#7cd8ff' : '#ffb04a', 16), tx - gr, ty - gr, gr * 2, gr * 2); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.setTransform(c, s, -s * fy, c * fy, X, Y); x.drawImage(sp.c, -sp.ax, -sp.ay); x.setTransform(1, 0, 0, 1, 0, 0);
  if (u.fireT > 0 || u.firing) { var mr = S * 0.17 * (0.7 + Math.random() * 0.6); x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr('#ffe27a', 16), X + c * S * 0.36 - mr, Y + s * S * 0.36 - mr, mr * 2, mr * 2); x.globalCompositeOperation = 'source-over'; }
};
// 병사 {x, y, face, hp, mhp, st: 'walk' | 'guard' ..., atkT(친 직후 0.25 → 0), tgt}: 걷기 4장, 공격 2장, 작은 체력 막대
UNIT_DRAW.soldier = function (x, g, u, S, time) {
  var X = WX(u.x), Y = WY(u.y) + S * 0.1, v = rtUnitV(u, 0, 1, 2, 0), id = u.i || u.id || 0, mv = u.st === 'walk' || (u._px != null && (Math.abs(u.x - u._px) > 0.002 || Math.abs(u.y - u._py) > 0.002)), hit = u.atkT > 0, ready = !mv && (u.fight || (u.tgt && !u.tgt.dead));
  var face = u.face != null ? u.face : u.tgt && !u.tgt.dead ? (u.tgt.x >= u.x ? 1 : -1) : mv && u._px != null ? (u.x >= u._px ? 1 : -1) : u._fc || 1, s, bo = 0;
  u._px = u.x; u._py = u.y; u._fc = face;
  if (typeof t3SoldierFrames === 'function') { var F = t3SoldierFrames(v, S); bo = (F.fr[0].c.width / 2 - F.fr[0].ax) * (face < 0 ? -1 : 1) * 0.6; s = hit ? F.atk[u.atkT > 0.1 ? 1 : 0] : ready ? F.atk[0] : mv ? F.fr[((time * 9 + id) | 0) % F.fr.length] : F.fr[((time * 1.6 + id) | 0) % 2 ? 1 : 0]; }
  else s = rtSoldierFallback(S, mv || hit ? ((time * 8 + id) | 0) % 2 : 0);
  shadowAt(x, X, Y, S * 0.17, S * 0.06, 0.3);
  drawSpr(x, s, X + (hit ? face * S * 0.04 : 0), Y, face < 0);
  var mh = u.mhp || u.maxHp || 0; if (mh > 0 && u.hp < mh && u.hp > 0) { var bw = Math.round(S * 0.32), bh = Math.max(3, Math.round(S * 0.055)), bx = Math.round(X + bo - bw / 2), by = Math.round(Y - S * 0.62); x.fillStyle = '#3a2248'; x.fillRect(bx - 1, by - 1, bw + 2, bh + 2); x.fillStyle = u.hp / mh > 0.35 ? '#4fe07a' : '#ff6a5a'; x.fillRect(bx, by, Math.round(bw * clamp(u.hp / mh, 0, 1)), bh); }
};
// 수호룡 {x, y, ang, z, breath(0~1 불 세기), flameR(불 길이 칸), cone(도)}: 위에서 본 날갯짓, 그림자, 불 숨결
UNIT_DRAW.dragon = function (x, g, u, S, time) {
  var z = u.z == null ? 1.0 : u.z, X = WX(u.x), Y = WY(u.y) - z * S + Math.sin(time * 3 + (u.i || 0)) * S * 0.04, a = u.ang || 0, c = Math.cos(a), s = Math.sin(a), sp, f = ((time * 7) | 0) % 4, br = u.breath === true ? 1 : u.breath || (u.fireT > 0 ? 1 : 0);
  if (typeof t4DragonFrames === 'function') { var F = t4DragonFrames(S); sp = F.fr[f % F.fr.length]; } else sp = rtDragonFallback(S, f % 2);
  shadowAt(x, X + S * 0.15, WY(u.y) + S * 0.08, S * 0.55, S * 0.2, 0.26);
  if (br > 0.05 && RD.live !== false) {
    var hx = u.x + c * 0.62, hy = u.y + s * 0.62, R = u.flameR || 1.8, half = (u.cone || 60) * Math.PI / 360 * 0.8;
    for (var i = 0; i < (RD.lowFx ? 1 : 2); i++) { if (Math.random() > br + 0.2) continue; var w = rtRnd(-half, half), life = rtRnd(0.3, 0.42), sp2 = R / life * rtRnd(0.7, 1.0); rtAdd({ k: 'fb', x: hx, y: hy, z: z - 0.05, vx: Math.cos(a + w) * sp2, vy: Math.sin(a + w) * sp2, vz: -z / life * 0.8, dr: 1.0, s0: 0.18, s1: rtRnd(0.5, 0.8) * (0.6 + 0.4 * br), life: life, img: rtFireSpr(i ? 'fire' : 'he'), rot: Math.random() * 6, ov: 1 }); }
    var gr = S * 0.34 * br; x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr('#ffb04a', 32), WX(hx) - gr, WY(hy) - z * S - gr, gr * 2, gr * 2); x.globalCompositeOperation = 'source-over';
  }
  fxBlitS(x, sp, X, Y, a, 1);
};

// ---------- 그리는 순서 ----------
// 바닥 자국 (그을음, 서리, 문양, 물결): 탑과 적 아래
function rtGround(x, g, S, time) {
  for (var i = 0; i < RT_DEC.length; i++) {
    var d = RT_DEC[i], u = d.t / d.life, a = Math.min(1, (d.life - d.t) / 0.9), X = WX(d.x), Y = WY(d.y), w = d.r * S * 2.3 * (0.75 + 0.25 * easeOut(Math.min(1, d.t * 8)));
    if (d.k === 'ripple') { x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.035); for (var k = 0; k < 2; k++) { var ph = Math.min(1, u * 1.2 + k * 0.25); if (ph >= 1) continue; x.globalAlpha = 0.7 * (1 - ph); x.beginPath(); x.ellipse(X, Y, d.r * S * (0.3 + ph * 0.8), d.r * S * (0.3 + ph * 0.8) * 0.6, 0, 0, 6.2832); x.stroke(); } }
    else if (d.k === 'seal') { var c = Math.cos(d.rot + d.t * 1.5) * w / 128, s = Math.sin(d.rot + d.t * 1.5) * w / 128; x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.9 * a * Math.min(1, d.t * 8); x.setTransform(c, s * 0.6, -s, c * 0.6, X, Y); x.drawImage(rtSealSpr('#ffe27a'), -64, -64); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; }
    else { x.globalAlpha = 0.72 * a; x.drawImage(rtScorchSpr(d.k), X - w / 2, Y - w * 0.3125, w, w * 0.625); }
  }
  x.globalAlpha = 1;
}
// 탄 아래: 입자 갱신, 연기 꼬리
function rtUnder(x, g, S, time, dt) { rtStep(dt); rtDrawP(x, S, 0); }
// 맨 위: 광선, 번개와 예광, 불덩이와 불티, 합체 허깨비, 이름 띠
function rtOver(x, g, S, time) {
  rtBeams(x, g, S, time); rtLines(x, g, S, time); rtDrawP(x, S, 1); rtSeqDraw(x, g, S, time); rtBanners(x, S);
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
}
// 전투가 새로 시작되면 남은 효과를 비움 (render.js rdPrepare가 fxWarm을 부를 때 같이)
function rtReset() { RTP.length = 0; RT_DEC.length = 0; RT_LN.length = 0; RT_SEQ.length = 0; RT_BAN.length = 0; RT_BEAM = {}; }

// ---------- 시험용 (tools/rtshot.py): 가짜 탄, 사건, 유닛을 넣어 장면을 만든다 ----------
window.__rt = {
  ev: function (name, o) { return emit(__td.G(), name, o || {}); }, n: function () { return { p: RTP.length, dec: RT_DEC.length, ln: RT_LN.length, seq: RT_SEQ.length, parts: PARTS.length }; },
  PROJ_DRAW: PROJ_DRAW, UNIT_DRAW: UNIT_DRAW, FX_EV: FX_EV, muzzle: function (t) { return rtMuzzle(t); }, reset: rtReset,
  seq: function () { return RT_SEQ.map(function (q) { return { k: q.k, t: +q.t.toFixed(2), a: q.a && q.a.k, b: q.b && q.b.k, ax: q.ax, ay: q.ay, bx: q.bx, by: q.by, x: q.x, y: q.y }; }); },
  cap: function (n) { RT_MAXP = n; if (RTP.length > n) RTP.length = n; },
  // 프레임 시간(ms): 한 프레임을 그리고 화소를 읽어 그리기가 끝난 것을 확인한 시간의 평균 (구간별 읽기 없음)
  bench: function (n) { var x = RD.x, g = __td.G(), s = 0, t0; for (var i = 0; i < n; i++) { stepGame(g, DT); rdEvents(g); x.getImageData(0, 0, 1, 1); t0 = performance.now(); rdFrame(g, DT, DT); x.getImageData(0, 0, 1, 1); s += performance.now() - t0; } return +(s / n).toFixed(2); },
  hq: function () { RD.lowFx = 0; MAXP = 640; RD.dprCap = 2; },   // 헤드리스(소프트웨어 그리기)에서 자동 효과 줄이기가 켜지지 않게
  // 논리 갈래(ENG2)의 PROJ_UPD가 없을 때만 쓰는 시험용 움직임: 직선 + 포물선(h) + 옆으로 휘기(curve)
  sim: function (force) {
    var f = function (g, p, dt) {
      p.u = Math.min(1, (p.u || 0) + dt / (p.T || 1)); var u = p.u, dx = p.tx - p.sx, dy = p.ty - p.sy, L = Math.hypot(dx, dy) || 1, cv = Math.sin(u * Math.PI) * (p.curve || 0);
      p.x = lerp(p.sx, p.tx, u) - dy / L * cv; p.y = lerp(p.sy, p.ty, u) + dx / L * cv; p.z = lerp(p.z0 || 0, p.z1 || 0, u) + 4 * (p.h || 0) * u * (1 - u); p.ang = Math.atan2(dy, dx);
      if (u >= 1) { if (p.bk) emit(g, 'blast', { x: p.tx, y: p.ty, r: p.br || 0.7, k: p.bk, z: p.z1 || 0 }); return true; } return false;
    };
    ['missile', 'rocket', 'sinarrow', 'flakshell', 'bullet', 'navshell', 'ball', 'bomb', 'talisman', 'torpedo', 'mystery'].forEach(function (k) { if (force || !PROJ_UPD[k]) PROJ_UPD[k] = f; });
  },
  shoot: function (o) { var g = __td.G(), p = { kind: 'missile', sx: 1, sy: 1, tx: 5, ty: 5, z0: 0.6, z1: 0.6, T: 1, lvl: 1 }; for (var k in o) p[k] = o[k]; p.x = p.sx; p.y = p.sy; p.z = p.z0; g.proj.push(p); return p; }
};
