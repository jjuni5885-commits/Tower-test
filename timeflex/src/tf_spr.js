// ===== tf_spr.js : 타임플렉스 적 원화(제미나이 그림) 스프라이트 =====
// 그림 자료는 tf_sprites.js의 TF_SPR_DATA[적 키] = { f: 앞모습, b: 뒷모습, s: 옆모습(오른쪽을 봄), fx: [앞, 뒤, 옆 발 중심 x 비율], h: 몸 높이 배율, mo: 움직임(walk, heavy, drive, crawl, fly) }
//   그림 넣기: python3 tools/sprite_in.py 원본.png 적키 → src/tf_sprites.js 갱신 (배경 지우기, 세 방향 자르기, webp)
// 엔진: art_enemy.js enemyFrames가 tfSprFrames를 먼저 부르고, 그림이 있으면 방향별 걸음 프레임(views)을 돌려줌
//   render.js drawEnemy가 tfSprView(e, fr)로 진행 방향에 맞는 모습을 고름: 아래로 오면 앞, 위로 가면 뒤, 옆이면 옆(왼쪽은 뒤집기)
// 한 장 그림에 걸음 느낌을 줌: 발 기준으로 좌우 흔들기, 걸음마다 튀어 오름, 눌림, 옆모습은 앞으로 숙임
var TF_SPR_IMG = {};   // 키 → { f, b, s: Image, ok }
var TF_SPR_NF = 6;     // 걸음 프레임 수
function tfSprInit() {
  if (typeof TF_SPR_DATA === 'undefined') return;
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
// 한 방향 모습의 움직임 프레임 n장 + 맞을 때 흰 실루엣. mo(움직임): walk 걷기(좌우 뒤뚱, 걸음마다 튐, 옆은 앞으로 숙임),
//   heavy 큰 짐승(느리고 무거운 흔들림), drive 탈것(흔들지 않고 엔진 떨림), crawl 기어감(앞뒤로 늘었다 줄었다), fly 날기(위아래로 둥실)
function tfSprBake(im, H, fxr, side, n, mo) {
  var sc = H / im.height, w = Math.ceil(im.width * sc), h = Math.ceil(H), pad = Math.ceil(H * 0.16), fr = [], wh = [];
  var ax = fxr * w;   // 발 중심
  for (var i = 0; i < n; i++) {
    var p = i / n, a = p * Math.PI * 2, s = Math.sin(a), c2 = Math.cos(a * 2), lift, rot, sx, sy;
    if (mo === 'drive') { lift = Math.abs(Math.sin(a * 2)) * H * 0.008; rot = side ? 0.012 * s : 0; sx = 1; sy = 1 - 0.006 * c2; }
    else if (mo === 'crawl') { lift = 0; rot = side ? 0.02 * s : 0.025 * s; sx = 1 + (side ? 0.05 : 0.025) * s; sy = 1 - (side ? 0.035 : 0.02) * s; }
    else if (mo === 'fly') { lift = (0.5 + 0.5 * s) * H * 0.04; rot = side ? 0.05 + 0.02 * s : 0.03 * s; sx = 1; sy = 1; }
    else if (mo === 'heavy') { lift = Math.abs(Math.sin(a)) * H * 0.02; rot = side ? 0.04 + 0.02 * s : 0.035 * s; sx = 1 + 0.02 * c2; sy = 1 - 0.025 * c2; }
    else { lift = Math.abs(Math.sin(a)) * H * 0.035; rot = side ? 0.07 + 0.035 * s : 0.06 * s; sx = 1 + 0.025 * c2; sy = 1 - 0.035 * c2; }
    var cw = w + pad * 2, chh = h + pad * 2, c = mkC(cw, chh), x = cx2(c);
    x.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in x) x.imageSmoothingQuality = 'high';
    x.translate(pad + ax, pad + h - lift); x.rotate(rot); x.scale(sx, sy);
    x.drawImage(im, -ax, -h, w, h);
    var cwh = mkC(cw, chh), xw = cx2(cwh); xw.drawImage(c, 0, 0); xw.globalCompositeOperation = 'source-in'; xw.fillStyle = '#ffffff'; xw.fillRect(0, 0, cw, chh);
    fr.push({ c: c, ax: pad + ax, ay: pad + h }); wh.push({ c: cwh, ax: pad + ax, ay: pad + h });
  }
  return { fr: fr, wh: wh };
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
tfSprInit();
