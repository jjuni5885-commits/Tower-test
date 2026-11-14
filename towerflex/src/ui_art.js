// ===== ui_art.js : 아이콘, 타이틀 그림, 세계 지도 그림 (귀염판: 사탕 질감, 밝은 파스텔) =====
// 사탕 칠: 테두리를 두껍게 먼저 긋고 위가 밝은 그라데이션을 덮어 칠함 (겹친 모양도 바깥 테두리만 남음)
function uiCandy(x, p, y0, y1, cols, line, lw) {
  if (line) { x.strokeStyle = line; x.lineWidth = lw * 2; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(p); }
  var g = x.createLinearGradient(0, y0, 0, y1);
  for (var i = 0; i < cols.length; i++) g.addColorStop(i / Math.max(1, cols.length - 1), cols[i]);
  x.fillStyle = g; x.fill(p);
}
// 왼쪽 위 윤기
function uiGloss(x, cx, cy, rx, ry, rot, a) { x.save(); x.globalAlpha = a == null ? 0.7 : a; x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2); x.fill(); x.restore(); }
// 네 갈래 반짝이
function uiSpark(x, cx, cy, r, col, a) {
  var k = r * 0.18; x.save(); x.globalAlpha = a == null ? 1 : a; x.fillStyle = col || '#fff'; x.beginPath();
  x.moveTo(cx, cy - r); x.quadraticCurveTo(cx + k, cy - k, cx + r, cy); x.quadraticCurveTo(cx + k, cy + k, cx, cy + r); x.quadraticCurveTo(cx - k, cy + k, cx - r, cy); x.quadraticCurveTo(cx - k, cy - k, cx, cy - r); x.fill(); x.restore();
}
function uiStarPath(cx, cy, R, r, n) { var p = new Path2D(); for (var i = 0; i < n * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; if (!i) p.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else p.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } p.closePath(); return p; }
// 하트 (폭 w, 가운데 cx, cy)
function uiHeartPath(cx, cy, w) { var p = new Path2D(), k = w / 32; for (var i = 0; i <= 72; i++) { var t = i / 72 * Math.PI * 2, sx = 16 * Math.pow(Math.sin(t), 3), sy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t), X = cx + sx * k, Y = cy - (sy + 2.5) * k; if (!i) p.moveTo(X, Y); else p.lineTo(X, Y); } p.closePath(); return p; }
function uiRR(x0, y0, w, h, r, p) { p = p || new Path2D(); r = Math.min(r, w / 2, h / 2); p.moveTo(x0 + r, y0); p.arcTo(x0 + w, y0, x0 + w, y0 + h, r); p.arcTo(x0 + w, y0 + h, x0, y0 + h, r); p.arcTo(x0, y0 + h, x0, y0, r); p.arcTo(x0, y0, x0 + w, y0, r); p.closePath(); return p; }
function uiCircle(cx, cy, r, p) { p = p || new Path2D(); p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, Math.PI * 2); return p; }

var ICONS = {};
function icon(name, px) {
  px = px || 64; var key = name + px; if (ICONS[key]) return ICONS[key];
  var c = mkC(px, px), x = cx2(c), m = px / 2, s = px / 64;
  x.lineCap = 'round'; x.lineJoin = 'round';
  var GOLD = ['#fff3a0', '#ffd23a', '#ffaa00'], GOLDL = '#de8500', OFF = ['#fbf8ff', '#ebe2fb'], OFFL = '#cdbcec';
  if (name === 'coin') {
    var cp = uiCircle(m, m, 25 * s);
    uiCandy(x, cp, m - 25 * s, m + 25 * s, ['#ffe98a', '#ffc425', '#f59f00'], '#d97f00', 2.4 * s);
    x.strokeStyle = 'rgba(255,250,215,0.9)'; x.lineWidth = 2.4 * s; x.beginPath(); x.arc(m, m, 18.5 * s, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(214,128,0,0.5)'; x.lineWidth = 2 * s; x.beginPath(); x.arc(m, m + 1.2 * s, 16.5 * s, 0.12 * Math.PI, 0.88 * Math.PI); x.stroke();
    var sp = uiStarPath(m, m + 1.5 * s, 11 * s, 5 * s, 5);
    x.save(); x.translate(0, 1.6 * s); x.fillStyle = 'rgba(200,110,0,0.45)'; x.strokeStyle = 'rgba(200,110,0,0.45)'; x.lineWidth = 2.4 * s; x.stroke(sp); x.fill(sp); x.restore();
    x.fillStyle = '#fff4bf'; x.strokeStyle = '#fff4bf'; x.lineWidth = 2.4 * s; x.stroke(sp); x.fill(sp);
    uiGloss(x, m - 10 * s, m - 12 * s, 7 * s, 3.8 * s, -0.65, 0.8);
  } else if (name === 'life') {
    var hp = uiHeartPath(m, m + 1 * s, 54 * s);
    uiCandy(x, hp, m - 22 * s, m + 26 * s, ['#ffc6dc', '#ff80ad', '#f04e86'], '#d23a72', 2.5 * s);
    uiGloss(x, m - 12 * s, m - 8 * s, 7.5 * s, 4.5 * s, -0.75, 0.8); uiGloss(x, m - 4 * s, m - 14.5 * s, 2.2 * s, 2.2 * s, 0, 0.75);
  } else if (name === 'pause') {
    [-1, 1].forEach(function (k) { uiCandy(x, uiRR(m + k * 8 * s - 5.5 * s, m - 15 * s, 11 * s, 30 * s, 5.5 * s), m - 15 * s, m + 15 * s, ['#8f6fae', '#5b3a76']); });
  } else if (name === 'play') {
    var tp = new Path2D(); tp.moveTo(m - 9 * s, m - 15 * s); tp.lineTo(m + 16 * s, m); tp.lineTo(m - 9 * s, m + 15 * s); tp.closePath();
    x.save(); x.translate(0, 3 * s); x.lineWidth = 9 * s; x.strokeStyle = x.fillStyle = 'rgba(190,50,110,0.42)'; x.stroke(tp); x.fill(tp); x.restore();
    x.lineWidth = 9 * s; x.strokeStyle = x.fillStyle = '#ffffff'; x.stroke(tp); x.fill(tp);
  } else if (name === 'speed') {
    [-1, 1].forEach(function (k) { var q = new Path2D(), o = k * 9 * s; q.moveTo(m + o - 9 * s, m - 12 * s); q.lineTo(m + o + 7 * s, m); q.lineTo(m + o - 9 * s, m + 12 * s); q.closePath(); x.lineWidth = 5 * s; x.strokeStyle = '#6b4a88'; x.fillStyle = '#6b4a88'; x.stroke(q); x.fill(q); });
  } else if (name === 'star' || name === 'starOff') {
    var st = uiStarPath(m, m + 2.5 * s, 27 * s, 13 * s, 5);
    if (name === 'star') {
      uiCandy(x, st, m - 24 * s, m + 26 * s, GOLD, GOLDL, 2.6 * s);
      x.save(); x.globalAlpha = 0.4; x.fillStyle = '#fffbe0'; x.fill(uiStarPath(m - 1 * s, m + 1 * s, 15 * s, 7 * s, 5)); x.restore();
      uiGloss(x, m - 9 * s, m - 6 * s, 5 * s, 3 * s, -0.6, 0.85); uiGloss(x, m - 2 * s, m - 14 * s, 2.4 * s, 2.4 * s, 0, 0.7);
    } else uiCandy(x, st, m - 24 * s, m + 26 * s, OFF, OFFL, 2.4 * s);
  } else if (name === 'crown' || name === 'crownOff') {
    var on = name === 'crown', cr = new Path2D();
    cr.moveTo(m - 21 * s, m + 15 * s); cr.lineTo(m - 24 * s, m - 9 * s); cr.lineTo(m - 11 * s, m + 2 * s); cr.lineTo(m, m - 16 * s); cr.lineTo(m + 11 * s, m + 2 * s); cr.lineTo(m + 24 * s, m - 9 * s); cr.lineTo(m + 21 * s, m + 15 * s); cr.closePath();
    var balls = new Path2D(); uiCircle(m - 24 * s, m - 11 * s, 4 * s, balls); uiCircle(m, m - 18 * s, 4.5 * s, balls); uiCircle(m + 24 * s, m - 11 * s, 4 * s, balls);
    uiCandy(x, balls, m - 22 * s, m - 7 * s, on ? ['#ffd6e8', '#ff8fbf'] : OFF, on ? '#d94f8a' : OFFL, 2.2 * s);
    uiCandy(x, cr, m - 16 * s, m + 15 * s, on ? GOLD : OFF, on ? GOLDL : OFFL, 2.4 * s);
    if (on) { x.fillStyle = 'rgba(255,250,220,0.75)'; x.fill(uiRR(m - 19 * s, m + 6 * s, 38 * s, 4 * s, 2 * s)); uiCandy(x, uiHeartPath(m, m + 1 * s, 12 * s), m - 4 * s, m + 6 * s, ['#ffb3d4', '#ff5c9c'], '#d23a72', 1.2 * s); uiGloss(x, m - 13 * s, m - 2 * s, 3 * s, 2 * s, -0.5, 0.7); }
  } else if (name === 'flag' || name === 'flagOff') {
    var fo = name === 'flag';
    x.strokeStyle = fo ? '#b07fa0' : OFFL; x.lineWidth = 4.5 * s; x.beginPath(); x.moveTo(m - 15 * s, m + 25 * s); x.lineTo(m - 15 * s, m - 22 * s); x.stroke();
    var fl = new Path2D(); fl.moveTo(m - 13 * s, m - 21 * s); fl.bezierCurveTo(m - 2 * s, m - 27 * s, m + 8 * s, m - 14 * s, m + 22 * s, m - 19 * s); fl.lineTo(m + 20 * s, m + 1 * s); fl.bezierCurveTo(m + 8 * s, m + 6 * s, m - 2 * s, m - 6 * s, m - 13 * s, m); fl.closePath();
    uiCandy(x, fl, m - 24 * s, m + 4 * s, fo ? ['#ffc2dc', '#ff86b8', '#ff5c9c'] : OFF, fo ? '#d23a72' : OFFL, 2.3 * s);
    if (fo) { uiCandy(x, uiHeartPath(m + 4 * s, m - 9 * s, 13 * s), m - 15 * s, m - 3 * s, ['#ffffff', '#ffe8f2']); }
    uiCandy(x, uiCircle(m - 15 * s, m - 24 * s, 4 * s), m - 28 * s, m - 20 * s, fo ? ['#fff3a0', '#ffc21a'] : OFF, fo ? GOLDL : OFFL, 1.8 * s);
  } else if (name === 'lock') {
    x.strokeStyle = '#8d72d0'; x.lineWidth = 7 * s; x.beginPath(); x.arc(m, m - 6 * s, 10 * s, Math.PI, 0); x.lineTo(m + 10 * s, m); x.moveTo(m - 10 * s, m); x.lineTo(m - 10 * s, m - 6 * s); x.stroke();
    x.strokeStyle = '#d9cbfa'; x.lineWidth = 2.6 * s; x.beginPath(); x.arc(m, m - 6 * s, 10 * s, Math.PI * 1.1, Math.PI * 1.45); x.stroke();
    uiCandy(x, uiRR(m - 17 * s, m - 4 * s, 34 * s, 27 * s, 8 * s), m - 4 * s, m + 23 * s, ['#efe7ff', '#c6b0f7', '#a487ec'], '#7356c4', 2.4 * s);
    x.fillStyle = '#5a3a86'; x.beginPath(); x.arc(m, m + 7 * s, 4 * s, 0, Math.PI * 2); x.fill(); x.fill(uiRR(m - 2 * s, m + 8 * s, 4 * s, 8 * s, 2 * s));
    uiGloss(x, m - 9 * s, m + 1 * s, 4.5 * s, 2.5 * s, -0.3, 0.75);
  } else if (name === 'gear') {
    var gp = new Path2D();
    for (var i = 0; i < 8; i++) { var b = i * Math.PI / 4, t = Math.PI / 19, f = Math.PI / 40, pts = [[b - t, 25], [b + t, 25], [b + t + f, 18.5], [b + Math.PI / 4 - t - f, 18.5]]; for (var j = 0; j < 4; j++) { var X = m + Math.cos(pts[j][0]) * pts[j][1] * s, Y = m + Math.sin(pts[j][0]) * pts[j][1] * s; if (!i && !j) gp.moveTo(X, Y); else gp.lineTo(X, Y); } }
    gp.closePath();
    uiCandy(x, gp, m - 25 * s, m + 25 * s, ['#d2f7ea', '#86e2c6', '#4fcaa6'], '#2b9f7e', 2.4 * s);
    x.fillStyle = '#ffffff'; x.strokeStyle = '#2b9f7e'; x.lineWidth = 2.6 * s; x.beginPath(); x.arc(m, m, 8 * s, 0, Math.PI * 2); x.fill(); x.stroke();
    uiGloss(x, m - 10 * s, m - 12 * s, 5 * s, 3 * s, -0.7, 0.8);
  } else if (name === 'book') {
    uiCandy(x, uiRR(m - 16 * s, m - 20 * s, 37 * s, 44 * s, 6 * s), m - 20 * s, m + 24 * s, ['#ffffff', '#fff3e6'], '#d94f8a', 2.2 * s);
    x.strokeStyle = 'rgba(217,79,138,0.35)'; x.lineWidth = 1.6 * s; x.beginPath(); x.moveTo(m + 19 * s, m - 14 * s); x.lineTo(m + 19 * s, m + 19 * s); x.stroke();
    var cv = uiRR(m - 21 * s, m - 24 * s, 36 * s, 44 * s, 7 * s);
    uiCandy(x, cv, m - 24 * s, m + 20 * s, ['#ffc6dc', '#ff8fbf', '#ff6aa5'], '#d23a72', 2.4 * s);
    x.fillStyle = 'rgba(210,58,114,0.35)'; x.fill(uiRR(m - 21 * s, m - 24 * s, 7 * s, 44 * s, 3.5 * s));
    uiCandy(x, uiHeartPath(m + 1 * s, m - 3 * s, 18 * s), m - 11 * s, m + 6 * s, ['#ffffff', '#ffeaf3']);
    var rb = new Path2D(); rb.moveTo(m + 5 * s, m - 25 * s); rb.lineTo(m + 11 * s, m - 25 * s); rb.lineTo(m + 11 * s, m - 13 * s); rb.lineTo(m + 8 * s, m - 16 * s); rb.lineTo(m + 5 * s, m - 13 * s); rb.closePath();
    uiCandy(x, rb, m - 25 * s, m - 13 * s, ['#fff3a0', '#ffc21a'], GOLDL, 1.4 * s);
    uiGloss(x, m - 11 * s, m - 17 * s, 5 * s, 2.6 * s, -0.5, 0.7);
  } else if (name === 'hammer') {
    x.save(); x.translate(m + 1 * s, m + 2 * s); x.rotate(-0.68);
    uiCandy(x, uiRR(-4.5 * s, -8 * s, 9 * s, 34 * s, 4.5 * s), -8 * s, 26 * s, ['#ffe6c4', '#f6b578', '#e59a5c'], '#bf7642', 2.2 * s);
    uiCandy(x, uiRR(-19 * s, -23 * s, 38 * s, 17 * s, 7 * s), -23 * s, -6 * s, ['#e2f5ff', '#9cd8ff', '#62b6f5'], '#3a8fd6', 2.4 * s);
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.fill(uiRR(-13 * s, -21 * s, 4 * s, 13 * s, 2 * s)); x.fill(uiRR(9 * s, -21 * s, 4 * s, 13 * s, 2 * s));
    uiGloss(x, -4 * s, -18.5 * s, 6 * s, 2.2 * s, 0, 0.75);
    x.restore();
  } else if (name === 'rain') {
    for (var k = -1; k <= 1; k++) {
      var ax = m + k * 13 * s, ay = m + (k === 0 ? 4 : 0) * s;
      x.strokeStyle = '#c08458'; x.lineWidth = 3.4 * s; x.beginPath(); x.moveTo(ax - 2 * s, ay - 10 * s); x.lineTo(ax + 1 * s, ay + 13 * s); x.stroke();
      var ah = new Path2D(); ah.moveTo(ax + 2.2 * s, ay + 25 * s); ah.lineTo(ax - 5 * s, ay + 13 * s); ah.lineTo(ax + 7 * s, ay + 12 * s); ah.closePath();
      uiCandy(x, ah, ay + 11 * s, ay + 25 * s, ['#f2fbff', '#9fd8ff'], '#3a8fd6', 1.8 * s);
    }
    var cl = new Path2D(); uiCircle(m - 12 * s, m - 10 * s, 10 * s, cl); uiCircle(m + 1 * s, m - 16 * s, 13 * s, cl); uiCircle(m + 13 * s, m - 9 * s, 10 * s, cl); uiRR(m - 22 * s, m - 12 * s, 45 * s, 13 * s, 6.5 * s, cl);
    uiCandy(x, cl, m - 29 * s, m + 1 * s, ['#ffffff', '#f4f8ff', '#d6e6ff'], '#6fa8e8', 2.3 * s);
    uiGloss(x, m - 4 * s, m - 22 * s, 6 * s, 3 * s, -0.3, 0.9);
  } else if (name === 'wall') {
    var rails = new Path2D(); uiRR(m - 26 * s, m - 7 * s, 52 * s, 9 * s, 4.5 * s, rails); uiRR(m - 26 * s, m + 8 * s, 52 * s, 9 * s, 4.5 * s, rails);
    uiCandy(x, rails, m - 7 * s, m + 17 * s, ['#ffdcae', '#f1aa66'], '#b46e3a', 2.2 * s);
    [-16, 0, 16].forEach(function (o) {
      var po = new Path2D(); po.moveTo(m + o * s - 5.5 * s, m + 22 * s); po.lineTo(m + o * s - 5.5 * s, m - 16 * s); po.quadraticCurveTo(m + o * s, m - 25 * s, m + o * s + 5.5 * s, m - 16 * s); po.lineTo(m + o * s + 5.5 * s, m + 22 * s); po.closePath();
      uiCandy(x, po, m - 22 * s, m + 22 * s, ['#fff0d8', '#ffcb8f', '#f2a860'], '#b46e3a', 2.2 * s);
      uiGloss(x, m + o * s - 2 * s, m - 12 * s, 1.6 * s, 4 * s, 0, 0.7);
    });
    uiCandy(x, uiHeartPath(m, m - 1 * s, 13 * s), m - 7 * s, m + 6 * s, ['#ffb3d4', '#ff5c9c'], '#d23a72', 1.3 * s);
  } else if (name === 'last') {
    x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, m, m, 30 * s, '#ffe08a', 0.6); x.restore();
    x.save(); x.translate(m, m); x.rotate(-Math.PI / 4);
    [['#ff8fbf', -4.5], ['#ffd84d', 0], ['#7ccfff', 4.5]].forEach(function (q) { var g2 = x.createLinearGradient(-31 * s, 0, -8 * s, 0); g2.addColorStop(0, rgba(q[0], 0)); g2.addColorStop(1, rgba(q[0], 0.95)); x.strokeStyle = g2; x.lineWidth = 4.2 * s; x.beginPath(); x.moveTo(-31 * s, q[1] * s); x.lineTo(-8 * s, q[1] * s * 0.5); x.stroke(); });
    var fe = new Path2D(); fe.moveTo(-12 * s, 0); fe.lineTo(-21 * s, -9 * s); fe.lineTo(-16 * s, 0); fe.lineTo(-21 * s, 9 * s); fe.closePath();
    uiCandy(x, fe, -9 * s, 9 * s, ['#ffd6e8', '#ff86b8'], '#d23a72', 1.8 * s);
    uiCandy(x, uiRR(-17 * s, -2.6 * s, 32 * s, 5.2 * s, 2.6 * s), -3 * s, 3 * s, ['#fffbe8', '#ffd35a'], GOLDL, 1.6 * s);
    var hd = new Path2D(); hd.moveTo(27 * s, 0); hd.lineTo(11 * s, -10 * s); hd.lineTo(14 * s, 0); hd.lineTo(11 * s, 10 * s); hd.closePath();
    uiCandy(x, hd, -10 * s, 10 * s, GOLD, GOLDL, 2 * s);
    uiGloss(x, 16 * s, -3.5 * s, 4 * s, 1.6 * s, 0.5, 0.8);
    x.restore();
    uiSpark(x, m + 17 * s, m - 20 * s, 6.5 * s, '#ffffff'); uiSpark(x, m - 18 * s, m + 13 * s, 4.5 * s, '#fff3a0'); uiSpark(x, m + 21 * s, m + 6 * s, 3.5 * s, '#ffd6e8');
  } else if (name === 'skull') {
    // 웨이브 표시: 뿔 달린 보라 몬스터 얼굴
    [-1, 1].forEach(function (k) { var hr = new Path2D(); hr.moveTo(m + k * 8 * s, m - 14 * s); hr.quadraticCurveTo(m + k * 14 * s, m - 29 * s, m + k * 20 * s, m - 26 * s); hr.quadraticCurveTo(m + k * 20 * s, m - 17 * s, m + k * 16 * s, m - 11 * s); hr.closePath(); uiCandy(x, hr, m - 27 * s, m - 11 * s, ['#ffe8f2', '#ffa3cb'], '#c9578b', 2 * s); });
    var bd = new Path2D(); bd.ellipse(m, m + 4 * s, 23 * s, 20 * s, 0, 0, Math.PI * 2);
    uiCandy(x, bd, m - 16 * s, m + 24 * s, ['#ebe2ff', '#b99ef8', '#9273e8'], '#6648c0', 2.5 * s);
    [-1, 1].forEach(function (k) {
      x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(m + k * 8.5 * s, m + 2 * s, 6.5 * s, 7.5 * s, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#3a1f4a'; x.beginPath(); x.ellipse(m + k * 8.5 * s + 1 * s, m + 3.5 * s, 4.2 * s, 5.2 * s, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(m + k * 8.5 * s + 2.4 * s, m + 1.2 * s, 1.7 * s, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,130,185,0.6)'; x.beginPath(); x.ellipse(m + k * 15.5 * s, m + 11 * s, 3.6 * s, 2.3 * s, 0, 0, Math.PI * 2); x.fill();
    });
    x.strokeStyle = '#3a1f4a'; x.lineWidth = 2.2 * s; x.beginPath(); x.moveTo(m - 5 * s, m + 13.5 * s); x.quadraticCurveTo(m, m + 18 * s, m + 5 * s, m + 13.5 * s); x.stroke();
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(m + 1 * s, m + 15.4 * s); x.lineTo(m + 3 * s, m + 19.5 * s); x.lineTo(m + 4.6 * s, m + 14.8 * s); x.fill();
    uiGloss(x, m - 12 * s, m - 8 * s, 5 * s, 3 * s, -0.6, 0.8);
  }
  ICONS[key] = c.toDataURL();
  return ICONS[key];
}
// 적 얼굴 아이콘 (작은 전신)
var EN_ICON = {};
function enemyIcon(k, px) {
  px = px || 56; var key = k + px; if (EN_ICON[key]) return EN_ICON[key];
  var E = ENEMIES[k], S = px * 1.6 / Math.max(0.6, E.size), fr = enemyFrames(k, S), f = fr.icon || fr.fr[1 % fr.n];
  var bb = alphaBox(f.c), c = mkC(px, px), x = cx2(c), bw = bb[2] - bb[0], bh = bb[3] - bb[1], sc = Math.min(px * 0.92 / bw, px * 0.92 / bh);
  x.translate(px / 2, px / 2); x.scale(sc, sc); x.drawImage(f.c, bb[0], bb[1], bw, bh, -bw / 2, -bh / 2, bw, bh);
  return (EN_ICON[key] = c.toDataURL());
}
function alphaBox(c) {
  var x = cx2(c), d = x.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (var y = 0; y < c.height; y += 2) for (var i = 0; i < c.width; i += 2) if (d[(y * c.width + i) * 4 + 3] > 20) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) return [0, 0, c.width, c.height];
  return [Math.max(0, x0 - 2), Math.max(0, y0 - 2), Math.min(c.width, x1 + 3), Math.min(c.height, y1 + 3)];
}
function towerIconURL(type, L, B, px) {
  var k = 't' + type + L + B + px; if (EN_ICON[k]) return EN_ICON[k];
  try { return (EN_ICON[k] = towerIcon(type, L, B, px).toDataURL()); } catch (e) { }
  // v2.0: 그림이 아직 없는 탑(그림 갈래가 합쳐지기 전)은 탑 색 네모로 대신 그림. 캐시하지 않음(그림이 들어오면 바로 바뀌게)
  px = px || 64; var c = mkC(px, px), x = cx2(c), s = px / 64, T = TOWERS[type] || {}, p = uiRR(12 * s, 16 * s, 40 * s, 40 * s, 9 * s);
  x.lineJoin = 'round'; x.strokeStyle = '#1c1f3a'; x.lineWidth = 5 * s; x.stroke(p); x.fillStyle = T.col || '#8a8ab0'; x.fill(p); x.fillStyle = 'rgba(255,255,255,0.3)'; x.fill(uiRR(15 * s, 19 * s, 34 * s, 12 * s, 6 * s));
  return c.toDataURL();
}

// ---------- 그림 조각 (타이틀, 지도 같이 씀) ----------
// 몽실 구름: 동그라미 여럿 + 납작한 아랫면, 아래쪽은 라일락 그늘
function uiCloud(x, cx, cy, w, a) {
  var p = new Path2D();
  [[-0.34, 0.02, 0.19], [-0.15, -0.13, 0.25], [0.1, -0.19, 0.28], [0.32, -0.04, 0.2], [0.0, 0.0, 0.24]].forEach(function (q) { uiCircle(cx + q[0] * w, cy + q[1] * w, q[2] * w, p); });
  uiRR(cx - w * 0.47, cy - w * 0.02, w * 0.94, w * 0.17, w * 0.085, p);
  x.save(); x.globalAlpha = a == null ? 1 : a;
  x.shadowColor = 'rgba(150,120,210,0.25)'; x.shadowBlur = w * 0.1; x.shadowOffsetY = w * 0.04;
  x.fillStyle = '#ffffff'; x.fill(p); x.shadowColor = 'rgba(0,0,0,0)';
  x.save(); x.clip(p); var g = x.createLinearGradient(0, cy - w * 0.2, 0, cy + w * 0.15); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(236,230,255,0.25)'); g.addColorStop(1, 'rgba(206,192,250,0.75)'); x.fillStyle = g; x.fillRect(cx - w, cy - w, w * 2, w * 2); x.restore();
  x.restore();
}
function uiShadow(x, cx, cy, rx, ry, a) { x.save(); x.fillStyle = 'rgba(74,42,90,' + (a == null ? 0.14 : a) + ')'; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
// 막대사탕 나무
function uiTree(x, X, Y, S, col, fruit) {
  uiShadow(x, X, Y, S * 0.36, S * 0.1);
  uiCandy(x, uiRR(X - S * 0.07, Y - S * 0.42, S * 0.14, S * 0.44, S * 0.07), Y - S * 0.4, Y, ['#e4b796', '#bf8a68'], '#9a6448', S * 0.03);
  var cp = new Path2D(); uiCircle(X, Y - S * 0.62, S * 0.34, cp); uiCircle(X - S * 0.2, Y - S * 0.48, S * 0.2, cp); uiCircle(X + S * 0.21, Y - S * 0.5, S * 0.19, cp);
  uiCandy(x, cp, Y - S * 0.96, Y - S * 0.3, [lit(col, 0.45), col, drk(col, 0.18)], drk(col, 0.35), S * 0.035);
  uiGloss(x, X - S * 0.12, Y - S * 0.78, S * 0.11, S * 0.06, -0.6, 0.55);
  if (fruit) { x.fillStyle = fruit; [[0.14, -0.66], [-0.17, -0.52], [0.05, -0.44]].forEach(function (f) { x.beginPath(); x.arc(X + f[0] * S, Y + f[1] * S, S * 0.045, 0, Math.PI * 2); x.fill(); }); }
}
// 둥근 세모 소나무 (눈 덮개 선택)
function uiPine(x, X, Y, S, col, snow) {
  uiShadow(x, X, Y, S * 0.3, S * 0.09);
  uiCandy(x, uiRR(X - S * 0.06, Y - S * 0.2, S * 0.12, S * 0.22, S * 0.05), Y - S * 0.2, Y, ['#d9a888', '#b07b5c'], '#8f5d44', S * 0.03);
  for (var i = 0; i < 3; i++) {
    var w = S * (0.38 - i * 0.08), yb = Y - S * (0.16 + i * 0.25), yt = yb - S * 0.36, p = new Path2D();
    p.moveTo(X - w, yb); p.quadraticCurveTo(X - w * 0.3, yt + S * 0.12, X, yt); p.quadraticCurveTo(X + w * 0.3, yt + S * 0.12, X + w, yb); p.quadraticCurveTo(X, yb + S * 0.07, X - w, yb); p.closePath();
    uiCandy(x, p, yt, yb, [lit(col, 0.35), col, drk(col, 0.15)], drk(col, 0.35), S * 0.03);
    if (snow) { var q = new Path2D(); q.moveTo(X - w * 0.42, yt + S * 0.19); q.quadraticCurveTo(X - w * 0.1, yt + S * 0.02, X, yt); q.quadraticCurveTo(X + w * 0.1, yt + S * 0.02, X + w * 0.42, yt + S * 0.19); q.quadraticCurveTo(X + w * 0.2, yt + S * 0.25, X, yt + S * 0.2); q.quadraticCurveTo(X - w * 0.2, yt + S * 0.25, X - w * 0.42, yt + S * 0.19); x.fillStyle = '#ffffff'; x.fill(q); }
  }
  uiGloss(x, X - S * 0.1, Y - S * 0.62, S * 0.05, S * 0.09, 0.4, 0.45);
}
function uiBush(x, X, Y, S, col) {
  uiShadow(x, X, Y, S * 0.34, S * 0.08);
  var p = new Path2D(); uiCircle(X - S * 0.17, Y - S * 0.13, S * 0.16, p); uiCircle(X + S * 0.02, Y - S * 0.2, S * 0.2, p); uiCircle(X + S * 0.2, Y - S * 0.12, S * 0.15, p); uiRR(X - S * 0.3, Y - S * 0.15, S * 0.6, S * 0.15, S * 0.07, p);
  uiCandy(x, p, Y - S * 0.4, Y, [lit(col, 0.4), col, drk(col, 0.12)], drk(col, 0.32), S * 0.03);
  uiGloss(x, X - S * 0.04, Y - S * 0.3, S * 0.08, S * 0.04, -0.3, 0.5);
}
function uiFlower(x, X, Y, r, col) {
  x.fillStyle = col; for (var i = 0; i < 5; i++) { var a = i * Math.PI * 0.4 - Math.PI / 2; x.beginPath(); x.arc(X + Math.cos(a) * r * 0.62, Y + Math.sin(a) * r * 0.62, r * 0.5, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = '#ffd84d'; x.beginPath(); x.arc(X, Y, r * 0.38, 0, Math.PI * 2); x.fill();
}
function uiMush(x, X, Y, S, col) {
  uiShadow(x, X, Y, S * 0.22, S * 0.06);
  uiCandy(x, uiRR(X - S * 0.08, Y - S * 0.26, S * 0.16, S * 0.26, S * 0.07), Y - S * 0.26, Y, ['#fffaf3', '#f2dccf'], '#c79a8a', S * 0.025);
  var p = new Path2D(); p.moveTo(X - S * 0.26, Y - S * 0.22); p.quadraticCurveTo(X - S * 0.26, Y - S * 0.5, X, Y - S * 0.5); p.quadraticCurveTo(X + S * 0.26, Y - S * 0.5, X + S * 0.26, Y - S * 0.22); p.quadraticCurveTo(X, Y - S * 0.17, X - S * 0.26, Y - S * 0.22); p.closePath();
  uiCandy(x, p, Y - S * 0.5, Y - S * 0.2, [lit(col, 0.35), col, drk(col, 0.12)], drk(col, 0.35), S * 0.028);
  x.fillStyle = '#ffffff'; [[-0.12, -0.36, 0.045], [0.08, -0.42, 0.04], [0.14, -0.3, 0.035]].forEach(function (d) { x.beginPath(); x.arc(X + d[0] * S, Y + d[1] * S, d[2] * S, 0, Math.PI * 2); x.fill(); });
}
function uiRock(x, X, Y, S, col) {
  uiShadow(x, X, Y, S * 0.3, S * 0.07);
  var p = new Path2D(); p.moveTo(X - S * 0.28, Y); p.quadraticCurveTo(X - S * 0.3, Y - S * 0.2, X - S * 0.12, Y - S * 0.27); p.quadraticCurveTo(X + S * 0.05, Y - S * 0.36, X + S * 0.2, Y - S * 0.22); p.quadraticCurveTo(X + S * 0.32, Y - S * 0.1, X + S * 0.27, Y); p.closePath();
  uiCandy(x, p, Y - S * 0.34, Y, [lit(col, 0.45), col, drk(col, 0.1)], drk(col, 0.3), S * 0.028);
  uiGloss(x, X - S * 0.08, Y - S * 0.22, S * 0.08, S * 0.035, -0.4, 0.55);
}
function uiCactus(x, X, Y, S) {
  uiShadow(x, X, Y, S * 0.22, S * 0.06);
  var p = new Path2D(); uiRR(X - S * 0.09, Y - S * 0.62, S * 0.18, S * 0.62, S * 0.09, p); uiRR(X - S * 0.27, Y - S * 0.44, S * 0.13, S * 0.24, S * 0.065, p); uiRR(X - S * 0.27, Y - S * 0.27, S * 0.24, S * 0.11, S * 0.055, p); uiRR(X + S * 0.15, Y - S * 0.5, S * 0.12, S * 0.22, S * 0.06, p); uiRR(X + S * 0.02, Y - S * 0.34, S * 0.25, S * 0.1, S * 0.05, p);
  uiCandy(x, p, Y - S * 0.62, Y, ['#b6f0d6', '#72d6ae', '#4fbf94'], '#2f9a72', S * 0.028);
  uiFlower(x, X, Y - S * 0.63, S * 0.07, '#ff8fbf');
}
function uiMesa(x, X, Y, S) {
  uiShadow(x, X, Y, S * 0.42, S * 0.08);
  var p = new Path2D(); p.moveTo(X - S * 0.42, Y); p.quadraticCurveTo(X - S * 0.4, Y - S * 0.3, X - S * 0.26, Y - S * 0.36); p.lineTo(X + S * 0.24, Y - S * 0.38); p.quadraticCurveTo(X + S * 0.4, Y - S * 0.3, X + S * 0.42, Y); p.closePath();
  uiCandy(x, p, Y - S * 0.38, Y, ['#ffe3cc', '#ffbf94', '#f2a070'], '#d47f50', S * 0.028);
  x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = S * 0.03; x.beginPath(); x.moveTo(X - S * 0.3, Y - S * 0.2); x.quadraticCurveTo(X, Y - S * 0.16, X + S * 0.32, Y - S * 0.21); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.75)'; x.fill(uiRR(X - S * 0.24, Y - S * 0.37, S * 0.46, S * 0.05, S * 0.025));
}
function uiSnowman(x, X, Y, S) {
  uiShadow(x, X, Y, S * 0.22, S * 0.06);
  var p = new Path2D(); uiCircle(X, Y - S * 0.17, S * 0.18, p); uiCircle(X, Y - S * 0.43, S * 0.13, p);
  uiCandy(x, p, Y - S * 0.56, Y, ['#ffffff', '#f2f8ff', '#d8e8fb'], '#9db9e0', S * 0.025);
  x.fillStyle = '#3a1f4a'; [[-0.045, -0.46], [0.045, -0.46]].forEach(function (e) { x.beginPath(); x.arc(X + e[0] * S, Y + e[1] * S, S * 0.02, 0, Math.PI * 2); x.fill(); });
  x.fillStyle = '#ff9a5c'; x.beginPath(); x.moveTo(X, Y - S * 0.42); x.lineTo(X + S * 0.1, Y - S * 0.4); x.lineTo(X, Y - S * 0.39); x.fill();
  x.fillStyle = '#ff8fbf'; x.fill(uiRR(X - S * 0.12, Y - S * 0.33, S * 0.24, S * 0.05, S * 0.025));
}
function uiPillar(x, X, Y, S, col) {
  uiShadow(x, X, Y, S * 0.2, S * 0.06);
  var p = new Path2D(); p.moveTo(X - S * 0.11, Y); p.lineTo(X - S * 0.11, Y - S * 0.42); p.lineTo(X - S * 0.03, Y - S * 0.48); p.lineTo(X + S * 0.04, Y - S * 0.4); p.lineTo(X + S * 0.11, Y - S * 0.46); p.lineTo(X + S * 0.11, Y); p.closePath();
  uiCandy(x, p, Y - S * 0.48, Y, [lit(col, 0.5), col, drk(col, 0.1)], drk(col, 0.3), S * 0.025);
  x.strokeStyle = rgba(drk(col, 0.25), 0.4); x.lineWidth = S * 0.02; [-0.04, 0.04].forEach(function (o) { x.beginPath(); x.moveTo(X + o * S, Y - S * 0.04); x.lineTo(X + o * S, Y - S * 0.38); x.stroke(); });
  uiCandy(x, uiRR(X - S * 0.15, Y - S * 0.07, S * 0.3, S * 0.07, S * 0.03), Y - S * 0.07, Y, [lit(col, 0.4), col], drk(col, 0.3), S * 0.02);
}
function uiVolcano(x, X, Y, S) {
  uiShadow(x, X, Y, S * 0.44, S * 0.08);
  var p = new Path2D(); p.moveTo(X - S * 0.44, Y); p.quadraticCurveTo(X - S * 0.2, Y - S * 0.2, X - S * 0.13, Y - S * 0.42); p.lineTo(X + S * 0.13, Y - S * 0.42); p.quadraticCurveTo(X + S * 0.2, Y - S * 0.2, X + S * 0.44, Y); p.closePath();
  uiCandy(x, p, Y - S * 0.42, Y, ['#e8b4b4', '#c98a96', '#a86d80'], '#8a5266', S * 0.028);
  var lv = new Path2D(); lv.moveTo(X - S * 0.13, Y - S * 0.42); lv.lineTo(X + S * 0.13, Y - S * 0.42); lv.quadraticCurveTo(X + S * 0.1, Y - S * 0.3, X + S * 0.04, Y - S * 0.28); lv.quadraticCurveTo(X, Y - S * 0.18, X - S * 0.05, Y - S * 0.3); lv.quadraticCurveTo(X - S * 0.11, Y - S * 0.32, X - S * 0.13, Y - S * 0.42); lv.closePath();
  uiCandy(x, lv, Y - S * 0.42, Y - S * 0.2, ['#ffe08a', '#ff9a5c']);
  [[0.02, -0.58, 0.1], [0.12, -0.7, 0.08], [-0.06, -0.76, 0.07]].forEach(function (q) { x.fillStyle = 'rgba(255,240,246,0.92)'; x.beginPath(); x.arc(X + q[0] * S, Y + q[1] * S, q[2] * S, 0, Math.PI * 2); x.fill(); });
}
function uiCrystal(x, X, Y, S, col) {
  uiShadow(x, X, Y, S * 0.26, S * 0.07);
  [[-0.13, 0.28, -0.35], [0.12, 0.34, 0.3], [0, 0.5, 0]].forEach(function (q) {
    x.save(); x.translate(X + q[0] * S, Y); x.rotate(q[2]);
    var w = S * 0.08, h = S * q[1], p = new Path2D(); p.moveTo(-w, 0); p.lineTo(-w, -h); p.lineTo(0, -h - w * 1.6); p.lineTo(w, -h); p.lineTo(w, 0); p.closePath();
    uiCandy(x, p, -h - w * 1.6, 0, [lit(col, 0.55), col, drk(col, 0.1)], drk(col, 0.35), S * 0.022);
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.fill(uiRR(-w * 0.55, -h * 0.9, w * 0.35, h * 0.75, w * 0.17));
    x.restore();
  });
}

// ---------- 타이틀 그림: 맑은 낮 하늘, 사탕 언덕 위 둥근 성, 무지개 화살 ----------
function drawTitleArt(c) {
  var W = c.width, H = c.height, x = cx2(c), rnd = rngOf(11), u = Math.min(W / 400, H / 640);
  x.lineCap = 'round'; x.lineJoin = 'round';
  var sky = x.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#7ccbff'); sky.addColorStop(0.3, '#a9dcff'); sky.addColorStop(0.5, '#d4ecff'); sky.addColorStop(0.62, '#ffe1ef'); sky.addColorStop(0.76, '#ffe9da'); sky.addColorStop(1, '#ffe9da');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);
  // 로고 뒤 햇살 무늬 (가운데서 퍼지는 옅은 빛살)
  var lx = W / 2, ly = H * 0.25, R = Math.max(W, H) * 0.75, rc = mkC(W, H), rx = cx2(rc);
  rx.fillStyle = '#ffffff';
  for (var i = 0; i < 16; i++) { var a0 = i * Math.PI / 8 + 0.08, a1 = a0 + Math.PI / 16; rx.beginPath(); rx.moveTo(lx, ly); rx.arc(lx, ly, R, a0, a1); rx.closePath(); rx.fill(); }
  rx.globalCompositeOperation = 'destination-in'; var rg = rx.createRadialGradient(lx, ly, 0, lx, ly, R * 0.75); rg.addColorStop(0, 'rgba(0,0,0,0.3)'); rg.addColorStop(0.5, 'rgba(0,0,0,0.12)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); rx.fillStyle = rg; rx.fillRect(0, 0, W, H);
  x.drawImage(rc, 0, 0);
  glowAt(x, lx, ly, W * 0.62, '#ffffff', 0.55);
  // 해 (왼쪽 위)
  var sx = W * 0.13, sy = H * 0.075;
  glowAt(x, sx, sy, 120 * u, '#fff7c8', 0.95);
  var sg = x.createRadialGradient(sx - 8 * u, sy - 8 * u, 0, sx, sy, 34 * u); sg.addColorStop(0, '#fffef2'); sg.addColorStop(0.7, '#fff2a6'); sg.addColorStop(1, '#ffe27a');
  x.fillStyle = sg; x.beginPath(); x.arc(sx, sy, 32 * u, 0, Math.PI * 2); x.fill();
  // 구름
  uiCloud(x, W * 0.1, H * 0.2, 170 * u, 0.95);
  uiCloud(x, W * 0.95, H * 0.12, 150 * u, 0.9);
  uiCloud(x, W * 0.9, H * 0.42, 190 * u, 0.95);
  uiCloud(x, W * 0.14, H * 0.5, 120 * u, 0.85);
  uiCloud(x, W * 0.62, H * 0.56, 80 * u, 0.7);
  // 하늘 반짝이
  for (var k = 0; k < 16; k++) { var px = rnd() * W, py = rnd() * H * 0.55; if (Math.abs(px - lx) < W * 0.38 && Math.abs(py - ly) < H * 0.12) continue; uiSpark(x, px, py, (4 + rnd() * 7) * u, rnd() < 0.5 ? '#ffffff' : '#fff3b0', 0.55 + rnd() * 0.45); }
  // 성 밑동: 시작 단추(아래 13%)와 겹치지 않게 짧은 화면에서는 조금 올림
  var dp = W / Math.max(1, window.innerWidth || W), by = Math.min(H * 0.79, H * 0.87 - 64 * dp), cxp = W / 2;
  // 먼 언덕: 라일락, 민트
  function hills(y0, amp, seed, cols, edge) {
    var r = rngOf(seed), n = 4, pts = [], p = new Path2D();
    for (var j = 0; j <= n; j++) pts.push([W * (j / n) + (r() - 0.5) * W * 0.12, y0 - amp * (0.3 + r() * 0.7)]);
    pts[0][0] = -W * 0.05; pts[n][0] = W * 1.05;
    p.moveTo(-W * 0.05, H + 2); p.lineTo(pts[0][0], pts[0][1]);
    for (j = 0; j < n; j++) { var A = pts[j], B = pts[j + 1], mx = (A[0] + B[0]) / 2; p.bezierCurveTo(mx, A[1], mx, B[1], B[0], B[1]); }
    p.lineTo(W * 1.05, H + 2); p.closePath();
    var g = x.createLinearGradient(0, y0 - amp, 0, y0 + amp * 2); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]); x.fillStyle = g; x.fill(p);
    if (edge) { x.save(); x.clip(p); x.strokeStyle = edge; x.lineWidth = 5 * u; x.beginPath(); x.moveTo(pts[0][0], pts[0][1] + 2 * u); for (j = 0; j < n; j++) { var A2 = pts[j], B2 = pts[j + 1], mx2 = (A2[0] + B2[0]) / 2; x.bezierCurveTo(mx2, A2[1] + 2 * u, mx2, B2[1] + 2 * u, B2[0], B2[1] + 2 * u); } x.stroke(); x.restore(); }
    return pts;
  }
  hills(H * 0.66, 34 * u, 3, ['#e1d6fb', '#f0e6ff'], 'rgba(255,255,255,0.6)');
  hills(H * 0.71, 30 * u, 8, ['#c7f0dc', '#e2f8ea'], 'rgba(255,255,255,0.65)');
  // 무지개 화살 자국 (성 꼭대기에서 오른쪽 하늘로)
  var keepTop = by - 34 * u - 118 * u - 66 * u, t0x = cxp + 2 * u, t0y = keepTop - 8 * u, t1x = W * 0.86, t1y = H * 0.055, qx = W * 1.02, qy = H * 0.46;
  x.save();
  [['#ff9cc8', -9], ['#ffc48a', -4.5], ['#ffe27a', 0], ['#8fe3c7', 4.5], ['#8fd0ff', 9]].forEach(function (q) {
    var o = q[1] * u, g2 = x.createLinearGradient(t0x, t0y, t1x, t1y); g2.addColorStop(0, rgba(q[0], 0)); g2.addColorStop(0.35, rgba(q[0], 0.55)); g2.addColorStop(1, rgba(q[0], 0.95));
    x.strokeStyle = g2; x.lineWidth = 5.5 * u; x.beginPath(); x.moveTo(t0x + o * 0.4, t0y); x.quadraticCurveTo(qx + o, qy + o * 0.3, t1x + o * 0.75, t1y + o * 0.65); x.stroke();
  });
  x.restore();
  for (k = 0; k < 14; k++) { var tt = 0.25 + rnd() * 0.72, bx = (1 - tt) * (1 - tt) * t0x + 2 * (1 - tt) * tt * qx + tt * tt * t1x, by2 = (1 - tt) * (1 - tt) * t0y + 2 * (1 - tt) * tt * qy + tt * tt * t1y; uiSpark(x, bx + (rnd() - 0.5) * 34 * u, by2 + (rnd() - 0.5) * 34 * u, (3 + rnd() * 6) * u, rnd() < 0.6 ? '#ffffff' : '#fff3a0', 0.6 + rnd() * 0.4); }
  // 화살 머리 (끝 방향으로)
  var ang = Math.atan2(t1y - qy, t1x - qx);
  x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, t1x, t1y, 46 * u, '#fff3b0', 0.85); x.restore();
  x.save(); x.translate(t1x, t1y); x.rotate(ang);
  var fe = new Path2D(); fe.moveTo(-26 * u, 0); fe.lineTo(-38 * u, -10 * u); fe.lineTo(-31 * u, 0); fe.lineTo(-38 * u, 10 * u); fe.closePath();
  uiCandy(x, fe, -10 * u, 10 * u, ['#ffd6e8', '#ff86b8'], '#d23a72', 2 * u);
  uiCandy(x, uiRR(-32 * u, -3 * u, 34 * u, 6 * u, 3 * u), -3 * u, 3 * u, ['#fffbe8', '#ffd35a'], '#de8500', 1.6 * u);
  var hd = new Path2D(); hd.moveTo(18 * u, 0); hd.lineTo(0, -11 * u); hd.lineTo(3 * u, 0); hd.lineTo(0, 11 * u); hd.closePath();
  uiCandy(x, hd, -11 * u, 11 * u, ['#fff3a0', '#ffd23a', '#ffaa00'], '#de8500', 2.2 * u);
  uiGloss(x, 5 * u, -3.5 * u, 5 * u, 1.8 * u, 0.5, 0.85);
  x.restore();
  uiSpark(x, t1x + 14 * u, t1y - 16 * u, 10 * u, '#ffffff'); uiSpark(x, t1x - 18 * u, t1y + 20 * u, 6 * u, '#fff3a0');
  // 성이 앉은 언덕
  var hill = new Path2D(); hill.moveTo(-W * 0.05, H); hill.lineTo(-W * 0.05, by + 30 * u); hill.bezierCurveTo(W * 0.2, by - 4 * u, W * 0.3, by - 12 * u, cxp, by - 12 * u); hill.bezierCurveTo(W * 0.7, by - 12 * u, W * 0.8, by - 4 * u, W * 1.05, by + 26 * u); hill.lineTo(W * 1.05, H); hill.closePath();
  var hg = x.createLinearGradient(0, by - 14 * u, 0, H); hg.addColorStop(0, '#bff1a4'); hg.addColorStop(0.25, '#a3e68c'); hg.addColorStop(1, '#86d97a'); x.fillStyle = hg; x.fill(hill);
  x.save(); x.clip(hill); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 5 * u; x.beginPath(); x.moveTo(-W * 0.05, by + 32 * u); x.bezierCurveTo(W * 0.2, by - 2 * u, W * 0.3, by - 10 * u, cxp, by - 10 * u); x.bezierCurveTo(W * 0.7, by - 10 * u, W * 0.8, by - 2 * u, W * 1.05, by + 28 * u); x.stroke(); x.restore();
  // 성
  uiShadow(x, cxp, by + 2 * u, 128 * u, 13 * u, 0.13);
  var OL = '#d49ab9', olw = 2 * u;
  function body(tx, top, w, bot) {
    var p = uiRR(tx - w / 2, top, w, bot - top, 3 * u);
    x.strokeStyle = OL; x.lineWidth = olw * 2; x.stroke(p);
    var g = x.createLinearGradient(tx - w / 2, 0, tx + w / 2, 0); g.addColorStop(0, '#fff3ea'); g.addColorStop(0.3, '#fffdf9'); g.addColorStop(0.72, '#fbe9f1'); g.addColorStop(1, '#f1d2e2'); x.fillStyle = g; x.fill(p);
    // 벽돌 무늬
    x.save(); x.clip(p); x.fillStyle = 'rgba(236,196,216,0.45)';
    for (var yy = top + 12 * u, row = 0; yy < bot - 4 * u; yy += 13 * u, row++) for (var xx = tx - w / 2 + (row % 2 ? 4 : 11) * u; xx < tx + w / 2 - 6 * u; xx += 15 * u) if ((xx * 7 + yy * 3) % 5 < 2.2) x.fill(uiRR(xx, yy, 8 * u, 4.5 * u, 2.2 * u));
    x.restore();
  }
  function rim(tx, y, w) { var p = uiRR(tx - w / 2, y - 6 * u, w, 12 * u, 6 * u); x.strokeStyle = OL; x.lineWidth = olw * 2; x.stroke(p); var g = x.createLinearGradient(0, y - 6 * u, 0, y + 6 * u); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#f6dce9'); x.fillStyle = g; x.fill(p); }
  function roof(tx, y, w, h, col) {
    var p = new Path2D(); p.moveTo(tx - w / 2, y); p.quadraticCurveTo(tx - w * 0.2, y - h * 0.55, tx, y - h); p.quadraticCurveTo(tx + w * 0.2, y - h * 0.55, tx + w / 2, y); p.quadraticCurveTo(tx, y + 8 * u, tx - w / 2, y); p.closePath();
    x.strokeStyle = drk(col, 0.28); x.lineWidth = olw * 2; x.stroke(p);
    var g = x.createLinearGradient(tx - w / 2, 0, tx + w / 2, 0); g.addColorStop(0, lit(col, 0.45)); g.addColorStop(0.45, col); g.addColorStop(1, drk(col, 0.14)); x.fillStyle = g; x.fill(p);
    // 비늘 기와
    x.save(); x.clip(p); x.strokeStyle = rgba(lit(col, 0.6), 0.55); x.lineWidth = 1.6 * u;
    for (var r = 1; r < 5; r++) { var yy = y - h * r / 5.2, half = w / 2 * (1 - r / 5.2) * 1.05, n = Math.max(2, Math.round(half * 2 / (9 * u))); for (var q = 0; q < n; q++) { var cx0 = tx - half + (q + 0.5) * half * 2 / n; x.beginPath(); x.arc(cx0, yy, half / n, 0.1 * Math.PI, 0.9 * Math.PI); x.stroke(); } }
    x.restore();
    x.save(); x.globalAlpha = 0.55; x.strokeStyle = '#ffffff'; x.lineWidth = 3 * u; x.beginPath(); x.moveTo(tx - w * 0.28, y - 4 * u); x.quadraticCurveTo(tx - w * 0.14, y - h * 0.5, tx - 2 * u, y - h * 0.88); x.stroke(); x.restore();
    return y - h;
  }
  function flag(tx, ty, col, dir) {
    x.strokeStyle = '#c48aa8'; x.lineWidth = 2.2 * u; x.beginPath(); x.moveTo(tx, ty + 2 * u); x.lineTo(tx, ty - 20 * u); x.stroke();
    var p = new Path2D(); p.moveTo(tx, ty - 20 * u); p.quadraticCurveTo(tx + dir * 9 * u, ty - 23 * u, tx + dir * 18 * u, ty - 16 * u); p.quadraticCurveTo(tx + dir * 9 * u, ty - 13 * u, tx, ty - 11 * u); p.closePath();
    uiCandy(x, p, ty - 22 * u, ty - 11 * u, [lit(col, 0.35), col], drk(col, 0.3), 1.4 * u);
    uiCandy(x, uiCircle(tx, ty - 21 * u, 2.6 * u), ty - 24 * u, ty - 18 * u, ['#fff3a0', '#ffc21a'], '#de8500', 1 * u);
  }
  function win(wx, wy, r) {
    x.fillStyle = '#fffaf3'; x.strokeStyle = OL; x.lineWidth = olw; x.beginPath(); x.arc(wx, wy, r + 2.6 * u, 0, Math.PI * 2); x.fill(); x.stroke();
    var g = x.createRadialGradient(wx - r * 0.3, wy - r * 0.3, 0, wx, wy, r); g.addColorStop(0, '#f2fbff'); g.addColorStop(1, '#8fd0ff'); x.fillStyle = g; x.beginPath(); x.arc(wx, wy, r, 0, Math.PI * 2); x.fill();
    uiGloss(x, wx - r * 0.3, wy - r * 0.35, r * 0.35, r * 0.2, -0.6, 0.9);
  }
  function tower(tx, base, w, h, col, rh, fcol, fdir) {
    var top = base - h;
    body(tx, top, w, base); win(tx, top + h * 0.38, w * 0.17);
    rim(tx, top, w + 9 * u);
    var tip = roof(tx, top - 4 * u, w + 14 * u, rh, col);
    flag(tx, tip, fcol, fdir);
  }
  // 뒤 탑 둘 (하늘색 지붕)
  tower(cxp - 52 * u, by - 36 * u, 30 * u, 72 * u, '#86cbff', 46 * u, '#ffd84d', -1);
  tower(cxp + 52 * u, by - 36 * u, 30 * u, 78 * u, '#86cbff', 48 * u, '#8fe3c7', 1);
  // 가운데 큰 탑 (분홍 지붕, 하트 창)
  var kTop = by - 34 * u - 118 * u;
  body(cxp, kTop, 58 * u, by - 30 * u);
  uiCandy(x, uiHeartPath(cxp, kTop + 40 * u, 24 * u), kTop + 28 * u, kTop + 52 * u, ['#ffd0e4', '#ff8fbf'], '#d94f8a', 1.6 * u);
  uiGloss(x, cxp - 5 * u, kTop + 35 * u, 3 * u, 2 * u, -0.6, 0.8);
  win(cxp - 14 * u, kTop + 78 * u, 6 * u); win(cxp + 14 * u, kTop + 78 * u, 6 * u);
  rim(cxp, kTop, 70 * u);
  var kTip = roof(cxp, kTop - 4 * u, 78 * u, 66 * u, '#ff8fbf');
  flag(cxp, kTip, '#ffd84d', 1);
  // 앞 성벽 (둥근 성가퀴)
  var wl = cxp - 92 * u, wr = cxp + 92 * u, wt = by - 44 * u, wall = new Path2D();
  wall.moveTo(wl, by); wall.lineTo(wl, wt);
  for (var mx3 = wl, n3 = 11, mw = (wr - wl) / n3, q3 = 0; q3 < n3; q3++, mx3 += mw) { wall.lineTo(mx3 + mw * 0.12, wt); wall.arc(mx3 + mw * 0.5, wt, mw * 0.38, Math.PI, 0); wall.lineTo(mx3 + mw, wt); }
  wall.lineTo(wr, by); wall.closePath();
  x.strokeStyle = OL; x.lineWidth = olw * 2; x.stroke(wall);
  var wg = x.createLinearGradient(0, wt - 10 * u, 0, by); wg.addColorStop(0, '#ffffff'); wg.addColorStop(0.6, '#fdf1f6'); wg.addColorStop(1, '#f3d8e6'); x.fillStyle = wg; x.fill(wall);
  x.save(); x.clip(wall); x.fillStyle = 'rgba(236,196,216,0.45)'; for (var yy3 = wt + 10 * u, rw3 = 0; yy3 < by - 6 * u; yy3 += 12 * u, rw3++) for (var xx3 = wl + (rw3 % 2 ? 6 : 14) * u; xx3 < wr - 8 * u; xx3 += 22 * u) x.fill(uiRR(xx3, yy3, 10 * u, 4.5 * u, 2.2 * u)); x.restore();
  // 걸개 깃발 둘
  [-1, 1].forEach(function (k2) { var bx3 = cxp + k2 * 46 * u, bt = wt + 6 * u, p = new Path2D(); p.moveTo(bx3 - 8 * u, bt); p.lineTo(bx3 + 8 * u, bt); p.lineTo(bx3 + 8 * u, bt + 24 * u); p.lineTo(bx3, bt + 18 * u); p.lineTo(bx3 - 8 * u, bt + 24 * u); p.closePath(); uiCandy(x, p, bt, bt + 24 * u, ['#c9b3ff', '#a98bf5'], '#7a5ac8', 1.3 * u); uiSpark(x, bx3, bt + 10 * u, 4.5 * u, '#fff3a0'); });
  // 성문
  var gw = 34 * u, gh = 40 * u, door = new Path2D(); door.moveTo(cxp - gw / 2, by); door.lineTo(cxp - gw / 2, by - gh + gw / 2); door.arc(cxp, by - gh + gw / 2, gw / 2, Math.PI, 0); door.lineTo(cxp + gw / 2, by); door.closePath();
  x.strokeStyle = '#fffaf3'; x.lineWidth = 9 * u; x.stroke(door); x.strokeStyle = OL; x.lineWidth = olw; x.stroke(door);
  uiCandy(x, door, by - gh, by, ['#f6c39a', '#e39a68', '#cf8152']);
  x.save(); x.clip(door); x.strokeStyle = 'rgba(160,90,50,0.35)'; x.lineWidth = 1.6 * u; [-8, 0, 8].forEach(function (o) { x.beginPath(); x.moveTo(cxp + o * u, by - gh); x.lineTo(cxp + o * u, by); x.stroke(); }); x.restore();
  uiCandy(x, uiHeartPath(cxp, by - gh + 13 * u, 11 * u), by - gh + 8 * u, by - gh + 18 * u, ['#ffd0e4', '#ff6fa8']);
  x.fillStyle = '#ffd84d'; x.beginPath(); x.arc(cxp + 9 * u, by - 14 * u, 2.2 * u, 0, Math.PI * 2); x.fill();
  // 앞 모퉁이 탑 (라일락 지붕)
  tower(cxp - 98 * u, by + 2 * u, 36 * u, 74 * u, '#c3a8ff', 46 * u, '#ff8fbf', -1);
  tower(cxp + 98 * u, by + 2 * u, 36 * u, 74 * u, '#c3a8ff', 46 * u, '#ff8fbf', 1);
  // 성문에서 내려오는 길
  var road = new Path2D(); road.moveTo(cxp - 15 * u, by); road.bezierCurveTo(cxp - 30 * u, by + 50 * u, cxp + 40 * u, by + 70 * u, cxp - 10 * u, H + 4 * u); road.lineTo(cxp + 40 * u, H + 4 * u); road.bezierCurveTo(cxp + 70 * u, by + 70 * u, cxp + 5 * u, by + 50 * u, cxp + 15 * u, by); road.closePath();
  x.fillStyle = '#fff4dc'; x.fill(road); x.strokeStyle = 'rgba(232,190,150,0.65)'; x.lineWidth = 2.2 * u; x.stroke(road);
  // 앞 언덕 둘 (밝은 사탕 초록)
  function front(cx0, top, w, cols) {
    var p = new Path2D(); p.moveTo(cx0 - w, H + 4 * u); p.bezierCurveTo(cx0 - w * 0.7, top, cx0 + w * 0.7, top, cx0 + w, H + 4 * u); p.closePath();
    var g = x.createLinearGradient(0, top, 0, H); g.addColorStop(0, cols[0]); g.addColorStop(0.4, cols[1]); g.addColorStop(1, cols[2]); x.fillStyle = g; x.fill(p);
    x.save(); x.clip(p); x.beginPath(); x.rect(0, top - 10 * u, W, 46 * u); x.clip(); x.strokeStyle = 'rgba(255,255,255,0.65)'; x.lineWidth = 5 * u; x.beginPath(); x.moveTo(cx0 - w, H + 6 * u); x.bezierCurveTo(cx0 - w * 0.7, top + 3 * u, cx0 + w * 0.7, top + 3 * u, cx0 + w, H + 6 * u); x.stroke(); x.restore();
    return p;
  }
  front(W * 0.02, by + 34 * u, 140 * u, ['#b4ee98', '#94e27f', '#74d070']);
  front(W * 0.98, by + 44 * u, 150 * u, ['#b4ee98', '#94e27f', '#74d070']);
  // 덤불, 나무
  uiTree(x, cxp - 150 * u, by + 30 * u, 70 * u, '#7fd67a', '#ff8fbf'); uiTree(x, cxp + 154 * u, by + 34 * u, 62 * u, '#8fdc7a', '#ffd84d');
  uiBush(x, cxp - 124 * u, by + 6 * u, 46 * u, '#86da7e'); uiBush(x, cxp + 128 * u, by + 8 * u, 42 * u, '#86da7e');
  uiBush(x, cxp - 52 * u, by + 4 * u, 34 * u, '#9be38c'); uiBush(x, cxp + 54 * u, by + 4 * u, 36 * u, '#9be38c');
  // 꽃
  var fc = ['#ffffff', '#ffb3d4', '#fff3a0', '#d6c6ff'];
  for (k = 0; k < 46; k++) { var fx = rnd() * W, fy = by + 8 * u + rnd() * (H - by); if (Math.abs(fx - cxp - 12 * u) < 40 * u && fy < by + 60 * u) continue; uiFlower(x, fx, fy, (3 + rnd() * 3.5) * u, fc[k % 4]); }
  // 아래쪽 살짝 진하게 (시작 단추가 또렷하게)
  var bg = x.createLinearGradient(0, H * 0.82, 0, H); bg.addColorStop(0, 'rgba(90,170,90,0)'); bg.addColorStop(1, 'rgba(90,170,90,0.18)'); x.fillStyle = bg; x.fillRect(0, H * 0.82, W, H * 0.18);
}

// ---------- 세계 지도: 지역마다 다른 파스텔 땅, 사탕 소품, 점선 길 ----------
var WORLD_NODES = [[0.3, 0.045], [0.64, 0.11], [0.38, 0.185], [0.66, 0.27], [0.34, 0.35], [0.62, 0.43], [0.36, 0.52], [0.66, 0.6], [0.38, 0.685], [0.64, 0.77], [0.36, 0.855], [0.56, 0.945]];
var WORLD_BANDS = [['meadow', 0, 0.235, '국경 초원'], ['forest', 0.235, 0.4, '안개 숲'], ['deepforest', 0.4, 0.475, '거미 숲'], ['canyon', 0.475, 0.565, '붉은 황야'], ['snow', 0.565, 0.73, '북녘 설원'], ['ruins', 0.73, 0.82, '잿빛 땅'], ['volcano', 0.82, 0.9, '용암 지대'], ['dark', 0.9, 1.01, '잿빛 성채']];
// 지역 땅 색 [진, 중, 밝]. 2부(13판부터): 구름 섬(하늘빛), 사탕 골짜기(분홍), 별빛 하늘(밤 라일락), 오로라 고원(민트) 차례로
var UI_BAND_COL = { meadow: ['#93db7a', '#aae890', '#c3f2a8'], forest: ['#7ed6a0', '#97e2b2', '#b4ecc8'], deepforest: ['#b0a2ea', '#c1b5f0', '#d3caf6'], canyon: ['#ffbf96', '#ffcfaa', '#ffdfc4'], snow: ['#d4e9ff', '#e5f2ff', '#f6fbff'], ruins: ['#cfc2e6', '#dcd2ee', '#eae3f6'], volcano: ['#ffa898', '#ffbaa9', '#ffcfc1'], dark: ['#a690d8', '#b8a6e2', '#cabcec'],
  cloud: ['#8ec2ff', '#a9d2ff', '#c6e2ff'], candy: ['#ff9fca', '#ffb8d8', '#ffd2e6'], star: ['#7563c9', '#8676d4', '#9b8de0'], aurora: ['#6fd8c0', '#8ee4cf', '#b2efdf'] };
var WORLD_P2 = [['cloud', '구름 섬'], ['candy', '사탕 골짜기'], ['star', '별빛 하늘'], ['aurora', '오로라 고원']];
// 판 n개의 지도 배치: nodes [x(0~1), v(1부 높이 단위, 아래 0)], bands [테마, v0, v1, 이름, 이름표 숨김], vmax(지도 전체 높이, 1부 = 1)
// 1~12판은 v1.2 자리 그대로. 13판부터는 1부 위에 0.083 간격 지그재그로 이어 붙임
function worldLayout(n) {
  n = Math.max(1, n || MAPS.length);
  var nodes = WORLD_NODES.slice(0, Math.min(n, WORLD_NODES.length)), XS = [0.4, 0.66, 0.36, 0.62, 0.34, 0.64, 0.4, 0.6];
  for (var i = WORLD_NODES.length; i < n; i++) { var j = i - WORLD_NODES.length; nodes.push([XS[j % XS.length], 1.045 + j * 0.083]); }
  var vmax = n <= WORLD_NODES.length ? 1 : nodes[n - 1][1] + 0.075;
  var bands = WORLD_BANDS.map(function (b) { return [b[0], b[1], b[2], b[3], b[0] === 'deepforest' || b[0] === 'volcano' ? 1 : 0]; });
  if (vmax > 1) {
    bands[bands.length - 1][2] = 1.0;
    // 2부 구역: 이어진 판들의 지역 이름(MAPS[i].region)으로 묶음. 이름이 없으면 3판씩 기본 이름
    var groups = [], first = WORLD_NODES.length;
    for (i = first; i < n; i++) { var rg = MAPS[i] && MAPS[i].region, last = groups[groups.length - 1]; if (!rg) rg = '#' + Math.floor((i - first) / 3); if (last && last.rg === rg) last.to = i; else groups.push({ rg: rg, from: i, to: i }); }
    groups.forEach(function (gr, gi) {
      var P = WORLD_P2[gi % WORLD_P2.length], v0 = gi ? (nodes[gr.from - 1][1] + nodes[gr.from][1]) / 2 : 1.0, v1 = gi < groups.length - 1 ? (nodes[gr.to][1] + nodes[gr.to + 1][1]) / 2 : vmax + 0.02;
      bands.push([P[0], v0, v1, gr.rg.charAt(0) === '#' ? P[1] : gr.rg, 0]);
    });
  }
  return { nodes: nodes, bands: bands, vmax: vmax };
}
function drawWorldMap(c, dpr) {
  var W = c.width, H = c.height, x = cx2(c), rnd = rngOf(21), N = makeNoise(77), D = dpr;
  var LY = worldLayout(MAPS.length), NODES = LY.nodes, BANDS = LY.bands, VM = LY.vmax;
  function Y(v) { return (VM - v) / VM * H; }
  x.lineCap = 'round'; x.lineJoin = 'round';
  function bandAt(v) { for (var i = 0; i < BANDS.length; i++) if (v >= BANDS[i][1] && v < BANDS[i][2]) return i; return v < BANDS[0][1] ? 0 : BANDS.length - 1; }
  // 땅 색: 낮은 해상도에서 부드럽게 섞기 (얼룩은 옅게)
  var gw = 120, gh = Math.round(120 * H / W), lc = mkC(gw, gh), lx = cx2(lc), id = lx.createImageData(gw, gh), d = id.data;
  for (var j = 0; j < gh; j++) for (var i = 0; i < gw; i++) {
    var v = (1 - j / gh) * VM + (N.fbm(i * 0.035, j * 0.035, 3) - 0.5) * 0.045, bi = bandAt(clamp(v, 0, VM - 0.001)), T = UI_BAND_COL[BANDS[bi][0]];
    var n = clamp((N.fbm(i * 0.05 + 3, j * 0.05, 3) - 0.32) * 2.2, 0, 1), c0 = hx(T[0]), c1 = hx(T[1]), c2 = hx(T[2]), cc;
    if (n < 0.5) { var t0 = n * 2; cc = [c0[0] + (c1[0] - c0[0]) * t0, c0[1] + (c1[1] - c0[1]) * t0, c0[2] + (c1[2] - c0[2]) * t0]; } else { var t1 = (n - 0.5) * 2; cc = [c1[0] + (c2[0] - c1[0]) * t1, c1[1] + (c2[1] - c1[1]) * t1, c1[2] + (c2[2] - c1[2]) * t1]; }
    var vb = BANDS[bi], edge = Math.min(v - vb[1], vb[2] - v);
    if (edge < 0.014) { var nb = v - vb[1] < vb[2] - v ? Math.max(0, bi - 1) : Math.min(BANDS.length - 1, bi + 1), q = hx(UI_BAND_COL[BANDS[nb][0]][1]), w = 0.5 - edge / 0.028; cc = [cc[0] + (q[0] - cc[0]) * w, cc[1] + (q[1] - cc[1]) * w, cc[2] + (q[2] - cc[2]) * w]; }
    var k = (j * gw + i) * 4; d[k] = cc[0]; d[k + 1] = cc[1]; d[k + 2] = cc[2]; d[k + 3] = 255;
  }
  lx.putImageData(id, 0, 0); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(lc, 0, 0, W, H);
  // 사탕 점무늬 (밝은 동그라미)
  for (var p0 = 0; p0 < W * H / (1600 * D * D); p0++) { var dx0 = rnd() * W, dy0 = rnd() * H; x.fillStyle = 'rgba(255,255,255,' + (0.12 + rnd() * 0.16) + ')'; x.beginPath(); x.arc(dx0, dy0, (1.5 + rnd() * 2.5) * D, 0, Math.PI * 2); x.fill(); }
  // 길, 강 좌표 (소품 피하기용)
  var roadPts = [], riverPts = [], lavaPts = [];
  function bz(a, b, cc0, dd, t) { var s = 1 - t; return s * s * s * a + 3 * s * s * t * b + 3 * s * t * t * cc0 + t * t * t * dd; }
  NODES.forEach(function (nd, i) {
    var X = nd[0] * W, Yn = Y(nd[1]);
    if (!i) { for (var t = 0; t <= 1; t += 0.1) roadPts.push([X, Yn + 60 * D * (1 - t)]); return; }
    var pv = NODES[i - 1], mY = Y((pv[1] + nd[1]) / 2);
    for (var t2 = 0; t2 <= 1; t2 += 0.02) roadPts.push([bz(pv[0] * W, pv[0] * W, X, X, t2), bz(Y(pv[1]), mY, mY, Yn, t2)]);
  });
  for (var t3 = 0; t3 <= 1; t3 += 0.01) riverPts.push([W * (0.86 - t3 * 0.52 + Math.sin(t3 * 9) * 0.06), Y(-0.03 + t3 * 0.41)]);
  for (var t4 = 0; t4 <= 1; t4 += 0.01) lavaPts.push([W * (0.1 + t4 * 0.85), Y(0.82 + t4 * 0.07) + Math.sin(t4 * 14) * 8 * D]);
  // 2부: 1부와 2부 사이 무지개 다리(구름 띠 위로)
  var rbPts = [];
  if (VM > 1) for (var t5 = 0; t5 <= 1; t5 += 0.02) rbPts.push([W * (-0.05 + t5 * 1.1), Y(0.985 + Math.sin(t5 * Math.PI) * 0.035)]);
  function line(pts) { x.beginPath(); pts.forEach(function (q, i) { if (!i) x.moveTo(q[0], q[1]); else x.lineTo(q[0], q[1]); }); x.stroke(); }
  // 강: 흰 둑, 하늘색 물, 반짝이는 물결
  x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 19 * D; line(riverPts);
  x.strokeStyle = '#8fd4ff'; x.lineWidth = 13 * D; line(riverPts);
  x.strokeStyle = '#bfeaff'; x.lineWidth = 6 * D; line(riverPts);
  x.save(); x.setLineDash([3 * D, 16 * D]); x.strokeStyle = '#ffffff'; x.lineWidth = 2.5 * D; line(riverPts); x.restore();
  // 용암 줄기: 산호빛 테두리, 노란 속
  x.strokeStyle = 'rgba(255,190,160,0.7)'; x.lineWidth = 12 * D; line(lavaPts);
  x.strokeStyle = '#ff8f6a'; x.lineWidth = 7 * D; line(lavaPts);
  x.strokeStyle = '#ffd36a'; x.lineWidth = 2.5 * D; line(lavaPts);
  if (rbPts.length) {
    // 별빛 하늘 구역은 밤하늘처럼 작은 별을 많이
    BANDS.forEach(function (b) { if (b[0] !== 'star') return; var y0 = Y(b[2]), y1 = Y(b[1]); for (var k = 0; k < (y1 - y0) / (7 * D); k++) { x.fillStyle = 'rgba(255,255,255,' + (0.35 + rnd() * 0.5) + ')'; x.beginPath(); x.arc(rnd() * W, y0 + rnd() * (y1 - y0), (0.8 + rnd() * 1.6) * D, 0, Math.PI * 2); x.fill(); } });
    ['#ff9cc8', '#ffc48a', '#ffe27a', '#8fe3c7', '#8fd0ff', '#c3a8ff'].forEach(function (col, k) { x.strokeStyle = rgba(col, 0.85); x.lineWidth = 6 * D; x.save(); x.translate(0, (k - 2.5) * 5.5 * D); line(rbPts); x.restore(); });
  }
  // 소품 자리 고르기: 노드, 길, 강, 지역 이름표를 피함
  function near(pts, X, Y, r) { for (var i = 0; i < pts.length; i++) { var a = pts[i][0] - X, b = pts[i][1] - Y; if (a * a + b * b < r * r) return true; } return false; }
  var labels = BANDS.filter(function (b) { return !b[4]; }).map(function (b) { return Y(b[2]) + (VM > 1 && Math.abs(b[2] - 1) < 0.001 ? 64 : 14) * D; });
  function blocked(X, Yp, S) {
    if (NODES.some(function (nd) { var dx = nd[0] * W - X, dy = Yp - Y(nd[1]); return Math.abs(dx) < 62 * D && dy > -48 * D && dy < 64 * D + S * 0.2; })) return true;
    if (labels.some(function (ly) { return X < 140 * D && Yp > ly - 8 * D && Yp < ly + 52 * D; })) return true;
    if (VM > 1 && Math.abs(Yp - Y(1.0)) < 40 * D) return true;   // 2부 이름표, 무지개 다리
    return near(roadPts, X, Yp, 22 * D + S * 0.25) || near(riverPts, X, Yp, 16 * D + S * 0.25) || near(lavaPts, X, Yp, 12 * D + S * 0.2);
  }
  var items = [], S0 = 30 * D;
  for (var p = 0; p < 300 * VM; p++) {
    var uu = rnd(), vv = rnd() * VM, S = S0 * (0.75 + rnd() * 0.55), X = uu * W, Yq = Y(vv);
    if (blocked(X, Yq, S)) continue;
    items.push({ X: X, Y: Yq, S: S, th: BANDS[bandAt(vv)][0], r: rnd(), r2: rnd() });
  }
  items.sort(function (a, b) { return a.Y - b.Y; });
  var FL = ['#ffffff', '#ffb3d4', '#fff3a0', '#d6c6ff'];
  items.forEach(function (it) {
    var X = it.X, Y = it.Y, S = it.S, r = it.r, th = it.th;
    if (th === 'meadow') { if (r < 0.42) uiTree(x, X, Y, S, ['#7fd67a', '#8fdc7a', '#6fcf86'][Math.floor(it.r2 * 3)], it.r2 < 0.4 ? '#ff8fbf' : it.r2 < 0.6 ? '#ffd84d' : null); else if (r < 0.7) uiBush(x, X, Y, S * 0.9, '#8fdc7a'); else if (r < 0.9) { for (var f = 0; f < 4; f++) uiFlower(x, X + (f - 1.5) * S * 0.22, Y - (f % 2) * S * 0.14, S * 0.09, FL[(f + Math.floor(it.r2 * 4)) % 4]); } else uiRock(x, X, Y, S * 0.7, '#e3dcf2'); }
    else if (th === 'forest') { if (r < 0.45) uiPine(x, X, Y, S * 1.1, '#5fcf95'); else if (r < 0.75) uiTree(x, X, Y, S, '#6fd3a0', it.r2 < 0.3 ? '#ffb3d4' : null); else if (r < 0.9) uiMush(x, X, Y, S * 0.8, '#ff8fb0'); else uiBush(x, X, Y, S * 0.9, '#79d6a2'); }
    else if (th === 'deepforest') { if (r < 0.5) uiTree(x, X, Y, S, '#b39cf5', it.r2 < 0.4 ? '#ffd6e8' : null); else if (r < 0.8) uiMush(x, X, Y, S * 0.85, '#c38cf0'); else uiCrystal(x, X, Y, S * 0.8, '#9f8cf0'); }
    else if (th === 'canyon') { if (r < 0.4) uiMesa(x, X, Y, S * 1.1); else if (r < 0.75) uiCactus(x, X, Y, S * 0.85); else uiRock(x, X, Y, S * 0.75, '#ffc39e'); }
    else if (th === 'snow') { if (r < 0.55) uiPine(x, X, Y, S * 1.1, '#7fd8c4', true); else if (r < 0.75) uiSnowman(x, X, Y, S * 0.9); else uiRock(x, X, Y, S * 0.75, '#f4f9ff'); }
    else if (th === 'ruins') { if (r < 0.45) uiPillar(x, X, Y, S, '#cdbfe8'); else if (r < 0.75) uiRock(x, X, Y, S * 0.8, '#d8cdee'); else uiTree(x, X, Y, S * 0.9, '#e7a8c8'); }
    else if (th === 'volcano') { if (r < 0.45) uiVolcano(x, X, Y, S * 1.1); else uiRock(x, X, Y, S * 0.8, '#d99aa6'); }
    else if (th === 'cloud') { if (r < 0.4) uiCloud(x, X, Y - S * 0.25, S * 1.5, 0.95); else if (r < 0.7) uiTree(x, X, Y, S, '#9fc6ff', it.r2 < 0.5 ? '#ffffff' : '#fff3a0'); else if (r < 0.85) uiStarProp(x, X, Y, S * 0.9); else uiRock(x, X, Y, S * 0.7, '#e6f1ff'); }
    else if (th === 'candy') { if (r < 0.4) uiLolly(x, X, Y, S, ['#ff6fa8', '#ffd84d', '#7fd0ff', '#b48cff'][Math.floor(it.r2 * 4)]); else if (r < 0.7) uiCane(x, X, Y, S * 0.9); else if (r < 0.88) uiMush(x, X, Y, S * 0.8, '#ff86b8'); else uiBush(x, X, Y, S * 0.9, '#ff9fca'); }
    else if (th === 'star') { if (r < 0.4) uiStarProp(x, X, Y, S); else if (r < 0.75) uiCrystal(x, X, Y, S * 0.9, '#c9b3ff'); else uiPine(x, X, Y, S, '#9d8ce6'); }
    else if (th === 'aurora') { if (r < 0.45) uiPine(x, X, Y, S * 1.1, '#5fcfb0', true); else if (r < 0.75) uiCrystal(x, X, Y, S * 0.85, '#8fe3c7'); else uiSnowman(x, X, Y, S * 0.85); }
    else { if (r < 0.55) uiCrystal(x, X, Y, S, '#b48cff'); else if (r < 0.8) uiPillar(x, X, Y, S, '#9f8ad6'); else uiRock(x, X, Y, S * 0.8, '#b3a2e0'); }
  });
  // 길: 그림자, 크림빛 길, 분홍 점선
  function road() { x.beginPath(); NODES.forEach(function (nd, i) { var X = nd[0] * W, Yn = Y(nd[1]); if (!i) { x.moveTo(X, Yn + 60 * D); x.lineTo(X, Yn); } else { var pv = NODES[i - 1], mY = Y((pv[1] + nd[1]) / 2); x.bezierCurveTo(pv[0] * W, mY, X, mY, X, Yn); } }); x.stroke(); }
  x.save(); x.translate(0, 3 * D); x.strokeStyle = 'rgba(120,70,130,0.16)'; x.lineWidth = 17 * D; road(); x.restore();
  x.strokeStyle = '#ffffff'; x.lineWidth = 16 * D; road();
  x.strokeStyle = '#fff3dc'; x.lineWidth = 11 * D; road();
  x.save(); x.setLineDash([0.1, 13 * D]); x.strokeStyle = '#ff9cc8'; x.lineWidth = 5.5 * D; road(); x.restore();
  // 지역 경계의 오른쪽 구름, 반짝이
  [0.235, 0.475, 0.565, 0.73, 0.9].forEach(function (b, i) { uiCloud(x, W * (0.97 - (i % 2) * 0.02), Y(b), 120 * D, 0.92); });
  [0.12, 0.42, 0.65, 0.86].forEach(function (b) { uiCloud(x, W * 0.02, Y(b), 100 * D, 0.85); });
  // 2부: 1부와 2부 사이 구름 띠, 2부 구역 경계 구름
  if (VM > 1) {
    for (var cq = 0; cq < 7; cq++) uiCloud(x, W * (cq / 6) + (cq % 2 ? 10 : -6) * D, Y(1.0) + (cq % 2 ? 22 : 30) * D, (110 + (cq % 3) * 20) * D, 0.96);
    BANDS.forEach(function (b, i) { if (b[1] > 1.01) uiCloud(x, W * (i % 2 ? 0.03 : 0.97), Y(b[1]), 110 * D, 0.9); });
  }
  for (var s2 = 0; s2 < H / (90 * D); s2++) { var sx2 = rnd() * W, sy2 = rnd() * H; if (blocked(sx2, sy2, 0)) continue; uiSpark(x, sx2, sy2, (3 + rnd() * 4) * D, rnd() < 0.6 ? '#ffffff' : '#fff3a0', 0.55 + rnd() * 0.4); }
  // 맨 아래는 지도 밑 여유 칸 색으로 스며들게
  var bf = x.createLinearGradient(0, H - 44 * D, 0, H); bf.addColorStop(0, 'rgba(178,234,149,0)'); bf.addColorStop(1, 'rgba(178,234,149,1)'); x.fillStyle = bf; x.fillRect(0, H - 44 * D, W, 44 * D);
  // 양쪽 가장자리 옅은 라일락
  var vg = x.createLinearGradient(0, 0, W, 0); vg.addColorStop(0, 'rgba(170,140,220,0.16)'); vg.addColorStop(0.14, 'rgba(170,140,220,0)'); vg.addColorStop(0.86, 'rgba(170,140,220,0)'); vg.addColorStop(1, 'rgba(170,140,220,0.16)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
}

// ---------- 2부 소품: 막대사탕, 지팡이 사탕, 별 막대 ----------
function uiLolly(x, X, Y, S, col) {
  uiShadow(x, X, Y, S * 0.22, S * 0.06);
  uiCandy(x, uiRR(X - S * 0.035, Y - S * 0.55, S * 0.07, S * 0.55, S * 0.035), Y - S * 0.55, Y, ['#ffffff', '#f2e6ef'], '#c9a8bf', S * 0.02);
  var cy = Y - S * 0.72, r = S * 0.26;
  uiCandy(x, uiCircle(X, cy, r), cy - r, cy + r, [lit(col, 0.5), col], drk(col, 0.3), S * 0.03);
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = S * 0.06; x.beginPath();
  for (var a = 0; a < Math.PI * 4.2; a += 0.2) { var rr = r * 0.85 * a / (Math.PI * 4.2); if (!a) x.moveTo(X, cy); else x.lineTo(X + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  x.stroke(); x.restore();
  uiGloss(x, X - r * 0.4, cy - r * 0.45, r * 0.25, r * 0.13, -0.6, 0.7);
}
function uiCane(x, X, Y, S) {
  uiShadow(x, X, Y, S * 0.18, S * 0.05);
  var p = new Path2D(); p.moveTo(X, Y); p.lineTo(X, Y - S * 0.62); p.arc(X + S * 0.14, Y - S * 0.62, S * 0.14, Math.PI, 0); p.lineTo(X + S * 0.28, Y - S * 0.52);
  x.save(); x.lineCap = 'round'; x.strokeStyle = '#c2306a'; x.lineWidth = S * 0.15; x.stroke(p); x.strokeStyle = '#ffffff'; x.lineWidth = S * 0.1; x.stroke(p);
  x.setLineDash([S * 0.07, S * 0.07]); x.strokeStyle = '#ff5c8a'; x.lineWidth = S * 0.1; x.stroke(p); x.restore();
}
function uiStarProp(x, X, Y, S) {
  uiShadow(x, X, Y, S * 0.2, S * 0.05);
  uiCandy(x, uiRR(X - S * 0.03, Y - S * 0.5, S * 0.06, S * 0.5, S * 0.03), Y - S * 0.5, Y, ['#fff6d8', '#e9c98a'], '#b08a4a', S * 0.02);
  uiCandy(x, uiStarPath(X, Y - S * 0.62, S * 0.24, S * 0.11, 5), Y - S * 0.86, Y - S * 0.4, ['#fff7c4', '#ffd23a', '#ffaa00'], '#de8500', S * 0.03);
  uiSpark(x, X + S * 0.26, Y - S * 0.82, S * 0.08, '#ffffff');
}
