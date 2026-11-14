// 밸런스 시뮬(v2.0, ENG2): node tools/sim.js [판목록] [난이도] [실력] [연구 0/1/2] [모드] [이름=값 ...]
// 판목록: all(전부) | 0,1,2 | 6-19 (0부터 번호) | c1s03,c2s05 (판 id) | c2 (2장 전부)
// 모드: all 모든 탑과 카드 | noneed need 탑 빼고 맞는 속성 카드도 없음 | cardonly need 탑 빼고 속성 카드는 있음 | nocard 카드 없음
// 이름=값(순서 무관):
//   towers=archer,flak,sam   편성(없으면 TOWER_ORDER 전부). towers=start 는 시작 탑 3종, towers=need 는 시작 탑 + 그 판의 need 탑
//   star=2 | star=archer:3,flak:1   탑 별(0~5)        research=gold1,wall | research=all | research=none   연구(넷째 자리 숫자 대신)
//   maxlv=3|5|6   변신 상한(기본 6)        fuse=0|1   합체(기본 1)        admin=1   관리자 탑 허용        seed=n   봇 난수
//   prog=1   진행 흉내(BAL): 그 판 앞까지 확정 보상으로 받은 탑 + 시작 탑 중 봇이 8종 편성(botLoadout), 별(1장 0~1, 2장 1, 3장 2, 4장 2~3),
//            연구 = 그 판까지 모을 수 있는 별의 70%, 변신 상한과 합체는 UNLOCKS, 기술도 진행대로. noneed/cardonly면 need 탑을 가진 탑에서 뺌. star=, research=, maxlv=, fuse=가 있으면 그 값이 이김
//   hpx=0.9 budx=1.1 goldx=1.2   판 수치에 곱해 보기(BAL 조정용, 판 파일은 그대로)      hpset=1.3 budset=2 late=0.8   값을 직접 넣어 보기(late는 뒤 웨이브 추가 성장)
//   skills=rain,wall,last (기본 전부)      time=분   판당 시간 제한(기본 50)      json=1   JSON 줄도 출력(환경 변수 SIMJSON=1과 같음)
// 예: node tools/sim.js c1s04,c1s05 hard 1 0 nocard towers=archer,catapult,flak,warship star=2 maxlv=5
const vm = require('vm');
const ctx = require('./fdload.js')();
const nMaps = vm.runInContext('MAPS.length', ctx);
const pos = [], kv = {};
process.argv.slice(2).forEach(a => { const m = /^([a-z]+)=(.*)$/i.exec(a); if (m) kv[m[1].toLowerCase()] = m[2]; else pos.push(a); });
const ids = JSON.parse(vm.runInContext('JSON.stringify(MAPS.map(function (M) { return [M.id, M.ch]; }))', ctx));
let arg = pos[0] || 'all', maps = [];
arg.split(',').forEach(tok => {
  if (tok === 'all') maps = maps.concat([...Array(nMaps).keys()]);
  else if (/^\d+-\d+$/.test(tok)) { const [a, b] = tok.split('-').map(Number); for (let i = a; i <= b; i++) maps.push(i); }
  else if (/^\d+$/.test(tok)) maps.push(+tok);
  else if (/^c\d+$/.test(tok)) ids.forEach((q, i) => { if ('c' + q[1] === tok) maps.push(i); });
  else { const i = ids.findIndex(q => q[0] === tok); if (i < 0) { console.error('모르는 판', tok); process.exit(2); } maps.push(i); }
});
maps = maps.filter(i => i >= 0 && i < nMaps);
const dk = pos[1] || 'normal', skill = parseFloat(pos[2] || '1'), allR = pos[3] || '0', mode = pos[4] || 'all';
ctx.__args = { maps, dk, skill, allR, mode, kv, json: !!process.env.SIMJSON || kv.json === '1', seed: +(kv.seed || process.env.SIMSEED || 0) };
vm.runInContext(`
(function(){
  var A = __args, K = A.kv, res = [];
  // tfl=cut:0.3,tot:0.1,from:99 → v1.2 중반 이후 난이도(TF_LATE) 값을 바꿔 보기(from:99 = 끔)
  if (K.tfl && typeof TF_LATE !== 'undefined') K.tfl.split(',').forEach(function (q) { var p = q.split(':'); TF_LATE[p[0]] = +p[1]; });
  // prof=1: 적이 어떻게 죽는지 기록(광역 한 방 비율 등). 뒤 절반 웨이브만 셈
  if (K.prof === '1' && !this.__pfOn) { this.__pfOn = 1;
    var _hu = hurt, _ke = killEnemy;
    hurt = function (g, e, amt, kind, src, quiet, opt) { if (!e.dead) { e._hb = e.hp; e._hn = (e._hn || 0) + 1; if (src && src.tw) { e._tw = e._tw || {}; e._tw[src.tw.id || src.tw.k] = 1; } } return _hu(g, e, amt, kind, src, quiet, opt); };
    killEnemy = function (g, e, src) { var was = e.dead; _ke(g, e, src); if (!was && e.dead) {
      var P = g._pf || (g._pf = { late: 0, one: 0, quick: 0, burst: 0, age: 0, prog: 0, hits: 0, tick: {}, n: 0 });
      if (g.wave < Math.ceil(g.N * 0.5) || e.boss) return;
      P.late++; P.age += e.age; P.prog += e.P && e.P.len ? Math.min(1, e.d / e.P.len) : 0; P.hits += e._hn || 0;
      if ((e._hb != null ? e._hb : e.mhp) >= e.mhp * 0.9) { P.one++; P.ok = P.ok || {}; P.ok[e.k] = (P.ok[e.k] || 0) + 1; }
      if (e.age < 4) P.quick++;
      var tk = Math.floor(g.t * 4); P.tick[tk] = (P.tick[tk] || 0) + 1; } };
  }
  A.maps.forEach(function (mi) {
    var M = MAPS[mi], owned = {}, PG = null;
    if (!M._o) M._o = { hpMul: M.hpMul, bud: M.bud, gold: M.gold, late: M.late || 0 };
    M.hpMul = M._o.hpMul * +(K.hpx || 1); M.bud = M._o.bud * +(K.budx || 1); M.gold = Math.round(M._o.gold * +(K.goldx || 1));
    if (K.hpset) M.hpMul = +K.hpset; if (K.budset) M.bud = +K.budset; M.late = K.late != null ? +K.late : M._o.late;
    if (K.prog === '1') {
      var ix = function (id) { for (var q = 0; q < MAPS.length; q++) if (MAPS[q].id === id) return q; return -1; };
      var own = (typeof TW_START !== 'undefined' ? TW_START : ['archer', 'catapult']).slice();
      for (var q = 0; q < mi; q++) { var Rw = MAPS[q].reward; if (Rw && Rw.tower && own.indexOf(Rw.tower) < 0) own.push(Rw.tower); }
      if (A.mode === 'noneed' || A.mode === 'cardonly') own = own.filter(function (k) { return (M.need || []).indexOf(k) < 0; });
      var stv = M.ch === 1 ? (M.no >= 7 ? 1 : 0) : M.ch === 2 ? 1 : M.ch === 3 ? 2 : (M.no >= 7 ? 3 : 2);
      var bud = Math.floor(mi * 3 * 0.7), rown = {};
      RESEARCH.slice().sort(function (a, b) { return a.cost - b.cost; }).forEach(function (r) { if (r.cost <= bud && (!r.req || rown[r.req])) { rown[r.id] = 1; bud -= r.cost; } });
      PG = { own: own, star: stv, res: rown, maxLv: mi > ix(UNLOCKS.ult) ? 6 : mi > ix(UNLOCKS.branch) ? 5 : 3, fuse: mi > ix(UNLOCKS.fuse) ? 1 : 0,
        skills: { rain: 1, wall: mi > ix('c1s01') ? 1 : 0, last: mi > ix('c1s02') ? 1 : 0 } };
      PG.load = botLoadout(mi, A.dk, own, 8);
    }
    if (PG && !K.research) owned = PG.res;
    else if (K.research === 'all' || (!K.research && A.allR === '1')) RESEARCH.forEach(function (r) { owned[r.id] = 1; });
    else if (K.research && K.research !== 'none') K.research.split(',').forEach(function (id) { owned[id] = 1; });
    else if (!K.research && A.allR === '2') { var bud = mi * 2.5; RESEARCH.slice().sort(function (a, b) { return a.cost - b.cost; }).forEach(function (r) { if (r.cost <= bud && (!r.req || owned[r.req])) { owned[r.id] = 1; bud -= r.cost; } }); }
    // 편성
    var start = typeof TW_START !== 'undefined' ? TW_START : ['archer', 'catapult'], load = null;
    if (PG && !K.towers) load = PG.load;
    else if (K.towers === 'start') load = start.slice();
    else if (K.towers === 'need') { load = start.slice(); (M.need || []).forEach(function (k) { if (load.indexOf(k) < 0) load.push(k); }); }
    else if (K.towers) load = K.towers.split(',').filter(function (k) { if (!TOWERS[k]) console.log('모르는 탑 ' + k); return !!TOWERS[k]; });
    var star = {}; if (PG && !K.star) load.forEach(function (k) { star[k] = PG.star; });
    if (K.star) { if (/^\\d+$/.test(K.star)) (load || TOWER_ORDER).forEach(function (k) { star[k] = +K.star; }); else K.star.split(',').forEach(function (q) { var p = q.split(':'); star[p[0]] = +p[1] || 0; }); }
    var sk = PG ? PG.skills : { rain: 1, wall: 1, last: 1 }; if (K.skills != null) { sk = { rain: 0, wall: 0, last: 0 }; K.skills.split(',').forEach(function (s) { if (s) sk[s] = 1; }); }
    var g = newGame(mi, A.dk, { research: owned, skills: sk, maxLv: +(K.maxlv || (PG ? PG.maxLv : 6)), cards: A.mode !== 'nocard', towers: load, towerStar: star, fuse: K.fuse == null ? (PG ? PG.fuse : 1) : +K.fuse, admin: K.admin === '1' });
    var allowed = (load || TOWER_ORDER).slice(), noEl = null;
    if (K.admin === '1' && typeof TW2_ADMIN !== 'undefined') allowed = allowed.concat(TW2_ADMIN);
    if (A.mode === 'noneed' || A.mode === 'cardonly') allowed = allowed.filter(function (k) { return (M.need || []).indexOf(k) < 0; });
    if (A.mode === 'noneed') { noEl = []; M.pool.concat(M.boss ? [M.boss] : []).forEach(function (k) { ((ENEMIES[k] || {}).weakEl || []).forEach(function (el) { if (noEl.indexOf(el) < 0) noEl.push(el); }); }); }
    var B = makeBot(g, { skill: A.skill, seed: mi * 31 + 5 + A.seed, allowed: allowed, noEl: noEl });
    var steps = 0, maxSteps = 60 * 60 * +(K.time || 50), err = null;
    var lk = {}, fused = [];
    try { while (!g.over && steps < maxSteps) { botTick(B, DT); stepGame(g, DT); for (var q = 0; q < g.ev.length; q++) { var ev = g.ev[q]; if (ev.t === 'leak') lk[ev.k + '@' + g.wave] = (lk[ev.k + '@' + g.wave] || 0) + ev.n; else if (ev.t === 'fuse') fused.push(ev.k); } g.ev.length = 0; steps++; } } catch (e) { err = e; console.log('ERR ' + M.id + ' ' + (e.stack || e)); }
    var tw = {}; g.towers.forEach(function (t) { var k = t.k + (t.lvl >= 4 && TOWERS[t.k].br.length ? (t.br ? 'B' : 'A') : '') + t.lvl; tw[k] = (tw[k] || 0) + 1; });
    var r = { id: M.id, mode: A.mode, res: err ? 'ERROR' : g.over === 1 ? 'WIN' : g.over === -1 ? 'LOSE' : 'TIMEOUT', stars: starsOf(g), lives: g.lives, maxLives: g.maxLives, wave: g.wave, N: g.N, t: Math.round(g.t), towers: tw, fused: fused, picks: B.picks.join(' '), combos: Object.keys(g.combos).join(' '), leaks: lk };
    if (g._pf) { var P = g._pf, bu = 0; for (var tk in P.tick) if (P.tick[tk] >= 4) bu += P.tick[tk]; r.prof = { n: P.late, one: P.late ? +(P.one / P.late).toFixed(3) : 0, quick: P.late ? +(P.quick / P.late).toFixed(3) : 0, burst: P.late ? +(bu / P.late).toFixed(3) : 0, age: P.late ? +(P.age / P.late).toFixed(2) : 0, prog: P.late ? +(P.prog / P.late).toFixed(3) : 0, hits: P.late ? +(P.hits / P.late).toFixed(1) : 0, ok: P.ok || {} }; }
    res.push(r);
    if (A.json) console.log('JSON ' + JSON.stringify(r));
    console.log(M.id + ' ' + A.dk + ' ' + A.mode + ' skill' + A.skill + ' -> ' + (err ? 'ERROR' : g.over === 1 ? 'WIN ' + starsOf(g) + '*' : g.over === -1 ? 'LOSE' : 'TIMEOUT') + ' lives ' + g.lives + '/' + g.maxLives + ' wave ' + g.wave + '/' + g.N + ' gold ' + g.gold + ' t ' + Math.round(g.t) + 's towers ' + Object.keys(tw).map(function (k) { return k + 'x' + tw[k]; }).join(' ') + (fused.length ? ' | fuse ' + fused.join(' ') : '') + (PG ? ' | load ' + load.join(',') : '') + ' | cards ' + B.picks.join(' ') + (r.combos ? ' | combo ' + r.combos : '') + ' | leaks ' + Object.keys(lk).slice(0, 6).map(function (k) { return k + ':' + lk[k]; }).join(' '));
  });
  var w = res.filter(function (r) { return r.res === 'WIN'; }).length;
  if (res.length > 1) console.log('합계: ' + w + '/' + res.length + ' 승, 오류 ' + res.filter(function (r) { return r.res === 'ERROR'; }).length);
  __args.errs = res.filter(function (r) { return r.res === 'ERROR'; }).length;
})();
`, ctx);
process.exit(ctx.__args.errs ? 1 : 0);
