// ===== tf_art_map.js : 타임플렉스 지형 테마 등록 (tf_data.js TF_THEMES를 기본 테마에 덮어 THEME에 넣음) =====
(function () {
  for (var k in TF_THEMES) {
    var D = TF_THEMES[k], B = THEME[D.base] || THEME.meadow, o = {};
    for (var q in B) o[q] = B[q];
    for (var q2 in D) if (q2 !== 'base') o[q2] = D[q2];
    o.tfBase = D.base; THEME[k] = o;
  }
})();
// ---------- 시간의 문 (모든 시대의 지킬 곳): 돌 고리 안에 푸른 시간 소용돌이, 위에 시계 바늘, 양옆 돌기둥 ----------
// 시대마다 고리 둘레 장식만 바꿈(원시: 소뼈와 깃털)
function tfGateSpr(S, th) {
  var key = 'tfgate:' + th + ':' + Math.round(S); if (PROP_CACHE[key]) return PROP_CACHE[key];
  var o = canvasFor(S, 2.4, 2.6, 0.88), x = o.x, gx = o.gx, gy = o.gy, R = S * 0.62, cy = gy - S * 0.78, lw = Math.max(1.5, S * 0.035), i;
  x.lineCap = 'round'; x.lineJoin = 'round';
  // 그림자와 받침 돌
  x.save(); x.translate(gx, gy); x.scale(1, 0.32); glowAt(x, 0, 0, S * 1.0, '#000000', 0.35); x.restore();
  x.fillStyle = '#8e877c'; x.strokeStyle = '#2a2230'; x.lineWidth = lw;
  x.beginPath(); x.ellipse(gx, gy - S * 0.05, S * 0.95, S * 0.22, 0, 0, Math.PI * 2); x.fill(); x.stroke();
  // 기둥 둘
  [-1, 1].forEach(function (sd) { var px = gx + sd * R * 0.98; x.fillStyle = '#9a92a0'; x.fillRect(px - S * 0.12, cy, S * 0.24, gy - cy - S * 0.08); x.strokeRect(px - S * 0.12, cy, S * 0.24, gy - cy - S * 0.08); x.fillStyle = '#b4acb8'; x.fillRect(px - S * 0.15, cy - S * 0.02, S * 0.3, S * 0.08); x.strokeRect(px - S * 0.15, cy - S * 0.02, S * 0.3, S * 0.08); });
  // 소용돌이
  var g = x.createRadialGradient(gx, cy, 0, gx, cy, R * 0.82); g.addColorStop(0, '#f2ffff'); g.addColorStop(0.35, '#7ff4ff'); g.addColorStop(0.75, '#2a6ad0'); g.addColorStop(1, '#1a1a5a');
  x.fillStyle = g; x.beginPath(); x.arc(gx, cy, R * 0.82, 0, Math.PI * 2); x.fill();
  x.save(); x.beginPath(); x.arc(gx, cy, R * 0.82, 0, Math.PI * 2); x.clip();
  for (i = 0; i < 5; i++) { x.strokeStyle = 'rgba(200,252,255,' + (0.3 + i * 0.1) + ')'; x.lineWidth = Math.max(1, S * (0.03 + i * 0.008)); x.beginPath(); x.arc(gx, cy, R * (0.18 + i * 0.13), i * 1.1, i * 1.1 + 2.3); x.stroke(); }
  x.restore();
  // 돌 고리와 눈금
  x.strokeStyle = '#2a2230'; x.lineWidth = R * 0.26 + lw * 2; x.beginPath(); x.arc(gx, cy, R * 0.95, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = '#7a7284'; x.lineWidth = R * 0.26; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = R * 0.06; x.beginPath(); x.arc(gx, cy, R * 1.0, Math.PI * 1.1, Math.PI * 1.6); x.stroke();
  for (i = 0; i < 12; i++) { var a = i * Math.PI / 6 - Math.PI / 2; x.fillStyle = i % 3 ? '#b8b0c4' : '#ffd24a'; x.strokeStyle = '#2a2230'; x.lineWidth = Math.max(1, lw * 0.6); x.beginPath(); x.arc(gx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95, S * (i % 3 ? 0.035 : 0.055), 0, Math.PI * 2); x.fill(); x.stroke(); }
  // 시계 바늘
  function hand(a, L, w) { x.save(); x.translate(gx, cy); x.rotate(a); x.fillStyle = '#20202e'; x.beginPath(); x.moveTo(-w, 0); x.lineTo(0, -L); x.lineTo(w, 0); x.lineTo(0, L * 0.2); x.closePath(); x.fill(); x.fillStyle = '#ffd24a'; x.beginPath(); x.moveTo(-w * 0.5, -L * 0.72); x.lineTo(0, -L); x.lineTo(w * 0.5, -L * 0.72); x.closePath(); x.fill(); x.restore(); }
  hand(-0.6, R * 0.6, S * 0.06); hand(1.0, R * 0.74, S * 0.04); x.fillStyle = '#ffd24a'; x.beginPath(); x.arc(gx, cy, S * 0.06, 0, Math.PI * 2); x.fill();
  // 원시: 고리 위 소뼈, 기둥에 깃털
  var T = THEME[th] || {};
  if (/^prim/.test(th)) {
    var sx = gx, sy = cy - R * 1.12, s = S * 0.13;
    x.fillStyle = '#efe4c8'; x.strokeStyle = '#2a2230'; x.lineWidth = Math.max(1, lw * 0.7);
    x.beginPath(); x.ellipse(sx, sy, s, s * 0.9, 0, 0, Math.PI * 2); x.fill(); x.stroke();
    [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(sx + sd * s * 0.7, sy - s * 0.4); x.quadraticCurveTo(sx + sd * s * 2.0, sy - s * 0.8, sx + sd * s * 1.8, sy - s * 1.8); x.lineWidth = s * 0.45 + lw; x.strokeStyle = '#2a2230'; x.stroke(); x.lineWidth = s * 0.45; x.strokeStyle = '#efe4c8'; x.stroke(); });
    x.fillStyle = '#2a1810'; x.beginPath(); x.arc(sx - s * 0.35, sy - s * 0.1, s * 0.18, 0, 7); x.arc(sx + s * 0.35, sy - s * 0.1, s * 0.18, 0, 7); x.fill();
    [-1, 1].forEach(function (sd) { var px = gx + sd * R * 0.98; ['#d9463c', '#f3b630'].forEach(function (c2, j) { x.fillStyle = c2; x.strokeStyle = '#2a2230'; x.lineWidth = Math.max(1, lw * 0.5); x.beginPath(); x.ellipse(px + sd * S * (0.1 + j * 0.06), cy + S * 0.2 + j * S * 0.08, S * 0.04, S * 0.13, sd * 0.4, 0, Math.PI * 2); x.fill(); x.stroke(); }); });
  }
  glowAt(x, gx, cy, R * 1.3, '#5ff0ff', 0.25);
  return (PROP_CACHE[key] = trimSpr(spr(o.c, gx, gy)));
}
(function () { var base = gateSpr; gateSpr = function (S, th) { var T = THEME[th]; return T && T.tfBase ? tfGateSpr(S, th) : base(S, th); }; })();
