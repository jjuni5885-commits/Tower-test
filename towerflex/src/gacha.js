// ===== gacha.js : 탑 소환(랜덤 뽑기), 능력 카드 창, 빌드 보기, 조합 연출 (v1.3) =====
// 주석 표시: '// [BM]' 수익화(보석 쓰는 곳) / '// [재방문]' 다시 들어올 이유(하루 1번 무료 소환, 소환권)
// 저장 항목(ui.js defSave): towers { 탑 키: { n: 얻은 개수, star: 0~5 } }, tickets(소환권), gacha { pity, free(무료 쓴 날), total }, tkRew { 'm1w': 처음 승리, 'm1s': 별 3개 }
// 전투에 넘기는 것: opts.towers = 가진 탑, opts.towerStar = { 탑 키: 별 } (실제 피해 반영은 logic.js newGame)
// 다른 작업과의 약속: 능력 카드 사건 { t:'pick', cards, start }, abilityPick(G, id), { t:'picked' }, { t:'combo', tower, id, name },
//   G.attr[탑 키] 속성, G.build[탑 키] = { 카드 id: 단계 }, G.combos(조합 목록). 모두 없을 수 있으니 방어적으로 읽음

// ---------- 소환 수치 ----------
// 등급 확률(%)과 탑. 등급 안에서는 같은 확률. 여기 없는 새 탑이 TOWER_ORDER에 생기면 희귀에 넣음
// v2.0: 탑 24종. 등급은 data_towers2.js의 TW_RARITY { common, rare, legend }가 있으면 그것, 없으면 아래 표(설계서 6절)
var GC_TIERS = [
  { id: 'c', name: '일반', p: 60, keys: ['archer', 'catapult', 'frost', 'ballista', 'flak', 'gatling', 'barracks'] },
  { id: 'r', name: '희귀', p: 30, keys: ['arcane', 'bell', 'flame', 'alchemy', 'sniper', 'rocket', 'tesla', 'jangseung', 'shrine', 'singijeon'] },
  { id: 'l', name: '전설', p: 10, keys: ['cannon', 'mint', 'sam', 'laser', 'airbase', 'warship', 'turtle'] }
];
var GC_START = ['archer', 'catapult', 'flak'];   // 시작 탑
// 소환과 편성에 나오는 탑 전체(합체, 관리자 전용 제외). loadout.js가 없으면 TOWER_ORDER
function gcPool() { return typeof loAll === 'function' ? loAll(false) : TOWER_ORDER.filter(function (k) { return TOWERS[k] && !TOWERS[k].fusion && !TOWERS[k].admin; }); }
var GC_GEM1 = 30, GC_GEM10 = 270, GC_PITY = 10, GC_STAR_MAX = 5, GC_STAR_DMG = 6, GC_DUP_GEM = 10;
var GC_TK_WIN = 2, GC_TK_STAR3 = 1, GC_TK_DAILY = 1;
var GC = { busy: 0, timers: [], res: null, back: null, open: 0, inited: 0 };

// 등급표: TOWERS에 있는 탑만, 빠진 탑은 희귀에
function gcTiers() {
  if (GC.tiers) return GC.tiers;
  var R = null; try { if (typeof TW_RARITY !== 'undefined' && TW_RARITY) R = TW_RARITY; } catch (e) { R = null; }
  var pool = gcPool(), RK = { c: 'common', r: 'rare', l: 'legend' };
  var seen = {}, T = GC_TIERS.map(function (t) { var src = R && Array.isArray(R[RK[t.id]]) ? R[RK[t.id]] : t.keys; var k = src.filter(function (x) { return TOWERS[x] && pool.indexOf(x) >= 0 && !seen[x] && (seen[x] = 1); }); return { id: t.id, name: t.name, p: t.p, keys: k }; });
  pool.forEach(function (k) { if (!seen[k]) { T[1].keys.push(k); seen[k] = 1; } });
  T = T.filter(function (t) { return t.keys.length; });
  return (GC.tiers = T);
}
function gcTierOf(k) { var T = gcTiers(); for (var i = 0; i < T.length; i++) if (T[i].keys.indexOf(k) >= 0) return T[i]; return T[0]; }
// 탑 하나의 확률(%)
function gcRateOf(k) { var t = gcTierOf(k), sum = 0; gcTiers().forEach(function (q) { sum += q.p; }); return t.p / sum * 100 / t.keys.length; }
function gcPctTxt(v) { var r = Math.round(v * 10) / 10; return (r % 1 ? r.toFixed(1) : String(r)) + '%'; }

// ---------- 저장 (ui.js loadSave가 먼저 부르므로 이 파일의 var를 쓰지 않음) ----------
// 옛 기록 옮기기: 그 진행(SAVE.prog)에서 이미 열려 있던 탑은 그대로 가진 것으로. 새 기록은 궁수, 투석만
// 이미 이긴 지역, 별 3개 지역은 소환권을 받은 것으로 적어 둠(다시 깨서 받는 꼼수 막기)
function gcMigrate(s) {
  var U = typeof TOWER_UNLOCK !== 'undefined' && TOWER_UNLOCK ? TOWER_UNLOCK : { archer: 0, catapult: 0, arcane: 1, frost: 2, ballista: 3, bell: 4, flame: 5, alchemy: 6, cannon: 7, mint: 8 };
  var p = Math.max(0, Math.floor(+s.prog || 0)), out = {};
  TOWER_ORDER.forEach(function (k) { var u = U[k] == null ? 99 : U[k]; if (k === 'archer' || k === 'catapult' || u <= p) out[k] = { n: 1, star: 0 }; });
  if (!s.tkRew || typeof s.tkRew !== 'object') s.tkRew = {};
  if (s.rec && typeof s.rec === 'object') for (var id in s.rec) { var r = s.rec[id] || {}; if (r.easy || r.normal || r.hard) s.tkRew[id + 'w'] = 1; if ((r.normal || 0) >= 3 || (r.hard || 0) >= 3) s.tkRew[id + 's'] = 1; }
  return out;
}
function gcFixSave(s) {
  if (!s.towers || typeof s.towers !== 'object') s.towers = gcMigrate(s);
  var T = s.towers;
  for (var k in T) { if (!TOWERS[k] || !T[k] || typeof T[k] !== 'object') { delete T[k]; continue; } T[k].n = Math.max(1, Math.floor(+T[k].n || 1)); T[k].star = clamp(Math.floor(+T[k].star || 0), 0, 5); }
  ['archer', 'catapult', 'flak'].forEach(function (k0) { if (TOWERS[k0] && !T[k0]) T[k0] = { n: 1, star: 0 }; });   // 시작 탑 (이 함수는 이 파일의 var보다 먼저 불릴 수 있어 목록을 직접 씀)
  if (typeof s.tickets !== 'number' || !isFinite(s.tickets) || s.tickets < 0) s.tickets = 0;
  s.tickets = Math.floor(s.tickets);
  if (!s.gacha || typeof s.gacha !== 'object') s.gacha = { pity: 0, free: '', total: 0 };
  s.gacha.pity = clamp(Math.floor(+s.gacha.pity || 0), 0, 9); s.gacha.total = Math.floor(+s.gacha.total || 0); if (typeof s.gacha.free !== 'string') s.gacha.free = '';
  if (!s.tkRew || typeof s.tkRew !== 'object') s.tkRew = {};
  if (s.daily && typeof s.daily === 'object' && typeof s.daily.tk !== 'number') s.daily.tk = 0;
  return s;
}

// ---------- 가진 탑 ----------
function gcOwns(k) { return !!(SAVE.towers && SAVE.towers[k] && SAVE.towers[k].n > 0); }
function gcStar(k) { return gcOwns(k) ? SAVE.towers[k].star || 0 : 0; }
function gcOwned() { return gcPool().filter(gcOwns); }
function gcMissing() { return gcPool().filter(function (k) { return !gcOwns(k); }); }
function gcStarMap() { var o = {}; gcOwned().forEach(function (k) { if (gcStar(k) > 0) o[k] = gcStar(k); }); return o; }
function gcFreeLeft() { return !SAVE.gacha || SAVE.gacha.free !== metaToday(); }
function gcPityLeft() { return gcMissing().length ? GC_PITY - (SAVE.gacha.pity || 0) : 0; }
// 지역에 필요한 탑 (data.js MAPS[i].need, 없으면 빈 목록)
function gcNeed(mi) { var M = MAPS[mi], n = M && Array.isArray(M.need) ? M.need : []; return n.filter(function (k, i) { return TOWERS[k] && n.indexOf(k) === i; }); }

// ---------- 뽑기 ----------
// rng: 0~1 함수. only: 이 탑들 중에서만(천장). 확률은 등급 확률 / 등급 안 탑 수
function gcRoll(rng, only) {
  var T = gcTiers(), list = [], sum = 0;
  T.forEach(function (t) { t.keys.forEach(function (k) { if (only && only.indexOf(k) < 0) return; var w = t.p / t.keys.length; list.push([k, w]); sum += w; }); });
  var v = rng() * sum;
  for (var i = 0; i < list.length; i++) { v -= list[i][1]; if (v < 0) return list[i][0]; }
  return list[list.length - 1][0];
}
// 한 번에 쓸 값: 무료 → 소환권 → 보석 순
function gcPay1() { if (gcFreeLeft()) return 'free'; if ((SAVE.tickets || 0) > 0) return 'ticket'; if ((SAVE.gems || 0) >= GC_GEM1) return 'gem'; return null; }
// n: 1 또는 10, pay: 'free' | 'ticket' | 'gem'. 결과 배열 또는 null(모자람)
function gcPull(n, pay, rng) {
  rng = rng || Math.random;
  if (n === 10) { if (pay !== 'gem' || (SAVE.gems || 0) < GC_GEM10) return null; SAVE.gems -= GC_GEM10; }
  else {
    n = 1;
    if (pay === 'free') { if (!gcFreeLeft()) return null; SAVE.gacha.free = metaToday(); }
    else if (pay === 'ticket') { if ((SAVE.tickets || 0) < 1) return null; SAVE.tickets--; }
    else if (pay === 'gem') { if ((SAVE.gems || 0) < GC_GEM1) return null; SAVE.gems -= GC_GEM1; }
    else return null;
  }
  var out = [], G0 = SAVE.gacha;
  for (var i = 0; i < n; i++) {
    var miss = gcMissing(), force = miss.length > 0 && G0.pity >= GC_PITY - 1;
    var k = gcRoll(rng, force ? miss : null), tier = gcTierOf(k), r = { k: k, tier: tier.id, isNew: false, s0: 0, s1: 0, gem: 0, pity: force };
    if (!gcOwns(k)) { SAVE.towers[k] = { n: 1, star: 0 }; r.isNew = true; G0.pity = 0; }
    else {
      var W = SAVE.towers[k]; W.n++; r.s0 = W.star;
      if (W.star < GC_STAR_MAX) W.star++; else { r.gem = GC_DUP_GEM; SAVE.gems = (SAVE.gems || 0) + GC_DUP_GEM; }
      r.s1 = W.star;
      G0.pity = gcMissing().length ? Math.min(GC_PITY - 1, G0.pity + 1) : 0;
    }
    G0.total++;
    out.push(r);
  }
  metaSaveNow(); uiGemsShow(false);
  return out;
}
// [재방문] 소환권 얻기: 지역 처음 승리 +2, 별 3개 처음 +1 (showResult가 부름). 돌려주는 값: 받은 장수
function gcWinTickets(g, stars) {
  if (!g || g.over !== 1 || g.D.endless) return 0;
  var id = g.M.id, R = SAVE.tkRew, n = 0;
  if (!R[id + 'w']) { R[id + 'w'] = 1; n += GC_TK_WIN; }
  if (stars >= 3 && g.dk !== 'easy' && !R[id + 's']) { R[id + 's'] = 1; n += GC_TK_STAR3; }
  var rw = gcStageReward(g);   // v2.0 판 첫 승리 확정 보상(M.reward). 소환권 보상은 n에 더해 결과 창의 소환권 줄에 같이 나옴
  if (rw && rw.kind === 'tickets') n += rw.n;
  if (n) { SAVE.tickets = (SAVE.tickets || 0) + n; saveNow(); }
  if (rw && rw.kind !== 'tickets') setTimeout(function () { gcRewardRow(rw); }, 0);   // 결과 창이 뜬 뒤 보상 줄을 끼우고, 탑이면 획득 연출
  return n;
}
// 판 첫 승리 확정 보상: M.reward = { tower: 키 } | { tickets: n } | { gems: n }. 한 판에 한 번(SAVE.rwGot[판 id]). 탑은 이미 있으면 별 +1(별 5개면 보석)
// 돌려주는 값: { kind: 'tower', k, isNew, s0, s1, gem } | { kind: 'tickets', n }(지급은 부른 쪽 gcWinTickets) | { kind: 'gems', n } | null
function gcStageReward(g) {
  if (!g || g.over !== 1 || g.D.endless || !g.M) return null;
  var M = g.M, R = M.reward; if (!R || typeof R !== 'object') return null;
  if (!SAVE.rwGot || typeof SAVE.rwGot !== 'object') SAVE.rwGot = {};
  if (SAVE.rwGot[M.id]) return null;
  var out = null;
  if (R.tower && TOWERS[R.tower]) {
    var k = R.tower; out = { kind: 'tower', k: k, isNew: false, s0: 0, s1: 0, gem: 0 };
    if (!gcOwns(k)) { SAVE.towers[k] = { n: 1, star: 0 }; out.isNew = true; }
    else { var W = SAVE.towers[k]; W.n++; out.s0 = W.star; if (W.star < GC_STAR_MAX) W.star++; else { out.gem = GC_DUP_GEM; SAVE.gems = (SAVE.gems || 0) + GC_DUP_GEM; } out.s1 = W.star; }
  } else if (R.tickets > 0) out = { kind: 'tickets', n: Math.floor(R.tickets) };
  else if (R.gems > 0) { out = { kind: 'gems', n: Math.floor(R.gems) }; SAVE.gems = (SAVE.gems || 0) + out.n; }
  if (!out) return null;
  SAVE.rwGot[M.id] = 1; GC.lastReward = out; saveNow(); uiGemsShow(false);
  return out;
}
// 결과 창(.res)에 확정 보상 줄을 끼움. 결과 창이 이미 보상 줄(#rRew)을 그렸으면 건너뜀. 탑이면 획득 연출(chapters.js chRewardShow)
function gcRewardRow(rw) {
  var box = UI.modalKind === 'result' ? $('modal').querySelector('.res') : null;
  if (box && !$('rRew')) {
    var d = document.createElement('div'); d.className = 'rgain rw'; d.id = 'rRew';
    d.innerHTML = rw.kind === 'tower' ? '<img src="' + (typeof loIcon === 'function' ? loIcon(rw.k, 1, 0, 48) : towerIconURL(rw.k, 1, 0, 48)) + '" alt="">첫 승리 보상: ' + esc(TOWERS[rw.k].name) + (rw.isNew ? ' 획득' : rw.gem ? ' (보석 +' + rw.gem + ')' : ' 별 +1') : '<img src="' + uiIcon('gem', 48) + '" alt="">첫 승리 보상: 보석 +' + rw.n;
    var at = box.querySelector('.rhint') || box.querySelector('.rcont') || box.querySelector('.mbtns'); if (at) box.insertBefore(d, at); else box.appendChild(d);
  }
  if (rw.kind === 'tower' && typeof chRewardShow === 'function') setTimeout(function () { if (UI.modalKind === 'result') chRewardShow(rw); }, 900);
}
// [재방문] 오늘 임무 3개를 모두 받으면 소환권 +1 (meta.js metaQuestClaim이 부름)
function gcDailyBonus(d) {
  if (!d || d.tk || !d.ids || d.ids.length < 3 || !d.ids.every(function (id) { return d.got[id]; })) return false;
  d.tk = 1; SAVE.tickets = (SAVE.tickets || 0) + GC_TK_DAILY; metaSaveNow();
  setTimeout(function () { toast('오늘 임무를 모두 끝냈습니다. 소환권 +' + GC_TK_DAILY, 2200); }, 400);
  return true;
}

// ---------- 그림: 소환권, 캡슐, 속성, 능력 ----------
var GC_ICON = {};
function gcIcon(name, px) {
  px = px || 64; var key = name + px; if (GC_ICON[key]) return GC_ICON[key];
  var c = mkC(px, px), x = cx2(c), m = px / 2, s = px / 64;
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (name === 'ticket') {
    // 소환권: 분홍 표, 양옆 반달 홈, 가운데 별
    var p = new Path2D(), L = m - 26 * s, R = m + 26 * s, T = m - 16 * s, B = m + 16 * s, r = 6 * s;
    p.moveTo(L + 5 * s, T); p.lineTo(R - 5 * s, T); p.quadraticCurveTo(R, T, R, T + 5 * s); p.lineTo(R, m - r); p.arc(R, m, r, -Math.PI / 2, Math.PI / 2, true); p.lineTo(R, B - 5 * s); p.quadraticCurveTo(R, B, R - 5 * s, B);
    p.lineTo(L + 5 * s, B); p.quadraticCurveTo(L, B, L, B - 5 * s); p.lineTo(L, m + r); p.arc(L, m, r, Math.PI / 2, -Math.PI / 2, true); p.lineTo(L, T + 5 * s); p.quadraticCurveTo(L, T, L + 5 * s, T); p.closePath();
    x.save(); x.translate(m, m); x.rotate(-0.18); x.translate(-m, -m);
    uiCandy(x, p, T, B, ['#ffe0ee', '#ffa8cf', '#ff7fb2'], '#d23a72', 2.4 * s);
    x.setLineDash([2.5 * s, 3 * s]); x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 2 * s; x.beginPath(); x.moveTo(m + 11 * s, T + 4 * s); x.lineTo(m + 11 * s, B - 4 * s); x.stroke(); x.setLineDash([]);
    uiCandy(x, uiStarPath(m - 4 * s, m + 1 * s, 11 * s, 5 * s, 5), m - 10 * s, m + 12 * s, ['#fff7c4', '#ffd23a', '#ffaa00'], '#de8500', 1.6 * s);
    uiGloss(x, m - 16 * s, T + 5 * s, 6 * s, 2 * s, -0.1, 0.7);
    x.restore();
  } else if (name === 'summon') {
    // 소환 단추: 반반 캡슐 (위 분홍, 아래 흰색) + 반짝이
    x.save(); x.translate(m, m); x.rotate(-0.35);
    var top = new Path2D(); top.moveTo(-17 * s, 0); top.arc(0, 0, 17 * s, Math.PI, 0); top.closePath();
    var bot = new Path2D(); bot.moveTo(17 * s, 0); bot.arc(0, 0, 17 * s, 0, Math.PI); bot.closePath();
    var all = uiCircle(0, 0, 17 * s); x.strokeStyle = '#7356c4'; x.lineWidth = 4.8 * s; x.stroke(all);
    uiCandy(x, top, -17 * s, 0, ['#e9dcff', '#b99ef8', '#9273e8']); uiCandy(x, bot, 0, 17 * s, ['#ffffff', '#f3edff']);
    x.fillStyle = '#7356c4'; x.fillRect(-17 * s, -1.6 * s, 34 * s, 3.2 * s);
    uiGloss(x, -7 * s, -9 * s, 6 * s, 3 * s, -0.5, 0.85);
    x.restore();
    uiSpark(x, m + 21 * s, m - 20 * s, 7 * s, '#fff3a0'); uiSpark(x, m - 22 * s, m + 16 * s, 5 * s, '#ffffff'); uiSpark(x, m + 22 * s, m + 14 * s, 3.5 * s, '#ffd6e8');
  } else gcGlyph(x, name, m, s);
  return (GC_ICON[key] = c.toDataURL());
}
// 능력, 속성 그림 (가운데 m, 배율 s). 속성: fire, ice, bolt, poison
function gcGlyph(x, name, m, s) {
  function arrow(x0, y0, x1, y1, col, w) {
    var a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
    x.save(); x.translate(x0, y0); x.rotate(a);
    [-1, 1].forEach(function (k) { var f = new Path2D(); f.moveTo(3 * s, 0); f.lineTo(-4 * s, k * 6 * s); f.lineTo(1 * s, 0); f.closePath(); uiCandy(x, f, -6 * s, 6 * s, ['#ffd6e8', '#ff86b8'], '#d23a72', 1.2 * s); });
    uiCandy(x, uiRR(0, -w / 2, L - 9 * s, w, w / 2), -w / 2, w / 2, ['#fff8e6', '#f0bd86'], '#a8703f', 1.1 * s);
    var hd = new Path2D(); hd.moveTo(L + 2 * s, 0); hd.lineTo(L - 10 * s, -6.5 * s); hd.lineTo(L - 8 * s, 0); hd.lineTo(L - 10 * s, 6.5 * s); hd.closePath();
    uiCandy(x, hd, -6.5 * s, 6.5 * s, col || ['#e9fbff', '#8fe0ff', '#4fa6e8'], '#3a6fc0', 1.4 * s);
    x.restore();
  }
  var Y = ['#fff7c4', '#ffd23a', '#ffaa00'], YL = '#de8500';
  if (name === 'fire') {
    var f = new Path2D(); f.moveTo(m, m - 26 * s); f.bezierCurveTo(m + 8 * s, m - 14 * s, m + 22 * s, m - 6 * s, m + 18 * s, m + 10 * s); f.bezierCurveTo(m + 15 * s, m + 22 * s, m + 5 * s, m + 26 * s, m, m + 26 * s);
    f.bezierCurveTo(m - 12 * s, m + 26 * s, m - 20 * s, m + 18 * s, m - 19 * s, m + 6 * s); f.bezierCurveTo(m - 18 * s, m - 4 * s, m - 10 * s, m - 6 * s, m - 9 * s, m - 14 * s); f.bezierCurveTo(m - 4 * s, m - 9 * s, m - 2 * s, m - 16 * s, m, m - 26 * s); f.closePath();
    uiCandy(x, f, m - 26 * s, m + 26 * s, ['#ffe08a', '#ff9a5c', '#ff5c6a'], '#d23a4a', 2.2 * s);
    var fi = new Path2D(); fi.moveTo(m + 1 * s, m - 4 * s); fi.bezierCurveTo(m + 10 * s, m + 4 * s, m + 10 * s, m + 18 * s, m, m + 19 * s); fi.bezierCurveTo(m - 9 * s, m + 18 * s, m - 9 * s, m + 6 * s, m + 1 * s, m - 4 * s); fi.closePath();
    uiCandy(x, fi, m - 4 * s, m + 19 * s, ['#fffbe0', '#ffe066']);
    uiGloss(x, m - 9 * s, m + 2 * s, 3 * s, 5 * s, 0.3, 0.6);
  } else if (name === 'ice' || name === 'snow') {
    x.strokeStyle = '#3a8fd6'; x.lineWidth = 8 * s;
    function flake() { for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; x.beginPath(); x.moveTo(m, m); x.lineTo(m + Math.cos(a) * 24 * s, m + Math.sin(a) * 24 * s); var bx = m + Math.cos(a) * 14 * s, by = m + Math.sin(a) * 14 * s; x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + 0.8) * 8 * s, by + Math.sin(a + 0.8) * 8 * s); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a - 0.8) * 8 * s, by + Math.sin(a - 0.8) * 8 * s); x.stroke(); } }
    flake(); x.strokeStyle = '#bfeaff'; x.lineWidth = 4 * s; flake();
    uiCandy(x, uiCircle(m, m, 6 * s), m - 6 * s, m + 6 * s, ['#ffffff', '#bfeaff'], '#3a8fd6', 1.4 * s);
  } else if (name === 'bolt' || name === 'chain') {
    var b = new Path2D(); b.moveTo(m + 6 * s, m - 27 * s); b.lineTo(m - 15 * s, m + 3 * s); b.lineTo(m - 2 * s, m + 3 * s); b.lineTo(m - 8 * s, m + 27 * s); b.lineTo(m + 16 * s, m - 6 * s); b.lineTo(m + 3 * s, m - 6 * s); b.closePath();
    uiCandy(x, b, m - 27 * s, m + 27 * s, Y, YL, 2.3 * s); uiGloss(x, m - 2 * s, m - 12 * s, 2.5 * s, 6 * s, 0.6, 0.7);
    if (name === 'chain') { uiSpark(x, m + 19 * s, m + 14 * s, 6 * s, '#fff3a0'); uiSpark(x, m - 19 * s, m - 15 * s, 5 * s, '#ffffff'); }
  } else if (name === 'poison') {
    var d = new Path2D(); d.moveTo(m, m - 26 * s); d.bezierCurveTo(m + 8 * s, m - 12 * s, m + 20 * s, m, m + 20 * s, m + 10 * s); d.bezierCurveTo(m + 20 * s, m + 22 * s, m + 10 * s, m + 27 * s, m, m + 27 * s); d.bezierCurveTo(m - 10 * s, m + 27 * s, m - 20 * s, m + 22 * s, m - 20 * s, m + 10 * s); d.bezierCurveTo(m - 20 * s, m, m - 8 * s, m - 12 * s, m, m - 26 * s); d.closePath();
    uiCandy(x, d, m - 26 * s, m + 27 * s, ['#e4ffb8', '#a6ec6a', '#5fcf6a'], '#2f8f4a', 2.2 * s);
    x.fillStyle = 'rgba(255,255,255,0.8)'; [[-6, 12, 3.4], [6, 6, 2.4], [2, 17, 1.8]].forEach(function (q) { x.beginPath(); x.arc(m + q[0] * s, m + q[1] * s, q[2] * s, 0, Math.PI * 2); x.fill(); });
    uiGloss(x, m - 8 * s, m + 2 * s, 3 * s, 6 * s, 0.4, 0.75);
  } else if (name === 'pierce') {
    // 관통: 과녁 둘을 꿰뚫는 화살
    [[-10, '#ffd6e8'], [10, '#d8c6ff']].forEach(function (q) { uiCandy(x, uiCircle(m + q[0] * s, m, 9 * s), m - 9 * s, m + 9 * s, ['#ffffff', q[1]], '#a07ad0', 1.6 * s); x.fillStyle = '#ff86b8'; x.beginPath(); x.arc(m + q[0] * s, m, 3.4 * s, 0, Math.PI * 2); x.fill(); });
    arrow(m - 28 * s, m, m + 28 * s, m, null, 4.4 * s);
  } else if (name === 'double') { arrow(m - 24 * s, m - 8 * s, m + 26 * s, m - 8 * s, null, 4 * s); arrow(m - 24 * s, m + 9 * s, m + 26 * s, m + 9 * s, null, 4 * s); }
  else if (name === 'diag') { arrow(m - 22 * s, m + 18 * s, m + 22 * s, m - 22 * s, null, 3.8 * s); arrow(m - 24 * s, m + 4 * s, m + 26 * s, m + 4 * s, null, 3.8 * s); arrow(m - 22 * s, m - 10 * s, m + 22 * s, m + 26 * s, null, 3.8 * s); }
  else if (name === 'bounce') {
    x.save(); x.setLineDash([3 * s, 4 * s]); x.strokeStyle = '#ff86b8'; x.lineWidth = 3 * s; x.beginPath(); x.moveTo(m - 24 * s, m + 18 * s); x.quadraticCurveTo(m - 8 * s, m - 24 * s, m + 4 * s, m + 14 * s); x.stroke(); x.restore();
    uiCandy(x, uiRR(m - 2 * s, m + 14 * s, 12 * s, 6 * s, 3 * s), m + 14 * s, m + 20 * s, ['#e3dcf2', '#b3a2e0'], '#7356c4', 1.2 * s);
    arrow(m + 2 * s, m + 14 * s, m + 26 * s, m - 20 * s, null, 4 * s);
  } else if (name === 'explode') {
    uiCandy(x, uiStarPath(m, m, 27 * s, 13 * s, 9), m - 27 * s, m + 27 * s, ['#fff3a0', '#ffb34d', '#ff6a4d'], '#d2503a', 2 * s);
    uiCandy(x, uiStarPath(m, m, 14 * s, 7 * s, 7), m - 14 * s, m + 14 * s, ['#ffffff', '#fff3a0']);
  } else if (name === 'shard') {
    [[0, -14, 0], [15, 6, 2.1], [-15, 7, 4.2], [4, 16, 3], [-8, -4, 5.4]].forEach(function (q, i) {
      x.save(); x.translate(m + q[0] * s, m + q[1] * s); x.rotate(q[2]); var t = new Path2D(), z = (i ? 8 : 11) * s; t.moveTo(0, -z); t.lineTo(z * 0.8, z * 0.7); t.lineTo(-z * 0.8, z * 0.7); t.closePath();
      uiCandy(x, t, -z, z, ['#ffffff', '#c9b3ff', '#9273e8'], '#6648c0', 1.4 * s); x.restore();
    });
  } else if (name === 'speed') {
    [-9, 6].forEach(function (o) { var q = new Path2D(); q.moveTo(m + o * s - 10 * s, m - 18 * s); q.lineTo(m + o * s + 9 * s, m); q.lineTo(m + o * s - 10 * s, m + 18 * s); q.lineTo(m + o * s - 3 * s, m); q.closePath(); uiCandy(x, q, m - 18 * s, m + 18 * s, ['#d2f7ea', '#86e2c6', '#4fcaa6'], '#2b9f7e', 1.8 * s); });
  } else if (name === 'range') {
    [24, 16, 8].forEach(function (r, i) { uiCandy(x, uiCircle(m, m, r * s), m - r * s, m + r * s, i % 2 ? ['#ffffff', '#ffeaf3'] : ['#ffd0e4', '#ff8fbf'], i ? null : '#d23a72', 1.8 * s); });
    uiSpark(x, m + 17 * s, m - 18 * s, 6 * s, '#fff3a0');
  } else if (name === 'crit') {
    uiCandy(x, uiStarPath(m, m, 26 * s, 9 * s, 4), m - 26 * s, m + 26 * s, ['#ffffff', '#ffd0e4', '#ff6fa8'], '#d23a72', 2 * s);
    uiSpark(x, m + 18 * s, m - 18 * s, 5 * s, '#fff3a0');
  } else if (name === 'gold') {
    uiCandy(x, uiCircle(m, m, 22 * s), m - 22 * s, m + 22 * s, ['#ffe98a', '#ffc425', '#f59f00'], '#d97f00', 2.2 * s);
    x.fillStyle = '#fff4bf'; x.fill(uiStarPath(m, m + 1 * s, 10 * s, 4.5 * s, 5)); uiGloss(x, m - 8 * s, m - 10 * s, 6 * s, 3 * s, -0.6, 0.8);
  } else {
    // power(기본): 위로 솟는 분홍 화살표
    var u = new Path2D(); u.moveTo(m, m - 26 * s); u.lineTo(m + 20 * s, m - 4 * s); u.lineTo(m + 8 * s, m - 4 * s); u.lineTo(m + 8 * s, m + 24 * s); u.lineTo(m - 8 * s, m + 24 * s); u.lineTo(m - 8 * s, m - 4 * s); u.lineTo(m - 20 * s, m - 4 * s); u.closePath();
    uiCandy(x, u, m - 26 * s, m + 24 * s, ['#ffd0e4', '#ff8fbf', '#ff6fa8'], '#d23a72', 2.2 * s); uiGloss(x, m - 4 * s, m - 10 * s, 2.5 * s, 6 * s, 0, 0.7);
  }
}
// 속성 이름
var GC_EL = { fire: '불', ice: '얼음', bolt: '번개', poison: '독' };
function gcElIcon(el, px) { return gcIcon(el === 'ice' ? 'ice' : el, px || 32); }
function gcElName(el) { return GC_EL[el] || ''; }
// 카드 → 능력 그림 이름 (card.ic 또는 card.icon이 있으면 그것, 없으면 id와 속성으로 짐작)
function gcCardGlyph(c) {
  if (!c) return 'power';
  var ic = c.ic || c.icon; if (typeof ic === 'string' && ic) return ic;
  if (c.kind === 'el' && c.el) return c.el;
  var id = String(c.id || '').toLowerCase(), M = [[/pierce|pen/, 'pierce'], [/diag|fan|spread|tri|side/, 'diag'], [/multi|double|twin|plus|extra|front/, 'double'], [/bounce|ricochet|rebound/, 'bounce'], [/explo|blast|boom|splash/, 'explode'], [/shard|frag|split|scatter/, 'shard'],
    [/chain|bolt|light|thunder/, 'chain'], [/ice|frost|snow|slow|freeze/, 'ice'], [/fire|burn|flame/, 'fire'], [/poison|toxic|venom|acid/, 'poison'], [/speed|rate|haste|fast/, 'speed'], [/range|far/, 'range'], [/crit/, 'crit'], [/gold|coin|mint/, 'gold']];
  for (var i = 0; i < M.length; i++) if (M[i][0].test(id)) return M[i][1];
  if (c.el) return c.el;
  return 'power';
}

// ---------- 시작, 막대 단추 ----------
function gcInit() {
  if (GC.inited) return; GC.inited = 1;
  document.querySelectorAll('img[data-gci]').forEach(function (im) { im.src = gcIcon(im.getAttribute('data-gci'), 64); });
  var b = $('bGacha'); if (b) b.onclick = function () { sfx('ui', 0.5); uiGacha(); };
  // 탑 칸(쟁반) 길게 누르기 → 빌드 보기
  var tr = $('tray'), lp = null;
  if (tr) {
    var clear = function () { if (lp) { clearTimeout(lp.t); lp = null; } };
    tr.addEventListener('pointerdown', function (e) {
      var el = e.target.closest && e.target.closest('.tc[data-k]'); if (!el || !G || !UI.tray || UI.tray.kind !== 'tower') return;
      clear(); lp = { x: e.clientX, y: e.clientY, t: setTimeout(function () { lp = null; UI.lpFired = 1; try { vib(15); } catch (x) { } uiBuildView(el.getAttribute('data-k')); }, 700) };
    });
    tr.addEventListener('pointermove', function (e) { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 12) clear(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (k) { tr.addEventListener(k, clear); });
    tr.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.tc')) e.preventDefault(); });
  }
}
function gcDot() { var d = $('gachaDot'); if (d) d.classList.toggle('hide', !gcFreeLeft()); }

// ---------- [BM] 소환 화면 ----------
function gcGem(px) { return '<img src="' + uiIcon('gem', px || 32) + '" alt="">'; }
function gcTk(px) { return '<img src="' + gcIcon('ticket', px || 32) + '" alt="">'; }
function gcCapsule(tid, cls) { return '<span class="gcap t-' + tid + (cls ? ' ' + cls : '') + '"><i class="ct"></i><i class="cb"></i></span>'; }
function uiGacha(back) {
  if (back !== undefined) GC.back = back || null;
  gcInit();
  var pay = gcPay1(), gems = SAVE.gems || 0, tk = SAVE.tickets || 0, pl = gcPityLeft(), T = gcTiers();
  var h = '<div class="pt">탑 소환</div><div class="gcHead"><span class="stat gem">' + gcGem(64) + '<b class="gemN">' + fmt(gems) + '</b></span><span class="stat tk">' + gcTk(64) + '<b id="gcTkN">' + tk + '</b></span></div>';
  h += '<div class="gcStage">' + T.map(function (t) { return '<span class="gcT t-' + t.id + '">' + gcCapsule(t.id) + '<b>' + t.name + '</b><em>' + gcPctTxt(t.p) + '</em></span>'; }).join('') + '</div>';
  h += '<div class="gcPity">' + (pl > 0 ? '새 탑 확정까지 ' + pl + '회' : '탑을 모두 모았습니다') + '</div>';
  h += '<div class="gcList' + (gcPool().length > 12 ? ' many' : '') + '">' + gcPool().map(function (k) {
    var o = gcOwns(k), st = gcStar(k), t = gcTierOf(k);
    return '<span class="gcI t-' + t.id + (o ? '' : ' off') + '"><img src="' + towerIconURL(k, 3, 0, 72) + '" alt="">' + (o ? '<i class="gst">' + [0, 1, 2, 3, 4].map(function (i) { return '<u class="' + (i < st ? 'on' : '') + '"></u>'; }).join('') + '</i>' : '<i class="gq">?</i>') + '</span>';
  }).join('') + '</div>';
  var one = pay === 'free' ? '<span class="bl">무료 소환</span><small>오늘 1번</small>' : '<span class="bl">1회 소환</span><small>' + (pay === 'ticket' || (!pay && tk > 0) ? gcTk() + '1' : gcGem() + GC_GEM1) + '</small>';
  h += '<div class="gcBtns"><button class="btn ' + (pay ? 'gold' : 'mute') + '" id="gc1">' + one + '</button><button class="btn ' + (gems >= GC_GEM10 ? 'gold' : 'mute') + '" id="gc10"><span class="bl">10회 소환</span><small>' + gcGem() + GC_GEM10 + '</small></button></div>';
  h += '<button class="btn sm gcProbB" id="gcProb">확률 보기</button><p class="shNote">보석은 게임 안에서만 모읍니다. 현금으로 살 수 없습니다.</p><button class="xbtn" id="gcClose">닫기</button>';
  openModal(h, 'gacha');
  $('gc1').onclick = function () {
    var p = gcPay1(); if (!p) { sfx('warn', 0.4); toast('보석이 ' + (GC_GEM1 - (SAVE.gems || 0)) + '개 모자랍니다. 소환권은 판을 처음 이기면 받습니다', 2600); return; }
    gcDo(1, p);
  };
  $('gc10').onclick = function () { if ((SAVE.gems || 0) < GC_GEM10) { sfx('warn', 0.4); toast('보석이 ' + (GC_GEM10 - (SAVE.gems || 0)) + '개 모자랍니다', 2200); return; } gcDo(10, 'gem'); };
  $('gcProb').onclick = function () { sfx('click', 0.4); uiGachaProb(); };
  $('gcClose').onclick = function () { sfx('click', 0.3); gcClose(); };
}
function gcClose() { var b = GC.back; GC.back = null; closeModal(); uiMetaDots(); if (typeof b === 'function') b(); }
function gcDo(n, pay) {
  if (GC.busy) return;
  var r = gcPull(n, pay); if (!r) { sfx('warn', 0.4); return; }
  sfx('ui', 0.6); uiGachaRes(r, n);
}
// 확률 보기: 등급별 확률, 탑마다 확률, 천장과 중복 규칙
function uiGachaProb() {
  var h = '<div class="pt">소환 확률</div><div class="gpList">';
  gcTiers().forEach(function (t) {
    h += '<div class="gpT t-' + t.id + '"><div class="gpH"><b>' + t.name + '</b><em>' + gcPctTxt(t.p) + '</em></div><div class="gpK">' +
      t.keys.map(function (k) { return '<span><img src="' + towerIconURL(k, 1, 0, 48) + '" alt=""><b>' + TOWERS[k].short + '</b><em>' + gcPctTxt(gcRateOf(k)) + '</em></span>'; }).join('') + '</div></div>';
  });
  h += '</div><ul class="gpRule"><li>새 탑 없이 9번 연속이면 10번째는 아직 없는 탑이 반드시 나옵니다</li><li>가진 탑이 또 나오면 별이 1개 오릅니다. 별마다 그 탑 피해 +6%, 최대 5개</li><li>별 5개인 탑이 또 나오면 보석 10개로 바꿔 드립니다</li><li>하루 1번 무료 소환. 소환권은 판 처음 승리, 별 3개, 오늘 임무, 보너스 게임으로 받습니다</li><li>판의 첫 승리 확정 보상으로 주는 탑은 소환 없이도 얻습니다</li><li>보석은 현금으로 살 수 없습니다</li></ul><button class="xbtn" id="gpBack">돌아가기</button>';
  openModal(h, 'gprob');
  $('gpBack').onclick = function () { sfx('click', 0.3); uiGacha(); };
}
// 소환 결과: 1회는 캡슐 하나가 흔들리다 열림, 10회는 5x2 캡슐이 한 개씩 빠르게 열림. '모두 열기'로 건너뛰기
function uiGachaRes(list, n) {
  gcStop(); GC.res = { list: list, n: n, shown: 0 };
  var one = list.length === 1, best = list.reduce(function (a, r) { return Math.max(a, r.tier === 'l' ? 2 : r.tier === 'r' ? 1 : 0); }, 0);
  var h = '<div class="pt">' + (one ? '소환 결과' : '10회 소환 결과') + '</div><div class="gcRes' + (one ? ' one' : ' ten') + ' b' + best + '">';
  list.forEach(function (r, i) {
    var T = TOWERS[r.k];
    var tag = r.isNew ? '<i class="gNew">NEW</i>' : r.gem ? '<i class="gGem">' + gcGem() + '+' + r.gem + '</i>' : '<i class="gUp">' + uiStarsHtml(r.s1, r.s0) + '</i>';
    h += '<div class="gcC t-' + r.tier + '" data-i="' + i + '"><span class="gGlow"></span>' + gcCapsule(r.tier) + '<span class="gTw"><img src="' + towerIconURL(r.k, one ? 3 : 1, 0, one ? 120 : 64) + '" alt=""></span>' + tag +
      (one ? '<span class="gNm"><em>' + gcTierOf(r.k).name + '</em><b>' + T.name + '</b></span>' : '<span class="gNm"><b>' + T.short + '</b></span>') + '</div>';
  });
  h += '</div><div class="gcSum" id="gcSum"></div><div class="mbtns gcResB"><button class="btn" id="grSkip">모두 열기</button><button class="btn gold hide" id="grAgain"></button><button class="btn hide" id="grOk">확인</button></div>';
  openModal(h, 'gres');
  $('grSkip').onclick = function () { sfx('click', 0.3); gcRevealAll(); };
  $('grOk').onclick = function () { sfx('click', 0.3); gcStop(); uiGacha(); };
  $('grAgain').onclick = function () {
    if (n === 10) { if ((SAVE.gems || 0) < GC_GEM10) { sfx('warn', 0.4); toast('보석이 ' + (GC_GEM10 - (SAVE.gems || 0)) + '개 모자랍니다', 2200); return; } gcDo(10, 'gem'); }
    else { var p = gcPay1(); if (!p) { sfx('warn', 0.4); toast('보석이 ' + (GC_GEM1 - (SAVE.gems || 0)) + '개 모자랍니다', 2200); return; } gcDo(1, p); }
  };
  var M = $('modal'); M.querySelectorAll('.gcC').forEach(function (c) { c.onclick = function () { if (!c.classList.contains('open')) gcReveal(+c.getAttribute('data-i')); }; });
  GC.busy = 1;
  // 1회: 0.75초 흔들림 뒤 열림 / 10회: 0.3초 뒤부터 0.16초마다 하나씩
  if (one) { M.querySelector('.gcC').classList.add('shake'); gcLater(function () { gcReveal(0); }, 750); }
  else list.forEach(function (r, i) { gcLater(function () { gcReveal(i); }, 300 + i * 160); });
}
function uiStarsHtml(s1, s0) { var h = ''; for (var i = 0; i < GC_STAR_MAX; i++) h += '<u class="' + (i < s1 ? 'on' : '') + (s0 != null && i >= s0 && i < s1 ? ' up' : '') + '"></u>'; return h; }
function gcLater(f, ms) { GC.timers.push(setTimeout(f, ms)); }
function gcStop() { GC.timers.forEach(clearTimeout); GC.timers = []; GC.busy = 0; }
function gcReveal(i) {
  var R = GC.res, M = $('modal'); if (!R || UI.modalKind !== 'gres') return;
  var c = M.querySelector('.gcC[data-i="' + i + '"]'); if (!c || c.classList.contains('open')) return;
  c.classList.remove('shake'); c.classList.add('open'); R.shown++;
  var r = R.list[i];
  try { sfx(r.tier === 'l' ? 'powerup' : r.tier === 'r' ? 'star' : 'click', r.tier === 'c' ? 0.35 : 0.5); if (r.tier === 'l') vib(25); } catch (e) { }
  if (r.tier !== 'c' && R.list.length === 1) uiStarBurst(c);
  if (R.shown >= R.list.length) gcDone();
}
function gcRevealAll() { var R = GC.res; if (!R) return; gcStop(); for (var i = 0; i < R.list.length; i++) gcReveal(i); gcDone(); }
function gcDone() {
  var R = GC.res; if (!R || R.done) return; R.done = 1; GC.busy = 0;
  var nw = R.list.filter(function (r) { return r.isNew; }).length, up = R.list.filter(function (r) { return !r.isNew && !r.gem; }).length, gm = R.list.reduce(function (a, r) { return a + r.gem; }, 0);
  var parts = []; if (nw) parts.push('새 탑 ' + nw + '개'); if (up) parts.push('별 +' + up); if (gm) parts.push('보석 +' + gm);
  var sm = $('gcSum'); if (sm) sm.textContent = parts.join(', ');
  var s = $('grSkip'), a = $('grAgain'), o = $('grOk');
  if (s) s.classList.add('hide'); if (o) o.classList.remove('hide');
  if (a) {
    var p = R.n === 10 ? ((SAVE.gems || 0) >= GC_GEM10 ? 'gem' : null) : gcPay1();
    a.innerHTML = '<span class="bl">한 번 더</span><small>' + (R.n === 10 ? gcGem() + GC_GEM10 : p === 'free' ? '무료' : p === 'ticket' ? gcTk() + '1' : gcGem() + GC_GEM1) + '</small>';
    a.classList.remove('hide'); a.classList.toggle('mute', !p); a.classList.toggle('gold', !!p);
  }
  uiGemsShow(false);
}

// ---------- 지역 창: 필요한 탑 칩 (ui.js openStage가 부름) ----------
function gcNeedHtml(mi) {
  var need = gcNeed(mi); if (!need.length) return '';
  var miss = need.filter(function (k) { return !gcOwns(k); });
  var h = '<div class="needRow"><span class="sub">필요한 탑</span>' + need.map(function (k) { var o = gcOwns(k); return '<span class="nd' + (o ? '' : ' off') + '"><img src="' + towerIconURL(k, 1, 0, 48) + '" alt=""></span>'; }).join('');
  if (miss.length) h += '<button class="btn sm needGo" id="needGo"><img src="' + gcIcon('summon', 48) + '" alt="">소환</button>';
  h += '</div>';
  if (miss.length) h += '<div class="needTip">없는 탑이 있어요. 속성 카드로도 이길 수 있어요</div>';
  return h;
}

// ---------- 능력 카드 창 ----------
// pick 사건이 오면 줄에 넣고, 다른 창이 없을 때 띄움(전투는 창이 떠 있는 동안 멈춤). 꼭 하나를 골라야 닫힘
var UI_PK = { q: null, busy: 0, seen: {}, cardQ: [] };
function uiPkQueue(g, e) {
  var cards = Array.isArray(e.cards) ? e.cards.filter(function (c) { return c && c.id != null; }).slice(0, 3) : [];
  cards.forEach(function (c) { UI_PK.seen[c.id] = c; });
  if (!cards.length) { uiPkFinish(g, null); return; }
  UI_PK.q = { g: g, cards: cards, start: !!e.start };
  uiPkTry();
}
function uiPkTry() {
  var q = UI_PK.q; if (!q) return;
  if (G !== q.g || q.g.over) { UI_PK.q = null; return; }
  if (UI.modalOpen || UI.scr !== 'battle' || !$('story').classList.contains('hide') || (typeof metaUI !== 'undefined' && metaUI.ad)) return;
  UI_PK.q = null; uiPkOpen(q);
}
function uiPkRare(c) { var r = +c.rare || 0; return r >= 2 ? 2 : r >= 1 ? 1 : 0; }
function uiAbBox(c, px, cls) {
  var tw = c.tower && TOWERS[c.tower] ? '<img class="abT" src="' + towerIconURL(c.tower, 1, 0, 72) + '" alt="">' : '';
  return '<span class="abBox r' + uiPkRare(c) + (cls ? ' ' + cls : '') + '"><img class="abG" src="' + gcIcon(gcCardGlyph(c), px || 96) + '" alt="">' + tw + (c.kind === 'el' && c.el ? '<img class="abE" src="' + gcElIcon(c.el, 48) + '" alt="">' : '') + '</span>';
}
// v2.3.1: 엔진 카드의 combo는 배열(comboHints)이라 빈 배열도 참 → 모든 카드에 '조합!'이 붙던 문제. 짝 카드를 이미 가진 경우에만(옛 약속의 문자열 이름도 인정)
function uiPkCombo(c) { var k = c && c.combo; if (!k) return false; if (typeof k === 'string') return true; return !!(k.some && k.some(function (h) { return h && h.has; })); }
var PK_RARE = ['일반', '희귀', '전설'];
function uiPkOpen(q) {
  trayClose(); UIS.aim = null; UI.paused = true; UI_PK.busy = 0;
  var h = '<div class="pkRib"><span>' + (q.start ? '시작 능력을 고르세요' : '능력을 고르세요') + '</span></div><div class="pkSub">' + (q.start ? '고른 능력은 이번 판 내내 이어집니다' : '3웨이브를 막을 때마다 하나씩 키웁니다') + '</div><div class="pkRow">';
  q.cards.forEach(function (c, i) {
    var r = uiPkRare(c);
    h += '<button class="pkc r' + r + '" data-i="' + i + '"><span class="pkO"><span class="pkI"><span class="pkN">' + esc(c.name || '') + '</span>' + uiAbBox(c, 96) +
      '<span class="pkR">' + PK_RARE[r] + '</span><span class="pkD">' + esc(c.desc || '') + '</span></span></span>' + (uiPkCombo(c) ? '<i class="pkCombo">조합!</i>' : '') + '</button>';
  });
  h += '</div>';
  openModal(h, 'pick');
  $('modal').querySelectorAll('.pkc').forEach(function (b) {
    b.onclick = function () {
      if (UI_PK.busy) return; UI_PK.busy = 1;
      var c = q.cards[+b.getAttribute('data-i')];
      sfx('upgrade', 0.6); try { vib(20); } catch (e) { }
      b.classList.add('chosen'); $('modal').querySelectorAll('.pkc').forEach(function (o) { if (o !== b) o.classList.add('dim'); });
      uiStarBurst(b);
      setTimeout(function () { uiPkFinish(q.g, c); }, 520);
    };
  });
}
function uiPkFinish(g, c) {
  UI_PK.busy = 0;
  if (UI.modalKind === 'pick') closeModal();
  if (!g) return;
  var ok = false;
  if (c && typeof abilityPick === 'function') { try { ok = abilityPick(g, c.id) !== false; } catch (e) { console.error(e); } }
  if (!ok || typeof abilityPick !== 'function') { g.pickWait = false; if (c) { g.attr = g.attr || {}; g.build = g.build || {}; if (c.tower) { var B = g.build[c.tower] = g.build[c.tower] || {}; B[c.id] = (B[c.id] || 0) + 1; if (c.kind === 'el' && c.el) g.attr[c.tower] = c.el; } } emit(g, 'picked', { id: c ? c.id : null }); }
  if (c) toast(T('{s} 획득', c.name || ''), 1400);
  // 카드 창 때문에 미뤄 둔 새 적 카드
  var k = UI_PK.cardQ.shift(); if (k && G === g) setTimeout(function () { if (!UI.modalOpen && G === g) enemyCard(k); }, 200);
}
// 조합 발동 연출: 화면 가운데 짧게(1.5초), 전투는 멈추지 않음
function uiComboFx(e) {
  var app = $('app'), d = document.createElement('div'); d.className = 'comboFx';
  d.innerHTML = (e.tower && TOWERS[e.tower] ? '<img src="' + towerIconURL(e.tower, 3, 0, 72) + '" alt="">' : '') + '<span><b>조합 발동!</b><em>' + esc(e.name || '') + '</em></span>';
  app.appendChild(d); try { sfx('powerup', 0.55); vib(30); } catch (x) { }
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1500);
}

// ---------- 빌드 보기: 탑 종류마다 가진 능력 카드, 단계, 속성, 발동한 조합 ----------
function uiAbDef(id) {
  var c = UI_PK.seen[id]; if (c) return c;
  var L = null;
  try { if (typeof ABILITY_CARDS !== 'undefined') L = ABILITY_CARDS; else if (typeof ABILITIES !== 'undefined') L = ABILITIES; else if (typeof CARDS !== 'undefined') L = CARDS; } catch (e) { L = null; }
  if (L) { if (Array.isArray(L)) { for (var i = 0; i < L.length; i++) if (L[i] && L[i].id === id) return L[i]; } else if (L[id]) { var o = L[id]; if (o.id == null) o.id = id; return o; } }
  return { id: id, name: String(id), desc: '', rare: 0 };
}
function uiCombosOf(g, k) {
  var C = g && g.combos, out = [];
  function add(o, id) { if (!o) return; if (typeof o === 'string') out.push({ id: id || o, name: o }); else out.push({ id: o.id || id, name: o.name || o.id || id, desc: o.desc || '' }); }
  if (Array.isArray(C)) C.forEach(function (o) { if (o && (!o.tower || o.tower === k)) add(o); });
  else if (C && typeof C === 'object') { var v = C[k]; if (Array.isArray(v)) v.forEach(function (o) { add(o); }); else if (v && typeof v === 'object') for (var id in v) add(typeof v[id] === 'object' ? v[id] : { id: id, name: (UI_PK.seen[id] && UI_PK.seen[id].name) || id }, id); }
  return out;
}
function uiBuildOf(g, k) { var B = g && g.build && g.build[k]; var o = []; if (B && typeof B === 'object') for (var id in B) { var n = +B[id] || 0; if (n > 0) o.push({ id: id, n: n, c: uiAbDef(id) }); } return o; }
// 쟁반 안 한 줄: 속성 + 카드 아이콘과 단계
function uiBuildMini(g, k) {
  var el = g && g.attr && g.attr[k], L = uiBuildOf(g, k), cm = uiCombosOf(g, k);
  if (!el && !L.length) return '';
  return '<button class="bmini" data-a="build">' + (el ? '<span class="bmEl"><img src="' + gcElIcon(el, 32) + '" alt="">' + gcElName(el) + '</span>' : '') +
    L.slice(0, 6).map(function (b) { return '<span class="bmC r' + uiPkRare(b.c) + '"><img src="' + gcIcon(gcCardGlyph(b.c), 48) + '" alt="">' + (b.n > 1 ? '<i>x' + b.n + '</i>' : '') + '</span>'; }).join('') +
    (cm.length ? '<span class="bmCo">조합 ' + cm.length + '</span>' : '') + '</button>';
}
function uiBuildView(k) {
  var g = G; if (!g) return;
  var ks = (g.towersOk || TOWER_ORDER).filter(function (q) { return TOWERS[q]; }); if (ks.indexOf(k) < 0) k = ks[0]; if (!k) return;   // 자료 없는 탑 키(옛 편성)는 빼고
  trayClose(); UI.paused = true;
  var el = g.attr && g.attr[k], L = uiBuildOf(g, k), cm = uiCombosOf(g, k), st = gcStar(k);
  var h = '<div class="pt">능력 빌드</div><div class="bvTabs">' + ks.map(function (q) { var has = (g.attr && g.attr[q]) || uiBuildOf(g, q).length; return '<button class="bvT' + (q === k ? ' on' : '') + (has ? ' has' : '') + '" data-k="' + q + '"><img src="' + towerIconURL(q, 1, 0, 48) + '" alt=""></button>'; }).join('') + '</div>';
  h += '<div class="bvHead"><img src="' + towerIconURL(k, 3, 0, 72) + '" alt=""><div><b>' + TOWERS[k].name + '</b><span class="bvTags">' + (el ? '<span class="bvEl"><img src="' + gcElIcon(el, 32) + '" alt="">' + gcElName(el) + '</span>' : '<span class="bvEl none">속성 없음</span>') +
    (st ? '<span class="bvSt">' + uiStarsHtml(st) + '</span>' : '') + '</span></div></div><div class="bvList">';
  if (!L.length) h += '<p class="bvNone">아직 이 탑의 능력 카드가 없습니다. 3웨이브를 막을 때마다 하나씩 고를 수 있어요</p>';
  L.forEach(function (b) { h += '<div class="bvC">' + uiAbBox(b.c, 64) + '<div><b>' + esc(b.c.name || b.id) + '</b>' + (b.n > 1 ? '<i class="bvN">x' + b.n + '</i>' : '') + (b.c.desc ? '<span>' + esc(b.c.desc) + '</span>' : '') + '</div></div>'; });
  h += '</div>';
  if (cm.length) h += '<div class="bvCo"><span class="sub">발동한 조합</span>' + cm.map(function (c) { return '<span class="bvCoI"><b>' + esc(c.name) + '</b></span>'; }).join('') + '</div>';
  h += '<button class="xbtn" id="bvClose">돌아가기</button>';
  openModal(h, 'build');
  $('modal').querySelectorAll('.bvT').forEach(function (b) { b.onclick = function () { sfx('click', 0.3); uiBuildView(b.getAttribute('data-k')); }; });
  $('bvClose').onclick = function () { sfx('click', 0.3); closeModal(); };
}

// ---------- 시험용 (tools/gachaflow.py, fitcheck.py) ----------
window.__gc = {
  open: function () { uiGacha(null); }, prob: function () { uiGachaProb(); }, pull: function (n, pay, r0) { return gcPull(n, pay, r0 == null ? null : function () { return r0; }); },
  res: function (n) { var L = []; for (var i = 0; i < (n || 1); i++) { var k = TOWER_ORDER[(i * 3) % TOWER_ORDER.length]; L.push({ k: k, tier: gcTierOf(k).id, isNew: i % 3 === 0, s0: 1, s1: 2, gem: i % 5 === 4 ? 10 : 0 }); } uiGachaRes(L, n || 1); },
  skip: function () { gcRevealAll(); }, roll: function (only) { return gcRoll(Math.random, only); }, rate: gcRateOf, tiers: function () { return JSON.parse(JSON.stringify(gcTiers())); },
  owned: gcOwned, missing: gcMissing, star: gcStar, starMap: gcStarMap, freeLeft: gcFreeLeft, pityLeft: gcPityLeft, migrate: function (s) { return gcMigrate(JSON.parse(JSON.stringify(s))); },
  // 가짜 능력 카드 사건: start 시작 카드, combo 조합 배지
  fakePick: function (start, combo) {
    var g = G; if (!g) return false;
    var cards = [{ id: 'pierce', kind: 'buff', tower: 'archer', el: null, name: '관통 화살', desc: '화살이 적 하나를 더 꿰뚫습니다', rare: 1, combo: combo ? '꿰뚫는 번개' : null },
      { id: 'fire_archer', kind: 'el', tower: 'archer', el: 'fire', name: '불 화살', desc: '궁수탑 공격에 불이 붙습니다', rare: 0 },
      { id: 'diag', kind: 'buff', tower: 'catapult', el: null, name: '세 갈래 돌', desc: '돌이 세 갈래로 흩어집니다', rare: 2 }];
    g.pickWait = true; g.ev.push({ t: 'pick', cards: cards, start: !!start }); return true;
  },
  fakeCombo: function () { if (!G) return false; G.ev.push({ t: 'combo', tower: 'archer', id: 'pierce_bolt', name: '꿰뚫는 번개' }); return true; },
  build: function (k) { uiBuildView(k || 'archer'); }, pickOpen: function () { return UI.modalKind === 'pick'; }
};
