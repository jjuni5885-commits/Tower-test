// ===== bot.js : 자동 플레이 (밸런스 시험, 브라우저 검증) =====
// v2.0(ENG2): 탑 24종, 편성(g.towersOk), 영역(땅, 하늘, 바다), 6단계와 합체까지
var BOT_BR = { archer: 1, catapult: 1, arcane: 0, frost: 0, ballista: 0, bell: 0, flame: 0, alchemy: 0, cannon: 0, mint: 0,
  flak: 1, sam: 0, gatling: 1, sniper: 0, rocket: 0, laser: 1, tesla: 0, airbase: 0, warship: 1, turtle: 0, singijeon: 1, jangseung: 0, barracks: 0, shrine: 1 };
var BOT_MIX = { archer: 3, catapult: 2, arcane: 2.2, frost: 1.2, ballista: 1.5, bell: 0.9, flame: 1.2, alchemy: 1.2, cannon: 1.5, mint: 0.6,
  flak: 1.6, sam: 1.4, gatling: 2, sniper: 1.2, rocket: 1.6, laser: 1.6, tesla: 1.3, airbase: 1.2, warship: 1.6, turtle: 1.6, singijeon: 1.6, jangseung: 0.8, barracks: 0.8, shrine: 1.1 };
var BOT_NOOBS = { totem: 1, barracks: 1, airbase: 1, dragon: 1, tesla: 1, fz_carrier: 1, fz_storm: 1, fz_frostfire: 1 };   // 장애물을 못 치는(안 치는) 공격 종류
function makeBot(g, opt) {
  opt = opt || {};
  var B = { g: g, skill: opt.skill == null ? 1 : opt.skill, t: 0.2, rnd: rngOf(opt.seed || 7), early: opt.early || 0, allowed: opt.allowed || null, noEl: opt.noEl || null, noFuse: !!opt.noFuse, log: [], picks: [] };
  // 지킬 길의 표본: 영역별로 (g 땅 길, s 뱃길, a 하늘 곡선과 항로). samples, fsamples는 옛 이름(땅과 바다, 하늘)
  B.dom = { g: [], s: [], a: [] }; B.samples = []; B.fsamples = [];
  function take(list, to, to2, strict) { (list || []).forEach(function (p) { for (var s = 0; s < p.n; s += 4) { var x = p.xs[s], y = p.ys[s]; if (y > -0.3 && y < g.rows + 0.2 && (!strict || (x > -0.3 && x < g.cols + 0.3))) { var q = [x, y, s / p.n]; to.push(q); to2.push(q); } } }); }
  take(g.paths, B.dom.g, B.samples, 1); take(g.sea, B.dom.s, B.samples, 1); take(g.fly, B.dom.a, B.fsamples, 0); take(g.air, B.dom.a, B.fsamples, 1);
  return B;
}
function botAllowed(B, k) {
  var g = B.g;
  if (!TOWERS[k] || TOWERS[k].fusion || (TOWERS[k].admin && !g.admin)) return false;
  if (B.allowed) return B.allowed.indexOf(k) >= 0;
  if (g.towersOk) return g.towersOk.indexOf(k) >= 0;
  return true;   // v2.0: 판 번호로 탑이 열리던 규칙은 없음(편성 g.towersOk 기준)
}
// 그 자리에서 사거리 안에 드는 길 표본(영역별, 성문에 가까울수록 조금 더). 판이 바뀌지 않으니 한 번 세면 계속 씀
function botCovRaw(B, x, y, range) {
  var key = (x * 10 | 0) + ':' + (y * 10 | 0) + ':' + Math.round(range * 20), C = B.covR || (B.covR = {}), v = C[key];
  if (v) return v;
  var rr = range * range; v = { g: 0, s: 0, a: 0 };
  for (var d in B.dom) { var L = B.dom[d], n = 0; for (var i = 0; i < L.length; i++) { var s = L[i]; if (d2(s[0], s[1], x, y) <= rr) n += 1 + s[2] * 0.4; } v[d] = n; }
  return (C[key] = v);
}
// 영역 비중(B.pool.dw: 다가올 적 구성과 지금 방어가 모자란 영역)을 곱한 덮는 정도. air: 맞히는 영역 글자 모음(옛 true/false도 됨)
function botCov(B, x, y, range, air) {
  var hs = typeof air === 'string' ? air : air ? 'gas' : 'gs', R = botCovRaw(B, x, y, range), W = B.pool && B.pool.dw, ng = Math.max(1, B.dom.g.length), v = 0;
  if (!W) { v = (hs.indexOf('g') >= 0 ? R.g : 0) + (hs.indexOf('s') >= 0 ? R.s : 0); return v; }
  if (hs.indexOf('g') >= 0) v += R.g * W.g;
  if (hs.indexOf('s') >= 0 && B.dom.s.length) v += R.s * W.s * ng / B.dom.s.length;
  if (hs.indexOf('a') >= 0 && B.dom.a.length) v += R.a * W.a * ng / B.dom.a.length;
  return v;
}
function botHit(type, lvl, br) { var s = towerStats(type, lvl || 1, br || 0); return s.hit || fdHit(type); }
function botDps(type, lvl, br) {
  var s = towerStats(type, lvl, br), k = s.kind;
  if (k === 'mint' || k === 'aura') return 0;
  var d = 0, crit = s.crit ? 1 + s.crit * ((s.critX || 2) - 1) : 1;
  if (k === 'beam') d = (s.dps0 + s.dps1) / 2 * 1.2;
  else if (k === 'cone') d = s.dmg * s.rate * 2.2 + s.burn * 1.5;
  else if (k === 'ring') d = s.dmg * s.rate * 3 + s.burn * 2;
  else if (k === 'pulse') d = s.dmg * s.rate * 3 + s.slow * 80;
  else if (k === 'flask') d = s.dmg * s.rate * 2 + s.poison * s.cloudT * s.rate * 2 + s.shred * 60;
  // ---- v2.0 새 탑 (tools/tw2dps.js로 잰 값에 맞춘 어림) ----
  else if (k === 'flak' || k === 'fz_aegis') d = s.dmg * s.rate * (1 + s.splash * 0.9) * (s.cluster ? 1.5 : 1) + (s.aaDmg ? s.aaDmg * s.aaN / s.aaCd * 0.7 : 0);
  else if (k === 'missile') d = s.dmg * s.rate * (1 + ((s.multi || 1) - 1) * 0.6) * (1 + s.splash * 0.4);
  else if (k === 'gatling') d = s.dmg * s.rate * (s.ramp ? (1 + s.ramp) / 2 : 1) * (s.heN ? 1.2 : 1) * (1 - (s.soft || 0) * 0.25);
  else if (k === 'sniper') d = s.dmg * s.rate * crit * (1 + (s.mark || 0)) * 1.1;
  else if (k === 'salvo') d = s.dmg * s.n * s.rate * 0.8 * (1 + s.splash * 0.9) * (1 + (s.cluster || 0) * 0.15) + (s.zoneDps || 0) * 1.5;
  else if (k === 'beam2') d = (s.dps0 + s.dps1 * 2) / 3 * (1 + (s.split || 0) * (s.splitF || 0) * 0.5 + (s.line ? 0.5 : 0));
  else if (k === 'tesla') d = s.emp ? s.dmg * s.rate * 3.5 + s.stun * 90 : s.dmg * s.rate * (1 + (s.chain || 3) * 0.4);
  else if (k === 'airbase' || k === 'fz_carrier') d = (s.planes || 1) * (s.dmg * s.rate * 0.35 + (s.bombDmg ? s.bombDmg * (s.bombN || 1) / s.bombCd * 0.9 : 0) + (s.aamDmg ? s.aamDmg / s.aamCd * 0.6 : 0)) + (s.gunDmg ? s.gunDmg / s.gunCd : 0);
  else if (k === 'navgun') d = s.dmg * s.rate * (s.n || 1) * (1 + s.splash * 0.8) * 1.15 + (s.aaDmg ? s.aaDmg / s.aaCd * 0.5 : 0);
  else if (k === 'broadside' || k === 'fz_dragonship') d = s.dmg * s.rate * Math.ceil((s.n || 2) / 2) * 1.4 + s.flameDps * 1.3 + (s.burn || 0) + (s.arrowDmg ? s.arrowDmg * s.arrowN / s.arrowCd : 0);
  else if (k === 'hwacha') d = s.dmg * s.n * s.rate + (s.bigDmg ? s.bigDmg * s.rate * (1 + s.bigR * 0.6) : 0);
  else if (k === 'totem') d = (s.auraDps || 0) * 3 + s.fear * 220 + (s.pulseDmg ? s.pulseDmg / s.pulseCd * 3 + s.pulseStun * 40 : 0) + (s.markAura || 0) * 500;
  else if (k === 'barracks') d = (s.soldiers || 3) * (s.dmg * (s.rate || 1) * 0.6 + (s.block || 1) * s.sHp / (1 - (s.sArmor || 0)) * 0.035);
  else if (k === 'talisman') d = s.dmg * s.rate * (s.multi || 1) * (1 + (s.splash || 0) * 1.2) + s.seal * 6;
  else if (k === 'orbital') d = s.dmg * s.rate * (1 + s.splash);
  else if (k === 'dragon') d = s.flameDps * 1.5;
  else if (k === 'fz_skybow') d = s.dmg * s.rate * s.multi * 0.7 + s.bigDmg / s.bigCd * 1.6;
  else if (k === 'fz_fortress') d = s.dmg * s.rate * (1 + s.splash);
  else if (k === 'fz_storm') d = s.dmg * s.rate * s.n * 0.7 + s.bigDmg / s.bigCd * 4;
  else if (k === 'fz_frostfire') d = (s.dmg + s.fireDmg) / 2 * s.rate * 3 + s.burn * 2 + s.slow * 100;
  else if (k === 'fz_arsenal') d = s.dmg * s.rate + s.rkDmg * s.rkN / s.rkCd * 0.9;
  else {
    d = s.dmg * s.rate * (s.multi || 1);
    if (s.splash) d *= 1 + s.splash * 1.6;
    if (s.pierce) d *= 1 + Math.min(s.pierce, 6) * 0.25;
    if (s.chain) d *= 1 + s.chain * 0.5;
    if (s.crit) d *= 1 + s.crit * (s.critX - 1);
  }
  return d || 0;
}
// 맵 적 구성에 맞춘 실제 피해 효율
function botEff(B, type, lvl, br) {
  var g = B.g;
  if (!B.pool || B.poolW !== g.wave || B.poolN !== g.towers.length) {
    // 맵 전체 구성 절반 + 다가올 웨이브 3개 절반
    var P = { arm: 0, mres: 0, fly: 0, st: 0, n: 0, ice: 0, fimm: 0, iceW: 0, mref: 0, guard: 0, twin: 0, cool: 0, weak: {}, dg: 0, da: 0, ds: 0, mech: 0, spirit: 0, boss: 0 };
    var add = function (k, w) {
      var E = ENEMIES[k]; if (!E || fdRouteN(g.M, E) < 1) return;
      var dom = fdDom(E);
      P.arm += (E.armor || 0) * w; P.mres += (E.mres || 0) * w; P.fly += (dom === 'a' ? 1 : 0) * w; P.st += (E.stealth || E.hide ? 1 : E.fadeCyc ? 0.6 : 0) * w; P.n += w;
      if (dom === 'a') P.da += w; else if (dom === 's') P.ds += w; else P.dg += w;
      if (E.mech || (typeof TW2_MECH !== 'undefined' && TW2_MECH[k])) P.mech += w; if (E.spirit || E.ch === 4 || (typeof TW2_SPIRIT !== 'undefined' && TW2_SPIRIT[k])) P.spirit += w; if (E.boss) P.boss += w;
      // v1.3 상성
      if (E.iceArmor) P.ice += w; if (E.fireImm) P.fimm += w; if (E.iceWeak) P.iceW += w; if (E.magRef) P.mref += w; if (E.frontGuard) P.guard += w; if (E.twin) P.twin += w; if (E.slowX || E.regenCool) P.cool += w;
      (E.weak || []).forEach(function (t) { P.weak[t] = (P.weak[t] || 0) + w; });
    };
    var tot = 0; g.M.pool.forEach(function (k) { if (ENEMIES[k]) tot += threatOf(k); });
    g.M.pool.forEach(function (k) { if (ENEMIES[k]) add(k, threatOf(k) / tot); });
    var up = 0, list = [];
    for (var wi = g.wave; wi < Math.min(g.N, g.wave + 3); wi++) waveAt(g, wi).groups.forEach(function (gr) { if (!ENEMIES[gr.type]) return; var w = threatOf(gr.type) * gr.n; up += w; list.push([gr.type, w]); });
    list.forEach(function (x) { add(x[0], x[1] / up * 1.2); });
    for (var k in P) if (k !== 'n' && k !== 'weak') P[k] /= (P.n || 1);
    for (var k3 in P.weak) P.weak[k3] /= (P.n || 1);
    // 영역 비중 dw: 다가올 적의 영역 비율 x 지금 그 영역을 막는 화력이 모자란 정도(0.6~3배)
    var have = { g: 0.001, a: 0.001, s: 0.001 }, sum = 0.003;
    g.towers.forEach(function (t) { if (t.k === 'mint' || t.k === 'bell') return; var hs = t.hit || 'gs', pw = botDps(t.k, t.lvl, t.br), R = botCovRaw(B, t.x, t.y, Math.min(8, (t.st && t.st.range) || 2.5)); ['g', 'a', 's'].forEach(function (d) { if (hs.indexOf(d) >= 0 && B.dom[d].length) { var v = pw * Math.min(1, R[d] / B.dom[d].length * 4 + 0.15); have[d] += v; sum += v; } }); });
    var need = { g: P.dg, a: P.da, s: P.ds }; P.dw = {};
    ['g', 'a', 's'].forEach(function (d) { var k2 = need[d] > 0.02 ? clamp(need[d] / (have[d] / sum + 0.12), 0.6, 3) : 0.3; P.dw[d] = need[d] * k2 * (1 + Math.min(2, ((B.leakD || {})[d] || 0) * 0.2)); });   // [BAL] 그 영역 적이 성문까지 온 적이 있으면 더 챙김
    B.pool = P; B.poolW = g.wave; B.poolN = g.towers.length;
  }
  var P2 = B.pool, s = towerStats(type, lvl, br), T = TOWERS[type], d = botDps(type, lvl, br);
  var dt = T.dmgType, m = dt === 'phys' ? 1 - P2.arm * (1 - (s.ap || 0)) : dt === 'expl' ? 1 - P2.arm * 0.5 : 1 - P2.mres;
  if (s.kind === 'flask') m = 1 + P2.arm * 0.3;
  var aoe = s.splash || s.kind === 'pulse' || s.kind === 'cone' || s.kind === 'ring' || s.kind === 'flask' || s.kind === 'totem' || s.kind === 'tesla';
  if (!aoe && !s.detect) m *= 1 - P2.st * 0.7;
  if (s.kind === 'totem') m *= 1 + P2.st * 2;
  // v2.0 배수 칸
  if (s.airX) m *= 1 + (s.airX - 1) * P2.da; if (s.seaX) m *= 1 + (s.seaX - 1) * P2.ds; if (s.mechX) m *= 1 + (s.mechX - 1) * P2.mech; if (s.spiritX) m *= 1 + (s.spiritX - 1) * P2.spirit; if (s.bossX) m *= 1 + (s.bossX - 1) * P2.boss;
  // v1.3 상성: 계열(속성 카드 반영)로 얼음 갑옷, 불 면역, 마법 반사, 정면 방패, 쌍둥이 왕
  var el = towerEl(g, type, lvl, br);
  if (P2.ice) m *= el === 'fire' ? 1 + 0.5 * P2.ice : 1 - 0.75 * P2.ice;
  if (P2.fimm && el === 'fire') m *= 1 - P2.fimm;
  if (P2.iceW && el === 'ice') m *= 1 + P2.iceW;
  if (P2.mref && dt === 'magic') m *= 1 - P2.mref;
  if (P2.guard && (s.kind === 'arrow' || s.kind === 'orb')) m *= 1 - 0.6 * P2.guard;
  if (P2.twin) m *= (el === 'fire' || el === 'ice') ? 1 + 0.6 * P2.twin : 1 - 0.6 * P2.twin;
  if (P2.cool && s.kind === 'pulse') m *= 1 + 2.5 * P2.cool;
  m *= 1 + 0.6 * (P2.weak[type] || 0);
  return d * m;
}
function botTick(B, dt) {
  var g = B.g; if (g.over) return;
  if (g.pickWait) botPick(B);   // 능력 카드: 상성과 조합을 보고 고름
  // [BAL] 성문(부두, 항로 끝) 가까이 온 적의 영역을 센다(사람이 새는 걸 보고 그쪽을 보강하듯)
  var LD = B.leakD || (B.leakD = { g: 0, a: 0, s: 0 }), SE = B.seenEnd || (B.seenEnd = {});
  for (var ei = 0; ei < g.enemies.length; ei++) { var en = g.enemies[ei]; if (!en.dead && en.P && en.P.len - en.d < 1.2 && !SE[en.id]) { SE[en.id] = 1; LD[en.dom || 'g'] += 1; if (en.E && (en.E.hide || en.E.stealth)) B.hidN = (B.hidN || 0) + 1; if (B.pool) B.pool = null; } }
  B.t -= dt; if (B.t > 0) return;
  B.t = 0.35 + (1 - B.skill) * 1.6;
  botSkills(B);
  // 웨이브 사이 빈 시간에 장애물 정리
  if (!g.focus && g.enemies.length === 0 && g.towers.length) {
    var bo = null, bd = 99;
    g.obs.forEach(function (o) { if (!o.alive) return; var near = g.towers.some(function (t) { return t.st && t.st.range && t.st.kind !== 'pulse' && t.st.kind !== 'aura' && t.st.kind !== 'ring' && !BOT_NOOBS[t.st.kind] && inR(t, o.x, o.y, t.st.range); }); if (!near) return; var dd = o.hp; if (dd < bd) { bd = dd; bo = o; } });
    if (bo) g.focus = { o: bo };
  }
  for (var guard = 0; guard < 3; guard++) if (!botSpend(B)) break;
  if (g.waiting && (g.towers.length >= 2 || g.gold < 70 || g.t > 25)) callEarly(g);
  if (B.early && !g.waiting && g.enemies.length < 2 && g.nextT > 3 && g.wave < g.N) callEarly(g);
  if (!g.waiting && g.wave < g.N && g.nextT <= 0 && !g.autoWave && fieldClear(g)) callEarly(g);
}
// 갈래 고르기: 숨은 적이 있으면 매의 눈, 우두머리 판이면 비전 집속탑, 얼음 젤리가 있으면 화염 투석기. 새 탑은 다가올 적의 영역과 갑옷을 보고
function botBr(B, k) {
  var g = B.g, P = B.pool || {};
  if (k === 'archer' && g.M.pool.indexOf('stalker') >= 0) return 0;
  if (k === 'arcane' && g.M.boss) return 1;
  if (k === 'catapult' && (P.ice > 0.04 || P.twin > 0)) return 0;
  if (k === 'sam') return P.da > 0.45 ? 0 : 1;            // 하늘 위주면 장거리 요격탄, 아니면 땅도 치는 다탄두
  if (k === 'gatling') return P.arm > 0.25 ? 0 : 1;       // 갑옷이 많으면 철갑
  if (k === 'sniper') return g.M.boss ? 0 : 1;
  if (k === 'airbase') return P.da > 0.35 ? 1 : 0;
  if (k === 'warship') return P.da > 0.3 ? 0 : 1;
  if (k === 'tesla') return P.mech > 0.4 ? 1 : 0;
  if (k === 'shrine') return P.spirit > 0.5 ? 0 : 1;
  return BOT_BR[k] == null ? 0 : BOT_BR[k];
}
// [BAL] 이번과 다음 두 웨이브에 그 영역(g, a, s)의 적이 오는가 (사람은 웨이브 미리보기를 봄)
function botSoon(B, dom) {
  var g = B.g;
  for (var wi = Math.max(0, g.wave - 1); wi < Math.min(g.N, g.wave + 2); wi++) { var W = waveAt(g, wi); if (W && W.groups.some(function (gr) { var E = ENEMIES[gr.type]; return E && fdDom(E) === dom; })) return true; }
  return false;
}
// [BAL] 이번과 다음 두 웨이브에 숨는 적(hide, stealth)이 오는가
function botSoonHidden(B) {
  var g = B.g;
  for (var wi = Math.max(0, g.wave - 1); wi < Math.min(g.N, g.wave + 2); wi++) { var W = waveAt(g, wi); if (W && W.groups.some(function (gr) { var E = ENEMIES[gr.type]; return E && (E.hide || E.stealth); })) return true; }
  return false;
}
// 합체 상대가 될 수 있는 탑 키 목록
function botFusePartner(k) { var out = []; if (typeof FUSIONS === 'undefined') return out; FUSIONS.forEach(function (F) { if (F.a === k) out.push(F.b); else if (F.b === k) out.push(F.a); }); return out; }
function botSpend(B) {
  var g = B.g, cands = [];
  botEff(B, 'archer', 1, 0);
  var types = TOWER_ORDER.concat(g.admin && typeof TW2_ADMIN !== 'undefined' ? TW2_ADMIN : []).filter(function (k) { return botAllowed(B, k); });
  var counts = {}; g.towers.forEach(function (t) { counts[t.k] = (counts[t.k] || 0) + 1; });
  var nAttack = g.towers.filter(function (t) { return t.k !== 'mint' && t.k !== 'bell'; }).length;
  var stealthMap = (g.M.pool.indexOf('stalker') >= 0 && (g.seenEnemies.stalker || g.wave >= ((g.M.intro || {}).stalker || 0))) || (B.pool && B.pool.st > 0.12) || (g.M.rule && g.M.rule.id === 'night');
  var canFuse = (g.fuse || g.fuseOk) && !B.noFuse && typeof fuseOptions === 'function' && g.maxLv >= 5;
  // 합체: 조건이 되면 바로
  if (canFuse) for (var fi = 0; fi < g.towers.length; fi++) { var fo = fuseOptions(g, g.towers[fi]); if (fo.length) { var nt = fuseTowers(g, g.towers[fi], fo[0]['with']); if (nt) { B.log.push('fuse ' + nt.k); B.pool = null; return true; } } }
  // 건설 후보
  types.forEach(function (k) {
    var T = TOWERS[k], kind = T.kind;
    if (k === 'bell' && (stealthMap ? (counts.bell || 0) >= 1 + Math.floor(nAttack / 6) : (nAttack < 6 || (counts.bell || 0) >= 1))) return;
    if (k === 'mint' && ((counts.mint || 0) >= 2 || g.wave > g.N * 0.5 || nAttack < 3)) return;
    if (kind === 'totem' && (nAttack < (stealthMap ? 2 : 3) || (counts[k] || 0) >= 1 + Math.floor(nAttack / 7))) return;
    if (kind === 'barracks' && (nAttack < 2 || (counts[k] || 0) >= 2)) return;
    if (kind === 'airbase' && (counts[k] || 0) >= 2) return;
    if (T.admin && (counts[k] || 0) >= 1) return;
    var cost = towerCost(g, k, 0);
    var st = towerStats(k, 1, 0), hs = botHit(k, 1, 0), best = null, bv = -1, rng = Math.min(4.2, (st.range || 2) * g.rangeMod), partners = canFuse ? botFusePartner(k) : [];
    for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) {
      if (!canBuildAt(g, c, r, k)) continue;
      var v;
      if (k === 'mint') v = 100 - botCov(B, c + 0.5, r + 0.5, 2.5);
      else if (k === 'bell') { v = 0; g.towers.forEach(function (t) { if (t.k !== 'mint' && t.k !== 'bell' && d2(t.x, t.y, c + 0.5, r + 0.5) <= st.range * st.range) v += 1 + t.lvl; }); v += botCov(B, c + 0.5, r + 0.5, st.reveal) * 0.1; }
      else if (kind === 'barracks') v = botCov(B, c + 0.5, r + 0.5, 1.3, 'g') * 3;   // 병사는 길 바로 옆이어야 함
      else v = botCov(B, c + 0.5, r + 0.5, rng, hs);
      if (partners.length) for (var pi = 0; pi < g.towers.length; pi++) { var pt = g.towers[pi]; if (partners.indexOf(pt.k) >= 0 && Math.abs(pt.c - c) <= 1 && Math.abs(pt.r - r) <= 1) { v *= 1.25; break; } }   // 합체 상대 옆자리
      if (B.skill < 1) v *= 0.6 + B.rnd() * 0.8 * (1 - B.skill) + B.skill * 0.4;
      if (v > bv) { bv = v; best = [c, r]; }
    }
    if (!best || bv <= 0) return;
    var want = (BOT_MIX[k] || 1) / Math.sqrt((counts[k] || 0) + 1);
    var val = k === 'mint' ? 3.5 * (g.N - g.wave) / g.N : k === 'bell' ? bv * 0.9 : T.admin ? 1e6 : bv * botEff(B, k, 1, 0) / Math.max(1, cost);
    val *= want;
    if (nAttack < 3 && (k === 'mint' || k === 'bell')) val *= 0.1;
    if (T.light && !(counts.bell || counts.jangseung) && nAttack >= 2 && (B.hidN || 0) >= 2 && botSoonHidden(B)) val = Math.max(val, 1e3);   // [BAL] 숨는 적이 있으면 조명 탑 하나는 먼저(사람은 '드러내라' 안내를 봄)
    if (fdSite(k) === 'water' && B.pool && B.pool.ds > 0.05 && botSoon(B, 's')) { var nw = 0; g.towers.forEach(function (t) { if (t.site === 'water') nw++; }); val *= nw === 0 ? 3 : nw === 1 ? 1.5 : 1; }   // 바다 적이 오는데 수상 탑이 없으면 먼저(물 칸은 땅 탑 자리와 겹치지 않음)
    cands.push({ a: 'build', k: k, c: best[0], r: best[1], cost: cost, v: val });
  });
  // 강화 후보
  g.towers.forEach(function (t) {
    if (!canUpgrade(g, t)) return;
    var br = t.lvl === 3 ? botBr(B, t.k) : t.br; if (br == null) br = 0;
    var cost = towerCost(g, t.k, t.lvl, br);
    var val;
    if (t.k === 'mint') val = 3 * (g.N - g.wave) / g.N;
    else if (t.k === 'bell') val = 1.2 + g.towers.length * 0.15;
    else {
      var s1 = towerStats(t.k, t.lvl + 1, br), hs1 = s1.hit || fdHit(t.k);
      var cov = t.st.kind === 'barracks' ? botCov(B, t.x, t.y, 1.3, 'g') * 3 : botCov(B, t.x, t.y, Math.min(4.2, (s1.range || 2) * g.rangeMod), hs1);   // 아주 먼 사거리는 4.2칸까지만 쳐 줌(한 번에 한 곳만 쏘니까)
      var now = botEff(B, t.k, t.lvl, t.br), v1 = (botEff(B, t.k, t.lvl + 1, br) - now) / Math.max(1, cost);
      if (t.lvl + 2 <= Math.min(fdMaxLv(t.k, t.lvl >= 3 ? br : null), g.maxLv)) { var br2 = t.lvl + 1 === 3 ? botBr(B, t.k) : br; var c2 = towerCost(g, t.k, t.lvl + 1, br2); v1 = Math.max(v1, (botEff(B, t.k, t.lvl + 2, br2) - now) / Math.max(1, cost + c2) * 0.92); }
      val = cov * v1;
      // 합체 상대가 옆에 있으면 5단계까지 서둘러 올림
      if (canFuse && t.lvl < 5 && !TOWERS[t.k].fusion) { var ps = botFusePartner(t.k); if (ps.length && g.towers.some(function (o) { return o !== t && ps.indexOf(o.k) >= 0 && Math.abs(o.c - t.c) <= 1 && Math.abs(o.r - t.r) <= 1; })) val *= 1.35; }
    }
    val *= 1.15;
    cands.push({ a: 'up', t: t, br: br, cost: cost, v: val });
  });
  if (!cands.length) return false;
  cands.sort(function (a, b) { return b.v - a.v; });
  var c0 = cands[0];
  // 급할 때(성문 가까이 적이 몰림)는 살 수 있는 것 중 최선, 아니면 최선을 위해 모은다
  var danger = g.enemies.filter(function (e) { return e.P.len - e.d < Math.max(5, e.P.len * 0.4); }).length >= 3;
  // [BAL] 방금(12초 안) 생명이 깎였으면 사람처럼 모으지 않고 바로 산다
  if (B.lv0 == null || g.lives > B.lv0) B.lv0 = g.lives;
  if (g.lives < B.lv0) { B.lv0 = g.lives; B.hurtT = g.t; }
  if (B.hurtT != null && g.t - B.hurtT < 12) danger = true;
  if (c0.cost > g.gold) {
    var aff = cands.filter(function (c) { return c.cost <= g.gold; });
    if (!aff.length) return false;
    if (!danger && B.skill >= 0.7 && aff[0].v < c0.v * 0.6) return false;
    c0 = aff[0];
  }
  // 실력이 낮으면 아끼지 않고 아무거나
  if (B.skill < 1 && B.rnd() < (1 - B.skill) * 0.5) { var aff2 = cands.filter(function (c) { return c.cost <= g.gold; }); if (aff2.length) c0 = aff2[Math.floor(B.rnd() * aff2.length)]; }
  if (c0.a === 'build') return !!buildTower(g, c0.k, c0.c, c0.r);
  return upgradeTower(g, c0.t, c0.br);
}
function botSkills(B) {
  var g = B.g;
  if (!g.enemies.length) return;
  // 마지막 장면
  if (g.finale === 1 && g.sk.last.cd <= 0) { var kb = g.enemies.filter(function (e) { return e.kneel; })[0]; if (kb) { castLast(g, kb.x, kb.y); return; } }
  var best = null, bn = 0;
  g.enemies.forEach(function (e) { if (e.dead) return; var n = 0; g.enemies.forEach(function (o) { if (!o.dead && d2(o.x, o.y, e.x, e.y) < 1.7) n += o.boss ? 6 : o.mhp > 300 ? 2 : 1; }); if (n > bn) { bn = n; best = e; } });
  if (g.unlockedSkills.rain && g.sk.rain.cd <= 0 && best && bn >= 6 && B.skill > 0.3) castRain(g, best.x, best.y);
  if (g.unlockedSkills.last && g.sk.last.cd <= 0 && B.skill > 0.3) {
    if (g.boss && !g.boss.dead && g.boss.d > 3) castLast(g, g.boss.x, g.boss.y);
    else if (best && bn >= 10) castLast(g, best.x, best.y);
  }
  if (g.unlockedSkills.wall && g.sk.wall.cd <= 0 && B.skill > 0.3) {
    var close = g.enemies.filter(function (e) { return !e.fly && e.P.len - e.d < 4.5; });
    if (close.length >= 3) { var e0 = close[0], q = pathAt(e0.P, Math.min(e0.P.len - 0.8, e0.d + 1.2), { x: 0, y: 0, dx: 0, dy: 0 }); castWall(g, q.x, q.y); }
  }
}

// ---------- 능력 카드 고르기 (v1.3) ----------
// 속성 카드: 이 판 적이 약한 속성(weakEl 위협 비중)에 그 탑 비중을 곱함. 불 면역이 많으면 불은 깎음
// 탑 카드: 그 탑 비중, 조합 짝을 채우면 덤. B.noEl에 든 속성은 안 고름(시험: 맞는 속성 카드 없음)
function botCardScore(B, c) {
  var g = B.g, cnt = {}, tot = 0, W = mapWeakEl(g);
  g.towers.forEach(function (t) { if (t.k !== 'mint' && t.k !== 'bell') { cnt[t.k] = (cnt[t.k] || 0) + t.lvl; tot += t.lvl; } });
  function share(k) {
    if (!botAllowed(B, k)) return 0;
    if (tot > 0) return (cnt[k] || 0) / tot;
    var s = 0; TOWER_ORDER.forEach(function (x) { if (botAllowed(B, x)) s += BOT_MIX[x] || 1; }); return (BOT_MIX[k] || 1) / Math.max(1, s);
  }
  if (c.kind === 'el') {
    if (B.noEl && B.noEl.indexOf(c.el) >= 0) return -1;
    var v = 0.35 + 5 * (W[c.el] || 0) - (c.el === 'fire' ? 3 * W._fimm : 0);
    if (g.attr[c.tower]) v -= 0.3 + 5 * (W[g.attr[c.tower]] || 0);   // 이미 붙은 좋은 속성을 버리지 않게
    return share(c.tower) * v + (c.combo.some(function (h) { return h.has; }) ? 0.4 * share(c.tower) : 0);
  }
  if (c.tower) {
    var base = c.tower === 'mint' ? 0.25 : c.tower === 'bell' ? 0.35 : 0.65;
    return share(c.tower) * base * (1 + 0.15 * c.rare) + (c.combo.some(function (h) { return h.has; }) ? 0.6 * share(c.tower) : 0);
  }
  var k = c.base;
  if (k === 'g_spd') return 0.5; if (k === 'g_crit') return 0.35; if (k === 'g_rng') return 0.3;
  if (k === 'g_gold') return 0.3 * (1 - g.wave / g.N);
  if (k === 'g_life') return g.lives < g.maxLives * 0.7 ? 0.6 : 0.12;
  if (k === 'g_boss') return g.M.boss ? 0.4 : 0.02;
  if (k === 'g_dot') return 0.1 + 0.4 * (share('flame') + share('alchemy'));
  return 0.1;
}
function botPick(B) {
  var g = B.g, cs = g.pickCards; if (!cs || !cs.length) return;
  var best = cs[0], bv = -9;
  cs.forEach(function (c) { var v = botCardScore(B, c) + (B.skill < 1 ? B.rnd() * (1 - B.skill) * 0.3 : 0); if (v > bv) { bv = v; best = c; } });
  if (abilityPick(g, best.id)) B.picks.push(best.id);
}

// ---------- 출전 편성 고르기 (BAL: 봇이 사람처럼 판 창을 보고 8종을 고름) ----------
// owned: 가진 탑 키 목록. 판 창이 알려 주는 것(필요한 탑, 도전 규칙, 적의 영역)을 보고 고른다.
// 순서: 필요한 탑 → night면 조명 탑 → 하늘 적이 있으면 대공 2종 → 바다 적이 있고 물 칸이 있으면 수상 탑 → 나머지는 이 판 적에 대한 효율
function botLoadout(mi, dk, owned, n) {
  n = n || 8;
  var M = MAPS[mi], g = newGame(mi, dk || 'normal', { towers: owned.slice(), cards: false }), B = makeBot(g, { allowed: owned.slice() });
  botEff(B, 'archer', 1, 0);
  var P = B.pool, ban = M.rule && M.rule.id === 'ban' ? M.rule.kinds || [] : [];
  var water = 0; for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) if (fdCellSite(g, c, r) === 'water') water++;
  var list = owned.filter(function (k) { return TOWERS[k] && !TOWERS[k].fusion && !TOWERS[k].admin && ban.indexOf(k) < 0 && (fdSite(k) !== 'water' || water >= 2); });
  var airK = M.pool.filter(function (k) { var E = ENEMIES[k]; return E && fdDom(E) === 'a' && fdRouteN(M, E) > 0; });
  var hasAir = P.da > 0.04 || airK.length > 0, hasSea = P.ds > 0.04 && water >= 2, night = M.rule && M.rule.id === 'night';
  var stealth = M.pool.some(function (k) { var E = ENEMIES[k]; return E && (E.stealth || E.ghost); });
  var sc = {};
  list.forEach(function (k) {
    var br = botBr(B, k), cost = 0; for (var l = 0; l < 3; l++) cost += towerCost(g, k, l, l >= 3 ? br : 0);
    var hs = botHit(k, 5, br), w = (hs.indexOf('g') >= 0 ? P.dg : 0) + (hs.indexOf('a') >= 0 ? P.da * 1.2 : 0) + (hs.indexOf('s') >= 0 ? P.ds * 1.1 : 0);
    sc[k] = botEff(B, k, 3, 0) / Math.max(1, cost) * (0.25 + w) * (BOT_MIX[k] || 1) * (TOWERS[k].kind === 'totem' || k === 'barracks' ? 0.7 : 1);
  });
  var pick = [];
  function add(k) { if (k && pick.length < n && pick.indexOf(k) < 0 && list.indexOf(k) >= 0) pick.push(k); }
  function best(f, m) { list.filter(f).sort(function (a, b) { return sc[b] - sc[a]; }).slice(0, m).forEach(add); }
  (M.need || []).forEach(add);
  if (night || stealth) best(function (k) { return TOWERS[k].light; }, 1);
  if (airK.some(function (k) { return ENEMIES[k].swarm; })) add('flak');   // 떼로 오는 작은 하늘 적은 대공포
  if (hasAir && (P.da > 0.12 || airK.length >= 2 || airK.some(function (k) { return ENEMIES[k].swarm || ENEMIES[k].lane; }))) best(function (k) { var s1 = towerStats(k, 1, 0); return (botHit(k, 1, 0) === 'a' || s1.airX > 1) && pick.indexOf(k) < 0; }, 1);   // 하늘 적이 많으면 전용 대공 하나는 꼭
  if (hasAir) { var na = pick.filter(function (k) { return botHit(k, 5, botBr(B, k)).indexOf('a') >= 0 && k !== 'bell'; }).length; best(function (k) { return k !== 'bell' && botHit(k, 5, botBr(B, k)).indexOf('a') >= 0 && pick.indexOf(k) < 0; }, Math.max(0, (P.da > 0.3 ? 3 : 2) - na)); }
  if (hasSea) { var nw = pick.filter(function (k) { return fdSite(k) === 'water' || botHit(k, 5, 0).indexOf('s') >= 0; }).length; best(function (k) { return fdSite(k) === 'water' && pick.indexOf(k) < 0; }, Math.max(0, 2 - nw)); }
  best(function (k) { return k !== 'mint' && k !== 'bell'; }, n);
  best(function () { return true; }, n);
  return pick;
}
