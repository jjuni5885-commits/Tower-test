// ===== tf_ui.js : 타임플렉스 화면 (시대 고증과 시간 초월, 시대 탑 지급, 장 카드 그림, 시험 고리) =====
window.__tf = { eraTowers: function () { return TF_ERA_TOWERS; }, artOf: function () { var o = {}; for (var k in ENEMIES) { var E = ENEMIES[k]; if (E.tf) o[k] = EN_DRAW[k] ? k : EN_DRAW[E.art] ? E.art : "goblin"; } return o; }, towersOf: function () { var o = {}; for (var k in TOWERS) { var T = TOWERS[k]; o[k] = [TF_ERA[k], T.kind || k]; } return o; }, frames: function (k, S) { return enemyFrames(k, S); }, tower: function (k, L, B, S) { return towerSpr(k, L, B, S); }, icon: function (k, L, B, px) { return towerIcon(k, L, B, Math.round(px)); },
  mode: function (m) { if (m) { SAVE.tfMode = m; saveNow(); } return tfModeOf(); }, loadout: function (mi) { return tfLoadout(mi); },
  goMap: function () { goMap(); }, enter: function (ch) { chEnter(ch); }, open: function (mi) { openStage(mi); }, close: function () { closeModal(); }, SAVE: function () { return SAVE; } };

// ---------- 시대 고증 / 시간 초월 ----------
function tfModeOf() { return SAVE && SAVE.tfMode === 'time' ? 'time' : 'era'; }
function tfEraOfMap(mi) { var M = MAPS[mi] || {}, C = fdChapter(M.ch || 1); return (C && C.era) || M.ch || 1; }
// 출전 편성: 시대 고증이면 편성 창과 출전 모두 이 장 시대까지의 탑만(loadout.js loUsable이 tfLoFilter를 부름), 시간 초월이면 가진 모든 탑
function tfLoFilter(own, mi) {
  if (SAVE && SAVE.admin) return own;   // v1.3 관리자 모드: 모든 탑을 모든 판에
  if (tfModeOf() === 'time') return own;
  var era = tfEraOfMap(mi); return own.filter(function (k) { var T = TOWERS[k]; return T && !T.admin && !T.fusion && tfEraOf(k) <= era; });
}
function tfLoadout(mi) { return loGet(mi); }
// 편성 창: 이 판에 시대가 맞는지(시대 고증 모드, 관리자는 늘 맞음)
function tfEraBlock(k, mi) { if (SAVE && SAVE.admin) return 0; if (tfModeOf() === 'time' || mi == null || mi < 0) return 0; var T = TOWERS[k]; if (!T || T.admin || T.fusion) return 0; return tfEraOf(k) > tfEraOfMap(mi) ? 1 : 0; }
function tfEraTag(k, mi) { var e = tfEraOf(k); return e >= 1 && e <= 15 ? (TF_ERA_NAME[e] || '') : '타 시대'; }
function tfEraPerf(k, mi) { if (tfModeOf() !== 'time' || mi == null || mi < 0) return ''; var q = tfEraMul(k, tfEraOfMap(mi)); if (Math.abs(q - 1) < 0.05) return ''; return '이 시대에서 공격력 ' + (q < 1 ? '-' : '+') + Math.round(Math.abs(q - 1) * 100) + '%'; }
function tfModeHtml(mi) {
  var m = tfModeOf(), era = tfEraOfMap(mi), M = MAPS[mi] || {};
  // v1.0: 물길 판은 배가 땅길과 따로 오니 물가에 탑을 세우라는 힌트(봇 시험에서 물가를 비우면 배가 다 새어 들어옴)
  var wet = (M.grid || []).some(function (row) { return String(row).indexOf('~') >= 0; }), wt = [];
  if (wet) { wt.push('배는 물길을 따라 시간의 문까지 내려옵니다. 땅길만 막으면 배가 그대로 들어옵니다.'); wt.push('물길과 땅길 사이 물가 칸에 탑을 세우면 배와 땅 적을 함께 막습니다.'); if (era >= 7) wt.push('수상 탑(배 모양 탑)은 물 칸에 세웁니다.'); }
  var tl = (M.tips || []).concat(M.tips && M.tips.length ? wt.slice(0, 1) : wt);
  var tip = tl.length ? '<details class="tfTip"><summary>' + (M.tips && M.tips.length ? '관문 판 공략 힌트' : '물길 판 힌트') + '</summary>' + tl.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</details>' : '';
  return tip + '<div class="tfMode"><span class="sub">탑 규칙</span>' + ['era', 'time'].map(function (k) {
    return '<button class="tfMb' + (k === m ? ' on' : '') + '" data-tfm="' + k + '"><b>' + TF_MODES[k].name + '</b><i>' + (k === 'era' ? (TF_ERA_NAME[era] || '') + ' 시대까지 탑만, 별 3' : '다른 시대 탑도, 성능은 시대에 맞춤, 별 2') + '</i></button>';
  }).join('') + '</div>';
}
// v1.3 편성 창: 시대 고증(기본)과 다른 시대 무기 고르기(시간 초월)를 따로 고름
function tfLoModeHtml(mi) {
  if (mi == null || mi < 0) return '';
  var t = tfModeOf() === 'time', era = TF_ERA_NAME[tfEraOfMap(mi)] || '';
  if (SAVE && SAVE.admin) return '<div class="loMode adm">관리자 모드: 모든 탑을 이 판에서 쓸 수 있습니다' + (t ? ' (시간 초월: 성능은 이 시대에 맞춤)' : '') + '</div>';
  return '<div class="loMode"><button class="loMB' + (t ? '' : ' on') + '" data-m="era"><b>이 시대 무기만</b><i>' + esc(era) + ' 시대까지, 별 3</i></button><button class="loMB' + (t ? ' on' : '') + '" data-m="time"><b>다른 시대 무기 고르기</b><i>성능은 이 시대에 맞게 바뀜, 별 2</i></button></div>';
}
function tfLoModeBind() {
  document.querySelectorAll('#modal .loMB').forEach(function (b) {
    b.onclick = function () {
      var m = b.getAttribute('data-m'); if (m === tfModeOf()) return;
      SAVE.tfMode = m; saveNow(); sfx('click', 0.45);
      if (m === 'era') LO.list = LO.list.filter(function (k) { return !tfEraBlock(k, LO.mi); });
      toast(m === 'time' ? '다른 시대 무기도 고를 수 있습니다. 탑 성능은 이 시대에 맞게 바뀝니다(앞선 시대 탑은 약해지고 지난 시대 탑은 강해짐). 별은 2개까지' : '이 시대까지의 무기만 가지고 들어갑니다. 별 3개', 3200);
      loOpen();
    };
  });
}
function tfModeBind(mi, reopen) {
  var box = document.querySelector('#modal .tfMode'); if (!box) return;
  box.querySelectorAll('.tfMb').forEach(function (b) {
    b.onclick = function () { var k = b.getAttribute('data-tfm'); if (k === tfModeOf()) return; sfx('click', 0.4); SAVE.tfMode = k; saveNow(); toast(TF_MODES[k].desc, 2200); reopen(); };
  });
}
// 전투 시작 때: 모드와 체력 배수를 게임에 적음 (이어하기는 저장된 모드)
function tfApplyMode(g, resume) {
  var m = resume && SAVE.mid && SAVE.mid.tfMode ? SAVE.mid.tfMode : tfModeOf();
  g.tfMode = m; g.tfHp = m === 'time' ? (TF_TIME_HP[g.dk] || 1.1) : 1;
  g.tfEraM = null;
  // v1.3 관리자 모드: 전장에서 모든 탑(6단계, 합체 포함)을 바로 씀. 편성 8종 제한 없음
  if (SAVE && SAVE.admin && typeof admTowerKeys === 'function') { g.towersOk = admTowerKeys(true); g.maxLv = 6; g.fuse = true; g.fuseOk = true; g.admin = true; }
  if (m === 'time' && g.M && !(SAVE && SAVE.admin && SAVE.admOpt && SAVE.admOpt.raw)) { var era = tfEraOfMap(g.mi); g.tfEraM = {}; for (var k in TOWERS) { var q = tfEraMul(k, era); if (q !== 1) g.tfEraM[k] = q; } if (typeof refreshStats === 'function' && g.towers) refreshStats(g); }
  if (SAVE.mid && !resume) SAVE.mid.tfMode = m;
}
// 결과: 시대 고증 첫 승리는 보석 +5 (판마다 한 번)
function tfOnResult(g, win) {
  if (!win || g.D.endless || g.tfMode !== 'era' || !g.M) return;
  if (!SAVE.tfEra || typeof SAVE.tfEra !== 'object') SAVE.tfEra = {};
  if (SAVE.tfEra[g.M.id]) return;
  SAVE.tfEra[g.M.id] = 1; SAVE.gems = (SAVE.gems || 0) + 5; saveNow();
  // 결과 창 버튼을 가리던 알림 대신 결과 창 보상 줄로 (v1.0)
  setTimeout(function () {
    var box = UI.modalKind === 'result' ? $('modal').querySelector('.res') : null;
    if (!box) { toast('시대 고증 승리 보석 +5', 1800); return; }
    var d = document.createElement('div'); d.className = 'rgain gm'; d.innerHTML = '<img src="' + uiIcon('gem', 48) + '" alt="">시대 고증 첫 승리: 보석 +5';
    var at = box.querySelector('.rhint') || box.querySelector('.rcont') || box.querySelector('.mbtns'); if (at) box.insertBefore(d, at); else box.appendChild(d);
    if (typeof uiGemsShow === 'function') uiGemsShow(false);
  }, 30);
}
// 장에 들어가면 그 시대 탑을 받음(시대 고증에 꼭 필요한 탑)
function tfGrantEra(ch) {
  var C = fdChapter(ch), list = (C && TF_ERA_TOWERS[C.era]) || [], got = [];
  list.forEach(function (k) { if (TOWERS[k] && !gcOwns(k) && (TF_START.indexOf(k) >= 0 || ch > 1)) { SAVE.towers[k] = { n: 1, star: 0 }; got.push(k); } });
  if (got.length) { saveNow(); setTimeout(function () { toast(TF_ERA_NAME[C.era] + ' 시대 탑 ' + got.map(function (k) { return TOWERS[k].name; }).join(', ') + ' 획득', 2400); }, 600); }
}

// ---------- 특수 기술 열림 판 (7판짜리 장에 맞춤) ----------
(function () {
  var need = { blizzard: 'c1s02', meteor: 'c1s04', thunder: 'c1s05', eye: 'c1s06', goldrush: 'c1s07', mend: 'c2s03', timestop: 'c2s07' };
  for (var k in need) if (SK2[k]) SK2[k].need = need[k];
})();

// ---------- 장 색과 카드 그림 ----------
var TF_PAL = {
  prim: { sky: ['#4a2f5a', '#c96a4a', '#f6c27a'], land: ['#8fae4e', '#a3bd5c', '#b8cc72'], road: ['#f3dfb6', '#b0763f'], sil: '#3a2418' },
  egypt: { sky: ['#e98a3a', '#f6c46a', '#fbe7b0'], land: ['#e8c98a', '#f0d6a0', '#f6e3b8'], road: ['#fff2d6', '#c99a5e'], sil: '#7a4a24' },
  rome: { sky: ['#4f86c6', '#9cc4ea', '#e6f0f8'], land: ['#b9c98a', '#c8d69c', '#d6e2ae'], road: ['#f4efe4', '#9a9286'], sil: '#5a5a6a' },
  three: { sky: ['#5a1a1a', '#b8402e', '#f0a060'], land: ['#a6b06a', '#b6be7a', '#c6cc8c'], road: ['#f0e2c0', '#8a5a34'], sil: '#2a1410' },
  norse: { sky: ['#1a2a4a', '#2a6a6a', '#8ae0c0'], land: ['#c8d4d8', '#d8e2e6', '#eef4f6'], road: ['#f4f8fa', '#5a6a70'], sil: '#1a2630' },
  castle: { sky: ['#3a4a6a', '#7a8aa8', '#c8ccd8'], land: ['#7a9a5a', '#8aaa6a', '#9aba7a'], road: ['#e6e0d4', '#6a6258'], sil: '#2a2a36' },
  sail: { sky: ['#1a5a8a', '#4fa0d0', '#bfe4f4'], land: ['#d8c8a0', '#e2d4ae', '#ecdfbe'], road: ['#fff6e0', '#a8743e'], sil: '#123a5a' },
  joseon: { sky: ['#2a4a6a', '#6aa0c0', '#e8e0c8'], land: ['#8dbb66', '#a2ca76', '#b9d88a'], road: ['#f8ecd0', '#8a5a3a'], sil: '#1d1726' },
  trench: { sky: ['#4a4a3a', '#8a8a6a', '#c8c0a0'], land: ['#7a6a4a', '#8a7a5a', '#9a8a6a'], road: ['#d8ccb0', '#4a3a2a'], sil: '#2a241a' },
  steel: { sky: ['#3a4a5a', '#7a8a9a', '#d0c8b0'], land: ['#c8b890', '#d6c8a0', '#e2d6b2'], road: ['#efe6d0', '#5a5040'], sil: '#22262e' },
  winter: { sky: ['#5a6a8a', '#a8b8d0', '#eef2f8'], land: ['#e4edfa', '#eef4fc', '#f8fbff'], road: ['#ffffff', '#8a94b0'], sil: '#3a4256' },
  jungle: { sky: ['#2a5a3a', '#6aa05a', '#d8e8a0'], land: ['#3e8a4a', '#4a9a56', '#5cac64'], road: ['#e8d8a8', '#6a4a2a'], sil: '#13301c' },
  dune: { sky: ['#c86a3a', '#f0a860', '#fde0a8'], land: ['#e8c080', '#f0cc90', '#f6d8a4'], road: ['#fff0d0', '#a8743e'], sil: '#6a3a1a' },
  cyber: { sky: ['#0a0f2a', '#1a2a5a', '#3a2a7a'], land: ['#1a2440', '#222e52', '#2a3864'], road: ['#5ff0ff', '#0a1020'], sil: '#5ff0ff' },
  space: { sky: ['#05030f', '#140a30', '#2a1050'], land: ['#2a2040', '#342a50', '#3e3460'], road: ['#c8b8ff', '#100820'], sil: '#c8b8ff' }
};
CHAPTERS.forEach(function (C) { var P = TF_PAL[C.mood]; if (P) UI_CH[C.id] = { rift: ['#eaffff', '#5ff0ff', '#a07bff'], sky: P.sky, land: P.land, road: P.road }; });
function tfSil(x, mood, w, h, u, rnd, col) {
  var gy = h * 0.74, i;
  x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
  function hill(y0, amp, seed) { var r = rngOf(seed); x.beginPath(); x.moveTo(-10, h); x.lineTo(-10, y0); for (var px = 0; px <= w + 40; px += 40 * u) x.quadraticCurveTo(px - 20 * u, y0 - r() * amp * 1.6, px, y0 - r() * amp); x.lineTo(w + 10, h); x.closePath(); x.fill(); }
  function tri(cx, by, hw, hh) { x.beginPath(); x.moveTo(cx - hw, by); x.lineTo(cx, by - hh); x.lineTo(cx + hw, by); x.closePath(); x.fill(); }
  function rect(x0, y0, ww, hh) { x.fillRect(x0, y0, ww, hh); }
  if (mood === 'prim') {
    x.globalAlpha = 0.35; tri(w * 0.18, gy, 60 * u, 52 * u); tri(w * 0.34, gy, 46 * u, 38 * u); x.globalAlpha = 1;
    x.fillStyle = 'rgba(255,240,230,0.6)'; tri(w * 0.18, gy - 40 * u, 14 * u, 12 * u); x.fillStyle = col;
    // 화산 연기
    x.globalAlpha = 0.5; tri(w * 0.9, gy, 50 * u, 44 * u); for (i = 0; i < 4; i++) { x.beginPath(); x.arc(w * 0.9 + i * 6 * u, gy - 48 * u - i * 10 * u, (6 + i * 3) * u, 0, 7); x.fill(); } x.globalAlpha = 1;
    hill(gy, 6 * u, 3);
    // 매머드
    var mx = w * 0.58, my = gy - 4 * u, s = 0.9 * u;
    x.beginPath(); x.ellipse(mx, my - 22 * s, 30 * s, 20 * s, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(mx + 26 * s, my - 30 * s, 14 * s, 14 * s, 0, 0, 7); x.fill();
    [[-20, 0], [-8, 0], [10, 0], [22, 0]].forEach(function (q) { rect(mx + q[0] * s - 4 * s, my - 10 * s, 8 * s, 14 * s); });
    x.lineWidth = 5 * s; x.beginPath(); x.moveTo(mx + 36 * s, my - 26 * s); x.quadraticCurveTo(mx + 44 * s, my - 6 * s, mx + 38 * s, my); x.stroke();
    x.strokeStyle = '#f4e8cc'; x.lineWidth = 3.4 * s; x.beginPath(); x.moveTo(mx + 32 * s, my - 22 * s); x.quadraticCurveTo(mx + 54 * s, my - 14 * s, mx + 52 * s, my - 34 * s); x.stroke();
  } else if (mood === 'egypt') {
    tri(w * 0.62, gy, 70 * u, 64 * u); x.globalAlpha = 0.6; tri(w * 0.8, gy, 46 * u, 40 * u); tri(w * 0.44, gy, 30 * u, 26 * u); x.globalAlpha = 1;
    hill(gy + 4 * u, 3 * u, 5); x.fillStyle = 'rgba(80,160,200,0.8)'; x.fillRect(0, gy + 10 * u, w, 7 * u); x.fillStyle = col;
    [0.12, 0.2, 0.92].forEach(function (k, j) { var px = w * k, py = gy + 4 * u; x.lineWidth = 4 * u; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 4 * u, py - 20 * u, px + 2 * u, py - 34 * u); x.stroke(); for (var q = 0; q < 5; q++) { var a = -2.6 + q * 0.55; x.beginPath(); x.ellipse(px + 2 * u + Math.cos(a) * 10 * u, py - 34 * u + Math.sin(a) * 5 * u, 11 * u, 3 * u, a, 0, 7); x.fill(); } });
  } else if (mood === 'rome') {
    hill(gy, 4 * u, 7);
    var cx = w * 0.62, cy = gy - 2 * u; x.beginPath(); x.ellipse(cx, cy - 26 * u, 70 * u, 30 * u, 0, Math.PI, 0); x.lineTo(cx + 70 * u, cy); x.lineTo(cx - 70 * u, cy); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.35)'; for (var r = 0; r < 2; r++) for (i = 0; i < 9; i++) { var ax = cx - 56 * u + i * 14 * u, ay = cy - 34 * u + r * 16 * u; x.beginPath(); x.ellipse(ax, ay, 4 * u, 6 * u, 0, Math.PI, 0); x.lineTo(ax + 4 * u, ay + 8 * u); x.lineTo(ax - 4 * u, ay + 8 * u); x.fill(); }
    x.fillStyle = col; [0.12, 0.2, 0.28].forEach(function (k) { rect(w * k - 4 * u, gy - 46 * u, 8 * u, 46 * u); rect(w * k - 7 * u, gy - 50 * u, 14 * u, 5 * u); }); rect(w * 0.1, gy - 54 * u, w * 0.2, 5 * u);
  } else {
    hill(gy, 10 * u, 9);
    x.globalAlpha = 0.85;
    if (mood === 'sail' || mood === 'joseon') { x.beginPath(); x.moveTo(w * 0.5, gy - 4 * u); x.lineTo(w * 0.72, gy - 4 * u); x.lineTo(w * 0.68, gy + 6 * u); x.lineTo(w * 0.54, gy + 6 * u); x.closePath(); x.fill(); rect(w * 0.6, gy - 46 * u, 3 * u, 42 * u); tri(w * 0.62, gy - 8 * u, 16 * u, 34 * u); }
    else if (mood === 'castle') { rect(w * 0.48, gy - 40 * u, w * 0.3, 40 * u); for (i = 0; i < 7; i++) rect(w * 0.48 + i * w * 0.045, gy - 46 * u, w * 0.025, 7 * u); rect(w * 0.6, gy - 66 * u, 20 * u, 66 * u); tri(w * 0.6 + 10 * u, gy - 66 * u, 14 * u, 20 * u); }
    else if (mood === 'space' || mood === 'cyber') { x.beginPath(); x.arc(w * 0.72, h * 0.32, 26 * u, 0, 7); x.fill(); x.globalAlpha = 0.5; x.lineWidth = 2 * u; x.beginPath(); x.ellipse(w * 0.72, h * 0.32, 44 * u, 9 * u, -0.3, 0, 7); x.stroke(); for (i = 0; i < 30; i++) { x.fillRect(rnd() * w, rnd() * h * 0.6, 1.5 * u, 1.5 * u); } }
    else if (mood === 'dune') { tri(w * 0.66, gy, 60 * u, 18 * u); tri(w * 0.3, gy, 80 * u, 14 * u); }
    else if (mood === 'jungle' || mood === 'three' || mood === 'norse' || mood === 'winter' || mood === 'trench' || mood === 'steel') { tri(w * 0.6, gy, 70 * u, 40 * u); tri(w * 0.78, gy, 40 * u, 26 * u); }
    x.globalAlpha = 1;
  }
}
function uiChCard(ch, w, h) {
  var C = fdChapter(ch), P = (C && TF_PAL[C.mood]) || TF_PAL.prim, c = mkC(w, h), x = cx2(c), u = h / 100, rnd = rngOf(40 + ch * 13);
  var sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, P.sky[0]); sky.addColorStop(0.62, P.sky[1]); sky.addColorStop(1, P.sky[2]); x.fillStyle = sky; x.fillRect(0, 0, w, h);
  glowAt(x, w * 0.2, h * 0.3, 70 * u, P.sky[2], 0.7);
  if (typeof uiRift === 'function') uiRift(x, w * 0.82, h * 0.36, h * 0.5, 12 * u, ['#eaffff', '#5ff0ff', '#a07bff'], 11 + ch, 0.85);
  tfSil(x, C ? C.mood : 'prim', w, h, u, rnd, P.sil);
  var gr = x.createLinearGradient(0, h * 0.5, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,6,20,0.45)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  return c;
}

// ---------- 타이틀 그림: 새벽 하늘 아래 거대한 시간의 문(돌 고리와 시계 바늘), 둘레에 여러 시대의 그림자 ----------
function uiTitleArt2(c) {
  var W = c.width, H = c.height, x = cx2(c), rnd = rngOf(2027), u = Math.min(W / 400, H / 700), i;
  x.lineCap = 'round'; x.lineJoin = 'round';
  var sky = x.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#05081a'); sky.addColorStop(0.32, '#10224a'); sky.addColorStop(0.56, '#1f4a6e'); sky.addColorStop(0.74, '#c87a4a'); sky.addColorStop(0.86, '#f2b766'); sky.addColorStop(1, '#2a1a1a');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);
  for (i = 0; i < 110; i++) { var sx = rnd() * W, sy = rnd() * H * 0.55; x.fillStyle = 'rgba(255,255,255,' + (0.2 + rnd() * 0.6) + ')'; x.beginPath(); x.arc(sx, sy, (0.5 + rnd() * 1.3) * u, 0, 6.3); x.fill(); }
  var dp = W / Math.max(1, window.innerWidth || W), by = Math.min(H * 0.8, H * 0.87 - 60 * dp), cxp = W / 2, gy = by - 150 * u, R = Math.min(W * 0.36, 150 * u);
  // 시대 그림자 띠(먼 땅): 피라미드, 성, 대포 범선, 로켓
  function ridge(y0, amp, seed, col) { var rr = rngOf(seed), p = new Path2D(), px = -10; p.moveTo(-10, H); p.lineTo(-10, y0); while (px < W + 20) { px += (18 + rr() * 30) * u; p.lineTo(px, y0 - rr() * amp); } p.lineTo(W + 10, H); p.closePath(); x.fillStyle = col; x.fill(p); }
  ridge(by - 30 * u, 40 * u, 3, '#2a2240');
  x.fillStyle = '#1e1832';
  x.beginPath(); x.moveTo(W * 0.04, by - 20 * u); x.lineTo(W * 0.13, by - 74 * u); x.lineTo(W * 0.22, by - 20 * u); x.fill();
  x.fillRect(W * 0.78, by - 70 * u, 26 * u, 52 * u); for (i = 0; i < 4; i++) x.fillRect(W * 0.78 + i * 7.5 * u, by - 78 * u, 4 * u, 9 * u);
  x.fillRect(W * 0.9, by - 110 * u, 5 * u, 92 * u); x.beginPath(); x.moveTo(W * 0.9 - 3 * u, by - 110 * u); x.lineTo(W * 0.9 + 2.5 * u, by - 126 * u); x.lineTo(W * 0.9 + 8 * u, by - 110 * u); x.fill();
  ridge(by - 8 * u, 22 * u, 9, '#18122a');
  // 문 뒤 빛
  glowAt(x, cxp, gy, R * 2.4, '#5ff0ff', 0.32); glowAt(x, cxp, gy, R * 1.3, '#ffe2a0', 0.25);
  // 문 안: 소용돌이치는 시간
  var inner = x.createRadialGradient(cxp, gy, 0, cxp, gy, R * 0.86); inner.addColorStop(0, '#f2ffff'); inner.addColorStop(0.3, '#7ff4ff'); inner.addColorStop(0.7, '#2a6ad0'); inner.addColorStop(1, '#1a1a5a');
  x.fillStyle = inner; x.beginPath(); x.arc(cxp, gy, R * 0.86, 0, 6.3); x.fill();
  x.save(); x.beginPath(); x.arc(cxp, gy, R * 0.86, 0, 6.3); x.clip(); x.globalCompositeOperation = 'lighter';
  for (i = 0; i < 7; i++) { x.strokeStyle = 'rgba(180,250,255,' + (0.18 + i * 0.04) + ')'; x.lineWidth = (2 + i * 0.6) * u; x.beginPath(); x.arc(cxp, gy, R * (0.15 + i * 0.1), i * 0.9, i * 0.9 + 2.4); x.stroke(); }
  x.restore();
  // 돌 고리와 눈금(시대 12칸)
  x.lineWidth = R * 0.2; x.strokeStyle = '#6a6274'; x.beginPath(); x.arc(cxp, gy, R * 0.95, 0, 6.3); x.stroke();
  x.lineWidth = R * 0.05; x.strokeStyle = '#3a3448'; x.beginPath(); x.arc(cxp, gy, R * 1.05, 0, 6.3); x.stroke(); x.beginPath(); x.arc(cxp, gy, R * 0.85, 0, 6.3); x.stroke();
  for (i = 0; i < 12; i++) { var a = i * Math.PI / 6 - Math.PI / 2, px = cxp + Math.cos(a) * R * 0.95, py = gy + Math.sin(a) * R * 0.95; x.fillStyle = i % 3 ? '#9a92a8' : '#ffd24a'; x.beginPath(); x.arc(px, py, (i % 3 ? 5 : 8) * u, 0, 6.3); x.fill(); x.strokeStyle = '#2a2436'; x.lineWidth = 2 * u; x.stroke(); }
  // 시계 바늘(검은 금속, 끝은 금)
  function hand(a, L, w) { x.save(); x.translate(cxp, gy); x.rotate(a); x.fillStyle = '#20202e'; x.beginPath(); x.moveTo(-w, 0); x.lineTo(0, -L); x.lineTo(w, 0); x.lineTo(0, L * 0.18); x.closePath(); x.fill(); x.fillStyle = '#ffd24a'; x.beginPath(); x.moveTo(-w * 0.5, -L * 0.75); x.lineTo(0, -L); x.lineTo(w * 0.5, -L * 0.75); x.closePath(); x.fill(); x.restore(); }
  hand(-0.55, R * 0.62, 9 * u); hand(0.95, R * 0.8, 6 * u); x.fillStyle = '#ffd24a'; x.beginPath(); x.arc(cxp, gy, 9 * u, 0, 6.3); x.fill();
  // 금 간 자리(침략자의 균열)
  x.strokeStyle = '#eaffff'; x.lineWidth = 2.4 * u; x.beginPath(); x.moveTo(cxp + R * 0.55, gy - R * 0.85); x.lineTo(cxp + R * 0.42, gy - R * 0.62); x.lineTo(cxp + R * 0.58, gy - R * 0.46); x.lineTo(cxp + R * 0.4, gy - R * 0.25); x.stroke();
  glowAt(x, cxp + R * 0.5, gy - R * 0.6, R * 0.35, '#a07bff', 0.5);
  // 받침 돌 기둥 둘
  [-1, 1].forEach(function (sd) { var px = cxp + sd * R * 0.82; x.fillStyle = '#4a4258'; x.fillRect(px - 16 * u, gy + R * 0.5, 32 * u, by - gy - R * 0.5 + 4 * u); x.fillStyle = '#5a5268'; x.fillRect(px - 20 * u, gy + R * 0.48, 40 * u, 9 * u); });
  // 앞 땅
  var gr = x.createLinearGradient(0, by, 0, H); gr.addColorStop(0, '#2a1e22'); gr.addColorStop(0.4, '#160f16'); gr.addColorStop(1, '#07060c');
  var gp = new Path2D(), rr2 = rngOf(17), px2 = -10; gp.moveTo(-10, H); gp.lineTo(-10, by + 6 * u); while (px2 < W + 20) { px2 += (22 + rr2() * 26) * u; gp.lineTo(px2, by + (rr2() * 8 - 2) * u); } gp.lineTo(W + 10, H); gp.closePath();
  x.fillStyle = gr; x.fill(gp);
  var vg = x.createRadialGradient(cxp, H * 0.5, H * 0.3, cxp, H * 0.5, H * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(4,4,16,0.6)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
}
// 시대 적의 연출 색: 보스 등장, 변신 고리 색은 장 번호 대신 화면 색(tfSkin)으로, 쓰러질 때 연기 색은 본보기 것 또는 흙빛
(function () {
  if (typeof RU_CH !== 'undefined') { var O = {}; for (var c in RU_CH) O[c] = RU_CH[c]; for (var i = 1; i <= 15; i++) { var s = tfSkin(i); RU_CH[i] = O[s] || O[4]; } }
  if (typeof FX_POOF !== 'undefined') for (var k in ENEMIES) { var E = ENEMIES[k]; if (E.tf && !FX_POOF[k]) FX_POOF[k] = FX_POOF[E.tpl] || '#e8dcc0'; }
})();
// 전투 위 막대 아이콘: 분홍 하트와 보라 몬스터 대신 시간 모래시계(생명)와 침략자 투구(웨이브)
var tfIcon0 = icon;
icon = function (name, px) {
  if (name !== 'life' && name !== 'skull') return tfIcon0(name, px);
  px = px || 64; var key = 'tf_' + name + px; if (ICONS[key]) return ICONS[key];
  var c = mkC(px, px), x = cx2(c), m = px / 2, s = px / 64, ink = '#21170f';
  x.lineJoin = 'round'; x.lineCap = 'round';
  if (name === 'life') {
    var g = x.createLinearGradient(0, m - 26 * s, 0, m + 26 * s); g.addColorStop(0, '#f6dc8a'); g.addColorStop(1, '#b8862a');
    // 유리
    x.beginPath(); x.moveTo(m - 15 * s, m - 21 * s); x.lineTo(m + 15 * s, m - 21 * s); x.quadraticCurveTo(m + 15 * s, m - 4 * s, m + 3 * s, m); x.quadraticCurveTo(m + 15 * s, m + 4 * s, m + 15 * s, m + 21 * s); x.lineTo(m - 15 * s, m + 21 * s); x.quadraticCurveTo(m - 15 * s, m + 4 * s, m - 3 * s, m); x.quadraticCurveTo(m - 15 * s, m - 4 * s, m - 15 * s, m - 21 * s); x.closePath();
    x.fillStyle = 'rgba(220,244,255,0.85)'; x.fill(); x.lineWidth = 2.5 * s; x.strokeStyle = ink; x.stroke();
    // 모래(푸른 시간 모래)
    x.fillStyle = '#4fd8f0'; x.beginPath(); x.moveTo(m - 10 * s, m - 12 * s); x.lineTo(m + 10 * s, m - 12 * s); x.quadraticCurveTo(m + 6 * s, m - 4 * s, m, m - 1 * s); x.quadraticCurveTo(m - 6 * s, m - 4 * s, m - 10 * s, m - 12 * s); x.fill();
    x.beginPath(); x.moveTo(m - 12 * s, m + 19 * s); x.quadraticCurveTo(m, m + 6 * s, m + 12 * s, m + 19 * s); x.closePath(); x.fill();
    x.fillRect(m - 1 * s, m - 1 * s, 2 * s, 14 * s);
    // 받침 둘
    [m - 25 * s, m + 19 * s].forEach(function (y) { x.fillStyle = g; x.beginPath(); x.roundRect ? x.roundRect(m - 21 * s, y, 42 * s, 6 * s, 3 * s) : x.rect(m - 21 * s, y, 42 * s, 6 * s); x.fill(); x.lineWidth = 2.5 * s; x.strokeStyle = ink; x.stroke(); });
  } else {
    // 침략자 투구: 쇳빛 둥근 투구, 푸른 눈 틈
    var hg = x.createLinearGradient(0, m - 24 * s, 0, m + 24 * s); hg.addColorStop(0, '#9aa4b0'); hg.addColorStop(1, '#3e4652');
    x.beginPath(); x.moveTo(m - 21 * s, m + 20 * s); x.lineTo(m - 22 * s, m - 2 * s); x.quadraticCurveTo(m - 21 * s, m - 24 * s, m, m - 25 * s); x.quadraticCurveTo(m + 21 * s, m - 24 * s, m + 22 * s, m - 2 * s); x.lineTo(m + 21 * s, m + 20 * s); x.lineTo(m + 7 * s, m + 22 * s); x.lineTo(m + 5 * s, m + 8 * s); x.lineTo(m - 5 * s, m + 8 * s); x.lineTo(m - 7 * s, m + 22 * s); x.closePath();
    x.fillStyle = hg; x.fill(); x.lineWidth = 2.5 * s; x.strokeStyle = ink; x.stroke();
    x.fillStyle = '#0c1018'; x.beginPath(); x.moveTo(m - 17 * s, m - 2 * s); x.lineTo(m + 17 * s, m - 2 * s); x.lineTo(m + 15 * s, m + 4 * s); x.lineTo(m - 15 * s, m + 4 * s); x.closePath(); x.fill();
    x.fillStyle = '#5ff0ff'; x.fillRect(m - 12 * s, m, 7 * s, 2.5 * s); x.fillRect(m + 5 * s, m, 7 * s, 2.5 * s);
    x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = 2 * s; x.beginPath(); x.moveTo(m - 12 * s, m - 14 * s); x.quadraticCurveTo(m - 6 * s, m - 20 * s, m + 2 * s, m - 21 * s); x.stroke();
    x.strokeStyle = ink; x.lineWidth = 2.5 * s; x.beginPath(); x.moveTo(m, m - 25 * s); x.lineTo(m, m - 4 * s); x.stroke();
  }
  return (ICONS[key] = c.toDataURL());
};
// 장 지도 소품: 시대마다 나무, 바위, 건물 조각
function tfMapPyr(x, X, Y, S, col) { var p = new Path2D(); p.moveTo(X - S * 0.42, Y); p.lineTo(X, Y - S * 0.5); p.lineTo(X + S * 0.42, Y); p.closePath(); uiShadow(x, X, Y, S * 0.44, S * 0.08); uiCandy(x, p, Y - S * 0.5, Y, [lit(col, 0.3), col, drk(col, 0.2)], drk(col, 0.4), S * 0.025); x.fillStyle = rgba(drk(col, 0.4), 0.35); x.beginPath(); x.moveTo(X, Y - S * 0.5); x.lineTo(X + S * 0.42, Y); x.lineTo(X + S * 0.1, Y); x.closePath(); x.fill(); }
function tfMapPalm(x, X, Y, S) { uiShadow(x, X, Y, S * 0.3, S * 0.08); x.strokeStyle = '#7a5a38'; x.lineWidth = S * 0.07; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + S * 0.12, Y - S * 0.4, X + S * 0.04, Y - S * 0.8); x.stroke(); for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + (i - 2) * 0.62, p = new Path2D(), hx = X + S * 0.04, hy = Y - S * 0.8; p.moveTo(hx, hy); p.quadraticCurveTo(hx + Math.cos(a - 0.3) * S * 0.3, hy + Math.sin(a - 0.3) * S * 0.3, hx + Math.cos(a) * S * 0.42, hy + Math.sin(a) * S * 0.42 + S * 0.14); p.quadraticCurveTo(hx + Math.cos(a + 0.2) * S * 0.2, hy + Math.sin(a + 0.2) * S * 0.2, hx, hy); uiCandy(x, p, hy - S * 0.3, hy + S * 0.2, ['#8ac060', '#5e9a40', '#3e7a30'], '#2a5020', S * 0.02); } }
function tfMapCol(x, X, Y, S, col) { uiShadow(x, X, Y, S * 0.22, S * 0.06); uiCandy(x, uiRR(X - S * 0.09, Y - S * 0.62, S * 0.18, S * 0.62, S * 0.02), Y - S * 0.62, Y, [lit(col, 0.3), col, drk(col, 0.15)], drk(col, 0.4), S * 0.025); uiCandy(x, uiRR(X - S * 0.14, Y - S * 0.7, S * 0.28, S * 0.09, S * 0.02), Y - S * 0.7, Y - S * 0.6, [lit(col, 0.3), col], drk(col, 0.4), S * 0.025); }
function tfMapStone(x, X, Y, S, col, glow) { uiShadow(x, X, Y, S * 0.18, S * 0.05); var p = new Path2D(); p.moveTo(X - S * 0.13, Y); p.lineTo(X - S * 0.15, Y - S * 0.4); p.quadraticCurveTo(X, Y - S * 0.56, X + S * 0.14, Y - S * 0.42); p.lineTo(X + S * 0.13, Y); p.closePath(); uiCandy(x, p, Y - S * 0.56, Y, [lit(col, 0.3), col, drk(col, 0.15)], drk(col, 0.4), S * 0.025); if (glow) { x.strokeStyle = glow; x.lineWidth = S * 0.035; x.beginPath(); x.moveTo(X - S * 0.03, Y - S * 0.12); x.lineTo(X - S * 0.03, Y - S * 0.36); x.moveTo(X - S * 0.03, Y - S * 0.24); x.lineTo(X + S * 0.06, Y - S * 0.32); x.stroke(); } }
function tfMapTent(x, X, Y, S, col) { var p = new Path2D(); p.moveTo(X - S * 0.34, Y); p.lineTo(X, Y - S * 0.42); p.lineTo(X + S * 0.34, Y); p.closePath(); uiShadow(x, X, Y, S * 0.36, S * 0.07); uiCandy(x, p, Y - S * 0.42, Y, [lit(col, 0.3), col, drk(col, 0.2)], drk(col, 0.45), S * 0.025); x.fillStyle = drk(col, 0.5); x.beginPath(); x.moveTo(X - S * 0.06, Y); x.lineTo(X, Y - S * 0.2); x.lineTo(X + S * 0.06, Y); x.fill(); }
function tfMapBags(x, X, Y, S) { for (var r = 0; r < 2; r++) for (var i = 0; i < 3 - r; i++) { var p = new Path2D(); p.ellipse(X + (i - 1 + r * 0.5) * S * 0.18, Y - S * 0.06 - r * S * 0.1, S * 0.1, S * 0.06, 0, 0, Math.PI * 2); uiCandy(x, p, Y - S * 0.2, Y, ['#d8c89a', '#b8a474', '#8a7a52'], '#5a4a30', S * 0.02); } }
function tfMapHedge(x, X, Y, S) { x.strokeStyle = '#3a3a3a'; x.lineWidth = S * 0.045; x.lineCap = 'round'; x.beginPath(); x.moveTo(X - S * 0.18, Y - S * 0.24); x.lineTo(X + S * 0.18, Y); x.moveTo(X + S * 0.18, Y - S * 0.24); x.lineTo(X - S * 0.18, Y); x.moveTo(X - S * 0.25, Y - S * 0.12); x.lineTo(X + S * 0.25, Y - S * 0.12); x.stroke(); }
function tfMapProp(x, M, X, Y, S, k, D) {
  if (M === 'egypt') { if (k < 0.3) tfMapPalm(x, X, Y, S); else if (k < 0.5) tfMapPyr(x, X, Y, S * 1.1, '#d8b878'); else if (k < 0.7) uiRock(x, X, Y, S * 0.8, '#c8a878'); else if (k < 0.85) uiBush(x, X, Y, S * 0.7, '#8aa050'); else tfMapCol(x, X, Y, S * 0.8, '#e0caa0'); }
  else if (M === 'rome') { if (k < 0.32) uiInkPine(x, X, Y, S * 1.1); else if (k < 0.55) tfMapCol(x, X, Y, S, '#e8e2d4'); else if (k < 0.75) uiRock(x, X, Y, S * 0.8, '#c8c0b0'); else uiBush(x, X, Y, S * 0.8, '#6e8a4a'); }
  else if (M === 'three') { if (k < 0.4) uiInkPine(x, X, Y, S * 1.1); else if (k < 0.6) tfMapTent(x, X, Y, S, '#c8483a'); else if (k < 0.8) uiRock(x, X, Y, S * 0.8, '#a8a090'); else uiBush(x, X, Y, S * 0.8, '#5e8a4a'); }
  else if (M === 'norse') { if (k < 0.45) uiPine(x, X, Y, S, '#2e5a50', 1); else if (k < 0.65) uiRock(x, X, Y, S * 0.85, '#9aa4aa'); else if (k < 0.82) tfMapStone(x, X, Y, S, '#8e9496', '#5fd8f0'); else tfMapTent(x, X, Y, S * 0.9, '#7a5a3a'); }
  else if (M === 'castle') { if (k < 0.35) uiPine(x, X, Y, S, '#3e6a4a', 0); else if (k < 0.55) uiRock(x, X, Y, S * 0.85, '#8a8a8a'); else if (k < 0.75) tfMapTent(x, X, Y, S, '#5a6a8a'); else uiBush(x, X, Y, S * 0.8, '#5a7a40'); }
  else if (M === 'sail') { if (k < 0.4) tfMapPalm(x, X, Y, S); else if (k < 0.6) uiRock(x, X, Y, S * 0.8, '#b8a888'); else if (k < 0.8) uiCrate(x, X, Y, S * 0.7, '#8a5a34'); else uiBush(x, X, Y, S * 0.8, '#6a9a50'); }
  else if (M === 'trench' || M === 'steel') { if (k < 0.35) uiDeadTree(x, X, Y, S * 1.1, '#3a3428'); else if (k < 0.6) tfMapBags(x, X, Y, S); else if (k < 0.8) tfMapHedge(x, X, Y, S); else uiCrate(x, X, Y, S * 0.7, '#5a6a40'); }
  else if (M === 'winter') { if (k < 0.5) uiPine(x, X, Y, S, '#2e4a4a', 1); else if (k < 0.7) uiRock(x, X, Y, S * 0.8, '#a8b0b8'); else if (k < 0.85) tfMapBags(x, X, Y, S); else tfMapHedge(x, X, Y, S); }
  else if (M === 'jungle') { if (k < 0.4) tfMapPalm(x, X, Y, S * 1.1); else if (k < 0.7) uiBush(x, X, Y, S, '#3e7a3a'); else if (k < 0.85) uiTree(x, X, Y, S, '#2e6a3a', null); else uiCrate(x, X, Y, S * 0.7, '#5a6a40'); }
  else if (M === 'dune') { if (k < 0.3) uiRock(x, X, Y, S * 0.9, '#c8a878'); else if (k < 0.55) tfMapBags(x, X, Y, S); else if (k < 0.75) uiCrate(x, X, Y, S * 0.7, '#a88a5a'); else tfMapPalm(x, X, Y, S); }
  else { if (k < 0.4) uiInkPine(x, X, Y, S); else uiRock(x, X, Y, S * 0.8, '#a8a092'); }
}
