// ===== art_map3.js : [MB] 바다 그리기(모든 테마 공통) + 4장 도깨비 고개 지형 5종 =====
// 접두사 mw. 다른 파일에 넣은 고리는 세 줄뿐:
//   art_map.js paintLiquids 첫 줄 → mwPaintSea, paintRoads 다리 앞 → mwBridges, render.js drawLiquidAnim 첫 줄 → mwLiquidAnim
// 4장 테마는 고리 없이 이 파일 끝의 mwInstall()이 renderBackground, gateSpr, initAmbient, drawAmbient, PROPS.bigrock, PROPS.chest 를 감싸서 mw 테마만 가로챈다

// ================= 1. 바다 =================
// 테마별 바다색 [깊은 물, 가운데, 얕은 물가]. THEME[k].sea 가 있으면 그것이 먼저, 둘 다 없으면 THEME[k].water 에서 만든다
var MW_SEA = {
  meadow: ['#1485b8', '#2eaedb', '#86e6e0'], forest: ['#1a7798', '#2fa6c8', '#7edbd8'],
  graveyard: ['#131a48', '#222d6a', '#3d4e96'], manor: ['#1b2850', '#2b3f72', '#4b699a'], pumpkin: ['#1d3350', '#2f4f6e', '#56809a'], crypt: ['#101e2e', '#1d394b', '#39636f'],
  city: ['#1d3d64', '#2e5d8a', '#5b8eb3'], desert: ['#1388a0', '#2bb3c0', '#8ae0d4'], harbor: ['#0f2864', '#1a458e', '#3b76bb'], airfield: ['#16386e', '#265698', '#4e84bf']
};
// 콘크리트 부두, 돌다리를 쓰는 테마 (THEME[k].pier = 'wood'|'concrete', THEME[k].bridge = 'wood'|'stone' 이 있으면 그것이 먼저)
var MW_HARD = { harbor: 1, city: 1, airfield: 1, desert: 1, crypt: 1 };
var MW_STONE = { harbor: 1, city: 1, airfield: 1, crypt: 1, manor: 1, graveyard: 1, palace: 1, sansa: 1 };
function mwSm(a, b, v) { var t = (v - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
function mwSeaPal(th, T) {
  var W = T.water || ['#36aee6', '#66cff6', '#d4f6ff'], s = T.sea || MW_SEA[th];
  if (!s) s = [T.lava ? twSh(W[0], 0.3) : mixc(W[0], '#143c8c', 0.4), W[0], mixc(W[1], W[2], 0.35)];
  return { d: s[0], m: s[1], s: s[2], hi: s[3] || mixc(s[2], '#ffffff', 0.55), lane: mixc(s[0], '#0a1a58', 0.42), shore: T.shore || '#f3e2b2' };
}
// 뱃길 읽기: M.sea = [[[c, r], ...], ...] (한 갈래만 [[c, r], ...] 로 적어도 받음). 마지막 점이 부두
function mwSeaInfo(g) {
  if (g.mwSea) return g.mwSea;
  var M = g.M || {}, s = M.sea, lanes = [], piers = [], info = { lanes: lanes, piers: piers };
  g.mwSea = info;
  if (!s || !s.length || !s[0]) return info;
  if (typeof s[0][0] === 'number') s = [s];
  function wat(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS && g.kind[r * COLS + c] === 'water'; }
  for (var li = 0; li < s.length; li++) {
    var w = [], raw = s[li] || [], k;
    for (k = 0; k < raw.length; k++) { var q = raw[k]; if (q && isFinite(q[0]) && isFinite(q[1])) w.push([Math.round(q[0]), Math.round(q[1])]); }
    if (!w.length) continue;
    var e = w[w.length - 1], P = { x: e[0] + 0.5, y: e[1] + 0.5, dx: 0, dy: 0, land: 0 }, best = 1e9;
    // 부두가 닿을 뭍: 이웃 네 칸 가운데 물이 아닌 칸(성문에 가까운 쪽)
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) {
      var c = e[0] + o[0], r = e[1] + o[1]; if (c < 0 || r < 0 || c >= COLS || r >= ROWS || wat(c, r)) return;
      var dd = g.gate ? Math.abs(g.gate.x - 0.5 - c) + Math.abs(g.gate.y - 0.5 - r) : 0; if (g.kind[r * COLS + c] === 'rock') dd += 50;
      if (dd < best) { best = dd; P.dx = o[0]; P.dy = o[1]; P.land = 1; }
    });
    if (!P.land && w.length > 1) { var pv = w[w.length - 2]; P.dx = Math.sign(e[0] - pv[0]); P.dy = P.dx ? 0 : Math.sign(e[1] - pv[1]); }
    if (!P.dx && !P.dy) P.dy = 1;
    piers.push(P);
    if (w.length < 2) continue;
    var ortho = true; for (k = 1; k < w.length; k++) if (w[k][0] !== w[k - 1][0] && w[k][1] !== w[k - 1][1]) ortho = false;
    var a = w[0], b = w[1], w2 = w.slice(), xs, ys, n;
    if (a[0] <= 0 || a[1] <= 0 || a[0] >= COLS - 1 || a[1] >= ROWS - 1) w2[0] = [a[0] + Math.sign(a[0] - b[0]) * 8, a[1] + Math.sign(a[1] - b[1]) * 8];
    if (ortho) { var bp = buildPath(w2, 0.5); xs = bp.xs; ys = bp.ys; n = bp.n; }
    else { xs = []; ys = []; for (k = 1; k < w2.length; k++) { var L = Math.max(1, Math.round(Math.hypot(w2[k][0] - w2[k - 1][0], w2[k][1] - w2[k - 1][1]) * 20)); for (var t = k > 1 ? 1 : 0; t <= L; t++) { xs.push(w2[k - 1][0] + 0.5 + (w2[k][0] - w2[k - 1][0]) * t / L); ys.push(w2[k - 1][1] + 0.5 + (w2[k][1] - w2[k - 1][1]) * t / L); } } n = xs.length; }
    lanes.push({ xs: xs, ys: ys, n: n });
  }
  return info;
}
// 물 위를 건너는 길 칸(다리): 1 = 물, 2 = 용암. 맞은편 두 쪽이 물이면 다리, 물속 모퉁이는 이웃 다리에 이어 붙임
function mwBridgeCells(g) {
  if (g.mwBr) return g.mwBr;
  var b = new Uint8Array(COLS * ROWS), c, r, pass;
  function liq(c, r) { if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 0; var k = g.kind[r * COLS + c]; return k === 'water' ? 1 : k === 'lava' ? 2 : 0; }
  function bAt(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS ? b[r * COLS + c] : 0; }
  for (pass = 0; pass < 3; pass++) for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
    var i = r * COLS + c; if (g.kind[i] !== 'p' || b[i]) continue;
    var W = liq(c - 1, r), E = liq(c + 1, r), N = liq(c, r - 1), S2 = liq(c, r + 1);
    if (W && E) b[i] = W; else if (N && S2) b[i] = N;
    else if (pass && (W ? 1 : 0) + (E ? 1 : 0) + (N ? 1 : 0) + (S2 ? 1 : 0) >= 2 && (bAt(c - 1, r) || bAt(c + 1, r) || bAt(c, r - 1) || bAt(c, r + 1))) b[i] = W || E || N || S2;
  }
  return (g.mwBr = b);
}
function mwBlur(a, mw, mh, R, passes) {
  var t = new Float32Array(mw * mh), n = 2 * R + 1, x, y, k, s;
  for (var p = 0; p < passes; p++) {
    for (y = 0; y < mh; y++) { s = 0; for (k = -R; k <= R; k++) s += a[y * mw + (k < 0 ? 0 : k >= mw ? mw - 1 : k)]; for (x = 0; x < mw; x++) { t[y * mw + x] = s / n; s += a[y * mw + (x + R + 1 >= mw ? mw - 1 : x + R + 1)] - a[y * mw + (x - R < 0 ? 0 : x - R)]; } }
    for (x = 0; x < mw; x++) { s = 0; for (k = -R; k <= R; k++) s += t[(k < 0 ? 0 : k >= mh ? mh - 1 : k) * mw + x]; for (y = 0; y < mh; y++) { a[y * mw + x] = s / n; s += t[(y + R + 1 >= mh ? mh - 1 : y + R + 1) * mw + x] - t[(y - R < 0 ? 0 : y - R) * mw + x]; } }
  }
  return a;
}
// 물 모양 밭(낮은 해상도): a1 = 물가 둥글린 값(0.5가 물가), a2 = 깊이(안쪽일수록 1), la = 뱃길. 화면 밖까지 가장자리 물 칸을 이어 붙임
function mwSeaField(g, view) {
  var S = view.S, r = 12, c, rr, i, j;
  var cx0 = clamp(Math.floor(-view.ox / S) - 1, -12, -2), cy0 = clamp(Math.floor(-view.oy / S) - 1, -12, -2), cx1 = clamp(Math.ceil((view.W - view.ox) / S) + 1, COLS + 2, COLS + 12), cy1 = clamp(Math.ceil((view.H - view.oy) / S) + 1, ROWS + 2, ROWS + 12);
  var cw = cx1 - cx0, ch = cy1 - cy0, mw = cw * r, mh = ch * r, a = new Float32Array(mw * mh), any = 0, br = mwBridgeCells(g);
  for (rr = cy0; rr < cy1; rr++) for (c = cx0; c < cx1; c++) {
    var gc = clamp(c, 0, COLS - 1), gr = clamp(rr, 0, ROWS - 1), k = g.kind[gr * COLS + gc], out = gc !== c || gr !== rr;
    if (k !== 'water' && !(br[gr * COLS + gc] === 1 && !out)) continue;
    any = 1;
    for (j = 0; j < r; j++) { var o = ((rr - cy0) * r + j) * mw + (c - cx0) * r; for (i = 0; i < r; i++) a[o + i] = 1; }
  }
  if (!any) return null;
  var a1 = mwBlur(a, mw, mh, 5, 2), a2 = mwBlur(new Float32Array(a1), mw, mh, 11, 2), la = null, info = mwSeaInfo(g);
  if (info.lanes.length) {
    var lc = mkC(mw, mh), lx = cx2(lc); lx.setTransform(r, 0, 0, r, -cx0 * r, -cy0 * r); lx.strokeStyle = '#ffffff'; lx.lineWidth = 0.92; lx.lineCap = 'round'; lx.lineJoin = 'round';
    info.lanes.forEach(function (L) { lx.beginPath(); for (var q = 0; q < L.n; q += 2) { if (!q) lx.moveTo(L.xs[q], L.ys[q]); else lx.lineTo(L.xs[q], L.ys[q]); } lx.stroke(); });
    var ld = lx.getImageData(0, 0, mw, mh).data; la = new Float32Array(mw * mh); for (i = 0; i < mw * mh; i++) la[i] = ld[i * 4 + 3] / 255;
    mwBlur(la, mw, mh, 3, 2);
  }
  var F = { r: r, cx0: cx0, cy0: cy0, cw: cw, ch: ch, mw: mw, mh: mh, a1: a1, a2: a2, la: la };
  F.idx = function (wx, wy) { var px = Math.floor((wx - cx0) * r), py = Math.floor((wy - cy0) * r); return px < 0 || py < 0 || px >= mw || py >= mh ? -1 : py * mw + px; };
  F.at = function (wx, wy) { var q = F.idx(wx, wy); return q < 0 ? 0 : a1[q]; };
  F.dep = function (wx, wy) { var q = F.idx(wx, wy); return q < 0 ? 0 : a2[q]; };
  return F;
}
// 물 그리기(배경 굽기): 물가 모래 띠, 얕은 물과 깊은 물, 뱃길 물색, 흰 거품 두 줄, 잔물결, 부표, 부두
function mwPaintSea(x, g, view, T, rnd) {
  var F = mwSeaField(g, view); g.mwF = F; if (!F) return;
  var S = view.S, th = g.M.theme, P = mwSeaPal(th, T), q = clamp(Math.round(S / 2), 5, 40), r = F.r, iw = F.cw * q, ih = F.ch * q;
  var c = mkC(iw, ih), ix = cx2(c), id = ix.createImageData(iw, ih), d = id.data, N = makeNoise(hashStr(g.M.id || 'm') + 11);
  var cD = hx(P.d), cM = hx(P.m), cS = hx(P.s), cH = hx(P.hi), cSh = hx(P.shore), cI = hx(twInkC(P.shore)), cL = hx(P.lane), cW = hx(mixc(P.shore, P.m, 0.42));
  var a1 = F.a1, a2 = F.a2, la = F.la, mw = F.mw, mh = F.mh, kq = r / q, i, j, o, R, G, B, A;
  for (j = 0; j < ih; j++) {
    var fy = (j + 0.5) * kq - 0.5, y0 = Math.floor(fy), ty = fy - y0, y1 = y0 + 1; if (y0 < 0) y0 = 0; if (y1 >= mh) y1 = mh - 1; if (y0 >= mh) y0 = mh - 1;
    var wy = F.cy0 + (j + 0.5) / q;
    for (i = 0; i < iw; i++) {
      var fx = (i + 0.5) * kq - 0.5, x0 = Math.floor(fx), tx = fx - x0, x1 = x0 + 1; if (x0 < 0) x0 = 0; if (x1 >= mw) x1 = mw - 1; if (x0 >= mw) x0 = mw - 1;
      var p00 = y0 * mw + x0, p01 = y0 * mw + x1, p10 = y1 * mw + x0, p11 = y1 * mw + x1, w00 = (1 - tx) * (1 - ty), w01 = tx * (1 - ty), w10 = (1 - tx) * ty, w11 = tx * ty;
      var v = a1[p00] * w00 + a1[p01] * w01 + a1[p10] * w10 + a1[p11] * w11;
      if (v < 0.25) continue;
      o = (j * iw + i) * 4;
      if (v < 0.47) {
        // 물가: 진한 테두리 → 모래 → 젖은 모래
        var t0 = mwSm(0.31, 0.35, v), t1 = mwSm(0.41, 0.47, v);
        R = cI[0] + (cSh[0] - cI[0]) * t0; G = cI[1] + (cSh[1] - cI[1]) * t0; B = cI[2] + (cSh[2] - cI[2]) * t0;
        R += (cW[0] - R) * t1 * 0.7; G += (cW[1] - G) * t1 * 0.7; B += (cW[2] - B) * t1 * 0.7;
        A = mwSm(0.25, 0.3, v) * (0.5 + 0.5 * t0);
      } else {
        var dv = a2[p00] * w00 + a2[p01] * w01 + a2[p10] * w10 + a2[p11] * w11, wx = F.cx0 + (i + 0.5) / q;
        var e = mwSm(0.52, 0.88, v), dp = mwSm(0.6, 0.97, dv) * 0.94, n = N.n2(wx * 1.7, wy * 2.9);
        R = cS[0] + (cM[0] - cS[0]) * e; G = cS[1] + (cM[1] - cS[1]) * e; B = cS[2] + (cM[2] - cS[2]) * e;
        R += (cD[0] - R) * dp; G += (cD[1] - G) * dp; B += (cD[2] - B) * dp;
        // 셀 그림 같은 밝은 물결 얼룩(가로로 긴 무늬)
        var nb = mwSm(0.5, 0.54, N.fbm(wx * 0.6 + 7, wy * 1.5 + 3, 2)) * 0.1;
        R += (cH[0] - R) * nb; G += (cH[1] - G) * nb; B += (cH[2] - B) * nb;
        if (la) { var lv = (la[p00] * w00 + la[p01] * w01 + la[p10] * w10 + la[p11] * w11) * 0.56; R += (cL[0] - R) * lv; G += (cL[1] - G) * lv; B += (cL[2] - B) * lv; }
        // 거품: 물가에 붙은 흰 띠 + 조금 안쪽의 끊어진 둘째 줄
        var vv = v + (n - 0.5) * 0.05, f1 = 1 - mwSm(0.545, 0.575, vv), f2 = mwSm(0.66, 0.675, vv) * (1 - mwSm(0.7, 0.715, vv)) * mwSm(0.38, 0.5, N.n2(wx * 2.7 + 9, wy * 2.7)) * 0.62, f = f1 * 0.94 > f2 ? f1 * 0.94 : f2;
        R += (255 - R) * f; G += (255 - G) * f; B += (255 - B) * f;
        A = 1;
      }
      d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = A * 255;
    }
  }
  ix.putImageData(id, 0, 0);
  x.save(); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(c, 0, 0, iw, ih, view.ox + F.cx0 * S, view.oy + F.cy0 * S, F.cw * S, F.ch * S);
  // 잔물결: 짧은 흰 호 두 겹(깊은 물은 드물고 길게)
  var X0 = view.ox, Y0 = view.oy, area = F.cw * F.ch, k, wx2, wy2, av;
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (k = 0; k < area * 0.5; k++) {
    wx2 = F.cx0 + rnd() * F.cw; wy2 = F.cy0 + rnd() * F.ch; if (F.dep(wx2, wy2) < 0.8) continue;
    x.globalAlpha = 0.1; x.drawImage(softSpr(P.hi, 32), X0 + (wx2 - 0.9) * S, Y0 + (wy2 - 0.22) * S, S * 1.8, S * 0.44);
  }
  for (k = 0; k < area * 3.2; k++) {
    wx2 = F.cx0 + rnd() * F.cw; wy2 = F.cy0 + rnd() * F.ch; av = F.at(wx2, wy2); var L2 = S * (0.1 + rnd() * 0.16), deep = F.dep(wx2, wy2);
    if (av < 0.8 || F.at(wx2 + L2 / S, wy2) < 0.8) continue;
    if (deep > 0.9 && rnd() < 0.45) continue;
    var px = X0 + wx2 * S, py = Y0 + wy2 * S;
    x.globalAlpha = deep > 0.9 ? 0.34 : 0.55; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.02);
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + L2 * 0.5, py - S * 0.035, px + L2, py); x.stroke();
    if (rnd() < 0.5) { x.globalAlpha *= 0.7; x.beginPath(); x.moveTo(px + L2 * 0.35, py + S * 0.05); x.quadraticCurveTo(px + L2 * 0.7, py + S * 0.025, px + L2 * 1.05, py + S * 0.05); x.stroke(); }
  }
  x.globalAlpha = 1;
  // 연잎(초원, 늪): 얕은 물에만
  if (th === 'swamp' || th === 'meadow') {
    for (k = 0; k < area * (th === 'swamp' ? 0.8 : 0.3); k++) {
      wx2 = F.cx0 + rnd() * F.cw; wy2 = F.cy0 + rnd() * F.ch; var lr = S * (0.08 + rnd() * 0.07), a0 = rnd() * 6, fl = rnd() < 0.3;
      if (F.at(wx2, wy2) < 0.84 || F.dep(wx2, wy2) > (th === 'swamp' ? 0.9 : 0.72) || (la && la[F.idx(wx2, wy2)] > 0.2)) continue;
      var lx2 = X0 + wx2 * S, ly2 = Y0 + wy2 * S;
      x.fillStyle = twInkC('#5cc46a'); x.beginPath(); x.ellipse(lx2, ly2, lr + TW_IW, lr * 0.62 + TW_IW, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#6fd47a'; x.beginPath(); x.ellipse(lx2, ly2, lr, lr * 0.62, 0, a0, a0 + Math.PI * 1.8); x.lineTo(lx2, ly2); x.fill();
      x.fillStyle = 'rgba(200,255,190,0.7)'; x.beginPath(); x.ellipse(lx2 - lr * 0.3, ly2 - lr * 0.2, lr * 0.35, lr * 0.18, 0, 0, Math.PI * 2); x.fill();
      if (fl) mpFlower(x, lx2 + lr * 0.2, ly2 - lr * 0.15, lr * 0.45, '#ff9fd0', '#fff0a0');
    }
  }
  // 뱃길: 가운데 옅은 흰 점선 + 부표(길 양옆에 번갈아), 부두
  var info = mwSeaInfo(g);
  x.save(); x.setLineDash([S * 0.1, S * 0.3]); x.strokeStyle = 'rgba(255,255,255,0.34)'; x.lineWidth = Math.max(1.2, S * 0.03); x.lineCap = 'round';
  info.lanes.forEach(function (L) { var pen = 0; x.beginPath(); for (var s = 0; s < L.n; s += 2) { var okp = F.at(L.xs[s], L.ys[s]) > 0.82 && L.xs[s] > -1 && L.ys[s] > -1 && L.xs[s] < COLS + 1 && L.ys[s] < ROWS + 1; if (okp) { if (pen) x.lineTo(X0 + L.xs[s] * S, Y0 + L.ys[s] * S); else x.moveTo(X0 + L.xs[s] * S, Y0 + L.ys[s] * S); } pen = okp; } x.stroke(); });
  x.restore();
  info.lanes.forEach(function (L, li) {
    for (var s = 30, sd = 1; s < L.n - 26; s += 44, sd = -sd) {
      var s1 = Math.min(L.n - 1, s + 1), dx = L.xs[s1] - L.xs[s - 1], dy = L.ys[s1] - L.ys[s - 1], dl = Math.hypot(dx, dy) || 1, bx = L.xs[s] - dy / dl * 0.47 * sd, by = L.ys[s] + dx / dl * 0.47 * sd;
      if (F.at(bx, by) < 0.86 || bx < -0.5 || by < -0.5 || bx > COLS + 0.5 || by > ROWS + 0.5) continue;
      mwBuoy(x, X0 + bx * S, Y0 + by * S, S, sd > 0 ? '#ff6a4a' : '#ffffff', sd > 0 ? '#ffffff' : '#ff6a4a');
    }
  });
  info.piers.forEach(function (p) { mwPier(x, g, view, T, p); });
  x.restore();
}
function mwBuoy(x, X, Y, S, c1, c2) {
  var r = S * 0.075;
  x.save();
  x.globalAlpha = 0.55; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.018); x.beginPath(); x.ellipse(X, Y + r * 0.5, r * 1.7, r * 0.75, 0, 0, Math.PI * 2); x.stroke();
  x.globalAlpha = 0.3; x.fillStyle = '#10204a'; x.beginPath(); x.ellipse(X + r * 0.4, Y + r * 0.7, r * 1.15, r * 0.55, 0, 0, Math.PI * 2); x.fill();
  x.globalAlpha = 1;
  x.fillStyle = twInkC(c1 === '#ffffff' ? c2 : c1); x.beginPath(); x.arc(X, Y - r * 0.2, r + Math.max(1, S * 0.016), 0, Math.PI * 2); x.fill();
  x.fillStyle = c1; x.beginPath(); x.arc(X, Y - r * 0.2, r, 0, Math.PI * 2); x.fill();
  x.save(); x.beginPath(); x.arc(X, Y - r * 0.2, r, 0, Math.PI * 2); x.clip(); x.fillStyle = c2; x.fillRect(X - r, Y - r * 0.45, r * 2, r * 0.5); x.restore();
  x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.arc(X - r * 0.35, Y - r * 0.6, r * 0.24, 0, Math.PI * 2); x.fill();
  x.restore();
}
// 부두: 뱃길 끝 칸에서 뭍 쪽으로 놓은 잔교 + 끝의 넓은 머리. 나무(기본)와 콘크리트(항구, 도심, 비행장 따위) 두 가지
function mwPier(x, g, view, T, p) {
  var S = view.S, th = g.M.theme, hard = T.pier ? T.pier === 'concrete' : !!MW_HARD[th], rnd = rngOf(977 + Math.round(p.x * 31 + p.y * 17));
  var iw = Math.max(1, S * 0.02), col = hard ? '#cfd3da' : '#e2a765', dk = hard ? '#8d93a3' : '#a9683c', i;
  x.save(); x.translate(view.ox + p.x * S, view.oy + p.y * S); x.rotate(Math.atan2(p.dy, p.dx));
  var x0 = -0.2 * S, x1 = (p.land ? 0.74 : 0.34) * S, hw = 0.25 * S, hx0 = -0.44 * S, hx1 = -0.12 * S, hh = 0.45 * S;
  function body(off, fill) {
    x.fillStyle = fill; x.beginPath(); x.rect(x0 + off, -hw + off * 1.6, x1 - x0, hw * 2); x.rect(hx0 + off, -hh + off * 1.6, hx1 - hx0 + S * 0.02, hh * 2); x.fill();
  }
  // 물에 드리운 그림자(화면 기준 오른쪽 아래) → 돌려진 좌표에서 계산
  var an = Math.atan2(p.dy, p.dx), sx = (Math.cos(an) * 0.05 + Math.sin(an) * 0.09) * S, sy = (-Math.sin(an) * 0.05 + Math.cos(an) * 0.09) * S;
  x.save(); x.translate(sx, sy); body(0, 'rgba(14,26,70,0.3)'); x.restore();
  x.save(); x.translate(0, 0); x.lineJoin = 'round'; x.strokeStyle = twInkC(dk); x.lineWidth = iw * 2.4; x.strokeRect(x0, -hw, x1 - x0, hw * 2); x.strokeRect(hx0, -hh, hx1 - hx0, hh * 2); x.restore();
  body(0, col);
  if (hard) {
    // 콘크리트: 이음 줄, 끝의 노랑 검정 띠, 쇠 말뚝, 옆의 고무 완충재
    x.strokeStyle = rgba(dk, 0.5); x.lineWidth = iw; for (i = 1; i < 4; i++) { x.beginPath(); x.moveTo(x0 + (x1 - x0) * i / 4, -hw); x.lineTo(x0 + (x1 - x0) * i / 4, hw); x.stroke(); }
    x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(x0, -hw, x1 - x0, hw * 0.28); x.fillRect(hx0, -hh, hx1 - hx0, hh * 0.16);
    x.save(); x.beginPath(); x.rect(hx0, -hh, S * 0.085, hh * 2); x.clip(); x.fillStyle = '#ffd23a'; x.fillRect(hx0, -hh, S * 0.085, hh * 2); x.fillStyle = '#3a3f4c'; for (i = -8; i < 9; i++) { x.beginPath(); x.moveTo(hx0, i * S * 0.12); x.lineTo(hx0 + S * 0.085, i * S * 0.12 + S * 0.06); x.lineTo(hx0 + S * 0.085, i * S * 0.12 + S * 0.12); x.lineTo(hx0, i * S * 0.12 + S * 0.06); x.fill(); } x.restore();
    [-1, 1].forEach(function (sd) { x.fillStyle = '#2c303c'; x.beginPath(); x.ellipse(-0.02 * S, sd * (hw + S * 0.035), S * 0.07, S * 0.04, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = col; x.beginPath(); x.ellipse(-0.02 * S, sd * (hw + S * 0.035), S * 0.03, S * 0.015, 0, 0, Math.PI * 2); x.fill(); });
    [-0.3, 0.3].forEach(function (u) { x.fillStyle = twInkC('#59607a'); x.beginPath(); x.arc(hx0 + S * 0.19, u * S, S * 0.062, 0, Math.PI * 2); x.fill(); x.fillStyle = '#59607a'; x.beginPath(); x.arc(hx0 + S * 0.19, u * S, S * 0.046, 0, Math.PI * 2); x.fill(); x.fillStyle = '#aab2c8'; x.beginPath(); x.arc(hx0 + S * 0.178, u * S - S * 0.014, S * 0.022, 0, Math.PI * 2); x.fill(); });
  } else {
    // 나무: 널빤지 결, 가장자리 굵은 나무, 말뚝, 밧줄 타래
    for (i = 0; x0 + i * S * 0.11 < x1; i++) { var bx = x0 + i * S * 0.11; x.fillStyle = rgba(i % 3 === 1 ? '#fff0c8' : '#8a4a2a', i % 3 === 1 ? 0.22 : i % 3 ? 0.1 : 0); x.fillRect(bx, -hw, S * 0.11, hw * 2); x.fillStyle = rgba(dk, 0.6); x.fillRect(bx, -hw, Math.max(1, S * 0.014), hw * 2); }
    for (i = 0; i < 8; i++) { var by = -hh + i * hh / 4; x.fillStyle = rgba(i % 3 === 1 ? '#fff0c8' : '#8a4a2a', i % 3 === 1 ? 0.22 : i % 3 ? 0.1 : 0); x.fillRect(hx0, by, hx1 - hx0, hh / 4); x.fillStyle = rgba(dk, 0.6); x.fillRect(hx0, by, hx1 - hx0, Math.max(1, S * 0.014)); }
    x.fillStyle = 'rgba(255,246,214,0.35)'; x.fillRect(x0, -hw, x1 - x0, hw * 0.22);
    x.strokeStyle = dk; x.lineWidth = S * 0.035; x.strokeRect(hx0 + S * 0.017, -hh + S * 0.017, hx1 - hx0 - S * 0.034, hh * 2 - S * 0.034);
    var posts = [[hx0, -hh], [hx0, hh], [hx1, -hh], [hx1, hh], [x0 + (x1 - x0) * 0.45, -hw], [x0 + (x1 - x0) * 0.45, hw], [hx0, 0]];
    if (p.land) posts.push([x1 - S * 0.3, -hw], [x1 - S * 0.3, hw]);
    posts.forEach(function (q) { x.fillStyle = twInkC('#b87a48'); x.beginPath(); x.arc(q[0], q[1], S * 0.06, 0, Math.PI * 2); x.fill(); x.fillStyle = '#c98a54'; x.beginPath(); x.arc(q[0], q[1], S * 0.045, 0, Math.PI * 2); x.fill(); x.fillStyle = '#f6d9a4'; x.beginPath(); x.arc(q[0] - S * 0.012, q[1] - S * 0.012, S * 0.02, 0, Math.PI * 2); x.fill(); });
    x.strokeStyle = twInkC('#e8d8a8'); x.lineWidth = S * 0.05; x.beginPath(); x.arc(hx0 + S * 0.17, hh * 0.45, S * 0.055, 0, Math.PI * 2); x.stroke(); x.strokeStyle = '#f2e6c0'; x.lineWidth = S * 0.028; x.stroke();
  }
  x.restore();
}
// 다리: 길이 물(용암)을 건너는 칸에 놓음. 나무 널다리(기본)와 돌다리 두 가지. 길 그린 뒤에 부름
function mwBridges(x, g, view, T, rnd) {
  var br = mwBridgeCells(g), S = view.S, th = g.M.theme, stone = T.bridge ? T.bridge === 'stone' : (!!T.lava || T.road === 'cobble' || T.road === 'obsidian' || !!MW_STONE[th]);
  function on(p, i) { var c = Math.floor(p.xs[i]), r = Math.floor(p.ys[i]); return c >= 0 && r >= 0 && c < COLS && r < ROWS && br[r * COLS + c] ? 1 : 0; }
  g.paths.forEach(function (p) {
    var i = 0;
    while (i < p.n) {
      if (!on(p, i)) { i++; continue; }
      var i0 = i; while (i < p.n && on(p, i)) i++;
      mwBridgeRun(x, p, Math.max(0, i0 - 4), Math.min(p.n - 1, i + 3), view, stone, T);
    }
  });
}
function mwBridgeRun(x, p, a, b, view, stone, T) {
  var S = view.S, ox = view.ox, oy = view.oy, hw = 0.5, Lp = [], Rp = [], i, k;
  for (i = a; i <= b; i++) { var i0 = Math.max(0, i - 1), i1 = Math.min(p.n - 1, i + 1), dx = p.xs[i1] - p.xs[i0], dy = p.ys[i1] - p.ys[i0], L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; Lp.push([ox + (p.xs[i] + dy * hw) * S, oy + (p.ys[i] - dx * hw) * S]); Rp.push([ox + (p.xs[i] - dy * hw) * S, oy + (p.ys[i] + dx * hw) * S]); }
  var n = Lp.length; if (n < 3) return;
  function poly() { x.beginPath(); for (k = 0; k < n; k++) { if (!k) x.moveTo(Lp[k][0], Lp[k][1]); else x.lineTo(Lp[k][0], Lp[k][1]); } for (k = n - 1; k >= 0; k--) x.lineTo(Rp[k][0], Rp[k][1]); x.closePath(); }
  function side(P2, w, c) { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); for (k = 0; k < n; k++) { if (!k) x.moveTo(P2[k][0], P2[k][1]); else x.lineTo(P2[k][0], P2[k][1]); } x.stroke(); }
  var col = stone ? (T.lava ? '#e8cdb4' : '#e4ddd0') : '#e6ab68', dk = stone ? (T.lava ? '#a8785c' : '#9c94a4') : '#a9683c', iw = Math.max(1, S * 0.02);
  x.save(); x.lineJoin = 'round'; x.lineCap = 'butt';
  x.save(); x.translate(S * 0.05, S * 0.1); x.fillStyle = 'rgba(14,26,70,0.3)'; poly(); x.fill(); x.restore();
  x.fillStyle = col; poly(); x.fill();
  // 널빤지(돌판) 이음
  var step = stone ? 5 : 2;
  for (k = 0; k + step < n; k += step) {
    var t = (Math.floor((a + k) / step) * 7) % 3;
    x.fillStyle = t === 1 ? 'rgba(255,248,224,0.3)' : t === 2 ? rgba(dk, 0.12) : 'rgba(0,0,0,0)';
    x.beginPath(); x.moveTo(Lp[k][0], Lp[k][1]); x.lineTo(Lp[k + step][0], Lp[k + step][1]); x.lineTo(Rp[k + step][0], Rp[k + step][1]); x.lineTo(Rp[k][0], Rp[k][1]); x.closePath(); x.fill();
    x.strokeStyle = rgba(dk, stone ? 0.5 : 0.62); x.lineWidth = Math.max(1, S * 0.014); x.beginPath(); x.moveTo(Lp[k][0], Lp[k][1]); x.lineTo(Rp[k][0], Rp[k][1]); x.stroke();
  }
  // 난간: 진한 테두리 + 몸 + 밝은 윗면, 기둥머리
  [Lp, Rp].forEach(function (P2, si) {
    side(P2, S * (stone ? 0.13 : 0.1) + iw * 2, twInkC(dk)); side(P2, S * (stone ? 0.13 : 0.1), stone ? mixc(col, dk, 0.35) : '#bf7e4a'); side(P2, S * (stone ? 0.05 : 0.035), stone ? '#faf6ec' : '#f0c890');
    for (k = 1; k < n; k += stone ? 10 : 8) { var q = P2[Math.min(n - 1, k)]; x.fillStyle = twInkC(dk); x.beginPath(); x.arc(q[0], q[1], S * 0.075, 0, Math.PI * 2); x.fill(); x.fillStyle = stone ? '#f1ece0' : '#d2925a'; x.beginPath(); x.arc(q[0], q[1], S * 0.058, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(q[0] - S * 0.016, q[1] - S * 0.018, S * 0.024, 0, Math.PI * 2); x.fill(); }
  });
  x.restore();
}
// 물 움직임(매 프레임, 싸게): 물 안쪽 자리에 미리 구운 흰 물마루와 반짝이를 켰다 끄며 조금씩 흘림. 용암은 예전과 같은 빛 얼룩
var MW_SPR = {};
function mwSeaSpr(S) {
  var key = Math.round(S); if (MW_SPR[key]) return MW_SPR[key];
  function crest(w, h, lw) { var c = mkC(w + 4, h + 4), x = cx2(c); x.lineCap = 'round'; x.strokeStyle = '#ffffff'; x.lineWidth = lw; x.beginPath(); x.moveTo(2 + lw, h); x.quadraticCurveTo(2 + w * 0.3, 2 + lw * 0.5, 2 + w * 0.55, h * 0.75); x.quadraticCurveTo(2 + w * 0.78, 2 + lw, w - lw, h * 0.8); x.stroke(); return c; }
  var tw = mkC(S * 0.3, S * 0.3), tx = cx2(tw); twTwinkle(tx, S * 0.15, S * 0.15, S * 0.14, 1);
  return (MW_SPR[key] = { c: [crest(S * 0.3, S * 0.085, Math.max(1.2, S * 0.026)), crest(S * 0.42, S * 0.1, Math.max(1.4, S * 0.03))], tw: tw });
}
function mwLiqInit(g, S) {
  var L = { S: S, w: [], lava: [] }, F = g.mwF, nW = 0, r, c, n, k, tries;
  for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) { k = g.kind[r * COLS + c]; if (k === 'lava') for (n = 0; n < 3; n++) L.lava.push({ x: c + Math.random(), y: r + Math.random(), ph: Math.random() * 6.28 }); else if (k === 'water') nW++; }
  var want = Math.min(130, Math.round(nW * 0.85));
  for (n = 0, tries = 0; n < want && tries < want * 12; tries++) {
    var wx = Math.random() * (COLS + 1.6) - 0.8, wy = Math.random() * (ROWS + 1.6) - 0.8;
    if (F ? F.at(wx, wy) < 0.9 || F.at(wx + 0.25, wy) < 0.9 || F.at(wx - 0.2, wy) < 0.9 : g.kind[clamp(Math.floor(wy), 0, ROWS - 1) * COLS + clamp(Math.floor(wx), 0, COLS - 1)] !== 'water') continue;
    L.w.push({ x: wx, y: wy, ph: Math.random(), sp: 0.16 + Math.random() * 0.14, k: n % 5 === 4 ? 2 : n % 2 }); n++;
  }
  return L;
}
function mwLiquidAnim(x, g, time) {
  var S = RD.view.S, T = THEME[g.M.theme] || {}, L = RD.liq, i, p, u, a;
  if (!L || L.S !== S || !L.w) L = RD.liq = mwLiqInit(g, S);
  if (T.ice || (!L.w.length && !L.lava.length)) return;
  if (L.lava.length) {
    x.save(); x.globalCompositeOperation = 'lighter'; var gl = glowSpr('#ffb040', 32);
    for (i = 0; i < L.lava.length; i++) { p = L.lava[i]; x.globalAlpha = 0.35 * (0.5 + 0.5 * Math.sin(time * 1.3 + p.ph)); x.drawImage(gl, WX(p.x) - S * 0.35, WY(p.y) - S * 0.2, S * 0.7, S * 0.4); }
    x.restore();
  }
  if (!L.w.length) return;
  var sp = mwSeaSpr(S), step = RD.lowFx ? 2 : 1, ox = RD.view.ox + RD.shx, oy = RD.view.oy + RD.shy, c0 = sp.c[0], c1 = sp.c[1], tw = sp.tw, tws = tw.width;
  for (i = 0; i < L.w.length; i += step) {
    p = L.w[i]; u = time * p.sp + p.ph; u -= Math.floor(u); a = u < 0.5 ? u * 2 : 2 - u * 2; if (a < 0.08) continue;
    if (p.k === 2) { a = a * a; x.globalAlpha = a; var d = tws * (0.45 + 0.55 * a); x.drawImage(tw, ox + p.x * S - d / 2, oy + p.y * S - d / 2, d, d); }
    else { x.globalAlpha = a * 0.78; var im = p.k ? c1 : c0; x.drawImage(im, ox + (p.x + (u - 0.5) * 0.3) * S - im.width / 2, oy + p.y * S - im.height / 2); }
  }
  x.globalAlpha = 1;
}

// ================= 2. 4장 도깨비 고개 지형 5종 =================
// 색: 한지 같은 따뜻한 바탕 + 단청 오방색(청 #3a78c8, 적 #e0503a, 황 #f2c832, 백 #fff8e2, 흑 #3a3440, 뇌록 #3f9a80) 포인트
// THEME 추가 칸: mw(이 파일이 그림), sea(바다색), pier, bridge, rk(바위 칸 소품), wprops(격자 밖 물 위 소품), ui(지도 띠 색 [진, 중, 밝]), key(대표색), gate(성문 색), amb(mwFly 반딧불, mwMist 대숲 안개, mwSnow 눈, mwGull 갈매기, mwMaple 단풍잎)
// 판 자료의 선택 칸: M.rule.id === 'night' 또는 M.night → 달빛 색 보정 + 길가 청사초롱, M.amb → 날씨 입자 바꾸기(예: 'mwSnow')
THEME.hanok = { mw: 1, g: ['#8dbb66', '#a2ca76', '#b9d88a'], patch: '#d9c88e', grass: ['#5a9a4c', '#74b25a', '#9ccc72', '#d2ec9c'], dirt: ['#a87848', '#ecd09c', '#f8e3ba', '#fff4da'], road: 'mwDirt',
  tree: ['#3c8a4e', '#58a85e', '#86c876', '#cdeea0'], trunk: '#8a5c3c', rock: '#c4bbae', moss: '#8fcf6c', flowers: ['#ffffff', '#ffe066', '#ffb0c8'], water: ['#3aa6c0', '#6cc8d8', '#d6f6f4'], shore: '#e6d6a8', sea: ['#1f86a8', '#3aaac4', '#8fdcd8'],
  light: '#fff0c8', lightA: 0.14, shade: '#6a5078', amb: 'mwFly', ambN: 20, props: ['mwGiwa', 'mwChoga', 'mwGam', 'mwWall', 'mwPine', 'mwJars', 'mwSotdae', 'mwChoga', 'mwHay', 'tree'], a: 'mwJar', b: 'mwJars', c: 'mwHay', C: 'mwBigTree', rk: 'h',
  ui: ['#b6cf7e', '#cadd94', '#e0ecb0'], key: '#5a6478', gate: { roof: '#5a6478', stone: '#e2dccc', flag: ['#e0503a', '#3a78c8'] } };
THEME.bamboo = { mw: 1, g: ['#3d8c5e', '#4b9c68', '#61ae78'], patch: '#7cc088', grass: ['#2a7450', '#3c8c5c', '#62b070', '#a6e09a'], dirt: ['#7c6444', '#dcc698', '#ead8b0', '#f8ecce'], road: 'mwTrail',
  tree: ['#2a7a4c', '#3f9a5c', '#6cc074', '#b8ec9c'], trunk: '#6f8a48', rock: '#aab4a8', moss: '#6fc26c', flowers: ['#ffffff', '#d8f0a0'], water: ['#2f9c98', '#5cc4b4', '#ccf6e6'], shore: '#b8d4a8', sea: ['#1c7c80', '#2f9c98', '#84d8c4'],
  light: '#f0ffe0', lightA: 0.1, shade: '#2c4a6a', amb: 'mwMist', ambN: 12, props: ['mwBamboo', 'mwBamboo', 'mwBamboo', 'mwCairn', 'mwBamboo', 'mwShoots', 'mwBamboo', 'rock'], a: 'mwShoots', b: 'mwCairn', c: 'mwBamboo', C: 'mwBoulder', rk: 'b',
  ui: ['#6fb886', '#8aca9c', '#aadcb6'], key: '#3f9a5c', gate: { roof: '#4e6a64', stone: '#d6dccc', flag: ['#3f9a80', '#f2c832'] } };
THEME.palace = { mw: 1, g: ['#c9bea6', '#d5cbb4', '#e0d8c4'], patch: '#beb49c', grass: ['#7aa860', '#8eb86c', '#a8cc80', '#d0e8a8'], dirt: ['#8c826e', '#f4ecda', '#fbf6ea', '#ffffff'], road: 'mwPave',
  tree: ['#2f7d5a', '#479a6c', '#7cc48a', '#c0ecb0'], trunk: '#a8583c', rock: '#d6d0c4', moss: '#9ccc80', flowers: ['#ffffff', '#ffd0e0'], water: ['#3f9cb4', '#70c4d0', '#d8f4f0'], shore: '#d8d0bc', sea: ['#2a7c98', '#3f9cb4', '#90d4d4'], bridge: 'stone',
  light: '#fff2d6', lightA: 0.12, shade: '#5a4a72', amb: 'mwSnow', ambN: 40, props: ['mwHall', 'mwPine', 'mwStoneLamp', 'mwWallP', 'mwHall', 'mwPine', 'mwUrn', 'mwWallP'], a: 'mwRank', b: 'mwStoneLamp', c: 'mwUrn', C: 'mwHaetae', rk: 'p',
  ui: ['#d8c8a4', '#e6dabc', '#f2ebd6'], key: '#c9483a', gate: { roof: '#56617a', stone: '#e8e2d4', flag: ['#e0503a', '#f2c832'], gold: 1 } };
THEME.pogu = { mw: 1, g: ['#e4d09c', '#edddb0', '#f5e9c6'], patch: '#b6d48c', grass: ['#7aa85c', '#90bc68', '#b2d480', '#dcf0a8'], dirt: ['#8a5a3a', '#dca66c', '#ecbe86', '#fbe0b4'], road: 'mwPlank',
  tree: ['#2f7d5a', '#479a6c', '#7cc48a', '#c0ecb0'], trunk: '#a8583c', rock: '#8e8a94', moss: '#b2d480', flowers: ['#ffffff', '#ffc0d0', '#ffe066'], water: ['#3cc4b2', '#7cdcc8', '#dcfcf0'], shore: '#f6ecc8', sea: ['#1b9694', '#3cc4b2', '#a4eed0'], pier: 'wood',
  light: '#fff6d8', lightA: 0.16, shade: '#4a6a9a', amb: 'mwGull', ambN: 5, props: ['mwPine', 'mwNet', 'mwPine', 'mwBoatL', 'mwChoga', 'mwBasket', 'mwPine', 'mwSeaRock'], wprops: ['mwBoat', 'mwSeaRock', 'mwBoat', 'mwSeaRock'], a: 'mwBasket', b: 'mwNet', c: 'mwBoatL', C: 'mwIslet', rk: 's',
  ui: ['#7fd4c4', '#a4e4d4', '#c8f2e4'], key: '#3cc4b2', gate: { roof: '#4f6474', stone: '#ece4d0', flag: ['#3a78c8', '#ffffff'] } };
THEME.sansa = { mw: 1, g: ['#b4aa58', '#c8ba66', '#dccc7c'], patch: '#ecb252', grass: ['#7c8c44', '#94a450', '#b8c066', '#e4e090'], dirt: ['#7a7166', '#dad4c6', '#eae5d8', '#f8f5ec'], road: 'mwSteps',
  tree: ['#a8322c', '#e0503a', '#f5855a', '#ffd0a0'], trunk: '#6a4636', rock: '#c0b6a8', moss: '#c8b860', flowers: ['#f08c2e', '#e0503a', '#f2c832'], water: ['#3f8fb0', '#6cb8cc', '#d4f0f4'], shore: '#d8cca0', sea: ['#2a7090', '#3f8fb0', '#8cc8d4'], bridge: 'stone',
  light: '#ffe8c0', lightA: 0.16, shade: '#6a3a5a', amb: 'mwMaple', ambN: 26, props: ['mwMaple', 'mwMaple', 'mwGinkgo', 'mwTemple', 'mwMaple', 'mwStoneLamp', 'mwPagodaS', 'mwGinkgo', 'mwPine', 'mwCairn'], a: 'mwLeafPile', b: 'mwCairn', c: 'mwStoneLamp', C: 'mwPagoda', rk: 'l',
  ui: ['#e8a85c', '#f2c078', '#f8d89c'], key: '#e0503a', gate: { roof: '#5c5a66', stone: '#e0d8c8', flag: ['#f08c2e', '#e0503a'] } };
// 지도 띠 색: THEME[k].ui 를 돌려줌(없으면 땅 색). ui_art.js 의 UI_BAND_COL 에도 한 번 넣어 둠(그 표가 있을 때만)
function mwThemeUi(th) { var T = THEME[th]; if (!T) return ['#93db7a', '#aae890', '#c3f2a8']; return T.ui || (typeof UI_BAND_COL !== 'undefined' && UI_BAND_COL && UI_BAND_COL[th]) || [T.g[0], T.g[1], T.g[2]]; }

// ---------- 칠 도구 ----------
function mwInk(x, s, col, w, a) { x.save(); if (a != null) x.globalAlpha = a; x.strokeStyle = mixc(col, '#3a2636', 0.66); x.lineWidth = w == null ? TW_IW : w; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(s.p); x.restore(); }
function mwRR(x, x0, y0, w, h, r, col, o) { var s = shp().rrect(x0, y0, w, h, r); twFill(x, s, col, o); mwInk(x, s, col); return s; }
function mwEl(x, cx, cy, rx, ry, col, o) { var s = shp().ell(cx, cy, rx, ry); twFill(x, s, col, o); mwInk(x, s, col); return s; }
function mwPg(x, pts, col, o) { var s = shp().poly(pts); twFill(x, s, col, o); mwInk(x, s, col); return s; }
// 기와지붕(앞에서 본 모습): 처마 끝이 살짝 들리고, 기왓골과 용마루, 양 끝 망와
function mwRoof(x, cx, y, w, h, col, o) {
  o = o || {};
  var s = shp(), p = s.p, hw = w / 2, rw = w * (o.rw || 0.3), lift = h * (o.lift == null ? 0.22 : o.lift), n = o.n || 9, k;
  p.moveTo(cx - rw, y - h); p.lineTo(cx + rw, y - h);
  p.quadraticCurveTo(cx + hw * 0.7, y - h * 0.4, cx + hw, y - lift); p.quadraticCurveTo(cx + hw * 0.5, y + h * 0.1, cx, y + h * 0.06);
  p.quadraticCurveTo(cx - hw * 0.5, y + h * 0.1, cx - hw, y - lift); p.quadraticCurveTo(cx - hw * 0.7, y - h * 0.4, cx - rw, y - h); p.closePath();
  s.ext(cx - hw, y - h); s.ext(cx + hw, y + h * 0.1);
  twFill(x, s, col, { hi: 0.3, lo: 0.3, ax: 0.1, bx: 0.9 });
  x.save(); x.clip(p);
  x.strokeStyle = rgba(twSh(col, 0.6), 0.5); x.lineWidth = Math.max(0.8, w * 0.012);
  for (k = -n; k <= n; k++) { var u = k / n; x.beginPath(); x.moveTo(cx + u * rw, y - h); x.quadraticCurveTo(cx + u * hw * 0.8, y - h * 0.4, cx + u * hw * 0.99, y + h * 0.1); x.stroke(); }
  x.fillStyle = rgba(twLt(col, 0.6), 0.3); x.beginPath(); x.moveTo(cx - rw, y - h); x.lineTo(cx + rw * 0.1, y - h); x.quadraticCurveTo(cx - hw * 0.25, y - h * 0.5, cx - hw * 0.9, y - lift * 0.5); x.closePath(); x.fill();
  x.strokeStyle = rgba(twLt(col, 0.6), 0.95); x.lineWidth = Math.max(1, h * 0.075); x.beginPath(); x.moveTo(cx - hw, y - lift); x.quadraticCurveTo(cx - hw * 0.5, y + h * 0.08, cx, y + h * 0.04); x.quadraticCurveTo(cx + hw * 0.5, y + h * 0.08, cx + hw, y - lift); x.stroke();
  x.restore();
  mwInk(x, s, col);
  var rc = o.ridge || twLt(col, 0.22), rs = shp().rrect(cx - rw - w * 0.02, y - h - h * 0.1, rw * 2 + w * 0.04, h * 0.17, h * 0.07); twFill(x, rs, rc, { hi: 0.4 }); mwInk(x, rs, rc, TW_IW * 0.85);
  [-1, 1].forEach(function (sd) { var e = shp(), ex = cx + sd * rw; e.p.moveTo(ex - sd * w * 0.01, y - h + h * 0.06); e.p.quadraticCurveTo(ex + sd * w * 0.04, y - h - h * 0.04, ex + sd * w * 0.05, y - h - h * 0.3); e.p.quadraticCurveTo(ex - sd * w * 0.01, y - h - h * 0.2, ex - sd * w * 0.035, y - h - h * 0.08); e.p.closePath(); e.ext(ex - w * 0.06, y - h - h * 0.3); e.ext(ex + w * 0.06, y - h + h * 0.06); twFill(x, e, o.fin || rc, { hi: 0.4 }); mwInk(x, e, o.fin || rc, TW_IW * 0.8); });
  return s;
}
// 초가지붕: 둥근 볏짚 지붕 + 새끼줄
function mwThatch(x, cx, y, w, h) {
  var col = '#e8bd5c', s = shp(), p = s.p, hw = w / 2, k;
  p.moveTo(cx - hw, y); p.bezierCurveTo(cx - hw * 0.95, y - h * 0.75, cx - hw * 0.45, y - h, cx, y - h); p.bezierCurveTo(cx + hw * 0.45, y - h, cx + hw * 0.95, y - h * 0.75, cx + hw, y);
  p.quadraticCurveTo(cx, y + h * 0.16, cx - hw, y); p.closePath(); s.ext(cx - hw, y - h); s.ext(cx + hw, y + h * 0.1);
  twFill(x, s, col, { hi: 0.35, lo: 0.3 });
  x.save(); x.clip(p);
  x.strokeStyle = rgba('#a87424', 0.38); x.lineWidth = Math.max(0.8, w * 0.011);
  for (k = -7; k <= 7; k++) { var u = k / 7; x.beginPath(); x.moveTo(cx + u * hw * 0.25, y - h); x.quadraticCurveTo(cx + u * hw * 0.8, y - h * 0.55, cx + u * hw * 1.02, y + h * 0.1); x.stroke(); }
  x.strokeStyle = rgba('#8a5a1c', 0.5); x.lineWidth = Math.max(0.9, w * 0.014);
  [0.4, 0.72].forEach(function (v) { x.beginPath(); x.moveTo(cx - hw, y - h * (1 - v) + h * 0.02); x.quadraticCurveTo(cx, y - h * (1 - v) + h * 0.2, cx + hw, y - h * (1 - v) + h * 0.02); x.stroke(); });
  x.fillStyle = 'rgba(255,246,200,0.4)'; x.beginPath(); x.ellipse(cx - hw * 0.35, y - h * 0.7, hw * 0.4, h * 0.2, -0.3, 0, Math.PI * 2); x.fill();
  x.restore();
  mwInk(x, s, col);
  return s;
}
// 집: giwa 기와집, choga 초가, hall 궁궐 전각(붉은 기둥, 녹색 창살, 단청), temple 절집(단청, 풍경)
function mwHouse(S, kind, rnd) {
  var big = kind === 'hall' || kind === 'temple', o = canvasFor(S, big ? 2.8 : 2.3, big ? 2.2 : 1.8, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * (big ? 1.12 : 1), i, q;
  var bw = sz * (kind === 'choga' ? 1.1 : 1.3), bh = sz * (big ? 0.5 : 0.42), base = sz * 0.1;
  twShadow(x, gx + sz * 0.12, gy, bw * 0.75, sz * 0.2, 0.4);
  mwRR(x, gx - bw * 0.56, gy - base, bw * 1.12, base * 1.15, base * 0.3, '#cfc7b8', { hi: 0.3 });
  mwRR(x, gx - bw / 2, gy - base - bh, bw, bh, sz * 0.02, kind === 'choga' ? '#f0dcae' : kind === 'giwa' ? '#f6eedc' : '#ead9b6', { hi: 0.2, lo: 0.2 });
  var pc = kind === 'hall' ? '#c9483a' : kind === 'temple' ? '#a8543a' : '#7a5236', np = kind === 'choga' ? 3 : big ? 5 : 4, dc = kind === 'hall' ? '#3f9a80' : kind === 'temple' ? '#4a9088' : '#fff8e2';
  for (i = 0; i < np - 1; i++) {
    var dx0 = gx - bw / 2 + bw * (i + 0.5) / (np - 1), dw = bw / (np - 1) * 0.6, dh = bh * 0.76, ds = shp().rrect(dx0 - dw / 2, gy - base - dh, dw, dh, sz * 0.01);
    twFill(x, ds, dc, { hi: 0.25, lo: 0.15 });
    x.save(); x.clip(ds.p); x.strokeStyle = rgba(big ? '#ffe7a0' : '#a8845c', 0.75); x.lineWidth = Math.max(0.7, sz * 0.01);
    for (q = 1; q < 4; q++) { x.beginPath(); x.moveTo(dx0 - dw / 2 + dw * q / 4, gy - base - dh); x.lineTo(dx0 - dw / 2 + dw * q / 4, gy - base); x.moveTo(dx0 - dw / 2, gy - base - dh * q / 4); x.lineTo(dx0 + dw / 2, gy - base - dh * q / 4); x.stroke(); }
    x.restore(); mwInk(x, ds, pc, TW_IW * 0.7);
  }
  for (i = 0; i < np; i++) mwRR(x, gx - bw / 2 + bw * i / (np - 1) - sz * 0.03, gy - base - bh, sz * 0.06, bh, sz * 0.01, pc, { hi: 0.35 });
  if (big) {
    var bs = shp().rrect(gx - bw * 0.54, gy - base - bh - sz * 0.07, bw * 1.08, sz * 0.1, sz * 0.01), cs = ['#e0503a', '#f2c832', '#3a78c8', '#fff8e2']; twFill(x, bs, '#3f9a80', { hi: 0.2 });
    x.save(); x.clip(bs.p); for (i = 0; i < 18; i++) { x.fillStyle = cs[i % 4]; x.beginPath(); x.arc(gx - bw * 0.52 + bw * 1.04 * (i + 0.5) / 18, gy - base - bh - sz * 0.02, sz * 0.024, 0, Math.PI * 2); x.fill(); } x.restore(); mwInk(x, bs, '#3f9a80', TW_IW * 0.7);
  } else mwRR(x, gx - bw * 0.52, gy - base - bh - sz * 0.03, bw * 1.04, sz * 0.05, sz * 0.01, pc, { hi: 0.3 });
  var ry = gy - base - bh - sz * (big ? 0.05 : 0);
  if (kind === 'choga') mwThatch(x, gx, ry + sz * 0.07, bw * 1.42, sz * 0.62);
  else mwRoof(x, gx, ry, bw * (big ? 1.6 : 1.5), sz * (big ? 0.62 : 0.5), big ? '#56617a' : '#5a6478', { fin: kind === 'hall' ? '#e9b436' : null, n: big ? 11 : 9 });
  if (kind === 'temple') mwWindBell(x, gx + bw * 0.76, ry - sz * 0.1, sz);
  return spr(o.c, gx, gy);
}
// 풍경(처마 끝 작은 종 + 물고기 판)
function mwWindBell(x, fx, fy, sz) {
  x.save(); x.strokeStyle = '#6a5a4a'; x.lineWidth = Math.max(0.8, sz * 0.012); x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx, fy + sz * 0.24); x.stroke(); x.restore();
  var bl = shp(); bl.p.moveTo(fx - sz * 0.05, fy + sz * 0.17); bl.p.quadraticCurveTo(fx - sz * 0.045, fy + sz * 0.07, fx, fy + sz * 0.07); bl.p.quadraticCurveTo(fx + sz * 0.045, fy + sz * 0.07, fx + sz * 0.05, fy + sz * 0.17); bl.p.closePath(); bl.ext(fx - sz * 0.05, fy + sz * 0.07); bl.ext(fx + sz * 0.05, fy + sz * 0.17);
  twFill(x, bl, '#e9b436', { hi: 0.5 }); mwInk(x, bl, '#e9b436', TW_IW * 0.7);
  var fs = shp().ell(fx, fy + sz * 0.26, sz * 0.04, sz * 0.022); twFill(x, fs, '#bfe0d8'); mwInk(x, fs, '#6aa89a', TW_IW * 0.6);
}
// 옹기 항아리
function mwJarAt(x, cx, gy, w, h, col) {
  var s = shp(), p = s.p;
  p.moveTo(cx - w * 0.26, gy); p.bezierCurveTo(cx - w * 0.62, gy - h * 0.3, cx - w * 0.6, gy - h * 0.78, cx - w * 0.3, gy - h * 0.88); p.lineTo(cx + w * 0.3, gy - h * 0.88); p.bezierCurveTo(cx + w * 0.6, gy - h * 0.78, cx + w * 0.62, gy - h * 0.3, cx + w * 0.26, gy); p.closePath(); s.ext(cx - w * 0.55, gy - h * 0.88); s.ext(cx + w * 0.55, gy);
  twCylG(x, s, col, { hi: 0.5, lo: 0.35 });
  x.save(); x.clip(p); x.strokeStyle = rgba(twSh(col, 0.5), 0.4); x.lineWidth = Math.max(0.7, w * 0.035); x.beginPath(); x.moveTo(cx - w * 0.6, gy - h * 0.64); x.quadraticCurveTo(cx, gy - h * 0.55, cx + w * 0.6, gy - h * 0.64); x.stroke(); x.restore();
  mwInk(x, s, col);
  var ld = shp(), q = ld.p; q.moveTo(cx - w * 0.4, gy - h * 0.86); q.quadraticCurveTo(cx, gy - h * 1.1, cx + w * 0.4, gy - h * 0.86); q.quadraticCurveTo(cx, gy - h * 0.79, cx - w * 0.4, gy - h * 0.86); q.closePath(); ld.ext(cx - w * 0.4, gy - h * 1.0); ld.ext(cx + w * 0.4, gy - h * 0.82);
  twFill(x, ld, twLt(col, 0.14), { hi: 0.4 }); mwInk(x, ld, col, TW_IW * 0.85);
  var kn = shp().ell(cx, gy - h * 1.0, w * 0.09, h * 0.04); twFill(x, kn, col); mwInk(x, kn, col, TW_IW * 0.7);
  twShine(x, cx - w * 0.3, gy - h * 0.52, w * 0.06, h * 0.15, 0.6, 0.15);
}
// 돌 한 덩이(납작한 둥근 돌)
function mwStone(x, cx, cy, rx, ry, col, moss) {
  var s = shp().ell(cx, cy, rx, ry); twFill(x, s, col, { hi: 0.35, lo: 0.3 });
  x.save(); x.clip(s.p); x.fillStyle = rgba(twLt(col, 0.5), 0.8); x.beginPath(); x.ellipse(cx - rx * 0.15, cy - ry * 0.45, rx * 0.7, ry * 0.45, 0, 0, Math.PI * 2); x.fill(); if (moss) { x.fillStyle = rgba(moss, 0.8); x.beginPath(); x.ellipse(cx + rx * 0.3, cy - ry * 0.6, rx * 0.5, ry * 0.4, 0, 0, Math.PI * 2); x.fill(); } x.restore();
  mwInk(x, s, col); return s;
}
// 잎 한 장(단풍, 대나무 잎 따위): 뾰족한 타원
function mwLeaf(x, px, py, len, wid, ang, col) { x.save(); x.translate(px, py); x.rotate(ang); x.fillStyle = col; x.beginPath(); x.moveTo(-len / 2, 0); x.quadraticCurveTo(0, -wid, len / 2, 0); x.quadraticCurveTo(0, wid, -len / 2, 0); x.fill(); x.restore(); }
// 석탑(n층)
function mwPagodaAt(x, gx, gy, sz, n, col) {
  mwRR(x, gx - sz * 0.42, gy - sz * 0.1, sz * 0.84, sz * 0.12, sz * 0.03, col, { hi: 0.3 });
  mwRR(x, gx - sz * 0.34, gy - sz * 0.24, sz * 0.68, sz * 0.15, sz * 0.02, twLt(col, 0.1), { hi: 0.3 });
  var y = gy - sz * 0.24, k;
  for (k = 0; k < n; k++) {
    var w = sz * (0.44 - k * 0.075), h = sz * (0.2 - k * 0.025), rw = w * 1.5;
    mwRR(x, gx - w / 2, y - h, w, h, sz * 0.015, col, { hi: 0.35, lo: 0.25 });
    y -= h;
    var rf = shp(), p = rf.p, rh = sz * 0.11; p.moveTo(gx - rw / 2, y - rh * 0.25); p.quadraticCurveTo(gx - rw * 0.3, y - rh * 0.3, gx - w * 0.42, y - rh); p.lineTo(gx + w * 0.42, y - rh); p.quadraticCurveTo(gx + rw * 0.3, y - rh * 0.3, gx + rw / 2, y - rh * 0.25); p.lineTo(gx + rw * 0.46, y + rh * 0.12); p.quadraticCurveTo(gx, y + rh * 0.3, gx - rw * 0.46, y + rh * 0.12); p.closePath(); rf.ext(gx - rw / 2, y - rh); rf.ext(gx + rw / 2, y + rh * 0.3);
    twFill(x, rf, twLt(col, 0.18), { hi: 0.35, lo: 0.3 }); mwInk(x, rf, col);
    y -= rh;
  }
  mwRR(x, gx - sz * 0.035, y - sz * 0.16, sz * 0.07, sz * 0.17, sz * 0.02, col, { hi: 0.3 });
  mwEl(x, gx, y - sz * 0.19, sz * 0.055, sz * 0.05, twLt(col, 0.2), { hi: 0.4 });
}
// 소나무: 굽은 붉은 줄기 + 납작한 잎 뭉치 세 층
function mwPineAt(x, gx, gy, sz, T, rnd) {
  var lean = (rnd() - 0.5) * sz * 0.3, tc = '#b0603e', pal = ['#226a4e', '#34885c', '#5cb074', '#a8e09a'];
  x.save(); x.lineCap = 'round'; x.strokeStyle = mixc(tc, '#3a2636', 0.66); x.lineWidth = sz * 0.13 + TW_IW * 2; x.beginPath(); x.moveTo(gx, gy); x.bezierCurveTo(gx - lean * 0.6, gy - sz * 0.4, gx + lean * 1.4, gy - sz * 0.6, gx + lean, gy - sz * 1.0); x.stroke();
  x.strokeStyle = tc; x.lineWidth = sz * 0.13; x.stroke(); x.strokeStyle = rgba('#f0a070', 0.6); x.lineWidth = sz * 0.035; x.beginPath(); x.moveTo(gx - sz * 0.03, gy - sz * 0.05); x.bezierCurveTo(gx - lean * 0.6 - sz * 0.03, gy - sz * 0.4, gx + lean * 1.4 - sz * 0.03, gy - sz * 0.6, gx + lean - sz * 0.03, gy - sz * 0.95); x.stroke(); x.restore();
  [[lean * 0.9 + sz * 0.3, -0.62, 0.32], [lean * 0.9 - sz * 0.3, -0.84, 0.36], [lean + sz * 0.06, -1.1, 0.44]].forEach(function (b) {
    var cx0 = gx + b[0], cy0 = gy + b[1] * sz, R = b[2] * sz;
    mpBlobs(x, [[cx0, cy0, R * 0.62, 0.55], [cx0 - R * 0.6, cy0 + R * 0.08, R * 0.44, 0.55], [cx0 + R * 0.6, cy0 + R * 0.08, R * 0.44, 0.55], [cx0 - R * 0.25, cy0 - R * 0.2, R * 0.4, 0.55], [cx0 + R * 0.28, cy0 - R * 0.18, R * 0.38, 0.55]], pal, R);
  });
}
// 대나무 한 무더기
function mwBambooAt(x, gx, gy, sz, n, rnd) {
  var i, k;
  for (i = 0; i < n; i++) {
    var bx = gx + (i - (n - 1) / 2) * sz * 0.125 + (rnd() - 0.5) * sz * 0.07, h = sz * (1.3 + rnd() * 0.75), lean = (rnd() - 0.5) * sz * 0.3, w = sz * (0.06 + rnd() * 0.02), col = rnd() < 0.5 ? '#6cb85c' : '#58a860';
    x.save(); x.lineCap = 'round'; x.strokeStyle = mixc(col, '#3a2636', 0.6); x.lineWidth = w + TW_IW * 1.6; x.beginPath(); x.moveTo(bx, gy); x.quadraticCurveTo(bx + lean * 0.3, gy - h * 0.5, bx + lean, gy - h); x.stroke();
    x.strokeStyle = col; x.lineWidth = w; x.stroke(); x.strokeStyle = rgba('#d8f4a0', 0.7); x.lineWidth = w * 0.3; x.beginPath(); x.moveTo(bx - w * 0.2, gy); x.quadraticCurveTo(bx + lean * 0.3 - w * 0.2, gy - h * 0.5, bx + lean - w * 0.2, gy - h); x.stroke();
    x.strokeStyle = rgba('#2c6a3c', 0.7); x.lineWidth = Math.max(0.8, sz * 0.014); for (k = 1; k < 7; k++) { var t = k / 7, qx = bx + lean * t * t * 0.7 + lean * 0.3 * t, qy = gy - h * t; x.beginPath(); x.moveTo(qx - w * 0.55, qy); x.lineTo(qx + w * 0.55, qy); x.stroke(); }
    x.restore();
    for (k = 0; k < 7; k++) { var t2 = 0.5 + rnd() * 0.5, lx = bx + lean * t2 + (rnd() - 0.5) * sz * 0.1, ly = gy - h * t2, sd = rnd() < 0.5 ? -1 : 1, lc = rnd() < 0.5 ? '#4f9e5a' : '#7cc46c'; mwLeaf(x, lx + sd * sz * 0.1, ly + sz * 0.03, sz * 0.24, sz * 0.035, sd > 0 ? 0.5 + rnd() * 0.5 : Math.PI - 0.5 - rnd() * 0.5, mixc(lc, '#3a2636', 0.5)); mwLeaf(x, lx + sd * sz * 0.1, ly + sz * 0.02, sz * 0.21, sz * 0.026, sd > 0 ? 0.5 + rnd() * 0.5 : Math.PI - 0.5 - rnd() * 0.5, lc); }
  }
}
// 갯바위 / 바위 덩어리(각진 바위): 어두운 돌 + 밝은 윗면
function mwCragAt(x, gx, gy, w, h, col, rnd, foam) {
  if (foam) { x.save(); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = Math.max(1, w * 0.045); x.beginPath(); x.ellipse(gx, gy, w * 0.62, w * 0.2, 0, 0, Math.PI * 2); x.stroke(); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fill(); x.restore(); }
  var pts = [[gx - w * 0.5, gy], [gx - w * 0.46, gy - h * 0.45], [gx - w * 0.28, gy - h * (0.8 + rnd() * 0.15)], [gx - w * 0.05, gy - h * 0.7], [gx + w * 0.12, gy - h * (0.92 + rnd() * 0.1)], [gx + w * 0.36, gy - h * 0.6], [gx + w * 0.5, gy - h * 0.1], [gx + w * 0.42, gy + h * 0.06], [gx - w * 0.3, gy + h * 0.08]];
  var s = shp().poly(pts); twFill(x, s, col, { hi: 0.2, lo: 0.4 });
  x.save(); x.clip(s.p); x.fillStyle = rgba(twLt(col, 0.55), 0.85); x.beginPath(); x.moveTo(pts[1][0], pts[1][1]); x.lineTo(pts[2][0], pts[2][1]); x.lineTo(pts[3][0], pts[3][1]); x.lineTo(pts[4][0], pts[4][1]); x.lineTo(gx + w * 0.02, gy - h * 0.42); x.lineTo(gx - w * 0.3, gy - h * 0.3); x.closePath(); x.fill();
  x.strokeStyle = rgba(twSh(col, 0.6), 0.5); x.lineWidth = Math.max(0.8, w * 0.02); x.beginPath(); x.moveTo(gx + w * 0.02, gy - h * 0.42); x.lineTo(gx + w * 0.08, gy); x.moveTo(gx - w * 0.3, gy - h * 0.3); x.lineTo(gx - w * 0.36, gy); x.stroke(); x.restore();
  mwInk(x, s, col); return s;
}
// 청사초롱(위는 붉고 아래는 푸른 비단 등) : cx, 윗끝 y
function mwLanternAt(x, cx, ty, sz, glow) {
  if (glow) { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, ty + sz * 0.5, sz * 1.6, '#ffc878', glow); x.restore(); }
  var w = sz * 0.56, h = sz;
  var top = shp().rrect(cx - w / 2, ty, w, h * 0.5, w * 0.2), bot = shp().rrect(cx - w / 2, ty + h * 0.46, w, h * 0.5, w * 0.2);
  twFill(x, bot, '#3a78c8', { hi: 0.45, lo: 0.2 }); mwInk(x, bot, '#3a78c8', TW_IW * 0.7); twFill(x, top, '#e0503a', { hi: 0.45, lo: 0.15 }); mwInk(x, top, '#e0503a', TW_IW * 0.7);
  x.fillStyle = 'rgba(255,240,190,0.55)'; x.beginPath(); x.ellipse(cx, ty + h * 0.5, w * 0.24, h * 0.3, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#3a3440'; x.fillRect(cx - w * 0.36, ty - h * 0.07, w * 0.72, h * 0.1); x.fillRect(cx - w * 0.3, ty + h * 0.95, w * 0.6, h * 0.08);
  x.strokeStyle = '#e9b436'; x.lineWidth = Math.max(0.8, sz * 0.05); x.beginPath(); x.moveTo(cx, ty + h * 1.03); x.lineTo(cx, ty + h * 1.25); x.stroke();
}

// ---------- 소품 ----------
PROPS.mwGiwa = function (S, T, rnd) { return mwHouse(S, 'giwa', rnd); };
PROPS.mwChoga = function (S, T, rnd) { return mwHouse(S * 0.92, 'choga', rnd); };
PROPS.mwHall = function (S, T, rnd) { return mwHouse(S, 'hall', rnd); };
PROPS.mwTemple = function (S, T, rnd) { return mwHouse(S * 0.95, 'temple', rnd); };
PROPS.mwJar = function (S, T, rnd) {
  var o = canvasFor(S, 1.1, 1.0, 0.84), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.62;
  twShadow(x, gx + sz * 0.1, gy, sz * 0.62, sz * 0.2, 0.38);
  mwJarAt(x, gx - sz * 0.14, gy, sz * 0.64, sz * 0.8, '#8a5236'); mwJarAt(x, gx + sz * 0.36, gy + sz * 0.04, sz * 0.4, sz * 0.46, '#a06a44');
  return spr(o.c, gx, gy);
};
PROPS.mwJars = function (S, T, rnd) {
  var o = canvasFor(S, 1.3, 1.15, 0.84), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.78;
  twShadow(x, gx + sz * 0.08, gy, sz * 0.72, sz * 0.22, 0.38);
  mwRR(x, gx - sz * 0.62, gy - sz * 0.12, sz * 1.24, sz * 0.17, sz * 0.05, '#cfc7b8', { hi: 0.3 });
  mwJarAt(x, gx - sz * 0.28, gy - sz * 0.16, sz * 0.5, sz * 0.62, '#7c4a32'); mwJarAt(x, gx + sz * 0.26, gy - sz * 0.16, sz * 0.44, sz * 0.52, '#946040');
  mwJarAt(x, gx - sz * 0.02, gy - sz * 0.06, sz * 0.5, sz * 0.6, '#8a5236'); mwJarAt(x, gx + sz * 0.42, gy - sz * 0.05, sz * 0.3, sz * 0.34, '#a87048'); mwJarAt(x, gx - sz * 0.44, gy - sz * 0.05, sz * 0.3, sz * 0.36, '#9c6644');
  return spr(o.c, gx, gy);
};
// 볏짚 낟가리
PROPS.mwHay = function (S, T, rnd) {
  var o = canvasFor(S, 1.2, 1.4, 0.86), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.86, col = '#edc25e', s = shp(), p = s.p, k;
  twShadow(x, gx + sz * 0.1, gy, sz * 0.55, sz * 0.18, 0.38);
  p.moveTo(gx - sz * 0.42, gy); p.quadraticCurveTo(gx - sz * 0.34, gy - sz * 0.6, gx - sz * 0.08, gy - sz * 0.98); p.lineTo(gx + sz * 0.08, gy - sz * 0.98); p.quadraticCurveTo(gx + sz * 0.34, gy - sz * 0.6, gx + sz * 0.42, gy); p.quadraticCurveTo(gx, gy + sz * 0.12, gx - sz * 0.42, gy); p.closePath(); s.ext(gx - sz * 0.42, gy - sz * 0.98); s.ext(gx + sz * 0.42, gy + sz * 0.1);
  twCylG(x, s, col, { hi: 0.45 });
  x.save(); x.clip(p); x.strokeStyle = rgba('#a87424', 0.42); x.lineWidth = Math.max(0.8, sz * 0.016); for (k = -5; k <= 5; k++) { x.beginPath(); x.moveTo(gx + k * sz * 0.016, gy - sz); x.quadraticCurveTo(gx + k * sz * 0.07, gy - sz * 0.5, gx + k * sz * 0.09, gy + sz * 0.1); x.stroke(); } x.restore();
  mwInk(x, s, col);
  var rp = shp(); rp.p.moveTo(gx - sz * 0.29, gy - sz * 0.42); rp.p.quadraticCurveTo(gx, gy - sz * 0.33, gx + sz * 0.29, gy - sz * 0.42); rp.p.lineTo(gx + sz * 0.3, gy - sz * 0.35); rp.p.quadraticCurveTo(gx, gy - sz * 0.26, gx - sz * 0.3, gy - sz * 0.35); rp.p.closePath(); rp.ext(gx - sz * 0.3, gy - sz * 0.42); rp.ext(gx + sz * 0.3, gy - sz * 0.26); twFill(x, rp, '#b8843c', { hi: 0.3 }); mwInk(x, rp, '#b8843c', TW_IW * 0.7);
  var tp = shp(); tp.p.moveTo(gx - sz * 0.16, gy - sz * 0.9); tp.p.quadraticCurveTo(gx, gy - sz * 1.2, gx + sz * 0.16, gy - sz * 0.9); tp.p.quadraticCurveTo(gx, gy - sz * 0.84, gx - sz * 0.16, gy - sz * 0.9); tp.p.closePath(); tp.ext(gx - sz * 0.16, gy - sz * 1.12); tp.ext(gx + sz * 0.16, gy - sz * 0.86); twFill(x, tp, '#f6d67c', { hi: 0.4 }); mwInk(x, tp, col, TW_IW * 0.8);
  return spr(o.c, gx, gy);
};
// 돌탑(쌓은 돌)
PROPS.mwCairn = function (S, T, rnd) {
  var o = canvasFor(S, 1.1, 1.4, 0.86), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.74, y = gy, k, cols = ['#c8c0b4', '#b8b0a6', '#d4ccc0', '#beb6aa', '#ccc4b6', '#d8d0c4'];
  twShadow(x, gx + sz * 0.1, gy, sz * 0.5, sz * 0.16, 0.38);
  for (k = 0; k < 6; k++) { var rx = sz * (0.36 - k * 0.052), ry = rx * (0.42 + rnd() * 0.1); y -= ry; mwStone(x, gx + (rnd() - 0.5) * sz * 0.06, y, rx, ry, cols[k], k === 0 || k === 2 ? T.moss : null); y -= ry * 0.82; }
  return spr(o.c, gx, gy);
};
// 석등
PROPS.mwStoneLamp = function (S, T, rnd) {
  var o = canvasFor(S, 1.1, 1.6, 0.88), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.92, col = '#d4cdc0';
  twShadow(x, gx + sz * 0.1, gy, sz * 0.4, sz * 0.14, 0.38);
  mwRR(x, gx - sz * 0.24, gy - sz * 0.1, sz * 0.48, sz * 0.12, sz * 0.04, col, { hi: 0.3 });
  mwEl(x, gx, gy - sz * 0.13, sz * 0.19, sz * 0.07, twLt(col, 0.1));
  mwRR(x, gx - sz * 0.07, gy - sz * 0.56, sz * 0.14, sz * 0.44, sz * 0.03, col, { hi: 0.4 });
  mwRR(x, gx - sz * 0.2, gy - sz * 0.63, sz * 0.4, sz * 0.09, sz * 0.03, twLt(col, 0.1), { hi: 0.3 });
  x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, gx, gy - sz * 0.76, sz * 0.5, '#ffc060', 0.4); x.restore();
  mwRR(x, gx - sz * 0.15, gy - sz * 0.9, sz * 0.3, sz * 0.28, sz * 0.03, col, { hi: 0.35 });
  var wn = shp().rrect(gx - sz * 0.075, gy - sz * 0.85, sz * 0.15, sz * 0.17, sz * 0.03), g2 = x.createLinearGradient(0, gy - sz * 0.85, 0, gy - sz * 0.68); g2.addColorStop(0, '#fff6c0'); g2.addColorStop(1, '#ffb040'); x.fillStyle = g2; x.fill(wn.p); mwInk(x, wn, '#c88a30', TW_IW * 0.7);
  var rf = shp(), p = rf.p; p.moveTo(gx - sz * 0.34, gy - sz * 0.92); p.quadraticCurveTo(gx - sz * 0.2, gy - sz * 0.96, gx - sz * 0.08, gy - sz * 1.12); p.lineTo(gx + sz * 0.08, gy - sz * 1.12); p.quadraticCurveTo(gx + sz * 0.2, gy - sz * 0.96, gx + sz * 0.34, gy - sz * 0.92); p.lineTo(gx + sz * 0.3, gy - sz * 0.85); p.quadraticCurveTo(gx, gy - sz * 0.8, gx - sz * 0.3, gy - sz * 0.85); p.closePath(); rf.ext(gx - sz * 0.34, gy - sz * 1.12); rf.ext(gx + sz * 0.34, gy - sz * 0.82);
  twFill(x, rf, twLt(col, 0.12), { hi: 0.35, lo: 0.3 }); mwInk(x, rf, col);
  mwEl(x, gx, gy - sz * 1.17, sz * 0.06, sz * 0.065, col, { hi: 0.4 });
  return spr(o.c, gx, gy);
};
PROPS.mwPagoda = function (S, T, rnd) { var o = canvasFor(S, 2.2, 3.0, 0.9), x = o.x; twShadow(x, o.gx + S * 0.15, o.gy, S * 0.8, S * 0.25, 0.42); mwPagodaAt(x, o.gx, o.gy, S * 1.75, 3, '#d2cabc'); for (var i = 0; i < 7; i++) mwLeaf(x, o.gx + (rnd() - 0.5) * S * 1.3, o.gy - rnd() * S * 0.16 + S * 0.04, S * 0.14, S * 0.05, rnd() * 6, ['#e0503a', '#f08c2e', '#f2c832'][i % 3]); return spr(o.c, o.gx, o.gy); };
PROPS.mwPagodaS = function (S, T, rnd) { var o = canvasFor(S, 1.3, 1.9, 0.9), x = o.x; twShadow(x, o.gx + S * 0.1, o.gy, S * 0.46, S * 0.15, 0.4); mwPagodaAt(x, o.gx, o.gy, S * 1.05, 3, '#cdc5b8'); return spr(o.c, o.gx, o.gy); };
// 해태상: 받침돌 위에 앉은 둥글둥글한 돌 짐승(외뿔, 곱슬 갈기, 방울)
PROPS.mwHaetae = function (S, T, rnd) {
  var o = canvasFor(S, 2.2, 2.6, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * 1.5, col = '#d6cfc2', dk = '#b8b0a2';
  twShadow(x, gx + sz * 0.12, gy, sz * 0.62, sz * 0.2, 0.42);
  mwRR(x, gx - sz * 0.5, gy - sz * 0.14, sz * 1.0, sz * 0.16, sz * 0.03, dk, { hi: 0.3 });
  mwRR(x, gx - sz * 0.43, gy - sz * 0.36, sz * 0.86, sz * 0.24, sz * 0.03, col, { hi: 0.3 });
  x.save(); x.strokeStyle = rgba(twSh(col, 0.5), 0.4); x.lineWidth = Math.max(1, sz * 0.012); x.strokeRect(gx - sz * 0.36, gy - sz * 0.31, sz * 0.72, sz * 0.14); x.restore();
  var by = gy - sz * 0.36;
  // 꼬리, 몸, 앞발
  var tl = shp().ell(gx + sz * 0.33, by - sz * 0.34, sz * 0.12, sz * 0.14); twFill(x, tl, col, { hi: 0.4 }); mwInk(x, tl, col);
  x.save(); x.strokeStyle = rgba(twSh(col, 0.5), 0.55); x.lineWidth = Math.max(1, sz * 0.018); x.beginPath(); x.arc(gx + sz * 0.33, by - sz * 0.34, sz * 0.06, 0.5, 5); x.stroke(); x.restore();
  var bd = shp().ell(gx + sz * 0.04, by - sz * 0.26, sz * 0.3, sz * 0.28); twFill(x, bd, col, { hi: 0.4, lo: 0.3 }); mwInk(x, bd, col);
  [-1, 1].forEach(function (sd) { mwRR(x, gx - sz * 0.1 + sd * sz * 0.13 - sz * 0.07, by - sz * 0.22, sz * 0.14, sz * 0.24, sz * 0.06, twLt(col, 0.08), { hi: 0.4 }); });
  // 머리: 갈기 방울들 + 얼굴
  var hy = by - sz * 0.62, hx0 = gx - sz * 0.06;
  mpBlobs(x, [[hx0, hy, sz * 0.27], [hx0 - sz * 0.24, hy + sz * 0.04, sz * 0.13], [hx0 + sz * 0.24, hy + sz * 0.04, sz * 0.13], [hx0 - sz * 0.2, hy - sz * 0.16, sz * 0.12], [hx0 + sz * 0.2, hy - sz * 0.16, sz * 0.12], [hx0 - sz * 0.18, hy + sz * 0.2, sz * 0.11], [hx0 + sz * 0.18, hy + sz * 0.2, sz * 0.11]], [twSh(dk, 0.3), dk, col, '#ffffff'], sz * 0.27);
  var fc = shp().ell(hx0, hy + sz * 0.02, sz * 0.2, sz * 0.19); twFill(x, fc, twLt(col, 0.2), { hi: 0.4, lo: 0.15 }); mwInk(x, fc, col, TW_IW * 0.8);
  var hn = shp(); hn.p.moveTo(hx0 - sz * 0.04, hy - sz * 0.15); hn.p.quadraticCurveTo(hx0, hy - sz * 0.34, hx0 + sz * 0.02, hy - sz * 0.34); hn.p.quadraticCurveTo(hx0 + sz * 0.05, hy - sz * 0.24, hx0 + sz * 0.04, hy - sz * 0.15); hn.p.closePath(); hn.ext(hx0 - sz * 0.04, hy - sz * 0.34); hn.ext(hx0 + sz * 0.05, hy - sz * 0.15); twFill(x, hn, '#f2e6c8', { hi: 0.4 }); mwInk(x, hn, col, TW_IW * 0.8);
  x.fillStyle = '#3a3440'; [-1, 1].forEach(function (sd) { x.beginPath(); x.arc(hx0 + sd * sz * 0.085, hy - sz * 0.01, sz * 0.028, 0, Math.PI * 2); x.fill(); });
  x.fillStyle = '#ffffff'; [-1, 1].forEach(function (sd) { x.beginPath(); x.arc(hx0 + sd * sz * 0.085 - sz * 0.009, hy - sz * 0.02, sz * 0.01, 0, Math.PI * 2); x.fill(); });
  x.save(); x.strokeStyle = '#6a5a5a'; x.lineWidth = Math.max(1, sz * 0.018); x.lineCap = 'round'; x.beginPath(); x.arc(hx0 - sz * 0.035, hy + sz * 0.07, sz * 0.035, 0.2, 2.9); x.stroke(); x.beginPath(); x.arc(hx0 + sz * 0.035, hy + sz * 0.07, sz * 0.035, 0.2, 2.9); x.stroke(); x.restore();
  mwEl(x, hx0, hy + sz * 0.045, sz * 0.03, sz * 0.02, '#8a7a7a');
  mwEl(x, gx - sz * 0.02, by - sz * 0.34, sz * 0.05, sz * 0.05, '#e9b436', { hi: 0.5 });
  return spr(o.c, gx, gy);
};
// 품계석(글자 없는 작은 돌 표지)
PROPS.mwRank = function (S, T, rnd) {
  var o = canvasFor(S, 1.0, 0.9, 0.84), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.6, col = '#d8d2c6';
  twShadow(x, gx + sz * 0.08, gy, sz * 0.4, sz * 0.13, 0.36);
  [-0.27, 0.27].forEach(function (u, i) { var px = gx + u * sz, h = sz * (i ? 0.6 : 0.68); var s = shp(); s.p.moveTo(px - sz * 0.15, gy); s.p.lineTo(px - sz * 0.13, gy - h + sz * 0.1); s.p.quadraticCurveTo(px, gy - h - sz * 0.06, px + sz * 0.13, gy - h + sz * 0.1); s.p.lineTo(px + sz * 0.15, gy); s.p.closePath(); s.ext(px - sz * 0.15, gy - h); s.ext(px + sz * 0.15, gy); twFill(x, s, col, { hi: 0.4, lo: 0.3 }); mwInk(x, s, col); x.fillStyle = rgba(twSh(col, 0.5), 0.35); x.fillRect(px - sz * 0.07, gy - h + sz * 0.2, sz * 0.14, sz * 0.03); x.fillRect(px - sz * 0.07, gy - h + sz * 0.29, sz * 0.14, sz * 0.03); });
  return spr(o.c, gx, gy);
};
// 드므(넓적한 청동 물독) + 받침돌
PROPS.mwUrn = function (S, T, rnd) {
  var o = canvasFor(S, 1.2, 1.1, 0.84), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.86, col = '#8c8458';
  twShadow(x, gx + sz * 0.1, gy, sz * 0.55, sz * 0.17, 0.38);
  mwRR(x, gx - sz * 0.36, gy - sz * 0.12, sz * 0.72, sz * 0.14, sz * 0.04, '#d2cbbd', { hi: 0.3 });
  var s = shp(), p = s.p; p.moveTo(gx - sz * 0.44, gy - sz * 0.56); p.bezierCurveTo(gx - sz * 0.5, gy - sz * 0.2, gx - sz * 0.3, gy - sz * 0.1, gx, gy - sz * 0.1); p.bezierCurveTo(gx + sz * 0.3, gy - sz * 0.1, gx + sz * 0.5, gy - sz * 0.2, gx + sz * 0.44, gy - sz * 0.56); p.closePath(); s.ext(gx - sz * 0.48, gy - sz * 0.56); s.ext(gx + sz * 0.48, gy - sz * 0.1);
  twCylG(x, s, col, { hi: 0.5 }); mwInk(x, s, col);
  var tp = shp().ell(gx, gy - sz * 0.56, sz * 0.46, sz * 0.13); twFill(x, tp, twLt(col, 0.25), { hi: 0.4 }); mwInk(x, tp, col, TW_IW * 0.85);
  var wt = shp().ell(gx, gy - sz * 0.55, sz * 0.37, sz * 0.09); twFill(x, wt, '#7cc8d8', { hi: 0.4 }); mwInk(x, wt, '#4a8fa8', TW_IW * 0.6);
  twShine(x, gx - sz * 0.12, gy - sz * 0.57, sz * 0.1, sz * 0.02, 0.7, 0);
  [-1, 1].forEach(function (sd) { x.save(); x.strokeStyle = mixc(col, '#3a2636', 0.66); x.lineWidth = sz * 0.05; x.beginPath(); x.arc(gx + sd * sz * 0.47, gy - sz * 0.4, sz * 0.06, 0, Math.PI * 2); x.stroke(); x.strokeStyle = '#b8ac70'; x.lineWidth = sz * 0.025; x.stroke(); x.restore(); });
  return spr(o.c, gx, gy);
};
// 괴석(궁궐 뜰의 구멍 난 돌 + 네모 돌 화분): 바위 칸용
PROPS.mwGoeseok = function (S, T, rnd) {
  var o = canvasFor(S, 1.1, 1.5, 0.88), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.9, col = '#a8a6b4';
  twShadow(x, gx + sz * 0.1, gy, sz * 0.46, sz * 0.15, 0.4);
  var s = mwCragAt(x, gx, gy - sz * 0.26, sz * 0.5, sz * 0.9, col, rnd, 0);
  x.fillStyle = rgba('#3a3448', 0.6); [[-0.06, -0.62, 0.05], [0.08, -0.84, 0.035], [0.1, -0.48, 0.04]].forEach(function (h) { x.beginPath(); x.ellipse(gx + h[0] * sz, gy + h[1] * sz, h[2] * sz, h[2] * sz * 1.3, 0.3, 0, Math.PI * 2); x.fill(); });
  mwRR(x, gx - sz * 0.36, gy - sz * 0.3, sz * 0.72, sz * 0.3, sz * 0.03, '#ddd6c8', { hi: 0.35 });
  x.save(); x.strokeStyle = rgba('#8a8274', 0.45); x.lineWidth = Math.max(1, sz * 0.015); x.strokeRect(gx - sz * 0.29, gy - sz * 0.24, sz * 0.58, sz * 0.18); x.restore();
  return spr(o.c, gx, gy);
};
// 갯바위(물 위나 물가)
PROPS.mwSeaRock = function (S, T, rnd) {
  var o = canvasFor(S, 1.3, 1.1, 0.84), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.9, col = '#7c7884';
  twShadow(x, gx + sz * 0.1, gy, sz * 0.6, sz * 0.18, 0.3);
  mwCragAt(x, gx + sz * 0.26, gy - sz * 0.02, sz * 0.46, sz * 0.4, twSh(col, 0.1), rnd, 1);
  mwCragAt(x, gx - sz * 0.1, gy, sz * 0.72, sz * 0.66, col, rnd, 1);
  x.fillStyle = '#f4f0e4'; for (var i = 0; i < 5; i++) { x.beginPath(); x.arc(gx - sz * 0.3 + rnd() * sz * 0.5, gy - sz * 0.05 - rnd() * sz * 0.1, sz * 0.018, 0, Math.PI * 2); x.fill(); }
  return spr(o.c, gx, gy);
};
// 바위 섬 + 소나무(포구의 큰 장애물)
PROPS.mwIslet = function (S, T, rnd) {
  var o = canvasFor(S, 2.3, 2.9, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * 1.5;
  twShadow(x, gx + sz * 0.1, gy, sz * 0.7, sz * 0.22, 0.4);
  mwCragAt(x, gx + sz * 0.38, gy - sz * 0.02, sz * 0.5, sz * 0.42, '#6c6876', rnd, 0);
  mwPineAt(x, gx + sz * 0.02, gy - sz * 0.62, sz * 0.7, T, rnd);
  mwCragAt(x, gx - sz * 0.06, gy, sz * 1.0, sz * 0.8, '#7c7884', rnd, 0);
  x.fillStyle = rgba('#7cc48a', 0.85); x.beginPath(); x.ellipse(gx - sz * 0.12, gy - sz * 0.66, sz * 0.2, sz * 0.05, -0.2, 0, Math.PI * 2); x.fill();
  return spr(o.c, gx, gy);
};
// 황포돛배(물 위) / 뭍에 올려 둔 배
function mwBoatAt(x, gx, gy, sz, sail) {
  var col = '#b97a4a', h = shp(), p = h.p;
  p.moveTo(gx - sz * 0.62, gy - sz * 0.2); p.quadraticCurveTo(gx - sz * 0.5, gy + sz * 0.04, gx - sz * 0.3, gy + sz * 0.04); p.lineTo(gx + sz * 0.34, gy + sz * 0.04); p.quadraticCurveTo(gx + sz * 0.56, gy, gx + sz * 0.7, gy - sz * 0.26); p.quadraticCurveTo(gx, gy - sz * 0.12, gx - sz * 0.62, gy - sz * 0.2); p.closePath(); h.ext(gx - sz * 0.62, gy - sz * 0.26); h.ext(gx + sz * 0.7, gy + sz * 0.04);
  twFill(x, h, col, { hi: 0.35, lo: 0.35 });
  x.save(); x.clip(p); x.strokeStyle = rgba('#6a3c20', 0.45); x.lineWidth = Math.max(0.8, sz * 0.014); x.beginPath(); x.moveTo(gx - sz * 0.6, gy - sz * 0.08); x.quadraticCurveTo(gx, gy - sz * 0.01, gx + sz * 0.64, gy - sz * 0.12); x.stroke(); x.restore();
  mwInk(x, h, col);
  var dk = shp(); dk.p.moveTo(gx - sz * 0.6, gy - sz * 0.2); dk.p.quadraticCurveTo(gx, gy - sz * 0.12, gx + sz * 0.68, gy - sz * 0.26); dk.p.quadraticCurveTo(gx, gy - sz * 0.24, gx - sz * 0.6, gy - sz * 0.2); dk.p.closePath(); dk.ext(gx - sz * 0.6, gy - sz * 0.26); dk.ext(gx + sz * 0.68, gy - sz * 0.12); twFill(x, dk, '#e8c08a', { hi: 0.3 }); mwInk(x, dk, col, TW_IW * 0.7);
  if (!sail) return;
  mwRR(x, gx - sz * 0.02, gy - sz * 1.12, sz * 0.045, sz * 0.94, sz * 0.02, '#8a5a3a', { hi: 0.4 });
  var sl = shp(), q = sl.p; q.moveTo(gx - sz * 0.36, gy - sz * 1.02); q.lineTo(gx + sz * 0.38, gy - sz * 1.06); q.quadraticCurveTo(gx + sz * 0.46, gy - sz * 0.66, gx + sz * 0.42, gy - sz * 0.34); q.lineTo(gx - sz * 0.4, gy - sz * 0.32); q.quadraticCurveTo(gx - sz * 0.32, gy - sz * 0.68, gx - sz * 0.36, gy - sz * 1.02); q.closePath(); sl.ext(gx - sz * 0.4, gy - sz * 1.06); sl.ext(gx + sz * 0.46, gy - sz * 0.32);
  twFill(x, sl, '#e8b85a', { hi: 0.4, lo: 0.25 });
  x.save(); x.clip(q); x.strokeStyle = rgba('#a8742c', 0.6); x.lineWidth = Math.max(0.8, sz * 0.016); for (var k = 1; k < 6; k++) { x.beginPath(); x.moveTo(gx - sz * 0.42, gy - sz * (1.04 - k * 0.12)); x.lineTo(gx + sz * 0.46, gy - sz * (1.07 - k * 0.12)); x.stroke(); } x.restore();
  mwInk(x, sl, '#e8b85a');
}
PROPS.mwBoat = function (S, T, rnd) {
  var o = canvasFor(S, 1.7, 1.6, 0.86), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.95;
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = Math.max(1, sz * 0.03); x.beginPath(); x.ellipse(gx + sz * 0.03, gy + sz * 0.03, sz * 0.72, sz * 0.12, 0, 0, Math.PI * 2); x.stroke(); x.fillStyle = 'rgba(20,40,90,0.22)'; x.fill(); x.restore();
  mwBoatAt(x, gx, gy, sz, 1);
  return spr(o.c, gx, gy);
};
PROPS.mwBoatL = function (S, T, rnd) {
  var o = canvasFor(S, 1.6, 0.9, 0.8), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.9;
  twShadow(x, gx + sz * 0.06, gy + sz * 0.02, sz * 0.72, sz * 0.17, 0.36);
  mwBoatAt(x, gx, gy, sz, 0);
  x.save(); x.strokeStyle = mixc('#c8a070', '#3a2636', 0.5); x.lineWidth = sz * 0.05; x.lineCap = 'round'; x.beginPath(); x.moveTo(gx - sz * 0.3, gy - sz * 0.3); x.lineTo(gx + sz * 0.5, gy - sz * 0.12); x.stroke(); x.strokeStyle = '#d8b07c'; x.lineWidth = sz * 0.028; x.stroke(); x.restore();
  return spr(o.c, gx, gy);
};
// 그물 말리는 장대
PROPS.mwNet = function (S, T, rnd) {
  var o = canvasFor(S, 1.3, 1.2, 0.86), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.84, k;
  twShadow(x, gx + sz * 0.08, gy, sz * 0.62, sz * 0.16, 0.34);
  var nt = shp(); nt.p.moveTo(gx - sz * 0.5, gy - sz * 0.86); nt.p.quadraticCurveTo(gx, gy - sz * 0.6, gx + sz * 0.5, gy - sz * 0.86); nt.p.lineTo(gx + sz * 0.42, gy - sz * 0.12); nt.p.quadraticCurveTo(gx, gy - sz * 0.02, gx - sz * 0.42, gy - sz * 0.12); nt.p.closePath(); nt.ext(gx - sz * 0.5, gy - sz * 0.86); nt.ext(gx + sz * 0.5, gy);
  x.fillStyle = 'rgba(120,200,190,0.4)'; x.fill(nt.p);
  x.save(); x.clip(nt.p); x.strokeStyle = 'rgba(40,110,120,0.6)'; x.lineWidth = Math.max(0.7, sz * 0.012); for (k = -9; k < 12; k++) { x.beginPath(); x.moveTo(gx - sz * 0.6 + k * sz * 0.11, gy - sz * 0.9); x.lineTo(gx - sz * 0.2 + k * sz * 0.11, gy); x.moveTo(gx - sz * 0.6 + k * sz * 0.11, gy - sz * 0.9); x.lineTo(gx - sz + k * sz * 0.11, gy); x.stroke(); } x.restore();
  mwInk(x, nt, '#4a9aa0', TW_IW * 0.7);
  [-1, 1].forEach(function (sd) { mwRR(x, gx + sd * sz * 0.5 - sz * 0.035, gy - sz * 0.98, sz * 0.07, sz * 0.98, sz * 0.03, '#a06a44', { hi: 0.4 }); });
  for (k = 0; k < 5; k++) mwEl(x, gx - sz * 0.36 + k * sz * 0.18, gy - sz * (0.7 - Math.abs(k - 2) * 0.06), sz * 0.045, sz * 0.045, k % 2 ? '#ff8a4a' : '#fff0d0', { hi: 0.5 });
  return spr(o.c, gx, gy);
};
// 소쿠리와 생선
PROPS.mwBasket = function (S, T, rnd) {
  var o = canvasFor(S, 1.0, 0.8, 0.82), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.6, k;
  twShadow(x, gx + sz * 0.08, gy, sz * 0.55, sz * 0.16, 0.36);
  var b = shp(); b.p.moveTo(gx - sz * 0.46, gy - sz * 0.36); b.p.quadraticCurveTo(gx - sz * 0.42, gy, gx - sz * 0.2, gy + sz * 0.02); b.p.lineTo(gx + sz * 0.2, gy + sz * 0.02); b.p.quadraticCurveTo(gx + sz * 0.42, gy, gx + sz * 0.46, gy - sz * 0.36); b.p.closePath(); b.ext(gx - sz * 0.46, gy - sz * 0.36); b.ext(gx + sz * 0.46, gy + sz * 0.02);
  twCylG(x, b, '#d8a860', { hi: 0.45 });
  x.save(); x.clip(b.p); x.strokeStyle = rgba('#8a5a24', 0.5); x.lineWidth = Math.max(0.7, sz * 0.02); for (k = 0; k < 4; k++) { x.beginPath(); x.moveTo(gx - sz * 0.5, gy - sz * 0.3 + k * sz * 0.1); x.quadraticCurveTo(gx, gy - sz * 0.24 + k * sz * 0.1, gx + sz * 0.5, gy - sz * 0.3 + k * sz * 0.1); x.stroke(); } for (k = -4; k <= 4; k++) { x.beginPath(); x.moveTo(gx + k * sz * 0.1, gy - sz * 0.4); x.lineTo(gx + k * sz * 0.085, gy + sz * 0.05); x.stroke(); } x.restore();
  mwInk(x, b, '#d8a860');
  var tp = shp().ell(gx, gy - sz * 0.36, sz * 0.46, sz * 0.13); twFill(x, tp, '#f0cc8c', { hi: 0.3 }); mwInk(x, tp, '#d8a860', TW_IW * 0.8);
  [[-0.16, -0.4, -0.2, '#9fc4e8'], [0.12, -0.38, 0.25, '#b8d8f0'], [-0.02, -0.46, 0.05, '#8ab4dc']].forEach(function (f) { x.save(); x.translate(gx + f[0] * sz, gy + f[1] * sz); x.rotate(f[2]); var fs = shp(); fs.p.moveTo(-sz * 0.2, 0); fs.p.quadraticCurveTo(0, -sz * 0.1, sz * 0.14, 0); fs.p.lineTo(sz * 0.24, -sz * 0.07); fs.p.lineTo(sz * 0.24, sz * 0.07); fs.p.lineTo(sz * 0.14, 0); fs.p.quadraticCurveTo(0, sz * 0.1, -sz * 0.2, 0); fs.p.closePath(); fs.ext(-sz * 0.2, -sz * 0.1); fs.ext(sz * 0.24, sz * 0.1); twFill(x, fs, f[3], { hi: 0.5 }); mwInk(x, fs, f[3], TW_IW * 0.7); x.fillStyle = '#3a3440'; x.beginPath(); x.arc(-sz * 0.12, -sz * 0.012, sz * 0.016, 0, Math.PI * 2); x.fill(); x.restore(); });
  return spr(o.c, gx, gy);
};
// 솟대
PROPS.mwSotdae = function (S, T, rnd) {
  var o = canvasFor(S, 1.0, 2.2, 0.92), x = o.x, gx = o.gx, gy = o.gy, sz = S;
  twShadow(x, gx + sz * 0.06, gy, sz * 0.3, sz * 0.09, 0.34);
  [[-0.14, 1.5, 1], [0.16, 1.15, -1]].forEach(function (q) {
    var px = gx + q[0] * sz, h = q[1] * sz, sd = q[2];
    mwRR(x, px - sz * 0.025, gy - h, sz * 0.05, h, sz * 0.02, '#9a6c48', { hi: 0.4 });
    var b = shp(); b.p.moveTo(px - sd * sz * 0.16, gy - h - sz * 0.02); b.p.quadraticCurveTo(px - sd * sz * 0.02, gy - h - sz * 0.14, px + sd * sz * 0.1, gy - h - sz * 0.1); b.p.quadraticCurveTo(px + sd * sz * 0.14, gy - h - sz * 0.2, px + sd * sz * 0.2, gy - h - sz * 0.17); b.p.lineTo(px + sd * sz * 0.27, gy - h - sz * 0.14); b.p.lineTo(px + sd * sz * 0.19, gy - h - sz * 0.11); b.p.quadraticCurveTo(px + sd * sz * 0.14, gy - h + sz * 0.02, px - sd * sz * 0.16, gy - h - sz * 0.02); b.p.closePath(); b.ext(px - sz * 0.27, gy - h - sz * 0.2); b.ext(px + sz * 0.27, gy - h + sz * 0.02);
    twFill(x, b, '#b98a5c', { hi: 0.4 }); mwInk(x, b, '#b98a5c', TW_IW * 0.8);
  });
  return spr(o.c, gx, gy);
};
PROPS.mwPine = function (S, T, rnd) { var o = canvasFor(S, 1.7, 2.1, 0.92), x = o.x, sz = S * (1.0 + rnd() * 0.2); twShadow(x, o.gx + sz * 0.12, o.gy, sz * 0.5, sz * 0.16, 0.4); mwPineAt(x, o.gx, o.gy, sz, T, rnd); return spr(o.c, o.gx, o.gy); };
function mwLeafTree(S, rnd, pal, dots, size) {
  var o = canvasFor(S, 1.6, 2.0, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * (size || 1) * (0.94 + rnd() * 0.16);
  twShadow(x, gx + sz * 0.14, gy, sz * 0.55, sz * 0.2, 0.4);
  mpTrunk(x, gx, gy, sz * 0.1, sz * 0.48, '#6a4636');
  var cs = treeCanopy(x, gx, gy - sz * 0.7, sz * 0.47, pal, rnd, 5);
  x.save(); x.clip(cs.p); for (var i = 0; i < 12; i++) mwLeaf(x, cs.x0 + rnd() * cs.w(), cs.y0 + rnd() * cs.h(), sz * 0.1, sz * 0.035, rnd() * 6, rgba(dots[i % dots.length], 0.85)); x.restore();
  return spr(o.c, gx, gy);
}
PROPS.mwMaple = function (S, T, rnd, seed) { return seed % 3 === 1 ? mwLeafTree(S, rnd, ['#b85a1c', '#f08c2e', '#ffb85a', '#ffe4a8'], ['#ffd27a', '#e0503a'], 1) : mwLeafTree(S, rnd, ['#a02c2c', '#dc4636', '#f5805a', '#ffd0a0'], ['#ff9a6a', '#b83030'], 1); };
PROPS.mwGinkgo = function (S, T, rnd) { return mwLeafTree(S, rnd, ['#b89018', '#f2c832', '#ffe26a', '#fff6c0'], ['#fff0a0', '#d8a820'], 1.05); };
// 감나무: 초록 잎 + 주황 감
PROPS.mwGam = function (S, T, rnd) {
  var o = canvasFor(S, 1.6, 2.0, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * (0.98 + rnd() * 0.14);
  twShadow(x, gx + sz * 0.14, gy, sz * 0.55, sz * 0.2, 0.4); mpTrunk(x, gx, gy, sz * 0.1, sz * 0.5, T.trunk);
  var cs = treeCanopy(x, gx, gy - sz * 0.7, sz * 0.46, T.tree, rnd, 5); mpDots(x, cs, 7, ['#ff8a2a', '#ff9e3a'], sz * 0.045, rnd);
  return spr(o.c, gx, gy);
};
// 당산나무: 큰 느티나무 + 둥근 돌 단 + 금줄(흰 종이)
PROPS.mwBigTree = function (S, T, rnd) {
  var o = canvasFor(S, 2.5, 2.9, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * 1.62, k;
  twShadow(x, gx + sz * 0.14, gy, sz * 0.62, sz * 0.2, 0.42);
  for (k = 0; k < 7; k++) mwStone(x, gx - sz * 0.42 + k * sz * 0.14, gy - sz * 0.03 + (k % 2) * sz * 0.02, sz * 0.085, sz * 0.055, k % 2 ? '#c8c0b4' : '#d6cec2', null);
  mpTrunk(x, gx, gy - sz * 0.03, sz * 0.14, sz * 0.52, '#7c5840');
  x.save(); x.strokeStyle = mixc('#e8d8a8', '#3a2636', 0.6); x.lineWidth = sz * 0.05; x.beginPath(); x.moveTo(gx - sz * 0.09, gy - sz * 0.27); x.quadraticCurveTo(gx, gy - sz * 0.22, gx + sz * 0.09, gy - sz * 0.27); x.stroke(); x.strokeStyle = '#f0e2b4'; x.lineWidth = sz * 0.028; x.stroke(); x.restore();
  for (k = -1; k <= 1; k++) { x.fillStyle = '#ffffff'; x.strokeStyle = '#b8a888'; x.lineWidth = Math.max(0.6, sz * 0.006); x.beginPath(); x.rect(gx + k * sz * 0.055 - sz * 0.012, gy - sz * 0.24, sz * 0.024, sz * 0.07); x.fill(); x.stroke(); }
  treeCanopy(x, gx, gy - sz * 0.8, sz * 0.54, ['#2f7a48', '#4a9a58', '#78c070', '#c4eca0'], rnd, 6);
  return spr(o.c, gx, gy);
};
PROPS.mwBamboo = function (S, T, rnd) { var o = canvasFor(S, 1.5, 2.5, 0.94), x = o.x, sz = S * 0.95; twShadow(x, o.gx + sz * 0.1, o.gy, sz * 0.5, sz * 0.14, 0.38); mwBambooAt(x, o.gx, o.gy, sz, 6 + Math.floor(rnd() * 4), rnd); return spr(o.c, o.gx, o.gy); };
// 죽순
PROPS.mwShoots = function (S, T, rnd) {
  var o = canvasFor(S, 1.0, 1.0, 0.84), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.62;
  twShadow(x, gx + sz * 0.08, gy, sz * 0.5, sz * 0.15, 0.36);
  [[-0.24, 0.5], [0.26, 0.36], [0.02, 0.74]].forEach(function (q) {
    var px = gx + q[0] * sz, h = q[1] * sz, w = h * 0.36, s = shp(); s.p.moveTo(px - w, gy); s.p.quadraticCurveTo(px - w * 0.9, gy - h * 0.55, px, gy - h); s.p.quadraticCurveTo(px + w * 0.9, gy - h * 0.55, px + w, gy); s.p.quadraticCurveTo(px, gy + w * 0.3, px - w, gy); s.p.closePath(); s.ext(px - w, gy - h); s.ext(px + w, gy + w * 0.2);
    twCylG(x, s, '#b08a54', { hi: 0.45 });
    x.save(); x.clip(s.p); x.strokeStyle = rgba('#6a4a24', 0.55); x.lineWidth = Math.max(0.7, sz * 0.022); for (var k = 1; k < 4; k++) { x.beginPath(); x.moveTo(px - w, gy - h * k * 0.22 + w * 0.2); x.quadraticCurveTo(px, gy - h * k * 0.22 - w * 0.5, px + w, gy - h * k * 0.22 + w * 0.2); x.stroke(); } x.fillStyle = rgba('#9ccc72', 0.9); x.beginPath(); x.ellipse(px, gy - h, w * 0.5, h * 0.16, 0, 0, Math.PI * 2); x.fill(); x.restore();
    mwInk(x, s, '#b08a54');
  });
  return spr(o.c, gx, gy);
};
// 이끼 낀 큰 바위 + 돌탑 + 죽순(대숲의 큰 장애물)
PROPS.mwBoulder = function (S, T, rnd) {
  var s = rockSpr(S, T, rnd, 1.5, '#a8b2a6', '#6fc26c', 0.85), x = cx2(s.c), y = s.ay - S * 0.9, k;
  for (k = 0; k < 3; k++) { var rx = S * (0.16 - k * 0.04); y -= rx * 0.45; mwStone(x, s.ax + S * 0.1, y, rx, rx * 0.5, k % 2 ? '#c8c0b4' : '#d4ccc0', null); y -= rx * 0.4; }
  return s;
};
// 낙엽 더미
PROPS.mwLeafPile = function (S, T, rnd) {
  var o = canvasFor(S, 1.1, 0.8, 0.82), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.6, k, cols = ['#e0503a', '#f08c2e', '#f2c832', '#c83c30', '#ffb85a'];
  twShadow(x, gx + sz * 0.08, gy, sz * 0.62, sz * 0.18, 0.34);
  mpBlobs(x, [[gx, gy - sz * 0.22, sz * 0.36, 0.7], [gx - sz * 0.32, gy - sz * 0.1, sz * 0.24, 0.7], [gx + sz * 0.32, gy - sz * 0.1, sz * 0.24, 0.7]], ['#a8421c', '#e8782c', '#f8a84a', '#ffe0a0'], sz * 0.36);
  for (k = 0; k < 16; k++) { var a = rnd() * 6.28, d = Math.sqrt(rnd()) * sz * 0.5, px = gx + Math.cos(a) * d, py = gy - sz * 0.16 + Math.sin(a) * d * 0.45; mwLeaf(x, px, py + sz * 0.01, sz * 0.2, sz * 0.07, rnd() * 6, mixc(cols[k % 5], '#3a2636', 0.45)); mwLeaf(x, px, py, sz * 0.17, sz * 0.055, rnd() * 6, cols[k % 5]); }
  return spr(o.c, gx, gy);
};
// 돌담(기와 얹음) / 궁궐 담(붉은 벽)
function mwWallSpr(S, rnd, pal) {
  var o = canvasFor(S, 1.5, 1.0, 0.84), x = o.x, gx = o.gx, gy = o.gy, sz = S, w = sz * 1.2, h = sz * 0.42, r, c;
  twShadow(x, gx + sz * 0.06, gy, w * 0.56, sz * 0.12, 0.36);
  var b = shp().rrect(gx - w / 2, gy - h, w, h, sz * 0.03); twFill(x, b, pal ? '#d8b49c' : '#d8cdb4', { hi: 0.25, lo: 0.25 });
  x.save(); x.clip(b.p);
  if (pal) { x.fillStyle = '#c86a4c'; x.fillRect(gx - w / 2, gy - h * 0.72, w, h * 0.44); x.fillStyle = '#d8d2c6'; x.fillRect(gx - w / 2, gy - h * 0.26, w, h * 0.3); x.strokeStyle = rgba('#8a8274', 0.5); x.lineWidth = Math.max(0.7, sz * 0.012); for (c = 0; c < 6; c++) { x.beginPath(); x.moveTo(gx - w / 2 + c * w / 5, gy - h * 0.26); x.lineTo(gx - w / 2 + c * w / 5, gy); x.stroke(); } }
  else for (r = 0; r < 3; r++) for (c = 0; c < 7; c++) { var sx = gx - w / 2 + (c + (r % 2) * 0.5) * w / 6, sy = gy - h + (r + 0.5) * h / 3; x.fillStyle = [ '#bfb6a4', '#cfc6b6', '#b4ac9c', '#c8bca8'][(c + r * 3) % 4]; x.beginPath(); x.ellipse(sx, sy, w / 13.5, h / 7.2, 0, 0, Math.PI * 2); x.fill(); }
  x.restore(); mwInk(x, b, '#b8ac98');
  mwRoof(x, gx, gy - h + sz * 0.02, w * 1.12, sz * 0.2, '#5a6478', { rw: 0.44, lift: 0.1, n: 12 });
  return spr(o.c, gx, gy);
}
PROPS.mwWall = function (S, T, rnd) { return mwWallSpr(S, rnd, 0); };
PROPS.mwWallP = function (S, T, rnd) { return mwWallSpr(S, rnd, 1); };
// 청사초롱 장대(밤 판 길가)
PROPS.mwLantern = function (S, T, rnd) {
  var o = canvasFor(S, 1.3, 1.5, 0.9), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.9;
  twShadow(x, gx + sz * 0.04, gy, sz * 0.2, sz * 0.07, 0.3);
  mwRR(x, gx - sz * 0.022, gy - sz * 0.9, sz * 0.045, sz * 0.9, sz * 0.02, '#7a5236', { hi: 0.4 });
  mwRR(x, gx - sz * 0.02, gy - sz * 0.9, sz * 0.26, sz * 0.04, sz * 0.02, '#7a5236', { hi: 0.4 });
  mwLanternAt(x, gx + sz * 0.2, gy - sz * 0.82, sz * 0.3, 0.55);
  return spr(o.c, gx, gy);
};
// 보물 궤짝: 옻칠한 나무 궤 + 놋쇠 장석
PROPS.mwChest = function (S, T, rnd) {
  var o = canvasFor(S, 1.1, 1.0, 0.82), x = o.x, gx = o.gx, gy = o.gy, sz = S * 0.66, w = sz * 0.86, h = sz * 0.5, col = '#9c4a34', gold = '#f2c84a';
  twShadow(x, gx + sz * 0.1, gy, sz * 0.62, sz * 0.18, 0.4);
  x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, gx, gy - h * 0.6, sz * 0.8, '#ffd870', 0.22); x.restore();
  var bd = mwRR(x, gx - w / 2, gy - h, w, h, sz * 0.04, col, { hi: 0.3, lo: 0.3 });
  var ld = mwRR(x, gx - w * 0.54, gy - h - sz * 0.16, w * 1.08, sz * 0.2, sz * 0.05, twLt(col, 0.12), { hi: 0.4 });
  x.save(); x.clip(bd.p); x.strokeStyle = rgba('#5a2418', 0.4); x.lineWidth = Math.max(0.8, sz * 0.014); [0.34, 0.68].forEach(function (v) { x.beginPath(); x.moveTo(gx - w / 2, gy - h * v); x.lineTo(gx + w / 2, gy - h * v); x.stroke(); }); x.restore();
  [-1, 1].forEach(function (sd) { var c1 = shp().rrect(gx + sd * w * 0.5 - (sd > 0 ? sz * 0.13 : 0), gy - h, sz * 0.13, sz * 0.13, sz * 0.02); twFill(x, c1, gold, { hi: 0.5 }); mwInk(x, c1, gold, TW_IW * 0.6); var c2 = shp().rrect(gx + sd * w * 0.5 - (sd > 0 ? sz * 0.13 : 0), gy - sz * 0.13, sz * 0.13, sz * 0.13, sz * 0.02); twFill(x, c2, gold, { hi: 0.5 }); mwInk(x, c2, gold, TW_IW * 0.6); var hg = shp().rrect(gx + sd * w * 0.3 - sz * 0.03, gy - h - sz * 0.17, sz * 0.06, sz * 0.26, sz * 0.02); twFill(x, hg, gold, { hi: 0.5 }); mwInk(x, hg, gold, TW_IW * 0.6); });
  mwEl(x, gx, gy - h * 0.62, sz * 0.12, sz * 0.12, gold, { hi: 0.55 });
  mwRR(x, gx - sz * 0.03, gy - h * 0.62 - sz * 0.02, sz * 0.06, sz * 0.14, sz * 0.02, twSh(gold, 0.25), { hi: 0.3 });
  twShine(x, gx - w * 0.3, gy - h - sz * 0.1, sz * 0.07, sz * 0.03, 0.8); twTwinkle(x, gx + w * 0.36, gy - h - sz * 0.2, sz * 0.09, 0.95);
  return spr(o.c, gx, gy);
};
// 바위 칸의 큰 소품(render.js 가 S * 0.6 으로 부르는 bigrock 을 가로챔): 테마별 rk
function mwRockCell(S, T, rnd, seed, th) {
  var S0 = S / 0.6, k = T.rk, s, x, i;
  if (k === 'p') return PROPS.mwGoeseok(S0, T, rnd, seed, th);
  if (k === 's') return PROPS.mwSeaRock(S0 * 1.05, T, rnd, seed, th);
  s = rockSpr(S, T, rnd, 1.5, k === 'b' ? '#a2aea2' : k === 'l' ? '#bdb2a4' : '#c2b8aa', k === 'l' ? null : T.moss, 0.85); x = cx2(s.c);
  if (k === 'l') for (i = 0; i < 7; i++) mwLeaf(x, s.ax + (rnd() - 0.5) * S * 1.1, s.ay - S * (0.5 + rnd() * 0.5), S * 0.2, S * 0.07, rnd() * 6, ['#e0503a', '#f08c2e', '#f2c832'][i % 3]);
  if (k === 'h' && seed % 2) { mwJarAt(x, s.ax + S * 0.5, s.ay + S * 0.04, S * 0.4, S * 0.5, '#8a5236'); }
  return s;
}

// ---------- 배경 한 장 굽기(4장 테마 전용) ----------
function mwNight(M) { return !!(M && (M.night || (M.rule && M.rule.id === 'night'))); }
function mwBackground(g, view) {
  var th = g.M.theme, T = THEME[th], W = view.W, H = view.H, S = view.S, ox = view.ox, oy = view.oy;
  var c = mkC(W, H), x = cx2(c), rnd = rngOf(hashStr(g.M.id) + 3), N = makeNoise(hashStr(g.M.id)), night = mwNight(g.M);
  var wx0 = -ox / S, wy0 = -oy / S, wx1 = (W - ox) / S, wy1 = (H - oy) / S, i, j, k;
  TW_IW = Math.max(1, S * 0.02);
  function sxy(wx, wy) { return [ox + wx * S, oy + wy * S]; }
  // 1) 땅(한지 느낌으로 부드러운 두세 단계)
  var gr = 12, GW = Math.ceil((wx1 - wx0) * gr) + 2, GH = Math.ceil((wy1 - wy0) * gr) + 2, lc = mkC(GW, GH), lx = cx2(lc), id = lx.createImageData(GW, GH), d = id.data;
  var C0 = hx(T.g[0]), C1 = hx(T.g[1]), C2 = hx(T.g[2]), CP = hx(T.patch), pk = th === 'palace' ? 0.3 : th === 'pogu' ? 0.75 : 0.6;
  for (j = 0; j < GH; j++) for (i = 0; i < GW; i++) {
    var wx = wx0 + i / gr, wy = wy0 + j / gr, n = N.fbm(wx * 0.4, wy * 0.4, 3), m = N.fbm(wx * 0.23 + 40, wy * 0.23 + 10, 3), q = N.fbm(wx * 0.5 + 90, wy * 0.5 + 31, 2);
    var v = mpSmooth(0.4, 0.56, n), hl = mpSmooth(0.55, 0.62, m) * 0.85, pt = mpSmooth(0.58, 0.66, q) * pk;
    var r = C0[0] + (C1[0] - C0[0]) * v, gg = C0[1] + (C1[1] - C0[1]) * v, b = C0[2] + (C1[2] - C0[2]) * v;
    r += (C2[0] - r) * hl; gg += (C2[1] - gg) * hl; b += (C2[2] - b) * hl; r += (CP[0] - r) * pt; gg += (CP[1] - gg) * pt; b += (CP[2] - b) * pt;
    k = (j * GW + i) * 4; d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
  }
  lx.putImageData(id, 0, 0); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(lc, 0, 0, GW, GH, ox + wx0 * S, oy + wy0 * S, GW / gr * S, GH / gr * S);
  // 2) 땅 장식
  var inG = function (wx, wy) { return wx >= 0 && wy >= 0 && wx < COLS && wy < ROWS; };
  var kAt = function (wx, wy) { return inG(wx, wy) ? g.kind[Math.floor(wy) * COLS + Math.floor(wx)] : ''; };
  var skip = function (wx, wy) { var kk = kAt(wx, wy); return kk === 'p' || kk === 'water' || kk === 'lava'; };
  var area = (wx1 - wx0) * (wy1 - wy0), p, LC = ['#e0503a', '#f08c2e', '#f2c832', '#c83c30', '#ffb85a'];
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (th === 'palace') mwPaving(x, view, T, rnd, N, wx0, wy0, wx1, wy1);
  function tuft(px, py, hh, cA) {
    for (var b2 = -1; b2 <= 1; b2++) {
      var ang = -Math.PI / 2 + b2 * 0.6 + (rnd() - 0.5) * 0.2, len = hh * (b2 ? 0.72 : 1), bw = S * 0.016, tx2 = px + Math.cos(ang) * len, ty2 = py + Math.sin(ang) * len, nx2 = -Math.sin(ang) * bw, ny2 = Math.cos(ang) * bw;
      x.fillStyle = rgba(T.grass[0], 0.5); x.beginPath(); x.moveTo(px - nx2 + S * 0.006, py - ny2 + S * 0.008); x.quadraticCurveTo(px + Math.cos(ang) * len * 0.5 - nx2 * 1.4 + S * 0.006, py + Math.sin(ang) * len * 0.5 - ny2 * 1.4 + S * 0.008, tx2 + S * 0.006, ty2 + S * 0.008); x.quadraticCurveTo(px + Math.cos(ang) * len * 0.5 + nx2 * 1.4 + S * 0.006, py + Math.sin(ang) * len * 0.5 + ny2 * 1.4 + S * 0.008, px + nx2 + S * 0.006, py + ny2 + S * 0.008); x.fill();
      x.fillStyle = cA; x.beginPath(); x.moveTo(px - nx2, py - ny2); x.quadraticCurveTo(px + Math.cos(ang) * len * 0.5 - nx2 * 1.4, py + Math.sin(ang) * len * 0.5 - ny2 * 1.4, tx2, ty2); x.quadraticCurveTo(px + Math.cos(ang) * len * 0.5 + nx2 * 1.4, py + Math.sin(ang) * len * 0.5 + ny2 * 1.4, px + nx2, py + ny2); x.fill();
    }
  }
  var nC = Math.round(area * (th === 'palace' ? 0.35 : th === 'pogu' ? 0.7 : 1.4));
  for (var qq = 0; qq < nC; qq++) {
    var cwx = wx0 + rnd() * (wx1 - wx0), cwy = wy0 + rnd() * (wy1 - wy0), nt = 2 + Math.floor(rnd() * 4);
    if (N.fbm(cwx * 0.7 + 5, cwy * 0.7 + 9, 2) < 0.45 || skip(cwx, cwy)) continue;
    for (var t2 = 0; t2 < nt; t2++) {
      var twx = cwx + (rnd() - 0.5) * 0.7, twy = cwy + (rnd() - 0.5) * 0.45; if (skip(twx, twy)) continue; p = sxy(twx, twy);
      tuft(p[0], p[1], S * (0.07 + rnd() * 0.05), rnd() < 0.55 ? T.grass[2] : T.grass[3]);
    }
    if (th === 'hanok' && rnd() < 0.45) for (k = 0; k < 3; k++) { var fwx = cwx + (rnd() - 0.5) * 0.6, fwy = cwy + (rnd() - 0.5) * 0.4; if (skip(fwx, fwy)) continue; p = sxy(fwx, fwy); mpFlower(x, p[0], p[1], S * (0.028 + rnd() * 0.014), T.flowers[Math.floor(rnd() * 3)], '#ffb030'); }
  }
  // 테마별 흩뿌림: 낙엽(산사), 댓잎(대숲), 조개와 모래 물결(포구), 조약돌(기와 마을)
  var nF = area * (th === 'sansa' ? 4.2 : th === 'bamboo' ? 2.2 : th === 'pogu' ? 1.6 : th === 'palace' ? 0.25 : 0.5);
  for (var f = 0; f < nF; f++) {
    var wx3 = wx0 + rnd() * (wx1 - wx0), wy3 = wy0 + rnd() * (wy1 - wy0); if (skip(wx3, wy3)) { rnd(); continue; } p = sxy(wx3, wy3);
    if (th === 'sansa' || th === 'palace') { if (th === 'sansa' && N.fbm(wx3 * 0.8 + 3, wy3 * 0.8, 2) < 0.4) continue; var lc2 = LC[Math.floor(rnd() * 5)], la = rnd() * 6, ll = S * (0.07 + rnd() * 0.05); mwLeaf(x, p[0] + S * 0.008, p[1] + S * 0.012, ll, ll * 0.36, la, rgba('#6a3a2a', 0.35)); mwLeaf(x, p[0], p[1], ll, ll * 0.36, la, lc2); }
    else if (th === 'bamboo') { var a2 = rnd() * 6, l2 = S * (0.1 + rnd() * 0.06); mwLeaf(x, p[0], p[1], l2, l2 * 0.16, a2, rnd() < 0.6 ? rgba('#d8d890', 0.8) : rgba('#9ccc72', 0.85)); }
    else if (th === 'pogu') {
      var rv = rnd();
      if (rv < 0.55) { x.strokeStyle = rgba('#c8a868', 0.45); x.lineWidth = Math.max(1, S * 0.016); x.beginPath(); x.moveTo(p[0], p[1]); x.quadraticCurveTo(p[0] + S * 0.07, p[1] - S * 0.025, p[0] + S * 0.15, p[1]); x.stroke(); }
      else if (rv < 0.85) { var sr = S * (0.022 + rnd() * 0.014); x.fillStyle = rgba('#b08a5c', 0.5); x.beginPath(); x.ellipse(p[0] + sr * 0.2, p[1] + sr * 0.3, sr * 1.1, sr * 0.8, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = rv < 0.7 ? '#fff6ea' : '#ffd0d0'; x.beginPath(); x.arc(p[0], p[1], sr, Math.PI, 0); x.fill(); }
      else { x.fillStyle = '#ff9a5a'; x.beginPath(); twStarP(x, p[0], p[1], S * 0.04, S * 0.017); x.fill(); }
    } else { var pc = mixc(T.rock, T.g[1], 0.3), pr = S * (0.02 + rnd() * 0.018); x.fillStyle = rgba(twSh(pc, 0.5), 0.45); x.beginPath(); x.ellipse(p[0] + pr * 0.2, p[1] + pr * 0.35, pr * 1.1, pr * 0.7, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = twLt(pc, 0.25); x.beginPath(); x.ellipse(p[0], p[1], pr, pr * 0.66, 0, 0, Math.PI * 2); x.fill(); }
  }
  // 3) 물, 4) 길과 다리
  paintLiquids(x, g, view, T, rnd);
  mwRoads(x, g, view, T, rnd, N);
  // 5) 격자 밖 가장자리 장식(뭍과 물을 가려서)
  var props = [], F = g.mwF, occ = {}, info = mwSeaInfo(g);
  for (var py = Math.floor(wy0) - 1; py < Math.ceil(wy1) + 1; py++) for (var px = Math.floor(wx0) - 1; px < Math.ceil(wx1) + 1; px++) {
    if (px >= 0 && py >= 0 && px < COLS && py < ROWS) continue;
    var near = false;
    g.paths.forEach(function (pp) { for (var s3 = 0; s3 < pp.n; s3 += 6) if (Math.abs(pp.xs[s3] - (px + 0.5)) < 1.2 && Math.abs(pp.ys[s3] - (py + 0.5)) < 1.2) { near = true; break; } });
    info.lanes.forEach(function (L) { for (var s4 = 0; s4 < L.n; s4 += 6) if (Math.abs(L.xs[s4] - (px + 0.5)) < 1.3 && Math.abs(L.ys[s4] - (py + 0.5)) < 1.3) { near = true; break; } });
    var dens = (th === 'bamboo' ? 0.9 : th === 'palace' ? 0.5 : 0.62) + N.n2(px * 0.7, py * 0.7) * 0.5, rv2 = rnd(), rk = rnd(), rx = rnd(), ry2 = rnd(), rs = rnd();
    if (near || occ[px + ',' + py]) continue;
    var wet = F ? F.at(px + 0.5, py + 0.5) : 0, kind;
    if (wet > 0.3) { if (wet < 0.9 || !T.wprops || rv2 > 0.16) continue; kind = T.wprops[Math.floor(rk * T.wprops.length)]; }
    else { if (rv2 > dens) continue; kind = T.props[Math.floor(rk * T.props.length)]; }
    if (MW_WIDE[kind]) { if (F && F.at(px + 1.5, py + 0.5) > 0.3) continue; occ[(px + 1) + ',' + py] = 1; props.push({ k: kind, x: px + 0.9 + rx * 0.2, y: py + 0.5 + ry2 * 0.4, seed: Math.floor(rs * 6) }); }
    else props.push({ k: kind, x: px + 0.2 + rx * 0.6, y: py + 0.4 + ry2 * 0.5, seed: Math.floor(rs * 6) });
  }
  props.sort(function (a, b2) { return a.y - b2.y; });
  props.forEach(function (pr2) { var sp = propSpr(pr2.k, th, S, pr2.seed), p4 = sxy(pr2.x, pr2.y); drawSpr(x, sp, p4[0], p4[1]); });
  // 6) 색 보정: 낮은 따뜻한 한지 빛, 밤은 달빛(푸른 곱하기) + 길가 청사초롱 불빛
  x.save();
  x.globalCompositeOperation = 'soft-light';
  var lg = x.createLinearGradient(0, 0, W, H); lg.addColorStop(0, rgba(T.light, 0.7)); lg.addColorStop(0.55, 'rgba(128,128,128,0)'); lg.addColorStop(1, rgba(T.shade, 0.45));
  x.fillStyle = lg; x.fillRect(0, 0, W, H);
  if (night) {
    x.globalCompositeOperation = 'multiply'; x.fillStyle = '#6f7fc4'; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'screen'; var mg = x.createRadialGradient(W * 0.2, H * 0.12, 0, W * 0.2, H * 0.12, Math.max(W, H) * 0.75); mg.addColorStop(0, 'rgba(170,196,255,0.34)'); mg.addColorStop(1, 'rgba(170,196,255,0)'); x.fillStyle = mg; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'source-over';
    var lan = propSpr('mwLantern', th, S * 0.62, 0), gl = glowSpr('#ffc878', 48);
    g.paths.forEach(function (pp, pi) {
      for (var s5 = 30 + pi * 17, sd = 1; s5 < pp.n - 20; s5 += 56, sd = -sd) {
        var s6 = Math.min(pp.n - 1, s5 + 1), dx = pp.xs[s6] - pp.xs[s5 - 1], dy = pp.ys[s6] - pp.ys[s5 - 1], dl = Math.hypot(dx, dy) || 1, lx3 = pp.xs[s5] - dy / dl * 0.5 * sd, ly3 = pp.ys[s5] + dx / dl * 0.5 * sd;
        if (!inG(lx3, ly3) || skip(lx3, ly3) || kAt(lx3, ly3 - 0.2) === 'p') continue;
        var q4 = sxy(lx3, ly3 + 0.12);
        x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.5; x.drawImage(gl, q4[0] - S * 0.75, q4[1] - S * 0.85, S * 1.5, S * 1.3); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        drawSpr(x, lan, q4[0], q4[1]);
      }
    });
  }
  x.globalCompositeOperation = 'source-over';
  var gx0 = ox, gy0 = oy, gx1 = ox + COLS * S, gy1 = oy + ROWS * S;
  x.fillStyle = rgba(night ? '#c8d4ff' : T.light, night ? 0.07 : 0.13);
  x.fillRect(0, 0, W, Math.max(0, gy0)); x.fillRect(0, gy1, W, Math.max(0, H - gy1)); x.fillRect(0, gy0, Math.max(0, gx0), gy1 - gy0); x.fillRect(gx1, gy0, Math.max(0, W - gx1), gy1 - gy0);
  x.restore();
  return c;
}
var MW_WIDE = { mwGiwa: 1, mwChoga: 1, mwHall: 1, mwTemple: 1, mwBoat: 1, mwBoatL: 1 };
// 궁궐 마당의 박석: 줄마다 어긋난 넓적한 돌판, 틈새의 풀
function mwPaving(x, view, T, rnd, N, wx0, wy0, wx1, wy1) {
  var S = view.S, ox = view.ox, oy = view.oy, r, rows = Math.ceil((wy1 - wy0) * 2) + 2, y0 = Math.floor(wy0);
  for (r = 0; r < rows; r++) {
    var wy = y0 + r * 0.5, wx = Math.floor(wx0) - rnd() * 0.6;
    while (wx < wx1) {
      var w = 0.55 + rnd() * 0.5, X = ox + wx * S, Y = oy + wy * S, tv = rnd();
      x.fillStyle = tv < 0.3 ? 'rgba(255,250,236,0.2)' : tv < 0.55 ? 'rgba(120,104,84,0.1)' : 'rgba(0,0,0,0)';
      x.fillRect(X + S * 0.02, Y + S * 0.02, w * S - S * 0.04, S * 0.5 - S * 0.04);
      x.strokeStyle = 'rgba(126,112,92,0.34)'; x.lineWidth = Math.max(1, S * 0.016); x.strokeRect(X, Y, w * S, S * 0.5);
      x.strokeStyle = 'rgba(255,252,240,0.4)'; x.lineWidth = Math.max(1, S * 0.012); x.beginPath(); x.moveTo(X + S * 0.025, Y + S * 0.48); x.lineTo(X + S * 0.025, Y + S * 0.03); x.lineTo(X + w * S - S * 0.02, Y + S * 0.03); x.stroke();
      if (rnd() < 0.18) { x.fillStyle = rgba(T.grass[2], 0.9); for (var k = 0; k < 3; k++) { x.beginPath(); x.ellipse(X + (0.1 + rnd() * 0.3) * S, Y + S * 0.5, S * 0.03, S * 0.016, 0, 0, Math.PI * 2); x.fill(); } }
      wx += w;
    }
  }
}
// 길: mwDirt 흙길, mwTrail 오솔길(이끼 낀 가장자리, 디딤돌), mwPave 어도(세 줄 돌길), mwPlank 널길, mwSteps 돌계단
function mwRoads(x, g, view, T, rnd, N) {
  var S = view.S, ox = view.ox, oy = view.oy, road = T.road, D = T.dirt, i, k;
  var P = g.M.paths.map(function (w) { var a = w[0], b = w[1], w2 = w.slice(); w2[0] = [a[0] + Math.sign(a[0] - b[0]) * 6, a[1] + Math.sign(a[1] - b[1]) * 6]; return buildPath(w2, 0.5); });
  var edge = shp(), main = shp(), hw = road === 'mwTrail' ? 0.37 : 0.4;
  P.forEach(function (p) { for (var q = 0; q < p.n; q += 2) { var jt = road === 'mwPave' || road === 'mwPlank' || road === 'mwSteps' ? 0 : N.n2(p.xs[q] * 1.7, p.ys[q] * 1.7), X = ox + p.xs[q] * S, Y = oy + p.ys[q] * S; edge.ell(X, Y, S * (hw + 0.075 + jt * 0.03), S * (hw + 0.075 + jt * 0.03)); main.ell(X, Y, S * (hw + jt * 0.02), S * (hw + jt * 0.02)); } });
  function trace(p, step) { x.beginPath(); for (var q = 0; q < p.n; q += step) { var X = ox + p.xs[q] * S, Y = oy + p.ys[q] * S; if (!q) x.moveTo(X, Y); else x.lineTo(X, Y); } }
  function dirAt(p, q) { var q0 = Math.max(0, q - 1), q1 = Math.min(p.n - 1, q + 1), dx = p.xs[q1] - p.xs[q0], dy = p.ys[q1] - p.ys[q0], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; }
  function cross(p, q, a, b) { var dq = dirAt(p, q); x.moveTo(ox + (p.xs[q] - dq[1] * a) * S, oy + (p.ys[q] + dq[0] * a) * S); x.lineTo(ox + (p.xs[q] - dq[1] * b) * S, oy + (p.ys[q] + dq[0] * b) * S); }
  x.save(); x.translate(S * 0.02, S * 0.05); x.fillStyle = rgba(twSh(D[0], 0.4), 0.3); x.fill(edge.p); x.restore();
  x.fillStyle = D[0]; x.fill(edge.p); x.fillStyle = D[1]; x.fill(main.p);
  x.save(); x.clip(main.p); x.lineCap = 'round'; x.lineJoin = 'round';
  var cnt = 0; P.forEach(function (p) { cnt += p.n; });
  if (road === 'mwPave') {
    // 가운데 한 단 높은 길 + 양옆 길, 가로 이음
    P.forEach(function (p) {
      x.strokeStyle = D[2]; x.lineWidth = S * 0.34; trace(p, 3); x.stroke(); x.strokeStyle = rgba(D[3], 0.6); x.lineWidth = S * 0.2; trace(p, 3); x.stroke();
      x.strokeStyle = rgba(D[0], 0.5); x.lineWidth = Math.max(1, S * 0.016); x.beginPath(); for (i = 4; i < p.n; i += 9) cross(p, i, -0.4, 0.4); x.stroke();
      [-0.17, 0.17].forEach(function (off) { x.strokeStyle = rgba(D[0], 0.62); x.lineWidth = Math.max(1, S * 0.02); x.beginPath(); for (i = 0; i < p.n; i += 3) { var dq = dirAt(p, i), X = ox + (p.xs[i] - dq[1] * off) * S, Y = oy + (p.ys[i] + dq[0] * off) * S; if (!i) x.moveTo(X, Y); else x.lineTo(X, Y); } x.stroke(); });
    });
  } else if (road === 'mwPlank') {
    P.forEach(function (p) {
      for (i = 0; i + 3 < p.n; i += 3) { var tv = (Math.floor(i / 3) * 7) % 4; if (tv === 1 || tv === 3) { x.strokeStyle = tv === 1 ? 'rgba(255,240,206,0.3)' : rgba(D[0], 0.14); x.lineWidth = S * 0.15; x.lineCap = 'butt'; x.beginPath(); cross(p, i + 1, -0.42, 0.42); x.stroke(); } }
      x.strokeStyle = rgba(D[0], 0.62); x.lineWidth = Math.max(1, S * 0.016); x.lineCap = 'butt'; x.beginPath(); for (i = 0; i < p.n; i += 3) cross(p, i, -0.42, 0.42); x.stroke();
      x.fillStyle = rgba(D[0], 0.7); for (i = 1; i < p.n; i += 3) { var dq = dirAt(p, i); [-0.31, 0.31].forEach(function (off) { x.beginPath(); x.arc(ox + (p.xs[i] - dq[1] * off) * S, oy + (p.ys[i] + dq[0] * off) * S, S * 0.012, 0, Math.PI * 2); x.fill(); }); }
    });
  } else if (road === 'mwSteps') {
    // 돌계단: 디딤판마다 밝은 앞턱과 어두운 그늘 줄
    P.forEach(function (p) {
      x.strokeStyle = rgba(D[2], 0.8); x.lineWidth = S * 0.5; trace(p, 3); x.stroke();
      for (i = 2; i < p.n; i += 6) { x.lineCap = 'butt'; x.strokeStyle = rgba(D[0], 0.5); x.lineWidth = S * 0.05; x.beginPath(); cross(p, i, -0.42, 0.42); x.stroke(); x.strokeStyle = rgba(D[3], 0.95); x.lineWidth = S * 0.035; x.beginPath(); cross(p, Math.min(p.n - 1, i + 1), -0.42, 0.42); x.stroke(); }
    });
    for (k = 0; k < cnt / 18; k++) { var p1 = P[Math.floor(rnd() * P.length)], k2 = Math.floor(rnd() * p1.n), lc = ['#e0503a', '#f08c2e', '#f2c832'][k % 3], X1 = ox + p1.xs[k2] * S + (rnd() - 0.5) * S * 0.6, Y1 = oy + p1.ys[k2] * S + (rnd() - 0.5) * S * 0.6, an = rnd() * 6; mwLeaf(x, X1 + S * 0.008, Y1 + S * 0.01, S * 0.1, S * 0.036, an, rgba('#5a3a2a', 0.3)); mwLeaf(x, X1, Y1, S * 0.1, S * 0.036, an, lc); }
  } else {
    P.forEach(function (p) {
      x.strokeStyle = rgba(D[2], 0.75); x.lineWidth = S * 0.36; trace(p, 3); x.stroke(); x.strokeStyle = rgba(D[3], 0.35); x.lineWidth = S * 0.14; trace(p, 3); x.stroke();
      if (road === 'mwDirt') [-0.17, 0.17].forEach(function (off) { x.strokeStyle = rgba(D[0], 0.14); x.lineWidth = S * 0.045; x.beginPath(); for (i = 0; i < p.n - 1; i += 3) { var dq = dirAt(p, i), X = ox + (p.xs[i] - dq[1] * off) * S, Y = oy + (p.ys[i] + dq[0] * off) * S; if (!i) x.moveTo(X, Y); else x.lineTo(X, Y); } x.stroke(); });
    });
    for (k = 0; k < cnt / 14; k++) { var p2 = P[Math.floor(rnd() * P.length)], k3 = Math.floor(rnd() * p2.n), X2 = ox + p2.xs[k3] * S + (rnd() - 0.5) * S * 0.6, Y2 = oy + p2.ys[k3] * S + (rnd() - 0.5) * S * 0.6, r = S * (0.016 + rnd() * 0.018); x.fillStyle = rgba(twSh(D[0], 0.1), 0.35); x.beginPath(); x.ellipse(X2 + r * 0.2, Y2 + r * 0.3, r * 1.2, r * 0.85, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = D[3]; x.beginPath(); x.ellipse(X2, Y2, r * 1.1, r * 0.75, 0, 0, Math.PI * 2); x.fill(); }
    if (road === 'mwTrail') {
      // 디딤돌 + 가장자리 이끼 + 댓잎
      P.forEach(function (p) {
        for (i = 6; i < p.n; i += 13) { var dq = dirAt(p, i), off = ((i / 13) % 2 ? 0.07 : -0.07), X = ox + (p.xs[i] - dq[1] * off) * S, Y = oy + (p.ys[i] + dq[0] * off) * S, an = Math.atan2(dq[1], dq[0]) + (rnd() - 0.5) * 0.9, zs = 0.75 + rnd() * 0.5; x.fillStyle = rgba('#5a4a34', 0.35); x.beginPath(); x.ellipse(X + S * 0.015, Y + S * 0.03, S * 0.2 * zs, S * 0.14 * zs, an, 0, Math.PI * 2); x.fill(); x.fillStyle = rnd() < 0.5 ? '#c4c8bc' : '#b4bcae'; x.beginPath(); x.ellipse(X, Y, S * 0.19 * zs, S * 0.13 * zs, an, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(240,244,232,0.7)'; x.beginPath(); x.ellipse(X - S * 0.03, Y - S * 0.03, S * 0.11 * zs, S * 0.06 * zs, an, 0, Math.PI * 2); x.fill(); }
        for (i = 0; i < p.n; i += 2) { if (rnd() < 0.5) continue; var dq2 = dirAt(p, i), sd = rnd() < 0.5 ? -1 : 1, o2 = (0.33 + rnd() * 0.08) * sd; x.fillStyle = rgba(rnd() < 0.5 ? T.grass[1] : T.grass[2], 0.75); x.beginPath(); x.ellipse(ox + (p.xs[i] - dq2[1] * o2) * S, oy + (p.ys[i] + dq2[0] * o2) * S, S * 0.05, S * 0.035, rnd() * 3, 0, Math.PI * 2); x.fill(); }
      });
      for (k = 0; k < cnt / 16; k++) { var p3 = P[Math.floor(rnd() * P.length)], k4 = Math.floor(rnd() * p3.n); mwLeaf(x, ox + p3.xs[k4] * S + (rnd() - 0.5) * S * 0.6, oy + p3.ys[k4] * S + (rnd() - 0.5) * S * 0.6, S * 0.12, S * 0.02, rnd() * 6, rgba('#8fae5c', 0.9)); }
    }
  }
  x.restore();
  var ins = mkC(view.W, view.H), isx = cx2(ins); isx.fillStyle = twSh(D[0], 0.1); isx.fill(main.p); isx.globalCompositeOperation = 'destination-out'; isx.translate(0, S * 0.055); isx.fill(main.p);
  x.save(); x.globalAlpha = 0.32; x.drawImage(ins, 0, 0); x.restore();
  mwBridges(x, g, view, T, rnd);
}

// ---------- 성문: 돌 성벽 위에 기와 얹은 누각 ----------
function mwGateSpr(S, th) {
  var key = 'gate:' + th + ':' + Math.round(S); if (PROP_CACHE[key]) return PROP_CACHE[key];
  var T = THEME[th], G = T.gate || {}, o = canvasFor(S, 2.6, 2.7, 0.88), x = o.x, gx = o.gx, gy = o.gy, sz = S, rnd = rngOf(77), i, k;
  var stone = G.stone || '#e2dccc', roofC = G.roof || '#5a6478', FL = G.flag || ['#e0503a', '#3a78c8'], red = '#c9483a';
  TW_IW = Math.max(1, sz * 0.022);
  twShadow(x, gx + sz * 0.15, gy + sz * 0.02, sz * 1.05, sz * 0.3, 0.45);
  // 깃발(뒤): 삼각기 두 개
  [-1, 1].forEach(function (sd, fi) {
    var px = gx + sd * sz * 0.86, top = gy - sz * 1.62;
    mwRR(x, px - sz * 0.018, top, sz * 0.036, sz * 0.9, sz * 0.015, '#8a5c3c', { hi: 0.4 });
    var fl = shp(); fl.p.moveTo(px, top + sz * 0.02); fl.p.quadraticCurveTo(px + sd * sz * 0.16, top + sz * 0.06, px + sd * sz * 0.34, top + sz * 0.17); fl.p.quadraticCurveTo(px + sd * sz * 0.16, top + sz * 0.2, px, top + sz * 0.32); fl.p.closePath(); fl.ext(px - sz * 0.34, top); fl.ext(px + sz * 0.34, top + sz * 0.32);
    twFill(x, fl, FL[fi], { hi: 0.4 }); x.save(); x.clip(fl.p); x.strokeStyle = FL[1 - fi] === '#ffffff' ? '#f2c832' : FL[1 - fi]; x.lineWidth = sz * 0.035; x.stroke(fl.p); x.restore(); mwInk(x, fl, FL[fi], TW_IW * 0.8);
    mwEl(x, px, top - sz * 0.01, sz * 0.035, sz * 0.035, '#e9b436', { hi: 0.5 });
  });
  // 석축(아래가 조금 넓은 성벽) + 돌 쌓기
  var by = gy - sz * 0.74, wall = shp().poly([[gx - sz * 1.0, gy], [gx - sz * 0.92, by], [gx + sz * 0.92, by], [gx + sz * 1.0, gy]]);
  twFill(x, wall, stone, { hi: 0.3, lo: 0.24 });
  x.save(); x.clip(wall.p); x.strokeStyle = rgba(twSh(stone, 0.55), 0.3); x.lineWidth = Math.max(0.8, sz * 0.012);
  for (i = 1; i < 5; i++) { var ry = by + i * sz * 0.148; x.beginPath(); x.moveTo(gx - sz, ry); x.lineTo(gx + sz, ry); x.stroke(); for (k = -6; k < 7; k++) { var bx = gx + (k + (i % 2) * 0.5) * sz * 0.2; x.beginPath(); x.moveTo(bx, ry - sz * 0.148); x.lineTo(bx, ry); x.stroke(); } }
  for (i = 0; i < 9; i++) { x.fillStyle = rgba(twLt(stone, 0.9), 0.55); twPill(x, gx + (rnd() - 0.5) * sz * 1.8, by + (Math.floor(rnd() * 5) + 0.5) * sz * 0.148, sz * 0.16, sz * 0.09); }
  x.restore(); mwInk(x, wall, twSh(stone, 0.2));
  // 홍예문 + 나무 문
  var arch = shp(); arch.p.moveTo(gx - sz * 0.3, gy + sz * 0.01); arch.p.lineTo(gx - sz * 0.3, gy - sz * 0.36); arch.p.arc(gx, gy - sz * 0.36, sz * 0.3, Math.PI, 0); arch.p.lineTo(gx + sz * 0.3, gy + sz * 0.01); arch.p.closePath(); arch.ext(gx - sz * 0.3, gy - sz * 0.66); arch.ext(gx + sz * 0.3, gy);
  twFill(x, arch, twLt(stone, 0.3), { hi: 0.2, lo: 0.1 }); mwInk(x, arch, twSh(stone, 0.25));
  var door = shp(); door.p.moveTo(gx - sz * 0.22, gy); door.p.lineTo(gx - sz * 0.22, gy - sz * 0.36); door.p.arc(gx, gy - sz * 0.36, sz * 0.22, Math.PI, 0); door.p.lineTo(gx + sz * 0.22, gy); door.p.closePath(); door.ext(gx - sz * 0.22, gy - sz * 0.58); door.ext(gx + sz * 0.22, gy);
  twFill(x, door, '#a65a3c', { hi: 0.3, lo: 0.3 });
  x.save(); x.clip(door.p); x.strokeStyle = 'rgba(90,40,24,0.5)'; x.lineWidth = Math.max(0.8, sz * 0.014); for (k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(gx + k * sz * 0.088, gy - sz * 0.6); x.lineTo(gx + k * sz * 0.088, gy); x.stroke(); }
  x.fillStyle = '#f2c84a'; for (i = 0; i < 3; i++) for (k = -2; k <= 2; k++) { if (!k) continue; x.beginPath(); x.arc(gx + k * sz * 0.066, gy - sz * (0.1 + i * 0.13), sz * 0.014, 0, Math.PI * 2); x.fill(); } x.restore();
  mwInk(x, door, '#8a4a30');
  x.save(); x.strokeStyle = 'rgba(70,30,20,0.7)'; x.lineWidth = Math.max(1, sz * 0.016); x.beginPath(); x.moveTo(gx, gy - sz * 0.58); x.lineTo(gx, gy); x.stroke(); x.restore();
  [-1, 1].forEach(function (sd) { x.save(); x.strokeStyle = '#f2c84a'; x.lineWidth = sz * 0.02; x.beginPath(); x.arc(gx + sd * sz * 0.05, gy - sz * 0.22, sz * 0.028, 0, Math.PI * 2); x.stroke(); x.restore(); });
  // 여장(성가퀴) 한 줄
  for (i = 0; i < 9; i++) { var mx = gx - sz * 0.92 + i * sz * 0.207; mwRR(x, mx, by - sz * 0.1, sz * 0.18, sz * 0.13, sz * 0.02, twLt(stone, 0.12), { hi: 0.3 }); x.fillStyle = rgba('#4a3a4a', 0.55); x.fillRect(mx + sz * 0.075, by - sz * 0.06, sz * 0.03, sz * 0.05); }
  // 누각: 안쪽 어두운 칸, 녹색 창살, 붉은 기둥, 단청 띠
  var py0 = by - sz * 0.44, pw = sz * 1.36;
  var inn = shp().rrect(gx - pw / 2, py0, pw, sz * 0.36, sz * 0.01); twFill(x, inn, '#5a4458', { hi: 0.1, lo: 0.2 });
  for (i = 0; i < 4; i++) { var wx = gx - pw / 2 + pw * (i + 0.5) / 4, ws = shp().rrect(wx - pw * 0.085, py0 + sz * 0.07, pw * 0.17, sz * 0.25, sz * 0.01); twFill(x, ws, '#3f9a80', { hi: 0.3, lo: 0.15 }); x.save(); x.clip(ws.p); x.strokeStyle = 'rgba(255,231,160,0.8)'; x.lineWidth = Math.max(0.7, sz * 0.01); for (k = 1; k < 4; k++) { x.beginPath(); x.moveTo(wx - pw * 0.085 + pw * 0.17 * k / 4, py0); x.lineTo(wx - pw * 0.085 + pw * 0.17 * k / 4, py0 + sz * 0.4); x.moveTo(wx - pw * 0.1, py0 + sz * 0.07 + sz * 0.25 * k / 4); x.lineTo(wx + pw * 0.1, py0 + sz * 0.07 + sz * 0.25 * k / 4); x.stroke(); } x.restore(); mwInk(x, ws, '#3f9a80', TW_IW * 0.6); }
  for (i = 0; i < 5; i++) mwRR(x, gx - pw / 2 + pw * i / 4 - sz * 0.035, py0, sz * 0.07, sz * 0.36, sz * 0.012, red, { hi: 0.4 });
  mwRR(x, gx - pw * 0.52, by - sz * 0.11, pw * 1.04, sz * 0.05, sz * 0.012, red, { hi: 0.35 });
  var bs = shp().rrect(gx - pw * 0.53, py0 - sz * 0.07, pw * 1.06, sz * 0.11, sz * 0.012), cs = ['#e0503a', '#f2c832', '#3a78c8', '#fff8e2']; twFill(x, bs, '#3f9a80', { hi: 0.25 });
  x.save(); x.clip(bs.p); for (i = 0; i < 20; i++) { x.fillStyle = cs[i % 4]; x.beginPath(); x.arc(gx - pw * 0.51 + pw * 1.02 * (i + 0.5) / 20, py0 - sz * 0.015, sz * 0.026, 0, Math.PI * 2); x.fill(); } x.fillStyle = 'rgba(58,120,200,0.9)'; x.fillRect(gx - pw * 0.53, py0 - sz * 0.07, pw * 1.06, sz * 0.022); x.restore(); mwInk(x, bs, '#3f9a80', TW_IW * 0.7);
  // 지붕 + 글자 없는 현판
  mwRoof(x, gx, py0 - sz * 0.05, sz * 2.3, sz * 0.62, roofC, { fin: G.gold ? '#e9b436' : null, n: 13, lift: 0.26 });
  var pl = shp().rrect(gx - sz * 0.17, py0 - sz * 0.07, sz * 0.34, sz * 0.15, sz * 0.015); twFill(x, pl, '#2c3a5c', { hi: 0.2 }); x.save(); x.strokeStyle = '#e9b436'; x.lineWidth = Math.max(1, sz * 0.02); x.stroke(pl.p); x.restore(); mwInk(x, shp().rrect(gx - sz * 0.185, py0 - sz * 0.085, sz * 0.37, sz * 0.18, sz * 0.02), '#8a6a2a', TW_IW * 0.6);
  x.fillStyle = '#e9b436'; x.beginPath(); twStarP(x, gx, py0 + sz * 0.005, sz * 0.04, sz * 0.022, 8); x.fill();
  // 청사초롱 두 개 (render.js 등불 빛 자리: 문 옆 0.36, 높이 0.62)
  [-1, 1].forEach(function (sd) { var lx = gx + sd * sz * 0.36; x.save(); x.strokeStyle = '#6a5a4a'; x.lineWidth = Math.max(0.8, sz * 0.012); x.beginPath(); x.moveTo(lx, by - sz * 0.02); x.lineTo(lx, gy - sz * 0.7); x.stroke(); x.restore(); mwLanternAt(x, lx, gy - sz * 0.7, sz * 0.15, 0.45); });
  return (PROP_CACHE[key] = trimSpr(spr(o.c, gx, gy)));
}

// ---------- 날씨 입자 ----------
var MW_AMB = { k: '', p: [], night: 0, S: 0, img: {} };
function mwAmbImg(kind, col, d) {
  var key = kind + col + Math.round(d), c = MW_AMB.img[key]; if (c) return c;
  d = Math.max(4, Math.round(d)); c = mkC(d, d); var x = cx2(c), m = d / 2;
  if (kind === 'maple') { // 다섯 갈래 단풍잎
    x.translate(m, m); x.fillStyle = col; x.beginPath();
    for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + (i - 2) * 0.62, r = m * (i === 2 ? 0.95 : i === 1 || i === 3 ? 0.82 : 0.6); x.lineTo(Math.cos(a - 0.2) * r * 0.45, Math.sin(a - 0.2) * r * 0.45); x.lineTo(Math.cos(a) * r, Math.sin(a) * r); x.lineTo(Math.cos(a + 0.2) * r * 0.45, Math.sin(a + 0.2) * r * 0.45); }
    x.lineTo(m * 0.06, m * 0.2); x.lineTo(m * 0.04, m * 0.8); x.lineTo(-m * 0.04, m * 0.8); x.lineTo(-m * 0.06, m * 0.2); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(120,40,20,0.45)'; x.lineWidth = Math.max(0.6, d * 0.04); x.stroke();
  } else if (kind === 'ginkgo') { x.translate(m, m); x.fillStyle = col; x.beginPath(); x.moveTo(0, m * 0.8); x.quadraticCurveTo(-m * 1.0, -m * 0.1, -m * 0.7, -m * 0.7); x.quadraticCurveTo(0, -m * 0.5, m * 0.7, -m * 0.7); x.quadraticCurveTo(m * 1.0, -m * 0.1, 0, m * 0.8); x.fill(); x.strokeStyle = 'rgba(150,110,10,0.45)'; x.lineWidth = Math.max(0.6, d * 0.04); x.stroke(); }
  else if (kind === 'gull' || kind === 'gull2') { // 위에서 본 갈매기(날개 편 것, 접은 것)
    var f = kind === 'gull' ? 1 : 0.62; x.translate(m, m); x.lineJoin = 'round';
    x.fillStyle = '#ffffff'; x.strokeStyle = 'rgba(70,80,110,0.8)'; x.lineWidth = Math.max(0.8, d * 0.035);
    x.beginPath(); x.moveTo(-m * 0.92 * f, -m * 0.1); x.quadraticCurveTo(-m * 0.45 * f, -m * 0.42, 0, -m * 0.12); x.quadraticCurveTo(m * 0.45 * f, -m * 0.42, m * 0.92 * f, -m * 0.1); x.quadraticCurveTo(m * 0.4 * f, -m * 0.02, m * 0.1, m * 0.16); x.lineTo(0, m * 0.5); x.lineTo(-m * 0.1, m * 0.16); x.quadraticCurveTo(-m * 0.4 * f, -m * 0.02, -m * 0.92 * f, -m * 0.1); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#5a6078'; [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(sd * m * 0.92 * f, -m * 0.1); x.quadraticCurveTo(sd * m * 0.74 * f, -m * 0.26, sd * m * 0.62 * f, -m * 0.25); x.quadraticCurveTo(sd * m * 0.7 * f, -m * 0.1, sd * m * 0.92 * f, -m * 0.1); x.fill(); });
    x.fillStyle = '#ffb040'; x.beginPath(); x.moveTo(-m * 0.05, -m * 0.2); x.lineTo(0, -m * 0.42); x.lineTo(m * 0.05, -m * 0.2); x.fill();
  }
  return (MW_AMB.img[key] = c);
}
function mwAmbInit(theme, M) {
  var T = THEME[theme], A = MW_AMB, k = (M && M.amb) || T.amb, n = T.ambN || 24, i;
  A.k = k; A.night = mwNight(M) ? 1 : 0; A.p = []; A.S = 0;
  if (A.night && k !== 'mwFly') n += 0;
  for (i = 0; i < n; i++) A.p.push({ x: Math.random() * (COLS + 4) - 2, y: Math.random() * (ROWS + 4) - 2, z: Math.random(), ph: Math.random() * 6.28, s: 0.5 + Math.random(), r: Math.random(), a: Math.random() * 6.28 });
  if (k === 'mwMist' || A.night) for (i = 0; i < (k === 'mwMist' ? 9 : 12); i++) A.p.push({ fly: 1, x: Math.random() * COLS, y: Math.random() * ROWS, z: Math.random(), ph: Math.random() * 6.28, s: 0.5 + Math.random(), r: Math.random(), a: Math.random() * 6.28 });
}
function mwAmbient(x, view, theme, time, dt) {
  var A = MW_AMB, k = A.k, S = view.S, P = A.p, i, p, ox = view.ox, oy = view.oy, glowN = 0;
  if (k === 'mwMist') { // 대숲 안개 띠
    var fog = softSpr('#e6fff0', 64);
    for (i = 0; i < 5; i++) { var fx = ((time * 0.05 * (1 + i * 0.13) + i * 2.3) % (COLS + 6)) - 3, fy = 1.4 + i * (ROWS - 3) / 4.4 + Math.sin(time * 0.2 + i) * 0.4; x.globalAlpha = 0.17; x.drawImage(fog, ox + (fx - 2.6) * S, oy + (fy - 1) * S, S * 5.2, S * 2); }
    x.globalAlpha = 1;
  }
  for (i = 0; i < P.length; i++) {
    p = P[i];
    var fly = p.fly || k === 'mwFly';
    if (fly) { p.a += dt * (Math.sin(time * 0.7 + p.ph) * 1.2); p.x += Math.cos(p.a) * dt * 0.22 * p.s; p.y += Math.sin(p.a) * dt * 0.16 * p.s; glowN++; }
    else if (k === 'mwMaple') { p.y += dt * 0.34 * p.s; p.x += dt * (Math.sin(time * 1.3 + p.ph) * 0.42 + 0.16); }
    else if (k === 'mwSnow') { p.y += dt * (0.4 + p.s * 0.3); p.x += dt * (Math.sin(time + p.ph) * 0.2 - 0.06); }
    else if (k === 'mwGull') { p.x += Math.cos(p.a) * dt * 0.75 * p.s; p.y += Math.sin(p.a) * dt * 0.75 * p.s; p.a += dt * Math.sin(time * 0.3 + p.ph) * 0.25; }
    else if (k === 'mwMist') { p.y -= dt * 0.12 * p.s; p.x += dt * Math.sin(time * 0.8 + p.ph) * 0.16; }
    if (p.y > ROWS + 2) p.y = -2; if (p.y < -2) p.y = ROWS + 2; if (p.x > COLS + 2) p.x = -2; if (p.x < -2) p.x = COLS + 2;
    if (p.S !== S) {
      p.S = S;
      if (fly) p.d = S * (0.1 + p.z * 0.08);
      else if (k === 'mwMaple') { p.d = S * (0.2 + p.z * 0.16); p.img = p.r < 0.25 ? mwAmbImg('ginkgo', '#f2c832', p.d) : mwAmbImg('maple', p.r < 0.6 ? '#e0503a' : p.r < 0.85 ? '#f08c2e' : '#c83c30', p.d); }
      else if (k === 'mwSnow') { p.d = S * (p.r < 0.3 ? 0.15 + p.z * 0.1 : 0.06 + p.z * 0.06); p.img = p.r < 0.3 ? fxImg('flake', '#dceaff', p.d) : fxImg('dot', '#eef4ff', p.d); }
      else if (k === 'mwGull') { p.d = S * (0.5 + p.z * 0.2); p.img = mwAmbImg('gull', '#ffffff', p.d); p.img2 = mwAmbImg('gull2', '#ffffff', p.d); }
      else { p.d = S * (0.1 + p.z * 0.08); p.img = fxImg('dot', '#e8fff0', p.d); }
    }
    p.X = ox + p.x * S; p.Y = oy + p.y * S;
  }
  if (glowN) { // 반딧불: 깜빡이는 연둣빛 (섞기 방식은 한 번만 바꿈)
    var gl = glowSpr('#d8ff7a', 16); x.globalCompositeOperation = 'lighter';
    for (i = 0; i < P.length; i++) { p = P[i]; if (!(p.fly || k === 'mwFly')) continue; var tw = 0.5 + 0.5 * Math.sin(time * 2.4 * p.s + p.ph * 3), dd = p.d * (A.night ? 1.4 + tw * 1.6 : 0.9 + tw * 0.9); x.globalAlpha = (A.night ? 0.95 : 0.5) * (0.2 + 0.8 * tw); x.drawImage(gl, p.X - dd, p.Y - dd, dd * 2, dd * 2); }
    x.globalCompositeOperation = 'source-over';
  }
  for (i = 0; i < P.length; i++) {
    p = P[i]; if (p.fly || k === 'mwFly' || !p.img) continue; var d = p.d;
    if (k === 'mwMaple') { var rot = time * 1.1 * p.s + p.ph, fy2 = Math.cos(time * 2.2 * p.s + p.ph), cr = Math.cos(rot), sr = Math.sin(rot); x.globalAlpha = 0.92; x.setTransform(cr, sr, -sr * fy2, cr * fy2, p.X, p.Y); x.drawImage(p.img, -d / 2, -d / 2, d, d); x.setTransform(1, 0, 0, 1, 0, 0); }
    else if (k === 'mwGull') {
      x.globalAlpha = 0.16; x.drawImage(mwShadowImg(), p.X - d * 0.4 + S * 0.25, p.Y - d * 0.14 + S * 0.5, d * 0.8, d * 0.28);
      var c2 = Math.cos(p.a + Math.PI / 2), s2 = Math.sin(p.a + Math.PI / 2), im = Math.sin(time * 5 * p.s + p.ph) > 0.35 ? p.img2 : p.img; x.globalAlpha = 1; x.setTransform(c2, s2, -s2, c2, p.X, p.Y); x.drawImage(im, -d / 2, -d / 2, d, d); x.setTransform(1, 0, 0, 1, 0, 0);
    } else { x.globalAlpha = k === 'mwSnow' ? 0.75 + p.z * 0.25 : 0.5; x.drawImage(p.img, p.X - d / 2, p.Y - d / 2, d, d); }
  }
  x.globalAlpha = 1;
}
var MW_SHD = null;
function mwShadowImg() { if (!MW_SHD) { MW_SHD = mkC(64, 24); var sx = cx2(MW_SHD), g2 = sx.createRadialGradient(32, 12, 0, 32, 12, 32); sx.scale(1, 0.375); g2 = sx.createRadialGradient(32, 32, 0, 32, 32, 32); g2.addColorStop(0, 'rgba(20,30,70,1)'); g2.addColorStop(1, 'rgba(20,30,70,0)'); sx.fillStyle = g2; sx.fillRect(0, 0, 64, 64); } return MW_SHD; }

// ---------- 끼워 넣기: 기존 함수를 감싸 mw 테마만 가로챔 (다른 테마는 그대로 원래 함수로) ----------
var MW_OLD = {};
function mwIs(th) { var T = THEME[th]; return !!(T && T.mw); }
function mwInstall() {
  MW_OLD.bg = renderBackground; MW_OLD.gate = gateSpr; MW_OLD.ai = initAmbient; MW_OLD.ad = drawAmbient; MW_OLD.rock = PROPS.bigrock; MW_OLD.chest = PROPS.chest;
  renderBackground = function (g, view) { MW_AMB.M = g.M; return mwIs(g.M.theme) ? mwBackground(g, view) : MW_OLD.bg(g, view); };
  gateSpr = function (S, th) { return mwIs(th) ? mwGateSpr(S, th) : MW_OLD.gate(S, th); };
  initAmbient = function (theme, n) { MW_OLD.ai(theme, n); if (mwIs(theme)) mwAmbInit(theme, MW_AMB.M && MW_AMB.M.theme === theme ? MW_AMB.M : null); };
  drawAmbient = function (x, view, theme, time, dt) { return mwIs(theme) ? mwAmbient(x, view, theme, time, dt) : MW_OLD.ad(x, view, theme, time, dt); };
  PROPS.bigrock = function (S, T, rnd, seed, th) { return T && T.mw && T.rk ? mwRockCell(S, T, rnd, seed, th) : MW_OLD.rock(S, T, rnd, seed, th); };
  PROPS.chest = function (S, T, rnd, seed, th) { return T && T.mw ? PROPS.mwChest(S, T, rnd, seed, th) : MW_OLD.chest(S, T, rnd, seed, th); };
  // 지도 띠 색 표(ui_art.js)가 있으면 4장 색을 넣어 둠
  setTimeout(function () { try { if (typeof UI_BAND_COL !== 'undefined' && UI_BAND_COL) ['hanok', 'bamboo', 'palace', 'pogu', 'sansa'].forEach(function (k) { if (!UI_BAND_COL[k]) UI_BAND_COL[k] = THEME[k].ui; }); } catch (e) { } }, 0);
}
mwInstall();
