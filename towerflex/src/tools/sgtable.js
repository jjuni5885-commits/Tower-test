// 판 목록 표(STGA): node tools/sgtable.js [챕터 번호 ...]  → 마크다운 표(보고서용)와 규칙 쓰임 횟수, 적 소개 순서
const ctx = require('./fdload.js')();
ctx.__chs = process.argv.slice(2).map(Number).filter(Boolean);
ctx.run(`
(function () {
  var chs = __chs.length ? __chs : [1, 2, 3, 4];
  chs.forEach(function (ch) {
    var L = MAPS.filter(function (M) { return M.ch === ch && !M.test; }); if (!L.length) return;
    console.log('\\n### ' + ch + '장 (' + L.length + '판)\\n');
    console.log('| 판 | 이름 (지역) | 테마 | 길 | 규칙 | 보스 | 새 적(웨이브) | 필요 탑 | 보상 | 웨이브, 금화, hpMul, bud |');
    console.log('|---|---|---|---|---|---|---|---|---|---|');
    var uses = {};
    L.forEach(function (M) {
      var P = parseMap(MAPS.indexOf(M)), lens = M.paths.map(function (w) { return Math.round(buildPath(w, 0.5).len); });
      var way = '땅 ' + lens.join('/') + (M.sea ? ', 뱃길 ' + M.sea.length : '') + (M.air ? ', 항로 ' + M.air.length : '');
      var rw = M.reward || {}, rs = rw.tower ? '탑 ' + rw.tower : rw.tickets ? '소환권 ' + rw.tickets : rw.gems ? '보석 ' + rw.gems : '-';
      var intro = Object.keys(M.intro || {}).sort(function (a, b) { return M.intro[a] - M.intro[b]; }).map(function (k) { return k + '(' + M.intro[k] + ')'; }).join(' ');
      if (M.rule) uses[M.rule.id] = (uses[M.rule.id] || 0) + 1;
      console.log('| ' + [M.id, M.name + ' (' + M.region + ')', M.theme, way, M.rule ? M.ruleName + ' = ' + M.rule.id + (M.rule.n ? ' ' + M.rule.n : '') + (M.rule.kinds ? ' ' + M.rule.kinds.join(',') : '') : '없음', M.boss || '-', intro || '-', (M.need || []).join(' '), rs, [M.waves, M.gold, M.hpMul, M.bud].join(', ')].join(' | ') + ' |');
    });
    console.log('\\n규칙 쓰임: ' + Object.keys(uses).map(function (k) { return k + ' ' + uses[k]; }).join(', '));
    var seen = {}, all = [];
    L.forEach(function (M) { M.pool.concat(M.boss ? [M.boss] : []).forEach(function (k) { if (!seen[k]) { seen[k] = 1; all.push(k + '@' + M.no); } }); });
    console.log('적이 처음 나오는 판: ' + all.join(' '));
  });
})();
`);
