// ===== tf_spr.js : 타임플렉스 적 원화(제미나이 그림) 스프라이트 =====
// 그림 자료는 tf_sprites.js의 TF_SPR_DATA[적 키] = { f: 앞모습, b: 뒷모습, s: 옆모습(오른쪽을 봄), fx: [앞, 뒤, 옆 발 중심 x 비율], h: 몸 높이 배율, mo: 움직임(walk, heavy, drive, crawl, fly) }
//   그림 넣기: python3 tools/sprite_in.py 원본.png 적키 → src/tf_sprites.js 갱신 (배경 지우기, 세 방향 자르기, webp)
// 엔진: art_enemy.js enemyFrames가 tfSprFrames를 먼저 부르고, 그림이 있으면 방향별 걸음 프레임(views)을 돌려줌
//   render.js drawEnemy가 tfSprView(e, fr)로 진행 방향에 맞는 모습을 고름: 아래로 오면 앞, 위로 가면 뒤, 옆이면 옆(왼쪽은 뒤집기)
// 한 장 그림에 걸음 느낌을 줌: 발 기준으로 좌우 흔들기, 걸음마다 튀어 오름, 눌림, 옆모습은 앞으로 숙임
var TF_SPR_IMG = {};   // 키 → { f, b, s: Image, ok }
var TF_SPR_NF = 8;     // 걸음 프레임 수(다리 한 바퀴)
var TF_SPR_ON = false;   // v1.3: 사용자 결정(11-14 22:43) 제미나이 원화 대신 코드 그림을 다듬어 씀. 원화 엔진과 자료(tf_sprites.js)는 남겨 둠
function tfSprInit() {
  if (!TF_SPR_ON || typeof TF_SPR_DATA === 'undefined') return;
  Object.keys(TF_SPR_DATA).forEach(function (k) {
    var D = TF_SPR_DATA[k], o = { ok: 0, n: 0 }; TF_SPR_IMG[k] = o;
    ['f', 'b', 's'].forEach(function (v) {
      if (!D[v]) return; o.n++;
      var im = new Image(); o[v] = im;
      im.onload = function () { if (++o.ok === o.n) tfSprReady(k); };
      im.src = D[v];
    });
  });
}
// 그림이 다 풀리면 코드 그림으로 만들어 둔 프레임과 아이콘을 지워 다음 그리기부터 원화로
function tfSprReady(k) {
  for (var key in EN_SPR) if (key.indexOf(k + ':') === 0) delete EN_SPR[key];
  if (typeof EN_ICON !== 'undefined') for (var ik in EN_ICON) if (ik.indexOf(k) === 0 && /^\d+$/.test(ik.slice(k.length))) delete EN_ICON[ik];
}
function tfSprHas(k) { var o = TF_SPR_IMG[k]; return !!(o && o.n && o.ok === o.n); }
// v1.2.1 다리 움직임: 한 장 그림에서 다리를 찾아 따로 움직임(사용자 지적 "발이 움직여야지 캐릭터만 미끄러져 오면 어쩌냐")
//   발 띠(맨 아래 7%)의 불투명 세로줄 덩어리 = 발. 발 사이 틈이 위로 막히는 줄 = 가랑이 → 그보다 조금 위가 엉덩이 줄(hip)
//   엉덩이 아래 다리 띠만 줄 단위로 옮겨 그림: 옆모습은 앞뒤로 휘두르고(엉덩이 축 기울이기) 앞으로 나가는 발을 들고,
//   앞뒤 모습은 발을 번갈아 들어 올림. 몸통은 다리가 엇갈릴 때 위로 살짝 뜸(디딘 발은 땅에 붙어 있음). 다리 아닌 아래쪽(무기, 옷자락)은 몸통과 같이
function tfSprRig(c0, w, h, mo) {
  if (mo === 'drive' || mo === 'fly') return null;
  var d; try { d = cx2(c0).getImageData(0, 0, w, h).data; } catch (er) { return null; }
  function A(x, y) { return d[(y * w + x) * 4 + 3]; }
  var yb = h - 1, x, y, i;
  for (; yb > h * 0.5; yb--) { var any = 0; for (x = 0; x < w; x++) if (A(x, yb) > 128) { any = 1; break; } if (any) break; }
  var band = Math.max(2, Math.round(h * 0.07)), col = [];
  for (x = 0; x < w; x++) { var on = 0; for (y = Math.max(0, yb - band); y <= yb; y++) if (A(x, y) > 128) { on = 1; break; } col.push(on); }
  var runs = [], r0 = -1;
  for (x = 0; x <= w; x++) { var o2 = x < w && col[x]; if (o2 && r0 < 0) r0 = x; if (!o2 && r0 >= 0) { runs.push([r0, x - 1]); r0 = -1; } }
  var mg = [];
  runs.forEach(function (r) { var p = mg[mg.length - 1]; if (p && r[0] - p[1] < w * 0.015) p[1] = r[1]; else mg.push(r.slice()); });
  mg = mg.filter(function (r) { return r[1] - r[0] >= w * 0.06; });   // 창 자루, 곤봉 끝 같은 가는 것은 발이 아님
  while (mg.length > 4) { var bi = 0, bg = 1e9; for (i = 0; i < mg.length - 1; i++) { var gp = mg[i + 1][0] - mg[i][1]; if (gp < bg) { bg = gp; bi = i; } } mg[bi][1] = mg[bi + 1][1]; mg.splice(bi + 1, 1); }
  if (!mg.length) return null;
  var joined = 0;
  if (mg.length === 1) { var r1 = mg[0]; if (r1[1] - r1[0] < w * 0.12) return null; var mid = (r1[0] + r1[1]) >> 1; mg = [[r1[0], mid], [mid + 1, r1[1]]]; joined = 1; }
  var crotch = -1;
  if (!joined) for (y = yb - band; y > yb - h * 0.6 && y > 0; y--) {
    var fl = 0, tot = 0;
    for (i = 0; i < mg.length - 1; i++) for (x = mg[i][1] + 1; x < mg[i + 1][0]; x++) { tot++; if (A(x, y) > 128) fl++; }
    if (tot && fl / tot > 0.7) { crotch = y; break; }
  }
  var hip = crotch > 0 ? crotch - h * 0.09 : yb - h * (mo === 'crawl' ? 0.3 : 0.42);
  hip = Math.round(Math.max(yb - h * 0.55, Math.min(yb - h * 0.2, hip)));
  var mgn = w * 0.05, legs = [];
  mg.forEach(function (r, k) {
    var a = r[0] - mgn, b = r[1] + mgn;
    if (k > 0) a = Math.max(a, (mg[k - 1][1] + r[0]) / 2);
    if (k < mg.length - 1) b = Math.min(b, (r[1] + mg[k + 1][0]) / 2);
    legs.push({ x0: Math.max(0, Math.floor(a)), x1: Math.min(w, Math.ceil(b)), ph: mo === 'crawl' ? k * 2.1 : (k % 2) * Math.PI });
  });
  return { yb: yb + 1, hip: hip, legs: legs };
}
// 한 방향 모습의 움직임 프레임 n장 + 맞을 때 흰 실루엣. mo(움직임): walk 걷기, heavy 큰 짐승과 거인(보폭 작고 무겁게),
//   drive 탈것(흔들지 않고 엔진 떨림), crawl 기어감(촉수, 다리 여럿을 엇갈려 꿈틀), fly 날기(위아래로 둥실)
function tfSprBake(im, H, fxr, side, n, mo) {
  var sc = H / im.height, w = Math.ceil(im.width * sc), h = Math.ceil(H), fr = [], wh = [];
  var ax = fxr * w;   // 발 중심
  var c0 = mkC(w, h), x0 = cx2(c0); x0.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in x0) x0.imageSmoothingQuality = 'high';
  x0.drawImage(im, 0, 0, w, h);
  var rig = tfSprRig(c0, w, h, mo), mx = Math.ceil(h * 0.22), my = Math.ceil(h * 0.1);
  var pad = Math.max(Math.ceil(H * 0.16), mx + 2);
  var K = mo === 'heavy' ? { sw: 0.32, up: 0.22, fup: 0.26, bob: 0.06, sway: 0.025 } : mo === 'crawl' ? { sw: 0.18, up: 0.14, fup: 0.16, bob: 0, sway: 0.015 } : { sw: 0.46, up: 0.32, fup: 0.36, bob: 0.09, sway: 0.035 };
  for (var i = 0; i < n; i++) {
    var p = i / n, a = p * Math.PI * 2, s = Math.sin(a), c2 = Math.cos(a * 2), lift, rot, sx, sy, src = c0, sox = 0, soy = 0;
    if (rig) {
      // 다리를 따로 움직인 그림을 먼저 만들고, 몸 전체는 아주 조금만 흔듦
      var L = rig.yb - rig.hip, bob = K.bob * L * Math.abs(Math.cos(a)), cd = mkC(w + mx * 2, h + my), xd = cx2(cd);
      var bdx = side ? 0 : K.sway * w * Math.sin(a);   // 앞뒤 모습: 디딘 발 쪽으로 몸이 쏠림(뒤뚱)
      xd.drawImage(c0, 0, 0, w, rig.hip, mx + bdx, my - bob, w, rig.hip);
      var xs = [0]; rig.legs.forEach(function (lg) { xs.push(lg.x0, lg.x1); }); xs.push(w);
      for (var q = 0; q < xs.length; q += 2) { var g0 = xs[q], g1 = xs[q + 1]; if (g1 - g0 > 0) xd.drawImage(c0, g0, rig.hip, g1 - g0, h - rig.hip, mx + g0 + bdx, my + rig.hip - bob, g1 - g0, h - rig.hip); }
      var order = rig.legs.slice().sort(function (u, v) { return Math.cos(a + u.ph) - Math.cos(a + v.ph); });   // 뒤로 가는(디딘) 다리 먼저, 드는 다리를 위에
      order.forEach(function (lg) {
        var ph = a + lg.ph, dxF, upF, lw = lg.x1 - lg.x0;
        if (side) { dxF = K.sw * L * Math.sin(ph); upF = K.up * L * Math.max(0, Math.cos(ph)); }
        else { dxF = 0.04 * L * Math.sin(ph) * (lg.x0 + lw / 2 < ax ? -1 : 1); upF = K.fup * L * Math.max(0, Math.sin(ph)); }
        for (var yy = rig.hip; yy < rig.yb; yy++) {
          var t = (yy - rig.hip + 0.5) / L, dy = rig.hip - bob + (yy - rig.hip) * (L + bob) / L - upF * t * t, rh = (L + bob) / L - 2 * upF * t / L;
          xd.drawImage(c0, lg.x0, yy, lw, 1, mx + lg.x0 + dxF * t + bdx * (1 - t), my + dy, lw, Math.max(0.5, rh) + 0.6);
        }
      });
      src = cd; sox = mx; soy = my;
      lift = 0; sx = 1 + 0.012 * c2; sy = 1 - 0.015 * c2;
      rot = mo === 'crawl' ? 0.02 * s : side ? (mo === 'heavy' ? 0.035 : 0.06) + 0.02 * Math.sin(a * 2) : 0.035 * s;
    }
    else if (mo === 'drive') { lift = Math.abs(Math.sin(a * 2)) * H * 0.008; rot = side ? 0.012 * s : 0; sx = 1; sy = 1 - 0.006 * c2; }
    else if (mo === 'crawl') { lift = 0; rot = side ? 0.02 * s : 0.025 * s; sx = 1 + (side ? 0.05 : 0.025) * s; sy = 1 - (side ? 0.035 : 0.02) * s; }
    else if (mo === 'fly') { lift = (0.5 + 0.5 * s) * H * 0.04; rot = side ? 0.05 + 0.02 * s : 0.03 * s; sx = 1; sy = 1; }
    else if (mo === 'heavy') { lift = Math.abs(Math.sin(a)) * H * 0.02; rot = side ? 0.04 + 0.02 * s : 0.035 * s; sx = 1 + 0.02 * c2; sy = 1 - 0.025 * c2; }
    else { lift = Math.abs(Math.sin(a)) * H * 0.035; rot = side ? 0.07 + 0.035 * s : 0.06 * s; sx = 1 + 0.025 * c2; sy = 1 - 0.035 * c2; }
    var cw = w + pad * 2, chh = h + pad * 2, c = mkC(cw, chh), x = cx2(c);
    x.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in x) x.imageSmoothingQuality = 'high';
    x.translate(pad + ax, pad + h - lift); x.rotate(rot); x.scale(sx, sy);
    x.drawImage(src, -ax - sox, -h - soy);
    var cwh = mkC(cw, chh), xw = cx2(cwh); xw.drawImage(c, 0, 0); xw.globalCompositeOperation = 'source-in'; xw.fillStyle = '#ffffff'; xw.fillRect(0, 0, cw, chh);
    fr.push({ c: c, ax: pad + ax, ay: pad + h }); wh.push({ c: cwh, ax: pad + ax, ay: pad + h });
  }
  return { fr: fr, wh: wh, rig: rig };
}
// enemyFrames(k, S)가 먼저 부름. 원화가 없거나 아직 안 풀렸으면 null(코드 그림 사용)
function tfSprFrames(k, S, E) {
  var src = TF_SPR_IMG[k] ? k : (E && E.art && TF_SPR_IMG[E.art] ? E.art : null);
  if (!src || !tfSprHas(src)) return null;
  var D = TF_SPR_DATA[src], o = TF_SPR_IMG[src], vis = enVis(E), H = vis * S * (D.h || 1.2), n = TF_SPR_NF, fx = D.fx || [0.5, 0.5, 0.5], mo = D.mo || 'walk';
  var V = {};
  V.s = tfSprBake(o.s || o.f, H, o.s ? fx[2] : fx[0], 1, n, mo);
  V.f = o.f ? tfSprBake(o.f, H, fx[0], 0, n, mo) : V.s;
  V.b = o.b ? tfSprBake(o.b, H, fx[1], 0, n, mo) : V.f;
  return { fr: V.s.fr, wh: V.s.wh, n: n, h: vis * S, views: V, img: 1, icon: V.f.fr[0] };
}
// 진행 방향으로 모습 고르기. 모퉁이에서 깜빡이지 않게 한쪽이 확실히 클 때만 바꿈
function tfSprView(e, fr) {
  if (!fr.views) return null;
  var dx = e.dirx || 0, dy = e.diry || 0, v = e._vw || 's';
  if (Math.abs(dy) > 0.72) v = dy > 0 ? 'f' : 'b'; else if (Math.abs(dx) > 0.72) v = 's';
  else if (v !== 's') v = dy >= 0 ? 'f' : 'b';
  e._vw = v; return fr.views[v];
}
// 걸음 먼지: 땅에서 걷는 적이 발을 디딜 때 (적이 많거나 효과를 줄였으면 생략)
function tfStepDust(g, e, idx, n, S) {
  if (e.fly || RD.lowFx || !ruLive() || (g && g.enemies.length > 34)) return;
  var st = idx % Math.max(1, n >> 1) === 0 ? idx : -1;
  if (st < 0 || e._dIdx === st) { if (st < 0) e._dIdx = -1; return; }
  e._dIdx = st;
  var big = Math.min(2.2, e.size || 0.6), bx = e.x - (e.dirx || 0) * 0.12 * big, by = e.y - (e.diry || 0) * 0.12 * big;
  for (var i = 0; i < (big > 1.2 ? 3 : 1); i++) addP({ k: 'puff', x: bx + (Math.random() - 0.5) * 0.2 * big, y: by + (Math.random() - 0.5) * 0.08, z: 0.02, vz: 0.06, vx: -(e.dirx || 0) * 0.15, vy: -(e.diry || 0) * 0.08, life: 0.45 + 0.15 * big, size: 0.05 + 0.035 * big, col: '#c9b48e', a: 0.5 });
}
// 시험용: 적들의 옆, 앞 모습 걸음 프레임을 한 장에 늘어놓은 PNG(data URL). __td.sprSheet('caveman,eg_spear', 90)
function tfSprSheet(keys, S) {
  var rows = [], W = 0, Hs = 0;
  String(keys).split(',').forEach(function (kk) {
    var k = kk.split(':')[0], om = kk.split(':')[1], D = TF_SPR_DATA[k], m0 = D && D.mo; if (om && D) D.mo = om;
    var E = ENEMIES[k], F = E && tfSprFrames(k, S, E); if (om && D) D.mo = m0; if (!F) return;
    ['s', 'f', 'b'].forEach(function (v) { var V = F.views[v], w = 0, h = 0; V.fr.forEach(function (f) { w += f.c.width; h = Math.max(h, f.c.height); }); rows.push({ V: V, w: w, h: h, k: k, v: v }); W = Math.max(W, w); Hs += h; });
  });
  var c = mkC(W + 130, Math.max(1, Hs)), x = cx2(c); x.fillStyle = '#cdbb8f'; x.fillRect(0, 0, c.width, c.height);
  var y = 0;
  rows.forEach(function (r) {
    var xx = 130; x.fillStyle = '#000'; x.font = '14px sans-serif'; x.fillText(r.k + ' ' + r.v, 4, y + 18); x.fillText(r.V.rig ? 'legs ' + r.V.rig.legs.length + ' hip ' + r.V.rig.hip + '/' + r.V.rig.yb : 'no rig', 4, y + 36);
    r.V.fr.forEach(function (f) { x.drawImage(f.c, xx, y); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(xx, y + f.ay, f.c.width, 1); xx += f.c.width; });
    y += r.h;
  });
  return c.toDataURL('image/png');
}
tfSprInit();
