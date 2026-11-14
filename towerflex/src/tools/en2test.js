// 2~4장 적 능력, 웨이브, 판 규칙 시험(v2.0 ENG1): node tools/en2test.js
// 판을 찾는 곳은 en2Stage() 하나뿐이다. 판 설계 갈래가 stages_ch1.js를 갈아 끼워도 이 시험은 자체 시험 판(c9s9x)으로 돈다.
// 실제 판(stages_ch*.js)은 맨 끝 '실제 판 전수 점검'에서 한 번씩 돌린다.
const ctx = require('./fdload.js')();
ctx.run(`
var fails = 0, oks = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL', m); } else { oks++; if (!QUIET) console.log('ok  ', m); } }
var QUIET = ${process.argv.includes('-q') ? 1 : 0};
// ---------- 시험 판: 여기만 고치면 됨 ----------
// kind: 'land' 땅 길 2개 | 'sea' 땅 길 + 뱃길 | 'air' 땅 길 + 항로 2개 | 'all' 땅 + 뱃길 + 항로. rule을 주면 그 규칙을 단 복사본
function en2Grid(paths, sea, water) {
  var rows = [], set = new Uint8Array(170), i, r, c;
  paths.forEach(function (w) { rasterWps(w, set, 10, 17); });
  var gate = paths[0][paths[0].length - 1];
  for (r = 0; r < 17; r++) { var s = ''; for (c = 0; c < 10; c++) s += (c === gate[0] && r === gate[1]) ? 'G' : set[r * 10 + c] ? '=' : water(c, r) ? '~' : '.'; rows.push(s); }
  return rows;
}
var EN2_ST = {};
function en2Stage(kind, rule, extra) {
  var key = kind + ':' + (rule ? JSON.stringify(rule) : '') + (extra ? JSON.stringify(extra) : '');
  if (EN2_ST[key] != null) return EN2_ST[key];
  var land = [[[2, -2], [2, 4], [5, 4], [5, 9], [2, 9], [2, 13], [5, 13], [5, 16]]];
  var sea = (kind === 'sea' || kind === 'all') ? [[[8, -2], [8, 7], [7, 7], [7, 13], [8, 13], [8, 16], [6, 16]]] : null;
  var air = (kind === 'air' || kind === 'all') ? [[-2, 2, 11, 13], [11, 4, -2, 15]] : null;
  if (kind === 'land') land = [[[1, -2], [1, 5], [4, 5], [4, 10], [7, 10], [7, 14], [5, 14], [5, 16]], [[8, -2], [8, 3], [6, 3], [6, 5], [4, 5], [4, 10], [7, 10], [7, 14], [5, 14], [5, 16]]];
  var M = { id: 'c9s' + (90 + Object.keys(EN2_ST).length), ch: 9, no: 90, name: '적 시험판 ' + kind, region: '시험장', theme: 'meadow', cols: 10, rows: 17,
    grid: en2Grid(land, sea, function (c, r) { return !!sea && (c >= 7 || (c === 6 && r === 16)); }), paths: land, waves: 12, gold: 500, hpMul: 1, bud: 1, pool: ['goblin', 'orc'], intro: {}, boss: null,
    rule: rule || null, ruleName: '', ruleDesc: '', need: [], reward: null, desc: '' };
  if (sea) M.sea = sea; if (air) M.air = air;
  if (extra) for (var k in extra) M[k] = extra[k];
  MAPS.push(M);
  return (EN2_ST[key] = MAPS.length - 1);
}
// ---------- 도우미 ----------
function G(kind, rule, extra) { var g = newGame(en2Stage(kind, rule, extra), 'normal', { cards: false }); g.waiting = false; g.gold = 1e6; return g; }
function run(g, sec, fn) { var n = Math.round(sec / DT); for (var i = 0; i < n && !g.over; i++) { stepGame(g, DT); if (fn && fn(g) === true) return true; g.ev.length = 0; } return false; }
function evs(g, t) { return g.ev.filter(function (e) { return e.t === t; }); }
function tw(g, k, x, y) {   // (x, y)에 가장 가까운 지을 수 있는 칸에 탑
  var best = null, bd = 1e9; for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) { if (!canBuildAt(g, c, r, k)) continue; var dd = d2(c + 0.5, r + 0.5, x, y); if (dd < bd) { bd = dd; best = [c, r]; } }
  return best ? buildTower(g, k, best[0], best[1], true) : null;
}
function at(P, d) { return pathAt(P, d, { x: 0, y: 0, dx: 0, dy: 0 }); }
function hit(g, e, amt) { return hurt(g, e, amt, 'true', null); }
function down(g, e, r) { e.hp = e.mhp * r; }   // 체력을 비율 r로
var FAKE_G = { tw: { hit: 'gas', site: 'land', dmg: 0, kills: 0 } }, FAKE_A = { tw: { hit: 'a', site: 'land', dmg: 0, kills: 0 } }, FAKE_W = { tw: { hit: 'gs', site: 'water', dmg: 0, kills: 0 } };

// ========== 1) 자료 ==========
var DIE = { boom: 1, ghost: 1, ink: 1, poof: 1 }, bad = [];
EN2_ORDER.forEach(function (k) {
  var E = ENEMIES[k]; if (!E) { bad.push(k + ' 없음'); return; }
  ['name', 'ch', 'dom', 'hp', 'spd', 'gold', 'leak', 'size', 'desc', 'weak', 'die', 'kin'].forEach(function (f) { if (E[f] == null) bad.push(k + '.' + f); });
  if (!(E.weak && E.weak.length >= 1 && E.weak.length <= 3 && E.weak.every(function (t) { return TOWERS[t]; }))) bad.push(k + ' weak');
  if (!DIE[E.die]) bad.push(k + ' die'); if (!EN_AB[k]) bad.push(k + ' EN_AB'); if (ENEMY_ORDER.indexOf(k) < 0) bad.push(k + ' 도감');
  if (!(threatOf(k) > 0) || !isFinite(threatOf(k))) bad.push(k + ' threat');
  if (/[\\u00b7\\u318d]/.test(E.name + E.desc)) bad.push(k + ' 가운데 점');
  if (fdDom(E) !== E.dom || (E.dom === 'a') !== !!E.fly) bad.push(k + ' 영역');
});
ok(EN2_ORDER.length === 53 && bad.length === 0, '2~4장 적 53종 자료(이름, 챕터, 영역, 수치, 상성 1~3, 죽는 연출, 능력 등록, 도감) ' + bad.slice(0, 6).join(' / '));
ok(ENEMIES.vampbat && ENEMIES.vampbat.form === 1 && ENEMIES.vampbat.fly && ENEMIES.submarine_sub && ENEMIES.submarine_sub.alt === 1 && ENEMY_ORDER.indexOf('vampbat') < 0 && ENEMY_ORDER.indexOf('submarine_sub') < 0 && MAPS.every(function (M) { return M.pool.indexOf('submarine_sub') < 0; }), '변신 모습 vampbat, 그림 전용 submarine_sub: 자료는 있고 도감에는 없음');
ok(['drone', 'bats', 'crows', 'scarab', 'wisp'].every(function (k) { return ENEMIES[k].size >= 0.45; }) && ENEMIES.pumpking.size <= 1.6 && ENEMIES.count.size <= 1.6, '작은 떼는 크기 0.45 이상, 호박 대왕과 흡혈 백작은 1.5(옆 탑을 가리지 않게)');
ok(['goblin', 'barkan', 'twinking'].every(function (k) { return ENEMIES[k].ch === 1; }) && ENEMY_ORDER.length >= 28 + 53, '1장 적에 ch: 1, ENEMY_ORDER ' + ENEMY_ORDER.length + '종');
var chHp = [0, 0, 0, 0, 0], chN = [0, 0, 0, 0, 0]; ENEMY_ORDER.forEach(function (k) { var E = ENEMIES[k]; if (E.boss) { chHp[E.ch] += E.hp; chN[E.ch]++; } });
ok(chHp[2] / chN[2] > chHp[1] / chN[1] && chHp[3] / chN[3] > chHp[2] / chN[2] && chHp[4] / chN[4] > chHp[3] / chN[3], '우두머리 평균 체력이 챕터마다 오름 ' + [1, 2, 3, 4].map(function (c) { return Math.round(chHp[c] / chN[c]); }).join(' < '));

// ========== 2) 2장 능력 ==========
(function () {
  var g = G('land'), z = spawnEnemy(g, 'zombie', 0, 5); g.rnd = function () { return 0; };
  hit(g, z, 1e6); ok(!z.dead && z.risen === 1 && z.reviveT > 0 && z.untarget === 1 && Math.abs(z.hp - z.mhp * 0.5) < 1e-6, '좀비: 쓰러지면 다시 일어남(체력 50%, 일어나는 동안 못 겨눔)');
  run(g, 2); ok(z.untarget === 0, '좀비: 일어난 뒤 다시 겨눌 수 있음'); hit(g, z, 1e6); ok(z.dead, '좀비: 두 번째는 쓰러짐');
  var z2 = spawnEnemy(g, 'zombie', 0, 5); z2.burnT = 2; z2.burnDps = 1; hit(g, z2, 1e6); ok(z2.dead, '좀비: 불타는 중이면 못 일어남');
  var z3 = spawnEnemy(g, 'zombie', 0, 5); z3.sealT = 3; hit(g, z3, 1e6); ok(z3.dead, '좀비: 봉인되면 못 일어남');
})();
(function () {
  var g = G('land'); g.unlockedSkills.wall = 1; g.sk.wall.cd = 0;
  var p = at(g.paths[0], 6); ok(castWall(g, p.x, p.y), '방책 세움');
  var o = spawnEnemy(g, 'orc', 0, 5), gh = spawnEnemy(g, 'ghoul', 0, 5), ho = spawnEnemy(g, 'horangi', 0, 5), gs = spawnEnemy(g, 'ghoul', 0, 5); gs.sealT = 99;
  var leaps = 0; run(g, 4, function (g) { leaps += evs(g, 'leap').length; });
  ok(o.blocked && o.d < 6 && gh.d > 7 && ho.d > 7 && leaps >= 2, '구울, 창귀 호랑이는 방책을 뛰어넘고 오크는 막힘 (leap 사건 ' + leaps + ')');
  ok(gs.d < 6 && gs.blocked, '봉인된 구울은 방책에 막힘');
  // 막는 유닛(병사)
  var g2 = G('land'), q = at(g2.paths[0], 6), u = { kind: 'soldier', x: q.x, y: q.y, hp: 500, block: 1 }; g2.units.push(u);
  var o1 = spawnEnemy(g2, 'orc', 0, 5, { off: 0 }), o2 = spawnEnemy(g2, 'orc', 0, 4.4, { off: 0 }), gh2 = spawnEnemy(g2, 'ghoul', 0, 5, { off: 0 }), bt = spawnEnemy(g2, 'bats', 0, 5);
  run(g2, 4);
  ok(o1.blocked === u && o1.d < 6 && u.hp < 500, '막는 유닛(block: 1): 땅 적 하나를 붙잡고 체력이 깎임 (' + Math.round(u.hp) + ')');
  ok(o2.d > 6.3 && gh2.d > 7 && bt.d > 7, '유닛 하나는 한 마리만 붙잡음, 구울은 뛰어넘고 하늘 적은 지나감');
  u.hp = 0; run(g2, 1); ok(!o1.blocked && o1.d > 6, '유닛이 쓰러지면 풀려남');
})();
(function () {
  var g = G('land'), ph = spawnEnemy(g, 'phantom', 0, 3), seen = 0, immune = 0;
  run(g, 8, function () { if (ph.fade > 0.9) { seen++; if (hit(g, ph, 10) === 0 && ph.untarget) immune++; } });
  ok(seen > 30 && immune === seen, '원혼: 주기적으로 흐려지고(e.fade) 그동안 못 겨누고 안 맞음');
  var g2 = G('land'), p = at(g2.paths[0], 6), bell = tw(g2, 'bell', p.x, p.y), ph2 = spawnEnemy(g2, 'phantom', 0, 5.2), faded = 0;
  run(g2, 2.2, function () { if (ph2.fade > 0.5 && d2(ph2.x, ph2.y, bell.x, bell.y) <= bell.st.reveal * bell.st.reveal) faded++; });
  ok(bell && faded === 0, '원혼: 종탑(조명) 근처에서는 흐려지지 못함');
  var g3 = G('land'), j = spawnEnemy(g3, 'jangsan', 0, 1), fj = 0; run(g3, 6, function () { if (j.fade > 0.9) fj++; }); ok(fj > 20, '장산범: 잠깐씩 숨음');
})();
(function () {
  var g = G('land'), p = at(g.paths[0], 6), t = tw(g, 'archer', p.x, p.y), pk = spawnEnemy(g, 'pumpkin', 0, 6);
  hit(g, pk, 1e6); var ev = evs(g, 'towerStun');
  ok(pk.dead && t.stunT === 2 && ev.length === 1 && ev[0].tw === t && ev[0].why === 'pumpkin' && evs(g, 'blast').length === 1, "호박머리: 터지며 주변 탑 기절 2초, 사건 'towerStun', 'blast'");
  run(g, 2.5); var pk2 = spawnEnemy(g, 'pumpkin', 0, 6); hit(g, pk2, 1e6); ok(t.stunT <= 0 && t.immT > g.t, '방금 풀려난 탑은 잠깐 다시 멈추지 않음(immT)');
  run(g, 3); var pk3 = spawnEnemy(g, 'pumpkin', 0, 6); pk3.frozen = 1; hit(g, pk3, 1e6); ok(t.stunT <= 0, '호박머리: 얼어 있으면 안 터짐');
  var pk4 = spawnEnemy(g, 'pumpkin', 0, 6); pk4.sealT = 2; hit(g, pk4, 1e6); ok(t.stunT <= 0, '호박머리: 봉인되면 안 터짐');
})();
(function () {
  var g = G('land'), p = at(g.fly[0], 6), t = tw(g, 'bell', p.x, p.y), w = spawnEnemy(g, 'witch', 0, 6), o = spawnEnemy(g, 'orc', 0, en2NearS(g.paths[0], p.x, p.y) * PSTEP); o.hp = o.mhp * 0.3; w.spd = 0; o.spd = 0;
  var hexed = 0, healed = 0; run(g, 9, function () { if (t.hexT > 0) hexed = 1; if (o.hp > o.mhp * 0.35) healed = 1; return !!(hexed && healed); });
  ok(hexed === 1 && healed === 1, '마녀: 탑 하나를 저주(t.hexT)하고 주변 적을 치유');
  var g2 = G('land'), t2 = tw(g2, 'bell', p.x, p.y), w2 = spawnEnemy(g2, 'witch', 0, 6); w2.sealT = 99; w2.spd = 0; var o2 = spawnEnemy(g2, 'orc', 0, en2NearS(g2.paths[0], p.x, p.y) * PSTEP); o2.spd = 0; o2.hp = o2.mhp * 0.3;
  run(g2, 9); ok(t2.hexT <= 0 && o2.hp <= o2.mhp * 0.31 && w2.sealT < 99, '봉인(sealT)된 마녀는 저주도 치유도 못 함, 봉인 시간은 줄어듦');
})();
(function () {
  var g = G('land'), m = spawnEnemy(g, 'mummy', 0, 5), n0 = g.enemies.length;
  var a = hurt(g, m, 100, 'magic', null, false, { el: 'fire' }), b = hurt(g, m, 100, 'magic', null, false, { el: 'ice' });
  ok(Math.abs(a - 160) < 1e-6 && Math.abs(b - 100) < 1e-6, '미라: 불에 1.6배');
  hit(g, m, 1e6); ok(g.enemies.filter(function (e) { return e.k === 'scarab'; }).length === 4, '미라: 쓰러지면 풍뎅이 4');
  var c = spawnEnemy(g, 'coffin', 0, 5), ap = spawnEnemy(g, 'apc', 0, 5); hit(g, c, 1e6); hit(g, ap, 1e6);
  ok(g.enemies.filter(function (e) { return e.k === 'zombie' && !e.dead; }).length === 4 && g.enemies.filter(function (e) { return e.k === 'soldier'; }).length === 4, '관 수레는 좀비 4, 장갑차는 보병 4를 내림');
})();
(function () {
  var g = G('land'), w = spawnEnemy(g, 'werewolf', 0, 2, { off: 0 }), w0 = spawnEnemy(g, 'werewolf', 0, 2, { off: 0 }), rg = 0;
  down(g, w, 0.4); run(g, 2, function (g) { rg += evs(g, 'rage').length; });
  ok(w.rage === 1 && !w0.rage && rg === 1 && (w.d - 2) / (w0.d - 2) > 1.6, '늑대인간: 체력 절반 아래에서 폭주(e.rage), ' + ((w.d - 2) / (w0.d - 2)).toFixed(2) + '배 빠름');
})();
(function () {
  var g = G('land'), v = spawnEnemy(g, 'vampire', 0, 8, { off: 0 }), x0, y0, mv = null;
  run(g, 0.5); x0 = v.x; y0 = v.y; down(g, v, 0.45);
  stepGame(g, DT); mv = evs(g, 'morph')[0];
  ok(v.form === 'vampbat' && v.dom === 'a' && v.fly === true && v.z > 0 && mv && mv.e === v && mv.to === 'vampbat' && v.k === 'vampire', "흡혈귀: 체력 절반에서 박쥐로 변신(e.form, 영역 g → a, 사건 'morph')");
  ok(Math.hypot(v.x - x0, v.y - y0) < 0.3 && v.hp > v.mhp * 0.55, '변신 자리 이어짐, 체력 15% 회복 (' + Math.hypot(v.x - x0, v.y - y0).toFixed(2) + '칸)');
  ok(!targetable(g, v, 'gs') && targetable(g, v, 'a') && pickTarget(g, { k: 'catapult', x: v.x, y: v.y, mode: 'first', hit: 'gs' }, { range: 3 }) === null, '변신 뒤에는 땅 전용 탑이 못 겨눔(대공 필요)');
  var lives = g.lives, far = 0; run(g, 60, function () { far = Math.max(far, Math.hypot(v.x - x0, v.y - y0)); return v.dead; });
  ok(v.dead && g.lives === lives - 1, '박쥐 모습으로 하늘 길 끝까지 가면 생명이 깎임');
  var g2 = G('land'), v2 = spawnEnemy(g2, 'vampire', 0, 8); down(g2, v2, 0.45); v2.sealT = 1; run(g2, 0.5); var s1 = !v2.form; run(g2, 1); ok(s1 && v2.form === 'vampbat', '봉인 중에는 변신 못 하고 풀리면 변신');
  hit(g2, v2, 1e6); var ke = null; g2.ev.forEach(function (e) { if (e.t === 'kill') ke = e; }); ok(v2.dead && ke && ke.k === 'vampire' && ke.form === 'vampbat', 'kill 사건에 k(원래 키)와 form(변신 모습)');
})();
(function () {
  var g = G('land'), d = spawnEnemy(g, 'doll', 0, 4, { off: 0 }), bl = 0;
  hit(g, d, d.mhp * 0.05); var d1 = d.d; hit(g, d, d.mhp * 0.25); bl = evs(g, 'blink').length;
  ok(Math.abs(d1 - 4) < 1e-6 && Math.abs(d.d - 5.6) < 1e-6 && bl === 1, '저주 인형: 크게 맞으면 앞으로 1.6칸 순간 이동, 작게 맞으면 그대로');
  hit(g, d, d.mhp * 0.25); ok(Math.abs(d.d - 5.6) < 1e-6, '저주 인형: 순간 이동 재사용 시간');
})();
(function () {
  var g = G('land'), ga = spawnEnemy(g, 'gargoyle', 0, 3);
  ok(ga.fly && Math.abs(hurt(g, ga, 100, 'phys', null) - 40) < 1e-6 && Math.abs(hurt(g, ga, 100, 'magic', null) - 100) < 1e-6, '가고일: 하늘, 물리 60% 막음');
  var b = spawnEnemy(g, 'bats', 0, 3), s = spawnEnemy(g, 'scarab', 0, 3); ok(b.fly && b.dom === 'a' && s.dom === 'g' && ENEMIES.bats.swarm && ENEMIES.scarab.swarm, '박쥐 떼(하늘), 풍뎅이(땅)는 떼');
})();

// ========== 3) 3장 능력 ==========
(function () {
  var g = G('land'), p = at(g.paths[0], 6), t = tw(g, 'archer', p.x + 1.2, p.y), tk = spawnEnemy(g, 'tank', 0, 5), shot = 0, sh = 0, st = 0;
  run(g, 12, function (g) { shot += evs(g, 'eshoot').length; if (g.proj.some(function (q) { return q.kind === 'eshell' && q.enemy; })) sh = 1; if (t.stunT > 0) st = 1; return st === 1; });
  ok(shot >= 1 && sh === 1 && st === 1, '전차: 포격(탄 eshell)으로 탑 기절');
  var g2 = G('sea'), q = at(g2.sea[0], 6), t2 = tw(g2, 'archer', q.x - 1.5, q.y), ds = spawnEnemy(g2, 'destroyer', 0, 5), st2 = 0;
  run(g2, 14, function () { if (t2.stunT > 0) st2 = 1; return st2 === 1; });
  ok(ds.dom === 's' && ds.P === g2.sea[0] && st2 === 1, '구축함: 뱃길로 오며 함포로 탑 기절');
  ok(Math.abs(hurt(g2, ds, 100, 'true', FAKE_G) - 65) < 1e-6 && Math.abs(hurt(g2, ds, 100, 'true', FAKE_W) - 100) < 1e-6, '구축함: 땅 탑 피해 65%, 수상 탑은 그대로(hull)');
})();
(function () {
  var g = G('land'), tr = spawnEnemy(g, 'truck', 0, 5), j = spawnEnemy(g, 'jeep', 0, 5.3), s = spawnEnemy(g, 'soldier', 0, 5.3); down(g, j, 0.3); down(g, s, 0.3); j.spd = s.spd = tr.spd;
  run(g, 6); ok(j.hp > j.mhp * 0.4 && s.hp <= s.mhp * 0.31, '보급 트럭: 주변 차량만 수리');
  var m = spawnEnemy(g, 'mech', 0, 2); ok(Math.abs(m.shield - m.mhp * 0.2) < 1e-6, '보행 로봇: 보호막을 두르고 나옴'); m.shield = 0; var soon = run(g, 5, function () { return m.shield > 0; }), back = run(g, 6, function () { return m.shield > 0; }); m.shield = 0;
  ok(!soon && back && Math.abs(hurt(g, m, 100, 'true', null, true, { el: 'bolt' }) - 150) < 1e-6, '보행 로봇: 보호막이 깨지면 9초 뒤 재생, 번개에 1.5배');
})();
(function () {
  var g = G('air'), b = spawnEnemy(g, 'bomber', 0, 0), mid = at(g.air[0], g.air[0].len * 0.5), t = tw(g, 'archer', mid.x, mid.y + 0.9), bomb = 0, st = 0;
  ok(b.lane === 1 && b.P === g.air[0] && b.fly, '폭격기: 항로로');
  run(g, 30, function (g) { if (g.proj.some(function (q) { return q.kind === 'ebomb'; })) bomb = 1; if (t.stunT > 0) st = 1; return st === 1 || b.dead; });
  ok(bomb === 1 && st === 1, '폭격기: 폭탄(탄 ebomb)으로 지나가는 길의 탑 기절');
  var g2 = G('air'), lw = 0, ms = spawnEnemy(g2, 'missile', 1, 0); lw = evs(g2, 'laneWarn').length; var lives = g2.lives; run(g2, 20, function () { return ms.dead; });
  ok(lw === 1 && ms.dead && g2.lives === lives - ENEMIES.missile.leak, '순항 미사일: 경고 사건, 성에 닿으면 생명 ' + ENEMIES.missile.leak);   // [BAL] 생명 값은 자료를 따름
  var j = spawnEnemy(g2, 'jet', 0, 0);
  ok(Math.abs(hurt(g2, j, 100, 'true', FAKE_G) - 100 * ENEMIES.jet.aaOnly) < 1e-6 && Math.abs(hurt(g2, j, 100, 'true', FAKE_A) - 100) < 1e-6 && j.spd > 3, '전투기: 범용 탑 피해 ' + Math.round(ENEMIES.jet.aaOnly * 100) + '%, 대공 전용은 그대로(aaOnly)');   // [BAL] 배수는 자료를 따름
  var g3 = G('land'), j3 = spawnEnemy(g3, 'jet', 0, 0); ok(j3.fly && j3.P === g3.fly[0], '항로 없는 판에 소환된 전투기는 하늘 곡선으로(안 깨짐)');
})();
(function () {
  var g = G('sea'), s = spawnEnemy(g, 'submarine', 0, 2), dive = 0, imm = 0, up = 0;
  run(g, 12, function () { if (s.sub > 0.9) { dive++; if (s.untarget && hit(g, s, 5) === 0) imm++; } else if (s.sub < 0.1) up++; });
  ok(dive > 60 && imm === dive && up > 60, '잠수함: 잠수 주기(e.sub), 잠수 중엔 못 겨누고 안 맞음');
  s.d = s.P.len - 2; run(g, 1.2); ok(s.sub < 0.1 && !s.untarget, '잠수함: 부두 앞에서는 떠오름');
  var bo = spawnEnemy(g, 'boat', 0, 0), lives = g.lives; ok(bo.dom === 's' && bo.spd > 1.5, '고속정: 바다, 빠름');
})();

// ========== 4) 4장 능력 ==========
(function () {
  var g = G('land'), p = at(g.paths[0], 6), t = tw(g, 'archer', p.x + 1.1, p.y), gm = spawnEnemy(g, 'gumiho', 0, 6), ch = 0; gm.spd = 0;
  run(g, 12, function () { if (t.charmT > 0) ch = 1; return ch === 1; });
  ok(ch === 1, '구미호: 탑을 홀림(t.charmT)');
  var gm2 = spawnEnemy(g, 'gumiho', 0, 1); g.rnd = function () { return 0; };
  var a = hurt(g, gm2, 50, 'true', null), b = hurt(g, gm2, 50, 'true', null, true); slowE(gm2, 0.3, 2); var c = hurt(g, gm2, 50, 'true', null);
  ok(a === 0 && b === 50 && c === 50, '구미호: 회피(느려졌거나 지속 피해는 못 피함)');
})();
(function () {
  var g = G('land'), s = spawnEnemy(g, 'saja', 0, 3, { off: 0 }), o = spawnEnemy(g, 'orc', 0, 3, { off: 0 }); o.spd = s.spd; var bl = 0;
  run(g, 8, function (g) { bl += evs(g, 'blink').length; });
  ok(bl >= 1 && s.d - o.d > 1.5, '저승사자: 순간 이동으로 건너뜀 (' + bl + '번, ' + (s.d - o.d).toFixed(1) + '칸 앞섬)');
  var bg = spawnEnemy(g, 'bulgasari', 0, 3);
  ok(Math.abs(hurt(g, bg, 100, 'phys', null) - 20) < 1e-6 && Math.abs(hurt(g, bg, 100, 'magic', null, false, { el: 'fire' }) - 200) < 1e-6, '불가사리: 물리 80% 막고 불에 두 배');
  var wi = spawnEnemy(g, 'wisp', 0, 3); ok(hurt(g, wi, 100, 'magic', null, false, { el: 'fire' }) === 0 && hurt(g, wi, 10, 'magic', null, false, { el: 'ice' }) === 20, '도깨비불: 불 면역, 얼음에 두 배');
})();
(function () {
  var g = G('land'), e = spawnEnemy(g, 'eoduksini', 0, 1), m0 = e.mhp, s0 = e.size; run(g, 10);
  ok(e.grow > 1.5 && e.mhp > m0 * 1.5 && e.size > s0 && e.hp > m0 * 1.4, '어둑시니: 살아 있는 동안 커짐(e.grow ' + e.grow.toFixed(2) + ', 체력 ' + Math.round(m0) + ' → ' + Math.round(e.mhp) + ')');
  run(g, 60, function () { return e.dead; }); ok(e.grow <= 2.5 + 1e-9, '어둑시니: 성장 상한');
  var g2 = G('land'), p = at(g2.paths[0], 6), bell = tw(g2, 'bell', p.x, p.y), e2 = spawnEnemy(g2, 'eoduksini', 0, 6); e2.spd = 0; run(g2, 5);
  ok(e2.grow === 1, '어둑시니: 조명 탑 근처에서는 못 자람');
  var g3 = G('land'), tl = spawnEnemy(g3, 'tal', 0, 5), o = spawnEnemy(g3, 'orc', 0, 5.4), far = spawnEnemy(g3, 'orc', 0, 12); run(g3, 1);
  ok(o.buffSpdT > 0 && o.buffSpd === 0.35 && !(far.buffSpdT > 0), '탈광대: 주변 적 가속');
})();
(function () {
  var g = G('land'), e = spawnEnemy(g, 'egg', 0, 1), L = e.P.len, t = { k: 'archer', x: e.x, y: e.y, mode: 'first', hit: 'gas' };
  ok(e.stealth === true && pickTarget(g, t, { range: 5 }) === null && pickTarget(g, t, { range: 5, detect: 1 }) === e, '달걀귀신: 숨어서 옴(숨은 적을 보는 탑만 겨눔)');
  e.d = L - 4; var rv = 0; run(g, 0.3, function (g) { rv += evs(g, 'reveal').length; }); ok(e.stealth === false && rv === 1, '달걀귀신: 성문 가까이에서 드러남');
  var g2 = G('land'), p = at(g2.paths[0], 6), bell = tw(g2, 'bell', p.x, p.y), e2 = spawnEnemy(g2, 'egg', 0, 5.5); run(g2, 0.3); ok(e2.stealth && e2.revealed === 1, '달걀귀신: 종탑 근처에서 드러남');
  var g3 = G('sea'), m = spawnEnemy(g3, 'mulgwisin', 0, 1), pr = spawnEnemy(g3, 'pirate', 0, 1);
  ok(m.stealth === true && m.dom === 's' && pr.dom === 's' && Math.abs(hurt(g3, pr, 100, 'true', FAKE_G) - 75) < 1e-6, '물귀신(바다, 숨음), 수적선(바다, 땅 탑 피해 75%)');
})();
(function () {
  function shots(jam) {
    var g = G('land'), p = at(g.paths[0], 6), t = tw(g, 'archer', p.x + 1, p.y), o = spawnEnemy(g, 'troll', 0, 6); o.spd = 0; o.hp = o.mhp = 1e9;
    if (jam) { var m = spawnEnemy(g, 'maiden', 0, 6); m.spd = 0; m.hp = m.mhp = 1e9; m.untarget = 1; }
    run(g, 20); return { n: t.shots, t: t, g: g };
  }
  var a = shots(0), b = shots(1);
  ok(b.n < a.n * 0.95 && b.n > a.n * 0.5, '처녀귀신: 비명으로 주변 탑 공격이 느려짐(' + a.n + '발 → ' + b.n + '발, t.jamT)');
  var g = G('land'), dk = spawnEnemy(g, 'dokkaebi', 0, 3), cr = spawnEnemy(g, 'crows', 0, 3); ok(dk.E.smash > 1 && cr.fly && ENEMIES.crows.swarm, '도깨비(방책 부수기), 까마귀 떼(하늘, 떼)');
})();

// ========== 5) 우두머리 12종 ==========
function bossRun(k, kind, sec, pre) {
  var g = G(kind), P = (fdDom(ENEMIES[k]) === 's' ? g.sea : fdDom(ENEMIES[k]) === 'a' ? g.fly : g.paths)[0], d0 = Math.min(P.len * 0.3, 7), b = spawnEnemy(g, k, 0, d0), c = { g: g, b: b, ev: {}, kinds: {} };
  for (var d = d0; d < P.len - 1; d += 0.9) { var p = at(P, d); tw(g, 'catapult', p.x + 1.4, p.y + 0.4); tw(g, 'catapult', p.x - 1.4, p.y - 0.4); }
  b.hp = b.mhp = 1e9; if (pre) pre(g, b);
  run(g, sec, function (g) { g.ev.forEach(function (e) { c.ev[e.t] = (c.ev[e.t] || 0) + 1; if (e.t === 'summon') c.kinds[e.type] = (c.kinds[e.type] || 0) + e.n; if (e.t === 'towerStun') c.kinds[e.k] = (c.kinds[e.k] || 0) + 1; if (e.t === 'phase') c.kinds['ph' + e.n] = 1; }); return b.dead; });
  return c;
}
(function () {
  var c = bossRun('pumpking', 'land', 25);
  ok(c.kinds.pumpkin >= 4 && c.ev.eshoot >= 1 && c.kinds.stun >= 1, '호박 대왕: 호박머리 소환 ' + c.kinds.pumpkin + ', 호박 폭탄 ' + c.ev.eshoot + ', 탑 기절 ' + c.kinds.stun);
  var c2 = bossRun('pumpking', 'land', 25, function (g, b) { b.hp = b.mhp * 0.2; });
  ok(c2.kinds.ph1 && c2.kinds.ph2 && c2.kinds.pumpkin > c.kinds.pumpkin && c2.b.d > c.b.d, '호박 대왕: 체력 구간(50%, 25%)마다 소환이 늘고 빨라짐');
})();
(function () {
  var c = bossRun('count', 'land', 30), sc = 0, imm = 0, g = c.g, b = c.b;
  ok(c.ev.scatter >= 2 && c.kinds.bats >= 4 && c.kinds.hex >= 1 && c.ev.heal >= 1, '흡혈 백작: 박쥐 떼로 흩어짐 ' + (c.ev.scatter / 2) + '번, 박쥐 ' + c.kinds.bats + ', 흡혈(저주 ' + c.kinds.hex + ')');
  var g2 = G('land'), b2 = spawnEnemy(g2, 'count', 0, 6); en2Act(g2, b2, ENEMIES.count.acts[0]); stepGame(g2, DT);
  ok(b2.fade === 1 && b2.untarget === 1 && hit(g2, b2, 100) === 0, '흡혈 백작: 흩어진 동안 못 겨누고 안 맞음'); run(g2, 3.2); ok(b2.fade === 0 && !b2.untarget && hit(g2, b2, 100) > 0, '흡혈 백작: 다시 모이면 맞음');
  var g3 = G('land'), p = at(g3.paths[0], 6), t3 = tw(g3, 'archer', p.x + 1, p.y), b3 = spawnEnemy(g3, 'count', 0, 6); b3.hp = b3.mhp * 0.5; var h0 = b3.hp; en2Act(g3, b3, ENEMIES.count.acts[1]);
  ok(t3.hexT > 0 && b3.hp > h0, '흡혈 백작: 흡혈로 회복');
})();
(function () {
  var c = bossRun('reaper', 'land', 30);
  ok(c.ev.warn >= 1 && c.ev.blast >= 1 && c.kinds.stun >= 2 && c.kinds.phantom >= 3, '사신: 낫 휘두르기(예고 ' + c.ev.warn + ', 기절 ' + c.kinds.stun + '), 원혼 소환 ' + c.kinds.phantom);
  var g = G('land'), p = at(g.paths[0], 6), t = tw(g, 'archer', p.x + 1, p.y), b = spawnEnemy(g, 'reaper', 0, 6); en2Act(g, b, ENEMIES.reaper.acts[0]);
  ok(b.cast && b.cast.r === 2.4 && t.stunT <= 0, '사신: 예고 중(e.cast)에는 아직 안 멈춤'); b.stunT = 1; b.boss = false; stepGame(g, DT); b.boss = true; run(g, 2);
  ok(!b.cast && t.stunT <= 0, '사신: 낫을 드는 동안 기절시키면 끊김');
  var c2 = bossRun('reaper', 'land', 30, function (g, b) { b.hp = b.mhp * 0.4; }); ok(c2.kinds.ph1 && c2.ev.blink >= 1 && c2.ev.ward >= 1, '사신: 체력 절반 아래에서 순간 이동과 보호막');
})();
(function () {
  var c = bossRun('bigtank', 'land', 20), mx = 0; ok(c.ev.eshoot >= 4 && c.kinds.stun >= 2, '거대 전차: 쌍포(포탄 ' + c.ev.eshoot + ', 기절 ' + c.kinds.stun + ')');
  var g = G('land'), p = at(g.paths[0], 6); tw(g, 'archer', p.x + 1, p.y); tw(g, 'archer', p.x - 1, p.y + 1); var b = spawnEnemy(g, 'bigtank', 0, 6); en2Act(g, b, ENEMIES.bigtank.acts[0]);
  ok(g.proj.filter(function (q) { return q.kind === 'eshell'; }).length === 2, '거대 전차: 한 번에 탑 둘을 겨눔');
  var c2 = bossRun('bigtank', 'land', 30, function (g, b) { b.hp = b.mhp * 0.25; }); ok(c2.kinds.soldier >= 4 && c2.ev.rage >= 1, '거대 전차: 체력이 줄면 보병 하차 ' + c2.kinds.soldier + ', 돌진');
})();
(function () {
  var c = bossRun('fortress', 'land', 25); ok(c.b.fly && c.kinds.drone >= 8 && c.ev.eshoot >= 2, '공중 요새: 하늘, 드론 사출 ' + c.kinds.drone + ', 폭탄 ' + c.ev.eshoot);
  ok(c.g.enemies.some(function (e) { return e.k === 'drone' && e.fly && Math.abs(e.d - c.b.d) < 6; }), '공중 요새: 드론은 요새 곁의 하늘 길에서 나옴');
  var c2 = bossRun('carrier', 'sea', 30), g = c2.g, jets = g.enemies.filter(function (e) { return e.k === 'jet'; });
  ok(c2.b.dom === 's' && c2.kinds.jet >= 4 && c2.ev.eshoot >= 1, '항공모함: 바다, 전투기 발진 ' + c2.kinds.jet + ', 갑판포 ' + c2.ev.eshoot);
  ok(c2.ev.leak >= 1 && g.lives < g.maxLives, '항공모함: 띄운 전투기가 성문까지 날아가 생명을 깎음 (생명 ' + g.lives + ')');
  var c3 = bossRun('carrier', 'sea', 40, function (g, b) { b.hp = b.mhp * 0.25; }); ok(c3.kinds.missile >= 1 && c3.kinds.missile <= 4, '항공모함: 궁지에 몰리면 순항 미사일(최대 4발, ' + c3.kinds.missile + ')');
})();
(function () {
  var c = bossRun('titan', 'land', 30); ok(c.ev.ward >= 1 && c.ev.eshoot >= 4 && c.ev.warn >= 1 && c.kinds.stun >= 3, '강철 거신: 보호막 ' + c.ev.ward + ', 미사일 ' + c.ev.eshoot + ', 전자기 충격 예고 ' + c.ev.warn + '를 번갈아');
  var g = G('land'), b = spawnEnemy(g, 'titan', 0, 6), p = at(g.paths[0], 6); tw(g, 'archer', p.x + 1, p.y); b.spd = 0; var seq = [];
  run(g, 26, function (g) { g.ev.forEach(function (e) { if (e.t === 'ward') seq.push('S'); else if (e.t === 'warn' && !e.cancel) seq.push('E'); }); if (g.proj.some(function (q) { return q.kind === 'eshell' && q.t <= DT * 1.5; }) && seq[seq.length - 1] !== 'M') seq.push('M'); });
  ok(seq.join('').indexOf('SME') === 0, '강철 거신: 차례는 보호막 → 미사일 → 충격 (' + seq.join('') + ')');
})();
(function () {
  var c = bossRun('duryeok', 'land', 30); ok(c.kinds.dokkaebi >= 6 && c.ev.warn >= 1 && c.kinds.stun >= 2, '도깨비 대장: 방망이 소환 ' + c.kinds.dokkaebi + ', 내려치기 기절 ' + c.kinds.stun);
  var c2 = bossRun('cheonho', 'land', 30), cl = c2.g.enemies.filter(function (e) { return e.clone; });
  ok(c2.kinds.gumiho >= 4 && c2.kinds.charm >= 3, '천년 구미호: 분신 ' + c2.kinds.gumiho + ', 홀림 ' + c2.kinds.charm);
  var g = G('land'), b = spawnEnemy(g, 'cheonho', 0, 6); en2Act(g, b, ENEMIES.cheonho.acts[0]); var cs = g.enemies.filter(function (e) { return e.clone; });
  ok(cs.length === 2 && cs[0].form === 'cheonho' && cs[0].gold === 0 && Math.abs(cs[0].mhp - b.mhp * 0.05) < 1e-6 && !cs[0].boss && g.boss === b, '천년 구미호: 분신은 본체 모습(e.form), 약하고 금화 없음');
})();
(function () {
  var g = G('all'), b = spawnEnemy(g, 'imugi', 0, 4), tW = 0, sm = 0;
  for (var d = 3; d < 12; d += 1.2) { var p = at(g.sea[0], d); tw(g, 'catapult', p.x - 2, p.y); }
  b.hp = b.mhp = 1e9; run(g, 25, function (g) { g.ev.forEach(function (e) { if (e.t === 'warn') tW++; if (e.t === 'summon' && e.type === 'mulgwisin') sm += e.n; }); });
  ok(b.dom === 's' && b.P === g.sea[0] && tW >= 1 && sm >= 2, '이무기: 바다에서 시작, 해일 예고 ' + tW + ', 물귀신 소환 ' + sm);
  var x0 = b.x, y0 = b.y; b.hp = b.mhp * 0.49; stepGame(g, DT); var mv = evs(g, 'morph')[0], ne = evs(g, 'newEnemy').some(function (e) { return e.k === 'yong'; });
  ok(b.form === 'yong' && b.dom === 'a' && b.fly && b.lane === 1 && b.route === 'air' && mv && mv.to === 'yong' && ne && g.boss === b && !b.dead, '이무기 → 용 변신: 영역 s → a, 항로로(e.form, e.lane), 우두머리 유지');
  ok(Math.hypot(b.x - x0, b.y - y0) < 0.3 && b.spd === ENEMIES.yong.spd && b.armor === ENEMIES.yong.armor, '용: 변신 자리에서 이어 날고 능력치가 용의 것으로');
  ok(!targetable(g, b, 'gs') && targetable(g, b, 'a'), '용: 바다, 땅 전용 탑은 못 겨눔(대공 필요)');
  var bolt = 0, wsp = 0, lives = g.lives; run(g, 200, function (g) { g.ev.forEach(function (e) { if (e.t === 'towerStun' && e.why === 'imugi') bolt++; if (e.t === 'summon' && e.type === 'wisp') wsp += e.n; }); return b.dead; });
  ok(bolt >= 1 && wsp >= 4 && b.dead && g.lives === Math.max(0, lives - 20), '용: 벼락으로 탑 기절 ' + bolt + ', 도깨비불 ' + wsp + ', 항로 끝에 닿으면 생명이 깎임');
  var g2 = G('sea'), b2 = spawnEnemy(g2, 'imugi', 0, 4); b2.hp = b2.mhp * 0.4; stepGame(g2, DT); ok(b2.form === 'yong' && b2.fly && b2.lane === 0 && isFinite(b2.x) && b2.P.len > 3, '항로 없는 판에서는 하늘 곡선으로 변신');
  var g3 = G('land'), y = spawnEnemy(g3, 'yong', 0, 3); run(g3, 10); ok(y.fly && y.boss && !y.dead, '용을 바로 소환해도 동작');
})();
// 바르칸 무릎 꿇기(최후의 화살 마무리)는 그대로
(function () {
  var g = G('land'); g.unlockedSkills.last = 1; var b = spawnEnemy(g, 'barkan', 0, g.paths[0].len - 4); hit(g, b, b.mhp * 0.99);
  ok(b.kneel === 1 && g.finale === 1 && !b.dead && hit(g, b, 1e9) === 0, '바르칸: 체력 2%에서 무릎 꿇고 더 안 맞음(finale 1)');
  run(g, 1); ok(castLast(g, b.x, b.y) && g.finale === 2 && b.dead, '바르칸: 최후의 화살로 마무리'); stepGame(g, DT); ok(g.over === 1, '바르칸: 승리');
})();

// ========== 6) 53종 전부 300초 ==========
(function () {
  var g = G('all'), errs = 0, nan = 0, angBad = 0, kinds = ['archer', 'catapult', 'arcane', 'frost', 'ballista', 'bell', 'flame', 'alchemy', 'cannon'], n = 0, seen = {};
  for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) if ((c * 7 + r * 3) % 4 === 0) { var k = kinds[n % kinds.length]; if (canBuildAt(g, c, r, k)) { var t = buildTower(g, k, c, r, true); n++; if (t && n % 3 === 0) { upgradeTower(g, t); upgradeTower(g, t); upgradeTower(g, t, n % 2); } } }
  g.lives = g.maxLives = 1e9; g.unlockedSkills.wall = 1;
  var steps = Math.round(300 / DT), every = Math.floor(steps / (EN2_ORDER.length * 3)), si = 0, maxEn = 0, evn = {};
  for (var s = 0; s < steps; s++) {
    if (s % every === 0 && si < EN2_ORDER.length * 3) { var k2 = EN2_ORDER[si % EN2_ORDER.length]; si++; try { var e = spawnEnemy(g, k2, si, 0); if (e.boss) { e.hp = e.mhp = e.mhp * 0.02; } seen[k2] = 1; } catch (er) { errs++; console.log('spawn', k2, er.stack); } }
    if (s % 600 === 300) { g.sk.wall.cd = 0; var wp = at(g.paths[0], 8 + (s / 600) % 5); castWall(g, wp.x, wp.y); g.units.push({ kind: 'en2dummy', x: wp.x + 0.2, y: wp.y + 1, hp: 200, block: 1 }); }
    try { stepGame(g, DT); } catch (er2) { errs++; if (errs < 4) console.log('ERR', er2.stack); }
    g.ev.forEach(function (v) { evn[v.t] = (evn[v.t] || 0) + 1; }); g.ev.length = 0; maxEn = Math.max(maxEn, g.enemies.length);
    if (s % 30 === 0) g.enemies.forEach(function (e) { if (!isFinite(e.x) || !isFinite(e.y) || !isFinite(e.hp) || !isFinite(e.d) || !isFinite(e.spdK)) nan++; var q = at(e.P, e.d); if (!e.dead && !(e.reviveT > 0) && Math.abs(angDiff(e.ang, Math.atan2(q.dy, q.dx))) > 1e-6) angBad++; });
    g.over = 0;
  }
  ok(errs === 0 && nan === 0 && Object.keys(seen).length === 53, '53종 전부 소환해 300초: 오류 ' + errs + ', 비정상 수치 ' + nan + ', 탑 ' + g.towers.length + '개, 처치 ' + g.stats.kills + ', 최대 동시 ' + maxEn);
  ok(maxEn <= 160 && g.proj.length < 400, '적과 탄 수가 폭주하지 않음(소환 상한)');
  ok(angBad === 0, '진행 방향 e.ang이 항상 지금 길의 방향(위에서 본 그림을 돌려 그리는 적용)');
  ok(evn.towerStun > 5 && evn.morph >= 1 && evn.blast > 5 && evn.summon > 5 && evn.leap >= 1, '사건: towerStun ' + evn.towerStun + ', morph ' + evn.morph + ', blast ' + evn.blast + ', summon ' + evn.summon + ', leap ' + evn.leap + ', blink ' + (evn.blink || 0));
})();

// ========== 7) 웨이브: 영역, 떼, 소개, 우두머리 ==========
function wv(kind, extra, dk) { return genWaves(en2Stage(kind, null, extra), dk || 'normal'); }
function cnt(W, pred) { var n = 0; W.forEach(function (w) { w.groups.forEach(function (gr) { if (pred(ENEMIES[gr.type], gr)) n += gr.n; }); }); return n; }
function wavesWith(W, pred) { return W.filter(function (w) { return w.groups.some(function (gr) { return pred(ENEMIES[gr.type], gr); }); }).length; }
var isSea = function (E) { return fdDom(E) === 's'; }, isLane = function (E) { return !!E.lane; }, isFly = function (E) { return !!E.fly; };
(function () {
  var pool = ['soldier', 'jeep', 'drone', 'boat', 'destroyer', 'jet', 'missile', 'tank'], ex = { pool: pool, intro: { jeep: 1, drone: 2, boat: 1, jet: 3, destroyer: 5, missile: 6, tank: 7 }, boss: 'bigtank', waves: 16, bud: 3 };
  var W = wv('all', ex);
  ok(W.length === 16 && wavesWith(W, isSea) >= 11 && wavesWith(W, isLane) >= 6, '뱃길과 항로가 있는 판: 바다 적 ' + wavesWith(W, isSea) + '웨이브, 항로 적 ' + wavesWith(W, isLane) + '웨이브에 섞임');
  var early = 0; W.forEach(function (w, i) { w.groups.forEach(function (gr) { if (ex.intro[gr.type] != null && ex.intro[gr.type] > i) early++; }); });
  ok(early === 0 && W[1].kind === 'intro' && W[15].kind === 'boss' && W[15].groups.filter(function (gr) { return gr.boss && gr.type === 'bigtank'; }).length === 1, 'intro(처음 나오는 웨이브)를 지킴, 마지막은 우두머리 웨이브');
  ok(JSON.stringify(W) === JSON.stringify(wv('all', ex)), '같은 판은 항상 같은 웨이브');
  var WL = wv('land', ex), WS = wv('sea', ex), WA = wv('air', ex);
  ok(cnt(WL, isSea) === 0 && cnt(WL, isLane) === 0 && cnt(WS, isLane) === 0 && cnt(WS, isSea) > 0 && cnt(WA, isSea) === 0 && cnt(WA, isLane) > 0, '길이 없는 영역의 적은 pool에 있어도 빠짐(땅 판, 바다 판, 항로 판)');
  var fl = 0, flBad = 0; W.forEach(function (w) { w.groups.forEach(function (gr) { if (gr.type === 'drone') { if (gr.flock && gr.n <= 5 && gr.gap < 0.3) fl++; else if (gr.n >= 4) flBad++; } if (gr.type === 'missile' && gr.n > 4) flBad++; }); });
  ok(fl >= 2 && flBad === 0, '떼(드론)는 5마리씩 무리로(' + fl + '무리), 순항 미사일은 한 묶음 4발까지');
  var pathsOk = true; W.forEach(function (w) { w.groups.forEach(function (gr) { if (gr.path >= fdRouteN(MAPS[en2Stage('all', null, ex)], ENEMIES[gr.type])) pathsOk = false; }); }); ok(pathsOk, '길 번호는 그 영역의 길 목록 안');
  var Wh = wv('all', ex, 'hard'); ok(Wh.length === 21 && Wh[20].kind === 'boss', '어려움: 웨이브 +5, 마지막이 우두머리');
  var ge = newGame(en2Stage('all', null, ex), 'endless', { cards: false }), eerr = 0; for (var i = 0; i < 40; i++) { var w = waveAt(ge, i); w.groups.forEach(function (gr) { if (!ENEMIES[gr.type] || !(gr.n >= 1)) eerr++; }); } ok(eerr === 0, '무한 모드 웨이브 40개 생성');
  // 규칙이 구성을 바꿈
  var n0 = cnt(W, function (E, gr) { return !gr.boss; });
  var Wsw = genWaves(en2Stage('all', { id: 'swarm' }, ex), 'normal'), Wel = genWaves(en2Stage('all', { id: 'elite' }, ex), 'normal');
  ok(cnt(Wsw, function (E, gr) { return !gr.boss; }) > n0 * 1.4 && cnt(Wel, function (E, gr) { return !gr.boss; }) < n0 * 0.7, 'swarm은 수가 늘고 elite는 줄어듦 (' + n0 + ' → ' + cnt(Wsw, function (E, gr) { return !gr.boss; }) + ' / ' + cnt(Wel, function (E, gr) { return !gr.boss; }) + ')');
  function thr(Wx, pred) { var a = 0, b = 0; Wx.forEach(function (w) { w.groups.forEach(function (gr) { if (gr.boss) return; var t = threatOf(gr.type) * gr.n; b += t; if (pred(ENEMIES[gr.type])) a += t; }); }); return a / b; }
  var War = genWaves(en2Stage('all', { id: 'airraid' }, ex), 'normal'), Wld = genWaves(en2Stage('all', { id: 'landing' }, ex), 'normal');
  ok(thr(War, isFly) > 0.5 && thr(War, isFly) > thr(W, isFly) + 0.1, 'airraid: 하늘 적이 주력 (' + thr(W, isFly).toFixed(2) + ' → ' + thr(War, isFly).toFixed(2) + ')');
  ok(thr(Wld, isSea) > 0.5 && thr(Wld, isSea) > thr(W, isSea) + 0.1, 'landing: 바다 적이 주력 (' + thr(W, isSea).toFixed(2) + ' → ' + thr(Wld, isSea).toFixed(2) + ')');
  var ex3 = { pool: pool, intro: {}, boss: 'titan', waves: 16, bud: 3, ch: 3 }, Wbr = genWaves(en2Stage('all', { id: 'bossrush' }, ex3), 'normal'), bs = [];
  Wbr.forEach(function (w, i) { w.groups.forEach(function (gr) { if (gr.boss) bs.push((i + 1) + ':' + gr.type); }); });
  ok(bs.length === 4 && bs[3] === '16:titan' && bs[0] === '4:bigtank' && bs[1] === '8:fortress' && bs[2] === '12:carrier' && bs.slice(0, 3).every(function (s) { return ENEMIES[s.split(':')[1]].boss && s.split(':')[1] !== 'titan'; }), 'bossrush: 4웨이브마다 우두머리 (' + bs.join(', ') + ')');
  var Wb1 = genWaves(en2Stage('land', { id: 'bossrush' }, { pool: ['goblin', 'orc'], boss: 'barkan', waves: 12, ch: 1 }), 'normal'), hasFinal = false; Wb1.slice(0, 11).forEach(function (w) { w.groups.forEach(function (gr) { if (gr.type === 'barkan') hasFinal = true; }); });
  ok(!hasFinal, 'bossrush: 바르칸은 중간 우두머리로 나오지 않음');
})();

// ========== 8) 판 규칙 14종 ==========
ok(RULE_ORDER.length === 14 && RULE_ORDER.every(function (id) { return RULES[id] && RULE_INFO[id] && RULE_INFO[id].name && RULE_INFO[id].desc; }), '규칙 14종 등록(이름, 설명 포함)');
(function () {
  var g0 = G('land'), a0 = tw(g0, 'archer', 5, 3), r0 = a0.st.range;
  var g = G('land', { id: 'fog' }), a = tw(g, 'archer', 5, 3); ok(Math.abs(a.st.range - r0 * 0.85) < 1e-6 && ruleBlocks(g, 'archer') === null, 'fog: 탑 사거리 -15%');
  var gn = G('land', { id: 'night' }), an = tw(gn, 'archer', 5, 3), near = tw(gn, 'archer', gn.gate.x + 1, gn.gate.y - 1);
  ok(Math.abs(an.st.range - r0 * 0.7) < 1e-6 && an.dark === 1 && Math.abs(near.st.range - r0) < 1e-6 && near.dark === 0, 'night: 어둠 속 탑은 사거리 -30%, 성문 곁은 그대로');
  var bell = tw(gn, 'bell', an.x + 1, an.y); ok(Math.abs(an.st.range - r0) < 1e-6 && an.dark === 0, 'night: 조명 탑(종탑) 곁의 탑은 사거리 회복');
  var e1 = spawnEnemy(gn, 'orc', 0, 0.2), e2 = spawnEnemy(gn, 'orc', 0, 0); e2.x = an.x; run(gn, 0.5); var e3 = spawnEnemy(gn, 'orc', 0, 1); e3.spd = 0; var pp = at(gn.paths[0], 1); run(gn, 0.5);
  ok(gn.rule.lit.length === gn.towers.length + 1 && gn.enemies.some(function (e) { return e.dark === 1; }), 'night: 밝은 곳 목록(g.rule.lit)과 어둠 속 적(e.dark)');
  sellTower(gn, bell); ok(Math.abs(an.st.range - r0 * 0.7) < 1e-6, 'night: 조명 탑을 팔면 다시 어두워짐');
})();
(function () {
  function overlap(rule) {
    var g = newGame(en2Stage('land', rule, { pool: ['troll'], bud: 3 }), 'normal', { cards: false }); callEarly(g); var mx0 = g.nextMax, push = 0, ov = 0;
    run(g, 80, function (g) { push += evs(g, 'ruleEv').filter(function (e) { return e.k === 'push'; }).length; if (g.wave >= 2 && g.enemies.length) { ov = 1; } g.lives = 99; return g.wave >= 3; });
    return { mx: mx0, wave: g.wave, push: push, g: g };
  }
  var a = overlap(null), b = overlap({ id: 'rush' });
  ok(b.mx < a.mx * 0.7 && a.wave === 1 && b.wave >= 3 && b.push >= 2, 'rush: 간격이 짧고(' + a.mx.toFixed(1) + ' → ' + b.mx.toFixed(1) + '초) 적이 남아도 다음 웨이브가 옴(웨이브 ' + a.wave + ' / ' + b.wave + ')');
  var gc = newGame(en2Stage('land', { id: 'rush' }, { pool: ['troll'], bud: 3 }), 'normal', {}); if (gc.pickWait) abilityPick(gc, gc.pickCards[0].id); callEarly(gc); gc.wave = 3; gc.nextT = 0; spawnEnemy(gc, 'troll', 0, 0); gc.lives = 99;
  run(gc, 3); ok(gc.wave === 3, 'rush: 능력 카드를 고를 차례(3웨이브째)에는 밀어 넣지 않음');
})();
(function () {
  var g0 = G('land'), o0 = spawnEnemy(g0, 'orc', 0, 0), b0 = spawnEnemy(g0, 'grumsh', 0, 0);
  var gs = G('land', { id: 'swarm' }), o1 = spawnEnemy(gs, 'orc', 0, 0), b1 = spawnEnemy(gs, 'grumsh', 0, 0);
  var ge = G('land', { id: 'elite' }), o2 = spawnEnemy(ge, 'orc', 0, 0), b2 = spawnEnemy(ge, 'grumsh', 0, 0);
  ok(Math.abs(o1.mhp - o0.mhp * 0.55) < 1e-6 && o1.hp === o1.mhp && o1.gold < o0.gold && b1.mhp === b0.mhp, 'swarm: 적 체력 55%, 금화 줄어듦, 우두머리는 그대로');
  ok(Math.abs(o2.mhp - o0.mhp * 1.9) < 1e-6 && o2.gold > o0.gold && b2.mhp === b0.mhp, 'elite: 적 체력 1.9배, 금화 늘어남');
  var gp = newGame(en2Stage('land', { id: 'poor' }), 'normal', { cards: false }), gq = newGame(en2Stage('land'), 'normal', { cards: false }); gp.waiting = false;
  var o3 = spawnEnemy(gp, 'orc', 0, 0); ok(gp.gold === Math.round(gq.gold * 0.5) && o3.gold === Math.round(o0.gold * 1.3), 'poor: 시작 금화 절반(' + gq.gold + ' → ' + gp.gold + '), 처치 금화 +30%');
  var gf = newGame(en2Stage('land', { id: 'fragile' }), 'normal', { cards: false }); ok(gf.lives === 5 && gf.maxLives === 5, 'fragile: 생명 5');
  gf.waiting = false; var mg = spawnEnemy(gf, 'goblin', 0, gf.paths[0].len - 0.2); run(gf, 1); ok(gf.lives === 4, 'fragile: 한 마리 새면 4');
})();
(function () {
  var g = G('land', { id: 'limit', n: 3 }), cells = []; for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) if (canBuildAt(g, c, r, 'archer')) cells.push([c, r]);
  var built = 0; for (var i = 0; i < 3; i++) if (buildTower(g, 'archer', cells[i][0], cells[i][1])) built++;
  g.ev.length = 0; var t4 = buildTower(g, 'archer', cells[3][0], cells[3][1]), be = evs(g, 'ruleEv')[0];
  ok(built === 3 && t4 === null && !canBuildAt(g, cells[3][0], cells[3][1], 'archer') && typeof ruleBlocks(g, 'archer') === 'string' && g.whyNot === ruleBlocks(g, 'archer') && be && be.k === 'block' && be.why === g.whyNot, 'limit: 탑 3개까지만, 막힌 이유(ruleBlocks, g.whyNot, ruleEv block): ' + ruleBlocks(g, 'archer'));
  sellTower(g, g.towers[0]); ok(ruleBlocks(g, 'archer') === null && !!buildTower(g, 'archer', cells[3][0], cells[3][1]), 'limit: 팔면 다시 지을 수 있음');
  var gb = G('land', { id: 'ban', kinds: ['catapult', 'frost'] });
  ok(!buildTower(gb, 'catapult', cells[0][0], cells[0][1]) && /투석기/.test(ruleBlocks(gb, 'catapult')) && ruleBlocks(gb, 'archer') === null && !!buildTower(gb, 'archer', cells[0][0], cells[0][1]), 'ban: 금지된 탑은 못 짓고 이유를 돌려줌: ' + ruleBlocks(gb, 'catapult'));
  var g0 = G('land'); ok(ruleBlocks(g0, 'archer') === null && ruleBlocks(null, 'archer') === null && rlInfo(MAPS[en2Stage('land')]) === null && rlInfo(MAPS[en2Stage('land', { id: 'limit', n: 3 })]).desc.indexOf('3') >= 0, '규칙 없는 판: ruleBlocks null, rlInfo null');
})();
(function () {
  var g = G('land', { id: 'blackout' }); for (var i = 0; i < 6; i++) tw(g, 'archer', 2 + i, 3 + i * 2);
  run(g, 20); ok(g.towers.every(function (t) { return t.stunT <= 0; }), 'blackout: 웨이브가 없을 때는 안 일어남');
  var e = spawnEnemy(g, 'troll', 0, 0); e.hp = e.mhp = 1e9; e.spd = 0.01; var warn = 0, hitN = 0, maxStun = 0, first = -1, t0 = g.t;
  run(g, 40, function (g) { evs(g, 'ruleEv').forEach(function (v) { if (v.k === 'warn') warn++; if (v.k === 'hit') { hitN++; if (first < 0) first = g.t - t0; maxStun = Math.max(maxStun, v.tws.length); } }); });
  ok(warn >= 2 && hitN >= 2 && maxStun === 2 && warn >= hitN, 'blackout: 주기적으로 탑 2개가 3초 정지(예고 ' + warn + ', 발생 ' + hitN + ')');
  var gm = G('land', { id: 'meteor' }); for (var j = 0; j < 6; j++) tw(gm, 'archer', 2 + j, 3 + j * 2);
  var e2 = spawnEnemy(gm, 'troll', 0, 0); e2.hp = e2.mhp = 1e9; e2.spd = 0.01; var marks = 0, hits = 0, stuns = 0, sawMark = 0, early = 0;
  run(gm, 50, function (g) { if (g.rule.marks.length) { sawMark = 1; var m = g.rule.marks[0]; if (!(m.t > 0 && m.T === 2 && m.r > 0)) early++; } g.ev.forEach(function (v) { if (v.t === 'ruleEv' && v.k === 'mark') marks++; if (v.t === 'ruleEv' && v.k === 'hit') hits++; if (v.t === 'towerStun' && v.why === 'meteor') stuns++; }); });
  ok(marks >= 3 && hits >= 3 && stuns >= 2 && sawMark === 1 && early === 0, 'meteor: 예고 자리(g.rule.marks) ' + marks + '번, 2초 뒤 낙하 ' + hits + '번, 탑 기절 ' + stuns);
})();
(function () {
  var ex = { pool: ['soldier', 'drone', 'boat', 'jet'], intro: {}, bud: 3, boss: 'bigtank', waves: 8 };
  var ga = newGame(en2Stage('all', { id: 'airraid' }, ex), 'normal', { cards: false }), sir = 0; for (var i = 0; i < 4; i++) { startWave(ga); sir += evs(ga, 'ruleEv').filter(function (e) { return e.k === 'siren'; }).length; ga.ev.length = 0; ga.waiting = false; }
  var gl = newGame(en2Stage('all', { id: 'landing' }, ex), 'normal', { cards: false }), sir2 = 0; for (var j = 0; j < 4; j++) { startWave(gl); sir2 += evs(gl, 'ruleEv').filter(function (e) { return e.k === 'siren'; }).length; gl.ev.length = 0; }
  ok(sir >= 3 && sir2 >= 3, 'airraid, landing: 그 영역의 적이 오는 웨이브에 경보 사건 (' + sir + ', ' + sir2 + ')');
  var gb = G('land', { id: 'bossrush' }, { pool: ['soldier'], boss: 'titan' }), g0 = G('land'), m0 = spawnEnemy(g0, 'bigtank', 0, 0), mini = spawnEnemy(gb, 'bigtank', 0, 0), fin = spawnEnemy(gb, 'titan', 0, 0), f0 = spawnEnemy(g0, 'titan', 0, 0);
  ok(Math.abs(mini.mhp - m0.mhp * 0.5) < 1e-6 && mini.leak === 8 && mini.mini === 1 && fin.mhp === f0.mhp && fin.leak === 20, 'bossrush: 중간 우두머리는 체력 절반, 새면 생명 8. 마지막 우두머리는 그대로');
})();

// ========== 9) 저장 복원(웨이브마다 이어하기, ui.js snapMid/applyMid와 같은 절차) ==========
(function () {
  function snap(g) { return JSON.parse(JSON.stringify({ mi: g.mi, dk: g.dk, wave: g.wave, gold: g.gold - (g.lastMint || 0), lives: g.lives, towers: g.towers.map(function (t) { return { k: t.k, c: t.c, r: t.r, lvl: t.lvl, br: t.br, mode: t.mode, spent: t.spent }; }), obs: g.obs.map(function (o) { return [Math.round(o.hp), o.alive]; }), ab: abilitySnap(g) })); }
  function apply(g, m) { g.wave = m.wave - 1; g.gold = m.gold; g.lives = m.lives; g.waiting = true; m.towers.forEach(function (t) { var x = buildTower(g, t.k, t.c, t.r, true); if (x) { x.lvl = t.lvl; x.br = t.br; x.mode = t.mode; x.spent = t.spent; } }); abilityRestore(g, m.ab); refreshStats(g); g.ev = []; }
  var ex = { pool: ['zombie', 'vampire', 'witch', 'pumpkin'], intro: {}, bud: 2, waves: 8 };
  ['fragile', 'limit', 'meteor', 'night', 'poor', 'blackout'].forEach(function (id) {
    var mi = en2Stage('land', { id: id, n: 5 }, ex), g = newGame(mi, 'normal', {}), B = makeBot(g, {}), n = 0;
    while (!g.over && g.wave < 3 && n++ < 60 * 400) { botTick(B, DT); stepGame(g, DT); g.ev.length = 0; }
    while (!g.over && !fieldClear(g) && n++ < 60 * 600) { botTick(B, DT); stepGame(g, DT); g.ev.length = 0; }
    var m = snap(g), g2 = newGame(mi, 'normal', {}); apply(g2, m); stepGame(g2, DT);
    var same = g2.towers.length === g.towers.length && g2.gold === m.gold && g2.lives === m.lives && g2.rule && g2.rule.id === id && g2.rule !== g.rule && g2.wave === m.wave - 1;
    if (id === 'fragile') same = same && g2.maxLives === g.maxLives && g2.maxLives <= 5 + 3 * 3 && g2.lives <= g2.maxLives;
    if (id === 'limit') same = same && g2.towers.length <= 5 && (g2.towers.length < 5 || typeof ruleBlocks(g2, 'archer') === 'string');
    if (id === 'meteor') same = same && Array.isArray(g2.rule.marks) && g2.rule.marks.length === 0;
    if (id === 'night') same = same && g2.towers.every(function (t, i) { return Math.abs(t.st.range - g.towers[i].st.range) < 1e-6 && t.dark === g.towers[i].dark; });
    callEarly(g2); var err = 0; try { run(g2, 30); } catch (e) { err++; console.log(e.stack); }
    ok(same && err === 0 && g2.wave === m.wave, '저장 복원(' + id + '): 탑 ' + g2.towers.length + '개, 금화, 생명 ' + m.lives + '/' + g2.maxLives + ', 규칙 상태가 이어지고 다음 웨이브 진행');
  });
  // 전투 중 상태는 저장 대상이 아님(웨이브 사이에만 저장): 변신한 적, 멈춘 탑이 남아 있어도 저장 자료에 들어가지 않고 순환 참조도 없음
  var g = G('land'), v = spawnEnemy(g, 'vampire', 0, 5); down(g, v, 0.4); var t = tw(g, 'archer', 3, 3); en2StunTower(g, t, 2, 'test'); run(g, 0.2);
  var s = snap(g); ok(v.form === 'vampbat' && s.towers.length === 1 && s.towers[0].stunT === undefined && JSON.stringify(s).indexOf('vampbat') < 0, '저장 자료에는 전투 중 상태(변신, 기절)가 섞이지 않음');
})();

// ========== 10) 난이도: 대응을 강제하는가 ==========
(function () {
  function play(kind, pool, towers, sec) {
    var mi = en2Stage(kind, null, { pool: pool, intro: {}, bud: 2.2, waves: 8, gold: 900 }), g = newGame(mi, 'normal', { cards: false, towers: towers }), B = makeBot(g, { allowed: towers }), n = 0;
    while (!g.over && n++ < 60 * 900) { botTick(B, DT); stepGame(g, DT); g.ev.length = 0; }
    return g;
  }
  var a = play('air', ['soldier', 'bats', 'jet'], ['catapult', 'cannon'], 0), b = play('air', ['soldier', 'bats', 'jet'], ['catapult', 'cannon', 'archer', 'ballista'], 0);
  ok(a.over === -1 && b.lives > a.lives, '하늘을 못 치는 탑만으로는 하늘 적이 샌다(패배), 대공이 되는 탑을 넣으면 버팀 (생명 ' + a.lives + ' → ' + b.lives + ')');
})();

// ========== 11) 실제 판 전수 점검(stages_ch*.js): 웨이브의 모든 적을 소환해 60초, 규칙 포함 ==========
(function () {
  var errs = 0, nStage = 0, rules = {};
  MAPS.forEach(function (M, mi) {
    if (M.ch === 9) return; nStage++;
    try {
      if (M.rule && M.rule.id) { rules[M.rule.id] = 1; if (!RULES[M.rule.id]) { errs++; console.log(M.id, '없는 규칙', M.rule.id); } }
      var W = genWaves(mi, 'normal'), g = newGame(mi, 'normal', { cards: false }), ks = {}; g.waiting = false; g.gold = 1e6; g.lives = g.maxLives = 1e9;
      W.forEach(function (w) { w.groups.forEach(function (gr) { ks[gr.type] = gr.path; if (!ENEMIES[gr.type] || fdRouteN(M, ENEMIES[gr.type]) < 1) { errs++; console.log(M.id, '길 없는 적', gr.type); } }); });
      var n = 0; for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) if ((c + r * 3) % 5 === 0 && canBuildAt(g, c, r, 'archer')) buildTower(g, n++ % 2 ? 'archer' : 'catapult', c, r, true);
      for (var k in ks) spawnEnemy(g, k, ks[k], 0);
      for (var s = 0; s < 3600; s++) { stepGame(g, DT); g.ev.length = 0; g.over = 0; }
    } catch (e) { errs++; console.log(M.id, e.stack); }
  });
  ok(errs === 0, '실제 판 ' + nStage + '개: 웨이브의 모든 적을 소환해 60초, 오류 ' + errs + (Object.keys(rules).length ? ', 쓰인 규칙 ' + Object.keys(rules).join(', ') : ''));
})();

console.log(fails ? 'FAILS ' + fails + ' / ' + (oks + fails) : 'ALL OK (' + oks + ')');
var EN2_FAILS = fails;
`);
process.exit(ctx.run('EN2_FAILS') ? 1 : 0);
