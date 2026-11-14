// EN4 시험용 빌드: node tools/en4_testbuild.js  → out/index.html(정식) + out/en4_test.html(시험 고리 넣은 사본, 커밋 안 함)
// 시험 고리: window.__EF(enemyFrames), __SP(적 소환), __E4(EN_DRAW 등). 전투 캡처용으로 top: 1 적을 진행 방향으로 돌려 그리게 한 줄 바꿈(사본에서만)
const fs = require('fs'), path = require('path'), cp = require('child_process');
cp.execFileSync('node', [path.join(__dirname, 'build.js')], { stdio: 'inherit' });
const out = path.join(__dirname, '..', 'out');
let h = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const hook = '\nwindow.__EF = enemyFrames; window.__SP = function (k, pi, d, o) { return spawnEnemy(G, k, pi, d, o); }; window.__E4 = { D: EN_DRAW, icon: enemyIcon, EN: ENEMIES, vis: enVis, SPR: EN_SPR };\n';
const i = h.lastIndexOf('\n})();');
if (i < 0) throw new Error('끝을 못 찾음');
h = h.slice(0, i) + hook + h.slice(i);
const a = "var top = e.k === 'spider' || e.k === 'arachne';";
if (h.indexOf(a) >= 0) h = h.replace(a, "var top = !!(EN_DRAW[e.k] && EN_DRAW[e.k].top);");
fs.writeFileSync(path.join(out, 'en4_test.html'), h);
console.log('en4_test.html', Math.round(h.length / 1024) + 'KB');
