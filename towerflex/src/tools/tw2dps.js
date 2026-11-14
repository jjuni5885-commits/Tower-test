// 탑 화력 표(ENG2): node tools/tw2dps.js [탑 키,...] [md]
// 시험용 판에서 움직이지 않는 허수아비(체력 1천만)에게 30초 쏴서 초당 피해를 잰다(화상, 독, 장판 포함).
// 칸: 값 = 그 단계까지 든 금화, 땅1 = 땅 적 1명, 땅5 = 땅 적 5명(0.4칸 간격) 합계, 갑옷 = 갑옷 0.6인 땅 적 1명, 하늘1, 바다1, 효율 = 가장 잘 맞는 영역의 1명 피해 / 값 x 100
const ctx = require('./tw2lib.js')();
ctx.__only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : null;
ctx.run(`
(function () {
  var rows = [], keys = (__only || TOWER_ORDER.concat(TW2_ADMIN).concat(FUSIONS.map(function (f) { return f.to; })));
  function r0(v) { return v < 0 ? '-' : v < 10 ? (Math.round(v * 10) / 10) : Math.round(v); }
  console.log('| 탑 | 단계 | 값 | 땅1 | 땅5 | 갑옷 | 하늘1 | 바다1 | 효율 |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  keys.forEach(function (k) {
    var T = TOWERS[k], lv = T.br.length ? [[1, 0], [3, 0], [5, 0], [6, 0], [5, 1], [6, 1]] : [[1, 0], [2, 0], [3, 0]];
    lv.forEach(function (q) {
      var hit = (towerStats(k, q[0], q[1]).hit || fdHit(k)), cost = tw2Cost(k, q[0], q[1]);
      if (T.fusion) { var P = fzParts(k); cost = tw2Cost(P[0], 5, 0) + tw2Cost(P[1], 5, 0) + (q[0] > 1 ? T.lv[1].cost : 0) + (q[0] > 2 ? T.lv[2].cost : 0); }
      var g1 = hit.indexOf('g') >= 0 ? tw2Dps(k, q[0], q[1], 'g', 1) : -1, g5 = hit.indexOf('g') >= 0 ? tw2Dps(k, q[0], q[1], 'g', 5) : -1, ar = hit.indexOf('g') >= 0 ? tw2Dps(k, q[0], q[1], 'g', 1, 'tw2DumArm') : -1;
      var a1 = hit.indexOf('a') >= 0 ? tw2Dps(k, q[0], q[1], 'a', 1) : -1, s1 = hit.indexOf('s') >= 0 ? tw2Dps(k, q[0], q[1], 's', 1) : -1;
      var best = Math.max(g1, a1, s1), nm = q[0] >= 4 && T.br.length ? towerTitle(k, q[0], q[1]) : T.name;
      console.log('| ' + nm + ' (' + k + ') | ' + q[0] + (q[0] >= 4 && T.br.length ? 'AB'[q[1]] : '') + ' | ' + cost + ' | ' + r0(g1) + ' | ' + r0(g5) + ' | ' + r0(ar) + ' | ' + r0(a1) + ' | ' + r0(s1) + ' | ' + (cost ? r0(best / cost * 100) : '-') + ' |');
    });
  });
})();
`);
