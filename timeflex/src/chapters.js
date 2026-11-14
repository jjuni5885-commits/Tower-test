// ===== chapters.js : v2.0 전투 밖 흐름 (챕터 고르기 → 챕터 지도 → 판 창), 챕터 색, 새 도감, 확정 보상 연출, 옛 저장 안내 =====
// 흐름: 타이틀 → chGoSelect(챕터 카드) → chGoMap(ch)(판 노드 + 보너스 노드) → chOpenStage(mi)(판 창) → beginStage(전투).
// 판 개수와 챕터는 MAPS, CHAPTERS에서 읽는다. BONUS_NODES, bnOpen, bnState, admOpen, FUSIONS, TW_RARITY는 없어도 돌아가게 방어적으로 읽는다.
// 다른 갈래와의 약속:
//  - 챕터 색: chSetTheme(ch)가 body[data-ch]를 0(공통: 타이틀, 챕터 고르기) | 1 | 2 | 3 | 4로 바꾼다. 변수는 style_ch.css 맨 위(--ch-*). 전투에 들어갈 때 ui.js startBattle 첫 줄이 판의 ch로 바꾼다
//  - goMap(): 타이틀에서 부르면 챕터 고르기, 전투 중(G가 있음)에 부르면 그 판의 챕터 지도, 그 밖에는 보던 화면을 다시 그림. 직접 가려면 chGoSelect(), chGoMap(ch)
//  - 보너스 칸: BONUS_NODES와 bnOpen이 둘 다 있을 때만 그림. 그 판(after)을 이기면 열리고 누르면 bnOpen(node), 완료 표시는 bnState(id).done. 끝나면 goMap()을 부르면 보던 지도로 돌아옴
//  - 관리자: 타이틀 버전 글자 id="ver"(눌러도 타이틀이 넘어가지 않음). SAVE.admin이고 admOpen이 있으면 지도 위 막대에 #mAdm 단추. 관리자면 편성과 도감에 TOWERS[k].admin 탑이 나옴
//  - 확정 보상: gacha.js gcWinTickets(showResult가 부름) → gcStageReward(g)가 한 판에 한 번 지급(SAVE.rwGot), 결과는 GC.lastReward. 결과 창에 #rRew 줄을 끼우고 탑이면 chRewardShow(획득 연출).
//    결과 창이 스스로 보상 줄을 그리면 id="rRew"를 줄 것(내 줄은 건너뜀). 지급을 또 하면 두 번 받게 되니 지급은 gcStageReward에만
//  - 챕터 시작 이야기 STORY['c2in'] 식이 있으면 챕터 카드를 처음 누를 때 한 번 보여 줌
var CH = { ch: 0, mode: 'sel', inited: 0, key: '', art: {} };

// ---------- 자료 읽기 ----------
function chStages(ch) { var a = []; MAPS.forEach(function (M, i) { if ((M.ch || 1) === ch) a.push(i); }); return a; }
function chBonus(ch) { if (CH.fakeBonus) return CH.fakeBonus.filter(function (b) { return b.ch === ch; });   // 시험 전용(__ch.fake)
  try { if (typeof BONUS_NODES === 'undefined' || !Array.isArray(BONUS_NODES) || typeof bnOpen !== 'function') return []; return BONUS_NODES.filter(function (b) { return b && b.ch === ch; }); } catch (e) { return []; } }
function chBonusState(id) { if (CH.fakeBonus) return { done: id.charAt(3) === '1' && id.charAt(1) !== '4' };
  try { if (typeof bnState === 'function') return bnState(id) || {}; } catch (e) { } return {}; }
function chWonN(ch) { return chStages(ch).filter(function (i) { return fdWon(MAPS[i].id); }).length; }
function chMaxStars(ch) { return chStages(ch).length * 6; }   // 판마다 별 3 + 어려움 2 + 깃발 1
// 챕터가 열렸는지: 첫 판의 열림 조건을 그대로 씀. 판이 아직 없으면 'soon'
function chOpenInfo(ch) { var S = chStages(ch); if (!S.length) return { ok: false, why: 'soon' }; return fdStageOpen(S[0]); }
function chLockText(ch, so) {
  if (so.why === 'soon') return '다음 업데이트에서 열리는 시대입니다';
  var prev = fdChapter(ch - 1), pn = prev ? prev.name : '앞 세계';
  if (so.why === 'chapter') return pn + '의 별 ' + so.need + '개가 필요합니다 (지금 ' + so.have + '개)';
  return pn + '의 마지막 판을 지켜 내면 열립니다';
}
function chStageNo(M) { return (M.ch || 1) + '-' + (M.no != null ? M.no : fdMi(M.id) + 1); }
// 챕터 색: body[data-ch] (0 = 공통). style_ch.css의 --ch-* 변수가 따라 바뀐다
function chSetTheme(ch) {
  var v = String(ch && typeof tfSkin === 'function' ? tfSkin(ch) : (ch || 0)); if (document.body.getAttribute('data-ch') !== v) document.body.setAttribute('data-ch', v);
  var tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', ['#0e1230', '#ffe3f0', '#150c2a', '#0f1a2c', '#eadcbc'][+v] || '#0e1230');
}
function chArt(ch, w, h) { var k = ch + ':' + w + 'x' + h; if (!CH.art[k]) { try { CH.art[k] = uiChCard(ch, w, h).toDataURL('image/jpeg', 0.86); } catch (e) { CH.art[k] = ''; } } return CH.art[k]; }

// ---------- 처음 한 번: 단추 연결 ----------
function chInit() {
  if (CH.inited) return; CH.inited = 1;
  var bk = $('mBack'); if (bk) { bk.innerHTML = '<img src="' + uiIc2('back', 48) + '" alt="">챕터'; bk.onclick = function () { sfx('ui', 0.5); chGoSelect(); }; }
  var ad = $('mAdm'); if (ad) { ad.setAttribute('data-adm', '1'); ad.setAttribute('aria-label', '관리자'); ad.innerHTML = '<img src="' + icon('gear', 48) + '" alt="">'; }   // 좁은 폰에서 챕터 이름이 잘리지 않게 톱니 그림만
  if (ad) ad.onclick = function () { sfx('ui', 0.5); if (typeof admOpen === 'function') admOpen(); else toast('관리자 창을 열 수 없습니다'); };
  // 버전 글자(관리자 모드 입구, XTRA가 #ver에 연결): 눌러도 타이틀이 넘어가지 않게
  var vr = $('ver'); if (vr) vr.addEventListener('click', function (e) { e.stopPropagation(); });
  // 안드로이드 뒤로 가기: 챕터 지도 → 챕터 고르기 → 타이틀 → 앱 나가기
  var ob = window.__appBack;
  if (typeof ob === 'function' && !ob.chWrap) {
    var nb = function () {
      try {
        if ($('rwLayer')) { chRewardClose(); return 'ok'; }
        if (!UI.modalOpen && UI.scr === 'sMap' && !(typeof metaUI !== 'undefined' && metaUI.ad)) { if (CH.mode === 'map') { chGoSelect(); return 'ok'; } show('sTitle'); chSetTheme(0); return 'ok'; }
      } catch (e) { }
      return ob();
    };
    nb.chWrap = 1; nb.metaWrap = ob.metaWrap; window.__appBack = nb;
  }
}
// 지도 화면 공통(막대, 빨간 점, 음악)
function chBars() {
  chInit();
  $('hud').classList.add('hide'); $('bottom').classList.add('hide'); trayClose();
  var adm = $('mAdm'); if (adm) adm.classList.toggle('hide', !(SAVE.admin && typeof admOpen === 'function'));
  $('starTot').textContent = totalStars() - spentStars();   // 공방에서 쓸 수 있는 별(모은 별은 챕터 카드에)
  $('resDot').classList.toggle('hide', !RESEARCH.some(function (r) { return !SAVE.res[r.id] && r.cost <= totalStars() - spentStars() && (!r.req || SAVE.res[r.req]); }));
  if (typeof MUSIC !== 'undefined' && SAVE.set.music) setTimeout(function () { if (UI.scr !== 'battle') MUSIC.play('menu'); }, 0);   // 타임플렉스: 화면 상태(장 지도/고르기)가 정해진 뒤 곡을 고름
  uiMetaDots();
}
// goMap()이 부르는 입구: 타이틀에서 오면 챕터 고르기, 전투에서 오면 그 판의 챕터 지도, 그 밖에는 보던 화면을 다시 그림
// 챕터 지도로 들어가며 챕터 시작 이야기(STORY['c2in'] 식)를 처음 한 번
function chEnter(ch) {
  chGoMap(ch);
  var key = 'c' + ch + 'in', S0 = chStages(ch);
  if (STORY[key] && !SAVE.story[key] && S0.length) { SAVE.story[key] = 1; saveNow(); playStory(STORY[key], function () { }, S0[0]); }
}
function chGo() {
  var from = UI.scr, ch = G && G.M ? (G.M.ch || 1) : 0;
  stopBattle();
  // 챕터 결말을 결과 창에서 못 보고 나왔으면 지도에 들어가며 보여 줌(ui.js showResult → UI.pendStory)
  if (UI.pendStory && typeof uiPlayPend === 'function') { if (ch) chGoMap(ch); else chGoSelect(); uiPlayPend(); return; }
  if (from === 'title' || from === 'sTitle') return chGoSelect();
  if (ch) return chGoMap(ch);
  if (CH.mode === 'map' && CH.ch) return chGoMap(CH.ch);
  return chGoSelect();
}

// ---------- 챕터 고르기 ----------
function chGoSelect() { if (typeof i18nRefit === 'function') setTimeout(i18nRefit, 0);
  stopBattle(); show('sMap'); chSetTheme(0); chBars();
  CH.mode = 'sel';
  $('mapWrap').classList.add('hide'); $('mBack').classList.add('hide'); $('mTitle').textContent = GAME_TITLE + ': ' + (typeof TF_SUB !== 'undefined' ? TF_SUB : '차원전쟁');
  var box = $('chSel'); box.classList.remove('hide');
  var cur = MAPS.length ? (MAPS[fdCurStage()].ch || 1) : 1, W = Math.min(480, window.innerWidth || 360), h = '';
  CHAPTERS.forEach(function (C) {
    var so = chOpenInfo(C.id), n = chStages(C.id).length, st = fdChStars(C.id), won = chWonN(C.id);
    h += '<button class="chCard c' + C.id + (so.ok ? '' : ' locked') + (so.ok && C.id === cur ? ' cur' : '') + '" data-ch="' + C.id + '"><img class="ccArt" src="' + chArt(C.id, Math.round(W * 2), Math.round(W * 0.66)) + '" alt="">' +
      '<span class="ccT"><i class="ccNo">' + C.id + '장</i><b>' + esc(C.name) + '</b><span>' + esc(C.sub || '') + '</span></span><span class="ccB">' +
      (so.ok ? '<span class="ccChip"><img src="' + icon('star', 32) + '" alt="">' + st + ' / ' + chMaxStars(C.id) + '</span><span class="ccChip"><img src="' + icon('flag', 32) + '" alt="">' + won + ' / ' + n + '판</span>' + (C.id === cur ? '<span class="ccChip go">출전</span>' : '')
        : '<span class="ccChip lk"><img src="' + icon('lock', 32) + '" alt="">' + esc(chLockText(C.id, so)) + '</span>') + '</span></button>';
  });
  box.innerHTML = h + (typeof arSelHtml === 'function' ? arSelHtml() : '');   // v2.2 무한 차원전 입구
  box.querySelectorAll('.chCard:not(.arCard)').forEach(function (b) {
    b.onclick = function () {
      var ch = +b.getAttribute('data-ch'), so = chOpenInfo(ch);
      if (!so.ok) { sfx('warn', 0.4); toast(chLockText(ch, so), 2200); return; }
      sfx('ui', 0.6); chEnter(ch);
    };
  });
  if (typeof arSelBind === 'function') arSelBind(box);
  chMigrateNote();
}
// 옛 저장(최후의 화살)에서 옮겨 온 것을 한 번 알려 줌
function chMigrateNote() {
  if (!SAVE.from || SAVE.fromSeen || UI.modalOpen) return;
  SAVE.fromSeen = 1; saveNow();
  var n = gcOwned().length;
  openModal('<div class="pt">기록을 옮겼습니다</div><p class="mgNote">예전 판 "최후의 화살"의 기록에서 아래 항목을 가져왔습니다. 새 세계가 열려 판 기록과 연구는 처음부터 다시 시작합니다.</p>' +
    '<div class="mgList">보석 <b>' + fmt(SAVE.gems || 0) + '개</b><br>소환권 <b>' + (SAVE.tickets || 0) + '장</b><br>가진 탑 <b>' + n + '종</b>(별 포함)<br>스킨과 설정</div><button class="btn gold" id="mgOk">확인</button>', 'migrate');
  $('mgOk').onclick = function () { sfx('click', 0.4); closeModal(); };
}

// ---------- 챕터 지도 ----------
// 판 n개를 한 줄에 3개씩 아래에서 위로 지그재그로 놓는다. 보너스 칸은 그 판 뒤(줄이 꺾이는 자리면 가장자리, 아니면 두 판 사이 위쪽)
function chLayout(ch, W, Hv, top, bot) {
  var S = chStages(ch), n = S.length, per = 3, rows = Math.max(1, Math.ceil(n / per)), avail = Hv - top - bot;
  var rowH = clamp(avail / rows, 100, 172), H = Math.max(Hv, Math.round(top + bot + rows * rowH)), XS = [0.2, 0.5, 0.8];
  var y0 = H - bot - (H - top - bot - rows * rowH) / 2;   // 줄이 적으면 가운데로
  // 보너스 칸이 붙는 판(그 챕터 안 순서 k)
  var BN = []; chBonus(ch).forEach(function (b) { var k = -1; S.forEach(function (mi, i) { if (MAPS[mi].no === b.after || (MAPS[mi].no == null && i + 1 === b.after)) k = i; }); if (k >= 0) BN.push({ b: b, k: k }); });
  // 줄이 꺾이는 자리에 보너스 칸이 있으면 윗줄을 반대쪽으로 조금 밀어 윗줄 첫 판의 이름표와 겹치지 않게
  var shift = {}; BN.forEach(function (q) { var r = Math.floor(q.k / per); if (q.k % per === per - 1 && q.k + 1 < n) shift[r + 1] = r % 2 ? 1 : -1; });
  var nodes = S.map(function (mi, k) { var r = Math.floor(k / per), c = k % per, ci = r % 2 ? per - 1 - c : c; return { mi: mi, x: (XS[ci] + (shift[r] || 0) * 0.055) * W, y: y0 - rowH * (r + 0.5) + 6, row: r }; });
  var bonus = BN.map(function (q) {
    var a = nodes[q.k], nx = nodes[q.k + 1], p;
    if (nx && nx.row !== a.row) p = { x: a.x > W / 2 ? W - 26 : 26, y: (a.y + nx.y) / 2 + 2 };
    else if (nx) p = { x: (a.x + nx.x) / 2, y: a.y - rowH * 0.36 };
    else p = { x: clamp(a.x + (a.x > W / 2 ? -1 : 1) * W * 0.3, 34, W - 34), y: a.y - 4 };
    return { b: q.b, x: p.x, y: p.y, after: S[q.k] };
  });
  return { nodes: nodes, bonus: bonus, H: H, rowH: rowH };
}
function chGoMap(ch) { if (typeof i18nRefit === 'function') setTimeout(i18nRefit, 0);
  var C = fdChapter(ch); if (!C || !chStages(ch).length) return chGoSelect();
  if (typeof tfGrantEra === 'function') tfGrantEra(ch);   // 타임플렉스: 장에 들어가면 그 시대 탑을 받음
  stopBattle(); show('sMap'); chSetTheme(ch); chBars();
  CH.mode = 'map'; CH.ch = ch;
  $('chSel').classList.add('hide'); $('mBack').classList.remove('hide'); $('mTitle').textContent = C.name;
  var wrap = $('mapWrap'); wrap.classList.remove('hide');
  var W = wrap.clientWidth, Hv = wrap.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  var top = Math.round(($('sMap').querySelector('.mtop').getBoundingClientRect().height || 56) - 6), bot = Math.round(($('sMap').querySelector('.mbot').getBoundingClientRect().height || 84) - 8);
  var L = chLayout(ch, W, Hv, top, bot), c = $('mapCv'), key = [ch, W, L.H, L.nodes.length, L.bonus.length].join(':');
  if (CH.key !== key || !UI.mapDrawn) {
    c.width = Math.round(W * dpr); c.height = Math.round(L.H * dpr); c.style.width = W + 'px'; c.style.height = L.H + 'px';
    try { uiChMap(c, ch, L.nodes.map(function (p) { return [p.x, p.y]; }), dpr); } catch (e) { console.error(e); }
    CH.key = key; UI.mapDrawn = 1; UI.mapW = W; UI.mapH = L.H; UI.mapN = MAPS.length;
  }
  var nodes = $('nodes'); nodes.style.height = L.H + 'px'; nodes.innerHTML = '';
  var cur = fdCurStage(), curNode = null;
  L.nodes.forEach(function (p) {
    var i = p.mi, M = MAPS[i], so = fdStageOpen(i), open = so.ok, r = SAVE.rec[M.id] || {}, st = Math.max(r.easy ? 1 : 0, r.normal || 0, r.hard || 0), won = fdWon(M.id);
    var b = document.createElement('button'); b.className = 'node' + (open ? '' : ' locked') + (i === cur ? ' cur' : '') + (M.boss ? ' boss' : '');
    b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; b.setAttribute('data-mi', i);
    var rw = M.reward && M.reward.tower && TOWERS[M.reward.tower] && !won ? '<i class="nrw"><img src="' + loIcon(M.reward.tower, 1, 0, 48) + '" alt=""></i>' : '';
    var gate = !open && so.why === 'gate' ? '<i class="ngate"><img src="' + icon('star', 32) + '" alt="">' + so.need + '</i>' : '';
    b.innerHTML = '<span class="nb">' + (open ? (M.no != null ? M.no : i + 1) : '<img src="' + icon('lock') + '">') + gate + rw + '</span>' + (open ? '<span class="ns">' + [0, 1, 2].map(function (k) { return '<img src="' + icon(k < st ? 'star' : 'starOff') + '">'; }).join('') + '</span>' : '') +
      '<span class="nn"><span>' + esc(M.name) + '</span>' + (r.hard ? '<img class="mini" src="' + icon('crown') + '">' : '') + (r.flag ? '<img class="mini" src="' + icon('flag') + '">' : '') + '</span>';
    b.onclick = function () {
      sfx('ui', 0.5);
      if (!open) { toast(so.why === 'gate' ? '이 세계의 별 ' + so.need + '개가 필요합니다 (지금 ' + so.have + '개). 어려움 승리와 깃발로 더 모으세요' : so.why === 'chapter' ? chLockText(ch, so) : '앞 판을 먼저 지켜 내야 합니다', 2400); return; }
      openStage(i);
    };
    nodes.appendChild(b); if (i === cur) curNode = p;
  });
  L.bonus.forEach(function (q) {
    var open = !!SAVE.admin || fdWon(MAPS[q.after].id), stt = chBonusState(q.b.id);
    var b = document.createElement('button'); b.className = 'bnode ' + (open ? 'open' : 'locked') + (stt.done ? ' done' : ''); b.style.left = q.x + 'px'; b.style.top = q.y + 'px'; b.setAttribute('data-bn', q.b.id);
    b.innerHTML = '<img src="' + uiIc2('bonus', 64) + '" alt="">';
    b.onclick = function () { if (!open) { sfx('warn', 0.4); toast('앞 판을 이기면 열리는 보너스 게임입니다'); return; } sfx('ui', 0.6); if (CH.fakeBonus) { toast('보너스 게임 자리(시험)'); return; } try { bnOpen(q.b); } catch (e) { console.error(e); toast('보너스 게임을 열 수 없습니다'); } };
    nodes.appendChild(b);
  });
  wrap.scrollTop = curNode && L.H > Hv ? clamp(curNode.y - Hv * 0.55, 0, L.H - Hv) : L.H - Hv;
  chWarm();
}
// 판 창을 처음 열 때 멈칫하지 않게, 지도에 머무는 동안 편성 칸에 쓸 탑 그림을 하나씩 미리 구워 둠
function chWarm() {
  if (CH.warm) return; CH.warm = 1;
  var q = loUsable().slice(0, 16);
  (function step() { var k = q.shift(); if (!k) return; if (UI.scr === 'sMap' && !UI.modalOpen) { try { loIcon(k, 1, 0, 64); } catch (e) { } } else q.unshift(k); setTimeout(step, q.length && UI.scr === 'sMap' && !UI.modalOpen ? 60 : 400); })();
}

// ---------- 판 창 ----------
// 번호와 이름 → 지도 미리보기(남는 높이만큼) → 설명 → 도전 규칙 → 나오는 적 → 필요한 탑, 확정 보상 → 출전 편성 8칸 → 난이도 → 출전
function chRewardHtml(M) {
  var R = M.reward, got = fdWon(M.id); if (!R) return '';
  var in0 = R.tower && TOWERS[R.tower] ? '<img src="' + loIcon(R.tower, 1, 0, 64) + '" alt=""><b>' + esc(TOWERS[R.tower].short || TOWERS[R.tower].name) + '</b>' : R.tickets ? '<img src="' + gcIcon('ticket', 64) + '" alt=""><b>소환권 ' + R.tickets + '</b>' : R.gems ? '<img src="' + uiIcon('gem', 64) + '" alt=""><b>보석 ' + R.gems + '</b>' : '';
  return in0 ? '<span class="stRw' + (got ? ' got' : '') + '"><span class="sub">보상</span>' + in0 + '</span>' : '';
}
function chNeedHtml(mi, lo) {
  var need = gcNeed(mi); if (!need.length) return '';
  return '<div class="needRow"><span class="sub">필요한 탑</span>' + need.map(function (k) { var o = gcOwns(k); return '<span class="nd' + (o ? (lo.indexOf(k) < 0 ? ' out' : '') : ' off') + '"><img src="' + loIcon(k, 1, 0, 48) + '" alt=""></span>'; }).join('') + '</div>';
}
function chDomBadge(k) { var E = ENEMIES[k], d = E ? fdDom(E) : 'g'; return d === 'a' ? '<i class="edm"><img src="' + uiIc2('air', 32) + '" alt=""></i>' : d === 's' ? '<i class="edm"><img src="' + uiIc2('sea', 32) + '" alt=""></i>' : ''; }
function chEnemyIcon(k, px) { try { return enemyIcon(k, px); } catch (e) { return icon('skull', px); } }
function chOpenStage(mi, dkSel) {
  var M = MAPS[mi]; if (!M) return;
  if (UI.scr !== 'battle' && (CH.mode !== 'map' || CH.ch !== (M.ch || 1))) chGoMap(M.ch || 1);
  var r = rec(M.id), dk = dkSel || (UI.lastDk && diffOpen(mi, UI.lastDk) ? UI.lastDk : 'normal');
  var news = Object.keys(M.intro || {}), pool = (M.pool || []).concat(M.boss ? [M.boss] : []).filter(function (k, i, a) { return ENEMIES[k] && a.indexOf(k) === i; });
  var mid = SAVE.mid && SAVE.mid.mi === mi ? SAVE.mid : null, lo = typeof tfLoadout === 'function' ? tfLoadout(mi) : loGet(mi), need = gcNeed(mi);
  var missOwn = need.filter(function (k) { return gcOwns(k) && lo.indexOf(k) < 0; }), missNo = need.filter(function (k) { return !gcOwns(k); });
  var h = '<div class="mh"><span class="mnum">' + chStageNo(M) + '</span><div class="mhT"><div class="mt">' + esc(M.name) + '</div><div class="ms">' + esc(M.region || '') + (M.boss ? ', 우두머리 출현' : '') + '</div></div></div>' +
    '<div class="prevBox"><canvas id="prevCv" class="prev"></canvas></div>' +
    (M.desc ? '<p class="mdesc">' + esc(M.desc) + '</p>' : '') +
    (M.rule || M.ruleName ? '<div class="stRule"><img src="' + uiIc2('rule', 64) + '" alt=""><div><b>도전: ' + esc(M.ruleName || '특수 규칙') + '</b><span>' + esc(M.ruleDesc || '') + '</span></div></div>' : '') +
    '<div class="enRow' + (pool.length > 7 ? ' many' : '') + '"><span class="sub">나오는 적</span>' + pool.map(function (k) { return '<span class="en' + (news.indexOf(k) >= 0 ? ' new' : '') + (ENEMIES[k].boss ? ' bs' : '') + '"><img src="' + chEnemyIcon(k, 48) + '" alt="">' + chDomBadge(k) + '</span>'; }).join('') + '</div>' +
    (need.length || M.reward ? '<div class="stNR">' + chNeedHtml(mi, lo) + chRewardHtml(M) + '</div>' : '') +
    (missNo.length ? '<div class="stWarn">없는 탑은 첫 승리 보상이나 소환으로 얻습니다</div>' : missOwn.length ? '<div class="stWarn">필요한 탑이 편성에서 빠져 있습니다</div>' : '') +
    '<button class="stLo" id="stLo"><span class="loL">출전<i>' + lo.length + ' / ' + LO_MAX + '</i></span><span class="loRow">' + loSlotsHtml(lo) + '</span><span class="loGo">편성</span></button>' + (typeof sk2RowHtml === 'function' ? sk2RowHtml() : '') + (typeof tfModeHtml === 'function' ? tfModeHtml(mi) : '') +
    '<div class="tabs">' + DIFF_ORDER.map(function (k) { var op = diffOpen(mi, k); var rv = k === 'endless' ? (r.endless ? r.endless + '웨이브' : '') : r[k] ? '★'.repeat(Math.min(3, r[k])) : ''; return '<button class="tab' + (k === dk ? ' on' : '') + (op ? '' : ' off') + '" data-dk="' + k + '">' + DIFFS[k].name + '<i>' + (op ? rv : '보통 승리 후') + '</i></button>'; }).join('') + '</div>' +
    '<div class="dinfo" id="dInfo">' + diffInfo(mi, dk) + '</div>' +
    '<div class="recs"><span><img src="' + icon(r.hard ? 'crown' : 'crownOff') + '" alt="">어려움 승리 별 +2</span><span><img src="' + icon(r.flag ? 'flag' : 'flagOff') + '" alt="">장애물 전부 제거 별 +1</span></div>' +
    '<div class="mbtns">' + (mid ? '<button class="btn" id="bResume">이어하기 (웨이브 ' + mid.wave + ')</button>' : '') + '<button class="btn gold" id="bGo">출전</button></div>' +
    '<button class="xbtn" id="bClose">닫기</button>';
  openModal(h, 'stage'); UI.stageMi = mi;
  // 미리보기는 창이 다 뜬 뒤에 그림(그리는 동안 화면이 잠깐 멈추므로 창 뜨는 연출과 겹치지 않게)
  var pc = $('prevCv'); setTimeout(function () { if ($('prevCv') === pc) { try { drawPreview(pc, mi); } catch (e) { } } }, 280);
  $('modal').querySelectorAll('.tab').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-dk'); if (!diffOpen(mi, k)) { toast('보통 난이도를 먼저 이겨야 열립니다'); return; }
      sfx('click', 0.4); dk = k;
      $('modal').querySelectorAll('.tab').forEach(function (o) { o.classList.toggle('on', o === b); });
      $('dInfo').textContent = diffInfo(mi, dk);
    };
  });
  $('stLo').onclick = function () { sfx('ui', 0.5); loOpen(mi, function () { chOpenStage(mi, dk); }); };
  if (typeof tfModeBind === 'function') tfModeBind(mi, function () { chOpenStage(mi, dk); });
  if (typeof sk2RowBind === 'function') sk2RowBind(function () { chOpenStage(mi, dk); });
  $('bGo').onclick = function () {
    if (!loGet(mi).length) { toast('출전할 탑을 하나 이상 골라 주세요'); return; }
    UI.lastDk = dk; closeModal(); sfx('ui', 0.6); beginStage(mi, dk, false);
  };
  if (mid) $('bResume').onclick = function () { closeModal(); beginStage(mid.mi, mid.dk, true); };
  $('bClose').onclick = function () { closeModal(); };
}

// ---------- 확정 보상 획득 연출 (결과 창 위에 겹쳐 뜸). rw = gacha.js gcStageReward의 결과 ----------
function chRewardShow(rw) {
  if (!rw || rw.kind !== 'tower' || !TOWERS[rw.k] || $('rwLayer')) return;
  var T = TOWERS[rw.k], d = document.createElement('div'); d.id = 'rwLayer';
  d.innerHTML = '<div class="rwCard"><span class="rwTag">' + (rw.isNew ? '새 탑 획득' : rw.gem ? '보석으로 바꿈' : '탑 별 +1') + '</span><div class="rwPic"><img src="' + loIcon(rw.k, 3, 0, 160) + '" alt=""></div>' +
    '<div class="rwNm">' + esc(T.name) + '</div><p>' + (rw.isNew ? esc(T.desc || '') + ' 판 창의 편성에서 출전 탑으로 넣을 수 있습니다.' : rw.gem ? '이미 별 5개인 탑이라 보석 ' + rw.gem + '개를 받았습니다.' : '이미 가진 탑이라 별이 ' + rw.s1 + '개가 되었습니다. 별마다 피해 +' + GC_STAR_DMG + '%') + '</p><button class="btn gold" id="rwOk">확인</button></div>';
  $('app').appendChild(d);
  try { sfx('powerup', 0.6); vib(30); } catch (e) { }
  $('rwOk').onclick = function (e) { e.stopPropagation(); sfx('click', 0.4); chRewardClose(); };
}
function chRewardClose() { var d = $('rwLayer'); if (d && d.parentNode) d.parentNode.removeChild(d); }

// ---------- 도감: 탑(변신 나무는 탑 상세), 적(챕터별), 합체 ----------
function chEnemyCh(k) { var E = ENEMIES[k]; return (E && E.ch) || 1; }
function chEnemyList(ch) {
  var L = ENEMY_ORDER.filter(function (k) { return ENEMIES[k] && ENEMIES[k].tf && chEnemyCh(k) === ch; });   // 타임플렉스: 시대 적(tf)만
  for (var k in ENEMIES) if (ENEMIES[k].tf && ENEMIES[k].ch === ch && L.indexOf(k) < 0 && !ENEMIES[k].hidden && k.indexOf('fd') !== 0) L.push(k);
  return L;
}
function chFusions() { try { return typeof FUSIONS !== 'undefined' && Array.isArray(FUSIONS) ? FUSIONS.filter(function (f) { return f && TOWERS[f.to] && TOWERS[f.a] && TOWERS[f.b]; }) : []; } catch (e) { return []; } }
function chFused(k) { return !!(SAVE.fused && SAVE.fused[k]); }
function chCodex(tab, sel, byTab, ech) {
  tab = tab || 'tower';
  var anyGem = metaCodexAny(), FZ = chFusions();
  if (!byTab && !sel && tab === 'tower' && anyGem) tab = 'enemy';
  if (tab === 'enemy' && !sel) ENEMY_ORDER.some(function (k) { if (metaCodexCan(k) && SAVE.seen[k]) { sel = k; return true; } return false; });
  if (tab === 'enemy') { ech = ech || (sel && chEnemyCh(sel)) || CH.codexCh || (CH.mode === 'map' && CH.ch) || 1; CH.codexCh = ech; }
  var h = '<div class="pt">도감</div><div class="tabs ' + (FZ.length ? 'three' : 'two') + '"><button class="tab' + (tab === 'tower' ? ' on' : '') + '" data-t="tower">탑</button><button class="tab' + (tab === 'enemy' ? ' on' : '') + '" data-t="enemy">적' + (anyGem && tab !== 'enemy' ? '<i class="dot"></i>' : '') + '</button>' + (FZ.length ? '<button class="tab' + (tab === 'fuse' ? ' on' : '') + '" data-t="fuse">합체</button>' : '') + '</div>';
  if (tab === 'tower') {
    h += '<div class="cgrid tw6">' + loAll(true).map(function (k) { var op = gcOwns(k) || (TOWERS[k].admin && SAVE.admin), st = gcStar(k); return '<button class="ci' + (op ? '' : ' off') + '" data-k="' + k + '"><img src="' + loIcon(k, 3, 0, 72) + '">' + (op ? '' : '<img class="clk" src="' + icon('lock', 32) + '" alt="">') + '<span>' + TOWERS[k].short + '</span>' + (st ? '<i class="cst">' + st + '</i>' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="cdet"><p class="hint">탑을 누르면 변신 나무(1 → 6단계, 갈래 A와 B, 궁극)와 합체 조합이 보입니다. 가진 탑 ' + gcOwned().length + ' / ' + loAll().length + '종</p></div>';
  } else if (tab === 'enemy') {
    var chs = CHAPTERS.filter(function (C) { return chEnemyList(C.id).length; });
    if (chs.length > 1) h += '<div class="chTabs">' + chs.map(function (C) { return '<button class="' + (C.id === ech ? 'on' : '') + '" data-ech="' + C.id + '">' + C.id + '장' + (C.id === ech ? ' ' + esc(C.name) : '') + '</button>'; }).join('') + '</div>';
    h += '<div class="cgrid">' + chEnemyList(ech).map(function (k) { var op = !!SAVE.seen[k]; return '<button class="ci' + (sel === k ? ' sel' : '') + (op ? '' : ' off') + '" data-k="' + k + '">' + (op ? '<img src="' + chEnemyIcon(k, 64) + '">' : '<img src="' + icon('lock') + '">') + '<span>' + (op ? ENEMIES[k].name.replace(/^.* /, '') : '?') + '</span>' + (op && metaCodexCan(k) ? '<i class="cgem"><img src="' + uiIcon('gem', 32) + '" alt="">+' + metaCodexGem + '</i>' : '') + '</button>'; }).join('') + '</div><div class="cdet">';
    if (sel && SAVE.seen[sel] && ENEMIES[sel]) {
      var E = ENEMIES[sel], dm = fdDom(E);
      if (metaCodexCan(sel)) h += '<button class="btn reward sm" id="cGem"><span class="rl"><img src="' + uiIcon('gem', 48) + '" alt="">보석 +' + metaCodexGem + ' 받기</span></button>';
      h += '<b>' + esc(E.name) + '</b> <span class="tdDom"><img src="' + uiIc2(dm === 'a' ? 'air' : dm === 's' ? 'sea' : 'ground', 32) + '" alt=""><em style="background:var(--ch-line)">' + (dm === 'a' ? '하늘' : dm === 's' ? '바다' : '땅') + '</em></span><p>' + esc(E.desc || '') + '</p><p class="hint">체력 ' + Math.round(E.hp * HPK) + (E.armor ? ', 갑옷 ' + Math.round(E.armor * 100) + '%' : '') + (E.mres ? ', 마법 ' + (E.mres > 0 ? '저항 ' : '약점 ') + Math.round(Math.abs(E.mres) * 100) + '%' : '') + ', 속도 ' + E.spd + ', 생명 피해 ' + E.leak + '</p>' + uiWeakHtml(sel);
      if (SAVE.codexGot[sel]) h += '<span class="cgot"><img src="' + uiIcon('gem', 32) + '" alt="">도감 보석 받음</span>';
      else if (!metaCodexCan(sel)) h += '<p class="hint">처음 처치하면 보석 +' + metaCodexGem + '를 받습니다</p>';
    } else h += '<p class="hint">만난 적을 누르면 자세히 보입니다. 아직 못 만난 적은 자물쇠로 보입니다</p>';
    h += '</div>';
  } else {
    var nd = FZ.filter(function (f) { return chFused(f.to); }).length;
    h += '<div class="fzList">' + FZ.map(function (f) {
      var done = chFused(f.to), T = TOWERS[f.to];
      return '<div class="fzI' + (done ? ' done' : '') + '"><img src="' + loIcon(f.a, 5, 0, 64) + '" alt=""><u>+</u><img src="' + loIcon(f.b, 5, 0, 64) + '" alt=""><u>=</u>' + (done ? '<img src="' + loIcon(f.to, 1, 0, 64) + '" alt="">' : '<i class="fzQ">?</i>') +
        '<div class="fzT"><b>' + (done ? esc(T.name) : '???') + '</b><span>' + esc(TOWERS[f.a].short) + ' + ' + esc(TOWERS[f.b].short) + (done ? '' : ', 둘 다 5단계 이상') + '</span></div></div>';
    }).join('') + '</div><p class="fzNote">' + (fdUnlocked('fuse') ? '5단계 이상인 두 탑을 이웃한 칸에 세우면 합체할 수 있습니다. 만든 합체 ' + nd + ' / ' + FZ.length : '합체는 ' + chUnlockName('fuse') + ' 판을 이기면 열립니다') + '</p>';
  }
  h += '<button class="xbtn" id="cClose">닫기</button>';
  openModal(h, 'codex');
  var Mo = $('modal');
  Mo.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { sfx('click', 0.3); chCodex(b.getAttribute('data-t'), null, true); }; });
  Mo.querySelectorAll('.chTabs button').forEach(function (b) { b.onclick = function () { sfx('click', 0.3); chCodex('enemy', null, true, +b.getAttribute('data-ech')); }; });
  Mo.querySelectorAll('.ci').forEach(function (b) { b.onclick = function () { sfx('click', 0.3); var k = b.getAttribute('data-k'); if (tab === 'tower') loDetail(k, function () { chCodex('tower', null, true); }); else chCodex(tab, k, true, ech); }; });
  var cg = $('cGem');
  if (cg) cg.onclick = function () { var rr = cg.getBoundingClientRect(); if (metaCodexClaim(sel)) { sfx('upgrade', 0.5); chCodex('enemy', sel, true, ech); uiGemBurst(rr, metaCodexGem); } };
  var se = Mo.querySelector('.ci.sel'), gr = se && se.parentNode;
  if (gr && (se.offsetTop + se.offsetHeight > gr.scrollTop + gr.clientHeight || se.offsetTop < gr.scrollTop)) gr.scrollTop = Math.max(0, se.offsetTop - 8);
  $('cClose').onclick = function () { closeModal(); uiMetaDots(); };
}
// 잠금 기준 판 이름 ('1-3' 식)
function chUnlockName(key) { var id = UNLOCKS[key], mi = fdMi(id); return mi >= 0 ? chStageNo(MAPS[mi]) : ''; }

// ---------- 시험용 (tools/uia*.py, fitcheck.py) ----------
window.__ch = {
  sel: function () { chGoSelect(); }, map: function (ch) { chGoMap(ch || 1); }, stage: function (mi) { chOpenStage(mi); }, codex: function (t, k, e) { chCodex(t, k, true, e); },
  st: function () { return { mode: CH.mode, ch: CH.ch, theme: document.body.getAttribute('data-ch'), scr: UI.scr }; },
  reward: function (k, isNew) { chRewardShow({ kind: 'tower', k: k || 'frost', isNew: isNew !== false, s0: 0, s1: 1, gem: 0 }); }, rewardClose: chRewardClose,
  icon: function (px) { return uiAppIcon(px || 512).toDataURL('image/png'); }, card: function (ch, w, h) { return uiChCard(ch, w || 720, h || 240).toDataURL('image/png'); },
  layout: function (ch) { var w = $('mapWrap'); return chLayout(ch || CH.ch || 1, w.clientWidth, w.clientHeight, 50, 76); },
  // 시험 전용: 판을 챕터마다 n개로 늘려 2~4장 화면을 봄(앞 판을 복제). 합치지 않는 시험에서만 쓴다
  fake: function (n) {
    n = n || 12; var base = MAPS.slice(), RULES_T = [null, ['안개 낀 밤', '탑 사거리가 15% 줄어듭니다'], ['총공세', '웨이브 간격이 짧습니다'], null, ['정예 부대', '적은 수의 강한 적이 옵니다']], RW = [null, { tower: 'frost' }, { tickets: 2 }, { tower: 'warship' }, { gems: 30 }, { tower: 'sam' }];
    var NM = { 1: ['국경 초소', '풀잎 고개', '버섯 마을', '젤리 다리'], 2: ['묘지 입구', '호박밭', '폐저택 정원', '성 지하'], 3: ['도심 교차로', '사막 기지', '강철 항구', '제3 활주로'], 4: ['기와 마을', '대나무 숲', '궁궐 마당', '바닷가 포구'] };
    MAPS.length = 0;
    for (var ch = 1; ch <= 4; ch++) for (var i = 0; i < n; i++) { var o = base[i % base.length], c = {}; for (var k in o) c[k] = o[k]; c.id = 'c' + ch + 's' + (i + 1 < 10 ? '0' : '') + (i + 1); c.ch = ch; c.no = i + 1; c.name = NM[ch][i % 4] + (i >= 4 ? ' ' + (Math.floor(i / 4) + 1) : ''); c.region = fdChapter(ch).name; c.boss = (i + 1) % 4 === 0 ? (o.boss || 'grumsh') : null;
      var rl = RULES_T[i % RULES_T.length]; c.rule = rl ? { id: 'fog' } : null; c.ruleName = rl ? rl[0] : ''; c.ruleDesc = rl ? rl[1] : ''; c.reward = RW[i % RW.length]; c.need = i % 3 === 1 ? ['archer', 'flak'] : i % 3 === 2 ? ['frost'] : []; MAPS.push(c); }
    var real = false; try { real = typeof BONUS_NODES !== 'undefined' && typeof bnOpen === 'function'; } catch (e) { }
    if (!real) { CH.fakeBonus = []; for (ch = 1; ch <= 4; ch++) [3, 6, 9].forEach(function (a, j) { CH.fakeBonus.push({ id: 'c' + ch + 'b' + (j + 1), ch: ch, after: a, game: ['gallery', 'memory', 'catch'][j] }); }); }
    UI.mapDrawn = 0; return MAPS.length;
  }
};
