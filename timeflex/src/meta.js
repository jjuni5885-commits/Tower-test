// ===== meta.js : 보석, 상점, 광고 자리, 도감 보상, 일일 임무 (+ 실제 보이는 높이 맞춤) =====
// 주석 표시: '// [BM]' 수익화(보석, 상점, 광고) / '// [재방문]' 다시 들어올 이유(일일 임무, 도감 보상)
// 저장 항목(ui.js defSave): gems, skin{tower,proj}, owned{berry,star,heart,candy}, slain, codexGot, daily, adGem
// 다른 작업과의 약속: 탑 스킨 그림은 art_tower.js(twSkinReset, twSkinPreview), 화살 스킨은 render.js(fxProjPreview). 없으면 임시 그림
var metaUI = { inited: 0, prev: {}, ad: null, adSeq: 0, saveT: 0, rzT: 0, shopTab: 'tower', shopSel: {} };

// ---------- 실제 보이는 높이 ----------
// CSS는 100dvh(지원 시)를 쓰고, 여기서 window.innerHeight(보이는 영역이 더 작으면 visualViewport) 값으로 --appH를 덮어씀
function uiFitVars() {
  var de = document.documentElement, h = window.innerHeight || de.clientHeight, w = window.innerWidth || de.clientWidth, vv = window.visualViewport;
  if (vv && vv.scale <= 1.01 && vv.height > 0 && vv.height < h - 1) h = vv.height;
  if (h > 0) de.style.setProperty('--appH', Math.floor(h) + 'px');
  if (w > 0) de.style.setProperty('--appW', Math.floor(w) + 'px');
}
function uiFitInit() {
  uiFitVars();
  var on = function () { uiFitVars(); clearTimeout(metaUI.rzT); metaUI.rzT = setTimeout(function () { uiFitVars(); metaOnResize(); }, 160); };
  window.addEventListener('resize', on);
  window.addEventListener('orientationchange', function () { on(); setTimeout(on, 400); });
  window.addEventListener('pageshow', on);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', on);
}
// 크기가 바뀌면 열린 지역 창의 지도 미리보기를 새 칸 크기로 다시 그림
function metaOnResize() {
  if (UI.modalOpen && UI.modalKind === 'stage' && $('prevCv') && UI.stageMi != null) drawPreview($('prevCv'), UI.stageMi);
}

// ---------- 시작 ----------
function metaInit() {
  if (metaUI.inited) return; metaUI.inited = 1;
  uiSetIcons();
  uiGemsShow(false);
  var q = $('bQuest'), sh = $('bShop'), mg = $('mGem');
  if (q) q.onclick = function () { sfx('ui', 0.5); uiQuests(); };
  if (sh) sh.onclick = function () { sfx('ui', 0.5); uiShop(); };
  gcInit();   // 소환 단추, 탑 칸 길게 누르기
  if (mg) mg.onclick = function () { sfx('ui', 0.5); uiShop(); };
  // [재방문] 앱이 뒤로 가면 모아 둔 임무 진행, 처음 처치 기록을 바로 저장
  document.addEventListener('visibilitychange', function () { if (document.hidden && metaUI.saveT) metaSaveNow(); });
  // 안드로이드 뒤로 가기: 광고 자리 창이 떠 있으면 그것부터 닫음(보상 없음)
  var ob = window.__appBack;
  if (typeof ob === 'function' && !ob.metaWrap) {
    var nb = function () { try { if (metaUI.ad) { metaAdEnd(false, true); return 'ok'; } } catch (e) { } return ob(); };
    nb.metaWrap = 1; window.__appBack = nb;
  }
}

// ---------- 저장 ----------
function metaToday() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function metaSaveSoon() { if (metaUI.saveT) return; metaUI.saveT = setTimeout(function () { metaUI.saveT = 0; saveNow(); }, 1200); }
function metaSaveNow() { if (metaUI.saveT) { clearTimeout(metaUI.saveT); metaUI.saveT = 0; } saveNow(); }
// 불러온 저장의 새 항목 검사 (옛 저장에는 없음). 이 파일의 var를 쓰지 않음(ui.js가 먼저 부름)
function metaFixSave(s) {
  if (typeof s.gems !== 'number' || !isFinite(s.gems) || s.gems < 0) s.gems = 0;
  s.gems = Math.floor(s.gems);
  if (!s.skin || typeof s.skin !== 'object') s.skin = { tower: 'base', proj: 'base' };
  if (!s.owned || typeof s.owned !== 'object') s.owned = {};
  ['berry', 'star', 'heart', 'candy'].forEach(function (k) { s.owned[k] = s.owned[k] ? 1 : 0; });
  if (['berry', 'star'].indexOf(s.skin.tower) < 0 || !s.owned[s.skin.tower]) s.skin.tower = 'base';
  if (['heart', 'candy'].indexOf(s.skin.proj) < 0 || !s.owned[s.skin.proj]) s.skin.proj = 'base';
  s.skin.tower = 'base'; s.skin.proj = 'base';   // 타임플렉스 v1.0: 사탕 스킨(딸기 포탑, 하트 화살 등)은 시대 그림과 안 맞아 상점에서 뺌. 기본 모양으로 되돌림
  ['slain', 'codexGot'].forEach(function (k) { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
  var d = s.daily;
  if (!d || typeof d !== 'object' || !Array.isArray(d.ids)) s.daily = d = { day: '', ids: [], n: {}, got: {} };
  if (!d.n || typeof d.n !== 'object') d.n = {};
  if (!d.got || typeof d.got !== 'object') d.got = {};
  if (!s.adGem || typeof s.adGem !== 'object') s.adGem = { day: '', n: 0 };
  gcFixSave(s);   // [BM] 탑 소환 항목 (gacha.js, 함수 선언이라 먼저 불러도 됨)
  return s;
}
// 진행 기록 지우기: 보석, 산 스킨, 보상 받은 기록은 남김 (다시 받기 꼼수 막음, 나중에 실제 결제가 붙어도 산 것은 지키기)
function metaKeepWallet(n, o) { ['gems', 'skin', 'owned', 'slain', 'codexGot', 'daily', 'adGem', 'towers', 'tickets', 'gacha', 'tkRew', 'rwGot', 'fused', 'from', 'fromSeen', 'admin', 'admPin', 'admTw', 'admOpt', 'bonus', 'bnDay', 'lo'].forEach(function (k) { if (o && o[k] != null) n[k] = o[k]; }); return metaFixSave(n); }

// ---------- [BM] 보석 ----------
// 게임 안에서만 모으고 쓰는 보석 (현금 결제 없음). 얻는 곳: 일일 임무, 도감 보상, 상점 광고
function metaGemAdd(n) { SAVE.gems = Math.max(0, Math.floor((SAVE.gems || 0) + n)); metaSaveNow(); uiGemsShow(n > 0); }
function uiGemsShow(bump) {
  document.querySelectorAll('.gemN').forEach(function (b) {
    b.textContent = fmt(SAVE.gems || 0);
    if (bump) { var p = b.parentNode; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
  });
}
// 보석 받기 반짝 연출: 받은 자리(요소나 사각형)에서 +N과 반짝이
function uiGemBurst(at, n) {
  var app = $('app'), ar = app.getBoundingClientRect(), r = at && at.getBoundingClientRect ? at.getBoundingClientRect() : at;
  var cx = r ? r.left + r.width / 2 - ar.left : ar.width / 2, cy = r ? r.top + r.height / 2 - ar.top : ar.height / 2;
  var d = document.createElement('div'); d.className = 'gburst'; d.style.left = Math.round(cx) + 'px'; d.style.top = Math.round(cy) + 'px';
  var h = '<b><img src="' + uiIcon('gem', 64) + '" alt="">+' + n + '</b>';
  for (var i = 0; i < 8; i++) h += '<i style="--a:' + (i * 45 + 22) + 'deg"></i>';
  d.innerHTML = h; app.appendChild(d);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1100);
  try { sfx('star', 0.5); vib(15); } catch (e) { }
}

// ---------- 아이콘 (보석, 상점 가방, 임무판, 광고 TV): ui_art.js icon()과 같은 사탕 칠 ----------
var uiIconCache = {};
function uiIcon(name, px) {
  px = px || 64; var key = name + px; if (uiIconCache[key]) return uiIconCache[key];
  var c = mkC(px, px), x = cx2(c), m = px / 2, s = px / 64;
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (name === 'gem') {
    // 보석: 위가 평평하고 아래가 뾰족한 하늘빛 보석, 면마다 밝기를 달리
    var top = m - 16 * s, mid = m - 4 * s, bot = m + 25 * s;
    var g = new Path2D(); g.moveTo(m - 13 * s, top); g.lineTo(m + 13 * s, top); g.lineTo(m + 25 * s, mid); g.lineTo(m, bot); g.lineTo(m - 25 * s, mid); g.closePath();
    uiCandy(x, g, top, bot, ['#e9fbff', '#8fe0ff', '#7fa2ff'], '#4f6bd0', 2.6 * s);
    var tb = new Path2D(); tb.moveTo(m - 13 * s, top); tb.lineTo(m + 13 * s, top); tb.lineTo(m + 25 * s, mid); tb.lineTo(m - 25 * s, mid); tb.closePath();
    x.save(); x.globalAlpha = 0.45; x.fillStyle = '#ffffff'; x.fill(tb); x.restore();
    var lt = new Path2D(); lt.moveTo(m - 25 * s, mid); lt.lineTo(m - 10 * s, mid); lt.lineTo(m, bot); lt.closePath();
    x.save(); x.globalAlpha = 0.32; x.fillStyle = '#ffffff'; x.fill(lt); x.restore();
    var dk = new Path2D(); dk.moveTo(m + 10 * s, mid); dk.lineTo(m + 25 * s, mid); dk.lineTo(m, bot); dk.closePath();
    x.save(); x.globalAlpha = 0.2; x.fillStyle = '#4b3ac8'; x.fill(dk); x.restore();
    x.strokeStyle = 'rgba(79,107,208,0.5)'; x.lineWidth = 1.6 * s; x.beginPath();
    x.moveTo(m - 24 * s, mid); x.lineTo(m + 24 * s, mid);
    x.moveTo(m - 5 * s, top); x.lineTo(m - 10 * s, mid); x.lineTo(m, bot - 2 * s);
    x.moveTo(m + 5 * s, top); x.lineTo(m + 10 * s, mid); x.lineTo(m, bot - 2 * s);
    x.stroke();
    uiGloss(x, m - 9 * s, m - 10 * s, 5 * s, 2.3 * s, -0.25, 0.9);
    uiSpark(x, m + 19 * s, m - 19 * s, 7 * s, '#ffffff'); uiSpark(x, m + 19 * s, m - 19 * s, 3.4 * s, '#fff3a0');
  } else if (name === 'shop') {
    // 상점: 분홍 쇼핑백 + 하트
    x.strokeStyle = '#6a4a1a'; x.lineWidth = 6.5 * s; x.beginPath(); x.arc(m, m - 8 * s, 10 * s, Math.PI * 1.02, Math.PI * 1.98); x.stroke();
    x.strokeStyle = '#d8b878'; x.lineWidth = 2.6 * s; x.beginPath(); x.arc(m, m - 8 * s, 10 * s, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
    uiCandy(x, uiRR(m - 21 * s, m - 9 * s, 42 * s, 34 * s, 8 * s), m - 9 * s, m + 25 * s, ['#f0d8a8', '#d0a060', '#a87838'], '#5a3a14', 2.4 * s);   // 타임플렉스: 가죽 주머니
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.fill(uiRR(m - 18 * s, m - 7 * s, 36 * s, 6 * s, 3 * s));
    uiCandy(x, uiCircle(m, m + 9 * s, 8 * s), m + 1 * s, m + 17 * s, ['#fff3a0', '#ffc21a', '#e89a00'], '#a86a00', 1.6 * s);
    uiGloss(x, m - 13 * s, m - 1 * s, 4 * s, 2.2 * s, -0.4, 0.7);
    uiSpark(x, m + 21 * s, m - 19 * s, 6.5 * s, '#ffd84d'); uiSpark(x, m - 22 * s, m - 15 * s, 4 * s, '#ffffff');
  } else if (name === 'quest') {
    // 오늘 임무: 라일락 판에 체크 두 줄 + 빈칸, 금빛 집게와 별 딱지
    uiCandy(x, uiRR(m - 20 * s, m - 20 * s, 40 * s, 46 * s, 8 * s), m - 20 * s, m + 26 * s, ['#efe6ff', '#c9b3ff', '#a98bf5'], '#7356c4', 2.4 * s);
    x.fillStyle = '#ffffff'; x.fill(uiRR(m - 15 * s, m - 13 * s, 30 * s, 34 * s, 4 * s));
    uiCandy(x, uiRR(m - 9 * s, m - 25 * s, 18 * s, 10 * s, 4 * s), m - 25 * s, m - 15 * s, ['#fff3a0', '#ffc21a'], '#de8500', 1.8 * s);
    for (var i = 0; i < 3; i++) {
      var y = m - 5 * s + i * 10 * s;
      if (i < 2) { x.strokeStyle = '#ff6fa8'; x.lineWidth = 3 * s; x.beginPath(); x.moveTo(m - 11.5 * s, y); x.lineTo(m - 8 * s, y + 3.2 * s); x.lineTo(m - 3 * s, y - 3.4 * s); x.stroke(); }
      else { x.strokeStyle = '#cdbcec'; x.lineWidth = 2 * s; x.strokeRect(m - 11.5 * s, y - 3 * s, 6.5 * s, 6.5 * s); }
      x.strokeStyle = i < 2 ? '#dccdf6' : '#ebe3fa'; x.lineWidth = 2.6 * s; x.beginPath(); x.moveTo(m, y); x.lineTo(m + 10 * s, y); x.stroke();
    }
    uiGloss(x, m - 14 * s, m - 16 * s, 3 * s, 1.8 * s, -0.4, 0.6);
    uiCandy(x, uiStarPath(m + 15 * s, m + 18 * s, 9.5 * s, 4.4 * s, 5), m + 9 * s, m + 27 * s, ['#fff3a0', '#ffd23a', '#ffaa00'], '#de8500', 1.6 * s);
  } else if (name === 'ad') {
    // 광고: 분홍 TV + 재생 단추
    x.strokeStyle = '#6a4a1a'; x.lineWidth = 3 * s; x.beginPath(); x.moveTo(m - 9 * s, m - 26 * s); x.lineTo(m - 1 * s, m - 15 * s); x.lineTo(m + 10 * s, m - 27 * s); x.stroke();
    uiCandy(x, uiRR(m - 27 * s, m - 16 * s, 54 * s, 38 * s, 10 * s), m - 16 * s, m + 22 * s, ['#f4e6c8', '#d8b878', '#b08840'], '#6a4a1a', 2.4 * s);   // 타임플렉스: 나무 TV
    uiCandy(x, uiRR(m - 21 * s, m - 10 * s, 34 * s, 26 * s, 6 * s), m - 10 * s, m + 16 * s, ['#e9f8ff', '#a8dcff', '#7cc0f5'], '#3a8fd6', 1.6 * s);
    var tp = new Path2D(); tp.moveTo(m - 8 * s, m - 4 * s); tp.lineTo(m + 4 * s, m + 3 * s); tp.lineTo(m - 8 * s, m + 10 * s); tp.closePath();
    x.lineWidth = 3 * s; x.strokeStyle = x.fillStyle = '#ffffff'; x.stroke(tp); x.fill(tp);
    x.fillStyle = '#fff3a0'; x.beginPath(); x.arc(m + 20 * s, m - 3 * s, 2.8 * s, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(m + 20 * s, m + 6 * s, 2.8 * s, 0, Math.PI * 2); x.fill();
    uiGloss(x, m - 15 * s, m - 5 * s, 4 * s, 2 * s, -0.5, 0.75);
  }
  return (uiIconCache[key] = c.toDataURL());
}
function uiSetIcons(root) { (root || document).querySelectorAll('img[data-uic]').forEach(function (im) { im.src = uiIcon(im.getAttribute('data-uic'), 64); }); }

// ---------- [BM] 스킨 (모양만 바뀌고 능력은 같음) ----------
var metaSkins = {
  tower: [{ id: 'base', name: '기본 탑', price: 0 }, { id: 'berry', name: '딸기 포탑', price: 120 }, { id: 'star', name: '별빛 포탑', price: 120 }],
  proj: [{ id: 'base', name: '기본 화살', price: 0 }, { id: 'heart', name: '하트 화살', price: 60 }, { id: 'candy', name: '캔디 화살', price: 60 }]
};
function metaSkinOf(kind, id) { var L = metaSkins[kind] || []; for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
function metaOwns(id) { return id === 'base' || !!(SAVE.owned && SAVE.owned[id]); }
function metaEquip(kind, id) {
  if (!metaSkinOf(kind, id) || !metaOwns(id)) return false;
  SAVE.skin[kind] = id; metaSaveNow();
  if (kind === 'tower') {
    if (typeof twSkinReset === 'function') { try { twSkinReset(); } catch (e) { console.error(e); } }
    // 아이콘 캐시(공방, 도감, 탑 쟁반)의 탑 그림도 새로 그리게
    for (var k in EN_ICON) if (k.charAt(0) === 't' && TOWER_ORDER.some(function (t) { return k.indexOf('t' + t) === 0; })) delete EN_ICON[k];
  }
  return true;
}
// 사기: 보석이 넉넉하면 빼고 바로 장착. 결과 'ok' | 'poor' | 'own'
function metaBuy(kind, id) {
  var S = metaSkinOf(kind, id); if (!S || metaOwns(id)) return 'own';
  if ((SAVE.gems || 0) < S.price) return 'poor';
  SAVE.gems -= S.price; SAVE.owned[id] = 1; metaEquip(kind, id); uiGemsShow(false);
  return 'ok';
}
// 상점 카드 미리보기: 다른 작업의 그림 함수가 있으면 그것, 없으면 임시 그림
function uiSkinPrev(kind, id, px) {
  var key = kind + id + px; if (metaUI.prev[key]) return metaUI.prev[key];
  var c = null;
  try {
    if (kind === 'tower' && typeof twSkinPreview === 'function') c = twSkinPreview(id, px);
    else if (kind === 'proj' && typeof fxProjPreview === 'function') c = fxProjPreview(id, px);
  } catch (e) { c = null; }
  if (!c) c = uiSkinTemp(kind, id, px);
  return (metaUI.prev[key] = c.toDataURL());
}
function uiSkinTemp(kind, id, px) {
  var c = mkC(px, px), x = cx2(c), m = px / 2, s = px / 64;
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (kind === 'tower') {
    try { x.drawImage(towerIcon('archer', 3, 0, px), 0, 0, px, px); } catch (e) { }
    if (id === 'berry') {
      var bx = m + 15 * s, by = m + 14 * s, bp = new Path2D();
      bp.moveTo(bx, by + 12 * s); bp.bezierCurveTo(bx - 14 * s, by + 2 * s, bx - 12 * s, by - 10 * s, bx, by - 7 * s); bp.bezierCurveTo(bx + 12 * s, by - 10 * s, bx + 14 * s, by + 2 * s, bx, by + 12 * s); bp.closePath();
      uiCandy(x, bp, by - 9 * s, by + 12 * s, ['#ffa3b8', '#ff4f7b', '#e0285a'], '#a8163f', 1.8 * s);
      x.fillStyle = '#fff3b0'; [[-5, -1], [2, -3], [-1, 4], [5, 3], [-6, 5], [1, 8]].forEach(function (p) { x.beginPath(); x.ellipse(bx + p[0] * s, by + p[1] * s, 1 * s, 1.5 * s, 0, 0, Math.PI * 2); x.fill(); });
      var lf = uiStarPath(bx, by - 8 * s, 7 * s, 3 * s, 5); uiCandy(x, lf, by - 15 * s, by - 2 * s, ['#a6ec8a', '#53c96a'], '#2f8f4a', 1.4 * s);
      uiGloss(x, bx - 5 * s, by - 2 * s, 2.6 * s, 1.6 * s, -0.5, 0.75);
    } else if (id === 'star') {
      x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(140,110,255,0.2)'; x.fillRect(0, 0, px, px); x.restore();
      uiCandy(x, uiStarPath(m + 15 * s, m + 15 * s, 12 * s, 5.5 * s, 5), m + 3 * s, m + 27 * s, ['#fff7c4', '#ffd23a', '#ffaa00'], '#de8500', 1.8 * s);
      uiSpark(x, m - 20 * s, m - 16 * s, 5.5 * s, '#fff3a0'); uiSpark(x, m + 20 * s, m - 22 * s, 4 * s, '#ffffff'); uiSpark(x, m - 22 * s, m + 10 * s, 3.5 * s, '#d8c6ff');
    }
  } else {
    // 화살: 왼쪽 아래에서 오른쪽 위로, 머리 모양만 다름
    x.save(); x.translate(m, m); x.rotate(-Math.PI / 4);
    [-1, 1].forEach(function (k) { var f = new Path2D(); f.moveTo(-14 * s, 0); f.lineTo(-25 * s, k * 9 * s); f.lineTo(-19 * s, 0); f.closePath(); uiCandy(x, f, -9 * s, 9 * s, ['#ffd6e8', '#ff86b8'], '#d23a72', 1.6 * s); });
    uiCandy(x, uiRR(-22 * s, -2.4 * s, 34 * s, 4.8 * s, 2.4 * s), -3 * s, 3 * s, ['#fff8e6', '#f0bd86'], '#a8703f', 1.4 * s);
    if (id === 'heart') {
      x.save(); x.translate(17 * s, 0); x.rotate(-Math.PI / 2); uiCandy(x, uiHeartPath(0, 0, 24 * s), -11 * s, 11 * s, ['#ffc6dc', '#ff6fa8', '#e84886'], '#c2306a', 1.8 * s); uiGloss(x, -5 * s, -3 * s, 2.8 * s, 1.8 * s, -0.6, 0.8); x.restore();
    } else if (id === 'candy') {
      uiCandy(x, uiCircle(19 * s, 0, 9.5 * s), -9.5 * s, 9.5 * s, ['#ffffff', '#ffe3f0'], '#d94f8a', 1.8 * s);
      x.strokeStyle = '#ff6fa8'; x.lineWidth = 3 * s; x.beginPath(); for (var a = 0; a < 3; a++) { x.moveTo(19 * s, 0); x.arc(19 * s, 0, 7.5 * s, a * 2.094, a * 2.094 + 1.2); } x.stroke();
      x.fillStyle = '#7fd0ff'; x.beginPath(); x.arc(19 * s, 0, 2.6 * s, 0, Math.PI * 2); x.fill();
      uiGloss(x, 15.5 * s, -4 * s, 2.6 * s, 1.6 * s, -0.6, 0.85);
    } else {
      var hd = new Path2D(); hd.moveTo(27 * s, 0); hd.lineTo(11 * s, -9 * s); hd.lineTo(14 * s, 0); hd.lineTo(11 * s, 9 * s); hd.closePath();
      uiCandy(x, hd, -9 * s, 9 * s, ['#fff3a0', '#ffd23a', '#ffaa00'], '#de8500', 1.8 * s);
    }
    x.restore();
    if (id !== 'base') { uiSpark(x, m + 20 * s, m + 6 * s, 4.5 * s, '#fff3a0'); uiSpark(x, m - 6 * s, m - 20 * s, 3.5 * s, '#ffffff'); }
  }
  return c;
}

// ---------- [BM] 상점 ----------
function uiShop(tab, sel) {
  tab = tab === 'proj' || tab === 'tower' ? tab : metaUI.shopTab || 'tower'; metaUI.shopTab = tab;
  var cur = (SAVE.skin && SAVE.skin[tab]) || 'base';
  sel = sel || metaUI.shopSel[tab] || cur; if (!metaSkinOf(tab, sel)) sel = cur; metaUI.shopSel[tab] = sel;
  var S = metaSkinOf(tab, sel), own = metaOwns(sel), eq = cur === sel, gems = SAVE.gems || 0, left = metaAdLeft();
  var gem = function (px) { return '<img src="' + uiIcon('gem', px) + '" alt="">'; };
  var h = '<div class="pt">상점</div><div class="shHead"><span class="stat gem">' + gem(64) + '<b class="gemN">' + fmt(gems) + '</b></span></div>' +
    '<div class="tabs two"><button class="tab' + (tab === 'tower' ? ' on' : '') + '" data-t="tower">탑 스킨</button><button class="tab' + (tab === 'proj' ? ' on' : '') + '" data-t="proj">화살 스킨</button></div><div class="skGrid">';
  metaSkins[tab].forEach(function (k) {
    var o = metaOwns(k.id), e = cur === k.id;
    h += '<button class="skc' + (k.id === sel ? ' sel' : '') + '" data-id="' + k.id + '"><span class="skP"><img src="' + uiSkinPrev(tab, k.id, 120) + '" alt=""></span><b>' + esc(k.name) + '</b>' +
      (e ? '<em class="eq">장착 중</em>' : o ? '<em class="own">보유</em>' : '<em>' + gem(32) + k.price + '</em>') + '</button>';
  });
  h += '</div><div class="skAct"><p><b>' + esc(S.name) + '</b><br>' + (tab === 'tower' ? '탑 모양만 바뀌고 능력은 그대로입니다' : '화살 모양만 바뀌고 능력은 그대로입니다') + '</p>';
  if (eq) h += '<button class="btn mute" id="skDo" data-a="none">장착 중</button>';
  else if (own) h += '<button class="btn gold" id="skDo" data-a="equip">장착하기</button>';
  else h += '<button class="btn ' + (gems >= S.price ? 'gold' : 'mute') + '" id="skDo" data-a="buy">' + gem(32) + '보석 ' + S.price + '개로 사기</button>';
  // [BM] 광고 보고 보석: 하루 5번, 남은 횟수를 그대로 보여 줌
  h += '</div><div class="adRow"><button class="btn reward' + (left > 0 ? '' : ' off') + '" id="adGem"><span class="rl"><img src="' + uiIcon('ad', 48) + '" alt="">' + (left > 0 ? '광고 보고 보석 +' + metaAdGemN : '오늘 광고 보상을 다 받았습니다') + '</span></button><span class="adLeft">오늘 남은 횟수 ' + left + ' / ' + metaAdGemMax + '</span></div>' +
    '<p class="shNote">보석은 오늘 임무, 도감, 광고로 모읍니다. 현금 결제는 없습니다. 보석으로 탑을 소환할 수 있습니다.</p><button class="xbtn" id="shClose">닫기</button>';
  openModal(h, 'shop');
  var M = $('modal');
  M.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { sfx('click', 0.4); uiShop(b.getAttribute('data-t')); }; });
  M.querySelectorAll('.skc').forEach(function (b) { b.onclick = function () { sfx('click', 0.35); uiShop(tab, b.getAttribute('data-id')); }; });
  $('skDo').onclick = function () {
    var a = $('skDo').getAttribute('data-a'), r = $('skDo').getBoundingClientRect();
    if (a === 'equip') { if (metaEquip(tab, sel)) { sfx('upgrade', 0.5); uiShop(tab, sel); toast(S.name + ' 장착'); } return; }
    if (a !== 'buy') return;
    var res = metaBuy(tab, sel);
    if (res === 'poor') { sfx('warn', 0.4); toast('보석이 ' + (S.price - (SAVE.gems || 0)) + '개 모자랍니다. 오늘 임무와 도감에서 모아 보세요', 2400); return; }
    if (res === 'ok') { sfx('upgrade', 0.6); uiShop(tab, sel); var c = M.querySelector('.skc.sel'); if (c) uiStarBurst(c); toast(S.name + ' 장착'); }
  };
  $('adGem').onclick = function () {
    if (metaAdLeft() <= 0) { sfx('warn', 0.3); toast('오늘 광고 보상은 다 받았습니다. 내일 다시 받을 수 있습니다', 2200); return; }
    sfx('click', 0.4);
    metaAdShow('gems', function (ok) {
      if (!ok || metaAdLeft() <= 0) return;
      metaAdGemUse(); metaGemAdd(metaAdGemN);
      if (UI.modalOpen && UI.modalKind === 'shop') uiShop(metaUI.shopTab, metaUI.shopSel[metaUI.shopTab]);
      uiGemBurst($('adGem') || null, metaAdGemN);
    });
  };
  $('shClose').onclick = function () { closeModal(); uiMetaDots(); };
}
// 산 카드 위 반짝이 (보석 글자 없이)
function uiStarBurst(at) {
  var app = $('app'), ar = app.getBoundingClientRect(), r = at.getBoundingClientRect();
  var d = document.createElement('div'); d.className = 'gburst'; d.style.left = Math.round(r.left + r.width / 2 - ar.left) + 'px'; d.style.top = Math.round(r.top + r.height * 0.4 - ar.top) + 'px';
  var h = ''; for (var i = 0; i < 8; i++) h += '<i style="--a:' + (i * 45) + 'deg"></i>';
  d.innerHTML = h; app.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 900);
}

// ---------- [BM] 보상형 광고 ----------
// adShow(reason, onDone): window.AdBridge(안드로이드 앱이 넣을 것)가 있으면 AdBridge.show(reason, id)를 부르고,
// 앱은 광고가 끝나면 window.__adResult(id, true|false)로 알려 줌. 없으면 '광고 자리(시제품)' 창을 5초 보여 준 뒤 보상.
// 시제품 창은 진짜 광고인 척하지 않으며, 중간에 닫으면 보상 없음을 알림. onDone(true|false)
var metaAdGemMax = 5, metaAdGemN = 10, metaAdSec = 5;
function metaAdLeft() { var a = SAVE.adGem; if (!a || a.day !== metaToday()) return metaAdGemMax; return Math.max(0, metaAdGemMax - (a.n || 0)); }
function metaAdGemUse() { var day = metaToday(); if (!SAVE.adGem || SAVE.adGem.day !== day) SAVE.adGem = { day: day, n: 0 }; SAVE.adGem.n++; metaSaveNow(); }
function metaAdShow(reason, onDone) {
  onDone = typeof onDone === 'function' ? onDone : function () { };
  if (metaUI.ad) return false;
  var what = reason === 'continue' ? '생명 3 회복하고 이어하기' : reason === 'gems' ? '보석 +' + metaAdGemN : '';
  var B = window.AdBridge;
  if (B && typeof B.show === 'function') {
    var id = 'ad' + (++metaUI.adSeq);
    metaUI.ad = { id: id, cb: onDone };
    uiAdOpen('<div class="pt">광고</div><div class="adWait">광고를 불러오는 중</div><button class="xbtn" id="adX">취소</button>');
    try { B.show(String(reason), id); } catch (e) { metaAdEnd(false); toast('광고를 불러오지 못했습니다'); }
    return true;
  }
  metaUI.ad = { id: 'proto', cb: onDone, t0: performance.now(), dur: metaAdSec * 1000 };
  uiAdOpen('<div class="pt">광고 자리</div><div class="adTag">시제품</div><div class="adBox"><img src="' + uiIcon('ad', 96) + '" alt=""><p>정식 출시 때 이 자리에 보상형 광고가 나옵니다. 지금은 광고 없이 5초만 기다리면 보상을 받습니다.</p></div>' +
    (what ? '<div class="adWhat"><span>받는 것</span><b>' + esc(what) + '</b></div>' : '') +
    '<div class="adBar"><i id="adFill"></i></div><div class="adSec" id="adSec">' + metaAdSec + '초 남음</div><button class="xbtn" id="adX">그만 보기 (보상 없음)</button>');
  metaUI.ad.iv = setInterval(uiAdTick, 100); uiAdTick();
  return true;
}
window.adShow = metaAdShow;
function uiAdOpen(html) {
  var L = $('adLayer'); L.innerHTML = '<div class="modal adm">' + html + '</div>'; L.classList.remove('hide');
  var x = $('adX'); if (x) x.onclick = function () { sfx('click', 0.3); metaAdEnd(false, true); };
}
function uiAdTick() {
  var A = metaUI.ad; if (!A || !A.dur) return;
  var el = performance.now() - A.t0, f = Math.min(1, el / A.dur);
  var bar = $('adFill'); if (bar) bar.style.width = (f * 100).toFixed(1) + '%';
  var sec = $('adSec'); if (sec && f < 1) sec.textContent = Math.max(1, Math.ceil((A.dur - el) / 1000)) + '초 남음';
  if (f >= 1) metaAdEnd(true);
}
function metaAdEnd(ok, byUser) {
  var A = metaUI.ad; if (!A) return;
  metaUI.ad = null; if (A.iv) clearInterval(A.iv);
  var L = $('adLayer'); L.classList.add('hide'); L.innerHTML = '';
  if (!ok && byUser) toast('끝까지 보지 않아 보상이 없습니다', 2000);
  try { A.cb(!!ok); } catch (e) { console.error(e); }
}
window.__adResult = function (id, ok) {
  var A = metaUI.ad; if (!A || A.id !== String(id)) return;
  var good = ok === true || ok === 'true' || ok === 1 || ok === '1';
  metaAdEnd(good);
  if (!good) toast('광고 보상을 받지 못했습니다');
};

// ---------- [재방문] 도감 보상: 처음 처치한 적마다 보석 +5, 한 번만 ----------
var metaCodexGem = 5;
function metaSlain(k) { if (k && ENEMIES[k] && !SAVE.slain[k]) { SAVE.slain[k] = 1; metaSaveSoon(); } }
function metaCodexCan(k) { return !!(SAVE.slain && SAVE.slain[k]) && !(SAVE.codexGot && SAVE.codexGot[k]); }
function metaCodexAny() { return ENEMY_ORDER.some(metaCodexCan); }
function metaCodexClaim(k) { if (!metaCodexCan(k)) return false; SAVE.codexGot[k] = 1; metaGemAdd(metaCodexGem); return true; }

// ---------- [재방문] 일일 임무: 기기 날짜로 3개를 정하고, 날짜가 바뀌면 새로 뽑음 ----------
var metaQuests = [
  { id: 'clear', goal: 3, name: '웨이브 3번 막기', ic: 'skull' },
  { id: 'rain', goal: 5, name: '화살비 5번 쓰기', ic: 'rain' },
  { id: 'kill', goal: 100, name: '적 100마리 처치', ic: 'en:goblin' },
  { id: 'upgrade', goal: 5, name: '탑 5번 강화', ic: 'tw:archer:3' },
  { id: 'win', goal: 1, name: '지역 1번 이기기', ic: 'crown' },
  { id: 'build', goal: 10, name: '탑 10개 세우기', ic: 'tw:catapult:1' },
  { id: 'obs', goal: 8, name: '장애물 8개 치우기', ic: 'flag' }
];
var metaQuestGem = 10;
function metaQuest(id) { for (var i = 0; i < metaQuests.length; i++) if (metaQuests[i].id === id) return metaQuests[i]; return null; }
function metaDaily() {
  var d = SAVE.daily, day = metaToday();
  if (!d || d.day !== day || !d.ids || d.ids.length !== 3 || !d.ids.every(metaQuest)) {
    var r = rngOf(hashStr('daily' + day)), pool = metaQuests.map(function (q) { return q.id; }), ids = [];
    while (ids.length < 3 && pool.length) ids.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    SAVE.daily = d = { day: day, ids: ids, n: {}, got: {}, tk: 0 }; metaSaveSoon();
  }
  return d;
}
function metaCount(id, k) {
  var d = metaDaily(); if (d.ids.indexOf(id) < 0 || d.got[id]) return;
  var q = metaQuest(id), was = d.n[id] || 0; if (was >= q.goal) return;
  d.n[id] = Math.min(q.goal, was + (k || 1)); metaSaveSoon();
  if (d.n[id] >= q.goal) toast('오늘 임무 완료! 지도에서 보석을 받으세요', 2200);
}
function metaQuestReady() { var d = metaDaily(); return d.ids.some(function (id) { var q = metaQuest(id); return q && !d.got[id] && (d.n[id] || 0) >= q.goal; }); }
function metaQuestClaim(id) {
  var d = metaDaily(), q = metaQuest(id); if (!q || d.ids.indexOf(id) < 0 || d.got[id] || (d.n[id] || 0) < q.goal) return false;
  d.got[id] = 1; metaGemAdd(metaQuestGem); gcDailyBonus(d); return true;
}
function uiQuestIcon(q) {
  var a = q.ic.split(':');
  if (a[0] === 'en') return enemyIcon(a[1], 64);
  if (a[0] === 'tw') return towerIconURL(a[1], +a[2], 0, 72);
  return icon(a[0], 64);
}
function uiQuests() {
  var d = metaDaily(), gem = '<img src="' + uiIcon('gem', 48) + '" alt="">';
  var h = '<div class="pt">오늘 임무</div><div class="qSub">날마다 새 임무 3개, 하나 끝낼 때마다 보석 +' + metaQuestGem + '</div><div class="qList">';
  d.ids.forEach(function (id) {
    var q = metaQuest(id); if (!q) return;
    var n = Math.min(q.goal, d.n[id] || 0), done = n >= q.goal, got = !!d.got[id];
    h += '<div class="qItem' + (got ? ' got' : done ? ' done' : '') + '" data-id="' + id + '"><img class="qIc" src="' + uiQuestIcon(q) + '" alt=""><div class="qT"><b>' + esc(q.name) + '</b><div class="qBar"><i style="width:' + Math.round(n / q.goal * 100) + '%"></i></div><span class="qN">' + n + ' / ' + q.goal + '</span></div>' +
      (got ? '<em class="qOk">받음</em>' : done ? '<button class="btn gold sm qGet" data-id="' + id + '">' + gem + '받기</button>' : '<em class="qRew">' + gem + '+' + metaQuestGem + '</em>') + '</div>';
  });
  // [재방문] 3개를 모두 받으면 소환권 +1 (gacha.js gcDailyBonus)
  var ng = d.ids.filter(function (id) { return d.got[id]; }).length;
  h += '<div class="qItem qBonus' + (d.tk ? ' got' : '') + '"><img class="qIc" src="' + gcIcon('ticket', 64) + '" alt=""><div class="qT"><b>3개 모두 받으면 소환권</b><div class="qBar"><i style="width:' + Math.round(ng / 3 * 100) + '%"></i></div><span class="qN">' + ng + ' / 3</span></div>' + (d.tk ? '<em class="qOk">받음</em>' : '<em class="qRew"><img src="' + gcIcon('ticket', 48) + '" alt="">+' + GC_TK_DAILY + '</em>') + '</div>';
  h += '</div><div class="qNote">내일이 되면 새 임무가 나옵니다</div><button class="xbtn" id="qClose">닫기</button>';
  openModal(h, 'quest');
  $('modal').querySelectorAll('.qGet').forEach(function (b) {
    b.onclick = function () { var r = b.getBoundingClientRect(); if (metaQuestClaim(b.getAttribute('data-id'))) { sfx('upgrade', 0.5); uiQuests(); uiGemBurst(r, metaQuestGem); } };
  });
  $('qClose').onclick = function () { closeModal(); uiMetaDots(); };
}

// ---------- 전투 사건 집계 (ui.js uiEvent가 부름) ----------
function metaOnEvent(g, e) {
  var t = e.t;
  if (t === 'kill') { metaSlain(e.k); if (e.form && e.form !== e.k) metaSlain(e.form); metaCount('kill', 1); }   // 변신한 적(용 등)은 변신 모습도 도감에
  else if (t === 'crown') { metaSlain('barkan'); metaCount('kill', 1); }   // 바르칸은 최후의 화살로 끝냄 ('kill' 사건 없음)
  else if (t === 'rain') metaCount('rain', 1);
  else if (t === 'upgrade') metaCount('upgrade', 1);
  else if (t === 'build') { if (!e.free) metaCount('build', 1); }
  else if (t === 'obsDie') metaCount('obs', 1);
  else if (t === 'clear') metaCount('clear', 1);
  else if (t === 'win') { metaCount('clear', 1); metaCount('win', 1); metaSaveNow(); }   // 마지막 웨이브는 'clear' 대신 'win'
  else if (t === 'fuse') { var fk = e.tw && e.tw.k ? e.tw.k : e.to || e.k; if (fk && TOWERS[fk]) { if (!SAVE.fused || typeof SAVE.fused !== 'object') SAVE.fused = {}; if (!SAVE.fused[fk]) { SAVE.fused[fk] = 1; metaSaveSoon(); } } }   // 합체 도감 기록
  else if (t === 'lose' || t === 'wave') { if (metaUI.saveT) metaSaveNow(); }
}
// 지도 아래 막대의 빨간 점과 보석 수
function uiMetaDots() {
  var q = $('questDot'); if (q) q.classList.toggle('hide', !metaQuestReady());
  var c = $('codexDot'); if (c) c.classList.toggle('hide', !metaCodexAny());
  gcDot();   // [재방문] 오늘 무료 소환이 남았으면 소환 단추에 빨간 점
  uiGemsShow(false);
}

// ---------- 시험용 (브라우저 콘솔, tools/fitcheck.py, tools/metaflow.py) ----------
window.__meta = {
  stage: function (mi) { if (typeof chGoMap === 'function' && MAPS[mi]) chGoMap(MAPS[mi].ch || 1); openStage(mi); }, shop: function (t) { uiShop(t); }, quests: function () { uiQuests(); }, codex: function (t, k) { openCodex(t, k, true); },
  settings: function () { openSettings(false); }, research: function () { openResearch(); }, pause: function () { openPause(); }, card: function (k) { enemyCard(k || 'orc'); },
  result: function () { if (G) showResult(G); }, ad: function (r) { return metaAdShow(r || 'gems', function (ok) { window.__metaAdLast = ok; }); },
  adOpen: function () { return !!metaUI.ad; }, gems: function (n) { if (n != null) { SAVE.gems = n; metaSaveNow(); uiGemsShow(false); } return SAVE.gems; },
  today: metaToday, daily: function () { return JSON.parse(JSON.stringify(metaDaily())); }, adLeft: metaAdLeft, codexAny: metaCodexAny,
  close: function () { closeModal(); }, save: function () { return JSON.parse(JSON.stringify(SAVE)); }
};
uiFitInit();
