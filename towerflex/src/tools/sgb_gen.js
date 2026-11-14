// STGB 판 생성기: node tools/sgb_gen.js [ascii]
// tools/sgb_ch3.js, tools/sgb_ch4.js(길, 물, 항로, 규칙, 이야기 정의) → src/stages_ch3.js, src/stages_ch4.js (격자 글자를 길에서 자동으로 만들어 길과 격자가 항상 맞는다)
// 판을 고칠 때는 정의 파일을 고치고 이 도구를 다시 돌린다. 생성된 파일을 손으로 고쳤다면 다시 돌리지 말 것
const fs = require('fs'), path = require('path');
const COLS = 10, ROWS = 17;
function rng(seed) { let s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function raster(wps, fn) {
  for (let i = 1; i < wps.length; i++) {
    const a = wps[i - 1], b = wps[i], sx = Math.sign(b[0] - a[0]), sy = Math.sign(b[1] - a[1]); let x = a[0], y = a[1];
    if (sx && sy) throw new Error('대각선 구간 ' + JSON.stringify(a) + ' → ' + JSON.stringify(b));
    for (;;) { if (x >= 0 && x < COLS && y >= 0 && y < ROWS) fn(x, y); if (x === b[0] && y === b[1]) break; x += sx; y += sy; }
  }
}
function makeGrid(D) {
  const G = []; for (let r = 0; r < ROWS; r++) G.push(new Array(COLS).fill('.'));
  const errs = [];
  (D.water || []).forEach(q => { for (let r = q[1]; r <= q[3]; r++) for (let c = q[0]; c <= q[2]; c++) G[r][c] = '~'; });
  (D.land || []).forEach(q => { for (let r = q[1]; r <= q[3]; r++) for (let c = q[0]; c <= q[2]; c++) G[r][c] = '.'; });
  const seaSet = {};
  (D.sea || []).forEach(w => raster(w, (x, y) => { G[y][x] = '~'; seaSet[x + ',' + y] = 1; }));
  D.paths.forEach(w => raster(w, (x, y) => { if (seaSet[x + ',' + y]) errs.push('땅 길과 뱃길이 겹침 ' + x + ',' + y); G[y][x] = '='; }));
  const gate = D.paths[0][D.paths[0].length - 1];
  D.paths.forEach((w, i) => { const e = w[w.length - 1]; if (e[0] !== gate[0] || e[1] !== gate[1]) errs.push('길 ' + i + ' 끝이 성문이 아님'); });
  G[gate[1]][gate[0]] = 'G';
  const isPath = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && (G[r][c] === '=' || G[r][c] === 'G');
  const nearPath = (c, r) => isPath(c - 1, r) || isPath(c + 1, r) || isPath(c, r - 1) || isPath(c, r + 1);
  (D.rocks || []).forEach(p => { if (G[p[1]][p[0]] === '.') G[p[1]][p[0]] = '#'; else errs.push('바위 자리가 풀밭이 아님 ' + p); });
  (D.put || []).forEach(p => {
    if (p[0] === 'C') { [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(o => { if (G[p[2] + o[1]][p[1] + o[0]] !== '.') errs.push('큰 장애물 자리 ' + p); G[p[2] + o[1]][p[1] + o[0]] = 'C'; }); }
    else { if (G[p[2]][p[1]] !== '.') errs.push('장애물 자리가 풀밭이 아님 ' + p); G[p[2]][p[1]] = p[0]; }
  });
  // 자동 배치: 바위 조금(길 옆 명당을 줄임), 장애물(부수면 금화, 길 옆에 절반쯤), 보물 상자 1
  const R = rng(hash(D.id + ':obs'));
  const free = () => { const o = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (G[r][c] === '.' && Math.abs(c - gate[0]) + Math.abs(r - gate[1]) > 1) o.push([c, r]); return o; };
  const pick = (list) => list.splice(Math.floor(R() * list.length), 1)[0];
  const land0 = free().length;
  const nRock = D.autoRocks != null ? D.autoRocks : Math.round(land0 * 0.035), nObs = D.autoObs != null ? D.autoObs : Math.round(land0 * 0.1);
  let L = free().filter(p => !nearPath(p[0], p[1]) || R() < 0.35);
  for (let i = 0; i < nRock && L.length; i++) { const p = pick(L); G[p[1]][p[0]] = '#'; }
  L = free(); const near = L.filter(p => nearPath(p[0], p[1])), far = L.filter(p => !nearPath(p[0], p[1]));
  const kinds = ['a', 'b', 'a', 'c', 'a', 'b', 'c', 'a', 'b', 'a', 'c', 'b', 'a', 'a', 'b', 'c'];
  if (D.chest !== 0 && far.length) { const p = pick(far); G[p[1]][p[0]] = 'd'; }
  for (let i = 0; i < nObs; i++) { const src = (i % 2 === 0 && near.length) ? near : (far.length ? far : near); if (!src.length) break; const p = pick(src); G[p[1]][p[0]] = kinds[i % kinds.length]; }
  return { grid: G.map(r => r.join('')), errs, gate };
}
function js(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return '[' + v.map(js).join(', ') + ']';
  return '{ ' + Object.keys(v).map(k => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : js(k)) + ': ' + js(v[k])).join(', ') + ' }';
}
function emit(CH) {
  const out = [], asc = [];
  out.push('// ===== ' + CH.file + ' : ' + CH.title + ' =====');
  CH.head.forEach(l => out.push('// ' + l));
  out.push('// 이 파일은 tools/sgb_gen.js가 ' + CH.def + ' 정의에서 만든다(격자는 길에서 자동 생성). 고칠 때는 정의를 고치고 node tools/sgb_gen.js');
  Object.keys(CH.speakers).forEach(k => out.push('SPEAKERS.' + k + ' = ' + js(CH.speakers[k]) + ';'));
  let bad = 0;
  CH.maps.forEach((D, i) => {
    const no = i + 1, id = 'c' + CH.ch + 's' + (no < 10 ? '0' : '') + no; D.id = id;
    const M = makeGrid(D);
    if (M.errs.length) { bad++; console.error(id, M.errs.join(' / ')); }
    let s = 'MAPS.push({ id: ' + js(id) + ', ch: ' + CH.ch + ', no: ' + no + ', name: ' + js(D.name) + ', region: ' + js(D.region) + ', theme: ' + js(D.theme) + ', cols: ' + COLS + ', rows: ' + ROWS + ',\n';
    s += '  grid: ' + js(M.grid) + ',\n';
    s += '  paths: ' + js(D.paths) + ',' + (D.sea ? '\n  sea: ' + js(D.sea) + ',' : '') + (D.air ? '\n  air: ' + js(D.air) + ',' : '') + '\n';
    s += '  waves: ' + D.waves + ', gold: ' + D.gold + ', hpMul: ' + D.hpMul + ', bud: ' + D.bud + (D.late ? ', late: ' + D.late : '') + ', pool: ' + js(D.pool) + ', intro: ' + js(D.intro || {}) + ', boss: ' + js(D.boss || null) + ',' + (D.focus ? ' focus: ' + js(D.focus) + ', focusK: ' + (D.focusK || 0.3) + ',' : '') + '\n';
    s += '  rule: ' + js(D.rule || null) + ', ruleName: ' + js(D.ruleName || '') + ', ruleDesc: ' + js(D.ruleDesc || '') + ',\n';
    s += '  need: ' + js(D.need || []) + ', reward: ' + js(D.reward || null) + ', desc: ' + js(D.desc) + ' });';
    out.push(s);
    asc.push(id + ' ' + D.name + ' [' + D.theme + '] rule ' + (D.rule ? D.rule.id : '-') + '\n   0123456789\n' + M.grid.map((r, ri) => (ri < 10 ? ' ' : '') + ri + ' ' + r).join('\n'));
  });
  out.push('// ---- 이야기 (작전 브리핑 2~4줄, 챕터 시작 c' + CH.ch + 'in, 결말 c' + CH.ch + 'end) ----');
  Object.keys(CH.story).forEach(k => out.push('STORY.' + k + ' = ' + js(CH.story[k]) + ';'));
  CH.maps.forEach(D => { if (!D.story) { bad++; console.error(D.id, '이야기 없음'); } else out.push('STORY.' + D.id + ' = ' + js(D.story) + ';'); });
  fs.writeFileSync(path.join(__dirname, '..', 'src', CH.file), out.join('\n') + '\n');
  return { bad, asc };
}
// need 검사: 그 판에 필요한 탑은 시작 탑이거나 앞 판들의 확정 보상이어야 한다 (1, 2장 보상은 BRIEFS 권장 순서 기준)
const OWN0 = ['archer', 'catapult', 'flak', 'frost', 'ballista', 'gatling', 'warship', 'barracks', 'sam', 'arcane', 'bell', 'jangseung', 'shrine', 'tesla'];
function needCheck(list) {
  const own = OWN0.slice(); let n = 0;
  list.forEach(CH => CH.maps.forEach(D => {
    (D.need || []).forEach(k => { if (own.indexOf(k) < 0) { n++; console.error(D.id, 'need 탑을 아직 못 받음:', k); } });
    if (D.rule && D.rule.id === 'ban') (D.need || []).forEach(k => { if (D.rule.kinds.indexOf(k) >= 0) { n++; console.error(D.id, 'need 탑이 금지 목록에 있음:', k); } });
    if (D.reward && D.reward.tower) { if (own.indexOf(D.reward.tower) >= 0) { n++; console.error(D.id, '이미 받은 탑을 또 줌:', D.reward.tower); } own.push(D.reward.tower); }
  }));
  return n;
}
let bad = 0; const loaded = [];
['./sgb_ch3.js', './sgb_ch4.js'].forEach(f => {
  if (!fs.existsSync(path.join(__dirname, f))) return;
  const CH = require(f); loaded.push(CH); const r = emit(CH); bad += r.bad;
  if (process.argv[2] === 'ascii') console.log(r.asc.join('\n\n'));
});
bad += needCheck(loaded);
console.log(bad ? '오류 ' + bad + '건' : '생성 완료');
process.exit(bad ? 1 : 0);
