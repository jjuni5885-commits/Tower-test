// ===== art_core.js : 캔버스 그림 도구 (빛, 그림자, 질감) =====
// 원칙: 검은 외곽선 없이 빛(왼쪽 위)과 그늘(오른쪽 아래), 테두리광, 접촉 그림자로 형태를 만든다
function mkC(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function cx2(c) { return c.getContext('2d'); }
var _tmpC = null;
function tmpCanvas(w, h) {
  if (!_tmpC) _tmpC = mkC(8, 8);
  if (_tmpC.width < w || _tmpC.height < h) { _tmpC.width = Math.max(_tmpC.width, Math.ceil(w)); _tmpC.height = Math.max(_tmpC.height, Math.ceil(h)); }
  var x = _tmpC.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, _tmpC.width, _tmpC.height);
  return _tmpC;
}
// 경로 + 경계 상자
function Shape() { this.p = new Path2D(); this.x0 = 1e9; this.y0 = 1e9; this.x1 = -1e9; this.y1 = -1e9; }
Shape.prototype.ext = function (x, y) { if (x < this.x0) this.x0 = x; if (y < this.y0) this.y0 = y; if (x > this.x1) this.x1 = x; if (y > this.y1) this.y1 = y; };
Shape.prototype.poly = function (pts) { var p = this.p; p.moveTo(pts[0][0], pts[0][1]); this.ext(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) { p.lineTo(pts[i][0], pts[i][1]); this.ext(pts[i][0], pts[i][1]); } p.closePath(); return this; };
Shape.prototype.blob = function (pts) { // 부드러운 닫힌 곡선
  var p = this.p, n = pts.length;
  var m0 = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
  p.moveTo(m0[0], m0[1]);
  for (var i = 0; i < n; i++) { var a = pts[i], b = pts[(i + 1) % n]; p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); this.ext(a[0], a[1]); }
  p.closePath(); return this;
};
Shape.prototype.ell = function (x, y, rx, ry, rot) { this.p.moveTo(x + rx * Math.cos(rot || 0), y + rx * Math.sin(rot || 0)); this.p.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); var R = Math.max(rx, ry); this.ext(x - R, y - R); this.ext(x + R, y + R); return this; };
Shape.prototype.rrect = function (x, y, w, h, r) { var p = this.p; r = Math.min(r, w / 2, h / 2); p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); this.ext(x, y); this.ext(x + w, y + h); return this; };
Shape.prototype.w = function () { return this.x1 - this.x0; };
Shape.prototype.h = function () { return this.y1 - this.y0; };
function shp() { return new Shape(); }

// 빛 방향(왼쪽 위 → 오른쪽 아래) 그라데이션 채우기
function litFill(x, s, base, o) {
  o = o || {};
  var hi = o.hi == null ? 0.28 : o.hi, lo = o.lo == null ? 0.42 : o.lo;
  var ax = s.x0 + s.w() * (o.ax == null ? 0.15 : o.ax), ay = s.y0 + s.h() * (o.ay == null ? 0.05 : o.ay);
  var bx = s.x0 + s.w() * (o.bx == null ? 0.9 : o.bx), by = s.y0 + s.h() * (o.by == null ? 1 : o.by);
  var g = x.createLinearGradient(ax, ay, bx, by);
  g.addColorStop(0, lit(base, hi)); g.addColorStop(o.mid == null ? 0.45 : o.mid, base); g.addColorStop(1, drk(base, lo));
  x.fillStyle = g; x.fill(s.p);
}
// 가로 방향 원통 음영 (탑 몸통처럼): 왼쪽 밝고 오른쪽 어둡고 맨 오른쪽 반사광
function cylFill(x, s, base, o) {
  o = o || {};
  var g = x.createLinearGradient(s.x0, 0, s.x1, 0);
  g.addColorStop(0, drk(base, 0.25)); g.addColorStop(0.18, lit(base, o.hi == null ? 0.25 : o.hi)); g.addColorStop(0.42, base);
  g.addColorStop(0.82, drk(base, o.lo == null ? 0.45 : o.lo)); g.addColorStop(1, drk(base, 0.3));
  x.fillStyle = g; x.fill(s.p);
}
// 안쪽 띠: 모양을 (dx,dy)만큼 밀어 빼면 반대편 가장자리만 남는다 → 테두리광, 그늘
function band(x, s, color, dx, dy, alpha) {
  var pad = Math.abs(dx) + Math.abs(dy) + 4, W = s.w() + pad * 2, H = s.h() + pad * 2;
  if (W <= 0 || H <= 0 || !isFinite(W)) return;
  var t = tmpCanvas(W, H), tx = t.getContext('2d');
  tx.translate(pad - s.x0, pad - s.y0);
  tx.fillStyle = color; tx.fill(s.p);
  tx.globalCompositeOperation = 'destination-out';
  tx.translate(dx, dy); tx.fill(s.p);
  x.save(); x.globalAlpha = alpha == null ? 1 : alpha; x.drawImage(t, 0, 0, W, H, s.x0 - pad, s.y0 - pad, W, H); x.restore();
}
function rim(x, s, color, d, alpha) { band(x, s, color, d, d, alpha); band(x, s, color, d * 0.5, d * 0.5, (alpha == null ? 1 : alpha) * 0.6); }
function coreShadow(x, s, color, d, alpha) { band(x, s, color, -d, -d * 0.8, alpha); }
// 모양 안에 점 질감
function speckle(x, s, n, cols, r0, r1, rnd, alpha) {
  x.save(); x.clip(s.p); x.globalAlpha = alpha == null ? 0.35 : alpha;
  for (var i = 0; i < n; i++) {
    var px = s.x0 + rnd() * s.w(), py = s.y0 + rnd() * s.h(), r = r0 + rnd() * (r1 - r0);
    x.fillStyle = cols[Math.floor(rnd() * cols.length)];
    x.beginPath(); x.ellipse(px, py, r, r * (0.6 + rnd() * 0.5), rnd() * 3, 0, Math.PI * 2); x.fill();
  }
  x.restore();
}
// 땅에 드리운 부드러운 그림자
function softShadow(x, cx, cy, rx, ry, a) {
  if (rx <= 0 || ry <= 0) return;
  x.save(); x.translate(cx, cy); x.scale(1, ry / rx);
  var g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, 'rgba(10,8,20,' + a + ')'); g.addColorStop(0.55, 'rgba(10,8,20,' + a * 0.6 + ')'); g.addColorStop(1, 'rgba(10,8,20,0)');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, Math.PI * 2); x.fill(); x.restore();
}
function glowAt(x, cx, cy, r, col, a) {
  var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(0.4, rgba(col, a * 0.45)); g.addColorStop(1, rgba(col, 0));
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
}
// 굵기가 변하는 선(가지, 팔다리)
function taper(x, x0, y0, x1, y1, w0, w1, col) {
  var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  x.fillStyle = col; x.beginPath();
  x.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); x.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  var a = Math.atan2(ny, nx);
  x.arc(x1, y1, w1 / 2, a, a - Math.PI, true);
  x.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  x.arc(x0, y0, w0 / 2, a + Math.PI, a, true);
  x.closePath(); x.fill();
}
function limbShape(x0, y0, x1, y1, w0, w1) {
  var s = shp(), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, p = s.p;
  p.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); p.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  var a = Math.atan2(ny, nx); // 끝은 바깥으로 볼록하게 (예전에는 안쪽으로 파였음)
  p.arc(x1, y1, w1 / 2, a, a - Math.PI, true);
  p.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  p.arc(x0, y0, w0 / 2, a + Math.PI, a, true);
  p.closePath();
  var m = Math.max(w0, w1); s.ext(Math.min(x0, x1) - m, Math.min(y0, y1) - m); s.ext(Math.max(x0, x1) + m, Math.max(y0, y1) + m);
  return s;
}
// 입체 팔다리: 그라데이션 + 테두리광
function limb(x, x0, y0, x1, y1, w0, w1, col, o) {
  var s = limbShape(x0, y0, x1, y1, w0, w1);
  litFill(x, s, col, { hi: 0.22, lo: 0.4 });
  if (!o || !o.norim) rim(x, s, lit(col, 0.55), Math.max(0.6, w0 * 0.12), 0.5);
  return s;
}
// 금속 하이라이트 줄
function specLine(x, x0, y0, x1, y1, w, a) {
  x.save(); x.globalAlpha = a == null ? 0.7 : a; x.strokeStyle = '#fffaf0'; x.lineWidth = w; x.lineCap = 'round';
  x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.restore();
}
// 반짝이 빛 덩어리 스프라이트(가산 혼합용)
var GLOW = {};
function glowSpr(col, r) {
  var k = col + ':' + r; if (GLOW[k]) return GLOW[k];
  var c = mkC(r * 2, r * 2), x = cx2(c), g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, rgba(lit(col, 0.6), 1)); g.addColorStop(0.18, rgba(col, 0.85)); g.addColorStop(0.5, rgba(col, 0.28)); g.addColorStop(1, rgba(col, 0));
  x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
  return (GLOW[k] = c);
}
var SOFT = {};
function softSpr(col, r) {
  var k = col + ':' + r; if (SOFT[k]) return SOFT[k];
  var c = mkC(r * 2, r * 2), x = cx2(c), g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, rgba(col, 0.9)); g.addColorStop(0.5, rgba(col, 0.5)); g.addColorStop(1, rgba(col, 0));
  x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
  return (SOFT[k] = c);
}
// 흰 실루엣(맞을 때 번쩍)
function silhouette(src, col) {
  var c = mkC(src.width, src.height), x = cx2(c);
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col || '#ffffff'; x.fillRect(0, 0, c.width, c.height);
  return c;
}
// 테두리: 실루엣을 8방향으로 r만큼 밀어 깔고 원본을 위에 그림 (작은 화면에서 배경과 또렷하게 구분)
function outlineC(src, r, col, a) {
  var c = mkC(src.width, src.height), x = cx2(c), sil = silhouette(src, col);
  x.globalAlpha = a == null ? 1 : a;
  for (var i = 0; i < 8; i++) { var an = i * Math.PI / 4; x.drawImage(sil, Math.cos(an) * r, Math.sin(an) * r); }
  x.globalAlpha = 1; x.drawImage(src, 0, 0);
  return c;
}
// 스프라이트: {c, ax, ay}
function spr(c, ax, ay) { return { c: c, ax: ax, ay: ay }; }
function drawSpr(x, s, px, py, flip, sc) {
  if (!s || s.empty) return;
  sc = sc || 1;
  if (flip) { x.save(); x.translate(px, py); x.scale(-sc, sc); x.drawImage(s.c, -s.ax, -s.ay); x.restore(); }
  else if (sc !== 1) { x.save(); x.translate(px, py); x.scale(sc, sc); x.drawImage(s.c, -s.ax, -s.ay); x.restore(); }
  else x.drawImage(s.c, px - s.ax, py - s.ay);
}
// 돌 블록 쌓기 무늬(원통 옆면에)
function stoneCourses(x, s, base, rows, cols, rnd, mortar) {
  x.save(); x.clip(s.p);
  var h = s.h() / rows;
  for (var r = 0; r < rows; r++) {
    var y0 = s.y0 + r * h, off = (r % 2) * 0.5;
    for (var c = -1; c <= cols; c++) {
      var u0 = (c + off) / cols, u1 = (c + 1 + off) / cols;
      if (u1 < 0 || u0 > 1) continue;
      var xa = s.x0 + s.w() * Math.max(0, u0), xb = s.x0 + s.w() * Math.min(1, u1);
      // 원통 곡률: 가장자리 블록은 좁게 보이도록 코사인 투영
      var pa = s.x0 + s.w() * (0.5 - 0.5 * Math.cos(Math.max(0, u0) * Math.PI)), pb = s.x0 + s.w() * (0.5 - 0.5 * Math.cos(Math.min(1, u1) * Math.PI));
      xa = pa; xb = pb;
      var v = (rnd() - 0.5) * 0.16;
      x.fillStyle = v > 0 ? rgba(lit(base, 0.5), v) : rgba(drk(base, 0.6), -v);
      x.fillRect(xa + 0.5, y0 + 0.5, xb - xa - 1, h - 1);
    }
    x.fillStyle = rgba(mortar || drk(base, 0.55), 0.55); x.fillRect(s.x0, y0, s.w(), Math.max(0.8, h * 0.08));
  }
  x.restore();
}
function woodGrain(x, s, base, n, rnd, vertical) {
  x.save(); x.clip(s.p); x.lineWidth = Math.max(0.6, s.w() * 0.015);
  for (var i = 0; i < n; i++) {
    x.strokeStyle = rgba(rnd() < 0.5 ? drk(base, 0.5) : lit(base, 0.3), 0.25 + rnd() * 0.2);
    x.beginPath();
    if (vertical) { var px = s.x0 + rnd() * s.w(); x.moveTo(px, s.y0); x.bezierCurveTo(px + (rnd() - 0.5) * 4, s.y0 + s.h() * 0.3, px + (rnd() - 0.5) * 4, s.y0 + s.h() * 0.7, px, s.y1); }
    else { var py = s.y0 + rnd() * s.h(); x.moveTo(s.x0, py); x.bezierCurveTo(s.x0 + s.w() * 0.3, py + (rnd() - 0.5) * 3, s.x0 + s.w() * 0.7, py + (rnd() - 0.5) * 3, s.x1, py); }
    x.stroke();
  }
  x.restore();
}

// 매 프레임 그리는 그림자는 미리 구운 타원으로
var _SHD = null;
function shadowAt(x, cx, cy, rx, ry, a) {
  if (rx <= 0 || ry <= 0) return;
  if (!_SHD) { _SHD = mkC(64, 64); var sx = cx2(_SHD), g = sx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(10,8,20,1)'); g.addColorStop(0.55, 'rgba(10,8,20,0.6)'); g.addColorStop(1, 'rgba(10,8,20,0)'); sx.fillStyle = g; sx.fillRect(0, 0, 64, 64); }
  var o = x.globalAlpha; x.globalAlpha = o * a; x.drawImage(_SHD, cx - rx, cy - ry, rx * 2, ry * 2); x.globalAlpha = o;
}

// 투명한 가장자리 잘라 내기 (그리는 면적이 줄어 빨라짐)
function trimSpr(s) {
  if (!s || !s.c) return s;
  var c = s.c, w = c.width, h = c.height, d = cx2(c).getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (var y = 0; y < h; y++) { var row = y * w * 4; for (var x = 0; x < w; x++) if (d[row + x * 4 + 3] > 3) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0) { s.empty = 1; return s; }
  x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(w - 1, x1 + 1); y1 = Math.min(h - 1, y1 + 1);
  var nc = mkC(x1 - x0 + 1, y1 - y0 + 1); cx2(nc).drawImage(c, x0, y0, nc.width, nc.height, 0, 0, nc.width, nc.height);
  return { c: nc, ax: s.ax - x0, ay: s.ay - y0 };
}
