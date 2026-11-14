// 난이도 곡선 점검(v1.2): node tools/balprof.js [장들 1-15] [난이도] [선수 base|strong] [이름=값 ...]
// tfsweep처럼 그 장 시대까지 탑 중 봇 편성 8종으로 판마다 sim.js(prof=1)를 돌려, 승패, 남은 생명, 뒤 절반 웨이브 적이 죽는 모습을 장별로 모음
//   one: 체력 90% 이상에서 한 번에 죽은 비율(광역 한 방)  burst: 0.25초 안에 4마리 이상 함께 죽은 비율  quick: 나온 지 4초 안에 죽은 비율  prog: 죽은 자리(길 비율)
//   strong = 앞서가는 사람(탑 별 +1, 연구 전부). 이름=값은 sim.js로 그대로 넘김(hpx=1.2 등)
const vm = require('vm'), { execFile } = require('child_process'), path = require('path'), os = require('os');
const ctx = require('./fdload.js')();
const [chArg = '1-15', dk = 'normal', who = 'base', ...extra] = process.argv.slice(2);
let chs = []; chArg.split(',').forEach(t => { const m = /^(\d+)-(\d+)$/.exec(t); if (m) for (let i = +m[1]; i <= +m[2]; i++) chs.push(i); else chs.push(+t); });
const plan = JSON.parse(vm.runInContext(`(function(){ var out=[]; MAPS.forEach(function(M,mi){ if(!/^c\\d+s\\d+$/.test(M.id)) return;
  var C=null; CHAPTERS.forEach(function(c){ if(c.id===M.ch) C=c; }); var era=C&&C.era||M.ch;
  var own=Object.keys(TOWERS).filter(function(k){ var T=TOWERS[k]; if(T.fusion||T.admin||T.hidden) return false; return tfEraOf(k)<=era; });
  out.push({mi:mi,id:M.id,ch:M.ch,load:botLoadout(mi,'${dk}',own,8)}); }); return JSON.stringify(out); })()`, ctx));
const sel = plan.filter(p => chs.includes(p.ch));
const N = Math.max(1, +(process.env.J || os.cpus().length));
function one(p) {
  return new Promise(res => {
    const args = [path.join(__dirname, 'sim.js'), p.id, dk, '1', '0', 'all', 'prog=1', 'prof=1', 'towers=' + p.load.join(','), 'json=1'];
    if (who === 'strong') { const stv = p.ch <= 2 ? 2 : p.ch <= 5 ? 3 : 4; args.push('star=' + stv, 'research=all'); }
    extra.forEach(a => args.push(a));
    execFile('node', args, { encoding: 'utf8', timeout: 900000, maxBuffer: 1 << 24 }, (err, out) => {
      const j = (out || '').split('\n').find(l => l.startsWith('JSON ')); res(Object.assign({ p }, j ? JSON.parse(j.slice(5)) : { res: 'ERROR' }));
    });
  });
}
(async () => {
  const q = sel.slice(), done = [];
  await Promise.all([...Array(N)].map(async () => { while (q.length) { const p = q.shift(); done.push(await one(p)); } }));
  const byCh = {};
  done.sort((a, b) => a.p.mi - b.p.mi).forEach(r => {
    const c = byCh[r.p.ch] || (byCh[r.p.ch] = { n: 0, win: 0, lost: 0, one: 0, burst: 0, quick: 0, prog: 0, k: 0, err: 0 });
    c.n++; if (r.res === 'WIN') c.win++; if (r.res === 'ERROR') c.err++;
    c.lost += r.maxLives ? (r.maxLives - Math.max(0, r.lives)) / r.maxLives : 1;
    if (r.prof && r.prof.n) { c.k++; c.one += r.prof.one; c.burst += r.prof.burst; c.quick += r.prof.quick; c.prog += r.prof.prog; }
    if (process.env.V) console.log(r.p.id, r.res, r.lives + '/' + r.maxLives, JSON.stringify(r.prof || {}));
  });
  const f = x => (x * 100).toFixed(0).padStart(3) + '%';
  console.log('장  승/판  잃은생명  한방  몰살  4초안  죽은자리   (' + dk + ', ' + who + (extra.length ? ', ' + extra.join(' ') : '') + ')');
  let T = { n: 0, win: 0 };
  Object.keys(byCh).sort((a, b) => a - b).forEach(ch => { const c = byCh[ch], k = c.k || 1; T.n += c.n; T.win += c.win;
    console.log(String(ch).padStart(2) + '  ' + (c.win + '/' + c.n).padStart(5) + '  ' + f(c.lost / c.n) + '      ' + f(c.one / k) + ' ' + f(c.burst / k) + ' ' + f(c.quick / k) + '  ' + f(c.prog / k) + (c.err ? ' 오류' + c.err : '')); });
  console.log('합계 ' + T.win + '/' + T.n + ' 승');
})();
