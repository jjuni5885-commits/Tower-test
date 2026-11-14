// TW3 그림 시험 쪽 만들기: node tools/tw3test.js → out/tw3_test.html (그림 관련 파일만 전역으로 이어 붙임)
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const S = p => fs.readFileSync(path.join(R, 'src', p), 'utf8');
const files = ['util.js', 'data.js', 'data_towers2.js', 'art_core.js', 'art_tower.js', 'art_tower3.js'];
const test = `
var T3T = {
  LOOKS: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [4, 1], [5, 1], [6, 1]],
  bg: function (x, w, h, water) {
    x.fillStyle = water ? '#3f9fd6' : '#86c96a'; x.fillRect(0, 0, w, h);
  },
  cell: function (x, X, Y, S, water) { // 칸 자리(탑 기준점은 칸 가운데에서 0.3칸 아래)
    x.save(); x.fillStyle = water ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.16)'; x.fillRect(X - S / 2, Y - S * 0.8, S, S); x.restore();
  },
  one: function (x, k, L, B, S, X, Y, st, time) {
    var info = towerSpr(k, L, B, S), kk = info.k || 1, t = { k: k, lvl: L, br: B, aim: -0.6, fireT: 0, shots: 0, id: 3, born: -9, side: 0 };
    if (st) for (var q in st) t[q] = st[q];
    drawSpr(x, info.back, X, Y); drawTowerParts(x, t, X, Y, S * kk, time == null ? 0.3 : time, info, null); drawSpr(x, info.front, X, Y);
    return info;
  },
  sheet: function (keys, S, st, time) {
    var cw = Math.round(S * 2.3), ch = Math.round(S * 2.7), c = mkC(cw * 9, ch * keys.length), x = cx2(c);
    keys.forEach(function (k, r) {
      var water = TOWERS[k].site === 'water';
      x.save(); x.beginPath(); x.rect(0, r * ch, c.width, ch); x.clip(); T3T.bg(x, c.width, (r + 1) * ch, water); x.restore();
      T3T.LOOKS.forEach(function (lk, j) { var X = j * cw + cw / 2, Y = r * ch + ch * 0.8; T3T.cell(x, X, Y, S, water); T3T.one(x, k, lk[0], lk[1], S, X, Y, st, time); });
    });
    return c.toDataURL();
  },
  aim: function (k, looks, S, st) {
    var cw = Math.round(S * 2.3), ch = Math.round(S * 2.7), c = mkC(cw * 8, ch * looks.length), x = cx2(c), water = TOWERS[k].site === 'water';
    T3T.bg(x, c.width, c.height, water);
    looks.forEach(function (lk, r) { for (var j = 0; j < 8; j++) { var X = j * cw + cw / 2, Y = r * ch + ch * 0.8, s2 = { aim: j * Math.PI / 4 }; if (st) for (var q in st) s2[q] = st[q]; T3T.cell(x, X, Y, S, water); T3T.one(x, k, lk[0], lk[1], S, X, Y, s2); } });
    return c.toDataURL();
  },
  fire: function (k, looks, S, aim) {
    var F = [[0, 0], [0.35, 1], [0.27, 1], [0.18, 2], [0.09, 3], [0.02, 5], [0, 5], [0.3, 9]];
    var cw = Math.round(S * 2.3), ch = Math.round(S * 2.7), c = mkC(cw * F.length, ch * looks.length), x = cx2(c), water = TOWERS[k].site === 'water';
    T3T.bg(x, c.width, c.height, water);
    looks.forEach(function (lk, r) {
      var tw = { k: k, lvl: lk[0], br: lk[1], aim: aim == null ? 0.5 : aim, fireT: 0, shots: 0, id: 3, born: -9, side: 0 }, info = towerSpr(k, lk[0], lk[1], S), kk = info.k || 1;
      F.forEach(function (f, j) { var X = j * cw + cw / 2, Y = r * ch + ch * 0.8; T3T.cell(x, X, Y, S, water); tw.fireT = f[0]; tw.shots = f[1]; tw.out = j === 7 ? 1 : 0;
        drawSpr(x, info.back, X, Y); drawTowerParts(x, tw, X, Y, S * kk, 1 + j * 0.12, info, null); drawSpr(x, info.front, X, Y); });
    });
    return c.toDataURL();
  },
  takeoff: function (k, looks, S) { // 비행기 나감(0→1)과 돌아옴(1→0) 장면
    var F = [[0, 0], [1, 0.05], [1, 0.2], [1, 0.35], [1, 0.5], [1, 2], [0, 2.05], [0, 2.3], [0, 2.5], [0, 3]], cw = Math.round(S * 2.3), ch = Math.round(S * 2.7), c = mkC(cw * F.length, ch * looks.length), x = cx2(c);
    T3T.bg(x, c.width, c.height, 0);
    looks.forEach(function (lk, r) { var tw = { k: k, lvl: lk[0], br: lk[1], aim: 0, fireT: 0, shots: 0, id: 3, born: -9 }, info = towerSpr(k, lk[0], lk[1], S);
      F.forEach(function (f, j) { var X = j * cw + cw / 2, Y = r * ch + ch * 0.8; tw.out = f[0]; drawSpr(x, info.back, X, Y); drawTowerParts(x, tw, X, Y, S * (info.k || 1), 10 + f[1], info, null); drawSpr(x, info.front, X, Y); }); });
    return c.toDataURL();
  },
  units: function (S) {
    var cw = Math.round(S * 1.5), c = mkC(cw * 8, cw * 4 + cw * 3 + 20), x = cx2(c);
    x.fillStyle = '#86c96a'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#3f9fd6'; x.fillRect(0, cw * 3, c.width, cw);
    for (var v = 0; v < 4; v++) { var p = t3PlaneSpr(v, S); for (var j = 0; j < 8; j++) { x.save(); x.translate(j * cw + cw / 2, v * cw + cw / 2); x.rotate(j * Math.PI / 4); x.drawImage(p.c, -p.ax, -p.ay); x.restore(); } }
    for (var w = 0; w < 3; w++) { var f = t3SoldierFrames(w, S), all = f.fr.concat(f.atk); all.forEach(function (s, j) { var X = j * cw + cw / 2, Y = cw * 4 + w * cw + cw * 0.8; x.fillStyle = 'rgba(255,255,255,0.16)'; x.fillRect(X - S / 2, Y - S * 0.8, S, S); drawSpr(x, s, X, Y); });
      drawSpr(x, f.fr[0], 6 * cw + cw / 2, cw * 4 + w * cw + cw * 0.8, true); }
    return c.toDataURL();
  },
  bench: function (keys, S) {
    var out = {};
    keys.forEach(function (k) { T3T.LOOKS.forEach(function (lk) { towerSpr(k, lk[0], lk[1], S + 1); }); });
    keys.forEach(function (k) { var mx = 0, sum = 0, all = []; T3T.LOOKS.forEach(function (lk) { var best = 1e9; for (var n = 0; n < 3; n++) { for (var q in TOWER_SPR) delete TOWER_SPR[q]; var t0 = performance.now(); towerSpr(k, lk[0], lk[1], S); best = Math.min(best, performance.now() - t0); } sum += best; all.push(Math.round(best)); if (best > mx) mx = best; }); out[k] = [+(sum / 9).toFixed(1), +mx.toFixed(1), all.join(' ')]; });
    return out;
  },
  partBench: function (k, L, B, S, n) {
    var c = mkC(S * 3, S * 4), x = cx2(c), info = towerSpr(k, L, B, S), t = { k: k, lvl: L, br: B, aim: 0.3, fireT: 0.2, shots: 3, id: 3, born: -9 }, t0 = performance.now();
    for (var i = 0; i < n; i++) { t.aim = i * 0.1; t.fireT = (i % 20) / 60; drawTowerParts(x, t, S * 1.5, S * 3, S * (info.k || 1), i / 60, info, null); }
    x.getImageData(0, 0, 1, 1); return +((performance.now() - t0) / n).toFixed(3);
  },
  icons: function (keys, px) {
    var c = mkC(px * 9, px * keys.length), x = cx2(c); x.fillStyle = '#fff6e8'; x.fillRect(0, 0, c.width, c.height);
    keys.forEach(function (k, r) { T3T.LOOKS.forEach(function (lk, j) { x.strokeStyle = '#d8c8b0'; x.strokeRect(j * px + 0.5, r * px + 0.5, px - 1, px - 1); x.drawImage(towerIcon(k, lk[0], lk[1], px), j * px, r * px); }); });
    return c.toDataURL();
  }
};
window.T3T = T3T;
`;
const html = '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#222}</style></head><body><script>\n' + files.map(f => '// ---- ' + f + ' ----\n' + S(f)).join('\n').replace(/<\/script/gi, '<\\/script') + '\n' + test + '\n</script></body></html>';
fs.writeFileSync(path.join(R, 'out', 'tw3_test.html'), html);
console.log('tw3_test.html', Math.round(html.length / 1024) + 'KB');
