// ===== admin.js : 관리자 모드 (XTRA) =====
// 사용자 본인만 쓰는 운용 도구: 보석, 소환권, 탑, 판 진행, 전투 중 금화와 적을 마음대로 다룬다.
// 주의: 비밀번호가 이 코드 안에 들어 있다. 한 파일 HTML이라 누구나 열어 볼 수 있으니 완전한 보안은 아니다(가족, 지인이 우연히 켜지 않게 막는 정도).
// 들어가는 길: 타이틀의 버전 글자(id 'ver', 없으면 'verTxt'나 버전 글자를 찾아서)를 7번 누름 → 숫자 비밀번호 → SAVE.admin = 1
// 밖에서 부르는 함수: admOpen() 관리자 창(전투 밖), admBattle() 전투 중 창. 화면 갈래가 단추를 안 둬도 되게 이 파일이 스스로 구석 단추와 일시 정지 창 단추를 끼운다.
// 화면 갈래와의 연결: 관리자 단추에 data-adm 속성을 주거나 글자를 '관리자'로 하면 이 파일의 구석 단추(#admFab)와 일시 정지 창 단추(#admPause)는 스스로 빠진다.
//   편성 화면은 SAVE.admTw === 1 이고 SAVE.towers에 관리자 전용 탑 키가 있을 때 그 탑을 보여 주면 된다(빠져도 전투 관리자 창의 '모든 탑 쓰기'로 쓸 수 있음).
//   '진행 기록 지우기'(meta.js metaKeepWallet) 뒤에도 관리자 설정을 남기려면 그 목록에 'admin', 'admPin', 'admTw', 'admOpt', 'bonus'를 더할 것(지금은 지워짐).
// 저장(보통 저장과 같은 SAVE): admin(켬), admPin(바꾼 비밀번호), admTw(관리자 전용 탑 켬), admOpt { gold 전투 시작 금화 덤, free 무료 건설 자동, god 무적 자동 }
// 전투 상태: g.adm = { free, god, nocd, spd, cm0 }. 엔진은 건드리지 않는다(무료 건설은 g.R.costMul = -1, 무적과 재사용 시간은 매 프레임 admTick이 맞춤)
var ADM_PIN = '5885';   // v2.2: 기본 비밀번호 5885 (옛 기본값 7777로 저장된 것은 5885로 바꿔 읽음)
var ADM = { taps: 0, tapT: 0, pin: '', mode: 'enter', pin1: '', bad: 0, tab: 'wallet', sel: null, arm: '', dirty: 0, lastG: null, fab: null, fabKey: '', extT: 0, ext: 0, inited: 0, spawnN: 1, spawnCh: 0, blob: {} };
var ADM_GOLD = [0, 5000, 50000];

function admOn() { return !!(SAVE && SAVE.admin); }
function admPinNow() { return typeof SAVE.admPin === 'string' && /^\d{4,8}$/.test(SAVE.admPin) && SAVE.admPin !== '7777' ? SAVE.admPin : ADM_PIN; }
function admOpt() { if (!SAVE.admOpt || typeof SAVE.admOpt !== 'object') SAVE.admOpt = { gold: 0, free: 0, god: 0 }; return SAVE.admOpt; }
function admNum(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
// 탑 목록: 실행 시점의 TOWER_ORDER + TW2_ORDER (+ 관리자 전용 TW2_ADMIN). 합체 탑은 빼고, 자료가 없는 키는 건너뜀
function admTowerKeys(withAdm) {
  var a = [], add = function (k) { if (TOWERS[k] && !TOWERS[k].fusion && a.indexOf(k) < 0 && (withAdm || !TOWERS[k].admin)) a.push(k); };
  TOWER_ORDER.forEach(add);
  if (typeof TW2_ORDER !== 'undefined' && TW2_ORDER) TW2_ORDER.forEach(add);
  if (withAdm) { if (typeof TW2_ADMIN !== 'undefined' && TW2_ADMIN) TW2_ADMIN.forEach(add); for (var k in TOWERS) if (TOWERS[k].admin) add(k); }
  return a;
}
function admAdmKeys() { return admTowerKeys(true).filter(function (k) { return TOWERS[k].admin; }); }
function admEnemyKeys() { var a = []; (typeof ENEMY_ORDER !== 'undefined' ? ENEMY_ORDER : []).forEach(function (k) { if (ENEMIES[k] && a.indexOf(k) < 0) a.push(k); }); for (var k in ENEMIES) if (a.indexOf(k) < 0) a.push(k); return a; }
// 그림이 아직 없는 탑, 적은 색 동그라미로 대신
function admBlob(col, px, ch) {
  var key = col + px + ch; if (ADM.blob[key]) return ADM.blob[key];
  var c = mkC(px, px), x = cx2(c), m = px / 2;
  x.fillStyle = col; x.beginPath(); x.arc(m, m, px * 0.4, 0, 6.283); x.fill(); x.lineWidth = Math.max(2, px * 0.06); x.strokeStyle = '#4a2a5a'; x.stroke();
  if (ch) { x.fillStyle = '#fff'; x.font = Math.round(px * 0.4) + 'px CUTE, PRT, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, m, m + px * 0.03); }
  return (ADM.blob[key] = c.toDataURL());
}
function admTwIcon(k, px) { try { return towerIconURL(k, 1, 0, px); } catch (e) { return admBlob(TOWERS[k].col || '#c9b3ff', px, (TOWERS[k].short || TOWERS[k].name || '?').charAt(0)); } }
function admEnIcon(k, px) { try { return enemyIcon(k, px); } catch (e) { return admBlob(ENEMIES[k].boss ? '#ff8a7a' : '#b8a6e8', px, (ENEMIES[k].name || '?').charAt(0)); } }

// ---------- 들어가기: 버전 글자 7번 → 비밀번호 ----------
function admVerEl() {
  var e = $('ver') || $('verTxt'); if (e) return e;
  var t = $('sTitle'); if (!t) return null;
  var all = t.querySelectorAll('div, span, b, i, button');
  for (var i = all.length - 1; i >= 0; i--) { var s = (all[i].textContent || '').trim(); if (s && s.indexOf(VERSION) === 0 && s.length <= VERSION.length + 6 && !all[i].children.length) return all[i]; }
  return null;
}
// 문서 맨 앞(capture)에서 받아 타이틀의 '눌러서 시작'보다 먼저 가로챈다. 글자가 작으니 주변 16px까지 인정
function admTitleTap(ev) {
  var t = $('sTitle'); if (!t || t.classList.contains('hide') || UI.modalOpen) return;
  if (ev.target && ev.target.closest && (ev.target.closest('#sModal') || ev.target.closest('#bnLayer'))) return;
  var el = admVerEl(); if (!el) return;
  var r = el.getBoundingClientRect(); if (!r.width) return;
  var x = ev.clientX, y = ev.clientY, pad = 16;
  if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) return;
  ev.stopPropagation(); ev.preventDefault();
  if (admOn()) { sfx('ui', 0.5); admOpen(); return; }
  var now = performance.now(); if (now - ADM.tapT > 1500) ADM.taps = 0;
  ADM.tapT = now; ADM.taps++;
  el.classList.remove('admPop'); void el.offsetWidth; el.classList.add('admPop');
  if (ADM.taps >= 7) { ADM.taps = 0; sfx('lock', 0.5); admAsk('enter'); }
}
// 타이틀이 click 말고 pointerup, touchend로 시작하게 바뀌어도 버전 글자를 누른 것은 시작으로 넘어가지 않게 막는다(막기만 하고 세는 것은 click에서)
function admTitleGuard(ev) {
  var t = $('sTitle'); if (!t || t.classList.contains('hide') || UI.modalOpen) return;
  var el = admVerEl(); if (!el) return;
  var r = el.getBoundingClientRect(), p = ev.changedTouches && ev.changedTouches[0] ? ev.changedTouches[0] : ev, pad = 16; if (!r.width) return;
  if (p.clientX >= r.left - pad && p.clientX <= r.right + pad && p.clientY >= r.top - pad && p.clientY <= r.bottom + pad) ev.stopPropagation();
}
// 숫자판: mode 'enter' 확인 | 'new1' 새 비밀번호 | 'new2' 한 번 더
function admAsk(mode) {
  ADM.mode = mode || 'enter'; ADM.pin = '';
  var head = ADM.mode === 'enter' ? '관리자 확인' : '비밀번호 바꾸기', hint = ADM.mode === 'enter' ? '비밀번호를 입력하세요' : ADM.mode === 'new1' ? '새 비밀번호 (숫자 4~8자리)' : '한 번 더 입력하세요';
  var h = '<div class="pt">' + head + '</div><p class="admHint" id="admHint">' + hint + '</p><div class="admDots" id="admDots"></div><div class="admPad">';
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].forEach(function (k) { h += '<button class="admKey' + (k === 'ok' ? ' aOk' : k === 'del' ? ' aDel' : '') + '" data-k="' + k + '">' + (k === 'ok' ? '확인' : k === 'del' ? '지움' : k) + '</button>'; });
  h += '</div><button class="xbtn" id="admClose">닫기</button>';
  openModal(h, 'admpin');
  admDots();
  $('modal').querySelectorAll('.admKey').forEach(function (b) { b.onclick = function () { admKey(b.getAttribute('data-k')); }; });
  $('admClose').onclick = function () { sfx('click', 0.3); if (ADM.mode === 'enter') closeModal(); else admOpen('set'); };
}
function admDots() { var d = $('admDots'); if (!d) return; var h = ''; for (var i = 0; i < Math.max(4, ADM.pin.length); i++) h += '<i class="' + (i < ADM.pin.length ? 'aOn' : '') + '"></i>'; d.innerHTML = h; }
function admShake(msg) { var d = $('admDots'); if (d) { d.classList.remove('aBad'); void d.offsetWidth; d.classList.add('aBad'); } var hn = $('admHint'); if (hn && msg) hn.textContent = msg; sfx('warn', 0.4); try { vib(40); } catch (e) { } }
function admKey(k) {
  if (k === 'del') { ADM.pin = ADM.pin.slice(0, -1); sfx('click', 0.3); admDots(); return; }
  if (k !== 'ok') { if (ADM.pin.length < 8) { ADM.pin += k; sfx('click', 0.35); admDots(); } return; }
  var p = ADM.pin; ADM.pin = '';
  if (ADM.mode === 'enter') {
    if (p === admPinNow()) { ADM.bad = 0; SAVE.admin = 1; saveNow(); sfx('powerup', 0.6); toast('관리자 모드를 켰습니다', 1800); admOpen('wallet'); return; }
    ADM.bad++; admDots();
    if (ADM.bad >= 5) { ADM.bad = 0; closeModal(); toast('비밀번호가 다릅니다', 1600); sfx('warn', 0.4); return; }
    admShake('비밀번호가 다릅니다'); return;
  }
  if (ADM.mode === 'new1') {
    if (!/^\d{4,8}$/.test(p)) { admDots(); admShake('숫자 4~8자리로 정해 주세요'); return; }
    ADM.pin1 = p; admAsk('new2'); return;
  }
  if (p !== ADM.pin1) { ADM.pin1 = ''; admAsk('new1'); admShake('두 번이 서로 다릅니다. 처음부터 다시'); return; }
  SAVE.admPin = p; saveNow(); sfx('upgrade', 0.5); toast('비밀번호를 바꿨습니다', 1800); admOpen('set');
}

// ---------- 관리자 창 (전투 밖) ----------
function admTog(on) { return '<i class="admT' + (on ? ' aOn' : '') + '">' + (on ? '켬' : '끔') + '</i>'; }
function admArmTxt(key, txt) { return ADM.arm === key ? '한 번 더 누르면 실행' : txt; }
function admOpen(tab) {
  if (!admOn()) { admAsk('enter'); return; }
  if (G && UI.scr === 'battle' && !G.over) { admBattle(); return; }
  if (tab) { ADM.tab = tab; ADM.arm = ''; }
  var T = ADM.tab, O = admOpt(), gem = '<img src="' + uiIcon('gem', 48) + '" alt="">', tk = '<img src="' + gcIcon('ticket', 48) + '" alt="">', coin = '<img src="' + icon('coin', 48) + '" alt="">';
  var h = '<div class="pt">관리자</div><div class="tabs admTabs">' + [['wallet', '재화'], ['tower', '탑'], ['stage', '진행'], ['set', '설정']].map(function (t) { return '<button class="tab' + (T === t[0] ? ' on' : '') + '" data-a="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div class="admBody">';
  if (T === 'wallet') {
    h += '<div class="admRow"><span class="admL">' + gem + '보석</span><b class="admV" id="admGem">' + admNum(SAVE.gems || 0) + '</b></div>' +
      '<div class="admBs"><button class="admB" data-a="gem" data-v="100">+100</button><button class="admB" data-a="gem" data-v="1000">+1천</button><button class="admB" data-a="gem" data-v="10000">+1만</button><button class="admB aSub" data-a="gem0">0으로</button></div>' +
      '<div class="admRow"><span class="admL">' + tk + '소환권</span><b class="admV" id="admTk">' + admNum(SAVE.tickets || 0) + '</b></div>' +
      '<div class="admBs"><button class="admB" data-a="tk" data-v="1">+1</button><button class="admB" data-a="tk" data-v="10">+10</button><button class="admB" data-a="tk" data-v="100">+100</button><button class="admB aSub" data-a="tk0">0으로</button></div>' +
      '<div class="admSec">전투를 시작할 때 자동으로</div>' +
      '<button class="admRow" data-a="ogold"><span class="admL">' + coin + '시작 금화 덤</span><b class="admV">' + (O.gold ? '+' + admNum(O.gold) : '없음') + '</b></button>' +
      '<button class="admRow" data-a="ofree"><span class="admL">무료 건설과 강화</span>' + admTog(O.free) + '</button>' +
      '<button class="admRow" data-a="ogod"><span class="admL">무적 (생명이 안 깎임)</span>' + admTog(O.god) + '</button>' +
      '<p class="admNote">전투 중에는 일시 정지 창이나 구석의 관리자 단추로 금화, 적 소환, 즉시 승리를 쓸 수 있습니다.</p>';
  } else if (T === 'tower') {
    var ks = admTowerKeys(!!SAVE.admTw), own = ks.filter(gcOwns).length;
    if (!ADM.sel || ks.indexOf(ADM.sel) < 0) ADM.sel = ks[0];
    var s = ADM.sel, so = gcOwns(s), ss = gcStar(s);
    h += '<div class="admGrid aTw">' + ks.map(function (k) { var o = gcOwns(k), st = gcStar(k); return '<button class="admC' + (o ? '' : ' aNo') + (k === s ? ' aSel' : '') + (TOWERS[k].admin ? ' aAd' : '') + '" data-a="twSel" data-v="' + k + '"><img src="' + admTwIcon(k, 64) + '" alt="">' + (o ? '<em>' + (st ? '★' + st : '보유') + '</em>' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="admPick"><img src="' + admTwIcon(s, 72) + '" alt=""><div class="admPT"><b>' + esc(TOWERS[s].name) + '</b><span>' + (so ? '보유, 별 ' + ss + ' / 5 (피해 +' + ss * 6 + '%)' : '아직 없음') + '</span></div>' +
      (so ? '<button class="admB aRnd" data-a="twStar" data-v="-1">-</button><button class="admB aRnd" data-a="twStar" data-v="1">+</button>' : '') + '<button class="admB' + (so ? ' aSub' : '') + '" data-a="twOwn">' + (so ? '빼기' : '갖기') + '</button></div>' +
      '<div class="admBs aTwo"><button class="admB" data-a="twAll">모든 탑 갖기 (' + own + ' / ' + ks.length + ')</button><button class="admB" data-a="twMax">가진 탑 별 5개</button><button class="admB aSub" data-a="twZero">가진 탑 별 0개</button>' +
      '<button class="admB' + (SAVE.admTw ? ' aOn' : '') + '" data-a="twAdm">관리자 전용 탑 ' + (SAVE.admTw ? '켬' : '끔') + '</button></div>';
    if (!admAdmKeys().length) h += '<p class="admNote">관리자 전용 탑 자료가 아직 없습니다.</p>';
  } else if (T === 'stage') {
    var won = 0; MAPS.forEach(function (M) { if (fdWon(M.id)) won++; });
    var un = ['branch', 'ult', 'fuse'].map(function (k) { return fdUnlocked(k); });
    h += '<div class="admRow"><span class="admL"><img src="' + icon('star', 48) + '" alt="">이긴 판</span><b class="admV">' + won + ' / ' + MAPS.length + ', 별 ' + totalStars() + '</b></div>' +
      '<p class="admNote">관리자 모드가 켜져 있는 동안은 모든 판과 챕터, 변신 6단계와 합체가 잠기지 않습니다. 아래 단추는 기록 자체를 바꿔서 관리자 모드를 꺼도 남습니다.</p>' +
      '<div class="admBs aOne"><button class="admB' + (ADM.arm === 'stAll' ? ' aArm' : '') + '" data-a="stAll">' + admArmTxt('stAll', '모든 판 별 3개로 열기') + '</button>' +
      '<button class="admB' + (ADM.arm === 'stHard' ? ' aArm' : '') + '" data-a="stHard">' + admArmTxt('stHard', '어려움과 깃발까지 모두 완료 (별 최대)') + '</button>' +
      '<button class="admB" data-a="unlock">변신과 합체 잠금 풀기 ' + (un[0] && un[1] && un[2] ? '(열림)' : '') + '</button>' +
      '<button class="admB" data-a="bnReset">보너스 게임 오늘 보상 다시 받기</button>' +
      '<button class="admB aSub' + (ADM.arm === 'stZero' ? ' aArm' : '') + '" data-a="stZero">' + admArmTxt('stZero', '판 기록만 지우기 (탑과 재화는 그대로)') + '</button></div>';
  } else {
    h += '<div class="admBs aOne"><button class="admB" data-a="pin">비밀번호 바꾸기</button>' +
      '<button class="admB aSub' + (ADM.arm === 'reset' ? ' aArm' : '') + '" data-a="reset">' + admArmTxt('reset', '저장 초기화 (전부 처음으로)') + '</button>' +
      '<button class="admB aSub" data-a="off">관리자 모드 끄기</button></div>' +
      '<p class="admNote">끈 뒤에는 타이틀의 버전 글자를 7번 누르고 비밀번호를 넣으면 다시 켜집니다. 저장 초기화는 보석, 탑, 판 기록을 모두 지우고 관리자 모드와 비밀번호만 남깁니다.</p>' +
      '<p class="admNote">관리자 모드로 얻은 것은 보통 저장에 그대로 남습니다.</p>';
  }
  h += '</div><button class="xbtn" id="admClose">닫기</button>';
  var M = $('modal'), sc = UI.modalOpen && UI.modalKind === 'admin' && M.querySelector('.admBody') ? M.querySelector('.admBody').scrollTop : 0, re = UI.modalOpen && UI.modalKind === 'admin';
  openModal(h, 'admin' + (re ? ' admRe' : ''));
  UI.modalKind = 'admin';
  if (sc && M.querySelector('.admBody')) M.querySelector('.admBody').scrollTop = sc;
  M.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { admAct(b.getAttribute('data-a'), b.getAttribute('data-v'), b); }; });
  $('admClose').onclick = function () { sfx('click', 0.3); admClose(); };
}
function admClose() {
  ADM.arm = ''; closeModal();
  try { uiMetaDots(); } catch (e) { }
  if (ADM.dirty) { ADM.dirty = 0; if (UI.scr === 'sMap') { UI.mapDrawn = 0; try { goMap(); } catch (e) { } } }
}
function admAct(a, v, el) {
  var arm = ADM.arm; ADM.arm = '';
  var need = function (key) { if (arm === key) return true; ADM.arm = key; sfx('warn', 0.3); admOpen(); return false; };
  if (a === 'tab') { sfx('click', 0.4); admOpen(v); return; }
  if (a === 'gem') { metaGemAdd(+v); if (el) uiGemBurst(el, +v); }
  else if (a === 'gem0') { SAVE.gems = 0; metaSaveNow(); uiGemsShow(false); sfx('click', 0.4); }
  else if (a === 'tk') { SAVE.tickets = (SAVE.tickets || 0) + (+v); saveNow(); sfx('coin', 0.5); }
  else if (a === 'tk0') { SAVE.tickets = 0; saveNow(); sfx('click', 0.4); }
  else if (a === 'ogold') { var O = admOpt(); O.gold = ADM_GOLD[(ADM_GOLD.indexOf(O.gold) + 1) % ADM_GOLD.length]; saveNow(); sfx('click', 0.4); }
  else if (a === 'ofree') { admOpt().free = admOpt().free ? 0 : 1; saveNow(); sfx('click', 0.4); }
  else if (a === 'ogod') { admOpt().god = admOpt().god ? 0 : 1; saveNow(); sfx('click', 0.4); }
  else if (a === 'twSel') { ADM.sel = v; sfx('click', 0.35); }
  else if (a === 'twOwn') {
    var k = ADM.sel; if (!TOWERS[k]) return;
    if (gcOwns(k)) { if (k === 'archer') { toast('궁수탑은 뺄 수 없습니다', 1400); sfx('warn', 0.3); } else { delete SAVE.towers[k]; sfx('sell', 0.5); } }
    else { SAVE.towers[k] = { n: 1, star: 0 }; sfx('build', 0.5); }
    saveNow(); ADM.dirty = 1;
  }
  else if (a === 'twStar') { var W = SAVE.towers[ADM.sel]; if (W) { W.star = clamp((W.star || 0) + (+v), 0, 5); saveNow(); sfx(+v > 0 ? 'star' : 'click', 0.4); } }
  else if (a === 'twAll') { admTowerKeys(!!SAVE.admTw).forEach(function (k2) { if (!gcOwns(k2)) SAVE.towers[k2] = { n: 1, star: 0 }; }); saveNow(); ADM.dirty = 1; sfx('upgradeBig', 0.5); toast('모든 탑을 가졌습니다', 1500); }
  else if (a === 'twMax' || a === 'twZero') { for (var k3 in SAVE.towers) if (SAVE.towers[k3]) SAVE.towers[k3].star = a === 'twMax' ? 5 : 0; saveNow(); sfx(a === 'twMax' ? 'star' : 'click', 0.5); }
  else if (a === 'twAdm') {
    var ad = admAdmKeys(); if (!ad.length) { toast('관리자 전용 탑 자료가 아직 없습니다', 1600); sfx('warn', 0.3); admOpen(); return; }
    SAVE.admTw = SAVE.admTw ? 0 : 1;
    ad.forEach(function (k4) { if (SAVE.admTw) { if (!SAVE.towers[k4]) SAVE.towers[k4] = { n: 1, star: 0 }; } else delete SAVE.towers[k4]; });
    saveNow(); ADM.dirty = 1; sfx(SAVE.admTw ? 'powerup' : 'click', 0.5);
    toast(SAVE.admTw ? ad.map(function (k5) { return TOWERS[k5].name; }).join(', ') + ' 사용 가능' : '관리자 전용 탑을 껐습니다', 2000);
  }
  else if (a === 'stAll' || a === 'stHard') {
    if (!need(a)) return;
    MAPS.forEach(function (M) { var r = rec(M.id); r.normal = 3; if (a === 'stHard') { r.hard = 3; r.flag = 1; } });
    SAVE.prog = Math.max(SAVE.prog || 0, MAPS.length - 1); saveNow(); ADM.dirty = 1; sfx('victory', 0.5); toast('판 ' + MAPS.length + '개를 모두 열었습니다', 1800);
  }
  else if (a === 'stZero') { if (!need(a)) return; SAVE.rec = {}; SAVE.prog = 0; SAVE.mid = null; saveNow(); ADM.dirty = 1; sfx('click', 0.4); toast('판 기록을 지웠습니다', 1600); }
  else if (a === 'unlock') {
    var n = 0; for (var uk in UNLOCKS) { var id = UNLOCKS[uk]; if (id && fdMi(id) >= 0 && !fdWon(id)) { rec(id).normal = Math.max(1, rec(id).normal || 0); n++; } }
    saveNow(); ADM.dirty = 1; sfx('upgrade', 0.5); toast(n ? '변신 6단계와 합체를 열었습니다' : '이미 열려 있습니다', 1800);
  }
  else if (a === 'bnReset') { var ok = typeof bnAdminReset === 'function' ? bnAdminReset() : false; sfx('click', 0.4); toast(ok ? '보너스 게임 보상을 오늘 다시 받을 수 있습니다' : '보너스 게임이 아직 없습니다', 1800); ADM.dirty = 1; }
  else if (a === 'pin') { sfx('click', 0.4); admAsk('new1'); return; }
  else if (a === 'reset') {
    if (!need(a)) return;
    var pin = SAVE.admPin, lang = SAVE.set && SAVE.set.lang;
    SAVE = metaFixSave(defSave()); SAVE.admin = 1; if (pin) SAVE.admPin = pin; if (lang) SAVE.set.lang = lang;
    try { if (typeof bnAdminReset === 'function') bnAdminReset(true); } catch (e) { }
    saveNow(); try { applySettings(); } catch (e2) { } ADM.dirty = 1; sfx('click', 0.4); toast('저장을 처음으로 되돌렸습니다', 1800);
  }
  else if (a === 'off') { SAVE.admin = 0; saveNow(); ADM.dirty = 1; sfx('lockOff', 0.5); admClose(); toast('관리자 모드를 껐습니다', 1800); return; }
  admOpen();
}

// ---------- 전투 중 ----------
function admBattleInit(g) {
  g.adm = { free: 0, god: 0, nocd: 0, spd: 0, cm0: g.R ? g.R.costMul || 0 : 0 };
  var O = admOpt(), msg = [];
  if (O.gold) { g.gold += O.gold; msg.push('금화 +' + admNum(O.gold)); }
  if (O.free) { admSetFree(g, 1); msg.push('무료 건설'); }
  if (O.god) { g.adm.god = 1; msg.push('무적'); }
  if (msg.length) setTimeout(function () { if (G === g) toast('관리자: ' + msg.join(', '), 2200); }, 2000);
}
function admSetFree(g, on) { g.adm.free = on ? 1 : 0; if (g.R) g.R.costMul = on ? -1 : g.adm.cm0; }
function admSetSpeed(on) { UI.speed = on ? 5 : 1; var t = $('spdTxt'); if (t) t.textContent = UI.speed + '배'; var b = $('bSpeed'); if (b) b.classList.toggle('on', UI.speed > 1); }
// 살아 있는 적을 모두 없앤다. reward: 처치로 치고 금화도 줌(분열, 부활, 능력 고리를 몇 번 돌려 끝까지), 아니면 조용히 지움
function admClearEnemies(g, reward) {
  var n = 0, pass, i, e;
  if (reward) {
    for (pass = 0; pass < 8; pass++) {
      var live = g.enemies.filter(function (q) { return !q.dead; }); if (!live.length) break;
      for (i = 0; i < live.length; i++) { e = live[i]; e.untarget = 0; e.shield = 0; e.hp = 0; try { killEnemy(g, e, null); } catch (err) { e.dead = 1; } if (e.dead) n++; }
    }
  }
  for (i = 0; i < g.enemies.length; i++) { e = g.enemies[i]; if (!e.dead) { e.dead = 1; n++; } }
  g.boss = null; if (g.focus && g.focus.e) g.focus = null;
  return n;
}
function admBattle(view) {
  var g = G; if (!admOn()) { admAsk('enter'); return; }
  if (!g || UI.scr !== 'battle') { admOpen(); return; }
  if (!g.adm) admBattleInit(g);
  UI.paused = true; try { trayClose(); } catch (e) { }
  var A = g.adm, coin = '<img src="' + icon('coin', 48) + '" alt="">', life = '<img src="' + icon('life', 48) + '" alt="">', h;
  if (view === 'spawn') {
    var ks = admEnemyKeys(), chs = []; ks.forEach(function (k) { var c = ENEMIES[k].ch || 1; if (chs.indexOf(c) < 0) chs.push(c); }); chs.sort();
    if (chs.indexOf(ADM.spawnCh) < 0) ADM.spawnCh = (g.M && chs.indexOf(g.M.ch || 1) >= 0) ? g.M.ch || 1 : chs[0];
    var list = ks.filter(function (k) { return (ENEMIES[k].ch || 1) === ADM.spawnCh; });
    h = '<div class="pt">적 소환</div>' + (chs.length > 1 ? '<div class="tabs admTabs">' + chs.map(function (c) { return '<button class="tab' + (c === ADM.spawnCh ? ' on' : '') + '" data-a="spCh" data-v="' + c + '">' + c + '장</button>'; }).join('') + '</div>' : '') +
      '<div class="admBody"><div class="admGrid aEn">' + list.map(function (k) { var E = ENEMIES[k]; return '<button class="admC' + (E.boss ? ' aBs' : '') + '" data-a="spawn" data-v="' + k + '"><img src="' + admEnIcon(k, 64) + '" alt=""><span>' + esc(E.name) + '</span></button>'; }).join('') + '</div></div>' +
      '<div class="admBs"><span class="admL">한 번에</span>' + [1, 5, 20].map(function (n) { return '<button class="admB' + (ADM.spawnN === n ? ' aOn' : '') + '" data-a="spN" data-v="' + n + '">' + n + '마리</button>'; }).join('') + '</div>' +
      '<button class="xbtn" id="admClose">돌아가기</button>';
  } else {
    h = '<div class="pt">전투 관리자</div><div class="admBody">' +
      '<div class="admRow"><span class="admL">' + coin + '금화</span><b class="admV">' + admNum(g.gold) + '</b><span class="admIn"><button class="admB" data-a="gold" data-v="1000">+1,000</button><button class="admB" data-a="gold" data-v="10000">+10,000</button></span></div>' +
      '<div class="admRow"><span class="admL">' + life + '생명</span><b class="admV">' + g.lives + ' / ' + g.maxLives + '</b><span class="admIn"><button class="admB" data-a="life">가득</button></span></div>' +
      '<div class="admBs aTwo"><button class="admB aTg' + (A.god ? ' aOn' : '') + '" data-a="god">무적' + admTog(A.god) + '</button><button class="admB aTg' + (A.free ? ' aOn' : '') + '" data-a="free">무료 건설' + admTog(A.free) + '</button>' +
      '<button class="admB aTg' + (A.nocd ? ' aOn' : '') + '" data-a="nocd">재사용 시간 없음' + admTog(A.nocd) + '</button><button class="admB aTg' + (UI.speed >= 5 ? ' aOn' : '') + '" data-a="spd">배속 5배' + admTog(UI.speed >= 5) + '</button></div>' +
      '<div class="admSec">웨이브 ' + (g.D.endless ? g.wave : g.wave + ' / ' + g.N) + ', 적 ' + g.enemies.filter(function (e) { return !e.dead; }).length + '마리</div>' +
      '<div class="admBs aTwo"><button class="admB" data-a="kill">적 전멸</button><button class="admB" data-a="skip">웨이브 건너뛰기</button><button class="admB" data-a="spawnV">적 소환</button><button class="admB" data-a="upAll">세운 탑 한 단계씩 강화</button>' +
      '<button class="admB" data-a="allTw">모든 탑 쓰기</button><button class="admB aGold' + (ADM.arm === 'win' ? ' aArm' : '') + '" data-a="win">' + admArmTxt('win', '즉시 승리') + '</button></div>' +
      '</div><button class="xbtn" id="admClose">전투로 돌아가기</button>';
  }
  openModal(h, 'admin admBt' + (UI.modalOpen && UI.modalKind === 'admin' ? ' admRe' : ''));
  UI.modalKind = 'admin';
  $('modal').querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { admBtAct(b.getAttribute('data-a'), b.getAttribute('data-v'), b); }; });
  $('admClose').onclick = function () { sfx('click', 0.3); ADM.arm = ''; if (view === 'spawn') admBattle(); else closeModal(); };
}
function admBtAct(a, v, el) {
  var g = G; if (!g) { closeModal(); return; }
  var A = g.adm, arm = ADM.arm; ADM.arm = '';
  if (a === 'gold') { g.gold += +v; sfx('coin', 0.5); }
  else if (a === 'life') { g.lives = g.maxLives; sfx('heal', 0.5); }
  else if (a === 'god') { A.god = A.god ? 0 : 1; sfx('shield', 0.5); }
  else if (a === 'free') { admSetFree(g, !A.free); sfx('click', 0.4); }
  else if (a === 'nocd') { A.nocd = A.nocd ? 0 : 1; sfx('click', 0.4); }
  else if (a === 'spd') { A.spd = UI.speed >= 5 ? 0 : 1; admSetSpeed(A.spd); sfx('click', 0.4); }
  else if (a === 'kill') { var n = admClearEnemies(g, true); sfx('boomBig', 0.5); closeModal(); toast('적 ' + n + '마리를 쓸어 냈습니다', 1500); return; }
  else if (a === 'skip') {
    if (g.pickWait) { toast('능력 카드를 먼저 골라 주세요', 1600); sfx('warn', 0.3); admBattle(); return; }
    g.spawnQ = []; admClearEnemies(g, false);
    if (g.wave < g.N) { g.nextT = 0; g.waiting = false; startWave(g); }
    sfx('horn', 0.5); closeModal(); try { updateWaveBtn(true); } catch (e) { } toast(g.wave >= g.N && !g.D.endless ? '마지막 웨이브입니다' : '웨이브 ' + g.wave + '(으)로 건너뛰었습니다', 1500); return;
  }
  else if (a === 'spawnV') { sfx('click', 0.4); admBattle('spawn'); return; }
  else if (a === 'spCh') { ADM.spawnCh = +v; sfx('click', 0.4); admBattle('spawn'); return; }
  else if (a === 'spN') { ADM.spawnN = +v; sfx('click', 0.4); admBattle('spawn'); return; }
  else if (a === 'spawn') {
    if (!ENEMIES[v]) return; var made = 0;
    g.seenEnemies[v] = 1;   // '새로운 적' 카드가 이 창을 덮지 않게
    for (var i = 0; i < ADM.spawnN; i++) { try { if (spawnEnemy(g, v, Math.floor(Math.random() * 8), i * 0.35)) made++; } catch (e2) { console.error(e2); break; } }
    sfx('summon', 0.5); if (el) { el.classList.remove('admPop'); void el.offsetWidth; el.classList.add('admPop'); }
    toast(ENEMIES[v].name + ' ' + made + '마리 소환', 1100); return;
  }
  else if (a === 'upAll') {
    var cm = g.R.costMul, up = 0; g.R.costMul = -1;
    g.towers.slice().forEach(function (t) { try { if (canUpgrade(g, t) && upgradeTower(g, t, t.lvl === 3 ? (t.br || 0) : t.br)) up++; } catch (e3) { console.error(e3); } });
    g.R.costMul = cm; sfx(up ? 'upgradeBig' : 'warn', 0.5); closeModal(); toast(up ? '탑 ' + up + '개를 강화했습니다' : '더 강화할 탑이 없습니다', 1500); return;
  }
  else if (a === 'allTw') {
    g.towersOk = admTowerKeys(true); g.maxLv = 6; g.fuse = true; g.fuseOk = true; g.admin = true;
    sfx('powerup', 0.5); closeModal(); toast('탑 ' + g.towersOk.length + '종을 모두 쓸 수 있습니다 (6단계, 합체 포함)', 2000); return;
  }
  else if (a === 'win') {
    if (arm !== 'win') { ADM.arm = 'win'; sfx('warn', 0.3); admBattle(); return; }
    g.spawnQ = []; admClearEnemies(g, false); if (!g.D.endless) g.wave = g.N; g.finale = 0; g.pickWait = false; g.pickCards = null;
    if (!g.over) { g.over = 1; emit(g, 'win', {}); }
    closeModal(); return;
  }
  admBattle();
}
// 매 프레임: 새 전투 감지(자동 설정 적용), 무적과 재사용 시간, 구석 단추 위치
function admTick() {
  requestAnimationFrame(admTick);
  try {
    var g = G, on = admOn();
    if (g !== ADM.lastG) { ADM.lastG = g; ADM.fabKey = ''; if (g && on && !g.adm) admBattleInit(g); }
    if (g && g.adm && on && UI.scr === 'battle') {
      var A = g.adm;
      if (A.god) {
        for (var i = 0; i < g.enemies.length; i++) g.enemies[i].leak = 0;
        if (g.lives < g.maxLives) g.lives = g.maxLives;
        if (g.over === -1 && UI.endT > 0) { g.over = 0; UI.endT = 0; }   // 무적인데 한 번에 무너졌으면 되돌림(결과 창이 뜨기 전)
      }
      if (A.nocd) for (var k in g.sk) if (g.sk[k].cd > 0) g.sk[k].cd = 0;
      if (A.free && g.R && g.R.costMul !== -1) g.R.costMul = -1;
    }
    admFabSync();
  } catch (e) { if (!ADM.err) { ADM.err = 1; console.error(e); } }
}

// ---------- 스스로 끼우는 단추: 구석 단추, 일시 정지 창 단추 ----------
// 화면 갈래가 이미 관리자 단추를 뒀으면(data-adm 속성, 또는 글자가 '관리자'인 단추) 전투 밖 구석 단추는 숨긴다
function admHasExt() {
  var now = performance.now(); if (now - ADM.extT < 900) return ADM.ext; ADM.extT = now; ADM.ext = 0;
  var bs = document.querySelectorAll('#app button, #app [data-adm]');
  for (var i = 0; i < bs.length; i++) {
    var b = bs[i]; if (b.id === 'admFab' || b.id === 'admPause' || b.closest('#sModal') || b.closest('#hud')) continue;
    if ((b.hasAttribute('data-adm') || (b.textContent || '').trim() === '관리자') && b.offsetParent !== null) { ADM.ext = 1; break; }
  }
  return ADM.ext;
}
function admFabSync() {
  var f = ADM.fab; if (!f) return;
  var vis = function (id) { var e = $(id); return !!e && !e.classList.contains('hide'); };
  var on = admOn(), bt = UI.scr === 'battle' && !!G, title = vis('sTitle'), bn = vis('bnLayer');
  var story = vis('story') || vis('loading'), show = on && !title && !bn && !story && !UI.modalOpen && !(bt && G.over) && (bt || !admHasExt());
  var v = bt && RD.view ? RD.view : null, key = show ? (bt ? 'b' + (v ? [v.S, v.ox, v.oy, v.dpr].join(',') : '') + window.innerWidth + 'x' + window.innerHeight : 'm') : 'x';
  if (key === ADM.fabKey) return; ADM.fabKey = key;
  f.classList.toggle('hide', !show); f.classList.toggle('aBt', !!bt);
  document.body.classList.toggle('admOn', on);
  if (!show) return;
  if (!bt) { f.style.left = ''; f.style.top = ''; f.style.right = ''; f.classList.remove('aDim'); return; }
  // 전투: 전장을 가리지 않는 자리 찾기. 위 막대 아래 틈 → 전장 아래 틈 → 전장 옆 여백 → 없으면 오른쪽 위에 흐리게
  var top = hudTop(), W0 = window.innerWidth, sz = 34, dim = false, L, T, mb = $('bMeter'), W = W0 - (mb && !mb.classList.contains('hide') ? 48 : 0);   // 딜미터 단추(오른쪽 위)와 겹치지 않게 그만큼 왼쪽으로
  var bx0 = v ? v.ox / v.dpr : 0, by0 = v ? v.oy / v.dpr : top, bx1 = v ? bx0 + v.S * G.cols / v.dpr : W, by1 = v ? by0 + v.S * G.rows / v.dpr : 0, bot = window.innerHeight - hudBot();
  if (by0 - top >= sz - 4) { L = W - sz - 6; T = top + (by0 - top - sz) / 2; }   // 틈이 단추보다 1~2px 좁아도 가운데에 끼움
  else if (v && bot - by1 >= sz - 4) { L = W - sz - 6; T = by1 + (bot - by1 - sz) / 2; }   // 전장 아래와 아래 막대 사이 틈
  else if (W0 - bx1 >= sz + 2) { L = bx1 + (W0 - bx1 - sz) / 2; T = top + 64; }
  else if (bx0 >= sz + 2) { L = (bx0 - sz) / 2; T = top + 64; }
  else if ((function () { var hl = document.querySelector('#hud .hl'), hr = document.querySelector('#hud .hr'); if (!hl || !hr) return false; var ar = 0; for (var i = 0; i < hl.children.length; i++) { var q = hl.children[i].getBoundingClientRect(); if (q.width) ar = Math.max(ar, q.right); } var b = hr.getBoundingClientRect(); if (!ar || b.left - ar < sz + 8) return false; L = b.left - sz - 6; T = b.top + (b.height - sz) / 2; return true; })()) { }   // 위 막대 안의 빈 틈(왼쪽 칸과 배속 단추 사이)
  else { L = W - sz - 4; T = top + 2; dim = true; }
  f.style.left = Math.round(L) + 'px'; f.style.top = Math.round(T) + 'px'; f.style.right = 'auto'; f.classList.toggle('aDim', dim);
}
function admPauseHook() {
  if (!UI.modalOpen || UI.modalKind !== 'pause' || !admOn() || !G) return;
  var M = $('modal'); if (M.querySelector('#admPause')) return;
  var bs = M.querySelectorAll('button'); for (var i = 0; i < bs.length; i++) if ((bs[i].textContent || '').indexOf('관리자') >= 0 || bs[i].hasAttribute('data-adm')) return;   // 화면 갈래가 이미 둠
  var b = document.createElement('button'); b.className = 'btn admPauseBtn'; b.id = 'admPause'; b.innerHTML = '<img src="' + icon('gear', 48) + '" alt="">관리자';
  b.onclick = function () { sfx('ui', 0.5); admBattle(); };
  (M.querySelector('.pbtns') || M).appendChild(b);
}
function admInit() {
  if (ADM.inited) return; ADM.inited = 1;
  document.addEventListener('click', admTitleTap, true);
  ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup'].forEach(function (k) { document.addEventListener(k, admTitleGuard, true); });
  var f = document.createElement('button'); f.id = 'admFab'; f.className = 'admFab hide'; f.setAttribute('aria-label', '관리자'); f.innerHTML = '<img src="' + icon('gear', 64) + '" alt="">';
  f.onclick = function (e) { e.stopPropagation(); sfx('ui', 0.5); if (G && UI.scr === 'battle') admBattle(); else admOpen(); };
  $('app').appendChild(f); ADM.fab = f;
  try { new MutationObserver(function () { try { admPauseHook(); } catch (e) { } }).observe($('modal'), { childList: true }); } catch (e) { }
  requestAnimationFrame(admTick);
}
// 시험용 (tools/xflow.py, 브라우저 콘솔)
window.__adm = {
  on: function (v) { if (v != null) { SAVE.admin = v ? 1 : 0; saveNow(); ADM.fabKey = ''; } return admOn(); }, open: function (t) { admOpen(t); }, battle: function (v) { admBattle(v); }, ask: function () { admAsk('enter'); },
  pin: function () { return admPinNow(); }, towers: function (a) { return admTowerKeys(a); }, enemies: function () { return admEnemyKeys(); }, st: function () { return { taps: ADM.taps, tab: ADM.tab, arm: ADM.arm, ext: ADM.ext, err: ADM.err || 0 }; }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(admInit, 0); }); else setTimeout(admInit, 0);
