// ===== art_fx.js : 투사체 그림, 입자, 주변 날씨 (귀염판: 사탕 색 별, 하트, 뭉게구름, 꽃잎) =====
var FX_SPR = {};
// 사탕 색 기준 (검정 대신 자두색 테두리)
var FXC = { pink: '#ff8fc0', hot: '#ff5d9e', peach: '#ffb38a', lemon: '#ffe066', mint: '#7fe0c4', sky: '#7cc8ff', lav: '#b9a2ff', grape: '#8a6cff', cream: '#fff6e8', plum: '#4a2a5a' };
var FX_CANDY = ['#ff8fc0', '#ffe066', '#7fe0c4', '#7cc8ff', '#b9a2ff', '#ffb38a', '#ff5d9e'];
var FX_RAIN = ['#ff8fc0', '#ffb38a', '#ffe066', '#7fe0c4', '#7cc8ff', '#b9a2ff'];
function fxPick(a) { return a[(Math.random() * a.length) | 0]; }
function fxOl(col) { return mixc(col, '#4a2a5a', 0.62); }
function fxRR(x, x0, y0, w, h, r) { r = Math.min(r, w / 2, h / 2); x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); }
function fxStarPath(x, cx, cy, R, r, n, rot) { x.beginPath(); for (var i = 0; i < n * 2; i++) { var a = rot + i * Math.PI / n, q = i % 2 ? r : R; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); }
function fxHeartPath(x, cx, cy, s) {
  x.beginPath(); x.moveTo(cx, cy + s * 0.92);
  x.bezierCurveTo(cx - s * 1.3, cy + s * 0.02, cx - s * 0.98, cy - s * 1.0, cx, cy - s * 0.4);
  x.bezierCurveTo(cx + s * 0.98, cy - s * 1.0, cx + s * 1.3, cy + s * 0.02, cx, cy + s * 0.92);
  x.closePath();
}
// 4갈래 반짝이(오목한 마름모)
function fxTwPath(x, cx, cy, R, w) { x.beginPath(); x.moveTo(cx, cy - R); x.quadraticCurveTo(cx + w, cy - w, cx + R, cy); x.quadraticCurveTo(cx + w, cy + w, cx, cy + R); x.quadraticCurveTo(cx - w, cy + w, cx - R, cy); x.quadraticCurveTo(cx - w, cy - w, cx, cy - R); x.closePath(); }
// 아래가 둥글고 위가 뾰족한 불꽃, 물방울
function fxFlamePath(x, cx, cy, r, h) { x.beginPath(); x.moveTo(cx, cy - h); x.bezierCurveTo(cx + r * 0.5, cy - h * 0.5, cx + r, cy - r * 0.3, cx + r, cy + r * 0.2); x.arc(cx, cy + r * 0.2, r, 0, Math.PI, false); x.bezierCurveTo(cx - r, cy - r * 0.3, cx - r * 0.5, cy - h * 0.5, cx, cy - h); x.closePath(); }
function fxShine(x, cx, cy, r, a) { x.globalAlpha = a == null ? 0.9 : a; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(cx, cy, r, r * 0.55, -0.7, 0, 6.2832); x.fill(); x.globalAlpha = 1; }

// ---------- 모양 스프라이트: 가운데 기준 정사각형, 크기 칸 24/48/96/176 중 쓰일 지름보다 큰 것 ----------
var FX_IMG = {};
function fxBk(d) { return d <= 26 ? 24 : d <= 52 ? 48 : d <= 104 ? 96 : 176; }
function fxImg(kind, col, d) {
  if (typeof col !== 'string' || col.charAt(0) !== '#') col = '#ffffff';
  var b = fxBk(d), key = kind + col + b, c = FX_IMG[key]; if (c) return c;
  c = mkC(b, b); var x = cx2(c), m = b / 2, ol = fxOl(col), lw = Math.max(1.2, b * 0.075), i, a;
  x.lineJoin = 'round'; x.lineCap = 'round';
  if (kind === 'star') {
    fxStarPath(x, m, m + b * 0.03, b * 0.41, b * 0.21, 5, -Math.PI / 2);
    x.strokeStyle = ol; x.lineWidth = lw * 1.5; x.stroke(); x.fillStyle = col; x.fill();
    x.strokeStyle = col; x.lineWidth = lw * 0.5; x.stroke();
    fxStarPath(x, m - b * 0.02, m - b * 0.005, b * 0.24, b * 0.12, 5, -Math.PI / 2); x.fillStyle = lit(col, 0.5); x.fill();
    fxShine(x, m - b * 0.1, m - b * 0.12, b * 0.07);
  } else if (kind === 'heart' || kind === 'heartL' || kind === 'heartR') {
    if (kind !== 'heart') {
      // 깨진 하트 반쪽: 지그재그 금으로 자름
      var zz = [[m + b * 0.02, b * 0.12], [m - b * 0.07, b * 0.34], [m + b * 0.07, b * 0.52], [m - b * 0.05, b * 0.7], [m + b * 0.01, b]];
      x.save(); x.beginPath(); var ex = kind === 'heartL' ? 0 : b; x.moveTo(ex, 0); x.lineTo(m + b * 0.02, 0); for (i = 0; i < zz.length; i++) x.lineTo(zz[i][0], zz[i][1]); x.lineTo(ex, b); x.closePath(); x.clip();
    }
    fxHeartPath(x, m, m + b * 0.04, b * 0.36); x.strokeStyle = ol; x.lineWidth = lw * 1.5; x.stroke(); x.fillStyle = col; x.fill();
    fxHeartPath(x, m - b * 0.05, m - b * 0.02, b * 0.17); x.fillStyle = lit(col, 0.42); x.fill();
    fxShine(x, m - b * 0.17, m - b * 0.1, b * 0.06);
    if (kind !== 'heart') x.restore();
  } else if (kind === 'twk') {
    var g = x.createRadialGradient(m, m, 0, m, m, m); g.addColorStop(0, rgba(col, 0.6)); g.addColorStop(0.3, rgba(col, 0.25)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, b, b);
    fxTwPath(x, m, m, b * 0.48, b * 0.07); x.fillStyle = col; x.fill();
    fxTwPath(x, m, m, b * 0.3, b * 0.045); x.fillStyle = '#ffffff'; x.fill();
  } else if (kind === 'dot') {
    var gd = x.createRadialGradient(m, m, 0, m, m, m * 0.9); gd.addColorStop(0, '#ffffff'); gd.addColorStop(0.5, rgba(col, 0.95)); gd.addColorStop(1, rgba(col, 0));
    x.fillStyle = gd; x.fillRect(0, 0, b, b);
  } else if (kind === 'puff') {
    // 솜구름: 오른쪽 아래 옅은 보랏빛 그늘, 왼쪽 위 흰 반짝, 얇은 테두리
    var r = b * 0.42, shc = mixc(col, '#a890c8', 0.36);
    x.beginPath(); x.arc(m, m, r, 0, 6.2832); x.fillStyle = shc; x.fill(); x.strokeStyle = rgba(mixc(col, '#6a4a88', 0.6), 0.5); x.lineWidth = Math.max(1, b * 0.035); x.stroke();
    x.save(); x.beginPath(); x.arc(m, m, r, 0, 6.2832); x.clip(); x.beginPath(); x.arc(m - r * 0.17, m - r * 0.22, r * 0.9, 0, 6.2832); x.fillStyle = col; x.fill(); x.restore();
    x.globalAlpha = 0.95; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(m - r * 0.36, m - r * 0.42, r * 0.27, r * 0.16, -0.6, 0, 6.2832); x.fill(); x.globalAlpha = 1;
  } else if (kind === 'pop') {
    // 만화 충격 모양: 흰 바탕에 색 테두리
    fxStarPath(x, m, m, b * 0.47, b * 0.32, 8, 0.2); x.fillStyle = col; x.fill();
    fxStarPath(x, m, m, b * 0.37, b * 0.25, 8, 0.2); x.fillStyle = '#ffffff'; x.fill();
  } else if (kind === 'flake') {
    x.translate(m, m);
    for (var pass = 0; pass < 2; pass++) {
      x.strokeStyle = pass ? '#ffffff' : col; x.lineWidth = Math.max(1, pass ? b * 0.05 : b * 0.12);
      for (i = 0; i < 6; i++) {
        a = i * Math.PI / 3; var ca = Math.cos(a), sa = Math.sin(a), R = b * 0.38, bx = ca * R * 0.58, by = sa * R * 0.58, br = R * 0.3;
        x.beginPath(); x.moveTo(0, 0); x.lineTo(ca * R, sa * R);
        x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + 0.8) * br, by + Math.sin(a + 0.8) * br);
        x.moveTo(bx, by); x.lineTo(bx + Math.cos(a - 0.8) * br, by + Math.sin(a - 0.8) * br); x.stroke();
      }
    }
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, b * 0.08, 0, 6.2832); x.fill();
  } else if (kind === 'flame') {
    fxFlamePath(x, m, m + b * 0.13, b * 0.3, b * 0.45); x.strokeStyle = rgba(mixc(col, '#4a2a5a', 0.35), 0.8); x.lineWidth = lw; x.stroke(); x.fillStyle = col; x.fill();
    fxFlamePath(x, m, m + b * 0.2, b * 0.19, b * 0.27); x.fillStyle = '#ffe066'; x.fill();
    fxFlamePath(x, m, m + b * 0.26, b * 0.1, b * 0.12); x.fillStyle = '#fffbe8'; x.fill();
  } else if (kind === 'flameS') {
    // 화염탑 불길용 부드러운 불꽃: 테두리 없이 가장자리가 옅어 겹치면 하나로 이어짐
    x.globalAlpha = 0.55; fxFlamePath(x, m, m + b * 0.12, b * 0.33, b * 0.47); x.fillStyle = col; x.fill();
    x.globalAlpha = 0.9; fxFlamePath(x, m, m + b * 0.15, b * 0.25, b * 0.36); x.fillStyle = col; x.fill();
    x.globalAlpha = 1; fxFlamePath(x, m, m + b * 0.2, b * 0.16, b * 0.24); x.fillStyle = '#ffe066'; x.fill();
    fxFlamePath(x, m, m + b * 0.25, b * 0.08, b * 0.11); x.fillStyle = '#fffbe8'; x.fill();
  } else if (kind === 'fireB') {
    // 불길 덩이: 가운데 크림, 레몬, 바깥 사탕 색으로 번지는 둥근 불빛 (테두리 없음)
    var gf = x.createRadialGradient(m, m, 0, m, m, b * 0.47);
    gf.addColorStop(0, '#fffbe8'); gf.addColorStop(0.3, '#ffe066'); gf.addColorStop(0.62, col); gf.addColorStop(0.85, rgba(col, 0.55)); gf.addColorStop(1, rgba(col, 0));
    x.fillStyle = gf; x.fillRect(0, 0, b, b);
  } else if (kind === 'bubble') {
    var r3 = b * 0.42; x.fillStyle = rgba(col, 0.2); x.beginPath(); x.arc(m, m, r3, 0, 6.2832); x.fill();
    x.strokeStyle = rgba(col, 0.95); x.lineWidth = Math.max(1, b * 0.065); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = Math.max(1, b * 0.06); x.beginPath(); x.arc(m, m, r3 * 0.66, 3.5, 4.6); x.stroke();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(m + r3 * 0.38, m + r3 * 0.34, Math.max(0.8, b * 0.045), 0, 6.2832); x.fill();
  } else if (kind === 'drop') {
    var r4 = b * 0.36, g4 = x.createRadialGradient(m - r4 * 0.3, m - r4 * 0.35, r4 * 0.1, m, m, r4);
    g4.addColorStop(0, lit(col, 0.6)); g4.addColorStop(0.6, col); g4.addColorStop(1, mixc(col, '#4a2a5a', 0.22));
    x.beginPath(); x.arc(m, m, r4, 0, 6.2832); x.strokeStyle = ol; x.lineWidth = lw * 1.4; x.stroke(); x.fillStyle = g4; x.fill();
    fxShine(x, m - r4 * 0.35, m - r4 * 0.38, r4 * 0.3);
  } else if (kind === 'conf') {
    var cw = b * 0.8, ch = b * 0.46;
    fxRR(x, m - cw / 2, m - ch / 2, cw, ch, ch * 0.3); x.fillStyle = mixc(col, '#4a2a5a', 0.28); x.fill();
    fxRR(x, m - cw / 2, m - ch / 2, cw, ch * 0.76, ch * 0.3); x.fillStyle = col; x.fill();
    x.fillStyle = 'rgba(255,255,255,0.6)'; x.fillRect(m - cw * 0.34, m - ch * 0.36, cw * 0.68, ch * 0.16);
  } else if (kind === 'petal') {
    var R5 = b * 0.42; x.beginPath(); x.moveTo(m, m + R5);
    x.bezierCurveTo(m - R5 * 0.95, m + R5 * 0.25, m - R5 * 0.7, m - R5 * 0.85, m - R5 * 0.16, m - R5 * 0.9);
    x.lineTo(m, m - R5 * 0.6); x.lineTo(m + R5 * 0.16, m - R5 * 0.9);
    x.bezierCurveTo(m + R5 * 0.7, m - R5 * 0.85, m + R5 * 0.95, m + R5 * 0.25, m, m + R5); x.closePath();
    var g5 = x.createLinearGradient(m, m + R5, m, m - R5); g5.addColorStop(0, lit(col, 0.75)); g5.addColorStop(1, col);
    x.fillStyle = g5; x.fill(); x.strokeStyle = rgba(mixc(col, '#4a2a5a', 0.35), 0.55); x.lineWidth = Math.max(1, b * 0.04); x.stroke();
  } else if (kind === 'leaf') {
    var R6 = b * 0.44; x.beginPath(); x.moveTo(m - R6, m + R6 * 0.1); x.quadraticCurveTo(m - R6 * 0.1, m - R6 * 0.85, m + R6, m - R6 * 0.1); x.quadraticCurveTo(m + R6 * 0.1, m + R6 * 0.85, m - R6, m + R6 * 0.1); x.closePath();
    x.fillStyle = col; x.fill(); x.strokeStyle = rgba(fxOl(col), 0.55); x.lineWidth = Math.max(1, b * 0.045); x.stroke();
    x.strokeStyle = rgba(lit(col, 0.65), 0.95); x.lineWidth = Math.max(1, b * 0.04); x.beginPath(); x.moveTo(m - R6 * 0.75, m + R6 * 0.07); x.lineTo(m + R6 * 0.7, m - R6 * 0.08); x.stroke();
  } else if (kind === 'seed') {
    // 민들레 씨: 솜털 우산, 가는 줄기, 씨
    var hy = m - b * 0.08; x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = Math.max(1, b * 0.03);
    x.beginPath(); x.moveTo(m, m + b * 0.36); x.lineTo(m, hy); x.stroke();
    x.fillStyle = '#ffffff';
    for (i = 0; i < 9; i++) { a = -Math.PI / 2 + (i - 4) * 0.34; var ex2 = m + Math.cos(a) * b * 0.36, ey2 = hy + Math.sin(a) * b * 0.36; x.beginPath(); x.moveTo(m, hy); x.lineTo(ex2, ey2); x.stroke(); x.beginPath(); x.arc(ex2, ey2, Math.max(0.8, b * 0.035), 0, 6.2832); x.fill(); }
    x.fillStyle = col; x.beginPath(); x.ellipse(m, m + b * 0.38, b * 0.035, b * 0.06, 0, 0, 6.2832); x.fill();
  } else if (kind === 'mark') {
    // 땅에 남는 꽃 모양 자국
    for (i = 0; i < 6; i++) { a = i * Math.PI / 3; x.fillStyle = rgba(col, 0.55); x.beginPath(); x.arc(m + Math.cos(a) * b * 0.23, m + Math.sin(a) * b * 0.23, b * 0.17, 0, 6.2832); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.arc(m, m, b * 0.13, 0, 6.2832); x.fill();
  } else if (kind === 'candy') {
    // 양쪽을 비튼 포장 사탕 (대포, 투석 사탕 폭죽)
    var cr2 = b * 0.2;
    for (i = -1; i <= 1; i += 2) { x.beginPath(); x.moveTo(m + i * cr2 * 0.6, m); x.lineTo(m + i * b * 0.46, m - b * 0.19); x.quadraticCurveTo(m + i * b * 0.38, m, m + i * b * 0.46, m + b * 0.19); x.closePath(); x.strokeStyle = ol; x.lineWidth = lw * 1.3; x.stroke(); x.fillStyle = lit(col, 0.45); x.fill(); }
    x.beginPath(); x.arc(m, m, cr2, 0, 6.2832); x.strokeStyle = ol; x.lineWidth = lw * 1.5; x.stroke(); x.fillStyle = col; x.fill();
    x.save(); x.beginPath(); x.arc(m, m, cr2, 0, 6.2832); x.clip(); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = Math.max(1, b * 0.05);
    for (i = 0; i < 3; i++) { x.beginPath(); x.arc(m + cr2 * 0.1, m, cr2 * (0.35 + i * 0.32), 0.6 + i * 1.4, 2.9 + i * 1.4); x.stroke(); }
    x.restore();
    fxShine(x, m - cr2 * 0.42, m - cr2 * 0.45, cr2 * 0.3);
  } else if (kind === 'flower') {
    // 다섯 잎 꽃 (화염 꽃불)
    var pr = b * 0.16, pd = b * 0.22;
    for (i = 0; i < 5; i++) { a = -Math.PI / 2 + i * 1.2566; x.beginPath(); x.arc(m + Math.cos(a) * pd, m + Math.sin(a) * pd, pr + lw * 0.9, 0, 6.2832); x.fillStyle = ol; x.fill(); }
    for (i = 0; i < 5; i++) { a = -Math.PI / 2 + i * 1.2566; x.beginPath(); x.arc(m + Math.cos(a) * pd, m + Math.sin(a) * pd, pr, 0, 6.2832); x.fillStyle = col; x.fill(); x.fillStyle = lit(col, 0.55); x.beginPath(); x.arc(m + Math.cos(a) * pd * 1.1 - pr * 0.2, m + Math.sin(a) * pd * 1.1 - pr * 0.25, pr * 0.4, 0, 6.2832); x.fill(); }
    x.beginPath(); x.arc(m, m, b * 0.13, 0, 6.2832); x.fillStyle = ol; x.fill(); x.beginPath(); x.arc(m, m, b * 0.11, 0, 6.2832); x.fillStyle = '#fff3a0'; x.fill();
    fxShine(x, m - b * 0.04, m - b * 0.04, b * 0.035);
  }
  return (FX_IMG[key] = c);
}
// 기둥 빛(강화): 세로 그라데이션을 미리 그려 둠
var FX_PIL = {};
function fxPillarSpr(col) {
  if (FX_PIL[col]) return FX_PIL[col];
  var c = mkC(48, 256), x = cx2(c), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, 0.5)); g.addColorStop(1, rgba(col, 0.95));
  x.fillStyle = g; x.fillRect(0, 0, 48, 256);
  var w = x.createLinearGradient(0, 0, 0, 256); w.addColorStop(0, 'rgba(255,255,255,0)'); w.addColorStop(1, 'rgba(255,255,255,0.95)');
  x.fillStyle = w; x.fillRect(19, 20, 10, 236);
  x.globalCompositeOperation = 'destination-in'; var h = x.createLinearGradient(0, 0, 48, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.3, 'rgba(0,0,0,1)'); h.addColorStop(0.7, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = h; x.fillRect(0, 0, 48, 256);
  return (FX_PIL[col] = c);
}
// 화면 가장자리 분홍 테두리(성이 맞을 때, 목숨이 적을 때)
var FX_VIG = {};
function fxVig(col) {
  if (FX_VIG[col]) return FX_VIG[col];
  var c = mkC(90, 160), x = cx2(c); x.translate(45, 80); x.scale(1, 160 / 90);
  var g = x.createRadialGradient(0, 0, 26, 0, 0, 62); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.55, rgba(col, 0.35)); g.addColorStop(1, rgba(col, 1));
  x.fillStyle = g; x.fillRect(-45, -45, 90, 90);
  return (FX_VIG[col] = c);
}

// ---------- 투사체 그림 ----------
// 사탕 화살: [자루, 자루 무늬, 깃, 촉, 촉 모양]
var FX_ARW = { arrow: ['#f6ead2', '#c8352a', '#8a5a32', '#d7dbe0', 'tip'], arrowG: ['#fff3b0', '#e8a640', '#8a5a32', '#ffd23a', 'tip'], arrowS: ['#eef8ff', '#7cc8ff', '#6a7a8a', '#ffffff', 'tip'], arrowR: ['#ffe8d8', '#c8352a', '#6a3a24', '#e0533a', 'tip'] };   // v1.3: 하트, 별 촉 대신 쇠 화살촉
function fxArrow(S, kind) {
  var S1 = S * 1.25, long = kind === 'arrowS', L = S1 * (long ? 0.47 : 0.42), H = S1 * 0.17, m = H / 2, P = FX_ARW[kind], pad = 3;
  var c = mkC(L + pad * 2, H + pad * 2), x = cx2(c); x.translate(pad, pad); x.lineCap = 'round'; x.lineJoin = 'round';
  var x0 = S1 * 0.05, x1 = L - S1 * 0.08, sw = Math.max(1.6, S1 * 0.026);
  // 자루와 사탕 줄무늬
  x.strokeStyle = P[0]; x.lineWidth = sw; x.beginPath(); x.moveTo(x0, m); x.lineTo(x1, m); x.stroke();
  x.strokeStyle = P[1]; x.lineWidth = Math.max(1, sw * 0.55);
  for (var i = 0; i < 4; i++) { var sx = x0 + (x1 - x0) * (0.24 + i * 0.17); x.beginPath(); x.moveTo(sx, m - sw * 0.42); x.lineTo(sx + sw * 0.7, m + sw * 0.42); x.stroke(); }
  // 깃 두 장
  var f0 = S1 * 0.012, f1 = S1 * 0.14, fh = S1 * 0.058;
  for (var s = -1; s <= 1; s += 2) {
    x.fillStyle = s < 0 ? P[2] : mixc(P[2], '#ffffff', 0.35);
    x.beginPath(); x.moveTo(f1, m); x.quadraticCurveTo(f0 + S1 * 0.06, m + s * fh * 1.15, f0, m + s * fh); x.quadraticCurveTo(f0 + S1 * 0.035, m + s * fh * 0.35, f0 + S1 * 0.025, m); x.closePath(); x.fill();
  }
  // 촉: 하트 또는 별
  x.fillStyle = P[3]; x.strokeStyle = fxOl(P[3] === '#ffffff' ? '#7cc8ff' : P[3]); x.lineWidth = Math.max(1, S1 * 0.01);
  if (P[4] === 'heart') { var hs = S1 * (kind === 'arrowR' ? 0.048 : 0.044); x.save(); x.translate(L - hs * 1.05, m); x.rotate(-Math.PI / 2); fxHeartPath(x, 0, 0, hs); x.fill(); x.stroke(); x.restore(); fxShine(x, L - hs * 1.25, m - hs * 0.45, hs * 0.28); }
  else if (P[4] === 'tip') { var tr = S1 * (long ? 0.06 : 0.052); x.beginPath(); x.moveTo(L + tr * 0.2, m); x.lineTo(L - tr * 1.5, m - tr * 0.75); x.lineTo(L - tr * 1.1, m); x.lineTo(L - tr * 1.5, m + tr * 0.75); x.closePath(); x.fill(); x.stroke(); }
  else { var sr = S1 * (long ? 0.062 : 0.054); fxStarPath(x, L - sr * 0.95, m, sr, sr * 0.5, 5, 0); x.fill(); x.stroke(); fxShine(x, L - sr * 1.1, m - sr * 0.3, sr * 0.25); }
  var o = outlineC(c, Math.max(1, S * 0.011), '#2a1810', 0.85);
  return spr(o, pad + L / 2, pad + m);
}
// 둥근 사탕 공(돌 대신): 바람개비 줄무늬가 돌고 반짝이는 따로 그림
function fxBall(S, r, cols) {
  var b = Math.ceil(r * 2 + 6), c = mkC(b, b), x = cx2(c), m = b / 2, n = cols.length > 2 ? cols.length : 6, st = 6.2832 / n;
  x.beginPath(); x.arc(m, m, r, 0, 6.2832); x.fillStyle = cols[0]; x.fill();
  x.save(); x.clip();
  for (var i = 0; i < n; i++) {
    if (cols.length <= 2 && i % 2 === 0) continue;
    var a0 = i * st, a1 = a0 + st * 0.9;
    x.fillStyle = cols.length > 2 ? cols[i] : cols[1]; x.beginPath(); x.moveTo(m, m);
    x.quadraticCurveTo(m + Math.cos(a0 + 0.8) * r * 0.75, m + Math.sin(a0 + 0.8) * r * 0.75, m + Math.cos(a0) * r * 1.3, m + Math.sin(a0) * r * 1.3);
    x.lineTo(m + Math.cos(a1) * r * 1.3, m + Math.sin(a1) * r * 1.3);
    x.quadraticCurveTo(m + Math.cos(a1 + 0.8) * r * 0.75, m + Math.sin(a1 + 0.8) * r * 0.75, m, m); x.fill();
  }
  var g = x.createRadialGradient(m, m, r * 0.45, m, m, r); g.addColorStop(0, 'rgba(74,42,90,0)'); g.addColorStop(1, 'rgba(74,42,90,0.32)');
  x.fillStyle = g; x.fillRect(0, 0, b, b); x.restore();
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(m, m, r * 0.16, 0, 6.2832); x.fill();
  x.strokeStyle = '#4a2a5a'; x.lineWidth = Math.max(1.2, r * 0.13); x.beginPath(); x.arc(m, m, r, 0, 6.2832); x.stroke();
  return spr(c, m, m);
}
function fxGloss(S, r) {
  var b = Math.ceil(r * 2 + 6), c = mkC(b, b), x = cx2(c), m = b / 2;
  x.globalAlpha = 0.85; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(m - r * 0.38, m - r * 0.42, r * 0.34, r * 0.18, -0.7, 0, 6.2832); x.fill();
  x.globalAlpha = 0.7; x.beginPath(); x.arc(m + r * 0.42, m + r * 0.4, r * 0.09, 0, 6.2832); x.fill();
  return spr(c, m, m);
}
// 물약 공: 둥근 유리병, 마개, 물약, 거품
function fxPotion(S, liq) {
  var r = S * 0.088, w = Math.ceil(r * 2.6 + 6), h = Math.ceil(r * 3.7 + 6), c = mkC(w, h), x = cx2(c), cx = w / 2, cy = h - r * 1.3 - 3;
  fxRR(x, cx - r * 0.3, cy - r * 1.7, r * 0.6, r * 0.9, r * 0.15); x.fillStyle = '#e8f6ff'; x.fill();
  fxRR(x, cx - r * 0.42, cy - r * 2.1, r * 0.84, r * 0.5, r * 0.22); x.fillStyle = '#ffb38a'; x.fill();
  x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.fillStyle = 'rgba(236,248,255,0.96)'; x.fill();
  x.save(); x.beginPath(); x.arc(cx, cy, r * 0.84, 0, 6.2832); x.clip();
  var g = x.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, lit(liq, 0.4)); g.addColorStop(1, mixc(liq, '#4a2a5a', 0.18));
  x.fillStyle = g; x.beginPath(); x.moveTo(cx - r, cy - r * 0.12); x.quadraticCurveTo(cx - r * 0.45, cy - r * 0.4, cx, cy - r * 0.12); x.quadraticCurveTo(cx + r * 0.45, cy + r * 0.14, cx + r, cy - r * 0.12); x.lineTo(cx + r, cy + r); x.lineTo(cx - r, cy + r); x.closePath(); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.85)';
  [[0.32, 0.38, 0.14], [-0.28, 0.52, 0.1], [0.04, 0.18, 0.08]].forEach(function (q) { x.beginPath(); x.arc(cx + q[0] * r, cy + q[1] * r, q[2] * r, 0, 6.2832); x.fill(); });
  x.restore();
  fxShine(x, cx - r * 0.45, cy - r * 0.48, r * 0.26);
  return spr(outlineC(c, Math.max(1, S * 0.012), '#4a2a5a', 0.9), cx, cy);
}
// 만화 폭탄: 둥근 몸, 눈, 발그레한 볼, 심지 (심지 끝 위치 fx, fy)
function fxBomb(S, body) {
  var r = S * 0.095, w = Math.ceil(r * 3.2 + 6), c = mkC(w, w), x = cx2(c), cx = w * 0.45, cy = w * 0.57;
  x.save(); x.translate(cx + r * 0.55, cy - r * 0.8); x.rotate(0.6); fxRR(x, -r * 0.3, -r * 0.22, r * 0.6, r * 0.44, r * 0.12); x.fillStyle = '#ffd23a'; x.fill(); x.restore();
  x.strokeStyle = '#ffe9c8'; x.lineWidth = Math.max(1, r * 0.17); x.lineCap = 'round'; x.beginPath(); x.moveTo(cx + r * 0.7, cy - r * 0.98); x.quadraticCurveTo(cx + r * 1.05, cy - r * 1.35, cx + r * 0.88, cy - r * 1.55); x.stroke();
  var g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); g.addColorStop(0, lit(body, 0.5)); g.addColorStop(0.55, body); g.addColorStop(1, mixc(body, '#2a1a3a', 0.35));
  x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.fillStyle = g; x.fill();
  x.fillStyle = '#fff6e8';
  x.beginPath(); x.ellipse(cx - r * 0.3, cy + r * 0.06, r * 0.12, r * 0.17, 0, 0, 6.2832); x.fill();
  x.beginPath(); x.ellipse(cx + r * 0.26, cy + r * 0.06, r * 0.12, r * 0.17, 0, 0, 6.2832); x.fill();
  x.fillStyle = 'rgba(255,143,192,0.8)';
  x.beginPath(); x.ellipse(cx - r * 0.58, cy + r * 0.34, r * 0.17, r * 0.1, 0, 0, 6.2832); x.fill();
  x.beginPath(); x.ellipse(cx + r * 0.52, cy + r * 0.34, r * 0.17, r * 0.1, 0, 0, 6.2832); x.fill();
  fxShine(x, cx - r * 0.42, cy - r * 0.52, r * 0.22);
  var s = spr(outlineC(c, Math.max(1, S * 0.012), '#4a2a5a', 0.95), cx, cy); s.fx = r * 0.88; s.fy = -r * 1.55; return s;
}
// 사탕 막대 노포 화살: 흰 자루에 사선 줄무늬, 둥근 다이아몬드 촉
var FX_BOLT = { bolt: ['#ff5d9e', '#7fe0c4', '#b9a2ff'], boltH: ['#ff9a6a', '#ffe066', '#ff8fc0'], boltF: ['#7cc8ff', '#ff8fc0', '#7fe0c4'] };
function fxBolt(S, kind) {
  var L = S * 0.82, H = S * 0.2, m = H / 2, pad = 3, P = FX_BOLT[kind], c = mkC(L + pad * 2, H + pad * 2), x = cx2(c); x.translate(pad, pad);
  var x0 = S * 0.07, x1 = S * 0.62, sw = S * 0.052;
  x.save(); fxRR(x, x0, m - sw / 2, x1 - x0, sw, sw / 2); x.fillStyle = '#fffaf2'; x.fill(); x.clip();
  x.fillStyle = P[0]; for (var sx = x0 - sw; sx < x1 + sw; sx += sw * 1.5) { x.beginPath(); x.moveTo(sx, m + sw); x.lineTo(sx + sw * 0.7, m + sw); x.lineTo(sx + sw * 1.4, m - sw); x.lineTo(sx + sw * 0.7, m - sw); x.closePath(); x.fill(); }
  x.restore();
  for (var s = -1; s <= 1; s += 2) { x.fillStyle = s < 0 ? P[2] : lit(P[2], 0.35); x.beginPath(); x.moveTo(S * 0.21, m); x.quadraticCurveTo(S * 0.08, m + s * S * 0.085, S * 0.01, m + s * S * 0.08); x.quadraticCurveTo(S * 0.06, m + s * S * 0.03, S * 0.05, m); x.closePath(); x.fill(); }
  var g = x.createLinearGradient(0, m - S * 0.08, 0, m + S * 0.08); g.addColorStop(0, lit(P[1], 0.45)); g.addColorStop(1, mixc(P[1], '#4a2a5a', 0.15));
  x.fillStyle = g; x.beginPath(); x.moveTo(L - S * 0.005, m); x.quadraticCurveTo(L - S * 0.08, m - S * 0.05, x1 - S * 0.03, m - S * 0.082); x.quadraticCurveTo(x1 + S * 0.03, m, x1 - S * 0.03, m + S * 0.082); x.quadraticCurveTo(L - S * 0.08, m + S * 0.05, L - S * 0.005, m); x.closePath(); x.fill();
  fxShine(x, x1 + S * 0.04, m - S * 0.03, S * 0.025);
  return spr(outlineC(c, Math.max(1, S * 0.012), '#4a2a5a', 0.9), pad + S * 0.4, pad + m);
}
// 사탕 지팡이 방책
function fxFence(S) {
  var W = S * 1.2, H = S * 0.9, gx = S * 0.6, gy = S * 0.7, a = mkC(W, H), x = cx2(a), i;
  for (i = 0; i < 2; i++) { fxRR(x, gx - S * 0.52, gy - S * (0.34 - i * 0.16), S * 1.04, S * 0.075, S * 0.035); x.fillStyle = i ? '#ff9a6a' : '#ffb38a'; x.fill(); }
  for (i = 0; i < 5; i++) {
    var px = gx - S * 0.42 + i * S * 0.21, pw = S * 0.1, ph = S * (0.5 + (i % 2) * 0.06);
    x.save(); fxRR(x, px - pw / 2, gy - ph, pw, ph, pw / 2); x.fillStyle = '#fffaf2'; x.fill(); x.clip();
    x.fillStyle = i % 2 ? '#ff5d9e' : '#ff8fc0'; for (var sy = gy - ph - pw; sy < gy + pw; sy += pw * 1.1) { x.beginPath(); x.moveTo(px - pw, sy + pw * 0.5); x.lineTo(px + pw, sy - pw * 0.2); x.lineTo(px + pw, sy + pw * 0.2); x.lineTo(px - pw, sy + pw * 0.9); x.closePath(); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(px - pw * 0.3, gy - ph, pw * 0.16, ph); x.restore();
  }
  var o = outlineC(a, Math.max(1, S * 0.013), '#4a2a5a', 0.9), c = mkC(W, H), y = cx2(c);
  softShadow(y, gx + S * 0.05, gy, S * 0.52, S * 0.13, 0.3); y.drawImage(o, 0, 0);
  return spr(c, gx, gy);
}
function fxSpr(name, S) {
  var key = name + ':' + Math.round(S); if (FX_SPR[key]) return FX_SPR[key];
  var c, x, s, at = name.indexOf('@');
  // 투사체 스킨: 'arrow@heart', 'bolt@candy' 처럼 이름 뒤에 스킨
  if (at > 0) { var bn = name.slice(0, at), sk = name.slice(at + 1); return (FX_SPR[key] = FX_BOLT[bn] ? fxBoltSk(S, bn, sk) : fxArrowSk(S, FX_ARW[bn] ? bn : 'arrow', sk)); }
  if (FX_ARW[name]) s = fxArrow(S, name);
  else if (FX_BOLT[name]) s = fxBolt(S, name);
  else if (name === 'stone') s = fxBall(S, S * 0.105, ['#ff8fc0', '#fff6fa']);
  else if (name === 'stoneF') s = fxBall(S, S * 0.11, ['#ff9a4a', '#ffe066']);
  else if (name === 'boulder') s = fxBall(S, S * 0.155, ['#ff8fc0', '#ffb38a', '#ffe066', '#7fe0c4', '#7cc8ff', '#b9a2ff']);
  else if (name === 'glossS') s = fxGloss(S, S * 0.105);
  else if (name === 'glossF') s = fxGloss(S, S * 0.11);
  else if (name === 'glossB') s = fxGloss(S, S * 0.155);
  else if (name === 'flask') s = fxPotion(S, '#9be86a');
  else if (name === 'flaskA') s = fxPotion(S, '#ffe066');
  else if (name === 'flaskP') s = fxPotion(S, '#a58aff');
  else if (name === 'shell') s = fxBomb(S, '#4d3f8a');
  else if (name === 'shellH') s = fxBomb(S, '#ff5d9e');
  else if (name === 'shellM') s = fxBomb(S, '#5aa0e8');
  else if (name === 'barricade') s = fxFence(S);
  else if (name === 'coin') {
    c = mkC(S * 0.16, S * 0.16); x = cx2(c); var cn = shp().ell(S * 0.08, S * 0.08, S * 0.065, S * 0.065); litFill(x, cn, '#e2b84e', { hi: 0.55, lo: 0.4 }); rim(x, cn, '#fff2b8', S * 0.012, 0.8);
    s = spr(c, S * 0.08, S * 0.08);
  } else if (name === 'rift') {
    // 적이 나오는 곳: 보랏빛 요술 구멍
    c = mkC(S * 1.6, S * 1.0); x = cx2(c); var cx3 = S * 0.8, cy3 = S * 0.5;
    var gr = x.createRadialGradient(cx3, cy3, 0, cx3, cy3, S * 0.7); gr.addColorStop(0, 'rgba(90,60,170,0.92)'); gr.addColorStop(0.42, 'rgba(138,108,255,0.75)'); gr.addColorStop(0.72, 'rgba(255,143,192,0.4)'); gr.addColorStop(1, 'rgba(255,143,192,0)');
    x.save(); x.translate(cx3, cy3); x.scale(1, 0.55); x.translate(-cx3, -cy3); x.fillStyle = gr; x.beginPath(); x.arc(cx3, cy3, S * 0.7, 0, Math.PI * 2); x.fill(); x.restore();
    x.fillStyle = 'rgba(255,255,255,0.9)'; [[-0.2, -0.06, 0.025], [0.16, 0.04, 0.02], [0.02, -0.1, 0.015], [-0.05, 0.08, 0.018]].forEach(function (q) { x.beginPath(); x.arc(cx3 + q[0] * S, cy3 + q[1] * S, q[2] * S, 0, 6.2832); x.fill(); });
    s = spr(c, cx3, cy3);
  }
  return (FX_SPR[key] = s);
}

// ---------- 빛 꼬리: 머리 쪽이 굵고 둥근 사탕 리본, 가운데 흰 심 ('rainbow'는 무지개) ----------
var STREAK = {};
function streakSpr(col) {
  if (STREAK[col]) return STREAK[col];
  var c = mkC(128, 24), x = cx2(c), g = x.createLinearGradient(0, 0, 128, 0), candy = col === 'candy';
  if (col === 'rainbow') { g.addColorStop(0, 'rgba(185,162,255,0)'); g.addColorStop(0.3, 'rgba(124,200,255,0.55)'); g.addColorStop(0.55, 'rgba(127,224,196,0.8)'); g.addColorStop(0.78, 'rgba(255,224,102,0.92)'); g.addColorStop(1, 'rgba(255,143,192,1)'); }
  else if (candy) {
    // 사탕 줄무늬 꼬리 (분홍, 흰, 민트, 흰, 레몬...)
    var cc = ['#ff5d9e', '#ffffff', '#5fd8b4', '#ffffff', '#ffd23a', '#ffffff', '#a98bff', '#ffffff', '#ff5d9e', '#ffffff'];
    for (var i = 0; i < cc.length; i++) { g.addColorStop(i / cc.length, cc[i]); g.addColorStop(Math.min(1, (i + 1) / cc.length - 0.002), cc[i]); }
  }
  else { g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.55, rgba(col, 0.55)); g.addColorStop(1, rgba(col, 1)); }
  x.fillStyle = g; x.beginPath(); x.moveTo(0, 12); x.quadraticCurveTo(64, 5, 118, 3.5); x.arc(118, 12, 8.5, -Math.PI / 2, Math.PI / 2); x.quadraticCurveTo(64, 19, 0, 12); x.fill();
  if (candy) { x.globalCompositeOperation = 'destination-in'; var ga = x.createLinearGradient(0, 0, 128, 0); ga.addColorStop(0, 'rgba(0,0,0,0)'); ga.addColorStop(0.45, 'rgba(0,0,0,0.7)'); ga.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = ga; x.fillRect(0, 0, 128, 24); x.globalCompositeOperation = 'source-over'; }
  var w = x.createLinearGradient(0, 0, 128, 0); w.addColorStop(0, 'rgba(255,255,255,0)'); w.addColorStop(1, candy ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.95)');
  x.fillStyle = w; x.beginPath(); x.moveTo(24, 12); x.quadraticCurveTo(72, 9.5, 118, 8.6); x.arc(118, 12, candy ? 2.4 : 3.4, -Math.PI / 2, Math.PI / 2); x.quadraticCurveTo(72, 14.5, 24, 12); x.fill();
  return (STREAK[col] = c);
}

// ---------- 입자 ----------
var PARTS = [], MAXP = 640;
function partGone(p) { p.dead = 1; if (p.k === 'num') { NUM_N--; if (NUM_BY[p.id] === p) delete NUM_BY[p.id]; } else if (p.k === 'stk') FX_NSTK--; }
function addP(o) { if (PARTS.length >= MAXP) partGone(PARTS.shift()); o.t = 0; PARTS.push(o); return o; }
function fxN(n) { return RD.lowFx ? Math.max(1, Math.ceil(n * 0.5)) : n; }
// 퍼지는 입자 (opt.k 종류, opt.cols 색 여러 개, opt.z 높이, opt.vz 위로, opt.grav 중력, opt.dr 공기 저항, opt.dl 늦게 시작)
function burst(x, y, n, col, sp, life, size, opt) {
  opt = opt || {}; n = fxN(n);
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random() * 0.8);
    addP({ k: opt.k || 'spark', x: x, y: y, z: opt.z || 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: opt.vz != null ? opt.vz * (0.5 + Math.random()) : 0, life: life * (0.6 + Math.random() * 0.6) + (opt.dl || 0), dl: opt.dl || 0, size: size * (0.6 + Math.random() * 0.8), col: opt.cols ? fxPick(opt.cols) : col, grav: opt.grav || 0, dr: opt.dr || 0, rot: Math.random() * 6, vr: (Math.random() - 0.5) * (opt.vr || 12), fl: 8 + Math.random() * 10, ph: Math.random() * 6 });
  }
}
// 뭉게구름 (예전 연기 자리): 사탕 색 솜구름이 퍼지며 사라짐
function smoke(x, y, n, col, size, life, rise, al) {
  n = fxN(n);
  for (var i = 0; i < n; i++) addP({ k: 'puff', x: x + (Math.random() - 0.5) * size * 0.6, y: y + (Math.random() - 0.5) * size * 0.3, z: Math.random() * 0.1, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.2, vz: rise == null ? 0.25 : rise, dr: 1.5, life: life * (0.7 + Math.random() * 0.6), size: size * (0.5 + Math.random() * 0.4), col: col || '#fff6e8', a: al || 0.75 });
}
// 둥근 솜구름 펑 (가운데서 바깥으로)
function fxPuffs(x, y, z, n, cols, sp, size, life, dl) {
  n = fxN(n);
  for (var i = 0; i < n; i++) { var a = (i / n + Math.random() * 0.15) * Math.PI * 2, v = sp * (0.7 + Math.random() * 0.5); addP({ k: 'puff', x: x, y: y, z: z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.62, vz: (Math.random() - 0.3) * sp * 0.5, dr: 5, life: life * (0.8 + Math.random() * 0.4) + (dl || 0), dl: dl || 0, size: size * (0.75 + Math.random() * 0.5), col: fxPick(cols), a: 0.95 }); }
}
// 별 하나 (통 튀어나와 돌다가 작아짐)
function fxStar1(x, y, z, size, col, life, dl) { return addP({ k: 'star', x: x, y: y, z: z, size: size, col: col, life: life + (dl || 0), dl: dl || 0, rot: (Math.random() - 0.5) * 0.6, vr: (Math.random() - 0.5) * 4 }); }
// 튀어 오르는 별 여러 개
function fxStars(x, y, z, n, cols, sp, size, life, dl) {
  n = fxN(n);
  for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = sp * (0.55 + Math.random() * 0.6); addP({ k: 'star', x: x, y: y, z: z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 1.6 + Math.random() * 1.6, grav: 7, dr: 1.2, life: life * (0.8 + Math.random() * 0.4) + (dl || 0), dl: dl || 0, size: size * (0.75 + Math.random() * 0.5), col: fxPick(cols), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 9 }); }
}
// 하트: 둥실 떠오르며 살랑
function fxHearts(x, y, z, n, cols, size, life, dl) {
  n = fxN(n);
  for (var i = 0; i < n; i++) addP({ k: 'heart', x: x + (Math.random() - 0.5) * 0.4, y: y, z: z, vx: (Math.random() - 0.5) * 0.5, vz: 0.9 + Math.random() * 0.6, dr: 1, life: life * (0.85 + Math.random() * 0.3) + (dl || 0), dl: dl || 0, size: size * (0.8 + Math.random() * 0.4), col: fxPick(cols), rot: (Math.random() - 0.5) * 0.5, ph: Math.random() * 6 });
}
// 색종이: 튀어 올랐다가 팔랑팔랑 떨어짐
function fxConfetti(x, y, z, n, sp, size, life, cols, dl) {
  n = fxN(n);
  for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random() * 0.8); addP({ k: 'conf', x: x, y: y, z: z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 2 + Math.random() * 2.2, grav: 6, dr: 2.2, life: life * (0.75 + Math.random() * 0.5) + (dl || 0), dl: dl || 0, size: size * (0.75 + Math.random() * 0.5), col: fxPick(cols || FX_CANDY), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, fl: 9 + Math.random() * 9, ph: Math.random() * 6 }); }
}
// 반짝이 (✦): 퍼지면서 커졌다 작아짐
function fxTwinkles(x, y, z, n, cols, sp, size, life, dl) {
  n = fxN(n);
  for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = sp * (0.5 + Math.random() * 0.7); addP({ k: 'twk', x: x, y: y, z: z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: (Math.random() - 0.3) * sp * 0.6, dr: 3, life: life * (0.8 + Math.random() * 0.4) + (dl || 0), dl: dl || 0, size: size * (0.7 + Math.random() * 0.6), col: fxPick(cols), rot: Math.random() * 0.8 - 0.4, vr: (Math.random() - 0.5) * 3 }); }
}
// 흰 충격 모양 (탁!)
function fxPop(x, y, z, size, col, life, dl) { return addP({ k: 'pop', x: x, y: y, z: z, size: size, col: col || '#ffd6e8', life: (life || 0.12) + (dl || 0), dl: dl || 0, rot: Math.random() * 0.8 }); }
function ringFx(x, y, r, col, life, w, dl) { addP({ k: 'ring', x: x, y: y, r: r, col: col, life: life + (dl || 0), dl: dl || 0, w: w || 0.06 }); }
function flashFx(x, y, r, col, life) { addP({ k: 'flash', x: x, y: y, z: 0.3, size: r, col: col, life: life || 0.18 }); }
function textFx(x, y, txt, col, big) { addP({ k: 'text', x: x, y: y, z: 0.6, vz: 0.7, txt: txt, col: col, life: big ? 1.3 : 0.9, big: big }); }
function updateParts(dt) {
  for (var i = PARTS.length - 1; i >= 0; i--) {
    var p = PARTS[i]; p.t += dt;
    if (p.t >= p.life) { partGone(p); PARTS.splice(i, 1); continue; }
    if (p.dl && p.t < p.dl) continue;
    if (p.vx) p.x += p.vx * dt; if (p.vy) p.y += p.vy * dt;
    if (p.vz != null) { p.z += p.vz * dt; if (p.grav) { p.vz -= p.grav * dt; if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.35; p.vx *= 0.6; p.vy *= 0.6; } } }
    if (p.dr) { var f = Math.max(0, 1 - p.dr * dt); p.vx *= f; p.vy *= f; if (p.vz && !p.grav) p.vz *= f; }
    if (p.vr) p.rot += p.vr * dt;
  }
}
// 전투 시작 때 자주 쓰는 모양을 미리 그려 둠 (처음 터질 때 끊김 방지)
function fxWarm(S) {
  var d = [S * 0.3, S * 0.7], i, j;
  for (i = 0; i < FX_CANDY.length; i++) for (j = 0; j < d.length; j++) { fxImg('star', FX_CANDY[i], d[j]); fxImg('twk', FX_CANDY[i], d[j] * 0.6); }
  ['#ffffff', '#fff6e8', '#ffe0ee', '#e8e0ff', '#ffe9d6'].forEach(function (c) { fxImg('puff', c, S * 0.5); fxImg('puff', c, S * 1.2); });
  FX_CANDY.forEach(function (c) { fxImg('conf', c, S * 0.12); fxImg('heart', c, S * 0.3); });
  ['#ffd6e8', '#fff2b0'].forEach(function (c) { fxImg('pop', c, S * 0.8); });
  if (typeof rtWarm === 'function') { rtReset(); rtWarm(S); }   // v2.0 탄, 폭발 조각(art_fx2.js)과 남은 효과 비우기(render_tw.js)
}

// ---------- 날씨, 주변 입자 (귀염판: 꽃잎, 잎, 비눗방울, 요정 가루, 반짝이, 눈송이, 민들레 씨, 별똥) ----------
var AMBP = [];
function initAmbient(theme, n) {
  AMBP = [];
  var gc = RD.cols || COLS, gr = RD.rows || ROWS; n = Math.round(n * Math.min(2, (gc * gr) / (COLS * ROWS)));   // 판 격자(g.cols x g.rows) 기준, 큰 판은 그만큼 더
  for (var i = 0; i < n; i++) AMBP.push({ x: Math.random() * (gc + 4) - 2, y: Math.random() * (gr + 4) - 2, z: Math.random(), ph: Math.random() * 6.28, s: 0.5 + Math.random(), r: Math.random(), S: 0 });
}
function drawAmbient(x, view, theme, time, dt) {
  var T = THEME[theme], k = T.amb, S = view.S, i, p, gc = RD.cols || COLS, gr = RD.rows || ROWS;
  if (k === 'fog') {
    // 옅은 파스텔 안개
    var fc = ['#e8dcff', '#d8fff0', '#ffe4f0'];
    for (var f = 0; f < 5; f++) { var fx = ((time * 0.06 * (1 + f * 0.13) + f * 2.3) % (gc + 6)) - 3, fy = 1.6 + f * 2.6 + Math.sin(time * 0.2 + f) * 0.4; x.globalAlpha = 0.16; x.drawImage(softSpr(fc[f % 3], 64), view.ox + (fx - 2.4) * S, view.oy + (fy - 1) * S, S * 4.8, S * 2); }
    x.globalAlpha = 1;
  }
  var glow = k === 'embers' || k === 'motes' || k === 'spores';
  for (i = 0; i < AMBP.length; i++) {
    p = AMBP[i];
    if (k === 'snow') { p.y += dt * (0.45 + p.s * 0.35); p.x += dt * (Math.sin(time + p.ph) * 0.2 - 0.08); }
    else if (k === 'leaves' || k === 'pollen') { p.y += dt * (k === 'pollen' ? 0.22 : 0.32) * p.s; p.x += dt * (Math.sin(time * 1.3 + p.ph) * 0.4 + 0.15); }
    else if (k === 'ash') { p.y += dt * 0.14 * p.s; p.x += dt * (Math.sin(time * 0.7 + p.ph) * 0.25 + 0.12); }
    else if (k === 'embers') { p.y -= dt * 0.45 * p.s; p.x += dt * Math.sin(time * 2 + p.ph) * 0.25; }
    else if (k === 'dust') { p.x += dt * 0.5 * p.s; p.y += dt * Math.sin(time + p.ph) * 0.08; }
    else if (k === 'fog') { p.y -= dt * 0.2 * p.s; p.x += dt * Math.sin(time * 1.1 + p.ph) * 0.18; }
    else { p.y -= dt * 0.1 * p.s; p.x += dt * Math.sin(time * 0.6 + p.ph) * 0.14; }
    if (p.y > gr + 2) p.y = -2; if (p.y < -2) p.y = gr + 2; if (p.x > gc + 2) p.x = -2; if (p.x < -2) p.x = gc + 2;
    // 모양은 처음 한 번 정해 둠
    if (p.S !== S) {
      p.S = S;
      if (k === 'pollen') { p.d = S * (0.2 + p.z * 0.16); p.img = fxImg('petal', p.r < 0.55 ? '#ffb0d0' : p.r < 0.85 ? '#ffe0ec' : '#fff2b0', p.d); }
      else if (k === 'leaves') { p.d = S * (0.2 + p.z * 0.16); p.img = p.r < 0.4 ? fxImg('leaf', '#9be08a', p.d) : p.r < 0.7 ? fxImg('leaf', '#7fe0c4', p.d) : fxImg('petal', '#ffc0a0', p.d); }
      else if (k === 'fog') { p.d = S * (0.13 + p.z * 0.15); p.img = fxImg('bubble', p.r < 0.33 ? '#9fd8ff' : p.r < 0.66 ? '#c8b0ff' : '#ffb0d8', p.d); }
      else if (k === 'snow') { p.d = S * (p.r < 0.35 ? 0.16 + p.z * 0.12 : 0.06 + p.z * 0.06); p.img = p.r < 0.35 ? fxImg('flake', '#a8dcff', p.d) : fxImg('dot', '#b8dcff', p.d); }
      else if (k === 'ash') { p.d = S * (p.r < 0.75 ? 0.24 + p.z * 0.14 : 0.11 + p.z * 0.07); p.img = p.r < 0.75 ? fxImg('seed', '#ffb0d0', p.d) : fxImg('heart', '#ffc8e0', p.d); }
      else if (k === 'embers') { p.d = S * (0.1 + p.z * 0.08); p.img = fxImg(p.r < 0.6 ? 'star' : 'heart', p.r < 0.3 ? '#ffe066' : p.r < 0.6 ? '#ffb38a' : '#ff8fc0', p.d); }
      else if (k === 'dust') { p.d = S * (0.11 + p.z * 0.1); p.img = fxImg('twk', p.r < 0.4 ? '#ffe066' : p.r < 0.7 ? '#ffc8a8' : '#ffffff', p.d); }
      else if (k === 'spores') { p.d = S * (0.12 + p.z * 0.1); p.img = fxImg('twk', p.r < 0.5 ? '#9ff0d0' : '#fff2a0', p.d); }
      else { p.d = S * (0.12 + p.z * 0.1); p.img = fxImg('twk', p.r < 0.5 ? '#c8b0ff' : '#a8dcff', p.d); }
    }
    var d = p.d, a = 1;
    p.rot = 0; p.fy = 1;
    if (k === 'pollen' || k === 'leaves') { p.rot = time * 1.1 * p.s + p.ph; p.fy = Math.cos(time * 2.2 * p.s + p.ph); a = 0.9; }
    else if (k === 'snow') { p.rot = p.r < 0.35 ? time * 0.6 * p.s + p.ph : 0; a = 0.75 + p.z * 0.25; }
    else if (k === 'ash' || k === 'fog') { a = k === 'ash' ? 0.8 : 0.7; }
    else { var tw = 0.5 + 0.5 * Math.sin(time * (k === 'dust' ? 4 : 2.2) + p.ph * 3); a = 0.35 + 0.65 * tw; d *= 0.6 + 0.5 * tw; p.rot = k === 'embers' ? time * p.s + p.ph : 0; }
    p.X = view.ox + p.x * S; p.Y = view.oy + p.y * S; p.dd = d; p.aa = a;
  }
  // 빛 무리는 한 번에 (섞기 방식 바꾸는 횟수 줄임)
  if (glow) {
    var gl = glowSpr(k === 'embers' ? '#ffb070' : k === 'spores' ? '#8ff0c8' : '#b8a0ff', 16);
    x.globalCompositeOperation = 'lighter';
    for (i = 0; i < AMBP.length; i++) { p = AMBP[i]; x.globalAlpha = p.aa * 0.35; x.drawImage(gl, p.X - p.dd, p.Y - p.dd, p.dd * 2, p.dd * 2); }
    x.globalCompositeOperation = 'source-over';
  }
  for (i = 0; i < AMBP.length; i++) {
    p = AMBP[i]; var dd = p.dd; x.globalAlpha = p.aa;
    if (p.rot || p.fy !== 1) { var cr = Math.cos(p.rot), sr = Math.sin(p.rot); x.setTransform(cr, sr, -sr * p.fy, cr * p.fy, p.X, p.Y); x.drawImage(p.img, -dd / 2, -dd / 2, dd, dd); x.setTransform(1, 0, 0, 1, 0, 0); }
    else x.drawImage(p.img, p.X - dd / 2, p.Y - dd / 2, dd, dd);
  }
  x.globalAlpha = 1;
}

// ================= v12 타격감, 조준 표시, 투사체 스킨 =================
// 투사체 스킨 (상점이 SAVE.skin.proj에 넣음): base 기본, heart 하트 화살, candy 캔디 화살. 없으면 base
function fxSkinP() { var s = typeof SAVE !== 'undefined' && SAVE && SAVE.skin && SAVE.skin.proj; return s === 'heart' || s === 'candy' ? s : 'base'; }

// ---------- 스티커 글자 (의성어, 콤보, 피해 숫자) ----------
// 굵은 흰 테두리 + 자두색 바깥 선 + 아래 그림자 + 사탕 색 채움 + 윗부분 광택. 한 번 구워 두고 다시 씀
// 색 이름: [위, 가운데, 아래], 'rain'은 무지개(왼쪽에서 오른쪽)
var FX_STY = { iron: ['#fff1d6', '#e8a640', '#a8542a'], steel: ['#f4f8fb', '#b9c4ce', '#5f6e7c'], bronze: ['#fff0c8', '#d8a050', '#8a5a20'], blood: ['#ffd9c8', '#e0533a', '#8a2416'], pink: ['#ffd6e8', '#ff5d9e', '#e0337a'], lemon: ['#fff7c2', '#ffcf2e', '#ff9a1a'], mint: ['#d8fff0', '#4fdcae', '#1fae84'], sky: ['#dcf2ff', '#5cb6ff', '#2f7fe6'], lav: ['#f0e6ff', '#a98bff', '#7550ee'], peach: ['#ffe6d2', '#ff9a5e', '#ff6438'], hot: ['#ffd0e2', '#ff3d84', '#d01f68'] };
var FX_STK = {}, FX_STKN = 0, FX_MX = null, FX_NSTK = 0;
var FX_RAINS = ['#ff3d8b', '#ff7a2e', '#ffb800', '#22c983', '#2f8cff', '#8656ff']; // 글자용 진한 무지개 (흰 테두리 위에서도 또렷하게)
function fxFontOk(fs) { try { return !document.fonts || !document.fonts.check || document.fonts.check(fs + 'px CUTE'); } catch (e) { return true; } }
function fxStkDraw(c, txt, fs, sty) {
  var x = c.getContext('2d'), font = fs + 'px CUTE, PRT, sans-serif';
  x.font = font; var tw = x.measureText(txt).width, lw = Math.max(2, Math.round(fs * 0.11)), pad = lw * 3 + 2, sh = Math.max(1, Math.round(fs * 0.08));
  c.width = Math.ceil(tw + pad * 2); c.height = Math.ceil(fs * 1.28 + pad * 2 + sh);
  x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  var cx = c.width / 2, cy = (c.height - sh) / 2 + Math.round(fs * 0.05), g, i;
  x.strokeStyle = 'rgba(30,16,8,0.45)'; x.lineWidth = lw * 4.8; x.strokeText(txt, cx, cy + sh);
  x.strokeStyle = '#2a1810'; x.lineWidth = lw * 4.4; x.strokeText(txt, cx, cy);
  x.strokeStyle = '#fff3df'; x.lineWidth = lw * 2.8; x.strokeText(txt, cx, cy);
  if (sty === 'rain') sty = 'iron';   // v1.3: 무지개 글자 없앰
  if (false) { g = x.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0); for (i = 0; i < FX_RAINS.length; i++) g.addColorStop(i / (FX_RAINS.length - 1), FX_RAINS[i]); }
  else { var P = FX_STY[sty] || FX_STY.pink; g = x.createLinearGradient(0, cy - fs * 0.45, 0, cy + fs * 0.42); g.addColorStop(0, P[0]); g.addColorStop(0.42, P[1]); g.addColorStop(1, P[2]); }
  x.fillStyle = g; x.fillText(txt, cx, cy);
  x.save(); x.beginPath(); x.rect(0, 0, c.width, cy - fs * 0.1); x.clip(); x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillText(txt, cx, cy); x.restore();
  return c;
}
// fs 정수 px. maxW(px)를 넘으면 글자 크기를 줄임 (번역으로 글자 폭이 달라져도 깨지지 않게 measureText로 잼)
function fxSticker(txt, fs, sty, maxW) {
  fs = Math.max(8, Math.round(fs));
  if (maxW) { var mx = FX_MX || (FX_MX = mkC(4, 4).getContext('2d')); mx.font = fs + 'px CUTE, PRT, sans-serif'; var tw = mx.measureText(txt).width * 1.04; if (tw > maxW) fs = Math.max(8, Math.floor(fs * maxW / tw)); }
  var key = sty + '|' + fs + '|' + txt, c = FX_STK[key]; if (c) return c;
  c = fxStkDraw(document.createElement('canvas'), txt, fs, sty);
  if (fxFontOk(fs)) { if (FX_STKN > 240) { FX_STK = {}; FX_STKN = 0; } FX_STK[key] = c; FX_STKN++; } // 글꼴이 아직이면 저장하지 않음
  return c;
}
// 피해 숫자: 같은 모양, 값이 바뀔 때만 그 캔버스에 다시 그림
function fxNumC(txt, fs, sty, cv) { return fxStkDraw(cv || document.createElement('canvas'), txt, Math.max(8, Math.round(fs)), sty); }

// ---------- 구운 고리: 충격파, 무지개 고리. v 0 굵게, 1 중간, 2 가늘게 (퍼지면서 바꿔 그려 선이 가늘어짐) ----------
var FX_RNG = {};
function fxRingSpr(col, v) {
  var key = col + v; if (FX_RNG[key]) return FX_RNG[key];
  var rb = col === 'rainbow', b = rb ? 256 : 128, c = mkC(b, b), x = cx2(c), m = b / 2, R = b * 0.44, w = [0.26, 0.15, 0.08][v] * R, i;
  if (rb) {
    x.lineWidth = w / 6 + 1.2;
    for (i = 0; i < 6; i++) { x.strokeStyle = FX_RAIN[i]; x.beginPath(); x.arc(m, m, R - w * (i + 0.5) / 6, 0, 6.2832); x.stroke(); }
    x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = Math.max(1.5, w * 0.14);
    x.beginPath(); x.arc(m, m, R + w * 0.03, 0, 6.2832); x.stroke(); x.beginPath(); x.arc(m, m, R - w * 1.03, 0, 6.2832); x.stroke();
  } else {
    x.strokeStyle = 'rgba(74,42,90,0.3)'; x.lineWidth = w + 3; x.beginPath(); x.arc(m, m, R - w / 2, 0, 6.2832); x.stroke();
    x.strokeStyle = '#ffffff'; x.lineWidth = w; x.stroke();
    x.strokeStyle = col; x.lineWidth = w * 0.5; x.stroke();
  }
  return (FX_RNG[key] = c);
}
// 빛줄기 (치명타, 최후의 화살): 가운데 흰 심, 레몬빛 가장자리
var FX_RAYC = null;
function fxRaySpr() {
  if (FX_RAYC) return FX_RAYC;
  var c = mkC(128, 24), x = cx2(c), g = x.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, 'rgba(255,236,140,0)'); g.addColorStop(0.22, 'rgba(255,226,120,0.95)'); g.addColorStop(1, 'rgba(255,160,210,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(0, 12); x.quadraticCurveTo(28, 0, 128, 12); x.quadraticCurveTo(28, 24, 0, 12); x.fill();
  var w = x.createLinearGradient(0, 0, 128, 0); w.addColorStop(0, 'rgba(255,255,255,0)'); w.addColorStop(0.22, 'rgba(255,255,255,1)'); w.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = w; x.beginPath(); x.moveTo(4, 12); x.quadraticCurveTo(28, 6.5, 122, 12); x.quadraticCurveTo(28, 17.5, 4, 12); x.fill();
  return (FX_RAYC = c);
}

// ---------- 조준(집중) 표시: 굵은 흰 테두리 + 진한 분홍 + 은은한 어두운 그림자 (반지름 4px 단위로 구워 둠) ----------
var FX_FOC = {}, FX_FOCN = 0;
function fxFocGet(key) { if (FX_FOCN > 72) { FX_FOC = {}; FX_FOCN = 0; } return FX_FOC[key]; }
// 선 굵기는 칸 크기(S) 기준이라 작은 대상도 굵고 또렷함
function fxFocW(R, S) { S = Math.round(S || 60); return { w: Math.max(3, S * 0.075, R * 0.1), o: Math.max(2, S * 0.035, R * 0.05), sh: Math.max(1.5, S * 0.03, R * 0.04) }; }
// 천천히 도는 점선 고리
function fxFocRing(R, S) {
  R = Math.max(12, Math.round(R / 4) * 4); var key = 'r' + R + ':' + Math.round(S || 60), s = fxFocGet(key); if (s) return s;
  var L = fxFocW(R, S), w = L.w, o = L.o, sh = L.sh, pad = Math.ceil(w / 2 + o + sh + 4), b = (R + pad) * 2, c = mkC(b, b), x = cx2(c), m = b / 2, n = R > 90 ? 12 : R > 50 ? 10 : 8, C = 6.2832 * R;
  x.lineCap = 'round'; x.setLineDash([C / n * 0.6 - w * 0.5, C / n * 0.4 + w * 0.5]);
  x.strokeStyle = 'rgba(52,14,66,0.36)'; x.lineWidth = w + o * 2 + 1; x.beginPath(); x.arc(m, m + sh, R, 0, 6.2832); x.stroke();
  x.strokeStyle = '#ffffff'; x.lineWidth = w + o * 2; x.beginPath(); x.arc(m, m, R, 0, 6.2832); x.stroke();
  x.strokeStyle = '#ff2d78'; x.lineWidth = w; x.stroke();
  x.setLineDash([]); x.globalAlpha = 0.6; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1.2, o * 0.7); x.beginPath(); x.arc(m, m, R - w / 2 - o - 1.5, 0, 6.2832); x.stroke(); x.globalAlpha = 1;
  FX_FOCN++; return (FX_FOC[key] = { c: c, m: m });
}
// 모서리 꺾쇠 (꺾인 곳이 오른쪽 위, 팔은 왼쪽과 아래로): 돌려서 네 귀퉁이에 씀
function fxFocBrk(R, S) {
  R = Math.max(12, Math.round(R / 4) * 4); var key = 'b' + R + ':' + Math.round(S || 60), s = fxFocGet(key); if (s) return s;
  var L = fxFocW(R, S), a = Math.max(L.w * 2.2, R * 0.34), w = L.w * 1.05, o = L.o, sh = L.sh, pad = Math.ceil(w / 2 + o + sh + 3), b = Math.ceil(a + pad * 2), c = mkC(b, b), x = cx2(c), X1 = b - pad, Y0 = pad;
  var path = function (dy) { x.beginPath(); x.moveTo(X1 - a, Y0 + dy); x.lineTo(X1, Y0 + dy); x.lineTo(X1, Y0 + a + dy); };
  x.lineCap = 'round'; x.lineJoin = 'round';
  path(sh); x.strokeStyle = 'rgba(52,14,66,0.36)'; x.lineWidth = w + o * 2 + 1; x.stroke();
  path(0); x.strokeStyle = '#ffffff'; x.lineWidth = w + o * 2; x.stroke(); x.strokeStyle = '#ff1f5a'; x.lineWidth = w; x.stroke();
  FX_FOCN++; return (FX_FOC[key] = { c: c, cx: X1, cy: Y0 });
}
// 위에서 통통 튀는 하트 화살표 (끝이 아래를 가리킴)
function fxFocHeart(d) {
  d = Math.max(12, Math.round(d / 4) * 4); var key = 'h' + d, s = fxFocGet(key); if (s) return s;
  var hs = d * 0.42, o = Math.max(2, d * 0.09), sh = Math.max(1.5, d * 0.06), b = Math.ceil(d + o * 2 + 6), c = mkC(b, b + sh), x = cx2(c), m = b / 2, cy = m + d * 0.02;
  x.lineJoin = 'round';
  fxHeartPath(x, m, cy + sh, hs); x.fillStyle = 'rgba(52,14,66,0.36)'; x.strokeStyle = 'rgba(52,14,66,0.36)'; x.lineWidth = o * 2; x.stroke(); x.fill();
  fxHeartPath(x, m, cy, hs); x.strokeStyle = '#ffffff'; x.lineWidth = o * 2; x.stroke();
  var g = x.createLinearGradient(0, cy - hs, 0, cy + hs); g.addColorStop(0, '#ff8fc0'); g.addColorStop(1, '#ff1f66'); x.fillStyle = g; x.fill();
  fxHeartPath(x, m - hs * 0.12, cy - hs * 0.08, hs * 0.42); x.fillStyle = 'rgba(255,255,255,0.32)'; x.fill();
  fxShine(x, m - hs * 0.42, cy - hs * 0.32, hs * 0.17);
  FX_FOCN++; return (FX_FOC[key] = { c: c, w: c.width, h: c.height });
}
// 그림에서 실제로 보이는 몸 상자 (진한 부분만, 옅은 그림자와 빛 무리는 뺌). 기준점(발밑)에서 가운데까지 거리와 폭, 높이
function fxBodyBox(s) {
  if (!s || !s.c) return null; if (s.fbb) return s.fbb;
  var c = s.c, w = c.width, h = c.height, x0 = w, y0 = h, x1 = -1, y1 = -1;
  try {
    var d = cx2(c).getImageData(0, 0, w, h).data;
    for (var y = 0; y < h; y++) for (var i = y * w * 4 + 3, xx = 0; xx < w; xx++, i += 4) if (d[i] > 150) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  } catch (e) { }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }
  return (s.fbb = { cx: (x0 + x1 + 1) / 2 - s.ax, cy: (y0 + y1 + 1) / 2 - s.ay, w: x1 - x0 + 1, h: y1 - y0 + 1 });
}

// ---------- 마법 구슬: 밝은 파스텔 바탕에서도 또렷하게 (자두색 테두리, 진한 보라 몸, 흰 테, 옅은 빛 무리) ----------
var FX_ORB = {};
function fxOrbSpr(S, lv, sk) {
  var r = Math.max(4, Math.round(S * (0.15 + 0.045 * lv))), key = r + sk; if (FX_ORB[key]) return FX_ORB[key];
  var b = Math.ceil(r * 3.2), c = mkC(b, b), x = cx2(c), m = b / 2, i,
    P = sk === 'heart' ? ['#ffe0ee', '#ff6fae', '#d6336f', '#ffb0d4'] : sk === 'candy' ? ['#e6fff6', '#4fdcae', '#1f9e7a', '#a8f0d8'] : ['#efe6ff', '#9a72ff', '#5a34d0', '#c8b0ff'];
  var hg = x.createRadialGradient(m, m, r * 0.6, m, m, b / 2); hg.addColorStop(0, rgba(P[3], 0.6)); hg.addColorStop(1, rgba(P[3], 0)); x.fillStyle = hg; x.fillRect(0, 0, b, b);
  x.beginPath(); x.arc(m, m, r + Math.max(1.5, r * 0.15), 0, 6.2832); x.fillStyle = '#4a2a5a'; x.fill();
  var g = x.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r); g.addColorStop(0, P[0]); g.addColorStop(0.5, P[1]); g.addColorStop(1, P[2]);
  x.beginPath(); x.arc(m, m, r, 0, 6.2832); x.fillStyle = g; x.fill();
  if (sk === 'candy') { x.save(); x.clip(); x.fillStyle = 'rgba(255,255,255,0.7)'; for (i = 0; i < 6; i += 2) { var a0 = i * 1.047; x.beginPath(); x.moveTo(m, m); x.arc(m, m, r, a0, a0 + 0.62); x.closePath(); x.fill(); } x.restore(); }
  x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = Math.max(1, r * 0.13); x.beginPath(); x.arc(m, m, r * 0.84, 3.5, 5.0); x.stroke();
  fxShine(x, m - r * 0.38, m - r * 0.42, r * 0.22);
  return (FX_ORB[key] = { c: c, m: m, r: r });
}

// ---------- 투사체 스킨: 하트 화살, 캔디 화살 (궁수탑, 노포는 모양까지, 다른 탑은 꼬리 색과 장식) ----------
// 하트: [자루, 자루 하트, 깃 하트, 촉 하트]
var FX_ARWH = { arrow: ['#fff0f6', '#ff8fc0', '#ff8fc0', '#ff3d7f'], arrowG: ['#fff6d6', '#ffb0d0', '#ffd23a', '#ff4f8b'], arrowS: ['#f0f9ff', '#9fdcff', '#9fdcff', '#ff5d9e'], arrowR: ['#ffe4ee', '#ff5d9e', '#ff5d9e', '#e8236a'] };
// 캔디: [바탕, 줄무늬, 촉]
var FX_ARWC = { arrow: ['#ffffff', '#ff3d6e', '#ff3d6e'], arrowG: ['#fffbe8', '#ffb000', '#ff8fc0'], arrowS: ['#ffffff', '#3c9dff', '#7cc8ff'], arrowR: ['#ffffff', '#ff2e7e', '#ffd23a'] };
var FX_BOLTH = { bolt: ['#ff5d9e', '#ff3d7f', '#ff8fc0'], boltH: ['#ff8fc0', '#ff4f8b', '#ffd23a'], boltF: ['#9fdcff', '#ff5d9e', '#ff8fc0'] };
var FX_BOLTC = { bolt: ['#ff3d6e', '#ff3d6e'], boltH: ['#ffb000', '#ff8fc0'], boltF: ['#3c9dff', '#7cc8ff'] };
function fxHeartAt(x, X, Y, s, rot, col, ol, lw) { x.save(); x.translate(X, Y); x.rotate(rot); fxHeartPath(x, 0, 0, s); if (ol) { x.strokeStyle = ol; x.lineWidth = lw; x.stroke(); } x.fillStyle = col; x.fill(); x.restore(); }
// 사탕 지팡이 길: 앞(xe)에서 뒤(xs)로 곧게, 뒤끝은 위로 말려 올라감
function fxCanePath(x, xe, xs, m, r) { x.beginPath(); x.moveTo(xe, m); x.lineTo(xs, m); x.arc(xs, m - r, r, Math.PI / 2, Math.PI * 1.9, false); }
function fxCane(x, xe, xs, m, r, sw, base, stripe) {
  x.lineCap = 'round'; x.lineJoin = 'round'; fxCanePath(x, xe, xs, m, r); x.strokeStyle = base; x.lineWidth = sw; x.stroke();
  x.lineCap = 'butt'; x.setLineDash([sw * 0.72, sw * 0.72]); fxCanePath(x, xe, xs, m, r); x.strokeStyle = stripe; x.lineWidth = sw; x.stroke(); x.setLineDash([]);
  x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = Math.max(1, sw * 0.22); x.beginPath(); x.moveTo(xe - sw, m - sw * 0.22); x.lineTo(xs + sw * 0.5, m - sw * 0.22); x.stroke();
}
function fxArrowSk(S, kind, sk) {
  var S1 = S * 1.25, long = kind === 'arrowS', L = S1 * (long ? 0.5 : 0.45), pad = 3, c, x, m;
  if (sk === 'candy') {
    var P = FX_ARWC[kind] || FX_ARWC.arrow, sw = Math.max(2.4, S1 * 0.042), r = S1 * 0.05, H = r * 2 + sw * 2 + 2, xs = S1 * 0.03 + r, xe = L - S1 * 0.09, tl = S1 * 0.12;
    m = H - sw * 0.9; c = mkC(L + pad * 2, H + pad * 2); x = cx2(c); x.translate(pad, pad);
    fxCane(x, xe, xs, m, r, sw, P[0], P[1]);
    // 촉: 둥근 사탕 뿔에 흰 사선
    x.beginPath(); x.moveTo(L, m); x.quadraticCurveTo(L - tl * 0.35, m - tl * 0.48, xe - tl * 0.08, m - tl * 0.4); x.quadraticCurveTo(xe - tl * 0.3, m, xe - tl * 0.08, m + tl * 0.4); x.quadraticCurveTo(L - tl * 0.35, m + tl * 0.48, L, m); x.closePath();
    x.fillStyle = P[2]; x.fill(); x.save(); x.clip(); x.strokeStyle = 'rgba(255,255,255,0.92)'; x.lineWidth = Math.max(1, sw * 0.42); x.beginPath(); x.moveTo(xe - tl * 0.05, m + tl * 0.32); x.lineTo(xe + tl * 0.4, m - tl * 0.42); x.moveTo(xe + tl * 0.38, m + tl * 0.34); x.lineTo(xe + tl * 0.8, m - tl * 0.3); x.stroke(); x.restore();
    fxShine(x, xe + tl * 0.22, m - tl * 0.2, tl * 0.12);
  } else {
    var Q = FX_ARWH[kind] || FX_ARWH.arrow, H2 = S1 * 0.2, sw2 = Math.max(1.8, S1 * 0.03), x0 = S1 * 0.08, x1 = L - S1 * 0.1, hf = S1 * 0.036, hs = S1 * (kind === 'arrowR' ? 0.064 : 0.058);
    m = H2 / 2; c = mkC(L + pad * 2, H2 + pad * 2); x = cx2(c); x.translate(pad, pad); x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = Q[0]; x.lineWidth = sw2; x.beginPath(); x.moveTo(x0, m); x.lineTo(x1, m); x.stroke();
    fxHeartAt(x, x0 + (x1 - x0) * 0.45, m, S1 * 0.017, -Math.PI / 2, Q[1]); fxHeartAt(x, x0 + (x1 - x0) * 0.64, m, S1 * 0.017, -Math.PI / 2, Q[1]);
    // 깃: 끝이 자루를 향한 하트 두 장
    fxHeartAt(x, x0 + hf * 0.5, m - hf * 0.95, hf, -0.6, Q[2], fxOl(Q[2]), Math.max(1, S1 * 0.008));
    fxHeartAt(x, x0 + hf * 0.5, m + hf * 0.95, hf, Math.PI + 0.6, mixc(Q[2], '#ffffff', 0.3), fxOl(Q[2]), Math.max(1, S1 * 0.008));
    // 촉: 큰 하트 (끝이 앞을 가리킴)
    fxHeartAt(x, L - hs * 0.95, m, hs, -Math.PI / 2, Q[3], fxOl(Q[3]), Math.max(1, S1 * 0.01));
    fxShine(x, L - hs * 1.3, m - hs * 0.45, hs * 0.26);
  }
  return spr(outlineC(c, Math.max(1, S * 0.011), '#4a2a5a', 0.85), pad + L / 2, pad + m);
}
function fxBoltSk(S, kind, sk) {
  var L = S * 0.86, pad = 3, c, x, m;
  if (sk === 'candy') {
    var P = FX_BOLTC[kind] || FX_BOLTC.bolt, sw = S * 0.058, r = S * 0.07, H = r * 2 + sw * 2 + 2, xs = S * 0.04 + r, xe = S * 0.7, pr = S * 0.1;
    m = Math.max(H - sw * 0.9, pr + 1); c = mkC(L + pad * 2, Math.max(H, m + pr + 2) + pad * 2); x = cx2(c); x.translate(pad, pad);
    fxCane(x, xe, xs, m, r, sw, '#ffffff', P[0]);
    // 촉: 박하사탕 바람개비
    var px = L - pr - 1; x.beginPath(); x.arc(px, m, pr, 0, 6.2832); x.fillStyle = '#ffffff'; x.fill();
    x.save(); x.clip(); x.fillStyle = P[0]; for (var i = 0; i < 6; i += 2) { var a0 = i * 1.047; x.beginPath(); x.moveTo(px, m); x.quadraticCurveTo(px + Math.cos(a0 + 0.7) * pr * 0.7, m + Math.sin(a0 + 0.7) * pr * 0.7, px + Math.cos(a0) * pr * 1.2, m + Math.sin(a0) * pr * 1.2); x.lineTo(px + Math.cos(a0 + 0.9) * pr * 1.2, m + Math.sin(a0 + 0.9) * pr * 1.2); x.closePath(); x.fill(); } x.restore();
    x.beginPath(); x.arc(px, m, pr * 0.22, 0, 6.2832); x.fillStyle = P[1]; x.fill(); fxShine(x, px - pr * 0.4, m - pr * 0.42, pr * 0.22);
  } else {
    var Q = FX_BOLTH[kind] || FX_BOLTH.bolt, H2 = S * 0.24, sw2 = S * 0.052, x0 = S * 0.08, x1 = S * 0.64, hs = S * 0.075;
    m = H2 / 2; c = mkC(L + pad * 2, H2 + pad * 2); x = cx2(c); x.translate(pad, pad);
    x.save(); fxRR(x, x0, m - sw2 / 2, x1 - x0, sw2, sw2 / 2); x.fillStyle = '#fffaf2'; x.fill(); x.clip();
    x.fillStyle = Q[0]; for (var sx = x0 - sw2; sx < x1 + sw2; sx += sw2 * 1.5) { x.beginPath(); x.moveTo(sx, m + sw2); x.lineTo(sx + sw2 * 0.7, m + sw2); x.lineTo(sx + sw2 * 1.4, m - sw2); x.lineTo(sx + sw2 * 0.7, m - sw2); x.closePath(); x.fill(); }
    x.restore();
    fxHeartAt(x, x0 + S * 0.03, m - S * 0.045, S * 0.04, -0.6, Q[2], fxOl(Q[2]), 1); fxHeartAt(x, x0 + S * 0.03, m + S * 0.045, S * 0.04, Math.PI + 0.6, mixc(Q[2], '#ffffff', 0.3), fxOl(Q[2]), 1);
    fxHeartAt(x, L - hs * 0.95, m, hs, -Math.PI / 2, Q[1], fxOl(Q[1]), Math.max(1, S * 0.012)); fxShine(x, L - hs * 1.3, m - hs * 0.45, hs * 0.26);
  }
  return spr(outlineC(c, Math.max(1, S * 0.012), '#4a2a5a', 0.9), pad + S * 0.4, pad + m);
}
// 스킨 꼬리 색 (rainbow, candy는 특별 꼬리)
function fxSkTrail(sk, base) { return sk === 'heart' ? '#ff6fae' : sk === 'candy' ? 'candy' : base; }
// 스킨 꼬리 장식: 탄 뒤로 작은 하트나 사탕 두 개가 살랑이며 따라옴 (입자 대신 그 자리에서 그림)
function fxTrailDeco(x, sk, hx, hy, ang, L, S, t) {
  var ca = Math.cos(ang), sa = Math.sin(ang);
  for (var i = 0; i < 2; i++) {
    var dd = L * (0.42 + i * 0.36), wob = Math.sin(t * 22 + i * 2.1) * S * 0.05, px = hx - ca * dd - sa * wob, py = hy - sa * dd + ca * wob, d = S * (0.17 - i * 0.045);
    var img = sk === 'heart' ? fxImg('heart', i ? '#ffb0d4' : '#ff6fae', d) : fxImg('candy', i ? '#5fd8b4' : '#ff5d9e', d);
    x.globalAlpha = 0.95 - i * 0.3; x.drawImage(img, px - d / 2, py - d / 2, d, d);
  }
  x.globalAlpha = 1;
}
// 상점 카드 미리보기: 그 스킨 화살을 그린 px 정사각형 캔버스 (꼬리, 장식 포함, 배경 투명)
function fxProjPreview(id, px) {
  px = Math.max(24, Math.round(px || 96)); var sk = id === 'heart' || id === 'candy' ? id : 'base';
  var c = mkC(px, px), x = cx2(c), S = px * 0.82, ang = -0.62, ca = Math.cos(ang), sa = Math.sin(ang), sc = 1.3, hx = px * 0.62, hy = px * 0.4, L = px * 0.5, W = px * 0.17;
  var s = fxSpr(sk === 'base' ? 'arrow' : 'arrow@' + sk, S), half = s.ax * sc * 0.85, tx = hx - ca * half, ty = hy - sa * half;
  // 꼬리는 화살 뒤끝에서 뒤로
  x.globalAlpha = 1; x.setTransform(ca, sa, -sa, ca, tx, ty); x.drawImage(streakSpr(fxSkTrail(sk, '#ff8fc0')), -L, -W / 2, L, W); x.setTransform(1, 0, 0, 1, 0, 0);
  if (sk !== 'base') fxTrailDeco(x, sk, tx, ty, ang, L * 0.75, px * 0.9, 0.35);
  else { x.drawImage(fxImg('twk', '#ffd23a', px * 0.2), tx - ca * L * 0.55 - px * 0.1, ty - sa * L * 0.55 - px * 0.16, px * 0.2, px * 0.2); x.drawImage(fxImg('twk', '#ff8fc0', px * 0.2), tx - ca * L * 0.85 + px * 0.02, ty - sa * L * 0.85 - px * 0.02, px * 0.13, px * 0.13); }
  x.setTransform(ca * sc, sa * sc, -sa * sc, ca * sc, hx, hy); x.drawImage(s.c, -s.ax, -s.ay); x.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}
