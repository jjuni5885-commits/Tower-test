// ENG2 시험 도구 공용 (tw2test.js, tw2dps.js): 논리 파일을 올리고 시험용 판과 허수아비 적을 준비한다
// const ctx = require('./tw2lib.js')();  → ctx.run(코드)
// 판을 찾는 곳은 여기 tw2Stage 한 군데뿐이다. 실제 판(stages_chN.js)으로 바꾸고 싶으면 tw2Stage 안의 한 줄만 고치면 된다.
module.exports = function (root) {
  const ctx = require('./fdload.js')(root);
  ctx.run(`
// 시험용 판 'tw2lab': 땅 길(3열), 뱃길(6열, 물 5~7열), 항로(4열 위 직선). 땅 탑 자리 (4, r), 수상 탑 자리 (5, r)과 (7, r)
var TW2_LAB = { id: 'tw2lab', ch: 9, no: 99, name: '탑 시험장', region: '시험장', theme: 'meadow', cols: 10, rows: 17,
  grid: (function () { var a = []; for (var r = 0; r < 17; r++) a.push(r === 16 ? '...G.~~~..' : '...=.~~~..'); return a; })(),
  paths: [[[3, -2], [3, 16]]], sea: [[[6, -2], [6, 16]]], air: [[4, -2, 4, 18]],
  waves: 6, gold: 500, hpMul: 1, bud: 1, pool: ['goblin', 'orc'], intro: {}, boss: null, rule: null, need: [], reward: null, desc: '' };
// kind: 'land' | 'sea' | 'air' | 'all' → 판 번호. 지금은 어느 영역이든 시험용 판 하나를 돌려준다 (실제 판으로 바꾸려면 이 함수만 고칠 것)
function tw2Stage(kind) {
  for (var i = 0; i < MAPS.length; i++) if (MAPS[i].id === 'tw2lab') return i;
  MAPS.push(TW2_LAB); return MAPS.length - 1;
}
// 실제 판 가운데 영역이 맞는 첫 판 (봇 완주 시험용). 없으면 -1
function tw2RealStage(kind) {
  for (var i = 0; i < MAPS.length; i++) { var M = MAPS[i]; if (M.id === 'tw2lab') continue; if (kind === 'sea' ? M.sea && M.sea.length : kind === 'air' ? M.air && M.air.length : true) return i; }
  return -1;
}
// 허수아비 적: 움직이지 않고 체력이 아주 많다 (피해 측정용). tw2DumG 땅, tw2DumA 하늘, tw2DumS 바다, tw2DumArm 갑옷 0.6
ENEMIES.tw2DumG = { name: '허수아비', art: 'orc', hp: 1e7, spd: 0, gold: 0, leak: 0, size: 0.7, dom: 'g', desc: '' };
ENEMIES.tw2DumA = { name: '허수아비(하늘)', art: 'bat', hp: 1e7, spd: 0, gold: 0, leak: 0, size: 0.7, dom: 'a', fly: 1, desc: '' };
ENEMIES.tw2DumS = { name: '허수아비(바다)', art: 'orc', hp: 1e7, spd: 0, gold: 0, leak: 0, size: 0.7, dom: 's', desc: '' };
ENEMIES.tw2DumArm = { name: '허수아비(갑옷)', art: 'knight', hp: 1e7, spd: 0, gold: 0, leak: 0, size: 0.7, dom: 'g', armor: 0.6, desc: '' };
var TW2_CELL = { land: [4, 8], water: [5, 8], land2: [4, 9], water2: [5, 9] };
function tw2Game(opts) { var o = { cards: false, fuse: 1, admin: 1, maxLv: 6 }; for (var k in opts || {}) o[k] = opts[k]; var g = newGame(tw2Stage('all'), 'normal', o); g.gold = 1e8; g.waiting = false; g.wave = 1; return g; }
// 탑을 시험 자리에 짓고 lvl, br까지 올림 (합체 탑, 관리자 탑은 바로 지음)
function tw2Build(g, k, lvl, br, cell) {
  var c = cell || TW2_CELL[fdSite(k) === 'water' ? 'water' : 'land'], t = buildTower(g, k, c[0], c[1], true); if (!t) return null;
  var guard = 0; while (t.lvl < (lvl || 1) && guard++ < 9) if (!upgradeTower(g, t, br || 0)) break;
  return t;
}
// 허수아비를 탑 옆줄(y = 8.5)에 세움. dom: 'g' | 'a' | 's', n명을 0.4칸 간격으로
function tw2Dummies(g, dom, n, key) {
  var out = [], k = key || (dom === 'a' ? 'tw2DumA' : dom === 's' ? 'tw2DumS' : 'tw2DumG');
  for (var i = 0; i < (n || 1); i++) { var e = spawnEnemy(g, k, 0, 10 + (i - ((n || 1) - 1) / 2) * 0.4, { off: 0 }); e.mhp = 300; e.hp0 = e.hp; out.push(e); }   // 최대 체력은 보통 적만큼(병사가 받는 피해가 정상), 실제 체력은 아주 많게
  return out;
}
function tw2Run(g, sec, fn) { var n = Math.round(sec / DT); for (var i = 0; i < n; i++) { stepGame(g, DT); if (fn && fn(g) === true) return true; g.ev.length = 0; } return false; }
function tw2Lost(L) { var s = 0; L.forEach(function (e) { s += e.hp0 - e.hp; }); return s; }
// 탑 하나의 초당 피해(허수아비가 잃은 체력 기준이라 화상, 독, 장판도 들어감): warm초 달군 뒤 sec초 평균
function tw2Dps(k, lvl, br, dom, n, key, sec) {
  var g = tw2Game(), t = tw2Build(g, k, lvl, br); if (!t) return -1;
  if (TOWERS[k].fusion || TOWERS[k].admin) { t.lvl = lvl; refreshStats(g); }
  var L = tw2Dummies(g, dom, n, key); tw2Run(g, 6); var a = tw2Lost(L); tw2Run(g, sec || 24); return (tw2Lost(L) - a) / (sec || 24);
}
function tw2Cost(k, lvl, br) { var s = 0; for (var i = 0; i < lvl; i++) s += i === 0 ? TOWERS[k].lv[0].cost : upgCost(k, i, br); return s; }
`);
  return ctx;
};
