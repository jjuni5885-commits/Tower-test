// ===== tf_art_enemy2.js : 타임플렉스 2~15장 새 적 그림 =====
// 틀 그림 몇 가지를 옵션으로 찍어 낸다: tfMan2(사람: 투구, 방패, 무기, 망토, 머리 모양), tfMount(말 탄 사람), tfShip(배), 탈것과 괴물은 따로
// 모든 시간 침략자에는 푸른 시간 균열 무늬(tfRune)를 넣는다. 오른쪽이 진행 방향, 기준점은 발밑
var TFI = '#21170f';
function tfCol(c, k) { return k > 0 ? enLit(c, k) : enShd(c, -k); }
// ---------- 사람 ----------
function tfMan2(x, H, p, o) {
  var a = p * Math.PI * 2, s = Math.sin(a), bob = Math.abs(Math.cos(a)) * H * 0.022, cr = o.crouch || 0, big = o.big || 1, sk = o.skin || '#d29a6a';
  var hipY = -H * (0.37 - cr * 0.05), shY = -H * (0.67 - cr * 0.08), hx = H * (0.02 + cr * 0.05), hy = -H * (0.81 - cr * 0.1), hr = H * (o.headR || 0.15), w = H * 0.08 * big;
  var tun = o.tunic || '#a84a3a', leg = o.legs || sk, boot = o.boots || '#5a3a24';
  EN_ONE = TFI;
  x.save(); x.translate(0, -bob);
  if (o.cape) { var cp = e4Bl([[-H * 0.04, shY - H * 0.04], [-H * 0.26 - s * H * 0.02, hipY + H * 0.02], [-H * 0.3, -H * 0.1], [-H * 0.06, -H * 0.13], [H * 0.06, shY + H * 0.05]]); e4F(x, cp, o.cape, { d: H * 0.04, lw: 1.2 }); }
  e4Leg(x, -H * 0.03, hipY, a + Math.PI, H * 0.11, H * 0.06, w, enShd(leg, 0.18), enShd(boot, 0.1), H * 0.07);
  e4Arm(x, -H * 0.06, shY + H * 0.03, H * 0.24, o.shield ? 0.9 : -0.5 - s * 0.3, w * 0.85, enShd(o.sleeve || sk, 0.18), null);
  e4Leg(x, H * 0.05, hipY, a, H * 0.11, H * 0.06, w, leg, boot, H * 0.07);
  // 몸통
  var bw = big * (o.belly ? 1.25 : 1);
  var torso = e4Bl([[-H * 0.11 * bw, shY], [H * 0.1 * bw, shY - H * 0.01], [H * 0.14 * bw, hipY - H * 0.06], [H * 0.12 * bw, hipY + H * 0.08], [-H * 0.12 * bw, hipY + H * 0.08], [-H * 0.13 * bw, hipY - H * 0.06]]);
  e4F(x, torso, tun, { d: H * 0.04, lw: 1.3 });
  if (o.armor) { var ap = e4Bl([[-H * 0.1 * bw, shY + H * 0.02], [H * 0.1 * bw, shY + H * 0.01], [H * 0.12 * bw, hipY - H * 0.02], [-H * 0.11 * bw, hipY - H * 0.01]]); e4F(x, ap, o.armor, { d: H * 0.03, lw: 1.1, hi: 0.4 }); if (o.armorBands && !enMode) { x.strokeStyle = enShd(o.armor, 0.35); x.lineWidth = Math.max(0.8, H * 0.012); for (var i = 1; i < 4; i++) { var yy = shY + (hipY - shY) * i / 4; x.beginPath(); x.moveTo(-H * 0.1 * bw, yy); x.lineTo(H * 0.11 * bw, yy); x.stroke(); } } }
  if (o.belt !== 0) e4Line(x, [[-H * 0.12 * bw, hipY + H * 0.01], [H * 0.13 * bw, hipY]], H * 0.025, o.belt || '#5a3a24');
  if (o.skirt) { var sk2 = e4Po([[-H * 0.12 * bw, hipY + H * 0.01], [H * 0.13 * bw, hipY], [H * 0.15, hipY + H * 0.12], [-H * 0.14, hipY + H * 0.13]]); e4F(x, sk2, o.skirt, { d: H * 0.02, lw: 1 }); if (!enMode) { x.strokeStyle = enShd(o.skirt, 0.3); x.lineWidth = Math.max(0.7, H * 0.01); for (var j = 0; j < 4; j++) { var px = -H * 0.09 + j * H * 0.07; x.beginPath(); x.moveTo(px, hipY + H * 0.02); x.lineTo(px + H * 0.01, hipY + H * 0.12); x.stroke(); } } }
  tfRune(x, -H * 0.02, (shY + hipY) / 2, H * 0.033, p);
  // 머리
  if (o.head === 'bull') {
    e4F(x, e4Bl([[hx - hr, hy + hr * 0.2], [hx - hr * 0.7, hy - hr * 0.8], [hx + hr * 0.6, hy - hr * 0.8], [hx + hr * 1.3, hy + hr * 0.1], [hx + hr * 1.4, hy + hr * 0.7], [hx + hr * 0.3, hy + hr * 1.0], [hx - hr * 0.6, hy + hr * 0.8]]), o.headCol || '#5a3a2a', { d: hr * 0.2, lw: 1.4 });
    e4Ov(x, hx + hr * 1.15, hy + hr * 0.5, hr * 0.35, hr * 0.28, '#c89a8a', 0, { d: 0, lw: 1 });
    [[-0.3, 1], [0.5, 0]].forEach(function (q) { tfHorn(x, [hx + q[0] * hr, hy - hr * 0.6], [hx + q[0] * hr - hr * 0.9, hy - hr * 1.0], [hx + q[0] * hr - hr * 0.5, hy - hr * 1.9], hr * 0.32, hr * 0.06, q[1] ? '#efe0bc' : '#d8c8a0'); });
    if (!enMode) e4Eye(x, hx + hr * 0.55, hy - hr * 0.05, hr * 0.17, hr * 0.15, { w: '#ffd060', ir: '#c02010', pr: 0.5, px: 0.3 });
  } else if (o.head === 'egg') { // 얼굴 없는 달걀 머리
    e4Ov(x, hx + hr * 0.1, hy - hr * 0.1, hr * 1.0, hr * 1.2, '#f6f2ea', 0, { d: hr * 0.15, lw: 1.3, hi: 0.5 });
  } else if (o.head === 'tal') { // 흰 탈: 붉은 볼, 먹 눈썹, 웃는 입
    e4F(x, e4Bl([[hx - hr * 0.9, hy + hr * 0.4], [hx - hr * 0.8, hy - hr * 0.9], [hx + hr * 0.3, hy - hr * 1.1], [hx + hr * 1.1, hy - hr * 0.5], [hx + hr * 1.1, hy + hr * 0.6], [hx + hr * 0.3, hy + hr * 1.15], [hx - hr * 0.5, hy + hr * 0.9]]), '#f4ecd8', { d: hr * 0.15, lw: 1.4 });
    if (!enMode) { x.fillStyle = 'rgba(210,60,50,0.7)'; x.beginPath(); x.arc(hx + hr * 0.75, hy + hr * 0.3, hr * 0.18, 0, 7); x.arc(hx - hr * 0.1, hy + hr * 0.35, hr * 0.15, 0, 7); x.fill();
      x.strokeStyle = TFI; x.lineWidth = Math.max(1, hr * 0.12); x.lineCap = 'round';
      [[0.05, 0.35], [0.55, 0.95]].forEach(function (q) { x.beginPath(); x.moveTo(hx + q[0] * hr, hy - hr * 0.2); x.quadraticCurveTo(hx + (q[0] + q[1]) / 2 * hr, hy - hr * 0.42, hx + q[1] * hr, hy - hr * 0.2); x.stroke(); });
      x.beginPath(); x.moveTo(hx + hr * 0.1, hy + hr * 0.55); x.quadraticCurveTo(hx + hr * 0.45, hy + hr * 0.9, hx + hr * 0.85, hy + hr * 0.55); x.stroke(); }
    e4F(x, e4Bl([[hx - hr * 1.0, hy - hr * 0.3], [hx - hr * 0.6, hy - hr * 1.2], [hx + hr * 0.4, hy - hr * 1.35], [hx + hr * 0.9, hy - hr * 0.9], [hx, hy - hr * 0.85]]), '#1e1a20', { d: 0, lw: 1.1 });
  } else if (o.head === 'alien') {
    e4F(x, e4Bl([[hx - hr * 0.9, hy + hr * 0.3], [hx - hr * 0.9, hy - hr * 0.9], [hx + hr * 0.2, hy - hr * 1.35], [hx + hr * 1.0, hy - hr * 0.8], [hx + hr * 0.9, hy + hr * 0.4], [hx + hr * 0.2, hy + hr * 0.9]]), sk, { d: hr * 0.2, lw: 1.4 });
    if (!enMode) { x.fillStyle = '#0a0a14'; x.beginPath(); x.ellipse(hx + hr * 0.45, hy - hr * 0.2, hr * 0.32, hr * 0.2, -0.4, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(160,250,255,0.9)'; x.beginPath(); x.arc(hx + hr * 0.52, hy - hr * 0.26, hr * 0.07, 0, Math.PI * 2); x.fill(); }
  } else {
    var head = e4Bl([[hx - hr, hy + hr * 0.1], [hx - hr * 0.8, hy - hr * 0.75], [hx + hr * 0.3, hy - hr * 0.95], [hx + hr * 0.95, hy - hr * 0.35], [hx + hr * 1.05, hy + hr * 0.25], [hx + hr * 0.7, hy + hr * 0.85], [hx - hr * 0.4, hy + hr * 0.95]]);
    e4F(x, head, sk, { d: hr * 0.2, lw: 1.4 });
    if (o.helm === 'gas') {
      e4Ov(x, hx + hr * 0.3, hy, hr * 0.85, hr * 0.85, '#6a6a5a', 0, { d: hr * 0.15, lw: 1.3 });
      if (!enMode) { [[0.2, -0.2], [0.75, -0.15]].forEach(function (q) { x.fillStyle = '#c8e0e0'; x.strokeStyle = TFI; x.lineWidth = Math.max(1, hr * 0.08); x.beginPath(); x.arc(hx + q[0] * hr, hy + q[1] * hr, hr * 0.2, 0, Math.PI * 2); x.fill(); x.stroke(); }); }
      e4Pill(x, [hx + hr * 0.6, hy + hr * 0.4], [hx + hr * 0.9, hy + hr * 0.95], hr * 0.3, hr * 0.26, '#4a4a3e');
    } else if (!enMode) {
      var ey = hy - hr * 0.08;
      e4Eye(x, hx + hr * 0.22, ey, hr * 0.16, hr * 0.16, { w: '#fffbe8', ir: o.eye || '#4a2a18', pr: 0.42, px: 0.3 });
      e4Eye(x, hx + hr * 0.72, ey - hr * 0.02, hr * 0.12, hr * 0.14, { w: '#fffbe8', ir: o.eye || '#4a2a18', pr: 0.42, px: 0.2, sd: -1 });
      e4Brush(x, [hx - hr * 0.05, ey - hr * 0.3], [hx + hr * 0.3, ey - hr * 0.38], [hx + hr * 0.85, ey - hr * 0.26], hr * 0.14, hr * 0.06, o.hair || '#2a1e16');
      x.strokeStyle = TFI; x.lineWidth = Math.max(0.8, hr * 0.08); x.lineCap = 'round'; x.beginPath(); x.moveTo(hx + hr * 0.45, hy + hr * 0.5); x.quadraticCurveTo(hx + hr * 0.62, hy + hr * 0.44, hx + hr * 0.8, hy + hr * 0.5); x.stroke();
      if (o.paint) { x.fillStyle = o.paint; x.fillRect(hx + hr * 0.05, ey - hr * 0.08, hr * 0.95, hr * 0.12); }
    }
    if (o.beard) e4F(x, e4Bl([[hx + hr * 0.1, hy + hr * 0.4], [hx + hr * 1.05, hy + hr * 0.35], [hx + hr * 0.85, hy + hr * 1.15], [hx + hr * 0.3, hy + hr * 1.05]]), o.beard, { d: 0, lw: 1 });
    tfHelm(x, hx, hy, hr, o.helm, o);
  }
  // 앞팔과 무기
  var wpn = o.weapon, th = wpn === 'sword' || wpn === 'cutlass' || wpn === 'axe' ? 1.0 + Math.max(0, s) * 0.8 : wpn === 'spear' || wpn === 'trident' || wpn === 'halberd' ? 1.25 : wpn === 'rifle' || wpn === 'blaster' ? 1.45 : wpn === 'drum' ? 0.4 + Math.max(0, s) * 1.2 : wpn === 'horn' ? 1.9 : 0.35 + s * 0.4;
  var hand = e4Arm(x, H * 0.07, shY + H * 0.03, H * 0.24, th, w * 0.9, o.sleeve || sk, o.band || null);
  tfWeapon(x, H, hand, wpn, o, s);
  if (o.shield) tfShield(x, H, o.shield, H * 0.15, (shY + hipY) / 2 + H * 0.02, o.shieldCol);
  x.restore();
}
function tfHelm(x, hx, hy, hr, helm, o) {
  var hc = o.helmCol || '#b0a070';
  if (helm === 'legion') {
    e4F(x, e4Bl([[hx - hr * 1.0, hy + hr * 0.1], [hx - hr * 0.9, hy - hr * 0.8], [hx + hr * 0.3, hy - hr * 1.05], [hx + hr * 1.0, hy - hr * 0.5], [hx + hr * 0.9, hy - hr * 0.25], [hx - hr * 0.3, hy - hr * 0.3], [hx - hr * 0.5, hy + hr * 0.4]]), hc, { d: hr * 0.15, lw: 1.3, hi: 0.45 });
    e4F(x, e4Bl([[hx - hr * 0.8, hy - hr * 0.9], [hx - hr * 0.2, hy - hr * 1.55], [hx + hr * 0.6, hy - hr * 1.4], [hx + hr * 0.5, hy - hr * 0.95]]), o.crest || '#c8302a', { d: 0, lw: 1.1 });
  } else if (helm === 'nemes') {
    e4F(x, e4Bl([[hx - hr * 1.2, hy + hr * 1.0], [hx - hr * 1.05, hy - hr * 0.8], [hx + hr * 0.3, hy - hr * 1.05], [hx + hr * 0.95, hy - hr * 0.5], [hx + hr * 0.6, hy - hr * 0.3], [hx - hr * 0.2, hy - hr * 0.2], [hx - hr * 0.35, hy + hr * 1.1]]), o.helmCol || '#e8c040', { d: hr * 0.15, lw: 1.3, hi: 0.4 });
    if (!enMode) { x.strokeStyle = o.stripe || '#2a4aa8'; x.lineWidth = Math.max(1, hr * 0.12); for (var i = 0; i < 4; i++) { x.beginPath(); x.moveTo(hx - hr * (1.05 - i * 0.05), hy - hr * (0.4 - i * 0.35)); x.lineTo(hx - hr * (0.35 - i * 0.05), hy - hr * (0.2 - i * 0.35)); x.stroke(); } }
  } else if (helm === 'cone') {
    e4F(x, e4Po([[hx - hr * 1.05, hy - hr * 0.35], [hx + hr * 0.1, hy - hr * 1.5], [hx + hr * 1.1, hy - hr * 0.4], [hx + hr * 0.3, hy - hr * 0.55]]), hc, { d: hr * 0.1, lw: 1.2, hi: 0.4 });
    e4F(x, e4Bl([[hx + hr * 0.0, hy - hr * 1.5], [hx - hr * 0.25, hy - hr * 2.0], [hx + hr * 0.25, hy - hr * 1.95]]), o.crest || '#c8302a', { d: 0, lw: 1 });
  } else if (helm === 'knight') {
    e4F(x, e4Bl([[hx - hr * 1.05, hy + hr * 0.7], [hx - hr * 1.05, hy - hr * 0.8], [hx + hr * 0.2, hy - hr * 1.1], [hx + hr * 1.1, hy - hr * 0.7], [hx + hr * 1.15, hy + hr * 0.7], [hx + hr * 0.2, hy + hr * 1.0]]), hc, { d: hr * 0.2, lw: 1.4, hi: 0.5 });
    if (!enMode) { x.fillStyle = '#0a0a10'; x.fillRect(hx + hr * 0.1, hy - hr * 0.22, hr * 1.05, hr * 0.16); x.fillStyle = o.eyeGlow || 'rgba(255,80,60,0.9)'; x.fillRect(hx + hr * 0.5, hy - hr * 0.2, hr * 0.3, hr * 0.1); }
    if (o.plume) e4F(x, e4Bl([[hx - hr * 0.2, hy - hr * 1.0], [hx - hr * 1.2, hy - hr * 1.6], [hx - hr * 1.5, hy - hr * 0.9], [hx - hr * 0.6, hy - hr * 0.8]]), o.plume, { d: 0, lw: 1 });
  } else if (helm === 'bandana') {
    e4F(x, e4Bl([[hx - hr * 1.0, hy - hr * 0.2], [hx - hr * 0.8, hy - hr * 0.95], [hx + hr * 0.4, hy - hr * 1.05], [hx + hr * 0.95, hy - hr * 0.5], [hx + hr * 0.3, hy - hr * 0.45], [hx - hr * 0.6, hy - hr * 0.15]]), o.helmCol || '#c8302a', { d: hr * 0.1, lw: 1.2 });
    e4F(x, e4Po([[hx - hr * 0.95, hy - hr * 0.35], [hx - hr * 1.5, hy - hr * 0.1], [hx - hr * 1.3, hy + hr * 0.25]]), o.helmCol || '#c8302a', { d: 0, lw: 1 });
  } else if (helm === 'tricorn') {
    e4F(x, e4Po([[hx - hr * 1.3, hy - hr * 0.55], [hx - hr * 0.6, hy - hr * 1.35], [hx + hr * 0.4, hy - hr * 1.25], [hx + hr * 1.3, hy - hr * 0.6], [hx + hr * 0.2, hy - hr * 0.7]]), o.helmCol || '#2a2026', { d: hr * 0.1, lw: 1.2 });
    if (!enMode) { tfSkullMini(x, hx + hr * 0.1, hy - hr * 0.95, hr * 0.18); }
  } else if (helm === 'brodie') {
    e4F(x, e4Bl([[hx - hr * 1.35, hy - hr * 0.5], [hx - hr * 0.7, hy - hr * 1.1], [hx + hr * 0.5, hy - hr * 1.15], [hx + hr * 1.35, hy - hr * 0.5], [hx + hr * 0.2, hy - hr * 0.6]]), o.helmCol || '#5a6248', { d: hr * 0.1, lw: 1.2, hi: 0.35 });
  } else if (helm === 'hood') {
    e4F(x, e4Bl([[hx - hr * 1.15, hy + hr * 0.8], [hx - hr * 1.1, hy - hr * 0.8], [hx + hr * 0.3, hy - hr * 1.15], [hx + hr * 1.05, hy - hr * 0.55], [hx + hr * 0.75, hy - hr * 0.35], [hx - hr * 0.2, hy - hr * 0.35], [hx - hr * 0.3, hy + hr * 0.95]]), o.helmCol || '#4a3e36', { d: hr * 0.2, lw: 1.3 });
  } else if (helm === 'laurel') {
    e4F(x, e4Bl([[hx - hr * 1.0, hy + hr * 0.1], [hx - hr * 0.8, hy - hr * 0.75], [hx + hr * 0.4, hy - hr * 0.95], [hx + hr * 0.9, hy - hr * 0.55], [hx + hr * 0.1, hy - hr * 0.5], [hx - hr * 0.5, hy + hr * 0.2]]), o.hair || '#3a2a20', { d: 0, lw: 1.1 });
    for (var k = 0; k < 6; k++) { var t = k / 5, lx = hx - hr * 0.9 + t * hr * 1.6, ly = hy - hr * 0.6 - Math.sin(t * Math.PI) * hr * 0.35; e4Ov(x, lx, ly, hr * 0.16, hr * 0.08, '#e8c040', 0.5 - t, { d: 0, lw: 0.8 }); }
  } else if (helm === 'norse') { // 둥근 쇠 투구와 코 가리개
    e4F(x, e4Bl([[hx - hr * 1.0, hy - hr * 0.2], [hx - hr * 0.85, hy - hr * 0.95], [hx + hr * 0.1, hy - hr * 1.25], [hx + hr * 0.9, hy - hr * 0.9], [hx + hr * 1.0, hy - hr * 0.3]]), o.helmCol || '#8a9098', { d: hr * 0.12, lw: 1.3, hi: 0.5 });
    e4Line(x, [[hx - hr * 0.95, hy - hr * 0.3], [hx + hr * 1.0, hy - hr * 0.35]], hr * 0.16, enShd(o.helmCol || '#8a9098', 0.25));
    e4Line(x, [[hx + hr * 0.62, hy - hr * 0.35], [hx + hr * 0.7, hy + hr * 0.25]], hr * 0.16, enShd(o.helmCol || '#8a9098', 0.15));
  } else if (helm === 'pelt') { // 늑대 머리 가죽
    var pc = o.helmCol || '#8a8a8e';
    e4F(x, e4Bl([[hx - hr * 1.3, hy + hr * 1.1], [hx - hr * 1.2, hy - hr * 0.6], [hx - hr * 0.2, hy - hr * 1.3], [hx + hr * 0.9, hy - hr * 1.0], [hx + hr * 1.6, hy - hr * 0.55], [hx + hr * 1.5, hy - hr * 0.3], [hx + hr * 0.6, hy - hr * 0.42], [hx - hr * 0.3, hy - hr * 0.3], [hx - hr * 0.45, hy + hr * 1.2]]), pc, { d: hr * 0.2, lw: 1.3 });
    e4F(x, e4Po([[hx - hr * 0.3, hy - hr * 1.15], [hx - hr * 0.1, hy - hr * 1.75], [hx + hr * 0.25, hy - hr * 1.15]]), enShd(pc, 0.15), { d: 0, lw: 1 });
    if (!enMode) { x.fillStyle = '#ffd060'; x.beginPath(); x.arc(hx + hr * 0.75, hy - hr * 0.8, hr * 0.09, 0, 7); x.fill(); }
  } else if (helm === 'turban') {
    e4F(x, e4Bl([[hx - hr * 1.05, hy - hr * 0.2], [hx - hr * 0.95, hy - hr * 1.05], [hx + hr * 0.2, hy - hr * 1.35], [hx + hr * 1.0, hy - hr * 0.85], [hx + hr * 0.9, hy - hr * 0.45], [hx - hr * 0.5, hy - hr * 0.3]]), o.helmCol || '#efe6d0', { d: hr * 0.15, lw: 1.2 });
  } else if (helm === 'crown') {
    e4F(x, e4Po([[hx - hr * 0.8, hy - hr * 0.55], [hx - hr * 0.85, hy - hr * 1.25], [hx - hr * 0.45, hy - hr * 0.95], [hx - hr * 0.05, hy - hr * 1.4], [hx + hr * 0.35, hy - hr * 0.95], [hx + hr * 0.8, hy - hr * 1.25], [hx + hr * 0.75, hy - hr * 0.5]]), '#f0c030', { d: hr * 0.1, lw: 1.2, hi: 0.5 });
  } else if (helm === 'hair') {
    e4F(x, e4Bl([[hx - hr * 1.05, hy + hr * 0.3], [hx - hr * 1.0, hy - hr * 0.75], [hx - hr * 0.1, hy - hr * 1.15], [hx + hr * 0.8, hy - hr * 0.9], [hx + hr * 0.9, hy - hr * 0.55], [hx, hy - hr * 0.55], [hx - hr * 0.5, hy + hr * 0.3]]), o.hair || '#2a1e16', { d: hr * 0.1, lw: 1.1 });
  } else if (helm === 'topknot') {
    e4F(x, e4Bl([[hx - hr * 1.0, hy + hr * 0.1], [hx - hr * 0.9, hy - hr * 0.75], [hx + hr * 0.3, hy - hr * 1.0], [hx + hr * 0.9, hy - hr * 0.5], [hx + hr * 0.1, hy - hr * 0.5], [hx - hr * 0.5, hy + hr * 0.1]]), o.hair || '#1a1410', { d: 0, lw: 1.1 });
    e4Ov(x, hx - hr * 0.2, hy - hr * 1.15, hr * 0.28, hr * 0.24, o.hair || '#1a1410', 0, { d: 0, lw: 1 });
    if (o.band) e4Line(x, [[hx - hr * 0.95, hy - hr * 0.55], [hx + hr * 0.85, hy - hr * 0.6]], hr * 0.15, o.band);
  }
}
function tfSkullMini(x, cx, cy, s) { x.fillStyle = '#f2ecd8'; x.beginPath(); x.arc(cx, cy, s, 0, Math.PI * 2); x.fill(); x.fillStyle = '#1a1410'; x.beginPath(); x.arc(cx - s * 0.35, cy - s * 0.1, s * 0.25, 0, 7); x.arc(cx + s * 0.35, cy - s * 0.1, s * 0.25, 0, 7); x.fill(); }
function tfWeapon(x, H, h, w, o, s) {
  var hx = h[0], hy = h[1], wc = o.wpnCol || '#c8ccd4', wood = '#8a5a34';
  if (w === 'spear' || w === 'trident' || w === 'halberd') {
    e4Line(x, [[hx - H * 0.3, hy + H * 0.12], [hx + H * 0.34, hy - H * 0.14]], H * 0.026, wood);
    if (w === 'spear') e4F(x, e4Po([[hx + H * 0.32, hy - H * 0.1], [hx + H * 0.48, hy - H * 0.2], [hx + H * 0.34, hy - H * 0.17]]), wc, { d: 0, lw: 1 });
    else if (w === 'trident') [[-0.03], [0], [0.03]].forEach(function (q) { e4Line(x, [[hx + H * 0.33, hy - H * 0.13 + q[0] * H], [hx + H * 0.46, hy - H * 0.19 + q[0] * H * 1.8]], H * 0.016, wc); });
    else { e4F(x, e4Bl([[hx + H * 0.28, hy - H * 0.12], [hx + H * 0.36, hy - H * 0.28], [hx + H * 0.42, hy - H * 0.12], [hx + H * 0.34, hy - H * 0.06]]), wc, { d: 0, lw: 1 }); e4Line(x, [[hx + H * 0.34, hy - H * 0.14], [hx + H * 0.48, hy - H * 0.22]], H * 0.018, wc); }
  } else if (w === 'sword' || w === 'cutlass') {
    var a = -1.0 - s * 0.6, L = H * 0.32, ex = hx + Math.cos(a) * L, ey = hy + Math.sin(a) * L;
    if (w === 'cutlass') { var mx = (hx + ex) / 2 + H * 0.05, my = (hy + ey) / 2 + H * 0.03; e4F(x, e4Bl([[hx, hy], [mx, my - H * 0.02], [ex, ey], [mx + H * 0.03, my + H * 0.03]]), wc, { d: 0, lw: 1.1, hi: 0.5 }); }
    else e4Pill(x, [hx, hy], [ex, ey], H * 0.035, H * 0.01, wc);
    e4Line(x, [[hx - H * 0.04, hy + H * 0.03], [hx + H * 0.04, hy - H * 0.03]], H * 0.02, '#c8a040');
  } else if (w === 'rifle' || w === 'blaster') {
    e4F(x, e4Po([[hx - H * 0.18, hy + H * 0.04], [hx + H * 0.32, hy - H * 0.03], [hx + H * 0.32, hy], [hx - H * 0.1, hy + H * 0.08], [hx - H * 0.2, hy + H * 0.1]]), w === 'blaster' ? '#5a5a7a' : '#4a3a2a', { d: 0, lw: 1 });
    if (w === 'blaster' && !enMode) { x.fillStyle = 'rgba(120,255,200,0.9)'; x.beginPath(); x.arc(hx + H * 0.33, hy - H * 0.015, H * 0.025, 0, 7); x.fill(); }
    else e4Line(x, [[hx + H * 0.3, hy - H * 0.025], [hx + H * 0.4, hy - H * 0.04]], H * 0.012, '#c8ccd4');
  } else if (w === 'crook' || w === 'staff') {
    e4Line(x, [[hx - H * 0.02, hy + H * 0.2], [hx + H * 0.04, hy - H * 0.4]], H * 0.024, w === 'crook' ? '#e8c040' : wood);
    if (w === 'crook') e4Line(x, [[hx + H * 0.04, hy - H * 0.4], [hx + H * 0.1, hy - H * 0.47], [hx + H * 0.15, hy - H * 0.4]], H * 0.024, '#2a4aa8');
    else tfRune(x, hx + H * 0.04, hy - H * 0.42, H * 0.04, s);
  } else if (w === 'drum') {
    e4Line(x, [[hx, hy], [hx + H * 0.06, hy - H * 0.12]], H * 0.018, wood);
    e4Ov(x, H * 0.2, -H * 0.42, H * 0.12, H * 0.14, '#b8402a', 0, { d: H * 0.02, lw: 1.2 });
    e4Ov(x, H * 0.24, -H * 0.42, H * 0.05, H * 0.12, '#efe0bc', 0, { d: 0, lw: 1 });
  } else if (w === 'axe') {
    var aa = -1.0 - s * 0.6, AL = H * (o.big > 1.2 ? 0.42 : 0.3), axx = hx + Math.cos(aa) * AL, axy = hy + Math.sin(aa) * AL;
    e4Line(x, [[hx - Math.cos(aa) * H * 0.04, hy - Math.sin(aa) * H * 0.04], [axx, axy]], H * 0.024, wood);
    var nx = -Math.sin(aa), ny = Math.cos(aa), bw = H * (o.big > 1.2 ? 0.17 : 0.12);
    e4F(x, e4Bl([[axx - Math.cos(aa) * bw * 0.2, axy - Math.sin(aa) * bw * 0.2], [axx + nx * bw - Math.cos(aa) * bw * 0.7, axy + ny * bw - Math.sin(aa) * bw * 0.7], [axx + nx * bw * 1.1 + Math.cos(aa) * bw * 0.5, axy + ny * bw * 1.1 + Math.sin(aa) * bw * 0.5], [axx + Math.cos(aa) * bw * 0.25, axy + Math.sin(aa) * bw * 0.25]]), wc, { d: 0, lw: 1.1, hi: 0.5 });
  } else if (w === 'horn') {
    e4F(x, e4Bl([[hx - H * 0.02, hy + H * 0.02], [hx + H * 0.12, hy - H * 0.08], [hx + H * 0.22, hy - H * 0.22], [hx + H * 0.26, hy - H * 0.18], [hx + H * 0.16, hy - H * 0.02], [hx + H * 0.02, hy + H * 0.05]]), '#e8d8b0', { d: H * 0.01, lw: 1.1 });
    e4Ov(x, hx + H * 0.24, hy - H * 0.2, H * 0.035, H * 0.045, '#c8a060', -0.6, { d: 0, lw: 1 });
    e4Line(x, [[hx + H * 0.06, hy - H * 0.03], [hx + H * 0.1, hy - H * 0.07]], H * 0.012, '#c8a040');
  } else if (w === 'ladle') {
    e4Line(x, [[hx, hy], [hx + H * 0.16, hy - H * 0.2]], H * 0.02, wood); e4Ov(x, hx + H * 0.18, hy - H * 0.23, H * 0.05, H * 0.04, '#c8ccd4', 0, { d: 0, lw: 1 });
  } else if (w === 'net') {
    e4Line(x, [[hx - H * 0.2, hy + H * 0.15], [hx + H * 0.3, hy - H * 0.12]], H * 0.022, wood);
    [[-0.03], [0], [0.03]].forEach(function (q) { e4Line(x, [[hx + H * 0.28, hy - H * 0.1 + q[0] * H], [hx + H * 0.4, hy - H * 0.16 + q[0] * H * 1.6]], H * 0.014, '#c8ccd4'); });
  }
}
function tfShield(x, H, kind, cx, cy, col) {
  if (kind === 'scutum') { var s = e4Bl([[cx - H * 0.06, cy - H * 0.2], [cx + H * 0.05, cy - H * 0.22], [cx + H * 0.08, cy + H * 0.18], [cx - H * 0.04, cy + H * 0.2]]); e4F(x, s, col || '#b0302a', { d: H * 0.03, lw: 1.4, hi: 0.35 }); e4Ov(x, cx + H * 0.015, cy, H * 0.03, H * 0.035, '#e8c040', 0, { d: 0, lw: 1 }); if (!enMode) { x.strokeStyle = '#e8c040'; x.lineWidth = Math.max(1, H * 0.012); x.beginPath(); x.moveTo(cx - H * 0.02, cy - H * 0.15); x.lineTo(cx + H * 0.05, cy + H * 0.15); x.stroke(); } }
  else if (kind === 'round' || kind === 'rattan') { e4Ov(x, cx, cy, H * 0.13, H * 0.15, col || (kind === 'rattan' ? '#c8a060' : '#8a6a3a'), 0, { d: H * 0.03, lw: 1.4 }); if (!enMode) { x.strokeStyle = kind === 'rattan' ? '#8a6a3a' : '#c8ccd4'; x.lineWidth = Math.max(1, H * 0.012); for (var i = 1; i < 3; i++) { x.beginPath(); x.ellipse(cx, cy, H * 0.13 * i / 3, H * 0.15 * i / 3, 0, 0, Math.PI * 2); x.stroke(); } } e4Ov(x, cx, cy, H * 0.03, H * 0.035, '#c8ccd4', 0, { d: 0, lw: 1 }); }
  else if (kind === 'kite') { var k = e4Po([[cx - H * 0.08, cy - H * 0.17], [cx + H * 0.08, cy - H * 0.17], [cx + H * 0.07, cy + H * 0.02], [cx, cy + H * 0.22], [cx - H * 0.07, cy + H * 0.02]]); e4F(x, k, col || '#2a2a36', { d: H * 0.03, lw: 1.4, hi: 0.35 }); e4Line(x, [[cx, cy - H * 0.14], [cx, cy + H * 0.15]], H * 0.02, '#c8302a'); e4Line(x, [[cx - H * 0.06, cy - H * 0.06], [cx + H * 0.06, cy - H * 0.06]], H * 0.02, '#c8302a'); }
}
// ---------- 말 탄 사람 ----------
function tfHorse(x, H, p, col, mane, armor) {
  tfBeast(x, H, p, { col: col, len: 0.74, ht: 0.27, leg: 0.3, legW: 0.075, run: 1, paw: enShd(col, 0.35), bend: 0.05,
    tail: function (x, by, a) { e4Pill(x, [-H * 0.36, by - H * 0.2], [-H * 0.5, by - H * 0.02 + Math.sin(a) * H * 0.03], H * 0.07, H * 0.03, mane); },
    marks: armor ? function (x, body, by, ht, len) { e4Clip(x, body, function () { x.fillStyle = armor; x.fillRect(-len * 0.4, by - ht * 0.9, len * 0.8, ht * 0.7); }); } : null
  }, function (x, hx, hy, a) {
    var hr = H * 0.13; hx += hr * 0.2;
    e4Pill(x, [hx - hr * 0.6, hy + hr * 0.6], [hx + hr * 0.5, hy - hr * 0.9], hr * 1.0, hr * 0.7, col);
    e4F(x, e4Bl([[hx + hr * 0.1, hy - hr * 1.4], [hx + hr * 1.7, hy - hr * 0.5], [hx + hr * 1.7, hy - hr * 0.05], [hx + hr * 0.9, hy + hr * 0.0], [hx - hr * 0.1, hy - hr * 0.6]]), col, { d: hr * 0.2, lw: 1.3 });
    e4F(x, e4Bl([[hx - hr * 0.7, hy + hr * 0.4], [hx - hr * 0.2, hy - hr * 1.3], [hx + hr * 0.3, hy - hr * 1.4], [hx - hr * 0.1, hy - hr * 0.3]]), mane, { d: 0, lw: 1 });
    e4F(x, e4Po([[hx + hr * 0.15, hy - hr * 1.3], [hx + hr * 0.2, hy - hr * 1.8], [hx + hr * 0.45, hy - hr * 1.3]]), col, { d: 0, lw: 1 });
    if (!enMode) e4Eye(x, hx + hr * 0.6, hy - hr * 0.85, hr * 0.13, hr * 0.12, { w: '#fff0c0', ir: '#2a1a10', pr: 0.55, px: 0.3 });
  });
}
function tfMount(x, H, p, o) {
  tfHorse(x, H, p, o.horse || '#7a5038', o.mane || '#2a1a12', o.barding);
  x.save(); x.translate(-H * 0.02, -H * 0.36 + Math.abs(Math.sin(p * Math.PI * 2)) * -H * 0.02);
  var r = {}; for (var q in o.rider) r[q] = o.rider[q]; r.legs = r.legs || r.tunic; tfManTop(x, H * 0.62, p, r);
  x.restore();
}
// 말 위 사람(허리 위만)
function tfManTop(x, H, p, o) {
  x.save(); x.beginPath(); x.rect(-H, -H * 1.6, H * 2, H * 1.25); x.clip();
  tfMan2(x, H, 0.25, o);
  x.restore();
  e4Leg(x, H * 0.02, -H * 0.37, 1.2, 0, 0, H * 0.08, o.legs || o.tunic, o.boots || '#3a2a1a', H * 0.06);
}
// ---------- 배 ----------
// o: hull, deck, sail('square'|'lateen'|'junk'|'none'), sailCol, oars, cannons, flag, ghost, reed(갈대배 모양)
function tfShip(x, H, p, o) {
  var a = p * Math.PI * 2, rk = Math.sin(a) * 0.035, L = H * (o.len || 0.95), hh = H * 0.16;
  EN_ONE = TFI;
  if (o.ghost && !enMode) x.globalAlpha = 0.78;
  e4Ripple(x, 0, H * 0.02, L * 0.62, H * 0.1, 0.8, a);
  x.save(); x.translate(0, -H * 0.06 + Math.sin(a) * H * 0.012); x.rotate(rk);
  // 돛대와 돛 (선체 뒤)
  var masts = o.masts || 1;
  for (var m = 0; m < masts; m++) {
    var mx = masts === 1 ? 0 : (-0.22 + m * 0.44 / (masts - 1)) * L, top = -H * (0.85 - (masts > 1 && m === 0 ? 0.1 : 0));
    if (o.sail !== 'none') e4Line(x, [[mx, -hh * 0.6], [mx, top]], H * 0.022, '#6a4a2a');
    var sc = o.sailCol || '#efe6d0', bill = Math.sin(a + m) * H * 0.02;
    if (o.sail === 'square') { [[0.12, 0.42], [0.46, 0.7]].forEach(function (q, j) { var y0 = top + H * q[0] * 0.95, y1 = top + H * q[1] * 0.95, w2 = H * (0.2 - j * 0.03), sp = e4Bl([[mx - w2, y0], [mx + w2, y0], [mx + w2 + bill, (y0 + y1) / 2], [mx + w2, y1], [mx - w2, y1], [mx - w2 + bill, (y0 + y1) / 2]]); e4F(x, sp, sc, { d: H * 0.02, lw: 1.1 }); if (o.stripe && !enMode) e4Clip(x, sp, function () { x.fillStyle = o.stripe; for (var k = -2; k <= 2; k += 2) x.fillRect(mx + k * w2 / 3 - w2 / 6, y0 - H * 0.02, w2 / 3, y1 - y0 + H * 0.04); }); }); if (o.skull && m === masts - 1 && !enMode) tfSkullMini(x, mx, top + H * 0.28, H * 0.05); }
    else if (o.sail === 'lateen') e4F(x, e4Po([[mx, top], [mx + H * 0.32 + bill, -hh * 0.9], [mx - H * 0.05, -hh * 0.8]]), sc, { d: H * 0.02, lw: 1.1 });
    else if (o.sail === 'junk') { var js = e4Po([[mx - H * 0.18, top + H * 0.05], [mx + H * 0.22 + bill, top + H * 0.12], [mx + H * 0.26 + bill, -hh * 0.9], [mx - H * 0.2, -hh * 0.85]]); e4F(x, js, sc, { d: H * 0.02, lw: 1.1 }); if (!enMode) { x.strokeStyle = enShd(sc, 0.4); x.lineWidth = Math.max(1, H * 0.012); for (var j = 1; j < 5; j++) { var t = j / 5; x.beginPath(); x.moveTo(mx - H * 0.19, top + H * 0.05 + (-hh * 0.85 - top - H * 0.05) * t); x.lineTo(mx + H * 0.24 + bill, top + H * 0.12 + (-hh * 0.9 - top - H * 0.12) * t); x.stroke(); } } }
    if (o.flag && m === masts - 1) e4F(x, e4Po([[mx, top], [mx - H * 0.16, top + H * 0.04 + bill], [mx, top + H * 0.09]]), o.flag, { d: 0, lw: 1 });
  }
  // 선체
  var hull = o.reed ? e4Bl([[-L * 0.55, -hh * 1.6], [-L * 0.4, -hh * 0.4], [L * 0.4, -hh * 0.4], [L * 0.58, -hh * 1.7], [L * 0.45, hh * 0.3], [-L * 0.45, hh * 0.3]])
    : e4Po([[-L * 0.5, -hh * 1.2], [-L * 0.42, -hh * 0.6], [L * 0.38, -hh * 0.6], [L * 0.55, -hh * 1.1], [L * 0.42, hh * 0.35], [-L * 0.4, hh * 0.35]]);
  e4F(x, hull, o.hull || '#8a5a34', { d: hh * 0.3, lw: 1.5 });
  if (o.reed && !enMode) { x.strokeStyle = enShd(o.hull || '#c8a860', 0.3); x.lineWidth = Math.max(1, H * 0.012); for (var r = 0; r < 4; r++) { x.beginPath(); x.moveTo(-L * 0.45, -hh * 0.2 + r * hh * 0.15); x.lineTo(L * 0.45, -hh * 0.2 + r * hh * 0.15); x.stroke(); } }
  if (o.deck) e4Line(x, [[-L * 0.42, -hh * 0.6], [L * 0.38, -hh * 0.6]], H * 0.03, o.deck);
  if (o.cannons && !enMode) { x.fillStyle = '#1a1a20'; for (var c = 0; c < o.cannons; c++) { x.beginPath(); x.arc(-L * 0.25 + c * L * 0.5 / Math.max(1, o.cannons - 1), -hh * 0.05, H * 0.025, 0, 7); x.fill(); } }
  if (o.oars) for (var i = 0; i < 5; i++) { var ox = -L * 0.3 + i * L * 0.15, sw = Math.sin(a * 2 + i) * H * 0.04; e4Line(x, [[ox, -hh * 0.2], [ox - H * 0.06 + sw, hh * 1.2]], H * 0.014, '#6a4a2a'); }
  if (o.eye && !enMode) { x.fillStyle = '#efe6d0'; x.beginPath(); x.ellipse(L * 0.38, -hh * 0.65, H * 0.035, H * 0.025, 0, 0, 7); x.fill(); x.fillStyle = '#1a1410'; x.beginPath(); x.arc(L * 0.39, -hh * 0.65, H * 0.015, 0, 7); x.fill(); }
  tfRune(x, 0, -hh * 0.1, H * 0.04, p);
  if (o.crew) { x.save(); x.translate(-L * 0.12, -hh * 0.6); tfRider(x, H * 0.36, a); x.restore(); }
  x.restore();
  if (o.ghost && !enMode) { x.globalAlpha = 1; enGlow(x, 0, -H * 0.4, H * 0.6, '#7fe8c8', 0.25); }
}

// ===================== 2장 황금 사막의 강 =====================
EN_DRAW.eg_spear = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#b07a4a', tunic: '#efe6d0', skirt: '#efe6d0', belt: '#e8c040', helm: 'nemes', weapon: 'spear', shield: 'round', shieldCol: '#a86a3a', paint: 'rgba(30,40,120,0.6)' }); } };
EN_DRAW.eg_priest = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#9a6a42', tunic: '#efe6d0', armor: '#e8c040', helm: 'hair', hair: '#1a1410', weapon: 'staff', cape: '#2a4aa8', paint: 'rgba(20,20,60,0.7)', crouch: 0.15 }); } };
EN_DRAW.eg_pharaoh = { n: 6, f: function (x, H, p) { tfMan2(x, H, p, { skin: '#b08a50', tunic: '#efe6d0', armor: '#e8c040', armorBands: 1, skirt: '#efe6d0', belt: '#2a4aa8', helm: 'nemes', weapon: 'crook', cape: '#2a4aa8', big: 1.15, eye: '#5ff0ff' }); enGlow(x, 0, -H * 0.5, H * 0.5, '#ffd24a', enMode ? 0 : 0.2); } };
EN_DRAW.eg_scorp = { f: function (x, H, p) {
  x.scale(1.5, 1.5); var a = p * Math.PI * 2, col = '#8a5a2a', dk = enShd(col, 0.3), by = -H * 0.12; EN_ONE = TFI;
  for (var i = 0; i < 4; i++) { var lx = -H * 0.2 + i * H * 0.12, ph = Math.sin(a * 2 + i * 1.7) * H * 0.03; e4Line(x, [[lx, by], [lx - H * 0.05 + ph, by + H * 0.06], [lx - H * 0.08 + ph, by + H * 0.12]], H * 0.025, dk); }
  for (var j = 0; j < 4; j++) e4Ov(x, -H * 0.24 + j * H * 0.11, by - H * 0.02, H * 0.08, H * 0.06, j % 2 ? col : enLit(col, 0.06), 0, { d: H * 0.015, lw: 1.2 });
  var tail = [[-H * 0.3, by - H * 0.02], [-H * 0.42, by - H * 0.15], [-H * 0.38, by - H * 0.35], [-H * 0.22, by - H * 0.42 + Math.sin(a) * H * 0.02]];
  for (var k = 0; k < 3; k++) e4Pill(x, tail[k], tail[k + 1], H * 0.08 - k * H * 0.012, H * 0.06 - k * H * 0.012, col);
  e4F(x, e4Po([[tail[3][0], tail[3][1] - H * 0.03], [tail[3][0] + H * 0.1, tail[3][1] + H * 0.04], [tail[3][0], tail[3][1] + H * 0.03]]), '#c02010', { d: 0, lw: 1 });
  [[0.12, -0.02], [0.08, 0.04]].forEach(function (q, n) { e4Pill(x, [H * q[0], by + H * q[1]], [H * 0.28, by - H * 0.04 + H * q[1]], H * 0.04, H * 0.035, n ? dk : col); e4F(x, e4Bl([[H * 0.27, by - H * 0.06 + H * q[1]], [H * 0.4, by - H * 0.1 + H * q[1]], [H * 0.42, by + H * q[1]], [H * 0.3, by + H * 0.02 + H * q[1]]]), n ? dk : col, { d: 0, lw: 1.1 }); });
  tfRune(x, -H * 0.05, by - H * 0.03, H * 0.03, p);
} };
EN_DRAW.eg_sphinx = { f: function (x, H, p) {
  var col = '#d8b878';
  tfBeast(x, H, p, { col: col, len: 0.8, ht: 0.3, leg: 0.2, legW: 0.11, run: 0.1, paw: enShd(col, 0.1),
    tail: function (x, by) { e4Line(x, [[-H * 0.38, by - H * 0.1], [-H * 0.5, by - H * 0.2]], H * 0.04, col); },
    marks: function (x, body, by, ht, len) { e4Stripes(x, body, [[-0.3, -0.8, -0.2, -0.2], [0.0, -0.9, 0.1, -0.3]].map(function (q) { return [q[0] * len, by + q[1] * ht, q[2] * len, by + q[3] * ht, H * 0.02]; }), enShd(col, 0.25)); }
  }, function (x, hx, hy) {
    var hr = H * 0.16; hx += hr * 0.2; hy -= hr * 0.4;
    e4F(x, e4Bl([[hx - hr * 1.15, hy + hr * 1.2], [hx - hr * 1.05, hy - hr * 0.8], [hx + hr * 0.3, hy - hr * 1.1], [hx + hr * 0.95, hy - hr * 0.5], [hx + hr * 0.6, hy - hr * 0.3], [hx - hr * 0.2, hy - hr * 0.2], [hx - hr * 0.3, hy + hr * 1.3]]), '#e8c040', { d: hr * 0.15, lw: 1.3 });
    if (!enMode) { x.strokeStyle = '#2a4aa8'; x.lineWidth = Math.max(1, hr * 0.12); for (var i = 0; i < 4; i++) { x.beginPath(); x.moveTo(hx - hr * (1.05 - i * 0.05), hy - hr * (0.4 - i * 0.4)); x.lineTo(hx - hr * (0.3 - i * 0.05), hy - hr * (0.2 - i * 0.4)); x.stroke(); } }
    e4F(x, e4Bl([[hx - hr * 0.3, hy - hr * 0.4], [hx + hr * 0.8, hy - hr * 0.5], [hx + hr * 1.05, hy + hr * 0.3], [hx + hr * 0.6, hy + hr * 0.9], [hx - hr * 0.2, hy + hr * 0.7]]), col, { d: hr * 0.15, lw: 1.3 });
    if (!enMode) { x.fillStyle = TFC.rune; x.beginPath(); x.ellipse(hx + hr * 0.55, hy - hr * 0.05, hr * 0.14, hr * 0.08, 0, 0, 7); x.fill(); enGlow(x, hx + hr * 0.55, hy - hr * 0.05, hr * 0.5, TFC.rune, 0.4); }
  });
} };
EN_DRAW.eg_boat = { f: function (x, H, p) { tfShip(x, H, p, { reed: 1, hull: '#c8a860', sail: 'square', sailCol: '#efe6d0', masts: 1, crew: 1, len: 0.9, eye: 1 }); } };

// ===================== 3장 대리석 제국 =====================
var TF_LEG = { skin: '#d29a6a', tunic: '#b0302a', armor: '#c8ccd4', armorBands: 1, skirt: '#b0302a', helm: 'legion', helmCol: '#c8ccd4' };
function tfO(base, o) { var r = {}; for (var k in base) r[k] = base[k]; for (var q in o) r[q] = o[q]; return r; }
EN_DRAW.ro_legion = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_LEG, { weapon: 'sword', shield: 'scutum' })); } };
EN_DRAW.ro_glad = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#c48a58', tunic: '#7a4a2a', skirt: '#efe6d0', helm: 'knight', helmCol: '#c8a040', plume: '#c8302a', weapon: 'trident', shield: 'round', shieldCol: '#c8a040', big: 1.1, eyeGlow: 'rgba(95,240,255,0.9)' }); } };
EN_DRAW.ro_spy = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#c48a58', tunic: '#3a3448', helm: 'hood', helmCol: '#2a2638', weapon: 'sword', cape: '#2a2638', crouch: 0.5 }); } };
EN_DRAW.ro_medic = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#d29a6a', tunic: '#efe6d0', helm: 'hair', hair: '#3a2a20', weapon: 'staff', cape: '#2a6a4a', beard: '#3a2a20' }); } };
EN_DRAW.ro_horse = { f: function (x, H, p) { tfMount(x, H, p, { horse: '#6a4430', mane: '#1e140c', barding: '#b0302a', rider: tfO(TF_LEG, { weapon: 'spear' }) }); } };
EN_DRAW.ro_tyrant = { n: 6, f: function (x, H, p) { tfMan2(x, H, p, { skin: '#d29a6a', tunic: '#6a2a8a', armor: '#e8c040', armorBands: 1, skirt: '#efe6d0', helm: 'laurel', hair: '#2a1e16', weapon: 'sword', wpnCol: '#f0d060', cape: '#8a2a6a', big: 1.2, belly: 1, eye: '#5ff0ff' }); } };
EN_DRAW.ro_eleph = { f: function (x, H, p) {
  var col = '#8a8a90';
  tfBeast(x, H, p, { col: col, len: 0.86, ht: 0.46, leg: 0.28, legW: 0.15, run: 0, hump: 1.05, bend: 0.03,
    tail: function (x, by) { e4Line(x, [[-H * 0.43, by - H * 0.3], [-H * 0.5, by - H * 0.12]], H * 0.025, col); },
    marks: function (x, body, by, ht, len) { e4Clip(x, body, function () { x.fillStyle = '#b0302a'; x.fillRect(-len * 0.4, by - ht * 0.75, len * 0.7, ht * 0.4); x.fillStyle = '#e8c040'; x.fillRect(-len * 0.4, by - ht * 0.4, len * 0.7, ht * 0.06); }); }
  }, function (x, hx, hy, a, by, ht, len) {
    // 등의 망루와 군단병
    var tx = -len * 0.12, ty = by - ht * 0.95;
    e4F(x, e4Po([[tx - H * 0.2, ty], [tx + H * 0.2, ty], [tx + H * 0.18, ty - H * 0.22], [tx - H * 0.18, ty - H * 0.22]]), '#8a5a34', { d: H * 0.02, lw: 1.2 });
    x.save(); x.translate(tx - H * 0.05, ty - H * 0.2); tfManTop(x, H * 0.36, a / 6.28, tfO(TF_LEG, { weapon: 'spear' })); x.restore();
    var hr = H * 0.2; hx += hr * 0.1; hy -= hr * 0.25;
    e4F(x, e4Bl([[hx - hr * 0.8, hy + hr * 0.4], [hx - hr * 0.6, hy - hr * 0.9], [hx + hr * 0.4, hy - hr * 1.0], [hx + hr * 0.95, hy - hr * 0.3], [hx + hr * 0.9, hy + hr * 0.5], [hx + hr * 0.1, hy + hr * 0.9]]), enLit(col, 0.05), { d: hr * 0.2, lw: 1.5 });
    e4F(x, e4Bl([[hx - hr * 0.6, hy - hr * 0.6], [hx - hr * 1.4, hy - hr * 0.3], [hx - hr * 1.3, hy + hr * 0.7], [hx - hr * 0.5, hy + hr * 0.6]]), enShd(col, 0.08), { d: hr * 0.1, lw: 1.2 });
    var sw = Math.sin(a) * hr * 0.15; e4Pill(x, [hx + hr * 0.75, hy + hr * 0.3], [hx + hr * 1.0 + sw, hy + hr * 1.3], hr * 0.4, hr * 0.28, enLit(col, 0.05)); e4Pill(x, [hx + hr * 1.0 + sw, hy + hr * 1.3], [hx + hr * 0.85 + sw, hy + hr * 2.0], hr * 0.28, hr * 0.18, enLit(col, 0.05));
    tfHorn(x, [hx + hr * 0.55, hy + hr * 0.6], [hx + hr * 1.2, hy + hr * 1.2], [hx + hr * 1.5, hy + hr * 0.7], hr * 0.22, hr * 0.05, '#f4e8cc');
    if (!enMode) e4Eye(x, hx + hr * 0.4, hy - hr * 0.25, hr * 0.12, hr * 0.11, { w: '#fff0c0', ir: '#3a2014', pr: 0.5, px: 0.3 });
  });
} };
EN_DRAW.ro_galley = { f: function (x, H, p) { tfShip(x, H, p, { hull: '#8a4a2a', deck: '#e8c040', sail: 'square', sailCol: '#b0302a', oars: 1, masts: 1, flag: '#e8c040', len: 1.0, eye: 1 }); } };

// ===================== 4장 붉은 강의 결전 =====================
var TF_TK = { skin: '#d6a070', tunic: '#3a5a8a', armor: '#5a4a3a', armorBands: 1, skirt: '#3a5a8a', helm: 'cone', helmCol: '#6a6a72', crest: '#c8302a' };
EN_DRAW.tk_spear = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_TK, { weapon: 'spear' })); } };
EN_DRAW.tk_shield = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_TK, { tunic: '#8a6a3a', skirt: '#8a6a3a', helm: 'topknot', band: '#c8302a', weapon: 'sword', shield: 'rattan' })); } };
EN_DRAW.tk_ninja = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#d6a070', tunic: '#22222c', helm: 'hood', helmCol: '#1a1a22', weapon: 'sword', crouch: 0.55, belt: '#c8302a' }); } };
EN_DRAW.tk_drum = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_TK, { tunic: '#c8302a', skirt: '#c8302a', helm: 'topknot', band: '#e8c040', weapon: 'drum', armor: null })); } };
EN_DRAW.tk_cav = { f: function (x, H, p) { tfMount(x, H, p, { horse: '#3a2a22', mane: '#0e0a08', barding: '#3a5a8a', rider: tfO(TF_TK, { weapon: 'halberd' }) }); } };
EN_DRAW.tk_general = { n: 6, f: function (x, H, p) { tfMount(x, H, p, { horse: '#a83a2a', mane: '#1e100c', barding: '#e8c040', rider: tfO(TF_TK, { tunic: '#2a6a3a', skirt: '#2a6a3a', armor: '#e8c040', helm: 'cone', helmCol: '#e8c040', weapon: 'halberd', beard: '#1a1410', cape: '#c8302a', eye: '#5ff0ff' }) }); } };
EN_DRAW.tk_junk = { f: function (x, H, p) { tfShip(x, H, p, { hull: '#6a3a22', deck: '#c8302a', sail: 'junk', sailCol: '#c8a070', masts: 2, flag: '#c8302a', len: 1.0, eye: 1 }); } };

// ===================== 5장 얼음 바다의 약탈자 =====================
var TF_NR = { skin: '#e0b090', tunic: '#5a6a7a', legs: '#6a5a4a', boots: '#3a2a1e', helm: 'norse', belt: '#3a2a1a', beard: '#c88a40' };
EN_DRAW.nr_raider = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_NR, { weapon: 'axe', shield: 'round', shieldCol: '#b0402a', cape: '#7a3a2a' })); } };
EN_DRAW.nr_shield = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_NR, { tunic: '#3a4a5a', armor: '#8a9098', armorBands: 1, weapon: 'spear', shield: 'round', shieldCol: '#2a5a8a', beard: '#8a5a2a', big: 1.15 })); tfShield(x, H, 'round', H * 0.2, -H * 0.5, '#2a5a8a'); } };
EN_DRAW.nr_pelt = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_NR, { tunic: '#6a6a6e', helm: 'pelt', helmCol: '#9a9aa0', weapon: 'axe', cape: '#8a8a90', crouch: 0.45, beard: '#5a3a22' })); } };
EN_DRAW.nr_horn = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_NR, { tunic: '#7a3a2a', weapon: 'horn', cape: '#3a5a4a', beard: '#e0c070' })); } };
EN_DRAW.nr_giant = { n: 6, f: function (x, H, p) { tfMan2(x, H, p, { skin: '#9ab8c8', tunic: '#3a4a5a', armor: '#c8dce8', armorBands: 1, legs: '#6a8494', boots: '#2a3a48', helm: 'crown', weapon: 'axe', wpnCol: '#d8f4ff', cape: '#1e2e4a', beard: '#eef6fa', big: 1.3, belly: 1, eye: '#5ff0ff' }); if (!enMode) enGlow(x, 0, -H * 0.5, H * 0.55, '#a8e8ff', 0.18); } };
EN_DRAW.nr_troll = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#7a9a8a', tunic: '#4a4a3a', legs: '#6a8a7a', boots: '#3a4a40', helm: 'hair', hair: '#5a6a4a', paint: 'rgba(40,60,40,0.35)', weapon: 'sword', wpnCol: '#6a5a48', beard: '#d8e6ea', big: 1.35, belly: 1, crouch: 0.35, eye: '#ffd060' }); } };
EN_DRAW.nr_wolf = { f: function (x, H, p) {
  var col = '#9aa0a8', wh = '#eef2f4';
  tfBeast(x, H, p, { col: col, belly: wh, len: 0.74, ht: 0.26, leg: 0.24, legW: 0.08, run: 1, paw: wh, fur: 0.02,
    tail: function (x, by, a) { e4Pill(x, [-H * 0.36, by - H * 0.18], [-H * 0.56, by - H * 0.1 + Math.sin(a) * H * 0.03], H * 0.08, H * 0.04, col); }
  }, function (x, hx, hy) {
    var hr = H * 0.14; hx += hr * 0.3;
    [[-0.45, 1], [0.15, 0]].forEach(function (q) { e4F(x, e4Po([[hx + q[0] * hr - hr * 0.2, hy - hr * 0.6], [hx + q[0] * hr, hy - hr * 1.35], [hx + q[0] * hr + hr * 0.25, hy - hr * 0.6]]), q[1] ? enShd(col, 0.25) : col, { d: 0, lw: 1 }); });
    e4F(x, e4Bl([[hx - hr * 0.9, hy], [hx - hr * 0.6, hy - hr * 0.8], [hx + hr * 0.4, hy - hr * 0.75], [hx + hr * 1.6, hy - hr * 0.1], [hx + hr * 1.55, hy + hr * 0.3], [hx + hr * 0.3, hy + hr * 0.6], [hx - hr * 0.7, hy + hr * 0.5]]), col, { d: hr * 0.18, lw: 1.4 });
    e4Ov(x, hx + hr * 1.55, hy + hr * 0.05, hr * 0.14, hr * 0.12, '#1a1a1e', 0, { d: 0, lw: 0.8 });
    if (!enMode) e4Eye(x, hx + hr * 0.45, hy - hr * 0.3, hr * 0.15, hr * 0.12, { w: '#ffe070', ir: '#4a2a10', pr: 0.4, px: 0.3 });
  });
} };
// 새 떼: cols [날개 앞, 날개 뒤, 몸], 눈 색
function tfFlock(x, H, p, cols, eye, beak) {
  x.translate(0, -H * 0.3); x.scale(1.6, 1.6); x.translate(0, H * 0.3); var a = p * Math.PI * 2; EN_ONE = TFI;
  [[-0.22, -0.62, 0.8, 0.9], [0.18, -0.5, 1, 0], [-0.05, -0.78, 0.7, 2.1]].forEach(function (b) {
    var cx = b[0] * H, cy = b[1] * H + Math.sin(a + b[3]) * H * 0.03, k = b[2], f = Math.sin(a * 2 + b[3]);
    [1, -1].forEach(function (sd) { e4F(x, e4Po([[cx, cy], [cx - H * 0.08 * k, cy - H * (0.05 + f * 0.1) * k], [cx - H * 0.2 * k, cy - H * (0.02 + f * 0.14) * k], [cx - H * 0.1 * k, cy + H * 0.03 * k]]), sd > 0 ? cols[0] : cols[1], { d: 0, lw: 1 }); });
    e4Ov(x, cx, cy, H * 0.07 * k, H * 0.035 * k, cols[2], 0, { d: 0, lw: 1 });
    e4F(x, e4Po([[cx + H * 0.06 * k, cy - H * 0.01], [cx + H * 0.11 * k, cy + H * 0.005], [cx + H * 0.06 * k, cy + H * 0.015]]), beak || '#3a3a3a', { d: 0, lw: 0.8 });
    if (!enMode) { x.fillStyle = eye; x.beginPath(); x.arc(cx + H * 0.045 * k, cy - H * 0.008, H * 0.008 * k + 0.6, 0, 7); x.fill(); }
  });
}
EN_DRAW.nr_raven = { n: 6, f: function (x, H, p) { tfFlock(x, H, p, ['#2a2a34', '#1a1a22', '#22222a'], '#5ff0ff'); } };
EN_DRAW.eg_vulture = { n: 6, f: function (x, H, p) { tfFlock(x, H, p, ['#6a4a2e', '#4a321e', '#e8dcc0'], '#ffd060', '#c8a040'); } };
EN_DRAW.ro_eagle = { n: 6, f: function (x, H, p) { tfFlock(x, H, p, ['#8a5a2a', '#6a4220', '#f2ead8'], '#5ff0ff', '#e8b030'); } };
EN_DRAW.sa_parrot = { n: 6, f: function (x, H, p) { tfFlock(x, H, p, ['#d8402a', '#2a6ab0', '#3aa048'], '#ffffff', '#e8c040'); } };
EN_DRAW.tk_kite = { n: 6, f: function (x, H, p) {
  x.translate(0, -H * 0.5); x.scale(1.5, 1.5); x.translate(0, H * 0.45); var a = p * Math.PI * 2; EN_ONE = TFI;
  [[-0.18, -0.68, 0.9, 0], [0.16, -0.52, 1, 1.7]].forEach(function (b) {
    var cx = b[0] * H, cy = b[1] * H + Math.sin(a + b[3]) * H * 0.04, k = b[2] * H;
    for (var t = 1; t <= 4; t++) e4Ov(x, cx - t * k * 0.07 + Math.sin(a * 2 + t + b[3]) * k * 0.03, cy + t * k * 0.09, k * 0.025, k * 0.035, t % 2 ? '#c8302a' : '#e8c040', 0, { d: 0, lw: 0.8 });
    var kp = e4Po([[cx, cy - k * 0.16], [cx + k * 0.11, cy], [cx, cy + k * 0.13], [cx - k * 0.11, cy]]); e4F(x, kp, '#efe0bc', { d: 0, lw: 1.1 });
    e4Clip(x, kp, function () { x.fillStyle = '#c8302a'; x.fillRect(cx - k * 0.12, cy - k * 0.03, k * 0.24, k * 0.06); });
    if (!enMode) { x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, cx - k * 0.3, cy + k * 0.4, k * 0.12, '#ff8a3a', 0.6); x.restore(); }
    e4Ov(x, cx - k * 0.3, cy + k * 0.4, k * 0.035, k * 0.05, '#ffb040', 0, { d: 0, lw: 0.8 });
  });
} };
EN_DRAW.nr_wisp = { f: function (x, H, p) {
  x.scale(1.5, 1.5); var a = p * Math.PI * 2, cy = -H * 0.5 + Math.sin(a) * H * 0.05; EN_ONE = TFI;
  if (!enMode) { x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, 0, cy, H * 0.35, '#7affc8', 0.5); enGlow(x, -H * 0.1, cy + H * 0.05, H * 0.25, '#a07bff', 0.35); x.restore(); }
  e4F(x, e4Bl([[-H * 0.22, cy + H * 0.06], [-H * 0.06, cy - H * 0.14], [H * 0.12, cy - H * 0.1], [H * 0.16, cy + H * 0.04], [0, cy + H * 0.12]]), '#c8fff0', { d: 0, lw: 1.1, hi: 0.6 });
} };
EN_DRAW.nr_ship = { f: function (x, H, p) {
  tfShip(x, H, p, { hull: '#5a3e2a', deck: '#3a2a1e', sail: 'square', sailCol: '#efe6d0', stripe: '#b0402a', masts: 1, oars: 1, len: 1.05 });
  if (enMode) return;
  var a = p * Math.PI * 2, rk = Math.sin(a) * 0.035, L = H * 1.05, hh = H * 0.16;
  x.save(); x.translate(0, -H * 0.06 + Math.sin(a) * H * 0.012); x.rotate(rk);
  for (var i = 0; i < 5; i++) { var sx = -L * 0.32 + i * L * 0.15; x.fillStyle = i % 2 ? '#b0402a' : '#e8c040'; x.strokeStyle = TFI; x.lineWidth = Math.max(1, H * 0.012); x.beginPath(); x.arc(sx, -hh * 0.75, H * 0.045, 0, 7); x.fill(); x.stroke(); }
  e4F(x, e4Bl([[L * 0.5, -hh * 1.1], [L * 0.6, -hh * 2.2], [L * 0.7, -hh * 2.6], [L * 0.76, -hh * 2.3], [L * 0.66, -hh * 1.9], [L * 0.58, -hh * 1.0]]), '#5a3e2a', { d: 0, lw: 1.2 });
  x.fillStyle = '#ffd060'; x.beginPath(); x.arc(L * 0.7, -hh * 2.4, H * 0.012 + 0.5, 0, 7); x.fill();
  // 줄무늬 돛
  x.restore();
} };
// ===================== 6장 성벽의 시대 =====================
var TF_CA = { skin: '#e0b088', tunic: '#5a6a8a', armor: '#a8acb4', armorBands: 1, helm: 'cone', helmCol: '#a8acb4', crest: '#5a6a8a', legs: '#5a5a62', boots: '#3a3a40' };
EN_DRAW.ca_foot = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_CA, { weapon: 'spear', shield: 'kite', shieldCol: '#5a6a8a' })); } };
EN_DRAW.ca_knight = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#e0b088', tunic: '#1e1e26', armor: '#3a3a46', armorBands: 1, helm: 'knight', helmCol: '#2a2a34', plume: '#8a1a1a', legs: '#2a2a34', boots: '#1a1a20', weapon: 'sword', shield: 'kite', shieldCol: '#1e1e26', big: 1.1 }); } };
EN_DRAW.ca_monk = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#e0b088', tunic: '#6a4a32', helm: 'hood', helmCol: '#5a3e2a', weapon: 'staff', belt: '#c8b080', crouch: 0.15 }); } };
EN_DRAW.ca_rider = { f: function (x, H, p) { tfMount(x, H, p, { horse: '#e8e0d0', mane: '#8a8070', barding: '#5a6a8a', rider: tfO(TF_CA, { helm: 'knight', plume: '#e8c040', weapon: 'spear' }) }); } };
EN_DRAW.ca_giant = { n: 6, f: function (x, H, p) { tfMan2(x, H, p, { skin: '#e0b088', tunic: '#5a7a9a', armor: '#c8d8e8', armorBands: 1, helm: 'knight', helmCol: '#b8c8d8', plume: '#5ff0ff', legs: '#8a9aaa', boots: '#4a5a6a', weapon: 'sword', wpnCol: '#d8f0ff', shield: 'kite', shieldCol: '#5a7a9a', big: 1.3, eyeGlow: 'rgba(95,240,255,0.95)' }); } };
// 바퀴 탈것(파성추, 공성탑)
function tfCart(x, H, p, body) {
  var a = p * Math.PI * 2; EN_ONE = TFI;
  body(x, a);
  [-0.26, 0.26].forEach(function (k) { var cx = H * k, cy = -H * 0.1, r = H * 0.1; e4Ov(x, cx, cy, r, r, '#6a4a2a', 0, { d: r * 0.2, lw: 1.3 }); if (!enMode) { x.strokeStyle = '#3a2614'; x.lineWidth = Math.max(1, H * 0.014); for (var i = 0; i < 4; i++) { var aa = a * 1.5 + i * Math.PI / 4; x.beginPath(); x.moveTo(cx - Math.cos(aa) * r * 0.85, cy - Math.sin(aa) * r * 0.85); x.lineTo(cx + Math.cos(aa) * r * 0.85, cy + Math.sin(aa) * r * 0.85); x.stroke(); } } });
}
EN_DRAW.ca_ram = { f: function (x, H, p) { tfCart(x, H, p, function (x, a) {
  var sw = Math.sin(a * 2) * H * 0.04;
  e4Pill(x, [-H * 0.35 + sw, -H * 0.28], [H * 0.45 + sw, -H * 0.28], H * 0.1, H * 0.09, '#7a5030');
  e4F(x, e4Bl([[H * 0.42 + sw, -H * 0.34], [H * 0.52 + sw, -H * 0.31], [H * 0.52 + sw, -H * 0.25], [H * 0.42 + sw, -H * 0.22]]), '#5a5a62', { d: 0, lw: 1 });
  e4F(x, e4Po([[-H * 0.4, -H * 0.2], [H * 0.4, -H * 0.2], [H * 0.3, -H * 0.55], [-H * 0.32, -H * 0.55]]), '#8a6a42', { d: H * 0.03, lw: 1.3 });
  e4F(x, e4Po([[-H * 0.42, -H * 0.5], [H * 0.42, -H * 0.5], [H * 0.0, -H * 0.72]]), '#6a4a2a', { d: H * 0.02, lw: 1.3 });
  tfRune(x, 0, -H * 0.4, H * 0.04, a / 6.28);
}); } };
EN_DRAW.ca_tower = { f: function (x, H, p) { tfCart(x, H, p, function (x, a) {
  e4F(x, e4Po([[-H * 0.36, -H * 0.15], [H * 0.36, -H * 0.15], [H * 0.3, -H * 1.0], [-H * 0.3, -H * 1.0]]), '#8a6a42', { d: H * 0.04, lw: 1.4 });
  if (!enMode) { x.strokeStyle = '#5a4026'; x.lineWidth = Math.max(1, H * 0.014); for (var i = 1; i < 6; i++) { x.beginPath(); x.moveTo(-H * 0.35, -H * 0.15 - i * H * 0.14); x.lineTo(H * 0.35, -H * 0.15 - i * H * 0.14); x.stroke(); } x.fillStyle = '#1a1410'; x.fillRect(-H * 0.08, -H * 0.85, H * 0.16, H * 0.12); }
  e4F(x, e4Po([[-H * 0.34, -H * 1.0], [H * 0.34, -H * 1.0], [H * 0.34, -H * 1.08], [-H * 0.34, -H * 1.08]]), '#6a4a2a', { d: 0, lw: 1.2 });
  e4Line(x, [[H * 0.0, -H * 1.08], [H * 0.0, -H * 1.3]], H * 0.02, '#6a4a2a'); e4F(x, e4Po([[0, -H * 1.3], [-H * 0.16, -H * 1.25 + Math.sin(a) * H * 0.02], [0, -H * 1.2]]), '#b0302a', { d: 0, lw: 1 });
  tfRune(x, 0, -H * 0.5, H * 0.05, a / 6.28);
}); } };

// ===================== 7장 대항해의 바다 =====================
var TF_PI = { skin: '#c48a58', tunic: '#efe6d0', legs: '#3a4a6a', boots: '#2a1e14', helm: 'bandana', weapon: 'cutlass', belt: '#2a1e14' };
EN_DRAW.sa_pirate = { f: function (x, H, p) { tfMan2(x, H, p, TF_PI); } };
EN_DRAW.sa_brute = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_PI, { tunic: '#6a4a2a', armor: '#8a5a34', helm: 'tricorn', weapon: 'cutlass', big: 1.2, belly: 1, beard: '#2a1a12' })); } };
EN_DRAW.sa_cook = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_PI, { tunic: '#f6f0e0', helm: 'turban', helmCol: '#ffffff', weapon: 'ladle', belly: 1 })); } };
EN_DRAW.sa_ship = { f: function (x, H, p) { tfShip(x, H, p, { hull: '#4a2e1e', deck: '#8a5a34', sail: 'square', sailCol: '#2a2626', masts: 3, flag: '#1a1414', skull: 1, cannons: 4, len: 1.05 }); } };
EN_DRAW.sa_ghostship = { f: function (x, H, p) { tfShip(x, H, p, { hull: '#4a5a5a', deck: '#2a3a3a', sail: 'square', sailCol: '#a8c8c0', masts: 2, flag: '#5ff0ff', skull: 1, ghost: 1, len: 1.0 }); } };
EN_DRAW.sa_shark = { f: function (x, H, p) {
  var a = p * Math.PI * 2; EN_ONE = TFI;
  e4Ripple(x, 0, 0, H * 0.45, H * 0.09, 0.8, a);
  e4F(x, e4Bl([[-H * 0.45, -H * 0.02], [-H * 0.1, -H * 0.14], [H * 0.35, -H * 0.1], [H * 0.5, -H * 0.02], [H * 0.3, H * 0.02], [-H * 0.4, H * 0.02]]), '#6a7a8a', { d: H * 0.03, lw: 1.3 });
  e4F(x, e4Po([[-H * 0.05, -H * 0.12], [H * 0.05, -H * 0.42 + Math.sin(a) * H * 0.02], [H * 0.18, -H * 0.11]]), '#5a6a7a', { d: 0, lw: 1.2 });
  e4F(x, e4Po([[-H * 0.42, -H * 0.04], [-H * 0.58, -H * 0.2], [-H * 0.52, H * 0.0]]), '#5a6a7a', { d: 0, lw: 1.1 });
  if (!enMode) { x.fillStyle = '#1a1410'; x.beginPath(); x.arc(H * 0.36, -H * 0.06, H * 0.015, 0, 7); x.fill(); }
  tfRune(x, H * 0.0, -H * 0.06, H * 0.03, p);
} };
EN_DRAW.sa_kraken = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, col = '#8a3a5a'; EN_ONE = TFI;
  e4Ripple(x, 0, 0, H * 0.7, H * 0.13, 0.9, a);
  for (var i = 0; i < 6; i++) { var bx = -H * 0.5 + i * H * 0.2, ph = a + i * 1.1, pts = [[bx, 0]]; for (var k = 1; k <= 5; k++) pts.push([bx + Math.sin(ph + k * 0.8) * H * 0.08 * k / 5, -H * 0.12 * k - (i % 2 ? H * 0.1 : 0)]); for (var j = 0; j < 5; j++) e4Pill(x, pts[j], pts[j + 1], H * (0.09 - j * 0.014), H * (0.08 - j * 0.014), j % 2 ? col : enLit(col, 0.06)); }
  e4F(x, e4Bl([[-H * 0.3, -H * 0.05], [-H * 0.35, -H * 0.5], [-H * 0.1, -H * 0.85], [H * 0.2, -H * 0.85], [H * 0.38, -H * 0.5], [H * 0.32, -H * 0.05]]), col, { d: H * 0.05, lw: 1.5 });
  if (!enMode) { [[-0.12, -0.4], [0.16, -0.4]].forEach(function (q) { e4Eye(x, q[0] * H, q[1] * H, H * 0.07, H * 0.06, { w: '#fff6a0', ir: '#e05010', pr: 0.25, px: 0.3 }); }); }
  tfRune(x, 0, -H * 0.62, H * 0.06, p);
} };

// ===================== 8장 조선 =====================
EN_DRAW.jo_raider = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#c89060', tunic: '#5a4a3a', legs: '#4a3a2a', helm: 'bandana', helmCol: '#3a3a3a', weapon: 'sword', belt: '#2a1e14', beard: '#1a1410' }); } };

// ===================== 옛 그림 대신 (2, 6, 7장) =====================
EN_DRAW.eg_ghost = { f: function (x, H, p) { if (!enMode) x.globalAlpha = 0.72 + 0.2 * Math.sin(p * Math.PI * 2); tfMan2(x, H, p, { skin: '#9a8a6a', tunic: '#c8b890', legs: '#b8a880', boots: '#8a7a5a', helm: 'hood', helmCol: '#a8987a', cape: '#b8a888', weapon: 'none', crouch: 0.2, eye: '#5ff0ff' }); x.globalAlpha = 1; } };
EN_DRAW.ca_thief = { f: function (x, H, p) { if (!enMode) x.globalAlpha = 0.8 + 0.15 * Math.sin(p * Math.PI * 2); tfMan2(x, H, p, { skin: '#d8b090', tunic: '#2a2a34', legs: '#22222a', boots: '#1a1a20', helm: 'hood', helmCol: '#1e1e28', cape: '#1a1a24', weapon: 'sword', crouch: 0.5 }); x.globalAlpha = 1; } };
EN_DRAW.sa_ghost = { f: function (x, H, p) { if (!enMode) x.globalAlpha = 0.75; tfMan2(x, H, p, { skin: '#9ad8c0', tunic: '#5a8a7a', legs: '#4a7a6a', boots: '#2a4a40', helm: 'tricorn', weapon: 'cutlass', wpnCol: '#b8f0e0', beard: '#c8f0e0', eye: '#5ff0ff' }); x.globalAlpha = 1; if (!enMode) { x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, 0, -H * 0.5, H * 0.45, '#7affd8', 0.2); x.restore(); } } };
EN_DRAW.eg_mummy = { f: function (x, H, p) {
  tfMan2(x, H, p, { skin: '#d8ccaa', tunic: '#d8ccaa', legs: '#cfc2a0', boots: '#bcae8a', helm: 'none', weapon: 'none', belt: '#e8c040', crouch: 0.15, eye: '#5ff0ff', big: 1.15 });
  if (enMode) return; x.strokeStyle = 'rgba(120,100,70,0.45)'; x.lineWidth = Math.max(1, H * 0.012);
  for (var i = 0; i < 9; i++) { var y = -H * (0.15 + i * 0.08); x.beginPath(); x.moveTo(-H * 0.14, y); x.lineTo(H * 0.16, y - H * 0.03); x.stroke(); }
} };
EN_DRAW.eg_scarab = { f: function (x, H, p) {
  x.scale(1.3, 1.3); var a = p * Math.PI * 2, by = -H * 0.1; EN_ONE = TFI;
  for (var i = 0; i < 3; i++) { var lx = -H * 0.08 + i * H * 0.09, ph = Math.sin(a * 2 + i * 2) * H * 0.02; e4Line(x, [[lx, by], [lx - H * 0.04 + ph, by + H * 0.08]], H * 0.02, '#3a2a10'); }
  var sh = e4Bl([[-H * 0.16, by], [-H * 0.12, by - H * 0.14], [H * 0.04, by - H * 0.17], [H * 0.14, by - H * 0.08], [H * 0.14, by + H * 0.03], [-H * 0.12, by + H * 0.04]]);
  e4F(x, sh, '#d8a020', { d: H * 0.02, lw: 1.2, hi: 0.6 }); e4Line(x, [[-H * 0.02, by - H * 0.16], [-H * 0.02, by + H * 0.03]], H * 0.012, '#7a5010');
  e4Ov(x, H * 0.17, by - H * 0.04, H * 0.05, H * 0.045, '#5a3a10', 0, { d: 0, lw: 1 });
} };
EN_DRAW.ca_gargoyle = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, f = Math.sin(a * 1.5), col = '#8a8a86'; EN_ONE = TFI;
  x.save(); x.translate(0, -H * 0.3 + Math.sin(a) * H * 0.03);
  [1, 0].forEach(function (far) { var k = far ? 0.85 : 1; e4F(x, e4Po([[-H * 0.02, -H * 0.55], [-H * 0.25 * k, -H * (0.85 + f * 0.12) * k], [-H * 0.5 * k, -H * (0.7 + f * 0.1) * k], [-H * 0.38 * k, -H * 0.58], [-H * 0.45 * k, -H * 0.45], [-H * 0.25, -H * 0.48]]), far ? enShd(col, 0.25) : enShd(col, 0.1), { d: 0, lw: 1.2 }); });
  tfMan2(x, H * 0.85, p, { skin: col, tunic: col, legs: enShd(col, 0.1), boots: enShd(col, 0.25), head: 'bull', headCol: enLit(col, 0.05), weapon: 'none', crouch: 0.6, belt: 0 });
  x.restore();
} };
EN_DRAW.ca_boat = { f: function (x, H, p) { tfShip(x, H, p, { hull: '#7a5a38', deck: '#5a3e26', sail: 'none', oars: 1, crew: 1, len: 0.85 }); } };

// ===================== 8장 조선 요괴 (먹빛 그림) =====================
var TF_HB = { skin: '#d6a87a', tunic: '#efe8d8', legs: '#e2dccc', boots: '#3a3030', belt: '#3a5a8a' };
EN_DRAW.jo_tal = { f: function (x, H, p) { tfMan2(x, H, p, tfO(TF_HB, { tunic: '#c8483a', head: 'tal', weapon: 'drum', cape: '#2a5a8a', belt: '#e8c040' })); } };
EN_DRAW.jo_egg = { f: function (x, H, p) { if (!enMode) x.globalAlpha = 0.85; tfMan2(x, H, p, tfO(TF_HB, { head: 'egg', weapon: 'none', crouch: 0.1, cape: '#d8d4cc' })); x.globalAlpha = 1; } };
EN_DRAW.jo_crow = EN_DRAW.nr_raven;
function tfStripeBeast(x, H, p, o, headCol, hr0, ears) {
  var col = o.col;
  tfBeast(x, H, p, o, function (x, hx, hy) {
    var hr = H * hr0; hx += hr * 0.3;
    (ears || [[-0.5, 1], [0.2, 0]]).forEach(function (q) { e4Ov(x, hx + q[0] * hr, hy - hr * 0.85, hr * 0.24, hr * 0.26, q[1] ? enShd(col, 0.25) : col, 0, { d: 0, lw: 1 }); });
    var head = e4Bl([[hx - hr * 1.0, hy - hr * 0.1], [hx - hr * 0.6, hy - hr * 0.88], [hx + hr * 0.5, hy - hr * 0.85], [hx + hr * (o.snout || 1.15), hy - hr * 0.1], [hx + hr * 1.0, hy + hr * 0.55], [hx, hy + hr * 0.75], [hx - hr * 0.8, hy + hr * 0.5]]);
    e4F(x, head, col, { d: hr * 0.18, lw: 1.5 });
    e4Clip(x, head, function () { x.fillStyle = headCol; x.beginPath(); x.ellipse(hx + hr * 0.5, hy + hr * 0.45, hr * 0.62, hr * 0.38, 0, 0, Math.PI * 2); x.fill(); if (o.stripeCol) { x.fillStyle = o.stripeCol; [[-0.5, -0.8], [-0.1, -0.85], [0.3, -0.8]].forEach(function (q) { x.fillRect(hx + q[0] * hr, hy + q[1] * hr, hr * 0.12, hr * 0.4); }); } });
    e4Ov(x, hx + hr * ((o.snout || 1.15) - 0.1), hy + hr * 0.05, hr * 0.13, hr * 0.1, '#1a1410', 0, { d: 0, lw: 0.8 });
    if (!enMode) e4Eye(x, hx + hr * 0.45, hy - hr * 0.3, hr * 0.16, hr * 0.13, { w: o.eyeW || '#ffe070', ir: '#3a2010', pr: 0.35, px: 0.3 });
  });
}
EN_DRAW.jo_tiger = { f: function (x, H, p) {
  var col = '#d8843a';
  tfStripeBeast(x, H, p, { col: col, belly: '#f6e6c4', len: 0.82, ht: 0.3, leg: 0.24, legW: 0.1, run: 1, paw: '#f6e6c4', stripeCol: '#2a1a10',
    tail: function (x, by, a) { e4Line(x, [[-H * 0.4, by - H * 0.2], [-H * 0.56, by - H * 0.3 + Math.sin(a) * H * 0.04], [-H * 0.62, by - H * 0.2]], H * 0.05, col); },
    marks: function (x, body, by, ht, len) { e4Stripes(x, body, [-0.35, -0.2, -0.05, 0.1, 0.25].map(function (q) { return [q * len, by - ht * 0.95, q * len + H * 0.03, by - ht * 0.3, H * 0.04]; }), '#2a1a10'); }
  }, '#f6e6c4', 0.17);
  if (!enMode) { x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, -H * 0.1, -H * 0.55, H * 0.3, '#5fd8ff', 0.25); x.restore(); }
} };
EN_DRAW.jo_fox = { f: function (x, H, p) {
  var col = '#e8d8b8', a = p * Math.PI * 2;
  for (var i = 0; i < 3; i++) { var ta = -0.6 - i * 0.35 + Math.sin(a + i) * 0.08; e4Pill(x, [-H * 0.3, -H * 0.38], [-H * 0.3 + Math.cos(Math.PI + ta) * H * 0.34, -H * 0.38 + Math.sin(Math.PI + ta) * H * 0.34], H * 0.07, H * 0.03, i === 1 ? '#f6ecd8' : col); }
  tfStripeBeast(x, H, p, { col: col, belly: '#fffaf0', len: 0.7, ht: 0.24, leg: 0.24, legW: 0.07, run: 1, paw: '#fffaf0', snout: 1.5, eyeW: '#ffd040' }, '#fffaf0', 0.14, [[-0.45, 1], [0.15, 0]]);
  if (!enMode) { x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, -H * 0.5, -H * 0.55, H * 0.2, '#7ae8ff', 0.4); x.restore(); }
} };
EN_DRAW.jo_bulga = { f: function (x, H, p) {
  var col = '#6a6e74';
  tfStripeBeast(x, H, p, { col: col, belly: '#8a8e92', len: 0.86, ht: 0.38, leg: 0.2, legW: 0.13, run: 0.3, hump: 1.1, paw: '#4a4e54',
    tail: function (x, by, a) { e4Pill(x, [-H * 0.42, by - H * 0.15], [-H * 0.6, by - H * 0.05 + Math.sin(a) * H * 0.03], H * 0.08, H * 0.03, col); },
    marks: function (x, body, by, ht, len) { e4Clip(x, body, function () { x.fillStyle = 'rgba(200,210,220,0.35)'; for (var i = 0; i < 7; i++) { x.beginPath(); x.arc(-len * 0.4 + i * len * 0.13, by - ht * (0.7 + (i % 2) * 0.15), H * 0.04, 0, 7); x.fill(); } }); for (var j = 0; j < 5; j++) e4F(x, e4Po([[-len * 0.3 + j * len * 0.14, by - ht * 0.9], [-len * 0.26 + j * len * 0.14, by - ht * 1.25], [-len * 0.2 + j * len * 0.14, by - ht * 0.92]]), '#4a4e54', { d: 0, lw: 1 }); }
  }, '#8a8e92', 0.16, [[-0.4, 1], [0.25, 0]]);
} };
// 뱀 몸 공용: 물결치는 마디, 등지느러미, 뿔 머리. fly면 공중(구름), 아니면 물 위(잔물결)
function tfSerpent(x, H, p, o) {
  var a = p * Math.PI * 2, col = o.col, n = 9, pts = [], base = o.fly ? -H * 0.55 : -H * 0.12; EN_ONE = TFI;
  if (!o.fly) e4Ripple(x, 0, 0, H * 0.75, H * 0.12, 0.9, a);
  else if (!enMode) { x.save(); x.globalAlpha = 0.55; [[-0.4, 0.1, 0.28], [0.1, 0.16, 0.34], [0.5, 0.08, 0.22]].forEach(function (c) { e4Ov(x, c[0] * H, base + c[1] * H + H * 0.08, c[2] * H, c[2] * H * 0.35, '#4a4e5a', 0, { d: 0, lw: 0 }); }); x.restore(); }
  for (var i = 0; i <= n; i++) { var t = i / n, xx = -H * 0.75 + t * H * 1.25, yy = base - Math.sin(a + t * 6.2) * H * (o.fly ? 0.12 : 0.1) * (0.4 + t * 0.6) - (o.fly ? 0 : Math.max(0, Math.sin(a + t * 6.2)) * H * 0.12); pts.push([xx, yy]); }
  for (var j = 0; j < n; j++) { var w = H * (0.06 + 0.1 * (j / n)); if (!o.fly && Math.sin(a + (j + 0.5) / n * 6.2) < -0.3) continue; e4Pill(x, pts[j], pts[j + 1], w, w * 1.05, j % 2 ? col : enLit(col, 0.06)); if (j % 2 === 0 && j > 1) e4F(x, e4Po([[pts[j][0] - H * 0.03, pts[j][1] - w * 0.8], [pts[j][0], pts[j][1] - w * 1.6], [pts[j][0] + H * 0.04, pts[j][1] - w * 0.8]]), o.fin, { d: 0, lw: 1 }); }
  var hx = pts[n][0], hy = pts[n][1], hr = H * 0.15;
  e4F(x, e4Bl([[hx - hr * 0.6, hy + hr * 0.5], [hx - hr * 0.7, hy - hr * 0.6], [hx + hr * 0.4, hy - hr * 0.8], [hx + hr * 1.5, hy - hr * 0.3], [hx + hr * 1.6, hy + hr * 0.3], [hx + hr * 0.6, hy + hr * 0.7]]), col, { d: hr * 0.2, lw: 1.5 });
  tfHorn(x, [hx - hr * 0.2, hy - hr * 0.6], [hx - hr * 0.9, hy - hr * 1.2], [hx - hr * 1.4, hy - hr * 1.0], hr * 0.28, hr * 0.06, o.horn);
  if (o.whisker) { e4Line(x, [[hx + hr * 1.3, hy + hr * 0.2], [hx + hr * 1.9, hy + hr * 0.6], [hx + hr * 2.3, hy + hr * 0.4]], hr * 0.08, o.horn); }
  if (!enMode) { e4Eye(x, hx + hr * 0.55, hy - hr * 0.25, hr * 0.2, hr * 0.15, { w: '#fff6a0', ir: '#e05010', pr: 0.25, px: 0.3 }); x.fillStyle = '#fffaf0'; for (var k = 0; k < 4; k++) { x.beginPath(); x.moveTo(hx + hr * (0.6 + k * 0.25), hy + hr * 0.35); x.lineTo(hx + hr * (0.7 + k * 0.25), hy + hr * 0.6); x.lineTo(hx + hr * (0.8 + k * 0.25), hy + hr * 0.35); x.fill(); } }
  tfRune(x, pts[4][0], pts[4][1], H * 0.05, p);
}
EN_DRAW.jo_imugi = { n: 6, f: function (x, H, p) { tfSerpent(x, H, p, { col: '#2e4a46', fin: '#1a2a28', horn: '#d8ccaa' }); } };
EN_DRAW.jo_yong = { n: 6, f: function (x, H, p) { tfSerpent(x, H, p, { col: '#2a3a5a', fin: '#c8a040', horn: '#e8c040', fly: 1, whisker: 1 }); if (!enMode) { x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, H * 0.4, -H * 0.6, H * 0.4, '#a8d8ff', 0.25); x.restore(); } } };
EN_DRAW.jo_ship = { f: function (x, H, p) { tfShip(x, H, p, { hull: '#3a2a22', deck: '#1e1814', sail: 'junk', sailCol: '#5a4a3a', masts: 2, flag: '#1a1414', len: 1.0, cannons: 3 }); } };

// ===================== 9장 참호의 시대 =====================
EN_DRAW.tr_rifle = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#d4a070', tunic: '#6a6a4a', legs: '#5a5a3e', boots: '#3a2e20', helm: 'brodie', weapon: 'rifle', belt: '#4a3a24' }); } };
EN_DRAW.tr_gas = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#d4a070', tunic: '#5a6248', legs: '#4a5038', boots: '#2e2a1e', helm: 'gas', weapon: 'rifle', crouch: 0.3 }); if (!enMode) enGlow(x, -H * 0.1, -H * 0.3, H * 0.5, '#b8d070', 0.25); } };
EN_DRAW.tr_plane = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, cy = -H * 0.55 + Math.sin(a) * H * 0.02, col = '#8a7a4a'; EN_ONE = TFI;
  e4F(x, e4Po([[-H * 0.4, cy - H * 0.2], [H * 0.25, cy - H * 0.2], [H * 0.25, cy - H * 0.15], [-H * 0.4, cy - H * 0.15]]), enLit(col, 0.06), { d: 0, lw: 1.2 });
  e4Line(x, [[-H * 0.25, cy - H * 0.15], [-H * 0.25, cy + H * 0.03]], H * 0.015, '#3a2a1a'); e4Line(x, [[H * 0.12, cy - H * 0.15], [H * 0.12, cy + H * 0.03]], H * 0.015, '#3a2a1a');
  e4F(x, e4Bl([[-H * 0.48, cy - H * 0.02], [-H * 0.2, cy - H * 0.08], [H * 0.3, cy - H * 0.06], [H * 0.34, cy + H * 0.04], [-H * 0.2, cy + H * 0.06], [-H * 0.48, cy + H * 0.01]]), col, { d: H * 0.02, lw: 1.3 });
  e4F(x, e4Po([[-H * 0.48, cy - H * 0.02], [-H * 0.55, cy - H * 0.16], [-H * 0.4, cy - H * 0.04]]), col, { d: 0, lw: 1 });
  e4F(x, e4Po([[-H * 0.4, cy + H * 0.04], [H * 0.25, cy + H * 0.04], [H * 0.25, cy + H * 0.09], [-H * 0.4, cy + H * 0.09]]), col, { d: 0, lw: 1.2 });
  if (!enMode) { x.fillStyle = 'rgba(40,30,20,0.5)'; var pr = Math.abs(Math.sin(a * 6)); x.fillRect(H * 0.34, cy - H * 0.14 * pr, H * 0.02, H * 0.28 * pr); x.fillStyle = '#c8302a'; x.beginPath(); x.arc(-H * 0.05, cy - H * 0.175, H * 0.03, 0, 7); x.fill(); }
  tfRune(x, -H * 0.1, cy, H * 0.03, p);
} };
EN_DRAW.tr_zep = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, cy = -H * 0.6 + Math.sin(a) * H * 0.02; EN_ONE = TFI;
  e4Ov(x, 0, cy, H * 0.55, H * 0.2, '#a8a490', 0, { d: H * 0.05, lw: 1.5, hi: 0.4 });
  if (!enMode) { x.strokeStyle = 'rgba(60,60,50,0.4)'; x.lineWidth = Math.max(1, H * 0.01); for (var i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(i * H * 0.14, cy - H * 0.19); x.lineTo(i * H * 0.14, cy + H * 0.19); x.stroke(); } }
  e4F(x, e4Po([[-H * 0.5, cy], [-H * 0.66, cy - H * 0.18], [-H * 0.58, cy]]), '#8a8676', { d: 0, lw: 1.1 }); e4F(x, e4Po([[-H * 0.5, cy], [-H * 0.66, cy + H * 0.16], [-H * 0.58, cy]]), '#8a8676', { d: 0, lw: 1.1 });
  e4F(x, e4Po([[-H * 0.15, cy + H * 0.2], [H * 0.15, cy + H * 0.2], [H * 0.12, cy + H * 0.3], [-H * 0.12, cy + H * 0.3]]), '#5a4a3a', { d: 0, lw: 1.2 });
  tfRune(x, H * 0.1, cy, H * 0.06, p);
} };
EN_DRAW.tr_mk1 = { f: function (x, H, p) {
  var a = p * Math.PI * 2; EN_ONE = TFI;
  var body = e4Po([[-H * 0.55, -H * 0.18], [-H * 0.38, -H * 0.55], [H * 0.42, -H * 0.55], [H * 0.6, -H * 0.18], [H * 0.42, -H * 0.02], [-H * 0.38, -H * 0.02]]);
  e4F(x, body, '#6a6a4a', { d: H * 0.05, lw: 1.5, hi: 0.3 });
  if (!enMode) { x.fillStyle = '#3a3a2a'; for (var i = 0; i < 9; i++) { var tx = -H * 0.42 + i * H * 0.105 + (a * H * 0.02 % (H * 0.105)); x.fillRect(tx, -H * 0.06, H * 0.05, H * 0.04); } x.fillStyle = '#4a4a34'; x.fillRect(-H * 0.12, -H * 0.42, H * 0.24, H * 0.14); }
  e4Line(x, [[H * 0.1, -H * 0.35], [H * 0.35, -H * 0.38]], H * 0.04, '#3a3a2a');
  tfRune(x, -H * 0.15, -H * 0.3, H * 0.05, p);
} };

// ===================== 12장 정글 =====================
EN_DRAW.ju_croc = { f: function (x, H, p) {
  var col = '#4a6a3a';
  tfBeast(x, H, p, { col: col, belly: '#c8c890', len: 0.95, ht: 0.18, leg: 0.1, legW: 0.08, run: 0.4, paw: enShd(col, 0.2), bend: 0.02,
    tail: function (x, by, a) { e4Pill(x, [-H * 0.42, by - H * 0.08], [-H * 0.72, by - H * 0.02 + Math.sin(a) * H * 0.04], H * 0.12, H * 0.03, col); },
    marks: function (x, body, by, ht, len) { e4Stripes(x, body, [-0.3, -0.15, 0, 0.15, 0.3].map(function (q) { return [q * len, by - ht * 0.95, q * len + H * 0.02, by - ht * 0.6, H * 0.025]; }), enShd(col, 0.3)); }
  }, function (x, hx, hy) {
    var hr = H * 0.1; hy += hr * 0.6;
    e4F(x, e4Bl([[hx - hr * 0.6, hy - hr * 0.6], [hx + hr * 2.6, hy - hr * 0.2], [hx + hr * 2.7, hy + hr * 0.3], [hx - hr * 0.4, hy + hr * 0.6]]), col, { d: hr * 0.2, lw: 1.3 });
    if (!enMode) { x.fillStyle = '#fff'; for (var i = 0; i < 6; i++) { var tx = hx + i * hr * 0.4; x.beginPath(); x.moveTo(tx, hy + hr * 0.05); x.lineTo(tx + hr * 0.1, hy + hr * 0.3); x.lineTo(tx + hr * 0.2, hy + hr * 0.05); x.fill(); } e4Eye(x, hx + hr * 0.2, hy - hr * 0.6, hr * 0.2, hr * 0.16, { w: '#e8e070', ir: '#3a2a10', pr: 0.25, px: 0.3 }); }
  });
} };

// ===================== 15장 별의 전쟁 =====================
EN_DRAW.sp_grunt = { f: function (x, H, p) { tfMan2(x, H, p, { skin: '#7ac88a', tunic: '#3a2a6a', armor: '#6a5aa8', armorBands: 1, legs: '#3a2a6a', boots: '#1a1430', head: 'alien', weapon: 'blaster', belt: '#5ff0ff' }); } };
EN_DRAW.sp_saucer = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, cy = -H * 0.55 + Math.sin(a) * H * 0.04; EN_ONE = TFI;
  e4Ov(x, 0, cy - H * 0.08, H * 0.18, H * 0.14, '#a8e8ff', 0, { d: H * 0.02, lw: 1.2, hi: 0.6 });
  e4Ov(x, 0, cy, H * 0.48, H * 0.12, '#8a8aa8', 0, { d: H * 0.04, lw: 1.5, hi: 0.4 });
  if (!enMode) { for (var i = 0; i < 6; i++) { var lx = -H * 0.36 + i * H * 0.144, on = (Math.floor(p * 12) + i) % 3 === 0; x.fillStyle = on ? '#ffe060' : '#5ff0ff'; x.beginPath(); x.arc(lx, cy + H * 0.02, H * 0.025, 0, 7); x.fill(); } x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, 0, cy + H * 0.2, H * 0.3, '#7ff4ff', 0.3); x.restore(); }
} };
EN_DRAW.sp_mother = { n: 6, f: function (x, H, p) {
  var a = p * Math.PI * 2, cy = -H * 0.6 + Math.sin(a) * H * 0.02; EN_ONE = TFI;
  e4Ov(x, 0, cy - H * 0.14, H * 0.3, H * 0.18, '#c8a8ff', 0, { d: H * 0.02, lw: 1.3, hi: 0.6 });
  e4Ov(x, 0, cy, H * 0.62, H * 0.16, '#5a5a7a', 0, { d: H * 0.05, lw: 1.6, hi: 0.35 });
  e4Ov(x, 0, cy + H * 0.06, H * 0.4, H * 0.08, '#3a3a52', 0, { d: 0, lw: 1.2 });
  if (!enMode) { for (var i = 0; i < 9; i++) { var lx = -H * 0.52 + i * H * 0.13, on = (Math.floor(p * 18) + i) % 3 === 0; x.fillStyle = on ? '#ff6a8a' : '#a07bff'; x.beginPath(); x.arc(lx, cy, H * 0.025, 0, 7); x.fill(); } x.save(); x.globalCompositeOperation = 'lighter'; enGlow(x, 0, cy + H * 0.25, H * 0.45, '#a07bff', 0.35); x.restore(); }
  tfRune(x, 0, cy - H * 0.14, H * 0.07, p);
} };
EN_DRAW.sp_walker = { f: function (x, H, p) {
  var a = p * Math.PI * 2, by = -H * 0.6 + Math.abs(Math.sin(a)) * H * 0.03; EN_ONE = TFI;
  [[a + Math.PI, 0.18], [a, 0]].forEach(function (q) { var kx = -H * 0.05 + Math.sin(q[0]) * H * 0.12, fx = kx + Math.sin(q[0]) * H * 0.08, sh = q[1]; e4Line(x, [[0, by], [kx + H * 0.12, by + H * 0.28], [fx, -H * 0.02]], H * 0.06, enShd('#6a6a88', sh)); e4Ov(x, fx, -H * 0.03, H * 0.08, H * 0.03, enShd('#4a4a66', sh), 0, { d: 0, lw: 1 }); });
  e4F(x, e4Bl([[-H * 0.3, by - H * 0.05], [-H * 0.2, by - H * 0.3], [H * 0.25, by - H * 0.32], [H * 0.38, by - H * 0.12], [H * 0.2, by + H * 0.08], [-H * 0.25, by + H * 0.06]]), '#7a7a9a', { d: H * 0.04, lw: 1.5, hi: 0.4 });
  if (!enMode) { x.fillStyle = '#ff4a6a'; x.beginPath(); x.ellipse(H * 0.24, by - H * 0.18, H * 0.06, H * 0.035, 0, 0, 7); x.fill(); enGlow(x, H * 0.24, by - H * 0.18, H * 0.15, '#ff4a6a', 0.4); }
  e4Line(x, [[H * 0.25, by - H * 0.05], [H * 0.48, by - H * 0.06]], H * 0.04, '#4a4a66');
  tfRune(x, -H * 0.05, by - H * 0.12, H * 0.05, p);
} };
EN_DRAW.sp_blob = { f: function (x, H, p) {
  var a = p * Math.PI * 2, sq = Math.sin(a * 2) * 0.08, col = '#8ae86a'; EN_ONE = TFI;
  e4F(x, e4Bl([[-H * 0.38 * (1 + sq), -H * 0.02], [-H * 0.3, -H * 0.4 * (1 - sq)], [0, -H * 0.55 * (1 - sq)], [H * 0.3, -H * 0.42 * (1 - sq)], [H * 0.4 * (1 + sq), -H * 0.02]]), col, { d: H * 0.06, lw: 1.5, hi: 0.6 });
  if (!enMode) { x.save(); x.globalAlpha = 0.5; x.fillStyle = '#e8ffd8'; x.beginPath(); x.ellipse(-H * 0.12, -H * 0.36, H * 0.08, H * 0.05, -0.4, 0, 7); x.fill(); x.restore(); e4Eye(x, H * 0.08, -H * 0.3, H * 0.08, H * 0.09, { w: '#fffff0', ir: '#a02060', pr: 0.4, px: 0.3 }); e4Eye(x, H * 0.24, -H * 0.28, H * 0.06, H * 0.07, { w: '#fffff0', ir: '#a02060', pr: 0.4, px: 0.3 }); }
  tfRune(x, -H * 0.1, -H * 0.18, H * 0.05, p);
} };
