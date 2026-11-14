// ===== art_fx2.js : v2.0 탄, 폭발, 연기, 빛줄기 조각 (REN1). 전부 한 번 구워 두고 그릴 때는 붙이기만 한다 =====
// 탄 그림은 오른쪽이 앞, 닻점은 가운데. 길이 단위는 칸(S 화소)
var RT_C = {}, RT_INK = '#2a2440';
function rtBake(key, w, h, fn) { var c = RT_C[key]; if (c) return c; c = mkC(w, h); var x = cx2(c); x.lineJoin = 'round'; x.lineCap = 'round'; fn(x, c.width, c.height); return (RT_C[key] = c); }
function rtSprOf(key, w, h, fn) { var s = RT_C[key]; if (s) return s; var c = mkC(w, h), x = cx2(c); x.lineJoin = 'round'; x.lineCap = 'round'; fn(x, c.width, c.height); return (RT_C[key] = { c: c, ax: c.width / 2, ay: c.height / 2 }); }
function rtPoly(x, pts, fill, lw, ink) { x.beginPath(); for (var i = 0; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath(); if (lw) { x.strokeStyle = ink || RT_INK; x.lineWidth = lw * 2; x.stroke(); } x.fillStyle = fill; x.fill(); }
function rtLw(S) { return Math.max(1.1, S * 0.028); }

// ---------- 연기 뭉치: w 흰(미사일), g 회색(로켓, 포연), d 검은(대공 폭발, 그을음), o 불빛 받은, b 물보라, p 보랏빛 ----------
var RT_SMC = { w: ['#ffffff', '#f2f0f6', '#cfd0de'], g: ['#d8d4dc', '#a8a2b0', '#77717f'], d: ['#77707c', '#4c4654', '#2c2734'], o: ['#fff0b8', '#ffb45a', '#e8703a'], b: ['#ffffff', '#e2f4ff', '#a8d4f2'], p: ['#e6d0ff', '#9a6ad8', '#4a2a80'] };
function rtSmokeSpr(tone, v) {
  return rtBake('sm' + tone + v, 64, 64, function (x) {
    var cs = RT_SMC[tone] || RT_SMC.w, r = rngOf(77 + v * 31 + tone.charCodeAt(0) * 7), i;
    for (i = 0; i < 7; i++) {
      var a = i / 6 * 6.283 + r() * 0.8, d = i ? 8 + r() * 7 : 0, px = 32 + Math.cos(a) * d, py = 32 + Math.sin(a) * d * 0.9, rr = i ? 10 + r() * 6 : 17;
      var g = x.createRadialGradient(px - rr * 0.3, py - rr * 0.38, rr * 0.08, px, py, rr);
      g.addColorStop(0, cs[0]); g.addColorStop(0.5, cs[1]); g.addColorStop(0.8, rgba(cs[2], 0.92)); g.addColorStop(1, rgba(cs[2], 0));
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, 6.2832); x.fill();
    }
  });
}
// ---------- 불덩이: 흰 심 → 노랑 → 주황 → 붉은 가장자리, 울퉁불퉁한 테두리 ----------
var RT_FBC = { he: ['#ffffff', '#fff3a0', '#ffb030', '#f0501a'], fire: ['#fff6c8', '#ffc040', '#ff6a1a', '#c8281a'], flak: ['#fff4d0', '#ffb860', '#c0603a', '#4a3038'], emp: ['#ffffff', '#c8f0ff', '#5cb8ff', '#3a60e0'], ice: ['#ffffff', '#e0f8ff', '#8fd8ff', '#4a9ae8'], holy: ['#ffffff', '#fff8c8', '#ffd860', '#ffa030'], water: ['#ffffff', '#e8f8ff', '#a8dcf8', '#5aa8e0'], dark: ['#f0d8ff', '#b070f0', '#5a2a9a', '#1e1030'] };
function rtFireSpr(k) {
  return rtBake('fb' + k, 96, 96, function (x) {
    var cs = RT_FBC[k] || RT_FBC.he, r = rngOf(911 + k.length * 13 + k.charCodeAt(0)), i, g;
    for (i = 0; i < 8; i++) {
      var a = i / 8 * 6.283 + r() * 0.5, d = 17 + r() * 8, px = 48 + Math.cos(a) * d, py = 48 + Math.sin(a) * d, rr = 15 + r() * 7;
      g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, rgba(cs[2], 0.95)); g.addColorStop(0.6, rgba(cs[3], 0.85)); g.addColorStop(1, rgba(cs[3], 0));
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, 6.2832); x.fill();
    }
    g = x.createRadialGradient(48, 48, 0, 48, 48, 34); g.addColorStop(0, cs[0]); g.addColorStop(0.3, cs[0]); g.addColorStop(0.52, cs[1]); g.addColorStop(0.8, rgba(cs[2], 0.9)); g.addColorStop(1, rgba(cs[2], 0));
    x.fillStyle = g; x.beginPath(); x.arc(48, 48, 34, 0, 6.2832); x.fill();
  });
}
// ---------- 분사 불꽃(오른쪽 끝이 분사구, 왼쪽으로 뻗음): 흰 심, 노랑, 주황 ----------
function rtFlameSpr(k) {
  return rtBake('fl' + k, 64, 24, function (x) {
    var cs = k === 'b' ? ['#ffffff', '#bfe8ff', '#5ca8ff'] : k === 'g' ? ['#ffffff', '#fff2a0', '#ffd23a'] : ['#ffffff', '#ffe27a', '#ff7a2a'];
    var g = x.createLinearGradient(64, 0, 0, 0); g.addColorStop(0, rgba(cs[2], 0.95)); g.addColorStop(0.45, rgba(cs[2], 0.7)); g.addColorStop(1, rgba(cs[2], 0));
    x.fillStyle = g; x.beginPath(); x.moveTo(64, 3); x.quadraticCurveTo(30, 2, 0, 12); x.quadraticCurveTo(30, 22, 64, 21); x.closePath(); x.fill();
    g = x.createLinearGradient(64, 0, 14, 0); g.addColorStop(0, cs[0]); g.addColorStop(0.5, rgba(cs[1], 0.95)); g.addColorStop(1, rgba(cs[1], 0));
    x.fillStyle = g; x.beginPath(); x.moveTo(64, 7); x.quadraticCurveTo(40, 7, 14, 12); x.quadraticCurveTo(40, 17, 64, 17); x.closePath(); x.fill();
  });
}
// ---------- 포구 섬광(오른쪽으로 뻗는 별 모양), 반짝 십자 ----------
function rtMuzzleSpr(k) {
  return rtBake('mz' + k, 96, 64, function (x) {
    var cs = k === 'b' ? ['#ffffff', '#c8ecff', '#5cb0ff'] : k === 'r' ? ['#ffffff', '#ffd0b0', '#ff6a3a'] : ['#ffffff', '#fff2a0', '#ffa62a'], g, i;
    g = x.createRadialGradient(20, 32, 0, 20, 32, 30); g.addColorStop(0, rgba(cs[2], 0.9)); g.addColorStop(1, rgba(cs[2], 0)); x.fillStyle = g; x.fillRect(0, 0, 60, 64);
    var sp = [[0, 78, 9], [-0.55, 44, 6], [0.55, 44, 6], [-1.2, 26, 5], [1.2, 26, 5]];
    for (i = 0; i < sp.length; i++) { var a = sp[i][0], L = sp[i][1], w = sp[i][2], c = Math.cos(a), s = Math.sin(a); x.fillStyle = i ? cs[1] : cs[1]; x.beginPath(); x.moveTo(16 - s * w, 32 + c * w); x.lineTo(16 + c * L, 32 + s * L); x.lineTo(16 + s * w, 32 - c * w); x.closePath(); x.fill(); }
    x.fillStyle = cs[0]; x.beginPath(); x.moveTo(14, 26); x.lineTo(62, 32); x.lineTo(14, 38); x.closePath(); x.fill(); x.beginPath(); x.arc(18, 32, 8, 0, 6.2832); x.fill();
  });
}
// ---------- 광선 띠(세로 방향으로 가운데가 밝음, 가로로 늘려 씀)와 끝 번쩍임 ----------
function rtBeamSpr(col) {
  return rtBake('bm' + col, 8, 32, function (x) {
    var g = x.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.3, rgba(col, 0.55)); g.addColorStop(0.44, rgba(lit(col, 0.5), 1)); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.56, rgba(lit(col, 0.5), 1)); g.addColorStop(0.7, rgba(col, 0.55)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, 8, 32);
  });
}
function rtFlareSpr(col) {
  return rtBake('fr' + col, 64, 64, function (x) {
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, '#ffffff'); g.addColorStop(0.2, rgba(lit(col, 0.5), 0.95)); g.addColorStop(0.5, rgba(col, 0.4)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    x.fillStyle = '#ffffff'; for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2 + 0.4, c = Math.cos(a), s = Math.sin(a); x.beginPath(); x.moveTo(32 - s * 3, 32 + c * 3); x.lineTo(32 + c * 30, 32 + s * 30); x.lineTo(32 + s * 3, 32 - c * 3); x.closePath(); x.fill(); }
  });
}
// ---------- 충격파 고리: 가는 흰 심과 옅은 색 빛 (굵은 사탕 고리 대신) ----------
function rtRingSpr(col) {
  return rtBake('rg' + col, 128, 128, function (x) {
    x.beginPath(); x.arc(64, 64, 54, 0, 6.2832); x.strokeStyle = rgba(col, 0.3); x.lineWidth = 13; x.stroke();
    x.strokeStyle = rgba(col, 0.9); x.lineWidth = 5.5; x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 2.2; x.stroke();
  });
}
// ---------- 파편, 얼음 조각, 물방울, 불티 ----------
function rtChunkSpr(k, v) {
  return rtBake('ck' + k + v, 20, 20, function (x) {
    var r = rngOf(31 + v * 17), n = 5, pts = [], i, base = k === 'ice' ? '#bfeaff' : k === 'wood' ? '#b87a48' : k === 'steel' ? '#8a90a8' : '#6a5a58';
    for (i = 0; i < n; i++) { var a = i / n * 6.283 + r() * 0.6, d = (k === 'ice' ? 5 : 4.5) + r() * 3.5; pts.push([10 + Math.cos(a) * d, 10 + Math.sin(a) * d * (k === 'ice' ? 0.6 : 1)]); }
    rtPoly(x, pts, base, 1, k === 'ice' ? '#3a78c8' : '#2a2030');
    x.save(); x.beginPath(); for (i = 0; i < n; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath(); x.clip(); x.fillStyle = k === 'ice' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)'; x.fillRect(0, 0, 20, 8.5); x.restore();
  });
}
// ---------- 바닥 자국: scorch 그을음, frost 서리, ripple은 그릴 때 선으로 ----------
function rtScorchSpr(k) {
  return rtBake('sc' + k, 96, 60, function (x) {
    var col = k === 'frost' ? '#e8f8ff' : k === 'dark' ? '#2a1040' : '#1e1620', r = rngOf(k === 'frost' ? 5 : 9), i, g;
    x.save(); x.scale(1, 0.62);
    g = x.createRadialGradient(48, 48, 4, 48, 48, 44); g.addColorStop(0, rgba(col, k === 'frost' ? 0.8 : 0.62)); g.addColorStop(0.55, rgba(col, k === 'frost' ? 0.5 : 0.4)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(0, 0, 96, 96);
    for (i = 0; i < 9; i++) { var a = r() * 6.283, d = 14 + r() * 22, px = 48 + Math.cos(a) * d, py = 48 + Math.sin(a) * d, rr = 5 + r() * 8; g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, rgba(col, 0.5)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, 6.2832); x.fill(); }
    if (k !== 'frost') { x.strokeStyle = rgba(col, 0.55); x.lineWidth = 1.6; for (i = 0; i < 7; i++) { var a2 = i / 7 * 6.283 + r(), d0 = 16 + r() * 6, d1 = 34 + r() * 10; x.beginPath(); x.moveTo(48 + Math.cos(a2) * d0, 48 + Math.sin(a2) * d0); x.lineTo(48 + Math.cos(a2 + 0.08) * d1, 48 + Math.sin(a2 + 0.08) * d1); x.stroke(); } }
    x.restore();
  });
}
// ---------- 물기둥(아래가 닻점): 흰 물보라 덩어리, 파란 그늘과 진한 테두리 ----------
function rtWaterColSpr() {
  return rtBake('wcol', 64, 128, function (x) {
    var g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, '#bfe4fa'); g.addColorStop(0.35, '#ffffff'); g.addColorStop(0.7, '#e6f5ff'); g.addColorStop(1, '#8fc4ee');
    x.beginPath(); x.moveTo(8, 126); x.quadraticCurveTo(20, 96, 17, 60); x.quadraticCurveTo(4, 50, 12, 36); x.quadraticCurveTo(8, 18, 24, 18); x.quadraticCurveTo(30, 2, 42, 14); x.quadraticCurveTo(58, 16, 53, 34); x.quadraticCurveTo(62, 50, 47, 60); x.quadraticCurveTo(44, 96, 56, 126); x.closePath();
    x.strokeStyle = '#3f7fc0'; x.lineWidth = 3; x.stroke(); x.fillStyle = g; x.fill();
    x.strokeStyle = 'rgba(95,160,220,0.65)'; x.lineWidth = 2; x.beginPath(); x.moveTo(26, 118); x.quadraticCurveTo(30, 90, 27, 58); x.moveTo(38, 118); x.quadraticCurveTo(36, 92, 39, 66); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.arc(26, 30, 7, 0, 6.2832); x.arc(40, 26, 5, 0, 6.2832); x.fill();
  });
}

// ---------- 탄 그림 ----------
// 미사일: v 0 흰 몸통 빨간 코(유도탄), 1 길고 파란 띠(장거리 요격탄), 2 작은 자탄(다탄두), 3 함대공(남색)
function rtMissileSpr(S, v) {
  v = v | 0; var L = [0.56, 0.72, 0.36, 0.6][v] || 0.56, H = [0.13, 0.13, 0.1, 0.13][v] || 0.13;
  return rtSprOf('ms' + v + ':' + Math.round(S), S * (L + 0.14), S * (H * 2.6 + 0.08), function (x, w, h) {
    var lw = rtLw(S), m = h / 2, x0 = w / 2 - S * L / 2, x1 = w / 2 + S * L / 2, hb = S * H / 2;
    var body = ['#f4f6fa', '#eef2f8', '#c9cfa6', '#e6ecf6'][v], nose = ['#e8443a', '#3a78e0', '#ffb62e', '#2f4f9a'][v], fin = ['#3f4a6a', '#2f5fb0', '#5c6440', '#27365f'][v];
    // 뒷날개 (위, 아래)
    [-1, 1].forEach(function (sd) { rtPoly(x, [[x0 + S * 0.01, m + sd * hb * 0.6], [x0 + S * 0.15, m + sd * hb * 0.8], [x0 + S * 0.06, m + sd * hb * 2.3], [x0 - S * 0.03, m + sd * hb * 2.3]], fin, lw); });
    if (v !== 2) [-1, 1].forEach(function (sd) { rtPoly(x, [[x0 + S * L * 0.5, m + sd * hb * 0.7], [x0 + S * L * 0.66, m + sd * hb * 0.8], [x0 + S * L * 0.56, m + sd * hb * 1.7], [x0 + S * L * 0.48, m + sd * hb * 1.7]], fin, lw); });
    // 몸통과 코
    x.beginPath(); x.moveTo(x0, m - hb); x.lineTo(x1 - S * 0.14, m - hb); x.quadraticCurveTo(x1 - S * 0.03, m - hb * 0.8, x1, m); x.quadraticCurveTo(x1 - S * 0.03, m + hb * 0.8, x1 - S * 0.14, m + hb); x.lineTo(x0, m + hb); x.closePath();
    x.strokeStyle = RT_INK; x.lineWidth = lw * 2; x.stroke(); x.fillStyle = body; x.fill();
    x.save(); x.clip();
    x.fillStyle = nose; x.fillRect(x1 - S * 0.13, 0, S * 0.2, h); x.fillRect(x0 + S * L * 0.3, 0, S * 0.045, h); if (v === 1) x.fillRect(x0 + S * L * 0.42, 0, S * 0.03, h);
    x.fillStyle = '#4a4660'; x.fillRect(x0, 0, S * 0.035, h);
    x.fillStyle = 'rgba(40,36,70,0.28)'; x.fillRect(0, m + hb * 0.25, w, hb);
    x.fillStyle = 'rgba(255,255,255,0.75)'; x.fillRect(x0 + S * 0.05, m - hb * 0.72, S * L * 0.72, hb * 0.34);
    x.restore();
  });
}
// 로켓: v 0 국방색(다연장), 1 빨간 코(소이), 2 굵은 집속
function rtRocketSpr(S, v) {
  v = v | 0; var L = v === 2 ? 0.44 : 0.36, H = v === 2 ? 0.13 : 0.1;
  return rtSprOf('rk' + v + ':' + Math.round(S), S * (L + 0.14), S * (H * 2.4 + 0.08), function (x, w, h) {
    var lw = rtLw(S), m = h / 2, x0 = w / 2 - S * L / 2, x1 = w / 2 + S * L / 2, hb = S * H / 2, body = ['#7d8a52', '#8a5a4a', '#6f7a8c'][v], nose = ['#ffb62e', '#ff4a3a', '#ffd23a'][v];
    [-1, 1].forEach(function (sd) { rtPoly(x, [[x0, m + sd * hb * 0.5], [x0 + S * 0.11, m + sd * hb * 0.8], [x0 + S * 0.03, m + sd * hb * 2.1], [x0 - S * 0.04, m + sd * hb * 2.1]], '#3c4230', lw); });
    x.beginPath(); x.moveTo(x0, m - hb); x.lineTo(x1 - S * 0.1, m - hb); x.quadraticCurveTo(x1 - S * 0.02, m - hb * 0.7, x1, m); x.quadraticCurveTo(x1 - S * 0.02, m + hb * 0.7, x1 - S * 0.1, m + hb); x.lineTo(x0, m + hb); x.closePath();
    x.strokeStyle = RT_INK; x.lineWidth = lw * 2; x.stroke(); x.fillStyle = body; x.fill();
    x.save(); x.clip(); x.fillStyle = nose; x.fillRect(x1 - S * 0.1, 0, S * 0.2, h); x.fillStyle = '#f4f0e0'; x.fillRect(x0 + S * L * 0.36, 0, S * 0.035, h); x.fillStyle = 'rgba(30,30,50,0.3)'; x.fillRect(0, m + hb * 0.2, w, hb); x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(x0 + S * 0.03, m - hb * 0.7, S * L * 0.7, hb * 0.32); x.restore();
  });
}
// 신기전(로켓 화살): 나무 살대, 쇠 촉, 종이 약통, 깃. v 1 대신기전(굵고 김)
function rtSinArrowSpr(S, v) {
  v = v | 0; var L = v ? 0.84 : 0.62;
  return rtSprOf('sa' + v + ':' + Math.round(S), S * (L + 0.1), S * 0.26, function (x, w, h) {
    var lw = rtLw(S), m = h / 2, x0 = w / 2 - S * L / 2, x1 = w / 2 + S * L / 2, k = v ? 1.35 : 1;
    x.strokeStyle = RT_INK; x.lineWidth = S * 0.035 * k + lw * 1.6; x.beginPath(); x.moveTo(x0 + S * 0.03, m); x.lineTo(x1 - S * 0.06, m); x.stroke();
    x.strokeStyle = '#d6a05a'; x.lineWidth = S * 0.035 * k; x.stroke();
    // 깃
    [-1, 1].forEach(function (sd) { rtPoly(x, [[x0 + S * 0.02, m], [x0 - S * 0.01, m + sd * S * 0.065 * k], [x0 + S * 0.1, m + sd * S * 0.065 * k], [x0 + S * 0.15, m]], sd < 0 ? '#ffffff' : '#ff5a4a', lw * 0.8); });
    // 약통(종이, 붉은 띠)
    var tx = x0 + S * L * 0.5, tw = S * 0.2 * k, th = S * 0.085 * k;
    x.beginPath(); x.rect(tx, m - th / 2, tw, th); x.strokeStyle = RT_INK; x.lineWidth = lw * 2; x.stroke(); x.fillStyle = '#f6ecd0'; x.fill();
    x.fillStyle = '#d8402e'; x.fillRect(tx + tw * 0.12, m - th / 2, tw * 0.16, th); x.fillRect(tx + tw * 0.7, m - th / 2, tw * 0.16, th); x.fillStyle = 'rgba(60,40,30,0.25)'; x.fillRect(tx, m + th * 0.1, tw, th * 0.4);
    // 촉
    rtPoly(x, [[x1, m], [x1 - S * 0.1 * k, m - S * 0.05 * k], [x1 - S * 0.07 * k, m], [x1 - S * 0.1 * k, m + S * 0.05 * k]], '#dfe6f2', lw);
  });
}
// 포탄: flak 작은 대공탄, nav 함포탄(큼), ball 포환, bomb 폭탄, torp 어뢰
function rtShellSpr(S, k) {
  var D = { flak: [0.2, 0.09], nav: [0.36, 0.17], ball: [0.2, 0.2], bomb: [0.36, 0.17], torp: [0.44, 0.1] }[k] || [0.2, 0.1], L = D[0], H = D[1];
  return rtSprOf('sh' + k + ':' + Math.round(S), S * (L + 0.16), S * (H * (k === 'bomb' ? 2.1 : 1) + 0.1), function (x, w, h) {
    var lw = rtLw(S), m = h / 2, x0 = w / 2 - S * L / 2, x1 = w / 2 + S * L / 2, hb = S * H / 2, g;
    if (k === 'ball') {
      g = x.createRadialGradient(w / 2 - hb * 0.35, m - hb * 0.4, hb * 0.1, w / 2, m, hb); g.addColorStop(0, '#9aa0b8'); g.addColorStop(0.5, '#4a4c64'); g.addColorStop(1, '#2a2940');
      x.beginPath(); x.arc(w / 2, m, hb, 0, 6.2832); x.strokeStyle = RT_INK; x.lineWidth = lw * 2; x.stroke(); x.fillStyle = g; x.fill();
      x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.ellipse(w / 2 - hb * 0.35, m - hb * 0.42, hb * 0.28, hb * 0.16, -0.6, 0, 6.2832); x.fill(); return;
    }
    if (k === 'bomb') { [-1, 1].forEach(function (sd) { rtPoly(x, [[x0 + S * 0.02, m + sd * hb * 0.3], [x0 + S * 0.1, m + sd * hb * 0.5], [x0 + S * 0.03, m + sd * hb * 1.75], [x0 - S * 0.05, m + sd * hb * 1.75]], '#ffd23a', lw); }); x.fillStyle = RT_INK; x.fillRect(x0 - S * 0.05, m - hb * 1.75, S * 0.035, hb * 3.5); }
    if (k === 'torp') { x.fillStyle = '#c9a23a'; x.strokeStyle = RT_INK; x.lineWidth = lw; x.beginPath(); x.ellipse(x0 - S * 0.012, m, S * 0.02, hb * 1.5, 0, 0, 6.2832); x.fill(); x.stroke(); }
    var body = { flak: '#5a5f78', nav: '#77809c', bomb: '#3f4a72', torp: '#4a5a70' }[k], nose = { flak: '#ffd23a', nav: '#c9d2e6', bomb: '#ffd23a', torp: '#e8443a' }[k];
    x.beginPath();
    if (k === 'bomb') { x.moveTo(x0 + S * 0.03, m - hb * 0.35); x.quadraticCurveTo(x0 + S * L * 0.5, m - hb * 1.25, x1 - S * 0.05, m - hb * 0.7); x.quadraticCurveTo(x1 + S * 0.01, m, x1 - S * 0.05, m + hb * 0.7); x.quadraticCurveTo(x0 + S * L * 0.5, m + hb * 1.25, x0 + S * 0.03, m + hb * 0.35); }
    else { x.moveTo(x0, m - hb); x.lineTo(x1 - S * L * 0.42, m - hb); x.quadraticCurveTo(x1 - S * 0.02, m - hb * 0.7, x1, m); x.quadraticCurveTo(x1 - S * 0.02, m + hb * 0.7, x1 - S * L * 0.42, m + hb); x.lineTo(x0, m + hb); }
    x.closePath(); x.strokeStyle = RT_INK; x.lineWidth = lw * 2; x.stroke(); x.fillStyle = body; x.fill();
    x.save(); x.clip();
    if (k === 'bomb') { x.fillStyle = nose; x.fillRect(x1 - S * 0.14, 0, S * 0.05, h); }
    else { x.fillStyle = nose; x.fillRect(x1 - S * L * (k === 'nav' ? 0.3 : 0.22), 0, S, h); x.fillStyle = '#d8a83a'; x.fillRect(x0, 0, S * L * (k === 'torp' ? 0.08 : 0.16), h); if (k === 'nav') { x.fillStyle = '#e8443a'; x.fillRect(x0 + S * L * 0.36, 0, S * 0.03, h); } }
    x.fillStyle = 'rgba(20,20,50,0.3)'; x.fillRect(0, m + hb * 0.2, w, hb * 2); x.fillStyle = 'rgba(255,255,255,0.6)'; x.fillRect(x0 + S * 0.03, m - hb * 0.72, S * L * 0.6, hb * 0.32);
    x.restore();
  });
}
// 부적: 노란 종이에 붉은 무늬(글자가 아닌 도형: 테두리, 고리, 번개 꼴 꺾은선, 점). v 1 벽력 부적(푸른 무늬)
function rtTalismanSpr(S, v) {
  v = v | 0;
  return rtSprOf('tl' + v + ':' + Math.round(S), S * 0.3, S * 0.5, function (x, w, h) {
    var lw = rtLw(S), pw = S * 0.2, ph = S * 0.4, x0 = (w - pw) / 2, y0 = (h - ph) / 2, ink = v ? '#2f6fe0' : '#d8342a';
    x.beginPath(); x.rect(x0, y0, pw, ph); x.strokeStyle = RT_INK; x.lineWidth = lw * 2; x.stroke(); x.fillStyle = '#ffe89a'; x.fill();
    x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(x0, y0, pw * 0.4, ph);
    x.strokeStyle = ink; x.lineWidth = Math.max(1, S * 0.02); x.strokeRect(x0 + pw * 0.14, y0 + ph * 0.07, pw * 0.72, ph * 0.86);
    x.beginPath(); x.arc(w / 2, y0 + ph * 0.25, pw * 0.2, 0, 6.2832); x.stroke();
    x.lineWidth = Math.max(1.2, S * 0.028); x.beginPath(); x.moveTo(w / 2 + pw * 0.16, y0 + ph * 0.42); x.lineTo(w / 2 - pw * 0.16, y0 + ph * 0.55); x.lineTo(w / 2 + pw * 0.16, y0 + ph * 0.66); x.lineTo(w / 2 - pw * 0.12, y0 + ph * 0.8); x.stroke();
    x.fillStyle = ink; x.beginPath(); x.arc(w / 2, y0 + ph * 0.25, pw * 0.07, 0, 6.2832); x.fill();
  });
}
// 벽사 문양(부적이 터질 때 바닥에 번지는 빛 무늬): 겹고리와 여덟 갈래 선, 글자 없음
function rtSealSpr(col) {
  return rtBake('seal' + col, 128, 128, function (x) {
    x.strokeStyle = col; x.lineWidth = 4; x.beginPath(); x.arc(64, 64, 56, 0, 6.2832); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(64, 64, 46, 0, 6.2832); x.stroke(); x.beginPath(); x.arc(64, 64, 20, 0, 6.2832); x.stroke();
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); x.lineWidth = i % 2 ? 2 : 3.5; x.beginPath(); x.moveTo(64 + c * 22, 64 + s * 22); x.lineTo(64 + c * 44, 64 + s * 44); x.stroke(); x.fillStyle = col; x.beginPath(); x.arc(64 + Math.cos(a + 0.39) * 51, 64 + Math.sin(a + 0.39) * 51, 2.6, 0, 6.2832); x.fill(); }
    x.lineWidth = 3; x.beginPath(); for (i = 0; i < 4; i++) { var b = i * Math.PI / 2 + Math.PI / 4; x.lineTo(64 + Math.cos(b) * 34, 64 + Math.sin(b) * 34); } x.closePath(); x.stroke();
  });
}
// 6단계, 합체 탑 발밑 빛 고리: v 0 점선 고리와 마름모, 1 톱니 고리(합체)
function rtAuraSpr(col, v) {
  return rtBake('au' + col + v, 128, 128, function (x) {
    var i, a;
    x.strokeStyle = 'rgba(40,28,80,0.35)'; x.lineWidth = 10; x.beginPath(); x.arc(64, 64, 54, 0, 6.2832); x.stroke();
    x.strokeStyle = rgba(col, 0.95); x.lineWidth = 6.5; x.setLineDash(v ? [16, 9] : [34, 10]); x.beginPath(); x.arc(64, 64, 54, 0, 6.2832); x.stroke(); x.setLineDash([]);
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 1.6; x.beginPath(); x.arc(64, 64, 54, 0, 6.2832); x.stroke();
    x.strokeStyle = rgba(col, 0.6); x.lineWidth = 2; x.beginPath(); x.arc(64, 64, 44, 0, 6.2832); x.stroke();
    for (i = 0; i < (v ? 6 : 4); i++) { a = i / (v ? 6 : 4) * 6.2832; var px = 64 + Math.cos(a) * 54, py = 64 + Math.sin(a) * 54; x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(px, py - 8); x.lineTo(px + 6, py); x.lineTo(px, py + 8); x.lineTo(px - 6, py); x.closePath(); x.fill(); x.fillStyle = col; x.beginPath(); x.moveTo(px, py - 4.5); x.lineTo(px + 3.4, py); x.lineTo(px, py + 4.5); x.lineTo(px - 3.4, py); x.closePath(); x.fill(); }
  });
}

// ---------- 유닛 대체 그림 (탑 그림 갈래의 t3PlaneSpr, t3SoldierFrames, t4DragonFrames가 없을 때만) ----------
function rtPlaneFallback(S) {
  return rtSprOf('pl:' + Math.round(S), S * 0.9, S * 0.8, function (x, w, h) {
    var lw = rtLw(S), m = h / 2, cx = w / 2;
    [-1, 1].forEach(function (sd) { rtPoly(x, [[cx + S * 0.1, m + sd * S * 0.03], [cx - S * 0.04, m + sd * S * 0.3], [cx - S * 0.15, m + sd * S * 0.3], [cx - S * 0.1, m + sd * S * 0.03]], '#5c94c0', lw); rtPoly(x, [[cx - S * 0.22, m + sd * S * 0.02], [cx - S * 0.3, m + sd * S * 0.14], [cx - S * 0.36, m + sd * S * 0.14], [cx - S * 0.33, m + sd * S * 0.02]], '#5c94c0', lw); });
    x.beginPath(); x.ellipse(cx, m, S * 0.34, S * 0.06, 0, 0, 6.2832); x.strokeStyle = RT_INK; x.lineWidth = lw * 2; x.stroke(); x.fillStyle = '#7fb2d6'; x.fill();
    x.fillStyle = '#c8f4ff'; x.beginPath(); x.ellipse(cx + S * 0.1, m, S * 0.075, S * 0.034, 0, 0, 6.2832); x.fill(); x.fillStyle = '#ffd24a'; x.beginPath(); x.arc(cx + S * 0.31, m, S * 0.03, 0, 6.2832); x.fill();
  });
}
function rtSoldierFallback(S, f) {
  var s = RT_C['so' + f + ':' + Math.round(S)]; if (s) return s;
  var w = Math.ceil(S * 0.6), h = Math.ceil(S * 0.72), c = mkC(w, h), x = cx2(c), lw = rtLw(S), cx = w * 0.45, by = h - S * 0.04, sw = f ? S * 0.04 : -S * 0.04;
  x.lineCap = 'round'; x.lineJoin = 'round';
  x.strokeStyle = '#4a3c60'; x.lineWidth = S * 0.05; x.beginPath(); x.moveTo(cx - S * 0.03, by - S * 0.14); x.lineTo(cx - S * 0.03 - sw, by); x.moveTo(cx + S * 0.03, by - S * 0.14); x.lineTo(cx + S * 0.03 + sw, by); x.stroke();
  x.beginPath(); x.rect(cx - S * 0.075, by - S * 0.3, S * 0.15, S * 0.18); x.strokeStyle = RT_INK; x.lineWidth = lw * 2; x.stroke(); x.fillStyle = '#8a6fb0'; x.fill();
  x.beginPath(); x.arc(cx, by - S * 0.39, S * 0.09, 0, 6.2832); x.stroke(); x.fillStyle = '#ffe2cf'; x.fill();
  x.beginPath(); x.arc(cx, by - S * 0.42, S * 0.1, Math.PI, 6.2832); x.closePath(); x.stroke(); x.fillStyle = '#b4bcd0'; x.fill();
  x.strokeStyle = RT_INK; x.lineWidth = S * 0.03 + lw; x.beginPath(); x.moveTo(cx + S * 0.1, by - S * 0.02); x.lineTo(cx + S * 0.16, by - S * 0.58); x.stroke(); x.strokeStyle = '#c98a4a'; x.lineWidth = S * 0.03; x.stroke();
  x.fillStyle = '#eef1f7'; x.beginPath(); x.moveTo(cx + S * 0.16, by - S * 0.67); x.lineTo(cx + S * 0.19, by - S * 0.57); x.lineTo(cx + S * 0.13, by - S * 0.57); x.closePath(); x.fill();
  return (RT_C['so' + f + ':' + Math.round(S)] = { c: c, ax: cx, ay: by });
}
function rtDragonFallback(S, f) {
  return rtSprOf('dg' + f + ':' + Math.round(S), S * 1.7, S * 1.5, function (x, w, h) {
    var lw = rtLw(S), m = h / 2, cx = w / 2, wk = f ? 0.72 : 1;
    [-1, 1].forEach(function (sd) { rtPoly(x, [[cx + S * 0.14, m + sd * S * 0.06], [cx + S * 0.05, m + sd * S * 0.62 * wk], [cx - S * 0.18, m + sd * S * 0.5 * wk], [cx - S * 0.16, m + sd * S * 0.3 * wk], [cx - S * 0.32, m + sd * S * 0.3 * wk], [cx - S * 0.2, m + sd * S * 0.06]], '#f08a4a', lw); });
    x.strokeStyle = RT_INK; x.lineWidth = S * 0.1 + lw * 2; x.beginPath(); x.moveTo(cx - S * 0.7, m + S * 0.08); x.quadraticCurveTo(cx - S * 0.4, m - S * 0.06, cx - S * 0.2, m); x.stroke(); x.strokeStyle = '#e05a3a'; x.lineWidth = S * 0.1; x.stroke();
    x.beginPath(); x.ellipse(cx + S * 0.02, m, S * 0.34, S * 0.14, 0, 0, 6.2832); x.strokeStyle = RT_INK; x.lineWidth = lw * 2; x.stroke(); x.fillStyle = '#e05a3a'; x.fill();
    x.beginPath(); x.ellipse(cx + S * 0.46, m, S * 0.17, S * 0.11, 0, 0, 6.2832); x.stroke(); x.fillStyle = '#ee6c44'; x.fill();
    x.fillStyle = '#ffd24a'; for (var i = 0; i < 5; i++) { x.beginPath(); x.arc(cx - S * 0.22 + i * S * 0.11, m, S * 0.03, 0, 6.2832); x.fill(); }
    x.fillStyle = '#ffe680'; x.beginPath(); x.arc(cx + S * 0.5, m - S * 0.06, S * 0.028, 0, 6.2832); x.arc(cx + S * 0.5, m + S * 0.06, S * 0.028, 0, 6.2832); x.fill();
  });
}
// 전투 시작 때 자주 쓰는 조각을 미리 구워 둠 (첫 폭발, 첫 미사일에서 끊기지 않게). art_fx.js fxWarm이 부름
function rtWarm(S) {
  var i; ['w', 'g', 'd', 'o', 'b'].forEach(function (t) { for (i = 0; i < 3; i++) rtSmokeSpr(t, i); });
  ['he', 'fire', 'flak', 'water'].forEach(rtFireSpr); ['o', 'b', 'g'].forEach(rtFlameSpr); rtMuzzleSpr('y'); rtScorchSpr('scorch');
  for (i = 0; i < 3; i++) { rtChunkSpr('rock', i); rtChunkSpr('steel', i); }
  rtMissileSpr(S, 0); rtRocketSpr(S, 0); rtShellSpr(S, 'flak');
}
