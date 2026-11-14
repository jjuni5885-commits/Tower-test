// 탑 시험(ENG2): node tools/tw2test.js [full]
// 탑마다 맞히는 영역, 피해, 특수 효과, 변신 사건, 합체, 판매, 저장 복원, 유닛 수 상한, 카드, 봇, 엄격 모드
// 판은 tools/tw2lib.js의 tw2Stage 한 군데에서만 고른다(시험용 판 'tw2lab'). full을 붙이면 실제 판 전부를 봇으로 완주(느림)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = require('./tw2lib.js')();
ctx.__full = process.argv[2] === 'full';
ctx.run(`
var fails = 0, oks = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL', m); } else { oks++; if (!ok.quiet) console.log('ok  ', m); } }
function evs(g, name) { return g.ev.filter(function (e) { return e.t === name; }); }
function runEv(g, sec, names) { var out = {}; names.forEach(function (n) { out[n] = []; }); tw2Run(g, sec, function (g2) { for (var i = 0; i < g2.ev.length; i++) { var e = g2.ev[i]; if (out[e.t]) out[e.t].push(e); } }); return out; }
var ALL = TOWER_ORDER.concat(TW2_ADMIN).concat(FUSIONS.map(function (f) { return f.to; }));

// ---------- 1) 자료 ----------
ok(TOWER_ORDER.length === 24 && TW2_ORDER.every(function (k) { return TOWER_ORDER.indexOf(k) >= 0; }), 'TOWER_ORDER 24종');
var bad = []; TOWER_ORDER.forEach(function (k) { var T = TOWERS[k]; if (!T.site || !T.hit || T.br.length !== 2 || T.br.some(function (B) { return B.tiers.length !== 3 || !B.ult || !B.name || !B.desc; }) || T.lv.length !== 3 || fdMaxLv(k, 0) !== 6 || fdMaxLv(k, 1) !== 6) bad.push(k); });
ok(bad.length === 0, '24종 모두 site, hit, 갈래 2개 x 3단계(6단계 궁극 이름) ' + bad.join(','));
var seen = {}, rar = 0; ['common', 'rare', 'legend'].forEach(function (r) { TW_RARITY[r].forEach(function (k) { seen[k] = (seen[k] || 0) + 1; rar++; }); });
ok(rar === 24 && TOWER_ORDER.every(function (k) { return seen[k] === 1; }) && TW_RARITY.common.length === 7 && TW_RARITY.rare.length === 10 && TW_RARITY.legend.length === 7, 'TW_RARITY: 일반 7, 희귀 10, 전설 7 (24종 한 번씩)');
ok(FUSIONS.length === 8 && FUSIONS.every(function (F) { return TOWERS[F.to] && TOWERS[F.to].fusion && TOWERS[F.to].lv.length === 3 && TOWERS[F.a] && TOWERS[F.b]; }) && TW2_ADMIN.every(function (k) { return TOWERS[k].admin; }), '합체 8종, 관리자 2종 자료');
var noAct = []; ALL.forEach(function (k) { var T = TOWERS[k]; [[1, 0], [6, 0], [6, 1]].forEach(function (q) { var kd = towerStats(k, Math.min(q[0], fdMaxLv(k, q[1])), q[1]).kind; if (['arrow', 'stone', 'orb', 'chain', 'beam', 'pulse', 'bolt', 'cone', 'ring', 'flask', 'shell', 'aura', 'mint'].indexOf(kd) < 0 && !TW_ACT[kd]) noAct.push(k + ':' + kd); }); });
ok(noAct.length === 0, '새 공격 종류마다 TW_ACT 등록 ' + noAct.join(','));
ok(TOWERS.bell.light === 1 && TOWERS.jangseung.light === 1 && fdSite('warship') === 'water' && fdSite('turtle') === 'water' && fdSite('fz_carrier') === 'water' && fdSite('fz_dragonship') === 'water', '조명 탑(bell, jangseung), 수상 탑 site');
var costBad = []; TOWER_ORDER.forEach(function (k) { [0, 1].forEach(function (b) { var c5 = upgCost(k, 4, b), c6 = upgCost(k, 5, b); if (!(c6 > c5 * 1.3 && c6 < c5 * 2)) costBad.push(k + b); }); });
ok(costBad.length === 0, '6단계 값은 5단계 값의 1.3~2배 ' + costBad.join(','));

// ---------- 2) 맞히는 영역: 허수아비(땅, 하늘, 바다)에게 피해가 들어가는지가 hit과 맞는지 ----------
ok.quiet = 1; var domBad = [], nDom = 0;
ALL.forEach(function (k) {
  var T = TOWERS[k], lv = T.br.length ? [[1, 0], [6, 0], [6, 1]] : [[1, 0], [3, 0]];
  lv.forEach(function (q) {
    ['g', 'a', 's'].forEach(function (dom) {
      var g = tw2Game(), t = tw2Build(g, k, q[0], q[1]); if (!t) { domBad.push(k + ' 건설 실패'); return; }
      var L = tw2Dummies(g, dom, 1), e = L[0]; tw2Run(g, 9);
      var lost = tw2Lost(L), can = t.hit.indexOf(dom) >= 0, st = t.st, reach = Math.max(st.range || 0, st.flameR || 0) + 0.14 >= hyp(t.x, t.y, e.x, e.y) || st.kind === 'airbase' || st.kind === 'dragon' || st.kind === 'orbital';
      nDom++;
      if (k === 'mint' || (k === 'bell' && !st.auraDps)) { if (lost > 0) domBad.push(k + ' 피해가 있으면 안 됨'); return; }
      if (st.kind === 'aura' || st.kind === 'pulse' || st.kind === 'ring' || st.kind === 'cone') can = true;   // 기존 범위 공격은 모든 영역
      if (!can && lost > 0) domBad.push(k + ' L' + q[0] + 'AB'[q[1]] + ' ' + dom + ': 못 맞힐 영역에 피해 ' + Math.round(lost));
      if (can && reach && !(lost > 0)) domBad.push(k + ' L' + q[0] + 'AB'[q[1]] + ' ' + dom + ': 맞혀야 하는데 피해 0');
    });
  });
});
ok.quiet = 0; ok(domBad.length === 0, '맞히는 영역 ' + nDom + '가지(탑 x 단계 x 영역): ' + (domBad.slice(0, 6).join(' / ') || '모두 hit과 일치'));
ok(fdHit('flak') === 'a' && fdHit('gatling') === 'ga' && fdHit('rocket') === 'gs' && fdHit('barracks') === 'g' && fdHit('warship') === 'gs', '기본 hit: 대공포 a, 기관포 ga, 로켓 gs, 병영 g, 전함 gs');
(function () { var g = tw2Game(), t = tw2Build(g, 'sam', 5, 1), w = tw2Build(g, 'warship', 5, 0); ok(t.hit === 'gas' && w.hit === 'gas' && tw2Build(tw2Game(), 'sam', 5, 0).hit === 'a', '갈래에 따라 hit이 바뀜(다탄두 미사일, 미사일 순양함 gas)'); })();

// ---------- 3) 변신: 6단계까지, 사건 transform, 이름 ----------
var trBad = [];
TOWER_ORDER.forEach(function (k) { [0, 1].forEach(function (b) {
  var g = tw2Game(), t = tw2Build(g, k, 1, 0), n = 0; g.ev.length = 0; while (upgradeTower(g, t, b) && n++ < 9) { }
  var tf = evs(g, 'transform');
  if (t.lvl !== 6 || t.br !== b || tf.length !== 2 || tf[0].lvl !== 4 || tf[1].lvl !== 6 || tf[1].ult !== 1 || tf[1].tw !== t || towerTitle(k, 6, b) !== TOWERS[k].br[b].ult || canUpgrade(g, t)) trBad.push(k + b);
  var g5 = tw2Game({ maxLv: 5 }), t5 = tw2Build(g5, k, 6, b); if (t5.lvl !== 5) trBad.push(k + b + ' maxLv5');
}); });
ok(trBad.length === 0, '24종 x 갈래 2: 6단계 궁극까지 변신, transform 사건(4단계, 6단계 ult), maxLv 5면 5단계까지 ' + trBad.join(','));

// ---------- 4) 탑별 특수 효과 ----------
(function () {
  var g, t, L, e, E, a, b;
  // 대공포
  g = tw2Game(); t = tw2Build(g, 'flak', 5, 1); L = tw2Dummies(g, 'a', 3); E = runEv(g, 4, ['blast', 'muzzle']);
  ok(E.blast.length > 3 && E.blast[0].k === 'flak' && E.muzzle.length > 3 && L.every(function (o) { return o.slowF > 0; }) && t.shots > 3 && Math.abs(angDiff(t.aim, Math.atan2(L[1].y - t.y, L[1].x - t.x))) < 1, '대공포 고사포: flakshell 폭발(blast flak), 범위 안 하늘 적 감속, muzzle 사건, t.shots, t.aim');
  a = tw2Dps('flak', 5, 0, 'a', 1); ENEMIES.tw2DumA.size = 0.5; b = tw2Dps('flak', 5, 0, 'a', 1); ENEMIES.tw2DumA.size = 0.7;
  ok(b > a * 1.6, '팔랑크스: 작은 비행체에 배수 (' + Math.round(a) + ' → ' + Math.round(b) + ')');
  g = tw2Game(); t = tw2Build(g, 'flak', 6, 1); L = tw2Dummies(g, 'a', 1); tw2Run(g, 3); ok(L[0].shredA >= 0.3, '하늘 분쇄기(6단계): 갑옷 깎기 ' + L[0].shredA);
  // 유도탄
  g = tw2Game(); t = tw2Build(g, 'sam', 5, 1); var ga = tw2Dummies(g, 'g', 1), aa = tw2Dummies(g, 'a', 1); E = runEv(g, 6, ['launch']);
  ok(E.launch.length >= 2 && tw2Lost(aa) > 0 && tw2Lost(ga) > 0 && g.proj.every(function (p) { return p.kind !== 'missile' || (p.ang != null && p.z != null && p.lvl === 5); }), '다탄두 미사일: launch 사건, 하늘과 땅을 함께 타격, 탄 칸(ang, z, lvl)');
  g = tw2Game(); t = tw2Build(g, 'sam', 3, 0); ga = tw2Dummies(g, 'g', 1); tw2Run(g, 5); ok(tw2Lost(ga) === 0 && t.shots === 0, '유도탄 포대(기본)는 땅 적을 안 쏨');
  // 기관포
  a = tw2Dps('gatling', 3, 0, 'g', 1); b = tw2Dps('gatling', 3, 0, 'g', 1, 'tw2DumArm'); var c = tw2Dps('gatling', 6, 0, 'g', 1, 'tw2DumArm'), d = tw2Dps('gatling', 6, 0, 'g', 1);
  ok(b < a * 0.4 && c > d * 0.9, '기관포: 갑옷에 약함(' + Math.round(a) + ' → ' + Math.round(b) + '), 철갑 분쇄기는 갑옷 무시(' + Math.round(d) + ' → ' + Math.round(c) + ')');
  g = tw2Game(); t = tw2Build(g, 'gatling', 5, 1); tw2Dummies(g, 'g', 1); tw2Run(g, 0.5); a = t.spin; var bz = t.busy, sawB = 0; tw2Run(g, 4, function () { if (g.proj.some(function (p) { return p.kind === 'bullet'; })) sawB = 1; });
  ok(t.spin > a + 5 && t.busy > bz && t.busy > 0.95 && sawB, '쌍열 벌컨: t.spin 증가, 쏠수록 가열(t.busy ' + bz.toFixed(2) + ' → ' + t.busy.toFixed(2) + '), 탄 bullet');
  // 저격
  g = tw2Game(); t = tw2Build(g, 'sniper', 5, 1); e = spawnEnemy(g, 'stalker', 0, 10); e.spd = 0; e.mhp = e.hp = 1e6; E = runEv(g, 4, ['tracer']);
  ok(t.mode === 'strong' && E.tracer.length >= 2 && E.tracer[0].k === 'sniper' && E.tracer[0].x1 != null && (e.dead || e.hp < e.mhp) && (e.dead || e.markT > 0), '저격탑: 숨은 적을 보고 쏨, tracer 사건, 표식(markT), 기본 목표 strong');
  g = tw2Game(); t = tw2Build(g, 'sniper', 6, 0); L = tw2Dummies(g, 'g', 1); L[0].boss = true; var L2 = tw2Dummies(tw2Game(), 'g', 1); a = tw2Dps('sniper', 6, 0, 'g', 1); tw2Run(g, 6); var b0 = tw2Lost(L); tw2Run(g, 24); b = (tw2Lost(L) - b0) / 24;
  ok(b > a * 1.8, '보스 사냥꾼: 우두머리 배수 (' + Math.round(a) + ' → ' + Math.round(b) + ')');
  // 로켓
  g = tw2Game(); t = tw2Build(g, 'rocket', 5, 1); L = tw2Dummies(g, 'g', 1); var maxR = 0; E = runEv(g, 6, ['launch', 'blast']);
  ok(E.launch.length >= 1 && E.launch[0].n === t.st.n && E.blast.length >= t.st.n && g.zones.some(function (z) { return z.kind === 'fire'; }) && L[0].burnT > 0, '소이 로켓: 일제 사격 ' + t.st.n + '발(launch), 불 장판과 화상');
  g = tw2Game(); t = tw2Build(g, 'rocket', 1, 0); tw2Dummies(g, 'g', 1); var seenBusy = 0; tw2Run(g, 6, function () { if (t.busy > 0.2 && t.busy < 0.8) seenBusy = 1; g.proj.forEach(function (p) { if (p.kind === 'rocket') maxR = Math.max(maxR, p.z); }); });
  ok(seenBusy && maxR > 0.8, '다연장 로켓: t.busy = 재장전 진행, 로켓은 포물선(z 최고 ' + maxR.toFixed(2) + ')');
  // 레이저
  g = tw2Game(); t = tw2Build(g, 'laser', 5, 0); L = tw2Dummies(g, 'g', 4); E = runEv(g, 0.5, ['beamOn']); a = t.busy; var l0 = tw2Lost(L); tw2Run(g, 1); var d1 = tw2Lost(L) - l0; tw2Run(g, 3); l0 = tw2Lost(L); tw2Run(g, 1); var d2x = tw2Lost(L) - l0;
  ok(E.beamOn.length === 1 && a < 0.3 && t.busy === 1 && d2x > d1 * 1.5 && t.beams && t.beams.length === 1 + t.st.split && t.beamTgt && L.filter(function (o) { return o.hp < o.hp0; }).length === 1 + t.st.split, '프리즘 탑: beamOn, 쏠수록 강해짐(' + Math.round(d1) + ' → ' + Math.round(d2x) + '/초), 광선 ' + (t.beams && t.beams.length) + '갈래(t.beams)');
  g.enemies.forEach(function (o) { o.dead = 1; }); E = runEv(g, 1, ['beamOff']); ok(E.beamOff.length === 1 && !t.beams && t.busy < 1, '표적이 없으면 beamOff, 세기가 식음');
  g = tw2Game(); t = tw2Build(g, 'laser', 6, 1); ENEMIES.tw2DumL = { name: '허수아비(항로)', art: 'bat', hp: 1e7, spd: 0, gold: 0, leak: 0, size: 0.7, dom: 'a', fly: 1, lane: 1, desc: '' };
  L = [spawnEnemy(g, 'tw2DumL', 0, 8), spawnEnemy(g, 'tw2DumL', 0, 5), spawnEnemy(g, 'tw2DumL', 0, 1.5)]; L.forEach(function (o) { o.hp0 = o.hp; }); tw2Run(g, 3);   // 항로(4열) 위 한 줄: 탑에서 2, 5, 8.5칸
  ok(L.every(function (o) { return o.hp < o.hp0; }), '태양 창(6단계): 일직선으로 사거리 밖까지 관통');
  // 테슬라
  g = tw2Game(); t = tw2Build(g, 'tesla', 5, 0); L = tw2Dummies(g, 'g', 5); E = runEv(g, 3, ['chain']);
  ok(E.chain.length >= 2 && E.chain[0].pts.length === 6 && L.every(function (o) { return o.hp < o.hp0; }) && L.some(function (o) { return o.stunT > 0; }), '폭풍 코일: chain 사건(점 ' + (E.chain[0] && E.chain[0].pts.length) + '개), 5명 연쇄, 기절');
  ENEMIES.tw2DumM = { name: '허수아비(기계)', art: 'orc', hp: 1e7, spd: 0, gold: 0, leak: 0, size: 0.7, dom: 'g', mech: 1, desc: '' };
  a = tw2Dps('tesla', 5, 1, 'g', 1); b = tw2Dps('tesla', 5, 1, 'g', 1, 'tw2DumM');
  g = tw2Game(); t = tw2Build(g, 'tesla', 6, 1); L = tw2Dummies(g, 'g', 2); L[0].shield = 500; E = runEv(g, 3, ['blast', 'shieldBreak']);
  ok(b > a * 1.9 && E.blast.some(function (v) { return v.k === 'emp'; }) && E.shieldBreak.length >= 1 && L[0].shield === 0 && L[1].sealT > 0, 'EMP: 기계 배수(' + Math.round(a) + ' → ' + Math.round(b) + '), blast emp, 보호막 깸, 대정전 봉인(sealT)');
  // 비행장
  g = tw2Game(); t = tw2Build(g, 'airbase', 5, 0); tw2Run(g, 1);
  ok(g.units.length === 3 && g.units.every(function (u) { return u.kind === 'plane' && u.st === 'park' && u.tw === t && u.z === 0; }) && t.out === 0, '비행장: 전투기 3대 대기(park), t.out 0');
  L = tw2Dummies(g, 'g', 1); E = runEv(g, 8, ['planeOut', 'tracer', 'blast']); var bombs = g.proj.filter(function (p) { return p.kind === 'bomb'; }).length;
  ok(E.planeOut.length === 1 && t.out === 1 && g.units.every(function (u) { return u.st === 'out' && u.z > 0.9 && u.ang != null; }) && E.tracer.some(function (v) { return v.k === 'plane'; }) && E.blast.length > 2 && tw2Lost(L) > 500, '폭격 편대: planeOut, 출격(t.out 1, z 1), 기총 tracer, 폭탄 폭발 ' + E.blast.length + '번');
  L[0].dead = 1; tw2Run(g, 12); ok(t.out === 0 && g.units.every(function (u) { return u.st === 'park'; }), '적이 없으면 귀환(t.out 0)');
  sellTower(g, t); tw2Run(g, 0.1); ok(g.units.length === 0, '비행장을 팔면 전투기도 사라짐');
  g = tw2Game(); t = tw2Build(g, 'airbase', 5, 1); L = tw2Dummies(g, 'a', 1); var sawM = 0; tw2Run(g, 8, function () { if (g.proj.some(function (p) { return p.kind === 'missile'; })) sawM = 1; });
  ok(sawM && tw2Lost(L) > 500, '요격 편대: 하늘 적에게 공대공 미사일');
  // 전함
  g = tw2Game(); ok(!buildTower(g, 'warship', 4, 8, true) && !buildTower(g, 'archer', 5, 8, true) && !buildTower(g, 'warship', 6, 8, true) && !!buildTower(g, 'warship', 5, 8, true), '전함은 물 칸에만(땅 칸, 뱃길 칸은 안 됨), 땅 탑은 물 칸에 안 됨');
  g = tw2Game(); t = tw2Build(g, 'warship', 5, 0); L = tw2Dummies(g, 's', 1); aa = tw2Dummies(g, 'a', 1); var kinds = {}; E = runEv(g, 8, ['blast']); tw2Run(g, 3, function () { g.proj.forEach(function (p) { kinds[p.kind] = 1; }); });
  ok(kinds.navshell && kinds.missile && tw2Lost(L) > 0 && tw2Lost(aa) > 0 && E.blast.some(function (v) { return v.k === 'water'; }), '미사일 순양함: 함포(navshell, 물기둥 blast water) + 대공 미사일');
  a = tw2Dps('warship', 3, 0, 'g', 1); b = tw2Dps('warship', 3, 0, 's', 1); ok(b > a * 1.5, '전함: 바다 적에 배수 (' + Math.round(a) + ' → ' + Math.round(b) + ')');
  g = tw2Game(); t = tw2Build(g, 'warship', 6, 0); g.proj.push({ kind: 'eshell', x: t.x + 1, y: t.y, z: 0.5, t: 0 }); E = runEv(g, 1, ['blast']); ok(!g.proj.some(function (p) { return p.kind === 'eshell'; }) && E.blast.some(function (v) { return v.icpt; }), '신의 방패함(6단계): 적 포탄 요격');
  // 거북선
  g = tw2Game(); t = tw2Build(g, 'turtle', 5, 0); L = tw2Dummies(g, 's', 2); kinds = {}; tw2Run(g, 4, function () { g.proj.forEach(function (p) { kinds[p.kind] = 1; }); });
  ok(kinds.ball && t.busy > 0.9 && L[0].burnT > 0 && t.st.tough, '화룡 거북선: 포환(ball), 용머리 화염(t.busy ' + t.busy.toFixed(2) + ', 화상)');
  t.stunT = 2; tw2Run(g, 1.1); ok(t.stunT <= 0, '거북선은 튼튼: 기절 2초가 1초 만에 풀림');
  g = tw2Game(); t = tw2Build(g, 'turtle', 5, 1); var w2 = buildTower(g, 'warship', 5, 9, true), ar = buildTower(g, 'archer', 4, 8, true); refreshStats(g);
  ok(w2.buff.dmg === t.st.navAura && ar.buff.dmg === 0 && w2.st.dmg > towerStats('warship', 1, 0).dmg * 1.19, '판옥 대장선: 주변 수상 탑 피해 +' + Math.round(t.st.navAura * 100) + '% (땅 탑은 아님)');
  // 신기전
  g = tw2Game(); t = tw2Build(g, 'singijeon', 5, 1); L = tw2Dummies(g, 'a', 2); var maxA = 0; E = runEv(g, 0.5, ['launch']); tw2Run(g, 3, function () { maxA = Math.max(maxA, g.proj.filter(function (p) { return p.kind === 'sinarrow'; }).length); });
  ok(E.launch.length === 1 && E.launch[0].n === t.st.n && maxA >= 2 && t.shots >= t.st.n && L.every(function (o) { return o.hp < o.hp0; }), '백발 화차: 화살 다발 ' + t.st.n + '발(sinarrow, 쏜 수 ' + t.shots + '), 하늘 적 여럿에게');
  g = tw2Game(); t = tw2Build(g, 'singijeon', 6, 0); L = tw2Dummies(g, 'g', 4); E = runEv(g, 5, ['blast']); ok(E.blast.some(function (v) { return v.k === 'fire' && v.big; }) && g.zones.length > 0, '산화 신기전: 큰 로켓 폭발(blast fire, big)과 불 장판');
  // 장승
  g = tw2Game(); t = tw2Build(g, 'jangseung', 3, 0); ar = buildTower(g, 'archer', 4, 9, true); e = spawnEnemy(g, 'stalker', 0, 10, { off: 0 }); e.spd = 0; e.mhp = e.hp = 1e6; tw2Run(g, 2);
  ok(e.fearT > 0 && e.fearF >= 0.3 && (e.slowF >= 0.3 || e.spdK <= 0.7) && e.hp < 1e6 && ar.shots > 0 && t.busy > 0.9, '장승: 공포(fearT, 느려짐), 숨은 적을 드러내 궁수가 쏨, 눈빛(t.busy)');
  sellTower(g, t); tw2Run(g, 0.5); a = ar.shots; tw2Run(g, 2); ok(e.stealth === true && !e.tw2Hid && !e.revealed && ar.shots === a, '장승을 팔면 다시 숨음');
  g = tw2Game(); t = tw2Build(g, 'jangseung', 6, 0); L = tw2Dummies(g, 'g', 2); E = runEv(g, 5, ['blast']); ok(E.blast.some(function (v) { return v.k === 'holy' && v.tw === t; }) && L[0].sealT > 0 && L[0].hp < L[0].hp0, '벽사 대장군: 기절 파동(blast holy)과 봉인');
  g = tw2Game(); t = tw2Build(g, 'jangseung', 5, 1); L = tw2Dummies(g, 'g', 1); tw2Run(g, 1); ok(L[0].markT > 0 && L[0].markA >= 0.28, '지하여장군: 받는 피해 증가(markA ' + L[0].markA + ')');
  // 병영
  g = tw2Game(); t = tw2Build(g, 'barracks', 3, 0); tw2Run(g, 3);
  ok(g.units.length === 3 && g.units.every(function (u) { return u.kind === 'soldier' && u.st === 'guard' && u.tw === t && u.hp === u.mhp; }) && t.out === 1 && Math.abs(g.units[1].x - 3.5) < 0.3, '수호 병영: 병사 3명이 길 위에 섬(guard)');
  e = spawnEnemy(g, 'orc', 0, 6, { off: 0 }); var eb = spawnEnemy(g, 'bat', 0, 6); tw2Run(g, 5);
  ok(!e.dead && e.d < 10.6 && e.blocked && e.blocked.kind === 'soldier' && e.hp < e.mhp && g.units.some(function (u) { return u.st === 'fight'; }) && (eb.dead || eb.d > 11), '병사가 땅 적을 붙잡고 싸움(오크 d ' + e.d.toFixed(1) + '), 하늘 적은 지나감');
  g = tw2Game(); t = tw2Build(g, 'barracks', 1, 0); tw2Run(g, 3); ENEMIES.ghoul.spd0 = ENEMIES.ghoul.spd; e = spawnEnemy(g, 'ghoul', 0, 8, { off: 0 }); var bo = spawnEnemy(g, 'grumsh', 0, 8, { off: 0 }); tw2Run(g, 4);
  ok(e.d > 11 && !e.blocked && bo.d > 8.9, '뛰어넘는 적(구울)은 지나가고 우두머리는 오래 못 붙잡음 (구울 d ' + e.d.toFixed(1) + ', 우두머리 d ' + bo.d.toFixed(1) + ')');
  g = tw2Game(); t = tw2Build(g, 'barracks', 1, 0); tw2Run(g, 3); e = spawnEnemy(g, 'troll', 0, 9, { off: 0 }); e.mhp = 6000; e.hp = 1e6; E = runEv(g, 8, ['unitDown']); a = g.units.length; e.dead = 1; tw2Run(g, 14);
  ok(E.unitDown.length >= 1 && a < 3 && g.units.length === 3, '병사가 쓰러지면 unitDown, 잠시 뒤 다시 채워짐 (' + a + ' → ' + g.units.length + '명)');
  sellTower(g, t); tw2Run(g, 0.1); ok(g.units.length === 0, '병영을 팔면 병사가 사라짐');
  // 서낭당
  g = tw2Game(); t = tw2Build(g, 'shrine', 5, 0); L = tw2Dummies(g, 'g', 2); L[0].shield = 400; kinds = {}; E = runEv(g, 4, ['seal']);
  ok(L[0].sealT > 0 && L[1].sealT > 0 && L[0].shield === 0 && E.seal.length >= 2, '봉인 부적: 두 표적에 봉인(sealT ' + L[0].sealT + '), 보호막 깸, seal 사건');
  ENEMIES.tw2DumSp = { name: '허수아비(귀신)', art: 'orc', hp: 1e7, spd: 0, gold: 0, leak: 0, size: 0.7, dom: 'g', spirit: 1, desc: '' };
  a = tw2Dps('shrine', 3, 0, 'g', 1); b = tw2Dps('shrine', 3, 0, 'g', 1, 'tw2DumSp'); ok(b > a * 1.5, '서낭당: 귀신과 요괴에 배수 (' + Math.round(a) + ' → ' + Math.round(b) + ')');
  g = tw2Game(); t = tw2Build(g, 'shrine', 6, 1); L = tw2Dummies(g, 'g', 3); E = runEv(g, 8, ['chain', 'blast']); ok(E.chain.some(function (v) { return v.sky; }) && E.blast.some(function (v) { return v.k === 'holy'; }) && L[0].stunT >= 0, '뇌공 강림: 4번째 부적마다 큰 벼락(chain sky)');
  // 관리자 탑
  g = tw2Game({ admin: 0 }); ok(!buildTower(g, 'omega', 4, 8) && !buildTower(g, 'dragon', 4, 8) && !buildTower(g, 'fz_skybow', 4, 8), '관리자 탑은 관리자 판에서만, 합체 탑은 직접 못 지음');
  g = tw2Game(); t = buildTower(g, 'omega', 4, 8); L = [spawnEnemy(g, 'tw2DumG', 0, 1, { off: 0 })]; L[0].hp0 = L[0].hp; E = runEv(g, 4, ['orbital']); ok(t && t.spent === 0 && E.orbital.length >= 1 && tw2Lost(L) > 800, '천벌포: 값 0, 전장 어디든 광선(orbital 사건)');
  g = tw2Game(); t = buildTower(g, 'dragon', 4, 8); L = [spawnEnemy(g, 'tw2DumG', 0, 2, { off: 0 })]; L[0].hp0 = L[0].hp; tw2Run(g, 8); ok(g.units.length === 1 && g.units[0].kind === 'dragon' && g.units[0].z > 1 && tw2Lost(L) > 300 && L[0].burnT > 0, '수호룡: 유닛 dragon이 날아가 불을 뿜음');
  sellTower(g, t); tw2Run(g, 0.1); ok(g.units.length === 0, '둥지를 팔면 수호룡도 사라짐');
})();

// ---------- 5) 합체 ----------
(function () {
  var fzBad = [];
  FUSIONS.forEach(function (F) {
    var g = tw2Game(), wa = fdSite(F.a) === 'water', wb = fdSite(F.b) === 'water';
    var a = tw2Build(g, F.a, 5, 0, wa ? [5, 8] : [4, 8]), b = tw2Build(g, F.b, 5, 0, wb ? [5, 9] : [4, 9]);
    if (!a || !b) { fzBad.push(F.to + ' 재료 건설'); return; }
    tw2Dummies(g, 'g', 1); tw2Run(g, 2); g.ev.length = 0;
    var op = fuseOptions(g, a), op2 = fuseOptions(g, b), spent = a.spent + b.spent, n0 = g.towers.length, u0 = g.units.length;
    if (op.length !== 1 || op[0].to !== F.to || op[0]['with'] !== b || op2.length !== 1 || op2[0]['with'] !== a) { fzBad.push(F.to + ' 선택지'); return; }
    var nt = fuseTowers(g, b, a), fe = evs(g, 'fuse'), want = fdSite(F.to) === 'water' ? (wa ? a : b) : b;
    if (!nt || nt.k !== F.to || nt.c !== want.c || nt.r !== want.r || nt.lvl !== 1 || nt.spent !== spent || g.towers.length !== n0 - 1 || g.towers.indexOf(a) >= 0 || g.towers.indexOf(b) >= 0) { fzBad.push(F.to + ' 결과'); return; }
    if (fe.length !== 1 || fe[0].tw !== nt || fe[0].a !== b || fe[0].b !== a || evs(g, 'build').length) fzBad.push(F.to + ' 사건');
    if (sellValue(g, nt) !== Math.floor(spent * (0.7 + g.R.refund))) fzBad.push(F.to + ' 판매가');
    var L = tw2Dummies(g, fdHit(F.to).indexOf('g') >= 0 ? 'g' : 'a', 3); try { tw2Run(g, 10); } catch (e) { fzBad.push(F.to + ' 오류 ' + e.message); return; }
    if (!(tw2Lost(L) > 2000)) fzBad.push(F.to + ' 피해 ' + Math.round(tw2Lost(L)));
    if (g.units.some(function (u) { return u.tw === a || u.tw === b; })) fzBad.push(F.to + ' 재료 유닛이 남음');
    var n = 0; while (upgradeTower(g, nt, 0) && n++ < 5) { } if (nt.lvl !== 3 || canUpgrade(g, nt)) fzBad.push(F.to + ' 강화 ' + nt.lvl);
    sellTower(g, nt); tw2Run(g, 0.2); if (g.units.length) fzBad.push(F.to + ' 판 뒤 유닛');
  });
  ok(fzBad.length === 0, '합체 8종: 선택지, 자리(수상 합체는 물 쪽), 금화 합산, fuse 사건, 재료 정리, 전투, 강화 3단계, 판매 ' + fzBad.join(' / '));
  var g = tw2Game(), a = tw2Build(g, 'archer', 6, 0, [4, 8]), b = tw2Build(g, 'ballista', 6, 1, [4, 9]), nt = fuseTowers(g, a, b);
  ok(nt && nt.lvl === 3 && nt.c === 4 && nt.r === 8, '6단계 재료 둘이면 합체 탑 3단계로 시작, 자리는 첫 재료 칸');
  g = tw2Game(); a = tw2Build(g, 'archer', 5, 0, [4, 8]); b = tw2Build(g, 'ballista', 4, 0, [4, 9]); var c = tw2Build(g, 'ballista', 5, 0, [4, 11]);
  ok(fuseOptions(g, a).length === 0 && !fuseTowers(g, a, b) && !fuseTowers(g, a, c), '5단계 미만이거나 이웃이 아니면 합체 불가');
  g = tw2Game({ fuse: 0 }); a = tw2Build(g, 'archer', 5, 0, [4, 8]); b = tw2Build(g, 'ballista', 5, 0, [4, 9]); ok(fuseOptions(g, a).length === 0 && !fuseTowers(g, a, b), '합체가 잠긴 판(g.fuse 0)에서는 불가');
  g = tw2Game(); a = tw2Build(g, 'frost', 5, 0, [4, 8]); b = tw2Build(g, 'flame', 5, 1, [8, 9]); c = tw2Build(g, 'flame', 5, 0, [4, 7]); ok(fuseOptions(g, a).length === 1 && fuseOptions(g, a)[0]['with'] === c && fzParts('fz_frostfire').join() === 'frost,flame', '이웃 8칸의 상대만 선택지에, fzParts');
})();

// ---------- 6) 이어하기 저장과 복원 (ui.js snapMid / applyMid와 같은 절차) ----------
(function () {
  var g = tw2Game({ cards: true }); g.pickWait = false; g.pickCards = null;
  var list = [['archer', 6, 1, [4, 3]], ['sam', 5, 1, [4, 4]], ['airbase', 4, 0, [4, 5]], ['barracks', 6, 0, [4, 6]], ['warship', 5, 0, [5, 3]], ['turtle', 6, 1, [5, 4]], ['jangseung', 3, 0, [2, 6]], ['laser', 6, 1, [2, 4]]];
  list.forEach(function (q) { var t = tw2Build(g, q[0], q[1], q[2], q[3]); t.mode = 'last'; });
  var fa = tw2Build(g, 'gatling', 5, 0, [4, 10]), fb = tw2Build(g, 'rocket', 5, 0, [4, 11]), fz = fuseTowers(g, fa, fb); upgradeTower(g, fz, 0);
  var wc = tw2Build(g, 'warship', 5, 0, [5, 12]), ab = tw2Build(g, 'airbase', 5, 0, [4, 12]), cv = fuseTowers(g, ab, wc);
  g.build.flak = { fl_rapid: 2 }; g.build.rocket = { rk_more: 1 }; g.attr.rocket = 'fire'; g.build.barracks = { bk_hp: 1 }; comboRecalc(g, true); refreshStats(g);
  tw2Dummies(g, 'g', 2); tw2Run(g, 5);
  var snap = JSON.parse(JSON.stringify({ towers: g.towers.map(function (t) { return { k: t.k, c: t.c, r: t.r, lvl: t.lvl, br: t.br, mode: t.mode, spent: t.spent }; }), ab: abilitySnap(g) }));
  var h = tw2Game({ cards: true }); h.pickWait = false; h.pickCards = null; h.gold = 0;
  snap.towers.forEach(function (t) { var tw = buildTower(h, t.k, t.c, t.r, true); if (tw) { tw.lvl = t.lvl; tw.br = t.br; tw.mode = t.mode; tw.spent = t.spent; } });
  abilityRestore(h, snap.ab); refreshStats(h); h.ev = [];
  var same = h.towers.length === g.towers.length && h.towers.every(function (t, i) { var o = g.towers[i]; return t.k === o.k && t.lvl === o.lvl && t.br === o.br && t.c === o.c && t.r === o.r && t.spent === o.spent && t.st.kind === o.st.kind && t.hit === o.hit && Math.abs((t.st.dmg || 0) - (o.st.dmg || 0)) < 1e-6 && t.mode === o.mode; });
  ok(same && h.towers.some(function (t) { return t.k === 'fz_arsenal' && t.lvl === 2; }) && h.towers.some(function (t) { return t.k === 'fz_carrier' && t.site === 'water'; }), '복원: 탑 ' + h.towers.length + '개의 종류, 단계, 갈래, 합체 탑, 능력치가 같음');
  ok(h.build.flak.fl_rapid === 2 && h.attr.rocket === 'fire' && cmbOn(h, 'rocket', 'napalm') && h.gold === 0, '복원: 카드와 조합');
  var L = tw2Dummies(h, 'g', 2), err = null; try { tw2Run(h, 6); } catch (e) { err = e; console.log(e.stack); }
  var cnt = function (gg, kd) { return gg.units.filter(function (u) { return u.kind === kd; }).length; };
  ok(!err && cnt(h, 'plane') === cnt(g, 'plane') && cnt(h, 'soldier') === 3 && cnt(g, 'plane') === 2 + 4 && tw2Lost(L) > 0, '복원 뒤 유닛이 다시 생기고 전투가 이어짐 (전투기 ' + cnt(h, 'plane') + ', 병사 ' + cnt(h, 'soldier') + ')');
})();

// ---------- 7) 유닛, 탄 수 상한 ----------
(function () {
  var g = tw2Game(), n = 0, r, c;
  for (r = 0; r < 16; r++) for (c = 0; c < 10; c++) { if (c === 4 || c === 2) { if (buildTower(g, n++ % 2 ? 'airbase' : 'barracks', c, r, true)) { var t = g.towers[g.towers.length - 1]; var q = 0; while (upgradeTower(g, t, n % 3 ? 0 : 1) && q++ < 9) { } } } else if (c === 5 || c === 7) { var w = buildTower(g, 'turtle', c, r, true); if (w) { q = 0; while (upgradeTower(g, w, 1) && q++ < 9) { } } } else if (c === 8 || c === 1) { var s = buildTower(g, c === 8 ? 'singijeon' : 'gatling', c, r, true); if (s) { q = 0; while (upgradeTower(g, s, 1) && q++ < 9) { } } } }
  var maxU = 0, maxP = 0, err = null;
  try { for (var i = 0; i < 60 * 25; i++) { if (i % 20 === 0) { spawnEnemy(g, 'orc', 0, 0); spawnEnemy(g, 'bat', 0, 0); spawnEnemy(g, 'tw2DumS', 0, 4 + (i % 7)); } stepGame(g, DT); g.ev.length = 0; maxU = Math.max(maxU, g.units.length); maxP = Math.max(maxP, g.proj.length); } } catch (e) { err = e; console.log(e.stack); }
  ok(!err && g.towers.length > 60 && maxU <= TW2_UNIT_CAP && maxU >= TW2_UNIT_CAP - 2 && maxP < PROJ_CAP + 260, '탑 ' + g.towers.length + '개 난전: 유닛 최대 ' + maxU + ' (상한 ' + TW2_UNIT_CAP + '), 탄 최대 ' + maxP);
})();

// ---------- 8) 능력 카드 ----------
(function () {
  var miss = [], n2 = 0; TW2_ORDER.forEach(function (k) { var n = 0; for (var id in CARD_DEFS) if (CARD_DEFS[id].towers && CARD_DEFS[id].towers.indexOf(k) >= 0) n++; n2 += n; if (n < 2) miss.push(k); });
  ok(miss.length === 0 && n2 >= 28 && COMBOS.length >= 16, '새 탑마다 카드 2장 이상(' + n2 + '장), 조합 ' + COMBOS.length + '개 ' + miss.join(','));
  var g = tw2Game({ cards: true }); g.pickWait = false; var t = tw2Build(g, 'flak', 3, 0), r = tw2Build(g, 'rocket', 3, 0, [4, 9]), bk = tw2Build(g, 'barracks', 1, 0, [4, 10]), sh = tw2Build(g, 'shrine', 3, 0, [4, 11]);
  var r0 = t.st.rate, s0 = t.st.splash, n0 = r.st.n, rr0 = r.st.rate, hp0 = bk.st.sHp, se0 = sh.st.seal;
  g.build.flak = { fl_rapid: 2, fl_burst: 1 }; g.build.rocket = { rk_more: 2, rk_reload: 1 }; g.build.barracks = { bk_hp: 2 }; g.build.shrine = { sh_seal: 2, sh_multi: 1 }; g.attr.rocket = 'fire'; refreshStats(g); comboRecalc(g, false);
  ok(Math.abs(t.st.rate - r0 * 1.4) < 1e-6 && Math.abs(t.st.splash - s0 * 1.3) < 1e-6 && r.st.n === n0 + 4 && r.st.rate > rr0 * 1.17 && Math.abs(bk.st.sHp - hp0 * 1.7) < 1e-6 && sh.st.seal === se0 + 2 && sh.st.multi === 2 && r.st.cardEl === 'fire', '카드가 능력치에 반영(연사, 폭발 범위, 로켓 수, 재장전, 병사 체력, 봉인, 부적 수, 속성)');
  ok(cmbOn(g, 'flak', 'barrage') && cmbOn(g, 'rocket', 'napalm') && cmbOn(g, 'shrine', 'sealWard') && evs(g, 'combo').length === 3, '조합 켜짐: 탄막, 네이팜, 결계 (combo 사건 3번)');
  var L = tw2Dummies(g, 'a', 1), G2 = tw2Dummies(g, 'g', 1); tw2Run(g, 2);
  ok(L[0].slowF >= 0.2 && g.zones.some(function (z) { return z.kind === 'fire'; }) && G2[0].markA >= 0.15, '조합 효과: 탄막 감속, 네이팜 불 장판, 결계 표식');
  g.pickN = 3; var offered = {}, elBad = 0; for (var i = 0; i < 40; i++) { g.pickN = i; abilityRoll(g, false).forEach(function (c) { offered[c.id] = 1; if (c.kind === 'el' && TW_NOEL[c.tower]) elBad++; }); }
  ok(Object.keys(offered).some(function (id) { return id.indexOf('flak:') === 0; }) && Object.keys(offered).some(function (id) { return id.indexOf('shrine:') === 0; }) && elBad === 0 && !offered['barracks:el:fire'], '카드 뽑기에 새 탑 카드가 나오고, 속성 카드는 병영 같은 탑에는 안 나옴');
  var g3 = tw2Game({ towerStar: { airbase: 5, turtle: 5 } }), ab = tw2Build(g3, 'airbase', 5, 0), tt = tw2Build(g3, 'turtle', 5, 0), base = towerStats('airbase', 5, 0), tb = towerStats('turtle', 5, 0);
  ok(Math.abs(ab.st.bombDmg - base.bombDmg * 1.3) < 1e-6 && Math.abs(tt.st.flameDps - tb.flameDps * 1.3) < 1e-6, '탑 별(+6% x 5)이 덤 피해 칸(bombDmg, flameDps)에도 반영');
})();

// ---------- 9) 봇: 편성과 영역 ----------
(function () {
  function botRun(mi, opts, sec, pre) { var g = newGame(mi, 'normal', opts); if (pre) pre(g); var B = makeBot(g, {}); var n = 0; while (!g.over && n++ < 60 * sec) { botTick(B, DT); stepGame(g, DT); g.ev.length = 0; } return g; }
  var lab = tw2Stage('all'); MAPS[lab].pool = ['goblin', 'orc', 'tw2Boat', 'tw2Jet', 'bat'];
  ENEMIES.tw2Boat = { name: '시험 배', art: 'orc', hp: 110, spd: 0.9, gold: 10, leak: 1, size: 0.7, dom: 's', desc: '' }; ENEMIES.tw2Jet = { name: '시험 비행기', art: 'bat', hp: 70, spd: 2.2, gold: 10, leak: 1, size: 0.6, dom: 'a', fly: 1, lane: 1, desc: '' };
  var g = botRun(lab, { cards: false, towers: ['catapult', 'flak', 'turtle', 'gatling'], fuse: 1 }, 400);
  var ks = {}; g.towers.forEach(function (t) { ks[t.k] = (ks[t.k] || 0) + 1; });
  ok(ks.flak >= 1 && ks.turtle >= 1 && !ks.archer && !ks.sam, '봇: 편성한 탑만 쓰고, 하늘 적에는 대공포, 뱃길에는 수상 탑 (' + JSON.stringify(ks) + ', over ' + g.over + ')');
  var g2 = botRun(lab, { cards: false, towers: ['archer', 'ballista'], fuse: 1 }, 240, function (gg) { gg.gold = 30000; });
  var top = 0; g2.towers.forEach(function (t) { if (!TOWERS[t.k].fusion) top = Math.max(top, t.lvl); });
  ok(g2.towers.some(function (t) { return t.k === 'fz_skybow'; }) && (g2.stats.fused || 0) >= 1, '봇: 금화가 넉넉하면 합체까지 올림 (합체 ' + (g2.stats.fused || 0) + '번, 다른 탑 최고 ' + top + '단계)');
  var g3 = botRun(lab, { cards: false, towers: ['gatling', 'sniper', 'laser'], fuse: 0 }, 240, function (gg) { gg.gold = 30000; });
  ok(g3.towers.some(function (t) { return t.lvl === 6; }) && g3.over !== -1, '봇: 6단계 궁극까지 올림 (' + g3.towers.filter(function (t) { return t.lvl === 6; }).length + '개)');
  MAPS[lab].pool = ['goblin', 'orc'];
  if (__full) { var res = []; MAPS.forEach(function (M, mi) { if (M.id === 'tw2lab') return; var gg = botRun(mi, { cards: false, fuse: 1 }, 60 * 40); res.push(M.id + ':' + (gg.over === 1 ? '승' : gg.over === -1 ? '패' : '시간')); }); console.log('실제 판 봇 완주: ' + res.join(' ')); ok(res.every(function (r) { return r.indexOf('시간') < 0; }), '실제 판 ' + res.length + '개 봇 완주(오류, 시간 초과 없음)'); }
})();
console.log('소계: 통과 ' + oks + ', 실패 ' + fails);
var TW2_FAILS = fails;
`);
// ---------- 10) 엄격 모드(빌드는 "use strict"): 선언 안 한 변수에 값을 넣으면 여기서 걸린다 ----------
(function () {
  const files = ['util.js', 'data.js', 'data_towers2.js', 'data_enemies2.js', 'stages_ch1.js', 'path.js', 'logic.js', 'logic_towers2.js', 'logic_enemies2.js', 'logic_rules.js', 'logic_v22.js', 'bot.js'];
  const src = files.filter(f => fs.existsSync(path.join(__dirname, '..', 'src', f))).map(f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
  const c2 = { console, Math, Float32Array, Int16Array, Uint8Array, Array, Object, JSON, Date }; vm.createContext(c2);
  let err = null, info = '';
  try {
    info = vm.runInContext('(function () { "use strict";\n' + src + `
      var mi = 0; for (var i = 0; i < MAPS.length; i++) if (MAPS[i].sea && MAPS[i].sea.length) mi = i;
      var g = newGame(mi, 'normal', { cards: true, fuse: 1, admin: 1 }); g.gold = 1e7; if (g.pickWait) abilityPick(g, g.pickCards[0].id);
      var ks = TOWER_ORDER.concat(TW2_ADMIN).concat(FUSIONS.map(function (f) { return f.to; })), n = 0;
      for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) { var k = ks[n % ks.length], guard = 0; while (!canBuildAt(g, c, r, k) && guard++ < ks.length) { n++; k = ks[n % ks.length]; } var t = buildTower(g, k, c, r, true); if (t) { n++; var q = 0; while (upgradeTower(g, t, n % 2) && q++ < 9) { } } }
      var B = makeBot(g, {}); callEarly(g);
      for (var s = 0; s < 60 * 40; s++) { if (g.pickWait) abilityPick(g, g.pickCards[0].id); if (s % 600 === 0) botTick(B, DT); stepGame(g, DT); g.ev.length = 0; if (!g.waiting && g.nextT > 1 && g.wave < g.N) callEarly(g); }
      var a = g.towers[0]; sellTower(g, a);
      return g.towers.length + '개 탑, 웨이브 ' + g.wave + ', 처치 ' + g.stats.kills;
    })()`, c2, { filename: 'strict-bundle.js' });
  } catch (e) { err = e; console.log(e.stack.split('\n').slice(0, 5).join('\n')); }
  if (err) { console.log('FAIL 엄격 모드 전투'); ctx.run('TW2_FAILS++'); } else console.log('ok   엄격 모드로 모든 탑 전투 40초: ' + info);
})();
const f = ctx.run('TW2_FAILS');
console.log(f ? 'FAILS ' + f : 'ALL OK');
process.exit(f ? 1 : 0);
