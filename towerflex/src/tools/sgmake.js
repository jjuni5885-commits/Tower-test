// 판 초안 생성기(STGA): node tools/sgmake.js [print|write]
//   길(paths), 뱃길(sea), 지형 네모(water, rock, lava), 큰 장애물(big)에서 grid 17줄을 만들고 src/stages_ch1.js, stages_ch2.js를 쓴다.
//   print: 격자를 글자로 보여 주기만 함. write: 판 파일을 다시 씀.
// 주의: 판 파일(src/stages_chN.js)이 원본이다. write는 판 파일을 통째로 덮어쓰므로, 판 파일에서 수치를 손봤다면 tools/sgdata.js에도 같이 반영한 뒤 돌릴 것.
const fs = require('fs'), path = require('path');
const D = require('./sgdata.js');
const COLS = 10, ROWS = 17;
function rng(seed) { let s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function raster(wps, fn) {
  for (let i = 1; i < wps.length; i++) {
    const a = wps[i - 1], b = wps[i]; if (a[0] !== b[0] && a[1] !== b[1]) throw new Error('대각선 길 ' + JSON.stringify([a, b]));
    const sx = Math.sign(b[0] - a[0]), sy = Math.sign(b[1] - a[1]); let x = a[0], y = a[1];
    for (;;) { if (x >= 0 && x < COLS && y >= 0 && y < ROWS) fn(x, y); if (x === b[0] && y === b[1]) break; x += sx; y += sy; }
  }
}
function makeGrid(S) {
  const g = []; for (let r = 0; r < ROWS; r++) g.push(new Array(COLS).fill('.'));
  const warn = [];
  const rect = (list, ch) => (list || []).forEach(q => { const [c0, r0, c1, r1] = q.length === 2 ? [q[0], q[1], q[0], q[1]] : q; for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = ch; });
  rect(S.water, '~'); rect(S.land, '.'); rect(S.lava, 'L'); rect(S.rock, '#');
  (S.sea || []).forEach(w => raster(w, (x, y) => { g[y][x] = '~'; }));
  const isPath = {};
  S.paths.forEach(w => raster(w, (x, y) => { g[y][x] = '='; isPath[y * COLS + x] = 1; }));
  (S.sea || []).forEach(w => raster(w, (x, y) => { if (isPath[y * COLS + x]) warn.push('뱃길이 땅 길과 겹침 ' + x + ',' + y); }));
  const gate = S.paths[0][S.paths[0].length - 1]; g[gate[1]][gate[0]] = 'G';
  S.paths.forEach(w => { const e = w[w.length - 1]; if (e[0] !== gate[0] || e[1] !== gate[1]) warn.push('길 끝이 성문과 다름'); });
  // 큰 장애물(2 x 2)
  (S.big || []).forEach(q => { for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) { if (g[q[1] + dr][q[0] + dc] !== '.') warn.push('큰 장애물 자리가 비어 있지 않음 ' + q); g[q[1] + dr][q[0] + dc] = 'C'; } });
  // 손으로 고른 장애물과 보물
  (S.put || []).forEach(q => { if (g[q[2]][q[1]] !== '.') warn.push('장애물 자리가 비어 있지 않음 ' + q); g[q[2]][q[1]] = q[0]; });
  // 나머지는 씨앗 난수로 흩뿌림: 절반은 길 옆(명당을 막아 부수게), 절반은 아무 데나. 서로 붙지 않게
  const rnd = rng(hash(S.id) ^ (S.seed || 0));
  const nearPath = (c, r) => { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && (g[rr][cc] === '=' || g[rr][cc] === 'G')) return true; } return false; };
  const nearObs = (c, r) => { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && /[a-jC]/.test(g[rr][cc])) return true; } return false; };
  const want = (S.obs == null ? 'aaaaabbbccd' : S.obs).split('');
  want.forEach((ch, i) => {
    for (let tries = 0; tries < 400; tries++) {
      const c = Math.floor(rnd() * COLS), r = Math.floor(rnd() * (ROWS - 1));
      if (g[r][c] !== '.' || nearObs(c, r)) continue;
      const np = nearPath(c, r); if ((i % 2 === 0) !== np && tries < 200) continue;
      if (Math.abs(c - gate[0]) + Math.abs(r - gate[1]) < 2) continue;
      g[r][c] = ch; return;
    }
    warn.push('장애물 ' + ch + ' 놓을 자리 없음');
  });
  return { rows: g.map(r => r.join('')), warn };
}
const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const J = v => JSON.stringify(v).replace(/"/g, "'").replace(/,/g, ', ').replace(/:/g, ': ');
function obj(o) { if (o == null) return 'null'; return '{ ' + Object.keys(o).map(k => k + ': ' + (typeof o[k] === 'string' ? q(o[k]) : J(o[k]))).join(', ') + ' }'; }
function stageJs(S, grid) {
  const L = [];
  L.push('MAPS.push({ id: ' + q(S.id) + ', ch: ' + S.ch + ', no: ' + S.no + ', name: ' + q(S.name) + ', region: ' + q(S.region) + ', theme: ' + q(S.theme) + ', cols: 10, rows: 17,');
  L.push('  grid: [' + grid.map(q).join(', ') + '],');
  L.push('  paths: ' + J(S.paths) + ',' + (S.sea ? '\n  sea: ' + J(S.sea) + ',' : '') + (S.air ? '\n  air: ' + J(S.air) + ',' : ''));
  L.push('  waves: ' + S.waves + ', gold: ' + S.gold + ', hpMul: ' + S.hpMul + ', bud: ' + S.bud + (S.late ? ', late: ' + S.late : '') + ', pool: ' + J(S.pool) + ', intro: ' + obj(S.intro || {}) + ', boss: ' + (S.boss ? q(S.boss) : 'null') + ',' + (S.focus ? ' focus: ' + q(S.focus) + ', focusK: ' + S.focusK + ',' : ''));
  L.push('  rule: ' + obj(S.rule) + ', ruleName: ' + q(S.ruleName || '') + ', ruleDesc: ' + q(S.ruleDesc || '') + ',');
  L.push('  need: ' + J(S.need || []) + ', reward: ' + obj(S.reward) + ',');
  L.push('  desc: ' + q(S.desc) + ' });');
  return L.join('\n');
}
function storyJs(key, lines) { return 'STORY.' + key + ' = [' + lines.map(l => '[' + q(l[0]) + ', ' + q(l[1]) + ']').join(',\n  ') + '];'; }
const mode = process.argv[2] || 'print';
let bad = 0;
[1, 2].forEach(ch => {
  const C = D.chapters[ch], out = [C.head];
  C.stages.forEach((S, i) => {
    S.ch = ch; S.no = i + 1; S.id = 'c' + ch + 's' + (i + 1 < 10 ? '0' : '') + (i + 1);
    const G = makeGrid(S); if (G.warn.length) { bad++; console.log('!!', S.id, G.warn.join(' / ')); }
    if (mode === 'print') { console.log('\n' + S.id + ' ' + S.name + ' [' + S.theme + '] rule ' + (S.rule ? S.rule.id : '-') + ' boss ' + (S.boss || '-')); G.rows.forEach((r, ri) => console.log('  ' + r + '  ' + ri)); }
    out.push(stageJs(S, G.rows));
  });
  out.push('', '// ---------- 이야기 (판마다 작전 브리핑 2~4줄, 챕터 시작 c' + ch + 'in, 결말 c' + ch + 'end) ----------');
  if (C.pre) out.push(C.pre);
  out.push(storyJs('c' + ch + 'in', C.intro));
  C.stages.forEach(S => out.push(storyJs(S.id, S.story)));
  out.push(storyJs('c' + ch + 'end', C.end));
  if (C.tail) out.push(C.tail);
  if (mode === 'write') { fs.writeFileSync(path.join(__dirname, '..', 'src', 'stages_ch' + ch + '.js'), out.join('\n') + '\n'); console.log('wrote stages_ch' + ch + '.js', C.stages.length + '판'); }
});
if (bad) { console.log('경고 있는 판 ' + bad); process.exit(1); }
