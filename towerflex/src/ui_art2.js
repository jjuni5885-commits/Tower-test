// ===== ui_art2.js : v2.0 화면 그림 (타이틀, 챕터 카드, 챕터 지도, 작은 그림, 앱 아이콘). 그림 안에 글자 없음 =====
// 챕터 색: rift = 균열 [속, 빛, 가장자리], sky = 하늘 3색, land = 지도 땅 3색(진, 중, 밝), road = 길 [바탕, 가장자리]
var UI_CH = {
  1: { rift: ['#fff7fc', '#ff9ccf', '#7fe0c0'], sky: ['#7ccbff', '#bfe4ff', '#ffe1ef'], land: ['#9fdf88', '#b4ea9c', '#cdf4b6'], road: ['#fff6df', '#f0c58e'] },
  2: { rift: ['#fff0d8', '#ff8a2a', '#8a4fe0'], sky: ['#120b26', '#2c1a4e', '#5a2f6e'], land: ['#261a3e', '#32234f', '#3f2d62'], road: ['#b9a6dc', '#1a1030'] },
  3: { rift: ['#eaf6ff', '#ffb300', '#3f86e0'], sky: ['#0d1626', '#1c2f4c', '#3a5578'], land: ['#1f2b42', '#283852', '#33476a'], road: ['#ffb300', '#0f1726'] },
  4: { rift: ['#fff3e0', '#e8483a', '#1fa392'], sky: ['#e9dcc0', '#f3e8cf', '#f8f0dc'], land: ['#e2d0a8', '#ecdcb8', '#f4e8cc'], road: ['#4a4038', '#f7efdc'] }
};
function uiChPal(ch) { return UI_CH[ch] || UI_CH[1]; }

// ---------- 균열: 들쭉날쭉한 세로 틈, 빛무리, 잔금 ----------
function uiRift(x, cx, cy, h, w, cols, seed, a) {
  var rnd = rngOf(seed), n = 10, L = [], R = [], i;
  for (i = 0; i <= n; i++) {
    var t = i / n, prof = Math.pow(Math.sin(Math.PI * t), 0.75), y = cy - h / 2 + h * t, j = (rnd() - 0.5) * w * 0.55 * prof;
    L.push([cx - w / 2 * prof * (0.7 + rnd() * 0.6) + j, y]); R.push([cx + w / 2 * prof * (0.7 + rnd() * 0.6) + j, y]);
  }
  function path(k) { var p = new Path2D(); p.moveTo(L[0][0], L[0][1]); for (i = 1; i <= n; i++) p.lineTo(cx + (L[i][0] - cx) * k, L[i][1]); for (i = n - 1; i >= 0; i--) p.lineTo(cx + (R[i][0] - cx) * k, R[i][1]); p.closePath(); return p; }
  x.save(); x.globalAlpha = a == null ? 1 : a;
  x.save(); x.globalCompositeOperation = 'lighter'; x.translate(cx, cy); x.scale(Math.max(0.35, w * 2.4 / h), 1); glowAt(x, 0, 0, h * 0.72, cols[1], 0.55); glowAt(x, 0, 0, h * 0.45, cols[2], 0.35); x.restore();
  var p1 = path(1);
  x.save(); x.shadowColor = cols[2]; x.shadowBlur = w * 0.9; x.strokeStyle = cols[2]; x.lineWidth = Math.max(2, w * 0.16); x.lineJoin = 'round'; x.stroke(p1); x.restore();
  var g = x.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); g.addColorStop(0, cols[2]); g.addColorStop(0.3, cols[1]); g.addColorStop(0.5, cols[0]); g.addColorStop(0.7, cols[1]); g.addColorStop(1, cols[2]);
  x.fillStyle = g; x.fill(p1);
  x.fillStyle = rgba(cols[0], 0.9); x.fill(path(0.42));
  // 잔금: 위아래 끝과 옆에서 뻗는 가는 금
  x.strokeStyle = rgba(cols[0], 0.85); x.lineWidth = Math.max(1, w * 0.05); x.lineJoin = 'miter';
  [[L[0][0], L[0][1], -1], [L[n][0], L[n][1], 1], [L[3][0], L[3][1], -0.2], [R[6][0], R[6][1], 0.3], [R[2][0], R[2][1], -0.4], [L[7][0], L[7][1], 0.4]].forEach(function (q, k) {
    var px = q[0], py = q[1], dir = k < 2 ? 0 : (k % 2 ? 1 : -1); x.beginPath(); x.moveTo(px, py);
    for (var s = 0; s < 3; s++) { px += (dir * (0.5 + rnd()) + (rnd() - 0.5) * 0.8) * w * 0.55; py += (q[2] * (0.6 + rnd() * 0.6)) * h * 0.07; x.lineTo(px, py); }
    x.stroke();
  });
  x.restore();
}
// 균열에서 새어 나오는 것들의 작은 실루엣 (1 말랑이, 2 박쥐, 3 전투기, 4 도깨비불)
function uiRiftBits(x, ch, cx, cy, u, seed) {
  var rnd = rngOf(seed), P = uiChPal(ch), i;
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  for (i = 0; i < 4; i++) {
    var px = cx + (rnd() - 0.5) * 90 * u, py = cy + (rnd() - 0.5) * 120 * u, s = (5 + rnd() * 5) * u, fl = px < cx ? -1 : 1;
    if (ch === 1) { x.fillStyle = rgba('#ffffff', 0.9); x.beginPath(); x.arc(px, py, s, Math.PI, 0); x.quadraticCurveTo(px + s * 1.15, py + s * 0.9, px, py + s * 0.8); x.quadraticCurveTo(px - s * 1.15, py + s * 0.9, px - s, py); x.fill(); x.fillStyle = P.rift[1]; x.beginPath(); x.arc(px - s * 0.35, py + s * 0.1, s * 0.16, 0, 6.3); x.arc(px + s * 0.35, py + s * 0.1, s * 0.16, 0, 6.3); x.fill(); }
    else if (ch === 2) { x.fillStyle = '#1a0f2e'; uiBat(x, px, py, s * 1.5); }
    else if (ch === 3) { x.save(); x.translate(px, py); x.rotate(fl > 0 ? -0.5 : Math.PI + 0.5); x.strokeStyle = rgba('#ffd98a', 0.7); x.lineWidth = s * 0.25; x.beginPath(); x.moveTo(-s * 1.2, 0); x.lineTo(-s * 4.5, 0); x.stroke(); x.fillStyle = '#101826'; x.beginPath(); x.moveTo(s * 1.6, 0); x.lineTo(-s * 0.4, -s * 0.28); x.lineTo(-s * 0.9, -s * 1.1); x.lineTo(-s * 1.3, -s * 1.1); x.lineTo(-s * 1.0, -s * 0.2); x.lineTo(-s * 1.5, -s * 0.5); x.lineTo(-s * 1.5, s * 0.5); x.lineTo(-s * 1.0, s * 0.2); x.lineTo(-s * 1.3, s * 1.1); x.lineTo(-s * 0.9, s * 1.1); x.lineTo(-s * 0.4, s * 0.28); x.closePath(); x.fill(); x.restore(); }
    else { glowAt(x, px, py, s * 2.6, '#58e6d0', 0.55); x.fillStyle = '#d9fff6'; x.beginPath(); x.moveTo(px, py - s * 1.5); x.quadraticCurveTo(px + s * 1.1, py - s * 0.2, px + s * 0.6, py + s * 0.6); x.quadraticCurveTo(px, py + s * 1.2, px - s * 0.6, py + s * 0.6); x.quadraticCurveTo(px - s * 1.0, py - s * 0.1, px - s * 0.25, py - s * 0.5); x.quadraticCurveTo(px + s * 0.1, py - s * 0.7, px, py - s * 1.5); x.fill(); }
  }
  x.restore();
}
function uiBat(x, X, Y, s) {
  x.beginPath(); x.moveTo(X, Y - s * 0.25); x.quadraticCurveTo(X + s * 0.5, Y - s * 0.75, X + s * 1.15, Y - s * 0.3); x.quadraticCurveTo(X + s * 0.95, Y - s * 0.05, X + s * 0.85, Y + s * 0.25); x.quadraticCurveTo(X + s * 0.6, Y, X + s * 0.42, Y + s * 0.22); x.quadraticCurveTo(X + s * 0.25, Y + s * 0.02, X, Y + s * 0.32);
  x.quadraticCurveTo(X - s * 0.25, Y + s * 0.02, X - s * 0.42, Y + s * 0.22); x.quadraticCurveTo(X - s * 0.6, Y, X - s * 0.85, Y + s * 0.25); x.quadraticCurveTo(X - s * 0.95, Y - s * 0.05, X - s * 1.15, Y - s * 0.3); x.quadraticCurveTo(X - s * 0.5, Y - s * 0.75, X, Y - s * 0.25); x.fill();
  x.beginPath(); x.moveTo(X - s * 0.16, Y - s * 0.2); x.lineTo(X - s * 0.12, Y - s * 0.5); x.lineTo(X, Y - s * 0.28); x.lineTo(X + s * 0.12, Y - s * 0.5); x.lineTo(X + s * 0.16, Y - s * 0.2); x.fill();
}

// ---------- 철옹성: 짙은 강철 성채, 금빛 창과 성문, 붉은 깃발 ----------
// cx 가운데, by 밑동, u 배율(성 폭 약 330u). tint: 왼쪽/오른쪽에서 비치는 균열 빛 색
function uiFortress(x, cx, by, u, tintL, tintR) {
  var A = '#141a3a', B = '#262f5e', C = '#3a4780', D = '#566aa8', GOLD = '#ffcf5a', GLOW = '#ffe9a8';
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  function stone(x0, y0, w, h, rows) { x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip(); x.strokeStyle = 'rgba(10,12,30,0.32)'; x.lineWidth = Math.max(1, 1.1 * u); for (var r = 1; r < rows; r++) { var yy = y0 + h * r / rows; x.beginPath(); x.moveTo(x0, yy); x.lineTo(x0 + w, yy); x.stroke(); for (var c = (r % 2) * 0.5; c < 6; c++) { var xx = x0 + w * (c + 0.25) / 5; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy + h / rows); x.stroke(); } } x.restore(); }
  function body(x0, y0, w, h, rows) {
    var g = x.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, C); g.addColorStop(0.35, B); g.addColorStop(1, A);
    x.fillStyle = g; x.fillRect(x0, y0, w, h); stone(x0, y0, w, h, rows);
    x.fillStyle = rgba(tintL || D, 0.5); x.fillRect(x0, y0, Math.max(1.5, 2.5 * u), h);
    x.fillStyle = rgba(tintR || D, 0.38); x.fillRect(x0 + w - Math.max(1.5, 2 * u), y0, Math.max(1.5, 2 * u), h);
  }
  function merlons(x0, y0, w, n, mh) { var mw = w / (n * 2 - 1); for (var i = 0; i < n; i++) { var g = x.createLinearGradient(0, y0 - mh, 0, y0); g.addColorStop(0, D); g.addColorStop(1, B); x.fillStyle = g; x.fillRect(x0 + i * 2 * mw, y0 - mh, mw, mh + 1); x.fillStyle = rgba(GOLD, 0.85); x.fillRect(x0 + i * 2 * mw, y0 - mh, mw, Math.max(1, 1.6 * u)); } }
  function win(wx, wy, w, h) { glowAt(x, wx, wy, w * 2.6, GLOW, 0.5); var p = new Path2D(); p.moveTo(wx - w / 2, wy + h / 2); p.lineTo(wx - w / 2, wy - h / 4); p.quadraticCurveTo(wx - w / 2, wy - h / 2, wx, wy - h / 2); p.quadraticCurveTo(wx + w / 2, wy - h / 2, wx + w / 2, wy - h / 4); p.lineTo(wx + w / 2, wy + h / 2); p.closePath(); x.fillStyle = '#0d1028'; x.fill(p); x.save(); x.translate(wx, wy); x.scale(0.72, 0.8); x.translate(-wx, -wy); var g = x.createLinearGradient(0, wy - h / 2, 0, wy + h / 2); g.addColorStop(0, '#fff6cf'); g.addColorStop(1, '#ffb53a'); x.fillStyle = g; x.fill(p); x.restore(); }
  function flag(fx, fy, h, col, dir) { x.strokeStyle = '#0d1028'; x.lineWidth = Math.max(1.2, 2 * u); x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx, fy - h); x.stroke(); var p = new Path2D(), w = h * 0.9 * dir; p.moveTo(fx, fy - h); p.quadraticCurveTo(fx + w * 0.5, fy - h - h * 0.12, fx + w, fy - h + h * 0.08); p.lineTo(fx + w * 0.72, fy - h + h * 0.26); p.lineTo(fx + w, fy - h + h * 0.48); p.quadraticCurveTo(fx + w * 0.5, fy - h + h * 0.36, fx, fy - h + h * 0.5); p.closePath(); var g = x.createLinearGradient(0, fy - h, 0, fy - h * 0.5); g.addColorStop(0, lit(col, 0.3)); g.addColorStop(1, drk(col, 0.2)); x.fillStyle = g; x.fill(p); x.fillStyle = GOLD; x.beginPath(); x.arc(fx, fy - h, Math.max(1.2, 2 * u), 0, 6.3); x.fill(); }
  function spire(tx, ty, w, h, col) { var p = new Path2D(); p.moveTo(tx - w / 2, ty); p.quadraticCurveTo(tx - w * 0.2, ty - h * 0.55, tx, ty - h); p.quadraticCurveTo(tx + w * 0.2, ty - h * 0.55, tx + w / 2, ty); p.closePath(); var g = x.createLinearGradient(tx - w / 2, 0, tx + w / 2, 0); g.addColorStop(0, lit(col, 0.25)); g.addColorStop(0.45, col); g.addColorStop(1, drk(col, 0.45)); x.fillStyle = g; x.fill(p); x.fillStyle = rgba(GOLD, 0.9); x.fillRect(tx - w / 2, ty - Math.max(1, 2 * u), w, Math.max(1.5, 3 * u)); }
  function tower(tx, w, h, sp, rows, fcol, fdir) {
    body(tx - w / 2, by - h, w, h, rows);
    var cw = w * 1.22, ch = 11 * u; var g = x.createLinearGradient(0, by - h - ch, 0, by - h); g.addColorStop(0, C); g.addColorStop(1, A); x.fillStyle = g; x.fillRect(tx - cw / 2, by - h - ch, cw, ch);
    x.fillStyle = rgba(GOLD, 0.8); x.fillRect(tx - cw / 2, by - h - 1, cw, Math.max(1, 2 * u));
    merlons(tx - cw / 2, by - h - ch, cw, 4, 9 * u);
    if (sp) { spire(tx, by - h - ch - 6 * u, w * 0.86, sp, '#7a2a3e'); flag(tx, by - h - ch - 6 * u - sp, 24 * u, fcol || '#e8483a', fdir || 1); }
    win(tx, by - h * 0.72, w * 0.26, 16 * u); if (h > 120 * u) win(tx, by - h * 0.42, w * 0.22, 13 * u);
  }
  // 뒤 성벽과 바깥 탑
  softShadow(x, cx, by + 4 * u, 190 * u, 16 * u, 0.6);
  tower(cx - 148 * u, 40 * u, 96 * u, 34 * u, 6, '#3f86e0', -1);
  tower(cx + 148 * u, 40 * u, 96 * u, 34 * u, 6, '#1fa392', 1);
  body(cx - 130 * u, by - 62 * u, 260 * u, 62 * u, 4); merlons(cx - 130 * u, by - 62 * u, 260 * u, 14, 8 * u);
  // 가운데 양옆 탑
  tower(cx - 84 * u, 46 * u, 136 * u, 46 * u, 8, '#ff9ccf', -1);
  tower(cx + 84 * u, 46 * u, 136 * u, 46 * u, 8, '#ff8a2a', 1);
  // 본성(가운데)
  var kw = 104 * u, kh = 168 * u;
  body(cx - kw / 2, by - kh, kw, kh, 10);
  var cw2 = kw * 1.16, ch2 = 14 * u; x.fillStyle = B; x.fillRect(cx - cw2 / 2, by - kh - ch2, cw2, ch2); x.fillStyle = rgba(GOLD, 0.9); x.fillRect(cx - cw2 / 2, by - kh - 1, cw2, Math.max(1.5, 2.5 * u));
  merlons(cx - cw2 / 2, by - kh - ch2, cw2, 6, 11 * u);
  spire(cx, by - kh - ch2 - 8 * u, kw * 0.56, 64 * u, '#8a2f44'); flag(cx, by - kh - ch2 - 8 * u - 64 * u, 34 * u, '#ffcf5a', 1);
  // 문장(방패와 별)
  var sy = by - kh * 0.7, sp2 = new Path2D(); sp2.moveTo(cx - 16 * u, sy - 16 * u); sp2.lineTo(cx + 16 * u, sy - 16 * u); sp2.lineTo(cx + 16 * u, sy + 2 * u); sp2.quadraticCurveTo(cx + 14 * u, sy + 16 * u, cx, sy + 22 * u); sp2.quadraticCurveTo(cx - 14 * u, sy + 16 * u, cx - 16 * u, sy + 2 * u); sp2.closePath();
  glowAt(x, cx, sy, 46 * u, GLOW, 0.35); uiCandy(x, sp2, sy - 16 * u, sy + 22 * u, ['#ffe9a8', '#ffc23a', '#e08a12'], '#3a2410', 1.6 * u); x.fillStyle = '#7a2a3e'; x.fill(uiStarPath(cx, sy + 1 * u, 9 * u, 4 * u, 5));
  win(cx - 28 * u, by - kh * 0.46, 13 * u, 18 * u); win(cx + 28 * u, by - kh * 0.46, 13 * u, 18 * u);
  // 성문: 금빛으로 새어 나오는 빛
  var gw = 46 * u, gh = 64 * u; glowAt(x, cx, by - gh * 0.4, 90 * u, GLOW, 0.5);
  var gp = new Path2D(); gp.moveTo(cx - gw / 2, by); gp.lineTo(cx - gw / 2, by - gh * 0.55); gp.quadraticCurveTo(cx - gw / 2, by - gh, cx, by - gh); gp.quadraticCurveTo(cx + gw / 2, by - gh, cx + gw / 2, by - gh * 0.55); gp.lineTo(cx + gw / 2, by); gp.closePath();
  x.strokeStyle = '#0b0e24'; x.lineWidth = 7 * u; x.stroke(gp); x.strokeStyle = GOLD; x.lineWidth = 2.4 * u; x.stroke(gp);
  var gg = x.createLinearGradient(0, by - gh, 0, by); gg.addColorStop(0, '#ffb53a'); gg.addColorStop(0.6, '#fff1c0'); gg.addColorStop(1, '#ffffff'); x.fillStyle = gg; x.fill(gp);
  x.save(); x.clip(gp); x.strokeStyle = 'rgba(60,30,10,0.55)'; x.lineWidth = 2.2 * u; for (var i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(cx + i * 9 * u, by - gh); x.lineTo(cx + i * 9 * u, by); x.stroke(); } for (i = 1; i < 5; i++) { x.beginPath(); x.moveTo(cx - gw, by - gh * i / 5); x.lineTo(cx + gw, by - gh * i / 5); x.stroke(); } x.restore();
  // 성문 앞으로 쏟아지는 빛
  var lp = new Path2D(); lp.moveTo(cx - gw / 2, by); lp.lineTo(cx + gw / 2, by); lp.lineTo(cx + gw * 1.5, by + 46 * u); lp.lineTo(cx - gw * 1.5, by + 46 * u); lp.closePath(); var lg = x.createLinearGradient(0, by, 0, by + 46 * u); lg.addColorStop(0, 'rgba(255,225,150,0.55)'); lg.addColorStop(1, 'rgba(255,225,150,0)'); x.fillStyle = lg; x.fill(lp);
  x.restore();
}

// ---------- 타이틀 그림: 밤하늘에 열린 네 균열, 그 앞의 철옹성 ----------
function uiTitleArt2(c) {
  var W = c.width, H = c.height, x = cx2(c), rnd = rngOf(2026), u = Math.min(W / 400, H / 700), i;
  x.lineCap = 'round'; x.lineJoin = 'round';
  var sky = x.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#060818'); sky.addColorStop(0.3, '#12163c'); sky.addColorStop(0.55, '#2c2466'); sky.addColorStop(0.72, '#5a2f72'); sky.addColorStop(0.84, '#a2485e'); sky.addColorStop(1, '#1a1330');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);
  var dp = W / Math.max(1, window.innerWidth || W), by = Math.min(H * 0.8, H * 0.87 - 60 * dp), cxp = W / 2;
  // 별
  for (i = 0; i < 90; i++) { var sx = rnd() * W, sy = rnd() * H * 0.6, r = (0.5 + rnd() * 1.3) * u; x.fillStyle = 'rgba(255,255,255,' + (0.25 + rnd() * 0.6) + ')'; x.beginPath(); x.arc(sx, sy, r, 0, 6.3); x.fill(); }
  for (i = 0; i < 7; i++) uiSpark(x, rnd() * W, rnd() * H * 0.3, (4 + rnd() * 5) * u, '#ffffff', 0.7);
  // 성 뒤에서 솟는 빛기둥
  var rc = mkC(W, H), rx = cx2(rc), R = Math.max(W, H);
  rx.fillStyle = '#ffd98a'; for (i = 0; i < 14; i++) { var a0 = -Math.PI + i * Math.PI / 13.5 + 0.03, a1 = a0 + Math.PI / 30; rx.beginPath(); rx.moveTo(cxp, by - 60 * u); rx.arc(cxp, by - 60 * u, R, a0, a1); rx.closePath(); rx.fill(); }
  rx.globalCompositeOperation = 'destination-in'; var rg = rx.createRadialGradient(cxp, by - 60 * u, 0, cxp, by - 60 * u, H * 0.62); rg.addColorStop(0, 'rgba(0,0,0,0.42)'); rg.addColorStop(0.55, 'rgba(0,0,0,0.1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); rx.fillStyle = rg; rx.fillRect(0, 0, W, H);
  x.drawImage(rc, 0, 0);
  glowAt(x, cxp, by - 90 * u, W * 0.7, '#ff9a6a', 0.38);
  // 네 균열 (왼쪽부터 1장 말랑, 2장 밤, 3장 강철, 4장 도깨비)
  var RX = [0.12, 0.35, 0.65, 0.88], RY = [0.56, 0.47, 0.47, 0.56], RH = [0.25, 0.34, 0.34, 0.25];
  for (i = 0; i < 4; i++) { var P = uiChPal(i + 1); uiRift(x, W * RX[i], H * RY[i], H * RH[i], 30 * u + (i === 1 || i === 2 ? 8 * u : 0), P.rift, 31 + i * 7); uiRiftBits(x, i + 1, W * RX[i], H * RY[i], u, 5 + i); }
  // 먼 산등성이
  function ridge(y0, amp, seed, col) { var rr = rngOf(seed), p = new Path2D(), px = -10; p.moveTo(-10, H); p.lineTo(-10, y0); while (px < W + 20) { px += (18 + rr() * 30) * u; p.lineTo(px, y0 - rr() * amp); } p.lineTo(W + 20, H); p.closePath(); x.fillStyle = col; x.fill(p); }
  ridge(by - 26 * u, 44 * u, 3, '#241c4c'); ridge(by - 6 * u, 26 * u, 9, '#1a1438');
  // 철옹성
  var fu = Math.min(u * 1.08, W / 390);
  uiFortress(x, cxp, by, fu, '#ff9ccf', '#ffb300');
  // 앞 절벽과 바위
  var gr = x.createLinearGradient(0, by, 0, H); gr.addColorStop(0, '#1c1740'); gr.addColorStop(0.3, '#120f2c'); gr.addColorStop(1, '#07061a');
  var gp = new Path2D(), rr2 = rngOf(17), px2 = -10; gp.moveTo(-10, H); gp.lineTo(-10, by + 6 * u); while (px2 < W + 20) { px2 += (22 + rr2() * 26) * u; var near = Math.abs(px2 - cxp) < 80 * u; gp.lineTo(px2, by + (near ? 2 : -4 - rr2() * 12) * u); } gp.lineTo(W + 20, H); gp.closePath();
  x.fillStyle = gr; x.fill(gp); x.strokeStyle = 'rgba(160,130,230,0.45)'; x.lineWidth = Math.max(1, 1.6 * u); x.stroke(gp);
  // 성문 빛이 닿는 길
  var rd = new Path2D(); rd.moveTo(cxp - 24 * fu, by + 2 * u); rd.lineTo(cxp + 24 * fu, by + 2 * u); rd.lineTo(cxp + 90 * u, H); rd.lineTo(cxp - 90 * u, H); rd.closePath(); var rdg = x.createLinearGradient(0, by, 0, H); rdg.addColorStop(0, 'rgba(255,220,150,0.5)'); rdg.addColorStop(0.5, 'rgba(255,190,120,0.12)'); rdg.addColorStop(1, 'rgba(255,190,120,0)'); x.fillStyle = rdg; x.fill(rd);
  // 아래 어둠(시작 단추 뒤)과 가장자리 어둡게
  var vg = x.createRadialGradient(cxp, H * 0.5, H * 0.3, cxp, H * 0.5, H * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(4,4,16,0.6)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  // 떠오르는 불티
  for (i = 0; i < 26; i++) { var ex = rnd() * W, ey = by - rnd() * H * 0.45, er = (0.8 + rnd() * 1.6) * u; x.fillStyle = 'rgba(255,' + Math.round(190 + rnd() * 50) + ',120,' + (0.3 + rnd() * 0.5) + ')'; x.beginPath(); x.arc(ex, ey, er, 0, 6.3); x.fill(); }
}

// ---------- 분위기 소품 (2 공포, 3 군사, 4 한국 전통) ----------
function uiDeadTree(x, X, Y, S, col) {
  x.save(); x.strokeStyle = col || '#120b22'; x.lineCap = 'round'; x.lineWidth = S * 0.09; x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X - S * 0.04, Y - S * 0.35, X + S * 0.03, Y - S * 0.6); x.stroke();
  x.lineWidth = S * 0.05; [[0.03, -0.6, 0.3, -0.92], [0.02, -0.5, -0.28, -0.8], [0.0, -0.36, 0.26, -0.52], [-0.02, -0.3, -0.24, -0.44]].forEach(function (b) { x.beginPath(); x.moveTo(X + b[0] * S, Y + b[1] * S); x.quadraticCurveTo(X + (b[0] + b[2]) / 2 * S, Y + b[3] * S + S * 0.1, X + b[2] * S, Y + b[3] * S); x.stroke(); });
  x.lineWidth = S * 0.028; [[0.3, -0.92, 0.42, -0.86], [0.3, -0.92, 0.26, -1.04], [-0.28, -0.8, -0.4, -0.78], [-0.28, -0.8, -0.24, -0.94]].forEach(function (b) { x.beginPath(); x.moveTo(X + b[0] * S, Y + b[1] * S); x.lineTo(X + b[2] * S, Y + b[3] * S); x.stroke(); });
  x.restore();
}
function uiTomb(x, X, Y, S, cross) {
  softShadow(x, X, Y, S * 0.32, S * 0.08, 0.5);
  var p = new Path2D(); p.moveTo(X - S * 0.2, Y); p.lineTo(X - S * 0.2, Y - S * 0.3); p.quadraticCurveTo(X - S * 0.2, Y - S * 0.52, X, Y - S * 0.52); p.quadraticCurveTo(X + S * 0.2, Y - S * 0.52, X + S * 0.2, Y - S * 0.3); p.lineTo(X + S * 0.2, Y); p.closePath();
  uiCandy(x, p, Y - S * 0.52, Y, ['#a99cc8', '#7a6c9e', '#55487a'], '#1a1030', S * 0.03);
  x.strokeStyle = 'rgba(26,16,48,0.7)'; x.lineWidth = S * 0.04; x.beginPath();
  if (cross) { x.moveTo(X, Y - S * 0.42); x.lineTo(X, Y - S * 0.16); x.moveTo(X - S * 0.09, Y - S * 0.33); x.lineTo(X + S * 0.09, Y - S * 0.33); } else { x.moveTo(X - S * 0.1, Y - S * 0.32); x.lineTo(X + S * 0.1, Y - S * 0.32); x.moveTo(X - S * 0.1, Y - S * 0.22); x.lineTo(X + S * 0.06, Y - S * 0.22); }
  x.stroke();
}
function uiPumpkin(x, X, Y, S) {
  glowAt(x, X, Y - S * 0.2, S * 0.6, '#ff9a2a', 0.45);
  var p = new Path2D(); [-0.16, 0, 0.16].forEach(function (o) { p.moveTo(X + o * S + S * 0.17, Y - S * 0.2); p.ellipse(X + o * S, Y - S * 0.2, S * 0.17, S * 0.2, 0, 0, Math.PI * 2); });
  uiCandy(x, p, Y - S * 0.42, Y, ['#ffc45a', '#ff8a2a', '#d85a10'], '#3a1608', S * 0.03);
  x.fillStyle = '#2f6a2a'; x.fillRect(X - S * 0.03, Y - S * 0.48, S * 0.06, S * 0.1);
  x.fillStyle = '#fff2a8'; x.beginPath(); x.moveTo(X - S * 0.16, Y - S * 0.24); x.lineTo(X - S * 0.06, Y - S * 0.3); x.lineTo(X - S * 0.07, Y - S * 0.19); x.closePath(); x.moveTo(X + S * 0.16, Y - S * 0.24); x.lineTo(X + S * 0.06, Y - S * 0.3); x.lineTo(X + S * 0.07, Y - S * 0.19); x.closePath();
  x.moveTo(X - S * 0.15, Y - S * 0.13); x.lineTo(X - S * 0.07, Y - S * 0.08); x.lineTo(X, Y - S * 0.13); x.lineTo(X + S * 0.07, Y - S * 0.08); x.lineTo(X + S * 0.15, Y - S * 0.13); x.lineTo(X + S * 0.08, Y - S * 0.03); x.lineTo(X - S * 0.08, Y - S * 0.03); x.closePath(); x.fill();
}
function uiBunker(x, X, Y, S) {
  softShadow(x, X, Y, S * 0.4, S * 0.09, 0.5);
  var p = new Path2D(); p.moveTo(X - S * 0.34, Y); p.lineTo(X - S * 0.28, Y - S * 0.22); p.quadraticCurveTo(X, Y - S * 0.4, X + S * 0.28, Y - S * 0.22); p.lineTo(X + S * 0.34, Y); p.closePath();
  uiCandy(x, p, Y - S * 0.36, Y, ['#8fa0b8', '#5f718c', '#42526c'], '#0c1422', S * 0.03);
  x.fillStyle = '#0c1422'; x.fill(uiRR(X - S * 0.16, Y - S * 0.2, S * 0.32, S * 0.07, S * 0.02)); x.fillStyle = '#ffb300'; x.fillRect(X - S * 0.12, Y - S * 0.185, S * 0.07, S * 0.035);
}
function uiRadar(x, X, Y, S) {
  softShadow(x, X, Y, S * 0.26, S * 0.07, 0.5);
  x.strokeStyle = '#0c1422'; x.lineWidth = S * 0.09; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - S * 0.34); x.stroke(); x.strokeStyle = '#7f92ae'; x.lineWidth = S * 0.045; x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - S * 0.34); x.stroke();
  x.save(); x.translate(X, Y - S * 0.4); x.rotate(-0.6); var p = new Path2D(); p.moveTo(-S * 0.26, 0); p.quadraticCurveTo(0, S * 0.22, S * 0.26, 0); p.quadraticCurveTo(0, S * 0.06, -S * 0.26, 0); p.closePath(); uiCandy(x, p, 0, S * 0.14, ['#dfe8f4', '#9fb0c8'], '#0c1422', S * 0.028);
  x.strokeStyle = '#0c1422'; x.lineWidth = S * 0.03; x.beginPath(); x.moveTo(0, S * 0.06); x.lineTo(0, -S * 0.14); x.stroke(); x.fillStyle = '#ffb300'; x.beginPath(); x.arc(0, -S * 0.16, S * 0.045, 0, 6.3); x.fill(); x.restore();
}
function uiCrate(x, X, Y, S, col) {
  softShadow(x, X, Y, S * 0.3, S * 0.07, 0.45);
  uiCandy(x, uiRR(X - S * 0.24, Y - S * 0.26, S * 0.48, S * 0.26, S * 0.03), Y - S * 0.26, Y, [lit(col, 0.3), col, drk(col, 0.25)], '#0c1422', S * 0.028);
  x.strokeStyle = 'rgba(12,20,34,0.5)'; x.lineWidth = S * 0.02; for (var i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(X + i * S * 0.08, Y - S * 0.24); x.lineTo(X + i * S * 0.08, Y - S * 0.02); x.stroke(); }
}
// 먹선 소나무: 굽은 줄기, 납작한 솔잎 뭉치
function uiInkPine(x, X, Y, S) {
  x.save(); x.lineCap = 'round'; x.strokeStyle = '#4a3a30'; x.lineWidth = S * 0.08; x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + S * 0.12, Y - S * 0.3, X - S * 0.04, Y - S * 0.55); x.quadraticCurveTo(X - S * 0.12, Y - S * 0.7, X + S * 0.04, Y - S * 0.82); x.stroke();
  [[-0.2, -0.56, 0.3], [0.2, -0.7, 0.28], [-0.02, -0.9, 0.34], [0.24, -0.42, 0.2]].forEach(function (q) { var p = new Path2D(); p.ellipse(X + q[0] * S, Y + q[1] * S, q[2] * S, q[2] * S * 0.36, 0, 0, Math.PI * 2); uiCandy(x, p, Y + q[1] * S - q[2] * S * 0.4, Y + q[1] * S + q[2] * S * 0.4, ['#5fae8a', '#2f7a66', '#1f5a50'], '#22302c', S * 0.022); });
  x.restore();
}
// 기와집: 흰 벽, 붉은 기둥, 휜 먹빛 지붕
function uiGiwa(x, X, Y, S) {
  softShadow(x, X, Y, S * 0.46, S * 0.08, 0.3);
  uiCandy(x, uiRR(X - S * 0.3, Y - S * 0.26, S * 0.6, S * 0.26, S * 0.02), Y - S * 0.26, Y, ['#fbf4e2', '#e6d6b4'], '#3a302a', S * 0.024);
  x.fillStyle = '#b8382c'; [-0.28, -0.1, 0.08, 0.26].forEach(function (o) { x.fillRect(X + o * S - S * 0.02, Y - S * 0.26, S * 0.045, S * 0.26); });
  x.fillStyle = '#1f8a7c'; x.fillRect(X - S * 0.3, Y - S * 0.285, S * 0.6, S * 0.035);
  var p = new Path2D(); p.moveTo(X - S * 0.48, Y - S * 0.27); p.quadraticCurveTo(X - S * 0.3, Y - S * 0.32, X - S * 0.2, Y - S * 0.5); p.lineTo(X + S * 0.2, Y - S * 0.5); p.quadraticCurveTo(X + S * 0.3, Y - S * 0.32, X + S * 0.48, Y - S * 0.27); p.quadraticCurveTo(X + S * 0.42, Y - S * 0.24, X + S * 0.36, Y - S * 0.26); p.lineTo(X - S * 0.36, Y - S * 0.26); p.quadraticCurveTo(X - S * 0.42, Y - S * 0.24, X - S * 0.48, Y - S * 0.27); p.closePath();
  uiCandy(x, p, Y - S * 0.5, Y - S * 0.25, ['#6a6470', '#3f3a46', '#2a2630'], '#17141c', S * 0.024);
  x.strokeStyle = 'rgba(255,255,255,0.16)'; x.lineWidth = S * 0.014; for (var i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(X + i * S * 0.06, Y - S * 0.49); x.lineTo(X + i * S * 0.085, Y - S * 0.28); x.stroke(); }
}
// 장승: 나무 기둥, 탈 같은 얼굴, 붉은 머리 띠
function uiJangProp(x, X, Y, S) {
  softShadow(x, X, Y, S * 0.2, S * 0.06, 0.3);
  var p = uiRR(X - S * 0.1, Y - S * 0.62, S * 0.2, S * 0.62, S * 0.06); uiCandy(x, p, Y - S * 0.62, Y, ['#d8a870', '#a8733f', '#7a4f28'], '#33200f', S * 0.025);
  x.fillStyle = '#b8382c'; x.fill(uiRR(X - S * 0.12, Y - S * 0.66, S * 0.24, S * 0.08, S * 0.03));
  x.fillStyle = '#fff6e0'; x.beginPath(); x.arc(X - S * 0.045, Y - S * 0.47, S * 0.032, 0, 6.3); x.arc(X + S * 0.045, Y - S * 0.47, S * 0.032, 0, 6.3); x.fill(); x.fillStyle = '#1c120a'; x.beginPath(); x.arc(X - S * 0.045, Y - S * 0.47, S * 0.014, 0, 6.3); x.arc(X + S * 0.045, Y - S * 0.47, S * 0.014, 0, 6.3); x.fill();
  x.strokeStyle = '#1c120a'; x.lineWidth = S * 0.022; x.beginPath(); x.moveTo(X - S * 0.06, Y - S * 0.37); x.quadraticCurveTo(X, Y - S * 0.32, X + S * 0.06, Y - S * 0.37); x.stroke();
}
// 먹 번짐 산: 겹겹이 옅어지는 봉우리
function uiInkHill(x, X, Y, w, h, col, a) {
  var p = new Path2D(); p.moveTo(X - w / 2, Y); p.quadraticCurveTo(X - w * 0.3, Y - h * 0.2, X - w * 0.16, Y - h * 0.82); p.quadraticCurveTo(X - w * 0.08, Y - h * 1.06, X + w * 0.02, Y - h * 0.84); p.quadraticCurveTo(X + w * 0.12, Y - h * 0.62, X + w * 0.2, Y - h * 0.7); p.quadraticCurveTo(X + w * 0.36, Y - h * 0.3, X + w / 2, Y); p.closePath();
  var g = x.createLinearGradient(0, Y - h, 0, Y); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.75, rgba(col, a * 0.25)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fill(p);
}
// 단청 띠: 초록 바탕에 붉은, 파란, 흰 무늬가 되풀이
function uiDancheong(x, x0, y0, w, h) {
  x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
  x.fillStyle = '#1f8a7c'; x.fillRect(x0, y0, w, h);
  var n = Math.ceil(w / (h * 1.6)) + 1, cw = h * 1.6;
  for (var i = 0; i < n; i++) { var cx = x0 + i * cw + cw / 2, cy = y0 + h / 2;
    x.fillStyle = '#c8402e'; x.beginPath(); x.arc(cx, cy, h * 0.42, 0, 6.3); x.fill(); x.fillStyle = '#f6efdc'; x.beginPath(); x.arc(cx, cy, h * 0.28, 0, 6.3); x.fill(); x.fillStyle = '#2f62b8'; x.beginPath(); x.arc(cx, cy, h * 0.16, 0, 6.3); x.fill();
    x.fillStyle = '#f0b83a'; x.beginPath(); x.moveTo(cx + cw / 2, y0 + h * 0.12); x.lineTo(cx + cw / 2 + h * 0.28, cy); x.lineTo(cx + cw / 2, y0 + h * 0.88); x.lineTo(cx + cw / 2 - h * 0.28, cy); x.closePath(); x.fill(); }
  x.fillStyle = '#c8402e'; x.fillRect(x0, y0, w, h * 0.12); x.fillRect(x0, y0 + h * 0.88, w, h * 0.12);
  x.restore();
}

// ---------- 챕터 카드 그림: 그 세계의 풍경과 균열 (가로로 긴 띠) ----------
function uiChCard(ch, w, h) {
  var c = mkC(w, h), x = cx2(c), P = uiChPal(ch), rnd = rngOf(40 + ch * 13), u = h / 100, i;
  x.lineCap = 'round'; x.lineJoin = 'round';
  var sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, P.sky[0]); sky.addColorStop(0.6, P.sky[1]); sky.addColorStop(1, P.sky[2]); x.fillStyle = sky; x.fillRect(0, 0, w, h);
  var gy = h * 0.72;
  function ground(y0, amp, seed, cols) { var rr = rngOf(seed), p = new Path2D(), px = -10; p.moveTo(-10, h); p.lineTo(-10, y0); while (px < w + 20) { px += (30 + rr() * 40) * u; p.quadraticCurveTo(px - 18 * u, y0 - rr() * amp * 1.4, px, y0 - rr() * amp * 0.4); } p.lineTo(w + 20, h); p.closePath(); var g = x.createLinearGradient(0, y0 - amp, 0, h); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]); x.fillStyle = g; x.fill(p); }
  if (ch === 1) {
    glowAt(x, w * 0.16, h * 0.2, 60 * u, '#fff7c8', 0.9); x.fillStyle = '#fff2a6'; x.beginPath(); x.arc(w * 0.16, h * 0.2, 13 * u, 0, 6.3); x.fill();
    uiCloud(x, w * 0.36, h * 0.3, 70 * u, 0.95); uiCloud(x, w * 0.92, h * 0.22, 60 * u, 0.9);
    uiRift(x, w * 0.7, h * 0.4, h * 0.62, 16 * u, P.rift, 11, 0.95);
    ground(gy - 8 * u, 16 * u, 5, ['#c9b8f2', '#b4a0ea']); ground(gy, 12 * u, 8, ['#a9e890', '#86d67a']);
    uiTree(x, w * 0.08, h * 0.96, 46 * u, '#ff9cc8', '#fff'); uiTree(x, w * 0.5, h * 0.9, 38 * u, '#8fe0b0'); uiBush(x, w * 0.3, h * 0.97, 34 * u, '#7fd69a'); uiMush(x, w * 0.88, h * 0.95, 34 * u, '#ff8fb8'); uiTree(x, w * 0.97, h * 0.92, 40 * u, '#b79cf7');
    for (i = 0; i < 6; i++) uiFlower(x, rnd() * w, gy + (10 + rnd() * 16) * u, (2.5 + rnd() * 2) * u, ['#fff', '#ffd0e4', '#fff3a0'][i % 3]);
  } else if (ch === 2) {
    for (i = 0; i < 30; i++) { x.fillStyle = 'rgba(255,240,220,' + (0.2 + rnd() * 0.5) + ')'; x.beginPath(); x.arc(rnd() * w, rnd() * h * 0.6, (0.5 + rnd()) * u, 0, 6.3); x.fill(); }
    glowAt(x, w * 0.2, h * 0.3, 70 * u, '#ffb45a', 0.6); var mg = x.createRadialGradient(w * 0.19, h * 0.27, 0, w * 0.2, h * 0.3, 20 * u); mg.addColorStop(0, '#fff3d0'); mg.addColorStop(1, '#ffb45a'); x.fillStyle = mg; x.beginPath(); x.arc(w * 0.2, h * 0.3, 19 * u, 0, 6.3); x.fill();
    x.fillStyle = '#0f0820'; uiBat(x, w * 0.34, h * 0.22, 9 * u); uiBat(x, w * 0.44, h * 0.36, 6 * u); uiBat(x, w * 0.09, h * 0.14, 5 * u);
    uiRift(x, w * 0.72, h * 0.4, h * 0.62, 16 * u, P.rift, 12, 0.95);
    ground(gy - 10 * u, 18 * u, 6, ['#3a2560', '#2a1a48']);
    // 폐저택 실루엣
    x.fillStyle = '#140c28'; x.fillRect(w * 0.5, gy - 34 * u, 30 * u, 34 * u); x.beginPath(); x.moveTo(w * 0.5 - 3 * u, gy - 34 * u); x.lineTo(w * 0.5 + 15 * u, gy - 52 * u); x.lineTo(w * 0.5 + 33 * u, gy - 34 * u); x.closePath(); x.fill(); x.fillRect(w * 0.5 + 22 * u, gy - 58 * u, 6 * u, 26 * u);
    x.fillStyle = '#ffb45a'; x.fillRect(w * 0.5 + 6 * u, gy - 24 * u, 5 * u, 7 * u); x.fillRect(w * 0.5 + 18 * u, gy - 24 * u, 5 * u, 7 * u);
    ground(gy, 10 * u, 9, ['#241640', '#150c2a']);
    uiDeadTree(x, w * 0.06, h * 0.98, 60 * u, '#0c0618'); uiDeadTree(x, w * 0.94, h * 0.96, 52 * u, '#0c0618'); uiTomb(x, w * 0.28, h * 0.95, 32 * u, 1); uiTomb(x, w * 0.4, h * 0.98, 26 * u, 0); uiPumpkin(x, w * 0.84, h * 0.97, 30 * u); uiPumpkin(x, w * 0.17, h * 0.99, 22 * u);
    var fg = x.createLinearGradient(0, h * 0.7, 0, h); fg.addColorStop(0, 'rgba(160,130,220,0)'); fg.addColorStop(1, 'rgba(160,130,220,0.28)'); x.fillStyle = fg; x.fillRect(0, h * 0.7, w, h * 0.3);
  } else if (ch === 3) {
    // 탐조등, 도시 실루엣, 활주로
    x.save(); x.globalCompositeOperation = 'lighter'; [[0.14, -0.5], [0.42, 0.35], [0.9, -0.3]].forEach(function (b) { var p = new Path2D(), bx = w * b[0]; p.moveTo(bx - 3 * u, gy); p.lineTo(bx + b[1] * h - 16 * u, 0); p.lineTo(bx + b[1] * h + 16 * u, 0); p.lineTo(bx + 3 * u, gy); p.closePath(); var g = x.createLinearGradient(0, gy, 0, 0); g.addColorStop(0, 'rgba(255,220,150,0.34)'); g.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = g; x.fill(p); }); x.restore();
    uiRift(x, w * 0.7, h * 0.4, h * 0.62, 16 * u, P.rift, 13, 0.95);
    x.fillStyle = '#132036'; for (i = 0; i < 16; i++) { var bw = (10 + rnd() * 14) * u, bh = (12 + rnd() * 30) * u, bx = i * w / 15 - 6 * u; x.fillRect(bx, gy - bh, bw, bh + 4); if (rnd() < 0.7) { x.fillStyle = 'rgba(255,190,80,0.8)'; for (var k = 0; k < 3; k++) x.fillRect(bx + 2 * u + rnd() * (bw - 5 * u), gy - bh + 3 * u + rnd() * (bh - 8 * u), 1.8 * u, 1.8 * u); x.fillStyle = '#132036'; } }
    ground(gy, 3 * u, 4, ['#2c3d58', '#182336']);
    x.fillStyle = '#ffb300'; for (i = 0; i < 12; i++) { x.save(); x.translate(i * w / 11, h - 5 * u); x.transform(1, 0, -0.8, 1, 0, 0); x.fillRect(0, 0, 9 * u, 5 * u); x.restore(); }
    x.fillStyle = '#0c1422'; x.fillRect(0, h - 5 * u, w, 0.8 * u);
    uiRadar(x, w * 0.1, h * 0.93, 46 * u); uiBunker(x, w * 0.33, h * 0.93, 44 * u); uiCrate(x, w * 0.52, h * 0.92, 30 * u, '#5f7a4a'); uiCrate(x, w * 0.9, h * 0.93, 34 * u, '#a8622a');
    // 전투기 편대
    x.fillStyle = '#0c1422'; [[0.3, 0.2, 9], [0.4, 0.28, 7], [0.22, 0.3, 7]].forEach(function (q) { var s = q[2] * u, px = w * q[0], py = h * q[1]; x.save(); x.translate(px, py); x.rotate(-0.25); x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = s * 0.2; x.beginPath(); x.moveTo(-s * 1.3, 0); x.lineTo(-s * 5, 0); x.stroke(); x.beginPath(); x.moveTo(s * 1.6, 0); x.lineTo(-s * 0.4, -s * 0.28); x.lineTo(-s * 0.9, -s * 1.1); x.lineTo(-s * 1.3, -s * 1.1); x.lineTo(-s * 1.0, -s * 0.2); x.lineTo(-s * 1.5, -s * 0.5); x.lineTo(-s * 1.5, s * 0.5); x.lineTo(-s * 1.0, s * 0.2); x.lineTo(-s * 1.3, s * 1.1); x.lineTo(-s * 0.9, s * 1.1); x.lineTo(-s * 0.4, s * 0.28); x.closePath(); x.fill(); x.restore(); });
  } else {
    // 한지 바탕, 먹 번짐 산, 붉은 해, 기와집과 소나무
    x.fillStyle = '#d8402e'; x.beginPath(); x.arc(w * 0.2, h * 0.28, 15 * u, 0, 6.3); x.fill(); glowAt(x, w * 0.2, h * 0.28, 40 * u, '#e8483a', 0.25);
    uiInkHill(x, w * 0.3, gy, 150 * u, 62 * u, '#5a6a7a', 0.55); uiInkHill(x, w * 0.62, gy, 170 * u, 78 * u, '#4a5a6a', 0.6); uiInkHill(x, w * 0.92, gy, 130 * u, 52 * u, '#5a6a7a', 0.5);
    uiRift(x, w * 0.72, h * 0.36, h * 0.58, 15 * u, P.rift, 14, 0.95);
    ground(gy, 8 * u, 7, ['#d9c79a', '#c8b480']);
    uiGiwa(x, w * 0.42, h * 0.9, 62 * u); uiInkPine(x, w * 0.1, h * 0.97, 58 * u); uiInkPine(x, w * 0.93, h * 0.95, 50 * u); uiJangProp(x, w * 0.24, h * 0.97, 44 * u); uiJangProp(x, w * 0.6, h * 0.98, 38 * u);
    for (i = 0; i < 120; i++) { x.fillStyle = 'rgba(120,96,60,' + (0.04 + rnd() * 0.07) + ')'; x.fillRect(rnd() * w, rnd() * h, (3 + rnd() * 8) * u, 0.6 * u); }
    uiDancheong(x, 0, h - 7 * u, w, 7 * u);
  }
  return c;
}

// ---------- 챕터 지도 그림: 땅, 소품, 노드를 잇는 길. pts = [[x, y], ...] 화면 좌표(기기 화소 아님, dpr를 곱해 씀) ----------
function uiChMap(c, ch, pts, dpr) {
  var W = c.width, H = c.height, x = cx2(c), P = uiChPal(ch), rnd = rngOf(100 + ch * 31), N = makeNoise(50 + ch), D = dpr, i, j;
  x.lineCap = 'round'; x.lineJoin = 'round';
  // 땅: 낮은 해상도 얼룩을 키워 부드럽게
  var gw = 60, gh = Math.max(60, Math.round(60 * H / W)), lc = mkC(gw, gh), lx = cx2(lc), id = lx.createImageData(gw, gh), d = id.data, A = hx(P.land[0]), B = hx(P.land[1]), C = hx(P.land[2]);
  for (j = 0; j < gh; j++) for (i = 0; i < gw; i++) { var v = N.fbm(i / 9, j / 9, 3), t = clamp((v - 0.3) * 2.6, 0, 1), o = (j * gw + i) * 4, E = t < 0.5 ? A : B, F = t < 0.5 ? B : C, k = t < 0.5 ? t * 2 : (t - 0.5) * 2; d[o] = E[0] + (F[0] - E[0]) * k; d[o + 1] = E[1] + (F[1] - E[1]) * k; d[o + 2] = E[2] + (F[2] - E[2]) * k; d[o + 3] = 255; }
  lx.putImageData(id, 0, 0); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(lc, 0, 0, W, H);
  var PT = pts.map(function (p) { return [p[0] * D, p[1] * D]; });
  function far(px, py, r) { for (var q = 0; q < PT.length; q++) if (Math.hypot(PT[q][0] - px, PT[q][1] - py) < r) return false; return true; }
  // 챕터 바탕 꾸밈
  if (ch === 2) {
    glowAt(x, W * 0.82, H * 0.1, W * 0.5, '#ffb45a', 0.32); var mg = x.createRadialGradient(W * 0.8, H * 0.085, 0, W * 0.82, H * 0.1, W * 0.1); mg.addColorStop(0, '#fff3d0'); mg.addColorStop(1, '#ffb45a'); x.fillStyle = mg; x.beginPath(); x.arc(W * 0.82, H * 0.1, W * 0.085, 0, 6.3); x.fill();
    x.fillStyle = 'rgba(255,170,90,0.35)'; x.beginPath(); x.arc(W * 0.79, H * 0.09, W * 0.02, 0, 6.3); x.arc(W * 0.85, H * 0.115, W * 0.014, 0, 6.3); x.fill();
  } else if (ch === 3) {
    x.strokeStyle = 'rgba(140,180,230,0.12)'; x.lineWidth = Math.max(1, D); var gs = 34 * D; for (i = 0; i * gs < W; i++) { x.beginPath(); x.moveTo(i * gs, 0); x.lineTo(i * gs, H); x.stroke(); } for (i = 0; i * gs < H; i++) { x.beginPath(); x.moveTo(0, i * gs); x.lineTo(W, i * gs); x.stroke(); }
    x.strokeStyle = 'rgba(140,180,230,0.16)'; for (i = 0; i < 5; i++) { var ex = rnd() * W, ey = rnd() * H; for (j = 1; j <= 3; j++) { x.beginPath(); x.ellipse(ex, ey, j * 26 * D, j * 18 * D, 0.4, 0, 6.3); x.stroke(); } }
  } else if (ch === 4) {
    for (i = 0; i < 400; i++) { x.fillStyle = 'rgba(120,96,60,' + (0.03 + rnd() * 0.06) + ')'; x.fillRect(rnd() * W, rnd() * H, (4 + rnd() * 14) * D, 0.8 * D); }
    for (i = 0; i < 5; i++) uiInkHill(x, W * (0.1 + rnd() * 0.8), H * (0.12 + i * 0.19), W * (0.5 + rnd() * 0.3), H * (0.07 + rnd() * 0.04), i % 2 ? '#4a5a6a' : '#6a7a86', 0.34);
  }
  // 길: 노드를 순서대로 부드럽게 잇기
  if (PT.length > 1) {
    var rp = new Path2D(); rp.moveTo(PT[0][0], PT[0][1]);
    for (i = 1; i < PT.length; i++) { var a = PT[i - 1], b = PT[i]; if (Math.abs(a[1] - b[1]) < 4 * D) rp.lineTo(b[0], b[1]); else { var mx = a[0] + (a[0] > W / 2 ? 46 : -46) * D; rp.bezierCurveTo(mx, a[1], mx, b[1], b[0], b[1]); } }
    if (ch === 3) { x.strokeStyle = 'rgba(8,14,26,0.7)'; x.lineWidth = 15 * D; x.stroke(rp); x.setLineDash([12 * D, 9 * D]); x.strokeStyle = P.road[0]; x.lineWidth = 4 * D; x.stroke(rp); x.setLineDash([]); }
    else if (ch === 4) { x.strokeStyle = 'rgba(74,64,56,0.16)'; x.lineWidth = 17 * D; x.stroke(rp); x.strokeStyle = 'rgba(58,48,42,0.82)'; x.lineWidth = 6 * D; x.stroke(rp); x.strokeStyle = 'rgba(247,239,220,0.5)'; x.lineWidth = 1.4 * D; x.setLineDash([3 * D, 13 * D]); x.stroke(rp); x.setLineDash([]); }
    else if (ch === 2) { x.strokeStyle = 'rgba(10,5,24,0.75)'; x.lineWidth = 17 * D; x.stroke(rp); x.strokeStyle = '#6f5c9c'; x.lineWidth = 11 * D; x.stroke(rp); x.setLineDash([2 * D, 12 * D]); x.strokeStyle = '#ffb45a'; x.lineWidth = 3.4 * D; x.stroke(rp); x.setLineDash([]); }
    else { x.strokeStyle = P.road[1]; x.lineWidth = 17 * D; x.stroke(rp); x.strokeStyle = P.road[0]; x.lineWidth = 12 * D; x.stroke(rp); x.setLineDash([1 * D, 13 * D]); x.strokeStyle = '#ffb3d4'; x.lineWidth = 4 * D; x.stroke(rp); x.setLineDash([]); }
  }
  // 소품: 노드와 길에서 떨어진 자리에, 위에서 아래 순서로
  var props = [], tries = 0, want = Math.round(W * H / (D * D) / (ch === 4 ? 7400 : 5200));
  while (props.length < want && tries++ < 600) { var px = rnd() * W, py = (0.06 + rnd() * 0.9) * H; if (!far(px, py - 14 * D, 52 * D)) continue; if (props.some(function (q) { return Math.hypot(q[0] - px, q[1] - py) < 34 * D; })) continue; props.push([px, py, rnd(), rnd()]); }
  props.sort(function (a, b) { return a[1] - b[1]; });
  props.forEach(function (q) {
    var S = (38 + q[3] * 16) * D, k = q[2];
    if (ch === 1) { if (k < 0.3) uiTree(x, q[0], q[1], S, ['#ff9cc8', '#8fe0b0', '#b79cf7'][Math.floor(q[3] * 3)], k < 0.12 ? '#fff' : null); else if (k < 0.5) uiBush(x, q[0], q[1], S * 0.9, '#7fd69a'); else if (k < 0.65) uiMush(x, q[0], q[1], S * 0.8, '#ff8fb8'); else if (k < 0.8) uiRock(x, q[0], q[1], S * 0.8, '#d9c8ef'); else for (var f = 0; f < 3; f++) uiFlower(x, q[0] + (f - 1) * 9 * D, q[1] - (f % 2) * 6 * D, 3.4 * D, ['#fff', '#ffd0e4', '#fff3a0'][f]); }
    else if (ch === 2) { if (k < 0.3) uiDeadTree(x, q[0], q[1], S * 1.2, '#0f0820'); else if (k < 0.62) uiTomb(x, q[0], q[1], S * 0.8, k < 0.45); else if (k < 0.82) uiPumpkin(x, q[0], q[1], S * 0.7); else { x.fillStyle = 'rgba(15,8,32,0.9)'; uiBat(x, q[0], q[1] - S * 0.4, S * 0.26); } }
    else if (ch === 3) { if (k < 0.25) uiBunker(x, q[0], q[1], S); else if (k < 0.45) uiRadar(x, q[0], q[1], S); else if (k < 0.8) uiCrate(x, q[0], q[1], S * 0.75, k < 0.62 ? '#5f7a4a' : '#a8622a'); else { x.strokeStyle = '#0c1422'; x.lineWidth = 5 * D; x.beginPath(); x.moveTo(q[0] - S * 0.16, q[1] - S * 0.22); x.lineTo(q[0] + S * 0.16, q[1]); x.moveTo(q[0] + S * 0.16, q[1] - S * 0.22); x.lineTo(q[0] - S * 0.16, q[1]); x.stroke(); x.strokeStyle = '#7f92ae'; x.lineWidth = 2 * D; x.stroke(); } }
    else { if (k < 0.4) uiInkPine(x, q[0], q[1], S * 1.1); else if (k < 0.6) uiGiwa(x, q[0], q[1], S * 1.1); else if (k < 0.8) uiJangProp(x, q[0], q[1], S * 0.9); else uiRock(x, q[0], q[1], S * 0.8, '#b8ae9c'); }
  });
  // 가장자리: 1장 구름, 2장 안개, 3장 경고 띠, 4장 단청 띠
  if (ch === 1) { uiCloud(x, W * 0.02, H * 0.3, 90 * D, 0.8); uiCloud(x, W * 0.98, H * 0.62, 100 * D, 0.8); }
  else if (ch === 2) { var vg = x.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75); vg.addColorStop(0, 'rgba(10,5,24,0)'); vg.addColorStop(1, 'rgba(10,5,24,0.6)'); x.fillStyle = vg; x.fillRect(0, 0, W, H); for (i = 0; i < 6; i++) { x.save(); x.translate(rnd() * W, rnd() * H); x.scale(3.2, 1); glowAt(x, 0, 0, 40 * D, '#b9a6dc', 0.13); x.restore(); } }
  else if (ch === 3) { var vg3 = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); vg3.addColorStop(0, 'rgba(6,10,20,0)'); vg3.addColorStop(1, 'rgba(6,10,20,0.55)'); x.fillStyle = vg3; x.fillRect(0, 0, W, H); }
}

// ---------- 작은 그림: 영역(땅, 하늘, 바다), 도전 깃발, 보너스 상자, 합체, 뒤로 ----------
var UI_IC2 = {};
function uiIc2(name, px) {
  px = px || 48; var key = name + px; if (UI_IC2[key]) return UI_IC2[key];
  var c = mkC(px, px), x = cx2(c), m = px / 2, s = px / 64, p;
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (name === 'ground') {
    p = new Path2D(); p.moveTo(m - 27 * s, m + 20 * s); p.lineTo(m - 9 * s, m - 14 * s); p.lineTo(m + 2 * s, m + 2 * s); p.lineTo(m + 11 * s, m - 8 * s); p.lineTo(m + 27 * s, m + 20 * s); p.closePath();
    uiCandy(x, p, m - 14 * s, m + 20 * s, ['#c9f0a0', '#7fce6a', '#4fa650'], '#24502c', 2.4 * s);
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(m - 9 * s, m - 14 * s); x.lineTo(m - 14 * s, m - 4 * s); x.lineTo(m - 9 * s, m - 7 * s); x.lineTo(m - 5 * s, m - 3 * s); x.lineTo(m - 3 * s, m - 5 * s); x.closePath(); x.fill();
  } else if (name === 'air') {
    p = new Path2D(); p.moveTo(m, m - 24 * s); p.quadraticCurveTo(m + 5 * s, m - 14 * s, m + 5 * s, m - 6 * s); p.lineTo(m + 27 * s, m + 8 * s); p.lineTo(m + 27 * s, m + 14 * s); p.lineTo(m + 5 * s, m + 8 * s); p.lineTo(m + 4 * s, m + 18 * s); p.lineTo(m + 12 * s, m + 24 * s); p.lineTo(m, m + 22 * s); p.lineTo(m - 12 * s, m + 24 * s); p.lineTo(m - 4 * s, m + 18 * s); p.lineTo(m - 5 * s, m + 8 * s); p.lineTo(m - 27 * s, m + 14 * s); p.lineTo(m - 27 * s, m + 8 * s); p.lineTo(m - 5 * s, m - 6 * s); p.quadraticCurveTo(m - 5 * s, m - 14 * s, m, m - 24 * s); p.closePath();
    x.save(); x.translate(m, m); x.rotate(0.6); x.translate(-m, -m); uiCandy(x, p, m - 24 * s, m + 24 * s, ['#f2fbff', '#a8dcff', '#5fa8e8'], '#1f4a80', 2.4 * s); x.restore();
  } else if (name === 'sea') {
    x.strokeStyle = '#17467a'; x.lineWidth = 9 * s; [m - 9 * s, m + 9 * s].forEach(function (y) { x.beginPath(); x.moveTo(m - 25 * s, y); x.bezierCurveTo(m - 16 * s, y - 13 * s, m - 8 * s, y + 13 * s, m, y); x.bezierCurveTo(m + 8 * s, y - 13 * s, m + 16 * s, y + 13 * s, m + 25 * s, y); x.stroke(); });
    x.strokeStyle = '#6fc4ff'; x.lineWidth = 4.6 * s; [m - 9 * s, m + 9 * s].forEach(function (y) { x.beginPath(); x.moveTo(m - 25 * s, y); x.bezierCurveTo(m - 16 * s, y - 13 * s, m - 8 * s, y + 13 * s, m, y); x.bezierCurveTo(m + 8 * s, y - 13 * s, m + 16 * s, y + 13 * s, m + 25 * s, y); x.stroke(); });
  } else if (name === 'rule') {
    x.strokeStyle = '#3a2410'; x.lineWidth = 6 * s; x.beginPath(); x.moveTo(m - 16 * s, m - 24 * s); x.lineTo(m - 16 * s, m + 26 * s); x.stroke(); x.strokeStyle = '#d9b070'; x.lineWidth = 3 * s; x.stroke();
    p = new Path2D(); p.moveTo(m - 14 * s, m - 22 * s); p.quadraticCurveTo(m + 2 * s, m - 28 * s, m + 24 * s, m - 18 * s); p.lineTo(m + 15 * s, m - 6 * s); p.lineTo(m + 24 * s, m + 6 * s); p.quadraticCurveTo(m + 2 * s, m - 2 * s, m - 14 * s, m + 6 * s); p.closePath();
    uiCandy(x, p, m - 26 * s, m + 6 * s, ['#ff9a7a', '#e8483a', '#b82a22'], '#4a1410', 2.2 * s);
    x.fillStyle = '#fff'; x.beginPath(); x.arc(m + 1 * s, m - 10 * s, 5 * s, 0, 6.3); x.fill(); x.fillStyle = '#4a1410'; x.beginPath(); x.arc(m - 1 * s, m - 11 * s, 1.3 * s, 0, 6.3); x.arc(m + 3 * s, m - 11 * s, 1.3 * s, 0, 6.3); x.fill();
  } else if (name === 'bonus') {
    uiCandy(x, uiRR(m - 22 * s, m - 6 * s, 44 * s, 30 * s, 6 * s), m - 6 * s, m + 24 * s, ['#fff3a0', '#ffd23a', '#f59f00'], '#8a4a00', 2.4 * s);
    uiCandy(x, uiRR(m - 25 * s, m - 14 * s, 50 * s, 12 * s, 5 * s), m - 14 * s, m - 2 * s, ['#fffbe0', '#ffe066'], '#8a4a00', 2.2 * s);
    x.fillStyle = '#e8483a'; x.fillRect(m - 4 * s, m - 14 * s, 8 * s, 38 * s);
    p = new Path2D(); p.moveTo(m, m - 14 * s); p.bezierCurveTo(m - 18 * s, m - 30 * s, m - 22 * s, m - 12 * s, m, m - 14 * s); p.bezierCurveTo(m + 18 * s, m - 30 * s, m + 22 * s, m - 12 * s, m, m - 14 * s); uiCandy(x, p, m - 28 * s, m - 12 * s, ['#ff9a7a', '#e8483a'], '#6a1410', 2 * s);
    uiSpark(x, m + 22 * s, m - 22 * s, 6 * s, '#fff');
  } else if (name === 'fuse') {
    [[-11, '#7fc4ff', '#2f6ab8'], [11, '#ffb86a', '#c85a10']].forEach(function (q) { uiCandy(x, uiCircle(m + q[0] * s, m, 15 * s), m - 15 * s, m + 15 * s, ['#ffffff', q[1]], q[2], 2.2 * s); });
    uiCandy(x, uiStarPath(m, m, 13 * s, 5 * s, 4), m - 13 * s, m + 13 * s, ['#ffffff', '#fff3a0', '#ffc21a'], '#8a4a00', 1.8 * s);
  } else if (name === 'back') {
    p = new Path2D(); p.moveTo(m - 20 * s, m); p.lineTo(m + 2 * s, m - 20 * s); p.lineTo(m + 2 * s, m - 8 * s); p.lineTo(m + 20 * s, m - 8 * s); p.lineTo(m + 20 * s, m + 8 * s); p.lineTo(m + 2 * s, m + 8 * s); p.lineTo(m + 2 * s, m + 20 * s); p.closePath();
    uiCandy(x, p, m - 20 * s, m + 20 * s, ['#ffffff', '#ffe9a8', '#ffc23a'], '#3a2410', 2.6 * s);
  } else if (name === 'water') {
    p = new Path2D(); p.moveTo(m, m - 26 * s); p.bezierCurveTo(m + 8 * s, m - 12 * s, m + 20 * s, m, m + 20 * s, m + 10 * s); p.bezierCurveTo(m + 20 * s, m + 22 * s, m + 10 * s, m + 27 * s, m, m + 27 * s); p.bezierCurveTo(m - 10 * s, m + 27 * s, m - 20 * s, m + 22 * s, m - 20 * s, m + 10 * s); p.bezierCurveTo(m - 20 * s, m, m - 8 * s, m - 12 * s, m, m - 26 * s); p.closePath();
    uiCandy(x, p, m - 26 * s, m + 27 * s, ['#e9fbff', '#7fd0ff', '#3f8fe0'], '#17467a', 2.4 * s); uiGloss(x, m - 8 * s, m + 2 * s, 3 * s, 6 * s, 0.4, 0.75);
  }
  return (UI_IC2[key] = c.toDataURL());
}

// ---------- 앱 아이콘: 균열 앞의 철옹성 (글자 없음) ----------
function uiAppIcon(px) {
  px = px || 512; var c = mkC(px, px), x = cx2(c), u = px / 512;
  var g = x.createLinearGradient(0, 0, 0, px); g.addColorStop(0, '#0a0c26'); g.addColorStop(0.5, '#2a2468'); g.addColorStop(0.8, '#7a3a72'); g.addColorStop(1, '#1a1330'); x.fillStyle = g; x.fillRect(0, 0, px, px);
  var rnd = rngOf(7); for (var i = 0; i < 40; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.3 + rnd() * 0.6) + ')'; x.beginPath(); x.arc(rnd() * px, rnd() * px * 0.5, (1 + rnd() * 2) * u, 0, 6.3); x.fill(); }
  glowAt(x, px / 2, px * 0.5, px * 0.6, '#ff9a6a', 0.35);
  uiRift(x, px * 0.5, px * 0.36, px * 0.66, 70 * u, ['#fff7e8', '#ffb347', '#b04fe0'], 77);
  uiRift(x, px * 0.14, px * 0.4, px * 0.34, 30 * u, UI_CH[1].rift, 78, 0.9); uiRift(x, px * 0.86, px * 0.4, px * 0.34, 30 * u, UI_CH[4].rift, 79, 0.9);
  x.save(); x.beginPath(); x.rect(0, 0, px, px); x.clip();
  uiFortress(x, px / 2, px * 0.9, u * 1.42, '#ff9ccf', '#ffb300');
  var gr = x.createLinearGradient(0, px * 0.9, 0, px); gr.addColorStop(0, '#1c1740'); gr.addColorStop(1, '#07061a'); x.fillStyle = gr; x.fillRect(0, px * 0.9, px, px * 0.1);
  x.strokeStyle = 'rgba(160,130,230,0.5)'; x.lineWidth = 3 * u; x.beginPath(); x.moveTo(0, px * 0.9); x.lineTo(px, px * 0.9); x.stroke();
  var lg = x.createLinearGradient(0, px * 0.9, 0, px); lg.addColorStop(0, 'rgba(255,225,150,0.6)'); lg.addColorStop(1, 'rgba(255,225,150,0)'); x.fillStyle = lg; x.beginPath(); x.moveTo(px * 0.5 - 34 * u, px * 0.9); x.lineTo(px * 0.5 + 34 * u, px * 0.9); x.lineTo(px * 0.5 + 110 * u, px); x.lineTo(px * 0.5 - 110 * u, px); x.closePath(); x.fill();
  x.restore();
  var vg = x.createRadialGradient(px / 2, px / 2, px * 0.35, px / 2, px / 2, px * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(4,4,16,0.55)'); x.fillStyle = vg; x.fillRect(0, 0, px, px);
  return c;
}

// ---------- 장별 기술 그림(v2.0.1): 화살비, 방책, 최후의 화살을 2장(공포), 3장(모던 군대), 4장(한국 전통) 분위기로. 1장은 ui_art.js icon() 그대로 ----------
var UI_SKIC = {};
function uiSkArrow(x, ax, ay, L, ang, shaft, head, line, lw, tail) {
  // 화살 한 대: (ax, ay)가 촉 끝, ang 방향으로 날아감. tail = [색, 길이] 꼬리 불꽃이나 깃
  x.save(); x.translate(ax, ay); x.rotate(ang);
  x.strokeStyle = line; x.lineWidth = lw * 2.4; x.beginPath(); x.moveTo(-L, 0); x.lineTo(-L * 0.28, 0); x.stroke();
  x.strokeStyle = shaft; x.lineWidth = lw; x.beginPath(); x.moveTo(-L, 0); x.lineTo(-L * 0.28, 0); x.stroke();
  var h = new Path2D(); h.moveTo(0, 0); h.lineTo(-L * 0.36, -L * 0.2); h.lineTo(-L * 0.26, 0); h.lineTo(-L * 0.36, L * 0.2); h.closePath();
  uiCandy(x, h, -L * 0.2, L * 0.2, head, line, lw * 0.55);
  if (tail) { var f = new Path2D(); f.moveTo(-L * 0.86, 0); f.lineTo(-L * 1.08, -L * 0.17); f.lineTo(-L * (1.08 + tail[1]), 0); f.lineTo(-L * 1.08, L * 0.17); f.closePath(); uiCandy(x, f, -L * 0.17, L * 0.17, tail[0], line, lw * 0.5); }
  x.restore();
}
function uiSkillIc(name, ch, px) {
  px = px || 64; var key = name + ch + '_' + px; if (UI_SKIC[key]) return UI_SKIC[key];
  var c = mkC(px, px), x = cx2(c), m = px / 2, s = px / 64, p, i;
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (ch === 2) {
    var L2 = '#1a1030', BONE = ['#fffaf0', '#e6dcc8'];
    if (name === 'rain') {
      // 먹구름 뒤 초승달, 뼈 화살 세 대
      p = new Path2D(); p.arc(m + 17 * s, m - 17 * s, 9 * s, 0, Math.PI * 2); uiCandy(x, p, m - 26 * s, m - 8 * s, ['#fff6c8', '#ffc94a'], L2, 1.8 * s);
      x.fillStyle = '#2c1a4e'; x.beginPath(); x.arc(m + 13 * s, m - 20 * s, 7.5 * s, 0, Math.PI * 2); x.fill();
      for (i = -1; i <= 1; i++) uiSkArrow(x, m + i * 13 * s + 1 * s, m + (i === 0 ? 27 : 23) * s, 25 * s, Math.PI / 2 - 0.08, '#efe6d2', ['#c8ffb0', '#58d06a'], L2, 3 * s);
      p = new Path2D(); uiCircle(m - 13 * s, m - 9 * s, 10 * s, p); uiCircle(m, m - 15 * s, 13 * s, p); uiCircle(m + 13 * s, m - 8 * s, 10 * s, p); uiRR(m - 23 * s, m - 11 * s, 46 * s, 13 * s, 6.5 * s, p);
      uiCandy(x, p, m - 28 * s, m + 2 * s, ['#c9b6ea', '#7d5fc0', '#4a3384'], L2, 2.3 * s);
      uiGloss(x, m - 5 * s, m - 21 * s, 6 * s, 2.6 * s, -0.3, 0.55);
    } else if (name === 'wall') {
      // 묘지 쇠 울타리, 가운데 호박 등
      p = new Path2D(); uiRR(m - 27 * s, m - 5 * s, 54 * s, 7 * s, 3 * s, p); uiRR(m - 27 * s, m + 11 * s, 54 * s, 7 * s, 3 * s, p);
      uiCandy(x, p, m - 5 * s, m + 18 * s, ['#a79cc4', '#5a5078'], L2, 2.2 * s);
      [-20, -7, 7, 20].forEach(function (o) {
        var q = new Path2D(); q.moveTo(m + o * s - 3.6 * s, m + 24 * s); q.lineTo(m + o * s - 3.6 * s, m - 13 * s); q.lineTo(m + o * s, m - 25 * s); q.lineTo(m + o * s + 3.6 * s, m - 13 * s); q.lineTo(m + o * s + 3.6 * s, m + 24 * s); q.closePath();
        uiCandy(x, q, m - 25 * s, m + 24 * s, ['#d2c8ea', '#7a6ea0', '#4a4068'], L2, 2 * s);
      });
      p = new Path2D(); p.ellipse(m, m + 7 * s, 11 * s, 9 * s, 0, 0, Math.PI * 2); uiCandy(x, p, m - 2 * s, m + 16 * s, ['#ffc46a', '#ff8a2a', '#d85a10'], L2, 1.8 * s);
      x.fillStyle = '#fff3a0'; [-1, 1].forEach(function (k) { x.beginPath(); x.moveTo(m + k * 4.5 * s, m + 3 * s); x.lineTo(m + k * 7.5 * s, m + 7.5 * s); x.lineTo(m + k * 1.8 * s, m + 7.5 * s); x.closePath(); x.fill(); });
      x.fillRect(m - 5 * s, m + 10.5 * s, 10 * s, 2.4 * s);
      x.strokeStyle = '#3f8f3a'; x.lineWidth = 2.6 * s; x.beginPath(); x.moveTo(m, m - 2 * s); x.lineTo(m + 2 * s, m - 6 * s); x.stroke();
    } else {
      // 도깨비불 화살: 초록 넋불을 끌고 날아가는 뼈 화살
      x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, m, m, 30 * s, '#7dff9a', 0.55); x.restore();
      x.save(); x.translate(m, m); x.rotate(-Math.PI / 4);
      [['#8a4fe0', -5], ['#7dff9a', 0], ['#ff8a2a', 5]].forEach(function (q) { var g2 = x.createLinearGradient(-31 * s, 0, -8 * s, 0); g2.addColorStop(0, rgba(q[0], 0)); g2.addColorStop(1, rgba(q[0], 0.95)); x.strokeStyle = g2; x.lineWidth = 4.2 * s; x.beginPath(); x.moveTo(-31 * s, q[1] * s); x.lineTo(-9 * s, q[1] * s); x.stroke(); });
      x.restore();
      uiSkArrow(x, m + 19 * s, m - 19 * s, 44 * s, -Math.PI / 4, '#efe6d2', ['#eaffd8', '#7dff9a', '#2fb85a'], L2, 4.4 * s);
      p = new Path2D(); p.arc(m - 14 * s, m + 14 * s, 5.5 * s, 0, Math.PI * 2); uiCandy(x, p, m + 8 * s, m + 20 * s, BONE, L2, 1.6 * s);
      uiSpark(x, m + 19 * s, m + 8 * s, 5 * s, '#c8ffb0'); uiSpark(x, m - 6 * s, m - 20 * s, 4 * s, '#ffffff');
    }
  } else if (ch === 3) {
    var L3 = '#101a2a', STEEL = ['#f2f6fb', '#b4c0d0', '#7a8799'];
    if (name === 'rain') {
      // 조준선 아래로 쏟아지는 강철 화살 세 대
      x.strokeStyle = L3; x.lineWidth = 6.4 * s; x.beginPath(); x.arc(m, m - 13 * s, 11.5 * s, 0, Math.PI * 2); x.moveTo(m - 19 * s, m - 13 * s); x.lineTo(m - 7 * s, m - 13 * s); x.moveTo(m + 7 * s, m - 13 * s); x.lineTo(m + 19 * s, m - 13 * s); x.moveTo(m, m - 29 * s); x.lineTo(m, m - 20 * s); x.stroke();
      x.strokeStyle = '#ffb300'; x.lineWidth = 3 * s; x.stroke();
      x.fillStyle = '#e8483a'; x.beginPath(); x.arc(m, m - 13 * s, 2.6 * s, 0, Math.PI * 2); x.fill();
      for (i = -1; i <= 1; i++) uiSkArrow(x, m + i * 14 * s + 1 * s, m + (i === 0 ? 28 : 23) * s, 25 * s, Math.PI / 2 - 0.08, '#d5dde8', ['#ffe08a', '#ffb300', '#e07a00'], L3, 3 * s, [['#7fa8e0', '#2f5a9a'], 0.02]);
    } else if (name === 'wall') {
      // 콘크리트 방호벽, 경고 줄무늬, 가시 철조망
      x.strokeStyle = L3; x.lineWidth = 4.6 * s; x.beginPath(); for (i = 0; i < 5; i++) { x.moveTo(m - 20 * s + i * 10.5 * s + 5 * s, m - 14 * s); x.arc(m - 20 * s + i * 10.5 * s, m - 14 * s, 5 * s, 0, Math.PI * 2); } x.stroke();
      x.strokeStyle = '#c9d2de'; x.lineWidth = 2 * s; x.stroke();
      p = new Path2D(); p.moveTo(m - 27 * s, m + 23 * s); p.lineTo(m - 23 * s, m + 8 * s); p.lineTo(m - 16 * s, m + 2 * s); p.lineTo(m - 14 * s, m - 9 * s); p.lineTo(m + 14 * s, m - 9 * s); p.lineTo(m + 16 * s, m + 2 * s); p.lineTo(m + 23 * s, m + 8 * s); p.lineTo(m + 27 * s, m + 23 * s); p.closePath();
      uiCandy(x, p, m - 9 * s, m + 23 * s, ['#f4f7fb', '#bcc6d4', '#8996a8'], L3, 2.4 * s);
      x.save(); x.clip(uiRR(m - 22 * s, m + 9 * s, 44 * s, 9 * s, 2 * s)); x.fillStyle = '#ffc21a'; x.fillRect(m - 24 * s, m + 8 * s, 48 * s, 11 * s); x.fillStyle = '#1c2636';
      for (i = -3; i < 6; i++) { x.beginPath(); x.moveTo(m - 24 * s + i * 11 * s, m + 19 * s); x.lineTo(m - 18 * s + i * 11 * s, m + 8 * s); x.lineTo(m - 12.5 * s + i * 11 * s, m + 8 * s); x.lineTo(m - 18.5 * s + i * 11 * s, m + 19 * s); x.closePath(); x.fill(); }
      x.restore(); x.strokeStyle = L3; x.lineWidth = 1.6 * s; x.stroke(uiRR(m - 22 * s, m + 9 * s, 44 * s, 9 * s, 2 * s));
      uiGloss(x, m - 9 * s, m - 4 * s, 2 * s, 4 * s, 0.1, 0.6);
    } else {
      // 예광 꼬리를 끄는 강철 화살
      x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, m, m, 28 * s, '#ffb300', 0.5); x.restore();
      x.save(); x.translate(m, m); x.rotate(-Math.PI / 4);
      [['#3f86e0', -5], ['#ffffff', 0], ['#ffb300', 5]].forEach(function (q) { var g2 = x.createLinearGradient(-31 * s, 0, -8 * s, 0); g2.addColorStop(0, rgba(q[0], 0)); g2.addColorStop(1, rgba(q[0], 0.95)); x.strokeStyle = g2; x.lineWidth = 4.2 * s; x.beginPath(); x.moveTo(-31 * s, q[1] * s); x.lineTo(-9 * s, q[1] * s); x.stroke(); });
      x.restore();
      uiSkArrow(x, m + 20 * s, m - 20 * s, 44 * s, -Math.PI / 4, '#d5dde8', ['#ff9a8a', '#e8483a', '#b82a22'], L3, 4.6 * s, [['#7fa8e0', '#2f5a9a'], 0.02]);
      x.save(); x.translate(m, m); x.rotate(-Math.PI / 4); x.fillStyle = '#ffb300'; x.fillRect(2 * s, -2.4 * s, 3.2 * s, 4.8 * s); x.fillStyle = L3; x.fillRect(-7 * s, -2.4 * s, 1.5 * s, 4.8 * s); x.restore();
      uiSpark(x, m + 19 * s, m + 8 * s, 5 * s, '#ffffff'); uiSpark(x, m - 7 * s, m - 21 * s, 4 * s, '#ffe08a');
    }
  } else {
    var L4 = '#2a1c14', BAM = '#d9b56a', IRON = ['#9aa2ac', '#4a525e'], RED = ['#ff9a7a', '#e8483a', '#b82a22'];
    if (name === 'rain') {
      // 신기전: 불꼬리를 단 화살 세 대
      for (i = -1; i <= 1; i++) {
        var ax = m + i * 14 * s - 5 * s, ay = m + (i === 0 ? 26 : 21) * s;
        x.save(); x.translate(ax, ay); x.rotate(Math.PI / 2 - 0.3);
        p = new Path2D(); p.moveTo(-23 * s, -3.2 * s); p.quadraticCurveTo(-37 * s, 0, -47 * s, -1 * s); p.quadraticCurveTo(-37 * s, 2 * s, -23 * s, 3.2 * s); p.closePath(); uiCandy(x, p, -3.2 * s, 3.2 * s, ['#fff3a0', '#ff9a1a', '#e8483a'], null, 0);
        x.restore();
        uiSkArrow(x, ax, ay, 27 * s, Math.PI / 2 - 0.3, BAM, IRON, L4, 3 * s);
        x.save(); x.translate(ax, ay); x.rotate(Math.PI / 2 - 0.3); uiCandy(x, uiRR(-22 * s, -3.4 * s, 10 * s, 6.8 * s, 1.5 * s), -3.4 * s, 3.4 * s, RED, L4, 1.5 * s); x.restore();
      }
    } else if (name === 'wall') {
      // 목책: 끝을 깎은 통나무, 새끼줄, 가운데 부적
      [-21, -7, 7, 21].forEach(function (o, n) {
        var q = new Path2D(), top = m - (n % 2 ? 19 : 23) * s; q.moveTo(m + o * s - 6.2 * s, m + 24 * s); q.lineTo(m + o * s - 6.2 * s, top + 9 * s); q.lineTo(m + o * s, top); q.lineTo(m + o * s + 6.2 * s, top + 9 * s); q.lineTo(m + o * s + 6.2 * s, m + 24 * s); q.closePath();
        uiCandy(x, q, top, m + 24 * s, ['#f0d6a0', '#c08f55', '#8f6234'], L4, 2.2 * s);
        x.strokeStyle = rgba('#5a3a1c', 0.55); x.lineWidth = 1.3 * s; x.beginPath(); x.moveTo(m + o * s - 1.5 * s, top + 13 * s); x.lineTo(m + o * s - 1.5 * s, m + 2 * s); x.moveTo(m + o * s + 2 * s, m + 6 * s); x.lineTo(m + o * s + 2 * s, m + 20 * s); x.stroke();
      });
      [m - 6 * s, m + 13 * s].forEach(function (y) { x.strokeStyle = L4; x.lineWidth = 6.2 * s; x.beginPath(); x.moveTo(m - 27 * s, y); x.lineTo(m + 27 * s, y); x.stroke(); x.strokeStyle = '#e8d8a8'; x.lineWidth = 3 * s; x.setLineDash([3.2 * s, 2.6 * s]); x.stroke(); x.setLineDash([]); });
      uiCandy(x, uiRR(m - 6.5 * s, m - 12 * s, 13 * s, 24 * s, 1.6 * s), m - 12 * s, m + 12 * s, ['#fff3b8', '#ffd84a'], L4, 1.7 * s);
      x.strokeStyle = '#c8281e'; x.lineWidth = 2.1 * s; x.beginPath(); x.moveTo(m - 3 * s, m - 7 * s); x.lineTo(m + 3 * s, m - 7 * s); x.moveTo(m, m - 9 * s); x.lineTo(m, m + 8 * s); x.moveTo(m - 3.4 * s, m - 1.5 * s); x.lineTo(m + 3.4 * s, m - 1.5 * s); x.moveTo(m - 3 * s, m + 4 * s); x.lineTo(m + 3 * s, m + 4 * s); x.stroke();
    } else {
      // 오방색 띠를 끌고 날아가는 각궁 화살
      x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, m, m, 29 * s, '#ffd27a', 0.5); x.restore();
      x.save(); x.translate(m, m); x.rotate(-Math.PI / 4);
      [['#2f6fd0', -6.5], ['#e8483a', -2.2], ['#ffc21a', 2.2], ['#1fa392', 6.5]].forEach(function (q, n) { x.strokeStyle = L4; x.lineWidth = 5.4 * s; x.beginPath(); x.moveTo(-8 * s, 0); x.quadraticCurveTo(-20 * s, q[1] * 1.9 * s, -31 * s, q[1] * s + (n % 2 ? 2 : -2) * s); x.stroke(); x.strokeStyle = q[0]; x.lineWidth = 3 * s; x.stroke(); });
      x.restore();
      uiSkArrow(x, m + 20 * s, m - 20 * s, 44 * s, -Math.PI / 4, BAM, IRON, L4, 4.4 * s, [RED, 0.02]);
      uiSpark(x, m + 20 * s, m + 6 * s, 5 * s, '#ffffff'); uiSpark(x, m - 8 * s, m - 21 * s, 4 * s, '#fff3a0');
    }
  }
  return (UI_SKIC[key] = c.toDataURL());
}
// 지금 판의 장에 맞는 기술 그림으로 단추를 바꾼다(전투 시작 때 hudSkills가 부름)
function uiSkillArt(ch) {
  ['rain', 'wall', 'last'].forEach(function (k) {
    var b = document.getElementById('sk_' + k), im = b && b.querySelector('img'); if (!im) return;
    var src = ch >= 2 && ch <= 4 ? uiSkillIc(k, ch, 64) : icon(k, 64); if (im.getAttribute('src') !== src) im.src = src;
  });
}
