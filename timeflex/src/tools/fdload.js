// 시험 도구 공용: 전투 논리 파일을 빌드 순서대로 한 vm 문맥에 올린다 (v2.0, FOUND)
// const ctx = require('./fdload.js')(프로젝트 루트);  없는 선택 파일은 건너뜀
// 실제 판 파일(stages_ch*.js) 뒤에 시험 판(tools/teststages.js: t1 ~ t5, 임시 적 fdBoat, fdJet)을 MAPS 끝에 붙인다. 시험은 fdT('t1') 로 판 번호를 찾을 것
const fs = require('fs'), vm = require('vm'), path = require('path');
const FILES = ['util.js', 'data.js', 'data_towers2.js', 'data_enemies2.js', 'tf_data.js', 'tf_eras.js', 'stages_t1.js', 'stages_t2.js', 'stages_t3.js', 'stages_t4.js', 'stages_t5.js', 'stages_t6.js', 'stages_t7.js', 'stages_t8.js', 'stages_t9.js', 'stages_t10.js', 'stages_t11.js', 'stages_t12.js', 'stages_t13.js', 'stages_t14.js', 'stages_t15.js', 'tf_bonus.js', '@teststages.js',
  'path.js', 'logic.js', 'logic_towers2.js', 'logic_enemies2.js', 'logic_rules.js', 'logic_v22.js', 'bot.js', 'tf_alias.js'];
module.exports = function (root, upto) {
  root = root || path.join(__dirname, '..');
  const ctx = { console, Math, Float32Array, Int16Array, Uint8Array, Array, Object, JSON, Date };
  vm.createContext(ctx);
  for (const f of FILES) {
    const p = f[0] === '@' ? path.join(__dirname, f.slice(1)) : path.join(root, 'src', f);   // '@'로 시작하면 tools 폴더의 파일
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
    if (upto && f === upto) break;
  }
  ctx.run = function (code) { return vm.runInContext(code, ctx); };
  return ctx;
};
