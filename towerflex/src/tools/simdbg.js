// 한 맵 웨이브별 자세히: node tools/simdbg.js 맵 난이도 실력 연구
const vm = require('vm');
const ctx = require('./fdload.js')();
ctx.__a = { mi: +process.argv[2], dk: process.argv[3] || 'normal', sk: +(process.argv[4] || 1), allR: process.argv[5] === '1' };
vm.runInContext(`
var A = __a, owned = {}; if (A.allR) RESEARCH.forEach(function (r) { owned[r.id] = 1; });
var g = newGame(A.mi, A.dk, { research: owned, skills: { rain: 1, wall: 1, last: 1 }, maxLv: 5 }), B = makeBot(g, { skill: A.sk, seed: 3 });
var lastW = 0, lk = {}, maxE = 0;
while (!g.over && g.t < 2400) {
  botTick(B, DT); stepGame(g, DT);
  g.ev.forEach(function (e) { if (e.t === 'leak') lk[e.k] = (lk[e.k] || 0) + e.n; });
  g.ev.length = 0; maxE = Math.max(maxE, g.enemies.length);
  if (g.wave !== lastW) {
    var W = g.waves[lastW] || { groups: [] };
    var tw = g.towers.map(function (t) { return t.k.slice(0, 4) + t.lvl + (t.lvl >= 4 ? 'AB'[t.br] : ''); }).join(',');
    console.log('W' + lastW + ' ' + (W.kind || '') + ' [' + W.groups.map(function (x) { return x.type + 'x' + x.n; }).join('+') + '] lives ' + g.lives + ' gold ' + g.gold + ' maxE ' + maxE + ' leaks ' + JSON.stringify(lk) + ' | ' + tw);
    lastW = g.wave; lk = {}; maxE = 0;
  }
}
console.log('END', g.over, 'lives', g.lives, 'wave', g.wave, 't', Math.round(g.t), JSON.stringify(lk));
`, ctx);
