// ===== ui_v22.js : v2.2 화면 (딜미터, 특수 기술 단추와 고르기, 무한 차원전 입구와 기록) =====
// 엔진은 logic_v22.js. 기존 파일에는 typeof로 감싼 한 줄 고리만 둔다(ui.js, main.js, render.js, chapters.js)

function v22N(n) { n = Math.round(n || 0); return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K' : String(n); }
function v22Copy(txt, done) {
  function fb() { try { var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); done(ok); } catch (e) { done(false); } }
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { done(true); }, fb); else fb(); } catch (e) { fb(); }
}

// ---------- 그림: 특수 기술, 딜미터 단추 ----------
var V22_IC = {};
function sk2Icon(k, px) {
  px = px || 64; var key = k + px; if (V22_IC[key]) return V22_IC[key];
  var c = mkC(px, px), x = cx2(c), m = px / 2, s = px / 64, S = SK2[k] || { col: '#ccc' }, LN = '#1d1838', p, i;
  x.lineCap = 'round'; x.lineJoin = 'round';
  uiCandy(x, uiCircle(m, m, 27 * s), m - 27 * s, m + 27 * s, ['#ffffff', S.col, rgba(S.col, 1)], LN, 2.4 * s);
  uiGloss(x, m - 9 * s, m - 16 * s, 9 * s, 4 * s, -0.4, 0.55);
  function stroke(w, col, draw) { x.beginPath(); draw(); x.strokeStyle = LN; x.lineWidth = (w + 3) * s; x.stroke(); x.beginPath(); draw(); x.strokeStyle = col || '#fff'; x.lineWidth = w * s; x.stroke(); }
  function fill(path, cols) { uiCandy(x, path, m - 20 * s, m + 20 * s, cols || ['#ffffff', '#e8f0ff'], LN, 2.2 * s); }
  if (k === 'blizzard') {
    stroke(3.4, '#fff', function () { for (i = 0; i < 6; i++) { var a = i * Math.PI / 3, cx = Math.cos(a), cy = Math.sin(a); x.moveTo(m, m); x.lineTo(m + cx * 17 * s, m + cy * 17 * s); var bx = m + cx * 10 * s, by = m + cy * 10 * s; x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + 0.8) * 6 * s, by + Math.sin(a + 0.8) * 6 * s); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a - 0.8) * 6 * s, by + Math.sin(a - 0.8) * 6 * s); } });
  } else if (k === 'meteor') {
    stroke(4, '#ffe08a', function () { x.moveTo(m + 2 * s, m - 2 * s); x.lineTo(m + 18 * s, m - 18 * s); x.moveTo(m - 4 * s, m - 6 * s); x.lineTo(m + 8 * s, m - 20 * s); x.moveTo(m + 6 * s, m + 4 * s); x.lineTo(m + 20 * s, m - 8 * s); });
    fill(uiCircle(m - 6 * s, m + 6 * s, 11 * s), ['#ffd0a0', '#ff7a2a', '#b8400a']);
  } else if (k === 'thunder') {
    p = new Path2D(); p.moveTo(m + 4 * s, m - 21 * s); p.lineTo(m - 11 * s, m + 3 * s); p.lineTo(m - 1 * s, m + 3 * s); p.lineTo(m - 5 * s, m + 21 * s); p.lineTo(m + 12 * s, m - 4 * s); p.lineTo(m + 2 * s, m - 4 * s); p.closePath();
    fill(p, ['#ffffff', '#fff3a0', '#ffc21a']);
  } else if (k === 'eye') {
    p = new Path2D(); p.moveTo(m - 20 * s, m); p.quadraticCurveTo(m, m - 18 * s, m + 20 * s, m); p.quadraticCurveTo(m, m + 18 * s, m - 20 * s, m); p.closePath(); fill(p, ['#ffffff', '#f0e6ff']);
    fill(uiCircle(m, m, 7.5 * s), ['#d2b0ff', '#7a3fd0', '#3a1a70']); x.fillStyle = '#fff'; x.beginPath(); x.arc(m - 2.5 * s, m - 2.5 * s, 2.2 * s, 0, Math.PI * 2); x.fill();
  } else if (k === 'goldrush') {
    [[-7, 8], [7, 8], [0, -2], [0, -12]].forEach(function (q) { p = new Path2D(); p.ellipse(m + q[0] * s, m + q[1] * s, 10 * s, 5 * s, 0, 0, Math.PI * 2); fill(p, ['#fff6b0', '#ffcf3a', '#c88a00']); });
  } else if (k === 'mend') {
    p = new Path2D(); var a = 6 * s, b = 18 * s; p.moveTo(m - a, m - b); p.lineTo(m + a, m - b); p.lineTo(m + a, m - a); p.lineTo(m + b, m - a); p.lineTo(m + b, m + a); p.lineTo(m + a, m + a); p.lineTo(m + a, m + b); p.lineTo(m - a, m + b); p.lineTo(m - a, m + a); p.lineTo(m - b, m + a); p.lineTo(m - b, m - a); p.lineTo(m - a, m - a); p.closePath();
    fill(p, ['#ffffff', '#c8ffd8', '#3fc070']);
  } else if (k === 'timestop') {
    p = new Path2D(); p.moveTo(m - 13 * s, m - 19 * s); p.lineTo(m + 13 * s, m - 19 * s); p.lineTo(m + 2.5 * s, m); p.lineTo(m + 13 * s, m + 19 * s); p.lineTo(m - 13 * s, m + 19 * s); p.lineTo(m - 2.5 * s, m); p.closePath(); fill(p, ['#ffffff', '#dfe4ff']);
    p = new Path2D(); p.moveTo(m - 8 * s, m + 16 * s); p.lineTo(m + 8 * s, m + 16 * s); p.lineTo(m, m + 6 * s); p.closePath(); uiCandy(x, p, m + 6 * s, m + 16 * s, ['#ffe08a', '#ffb300'], null, 0);
  }
  return (V22_IC[key] = c.toDataURL());
}
function meterIcon(px) {
  px = px || 64; var key = 'mtr' + px; if (V22_IC[key]) return V22_IC[key];
  var c = mkC(px, px), x = cx2(c), s = px / 64, LN = '#1d1838';
  [[10, 30, ['#ffe08a', '#ffb300']], [26, 14, ['#ff9ac8', '#f0478a']], [42, 40, ['#9fe2ff', '#3f9ae0']]].forEach(function (q) { uiCandy(x, uiRR(q[0] * s, (54 - q[1]) * s, 13 * s, q[1] * s, 3 * s), (54 - q[1]) * s, 54 * s, q[2], LN, 2.2 * s); });
  x.strokeStyle = LN; x.lineWidth = 3 * s; x.beginPath(); x.moveTo(6 * s, 56 * s); x.lineTo(58 * s, 56 * s); x.stroke();
  return (V22_IC[key] = c.toDataURL());
}

// ---------- 딜미터 ----------
var MTR = { on: 0, by: 'd', iv: 0 };
function meterName(key) {
  if (key === 'etc') return '화상, 독 등';
  if (key.indexOf('sk:') === 0) { var k = key.slice(3); return (SK2[k] || SKILLS[k] || {}).name || k; }
  return TOWERS[key] ? TOWERS[key].name : key;
}
function meterImg(key, px) {
  if (key === 'etc') return icon('skull', px);
  if (key.indexOf('sk:') === 0) { var k = key.slice(3); return SK2[k] ? sk2Icon(k, px) : icon(k, px); }
  try { return towerIconURL(key, 3, 0, px); } catch (e) { return icon('skull', px); }
}
function meterRows(g, by, max) {
  var L = meterList(g, by), tot = 0; L.forEach(function (r) { tot += by === 'k' ? r.k : r.d; });
  var top = L.length ? (by === 'k' ? L[0].k : L[0].d) || 1 : 1;
  return L.slice(0, max || 30).map(function (r, i) {
    var v = by === 'k' ? r.k : r.d, pct = tot ? Math.round(v / tot * 100) : 0;
    return '<div class="mtRow' + (i === 0 ? ' top' : '') + '"><i class="mtN">' + (i + 1) + '</i><img src="' + meterImg(r.key, 48) + '" alt=""><div class="mtB"><div class="mtL"><span class="mtNm">' + esc(meterName(r.key)) + '</span>' + (r.n > 1 ? '<em class="mtCnt">x' + r.n + '</em>' : '') +
      '<b>' + v22N(v) + '</b><small>' + pct + '%</small></div><div class="mtBar"><i style="width:' + Math.max(2, v / top * 100).toFixed(1) + '%"></i></div><div class="mtSub"><span>피해</span> ' + v22N(r.d) + ' <span>처치</span> ' + r.k + '</div></div></div>';
  }).join('') || '<div class="mtEmpty">아직 기록이 없습니다</div>';
}
function meterDraw() {
  var box = $('mtBox'); if (!box || !MTR.on || !G) return;
  var list = box.querySelector('.mtList'); list.innerHTML = meterRows(G, MTR.by, 30);
}
function meterToggle(on) {
  MTR.on = on == null ? !MTR.on : on;
  var box = $('mtBox'); if (!box) return;
  box.classList.toggle('hide', !MTR.on); $('bMeter').classList.toggle('on', !!MTR.on);
  clearInterval(MTR.iv); if (MTR.on) { meterDraw(); MTR.iv = setInterval(function () { if (UI.scr !== 'battle' || !G) { meterToggle(false); return; } meterDraw(); }, 600); }
}
// 결과 창: 많이 넣은 탑 셋
function meterResHtml(g) {
  if (!g || !g.meter) return '';
  var L = meterList(g, 'd').slice(0, 3); if (!L.length) return '';
  var tot = 0; meterList(g, 'd').forEach(function (r) { tot += r.d; });
  return '<div class="mtRes"><div class="mtResT"><img src="' + meterIcon(32) + '" alt="">딜미터</div>' + L.map(function (r, i) {
    return '<div class="mtResR' + (i === 0 ? ' mvp' : '') + '">' + (i === 0 ? '<i class="mvpTag">MVP</i>' : '<i class="mtN">' + (i + 1) + '</i>') + '<img src="' + meterImg(r.key, 48) + '" alt=""><span class="mtNm">' + esc(meterName(r.key)) + '</span><b>' + v22N(r.d) + '</b><small>' + (tot ? Math.round(r.d / tot * 100) : 0) + '%</small><em><span>처치</span> ' + r.k + '</em></div>';
  }).join('') + '</div>';
}

// ---------- 특수 기술: 고르기, 단추 ----------
function sk2Open(k) { return !!(SAVE && SAVE.admin) || !SK2[k].need || fdWon(SK2[k].need); }
function sk2Chosen() {
  var a = Array.isArray(SAVE.sk2) ? SAVE.sk2.filter(function (k) { return SK2[k] && sk2Open(k); }) : null;
  if (!a) a = SK2_ORDER.filter(sk2Open).slice(0, SK2_SLOTS);
  return a.slice(0, SK2_SLOTS);
}
function sk2NeedText(k) { var mi = fdMi(SK2[k].need), M = MAPS[mi]; return M ? (M.ch || 1) + '-' + (M.no || mi + 1) + ' 승리 뒤에 열림' : ''; }
function sk2RowHtml() {
  var a = sk2Chosen();
  return '<button class="stSk" id="stSk"><span class="loL">특수 기술<i>' + a.length + ' / ' + SK2_SLOTS + '</i></span><span class="skRow">' +
    [0, 1].slice(0, SK2_SLOTS).map(function (i) { var k = a[i]; return k ? '<span class="skS"><img src="' + sk2Icon(k, 64) + '" alt=""><em>' + esc(SK2[k].name) + '</em></span>' : '<span class="skS empty"><img src="' + icon('lock', 32) + '" alt=""></span>'; }).join('') +
    '</span><span class="loGo">고르기</span></button>';
}
function sk2RowBind(back) { var b = $('stSk'); if (b) b.onclick = function () { sfx('ui', 0.5); sk2Pick(back); }; }
function sk2Pick(back) {
  var cur = sk2Chosen();
  var h = '<div class="pt">특수 기술 고르기</div><div class="loSub">화살비, 방책, 최후의 화살에 더해 ' + SK2_SLOTS + '개까지 들고 나갑니다</div><div class="skList">';
  SK2_ORDER.forEach(function (k) {
    var S = SK2[k], op = sk2Open(k), on = cur.indexOf(k) >= 0;
    h += '<button class="skC' + (on ? ' on' : '') + (op ? '' : ' off') + '" data-k="' + k + '"><img src="' + sk2Icon(k, 72) + '" alt=""><div class="skT"><b>' + esc(S.name) + '</b><span>' + esc(S.desc) + '</span>' +
      '<small>' + (op ? '<span>재사용</span> ' + S.cd + '<span>초</span>' + (S.aim ? ', <span>전장을 눌러 겨눔</span>' : ', <span>바로 발동</span>') : esc(sk2NeedText(k))) + '</small></div>' + (on ? '<i class="skOn">' + (cur.indexOf(k) + 1) + '</i>' : op ? '' : '<img class="skLk" src="' + icon('lock', 32) + '" alt="">') + '</button>';
  });
  h += '</div><div class="mbtns"><button class="btn gold" id="skOk">확인</button></div>';
  openModal(h, 'sk2');
  $('modal').querySelectorAll('.skC').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-k'), i = cur.indexOf(k);
      if (!sk2Open(k)) { sfx('warn', 0.4); toast(sk2NeedText(k), 1800); return; }
      if (i >= 0) cur.splice(i, 1); else { if (cur.length >= SK2_SLOTS) cur.shift(); cur.push(k); }
      SAVE.sk2 = cur.slice(); saveNow(); sfx('click', 0.45); sk2Pick(back);
    };
  });
  $('skOk').onclick = function () { sfx('click', 0.4); closeModal(); if (typeof back === 'function') back(); };
}
// 전투 화면 단추 두 칸(sk_x0, sk_x1)
function sk2Btns() {
  var box = document.querySelector('#bottom .skills'); if (!box || $('sk_x0')) return;
  for (var i = 0; i < SK2_SLOTS; i++) {
    var b = document.createElement('button'); b.className = 'sk sk2 hide'; b.id = 'sk_x' + i; b.setAttribute('data-slot', i);
    b.innerHTML = '<span class="face"><img alt=""><i class="cd"></i><b></b></span><em></em>';
    b.onclick = sk2Click; box.appendChild(b);
  }
}
function sk2Setup(g) {
  sk2Btns(); if ($('bMeter')) $('bMeter').classList.toggle('hide', !g); meterToggle(false);
  for (var i = 0; i < SK2_SLOTS; i++) {
    var b = $('sk_x' + i); if (!b) continue; var k = g && g.sk2 ? g.sk2[i] : null;
    b.classList.toggle('hide', !k); b.setAttribute('data-k', k || '');
    if (k) { b.querySelector('img').src = sk2Icon(k, 64); b.querySelector('em').textContent = SK2[k].name; b.style.setProperty('--rc', SK2[k].col); }
  }
  document.body.classList.toggle('sk2n', !!(g && g.sk2 && g.sk2.length));
}
function sk2Click(e) {
  e.stopPropagation(); var g = G; if (!g) return;
  var k = this.getAttribute('data-k'), S = SK2[k]; if (!S || !g.sk[k]) return;
  if (g.sk[k].cd > 0) { toast(S.name + ' 준비 중: ' + Math.ceil(g.sk[k].cd) + '초'); sfx('warn', 0.3); return; }
  trayClose();
  if (S.aim) { UIS.aim = UIS.aim === k ? null : k; sfx('click', 0.4); if (UIS.aim) toast(S.desc + ' 전장을 누르세요', 2200); return; }
  if (sk2Cast(g, k)) { sfx('powerup', 0.5); vib(25); } else if (k === 'mend') toast('생명이 가득합니다');
}
function sk2Hud(g, L) {
  if (!g.sk2) return;
  g.sk2.forEach(function (k, i) {
    var b = $('sk_x' + i); if (!b) return;
    var cd = g.sk[k].cd, max = sk2Cd(g, k), f = cd > 0 ? cd / max : 0, key = 'sk2' + i, val = k + Math.ceil(cd) + ':' + (UIS.aim === k);
    if (L[key] !== val) { L[key] = val; b.querySelector('.cd').style.height = (f * 100) + '%'; b.querySelector('b').textContent = cd > 0 ? Math.ceil(cd) : ''; b.classList.toggle('ready', cd <= 0); b.classList.toggle('aim', UIS.aim === k); }
  });
}
function sk2AimDraw(x, g, S, X, Y) {
  var K = SK2[UIS.aim]; if (!K) return false;
  x.fillStyle = rgba(K.col, 0.16); x.strokeStyle = rgba(K.col, 0.95); x.lineWidth = Math.max(1.5, S * 0.035); x.setLineDash([S * 0.14, S * 0.08]);
  x.beginPath(); x.arc(X, Y, (K.r || 1) * S, 0, Math.PI * 2); x.fill(); x.stroke(); x.setLineDash([]);
  return true;
}
// 연출
FX_EV.sk2 = function (g, ev) {
  var k = ev.k;
  if (k === 'thunder') { sfx('tesla', 0.7); fxShake(0.08); (ev.pts || []).forEach(function (p, i) { var pts = [], y0 = p.y - 7; for (var j = 0; j <= 6; j++) pts.push({ x: p.x + (j && j < 6 ? (Math.random() - 0.5) * 0.7 : 0), y: y0 + (p.y - y0) * j / 6 }); rtBolt(pts, '#fff3a0', 0.35, 1.6); ringFx(p.x, p.y, 0.7, '#ffe066', 0.4, 0.06, i * 0.03); }); }
  else if (k === 'blizzard') { sfx('freeze', 0.7); ringFx(ev.x, ev.y, ev.r, '#bfefff', 0.6, 0.07); ringFx(ev.x, ev.y, ev.r * 0.6, '#ffffff', 0.5, 0.05, 0.1); }
  else if (k === 'meteor') { sfx('meteor', 0.6); ringFx(ev.x, ev.y, ev.r, '#ff8a3a', 1.0, 0.05); }
  else if (k === 'meteorHit') { sfx('boomBig', 0.8); fxShake(0.18); }
  else if (k === 'eye') { sfx('magic', 0.6); ringFx(g.gate.x, g.gate.y, 9, '#c79bff', 0.9, 0.06); banner('꿰뚫는 눈', '숨은 적이 모두 드러났다', 1300); }
  else if (k === 'goldrush') { sfx('coin', 0.8); banner('황금비', '15초 동안 처치 금화 두 배', 1300); }
  else if (k === 'mend') { sfx('heal', 0.7); ringFx(g.gate.x, g.gate.y, 1.6, '#7dffa6', 0.8, 0.07); }
  else if (k === 'timestop') { sfx('stun', 0.8); if (typeof fxScreenOk === 'function' && fxScreenOk()) { RD.flash = Math.max(RD.flash || 0, 0.22); RD.flashCol = '#c8d0ff'; } banner('시간 정지', '', 1100); }
  return true;
};

// ---------- 무한 차원전 ----------
function arOpenOk() { return !!(SAVE && SAVE.admin) || fdWon('c1s06'); }
function arSave() { var A = SAVE.arena; if (!A || typeof A !== 'object') A = SAVE.arena = { nick: '', board: [], best: null }; if (!Array.isArray(A.board)) A.board = []; return A; }
function arWeekBest(A, wk) { var b = null; A.board.forEach(function (r) { if (r.wk === wk && (!b || arScore(r.w, r.k) > arScore(b.w, b.k))) b = r; }); return b; }
function arWeekLabel(wk) { var p = wk.split('-'); return (+p[1]) + '/' + (+p[2]) + ' 주'; }
function arSelHtml() { if (arMi() < 0) return '';   // 타임플렉스: 무한 모드 판이 아직 없음
  var A = arSave(), wk = arWeek(), wb = arWeekBest(A, wk), ok = arOpenOk(), M = MAPS[arMi()] || {};
  var bs = ['grumsh', 'pumpking', 'titan', 'imugi', 'yong'].filter(function (k) { return ENEMIES[k]; });
  return '<button class="chCard arCard' + (ok ? '' : ' locked') + '" id="arCard"><span class="arBg"></span><span class="arEn">' + bs.map(function (k) { return '<img src="' + chEnemyIcon(k, 72) + '" alt="">'; }).join('') + '</span>' +
    '<span class="ccT"><i class="ccNo">무한</i><b>무한 차원전</b><span>모든 차원의 빌런이 끝없이 몰려온다</span></span><span class="ccB">' +
    (ok ? '<span class="ccChip"><img src="' + icon('skull', 32) + '" alt=""><span>이번 주</span> ' + (wb ? wb.w : 0) + '<span>웨이브</span></span>' + (A.best ? '<span class="ccChip"><img src="' + icon('crown', 32) + '" alt=""><span>최고</span> ' + A.best.w + '</span>' : '') + '<span class="ccChip go">도전</span>'
      : '<span class="ccChip lk"><img src="' + icon('lock', 32) + '" alt="">1-6 승리 뒤에 열림</span>') + '</span></button>';
}
function arSelBind(box) {
  var b = box.querySelector('#arCard'); if (!b) return;
  b.onclick = function (e) { e.stopPropagation(); if (!arOpenOk()) { sfx('warn', 0.4); toast('1장 6판을 이기면 열립니다', 2000); return; } sfx('ui', 0.6); arPanel(); };
}
function arBoardHtml(A, wk) {
  var L = A.board.filter(function (r) { return r.wk === wk; }).sort(function (p, q) { return arScore(q.w, q.k) - arScore(p.w, p.k); }).slice(0, 10);
  if (!L.length) return '<div class="arEmpty">이번 주 기록이 아직 없습니다. 첫 기록을 세워 보세요</div>';
  return L.map(function (r, i) { return '<div class="arRow' + (i < 3 ? ' r' + (i + 1) : '') + '"><i>' + (i + 1) + '</i><span class="arNm">' + esc(r.n || '?') + '</span><b>' + r.w + '</b><span class="arU">웨이브</span><em>' + v22N(r.k) + '</em><span class="arU">처치</span></div>'; }).join('');
}
function arPanel() {
  var A = arSave(), wk = arWeek(), mi = arMi(); if (mi < 0) return;
  var lo = loGet(mi);
  var h = '<div class="mh"><span class="mnum arNum"><img src="' + icon('skull', 48) + '" alt=""></span><div class="mhT"><div class="mt">무한 차원전</div><div class="ms"><span>' + arWeekLabel(wk) + '</span>, <span>같은 주에는 모두 같은 웨이브</span></div></div></div>' +
    '<p class="mdesc">1장부터 4장까지 모든 빌런과 우두머리가 차례로 나오고, 41웨이브부터는 모두 뒤섞여 끝없이 몰려옵니다. 얼마나 버티는지 겨루세요.</p>' +
    '<div class="arNick"><span>이름</span><input id="arNick" maxlength="8" value="' + esc(A.nick || '') + '"></div>' +
    '<div class="arBoardT"><img src="' + icon('crown', 32) + '" alt="">이번 주 순위 <small>(이 기기)</small></div><div class="arBoard">' + arBoardHtml(A, wk) + '</div>' +
    (A.best ? '<div class="arBest"><span>역대 최고</span> <b>' + A.best.w + '</b> <span>웨이브</span> <span class="arNm2">' + esc(A.best.n || '') + '</span></div>' : '') +
    '<div class="arTip">친구와 겨루기: 끝난 뒤 [기록 복사]로 기록과 확인 코드를 보내세요. 같은 주에는 모두 같은 적이 나옵니다.</div>' +
    '<button class="stLo" id="stLo"><span class="loL">출전<i>' + lo.length + ' / ' + LO_MAX + '</i></span><span class="loRow">' + loSlotsHtml(lo) + '</span><span class="loGo">편성</span></button>' + sk2RowHtml() +
    '<div class="mbtns"><button class="btn gold" id="arGo">출전</button></div><button class="xbtn" id="bClose">닫기</button>';
  openModal(h, 'arena');
  var nk = $('arNick'); nk.onchange = nk.onblur = function () { A.nick = String(nk.value || '').trim().slice(0, 8); saveNow(); };
  $('stLo').onclick = function () { sfx('ui', 0.5); loOpen(mi, function () { arPanel(); }); };
  sk2RowBind(function () { arPanel(); });
  $('arGo').onclick = function () {
    A.nick = String(nk.value || '').trim().slice(0, 8); saveNow();
    if (!loGet(mi).length) { toast('출전할 탑을 하나 이상 골라 주세요'); return; }
    closeModal(); sfx('ui', 0.6); startBattle(mi, 'arena', false);
  };
  $('bClose').onclick = function () { closeModal(); };
}
function arResult(g) {
  var A = arSave(), wk = g.arWeek || arWeek(), w = Math.max(0, g.wave - 1), k = g.stats.kills, n = A.nick || '나';
  var rec = { n: n, w: w, k: k, wk: wk, d: Date.now() };
  A.board.push(rec); A.board.sort(function (p, q) { return arScore(q.w, q.k) - arScore(p.w, p.k); }); A.board = A.board.slice(0, 40);
  var newBest = !A.best || arScore(w, k) > arScore(A.best.w, A.best.k); if (newBest) A.best = { n: n, w: w, k: k, wk: wk };
  var rank = A.board.filter(function (r) { return r.wk === wk; }).indexOf(rec) + 1;
  SAVE.mid = null; saveNow();
  var code = arCode(wk, w, k, n), txt = '[타워플렉스 무한 차원전 ' + arWeekLabel(wk) + '] ' + n + ': ' + w + '웨이브 버팀, ' + k + '마리 처치 (확인 코드 ' + code + ')';
  var h = '<div class="res lose arRes"><div class="rt">버틴 웨이브 ' + w + '</div>' + (newBest ? '<div class="arNew">역대 최고 기록</div>' : '') +
    '<div class="arStat"><span><span>처치</span> <b>' + v22N(k) + '</b></span><span><span>이번 주 순위</span> <b>' + rank + '</b></span><span><span>확인 코드</span> <b>' + code + '</b></span></div>' +
    meterResHtml(g) + '<div class="arBoardT"><img src="' + icon('crown', 32) + '" alt="">이번 주 순위 <small>(이 기기)</small></div><div class="arBoard">' + arBoardHtml(A, wk) + '</div>' +
    '<button class="btn sm" id="arCopy">기록 복사</button><div class="mbtns"><button class="btn" id="rMap">나가기</button><button class="btn gold" id="rRetry">다시 도전</button></div></div>';
  openModal(h, 'result');
  $('arCopy').onclick = function () { v22Copy(txt, function (ok) { sfx(ok ? 'click' : 'warn', 0.4); toast(ok ? '기록을 복사했습니다. 친구에게 붙여 넣어 보내세요' : '복사가 막혀 있습니다', 2200); }); };
  $('rMap').onclick = function () { closeModal(); chGoSelect(); };
  $('rRetry').onclick = function () { closeModal(); startBattle(g.mi, 'arena', false); };
}

// ---------- 시작 ----------
function v22Init() {
  if (!$('bMeter')) {   // 딜미터 단추: 전투 화면 오른쪽 위(HUD 바로 아래). HUD가 숨으면 같이 숨김(sk2Setup, 전투 시작)
    var b = document.createElement('button'); b.id = 'bMeter'; b.className = 'hide'; b.innerHTML = '<img src="' + meterIcon(64) + '" alt="">';
    b.onclick = function (e) { e.stopPropagation(); sfx('click', 0.4); meterToggle(); }; $('app').appendChild(b);
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  }
  if (!$('mtBox')) {
    var d = document.createElement('div'); d.id = 'mtBox'; d.className = 'hide';
    d.innerHTML = '<div class="mtHead"><b>딜미터</b><span class="mtTabs"><button data-by="d" class="on">피해</button><button data-by="k">처치</button></span><button class="mtX" id="mtX">닫기</button></div><div class="mtList"></div>';
    $('app').appendChild(d);
    d.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    d.querySelectorAll('.mtTabs button').forEach(function (t) { t.onclick = function (e) { e.stopPropagation(); MTR.by = t.getAttribute('data-by'); d.querySelectorAll('.mtTabs button').forEach(function (o) { o.classList.toggle('on', o === t); }); sfx('click', 0.3); meterDraw(); }; });
    $('mtX').onclick = function (e) { e.stopPropagation(); meterToggle(false); };
  }
  sk2Btns();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', v22Init); else v22Init();
// 시험용(tools, scripts): 화면 함수 몇 개를 밖으로
window.__v22 = { sel: function () { chGoSelect(); }, stage: function (mi) { chOpenStage(mi); }, result: function () { showResult(G); }, stop: function () { stopBattle(); }, tray: function () { trayClose(); }, aim: function () { return UIS.aim; }, arPanel: arPanel, meter: function () { return G ? meterList(G, 'd') : []; } };
