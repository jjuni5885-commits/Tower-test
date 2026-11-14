// ===== loadout.js : 출전 편성(가진 탑 가운데 8종), 탑 상세(변신 나무, 영역, 합체) =====
// 저장: SAVE.lo = { 판 id: [탑 키...], _last: [마지막으로 쓴 편성] }. 전투에는 ui.js towersFor(mi) → loGet(mi) → newGame opts.towers
var LO_MAX = 8;
var LO = { mi: -1, list: [], cur: null, back: null };

// 모을 수 있는 탑 전체(일반 24종). withAdmin이면 관리자 모드에서 켠 전용 탑도. 합체 탑은 빼고, 자료 순서(TOWER_ORDER, TW2_ORDER)를 따름
function loAll(withAdmin) {
  var out = [], seen = {};
  function add(k) { var T = TOWERS[k]; if (!T || seen[k] || T.fusion) return; if (T.admin && !(withAdmin && SAVE.admin)) return; seen[k] = 1; out.push(k); }
  TOWER_ORDER.forEach(add);
  try { if (typeof TW2_ORDER !== 'undefined') TW2_ORDER.forEach(add); } catch (e) { }
  if (withAdmin && SAVE.admin) { try { if (typeof TW2_ADMIN !== 'undefined') TW2_ADMIN.forEach(add); } catch (e) { } for (var k in TOWERS) if (TOWERS[k].admin) add(k); }
  return out;
}
// 출전시킬 수 있는 탑: 가진 탑 + (관리자 모드) 전용 탑
function loUsable(mi) { var own = loAll(true).filter(function (k) { return gcOwns(k) || (TOWERS[k].admin && SAVE.admin); }); if (mi == null) mi = LO.mi; if (typeof tfLoFilter === 'function' && mi != null && mi >= 0) own = tfLoFilter(own, mi); return own; }   // 타임플렉스: 시대 고증이면 그 판 시대까지의 탑만
// 탑 그림(주소). 그림이 아직 없으면 ui_art.js towerIconURL이 탑 색 네모로 대신 그림
function loIcon(k, L, B, px) { return towerIconURL(k, L || 1, B || 0, px || 64); }
// 등급: c 일반, r 희귀, l 전설, a 관리자 전용, f 합체
function loTier(k) { var T = TOWERS[k] || {}; if (T.admin) return { id: 'a', name: '관리자 전용' }; if (T.fusion) return { id: 'f', name: '합체' }; var t = gcTierOf(k); return { id: t.id, name: t.name }; }
// 추천 편성: 필요한 탑 → 지난 편성 → 가진 순서. 물 칸이 있는 판은 수상 탑을, 하늘 적이 나오는 판은 대공 탑을 하나는 넣음
function loAuto(mi) {
  var own = loUsable(mi), M = MAPS[mi] || {}, out = [];
  function add(k) { if (out.length < LO_MAX && own.indexOf(k) >= 0 && out.indexOf(k) < 0) out.push(k); }
  gcNeed(mi).forEach(add);
  var water = (M.grid || []).some(function (r) { return r.indexOf('~') >= 0; }), pool = (M.pool || []).concat(M.boss ? [M.boss] : []);
  var air = pool.some(function (k) { return ENEMIES[k] && fdDom(ENEMIES[k]) === 'a'; });
  if (water) own.filter(function (k) { return fdSite(k) === 'water'; }).slice(0, 2).forEach(add);
  if (air && !out.some(function (k) { return fdHit(k).indexOf('a') >= 0; })) own.filter(function (k) { return fdHit(k) === 'a'; }).slice(0, 1).forEach(add);
  var last = SAVE.lo && Array.isArray(SAVE.lo._last) ? SAVE.lo._last : [];
  last.forEach(function (k) { if (water || fdSite(k) !== 'water') add(k); });
  own.forEach(function (k) { if (water || fdSite(k) !== 'water') add(k); });   // 물 칸이 없는 판에는 수상 탑을 넣지 않음
  return out;
}
// 그 판의 편성(판마다 마지막 편성을 기억). 저장된 것이 없거나 비면 추천 편성
function loGet(mi) {
  var M = MAPS[mi], own = loUsable(mi), L = M && SAVE.lo && Array.isArray(SAVE.lo[M.id]) ? SAVE.lo[M.id] : null;
  if (L) { L = L.filter(function (k, i) { return own.indexOf(k) >= 0 && L.indexOf(k) === i; }).slice(0, LO_MAX); if (L.length) return L; }
  return loAuto(mi);
}
function loSet(mi, list) {
  var M = MAPS[mi]; if (!M) return;
  if (!SAVE.lo || typeof SAVE.lo !== 'object') SAVE.lo = {};
  SAVE.lo[M.id] = list.slice(0, LO_MAX); SAVE.lo._last = list.slice(0, LO_MAX); saveNow();
}
function loSlotsHtml(list) {
  var h = ''; for (var i = 0; i < LO_MAX; i++) { var k = list[i]; h += k ? '<span class="loS' + (fdSite(k) === 'water' ? ' wt' : '') + '" data-k="' + k + '"><img src="' + loIcon(k, 1, 0, 64) + '" alt=""></span>' : '<span class="loS em"></span>'; }
  return h;
}
// 맞힐 수 있는 영역(땅, 하늘, 바다) 아이콘 줄 + 물 칸 전용 표시
function loDomHtml(k) {
  var T = TOWERS[k], hit = fdHit(k), sup = T.kind === 'aura' || T.kind === 'mint';
  return '<span class="tdDom">' + [['g', 'ground'], ['a', 'air'], ['s', 'sea']].map(function (d) { return '<img class="' + (sup || hit.indexOf(d[0]) >= 0 ? '' : 'no') + '" src="' + uiIc2(d[1], 48) + '" alt="">'; }).join('') + (fdSite(k) === 'water' ? '<em>물 칸 전용</em>' : '') + '</span>';
}
function loDomText(k) { var T = TOWERS[k], hit = fdHit(k); if (T.kind === 'aura' || T.kind === 'mint') return '지원 탑'; var a = []; if (hit.indexOf('g') >= 0) a.push('땅'); if (hit.indexOf('a') >= 0) a.push('하늘'); if (hit.indexOf('s') >= 0) a.push('바다'); return a.join(', ') + ' 공격'; }

// ---------- 편성 창 ----------
function loOpen(mi, back) {
  if (mi != null && mi !== LO.mi) { LO.mi = mi; LO.list = loGet(mi).slice(); LO.cur = null; }
  if (back !== undefined) LO.back = back || null;
  var all = loAll(true), need = gcNeed(LO.mi), cur = LO.cur && TOWERS[LO.cur] ? LO.cur : null, M = MAPS[LO.mi];
  var h = '<div class="pt">출전 편성</div><div class="loSub">' + (M ? esc(chStageNo(M) + ' ' + M.name) + ', ' : '') + '가진 탑 가운데 <b>' + LO_MAX + '종</b>까지 골라 나갑니다</div>' +
    '<div class="loRow big" id="loSlots">' + loSlotsHtml(LO.list) + '</div><div class="loGrid">';
  all.forEach(function (k) {
    var T = TOWERS[k], own = gcOwns(k) || (T.admin && SAVE.admin), inn = LO.list.indexOf(k) >= 0, st = gcStar(k);
    h += '<button class="loT t-' + loTier(k).id + (own ? '' : ' off') + (inn ? ' in' : '') + (cur === k ? ' cur' : '') + '" data-k="' + k + '"><img class="loI" src="' + loIcon(k, 3, 0, 72) + '" alt="">' + (own ? '' : '<img class="loLk" src="' + icon('lock', 32) + '" alt="">') +
      '<span>' + esc(T.short || T.name) + '</span>' + (need.indexOf(k) >= 0 ? '<i class="loNd">필요</i>' : '') + (st ? '<i class="loSt">' + st + '</i>' : '') + (fdSite(k) === 'water' ? '<img class="loW" src="' + uiIc2('water', 32) + '" alt="">' : '') + '</button>';
  });
  h += '</div><div class="loInfo">';
  if (cur) { var T = TOWERS[cur]; h += '<img src="' + loIcon(cur, 3, 0, 72) + '" alt=""><div class="loIT"><b>' + esc(T.name) + '</b>' + loDomHtml(cur) + '<p>' + esc(T.desc || '') + '</p></div><button class="btn sm" id="loDet">상세</button>'; }
  else h += '<div class="loIT"><p>탑을 누르면 편성에 넣거나 뺍니다. 물 칸이 있는 판은 수상 탑, 하늘 적이 오는 판은 대공 탑을 챙기세요.</p></div>';
  h += '</div><div class="mbtns"><button class="btn" id="loAutoB">추천 편성</button><button class="btn gold" id="loOk">확인 (' + LO.list.length + ' / ' + LO_MAX + ')</button></div>';
  var sc = $('modal').querySelector('.loGrid'), st0 = UI.modalKind === 'lo' && sc ? sc.scrollTop : 0;
  openModal(h, 'lo');
  var Mo = $('modal'); if (st0) Mo.querySelector('.loGrid').scrollTop = st0;
  Mo.querySelectorAll('.loT').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-k'), T = TOWERS[k], own = gcOwns(k) || (T.admin && SAVE.admin), i = LO.list.indexOf(k);
      LO.cur = k;
      if (!own) { sfx('click', 0.3); toast(T.name + ': 아직 없는 탑입니다. 판 첫 승리 보상이나 소환으로 얻습니다', 2000); }
      else if (i >= 0) { LO.list.splice(i, 1); sfx('click', 0.35); }
      else if (LO.list.length >= LO_MAX) { sfx('warn', 0.4); toast(LO_MAX + '종이 모두 찼습니다. 위 칸의 탑을 눌러 먼저 빼 주세요', 2000); }
      else { LO.list.push(k); sfx('click', 0.5); }
      loOpen();
    };
  });
  Mo.querySelectorAll('#loSlots .loS[data-k]').forEach(function (s) { s.onclick = function () { var i = LO.list.indexOf(s.getAttribute('data-k')); if (i >= 0) { LO.list.splice(i, 1); sfx('click', 0.35); loOpen(); } }; });
  if ($('loDet')) $('loDet').onclick = function () { sfx('click', 0.4); loDetail(cur, function () { loOpen(); }); };
  $('loAutoB').onclick = function () { sfx('click', 0.4); var M0 = MAPS[LO.mi], sv = SAVE.lo && M0 ? SAVE.lo[M0.id] : null; if (sv) delete SAVE.lo[M0.id]; LO.list = loAuto(LO.mi); if (sv) SAVE.lo[M0.id] = sv; loOpen(); toast('이 판에 맞는 탑으로 채웠습니다'); };
  $('loOk').onclick = function () {
    if (!LO.list.length) { sfx('warn', 0.4); toast('탑을 하나 이상 골라 주세요'); return; }
    sfx('click', 0.4); loSet(LO.mi, LO.list); var b = LO.back; LO.back = null; LO.mi = -1; closeModal(); if (typeof b === 'function') b();
  };
}

// ---------- 탑 상세 ----------
// 단계 칸: 1, 2, 3단계 → 갈래 A/B의 4, 5, 6단계(궁극). 칸을 누르면 그 단계 이름과 수치
function loStageHtml(k, L, B, sel, lock) { var ult = L >= 6; return '<button class="tdS' + (sel ? ' sel' : '') + (ult ? ' ult' : '') + (lock ? ' lk' : '') + '" data-l="' + L + '" data-b="' + B + '"><img src="' + loIcon(k, L, B, 72) + '" alt=""><i>' + L + '</i></button>'; }
function loStatText(k, L, B) {
  var s = '';
  try { s = statLine(towerStats(k, L, B), k); } catch (e) { s = ''; }
  var T = TOWERS[k], nm = L >= 4 ? towerTitle(k, L, B) : T.name;
  return '<b>' + L + '단계 ' + esc(nm) + (L >= 6 ? ' (궁극)' : '') + '</b>' + esc(s);
}
function loDetail(k, back, selL, selB) {
  var T = TOWERS[k]; if (!T) return;
  if (back !== undefined) LO.dBack = back || null;
  var tier = loTier(k), own = gcOwns(k) || (T.admin && SAVE.admin), st = gcStar(k), L0 = selL || 1, B0 = selB || 0, br = T.br || [], lv = (T.lv || []).length || 3;
  var maxOk = fdUnlocked('branch') ? (fdUnlocked('ult') ? 6 : 5) : 3;
  var h = '<div class="tdH"><img src="' + loIcon(k, Math.min(L0, 6), B0, 160) + '" alt=""><div class="tdHT"><i class="tdTier t-' + tier.id + '">' + tier.name + '</i>' + (st ? '<span class="tdSt cStar">' + uiStarsHtml(st) + '</span>' : '') +
    '<b class="tdNm">' + esc(T.name) + '</b>' + loDomHtml(k) + ' <span class="hint">' + loDomText(k) + '</span></div></div><p class="tdDesc">' + esc(T.desc || '') + (own ? '' : ' (아직 없는 탑)') + '</p><div class="tdTree"><div class="tdRow">';
  for (var L = 1; L <= Math.min(3, lv); L++) h += (L > 1 ? '<i class="tdAr"></i>' : '') + loStageHtml(k, L, 0, L0 === L, false);
  h += '</div>';
  br.forEach(function (Bq, bi) {
    var mx = fdMaxLv(k, bi), row = '';
    for (var L2 = 4; L2 <= mx; L2++) row += (L2 > 4 ? '<i class="tdAr"></i>' : '') + loStageHtml(k, L2, bi, L0 === L2 && B0 === bi, L2 > maxOk);
    h += '<div class="tdBr"><div class="tdBN"><b>' + (bi ? 'B ' : 'A ') + esc(Bq.name) + '</b><span>' + esc(Bq.desc || '') + '</span>' + (Bq.ult && mx >= 6 ? '<em>궁극: ' + esc(Bq.ult) + '</em>' : '') + '</div><div class="tdRow">' + row + '</div></div>';
  });
  h += '</div><div class="tdStat" id="tdStat">' + loStatText(k, L0, B0) + '</div>';
  chFusions().forEach(function (f) {
    if (f.a !== k && f.b !== k && f.to !== k) return; var done = chFused(f.to);
    h += '<div class="tdFz"><img src="' + loIcon(f.a, 5, 0, 64) + '" alt=""><u>+</u><img src="' + loIcon(f.b, 5, 0, 64) + '" alt=""><u>=</u>' + (done ? '<img src="' + loIcon(f.to, 1, 0, 64) + '" alt="">' : '<i class="fzQ">?</i>') + '<b>' + (done ? esc(TOWERS[f.to].name) : '합체 ???') + '</b></div>';
  });
  if (br.length && maxOk < 6) h += '<div class="tdLock">' + (maxOk < 5 ? '갈래 변신(4, 5단계)은 ' + chUnlockName('branch') + ' 판, ' : '') + '궁극(6단계)은 ' + chUnlockName('ult') + ' 판을 이기면 열립니다</div>';
  h += '<button class="xbtn" id="tdBack">돌아가기</button>';
  openModal(h, 'twd');
  $('modal').querySelectorAll('.tdS').forEach(function (b) { b.onclick = function () { sfx('click', 0.3); loDetail(k, undefined, +b.getAttribute('data-l'), +b.getAttribute('data-b')); }; });
  $('tdBack').onclick = function () { sfx('click', 0.3); var b = LO.dBack; LO.dBack = null; closeModal(); if (typeof b === 'function') b(); };
}

// ---------- 시험용 ----------
window.__lo = {
  open: function (mi) { loOpen(mi == null ? 0 : mi, null); }, detail: function (k, L, B) { loDetail(k || 'archer', null, L, B); }, get: function (mi) { return loGet(mi); }, auto: function (mi) { return loAuto(mi); },
  set: function (mi, l) { loSet(mi, l); }, all: function (a) { return loAll(a); }, usable: loUsable
};
