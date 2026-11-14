// 타임플렉스 전 판 봇 점검: node tools/tfsweep.js [장들 1-15] [난이도] [모드 era|time] → 판마다 결과, 오류
// 편성: 그 장 시대까지의 탑 중 botLoadout이 8종(시대 고증). time 모드는 모든 탑 중 8종 + 적 체력 TF_TIME_HP
const vm = require('vm'), { execFileSync } = require('child_process'), path = require('path');
const ctx = require('./fdload.js')();
const [chArg = '1-15', dk = 'normal', md = 'era', lim = '8'] = process.argv.slice(2);   // lim: 8(편성 8종) 또는 all(그 시대까지 탑 전부, v0.2 밸런스 기준)
let chs = []; chArg.split(',').forEach(t => { const m = /^(\d+)-(\d+)$/.exec(t); if (m) for (let i = +m[1]; i <= +m[2]; i++) chs.push(i); else chs.push(+t); });
const plan = JSON.parse(vm.runInContext(`(function(){ var out=[]; MAPS.forEach(function(M,mi){ if(!/^c\\d+s\\d+$/.test(M.id)) return;
  var C=null; CHAPTERS.forEach(function(c){ if(c.id===M.ch) C=c; }); var era=C&&C.era||M.ch;
  var own=Object.keys(TOWERS).filter(function(k){ var T=TOWERS[k]; if(T.fusion||T.admin||T.hidden) return false; return ${md === 'time' ? 'true' : 'tfEraOf(k)<=era'}; });
  var load=${lim === 'all' ? 'own' : "botLoadout(mi,'" + dk + "',own,8)"}; out.push({mi:mi,id:M.id,ch:M.ch,load:load}); }); return JSON.stringify(out); })()`, ctx));
const sel = plan.filter(p => chs.includes(p.ch));
let wins = 0, errs = 0, rows = [];
for (const p of sel) {
  const args = [path.join(__dirname, 'sim.js'), p.id, dk, '1', '0', 'all', 'prog=1', 'towers=' + p.load.join(','), 'json=1'];
  if (md === 'time') args.push('hpx=' + ({ easy: 1.3, normal: 1.5, hard: 1.8 }[dk] || 1.5));
  let out = '';
  try { out = execFileSync('node', args, { encoding: 'utf8', timeout: 600000 }); } catch (e) { out = (e.stdout || '') + '\nERRRUN ' + e.message; }
  const j = out.split('\n').find(l => l.startsWith('JSON ')); const r = j ? JSON.parse(j.slice(5)) : { res: 'ERROR' };
  if (r.res === 'WIN') wins++; if (r.res === 'ERROR' || !j) { errs++; console.log(out.slice(-600)); }
  const line = p.id + ' ' + r.res + (r.stars != null ? ' ' + r.stars + '*' : '') + ' lives ' + r.lives + '/' + r.maxLives + ' wave ' + r.wave + '/' + r.N + ' [' + p.load.join(',') + ']';
  console.log(line); rows.push(line);
}
console.log('합계 ' + wins + '/' + sel.length + ' 승, 오류 ' + errs);
