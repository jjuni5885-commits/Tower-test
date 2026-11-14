// 판 검증: node tools/checkmaps.js   (격자 크기, 길과 격자 일치, 뱃길이 물 위인지, 항로 형식, 웨이브 미리보기. 오류가 있으면 종료 코드 1)
const ctx = require('./fdload.js')();
ctx.run(`
var bad = 0, ids = {}, got = { archer: 1, catapult: 1, flak: 1 };   // got: 시작 탑 + 앞 판들의 확정 보상 탑 (need 검사)
var RULE_KEYS = ['fog', 'night', 'rush', 'swarm', 'elite', 'poor', 'limit', 'ban', 'blackout', 'meteor', 'airraid', 'landing', 'bossrush', 'fragile'];
for (var mi = 0; mi < MAPS.length; mi++) {
  var M = MAPS[mi], P = parseMap(mi), errs = P.errs.slice();
  var lens = M.paths.map(function (w) { return buildPath(w, 0.5).len.toFixed(1); });
  var seaL = (M.sea || []).map(function (w) { return buildPath(w, 0.5).len.toFixed(1); });
  var airL = (M.air || []).map(function (a) { return airPath(a).len.toFixed(1); });
  // 뱃길 끝(부두)은 물 칸이고 성문에서 3칸 안
  (M.sea || []).forEach(function (w, i) { var e = w[w.length - 1]; if (e[0] < 0 || e[1] < 0 || e[0] >= P.cols || e[1] >= P.rows || P.kind[e[1] * P.cols + e[0]] !== 'water') errs.push('뱃길 ' + i + ' 끝이 물 칸이 아님'); else if (Math.abs(e[0] - P.gate[0]) + Math.abs(e[1] - P.gate[1]) > 3) errs.push('뱃길 ' + i + ' 끝(부두)이 성문에서 멂'); });
  // 항로는 격자를 지나가야 함
  (M.air || []).forEach(function (a, i) { var p = airPath(a), hit = 0; for (var s = 0; s < p.n; s++) if (p.xs[s] >= 0 && p.xs[s] <= P.cols && p.ys[s] >= 0 && p.ys[s] <= P.rows) hit++; if (hit * PSTEP < 3) errs.push('항로 ' + i + ' 가 격자를 거의 지나지 않음'); });
  // 적: 있는 키인지, 그 영역의 길이 판에 있는지
  (M.pool || []).concat(M.boss ? [M.boss] : []).forEach(function (k) { var E = ENEMIES[k]; if (!E) errs.push('없는 적 ' + k); else if (fdRouteN(M, E) < 1) errs.push(k + ' 가 다닐 길(' + fdRoute(E) + ') 없음'); });
  (M.need || []).forEach(function (k) { if (!TOWERS[k]) errs.push('없는 탑 ' + k); });
  if (!/^c\\d+s\\d\\d$/.test(M.id) && !(M.test && /^t\\d+$/.test(M.id))) errs.push('id 형식');   // 시험 판(tools/teststages.js)은 t1 ~ t5
  if (ids[M.id]) errs.push('id 겹침'); ids[M.id] = 1;
  if (!M.test) {   // 실제 판: 챕터와 번호, 규칙 키, 보상, 이야기
    if (M.id !== 'c' + M.ch + 's' + (M.no < 10 ? '0' : '') + M.no) errs.push('id와 ch, no가 다름');
    if (M.rule && RULE_KEYS.indexOf(M.rule.id) < 0) errs.push('모르는 규칙 ' + M.rule.id);
    if (M.rule && (!M.ruleName || !M.ruleDesc)) errs.push('규칙 이름과 설명 없음');
    if (!STORY[M.id] || STORY[M.id].length < 2 || STORY[M.id].length > 4) errs.push('이야기 2~4줄 아님');
    (STORY[M.id] || []).forEach(function (L) { if (SPEAKERS[L[0]] == null) errs.push('없는 화자 ' + L[0]); });
    Object.keys(M.intro || {}).forEach(function (k) { if ((M.pool || []).indexOf(k) < 0) errs.push('intro의 ' + k + ' 가 pool에 없음'); });
    if (M.reward && M.reward.tower && !TOWERS[M.reward.tower]) errs.push('없는 보상 탑 ' + M.reward.tower);
    (M.need || []).forEach(function (k) { if (!got[k]) errs.push('need ' + k + ' 를 아직 못 받음'); });
    if (M.reward && M.reward.tower) got[M.reward.tower] = 1;
    if (M.waves < 12 || M.waves > 30) errs.push('웨이브 수 ' + M.waves);
  }
  var free = P.kind.filter(function (k, i) { return k === 'g' && P.obsAt[i] < 0; }).length, wfree = P.kind.filter(function (k, i) { return k === 'water' && !P.sea[i]; }).length;
  if (errs.length) bad++;
  console.log(M.id, M.name, P.cols + 'x' + P.rows, 'errs', errs.length, errs.slice(0, 4).join(' / '), 'paths', lens.join(','), 'sea', seaL.join(',') || '-', 'air', airL.join(',') || '-', 'obs', P.obs.length, 'free', free, 'water', wfree, 'gate', P.gate, 'rule', M.rule ? M.rule.id : '-');
}
for (var mi = 0; mi < MAPS.length; mi++) {
  var W = genWaves(mi, 'normal');
  var s = W.map(function (w, i) { return w.kind[0] + ':' + w.groups.map(function (g) { return g.type + 'x' + g.n; }).join('+'); });
  console.log(MAPS[mi].id, s.slice(0, 6).join(' | '), ' ... ', s.slice(-2).join(' | '));
}
console.log(bad ? 'FAILS ' + bad : 'ALL OK (' + MAPS.length + '판)');
var FD_BAD = bad;
`);
process.exit(ctx.run('FD_BAD') ? 1 : 0);
