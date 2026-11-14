// ===== ui.js : 화면, 버튼, 저장 =====
var SAVE_KEY = 'timeflex.v1', SAVE_KEY_OLD = 'timeflex.none';   // 타임플렉스: 타워플렉스와 저장을 나눔   // v2.0: 새 저장 키. 옛 저장은 fdMigrateOld가 지갑만 옮김
function defSave() {
  return {
    v: 1, prog: 0, rec: {}, res: {}, seen: {}, story: {}, tut: {}, set: { sfx: true, music: true, vib: true, shake: true, dmgNum: true, autoWave: false }, mid: null, plays: 0,
    // [BM] 보석(게임 안 재화), 장착 스킨, 산 스킨 (탑 스킨은 art_tower.js, 화살 스킨은 render.js가 SAVE.skin을 읽어 그림)
    gems: 0, skin: { tower: 'base', proj: 'base' }, owned: { berry: 0, star: 0, heart: 0, candy: 0 },
    // [재방문] 처음 처치한 적(도감 보상 자격), 도감 보상 받은 적, 일일 임무 { day, ids, n, got }, 오늘 상점 광고 본 횟수 { day, n }
    slain: {}, codexGot: {}, daily: { day: '', ids: [], n: {}, got: {} }, adGem: { day: '', n: 0 },
    // [BM] 탑 소환(gacha.js): 가진 탑 { 키: { n, star } }, 소환권, 소환 기록 { pity 천장 세기, free 무료 쓴 날, total }, 소환권 받은 지역 { 'm1w', 'm1s' }
    // v2.0 시작 탑: archer, catapult, flak (flak은 아직 뼈대라 TOWER_ORDER에 없음: 가진 것으로만 기록)
    towers: { archer: { n: 1, star: 0 }, catapult: { n: 1, star: 0 }, flak: { n: 1, star: 0 } }, tickets: 0, gacha: { pity: 0, free: '', total: 0 }, tkRew: {},
    // v2.0 화면(UIA): 판마다 출전 편성 { 판 id: [탑 키], _last }, 만들어 본 합체 { 합체 탑 키: 1 }, 받은 판 첫 승리 확정 보상 { 판 id: 1 }
    lo: {}, fused: {}, rwGot: {}
  };
}
// 옛 저장(lastarrow.v4, 최후의 화살)에서 보석, 소환권, 가진 탑과 별, 스킨(장착과 산 것), 설정만 옮긴다. 판 기록, 연구, 도감, 임무는 새로. 옛 저장은 지우지 않음
function fdMigrateOld(raw) {
  var o = null; try { o = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { o = null; }
  if (!o || typeof o !== 'object') return null;
  var n = defSave(), d = n.towers;
  if (typeof o.gems === 'number' && isFinite(o.gems) && o.gems > 0) n.gems = Math.floor(o.gems);
  if (typeof o.tickets === 'number' && isFinite(o.tickets) && o.tickets > 0) n.tickets = Math.floor(o.tickets);
  var T = o.towers && typeof o.towers === 'object' ? o.towers : (typeof gcMigrate === 'function' ? gcMigrate(o) : null);   // v1.2 이전 기록은 그 진행에서 열린 탑
  if (T) for (var k in T) if (TOWERS[k] && T[k] && typeof T[k] === 'object') n.towers[k] = { n: Math.max(1, Math.floor(+T[k].n || 1)), star: clamp(Math.floor(+T[k].star || 0), 0, 5) };
  for (var k0 in d) if (!n.towers[k0]) n.towers[k0] = d[k0];
  if (o.skin && typeof o.skin === 'object') n.skin = { tower: o.skin.tower || 'base', proj: o.skin.proj || 'base' };
  if (o.owned && typeof o.owned === 'object') for (var k1 in n.owned) n.owned[k1] = o.owned[k1] ? 1 : 0;
  if (o.set && typeof o.set === 'object') for (var k2 in n.set) if (typeof o.set[k2] === 'boolean') n.set[k2] = o.set[k2];
  if (o.set && typeof o.set.lang === 'string') n.set.lang = o.set.lang;
  n.from = 'lastarrow.v4';
  return n;
}
function loadSave() {
  try {
    var s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.v === 1) {
      var d = defSave(); for (var k in d) if (s[k] == null) s[k] = d[k];
      for (var k2 in d.set) if (s.set[k2] == null) s.set[k2] = d.set[k2];
      return metaFixSave(s);   // 새 항목(보석, 스킨, 임무 등) 기본값 병합과 검사
    }
    if (!s) { var m = fdMigrateOld(localStorage.getItem(SAVE_KEY_OLD)); if (m) { m = metaFixSave(m); try { localStorage.setItem(SAVE_KEY, JSON.stringify(m)); } catch (e2) { } return m; } }
  } catch (e) { }
  return defSave();
}
var SAVE = loadSave();
function saveNow() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { } }
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function rec(id) { return SAVE.rec[id] || (SAVE.rec[id] = { easy: 0, normal: 0, hard: 0, endless: 0, flag: 0 }); }
function mapStars(id) { var r = SAVE.rec[id]; if (!r) return 0; return Math.max(r.easy ? 1 : 0, r.normal || 0, r.hard || 0) + (r.hard ? 2 : 0) + (r.flag ? 1 : 0); }
function totalStars() { var n = 0; MAPS.forEach(function (M) { n += mapStars(M.id); }); return n; }
function spentStars() { var n = 0; RESEARCH.forEach(function (r) { if (SAVE.res[r.id]) n += r.cost; }); return n; }
// ---------- 진행 (v2.0: 판 id 기준) ----------
function fdMi(id) { for (var i = 0; i < MAPS.length; i++) if (MAPS[i].id === id) return i; return -1; }
function fdWon(id) { var r = SAVE.rec[id]; return !!(r && (r.easy || r.normal || r.hard)); }
function fdChapter(ch) { for (var i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === ch) return CHAPTERS[i]; return null; }
function fdChStars(ch) { var n = 0; MAPS.forEach(function (M) { if ((M.ch || 1) === ch) n += mapStars(M.id); }); return n; }
// 잠금 해제(UNLOCKS): 'branch' 갈래 변신, 'ult' 궁극, 'fuse' 합체. 관리자면 모두 열림. 기준 판이 아직 MAPS에 없으면 열린 것으로(개발 중 판이 모자랄 때)
function fdUnlocked(key) { if (SAVE.admin) return true; var id = UNLOCKS[key]; if (!id || fdMi(id) < 0) return true; return fdWon(id); }
// 판이 열렸는지: { ok, why: 'prev' 앞 판 | 'chapter' 앞 챕터 별 | 'gate' 챕터 안 별 관문, need: 필요한 별, have }
function fdStageOpen(mi) {
  var M = MAPS[mi]; if (!M) return { ok: false, why: 'none' };
  if (SAVE.admin) return { ok: true };
  var ch = M.ch || 1, C = fdChapter(ch), prev = MAPS[mi - 1];
  if (prev && (prev.ch || 1) === ch) { if (!fdWon(prev.id)) return { ok: false, why: 'prev' }; }
  else if (prev) { if (!fdWon(prev.id)) return { ok: false, why: 'prev' }; var need = C && C.open ? C.open.stars || 0 : 0, have = fdChStars(prev.ch || 1); if (have < need) return { ok: false, why: 'chapter', need: need, have: have }; }
  var gt = C && C.gate && M.no != null ? C.gate[M.no] : 0; if (gt) { var hv = fdChStars(ch); if (hv < gt) return { ok: false, why: 'gate', need: gt, have: hv }; }
  return { ok: true };
}
// 지금 도전할 판(열린 판 가운데 아직 못 이긴 첫 판, 다 이겼으면 마지막 열린 판)
function fdCurStage() { var last = 0; for (var i = 0; i < MAPS.length; i++) { if (!fdStageOpen(i).ok) break; last = i; if (!fdWon(MAPS[i].id)) return i; } return last; }
function progFor(mi) { var n = 0; MAPS.forEach(function (M) { if (fdWon(M.id)) n++; }); return n; }   // 이긴 판 수
// 전투에서 쓰는 탑 = 가진 탑(SAVE.towers) 가운데 TOWER_ORDER에 있는 것. 편성(8종 고르기)은 화면 갈래의 loadout이 opts.towers로 넘긴다
function towersFor(mi) { if (typeof tfLoadout === 'function') return tfLoadout(mi); return typeof loGet === 'function' ? loGet(mi) : gcOwned(); }   // v2.0: 판 창에서 고른 출전 편성(loadout.js)
// 변신 잠금(UNLOCKS): 갈래 전 3단계, 갈래 뒤 5단계, 궁극 뒤 6단계
function maxLvFor(mi) { return !fdUnlocked('branch') ? 3 : fdUnlocked('ult') ? 6 : 5; }
// 기술 3개: 화살비는 처음부터, 방책은 c1s01 승리 뒤, 최후의 화살은 c1s02 승리 뒤
function skillsFor(mi) { var a = SAVE.admin; return { rain: 1, wall: a || fdWon('c1s01') ? 1 : 0, last: a || fdWon('c1s02') ? 1 : 0 }; }
// newGame에 넘길 선택 사항 한 벌 (화면 갈래가 towers를 편성으로 바꿔 쓰면 됨)
function fdGameOpts(mi) { return { research: SAVE.res, towers: towersFor(mi), towerStar: gcStarMap(), maxLv: maxLvFor(mi), skills: skillsFor(mi), sk2: typeof sk2Chosen === 'function' ? sk2Chosen() : [], autoWave: !!SAVE.set.autoWave, fuse: fdUnlocked('fuse') && fdMi(UNLOCKS.fuse) >= 0 || !!SAVE.admin, admin: !!SAVE.admin }; }
var UI = { scr: 'title', speed: 1, paused: false, modalOpen: false, tray: null, pick: null, upPick: null, wavesSeen: 0, lastHud: {}, bossShown: false, endT: 0, tutStep: 0 };
var ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ'];
var MODE_NAME = { first: '선두', last: '후미', strong: '강한 적', close: '가까운 적' };
var MODES = ['first', 'last', 'strong', 'close'];

function show(id) { ['sTitle', 'sMap'].forEach(function (s) { $(s).classList.toggle('hide', s !== id); }); UI.scr = id; if (typeof i18nRefit === 'function') i18nRefit(); }
function toast(msg, ms) { var t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(UI.toastT); UI.toastT = setTimeout(function () { t.classList.remove('on'); }, ms || 1800); }
function banner(a, b, ms, cls) {
  var el = $('banner'); el.className = 'on ' + (cls || ''); el.innerHTML = '<div class="b1">' + esc(a) + '</div>' + (b ? '<div class="b2">' + esc(b) + '</div>' : '');
  clearTimeout(UI.banT); UI.banT = setTimeout(function () { el.className = ''; }, ms || 1700);
}
function setIcons(root) { (root || document).querySelectorAll('img[data-ic]').forEach(function (im) { im.src = icon(im.getAttribute('data-ic'), 64); }); }

// ---------- 타이틀 ----------
function initTitle() {
  var c = $('titleCv'), dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(window.innerWidth * dpr); c.height = Math.round(window.innerHeight * dpr);
  if (typeof uiTitleArt2 === 'function') uiTitleArt2(c); else drawTitleArt(c);   // v2.0 타이틀 그림(ui_art2.js)
  $('ver').textContent = VERSION; if (typeof chInit === 'function') { chInit(); chSetTheme(0); }
  metaInit(); uiGemsShow(false);   // [BM] 보석 칸, 상점과 임무 단추 연결 (처음 한 번)
}
// ---------- 세계 지도 ----------
// v2.0: 챕터 고르기와 챕터 지도(chapters.js chGo). 옛 한 장 세계 지도 본문은 v2.0 QA에서 걷어냄
function goMap() { return chGo(); }
function diffOpen(mi, dk) { var r = SAVE.rec[MAPS[mi].id] || {}; if (dk === 'easy' || dk === 'normal') return true; return (r.normal || 0) > 0 || (r.hard || 0) > 0; }
// 지역 창: 번호와 제목 → 지도 미리보기(남는 높이를 채우는 유연한 칸) → 설명 → 나오는 적과 새 탑 → 난이도 → 규칙 → 출전, 닫기
// 어떤 폰에서도 스크롤 없이 한 화면에 들어가도록 미리보기만 줄어듦 (style.css .prevBox)
function openStage(mi, dkSel) { return chOpenStage(mi, dkSel); }   // v2.0 판 창(chapters.js)
function diffInfo(mi, dk) {
  var D = DIFFS[dk], M = MAPS[mi];
  if (dk === 'endless') return '웨이브가 끝없이 이어집니다. 얼마나 버티는지 겨루세요. 생명 ' + D.lives;
  return '웨이브 ' + (M.waves + (D.extra || 0)) + ', 생명 ' + D.lives + (dk === 'easy' ? ', 적이 약함 (별은 1개까지)' : dk === 'hard' ? ', 적 체력 +28%, 마지막 5웨이브 추가' : '');
}
// 지도 미리보기: 칸(.prevBox)의 실제 크기에 캔버스 해상도를 맞추고, 지도 전체가 들어가게(아주 낮은 칸이면 가운데를 조금 잘라) 그림
function drawPreview(c, mi) {
  var box = c.parentNode || c, W = box.clientWidth || 280, H = box.clientHeight || 200, dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.max(1, Math.round(W * dpr)); c.height = Math.max(1, Math.round(H * dpr));
  var g = newGame(mi, 'normal', {}), GC = g.cols, GR = g.rows;
  var S = Math.max(Math.min(W / GC, H / GR), W / (GC * 2.6)) * dpr;
  var dy = c.height - S * GR;   // 남으면 가운데, 모자라면 성문(아래)이 보이게 위쪽을 더 자름
  var v = { W: c.width, H: c.height, S: S, ox: (c.width - S * GC) / 2, oy: dy >= 0 ? dy / 2 : dy * 0.85 };
  var bg = renderBackground(g, v), x = cx2(c); x.drawImage(bg, 0, 0);
  g.obs.forEach(function (o) { var T = THEME[g.M.theme]; var k = o.chest ? 'chest' : o.ch === 'C' ? T.C : o.ch === 'a' ? T.a : o.ch === 'b' ? T.b : T.c; drawSpr(x, propSpr(k, g.M.theme, v.S, o.id % 6), v.ox + o.x * v.S, v.oy + (o.y + 0.3) * v.S); });
  drawSpr(x, gateSpr(v.S, g.M.theme), v.ox + g.gate.x * v.S, v.oy + (g.gate.y + 0.42) * v.S);
}
// ---------- 모달 ----------
function openModal(html, kind) {
  var m = $('modal'); m.innerHTML = html; m.className = 'modal ' + (kind || ''); m.scrollTop = 0; $('sModal').classList.remove('hide'); UI.modalOpen = true; UI.modalKind = kind || '';
}
function closeModal() { var k = UI.modalKind; $('sModal').classList.add('hide'); UI.modalOpen = false; UI.modalKind = ''; if (G && UI.scr === 'battle' && k !== 'result') UI.paused = false; }

// ---------- 전투 시작, 끝 ----------
var G = null, BOT = null;
function beginStage(mi, dk, resume) {
  var M = MAPS[mi];
  var lines = STORY[M.id];
  if (!resume && lines && !SAVE.story[M.id]) { SAVE.story[M.id] = 1; saveNow(); playStory(lines, function () { startBattle(mi, dk, false); }, mi); }
  else startBattle(mi, dk, resume);
}
function startBattle(mi, dk, resume) {
  if (typeof chSetTheme === 'function') chSetTheme((MAPS[mi] || {}).ch || 1);   // 챕터 색(body[data-ch])
  $('loading').classList.remove('hide');
  setTimeout(function () {
    G = newGame(mi, dk, fdGameOpts(mi)); if (typeof tfApplyMode === 'function') tfApplyMode(G, resume);
    UI_PK.q = null; UI_PK.cardQ = [];
    G.seenEnemies = {}; for (var k in SAVE.seen) G.seenEnemies[k] = 1;
    if (resume && SAVE.mid && SAVE.mid.mi === mi) applyMid(G, SAVE.mid);
    trayClose(); $('spdTxt').textContent = '1배'; $('bSpeed').classList.remove('on');
    UI.scr = 'battle'; UI.paused = false; UI.speed = 1; UI.endT = 0; UI.bossShown = false; UI.lastHud = {}; UIS.sel = null; UIS.aim = null; UIS.preview = null;
    $('sTitle').classList.add('hide'); $('sMap').classList.add('hide');
    $('hud').classList.remove('hide'); $('bottom').classList.remove('hide'); $('bossbar').classList.add('hide');
    rdLayout(G, hudTop(), hudBot());
    $('loading').classList.add('hide');
    banner(M_TITLE(G), DIFFS[dk].name + (G.D.endless ? '' : ', 웨이브 ' + G.N), 1800, 'big');
    UIS.gridHint = 3;
    if (SAVE.set.music) MUSIC.play('battle');
    hudSkills(); updateWaveBtn(true);
    SAVE.plays++; saveNow();
    UI.tutStep = (mi === 0 && !SAVE.tut.done) ? 1 : 0; UI.tutT = 0; tutShow(); // 첫 길잡이를 바로 띄우고, 이전 판 말풍선은 지움
  }, 30);
}
function M_TITLE(g) { if (g.D && g.D.arena) return '무한 차원전'; return (g.M.ch || 1) + '-' + (g.M.no != null ? g.M.no : g.mi + 1) + ' ' + g.M.name; }
function stopBattle() { if (typeof meterToggle === 'function') { meterToggle(false); if ($('bMeter')) $('bMeter').classList.add('hide'); }
  coinFlush(); G = null; BOT = null; UI.scr = UI.scr === 'battle' ? 'map' : UI.scr; trayClose(); $('bossbar').classList.add('hide'); }
// [UIB] 전투 화면 높이 맞춤: 넉넉한 막대(위 56, 아래 88)로는 판이 폭 기준 칸 크기로 다 안 들어가는 화면이면 body.uibC(얇은 막대: 위 38, 아래 50, 기술 이름 숨김)
// rdLayout(G, hudTop(), hudBot())의 hudTop이 먼저 불리므로 여기서 맞춘다(전투 시작과 화면 크기 변경 때)
function uibFit() {
  var g = G, b = document.body; if (!g) return;
  b.classList.remove('uibC');
  var h = $('hud'), m = $('bottom'), H = window.innerHeight, W = window.innerWidth, top = 56, bot = 96;
  if (h && !h.classList.contains('hide')) { var r = h.getBoundingClientRect(); if (r.height > 0) top = r.bottom; }
  if (m && !m.classList.contains('hide')) { var r2 = m.getBoundingClientRect(); if (r2.height > 0) bot = H - r2.top; }
  if (H - top - bot < W / g.cols * g.rows - 0.5) b.classList.add('uibC');
}
function hudTop() { uibFit(); var h = $('hud'); if (h && !h.classList.contains('hide')) { var r = h.getBoundingClientRect(); if (r.height > 0) return Math.round(r.bottom); } return 56 + safeTop(); }
function hudBot() { var b = $('bottom'); if (b && !b.classList.contains('hide')) { var r = b.getBoundingClientRect(); if (r.height > 0) return Math.round(window.innerHeight - r.top); } return 92 + safeBot(); }
function safeTop() { var v = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0; return v; }
function safeBot() { var v = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab')) || 0; return v; }
function applyMid(g, m) {
  g.wave = m.wave - 1; g.gold = m.gold; g.lives = m.lives; g.waiting = true;
  m.obs.forEach(function (o, i) { if (g.obs[i]) { g.obs[i].alive = o[1]; g.obs[i].hp = o[0]; } });
  g.stats.obsCleared = g.obs.filter(function (o) { return !o.alive; }).length;
  m.towers.forEach(function (t) { var tw = buildTower(g, t.k, t.c, t.r, true); if (tw) { tw.lvl = t.lvl; tw.br = t.br; tw.mode = t.mode; tw.spent = t.spent; } });
  if (m.ab && typeof abilityRestore === 'function') abilityRestore(g, m.ab); else { g.pickWait = false; g.pickCards = null; }
  refreshStats(g); g.ev = [];
}
function snapMid(g) {
  if (g.D.arena) return;   // v2.2 무한 차원전은 이어하기 없음(기록 경쟁)
  if (g.D.endless && g.wave < 3) return;
  SAVE.mid = { mi: g.mi, dk: g.dk, wave: g.wave, gold: g.gold - (g.lastMint || 0), lives: g.lives, towers: g.towers.map(function (t) { return { k: t.k, c: t.c, r: t.r, lvl: t.lvl, br: t.br, mode: t.mode, spent: t.spent }; }), obs: g.obs.map(function (o) { return [Math.round(o.hp), o.alive]; }), ab: typeof abilitySnap === 'function' ? abilitySnap(g) : null };
  saveNow();
}
// ---------- 이야기 ----------
function playStory(lines, done, mi) {
  var i = 0, el = $('story');
  el.classList.remove('hide');
  // 뒤 배경: 그 지역 전장을 어둡게
  var bc = $('stBg'), dpr = Math.min(2, window.devicePixelRatio || 1);
  bc.width = Math.round(window.innerWidth * dpr); bc.height = Math.round(window.innerHeight * dpr);
  var bx = cx2(bc); bx.fillStyle = '#0b0910'; bx.fillRect(0, 0, bc.width, bc.height);
  try {
    var gm = newGame(mi == null ? Math.min(11, MAPS.length - 1) : mi, 'normal', {}), S = Math.max(bc.width / gm.cols, bc.height / gm.rows) * 1.05, v = { W: bc.width, H: bc.height, S: S, ox: (bc.width - S * gm.cols) / 2, oy: (bc.height - S * gm.rows) / 2 };
    bx.drawImage(renderBackground(gm, v), 0, 0);
    gm.obs.forEach(function (o) { var T = THEME[gm.M.theme]; var k = o.chest ? 'chest' : o.ch === 'C' ? T.C : o.ch === 'a' ? T.a : o.ch === 'b' ? T.b : T.c; drawSpr(bx, propSpr(k, gm.M.theme, S, o.id % 6), v.ox + o.x * S, v.oy + (o.y + 0.3) * S); });
    drawSpr(bx, gateSpr(S, gm.M.theme), v.ox + gm.gate.x * S, v.oy + (gm.gate.y + 0.42) * S);
  } catch (e) { }
  function step() {
    if (i >= lines.length) { el.classList.add('hide'); done && done(); return; }
    var L = lines[i++], who = SPEAKERS[L[0]];
    $('stWho').textContent = who || ''; $('stWho').className = 'who ' + (who ? '' : 'nar');
    var tx = $('stTxt'); tx.textContent = L[1]; tx.className = 'txt' + (who ? '' : ' nar'); tx.style.animation = 'none'; void tx.offsetWidth; tx.style.animation = '';
  }
  el.onclick = function (ev) { if (ev.target.id === 'stSkip') { i = lines.length; } sfx('click', 0.3); step(); };
  step();
}
// ---------- HUD ----------
// 금화가 금화 칸에 닿을 때 칸이 통 튐 (너무 잦으면 0.11초에 한 번)
function goldBump() { var now = performance.now(); if (now - (UI.gbT || 0) < 110) return; UI.gbT = now; var el = $('hGold').parentNode; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function hudTick(g) {
  var L = UI.lastHud;
  if (UI.hudG !== g) { UI.hudG = g; uibHudInit(g); }   // [UIB] 새 판: 도전 규칙 칩
  if (UI.tray && UI.tray.kind === 'tower' && g.towers.indexOf(UI.tray.t) < 0) trayClose();   // 쟁반의 탑이 사라졌으면(합체, 판매) 닫음
  if (UI_PK.q) uiPkTry();   // 능력 카드: 다른 창이 닫히면 띄움
  // 금화 칸: 날아오는 금화가 닿을 때마다 숫자가 굴러 올라감 (쓴 금화는 바로 줄어듦)
  var pend = Math.max(0, Math.min(g.gold, RD.coinPend || 0)), gt = g.gold - pend;
  if (L.goldAct !== g.gold) { L.goldAct = g.gold; refreshTrayCost(); }
  if (L.gold == null || gt < L.gold) L.gold = gt; else if (gt > L.gold) L.gold = Math.min(gt, L.gold + Math.max(1, Math.ceil((gt - L.gold) * 0.25)));
  if (L.goldTxt !== L.gold) { $('hGold').textContent = fmt(L.gold); L.goldTxt = L.gold; }
  if (L.lives !== g.lives) { $('hLife').textContent = g.lives; if (L.lives != null && g.lives < L.lives) { var lp = $('hLife').parentNode; lp.classList.remove('hit'); void lp.offsetWidth; lp.classList.add('hit'); } L.lives = g.lives; }
  var wv = g.D.endless ? g.wave + '' : g.wave + '/' + g.N; if (L.wave !== wv) { $('hWave').textContent = wv; L.wave = wv; }
  ['rain', 'wall', 'last'].forEach(function (k) {
    var b = $('sk_' + k); if (!g.unlockedSkills[k]) return;
    var cd = g.sk[k].cd, max = skillCd(g, k), f = cd > 0 ? cd / max : 0, key = 'sk' + k, val = Math.ceil(cd) + ':' + (UIS.aim === k);
    if (L[key] !== val) { L[key] = val; b.querySelector('.cd').style.height = (f * 100) + '%'; b.querySelector('b').textContent = cd > 0 ? Math.ceil(cd) : ''; b.classList.toggle('ready', cd <= 0); b.classList.toggle('aim', UIS.aim === k); }
  });
  if (g.finale === 1) $('sk_last').classList.add('finale');
  if (typeof sk2Hud === 'function') sk2Hud(g, L);
  updateWaveBtn(false);
  // 우두머리 체력
  if (g.boss && !g.boss.dead) {
    if (!UI.bossShown) { UI.bossShown = true; $('bossbar').classList.remove('hide'); $('bossName').textContent = g.boss.E.name; }
    $('bossFill').style.width = (g.boss.hp / g.boss.mhp * 100) + '%'; $('bossShield').style.width = Math.min(100, g.boss.shield / g.boss.mhp * 100) + '%';
  } else if (UI.bossShown) { UI.bossShown = false; $('bossbar').classList.add('hide'); }
}
// [UIB] 도전 규칙 칩: 위 막대 왼쪽 칸 끝에 붙고, 누르면 이름과 설명이 뜬다. 판이 시작되면 한 번 저절로 보여 줌
function uibRuleOf(g) { var M = g && g.M; if (!M || !(g.rule || M.rule || M.ruleName)) return null; return { name: M.ruleName || '도전 규칙', desc: M.ruleDesc || '' }; }
function uibHudInit(g) {
  var hl = document.querySelector('#hud .hl'), b = $('hRule'), R = uibRuleOf(g);
  if (!b && hl) { b = document.createElement('button'); b.id = 'hRule'; b.className = 'uRule hide'; b.setAttribute('data-a', 'rtip'); hl.appendChild(b); b.onclick = function (e) { e.stopPropagation(); sfx('click', 0.4); uibRuleTip(UI.ruleTipOn ? 0 : 6000); }; }
  uibRuleTip(0); clearTimeout(UI.ruleT0);
  if (!b) return;
  b.classList.toggle('hide', !R);
  // 이름이 칩에 다 안 들어가면 표지만 보임(이름은 설명에)
  if (R) { b.innerHTML = '<i class="uRi"></i><span>' + esc(R.name) + '</span>'; b.classList.remove('fresh', 'ico'); var sp = b.querySelector('span'); if (sp && sp.scrollWidth > sp.clientWidth + 1) b.classList.add('ico'); void b.offsetWidth; b.classList.add('fresh'); UI.ruleT0 = setTimeout(function () { if (G === g && UI.scr === 'battle' && !g.over) uibRuleTip(4200); }, 2000); }
}
function uibRuleTip(ms) {
  var tip = $('uRuleTip'), R = uibRuleOf(G);
  clearTimeout(UI.ruleT1);
  if (!ms || !R) { if (tip) tip.classList.add('hide'); UI.ruleTipOn = 0; return; }
  if (!tip) { tip = document.createElement('div'); tip.id = 'uRuleTip'; $('app').appendChild(tip); tip.onclick = function () { uibRuleTip(0); }; }
  tip.innerHTML = '<b><i class="uRi"></i>도전 규칙: ' + esc(R.name) + '</b>' + (R.desc ? '<p>' + esc(R.desc) + '</p>' : '');
  var h = $('hud'); tip.style.top = (h ? Math.round(h.getBoundingClientRect().bottom) + 4 : 60) + 'px';
  tip.classList.remove('hide'); tip.style.animation = 'none'; void tip.offsetWidth; tip.style.animation = ''; UI.ruleTipOn = 1;
  UI.ruleT1 = setTimeout(function () { uibRuleTip(0); }, ms);
}
function updateWaveBtn(force) {
  var g = G; if (!g) return;
  var b = $('bWave'), L = UI.lastHud, state, clr = !g.over && !g.waiting && g.wave < g.N && fieldClear(g);
  if (g.over) state = 'over';
  else if (g.waiting) state = 'start';
  else if (g.wave >= g.N) state = 'last';
  else if (g.nextT > 0) state = 'next:' + Math.ceil(g.nextT) + ':' + g.wave + (clr ? ':c' : '');
  else if (g.autoWave && clr) state = 'auto:' + Math.ceil(Math.max(0.01, AUTO_GAP - g.clearT)) + ':' + g.wave;
  else state = 'ready:' + g.wave + (clr ? ':c' : '') + (g.autoWave ? ':a' : '');
  if (!force && L.wb === state) return; L.wb = state;
  b.classList.toggle('pulse', state === 'start' || clr);
  b.classList.toggle('off', state === 'last' || state === 'over');
  // 다음 웨이브 미리보기: 하늘, 바다 적은 종류마다 맨 앞에 영역 딱지와 함께, 나머지는 위협 순. 단추 폭에 들어가는 만큼만 보이고 남으면 +N
  var info = nextWaveInfo(g), icons = '', warn = '';
  if (info) {
    var all = Object.keys(info.types).filter(function (k) { return ENEMIES[k]; }), dm = function (k) { return fdDom(ENEMIES[k]); }, thr = function (k) { return threatOf(k) * info.types[k]; };
    all.sort(function (a, b2) { return thr(b2) - thr(a); });
    var ks = [], doms = {}; all.forEach(function (k) { doms[dm(k)] = 1; });
    ['a', 's'].forEach(function (d) { for (var i = 0; i < all.length; i++) if (dm(all[i]) === d) { ks.push(all[i]); break; } });
    all.forEach(function (k) { if (ks.indexOf(k) < 0) ks.push(k); });
    var room = Math.max(2, Math.min(5, Math.floor(((b.clientWidth || 180) - (document.body.classList.contains('uibC') ? 50 : 60)) / 37)));
    var show = ks.slice(0, ks.length <= room ? ks.length : Math.max(2, room - 1)), more = ks.length - show.length;
    icons = show.map(function (k) { var d = dm(k); return '<span class="wi1 d' + d + '">' + (d !== 'g' ? '<i class="uDm ' + d + '"></i>' : '') + '<img src="' + enemyIcon(k, 48) + '" alt="">' + info.types[k] + '</span>'; }).join('') + (more > 0 ? '<span class="wi1 mo">+' + more + '</span>' : '');
    warn = (doms.a ? '<i class="uDm a wn1"></i>' : '') + (doms.s ? '<i class="uDm s wn1"></i>' : '');
  }
  var num = '', play = '<img src="' + icon('play', 48) + '">';
  if (state === 'start') { $('waveLbl').innerHTML = '<b>전투 시작</b>' + warn; num = play; }
  else if (state === 'last' || state === 'over') { $('waveLbl').innerHTML = '<b>' + (g.D.endless ? '' : '마지막 웨이브') + '</b>'; }
  else if (g.nextT > 0) { $('waveLbl').innerHTML = '<b>다음 웨이브</b>' + ((b.clientWidth || 200) < 190 ? '' : warn) + '<em><img src="' + icon('coin', 32) + '">+' + earlyBonus(g) + '</em>'; num = Math.ceil(g.nextT); }
  else if (g.autoWave) { $('waveLbl').innerHTML = '<b>' + (clr ? '자동 시작' : '정리 후 자동') + '</b>' + warn; num = clr ? Math.ceil(Math.max(0.01, AUTO_GAP - g.clearT)) : play; }
  else { $('waveLbl').innerHTML = '<b>다음 웨이브</b>' + warn; num = play; }
  $('waveNum').innerHTML = num;
  $('waveIcons').innerHTML = state === 'last' || state === 'over' ? '' : icons;
  uiWaveFit(b, $('waveIcons'));
  var live = state !== 'last' && state !== 'over';
  b.classList.toggle('hasW', live && !!warn); b.classList.toggle('wAir', live && warn.indexOf(' a ') >= 0); b.classList.toggle('wSea', live && warn.indexOf(' s ') >= 0 && warn.indexOf(' a ') < 0);
  var f = 0;
  if (state.indexOf('next') === 0) f = 1 - g.nextT / g.nextMax;
  else if (state.indexOf('auto') === 0) f = Math.min(1, g.clearT / AUTO_GAP);
  else if (state.indexOf('ready') === 0) f = 1;
  $('waveRing').style.strokeDashoffset = (138 * (1 - f)) + '';
}
function hudSkills() {
  ['rain', 'wall', 'last'].forEach(function (k) { var b = $('sk_' + k); b.classList.toggle('lock', !G.unlockedSkills[k]); b.classList.remove('finale'); });
  if (typeof uiSkillArt === 'function') uiSkillArt(G && G.M ? (typeof tfSkin === 'function' ? tfSkin(G.M.ch) : G.M.ch) : 1);
  if (typeof sk2Setup === 'function') sk2Setup(G);   // v2.2 특수 기술 단추   // v2.0.1: 장 분위기에 맞는 기술 그림
}
// ---------- 탑 쟁반(아래나 위에서 올라오는 패널) [UIB v2.0] ----------
// 단추 동작 이름(data-a)은 전부 다르다: close 닫기, tpick 탑 카드, tbuild 건설, tup 강화와 변신, fuse 합체, mode 목표, bview 능력, sell 판매, rtip 규칙 설명
// (gacha.js의 능력 한 줄 .bmini는 data-a="build"를 쓰므로 onTrayClick이 class로 먼저 가른다. 건설 단추와 이름이 겹쳐 건설이 안 되던 일의 재발 방지)
// 쟁반이 고른 칸이나 탑을 가리지 않게: 아래에 놓아 보고 가리면 위로, 둘 다 가리면 덜 가리는 쪽 (움직임 연출 중에도 맞게 배치 값으로 계산)
function trayPos(r, tall) {
  // v2.3: 쟁반은 언제나 아래. 고른 칸이 가려지면 지도를 그만큼 위로 올리고(RD.camT), 그래도 모자라면 접은 쟁반으로
  var t = $('tray'); t.classList.remove('slim'); t.classList.remove('top');
  if (uibTrayPut(t, r, tall)) return;
  t.classList.add('slim'); uibTrayPut(t, r, tall);
}
function uibTrayPut(t, r, tall) {
  var v = RD.view, cs = v.S / v.dpr, base = v.oyBase != null ? v.oyBase : v.oy, y0 = (base + r * v.S) / v.dpr - (tall ? cs * 0.7 : 0), y1 = (base + (r + 1) * v.S) / v.dpr;
  var need = y1 + 10 - t.offsetTop;   // 아래 쟁반에 가리는 높이
  if (need <= 0) { RD.camT = 0; return true; }
  var room = Math.max(0, y0 - (v.top || 0) - 4);   // 칸 위쪽이 위 막대에 닿기 전까지 올릴 수 있는 높이
  RD.camT = Math.min(need, room);
  return need <= room;
}
// v2.3.1: 웨이브 미리보기 칩이 단추 밖으로 나가지 않게 실제 폭을 재서 뒤에서부터 +N으로 접음(좁은 폰, 특수 기술 단추가 많을 때 잘리던 문제)
function uiWaveFit(b, w) {
  var br = b.getBoundingClientRect(); if (!br.width) return;
  var lim = br.right - 4, cs = [].slice.call(w.querySelectorAll('.wi1:not(.mo)')), mo = w.querySelector('.wi1.mo'), hid = mo ? (parseInt(mo.textContent.slice(1), 10) || 0) : 0;
  while (cs.length > 1 && w.lastElementChild && w.lastElementChild.getBoundingClientRect().right > lim) {
    cs.pop().remove(); hid++;
    if (!mo) { mo = document.createElement('span'); mo.className = 'wi1 mo'; w.appendChild(mo); }
    mo.textContent = '+' + hid;
  }
}
function trayClose() { var t = $('tray'); t.className = 'hide'; RD.camT = 0; document.body.classList.remove('trayopen'); UI.tray = null; UI.pick = null; UI.upPick = null; UI.fzOpts = null; UIS.sel = null; UIS.preview = null; }
// 탑 아이콘(그림이 아직 없는 탑은 대표색 동그라미로 대신)
function uibTwIcon(k, L, B, px) {
  try { return towerIconURL(k, L || 1, B || 0, px); } catch (e) { }
  var key = 'uibDot' + k + px; if (EN_ICON[key]) return EN_ICON[key];
  var c = mkC(px, px), x = cx2(c), m = px / 2; x.fillStyle = (TOWERS[k] && TOWERS[k].col) || '#b9a6e6'; x.strokeStyle = '#4a2a5a'; x.lineWidth = Math.max(2, px * 0.06);
  x.beginPath(); x.arc(m, m * 1.08, m * 0.62, 0, Math.PI * 2); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.arc(m * 0.8, m * 0.82, m * 0.18, 0, Math.PI * 2); x.fill();
  return (EN_ICON[key] = c.toDataURL());
}
// 맞히는 영역 딱지: 땅 g, 하늘 a, 바다 s (못 맞히는 영역은 흐리게). 공격하지 않는 탑(종탑, 조폐소)은 '지원'
function uibDomHtml(k, named) {
  var T = TOWERS[k]; if (!T) return '';
  if (T.kind === 'mint' || T.kind === 'aura') return '<span class="uDoms sup">지원</span>';
  var h = fdHit(k), nm = { g: '땅', a: '하늘', s: '바다' };
  if (named) return '<span class="uDoms nm">' + ['g', 'a', 's'].filter(function (d) { return h.indexOf(d) >= 0; }).map(function (d) { return '<i class="uDm ' + d + '"></i>' + nm[d]; }).join(' ') + '</span>';
  return '<span class="uDoms">' + ['g', 'a', 's'].map(function (d) { return '<i class="uDm ' + d + (h.indexOf(d) < 0 ? ' off' : '') + '"></i>'; }).join('') + '</span>';
}
// 이 칸에 이 탑을 못 짓는 이유(없으면 null): 자리(땅, 물), 도전 규칙(ruleBlocks, RULES.canBuild)
function uibWhyNot(g, k, c, r) {
  var site = fdCellSite(g, c, r); if (!TOWERS[k]) return '쓸 수 없는 탑입니다';
  if (site && fdSite(k) !== site) return fdSite(k) === 'water' ? '수상 탑은 물 위에만 세울 수 있습니다' : '물 위에는 수상 탑만 세울 수 있습니다';
  if (typeof ruleBlocks === 'function') { var why = null; try { why = ruleBlocks(g, k, c, r); } catch (e) { why = null; } if (why) return typeof why === 'string' ? why : '도전 규칙 때문에 지을 수 없습니다'; }
  if (site && !canBuildAt(g, c, r, k)) return g.M && g.M.ruleName ? '도전 규칙(' + g.M.ruleName + ') 때문에 지을 수 없습니다' : '여기에는 지을 수 없습니다';
  return null;
}
// 건설 쟁반: 편성한 탑(최대 8종)을 4 x 2로 한눈에. 이 칸에 지을 수 있는 탑만 밝게(물 칸이면 수상 탑), 탑마다 값, 맞히는 영역, 수상 표시
function trayBuild(c, r) {
  var g = G, site = fdCellSite(g, c, r) || 'land', ks = (g.towersOk || TOWER_ORDER).filter(function (k) { return TOWERS[k]; }), why = {}, coin = '<img src="' + icon('coin', 32) + '" alt="">';
  ks.forEach(function (k) { why[k] = uibWhyNot(g, k, c, r); });
  ks.sort(function (a, b) { return (why[a] ? 1 : 0) - (why[b] ? 1 : 0); });   // 지을 수 있는 탑이 앞에 (같으면 편성 순서 그대로)
  if (UI.pick && ks.indexOf(UI.pick) < 0) UI.pick = null;
  var p = UI.pick;
  UI.tray = { kind: 'build', c: c, r: r }; UIS.sel = { kind: 'cell', c: c, r: r }; UIS.preview = p && !why[p] ? { type: p } : null;
  var h = '<div class="th"><b>' + (site === 'water' ? '수상 탑 세우기' : '탑 세우기') + '</b><span class="tg">' + coin + '<i id="trGold">' + g.gold + '</i></span><button class="tx" data-a="close">닫기</button></div><div class="tgrid' + (ks.length > 8 ? ' c5' : '') + (ks.length > 10 ? ' many' : '') + '">';
  ks.forEach(function (k) {
    var cost = towerCost(g, k, 0), el = g.attr && g.attr[k], st = gcStar(k), no = why[k], wat = fdSite(k) === 'water';
    h += '<button class="tc' + (p === k ? ' sel' : '') + (no ? ' no' : cost > g.gold ? ' poor' : '') + (wat ? ' wat' : '') + '" data-a="tpick" data-k="' + k + '"' + (no ? '' : ' data-cost="' + cost + '"') + '>' + uibDomHtml(k) + '<img src="' + uibTwIcon(k, 1, 0, 72) + '" alt=""><span class="nm">' + esc(TOWERS[k].short || TOWERS[k].name) + '</span><span class="co">' + coin + cost + '</span>' +
      (wat ? '<i class="uWat">수상</i>' : '') + (el ? '<i class="tEl"><img src="' + gcElIcon(el, 32) + '" alt=""></i>' : '') + (st ? '<i class="tSt">' + st + '</i>' : '') + '</button>';
  });
  h += '</div>';
  if (p) {
    var T = TOWERS[p], pc = towerCost(g, p, 0);
    h += '<div class="uInfo"><div class="uInfoT"><div class="uInfoN"><b>' + esc(T.name) + '</b>' + uibDomHtml(p, 1) + '</div><p>' + esc(T.desc) + '</p>' + (why[p] ? '' : '<span class="hint">' + statLine(towerStats(p, 1, 0), p) + '</span>') + '</div>' +
      (why[p] ? '' : '<button class="btn gold tgo' + (pc > g.gold ? ' poor' : '') + '" data-a="tbuild" data-cost="' + pc + '"><b>건설</b><span>' + coin + pc + '</span></button>') + '</div>' +
      (why[p] ? '<div class="uNo">' + esc(why[p]) + '</div>' : '') + uiBuildMini(g, p);
  } else {
    var allNo = ks.length && ks.every(function (k) { return why[k]; });
    h += allNo ? '<div class="uNo">' + esc(why[ks[0]]) + '</div>' : '<div class="tinfo">세울 탑을 고르세요. 한 번 누르면 설명, 두 번 누르면 건설</div>';
  }
  var t = $('tray'); t.innerHTML = h; t.className = 'build'; document.body.classList.add('trayopen'); trayPos(r, 0);
}
function statLine(s, k) {
  var a = [];
  if (s.kind === 'mint') { a.push('웨이브마다 금화 +' + s.gold); if (s.interest) a.push('이자 ' + Math.round(s.interest * 100) + '% (최대 ' + s.cap + ')'); return a.join(', '); }
  if (s.kind === 'aura') { a.push('주변 탑 피해 +' + Math.round(s.aura * 100) + '%'); if (s.auraSpd) a.push('공격 속도 +' + Math.round(s.auraSpd * 100) + '%'); if (s.auraDps) a.push('초당 빛 피해 ' + s.auraDps); a.push('범위 ' + s.range.toFixed(1)); return a.join(', '); }
  if (s.kind === 'totem') { if (s.fear) a.push('둔화 ' + Math.round(s.fear * 100) + '%'); if (s.auraDps) a.push('초당 빛 피해 ' + Math.round(s.auraDps)); if (s.stun) a.push('기절'); a.push('범위 ' + (s.range || 0).toFixed(1)); if (k && TOWERS[k].air === 0) a.push('공중 공격 불가'); return a.join(', '); }
  if (s.kind === 'beam' || s.kind === 'beam2') a.push('광선 초당 ' + Math.round(s.dps0) + '~' + Math.round(s.dps1));
  else if (s.kind === 'cone') a.push('불길 초당 ' + Math.round(s.dmg * s.rate) + ', 화상 ' + Math.round(s.burn));
  else if (s.kind === 'ring') a.push('불꽃 ' + Math.round(s.dmg) + ', 화상 ' + Math.round(s.burn));
  else if (s.kind === 'pulse') a.push('냉기 ' + Math.round(s.dmg) + ', 둔화 ' + Math.round(s.slow * 100) + '%');
  else if (s.kind === 'flask') a.push('독 초당 ' + Math.round(s.poison) + ', 갑옷 -' + Math.round(s.shred * 100) + '%');
  else { a.push('공격 ' + Math.round(s.dmg) + (s.multi > 1 ? ' x' + s.multi : '')); if (s.rate) a.push('초당 ' + s.rate.toFixed(1) + '회'); }
  if (s.splash) a.push('범위 ' + s.splash.toFixed(1)); if (s.pierce) a.push('관통 ' + s.pierce); if (s.chain) a.push('연쇄 ' + s.chain); if (s.stun) a.push('기절'); if (s.freeze) a.push('빙결 ' + Math.round(s.freeze * 100) + '%'); if (s.crit) a.push('치명 ' + Math.round(s.crit * 100) + '%'); if (s.detect) a.push('은신 탐지');
  if (s.range && s.kind !== 'pulse' && s.kind !== 'ring') a.push(s.range >= 20 ? '사거리 판 전체' : '사거리 ' + s.range.toFixed(1)); else if (s.range) a.push('범위 ' + s.range.toFixed(1));
  if (k && fdHit(k).indexOf('a') < 0 && TOWERS[k].kind !== 'aura' && TOWERS[k].kind !== 'mint') a.push('공중 공격 불가');
  return a.join(', ');
}
// 잠금 해제 안내 글: 어느 판을 지키면 열리는지 (UNLOCKS의 판이 MAPS에 없으면 일반 문구)
function uibUnlockTxt(key) {
  var id = typeof UNLOCKS !== 'undefined' && UNLOCKS ? UNLOCKS[key] : null, mi = id ? fdMi(id) : -1, M = mi >= 0 ? MAPS[mi] : null;
  return M ? (M.ch || 1) + '장 ' + (M.no || mi + 1) + '판 승리 뒤에 열립니다' : '더 뒤의 판을 지키면 열립니다';
}
// 강화 칸: 보통 강화, 갈래 선택(3 → 4단계 = 변신), 궁극(5 → 6단계), 잠긴 단계는 이유
function uibUpHtml(g, t) {
  var T = TOWERS[t.k], L = t.lvl, maxL = fdMaxLv(t.k, L >= 4 ? t.br : null), coin = '<img src="' + icon('coin', 32) + '" alt="">', lk = '<img class="ulk" src="' + icon('lock', 32) + '" alt="">', up = UI.upPick, h = '';
  if (L >= maxL) return '<div class="maxed">' + (T.fusion ? '합체 탑의 최고 단계입니다' : L >= 6 ? '궁극 단계에 이르렀습니다' : '최고 단계에 이르렀습니다') + '</div>';
  if (L >= g.maxLv) {
    if (L === 3 && T.br && T.br.length) return '<div class="uLock">' + [0, 1].map(function (b) { var B = T.br[b]; return B ? '<span class="uLk1"><img src="' + uibTwIcon(t.k, 4, b, 64) + '" alt=""><b>' + esc(B.name) + '</b></span>' : ''; }).join('') + '<p>' + lk + '갈래 변신은 ' + uibUnlockTxt('branch') + '</p></div>';
    if (L === 5 && T.br && T.br[t.br] && T.br[t.br].ult) return '<div class="uLock one"><span class="uLk1"><img src="' + uibTwIcon(t.k, 6, t.br, 64) + '" alt=""><b>' + esc(T.br[t.br].ult) + '</b></span><p>' + lk + '궁극 변신은 ' + uibUnlockTxt('ult') + '</p></div>';
    return '<div class="maxed">' + lk + '다음 지역을 지키면 더 강화할 수 있습니다</div>';
  }
  if (L === 3) {
    [0, 1].forEach(function (b) {
      var B = T.br[b]; if (!B || !B.tiers || !B.tiers.length) return;
      var cost = towerCost(g, t.k, 3, b), sel = up && up.br === b;
      h += '<button class="uc br uBr' + (sel ? ' sel' : '') + (cost > g.gold ? ' poor' : '') + '" data-a="tup" data-br="' + b + '" data-cost="' + cost + '"><i class="uTag">갈래 ' + (b ? 'B' : 'A') + '</i><img src="' + uibTwIcon(t.k, 4, b, 64) + '" alt=""><b>' + esc(B.name) + '</b><em>' + coin + cost + '</em>' +
        '<span>' + (sel ? statLine(towerStats(t.k, 4, b), null) : esc(B.desc)) + '</span>' + (B.ult && B.tiers.length >= 3 ? '<small class="uUltN">궁극 ' + esc(B.ult) + '</small>' : '') + (sel ? '<strong>한 번 더 누르면 변신</strong>' : '') + '</button>';
    });
    return h;
  }
  var cost = towerCost(g, t.k, L, t.br), sel = !!(up && up.br != null), ns = towerStats(t.k, L + 1, t.br), B2 = T.br && T.br[t.br], ult = L === 5 && B2 && B2.ult;
  return '<button class="uc one' + (ult ? ' uUltC' : '') + (sel ? ' sel' : '') + (cost > g.gold ? ' poor' : '') + '" data-a="tup" data-br="' + t.br + '" data-cost="' + cost + '"><img src="' + uibTwIcon(t.k, L + 1, t.br, 64) + '" alt=""><b>' +
    (ult ? '<i class="uTag ult">궁극 변신</i>' + esc(B2.ult) : (L >= 4 && B2 ? esc(B2.name) + ' ' : '') + ROMAN[L + 1] + '단계로 강화') + '</b><span>' + statLine(ns, null) + '</span><em>' + coin + cost + '</em>' + (sel ? '<strong>한 번 더 누르면 ' + (ult ? '궁극 변신' : '강화') + '</strong>' : '') + '</button>';
}
// 합체 칸: fuseOptions(g, t)가 주는 상대마다 단추(이 탑 + 상대 = 결과). 조건이 안 되면 재료 안내, 잠겼으면 잠금 이유. 엔진 함수가 없으면 숨김
function uibFuseHtml(g, t) {
  var T = TOWERS[t.k], h = ''; UI.fzOpts = null;
  if (T.fusion || T.admin || typeof fuseOptions !== 'function' || typeof fuseTowers !== 'function') return '';
  var recs = typeof FUSIONS !== 'undefined' && FUSIONS ? FUSIONS.filter(function (f) { return (f.a === t.k || f.b === t.k) && TOWERS[f.to] && TOWERS[f.a] && TOWERS[f.b]; }) : [];
  if (!g.fuse) return t.lvl >= 5 && recs.length ? '<div class="uFzH lock"><img class="ulk" src="' + icon('lock', 32) + '" alt=""><span>합체는 ' + uibUnlockTxt('fuse') + '</span></div>' : '';
  var opts = []; try { opts = fuseOptions(g, t) || []; } catch (e) { opts = []; }
  opts = opts.filter(function (o) { return o && o['with'] && TOWERS[o.to]; }).slice(0, 2);
  if (opts.length) {
    UI.fzOpts = opts;
    opts.forEach(function (o, i) {
      var w = o['with'], sel = UI.upPick && UI.upPick.fz === i;
      h += '<button class="uFz' + (sel ? ' sel' : '') + '" data-a="fuse" data-i="' + i + '"><span class="uFzI"><img src="' + uibTwIcon(t.k, t.lvl, t.br, 48) + '" alt=""><i>+</i><img src="' + uibTwIcon(w.k, w.lvl, w.br, 48) + '" alt=""><i>=</i><img class="rs" src="' + uibTwIcon(o.to, 1, 0, 64) + '" alt=""></span>' +
        '<span class="uFzT"><b>합체 ' + esc(TOWERS[o.to].name) + '</b><span>' + (sel ? esc(String(TOWERS[o.to].desc || '').replace(/^합체: [^.]*\. ?/, '')) : '재료: 이 탑 + 옆 칸의 ' + esc(towerTitle(w.k, w.lvl, w.br))) + '</span></span>' + (sel ? '<strong>한 번 더 누르면 합체</strong>' : '') + '</button>';
    });
    return '<div class="uFzs">' + h + '</div>';
  }
  if (t.lvl < 4 || !recs.length) return '';
  var f = recs[0], other = f.a === t.k ? f.b : f.a;
  return '<div class="uFzH"><img src="' + uibTwIcon(f.to, 1, 0, 48) + '" alt=""><span><b>합체 ' + esc(TOWERS[f.to].name) + '</b> 재료: 이 탑 + 옆 칸의 ' + esc(TOWERS[other].name) + ' (둘 다 Ⅴ단계 이상)</span></div>';
}
function trayTower(t) {
  var g = G, T = TOWERS[t.k], sup = T.kind === 'mint' || T.kind === 'aura';
  UI.tray = { kind: 'tower', t: t }; UIS.sel = { kind: 'tower', t: t };
  UIS.preview = UI.upPick && UI.upPick.br != null ? { lvl: t.lvl + 1, br: UI.upPick.br } : null;
  var title = towerTitle(t.k, t.lvl, t.br);
  var h = '<div class="th"><img class="ti" src="' + uibTwIcon(t.k, t.lvl, t.br, 72) + '" alt=""><div class="tt"><b>' + esc(title) + ' <i class="lv">' + (ROMAN[t.lvl] || t.lvl) + '</i></b><span>' + uibDomHtml(t.k) + (sup ? esc(T.name) : '처치 ' + t.kills) + '</span></div><span class="tg"><img src="' + icon('coin', 32) + '" alt=""><i id="trGold">' + g.gold + '</i></span><button class="tx" data-a="close">닫기</button></div>';
  h += '<div class="tstat">' + statLine(t.st, t.k) + '</div>' + uiBuildMini(g, t.k) + '<div class="tup">' + uibUpHtml(g, t) + '</div>' + uibFuseHtml(g, t) + '<div class="trow">';
  if (!sup && T.kind !== 'pulse' && t.st.kind !== 'ring' && t.st.range) h += '<button class="btn sm" data-a="mode">목표: ' + MODE_NAME[t.mode] + '</button>';
  h += '<button class="btn sm" data-a="bview">능력</button><button class="btn sm sell" data-a="sell">판매 <img src="' + icon('coin', 32) + '" alt="">+' + sellValue(g, t) + '</button></div>';
  var tr = $('tray'); tr.innerHTML = h; tr.className = 'tower'; document.body.classList.add('trayopen'); trayPos(t.r, 1);
}
function refreshTrayCost() {
  var tr = $('tray'); if (!UI.tray || !G) return;
  var gEl = $('trGold'); if (gEl) gEl.textContent = G.gold;
  tr.querySelectorAll('[data-cost]').forEach(function (b) { b.classList.toggle('poor', +b.getAttribute('data-cost') > G.gold); });
}
function onTrayClick(ev) {
  var el = ev.target.closest('button'); if (!el || !G) return;
  ev.stopPropagation();
  if (UI.lpFired) { UI.lpFired = 0; return; }   // 길게 눌러 빌드 보기를 연 뒤 따라오는 탭은 무시
  var a = el.getAttribute('data-a'), g = G, tr = UI.tray;
  if (a === 'close') { sfx('click', 0.3); trayClose(); return; }
  // 능력 보기: [능력] 단추(bview)와 능력 한 줄(.bmini). .bmini는 data-a 이름과 상관없이 class로 먼저 가른다
  if (a === 'bview' || el.classList.contains('bmini')) { sfx('click', 0.4); uiBuildView(tr && tr.kind === 'tower' ? tr.t.k : UI.pick || (g.towersOk || TOWER_ORDER)[0]); return; }
  if (!tr) return;
  if (tr.kind === 'build') {
    if (a === 'tpick') {
      var k = el.getAttribute('data-k'), no = uibWhyNot(g, k, tr.c, tr.r);
      if (UI.pick === k && !no) { sfx('click', 0.4); doBuild(k); return; }
      sfx(no ? 'warn' : 'click', 0.4); UI.pick = k; trayBuild(tr.c, tr.r); if (no) toast(no, 1800);
      return;
    }
    if (a === 'tbuild' && UI.pick) doBuild(UI.pick);
    return;
  }
  if (tr.kind === 'tower') {
    var t = tr.t;
    if (g.towers.indexOf(t) < 0) { trayClose(); return; }
    if (a === 'tup') {
      var br = +el.getAttribute('data-br');
      if (UI.upPick && UI.upPick.br === br) {
        if (upgradeTower(g, t, br)) { UI.upPick = null; trayTower(t); if (UI.tutStep === 3) tutNext(); }
        else { sfx('warn', 0.4); toast(g.gold < towerCost(g, t.k, t.lvl, br) ? '금화가 모자랍니다' : '지금은 강화할 수 없습니다'); }
      } else { sfx('click', 0.4); UI.upPick = { br: br }; trayTower(t); }
      return;
    }
    if (a === 'fuse') {
      var i = +el.getAttribute('data-i'), o = UI.fzOpts && UI.fzOpts[i]; if (!o) return;
      if (!(UI.upPick && UI.upPick.fz === i)) { sfx('click', 0.4); UI.upPick = { fz: i }; trayTower(t); return; }
      var c0 = t.c, r0 = t.r, w = o['with'], nt = null; UI.upPick = null;
      try { nt = fuseTowers(g, t, w); } catch (e) { nt = null; }
      if (!nt) { sfx('warn', 0.4); toast('지금은 합체할 수 없습니다'); if (g.towers.indexOf(t) >= 0) trayTower(t); else trayClose(); return; }
      if (typeof nt !== 'object' || g.towers.indexOf(nt) < 0) { var ix = g.towerAt[r0 * g.cols + c0]; if (ix < 0) ix = g.towerAt[w.r * g.cols + w.c]; nt = ix >= 0 ? g.towers[ix] : null; }   // 새 탑을 안 돌려주는 구현 대비: 두 재료 자리에서 찾음
      if (nt) trayTower(nt); else trayClose();
      return;
    }
    if (a === 'mode') { t.mode = MODES[(MODES.indexOf(t.mode) + 1) % 4]; sfx('click', 0.4); trayTower(t); return; }
    if (a === 'sell') { sellTower(g, t); trayClose(); return; }
  }
}
function doBuild(k) {
  var g = G, c = UI.tray.c, r = UI.tray.r, no = uibWhyNot(g, k, c, r);
  if (no) { sfx('warn', 0.4); toast(no, 1800); return; }
  var t = buildTower(g, k, c, r);
  if (!t) { sfx('warn', 0.4); toast(g.gold < towerCost(g, k, 0) ? '금화가 모자랍니다' : '여기에는 지을 수 없습니다'); return; }
  UI.pick = null; UI.upPick = null; trayTower(t);   // v2.2: 세우면 바로 탑 칸을 열어 이어서 강화할 수 있게
  if (UI.tutStep === 1) tutNext(); else if (UI.tutStep === 2 && g.towers.length >= 2) tutNext();
}
// [UIB] 시험용 (tools/uibflow.py, uibfit.py): 탑 자료와 화면 상태, 쟁반 열기, 능력치 다시 계산
window.__uib = { TOWERS: TOWERS, UI: UI, ext: TW_EXT, has: function () { return { fuse: typeof fuseOptions === 'function' && typeof fuseTowers === 'function', adm: typeof admBattle === 'function' }; }, hasArt: function (k) { try { towerIcon(k, 1, 0, 24); return true; } catch (e) { return false; } }, build: function (c, r, k) { UI.pick = k || null; trayBuild(c, r); }, tower: function (t) { UI.upPick = null; trayTower(t); }, tower2: function (t, pick) { UI.upPick = pick; trayTower(t); }, close: function () { trayClose(); }, re: function () { reindexTowers(G); refreshStats(G); },
  fit: function () { rdLayout(G, hudTop(), hudBot()); return { S: RD.view.css, top: RD.view.top, bot: RD.view.bot, c: document.body.classList.contains('uibC') }; }, wave: function () { updateWaveBtn(true); }, hud: function () { UI.hudG = null; }, why: function (k, c, r) { return uibWhyNot(G, k, c, r); } };
// ---------- 사건 반응 ----------
function uiEvent(g, e) {
  var t = e.t;
  metaOnEvent(g, e);   // [재방문] 일일 임무 집계, 처음 처치 기록(도감 보상)
  if (t === 'wave') {
    var W = g.waves[e.i - 1];
    banner('웨이브 ' + e.i + (g.D.endless ? '' : ' / ' + e.n), e.boss ? '우두머리가 다가온다' : '', 1300);
    snapMid(g);
    if (e.i === 1 && UI.tutStep >= 1 && UI.tutStep <= 2) tutGo(3);
  } else if (t === 'boss') { banner(ENEMIES[e.k].name, '우두머리 출현', 2400, 'boss'); if (SAVE.set.music) MUSIC.play('boss'); vib(60); }
  else if (t === 'bossDie') { if (SAVE.set.music && !g.over) MUSIC.play('battle'); banner('우두머리 처치', ENEMIES[e.k].name, 1800); }
  else if (t === 'newEnemy') { if (!SAVE.seen[e.k]) { SAVE.seen[e.k] = 1; saveNow(); if (!ENEMIES[e.k].boss && e.k !== 'golemM' && e.k !== 'golemS' && e.k !== 'spider') { if (UI.modalKind === 'pick' || UI_PK.q) UI_PK.cardQ.push(e.k); else enemyCard(e.k); } } }
  else if (t === 'pick') uiPkQueue(g, e);   // v1.3 능력 카드 (gacha.js)
  else if (t === 'picked') { if (UI.tray) { if (UI.tray.kind === 'tower') trayTower(UI.tray.t); else trayBuild(UI.tray.c, UI.tray.r); } }
  else if (t === 'combo') uiComboFx(e);
  else if (t === 'win') { UI.endT = 1.6; }
  else if (t === 'lose') { UI.endT = 1.4; sfx('gateBreak', 0.8); }
  else if (t === 'kneel') { banner('최후의 화살을 쏘세요', '빛나는 버튼을 누르고 바르칸을 겨누세요', 4000, 'boss'); }
  else if (t === 'allObs') { banner('장애물을 모두 치웠다', '승리하면 깃발을 얻습니다', 1800); sfx('star', 0.6); }
  else if (t === 'foundTower') { toast('숨은 ' + TOWERS[e.k].name + '을(를) 찾았습니다'); }
  else if (t === 'early') { if (e.v > 0) toast('일찍 불러서 금화 +' + e.v); }
  else if (t === 'clear') { if (e.i <= 2) toast(e.auto ? '웨이브 정리! 3초 뒤 다음 웨이브' : '웨이브 정리! 준비되면 [다음 웨이브]', 2200); }
}
// v1.3 상성: 약점 탑(ENEMIES[k].weak)과 약점 속성(weakEl) 아이콘. 없으면 빈 글자
function uiWeakHtml(k) {
  var E = ENEMIES[k] || {}, w = Array.isArray(E.weak) ? E.weak.filter(function (q) { return TOWERS[q]; }) : [], we = Array.isArray(E.weakEl) ? E.weakEl.filter(function (q) { return GC_EL[q]; }) : (GC_EL[E.weakEl] ? [E.weakEl] : []);
  if (!w.length && !we.length) return '';
  return '<div class="weak"><span class="wk">약점</span>' + w.map(function (q) { return '<span class="wT"><img src="' + towerIconURL(q, 1, 0, 48) + '" alt=""></span>'; }).join('') + we.map(function (q) { return '<span class="wE"><img src="' + gcElIcon(q, 32) + '" alt="">' + gcElName(q) + '</span>'; }).join('') + '</div>';
}
function enemyCard(k) {
  var E = ENEMIES[k];
  UI.paused = true;
  openModal('<div class="ecard"><div class="etag">새로운 적</div><img src="' + enemyIcon(k, 120) + '"><div class="enm">' + esc(E.name) + '</div><p>' + esc(E.desc) + '</p><div class="est">체력 ' + Math.round(E.hp * HPK) + (E.armor ? ', 갑옷 ' + Math.round(E.armor * 100) + '%' : '') + (E.mres ? ', 마법 ' + (E.mres > 0 ? '저항 ' : '약점 ') + Math.round(Math.abs(E.mres) * 100) + '%' : '') + ', 속도 ' + E.spd + '</div>' + uiWeakHtml(k) + '<button class="btn gold" id="bOk">확인</button></div>', 'card');
  $('bOk').onclick = function () { sfx('click', 0.4); closeModal(); };
}
function showResult(g) {
  if (g.D.arena && typeof arResult === 'function') return arResult(g);   // v2.2 무한 차원전은 따로
  var win = g.over === 1, M = g.M, r = rec(M.id), stars = starsOf(g), before = totalStars();
  var first = win && !g.D.endless && !fdWon(M.id);   // [UIB] 이 판의 첫 승리: 확정 보상과 해금 안내
  if (typeof tfOnResult === 'function') tfOnResult(g, win);   // 타임플렉스: 시대 고증 첫 승리 보석
  if (win) {
    if (g.D.endless) { } else {
      var cap = g.dk === 'easy' ? 1 : 3; if (stars > (r[g.dk] || 0)) r[g.dk] = Math.min(cap, stars);
      if (g.stats.obsCleared === g.stats.obsTotal) r.flag = 1;
      SAVE.prog = Math.max(SAVE.prog || 0, Math.min(g.mi + 1, MAPS.length - 1));   // 옛 화면용 흔적. 열림 판정은 fdStageOpen(판 id와 별)
    }
  }
  if (g.D.endless) r.endless = Math.max(r.endless || 0, g.wave - (g.over === -1 ? 1 : 0));
  SAVE.mid = null; saveNow();
  var tks = win ? gcWinTickets(g, stars) : 0;   // [재방문] 처음 승리 +2, 별 3개 처음 +1
  var rw = null, unl = first ? uibUnlockNews(M.id) : [];   // 확정 보상 지급과 줄은 gacha.js gcStageReward(gcWinTickets 안)가 맡음
  var gain = totalStars() - before;
  if (SAVE.set.music) MUSIC.play(win ? 'victory' : 'defeat');
  var tight = (gain > 0 ? 1 : 0) + (tks > 0 ? 1 : 0) + (first && M.reward ? 1 : 0) + unl.length >= 3;   // [UIB] 알릴 것이 많으면 기록 칸을 2 x 2로 줄여 한 화면에
  var h = '<div class="res ' + (win ? 'win' : 'lose') + (tight ? ' tight' : '') + '"><div class="rt">' + (g.D.endless ? '버틴 웨이브 ' + (g.wave - 1) : win ? '승리' : '시간의 문이 무너졌다') + '</div>';
  if (win && !g.D.endless) h += '<div class="rst">' + [0, 1, 2].map(function (k) { return '<img class="s' + k + (k < stars ? ' on' : '') + '" src="' + icon(k < stars ? 'star' : 'starOff') + '">'; }).join('') + '</div>';
  h += '<div class="rgrid"><span>남은 생명<b>' + g.lives + ' / ' + g.maxLives + '</b></span><span>처치<b>' + g.stats.kills + '</b></span><span>장애물<b>' + g.stats.obsCleared + ' / ' + g.stats.obsTotal + '</b></span><span>번 금화<b>' + g.stats.goldEarned + '</b></span></div>';
  if (gain > 0) h += '<div class="rgain"><img src="' + icon('star', 48) + '">별 +' + gain + ' (공방에서 쓸 수 있습니다)</div>';
  if (tks > 0) h += '<div class="rgain tk"><img src="' + gcIcon('ticket', 48) + '">소환권 +' + tks + ' (지도에서 탑 소환)</div>';
  if (rw) h += '<div class="rgain rw">' + rw + '</div>';
  unl.forEach(function (u) { h += '<div class="uUnl"><i></i><div><b>' + esc(u[0]) + '</b><span>' + esc(u[1]) + '</span></div></div>'; });
  if (win && g.dk === 'normal' && !g.D.endless && !unl.length) h += '<div class="rhint">어려움, 무한 난이도가 열렸습니다</div>';
  if (!win && !g.D.endless) h += '<div class="rhint">' + loseTip(g) + '</div>';
  // [BM] 광고 이어하기: 진 판에서 한 번, 광고를 보면 생명 3으로 그 자리에서 계속 (logic.js metaRevive)
  var canCont = !win && !g.revives;
  if (canCont) h += '<button class="btn reward rcont" id="rCont"><span class="rl"><img src="' + uiIcon('ad', 48) + '" alt="">광고 보고 생명 3 회복하고 이어하기</span><small>한 판에 한 번만 쓸 수 있습니다</small></button>';
  if (typeof meterResHtml === 'function') h += meterResHtml(g);   // v2.2 딜미터 상위 셋
  h += '<div class="mbtns"><button class="btn" id="rMap">지도</button><button class="btn" id="rRetry">다시</button>' + (win && g.mi + 1 < MAPS.length && !g.D.endless && fdStageOpen(g.mi + 1).ok ? '<button class="btn gold" id="rNext">다음 지역</button>' : '') + '</div></div>';
  openModal(h, 'result');
  if (canCont) $('rCont').onclick = function () {
    if (G !== g || g.over !== -1 || g.revives) return;
    sfx('click', 0.4);
    metaAdShow('continue', function (ok) {
      if (!ok || G !== g || !metaRevive(g, 3)) return;
      closeModal(); UI.endT = 0; UI.paused = false; UI.lastHud = {};
      if (SAVE.set.music) MUSIC.play(g.boss && !g.boss.dead ? 'boss' : 'battle');
      updateWaveBtn(true); sfx('powerup', 0.6);
      banner('다시 지켜라', '생명 3으로 이어합니다', 1600);
    });
  };
  setTimeout(function () { $('modal').querySelectorAll('.rst img.on').forEach(function (im, i) { setTimeout(function () { im.classList.add('pop'); sfx('star', 0.5); }, i * 350); }); }, 200);
  $('rMap').onclick = function () { closeModal(); goMap(); };
  $('rRetry').onclick = function () { closeModal(); startBattle(g.mi, g.dk, false); };
  if ($('rNext')) $('rNext').onclick = function () { var nm = MAPS[g.mi + 1]; closeModal(); if (nm && (nm.ch || 1) !== (M.ch || 1)) { stopBattle(); chEnter(nm.ch || 1); return; } goMap(); setTimeout(function () { openStage(g.mi + 1); }, 60); };
  // 챕터 결말: 그 챕터 마지막 판을 처음 이기면 STORY['c1end'] 식 이야기를 한 번
  var endKey = 'c' + (M.ch || 1) + 'end', nextM = MAPS[g.mi + 1];
  // 결과 창에 4.2초 머물면 그 자리에서, 그 전에 지도로 나가면 chGo가 지도에 들어가며 보여 줌(UI.pendStory). 본 뒤에야 기록
  if (win && !g.D.endless && STORY[endKey] && !SAVE.story[endKey] && (!nextM || (nextM.ch || 1) !== (M.ch || 1))) { UI.pendStory = { key: endKey, mi: g.mi }; setTimeout(function () { if (G !== g || !UI.pendStory || UI.modalKind !== 'result') return; closeModal(); uiPlayPend(function () { goMap(); }); }, 4200); }
}
function uiPlayPend(done) {
  var P = UI.pendStory; UI.pendStory = null;
  if (!P || !STORY[P.key] || SAVE.story[P.key]) { if (done) done(); return false; }
  SAVE.story[P.key] = 1; saveNow(); playStory(STORY[P.key], done || function () { }, P.mi); return true;
}
// [UIB] 이 판을 처음 이겨 열린 것(UNLOCKS): 갈래 변신, 궁극 변신, 합체
function uibUnlockNews(id) {
  var U = typeof UNLOCKS !== 'undefined' && UNLOCKS ? UNLOCKS : {}, out = [];
  if (U.branch === id) out.push(['갈래 변신이 열렸습니다', 'Ⅲ단계 탑을 두 갈래 가운데 하나로 변신시킬 수 있습니다']);
  if (U.ult === id) out.push(['궁극 변신이 열렸습니다', 'Ⅴ단계 탑을 Ⅵ단계 궁극의 모습으로 변신시킬 수 있습니다']);
  if (U.fuse === id) out.push(['합체가 열렸습니다', 'Ⅴ단계 이상인 짝 탑 둘을 옆 칸에 두면 하나로 합칠 수 있습니다']);
  return out;
}
function loseTip(g) {
  var tips = ['장애물을 부수면 금화가 나옵니다. 웨이브 사이에 눌러 두세요.', '길이 굽는 안쪽 모퉁이에 세운 탑이 길을 가장 오래 겨눕니다.', '철갑병은 마법탑, 투석기, 대포, 연금술로 녹이세요.', '날아다니는 적은 투석기, 대포, 연금술이 못 맞힙니다. 시간의 문 근처 하늘을 지키세요.', '숨은 적은 성소 종탑이나 매의 눈이 있어야 겨눌 수 있습니다.', '서리탑을 화력 탑 사이에 두면 적이 오래 머뭅니다.', '공방에서 별로 연구를 배우면 훨씬 쉬워집니다.', '탑 하나를 끝까지 강화하면 갈래를 고를 수 있습니다.'];
  return '도움말: ' + tips[(g.mi * 3 + g.wave + SAVE.plays) % tips.length];
}
// ---------- 일시 정지, 설정, 공방, 도감 ----------
function openPause() {
  UI.paused = true; trayClose(); uibRuleTip(0);
  var g = G, R = uibRuleOf(g), adm = !!SAVE.admin;   // [UIB] 도전 규칙 설명, 관리자 단추(SAVE.admin일 때만. admBattle은 admin.js)
  openModal('<div class="pt">일시 정지</div>' + (R ? '<div class="uPRule"><b><i class="uRi"></i>도전 규칙: ' + esc(R.name) + '</b>' + (R.desc ? '<span>' + esc(R.desc) + '</span>' : '') + '</div>' : '') +
    '<div class="pbtns"><button class="btn gold" id="pRes">계속하기</button><button class="btn" id="pRetry">처음부터 다시</button><button class="btn" id="pSet">설정</button>' + (adm ? '<button class="btn uAdm" id="pAdm">관리자</button>' : '') + '<button class="btn" id="pMap">지도로 나가기</button></div>', 'pause');
  $('pRes').onclick = function () { closeModal(); };
  $('pRetry').onclick = function () { var g = G; closeModal(); SAVE.mid = null; startBattle(g.mi, g.dk, false); };
  $('pSet').onclick = function () { openSettings(true); };
  $('pMap').onclick = function () { closeModal(); goMap(); };
  if (adm) $('pAdm').onclick = function () { sfx('click', 0.4); if (typeof admBattle === 'function') admBattle(); else toast('관리자 창을 열 수 없습니다'); };
}
function openSettings(fromPause) {
  var S = SAVE.set;
  function row(k, nm) { return '<button class="srow" data-k="' + k + '"><span>' + nm + '</span><i class="' + (S[k] ? 'on' : '') + '">' + (S[k] ? '켬' : '끔') + '</i></button>'; }
  openModal('<div class="pt">설정</div>' + i18nRow(fromPause) + row('autoWave', '다음 웨이브 자동 시작') + row('sfx', '효과음') + row('music', '배경 음악') + row('vib', '진동') + row('shake', '화면 흔들림') + row('dmgNum', '피해 숫자') + '<p class="snote">소리가 안 나면 휴대폰 미디어 볼륨을 올려 주세요.</p><button class="btn danger" id="sReset">진행 기록 지우기</button><button class="xbtn" id="sClose">' + (fromPause ? '돌아가기' : '닫기') + '</button>', 'settings');
  $('modal').querySelectorAll('.srow').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-k'); S[k] = !S[k]; saveNow(); applySettings(); openSettings(fromPause); sfx('click', 0.4); }; });
  var armed = false;
  // 보석, 산 스킨, 받은 보상 기록은 남김 (meta.js metaKeepWallet)
  $('sReset').onclick = function () { if (!armed) { armed = true; $('sReset').textContent = '한 번 더 누르면 진행 기록이 지워집니다 (보석과 스킨은 남음)'; return; } SAVE = metaKeepWallet(defSave(), SAVE); saveNow(); UI.mapDrawn = 0; closeModal(); goMap(); toast('기록을 지웠습니다'); };
  $('sClose').onclick = function () { if (fromPause) openPause(); else closeModal(); };
}
function applySettings() {
  SFX.on = !!SAVE.set.sfx; MUSIC.setOn(!!SAVE.set.music);
  if (G) { var aw = !!SAVE.set.autoWave; if (aw && !G.autoWave && G.clearT > 0) G.clearT = 0.001; G.autoWave = aw; }  // 정비 중에 켜면 3초 세고 시작
}
function openResearch() {
  var avail = totalStars() - spentStars();
  var h = '<div class="pt">왕실 공방</div><div class="rsub">지역을 지켜 얻은 별로 영구 연구를 배웁니다. <span class="rs"><img src="' + icon('star', 32) + '">' + avail + '</span></div><div class="rlist">';
  RESEARCH.forEach(function (r) {
    var own = !!SAVE.res[r.id], lockReq = r.req && !SAVE.res[r.req], can = !own && !lockReq && r.cost <= avail;
    h += '<button class="ritem' + (own ? ' own' : '') + (can ? ' can' : '') + '" data-id="' + r.id + '"><div><b>' + esc(r.name) + '</b><span>' + esc(r.desc) + (lockReq ? ' (먼저 ' + RESEARCH.filter(function (q) { return q.id === r.req; })[0].name + ')' : '') + '</span></div><em>' + (own ? '배움' : '<img src="' + icon('star', 32) + '">' + r.cost) + '</em></button>';
  });
  h += '</div><div class="mbtns"><button class="btn" id="rReset">모두 되돌리기</button><button class="btn gold" id="rDone">닫기</button></div>';
  openModal(h, 'research');
  $('modal').querySelectorAll('.ritem').forEach(function (b) { b.onclick = function () { var r = RESEARCH.filter(function (q) { return q.id === b.getAttribute('data-id'); })[0]; if (SAVE.res[r.id]) return; if (r.req && !SAVE.res[r.req]) { toast('앞 연구를 먼저 배워야 합니다'); return; } if (r.cost > totalStars() - spentStars()) { toast('별이 모자랍니다'); sfx('warn', 0.4); return; } SAVE.res[r.id] = 1; saveNow(); sfx('upgrade', 0.5); openResearch(); }; });
  $('rReset').onclick = function () { SAVE.res = {}; saveNow(); openResearch(); toast('별을 모두 돌려받았습니다'); };
  $('rDone').onclick = function () { closeModal(); goMap(); };
}
function openCodex(tab, sel, byTab) { return chCodex(tab, sel, byTab); }   // v2.0 도감(chapters.js: 챕터별 적, 변신 나무, 합체)
// ---------- 첫 판 길잡이 ----------
function tutGo(n) { UI.tutStep = n; UI.tutT = 0; tutShow(); }
function tutNext() { tutGo(UI.tutStep + 1); }
function tutShow() {
  var s = UI.tutStep, el = $('tut');
  var msg = { 1: '빛나는 빈 땅을 눌러 탑을 세우세요', 2: '탑을 하나 더 세우고 아래 [전투 시작]을 누르세요', 3: '탑을 눌러 강화해 보세요. 금화는 적을 쓰러뜨리면 생깁니다', 4: '나무, 바위 같은 장애물을 누르면 탑들이 집중해서 부숩니다. 금화가 나오고 숨은 탑이 나오기도 해요', 5: '화살비: 버튼을 누르고 적이 몰린 곳을 누르세요', 6: '[다음 웨이브]는 준비되면 누르세요. 일찍 누를수록 금화를 더 받습니다' }[s];
  if (!msg) { el.classList.add('hide'); if (s > 6) { SAVE.tut.done = 1; saveNow(); UI.tutStep = 0; } return; }
  el.textContent = msg; el.classList.remove('hide');
}
function tutTick(g, dt) {
  if (!UI.tutStep) return;
  UI.tutT += dt;
  if (UI.tutStep === 1 && !UI.tutCell) { var best = null, bv = -1; var B = makeBot(g, {}); for (var r = 0; r < g.rows; r++) for (var c = 0; c < g.cols; c++) if (canBuildAt(g, c, r)) { var v = botCov(B, c + 0.5, r + 0.5, 2.6, 1); if (v > bv) { bv = v; best = [c, r]; } } UI.tutCell = best; }
  if (UI.tutStep === 1 && UI.tutCell) UIS.tutCell = UI.tutCell; else UIS.tutCell = null;
  if (UI.tutStep === 3 && UI.tutT > 14) tutNext();
  if (UI.tutStep === 4 && UI.tutT > 9) tutNext();
  if (UI.tutStep === 5 && (g.sk.rain.cd > 0 || UI.tutT > 12)) tutNext();
  if (UI.tutStep === 6 && UI.tutT > 9) tutNext();
}
