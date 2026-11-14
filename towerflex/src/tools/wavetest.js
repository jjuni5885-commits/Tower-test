// 웨이브 정비 시간 시험(v4.4, 귀염판 v1.1): node tools/wavetest.js .  (인자는 프로젝트 루트)
const vm = require('vm');
const ctx = require('./fdload.js')(process.argv[2]);
vm.runInContext(`
var fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); }
function alive(g) { return g.enemies.filter(function (e) { return !e.dead; }).length; }
function run(g, sec, stopFn) { var n = Math.round(sec / DT); for (var i = 0; i < n; i++) { stepGame(g, DT); if (stopFn && stopFn(g)) return true; } return false; }
function clears(g) { return g.ev.filter(function (e) { return e.t === 'clear'; }).length; }
var T1 = fdT('t1');   // 시험 판(tools/teststages.js)

// 1) 수동(기본): 시간이 다 돼도 적이 남아 있으면 다음 웨이브가 오지 않는다
var g = newGame(T1, 'normal', { cards: false });
ok(g.autoWave === false, '기본은 자동 시작 꺼짐');
callEarly(g); ok(g.wave === 1, '전투 시작으로 1웨이브');
var overlapped = false, sawTimerOut = false;
run(g, 120, function (g) { if (g.nextT <= 0 && alive(g) > 0) sawTimerOut = true; if (g.wave > 1) { overlapped = true; return true; } return g.over || (fieldClear(g) && g.clearT > 10); });
ok(sawTimerOut, '시간이 다 됐을 때 적이 남아 있던 순간이 있었음 (시험 조건 성립)');
ok(!overlapped && g.wave === 1, '적이 남아 있는 동안 2웨이브가 끼어들지 않음');
ok(fieldClear(g) && g.clearT > 10, '정리 후 10초 넘게 기다려도 자동으로 시작하지 않음');
ok(clears(g) === 1, "정리 알림('clear')은 한 번만");
var gold0 = g.gold, b = callEarly(g);
ok(g.wave === 2 && b === 0 && g.gold === gold0, '시간 지난 뒤 누르면 보너스 없이 바로 2웨이브');

// 2) 일찍 부르기 보너스는 그대로
var g2 = newGame(T1, 'normal', { cards: false }); callEarly(g2); run(g2, 2);
var t2 = g2.nextT, exp = earlyBonus(g2), gold2 = g2.gold, b2 = callEarly(g2);
ok(t2 > 0 && b2 > 0 && b2 === exp && g2.gold === gold2 + b2 && g2.wave === 2, '일찍 부르면 남은 시간만큼 금화 (+' + b2 + ')');

// 3) 자동 시작 켜짐: 적을 다 잡고 AUTO_GAP초 뒤 시작, 겹치지 않음
var g3 = newGame(T1, 'normal', { autoWave: true, cards: false }); callEarly(g3);
var clearAt = -1, startAt = -1, aliveAtStart = -1;
for (var i3 = 0; i3 < 200 / DT && !g3.over; i3++) {
  var before = alive(g3);  // 다음 웨이브는 한 걸음의 맨 앞에서 시작하므로, 걸음 직전 수가 시작 순간의 수
  stepGame(g3, DT);
  if (clearAt < 0 && g3.wave === 1 && fieldClear(g3) && g3.nextT <= 0) clearAt = g3.t;
  if (g3.wave === 2) { startAt = g3.t; aliveAtStart = before; break; }
}
ok(startAt > 0, '자동 시작으로 2웨이브가 옴');
ok(aliveAtStart === 0, '2웨이브 시작 때 남은 적 0');
ok(clearAt > 0 && Math.abs(startAt - clearAt - AUTO_GAP) < 0.1, '정리 뒤 ' + (startAt - clearAt).toFixed(2) + '초에 시작 (목표 ' + AUTO_GAP + ')');

// 4) 마지막 웨이브 뒤에는 아무것도 시작하지 않는다 + 봇은 정리 뒤 눌러서 끝까지 간다
var g4 = newGame(T1, 'normal', { maxLv: 5, cards: false }), B = makeBot(g4, {});
var n4 = 0; while (!g4.over && g4.t < 60 * 30) { botTick(B, DT); stepGame(g4, DT); g4.ev.length = 0; n4++; }
ok(g4.over && g4.wave === g4.N, '봇(수동 모드)이 마지막 웨이브까지 진행 (over=' + g4.over + ', wave ' + g4.wave + '/' + g4.N + ', ' + Math.round(g4.t) + '초)');
console.log(fails ? 'FAILS ' + fails : 'ALL OK');
`, ctx);
