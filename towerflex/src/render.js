// ===== render.js : 한 장면 그리기, 사건 처리(효과, 소리) =====
var PTT = null, PTL = 0;
function PT(name) { if (!PTT) return; RD.x.getImageData(0, 0, 1, 1); var n = performance.now(); if (PTL) { PTT[PTT.cur] = (PTT[PTT.cur] || 0) + n - PTL; } PTT.cur = name; PTL = n; }
var RD = { cv: null, x: null, view: null, bg: null, bgKey: '', time: 0, shake: 0, shx: 0, shy: 0, decals: [], flash: 0, flashCol: '#ffffff', redPulse: 0, rifts: [], lowFx: 0 };
var UIS = { sel: null, aim: null, aimX: 0, aimY: 0, preview: null, gridHint: 0 };
function rdLayout(g, topPx, botPx) {
  var cv = RD.cv, dpr = Math.min(RD.dprCap || 2, window.devicePixelRatio || 1), W = cv.clientWidth || window.innerWidth, H = cv.clientHeight || window.innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  if (RD.fxc) { RD.fxc.width = cv.width; RD.fxc.height = cv.height; RD.ctg = null; }
  // 칸 크기: 위 막대와 아래 막대 사이에 판(g.cols x g.rows, 기본 10 x 17)이 꽉 차게
  var gc = (g && g.cols) || COLS, gr = (g && g.rows) || ROWS; RD.cols = gc; RD.rows = gr;
  var avH = Math.max(200, H - topPx - botPx), s = Math.min(W / gc, avH / gr);
  RD.view = { W: cv.width, H: cv.height, S: s * dpr, ox: (W - s * gc) / 2 * dpr, oy: (topPx + (avH - s * gr) / 2) * dpr, dpr: dpr, css: s, top: topPx, bot: botPx };
  RD.view.oyBase = RD.view.oy; RD.cam = RD.camT = 0;   // v2.3: 쟁반이 고른 칸을 가리면 지도를 살짝 올림(RD.camT, css px)
  RD.bgKey = '';
  if (g) rdPrepare(g);
}
// 이 지역에 나올 적 그림을 전투 초반 한 프레임에 한 종류씩 미리 만들어 둠 (처음 나올 때 끊김 방지)
function warmList(g) {
  var M = g.M, list = [], add = function (k) { if (!k || list.indexOf(k) >= 0 || !ENEMIES[k]) return; list.push(k); var E = ENEMIES[k]; if (E.split) add(E.split[0]); if (E.carry) E.carry.forEach(function (c) { add(c[0]); }); if (E.brood) add(E.brood.type); if (E.summon) add(E.summon.type); };
  (M.pool || []).forEach(add); add(M.boss);
  if (g.D && g.D.endless) Object.keys(ENEMIES).forEach(function (k) { if (!ENEMIES[k].boss) add(k); });
  return list;
}
function rdPrepare(g) {
  RD.warm = warmList(g); RD.cols = g.cols; RD.rows = g.rows;
  var v = RD.view, key = g.M.id + ':' + v.W + 'x' + v.H + ':' + Math.round(v.S);
  if (RD.bgKey === key) return;
  RD.bgKey = key;
  RD.bg = renderBackground(g, v);
  RD.decals = [];
  // 격자 안 소품(장애물, 바위 칸) 스프라이트
  var th = g.M.theme, T = THEME[th];
  g.obs.forEach(function (o) {
    var k = o.chest ? 'chest' : o.ch === 'C' ? T.C : o.ch === 'a' ? T.a : o.ch === 'b' ? T.b : o.ch === 'c' ? T.c : (o.ch === 'e' || o.ch === 'g' || o.ch === 'h') ? T.b : T.c;
    if (th === 'meadow' && o.ch === 'a' && (o.c + o.r) % 3 === 0) k = 'stump';
    o.spr = propSpr(k, th, v.S, (o.c * 7 + o.r * 3) % 6);
  });
  RD.rocks = [];
  for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) if (g.kind[r * g.cols + c] === 'rock') RD.rocks.push({ x: c + 0.5 + ((c * 7 + r * 3) % 5 - 2) * 0.05, y: r + 0.8, spr: propSpr(th === 'snow' ? 'rock' : th === 'canyon' ? 'sandrock' : th === 'dark' ? 'spike' : th === 'volcano' ? 'basalt' : 'bigrock', th, v.S * (th === 'canyon' ? 1.0 : 0.6), (c * 3 + r * 5) % 6) });
PT('rifts');
  // 적이 나오는 곳
  RD.rifts = g.paths.map(function (p) { for (var i = 0; i < p.n; i++) { if (p.xs[i] >= 0 && p.xs[i] <= g.cols && p.ys[i] >= 0 && p.ys[i] <= g.rows) { var j = Math.max(0, i - 8); return { x: p.xs[j], y: p.ys[j] }; } } return { x: p.xs[0], y: p.ys[0] }; });
  RD.gate = gateSpr(v.S, th); RD.liq = null;
  initAmbient(th, FX_AMBN[T.amb] || 32);
  PARTS.length = 0; coinFlush();
  NUM_BY = {}; NUM_N = 0; FX_NSTK = 0; RD.fxCmb = null; RD.fxSlow = 0; RD.fxDim = 0; RD.fxEdge = 0; RD.fxFocT = null;
  fxWarm(v.S);
  ruPrepare(g);   // 뱃길, 항로 표시와 들머리 (render_units.js)
}
// 주변 입자 수 (지역 날씨별)
var FX_AMBN = { pollen: 26, leaves: 26, fog: 18, spores: 34, dust: 36, snow: 64, ash: 24, embers: 34, motes: 34 };
function WX(wx) { return RD.view.ox + wx * RD.view.S + RD.shx; }
function WY(wy) { return RD.view.oy + wy * RD.view.S + RD.shy; }
// 흔들기: 조금 가볍게, 짧고 또렷하게
function fxShake(v) { RD.shake = Math.max(RD.shake, v * 0.85); }

// ---------- v12 타격감 손잡이 ----------
// 캔버스에 쓰는 글자 (다국어 파일이 나중에 이 값을 바꿈). {n}은 숫자 자리. 크기는 measureText로 재서 맞춤
var FX_WORDS = {
  kill: ['뿅!', '퐁!', '뽁!', '톡!'],  // 작은 적 처치
  big: ['펑!', '쾅!', '뻥!'],  // 큰 적 처치
  boss: '해냈다!',  // 우두머리 처치
  combo: ['더블!', '트리플!', '굉장해!', '대박!', '최고야!', '전설이야!'],  // 연속 처치 2, 3, 4, 5~7, 8~11, 12 이상
  comboN: '{n}콤보'  // 연속 4 이상일 때 뒤에 붙음
};
// 설정: '화면 흔들림'을 끄면 흔들림, 딤, 화면 번쩍임도 끔. '피해 숫자'를 끄면 글자 스티커도 끔
function fxScreenOk() { return !(SAVE && SAVE.set && SAVE.set.shake === false); }
function fxWordsOn() { return !(SAVE && SAVE.set && SAVE.set.dmgNum === false); }
// 입자가 상한의 65%를 넘을 만큼 붐비면 꾸밈 효과(두 번째 무지개 고리, 튀는 별, 빛줄기, 덤 사탕)를 건너뜀 (폰에서 끊기지 않게)
function fxBusy() { return RD.lowFx || PARTS.length > MAXP * 0.65; }
// 통통 두 번 튀는 높이 (v 처음 속도, gr 중력, 칸 단위)
function fxHop(t, v, gr) { var T = 2 * v / gr; if (t < T) return v * t - gr * t * t / 2; t -= T; v *= 0.4; T = 2 * v / gr; return t < T ? v * t - gr * t * t / 2 : 0; }
// 구운 고리 하나: flat이면 땅에 눕힌 타원, 아니면 몸 앞 동그라미
function fxSRing(x, y, z, r, col, life, flat, dl) { return addP({ k: 'sring', x: x, y: y, z: z, r: r, col: col, life: life + (dl || 0), dl: dl || 0, flat: flat ? 1 : 0 }); }
// 별 고리: 별이 둥글게 퍼짐 (치명타, 마법 별 폭죽)
function fxStarRing(x, y, z, n, sp, size, cols, dl) {
  var a0 = Math.random() * 6.28;
  for (var i = 0; i < n; i++) { var a = a0 + i / n * 6.2832; addP({ k: 'star', x: x, y: y, z: z, vx: Math.cos(a) * sp * 3, vy: Math.sin(a) * sp * 3, dr: 5.5, life: 0.42 + (dl || 0), dl: dl || 0, size: size, col: cols ? cols[i % cols.length] : FX_RAIN[i % 6], rot: Math.random() * 6, vr: 6 }); }
}
// 빛줄기 몇 개 (가운데서 바깥으로)
function fxRays(x, y, z, n, len, dl) { var a0 = Math.random() * 6.28; for (var i = 0; i < n; i++) addP({ k: 'ray', x: x, y: y, z: z, ang: a0 + i / n * 6.2832 + (Math.random() - 0.5) * 0.5, len: len * (0.75 + Math.random() * 0.5), w: 0.14, off: 0.12, life: 0.26 + (dl || 0), dl: dl || 0 }); }
// 사탕 폭죽: 포장 사탕이 빙글빙글 튀어 오름
function fxCandies(x, y, z, n, sp, size, dl) {
  n = fxN(n);
  for (var i = 0; i < n; i++) { var a = Math.random() * 6.2832, v = sp * (0.5 + Math.random() * 0.7); addP({ k: 'candy', x: x, y: y, z: z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 2.2 + Math.random() * 1.8, grav: 8, dr: 1.2, life: 0.75 + Math.random() * 0.3 + (dl || 0), dl: dl || 0, size: size * (0.8 + Math.random() * 0.4), col: fxPick(FX_CANDY), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 16 }); }
}
// 젤리 출렁: 맞은 순간 눌렸다가 통통 반동 (그림만, 판정 위치는 그대로). dx, dy는 밀리는 쪽
function fxJelly(en, dx, dy, amp) {
  var now = RD.time, cur = en.jT != null ? (en.jA || 0) * Math.exp(-(now - en.jT) * 7) : 0, L = Math.hypot(dx, dy);
  en.jA = Math.min(1, Math.max(cur, amp) + cur * 0.2); en.jT = now;
  if (L > 0.001) { en.jx = dx / L; en.jy = dy / L; }
}
// 적 그림에서 보이는 몸 상자 (종류마다 한 번 잼, 새 적 그림에도 맞음)
function fxEnBox(e) {
  if (!e || !RD.view || !ENEMIES[e.k] || ruTopK(e.k)) return null;   // 위에서 본 적은 돌려 그리므로 상자를 쓰지 않음
  var fr = enemyFrames(e.k, RD.view.S); if (!fr || !fr.fr || !fr.fr[0]) return null;
  return fr.fbb || (fr.fbb = fxBodyBox(fr.fr[0]));
}
// 적 몸 가운데 높이, 꼭대기 높이 (칸)
function fxBodyZ(e) { return ruBodyZ(e); }   // 하늘 높이(e.z), 위에서 본 적, 커진 적까지 (render_units.js)
function fxTopZ(e) { return ruHeadZ(e); }
// 탑 종류별 착탄: 서리 눈꽃, 화염 꽃불
function fxFrostHit(en) {
  var z = fxBodyZ(en);
  addP({ k: 'flake', x: en.x, y: en.y, z: z, size: 0.13 + Math.min(0.08, EH(en) * 0.03), col: '#62b8ff', life: 0.38, rot: Math.random() * 6, vr: 3 });
  fxTwinkles(en.x, en.y, z, 2, ['#bfe6ff', '#ffffff', '#9fd4ff'], 1.4, 0.05, 0.3);
}
function fxFlameHit(en) {
  var z = fxBodyZ(en);
  addP({ k: 'flower', x: en.x + (Math.random() - 0.5) * 0.2, y: en.y, z: z, size: 0.15, col: fxPick(['#ff9a5a', '#ff6fa8', '#ffb34a']), life: 0.42, rot: Math.random() * 6, vr: 4 });
  burst(en.x, en.y, 3, '#ff9a5a', 1.6, 0.35, 0.06, { k: 'flame', z: z, vz: 0.6, cols: ['#ff9a5a', '#ff6fa8', '#ffd23a'] });
}
// 처치 의성어 스티커 (적 크기에 비례, 살짝 기울어짐)
// 몸 왼쪽(금화 +N 글자는 오른쪽, 금화는 머리 위로 튐)에 몸 높이로 띄움
function fxKillWord(e, vh, z, bigK, dl) {
  if (!fxWordsOn() || FX_NSTK >= (RD.lowFx ? 2 : 5)) return;
  var S = RD.view.S, w = fxPick(bigK ? FX_WORDS.big : FX_WORDS.kill), fs = Math.round(S * clamp(0.36 + vh * 0.1, 0.4, 0.68));
  FX_NSTK++;
  addP({ k: 'stk', img: fxSticker(w, fs, bigK ? 'lemon' : fxPick(['pink', 'sky', 'mint', 'lav', 'peach']), S * 2.2), x: Math.max(0.6, e.x - 0.28 - vh * 0.12), y: e.y, z: z, rot: -0.12 - Math.random() * 0.16, life: (bigK ? 0.95 : 0.78) + dl, dl: dl, rise: 0.3 });
}
// 1초(게임 시간) 안에 잇달아 처치하면 콤보 글자. 새 글자가 뜨면 앞 글자는 빨리 사라짐
function fxCombo(g, e, z) {
  var C = RD.fxCmb || (RD.fxCmb = { n: 0, t: -9, p: null }), now = g ? g.t : RD.time;
  C.n = now - C.t <= 1 ? C.n + 1 : 1; C.t = now;
  if (C.n < 2) return C.n;
  if (typeof SFX !== 'undefined') SFX.play('combo', 0.34, 1 + Math.min(0.75, (C.n - 2) * 0.075));
  if (!fxWordsOn()) return C.n;
  var W = FX_WORDS.combo, n = C.n, i = n <= 2 ? 0 : n === 3 ? 1 : n === 4 ? 2 : n <= 7 ? 3 : n <= 11 ? 4 : 5, txt = W[Math.min(i, W.length - 1)] + (n >= 4 ? ' ' + String(FX_WORDS.comboN).replace('{n}', n) : '');
  if (C.p && !C.p.dead) C.p.out = C.p.t;
  var S = RD.view.S; FX_NSTK++;
  C.p = addP({ k: 'stk', img: fxSticker(txt, Math.round(S * (0.4 + Math.min(0.14, n * 0.01))), 'rain', S * 3.6), x: clamp(e.x, 1.4, RD.cols - 1.4), y: e.y, z: Math.min(z + 0.75, Math.max(0.2, e.y - 1.0)), rot: (Math.random() - 0.5) * 0.16, life: 1.05, rise: 0.4 }); // 위 막대에 가리지 않게
  return n;
}
// 화면 가득 색종이 (우두머리 처치): 하늘에서 팔랑팔랑
function fxConfettiRain(n) {
  for (var i = 0; i < n; i++) { var st = i % 4 === 0, ht = i % 9 === 4, dl = Math.random() * 0.6; addP({ k: st ? 'star' : ht ? 'candy' : 'conf', x: Math.random() * RD.cols, y: Math.random() * (RD.rows + 1) - 0.5, z: 3.5 + Math.random() * 5.5, vx: (Math.random() - 0.5) * 0.7, vy: 0, vz: -0.4 - Math.random() * 0.8, grav: 1.6, dr: 0.6, life: 2.5 + Math.random() * 0.9 + dl, dl: dl, size: st ? 0.12 + Math.random() * 0.05 : ht ? 0.11 : 0.09 + Math.random() * 0.04, col: fxPick(FX_CANDY), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8, fl: 7 + Math.random() * 8, ph: Math.random() * 6 }); }
}
// 우두머리가 크게 맞으면 화면 가장자리가 반짝 (0.6초에 한 번까지)
function fxBossHit(en, a) {
  if (a < en.mhp * 0.012 || RD.time - (RD.fxEdgeT == null ? -9 : RD.fxEdgeT) < 0.6) return;
  RD.fxEdgeT = RD.time; if (fxScreenOk()) RD.fxEdge = 1;
  for (var i = 0, n = RD.lowFx ? 2 : 4; i < n; i++) { var sd = (Math.random() * 4) | 0, ex = sd === 0 ? 0.25 : sd === 1 ? RD.cols - 0.25 : Math.random() * RD.cols, ey = sd === 2 ? 0.3 : sd === 3 ? RD.rows - 0.3 : Math.random() * RD.rows; addP({ k: 'twk', x: ex, y: ey, z: 0, size: 0.14 + Math.random() * 0.08, col: fxPick(['#fff2a8', '#ffffff', '#ffd6ea']), life: 0.5, rot: 0, vr: 2 }); }
}
// 최후의 화살: 화살 머리가 지나는 때에 맞춰 꿰뚫린 적마다 별 고리와 빛줄기, 길 따라 무지개 별
function fxLastPierce(e) {
  var dx = e.x1 - e.x0, dy = e.y1 - e.y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, hit = RD.fxTrue || [], i;
  var tAt = function (f) { return (1 - Math.cbrt(Math.max(0, 1 - clamp(f, 0, 1)))) * 0.33; };
  for (i = 0; i < hit.length && i < 12; i++) {
    var en = hit[i], tt = clamp((en.x - e.x0) * ux + (en.y - e.y0) * uy, 0, L), dl = tAt(tt / L), z = fxBodyZ(en);
    fxPop(en.x, en.y, z, 0.55, '#ffe066', 0.14, dl); fxStarRing(en.x, en.y, z, fxN(7), 0.85, 0.09, FX_RAIN, dl);
    if (!RD.lowFx) fxRays(en.x, en.y, z, 4, 1.0, dl);
  }
  var m = Math.min(16, Math.floor(L / 0.9));
  for (i = 1; i <= m; i++) { var f = i / (m + 1); fxStar1(e.x0 + dx * f, e.y0 + dy * f, 0.5, 0.12, FX_RAIN[i % 6], 0.5, tAt(f)); }
}

// ---------- 사건 → 효과, 소리 ----------
function rdEvents(g) {
  var evs = g.ev; g.ev = [];
  RD.fxSk = fxSkinP(); RD.fxTrue = null;
  // 한 번에 너무 많이 밀린 사건(시험용 빨리 돌리기)은 오래된 것의 효과를 건너뛰고 화면 쪽 처리만
  var old = evs.length - 240;
  for (var i = 0; i < evs.length; i++) {
    var e = evs[i], t = e.t, q;
    if (i < old) { if (typeof uiEvent === 'function') uiEvent(g, e); continue; }
    if (typeof SND_EV !== 'undefined' && SND_EV[t]) SND_EV[t](g, e);   // 소리 고리 (audio2.js)
    // 등록 고리: FX_EV[사건 이름](g, ev). 새 사건(transform, blast, tracer...)은 여기서 받고, true를 돌려주면 아래 기존 처리를 건너뜀
    if (FX_EV[t] && FX_EV[t](g, e) === true) { if (typeof uiEvent === 'function') uiEvent(g, e); continue; }
    if (t === 'shoot') {
      if (e.k === 'archer') {
        var ast = arrowSt(e.tw), mo = e.tw ? mountOf(e.tw, RD.view.S) : { xs: 0, zs: 0.95 };
        addP({ k: 'twk', x: e.x + mo.xs, y: e.y, z: mo.zs, size: 0.1 + ast.len * 0.1, col: ast.sc, life: 0.16, rot: 0, vr: 4 });
        if (ast.spr === 'arrowS') { sfx('snipe', 0.38); sfx('bow', 0.25); } else if (e.n > 1) sfx('bowS', 0.3); else sfx('bow', 0.2 + (e.lvl || 1) * 0.04);
      } else {
        var sl = e.lvl || 1, mo2 = e.tw ? mountOf(e.tw, RD.view.S) : { xs: 0, zs: 0.6 };
        if (e.k === 'catapult') { sfx('creak', 0.5); smoke(e.x, e.y + 0.3, 1 + sl, '#fff6ee', 0.26, 0.5, 0.15); }
        else if (e.k === 'ballista') { sfx('thunk', 0.42 + sl * 0.03); addP({ k: 'twk', x: e.x, y: e.y, z: mo2.zs, size: 0.15 + sl * 0.04, col: '#ffe066', life: 0.16, rot: 0, vr: 4 }); }
        else if (e.k === 'arcane') { sfx('magic', 0.3); addP({ k: 'twk', x: e.x, y: e.y, z: mo2.zs + 0.1, size: 0.17 + sl * 0.05, col: '#c8b0ff', life: 0.2, rot: 0, vr: 4 }); }
        else if (e.k === 'alchemy') sfx('toss', 0.35);
        else if (e.k === 'cannon') {
          sfx('cannon', 0.4 + sl * 0.03); var mx = e.x + Math.cos(e.aim) * 0.45, my = e.y - 0.45 + Math.sin(e.aim) * 0.35;
          fxPop(mx, my + 0.3, 0.3, 0.13 + sl * 0.04, '#ffe066', 0.1); smoke(mx, my + 0.4, 2 + sl, '#fff6ee', 0.24, 0.5, 0.4);
          fxTwinkles(mx, my + 0.3, 0.3, 2, FX_CANDY, 1.4, 0.06, 0.25); fxShake(0.01 * sl);
        }
      }
    } else if (t === 'hit') {
      var en = e.en, hz = en ? fxBodyZ(en) : 0.35, hx = en ? en.x : e.x, hy = en ? en.y : e.y + 0.4, bolt = e.k === 'bolt', hst = bolt ? null : arrowSt(e.tw), lvh = e.tw ? e.tw.lvl : 1, hsk = RD.fxSk;
      var ssz = bolt ? 0.4 + lvh * 0.06 : hst.star, hcol = hsk === 'heart' ? '#ff5d9e' : hsk === 'candy' ? fxPick(FX_CANDY) : bolt ? '#ffd23a' : hst.sc;
      if (en && e.tw) fxJelly(en, en.x - e.tw.x, en.y - e.tw.y, bolt ? 0.9 : 0.6);
      // 탁! 흰 충격 → 작은 충격파 고리 → 하트(화살)나 별(노포) → 반짝이, 튀는 별
      fxPop(hx, hy, hz, ssz * 0.62, hcol, 0.1);
      var hbz = fxBusy(); if (!hbz || bolt) fxSRing(hx, hy, hz, 0.2 + ssz * 0.34, hcol, 0.2, 0);
      if (bolt) fxStar1(hx, hy, hz, ssz * 0.45, hsk === 'base' ? '#ff8fc0' : hcol, 0.28);
      else addP({ k: 'hpop', x: hx, y: hy, z: hz + 0.04, size: ssz * 0.4, col: hsk === 'base' ? hst.sc : hsk === 'heart' ? '#ff3d7f' : '#ff5d9e', life: 0.32, rot: (Math.random() - 0.5) * 0.5 });
      fxTwinkles(hx, hy, hz, bolt ? 2 + lvh : 1 + (lvh >> 1), bolt ? FX_CANDY : hst.tc2, bolt ? 2.6 : 2.0, 0.05 + ssz * 0.06, 0.3);
      if (!hbz) fxStars(hx, hy, hz, 1, hsk === 'heart' ? ['#ff8fc0', '#ff5d9e'] : FX_CANDY, 1.3, 0.05 + ssz * 0.05, 0.45);
      if (hst && hst.ring) ringFx(hx, hy, 0.5, hst.ring, 0.25, 0.05);
      if (hsk === 'candy' && !hbz && Math.random() < 0.35) fxCandies(hx, hy, hz, 1, 1.4, 0.07);
      else if (hsk === 'heart' && Math.random() < 0.3) fxHearts(hx, hy, hz, 1, ['#ff8fc0', '#ff5d9e', '#ffb0d0'], 0.05 + ssz * 0.04, 0.55);
      sfx('pok', 0.28); sfx(bolt ? 'hitBig' : 'hit', bolt ? 0.28 : 0.22);
      if (en && en.armor >= 0.4) sfx('clash', 0.14);
    } else if (t === 'crit') {
      var cn = e.en, cz = cn ? fxBodyZ(cn) + 0.05 : 0.4;
      if (cn && e.tw) fxJelly(cn, cn.x - e.tw.x, cn.y - e.tw.y, 1);
      // 무지개 반짝 폭발: 큰 별, 별 고리, 빛줄기, 고리, 짧은 히트스톱과 아주 짧은 흰빛
      fxPop(e.x, e.y, cz, 0.6, '#ffe066', 0.13);
      fxStar1(e.x, e.y, cz, 0.38, '#ffe066', 0.36);
      fxStarRing(e.x, e.y, cz, fxN(8), 0.95, 0.1);
      if (!fxBusy()) fxRays(e.x, e.y, cz, 5, 0.95);
      fxSRing(e.x, e.y, cz, 0.62, '#ff8fc0', 0.3, 0); fxTwinkles(e.x, e.y, cz, 4, FX_RAIN, 3, 0.08, 0.35);
      sfx('crit', 0.5); sfx('hitBig', 0.34); fxShake(0.035);
      if (!(RD.hitStopCd > 0)) { RD.hitStop = Math.max(RD.hitStop || 0, 0.045); RD.hitStopCd = 0.4; }
      if (fxScreenOk() && !(RD.fxFlCd > 0)) { RD.flash = Math.max(RD.flash, 0.1); RD.flashCol = '#ffffff'; RD.fxFlCd = 0.35; }
      var np = cn && NUM_BY[cn.id]; if (np) { np.crit = 1; np.pop = 1.4; np.ct = np.t; np.life = Math.max(np.life, np.t + 1.0); }
    } else if (t === 'dmg') { dmgFx(e); }
    else if (t === 'miss') { RD.decals.push({ k: 'arrow', x: e.x, y: e.y, a: e.ang, t: 0, life: 4 }); }
    else if (t === 'boom') {
      var big = e.big, fire = e.fire, bl = e.lvl || 1, er = e.r;
      var pcs = fire ? ['#ffd2b8', '#fff0c0', '#ffc6dc', '#fff6ee'] : ['#ffffff', '#fff6ee', '#ffe6f2', '#eee8ff'];
      // 만화 같은 펑: 흰 충격, 솜구름, 튀는 별, 통통 고리 (검은 연기, 그을음 없음)
      fxPop(e.x, e.y, 0.25, er * (big ? 0.72 : 0.58), fire ? '#ffb38a' : '#ffe066', 0.13);
      fxPuffs(e.x, e.y, 0.2, (big ? 9 : 6) + bl, pcs, er * 2.2, 0.17 + er * 0.11, 0.5);
      fxStars(e.x, e.y, 0.3, 2 + bl + (big ? 3 : 0), fire ? ['#ffe066', '#ffb38a', '#ff8fc0'] : FX_CANDY, er * 1.7, 0.09 + bl * 0.01, 0.7);
      ringFx(e.x, e.y, er, fire ? '#ff9a6a' : '#ffd23a', 0.38, 0.06);
      if (bl >= 3 || big) ringFx(e.x, e.y, er * 1.3, '#ffffff', 0.3, 0.035, 0.05);
      if (fire) burst(e.x, e.y, 4 + bl, '#ff9a5a', 2.2, 0.45, 0.1, { k: 'flame', z: 0.1, vz: 0.8, cols: ['#ff9a5a', '#ff6fa8', '#ffb34a'] });
      if (big) fxConfetti(e.x, e.y, 0.3, 8, 2.4, 0.055, 1.0);
      // 사탕 폭죽 (대포, 투석): 포장 사탕이 빙글빙글 튐 + 주변 적이 바깥으로 출렁
      fxCandies(e.x, e.y, 0.3, ((big ? 5 : 3) + (bl >> 1)) >> (fxBusy() ? 1 : 0), 1.4 + er * 1.6, 0.085 + bl * 0.008);
      for (q = 0; q < g.enemies.length; q++) { var be = g.enemies[q], bd = er + 0.4; if (!be.dead && Math.abs(be.x - e.x) < bd && Math.abs(be.y - e.y) < bd) fxJelly(be, be.x - e.x, be.y - e.y, 1); }
      if (big || bl >= 4) RD.decals.push({ k: 'mark', x: e.x, y: e.y, r: er * 0.62, t: 0, life: 1.6, col: fire ? '#ffb38a' : '#ffc6e0' });
      fxShake(big ? 0.1 : 0.04);
      sfx(e.k === 'shell' ? (big ? 'boomBig' : 'boomS') : fire ? 'boomFire' : 'boom', e.k === 'shell' ? 0.45 : 0.4);
    } else if (t === 'splat') {
      var spl = e.lvl || 1, scol = e.br === 1 && spl >= 4 ? '#a58aff' : spl >= 4 ? '#ffe066' : '#9be86a';
      fxPop(e.x, e.y, 0.15, 0.26 + spl * 0.03, scol, 0.12);
      burst(e.x, e.y, 5 + spl * 2, scol, 1.6 + spl * 0.2, 0.6, 0.065, { k: 'drop', z: 0.15, vz: 2.2, grav: 8 });
      burst(e.x, e.y, 2 + spl, scol, 0.7, 0.8, 0.05, { k: 'bubble', z: 0.05, vz: 0.5, cols: [scol, lit(scol, 0.4)] });
      fxPuffs(e.x, e.y, 0.15, 3 + (spl >= 4 ? 2 : 0), [lit(scol, 0.55), lit(scol, 0.75), '#ffffff'], 1.4, 0.13 + spl * 0.012, 0.45);
      ringFx(e.x, e.y, (e.r || 0.6) * 0.9, scol, 0.4, 0.05); sfx('glass', 0.35);
    }
    else if (t === 'orbHit') {
      // 마법 별 폭죽: 별이 둥글게 퍼지고 반짝이
      var ol = e.lvl || 1, osk = RD.fxSk, ocs = osk === 'heart' ? ['#ff5d9e', '#ff8fc0', '#ffe066'] : osk === 'candy' ? FX_CANDY : ['#a98bff', '#ff8fc0', '#62b8ff', '#ffd23a'];
      fxPop(e.x, e.y + 0.3, 0.3, 0.2 + ol * 0.05, osk === 'base' ? '#c8b0ff' : ocs[0], 0.12); fxStar1(e.x, e.y + 0.3, 0.3, 0.14 + ol * 0.035, '#ffe066', 0.28);
      if (!fxBusy()) fxSRing(e.x, e.y + 0.3, 0.3, 0.28 + ol * 0.05, osk === 'base' ? '#a98bff' : ocs[0], 0.22, 0);
      fxStarRing(e.x, e.y + 0.3, 0.3, fxN(4 + ol), 0.42 + ol * 0.07, 0.055 + ol * 0.008, ocs);
      fxTwinkles(e.x, e.y + 0.3, 0.3, 1 + ol, ocs, 1.8, 0.06, 0.32); sfx('magicHit', 0.25 + ol * 0.03); sfx('pok', 0.16);
    }
    else if (t === 'zap') {
      addP({ k: 'zap', pts: e.pts, life: 0.2, lvl: e.lvl || 4 }); sfx('zap', 0.35);
      for (var z = 1; z < e.pts.length; z++) { fxStar1(e.pts[z][0], e.pts[z][1] + 0.3, 0.3, 0.11, z % 2 ? '#ffe066' : '#7cc8ff', 0.24); fxTwinkles(e.pts[z][0], e.pts[z][1] + 0.3, 0.3, 2, ['#bfe8ff', '#ffffff', '#ffe066'], 1.5, 0.055, 0.25); }
    }
    else if (t === 'pulse') {
      var pl = e.lvl || 1, deep = pl >= 4 && e.br === 0, snow = pl >= 4 && e.br === 1, pc = deep ? '#7cc8ff' : snow ? '#ffffff' : '#bfe6ff';
      ringFx(e.x, e.y, e.r, pc, 0.45, 0.06 + pl * 0.012); if (pl >= 3) ringFx(e.x, e.y, e.r * 0.6, '#e8f6ff', 0.35, 0.05, 0.05);
      // 눈송이가 둥글게 퍼짐
      var nf = fxN(5 + pl * 2);
      for (q = 0; q < nf; q++) { var fa = q / nf * 6.2832 + Math.random() * 0.4, fv = e.r * (1.7 + Math.random() * 0.6); addP({ k: 'flake', x: e.x, y: e.y, z: 0.3, vx: Math.cos(fa) * fv, vy: Math.sin(fa) * fv * 0.62, dr: 3.2, life: 0.55 + Math.random() * 0.2, size: 0.06 + pl * 0.008, col: deep ? '#6ab4ff' : '#9fd4ff', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 5 }); }
      if (snow) burst(e.x, e.y, 10, '#9fd4ff', e.r * 1.2, 0.9, 0.05, { k: 'flake', z: 0.7, vz: -0.25, cols: ['#9fd4ff', '#c8e8ff'] });
      // 맞은 적마다 눈꽃 (많으면 8마리까지)
      for (var fn = 0, fq = 0; fq < g.enemies.length && fn < (RD.lowFx ? 4 : 8); fq++) { var fe = g.enemies[fq], frr = e.r + (fe.size || 0.5) * 0.2; if (!fe.dead && !fe.untarget && d2(fe.x, fe.y, e.x, e.y) <= frr * frr) { fn++; fxFrostHit(fe); } }
      sfx('frost', 0.22 + pl * 0.03);
    }
    else if (t === 'ring') {
      ringFx(e.x, e.y, e.r, '#ff8a6a', 0.4, 0.12); ringFx(e.x, e.y, e.r * 0.8, '#ffe066', 0.3, 0.06, 0.04);
      var nfl = fxN(12); for (q = 0; q < nfl; q++) { var fa2 = q / nfl * 6.2832; addP({ k: 'flame', x: e.x + Math.cos(fa2) * 0.3, y: e.y + Math.sin(fa2) * 0.2, z: 0.1, vx: Math.cos(fa2) * e.r * 2.2, vy: Math.sin(fa2) * e.r * 1.4, vz: 0.5, dr: 3, life: 0.45, size: 0.11, col: q % 2 ? '#ff9a5a' : '#ff6fa8' }); }
      for (var rn = 0, rq = 0; rq < g.enemies.length && rn < (RD.lowFx ? 3 : 6); rq++) { var re = g.enemies[rq], rrr = e.r + (re.size || 0.5) * 0.2; if (!re.dead && d2(re.x, re.y, e.x, e.y) <= rrr * rrr) { rn++; fxFlameHit(re); } }
      sfx('flame', 0.4);
    }
    else if (t === 'kill') { killFx(e, g); }
    else if (t === 'split') { fxPuffs(e.x, e.y, 0.4, 7, ['#ffffff', '#f2ecff', '#ece6f4'], 2.2, 0.24, 0.5); fxStars(e.x, e.y, 0.5, 4, FX_CANDY, 2, 0.1, 0.6); sfx('rock', 0.5); }
    else if (t === 'wreck') { fxPuffs(e.x, e.y, 0.4, 9, ['#ffffff', '#fff2e6', '#ffe6d6'], 2.4, 0.26, 0.55); fxConfetti(e.x, e.y, 0.4, 14, 2.6, 0.065, 1.0, ['#ffb38a', '#ff9a6a', '#ffe066', '#ff8fc0']); sfx('wood', 0.6); fxShake(0.07); }
    else if (t === 'plague') burst(e.x, e.y, 10, '#a58aff', 1.3, 0.7, 0.05, { k: 'bubble', z: 0.2, vz: 0.6, cols: ['#a58aff', '#c8b0ff', '#ff8fc0'] });
    else if (t === 'bones') { fxPuffs(e.x, e.y, 0.3, 5, ['#ffffff', '#fff6ee'], 1.6, 0.17, 0.45); fxStars(e.x, e.y, 0.4, 3, ['#fff6e8', '#ffe066', '#b9a2ff'], 1.4, 0.08, 0.5); sfx('bones', 0.35); }
    else if (t === 'revive') { ringFx(e.x, e.y, 0.5, '#7cc8ff', 0.4, 0.05); fxTwinkles(e.x, e.y, 0.4, 5, ['#7cc8ff', '#ffffff', '#b9a2ff'], 1.2, 0.07, 0.5); sfx('revive', 0.3); }
    else if (t === 'heal') { ringFx(e.x, e.y, e.r, '#7fe0c4', 0.6, 0.05); fxHearts(e.x, e.y, 0.6, 3, ['#7fe0c4', '#ff8fc0'], 0.12, 0.9); sfx('heal', 0.25); }
    else if (t === 'ward') { ringFx(e.x, e.y, e.r, '#b9a2ff', 0.6, 0.05); fxTwinkles(e.x, e.y, 0.5, 4, ['#b9a2ff', '#ffffff'], 1, 0.07, 0.5); sfx('shield', 0.3); }
    else if (t === 'shieldBreak') { fxPop(e.x, e.y, 0.45, 0.3, '#c8b0ff', 0.12); fxStars(e.x, e.y, 0.45, 5, ['#b9a2ff', '#c8b0ff', '#ffffff', '#7cc8ff'], 2.2, 0.08, 0.5); }
    else if (t === 'roar') { ringFx(e.x, e.y, e.r, '#ff5d9e', 0.7, 0.08); ringFx(e.x, e.y, e.r * 0.7, '#ffb38a', 0.5, 0.05, 0.08); sfx('roar', 0.6); fxShake(0.08); }
    else if (t === 'brood') { fxPuffs(e.x, e.y, 0.1, 6, ['#efe6ff', '#e2d6f2', '#ffe6f2'], 1.2, 0.16, 0.5); sfx('brood', 0.4); }
    else if (t === 'nova') {
      ringFx(e.x, e.y, e.r, '#a8dcff', 0.8, 0.12); ringFx(e.x, e.y, e.r * 0.65, '#ffffff', 0.6, 0.06, 0.06);
      for (q = 0; q < fxN(16); q++) { var na = Math.random() * 6.2832, nv = e.r * (1.4 + Math.random()); addP({ k: 'flake', x: e.x, y: e.y, z: 0.4, vx: Math.cos(na) * nv, vy: Math.sin(na) * nv * 0.62, dr: 2.6, life: 0.6 + Math.random() * 0.3, size: 0.07 + Math.random() * 0.03, col: '#9fd4ff', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 5 }); }
      sfx('freeze', 0.6); fxShake(0.06);
    }
    else if (t === 'summon') { ringFx(e.x, e.y, 1, '#8a6cff', 0.7, 0.1); fxStars(e.x, e.y, 0.3, 5, ['#8a6cff', '#b9a2ff', '#ff8fc0'], 2, 0.1, 0.6); sfx('summon', 0.5); }
    else if (t === 'leak') {
      // 성이 아야: 하트가 쪼개지고 화면 가장자리가 분홍빛으로
      RD.redPulse = 1; fxShake(0.08);
      addP({ k: 'bheart', x: e.x, y: e.y - 0.3, z: 1.0, life: 1.0, size: 0.36 });
      fxTwinkles(e.x, e.y - 0.3, 1.0, 5, ['#ff8fc0', '#ffffff', '#ff5d9e'], 2.2, 0.07, 0.4, 0.36);
      fxPop(e.x, e.y - 0.3, 0.7, 0.4, '#ff8fc0', 0.14);
      sfx('gate', 0.7); vib(30);
    }
    else if (t === 'build') { ringFx(e.x, e.y + 0.1, 0.5, '#ffc6e0', 0.4, 0.06); fxPuffs(e.x, e.y + 0.1, 0.1, 6, ['#ffffff', '#fff6ee', '#ffe8f2'], 1.6, 0.17, 0.5); fxStars(e.x, e.y + 0.1, 0.3, 3, FX_CANDY, 1.4, 0.08, 0.6); sfx(e.free ? 'powerup' : 'build', 0.5); vib(12); }
    else if (t === 'upgrade') { upgradeFx(g, e); }
    else if (t === 'sell') { fxPuffs(e.x, e.y + 0.1, 0.2, 5, ['#ffffff', '#fff6ee'], 1.4, 0.16, 0.45); goldFx(e.x, e.y, 0.8, e.v, Math.min(8, 3 + Math.floor(e.v / 60)), true); sfx('sell', 0.5); }
    else if (t === 'obsDie') {
      var bo = e.w > 1;
      fxPuffs(e.x, e.y, 0.3, bo ? 12 : 7, ['#ffffff', '#fff6ee', '#eef8e6'], bo ? 3 : 2, bo ? 0.3 : 0.21, 0.6);
      fxConfetti(e.x, e.y, 0.4, bo ? 18 : 10, 2.4, 0.06, 1.0, ['#9be08a', '#7fe0c4', '#ffb38a', '#ffe066', '#ff8fc0']);
      fxStars(e.x, e.y, 0.4, bo ? 5 : 3, FX_CANDY, 2, 0.1, 0.7);
      if (e.gold) goldFx(e.x, e.y, 0.6, e.gold, e.chest ? 10 : Math.min(6, 2 + Math.floor(e.gold / 25)), true);
      sfx(e.chest ? 'chest' : 'wood', 0.55); sfx('coin', 0.5);
    }
    else if (t === 'foundTower') { flashFx(e.x, e.y - 0.6, 0.8, '#fff2b0', 0.4); ringFx(e.x, e.y, 0.9, '#ffe066', 0.8, 0.1); fxStars(e.x, e.y, 0.6, 6, FX_CANDY, 2.2, 0.12, 0.8); fxConfetti(e.x, e.y, 0.8, 14, 2.4, 0.065, 1.2); }
    else if (t === 'mint') { goldFx(e.x, e.y, 1.0, e.v, Math.min(7, 3 + Math.floor(e.v / 40)), true); sfx('coin', 0.45); }
    else if (t === 'rain') { sfx('rain', 0.6); vib(30); ringFx(e.x, e.y, 1.5, '#ffe066', 0.6, 0.06); fxShake(0.03); e.q.forEach(function (a) { addP({ k: 'rainArrow', x: a.x, y: a.y, life: a.at + 0.05, delay: a.at, ang: -1.2 + Math.random() * 0.3 }); }); }
    else if (t === 'rainHit') { fxStar1(e.x, e.y, 0.12, 0.17, fxPick(FX_CANDY), 0.24); fxTwinkles(e.x, e.y, 0.1, 3, FX_CANDY, 1.8, 0.055, 0.25); smoke(e.x, e.y, 1, '#fff6ee', 0.15, 0.4, 0.1); RD.decals.push({ k: 'arrow', x: e.x, y: e.y, a: 1.3 + Math.random() * 0.4, t: 0, life: 2.5 }); sfx('hit', 0.22); fxShake(0.015); }
    else if (t === 'wall') { smoke(e.x, e.y, 6, '#fff6ee', 0.34, 0.6, 0.2); fxStars(e.x, e.y, 0.3, 3, FX_CANDY, 1.4, 0.08, 0.6); sfx('build', 0.6); vib(22); }
    else if (t === 'wallBreak') { fxPuffs(e.x, e.y, 0.3, 6, ['#ffffff', '#fff2e6'], 1.8, 0.2, 0.5); fxConfetti(e.x, e.y, 0.3, 14, 2.2, 0.065, 1.0, ['#ff8fc0', '#fffaf2', '#ffb38a', '#ff5d9e']); sfx('wood', 0.6); }
    else if (t === 'last') {
      // 최후의 화살: 강한 흔들림 + 순간 배경 딤(어두워졌다 돌아옴) + 관통 궤적 강조 + 강한 진동
      addP({ k: 'lastArrow', x0: e.x0, y0: e.y0, x1: e.x1, y1: e.y1, life: 1.05 });
      if (fxScreenOk()) { RD.flash = 0.32; RD.flashCol = '#fff6fb'; RD.fxDim = 1; RD.fxDimT = 0; }
      fxShake(0.42); fxLastPierce(e); RD.fxTrue = null;
      sfx('bowBig', 0.8); sfx('boomBig', 0.5); sfx('lastHum', 0.4); vib([70, 40, 120]);
    }
    else if (t === 'crown') {
      RD.flash = 0.7; RD.flashCol = '#fff6fb'; sfx('crown', 1);
      fxConfetti(e.x, e.y - 1.5, 1.5, 40, 4, 0.08, 1.6); fxStars(e.x, e.y - 1.5, 1.5, 10, FX_CANDY, 3, 0.15, 1.2); fxHearts(e.x, e.y - 1.5, 1.5, 6, ['#ff8fc0', '#ff5d9e', '#ffb0d0'], 0.13, 1.4);
    }
    else if (t === 'kneel') { sfx('heartbeat', 0.8); }
    else if (t === 'early') { sfx('coin', 0.5); earlyCoins(e.v); }
    else if (t === 'wave') { sfx('horn', 0.55); }
    else if (t === 'focus') sfx(g.focus ? 'lock' : 'lockOff', g.focus ? 0.42 : 0.4);
    if (typeof uiEvent === 'function') uiEvent(g, e);
  }
}
// ---------- 타격감 효과 (귀염판) ----------
var NUM_BY = {}, NUM_N = 0;
// 피해 숫자 사탕 색 (스티커 색 이름): 물리 복숭아, 폭발 레몬, 마법 라벤더, 고정 진분홍, 치명타 무지개
var DMG_COL = { phys: 'peach', expl: 'lemon', magic: 'lav', 'true': 'hot' };
function dmgFx(e) {
  var en = e.en; if (!en || e.a < 0.5) return;
  // 뒤로 밀림 세기: 폭발과 큰 피해일수록 크게
  var kk = e.kind === 'expl' ? 0.95 : clamp(e.a / Math.max(1, en.mhp) * 4, 0.18, 0.65); en.vk = Math.max(en.vk || 0, kk);
  // 젤리 출렁 (방향은 뒤에 오는 맞음, 폭발 사건이 다시 정함)
  fxJelly(en, -(en.dirx || 0), -(en.diry || 0), e.kind === 'expl' ? 1 : en.boss ? clamp(e.a / Math.max(1, en.mhp) * 30, 0.55, 0.9) : clamp(e.a / Math.max(1, en.mhp) * 6, 0.32, 0.8));
  if (en.boss) fxBossHit(en, e.a);
  if (e.kind === 'true') (RD.fxTrue || (RD.fxTrue = [])).push(en);
  if (!fxWordsOn()) return;
  var p = NUM_BY[en.id];
  if (p && p.t < 0.28 && !p.dead) { p.v += e.a; p.t = Math.min(p.t, 0.08); p.pop = 1; return; }
  if (NUM_N > 46 && e.a < en.mhp * 0.08) return;
  p = addP({ k: 'num', x: en.x + (Math.random() - 0.5) * 0.3, y: en.y, z: fxTopZ(en) + 0.3, v: e.a, sty: DMG_COL[e.kind] || 'peach', life: 0.85, pop: 0, vx: (Math.random() - 0.5) * 0.5, id: en.id, rot0: (Math.random() - 0.5) * 0.24 });
  NUM_BY[en.id] = p; NUM_N++;
}
// 처치 때 솜구름에 살짝 섞는 적별 빛깔
var FX_POOF = { goblin: '#fff3b0', orc: '#ffd9c2', shaman: '#ffe0bf', troll: '#d4f5e6', grumsh: '#ffdcc8', skeleton: '#fff8f0', knight: '#e6dcff', stalker: '#e6d4ff', wraith: '#f4f0ff', warlock: '#d6defc', barkan: '#e6d6ff', wolf: '#d4ecff', bat: '#ffd6ea', wyvern: '#ffd0da', spider: '#fff4dc', arachne: '#eedcff', golemL: '#cff3ef', golemM: '#cff3ef', golemS: '#cff3ef', wagon: '#ffd6d0', yotun: '#dcf3ff', yotun2: '#dcf3ff', iceslime: '#d4fbf8', ember: '#ffe0c0', mirror: '#ebe6ff', bunny: '#fff8c8', guard: '#e4f8c8', twinking: '#ffe6d0' };
var EL_COL = { fire: '#ff8a3c', ice: '#7cc8ff', bolt: '#ffd23a', poison: '#8fdc4f' }; // 새 적 대표색(v1.2)
// 처치: 꾹 눌렸다가 쭉 늘어나며 펑! 솜구름, 별, 하트, 색종이 (큰 적과 우두머리는 더 크게)
function killFx(e, g) {
  var S = RD.view.S, fr = enemyFrames(e.k, S), E = ENEMIES[e.k], vh = enVis(E), cz = fxBodyZ(e), bigK = vh >= 1.6 || e.boss;
  var pl = e.boss ? 0.34 : bigK ? 0.24 : 0.18, dl = pl * 0.7, tint = mixc(FX_POOF[e.k] || '#fff0f6', '#ffffff', 0.45), pcs = ['#ffffff', '#ffffff', '#fff2f8', tint];
  // 죽는 연출 종류(ENEMIES[k].die): boom 폭발, ghost 흩어짐, ink 먹물은 render_units.js가 그리고, poof(기본)는 아래 솜구름
  var ruK = ruDie(e, g, vh, cz, bigK, dl);
  if (!ruK) {
  addP({ k: 'poof', x: e.x, y: e.y, spr: fr.fr[0], wh: fr.wh[0], face: e.face, fly: e.fly, top: ruTopK(e.k), ang: Math.atan2(e.diry || 0, e.dirx || 1), life: pl });
  // 꾹 → 펑: 흰 충격, 솜구름, 무지개 고리 두 겹, 별, 하트, 사탕, 색종이, 의성어 스티커
  fxPop(e.x, e.y, cz, 0.28 + vh * 0.2, '#ff8fc0', 0.14, dl);
  fxPuffs(e.x, e.y, cz, bigK ? 10 : 6, pcs, 1.5 + vh * 1.0, 0.16 + vh * 0.095, 0.52, dl);
  var kbz = fxBusy() && !bigK;
  fxSRing(e.x, e.y, 0.04, 0.34 + vh * 0.3, 'rainbow', 0.4, 1, dl);
  if (!kbz) fxSRing(e.x, e.y, 0.04, 0.6 + vh * 0.42, 'rainbow', 0.48, 1, dl + 0.07);
  fxStars(e.x, e.y, cz, bigK ? 6 : 3, FX_CANDY, 1.6 + vh * 0.6, 0.09 + vh * 0.02, 0.7, dl);
  fxHearts(e.x, e.y, cz + 0.1, bigK ? 3 : Math.random() < 0.5 ? 2 : 1, ['#ff8fc0', '#ff5d9e', '#ffb0d0'], 0.08 + vh * 0.02, 0.8, dl);
  fxCandies(e.x, e.y, cz, bigK ? 4 : kbz ? 1 : 2, 1.5 + vh * 0.5, 0.075 + vh * 0.012, dl);
  fxConfetti(e.x, e.y, cz, bigK ? 12 : kbz ? 3 : 5, 1.8 + vh * 0.6, 0.05 + vh * 0.01, 1.0, FX_CANDY, dl);
  }
  // 콤보가 이어지면(3 이상) 콤보 글자가 대신함 (글자가 겹쳐 지저분하지 않게)
  if (fxCombo(g, e, fxTopZ(e)) <= 2 && !e.boss) fxKillWord(e, vh, cz + 0.1, bigK, dl * 0.6);
  // 금화: +N 글자는 몸 옆에서(머리 위 피해 숫자와 안 겹치게), 금화는 머리 위로 튀어 올라 금화 칸으로
  if (e.gold) { goldTxt(e.x + 0.3, e.y, (e.fly ? 0.75 : 0) + vh * 0.45, e.gold, bigK); coinBurst(WX(e.x), WY(e.y) - ((e.fly ? 0.75 : 0) + vh * 0.9) * RD.view.S, e.gold, coinN(e.gold, e.boss)); }
  sfx(e.boss ? 'bossDie' : bigK ? 'dieBig' : 'kill', bigK ? 0.65 : 0.45);
  if (!bigK) sfx('pop', 0.28);
  if (e.boss && ruBossDie(e, g, vh, cz, dl)) { /* 2~4장 우두머리: 챕터 분위기 연출 (render_units.js) */ }
  else if (e.boss) {
    // 우두머리: 크게 펑 + 짧은 슬로모션 + 화면 가득 색종이 + 큰 축하 글자
    fxPuffs(e.x, e.y, cz, 10, pcs, 3.2 + vh, 0.3 + vh * 0.06, 0.62, dl + 0.04); fxStars(e.x, e.y, cz, 6, FX_CANDY, 3, 0.14, 0.9, dl); fxShake(0.2); RD.hitStop = 0.14;
    if (fxScreenOk()) { RD.flash = 0.24; RD.flashCol = '#fff0f8'; }
    fxConfetti(e.x, e.y, cz + 0.3, 16, 3, 0.07, 1.4, FX_CANDY, dl); fxHearts(e.x, e.y, cz + 0.3, 3, ['#ff8fc0', '#ff5d9e'], 0.13, 1.1, dl);
    fxSRing(e.x, e.y, 0.04, 1.6 + vh * 0.4, 'rainbow', 0.7, 1, dl + 0.14); fxStarRing(e.x, e.y, cz, fxN(10), 1.4, 0.15, null, dl);
    RD.fxSlow = RD.fxSlowT = 1.1; fxConfettiRain(fxN(72));
    if (fxWordsOn()) { FX_NSTK++; addP({ k: 'stk', img: fxSticker(FX_WORDS.boss, Math.round(S * 0.8), 'rain', S * 6.4), x: clamp(e.x, 2.2, RD.cols - 2.2), y: e.y, z: Math.min(cz + 1.1, Math.max(0.2, e.y - 1.2)), rot: -0.07, life: 1.9, rise: 0.5, dl: dl, big: 1 }); }
    vib([50, 40, 90]);
  }
  else if (bigK) { fxShake(0.08); if (!(RD.hitStopCd > 0)) { RD.hitStop = 0.05; RD.hitStopCd = 0.45; } if (fxScreenOk() && !(RD.flash > 0.08)) { RD.flash = 0.08; RD.flashCol = '#fff6fb'; } }
}
// ---------- 금화 모으기 (v4.3) ----------
// 금화가 생기면(처치, 판매, 조폐소, 장애물, 조기 호출) 그 자리에서 금화가 튀어 오르고 +N 글자가 뜬 뒤, 위쪽 금화 칸으로 날아가 닿을 때 숫자가 올라감
// 날아가는 금액은 RD.coinPend에 두고 화면의 금화 숫자만 늦게 올림. 실제 금화(g.gold)는 그 순간 이미 늘어 있어 탑 짓기, 강화 판단은 그대로
// 날아가는 금화는 위쪽 덮개 캔버스(#fxTop, 위 막대보다 위)에 그림
var COINS = [], CSPK = [], GTX = [], COIN_C = {};
function qbez(a, b, c, t) { var m = 1 - t; return m * m * a + 2 * m * t * b + t * t * c; }
function coinSpr(px) {
  px = Math.max(8, Math.round(px)); if (COIN_C[px]) return COIN_C[px];
  var c = document.createElement('canvas'); c.width = c.height = px + 2; var x = c.getContext('2d'), m = c.width / 2, r = px / 2;
  x.fillStyle = '#7a4a0c'; x.beginPath(); x.arc(m, m, r, 0, 6.2832); x.fill();
  var gr = x.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.08, m, m, r * 0.95); gr.addColorStop(0, '#fff8d0'); gr.addColorStop(0.45, '#ffd84a'); gr.addColorStop(1, '#d48f14');
  x.fillStyle = gr; x.beginPath(); x.arc(m, m, r * 0.84, 0, 6.2832); x.fill();
  x.strokeStyle = 'rgba(140,84,12,0.8)'; x.lineWidth = Math.max(1, r * 0.13); x.beginPath(); x.arc(m, m, r * 0.56, 0, 6.2832); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.ellipse(m - r * 0.3, m - r * 0.36, r * 0.24, r * 0.12, -0.6, 0, 6.2832); x.fill();
  return (COIN_C[px] = c);
}
function coinPx() { var v = RD.view; return Math.round(clamp(v.S * 0.42, 15 * v.dpr, 26 * v.dpr)); }
function coinN(v, boss) { return boss ? 10 : v <= 6 ? 1 : v <= 15 ? 2 : v <= 40 ? 3 : v <= 100 ? 4 : 6; }
function coinFlush() {
  COINS.length = 0; CSPK.length = 0; GTX.length = 0; RD.coinPend = 0; RD.ctg = null;
  if (RD.fxx) { RD.fxx.setTransform(1, 0, 0, 1, 0, 0); RD.fxx.clearRect(0, 0, RD.fxc.width, RD.fxc.height); } RD.fxDirty = 0;
}
// X, Y: 캔버스 픽셀 위치, v: 금액, n: 금화 개수
function coinBurst(X, Y, v, n, o) {
  if (!RD.fxx || !RD.view || !(v > 0)) return;
  o = o || {}; var S = RD.view.S, max = RD.lowFx ? 16 : 32;
  n = Math.max(1, Math.min(n, RD.lowFx ? 3 : 10, v));
  RD.coinPend = (RD.coinPend || 0) + v;
  var each = Math.floor(v / n), rest = v - each * n;
  for (var i = 0; i < n; i++) {
    var cv = each + (i < rest ? 1 : 0);
    if (COINS.length >= max) { COINS[COINS.length - 1].v += cv; continue; } // 너무 많으면 마지막 금화에 얹음 (금액은 그대로)
    COINS.push({ x: X + (Math.random() - 0.5) * S * 0.3, y: Y, z: 0, vx: (Math.random() - 0.5) * S * (o.spread || 2), vz: S * (3.6 + Math.random() * 1.3) * (o.up || 1), t: 0, tp: 0.36 + i * 0.045 + Math.random() * 0.06, ph: 0, v: cv, a: Math.random() * 6, sp: 9 + Math.random() * 6 });
  }
}
function goldTxt(x, y, z, v, big) {
  for (var i = GTX.length - 1; i >= 0; i--) {
    var q = GTX[i]; if (q.dead || q.t >= q.life) { GTX.splice(i, 1); continue; }
    if (q.t < 0.3 && Math.abs(q.x - x) < 1.1 && Math.abs(q.y - y) < 1.1) { q.v += v; q.pop = 1; return; } // 가까이서 잇달아 잡으면 한 숫자로 합침
  }
  if (GTX.length >= 10 && !big) return;
  GTX.push(addP({ k: 'gtxt', x: x, y: y, z: z, v: v, big: big, life: big ? 1.25 : 0.95, pop: 0 }));
}
function goldFx(x, y, z, v, n, big) { if (!(v > 0)) return; goldTxt(x + 0.15, y, z + 0.28, v, big); coinBurst(WX(x), WY(y) - z * RD.view.S, v, n); }
function earlyCoins(v) {
  var wb = document.getElementById('bWave'); if (!wb || !RD.view || !(v > 0)) return;
  var r = wb.getBoundingClientRect(), d = RD.view.dpr; coinBurst((r.left + 31) * d, (r.top + r.height / 2) * d, v, Math.min(6, 2 + Math.floor(v / 15)), { up: 0.9, spread: 1.4 });
}
// 금화 칸 동전 그림의 한가운데 (0.4초마다 다시 잼)
function coinTarget() {
  var now = performance.now();
  if (!RD.ctg || now - RD.ctgT > 400) {
    var el = RD.gIcon || (RD.gIcon = document.querySelector('#hud .stat.gold img')), d = RD.view.dpr, r = el && el.getBoundingClientRect();
    RD.ctg = r && r.width ? { x: (r.left + r.width / 2) * d, y: (r.top + r.height / 2) * d } : { x: 34 * d, y: 30 * d }; RD.ctgT = now;
  }
  return RD.ctg;
}
function coinHit(v) {
  var now = performance.now(); RD.cCombo = now - (RD.cLast || 0) < 650 ? (RD.cCombo || 0) + 1 : 0; RD.cLast = now;
  if (now - (RD.fxVibT || 0) >= 120) { RD.fxVibT = now; vib(10); } // 금화가 칸에 닿을 때 아주 짧게 (120ms에 한 번까지)
  if (typeof SFX !== 'undefined') SFX.play('coinS', 0.3, 1 + Math.min(0.5, RD.cCombo * 0.035));
  if (typeof goldBump === 'function') goldBump();
}
function drawCoins(rdt) {
  var x = RD.fxx, cv = RD.fxc; if (!x) return;
  if (!COINS.length && !CSPK.length) { if (RD.fxDirty) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); RD.fxDirty = 0; } RD.coinPend = 0; return; }
  var cdt = RD.live === false ? 0 : Math.min(rdt, 0.05), S = RD.view.S, tg = coinTarget(), cp = coinPx(), spr = coinSpr(cp), gl = glowSpr('#ffcf40', 32);
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); RD.fxDirty = 1;
  for (var i = COINS.length - 1; i >= 0; i--) {
    var c = COINS[i], X, Y, k = 1; c.t += cdt; c.a += cdt * c.sp;
    if (c.ph === 0) {
      // 튀어 오름: 머리 위로 솟았다가 살짝 떨어질 때쯤 날아가기 시작
      c.vz -= S * 15 * cdt; c.z += c.vz * cdt; c.x += c.vx * cdt; c.vx *= Math.max(0, 1 - cdt * 2.5);
      X = c.x; Y = c.y - c.z;
      if (c.t >= c.tp) { c.ph = 1; c.t = 0; c.sx = X; c.sy = Y; var dx = tg.x - X, dy = tg.y - Y; c.dur = clamp(0.3 + Math.hypot(dx, dy) / Math.max(1, cv.height) * 0.45, 0.32, 0.7); c.cx = X + dx * 0.2 + (Math.random() - 0.5) * S * 2.2; c.cy = Math.min(Y, tg.y) - S * (0.4 + Math.random() * 0.8); }
    }
    if (c.ph === 1) {
      var u = Math.min(1, c.t / c.dur), e = u * u;
      if (u >= 1) { COINS.splice(i, 1); RD.coinPend = Math.max(0, (RD.coinPend || 0) - c.v); coinHit(c.v); CSPK.push({ x: tg.x, y: tg.y, t: 0 }); continue; }
      // 꼬리: 지나온 자리에 옅은 금화 두 개
      for (var gk = 2; gk >= 1; gk--) { var e2 = Math.max(0, u - gk * 0.08); e2 *= e2; var gw = cp * (1 - 0.3 * e2) * 0.8; x.globalAlpha = 0.16 * (3 - gk); x.drawImage(spr, qbez(c.sx, c.cx, tg.x, e2) - gw / 2, qbez(c.sy, c.cy, tg.y, e2) - gw / 2, gw, gw); }
      X = qbez(c.sx, c.cx, tg.x, e); Y = qbez(c.sy, c.cy, tg.y, e); k = 1 - 0.32 * e;
    }
    var w = cp * k, fl = 0.3 + 0.7 * Math.abs(Math.cos(c.a));
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.5; x.drawImage(gl, X - w, Y - w, w * 2, w * 2);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.drawImage(spr, X - w * fl / 2, Y - w / 2, w * fl, w);
  }
  // 금화 칸에 닿을 때 반짝
  x.globalCompositeOperation = 'lighter';
  for (var j = CSPK.length - 1; j >= 0; j--) {
    var sp = CSPK[j]; sp.t += rdt; var su = sp.t / 0.32; if (su >= 1) { CSPK.splice(j, 1); continue; }
    var R = cp * (0.7 + su * 1.3); x.globalAlpha = 0.9 * (1 - su); x.drawImage(gl, sp.x - R, sp.y - R, R * 2, R * 2);
    x.strokeStyle = 'rgba(255,236,160,' + (0.9 * (1 - su)) + ')'; x.lineWidth = Math.max(1, cp * 0.14 * (1 - su)); x.beginPath(); x.arc(sp.x, sp.y, cp * (0.45 + su * 1.1), 0, 6.2832); x.stroke();
  }
  if (CSPK.length > 12) CSPK.splice(0, CSPK.length - 12);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
}
// 대략적인 화력: 한 발 피해 x 초당 횟수 x 화살 수 x 치명타 기대값 + 장판, 화상, 독
function powerOf(st) { return (st.dmg || 0) * (st.rate || 0) * (st.multi || 1) * (1 + (st.crit || 0) * ((st.critX || 1) - 1)) * (st.chain ? 1 + st.chain * 0.6 : 1) * (st.pierce ? 1 + Math.min(3, st.pierce) * 0.3 : 1) + (st.zoneDps || 0) * 0.6 + (st.burn || 0) * 0.8 + (st.poison || 0) * 0.8 + (st.auraDps || 0) + (st.dps1 ? (st.dps0 + st.dps1) * 0.5 : 0); }
// 강화: 반짝이는 파스텔 빛기둥, 위로 솟는 반짝이, 별, 색종이
function upgradeFx(g, e) {
  var t = e.tw, col = e.lvl >= 4 ? (e.br === 0 ? '#7cc8ff' : '#ff8fc0') : '#ffe066';
  if (t) t.upAt = RD.time;
  addP({ k: 'pillar', x: e.x, y: e.y + 0.3, col: col, life: e.lvl >= 4 ? 0.9 : 0.7, w: e.lvl >= 4 ? 1.0 : 0.8 });
  ringFx(e.x, e.y + 0.3, 0.8, col, 0.5, 0.09); ringFx(e.x, e.y + 0.3, 0.5, '#ffffff', 0.35, 0.05, 0.06);
  fxPuffs(e.x, e.y + 0.3, 0.1, 6, ['#ffffff', '#fff6fb', lit(col, 0.6)], 1.6, 0.18, 0.55);
  for (var i = 0, n = fxN(e.lvl >= 4 ? 10 : 6); i < n; i++) addP({ k: 'twk', x: e.x + (Math.random() - 0.5) * 0.5, y: e.y + 0.3, z: Math.random() * 0.6, vz: 1.4 + Math.random() * 1.4, life: 0.6 + Math.random() * 0.4, size: 0.06 + Math.random() * 0.05, col: fxPick([col, '#ffffff', '#ffe066', '#ff8fc0']), rot: 0, vr: 2 });
  fxStars(e.x, e.y + 0.3, 0.6, e.lvl >= 4 ? 6 : 4, [col, '#ffe066', '#ff8fc0', '#7fe0c4'], 1.8, 0.1, 0.8);
  fxConfetti(e.x, e.y + 0.3, 0.9, e.lvl >= 4 ? 22 : 12, 2.2, 0.055, 1.1);
  var name = e.lvl <= 3 ? e.lvl + '단계' : towerTitle(e.k, e.lvl, e.br) + (e.lvl >= fdMaxLv(e.k, e.br) ? ' 완성' : '');
  textFx(e.x, e.y - 0.1, name, e.lvl >= 4 ? col : '#ffe066', true); PARTS[PARTS.length - 1].z = 1.6;
  // 화력이 얼마나 올랐는지 숫자로 (공격이 실제로 세졌다는 걸 바로 알게)
  var s1 = towerStats(e.k, e.lvl, e.br), s0 = towerStats(e.k, e.lvl - 1, e.lvl >= 5 ? e.br : 0), p1 = powerOf(s1), p0 = powerOf(s0), sub = '';
  if (p0 > 0 && p1 > p0) sub = '화력 +' + Math.round((p1 / p0 - 1) * 100) + '%';
  else if (s1.gold && s0.gold && s1.gold > s0.gold) sub = '웨이브 금화 ' + s0.gold + ' → ' + s1.gold;
  if (sub) { textFx(e.x, e.y + 0.15, sub, '#ffb0d4', false); var tp = PARTS[PARTS.length - 1]; tp.z = 1.25; tp.life = 1.5; }
  sfx(e.lvl >= 4 ? 'upgradeBig' : 'upgrade', 0.6); vib(e.lvl >= 4 ? 25 : 15);
  if (e.lvl >= 4) fxShake(0.04);
}
function sfx(k, v) { if (typeof SFX !== 'undefined') SFX.play(k, v); }
function vib(ms) { try { if (SAVE && SAVE.set && SAVE.set.vib && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }

// ---------- 그리기 ----------
function rdFrame(g, dt, realDt) {
  var x = RD.x, v = RD.view, S = v.S, T = THEME[g.M.theme], rdt = realDt == null ? dt : realDt;
  RD.time += dt;
  if (RD.warm && RD.warm.length) enemyFrames(RD.warm.shift(), S);
  if (RD.hitStopCd > 0) RD.hitStopCd -= rdt;
  if (RD.fxFlCd > 0) RD.fxFlCd -= rdt;
  for (var q = 0; q < g.enemies.length; q++) { var eq = g.enemies[q]; if (eq.vk > 0) eq.vk = Math.max(0, eq.vk - dt * 6); }
  if (RD.shake > 0 && (!SAVE || SAVE.set.shake !== false)) { var m = RD.shake * S; RD.shx = (Math.random() - 0.5) * m; RD.shy = (Math.random() - 0.5) * m; RD.shake = Math.max(0, RD.shake - rdt * 0.7); } else { RD.shx = RD.shy = 0; RD.shake = 0; }
  if (RD.cam !== RD.camT) { var cd = RD.camT - RD.cam, cs2 = Math.min(1, rdt * 14); RD.cam = Math.abs(cd) < 0.5 ? RD.camT : RD.cam + cd * cs2; }   // v2.3 지도 올림(부드럽게)
  if (v.oyBase != null) v.oy = v.oyBase - (RD.cam || 0) * v.dpr;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#1e1428'; x.fillRect(0, 0, v.W, v.H);
PT('bg');
  x.drawImage(RD.bg, RD.shx, RD.shy - (RD.cam || 0) * v.dpr);
  var time = RD.time;
PT('liquid');
  // 물, 용암 반짝임
  drawLiquidAnim(x, g, time);
PT('decals');
  // 바닥 흔적: 꽃 모양 자국, 빗나간 사탕 화살
  for (var i = RD.decals.length - 1; i >= 0; i--) {
    var d = RD.decals[i]; d.t += dt; if (d.t > d.life) { RD.decals.splice(i, 1); continue; }
    var a = Math.min(1, (d.life - d.t) / 1.2);
    if (d.k === 'mark') { var mr = d.r * S * (0.6 + 0.4 * easeOut(Math.min(1, d.t * 5))), mk = d.img || (d.img = fxImg('mark', d.col, d.r * S * 2)); x.globalAlpha = 0.36 * a; x.drawImage(mk, WX(d.x) - mr, WY(d.y) - mr * 0.6, mr * 2, mr * 1.2); }
    else if (d.k === 'arrow') { x.globalAlpha = 0.75 * a; fxBlitS(x, fxSpr(RD.fxSk && RD.fxSk !== 'base' ? 'arrow@' + RD.fxSk : 'arrow', S), WX(d.x), WY(d.y), d.a, 0.42); }
  }
  x.globalAlpha = 1;
  if (RD.decals.length > 90) RD.decals.splice(0, RD.decals.length - 90);
  rtGround(x, g, S, time);   // [REN1] 그을음, 서리, 문양, 물결 자국 (render_tw.js)
  // 적이 나오는 곳: 보랏빛 요술 구멍과 도는 고리
  x.lineCap = 'round'; x.lineWidth = Math.max(1, S * 0.035);
  for (var ri = 0; ri < RD.rifts.length; ri++) {
    var rf = RD.rifts[ri], RX = WX(rf.x), RY = WY(rf.y);
    drawSpr(x, fxSpr('rift', S), RX, RY);
    for (var k = 0; k < 3; k++) { x.globalAlpha = 0.8 - k * 0.18; x.strokeStyle = k === 1 ? '#ff8fc0' : k ? '#fff0fa' : '#b9a2ff'; x.beginPath(); x.ellipse(RX, RY, S * (0.25 + k * 0.12), S * (0.12 + k * 0.06), 0, time * (1.5 + k) % 6.28, time * (1.5 + k) % 6.28 + 3.6); x.stroke(); }
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.35 + 0.15 * Math.sin(time * 3); x.drawImage(glowSpr('#c8a0ff', 48), RX - S * 0.5, RY - S * 0.35, S, S * 0.7); x.globalCompositeOperation = 'source-over';
    if (!RD.lowFx && Math.random() < 0.06) addP({ k: 'twk', x: rf.x + (Math.random() - 0.5) * 0.5, y: rf.y, z: 0.05, vz: 0.6, life: 0.7, size: 0.05, col: fxPick(['#ff8fc0', '#b9a2ff', '#ffffff']), rot: 0, vr: 2 });
  }
  x.globalAlpha = 1; x.lineCap = 'butt';
  ruGround(x, g, S, time, dt, rdt);   // 뱃길과 항로 들머리, 길 안내 화살표, 운석 예고, 땅 연출 (render_units.js)
PT('zones');
  // 장판: 귀여운 불꽃, 방울 퐁퐁 물약 웅덩이
  for (var zi = 0; zi < g.zones.length; zi++) {
    var z = g.zones[zi]; if (z.kind === 'rain') continue;
    if (z.kind === 'sk2ice') { var ia = Math.min(1, z.t / 0.6, (z.T - z.t) / 0.25 + 0.2), IR = z.r * S; x.globalAlpha = 0.45 * ia; x.drawImage(softSpr('#bfefff', 48), WX(z.x) - IR, WY(z.y) - IR * 0.62, IR * 2, IR * 1.24); x.globalAlpha = 1; if (Math.random() < 0.6) addP({ k: 'bubble', x: z.x + (Math.random() - 0.5) * z.r * 1.6, y: z.y + (Math.random() - 0.5) * z.r, z: 0, vz: 0.25, life: 0.9, size: 0.035, col: '#e8fbff', ph: Math.random() * 6 }); continue; }
    var za = Math.min(1, z.t / 0.5, (z.T - z.t) / 0.3 + 0.2), X = WX(z.x), Y = WY(z.y), R = z.r * S;
    if (z.kind === 'fire') {
      x.globalAlpha = 0.4 * za; x.drawImage(softSpr('#ffb38a', 48), X - R, Y - R * 0.6, R * 2, R * 1.2);
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.35 * za; x.drawImage(glowSpr('#ff8a4a', 64), X - R * 0.8, Y - R * 0.5, R * 1.6, R * 1); x.globalCompositeOperation = 'source-over';
      if (Math.random() < 0.5) addP({ k: 'flame', x: z.x + (Math.random() - 0.5) * z.r * 1.4, y: z.y + (Math.random() - 0.5) * z.r * 0.7, z: 0, vz: 0.6, life: 0.5, size: 0.11, col: Math.random() < 0.5 ? '#ff9a5a' : '#ff6fa8' });
    } else {
      var zc = z.br === 1 ? '#a58aff' : z.shred >= 0.35 ? '#ffe066' : '#9be86a';
      for (var k2 = 0; k2 < 3; k2++) { var ph = time * 0.8 + k2 * 2.1; x.globalAlpha = 0.3 * za; x.drawImage(softSpr(zc, 48), X - R + Math.cos(ph) * R * 0.15 - R * 0.1, Y - R * 0.6 + Math.sin(ph) * R * 0.1, R * 2.2, R * 1.3); }
      if (Math.random() < 0.22) addP({ k: 'bubble', x: z.x + (Math.random() - 0.5) * z.r, y: z.y + (Math.random() - 0.5) * z.r * 0.5, z: 0, vz: 0.35, life: 0.8, size: 0.04 + Math.random() * 0.03, col: zc, ph: Math.random() * 6 });
    }
  }
  x.globalAlpha = 1;
PT('bells');
  // 종탑 기운: 레몬빛 고리가 퍼짐
  for (var bi = 0; bi < g.towers.length; bi++) {
    var tb = g.towers[bi]; if (tb.k !== 'bell') continue;
    var R2 = tb.st.range * S, ph2 = (time * 0.6 + tb.id * 0.3) % 1;
    x.globalAlpha = 0.35 * (1 - ph2); x.strokeStyle = '#ffe066'; x.lineWidth = Math.max(1, S * 0.035); x.beginPath(); x.ellipse(WX(tb.x), WY(tb.y), R2 * ph2, R2 * ph2 * 0.62, 0, 0, Math.PI * 2); x.stroke();
  }
  x.globalAlpha = 1;
PT('select');
  drawSelectionGround(x, g, S);
PT('shadows');
  // 그림자(날짐승, 투사체)
  ruShadows(x, g, S, time);   // 하늘 적의 땅 그림자: 위에서 본 적은 제 모양 그림자 (render_units.js)
PT('entities');
  // ---- 세워진 것들 (깊이 순서) ----
  var list = [];
  g.obs.forEach(function (o) { if (o.alive) list.push({ y: o.y + (o.w > 1 ? 0.45 : 0.3), o: o, k: 0 }); });
  RD.rocks.forEach(function (r) { list.push({ y: r.y, r: r, k: 4 }); });
  g.towers.forEach(function (t) { list.push({ y: t.y + 0.3, t: t, k: 1 }); });
  g.enemies.forEach(function (e) { if (!e.fly) list.push({ y: e.y, e: e, k: 2 }); });
  g.bars.forEach(function (b) { list.push({ y: b.y + 0.1, b: b, k: 5 }); });
  list.push({ y: g.gate.y + 0.42, k: 3 });
  list.sort(function (a, b) { return a.y - b.y; });
  for (var j = 0; j < list.length; j++) {
    var it = list[j];
    if (it.k === 0) drawObs(x, g, it.o, S, time);
    else if (it.k === 1) drawTower(x, g, it.t, S, time);
    else if (it.k === 2) drawEnemy(x, g, it.e, S, time);
    else if (it.k === 3) drawGate(x, g, S, time);
    else if (it.k === 4) drawSpr(x, it.r.spr, WX(it.r.x), WY(it.r.y));
    else if (it.k === 5) { drawSpr(x, fxSpr('barricade', S), WX(it.b.x), WY(it.b.y)); drawBar(x, WX(it.b.x), WY(it.b.y) - S * 0.62, S * 0.6, it.b.hp / it.b.mhp, '#ffd23a'); }
  }
PT('fly');
  // 하늘
  g.enemies.forEach(function (e) { if (e.fly) drawEnemy(x, g, e, S, time); });
  ruSky(x, g, S, time, dt);   // 폭발 불덩이, 떠오르는 혼, 떨어지는 동체 (render_units.js)
  // 광선
  g.towers.forEach(function (t) { if (t.k === 'arcane' && t.st.kind === 'beam' && t.beamTgt && t.fireT > 0) drawBeam(x, t, S, time); });
  // 최후의 화살: 순간 배경 딤 (화살 빛과 입자는 그 위에 그려 더 또렷하게)
  if (RD.fxDim > 0) {
    RD.fxDimT += rdt; var dmt = RD.fxDimT, dma = dmt < 0.07 ? dmt / 0.07 : dmt < 0.22 ? 1 : Math.max(0, 1 - (dmt - 0.22) / 0.65);
    if (dma <= 0 || !fxScreenOk()) RD.fxDim = 0; else { x.globalAlpha = 0.5 * dma * dma * (3 - 2 * dma); x.fillStyle = '#24123a'; x.fillRect(0, 0, v.W, v.H); x.globalAlpha = 1; }
  }
PT('proj');
  rtUnder(x, g, S, time, dt);   // [REN1] 연기 꼬리 (탄 아래)
  if (g.units && g.units.length) fdDrawUnits(x, g, S, time);
  drawProjectiles(x, g, S, time);
  rtOver(x, g, S, time);   // [REN1] 광선, 번개, 불덩이, 합체 연출 (탄 위, 숫자 아래)
PT('parts');
  drawParts(x, S, dt, time);
  ruRuleOver(x, g, S, time, dt, rdt);   // 판 규칙 덮개: 밤, 안개, 정전 (render_units.js)
  rtBanners(x, S);   // [REN1] 변신, 합체 이름 띠
PT('bars');
  // 체력 막대 (적은 render_units.js: 하늘 높이, 위에서 본 적, 숨은 적)
  ruBars(x, g, S, dt);
  g.obs.forEach(function (o) { if (o.alive && o.hp < o.mhp) { var ob = o.spr && fxBodyBox(o.spr), oy = ob ? WY(o.y + (o.w > 1 ? 0.45 : 0.3)) + ob.cy - ob.h / 2 - S * 0.16 : WY(o.y) - S * (o.w > 1 ? 1.3 : 0.75); drawBar(x, WX(o.x), oy, S * 0.6 * o.w, o.hp / o.mhp, '#ffbf1f'); } });
  drawFocus(x, g, S, time);
PT('ambient');
  drawAmbient(x, RD.view, g.M.theme, time, dt);
  drawAimOverlay(x, g, S, time);
PT('screenfx');
  // 화면 효과: 분홍 테두리(성이 맞을 때, 목숨이 적을 때), 부드러운 파스텔 번쩍임
  if (RD.redPulse > 0) { RD.redPulse = Math.max(0, RD.redPulse - rdt * 1.6); x.globalAlpha = 0.62 * RD.redPulse; x.drawImage(fxVig('#ff5d9e'), 0, 0, v.W, v.H); x.globalAlpha = 1; }
  if (g.lives / g.maxLives < 0.3 && !g.over) { x.globalAlpha = 0.26 + 0.14 * Math.sin(time * 4); x.drawImage(fxVig('#ff7ab0'), 0, 0, v.W, v.H); x.globalAlpha = 1; }
  // 우두머리가 크게 맞을 때 화면 가장자리 반짝
  if (RD.fxEdge > 0) { x.globalAlpha = 0.5 * RD.fxEdge; x.drawImage(fxVig('#ffe9a8'), 0, 0, v.W, v.H); x.globalAlpha = 1; RD.fxEdge = Math.max(0, RD.fxEdge - rdt * 3.2); }
  if (RD.flash > 0) { if (fxScreenOk()) { x.globalAlpha = Math.min(0.75, RD.flash); x.fillStyle = RD.flashCol; x.fillRect(0, 0, v.W, v.H); x.globalAlpha = 1; } RD.flash = Math.max(0, RD.flash - rdt * 1.8); }
  ruScreen(x, g, S, time, rdt);   // 공습 경보, 우두머리 등장, 미사일 경고 (render_units.js)
  drawCoins(rdt);
}
function drawLiquidAnim(x, g, time) {
  if (typeof mwLiquidAnim === 'function') return mwLiquidAnim(x, g, time);   // [MB] 물 움직임은 art_map3.js
  var S = RD.view.S, th = THEME[g.M.theme];
  if (!RD.liq) { RD.liq = []; for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) { var k = g.kind[r * g.cols + c]; if (k === 'water' || k === 'lava') for (var n = 0; n < 3; n++) RD.liq.push({ x: c + Math.random(), y: r + Math.random(), ph: Math.random() * 6.28, lava: k === 'lava' }); } }
  if (!RD.liq.length || th.ice) return;
  x.save(); x.globalCompositeOperation = 'lighter';
  RD.liq.forEach(function (p) {
    var a = 0.5 + 0.5 * Math.sin(time * (p.lava ? 1.3 : 2.2) + p.ph);
    if (p.lava) { x.globalAlpha = 0.35 * a; x.drawImage(glowSpr('#ffb040', 32), WX(p.x) - S * 0.35, WY(p.y) - S * 0.2, S * 0.7, S * 0.4); }
    else { x.globalAlpha = 0.5 * a * a; x.fillStyle = '#e8f8ff'; x.fillRect(WX(p.x), WY(p.y), S * 0.08, S * 0.012); }
  });
  x.restore();
}
// 체력 막대: 흰 바깥 테두리 + 자두색 테두리 + 진한 사탕 색 채움 (밝은 바탕에서도 또렷하게)
function drawBar(x, X, Y, w, f, col, sh, lag) {
  var d = RD.view.dpr || 1, h = Math.max(5, Math.round(RD.view.S * 0.095)), o1 = Math.max(1, Math.round(d)), o2 = o1 + Math.max(1, Math.round(d)); f = clamp(f, 0, 1); X = Math.round(X - w / 2) + w / 2; Y = Math.round(Y);
  x.fillStyle = '#ffffff'; x.fillRect(X - w / 2 - o2, Y - o2, w + o2 * 2, h + o2 * 2);
  x.fillStyle = '#4a2a5a'; x.fillRect(X - w / 2 - o1, Y - o1, w + o1 * 2, h + o1 * 2);
  x.fillStyle = '#5c3466'; x.fillRect(X - w / 2, Y, w, h);
  if (lag > f) { x.fillStyle = '#fff2c4'; x.fillRect(X - w / 2 + w * f, Y, w * (Math.min(1, lag) - f), h); }
  x.fillStyle = col; x.fillRect(X - w / 2, Y, w * f, h);
  x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(X - w / 2, Y, w * f, Math.max(1, h * 0.36));
  if (sh) { x.fillStyle = '#4a2a5a'; x.fillRect(X - w / 2 - o1, Y - h * 0.62 - o1, w * sh + o1 * 2, h * 0.5 + o1 * 2); x.fillStyle = '#c8b4ff'; x.fillRect(X - w / 2, Y - h * 0.62, w * sh, h * 0.5); }
}
// 장애물이 맞음 (게임 쪽 사건이 없어 hitT가 다시 차오르는 것으로 앎): 작은 충격, 반짝이, 고리, 젤리 출렁, 뽁 (0.12초에 한 번까지)
function fxObsHit(o, S) {
  if (RD.time - (o.fxT == null ? -9 : o.fxT) < 0.12) return; o.fxT = RD.time;
  var bb = o.spr && fxBodyBox(o.spr), gy = o.y + (o.w > 1 ? 0.45 : 0.3), bx = o.x + (bb ? bb.cx / S : 0), bz = bb ? Math.max(0.1, -bb.cy / S) : 0.3, big = o.w > 1 ? 1.5 : 1;
  fxPop(bx, gy, bz, 0.3 * big, '#ffe066', 0.1); fxTwinkles(bx, gy, bz, 2, ['#ffffff', '#ffe066', '#ff8fc0'], 1.6, 0.06, 0.3);
  if (!fxBusy()) fxSRing(bx, gy, bz, 0.3 * big, '#ffd23a', 0.18, 0);
  o.jT = RD.time; o.jA = Math.min(1, (o.jA || 0) * 0.3 + 0.7); sfx('pok', 0.2);
}
function drawObs(x, g, o, S, time) {
  var X = WX(o.x), Y = WY(o.y + (o.w > 1 ? 0.45 : 0.3));
  var sh = o.hitT > 0 ? (Math.random() - 0.5) * S * 0.04 : 0;
  if (o.hitT > (o.fxHT || 0) + 0.005 && RD.live !== false) fxObsHit(o, S);
  if (o.hitT > 0) o.hitT -= 1 / 60;
  o.fxHT = o.hitT;
  var ojt = o.jT != null ? RD.time - o.jT : 9;
  if (ojt < 0.6 && o.spr && !o.spr.empty) { var ojw = (o.jA || 0) * Math.exp(-ojt * 8) * Math.cos(ojt * 30); x.setTransform(1 + 0.1 * ojw, 0, 0, 1 - 0.1 * ojw, X + sh, Y); x.drawImage(o.spr.c, -o.spr.ax, -o.spr.ay); x.setTransform(1, 0, 0, 1, 0, 0); }
  else drawSpr(x, o.spr, X + sh, Y);
  if (o.tower || o.chest) {
    var tw = (time * 0.5 + o.id * 0.37) % 3;
    if (tw < 0.4) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.sin(tw / 0.4 * Math.PI) * 0.9; x.drawImage(glowSpr('#ffe8a0', 32), X - S * 0.18 + S * 0.15, Y - S * 0.62, S * 0.36, S * 0.36); x.restore(); }
  }
}
var KICK = { cannon: 1.5, catapult: 1.1, ballista: 1.0, frost: 0.8, flame: 0.5, arcane: 0.5, alchemy: 0.6, archer: 0.35, bell: 0.4, mint: 0 };
function drawTower(x, g, t, S, time) {
  // [REN1] 물결, 발밑 빛 고리, 변신과 합체 연출(render_tw.js). 변신 앞 절반은 옛 모습으로 그리려고 단계를 잠깐 바꿔 둠
  var rq = rtTwPre(x, g, t, S, time), rL = t.lvl, rB = t.br;
  if (rq) { if (rq.hide) return; if (rq.L) { t.lvl = rq.L; t.br = rq.B; } }
  try { rtTowerBody(x, g, t, S, time, rq); } finally { t.lvl = rL; t.br = rB; }
}
function rtTowerBody(x, g, t, S, time, rq) {
  var X = WX(t.x), Y = WY(t.y + 0.3), info = towerSpr(t.k, t.lvl, t.br, S), age = g.t - t.born, kk = info.k || 1, Sp = S * kk;
  // 지을 때 튀어나옴, 강화할 때 통통 튐, 쏠 때 움찔
  var sx = 1, sy = 1;
  if (age < 0.4) { var sc = 0.65 + 0.35 * easeBack(age / 0.4); sx = sc; sy = Math.min(1.15, 2 - sc); }
  var ua = t.upAt != null ? RD.time - t.upAt : 9;
  if (ua < 0.7) { var pu = ua / 0.7, bo = Math.sin(pu * Math.PI * 3) * (1 - pu); sx *= 1 - bo * 0.12; sy *= 1 + bo * 0.2; }
  if (t.fireT > 0 && KICK[t.k]) { var fk = Math.max(0, Math.sin(Math.min(1, t.fireT / 0.35) * Math.PI)) * KICK[t.k]; sx *= 1 + fk * 0.035; sy *= 1 - fk * 0.045; }
  if (rq && rq.sx) { sx *= rq.sx; sy *= rq.sy; }
  var scaled = sx !== 1 || sy !== 1;
  // 갈래 단계 기운 (5단계는 더 밝고 반짝이 입자)
  if (t.lvl >= 4) {
    var C = BRC[t.br], pa = 0.5 + 0.5 * Math.sin(time * 2 + t.id);
    x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = (t.lvl >= 6 ? 0.42 : t.lvl === 5 ? 0.32 : 0.16) + pa * 0.12;
    x.drawImage(glowSpr(C.glow, 64), X - Sp * 0.75, Y - Sp * 0.32, Sp * 1.5, Sp * 0.64); x.restore();
    if (t.lvl >= 5 && !RD.lowFx && Math.random() < (t.lvl >= 6 ? 0.1 : 0.05)) { var an = Math.random() * Math.PI * 2; addP({ k: 'spark', x: t.x + Math.cos(an) * 0.45 * kk, y: t.y + 0.3 + Math.sin(an) * 0.25 * kk, z: 0.05, vz: 0.7 + Math.random() * 0.5, life: 1.1, size: 0.045, col: C.glow }); }
  }
  if (scaled) { x.save(); x.translate(X, Y); x.scale(sx, sy); x.translate(-X, -Y); }
  if (UIS.sel && UIS.sel.t === t) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.35 + 0.15 * Math.sin(time * 5); x.drawImage(glowSpr('#ffe8a0', 64), X - Sp * 0.65, Y - Sp * 0.38, Sp * 1.3, Sp * 0.76); x.restore(); }
  drawSpr(x, info.back, X, Y);
  drawTowerParts(x, t, X, Y, Sp, time, info, g);
  drawSpr(x, info.front, X, Y);
  var tel = g.attr && g.attr[t.k]; if (tel && EL_COL[tel]) { var bx = X + Sp * 0.32, by = Y - Sp * 0.12, br = Math.max(3, S * 0.07); x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.5 + 0.2 * Math.sin(time * 4 + t.id); x.drawImage(glowSpr(EL_COL[tel], 16), bx - br * 2, by - br * 2, br * 4, br * 4); x.restore(); x.fillStyle = EL_COL[tel]; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.02); x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill(); x.stroke(); }
  if (ua < 0.5) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = (1 - ua / 0.5) * 0.8; x.drawImage(glowSpr(t.lvl >= 4 ? BRC[t.br].glow : '#ffe8a0', 64), X - Sp * 0.8, Y - Sp * 1.9, Sp * 1.6, Sp * 2.1); x.restore(); }
  rtTwPost(x, g, t, X, Y, Sp, S, time, rq);
  if (scaled) x.restore();
  if (typeof TW_OVER === 'function') TW_OVER(x, g, t, X, Y, S, time);   // 덮개 고리: 기절, 저주, 홀림 표시 등 (X, Y = 탑 발밑 화면 좌표)
  // 연금술 굴뚝: 파스텔 솜구름
  if (t.k === 'alchemy' && info.chimney && Math.random() < 0.06) smoke(t.x + info.chimney[0] * kk, t.y + 0.3 + 0.0, 1, t.br === 1 ? '#eadcff' : '#e6f8d8', 0.24, 1.4, 0.5, 0.5);
  if (t.k === 'flame' && t.st.kind === 'cone' && t.fireT > 0) {
    // 화염 꽃불: 불길에 닿은 적에게 0.22초마다 꽃 모양 불꽃
    t.fxFl = (t.fxFl || 0) - (RD.live === false ? 0 : 1 / 60);
    if (t.fxFl <= 0) {
      t.fxFl = 0.22; var fhalf = t.st.cone * Math.PI / 360, fr2 = t.st.range + 0.3;
      for (var fi = 0; fi < g.enemies.length; fi++) { var fe = g.enemies[fi]; if (fe.dead || d2(fe.x, fe.y, t.x, t.y) > fr2 * fr2 || Math.abs(angDiff(t.aim, Math.atan2(fe.y - t.y, fe.x - t.x))) > fhalf) continue; fxFlameHit(fe); break; }
    }
    for (var i = 0; i < 2; i++) {
      var half = t.st.cone * Math.PI / 360, a = t.aim + (Math.random() - 0.5) * half * 1.6, sp = 2.4 + Math.random() * 1.6;
      var mt = info.mounts[0];
      addP({ k: 'flame', x: t.x + mt[0] * kk + Math.cos(a) * 0.15, y: t.y + 0.3 + Math.sin(a) * 0.1, z: -mt[1] * kk - 0.3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.75, vz: -0.35 - Math.random() * 0.3, life: t.st.range / sp * 0.9, size: 0.1 + t.lvl * 0.014, col: i ? '#ff9a5a' : '#ff7aa8', ph: Math.random() * 6, soft: i ? 2 : 1 });
    }
  }
}
function drawGate(x, g, S, time) {
  var X = WX(g.gate.x), Y = WY(g.gate.y + 0.42), sh = g.gate.hitT > 0 ? (Math.random() - 0.5) * S * 0.06 : 0;
  drawSpr(x, RD.gate, X + sh, Y);
  if (g.gate.hitT > 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = g.gate.hitT; x.drawImage(glowSpr('#ff5d9e', 64), X - S * 0.8, Y - S * 1.3, S * 1.6, S * 1.4); x.restore(); }
  var f = g.lives / g.maxLives;
  // 등불
  x.save(); x.globalCompositeOperation = 'lighter';
  [-0.36, 0.36].forEach(function (u) { var fl = 0.7 + 0.3 * Math.sin(time * 13 + u * 9); x.globalAlpha = fl; x.drawImage(glowSpr('#ffc070', 32), X + u * S - S * 0.14, Y - S * 0.62 - S * 0.14, S * 0.28, S * 0.28); });
  x.restore();
  if (f < 0.6 && Math.random() < (0.6 - f) * 0.4) smoke(g.gate.x + (Math.random() - 0.5) * 0.8, g.gate.y - 0.4, 1, '#efe6f4', 0.32, 1.6, 0.6, 0.55);
  if (f < 0.3 && Math.random() < 0.3) addP({ k: 'flame', x: g.gate.x + (Math.random() - 0.5) * 0.9, y: g.gate.y + 0.2, z: 0.6 + Math.random() * 0.5, vz: 0.5, life: 0.6, size: 0.12, col: Math.random() < 0.5 ? '#ff9a5a' : '#ff6fa8' });
}
// 적이 화면에서 차지하는 높이(칸 단위)
function EH(e) { return e && e.E ? enVis(e.E) : (e && e.size) || 0.6; }
function drawEnemy(x, g, e, S, time) {
  // rv: 영역과 상태에 따른 모습(그림 키, 위에서 본 그림인지, 높이, 투명도, 배율, 숨김) (render_units.js)
  var rv = ruView(g, e, S, time), fr = enemyFrames(rv.k, S), n = fr.n, idx;
  var top = rv.top;
  if (e.fly || e.k === 'wraith' || e.k === 'wagon' || rv.sea) idx = Math.floor((time * (e.fly ? 9 : 4) * (e.k === 'wyvern' ? 0.7 : 1) + e.anim * n)) % n;
  else idx = Math.floor((e.d / (0.42 + e.size * 0.55) + e.anim) * n) % n;
  if (e.stunT > 0 && !e.fly) idx = 0;
  var X = WX(e.x) + rv.dx, Y = WY(e.y), alpha = rv.a, vs = EH(e) * rv.sc;
  if (e.fly) Y -= S * rv.z; else if (rv.sea) Y += rv.bob * S * 0.018; else if (rv.z > 0) Y -= S * rv.z;   // 뛰어넘는 중인 땅 적
  e.fbx = X; e.fby = Y; // 조준 표시가 따라갈 자리 (밀림, 출렁임 전)
  if (e.stealth && !e.revealed) alpha *= 0.28 + 0.1 * Math.sin(time * 4 + e.anim * 6);
  if (rv.hide) { ruHidden(x, e, X, Y, S, time); return; }   // 밤: 불빛 밖의 적은 눈빛만
  if (e.reviveT > 0) {
    // 쓰러진 뼈 무더기
    x.save(); x.globalAlpha = 0.9; x.translate(X, Y); x.rotate(e.face > 0 ? 1.45 : -1.45); x.drawImage(fr.fr[0].c, -fr.fr[0].ax, -fr.fr[0].ay * 0.6); x.restore();
    return;
  }
  // 맞으면: 흰 번쩍임 + 젤리처럼 눌렸다 통통 출렁 + 맞은 쪽으로 살짝 밀림 (그림만 움직이고 판정 위치는 그대로)
  var hk = e.hitT > 0 ? Math.min(1, e.hitT / 0.09) : 0, kb = e.vk || 0, big = e.boss ? 0.35 : 1, jw = 0, jp = 0, jt = e.jT != null ? RD.time - e.jT : 9;
  if (jt < 0.8 && e.jA > 0) { jw = e.jA * Math.exp(-jt * (e.boss ? 5 : 7)) * Math.cos(jt * (e.boss ? 20 : 28)); jp = e.jA * Math.exp(-jt * 12); }
  var jk = e.boss ? 1.2 : 1, push = S * (0.03 * hk + 0.16 * kb) * big, sqx = 1 + 0.12 * kb * big + 0.15 * jw * jk, sqy = 1 - 0.1 * kb * big - 0.14 * jw * jk;
  if (push > 0) { X -= (e.dirx || 0) * push; Y -= (e.diry || 0) * push * 0.6; }
  if (jp > 0.02) { var jpx = S * 0.09 * jp * (e.boss ? 0.5 : 1); X += (e.jx || 0) * jpx; Y += (e.jy || 0) * jpx * 0.6; }
  if (!e.fly && !rv.sea) shadowAt(x, X + S * 0.04, Y + S * 0.02 + rv.z * S, vs * S * 0.32 * (1 + 0.1 * jw), vs * S * 0.11, 0.45 * alpha);
  ruUnder(x, g, e, rv, fr, idx, X, Y, S, time);   // 바다 물살, 항로 비행운과 잔상
  sqx *= rv.sc; sqy *= rv.sc;
  var s = e.kneel && fr.kneel ? fr.kneel : fr.fr[idx], w = fr.wh[idx], fa = Math.min(1, hk * 1.2) * (e.boss ? 0.5 : 0.9);
  x.save(); x.globalAlpha = alpha; x.translate(X, Y);
  if (rv.mix > 0) x.globalAlpha = alpha * (1 - rv.mix);   // 잠수 중: 물 위 모습은 옅어지고 물속 모습이 진해짐
  if (top) { x.rotate(Math.atan2(e.diry, e.dirx) + rv.rot); x.scale(sqx, sqy); x.drawImage(s.c, -s.ax, -s.ay * 0.75); if (rv.k2) ruSubBody(x, rv, S, idx, alpha, 1); if (fa > 0) { x.globalAlpha = fa * alpha; x.drawImage(w.c, -w.ax, -w.ay * 0.75); } }
  else { if (rv.rot) x.rotate(rv.rot); x.scale((e.face < 0 ? -1 : 1) * sqx, sqy); x.drawImage(s.c, -s.ax, -s.ay); if (rv.k2) ruSubBody(x, rv, S, idx, alpha, 0); if (fa > 0 && !e.kneel) { x.globalAlpha = fa * alpha; x.drawImage(w.c, -w.ax, -w.ay); } }
  x.restore();
  // 상태 표시
  var hh = vs * S;
  if (e.slowF > 0 && e.slowT > 0) { x.strokeStyle = 'rgba(124,200,255,0.85)'; x.lineWidth = Math.max(1, S * 0.03); x.beginPath(); x.ellipse(X, Y, hh * 0.32, hh * 0.1, 0, 0, Math.PI * 2); x.stroke(); }
  if (e.frozen && e.stunT > 0) { x.save(); x.globalAlpha = 0.5; x.fillStyle = '#d6f0ff'; x.beginPath(); x.ellipse(X, Y - hh * 0.46, hh * 0.47, hh * 0.54, 0, 0, Math.PI * 2); x.fill(); x.globalAlpha = 0.95; x.strokeStyle = '#7cc8ff'; x.lineWidth = Math.max(1, S * 0.025); x.stroke(); x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.02); x.beginPath(); x.arc(X - hh * 0.12, Y - hh * 0.62, hh * 0.18, 3.4, 4.4); x.stroke(); x.restore(); }
  else if (e.stunT > 0) { var simg = fxImg('star', '#ffe066', S * 0.24); for (var k = 0; k < 3; k++) { var a = time * 6 + k * 2.1, sd = Math.max(S * 0.17, 6 * RD.view.dpr) * (0.8 + 0.2 * Math.sin(a)); x.drawImage(simg, X + Math.cos(a) * hh * 0.24 - sd / 2, Y - hh * 0.98 + Math.sin(a) * hh * 0.07 - sd / 2, sd, sd); } }
  if (e.burnT > 0 && Math.random() < 0.4) addP({ k: 'flame', x: e.x + (Math.random() - 0.5) * vs * 0.3, y: e.y + 0.01, z: rv.z + Math.random() * vs * 0.6, vz: 0.6, life: 0.45, size: 0.06 + vs * 0.035, col: Math.random() < 0.5 ? '#ff9a5a' : '#ff6fa8' });
  if (e.poisonT > 0 && Math.random() < 0.15) addP({ k: 'bubble', x: e.x + (Math.random() - 0.5) * vs * 0.3, y: e.y, z: rv.z + vs * 0.45, vz: 0.4, life: 0.6, size: 0.045, col: e.plague ? '#a58aff' : '#9be86a', ph: Math.random() * 6 });
  if (e.shield > 0 && !(e.E && e.E.ch > 1)) { x.save(); x.globalAlpha = 0.6 + 0.15 * Math.sin(time * 5); x.strokeStyle = '#c8b0ff'; x.lineWidth = Math.max(1, S * 0.035); x.beginPath(); x.ellipse(X, Y - hh * 0.46, hh * 0.5, hh * 0.58, 0, 0, Math.PI * 2); x.stroke(); x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.02); x.beginPath(); x.ellipse(X, Y - hh * 0.46, hh * 0.32, hh * 0.46, 0, 3.6, 4.6); x.stroke(); x.restore(); }
  if (e.stealth && e.revealed) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.5; x.drawImage(glowSpr('#b070ff', 32), X - hh * 0.45, Y - hh * 0.95, hh * 0.9, hh * 0.95); x.restore(); }
  if (e.buffSpdT > 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.4; x.drawImage(glowSpr('#ff5d9e', 32), X - hh * 0.36, Y - hh * 0.85, hh * 0.72, hh * 0.85); x.restore(); }
  // [v1.3] 얼음 갑옷 껍질(녹으면 김), 쌍둥이 왕 기운
  if (e.iceArm) { x.save(); x.globalAlpha = 0.42 + 0.06 * Math.sin(time * 3 + e.anim * 5); x.fillStyle = '#c8f2ff'; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.025); var ir = hh * 0.5, icy = Y - hh * 0.42; x.beginPath(); for (var ia = 0; ia < 8; ia++) { var aa = ia / 8 * Math.PI * 2 - Math.PI / 2, rr = ir * (ia % 2 ? 0.92 : 1.08); x.lineTo(X + Math.cos(aa) * rr, icy + Math.sin(aa) * rr * 1.1); } x.closePath(); x.fill(); x.globalAlpha = 0.9; x.stroke(); x.globalAlpha = 0.8; x.beginPath(); x.moveTo(X - ir * 0.5, icy - ir * 0.55); x.lineTo(X - ir * 0.2, icy - ir * 0.75); x.stroke(); x.restore(); }
  else if (e.E && e.E.iceArmor && e.meltT > 0 && Math.random() < 0.3) addP({ k: 'bubble', x: e.x + (Math.random() - 0.5) * vs * 0.3, y: e.y, z: vs * 0.5, vz: 0.5, life: 0.5, size: 0.04, col: '#e8f8ff', ph: Math.random() * 6 });
  if (e.twin) { var tc = e.twin === 'fire' ? '#ff9a4a' : '#7cc8ff'; x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.35 + 0.12 * Math.sin(time * 3); x.drawImage(glowSpr(tc, 64), X - hh * 0.7, Y - hh * 1.15, hh * 1.4, hh * 1.3); x.restore(); if (Math.random() < 0.3) addP({ k: e.twin === 'fire' ? 'flame' : 'spark', x: e.x + (Math.random() - 0.5) * vs * 0.6, y: e.y, z: Math.random() * vs * 0.8, vz: 0.5, life: 0.5, size: 0.07, col: tc }); }
  if (e.k === 'stalker' && Math.random() < 0.12) addP({ k: 'spark', x: e.x - e.face * 0.15 + (Math.random() - 0.5) * 0.2, y: e.y, z: Math.random() * vs * 0.6, vz: 0.25, life: 0.6, size: 0.05, col: Math.random() < 0.5 ? '#c8b0ff' : '#ffffff' });
  if (e.k === 'barkan' || e.k === 'yotun' || e.k === 'arachne' || e.k === 'grumsh') { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.25 + 0.1 * Math.sin(time * 2); x.drawImage(glowSpr(e.k === 'yotun' ? '#9fdcff' : e.k === 'grumsh' ? '#ff8a6a' : '#9a6bff', 64), X - hh * 0.6, Y - hh * 1.1, hh * 1.2, hh * 1.2); x.restore(); }
  if (e.kneel) { var kp = 0.5 + 0.5 * Math.sin(time * 5); x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.35 + 0.25 * kp; x.drawImage(glowSpr('#ffe8a0', 64), X - S * 0.5, Y - hh * 0.75 - S * 0.5, S, S); x.restore(); x.save(); x.strokeStyle = 'rgba(255,236,170,' + (0.5 + 0.4 * kp) + ')'; x.lineWidth = Math.max(2, S * 0.05); x.beginPath(); x.arc(X, Y - hh * 0.6, S * (0.5 + 0.1 * kp), 0, Math.PI * 2); x.stroke(); x.restore(); }
  if (typeof EN_OVER === 'function') EN_OVER(x, g, e, X, Y, hh, time);   // 덮개 고리: 새 상태(fade, sub, rage, sealT, markT, fearT...) 표시 (X, Y = 몸 발밑 화면 좌표, hh = 키 px)
}
// 광선: 분홍, 레몬, 하늘 세 줄 무지개 띠와 흰 심, 따라 흐르는 별
function drawBeam(x, t, S, time) {
  var e = t.beamTgt, info = towerSpr(t.k, t.lvl, t.br, S), m0 = info.mounts[0], m = [m0[0] * (info.k || 1), m0[1] * (info.k || 1)];
  var X0 = WX(t.x + m[0]), Y0 = WY(t.y + 0.3 + m[1]) + Math.sin(time * 2.2) * S * 0.04, X1 = WX(e.x), Y1 = WY(e.y) - (e.kind === 'obs' ? S * 0.3 : e.fly ? S * (typeof ruFlyZ === 'function' ? ruFlyZ(e) : 0.75) : EH(e) * S * 0.45);
  var f = Math.min(1, t.beamT / t.st.ramp), w = S * (0.03 + f * 0.08), dx = X1 - X0, dy = Y1 - Y0, dL = Math.hypot(dx, dy) || 1, nx = -dy / dL, ny = dx / dL, cols = ['#ff8fc0', '#ffe066', '#7cc8ff'];
  x.lineCap = 'round';
  x.globalAlpha = 0.28 + f * 0.2; x.strokeStyle = '#ffb0d8'; x.lineWidth = w * 3.2; x.beginPath(); x.moveTo(X0, Y0); x.lineTo(X1, Y1); x.stroke();
  x.globalAlpha = 0.95;
  for (var b = 0; b < 3; b++) { var off = (b - 1) * w * 0.6; x.strokeStyle = cols[b]; x.lineWidth = w * 0.72; x.beginPath(); x.moveTo(X0 + nx * off, Y0 + ny * off); x.lineTo(X1 + nx * off, Y1 + ny * off); x.stroke(); }
  x.strokeStyle = '#ffffff'; x.lineWidth = w * 0.32; x.beginPath(); x.moveTo(X0, Y0); x.lineTo(X1, Y1); x.stroke();
  x.globalAlpha = 1; x.lineCap = 'butt';
  var si = fxImg('star', '#ffe066', S * 0.2);
  for (var k = 0; k < 3; k++) { var su = (time * 1.6 + k / 3) % 1, sd = S * (0.09 + f * 0.07) * Math.sin(su * Math.PI); fxBlit(x, si, lerp(X0, X1, su), lerp(Y0, Y1, su), sd, time * 5 + k, 1); }
  x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr('#ff8ad8', 48), X1 - S * (0.2 + f * 0.2), Y1 - S * (0.2 + f * 0.2), S * (0.4 + f * 0.4), S * (0.4 + f * 0.4)); x.globalCompositeOperation = 'source-over';
  fxBlit(x, fxImg('star', '#ff8fc0', S * 0.4), X1, Y1, S * (0.16 + f * 0.14) * (0.9 + 0.1 * Math.sin(time * 20)), time * 3, 1);
  if (Math.random() < 0.3) fxTwinkles(e.x, e.y, e.fly ? (typeof ruFlyZ === 'function' ? ruFlyZ(e) : 0.75) : EH(e) * 0.45, 1, ['#ff8fc0', '#ffe066', '#ffffff'], 1.2, 0.05, 0.25);
}
// ---------- 탄 모양: 탑 단계와 갈래마다 확실히 다르게 (귀염판) ----------
// len 화살 길이, tc 꼬리 색('rainbow' 무지개), ta 꼬리 진하기, tl 꼬리 길이, tw 꼬리 굵기(칸), head 촉 빛, star 맞을 때 별 크기, sc 별 색, tc2 반짝이 색들
var ARROW_ST = {
  1: { len: 0.64, tc: '#ffc6de', ta: 0.75, tl: 0.7, tw: 0.098, head: '#ffd6ea', spr: 'arrow', star: 0.3, sc: '#ff8fc0', tc2: ['#ff8fc0', '#ffffff', '#b9a2ff'] },
  2: { len: 0.7, tc: '#ffb0d2', ta: 0.8, tl: 0.85, tw: 0.104, head: '#ffd6ea', spr: 'arrow', star: 0.36, sc: '#ff8fc0', tc2: ['#ff8fc0', '#ffe066', '#b9a2ff'] },
  3: { len: 0.78, tc: '#ffe066', ta: 0.85, tl: 1.05, tw: 0.117, head: '#fff2a0', spr: 'arrowG', star: 0.42, sc: '#ffd23a', tc2: ['#ffe066', '#ff8fc0', '#ffffff'] },
  '4A': { len: 1.0, tc: '#7cc8ff', ta: 0.9, tl: 1.9, tw: 0.143, head: '#e8f6ff', spr: 'arrowS', star: 0.62, ring: '#9fdcff', sc: '#7cc8ff', tc2: ['#7cc8ff', '#ffffff', '#b9a2ff'] },
  '5A': { len: 1.15, tc: '#8fd4ff', ta: 1, tl: 2.6, tw: 0.182, head: '#ffffff', spr: 'arrowS', star: 0.78, ring: '#bfe6ff', spark: 1, sc: '#7cc8ff', tc2: FX_RAIN },
  '4B': { len: 0.72, tc: '#ff8fc0', ta: 0.85, tl: 1.0, tw: 0.111, head: '#ffc0dc', spr: 'arrowR', star: 0.38, sc: '#ff5d9e', tc2: ['#ff5d9e', '#ff8fc0', '#ffe066'] },
  '5B': { len: 0.8, tc: '#ff5d9e', ta: 0.9, tl: 1.25, tw: 0.13, head: '#ffd6ea', spr: 'arrowR', star: 0.45, spark: 1, sc: '#ff5d9e', tc2: ['#ff5d9e', '#ffe066', '#ffffff'] }
};
function arrowSt(t) { return !t ? ARROW_ST[1] : ARROW_ST[t.lvl >= 4 ? Math.min(5, t.lvl) + (t.br ? 'B' : 'A') : t.lvl] || ARROW_ST[1]; }
var LV_K = [1, 0.85, 1, 1.15, 1.32, 1.5, 1.65];
// 회전한 스프라이트 그리기 (save/restore 없이 변환만 바꿈)
function fxBlit(x, img, X, Y, d, rot, fy) {
  if (rot || fy !== 1) { var c = Math.cos(rot), s = Math.sin(rot); x.setTransform(c, s, -s * fy, c * fy, X, Y); x.drawImage(img, -d / 2, -d / 2, d, d); x.setTransform(1, 0, 0, 1, 0, 0); }
  else x.drawImage(img, X - d / 2, Y - d / 2, d, d);
}
function fxBlitS(x, s, X, Y, ang, sc) { var c = Math.cos(ang) * sc, n = Math.sin(ang) * sc; x.setTransform(c, n, -n, c, X, Y); x.drawImage(s.c, -s.ax, -s.ay); x.setTransform(1, 0, 0, 1, 0, 0); }
function streakAt(x, hx, hy, ang, L, W, col, a) { var c = Math.cos(ang), s = Math.sin(ang); x.globalAlpha = a; x.setTransform(c, s, -s, c, hx, hy); x.drawImage(streakSpr(col), -L, -W / 2, L, W); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; }
// 탑에서 탄이 나가는 자리(높이, 옆 위치): 실제 궁수, 포구에 맞춤
function mountOf(tw, S) {
  var inf = towerSpr(tw.k, tw.lvl, tw.br, S), mts = inf.mounts || [[0, -0.8]], kk = inf.k || 1, mm = tw.k === 'archer' ? mts[(tw.shots != null ? tw.shots : tw.side || 0) % mts.length] || mts[0] : mts[0];   // 궁수 자리는 쏜 횟수로 돌아가며(6단계 화살비 군단은 다섯 자리), 탑 그림의 쏘는 궁수와 같은 번호
  return { xs: mm[0] * kk, zs: -0.3 - mm[1] * kk };
}
function arcH1(p) { return p.tgt && p.tgt.fly ? (typeof ruFlyZ === 'function' ? ruFlyZ(p.tgt) : 0.75) : p.tgt && p.tgt.E ? EH(p.tgt) * 0.42 : p.tgt && p.tgt.size ? p.tgt.size * 0.45 : 0.1; }
function arcAt(p, u) { return lerp(p.h0 || 0, arcH1(p), u) + 4 * p.h * u * (1 - u) + ((p.zs == null ? p.h0 || 0 : p.zs) - (p.h0 || 0)) * (1 - u); }
function arcZ(p) { return arcAt(p, p.u || 0); }
// 기존 탄 종류(이 파일이 그림)
var FD_PROJ_OLD = { arrow: 1, stone: 1, flask: 1, frag: 1, orb: 1, shell: 1, bolt: 1, dart: 1 };
function fdProjDot(x, p, S, col) {
  var X = WX(p.x), Y = WY(p.y) - (p.z || 0) * S, r = S * (0.1 + 0.08 * (p.big || 0));
  x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr(col || '#fff2b0', 32), X - r * 2.2, Y - r * 2.2, r * 4.4, r * 4.4); x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(X, Y, r * 0.55, 0, Math.PI * 2); x.fill();
}
// 아군 유닛(g.units): UNIT_DRAW[kind](x, g, u, S, time), 없으면 빛나는 점
function fdDrawUnits(x, g, S, time) {
  for (var i = 0; i < g.units.length; i++) { var u = g.units[i], f = UNIT_DRAW[u.kind]; if (f) { f(x, g, u, S, time); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.setTransform(1, 0, 0, 1, 0, 0); } else fdProjDot(x, u, S, '#bfe8ff'); }
}
function drawProjectiles(x, g, S, time) {
  var sk = RD.fxSk || 'base';
  for (var pi = 0; pi < g.proj.length; pi++) {
    var p = g.proj[pi], tw = p.src && p.src.tw, lv = p.lvl || (tw && tw.lvl) || 1, k = LV_K[lv] || 1;
    // [v1.3] 능력 카드: 속성 빛, 사선/관통 화살(dart), 파편(frag)
    var elc = p.el && EL_COL[p.el];
    // 등록 고리: PROJ_DRAW[p.kind](x, g, p, S, time). 화면 좌표는 WX(p.x), WY(p.y) - p.z * S
    if (PROJ_DRAW[p.kind]) { PROJ_DRAW[p.kind](x, g, p, S, time); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.setTransform(1, 0, 0, 1, 0, 0); continue; }
    if (!FD_PROJ_OLD[p.kind]) { fdProjDot(x, p, S, elc); continue; }   // 모르는 종류는 빛나는 점
    if (p.kind === 'dart') {
      var dX = WX(p.x), dY = WY(p.y) - (p.h == null ? 0.55 : p.h) * S * 0.9, dst = arrowSt(tw);
      shadowAt(x, dX, WY(p.y), S * 0.07, S * 0.03, 0.25);
      streakAt(x, dX, dY, p.ang, S * 0.5, S * 0.09, elc || fxSkTrail(sk, dst.tc), 0.85);
      fxBlitS(x, fxSpr(dst.spr + (sk === 'base' ? '' : '@' + sk), S), dX, dY, p.ang, dst.len / (sk === 'base' ? 0.525 : 0.5625) * 0.9);
      if (elc) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.75; x.drawImage(glowSpr(elc, 16), dX - S * 0.13, dY - S * 0.13, S * 0.26, S * 0.26); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
      continue;
    }
    if (p.kind === 'frag') {
      var fu = p.u || 0, fz = lerp(p.h0 || 0, 0, fu) + 4 * p.h * fu * (1 - fu), fX = WX(p.x), fY = WY(p.y) - fz * S, fr2 = S * 0.055, fc = elc || (p.fire ? '#ff9a5a' : '#ffc6e0');
      shadowAt(x, fX, WY(p.y), S * 0.05, S * 0.02, 0.25);
      x.fillStyle = fc; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.018); x.beginPath(); x.arc(fX, fY, fr2, 0, Math.PI * 2); x.fill(); x.stroke();
      if (Math.random() < 0.25) addP({ k: 'spark', x: p.x, y: p.y, z: fz, life: 0.25, size: 0.035, col: fc });
      continue;
    }
    if (elc && !RD.lowFx && (p.kind === 'arrow' || p.kind === 'stone' || p.kind === 'flask' || p.kind === 'orb' || p.kind === 'shell') && Math.random() < 0.35) addP({ k: 'spark', x: p.x, y: p.y, z: p.kind === 'orb' ? 1.05 : 0.6, life: 0.3, size: 0.05, col: elc });
    if (p.kind === 'arrow' || p.kind === 'stone' || p.kind === 'flask') {
      if (p.zs == null) { if (tw) { var mo = mountOf(tw, S); p.zs = mo.xs != null ? mo.zs : p.h0; p.xs = tw.k === 'archer' ? mo.xs : 0; } else { p.zs = p.h0 || 0; p.xs = 0; } }
      var u = p.u || 0, off = 1 - u, z = arcAt(p, u), X = WX(p.x + p.xs * off), Y = WY(p.y);
      var u2 = Math.min(1, u + 0.03), z2 = arcAt(p, u2), nx = lerp(p.sx, p.tx, u2) + p.xs * (1 - u2), ny = lerp(p.sy, p.ty, u2);
      var hx = X, hy = Y - z * S, ang = Math.atan2((WY(ny) - z2 * S) - hy, WX(nx) - hx);
      shadowAt(x, X, Y, S * (p.kind === 'arrow' ? 0.08 : 0.12 * k), S * 0.04, 0.3);
      if (p.kind === 'arrow') {
        // 사탕 화살: 리본 꼬리 + 하트/별 촉 (치명타는 무지개 꼬리). 스킨이면 하트 화살, 캔디 화살과 장식 꼬리
        var st = arrowSt(tw), cr = p.crit, sl = st.tl * S * (cr ? 1.3 : 1);
        streakAt(x, hx, hy, ang, sl, st.tw * S * (cr ? 1.5 : 1), cr ? 'rainbow' : fxSkTrail(sk, st.tc), sk === 'base' || cr ? st.ta : Math.max(0.85, st.ta));
        if (sk !== 'base' && !RD.lowFx) fxTrailDeco(x, sk, hx, hy, ang, sl, S, p.t || 0);
        var as = fxSpr((cr ? 'arrowG' : st.spr) + (sk === 'base' ? '' : '@' + sk), S); fxBlitS(x, as, hx, hy, ang, st.len / (sk === 'base' ? 0.525 : 0.5625) * (cr ? 1.1 : 1));
        if (st.head || cr) { var tx = hx + Math.cos(ang) * st.len * S * 0.44, ty = hy + Math.sin(ang) * st.len * S * 0.44, hr = S * (0.06 + st.len * 0.07) * (cr ? 1.5 : 1); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.7; x.drawImage(glowSpr(cr ? '#ffe066' : sk === 'heart' ? '#ffb0d4' : st.head, 16), tx - hr, ty - hr, hr * 2, hr * 2); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
        if ((st.spark || cr) && Math.random() < 0.6) addP({ k: 'spark', x: p.x + p.xs * off, y: p.y, z: z, life: 0.34, size: 0.05, col: fxPick(cr ? FX_RAIN : st.tc2) });
      } else if (p.kind === 'stone') {
        // 사탕 공: 바람개비 무늬가 돌고 반짝이는 그대로
        var big = p.st && p.st.stun, fire = p.st && p.st.zoneDps, ss = fxSpr(big ? 'boulder' : fire ? 'stoneF' : 'stone', S), gs = fxSpr(big ? 'glossB' : fire ? 'glossF' : 'glossS', S);
        streakAt(x, hx, hy, ang, S * (0.45 + 0.18 * lv), S * 0.17 * k, fire ? '#ff9a5a' : big ? 'rainbow' : fxSkTrail(sk, '#ffb0d2'), fire ? 0.8 : 0.7);
        if (sk !== 'base' && !RD.lowFx) fxTrailDeco(x, sk, hx, hy, ang, S * (0.45 + 0.18 * lv), S, p.t || 0);
        fxBlitS(x, ss, hx, hy, p.t * 8, k); fxBlitS(x, gs, hx, hy, 0, k);
        if (fire) {
          x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.7; x.drawImage(glowSpr('#ff9a4a', 32), hx - S * 0.22 * k, hy - S * 0.22 * k, S * 0.44 * k, S * 0.44 * k); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
          if (Math.random() < 0.7) addP({ k: 'flame', x: p.x, y: p.y, z: z, vz: 0.2, life: 0.35, size: 0.085 * k, col: Math.random() < 0.5 ? '#ff9a5a' : '#ff6fa8' });
          if (Math.random() < 0.3) addP({ k: 'spark', x: p.x, y: p.y, z: z, life: 0.3, size: 0.045, col: '#ffe066' });
        } else if (Math.random() < 0.3) addP({ k: 'spark', x: p.x, y: p.y, z: z, life: 0.32, size: 0.04 * k, col: fxPick(FX_CANDY) });
      } else {
        // 물약 공: 빙글 돌며 방울을 흘림
        var fl = p.br === 1 && lv >= 4, fa = !fl && lv >= 4, lc = fl ? '#a58aff' : fa ? '#ffe066' : '#9be86a', fs = fxSpr(fl ? 'flaskP' : fa ? 'flaskA' : 'flask', S);
        streakAt(x, hx, hy, ang, S * (0.4 + 0.12 * lv), S * 0.12 * k, sk === 'base' ? lc : fxSkTrail(sk, lc), 0.62);
        if (sk !== 'base' && !RD.lowFx) fxTrailDeco(x, sk, hx, hy, ang, S * (0.4 + 0.12 * lv), S * 0.85, p.t || 0);
        fxBlitS(x, fs, hx, hy, p.t * 6, k);
        if (Math.random() < 0.35) addP({ k: 'bubble', x: p.x, y: p.y, z: z, vz: 0.3, life: 0.45, size: 0.035 * k, col: lc, ph: Math.random() * 6 });
      }
    } else if (p.kind === 'orb') {
      // 별 마법탄: 자두색 테두리의 진한 보라 구슬 속에서 도는 레몬 별 (밝은 바탕에서도 잘 보이게)
      var X2 = WX(p.x), Y2 = WY(p.y), ob = fxOrbSpr(S, lv, sk), r0 = ob.r, a0 = p.lx != null ? Math.atan2(Y2 - p.ly, X2 - p.lx) : 0;
      if (p.lx != null) { streakAt(x, X2, Y2, a0, S * (0.42 + 0.15 * lv), r0 * 1.5, fxSkTrail(sk, '#a585ff'), 0.85); if (sk !== 'base' && !RD.lowFx) fxTrailDeco(x, sk, X2, Y2, a0, S * (0.42 + 0.15 * lv), S * 0.9, p.t || 0); }
      p.lx = X2; p.ly = Y2;
      x.drawImage(ob.c, X2 - ob.m, Y2 - ob.m);
      fxBlit(x, fxImg(sk === 'heart' ? 'heart' : 'star', sk === 'heart' ? '#ffffff' : '#ffe066', r0 * 1.6), X2, Y2, r0 * 1.25, time * 5 + (p.t || 0) * 3, 1);
      if (Math.random() < 0.5 + lv * 0.1) addP({ k: 'spark', x: p.x, y: p.y + 0.0, z: 0, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, life: 0.34, size: 0.045 + lv * 0.008, col: fxPick(['#c8b0ff', '#ff8fc0', '#7cc8ff', '#ffe066']), screen: 1 });
    } else if (p.kind === 'shell') {
      // 만화 폭탄: 뒤뚱거리며 날고 심지가 반짝
      var X3 = WX(p.x), Y3 = WY(p.y), huge = lv >= 4 && p.br === 0, many = lv >= 4 && p.br === 1, sh = fxSpr(huge ? 'shellH' : many ? 'shellM' : 'shell', S), ks = k * (huge ? 1.25 : many ? 0.8 : 1), a3 = p.lx != null ? Math.atan2(Y3 - p.ly, X3 - p.lx) : 0;
      if (p.lx != null) { streakAt(x, X3, Y3, a3, S * (0.4 + 0.12 * lv), S * 0.11 * ks, huge ? '#ff8fc0' : fxSkTrail(sk, '#c8b8ff'), 0.7); if (sk !== 'base' && !RD.lowFx) fxTrailDeco(x, sk, X3, Y3, a3, S * (0.4 + 0.12 * lv), S * 0.9, p.t || 0); }
      p.lx = X3; p.ly = Y3;
      var wob = Math.sin((p.t || 0) * 18) * 0.18, cw = Math.cos(wob), sw = Math.sin(wob);
      fxBlitS(x, sh, X3, Y3, wob, ks);
      var fx3 = X3 + (sh.fx * cw - sh.fy * sw) * ks, fy3 = Y3 + (sh.fx * sw + sh.fy * cw) * ks, fr3 = S * 0.075 * ks * (0.8 + Math.random() * 0.4);
      x.globalCompositeOperation = 'lighter'; x.drawImage(glowSpr('#ffd060', 16), fx3 - fr3, fy3 - fr3, fr3 * 2, fr3 * 2); x.globalCompositeOperation = 'source-over';
      x.drawImage(fxImg('twk', '#ffe066', fr3 * 2), fx3 - fr3, fy3 - fr3, fr3 * 2, fr3 * 2);
      if (Math.random() < 0.45) addP({ k: 'puff', x: p.x, y: p.y, z: 0, vz: 0.05, life: 0.4, size: 0.06 * ks, col: '#fff6ee', a: 0.55, screen: 1 });
    } else if (p.kind === 'bolt') {
      // 사탕 막대 노포 화살
      var X4 = WX(p.x), Y4 = WY(p.y), heavy = lv >= 4 && p.br === 0, fast = lv >= 4 && p.br === 1, bs = fxSpr((heavy ? 'boltH' : fast ? 'boltF' : 'bolt') + (sk === 'base' ? '' : '@' + sk), S), kb = k * (heavy ? 1.15 : 1), a4 = Math.atan2(p.vy, p.vx);
      streakAt(x, X4, Y4, a4, S * (0.7 + 0.28 * lv), S * (0.08 + 0.015 * lv), heavy ? 'rainbow' : fxSkTrail(sk, fast ? '#9fd8ff' : '#ffc6de'), 0.75 + lv * 0.04);
      if (sk !== 'base' && !RD.lowFx) fxTrailDeco(x, sk, X4, Y4, a4, S * (0.7 + 0.28 * lv), S, p.t || 0);
      fxBlitS(x, bs, X4, Y4, a4, kb);
      if (heavy) { x.globalCompositeOperation = 'lighter'; var hr4 = S * 0.12 * kb; x.drawImage(glowSpr('#fff0c0', 16), X4 + Math.cos(a4) * S * 0.35 * kb - hr4, Y4 + Math.sin(a4) * S * 0.35 * kb - hr4, hr4 * 2, hr4 * 2); x.globalCompositeOperation = 'source-over'; if (Math.random() < 0.5) addP({ k: 'spark', x: p.x, y: p.y, z: 0, life: 0.28, size: 0.05, col: fxPick(FX_RAIN), screen: 1 }); }
    }
  }
}
// ---------- 입자 그리기 ----------
// 글자 캔버스: 자두색 바깥 테두리(아래로 살짝 두껍게) + 흰 안쪽 테두리 + 사탕 색 ('crit'은 레몬에서 분홍으로)
function fxTextC(txt, fs, fill, cv) {
  var lw = Math.max(2, Math.round(fs * 0.15)), c = cv || document.createElement('canvas'), x = c.getContext('2d'), font = fs + 'px CUTE, PRT, sans-serif';
  x.font = font; var w = Math.ceil(x.measureText(txt).width + lw * 4 + 4); c.width = w; c.height = Math.ceil(fs * 1.3 + lw * 5);
  x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  var cx = w / 2, cy = c.height / 2 - lw * 0.3;
  x.strokeStyle = '#4a2a5a'; x.lineWidth = lw * 3; x.strokeText(txt, cx, cy + lw * 0.8); x.strokeText(txt, cx, cy);
  x.strokeStyle = '#ffffff'; x.lineWidth = lw * 1.3; x.strokeText(txt, cx, cy);
  if (fill === 'crit') { var g = x.createLinearGradient(0, cy - fs * 0.42, 0, cy + fs * 0.42); g.addColorStop(0, '#fff7a8'); g.addColorStop(0.45, '#ffd23a'); g.addColorStop(1, '#ff5d9e'); x.fillStyle = g; }
  else x.fillStyle = fill;
  x.fillText(txt, cx, cy);
  return c;
}
// 모양 입자 종류 → 스프라이트 모양, 기본 색
var FX_SK = { star: 'star', twk: 'twk', spark: 'twk', heart: 'heart', puff: 'puff', smoke: 'puff', conf: 'conf', debris: 'conf', flake: 'flake', shard: 'flake', flame: 'flame', bubble: 'bubble', drop: 'drop', pop: 'pop', candy: 'candy', flower: 'flower', hpop: 'heart' };
var FX_DEF = { star: '#ffe066', twk: '#ffffff', spark: '#ffffff', heart: '#ff8fc0', puff: '#fff6ee', smoke: '#fff6ee', conf: '#ff8fc0', debris: '#ffb38a', flake: '#9fd4ff', shard: '#9fd4ff', flame: '#ff9a5a', bubble: '#9be86a', drop: '#9be86a', pop: '#ffd6ea', candy: '#ff8fc0', flower: '#ff9a5a', hpop: '#ff5d9e' };
function drawParts(x, S, dt, time) {
  updateParts(dt);
  for (var i = 0; i < PARTS.length; i++) {
    var p = PARTS[i], dl = p.dl || 0;
    if (p.t < dl) continue;
    var tt = p.t - dl, u = tt / (p.life - dl), X = WX(p.x), Y = WY(p.y) - (p.screen ? 0 : (p.z || 0) * S), sk = FX_SK[p.k];
    if (sk) {
      // 미리 그린 모양 하나를 크기, 회전, 투명도만 바꿔 붙임
      var ps = p.size * S * 2, d = ps, a = 1, rot = p.rot || 0, fy = 1, kq;
      if (p.k === 'star') { kq = tt < 0.12 ? easeBack(tt / 0.12) : 1; d = ps * kq * (u > 0.6 ? 1 - (u - 0.6) / 0.4 * 0.7 : 1); a = u > 0.75 ? (1 - u) / 0.25 : 1; }
      else if (p.k === 'twk') { d = ps * (u < 0.3 ? easeOut(u / 0.3) : 1 - (u - 0.3) / 0.7 * 0.85); }
      else if (p.k === 'spark') { d = ps * (1 - u * 0.6); a = 1 - u * u; }
      else if (p.k === 'heart') { kq = tt < 0.16 ? easeBack(tt / 0.16) : 1; d = ps * kq; X += Math.sin(tt * 7 + (p.ph || 0)) * S * 0.06; rot = Math.sin(tt * 6 + (p.ph || 0)) * 0.25; a = u > 0.7 ? (1 - u) / 0.3 : 1; }
      else if (p.k === 'puff' || p.k === 'smoke') { d = ps * (tt < 0.1 ? 0.25 + 0.75 * easeBack(tt / 0.1) : u < 0.5 ? 1 : 1 - easeIn((u - 0.5) / 0.5) * 0.85); a = (u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25) * (p.a || 1); rot = 0; }
      else if (p.k === 'conf' || p.k === 'debris') { fy = Math.cos(tt * (p.fl || 12) + (p.ph || 0)); a = u > 0.75 ? (1 - u) / 0.25 : 1; }
      else if (p.k === 'flake' || p.k === 'shard') { d = ps * (tt < 0.1 ? easeBack(tt / 0.1) : 1 - Math.max(0, (u - 0.6) / 0.4) * 0.6); a = u > 0.6 ? (1 - u) / 0.4 : 1; }
      else if (p.k === 'flame') { if (p.soft === 2) { d = ps * (0.5 + 0.75 * easeOut(u)); a = 0.85 * (1 - u * u); rot = 0; } else { d = ps * (u < 0.2 ? 0.5 + easeOut(u / 0.2) * 0.5 : 1 - (u - 0.2) / 0.8 * 0.65); a = 1 - u * u * 0.9; rot = Math.sin(tt * 20 + (p.ph || 0)) * 0.12; } }
      else if (p.k === 'bubble') { d = ps * (u < 0.15 ? easeOut(u / 0.15) : u > 0.85 ? 1 + (u - 0.85) / 0.15 * 0.35 : 1); a = u > 0.85 ? (1 - u) / 0.15 : 0.95; X += Math.sin(tt * 6 + (p.ph || 0)) * S * 0.03; rot = 0; }
      else if (p.k === 'drop') { d = ps * (1 - u * 0.35); a = u > 0.7 ? (1 - u) / 0.3 : 1; rot = 0; }
      else if (p.k === 'pop') { d = ps * (0.45 + 0.75 * easeOut(u)); a = u < 0.5 ? 1 : (1 - u) / 0.5; }
      else if (p.k === 'candy') { d = ps * (tt < 0.1 ? 0.4 + 0.6 * easeBack(tt / 0.1) : 1); a = u > 0.75 ? (1 - u) / 0.25 : 1; }
      else if (p.k === 'flower') { d = ps * (tt < 0.12 ? easeBack(tt / 0.12) * 1.15 : 1.15 - u * 0.45); a = u > 0.55 ? (1 - u) / 0.45 : 1; }
      else if (p.k === 'hpop') { d = ps * (tt < 0.1 ? easeBack(tt / 0.1) * 1.25 : 1.25 - easeIn(u) * 0.75); a = u > 0.6 ? (1 - u) / 0.4 : 1; Y -= easeOut(u) * S * 0.18; }
      if (d < 0.5 || a <= 0.01) continue;
      var img = p.img || (p.img = fxImg(p.soft ? (p.soft === 2 ? 'fireB' : 'flameS') : sk, p.col || FX_DEF[p.k], ps * 1.6));
      x.globalAlpha = a > 1 ? 1 : a;
      if (rot || fy !== 1) { var cr = Math.cos(rot), sr = Math.sin(rot); x.setTransform(cr, sr, -sr * fy, cr * fy, X, Y); x.drawImage(img, -d / 2, -d / 2, d, d); x.setTransform(1, 0, 0, 1, 0, 0); }
      else x.drawImage(img, X - d / 2, Y - d / 2, d, d);
      continue;
    }
    if (p.k === 'sring') {
      // 구운 고리: 퍼지면서 굵은 → 가는 그림으로 바꿔 그림 (땅이면 납작한 타원)
      var ue = easeOut(u), rr2 = p.r * S * (0.3 + 0.75 * ue), D2 = rr2 / 0.44, fk = p.flat ? 0.62 : 1;
      x.globalAlpha = u < 0.2 ? 1 : (1 - u) / 0.8; x.drawImage(fxRingSpr(p.col, u < 0.3 ? 0 : u < 0.62 ? 1 : 2), X - D2 / 2, Y - D2 * fk / 2, D2, D2 * fk);
    } else if (p.k === 'ray') {
      var rl = p.len * S * easeOut(Math.min(1, u * 2.4)), rw = p.w * S * (1 - u * 0.5), rc = Math.cos(p.ang), rs = Math.sin(p.ang);
      x.globalAlpha = u < 0.45 ? 1 : (1 - u) / 0.55; x.setTransform(rc, rs, -rs, rc, X, Y); x.drawImage(fxRaySpr(), p.off * S, -rw / 2, rl, rw); x.setTransform(1, 0, 0, 1, 0, 0);
    } else if (p.k === 'stk') {
      // 글자 스티커: 통! 튀어나와 살짝 흔들리다 떠오르며 사라짐
      var sc0 = tt < 0.16 ? easeBack(tt / 0.16) : 1, sa0 = 1;
      if (u > 0.72) { sa0 = (1 - u) / 0.28; sc0 *= 1 + (u - 0.72) * 0.5; }
      if (p.out != null) { var ou = (p.t - p.out) / 0.12; if (ou >= 1) { p.life = p.t; continue; } sa0 *= 1 - ou; }
      var sw0 = p.img.width * sc0, sh0 = p.img.height * sc0, srt = (p.rot || 0) + Math.sin(tt * 13) * 0.06 * Math.max(0, 1 - tt * 2.5), sY = WY(p.y) - ((p.z || 0) + easeOut(Math.min(1, u * 1.5)) * (p.rise || 0.35)) * S;
      if (sw0 > 0.5) { x.globalAlpha = sa0; var sc1 = Math.cos(srt), ss1 = Math.sin(srt); x.setTransform(sc1, ss1, -ss1, sc1, X, sY); x.drawImage(p.img, -sw0 / 2, -sh0 / 2, sw0, sh0); x.setTransform(1, 0, 0, 1, 0, 0); }
    } else if (p.k === 'ring') {
      // 통통 튀듯 퍼지는 두 겹 고리
      var rr = p.r * S * (0.28 + 0.8 * easeBack(Math.min(1, u * 1.3))), lw = Math.max(1.5, p.w * S * (1 - u * 0.6));
      x.globalAlpha = 0.85 * (1 - u); x.beginPath(); x.ellipse(X, Y, rr, rr * 0.62, 0, 0, 6.2832);
      x.strokeStyle = p.col; x.lineWidth = lw; x.stroke(); x.strokeStyle = '#ffffff'; x.lineWidth = lw * 0.4; x.stroke();
    } else if (p.k === 'flash') {
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = (1 - u) * 0.75; var r5 = p.size * S * (0.7 + u * 0.6); x.drawImage(glowSpr(p.col, 48), X - r5, Y - r5, r5 * 2, r5 * 2); x.globalCompositeOperation = 'source-over';
    } else if (p.k === 'text') {
      if (!p.cv) p.cv = fxTextC(p.txt, Math.round(S * (p.big ? 0.3 : 0.22)), p.col); // 글자는 한 번만 그려 둠
      var kt = tt < 0.2 ? easeBack(tt / 0.2) : 1, tw0 = p.cv.width * kt, th0 = p.cv.height * kt;
      x.globalAlpha = u < 0.7 ? 1 : (1 - u) / 0.3; x.drawImage(p.cv, X - tw0 / 2, Y - th0 * 0.7, tw0, th0);
    } else if (p.k === 'num') {
      // 숫자는 바뀔 때만 작은 캔버스에 한 번 그려 두고 매 프레임은 붙이기만 (글자 그리기가 비쌈)
      var pu = p.pop || 0; if (pu > 0) p.pop = Math.max(0, pu - dt * 5);
      var tx = Math.round(p.v) + (p.crit ? '!' : ''), nst = p.crit ? 'rain' : p.sty || 'peach';
      // 글자 크기는 작은 칸(28.7px)에서도 11px 아래로는 안 줄어듦
      if (p.ck !== tx + nst) { p.cv = fxNumC(tx, Math.round(Math.max(S * (0.25 + Math.min(0.12, Math.log(1 + p.v) * 0.022)), 11 * RD.view.dpr) * (p.crit ? 1.5 : 1)), nst, p.cv); p.ck = tx + nst; }
      // 통통 튀어 오르며 커졌다 작아짐 (치명타는 더 높이, 더 크게), 땅에 닿을 때 살짝 눌림
      var age = p.t - (p.ct || 0), hv = p.crit ? 3.2 : 2.5, ks = (age < 0.08 ? 0.3 + age / 0.08 * 1.15 : 1 + 0.38 * Math.exp(-(age - 0.08) * 11) * Math.cos((age - 0.08) * 26)) + pu * 0.3;
      if (u > 0.82) ks *= 1 - (u - 0.82) / 0.18 * 0.35;
      var nT = 2 * hv / 13, nd = age - nT, nsx = 1, nsy = 1; if (nd >= 0 && nd < 0.09) { var nq = Math.sin(nd / 0.09 * Math.PI); nsx = 1 + 0.16 * nq; nsy = 1 - 0.16 * nq; }
      var zz = p.z + fxHop(age, hv, 13) + Math.max(0, u - 0.45) * 0.45, Yn = WY(p.y) - zz * S, cw = p.cv.width * ks * nsx, ch = p.cv.height * ks * nsy, nr = (p.rot0 || 0) * Math.max(0, 1 - age * 3);
      x.globalAlpha = u < 0.68 ? 1 : (1 - u) / 0.32;
      if (nr) { var nc = Math.cos(nr), ns = Math.sin(nr); x.setTransform(nc, ns, -ns, nc, X, Yn); x.drawImage(p.cv, -cw / 2, -ch / 2, cw, ch); x.setTransform(1, 0, 0, 1, 0, 0); }
      else x.drawImage(p.cv, X - cw / 2, Yn - ch / 2, cw, ch);
    } else if (p.k === 'gtxt') {
      // 금화 +N: 동전 그림과 함께 통 튀어나오고 위로 떠오름 (잇달아 잡으면 숫자가 합쳐지며 다시 통)
      var gp2 = p.pop || 0; if (gp2 > 0) p.pop = Math.max(0, gp2 - dt * 4.5);
      var gs = '+' + p.v;
      if (p.ck !== gs) {
        var gf = Math.round(Math.max(S * (p.big ? 0.36 : 0.29), (p.big ? 13 : 11) * RD.view.dpr)), glw = Math.max(2, Math.round(gf * 0.2)), gic = Math.round(gf * 0.95);
        var gcv = p.cv || (p.cv = document.createElement('canvas')), gcx = gcv.getContext('2d'); gcx.font = gf + 'px CUTE, PRT, sans-serif';
        var gtw = Math.ceil(gcx.measureText(gs).width); gcv.width = gic + gtw + glw * 2 + Math.round(gf * 0.15) + 4; gcv.height = Math.ceil(Math.max(gf * 1.3, gic) + glw * 2);
        var gcy = gcv.height / 2, gx0 = glw + gic + Math.round(gf * 0.12);
        gcx.drawImage(coinSpr(gic), glw - 1, gcy - gic / 2 - 1);
        gcx.font = gf + 'px CUTE, PRT, sans-serif'; gcx.textBaseline = 'middle'; gcx.lineJoin = 'round'; gcx.lineWidth = glw * 1.5; gcx.strokeStyle = '#4a2a5a'; gcx.strokeText(gs, gx0, gcy + gf * 0.04);
        gcx.lineWidth = glw * 0.6; gcx.strokeStyle = '#ffffff'; gcx.strokeText(gs, gx0, gcy + gf * 0.04);
        var ggr = gcx.createLinearGradient(0, gcy - gf * 0.45, 0, gcy + gf * 0.45); ggr.addColorStop(0, '#fffbe2'); ggr.addColorStop(0.5, '#ffe15a'); ggr.addColorStop(1, '#ffad24');
        gcx.fillStyle = ggr; gcx.fillText(gs, gx0, gcy + gf * 0.04); p.ck = gs;
      }
      var gz = p.z + easeOut(Math.min(1, u * 1.5)) * 0.5, gY = WY(p.y) - gz * S, gk = (u < 0.1 ? 0.5 + u * 7 : Math.max(1, 1.2 - (u - 0.1) * 2)) + gp2 * 0.3, gw = p.cv.width * gk, gh = p.cv.height * gk;
      x.globalAlpha = u < 0.7 ? 1 : (1 - u) / 0.3; x.drawImage(p.cv, X - gw / 2, gY - gh / 2, gw, gh);
    } else if (p.k === 'pillar') {
      var a7 = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85, wv = p.w * S * (0.55 + 0.45 * (1 - u)), hv = S * 3.4;
      x.globalAlpha = a7 * 0.85; x.drawImage(fxPillarSpr(p.col), X - wv / 2, Y - hv, wv, hv);
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = a7 * 0.6; x.drawImage(glowSpr(p.col, 64), X - wv, Y - wv * 0.45, wv * 2, wv * 0.9); x.globalCompositeOperation = 'source-over';
    } else if (p.k === 'poof') {
      // 처치: 꾹 눌림 → 쭉 늘어나며 하얘짐 → 작아지며 펑
      var s = p.spr, w = p.wh, sx, sy, wa, aa = 1, pv = 0;
      if (u < 0.38) { var q1 = easeOut(u / 0.38); sx = 1 + 0.38 * q1; sy = 1 - 0.38 * q1; wa = 0.3 * q1; }
      else if (u < 0.72) { var q2 = easeOut((u - 0.38) / 0.34); sx = 1.38 - 0.6 * q2; sy = 0.62 + 0.7 * q2; wa = 0.3 + 0.55 * q2; }
      else { var q3 = (u - 0.72) / 0.28; sx = 0.78 * (1 - q3 * 0.75); sy = 1.32 * (1 - q3 * 0.8); wa = 0.85; aa = 1 - q3 * q3; pv = q3 * 0.45; }
      var Yb = WY(p.y) - (p.fly ? S * 0.75 : 0), hgt = s.ay * pv;
      if (p.top) { var ca = Math.cos(p.ang), sa = Math.sin(p.ang); x.setTransform(ca * sx, sa * sx, -sa * sy, ca * sy, X, Yb); x.globalAlpha = aa; x.drawImage(s.c, -s.ax, -s.ay * 0.75); if (w) { x.globalAlpha = aa * wa; x.drawImage(w.c, -w.ax, -w.ay * 0.75); } }
      else { x.setTransform((p.face < 0 ? -1 : 1) * sx, 0, 0, sy, X, Yb - hgt); x.globalAlpha = aa; x.drawImage(s.c, -s.ax, -s.ay + hgt); if (w) { x.globalAlpha = aa * wa; x.drawImage(w.c, -w.ax, -w.ay + hgt); } }
      x.setTransform(1, 0, 0, 1, 0, 0);
    } else if (p.k === 'bheart') {
      // 성이 맞음: 하트가 통 튀어나와 떨다가 둘로 쪼개져 떨어짐
      var hd = p.size * S * 2;
      if (u < 0.38) { var kh = tt < 0.15 ? easeBack(tt / 0.15) : 1, shk = u > 0.22 ? Math.sin(tt * 70) * S * 0.025 : 0, hi = fxImg('heart', '#ff5d9e', hd); x.globalAlpha = 1; x.drawImage(hi, X - hd * kh / 2 + shk, Y - hd * kh / 2, hd * kh, hd * kh); }
      else { var qh = (u - 0.38) / 0.62, hdx = qh * S * 0.35, hdy = qh * qh * S * 0.9; x.globalAlpha = 1 - qh * qh; fxBlit(x, fxImg('heartL', '#ff5d9e', hd), X - hdx, Y + hdy, hd, -qh * 0.7, 1); fxBlit(x, fxImg('heartR', '#ff5d9e', hd), X + hdx, Y + hdy, hd, qh * 0.7, 1); }
    } else if (p.k === 'zap') {
      // 파스텔 번개: 한 번 흔든 길을 세 겹(라벤더, 하늘, 흰 심)으로
      var pts = p.pts, jit = S * 0.16, path = new Path2D();
      for (var kz = 0; kz < pts.length - 1; kz++) { var b0 = pts[kz], b1 = pts[kz + 1]; if (!kz) path.moveTo(WX(b0[0]), WY(b0[1])); for (var sg = 1; sg <= 5; sg++) { var t2 = sg / 5, jx = sg < 5 ? (Math.random() - 0.5) * jit : 0, jy = sg < 5 ? (Math.random() - 0.5) * jit : 0; path.lineTo(WX(lerp(b0[0], b1[0], t2)) + jx, WY(lerp(b0[1], b1[1], t2)) + jy); } }
      var lz = S * 0.1 * (0.7 + (p.lvl || 4) * 0.12);
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.globalAlpha = 0.5 * (1 - u); x.strokeStyle = '#b9a2ff'; x.lineWidth = lz * 1.6; x.stroke(path);
      x.globalAlpha = 0.95 * (1 - u); x.strokeStyle = '#7cc8ff'; x.lineWidth = lz * 0.8; x.stroke(path);
      x.globalAlpha = 1 - u; x.strokeStyle = '#ffffff'; x.lineWidth = lz * 0.32; x.stroke(path);
      x.lineCap = 'butt'; x.lineJoin = 'miter';
    } else if (p.k === 'rainArrow') {
      if (p.t < p.delay - 0.35) continue;
      var f = clamp((p.t - (p.delay - 0.35)) / 0.35, 0, 1), hz = (1 - f) * 3.2;
      // 크게, 무지개 꼬리를 달고 떨어짐
      var ra = Math.atan2(3.2, 0.9), rx = X - (1 - f) * S * 0.9, ry = WY(p.y) - hz * S;
      streakAt(x, rx, ry, ra, S * 1.3, S * 0.1, 'rainbow', 0.85);
      fxBlitS(x, fxSpr(RD.fxSk && RD.fxSk !== 'base' ? 'arrowG@' + RD.fxSk : 'arrowG', S), rx, ry, ra, 1.45);
    } else if (p.k === 'lastArrow') {
      // 최후의 화살: 여섯 빛깔 무지개 빛줄기 (딤 위에서 빛나는 넓은 빛 띠, 남는 궤적)
      var X0 = WX(p.x0), Y0 = WY(p.y0) - S * 0.5, X1 = WX(p.x1), Y1 = WY(p.y1) - S * 0.5, ff = easeOut(Math.min(1, u * 3)), hx = lerp(X0, X1, ff), hy = lerp(Y0, Y1, ff);
      var ldx = hx - X0, ldy = hy - Y0, lL = Math.hypot(ldx, ldy) || 1, lnx = -ldy / lL, lny = ldx / lL, bw = S * 0.14 * (1 - u * 0.5);
      x.lineCap = 'round';
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.45 * (1 - u) * (1 - u); x.strokeStyle = '#ff8fc8'; x.lineWidth = S * 1.5 * (1 - u * 0.4); x.beginPath(); x.moveTo(X0, Y0); x.lineTo(hx, hy); x.stroke(); x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 0.4 * (1 - u); x.strokeStyle = '#ffd6ea'; x.lineWidth = S * 1.0 * (1 - u * 0.5); x.beginPath(); x.moveTo(X0, Y0); x.lineTo(hx, hy); x.stroke();
      x.globalAlpha = 0.92 * (1 - u); x.lineWidth = bw * 1.08;
      for (var rb = 0; rb < 6; rb++) { var ro = (rb - 2.5) * bw; x.strokeStyle = FX_RAIN[rb]; x.beginPath(); x.moveTo(X0 + lnx * ro, Y0 + lny * ro); x.lineTo(hx + lnx * ro, hy + lny * ro); x.stroke(); }
      x.globalAlpha = 1 - u; x.strokeStyle = '#ffffff'; x.lineWidth = bw * 0.9; x.beginPath(); x.moveTo(X0, Y0); x.lineTo(hx, hy); x.stroke();
      x.lineCap = 'butt';
      if (u < 0.4) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 1; x.drawImage(glowSpr('#ffe8f4', 64), hx - S * 0.8, hy - S * 0.8, S * 1.6, S * 1.6); x.globalCompositeOperation = 'source-over'; if (Math.random() < 0.8) fxStar1(lerp(p.x0, p.x1, ff), lerp(p.y0, p.y1, ff), 0.5, 0.14, fxPick(FX_RAIN), 0.35); }
    }
  }
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
}
function drawSelectionGround(x, g, S) {
  var sel = UIS.sel;
  if (UIS.gridHint > 0 || (sel && sel.kind === 'cell') || UIS.aim === null && sel) {
    // 건설 가능한 칸 표시: 고른 탑의 자리(땅, 물)에 맞는 칸을 은은히 (render_units.js)
    ruBuildHint(x, g, S);
  }
  if (UIS.tutCell && !sel) {
    var tc = UIS.tutCell, tp = 0.5 + 0.5 * Math.sin(RD.time * 5);
    x.save(); x.fillStyle = 'rgba(255,224,102,' + (0.14 + tp * 0.16) + ')'; x.fillRect(WX(tc[0]) + S * 0.06, WY(tc[1]) + S * 0.06, S * 0.88, S * 0.88);
    x.strokeStyle = 'rgba(255,240,170,' + (0.55 + tp * 0.45) + ')'; x.lineWidth = Math.max(2, S * 0.05); x.strokeRect(WX(tc[0]) + S * 0.06, WY(tc[1]) + S * 0.06, S * 0.88, S * 0.88); x.restore();
  }
  if (!sel) return;
  var cx = sel.kind === 'cell' ? sel.c + 0.5 : sel.t.x, cy = sel.kind === 'cell' ? sel.r + 0.5 : sel.t.y;
  var rng = 0;
  if (sel.kind === 'tower') { rng = sel.t.st.range || 0; if (UIS.preview) { var ps = towerStats(sel.t.k, UIS.preview.lvl, UIS.preview.br); rng = (ps.range || 0) * (sel.t.k === 'bell' ? 1 : g.rangeMod * (1 + (g.R.trng[sel.t.k] || 0))); } }
  else if (UIS.preview) rng = (towerStats(UIS.preview.type, 1, 0).range || 0) * (UIS.preview.type === 'bell' ? 1 : g.rangeMod * (1 + (g.R.trng[UIS.preview.type] || 0)));
  if (rng >= 20) {
    // v2.0.1: 판 전체가 사거리인 탑(사거리 30)은 화면보다 큰 원 대신 판 테두리 점선과 탑 둘레 고리로 보여 준다
    var wx0 = WX(0), wy0 = WY(0), ww = WX(RD.cols) - wx0, wh = WY(RD.rows) - wy0, br0 = 0.5 + 0.5 * Math.sin(RD.time * 2.4), ins = S * 0.1;
    x.save();
    x.fillStyle = 'rgba(255,111,168,' + (0.05 + 0.03 * br0).toFixed(3) + ')'; x.fillRect(wx0, wy0, ww, wh);
    x.strokeStyle = 'rgba(232,51,126,' + (0.5 + 0.18 * br0).toFixed(3) + ')'; x.lineWidth = Math.max(2, S * 0.065); x.strokeRect(wx0 + ins, wy0 + ins, ww - ins * 2, wh - ins * 2);
    x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1.5, S * 0.035); x.setLineDash([S * 0.16, S * 0.1]); x.lineDashOffset = -RD.time * S * 0.25; x.strokeRect(wx0 + ins, wy0 + ins, ww - ins * 2, wh - ins * 2);
    x.setLineDash([]); x.strokeStyle = 'rgba(232,51,126,0.85)'; x.lineWidth = Math.max(2, S * 0.06); x.beginPath(); x.arc(WX(cx), WY(cy), S * (0.62 + 0.05 * br0), 0, Math.PI * 2); x.stroke();
    x.restore();
  } else if (rng && rdRadarOf(g, sel)) {
    rdRadar(x, g, S, WX(cx), WY(cy), rdRadarOf(g, sel) * S, cx, cy);   // v2.3: 숨은 적을 보는 탑은 레이더 모양 범위
  } else if (rng) {
    // 사거리 원: 옅은 분홍 반투명 채움(가장자리 쪽이 조금 진함)이 천천히 숨 쉬고, 진분홍 띠 위로 흰 점선이 돎
    var X = WX(cx), Y = WY(cy), R = rng * S, br = 0.5 + 0.5 * Math.sin(RD.time * 2.4), rg = x.createRadialGradient(X, Y, R * 0.2, X, Y, R);
    rg.addColorStop(0, 'rgba(255,111,168,' + (0.1 + 0.05 * br).toFixed(3) + ')'); rg.addColorStop(0.8, 'rgba(255,111,168,' + (0.18 + 0.07 * br).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(255,111,168,' + (0.28 + 0.08 * br).toFixed(3) + ')');
    x.save(); x.fillStyle = rg; x.beginPath(); x.arc(X, Y, R, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(232,51,126,' + (0.5 + 0.18 * br).toFixed(3) + ')'; x.lineWidth = Math.max(2, S * 0.065); x.stroke();
    x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1.5, S * 0.035); x.setLineDash([S * 0.16, S * 0.1]); x.lineDashOffset = -RD.time * S * 0.25; x.stroke(); x.restore();
  }
  if (sel.kind === 'tower' && !UIS.preview) {
    // v2.3: 모든 탑 곁 STEALTH_NEAR칸은 숨은 적이 드러나는 자리 → 옅은 초록 고리
    var NX = WX(cx), NY = WY(cy), NR = STEALTH_NEAR * S;
    x.save(); x.strokeStyle = 'rgba(80,240,150,0.55)'; x.lineWidth = Math.max(1.5, S * 0.03); x.setLineDash([S * 0.08, S * 0.08]); x.lineDashOffset = RD.time * S * 0.2;
    x.beginPath(); x.arc(NX, NY, NR, 0, Math.PI * 2); x.stroke(); x.setLineDash([]); x.fillStyle = 'rgba(80,240,150,0.06)'; x.fill(); x.restore();
  }
  if (sel.kind === 'cell') {
    var X2 = WX(sel.c), Y2 = WY(sel.r), pulse = 0.6 + 0.4 * Math.sin(RD.time * 6);
    x.save(); x.strokeStyle = 'rgba(255,240,170,' + pulse + ')'; x.lineWidth = Math.max(2, S * 0.05); x.beginPath(); x.rect(X2 + S * 0.06, Y2 + S * 0.06, S * 0.88, S * 0.88); x.stroke(); x.restore();
  }
}
// 집중(조준) 표시가 감쌀 자리: 그림에서 실제로 보이는 몸 가운데와 크기 (장애물은 소품 그림, 적은 지금 그려진 자리)
function fxFocusAt(F, S) {
  if (F.o) {
    var o = F.o, bb = o.spr && fxBodyBox(o.spr), X = WX(o.x), Y = WY(o.y + (o.w > 1 ? 0.45 : 0.3));
    if (!bb) return { x: X, y: Y - S * 0.3, r: S * 0.4 };
    return { x: X + bb.cx, y: Y + bb.cy, r: clamp(Math.max(bb.w, bb.h) * 0.56, S * 0.34, S * 1.6) };
  }
  var e = F.e; if (!e) return null;
  var X2 = e.fbx != null ? e.fbx : WX(e.x), Y2 = e.fby != null ? e.fby : WY(e.y) - (e.fly ? S * 0.75 : 0), b2 = fxEnBox(e);
  if (!b2) { var h = EH(e) * S, tp = ruTopK(ruKey(e)), old = e.k === 'spider' || e.k === 'arachne'; return { x: X2, y: Y2 - h * (old ? 0.2 : tp ? 0 : 0.5), r: clamp(h * (tp && !old ? 0.52 : 0.6), S * 0.36, S * 2.2) }; }
  return { x: X2 + b2.cx * (e.face < 0 ? -1 : 1), y: Y2 + b2.cy, r: clamp(Math.max(b2.w, b2.h) * 0.54, S * 0.36, S * 2.2) };
}
// 집중 표시: 대상 몸 가운데에 굵은 흰 테두리 + 진분홍 점선 고리(천천히 돎), 맥박 뛰는 모서리 꺾쇠, 위에서 통통 튀는 하트 화살표
// 지정하는 순간 고리가 크게 나타나 대상에 착 조여들고 반짝
function drawFocus(x, g, S, time) {
  var F = g.focus, tg = F ? F.e || F.o : null;
  if (tg !== RD.fxFocT) { RD.fxFocT = tg; RD.fxFocA = time; RD.fxFocD = 0; }
  if (!tg) return;
  var c = fxFocusAt(F, S); if (!c) return;
  var u = (time - RD.fxFocA) / 0.3, k = u < 1 ? 2.3 - 1.3 * easeBack(u) : 1, al = Math.min(1, Math.max(0, u) * 4 + 0.15), spin = u < 1 ? (1 - easeOut(u)) * 2.6 : 0;
  if (u >= 1 && !RD.fxFocD) {
    // 착! 조여진 순간 반짝
    RD.fxFocD = 1; var v = RD.view, wx = (c.x - v.ox - RD.shx) / v.S, wy = (c.y - v.oy - RD.shy) / v.S;
    fxSRing(wx, wy, 0, c.r / S * 1.15, '#ff2d78', 0.26, 0); fxTwinkles(wx, wy, 0, 4, ['#ffffff', '#ff8fc0', '#ffe066'], 1.8, 0.07, 0.35);
  }
  var R = c.r, ring = fxFocRing(R, S), rs = R / Math.max(12, Math.round(R / 4) * 4) * k, rot = time * 0.7 + spin, cr = Math.cos(rot) * rs, sr = Math.sin(rot) * rs, lw = fxFocW(R, S);
  x.globalAlpha = al;
  x.setTransform(cr, sr, -sr, cr, c.x, c.y); x.drawImage(ring.c, -ring.m, -ring.m);
  // 네 귀퉁이 꺾쇠: 맥박처럼 안팎으로
  var bk = fxFocBrk(R, S), dd = ((R + lw.w * 0.5 + lw.o) * 1.05 + lw.w * 1.3) * k * (1 + 0.07 * Math.sin(time * 6.5)), bs = R / Math.max(12, Math.round(R / 4) * 4);
  for (var q = 0; q < 4; q++) { var an = q * Math.PI / 2, ca = Math.cos(an), sa = Math.sin(an); x.setTransform(ca * bs, sa * bs, -sa * bs, ca * bs, c.x + dd * (ca + sa), c.y + dd * (sa - ca)); x.drawImage(bk.c, -bk.cx, -bk.cy); }
  x.setTransform(1, 0, 0, 1, 0, 0);
  // 하트 화살표: 위에서 통통 (바닥에 닿을 때 살짝 눌림)
  var hd = clamp(R * 0.6, S * 0.32, S * 0.48), ht = fxFocHeart(hd), hdb = Math.max(12, Math.round(hd / 4) * 4), hsc = hd / hdb, hb = Math.abs(Math.sin(time * 5.2)), hsq = 1 - 0.16 * Math.pow(1 - hb, 8);
  var tipY = c.y - dd - lw.o - S * 0.04 - hb * S * 0.18, tipO = (ht.w / 2 + hdb * 0.41) * hsc * hsq, hw2 = ht.w * hsc * (2 - hsq), hh2 = ht.h * hsc * hsq;
  x.drawImage(ht.c, c.x - hw2 / 2, tipY - tipO, hw2, hh2);
  x.globalAlpha = 1;
}
function drawAimOverlay(x, g, S, time) {
  if (!UIS.aim) return;
  var X = WX(UIS.aimX), Y = WY(UIS.aimY);
  x.save();
  if (SK2[UIS.aim]) { sk2AimDraw(x, g, S, X, Y); x.restore(); return; }   // v2.2 특수 기술 겨누기
  if (UIS.aim === 'rain') { x.fillStyle = 'rgba(255,224,102,0.14)'; x.strokeStyle = 'rgba(255,240,170,0.9)'; x.lineWidth = Math.max(1.5, S * 0.03); x.beginPath(); x.arc(X, Y, 1.5 * S, 0, Math.PI * 2); x.fill(); x.setLineDash([S * 0.1, S * 0.08]); x.stroke(); }
  else if (UIS.aim === 'wall') { var np = nearestPath(g, UIS.aimX, UIS.aimY); x.globalAlpha = 0.75; if (np) drawSpr(x, fxSpr('barricade', S), WX(np.x), WY(np.y)); else { x.strokeStyle = 'rgba(255,93,158,0.9)'; x.lineWidth = S * 0.04; x.beginPath(); x.moveTo(X - S * 0.2, Y - S * 0.2); x.lineTo(X + S * 0.2, Y + S * 0.2); x.moveTo(X + S * 0.2, Y - S * 0.2); x.lineTo(X - S * 0.2, Y + S * 0.2); x.stroke(); } }
  else if (UIS.aim === 'last') { var gx = WX(g.gate.x), gy = WY(g.gate.y + 0.3), dx = X - gx, dy = Y - gy, L = Math.hypot(dx, dy) || 1; x.strokeStyle = 'rgba(255,214,234,0.6)'; x.lineWidth = S * 0.9; x.globalAlpha = 0.35; x.lineCap = 'round'; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + dx / L * 30 * S, gy + dy / L * 30 * S); x.stroke(); x.globalAlpha = 1; x.lineWidth = Math.max(1.5, S * 0.03); x.setLineDash([S * 0.15, S * 0.1]); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.stroke(); }
  x.restore();
}

// ---------- v2.3 레이더 범위 ----------
// 탐지 탑(저격, 레이저, Ⅴ단계 이상 공격 탑, 탐지 갈래)과 드러내는 탑(종탑, 장승, 신당)의 범위 반지름(칸). 아니면 0
function rdRadarOf(g, sel) {
  if (sel.kind === 'tower') {
    var t = sel.t, st = t.st || {};
    if (UIS.preview) { var ps = towerStats(t.k, UIS.preview.lvl, UIS.preview.br) || {}, pr = (ps.range || 0) * (t.k === 'bell' ? 1 : g.rangeMod * (1 + (g.R.trng[t.k] || 0)));
      if (ps.reveal) return ps.reveal; if (TW_DETECT.indexOf(t.k) >= 0 || ps.detect || (UIS.preview.lvl >= 5 && (ps.dmg || ps.flameDps))) return pr; return 0; }
    if (st.reveal) return st.reveal;
    if (st.detect) return st.range || 0;
    return 0;
  }
  if (UIS.preview && UIS.preview.type) { var k = UIS.preview.type, s1 = towerStats(k, 1, 0) || {}; if (s1.reveal) return s1.reveal; if (TW_DETECT.indexOf(k) >= 0 || s1.detect) return (s1.range || 0) * g.rangeMod * (1 + (g.R.trng[k] || 0)); }
  return 0;
}
function rdRadar(x, g, S, X, Y, R, cx, cy) {
  var t = RD.time, a = t * 2.2, br = 0.5 + 0.5 * Math.sin(t * 2.4);
  x.save();
  var rg = x.createRadialGradient(X, Y, R * 0.1, X, Y, R);
  rg.addColorStop(0, 'rgba(20,90,50,0.10)'); rg.addColorStop(0.85, 'rgba(40,200,110,' + (0.16 + 0.05 * br).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(60,240,140,0.30)');
  x.fillStyle = rg; x.beginPath(); x.arc(X, Y, R, 0, Math.PI * 2); x.fill();
  x.save(); x.beginPath(); x.arc(X, Y, R, 0, Math.PI * 2); x.clip();
  // 돌아가는 스캔 빛줄기: 앞쪽이 가장 밝고 뒤로 갈수록 옅어짐
  x.globalCompositeOperation = 'lighter';
  for (var i = 0; i < 8; i++) { var a1 = a - i * 0.12, a0 = a1 - 0.12; x.fillStyle = 'rgba(90,255,160,' + (0.30 * (1 - i / 8)).toFixed(3) + ')'; x.beginPath(); x.moveTo(X, Y); x.arc(X, Y, R, a0, a1); x.closePath(); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  x.strokeStyle = 'rgba(190,255,215,0.95)'; x.lineWidth = Math.max(1.5, S * 0.04); x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a) * R, Y + Math.sin(a) * R); x.stroke();
  x.restore();
  // 눈금 고리와 십자
  x.strokeStyle = 'rgba(110,255,170,0.35)'; x.lineWidth = Math.max(1, S * 0.022);
  [1 / 3, 2 / 3].forEach(function (f) { x.beginPath(); x.arc(X, Y, R * f, 0, Math.PI * 2); x.stroke(); });
  x.beginPath(); x.moveTo(X - R, Y); x.lineTo(X + R, Y); x.moveTo(X, Y - R); x.lineTo(X, Y + R); x.stroke();
  x.strokeStyle = 'rgba(40,220,120,' + (0.7 + 0.2 * br).toFixed(3) + ')'; x.lineWidth = Math.max(2, S * 0.065); x.beginPath(); x.arc(X, Y, R, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = '#eafff2'; x.lineWidth = Math.max(1.5, S * 0.03); x.setLineDash([S * 0.16, S * 0.1]); x.lineDashOffset = -t * S * 0.25; x.stroke(); x.setLineDash([]);
  // 범위 안 숨은 적에 점 표시(스캔 줄이 지나간 직후 가장 밝게)
  for (var j = 0; j < g.enemies.length; j++) {
    var e = g.enemies[j]; if (e.dead || !e.stealth) continue; var dx = e.x - cx, dy = e.y - cy; if (dx * dx + dy * dy > (R / S) * (R / S)) continue;
    var ea = Math.atan2(dy, dx), lag = ((a - ea) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), k = Math.max(0.35, 1 - lag / 3), ex = WX(e.x), ey = WY(e.y);
    x.fillStyle = 'rgba(120,255,170,' + (0.35 * k).toFixed(3) + ')'; x.beginPath(); x.arc(ex, ey, S * (0.3 + 0.12 * k), 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(220,255,230,' + k.toFixed(3) + ')'; x.beginPath(); x.arc(ex, ey, S * 0.12, 0, Math.PI * 2); x.fill();
  }
  x.restore();
}
