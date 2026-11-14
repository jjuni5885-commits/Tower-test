// ===== audio2.js : v2.0 새 효과음(묶음별로 필요할 때 녹음), 사건 → 소리 표(SND_EV), 챕터 음악(타이틀, 2~4장 전투, 우두머리 변주) =====
// 귀염판 장난감 소리보다 한 단계 묵직하게: 낮은 몸통(60~150Hz)과 짧은 타격음을 섞되, 높은 쪽은 깎아 귀가 아프지 않게.
// 소리 크기는 녹음 뒤 꼭대기 값을 정해진 값(def[2])으로 맞춘다 → 클리핑 없음, 소리마다 크기 추측이 필요 없음.
//
// [다른 갈래가 알아 둘 것]
// - 사건 소리: render.js의 rdEvents가 사건마다 SND_EV[이름](g, ev)를 부른다(고리 한 줄). 쏠 때 emit(g, 'muzzle', { tw, n }) 또는 'launch' { tw }를 내면
//   SND_TW[탑 키 | 공격 종류 st.kind]의 발사음이 난다. n이 3 이상이면 일제 사격 소리. 사건을 안 내도 표에 있는 탄(p.kind)이 생기면 안전망(sn2Tick)이 울린다.
//   탄이 없는 공격은 사건이 있어야 한다: 레이저 beamOn, 번개 chain, 폭발 blast { r, k }, 장승 muzzle { tw } 또는 'fear', 병사 'melee', 변신 transform, 합체 fuse,
//   전투기 출격 planeOut, 탑 멈춤 towerStun { why: 'hex' | 'charm' | 'emp' | 그 밖 }, 적 변신 morph { to }, 규칙 ruleEv { id: 'meteor' | 'blackout' | 'airraid' }.
// - 직접 울리기: sfx('이름', 크기). 새 소리 이름은 SN2_DEF의 키(보너스 게임: bnHit, bnGold, bnMatch, bnCoin, bnMiss, bnBomb, bnEnd). 새 소리는 묶음별로 처음 필요할 때 녹음하니
//   첫 소리부터 내려면 미리 SFX.warm('bonus') 처럼 묶음을 데운다(전투는 판에 들어갈 때 편성, 챕터, 뱃길, 항로를 보고 알아서 데움).
// - 음악: 화면은 예전처럼 MUSIC.play('menu' | 'battle' | 'boss' | 'victory' | 'defeat')만 부른다. 여기 sn2Song이 menu → title, battle → battle2~4, boss → boss2~4로 바꾼다
//   (전투 중이면 G.M.ch, 아니면 지금 진행 중인 판의 챕터). 옛 오르골 메뉴 곡은 MUSIC.play('menu1').
// - 시험: node tools/sndscore.js(악보와 표), python3 tools/sndcheck.py(녹음, 곡 전환, 가짜 사건, 동시 발음. bench를 붙이면 곡 녹음 시간), python3 tools/sndspec.py(그림).
//   콘솔: __snd.ev('blast', { r: 1.4, k: 'he' }), __snd.ev('muzzle', { tw: { k: 'gatling', lvl: 3 }, n: 1 }), __snd.play('navgun'), __snd.playM('battle'), __snd.mus(), __snd.keys()

// ---------- 소리 재료 ----------
// 묵직한 '쿵': 낮은 몸통만으로는 폰 스피커(300Hz 아래가 거의 안 남)에서 안 들린다 → 세게 찌그러뜨려 배음을 만들고, 중역의 '퉁'과 타격 잡음을 같이 낸다
function sn2Boom(c, d, t, f0, f1, dur, vol, amt) {
  var s = distort(c, d, (amt || 2.5) * 3);
  thump(c, s, t, f0, f1, dur, vol * 0.5);
  tone(c, s, 'triangle', f0 * 2.6, Math.max(190, f1 * 2.5), t, dur * 0.6, vol * 0.34, 0.002, dur * 0.4);
  nz(c, d, t, Math.min(0.14, dur * 0.7), vol * 0.6, 'bandpass', Math.min(1500, f0 * 5.5), Math.max(380, f0 * 2.4), 0.9, 0.002);
}
// 타격 순간의 '딱'
function sn2Crack(c, d, t, vol, f) { nz(c, d, t, 0.012, vol, 'highpass', f || 2200, f || 2200, 0.7, 0.001); nz(c, d, t, 0.03, vol * 0.6, 'bandpass', 1200, 700, 0.8, 0.001); }
// 지나가는 소리: 거르개가 f0 → f1(가장 가까울 때 pk초) → f2
function sn2Pass(c, d, t, dur, pk, vol, f0, f1, f2, q, type) {
  var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf(c); s.loop = true; f.type = type || 'bandpass'; f.Q.value = q || 1;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + pk); f.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + pk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(d); s.start(t, Math.random()); s.stop(t + dur + 0.03);
}
// 심벌
function sn2Cym(c, d, t, dur, vol) { nz(c, d, t, dur, vol, 'highpass', 5200, 6500, 0.7, 0.004); nz(c, d, t, dur * 0.6, vol * 0.5, 'bandpass', 3400, 3000, 0.9, 0.004); }
// 한 녹음(컨텍스트)에 한 번만 만드는 거르개. 음마다 거르개를 만들고 주파수를 움직이면 곡 녹음이 5배쯤 느려져서, 악기는 모두 이 공용 거르개를 지난다
function sn2Bus(c, d, key, type, freq, q) {
  var B = c._sn2 || (c._sn2 = {}), o = B[key];
  if (o && o.d === d) return o.f;
  var f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.8; f.connect(d); B[key] = { f: f, d: d }; return f;
}
// 금관 신스 한 음: 톱니 둘(살짝 어긋남, 아래에서 밀어 올림) + 붙는 순간의 밝은 '빰'
function sn2Brass(c, d, t, f, len, vol, vib) {
  var lo = sn2Bus(c, d, 'brLo', 'lowpass', 2300, 0.9), hi = sn2Bus(c, d, 'brHi', 'lowpass', 5000, 0.7), rel = Math.min(0.1, len * 0.4);
  var o1 = sndSus(c, lo, 'sawtooth', f * 0.98, f * 1.003, t, len, vol, 0.016, rel, 0.045), o2 = sndSus(c, lo, 'sawtooth', f * 0.975, f * 0.997, t, len, vol * 0.75, 0.016, rel, 0.045);
  tone(c, hi, 'sawtooth', f, f, t, 0.09, vol * 0.55, 0.008);
  if (vib && len > 0.5) { sndVib(c, o1, t + 0.2, len - 0.2, 5.2, f * 0.008 * vib); sndVib(c, o2, t + 0.2, len - 0.2, 5.2, f * 0.008 * vib); }
}
// 길게 남는 꼬리 (폭발의 우르릉, 총성의 메아리): 보통 잡음(nz)은 금방 사그라들어서, 천천히 줄다가 끝에서 닫는 꼴을 따로 둠
function sn2Tail(c, d, t, dur, vol, type, f0, f1, q) {
  var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf(c); s.loop = true; f.type = type || 'lowpass'; f.Q.value = q || 0.7;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(vol * 0.05, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(d); s.start(t, Math.random()); s.stop(t + dur + 0.03);
}
// 쇠 울림 (칼, 징, 탄피): 서로 안 어울리는 배음 몇 개
function sn2Metal(c, d, t, f, dur, vol, P) { P = P || [[1, 1, 1], [1.51, 0.6, 0.8], [2.13, 0.45, 0.6], [2.89, 0.3, 0.45], [3.7, 0.18, 0.3]]; var ny = c.sampleRate * 0.45; for (var i = 0; i < P.length; i++) { var q = f * P[i][0]; if (q < ny) tone(c, d, 'sine', q, q * 0.997, t, dur * P[i][2], vol * P[i][1], 0.0015); } }

// ---------- 새 효과음 { 이름: [길이, 만드는 함수, 꼭대기 값, 묶음] } ----------
var SN2_DEF = {
  // --- 총포 (gun) ---
  flak: [0.34, function (c, d) { sn2Boom(c, d, 0, 230, 72, 0.1, 0.8, 3); sn2Crack(c, d, 0, 0.75, 2600); nz(c, d, 0.004, 0.15, 0.55, 'bandpass', 1200, 520, 0.8, 0.002); nz(c, d, 0.03, 0.24, 0.07, 'lowpass', 2200, 500, 0.7, 0.01); }, 0.85, 'gun'],
  flakPop: [0.45, function (c, d) { sn2Boom(c, d, 0, 170, 64, 0.12, 0.6, 2); nz(c, d, 0, 0.2, 0.5, 'bandpass', 700, 260, 0.8, 0.003); nz(c, d, 0.01, 0.36, 0.16, 'lowpass', 1800, 300, 0.7, 0.02); for (var i = 0; i < 4; i++) nz(c, d, 0.05 + Math.random() * 0.2, 0.012, 0.12, 'bandpass', 1500 + Math.random() * 1500, 1500, 2, 0.001); }, 0.8, 'gun'],
  gat: [0.16, function (c, d) { sn2Boom(c, d, 0, 330, 130, 0.035, 0.7, 4); nz(c, d, 0, 0.006, 0.6, 'highpass', 3000, 3000, 0.7, 0.001); nz(c, d, 0.002, 0.055, 0.65, 'bandpass', 1600, 750, 0.9, 0.001); nz(c, d, 0.02, 0.1, 0.07, 'lowpass', 1800, 500, 0.7, 0.005); }, 0.8, 'gun'],
  gatB: [0.45, function (c, d) { for (var i = 0; i < 5; i++) { var t = i * 0.052 + Math.random() * 0.006, k = 1 - i * 0.06; sn2Boom(c, d, t, 320 + Math.random() * 30, 130, 0.032, 0.65 * k, 4); nz(c, d, t, 0.006, 0.45 * k, 'highpass', 3000, 3000, 0.7, 0.001); nz(c, d, t + 0.002, 0.05, 0.6 * k, 'bandpass', 1600, 750, 0.9, 0.001); } nz(c, d, 0.2, 0.2, 0.06, 'lowpass', 1600, 400, 0.7, 0.01); tone(c, d, 'sine', 2600, 2500, 0.27, 0.1, 0.03, 0.002); }, 0.8, 'gun'],
  snp: [1.1, function (c, d) { sn2Crack(c, d, 0, 0.9, 3000); sn2Boom(c, d, 0, 420, 85, 0.08, 0.8, 4); nz(c, d, 0.004, 0.24, 0.45, 'bandpass', 1900, 480, 0.8, 0.002); sn2Tail(c, d, 0.03, 1.0, 0.13, 'lowpass', 2600, 300); nz(c, d, 0.17, 0.3, 0.1, 'bandpass', 1300, 500, 0.8, 0.01); tone(c, d, 'sine', 3400, 1800, 0.01, 0.2, 0.05, 0.004, 0.18); }, 0.85, 'gun'],
  tankGun: [1.15, function (c, d) { sn2Crack(c, d, 0, 0.8, 1800); sn2Boom(c, d, 0, 140, 40, 0.4, 0.9, 3); nz(c, d, 0, 0.3, 0.65, 'bandpass', 750, 300, 0.8, 0.003); sn2Tail(c, d, 0.02, 1.05, 0.4, 'lowpass', 1600, 300); sn2Metal(c, d, 0.03, 520, 0.3, 0.06); }, 0.88, 'gun'],
  // --- 미사일, 로켓 (msl) ---
  mslFire: [1.3, function (c, d) { sn2Boom(c, d, 0, 190, 58, 0.16, 0.45, 2); sn2Pass(c, d, 0.01, 1.2, 0.3, 0.7, 450, 2400, 1300, 0.8); sn2Pass(c, d, 0.04, 1.1, 0.35, 0.16, 2500, 6500, 4000, 0.7, 'highpass'); tone(c, d, 'sine', 75, 48, 0, 0.6, 0.1, 0.05, 0.5); var o = sndSus(c, d, 'sine', 500, 1500, 0.02, 0.9, 0.05, 0.1, 0.6, 0.5); sndVib(c, o, 0.02, 0.9, 40, 30); }, 0.82, 'msl'],
  mslFly: [0.95, function (c, d) { sn2Pass(c, d, 0, 0.9, 0.3, 0.6, 1200, 2800, 500, 1.1); sn2Pass(c, d, 0, 0.85, 0.3, 0.14, 4000, 6000, 2500, 0.7, 'highpass'); var o = sndSus(c, d, 'sine', 1100, 520, 0, 0.85, 0.05, 0.3, 0.4); sndVib(c, o, 0, 0.85, 35, 25); }, 0.75, 'msl'],
  rkt: [0.5, function (c, d) { sn2Boom(c, d, 0, 270, 95, 0.06, 0.55, 3); sn2Pass(c, d, 0.005, 0.44, 0.09, 0.6, 600, 3000, 1500, 0.9); sn2Pass(c, d, 0.02, 0.4, 0.1, 0.14, 3500, 7000, 5000, 0.7, 'highpass'); }, 0.8, 'msl'],
  rktSalvo: [1.2, function (c, d) { for (var i = 0; i < 6; i++) { var t = i * 0.09 + Math.random() * 0.02, k = 0.9 + Math.random() * 0.25; sn2Boom(c, d, t, 270 * k, 95, 0.06, 0.5, 3); sn2Pass(c, d, t + 0.005, 0.5, 0.09, 0.5, 600 * k, 3000 * k, 1300, 0.9); } sn2Pass(c, d, 0.1, 1.0, 0.4, 0.12, 3000, 6500, 4000, 0.7, 'highpass'); tone(c, d, 'sine', 80, 50, 0, 0.7, 0.08, 0.05, 0.6); }, 0.85, 'msl'],
  sinarrow: [0.45, function (c, d) { sndTok(c, d, 0, 340, 0.3, 0.05); var o = sndSus(c, d, 'sine', 1300, 2500, 0.01, 0.3, 0.2, 0.02, 0.2, 0.22); sndVib(c, o, 0.01, 0.3, 28, 60); sn2Pass(c, d, 0.005, 0.4, 0.08, 0.3, 2500, 5000, 3500, 0.8); nz(c, d, 0, 0.03, 0.2, 'bandpass', 900, 600, 1, 0.002); }, 0.75, 'msl'],
  sinSalvo: [1.05, function (c, d) { for (var i = 0; i < 7; i++) { var t = i * 0.07 + Math.random() * 0.03, f = 1100 + Math.random() * 500; var o = sndSus(c, d, 'sine', f, f * 1.9, t, 0.3, 0.12, 0.02, 0.2, 0.22); sndVib(c, o, t, 0.3, 26 + Math.random() * 8, 60); sndTok(c, d, t, 300 + Math.random() * 80, 0.18, 0.04); } sn2Pass(c, d, 0, 0.95, 0.3, 0.3, 2200, 5200, 3500, 0.8); nz(c, d, 0.5, 0.45, 0.05, 'highpass', 5000, 7000, 0.8, 0.05); }, 0.8, 'msl'],
  // --- 폭발 (boom) ---
  blastHe: [1.5, function (c, d) { sn2Crack(c, d, 0, 0.7, 1800); sn2Boom(c, d, 0, 125, 36, 0.5, 1, 3); nz(c, d, 0, 0.45, 0.65, 'bandpass', 850, 320, 0.8, 0.004); sn2Tail(c, d, 0.02, 1.4, 0.5, 'lowpass', 1700, 300); for (var i = 0; i < 5; i++) nz(c, d, 0.15 + Math.random() * 0.6, 0.02, 0.07, 'bandpass', 900 + Math.random() * 1500, 900, 2, 0.001); }, 0.9, 'boom'],
  blastS: [0.65, function (c, d) { sn2Crack(c, d, 0, 0.5, 2000); sn2Boom(c, d, 0, 175, 58, 0.18, 0.85, 3); nz(c, d, 0, 0.22, 0.45, 'bandpass', 650, 240, 0.8, 0.003); sn2Tail(c, d, 0.01, 0.6, 0.34, 'lowpass', 2000, 400); }, 0.82, 'boom'],
  blastFire: [1.25, function (c, d) { sn2Boom(c, d, 0, 145, 48, 0.26, 0.8, 2); sn2Pass(c, d, 0, 1.0, 0.12, 0.55, 300, 1300, 420, 0.7); sn2Tail(c, d, 0.02, 1.15, 0.26, 'lowpass', 1800, 400); for (var i = 0; i < 9; i++) nz(c, d, 0.1 + Math.random() * 0.9, 0.012, 0.14, 'highpass', 2500 + Math.random() * 2000, 3000, 1, 0.001); }, 0.85, 'boom'],
  blastEmp: [1.15, function (c, d) { var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(d); sndSus(c, lp, 'square', 1900, 70, 0, 0.55, 0.22, 0.004, 0.2, 0.5); var tr = sndTrem(c, lp, 0, 0.95, 31, 0.7); sndSus(c, tr, 'sawtooth', 124, 100, 0, 0.9, 0.3, 0.02, 0.5); sn2Boom(c, d, 0, 110, 45, 0.45, 0.4, 2); sn2Pass(c, d, 0, 0.7, 0.05, 0.25, 6000, 3000, 600, 1.2); for (var i = 0; i < 6; i++) nz(c, d, 0.08 + Math.random() * 0.6, 0.02, 0.16, 'bandpass', 3000 + Math.random() * 1500, 3000, 1.5, 0.001); }, 0.85, 'boom'],
  blastHoly: [1.3, function (c, d) { sn2Boom(c, d, 0, 160, 70, 0.2, 0.4, 1.5); [72, 76, 79, 84].forEach(function (m, i) { sndBar(c, d, i * 0.012, mtof(m), 1.0, 0.16, 'glk'); }); sndBar(c, d, 0, mtof(60), 1.1, 0.2, 'toy'); nz(c, d, 0, 0.8, 0.07, 'highpass', 5000, 8000, 0.8, 0.02); sndSparkle(c, d, 0.1, 6, 0.6, 91, 106, 0.05, 0.4); }, 0.75, 'boom'],
  blastDark: [1.2, function (c, d) { var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 2; lp.connect(d); var tr = sndTrem(c, lp, 0, 1.1, 17, 0.5); sndSus(c, tr, 'sawtooth', 82, 46, 0, 1.05, 0.5, 0.03, 0.6, 0.9); sndSus(c, d, 'sine', 123, 69, 0, 1.0, 0.3, 0.03, 0.6, 0.9); sndSus(c, d, 'sine', 130, 73, 0, 1.0, 0.25, 0.03, 0.6, 0.9); sn2Pass(c, d, 0, 1.0, 0.1, 0.3, 900, 500, 120, 0.8); sn2Boom(c, d, 0, 110, 44, 0.3, 0.6, 2); }, 0.82, 'boom'],
  splash2: [1.15, function (c, d) { sn2Boom(c, d, 0, 135, 50, 0.2, 0.45, 2); sn2Pass(c, d, 0, 0.75, 0.07, 0.75, 900, 3400, 1500, 0.7); sn2Pass(c, d, 0.1, 0.95, 0.25, 0.2, 3500, 6000, 4500, 0.7, 'highpass'); for (var i = 0; i < 6; i++) sndPlip(c, d, 0.35 + Math.random() * 0.6, 500 + Math.random() * 900, 0.04, 0.1, 2.2); }, 0.82, 'boom'],
  // --- 에너지 (nrg) ---
  laser: [0.6, function (c, d) { var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(2600, 0); bp.frequency.exponentialRampToValueAtTime(1500, 0.5); bp.connect(d); var o = sndSus(c, bp, 'sawtooth', 1500, 900, 0, 0.5, 0.35, 0.012, 0.25, 0.45); sndVib(c, o, 0, 0.5, 38, 70); sndSus(c, d, 'sine', 2700, 1750, 0, 0.45, 0.07, 0.01, 0.25, 0.4); sndSus(c, d, 'triangle', 360, 240, 0, 0.4, 0.1, 0.01, 0.25); nz(c, d, 0, 0.3, 0.05, 'highpass', 6000, 8000, 1, 0.01); }, 0.72, 'nrg'],
  tesla: [0.55, function (c, d) { var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900; lp.connect(d); var tr = sndTrem(c, lp, 0, 0.4, 55, 0.8); sndSus(c, tr, 'sawtooth', 224, 196, 0, 0.36, 0.3, 0.004, 0.15); tone(c, d, 'sine', 2600, 380, 0, 0.09, 0.45, 0.002, 0.08); for (var i = 0; i < 8; i++) { var t = Math.random() * 0.34; nz(c, d, t, 0.02 + Math.random() * 0.02, 0.45 + Math.random() * 0.4, 'bandpass', 2500 + Math.random() * 2500, 2000, 1.2, 0.001); } sn2Boom(c, d, 0, 190, 90, 0.07, 0.25, 2); }, 0.8, 'nrg'],
  powerDown: [0.85, function (c, d) { var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1500, 0); lp.frequency.exponentialRampToValueAtTime(180, 0.7); lp.connect(d); var tr = sndTrem(c, lp, 0, 0.8, 24, 0.4); sndSus(c, tr, 'sawtooth', 420, 52, 0, 0.75, 0.4, 0.01, 0.3, 0.7); sndTok(c, d, 0, 500, 0.3, 0.05); sn2Boom(c, d, 0.6, 90, 45, 0.15, 0.3, 2); }, 0.75, 'nrg'],
  // --- 바다 (sea) ---
  navgun: [1.7, function (c, d) { sn2Crack(c, d, 0, 0.8, 1500); sn2Boom(c, d, 0, 100, 30, 0.7, 1, 3); nz(c, d, 0, 0.55, 0.7, 'bandpass', 650, 240, 0.8, 0.004); sn2Tail(c, d, 0.02, 1.6, 0.5, 'lowpass', 1400, 260); nz(c, d, 0.38, 0.9, 0.13, 'lowpass', 1100, 200, 0.7, 0.08); }, 0.9, 'sea'],
  ball: [1.0, function (c, d) { sndTok(c, d, 0, 230, 0.4, 0.07); sn2Boom(c, d, 0, 155, 46, 0.34, 0.9, 2.5); nz(c, d, 0, 0.3, 0.45, 'bandpass', 520, 190, 0.8, 0.004); sn2Tail(c, d, 0.02, 0.9, 0.36, 'lowpass', 1700, 320); nz(c, d, 0.05, 0.6, 0.07, 'highpass', 2600, 3500, 0.8, 0.08); }, 0.86, 'sea'],
  torpedo: [0.85, function (c, d) { sn2Pass(c, d, 0, 0.8, 0.2, 0.5, 300, 950, 350, 0.9); for (var i = 0; i < 9; i++) sndPlip(c, d, 0.03 + i * 0.07 + Math.random() * 0.03, 260 + Math.random() * 380, 0.05, 0.22, 1.9); sn2Boom(c, d, 0, 120, 60, 0.12, 0.4, 2); }, 0.75, 'sea'],
  // --- 하늘 (air) ---
  jet: [1.45, function (c, d) { sn2Pass(c, d, 0, 1.4, 0.55, 0.7, 500, 3000, 380, 0.9); sn2Pass(c, d, 0.1, 1.2, 0.45, 0.2, 3000, 7000, 2500, 0.7, 'highpass'); var o = sndSus(c, d, 'sine', 1300, 1300, 0, 1.3, 0.07, 0.5, 0.6); o.frequency.setValueAtTime(1300, 0); o.frequency.linearRampToValueAtTime(1900, 0.55); o.frequency.exponentialRampToValueAtTime(620, 1.3); var tr = sndTrem(c, d, 0, 1.4, 70, 0.3); sndSus(c, tr, 'sawtooth', 110, 70, 0.2, 1.1, 0.12, 0.35, 0.6, 1.0); }, 0.8, 'air'],
  bomber: [2.1, function (c, d) { var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(d); var tr = sndTrem(c, lp, 0, 2.0, 23, 0.45); sndSus(c, tr, 'sawtooth', 84, 80, 0, 2.0, 0.3, 0.7, 0.9); sndSus(c, tr, 'sawtooth', 87.5, 83, 0, 2.0, 0.3, 0.7, 0.9); sndSus(c, tr, 'sawtooth', 169, 161, 0, 2.0, 0.22, 0.7, 0.9); sndSus(c, tr, 'square', 254, 242, 0, 2.0, 0.1, 0.7, 0.9); sn2Pass(c, d, 0, 2.0, 0.9, 0.2, 300, 800, 280, 0.8); }, 0.7, 'air'],
  bombDrop: [0.95, function (c, d) { var o = sndSus(c, d, 'sine', 2300, 650, 0, 0.9, 0.3, 0.25, 0.2); sndVib(c, o, 0, 0.9, 9, 22); sndSus(c, d, 'triangle', 4600, 1300, 0, 0.9, 0.04, 0.25, 0.2); sn2Pass(c, d, 0.2, 0.7, 0.5, 0.08, 3000, 1800, 900, 2); }, 0.6, 'air'],
  alarm: [1.3, function (c, d) { var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2300; lp.connect(d); for (var i = 0; i < 3; i++) { var t = i * 0.36; sndSus(c, lp, 'square', 620, 930, t, 0.27, 0.16, 0.012, 0.05, 0.2); sndSus(c, d, 'sine', 620, 930, t, 0.27, 0.22, 0.012, 0.05, 0.2); sndSus(c, d, 'sine', 310, 465, t, 0.27, 0.12, 0.012, 0.05, 0.2); } }, 0.62, 'air'],
  meteor: [1.25, function (c, d) { var o = sndSus(c, d, 'sine', 1900, 260, 0, 1.2, 0.2, 0.3, 0.2); sndVib(c, o, 0, 1.2, 13, 30); sn2Pass(c, d, 0, 1.2, 0.85, 0.5, 2600, 900, 300, 0.9); sndSus(c, d, 'sawtooth', 160, 60, 0.3, 0.9, 0.08, 0.4, 0.2); }, 0.75, 'air'],
  // --- 4장 전통 (kor) ---
  drum: [0.95, function (c, d) { sn2Boom(c, d, 0, 118, 60, 0.5, 1, 2); tone(c, d, 'triangle', 300, 180, 0, 0.22, 0.4, 0.002, 0.12); nz(c, d, 0, 0.05, 0.55, 'bandpass', 700, 450, 1, 0.001); sndTok(c, d, 0, 190, 0.3, 0.06); nz(c, d, 0.01, 0.5, 0.06, 'lowpass', 500, 120, 0.7, 0.02); }, 0.88, 'kor'],
  talisman: [0.55, function (c, d) { [0, 0.045, 0.085].forEach(function (t, i) { nz(c, d, t, 0.03, 0.3 - i * 0.06, 'bandpass', 2600 + i * 700, 3800, 1.2, 0.004); }); sn2Pass(c, d, 0, 0.2, 0.06, 0.15, 1500, 4500, 3000, 1); sndBar(c, d, 0.11, 1568, 0.36, 0.2, 'glk'); sndBar(c, d, 0.11, 2349, 0.3, 0.08, 'glk'); }, 0.7, 'kor'],
  seal: [1.0, function (c, d) { sn2Metal(c, d, 0, 392, 0.9, 0.3, [[1, 1, 1], [1.5, 0.5, 0.9], [2.02, 0.45, 0.7], [2.76, 0.25, 0.5], [3.4, 0.12, 0.35]]); sn2Boom(c, d, 0, 150, 80, 0.15, 0.4, 1.5); nz(c, d, 0, 0.5, 0.05, 'highpass', 5000, 8000, 0.8, 0.01); var o = tone(c, d, 'sine', 784, 760, 0.02, 0.8, 0.08, 0.01); sndVib(c, o, 0.02, 0.8, 5, 8); }, 0.75, 'kor'],
  sword: [0.42, function (c, d) { sn2Pass(c, d, 0, 0.12, 0.05, 0.3, 1400, 5000, 3000, 1); sn2Metal(c, d, 0.07, 2150, 0.26, 0.3, [[1, 1, 1], [1.47, 0.7, 0.8], [2.09, 0.5, 0.55], [2.56, 0.3, 0.4]]); nz(c, d, 0.07, 0.008, 0.3, 'highpass', 4000, 4000, 0.7, 0.001); sndBoop(c, d, 0.07, 300, 180, 0.04, 0.2); }, 0.7, 'kor'],
  dokkaebi: [0.85, function (c, d) { sndTok(c, d, 0, 520, 0.6, 0.08); sndBoop(c, d, 0, 200, 110, 0.08, 0.4); sndTok(c, d, 0.13, 690, 0.55, 0.08); sndBoop(c, d, 0.13, 240, 130, 0.07, 0.3); [0.32, 0.45, 0.58].forEach(function (t, i) { var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 950 - i * 60; bp.Q.value = 2.2; bp.connect(d); var o = sndSus(c, bp, 'sawtooth', 235 - i * 18, 190 - i * 16, t, 0.11, 0.5, 0.012, 0.05, 0.1); sndVib(c, o, t, 0.11, 24, 12); }); }, 0.75, 'kor'],
  // --- 2장 으스스 (spook). 무섭기보다 익살스럽게 ---
  ghost: [1.35, function (c, d) { var o = sndSus(c, d, 'sine', 520, 520, 0, 1.25, 0.3, 0.3, 0.6); o.frequency.setValueAtTime(520, 0); o.frequency.linearRampToValueAtTime(700, 0.45); o.frequency.linearRampToValueAtTime(455, 1.25); sndVib(c, o, 0, 1.25, 5.2, 13); var o2 = sndSus(c, d, 'triangle', 260, 260, 0, 1.25, 0.1, 0.3, 0.6); o2.frequency.setValueAtTime(260, 0); o2.frequency.linearRampToValueAtTime(350, 0.45); o2.frequency.linearRampToValueAtTime(228, 1.25); sn2Pass(c, d, 0, 1.25, 0.45, 0.1, 900, 1700, 800, 4); }, 0.6, 'spook'],
  curse: [0.75, function (c, d) { var o = sndSus(c, d, 'triangle', 720, 240, 0, 0.6, 0.35, 0.01, 0.25, 0.55); sndVib(c, o, 0, 0.6, 17, 45); sndSus(c, d, 'sine', 190, 95, 0, 0.6, 0.3, 0.01, 0.25, 0.55); [75, 72, 69, 66].forEach(function (m, i) { sndBar(c, d, i * 0.09, mtof(m), 0.25, 0.1, 'xyl'); }); }, 0.68, 'spook'],
  charm: [0.8, function (c, d) { sndArp(c, d, 0, [76, 78, 80, 82, 84, 86], 0.055, 0.4, 0.14, 'box'); var o = sndSus(c, d, 'sine', 660, 990, 0, 0.6, 0.12, 0.05, 0.3, 0.5); sndVib(c, o, 0, 0.6, 7, 25); sndSparkle(c, d, 0.3, 4, 0.3, 93, 105, 0.05, 0.3); }, 0.65, 'spook'],
  stun: [0.65, function (c, d) { sn2Boom(c, d, 0, 210, 85, 0.12, 0.7, 2); nz(c, d, 0, 0.02, 0.3, 'bandpass', 1500, 900, 1, 0.001); sndBoing(c, d, 0.07, 880, 470, 0.5, 0.22, 13, 0.12); sndBar(c, d, 0.1, 1976, 0.2, 0.06, 'glk'); }, 0.7, 'spook'],
  morph: [1.05, function (c, d) { sn2Pass(c, d, 0, 0.75, 0.5, 0.4, 300, 3000, 1200, 0.9); var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, 0); lp.frequency.exponentialRampToValueAtTime(2400, 0.55); lp.connect(d); sndSus(c, lp, 'sawtooth', 110, 330, 0, 0.6, 0.25, 0.1, 0.1, 0.55); sndSus(c, lp, 'sawtooth', 112, 392, 0, 0.6, 0.2, 0.1, 0.1, 0.55); sn2Boom(c, d, 0.58, 170, 60, 0.2, 0.8, 2); sn2Crack(c, d, 0.58, 0.4); [69, 72, 76, 81].forEach(function (m, i) { sndBar(c, d, 0.6 + i * 0.03, mtof(m), 0.4, 0.1, 'glk'); }); }, 0.78, 'spook'],
  // --- 변신, 합체 (core) ---
  transform: [1.5, function (c, d) {
    sn2Pass(c, d, 0, 0.42, 0.33, 0.3, 500, 4500, 2500, 0.9); tone(c, d, 'sine', 300, 1500, 0, 0.33, 0.12, 0.05, 0.33);
    sn2Boom(c, d, 0.34, 185, 58, 0.22, 0.8, 2.5); sn2Crack(c, d, 0.34, 0.4); sn2Cym(c, d, 0.34, 0.9, 0.09);
    [67, 72, 76].forEach(function (m, i) { sn2Brass(c, d, 0.34 + i * 0.085, mtof(m), 0.1, 0.16); });
    [79, 76, 72].forEach(function (m, i) { sn2Brass(c, d, 0.6, mtof(m), 0.62, i ? 0.09 : 0.17, 1); });
    [91, 96].forEach(function (m, i) { sndBar(c, d, 0.6 + i * 0.04, mtof(m), 0.6, 0.07, 'glk'); }); sndSparkle(c, d, 0.7, 7, 0.55, 88, 106, 0.045, 0.35);
  }, 0.8, 'core'],
  transformU: [2.4, function (c, d) {
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(200, 0); lp.frequency.exponentialRampToValueAtTime(2600, 0.6); lp.connect(d);
    sndSus(c, lp, 'sawtooth', 55, 110, 0, 0.66, 0.3, 0.3, 0.06, 0.6); sndSus(c, lp, 'sawtooth', 82, 165, 0, 0.66, 0.22, 0.3, 0.06, 0.6);
    sn2Pass(c, d, 0, 0.7, 0.6, 0.3, 400, 5000, 3000, 0.8); tone(c, d, 'sine', 220, 1760, 0, 0.6, 0.08, 0.1, 0.6);
    sn2Boom(c, d, 0.62, 120, 34, 0.5, 1, 3); sn2Crack(c, d, 0.62, 0.5, 1800); sn2Tail(c, d, 0.63, 1.2, 0.34, 'lowpass', 1500, 300); sn2Cym(c, d, 0.62, 1.5, 0.13);
    [48, 60, 64, 67].forEach(function (m) { sn2Brass(c, d, 0.62, mtof(m), 0.3, 0.11); });
    [[72, 0.98, 0.12], [76, 1.12, 0.12], [79, 1.26, 0.12], [84, 1.4, 0.85]].forEach(function (n, i) { sn2Brass(c, d, n[1], mtof(n[0]), n[2], 0.17, i === 3 ? 1 : 0); sn2Brass(c, d, n[1], mtof(n[0] - 12), n[2], 0.1); });
    [64, 67, 72].forEach(function (m) { sn2Brass(c, d, 1.4, mtof(m), 0.85, 0.07, 1); }); sn2Boom(c, d, 1.4, 130, 50, 0.3, 0.6, 2);
    sndArp(c, d, 1.4, [84, 88, 91, 96, 100], 0.05, 0.7, 0.06, 'glk'); sndSparkle(c, d, 1.5, 12, 0.75, 86, 108, 0.045, 0.4);
  }, 0.85, 'core'],
  fuse: [3.0, function (c, d) {
    // 두 음이 한 음으로 끌려와 '철컥' 맞물리고 → 큰 울림 → 금관 팡파르
    var tr = sndTrem(c, d, 0, 0.75, 14, 0.3); sndSus(c, tr, 'triangle', 196, 392, 0, 0.72, 0.22, 0.05, 0.05, 0.7); sndSus(c, tr, 'triangle', 784, 392, 0, 0.72, 0.16, 0.05, 0.05, 0.7); sn2Pass(c, d, 0, 0.75, 0.68, 0.25, 300, 3500, 2500, 0.9);
    sndTok(c, d, 0.72, 300, 0.6, 0.06); sn2Metal(c, d, 0.72, 1180, 0.14, 0.2); nz(c, d, 0.72, 0.012, 0.4, 'highpass', 3000, 3000, 0.7, 0.001);
    sn2Boom(c, d, 0.82, 120, 34, 0.55, 1, 3); sn2Crack(c, d, 0.82, 0.5, 1700); sn2Tail(c, d, 0.83, 1.3, 0.34, 'lowpass', 1500, 300); sn2Cym(c, d, 0.82, 1.8, 0.14);
    [[67, 0.92, 0.1], [72, 1.04, 0.1], [76, 1.16, 0.1], [79, 1.28, 0.22], [77, 1.54, 0.1], [79, 1.66, 0.1], [84, 1.78, 1.05]].forEach(function (n, i) { sn2Brass(c, d, n[1], mtof(n[0]), n[2], 0.17, i === 6 ? 1 : 0); sn2Brass(c, d, n[1], mtof(n[0] - 12), n[2], 0.09); });
    [60, 64, 67, 72, 76].forEach(function (m) { sn2Brass(c, d, 1.78, mtof(m), 1.05, 0.055, 1); });
    [[36, 0.92], [43, 1.28], [36, 1.78]].forEach(function (b) { sn2Boom(c, d, b[1], mtof(b[0]) * 2.2, mtof(b[0]), 0.35, 0.5, 2); });
    sn2Cym(c, d, 1.78, 1.1, 0.1); sndArp(c, d, 1.8, [84, 88, 91, 96, 100, 103], 0.05, 0.8, 0.055, 'glk'); sndSparkle(c, d, 1.9, 14, 0.9, 86, 108, 0.045, 0.45);
  }, 0.85, 'core'],
  // --- 보너스 게임 (bonus) ---
  bnHit: [0.35, function (c, d) { sndTok(c, d, 0, 880, 0.5, 0.06); sndBoop(c, d, 0, 320, 170, 0.06, 0.4); sndBar(c, d, 0.02, 1760, 0.28, 0.2, 'glk'); nz(c, d, 0, 0.01, 0.2, 'bandpass', 2600, 2600, 1.5, 0.001); }, 0.72, 'bonus'],
  bnGold: [0.95, function (c, d) { sndBoop(c, d, 0, 360, 190, 0.07, 0.35); sndArp(c, d, 0, [84, 88, 91, 96], 0.05, 0.5, 0.17, 'xyl'); sndArp(c, d, 0.2, [96, 100, 103], 0.045, 0.6, 0.1, 'glk'); tone(c, d, 'sine', 2637, 2637, 0.2, 0.3, 0.07, 0.001); sndSparkle(c, d, 0.3, 8, 0.5, 91, 108, 0.05, 0.35); }, 0.75, 'bonus'],
  bnMatch: [0.6, function (c, d) { sndBar(c, d, 0, mtof(79), 0.3, 0.22, 'box'); sndBar(c, d, 0.1, mtof(84), 0.45, 0.24, 'box'); sndBar(c, d, 0.1, mtof(91), 0.4, 0.08, 'glk'); sndSparkle(c, d, 0.2, 3, 0.2, 96, 106, 0.04, 0.25); }, 0.7, 'bonus'],
  bnCoin: [0.3, function (c, d) { tone(c, d, 'sine', 1568, 1568, 0, 0.08, 0.16, 0.001); tone(c, d, 'sine', 2093, 2093, 0.035, 0.2, 0.18, 0.001); tone(c, d, 'sine', 4186, 4186, 0.035, 0.08, 0.04, 0.001); sndPlip(c, d, 0, 500, 0.03, 0.12, 2); }, 0.6, 'bonus'],
  bnMiss: [0.3, function (c, d) { sndBoop(c, d, 0, 270, 170, 0.12, 0.45); sndTok(c, d, 0, 420, 0.25, 0.05); }, 0.6, 'bonus'],
  bnBomb: [0.7, function (c, d) { sn2Boom(c, d, 0, 190, 70, 0.14, 0.7, 2); sndPuff(c, d, 0, 0.35, 0.4, 1700, 260); sndSlide(c, d, 0.08, 800, 240, 0.45, 0.2); }, 0.75, 'bonus'],
  bnEnd: [1.3, function (c, d) { [[72, 0], [76, 0.11], [79, 0.22], [84, 0.33]].forEach(function (n, i) { sn2Brass(c, d, n[1], mtof(n[0]), i === 3 ? 0.6 : 0.09, 0.15, i === 3 ? 1 : 0); sndBar(c, d, n[1], mtof(n[0] + 12), 0.5, 0.1, 'xyl'); }); sn2Cym(c, d, 0.33, 0.8, 0.07); sndSparkle(c, d, 0.4, 8, 0.6, 88, 106, 0.045, 0.35); }, 0.72, 'bonus']
};
// 동시 발음 제한 [최소 간격 ms, 같은 소리 동시 발음 수, 겹칠 때마다 곱하는 크기]
(function () {
  var L = { flak: [70, 3, 0.75], flakPop: [85, 3, 0.75], gat: [58, 3, 0.7], gatB: [170, 2, 0.7], snp: [130, 2, 0.8], tankGun: [220, 2, 0.8], mslFire: [150, 3, 0.75], mslFly: [350, 2, 0.8], rkt: [75, 4, 0.8], rktSalvo: [380, 2, 0.8],
    sinarrow: [65, 4, 0.75], sinSalvo: [330, 2, 0.8], blastHe: [120, 3, 0.75], blastS: [75, 4, 0.75], blastFire: [130, 3, 0.8], blastEmp: [260, 2, 0.8], blastHoly: [160, 2, 0.8], blastDark: [160, 2, 0.8], splash2: [130, 3, 0.8],
    laser: [280, 2, 0.7], tesla: [95, 3, 0.75], powerDown: [400, 1, 1], navgun: [220, 2, 0.8], ball: [120, 3, 0.8], torpedo: [220, 2, 0.8], jet: [600, 2, 0.7], bomber: [1800, 1, 1], bombDrop: [220, 3, 0.75], alarm: [1600, 1, 1], meteor: [500, 2, 0.8],
    drum: [220, 2, 0.8], talisman: [95, 3, 0.75], seal: [220, 2, 0.8], sword: [85, 3, 0.75], dokkaebi: [900, 1, 1], ghost: [900, 1, 1], curse: [320, 2, 0.8], charm: [320, 2, 0.8], stun: [300, 2, 0.8], morph: [450, 2, 0.8],
    transform: [300, 2, 0.8], transformU: [800, 1, 1], fuse: [1000, 1, 1], bnHit: [50, 4, 0.85], bnGold: [200, 2, 0.9], bnMatch: [120, 2, 0.9], bnCoin: [45, 5, 0.9], bnMiss: [90, 2, 0.9], bnBomb: [200, 2, 0.9], bnEnd: [800, 1, 1] };
  for (var k in L) SFX_LIM[k] = L[k];
})();

// ---------- 묶음별 녹음 (처음 필요할 때) ----------
var SN2 = { state: {}, cbs: {}, evShot: {}, shotAt: 0, amb: {}, g: null, seen: null, timer: 0, ms: {} };
// 녹음 뒤 손질: (1) 낮은 쪽(220Hz 아래)을 65% 덜어 냄: 폰 스피커는 그 아래를 못 내고, 꼭대기 값을 낮은 몸통이 다 차지하면 정작 들리는 중역이 작아진다
// (2) 꼭대기 값을 target으로 맞춤 (3) 끝 8ms를 부드럽게 닫음
function sn2Norm(b, target) {
  var d = b.getChannelData(0), n = d.length, pk = 0, i, a, f = Math.min(n, Math.round(b.sampleRate * 0.008)), q = Math.exp(-6.2832 * 220 / b.sampleRate), lp = 0;
  for (i = 0; i < n; i++) { lp = lp * q + d[i] * (1 - q); d[i] -= 0.65 * lp; }
  for (i = 0; i < n; i++) { a = d[i] < 0 ? -d[i] : d[i]; if (a > pk) pk = a; }
  if (pk > 0.0001) { var k = target / pk; for (i = 0; i < n; i++) d[i] *= k; }
  for (i = 0; i < f; i++) d[n - 1 - i] *= i / f;
}
function sn2Group(name, cb) {
  var st = SN2.state[name];
  if (st === 2) { if (cb) cb(); return; }
  if (st === 1) { if (cb) SN2.cbs[name].push(cb); return; }
  var keys = Object.keys(SN2_DEF).filter(function (k) { return SN2_DEF[k][3] === name; }), i = 0, live = 0, t0 = performance.now();
  if (!keys.length) { if (cb) cb(); return; }
  SN2.state[name] = 1; SN2.cbs[name] = cb ? [cb] : [];
  function next() {
    if (i >= keys.length) { if (!live && SN2.state[name] === 1) { SN2.state[name] = 2; SN2.ms[name] = Math.round(performance.now() - t0); SN2.cbs[name].forEach(function (f) { try { f(); } catch (e) { } }); SN2.cbs[name] = []; } return; }
    var k = keys[i++], def = SN2_DEF[k]; live++;
    renderOffline(1, 32000, def[0] + 0.03, function (ctx, out) { def[1](ctx, out); }).then(function (b) { if (b) { sn2Norm(b, def[2] || 0.8); SFX_BUF[k] = b; } live--; setTimeout(next, 0); });
  }
  next(); next();
}
function sn2Need(k) { var D = SN2_DEF[k]; if (D) sn2Group(D[3]); }
SFX.need = sn2Need;
// 미리 데우기: 묶음 이름들, 또는 'all'
function sn2Warm(list, cb) {
  if (list === 'all') { list = []; for (var k in SN2_DEF) if (list.indexOf(SN2_DEF[k][3]) < 0) list.push(SN2_DEF[k][3]); }
  if (typeof list === 'string') list = [list];
  var left = list.length; if (!left) { if (cb) cb(); return; }
  list.forEach(function (n) { sn2Group(n, function () { if (--left === 0 && cb) cb(); }); });
}
SFX.warm = sn2Warm;

// ---------- 탑, 탄 → 발사음 표. 키는 탑 키, 공격 종류(st.kind), 탄 종류(p.kind) 아무거나. [소리, 크기, 여러 발 한꺼번에 쏠 때 소리] ----------
var SND_TW = {
  // 연사하는 것은 작게(화살 소리와 어울리게), 한 발이 무거운 것은 크게. 실제 크기 = 녹음 꼭대기 값(0.6~0.9) x 이 값
  flak: ['flak', 0.18], flakshell: ['flak', 0.18],
  sam: ['mslFire', 0.27], missile: ['mslFire', 0.27],
  gatling: ['gat', 0.12, 'gatB'], bullet: ['gat', 0.12, 'gatB'],
  sniper: ['snp', 0.36],
  rocket: ['rkt', 0.2, 'rktSalvo'], salvo: ['rkt', 0.2, 'rktSalvo'],
  laser: ['laser', 0.18], beam2: ['laser', 0.18],
  tesla: ['tesla', 0.25],
  airbase: ['gat', 0.1, 'gatB'], plane: ['gat', 0.1, 'gatB'],
  warship: ['navgun', 0.4], navgun: ['navgun', 0.4], navshell: ['navgun', 0.4],
  turtle: ['ball', 0.35], broadside: ['ball', 0.35], ball: ['ball', 0.35],
  singijeon: ['sinarrow', 0.13, 'sinSalvo'], hwacha: ['sinarrow', 0.13, 'sinSalvo'], sinarrow: ['sinarrow', 0.13, 'sinSalvo'],
  jangseung: ['drum', 0.34], totem: ['drum', 0.34],
  barracks: ['sword', 0.18], soldier: ['sword', 0.18],
  shrine: ['talisman', 0.22], talisman: ['talisman', 0.22],
  torpedo: ['torpedo', 0.27], bomb: ['bombDrop', 0.18], ebomb: ['bombDrop', 0.2], eshell: ['tankGun', 0.34],
  omega: ['laser', 0.3], dragon: ['flame', 0.45],
  fz_skybow: ['bowBig', 0.5], fz_fortress: ['navgun', 0.45], fz_storm: ['tesla', 0.3], fz_frostfire: ['blastFire', 0.3], fz_aegis: ['mslFire', 0.3], fz_arsenal: ['rktSalvo', 0.3], fz_carrier: ['jet', 0.26], fz_dragonship: ['ball', 0.4]
};
// 일제 사격 소리(S[2])의 크기 배율
var SN2_SALVO = 1.4;
// 적이 나타날 때 내는 소리 [소리, 크기, 최소 간격 ms, 확률, 0.5초 뒤 이어지는 소리]
var SND_EN = {
  missile: ['alarm', 0.24, 2600, 1, 'mslFly'], jet: ['jet', 0.24, 1200, 1], bomber: ['bomber', 0.3, 3500, 1], fortress: ['bomber', 0.36, 3500, 1], carrier: ['alarm', 0.22, 2600, 1],
  phantom: ['ghost', 0.13, 5000, 0.6], maiden: ['ghost', 0.14, 5000, 0.7], reaper: ['ghost', 0.2, 3000, 1], saja: ['ghost', 0.13, 5000, 0.6], mulgwisin: ['ghost', 0.12, 6000, 0.5], egg: ['ghost', 0.11, 6000, 0.4],
  dokkaebi: ['dokkaebi', 0.2, 6000, 0.5], duryeok: ['dokkaebi', 0.3, 2000, 1], tal: ['dokkaebi', 0.18, 6000, 0.5]
};
// 부서질 때 폭발음이 나는 적 (ENEMIES[k].die === 'boom'이 있으면 그것이 우선)
var SND_BOOM = { jeep: 1, apc: 1, tank: 1, mech: 1, truck: 1, drone: 1, heli: 1, jet: 1, bomber: 1, missile: 1, boat: 1, destroyer: 1, submarine: 1, bigtank: 2, fortress: 2, carrier: 2, titan: 2, pirate: 1, wagon: 0 };

function sn2Play(k, v, rate) { SFX.play(k, v, rate); }
function sn2After(k, v, ms) { setTimeout(function () { SFX.play(k, v); }, ms); }
// 발사음. key: 탑 키, 공격 종류, 탄 종류. n: 한꺼번에 쏜 발 수, lvl: 탑 단계(높을수록 살짝 낮고 묵직하게). ev: 사건에서 불렀으면 1
function sn2Shot(key, n, lvl, ev) {
  var S = SND_TW[key]; if (!S) return false;
  var k = (n >= 3 && S[2]) ? S[2] : S[0], now = performance.now();
  if (ev) { SN2.evShot[S[0]] = now; SN2.shotAt = now; }
  sn2Play(k, S[1] * (k === S[2] ? SN2_SALVO : 1) * (1 + Math.min(5, (lvl || 1) - 1) * 0.03), 1 - Math.min(5, (lvl || 1) - 1) * 0.018);
  return true;
}
function sn2TwKey(tw, k) { if (k && SND_TW[k]) return k; if (!tw) return k; if (SND_TW[tw.k]) return tw.k; var kd = tw.st && tw.st.kind; return SND_TW[kd] ? kd : (tw.k || k); }

// ---------- 사건 → 소리 표 (render.js의 rdEvents가 사건마다 SND_EV[이름](g, ev)를 부름) ----------
var SND_EV = {};
function sn2On(names, fn) { names.split(' ').forEach(function (n) { SND_EV[n] = function (g, ev) { try { fn(g, ev || {}); } catch (e) { } }; }); }
sn2On('muzzle', function (g, e) { sn2Shot(sn2TwKey(e.tw, e.k), e.n || 1, e.tw && e.tw.lvl, 1); });
sn2On('launch', function (g, e) { if (!sn2Shot(sn2TwKey(e.tw, e.k), e.n || 1, e.tw && e.tw.lvl, 1)) sn2Shot('missile', 1, 1, 1); });
// 기존 탑의 shoot는 render.js가 소리를 낸다. 새 탑이 shoot를 내면 여기서
sn2On('shoot', function (g, e) { if (SND_TW[e.k]) sn2Shot(e.k, e.n || 1, e.lvl, 1); });
// 예광탄 줄기: 같은 순간에 발사음이 이미 났으면(muzzle) 겹치지 않게 건너뜀
sn2On('tracer', function (g, e) { if (performance.now() - SN2.shotAt < 25) return; var k = e.k; if (k === 'snipe') k = 'sniper'; if (!sn2Shot(sn2TwKey(e.tw, k), 1, e.tw && e.tw.lvl, 1)) sn2Shot('bullet', 1, 1, 1); });
sn2On('chain', function (g, e) { sn2Play(e.k === 'emp' ? 'blastEmp' : 'tesla', 0.25); });
sn2On('beamOn', function (g, e) { sn2Play('laser', 0.18); });
sn2On('blast', function (g, e) {
  var r = e.r || 0.6, k = e.k || 'he', q = clamp(0.75 + r * 0.25, 0.8, 1.3);   // 반지름이 클수록 조금 크게
  if (k === 'he') sn2Play(r >= 1.1 ? 'blastHe' : 'blastS', (r >= 1.1 ? 0.34 : 0.24) * q);
  else if (k === 'fire') sn2Play('blastFire', 0.28 * q);
  else if (k === 'flak') sn2Play('flakPop', 0.15 * q);
  else if (k === 'emp') sn2Play('blastEmp', 0.28 * q);
  else if (k === 'ice') sn2Play('ice', 0.36 * q);
  else if (k === 'holy') sn2Play('blastHoly', 0.28 * q);
  else if (k === 'water') sn2Play('splash2', 0.26 * q);
  else if (k === 'dark') sn2Play('blastDark', 0.28 * q);
  else sn2Play('blastS', 0.24 * q);
});
// 변신(4단계 갈래, 6단계 궁극): upgrade 사건 바로 뒤에 온다. 기존 강화음(upgradeBig)은 이 순간에만 막고 변신 징글로 바꿈
sn2On('upgrade', function (g, e) { if (e.lvl === 4 || e.lvl >= 6) { SFX_LAST.upgradeBig = performance.now(); sn2Play(e.lvl >= 6 ? 'transformU' : 'transform', e.lvl >= 6 ? 0.62 : 0.5); } });
sn2On('transform', function (g, e) { sn2Play(e.ult || e.lvl >= 6 ? 'transformU' : 'transform', e.ult || e.lvl >= 6 ? 0.62 : 0.5); });
sn2On('fuse', function (g, e) { sn2Play('fuse', 0.66); });
sn2On('planeOut', function (g, e) { sn2Play('jet', 0.24); });
sn2On('towerStun', function (g, e) { var w = e.why || ''; sn2Play(/hex|curse|witch/.test(w) ? 'curse' : /charm|gumiho|fox/.test(w) ? 'charm' : /emp|blackout|power/.test(w) ? 'powerDown' : 'stun', 0.28); });
sn2On('morph', function (g, e) { sn2Play('morph', 0.36); if (e.to === 'yong') sn2Play('roar', 0.5); });
sn2On('ruleEv', function (g, e) { var id = e.id || (g.rule && g.rule.id); if (id === 'meteor') sn2Play(e.hit ? 'blastHe' : 'meteor', e.hit ? 0.36 : 0.26); else if (id === 'blackout') sn2Play('powerDown', 0.28); else if (id === 'airraid' || id === 'landing') sn2Play('alarm', 0.24); });
// 차량, 비행기, 배가 부서질 때 폭발음을 얹음 (귀여운 처치음은 그대로 남: render.js)
sn2On('kill', function (g, e) { var E = ENEMIES[e.k], b = E && E.die ? (E.die === 'boom' ? (e.boss ? 2 : 1) : 0) : SND_BOOM[e.k]; if (b) sn2Play(b > 1 ? 'blastHe' : 'blastS', b > 1 ? 0.42 : 0.2); else if (e.dom === 's') sn2Play('splash2', 0.16); });
// 우두머리 등장: 챕터 분위기에 맞춘 한 방
sn2On('boss', function (g, e) { var ch = (g.M && g.M.ch) || 1; if (ch === 2) { sn2Play('blastDark', 0.36); sn2Play('ghost', 0.2); } else if (ch === 3) sn2Play('alarm', 0.28); else if (ch === 4) { sn2Play('drum', 0.42); sn2Play('seal', 0.25); } });
// 이름이 다를 수 있는 사건의 별칭 (있으면 울리고 없으면 그만)
sn2On('melee slash', function (g, e) { sn2Play('sword', 0.18); });
sn2On('seal', function (g, e) { sn2Play('seal', 0.25); });
sn2On('fear totem', function (g, e) { sn2Play('drum', 0.34); });
sn2On('emp', function (g, e) { sn2Play('blastEmp', 0.28); });
sn2On('siren', function (g, e) { sn2Play('alarm', 0.24); });

// ---------- 사건 없이도 울리는 안전망: 새로 생긴 탄과 적을 0.09초마다 살핌 ----------
// 탄: 그 소리가 최근 3초 안에 사건(muzzle, launch, shoot, tracer)으로 울렸으면 건드리지 않음(겹침 방지). 사건이 안 오는 탄(적 포탄, 폭탄 등)만 여기서 울림
function sn2Tick() {
  try {
    if (typeof G === 'undefined' || !G || !SFX.on || UI.scr !== 'battle' || UI.paused || G.over) return;
    var g = G, i, o, S, now = performance.now(), first = g !== SN2.g;
    if (first) { SN2.g = g; SN2.seen = new WeakSet(); sn2BattleWarm(g); }   // 새 판: 그 판에 필요한 소리 묶음을 미리 만듦 (음악이 꺼져 있어도)
    var seen = SN2.seen, es = g.enemies || [], ps = g.proj || [];
    for (i = 0; i < es.length; i++) { o = es[i]; if (seen.has(o)) continue; seen.add(o); if (first) continue; S = SND_EN[o.k]; if (S && now - (SN2.amb[S[0]] || 0) > S[2] && Math.random() < S[3]) { SN2.amb[S[0]] = now; sn2Play(S[0], S[1]); if (S[4]) sn2After(S[4], S[1] * 0.8, 500); } }
    for (i = 0; i < ps.length; i++) { o = ps[i]; if (seen.has(o)) continue; seen.add(o); if (first) continue; S = SND_TW[o.kind]; if (S && now - (SN2.evShot[S[0]] || 0) > 3000) sn2Play(S[0], S[1] * 0.9); }
  } catch (e) { }
}
// 전투에 들어갈 때 그 판에 필요한 소리 묶음을 미리 만든다 (탑 편성, 챕터, 바다, 항로 기준)
var SN2_TWG = { flak: 'gun', gatling: 'gun', sniper: 'gun', airbase: 'gun', sam: 'msl', rocket: 'msl', singijeon: 'msl', laser: 'nrg', tesla: 'nrg', warship: 'sea', turtle: 'sea', jangseung: 'kor', barracks: 'kor', shrine: 'kor', omega: 'nrg', fz_aegis: 'msl', fz_arsenal: 'msl', fz_storm: 'nrg', fz_fortress: 'sea', fz_carrier: 'air', fz_dragonship: 'sea' };
function sn2BattleWarm(g) {
  var L = ['core', 'boom'], add = function (n) { if (n && L.indexOf(n) < 0) L.push(n); }, M = (g && g.M) || {}, ch = M.ch || 1;
  ((g && g.towersOk) || []).forEach(function (k) { add(SN2_TWG[k]); });
  if (ch === 2) add('spook'); if (ch === 3) { add('gun'); add('air'); } if (ch === 4) { add('kor'); add('spook'); }
  if (M.sea && M.sea.length) add('sea'); if (M.air && M.air.length) add('air');
  if (M.rule && (M.rule.id === 'meteor' || M.rule.id === 'airraid')) add('air'); if (M.rule && M.rule.id === 'blackout') add('nrg');
  sn2Warm(L);
}
SN2.timer = setInterval(sn2Tick, 90);

// ---------- 새 악기 (거르개는 전부 공용 sn2Bus: 녹음 시간 때문) ----------
// 공통(타이틀, 3장): 금관 신스, 현악 패드, 팀파니, 심벌, 스네어, 신스 베이스, 펄스 아르페지오, 피콜로
INST.brs = function (c, d, t, v, m, len) { sn2Brass(c, d, t, mtof(m), Math.max(0.08, len), 0.075 * v, len > 0.6 ? 1 : 0); };
INST.str = function (c, d, t, v, m, len) {
  var f = mtof(m), g = c.createGain(), a = Math.min(0.35, len * 0.3), e = t + len + 0.3;
  g.connect(sn2Bus(c, d, 'str', 'lowpass', 2600, 0.7));
  g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.036 * v, t + a); g.gain.setValueAtTime(0.036 * v, t + Math.max(a, len)); g.gain.linearRampToValueAtTime(0.0001, e);
  [0.995, 1.005].forEach(function (k) { var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * k; o.connect(g); o.start(t); o.stop(e + 0.02); });
};
INST.timp = function (c, d, t, v, m) { var f = mtof(m || 38); tone(c, d, 'sine', f * 1.5, f, t, 0.5, 0.5 * v, 0.003, 0.06); tone(c, d, 'triangle', f * 2, f * 1.5, t, 0.12, 0.12 * v, 0.002, 0.05); nz(c, d, t, 0.03, 0.12 * v, 'lowpass', 900, 300, 0.8, 0.001); };
INST.cym = function (c, d, t, v) { sn2Cym(c, d, t, 1.6, 0.08 * v); };
INST.snr = function (c, d, t, v) { nz(c, d, t, 0.1, 0.26 * v, 'bandpass', 2400, 2400, 0.6, 0.001); tone(c, d, 'triangle', 230, 170, t, 0.06, 0.2 * v, 0.001, 0.04); };
INST.sbs = function (c, d, t, v, m, len) { var f = mtof(m), L = Math.max(0.1, Math.min(0.5, len)); tone(c, sn2Bus(c, d, 'sbs', 'lowpass', 750, 2), 'sawtooth', f, f, t, L, 0.24 * v, 0.004); tone(c, d, 'sine', f, f, t, L, 0.22 * v, 0.004); };
INST.arp = function (c, d, t, v, m) { var f = mtof(m); tone(c, sn2Bus(c, d, 'arp', 'lowpass', 3600, 0.8), 'square', f, f, t, 0.13, 0.06 * v, 0.003); };
INST.fife = function (c, d, t, v, m, len) { var f = mtof(m), o = sndSus(c, d, 'sine', f * 0.97, f, t, len, 0.075 * v, 0.02, Math.min(0.06, len * 0.3), 0.04); if (len > 0.6) sndVib(c, o, t + 0.15, len - 0.15, 5.5, f * 0.006); };
// 2장: 하프시코드, 유령 목소리 같은 테레민 '우우~', 단3도 배음이 섞인 종
INST.hpsi = function (c, d, t, v, m) { var f = mtof(m), hp = sn2Bus(c, d, 'hpsi', 'highpass', 320, 0.7); tone(c, hp, 'sawtooth', f, f, t, 0.38, 0.075 * v, 0.001); tone(c, hp, 'square', f * 2, f * 2, t, 0.2, 0.03 * v, 0.001); };
INST.thm = function (c, d, t, v, m, len) {
  var f = mtof(m), a = Math.min(0.09, len * 0.4), r = Math.min(0.12, len * 0.35), o = sndSus(c, d, 'sine', f * 0.92, f, t, len, 0.085 * v, a, r, 0.11);
  sndSus(c, d, 'triangle', f * 0.46, f * 0.5, t, len, 0.03 * v, a, r, 0.11); sndVib(c, o, t, len, 5.6, f * 0.013);
};
INST.bell2 = function (c, d, t, v, m) { sn2Metal(c, d, t, mtof(m), 2.4, 0.11 * v, [[0.5, 0.5, 1], [1, 1, 0.9], [1.19, 0.5, 0.7], [1.5, 0.35, 0.55], [2, 0.4, 0.45]]); };
// 4장: 가야금(뜯는 순간 밝았다가 금방 둥글어짐, 긴 음은 농현), 피리(콧소리 나는 겹서, 아래에서 밀어 올림), 장구, 북, 꽹과리, 징
INST.gyg = function (c, d, t, v, m, len) {
  var f = mtof(m), dur = Math.min(1.5, 0.45 + len * 0.8);
  tone(c, sn2Bus(c, d, 'gyg', 'lowpass', 4200, 0.8), 'sawtooth', f * 1.014, f, t, 0.16, 0.2 * v, 0.002, 0.03);
  var o = tone(c, d, 'triangle', f * 1.014, f, t, dur, 0.19 * v, 0.002, 0.03);
  if (len >= 0.9) sndVib(c, o, t + 0.14, dur - 0.14, 5.5, f * 0.016, 0.4);
};
INST.piri = function (c, d, t, v, m, len) {
  var f = mtof(m), bp = sn2Bus(c, d, 'piri', 'bandpass', 1700, 0.8), rel = Math.min(0.08, len * 0.3), L = Math.max(0.1, len);
  var o1 = sndSus(c, bp, 'sawtooth', f * 0.94, f, t, L, 0.2 * v, 0.03, rel, 0.07); sndSus(c, bp, 'square', f * 0.94, f, t, L, 0.08 * v, 0.03, rel, 0.07);
  if (L > 0.5) sndVib(c, o1, t + 0.16, L - 0.16, 6, f * 0.02);
};
// 장구: 음 자리(m)에 0 덩(양쪽), 1 쿵(북편), 2 덕(채편), 3 기(약한 덕)
INST.jg = function (c, d, t, v, m) {
  if (m === 0 || m === 1) { tone(c, d, 'sine', 150, 78, t, 0.22, 0.42 * v, 0.002, 0.08); }
  if (m !== 1) { var k = m === 3 ? 0.45 : 1; nz(c, d, t, 0.035, 0.34 * v * k, 'bandpass', 2300, 2300, 1.2, 0.001); tone(c, d, 'triangle', 520, 430, t, 0.04, 0.14 * v * k, 0.001, 0.03); }
};
INST.buk = function (c, d, t, v) { tone(c, d, 'sine', 120, 56, t, 0.36, 0.5 * v, 0.002, 0.1); tone(c, d, 'triangle', 240, 110, t, 0.06, 0.12 * v, 0.001, 0.04); nz(c, d, t, 0.03, 0.14 * v, 'bandpass', 420, 420, 1, 0.001); };
INST.kkw = function (c, d, t, v, m) { sn2Metal(c, d, t, 1320, m ? 0.07 : 0.26, 0.036 * v, [[1, 1, 1], [1.34, 0.8, 0.9], [1.83, 0.7, 0.7], [2.41, 0.4, 0.5]]); };
INST.jing = function (c, d, t, v) { var P = [[1, 1, 1], [1.48, 0.55, 0.85], [2.0, 0.5, 0.7], [2.7, 0.25, 0.5]], f = 147; for (var i = 0; i < P.length; i++) { var q = f * P[i][0]; tone(c, d, 'sine', q * 0.985, q, t, 3.0 * P[i][2], 0.08 * v * P[i][1], 0.06, 0.5); } };

// ---------- 새 곡 ----------
// 타이틀 '철옹성': D단조, 느린 행진. 앞 절은 금관 독주와 현악, 뒤 절은 스네어 행진과 팀파니, 옥타브 금관으로 웅장하게
SONGS.title = { bpm: 88, bars: 16, vol: 1.0, wet: 0.32,
  // Dm Bb F C Dm Bb Gm A | Dm Bb F C Gm Dm/A A7 Dm
  prog: [[38, 62, 65, 69], [34, 58, 62, 65], [41, 60, 65, 69], [36, 60, 64, 67], [38, 62, 65, 69], [34, 58, 62, 65], [43, 58, 62, 67], [33, 57, 61, 64],
    [38, 62, 65, 69], [34, 58, 62, 65], [41, 60, 65, 69], [36, 60, 64, 67], [43, 58, 62, 67], [45, 62, 65, 69], [33, 57, 61, 67], [38, 62, 65, 69]],
  mel: [
    [[0, 1.5, 62], [1.5, 0.5, 65], [2, 2, 69]], [[0, 1.5, 70], [1.5, 0.5, 69], [2, 1, 65], [3, 1, 62]],
    [[0, 1.5, 65], [1.5, 0.5, 69], [2, 2, 72]], [[0, 1.5, 72], [1.5, 0.5, 70], [2, 1, 67], [3, 1, 64]],
    [[0, 1.5, 65], [1.5, 0.5, 69], [2, 2, 74]], [[0, 1, 74], [1, 1, 72], [2, 1, 70], [3, 1, 69]],
    [[0, 1.5, 67], [1.5, 0.5, 70], [2, 2, 69]], [[0, 2.5, 69], [2.5, 0.5, 69], [3, 0.5, 71], [3.5, 0.5, 73]],
    [[0, 1.5, 74], [1.5, 0.5, 77], [2, 2, 81]], [[0, 1.5, 82], [1.5, 0.5, 81], [2, 1, 77], [3, 1, 74]],
    [[0, 1.5, 77], [1.5, 0.5, 81], [2, 2, 84]], [[0, 1.5, 84], [1.5, 0.5, 82], [2, 1, 79], [3, 1, 76]],
    [[0, 1, 79], [1, 1, 82], [2, 1.5, 86], [3.5, 0.5, 84]], [[0, 1, 81], [1, 1, 77], [2, 2, 74]],
    [[0, 1, 76], [1, 1, 73], [2, 1, 76], [3, 1, 79]], [[0, 3.5, 74]]],
  build: function (S) {
    var ans = { 3: [[2.5, 0.5, 79], [3, 0.5, 84], [3.5, 0.5, 88]], 5: [[3, 0.5, 86], [3.5, 0.5, 89]] };
    for (var b = 0; b < S.bars; b++) {
      var P = S.prog[b], r = P[0], t0 = b * 4, B = b >= 8, k;
      for (k = 1; k < 4; k++) S.n('str', t0, 4, P[k], B ? 1 : 0.85);
      S.n('bass', t0, 1.9, r, 0.8); S.n('bass', t0 + 2, 1.9, r, 0.6);
      if (!B) {
        // 앞 절: 금관 독주, 낮은 현의 8분음 되풀이, 두 마디마다 팀파니
        S.mel[b].forEach(function (x) { S.n('brs', t0 + x[0], x[1], x[2], 1.1); });
        [P[1], P[2], P[3], P[2], P[1] + 12, P[2], P[3], P[2]].forEach(function (m, q) { S.n('pizz', t0 + q * 0.5, 0.4, m - 12, q % 2 ? 0.28 : 0.4); });
        if (b % 2 === 0) S.n('timp', t0, 1, r + 12, 0.55);
        if (ans[b]) ans[b].forEach(function (x) { S.n('glk', t0 + x[0], x[1], x[2], 0.6); });
        if (b === 0) S.d('cym', t0, 0.5);
        if (b === 7) { for (k = 0; k < 8; k++) S.d('snr', t0 + 2 + k * 0.25, 0.25 + k * 0.08); for (k = 0; k < 4; k++) S.n('timp', t0 + 3 + k * 0.25, 0.3, 45, 0.4 + k * 0.12); }
      } else {
        // 뒤 절: 옥타브 금관과 현, 스네어 행진, 팀파니
        S.mel[b].forEach(function (x) { S.n('brs', t0 + x[0], x[1], x[2] - 12, 1.15); S.n('brs', t0 + x[0], x[1], x[2], 0.55); S.n('str', t0 + x[0], x[1], x[2], 0.8); });
        S.n('str', t0, 4, P[1] + 12, 0.5);
        [[0, 0.9], [0.75, 0.45], [1, 0.8], [2, 0.9], [2.75, 0.45], [3, 0.8], [3.5, 0.55]].forEach(function (h) { S.d('snr', t0 + h[0], h[1]); });
        S.n('timp', t0, 1, r + 12, 0.85); S.n('timp', t0 + 2, 1, r + 12, 0.6); if (b % 2) S.n('timp', t0 + 3.5, 0.5, r + 12, 0.5);
        [1, 3].forEach(function (q) { for (k = 1; k < 4; k++) S.n('brs', t0 + q, 0.3, P[k] - 12, 0.4); });
        if (b === 8 || b === 12) S.d('cym', t0, b === 8 ? 1 : 0.7);
        if (b === 11 || b === 15) for (k = 0; k < 8; k++) S.d('snr', t0 + 2 + k * 0.25, 0.3 + k * 0.08);
        if (b === 15) { for (k = 0; k < 8; k++) S.n('timp', t0 + 2 + k * 0.25, 0.3, 38 + 12, 0.35 + k * 0.07); [86, 89, 93].forEach(function (m, q) { S.n('glk', t0 + 2 + q * 0.5, 1, m, 0.5); }); }
      }
    }
  } };
// 2장 '저주받은 밤': A단조 왈츠(3박). 오르골 선율 + 쿵짝짝 + 뼈 실로폰 대답 / 가운데는 유령 목소리 테레민과 하프시코드 / 끝 절은 오르간이 합세
SONGS.battle2 = { bpm: 168, bpb: 3, bars: 48, vol: 0.95, wet: 0.28, comp: [-20, 10, 4, 0.002, 0.15],
  ch: { Am: [45, 40, 57, 60, 64], E7: [40, 47, 56, 59, 62], Dm: [38, 45, 57, 62, 65], F: [41, 48, 57, 60, 65], C: [48, 43, 55, 60, 64], Bd: [47, 41, 59, 62, 65] },
  prog: 'Am Am E7 E7 E7 E7 Am Am Am Am Dm Dm E7 E7 Am Am F F C C Dm Dm Am Am F F C C Bd E7 Am E7'.split(' '),
  mel: [
    [[0, 1, 69], [1, 1, 72], [2, 1, 76]], [[0, 2, 81], [2, 1, 80]], [[0, 1, 83], [1, 1, 80], [2, 1, 76]], [[0, 3, 74]],
    [[0, 1, 68], [1, 1, 71], [2, 1, 74]], [[0, 2, 77], [2, 1, 76]], [[0, 1, 81], [1, 1, 76], [2, 1, 72]], [[0, 3, 69]],
    [[0, 1, 69], [1, 1, 72], [2, 1, 76]], [[0, 2, 81], [2, 1, 84]], [[0, 1, 86], [1, 1, 84], [2, 1, 81]], [[0, 2, 77], [2, 1, 74]],
    [[0, 1, 76], [1, 1, 80], [2, 1, 83]], [[0, 2, 86], [2, 1, 83]], [[0, 1, 84], [1, 1, 81], [2, 1, 76]], [[0, 2, 69], [2, 1, 76]],
    [[0, 2, 77], [2, 1, 81]], [[0, 1, 84], [1, 2, 81]], [[0, 2, 76], [2, 1, 79]], [[0, 1, 84], [1, 2, 79]],
    [[0, 2, 77], [2, 1, 74]], [[0, 1, 81], [1, 2, 77]], [[0, 1, 76], [1, 1, 72], [2, 1, 69]], [[0, 3, 76]],
    [[0, 2, 77], [2, 1, 81]], [[0, 1, 84], [1, 2, 86]], [[0, 2, 88], [2, 1, 84]], [[0, 1, 79], [1, 2, 76]],
    [[0, 1, 74], [1, 1, 77], [2, 1, 83]], [[0, 2, 80], [2, 1, 76]], [[0, 1, 81], [1, 1, 80], [2, 1, 81]], [[0, 2, 76], [2, 1, 68]]],
  build: function (S) {
    var CH = S.song.ch;
    for (var b = 0; b < S.bars; b++) {
      var sec = b < 16 ? 0 : b < 32 ? 1 : 2, i16 = b % 16, idx = sec === 1 ? 16 + i16 : i16, P = CH[S.prog[idx]], t0 = b * 3, M = S.mel[idx], k;
      S.n('bass', t0, 1, P[b % 2], 0.85);
      if (sec === 1) {
        // 가운데 절: 테레민 선율(오르골이 살짝 겹침), 하프시코드 펼침화음
        M.forEach(function (x) { S.n('thm', t0 + x[0], x[1], x[2], 1.05); S.n('box', t0 + x[0], x[1], x[2], 0.3); });
        [P[2], P[3], P[4], P[2] + 12, P[4], P[3]].forEach(function (m, q) { S.n('hpsi', t0 + q * 0.5, 0.4, m, q ? 0.4 : 0.55); });
        S.n('pad', t0, 3, P[2], 0.6); S.n('pad', t0, 3, P[4], 0.5);
        S.d('shk', t0 + 1, 0.55); S.d('shk', t0 + 2, 0.55);
        if (i16 % 8 === 0) S.d('tri', t0, 0.7);
      } else {
        M.forEach(function (x) { S.n('box', t0 + x[0], x[1], x[2], 1); if (x[1] >= 2) S.n('glk', t0 + x[0], x[1], x[2] + 12, 0.3); if (sec === 2) S.n('thm', t0 + x[0], x[1], x[2] - 12, 0.7); });
        // 쿵짝짝
        for (k = 2; k < 5; k++) { S.n(sec === 2 ? 'organ' : 'pizz', t0 + 1, 0.3, P[k], sec === 2 ? 0.42 : 0.45); S.n(sec === 2 ? 'organ' : 'pizz', t0 + 2, 0.3, P[k], sec === 2 ? 0.36 : 0.38); }
        S.n('wood', t0 + 1, 0.1, 96, 0.2); S.n('wood', t0 + 2, 0.1, 91, 0.2);
        // 선율이 쉬는 마디에 뼈 실로폰이 달그락 대답
        if (i16 % 4 === 3) [P[4] + 24, P[3] + 24, P[2] + 24, P[3] + 24, P[4] + 12, P[2] + 24].forEach(function (m, q) { if (q < (i16 === 15 ? 4 : 6)) S.n('xyl', t0 + (i16 === 15 ? 0 : 0) + 0.5 + q * 0.4, 0.3, m, 0.5 - q * 0.03); });
        if (i16 === 0) S.n('bell2', t0, 3, 57, sec === 2 ? 0.9 : 0.7);
        if (sec === 2) { S.d('kick', t0, 0.7); S.d('shk', t0 + 1, 0.5); S.d('shk', t0 + 2, 0.5); if (i16 === 0) S.d('tri', t0, 0.8); }
      }
    }
  } };
// 3장 '강철 전선': E단조 행진곡. 스네어 행진 + 신스 베이스 8분음 + 금관 신스 선율 / 가운데는 현악과 16분음 아르페지오 / 끝 절은 전부
SONGS.battle3 = { bpm: 124, bars: 24, vol: 0.92, wet: 0.18, comp: [-20, 10, 4, 0.002, 0.15],
  // A: Em Em C D Em Em C B / B: G D Am Em C G Am B7
  prog: [[40, 59, 64, 67], [40, 59, 64, 67], [36, 60, 64, 67], [38, 57, 62, 66], [40, 59, 64, 67], [40, 59, 64, 67], [36, 60, 64, 67], [35, 59, 63, 66],
    [43, 59, 62, 67], [38, 57, 62, 66], [45, 57, 60, 64], [40, 59, 64, 67], [36, 60, 64, 67], [43, 59, 62, 67], [45, 57, 60, 64], [35, 57, 59, 63]],
  mel: [
    [[0, 0.75, 64], [0.75, 0.25, 64], [1, 1, 67], [2, 0.75, 71], [2.75, 0.25, 71], [3, 1, 76]], [[0, 1.5, 74], [1.5, 0.5, 71], [2, 2, 67]],
    [[0, 0.75, 64], [0.75, 0.25, 64], [1, 1, 67], [2, 0.75, 72], [2.75, 0.25, 72], [3, 1, 76]], [[0, 1.5, 78], [1.5, 0.5, 74], [2, 2, 69]],
    [[0, 0.75, 67], [0.75, 0.25, 67], [1, 1, 71], [2, 0.75, 76], [2.75, 0.25, 76], [3, 1, 79]], [[0, 1.5, 78], [1.5, 0.5, 76], [2, 2, 71]],
    [[0, 1, 72], [1, 1, 76], [2, 1, 79], [3, 1, 76]], [[0, 2, 75], [2, 0.5, 71], [2.5, 0.5, 73], [3, 0.5, 75], [3.5, 0.5, 78]],
    [[0, 1.5, 79], [1.5, 0.5, 74], [2, 1, 71], [3, 1, 74]], [[0, 1.5, 78], [1.5, 0.5, 74], [2, 2, 69]],
    [[0, 1.5, 76], [1.5, 0.5, 72], [2, 1, 69], [3, 1, 72]], [[0, 1.5, 76], [1.5, 0.5, 71], [2, 2, 67]],
    [[0, 1, 72], [1, 1, 76], [2, 1.5, 79], [3.5, 0.5, 76]], [[0, 1, 74], [1, 1, 79], [2, 1.5, 83], [3.5, 0.5, 79]],
    [[0, 1, 81], [1, 1, 76], [2, 1, 72], [3, 1, 76]], [[0, 1, 81], [1, 0.5, 78], [1.5, 0.5, 75], [2, 2, 71]]],
  build: function (S) {
    for (var b = 0; b < S.bars; b++) {
      var sec = b < 8 ? 0 : b < 16 ? 1 : 2, i8 = b % 8, idx = sec === 1 ? 8 + i8 : i8, P = S.prog[idx], r = P[0], t0 = b * 4, fill = i8 === 7, M = S.mel[idx], k;
      // 신스 베이스 8분음, 큰북, 스네어 행진
      [r, r, r + 12, r, r, r, r + 12, r + 7].forEach(function (m, q) { S.n('sbs', t0 + q * 0.5, 0.4, m, q % 2 ? 0.55 : 0.85); });
      S.d('kick', t0, 1); S.d('kick', t0 + 2, 0.9);
      (sec === 1 ? [[1, 0.85], [1.75, 0.35], [3, 0.85], [3.5, 0.4]] : [[0.5, 0.3], [0.75, 0.35], [1, 0.9], [1.5, 0.4], [2.5, 0.3], [2.75, 0.35], [3, 0.9], [3.5, 0.45], [3.75, 0.4]]).forEach(function (h) { if (!fill || h[0] < 2) S.d('snr', t0 + h[0], h[1]); });
      if (fill) for (k = 0; k < 8; k++) S.d('snr', t0 + 2 + k * 0.25, 0.35 + k * 0.08);
      for (k = 0; k < 8; k++) S.d('shk', t0 + k * 0.5, k % 2 ? 0.8 : 0.45);
      if (i8 === 0) S.d('cym', t0, sec === 2 ? 1 : 0.7);
      if (sec === 1) {
        M.forEach(function (x) { S.n('brs', t0 + x[0], x[1], x[2], 1); S.n('fife', t0 + x[0], x[1], x[2] + 12, 0.75); });
        for (k = 1; k < 4; k++) S.n('str', t0, 4, P[k], 0.75);
      } else {
        M.forEach(function (x) { S.n('brs', t0 + x[0], x[1], x[2], 1.15); if (sec === 2) S.n('fife', t0 + x[0], x[1], x[2] + 12, 0.7); });
        // 화음 찌르기 (짝, 짝)
        [1, 3].forEach(function (q) { for (k = 1; k < 4; k++) S.n('brs', t0 + q, 0.22, P[k] - 12, 0.42); });
        if (i8 % 2) for (k = 1; k < 4; k++) S.n('brs', t0 + 3.5, 0.2, P[k] - 12, 0.36);
      }
      if (sec) for (k = 0; k < 16; k++) S.n('arp', t0 + k * 0.25, 0.2, P[1 + [0, 1, 2, 1][k % 4]] + (k % 8 >= 4 ? 12 : 0), k % 4 ? 0.5 : 0.7);
    }
  } };
// 4장 '도깨비 고개': 자진모리장단(12/8, 덩 쿵 쿵덕쿵). 미 솔 라 시 레 5음계. 피리 가락 + 가야금 뜯기 + 장구, 북 / 가운데는 가야금 가락 / 끝 절은 꽹과리까지
SONGS.battle4 = { bpm: 108, bars: 24, vol: 0.95, wet: 0.22, comp: [-20, 10, 4, 0.002, 0.15],
  cen: [40, 40, 43, 45, 40, 40, 50, 40, 43, 43, 45, 45, 50, 50, 47, 40],
  mel: (function () {
    var a = 1 / 3, b = 2 / 3;
    return [
      [[0, b, 71], [b, a, 74], [1, 1, 76], [2, b, 74], [2 + b, a, 71], [3, 1, 69]], [[0, b, 71], [b, a, 69], [1, b, 67], [1 + b, a, 69], [2, 2, 64]],
      [[0, b, 67], [b, a, 69], [1, 1, 71], [2, b, 74], [2 + b, a, 76], [3, 1, 74]], [[0, 1, 76], [1, b, 74], [1 + b, a, 71], [2, 2, 69]],
      [[0, b, 71], [b, a, 74], [1, 1, 76], [2, b, 79], [2 + b, a, 76], [3, 1, 74]], [[0, b, 76], [b, a, 74], [1, b, 71], [1 + b, a, 74], [2, 2, 76]],
      [[0, b, 74], [b, a, 71], [1, b, 69], [1 + b, a, 67], [2, b, 69], [2 + b, a, 71], [3, 1, 69]], [[0, 1, 67], [1, b, 69], [1 + b, a, 67], [2, 2, 64]],
      [[0, a, 79], [a, a, 76], [b, a, 74], [1, 1, 79], [2, b, 81], [2 + b, a, 79], [3, 1, 76]], [[0, b, 74], [b, a, 76], [1, 1, 79], [2, 2, 74]],
      [[0, a, 81], [a, a, 79], [b, a, 76], [1, 1, 81], [2, b, 83], [2 + b, a, 81], [3, 1, 79]], [[0, b, 76], [b, a, 79], [1, 1, 81], [2, 2, 76]],
      [[0, b, 74], [b, a, 76], [1, b, 74], [1 + b, a, 71], [2, b, 69], [2 + b, a, 71], [3, 1, 74]], [[0, 1, 76], [1, 1, 74], [2, 2, 71]],
      [[0, b, 71], [b, a, 74], [1, b, 71], [1 + b, a, 69], [2, b, 71], [2 + b, a, 74], [3, 1, 76]], [[0, 1, 74], [1, 1, 71], [2, 2, 64]]];
  })(),
  build: function (S) {
    var cen = S.song.cen, JA = [[0, 0], [3, 1], [6, 1], [8, 2], [9, 1]], JB = [[0, 0], [2, 2], [3, 1], [5, 2], [6, 1], [8, 2], [9, 1], [11, 3]], JF = [[0, 0], [1, 3], [2, 2], [3, 1], [4, 2], [5, 2], [6, 0], [7, 3], [8, 2], [9, 0], [10, 2], [11, 2]];
    for (var b = 0; b < S.bars; b++) {
      var sec = b < 8 ? 0 : b < 16 ? 1 : 2, i8 = b % 8, idx = sec === 1 ? 8 + i8 : i8, r = cen[idx], t0 = b * 4, M = S.mel[idx], q, o5 = r === 47 ? 17 : 19;
      // 장구 장단: 기본, 변형, 마지막 마디는 몰아치기
      (i8 === 7 ? JF : b % 2 ? JB : JA).forEach(function (h) { S.n('jg', t0 + h[0] / 3, 0.1, h[1], h[1] === 3 ? 0.6 : h[1] === 0 ? 1 : 0.85); });
      S.d('buk', t0, sec ? 0.85 : 0.7); if (sec) S.d('buk', t0 + 2, 0.6);
      if (i8 === 0) S.d('jing', t0, sec === 0 ? 0.8 : 1);
      // 가야금: 낮은 줄 으뜸음과 셋잇단 뜯기
      S.n('gyg', t0, 1.5, r, 0.9); S.n('gyg', t0 + 2, 1.5, r + (r === 47 ? 5 : 7), 0.7);
      for (q = 0; q < 12; q++) if (q % 3 || sec) S.n('gyg', t0 + q / 3, 0.3, r + [12, o5, 24][q % 3], q % 3 === 0 ? 0.5 : 0.42);
      if (sec === 1) {
        M.forEach(function (x) { S.n('gyg', t0 + x[0], x[1], x[2], 1.15); if (x[1] >= 1) S.n('piri', t0 + x[0], x[1], x[2] - 12, 0.7); });
        S.n('kkw', t0, 0.1, 0, 0.4); S.n('kkw', t0 + 2, 0.1, 0, 0.3);
      } else {
        M.forEach(function (x) { S.n('piri', t0 + x[0], x[1], x[2], 1.1); if (sec === 2) S.n('gyg', t0 + x[0], x[1], x[2] + 12, 0.55); });
        if (sec === 2) [[0, 0], [2, 1], [3, 0], [5, 1], [6, 0], [8, 1], [9, 0], [10, 1], [11, 1]].forEach(function (h) { S.n('kkw', t0 + h[0] / 3, 0.1, h[1], h[1] ? 0.4 : 0.55); });
      }
    }
  } };
// 우두머리 변주: 1장 우두머리 곡(D단조)의 화음과 가락을 그대로 쓰되, 조와 악기와 북을 챕터에 맞게 바꿈
function sn2BossSong(ch) {
  var B = SONGS.boss, C = { 2: { bpm: 138, tr: -5, IN: ['organ', 'xyl', 'hpsi'], ost: 'hpsi' }, 3: { bpm: 150, tr: 2, IN: ['brs', 'arp', 'brs'], ost: 'sbs' }, 4: { bpm: 140, tr: 2, IN: ['piri', 'gyg', 'piri'], ost: 'gyg' } }[ch];
  return { bpm: C.bpm, bars: 16, vol: 0.88, wet: 0.2, comp: B.comp, prog: B.prog, mel: B.mel, build: function (S) {
    var tr = C.tr, k;
    for (var b = 0; b < S.bars; b++) {
      var P = S.prog[b].map(function (m) { return m + tr; }), r = P[0], m4 = P[1], t0 = b * 4, B2 = b >= 8, fill = b % 8 === 7;
      if (C.ost === 'sbs') [r, r, r + 12, r, r + 7, r, r + 12, r].forEach(function (m, q) { S.n('sbs', t0 + q * 0.5, 0.4, m - (m > 45 ? 12 : 0), q % 2 ? 0.55 : 0.85); });
      else { [m4, m4 + 7, m4 + 12, m4 + 7, P[2] + 12, m4 + 7, m4 + 12, m4 + 7].forEach(function (m, q) { S.n(C.ost, t0 + q * 0.5, 0.4, m, q % 2 ? 0.5 : 0.75); });
        S.n('bass', t0, 0.7, r, 0.8); S.n('bass', t0 + 1.5, 0.4, r, 0.5); S.n('bass', t0 + 2, 0.7, r + 7, 0.7); S.n('bass', t0 + 3, 0.4, r + 12, 0.5); S.n('bass', t0 + 3.5, 0.4, r + 7, 0.5); }
      S.mel[b].forEach(function (x) { var inst = C.IN[x[3]], m = x[2] + tr; if (x[3] !== 1 && m > (inst === 'piri' ? 79 : 84)) m -= 12; if (x[3] === 1 && m > 96) m -= 12; S.n(inst, t0 + x[0], x[1], m, x[3] === 1 ? 1 : 1.25); });
      if (ch === 2) {
        for (k = 0; k < 4; k++) S.d('kick', t0 + k, k % 2 ? 0.6 : 0.85);
        for (k = 0; k < 8; k++) S.d('shk', t0 + k * 0.5, k % 2 ? 0.8 : 0.45);
        S.n('wood', t0 + 1, 0.1, 86 + tr, 0.4); S.n('wood', t0 + 3, 0.1, 81 + tr, 0.4);
        if (b % 4 === 0) S.n('bell2', t0, 3, r + 24, 0.8);
        if (B2) [0.5, 1.5, 2.5, 3.5].forEach(function (q) { for (var k2 = 1; k2 < 4; k2++) S.n('organ', t0 + q, 0.18, P[k2], 0.35); });
      } else if (ch === 3) {
        S.d('kick', t0, 1); S.d('kick', t0 + 2, 0.9); if (B2) S.d('kick', t0 + 3.5, 0.6);
        [[1, 0.9], [1.75, 0.4], [3, 0.9], [3.5, 0.45], [3.75, 0.4]].forEach(function (h) { if (!fill || h[0] < 2) S.d('snr', t0 + h[0], h[1]); });
        for (k = 0; k < (B2 ? 16 : 8); k++) S.d('shk', t0 + k * (B2 ? 0.25 : 0.5), k % 2 ? 0.45 : 0.75);
        if (b % 2) for (k = 1; k < 4; k++) S.n('brs', t0, 0.3, P[k], 0.45);
        if (B2) for (k = 0; k < 16; k++) S.n('arp', t0 + k * 0.25, 0.2, P[1 + [0, 1, 2, 1][k % 4]] + 12, 0.45);
        if (b % 8 === 0) S.d('cym', t0, 1);
      } else {
        // 휘모리: 덩 덕 쿵덕쿵
        [[0, 0], [1, 2], [2, 1], [2.5, 2], [3, 1], [3.5, 3]].forEach(function (h) { S.n('jg', t0 + h[0], 0.1, h[1], h[1] === 3 ? 0.6 : 0.95); });
        S.d('buk', t0, 0.9); S.d('buk', t0 + 2, 0.7);
        for (k = 0; k < 8; k++) S.n('kkw', t0 + k * 0.5, 0.1, k % 4 ? 1 : 0, k % 4 ? 0.35 : 0.55);
        if (b % 8 === 0) S.d('jing', t0, 1);
      }
      if (fill) [[2, 62], [2.25, 62], [2.5, 59], [2.75, 59], [3, 55], [3.25, 55], [3.5, 50], [3.75, 48]].forEach(function (x, k3) { if (ch === 3) S.d('snr', t0 + x[0], 0.4 + k3 * 0.07); else S.n('tom', t0 + x[0], 0.2, x[1] + tr, 0.5 + k3 * 0.05); });
    }
  } };
}
SONGS.boss2 = sn2BossSong(2); SONGS.boss3 = sn2BossSong(3); SONGS.boss4 = sn2BossSong(4);
SONGS.menu1 = SONGS.menu;   // 옛 오르골 메뉴 곡 (MUSIC.play('menu1')로 틀 수 있음. 'menu'는 이제 타이틀 테마)

// ---------- 곡 고르기: ui.js는 예전처럼 MUSIC.play('menu' | 'battle' | 'boss')만 부르고, 여기서 챕터에 맞는 곡 이름으로 바꾼다 ----------
function sn2Ch() {
  try { if (typeof G !== 'undefined' && G && G.M && UI.scr === 'battle') return G.M.ch || 1; var i = fdCurStage(); return (MAPS[i] && MAPS[i].ch) || 1; } catch (e) { return 1; }
}
function sn2Song(name) {
  if (name === 'menu') { try { if (typeof CH !== 'undefined' && CH.mode === 'map' && UI.scr !== 'battle') { var Cm = fdChapter(CH.ch); if (Cm && SONGS['map_' + Cm.mood]) return 'map_' + Cm.mood; } } catch (e) { } return SONGS.tf_title ? 'tf_title' : 'title'; }   // 타임플렉스: 장 지도는 시대 곡, 그 밖은 시간의 주제
  if (name === 'battle' || name === 'boss') { var ch = sn2Ch(), C = typeof fdChapter === 'function' ? fdChapter(ch) : null; if (C && C.mood) return SONGS[name + '_' + C.mood] ? name + '_' + C.mood : name; return ch >= 2 && SONGS[name + ch] ? name + ch : name; }   // 타임플렉스: 장 분위기별 곡(tf_audio.js), 없으면 기본 곡
  return name;
}
MUSIC.onPlay = function (asked) {
  if (asked === 'battle' || asked === 'boss') {
    if (typeof G !== 'undefined' && G && UI.scr === 'battle') { sn2BattleWarm(G); if (asked === 'battle' && G.M && G.M.boss) setTimeout(function () { MUSIC.prepare('boss'); }, 3000); }
  } else if (asked === 'menu' && !SN2.idle) { SN2.idle = 1; setTimeout(function () { sn2Warm(['core', 'bonus']); }, 2500); }
};
// 타이틀 테마는 첫 화면을 보는 동안 미리 녹음 (기본 효과음을 다 만든 뒤에)
(function () { var n = 0, id = setInterval(function () { if (SFX.ready || ++n > 40) { clearInterval(id); try { if (MUSIC.on) MUSIC.prepare('title'); } catch (e) { } } }, 250); })();

// ---------- 시험용 (브라우저 콘솔): __snd.ev('blast', { x: 5, y: 8, r: 1.4, k: 'he' }) 처럼 가짜 사건으로 울려 봄 ----------
window.__snd = {
  ev: function (name, o) { var g = (typeof G !== 'undefined' && G) || { M: { ch: 1 } }; if (SND_EV[name]) SND_EV[name](g, o || {}); return !!SND_EV[name]; },
  play: function (k, v, r) { SFX.play(k, v == null ? 0.5 : v, r); }, shot: function (k, n, lvl) { return sn2Shot(k, n || 1, lvl || 1, 1); },
  warm: function (l) { return new Promise(function (res) { sn2Warm(l || 'all', res); }); },
  keys: function () { return Object.keys(SN2_DEF); }, events: function () { return Object.keys(SND_EV); }, table: function () { return { tw: SND_TW, en: SND_EN, lim: SFX_LIM }; },
  // 녹음된 소리의 길이, 꼭대기 값, 평균 세기, 처음과 끝의 조용함, 무게중심 주파수(어림)
  stat: function (k) {
    var b = SFX_BUF[k]; if (!b) return null;
    var d = b.getChannelData(0), n = d.length, sr = b.sampleRate, pk = 0, sq = 0, i, a, zc = 0, first = -1, last = 0, dc = 0;
    for (i = 0; i < n; i++) { a = d[i] < 0 ? -d[i] : d[i]; if (a > pk) pk = a; sq += a * a; dc += d[i]; if (i && (d[i] >= 0) !== (d[i - 1] >= 0)) zc++; if (a > 0.02) { if (first < 0) first = i; last = i; } }
    var e = 0; for (i = Math.max(0, n - 320); i < n; i++) e = Math.max(e, Math.abs(d[i]));
    return { k: k, dur: +(n / sr).toFixed(2), peak: +pk.toFixed(3), rms: +Math.sqrt(sq / n).toFixed(4), lead: first < 0 ? -1 : +(first / sr).toFixed(3), used: +((last + 1) / sr).toFixed(2), end: +e.toFixed(4), zc: Math.round(zc / 2 / (n / sr)), dc: +(dc / n).toFixed(4), nan: pk !== pk ? 1 : 0, grp: SN2_DEF[k] ? SN2_DEF[k][3] : 'old' };
  },
  stats: function (all) { var o = []; for (var k in SFX_BUF) if (all || SN2_DEF[k]) o.push(window.__snd.stat(k)); return o; },
  song: function (name) { return new Promise(function (res) { MUSIC.prepare(name, function () { res(MUSIC.stat[MUSIC.resolve(name)] || null); }); }); },
  playM: function (name) { MUSIC.play(name); }, drop: function (name) { var n = MUSIC.resolve(name); if (MUSIC.urls[n] && n !== MUSIC.cur) { try { URL.revokeObjectURL(MUSIC.urls[n]); } catch (e) { } delete MUSIC.urls[n]; } }, url: function (name) { return MUSIC.urls[MUSIC.resolve(name)]; }, buf: function (k) { return SFX_BUF[k]; }, songDef: function (n) { return SONGS[n]; }, unlock: function () { SFX.unlock(); return AC ? AC.state : null; }, ready: function () { return !!SFX.ready; }, songs: function () { return Object.keys(SONGS); }, pick: function (name) { return sn2Song(name); }, ch: function () { return sn2Ch(); },
  mus: function () { var el = MUSIC.audio; return { cur: MUSIC.cur, want: MUSIC.want, on: MUSIC.on, paused: el ? el.paused : null, t: el ? +el.currentTime.toFixed(2) : null, vol: el ? +el.volume.toFixed(2) : null, have: Object.keys(MUSIC.urls), stat: MUSIC.stat }; },
  log: function (on) { if (on === false) { SFX.log = null; return; } if (!SFX.log) SFX.log = []; var l = SFX.log; if (on === 'clear') SFX.log = []; return l; },
  live: function () { return { live: SFX_LIVE, vox: SFX_VOX, groups: SN2.state, ms: SN2.ms, ac: AC ? AC.state : null }; }, tick: function () { sn2Tick(); }
};
