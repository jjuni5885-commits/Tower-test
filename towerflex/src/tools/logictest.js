// 전투 논리 시험(v2.0): node tools/logictest.js
// 무한, 연구, 모든 탑 최고 단계, 보스 능력 + 격자 크기, 영역(땅, 하늘, 바다), 물 칸 건설, 변신 단계, 등록 고리
const ctx = require('./fdload.js')();
ctx.run(`
var fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); }
function mapOf(id) { for (var i = 0; i < MAPS.length; i++) if (MAPS[i].id === id) return i; return -1; }
function runSec(g, sec, fn) { var n = Math.round(sec / DT); for (var i = 0; i < n && !g.over; i++) { stepGame(g, DT); if (fn && fn(g) === true) return true; g.ev.length = 0; } return false; }
// 시험 판(tools/teststages.js)을 id로 찾아 쓴다: t1 외길, t3 엇갈림과 우두머리, t4 뱃길, t5 항로. 실제 판(c1s01 ...)은 웨이브 생성 검사에만 쓴다
var NM = MAPS.length, T1 = mapOf('t1'), T3 = mapOf('t3'), mSea = mapOf('t4'), mAir = mapOf('t5');
ok(T1 >= 0 && T3 >= 0 && mSea >= 0 && mAir >= 0, '시험 판 t1, t3, t4, t5 있음 (전체 ' + NM + '판)');

// 1) 격자: 판마다 cols, rows
var g0 = newGame(T1, 'normal', { cards: false });
ok(g0.cols === (MAPS[T1].cols || COLS) && g0.rows === (MAPS[T1].rows || ROWS) && g0.kind.length === g0.cols * g0.rows && g0.towerAt.length === g0.cols * g0.rows, '격자 ' + g0.cols + 'x' + g0.rows + ' (g.cols, g.rows)');
MAPS.push({ id: 'c9s99', ch: 9, no: 99, name: '작은 판', region: '', theme: 'meadow', cols: 6, rows: 8, grid: ['..=...', '..=...', '..===.', '....=.', '....=.', '.~~.=.', '.~~.=.', '....G.'], paths: [[[2, -1], [2, 2], [4, 2], [4, 7]]], waves: 3, gold: 300, hpMul: 1, bud: 1, pool: ['goblin'], intro: {}, boss: null, desc: '' });
var gs = newGame(MAPS.length - 1, 'normal', { cards: false });
ok(gs.cols === 6 && gs.rows === 8 && parseMap(MAPS.length - 1).errs.length === 0, '다른 크기 판(6x8)도 해석');
ok(buildTower(gs, 'archer', 5, 7) && !buildTower(gs, 'archer', 6, 0) && !canBuildAt(gs, 0, 8), '6x8 판: 격자 안에만 건설');
callEarly(gs); var botS = makeBot(gs, {}); var nS = 0; while (!gs.over && nS++ < 60 * 300) { botTick(botS, DT); stepGame(gs, DT); gs.ev.length = 0; }
ok(gs.over === 1, '6x8 판 봇 완주 (over ' + gs.over + ')');
MAPS.pop();

// 2) 무한 모드와 웨이브 생성
var g = newGame(T3, 'endless', { maxLv: 5, skills: { rain: 1, wall: 1, last: 1 } }), B = makeBot(g, { skill: 1 });
var st = 0; while (!g.over && g.t < 60 * 20) { if (g.pickWait) abilityPick(g, g.pickCards[0].id); botTick(B, DT); stepGame(g, DT); g.ev.length = 0; st++; }
ok(g.wave >= 5, '무한: 웨이브 ' + g.wave + ', 생명 ' + g.lives + ', ' + Math.round(g.t) + '초');
var werr = 0; for (var mi = 0; mi < NM; mi++) { try { var gg = newGame(mi, 'endless', {}); for (var i = 0; i < 40; i++) waveAt(gg, i); ['easy', 'normal', 'hard'].forEach(function (dk) { genWaves(mi, dk).forEach(function (W) { W.groups.forEach(function (gr) { if (!ENEMIES[gr.type] || fdRouteN(MAPS[mi], ENEMIES[gr.type]) < 1) werr++; }); }); }); } catch (e) { werr++; console.log(e.stack); } }
ok(werr === 0, '모든 판(' + NM + ') 웨이브 생성: 적마다 다닐 길이 있음');

// 3) 연구
var all = {}; RESEARCH.forEach(function (r) { all[r.id] = 1; });
var g2 = newGame(T1, 'normal', { research: all, cards: false }), t2 = buildTower(g2, 'archer', 0, 1);
ok(g2.gold > MAPS[T1].gold && t2 && t2.st.dmg > 8, '연구 효과: 금화 ' + g2.gold + ', 궁수 피해 ' + t2.st.dmg.toFixed(2));

// 4) 모든 탑(TOWER_ORDER) 갈래별 최고 단계까지 돌려 오류 없음
var g3 = newGame(T3, 'normal', { maxLv: 6, cards: false }); g3.gold = 1e7; var cells = []; for (var r = 0; r < g3.rows; r++) for (var c = 0; c < g3.cols; c++) if (canBuildAt(g3, c, r)) cells.push([c, r]);
var n = 0, lvErr = 0; TOWER_ORDER.forEach(function (k) { [[1, 0], [3, 0], [9, 0], [9, 1]].forEach(function (s) { var cl = cells[n++ % cells.length]; var t = buildTower(g3, k, cl[0], cl[1]); if (!t) return; var guard = 0; while (t.lvl < s[0] && guard++ < 9) if (!upgradeTower(g3, t, s[1])) break; if (s[0] === 9 && t.lvl !== fdMaxLv(k, s[1])) lvErr++; }); });
ok(lvErr === 0 && g3.towers.length >= TOWER_ORDER.length * 3, '탑 ' + g3.towers.length + '개 건설, 갈래마다 fdMaxLv 단계까지 강화');
callEarly(g3); var errs = 0;
for (var s = 0; s < 60 * 90; s++) { try { stepGame(g3, DT); } catch (e) { errs++; if (errs < 3) console.log('ERR', e.stack); } g3.ev.length = 0; if (g3.waiting === false && g3.nextT > 1) callEarly(g3); }
ok(errs === 0 && g3.stats.kills > 20, '모든 탑 전투 오류 ' + errs + ', 웨이브 ' + g3.wave + ', 처치 ' + g3.stats.kills);

// 5) 보스 4종 능력
['grumsh', 'arachne', 'yotun', 'barkan'].forEach(function (bk) { var gb = newGame(T3, 'normal', { cards: false }); gb.waiting = false; var e = spawnEnemy(gb, bk, 0, 0); var ab = 0; for (var s = 0; s < 60 * 30; s++) { stepGame(gb, DT); gb.ev.forEach(function (v) { if (['roar', 'brood', 'nova', 'summon', 'ward'].indexOf(v.t) >= 0) ab++; }); gb.ev.length = 0; } ok(ab > 0, bk + ' 능력 ' + ab + '번, 체력 ' + Math.round(e.mhp)); });

// 6) 영역: 바다
if (mSea >= 0) {
  var ga = newGame(mSea, 'normal', { cards: false }); ga.waiting = false; ga.gold = 1e6;
  var seaKey = Object.keys(ENEMIES).filter(function (k) { return fdDom(ENEMIES[k]) === 's' && !ENEMIES[k].boss; })[0];
  var se = spawnEnemy(ga, seaKey, 0, 0);
  ok(se.dom === 's' && se.P === ga.sea[0] && !se.fly, '바다 적(' + seaKey + ')은 뱃길(g.sea)로');
  var wet = true, lives0 = ga.lives; runSec(ga, 200, function (g) { if (!se.dead && se.x > 0 && se.y > 0 && se.x < g.cols && se.y < g.rows && g.kind[Math.floor(se.y) * g.cols + Math.floor(se.x)] !== 'water') wet = false; return se.dead; });
  ok(wet, '바다 적은 물 칸 위로만 지나감'); ok(se.dead && ga.lives === lives0 - se.leak, '뱃길 끝에 닿으면 생명이 깎임 (' + lives0 + ' → ' + ga.lives + ')');
  // 물 칸 건설 규칙
  var wc = null, sc = null, lc = null; for (var r = 0; r < ga.rows; r++) for (var c = 0; c < ga.cols; c++) { var i = r * ga.cols + c; if (ga.kind[i] === 'water') { if (ga.seaCell[i]) sc = sc || [c, r]; else wc = wc || [c, r]; } else if (canBuildAt(ga, c, r)) lc = lc || [c, r]; }
  TOWERS.fdRaft = { name: '시험 뗏목', short: '뗏목', kind: 'arrow', dmgType: 'phys', air: 1, site: 'water', hit: 'gas', col: '#888888', desc: '', lv: [{ cost: 10, dmg: 5, rate: 1, range: 2.5 }], br: [] };
  ok(fdCellSite(ga, wc[0], wc[1]) === 'water' && !canBuildAt(ga, wc[0], wc[1]) && !canBuildAt(ga, wc[0], wc[1], 'archer') && !buildTower(ga, 'archer', wc[0], wc[1]), '물 칸에 땅 탑은 못 지음');
  ok(canBuildAt(ga, wc[0], wc[1], 'fdRaft') && !canBuildAt(ga, lc[0], lc[1], 'fdRaft') && !canBuildAt(ga, sc[0], sc[1], 'fdRaft'), '수상 탑은 물 칸에만, 뱃길 칸에는 못 지음');
  var raft = buildTower(ga, 'fdRaft', wc[0], wc[1]); ok(raft && raft.site === 'water' && raft.lvl === 1 && !canUpgrade(ga, raft), '수상 탑 건설, 갈래 없는 탑은 강화 없음');
  // hit: 투석기('gs')는 바다 적을 겨누고 맞힘
  var gb2 = newGame(mSea, 'normal', { cards: false }); gb2.waiting = false; gb2.gold = 1e6;
  var cat = null; for (var r2 = 0; r2 < gb2.rows && !cat; r2++) for (var c2 = 0; c2 < gb2.cols && !cat; c2++) if (canBuildAt(gb2, c2, r2, 'catapult') && c2 + 1 < gb2.cols && gb2.kind[r2 * gb2.cols + c2 + 1] === 'water') cat = buildTower(gb2, 'catapult', c2, r2);
  var s2 = spawnEnemy(gb2, seaKey, 0, 0), hp0 = s2.hp; runSec(gb2, 60, function () { return s2.hp < hp0 || s2.dead; });
  ok(cat && cat.hit === 'gs' && (s2.hp < hp0 || s2.dead), "투석기(hit 'gs')가 바다 적을 맞힘");
  delete TOWERS.fdRaft;
} else console.log('skip 바다 시험 (뱃길 있는 판 없음)');

// 7) 영역: 항로와 하늘
if (mAir >= 0) {
  var gl = newGame(mAir, 'normal', { cards: false }); gl.waiting = false; gl.gold = 1e6;
  var laneKey = Object.keys(ENEMIES).filter(function (k) { return ENEMIES[k].lane && !ENEMIES[k].boss; })[0];
  var le = spawnEnemy(gl, laneKey, 1, 0), a = MAPS[mAir].air[1 % MAPS[mAir].air.length];
  ok(le.dom === 'a' && le.fly && le.lane === 1 && le.P === gl.air[1 % gl.air.length], '항로 적(' + laneKey + ')은 항로(g.air)로');
  var dir = Math.atan2(a[3] - a[1], a[2] - a[0]), straight = true, livesL = gl.lives;
  runSec(gl, 200, function () { if (!le.dead && Math.abs(angDiff(dir, le.ang)) > 0.02) straight = false; return le.dead; });
  ok(straight, '항로 적은 직선으로 날아감'); ok(le.dead && gl.lives === livesL - le.leak, '항로 끝에 닿으면 생명이 깎임 (' + livesL + ' → ' + gl.lives + ')');
  // hit: 투석기('gs')는 하늘을 못 겨눔, 궁수('gas')는 겨눔, 대공포('a')는 땅을 못 겨눔
  var gh = newGame(mAir, 'normal', { cards: false }); gh.waiting = false; gh.gold = 1e6;
  var fl = spawnEnemy(gh, laneKey, 0, 2), gr = spawnEnemy(gh, 'orc', 0, 3);
  var mk = function (k, e) { var t = { k: k, x: e.x + 0.4, y: e.y, mode: 'first', hit: fdHit(k) }; return pickTarget(gh, t, { range: 2 }); };
  ok(mk('catapult', fl) === null && mk('archer', fl) === fl, '투석기는 하늘 적을 못 겨누고 궁수는 겨눔');
  ok(!TOWERS.flak || (fdHit('flak') === 'a' && mk('flak', gr) === null && mk('flak', fl) === fl), "대공포(hit 'a')는 하늘만 겨눔");
  ok(targetable(gh, fl, 'a') && !targetable(gh, fl, 'gs') && targetable(gh, fl), 'targetable(g, e, hit)이 영역을 지킴');
  ok(nearEnemies(gh, fl.x, fl.y, 1, 3, null, false).indexOf(fl) < 0 && nearEnemies(gh, fl.x, fl.y, 1, 3, null, 'a')[0] === fl, 'nearEnemies도 영역을 지킴');
} else console.log('skip 항로 시험 (항로 있는 판 없음)');

// 8) 변신 단계: tiers 3개면 6단계, opts.maxLv 3|5|6, 사건 transform
TOWERS.fdSix = { name: '시험 육단', short: '육단', kind: 'arrow', dmgType: 'phys', air: 1, col: '#888888', desc: '', lv: [{ cost: 1, dmg: 5, rate: 1, range: 2.5 }, { cost: 1, dmg: 6 }, { cost: 1, dmg: 7 }],
  br: [{ name: '가', ult: '가 궁극', desc: '', tiers: [{ cost: 1, dmg: 10 }, { cost: 1, dmg: 20 }, { cost: 1, dmg: 40 }] }, { name: '나', ult: '나 궁극', desc: '', tiers: [{ cost: 1, dmg: 11 }, { cost: 1, dmg: 21 }] }] };
[[3, 3], [5, 5], [6, 6], [undefined, 6]].forEach(function (q) {
  var gx = newGame(T1, 'normal', { maxLv: q[0], cards: false }); gx.gold = 999; var t = buildTower(gx, 'fdSix', 0, 1), guard = 0; while (upgradeTower(gx, t, 0) && guard++ < 9) { }
  ok(t.lvl === q[1], 'maxLv ' + q[0] + ' → ' + t.lvl + '단계까지');
  if (q[0] === 6) {
    var tf = gx.ev.filter(function (e) { return e.t === 'transform'; });
    ok(tf.length === 2 && tf[0].lvl === 4 && tf[0].br === 0 && !tf[0].ult && tf[1].lvl === 6 && tf[1].ult === 1 && tf[1].tw === t, "사건 'transform': 4단계(갈래)와 6단계(궁극)");
    ok(t.st.dmg === 40 && towerTitle('fdSix', 6, 0) === '가 궁극' && towerTitle('fdSix', 5, 0) === '가' && upgCost('fdSix', 6, 0) === 0, '6단계 능력치와 궁극 이름');
    var tb = buildTower(gx, 'fdSix', 1, 1); guard = 0; while (upgradeTower(gx, tb, 1) && guard++ < 9) { }
    ok(tb.lvl === 5 && fdMaxLv('fdSix', 1) === 5 && fdMaxLv('fdSix') === 6, 'tiers가 2개인 갈래는 5단계까지');
  }
});
delete TOWERS.fdSix;

// 9) 등록 고리
var log = {};
function hit(k) { log[k] = (log[k] || 0) + 1; }
TOWERS.fdHook = { name: '시험 고리', short: '고리', kind: 'fdkind', dmgType: 'phys', air: 1, hit: 'gas', col: '#888888', desc: '', lv: [{ cost: 1, dmg: 5, rate: 2, range: 9 }], br: [] };
TW_INIT.fdkind = function (g, t) { hit('init'); t.fdReady = 1; };
TW_SOLD.fdkind = function (g, t) { hit('sold'); };
TW_ACT.fdkind = function (g, t, dt) { hit('act'); t.cd -= dt; if (t.cd > 0) return; var e = pickTarget(g, t, t.st); if (!e) return; t.cd = 1 / t.st.rate; g.proj.push({ kind: 'fdshot', x: t.x, y: t.y, tgt: e, life: 0.2, dmg: t.st.dmg, src: { tw: t } }); g.units.push({ kind: 'fdunit', x: t.x, y: t.y, life: 0.5, tw: t }); emit(g, 'fdEvent', { tw: t }); };
PROJ_UPD.fdshot = function (g, p, dt) { hit('proj'); p.life -= dt; if (p.life > 0) return false; if (p.tgt && !p.tgt.dead) hurt(g, p.tgt, p.dmg, 'phys', p.src); return true; };
UNIT_UPD.fdunit = function (g, u, dt) { hit('unit'); u.life -= dt; return u.life <= 0; };
EN_AB.orc = { spawn: function (g, e) { hit('spawn'); e.fdTag = 1; }, tick: function (g, e, dt) { hit('tick'); }, hurt: function (g, e, dmg, info) { hit('hurt'); log.info = info; return dmg * 0.5; }, die: function (g, e) { hit('die'); if (!e.fdOnce) { e.fdOnce = 1; e.hp = 5; return false; } } };
RULES.fdrule = { init: function (g) { hit('rinit'); g.rule.n = 0; g.gold += 1000; }, tick: function (g, dt) { g.rule.n++; }, canBuild: function (g, type, c, r) { return type !== 'catapult'; }, stats: function (g, t, st) { if (st.range) st.range *= 2; }, spawn: function (g, e) { hit('rspawn'); }, wave: function (g, W, i) { hit('rwave'); } };
MAPS[T1].rule = { id: 'fdrule', v: 7 };
var gk = newGame(T1, 'normal', { cards: false, fuse: 1, admin: 1 });
ok(gk.fuse === true && gk.admin === true, 'opts.fuse, opts.admin을 g에 복사');
ok(gk.rule && gk.rule.id === 'fdrule' && gk.rule.v === 7 && gk.rule !== MAPS[T1].rule && log.rinit === 1 && gk.gold === MAPS[T1].gold + 1000, 'RULES: M.rule을 g.rule로 복사하고 init 호출');
ok(!buildTower(gk, 'catapult', 0, 1) && !!buildTower(gk, 'archer', 0, 1), 'RULES.canBuild가 false면 건설 불가');
ok(Math.abs(gk.towers[0].st.range - towerStats('archer', 1, 0).range * 2) < 1e-6, 'RULES.stats가 능력치를 고침');
var th = buildTower(gk, 'fdHook', 1, 1); ok(th && th.fdReady === 1 && log.init === 1, 'TW_INIT[kind] 호출');
sellTower(gk, gk.towers[0]); gk.waiting = false; var oe = spawnEnemy(gk, 'orc', 0, 4), ohp = oe.hp;
ok(oe.fdTag === 1 && log.spawn === 1 && log.rspawn === 1, 'EN_AB.spawn, RULES.spawn 호출');
var sawUnit = false, sawEv = false; runSec(gk, 12, function (g) { if (g.units.length) sawUnit = true; if (g.ev.some(function (e) { return e.t === 'fdEvent'; })) sawEv = true; return oe.dead; });
ok(log.act > 10 && log.proj > 5, 'TW_ACT, PROJ_UPD 호출 (' + log.act + ', ' + log.proj + ')');
ok(sawUnit && log.unit > 5 && gk.units.length <= 3, 'g.units와 UNIT_UPD (true면 없앰)'); ok(sawEv, 'emit한 새 사건이 g.ev에 실림');
ok(log.tick > 5 && log.hurt > 1 && log.info && log.info.kind === 'phys' && log.info.raw === 5 && log.info.src.tw === th, 'EN_AB.tick, hurt(g, e, dmg, info) 호출');
hurt(gk, oe, 1e6, 'true', null); var alive1 = !oe.dead && oe.hp === 5; hurt(gk, oe, 1e6, 'true', null);
ok(log.die === 2 && alive1 && oe.dead, 'EN_AB.die: false면 죽음 취소, 그다음엔 죽음 (' + log.die + '번)');
ok(gk.rule.n > 10, 'RULES.tick 호출 (' + gk.rule.n + ')');
var gw = newGame(T1, 'normal', { cards: false }); callEarly(gw); ok(log.rwave === 1, 'RULES.wave 호출');
sellTower(gk, th); ok(log.sold === 1, 'TW_SOLD[kind] 호출');
delete MAPS[T1].rule; delete TOWERS.fdHook; delete EN_AB.orc; delete RULES.fdrule; delete TW_ACT.fdkind; delete TW_INIT.fdkind; delete TW_SOLD.fdkind; delete PROJ_UPD.fdshot; delete UNIT_UPD.fdunit;
// 탑 멈춤 상태
var gq = newGame(T1, 'normal', { cards: false }); gq.waiting = false; var tq = buildTower(gq, 'archer', 1, 2); tq.stunT = 1; spawnEnemy(gq, 'orc', 0, 3); runSec(gq, 0.8); var p0 = gq.stats.kills, shots0 = tq.shots; runSec(gq, 2);
ok(shots0 === 0 && tq.shots > 0 && tq.stunT <= 0, '탑 stunT 동안 멈췄다가 다시 쏨');

console.log(fails ? 'FAILS ' + fails : 'ALL OK');
var FD_FAILS = fails;
`);
process.exit(ctx.run('FD_FAILS') ? 1 : 0);
