// ===== main.js : 시작, 반복, 입력 =====
var LOOP = { last: 0, acc: 0, fps: 60, ftimes: [] };
function boot() {
  RD.cv = $('game'); RD.x = RD.cv.getContext('2d');
  // 날아가는 금화용 덮개 캔버스 (위 막대보다 위, 누르기는 통과)
  var fc = document.createElement('canvas'); fc.id = 'fxTop'; $('app').insertBefore(fc, $('bossbar')); RD.fxc = fc; RD.fxx = fc.getContext('2d');
  try { if (document.fonts && document.fonts.load) { document.fonts.load('20px CUTE'); document.fonts.load('20px LOGO'); document.fonts.load('800 20px PRT'); } } catch (e) { }
  setIcons();
  initTitle();
  try { SFX.init(); } catch (e) { }
  applySettings();
  // 소리 깨우기: 터치에서는 touchend, click, keydown, pointerup
  var wake = function () { try { SFX.unlock(); MUSIC.unlock(); } catch (e) { } };
  ['touchend', 'click', 'keydown', 'pointerup'].forEach(function (k) { document.addEventListener(k, wake, true); });
  $('sTitle').onclick = function () { sfx('ui', 0.6); setTimeout(function () { MUSIC.prepare('battle'); MUSIC.prepare('boss'); }, 600); goMap(); };
  $('bRes').onclick = function () { sfx('ui', 0.5); openResearch(); };
  $('bCodex').onclick = function () { sfx('ui', 0.5); openCodex('tower'); };
  $('bSet').onclick = function () { sfx('ui', 0.5); openSettings(false); };
  $('bPause').onclick = function (e) { e.stopPropagation(); sfx('click', 0.4); openPause(); };
  $('bSpeed').onclick = function (e) { e.stopPropagation(); UI.speed = UI.speed >= 3 ? 1 : UI.speed + 1; $('spdTxt').textContent = UI.speed + '배'; $('bSpeed').classList.toggle('on', UI.speed > 1); sfx('click', 0.4); };
  $('bWave').onclick = function (e) { e.stopPropagation(); if (!G || G.over) return; if (G.waiting || G.wave < G.N) { sfx('ui', 0.5); callEarly(G); updateWaveBtn(true); if (UI.tutStep === 6) tutNext(); } };
  ['rain', 'wall', 'last'].forEach(function (k) {
    $('sk_' + k).onclick = function (e) {
      e.stopPropagation(); if (!G) return;
      if (!G.unlockedSkills[k]) { toast(SKILLS[k].name + '은(는) ' + (SKILLS[k].unlock + 1) + '번째 지역부터 쓸 수 있습니다'); return; }
      if (G.sk[k].cd > 0) { toast(SKILLS[k].name + ' 준비 중: ' + Math.ceil(G.sk[k].cd) + '초'); sfx('warn', 0.3); return; }
      trayClose(); UIS.aim = UIS.aim === k ? null : k; sfx('click', 0.4);
      if (UIS.aim) toast(SKILLS[k].desc + ' 전장을 누르세요', 2200);
    };
  });
  $('tray').addEventListener('click', onTrayClick);
  // 전장 입력
  var cv = RD.cv, down = null;
  // [UIB] 빈 click 듣개: 폰 브라우저의 터치 보정이 판 가장자리 탭을 바로 옆 단추(다음 웨이브, 속도)로 끌어가지 않게, 캔버스도 '누를 수 있는 것'으로 알림
  cv.addEventListener('click', function () { });
  cv.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; if (UIS.aim) aimAt(e); });
  cv.addEventListener('pointermove', function (e) { if (UIS.aim && down) aimAt(e); });
  cv.addEventListener('pointerup', function (e) {
    if (!down || !G) { down = null; return; }
    var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (UIS.aim) { aimAt(e); castAim(); return; }
    if (moved > 14) return;
    tapWorld(e);
  });
  window.addEventListener('resize', function () { clearTimeout(LOOP.rz); LOOP.rz = setTimeout(onResize, 200); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && G && !G.over && UI.scr === 'battle' && !UI.modalOpen) openPause(); });
  // 몰래 스크롤 막기
  $('app').addEventListener('scroll', function () { $('app').scrollTop = 0; });
  requestAnimationFrame(loop);
}
// 느린 기기 자동 대응: 전투 4초 뒤부터 2초마다 평균 프레임을 보고 1단계 효과 줄이기, 2단계 해상도 1.5배
function autoQuality(dt) {
  if (!G || UI.scr !== 'battle' || UI.paused || UI.modalOpen) { LOOP.qT = 0; return; }
  LOOP.qT = (LOOP.qT || 0) + dt; LOOP.qAge = (LOOP.qAge || 0) + dt;
  if (LOOP.qAge < 4 || LOOP.qT < 2) return; LOOP.qT = 0;
  var s = 0; LOOP.ftimes.forEach(function (t) { s += t; }); var avg = s / LOOP.ftimes.length;
  if (avg < 1 / 34) return;
  if (!RD.lowFx) { RD.lowFx = 1; MAXP = 360; if (typeof RT_MAXP !== 'undefined') { RT_MAXP = 120; if (RTP.length > 120) RTP.length = 120; } }   // v2.0 탑 연출 입자(render_tw.js)도 함께 줄임
  else if (!RD.dprCap && (window.devicePixelRatio || 1) > 1.5) { RD.dprCap = 1.5; onResize(); LOOP.qAge = 0; }
}
function onResize() {
  if (UI.scr === 'battle' && G) { rdLayout(G, hudTop(), hudBot()); if (UI.tray && UI.tray.t) trayPos(UI.tray.t.r, 1); else if (UI.tray && UI.tray.r != null) trayPos(UI.tray.r, 0); }   // v2.3: 화면 크기가 바뀌어도 고른 칸이 쟁반에 안 가리게
  else if (UI.scr === 'sTitle') initTitle();
  else if (UI.scr === 'sMap') { UI.mapDrawn = 0; goMap(); }
}
function evWorld(e) { var v = RD.view, r = RD.cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) * v.dpr - v.ox) / v.S, y: ((e.clientY - r.top) * v.dpr - v.oy) / v.S }; }
function aimAt(e) { var p = evWorld(e); UIS.aimX = p.x; UIS.aimY = p.y; }
function castAim() {
  var g = G, k = UIS.aim, ok = false;
  if (k === 'rain') ok = castRain(g, UIS.aimX, UIS.aimY);
  else if (k === 'wall') { ok = castWall(g, UIS.aimX, UIS.aimY); if (!ok) toast('방책은 길 위에만 세울 수 있습니다'); }
  else if (k === 'last') ok = castLast(g, UIS.aimX, UIS.aimY);
  else if (SK2[k]) { ok = sk2Cast(g, k, UIS.aimX, UIS.aimY); if (ok) vib(25); }   // v2.2 특수 기술
  if (ok) UIS.aim = null;
}
// [UIB] 누른 자리(칸 좌표) 바로 옆 0.24칸 안의 탑이나 빈 건설 칸. 탑은 칸 위로 솟은 몸통 0.5칸도 탑으로 본다. 없으면 null
function uibSnap(g, x, y) {
  var c0 = Math.floor(x), r0 = Math.floor(y), best = null, bd = 1e9, SL = 0.24;
  for (var r = r0 - 1; r <= r0 + 1; r++) for (var c = c0 - 1; c <= c0 + 1; c++) {
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows || (c === c0 && r === r0)) continue;
    var ti = g.towerAt[r * g.cols + c], tw = ti >= 0 ? g.towers[ti] : null; if (!tw && !fdCellSite(g, c, r)) continue;
    var dx = Math.max(c - x, 0, x - (c + 1)), dy = Math.max((tw ? r - 0.5 : r) - y, 0, y - (r + 1)), d = Math.hypot(dx, dy) - (tw ? 0.02 : 0);   // 같은 거리면 탑 먼저
    if (d <= SL && d < bd) { bd = d; best = tw ? { t: tw } : { c: c, r: r }; }
  }
  return best;
}
function tapWorld(e) {
  var g = G, p = evWorld(e), c = Math.floor(p.x), r = Math.floor(p.y);
  if (g.over) return;
  var inside = c >= 0 && r >= 0 && c < g.cols && r < g.rows;
  // 탑
  if (inside && g.towerAt[r * g.cols + c] >= 0) { var t = g.towers[g.towerAt[r * g.cols + c]]; if (UI.tray && UI.tray.t === t) { trayClose(); return; } UI.upPick = null; sfx('click', 0.4); trayTower(t); return; }
  // 적, 장애물 집중
  if (setFocus(g, p.x, p.y)) { trayClose(); if (UI.tutStep === 4) tutNext(); return; }
  var site = inside ? fdCellSite(g, c, r) : null;
  // [UIB] 작은 칸 보정: 누른 칸에 아무것도 없으면(길, 바위, 판 밖) 바로 옆 탑이나 빈 건설 칸으로 붙여 줌
  if (!site) { var sn = uibSnap(g, p.x, p.y); if (sn && sn.t) { if (UI.tray && UI.tray.t === sn.t) { trayClose(); return; } UI.upPick = null; sfx('click', 0.4); trayTower(sn.t); return; } if (sn && !UI.tray) { c = sn.c; r = sn.r; inside = true; site = fdCellSite(g, c, r); } }   // 쟁반이 열려 있으면 빈 칸으로는 안 붙임(바깥을 눌러 닫기)
  // 물 칸: 가진 수상 탑이 있을 때만 건설 창, 없으면 안내
  if (site === 'water' && !(g.towersOk || TOWER_ORDER).some(function (k) { return TOWERS[k] && fdSite(k) === 'water'; })) { if (UI.tray) trayClose(); toast('물 위에는 수상 탑만 세울 수 있습니다', 1400); return; }
  if (site) {
    if (UI.tray && UI.tray.kind === 'build' && UI.tray.c === c && UI.tray.r === r) { trayClose(); return; }
    UI.pick = null; sfx('click', 0.35); trayBuild(c, r); return;
  }
  if (UI.tray) { trayClose(); return; }
  if (inside && g.kind[r * g.cols + c] === 'p') toast('길 위에는 탑을 세울 수 없습니다', 1200);
  else if (inside && g.kind[r * g.cols + c] === 'water') toast('뱃길 위에는 탑을 세울 수 없습니다', 1200);
}
function loop(ts) {
  var dt = Math.min(0.05, (ts - (LOOP.last || ts)) / 1000); LOOP.last = ts;
  try {
    if (G && UI.scr === 'battle') {
      var run = !UI.paused && !UI.modalOpen && $('story').classList.contains('hide');
      var stop = run && RD.hitStop > 0; if (stop) RD.hitStop -= dt;
      // 우두머리 처치 짧은 슬로모션: 느리게 시작해 원래 빠르기로 돌아옴 (게임과 효과 모두)
      var tsc = 1; if (RD.fxSlow > 0) { if (run && !stop) RD.fxSlow -= dt; var sq = clamp(1 - RD.fxSlow / (RD.fxSlowT || 1), 0, 1); tsc = 0.25 + 0.75 * sq * sq; }
      if (run && !stop) {
        LOOP.acc += dt * UI.speed * tsc; var n = 0;
        while (LOOP.acc >= DT && n < 10) { if (BOT) botTick(BOT, DT); stepGame(G, DT); LOOP.acc -= DT; n++; }
        if (n >= 10) LOOP.acc = 0;
        tutTick(G, dt);
        if (UI.endT > 0) { UI.endT -= dt; if (UI.endT <= 0) { UI.endT = 0; trayClose(); showResult(G); } }
      }
      rdEvents(G); RD.live = run;
      rdFrame(G, run && !stop ? dt * tsc : 0, dt);
      hudTick(G);
      if (UIS.gridHint > 0) UIS.gridHint -= dt;
    }
  } catch (err) { if (!LOOP.errShown) { LOOP.errShown = 1; console.error(err); } }
  LOOP.ftimes.push(dt); if (LOOP.ftimes.length > 60) LOOP.ftimes.shift();
  autoQuality(dt);
  requestAnimationFrame(loop);
}
// 시험용
window.__td = {
  skillIc: function (k, ch, px) { return ch >= 2 ? uiSkillIc(k, ch, px || 64) : icon(k, px || 64); },
  G: function () { return G; }, view: function () { return RD.view; }, closeModal: function () { closeModal(); }, last: function (x, y) { return castLast(G, x, y); }, start: function (mi, dk) { SAVE.story[MAPS[mi].id] = 1; startBattle(mi, dk || 'normal', false); },
  bot: function (sk) { BOT = makeBot(G, { skill: sk == null ? 1 : sk }); }, speed: function (s) { UI.speed = s; },
  st: function () { return { endT: UI.endT, err: LOOP.errShown, paused: UI.paused, modal: UI.modalOpen, kind: UI.modalKind, hs: RD.hitStop, scr: UI.scr, speed: UI.speed, story: !$('story').classList.contains('hide'), lowFx: RD.lowFx, dprCap: RD.dprCap, coins: COINS.length, pend: RD.coinPend, hGold: $('hGold').textContent }; },
  pc: function () { var o = { n: PARTS.length }; PARTS.forEach(function (p) { o[p.k] = (o[p.k] || 0) + 1; }); return o; },
  build: function (k, c, r) { return buildTower(G, k, c, r); }, upgrade: function (t, br) { return upgradeTower(G, t, br); },
  // 시험용 빨리 돌리기: 능력 카드를 기다리면(g.pickWait) 봇이 첫 카드를 고름 (화면 쪽 사건 처리 없이 돌 때 멈추지 않게)
  step: function (n) { for (var i = 0; i < n; i++) { if (G.pickWait && BOT) tdAutoPick(G); if (BOT) botTick(BOT, DT); stepGame(G, DT); } },
  SAVE: function () { return SAVE; }, EN: ENEMIES, MAPS: MAPS, unlockAll: function () { SAVE.prog = MAPS.length - 1; MAPS.forEach(function (M) { var r = rec(M.id); r.normal = 3; }); saveNow(); },
  fd: { open: function (mi) { return fdStageOpen(mi); }, unlocked: function (k) { return fdUnlocked(k); }, opts: function (mi) { return fdGameOpts(mi); }, migrate: function (raw) { return fdMigrateOld(raw); }, cur: function () { return fdCurStage(); }, spawn: function (k, pi, d) { return spawnEnemy(G, k, pi || 0, d || 0); } },
  // 시험용: 맵을 n개로 흉내(앞 맵을 복제, 2부 지역 이름). 합치지 않는 시험 전용
  fakeMaps: function (n) { var base = MAPS.length, P2 = ['구름 섬', '구름 섬', '구름 섬', '사탕 골짜기', '사탕 골짜기', '사탕 골짜기', '별빛 하늘', '별빛 하늘']; for (var i = base; i < n; i++) { var o = MAPS[i % base], c = {}; for (var k in o) c[k] = o[k]; c.id = 'c9s' + (i + 1 < 10 ? '0' : '') + (i + 1); c.ch = i < 12 ? 1 : 9; c.no = i + 1; c.region = i < 12 ? o.region : P2[(i - 12) % P2.length] || o.region; MAPS.push(c); } UI.mapDrawn = 0; return MAPS.length; },
  ownAll: function () { TOWER_ORDER.forEach(function (k) { if (!SAVE.towers[k]) SAVE.towers[k] = { n: 1, star: 0 }; }); saveNow(); },
  sheet: function (kind, px) {
    px = px || 120; var c, x, cols, i = 0;
    if (kind === 'towers') {
      var st = [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [4, 1], [5, 1]]; c = mkC(px * 7, px * TOWER_ORDER.length); x = cx2(c); x.fillStyle = '#4a5a3a'; x.fillRect(0, 0, c.width, c.height);
      TOWER_ORDER.forEach(function (k, r) { st.forEach(function (s, j) { x.drawImage(towerIcon(k, s[0], s[1], px), j * px, r * px); }); });
    } else {
      cols = 6; c = mkC(px * cols, px * Math.ceil(ENEMY_ORDER.length / cols)); x = cx2(c); x.fillStyle = '#5a6a4a'; x.fillRect(0, 0, c.width, c.height);
      ENEMY_ORDER.forEach(function (k, n) { var im = new Image(); im.src = enemyIcon(k, px); x.drawImage(im, (n % cols) * px, Math.floor(n / cols) * px); });
    }
    return c.toDataURL();
  },
  prof: function (n) {
    var x = RD.x, t0, out = { bg: 0, frame: 0 }, i;
    for (i = 0; i < n; i++) { x.getImageData(0, 0, 1, 1); t0 = performance.now(); x.drawImage(RD.bg, 0, 0); x.getImageData(0, 0, 1, 1); out.bg += performance.now() - t0; }
    PTT = {}; for (i = 0; i < n; i++) { stepGame(G, DT); rdEvents(G); x.getImageData(0, 0, 1, 1); t0 = performance.now(); PTL = 0; rdFrame(G, DT, DT); PT('end'); out.frame += performance.now() - t0; }
    for (var k in PTT) if (k !== 'cur') out[k] = +(PTT[k] / n).toFixed(2); PTT = null;
    out.bg /= n; out.frame /= n; return out;
  },
  lowFx: function (v) { RD.lowFx = v ? 1 : 0; MAXP = v ? 360 : 640; while (PARTS.length > MAXP) PARTS.shift(); if (typeof RT_MAXP !== 'undefined') { RT_MAXP = v ? 120 : 220; if (RTP.length > RT_MAXP) RTP.length = RT_MAXP; } return RD.lowFx; },   // 시험: autoQuality의 낮은 효과 단계
  fps: function () { var s = 0; LOOP.ftimes.forEach(function (t) { s += t; }); return LOOP.ftimes.length / s; }
};
function tdAutoPick(g) {
  var c = null; for (var i = g.ev.length - 1; i >= 0 && !c; i--) if (g.ev[i].t === 'pick' && g.ev[i].cards && g.ev[i].cards.length) c = g.ev[i].cards[0];
  if (!c && g.pickCards && g.pickCards.length) c = g.pickCards[0];
  if (c && typeof abilityPick === 'function') { try { abilityPick(g, c.id); } catch (e) { g.pickWait = false; } } else g.pickWait = false;
  UI_PK.q = null;
}
// ---------- 안드로이드 앱(WebView 껍데기)이 부르는 함수 ----------
// 뒤로 가기: 열린 창을 그 창의 닫기 단추로 닫고, 전투 중이면 일시 정지. 더 닫을 게 없으면 'exit'를 돌려줘 앱이 뒤로 감
window.__appBack = function () {
  try {
    // 능력 카드 창은 꼭 골라야 하므로 닫지 않음(앱은 그대로 'ok'를 받아 멈추지 않음). 소환 결과는 연출 건너뛰기 → 소환 화면
    if (UI.modalOpen && UI.modalKind === 'pick') { toast('능력 카드를 하나 골라 주세요', 1600); return 'ok'; }
    if (UI.modalOpen && UI.modalKind === 'gres') { var sk = $('grSkip'); if (sk && !sk.classList.contains('hide')) sk.click(); else if ($('grOk')) $('grOk').click(); return 'ok'; }
    if (!$('story').classList.contains('hide')) { var sk = $('stSkip'); if (sk) sk.click(); return 'ok'; }
    if (UI.modalOpen) {
      var ids = { pause: 'pRes', settings: 'sClose', result: 'rMap', card: 'bOk', research: 'rDone', gacha: 'gcClose', gprob: 'gpBack', build: 'bvClose' }, M = $('modal');
      var b = (ids[UI.modalKind] && $(ids[UI.modalKind])) || M.querySelector('#bClose') || M.querySelector('.xbtn');
      if (b) b.click(); else closeModal();
      return 'ok';
    }
    if (UIS.aim) { UIS.aim = null; return 'ok'; }
    if (UI.tray) { trayClose(); return 'ok'; }
    if (UI.scr === 'battle' && G && !G.over) { openPause(); return 'ok'; }
    return 'exit';
  } catch (e) { return 'exit'; }
};
// 앱이 뒤로 갈 때: 전투 중이면 일시 정지, 음악과 효과음 멈춤. 돌아오면 음악 다시
window.__appPause = function () {
  try { if (G && !G.over && UI.scr === 'battle' && !UI.modalOpen) openPause(); } catch (e) { }
  try { if (MUSIC.audio) MUSIC.audio.pause(); } catch (e) { }
  try { if (AC && AC.state === 'running') AC.suspend(); } catch (e) { }
};
window.__appResume = function () {
  try { if (AC && AC.state === 'suspended') AC.resume(); } catch (e) { }
  try { if (MUSIC.on && MUSIC.cur && MUSIC.audio) { var p = MUSIC.audio.play(); if (p && p.catch) p.catch(function () { }); } } catch (e) { }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
