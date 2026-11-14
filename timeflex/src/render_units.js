// ===== render_units.js : [REN2] 유닛과 판 그리기 (v2.0) =====
// 영역별 적 그리기(하늘 높이, 위에서 본 적, 바다 물살), 길 안내(뱃길, 항로, 미사일 경고), 상태 덮개(EN_OVER, TW_OVER),
// 죽는 연출(boom, ghost, ink, poof), 변신(morph), 적의 탄(ebomb, eshell), 판 규칙 연출(fog, night, blackout, meteor, airraid)
// render.js에서 부르는 곳: rdPrepare → ruPrepare / rdFrame → ruGround, ruShadows, ruSky, ruRuleOver, ruBars, ruScreen
//   drawEnemy → ruView, ruUnder, EN_OVER / drawTower → TW_OVER / killFx → ruDie, ruBossDie / drawSelectionGround → ruBuildHint
// ---- 다른 갈래와의 약속 (읽는 값) ----
// 그림: EN_DRAW[k].top이면 진행 방향으로 돌려 그림(돌림 중심은 거미와 같은 -ay * 0.75). e.form이 ENEMIES에 있는 키면 그 그림(vampire → vampbat, imugi → yong).
//       e.sub(0~1)는 k_sub 그림이 있으면 두 그림을 섞고(submarine + submarine_sub) 없으면 반투명.
// 적 상태: e.z(하늘 높이, 없으면 0.75), fade, rage, grow, sealT, markT, fearT, shield(2~4장은 챕터 색 껍질), clone(옅게), elite(금빛 고리), hopT(뛰어넘기), cast { t, T, r }(예고 고리), dark(밤에 숨김).
// 탑 상태: stunT(why가 blackout, emp면 정전 덮개), hexT, charmT, jamT. 사건 towerStun { tw, why, k }.
// 죽는 연출: kill 사건의 die 또는 ENEMIES[k].die = boom | ghost | ink | poof (없으면 ch 3 boom, ch 4 ink, ch 2 ghost). kill.form이 있으면 변신 뒤 그림으로.
// 사건: morph, towerStun, boss, wave, ruleEv { id, k }, blink, rage, phase, leap, scatter, reveal, laneWarn. blast는 다른 파일이 받고 있지 않을 때만 여기서 그림.
//       FX_EV는 사건마다 한 칸이라 뒤 파일이 FX_EV.x = fn 으로 바로 넣으면 앞의 것이 사라진다 → ruHook처럼 먼저 있던 것을 이어 부를 것.
// 규칙: g.rule.lit = [{ x, y, r, light }](밤의 밝은 곳), g.rule.marks = [{ x, y, t, T, r }](운석 예고, t는 남은 초).
// 적 탄: ebomb, eshell { x, y, z, tx, ty, u, br, big }.
// render.js의 drawBeam, arcH1(탑과 탄 구역)은 하늘 높이를 0.75로 고정해 쓴다: e.z가 달라지는 적이 생기면 ruFlyZ(e)로 바꿀 것.
// 시험: python3 tools/rushot.py [장면|all] [크기] / share [크기](내 고리가 프레임에서 차지하는 몫) / cmp <기준 빌드 폴더>
var RU = { fx: [], gates: [], guide: null, eyes: [], nightOn: 0, night: null, nightKey: '', alarm: 0, dark: 0, bossIn: null, C: {}, warn: [] };
// 지금 그리는 적 하나의 모습 값 (ruView가 채우고 drawEnemy, ruUnder, EN_OVER가 읽음)
var RUV = { k: '', top: 0, z: 0, a: 1, sc: 1, hide: 0, dx: 0, rot: 0, sea: 0, bob: 0, k2: '', mix: 0 };
// 챕터 분위기 색: [기운, 밝은 색, 어두운 색]
var RU_CH = { 1: ['#ff8fc0', '#fff0f8', '#b9a2ff'], 2: ['#9a5cff', '#ffb04a', '#2a1a48'], 3: ['#ff7a2a', '#ffe08a', '#39424e'], 4: ['#e0483c', '#f6cb4c', '#221a2a'] };
function ruCh(g) { return (g && g.M && g.M.ch) || 1; }
function ruLive() { return RD.live !== false; }

// ---------- 어떤 그림으로 그릴까 ----------
function ruArtOf(k) { var E = ENEMIES[k]; return EN_DRAW[k] || (E && EN_DRAW[E.art]) || null; }
function ruTopK(k) { var D = ruArtOf(k); return !!(D && D.top); }
// 변신 뒤 모습(e.form: 흡혈귀 → vampbat 등)이 있으면 그 그림. 잠수 모습(k_sub)은 ruView가 e.sub로 섞어 그림
function ruKey(e) {
  var k = e.k;
  if (e.form && e.form !== k && typeof e.form === 'string' && ENEMIES[e.form] && ruArtOf(e.form)) k = e.form;
  return k;
}
function ruFlyZ(e) { return e.fly ? (e.z > 0 ? e.z : 0.75) : 0; }
function ruGrow(e) { return e.grow > 0 && e.grow !== 1 ? clamp(e.grow, 0.5, 2.6) : 1; }
// 위에서 본 그림의 몸 상자(돌림 중심 기준 반길이, 반폭, 화소)
function ruTopBox(k) {
  var fr = enemyFrames(k, RD.view.S); if (fr.rtb) return fr.rtb;
  var bb = fxBodyBox(fr.fr[0]); return (fr.rtb = bb ? { hl: bb.w / 2, hw: bb.h / 2 } : { hl: fr.h * 0.42, hw: fr.h * 0.3 });
}
// 몸 가운데 높이, 머리 꼭대기 높이(칸). 처치 사건 객체(k, fly, size만 있음)에도 쓸 수 있음
function ruBodyZ(e) {
  var fl = ruFlyZ(e), k = ruKey(e);
  if (ruTopK(k)) return fl + (e.fly ? 0 : 0.1);
  var bb = fxEnBox(e); return bb ? fl + clamp(-bb.cy / RD.view.S, 0.12, 3) * ruGrow(e) : fl + EH(e) * 0.5 * ruGrow(e);
}
function ruHeadZ(e) {
  var fl = ruFlyZ(e), k = ruKey(e), sc = ruGrow(e);
  if (ruTopK(k)) { var tb = ruTopBox(k), an = Math.atan2(e.diry || 0, e.dirx || 1); return fl + (Math.abs(Math.sin(an)) * tb.hl + Math.abs(Math.cos(an)) * tb.hw) / RD.view.S * sc + 0.02; }
  var bb = fxEnBox(e); return bb ? fl + clamp((bb.h / 2 - bb.cy) / RD.view.S, 0.25, 4) * sc : fl + EH(e) * 0.95 * sc;
}
function ruView(g, e, S, time) {
  var v = RUV, k = ruKey(e);
  v.k = k; v.top = ruTopK(k) ? 1 : 0; v.a = 1; v.sc = ruGrow(e); v.hide = 0; v.dx = 0; v.rot = 0; v.bob = 0; v.sea = e.dom === 's' && !e.fly ? 1 : 0;
  var z = ruFlyZ(e); if (e.fly && !e.lane) z += Math.sin(time * 3 + e.anim * 6) * (v.top ? 0.025 : 0.05);
  v.z = z;
  if (e.fade > 0) v.a *= 1 - 0.78 * clamp(e.fade, 0, 1);
  if (e.clone) v.a *= 0.62;   // 분신은 옅게
  if (e.hopT > 0 && !e.fly) v.z = Math.sin(clamp(e.hopT / 0.45, 0, 1) * Math.PI) * 0.55;   // 방책이나 병사를 뛰어넘는 중
  v.k2 = ''; v.mix = 0;
  if (e.sub > 0) { var sk = k + '_sub'; if (ENEMIES[sk] && EN_DRAW[sk]) { v.k2 = sk; v.mix = clamp(e.sub, 0, 1); } else v.a *= 1 - 0.7 * clamp(e.sub, 0, 1); }
  if (e.fearT > 0) v.dx = Math.sin(time * 46 + e.anim * 9) * S * 0.02;
  if (v.sea) { v.bob = Math.sin(time * 2.6 + e.anim * 6); v.rot = v.bob * (v.top ? 0.03 : 0.045); }
  if (RU.nightOn && !ruLit(g, e)) v.hide = 1;
  e.ruHid = v.hide;
  return v;
}

// ---------- 구운 그림 ----------
function ruC(key, w, h, fn) { var c = RU.C[key]; if (c) return c; c = mkC(w, h); fn(cx2(c), w, h); return (RU.C[key] = c); }
// 물살: 오른쪽 끝이 뱃머리. 뒤로 벌어지는 흰 V와 가운데 거품 띠
function ruWakeSpr() {
  return ruC('wake', 160, 80, function (x, w, h) {
    var m = h / 2, g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0.95)');
    x.fillStyle = g;
    for (var sd = -1; sd <= 1; sd += 2) { x.beginPath(); x.moveTo(w, m); x.quadraticCurveTo(w * 0.6, m + sd * h * 0.2, 0, m + sd * h * 0.48); x.lineTo(w * 0.1, m + sd * h * 0.3); x.quadraticCurveTo(w * 0.6, m + sd * h * 0.1, w, m); x.fill(); }
    var g2 = x.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, 'rgba(225,246,255,0)'); g2.addColorStop(0.5, 'rgba(225,246,255,0.42)'); g2.addColorStop(1, 'rgba(240,250,255,0.75)');
    x.fillStyle = g2; x.beginPath(); x.moveTo(w * 0.96, m - h * 0.07); x.quadraticCurveTo(w * 0.5, m - h * 0.16, 0, m); x.quadraticCurveTo(w * 0.5, m + h * 0.16, w * 0.96, m + h * 0.07); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.9)'; for (var i = 0; i < 9; i++) { x.beginPath(); x.arc(w * (0.92 - i * 0.09), m + ((i * 37) % 11 - 5) * h * 0.022, Math.max(1, h * (0.06 - i * 0.005)), 0, 6.2832); x.fill(); }
  });
}
// 발밑 물결 고리 (옆모습 바다 적)
function ruFoamSpr() {
  return ruC('foam', 96, 32, function (x, w, h) {
    x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 3; x.beginPath(); x.ellipse(w / 2, h / 2, w * 0.44, h * 0.3, 0, 0, 6.2832); x.stroke();
    x.fillStyle = 'rgba(214,242,255,0.55)'; x.fill();
    x.fillStyle = '#ffffff'; for (var i = 0; i < 7; i++) { var a = i * 0.9; x.beginPath(); x.arc(w / 2 + Math.cos(a) * w * 0.42, h / 2 + Math.sin(a) * h * 0.28, 2.6 - (i % 3) * 0.5, 0, 6.2832); x.fill(); }
  });
}
// 화살표 꺾쇠(오른쪽을 가리킴): 진한 테두리 + 색
function ruChev(col) {
  return ruC('chev' + col, 48, 48, function (x) {
    // 속이 찬 화살촉 (어느 방향으로 돌려도 화살표로 읽히게)
    x.lineJoin = 'round'; x.beginPath(); x.moveTo(41, 24); x.lineTo(10, 9); x.lineTo(18, 24); x.lineTo(10, 39); x.closePath();
    x.strokeStyle = 'rgba(30,18,48,0.85)'; x.lineWidth = 9; x.stroke(); x.strokeStyle = '#ffffff'; x.lineWidth = 4.5; x.stroke(); x.fillStyle = col; x.fill();
    x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.moveTo(36, 23); x.lineTo(14, 13); x.lineTo(19, 23); x.closePath(); x.fill();
  });
}
// 경고 세모 (느낌표는 도형으로)
function ruWarnSpr() {
  return ruC('warn', 72, 72, function (x) {
    x.lineJoin = 'round'; x.beginPath(); x.moveTo(36, 8); x.lineTo(66, 60); x.lineTo(6, 60); x.closePath();
    x.strokeStyle = '#3a0d12'; x.lineWidth = 11; x.stroke(); x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.stroke();
    var g = x.createLinearGradient(0, 8, 0, 60); g.addColorStop(0, '#ff5a4a'); g.addColorStop(1, '#e01e3c'); x.fillStyle = g; x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(32, 24); x.lineTo(40, 24); x.lineTo(38, 44); x.lineTo(34, 44); x.closePath(); x.fill(); x.beginPath(); x.arc(36, 51, 3.6, 0, 6.2832); x.fill();
  });
}
// 조준 표식(표적): 주황 고리와 네 눈금
function ruReticle() {
  return ruC('ret', 96, 96, function (x) {
    var m = 48, i;
    function ring(lw, col) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.arc(m, m, 33, 0, 6.2832); x.stroke(); for (i = 0; i < 4; i++) { var a = i * Math.PI / 2; x.beginPath(); x.moveTo(m + Math.cos(a) * 24, m + Math.sin(a) * 24); x.lineTo(m + Math.cos(a) * 44, m + Math.sin(a) * 44); x.stroke(); } }
    x.lineCap = 'round'; ring(9, 'rgba(40,12,20,0.85)'); ring(5, '#ffffff'); ring(3, '#ff4a2a');
  });
}
// 봉인 부적: 누런 종이에 붉은 무늬 (글자 아님)
function ruSealSpr() {
  return ruC('seal', 40, 64, function (x) {
    x.lineJoin = 'round'; x.fillStyle = '#ffe9a0'; x.strokeStyle = '#4a2a16'; x.lineWidth = 4; x.beginPath(); x.rect(7, 5, 26, 54); x.stroke(); x.fill();
    x.fillStyle = '#fff6cf'; x.fillRect(9, 7, 22, 8);
    x.strokeStyle = '#d8283a'; x.lineWidth = 3; x.lineCap = 'round';
    x.lineWidth = 2; x.beginPath(); x.moveTo(11, 19); x.lineTo(29, 19); x.moveTo(11, 23); x.lineTo(29, 23); x.moveTo(11, 49); x.lineTo(29, 49); x.moveTo(11, 53); x.lineTo(29, 53); x.stroke();
    x.fillStyle = '#d8283a'; x.beginPath(); x.moveTo(20, 27); x.lineTo(27, 36); x.lineTo(20, 45); x.lineTo(13, 36); x.closePath(); x.fill();
    x.fillStyle = '#ffe9a0'; x.beginPath(); x.arc(20, 36, 2.6, 0, 6.2832); x.fill();
  });
}
// 불덩이(가산 혼합), 폭탄, 포탄, 운석, 먹물 얼룩, 물기둥
function ruFireSpr() {
  return ruC('fire', 128, 128, function (x) {
    var g = x.createRadialGradient(64, 64, 2, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.25, 'rgba(255,226,120,0.95)'); g.addColorStop(0.55, 'rgba(255,138,44,0.75)'); g.addColorStop(0.82, 'rgba(214,58,30,0.3)'); g.addColorStop(1, 'rgba(120,20,20,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  });
}
function ruBombSpr() {
  return ruC('bomb', 64, 96, function (x) {
    x.lineJoin = 'round'; x.strokeStyle = '#14161c'; x.lineWidth = 5;
    x.fillStyle = '#5a6470'; x.beginPath(); x.moveTo(18, 6); x.lineTo(46, 6); x.lineTo(40, 26); x.lineTo(24, 26); x.closePath(); x.stroke(); x.fill();   // 꼬리 날개
    x.fillStyle = '#3c4654'; x.beginPath(); x.moveTo(32, 92); x.bezierCurveTo(10, 74, 12, 34, 24, 22); x.lineTo(40, 22); x.bezierCurveTo(52, 34, 54, 74, 32, 92); x.closePath(); x.stroke(); x.fill();
    x.fillStyle = '#ffb21e'; x.fillRect(17, 40, 30, 8); x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(24, 56, 4, 14, 0.15, 0, 6.2832); x.fill();
    x.fillStyle = '#e8343a'; x.beginPath(); x.arc(32, 86, 5, 0, 6.2832); x.fill();
  });
}
function ruShellSpr() {
  return ruC('shell', 80, 32, function (x) {
    x.lineJoin = 'round'; x.strokeStyle = '#14161c'; x.lineWidth = 5; x.fillStyle = '#4a5360';
    x.beginPath(); x.moveTo(8, 6); x.lineTo(50, 6); x.quadraticCurveTo(72, 8, 76, 16); x.quadraticCurveTo(72, 24, 50, 26); x.lineTo(8, 26); x.closePath(); x.stroke(); x.fill();
    x.fillStyle = '#ff8a2a'; x.fillRect(16, 8, 8, 16); x.fillStyle = '#ffd23a'; x.beginPath(); x.moveTo(56, 9); x.quadraticCurveTo(70, 10, 73, 16); x.quadraticCurveTo(70, 22, 56, 23); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(12, 9, 40, 3);
  });
}
function ruRockSpr() {
  return ruC('rock', 72, 72, function (x) {
    var pts = [[36, 6], [56, 12], [66, 32], [58, 56], [36, 66], [14, 58], [6, 36], [14, 14]], i;
    x.lineJoin = 'round'; x.beginPath(); for (i = 0; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath();
    x.strokeStyle = '#2a0f0a'; x.lineWidth = 6; x.stroke(); var g = x.createRadialGradient(28, 26, 4, 36, 36, 34); g.addColorStop(0, '#ffd27a'); g.addColorStop(0.45, '#e2622a'); g.addColorStop(1, '#6a2a1e'); x.fillStyle = g; x.fill();
    x.fillStyle = 'rgba(60,20,14,0.55)'; [[44, 40, 7], [26, 46, 5], [40, 22, 4]].forEach(function (c) { x.beginPath(); x.arc(c[0], c[1], c[2], 0, 6.2832); x.fill(); });
  });
}
function ruInkSpr(i) {
  return ruC('ink' + i, 128, 128, function (x) {
    var r = rngOf(771 + i * 97), n = 14, k, a, rr; x.fillStyle = '#1d1726';
    x.beginPath(); for (k = 0; k <= n; k++) { a = k / n * 6.2832; rr = 36 + r() * 14 + (k % 3 === 0 ? 10 : 0); var px = 64 + Math.cos(a) * rr, py = 64 + Math.sin(a) * rr; if (!k) x.moveTo(px, py); else x.quadraticCurveTo(64 + Math.cos(a - 0.22) * (rr + 9), 64 + Math.sin(a - 0.22) * (rr + 9), px, py); } x.closePath(); x.fill();
    for (k = 0; k < 9; k++) { a = r() * 6.2832; rr = 50 + r() * 12; x.beginPath(); x.arc(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr, 2 + r() * 4.5, 0, 6.2832); x.fill(); }
    x.globalAlpha = 0.16; x.fillStyle = '#8a7fa8'; x.beginPath(); x.ellipse(52, 50, 20, 12, -0.5, 0, 6.2832); x.fill();
  });
}
function ruSplashSpr() {
  return ruC('splash', 64, 160, function (x) {
    var g = x.createLinearGradient(0, 0, 0, 160); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.6, 'rgba(220,244,255,0.9)'); g.addColorStop(1, 'rgba(160,220,250,0.55)');
    x.fillStyle = g; x.beginPath(); x.moveTo(10, 160); x.quadraticCurveTo(18, 70, 6, 34); x.quadraticCurveTo(16, 40, 20, 22); x.quadraticCurveTo(26, 30, 32, 4); x.quadraticCurveTo(38, 30, 44, 20); x.quadraticCurveTo(48, 40, 58, 32); x.quadraticCurveTo(46, 70, 54, 160); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(120,190,230,0.7)'; x.lineWidth = 2.5; x.stroke();
  });
}
// 보호막 껍질: 챕터별(2 어둠의 장막, 3 육각 에너지, 4 금빛 결계)
function ruShieldSpr(ch) {
  return ruC('shd' + ch, 112, 128, function (x) {
    var col = ch === 3 ? '#5fe0ff' : ch === 4 ? '#ffd24a' : '#b070ff', m = 56, my = 64, i;
    var g = x.createRadialGradient(m, my, 20, m, my, 60); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.75, rgba(col, 0.16)); g.addColorStop(1, rgba(col, 0.5));
    x.save(); x.beginPath(); x.ellipse(m, my, 50, 59, 0, 0, 6.2832); x.clip(); x.fillStyle = g; x.fillRect(0, 0, 112, 128);
    if (ch === 3) { x.strokeStyle = rgba('#ffffff', 0.5); x.lineWidth = 1.6; for (var r = -1; r < 7; r++) for (var c = -1; c < 6; c++) { var hx2 = c * 24 + (r % 2 ? 12 : 0), hy = r * 21; x.beginPath(); for (i = 0; i < 6; i++) { var a = i * Math.PI / 3 + Math.PI / 6; x.lineTo(hx2 + Math.cos(a) * 13.5, hy + Math.sin(a) * 13.5); } x.closePath(); x.stroke(); } }
    else if (ch === 4) { x.strokeStyle = rgba('#e0483c', 0.75); x.lineWidth = 3; for (i = 0; i < 8; i++) { var a2 = i * Math.PI / 4; x.beginPath(); x.moveTo(m + Math.cos(a2) * 34, my + Math.sin(a2) * 40); x.lineTo(m + Math.cos(a2) * 50, my + Math.sin(a2) * 59); x.stroke(); } }
    else { x.strokeStyle = rgba('#e6d4ff', 0.5); x.lineWidth = 2; for (i = 0; i < 5; i++) { x.beginPath(); x.arc(m, my + 70 - i * 4, 40 + i * 14, 3.5, 5.9); x.stroke(); } }
    x.restore();
    x.strokeStyle = col; x.lineWidth = 4; x.beginPath(); x.ellipse(m, my, 50, 59, 0, 0, 6.2832); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 2.5; x.lineCap = 'round'; x.beginPath(); x.ellipse(m, my, 41, 51, 0, 3.6, 4.5); x.stroke();
  });
}
// 저주 소용돌이
function ruSwirlSpr() {
  return ruC('swirl', 64, 64, function (x) {
    x.lineCap = 'round';
    function sp(lw, col) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); for (var i = 0; i <= 40; i++) { var a = i / 40 * 4.2 * Math.PI, r = 3 + i / 40 * 23; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.stroke(); }
    sp(9, 'rgba(30,10,50,0.85)'); sp(5.5, '#b46bff'); sp(2, '#f0dcff');
  });
}
// 전원 꺼짐 표시: 번개에 빗금
function ruOffSpr() {
  return ruC('off', 56, 56, function (x) {
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.fillStyle = 'rgba(20,22,40,0.88)'; x.beginPath(); x.arc(28, 28, 24, 0, 6.2832); x.fill(); x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#ffd23a'; x.beginPath(); x.moveTo(31, 9); x.lineTo(17, 31); x.lineTo(27, 31); x.lineTo(23, 47); x.lineTo(39, 24); x.lineTo(29, 24); x.closePath(); x.fill();
    x.strokeStyle = '#ff3d4a'; x.lineWidth = 5; x.beginPath(); x.moveTo(11, 45); x.lineTo(45, 11); x.stroke();
  });
}
// 흐르는 안개 한 덩이
function ruFogSpr() {
  return ruC('fog', 256, 96, function (x) {
    for (var i = 0; i < 7; i++) { var cx = 30 + i * 33, cy = 48 + ((i * 53) % 17 - 8), r = 30 + (i * 29) % 16, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(240,245,250,0.8)'); g.addColorStop(0.5, 'rgba(240,245,250,0.4)'); g.addColorStop(1, 'rgba(240,245,250,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
  });
}
// 빛 구멍(밤 덮개를 뚫는 데 씀)
function ruHoleSpr() {
  return ruC('hole', 128, 128, function (x) { var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.62, 'rgba(0,0,0,0.92)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
}

// ---------- 작은 연출 목록 (입자와 따로: 덩어리 그림을 시간에 따라 그림) ----------
function ruAdd(o) { if (RU.fx.length >= 56) RU.fx.shift(); o.t = 0; if (o.dl) o.life += o.dl; RU.fx.push(o); return o; }   // life = 보이는 시간(늦게 시작 dl은 따로 더함)
function ruFxDraw(x, S, dt, sky, time) {
  for (var i = RU.fx.length - 1; i >= 0; i--) {
    var p = RU.fx[i]; if ((p.g ? 0 : 1) !== sky) continue;
    p.t += dt; if (p.t >= p.life) { RU.fx.splice(i, 1); continue; }
    var dl = p.dl || 0; if (p.t < dl) continue;
    var u = (p.t - dl) / (p.life - dl), f = RU_FX[p.k]; if (f) f(x, p, u, S, time, dt);
  }
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.setTransform(1, 0, 0, 1, 0, 0);
}
var RU_FX = {
  // 불덩이: 확 커졌다 스러짐
  fire: function (x, p, u, S) { var r = p.r * S * (0.35 + 0.75 * easeOut(u)), X = WX(p.x), Y = WY(p.y) - (p.z || 0) * S; var a = Math.min(1, (1 - u) * 2); x.globalAlpha = a * 0.9; x.drawImage(ruFireSpr(), X - r, Y - r, r * 2, r * 2); x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * 0.55; x.drawImage(ruFireSpr(), X - r * 0.7, Y - r * 0.7, r * 1.4, r * 1.4); x.globalCompositeOperation = 'source-over'; },
  // 먹물 얼룩: 땅에 번졌다 마름
  ink: function (x, p, u, S) { var r = p.r * S * (0.25 + 0.75 * easeOut(Math.min(1, u * 3.2))), X = WX(p.x), Y = WY(p.y), c = Math.cos(p.rot), s = Math.sin(p.rot); x.globalAlpha = (u < 0.55 ? 0.82 : 0.82 * (1 - (u - 0.55) / 0.45)) * (p.a || 1); x.setTransform(c * r / 64, s * r / 64 * 0.6, -s * r / 64, c * r / 64 * 0.6, X, Y); x.drawImage(ruInkSpr(p.i || 0), -64, -64); x.setTransform(1, 0, 0, 1, 0, 0); },
  // 적 그림 한 장이 변하며 사라짐: mode 'ghost'(희게 떠오름), 'ink'(먹빛으로 주저앉음), 'fall'(돌며 떨어짐)
  body: function (x, p, u, S, time, dt) {
    var s = p.spr, X = WX(p.x), Y = WY(p.y) - (p.z || 0) * S, sx = 1, sy = 1, a = 1, rot = p.top ? p.ang : 0, oy = p.top ? 0.75 : 1, img = s.c;
    if (p.mode === 'ghost') { Y -= S * 0.9 * easeOut(u); sx = 1 + 0.1 * Math.sin(u * 14) - 0.2 * u; sy = 1 + 0.35 * u; a = 0.85 * (1 - u) * (1 - u * 0.3); X += Math.sin(u * 9 + p.ph) * S * 0.06; }
    else if (p.mode === 'ink') { var q = easeOut(u); sx = 1 + 0.4 * q; sy = 1 - 0.85 * q; a = 1 - u * u; img = p.dk || s.c; }
    else if (p.mode === 'fall') { p.vz = (p.vz || 0) - 5.5 * dt; p.z = Math.max(0, (p.z || 0) + p.vz * dt); p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; rot += u * (p.spin || 5); sx = sy = 1 - 0.3 * u; a = u > 0.85 ? (1 - u) / 0.15 : 1; if (ruLive() && Math.random() < 0.6) addP({ k: 'puff', x: p.x, y: p.y, z: p.z, vz: 0.5, life: 0.5, size: 0.11, col: '#4a4852', a: 0.8 }); if (p.z <= 0 && !p.hit) { p.hit = 1; p.life = p.t; ruBlast(p.x, p.y, 0, 0.45, 'he'); } }
    if (a <= 0.01) return;
    var c = Math.cos(rot), n = Math.sin(rot), fc = p.top ? 1 : (p.face < 0 ? -1 : 1);
    x.globalAlpha = a; x.setTransform(c * sx * fc, n * sx * fc, -n * sy, c * sy, X, Y); x.drawImage(img, -s.ax, -s.ay * oy);
    if (p.mode === 'ghost' && p.wh) { x.globalAlpha = a * 0.6; x.drawImage(p.wh.c, -p.wh.ax, -p.wh.ay * oy); }
    x.setTransform(1, 0, 0, 1, 0, 0);
  },
  // 물기둥: 솟았다 꺼짐
  splash: function (x, p, u, S) { var h = p.h * S * (u < 0.3 ? easeOut(u / 0.3) : 1 - easeIn((u - 0.3) / 0.7) * 0.7), w = p.w * S * (0.7 + 0.5 * u), X = WX(p.x), Y = WY(p.y); x.globalAlpha = u < 0.6 ? 0.95 : 0.95 * (1 - (u - 0.6) / 0.4); x.drawImage(ruSplashSpr(), X - w / 2, Y - h, w, h); },
  // 하늘에서 내리꽂는 번개
  bolt: function (x, p, u, S) {
    var pts = p.pts, i; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); for (i = 0; i < pts.length; i++) x.lineTo(WX(pts[i][0]), WY(pts[i][1]));
    x.globalAlpha = 0.5 * (1 - u); x.strokeStyle = p.col || '#9fd8ff'; x.lineWidth = S * 0.2; x.stroke(); x.globalAlpha = 1 - u; x.strokeStyle = '#ffffff'; x.lineWidth = S * 0.07; x.stroke(); x.lineCap = 'butt'; x.lineJoin = 'miter';
  },
  // 떨어지는 운석: 오른쪽 위에서 표적으로
  meteor: function (x, p, u, S, time) {
    var q = 1 - u, X = WX(p.x + q * 2.2), Y = WY(p.y) - q * S * 7, r = S * (p.r || 0.4);
    streakAt(x, X, Y, Math.atan2(7, -2.2), S * 2.6, r * 1.5, '#ff8a2a', 0.85);
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.8; x.drawImage(ruFireSpr(), X - r * 2, Y - r * 2, r * 4, r * 4); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    fxBlit(x, ruRockSpr(), X, Y, r * 2, time * 9, 1);
  }
};
// 폭발 한 방(내 연출 공용): he 주황 폭발, water 물기둥, dark 보랏빛, ink 먹
function ruBlast(wx, wy, z, r, k) {
  if (k === 'water') { ruAdd({ k: 'splash', x: wx, y: wy, w: r * 1.1, h: r * 3.2, life: 0.7 }); ringFx(wx, wy, r * 1.2, '#dff4ff', 0.5, 0.07); burst(wx, wy, 8, '#e8f8ff', 1.8, 0.6, 0.06, { k: 'drop', z: 0.3, vz: 3, grav: 9 }); return; }
  var cols = k === 'dark' ? ['#3a2658', '#5a3a88', '#241a3a'] : ['#4a4852', '#6c6974', '#2e2c36'];
  ruAdd({ k: 'fire', x: wx, y: wy, z: z, r: r * 1.5, life: 0.4 });
  fxPop(wx, wy, z, r * 0.7, k === 'dark' ? '#c9a0ff' : '#ffd27a', 0.1);
  fxPuffs(wx, wy, z, fxN(5), cols, 1.2 + r * 1.6, 0.14 + r * 0.16, 0.75, 0.06);
  burst(wx, wy, 6, '#ffd23a', 2.4 + r * 2, 0.4, 0.05, { k: 'spark', z: z, vz: 1.2, cols: ['#ffd23a', '#ff8a2a', '#ffffff'] });
  ringFx(wx, wy, r * 1.3, k === 'dark' ? '#9a5cff' : '#ffb347', 0.35, 0.06);
}

// 잠수 모습 겹쳐 그리기 (drawEnemy의 몸 그리기 변환 안에서 불림): 물속 그림자와 잠망경 그림이 e.sub만큼 진해짐
function ruSubBody(x, rv, S, idx, alpha, top) {
  var fr = enemyFrames(rv.k2, S), s = fr.fr[idx % fr.n];
  x.globalAlpha = alpha * rv.mix; x.drawImage(s.c, -s.ax, -s.ay * (top ? 0.75 : 1));
}
// ---------- 하늘 적의 땅 그림자 (높이만큼 떨어져 보이게) ----------
function ruShadows(x, g, S, time) {
  for (var i = 0; i < g.enemies.length; i++) {
    var e = g.enemies[i]; if (!e.fly || e.dead || e.ruHid) continue;
    var k = ruKey(e), sc = ruGrow(e), eh = EH(e) * sc, z = ruFlyZ(e), a = (e.fade > 0 ? 1 - 0.8 * clamp(e.fade, 0, 1) : 1) * (e.stealth && !e.revealed ? 0.3 : 1);
    var gx = WX(e.x + z * 0.1), gy = WY(e.y + 0.03);
    if (ruTopK(k)) {
      var fr = enemyFrames(k, S), sh = fr.rsh || (fr.rsh = { c: silhouette(fr.wh[0].c, '#0a0814'), ax: fr.wh[0].ax, ay: fr.wh[0].ay }), an = Math.atan2(e.diry || 0, e.dirx || 1), c = Math.cos(an) * 0.82 * sc, s = Math.sin(an) * 0.82 * sc;
      x.globalAlpha = 0.26 * a; x.setTransform(c, s, -s, c, gx, gy); x.drawImage(sh.c, -sh.ax, -sh.ay * 0.75); x.setTransform(1, 0, 0, 1, 0, 0);
    } else shadowAt(x, gx, gy, eh * S * 0.3, eh * S * 0.1, 0.3 * a);
  }
  x.globalAlpha = 1;
}
// ---------- 몸 아래: 바다 물살, 항로 비행운과 잔상 ----------
function ruUnder(x, g, e, rv, fr, idx, X, Y, S, time) {
  var ang = Math.atan2(e.diry || 0, e.dirx || 1), ca = Math.cos(ang), sa = Math.sin(ang), hh = fr.h * rv.sc;
  if (e.rage > 0) {
    // 폭주: 몸 뒤에서 타오르는 붉은 기운 (몸 그림을 가리지 않게 뒤에)
    var rcy = rv.top ? Y : Y - hh * 0.42, rp = 0.5 + 0.5 * Math.sin(time * 9 + e.anim * 5), rr = hh * (0.78 + 0.08 * rp);
    x.globalAlpha = (0.7 + 0.25 * rp) * Math.min(1, e.rage) * rv.a; x.drawImage(softSpr('#ff2a1a', 48), X - rr, rcy - rr, rr * 2, rr * 2);
    if (!RD.lowFx && g.enemies.length <= 36) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.5 * Math.min(1, e.rage); x.drawImage(glowSpr('#ff5a2a', 64), X - rr, rcy - rr, rr * 2, rr * 2); x.globalCompositeOperation = 'source-over'; }
    x.globalAlpha = 1;
  }
  if (rv.sea) {
    if (e.sub > 0.5) return;
    var L = hh * (rv.top ? 1.35 : 1.15) * (0.75 + Math.min(2.2, e.spd || 1) * 0.3), W = hh * (rv.top ? 0.78 : 0.7), tx = X + ca * hh * (rv.top ? 0.1 : 0.12), ty = Y + sa * hh * (rv.top ? 0.1 : 0.12);
    x.globalAlpha = (rv.top ? 0.55 : 0.7) * rv.a * (0.85 + 0.15 * rv.bob); x.setTransform(ca, sa, -sa, ca, tx, ty); x.drawImage(ruWakeSpr(), -L, -W / 2, L, W); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
    if (!RD.lowFx && ruLive() && Math.random() < 0.1) addP({ k: 'bubble', x: e.x - (e.dirx || 0) * 0.3 + (Math.random() - 0.5) * 0.3, y: e.y - (e.diry || 0) * 0.3 + (Math.random() - 0.5) * 0.2, z: 0, vz: 0.12, life: 0.6, size: 0.035, col: '#f2fbff', ph: Math.random() * 6 });
    return;
  }
  if (e.fly && e.lane) {
    // 비행운: 빠를수록 길게. 아주 빠르면 잔상 두 장
    var sp = e.spd || 1, bl = S * (0.8 + Math.min(5, sp) * 0.5), tl = rv.top ? hh * 0.4 : hh * 0.25, by = rv.top ? Y : Y - hh * 0.45;
    streakAt(x, X - ca * tl, by - sa * tl, ang, bl, hh * (rv.top ? 0.2 : 0.16), '#ffffff', 0.55 * rv.a);
    var eg = hh * (0.2 + 0.06 * Math.sin(time * 40 + e.anim * 9)); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.8 * rv.a; x.drawImage(glowSpr('#ff9a3a', 32), X - ca * (tl + hh * 0.08) - eg, by - sa * (tl + hh * 0.08) - eg, eg * 2, eg * 2); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    if (sp >= 3 && !RD.lowFx) {
      var s = fr.fr[idx];
      for (var q = 1; q <= 2; q++) {
        var ox = X - ca * S * 0.34 * q, oy = Y - sa * S * 0.34 * q; x.globalAlpha = (q === 1 ? 0.3 : 0.14) * rv.a;
        if (rv.top) { x.setTransform(ca, sa, -sa, ca, ox, oy); x.drawImage(s.c, -s.ax, -s.ay * 0.75); } else { x.setTransform(e.face < 0 ? -1 : 1, 0, 0, 1, ox, oy); x.drawImage(s.c, -s.ax, -s.ay); }
      }
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
    }
    if (ruLive() && !RD.lowFx && Math.random() < 0.35) addP({ k: 'puff', x: e.x - (e.dirx || 0) * 0.5, y: e.y - (e.diry || 0) * 0.5, z: rv.z, vz: 0.05, life: 0.55, size: 0.07, col: '#ffffff', a: 0.5 });
  }
}
// 밤에 불빛 밖에 있는 적: 눈빛만 (덮개 위에 그리려고 모아 둠)
function ruHidden(x, e, X, Y, S, time) {
  if (RU.eyes.length < 60) RU.eyes.push(X, RUV.top ? Y : Y - EH(e) * S * RUV.sc * 0.55, e.face < 0 ? -1 : 1, EH(e) * S, e.anim);
}

// ---------- 적 상태 덮개 (drawEnemy 끝에서 불림. X, Y = 몸 발밑, hh = 키 화소) ----------
function EN_OVER(x, g, e, X, Y, hh, time) {
  var S = RD.view.S, rv = RUV, cy = rv.top ? Y : Y - hh * 0.46, live = ruLive(), lw = Math.max(1, S * 0.03), i, lite = RD.lowFx || g.enemies.length > 36;   // lite: 붐빌 때 꾸밈 생략
  // 옆모습 바다 적: 발밑 물결
  if (rv.sea && !rv.top) { x.globalAlpha = 0.9 * rv.a; var fw = hh * 0.78 * (1 + 0.05 * rv.bob); x.drawImage(ruFoamSpr(), X - fw / 2, Y - hh * 0.09, fw, hh * 0.24); x.globalAlpha = 1; }
  // 정예(elite 규칙): 발밑 금빛 고리
  if (e.elite) { x.globalAlpha = 0.75 + 0.2 * Math.sin(time * 4 + e.anim * 6); x.strokeStyle = '#ffd23a'; x.lineWidth = Math.max(1.5, S * 0.045); x.beginPath(); x.ellipse(X, rv.top ? Y + hh * 0.1 : Y, hh * 0.36, hh * 0.12, 0, 0, 6.2832); x.stroke(); x.globalAlpha = 1; }
  // 잠수: 물거품과 흐린 그림자
  if (e.sub > 0.3) { if (live && Math.random() < 0.2) addP({ k: 'bubble', x: e.x + (Math.random() - 0.5) * 0.5, y: e.y + (Math.random() - 0.5) * 0.3, z: 0, vz: 0.2, life: 0.7, size: 0.04, col: '#dff6ff', ph: Math.random() * 6 }); }
  // 폭주: 붉은 기운 + 속도선
  if (e.rage > 0) {
    var ra = Math.min(1, e.rage), pu = 0.5 + 0.5 * Math.sin(time * 9 + e.anim * 5), dx = e.dirx || 0, dy = e.diry || 0, an = Math.atan2(dy, dx);
    if (!lite) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = (0.16 + 0.1 * pu) * ra; x.drawImage(glowSpr('#ff2a1a', 64), X - hh * 0.6, cy - hh * 0.6, hh * 1.2, hh * 1.2); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
    for (i = lite ? 2 : 0; i < 3; i++) { var ph = (time * 3.2 + i * 0.37 + e.anim) % 1, ofs = (i - 1) * hh * 0.24; streakAt(x, X - dx * hh * (0.3 + ph * 0.6) - dy * ofs, cy - dy * hh * (0.3 + ph * 0.6) + dx * ofs, an, hh * 0.75, Math.max(3, hh * 0.11), '#ff3a2a', (1 - ph) * ra); }
    if (live && Math.random() < 0.2) addP({ k: 'flame', x: e.x + (Math.random() - 0.5) * 0.3, y: e.y, z: ruFlyZ(e) + Math.random() * 0.5, vz: 0.7, life: 0.4, size: 0.06, col: '#ff4a3a' });
  }
  // 커짐(어둑시니): 몸집에 비례해 발밑 어둠이 짙어지고 가끔 그림자 조각이 피어오름
  if (e.grow > 1.03) {
    var gk = Math.min(1, (e.grow - 1) / 1.2); x.globalAlpha = 0.35 + 0.35 * gk; x.drawImage(softSpr('#2a1648', 48), X - hh * 0.62, Y - hh * 0.2, hh * 1.24, hh * 0.44); x.globalAlpha = 1;
    if (live && Math.random() < 0.08 + gk * 0.16) addP({ k: 'puff', x: e.x + (Math.random() - 0.5) * 0.5, y: e.y, z: 0.05, vz: 0.5, life: 0.7, size: 0.07 + gk * 0.05, col: '#3a2460', a: 0.7 });
  }
  // 공포: 푸른 기운, 식은땀
  if (e.fearT > 0) {
    if (!lite) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.3; x.drawImage(glowSpr('#5a7cff', 32), X - hh * 0.5, cy - hh * 0.55, hh, hh * 1.1); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
    var di = fxImg('drop', '#8fd0ff', S * 0.2), top = rv.top ? Y - hh * 0.4 : Y - hh * 0.98;
    for (i = lite ? 1 : 0; i < 2; i++) { var fp = (time * 1.8 + i * 0.5 + e.anim) % 1, sd = i ? 1 : -1, d0 = Math.max(6, S * 0.17) * (1 - fp * 0.4); x.globalAlpha = 1 - fp; x.drawImage(di, X + sd * (hh * 0.26 + fp * S * 0.22) - d0 / 2, top - Math.sin(fp * 3.14) * S * 0.2 + fp * S * 0.12 - d0 / 2, d0, d0); }
    x.globalAlpha = 1;
  }
  // 보호막: 2~4장 적은 챕터 색 껍질 (1장 적은 기존 연보라 고리)
  if (e.shield > 0 && e.E && e.E.ch > 1) { var sw = hh * (rv.top ? 1.15 : 1.08), sh2 = hh * (rv.top ? 1.0 : 1.22); x.globalAlpha = 0.72 + 0.16 * Math.sin(time * 5 + e.anim * 4); x.drawImage(ruShieldSpr(e.E.ch), X - sw / 2, cy - sh2 / 2, sw, sh2); x.globalAlpha = 1; }
  // 봉인: 사슬 고리 + 부적
  if (e.sealT > 0) {
    var sa2 = Math.min(1, e.sealT * 3), rx = hh * 0.46, ry = hh * 0.16;
    x.globalAlpha = sa2; x.beginPath(); x.ellipse(X, cy, rx, ry, -0.25, 0, 6.2832);
    if (!lite) { x.strokeStyle = 'rgba(60,24,10,0.8)'; x.lineWidth = lw * 2.2; x.stroke(); }
    x.strokeStyle = '#ffd24a'; x.lineWidth = lw * 1.2; x.stroke();
    var tw = clamp(hh * 0.3, S * 0.24, S * 0.5), th = tw * 1.6, wob = Math.sin(time * 4 + e.anim * 7) * 0.12;
    x.save(); x.translate(X + hh * 0.04, cy - hh * 0.2); x.rotate(0.14 + wob); x.drawImage(ruSealSpr(), -tw / 2, -th * 0.15, tw, th); x.restore(); x.globalAlpha = 1;
  }
  // 표식: 돌아가는 조준 고리
  if (e.markT > 0) {
    var md = clamp(hh * 0.95, S * 0.62, S * 1.9) * (1 + 0.06 * Math.sin(time * 7)), mr = time * 1.4, mc = Math.cos(mr) * md / 96, ms = Math.sin(mr) * md / 96;
    x.globalAlpha = Math.min(1, e.markT * 3); x.setTransform(mc, ms, -ms, mc, X, cy); x.drawImage(ruReticle(), -48, -48); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
  }
}
// ---------- 탑 상태 덮개 (drawTower에서 몸을 그린 뒤. X, Y = 탑 발밑) ----------
// 탑 그림 꼭대기의 화면 높이 (단계마다 키가 달라 그림에서 잼)
function ruTwTop(t, Y, S) {
  var info = towerSpr(t.k, t.lvl, t.br, S), top = -S * 1.1, b;
  if (info && info.back && !info.back.empty) { b = fxBodyBox(info.back); if (b) top = b.cy - b.h / 2; }
  if (info && info.front && !info.front.empty) { b = fxBodyBox(info.front); if (b) top = Math.min(top, b.cy - b.h / 2); }
  return Y + clamp(top, -S * 2.8, -S * 0.5);
}
function TW_OVER(x, g, t, X, Y, S, time) {
  if (!(t.stunT > 0 || t.hexT > 0 || t.charmT > 0 || t.jamT > 0)) { if (t.ruWhy) t.ruWhy = ''; return; }   // 상태가 없으면 아무것도 안 함
  var live = ruLive(), hy = ruTwTop(t, Y, S) - S * 0.08, i, a, d, why = t.stunT > 0 ? t.ruWhy || (g.rule && g.rule.id === 'blackout' ? 'blackout' : '') : '';
  if (!(t.stunT > 0)) t.ruWhy = '';
  if (t.stunT > 0 && (why === 'blackout' || why === 'emp')) {
    // 정전: 탑이 어두워지고 불꽃이 튀며 전원 꺼짐 표시가 깜빡
    x.globalAlpha = 0.55; x.drawImage(softSpr('#0c0a1e', 48), X - S * 0.62, Y - S * 1.2, S * 1.24, S * 1.5); x.globalAlpha = 1;
    d = Math.max(S * 0.5, 19 * RD.view.dpr); x.globalAlpha = 0.65 + 0.35 * (Math.sin(time * 10) > 0 ? 1 : 0.3); x.drawImage(ruOffSpr(), X - d / 2, hy - d * 0.7, d, d); x.globalAlpha = 1;
    if (live && Math.random() < 0.16) burst(t.x + (Math.random() - 0.5) * 0.4, t.y + 0.1, 3, '#ffe066', 1.6, 0.3, 0.045, { k: 'spark', z: 0.3 + Math.random() * 0.5, vz: 1.5, grav: 7, cols: ['#ffe066', '#7cc8ff', '#ffffff'] });
  } else if (t.stunT > 0) {
    // 기절: 머리 위를 도는 별 셋과 발밑 노란 고리
    var simg = fxImg('star', '#ffe066', S * 0.4); d = Math.max(S * 0.3, 11 * RD.view.dpr);
    for (i = 0; i < 3; i++) { a = time * 5 + i * 2.094; var dd = d * (0.85 + 0.15 * Math.sin(a)); x.drawImage(simg, X + Math.cos(a) * S * 0.32 - dd / 2, hy - S * 0.06 + Math.sin(a) * S * 0.1 - dd / 2, dd, dd); }
    x.strokeStyle = 'rgba(255,214,60,0.85)'; x.lineWidth = Math.max(1.5, S * 0.035); x.setLineDash([S * 0.1, S * 0.08]); x.lineDashOffset = time * S * 0.4; x.beginPath(); x.ellipse(X, Y - S * 0.02, S * 0.42, S * 0.17, 0, 0, 6.2832); x.stroke(); x.setLineDash([]);
  }
  if (t.hexT > 0) {
    // 저주: 보랏빛 기운, 머리 위 소용돌이, 발밑에서 피어오르는 검보라 불
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.34 + 0.12 * Math.sin(time * 4); x.drawImage(glowSpr('#8a3cff', 64), X - S * 0.6, Y - S * 1.1, S * 1.2, S * 1.3); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    d = Math.max(S * 0.52, 19 * RD.view.dpr); fxBlit(x, ruSwirlSpr(), X, hy - d * 0.3, d, -time * 3.4, 1);
    if (live && Math.random() < 0.14) addP({ k: 'flame', x: t.x + (Math.random() - 0.5) * 0.6, y: t.y + 0.25, z: 0.05, vz: 0.8, life: 0.6, size: 0.07, col: Math.random() < 0.5 ? '#9a5cff' : '#5a2ab0' });
  }
  if (t.jamT > 0) {
    // 비명에 공격이 느려짐: 푸른 물결 고리가 발밑에서 번짐
    var jp = (time * 1.4 + t.id * 0.37) % 1; x.globalAlpha = 0.85 * (1 - jp); x.strokeStyle = '#6aa8ff'; x.lineWidth = Math.max(1.5, S * 0.04); x.beginPath(); x.ellipse(X, Y - S * 0.02, S * (0.25 + 0.3 * jp), S * (0.1 + 0.12 * jp), 0, 0, 6.2832); x.stroke();
    x.globalAlpha = 1; d = Math.max(S * 0.26, 10 * RD.view.dpr); var jd = fxImg('drop', '#6aa8ff', S * 0.3); x.drawImage(jd, X + S * 0.24 - d / 2, hy + Math.abs(Math.sin(time * 3)) * S * 0.1 - d / 2, d, d);
  }
  if (t.charmT > 0) {
    // 홀림: 분홍 기운과 탑을 도는 하트
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.3 + 0.1 * Math.sin(time * 5); x.drawImage(glowSpr('#ff5d9e', 64), X - S * 0.6, Y - S * 1.1, S * 1.2, S * 1.3); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    var himg = fxImg('heart', '#ff5d9e', S * 0.5), hm = (hy + Y) / 2 - S * 0.1; d = Math.max(S * 0.34, 12 * RD.view.dpr);
    for (i = 0; i < 3; i++) { a = time * 2.6 + i * 2.094; var bk = Math.sin(a) < 0 ? 0.75 : 1, hd = d * bk * (0.9 + 0.1 * Math.sin(time * 9 + i)); x.globalAlpha = bk < 1 ? 0.7 : 1; x.drawImage(himg, X + Math.cos(a) * S * 0.42 - hd / 2, hm + Math.sin(a) * S * 0.13 - Math.abs(Math.sin(time * 3 + i)) * S * 0.1 - hd / 2, hd, hd); }
    x.globalAlpha = 1;
  }
}

// ---------- 죽는 연출 (killFx에서 부름. true면 기존 솜구름 연출을 건너뜀) ----------
function ruDieKind(k) { var E = ENEMIES[k] || {}; return E.die || (E.ch === 3 ? 'boom' : E.ch === 4 ? 'ink' : E.ch === 2 ? 'ghost' : 'poof'); }
function ruDie(e, g, vh, cz, bigK, dl) {
  var fk = e.form && ENEMIES[e.form] && ruArtOf(e.form) ? e.form : e.k, kd = e.die || ruDieKind(fk); if (kd === 'poof' && fk === e.k) return false;
  var S = RD.view.S, fr = enemyFrames(fk, S), top = ruTopK(fk), ang = Math.atan2(e.diry || 0, e.dirx || 1), fz = e.fly ? (e.z > 0 ? e.z : 0.75) : 0, r = 0.3 + vh * 0.22, sea = e.dom === 's' && !e.fly;
  if (kd === 'boom') {
    // 차량 폭발: 불덩이, 검은 연기, 파편, 그을음. 하늘 적은 불붙은 동체가 돌며 떨어지고, 바다 적은 물기둥
    ruAdd({ k: 'fire', x: e.x, y: e.y, z: cz, r: r * 1.7, life: 0.5 });
    if (bigK) ruAdd({ k: 'fire', x: e.x + 0.25, y: e.y - 0.1, z: cz + 0.2, r: r * 1.2, life: 0.4, dl: 0.12 });
    fxPop(e.x, e.y, cz, r * 0.9, '#ffe08a', 0.1);
    fxPuffs(e.x, e.y, cz + 0.1, bigK ? 9 : 5, ['#4a4852', '#6c6974', '#2e2c36', '#807c88'], 1.3 + vh * 0.8, 0.16 + vh * 0.09, 0.85, 0.16);
    fxConfetti(e.x, e.y, cz, bigK ? 12 : fxBusy() ? 3 : 6, 2.2 + vh * 0.6, 0.05 + vh * 0.012, 0.9, ['#59636f', '#8a94a2', '#ff8a3c', '#2a2e36', '#ffd23a']);
    burst(e.x, e.y, bigK ? 10 : 5, '#ffd23a', 3 + vh, 0.38, 0.05, { k: 'spark', z: cz, vz: 1.4, cols: ['#ffd23a', '#ff8a2a', '#ffffff'] });
    ringFx(e.x, e.y, 0.4 + vh * 0.35, '#ffb347', 0.34, 0.07);
    if (e.fly) ruAdd({ k: 'body', mode: 'fall', spr: fr.fr[0], top: top, ang: ang, face: e.face, x: e.x, y: e.y, z: fz, vz: 1.2, vx: (e.dirx || 0) * 1.4, vy: (e.diry || 0) * 1.4, spin: (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 4), life: 1.2 });
    else if (sea) ruBlast(e.x, e.y, 0, 0.4 + vh * 0.2, 'water');
    else RD.decals.push({ k: 'mark', x: e.x, y: e.y, r: 0.32 + vh * 0.2, t: 0, life: 2.6, col: '#2a2630' });
    fxShake(bigK ? 0.07 : 0.025); sfx(bigK ? 'boom' : 'boomS', bigK ? 0.4 : 0.26);
  } else if (kd === 'ghost') {
    // 스르르 흩어짐: 몸이 희게 떠오르며 풀리고 푸른 혼불이 따라 오름
    ruAdd({ k: 'body', mode: 'ghost', spr: fr.fr[0], wh: fr.wh[0], top: top, ang: ang, face: e.face, x: e.x, y: e.y, z: fz, ph: Math.random() * 6, life: bigK ? 0.9 : 0.7 });
    var tn = typeof E2_TINT !== 'undefined' && E2_TINT[fk] ? E2_TINT[fk] : '#b9a2ff';   // 2장 적 대표색(그림 갈래 표)
    fxPuffs(e.x, e.y, cz, bigK ? 6 : 3, ['#e8e0ff', '#cfeaff', mixc(tn, '#ffffff', 0.45)], 0.9 + vh * 0.5, 0.13 + vh * 0.06, 0.7, 0.05);
    fxTwinkles(e.x, e.y, cz, bigK ? 6 : 3, ['#bfe9ff', '#ffffff', mixc(tn, '#ffffff', 0.25)], 1.3, 0.07, 0.6);
    for (var i = 0; i < (bigK ? 4 : 2); i++) addP({ k: 'flame', x: e.x + (Math.random() - 0.5) * 0.4, y: e.y, z: cz + Math.random() * 0.2, vz: 1.1 + Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.4, life: 0.75, size: 0.07 + vh * 0.02, col: i % 2 ? '#7cd8ff' : '#b08cff', dl: i * 0.06 });
    ringFx(e.x, e.y, 0.4 + vh * 0.3, mixc(tn, '#ffffff', 0.3), 0.45, 0.05);
  } else if (kd === 'poof') {
    // 변신한 적의 솜구름: 변신 뒤 그림으로
    addP({ k: 'poof', x: e.x, y: e.y, spr: fr.fr[0], wh: fr.wh[0], face: e.face, fly: e.fly, top: top, ang: ang, life: 0.2 });
    fxPop(e.x, e.y, cz, 0.28 + vh * 0.2, '#ff8fc0', 0.14, dl); fxPuffs(e.x, e.y, cz, bigK ? 10 : 6, ['#ffffff', '#fff2f8'], 1.5 + vh, 0.16 + vh * 0.095, 0.52, dl); fxStars(e.x, e.y, cz, 3, FX_CANDY, 1.6 + vh * 0.6, 0.09, 0.7, dl);
  } else {
    // 먹물 번짐: 몸이 먹빛으로 주저앉고 땅에 먹 얼룩이 번지며 먹방울이 튐
    var dk = fr.rink || (fr.rink = silhouette(fr.wh[0].c, '#1d1726'));
    ruAdd({ k: 'body', mode: 'ink', spr: fr.fr[0], dk: dk, top: top, ang: ang, face: e.face, x: e.x, y: e.y, z: fz, life: 0.42 });
    for (var j = 0; j < (bigK ? 3 : 2); j++) ruAdd({ k: 'ink', g: 1, i: (Math.random() * 3) | 0, x: e.x + (Math.random() - 0.5) * 0.35 * (j ? 1 : 0), y: e.y + (Math.random() - 0.5) * 0.2 * (j ? 1 : 0), r: (0.42 + vh * 0.26) * (j ? 0.55 + Math.random() * 0.3 : 1), rot: Math.random() * 6.28, life: 1.5 + Math.random() * 0.5, dl: j * 0.08, a: sea ? 0.6 : 1 });
    burst(e.x, e.y, bigK ? 10 : 6, '#1d1726', 1.8 + vh * 0.7, 0.55, 0.055, { k: 'drop', z: cz, vz: 2.4, grav: 9, cols: ['#1d1726', '#3a3048', '#1d1726'] });
    fxPuffs(e.x, e.y, cz, bigK ? 4 : 2, ['#5a5068', '#8a80a0'], 1.0 + vh * 0.4, 0.12 + vh * 0.05, 0.55, 0.04);
    fxConfetti(e.x, e.y, cz, bigK ? 6 : 2, 1.8, 0.045, 0.8, ['#e0483c', '#f6cb4c', '#2f6db5']);
  }
  return true;
}
// 우두머리 처치: 2~4장은 챕터 분위기로 (true면 기존 1장 연출을 건너뜀)
function ruBossDie(e, g, vh, cz, dl) {
  var ch = (ENEMIES[e.k] || {}).ch || (ENEMIES[e.form] || {}).ch || 1; if ((typeof tfSkin === 'function' ? tfSkin(ch) : ch) < 2 || !RU_CH[ch]) return false;
  var S = RD.view.S, C = RU_CH[ch], i;
  fxShake(0.24); RD.hitStop = 0.14; RD.fxSlow = RD.fxSlowT = 1.2;
  if (fxScreenOk()) { RD.flash = 0.26; RD.flashCol = ch === 2 ? '#e8dcff' : ch === 3 ? '#fff0d0' : '#fff6e0'; }
  if (ch === 3) {
    // 연쇄 폭발과 치솟는 연기
    for (i = 0; i < 6; i++) { var a = Math.random() * 6.28, rr = Math.random() * vh * 0.5; ruAdd({ k: 'fire', x: e.x + Math.cos(a) * rr, y: e.y + Math.sin(a) * rr * 0.6, z: cz + (Math.random() - 0.3) * 0.5, r: 0.7 + Math.random() * 0.7, life: 0.45, dl: 0.1 + i * 0.13 }); }
    fxPuffs(e.x, e.y, cz, 14, ['#4a4852', '#6c6974', '#2e2c36'], 2.6 + vh, 0.3, 1.3, 0.1);
    fxConfetti(e.x, e.y, cz + 0.3, 26, 3.6, 0.07, 1.4, ['#59636f', '#8a94a2', '#ff8a3c', '#2a2e36', '#ffd23a'], dl);
    burst(e.x, e.y, 22, '#ffd23a', 5, 0.6, 0.06, { k: 'spark', z: cz, vz: 2.2, grav: 5, cols: ['#ffd23a', '#ff8a2a', '#ffffff'] });
    if (e.dom === 's' && !e.fly) for (i = 0; i < 3; i++) ruAdd({ k: 'splash', x: e.x + (i - 1) * 0.8, y: e.y + 0.2, w: 0.9, h: 3 + i * 0.4, life: 0.9, dl: 0.15 + i * 0.12 });
  } else if (ch === 2) {
    // 혼불이 사방으로 흩어지고 보랏빛 고리
    for (i = 0; i < 14; i++) { var a2 = i / 14 * 6.28; addP({ k: 'flame', x: e.x, y: e.y, z: cz, vx: Math.cos(a2) * 2.6, vy: Math.sin(a2) * 1.7, vz: 0.8, dr: 1.4, life: 1.0, size: 0.11, col: i % 2 ? '#7cd8ff' : '#b08cff', dl: dl }); }
    fxPuffs(e.x, e.y, cz, 12, ['#3a2658', '#5a3a88', '#e8e0ff'], 2.6 + vh, 0.28, 1.0, dl);
    fxStarRing(e.x, e.y, cz, fxN(12), 1.5, 0.13, ['#ffb04a', '#c9a0ff', '#7cd8ff'], dl);
    fxSRing(e.x, e.y, 0.04, 1.7 + vh * 0.4, '#9a5cff', 0.8, 1, dl + 0.1);
  } else {
    // 큰 먹 얼룩이 번지고 오방색 색종이
    for (i = 0; i < 5; i++) ruAdd({ k: 'ink', g: 1, i: i % 3, x: e.x + (Math.random() - 0.5) * vh * 0.9, y: e.y + (Math.random() - 0.5) * vh * 0.5, r: 0.8 + Math.random() * 0.9, rot: Math.random() * 6.28, life: 2.4, dl: i * 0.07 });
    burst(e.x, e.y, 20, '#1d1726', 3.6, 0.8, 0.075, { k: 'drop', z: cz, vz: 3.4, grav: 9, cols: ['#1d1726', '#3a3048'] });
    fxConfetti(e.x, e.y, cz + 0.3, 30, 3.6, 0.075, 1.6, ['#e0483c', '#f6cb4c', '#2f6db5', '#f7f2e6', '#2b2536'], dl);
    fxSRing(e.x, e.y, 0.04, 1.7 + vh * 0.4, '#e0483c', 0.8, 1, dl + 0.1);
  }
  fxStars(e.x, e.y, cz, 8, [C[0], C[1], '#ffffff'], 3, 0.14, 0.9, dl);
  if (fxWordsOn()) { FX_NSTK++; addP({ k: 'stk', img: fxSticker(FX_WORDS.boss, Math.round(S * 0.8), 'rain', S * 6.4), x: clamp(e.x, 2.2, RD.cols - 2.2), y: e.y, z: Math.min(cz + 1.1, Math.max(0.2, e.y - 1.2)), rot: -0.07, life: 1.9, rise: 0.5, dl: dl, big: 1 }); }
  vib([50, 40, 90]);
  return true;
}

// ---------- 사건 고리 (다른 갈래가 같은 사건을 이미 받고 있으면 그것도 이어 부름) ----------
function ruHook(name, fn) { var prev = FX_EV[name]; FX_EV[name] = function (g, ev) { var r = fn(g, ev), r2 = prev ? prev(g, ev) : undefined; return r === true || r2 === true ? true : undefined; }; }
// 변신: 흡혈귀 → 박쥐(검보라 연기와 박쥐 조각), 이무기 → 용(물기둥, 번개, 화면 번쩍), 그 밖은 챕터 색 연기
ruHook('morph', function (g, ev) {
  var e = ev.e || ev, to = ev.to || (e && e.form) || '', wx = ev.x != null ? ev.x : e.x, wy = ev.y != null ? ev.y : e.y, ch = (ENEMIES[to] || (e && e.E) || {}).ch || ruCh(g), C = RU_CH[ch] || RU_CH[1], i;
  if (wx == null) return;
  if (to === 'yong' || (e && e.k === 'imugi')) {
    for (i = 0; i < 5; i++) ruAdd({ k: 'splash', x: wx + (i - 2) * 0.55, y: wy + (i % 2) * 0.25, w: 0.9, h: 3.2 + (i % 3) * 0.7, life: 1.0, dl: i * 0.07 });
    for (i = 0; i < 3; i++) { var pts = [], bx = wx + (i - 1) * 1.1, n = 7; for (var q = 0; q <= n; q++) pts.push([bx + (q < n ? (Math.random() - 0.5) * 0.8 : 0) + (n - q) * 0.12, wy - 0.6 - (n - q) * 1.1]); ruAdd({ k: 'bolt', pts: pts, col: '#8fd0ff', life: 0.3, dl: 0.25 + i * 0.16 }); }
    ringFx(wx, wy, 2.4, '#8fd0ff', 0.8, 0.12); ringFx(wx, wy, 1.5, '#ffffff', 0.6, 0.07, 0.1);
    burst(wx, wy, 22, '#e8f8ff', 4, 0.9, 0.07, { k: 'drop', z: 0.4, vz: 4.5, grav: 8 });
    fxStarRing(wx, wy, 1.2, fxN(14), 1.8, 0.14, ['#ffd24a', '#8fd0ff', '#ffffff'], 0.3);
    fxShake(0.3); if (fxScreenOk()) { RD.flash = 0.4; RD.flashCol = '#e8f6ff'; } RD.hitStop = Math.max(RD.hitStop || 0, 0.12); sfx('zap', 0.6); sfx('boomBig', 0.5); vib([60, 40, 100]);
    RU.bossIn = { t: 0, T: 1.6, col: '#5aa8ff' };
  } else if (to === 'vampbat' || (e && e.k === 'vampire')) {
    fxPuffs(wx, wy, 0.5, 7, ['#3a2658', '#5a3a88', '#241a3a'], 1.8, 0.2, 0.7);
    for (i = 0; i < 6; i++) { var a = i / 6 * 6.28 + Math.random() * 0.5; addP({ k: 'conf', x: wx, y: wy, z: 0.5, vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 1.4, vz: 1.6 + Math.random(), grav: 2, dr: 1.2, life: 0.8, size: 0.07, col: '#2a1a48', rot: Math.random() * 6, vr: 9, fl: 22, ph: Math.random() * 6 }); }
    fxSRing(wx, wy, 0.5, 0.8, '#9a5cff', 0.4, 0); fxTwinkles(wx, wy, 0.6, 5, ['#ff5a6a', '#c9a0ff', '#ffffff'], 2, 0.07, 0.5); sfx('summon', 0.4);
  } else {
    fxPuffs(wx, wy, 0.4, 6, [C[2], C[0], '#ffffff'], 1.6, 0.18, 0.6); fxSRing(wx, wy, 0.4, 0.8, C[0], 0.4, 0); fxStars(wx, wy, 0.5, 4, [C[0], C[1]], 2, 0.1, 0.6); sfx('magic', 0.35);
  }
});
// 탑이 기절하는 순간: 노란 충격 고리와 별 (정전, EMP는 푸른 불꽃). 이유를 탑에 적어 두면 TW_OVER가 맞는 덮개를 그림
ruHook('towerStun', function (g, ev) {
  var t = ev.tw; if (!t) return;
  if (ev.k === 'hex' || ev.k === 'charm' || ev.k === 'jam') { ringFx(t.x, t.y + 0.25, 0.6, ev.k === 'charm' ? '#ff5d9e' : ev.k === 'hex' ? '#9a5cff' : '#6aa8ff', 0.4, 0.07); return; }
  t.ruWhy = ev.why || '';
  var el = ev.why === 'blackout' || ev.why === 'emp';
  fxPop(t.x, t.y + 0.1, 0.5, 0.42, el ? '#7cc8ff' : '#ffe066', 0.12);
  ringFx(t.x, t.y + 0.25, 0.6, el ? '#7cc8ff' : '#ffd23a', 0.4, 0.07);
  if (el) burst(t.x, t.y, 8, '#7cc8ff', 2.4, 0.4, 0.05, { k: 'spark', z: 0.6, vz: 1.6, grav: 6, cols: ['#7cc8ff', '#ffffff', '#ffe066'] });
  else fxStars(t.x, t.y + 0.1, 0.9, 4, ['#ffe066', '#ffffff', '#ffb347'], 1.8, 0.09, 0.6);
  if (!(RU.stunShk > RD.time - 0.4)) { RU.stunShk = RD.time; fxShake(0.03); }
});
// 우두머리 등장: 챕터 색으로 화면 가장자리가 두근, 나오는 곳에 큰 고리
ruHook('boss', function (g, ev) {
  var ch = (ENEMIES[ev.k] || {}).ch || ruCh(g), C = RU_CH[ch] || RU_CH[1], b = g.boss;
  RU.bossIn = { t: 0, T: 2.2, col: ch === 2 ? '#7a3cff' : ch === 3 ? '#ff4a2a' : ch === 4 ? '#c8281e' : '#ff5d9e' };
  if (b) { var bx = clamp(b.x, 0.8, RD.cols - 0.8), by = clamp(b.y, 0.8, RD.rows - 0.8); ringFx(bx, by, 2.2, C[0], 0.9, 0.12); ringFx(bx, by, 1.4, C[1], 0.7, 0.07, 0.12); if (ch === 2) fxPuffs(bx, by, 0.4, 8, ['#3a2658', '#5a3a88'], 2.6, 0.26, 0.9); else if (ch === 4) for (var i = 0; i < 3; i++) ruAdd({ k: 'ink', g: 1, i: i, x: bx + (i - 1) * 0.7, y: by + 0.2, r: 0.9, rot: i * 2, life: 1.8, dl: i * 0.1 }); else if (ch === 3) burst(bx, by, 14, '#ffd23a', 3.4, 0.5, 0.06, { k: 'spark', z: 0.4, vz: 2, grav: 6 }); }
  fxShake(0.12);
});
// 웨이브 시작: 이번 웨이브에 항로 적, 바다 적이 있으면 길을 따라 화살표를 2초쯤
ruHook('wave', function (g, ev) {
  var air = 0, sea = 0, q = g.spawnQ || [], i;
  for (i = 0; i < q.length; i++) { var E = ENEMIES[q[i].type]; if (!E) continue; var r = fdRoute(E); if (r === 'air' && g.air && g.air.length) air = 1; else if (r === 'sea' && g.sea && g.sea.length) sea = 1; }
  if (air || sea) RU.guide = { t: 0, T: 2.4, air: air, sea: sea };
  if (g.rule && g.rule.id === 'airraid' && air) RU.alarm = 2.4;
});
// 판 규칙 사건 ruleEv { id, k }: 정전(warn 깜빡, hit 어두워짐), 운석(hit 충돌. 예고는 g.rule.marks로 그림), 공습과 상륙(siren 경보)
ruHook('ruleEv', function (g, ev) {
  var id = ev.id || (g.rule && g.rule.id), k = ev.k || '';
  if (id === 'blackout') { if (k === 'warn') RU.dark = Math.max(RU.dark, 0.25); else if (k === 'hit' || !k) { RU.dark = 0.7; sfx('zap', 0.3); } }
  else if (id === 'meteor') {
    if (ev.x == null || k === 'mark' || k === 'block') return;
    if (ev.warn) { ruAdd({ k: 'meteor', x: ev.x, y: ev.y, r: 0.4, life: Math.max(0.3, ev.sec || 0.7) }); return; }
    var r = ev.r || 1.2;
    // 충돌: 폭발 그림은 blast 사건(탄 갈래)이 맡고, 여기서는 돌 조각, 그을음, 흔들림. blast를 받는 곳이 없으면 폭발도 여기서
    if (!RU.blastOther) { ruBlast(ev.x, ev.y, 0.1, r * 0.75, 'he'); ruAdd({ k: 'fire', x: ev.x, y: ev.y, z: 0.2, r: r * 1.5, life: 0.5 }); sfx('boomBig', 0.5); }
    fxConfetti(ev.x, ev.y, 0.2, 12, 3.2, 0.07, 1.0, ['#6a2a1e', '#e2622a', '#3a2a26', '#ffd27a']); ringFx(ev.x, ev.y, r, '#ff8a2a', 0.5, 0.1);
    RD.decals.push({ k: 'mark', x: ev.x, y: ev.y, r: r * 0.7, t: 0, life: 3.5, col: '#2a1c18' }); fxShake(0.14);
  }
  else if (id === 'airraid' || id === 'landing') { if (k === 'siren' || !k) { RU.alarm = Math.max(RU.alarm, 2.4); RU.alarmCol = id === 'landing' ? '#2a8cff' : '#ff2a2a'; } }
});
// 적의 폭발(blast { enemy: 1 }): 탄 갈래(REN1)가 blast를 받고 있으면 그쪽에 맡기고, 없을 때만 여기서 그림
RU.blastOther = !!FX_EV.blast;
if (!RU.blastOther) FX_EV.blast = function (g, ev) { if (ev.x == null) return; var r = ev.r || 0.6; ruBlast(ev.x, ev.y, 0.1, Math.min(1.6, r * 0.7), ev.k === 'water' ? 'water' : ev.k === 'dark' ? 'dark' : 'he'); if (ev.big) { ruAdd({ k: 'fire', x: ev.x, y: ev.y, z: 0.2, r: Math.min(2.4, r), life: 0.45 }); fxShake(0.1); } sfx(ev.big ? 'boom' : 'boomS', 0.35); };
// 순간 이동(저승사자): 떠난 자리와 나타난 자리에 연기, 사이에 옅은 줄
ruHook('blink', function (g, ev) {
  if (ev.x0 == null) return; var C = RU_CH[ruCh(g)] || RU_CH[1];
  fxPuffs(ev.x0, ev.y0, 0.4, 4, ['#3a3048', '#6a5c84'], 1.2, 0.16, 0.5); fxPuffs(ev.x1, ev.y1, 0.4, 4, ['#3a3048', '#c9a0ff'], 1.4, 0.16, 0.5, 0.08);
  fxSRing(ev.x1, ev.y1, 0.4, 0.6, '#c9a0ff', 0.35, 0, 0.08); addP({ k: 'zap', pts: [[ev.x0, ev.y0 - 0.4], [ev.x1, ev.y1 - 0.4]], life: 0.22, lvl: 1 });
});
// 폭주, 돌진 시작: 붉은 고리가 터짐 / 우두머리 체력 구간 변화: 챕터 색 큰 고리와 흔들림 / 뛰어넘기: 발밑 먼지
ruHook('rage', function (g, ev) { if (ev.x == null) return; ringFx(ev.x, ev.y, 0.9, '#ff3a2a', 0.45, 0.09); fxPop(ev.x, ev.y, 0.5, 0.4, '#ff5a3a', 0.12); burst(ev.x, ev.y, 6, '#ff5a3a', 2.2, 0.4, 0.06, { k: 'flame', z: 0.3, vz: 0.9, cols: ['#ff5a3a', '#ffb347'] }); });
ruHook('phase', function (g, ev) { if (ev.x == null) return; var C = RU_CH[(ENEMIES[ev.k] || {}).ch || ruCh(g)] || RU_CH[1]; ringFx(ev.x, ev.y, 2.2, C[0], 0.7, 0.12); ringFx(ev.x, ev.y, 1.4, C[1], 0.55, 0.07, 0.1); fxStarRing(ev.x, ev.y, 0.8, fxN(10), 1.5, 0.12, [C[0], C[1], '#ffffff']); fxShake(0.12); RU.bossIn = { t: 0, T: 1.0, col: C[0] }; });
ruHook('leap', function (g, ev) { if (ev.x == null) return; fxPuffs(ev.x, ev.y, 0.05, 3, ['#ffffff', '#efe6dc'], 1.2, 0.12, 0.4); });
// 박쥐 떼로 흩어짐(흡혈 백작)과 다시 모임, 숨어 있던 적이 드러남
ruHook('scatter', function (g, ev) { if (ev.x == null) return; fxPuffs(ev.x, ev.y, 0.6, 6, ['#3a2658', '#5a3a88', '#241a3a'], 2, 0.2, 0.6); for (var i = 0; i < 7; i++) { var a = i / 7 * 6.28; addP({ k: 'conf', x: ev.x, y: ev.y, z: 0.7, vx: Math.cos(a) * 2.6, vy: Math.sin(a) * 1.6, vz: 1.4, grav: 2, dr: 1.2, life: 0.8, size: 0.07, col: '#2a1a48', rot: Math.random() * 6, vr: 9, fl: 22, ph: Math.random() * 6 }); } fxSRing(ev.x, ev.y, 0.6, 0.9, '#9a5cff', 0.4, 0); });
ruHook('reveal', function (g, ev) { if (ev.x == null) return; fxSRing(ev.x, ev.y, 0.4, 0.7, '#ffe066', 0.35, 0); fxTwinkles(ev.x, ev.y, 0.5, 4, ['#ffffff', '#ffe066'], 1.6, 0.07, 0.4); });
// 항로 경고(엔진이 알려 준 위험한 항로 적): 그 항로 들머리에 경고 세모를 잠깐
ruHook('laneWarn', function (g, ev) { if (ev.pi != null) { (RU.lw || (RU.lw = {}))[ev.pi] = RD.time + 1.8; } });
// 떨어질 자리 예고 고리(폭탄, 운석 공용): 붉은 채움이 f(0~1)만큼 차오르고, 흰 바탕 줄 위에 붉은 점선이 돌고, 가운데 십자
function ruTarget(x, X, Y, rr, f, time, S) {
  var bl = 0.5 + 0.5 * Math.sin(time * (6 + f * 16));
  x.fillStyle = 'rgba(255,50,40,' + (0.1 + 0.16 * f).toFixed(2) + ')'; x.beginPath(); x.ellipse(X, Y, rr, rr * 0.62, 0, 0, 6.2832); x.fill();
  if (f > 0.02) { x.fillStyle = 'rgba(255,50,40,0.22)'; x.beginPath(); x.ellipse(X, Y, rr * f, rr * 0.62 * f, 0, 0, 6.2832); x.fill(); }
  x.beginPath(); x.ellipse(X, Y, rr, rr * 0.62, 0, 0, 6.2832);
  x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = Math.max(2.5, S * 0.08); x.stroke();
  x.strokeStyle = 'rgba(236,36,40,' + (0.65 + 0.35 * bl).toFixed(2) + ')'; x.lineWidth = Math.max(1.5, S * 0.05); x.setLineDash([S * 0.16, S * 0.1]); x.lineDashOffset = -time * S * 0.5; x.stroke(); x.setLineDash([]);
  x.beginPath(); x.moveTo(X - rr * 0.22, Y); x.lineTo(X + rr * 0.22, Y); x.moveTo(X, Y - rr * 0.14); x.lineTo(X, Y + rr * 0.14);
  x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = Math.max(2.5, S * 0.07); x.stroke(); x.strokeStyle = '#ec2428'; x.lineWidth = Math.max(1.5, S * 0.035); x.stroke();
}
// ---------- 적의 탄 ----------
// 폭격기 폭탄: 떨어질 자리에 그림자와 붉은 예고 고리가 커지고, 폭탄이 꼬리 날개를 위로 하고 떨어짐
PROJ_DRAW.ebomb = function (x, g, p, S, time) {
  var tx = p.tx != null ? p.tx : p.x, ty = p.ty != null ? p.ty : p.y, z = Math.max(0, p.z || 0), k = clamp(1 - z / 3.5, 0.2, 1), GX = WX(tx), GY = WY(ty), rr = (p.br || p.r || 0.9) * S, pu = 0;
  if (p.u != null) k = clamp(p.u, 0.15, 1);
  ruTarget(x, GX, GY, rr, k, time, S);
  shadowAt(x, GX, GY, S * 0.42 * k, S * 0.19 * k, 0.6);
  var d = S * (0.58 + 0.2 * (p.big || 0)), X = WX(p.x), Y = WY(p.y) - z * S, sw = Math.sin(time * 7 + (p.t || 0) * 3) * 0.12, c = Math.cos(sw), s = Math.sin(sw);
  x.setTransform(c * d / 64, s * d / 64, -s * d / 64, c * d / 64, X, Y); x.drawImage(ruBombSpr(), -32, -64); x.setTransform(1, 0, 0, 1, 0, 0);
};
// 적 포탄: 불꼬리를 끌고 날아가는 검은 포탄과 땅 그림자
PROJ_DRAW.eshell = function (x, g, p, S, time) {
  var z = Math.max(0, p.z || 0), X = WX(p.x), Y = WY(p.y) - z * S, ang = p.ang != null ? p.ang : p.rlx != null ? Math.atan2(Y - p.rly, X - p.rlx) : 0, d = S * (0.62 + 0.22 * (p.big || 0));
  p.rlx = X; p.rly = Y;
  if (p.tx != null && p.br) ruTarget(x, WX(p.tx), WY(p.ty), p.br * S, p.u != null ? clamp(p.u, 0, 1) : 0.5, time, S);   // 떨어질 자리 예고
  shadowAt(x, WX(p.x), WY(p.y), S * 0.14, S * 0.06, 0.35);
  streakAt(x, X, Y, ang, S * 0.95, d * 0.34, '#ff8a2a', 0.85);
  x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.7; x.drawImage(glowSpr('#ff9a3a', 32), X - d * 0.45, Y - d * 0.45, d * 0.9, d * 0.9); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  var c = Math.cos(ang) * d / 80, s = Math.sin(ang) * d / 80; x.setTransform(c, s, -s, c, X, Y); x.drawImage(ruShellSpr(), -52, -16); x.setTransform(1, 0, 0, 1, 0, 0);
  if (ruLive() && !RD.lowFx && Math.random() < 0.4) addP({ k: 'puff', x: p.x, y: p.y, z: z, vz: 0.1, life: 0.4, size: 0.06, col: '#5a5862', a: 0.6 });
};

// ---------- 판 준비: 뱃길과 항로를 바탕 그림에 옅게 새기고, 들어오는 곳과 닿는 곳을 정함 ----------
function ruInside(g, px, py, m) { return px >= m && px <= g.cols - m && py >= m && py <= g.rows - m; }
function ruEnds(g, P, m) {
  var a = -1, b = -1; for (var i = 0; i < P.n; i++) if (ruInside(g, P.xs[i], P.ys[i], m)) { if (a < 0) a = i; b = i; }
  if (a < 0) return null;
  var a2 = Math.min(P.n - 1, a + 2), b2 = Math.max(0, b - 2);
  return { i0: a, i1: b, x0: P.xs[a], y0: P.ys[a], a0: Math.atan2(P.ys[a2] - P.ys[a], P.xs[a2] - P.xs[a]), x1: P.xs[b], y1: P.ys[b], a1: Math.atan2(P.ys[b] - P.ys[b2], P.xs[b] - P.xs[b2]) };
}
function ruPrepare(g) {
  var v = RD.view, S = v.S, x = cx2(RD.bg), out = { x: 0, y: 0, dx: 0, dy: 0 }, d, k;
  RU.fx.length = 0; RU.eyes.length = 0; RU.gates = []; RU.guide = null; RU.night = null; RU.nightKey = ''; RU.alarm = 0; RU.dark = 0; RU.bossIn = null; RU.fogs = null; RU.warn = []; RU.lw = null; RU.alarmCol = '#ff2a2a';
  function BX(wx) { return v.ox + wx * S; } function BY(wy) { return v.oy + wy * S; }
  x.save(); x.lineCap = 'round';
  // 뱃길: 물 위 흰 점선 (탑을 못 짓는 물길이 어디인지 알 수 있게)
  (g.sea || []).forEach(function (P, pi) {
    var en = ruEnds(g, P, 0.15); if (!en) return;
    for (k = 0, d = 0; d < P.len; d += 0.42, k++) {
      pathAt(P, d, out); if (!ruInside(g, out.x, out.y, 0.1)) continue;
      var X = BX(out.x), Y = BY(out.y), L = S * 0.11;
      x.strokeStyle = 'rgba(20,60,110,0.22)'; x.lineWidth = Math.max(2, S * 0.075); x.beginPath(); x.moveTo(X - out.dx * L, Y - out.dy * L); x.lineTo(X + out.dx * L, Y + out.dy * L); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = Math.max(1, S * 0.04); x.stroke();
    }
    RU.gates.push({ kind: 'sea', x: clamp(en.x0, 0.5, g.cols - 0.5), y: clamp(en.y0, 0.45, g.rows - 0.45), ang: en.a0, pi: pi });
    RU.gates.push({ kind: 'dock', x: P.xs[P.n - 1], y: P.ys[P.n - 1], ang: en.a1, pi: pi });
  });
  // 항로: 아주 옅은 긴 점선과 가장자리 표시
  (g.air || []).forEach(function (P, pi) {
    var en = ruEnds(g, P, 0.3); if (!en) return;
    for (k = 0, d = 0; d < P.len; d += 0.8, k++) {
      pathAt(P, d, out); if (!ruInside(g, out.x, out.y, 0.25)) continue;
      var X = BX(out.x), Y = BY(out.y), L = S * 0.16;
      x.strokeStyle = 'rgba(40,20,10,0.16)'; x.lineWidth = Math.max(2, S * 0.07); x.beginPath(); x.moveTo(X - out.dx * L, Y - out.dy * L); x.lineTo(X + out.dx * L, Y + out.dy * L); x.stroke();
      x.strokeStyle = 'rgba(255,244,214,0.42)'; x.lineWidth = Math.max(1, S * 0.035); x.stroke();
    }
    RU.gates.push({ kind: 'air', x: en.x0, y: en.y0, ang: en.a0, pi: pi });
    RU.gates.push({ kind: 'airEnd', x: en.x1, y: en.y1, ang: en.a1, pi: pi });
  });
  x.restore();
  // 전투 시작: 뱃길과 항로가 있는 판이면 처음 한 번 길을 보여 줌
  if ((g.sea && g.sea.length) || (g.air && g.air.length)) RU.guide = { t: 0, T: 3.6, air: 1, sea: 1 };
}

// ---------- 땅 위(적과 탑 아래): 들어오는 곳 표시, 길 안내 화살표, 운석 예고, 땅 연출 ----------
function ruGround(x, g, S, time, dt, rdt) {
  var i, G, X, Y, k;
  RU.nightOn = g.rule && g.rule.id === 'night' ? 1 : 0; RU.eyes.length = 0;
  for (i = 0; i < RU.gates.length; i++) {
    G = RU.gates[i]; X = WX(G.x); Y = WY(G.y);
    if (G.kind === 'sea') {
      // 뱃길 들머리: 물안개와 도는 흰 물결
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.4 + 0.12 * Math.sin(time * 2.4); x.drawImage(glowSpr('#9fe8ff', 48), X - S * 0.62, Y - S * 0.42, S * 1.24, S * 0.84); x.globalCompositeOperation = 'source-over';
      x.lineCap = 'round'; x.lineWidth = Math.max(1.5, S * 0.045);
      for (k = 0; k < 3; k++) { var a0 = -time * (1.3 + k * 0.5) + k * 2; x.globalAlpha = 0.9 - k * 0.22; x.strokeStyle = k === 1 ? '#bfeeff' : '#ffffff'; x.beginPath(); x.ellipse(X, Y, S * (0.2 + k * 0.13), S * (0.1 + k * 0.065), 0, a0, a0 + 3.4); x.stroke(); }
      x.lineCap = 'butt'; x.globalAlpha = 1;
    } else if (G.kind === 'dock') {
      // 부두(닿으면 생명이 깎이는 곳): 붉은 고리가 천천히 숨 쉼
      var pu = 0.5 + 0.5 * Math.sin(time * 3); x.globalAlpha = 0.55 + 0.3 * pu; x.strokeStyle = '#ff4a5a'; x.lineWidth = Math.max(1.5, S * 0.05); x.setLineDash([S * 0.12, S * 0.08]); x.lineDashOffset = time * S * 0.25;
      x.beginPath(); x.ellipse(X, Y, S * (0.34 + 0.04 * pu), S * (0.2 + 0.025 * pu), 0, 0, 6.2832); x.stroke(); x.setLineDash([]); x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, S * 0.02); x.globalAlpha = 0.6; x.stroke(); x.globalAlpha = 1;
    } else {
      // 항로 들머리와 끝: 가장자리의 작은 꺾쇠 (들어오는 쪽은 주황, 나가는 쪽은 빨강)
      var end = G.kind === 'airEnd', d = Math.max(S * 0.5, 16 * RD.view.dpr), c = Math.cos(G.ang) * d / 48, s = Math.sin(G.ang) * d / 48, sl = (time * 1.6 + i * 0.3) % 1;
      x.globalAlpha = 0.6 + 0.3 * Math.sin(time * 4 + i); x.setTransform(c, s, -s, c, X + Math.cos(G.ang) * S * 0.14 * sl, Y + Math.sin(G.ang) * S * 0.14 * sl); x.drawImage(ruChev(end ? '#ff3d4a' : '#ff9a2a'), -24, -24); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
    }
  }
  // 운석 예고 자리: 붉은 표적 고리가 떨어질 때가 가까울수록 빠르게 깜빡이고 안쪽이 차오름
  var mk = g.rule && g.rule.marks;
  if (mk && mk.length) for (i = 0; i < mk.length; i++) {
    var m = mk[i], rr = (m.r || 1.2) * S, left = m.t != null ? Math.max(0, m.t) : 1; if (!m.ruT || left > m.ruT) m.ruT = Math.max(left, 0.5);   // 처음 본 남은 시간을 전체 시간으로
    var f = clamp(1 - left / (m.T || m.ruT), 0, 1);
    X = WX(m.x); Y = WY(m.y); ruTarget(x, X, Y, rr, f, time, S);
    if (left < 0.75 && !m.ruM) { m.ruM = 1; ruAdd({ k: 'meteor', x: m.x, y: m.y, r: 0.42, life: Math.max(0.2, left) }); }
  }
  // 예고 중인 광역 공격(e.cast = { t, T, r }): 적 발밑에서 붉은 고리가 차오름
  for (i = 0; i < g.enemies.length; i++) { var ce = g.enemies[i], cs = ce.cast; if (cs && cs.r > 0 && !ce.dead && !ce.ruHid) ruTarget(x, WX(ce.x), WY(ce.y), cs.r * S, clamp(1 - cs.t / (cs.T || 1), 0, 1), time, S); }
  // 길 안내 화살표
  if (RU.guide) {
    var gd = RU.guide; gd.t += rdt;
    if (gd.t >= gd.T) RU.guide = null;
    else {
      var al = Math.min(1, gd.t / 0.25, (gd.T - gd.t) / 0.5);
      if (gd.sea && g.sea) for (i = 0; i < g.sea.length; i++) ruArrows(x, g, g.sea[i], S, time, '#3fd0ff', al, 0.85, 1.5);
      if (gd.air && g.air) for (i = 0; i < g.air.length; i++) ruArrows(x, g, g.air[i], S, time, '#ff8a2a', al, 1.1, 3.2);
    }
  }
  ruFxDraw(x, S, dt, 0, time);
}
// 길을 따라 흐르는 꺾쇠
function ruArrows(x, g, P, S, time, col, al, gap, sp) {
  var img = ruChev(col), d = Math.max(S * 0.52, 15 * RD.view.dpr), o = RU.pa || (RU.pa = { x: 0, y: 0, dx: 0, dy: 0 }), k = d / 48;
  for (var dd = (time * sp) % gap; dd < P.len; dd += gap) {
    pathAt(P, dd, o); if (!ruInside(g, o.x, o.y, 0.2)) continue;
    x.globalAlpha = al * (0.75 + 0.25 * Math.sin(dd * 2 - time * 6));
    x.setTransform(o.dx * k, o.dy * k, -o.dy * k, o.dx * k, WX(o.x), WY(o.y)); x.drawImage(img, -24, -24);
  }
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
}
// 건설 가능한 칸 표시: 고른 탑(또는 고른 칸)의 자리 종류(땅, 물)에 맞는 칸만 은은히 칠하고 나머지는 옅은 테두리만
function ruBuildHint(x, g, S) {
  // 칸마다 작은 네모로 긋는다 (큰 경로 하나로 모아 그으면 화면 전체를 훑어 훨씬 느림)
  var sel = UIS.sel, type = UIS.preview && UIS.preview.type, want = type ? fdSite(type) : sel && sel.kind === 'cell' ? fdCellSite(g, sel.c, sel.r) : null, pu = 0.5 + 0.5 * Math.sin(RD.time * 3), r, c, st;
  var w = S * 0.82, fW = 'rgba(225,252,255,' + (0.3 + 0.12 * pu).toFixed(3) + ')', fL = 'rgba(255,244,150,' + (0.17 + 0.09 * pu).toFixed(3) + ')', cur = '';
  if (!want) {
    // 고른 것이 없을 때(전투 시작 안내, 탑을 골랐을 때)는 예전과 같은 옅은 흰 테두리만
    x.save(); x.strokeStyle = 'rgba(255,255,255,0.3)'; x.lineWidth = Math.max(1, S * 0.02);
    for (r = 0; r < g.rows; r++) for (c = 0; c < g.cols; c++) if (fdCellSite(g, c, r)) { x.beginPath(); x.rect(WX(c) + S * 0.1, WY(r) + S * 0.1, S * 0.8, S * 0.8); x.stroke(); }
    x.restore(); return;
  }
  x.save(); x.lineWidth = Math.max(1, S * 0.025);
  for (r = 0; r < g.rows; r++) for (c = 0; c < g.cols; c++) {
    st = fdCellSite(g, c, r); if (!st) continue;
    var X = Math.round(WX(c) + S * 0.09), Y = Math.round(WY(r) + S * 0.09), wat = st === 'water', on = !want || st === want, col;
    if (want && on) { x.fillStyle = wat ? fW : fL; x.fillRect(X, Y, w, w); x.strokeStyle = 'rgba(40,20,60,0.28)'; x.strokeRect(X + 1, Y + 1, w, w); cur = ''; }
    col = wat ? (!want ? 'rgba(190,245,255,0.5)' : on ? 'rgba(190,245,255,0.8)' : 'rgba(190,245,255,0.24)') : (!want ? 'rgba(255,255,255,0.36)' : on ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.18)');
    if (col !== cur) { x.strokeStyle = col; cur = col; }
    x.strokeRect(X, Y, w, w);
  }
  x.restore();
}

// ---------- 하늘(하늘 적 위): 불덩이, 떠오르는 혼, 떨어지는 동체, 번개 ----------
function ruSky(x, g, S, time, dt) { ruFxDraw(x, S, dt, 1, time); }

// ---------- 판 규칙 덮개 (입자 뒤, 체력 막대 앞) ----------
function ruLit(g, e) {
  if (e.dark != null) return !e.dark;
  if (e.lit != null) return !!e.lit;
  var gx = g.gate.x - e.x, gy = g.gate.y - e.y; if (gx * gx + gy * gy < 6.25) return true;
  for (var i = 0; i < g.towers.length; i++) { var t = g.towers[i], r = ruSight(t) + 0.25, dx = t.x - e.x, dy = t.y - e.y; if (dx * dx + dy * dy < r * r) return true; }
  return false;
}
function ruSight(t) { var T = TOWERS[t.k] || {}, r = (t.st && t.st.range) || 2; if (T.light || t.k === 'bell') r = Math.max(r, (t.st && t.st.reveal) || 0, 2.6) * 1.12; return Math.min(r, 5.5); }
function ruNightKey(g) { var L = g.rule && g.rule.lit, s = g.towers.length + ':' + Math.round(RD.view.S); if (L && L.length) { for (var q = 0; q < L.length; q++) s += '|' + Math.round(L[q].x * 10) + ',' + Math.round(L[q].y * 10) + ',' + Math.round(L[q].r * 10) + (L[q].light ? 'L' : ''); return s; } for (var i = 0; i < g.towers.length; i++) { var t = g.towers[i]; s += '|' + t.id + ',' + t.lvl + ',' + Math.round(ruSight(t) * 10); } return s; }
function ruNightCv(g) {
  var v = RD.view, key = ruNightKey(g); if (RU.night && RU.nightKey === key) return RU.night;
  var q = 4, c = RU.night || (RU.night = mkC(Math.ceil(v.W / q), Math.ceil(v.H / q))), x = cx2(c), hole = ruHoleSpr(), S = v.S / q, i;
  RU.nightKey = key;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, c.width, c.height);
  x.fillStyle = 'rgba(10,10,38,0.74)'; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-out';
  function hole1(wx, wy, r, a) { var R = r * S * 1.18; x.globalAlpha = a; x.drawImage(hole, v.ox / q + wx * S - R, v.oy / q + wy * S - R, R * 2, R * 2); }
  var L = g.rule && g.rule.lit;
  if (L && L.length) for (i = 0; i < L.length; i++) hole1(L[i].x, L[i].y, L[i].r, L[i].light || i === 0 ? 1 : 0.8);
  else { hole1(g.gate.x, g.gate.y, 2.5, 0.95);
  for (i = 0; i < g.towers.length; i++) { var t = g.towers[i], T = TOWERS[t.k] || {}, li = T.light || t.k === 'bell'; hole1(t.x, t.y, ruSight(t), li ? 1 : 0.8); } }
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  return c;
}
function ruRuleOver(x, g, S, time, dt, rdt) {
  var v = RD.view, id = g.rule && g.rule.id, i;
  if (id === 'night') {
    x.drawImage(ruNightCv(g), 0, 0, v.W, v.H);
    // 불빛 밖의 적: 깜빡이는 눈빛 한 쌍
    var E = RU.eyes, gl = glowSpr('#ff5a3a', 16);
    for (i = 0; i < E.length; i += 5) {
      var hh = E[i + 3], r = Math.max(1.6 * v.dpr, hh * 0.05), gap = Math.max(r * 1.6, hh * 0.11), bk = Math.sin(time * 1.3 + E[i + 4] * 40) > 0.94 ? 0.15 : 1;
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.9 * bk; x.drawImage(gl, E[i] - gap - r * 3.5, E[i + 1] - r * 3, gap * 2 + r * 7, r * 6); x.globalCompositeOperation = 'source-over';
      x.globalAlpha = bk; x.fillStyle = '#fff2c0'; x.beginPath(); x.arc(E[i] - gap, E[i + 1], r, 0, 6.2832); x.arc(E[i] + gap, E[i + 1], r, 0, 6.2832); x.fill();
    }
    x.globalAlpha = 1;
  } else if (id === 'fog') {
    // 흐르는 안개: 큰 덩이 몇 개가 천천히 옆으로
    var F = RU.fogs; if (!F) { F = RU.fogs = []; for (i = 0; i < 10; i++) F.push({ y: (i + 0.2 + Math.random() * 0.6) / 10 * g.rows, x: Math.random() * (g.cols + 8) - 4, sp: 0.2 + Math.random() * 0.3, w: 7 + Math.random() * 4, a: 0.62 + Math.random() * 0.3 }); }
    var img = ruFogSpr();
    for (i = 0; i < F.length; i++) { var f = F[i]; f.x += f.sp * dt; if (f.x > g.cols + 2) f.x = -f.w - 1; x.globalAlpha = f.a * (0.85 + 0.15 * Math.sin(time * 0.7 + i)); x.drawImage(img, WX(f.x), WY(f.y) - S * f.w * 0.19, S * f.w, S * f.w * 0.38); }
    x.globalAlpha = 0.16; x.fillStyle = '#e6edf4'; x.fillRect(0, 0, v.W, v.H); x.globalAlpha = 1;
  }
  // 정전 순간: 화면이 깜빡 어두워짐
  if (RU.dark > 0) { RU.dark = Math.max(0, RU.dark - rdt); var da = RU.dark > 0.45 ? (Math.sin(RU.dark * 60) > 0 ? 0.42 : 0.12) : RU.dark / 0.45 * 0.3; if (fxScreenOk()) { x.globalAlpha = da; x.fillStyle = '#080a20'; x.fillRect(0, 0, v.W, v.H); x.globalAlpha = 1; } }
}
// ---------- 체력 막대 (적). 위에서 본 적, 큰 적, 하늘 높이에 맞춰 머리 위에 ----------
function ruBars(x, g, S, dt) {
  for (var i = 0; i < g.enemies.length; i++) {
    var e = g.enemies[i];
    if (e.hpLag == null || e.hpLag < e.hp) e.hpLag = e.hp; else if (e.hpLag > e.hp) e.hpLag = Math.max(e.hp, e.hpLag - e.mhp * 1.1 * Math.max(dt, 0.004));
    if (!(e.hp < e.mhp || e.shield > 0) || e.boss || (e.stealth && !e.revealed) || e.ruHid || e.fade > 0.6 || e.sub > 0.6) continue;
    var eh = EH(e) * ruGrow(e), top = ruTopK(ruKey(e)) ? ruHeadZ(e) + 0.1 : Math.max(e.fly ? ruFlyZ(e) + 0.03 + eh * 0.72 : eh * 0.94 + 0.05, ruHeadZ(e) + 0.06);
    drawBar(x, WX(e.x), WY(e.y) - S * top - Math.max(0, 4 * RD.view.dpr - S * 0.07), Math.max(S * Math.min(1.0, 0.46 + eh * 0.28), 20 * RD.view.dpr), e.hp / e.mhp, '#ff3d84', e.shield > 0 ? Math.min(1, e.shield / e.mhp) : 0, e.hpLag / e.mhp);
  }
}
// ---------- 화면 효과: 공습 경보, 우두머리 등장, 미사일 경고 ----------
function ruScreen(x, g, S, time, rdt) {
  var v = RD.view, i, ok = fxScreenOk();
  if (RU.alarm > 0) { RU.alarm = Math.max(0, RU.alarm - rdt); if (ok) { x.globalAlpha = 0.5 * Math.max(0, Math.sin(RU.alarm * 7.85)) * Math.min(1, RU.alarm * 2); x.drawImage(fxVig(RU.alarmCol || '#ff2a2a'), 0, 0, v.W, v.H); x.globalAlpha = 1; } }
  if (RU.bossIn) { var b = RU.bossIn; b.t += rdt; if (b.t >= b.T) RU.bossIn = null; else if (ok) { var u = b.t / b.T; x.globalAlpha = 0.55 * (1 - u) * (0.6 + 0.4 * Math.sin(b.t * 9)); x.drawImage(fxVig(b.col), 0, 0, v.W, v.H); x.globalAlpha = 1; } }
  // 미사일 경고: 곧 나오거나 날아오는 미사일의 항로 들머리에 빨간 세모가 깜빡, 항로를 따라 붉은 줄
  if (!g.air || !g.air.length) return;
  var W = RU.warn, n = g.air.length, q = g.spawnQ || [], any = 0;
  for (i = 0; i < n; i++) W[i] = 0;
  for (i = 0; i < g.enemies.length; i++) { var e = g.enemies[i]; if (e.lane && !e.dead && ruDanger(e.E, e.k)) { var pi = g.air.indexOf(e.P); if (pi >= 0) { W[pi] = 1; any = 1; } } }
  for (i = 0; i < q.length && i < 40; i++) { if (q[i].at - g.t > 1.6) break; var E = ENEMIES[q[i].type]; if (E && E.lane && ruDanger(E, q[i].type)) { W[((q[i].path | 0) % n + n) % n] = 1; any = 1; } }
  if (RU.lw) for (i = 0; i < n; i++) if (RU.lw[i] > RD.time) { W[i] = 1; any = 1; }
  if (!any) return;
  var bl = Math.sin(time * 12) > -0.2 ? 1 : 0.25, img = ruWarnSpr(), d = Math.max(S * 0.7, 24 * v.dpr);
  for (i = 0; i < RU.gates.length; i++) {
    var G = RU.gates[i]; if (G.kind !== 'air' || !W[G.pi]) continue;
    var P = g.air[G.pi], X = clamp(WX(G.x), v.ox + d * 0.6, v.ox + S * g.cols - d * 0.6), Y = clamp(WY(G.y), v.oy + d * 0.6, v.oy + S * g.rows - d * 0.6);
    x.globalAlpha = 0.5 * bl; x.strokeStyle = '#ff3a3a'; x.lineWidth = Math.max(2, S * 0.05); x.setLineDash([S * 0.2, S * 0.14]); x.lineDashOffset = -time * S * 3; x.beginPath(); x.moveTo(WX(P.xs[0]), WY(P.ys[0])); x.lineTo(WX(P.xs[P.n - 1]), WY(P.ys[P.n - 1])); x.stroke(); x.setLineDash([]);
    x.globalAlpha = bl; x.drawImage(img, X - d / 2, Y - d / 2, d, d); x.globalAlpha = 1;
  }
}
function ruDanger(E, k) { return k === 'missile' || (E && E.lane && E.leak >= 3); }

// 시험용 (tools/rushot.py)
if (typeof window !== 'undefined') window.__ru = { RU: RU, ev: function (o) { if (window.__td && window.__td.G()) window.__td.G().ev.push(o); }, dieKind: ruDieKind, topK: ruTopK, guide: function (o) { RU.guide = o; }, uis: function () { return UIS; }, towers: function () { return TOWERS; }, themes: function () { return THEME; },
  // 프레임 시간 재기(구간 재기 없이 n장 그린 뒤 한 번만 화면을 읽어 옴): 전후 비교용
  // 내 고리(땅, 그림자, 적 아래와 덮개, 탑 덮개, 하늘, 규칙 덮개, 막대, 화면)만 따로 그린 시간과 한 프레임 전체 시간을 번갈아 잼 (같은 순간에 재므로 다른 작업의 영향을 덜 받음)
  share: function (n) {
    var G = window.__td.G(), x = RD.x, S = RD.view.S, i, j, a = 0, b = 0, t0, tm, P = { ground: 0, shadows: 0, enemies: 0, towers: 0, sky: 0, rule: 0, bars: 0, screen: 0 };
    function lap(k) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.getImageData(0, 0, 1, 1); var t = performance.now(); P[k] += t - t0; b += t - t0; t0 = t; }
    for (i = 0; i < n; i++) {
      stepGame(G, DT); rdEvents(G);
      x.getImageData(0, 0, 1, 1); t0 = performance.now(); rdFrame(G, DT, DT); x.getImageData(0, 0, 1, 1); a += performance.now() - t0;
      t0 = performance.now(); tm = RD.time;
      ruGround(x, G, S, tm, 0, 0); lap('ground'); ruShadows(x, G, S, tm); lap('shadows');
      for (j = 0; j < G.enemies.length; j++) { var e = G.enemies[j], rv = ruView(G, e, S, tm), fr = enemyFrames(rv.k, S); if (rv.hide) continue; ruUnder(x, G, e, rv, fr, 0, WX(e.x), WY(e.y) - rv.z * S, S, tm); EN_OVER(x, G, e, WX(e.x), WY(e.y) - rv.z * S, EH(e) * S * rv.sc, tm); }
      lap('enemies');
      for (j = 0; j < G.towers.length; j++) TW_OVER(x, G, G.towers[j], WX(G.towers[j].x), WY(G.towers[j].y + 0.3), S, tm);
      lap('towers'); ruSky(x, G, S, tm, 0); lap('sky'); ruRuleOver(x, G, S, tm, 0, 0); lap('rule'); ruBars(x, G, S, 0); lap('bars'); ruScreen(x, G, S, tm, 0); lap('screen');
    }
    for (var k in P) P[k] = +(P[k] / n).toFixed(2);
    return { frame: +(a / n).toFixed(2), mine: +(b / n).toFixed(2), en: G.enemies.length, tw: G.towers.length, parts: P, guide: RU.guide ? 1 : 0 };
  },
  frame: function (n) { var G = window.__td.G(), x = RD.x, i, t0; x.getImageData(0, 0, 1, 1); t0 = performance.now(); for (i = 0; i < n; i++) { stepGame(G, DT); rdEvents(G); rdFrame(G, DT, DT); } x.getImageData(0, 0, 1, 1); return (performance.now() - t0) / n; } };
