// 타임플렉스 판 파일 만들기: node tools/tf_stage.js 1   → src/stages_t1.js (정의는 tools/tf_st1.js)
// 정의: 길 꼭짓점(paths), 뱃길(sea), 물 칸 사각형(water: [c0, r0, c1, r1]), 장애물 수(obs), 바위 수(rocks), 씨앗(seed)
// 격자는 길에서 자동으로 만든다: '=' 길, 'G' 성문, '~' 물, '#' 바위, a b c 장애물, d 보물, '.' 건설 칸
const fs = require('fs'), path = require('path');
const ch = +(process.argv[2] || 1);
let D;
if (fs.existsSync(path.join(__dirname, 'tf_st' + ch + '.js'))) D = require('./tf_st' + ch + '.js');
else { const ctx = require('./fdload.js')(null, 'tf_eras.js'); const R = JSON.parse(ctx.run('JSON.stringify(TF_ROSTER[' + ch + '])')); const INFO = JSON.parse(ctx.run('(function(){var o={};for(var k in ENEMIES){var E=ENEMIES[k];if(E.tf)o[k]={dom:E.dom||(E.fly?"a":"g"),lane:E.lane||0,name:E.name,desc:E.desc}}return JSON.stringify(o)})()')); D = require('./tf_chap.js')(ch, R, INFO); D.speakers = {}; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function cellsOf(w, cols, rows) {
  const out = [];
  for (let i = 0; i + 1 < w.length; i++) {
    let [c0, r0] = w[i], [c1, r1] = w[i + 1];
    const dc = Math.sign(c1 - c0), dr = Math.sign(r1 - r0); if (dc && dr) throw new Error('대각선 길 ' + JSON.stringify(w[i]) + ' ' + JSON.stringify(w[i + 1]));
    let c = c0, r = r0;
    for (;;) { if (c >= 0 && r >= 0 && c < cols && r < rows) out.push([c, r]); if (c === c1 && r === r1) break; c += dc; r += dr; }
  }
  return out;
}
function build(S) {
  const cols = S.cols || 10, rows = S.rows || 17, R = rng(S.seed || 7), g = [];
  for (let r = 0; r < rows; r++) g.push(Array(cols).fill('.'));
  (S.water || []).forEach(([c0, r0, c1, r1]) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r >= 0 && c >= 0 && r < rows && c < cols) g[r][c] = '~'; });
  (S.sea || []).forEach(w => cellsOf(w, cols, rows).forEach(([c, r]) => { g[r][c] = '~'; }));
  S.paths.forEach(w => cellsOf(w, cols, rows).forEach(([c, r]) => { if (g[r][c] === '~') throw new Error(S.id + ' 길이 물을 지남 ' + c + ',' + r); g[r][c] = '='; }));
  S.paths.forEach(w => { const e = w[w.length - 1]; g[e[1]][e[0]] = 'G'; });
  const free = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (g[r][c] === '.') free.push([c, r]);
  function put(ch, n) { for (let i = 0; i < n && free.length; i++) { const j = Math.floor(R() * free.length), [c, r] = free.splice(j, 1)[0]; g[r][c] = ch; } }
  put('#', S.rocks == null ? 4 : S.rocks);
  const ob = S.obs == null ? 8 : S.obs; for (let i = 0; i < ob; i++) put('abc'[Math.floor(R() * 3)], 1);
  put('d', S.chest == null ? 1 : S.chest);
  (S.fixed || []).forEach(([c, r, ch]) => { g[r][c] = ch; });
  return g.map(r => r.join(''));
}
const keys = ['id', 'ch', 'no', 'name', 'region', 'theme', 'cols', 'rows', 'grid', 'paths', 'sea', 'air', 'waves', 'gold', 'hpMul', 'bud', 'late', 'pool', 'intro', 'boss', 'focus', 'focusK', 'rule', 'ruleName', 'ruleDesc', 'need', 'reward', 'desc', 'gateStage', 'tips'];
let out = '// ===== stages_t' + ch + '.js : 타임플렉스 ' + ch + '장 ' + D.chapter + ' (tools/tf_stage.js가 tools/tf_st' + ch + '.js에서 만듦, 직접 고치지 말 것) =====\n';
Object.keys(D.speakers || {}).forEach(k => { out += 'SPEAKERS.' + k + ' = ' + JSON.stringify(D.speakers[k]) + ';\n'; });
D.stages.forEach((S, i) => {
  S.ch = ch; S.no = i + 1; S.id = 'c' + ch + 's' + (S.no < 10 ? '0' : '') + S.no; S.cols = S.cols || 10; S.rows = S.rows || 17;
  S.grid = build(S);
  if (!S.rule) { S.rule = null; S.ruleName = ''; S.ruleDesc = ''; }
  const o = {}; keys.forEach(k => { if (S[k] !== undefined) o[k] = S[k]; });
  out += 'MAPS.push(' + JSON.stringify(o).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1: ') + ');\n';
  if (S.story) out += 'STORY.' + S.id + ' = ' + JSON.stringify(S.story) + ';\n';
});
if (D.ending) out += 'STORY.c' + ch + 'end = ' + JSON.stringify(D.ending) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'src', 'stages_t' + ch + '.js'), out);
console.log('stages_t' + ch + '.js', D.stages.length + '판');
if (process.env.SHOWGRID) D.stages.forEach(S => { console.log(S.id, S.name); S.grid.forEach(r => console.log('  ' + r)); });
