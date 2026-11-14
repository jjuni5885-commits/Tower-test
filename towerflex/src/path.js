// ===== path.js : 맵 해석, 길(모서리 둥글게), 위치 찾기 =====
var PSTEP = 0.05;
function buildPath(wps, rad) {
  // wps: 칸 좌표 → 칸 중심 월드 좌표
  var P = wps.map(function (p) { return [p[0] + 0.5, p[1] + 0.5]; });
  var pts = [];
  function addLine(ax, ay, bx, by) {
    var L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / 0.02));
    for (var i = (pts.length ? 1 : 0); i <= n; i++) pts.push([ax + (bx - ax) * i / n, ay + (by - ay) * i / n]);
  }
  var cur = P[0];
  for (var i = 1; i < P.length; i++) {
    var A = P[i], last = i === P.length - 1;
    if (last) { addLine(cur[0], cur[1], A[0], A[1]); break; }
    var B = P[i + 1];
    var ux = Math.sign(A[0] - P[i - 1][0]), uy = Math.sign(A[1] - P[i - 1][1]);
    var vx = Math.sign(B[0] - A[0]), vy = Math.sign(B[1] - A[1]);
    var r = rad;
    var s0 = [A[0] - ux * r, A[1] - uy * r], s1 = [A[0] + vx * r, A[1] + vy * r];
    addLine(cur[0], cur[1], s0[0], s0[1]);
    for (var k = 1; k <= 16; k++) { var t = k / 16, mt = 1 - t; pts.push([mt * mt * s0[0] + 2 * mt * t * A[0] + t * t * s1[0], mt * mt * s0[1] + 2 * mt * t * A[1] + t * t * s1[1]]); }
    cur = s1;
  }
  return resample(pts);
}
function resample(pts) {
  // 일정 간격(PSTEP)으로 다시 찍기
  var cum = [0];
  for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  var len = cum[cum.length - 1], n = Math.floor(len / PSTEP), xs = new Float32Array(n + 2), ys = new Float32Array(n + 2), j = 0;
  for (var s = 0; s <= n + 1; s++) {
    var d = Math.min(len, s * PSTEP);
    while (j < cum.length - 2 && cum[j + 1] < d) j++;
    var seg = cum[j + 1] - cum[j], t = seg > 0 ? (d - cum[j]) / seg : 0;
    xs[s] = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t; ys[s] = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t;
  }
  return { xs: xs, ys: ys, len: len, n: n + 2 };
}
function pathAt(p, d, out) {
  var f = d / PSTEP; if (f < 0) f = 0; var i = Math.floor(f); if (i >= p.n - 1) { i = p.n - 2; f = i + 1; }
  var t = f - i, x0 = p.xs[i], y0 = p.ys[i], x1 = p.xs[i + 1], y1 = p.ys[i + 1];
  out.x = x0 + (x1 - x0) * t; out.y = y0 + (y1 - y0) * t;
  var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  out.dx = dx / L; out.dy = dy / L;
  return out;
}
function flyPath(wps, sign, cols) {
  // 땅길을 크게 뭉갠 하늘길: 모퉁이를 가로질러 날아온다
  var gp = buildPath(wps, 0.5), pts = [];
  for (var i = 0; i < gp.n; i += 4) pts.push([gp.xs[i], gp.ys[i]]);
  pts.push([gp.xs[gp.n - 1], gp.ys[gp.n - 1]]);
  for (var pass = 0; pass < 6; pass++) {
    var q = [pts[0]];
    for (var j = 1; j < pts.length - 1; j++) {
      var sx = 0, sy = 0, cnt = 0;
      for (var k = -7; k <= 7; k++) { var p = pts[clamp(j + k, 0, pts.length - 1)]; sx += p[0]; sy += p[1]; cnt++; }
      q.push([sx / cnt, sy / cnt]);
    }
    q.push(pts[pts.length - 1]);
    pts = q;
  }
  for (var m = 0; m < pts.length; m++) pts[m][0] = clamp(pts[m][0] + Math.sin(m * 0.09) * 0.12 * sign, 0.3, (cols || COLS) - 0.3);
  return resample(pts);
}
// 항로(v2.0): [c0, r0, c1, r1] 칸 좌표를 잇는 직선. lane: 1인 적이 이 길로 곧게 날아가고 끝에 닿으면 생명이 깎인다
function airPath(a) {
  var x0 = a[0] + 0.5, y0 = a[1] + 0.5, x1 = a[2] + 0.5, y1 = a[3] + 0.5, L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(L / 0.25)), pts = [];
  for (var i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
  return resample(pts);
}
// 꺾인 점들을 칸 단위로 칠하기
function rasterWps(wps, set, cols, rows) {
  cols = cols || COLS; rows = rows || ROWS;
  for (var i = 1; i < wps.length; i++) {
    var a = wps[i - 1], b = wps[i], sx = Math.sign(b[0] - a[0]), sy = Math.sign(b[1] - a[1]), x = a[0], y = a[1];
    for (;;) { if (x >= 0 && x < cols && y >= 0 && y < rows) set[y * cols + x] = 1; if (x === b[0] && y === b[1]) break; x += sx; y += sy; }
  }
}
// 맵 해석 → 칸 정보. cols, rows는 판마다(M.cols, M.rows, 없으면 기본 10 x 17)
// kind[i]: 'g' 풀밭, 'p' 길, 'rock', 'water', 'lava'. sea[i] = 1이면 뱃길이 지나는 물 칸(수상 탑 건설 불가)
function parseMap(mi) {
  var M = MAPS[mi], cols = M.cols || COLS, rows = M.rows || ROWS, N = cols * rows;
  var kind = new Array(N), obsAt = new Int16Array(N).fill(-1), pathSet = new Uint8Array(N), seaSet = new Uint8Array(N), errs = [];
  if (M.grid.length !== rows) errs.push('grid 줄 수 ' + M.grid.length + ' (rows ' + rows + ')');
  M.grid.forEach(function (row, ri) { if (row.length !== cols) errs.push('grid ' + ri + '째 줄 길이 ' + row.length + ' (cols ' + cols + ')'); });
  M.paths.forEach(function (w) { rasterWps(w, pathSet, cols, rows); });
  (M.sea || []).forEach(function (w) { rasterWps(w, seaSet, cols, rows); });
  var obs = [], gate = null;
  for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
    var ch = (M.grid[r] || '').charAt(c) || '.', i = r * cols + c, k = 'g';
    if (ch === '=') k = 'p'; else if (ch === 'G') { k = 'p'; gate = [c, r]; } else if (ch === '#') k = 'rock'; else if (ch === '~') k = 'water'; else if (ch === 'L') k = 'lava';
    else if (OBS[ch] && ch !== 'C') { k = 'g'; obsAt[i] = obs.length; obs.push({ ch: ch, c: c, r: r, w: 1, x: c + 0.5, y: r + 0.5 }); }
    else if (ch === 'C') {
      k = 'g';
      if (obsAt[i] < 0) {
        var id = obs.length; obs.push({ ch: 'C', c: c, r: r, w: 2, x: c + 1, y: r + 1 });
        [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (o) { var j = (r + o[1]) * cols + c + o[0]; obsAt[j] = id; });
      }
    }
    if (pathSet[i] && k !== 'p') errs.push('길인데 표시 안 됨 ' + c + ',' + r);
    if (!pathSet[i] && k === 'p') errs.push('표시는 길인데 경로 아님 ' + c + ',' + r);
    if (seaSet[i] && k !== 'water') errs.push('뱃길인데 물이 아님 ' + c + ',' + r);
    kind[i] = pathSet[i] ? 'p' : k;
  }
  if (!gate) { var lw = M.paths[0][M.paths[0].length - 1]; gate = [lw[0], lw[1]]; }
  (M.air || []).forEach(function (a, ai) { if (!a || a.length !== 4 || a.some(function (v) { return typeof v !== 'number'; }) || (a[0] === a[2] && a[1] === a[3])) errs.push('항로 ' + ai + ' 형식 오류 [c0, r0, c1, r1]'); });
  return { kind: kind, obsAt: obsAt, obs: obs, gate: gate, errs: errs, cols: cols, rows: rows, sea: seaSet };
}
