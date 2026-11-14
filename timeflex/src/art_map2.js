// ===== art_map2.js : 2장(저주받은 밤), 3장(강철 전선) 지형 테마 8종 (MA 갈래, 접두사 mq) =====
// 기존 9종(art_map.js)과 같은 등록 구조: THEME[키], PROPS[소품], 성문, 배경 한 장 굽기.
// art_map.js, render.js, art_fx.js는 고치지 않고, 이 파일 끝의 '고리'에서 네 함수(renderBackground, propSpr, gateSpr, drawAmbient)를
// 감싸 mq 테마일 때만 가로챈다. 다른 테마는 원래 함수로 그대로 넘어간다.
// 격자 크기는 COLS, ROWS와 넘겨받은 view만 쓴다(상수 없음).
var MQ_W = 1.5;                 // 지금 그리는 소품의 외곽선 굵기
var MQ_INK = '#0c0b16';
function mqInkC(c) { return mixc(c, MQ_INK, 0.76); }
function mqInk(x, s, c, w) { x.save(); x.strokeStyle = mqInkC(c); x.lineWidth = w == null ? MQ_W : w; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(s.p); x.restore(); }
function mqR(x0, y0, w, h) { return shp().poly([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]]); }
function mqSolid(x, s, c, hi, lo) { litFill(x, s, c, { hi: hi == null ? 0.22 : hi, lo: lo == null ? 0.4 : lo }); mqInk(x, s, c); return s; }
function mqCv(S, w, h, gyF) { var c = mkC(S * w, S * h); MQ_W = Math.max(1.3, S * 0.036); return { c: c, x: cx2(c), gx: S * w / 2, gy: S * h * (gyF || 0.88) }; }
function mqGlow(x, cx, cy, r, col, a) { x.save(); x.globalCompositeOperation = 'lighter'; glowAt(x, cx, cy, r, col, a); x.restore(); }
// 굵은 선(외곽선 깔고 색 선)
function mqLine(x, pts, w, col, noInk) {
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
  for (var i = 0; i < pts.length; i++) { if (i) x.lineTo(pts[i][0], pts[i][1]); else x.moveTo(pts[i][0], pts[i][1]); }
  if (!noInk) { x.strokeStyle = mqInkC(col); x.lineWidth = w + MQ_W * 1.7; x.stroke(); }
  x.strokeStyle = col; x.lineWidth = w; x.stroke(); x.restore();
}
// 상자(비스듬히 위에서 본 모습): 앞면 w x h, 윗면 깊이 d. (cx, by) = 앞면 아래 가운데
function mqBox(x, cx, by, w, h, d, col, topK) {
  var x0 = cx - w / 2, fr = mqR(x0, by - h, w, h), top = mqR(x0, by - h - d, w, d), all = mqR(x0, by - h - d, w, h + d);
  litFill(x, fr, col, { hi: 0.08, lo: 0.42, ax: 0, ay: 0, bx: 0.25, by: 1 });
  x.fillStyle = lit(col, topK == null ? 0.34 : topK); x.fill(top.p);
  x.fillStyle = rgba(lit(col, 0.7), 0.75); x.fillRect(x0, by - h - MQ_W * 0.35, w, MQ_W * 0.7);
  x.fillStyle = rgba(drk(col, 0.7), 0.35); x.fillRect(x0 + w * 0.86, by - h, w * 0.14, h);
  mqInk(x, all, col);
  return { fr: fr, top: top, all: all, x0: x0, y0: by - h, w: w, h: h };
}
// 세운 원통(드럼통, 기둥, 말뚝)
function mqCyl(x, cx, by, r, h, col, topC) {
  var ry = r * 0.36, s = shp(), p = s.p;
  p.moveTo(cx - r, by - h); p.lineTo(cx - r, by); p.ellipse(cx, by, r, ry, 0, Math.PI, 0, true); p.lineTo(cx + r, by - h); p.ellipse(cx, by - h, r, ry, 0, 0, Math.PI, true); p.closePath();
  s.ext(cx - r, by - h - ry); s.ext(cx + r, by + ry);
  cylFill(x, s, col, { hi: 0.32, lo: 0.5 }); mqInk(x, s, col);
  var t = shp().ell(cx, by - h, r, ry); x.fillStyle = topC || lit(col, 0.3); x.fill(t.p); mqInk(x, t, col, MQ_W * 0.8);
  return s;
}
// 불꽃(촛불, 횃불): 바깥 색, 속 색
function mqFlame(x, cx, by, r, c0, c1) {
  var s = shp(), p = s.p; p.moveTo(cx, by - r * 2.5); p.quadraticCurveTo(cx + r * 1.25, by - r * 0.9, cx + r * 0.72, by - r * 0.1); p.quadraticCurveTo(cx, by + r * 0.5, cx - r * 0.72, by - r * 0.1); p.quadraticCurveTo(cx - r * 1.25, by - r * 0.9, cx, by - r * 2.5); p.closePath();
  mqGlow(x, cx, by - r, r * 4.2, c0, 0.5);
  x.fillStyle = c0; x.fill(p);
  x.fillStyle = c1; x.beginPath(); x.ellipse(cx, by - r * 0.55, r * 0.38, r * 0.72, 0, 0, Math.PI * 2); x.fill();
}

// ---------- 테마 표 (기존 THEME과 같은 칸 + mq 전용 칸) ----------
// mq: 1(이 파일 담당), ch: 장, gnd: 땅 무늬, road: 길 모양, d: 보물 소품, e: 숨은 탑 덮개, blk: 바위 칸('#') 소품 목록,
// veil/veilA: 격자 밖 덮개, rim: 소품 가장자리 빛, ui: 지도와 미리보기 대표색 { band: [진, 중, 밝], accent, ink }
var MQ_THEMES = {
  graveyard: { mq: 1, ch: 2, gnd: 'wild', road: 'gravel', amb: 'mist',
    g: ['#263848', '#2e4454', '#3a5562'], patch: '#44646a', grass: ['#141f2a', '#40605e', '#5e807a', '#8cae9e'], dirt: ['#141a28', '#959db0', '#a9b0c0', '#d6dbe6'],
    tree: ['#131b20', '#25353a', '#3a5250', '#6c8c82'], trunk: '#322c3c', rock: '#8088a0', moss: '#4f7a68', flowers: ['#c8d8f0', '#9ab0d8'], water: ['#1c4a5e', '#2c6878', '#a8dce4'], shore: '#3a4656',
    light: '#b8ccff', lightA: 0.1, shade: '#120a30', veil: '#070616', veilA: 0.42, rim: '#aec2f4',
    props: ['qdead', 'qtomb', 'qfence', 'qtombB', 'qdead', 'qfence'], a: 'qtomb', b: 'qfence', c: 'qdead', C: 'qmaus', d: 'qchest', e: 'qtombB', blk: ['qtombB', 'qdead', 'qfence'],
    ui: { band: ['#2c4052', '#3a5466', '#4c6a7a'], accent: '#a8c4ff', ink: '#0e1420' } },
  manor: { mq: 1, ch: 2, gnd: 'wild', road: 'cobble', amb: 'leaves2',
    g: ['#372f42', '#42384c', '#4f4458'], patch: '#5c4c50', grass: ['#1c1826', '#55503e', '#746c48', '#a09460'], dirt: ['#1c1624', '#9a8ea0', '#aea2b0', '#d8ced4'],
    tree: ['#151d1a', '#27362c', '#3c5040', '#6c8262'], trunk: '#33272f', rock: '#8e8698', moss: '#5a6a4a', flowers: ['#8e2c4c', '#b44c60', '#5c2238'], water: ['#20424a', '#30606a', '#a4d0d0'], shore: '#4a4452',
    light: '#ffd9a0', lightA: 0.1, shade: '#160c2c', veil: '#0a0616', veilA: 0.4, rim: '#e8c8a0',
    props: ['qrose', 'qlamp', 'qhedge', 'qurn', 'qdead', 'qlamp'], a: 'qrose', b: 'qurn', c: 'qstatue', C: 'qfount', d: 'qchest', e: 'qurn', blk: ['qlamp', 'qhedge', 'qstatue'],
    ui: { band: ['#40374a', '#52465c', '#665a70'], accent: '#ffb85a', ink: '#140e1c' } },
  pumpkin: { mq: 1, ch: 2, gnd: 'wild', road: 'mud', amb: 'bats',
    g: ['#2e3324', '#393f2a', '#464c30'], patch: '#5e5632', grass: ['#1a1e14', '#4c5430', '#6c7238', '#9c9a4c'], dirt: ['#1c1310', '#8a6a4e', '#9c7a5c', '#c8a67c'],
    tree: ['#1a2214', '#34401e', '#566428', '#8c903c'], trunk: '#3c2c22', rock: '#7c766a', moss: '#5a6a30', flowers: ['#ff9a2a', '#ffc24a'], water: ['#1e4038', '#2e5e50', '#a0d0b8'], shore: '#3a3424',
    light: '#ffc070', lightA: 0.1, shade: '#1a0c2a', veil: '#0a0812', veilA: 0.4, rim: '#f0c890',
    props: ['qcorn', 'qpump', 'qcorn', 'qscare', 'qcorn', 'qlantern'], a: 'qpump', b: 'qhay', c: 'qscare', C: 'qbigpump', d: 'qchest', e: 'qhay', blk: ['qcorn', 'qlantern', 'qpump'],
    ui: { band: ['#3a3f2a', '#4c5234', '#606840'], accent: '#ff8a2a', ink: '#12140c' } },
  crypt: { mq: 1, ch: 2, gnd: 'flag', road: 'flag', amb: 'cryptdust', wall: 1,
    g: ['#2b2b3c', '#343448', '#404056'], patch: '#35474f', grass: ['#12121c', '#3c3c52', '#52526c', '#7c7c9a'], dirt: ['#100f18', '#8484a0', '#9898b2', '#c6c6da'],
    tree: ['#141420', '#2a2a3c', '#40405a', '#70708c'], trunk: '#2c2c3a', rock: '#74748e', moss: '#3a6a6a', flowers: ['#5ad0ff'], water: ['#16384a', '#245a6e', '#9ad8ec'], shore: '#2a2a3a',
    light: '#9ad0ff', lightA: 0.1, shade: '#0a0820', veil: '#05040c', veilA: 0.62, rim: '#9ac8f0',
    props: ['qcol', 'qcandle', 'qcol', 'qtorch', 'qcol', 'qcolB'], a: 'qcandle', b: 'qcolB', c: 'qtorch', C: 'qsarc', d: 'qchest', e: 'qcolB', blk: ['qcol', 'qtorch', 'qcol'],
    ui: { band: ['#2e2e42', '#3c3c56', '#4e4e6c'], accent: '#5ad0ff', ink: '#0a0a14' } },
  city: { mq: 1, ch: 3, gnd: 'pave', road: 'asphalt', amb: 'rain',
    g: ['#565a62', '#61656c', '#6c7076'], patch: '#767470', grass: ['#3a3e40', '#5a6450', '#74806a', '#98a088'], dirt: ['#15171b', '#3c3f47', '#484b54', '#6c7079'],
    tree: ['#2a3028', '#465040', '#627058', '#8e9a80'], trunk: '#3a3a3e', rock: '#8c8e90', moss: '#6a7a5a', flowers: ['#e8862a'], water: ['#2a4a5a', '#3a6474', '#b0d4dc'], shore: '#5a5e64',
    light: '#ffd2a0', lightA: 0.1, shade: '#121a30', veil: '#12141c', veilA: 0.3, rim: '#ffd8a8',
    props: ['qjersey', 'qcar', 'qslamp', 'qcont1', 'qcone', 'qsignal'], a: 'qcone', b: 'qjersey', c: 'qcar', C: 'qcont', d: 'qcrate', e: 'qjersey', blk: ['qblock', 'qsignal', 'qcar'],
    ui: { band: ['#5c6068', '#70747c', '#868a90'], accent: '#ff8a2a', ink: '#15171b' } },
  desert: { mq: 1, ch: 3, gnd: 'sand', road: 'packed', amb: 'sandwind',
    g: ['#b0986c', '#bea678', '#cab486'], patch: '#d4c094', grass: ['#7a6a4a', '#94845a', '#a89868', '#d8caa0'], dirt: ['#57432e', '#8a6e4c', '#987c58', '#bca078'],
    tree: ['#4a5234', '#667048', '#828c5c', '#b0b684'], trunk: '#5a4a38', rock: '#9c886c', moss: '#b8a878', flowers: ['#e8742a'], water: ['#2a7a84', '#48a0a4', '#c4ecea'], shore: '#a08a60',
    light: '#fff0c8', lightA: 0.14, shade: '#5a3a2a', veil: '#3a2a1a', veilA: 0.16, rim: '#fff0d0',
    props: ['qsandbag', 'qwire', 'qdrum', 'qantenna', 'qrockD', 'qhedgehog'], a: 'qdrum', b: 'qwire', c: 'qsandbag', C: 'qradar', d: 'qcrate', e: 'qsandbag', blk: ['qrockD', 'qhedgehog', 'qsandbag'],
    ui: { band: ['#a89068', '#bca67c', '#d0bc92'], accent: '#e8742a', ink: '#3a2c1c' } },
  harbor: { mq: 1, ch: 3, gnd: 'dock', road: 'concrete', amb: 'gulls', quay: 1,
    g: ['#56616b', '#616c75', '#6d787f'], patch: '#788286', grass: ['#343c44', '#566068', '#6c767c', '#98a0a4'], dirt: ['#262c32', '#a8aca8', '#b8bcb6', '#dcded6'],
    tree: ['#2c3438', '#485458', '#66747a', '#94a0a4'], trunk: '#3c4046', rock: '#7c828a', moss: '#6a7a70', flowers: ['#ff8a2a'], water: ['#1d4f6e', '#2b6c8c', '#b4dcea'], shore: '#8c9298',
    light: '#e0ecff', lightA: 0.1, shade: '#0e1a30', veil: '#0e1622', veilA: 0.24, rim: '#e4ecf4',
    props: ['qcont1', 'qcrane', 'qdrum', 'qcont1', 'qbollard', 'qcont1'], a: 'qbollard', b: 'qdrum', c: 'qcont1', C: 'qcont', d: 'qcrate', e: 'qdrum', blk: ['qcont1', 'qblock', 'qcont1'],
    ui: { band: ['#2b5a78', '#4a7890', '#7c98a4'], accent: '#ff8a2a', ink: '#0e1a26' } },
  airfield: { mq: 1, ch: 3, gnd: 'field', road: 'taxiway', amb: 'wind',
    g: ['#535e3c', '#5e6a42', '#6a764a'], patch: '#788254', grass: ['#38422a', '#6c7848', '#84905a', '#a8b078'], dirt: ['#16181c', '#41454c', '#4d5159', '#72767e'],
    tree: ['#2e3824', '#4a5838', '#68784c', '#98a474'], trunk: '#4a4236', rock: '#8c8e8a', moss: '#7a8458', flowers: ['#ffb02a'], water: ['#2a5a70', '#3e7a8e', '#b8dce6'], shore: '#6a7050',
    light: '#fff4d8', lightA: 0.12, shade: '#18222e', veil: '#141a12', veilA: 0.2, rim: '#f4f0d8',
    props: ['qhangar', 'qwindsock', 'qradarS', 'qlight', 'qdrum', 'qgen'], a: 'qlight', b: 'qdrum', c: 'qgen', C: 'qhangar', d: 'qcrate', e: 'qgen', blk: ['qblock', 'qwindsock', 'qradarS'],
    ui: { band: ['#55603e', '#687448', '#7e8a58'], accent: '#ffb02a', ink: '#161a10' } }
};
Object.keys(MQ_THEMES).forEach(function (k) { THEME[k] = MQ_THEMES[k]; });

// ---------- 소품 (PROPS에 q 이름으로 등록. 모두 땅 닿는 점이 기준) ----------
function mqTomb(x, gx, gy, w, h, col, v, T) {
  var s = shp(), p = s.p, x0 = gx - w / 2;
  if (v === 0) { p.moveTo(x0, gy); p.lineTo(x0, gy - h + w / 2); p.arc(gx, gy - h + w / 2, w / 2, Math.PI, 0); p.lineTo(x0 + w, gy); }
  else if (v === 1) { p.moveTo(x0, gy); p.lineTo(x0, gy - h * 0.7); p.lineTo(gx, gy - h); p.lineTo(x0 + w, gy - h * 0.7); p.lineTo(x0 + w, gy); }
  else { p.moveTo(x0, gy); p.lineTo(x0, gy - h * 0.78); p.lineTo(x0 + w * 0.22, gy - h * 0.78); p.lineTo(x0 + w * 0.22, gy - h); p.lineTo(x0 + w * 0.78, gy - h); p.lineTo(x0 + w * 0.78, gy - h * 0.78); p.lineTo(x0 + w, gy - h * 0.78); p.lineTo(x0 + w, gy); }
  p.closePath(); s.ext(x0, gy - h); s.ext(x0 + w, gy);
  litFill(x, s, col, { hi: 0.34, lo: 0.5 });
  x.save(); x.clip(s.p);
  x.fillStyle = rgba(drk(col, 0.7), 0.5); x.fillRect(x0 + w * 0.8, gy - h, w * 0.2, h);
  x.fillStyle = rgba(drk(col, 0.75), 0.6); x.fillRect(x0 + w * 0.2, gy - h * 0.56, w * 0.46, Math.max(1, h * 0.06)); x.fillRect(x0 + w * 0.2, gy - h * 0.4, w * 0.3, Math.max(1, h * 0.06));
  x.fillStyle = rgba(T.moss, 0.7); x.beginPath(); x.ellipse(x0 + w * 0.2, gy, w * 0.42, h * 0.16, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgba(T.rim, 0.5); x.fillRect(x0, gy - h, w * 0.1, h);
  x.restore(); mqInk(x, s, col);
}
function mqPumpkin(x, cx, by, r, face, stemC) {
  var col = '#e2761c', ry = r * 0.78, cy = by - ry, s = shp();
  [-0.52, 0.52, 0].forEach(function (u) { s.ell(cx + u * r, cy, r * (u ? 0.56 : 0.62), ry); });
  x.fillStyle = mqInkC(col); [-0.52, 0.52, 0].forEach(function (u) { x.beginPath(); x.ellipse(cx + u * r, cy, r * (u ? 0.56 : 0.62) + MQ_W, ry + MQ_W, 0, 0, Math.PI * 2); x.fill(); });
  [-0.52, 0.52, 0].forEach(function (u) { var e = shp().ell(cx + u * r, cy, r * (u ? 0.56 : 0.62), ry); litFill(x, e, u ? '#cc6416' : col, { hi: 0.3, lo: 0.42 }); });
  x.strokeStyle = rgba('#7a3208', 0.55); x.lineWidth = Math.max(0.8, r * 0.06); [-0.3, 0.3].forEach(function (u) { x.beginPath(); x.ellipse(cx + u * r, cy, r * 0.3, ry * 0.94, 0, u < 0 ? 1.6 : -1.5, u < 0 ? 4.7 : 1.5); x.stroke(); });
  x.fillStyle = 'rgba(255,214,150,0.6)'; x.beginPath(); x.ellipse(cx - r * 0.42, cy - ry * 0.4, r * 0.2, ry * 0.16, -0.5, 0, Math.PI * 2); x.fill();
  mqLine(x, [[cx, cy - ry * 0.9], [cx + r * 0.1, cy - ry * 1.25]], Math.max(1.2, r * 0.16), stemC || '#4a5a2a');
  if (face) {
    mqGlow(x, cx, cy, r * 1.5, '#ffb030', 0.4);
    x.fillStyle = '#2a1206'; var f = shp(), p = f.p;
    [-1, 1].forEach(function (sd) { p.moveTo(cx + sd * r * 0.46, cy - ry * 0.34); p.lineTo(cx + sd * r * 0.14, cy - ry * 0.08); p.lineTo(cx + sd * r * 0.5, cy + ry * 0.02); p.closePath(); });
    p.moveTo(cx - r * 0.56, cy + ry * 0.22); p.lineTo(cx - r * 0.3, cy + ry * 0.34); p.lineTo(cx - r * 0.14, cy + ry * 0.22); p.lineTo(cx, cy + ry * 0.36); p.lineTo(cx + r * 0.14, cy + ry * 0.22); p.lineTo(cx + r * 0.3, cy + ry * 0.34); p.lineTo(cx + r * 0.56, cy + ry * 0.22); p.lineTo(cx + r * 0.34, cy + ry * 0.62); p.lineTo(cx - r * 0.34, cy + ry * 0.62); p.closePath();
    x.lineWidth = MQ_W; x.strokeStyle = '#2a1206'; x.lineJoin = 'round'; x.stroke(p); x.fillStyle = '#ffd84a'; x.fill(p);
    x.fillStyle = '#fff6c0'; x.beginPath(); x.ellipse(cx, cy + ry * 0.46, r * 0.2, ry * 0.08, 0, 0, Math.PI * 2); x.fill();
  }
}
// 컨테이너 한 개 (cx, by 앞면 아래 가운데)
var MQ_CONT = ['#5a6a48', '#b8642a', '#4a6480', '#7c766a', '#8a4038', '#5a6a48'];
function mqContainer(x, cx, by, w, h, d, col) {
  var b = mqBox(x, cx, by, w, h, d, col, 0.26), n = Math.max(5, Math.round(w / (h * 0.22)));
  x.save(); x.clip(b.fr.p);
  for (var i = 1; i < n; i++) { var px = b.x0 + w * i / n; x.fillStyle = rgba(drk(col, 0.7), 0.4); x.fillRect(px, by - h, Math.max(1, w * 0.012), h); x.fillStyle = rgba(lit(col, 0.6), 0.28); x.fillRect(px + Math.max(1, w * 0.012), by - h, Math.max(1, w * 0.012), h); }
  x.fillStyle = rgba(drk(col, 0.8), 0.5); x.fillRect(b.x0, by - h * 0.12, w, h * 0.12); x.fillRect(b.x0, by - h, w, h * 0.08);
  x.fillStyle = rgba('#3a1c10', 0.3); x.beginPath(); x.ellipse(b.x0 + w * 0.3, by, w * 0.2, h * 0.3, 0, 0, Math.PI * 2); x.fill();
  x.restore();
  x.fillStyle = mqInkC(col); x.fillRect(b.x0 + w * 0.78, by - h * 0.86, Math.max(1.2, w * 0.022), h * 0.72); x.fillRect(b.x0 + w * 0.9, by - h * 0.86, Math.max(1.2, w * 0.022), h * 0.72);
  return b;
}
function mqHazard(x, x0, y0, w, h, n, c0, c1) {
  x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip(); x.fillStyle = c0 || '#e8862a'; x.fillRect(x0, y0, w, h); x.fillStyle = c1 || '#1c1c20';
  var sw = w / n; for (var i = -1; i < n + 1; i += 2) { x.beginPath(); x.moveTo(x0 + i * sw, y0 + h); x.lineTo(x0 + (i + 1) * sw, y0 + h); x.lineTo(x0 + (i + 1) * sw + h, y0); x.lineTo(x0 + i * sw + h, y0); x.closePath(); x.fill(); }
  x.restore();
}
var MQ_PROPS = {
  // ===== 2장 =====
  qdead: function (S, T, rnd) {
    var o = mqCv(S, 1.7, 2.0, 0.93), x = o.x, gx = o.gx, gy = o.gy, sz = S * (0.92 + rnd() * 0.18), col = T.trunk, segs = [];
    softShadow(x, gx + sz * 0.1, gy, sz * 0.42, sz * 0.12, 0.5);
    function br(x0, y0, a, len, w, d) {
      var x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; segs.push([x0, y0, x1, y1, w, w * 0.62]);
      if (d > 0) { br(x1, y1, a - 0.5 - rnd() * 0.35, len * 0.64, w * 0.62, d - 1); br(x1, y1, a + 0.45 + rnd() * 0.35, len * 0.58, w * 0.62, d - 1); }
    }
    br(gx, gy, -Math.PI / 2 + (rnd() - 0.5) * 0.3, sz * 0.6, sz * 0.17, 3);
    segs.push([gx - sz * 0.14, gy + sz * 0.01, gx, gy - sz * 0.12, sz * 0.07, sz * 0.12]); segs.push([gx + sz * 0.15, gy + sz * 0.01, gx, gy - sz * 0.12, sz * 0.07, sz * 0.12]);
    x.fillStyle = mqInkC(col); segs.forEach(function (s) { x.fill(limbShape(s[0], s[1], s[2], s[3], s[4] + MQ_W * 2, s[5] + MQ_W * 2).p); });
    x.fillStyle = col; segs.forEach(function (s) { x.fill(limbShape(s[0], s[1], s[2], s[3], s[4], s[5]).p); });
    x.fillStyle = rgba(T.rim, 0.6); segs.forEach(function (s) { x.fill(limbShape(s[0] - s[4] * 0.24, s[1], s[2] - s[5] * 0.24, s[3], s[4] * 0.3, s[5] * 0.3).p); });
    return spr(o.c, gx, gy);
  },
  qtomb: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.2, 1.2, 0.86), x = o.x, gx = o.gx, gy = o.gy;
    softShadow(x, gx + S * 0.06, gy, S * 0.4, S * 0.11, 0.5);
    x.fillStyle = drk(T.g[0], 0.35); x.beginPath(); x.ellipse(gx, gy + S * 0.01, S * 0.36, S * 0.1, 0, 0, Math.PI * 2); x.fill();
    if (seed % 2) mqTomb(x, gx + S * 0.24, gy - S * 0.02, S * 0.22, S * 0.3, drk(T.rock, 0.15), (seed + 1) % 3, T);
    mqTomb(x, gx - (seed % 2 ? S * 0.1 : 0), gy, S * 0.46, S * 0.64, T.rock, seed % 3, T);
    return spr(o.c, gx, gy);
  },
  qtombB: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.3, 1.5, 0.88), x = o.x, gx = o.gx, gy = o.gy;
    softShadow(x, gx + S * 0.08, gy, S * 0.5, S * 0.14, 0.5);
    mqBox(x, gx, gy, S * 0.74, S * 0.12, S * 0.1, drk(T.rock, 0.12));
    mqTomb(x, gx, gy - S * 0.14, S * 0.5, S * 0.74, T.rock, seed % 3, T);
    if (seed % 2 === 0) { x.fillStyle = rgba(T.rim, 0.85); x.beginPath(); x.arc(gx - S * 0.03, gy - S * 0.62, S * 0.07, 0.9, 5.2); x.arc(gx + S * 0.0, gy - S * 0.62, S * 0.055, 5.2, 0.9, true); x.fill(); }
    return spr(o.c, gx, gy);
  },
  qfence: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.3, 1.2, 0.86), x = o.x, gx = o.gx, gy = o.gy, w = S * 0.92, h = S * (0.56 + (seed % 2) * 0.06), iron = '#3a3d52', n = 5;
    softShadow(x, gx + S * 0.05, gy, w * 0.55, S * 0.09, 0.45);
    for (var i = 0; i < n; i++) { var bx = gx - w * 0.36 + i * w * 0.18, bh = h * (0.92 + (i % 2) * 0.1) - ((seed + i) % 5 === 0 ? h * 0.22 : 0); mqLine(x, [[bx, gy - S * 0.04], [bx, gy - bh]], Math.max(1.4, S * 0.04), iron); var t = shp().poly([[bx - S * 0.05, gy - bh + S * 0.02], [bx, gy - bh - S * 0.11], [bx + S * 0.05, gy - bh + S * 0.02]]); mqSolid(x, t, '#565a74', 0.4, 0.2); }
    mqLine(x, [[gx - w * 0.46, gy - h * 0.72], [gx + w * 0.46, gy - h * 0.72]], Math.max(1.4, S * 0.045), iron);
    mqLine(x, [[gx - w * 0.46, gy - h * 0.2], [gx + w * 0.46, gy - h * 0.2]], Math.max(1.4, S * 0.045), iron);
    [-1, 1].forEach(function (sd) { mqBox(x, gx + sd * w * 0.48, gy, S * 0.15, h * 1.02, S * 0.06, T.rock); var b = shp().ell(gx + sd * w * 0.48, gy - h * 1.02 - S * 0.11, S * 0.065, S * 0.065); mqSolid(x, b, lit(T.rock, 0.15), 0.4, 0.4); });
    return spr(o.c, gx, gy);
  },
  qmaus: function (S, T, rnd) {
    var o = mqCv(S, 2.5, 2.7, 0.9), x = o.x, gx = o.gx, gy = o.gy, col = T.rock, w = S * 1.46, h = S * 0.86;
    softShadow(x, gx + S * 0.12, gy, S * 1.0, S * 0.26, 0.55);
    mqBox(x, gx, gy, w * 1.14, S * 0.12, S * 0.12, drk(col, 0.2));
    var b = mqBox(x, gx, gy - S * 0.13, w, h, S * 0.2, col, 0.22);
    x.save(); x.clip(b.fr.p); x.fillStyle = rgba(drk(col, 0.7), 0.3); for (var r = 1; r < 5; r++) x.fillRect(b.x0, b.y0 + h * r / 5, w, Math.max(1, S * 0.014)); x.restore();
    var rf = shp().poly([[gx - w * 0.6, gy - S * 0.13 - h - S * 0.04], [gx, gy - S * 0.13 - h - S * 0.56], [gx + w * 0.6, gy - S * 0.13 - h - S * 0.04]]); mqSolid(x, rf, lit(col, 0.12), 0.3, 0.45);
    var tr = shp().poly([[gx - w * 0.36, gy - S * 0.13 - h - S * 0.1], [gx, gy - S * 0.13 - h - S * 0.42], [gx + w * 0.36, gy - S * 0.13 - h - S * 0.1]]); x.fillStyle = rgba(drk(col, 0.6), 0.5); x.fill(tr.p);
    var cb = mqR(gx - w * 0.64, gy - S * 0.13 - h - S * 0.09, w * 1.28, S * 0.1); mqSolid(x, cb, lit(col, 0.2), 0.3, 0.3);
    var dr = shp(); dr.p.moveTo(gx - S * 0.24, gy - S * 0.13); dr.p.lineTo(gx - S * 0.24, gy - S * 0.54); dr.p.arc(gx, gy - S * 0.54, S * 0.24, Math.PI, 0); dr.p.lineTo(gx + S * 0.24, gy - S * 0.13); dr.p.closePath(); dr.ext(gx - S * 0.24, gy - S * 0.8); dr.ext(gx + S * 0.24, gy - S * 0.13);
    x.fillStyle = '#0c0a18'; x.fill(dr.p); x.save(); x.clip(dr.p); mqGlow(x, gx, gy - S * 0.3, S * 0.4, '#58e0c8', 0.55); x.strokeStyle = '#1a1c2a'; x.lineWidth = Math.max(1.4, S * 0.035); for (var k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(gx + k * S * 0.09, gy - S * 0.8); x.lineTo(gx + k * S * 0.09, gy - S * 0.13); x.stroke(); } x.beginPath(); x.moveTo(gx - S * 0.24, gy - S * 0.44); x.lineTo(gx + S * 0.24, gy - S * 0.44); x.stroke(); x.restore(); mqInk(x, dr, col);
    [-1, 1].forEach(function (sd) { mqCyl(x, gx + sd * w * 0.4, gy - S * 0.1, S * 0.085, h * 0.92, lit(col, 0.12)); });
    x.fillStyle = rgba(T.moss, 0.55); x.beginPath(); x.ellipse(gx - w * 0.4, gy - S * 0.06, S * 0.3, S * 0.08, 0, 0, Math.PI * 2); x.fill();
    return spr(o.c, gx, gy);
  },
  // 2장 보물: 쇠 띠 두른 검은 나무 궤, 틈으로 금빛
  qchest: function (S, T) {
    var o = mqCv(S, 1.2, 1.1, 0.84), x = o.x, gx = o.gx, gy = o.gy, w = S * 0.56, h = S * 0.26, wood = '#5c3a48', brass = '#d8a83a';
    softShadow(x, gx + S * 0.05, gy, S * 0.42, S * 0.12, 0.5);
    mqGlow(x, gx, gy - h, S * 0.55, '#ffcf5a', 0.4);
    mqBox(x, gx, gy, w, h, 0.01, wood);
    var lid = shp(); lid.p.moveTo(gx - w / 2, gy - h - S * 0.03); lid.p.bezierCurveTo(gx - w / 2, gy - h - S * 0.3, gx + w / 2, gy - h - S * 0.3, gx + w / 2, gy - h - S * 0.03); lid.p.closePath(); lid.ext(gx - w / 2, gy - h - S * 0.25); lid.ext(gx + w / 2, gy - h);
    mqSolid(x, lid, lit(wood, 0.08), 0.3, 0.4);
    x.fillStyle = '#ffe07a'; x.fillRect(gx - w / 2 + MQ_W, gy - h - S * 0.035, w - MQ_W * 2, S * 0.04);
    [-0.3, 0.3].forEach(function (u) { var b = mqR(gx + u * w - S * 0.04, gy - h - S * 0.21, S * 0.08, h + S * 0.21); litFill(x, b, brass, { hi: 0.4, lo: 0.4 }); mqInk(x, b, brass, MQ_W * 0.7); });
    var lk = shp().rrect(gx - S * 0.055, gy - h - S * 0.02, S * 0.11, S * 0.13, S * 0.02); mqSolid(x, lk, brass, 0.5, 0.3); x.fillStyle = '#2a1a10'; x.beginPath(); x.arc(gx, gy - h + S * 0.04, S * 0.02, 0, Math.PI * 2); x.fill();
    twTwinkle(x, gx + w * 0.3, gy - h - S * 0.2, S * 0.07, 0.95);
    return spr(o.c, gx, gy);
  },
  qrose: function (S, T, rnd, seed, th, wide) {
    var o = mqCv(S, 1.4, 1.1, 0.84), x = o.x, gx = o.gx, gy = o.gy, R = S * (wide ? 0.34 : 0.3);
    softShadow(x, gx + S * 0.05, gy, R * (wide ? 1.9 : 1.5), R * 0.42, 0.5);
    var bl = wide ? [[gx - R * 0.95, gy - R * 0.6, R * 0.62], [gx, gy - R * 0.72, R * 0.7], [gx + R * 0.95, gy - R * 0.6, R * 0.62], [gx - R * 0.45, gy - R * 1.1, R * 0.45], [gx + R * 0.5, gy - R * 1.08, R * 0.45]] : [[gx, gy - R * 0.66, R * 0.66], [gx - R * 0.6, gy - R * 0.42, R * 0.48], [gx + R * 0.6, gy - R * 0.42, R * 0.48], [gx - R * 0.2, gy - R * 1.05, R * 0.42], [gx + R * 0.3, gy - R * 1.0, R * 0.4]];
    x.fillStyle = mqInkC(T.tree[0]); bl.forEach(function (b) { x.beginPath(); x.arc(b[0], b[1], b[2] + MQ_W, 0, Math.PI * 2); x.fill(); });
    bl.forEach(function (b) { x.fillStyle = T.tree[1]; x.beginPath(); x.arc(b[0], b[1], b[2], 0, Math.PI * 2); x.fill(); });
    bl.forEach(function (b) { x.fillStyle = rgba(T.tree[2], 0.9); x.beginPath(); x.arc(b[0] - b[2] * 0.22, b[1] - b[2] * 0.26, b[2] * 0.62, 0, Math.PI * 2); x.fill(); });
    bl.forEach(function (b) { x.fillStyle = rgba(T.tree[0], 0.55); x.beginPath(); x.arc(b[0] + b[2] * 0.3, b[1] + b[2] * 0.36, b[2] * 0.5, 0, Math.PI * 2); x.fill(); });
    var n = wide ? 3 : 5;
    for (var i = 0; i < n; i++) { var b = bl[i % bl.length], px = b[0] + (rnd() - 0.5) * b[2] * 0.9, py = b[1] + (rnd() - 0.6) * b[2] * 0.8, rr = S * 0.055, fc = T.flowers[i % T.flowers.length]; x.fillStyle = mqInkC(fc); x.beginPath(); x.arc(px, py, rr + MQ_W * 0.7, 0, Math.PI * 2); x.fill(); x.fillStyle = fc; x.beginPath(); x.arc(px, py, rr, 0, Math.PI * 2); x.fill(); x.fillStyle = rgba(lit(fc, 0.5), 0.9); x.beginPath(); x.arc(px - rr * 0.3, py - rr * 0.3, rr * 0.42, 0, Math.PI * 2); x.fill(); }
    return spr(o.c, gx, gy);
  },
  qhedge: function (S, T, rnd, seed, th) { return MQ_PROPS.qrose(S, T, rnd, seed, th, 1); },
  qurn: function (S, T, rnd) {
    var o = mqCv(S, 1.1, 1.4, 0.88), x = o.x, gx = o.gx, gy = o.gy, col = T.rock;
    softShadow(x, gx + S * 0.05, gy, S * 0.34, S * 0.1, 0.5);
    mqBox(x, gx, gy, S * 0.46, S * 0.2, S * 0.08, drk(col, 0.1));
    [[-0.1, -0.5], [0.06, -0.62], [0.16, -0.46]].forEach(function (d) { mqLine(x, [[gx, gy - S * 0.62], [gx + d[0] * S, gy - S * 0.62 + d[1] * S * 0.7]], Math.max(1, S * 0.022), '#4a3c34', 1); });
    var u = shp(), p = u.p; p.moveTo(gx - S * 0.1, gy - S * 0.28); p.bezierCurveTo(gx - S * 0.3, gy - S * 0.4, gx - S * 0.26, gy - S * 0.62, gx - S * 0.12, gy - S * 0.66); p.lineTo(gx + S * 0.12, gy - S * 0.66); p.bezierCurveTo(gx + S * 0.26, gy - S * 0.62, gx + S * 0.3, gy - S * 0.4, gx + S * 0.1, gy - S * 0.28); p.closePath(); u.ext(gx - S * 0.27, gy - S * 0.66); u.ext(gx + S * 0.27, gy - S * 0.28);
    cylFill(x, u, col, { hi: 0.35, lo: 0.5 }); mqInk(x, u, col);
    var rm = shp().rrect(gx - S * 0.18, gy - S * 0.71, S * 0.36, S * 0.07, S * 0.02); mqSolid(x, rm, lit(col, 0.2), 0.3, 0.3);
    x.strokeStyle = rgba(MQ_INK, 0.6); x.lineWidth = Math.max(0.8, S * 0.016); x.beginPath(); x.moveTo(gx + S * 0.04, gy - S * 0.64); x.lineTo(gx - S * 0.02, gy - S * 0.5); x.lineTo(gx + S * 0.06, gy - S * 0.4); x.stroke();
    return spr(o.c, gx, gy);
  },
  // 정원 석상: 받침 위 돌 올빼미 (눈만 희미하게 빛남)
  qstatue: function (S, T) {
    var o = mqCv(S, 1.1, 1.6, 0.9), x = o.x, gx = o.gx, gy = o.gy, col = T.rock;
    softShadow(x, gx + S * 0.06, gy, S * 0.36, S * 0.1, 0.5);
    mqBox(x, gx, gy, S * 0.5, S * 0.34, S * 0.1, drk(col, 0.08));
    var b = shp(), p = b.p; p.moveTo(gx - S * 0.2, gy - S * 0.44); p.bezierCurveTo(gx - S * 0.26, gy - S * 0.8, gx - S * 0.2, gy - S * 0.98, gx - S * 0.17, gy - S * 1.1); p.lineTo(gx - S * 0.07, gy - S * 0.98); p.lineTo(gx + S * 0.07, gy - S * 0.98); p.lineTo(gx + S * 0.17, gy - S * 1.1); p.bezierCurveTo(gx + S * 0.2, gy - S * 0.98, gx + S * 0.26, gy - S * 0.8, gx + S * 0.2, gy - S * 0.44); p.closePath(); b.ext(gx - S * 0.24, gy - S * 1.1); b.ext(gx + S * 0.24, gy - S * 0.44);
    cylFill(x, b, lit(col, 0.06), { hi: 0.35, lo: 0.5 }); mqInk(x, b, col);
    x.strokeStyle = rgba(MQ_INK, 0.45); x.lineWidth = Math.max(0.8, S * 0.018); [-1, 1].forEach(function (sd) { x.beginPath(); x.ellipse(gx + sd * S * 0.13, gy - S * 0.66, S * 0.07, S * 0.18, sd * 0.15, 0, Math.PI * 2); x.stroke(); });
    [-1, 1].forEach(function (sd) { x.fillStyle = '#16121e'; x.beginPath(); x.arc(gx + sd * S * 0.08, gy - S * 0.88, S * 0.05, 0, Math.PI * 2); x.fill(); mqGlow(x, gx + sd * S * 0.08, gy - S * 0.88, S * 0.1, '#ffc050', 0.7); x.fillStyle = '#ffd880'; x.beginPath(); x.arc(gx + sd * S * 0.08, gy - S * 0.88, S * 0.024, 0, Math.PI * 2); x.fill(); });
    x.fillStyle = mqInkC(col); x.beginPath(); x.moveTo(gx - S * 0.03, gy - S * 0.83); x.lineTo(gx, gy - S * 0.76); x.lineTo(gx + S * 0.03, gy - S * 0.83); x.fill();
    x.fillStyle = rgba(T.moss, 0.6); x.beginPath(); x.ellipse(gx - S * 0.16, gy - S * 0.36, S * 0.16, S * 0.05, 0, 0, Math.PI * 2); x.fill();
    return spr(o.c, gx, gy);
  },
  qfount: function (S, T, rnd) {
    var o = mqCv(S, 2.5, 2.4, 0.86), x = o.x, gx = o.gx, gy = o.gy, col = T.rock, R = S * 0.86;
    softShadow(x, gx + S * 0.1, gy + S * 0.05, R * 1.15, R * 0.42, 0.55);
    mqCyl(x, gx, gy, R, S * 0.24, col, lit(col, 0.24));
    var wt = shp().ell(gx, gy - S * 0.24, R * 0.86, R * 0.86 * 0.36); x.fillStyle = '#1c3a44'; x.fill(wt.p); x.save(); x.clip(wt.p); x.fillStyle = rgba(T.rim, 0.5); x.beginPath(); x.ellipse(gx - R * 0.3, gy - S * 0.26, R * 0.24, R * 0.05, -0.1, 0, Math.PI * 2); x.fill(); x.fillStyle = '#9a6a2a'; for (var i = 0; i < 6; i++) { x.beginPath(); x.ellipse(gx + (rnd() - 0.5) * R * 1.3, gy - S * 0.24 + (rnd() - 0.5) * R * 0.4, S * 0.05, S * 0.025, rnd() * 3, 0, Math.PI * 2); x.fill(); } x.restore(); mqInk(x, wt, col, MQ_W * 0.8);
    mqCyl(x, gx, gy - S * 0.26, S * 0.11, S * 0.52, lit(col, 0.08));
    var bw = shp(), p = bw.p; p.moveTo(gx - S * 0.42, gy - S * 0.84); p.lineTo(gx + S * 0.12, gy - S * 0.84); p.lineTo(gx + S * 0.2, gy - S * 0.76); p.lineTo(gx + S * 0.3, gy - S * 0.8); p.quadraticCurveTo(gx + S * 0.18, gy - S * 0.62, gx, gy - S * 0.62); p.quadraticCurveTo(gx - S * 0.3, gy - S * 0.62, gx - S * 0.42, gy - S * 0.84); p.closePath(); bw.ext(gx - S * 0.42, gy - S * 0.84); bw.ext(gx + S * 0.3, gy - S * 0.62);
    mqSolid(x, bw, lit(col, 0.12), 0.35, 0.45);
    x.strokeStyle = rgba(MQ_INK, 0.6); x.lineWidth = Math.max(0.9, S * 0.02); x.beginPath(); x.moveTo(gx - R * 0.5, gy - S * 0.2); x.lineTo(gx - R * 0.42, gy - S * 0.08); x.lineTo(gx - R * 0.5, gy + S * 0.04); x.moveTo(gx + R * 0.6, gy - S * 0.18); x.lineTo(gx + R * 0.52, gy - S * 0.04); x.stroke();
    x.fillStyle = rgba(T.moss, 0.6); x.beginPath(); x.ellipse(gx + R * 0.5, gy + S * 0.14, S * 0.3, S * 0.08, 0, 0, Math.PI * 2); x.fill();
    return spr(o.c, gx, gy);
  },
  // 쇠 가로등(2장): 호박빛
  qlamp: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.5, 2.1, 0.94), x = o.x, gx = o.gx, gy = o.gy, iron = '#34364a', h = S * 1.28;
    softShadow(x, gx + S * 0.04, gy, S * 0.22, S * 0.07, 0.5);
    mqGlow(x, gx, gy - h, S * 0.62, '#ffb040', 0.6);
    mqBox(x, gx, gy, S * 0.2, S * 0.12, S * 0.05, '#4a4c62');
    mqLine(x, [[gx, gy - S * 0.12], [gx, gy - h + S * 0.16]], Math.max(1.6, S * 0.055), iron);
    mqLine(x, [[gx - S * 0.12, gy - h + S * 0.2], [gx + S * 0.12, gy - h + S * 0.2]], Math.max(1.4, S * 0.04), iron);
    var lb = shp().poly([[gx - S * 0.1, gy - h + S * 0.16], [gx - S * 0.13, gy - h - S * 0.06], [gx + S * 0.13, gy - h - S * 0.06], [gx + S * 0.1, gy - h + S * 0.16]]); x.fillStyle = '#ffd070'; x.fill(lb.p); x.fillStyle = '#fff4c8'; x.beginPath(); x.ellipse(gx, gy - h + S * 0.05, S * 0.05, S * 0.08, 0, 0, Math.PI * 2); x.fill(); mqInk(x, lb, iron);
    var cp = shp().poly([[gx - S * 0.17, gy - h - S * 0.06], [gx, gy - h - S * 0.2], [gx + S * 0.17, gy - h - S * 0.06]]); mqSolid(x, cp, '#4a4c62', 0.3, 0.3);
    return spr(o.c, gx, gy);
  },
  qcorn: function (S, T, rnd) {
    var o = mqCv(S, 1.4, 1.9, 0.93), x = o.x, gx = o.gx, gy = o.gy, st = '#8c8a3c', lf = '#6a7030';
    softShadow(x, gx + S * 0.05, gy, S * 0.42, S * 0.1, 0.45);
    for (var i = 0; i < 4; i++) {
      var bx = gx + (i - 1.5) * S * 0.2 + (rnd() - 0.5) * S * 0.06, h = S * (1.0 + rnd() * 0.35), ln = (rnd() - 0.5) * S * 0.14;
      mqLine(x, [[bx, gy], [bx + ln * 0.4, gy - h * 0.5], [bx + ln, gy - h]], Math.max(1.4, S * 0.045), st);
      for (var k = 0; k < 3; k++) { var y0 = gy - h * (0.3 + k * 0.22), sd = (k + i) % 2 ? 1 : -1, bx2 = bx + ln * (0.3 + k * 0.22), l = shp(); l.p.moveTo(bx2, y0); l.p.quadraticCurveTo(bx2 + sd * S * 0.2, y0 - S * 0.16, bx2 + sd * S * 0.3, y0 + S * 0.06); l.p.quadraticCurveTo(bx2 + sd * S * 0.16, y0 - S * 0.04, bx2, y0 + S * 0.05); l.p.closePath(); x.fillStyle = mqInkC(lf); x.lineWidth = MQ_W; x.strokeStyle = mqInkC(lf); x.stroke(l.p); x.fillStyle = k % 2 ? lf : '#84883a'; x.fill(l.p); }
      var ear = shp().ell(bx + ln * 0.6 + S * 0.05, gy - h * 0.62, S * 0.045, S * 0.1, 0.25); mqSolid(x, ear, '#d8a83a', 0.4, 0.3);
      mqLine(x, [[bx + ln, gy - h], [bx + ln - S * 0.05, gy - h - S * 0.1]], Math.max(1, S * 0.025), '#c8b060', 1); mqLine(x, [[bx + ln, gy - h], [bx + ln + S * 0.06, gy - h - S * 0.09]], Math.max(1, S * 0.025), '#c8b060', 1);
    }
    return spr(o.c, gx, gy);
  },
  qpump: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.3, 1.1, 0.84), x = o.x, gx = o.gx, gy = o.gy;
    softShadow(x, gx + S * 0.05, gy, S * 0.42, S * 0.12, 0.5);
    mqLine(x, [[gx - S * 0.4, gy - S * 0.02], [gx - S * 0.2, gy - S * 0.1], [gx + S * 0.1, gy - S * 0.03], [gx + S * 0.38, gy - S * 0.08]], Math.max(1, S * 0.03), '#4a5a2a', 1);
    if (seed % 3 === 0) { mqPumpkin(x, gx - S * 0.02, gy, S * 0.3, 1); }
    else { mqPumpkin(x, gx + S * 0.2, gy - S * 0.05, S * 0.17, 0); mqPumpkin(x, gx - S * 0.12, gy, S * 0.25, seed % 3 === 1); }
    return spr(o.c, gx, gy);
  },
  qbigpump: function (S, T, rnd) {
    var o = mqCv(S, 2.5, 2.3, 0.88), x = o.x, gx = o.gx, gy = o.gy;
    softShadow(x, gx + S * 0.1, gy, S * 1.0, S * 0.26, 0.55);
    mqLine(x, [[gx - S * 0.95, gy - S * 0.05], [gx - S * 0.5, gy - S * 0.2], [gx, gy - S * 0.04], [gx + S * 0.6, gy - S * 0.16], [gx + S * 0.98, gy - S * 0.02]], Math.max(1.4, S * 0.05), '#4a5a2a');
    mqPumpkin(x, gx + S * 0.74, gy - S * 0.02, S * 0.22, 0); mqPumpkin(x, gx - S * 0.76, gy, S * 0.2, 0);
    mqPumpkin(x, gx, gy + S * 0.04, S * 0.74, 1);
    return spr(o.c, gx, gy);
  },
  qhay: function (S, T) {
    var o = mqCv(S, 1.2, 1.0, 0.84), x = o.x, gx = o.gx, gy = o.gy, col = '#c0a040', R = S * 0.3;
    softShadow(x, gx + S * 0.06, gy, S * 0.46, S * 0.12, 0.5);
    var sd = mqR(gx - S * 0.3, gy - R * 2, S * 0.5, R * 2); var bd = shp(); bd.p.moveTo(gx - S * 0.26, gy - R * 2); bd.p.lineTo(gx + S * 0.2, gy - R * 2); bd.p.ellipse(gx + S * 0.2, gy - R, R * 0.5, R, 0, -Math.PI / 2, Math.PI / 2); bd.p.lineTo(gx - S * 0.26, gy); bd.p.ellipse(gx - S * 0.26, gy - R, R * 0.5, R, 0, Math.PI / 2, -Math.PI / 2); bd.p.closePath(); bd.ext(gx - S * 0.42, gy - R * 2); bd.ext(gx + S * 0.36, gy);
    litFill(x, bd, col, { hi: 0.3, lo: 0.5, ax: 0.5, ay: 0, bx: 0.5, by: 1 }); x.save(); x.clip(bd.p); x.strokeStyle = rgba('#5a4018', 0.5); x.lineWidth = Math.max(0.8, S * 0.016); for (var i = 1; i < 6; i++) { x.beginPath(); x.moveTo(gx - S * 0.42, gy - R * 2 * i / 6); x.lineTo(gx + S * 0.2, gy - R * 2 * i / 6); x.stroke(); } x.restore(); mqInk(x, bd, col);
    var en = shp().ell(gx + S * 0.2, gy - R, R * 0.5, R); litFill(x, en, lit(col, 0.2), { hi: 0.3, lo: 0.3 }); x.save(); x.clip(en.p); x.strokeStyle = rgba('#5a4018', 0.6); x.lineWidth = Math.max(0.8, S * 0.016); for (var r = 1; r < 4; r++) { x.beginPath(); x.ellipse(gx + S * 0.2, gy - R, R * 0.5 * r / 4, R * r / 4, 0, 0, Math.PI * 2); x.stroke(); } x.restore(); mqInk(x, en, col);
    return spr(o.c, gx, gy);
  },
  qscare: function (S, T, rnd) {
    var o = mqCv(S, 1.5, 1.9, 0.93), x = o.x, gx = o.gx, gy = o.gy, wood = '#5a4230', coat = '#4a5a6a';
    softShadow(x, gx + S * 0.05, gy, S * 0.3, S * 0.09, 0.5);
    mqLine(x, [[gx, gy], [gx, gy - S * 1.15]], Math.max(1.6, S * 0.06), wood);
    mqLine(x, [[gx - S * 0.5, gy - S * 0.84], [gx + S * 0.5, gy - S * 0.8]], Math.max(1.6, S * 0.055), wood);
    [-1, 1].forEach(function (sd) { for (var k = -1; k <= 1; k++) mqLine(x, [[gx + sd * S * 0.5, gy - S * 0.82], [gx + sd * S * 0.6, gy - S * 0.82 + k * S * 0.07]], Math.max(1, S * 0.022), '#d8b050', 1); });
    var ct = shp().poly([[gx - S * 0.44, gy - S * 0.9], [gx + S * 0.44, gy - S * 0.86], [gx + S * 0.4, gy - S * 0.72], [gx + S * 0.2, gy - S * 0.72], [gx + S * 0.24, gy - S * 0.34], [gx + S * 0.12, gy - S * 0.42], [gx + S * 0.03, gy - S * 0.3], [gx - S * 0.08, gy - S * 0.42], [gx - S * 0.22, gy - S * 0.32], [gx - S * 0.2, gy - S * 0.74], [gx - S * 0.42, gy - S * 0.76]]);
    mqSolid(x, ct, coat, 0.25, 0.45);
    x.fillStyle = '#b8642a'; x.fillRect(gx - S * 0.06, gy - S * 0.7, S * 0.1, S * 0.1); x.strokeStyle = MQ_INK; x.lineWidth = Math.max(0.7, S * 0.014); x.strokeRect(gx - S * 0.06, gy - S * 0.7, S * 0.1, S * 0.1);
    var hd = shp().ell(gx, gy - S * 1.02, S * 0.17, S * 0.18); mqSolid(x, hd, '#c8a868', 0.35, 0.35);
    x.fillStyle = '#20140c'; [-1, 1].forEach(function (sd) { x.beginPath(); x.arc(gx + sd * S * 0.065, gy - S * 1.04, S * 0.03, 0, Math.PI * 2); x.fill(); });
    x.strokeStyle = '#20140c'; x.lineWidth = Math.max(0.8, S * 0.02); x.beginPath(); x.moveTo(gx - S * 0.08, gy - S * 0.95); x.lineTo(gx - S * 0.03, gy - S * 0.93); x.lineTo(gx + S * 0.03, gy - S * 0.955); x.lineTo(gx + S * 0.08, gy - S * 0.93); x.stroke();
    var ht = shp().poly([[gx - S * 0.3, gy - S * 1.13], [gx - S * 0.12, gy - S * 1.17], [gx + S * 0.03, gy - S * 1.56], [gx + S * 0.14, gy - S * 1.16], [gx + S * 0.3, gy - S * 1.1], [gx, gy - S * 1.06]]); mqSolid(x, ht, '#3a3046', 0.3, 0.4);
    x.fillStyle = '#b8642a'; x.fillRect(gx - S * 0.11, gy - S * 1.21, S * 0.24, S * 0.045);
    return spr(o.c, gx, gy);
  },
  // 초롱: 굽은 나무 기둥에 걸린 등
  qlantern: function (S, T) {
    var o = mqCv(S, 1.4, 1.9, 0.93), x = o.x, gx = o.gx, gy = o.gy, wood = '#5a4230', lx = gx + S * 0.2, ly = gy - S * 0.86;
    softShadow(x, gx + S * 0.04, gy, S * 0.24, S * 0.07, 0.5);
    mqGlow(x, lx, ly, S * 0.5, '#ff9a30', 0.6);
    mqLine(x, [[gx - S * 0.1, gy], [gx - S * 0.12, gy - S * 0.7], [gx - S * 0.06, gy - S * 1.2], [gx + S * 0.2, gy - S * 1.26]], Math.max(1.6, S * 0.06), wood);
    mqLine(x, [[lx, gy - S * 1.26], [lx, ly - S * 0.2]], Math.max(1, S * 0.02), '#2a2a34', 1);
    var b = shp().rrect(lx - S * 0.13, ly - S * 0.17, S * 0.26, S * 0.34, S * 0.1); litFill(x, b, '#ff9a30', { hi: 0.5, lo: 0.25 }); x.save(); x.clip(b.p); x.fillStyle = '#ffe9a0'; x.beginPath(); x.ellipse(lx, ly, S * 0.06, S * 0.1, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = rgba('#8a3208', 0.6); x.lineWidth = Math.max(0.8, S * 0.014); [-0.06, 0.06].forEach(function (u) { x.beginPath(); x.moveTo(lx + u * S, ly - S * 0.17); x.lineTo(lx + u * S, ly + S * 0.17); x.stroke(); }); x.restore(); mqInk(x, b, '#b8501a');
    [ly - S * 0.2, ly + S * 0.15].forEach(function (yy) { var c = mqR(lx - S * 0.09, yy, S * 0.18, S * 0.05); mqSolid(x, c, '#3a3040', 0.3, 0.3); });
    return spr(o.c, gx, gy);
  },
  qcol: function (S, T, rnd, seed, th, broken) {
    var o = mqCv(S, 1.5, 2.0, 0.93), x = o.x, gx = o.gx, gy = o.gy, col = T.rock, r = S * 0.2, h = broken ? S * (0.42 + (seed % 3) * 0.1) : S * 1.08;
    softShadow(x, gx + S * 0.06, gy, S * 0.4, S * 0.11, 0.55);
    mqBox(x, gx, gy, S * 0.56, S * 0.13, S * 0.1, drk(col, 0.1));
    var sh2 = mqCyl(x, gx, gy - S * 0.14, r, h, col, broken ? drk(col, 0.25) : null);
    x.save(); x.clip(sh2.p); x.strokeStyle = rgba(MQ_INK, 0.28); x.lineWidth = Math.max(0.8, S * 0.02); [-0.5, 0, 0.5].forEach(function (u) { x.beginPath(); x.moveTo(gx + u * r, gy - S * 0.14 - h); x.lineTo(gx + u * r, gy); x.stroke(); }); x.strokeStyle = rgba(MQ_INK, 0.6); x.beginPath(); x.moveTo(gx - r * 0.3, gy - S * 0.14 - h * 0.7); x.lineTo(gx + r * 0.1, gy - S * 0.14 - h * 0.5); x.lineTo(gx - r * 0.1, gy - S * 0.14 - h * 0.34); x.stroke(); x.restore();
    if (!broken) {
      mqBox(x, gx, gy - S * 0.14 - h + S * 0.04, S * 0.58, S * 0.12, S * 0.1, lit(col, 0.1));
      if (seed % 2 === 0) { // 거미줄
        var wx = gx + r, wy = gy - S * 0.14 - h + S * 0.06, R = S * 0.42; x.save(); x.strokeStyle = 'rgba(220,230,255,0.75)'; x.lineWidth = Math.max(0.7, S * 0.014);
        for (var a = 0; a < 4; a++) { var an = a * 0.5 + 0.05; x.beginPath(); x.moveTo(wx, wy); x.lineTo(wx + Math.cos(an) * R, wy + Math.sin(an) * R); x.stroke(); }
        for (var q = 1; q < 4; q++) { x.beginPath(); for (var a2 = 0; a2 < 4; a2++) { var an2 = a2 * 0.5 + 0.05, px = wx + Math.cos(an2) * R * q / 3.4, py = wy + Math.sin(an2) * R * q / 3.4; if (a2) x.quadraticCurveTo(wx + Math.cos(an2 - 0.25) * R * q / 4.1, wy + Math.sin(an2 - 0.25) * R * q / 4.1, px, py); else x.moveTo(px, py); } x.stroke(); }
        x.restore();
      }
    } else { x.fillStyle = drk(col, 0.05); [[0.34, 0.02, 0.09], [-0.36, 0.04, 0.07], [0.46, 0.06, 0.05]].forEach(function (d) { var rb = shp().ell(gx + d[0] * S, gy + d[1] * S - d[2] * S * 0.6, d[2] * S, d[2] * S * 0.7); mqSolid(x, rb, col, 0.3, 0.4); }); }
    return spr(o.c, gx, gy);
  },
  qcolB: function (S, T, rnd, seed, th) { return MQ_PROPS.qcol(S, T, rnd, seed, th, 1); },
  qcandle: function (S, T) {
    var o = mqCv(S, 1.3, 1.5, 0.9), x = o.x, gx = o.gx, gy = o.gy, iron = '#3c3e54';
    softShadow(x, gx + S * 0.04, gy, S * 0.26, S * 0.08, 0.5);
    mqLine(x, [[gx - S * 0.16, gy], [gx, gy - S * 0.1], [gx + S * 0.16, gy]], Math.max(1.4, S * 0.045), iron);
    mqLine(x, [[gx, gy - S * 0.08], [gx, gy - S * 0.56]], Math.max(1.5, S * 0.05), iron);
    mqLine(x, [[gx - S * 0.26, gy - S * 0.56], [gx - S * 0.26, gy - S * 0.46], [gx, gy - S * 0.4], [gx + S * 0.26, gy - S * 0.46], [gx + S * 0.26, gy - S * 0.56]], Math.max(1.3, S * 0.04), iron);
    [-0.26, 0, 0.26].forEach(function (u) { var hh = u ? S * 0.14 : S * 0.2, by = gy - S * (u ? 0.54 : 0.56), c = mqR(gx + u * S - S * 0.04, by - hh, S * 0.08, hh); mqSolid(x, c, '#e8e0cc', 0.3, 0.3); mqFlame(x, gx + u * S, by - hh - S * 0.01, S * 0.045, '#ffb040', '#fff4c0'); });
    return spr(o.c, gx, gy);
  },
  qtorch: function (S, T) {
    var o = mqCv(S, 1.4, 1.8, 0.92), x = o.x, gx = o.gx, gy = o.gy, iron = '#3c3e54';
    softShadow(x, gx + S * 0.04, gy, S * 0.3, S * 0.09, 0.5);
    [-1, 0.2, 1].forEach(function (sd) { mqLine(x, [[gx + sd * S * 0.2, gy + (sd === 0.2 ? S * 0.03 : 0)], [gx, gy - S * 0.62]], Math.max(1.4, S * 0.045), iron); });
    mqFlame(x, gx, gy - S * 0.74, S * 0.13, '#3aa8ff', '#d8f4ff');
    var bw = shp(), p = bw.p; p.moveTo(gx - S * 0.24, gy - S * 0.78); p.lineTo(gx + S * 0.24, gy - S * 0.78); p.quadraticCurveTo(gx + S * 0.2, gy - S * 0.58, gx, gy - S * 0.58); p.quadraticCurveTo(gx - S * 0.2, gy - S * 0.58, gx - S * 0.24, gy - S * 0.78); p.closePath(); bw.ext(gx - S * 0.24, gy - S * 0.78); bw.ext(gx + S * 0.24, gy - S * 0.58);
    mqSolid(x, bw, '#50526c', 0.3, 0.45);
    mqGlow(x, gx, gy - S * 0.9, S * 0.5, '#4ab8ff', 0.35);
    return spr(o.c, gx, gy);
  },
  qsarc: function (S, T) {
    var o = mqCv(S, 2.5, 2.0, 0.86), x = o.x, gx = o.gx, gy = o.gy, col = T.rock, w = S * 1.56;
    softShadow(x, gx + S * 0.1, gy, S * 1.05, S * 0.26, 0.55);
    mqBox(x, gx, gy, w * 1.1, S * 0.12, S * 0.3, drk(col, 0.2));
    mqGlow(x, gx, gy - S * 0.56, S * 0.95, '#58e0c8', 0.3);
    var b = mqBox(x, gx, gy - S * 0.12, w, S * 0.42, S * 0.3, col, 0.2);
    x.save(); x.clip(b.fr.p); x.fillStyle = rgba(MQ_INK, 0.35); for (var i = 0; i < 5; i++) { x.fillRect(b.x0 + w * (0.08 + i * 0.18), b.y0 + S * 0.08, w * 0.1, S * 0.26); } x.restore();
    var ld = mqBox(x, gx - S * 0.05, gy - S * 0.6, w * 1.04, S * 0.1, S * 0.36, lit(col, 0.1), 0.24);
    x.fillStyle = '#0c1418'; x.fillRect(b.x0 + MQ_W, gy - S * 0.6, w - MQ_W * 2, S * 0.06); x.fillStyle = '#7ef0dc'; x.fillRect(b.x0 + S * 0.06, gy - S * 0.59, w - S * 0.12, S * 0.04); mqGlow(x, gx, gy - S * 0.57, S * 0.5, '#58e0c8', 0.35);
    x.save(); x.clip(ld.top.p); x.strokeStyle = rgba(MQ_INK, 0.4); x.lineWidth = Math.max(1, S * 0.02); x.strokeRect(ld.x0 + S * 0.12, ld.y0 - S * 0.31, w * 1.04 - S * 0.24, S * 0.24); x.restore();
    return spr(o.c, gx, gy);
  },
  // ===== 3장 =====
  qcone: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.2, 1.0, 0.84), x = o.x, gx = o.gx, gy = o.gy;
    softShadow(x, gx + S * 0.04, gy, S * 0.4, S * 0.1, 0.4);
    [[0.2, -0.06, 0.98], [-0.14, 0, 1.25]].slice(seed % 3 === 0 ? 1 : 0).forEach(function (d) {
      var cx = gx + d[0] * S, by = gy + d[1] * S, k = d[2] * S, bs = mqR(cx - k * 0.2, by - k * 0.06, k * 0.4, k * 0.07); mqSolid(x, bs, '#2a2c30', 0.2, 0.2);
      var c = shp().poly([[cx - k * 0.15, by - k * 0.06], [cx - k * 0.04, by - k * 0.52], [cx + k * 0.04, by - k * 0.52], [cx + k * 0.15, by - k * 0.06]]); litFill(x, c, '#f0802a', { hi: 0.3, lo: 0.35 });
      x.save(); x.clip(c.p); x.fillStyle = '#f4f0e6'; x.fillRect(cx - k * 0.2, by - k * 0.36, k * 0.4, k * 0.1); x.restore(); mqInk(x, c, '#f0802a');
    });
    return spr(o.c, gx, gy);
  },
  qjersey: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.3, 1.0, 0.84), x = o.x, gx = o.gx, gy = o.gy, col = '#a4a6a4', w = S * 0.88, h = S * 0.4;
    softShadow(x, gx + S * 0.05, gy, w * 0.6, S * 0.11, 0.42);
    var top = mqR(gx - w * 0.44, gy - h - S * 0.07, w * 0.88, S * 0.08); x.fillStyle = lit(col, 0.4); x.fill(top.p); mqInk(x, top, col);
    var f = shp().poly([[gx - w / 2, gy], [gx - w / 2, gy - h * 0.3], [gx - w * 0.44, gy - h], [gx + w * 0.44, gy - h], [gx + w / 2, gy - h * 0.3], [gx + w / 2, gy]]); litFill(x, f, col, { hi: 0.1, lo: 0.4, ax: 0, ay: 0, bx: 0.2, by: 1 });
    x.save(); x.clip(f.p); mqHazard(x, gx - w / 2, gy - h * 0.82, w, h * 0.3, 7, '#e8862a', '#2a2a2e'); x.fillStyle = rgba(MQ_INK, 0.3); x.fillRect(gx - w / 2, gy - h * 0.3, w, Math.max(1, S * 0.015)); x.restore(); mqInk(x, f, col);
    return spr(o.c, gx, gy);
  },
  qblock: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.3, 1.4, 0.88), x = o.x, gx = o.gx, gy = o.gy, col = '#9c9e9c', k = S * 0.4;
    softShadow(x, gx + S * 0.06, gy, S * 0.52, S * 0.13, 0.45);
    mqBox(x, gx - k * 0.52, gy, k, k * 0.8, k * 0.32, col); mqBox(x, gx + k * 0.54, gy, k, k * 0.8, k * 0.32, drk(col, 0.06));
    var b = mqBox(x, gx + (seed % 2 ? 0.06 : -0.06) * S, gy - k * 0.84, k, k * 0.8, k * 0.32, lit(col, 0.06));
    mqHazard(x, b.x0 + MQ_W * 0.5, b.y0 + k * 0.5, k - MQ_W, k * 0.16, 5, '#e8862a', '#2a2a2e');
    mqLine(x, [[b.x0 + k * 0.3, b.y0 - k * 0.3], [b.x0 + k * 0.36, b.y0 - k * 0.56], [b.x0 + k * 0.6, b.y0 - k * 0.56], [b.x0 + k * 0.66, b.y0 - k * 0.3]], Math.max(1, S * 0.025), '#6a4a3a', 1);
    return spr(o.c, gx, gy);
  },
  qcar: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.5, 1.2, 0.86), x = o.x, gx = o.gx, gy = o.gy, col = ['#6a7458', '#8a5a40', '#5c6a7a', '#7a7a76'][seed % 4], w = S * 0.98, h = S * 0.24;
    softShadow(x, gx + S * 0.05, gy, w * 0.6, S * 0.13, 0.5);
    [-0.3, 0.3].forEach(function (u, i) { var wh = shp().ell(gx + u * w, gy - S * 0.08, S * 0.11, S * (i ? 0.085 : 0.11)); x.fillStyle = '#1a1a1e'; x.fill(wh.p); mqInk(x, wh, '#1a1a1e'); x.fillStyle = '#6a6c70'; x.beginPath(); x.arc(gx + u * w, gy - S * 0.08, S * 0.04, 0, Math.PI * 2); x.fill(); });
    var cab = shp().poly([[gx - w * 0.3, gy - h - S * 0.1], [gx - w * 0.2, gy - h - S * 0.34], [gx + w * 0.16, gy - h - S * 0.34], [gx + w * 0.3, gy - h - S * 0.1]]); mqSolid(x, cab, lit(col, 0.08), 0.3, 0.35);
    var win = shp().poly([[gx - w * 0.24, gy - h - S * 0.12], [gx - w * 0.17, gy - h - S * 0.29], [gx + w * 0.13, gy - h - S * 0.29], [gx + w * 0.23, gy - h - S * 0.12]]); x.fillStyle = '#1c2630'; x.fill(win.p); x.strokeStyle = 'rgba(200,220,235,0.7)'; x.lineWidth = Math.max(0.7, S * 0.014); x.beginPath(); x.moveTo(gx - w * 0.1, gy - h - S * 0.28); x.lineTo(gx - w * 0.04, gy - h - S * 0.2); x.lineTo(gx - w * 0.12, gy - h - S * 0.13); x.moveTo(gx - w * 0.04, gy - h - S * 0.2); x.lineTo(gx + w * 0.06, gy - h - S * 0.22); x.stroke(); x.fillStyle = mqInkC(col); x.fillRect(gx - w * 0.01, gy - h - S * 0.3, Math.max(1.2, S * 0.025), S * 0.19);
    var bd = shp().rrect(gx - w / 2, gy - h - S * 0.1, w, h, S * 0.07); litFill(x, bd, col, { hi: 0.2, lo: 0.45 });
    x.save(); x.clip(bd.p); x.fillStyle = rgba('#18120e', 0.5); x.beginPath(); x.ellipse(gx + w * 0.34, gy - h - S * 0.08, w * 0.2, h * 0.7, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = rgba('#b8642a', 0.5); x.beginPath(); x.ellipse(gx - w * 0.2, gy - S * 0.12, w * 0.12, h * 0.25, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = rgba(MQ_INK, 0.4); x.fillRect(gx - w / 2, gy - h * 0.62 - S * 0.1, w, Math.max(1, S * 0.014)); x.restore(); mqInk(x, bd, col);
    x.fillStyle = '#e8862a'; x.fillRect(gx - w * 0.49, gy - h * 0.8 - S * 0.1, S * 0.05, S * 0.05); x.fillStyle = '#d8d4c0'; x.fillRect(gx + w * 0.44, gy - h * 0.8 - S * 0.1, S * 0.045, S * 0.05);
    var hd = shp().poly([[gx + w * 0.26, gy - h - S * 0.1], [gx + w * 0.36, gy - h - S * 0.3], [gx + w * 0.5, gy - h - S * 0.26], [gx + w * 0.48, gy - h - S * 0.1]]); mqSolid(x, hd, drk(col, 0.12), 0.2, 0.3);
    return spr(o.c, gx, gy);
  },
  qcont1: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.3, 1.3, 0.87), x = o.x, gx = o.gx, gy = o.gy;
    softShadow(x, gx + S * 0.06, gy, S * 0.56, S * 0.13, 0.5);
    mqContainer(x, gx, gy, S * 0.94, S * 0.5, S * 0.26, MQ_CONT[seed % 6]);
    return spr(o.c, gx, gy);
  },
  qcont: function (S, T, rnd, seed) {
    var o = mqCv(S, 2.5, 2.4, 0.9), x = o.x, gx = o.gx, gy = o.gy;
    softShadow(x, gx + S * 0.12, gy, S * 1.1, S * 0.26, 0.55);
    mqContainer(x, gx, gy, S * 1.8, S * 0.62, S * 0.4, MQ_CONT[(seed + 2) % 4 === 1 ? 0 : (seed + 2) % 4]);
    mqContainer(x, gx - S * 0.2, gy - S * 0.76, S * 1.3, S * 0.56, S * 0.3, MQ_CONT[1]);
    return spr(o.c, gx, gy);
  },
  qsignal: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.4, 2.0, 0.94), x = o.x, gx = o.gx, gy = o.gy, pole = '#4a4e56', h = S * 1.2, tx = gx + S * 0.14;
    softShadow(x, gx + S * 0.04, gy, S * 0.22, S * 0.07, 0.45);
    mqBox(x, gx, gy, S * 0.2, S * 0.1, S * 0.05, '#7c7e80');
    mqLine(x, [[gx, gy - S * 0.1], [gx + S * 0.05, gy - h * 0.6], [tx, gy - h]], Math.max(1.6, S * 0.055), pole);
    var hs = shp().rrect(tx - S * 0.12, gy - h - S * 0.36, S * 0.24, S * 0.56, S * 0.05); mqSolid(x, hs, '#2c2e34', 0.2, 0.3);
    [0, 1, 2].forEach(function (i) { var ly = gy - h - S * 0.26 + i * S * 0.17, on = i === 1; if (on) mqGlow(x, tx, ly, S * 0.34, '#ff9a2a', 0.7); x.fillStyle = on ? '#ffb040' : '#16181c'; x.beginPath(); x.arc(tx, ly, S * 0.06, 0, Math.PI * 2); x.fill(); if (on) { x.fillStyle = '#fff0c0'; x.beginPath(); x.arc(tx - S * 0.015, ly - S * 0.015, S * 0.025, 0, Math.PI * 2); x.fill(); } });
    return spr(o.c, gx, gy);
  },
  // 도심 가로등: 나트륨 주황빛
  qslamp: function (S, T) {
    var o = mqCv(S, 1.6, 2.3, 0.95), x = o.x, gx = o.gx, gy = o.gy, pole = '#4a4e56', h = S * 1.6, ax = gx + S * 0.34;
    softShadow(x, gx + S * 0.04, gy, S * 0.2, S * 0.06, 0.45);
    mqGlow(x, ax, gy - h + S * 0.1, S * 0.44, '#ffa040', 0.6);
    mqBox(x, gx, gy, S * 0.16, S * 0.1, S * 0.04, '#7c7e80');
    mqLine(x, [[gx, gy - S * 0.1], [gx, gy - h + S * 0.1], [gx + S * 0.08, gy - h], [ax, gy - h]], Math.max(1.5, S * 0.05), pole);
    var hd = shp().rrect(ax - S * 0.12, gy - h - S * 0.03, S * 0.24, S * 0.08, S * 0.03); mqSolid(x, hd, '#5a5e66', 0.3, 0.3);
    x.fillStyle = '#ffd890'; x.fillRect(ax - S * 0.09, gy - h + S * 0.04, S * 0.18, S * 0.035);
    return spr(o.c, gx, gy);
  },
  // 3장 보물: 주황 띠 군용 보급 상자
  qcrate: function (S, T) {
    var o = mqCv(S, 1.2, 1.1, 0.84), x = o.x, gx = o.gx, gy = o.gy, col = '#5e6c48', w = S * 0.6, h = S * 0.32;
    softShadow(x, gx + S * 0.05, gy, S * 0.44, S * 0.12, 0.5);
    mqGlow(x, gx, gy - h, S * 0.5, '#ffb040', 0.35);
    var b = mqBox(x, gx, gy, w, h, S * 0.2, col);
    mqHazard(x, b.x0 + MQ_W * 0.5, gy - h * 0.72, w - MQ_W, h * 0.36, 6, '#f0902a', '#22241e');
    x.fillStyle = '#f0902a'; x.fillRect(gx - S * 0.05, gy - h - S * 0.2 + MQ_W * 0.5, S * 0.1, S * 0.2 - MQ_W * 0.5);
    [-1, 1].forEach(function (sd) { x.fillStyle = '#2c3024'; x.fillRect(gx + sd * w * 0.5 - (sd > 0 ? S * 0.05 : 0), gy - h, S * 0.05, h); });
    var lk = shp().rrect(gx - S * 0.045, gy - h - S * 0.03, S * 0.09, S * 0.09, S * 0.02); mqSolid(x, lk, '#ffd24a', 0.5, 0.3);
    twTwinkle(x, gx + w * 0.34, gy - h - S * 0.2, S * 0.07, 0.95);
    return spr(o.c, gx, gy);
  },
  qdrum: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.3, 1.2, 0.86), x = o.x, gx = o.gx, gy = o.gy, cols = ['#5e6c48', '#c06c2a', '#4c5058'];
    softShadow(x, gx + S * 0.05, gy, S * 0.46, S * 0.12, 0.45);
    function dr(cx, by, col) { var r = S * 0.15, h = S * 0.42, s = mqCyl(x, cx, by, r, h, col, drk(col, 0.1)); x.save(); x.clip(s.p); x.fillStyle = rgba(MQ_INK, 0.35); [0.33, 0.66].forEach(function (u) { x.beginPath(); x.ellipse(cx, by - h * u, r, r * 0.36, 0, 0, Math.PI); x.lineTo(cx - r, by - h * u - S * 0.03); x.ellipse(cx, by - h * u - S * 0.03, r, r * 0.36, 0, Math.PI, 0, true); x.fill(); }); x.restore(); x.fillStyle = mqInkC(col); x.beginPath(); x.arc(cx + r * 0.4, by - h, r * 0.14, 0, Math.PI * 2); x.fill(); }
    dr(gx + S * 0.18, gy - S * 0.07, cols[(seed + 2) % 3]); if (seed % 2) dr(gx - S * 0.2, gy - S * 0.05, cols[(seed + 1) % 3]); dr(gx - S * 0.02, gy + S * 0.02, cols[seed % 3 === 1 ? 0 : 1]);
    return spr(o.c, gx, gy);
  },
  qwire: function (S, T, rnd) {
    var o = mqCv(S, 1.4, 1.1, 0.84), x = o.x, gx = o.gx, gy = o.gy, w = S * 0.96, steel = '#4a4e56';
    softShadow(x, gx + S * 0.04, gy, w * 0.55, S * 0.1, 0.4);
    x.save(); x.lineWidth = Math.max(1, S * 0.026);
    for (var pass = 0; pass < 2; pass++) { x.strokeStyle = pass ? '#9aa0a8' : mqInkC('#9aa0a8'); x.lineWidth = Math.max(1, S * 0.024) + (pass ? 0 : MQ_W * 1.2); for (var i = 0; i < 7; i++) { x.beginPath(); x.ellipse(gx - w * 0.38 + i * w * 0.127, gy - S * 0.22, S * 0.1, S * 0.2, 0.25, 0, Math.PI * 2); x.stroke(); } }
    x.fillStyle = '#d8dce0'; for (var k = 0; k < 9; k++) { x.fillRect(gx - w * 0.42 + k * w * 0.1, gy - S * 0.4 + (k % 2) * S * 0.32, Math.max(1.2, S * 0.03), Math.max(1.2, S * 0.03)); }
    x.restore();
    [-0.46, 0, 0.46].forEach(function (u) { mqLine(x, [[gx + u * w - S * 0.1, gy], [gx + u * w + S * 0.1, gy - S * 0.46]], Math.max(1.5, S * 0.05), steel); mqLine(x, [[gx + u * w + S * 0.1, gy], [gx + u * w - S * 0.1, gy - S * 0.46]], Math.max(1.5, S * 0.05), steel); });
    return spr(o.c, gx, gy);
  },
  qsandbag: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.4, 1.1, 0.84), x = o.x, gx = o.gx, gy = o.gy, col = '#a8946a', bw = S * 0.36, bh = S * 0.185;
    softShadow(x, gx + S * 0.05, gy, S * 0.6, S * 0.13, 0.42);
    for (var r = 0; r < 3; r++) { var n = 3 - (r === 2 ? 1 : 0), off = r % 2 ? bw * 0.5 : 0; for (var i = 0; i < n + (r % 2 ? 0 : 1) - (r === 2 ? 0 : 0); i++) { var bx = gx - bw * 1.5 + off + i * bw + (r === 2 ? bw * 0.5 : 0), by = gy - r * bh * 0.92; if (bx + bw > gx + bw * 1.6) continue; var b = shp().rrect(bx, by - bh, bw - 1, bh, bh * 0.45); litFill(x, b, (i + r) % 2 ? col : drk(col, 0.1), { hi: 0.3, lo: 0.4 }); mqInk(x, b, col); x.strokeStyle = rgba(MQ_INK, 0.3); x.lineWidth = Math.max(0.7, S * 0.012); x.beginPath(); x.moveTo(bx + bw * 0.2, by - bh * 0.5); x.lineTo(bx + bw * 0.7, by - bh * 0.5); x.stroke(); } }
    if (seed % 2) { mqLine(x, [[gx + bw * 1.1, gy - bh * 1.8], [gx + bw * 1.1, gy - bh * 4.6]], Math.max(1.2, S * 0.03), '#4a4e56'); var fl = shp().poly([[gx + bw * 1.1, gy - bh * 4.6], [gx + bw * 1.1 + S * 0.22, gy - bh * 4.2], [gx + bw * 1.1, gy - bh * 3.7]]); mqSolid(x, fl, '#e8742a', 0.3, 0.3); }
    return spr(o.c, gx, gy);
  },
  qantenna: function (S, T, rnd) {
    var o = mqCv(S, 1.5, 2.4, 0.95), x = o.x, gx = o.gx, gy = o.gy, steel = '#5a5e66', h = S * 1.7;
    softShadow(x, gx + S * 0.04, gy, S * 0.3, S * 0.08, 0.45);
    x.strokeStyle = rgba(MQ_INK, 0.55); x.lineWidth = Math.max(0.7, S * 0.012); [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(gx, gy - h * 0.8); x.lineTo(gx + sd * S * 0.5, gy); x.stroke(); });
    mqBox(x, gx, gy, S * 0.34, S * 0.16, S * 0.1, '#5e6c48');
    mqLine(x, [[gx - S * 0.1, gy - S * 0.16], [gx - S * 0.025, gy - h]], Math.max(1.3, S * 0.035), steel); mqLine(x, [[gx + S * 0.1, gy - S * 0.16], [gx + S * 0.025, gy - h]], Math.max(1.3, S * 0.035), steel);
    for (var i = 0; i < 6; i++) { var u0 = i / 6, u1 = (i + 1) / 6, w0 = S * (0.1 - 0.075 * u0), w1 = S * (0.1 - 0.075 * u1), y0 = gy - S * 0.16 - (h - S * 0.16) * u0, y1 = gy - S * 0.16 - (h - S * 0.16) * u1; mqLine(x, [[gx - w0, y0], [gx + w1, y1]], Math.max(0.9, S * 0.02), steel, 1); mqLine(x, [[gx + w0, y0], [gx - w1, y1]], Math.max(0.9, S * 0.02), steel, 1); }
    var ds = shp().ell(gx + S * 0.13, gy - h * 0.66, S * 0.1, S * 0.13, 0.3); mqSolid(x, ds, '#c8ccd0', 0.4, 0.4);
    mqGlow(x, gx, gy - h - S * 0.04, S * 0.3, '#ff6a2a', 0.8); x.fillStyle = '#ff9a4a'; x.beginPath(); x.arc(gx, gy - h - S * 0.04, S * 0.045, 0, Math.PI * 2); x.fill();
    return spr(o.c, gx, gy);
  },
  qradar: function (S, T, rnd, seed, th, small) {
    var k = small ? 0.56 : 1, o = mqCv(S, small ? 1.4 : 2.5, small ? 1.6 : 2.6, 0.9), x = o.x, gx = o.gx, gy = o.gy, col = '#5e6c48', u = S * k;
    softShadow(x, gx + u * 0.1, gy, u * 0.95, u * 0.24, 0.5);
    var b = mqBox(x, gx, gy, u * 1.5, u * 0.5, u * 0.34, col);
    x.save(); x.clip(b.fr.p); x.fillStyle = rgba(MQ_INK, 0.45); for (var i = 0; i < 4; i++) x.fillRect(b.x0 + u * 0.12, b.y0 + u * (0.1 + i * 0.08), u * 0.4, Math.max(1, u * 0.03)); x.fillStyle = '#1c2630'; x.fillRect(b.x0 + u * 0.92, b.y0 + u * 0.1, u * 0.38, u * 0.2); x.restore();
    mqHazard(x, b.x0 + MQ_W * 0.5, gy - u * 0.1, u * 1.5 - MQ_W, u * 0.08, 12, '#e8862a', '#22241e');
    mqCyl(x, gx - u * 0.1, gy - u * 0.62, u * 0.11, u * 0.34, '#6a6e76');
    var ds = shp(), p = ds.p, cx = gx - u * 0.1, cy = gy - u * 1.36; p.moveTo(cx - u * 0.62, cy - u * 0.3); p.quadraticCurveTo(cx - u * 0.3, cy + u * 0.52, cx + u * 0.56, cy + u * 0.36); p.quadraticCurveTo(cx + u * 0.06, cy + u * 0.02, cx - u * 0.62, cy - u * 0.3); p.closePath(); ds.ext(cx - u * 0.62, cy - u * 0.3); ds.ext(cx + u * 0.56, cy + u * 0.46);
    mqSolid(x, ds, '#c4c8cc', 0.4, 0.45);
    mqLine(x, [[cx - u * 0.1, cy + u * 0.22], [cx + u * 0.2, cy - u * 0.3]], Math.max(1.2, u * 0.035), '#4a4e56');
    mqGlow(x, cx + u * 0.2, cy - u * 0.3, u * 0.26, '#ff7a2a', 0.8); x.fillStyle = '#ffa050'; x.beginPath(); x.arc(cx + u * 0.2, cy - u * 0.3, u * 0.05, 0, Math.PI * 2); x.fill();
    return spr(o.c, gx, gy);
  },
  qradarS: function (S, T, rnd, seed, th) { return MQ_PROPS.qradar(S, T, rnd, seed, th, 1); },
  // 대전차 장애물: 엇갈린 강철 보 세 개
  qhedgehog: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.3, 1.2, 0.86), x = o.x, gx = o.gx, gy = o.gy, steel = seed % 2 ? '#6a5a4c' : '#5a5e66', w = Math.max(2, S * 0.1);
    softShadow(x, gx + S * 0.05, gy, S * 0.5, S * 0.13, 0.45);
    mqLine(x, [[gx - S * 0.36, gy - S * 0.56], [gx + S * 0.34, gy - S * 0.02]], w, drk(steel, 0.15));
    mqLine(x, [[gx + S * 0.38, gy - S * 0.58], [gx - S * 0.32, gy]], w, steel);
    mqLine(x, [[gx - S * 0.02, gy - S * 0.7], [gx + S * 0.04, gy + S * 0.04]], w, lit(steel, 0.18));
    x.fillStyle = rgba('#b8642a', 0.5); x.beginPath(); x.ellipse(gx + S * 0.14, gy - S * 0.3, S * 0.07, S * 0.04, -0.7, 0, Math.PI * 2); x.fill();
    return spr(o.c, gx, gy);
  },
  qrockD: function (S, T, rnd) {
    var o = mqCv(S, 1.4, 1.3, 0.86), x = o.x, gx = o.gx, gy = o.gy, col = T.rock, R = S * (0.36 + rnd() * 0.08);
    softShadow(x, gx + S * 0.06, gy, R * 1.4, R * 0.36, 0.42);
    var pts = [[gx - R * 1.1, gy], [gx - R * 0.95, gy - R * 0.8], [gx - R * 0.4, gy - R * (1.3 + rnd() * 0.3)], [gx + R * 0.3, gy - R * (1.2 + rnd() * 0.3)], [gx + R * 0.9, gy - R * 0.7], [gx + R * 1.1, gy]], s = shp().poly(pts);
    litFill(x, s, col, { hi: 0.1, lo: 0.42 });
    var fc = shp().poly([pts[1], pts[2], pts[3], [gx + R * 0.1, gy - R * 0.6], [gx - R * 0.5, gy - R * 0.45]]); x.fillStyle = lit(col, 0.34); x.fill(fc.p);
    var sd = shp().poly([pts[3], pts[4], pts[5], [gx + R * 0.3, gy], [gx + R * 0.1, gy - R * 0.6]]); x.fillStyle = rgba(drk(col, 0.6), 0.5); x.fill(sd.p);
    mqInk(x, s, col);
    return spr(o.c, gx, gy);
  },
  qbollard: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.2, 1.0, 0.84), x = o.x, gx = o.gx, gy = o.gy, iron = '#3a3e46';
    softShadow(x, gx + S * 0.05, gy, S * 0.42, S * 0.11, 0.45);
    x.save(); for (var i = 0; i < 4; i++) { var e = shp().ell(gx + S * 0.2, gy - S * 0.04 - i * S * 0.035, S * 0.2 - i * S * 0.012, S * 0.075); x.strokeStyle = mqInkC('#b89a6a'); x.lineWidth = Math.max(1.4, S * 0.045) + MQ_W; x.stroke(e.p); x.strokeStyle = i % 2 ? '#b89a6a' : '#a08458'; x.lineWidth = Math.max(1.4, S * 0.045); x.stroke(e.p); } x.restore();
    mqCyl(x, gx - S * 0.16, gy, S * 0.12, S * 0.36, iron);
    var cp = shp().ell(gx - S * 0.16, gy - S * 0.4, S * 0.19, S * 0.09); mqSolid(x, cp, '#e8a02a', 0.4, 0.4);
    return spr(o.c, gx, gy);
  },
  // 항구 크레인(가장자리 큰 장식): 주황 골조
  qcrane: function (S, T, rnd, seed) {
    var o = mqCv(S, 2.6, 3.2, 0.96), x = o.x, gx = o.gx, gy = o.gy, col = '#c4682a', dk = '#4a4e56', h = S * 2.2, w = Math.max(2, S * 0.09);
    softShadow(x, gx + S * 0.1, gy, S * 0.8, S * 0.16, 0.45);
    x.strokeStyle = rgba(MQ_INK, 0.7); x.lineWidth = Math.max(0.8, S * 0.014); x.beginPath(); x.moveTo(gx + S * 0.8, gy - h + S * 0.05); x.lineTo(gx + S * 0.8, gy - h * 0.5); x.moveTo(gx, gy - h - S * 0.36); x.lineTo(gx + S * 1.1, gy - h); x.moveTo(gx, gy - h - S * 0.36); x.lineTo(gx - S * 0.7, gy - h); x.stroke();
    mqLine(x, [[gx - S * 0.46, gy], [gx - S * 0.2, gy - h]], w, col); mqLine(x, [[gx + S * 0.46, gy], [gx + S * 0.2, gy - h]], w, drk(col, 0.12));
    for (var i = 0; i < 4; i++) { var u0 = i / 4, u1 = (i + 1) / 4, a0 = S * (0.46 - 0.26 * u0), a1 = S * (0.46 - 0.26 * u1); mqLine(x, [[gx - a0, gy - h * u0], [gx + a1, gy - h * u1]], Math.max(1.1, S * 0.03), drk(col, 0.2), 1); }
    mqLine(x, [[gx - S * 0.42, gy - h * 0.34], [gx + S * 0.42, gy - h * 0.34]], Math.max(1.4, S * 0.05), col);
    mqLine(x, [[gx - S * 0.7, gy - h], [gx + S * 1.14, gy - h]], w * 1.1, col);
    mqLine(x, [[gx, gy - h], [gx, gy - h - S * 0.36]], w * 0.8, col);
    var cb = mqBox(x, gx + S * 0.2, gy - h + S * 0.34, S * 0.34, S * 0.26, S * 0.08, '#6a6e76'); x.fillStyle = '#1c2630'; x.fillRect(cb.x0 + S * 0.05, cb.y0 + S * 0.05, S * 0.24, S * 0.1);
    var hk = mqBox(x, gx + S * 0.8, gy - h * 0.5 + S * 0.1, S * 0.2, S * 0.1, S * 0.04, dk);
    mqHazard(x, gx - S * 0.5, gy - S * 0.1, S * 0.12, S * 0.1, 3); mqHazard(x, gx + S * 0.4, gy - S * 0.1, S * 0.12, S * 0.1, 3);
    mqGlow(x, gx, gy - h - S * 0.4, S * 0.26, '#ff6a2a', 0.8); x.fillStyle = '#ff9a4a'; x.beginPath(); x.arc(gx, gy - h - S * 0.4, S * 0.04, 0, Math.PI * 2); x.fill();
    return spr(o.c, gx, gy);
  },
  // 유도등, 표지판(활주로): 줄무늬 막대와 등
  qlight: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.2, 1.1, 0.84), x = o.x, gx = o.gx, gy = o.gy;
    softShadow(x, gx + S * 0.04, gy, S * 0.42, S * 0.1, 0.4);
    [-0.3, 0.3].forEach(function (u) { mqLine(x, [[gx + u * S - S * 0.07, gy], [gx + u * S, gy - S * 0.32], [gx + u * S + S * 0.07, gy]], Math.max(1.3, S * 0.04), '#4a4e56'); });
    var bd = mqR(gx - S * 0.4, gy - S * 0.42, S * 0.8, S * 0.16); mqHazard(x, gx - S * 0.4, gy - S * 0.42, S * 0.8, S * 0.16, 8, '#f0902a', '#f0ece0'); mqInk(x, bd, '#8a5a2a');
    var lc = seed % 2 ? '#4ab0ff' : '#ffb040'; mqGlow(x, gx, gy - S * 0.56, S * 0.36, lc, 0.7);
    var lp = shp().ell(gx, gy - S * 0.52, S * 0.075, S * 0.085); x.fillStyle = lc; x.fill(lp.p); mqInk(x, lp, lc); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(gx - S * 0.02, gy - S * 0.55, S * 0.028, 0, Math.PI * 2); x.fill();
    return spr(o.c, gx, gy);
  },
  qwindsock: function (S, T) {
    var o = mqCv(S, 1.6, 2.0, 0.94), x = o.x, gx = o.gx - S * 0.3, gy = o.gy, h = S * 1.32;
    softShadow(x, gx + S * 0.04, gy, S * 0.22, S * 0.07, 0.42);
    mqBox(x, gx, gy, S * 0.2, S * 0.1, S * 0.05, '#8c8e8a');
    mqLine(x, [[gx, gy - S * 0.1], [gx, gy - h]], Math.max(1.5, S * 0.05), '#d8d8d0');
    var n = 5, y0 = gy - h + S * 0.02;
    for (var i = 0; i < n; i++) { var u0 = i / n, u1 = (i + 1) / n, xa = gx + S * 0.04 + u0 * S * 0.74, xb = gx + S * 0.04 + u1 * S * 0.74, ha = S * (0.17 - 0.09 * u0), hb = S * (0.17 - 0.09 * u1), ya = y0 + u0 * u0 * S * 0.12, yb = y0 + u1 * u1 * S * 0.12, sg = shp().poly([[xa, ya - ha], [xb, yb - hb], [xb, yb + hb], [xa, ya + ha]]); litFill(x, sg, i % 2 ? '#f0ece0' : '#f0802a', { hi: 0.25, lo: 0.3 }); mqInk(x, sg, '#b8501a', MQ_W * 0.9); }
    return spr(o.c, o.gx - S * 0.3, gy);
  },
  qhangar: function (S, T, rnd, seed) {
    var o = mqCv(S, 2.5, 2.2, 0.9), x = o.x, gx = o.gx, gy = o.gy, col = '#6c7460', w = S * 1.8, h = S * 0.98, d = S * 0.34;
    softShadow(x, gx + S * 0.12, gy, S * 1.1, S * 0.24, 0.5);
    function arch(dy, k) { var s = shp(), p = s.p; p.moveTo(gx - w / 2, gy - dy); p.lineTo(gx - w / 2, gy - dy - h * 0.3); p.bezierCurveTo(gx - w / 2, gy - dy - h * 1.2 * k, gx + w / 2, gy - dy - h * 1.2 * k, gx + w / 2, gy - dy - h * 0.3); p.lineTo(gx + w / 2, gy - dy); p.closePath(); s.ext(gx - w / 2, gy - dy - h); s.ext(gx + w / 2, gy - dy); return s; }
    var bk = arch(d, 1); x.fillStyle = lit(col, 0.3); x.fill(bk.p); x.save(); x.clip(bk.p); x.strokeStyle = rgba(MQ_INK, 0.22); x.lineWidth = Math.max(0.8, S * 0.016); for (var i = 1; i < 12; i++) { x.beginPath(); x.moveTo(gx - w / 2 + w * i / 12, gy - d - h); x.lineTo(gx - w / 2 + w * i / 12, gy - d); x.stroke(); } x.restore(); mqInk(x, bk, col);
    var fr = arch(0, 1); litFill(x, fr, col, { hi: 0.12, lo: 0.4 }); mqInk(x, fr, col);
    var dr = shp(), p2 = dr.p; p2.moveTo(gx - w * 0.36, gy); p2.lineTo(gx - w * 0.36, gy - h * 0.34); p2.bezierCurveTo(gx - w * 0.36, gy - h * 0.92, gx + w * 0.36, gy - h * 0.92, gx + w * 0.36, gy - h * 0.34); p2.lineTo(gx + w * 0.36, gy); p2.closePath(); dr.ext(gx - w * 0.36, gy - h * 0.8); dr.ext(gx + w * 0.36, gy);
    x.fillStyle = '#14181c'; x.fill(dr.p); x.save(); x.clip(dr.p); mqGlow(x, gx + w * 0.1, gy - h * 0.1, S * 0.5, '#ffb040', 0.3); x.fillStyle = '#58606a'; x.fillRect(gx - w * 0.36, gy - h, w * 0.3, h); x.fillStyle = rgba(MQ_INK, 0.4); for (var k = 0; k < 4; k++) x.fillRect(gx - w * 0.36 + k * w * 0.075, gy - h, Math.max(1, S * 0.015), h); mqHazard(x, gx - w * 0.36, gy - S * 0.1, w * 0.3, S * 0.1, 6); x.restore(); mqInk(x, dr, col);
    mqGlow(x, gx, gy - h * 0.93, S * 0.22, '#ff7a2a', 0.8); x.fillStyle = '#ffa050'; x.beginPath(); x.arc(gx, gy - h * 0.93, S * 0.04, 0, Math.PI * 2); x.fill();
    return spr(o.c, gx, gy);
  },
  // 관제 장비: 발전기 겸 통신 상자
  qgen: function (S, T, rnd, seed) {
    var o = mqCv(S, 1.3, 1.5, 0.88), x = o.x, gx = o.gx, gy = o.gy, col = seed % 2 ? '#5e6c48' : '#6a6e76', w = S * 0.72, h = S * 0.44;
    softShadow(x, gx + S * 0.05, gy, S * 0.5, S * 0.12, 0.45);
    var b = mqBox(x, gx, gy, w, h, S * 0.22, col);
    x.save(); x.clip(b.fr.p); x.fillStyle = rgba(MQ_INK, 0.5); for (var i = 0; i < 4; i++) x.fillRect(b.x0 + w * 0.1, b.y0 + h * (0.16 + i * 0.16), w * 0.36, Math.max(1, S * 0.022)); x.fillStyle = '#1c2630'; x.fillRect(b.x0 + w * 0.58, b.y0 + h * 0.14, w * 0.3, h * 0.34); x.fillStyle = '#6ae08a'; x.fillRect(b.x0 + w * 0.62, b.y0 + h * 0.22, w * 0.12, Math.max(1.2, h * 0.07)); x.restore();
    mqHazard(x, b.x0 + MQ_W * 0.5, gy - h * 0.2, w - MQ_W, h * 0.16, 8, '#e8862a', '#22241e');
    mqLine(x, [[gx + w * 0.3, gy - h - S * 0.12], [gx + w * 0.3, gy - h - S * 0.62]], Math.max(1.2, S * 0.03), '#4a4e56');
    mqGlow(x, gx + w * 0.3, gy - h - S * 0.66, S * 0.24, '#ff7a2a', 0.8); x.fillStyle = '#ffa050'; x.beginPath(); x.arc(gx + w * 0.3, gy - h - S * 0.66, S * 0.04, 0, Math.PI * 2); x.fill();
    mqCyl(x, gx - w * 0.26, gy - h - S * 0.1, S * 0.05, S * 0.16, '#3a3e46');
    return spr(o.c, gx, gy);
  }
};
Object.keys(MQ_PROPS).forEach(function (k) { PROPS[k] = MQ_PROPS[k]; });

// ---------- 배경 한 장 굽기 (mq 테마) ----------
// 빛나는 소품의 바닥 빛 웅덩이: [색, 반지름(칸), 세기, 옆으로 밀림(칸)]
var MQ_TM = [];   // 마지막으로 구운 배경의 단계별 시각(시험용)
var MQ_LIT = { qlamp: ['#ffb040', 1.7, 0.3, 0], qlantern: ['#ff9a30', 1.5, 0.3, 0.2], qtorch: ['#3aa8ff', 1.7, 0.32, 0], qcandle: ['#ffb040', 1.1, 0.24, 0], qslamp: ['#ffa040', 1.8, 0.26, 0.34], qsignal: ['#ff9a2a', 0.9, 0.2, 0.14],
  qpump: ['#ffb030', 0.9, 0.2, 0], qbigpump: ['#ffb030', 1.8, 0.3, 0], qmaus: ['#58e0c8', 1.2, 0.2, 0], qsarc: ['#58e0c8', 1.6, 0.24, 0], qlight: ['#ffb040', 0.8, 0.18, 0], qhangar: ['#ffb040', 1.2, 0.16, 0] };
function mqBackground(g, view) {
  var th = g.M.theme, T = THEME[th], W = view.W, H = view.H, S = view.S, ox = view.ox, oy = view.oy;
  var c = mkC(W, H), x = cx2(c), rnd = rngOf(hashStr(g.M.id) + 11), N = makeNoise(hashStr(g.M.id) + 5);
  var E = { x: x, g: g, v: view, T: T, th: th, S: S, ox: ox, oy: oy, W: W, H: H, rnd: rnd, N: N, wx0: -ox / S, wy0: -oy / S, wx1: (W - ox) / S, wy1: (H - oy) / S, lights: [] };
  E.area = (E.wx1 - E.wx0) * (E.wy1 - E.wy0);
  E.kind = function (wx, wy) { var cc = Math.floor(wx), rr = Math.floor(wy); return cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS ? '' : g.kind[rr * COLS + cc]; };
  E.free = function (wx, wy) { var k = E.kind(wx, wy); return k !== 'p' && k !== 'water' && k !== 'lava'; };
  E.X = function (wx) { return ox + wx * S; }; E.Y = function (wy) { return oy + wy * S; };
  E.rx = function () { return E.wx0 + rnd() * (E.wx1 - E.wx0); }; E.ry = function () { return E.wy0 + rnd() * (E.wy1 - E.wy0); };
  var tm = MQ_TM = [], mk = function (k) { tm.push([k, performance.now()]); }; mk('start'); E.mk = mk;
  mqUiReg();
  // 1) 땅 바탕: 낮은 해상도 노이즈, 두세 단계 색
  var gr = 10, GW = Math.ceil((E.wx1 - E.wx0) * gr) + 2, GH = Math.ceil((E.wy1 - E.wy0) * gr) + 2, lc = mkC(GW, GH), lx = cx2(lc), id = lx.createImageData(GW, GH), d = id.data;
  var C0 = hx(T.g[0]), C1 = hx(T.g[1]), C2 = hx(T.g[2]), CP = hx(T.patch), flat = T.gnd === 'pave' || T.gnd === 'dock' || T.gnd === 'flag' ? 0.55 : 1;
  for (var j = 0; j < GH; j++) for (var i = 0; i < GW; i++) {
    var wx = E.wx0 + i / gr, wy = E.wy0 + j / gr, n = N.fbm(wx * 0.4, wy * 0.4, 3), m = N.fbm(wx * 0.23 + 40, wy * 0.23 + 10, 3), q = N.fbm(wx * 0.5 + 90, wy * 0.5 + 31, 2);
    var v = mpSmooth(0.38, 0.6, n), hl = mpSmooth(0.52, 0.64, m) * 0.8 * flat, pt = mpSmooth(0.6, 0.7, q) * 0.6 * flat;
    var r = C0[0] + (C1[0] - C0[0]) * v, gg = C0[1] + (C1[1] - C0[1]) * v, b = C0[2] + (C1[2] - C0[2]) * v;
    r += (C2[0] - r) * hl; gg += (C2[1] - gg) * hl; b += (C2[2] - b) * hl; r += (CP[0] - r) * pt; gg += (CP[1] - gg) * pt; b += (CP[2] - b) * pt;
    var k = (j * GW + i) * 4; d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
  }
  lx.putImageData(id, 0, 0); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(lc, 0, 0, GW, GH, ox + E.wx0 * S, oy + E.wy0 * S, GW / gr * S, GH / gr * S);
  x.lineCap = 'round'; x.lineJoin = 'round';
  mk('base');
  // 2) 땅 무늬
  MQ_GND[T.gnd](E); mk('ground');
  // 바위 칸('#') 바닥: 살짝 어두운 판(건설 불가가 읽히게) + 빛나는 소품의 빛 자리
  for (var rr = 0; rr < ROWS; rr++) for (var cc = 0; cc < COLS; cc++) if (g.kind[rr * COLS + cc] === 'rock') {
    var pd = shp().rrect(E.X(cc) + S * 0.06, E.Y(rr) + S * 0.06, S * 0.88, S * 0.88, S * 0.12); x.fillStyle = rgba(T.ch === 2 ? '#05040c' : '#101216', T.ch === 2 ? 0.3 : 0.2); x.fill(pd.p);
    var bk = T.blk[((cc * 3 + rr * 5) % 6) % T.blk.length], L = MQ_LIT[bk]; if (L) E.lights.push({ x: cc + 0.5 + L[3], y: rr + 0.7, c: L[0], r: L[1], a: L[2] });
  }
  // 3) 물, 용암 (art_map.js의 그리기를 그대로 씀. 물 모양은 MB 갈래 담당)
  paintLiquids(x, g, view, T, rnd);
  if (T.quay) mqQuay(E);
  mk('liquid');
  // 4) 길
  mqRoads(E); mk('roads');
  mqPiers(E);
  // 5) 가장자리 장식
  mqMargin(E); mk('margin');
  // 6) 색 보정과 분위기 덮개
  mqGrade(E); mk('grade');
  return c;
}
// 풀포기(어두운 땅 위 밝은 날)
function mqTuft(E, wx, wy, col, hh) {
  var x = E.x, S = E.S, X = E.X(wx), Y = E.Y(wy);
  x.strokeStyle = col; x.lineWidth = Math.max(1, S * 0.026); x.beginPath();
  for (var b = -1; b <= 1; b++) { var a = -Math.PI / 2 + b * 0.55, l = hh * (b ? 0.75 : 1); x.moveTo(X + b * S * 0.012, Y); x.quadraticCurveTo(X + Math.cos(a) * l * 0.5, Y - l * 0.6, X + Math.cos(a) * l, Y + Math.sin(a) * l); }
  x.stroke();
}
function mqCrack(E, wx, wy, len, col) {
  var x = E.x, S = E.S, rnd = E.rnd, X = E.X(wx), Y = E.Y(wy), a = rnd() * 6.28; x.strokeStyle = col; x.lineWidth = Math.max(0.8, S * 0.016); x.beginPath(); x.moveTo(X, Y);
  for (var i = 0; i < 4; i++) { a += (rnd() - 0.5) * 1.3; X += Math.cos(a) * len * S / 4; Y += Math.sin(a) * len * S / 4; x.lineTo(X, Y); } x.stroke();
}
var MQ_GND = {
  // 묘지, 폐저택 정원, 호박밭: 어두운 풀밭
  wild: function (E) {
    var x = E.x, S = E.S, T = E.T, rnd = E.rnd, N = E.N, th = E.th, i, wx, wy;
    if (th === 'pumpkin') { // 밭고랑
      x.strokeStyle = rgba(T.grass[0], 0.3); x.lineWidth = Math.max(1, S * 0.045);
      for (var fy = Math.floor(E.wy0) - 0.1; fy < E.wy1; fy += 0.25) { x.beginPath(); for (var fx = E.wx0; fx <= E.wx1 + 0.4; fx += 0.4) { var yy = fy + N.n2(fx * 0.8, fy * 3) * 0.1; if (fx === E.wx0) x.moveTo(E.X(fx), E.Y(yy)); else x.lineTo(E.X(fx), E.Y(yy)); } x.stroke(); }
    }
    for (i = 0; i < E.area * 0.1; i++) { x.globalAlpha = 0.09; x.drawImage(softSpr(T.rim, 48), E.X(E.rx()) - S * 1.3, E.Y(E.ry()) - S * 0.6, S * 2.6, S * 1.2); } x.globalAlpha = 1;
    for (i = 0; i < E.area * 1.5; i++) {
      wx = E.rx(); wy = E.ry(); if (N.fbm(wx * 0.7 + 5, wy * 0.7 + 9, 2) < 0.44 || !E.free(wx, wy)) continue;
      var nt = 2 + Math.floor(rnd() * 3);
      for (var t = 0; t < nt; t++) { var tx = wx + (rnd() - 0.5) * 0.6, ty = wy + (rnd() - 0.5) * 0.4; if (!E.free(tx, ty)) continue; mqTuft(E, tx + 0.012, ty + 0.02, rgba(T.grass[0], 0.6), S * (0.08 + rnd() * 0.05)); mqTuft(E, tx, ty, rnd() < 0.75 ? T.grass[1] : T.grass[2], S * (0.08 + rnd() * 0.05)); }
    }
    if (th === 'manor') for (i = 0; i < E.area * 0.2; i++) { // 깨진 정원 디딤돌 무리
      wx = E.rx(); wy = E.ry(); for (var sl = 0; sl < 3; sl++) { var sx2 = wx + sl * 0.3 + (rnd() - 0.5) * 0.08, sy2 = wy + (rnd() - 0.5) * 0.16; if (!E.free(sx2 - 0.12, sy2) || !E.free(sx2 + 0.12, sy2)) continue; var sb = shp().rrect(E.X(sx2) - S * 0.11, E.Y(sy2) - S * 0.07, S * 0.22, S * 0.14, S * 0.04); x.fillStyle = rgba(MQ_INK, 0.45); x.save(); x.translate(S * 0.012, S * 0.02); x.fill(sb.p); x.restore(); x.fillStyle = mixc(T.rock, T.g[1], 0.45 + rnd() * 0.2); x.fill(sb.p); x.fillStyle = rgba(T.rim, 0.16); x.fillRect(E.X(sx2) - S * 0.09, E.Y(sy2) - S * 0.065, S * 0.18, Math.max(1, S * 0.02)); }
    }
    if (th === 'pumpkin') for (i = 0; i < E.area * 0.22; i++) { // 덩굴과 꼬마 호박
      wx = E.rx(); wy = E.ry(); if (!E.free(wx, wy) || !E.free(wx + 0.3, wy) || !E.free(wx - 0.3, wy)) continue; var vx = E.X(wx), vy = E.Y(wy);
      x.strokeStyle = rgba(MQ_INK, 0.5); x.lineWidth = Math.max(1.4, S * 0.05); x.beginPath(); x.moveTo(vx - S * 0.3, vy); x.bezierCurveTo(vx - S * 0.1, vy - S * 0.14, vx + S * 0.1, vy + S * 0.12, vx + S * 0.3, vy - S * 0.03); x.stroke(); x.strokeStyle = '#5a6a2c'; x.lineWidth = Math.max(1, S * 0.028); x.stroke();
      if (rnd() < 0.6) mqPumpkin(x, vx + (rnd() - 0.5) * S * 0.3, vy + S * 0.05, S * (0.06 + rnd() * 0.03), 0);
    }
    if (th === 'graveyard') for (i = 0; i < E.area * 0.06; i++) { // 풀에 묻힌 납작한 묘석 판
      wx = Math.floor(E.rx()) + 0.5; wy = Math.floor(E.ry()) + 0.55; if (E.kind(wx, wy) !== 'g' && E.kind(wx, wy) !== '') continue; var gs = shp().rrect(E.X(wx) - S * 0.24, E.Y(wy) - S * 0.15, S * 0.48, S * 0.3, S * 0.05);
      x.fillStyle = rgba(MQ_INK, 0.4); x.save(); x.translate(S * 0.015, S * 0.025); x.fill(gs.p); x.restore(); x.fillStyle = mixc(T.rock, T.g[1], 0.76); x.fill(gs.p); x.strokeStyle = rgba(MQ_INK, 0.3); x.lineWidth = Math.max(1, S * 0.018); x.stroke(gs.p); x.fillStyle = rgba(T.rim, 0.14); x.fillRect(E.X(wx) - S * 0.2, E.Y(wy) - S * 0.13, S * 0.4, Math.max(1, S * 0.02)); x.fillStyle = rgba(T.moss, 0.5); x.beginPath(); x.ellipse(E.X(wx) - S * 0.14, E.Y(wy) + S * 0.1, S * 0.14, S * 0.06, 0, 0, Math.PI * 2); x.fill(); mqCrack(E, wx, wy - 0.05, 0.3, rgba(MQ_INK, 0.4));
    }
    // 테마 장식: 낙엽, 짚, 창백한 들꽃, 잔돌
    for (i = 0; i < E.area * (th === 'manor' ? 2.2 : 0.9); i++) {
      wx = E.rx(); wy = E.ry(); if (!E.free(wx, wy)) continue; var X = E.X(wx), Y = E.Y(wy), q = rnd();
      if (th === 'manor' || (th === 'pumpkin' && q < 0.5)) { var lc = th === 'manor' ? ['#b8702a', '#8e4e22', '#c8943a', '#6e3a2a'][Math.floor(rnd() * 4)] : '#b89a4a'; x.fillStyle = rgba(MQ_INK, 0.35); x.beginPath(); x.ellipse(X + S * 0.01, Y + S * 0.015, S * 0.045, S * 0.022, q * 6, 0, Math.PI * 2); x.fill(); x.fillStyle = lc; x.beginPath(); x.ellipse(X, Y, S * 0.042, S * 0.02, q * 6, 0, Math.PI * 2); x.fill(); }
      else if (th === 'graveyard' && q < 0.35) { x.fillStyle = rgba(T.flowers[0], 0.85); for (var f = 0; f < 3; f++) { x.beginPath(); x.arc(X + (rnd() - 0.5) * S * 0.2, Y + (rnd() - 0.5) * S * 0.12, S * 0.016, 0, Math.PI * 2); x.fill(); } }
      else { var pr = S * (0.02 + rnd() * 0.02); x.fillStyle = rgba(MQ_INK, 0.4); x.beginPath(); x.ellipse(X + pr * 0.2, Y + pr * 0.35, pr * 1.1, pr * 0.7, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = mixc(T.rock, T.g[1], 0.35); x.beginPath(); x.ellipse(X, Y, pr, pr * 0.66, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = rgba(T.rim, 0.5); x.beginPath(); x.ellipse(X - pr * 0.3, Y - pr * 0.25, pr * 0.4, pr * 0.22, 0, 0, Math.PI * 2); x.fill(); }
    }
  },
  // 성 지하: 큰 돌바닥(반 칸 높이, 엇갈림)
  flag: function (E) {
    var x = E.x, S = E.S, T = E.T, rnd = E.rnd, jw = Math.max(1, S * 0.03), i;
    function slab(X, Y, w, h) { var v = rnd(); x.fillStyle = v < 0.5 ? rgba('#c8d0ff', 0.015 + v * 0.08) : rgba('#000000', (v - 0.5) * 0.28); x.fillRect(X, Y, w, h); x.fillStyle = rgba(T.rim, 0.11); x.fillRect(X + jw, Y + jw, w - jw, Math.max(1, S * 0.018)); x.fillStyle = rgba('#05040c', 0.62); x.fillRect(X, Y, w, jw); x.fillRect(X, Y, jw, h); }
    for (var r = Math.floor(E.wy0) - 1; r < E.wy1 + 1; r++) for (var c0 = Math.floor(E.wx0) - 1; c0 < E.wx1 + 1; c0++) {
      var X = E.X(c0), Y = E.Y(r), sp = rnd();
      if (sp < 0.5) slab(X, Y, S, S); else if (sp < 0.78) { slab(X, Y, S, S * 0.5); slab(X, Y + S * 0.5, S, S * 0.5); } else { slab(X, Y, S * 0.5, S); slab(X + S * 0.5, Y, S * 0.5, S); }
    }
    for (i = 0; i < E.area * 0.1; i++) { x.globalAlpha = 0.1; x.drawImage(softSpr('#3a9a9a', 48), E.X(E.rx()) - S * 1.2, E.Y(E.ry()) - S * 0.6, S * 2.4, S * 1.2); } x.globalAlpha = 1;
    for (i = 0; i < E.area * 0.22; i++) mqCrack(E, E.rx(), E.ry(), 0.5 + rnd() * 0.5, rgba('#05040c', 0.55));
    for (i = 0; i < E.area * 0.3; i++) { var wx = E.rx(), wy = E.ry(); if (!E.free(wx, wy)) continue; var pr = S * (0.02 + rnd() * 0.025); x.fillStyle = rgba('#05040c', 0.5); x.beginPath(); x.ellipse(E.X(wx) + pr * 0.2, E.Y(wy) + pr * 0.3, pr * 1.1, pr * 0.7, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = T.grass[3]; x.beginPath(); x.ellipse(E.X(wx), E.Y(wy), pr, pr * 0.64, 0, 0, Math.PI * 2); x.fill(); }
  },
  // 도심: 칸마다 콘크리트 보도 판(이음매가 칸 경계와 맞음), 맨홀, 기름 얼룩, 금
  pave: function (E) {
    var x = E.x, S = E.S, T = E.T, rnd = E.rnd, jw = Math.max(1, S * 0.022), i, wx, wy;
    for (var r = Math.floor(E.wy0) - 1; r < E.wy1 + 1; r++) for (var c0 = Math.floor(E.wx0) - 1; c0 < E.wx1 + 1; c0++) {
      var X = E.X(c0), Y = E.Y(r), v = rnd();
      x.fillStyle = v < 0.5 ? rgba('#ffffff', v * 0.1) : rgba('#000000', (v - 0.5) * 0.16); x.fillRect(X, Y, S, S);
      x.fillStyle = rgba('#ffffff', 0.06); x.fillRect(X + jw, Y + jw, S - jw, Math.max(1, S * 0.014));
      x.fillStyle = rgba('#101216', 0.42); x.fillRect(X, Y, S, jw); x.fillRect(X, Y, jw, S);
    }
    for (i = 0; i < E.area * 0.12; i++) { x.globalAlpha = 0.16; x.drawImage(softSpr('#15171b', 48), E.X(E.rx()) - S * 0.7, E.Y(E.ry()) - S * 0.4, S * 1.4, S * 0.8); } x.globalAlpha = 1;
    for (i = 0; i < E.area * 0.25; i++) mqCrack(E, E.rx(), E.ry(), 0.4 + rnd() * 0.5, rgba('#15171b', 0.5));
    for (i = 0; i < E.area * 0.06; i++) { // 맨홀
      wx = Math.floor(E.rx()) + 0.5; wy = Math.floor(E.ry()) + 0.5; if (E.kind(wx, wy) === 'p' || !E.free(wx, wy)) continue; var X2 = E.X(wx), Y2 = E.Y(wy);
      x.fillStyle = '#2c2e34'; x.beginPath(); x.ellipse(X2, Y2, S * 0.26, S * 0.19, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#5a5e66'; x.lineWidth = Math.max(1, S * 0.03); x.beginPath(); x.ellipse(X2, Y2, S * 0.2, S * 0.145, 0, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(X2 - S * 0.14, Y2); x.lineTo(X2 + S * 0.14, Y2); x.moveTo(X2, Y2 - S * 0.1); x.lineTo(X2, Y2 + S * 0.1); x.stroke();
    }
    for (i = 0; i < E.area * 0.1; i++) { // 바랜 노란 주차선(칸 경계에 맞춤)
      wx = Math.floor(E.rx()); wy = Math.floor(E.ry()); if (E.kind(wx + 0.5, wy + 0.5) === 'p' || E.kind(wx + 1.5, wy + 0.5) === 'p') continue; x.fillStyle = 'rgba(232,186,58,0.4)'; var lw2 = Math.max(1.2, S * 0.035);
      x.fillRect(E.X(wx) + S * 0.08, E.Y(wy) + S * 0.1, lw2, S * 0.8); x.fillRect(E.X(wx + 1) - lw2 / 2, E.Y(wy) + S * 0.1, lw2, S * 0.8); x.fillRect(E.X(wx + 2) - S * 0.08 - lw2, E.Y(wy) + S * 0.1, lw2, S * 0.8); x.fillRect(E.X(wx) + S * 0.08, E.Y(wy) + S * 0.1, S * 1.84, lw2);
    }
    for (i = 0; i < E.area * 0.12; i++) { wx = E.rx(); wy = E.ry(); if (!E.free(wx, wy)) continue; x.fillStyle = rgba('#a8c8e0', 0.16); x.beginPath(); x.ellipse(E.X(wx), E.Y(wy), S * (0.14 + rnd() * 0.12), S * 0.06, 0, 0, Math.PI * 2); x.fill(); }
    for (i = 0; i < E.area * 0.5; i++) { wx = E.rx(); wy = E.ry(); if (!E.free(wx, wy)) continue; mqTuft(E, Math.round(wx) + (rnd() - 0.5) * 0.06, wy, T.grass[2], S * 0.06); }
  },
  // 사막: 모래 물결, 옅은 바퀴 자국, 잔돌, 마른 풀
  sand: function (E) {
    var x = E.x, S = E.S, T = E.T, rnd = E.rnd, N = E.N, i, wx, wy, X, Y;
    for (i = 0; i < E.area * 5; i++) { wx = E.rx(); wy = E.ry(); X = E.X(wx); Y = E.Y(wy); var L = S * (0.2 + rnd() * 0.3), lt = rnd() < 0.5; x.strokeStyle = lt ? rgba('#fff0d0', 0.22) : rgba('#6a5234', 0.16); x.lineWidth = Math.max(1, S * 0.022); x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + L / 2, Y - S * 0.05, X + L, Y + (rnd() - 0.5) * S * 0.04); x.stroke(); }
    x.save(); x.setLineDash([S * 0.045, S * 0.04]); x.lineWidth = Math.max(1.5, S * 0.08);
    for (i = 0; i < 3; i++) { var y0 = E.wy0 + (E.wy1 - E.wy0) * (0.15 + i * 0.3 + rnd() * 0.1), ph = rnd() * 6; [-0.14, 0.14].forEach(function (o) { x.strokeStyle = rgba('#6a5234', 0.14); x.beginPath(); for (var fx = E.wx0; fx <= E.wx1 + 0.3; fx += 0.3) { var yy = y0 + o + Math.sin(fx * 0.5 + ph) * 0.9 + N.n2(fx * 0.3, i * 7) * 0.6; if (fx === E.wx0) x.moveTo(E.X(fx), E.Y(yy)); else x.lineTo(E.X(fx), E.Y(yy)); } x.stroke(); }); }
    x.restore();
    for (i = 0; i < E.area * 0.7; i++) { wx = E.rx(); wy = E.ry(); if (!E.free(wx, wy)) continue; X = E.X(wx); Y = E.Y(wy); var pr = S * (0.018 + rnd() * 0.022); x.fillStyle = rgba('#4a3824', 0.4); x.beginPath(); x.ellipse(X + pr * 0.3, Y + pr * 0.4, pr * 1.2, pr * 0.7, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = mixc(T.rock, '#000000', rnd() * 0.15); x.beginPath(); x.ellipse(X, Y, pr, pr * 0.66, 0, 0, Math.PI * 2); x.fill(); }
    for (i = 0; i < E.area * 0.045; i++) { // 포탄 자국
      wx = E.rx(); wy = E.ry(); if (!E.free(wx - 0.3, wy) || !E.free(wx + 0.3, wy) || !E.free(wx, wy)) continue; X = E.X(wx); Y = E.Y(wy); var cr = S * (0.2 + rnd() * 0.12);
      x.fillStyle = rgba('#fff0d0', 0.3); x.beginPath(); x.ellipse(X, Y, cr * 1.25, cr * 0.72, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = rgba('#5a4630', 0.5); x.beginPath(); x.ellipse(X, Y, cr, cr * 0.56, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = rgba('#3a2c1e', 0.5); x.beginPath(); x.ellipse(X - cr * 0.1, Y - cr * 0.08, cr * 0.66, cr * 0.34, 0, 0, Math.PI * 2); x.fill();
    }
    for (i = 0; i < E.area * 0.35; i++) { wx = E.rx(); wy = E.ry(); if (!E.free(wx, wy) || N.fbm(wx * 0.6, wy * 0.6, 2) < 0.5) continue; mqTuft(E, wx + 0.012, wy + 0.02, rgba('#4a3824', 0.4), S * 0.09); mqTuft(E, wx, wy, rnd() < 0.5 ? T.tree[1] : T.grass[1], S * 0.09); }
  },
  // 항구: 큰 부두 콘크리트 판(두 칸 이음매), 물가 경고 줄무늬, 녹 얼룩
  dock: function (E) {
    var x = E.x, S = E.S, T = E.T, rnd = E.rnd, g = E.g, jw = Math.max(1, S * 0.03), i, c, r;
    for (r = Math.floor(E.wy0) - 1; r < E.wy1 + 1; r++) for (c = Math.floor(E.wx0) - 1; c < E.wx1 + 1; c++) {
      var X = E.X(c), Y = E.Y(r), v = rnd();
      x.fillStyle = v < 0.5 ? rgba('#ffffff', v * 0.09) : rgba('#000000', (v - 0.5) * 0.14); x.fillRect(X, Y, S, S);
      x.fillStyle = rgba('#14181c', (r & 1) ? 0.14 : 0.4); x.fillRect(X, Y, S, (r & 1) ? Math.max(1, jw * 0.6) : jw);
      x.fillStyle = rgba('#14181c', (c & 1) ? 0.14 : 0.4); x.fillRect(X, Y, (c & 1) ? Math.max(1, jw * 0.6) : jw, S);
    }
    for (i = 0; i < E.area * 0.14; i++) { x.globalAlpha = 0.13; x.drawImage(softSpr(rnd() < 0.5 ? '#8a4a24' : '#14181c', 48), E.X(E.rx()) - S * 0.6, E.Y(E.ry()) - S * 0.5, S * 1.2, S * 1.0); } x.globalAlpha = 1;
    for (i = 0; i < E.area * 0.18; i++) mqCrack(E, E.rx(), E.ry(), 0.4 + rnd() * 0.4, rgba('#14181c', 0.45));
    // 물과 맞닿은 땅 칸의 가장자리에 주황, 검정 줄무늬
    var liq = function (cc, rr) { if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) return false; var k = g.kind[rr * COLS + cc]; return k === 'water'; };
    x.save(); x.globalAlpha = 0.8;
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) { if (liq(c, r)) continue; var X0 = E.X(c), Y0 = E.Y(r), hw = S * 0.13;
      if (liq(c - 1, r)) mqHazard(x, X0 + S * 0.1, Y0, hw, S, 2, '#e8962a', '#22242a'); if (liq(c + 1, r)) mqHazard(x, X0 + S * 0.9 - hw, Y0, hw, S, 2, '#e8962a', '#22242a');
      if (liq(c, r - 1)) mqHazard(x, X0, Y0 + S * 0.1, S, hw, 8, '#e8962a', '#22242a'); if (liq(c, r + 1)) mqHazard(x, X0, Y0 + S * 0.9 - hw, S, hw, 8, '#e8962a', '#22242a'); }
    x.restore();
  },
  // 활주로 둘레: 깎은 풀 줄무늬, 바위 칸 밑 콘크리트 판, 마른 풀
  field: function (E) {
    var x = E.x, S = E.S, T = E.T, rnd = E.rnd, N = E.N, g = E.g, i, wx, wy;
    for (var r = Math.floor(E.wy0) - 1; r < E.wy1 + 1; r++) if (r & 1) { x.fillStyle = rgba(T.g[2], 0.22); x.fillRect(0, E.Y(r), E.W, S); }
    for (var rr = 0; rr < ROWS; rr++) for (var cc = 0; cc < COLS; cc++) if (g.kind[rr * COLS + cc] === 'rock') { var pd = shp().rrect(E.X(cc) + S * 0.03, E.Y(rr) + S * 0.03, S * 0.94, S * 0.94, S * 0.06); x.fillStyle = '#8c8e88'; x.fill(pd.p); x.strokeStyle = rgba('#16181c', 0.5); x.lineWidth = Math.max(1, S * 0.025); x.stroke(pd.p); x.fillStyle = rgba('#16181c', 0.3); x.fillRect(E.X(cc + 0.5), E.Y(rr) + S * 0.03, Math.max(1, S * 0.02), S * 0.94); }
    for (i = 0; i < E.area * 1.3; i++) {
      wx = E.rx(); wy = E.ry(); if (N.fbm(wx * 0.7 + 5, wy * 0.7 + 9, 2) < 0.46 || !E.free(wx, wy) || E.kind(wx, wy) === 'rock') continue;
      for (var t = 0; t < 3; t++) { var tx = wx + (rnd() - 0.5) * 0.6, ty = wy + (rnd() - 0.5) * 0.4; if (!E.free(tx, ty) || E.kind(tx, ty) === 'rock') continue; mqTuft(E, tx + 0.012, ty + 0.02, rgba(T.grass[0], 0.55), S * 0.09); mqTuft(E, tx, ty, rnd() < 0.6 ? T.grass[2] : T.grass[3], S * (0.07 + rnd() * 0.04)); }
    }
    for (i = 0; i < E.area * 0.3; i++) { wx = E.rx(); wy = E.ry(); if (!E.free(wx, wy) || E.kind(wx, wy) === 'rock') continue; x.fillStyle = rnd() < 0.5 ? '#e8d870' : '#f0ece0'; x.beginPath(); x.arc(E.X(wx), E.Y(wy), Math.max(1, S * 0.02), 0, Math.PI * 2); x.fill(); }
  }
};
// 항구 물가 소품: 부두 말뚝(물과 맞닿은 칸 모서리), 물 위 부표
function mqBuoy(x, X, Y, S) {
  x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = Math.max(1, S * 0.02); x.beginPath(); x.ellipse(X, Y + S * 0.02, S * 0.16, S * 0.06, 0, 0, Math.PI * 2); x.stroke();
  var b = shp().poly([[X - S * 0.09, Y], [X - S * 0.035, Y - S * 0.24], [X + S * 0.035, Y - S * 0.24], [X + S * 0.09, Y]]); litFill(x, b, '#e8742a', { hi: 0.3, lo: 0.35 }); x.save(); x.clip(b.p); x.fillStyle = '#f0ece0'; x.fillRect(X - S * 0.1, Y - S * 0.15, S * 0.2, S * 0.05); x.restore(); mqInk(x, b, '#e8742a');
  x.fillStyle = '#ffd24a'; x.beginPath(); x.arc(X, Y - S * 0.27, S * 0.03, 0, Math.PI * 2); x.fill();
}
function mqQuay(E) {
  var x = E.x, S = E.S, g = E.g, c, r, lane = {};
  var W = function (cc, rr) { return cc >= 0 && rr >= 0 && cc < COLS && rr < ROWS && g.kind[rr * COLS + cc] === 'water'; };
  (g.M.sea || []).forEach(function (w) { for (var i = 1; i < w.length; i++) { var a = w[i - 1], b = w[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2) + 1; for (var t = 0; t <= n; t++) lane[Math.round(a[0] + (b[0] - a[0]) * t / n) + ',' + Math.round(a[1] + (b[1] - a[1]) * t / n)] = 1; } });
  MQ_W = Math.max(1.2, S * 0.03);
  for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
    if (W(c, r)) { if (!lane[c + ',' + r] && (c * 7 + r * 13) % 11 === 0 && W(c - 1, r) && W(c + 1, r) && W(c, r - 1) && W(c, r + 1)) mqBuoy(x, E.X(c + 0.5), E.Y(r + 0.62), S); continue; }
    if ((c + r) % 2) continue;
    [[-1, 0], [1, 0], [0, 1]].forEach(function (o) { if (!W(c + o[0], r + o[1])) return; var X = E.X(c + 0.5 + o[0] * 0.36), Y = E.Y(r + 0.56 + o[1] * 0.36); softShadow(x, X + S * 0.02, Y, S * 0.1, S * 0.04, 0.4); mqCyl(x, X, Y, S * 0.055, S * 0.12, '#3a3e46'); var cp = shp().ell(X, Y - S * 0.13, S * 0.08, S * 0.04); litFill(x, cp, '#e8a02a', { hi: 0.4, lo: 0.3 }); mqInk(x, cp, '#e8a02a', MQ_W * 0.8); });
  }
}
// 뱃길(M.sea) 끝의 부두: 물 위로 내민 판 + 말뚝 (2장 나무 잔교, 3장 콘크리트와 경고 줄무늬)
function mqPiers(E) {
  var x = E.x, S = E.S, T = E.T, sea = E.g.M.sea; if (!sea || !sea.length) return;
  MQ_W = Math.max(1.2, S * 0.03);
  sea.forEach(function (w) {
    if (!w || w.length < 2) return; var a = w[w.length - 2], b = w[w.length - 1], dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), X = E.X(b[0] + 0.5 + dx * 0.34), Y = E.Y(b[1] + 0.5 + dy * 0.34), hz = dx !== 0, pw = S * (hz ? 0.46 : 1.0), ph = S * (hz ? 1.0 : 0.46), col = T.ch === 2 ? '#6a5244' : '#a4a8a4';
    x.fillStyle = rgba(MQ_INK, 0.4); x.fillRect(X - pw / 2 + S * 0.03, Y - ph / 2 + S * 0.06, pw, ph);
    var pl = mqR(X - pw / 2, Y - ph / 2, pw, ph); litFill(x, pl, col, { hi: 0.25, lo: 0.3 });
    x.save(); x.clip(pl.p); x.fillStyle = rgba(MQ_INK, 0.35); for (var i = 1; i < 5; i++) { if (hz) x.fillRect(X - pw / 2, Y - ph / 2 + ph * i / 5, pw, Math.max(1, S * 0.02)); else x.fillRect(X - pw / 2 + pw * i / 5, Y - ph / 2, Math.max(1, S * 0.02), ph); }
    if (T.ch === 3) { if (hz) mqHazard(x, dx > 0 ? X + pw / 2 - S * 0.1 : X - pw / 2, Y - ph / 2, S * 0.1, ph, 2, '#e8962a', '#22242a'); else mqHazard(x, X - pw / 2, dy > 0 ? Y + ph / 2 - S * 0.1 : Y - ph / 2, pw, S * 0.1, 8, '#e8962a', '#22242a'); }
    x.restore(); mqInk(x, pl, col);
    [-1, 1].forEach(function (sd) { var px = hz ? X - dx * pw * 0.3 : X + sd * pw * 0.42, py = hz ? Y + sd * ph * 0.42 : Y - dy * ph * 0.3; mqCyl(x, px, py + S * 0.05, S * 0.06, S * 0.16, T.ch === 2 ? '#4a3a30' : '#3a3e46'); var cp = shp().ell(px, py - S * 0.12, S * 0.085, S * 0.042); litFill(x, cp, T.ch === 2 ? '#8a7460' : '#e8a02a', { hi: 0.4, lo: 0.3 }); mqInk(x, cp, '#8a7460', MQ_W * 0.8); });
  });
}
// 길: 2장 자갈, 진흙, 돌바닥 / 3장 아스팔트, 다져진 흙, 콘크리트, 유도로
function mqRoads(E) {
  var x = E.x, g = E.g, S = E.S, ox = E.ox, oy = E.oy, T = E.T, D = T.dirt, rnd = E.rnd, N = E.N, road = T.road, W = E.W, H = E.H, soft = T.ch === 2, i, k;
  var P = g.M.paths.map(function (w) { var a = w[0], b = w[1], dx = Math.sign(a[0] - b[0]), dy = Math.sign(a[1] - b[1]), w2 = w.slice(); w2[0] = [a[0] + dx * 6, a[1] + dy * 6]; return buildPath(w2, 0.5); });
  function at(p, i, off) { var j = Math.min(p.n - 2, i), dx = p.xs[j + 1] - p.xs[j], dy = p.ys[j + 1] - p.ys[j], L = Math.hypot(dx, dy) || 1; return [ox + (p.xs[i] - dy / L * off) * S, oy + (p.ys[i] + dx / L * off) * S, Math.atan2(dy, dx)]; }
  function strokeAll(c, w, col, off, step) { c.strokeStyle = col; c.lineWidth = w; P.forEach(function (p) { c.beginPath(); for (var i = 0; i < p.n; i += step || 3) { var q = off ? at(p, i, off) : [ox + p.xs[i] * S, oy + p.ys[i] * S]; if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } c.stroke(); }); }
  // 울퉁불퉁한 길 모양: 원을 한 경로에 모아 한 번만 칠함(겹쳐 칠하지 않아 빠르고, 반투명 그늘도 고르게)
  function blobs(c, r0, col) { var pth = new Path2D(); P.forEach(function (p) { for (var i = 0; i < p.n; i += 3) { var j = N.n2(p.xs[i] * 1.9, p.ys[i] * 1.9), X = ox + p.xs[i] * S, Y = oy + p.ys[i] * S, R = S * (r0 + j * 0.05); pth.moveTo(X + R, Y); pth.arc(X, Y, R, 0, Math.PI * 2); } }); c.fillStyle = col; c.fill(pth); }
  // 여러 길이 겹치는 구간은 무늬(포장돌, 차선 점선)를 한 번만 그리도록 '처음 지나는 구간'만 모음
  var seen = {}, runs = [];
  P.forEach(function (p, pi) { var cur = null; for (var i = 0; i < p.n; i++) { var key = Math.round(p.xs[i] * 5) + ',' + Math.round(p.ys[i] * 5), o = seen[key]; if (o == null) seen[key] = pi; else if (o !== pi) { cur = null; continue; } if (!cur) { cur = { p: p, a: i, b: i }; runs.push(cur); } cur.b = i; } });
  function strokeRuns(c, w, col, off, step) { c.strokeStyle = col; c.lineWidth = w; runs.forEach(function (rn) { if (rn.b - rn.a < 4) return; var p = rn.p; c.beginPath(); for (var i = rn.a; i <= rn.b; i += step || 2) { var q = at(p, i, off || 0); if (i > rn.a) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } c.stroke(); }); }
  function eachRun(step, fn) { runs.forEach(function (rn) { for (var i = Math.ceil(rn.a / step) * step; i <= rn.b; i += step) fn(rn.p, i); }); }
  function scatter(n, fn) { var tot = 0; P.forEach(function (p) { tot += p.n; }); for (var q = 0; q < tot * n; q++) { var p = P[Math.floor(rnd() * P.length)], i = Math.floor(rnd() * p.n); fn(at(p, i, (rnd() - 0.5) * 0.8)); } }
  E.mk('r_path'); x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  // 길가 그늘 + 진한 테두리
  x.save(); x.translate(S * 0.02, S * 0.05); if (soft) blobs(x, 0.47, rgba(MQ_INK, 0.5)); else strokeAll(x, S * 0.98, rgba(MQ_INK, 0.4)); x.restore();
  var taxi = road === 'taxiway';
  if (soft) blobs(x, 0.465, D[0]); else { strokeAll(x, S * 0.98, D[0]); if (taxi) strokeAll(x, S * 0.93, '#8c8e86'); }
  // 길 면(따로 그려 덮기: 무늬는 길 안에만)
  E.mk('r_edge');
  // (길이 지나는 범위만 한 작은 그림판을 씀. 길 위쪽 안 그늘은 같은 그림판에서 '어두운 길 → 조금 내려 다시 칠하기'로 만들어 큰 그림판 합성을 줄임)
  var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  P.forEach(function (p) { for (var i = 0; i < p.n; i += 4) { var X = ox + p.xs[i] * S, Y = oy + p.ys[i] * S; if (X < bx0) bx0 = X; if (X > bx1) bx1 = X; if (Y < by0) by0 = Y; if (Y > by1) by1 = Y; } });
  bx0 = Math.max(0, Math.floor(bx0 - S * 0.6)); by0 = Math.max(0, Math.floor(by0 - S * 0.6)); bx1 = Math.min(W, Math.ceil(bx1 + S * 0.6)); by1 = Math.min(H, Math.ceil(by1 + S * 0.6));
  if (bx1 <= bx0 || by1 <= by0) { x.restore(); return; }
  var R = mkC(bx1 - bx0, by1 - by0), r = cx2(R); r.translate(-bx0, -by0); r.lineCap = 'round'; r.lineJoin = 'round';
  function mainShape(c, col) { if (soft) blobs(c, 0.395, col); else strokeAll(c, S * (taxi ? 0.78 : 0.84), col); }
  mainShape(r, D[1]);
  r.globalCompositeOperation = 'source-atop';
  mainShape(r, mixc(D[1], MQ_INK, soft ? 0.5 : 0.42)); r.save(); r.translate(0, S * 0.055); mainShape(r, D[1]); r.restore();
  E.mk('r_main');
  if (road === 'gravel') {
    strokeAll(r, S * 0.42, rgba(D[2], 0.55));
    var gc = [D[2], D[3], D[1], mixc(D[1], D[0], 0.3)];
    scatter(0.75, function (q) { var sz = S * (0.022 + rnd() * 0.03); r.fillStyle = rgba(D[0], 0.5); r.beginPath(); r.ellipse(q[0] + sz * 0.15, q[1] + sz * 0.32, sz, sz * 0.7, 0, 0, Math.PI * 2); r.fill(); r.fillStyle = gc[Math.floor(rnd() * 4)]; r.beginPath(); r.ellipse(q[0], q[1], sz * 0.9, sz * 0.62, 0, 0, Math.PI * 2); r.fill(); });
  } else if (road === 'mud') {
    strokeAll(r, S * 0.4, rgba(D[2], 0.5));
    [-0.19, 0.19].forEach(function (o) { strokeAll(r, S * 0.075, rgba(D[0], 0.42), o); strokeAll(r, S * 0.025, rgba(D[3], 0.3), o + 0.055); });
    scatter(0.012, function (q) { var rw = S * (0.1 + rnd() * 0.08); r.fillStyle = rgba(D[0], 0.7); r.beginPath(); r.ellipse(q[0], q[1] + S * 0.012, rw * 1.1, rw * 0.5, 0, 0, Math.PI * 2); r.fill(); r.fillStyle = '#4a5466'; r.beginPath(); r.ellipse(q[0], q[1], rw, rw * 0.42, 0, 0, Math.PI * 2); r.fill(); r.fillStyle = rgba(T.rim, 0.75); r.beginPath(); r.ellipse(q[0] - rw * 0.3, q[1] - rw * 0.08, rw * 0.36, rw * 0.1, 0, 0, Math.PI * 2); r.fill(); });
    scatter(0.1, function (q) { var sz = S * (0.016 + rnd() * 0.02); r.fillStyle = rgba(D[0], 0.4); r.beginPath(); r.ellipse(q[0] + sz * 0.2, q[1] + sz * 0.3, sz * 1.2, sz * 0.8, 0, 0, Math.PI * 2); r.fill(); r.fillStyle = D[3]; r.beginPath(); r.ellipse(q[0], q[1], sz, sz * 0.7, 0, 0, Math.PI * 2); r.fill(); });
  } else if (road === 'flag' || road === 'cobble') {
    strokeAll(r, S * 0.9, rgba(D[0], 0.62));
    eachRun(5, function (p, i) { var row = i / 5; for (var k = -2; k <= 2; k++) {
      var off = (k + (row % 2 ? 0.5 : 0)) * 0.27; if (Math.abs(off) > 0.5) continue; var q = at(p, i, off), v = rnd();
      r.save(); r.translate(q[0], q[1]); r.rotate(q[2]); r.fillStyle = v < 0.55 ? mixc(D[1], D[2], v * 1.6) : mixc(D[1], D[0], (v - 0.55) * 0.5);
      if (road === 'cobble') { r.beginPath(); r.ellipse(0, 0, S * 0.115, S * 0.12, 0, 0, Math.PI * 2); r.fill(); r.fillStyle = rgba(D[3], 0.4); r.beginPath(); r.ellipse(-S * 0.025, -S * 0.03, S * 0.05, S * 0.04, 0, 0, Math.PI * 2); r.fill(); }
      else { r.fillRect(-S * 0.112, -S * 0.122, S * 0.224, S * 0.244); r.fillStyle = rgba(D[3], 0.28); r.fillRect(-S * 0.112, -S * 0.122, S * 0.224, Math.max(1, S * 0.025)); }
      r.restore(); } });
    strokeAll(r, S * 0.34, rgba(D[3], 0.12));
    if (road === 'flag') scatter(0.01, function (q) { r.globalAlpha = 0.22; r.drawImage(softSpr('#3ab0b0', 32), q[0] - S * 0.4, q[1] - S * 0.2, S * 0.8, S * 0.4); r.globalAlpha = 1; });
  } else if (road === 'asphalt' || road === 'taxiway') {
    scatter(1.2, function (q) { r.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.14)'; var sz = Math.max(1, S * 0.03); r.fillRect(q[0], q[1], sz, sz); });
    scatter(0.006, function (q) { r.save(); r.translate(q[0], q[1]); r.rotate(q[2]); r.fillStyle = 'rgba(0,0,0,0.16)'; r.fillRect(-S * 0.3, -S * 0.12, S * 0.6, S * 0.24); r.restore(); });
    if (road === 'asphalt') {
      [-0.36, 0.36].forEach(function (o) { strokeAll(r, Math.max(1.2, S * 0.034), 'rgba(226,226,216,0.72)', o); });
      r.setLineDash([S * 0.26, S * 0.24]); r.lineCap = 'butt'; strokeRuns(r, Math.max(1.5, S * 0.05), 'rgba(236,170,58,0.95)', 0, 2); r.setLineDash([]); r.lineCap = 'round';
      scatter(0.004, function (q) { r.save(); r.translate(q[0], q[1]); r.rotate(q[2] + (rnd() - 0.5) * 0.3); r.fillStyle = 'rgba(0,0,0,0.22)'; r.fillRect(-S * 0.4, -S * 0.02, S * 0.8, S * 0.035); r.fillRect(-S * 0.4, S * 0.1, S * 0.8, S * 0.035); r.restore(); });
    } else {
      strokeAll(r, Math.max(1.6, S * 0.055), 'rgba(244,188,44,0.95)', 0);
      [-0.33, 0.33].forEach(function (o) { r.setLineDash([S * 0.12, S * 0.1]); r.lineCap = 'butt'; strokeRuns(r, Math.max(1.2, S * 0.03), 'rgba(236,236,226,0.7)', o, 2); r.setLineDash([]); r.lineCap = 'round'; });
    }
    scatter(0.01, function (q) { var a = rnd() * 6.28; r.strokeStyle = 'rgba(0,0,0,0.4)'; r.lineWidth = Math.max(0.8, S * 0.014); r.beginPath(); r.moveTo(q[0], q[1]); for (var t = 0; t < 3; t++) { a += (rnd() - 0.5) * 1.4; q[0] += Math.cos(a) * S * 0.12; q[1] += Math.sin(a) * S * 0.12; r.lineTo(q[0], q[1]); } r.stroke(); });
  } else if (road === 'packed') {
    strokeAll(r, S * 0.36, rgba(D[2], 0.5));
    [-0.2, 0.2].forEach(function (o) { strokeAll(r, S * 0.11, rgba(D[0], 0.3), o); r.setLineDash([S * 0.04, S * 0.06]); r.lineCap = 'butt'; strokeRuns(r, S * 0.11, rgba(D[0], 0.3), o, 3); r.setLineDash([]); r.lineCap = 'round'; });
    [-0.4, 0.4].forEach(function (o) { strokeAll(r, S * 0.05, rgba(D[3], 0.3), o); });
    scatter(0.12, function (q) { var sz = S * (0.014 + rnd() * 0.02); r.fillStyle = rgba(D[0], 0.4); r.beginPath(); r.ellipse(q[0] + sz * 0.2, q[1] + sz * 0.3, sz * 1.2, sz * 0.8, 0, 0, Math.PI * 2); r.fill(); r.fillStyle = D[3]; r.beginPath(); r.ellipse(q[0], q[1], sz, sz * 0.7, 0, 0, Math.PI * 2); r.fill(); });
  } else { // concrete
    eachRun(10, function (p, i) { var a = at(p, i, -0.45), b = at(p, i, 0.45); r.strokeStyle = rgba(D[0], 0.4); r.lineWidth = Math.max(1, S * 0.022); r.beginPath(); r.moveTo(a[0], a[1]); r.lineTo(b[0], b[1]); r.stroke(); });
    strokeAll(r, Math.max(1, S * 0.02), rgba(D[0], 0.3), 0);
    scatter(0.01, function (q) { r.globalAlpha = 0.14; r.drawImage(softSpr(rnd() < 0.5 ? '#8a4a24' : '#262c32', 32), q[0] - S * 0.3, q[1] - S * 0.2, S * 0.6, S * 0.4); r.globalAlpha = 1; });
    [-0.37, 0.37].forEach(function (o) { strokeAll(r, Math.max(1.5, S * 0.05), 'rgba(34,36,42,0.75)', o); r.setLineDash([S * 0.1, S * 0.1]); r.lineCap = 'butt'; strokeRuns(r, Math.max(1.5, S * 0.05), 'rgba(236,150,42,0.95)', o, 2); r.setLineDash([]); r.lineCap = 'round'; });
  }
  E.mk('r_detail');
  x.drawImage(R, bx0, by0);
  if (taxi) eachRun(20, function (p, i) { [-0.43, 0.43].forEach(function (o) { var q = at(p, i + 10, o); x.fillStyle = 'rgba(90,180,255,0.32)'; x.beginPath(); x.arc(q[0], q[1], S * 0.085, 0, Math.PI * 2); x.fill(); x.fillStyle = '#16181c'; x.beginPath(); x.arc(q[0], q[1], Math.max(1.6, S * 0.042), 0, Math.PI * 2); x.fill(); x.fillStyle = '#9adcff'; x.beginPath(); x.arc(q[0], q[1], Math.max(1.1, S * 0.028), 0, Math.PI * 2); x.fill(); }); });
  // 다리(물, 용암 위): 2장 검은 널빤지, 3장 강철 판
  var pc = T.ch === 2 ? '#6a5244' : '#7c8086';
  g.paths.forEach(function (p) {
    for (var i = 0; i < p.n; i += 3) {
      var cc = Math.floor(p.xs[i]), rr = Math.floor(p.ys[i]); if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) continue;
      var lq = function (c2, r2) { return c2 >= 0 && r2 >= 0 && c2 < COLS && r2 < ROWS && THEME_LIQ(g, c2, r2); };
      if (!((lq(cc - 1, rr) && lq(cc + 1, rr)) || (lq(cc, rr - 1) && lq(cc, rr + 1)))) continue;
      var q = at(p, i, 0), pw = S * 0.12, ph = S * 0.92;
      x.save(); x.translate(q[0], q[1]); x.rotate(q[2]); x.fillStyle = rgba(MQ_INK, 0.4); x.fillRect(-pw / 2 + S * 0.03, -ph / 2 + S * 0.05, pw, ph);
      var pl = mqR(-pw / 2 + S * 0.008, -ph / 2, pw - S * 0.016, ph); litFill(x, pl, mixc(pc, '#000000', rnd() * 0.14), { hi: 0.25, lo: 0.3 }); mqInk(x, pl, pc, Math.max(1, S * 0.02));
      if (T.ch === 3) { x.fillStyle = '#e8962a'; x.fillRect(-pw / 2 + S * 0.008, -ph / 2, pw - S * 0.016, S * 0.06); x.fillRect(-pw / 2 + S * 0.008, ph / 2 - S * 0.06, pw - S * 0.016, S * 0.06); }
      x.restore();
    }
  });
  x.restore();
}
// 가장자리 장식(격자 밖): 테마 소품, 성 지하는 돌벽
function mqMargin(E) {
  var x = E.x, g = E.g, T = E.T, th = E.th, rnd = E.rnd, N = E.N, S = E.S, props = [], big = 0, px, py;
  if (T.wall) { // 격자 바로 밖 한 칸: 벽돌 벽
    var bw = S * 0.5, bh = S * 0.34, col = drk(T.rock, 0.38);
    for (py = Math.floor(E.wy0 * 3) - 1; py < E.wy1 * 3 + 1; py++) for (px = Math.floor(E.wx0 * 2) - 2; px < E.wx1 * 2 + 2; px++) {
      var wx = (px + (py & 1 ? 0.5 : 0)) * 0.5, wy = py / 3; if (wx + 0.5 > 0 && wx < COLS && wy + 0.34 > 0 && wy < ROWS) continue;
      x.fillStyle = mixc(col, rnd() < 0.5 ? '#000000' : T.rock, rnd() * 0.22); x.fillRect(E.X(wx), E.Y(wy), bw, bh); x.fillStyle = rgba(T.rim, 0.12); x.fillRect(E.X(wx), E.Y(wy), bw, Math.max(1, S * 0.025)); x.strokeStyle = rgba('#05040c', 0.8); x.lineWidth = Math.max(1, S * 0.03); x.strokeRect(E.X(wx), E.Y(wy), bw, bh);
    }
    x.fillStyle = rgba('#05040c', 0.45); x.fillRect(E.X(0), E.Y(0), COLS * S, S * 0.12); x.fillRect(E.X(0), E.Y(0), S * 0.08, ROWS * S); // 벽 그림자
    [[0, 0, 1], [COLS, 0, -1], [0, ROWS, 1]].forEach(function (cn) { // 모서리 거미줄
      var wx0 = E.X(cn[0]), wy0 = E.Y(cn[1]), sy = cn[1] ? -1 : 1, R = S * 1.25; x.save(); x.strokeStyle = 'rgba(214,224,250,0.5)'; x.lineWidth = Math.max(0.8, S * 0.016);
      for (var a = 0; a <= 4; a++) { var an = a * Math.PI / 8; x.beginPath(); x.moveTo(wx0, wy0); x.lineTo(wx0 + cn[2] * Math.cos(an) * R, wy0 + sy * Math.sin(an) * R); x.stroke(); }
      for (var q = 1; q <= 4; q++) { x.beginPath(); for (var a2 = 0; a2 <= 4; a2++) { var an2 = a2 * Math.PI / 8, rr2 = R * q / 4.4, px2 = wx0 + cn[2] * Math.cos(an2) * rr2, py2 = wy0 + sy * Math.sin(an2) * rr2; if (a2) x.quadraticCurveTo(wx0 + cn[2] * Math.cos(an2 - Math.PI / 16) * rr2 * 0.86, wy0 + sy * Math.sin(an2 - Math.PI / 16) * rr2 * 0.86, px2, py2); else x.moveTo(px2, py2); } x.stroke(); }
      x.restore(); });
  }
  for (py = Math.floor(E.wy0) - 1; py < Math.ceil(E.wy1) + 1; py++) for (px = Math.floor(E.wx0) - 1; px < Math.ceil(E.wx1) + 1; px++) {
    if (px >= 0 && py >= 0 && px < COLS && py < ROWS) continue;
    var nearRoad = false; g.paths.forEach(function (pp) { for (var s3 = 0; s3 < pp.n; s3 += 6) if (Math.abs(pp.xs[s3] - (px + 0.5)) < 1.2 && Math.abs(pp.ys[s3] - (py + 0.5)) < 1.2) { nearRoad = true; break; } });
    if (nearRoad) continue;
    var cc = clamp(px, 0, COLS - 1), rr = clamp(py, 0, ROWS - 1), kk = g.kind[rr * COLS + cc], dist = Math.max(Math.abs(px - cc), Math.abs(py - rr));
    if ((kk === 'water' || kk === 'lava') && dist <= 2) { if (T.quay && kk === 'water' && rnd() < 0.22) mqBuoy(x, E.X(px + 0.5), E.Y(py + 0.6), S); continue; }
    if (rnd() > 0.6 + N.n2(px * 0.7, py * 0.7) * 0.5) continue;
    var k = T.props[Math.floor(rnd() * T.props.length)];
    if (k === 'qcrane' || k === 'qhangar') { if (big >= 3 || dist < 1) k = T.props[0] === k ? T.props[1] : T.props[0]; else big++; }
    props.push({ k: k, x: px + 0.2 + rnd() * 0.6, y: py + 0.4 + rnd() * 0.5, seed: Math.floor(rnd() * 6) });
  }
  props.sort(function (a, b) { return a.y - b.y; });
  props.forEach(function (pr) { drawSpr(x, propSpr(pr.k, th, S, pr.seed), E.X(pr.x), E.Y(pr.y)); var L = MQ_LIT[pr.k]; if (L && E.lights.length < 28) E.lights.push({ x: pr.x + L[3], y: pr.y - 0.1, c: L[0], r: L[1], a: L[2] }); });
}
// 색 보정과 분위기: 2장 달빛, 등불 웅덩이, 어두운 가장자리 / 3장 흐린 군사색, 나트륨등과 네온 번짐, 열기, 바다 안개
function mqGrade(E) {
  var x = E.x, T = E.T, th = E.th, W = E.W, H = E.H, S = E.S, g;
  x.save();
  x.globalCompositeOperation = 'lighter';
  E.lights.forEach(function (l) { x.save(); x.translate(E.X(l.x), E.Y(l.y)); x.scale(1, 0.7); glowAt(x, 0, 0, l.r * S, l.c, l.a); x.restore(); });
  if (th === 'graveyard' || th === 'pumpkin' || th === 'manor') glowAt(x, W * 0.1, H * 0.04, Math.max(W, H) * 0.75, th === 'graveyard' ? '#7e9ce0' : th === 'manor' ? '#8a84c8' : '#8a8ac0', th === 'graveyard' ? 0.26 : 0.16);
  if (th === 'crypt') glowAt(x, W * 0.5, H * 0.45, Math.max(W, H) * 0.6, '#3a6a8a', 0.14);
  if (th === 'city') { glowAt(x, 0, H * 0.3, W * 0.5, '#ff8a2a', 0.2); glowAt(x, W, H * 0.62, W * 0.5, '#2ac0d8', 0.16); glowAt(x, W * 0.2, H, W * 0.5, '#ff5a7a', 0.1); }
  if (th === 'desert') { g = x.createLinearGradient(0, 0, 0, H * 0.5); g.addColorStop(0, 'rgba(255,214,150,0.22)'); g.addColorStop(1, 'rgba(255,214,150,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H * 0.5); }
  x.globalCompositeOperation = 'soft-light';
  g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, rgba(T.light, T.ch === 2 ? 0.6 : 0.5)); g.addColorStop(0.5, 'rgba(128,128,128,0)'); g.addColorStop(1, rgba(T.shade, T.ch === 2 ? 0.65 : 0.45)); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  if (th === 'harbor' || th === 'airfield') { g = x.createLinearGradient(0, 0, 0, H * 0.4); g.addColorStop(0, th === 'harbor' ? 'rgba(200,216,232,0.3)' : 'rgba(232,236,224,0.16)'); g.addColorStop(1, 'rgba(200,216,232,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H * 0.4); }
  if (th === 'desert') { x.globalAlpha = 0.045; for (var i = 0; i < 7; i++) x.drawImage(softSpr('#fff4d8', 64), -W * 0.2, H * (0.1 + i * 0.13), W * 1.4, S * 0.5); x.globalAlpha = 1; }
  // 격자 밖 덮개(전장에 시선이 가게)
  var gx0 = E.ox, gy0 = E.oy, gx1 = E.ox + COLS * S, gy1 = E.oy + ROWS * S;
  x.fillStyle = rgba(T.veil, T.veilA);
  x.fillRect(0, 0, W, Math.max(0, gy0)); x.fillRect(0, gy1, W, Math.max(0, H - gy1)); x.fillRect(0, gy0, Math.max(0, gx0), gy1 - gy0); x.fillRect(gx1, gy0, Math.max(0, W - gx1), gy1 - gy0);
  if (T.ch === 2) { g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75); g.addColorStop(0, 'rgba(6,4,16,0)'); g.addColorStop(1, 'rgba(6,4,16,0.5)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  x.restore();
}

// ---------- 성문 (철옹성 수비 거점) ----------
// render.js drawGate가 문 옆 0.36칸, 높이 0.62칸 자리에 불빛을 덧그리므로 횃불과 경광등을 그 자리에 둔다
var MQ_GATE = {
  graveyard: { stone: '#7c849c', roof: '#34405c', flag: '#a8c4ff' }, manor: { stone: '#8c7c8a', roof: '#4c3048', flag: '#ffb85a' }, pumpkin: { stone: '#86796a', roof: '#5c3a24', flag: '#ff8a2a' }, crypt: { stone: '#64647e', roof: '#2c2c46', flag: '#5ad0ff' },
  city: { stone: '#8e9092', flag: '#ff8a2a' }, desert: { stone: '#b09a74', flag: '#e8742a', camo: '#8a7450' }, harbor: { stone: '#7e8890', flag: '#ff8a2a' }, airfield: { stone: '#7e866a', flag: '#ffb02a', camo: '#5c6648' }
};
function mqGate(S, th) {
  var key = 'mqgate:' + th + ':' + Math.round(S); if (PROP_CACHE[key]) return PROP_CACHE[key];
  var T = THEME[th], o = mqCv(S, 2.6, 2.8, 0.87), x = o.x, gx = o.gx, gy = o.gy, sz = S, G = MQ_GATE[th], rnd = rngOf(77), st = G.stone, i;
  softShadow(x, gx + sz * 0.12, gy + sz * 0.03, sz * 1.15, sz * 0.3, 0.6);
  if (T.ch === 2) {
    // 양쪽 망루(뒤)
    [-1, 1].forEach(function (sd) {
      var tx = gx + sd * sz * 0.68, b = mqBox(x, tx, gy, sz * 0.4, sz * 1.18, sz * 0.08, drk(st, 0.04), 0.2);
      x.save(); x.clip(b.fr.p); x.fillStyle = rgba(MQ_INK, 0.26); for (var r = 1; r < 8; r++) x.fillRect(b.x0, b.y0 + r * sz * 0.15, sz * 0.4, Math.max(1, sz * 0.014)); for (var q = 0; q < 8; q++) x.fillRect(b.x0 + sz * (0.1 + (q % 2) * 0.1 + (q % 3) * 0.06), b.y0 + q * sz * 0.15, Math.max(1, sz * 0.014), sz * 0.15); x.restore();
      var w = shp().rrect(tx - sz * 0.05, gy - sz * 0.86, sz * 0.1, sz * 0.2, sz * 0.05); x.fillStyle = '#16121e'; x.fill(w.p); mqGlow(x, tx, gy - sz * 0.76, sz * 0.2, '#ffb040', 0.6); x.fillStyle = '#ffc860'; x.fillRect(tx - sz * 0.022, gy - sz * 0.82, sz * 0.044, sz * 0.13); mqInk(x, w, st);
      var rf = shp().poly([[tx - sz * 0.27, gy - sz * 1.24], [tx, gy - sz * 1.86], [tx + sz * 0.27, gy - sz * 1.24]]); mqSolid(x, rf, G.roof, 0.25, 0.4);
      x.fillStyle = rgba(lit(G.roof, 0.5), 0.5); x.beginPath(); x.moveTo(tx - sz * 0.2, gy - sz * 1.26); x.lineTo(tx - sz * 0.02, gy - sz * 1.74); x.lineTo(tx - sz * 0.08, gy - sz * 1.26); x.fill();
      mqLine(x, [[tx, gy - sz * 1.86], [tx, gy - sz * 2.04]], Math.max(1.2, sz * 0.03), '#3a3d52');
      var fl = shp().poly([[tx, gy - sz * 2.04], [tx + sd * sz * 0.24, gy - sz * 1.97], [tx + sd * sz * 0.14, gy - sz * 1.92], [tx + sd * sz * 0.22, gy - sz * 1.86], [tx, gy - sz * 1.9]]); mqSolid(x, fl, G.flag, 0.3, 0.3);
    });
    // 가운데 문루
    var wb = mqBox(x, gx, gy, sz * 1.1, sz * 0.96, sz * 0.1, st, 0.22);
    x.save(); x.clip(wb.fr.p); x.fillStyle = rgba(MQ_INK, 0.24); for (i = 1; i < 7; i++) x.fillRect(wb.x0, wb.y0 + i * sz * 0.14, sz * 1.1, Math.max(1, sz * 0.014)); for (i = 0; i < 22; i++) x.fillRect(wb.x0 + rnd() * sz * 1.1, wb.y0 + Math.floor(rnd() * 7) * sz * 0.14, Math.max(1, sz * 0.014), sz * 0.14);
    x.fillStyle = rgba(T.moss, 0.5); x.beginPath(); x.ellipse(wb.x0 + sz * 0.1, gy, sz * 0.26, sz * 0.14, 0, 0, Math.PI * 2); x.fill(); x.restore();
    for (i = 0; i < 5; i++) mqBox(x, gx - sz * 0.44 + i * sz * 0.22, gy - sz * 1.0, sz * 0.14, sz * 0.13, sz * 0.05, lit(st, 0.06), 0.3);
    // 뾰족 아치 + 쇠창살
    var ar = shp(), p = ar.p; p.moveTo(gx - sz * 0.3, gy); p.lineTo(gx - sz * 0.3, gy - sz * 0.42); p.quadraticCurveTo(gx - sz * 0.28, gy - sz * 0.68, gx, gy - sz * 0.8); p.quadraticCurveTo(gx + sz * 0.28, gy - sz * 0.68, gx + sz * 0.3, gy - sz * 0.42); p.lineTo(gx + sz * 0.3, gy); p.closePath(); ar.ext(gx - sz * 0.3, gy - sz * 0.8); ar.ext(gx + sz * 0.3, gy);
    x.save(); x.lineWidth = sz * 0.1; x.strokeStyle = lit(st, 0.2); x.lineJoin = 'round'; x.stroke(ar.p); x.lineWidth = sz * 0.1 + MQ_W * 2; x.globalCompositeOperation = 'destination-over'; x.restore();
    x.fillStyle = '#0b0916'; x.fill(ar.p);
    x.save(); x.clip(ar.p); mqGlow(x, gx, gy - sz * 0.2, sz * 0.5, G.flag, 0.22);
    var iron = '#5a5e7a'; x.lineCap = 'butt';
    for (i = -2; i <= 2; i++) { x.strokeStyle = MQ_INK; x.lineWidth = Math.max(2, sz * 0.055) + MQ_W; x.beginPath(); x.moveTo(gx + i * sz * 0.11, gy - sz * 0.82); x.lineTo(gx + i * sz * 0.11, gy - sz * 0.03); x.stroke(); x.strokeStyle = iron; x.lineWidth = Math.max(2, sz * 0.055); x.stroke(); x.strokeStyle = 'rgba(190,200,240,0.6)'; x.lineWidth = Math.max(0.8, sz * 0.014); x.beginPath(); x.moveTo(gx + i * sz * 0.11 - sz * 0.014, gy - sz * 0.82); x.lineTo(gx + i * sz * 0.11 - sz * 0.014, gy - sz * 0.05); x.stroke(); }
    [0.16, 0.38, 0.6].forEach(function (u) { x.strokeStyle = MQ_INK; x.lineWidth = Math.max(2, sz * 0.05) + MQ_W; x.beginPath(); x.moveTo(gx - sz * 0.3, gy - sz * u); x.lineTo(gx + sz * 0.3, gy - sz * u); x.stroke(); x.strokeStyle = iron; x.lineWidth = Math.max(2, sz * 0.05); x.stroke(); });
    x.restore(); mqInk(x, ar, st, MQ_W * 1.2);
    var ks = shp().poly([[gx - sz * 0.07, gy - sz * 0.9], [gx + sz * 0.07, gy - sz * 0.9], [gx + sz * 0.05, gy - sz * 0.76], [gx - sz * 0.05, gy - sz * 0.76]]); mqSolid(x, ks, lit(st, 0.25), 0.3, 0.3);
    // 횃불(문 양옆)
    [-1, 1].forEach(function (sd) { var lx = gx + sd * sz * 0.36 + sd * sz * 0.06, ly = gy - sz * 0.56; mqLine(x, [[lx + sd * sz * 0.04, ly + sz * 0.12], [lx, ly]], Math.max(1.4, sz * 0.045), '#3a3d52'); var cu = shp().poly([[lx - sz * 0.055, ly - sz * 0.04], [lx + sz * 0.055, ly - sz * 0.04], [lx + sz * 0.035, ly + sz * 0.04], [lx - sz * 0.035, ly + sz * 0.04]]); mqSolid(x, cu, '#50526c', 0.3, 0.3); mqFlame(x, lx, ly - sz * 0.05, sz * 0.06, '#ff9a30', '#fff0b0'); });
    if (th === 'pumpkin') { mqPumpkin(x, gx - sz * 0.92, gy + sz * 0.04, sz * 0.14, 1); mqPumpkin(x, gx + sz * 0.94, gy + sz * 0.05, sz * 0.12, 0); }
    if (th === 'crypt') { x.strokeStyle = '#8a8ea8'; x.lineWidth = Math.max(1, sz * 0.022); x.setLineDash([sz * 0.04, sz * 0.03]); [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(gx + sd * sz * 0.5, gy - sz * 0.96); x.quadraticCurveTo(gx + sd * sz * 0.56, gy - sz * 0.5, gx + sd * sz * 0.48, gy - sz * 0.3); x.stroke(); }); x.setLineDash([]); }
    if (th === 'manor') { [[-0.76, -0.3, 0.1], [-0.68, -0.5, 0.08], [-0.8, -0.12, 0.09], [0.74, -0.16, 0.09], [0.82, -0.36, 0.07]].forEach(function (d) { x.fillStyle = mqInkC(T.tree[1]); x.beginPath(); x.arc(gx + d[0] * sz, gy + d[1] * sz, d[2] * sz + MQ_W * 0.6, 0, Math.PI * 2); x.fill(); x.fillStyle = T.tree[1]; x.beginPath(); x.arc(gx + d[0] * sz, gy + d[1] * sz, d[2] * sz, 0, Math.PI * 2); x.fill(); x.fillStyle = T.tree[2]; x.beginPath(); x.arc(gx + d[0] * sz - d[2] * sz * 0.2, gy + d[1] * sz - d[2] * sz * 0.2, d[2] * sz * 0.55, 0, Math.PI * 2); x.fill(); }); }
  } else {
    // 강화 콘크리트 벙커: 비탈진 옆면, 두꺼운 지붕 판, 강철 방폭문, 경광등
    var top = shp().poly([[gx - sz * 0.92, gy - sz * 0.8], [gx - sz * 0.8, gy - sz * 1.02], [gx + sz * 0.8, gy - sz * 1.02], [gx + sz * 0.92, gy - sz * 0.8]]); x.fillStyle = lit(st, 0.36); x.fill(top.p); mqInk(x, top, st);
    var bd = shp().poly([[gx - sz * 1.08, gy], [gx - sz * 0.92, gy - sz * 0.8], [gx + sz * 0.92, gy - sz * 0.8], [gx + sz * 1.08, gy]]); litFill(x, bd, st, { hi: 0.1, lo: 0.42, ax: 0, ay: 0, bx: 0.2, by: 1 });
    x.save(); x.clip(bd.p);
    if (G.camo) { x.fillStyle = rgba(G.camo, 0.6); for (i = 0; i < 7; i++) { x.beginPath(); x.ellipse(gx + (rnd() - 0.5) * sz * 2, gy - rnd() * sz * 0.8, sz * (0.16 + rnd() * 0.14), sz * (0.08 + rnd() * 0.06), rnd() * 3, 0, Math.PI * 2); x.fill(); } }
    x.fillStyle = rgba(MQ_INK, 0.2); [0.27, 0.54].forEach(function (u) { x.fillRect(gx - sz * 1.1, gy - sz * u, sz * 2.2, Math.max(1, sz * 0.016)); });
    x.fillStyle = rgba(MQ_INK, 0.28); x.fillRect(gx + sz * 0.8, gy - sz * 0.8, sz * 0.3, sz * 0.8);
    x.fillStyle = rgba('#3a2a1c', 0.3); [-0.7, 0.62].forEach(function (u) { x.fillRect(gx + u * sz, gy - sz * 0.8, sz * 0.05, sz * 0.5); });
    x.restore(); mqInk(x, bd, st);
    x.fillStyle = rgba(lit(st, 0.7), 0.7); x.fillRect(gx - sz * 0.92, gy - sz * 0.8 - MQ_W * 0.35, sz * 1.84, MQ_W * 0.7);
    // 총안구
    [-1, 1].forEach(function (sd) { var e = shp().rrect(gx + sd * sz * 0.66 - sz * 0.15, gy - sz * 0.52, sz * 0.3, sz * 0.09, sz * 0.03); x.fillStyle = '#0e1014'; x.fill(e.p); mqInk(x, e, st); x.fillStyle = rgba(lit(st, 0.5), 0.6); x.fillRect(gx + sd * sz * 0.66 - sz * 0.17, gy - sz * 0.42, sz * 0.34, Math.max(1, sz * 0.02)); });
    // 문틀(경고 줄무늬) + 방폭문
    mqHazard(x, gx - sz * 0.36, gy - sz * 0.6, sz * 0.72, sz * 0.6, 9, '#e8862a', '#1e2024'); var fr = mqR(gx - sz * 0.36, gy - sz * 0.6, sz * 0.72, sz * 0.6); mqInk(x, fr, '#e8862a');
    var dr = mqR(gx - sz * 0.28, gy - sz * 0.52, sz * 0.56, sz * 0.52); litFill(x, dr, '#59616c', { hi: 0.25, lo: 0.4 });
    x.save(); x.clip(dr.p); x.fillStyle = rgba(MQ_INK, 0.4); for (i = 1; i < 5; i++) x.fillRect(gx - sz * 0.28, gy - sz * 0.52 + i * sz * 0.104, sz * 0.56, Math.max(1, sz * 0.02)); x.fillStyle = rgba('#ffffff', 0.16); for (i = 0; i < 5; i++) x.fillRect(gx - sz * 0.28, gy - sz * 0.52 + i * sz * 0.104 + Math.max(1, sz * 0.02), sz * 0.56, Math.max(1, sz * 0.014)); x.fillStyle = MQ_INK; x.fillRect(gx - Math.max(1, sz * 0.012), gy - sz * 0.52, Math.max(2, sz * 0.024), sz * 0.52); x.restore(); mqInk(x, dr, '#59616c');
    [-1, 1].forEach(function (sd) { var hn = shp().rrect(gx + sd * sz * 0.07 - sz * 0.025, gy - sz * 0.32, sz * 0.05, sz * 0.14, sz * 0.02); mqSolid(x, hn, '#c8ccd0', 0.4, 0.4); });
    // 문 위 차양 + 경광등
    mqBox(x, gx, gy - sz * 0.6, sz * 0.92, sz * 0.09, sz * 0.09, lit(st, 0.08), 0.3);
    [-1, 1].forEach(function (sd) { var lx = gx + sd * sz * 0.36, ly = gy - sz * 0.62; mqGlow(x, lx, ly - sz * 0.03, sz * 0.26, '#ff8a2a', 0.7); var bs = mqR(lx - sz * 0.06, ly + sz * 0.01, sz * 0.12, sz * 0.045); mqSolid(x, bs, '#3a3e46', 0.2, 0.3); var lp = shp(); lp.p.moveTo(lx - sz * 0.05, ly + sz * 0.01); lp.p.arc(lx, ly + sz * 0.01, sz * 0.05, Math.PI, 0); lp.p.closePath(); lp.ext(lx - sz * 0.05, ly - sz * 0.04); lp.ext(lx + sz * 0.05, ly + sz * 0.01); x.fillStyle = '#ffa23a'; x.fill(lp.p); mqInk(x, lp, '#ff8a2a', MQ_W * 0.8); x.fillStyle = '#fff0c8'; x.beginPath(); x.arc(lx - sz * 0.015, ly - sz * 0.012, sz * 0.018, 0, Math.PI * 2); x.fill(); });
    // 지붕 위: 모래주머니, 안테나, 깃발
    for (i = 0; i < 4; i++) { var bx = gx - sz * 0.74 + i * sz * 0.17, b2 = shp().rrect(bx, gy - sz * 1.1, sz * 0.16, sz * 0.09, sz * 0.04); litFill(x, b2, i % 2 ? '#a8946a' : '#9a865e', { hi: 0.3, lo: 0.4 }); mqInk(x, b2, '#a8946a'); }
    for (i = 0; i < 3; i++) { var b3 = shp().rrect(gx - sz * 0.66 + i * sz * 0.17, gy - sz * 1.18, sz * 0.16, sz * 0.09, sz * 0.04); litFill(x, b3, i % 2 ? '#9a865e' : '#a8946a', { hi: 0.3, lo: 0.4 }); mqInk(x, b3, '#a8946a'); }
    mqLine(x, [[gx + sz * 0.5, gy - sz * 1.0], [gx + sz * 0.5, gy - sz * 1.66]], Math.max(1.3, sz * 0.035), '#4a4e56');
    mqLine(x, [[gx + sz * 0.42, gy - sz * 1.46], [gx + sz * 0.58, gy - sz * 1.46]], Math.max(1, sz * 0.025), '#4a4e56', 1); mqLine(x, [[gx + sz * 0.45, gy - sz * 1.56], [gx + sz * 0.55, gy - sz * 1.56]], Math.max(1, sz * 0.025), '#4a4e56', 1);
    mqGlow(x, gx + sz * 0.5, gy - sz * 1.69, sz * 0.2, '#ff6a2a', 0.8); x.fillStyle = '#ff9a4a'; x.beginPath(); x.arc(gx + sz * 0.5, gy - sz * 1.69, sz * 0.035, 0, Math.PI * 2); x.fill();
    mqLine(x, [[gx + sz * 0.16, gy - sz * 1.0], [gx + sz * 0.16, gy - sz * 1.5]], Math.max(1.2, sz * 0.03), '#d8d8d0');
    var fl2 = shp().poly([[gx + sz * 0.16, gy - sz * 1.5], [gx - sz * 0.14, gy - sz * 1.44], [gx - sz * 0.1, gy - sz * 1.36], [gx - sz * 0.16, gy - sz * 1.28], [gx + sz * 0.16, gy - sz * 1.3]]); mqSolid(x, fl2, G.flag, 0.3, 0.3);
    // 옆 모래주머니
    [-1, 1].forEach(function (sd) { for (var q = 0; q < 3; q++) { var sb = shp().rrect(gx + sd * sz * 1.02 - sz * 0.1 + (q === 2 ? 0 : (q ? 0.09 : -0.09) * sz), gy - sz * 0.1 - (q === 2 ? sz * 0.09 : 0), sz * 0.2, sz * 0.11, sz * 0.05); litFill(x, sb, q % 2 ? '#9a865e' : '#a8946a', { hi: 0.3, lo: 0.4 }); mqInk(x, sb, '#a8946a'); } });
  }
  return (PROP_CACHE[key] = trimSpr(spr(o.c, gx, gy)));
}

// ---------- 날씨, 주변 입자 ----------
// mist 낮은 안개와 도깨비불빛 / leaves2 낙엽 / bats 박쥐 그림자와 불티 / cryptdust 푸른 먼지 / rain 비 / sandwind 모래바람 / gulls 갈매기와 그림자 / wind 마른 바람
var MQ_AMB = { k: '', S: 0, cols: 0, rows: 0, ps: [], img: {} };
var MQ_AMBN = { mist: 12, leaves2: 22, bats: 16, cryptdust: 22, rain: 40, sandwind: 22, gulls: 3, wind: 14 };
function mqAmbImg(kind, col, d) {
  var key = kind + col + Math.round(d), c = MQ_AMB.img[key]; if (c) return c;
  d = Math.max(4, Math.round(d)); c = mkC(d, d); var x = cx2(c), m = d / 2;
  if (kind === 'leaf') { x.fillStyle = col; x.beginPath(); x.moveTo(m - d * 0.42, m); x.quadraticCurveTo(m, m - d * 0.34, m + d * 0.42, m); x.quadraticCurveTo(m, m + d * 0.34, m - d * 0.42, m); x.fill(); x.strokeStyle = 'rgba(40,16,8,0.6)'; x.lineWidth = Math.max(0.7, d * 0.05); x.beginPath(); x.moveTo(m - d * 0.4, m); x.lineTo(m + d * 0.4, m); x.stroke(); }
  else if (kind === 'bat0' || kind === 'bat1') { var up = kind === 'bat0' ? -1 : 0.5; x.fillStyle = col; x.beginPath(); x.ellipse(m, m, d * 0.07, d * 0.12, 0, 0, Math.PI * 2); x.fill(); [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(m, m - d * 0.06); x.quadraticCurveTo(m + sd * d * 0.24, m - d * 0.2 + up * d * 0.12, m + sd * d * 0.46, m + up * d * 0.14); x.quadraticCurveTo(m + sd * d * 0.36, m + up * d * 0.1 + d * 0.02, m + sd * d * 0.3, m + d * 0.1 + up * d * 0.05); x.quadraticCurveTo(m + sd * d * 0.22, m + d * 0.02, m + sd * d * 0.14, m + d * 0.1); x.quadraticCurveTo(m + sd * d * 0.08, m + d * 0.03, m, m + d * 0.08); x.fill(); }); }
  else if (kind === 'gull0' || kind === 'gull1') { var k = kind === 'gull0' ? 1 : 0.72; x.fillStyle = col; x.beginPath(); x.ellipse(m, m, d * 0.2, d * 0.055, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(m + d * 0.2, m, d * 0.05, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(m - d * 0.16, m); x.lineTo(m - d * 0.3, m - d * 0.06); x.lineTo(m - d * 0.3, m + d * 0.06); x.fill(); [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(m + d * 0.12, m); x.lineTo(m + d * 0.02, m + sd * d * 0.24 * k); x.lineTo(m - d * 0.2, m + sd * d * 0.46 * k); x.lineTo(m - d * 0.08, m + sd * d * 0.2 * k); x.lineTo(m - d * 0.06, m); x.fill(); }); }
  else { var sw = Math.max(4, Math.round(d * 0.3)); c.width = sw; x = cx2(c); var g = x.createLinearGradient(sw * 0.85, 0, sw * 0.15, d); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, 0.9)); g.addColorStop(1, rgba(col, 0)); x.strokeStyle = g; x.lineWidth = Math.max(1, d * 0.045); x.beginPath(); x.moveTo(sw * 0.85, 0); x.lineTo(sw * 0.15, d); x.stroke(); }
  return (MQ_AMB.img[key] = c);
}
function mqAmbient(x, view, T, time, dt) {
  var k = T.amb, S = view.S, A = MQ_AMB, i, p, n = MQ_AMBN[k] || 16, CW = COLS + 4, RH = ROWS + 4;
  if (A.k !== k || A.S !== S || A.cols !== COLS || A.rows !== ROWS) { A.k = k; A.S = S; A.cols = COLS; A.rows = ROWS; A.ps = []; A.img = {}; for (i = 0; i < n; i++) A.ps.push({ x: Math.random() * CW - 2, y: Math.random() * RH - 2, z: Math.random(), ph: Math.random() * 6.28, s: 0.5 + Math.random(), r: Math.random() }); }
  var ps = A.ps, X, Y, d;
  function wrap(p) { if (p.y > ROWS + 2) p.y -= RH; if (p.y < -2) p.y += RH; if (p.x > COLS + 2) p.x -= CW; if (p.x < -2) p.x += CW; }
  // 낮게 흐르는 안개(묘지, 폐저택, 성 지하, 항구)
  var fogC = k === 'mist' ? '#b4c6ea' : k === 'cryptdust' ? '#5aa8b8' : k === 'leaves2' ? '#c8b8d0' : k === 'gulls' ? '#d0dce8' : null;
  if (fogC) { var nf = k === 'mist' ? 5 : 3; x.globalAlpha = k === 'mist' ? 0.16 : 0.08; for (i = 0; i < nf; i++) { var fx = ((time * 0.07 * (1 + i * 0.15) + i * 2.7) % (COLS + 7)) - 3.5, fy = (ROWS / nf) * (i + 0.6) + Math.sin(time * 0.2 + i) * 0.4; x.drawImage(softSpr(fogC, 64), view.ox + (fx - 2.4) * S, view.oy + (fy - 0.8) * S, S * 4.8, S * 1.6); } x.globalAlpha = 1; }
  if (k === 'mist' || k === 'cryptdust' || k === 'bats') {
    // 빛 알갱이: 묘지 청록 도깨비불빛, 성 지하 푸른 먼지, 호박밭 주황 불티(앞 4개는 박쥐 그림자)
    var gl = glowSpr(k === 'mist' ? '#8ee0d0' : k === 'bats' ? '#ff9a30' : '#7cc4ff', 16), b0 = k === 'bats' ? 4 : 0;
    x.globalCompositeOperation = 'lighter';
    for (i = b0; i < ps.length; i++) { p = ps[i]; p.y -= dt * (k === 'bats' ? 0.3 : 0.1) * p.s; p.x += dt * Math.sin(time * 0.7 + p.ph) * 0.16; wrap(p); var tw = 0.5 + 0.5 * Math.sin(time * 2 + p.ph * 3); d = S * (0.1 + p.z * 0.1) * (0.6 + 0.5 * tw); x.globalAlpha = 0.25 + 0.55 * tw; x.drawImage(gl, view.ox + p.x * S - d, view.oy + p.y * S - d, d * 2, d * 2); }
    x.globalCompositeOperation = 'source-over';
    for (i = 0; i < b0; i++) { p = ps[i]; var dir = p.r < 0.5 ? 1 : -1; p.x += dt * dir * (1.5 + p.s); p.y += dt * (0.4 + Math.sin(time * 1.3 + p.ph) * 0.5); wrap(p); d = S * (0.6 + p.z * 0.35); x.globalAlpha = 0.24; x.drawImage(mqAmbImg(Math.floor(time * 8 + p.ph) % 2 ? 'bat0' : 'bat1', '#06040e', d), view.ox + p.x * S - d / 2, view.oy + p.y * S - d / 2, d, d); }
  } else if (k === 'leaves2') {
    var lc = ['#c8782a', '#a4582a', '#d8a03a'];
    for (i = 0; i < ps.length; i++) { p = ps[i]; p.y += dt * (0.5 + 0.3 * p.s); p.x += dt * (Math.sin(time * 1.3 + p.ph) * 0.5 - 0.3); wrap(p); d = S * (0.17 + p.z * 0.12); var rot = time * 1.2 * p.s + p.ph, fy2 = Math.cos(time * 2.4 * p.s + p.ph), cr = Math.cos(rot), sr = Math.sin(rot); x.globalAlpha = 0.9; x.setTransform(cr, sr, -sr * fy2, cr * fy2, view.ox + p.x * S, view.oy + p.y * S); x.drawImage(mqAmbImg('leaf', lc[i % 3], d), -d / 2, -d / 2, d, d); }
    x.setTransform(1, 0, 0, 1, 0, 0);
  } else if (k === 'rain') {
    for (i = 0; i < ps.length; i++) { p = ps[i]; p.y += dt * (7 + 3 * p.s); p.x -= dt * 1.4; wrap(p); d = S * (0.5 + p.z * 0.4); x.globalAlpha = 0.22 + p.z * 0.26; x.drawImage(mqAmbImg('streak', '#cfe0f4', d), Math.round(view.ox + p.x * S), Math.round(view.oy + p.y * S - d / 2)); }
  } else if (k === 'sandwind' || k === 'wind') {
    var sp = softSpr(k === 'sandwind' ? '#f4dfb0' : '#eef0e0', 32);
    for (i = 0; i < ps.length; i++) { p = ps[i]; p.x += dt * (k === 'sandwind' ? 2.4 + p.s * 1.6 : 3.2 + p.s * 2); p.y += dt * Math.sin(time * 0.9 + p.ph) * 0.18; wrap(p); var w = S * (1.2 + p.z * 1.4), h = S * (k === 'sandwind' ? 0.09 : 0.05); x.globalAlpha = (k === 'sandwind' ? 0.2 : 0.13) + p.z * 0.14; x.drawImage(sp, view.ox + p.x * S - w / 2, view.oy + p.y * S - h / 2, w, h); }
  } else if (k === 'gulls') {
    for (i = 0; i < ps.length; i++) { p = ps[i]; p.x += dt * (0.8 + 0.5 * p.s); p.y += dt * Math.sin(time * 0.5 + p.ph) * 0.35; wrap(p); d = S * (0.4 + p.z * 0.1); var fr = Math.floor(time * 2.2 + p.ph) % 2 ? 'gull0' : 'gull1'; X = view.ox + p.x * S; Y = view.oy + p.y * S;
      x.globalAlpha = 0.1; x.drawImage(mqAmbImg(fr, '#04060c', d), X - d / 2 + S * 0.2, Y - d / 2 + S * 0.5, d, d); x.globalAlpha = 0.72; x.drawImage(mqAmbImg(fr, '#f4f6f8', d), X - d / 2, Y - d / 2, d, d); }
  }
  x.globalAlpha = 1;
}

// ---------- 지도, 미리보기 대표색과 작은 장식 (UI 갈래가 불러 씀) ----------
// mqUi(th) → { band: [진, 중, 밝], accent, ink } (mq 테마가 아니면 null)
function mqUi(th) { var T = THEME[th]; return T && T.ui ? T.ui : null; }
// ui_art.js의 UI_BAND_COL(지도 지역 땅 색)에 8종을 넣음. ui_art.js가 이 파일보다 뒤에 읽히므로 처음 쓸 때 부른다
function mqUiReg() { if (typeof UI_BAND_COL === 'undefined' || !UI_BAND_COL) return false; Object.keys(MQ_THEMES).forEach(function (k) { if (!UI_BAND_COL[k]) UI_BAND_COL[k] = MQ_THEMES[k].ui.band; }); return true; }
// 지도 위 작은 장식 한 개(땅 닿는 점 X, Y, 크기 S, r과 r2는 0~1 난수). mq 테마면 그리고 true
function mqMapDeco(x, th, X, Y, S, r, r2) {
  var T = THEME[th]; if (!T || !T.mq) return false;
  var ink = T.ui.ink, lw = Math.max(1, S * 0.05);
  function box(dx, dy, w, h, col) { x.fillStyle = ink; x.fillRect(X + dx - w / 2 - lw, Y + dy - h - lw, w + lw * 2, h + lw * 2); x.fillStyle = col; x.fillRect(X + dx - w / 2, Y + dy - h, w, h); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(X + dx - w / 2, Y + dy - h, w, Math.max(1, h * 0.18)); }
  function line(pts, w, col) { x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); pts.forEach(function (p, i) { if (i) x.lineTo(X + p[0] * S, Y + p[1] * S); else x.moveTo(X + p[0] * S, Y + p[1] * S); }); x.strokeStyle = ink; x.lineWidth = w + lw * 1.6; x.stroke(); x.strokeStyle = col; x.lineWidth = w; x.stroke(); }
  function dot(dx, dy, rr, col, glow) { if (glow) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.6; x.drawImage(glowSpr(col, 32), X + dx - rr * 3, Y + dy - rr * 3, rr * 6, rr * 6); x.restore(); } x.fillStyle = ink; x.beginPath(); x.arc(X + dx, Y + dy, rr + lw, 0, Math.PI * 2); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(X + dx, Y + dy, rr, 0, Math.PI * 2); x.fill(); }
  x.save(); x.fillStyle = 'rgba(0,0,0,0.28)'; x.beginPath(); x.ellipse(X + S * 0.05, Y, S * 0.36, S * 0.1, 0, 0, Math.PI * 2); x.fill();
  if (th === 'graveyard') { if (r < 0.5) { box(0, 0, S * 0.36, S * 0.34, T.rock); dot(0, -S * 0.34, S * 0.18, T.rock); x.fillStyle = T.rock; x.fillRect(X - S * 0.18, Y - S * 0.36, S * 0.36, S * 0.1); } else if (r < 0.8) line([[0, 0], [0, -0.5], [-0.26, -0.82], [0, -0.5], [0.24, -0.86], [0.1, -0.68], [0.34, -0.62]], S * 0.07, '#4a4458'); else { line([[-0.3, 0], [-0.3, -0.5]], S * 0.06, '#565a74'); line([[0, 0], [0, -0.56]], S * 0.06, '#565a74'); line([[0.3, 0], [0.3, -0.5]], S * 0.06, '#565a74'); line([[-0.38, -0.3], [0.38, -0.3]], S * 0.06, '#565a74'); } }
  else if (th === 'manor') { if (r < 0.4) { line([[0, 0], [0, -0.8]], S * 0.07, '#4a4c62'); dot(0, -S * 0.86, S * 0.12, '#ffc860', 1); } else if (r < 0.75) { dot(-S * 0.14, -S * 0.2, S * 0.2, T.tree[2]); dot(S * 0.16, -S * 0.18, S * 0.18, T.tree[2]); dot(0, -S * 0.34, S * 0.06, '#b44c60'); } else { box(0, 0, S * 0.4, S * 0.24, T.rock); dot(0, -S * 0.4, S * 0.16, T.rock); } }
  else if (th === 'pumpkin') { if (r < 0.5) { dot(0, -S * 0.2, S * 0.24, '#e2761c', r2 < 0.4); line([[0, -0.42], [0.04, -0.56]], S * 0.05, '#4a5a2a'); } else if (r < 0.8) { line([[-0.14, 0], [-0.18, -0.8]], S * 0.06, '#8c8a3c'); line([[0.14, 0], [0.2, -0.9]], S * 0.06, '#8c8a3c'); line([[-0.18, -0.5], [-0.42, -0.36]], S * 0.05, '#6a7030'); line([[0.2, -0.56], [0.44, -0.44]], S * 0.05, '#6a7030'); } else { line([[0, 0], [0, -0.8]], S * 0.06, '#5a4230'); line([[-0.34, -0.56], [0.34, -0.56]], S * 0.06, '#5a4230'); dot(0, -S * 0.78, S * 0.13, '#c8a868'); } }
  else if (th === 'crypt') { if (r < 0.5) { box(0, 0, S * 0.24, S * 0.74, T.rock); box(0, -S * 0.74, S * 0.4, S * 0.1, lit(T.rock, 0.2)); box(0, 0, S * 0.4, S * 0.1, T.rock); } else if (r < 0.8) { line([[-0.16, 0], [0, -0.44], [0.16, 0]], S * 0.06, '#50526c'); dot(0, -S * 0.56, S * 0.13, '#5ad0ff', 1); } else box(0, 0, S * 0.56, S * 0.22, T.rock); }
  else if (th === 'city') { if (r < 0.5) { var bh = S * (0.7 + r2 * 0.5); box(0, 0, S * 0.5, bh, ['#7c8088', '#6a6e78', '#8a8c8e'][Math.floor(r2 * 3)]); x.fillStyle = '#ffb040'; for (var wy = 0; wy < 3; wy++) for (var wx = 0; wx < 2; wx++) if ((wx + wy + Math.floor(r2 * 7)) % 3) x.fillRect(X - S * 0.16 + wx * S * 0.2, Y - bh + S * 0.12 + wy * S * 0.2, S * 0.1, S * 0.1); } else if (r < 0.8) box(0, 0, S * 0.62, S * 0.3, MQ_CONT[Math.floor(r2 * 4)]); else { line([[0, 0], [0, -0.86], [0.26, -0.86]], S * 0.06, '#4a4e56'); dot(S * 0.26, -S * 0.8, S * 0.08, '#ffa040', 1); } }
  else if (th === 'desert') { if (r < 0.4) { dot(-S * 0.1, -S * 0.12, S * 0.2, T.rock); dot(S * 0.14, -S * 0.1, S * 0.15, drk(T.rock, 0.1)); } else if (r < 0.75) { for (var q = 0; q < 3; q++) box((q - 1) * S * 0.2, 0, S * 0.19, S * 0.12, '#a8946a'); box(-S * 0.1, -S * 0.12, S * 0.19, S * 0.12, '#9a865e'); box(S * 0.1, -S * 0.12, S * 0.19, S * 0.12, '#a8946a'); } else { line([[-0.14, 0], [0, -1.0], [0.14, 0]], S * 0.05, '#5a5e66'); dot(0, -S * 1.04, S * 0.06, '#ff7a2a', 1); } }
  else if (th === 'harbor') { if (r < 0.35) { line([[-0.22, 0], [-0.08, -1.0]], S * 0.07, '#c4682a'); line([[0.22, 0], [0.08, -1.0]], S * 0.07, '#c4682a'); line([[-0.4, -1.0], [0.6, -1.0]], S * 0.08, '#c4682a'); line([[0.44, -1.0], [0.44, -0.6]], S * 0.03, '#2a2e36'); } else if (r < 0.8) { box(0, 0, S * 0.62, S * 0.28, MQ_CONT[Math.floor(r2 * 4)]); if (r2 < 0.5) box(-S * 0.06, -S * 0.28, S * 0.5, S * 0.26, MQ_CONT[1]); } else { line([[-0.1, 0], [0, -0.4], [0.1, 0]], S * 0.08, '#e8742a'); dot(0, -S * 0.46, S * 0.05, '#ffd24a'); } }
  else { if (r < 0.4) { x.fillStyle = ink; x.beginPath(); x.ellipse(X, Y, S * 0.46 + lw, S * 0.5 + lw, 0, Math.PI, 0); x.fill(); x.fillStyle = '#6c7460'; x.beginPath(); x.ellipse(X, Y, S * 0.46, S * 0.5, 0, Math.PI, 0); x.fill(); x.fillStyle = '#14181c'; x.beginPath(); x.ellipse(X, Y, S * 0.28, S * 0.32, 0, Math.PI, 0); x.fill(); } else if (r < 0.75) { line([[-0.2, 0], [-0.2, -0.9]], S * 0.06, '#d8d8d0'); line([[-0.16, -0.86], [0.3, -0.78]], S * 0.16, '#f0802a'); } else { box(0, 0, S * 0.46, S * 0.24, '#5e6c48'); line([[-0.2, -0.6], [0.2, -0.36]], S * 0.08, '#c4c8cc'); line([[0, -0.24], [0, -0.48]], S * 0.05, '#4a4e56'); } }
  x.restore();
  return true;
}

// ---------- 고리: art_map.js, art_fx.js를 고치지 않고 mq 테마일 때만 가로챔 ----------
// (같은 묶음 안에서 함수 선언은 먼저 올라오므로 뒤 파일의 drawAmbient도 여기서 감쌀 수 있다. 다른 테마는 원래 함수로 넘어감)
var mqBaseBg = typeof renderBackground === 'function' ? renderBackground : null;
var mqBaseProp = typeof propSpr === 'function' ? propSpr : null;
var mqBaseGate = typeof gateSpr === 'function' ? gateSpr : null;
var mqBaseAmb = typeof drawAmbient === 'function' ? drawAmbient : null;
if (mqBaseBg) renderBackground = function (g, view) { var T = THEME[g.M.theme]; return T && T.mq ? mqBackground(g, view) : mqBaseBg(g, view); };
if (mqBaseProp) propSpr = function (kind, th, S, seed) {
  var T = THEME[th];
  if (T && T.mq) {
    if (kind === 'chest') kind = T.d;   // 보물(OBS d)
    else if (!MQ_PROPS[kind]) { var b = T.blk; kind = b[(seed || 0) % b.length]; S = S / 0.6; }   // render.js가 바위 칸('#')에 'bigrock'을 칸의 0.6배로 넘김 → 테마 큰 소품, 칸 크기로 되돌림
  }
  return mqBaseProp(kind, th, S, seed);
};
if (mqBaseGate) gateSpr = function (S, th) { var T = THEME[th]; return T && T.mq ? mqGate(S, th) : mqBaseGate(S, th); };
if (mqBaseAmb) drawAmbient = function (x, view, theme, time, dt) { var T = THEME[theme]; return T && T.mq ? mqAmbient(x, view, T, time, dt) : mqBaseAmb(x, view, theme, time, dt); };
if (typeof setTimeout === 'function') setTimeout(mqUiReg, 0);

// ---------- 시험용 (tools/mqshot.py가 씀: 배경 굽는 시간, 소품 그림판) ----------
if (typeof window !== 'undefined') window.__mq = {
  themes: Object.keys(MQ_THEMES),
  steps: function () { var o = {}; for (var i = 1; i < MQ_TM.length; i++) o[MQ_TM[i][0]] = +(MQ_TM[i][1] - MQ_TM[i - 1][1]).toFixed(1); return o; },
  // 여러 테마를 번갈아 재서(기계 부하가 출렁여도 공평하게) 배경 굽는 시간과 날씨 한 프레임 시간을 돌려줌: { 테마: [배경 최소 ms, 배경 평균 ms, 날씨 ms] }
  compare: function (g, view, ths, rounds) {
    var old = g.M.theme, out = {}, c = mkC(view.W, view.H), x = cx2(c), r, i, t0;
    ths.forEach(function (th) { out[th] = [1e9, 0, 0]; g.M.theme = th; renderBackground(g, view); });
    for (r = 0; r < rounds; r++) ths.forEach(function (th) {
      g.M.theme = th; t0 = performance.now(); cx2(renderBackground(g, view)).getImageData(0, 0, 1, 1); var d = performance.now() - t0; out[th][0] = Math.min(out[th][0], d); out[th][1] += d / rounds;
      initAmbient(th, (typeof FX_AMBN !== 'undefined' && FX_AMBN[THEME[th].amb]) || 32); x.getImageData(0, 0, 1, 1); t0 = performance.now(); for (i = 0; i < 40; i++) drawAmbient(x, view, th, i / 60, 1 / 60); x.getImageData(0, 0, 1, 1); out[th][2] += (performance.now() - t0) / 40 / rounds;
    });
    g.M.theme = old; initAmbient(old, (typeof FX_AMBN !== 'undefined' && FX_AMBN[THEME[old].amb]) || 32);
    ths.forEach(function (th) { out[th] = out[th].map(function (v) { return +v.toFixed(2); }); });
    return out;
  },
  bench: function (g, view, th, n) { var old = g.M.theme, r = []; g.M.theme = th; for (var i = 0; i < (n || 3); i++) { var t0 = performance.now(); cx2(renderBackground(g, view)).getImageData(0, 0, 1, 1); r.push(Math.round(performance.now() - t0)); } g.M.theme = old; return r; },
  sheet: function (th, S) {
    var T = THEME[th], ks = [], add = function (k) { if (ks.indexOf(k) < 0) ks.push(k); };
    [T.a, T.b, T.c, T.d, T.e].forEach(add); T.blk.forEach(add); T.props.forEach(add); add(T.C);
    var cw = S * 2.7, ch = S * 2.9, cols = 5, rows = Math.ceil((ks.length + 2) / cols), c = mkC(cw * cols, ch * rows), x = cx2(c), t0 = performance.now();
    x.fillStyle = T.g[1]; x.fillRect(0, 0, c.width, c.height);
    ks.forEach(function (k, i) { x.strokeStyle = 'rgba(255,255,255,0.12)'; x.strokeRect((i % cols) * cw + (cw - S) / 2, Math.floor(i / cols) * ch + ch * 0.86 - S, S, S); drawSpr(x, propSpr(k, th, S, i % 6), (i % cols) * cw + cw / 2, Math.floor(i / cols) * ch + ch * 0.86); });
    var n = ks.length; drawSpr(x, propSpr(T.blk[0], th, S, 1), (n % cols) * cw + cw / 2, Math.floor(n / cols) * ch + ch * 0.86); n++;
    drawSpr(x, gateSpr(S, th), (n % cols) * cw + cw / 2, Math.floor(n / cols) * ch + ch * 0.9);
    return { url: c.toDataURL(), ms: Math.round(performance.now() - t0), n: ks.length };
  }
};
