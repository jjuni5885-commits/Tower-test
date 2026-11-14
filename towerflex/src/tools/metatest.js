// [BM] 광고 이어하기 논리 시험: node tools/metatest.js
// 진 판(over -1)을 metaRevive(g, 3)로 살리면 생명 3으로 그 자리에서 이어지고, 다시 지면 다시 끝나며, 한 판에 한 번만 됨
const vm = require('vm');
const ctx = require('./fdload.js')();
vm.runInContext(`
var fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); }
function count(g, t) { return g.ev.filter(function (e) { return e.t === t; }).length; }
var T1 = fdT('t1');   // 시험 판(tools/teststages.js)
// 탑 없이 웨이브를 계속 불러 일부러 지게
function runToLose(g, maxSec) { var n = Math.round(maxSec / DT); for (var i = 0; i < n && !g.over; i++) { stepGame(g, DT); if (!g.waiting && g.wave < g.N && (g.nextT <= 0 || fieldClear(g))) callEarly(g); } }

// 1) 지면 over -1, lose 사건 한 번
var g = newGame(T1, 'normal', { cards: false }); callEarly(g);
runToLose(g, 600);
ok(g.over === -1 && g.lives === 0, '탑 없이 지면 over -1, 생명 0 (웨이브 ' + g.wave + ')');
ok(count(g, 'lose') === 1, "'lose' 사건 한 번");
g.ev.length = 0;
var aliveBefore = g.enemies.filter(function (e) { return !e.dead; }).length, waveBefore = g.wave, goldBefore = g.gold, towersBefore = g.towers.length;
var dBefore = g.enemies.map(function (e) { return { e: e, d: e.d, left: e.P.len - e.d }; });
var nearGate = dBefore.filter(function (q) { return q.left < 2; }).length;

// 2) 이어하기
ok(metaRevive(g, 3) === true, 'metaRevive 성공');
ok(g.over === 0 && g.lives === 3 && g.revives === 1, '끝난 상태 해제, 생명 3');
ok(g.wave === waveBefore && g.gold === goldBefore && g.towers.length === towersBefore, '웨이브, 금화, 탑은 그대로');
ok(g.enemies.every(function (e) { return e.dead || e.stunT > 0; }), '남은 적 ' + aliveBefore + '마리는 잠깐 멈춤');
ok(dBefore.every(function (q) { return Math.abs(q.e.d - Math.max(0, q.d - (q.e.boss ? 1 : 2))) < 1e-9; }), '남은 적은 길을 따라 2칸 물러남 (성문 2칸 안에 있던 적 ' + nearGate + '마리)');
ok(g.enemies.every(function (e) { return e.dead || e.P.len - e.d >= 2 - 1e-9; }), '물러난 뒤 성문 2칸 안에 적 없음');
ok(count(g, 'cont') === 1, "'cont' 사건");
ok(metaRevive(g, 3) === false, '진 상태가 아니면 이어하기 안 됨');

// 3) 실제로 이어짐: 시간이 흐르고 적이 움직이며 다시 지면 다시 끝남
var t0 = g.t, d0 = g.enemies.length ? g.enemies[0].d : 0;
for (var i = 0; i < 240; i++) stepGame(g, DT);
ok(g.t > t0 + 3.9, '시간이 흐름 (' + (g.t - t0).toFixed(2) + '초)');
ok(!g.enemies.length || g.enemies[0].d > d0 || g.over, '멈춤이 풀린 뒤 적이 다시 움직임');
g.ev.length = 0;
runToLose(g, 600);
ok(g.over === -1 && g.lives === 0, '다시 지면 over -1');
ok(count(g, 'lose') === 1, "다시 'lose' 사건 한 번");
ok(metaRevive(g, 3) === false, '한 판에 한 번만');

// 4) 진행 중이거나 이긴 판은 이어하기 불가
var g2 = newGame(T1, 'normal', { cards: false }); ok(metaRevive(g2, 3) === false, '진행 중인 판은 불가');
g2.over = 1; ok(metaRevive(g2, 3) === false, '이긴 판은 불가');

// 5) 이어한 뒤 끝까지 막으면 승리 (봇), 별은 생명 비율대로
var g3 = newGame(T1, 'normal', { maxLv: 5, cards: false }); callEarly(g3); g3.lives = 1;
runToLose(g3, 600);
ok(g3.over === -1, '생명 1로 시작해 짐');
metaRevive(g3, 3); g3.gold = 6000;
var B = makeBot(g3, {}), n3 = 0;
while (!g3.over && n3 < 60 * 60 * 20) { botTick(B, DT); stepGame(g3, DT); g3.ev.length = 0; n3++; }
ok(g3.over === 1 && g3.wave === g3.N, '이어한 뒤 봇이 끝까지 막아 승리 (over ' + g3.over + ', 웨이브 ' + g3.wave + '/' + g3.N + ', 생명 ' + g3.lives + ')');
ok(starsOf(g3) === 1, '별은 생명 비율대로 (' + starsOf(g3) + '개)');
console.log(fails ? 'FAILS ' + fails : 'ALL OK');
`, ctx);
