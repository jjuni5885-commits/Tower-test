// ===== logic_v22.js : v2.2 전투 규칙 (딜미터 집계, 특수 기술, 무한 차원전 웨이브) =====
// 화면은 ui_v22.js. 이 파일은 노드 시험(tools/fdload.js)에서도 읽히므로 DOM을 쓰지 않는다.

// ---------- 딜미터: 탑 종류별 피해, 처치 ----------
// g.meter = { 키: { d 피해, k 처치 } }. 키는 탑 종류(archer...), 기술은 'sk:기술', 그 밖은 'etc'. hurt, killEnemy에서 부른다
function meterKey(src) { return src && src.tw ? src.tw.k : src && src.sk ? 'sk:' + src.sk : 'etc'; }
function meterAdd(g, src, d, k) {
  if (!g.meter) g.meter = {};
  var key = meterKey(src), m = g.meter[key] || (g.meter[key] = { d: 0, k: 0 });
  if (d > 0) m.d += d; if (k) m.k += k;
}
// 정렬된 목록 [{ key, d, k, n(그 종류 탑 수) }]
function meterList(g, by) {
  var a = [], m = g.meter || {}, n = {};
  g.towers.forEach(function (t) { n[t.k] = (n[t.k] || 0) + 1; });
  for (var key in m) if (m[key].d > 0 || m[key].k > 0) a.push({ key: key, d: m[key].d, k: m[key].k, n: n[key] || 0 });
  a.sort(function (p, q) { return by === 'k' ? q.k - p.k || q.d - p.d : q.d - p.d || q.k - p.k; });
  return a;
}

// ---------- 특수 기술 (화살비, 방책, 최후의 화살 말고 고르는 기술) ----------
// 전투 전에 SK2_SLOTS칸까지 고른다(SAVE.sk2). g.sk[키] = { cd } 로 들어가 기본 기술과 같은 재사용 시간 흐름을 탄다
// aim: 'circle'(r) 원 겨누기, 없으면 누르자마자 발동. need: 열리는 판(그 판을 이기면 열림)
var SK2 = {
  blizzard: { name: '얼음 폭풍', cd: 32, aim: 'circle', r: 2.0, need: 'c1s02', col: '#9fe2ff', desc: '넓은 곳을 얼려 5초 동안 크게 느리게 하고 냉기 피해를 준다.' },
  meteor: { name: '운석 낙하', cd: 45, aim: 'circle', r: 1.6, need: 'c1s04', col: '#ff8a3a', desc: '1초 뒤 겨눈 곳에 운석이 떨어져 큰 폭발 피해를 준다.' },
  thunder: { name: '천둥 벼락', cd: 38, need: 'c1s05', col: '#ffe066', desc: '가장 강한 적 6마리에게 벼락을 내려 큰 피해를 주고 잠깐 멈춘다. 숨은 적도 맞는다.' },
  eye: { name: '꿰뚫는 눈', cd: 40, need: 'c1s06', col: '#c79bff', desc: '12초 동안 숨은 적을 모두 드러내고, 모든 적이 받는 피해 +25%.' },
  goldrush: { name: '황금비', cd: 60, need: 'c1s07', col: '#ffcf3a', desc: '15초 동안 적을 쓰러뜨리면 금화를 두 배로 받는다.' },
  mend: { name: '성문 수리', cd: 70, need: 'c1s09', col: '#7dffa6', desc: '생명을 5 되찾는다(처음 생명까지).' },
  timestop: { name: '시간 정지', cd: 90, need: 'c1s11', col: '#a8b4ff', desc: '모든 적을 3초 동안 멈춘다. 우두머리는 1초.' }
};
var SK2_ORDER = ['blizzard', 'meteor', 'thunder', 'eye', 'goldrush', 'mend', 'timestop'];
var SK2_SLOTS = 2;
function sk2Cd(g, k) { return SK2[k].cd * (1 + (g.R.skCd || 0)); }
function sk2Pow(g) { return 1 + 0.12 * Math.max(0, g.wave - 1); }   // 웨이브가 깊을수록 기술도 세짐(화살비와 같은 방식)
function sk2Init(g, list) {
  g.sk2 = []; g.sk2T = { eye: 0, gold: 0 }; g.sk2Q = [];
  (list || []).forEach(function (k) { if (SK2[k] && g.sk2.indexOf(k) < 0 && g.sk2.length < SK2_SLOTS) { g.sk2.push(k); g.sk[k] = { cd: 0 }; } });
}
function sk2Live(g) { var a = []; for (var i = 0; i < g.enemies.length; i++) { var e = g.enemies[i]; if (!e.dead && !e.untarget && e.hp > 0) a.push(e); } return a; }
// 발동. 성공하면 true. x, y는 원 겨누기 기술만 씀
function sk2Cast(g, k, x, y) {
  var S = SK2[k], s = g.sk[k]; if (!S || !s || s.cd > 0 || g.over) return false;
  var P = sk2Pow(g), src = { sk: k };
  if (k === 'blizzard') {
    sk2Live(g).forEach(function (e) { if (d2(e.x, e.y, x, y) <= S.r * S.r) { slowE(e, 0.6, 5); hurt(g, e, 30 * P, 'magic', src, false, { el: 'ice' }); } });
    g.zones.push({ kind: 'sk2ice', x: x, y: y, r: S.r, t: 5, T: 5, slow: 0.6 });
  } else if (k === 'meteor') {
    g.sk2Q.push({ k: 'meteor', at: g.t + 1.0, x: x, y: y, r: S.r, dmg: 260 * P });
  } else if (k === 'thunder') {
    var L = sk2Live(g).sort(function (a, b) { return b.hp - a.hp; }).slice(0, 6), pts = [];
    L.forEach(function (e) { e.revealed = 1; hurt(g, e, 210 * P, 'magic', src, false, { el: 'shock' }); stunE(e, 0.6); pts.push({ x: e.x, y: e.y }); });
    emit(g, 'sk2', { k: k, pts: pts });
    s.cd = sk2Cd(g, k); return true;
  } else if (k === 'eye') { g.sk2T.eye = 12; }
  else if (k === 'goldrush') { g.sk2T.gold = 15; }
  else if (k === 'mend') { if (g.lives >= g.maxLives) return false; g.lives = Math.min(g.maxLives, g.lives + 5); }
  else if (k === 'timestop') { sk2Live(g).forEach(function (e) { stunE(e, e.boss ? 4 : 3, true); }); }   // 우두머리는 stunE 안에서 1/4
  s.cd = sk2Cd(g, k);
  emit(g, 'sk2', { k: k, x: x, y: y, r: S.r || 0, gx: g.gate.x, gy: g.gate.y });
  return true;
}
// 매 프레임(logic.js update에서 부름): 지속 효과, 늦게 터지는 운석
function sk2Tick(g, dt) {
  if (!g.sk2T) return;
  if (g.sk2T.eye > 0) { g.sk2T.eye -= dt; for (var i = 0; i < g.enemies.length; i++) { var e = g.enemies[i]; if (e.dead) continue; if (e.stealth) e.revealed = 1; e.markT = Math.max(e.markT || 0, 0.25); e.markA = Math.max(e.markA || 0, 0.25); } }
  if (g.sk2T.gold > 0) g.sk2T.gold -= dt;
  for (var q = g.sk2Q.length - 1; q >= 0; q--) {
    var Q = g.sk2Q[q]; if (g.t < Q.at) continue; g.sk2Q.splice(q, 1);
    sk2Live(g).forEach(function (e) { var dd = d2(e.x, e.y, Q.x, Q.y); if (dd <= Q.r * Q.r) hurt(g, e, Q.dmg * (1 - 0.4 * Math.sqrt(dd) / Q.r), 'expl', { sk: 'meteor' }, false, { el: 'fire' }); });
    emit(g, 'blast', { x: Q.x, y: Q.y, r: Q.r, k: 'sky' }); emit(g, 'sk2', { k: 'meteorHit', x: Q.x, y: Q.y, r: Q.r });
  }
  for (var z = g.zones.length - 1; z >= 0; z--) { var Z = g.zones[z]; if (Z.kind !== 'sk2ice') continue; for (var j = 0; j < g.enemies.length; j++) { var o = g.enemies[j]; if (!o.dead && d2(o.x, o.y, Z.x, Z.y) <= Z.r * Z.r) slowE(o, Z.slow, 0.4); } }
}
function sk2GoldMul(g) { return g.sk2T && g.sk2T.gold > 0 ? 2 : 1; }

// ---------- 무한 차원전 (모든 빌런이 차례로 나오는 무한 모드, 주마다 같은 웨이브) ----------
// 판: 삼면 전선(c3s11, 땅 길 둘, 뱃길, 항로)을 빌려 규칙 없이 씀. 난이도 키 'arena'(DIFFS.arena)
// 웨이브 0~9 1장 적, 10~19 2장, 20~29 3장, 30~39 4장, 40부터 모든 적. 장마다 첫 웨이브에 그 장 적을 모두, 5, 8, 10번째에 그 장 우두머리를 모두. 41부터 5웨이브마다 아무 우두머리 둘
var AR_MAP = 'c3s11';
DIFFS.arena = { name: '무한 차원전', hp: 1.0, lives: 20, gold: 1.0, extra: 0, endless: 1, arena: 1, starMax: 0 };
function arWeek(now) { var d = now ? new Date(now) : new Date(), t = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()), day = (new Date(t).getUTCDay() + 6) % 7, mon = new Date(t - day * 864e5); return mon.getUTCFullYear() + '-' + ('0' + (mon.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + mon.getUTCDate()).slice(-2); }
function arMi() { for (var i = 0; i < MAPS.length; i++) if (MAPS[i].id === AR_MAP) return i; return -1; }
// 판 모양은 그대로, 이름, 규칙, 적 목록만 무한 차원전용으로 바꾼 복사본
function arPrep(mi) {
  var M0 = MAPS[mi], M = {}; for (var k in M0) M[k] = M0[k];
  M.name = '무한 차원전'; M.region = '모든 차원의 경계'; M.rule = null; M.ruleName = ''; M.ruleDesc = ''; M.boss = null; M.intro = {}; M.arena = 1;
  M.pool = arPool(M0, 0); M.desc = '';
  return M;
}
var _arAll = null;
function arAllowed() {
  if (_arAll) return _arAll;
  var s = {}; MAPS.forEach(function (M) { (M.pool || []).forEach(function (k) { s[k] = 1; }); });
  _arAll = Object.keys(ENEMIES).filter(function (k) { var E = ENEMIES[k]; return s[k] && !E.boss && !E.hidden && k.indexOf('fd') !== 0; });
  return _arAll;
}
function arCh(i) { return i < 40 ? 1 + Math.floor(i / 10) : 0; }   // 0 = 모든 장
function arPool(M, ch) { return arAllowed().filter(function (k) { var E = ENEMIES[k]; return (!ch || (E.ch || 1) === ch) && fdRouteN(M, E) > 0; }); }
function arBosses(M, ch) { return Object.keys(ENEMIES).filter(function (k) { var E = ENEMIES[k]; return E.boss && (!ch || (E.ch || 1) === ch) && fdRouteN(M, E) > 0 && k !== 'barkan'; }); }
function arWave(g, i) {
  var mi = g.mi, M0 = MAPS[mi], ch = arCh(i), pool = arPool(M0, ch), keep = { pool: M0.pool, intro: M0.intro, boss: M0.boss, rule: M0.rule, bud: M0.bud }, w;
  M0.pool = pool.length ? pool : arPool(M0, 0); M0.intro = {}; M0.boss = null; M0.rule = null; M0.bud = AR_BUD;
  try { w = makeWave(mi, Math.min(i, 40), 999, g.wrnd, 'endless'); } finally { M0.pool = keep.pool; M0.intro = keep.intro; M0.boss = keep.boss; M0.rule = keep.rule; M0.bud = keep.bud; }
  // 새 장에 들어선 첫 웨이브는 그 장의 적을 모두 한 번씩 보여 줌
  if (((i % 10 === 0 && i > 0) || i === 2) && ch) pool.forEach(function (k, n) { var E = ENEMIES[k]; w.groups.push({ type: k, n: E.hp >= 400 || i < 10 ? 1 : 2, gap: 1.0, delay: 3 + n * 1.6, path: n % Math.max(1, fdRouteN(M0, E)) }); });
  var extra = 1 + Math.max(0, i - 20) * 0.05;
  w.groups.forEach(function (q) { q.n = Math.min(60, Math.round(q.n * extra)); });
  // 우두머리: 2장부터 장마다 5, 8, 10번째 웨이브에 그 장의 우두머리를 약한 순서로 나눠 모두 내보냄. 41웨이브부터는 5웨이브마다 아무 우두머리 둘
  var bl = [];
  if (ch === 1) { if (i === 9) bl = arBosses(M0, 1).sort(function (p, q) { return ENEMIES[p].hp - ENEMIES[q].hp; }).slice(0, 1); }   // 첫 10웨이브는 몸풀기: 가장 약한 우두머리 하나만(나머지 1장 우두머리는 41웨이브부터 섞여 나옴)
  else if (ch && (i % 10 === 4 || i % 10 === 7 || i % 10 === 9)) {
    var bs = arBosses(M0, ch).sort(function (p, q) { return ENEMIES[p].hp - ENEMIES[q].hp; }), part = i % 10 === 4 ? 0 : i % 10 === 7 ? 1 : 2, n3 = bs.length, sz = [Math.floor(n3 / 3), 0, 0];
    sz[1] = Math.floor((n3 - sz[0]) / 2); sz[2] = n3 - sz[0] - sz[1];
    var st0 = part === 0 ? 0 : part === 1 ? sz[0] : sz[0] + sz[1]; bl = bs.slice(st0, st0 + sz[part]);
  } else if (!ch && i % 5 === 4) { var all = arBosses(M0, 0); for (var b2 = 0; b2 < 2; b2++) bl.push(all[Math.floor(g.wrnd() * all.length)]); }
  bl.forEach(function (bk, b) { var BE = ENEMIES[bk]; w.groups.push({ type: bk, n: 1, gap: 1, delay: 6 + b * 9, path: b % Math.max(1, fdRouteN(M0, BE)), boss: 1 }); });
  w.ch = ch;
  return w;
}
// 체력: 30웨이브까지는 보통 판 곡선, 21웨이브부터 웨이브마다 12%씩 곱으로 더 세짐(끝없이 버티는 덱이 없게)
function arHp(g, i) { return hpScale(g.mi, Math.min(i, 30), 'normal') * AR_HPMUL * Math.pow(AR_GROW, Math.max(0, i - 20)); }
var AR_HPMUL = 1, AR_GROW = 1.12, AR_BUD = 1.95;   // 웨이브 양은 삼면 전선과 같게
// 기록 점수: 버틴 웨이브가 먼저, 같으면 처치 수
function arScore(w, k) { return w * 100000 + Math.min(99999, k || 0); }
// 친구에게 보내는 기록 확인 코드(같은 주, 같은 기록이면 같은 코드. 손으로 고친 기록을 가려내는 정도)
function arCode(week, w, k, name) { var h = hashStr('TFX|' + week + '|' + w + '|' + k + '|' + (name || '')) >>> 0; return ('00000' + (h % 0xFFFFFF).toString(16).toUpperCase()).slice(-6); }
