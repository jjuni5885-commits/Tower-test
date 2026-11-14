// ===== logic.js : 전투 (화면과 분리, 노드에서도 돌아감) =====
var DT = 1 / 60;
var _pa = { x: 0, y: 0, dx: 0, dy: 1 };
var PROJ_CAP = 240;   // 카드로 늘어난 화살, 파편이 이 수를 넘으면 덤 탄은 쏘지 않음(폰 성능)

function researchFx(owned) {
  var R = { startGold: 0, lives: 0, tdmg: {}, trng: {}, slowAdd: 0, slowDur: 0, dotMul: 0, refund: 0, earlyMul: 0, obsGold: 0, killGold: 0, rainCd: 0, rainN: 0, barHp: 0, barThorn: 0, lastCd: 0, lastDmg: 0, costMul: 0 };
  RESEARCH.forEach(function (r) {
    if (!owned || !owned[r.id]) return;
    for (var k in r.fx) {
      var v = r.fx[k];
      if (typeof v === 'object') { for (var t in v) R[k][t] = (R[k][t] || 0) + v[t]; } else R[k] += v;
    }
  });
  return R;
}

// opts: research, towers(이 판에 쓸 탑 목록), towerStar, maxLv(3|5|6), skills, autoWave, cards(false면 능력 카드 없음), fuse(합체 허용), admin(관리자)
// v2.0: g.cols, g.rows(판마다), g.sea(뱃길), g.air(항로), g.units(아군 유닛), g.rule(판 규칙 상태) 추가
function newGame(mi, dk, opts) {
  opts = opts || {};
  var M = MAPS[mi], D = DIFFS[dk], R = researchFx(opts.research || {}), P = parseMap(mi);
  if (D.arena) M = arPrep(mi);   // v2.2 무한 차원전: 같은 판 모양, 규칙 없음, 모든 적
  var g = {
    mi: mi, dk: dk, M: M, D: D, R: R, rnd: rngOf(hashStr(M.id + dk) + 7), P: P,
    cols: P.cols, rows: P.rows,
    paths: M.paths.map(function (w) { return buildPath(w, 0.5); }),
    fly: M.paths.map(function (w, i) { return flyPath(w, i % 2 ? -1 : 1, P.cols); }),
    sea: (M.sea || []).map(function (w) { return buildPath(w, 0.5); }), air: (M.air || []).map(function (a) { return airPath(a); }), seaCell: P.sea,
    kind: P.kind.slice(), obsAt: P.obsAt.slice(), towerAt: new Int16Array(P.cols * P.rows).fill(-1),
    gate: { c: P.gate[0], r: P.gate[1], x: P.gate[0] + 0.5, y: P.gate[1] + 0.5, hitT: 0 },
    t: 0, gold: Math.round(M.gold * D.gold + R.startGold), lives: D.lives + R.lives, maxLives: D.lives + R.lives,
    wave: 0, N: D.endless ? 9999 : M.waves + (D.extra || 0), waves: D.endless ? [] : genWaves(mi, dk), wrnd: rngOf(hashStr(M.id + 'endless')),
    waiting: true, nextT: 0, nextMax: 1, autoWave: !!opts.autoWave, clearT: 0, spawnQ: [], enemies: [], towers: [], proj: [], zones: [], bars: [], units: [],
    sk: { rain: { cd: 0 }, wall: { cd: 0 }, last: { cd: 0 } }, unlockedSkills: opts.skills || { rain: 1, wall: mi >= 1 ? 1 : 0, last: mi >= 2 ? 1 : 0 },
    focus: null, ev: [], over: 0, finale: 0, boss: null, idSeq: 1,
    stats: { kills: 0, leaks: 0, obsCleared: 0, obsTotal: 0, goldEarned: 0, built: 0 },
    iceMod: M.mod === 'ice' ? 1.1 : 1, rangeMod: M.mod === 'fog' ? 0.92 : 1,
    maxLv: opts.maxLv || 6, fuse: !!opts.fuse, admin: !!opts.admin, rule: null, towersOk: opts.towers || null, tStar: opts.towerStar || {}, seenEnemies: {},
    // [v1.3 능력 카드] attr: 탑 종류별 속성, build: 탑 종류별 카드 단계, buffs: 전체 카드 단계, cmb: 켜진 조합, combos: 알린 조합
    cardsOn: opts.cards !== false, attr: {}, build: {}, buffs: {}, cmb: {}, combos: {}, pickWait: false, pickCards: null, pickStart: false, pickN: 0, pickSeq: 0, pickAt: {}
  };
  g.obs = P.obs.map(function (o, i) {
    var S = OBS[o.ch];
    return { id: i, kind: 'obs', ch: o.ch, c: o.c, r: o.r, w: o.w, x: o.x, y: o.y, hp: S.hp, mhp: S.hp, gold: S.gold, sz: S.sz, chest: S.chest || 0, tower: S.tower || null, alive: 1, hitT: 0 };
  });
  g.stats.obsTotal = g.obs.length;
  g.pathCells = []; for (var i = 0; i < g.cols * g.rows; i++) if (g.kind[i] === 'p') g.pathCells.push(i);
  // 판 규칙: M.rule을 g.rule로 복사하고 RULES[id].init(g)
  if (M.rule && M.rule.id) { g.rule = {}; for (var rk in M.rule) g.rule[rk] = M.rule[rk]; var RL = RULES[g.rule.id]; if (RL && RL.init) RL.init(g); }
  g.meter = {}; sk2Init(g, opts.sk2);   // v2.2 딜미터, 고른 특수 기술
  if (D.arena) { g.arWeek = opts.week || arWeek(); g.wrnd = rngOf(hashStr('arena:' + g.arWeek)); }   // 같은 주에는 누구나 같은 웨이브
  if (g.cardsOn && (mi > 0 || D.endless)) abilityOffer(g, true);   // 시작 능력: 1웨이브 전에 한 장(첫 판은 안내가 먼저라 3웨이브부터)
  return g;
}
function emit(g, t, o) { o = o || {}; o.t = t; g.ev.push(o); return o; }

// ---------- 건설, 강화, 판매 ----------
function towerCost(g, type, lvl, br) { var c = lvl === 0 ? TOWERS[type].lv[0].cost : upgCost(type, lvl, br); return Math.round(c * (1 + g.R.costMul)); }
// 빈 칸이 어떤 자리인지: 'land'(풀밭) | 'water'(뱃길이 아닌 물) | null(못 지음)
function fdCellSite(g, c, r) {
  if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return null;
  var i = r * g.cols + c;
  if (g.towerAt[i] >= 0) return null;
  var o = g.obsAt[i]; if (o >= 0 && g.obs[o].alive) return null;
  if (g.kind[i] === 'g') return 'land';
  if (g.kind[i] === 'water' && !(g.seaCell && g.seaCell[i])) return 'water';
  return null;
}
// type을 주면 그 탑의 site('land'|'water')와 칸이 맞는지까지, 안 주면 땅 칸인지만(옛 호출과 같음). 판 규칙의 canBuild(g, type, c, r)가 false면 못 지음
function canBuildAt(g, c, r, type) {
  var site = fdCellSite(g, c, r); if (!site) return false;
  if (!type) return site === 'land';
  if (fdSite(type) !== site) return false;
  g.whyNot = null;
  var RL = g.rule && RULES[g.rule.id]; if (RL && RL.canBuild && RL.canBuild(g, type, c, r) === false) { g.whyNot = typeof ruleBlocks === 'function' ? ruleBlocks(g, type) : null; return false; }   // 판 규칙이 막은 이유(문자열)는 g.whyNot, ruleBlocks(g, type)
  return true;
}
function buildTower(g, type, c, r, free) {
  if (!canBuildAt(g, c, r, type)) { if (g.whyNot) emit(g, 'ruleEv', { id: g.rule.id, k: 'block', why: g.whyNot, tw: type, c: c, r: r }); return null; }   // 규칙 때문에 못 지으면 화면이 알림으로 보여 줌
  if (!free && (TOWERS[type].fusion || (TOWERS[type].admin && !g.admin))) return null;   // [ENG2] 합체 탑은 fuseTowers나 복원(free)으로만, 관리자 탑은 관리자 판에서만
  var cost = free ? 0 : towerCost(g, type, 0);
  if (g.gold < cost) return null;
  g.gold -= cost;
  var t = { id: g.idSeq++, k: type, lvl: 1, br: 0, c: c, r: r, x: c + 0.5, y: r + 0.5, cd: 0.3, aim: -Math.PI / 2, tgt: null, mode: 'first', spent: cost, kills: 0, dmg: 0, frozenT: 0, beamT: 0, beamTgt: null, fireT: 0, side: 0, born: g.t, buff: { dmg: 0, spd: 0, rng: 0 }, st: null,
    // v2.0: hit 맞힐 수 있는 영역, 멈춤 상태(stunT 기절, hexT 저주, charmT 홀림), 그리기용(shots, spin, busy, out)
    hit: fdHit(type), site: fdSite(type), stunT: 0, hexT: 0, charmT: 0, shots: 0, spin: 0, busy: 0, out: 0 };
  g.towers.push(t); g.towerAt[r * g.cols + c] = g.towers.length - 1;
  reindexTowers(g); refreshStats(g);
  if (TW_INIT[t.st.kind]) TW_INIT[t.st.kind](g, t);
  g.stats.built++;
  emit(g, 'build', { x: t.x, y: t.y, k: type, free: !!free, tw: t });
  return t;
}
function reindexTowers(g) { g.towerAt.fill(-1); g.towers.forEach(function (t, i) { g.towerAt[t.r * g.cols + t.c] = i; }); }
// 단계 상한: 갈래 tiers 길이(3개면 6단계)와 g.maxLv(3|5|6) 중 작은 쪽
function canUpgrade(g, t) { return t.lvl < Math.min(fdMaxLv(t.k, t.lvl >= 4 ? t.br : null), g.maxLv); }
function upgradeTower(g, t, br) {
  if (!canUpgrade(g, t)) return false;
  if (t.lvl === 3) { if (br !== 0 && br !== 1) return false; if (fdMaxLv(t.k, br) < 4) return false; } else br = t.br;
  var cost = towerCost(g, t.k, t.lvl, br);
  if (g.gold < cost) return false;
  var k0 = t.st && t.st.kind;
  g.gold -= cost; t.spent += cost; t.lvl++; t.br = br; t.beamT = 0;
  refreshStats(g);
  if (t.st.kind !== k0) { if (TW_SOLD[k0]) TW_SOLD[k0](g, t); if (TW_INIT[t.st.kind]) TW_INIT[t.st.kind](g, t); }   // 강화로 공격 종류가 바뀌면 정리하고 다시 준비
  emit(g, 'upgrade', { x: t.x, y: t.y, k: t.k, lvl: t.lvl, br: t.br, tw: t });
  // 변신: 갈래 선택(4단계)과 궁극(6단계)
  if (t.lvl === 4 || t.lvl === 6) emit(g, 'transform', { tw: t, lvl: t.lvl, br: t.br, ult: t.lvl === 6 ? 1 : 0, x: t.x, y: t.y, k: t.k });
  return true;
}
function sellValue(g, t) { return g.waiting ? t.spent : Math.floor(t.spent * (0.7 + g.R.refund)); }
function sellTower(g, t) {
  var v = sellValue(g, t);
  g.gold += v;
  g.towers.splice(g.towers.indexOf(t), 1); reindexTowers(g); refreshStats(g);
  if (t.st && TW_SOLD[t.st.kind]) TW_SOLD[t.st.kind](g, t);
  if (g.focus && g.focus.t === t) g.focus = null;
  emit(g, 'sell', { x: t.x, y: t.y, v: v });
  return v;
}
// ---------- 계열(속성) ----------
// 모든 피해에 계열 꼬리표: fire 불, ice 얼음, bolt 번개, poison 독, phys 물리, magic 마법, expl 폭발 (true 기술 고정 피해)
// 탑의 계열 = 붙인 속성 카드(g.attr) → 없으면 탑 성질(화염 fire, 서리 ice, 연금 poison, 뇌전 첨탑 bolt, 화염 투석기 fire) → dmgType
function towerEl(g, k, lvl, br) {
  var a = g && g.attr ? g.attr[k] : null; if (a) return a;
  if (EL_NATURAL[k]) return EL_NATURAL[k];
  var TB2 = lvl >= 4 && TOWERS[k].br ? TOWERS[k].br[br] : null; if (TB2 && TB2.el) return TB2.el;   // [ENG2] 갈래의 계열(소이 로켓 fire, 벽력 부적 bolt 등)
  if (k === 'arcane' && lvl >= 4 && br === 0) return 'bolt';
  if (k === 'catapult' && lvl >= 4 && br === 0) return 'fire';
  return TOWERS[k].dmgType;
}
function kindEl(kind) { return kind === 'phys' ? 'phys' : kind === 'expl' ? 'expl' : kind === 'magic' ? 'magic' : 'true'; }
function cardLv(g, tk, base) { return tk ? ((g.build[tk] || {})[base] || 0) : (g.buffs[base] || 0); }
function cmbOn(g, tk, id) { return !!(g.cmb[tk] && g.cmb[tk][id]); }
// 종탑 기운(카드 반영)
function bellSt(g, bl) {
  var s = towerStats(bl.k, bl.lvl, bl.br), B = g.build.bell || {}, o = {};
  for (var k in s) o[k] = s[k];
  o.range = s.range * (1 + 0.2 * (B.bellR || 0)); o.aura = (s.aura || 0) + 0.08 * (B.bellD || 0); o.auraSpd = (s.auraSpd || 0) + 0.1 * (B.bellS || 0);
  return o;
}
// 연구, 종탑 버프, 능력 카드를 반영한 능력치
function refreshStats(g) {
  var bells = g.towers.filter(function (t) { return tfBellK(t.k); }).map(function (bl) { return { t: bl, s: bellSt(g, bl) }; });
  var BF = g.buffs || {}, RLs = g.rule && RULES[g.rule.id];
  g.towers.forEach(function (t) {
    var b = { dmg: 0, spd: 0, rng: 0 };
    if (!tfBellK(t.k) && t.k !== 'mint') bells.forEach(function (bb) {
      var bl = bb.t, s = bb.s;
      if (d2(bl.x, bl.y, t.x, t.y) <= s.range * s.range + 0.01) { b.dmg = Math.max(b.dmg, s.aura || 0); b.spd = Math.max(b.spd, s.auraSpd || 0); b.rng = Math.max(b.rng, s.auraRng || 0); }
    });
    if (typeof tw2Buff === 'function') tw2Buff(g, t, b);   // [ENG2] 판옥 대장선의 수상 탑 강화
    t.buff = b;
    var s = towerStats(t.k, t.lvl, t.br), R = g.R, C = g.build[t.k] || {};
    var st = {}; for (var k in s) st[k] = s[k];
    var dm = (1 + (R.tdmg[t.k] || 0) + b.dmg) * (1 + 0.06 * Math.min(5, (g.tStar && g.tStar[t.k]) || 0)) * (g.tfEraM && g.tfEraM[t.k] || 1), dot = (1 + R.dotMul) * (1 + 0.3 * (BF.g_dot || 0));
    if (st.dmg) st.dmg *= dm; if (st.dps0) { st.dps0 *= dm; st.dps1 *= dm; }
    if (st.zoneDps) st.zoneDps *= dm * dot; if (st.burn) st.burn *= dm * dot * (1 + 0.4 * (C.heat || 0)); if (st.poison) st.poison *= dm * dot;
    if (st.auraDps) st.auraDps *= dot;
    if (st.range && !tfBellK(t.k) && t.k !== 'mint') st.range *= (1 + (R.trng[t.k] || 0) + b.rng + 0.1 * (BF.g_rng || 0)) * g.rangeMod;
    if (st.range && tfBellK(t.k)) st.range *= 1 + 0.2 * (C.bellR || 0);
    if (st.rate) st.rate *= (1 + b.spd + 0.15 * (BF.g_spd || 0) + (t.k === 'archer' ? 0.2 * (C.rapid || 0) : 0));
    if (st.slow) { st.slow = Math.min(0.8, st.slow + R.slowAdd + 0.1 * (C.chill || 0)); st.slowT *= (1 + R.slowDur); }
    if (st.auraSlow) st.auraSlow += R.slowAdd * 0.5;
    // 카드: 계열과 속성
    st.el = towerEl(g, t.k, t.lvl, t.br); st.cardEl = g.attr[t.k] || null;
    if (t.k !== 'mint' && !tfBellK(t.k) && BF.g_crit) { if (st.kind === 'arrow') { st.crit = (st.crit || 0) + 0.1 * BF.g_crit; st.critX = st.critX || 2; } else st.cc = 0.1 * BF.g_crit; }
    if (st.splash) st.splash *= 1 + 0.25 * (C.blast || 0);
    if (C.frag) st.frag = (st.frag || 0) + 1 + 2 * C.frag;            // 파편 3, 5개 (유성 투석기는 기본 4개)
    if (C.stun) st.stunC = 0.25 * C.stun;
    if (st.pierce) st.pierce += 2 * (C.lance || 0);
    if (C.knock) st.knockD = 0.3 * C.knock;
    if (C.ap) st.ap = Math.max(st.ap || 0, 0.3 * C.ap);
    if (C.chainP) { if (st.kind === 'chain') st.chain += C.chainP; else st.ochain = C.chainP; }
    if (C.mark) st.mark = Math.max(st.mark || 0, 0.15 * C.mark);
    if (C.freeze) { st.freeze = (st.freeze || 0.08) + 0.08 * C.freeze; st.freezeT = (st.freezeT || 0.6) + 0.4 * C.freeze; st.shatter = st.shatter || 0.15; }
    if (C.shard) st.shard = (st.shard || 0) + 1 + C.shard;
    if (C.wide && st.cone) { st.cone += 20 * C.wide; st.range *= 1 + 0.1 * C.wide; }
    if (C.cloud && st.cloudR) { st.cloudR *= 1 + 0.25 * C.cloud; st.cloudT += C.cloud; }
    if (C.acid && st.shred != null) st.shred += 0.1 * C.acid;
    if (C.twin) st.twin = 1;
    if (st.gold) { st.gold = Math.round(st.gold * (1 + 0.25 * (C.vault || 0))); if (C.interest) st.int2 = 0.02 * C.interest; }
    if (typeof tw2Stats === 'function') tw2Stats(g, t, st, dm, dot, C);   // [ENG2] 새 탑 능력치(덤 피해 칸 배수, 새 카드)
    if (t.lvl >= 5 && (st.dmg || st.flameDps)) st.detect = 1;   // v2.2: Ⅴ단계로 강화한 공격 탑은 숨은 적을 본다
    if (TW_DETECT.indexOf(t.k) >= 0) st.detect = 1;   // v2.2: 탐지 무기
    t.st = st; t.hit = st.hit || fdHit(t.k);   // 갈래에 따라 맞히는 영역이 바뀔 수 있음(다탄두 미사일, 미사일 순양함)
    if (RLs && RLs.stats) RLs.stats(g, t, st);   // 판 규칙이 능력치를 고침(안개 사거리 등)
  });
}

// ---------- 적 ----------
function spawnEnemy(g, type, pathIdx, d, extra) {
  var E = ENEMIES[type], sc = (g.D.endless ? endlessHp(g) : hpScale(g.mi, Math.max(0, g.wave - 1), g.dk)) * (g.tfHp || 1);   // 타임플렉스: 시간 초월 모드 체력 배수
  if (E.boss) sc = Math.pow(sc, 0.6) * (g.D.endless ? 1 + g.wave * 0.02 : 1);
  var lq = !E.boss && typeof tfLateQ === 'function' ? tfLateQ(g.M, Math.max(0, g.wave - 1), g.N, g.dk) : 0;   // v1.2 중반 이후 단단한 적
  if (lq > 0) sc *= tfLateBig(E) ? 1 + TF_LATE.tot * lq : tfLateHp(lq, E);
  // 영역과 길: 항로(lane) → g.air, 바다 → g.sea, 보통 하늘 → g.fly(땅 길을 편 곡선), 땅 → g.paths. 그 길이 이 판에 없으면 땅 길로
  var dom = fdDom(E), fly = dom === 'a', rt = fdRoute(E), list = rt === 'air' ? g.air : rt === 'sea' ? g.sea : fly ? g.fly : g.paths;
  if (!list.length) { list = fly ? g.fly : g.paths; rt = 'path'; }
  pathIdx = ((pathIdx | 0) % list.length + list.length) % list.length;
  var P = list[pathIdx];
  var e = {
    id: g.idSeq++, k: type, E: E, hp: E.hp * sc, mhp: E.hp * sc, armor: E.armor || 0, mres: E.mres || 0, spd: E.spd, gold: E.gold, leak: E.leak, size: E.size,
    fly: fly, dom: dom, route: rt, lane: rt === 'air' ? 1 : 0, z: fly ? 0.75 : 0, ang: 0, stealth: !!E.stealth, boss: !!E.boss, pi: pathIdx, P: P, d: d || 0, off: fly ? 0 : (g.rnd() - 0.5) * (dom === 's' ? 0.16 : 0.3), x: 0, y: 0, face: 1, dirx: 0, diry: 1,
    slowF: 0, slowT: 0, stunT: 0, ccS: 0, ccK: 0, frozen: 0, burnDps: 0, burnT: 0, poisonDps: 0, poisonT: 0, plague: 0, shredA: 0, shredT: 0,
    shield: 0, revived: 0, reviveT: 0, buffSpd: 0, buffSpdT: 0, abilT: 2 + g.rnd() * 2, abil2: 6, blocked: null, hitT: 0, age: 0, revealed: 0, dead: 0, untarget: 0, kneel: 0, anim: g.rnd(),
    // v1.3 상태: iceArm 얼음 갑옷(1 있음), meltT 녹은 남은 시간, twin 쌍둥이 왕 상태, markT/markA 증폭 표식, cfxT 저항 반짝 간격, wallCd 토끼 방책 기절 간격
    iceArm: E.iceArmor ? 1 : 0, meltT: 0, twin: E.twin ? 'fire' : null, twinT: E.twin ? E.twin.cd : 0, markT: 0, markA: 0, cfxT: 0, wallCd: 0
  };
  if (lq > 0 && !tfLateBig(E)) e.gold = E.gold / tfLateCut(lq, E);
  if (extra) for (var k in extra) e[k] = extra[k];
  placeEnemy(e);
  g.enemies.push(e);
  var AB = EN_AB[type]; if (AB && AB.spawn) AB.spawn(g, e);
  var RLe = g.rule && RULES[g.rule.id]; if (RLe && RLe.spawn) RLe.spawn(g, e);
  if (!g.seenEnemies[type]) { g.seenEnemies[type] = 1; emit(g, 'newEnemy', { k: type }); }
  if (e.boss) { g.boss = e; emit(g, 'boss', { k: type }); }
  return e;
}
function endlessHp(g) { var i = Math.max(0, g.wave - 1); if (g.D.arena) return arHp(g, i); return hpScale(g.mi, i, 'normal') * (1 + 0.05 * Math.max(0, i - g.M.waves)); }
function placeEnemy(e) {
  pathAt(e.P, e.d, _pa);
  e.x = _pa.x - _pa.dy * e.off; e.y = _pa.y + _pa.dx * e.off; e.dirx = _pa.dx; e.diry = _pa.dy; e.ang = Math.atan2(_pa.dy, _pa.dx);
  if (Math.abs(_pa.dx) > 0.35) e.face = _pa.dx > 0 ? 1 : -1;
}
function effArmor(e) { return clamp(e.armor - e.shredA, 0, 0.95); }
// 저항 반짝(화면용): k ice 얼음 갑옷, immune 불 면역, reflect 마법 반사, ting 정면 방패. 적마다 0.35초에 한 번
function cfx(g, e, k) { if (e.cfxT > 0 && e.cfxK === k) return; e.cfxT = 0.35; e.cfxK = k; emit(g, 'resist', { en: e, k: k, x: e.x, y: e.y }); }
// 정면: 적의 진행 방향 앞 120도(양쪽 60도)에서 온 것
function frontHit(e, fx, fy) { var dx = fx - e.x, dy = fy - e.y, L = Math.hypot(dx, dy); if (L < 0.05) return false; return (dx * e.dirx + dy * e.diry) / L > 0.5; }
// 상성 배수 (계열 el, 피해 종류 kind, opt.single 단일 투사체와 쏜 자리 fx, fy)
function counterMul(g, e, el, kind, opt) {
  var E = e.E, m = 1;
  if (E.iceArmor) {
    if (el === 'fire') { if (e.iceArm) { e.iceArm = 0; emit(g, 'melt', { en: e, x: e.x, y: e.y }); } e.meltT = E.meltT || 4; }
    else if (e.iceArm) { m *= 0.25; cfx(g, e, 'ice'); }
  }
  if (E.fireImm && el === 'fire') { cfx(g, e, 'immune'); return 0; }
  if (E.iceWeak && el === 'ice') m *= E.iceWeak;
  if (E.magRef && kind === 'magic') { cfx(g, e, 'reflect'); return 0; }
  if (E.frontGuard && opt && opt.single && frontHit(e, opt.fx, opt.fy)) { m *= E.frontGuard; cfx(g, e, 'ting'); }
  if (e.twin) m *= el === (e.twin === 'fire' ? 'ice' : 'fire') ? 2 : 0.4;
  return m;
}
// 피해: kind phys / expl / magic / true. opt: { el 계열(없으면 src.el, 그것도 없으면 kind), single, fx, fy }
function hurt(g, e, amt, kind, src, quiet, opt) {
  if (e.dead || amt <= 0) return 0;
  if (e.kneel) return 0;
  var a = amt, el = (opt && opt.el) || (src && src.el) || kindEl(kind);
  if (kind === 'phys') a *= 1 - effArmor(e) * (1 - (src && src.ap ? src.ap : 0));
  else if (kind === 'expl') a *= 1 - effArmor(e) * 0.5;
  else if (kind === 'magic') a *= 1 - e.mres;
  if (kind !== 'true') { var cm = counterMul(g, e, el, kind, opt); if (cm <= 0) return 0; a *= cm; }
  if (e.frozen && e.shatter) a *= 1 + e.shatter;
  if (e.markT > 0) a *= 1 + e.markA;
  if (e.boss && g.buffs.g_boss) a *= 1 + 0.2 * g.buffs.g_boss;
  // 적 능력 고리: 갑옷, 상성, 표식까지 셈한 피해를 넘기고 바뀐 피해를 받음(0 이하면 안 맞음). 보호막 깎기 전
  var AB = EN_AB[e.k]; if (AB && AB.hurt) { a = AB.hurt(g, e, a, { kind: kind, el: el, src: src, opt: opt, raw: amt, quiet: !!quiet }); if (!(a > 0)) return 0; }
  if (e.shield > 0) { var s = Math.min(e.shield, a); e.shield -= s; a -= s; if (e.shield <= 0) emit(g, 'shieldBreak', { x: e.x, y: e.y }); }
  e.hp -= a;
  if (!quiet) { e.hitT = 0.09; emit(g, 'dmg', { en: e, a: a, kind: kind, el: el }); }
  if (src && src.tw) src.tw.dmg += a;
  meterAdd(g, src, a, 0);   // v2.2 딜미터
  if (e.k === 'barkan' && e.hp <= e.mhp * 0.02 && !g.D.endless) { e.hp = e.mhp * 0.02; if (!e.kneel) { e.kneel = 1; g.finale = 1; g.sk.last.cd = 0; emit(g, 'kneel', { x: e.x, y: e.y }); } return a; }
  if (e.hp <= 0) killEnemy(g, e, src);
  return a;
}
function killEnemy(g, e, src) {
  var E = e.E;
  if (E.revive && !e.revived) {
    e.revived = 1; e.hp = e.mhp * 0.5; e.reviveT = 1.8; e.untarget = 1; e.burnT = 0; e.poisonT = 0;
    emit(g, 'bones', { x: e.x, y: e.y, id: e.id });
    return;
  }
  // 적 능력 고리: 죽기 직전. false를 돌려주면 죽음 취소(능력이 e.hp를 올려 둘 것: 부활, 변신)
  var AB = EN_AB[e.k]; if (AB && AB.die && AB.die(g, e, src) === false) { if (e.hp <= 0) e.hp = 1; return; }
  e.dead = 1;
  var wi = Math.max(0, g.wave - 1), gk = Math.sqrt((1 + 0.035 * wi + 0.0012 * wi * wi) * g.M.hpMul);   // late(뒤 웨이브 추가 성장)는 금화에 반영하지 않음
  var gold = Math.round(e.gold * g.D.gold * (1 + g.R.killGold + 0.2 * (g.buffs.g_gold || 0)) * gk * sk2GoldMul(g));
  g.gold += gold; g.stats.goldEarned += gold; g.stats.kills++;
  if (src && src.tw) src.tw.kills++;
  meterAdd(g, src, 0, 1);
  emit(g, 'kill', { x: e.x, y: e.y, k: e.k, gold: gold, face: e.face, fly: e.fly, dom: e.dom, size: e.size, boss: e.boss, anim: e.anim, dirx: e.dirx, diry: e.diry, form: e.form || null, die: (e.F || E).die || null });
  if (E.split) {
    for (var i = 0; i < E.split[1]; i++) spawnEnemy(g, E.split[0], e.pi, Math.max(0, e.d - 0.15 - i * 0.28), { off: clamp(e.off + (i ? 0.12 : -0.12), -0.2, 0.2), slowF: e.slowF, slowT: e.slowT });
    emit(g, 'split', { x: e.x, y: e.y, k: e.k });
  }
  if (E.carry) {
    var n = 0;
    E.carry.forEach(function (c) { for (var j = 0; j < c[1]; j++) { spawnEnemy(g, c[0], e.pi, Math.max(0, e.d - n * 0.2), { off: (g.rnd() - 0.5) * 0.34 }); n++; } });
    emit(g, 'wreck', { x: e.x, y: e.y });
  }
  if (e.plague && e.poisonT > 0) {
    g.enemies.forEach(function (o) { if (!o.dead && o !== e && !o.fly && d2(o.x, o.y, e.x, e.y) < 1.44) { o.poisonDps = Math.max(o.poisonDps, e.poisonDps * 0.8); o.poisonT = Math.max(o.poisonT, 3); o.plague = 1; } });
    emit(g, 'plague', { x: e.x, y: e.y });
  }
  // [카드] 화염탑 불씨 옮기기, 들불
  if (e.burnT > 0 && e.burnDps > 0 && cardLv(g, 'flame', 'spread')) {
    g.enemies.forEach(function (o) { if (!o.dead && o !== e && d2(o.x, o.y, e.x, e.y) < 1.44) burnE(o, e.burnDps * 0.8, 2); });
    if (cmbOn(g, 'flame', 'wildfire') && !e.fly) g.zones.push({ kind: 'fire', x: e.x, y: e.y, r: 0.7, t: 3, T: 3, dps: e.burnDps * 0.8, src: null });
    emit(g, 'spread', { x: e.x, y: e.y });
  }
  if (g.focus && g.focus.e === e) g.focus = null;
  if (e.boss && g.boss === e) { g.boss = null; emit(g, 'bossDie', { x: e.x, y: e.y, k: e.k }); }
}
// 감속: 불씨 도깨비는 세기 1.5배(slowK), 번개 토끼는 시간 2배(slowX)
function slowE(e, f, t) { var E = e.E; if (E.slowK) f = Math.min(0.85, f * E.slowK); if (E.slowX) t *= E.slowX; if (e.boss) f *= 0.5; if (f >= e.slowF || e.slowT <= 0) { e.slowF = Math.max(f, e.slowT > 0 ? e.slowF : 0); } e.slowT = Math.max(e.slowT, t); }
// 버티기(v2.0.1): 기절과 밀려남에는 한도가 있다. 연달아 맞을수록 덜 먹혀서, 기절 탑이나 밀어내는 탑을 여럿 겹쳐도 적을 영원히 묶어 둘 수 없다.
//   기절: 적마다 쌓인 양 ccS(초)가 CC_STUN_CAP을 넘지 못하고 초당 CC_STUN_DECAY씩 빠진다 → 오래 보면 멈춰 있는 시간이 절반을 넘지 않음. 탑 하나로 가끔 맞는 기절은 그대로
//   밀려남: 쌓인 거리 ccK(칸)가 CC_KB_CAP을 넘지 못하고 초당 CC_KB_DECAY칸씩 빠진다
//   force: 규칙을 건너뜀(이어하기, 방책에 부딪힌 적의 제 기절)
var CC_STUN_CAP = 2.0, CC_STUN_DECAY = 0.5, CC_KB_CAP = 0.7, CC_KB_DECAY = 0.1;
function stunE(e, t, force) {
  if (e.boss) t *= 0.25;
  if (!force) {
    var cur = Math.max(0, e.stunT), add = t - cur;
    if (add <= 0) return cur > 0;
    var room = CC_STUN_CAP - (e.ccS || 0);
    if (room <= 0.05) return cur > 0;
    if (add > room) { add = room; t = cur + add; }
    e.ccS = (e.ccS || 0) + add;
  }
  e.stunT = Math.max(e.stunT, t); return true;
}
function knockE(e, d) {
  var room = CC_KB_CAP - (e.ccK || 0);
  if (room <= 0.02 || !(d > 0)) return 0;
  if (d > room) d = room;
  e.ccK = (e.ccK || 0) + d; e.d = Math.max(0, e.d - d); placeEnemy(e);
  return d;
}
// 빙결(얼려 멈춤): 토끼는 2배, 우두머리는 빙결 대신 강한 감속
function freezeE(e, t, shatter) { if (e.boss) { slowE(e, 0.5, t); return; } if (e.E.slowX) t *= e.E.slowX; if (stunE(e, t)) { e.frozen = 1; e.shatter = Math.max(e.shatter || 0, shatter || 0); } }
// 화상: 불 면역이면 붙지 않음
function burnE(e, dps, t) { if (e.E.fireImm || !(dps > 0)) return; e.burnDps = Math.max(e.burnDps, dps); e.burnT = Math.max(e.burnT, t); }
function poisonE(e, dps, t, shred) { e.poisonDps = Math.max(e.poisonDps, dps); e.poisonT = Math.max(e.poisonT, t); if (shred) { e.shredA = Math.max(e.shredA, shred); e.shredT = Math.max(e.shredT, t); } }
// 가까운 적 n명 (제외 목록 skip)
function nearEnemies(g, x, y, r, n, skip, air) {
  var out = [], hs = fdHitOf(air);
  for (var i = 0; i < g.enemies.length; i++) { var o = g.enemies[i]; if (o.dead || o.untarget || (skip && skip[o.id]) || hs.indexOf(o.dom) < 0 || (o.stealth && !o.revealed)) continue; var dd = d2(o.x, o.y, x, y); if (dd < r * r) out.push([dd, o]); }
  out.sort(function (a, b) { return a[0] - b[0]; });
  return out.slice(0, n).map(function (q) { return q[1]; });
}
// 번개가 근처 적에게 튐 (속성 카드, 조합)
function zapFrom(g, e, n, dmg, src, stun) {
  var skip = {}; skip[e.id] = 1;
  var tg = nearEnemies(g, e.x, e.y, 1.7, n, skip, true); if (!tg.length) return;
  var pts = [[e.x, e.y - e.size * 0.5]];
  tg.forEach(function (o) { pts.push([o.x, o.y - (o.fly ? 0.7 : o.size * 0.5)]); hurt(g, o, dmg, 'magic', src, false, { el: 'bolt' }); if (stun && !o.dead) stunE(o, stun); });
  emit(g, 'zap', { pts: pts, lvl: 2, el: 'bolt' });
}
// 속성 카드의 덤 효과 (직접 맞은 적마다). 계열 판정은 hurt에서 이미 함
function elHit(g, st, e, dmg, src) {
  var el = st && st.cardEl; if (!el || e.dead) return;
  if (el === 'fire') burnE(e, dmg * 0.25 * (1 + g.R.dotMul) * (1 + 0.3 * (g.buffs.g_dot || 0)), 2.5);
  else if (el === 'ice') slowE(e, 0.25, 1.5);
  else if (el === 'bolt') { if (g.rnd() < 0.25 * Math.min(1, 1.2 / Math.max(0.3, st.rate || 1))) zapFrom(g, e, 2, dmg * 0.5, src); }
  else if (el === 'poison') poisonE(e, dmg * 0.2 * (1 + g.R.dotMul) * (1 + 0.3 * (g.buffs.g_dot || 0)), 3, 0.1);
  emit(g, 'elHit', { x: e.x, y: e.y, en: e, el: el });
}
function critMul(g, st) { return st.cc && g.rnd() < st.cc ? 2 : 1; }

// ---------- 표적 ----------
// 영역(v2.0): hit = 맞힐 수 있는 영역 글자 모음('gas', 'a', 'gs'...). 옛 air 인자(true/false)도 받음: true 'gas', false 'gs'
function fdHitOf(air) { return typeof air === 'string' ? air : air ? 'gas' : 'gs'; }
function fdCanHit(hit, e) { return !hit || hit.indexOf(e.dom || (e.fly ? 'a' : 'g')) >= 0; }
// hit을 주면 영역까지 확인
function targetable(g, e, hit) { return !e.dead && !e.untarget && (!hit || hit.indexOf(e.dom) >= 0); }
// v2.2 은신 규칙: 숨은 적은 (1) 탐지 무기(TW_DETECT, 매의 눈 갈래, 관리자 탑) (2) Ⅴ단계 이상 공격 탑 (3) 드러내는 탑(종탑, 장승, 신당) 범위 (4) 아무 탑이나 STEALTH_NEAR칸 곁을 지날 때만 맞힐 수 있다
var TW_DETECT = ['sniper', 'laser'], STEALTH_NEAR = 1.3;
var SK_SRC = { rain: { sk: 'rain' }, wall: { sk: 'wall' }, last: { sk: 'last' } };   // v2.2 딜미터용 기술 출처
function seenBy(e, st) { return !e.stealth || e.revealed || st.detect; }
function inR(t, x, y, r) { return d2(t.x, t.y, x, y) <= r * r; }
// 표적 고르기: 탑의 hit(t.hit) 영역만. 넷째 인자로 영역 글자 모음을 주면 그것을 씀(옛 true/false는 무시하고 t.hit)
function pickTarget(g, t, st, air) {
  var r = st.range + 0.12, hit = typeof air === 'string' ? air : (t.hit || fdHit(t.k));
  var F = g.focus;
  if (F) {
    if (F.e && targetable(g, F.e, hit) && seenBy(F.e, st) && inR(t, F.e.x, F.e.y, r + F.e.size * 0.3)) return F.e;
    if (F.o && F.o.alive && inR(t, F.o.x, F.o.y, r + F.o.w * 0.35)) return F.o;
  }
  var best = null, bv = 0, mode = t.mode;
  for (var i = 0; i < g.enemies.length; i++) {
    var e = g.enemies[i];
    if (!targetable(g, e, hit) || !seenBy(e, st)) continue;
    if (!inR(t, e.x, e.y, r + e.size * 0.2)) continue;
    var v;
    if (mode === 'first') v = -(e.P.len - e.d);
    else if (mode === 'last') v = e.P.len - e.d;
    else if (mode === 'strong') v = e.hp + (e.boss ? 1e7 : 0);
    else v = -d2(t.x, t.y, e.x, e.y);
    if (!best || v > bv) { best = e; bv = v; }
  }
  return best;
}
function predict(e, T) {
  if (e.kind === 'obs') return { x: e.x, y: e.y };
  var sp = (e.stunT > 0 || e.blocked || e.reviveT > 0 || e.kneel) ? 0 : e.spd * (1 - e.slowF) * (1 + (e.buffSpdT > 0 ? e.buffSpd : 0));
  var q = pathAt(e.P, Math.min(e.P.len, e.d + sp * T), { x: 0, y: 0, dx: 0, dy: 0 });
  return { x: q.x - q.dy * e.off, y: q.y + q.dx * e.off };
}
// 곧게 나는 작은 탄(사선 화살, 관통 이어 날기, 얼음 파편): 처음 닿는 적부터 pierce명
function pushDart(g, o) {
  if (g.proj.length > PROJ_CAP) return null;
  var p = { kind: 'dart', x: o.x, y: o.y, vx: Math.cos(o.ang) * (o.sp || 10), vy: Math.sin(o.ang) * (o.sp || 10), ang: o.ang, left: o.left || 3.5, pierce: o.pierce || 1, hit: o.hit || {}, dmg: o.dmg, dk: o.dk || 'phys', src: o.src, st: o.st, single: o.single ? 1 : 0, el: o.el || null, fireLine: o.fireLine ? 1 : 0, shard: o.shard ? 1 : 0, burst: o.burst ? 1 : 0, air: o.air == null ? 1 : o.air, t: 0, h: o.h == null ? 0.55 : o.h };
  g.proj.push(p); return p;
}

// ---------- 탑 행동 ----------
function towerAct(g, t, dt) {
  var st = t.st, T = TOWERS[t.k], kind = st.kind;
  if (t.fireT > 0) t.fireT -= dt;
  if (t.frozenT > 0) { t.frozenT -= dt; return; }
  // v2.0 멈춤 상태: 기절, 저주, 홀림 (적 능력과 판 규칙이 건다)
  if (t.stunT > 0 || t.hexT > 0 || t.charmT > 0) { var tk2 = st.tough ? 2 * dt : dt; if (t.stunT > 0) t.stunT -= tk2; if (t.hexT > 0) t.hexT -= tk2; if (t.charmT > 0) t.charmT -= tk2; return; }   // [ENG2] tough: 멈춤 절반
  // 등록 고리: 공격 종류(kind)별 동작이 등록돼 있으면 그것이 전부 맡는다(쿨다운 t.cd, 표적, 탄, 사건)
  if (TW_ACT[kind]) { TW_ACT[kind](g, t, dt); return; }
  if (kind === 'mint') return;
  var src0 = { tw: t, ap: st.ap || 0, el: st.el };
  if (kind === 'aura') {
    if (st.auraDps || st.auraSlow) {
      for (var i = 0; i < g.enemies.length; i++) {
        var e = g.enemies[i]; if (e.dead || !inR(t, e.x, e.y, st.range)) continue;
        if (st.auraDps) hurt(g, e, st.auraDps * dt, 'magic', src0, true);
        if (st.auraSlow) slowE(e, st.auraSlow, 0.3);
        if (st.auraShred) { e.shredA = Math.max(e.shredA, st.auraShred); e.shredT = Math.max(e.shredT, 0.3); }
      }
    }
    return;
  }
  if (kind === 'beam') {
    var tg = pickTarget(g, t, st, true);
    if (!tg) { t.beamTgt = null; t.beamT = 0; return; }
    if (tg !== t.beamTgt) { t.beamTgt = tg; t.beamT = 0; }
    t.beamT += dt; t.fireT = 0.1;
    t.aim = Math.atan2(tg.y - t.y, tg.x - t.x);
    var dps = lerp(st.dps0, st.dps1, Math.min(1, t.beamT / st.ramp));
    if (tg.kind === 'obs') hurtObs(g, tg, dps * dt); else {
      hurt(g, tg, dps * dt, 'magic', src0, true);
      // 속성 덤은 0.5초마다
      t.elT = (t.elT || 0) - dt; if (st.cardEl && t.elT <= 0) { t.elT = 0.5; elHit(g, st, tg, dps * 0.5, src0); }
      if (st.mark && !tg.dead) { tg.markT = 3; tg.markA = Math.max(tg.markA, st.mark); }
      if (st.beamSplash) for (var bs = 0; bs < g.enemies.length; bs++) { var be = g.enemies[bs]; if (be !== tg && !be.dead && !be.untarget && d2(be.x, be.y, tg.x, tg.y) < st.beamSplash * st.beamSplash) hurt(g, be, dps * dt * st.beamSplashF, 'magic', src0, true); }   // [ENG2] 6단계 별빛 붕괴포
    }
    return;
  }
  t.cd -= dt;
  if (t.cd > 0) return;
  if (kind === 'pulse' || kind === 'ring') {
    var any = false;
    for (var j = 0; j < g.enemies.length; j++) { var e2 = g.enemies[j]; if (!e2.dead && !e2.untarget && inR(t, e2.x, e2.y, st.range)) { any = true; break; } }
    if (!any) { t.cd = 0.1; return; }
    t.cd = 1 / st.rate; t.fireT = 0.35;
    var hitList = [];
    for (var j2 = 0; j2 < g.enemies.length; j2++) {
      var e3 = g.enemies[j2]; if (e3.dead || e3.untarget || !inR(t, e3.x, e3.y, st.range + e3.size * 0.2)) continue;
      hitList.push(e3);
      if (kind === 'pulse') {
        hurt(g, e3, st.dmg, 'magic', src0);
        if (e3.dead) continue;
        slowE(e3, st.slow, st.slowT);
        if (st.freeze && g.rnd() < st.freeze && !e3.boss) freezeE(e3, st.freezeT, st.shatter);
        elHit(g, st, e3, st.dmg, src0);
      } else {
        hurt(g, e3, st.dmg, 'magic', src0);
        if (!e3.dead) { burnE(e3, st.burn, st.burnT); if (st.ringStun) stunE(e3, st.ringStun); elHit(g, st, e3, st.dmg, src0); }
      }
    }
    // [카드] 얼음 파편: 파동마다 근처 적에게 곧은 파편
    if (kind === 'pulse' && st.shard) {
      var sh = nearEnemies(g, t.x, t.y, st.range + 1.2, st.shard, null, true), burst = cmbOn(g, 'frost', 'iceBurst');
      sh.forEach(function (o) { pushDart(g, { x: t.x, y: t.y - 0.2, ang: Math.atan2(o.y - t.y + 0.2, o.x - t.x), sp: 9, left: st.range + 1.6, pierce: 1, dmg: 12 + st.dmg * 1.6, dk: 'magic', src: src0, st: st, single: 1, el: st.el, shard: 1, burst: burst, h: 0.7 }); });
    }
    emit(g, kind === 'pulse' ? 'pulse' : 'ring', { x: t.x, y: t.y, r: st.range, k: t.k, br: t.br, lvl: t.lvl, el: st.cardEl });
    return;
  }
  var air = t.hit || fdHit(t.k);
  var tgt = pickTarget(g, t, st, air);
  if (!tgt) { t.cd = 0.08; return; }
  t.cd = 1 / st.rate;
  t.aim = Math.atan2(tgt.y - t.y, tgt.x - t.x);
  t.fireT = 0.25; t.side = 1 - t.side; t.shots = (t.shots || 0) + 1;
  var src = src0;
  if (kind === 'arrow') {
    var tg2 = [tgt], C = g.build.archer || {}, nf = C.front || 0, nd = C.diag || 0, shots = 0;
    if (st.multi > 1) {
      var others = g.enemies.filter(function (e) { return e !== tgt && targetable(g, e, air) && seenBy(e, st) && inR(t, e.x, e.y, st.range + 0.12); });
      others.sort(function (a, b) { return (a.P.len - a.d) - (b.P.len - b.d); });
      for (var m = 0; m < st.multi - 1; m++) tg2.push(others[m] || tgt);
    }
    tg2.forEach(function (tt, n) {
      for (var f = 0; f <= nf; f++) {
        if (f && g.proj.length > PROJ_CAP) break;
        var dm = st.dmg * (f ? 0.7 : 1), crit = st.crit && g.rnd() < st.crit;
        if (crit) dm *= st.critX || 2;
        var dist = hyp(t.x, t.y, tt.x, tt.y), lat = (n - (tg2.length - 1) / 2) * 0.12 + (f ? (f % 2 ? 1 : -1) * Math.ceil(f / 2) * 0.13 : 0);
        g.proj.push({ kind: 'arrow', sx: t.x + lat, sy: t.y, h0: 0.95, x: t.x, y: t.y, tx: tt.x, ty: tt.y, tgt: tt, t: 0, T: 0.12 + dist / 9 + f * 0.035, h: 0.2 + dist * 0.07, dmg: dm, dt: 'phys', src: src, crit: crit, big: t.lvl >= 4 && t.br === 0, pierce: (C.pierce || 0) + (st.apierce || 0), bounce: (C.bounce || 0) + (st.abounce || 0), el: st.cardEl, extra: f > 0 ? 1 : 0, st: st, lvl: t.lvl });
        shots++;
      }
    });
    // [카드] 사선 화살 (조합 '부채꼴 사격'이면 더 촘촘하고 넓게)
    if (nd) {
      var fan = cmbOn(g, 'archer', 'fan'), angs = fan ? (nd > 1 ? [0.28, 0.56, 0.84] : [0.35, 0.7]) : (nd > 1 ? [0.44, 0.87] : [0.52]);
      angs.forEach(function (da) { [-1, 1].forEach(function (sg) { if (pushDart(g, { x: t.x, y: t.y, ang: t.aim + da * sg, sp: 10, left: st.range + 0.8, pierce: 1 + (C.pierce || 0), dmg: st.dmg * 0.6, dk: 'phys', src: src, st: st, single: 1, el: st.cardEl, fireLine: cmbOn(g, 'archer', 'fireLine'), h: 0.8 })) shots++; }); });
    }
    emit(g, 'shoot', { k: 'archer', x: t.x, y: t.y, lvl: t.lvl, br: t.br, tw: t, n: shots });
  } else if (kind === 'stone' || kind === 'flask') {
    var dist2 = hyp(t.x, t.y, tgt.x, tgt.y), TT = (kind === 'stone' ? 0.85 : 0.65) + dist2 * 0.1;
    var pp = predict(tgt, TT);
    g.proj.push({ kind: kind, sx: t.x, sy: t.y, h0: 0.75, x: t.x, y: t.y, tx: pp.x, ty: pp.y, tgt: tgt.kind === 'obs' ? tgt : null, t: 0, T: TT, h: 1.1 + dist2 * 0.18, dmg: st.dmg * critMul(g, st), st: st, src: src, br: t.br, lvl: t.lvl, el: st.cardEl });
    // [카드] 두 병 던지기
    if (kind === 'flask' && st.twin) {
      var o2 = nearEnemies(g, tgt.x, tgt.y, st.range * 1.2, 4, (function () { var s = {}; s[tgt.id] = 1; return s; })(), false).filter(function (o) { return inR(t, o.x, o.y, st.range + 0.2); })[0];
      if (o2) { var pq = predict(o2, TT); g.proj.push({ kind: 'flask', sx: t.x, sy: t.y, h0: 0.75, x: t.x, y: t.y, tx: pq.x, ty: pq.y, tgt: null, t: 0, T: TT + 0.08, h: 1.2 + dist2 * 0.18, dmg: st.dmg, st: st, src: src, br: t.br, lvl: t.lvl, el: st.cardEl }); }
    }
    emit(g, 'shoot', { k: t.k, x: t.x, y: t.y, lvl: t.lvl, br: t.br, tw: t });
  } else if (kind === 'orb') {
    g.proj.push({ kind: 'orb', x: t.x, y: t.y - 1.05, ox: t.x, oy: t.y, tgt: tgt, sp: 6.5, dmg: st.dmg * critMul(g, st), src: src, st: st, t: 0, lvl: t.lvl, el: st.cardEl });
    emit(g, 'shoot', { k: 'arcane', x: t.x, y: t.y, lvl: t.lvl, br: t.br, tw: t });
  } else if (kind === 'shell') {
    g.proj.push({ kind: 'shell', x: t.x + Math.cos(t.aim) * 0.42, y: t.y - 0.42 + Math.sin(t.aim) * 0.42, tgt: tgt, sp: 11, dmg: st.dmg * critMul(g, st), st: st, src: src, t: 0, lvl: t.lvl, br: t.br, el: st.cardEl });
    emit(g, 'shoot', { k: 'cannon', x: t.x, y: t.y, lvl: t.lvl, br: t.br, aim: t.aim, tw: t });
  } else if (kind === 'bolt') {
    var dist3 = hyp(t.x, t.y, tgt.x, tgt.y), pp2 = predict(tgt, dist3 / 13);
    var ang = Math.atan2(pp2.y - t.y, pp2.x - t.x); t.aim = ang;
    g.proj.push({ kind: 'bolt', x: t.x, y: t.y - 0.35, vx: Math.cos(ang) * 13, vy: Math.sin(ang) * 13, left: st.range + 1.6, pierce: st.pierce, hit: {}, dmg: st.dmg * critMul(g, st), st: st, src: src, tgtObs: tgt.kind === 'obs' ? tgt : null, lvl: t.lvl, br: t.br, ang: ang, el: st.cardEl });
    emit(g, 'shoot', { k: 'ballista', x: t.x, y: t.y, lvl: t.lvl, br: t.br, tw: t });
  } else if (kind === 'chain') {
    var pts = [[t.x, t.y - 1.15]], hitSet = {}, cur = tgt, dmg = st.dmg * critMul(g, st), tstun = cmbOn(g, 'arcane', 'thunderChain') ? 0.3 : 0;
    for (var c = 0; c < st.chain && cur; c++) {
      pts.push([cur.x, cur.y - (cur.kind === 'obs' ? 0.3 : (cur.fly ? 0.7 : cur.size * 0.5))]);
      if (cur.kind === 'obs') { hurtObs(g, cur, dmg); break; }
      hitSet[cur.id] = 1; hurt(g, cur, dmg, 'magic', src);
      if (!cur.dead) { if (st.stun || tstun) stunE(cur, Math.max(st.stun || 0, tstun)); if (st.mark) { cur.markT = 3; cur.markA = Math.max(cur.markA, st.mark); } elHit(g, st, cur, dmg, src); }
      dmg *= st.chainF;
      var nx = null, nb = 2.56;
      for (var q = 0; q < g.enemies.length; q++) { var o = g.enemies[q]; if (hitSet[o.id] || !targetable(g, o, air) || !seenBy(o, st)) continue; var dd = d2(o.x, o.y, cur.x, cur.y); if (dd < nb) { nb = dd; nx = o; } }
      cur = nx;
    }
    emit(g, 'zap', { pts: pts, lvl: t.lvl, el: st.el === 'bolt' ? null : st.cardEl });
  } else if (kind === 'cone') {
    var half = st.cone * Math.PI / 360;
    t.elT = (t.elT || 0) - 1 / st.rate; var doEl = t.elT <= 0; if (doEl) t.elT = 0.5;   // 속성 덤은 0.5초마다(불길은 1초에 4번)
    for (var u = 0; u < g.enemies.length; u++) {
      var e4 = g.enemies[u]; if (e4.dead || e4.untarget || !inR(t, e4.x, e4.y, st.range + e4.size * 0.25)) continue;
      var an = Math.atan2(e4.y - t.y, e4.x - t.x);
      if (Math.abs(angDiff(t.aim, an)) > half && d2(t.x, t.y, e4.x, e4.y) > 0.16) continue;
      hurt(g, e4, st.dmg, 'magic', src, true);
      if (!e4.dead) { burnE(e4, st.burn, st.burnT); if (doEl) elHit(g, st, e4, st.dmg * 2, src); }
    }
    if (tgt.kind === 'obs') hurtObs(g, tgt, st.dmg);
    t.fireT = 0.3;
  }
}

// ---------- 투사체 ----------
// st가 있으면 기절, 넉백, 카드 덤(기절탄, 속성)도
function splashAt(g, x, y, r, dmg, kind, src, st, air) {
  var hs = fdHitOf(air);   // air: true 'gas', false 'gs', 또는 영역 글자 모음
  for (var i = 0; i < g.enemies.length; i++) {
    var e = g.enemies[i]; if (e.dead || e.untarget || hs.indexOf(e.dom) < 0) continue;
    var rr = r + e.size * 0.2;
    if (d2(e.x, e.y, x, y) > rr * rr) continue;
    var fall = 1 - 0.35 * Math.sqrt(d2(e.x, e.y, x, y)) / rr;
    hurt(g, e, dmg * fall, kind, src);
    if (e.dead) continue;
    if (st && st.stun) stunE(e, st.stun);
    if (st && st.stunC && g.rnd() < st.stunC) stunE(e, 0.6);
    if (st && st.knock && !e.boss && !e.fly) knockE(e, st.knock * (e.size < 0.9 ? 1 : 0.5));
    if (st) elHit(g, st, e, dmg * fall, src);
  }
  for (var j = 0; j < g.obs.length; j++) { var o = g.obs[j]; if (o.alive && g.focus && g.focus.o === o && d2(o.x, o.y, x, y) < (r + 0.4) * (r + 0.4)) hurtObs(g, o, dmg * 0.6); }
}
function hurtObs(g, o, amt) {
  if (!o.alive) return;
  o.hp -= amt; o.hitT = 0.09;
  if (o.hp <= 0) {
    o.alive = 0;
    var gold = Math.round(o.gold * (1 + g.R.obsGold));
    g.gold += gold; g.stats.goldEarned += gold; g.stats.obsCleared++;
    if (g.focus && g.focus.o === o) g.focus = null;
    emit(g, 'obsDie', { x: o.x, y: o.y, ch: o.ch, w: o.w, gold: gold, chest: o.chest, id: o.id });
    if (o.tower && o.w === 1) { buildTower(g, o.tower, o.c, o.r, true); emit(g, 'foundTower', { x: o.x, y: o.y, k: o.tower }); }
    if (g.stats.obsCleared === g.stats.obsTotal) emit(g, 'allObs', {});
  }
}
// 터진 자리 카드 덤: 파편, 독 폭탄 조합
function blastExtras(g, p, x, y, tk) {
  var st = p.st; if (!st) return;
  if (st.frag && g.proj.length < PROJ_CAP) {
    for (var i = 0; i < st.frag; i++) {
      var a = i / st.frag * Math.PI * 2 + g.rnd() * 0.8, r = 0.7 + g.rnd() * 0.6;
      g.proj.push({ kind: 'frag', sx: x, sy: y, x: x, y: y, tx: x + Math.cos(a) * r, ty: y + Math.sin(a) * r * 0.8, t: 0, T: 0.32 + g.rnd() * 0.12, h: 0.45, h0: 0.2, dmg: p.dmg * 0.3, src: p.src, st: { cardEl: st.cardEl, rate: st.rate }, fire: cmbOn(g, tk, 'fireworks'), el: st.cardEl, lvl: p.lvl });
    }
  }
  if (cmbOn(g, tk, 'toxicBlast')) g.zones.push({ kind: 'poison', x: x, y: y, r: (st.splash || 0.8) * 0.75, t: 3, T: 3, dps: p.dmg * 0.18, shred: 0.1, plague: 0, src: p.src, br: 0, combo: 1 });
}
function updateProj(g, dt) {
  var keep = [], n0 = g.proj.length;
  for (var i = 0; i < n0; i++) {
    var p = g.proj[i], done = false;
    p.t = (p.t || 0) + dt;
    if (PROJ_UPD[p.kind]) { done = PROJ_UPD[p.kind](g, p, dt) === true; }   // 등록 고리: 새 탄 종류
    else if (p.kind === 'arrow') {
      if (p.tgt && (p.tgt.kind === 'obs' ? p.tgt.alive : !p.tgt.dead && !p.tgt.untarget)) { p.tx = p.tgt.x; p.ty = p.tgt.y; }
      var u = Math.min(1, p.t / p.T);
      p.x = lerp(p.sx, p.tx, u); p.y = lerp(p.sy, p.ty, u); p.u = u;
      if (u >= 1) {
        done = true;
        var tg = p.tgt;
        if (tg && tg.kind === 'obs') { if (tg.alive) hurtObs(g, tg, p.dmg); }
        else if (tg && !tg.dead && !tg.untarget) {
          hurt(g, tg, p.dmg, 'phys', p.src, false, { single: 1, fx: p.sx, fy: p.sy });
          elHit(g, p.st, tg, p.dmg, p.src);
          if (p.crit) emit(g, 'crit', { x: tg.x, y: tg.y, en: tg, tw: p.src && p.src.tw }); else emit(g, 'hit', { en: tg, x: tg.x, y: tg.y - tg.size * 0.4, k: 'arrow', tw: p.src && p.src.tw, el: p.el });
          arrowAfter(g, p, tg);
        }
        else emit(g, 'miss', { x: p.tx, y: p.ty, ang: Math.atan2(p.ty - p.sy, p.tx - p.sx) });
      }
    } else if (p.kind === 'stone' || p.kind === 'flask' || p.kind === 'frag') {
      var u2 = Math.min(1, p.t / p.T);
      p.x = lerp(p.sx, p.tx, u2); p.y = lerp(p.sy, p.ty, u2); p.u = u2;
      if (u2 >= 1) {
        done = true;
        var st = p.st;
        if (p.kind === 'frag') {
          splashAt(g, p.tx, p.ty, 0.42, p.dmg, 'expl', p.src, st, false);
          if (p.fire) g.zones.push({ kind: 'fire', x: p.tx, y: p.ty, r: 0.4, t: 2, T: 2, dps: p.dmg * 0.5, src: p.src });
          emit(g, 'fragHit', { x: p.tx, y: p.ty, el: p.el, fire: !!p.fire });
        } else if (p.kind === 'stone') {
          splashAt(g, p.tx, p.ty, st.splash, p.dmg, 'expl', p.src, st, false);
          if (p.tgt && p.tgt.alive && d2(p.tgt.x, p.tgt.y, p.tx, p.ty) < 0.6) hurtObs(g, p.tgt, p.dmg);
          if (st.zoneDps) g.zones.push({ kind: 'fire', x: p.tx, y: p.ty, r: st.splash * 0.75, t: st.zoneT, T: st.zoneT, dps: st.zoneDps, src: p.src });
          blastExtras(g, p, p.tx, p.ty, 'catapult');
          emit(g, 'boom', { x: p.tx, y: p.ty, r: st.splash, k: 'stone', fire: !!st.zoneDps, big: st.stun ? 1 : 0, lvl: p.lvl, el: p.el });
        } else {
          splashAt(g, p.tx, p.ty, 0.45, p.dmg, 'magic', p.src, st, false);
          if (p.tgt && p.tgt.alive && d2(p.tgt.x, p.tgt.y, p.tx, p.ty) < 0.6) hurtObs(g, p.tgt, p.dmg * 2);
          g.zones.push({ kind: 'poison', x: p.tx, y: p.ty, r: st.cloudR, t: st.cloudT, T: st.cloudT, dps: st.poison, shred: st.shred, plague: st.plague || 0, src: p.src, br: p.br, slow: cmbOn(g, 'alchemy', 'bog') ? 0.3 : 0 });
          emit(g, 'splat', { x: p.tx, y: p.ty, r: st.cloudR, br: p.br, lvl: p.lvl, el: p.el });
        }
      }
    } else if (p.kind === 'orb' || p.kind === 'shell') {
      var tg3 = p.tgt, alive = tg3 && (tg3.kind === 'obs' ? tg3.alive : !tg3.dead && !tg3.untarget);
      if (alive) { p.tx = tg3.x; p.ty = tg3.y - (tg3.kind === 'obs' ? 0.25 : tg3.fly ? 0.65 : tg3.size * 0.45); }
      var dx = p.tx - p.x, dy = p.ty - p.y, L = Math.hypot(dx, dy), step = p.sp * dt;
      p.ang = Math.atan2(dy, dx);
      if (L <= step || L < 0.08) {
        done = true;
        if (p.kind === 'orb') {
          if (alive) {
            if (tg3.kind === 'obs') hurtObs(g, tg3, p.dmg);
            else {
              hurt(g, tg3, p.dmg, 'magic', p.src, false, { single: 1, fx: p.ox, fy: p.oy });
              var ost = p.st || {};
              if (!tg3.dead && ost.mark) { tg3.markT = 3; tg3.markA = Math.max(tg3.markA, ost.mark); }
              elHit(g, ost, tg3, p.dmg, p.src);
              // [카드] 연쇄 +1 (조합 '천둥 사슬'이면 기절)
              if (ost.ochain) { var sk = {}; sk[tg3.id] = 1; var nn = nearEnemies(g, tg3.x, tg3.y, 1.8, ost.ochain, sk, true), pts2 = [[tg3.x, tg3.y - tg3.size * 0.5]], ts = cmbOn(g, 'arcane', 'thunderChain') ? 0.3 : 0;
                nn.forEach(function (o) { pts2.push([o.x, o.y - (o.fly ? 0.7 : o.size * 0.5)]); hurt(g, o, p.dmg * 0.6, 'magic', p.src); if (!o.dead) { if (ts) stunE(o, ts); if (ost.mark) { o.markT = 3; o.markA = Math.max(o.markA, ost.mark); } } });
                if (nn.length) emit(g, 'zap', { pts: pts2, lvl: 2, el: p.el || 'magic' }); }
            }
          }
          emit(g, 'orbHit', { x: p.tx, y: p.ty, lvl: p.lvl, el: p.el });
        } else {
          var gx = alive && tg3.kind !== 'obs' ? tg3.x : p.tx, gy = alive && tg3.kind !== 'obs' ? tg3.y : p.ty;
          splashAt(g, gx, gy, p.st.splash, p.dmg, 'expl', p.src, p.st, false);
          if (alive && tg3.kind === 'obs') hurtObs(g, tg3, p.dmg);
          blastExtras(g, p, gx, gy, 'cannon');
          emit(g, 'boom', { x: gx, y: gy, r: p.st.splash, k: 'shell', big: p.br === 0 && p.lvl >= 4 ? 1 : 0, lvl: p.lvl, el: p.el });
        }
      } else { p.x += dx / L * step; p.y += dy / L * step; }
      if (p.t > 3) done = true;
    } else if (p.kind === 'bolt') {
      var stp = 13 * dt, n = 3;
      for (var s = 0; s < n && !done; s++) {
        p.x += p.vx * dt / n; p.y += p.vy * dt / n; p.left -= stp / n;
        var gy2 = p.y + 0.35;
        for (var k = 0; k < g.enemies.length; k++) {
          var e = g.enemies[k];
          if (e.dead || e.untarget || p.hit[e.id]) continue;
          var ey = e.fly ? e.y - 0.0 : e.y;
          var rr = 0.26 + e.size * 0.22;
          if (d2(e.x, ey, p.x, gy2) > rr * rr) continue;
          p.hit[e.id] = 1; hurt(g, e, p.dmg * (p.st.airX && e.fly ? p.st.airX : 1) * (p.st.bossX && e.boss ? p.st.bossX : 1), 'phys', p.src);
          if (!e.dead) {
            if (p.st.shred) { e.shredA = Math.max(e.shredA, p.st.shred); e.shredT = Math.max(e.shredT, p.st.shredT); }
            if (p.st.knockD && !e.boss && !e.fly) knockE(e, p.st.knockD);
            if (cmbOn(g, 'ballista', 'iceLance')) freezeE(e, 0.6, 0.15);
            elHit(g, p.st, e, p.dmg, p.src);
          }
          emit(g, 'hit', { en: e, x: e.x, y: e.y - e.size * 0.4, k: 'bolt', tw: p.src && p.src.tw, el: p.el });
          p.pierce--; if (p.pierce <= 0) { done = true; break; }
        }
        if (p.tgtObs && p.tgtObs.alive && d2(p.tgtObs.x, p.tgtObs.y, p.x, gy2) < 0.2) { hurtObs(g, p.tgtObs, p.dmg); done = true; }
        if (p.left <= 0 || p.x < -2 || p.x > g.cols + 2 || p.y < -3 || p.y > g.rows + 2) done = true;
      }
    } else if (p.kind === 'dart') {
      var n2 = 2, ds = Math.hypot(p.vx, p.vy) * dt / n2;
      for (var s2 = 0; s2 < n2 && !done; s2++) {
        p.x += p.vx * dt / n2; p.y += p.vy * dt / n2; p.left -= ds;
        for (var k2 = 0; k2 < g.enemies.length; k2++) {
          var e5 = g.enemies[k2];
          if (e5.dead || e5.untarget || p.hit[e5.id] || (e5.fly && !p.air) || (e5.stealth && !e5.revealed)) continue;
          var r5 = 0.22 + e5.size * 0.22;
          if (d2(e5.x, e5.y, p.x, p.y) > r5 * r5) continue;
          p.hit[e5.id] = 1;
          hurt(g, e5, p.dmg, p.dk, p.src, false, { single: p.single, fx: p.x - p.vx * 0.08, fy: p.y - p.vy * 0.08 });
          if (!e5.dead) { if (p.shard) slowE(e5, 0.3, 1.2); elHit(g, p.st, e5, p.dmg, p.src); }
          if (p.fireLine && !e5.fly) g.zones.push({ kind: 'fire', x: e5.x, y: e5.y, r: 0.45, t: 2, T: 2, dps: p.dmg * 0.35, src: p.src, line: 1 });
          if (p.burst) {   // 조합 '얼음 폭발'
            for (var q2 = 0; q2 < g.enemies.length; q2++) { var o3 = g.enemies[q2]; if (o3.dead || o3 === e5 || d2(o3.x, o3.y, e5.x, e5.y) > 0.64) continue; hurt(g, o3, p.dmg * 0.5, p.dk, p.src, true); if (!o3.dead) { slowE(o3, 0.5, 1.5); if (g.rnd() < 0.3) freezeE(o3, 0.8, 0.2); } }
            emit(g, 'iceBurst', { x: e5.x, y: e5.y });
          }
          emit(g, 'hit', { en: e5, x: e5.x, y: e5.y - e5.size * 0.4, k: p.shard ? 'shard' : 'dart', tw: p.src && p.src.tw, el: p.el });
          p.dmg *= 0.7;
          p.pierce--; if (p.pierce <= 0) { done = true; break; }
        }
        if (p.left <= 0 || p.x < -1 || p.x > g.cols + 1 || p.y < -2 || p.y > g.rows + 1) done = true;
      }
    }
    if (!done) keep.push(p);
  }
  // 이번 걸음에 새로 생긴 탄(관통 이어 날기, 튕김, 파편)도 남김
  for (var j = n0; j < g.proj.length; j++) keep.push(g.proj[j]);
  g.proj = keep;
}
// 화살이 맞은 뒤: 관통샷(이어 날기), 튕기는 화살(조합 '번개 튕김')
function arrowAfter(g, p, tg) {
  if (p.pierce > 0) {
    var a = Math.atan2(p.ty - p.sy, p.tx - p.sx), hit = {}; hit[tg.id] = 1;
    pushDart(g, { x: tg.x, y: tg.y, ang: a, sp: 10, left: 2.6, pierce: p.pierce, hit: hit, dmg: p.dmg * 0.7, dk: 'phys', src: p.src, st: p.st, single: 0, el: p.el, fireLine: cmbOn(g, 'archer', 'fireLine'), h: 0.5 });
  }
  if (p.bounce > 0 && g.proj.length < PROJ_CAP) {
    var sk = {}; sk[tg.id] = 1; if (p.from) sk[p.from] = 1;
    var nx = nearEnemies(g, tg.x, tg.y, 2.2, 1, sk, true)[0];
    if (nx) {
      var dist = hyp(tg.x, tg.y, nx.x, nx.y);
      g.proj.push({ kind: 'arrow', sx: tg.x, sy: tg.y, h0: 0.45, x: tg.x, y: tg.y, tx: nx.x, ty: nx.y, tgt: nx, t: 0, T: 0.08 + dist / 9, h: 0.15 + dist * 0.06, dmg: p.dmg * 0.6, dt: 'phys', src: p.src, crit: false, pierce: 0, bounce: p.bounce - 1, el: p.el, st: p.st, bounced: 1, from: tg.id, zs: 0.45 });
      if (cmbOn(g, 'archer', 'thunderBounce')) zapFrom(g, tg, 2, p.dmg * 0.5, p.src);
      emit(g, 'bounce', { x: tg.x, y: tg.y });
    }
  }
}
function updateZones(g, dt) {
  var keep = [];
  for (var i = 0; i < g.zones.length; i++) {
    var z = g.zones[i];
    z.t -= dt;
    if (z.kind === 'sk2ice') { if (z.t > 0) keep.push(z); continue; }   // v2.2 얼음 폭풍: 효과는 sk2Tick
    if (z.kind === 'rain') {
      while (z.q.length && z.q[0].at <= z.T - z.t) {
        var a = z.q.shift();
        for (var k = 0; k < g.enemies.length; k++) { var e = g.enemies[k]; if (e.dead || e.untarget) continue; if (d2(e.x, e.y, a.x, a.y) < 0.36 * 0.36 + e.size * 0.1) hurt(g, e, z.dmg, 'phys', SK_SRC.rain); }
        emit(g, 'rainHit', { x: a.x, y: a.y });
      }
    } else {
      for (var j = 0; j < g.enemies.length; j++) {
        var e2 = g.enemies[j]; if (e2.dead || e2.fly) continue;
        if (d2(e2.x, e2.y, z.x, z.y) > z.r * z.r) continue;
        if (z.kind === 'fire') burnE(e2, z.dps, 0.6);
        else { poisonE(e2, z.dps, 1.0, z.shred); if (z.plague) e2.plague = 1; if (z.slow) slowE(e2, z.slow, 0.4); }
      }
    }
    if (z.t > 0) keep.push(z);
  }
  g.zones = keep;
}

// ---------- 적 이동과 능력 ----------
function updateEnemies(g, dt) {
  // 숨은 적 드러내기
  var bells = g.towers.filter(function (t) { return tfBellK(t.k) && t.frozenT <= 0; });
  if (typeof en2Step === 'function') en2Step(g, dt);   // v2.0 적 능력 공통(탑 방해 시간, 예고 중인 공격): logic_enemies2.js
  for (var i = 0; i < g.enemies.length; i++) {
    var e = g.enemies[i];
    if (e.dead) continue;
    e.age += dt; if (e.hitT > 0) e.hitT -= dt;
    if (e.cfxT > 0) e.cfxT -= dt; if (e.wallCd > 0) e.wallCd -= dt;
    if (e.markT > 0) { e.markT -= dt; if (e.markT <= 0) e.markA = 0; }
    if (e.E.iceArmor && !e.iceArm) { e.meltT -= dt; if (e.meltT <= 0) { e.iceArm = 1; emit(g, 'refreeze', { en: e, x: e.x, y: e.y }); } }
    if (e.twin) { e.twinT -= dt; if (e.twinT <= 0) { e.twinT = e.E.twin.cd; e.twin = e.twin === 'fire' ? 'ice' : 'fire'; emit(g, 'twinSwap', { en: e, x: e.x, y: e.y, st: e.twin }); } }
    if (e.stealth) { e.revealed = 0; for (var b = 0; b < bells.length; b++) if (inR(bells[b], e.x, e.y, bells[b].st.reveal)) { e.revealed = 1; break; }
      if (!e.revealed && !e.E.hide) for (var tq = 0; tq < g.towers.length; tq++) { var TQ = g.towers[tq]; if (d2(TQ.x, TQ.y, e.x, e.y) < STEALTH_NEAR * STEALTH_NEAR) { e.revealed = 1; e.nearRev = 1; break; } } }   // v2.2: 탑 바로 곁(STEALTH_NEAR칸)을 지나는 숨은 적은 모든 탑에게 드러남. 숨어 다니는 귀신(E.hide)은 빼고(성문 가까이에서 스스로 드러나는 제 규칙)
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowF = 0; }
    if (e.stunT > 0) { e.stunT -= dt; if (e.stunT <= 0) e.frozen = 0; }
    if (e.ccS > 0) e.ccS = Math.max(0, e.ccS - CC_STUN_DECAY * dt);
    if (e.ccK > 0) e.ccK = Math.max(0, e.ccK - CC_KB_DECAY * dt);
    if (e.shredT > 0) { e.shredT -= dt; if (e.shredT <= 0) e.shredA = 0; }
    if (e.buffSpdT > 0) e.buffSpdT -= dt;
    if (e.burnT > 0) { e.burnT -= dt; hurt(g, e, e.burnDps * dt, 'magic', null, true, { el: 'fire' }); if (e.burnT <= 0) e.burnDps = 0; if (e.dead) continue; }
    if (e.poisonT > 0) { e.poisonT -= dt; hurt(g, e, e.poisonDps * dt, 'magic', null, true, { el: 'poison' }); if (e.poisonT <= 0) { e.poisonDps = 0; e.plague = 0; } if (e.dead) continue; }
    if (e.E.regen && e.burnT <= 0 && e.poisonT <= 0 && !(e.E.regenCool && e.slowT > 0)) e.hp = Math.min(e.mhp, e.hp + e.mhp * e.E.regen * dt);
    if (e.reviveT > 0) { e.reviveT -= dt; if (e.reviveT <= 0) { e.untarget = 0; emit(g, 'revive', { x: e.x, y: e.y, id: e.id }); } continue; }
    if (typeof en2Common === 'function') en2Common(g, e, dt);   // v2.0 공통 상태: 봉인(sealT), 공포(fearT) 시간, 속도 배수(spdK), 조명 탑의 드러내기
    if (!(e.sealT > 0)) abilities(g, e, dt);   // 봉인된 동안에는 능력 정지
    var AB = EN_AB[e.k]; if (AB && AB.tick) { AB.tick(g, e, dt); if (e.dead) continue; }   // 등록 고리: 적 능력
    if (e.kneel) continue;
    // 이동
    var sp = e.spd * (1 - e.slowF) * (1 + (e.buffSpdT > 0 ? e.buffSpd : 0)) * (e.dom === 'g' ? g.iceMod : 1) * (e.spdK == null ? 1 : e.spdK);
    if (e.stunT > 0) sp = 0;
    var nd = e.d + sp * dt;
    e.blocked = null;
    if (e.dom === 'g') for (var w = 0; w < g.bars.length; w++) {   // 방책은 땅 적만 막음
      var br = g.bars[w], bd = br.d[e.pi];
      if (bd == null || br.hp <= 0) continue;
      if (e.d <= bd && nd >= bd - 0.28) {
        if (e.E.leap && !(e.sealT > 0)) { if (!(e.hopT > 0)) emit(g, 'leap', { en: e, x: e.x, y: e.y, over: 'wall' }); e.hopT = 0.45; continue; }   // 뛰어넘는 적(구울, 창귀 호랑이)은 방책을 넘는다. 봉인되면 못 넘음
        nd = Math.max(e.d, bd - 0.28); e.blocked = br; br.hp -= (e.boss ? 260 : 6 + e.mhp * 0.025) * (e.E.smash || 1) * dt; hurt(g, e, br.thorn * dt, 'phys', SK_SRC.wall, true);
        if (e.E.wallStun && e.wallCd <= 0 && !e.dead) { stunE(e, 1, true); e.wallCd = 2.5; emit(g, 'bonk', { en: e, x: e.x, y: e.y }); }
      }
    }
    if (e.dead) continue;
    if (e.dom === 'g' && g.units.length && typeof en2Block === 'function') nd = en2Block(g, e, nd, dt);   // 막는 유닛(u.block, 병사): 방책처럼 땅 적을 세운다. 뛰어넘는 적은 지나감
    e.d = nd;
    if (e.d >= e.P.len) { leak(g, e); continue; }
    placeEnemy(e);
  }
  g.enemies = g.enemies.filter(function (e) { return !e.dead; });
}
function abilities(g, e, dt) {
  var E = e.E;
  if (!(E.heal || E.ward || E.warcry || E.brood || E.frostNova || E.summon || e.k === 'barkan')) return;
  e.abilT -= dt;
  if (e.stunT > 0) return;
  if (e.abilT > 0) return;
  if (E.heal) {
    e.abilT = E.heal.cd; var n = 0;
    g.enemies.forEach(function (o) { if (!o.dead && o.hp < o.mhp && !o.boss && d2(o.x, o.y, e.x, e.y) < E.heal.r * E.heal.r) { o.hp = Math.min(o.mhp, o.hp + o.mhp * E.heal.pct); n++; } });
    if (n) emit(g, 'heal', { x: e.x, y: e.y, r: E.heal.r });
  } else if (E.ward) {
    e.abilT = E.ward.cd;
    var near = g.enemies.filter(function (o) { return !o.dead && !o.boss && o.shield <= 0 && d2(o.x, o.y, e.x, e.y) < E.ward.r * E.ward.r; });
    near.sort(function (a, b) { return d2(a.x, a.y, e.x, e.y) - d2(b.x, b.y, e.x, e.y); });
    near.slice(0, E.ward.n).forEach(function (o) { o.shield = o.mhp * E.ward.pct; });
    if (near.length) emit(g, 'ward', { x: e.x, y: e.y, r: E.ward.r });
  } else if (E.warcry) {
    e.abilT = E.warcry.cd;
    g.enemies.forEach(function (o) { if (!o.dead && d2(o.x, o.y, e.x, e.y) < E.warcry.r * E.warcry.r) { o.buffSpd = E.warcry.spd; o.buffSpdT = E.warcry.dur; } });
    emit(g, 'roar', { x: e.x, y: e.y, r: E.warcry.r, k: e.k });
  } else if (E.brood) {
    e.abilT = E.brood.cd;
    for (var i = 0; i < E.brood.n; i++) spawnEnemy(g, E.brood.type, e.pi, Math.max(0, e.d - 0.3 - i * 0.18), { off: (g.rnd() - 0.5) * 0.36 });
    emit(g, 'brood', { x: e.x, y: e.y });
  } else if (E.frostNova) {
    e.abilT = E.frostNova.cd; var hit = 0;
    g.towers.forEach(function (t) { if (t.k !== 'frost' && d2(t.x, t.y, e.x, e.y) < E.frostNova.r * E.frostNova.r) { t.frozenT = E.frostNova.dur; hit++; } });
    emit(g, 'nova', { x: e.x, y: e.y, r: E.frostNova.r, n: hit });
  } else if (E.twin) {
    // 쌍둥이 왕: 지금 모습의 졸개를 부름(불이면 불씨 도깨비, 얼음이면 얼음 젤리)
    e.abilT = E.summon.cd;
    var ty = e.twin === 'fire' ? 'ember' : 'iceslime';
    for (var j2 = 0; j2 < E.summon.n; j2++) spawnEnemy(g, ty, e.pi, Math.max(0, e.d - 0.5 - j2 * 0.3), { off: j2 ? 0.15 : -0.15 });
    emit(g, 'summon', { x: e.x, y: e.y, twin: e.twin });
  } else if (e.k === 'barkan') {
    e.abilT = E.summon.cd;
    for (var j = 0; j < E.summon.n; j++) spawnEnemy(g, E.summon.type, e.pi, Math.max(0, e.d - 0.5 - j * 0.3), { off: j ? 0.15 : -0.15 });
    emit(g, 'summon', { x: e.x, y: e.y });
    if (e.hp < e.mhp * 0.6) { e.shield = Math.max(e.shield, e.mhp * 0.08); emit(g, 'ward', { x: e.x, y: e.y, r: 1.2, boss: 1 }); }
  }
}
function leak(g, e) {
  e.dead = 1;
  g.lives = Math.max(0, g.lives - e.leak); g.stats.leaks += e.leak;
  g.gate.hitT = 0.4;
  if (g.boss === e) g.boss = null;
  if (g.focus && g.focus.e === e) g.focus = null;
  emit(g, 'leak', { x: g.gate.x, y: g.gate.y, n: e.leak, k: e.k, dom: e.dom, ex: e.x, ey: e.y });
  if (g.lives <= 0 && !g.over) { g.over = -1; emit(g, 'lose', {}); }
}

// ---------- 웨이브 ----------
function waveAt(g, i) {
  if (g.D.endless) { while (g.waves.length <= i) g.waves.push(g.D.arena ? arWave(g, g.waves.length) : endlessWave(g.mi, g.waves.length, g.wrnd)); }
  return g.waves[i];
}
function startWave(g) {
  if (g.wave >= g.N || g.over || g.pickWait) return;
  var W = waveAt(g, g.wave), t0 = g.t, end = 0;
  g.wave++; g.waiting = false; g.clearT = 0;
  W.groups.forEach(function (gr) {
    for (var k = 0; k < gr.n; k++) { var at = t0 + gr.delay + k * gr.gap; g.spawnQ.push({ at: at, type: gr.type, path: gr.path }); end = Math.max(end, at - t0); }   // 길 번호는 spawnEnemy가 그 적 영역의 길 목록에 맞춤
  });
  g.spawnQ.sort(function (a, b) { return a.at - b.at; });
  // 조폐소
  g.lastMint = 0;
  g.towers.forEach(function (t) {
    if (t.k !== 'mint' || g.wave === 1) return;
    var gv = t.st.gold; if (t.st.interest) gv += Math.min(t.st.cap, Math.floor(g.gold * t.st.interest));
    if (t.st.int2) gv += Math.min(40, Math.floor(g.gold * t.st.int2));
    g.gold += gv; g.stats.goldEarned += gv; g.lastMint += gv; emit(g, 'mint', { x: t.x, y: t.y, v: gv });
  });
  if (g.wave < g.N) { g.nextMax = end + (g.wave <= 2 ? 14 : 11); g.nextT = g.nextMax; } else g.nextT = 0;
  var RLw = g.rule && RULES[g.rule.id]; if (RLw && RLw.wave) RLw.wave(g, W, g.wave);
  emit(g, 'wave', { i: g.wave, n: g.N, kind: W.kind, boss: W.groups.some(function (x) { return x.boss; }) });
}
// 일찍 부르면 남은 시간만큼 금화. 시간이 다 지난 뒤에 누르면 보너스 없이 바로 시작
function earlyBonus(g) { return g.nextT > 0 ? Math.floor(g.nextT * (1.6 + g.wave * 0.25) * (1 + g.R.earlyMul)) : 0; }
// 다음 웨이브: 시간이 다 돼도 적이 남아 있으면 밀어 넣지 않는다 (가족 피드백 11-04)
// 기본은 [다음 웨이브]를 누를 때 시작, 자동 시작을 켜면 적을 다 잡고 AUTO_GAP초 뒤
// [v1.3] 3웨이브를 막을 때마다(마지막 웨이브 전까지) 정리된 순간 능력 카드 'pick'. 고를 때까지(g.pickWait) 다음 웨이브는 안 옴
var AUTO_GAP = 3;
function fieldClear(g) {
  if (g.spawnQ.length) return false;
  for (var i = 0; i < g.enemies.length; i++) if (!g.enemies[i].dead) return false;
  return true;
}
function pickDue(g) { return g.cardsOn && g.wave > 0 && g.wave % 3 === 0 && g.wave < g.N && !g.pickAt[g.wave] && !g.over; }
function waveFlow(g, dt) {
  if (g.waiting || g.wave >= g.N) return;
  if (g.nextT > 0 && !g.pickWait) g.nextT = Math.max(0, g.nextT - dt);
  if (!fieldClear(g)) { g.clearT = 0; return; }
  if (!g.clearT) { emit(g, 'clear', { auto: !!g.autoWave, i: g.wave }); if (pickDue(g)) { g.pickAt[g.wave] = 1; abilityOffer(g, false); } }
  if (g.pickWait) { g.clearT = 1e-4; return; }
  g.clearT += dt;
  if (g.autoWave && g.nextT <= 0 && g.clearT >= AUTO_GAP) startWave(g);
}
function callEarly(g) {
  if (g.over || g.pickWait) return 0;
  if (g.waiting) { startWave(g); return 0; }
  if (g.wave >= g.N) return 0;
  var bonus = earlyBonus(g);
  g.gold += bonus; g.stats.goldEarned += bonus;
  emit(g, 'early', { v: bonus });
  startWave(g);
  return bonus;
}
function nextWaveInfo(g) {
  if (g.wave >= g.N) return null;
  var W = waveAt(g, g.wave), types = {};
  W.groups.forEach(function (gr) { types[gr.type] = (types[gr.type] || 0) + gr.n; });
  return { i: g.wave + 1, types: types, kind: W.kind };
}

// ---------- 능력 카드 (v1.3) ----------
// 이 판의 적이 약한 속성(위협 비중) { fire: 0.3, ... }
function mapWeakEl(g) {
  var M = g.M, ks = M.pool.concat(M.boss ? [M.boss] : []), tot = 0, W = {}, fimm = 0, mref = 0;
  ks.forEach(function (k) { tot += threatOf(k); });
  ks.forEach(function (k) { var E = ENEMIES[k], w = threatOf(k) / tot; (E.weakEl || []).forEach(function (el) { W[el] = (W[el] || 0) + w; }); if (E.fireImm) fimm += w; if (E.magRef) mref += w; });
  W._fimm = fimm; W._mref = mref;
  return W;
}
function cardTowerKinds(g, start) {
  var k = [];
  g.towers.forEach(function (t) { if (k.indexOf(t.k) < 0) k.push(t.k); });
  if (start || !k.length) k = (g.towersOk || TOWER_ORDER).slice();
  return k;
}
function cardHasPart(g, tk, part) { return part.indexOf('el:') === 0 ? g.attr[tk] === part.slice(3) : cardLv(g, tk, part) > 0; }
function partName(part) { return part.indexOf('el:') === 0 ? ELEMS[part.slice(3)].name + ' 속성' : CARD_DEFS[part].name; }
// 이 카드(탑 tk의 part)가 낄 수 있는 조합들
function comboHints(g, tk, part) {
  var out = [];
  COMBOS.forEach(function (c) {
    if (c.towers.indexOf(tk) < 0) return;
    var other = c.a === part ? c.b : c.b === part ? c.a : null; if (!other) return;
    out.push({ id: c.id, name: c.name, desc: c.desc, with: partName(other), has: cardHasPart(g, tk, other) ? 1 : 0 });
  });
  return out;
}
function cardMake(g, tk, base, el) {
  if (el) {
    var EC = EL_CARD[el];
    return { id: tk + ':el:' + el, kind: 'el', tower: tk, el: el, base: 'el:' + el, name: EC.name.replace('{s}', TOWERS[tk].name), desc: EC.desc, rare: 1, lv: 1, max: 1, combo: comboHints(g, tk, 'el:' + el) };
  }
  var D = CARD_DEFS[base], lv = cardLv(g, tk, base);
  return { id: tk ? tk + ':' + base : base, kind: 'buff', tower: tk || null, el: null, base: base, name: D.name, desc: D.desc, rare: D.rare || 0, lv: lv + 1, max: D.max, combo: tk ? comboHints(g, tk, base) : [] };
}
// 3장 뽑기: 판 시드 + 몇 번째 뽑기 기반(같은 판, 같은 상황이면 같은 카드). 3장 중 최소 1장은 지은 탑 전용
function abilityRoll(g, start) {
  var rnd = rngOf((hashStr(g.M.id + ':' + g.dk + ':card' + g.pickN) ^ 0x2f6b5) >>> 0), C = [];
  var kinds = cardTowerKinds(g, start), W = mapWeakEl(g), rw = [1, 0.65, 0.35];
  kinds.forEach(function (tk) {
    for (var b in CARD_DEFS) {
      var D = CARD_DEFS[b]; if (!D.towers || D.towers.indexOf(tk) < 0) continue;
      if (cardLv(g, tk, b) >= D.max) continue;
      var w = 3 * rw[D.rare || 0];
      if (comboHints(g, tk, b).some(function (h) { return h.has; })) w *= 2.5;   // 가진 카드의 조합 짝
      C.push({ w: w, tk: tk, base: b, own: 1 });
    }
    if (tk !== 'mint' && !tfBellK(tk) && !(typeof TW_NOEL !== 'undefined' && TW_NOEL[tk])) EL_ORDER.forEach(function (el) {
      if (EL_NATURAL[tk] === el || g.attr[tk] === el) return;
      var w = 1.5 * (1 + 4 * (W[el] || 0));
      if (el === 'fire') w *= 1 - 0.6 * W._fimm;
      if (comboHints(g, tk, 'el:' + el).some(function (h) { return h.has; })) w *= 2.5;
      C.push({ w: w, tk: tk, el: el, own: 1 });
    });
  });
  for (var b2 in CARD_DEFS) {
    var D2 = CARD_DEFS[b2]; if (D2.towers || (g.buffs[b2] || 0) >= D2.max) continue;
    var w2 = 1.6 * rw[D2.rare || 0];
    if (b2 === 'g_boss' && !g.M.boss) w2 *= 0.25;
    if (b2 === 'g_life' && g.lives >= g.maxLives) w2 *= 0.6;
    if (b2 === 'g_gold' && g.wave > g.N * 0.6) w2 *= 0.3;
    C.push({ w: w2, base: b2, own: 0 });
  }
  var out = [];
  function take(list) { var s = 0; list.forEach(function (c) { s += c.w; }); if (s <= 0) return null; var r = rnd() * s; for (var i = 0; i < list.length; i++) { r -= list[i].w; if (r <= 0) return list[i]; } return list[list.length - 1]; }
  var own = C.filter(function (c) { return c.own; });
  var first = take(own.length ? own : C);
  if (first) { out.push(first); C.splice(C.indexOf(first), 1); }
  while (out.length < 3 && C.length) { var c = take(C); if (!c) break; out.push(c); C.splice(C.indexOf(c), 1); }
  // 섞어서 전용 카드가 늘 첫 자리에 오지 않게
  for (var i = out.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), tmp = out[i]; out[i] = out[j]; out[j] = tmp; }
  return out.map(function (c) { return cardMake(g, c.tk || null, c.base || null, c.el || null); });
}
function abilityOffer(g, start) {
  var cards = abilityRoll(g, start); if (!cards.length) return false;
  g.pickCards = cards; g.pickWait = true; g.pickStart = !!start; g.pickSeq++;
  emit(g, 'pick', { cards: cards, start: !!start, seq: g.pickSeq });
  return true;
}
// 조합 다시 셈. quiet이면 알리지 않음(복원)
function comboRecalc(g, quiet) {
  g.cmb = {};
  COMBOS.forEach(function (c) {
    c.towers.forEach(function (tk) {
      if (!cardHasPart(g, tk, c.a) || !cardHasPart(g, tk, c.b)) return;
      (g.cmb[tk] || (g.cmb[tk] = {}))[c.id] = 1;
      var key = tk + ':' + c.id;
      if (!g.combos[key]) { g.combos[key] = 1; if (!quiet) emit(g, 'combo', { tower: tk, id: c.id, name: c.name, desc: c.desc }); }
    });
  });
}
// 화면이 고른 카드 id로 부름 → 적용, pickWait 풀림
function abilityPick(g, id) {
  if (!g.pickWait || !g.pickCards) return false;
  var card = null; g.pickCards.forEach(function (c) { if (c.id === id) card = c; });
  if (!card) return false;
  if (card.kind === 'el') g.attr[card.tower] = card.el;
  else if (card.tower) { var B = g.build[card.tower] || (g.build[card.tower] = {}); B[card.base] = Math.min(CARD_DEFS[card.base].max, (B[card.base] || 0) + 1); }
  else {
    g.buffs[card.base] = Math.min(CARD_DEFS[card.base].max, (g.buffs[card.base] || 0) + 1);
    if (card.base === 'g_life') { g.lives += 3; g.maxLives += 3; }
  }
  g.pickWait = false; g.pickCards = null; g.pickN++;
  if (g.clearT > 0) g.clearT = 1e-4;   // 자동 시작이면 고른 뒤 AUTO_GAP초
  refreshStats(g); comboRecalc(g, false);
  emit(g, 'picked', { card: card });
  return true;
}
// 저장(웨이브마다 이어하기): ui.js snapMid의 SAVE.mid.ab = abilitySnap(g), applyMid에서 abilityRestore(g, m.ab)
function abilitySnap(g) {
  var b = {}; for (var k in g.build) { b[k] = {}; for (var c in g.build[k]) b[k][c] = g.build[k][c]; }
  var a = {}; for (var k2 in g.attr) a[k2] = g.attr[k2];
  var f = {}; for (var k3 in g.buffs) f[k3] = g.buffs[k3];
  var cb = {}; for (var k4 in g.combos) cb[k4] = 1;
  var pa = []; for (var w in g.pickAt) pa.push(+w);
  return { attr: a, build: b, buffs: f, combos: cb, n: g.pickN, at: pa };
}
function abilityRestore(g, s) {
  if (!s) return false;
  g.attr = {}; for (var k in s.attr || {}) if (ELEMS[s.attr[k]] && TOWERS[k]) g.attr[k] = s.attr[k];
  g.build = {}; for (var t in s.build || {}) { if (!TOWERS[t]) continue; g.build[t] = {}; for (var c in s.build[t]) if (CARD_DEFS[c]) g.build[t][c] = Math.min(CARD_DEFS[c].max, s.build[t][c] | 0); }
  g.buffs = {}; for (var f in s.buffs || {}) if (CARD_DEFS[f]) g.buffs[f] = Math.min(CARD_DEFS[f].max, s.buffs[f] | 0);
  g.combos = {}; for (var cb in s.combos || {}) g.combos[cb] = 1;
  g.pickAt = {}; (s.at || []).forEach(function (w) { g.pickAt[w] = 1; });
  g.pickN = s.n | 0; g.pickWait = false; g.pickCards = null;
  g.maxLives = g.D.lives + g.R.lives + 3 * (g.buffs.g_life || 0); g.lives = Math.min(g.lives, g.maxLives);
  refreshStats(g); comboRecalc(g, true);
  return true;
}

// ---------- 스킬 ----------
function skillCd(g, k) { var S = SKILLS[k], R = g.R; return S.cd * (1 + (k === 'rain' ? R.rainCd : k === 'last' ? R.lastCd : 0)); }
function castRain(g, x, y) {
  var s = g.sk.rain; if (s.cd > 0 || !g.unlockedSkills.rain) return false;
  s.cd = skillCd(g, 'rain');
  var n = Math.round(36 * (1 + g.R.rainN)), q = [], T = 1.3;
  for (var i = 0; i < n; i++) { var a = g.rnd() * Math.PI * 2, r = Math.sqrt(g.rnd()) * 1.45; q.push({ at: 0.25 + g.rnd() * 1.0, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r }); }
  q.sort(function (a, b) { return a.at - b.at; });
  g.zones.push({ kind: 'rain', x: x, y: y, r: 1.5, t: T + 0.1, T: T + 0.1, q: q, dmg: 22 * (1 + 0.1 * g.wave) });
  emit(g, 'rain', { x: x, y: y, q: q.map(function (a) { return { at: a.at, x: a.x, y: a.y }; }) });
  return true;
}
function nearestPath(g, x, y) {
  var best = null, bd = 0.75 * 0.75;
  g.paths.forEach(function (p, pi) { for (var s = 0; s < p.n; s += 2) { var dd = d2(p.xs[s], p.ys[s], x, y); if (dd < bd) { bd = dd; best = { pi: pi, d: s * PSTEP, x: p.xs[s], y: p.ys[s] }; } } });
  return best;
}
function castWall(g, x, y) {
  var s = g.sk.wall; if (s.cd > 0 || !g.unlockedSkills.wall) return false;
  var np = nearestPath(g, x, y); if (!np) return false;
  if (np.y < 0 || np.y > g.rows) return false;
  s.cd = skillCd(g, 'wall');
  var hp = 340 * (1 + 0.12 * g.wave) * (1 + g.R.barHp);
  var b = { x: np.x, y: np.y, hp: hp, mhp: hp, t: 14, thorn: 14 * (1 + 0.1 * g.wave) * (1 + g.R.barThorn), d: [] };
  g.paths.forEach(function (p, pi) {
    var bd = null, best = 0.3 * 0.3;
    for (var k = 0; k < p.n; k++) { var dd = d2(p.xs[k], p.ys[k], np.x, np.y); if (dd < best) { best = dd; bd = k * PSTEP; } }
    b.d[pi] = bd;
  });
  pathAt(g.paths[np.pi], np.d, _pa); b.ang = Math.atan2(_pa.dy, _pa.dx);
  g.bars.push(b);
  emit(g, 'wall', { x: b.x, y: b.y });
  return true;
}
function castLast(g, x, y) {
  var s = g.sk.last; if (s.cd > 0 || !g.unlockedSkills.last) return false;
  s.cd = skillCd(g, 'last');
  var gx = g.gate.x, gy = g.gate.y + 0.3, dx = x - gx, dy = y - gy, L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  var ex = gx + dx * 24, ey = gy + dy * 24, dmg = 520 * (1 + 0.14 * g.wave) * (1 + g.R.lastDmg);
  var crown = false;
  g.enemies.slice().forEach(function (e) {
    if (e.dead) return;
    var px = e.x - gx, py = e.y - gy, tt = px * dx + py * dy; if (tt < 0) return;
    var qx = px - dx * tt, qy = py - dy * tt, w = 0.5 + e.size * 0.25;
    if (qx * qx + qy * qy > w * w) return;
    if (e.kneel) { crown = true; return; }
    hurt(g, e, e.boss ? dmg * 0.5 : dmg, 'true', SK_SRC.last);
  });
  g.obs.forEach(function (o) {
    if (!o.alive) return; var px = o.x - gx, py = o.y - gy, tt = px * dx + py * dy; if (tt < 0) return;
    var qx = px - dx * tt, qy = py - dy * tt; if (qx * qx + qy * qy < 0.36) hurtObs(g, o, dmg);
  });
  emit(g, 'last', { x0: gx, y0: gy, x1: ex, y1: ey, crown: crown });
  if (crown) {
    var b = g.enemies.filter(function (e) { return e.kneel; })[0];
    if (b) { b.kneel = 0; b.dead = 1; g.boss = null; g.stats.kills++; emit(g, 'crown', { x: b.x, y: b.y }); }
    g.finale = 2;
  }
  return true;
}
function setFocus(g, x, y) {
  var best = null, bd = 0.5;
  g.enemies.forEach(function (e) {
    if (e.dead || (e.stealth && !e.revealed)) return;
    var ey = e.fly ? e.y - 0.7 : e.y - e.size * 0.4, dd = Math.hypot(e.x - x, ey - y) - e.size * 0.3;
    if (dd < bd) { bd = dd; best = e; }
  });
  if (best) { g.focus = g.focus && g.focus.e === best ? null : { e: best }; emit(g, 'focus', {}); return true; }
  var c = Math.floor(x), r = Math.floor(y);
  if (c >= 0 && r >= 0 && c < g.cols && r < g.rows) {
    var oi = g.obsAt[r * g.cols + c];
    if (oi >= 0 && g.obs[oi].alive) { var o = g.obs[oi]; g.focus = g.focus && g.focus.o === o ? null : { o: o }; emit(g, 'focus', {}); return true; }
  }
  return false;
}

// ---------- 한 걸음 ----------
function stepGame(g, dt) {
  if (g.over) { updateProj(g, dt); return; }
  g.t += dt;
  if (g.gate.hitT > 0) g.gate.hitT -= dt;
  for (var k in g.sk) if (g.sk[k].cd > 0) g.sk[k].cd = Math.max(0, g.sk[k].cd - dt);
  if (g.sk2T) sk2Tick(g, dt);   // v2.2 특수 기술 지속 효과
  if (g.finale === 1) g.sk.last.cd = 0;
  if (g.rule) { var RL = RULES[g.rule.id]; if (RL && RL.tick) RL.tick(g, dt); }   // 등록 고리: 판 규칙
  waveFlow(g, dt);
  while (g.spawnQ.length && g.spawnQ[0].at <= g.t) { var s = g.spawnQ.shift(); spawnEnemy(g, s.type, s.path, 0); }
  updateEnemies(g, dt);
  for (var i = 0; i < g.towers.length; i++) towerAct(g, g.towers[i], dt);
  updateProj(g, dt);
  updateZones(g, dt);
  if (g.units.length) updateUnits(g, dt);
  if (g.bars.length) {
    g.bars.forEach(function (b) { b.t -= dt; if (b.hp <= 0 && !b.broke) { b.broke = 1; emit(g, 'wallBreak', { x: b.x, y: b.y }); } });
    g.bars = g.bars.filter(function (b) { return b.t > 0 && b.hp > 0; });
  }
  if (g.finale === 2 && !g.over) { g.over = 1; emit(g, 'win', { finale: 1 }); return; }
  if (!g.D.endless && g.wave >= g.N && !g.spawnQ.length && !g.enemies.length && !g.over && !g.finale) { g.over = 1; emit(g, 'win', {}); }
}
// 아군 유닛(v2.0): g.units = [{ kind, x, y, ang, z, hp, tw(주인 탑), st }]. UNIT_UPD[kind](g, u, dt)가 true를 돌려주면 없앰. 주인 탑이 팔리면 TW_SOLD에서 치울 것
function updateUnits(g, dt) {
  var keep = [];
  for (var i = 0; i < g.units.length; i++) { var u = g.units[i], f = UNIT_UPD[u.kind]; if (u.dead || (f && f(g, u, dt) === true)) continue; keep.push(u); }
  g.units = keep;
}
// [BM] 광고 이어하기: 진 판(over -1)을 생명 lives로 그 자리에서 다시 잇는다. 한 판에 한 번(g.revives)
// 성문 앞에 몰린 적 때문에 곧바로 다시 지지 않게, 남은 적은 길을 따라 2칸(우두머리 1칸) 물러나고 3초 멈춤(우두머리는 stunE 규칙대로 짧게)
// 웨이브, 금화, 탑, 장애물은 그대로
function metaRevive(g, lives) {
  if (!g || g.over !== -1 || g.revives) return false;
  g.over = 0; g.lives = Math.max(1, Math.round(lives || 3)); g.revives = 1;
  for (var i = 0; i < g.enemies.length; i++) {
    var e = g.enemies[i]; if (e.dead) continue;
    e.d = Math.max(0, e.d - (e.boss ? 1 : 2)); placeEnemy(e); stunE(e, 3, true);
  }
  emit(g, 'cont', { lives: g.lives });
  return true;
}
function starsOf(g) {
  if (g.over !== 1) return 0;
  var f = g.lives / g.maxLives, s = f >= 0.9 ? 3 : f >= 0.5 ? 2 : 1;
  return Math.min(s, g.D.starMax, g.tfMode === 'time' ? 2 : 3);   // 타임플렉스: 시간 초월은 별 2개까지
}
