// ===== bonus.js : 보너스 게임 3종 (XTRA). 자체 층(#bnLayer)과 자체 캔버스, 전투 엔진과 무관 =====
// gallery 황금 과녁 사격(30초), memory 탑 카드 짝 맞추기(제한 시간), catch 금화 받기(30초)
// 밖에서 부르는 함수: bnOpen(node 또는 id) 열기, bnState(id) → { done 첫 완료, today 오늘 보상 받음, best 최고 점수, star 최고 별, open 열림 }
// 지도가 보너스 칸을 안 그려도 되게: 지도 화면에서 bnState를 아무도 안 부르면 이 파일이 '보너스' 단추(#bnFab)를 띄우고 bnList() 목록을 연다
// 화면 갈래와의 연결: 보너스가 끝나 기록이 바뀌면 chMapRefresh()가 있을 때 불러 준다(지도 표시 새로 고침용, 없으면 건너뜀). 캔버스 글자는 T()를 거치므로 번역 키만 넣으면 된다.
// 보상(보석과 소환권만, 현금 없음): 첫 완료 보석 30 + 소환권 1, 별 2개 처음 +15, 별 3개 처음 +15와 소환권 +1(합쳐 최대 보석 60, 소환권 2). 그 뒤 칸마다 하루 1번 보석 5/10/15
// 저장: SAVE.bonus[id] = { done, star, day, best, n }. 진행 기록 지우기로 첫 보상을 다시 받지 못하게 localStorage 'ironhold.bn'에도 사본을 둔다
var BN_FIRST = { gems: 30, tk: 1, s2: 15, s3: 15, s3tk: 1 }, BN_DAILY = [5, 10, 15], BN_DAILY_CAP = 60, BN_MIRROR = 'ironhold.bn';   // 하루 보상(첫 완료 제외) 합계 상한: 보석 60 (QA)
// 별 기준 점수(360x640에서 손가락으로 해 본 값과 tools/xflow.py의 흉내 손가락으로 맞춤). memory는 뒤집은 횟수(짝 시도)가 적을수록 별이 많음
var BN_GAMES = {
  gallery: { name: '황금 과녁 사격', sec: 30, stars: [150, 450, 900], how: ['날아다니는 과녁을 눌러 맞히세요', '연속으로 맞히면 점수가 2배, 3배, 4배', '황금 과녁은 큰 점수, 폭탄은 감점'] },
  memory: { name: '탑 카드 짝 맞추기', sec: 60, moves: [99, 18, 13], how: ['같은 탑 카드 두 장을 찾으세요', '처음에 잠깐 보여 주는 자리를 기억하세요', '적게 뒤집을수록 별이 많아집니다'] },
  catch: { name: '금화 받기', sec: 30, stars: [250, 650, 1100], how: ['화면을 끌어 수레를 움직이세요', '금화와 보석은 받고 폭탄은 피하세요', '폭탄 없이 계속 받으면 점수가 2배, 3배, 4배'] }
};
// 챕터 분위기: 1 파스텔, 2 어두운 보라와 주황, 3 강철 남색과 호박색, 4 한지와 단청
var BN_MOOD = {
  1: { top: '#bfe6ff', bot: '#ffe3f0', ink: '#4a2a5a', hud: '#ffffff', bar: '#ff6fa8', barBg: '#ffffff', acc: '#ff9cc8', card: '#ff9cc8', card2: '#ffd9ea', dark: 0 },
  2: { top: '#241640', bot: '#4b2a66', ink: '#ffe9c4', hud: '#3a2456', bar: '#ff9a3a', barBg: '#1b102e', acc: '#ff9a3a', card: '#6a3fa0', card2: '#ff9a3a', dark: 1 },
  3: { top: '#16233c', bot: '#34496b', ink: '#ffe9b0', hud: '#22324f', bar: '#ffb62e', barBg: '#0f192c', acc: '#ffb62e', card: '#3d5a86', card2: '#ffb62e', dark: 1 },
  4: { top: '#f5ead0', bot: '#ecd3a2', ink: '#3a2418', hud: '#fff8e6', bar: '#d8432e', barBg: '#fff8e6', acc: '#2f8f6a', card: '#c8402c', card2: '#f2c94c', dark: 0 }
};
var BN = { on: 0, node: null, st: '', g: null, W: 360, H: 640, dpr: 1, top: 0, raf: 0, last: 0, parts: [], pops: [], shake: 0, flash: 0, flashC: '#fff', spr: {}, bg: null, bgKey: '', ext: 0, extT: 0, changed: 0, inited: 0, time: 0, hudPop: 0, res: null, sim: 0, mir: null };

// ---------- 저장 ----------
function bnToday() { return typeof metaToday === 'function' ? metaToday() : new Date().toDateString(); }
function bnMirror() {
  if (BN.mir) return BN.mir;
  var m = null; try { m = JSON.parse(localStorage.getItem(BN_MIRROR)); } catch (e) { m = null; }
  return (BN.mir = m && typeof m === 'object' ? m : {});
}
function bnRec(id) {
  if (!SAVE.bonus || typeof SAVE.bonus !== 'object') SAVE.bonus = {};
  var r = SAVE.bonus[id]; if (!r || typeof r !== 'object') r = SAVE.bonus[id] = { done: 0, star: 0, day: '', best: 0, n: 0 };
  var m = bnMirror()[id];   // 진행 기록을 지워도 받은 보상 기록은 사본에서 되살림
  if (m) { if (m[0] && !r.done) r.done = 1; if ((m[1] || 0) > (r.star || 0)) r.star = m[1]; if (m[2] && (!r.day || m[2] > r.day)) r.day = m[2]; }
  return r;
}
function bnSave(id) { var r = bnRec(id), m = bnMirror(); m[id] = [r.done ? 1 : 0, r.star || 0, r.day || '']; try { localStorage.setItem(BN_MIRROR, JSON.stringify(m)); } catch (e) { } saveNow(); }
function bnNode(v) { if (v && typeof v === 'object' && v.id) v = v.id; if (typeof BONUS_NODES === 'undefined') return null; for (var i = 0; i < BONUS_NODES.length; i++) if (BONUS_NODES[i].id === v) return BONUS_NODES[i]; return null; }
// 열림: 그 챕터의 after번째 판을 이기면. 관리자면 항상. 그 판이 아직 MAPS에 없으면 열린 것으로(판이 모자란 개발 중)
function bnStageId(n) { return 'c' + n.ch + 's' + (n.after < 10 ? '0' : '') + n.after; }
function bnUnlocked(n) { if (SAVE.admin) return true; var id = bnStageId(n); return fdMi(id) < 0 || fdWon(id); }
function bnSt(id) { var n = bnNode(id), r = bnRec(id); return { done: !!r.done, today: r.day === bnToday(), best: r.best || 0, star: r.star || 0, open: n ? bnUnlocked(n) : false }; }
function bnState(id) { BN.ext = 1; BN.extT = performance.now(); return bnSt(id); }
// 관리자 창에서: 오늘 보상 다시 받기(all이면 기록 전부 지움)
function bnAdminReset(all) {
  SAVE.bnDay = null;
  if (all) { SAVE.bonus = {}; BN.mir = {}; try { localStorage.removeItem(BN_MIRROR); } catch (e) { } saveNow(); return true; }
  if (typeof BONUS_NODES === 'undefined') return false;
  BONUS_NODES.forEach(function (n) { var r = bnRec(n.id); r.day = ''; bnSave(n.id); });
  return true;
}
// 별에 따른 보상을 셈하고 기록(지급은 bnGive). 돌려주는 값 { gems, tk, first, up, daily }
function bnReward(id, stars) {
  var r = bnRec(id), today = bnToday(), o = { gems: 0, tk: 0, first: 0, up: 0, daily: 0 };
  if (stars <= 0) return o;
  if (!r.done) { o.first = 1; o.gems += BN_FIRST.gems; o.tk += BN_FIRST.tk; r.done = 1; r.day = today; }
  else if (r.day !== today) {
    if (!SAVE.bnDay || SAVE.bnDay.d !== today) SAVE.bnDay = { d: today, g: 0 };
    var dg = Math.max(0, Math.min(BN_DAILY[stars - 1], BN_DAILY_CAP - SAVE.bnDay.g));   // 하루 합계 상한
    o.daily = 1; o.gems += dg; SAVE.bnDay.g += dg; r.day = today; if (!dg) o.capped = 1;
  }
  var s0 = r.star || 0;
  if (stars > s0) { if (s0 < 2 && stars >= 2) { o.gems += BN_FIRST.s2; o.up = 1; } if (s0 < 3 && stars >= 3) { o.gems += BN_FIRST.s3; o.tk += BN_FIRST.s3tk; o.up = 1; } r.star = stars; }
  return o;
}
function bnGive(o) {
  if (o.tk) SAVE.tickets = (SAVE.tickets || 0) + o.tk;
  if (o.gems) { if (typeof metaGemAdd === 'function') metaGemAdd(o.gems); else SAVE.gems = (SAVE.gems || 0) + o.gems; }
}

// ---------- 그림 조각 (한 번 구워 두고 씀) ----------
function bnSpr(key, w, h, draw) {
  var k = key + '@' + BN.dpr; if (BN.spr[k]) return BN.spr[k];
  var c = mkC(w * BN.dpr, h * BN.dpr), x = cx2(c); x.scale(BN.dpr, BN.dpr); x.translate(w / 2, h / 2); x.lineJoin = 'round'; x.lineCap = 'round';
  draw(x, w, h); c.bw = w; c.bh = h; return (BN.spr[k] = c);
}
function bnDraw(x, c, X, Y, sc, rot, a) {
  var w = c.bw * (sc || 1), h = c.bh * (sc || 1);
  if (a != null && a < 1) x.globalAlpha = a;
  if (rot) { x.save(); x.translate(X, Y); x.rotate(rot); x.drawImage(c, -w / 2, -h / 2, w, h); x.restore(); } else x.drawImage(c, X - w / 2, Y - h / 2, w, h);
  if (a != null && a < 1) x.globalAlpha = 1;
}
function bnStarPath(x, R, r, n) { x.beginPath(); for (var i = 0; i < n * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; x[i ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q); } x.closePath(); }
function bnStarSpr(col) { return bnSpr('st' + col, 28, 28, function (x) { bnStarPath(x, 11, 5, 5); x.fillStyle = col; x.fill(); x.lineWidth = 2; x.strokeStyle = '#4a2a5a'; x.stroke(); }); }
// 과녁: kind 'n' 보통(빨강), 's' 작은 것(파랑), 'g' 황금, 'b' 폭탄. 반지름 32 기준
function bnTargetSpr(kind) {
  return bnSpr('tg' + kind, 84, 84, function (x) {
    var R = 32, OL = '#4a2a5a';
    if (kind === 'b') {
      x.fillStyle = '#3b3048'; x.beginPath(); x.arc(0, 4, 26, 0, 6.283); x.fill(); x.lineWidth = 3.5; x.strokeStyle = '#1c1526'; x.stroke();
      x.fillStyle = '#5d4f70'; x.beginPath(); x.ellipse(-9, -6, 8, 5, -0.6, 0, 6.283); x.fill();
      x.fillStyle = '#6b5a80'; x.fillRect(-6, -28, 12, 9); x.strokeStyle = '#1c1526'; x.lineWidth = 2.5; x.strokeRect(-6, -28, 12, 9);
      x.strokeStyle = '#c98a4b'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -28); x.quadraticCurveTo(6, -38, 14, -34); x.stroke();
      x.fillStyle = '#ffd23a'; bnStarAt(x, 16, -34, 8, 3.5, 4); x.fillStyle = '#ff7a3a'; bnStarAt(x, 16, -34, 4.5, 2, 4);
      return;
    }
    var cols = kind === 'g' ? ['#ffb000', '#fff3a0', '#ffc21a', '#fff8d0'] : kind === 's' ? ['#3f8ff0', '#ffffff', '#6fb4ff', '#ffffff'] : ['#ff4f74', '#ffffff', '#ff7a96', '#ffffff'];
    x.fillStyle = OL; x.beginPath(); x.arc(0, 0, R + 3, 0, 6.283); x.fill();
    [R, R * 0.74, R * 0.5, R * 0.27].forEach(function (r, i) { x.fillStyle = cols[i]; x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill(); });
    if (kind === 'g') { x.fillStyle = '#ff8a00'; bnStarAt(x, 0, 0, 9, 4, 5); x.fillStyle = '#ffffff'; bnStarAt(x, -17, -18, 6, 2, 4); bnStarAt(x, 20, 12, 4.5, 1.6, 4); }
    else { x.fillStyle = kind === 's' ? '#ffd23a' : '#ffd23a'; x.beginPath(); x.arc(0, 0, R * 0.12, 0, 6.283); x.fill(); }
    x.globalAlpha = 0.5; x.fillStyle = '#fff'; x.beginPath(); x.ellipse(-12, -17, 10, 5, -0.6, 0, 6.283); x.fill(); x.globalAlpha = 1;
  });
}
function bnStarAt(x, cx, cy, R, r, n) { x.save(); x.translate(cx, cy); bnStarPath(x, R, r, n); x.fill(); x.restore(); }
function bnWingSpr() { return bnSpr('wing', 30, 24, function (x) { x.fillStyle = '#ffffff'; x.strokeStyle = '#4a2a5a'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-12, 4); x.quadraticCurveTo(-8, -12, 12, -8); x.quadraticCurveTo(8, -2, 10, 4); x.quadraticCurveTo(2, 2, 0, 8); x.quadraticCurveTo(-6, 4, -12, 4); x.closePath(); x.fill(); x.stroke(); }); }
// 떨어지는 것: 'c' 금화, 'j' 보석, 'k' 금화 자루, 'b' 폭탄
function bnItemSpr(kind) {
  if (kind === 'b') return bnTargetSpr('b');
  return bnSpr('it' + kind, 56, 56, function (x) {
    var OL = '#4a2a5a';
    if (kind === 'c') {
      x.fillStyle = '#d97f00'; x.beginPath(); x.arc(0, 0, 19, 0, 6.283); x.fill(); x.fillStyle = '#ffc425'; x.beginPath(); x.arc(0, -1.5, 17.5, 0, 6.283); x.fill();
      x.fillStyle = '#ffe98a'; x.beginPath(); x.arc(0, -1.5, 12.5, 0, 6.283); x.fill(); x.fillStyle = '#f59f00'; bnStarAt(x, 0, -1.5, 8, 3.6, 5);
      x.globalAlpha = 0.7; x.fillStyle = '#fff'; x.beginPath(); x.ellipse(-8, -10, 5, 2.5, -0.6, 0, 6.283); x.fill(); x.globalAlpha = 1;
      x.lineWidth = 2.5; x.strokeStyle = OL; x.beginPath(); x.arc(0, 0, 19.5, 0, 6.283); x.stroke();
    } else if (kind === 'j') {
      x.beginPath(); x.moveTo(-11, -16); x.lineTo(11, -16); x.lineTo(21, -5); x.lineTo(0, 20); x.lineTo(-21, -5); x.closePath(); x.fillStyle = '#7fc8ff'; x.fill();
      x.beginPath(); x.moveTo(-11, -16); x.lineTo(11, -16); x.lineTo(21, -5); x.lineTo(-21, -5); x.closePath(); x.fillStyle = '#d9f4ff'; x.fill();
      x.beginPath(); x.moveTo(8, -5); x.lineTo(21, -5); x.lineTo(0, 20); x.closePath(); x.fillStyle = '#5a8fe8'; x.fill();
      x.beginPath(); x.moveTo(-11, -16); x.lineTo(11, -16); x.lineTo(21, -5); x.lineTo(0, 20); x.lineTo(-21, -5); x.closePath(); x.lineWidth = 2.5; x.strokeStyle = OL; x.stroke();
      x.fillStyle = '#fff'; bnStarAt(x, 15, -17, 6, 2, 4);
    } else {
      x.fillStyle = '#c98a4b'; x.beginPath(); x.moveTo(-9, -12); x.quadraticCurveTo(-24, 6, -17, 19); x.quadraticCurveTo(0, 26, 17, 19); x.quadraticCurveTo(24, 6, 9, -12); x.closePath(); x.fill(); x.lineWidth = 2.5; x.strokeStyle = OL; x.stroke();
      x.fillStyle = '#a86a34'; x.beginPath(); x.moveTo(-11, -12); x.lineTo(-14, -22); x.lineTo(0, -17); x.lineTo(14, -22); x.lineTo(11, -12); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#ffd23a'; x.beginPath(); x.arc(0, 6, 8.5, 0, 6.283); x.fill(); x.lineWidth = 2; x.stroke(); x.fillStyle = '#f59f00'; bnStarAt(x, 0, 6, 5, 2.2, 5);
    }
  });
}
function bnCartSpr() {
  return bnSpr('cart', 104, 70, function (x) {
    var OL = '#4a2a5a';
    x.fillStyle = '#ffc425'; x.strokeStyle = OL; x.lineWidth = 2;   // 금화 더미
    [[-22, -12], [-6, -17], [10, -14], [24, -11], [0, -9], [-14, -8], [15, -7]].forEach(function (p) { x.beginPath(); x.ellipse(p[0], p[1], 9, 5.5, 0, 0, 6.283); x.fill(); x.stroke(); });
    x.fillStyle = '#d99a5b'; x.beginPath(); x.moveTo(-42, -8); x.lineTo(42, -8); x.lineTo(34, 18); x.lineTo(-34, 18); x.closePath(); x.fill(); x.lineWidth = 3; x.stroke();
    x.strokeStyle = '#a86a34'; x.lineWidth = 2; x.beginPath(); x.moveTo(-38, 1); x.lineTo(38, 1); x.moveTo(-36, 10); x.lineTo(36, 10); x.stroke();
    x.fillStyle = '#ff9cc8'; x.strokeStyle = OL; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-46, -12); x.lineTo(46, -12); x.lineTo(44, -5); x.lineTo(-44, -5); x.closePath(); x.fill(); x.stroke();
    [-24, 24].forEach(function (wx) { x.fillStyle = '#6b4a34'; x.beginPath(); x.arc(wx, 22, 10, 0, 6.283); x.fill(); x.lineWidth = 2.5; x.strokeStyle = OL; x.stroke(); x.fillStyle = '#ffd23a'; x.beginPath(); x.arc(wx, 22, 3.5, 0, 6.283); x.fill(); });
  });
}
function bnCardBackSpr(w, h, M) {
  return bnSpr('cb' + w + 'x' + h + M.card, w + 8, h + 8, function (x) {
    var p = uiRR(-w / 2, -h / 2, w, h, 10);
    x.fillStyle = M.card; x.fill(p); x.save(); x.clip(p); x.globalAlpha = 0.22; x.strokeStyle = '#ffffff'; x.lineWidth = 5;
    for (var i = -h; i < w + h; i += 14) { x.beginPath(); x.moveTo(-w / 2 + i, -h / 2); x.lineTo(-w / 2 + i - h, h / 2); x.stroke(); }
    x.restore(); x.lineWidth = 3; x.strokeStyle = '#4a2a5a'; x.stroke(p);
    x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 2; x.stroke(uiRR(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 7));
    x.fillStyle = M.card2; bnStarAt(x, 0, 0, w * 0.26, w * 0.12, 5); x.lineWidth = 2.5; x.strokeStyle = '#4a2a5a'; x.save(); bnStarPath(x, w * 0.26, w * 0.12, 5); x.stroke(); x.restore();
  });
}
function bnCardFrontSpr(w, h, done) {
  return bnSpr('cf' + w + 'x' + h + (done ? 'd' : ''), w + 8, h + 8, function (x) {
    var p = uiRR(-w / 2, -h / 2, w, h, 10);
    x.fillStyle = done ? '#fff6c8' : '#fffaf3'; x.fill(p); x.lineWidth = 3; x.strokeStyle = done ? '#e09a00' : '#4a2a5a'; x.stroke(p);
  });
}
// 카드에 쓸 탑 아이콘(캔버스). 그림이 아직 없는 탑은 건너뜀
function bnTowerPics(n, px) {
  var ks = TOWER_ORDER.slice(), out = [];
  if (typeof TW2_ORDER !== 'undefined' && TW2_ORDER) TW2_ORDER.forEach(function (k) { if (ks.indexOf(k) < 0) ks.push(k); });
  ks = ks.filter(function (k) { return TOWERS[k] && !TOWERS[k].fusion; });
  for (var i = ks.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = ks[i]; ks[i] = ks[j]; ks[j] = t; }
  for (var q = 0; q < ks.length && out.length < n; q++) { try { var c = towerIcon(ks[q], 1, 0, px); if (c && c.width) out.push({ k: ks[q], c: c }); } catch (e) { } }
  var cols = ['#ff6fa8', '#6fb4ff', '#ffc21a', '#6fdcbc', '#b08cff', '#ff8a5a', '#8fd36a', '#5ad0e0'];
  while (out.length < n) { var cc = mkC(px, px), cx = cx2(cc), id = out.length; cx.translate(px / 2, px / 2); cx.fillStyle = cols[id % cols.length]; bnStarPath(cx, px * 0.4, px * (0.14 + 0.03 * (id % 3)), 4 + id % 4); cx.fill(); cx.lineWidth = 3; cx.strokeStyle = '#4a2a5a'; cx.stroke(); out.push({ k: 'x' + id, c: cc }); }
  return out;
}
// 배경: 챕터 분위기별로 한 장 구워 둠
function bnBg() {
  var n = BN.node || { ch: 1 }, key = n.ch + ':' + BN.W + 'x' + BN.H + '@' + BN.dpr; if (BN.bg && BN.bgKey === key) return BN.bg;
  var W = BN.W, H = BN.H, c = mkC(W * BN.dpr, H * BN.dpr), x = cx2(c), M = BN_MOOD[n.ch] || BN_MOOD[1], r = rngOf(77 + n.ch), i;
  x.scale(BN.dpr, BN.dpr);
  var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, M.top); g.addColorStop(1, M.bot); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (n.ch === 2) {
    x.fillStyle = '#ffb45a'; x.beginPath(); x.arc(W * 0.76, H * 0.2, 46, 0, 6.283); x.fill(); x.fillStyle = 'rgba(255,180,90,0.18)'; x.beginPath(); x.arc(W * 0.76, H * 0.2, 66, 0, 6.283); x.fill();
    x.fillStyle = '#ffe9c4'; for (i = 0; i < 40; i++) { x.globalAlpha = 0.3 + r() * 0.6; x.fillRect(r() * W, r() * H * 0.7, 2, 2); } x.globalAlpha = 1;
    x.fillStyle = '#1a0f2e'; x.beginPath(); x.moveTo(0, H); x.lineTo(0, H - 70); for (i = 0; i <= 8; i++) x.quadraticCurveTo(W * (i - 0.5) / 8, H - 100 - r() * 40, W * i / 8, H - 60 - r() * 20); x.lineTo(W, H); x.closePath(); x.fill();
    x.strokeStyle = '#1a0f2e'; x.lineWidth = 5; [[0.12, 150], [0.9, 120]].forEach(function (t) { var X = W * t[0], Y = H - 60; x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - t[1]); x.moveTo(X, Y - t[1] * 0.6); x.lineTo(X - 22, Y - t[1] * 0.85); x.moveTo(X, Y - t[1] * 0.75); x.lineTo(X + 20, Y - t[1] * 1.0); x.stroke(); });
  } else if (n.ch === 3) {
    x.strokeStyle = 'rgba(255,182,46,0.08)'; x.lineWidth = 1; for (i = 0; i < W; i += 36) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (i = 0; i < H; i += 36) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
    x.fillStyle = 'rgba(255,214,120,0.10)'; [[0.15, -0.35], [0.85, 0.3]].forEach(function (b) { x.beginPath(); x.moveTo(W * b[0], H); x.lineTo(W * b[0] + H * b[1] - 50, 0); x.lineTo(W * b[0] + H * b[1] + 50, 0); x.closePath(); x.fill(); });
    x.fillStyle = '#0f192c'; for (i = 0; i < 9; i++) { var bw = W / 9, bh = 50 + r() * 90; x.fillRect(i * bw, H - bh, bw - 3, bh); x.fillStyle = 'rgba(255,182,46,0.55)'; for (var j = 0; j < 4; j++) if (r() < 0.6) x.fillRect(i * bw + 6 + (j % 2) * 14, H - bh + 10 + Math.floor(j / 2) * 18, 6, 8); x.fillStyle = '#0f192c'; }
  } else if (n.ch === 4) {
    x.fillStyle = '#d8432e'; x.beginPath(); x.arc(W * 0.74, H * 0.2, 40, 0, 6.283); x.fill();
    ['rgba(58,36,24,0.16)', 'rgba(58,36,24,0.26)'].forEach(function (col, li) { x.fillStyle = col; x.beginPath(); x.moveTo(0, H); x.lineTo(0, H - 150 + li * 50); for (i = 0; i <= 5; i++) x.quadraticCurveTo(W * (i - 0.5) / 5, H - 250 + li * 70 - r() * 60, W * i / 5, H - 150 + li * 50 - r() * 30); x.lineTo(W, H); x.closePath(); x.fill(); });
    ['#c8402c', '#f2c94c', '#2f8f6a', '#3a6fc0', '#ffffff'].forEach(function (col, k) { x.fillStyle = col; x.fillRect(0, H - 30 + k * 6, W, 6); }); x.fillStyle = '#3a2418'; x.fillRect(0, H - 33, W, 3);
  } else {
    x.fillStyle = 'rgba(255,255,255,0.75)'; [[0.2, 0.2, 60], [0.72, 0.3, 80], [0.4, 0.55, 54], [0.85, 0.6, 46]].forEach(function (p) { var X = W * p[0], Y = H * p[1], s = p[2]; x.beginPath(); x.ellipse(X, Y, s, s * 0.36, 0, 0, 6.283); x.ellipse(X - s * 0.4, Y - s * 0.2, s * 0.42, s * 0.34, 0, 0, 6.283); x.ellipse(X + s * 0.25, Y - s * 0.28, s * 0.5, s * 0.4, 0, 0, 6.283); x.fill(); });
    x.fillStyle = '#b6ea9a'; x.beginPath(); x.moveTo(0, H); x.lineTo(0, H - 60); x.quadraticCurveTo(W * 0.25, H - 110, W * 0.5, H - 62); x.quadraticCurveTo(W * 0.78, H - 20, W, H - 76); x.lineTo(W, H); x.closePath(); x.fill();
    x.fillStyle = '#9fdc86'; x.beginPath(); x.moveTo(0, H); x.lineTo(0, H - 26); x.quadraticCurveTo(W * 0.4, H - 62, W, H - 22); x.lineTo(W, H); x.closePath(); x.fill();
  }
  BN.bg = c; BN.bgKey = key; return c;
}

// ---------- 효과: 별 조각, 떠오르는 숫자, 흔들림, 번쩍 ----------
function bnBurst(X, Y, n, cols, sp) {
  if (BN.sim) return;
  for (var i = 0; i < n && BN.parts.length < 140; i++) { var a = Math.random() * 6.283, v = (sp || 170) * (0.45 + Math.random() * 0.8); BN.parts.push({ x: X, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: 0, T: 0.45 + Math.random() * 0.35, c: cols[i % cols.length], s: 0.5 + Math.random() * 0.6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 10 }); }
}
function bnRing(X, Y, col, R) { if (!BN.sim && BN.parts.length < 150) BN.parts.push({ ring: 1, x: X, y: Y, t: 0, T: 0.3, c: col, R: R || 44 }); }
function bnPop(X, Y, txt, col, big) { if (BN.sim) return; if (BN.pops.length > 14) BN.pops.shift(); BN.pops.push({ x: X, y: Y, txt: txt, c: col || '#ffffff', t: 0, T: 0.8, big: big || 0 }); }
function bnShake(v) { if (BN.sim) return; if (!SAVE.set || SAVE.set.shake !== false) BN.shake = Math.max(BN.shake, v); }
function bnSfx(k, v) { if (!BN.sim) { try { sfx(k, v); } catch (e) { } } }
function bnVib(ms) { if (!BN.sim) { try { vib(ms); } catch (e) { } } }
function bnFxStep(dt) {
  var i, p, keep = [];
  for (i = 0; i < BN.parts.length; i++) { p = BN.parts[i]; p.t += dt; if (p.t >= p.T) continue; if (!p.ring) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.r += p.vr * dt; } keep.push(p); }
  BN.parts = keep; keep = [];
  for (i = 0; i < BN.pops.length; i++) { p = BN.pops[i]; p.t += dt; if (p.t < p.T) keep.push(p); }
  BN.pops = keep;
  BN.shake = BN.shake > 0.3 ? BN.shake * Math.pow(0.0008, dt) : 0; if (BN.flash > 0) BN.flash = Math.max(0, BN.flash - dt * 3.2); if (BN.hudPop > 0) BN.hudPop = Math.max(0, BN.hudPop - dt * 4);
}
function bnFxDraw(x) {
  var i, p, f;
  for (i = 0; i < BN.parts.length; i++) {
    p = BN.parts[i]; f = p.t / p.T;
    if (p.ring) { x.globalAlpha = 1 - f; x.strokeStyle = p.c; x.lineWidth = 5 * (1 - f) + 1; x.beginPath(); x.arc(p.x, p.y, 10 + (p.R - 10) * easeOut(f), 0, 6.283); x.stroke(); x.globalAlpha = 1; }
    else bnDraw(x, bnStarSpr(p.c), p.x, p.y, p.s * (1 - f * 0.5), p.r, 1 - f * f);
  }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  for (i = 0; i < BN.pops.length; i++) {
    p = BN.pops[i]; f = p.t / p.T; var sc = f < 0.18 ? 0.6 + f / 0.18 * 0.6 : 1.2 - Math.min(1, (f - 0.18) / 0.2) * 0.2, sz = Math.round((p.big ? 30 : 22) * sc);
    x.globalAlpha = f > 0.7 ? 1 - (f - 0.7) / 0.3 : 1; x.font = sz + 'px CUTE, PRT, sans-serif'; x.lineWidth = 5; x.strokeStyle = '#4a2a5a'; x.strokeText(p.txt, p.x, p.y - 46 * easeOut(f)); x.fillStyle = p.c; x.fillText(p.txt, p.x, p.y - 46 * easeOut(f)); x.globalAlpha = 1;
  }
}
function bnT(k, a, b) { try { if (typeof T === 'function') return T(k, a, b); } catch (e) { } return k.replace('{0}', a).replace('{1}', b); }
function bnMult(combo, step) { return Math.min(4, 1 + Math.floor(combo / step)); }
function bnScore(g, v, X, Y, col, big) { g.score = Math.max(0, g.score + v); BN.hudPop = 1; bnPop(X, Y, (v > 0 ? '+' : '') + v, col || (v > 0 ? '#fff3a0' : '#ff8a7a'), big); }

// ---------- gallery: 황금 과녁 사격 ----------
function bnGalInit(g) { g.tg = []; g.spT = 0.25; g.goldT = 4 + Math.random() * 3; g.hits = 0; g.shots = 0; g.y0 = BN.top + 96; g.y1 = BN.H - 70; bnGalSpawn(g, 'n'); bnGalSpawn(g, 's'); bnGalSpawn(g, 'n'); g.tg.forEach(function (o, i) { if (!o.arc) o.x = BN.W * (0.25 + 0.25 * i); }); }   // 시작하자마자 과녁 셋이 화면 안에
function bnGalSpawn(g, kind) {
  var lv = g.lv, W = BN.W, sp = 1 + 0.09 * (lv - 1) + 0.25 * (1 - g.t / g.T), side = Math.random() < 0.5 ? -1 : 1, r = kind === 's' ? 23 : kind === 'g' ? 27 : kind === 'b' ? 27 : 31, o;
  if (kind !== 'g' && kind !== 'b' && Math.random() < 0.22) {   // 아래에서 튀어 올랐다 떨어지는 과녁
    var X = 50 + Math.random() * (W - 100), peak = g.y0 + 30 + Math.random() * (g.y1 - g.y0) * 0.45, vy = -Math.sqrt(2 * 520 * (BN.H + r - peak));
    o = { kind: kind, r: r, x: X, y: BN.H + r, vx: (W / 2 - X) * 0.25 + (Math.random() - 0.5) * 30, vy: vy, arc: 1 };
  } else {
    var v = (kind === 'g' ? 215 : kind === 's' ? 150 : kind === 'b' ? 80 : 95 + Math.random() * 45) * sp;
    o = { kind: kind, r: r, x: side < 0 ? -r - 4 : W + r + 4, y: g.y0 + r + Math.random() * (g.y1 - g.y0 - 2 * r), vx: -side * v, vy: 0, amp: kind === 'g' ? 26 : 8 + Math.random() * 16, ph: Math.random() * 6.283, fq: 2 + Math.random() * 2, y0: 0 };
    o.y0 = o.y;
  }
  o.age = 0; o.wing = Math.random() * 6; g.tg.push(o);
}
function bnGalStep(g, dt) {
  g.spT -= dt; g.goldT -= dt;
  var live = g.tg.length, gap = Math.max(0.34, 0.56 - 0.04 * (g.lv - 1) - 0.18 * (1 - g.t / g.T));
  if (g.spT <= 0 && live < 8) { g.spT = gap * (0.7 + Math.random() * 0.6); var q = Math.random(), bomb = 0.09 + 0.025 * g.lv; var nb = 0; g.tg.forEach(function (o) { if (o.kind === 'b') nb++; }); bnGalSpawn(g, q < bomb && nb < 2 ? 'b' : q < bomb + 0.24 ? 's' : 'n'); }
  if (g.goldT <= 0) { g.goldT = 5.5 + Math.random() * 3; bnGalSpawn(g, 'g'); }
  for (var i = g.tg.length - 1; i >= 0; i--) {
    var o = g.tg[i]; o.age += dt;
    if (o.arc) { o.vy += 520 * dt; o.x += o.vx * dt; o.y += o.vy * dt; if (o.vy > 0 && o.y > BN.H + o.r + 6) g.tg.splice(i, 1); }
    else { o.x += o.vx * dt; o.y = o.y0 + Math.sin(o.ph + o.age * o.fq) * o.amp; if ((o.vx > 0 && o.x > BN.W + o.r + 6) || (o.vx < 0 && o.x < -o.r - 6)) g.tg.splice(i, 1); }
    if (o.kind === 'g' && !BN.sim && Math.random() < dt * 14 && BN.parts.length < 120) BN.parts.push({ x: o.x, y: o.y, vx: (Math.random() - 0.5) * 30, vy: 20, t: 0, T: 0.4, c: '#fff3a0', s: 0.4, r: 0, vr: 4 });
  }
}
// 손가락 굵기를 생각해 과녁 반지름 + 12px까지 맞은 것으로. 겹치면 가장 가까운 것
function bnGalTap(g, X, Y) {
  var best = null, bd = 1e9, i, o;
  g.shots++;
  for (i = 0; i < g.tg.length; i++) { o = g.tg[i]; var d = Math.hypot(o.x - X, o.y - Y); if (d <= o.r + 12 && d < bd) { bd = d; best = o; } }
  if (!best) { g.combo = 0; bnRing(X, Y, '#ffffff', 26); bnSfx('tick', 0.35); return false; }
  g.tg.splice(g.tg.indexOf(best), 1);
  if (best.kind === 'b') { g.combo = 0; bnScore(g, -30, best.x, best.y, '#ff8a7a', 1); bnBurst(best.x, best.y, 12, ['#3b3048', '#ff7a3a', '#ffd23a'], 230); bnRing(best.x, best.y, '#ff7a3a', 70); bnShake(12); BN.flash = 0.7; BN.flashC = '#ff5a4a'; bnSfx('boomS', 0.6); bnVib(60); return true; }
  g.combo++; g.hits++;
  var m = bnMult(g.combo - 1, 4), base = best.kind === 'g' ? 50 : best.kind === 's' ? 20 : 10;
  bnScore(g, base * m, best.x, best.y, best.kind === 'g' ? '#ffd23a' : '#ffffff', best.kind === 'g' || m >= 3);
  bnBurst(best.x, best.y, best.kind === 'g' ? 18 : 9, best.kind === 'g' ? ['#ffd23a', '#fff3a0', '#ffffff'] : best.kind === 's' ? ['#6fb4ff', '#ffffff', '#ffd23a'] : ['#ff7a96', '#ffffff', '#ffd23a'], best.kind === 'g' ? 260 : 180);
  bnRing(best.x, best.y, best.kind === 'g' ? '#ffd23a' : '#ffffff', best.kind === 'g' ? 80 : 50);
  bnShake(best.kind === 'g' ? 8 : 3); if (best.kind === 'g') { BN.flash = 0.5; BN.flashC = '#fff3a0'; }
  if (g.combo > 1 && (g.combo - 1) % 4 === 0 && m > 1) { bnPop(BN.W / 2, BN.top + 120, bnT('연속 {0}! 점수 {1}배', g.combo, m), '#ffd23a', 1); bnSfx('combo', 0.5); }
  bnSfx(best.kind === 'g' ? 'chest' : 'pop', best.kind === 'g' ? 0.6 : 0.5); bnVib(best.kind === 'g' ? 30 : 12);
  return true;
}
function bnGalDraw(x, g) {
  var wing = bnWingSpr();
  for (var i = 0; i < g.tg.length; i++) {
    var o = g.tg[i], sc = o.r / 32, pop = o.age < 0.15 ? 0.6 + o.age / 0.15 * 0.4 : 1, fl = Math.sin(o.wing + o.age * 16) * 0.5;
    if (!o.arc && o.kind !== 'b') { bnDraw(x, wing, o.x - o.r - 6, o.y - 6, sc * 1.05, -0.3 + fl); x.save(); x.translate(o.x + o.r + 6, o.y - 6); x.scale(-1, 1); bnDraw(x, wing, 0, 0, sc * 1.05, -0.3 + fl); x.restore(); }
    bnDraw(x, bnTargetSpr(o.kind), o.x, o.y, sc * pop, o.arc ? o.age * 2.4 : Math.sin(o.age * 3 + o.wing) * 0.08);
  }
}

// ---------- memory: 탑 카드 짝 맞추기 ----------
function bnMemInit(g) {
  var W = BN.W, areaT = BN.top + 92, areaB = BN.H - 24, cols = 4, rows = 4, gap = 8;
  var cw = Math.floor(Math.min(86, (W - 28 - gap * (cols - 1)) / cols)), ch = Math.floor(Math.min(cw * 1.22, (areaB - areaT - gap * (rows - 1)) / rows));
  var ox = (W - (cw * cols + gap * (cols - 1))) / 2, oy = areaT + Math.max(0, (areaB - areaT - (ch * rows + gap * (rows - 1))) / 2);
  var pics = BN.sim ? [] : bnTowerPics(8, Math.round(Math.min(cw, ch) * 0.9 * Math.max(1, BN.dpr))), deck = [];
  for (var i = 0; i < 8; i++) { deck.push(i); deck.push(i); }
  for (i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
  g.cw = cw; g.ch = ch; g.pics = pics; g.moves = 0; g.pairs = 0; g.sel = []; g.backT = 0; g.peek = 1.7; g.streak = 0;
  g.cards = deck.map(function (p, n) { return { p: p, x: ox + (n % cols) * (cw + gap) + cw / 2, y: oy + Math.floor(n / cols) * (ch + gap) + ch / 2, up: 1, f: 1, done: 0, wob: 0, pop: 0, dl: n * 0.03 }; });
}
function bnMemStep(g, dt) {
  var i, c;
  if (g.peek > 0) { g.peek -= dt; g.t = g.T; if (g.peek <= 0) { g.cards.forEach(function (q) { q.up = 0; }); bnSfx('tick', 0.4); } }
  if (g.backT > 0) { g.backT -= dt; if (g.backT <= 0) bnMemBack(g); }
  for (i = 0; i < g.cards.length; i++) {
    c = g.cards[i]; var tgt = c.up || c.done ? 1 : 0;
    if (c.f !== tgt) { if (c.dl > 0 && g.peek <= 0 && !g.moves) { c.dl -= dt; continue; } c.f += (tgt > c.f ? 1 : -1) * dt / 0.16; c.f = clamp(c.f, 0, 1); }
    if (c.wob > 0) c.wob = Math.max(0, c.wob - dt * 3); if (c.pop > 0) c.pop = Math.max(0, c.pop - dt * 2.6);
  }
}
function bnMemBack(g) { g.backT = 0; g.sel.forEach(function (c) { if (!c.done) c.up = 0; }); g.sel = []; }
function bnMemTap(g, X, Y) {
  if (g.peek > 0) return false;
  var hit = null; for (var i = 0; i < g.cards.length; i++) { var c = g.cards[i]; if (Math.abs(X - c.x) <= g.cw / 2 + 3 && Math.abs(Y - c.y) <= g.ch / 2 + 3) { hit = c; break; } }
  if (!hit || hit.done) return false;
  if (g.backT > 0) { var was = g.sel.indexOf(hit) >= 0; bnMemBack(g); if (was) return true; }   // 안 맞은 두 장이 떠 있을 때 누르면 바로 덮고 이어서
  if (hit.up) return false;
  hit.up = 1; hit.dl = 0; hit.pop = 0.5; g.sel.push(hit); bnSfx('click', 0.45); bnVib(8);
  if (g.sel.length < 2) return true;
  g.moves++;
  var a = g.sel[0], b = g.sel[1];
  if (a.p === b.p) {
    a.done = b.done = 1; a.pop = b.pop = 1; g.sel = []; g.pairs++; g.streak++; g.combo = g.streak;
    var v = 100 + (g.streak > 1 ? 50 * (g.streak - 1) : 0); g.score += v; BN.hudPop = 1;
    [a, b].forEach(function (c2) { bnBurst(c2.x, c2.y, 8, ['#ffd23a', '#ffffff', '#ff9cc8'], 190); bnRing(c2.x, c2.y, '#ffd23a', 56); });
    bnPop((a.x + b.x) / 2, (a.y + b.y) / 2, g.streak > 1 ? bnT('연속 {0}! +{1}', g.streak, v) : bnT('짝! +{0}', v), '#fff3a0', g.streak > 1);
    bnSfx(g.streak > 1 ? 'combo' : 'star', 0.55); bnVib(20); bnShake(3);
    if (g.pairs >= 8) { g.score += Math.round(g.t) * 10; g.end = 0.7; }
  } else { g.streak = 0; g.combo = 0; a.wob = b.wob = 1; g.backT = 0.7; bnSfx('warn', 0.25); }
  return true;
}
function bnMemDraw(x, g) {
  var M = BN_MOOD[BN.node.ch] || BN_MOOD[1], back = bnCardBackSpr(g.cw, g.ch, M), fr = bnCardFrontSpr(g.cw, g.ch, 0), frd = bnCardFrontSpr(g.cw, g.ch, 1);
  for (var i = 0; i < g.cards.length; i++) {
    var c = g.cards[i], f = c.f, sx = Math.abs(Math.cos((1 - f) * Math.PI)), face = f > 0.5, sc = 1 + Math.sin(c.pop * Math.PI) * 0.14, ox = c.wob > 0 ? Math.sin(c.wob * 22) * 5 * c.wob : 0;
    x.save(); x.translate(c.x + ox, c.y); x.scale(Math.max(0.04, sx) * sc, sc);
    if (face) { var s = c.done ? frd : fr; x.drawImage(s, -s.bw / 2, -s.bh / 2, s.bw, s.bh); var pc = g.pics[c.p].c, ps = Math.min(g.cw, g.ch) * 0.9; x.drawImage(pc, -ps / 2, -ps / 2, ps, ps); }
    else x.drawImage(back, -back.bw / 2, -back.bh / 2, back.bw, back.bh);
    x.restore();
  }
}

// ---------- catch: 금화 받기 ----------
function bnCatInit(g) { g.it = []; g.spT = 0.4; g.cx = BN.W / 2; g.tx = BN.W / 2; g.cy = BN.H - 62; g.sq = 0; g.lastX = BN.W / 2; g.got = 0; g.missed = 0; }
function bnCatStep(g, dt) {
  var W = BN.W, k = 1 - g.t / g.T, i, o;
  g.cx += (g.tx - g.cx) * Math.min(1, dt * 26); if (g.sq > 0) g.sq = Math.max(0, g.sq - dt * 5);
  g.spT -= dt;
  if (g.spT <= 0) {
    g.spT = Math.max(0.27, 0.56 - 0.04 * (g.lv - 1) - 0.22 * k) * (0.75 + Math.random() * 0.5);
    var q = Math.random(), bomb = 0.17 + 0.03 * g.lv, kind = q < bomb ? 'b' : q < bomb + 0.11 ? 'j' : q < bomb + 0.15 ? 'k' : 'c', X;
    do { X = 26 + Math.random() * (W - 52); } while (Math.abs(X - g.lastX) < 54);
    g.lastX = X;
    g.it.push({ kind: kind, x: X, y: -24, vy: (200 + 14 * g.lv + 120 * k) * (0.85 + Math.random() * 0.3), r: kind === 'b' ? 20 : kind === 'k' ? 20 : 17, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 5, age: 0 });
  }
  var top = g.cy - 22;
  for (i = g.it.length - 1; i >= 0; i--) {
    o = g.it[i]; o.age += dt; o.y += o.vy * dt; o.rot += o.vr * dt;
    if (o.y + o.r * 0.6 >= top && o.y - o.r <= top + 26 && Math.abs(o.x - g.cx) <= 44 + o.r * 0.45) {
      g.it.splice(i, 1); g.sq = 1;
      if (o.kind === 'b') { g.combo = 0; bnScore(g, -30, o.x, top - 6, '#ff8a7a', 1); bnBurst(o.x, top, 12, ['#3b3048', '#ff7a3a', '#ffd23a'], 230); bnRing(o.x, top, '#ff7a3a', 70); bnShake(12); BN.flash = 0.7; BN.flashC = '#ff5a4a'; bnSfx('boomS', 0.6); bnVib(60); continue; }
      g.combo++; g.got++;
      var m = bnMult(g.combo - 1, 5), base = o.kind === 'k' ? 50 : o.kind === 'j' ? 30 : 10, m0 = bnMult(g.combo - 2, 5);
      bnScore(g, base * m, o.x, top - 6, o.kind === 'j' ? '#bfe9ff' : '#fff3a0', o.kind !== 'c' || m >= 3);
      bnBurst(o.x, top, o.kind === 'c' ? 6 : 12, o.kind === 'j' ? ['#8fd3ff', '#ffffff'] : ['#ffd23a', '#fff3a0', '#ffffff'], 170);
      if (o.kind !== 'c') { bnRing(o.x, top, o.kind === 'j' ? '#8fd3ff' : '#ffd23a', 56); bnShake(4); }
      if (m > m0 && m > 1) { bnPop(W / 2, BN.top + 120, bnT('연속 {0}! 점수 {1}배', g.combo, m), '#ffd23a', 1); bnSfx('combo', 0.5); }
      bnSfx(o.kind === 'c' ? 'coinS' : o.kind === 'j' ? 'star' : 'chest', 0.5); bnVib(10);
    } else if (o.y - o.r > BN.H) { g.it.splice(i, 1); if (o.kind !== 'b') { g.combo = Math.max(0, g.combo - 5); g.missed++; } }
  }
}
function bnCatMove(g, X) { g.tx = clamp(X, 46, BN.W - 46); }
function bnCatDraw(x, g) {
  for (var i = 0; i < g.it.length; i++) { var o = g.it[i], s = bnItemSpr(o.kind); bnDraw(x, s, o.x, o.y, o.kind === 'b' ? o.r / 26 : o.r / 19, o.kind === 'c' ? 0 : Math.sin(o.rot) * 0.25); }
  var sq = Math.sin(g.sq * Math.PI) * 0.12, c = bnCartSpr();
  x.fillStyle = 'rgba(40,20,50,0.18)'; x.beginPath(); x.ellipse(g.cx, g.cy + 33, 44, 7, 0, 0, 6.283); x.fill();
  x.save(); x.translate(g.cx, g.cy + 32); x.scale(1 + sq, 1 - sq); x.rotate(clamp((g.tx - g.cx) * 0.004, -0.12, 0.12)); x.drawImage(c, -c.bw / 2, -c.bh + 3, c.bw, c.bh); x.restore();
}

// ---------- 공통: 시작, 한 걸음, 끝 ----------
function bnNewGame(node) {
  var D = BN_GAMES[node.game], g = { kind: node.game, lv: node.lv || node.ch || 1, score: 0, combo: 0, end: -1 };
  g.T = node.game === 'memory' ? D.sec - 5 * (g.lv - 1) : D.sec; g.t = g.T;
  if (g.kind === 'gallery') bnGalInit(g); else if (g.kind === 'memory') bnMemInit(g); else bnCatInit(g);
  return g;
}
function bnStep(g, dt) {
  if (g.end >= 0) { g.end -= dt; if (g.kind === 'memory') bnMemStep(g, dt); return g.end <= 0; }
  g.t -= dt;
  if (g.kind === 'gallery') bnGalStep(g, dt); else if (g.kind === 'memory') bnMemStep(g, dt); else bnCatStep(g, dt);
  if (g.t <= 0) { g.t = 0; return true; }
  return false;
}
function bnStarsOf(g) {
  var D = BN_GAMES[g.kind], s = 0, i;
  if (g.kind === 'memory') { if (g.pairs < 8) return 0; for (i = 0; i < 3; i++) if (g.moves <= D.moves[i]) s = i + 1; return s; }
  for (i = 0; i < 3; i++) if (g.score >= D.stars[i]) s = i + 1; return s;
}
function bnDown(X, Y) {
  var g = BN.g; if (!g || BN.st !== 'play' || g.end >= 0) return;
  if (g.kind === 'gallery') bnGalTap(g, X, Y); else if (g.kind === 'memory') bnMemTap(g, X, Y); else bnCatMove(g, X);
}
function bnMove(X, Y) { var g = BN.g; if (g && BN.st === 'play' && g.kind === 'catch') bnCatMove(g, X); }
function bnFrame(ts) {
  if (!BN.on) { BN.raf = 0; return; }
  BN.raf = requestAnimationFrame(bnFrame);
  var dt = Math.min(0.05, (ts - (BN.last || ts)) / 1000); BN.last = ts; BN.time += dt;
  try {
    var g = BN.g;
    if (BN.st === 'ready') { BN.readyT -= dt; if (BN.readyT <= 0) { BN.st = 'play'; bnSfx('horn', 0.4); } }
    else if (BN.st === 'play' && g) { var t0 = Math.ceil(g.t); if (bnStep(g, dt)) { BN.st = 'over'; BN.overT = 0.75; bnSfx('bell', 0.5); bnVib(40); } else if (g.t <= 5 && Math.ceil(g.t) !== t0 && g.end < 0) bnSfx('tick', 0.5); }
    else if (BN.st === 'over') { BN.overT -= dt; if (BN.overT <= 0) bnFinish(); }
    bnFxStep(dt); bnRender();
  } catch (e) { if (!BN.err) { BN.err = 1; console.error(e); } }
}
function bnRender() {
  var x = BN.x, g = BN.g, W = BN.W, H = BN.H, M = BN_MOOD[(BN.node || {}).ch] || BN_MOOD[1];
  x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(bnBg(), 0, 0);
  x.setTransform(BN.dpr, 0, 0, BN.dpr, 0, 0);
  if (BN.shake > 0) x.translate((Math.random() - 0.5) * BN.shake, (Math.random() - 0.5) * BN.shake);
  if (g) { if (g.kind === 'gallery') bnGalDraw(x, g); else if (g.kind === 'memory') bnMemDraw(x, g); else bnCatDraw(x, g); }
  bnFxDraw(x);
  if (BN.flash > 0) { x.globalAlpha = BN.flash * 0.35; x.fillStyle = BN.flashC; x.fillRect(-20, -20, W + 40, H + 40); x.globalAlpha = 1; }
  x.setTransform(BN.dpr, 0, 0, BN.dpr, 0, 0);
  if (!g) return;
  // 위 막대: 점수, 배수, 남은 시간 막대
  var top = BN.top + 8, f = clamp(g.t / g.T, 0, 1), low = g.t <= 5 && BN.st === 'play' && g.end < 0, bx = 14, bw = W - 28, by = top + 50, bh = 14;
  x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.fillStyle = M.hud; x.strokeStyle = '#4a2a5a'; x.lineWidth = 3; var sp = uiRR(12, top, 132, 40, 20); x.fill(sp); x.stroke(sp);
  x.textAlign = 'left'; x.font = '14px CUTE, PRT, sans-serif'; x.fillStyle = M.ink; x.fillText(bnT(g.kind === 'memory' ? '짝' : '점수'), 26, top + 21);
  x.textAlign = 'right'; x.font = Math.round(24 + BN.hudPop * 6) + 'px CUTE, PRT, sans-serif'; x.fillText(g.kind === 'memory' ? g.pairs + ' / 8' : String(g.score), 132, top + 21);
  var mu = g.kind === 'gallery' ? bnMult(g.combo, 4) : bnMult(g.combo, 5), lab = g.kind === 'memory' ? bnT('뒤집기 {0}', g.moves) : mu > 1 ? bnT('점수 {0}배', mu) : g.combo > 1 ? bnT('연속 {0}', g.combo) : '';
  if (lab) { x.font = '17px CUTE, PRT, sans-serif'; var lw = x.measureText(lab).width + 24, lp = uiRR(152, top + 4, lw, 32, 16); x.fillStyle = g.kind === 'memory' ? M.hud : '#ffd23a'; x.fill(lp); x.stroke(lp); x.textAlign = 'center'; x.fillStyle = g.kind === 'memory' ? M.ink : '#6a3c00'; x.fillText(lab, 152 + lw / 2, top + 21); }
  var pulse = low ? 1 + Math.sin(BN.time * 14) * 0.12 : 1;
  x.fillStyle = M.barBg; var bp = uiRR(bx, by, bw, bh, 7); x.fill(bp);
  if (f > 0.005) { x.fillStyle = low ? '#ff5a4a' : M.bar; x.fill(uiRR(bx + 2, by + 2, Math.max(10, (bw - 4) * f), bh - 4, 5)); }
  x.lineWidth = 2.5; x.strokeStyle = '#4a2a5a'; x.stroke(bp);
  x.textAlign = 'right'; x.font = Math.round(17 * pulse) + 'px CUTE, PRT, sans-serif'; x.lineWidth = 4; x.strokeStyle = '#4a2a5a'; var tt = bnT('{0}초', Math.ceil(g.t)); x.strokeText(tt, W - 16, by + bh + 14); x.fillStyle = low ? '#ffb0a6' : '#ffffff'; x.fillText(tt, W - 16, by + bh + 14);
  if (BN.st === 'ready') {
    var rt = BN.readyT, txt = bnT(rt > 0.55 ? '준비' : '시작!'), k = rt > 0.55 ? (1.1 - rt) / 0.55 : (0.55 - rt) / 0.55, sc = 0.7 + easeBack(clamp(k * 2.2, 0, 1)) * 0.5;
    var ry = g.kind === 'memory' ? BN.top + 122 : H * 0.42, rs = g.kind === 'memory' ? 34 : 54;
    x.textAlign = 'center'; x.font = Math.round(rs * sc) + 'px CUTE, PRT, sans-serif'; x.lineWidth = g.kind === 'memory' ? 7 : 9; x.strokeStyle = '#4a2a5a'; x.strokeText(txt, W / 2, ry); x.fillStyle = rt > 0.55 ? '#ffffff' : '#ffd23a'; x.fillText(txt, W / 2, ry);
  }
  if (BN.st === 'over') {
    var ot = bnT(g.kind === 'memory' && g.pairs >= 8 ? '모두 맞혔어요!' : '끝!'), ok2 = easeBack(clamp((0.75 - BN.overT) / 0.3, 0, 1));
    x.textAlign = 'center'; x.font = Math.round((ot.length > 3 ? 38 : 60) * (0.5 + ok2 * 0.5)) + 'px CUTE, PRT, sans-serif'; x.lineWidth = 9; x.strokeStyle = '#4a2a5a'; x.strokeText(ot, W / 2, H * 0.42); x.fillStyle = '#ffd23a'; x.fillText(ot, W / 2, H * 0.42);
  }
  if (g.kind === 'memory' && g.peek > 0 && BN.st === 'play') { x.textAlign = 'center'; x.font = '18px CUTE, PRT, sans-serif'; x.lineWidth = 5; x.strokeStyle = '#4a2a5a'; var pk = bnT('자리를 기억하세요'); x.strokeText(pk, W / 2, BN.H - 14); x.fillStyle = '#fff3a0'; x.fillText(pk, W / 2, BN.H - 14); }
}

// ---------- 층과 카드(안내, 결과, 그만하기) ----------
function bnLayer() {
  var L = $('bnLayer'); if (L) return L;
  L = document.createElement('section'); L.id = 'bnLayer'; L.className = 'hide';
  L.innerHTML = '<canvas id="bnCv"></canvas><button id="bnX" class="bnX">그만</button><div id="bnCard" class="bnCardWrap hide"></div>';
  $('app').appendChild(L);
  var cv = L.querySelector('#bnCv'); BN.cv = cv; BN.x = cv.getContext('2d');
  var pt = function (e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); BN.down = 1; var p = pt(e); bnDown(p[0], p[1]); });
  cv.addEventListener('pointermove', function (e) { if (!BN.down && e.pointerType !== 'mouse') return; var p = pt(e); bnMove(p[0], p[1]); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (k) { cv.addEventListener(k, function () { BN.down = 0; }); });
  L.querySelector('#bnX').onclick = function (e) { e.stopPropagation(); bnSfx('click', 0.4); bnBack(); };
  window.addEventListener('resize', function () { if (BN.on) setTimeout(bnResize, 220); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && BN.on && BN.st === 'play') bnAskQuit(); });
  return L;
}
function bnResize() {
  var L = bnLayer(), W = L.clientWidth || window.innerWidth, H = L.clientHeight || window.innerHeight, d = Math.min(2, window.devicePixelRatio || 1), ch = W !== BN.W || H !== BN.H || d !== BN.dpr;
  BN.W = W; BN.H = H; BN.dpr = d; BN.top = typeof safeTop === 'function' ? safeTop() : 0;
  BN.cv.width = Math.round(W * d); BN.cv.height = Math.round(H * d);
  if (ch && BN.g && (BN.st === 'play' || BN.st === 'ready')) { BN.g = bnNewGame(BN.node); BN.st = 'ready'; BN.readyT = 1.1; }   // 화면이 바뀌면 자리 계산을 새로(드문 일)
}
function bnCard(html) { var c = $('bnCard'); c.innerHTML = '<div class="modal bnCard">' + html + '</div>'; c.classList.remove('hide'); $('bnX').classList.add('hide'); return c; }
function bnCardHide() { $('bnCard').classList.add('hide'); $('bnCard').innerHTML = ''; }
function bnGemImg(px) { return '<img src="' + (typeof uiIcon === 'function' ? uiIcon('gem', px || 48) : '') + '" alt="">'; }
function bnTkImg(px) { return '<img src="' + (typeof gcIcon === 'function' ? gcIcon('ticket', px || 48) : '') + '" alt="">'; }
function bnGameIcon(game, px) {
  var k = 'gi' + game + px; if (BN.spr[k]) return BN.spr[k];
  var d0 = BN.dpr; BN.dpr = 2; var c = mkC(px, px), x = cx2(c), s;
  if (game === 'gallery') { s = bnTargetSpr('g'); x.drawImage(s, 0, 0, px, px); }
  else if (game === 'catch') { s = bnItemSpr('c'); x.drawImage(s, px * 0.02, px * 0.02, px * 0.62, px * 0.62); s = bnItemSpr('j'); x.drawImage(s, px * 0.4, px * 0.38, px * 0.6, px * 0.6); }
  else { x.translate(px / 2, px / 2); x.rotate(-0.2); s = bnCardBackSpr(40, 50, BN_MOOD[1]); x.drawImage(s, -px * 0.42, -px * 0.4, px * 0.6, px * 0.74); x.rotate(0.42); s = bnCardFrontSpr(40, 50, 1); x.drawImage(s, -px * 0.14, -px * 0.36, px * 0.6, px * 0.74); x.fillStyle = '#ffb000'; bnStarAt(x, px * 0.16, 0, px * 0.16, px * 0.07, 5); }
  BN.dpr = d0; return (BN.spr[k] = c.toDataURL());
}
// 지금 받을 수 있는 보상 안내 한 줄
function bnRewardLine(id) {
  var s = bnSt(id);
  if (!s.done) return '<div class="bnRew">첫 완료 보상 ' + bnGemImg() + '<b>' + BN_FIRST.gems + '~' + (BN_FIRST.gems + BN_FIRST.s2 + BN_FIRST.s3) + '</b> ' + bnTkImg() + '<b>' + BN_FIRST.tk + '~' + (BN_FIRST.tk + BN_FIRST.s3tk) + '</b></div>';
  if (!s.today) return '<div class="bnRew">오늘 보상 ' + bnGemImg() + '<b>' + BN_DAILY[0] + '~' + BN_DAILY[2] + '</b>' + (s.star < 3 ? ' <span>별 3개 처음이면 덤</span>' : '') + '</div>';
  return '<div class="bnRew bnGot">오늘 보상은 받았습니다. 연습은 얼마든지 할 수 있어요' + (s.star < 3 ? ' (별을 더 받으면 덤 보상)' : '') + '</div>';
}
function bnOpen(v) {
  var n = bnNode(v); if (!n || !BN_GAMES[n.game]) return false;
  if (!bnUnlocked(n)) { toast(n.ch + '장 ' + n.after + '판을 지키면 열립니다', 1800); try { sfx('warn', 0.3); } catch (e) { } return false; }
  if (UI.modalOpen) closeModal();
  var L = bnLayer(); BN.node = n; BN.on = 1; BN.g = null; BN.st = 'intro'; BN.parts = []; BN.pops = []; BN.shake = 0; BN.flash = 0; BN.res = null; BN.err = 0;
  L.setAttribute('data-ch', n.ch); L.classList.remove('hide'); bnResize();
  bnWrapBack();
  if (!BN.raf) { BN.last = 0; BN.raf = requestAnimationFrame(bnFrame); }
  bnIntro(); return true;
}
function bnIntro() {
  var n = BN.node, D = BN_GAMES[n.game], s = bnSt(n.id);
  BN.st = 'intro'; BN.g = null;
  var h = '<div class="bnTag">' + n.ch + '장 보너스</div><div class="pt">' + esc(n.name || D.name) + '</div><div class="bnHead"><img src="' + bnGameIcon(n.game, 96) + '" alt=""><div><b>' + D.name + '</b><span>' + (n.game === 'memory' ? '제한 시간 ' + (D.sec - 5 * ((n.lv || 1) - 1)) + '초' : D.sec + '초') + (s.best ? ', 최고 ' + s.best + '점' : '') + '</span></div></div>' +
    '<ul class="bnHow">' + D.how.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' + bnRewardLine(n.id) +
    '<div class="mbtns"><button class="btn gold" id="bnGo">시작</button></div><button class="xbtn" id="bnClose">닫기</button>';
  bnCard(h);
  $('bnGo').onclick = function () { bnSfx('ui', 0.6); bnStart(); };
  $('bnClose').onclick = function () { bnSfx('click', 0.3); bnClose(); };
}
function bnStart() {
  bnCardHide(); $('bnX').classList.remove('hide');
  BN.parts = []; BN.pops = []; BN.g = bnNewGame(BN.node); BN.st = 'ready'; BN.readyT = 1.1; BN.res = null;
}
function bnAskQuit() {
  if (BN.st !== 'play' && BN.st !== 'ready') return;
  BN.prev = BN.st; BN.st = 'pause';
  bnCard('<div class="pt">잠깐 멈춤</div><p class="bnMsg">지금 나가면 이번 판 점수는 남지 않습니다.</p><div class="mbtns"><button class="btn" id="bnQuit">나가기</button><button class="btn gold" id="bnResume">계속하기</button></div>');
  $('bnQuit').onclick = function () { bnSfx('click', 0.3); bnClose(); };
  $('bnResume').onclick = function () { bnSfx('click', 0.4); bnCardHide(); $('bnX').classList.remove('hide'); BN.st = BN.prev || 'play'; BN.last = 0; };
}
function bnFinish() {
  var g = BN.g, n = BN.node, D = BN_GAMES[n.game], stars = bnStarsOf(g), r = bnRec(n.id), best0 = r.best || 0;
  BN.st = 'end'; BN.endAt = performance.now(); r.n = (r.n || 0) + 1; if (g.score > best0) r.best = g.score;
  var rew = bnReward(n.id, stars); bnGive(rew); bnSave(n.id); BN.changed = 1;
  BN.res = { stars: stars, score: g.score, rew: rew, best: r.best, isBest: g.score > best0 && best0 > 0 };
  var ok = stars > 0, need = n.game === 'memory' ? '제한 시간 안에 8쌍을 모두 맞히면 보상을 받습니다' : D.stars[0] + '점 이상이면 보상을 받습니다';
  var h = '<div class="pt">' + (ok ? (stars >= 3 ? '완벽해요!' : '성공!') : n.game === 'memory' ? '시간 끝' : '아쉬워요') + '</div><div class="bnStars">' + [0, 1, 2].map(function (i) { return '<img class="' + (i < stars ? 'on' : '') + '" src="' + icon(i < stars ? 'star' : 'starOff', 64) + '" alt="">'; }).join('') + '</div>' +
    '<div class="bnScore"><span>' + (n.game === 'memory' ? '맞힌 짝 ' + g.pairs + ' / 8, 뒤집기 ' + g.moves + '번' : '점수') + '</span><b>' + g.score + '</b>' + (BN.res.isBest ? '<em>새 기록</em>' : '<i>최고 ' + r.best + '</i>') + '</div>';
  if (rew.gems || rew.tk) h += '<div class="bnGain" id="bnGain"><span>' + (rew.first ? '첫 완료 보상' : rew.daily ? '오늘 보상' : '별 보상') + (rew.up && (rew.first || rew.daily) ? ' + 별 덤' : '') + '</span>' + (rew.gems ? '<b>' + bnGemImg(64) + '+' + rew.gems + '</b>' : '') + (rew.tk ? '<b>' + bnTkImg(64) + '+' + rew.tk + '</b>' : '') + '</div>';
  else if (!ok) h += '<div class="bnRew bnGot">' + need + '</div>';
  else if (rew.capped) h += '<div class="bnRew bnGot">오늘 보너스 보석 ' + BN_DAILY_CAP + '개를 다 받았습니다. 내일 다시 받을 수 있습니다</div>';
  var s = bnSt(n.id);
  h += '<p class="bnNote">' + (!ok ? '보상을 받을 때까지 몇 번이든 다시 할 수 있습니다.' : s.star < 3 ? '보상은 칸마다 하루 1번입니다. 다시 하기는 연습이고, 별을 더 받으면 덤 보상이 있습니다.' : '보상은 칸마다 하루 1번입니다. 다시 하기는 연습입니다(보상 없음).') + '</p>' +
    '<div class="mbtns bnEndBtns"><button class="btn" id="bnAgain">다시 하기</button><button class="btn gold" id="bnDone">' + (UI.scr === 'sMap' || UI.scr === 'map' ? '지도로' : '닫기') + '</button></div>';
  bnCard(h);
  bnSfx(ok ? 'upgradeBig' : 'warn', ok ? 0.6 : 0.3);
  setTimeout(function () { var c = $('bnCard'); if (!c) return; c.querySelectorAll('.bnStars img.on').forEach(function (im, i) { setTimeout(function () { im.classList.add('pop'); bnSfx('star', 0.5); }, i * 300); }); }, 250);
  if ((rew.gems || rew.tk) && typeof uiStarBurst === 'function') setTimeout(function () { var gEl = $('bnGain'); if (gEl && BN.on) { try { uiStarBurst(gEl); bnSfx('coin', 0.5); } catch (e) { } } }, 500 + stars * 300);
  $('bnAgain').onclick = function () { if (performance.now() - BN.endAt < 700) return; bnSfx('ui', 0.5); bnStart(); };
  $('bnDone').onclick = function () { if (performance.now() - BN.endAt < 700) return; bnSfx('click', 0.4); bnClose(); };
}
function bnClose() {
  var L = $('bnLayer'); BN.on = 0; BN.st = ''; BN.g = null; BN.parts = []; BN.pops = [];
  if (L) { L.classList.add('hide'); bnCardHide(); }
  try { if (typeof uiMetaDots === 'function') uiMetaDots(); } catch (e) { }
  if (BN.changed) { BN.changed = 0; BN.fabKey = ''; try { if (typeof chMapRefresh === 'function') chMapRefresh(); } catch (e2) { } }
}
// 닫기 단추와 안드로이드 뒤로 가기: 놀이 중이면 멈추고 물어봄, 멈춤 창이면 계속, 안내와 결과 창이면 닫음
function bnBack() {
  if (!BN.on) return false;
  if (BN.st === 'play' || BN.st === 'ready') bnAskQuit();
  else if (BN.st === 'over') { }
  else if (BN.st === 'pause') { var b = $('bnResume'); if (b) b.click(); }
  else bnClose();
  return true;
}
function bnWrapBack() {
  var ob = window.__appBack; if (typeof ob !== 'function' || ob.bnWrap) return;
  var nb = function () { try { if (BN.on && !(typeof metaUI !== 'undefined' && metaUI.ad)) { bnBack(); return 'ok'; } } catch (e) { } return ob(); };
  nb.bnWrap = 1; if (ob.metaWrap) nb.metaWrap = 1; window.__appBack = nb;
}

// ---------- 지도 대비책: 보너스 단추와 목록 ----------
function bnAnyReward() { if (typeof BONUS_NODES === 'undefined') return false; return BONUS_NODES.some(function (n) { var s = bnSt(n.id); return s.open && !s.today; }); }
function bnList() {
  if (typeof BONUS_NODES === 'undefined') return;
  var chs = []; BONUS_NODES.forEach(function (n) { if (chs.indexOf(n.ch) < 0) chs.push(n.ch); });
  var h = '<div class="pt">보너스 게임</div><p class="bnSub">판을 지키면 열립니다. 보상은 칸마다 하루 1번</p><div class="bnList">';
  chs.forEach(function (c) {
    var C = typeof fdChapter === 'function' ? fdChapter(c) : null;
    h += '<div class="bnCh"><span>' + c + '장' + (C && C.name ? ' ' + esc(C.name) : '') + '</span></div><div class="bnRow">';
    BONUS_NODES.filter(function (n) { return n.ch === c; }).forEach(function (n) {
      var s = bnSt(n.id), tag = !s.open ? n.after + '판 뒤' : !s.done ? '첫 보상' : !s.today ? '오늘 보상' : '받음';
      h += '<button class="bnNode' + (s.open ? '' : ' bnLock') + (s.open && !s.today ? ' bnNew' : '') + '" data-id="' + n.id + '"><img src="' + (s.open ? bnGameIcon(n.game, 96) : icon('lock', 64)) + '" alt=""><b>' + esc(n.name) + '</b>' +
        '<i>' + [0, 1, 2].map(function (i) { return '<img src="' + icon(i < s.star ? 'star' : 'starOff', 32) + '" alt="">'; }).join('') + '</i><em>' + tag + '</em></button>';
    });
    h += '</div>';
  });
  h += '</div><button class="xbtn" id="bnLClose">닫기</button>';
  openModal(h, 'bnlist');
  $('modal').querySelectorAll('.bnNode').forEach(function (b) { b.onclick = function () { try { sfx('ui', 0.5); } catch (e) { } bnOpen(b.getAttribute('data-id')); }; });
  $('bnLClose').onclick = function () { closeModal(); };
}
// 지도 화면에서 다른 갈래가 bnState를 부르지 않으면(보너스 칸을 안 그림) 단추를 보여 준다
function bnFabSync() {
  var f = BN.fab; if (!f) return;
  var map = $('sMap') && !$('sMap').classList.contains('hide') && UI.scr !== 'battle', show = !!map && !BN.on && !UI.modalOpen && !BN.ext && typeof BONUS_NODES !== 'undefined' && typeof chBonus !== 'function';   // v2.0: 챕터 지도가 보너스 칸을 그리므로 구석 단추는 안 씀(챕터 고르기 카드와 겹침)
  var key = show ? 'm' + (bnAnyReward() ? 1 : 0) : 'x'; if (key === BN.fabKey) return; BN.fabKey = key;
  f.classList.toggle('hide', !show); if (show) f.querySelector('i').classList.toggle('hide', key !== 'm1');
}
function bnInit() {
  if (BN.inited) return; BN.inited = 1;
  var f = document.createElement('button'); f.id = 'bnFab'; f.className = 'bnFab hide'; f.innerHTML = '<img src="' + bnGameIcon('gallery', 64) + '" alt=""><span>보너스</span><i class="dot hide"></i>';
  f.onclick = function (e) { e.stopPropagation(); try { sfx('ui', 0.5); } catch (er) { } bnList(); };
  $('app').appendChild(f); BN.fab = f;
  setInterval(function () { try { bnFabSync(); } catch (e) { } }, 250);
  document.addEventListener('click', function () { setTimeout(function () { try { bnFabSync(); } catch (e) { } }, 80); }, true);   // 화면이 바뀌는 탭 직후 바로 맞춤
  bnWrapBack();
}
// 시험용 (tools/xflow.py, 브라우저 콘솔). sim: 화면 없이 손가락 흉내로 한 판을 돌려 점수와 별을 봄(별 기준 맞추기)
window.__bn = {
  open: function (id) { return bnOpen(id); }, list: function () { bnList(); }, close: function () { bnClose(); }, back: function () { return bnBack(); }, state: function (id) { return bnSt(id); }, rec: function (id) { return JSON.parse(JSON.stringify(bnRec(id))); },
  nodes: function () { return typeof BONUS_NODES === 'undefined' ? [] : BONUS_NODES; }, left: function (t) { if (BN.g) BN.g.t = t; }, res: function () { return BN.res; }, ext: function (v) { if (v != null) { BN.ext = v; BN.fabKey = ''; } return BN.ext; },
  st: function () {
    var g = BN.g, o = { on: BN.on, st: BN.st, W: BN.W, H: BN.H, err: BN.err || 0, card: !!$('bnCard') && !$('bnCard').classList.contains('hide') };
    if (g) { o.kind = g.kind; o.t = g.t; o.score = g.score; o.combo = g.combo; o.end = g.end;
      if (g.kind === 'gallery') o.tg = g.tg.map(function (q) { return { k: q.kind, x: q.x, y: q.y, r: q.r, vx: q.arc ? q.vx : q.vx, vy: q.arc ? q.vy : 0 }; });
      if (g.kind === 'memory') { o.peek = g.peek; o.moves = g.moves; o.pairs = g.pairs; o.backT = g.backT; o.cards = g.cards.map(function (c) { return { p: c.p, x: c.x, y: c.y, up: c.up, done: c.done }; }); }
      if (g.kind === 'catch') { o.cx = g.cx; o.cy = g.cy; o.it = g.it.map(function (q) { return { k: q.kind, x: q.x, y: q.y, vy: q.vy, r: q.r }; }); } }
    return o;
  },
  sim: function (game, lv, skill, n) {
    var out = [], W0 = BN.W, H0 = BN.H; BN.sim = 1; if (!BN.x) { BN.W = 360; BN.H = 640; }
    for (var q = 0; q < (n || 10); q++) {
      var g = bnNewGame({ game: game, lv: lv || 1, ch: 1 }), dt = 1 / 60, cd = 0.5, seen = {}, i;
      if (game === 'memory') g.pics = [];
      while (!bnStep(g, dt)) {
        cd -= dt;
        if (game === 'gallery' && cd <= 0) {
          var c = null; for (i = 0; i < g.tg.length; i++) { var o = g.tg[i]; if (o.kind !== 'b' && o.x > 30 && o.x < BN.W - 30 && o.y > g.y0 && o.y < BN.H - 30 && (!c || o.kind === 'g')) c = o; }
          if (c) { var er = (1 - skill) * 30 + 5, lag = 0.1 + (1 - skill) * 0.12; bnGalTap(g, c.x - (c.vx || 0) * lag + (Math.random() - 0.5) * 2 * er, c.y - (c.arc ? c.vy * lag : 0) + (Math.random() - 0.5) * 2 * er); cd = 0.42 + (1 - skill) * 0.5 + Math.random() * 0.2; }
        } else if (game === 'catch') {
          var bst = null, bs = -1e9; for (i = 0; i < g.it.length; i++) { var it = g.it[i]; if (it.kind === 'b') continue; var tt = (g.cy - 22 - it.y) / it.vy, reach = Math.abs(it.x - g.tx) / (220 + 380 * skill); if (tt > 0.05 && reach < tt && -tt > bs) { bs = -tt; bst = it; } }
          var want = bst ? bst.x : g.tx; for (i = 0; i < g.it.length; i++) { var bb = g.it[i]; if (bb.kind === 'b' && Math.abs(bb.x - want) < 60 && (g.cy - 22 - bb.y) / bb.vy < 0.5 && Math.random() < skill) want += bb.x < want ? 70 : -70; }
          var mv = (220 + 380 * skill) * dt; g.tx = clamp(g.tx + clamp(want - g.tx, -mv, mv), 46, BN.W - 46);
        } else if (game === 'memory' && cd <= 0 && g.peek <= 0) {
          if (g.backT > 0) { bnMemBack(g); }
          var down = g.cards.filter(function (c2) { return !c2.up && !c2.done; }), pick = null, k2;
          if (g.sel.length === 1) { for (k2 in seen) if (seen[k2].p === g.sel[0].p && seen[k2].c !== g.sel[0] && !seen[k2].c.done && Math.random() < skill) pick = seen[k2].c; }
          else { var ks = Object.keys(seen); for (i = 0; i < ks.length && !pick; i++) for (var j = i + 1; j < ks.length; j++) if (seen[ks[i]].p === seen[ks[j]].p && !seen[ks[i]].c.done && Math.random() < skill) { pick = seen[ks[i]].c; break; } }
          if (!pick) { var un = down.filter(function (c2) { return !seen[g.cards.indexOf(c2)]; }); pick = (un.length ? un : down)[Math.floor(Math.random() * (un.length ? un.length : down.length))]; }
          if (pick) { seen[g.cards.indexOf(pick)] = { p: pick.p, c: pick }; bnMemTap(g, pick.x, pick.y); cd = 0.55 + (1 - skill) * 0.5; }
        }
      }
      out.push({ score: g.score, stars: bnStarsOf(g), moves: g.moves, pairs: g.pairs, hits: g.hits, shots: g.shots, got: g.got, missed: g.missed });
    }
    BN.sim = 0; BN.W = W0; BN.H = H0; return out;
  }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(bnInit, 0); }); else setTimeout(bnInit, 0);
