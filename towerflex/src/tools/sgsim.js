// 확정 탑만으로 돌려 보기(STGA): node tools/sgsim.js [판 id ...]   (기본: c1s01 ~ c1s05)
// 시작 탑(archer, catapult, flak)과 그 판 앞까지의 확정 보상 탑만 쓰는 봇으로 돌린다(소환으로 얻는 탑 없음). 단계 상한은 UNLOCKS대로(c1s03 전 3, c1s08 전 5, 그 뒤 6), 능력 카드 있음
// 초반 판이 확정 탑만으로 깨지는지 보는 용도. 새 탑의 공격 로직(logic_towers2.js)이 없으면 그 탑은 봇 목록에서 빠진다
const ctx = require('./fdload.js')();
ctx.__ids = process.argv.slice(2).filter(a => /^c\d+s\d\d$/.test(a));
ctx.run(`
(function () {
  var ids = __ids.length ? __ids : ['c1s01', 'c1s02', 'c1s03', 'c1s04', 'c1s05'];
  var got = ['archer', 'catapult', 'flak'], won = {};
  MAPS.forEach(function (M, mi) {
    if (M.test) return;
    if (ids.indexOf(M.id) >= 0) {
      var allowed = got.filter(function (k) { return TOWER_ORDER.indexOf(k) >= 0 && (TOWER_ORDER.indexOf(k) < 10 || (typeof TW_ACT !== 'undefined' && TW_ACT[TOWERS[k].kind])); });
      var maxLv = won[UNLOCKS.ult] ? 6 : won[UNLOCKS.branch] ? 5 : 3;
      var g = newGame(mi, 'normal', { research: {}, skills: { rain: 1, wall: won.c1s01 ? 1 : 0, last: won.c1s02 ? 1 : 0 }, maxLv: maxLv, towers: allowed, cards: mi > 0 });
      var B = makeBot(g, { skill: 1, seed: mi * 31 + 5, allowed: allowed }), steps = 0;
      while (!g.over && steps < 60 * 60 * 40) { botTick(B, DT); stepGame(g, DT); g.ev.length = 0; steps++; }
      console.log(M.id + ' 확정 탑만 [' + allowed.join(' ') + '] 단계 ' + maxLv + ' -> ' + (g.over === 1 ? 'WIN ' + starsOf(g) + '*' : g.over === -1 ? 'LOSE' : 'TIMEOUT') + ' 생명 ' + g.lives + '/' + g.maxLives + ' 웨이브 ' + g.wave + '/' + g.N + ' ' + Math.round(g.t) + '초');
    }
    won[M.id] = 1; if (M.reward && M.reward.tower) got.push(M.reward.tower);
  });
})();
`);
