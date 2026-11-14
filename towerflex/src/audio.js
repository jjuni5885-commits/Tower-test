// ===== audio.js : 효과음과 배경음악. 모두 코드로 합성. v2.0 새 소리와 챕터 음악은 audio2.js (여기는 재생기와 1장 소리) =====
var AC = null, SFX_BUF = {}, SFX_EL = {}, SFX_LAST = {}, MASTER = null, SFX_BUS = null;
// v2.0 동시 발음 제한: SFX_LIM[이름] = [최소 간격 ms, 같은 소리 동시 발음 수, 겹칠 때마다 곱하는 크기]. 표에 없는 옛 소리는 예전 그대로(간격 45ms)
// SFX_LIVE는 제한 표에 있는 새 소리만 센다 (옛 소리가 많이 울린다고 새 소리가 막히지 않게). 새 소리 전체 동시 발음은 SFX_CAP까지
var SFX_LIM = {}, SFX_VOX = {}, SFX_LIVE = 0, SFX_CAP = 14;
var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
function renderOffline(ch, sr, dur, fn) {
  return new Promise(function (res) {
    var ctx;
    try { ctx = new OAC(ch, Math.ceil(sr * dur), sr); } catch (e) { res(null); return; }
    var out = ctx.createGain(); out.connect(ctx.destination);
    try { fn(ctx, out); } catch (e) { console.log('snd', e); }
    var p = ctx.startRendering();
    if (p && p.then) p.then(res, function () { res(null); }); else ctx.oncomplete = function (ev) { res(ev.renderedBuffer); };
  });
}
var NOISE = {};
function noiseBuf(ctx) {
  var key = ctx.sampleRate;
  if (NOISE[key] && NOISE[key].ctx === ctx) return NOISE[key].b;
  var b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
  for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  NOISE[key] = { ctx: ctx, b: b };
  return b;
}
// 처음 값도 0으로 둠 (첫 이벤트 전 한 샘플이 기본값 1로 새어 '틱' 소리가 나던 문제)
function envG(ctx, dest, t, a, peak, d, hold) {
  var g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  if (hold) g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + (hold || 0) + d);
  g.connect(dest); return g;
}
function tone(ctx, dest, type, f0, f1, t, dur, vol, att, fd) {
  var o = ctx.createOscillator(); o.type = type;
  o.frequency.value = f0; o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + (fd || dur));
  var g = envG(ctx, dest, t, att || 0.003, vol, dur);
  o.connect(g); o.start(t); o.stop(t + (att || 0.003) + dur + 0.05);
  return o;
}
function nz(ctx, dest, t, dur, vol, ftype, f0, f1, q, att) {
  var s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx); s.loop = true;   // 잡음 재료는 2초: 긴 소리가 중간에 끊기지 않게 되돌려 씀
  var f = ctx.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.value = f0; f.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  f.Q.value = q || 1;
  var g = envG(ctx, dest, t, att || 0.002, vol, dur);
  s.connect(f); f.connect(g); s.start(t, Math.random()); s.stop(t + (att || 0.002) + dur + 0.05);
}
function distort(ctx, dest, amt) {
  var ws = ctx.createWaveShaper(), n = 1024, cv = new Float32Array(n);
  for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; cv[i] = (1 + amt) * x / (1 + amt * Math.abs(x)); }
  ws.curve = cv; ws.connect(dest); return ws;
}
function thump(ctx, d, t, f0, f1, dur, vol) { tone(ctx, d, 'sine', f0, f1, t, dur, vol, 0.002, dur * 0.7); }

// ---------- 귀여운 소리 재료 ----------
// 막대 타악기 배음 [배음비, 크기, 길이비]: 마림바, 실로폰, 글로켄, 오르골, 장난감 피아노, 반짝이(가벼운 글로켄)
var sndBars = {
  mar: [[1, 1, 1], [3.93, 0.16, 0.12], [9.8, 0.035, 0.04]],
  xyl: [[1, 1, 1], [3.01, 0.3, 0.22], [6.1, 0.08, 0.07]],
  glk: [[1, 1, 1], [2.76, 0.3, 0.38], [5.4, 0.1, 0.14]],
  box: [[1, 1, 1], [2.01, 0.1, 0.35], [6.27, 0.08, 0.05]],
  toy: [[1, 1, 1], [2.01, 0.28, 0.5], [3.98, 0.18, 0.16], [6.31, 0.06, 0.05]],
  spk: [[1, 1, 1], [2.76, 0.3, 0.38]]
};
function sndBar(c, d, t, f, dur, vol, k) {
  var P = sndBars[k || 'glk'], ny = c.sampleRate * 0.45;
  for (var i = 0; i < P.length; i++) { var q = f * P[i][0]; if (q < ny) tone(c, d, 'sine', q, q, t, dur * P[i][2], vol * P[i][1], 0.0015); }
}
// 음 여러 개를 차례로
function sndArp(c, d, t, ms, step, dur, vol, k) { for (var i = 0; i < ms.length; i++) sndBar(c, d, t + i * step, mtof(ms[i]), dur, vol, k); }
// 5음 음계(도 레 미 솔 라)로 맞추기
function sndPent(m) { var o = Math.floor(m / 12), p = m - o * 12, b = 0; [0, 2, 4, 7, 9].forEach(function (x) { if (x <= p) b = x; }); return o * 12 + b; }
// 반짝이: 높은 글로켄 음을 흩뿌림
function sndSparkle(c, d, t, n, span, lo, hi, vol, dur) { for (var i = 0; i < n; i++) sndBar(c, d, t + Math.random() * span, mtof(sndPent(lo + Math.random() * (hi - lo))), dur || 0.3, vol * (0.55 + Math.random() * 0.45), 'spk'); }
// 방울 '뽁': 위로 휘는 짧은 사인
function sndPlip(c, d, t, f, dur, vol, up) { tone(c, d, 'sine', f, f * (up || 2), t, dur, vol, 0.002, dur * 0.7); }
// 동그란 '퐁': 떨어지는 사인 + 옥타브 위 세모파 (폰 스피커에서도 들리게)
function sndBoop(c, d, t, f0, f1, dur, vol) { tone(c, d, 'sine', f0, f1, t, dur, vol, 0.002, dur * 0.5); tone(c, d, 'triangle', f0 * 2, f1 * 2, t, dur * 0.45, vol * 0.22, 0.002, dur * 0.3); }
// 나무 '똑'
function sndTok(c, d, t, f, vol, dur) { dur = dur || 0.07; tone(c, d, 'sine', f * 1.05, f, t, dur, vol, 0.001, 0.012); tone(c, d, 'sine', f * 2.62, f * 2.6, t, dur * 0.45, vol * 0.3, 0.001); nz(c, d, t, 0.01, vol * 0.35, 'bandpass', Math.min(6000, f * 3.2), Math.min(6000, f * 3.2), 2, 0.001); }
// 지속음 (붙임, 유지, 놓음). 발진기를 돌려줌
function sndSus(c, d, type, f0, f1, t, dur, vol, att, rel, fd) {
  var o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f0; o.frequency.setValueAtTime(f0, t); g.gain.value = 0.0001;
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + (fd || dur));
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att);
  g.gain.setValueAtTime(vol, t + Math.max(att, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(d); o.start(t); o.stop(t + dur + 0.03); return o;
}
// 떨림 (주파수 흔들기). dec가 있으면 점점 줄어듦
function sndVib(c, o, t, dur, rate, depth, dec, type) {
  var l = c.createOscillator(), g = c.createGain(); l.frequency.value = rate; if (type) l.type = type;
  g.gain.setValueAtTime(depth, t); if (dec) g.gain.exponentialRampToValueAtTime(Math.max(0.01, depth * dec), t + dur);
  l.connect(g); g.connect(o.frequency); l.start(t); l.stop(t + dur + 0.03);
}
// 크기 떨림 (덜덜). 거쳐 가는 게인을 돌려줌
function sndTrem(c, d, t, dur, rate, depth) { var g = c.createGain(), l = c.createOscillator(), lg = c.createGain(); g.gain.value = 1 - depth; l.frequency.value = rate; lg.gain.value = depth; l.connect(lg); lg.connect(g.gain); l.start(t); l.stop(t + dur + 0.03); g.connect(d); return g; }
// 용수철 '뾰잉'
function sndBoing(c, d, t, f0, f1, dur, vol, rate, depth, type) { var o = tone(c, d, type || 'sine', f0, f1, t, dur, vol, 0.003, dur); sndVib(c, o, t, dur, rate || 14, f0 * (depth || 0.2), 0.03); }
// 고무 장난감 '삑'
function sndSqueak(c, d, t, f0, f1, dur, vol, fd) {
  var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.max(f0, f1) * 1.3; bp.Q.value = 1.5; bp.connect(d);
  var o = sndSus(c, bp, 'square', f0, f1, t, dur, vol, 0.012, dur * 0.4, fd); sndVib(c, o, t, dur, 30, f0 * 0.025);
}
// 만화 '펑' 연기 (높은 쪽은 깎아 부드럽게)
function sndPuff(c, d, t, dur, vol, f0, f1) { nz(c, d, t, dur, vol, 'lowpass', f0, f1, 0.7, 0.01); nz(c, d, t, dur * 0.5, vol * 0.45, 'bandpass', f0 * 0.45, f1 * 2, 1.1, 0.006); }
// 슬라이드 휘슬
function sndSlide(c, d, t, f0, f1, dur, vol) { var o = sndSus(c, d, 'sine', f0, f1, t, dur, vol, 0.025, dur * 0.35); sndVib(c, o, t, dur, 7, f0 * 0.018); nz(c, d, t, dur, vol * 0.1, 'bandpass', f0, f1, 6, 0.02); }
// 장난감 나팔: 톱니 + 네모, 띠 거르개, 아래에서 살짝 올라붙는 음
function sndHorn(c, d, t, f, dur, vol, vib) {
  var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(2400, f * 2 + 500); bp.Q.value = 0.8; bp.connect(d);
  var rel = Math.min(0.07, dur * 0.4);
  var o1 = sndSus(c, bp, 'sawtooth', f * 0.93, f, t, dur, vol, 0.012, rel, 0.04);
  var o2 = sndSus(c, bp, 'square', f * 0.935, f * 1.004, t, dur, vol * 0.45, 0.012, rel, 0.04);
  if (vib) { sndVib(c, o1, t, dur, 5.5, f * 0.012 * vib); sndVib(c, o2, t, dur, 5.5, f * 0.012 * vib); }
  nz(c, d, t, 0.015, vol * 0.5, 'bandpass', 2000, 2000, 1.5, 0.002);
}

// 효과음 { 이름: [길이, 만드는 함수, 크기 보정(없으면 1)] }. 위에서부터 차례로 만든다 (단추 소리 먼저)
var SFX_DEF = {
  // --- 단추 ---
  ui: [0.25, function (c, d) { sndPlip(c, d, 0, 740, 0.08, 0.32, 1.6); sndPlip(c, d, 0.06, 1109, 0.1, 0.3, 1.6); sndBar(c, d, 0.06, 2217, 0.14, 0.05, 'glk'); }, 0.5],
  click: [0.12, function (c, d) { sndPlip(c, d, 0, 640, 0.06, 0.34, 1.8); }],
  tick: [0.12, function (c, d) { sndTok(c, d, 0, 1500, 0.24, 0.05); }],
  warn: [0.6, function (c, d) { tone(c, d, 'triangle', 740, 720, 0, 0.12, 0.3, 0.008); tone(c, d, 'sine', 1480, 1440, 0, 0.07, 0.06, 0.008); tone(c, d, 'triangle', 587, 545, 0.16, 0.3, 0.3, 0.008, 0.26); tone(c, d, 'sine', 1175, 1090, 0.16, 0.16, 0.06, 0.008); }, 0.56],
  // --- 쏘기 ---
  bow: [0.35, function (c, d) { tone(c, d, 'sine', 1600, 520, 0, 0.085, 0.26, 0.002, 0.065); tone(c, d, 'triangle', 392, 384, 0, 0.1, 0.12, 0.002); nz(c, d, 0, 0.06, 0.05, 'bandpass', 2500, 5000, 1.5, 0.004); }, 2.0],
  bowS: [0.32, function (c, d) { tone(c, d, 'sine', 1800, 600, 0, 0.075, 0.2, 0.002, 0.06); tone(c, d, 'sine', 2100, 700, 0.055, 0.075, 0.17, 0.002, 0.06); tone(c, d, 'triangle', 440, 430, 0, 0.09, 0.1, 0.002); nz(c, d, 0, 0.1, 0.05, 'bandpass', 2600, 5200, 1.5, 0.005); }, 1.26],
  snipe: [0.4, function (c, d) { sndBar(c, d, 0, 2093, 0.3, 0.2, 'glk'); tone(c, d, 'sine', 3400, 1000, 0.012, 0.12, 0.12, 0.002, 0.1); nz(c, d, 0.01, 0.09, 0.06, 'bandpass', 5500, 2000, 2, 0.003); }, 1.26],
  bowBig: [0.9, function (c, d) { nz(c, d, 0, 0.55, 0.35, 'bandpass', 500, 4500, 1.1, 0.08); tone(c, d, 'sine', 330, 1320, 0, 0.45, 0.2, 0.04, 0.35); sndBoop(c, d, 0, 280, 140, 0.16, 0.35); sndArp(c, d, 0.1, [84, 88, 91, 96, 100], 0.055, 0.4, 0.12, 'glk'); sndSparkle(c, d, 0.3, 6, 0.3, 88, 108, 0.06, 0.3); }, 1.26],
  thunk: [0.5, function (c, d) { sndTok(c, d, 0, 800, 0.55, 0.09); sndBoing(c, d, 0.01, 200, 185, 0.2, 0.12, 24, 0.05, 'triangle'); }, 1.58],
  creak: [0.6, function (c, d) { sndTok(c, d, 0, 500, 0.25, 0.07); sndBoing(c, d, 0.02, 300, 340, 0.45, 0.3, 13, 0.18, 'triangle'); }, 1.26],
  toss: [0.4, function (c, d) { sndSlide(c, d, 0, 620, 1500, 0.25, 0.22); }, 0.18],
  flame: [0.6, function (c, d) { nz(c, d, 0, 0.45, 0.4, 'bandpass', 380, 1500, 0.8, 0.07); nz(c, d, 0.02, 0.32, 0.2, 'lowpass', 1200, 400, 0.7, 0.05); tone(c, d, 'sine', 220, 440, 0, 0.3, 0.1, 0.05, 0.25); }, 1.41],
  magic: [0.45, function (c, d) { sndArp(c, d, 0, [81, 85, 88], 0.035, 0.22, 0.15, 'glk'); tone(c, d, 'sine', 900, 1800, 0, 0.16, 0.07, 0.01, 0.14); nz(c, d, 0, 0.18, 0.035, 'highpass', 6000, 9000, 1, 0.02); }, 0.79],
  cannon: [0.9, function (c, d) { tone(c, d, 'sine', 560, 190, 0, 0.08, 0.45, 0.001, 0.035); sndBoop(c, d, 0, 230, 115, 0.22, 0.42); nz(c, d, 0, 0.016, 0.35, 'bandpass', 1300, 900, 1.2, 0.001); sndPuff(c, d, 0.01, 0.35, 0.16, 1800, 300); }, 4.46],
  mortar: [1.2, function (c, d) { tone(c, d, 'sine', 420, 140, 0, 0.1, 0.45, 0.001, 0.04); sndBoop(c, d, 0, 150, 80, 0.3, 0.42); nz(c, d, 0, 0.02, 0.35, 'bandpass', 1100, 800, 1.2, 0.001); sndPuff(c, d, 0.01, 0.45, 0.2, 1600, 250); sndSlide(c, d, 0.3, 1400, 500, 0.6, 0.07); }, 1.78],
  fireCannon: [0.9, function (c, d) { tone(c, d, 'sine', 500, 160, 0, 0.08, 0.4, 0.001, 0.035); sndBoop(c, d, 0, 180, 90, 0.22, 0.38); nz(c, d, 0.02, 0.5, 0.25, 'bandpass', 500, 2000, 0.8, 0.05); }, 2.0],
  // --- 맞히기 ---
  hit: [0.22, function (c, d) { sndBoop(c, d, 0, 440, 200, 0.075, 0.5); sndPlip(c, d, 0, 950, 0.04, 0.2, 1.8); nz(c, d, 0, 0.007, 0.16, 'bandpass', 3200, 3200, 1.5, 0.001); }, 2.0],
  hitBig: [0.6, function (c, d) { tone(c, d, 'sine', 650, 370, 0, 0.15, 0.4, 0.001, 0.05); tone(c, d, 'sine', 1370, 780, 0, 0.07, 0.12, 0.001, 0.05); sndBoop(c, d, 0, 230, 120, 0.13, 0.4); nz(c, d, 0, 0.012, 0.28, 'bandpass', 2000, 1500, 1.5, 0.001); sndBoing(c, d, 0.05, 370, 350, 0.2, 0.07, 18, 0.1); }, 2.24],
  crit: [0.55, function (c, d) { sndBar(c, d, 0, 2093, 0.28, 0.2, 'glk'); sndBar(c, d, 0.07, 3136, 0.33, 0.17, 'glk'); sndBar(c, d, 0.13, 4186, 0.3, 0.07, 'spk'); nz(c, d, 0, 0.18, 0.04, 'highpass', 6000, 9000, 1, 0.01); sndSparkle(c, d, 0.16, 2, 0.12, 100, 110, 0.04, 0.2); }, 0.89],
  // v12: 맞을 때 '뽁', 조준 지정 '쪼옥 띵', 조준 풀기, 콤보 오르는 음(재생 빠르기로 음높이), 최후의 화살 딤 울림
  pok: [0.14, function (c, d) { sndPlip(c, d, 0, 520, 0.045, 0.42, 2.4); sndBoop(c, d, 0, 300, 170, 0.045, 0.16); nz(c, d, 0, 0.006, 0.16, 'bandpass', 3000, 3000, 1.6, 0.001); }, 2.0],
  lock: [0.42, function (c, d) { sndSqueak(c, d, 0, 900, 1700, 0.07, 0.16); sndPlip(c, d, 0.01, 700, 0.05, 0.22, 1.8); sndBar(c, d, 0.07, 1760, 0.26, 0.15, 'glk'); sndBar(c, d, 0.12, 2637, 0.24, 0.09, 'glk'); }, 0.9],
  lockOff: [0.16, function (c, d) { tone(c, d, 'sine', 1200, 560, 0, 0.08, 0.26, 0.002, 0.07); sndTok(c, d, 0, 900, 0.12, 0.04); }, 0.8],
  combo: [0.45, function (c, d) { sndArp(c, d, 0, [79, 84, 88], 0.045, 0.24, 0.16, 'xyl'); sndBar(c, d, 0.13, mtof(91), 0.3, 0.1, 'glk'); sndSparkle(c, d, 0.16, 2, 0.15, 98, 108, 0.04, 0.2); }, 0.9],
  lastHum: [1.0, function (c, d) { var tr = sndTrem(c, d, 0, 0.9, 9, 0.35); sndSus(c, tr, 'triangle', 147, 294, 0, 0.85, 0.2, 0.04, 0.45, 0.5); sndSus(c, d, 'sine', 73, 110, 0, 0.8, 0.22, 0.02, 0.5, 0.4); nz(c, d, 0.05, 0.8, 0.05, 'highpass', 5000, 8000, 0.8, 0.2); sndSparkle(c, d, 0.25, 5, 0.5, 96, 110, 0.04, 0.3); }, 1.0],
  clash: [0.3, function (c, d) { tone(c, d, 'sine', 3000, 2950, 0, 0.09, 0.28, 0.001); tone(c, d, 'sine', 4530, 4480, 0, 0.05, 0.1, 0.001); }],
  magicHit: [0.4, function (c, d) { tone(c, d, 'sine', 800, 360, 0, 0.1, 0.3, 0.002, 0.06); sndBar(c, d, 0.01, 1760, 0.22, 0.11, 'glk'); nz(c, d, 0, 0.1, 0.04, 'highpass', 5000, 8000, 1, 0.005); }, 1.26],
  zap: [0.5, function (c, d) { var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(d); var o = sndSus(c, lp, 'square', 330, 260, 0, 0.13, 0.12, 0.004, 0.04); sndVib(c, o, 0, 0.13, 45, 110, 0, 'square'); sndBar(c, d, 0.1, 1568, 0.3, 0.2, 'glk'); sndBar(c, d, 0.1, 2349, 0.25, 0.08, 'glk'); }, 1.78],
  glass: [0.7, function (c, d) { nz(c, d, 0, 0.1, 0.18, 'lowpass', 1400, 400, 1, 0.005); for (var i = 0; i < 6; i++) sndPlip(c, d, 0.02 + i * 0.045 + Math.random() * 0.03, 500 + Math.random() * 900, 0.05, 0.22, 2); }],
  frost: [0.7, function (c, d) { sndArp(c, d, 0, [100, 95, 103, 98], 0.035, 0.38, 0.085, 'glk'); nz(c, d, 0, 0.28, 0.05, 'highpass', 4000, 8000, 1, 0.03); }, 1.26],
  frostCast: [0.5, function (c, d) { sndArp(c, d, 0, [91, 95, 98, 103], 0.03, 0.3, 0.08, 'glk'); nz(c, d, 0, 0.25, 0.04, 'highpass', 5000, 9000, 1, 0.03); }, 1.26],
  freeze: [0.9, function (c, d) { nz(c, d, 0, 0.5, 0.09, 'highpass', 3000, 7000, 0.8, 0.05); sndArp(c, d, 0, [103, 100, 96, 93, 91, 88], 0.045, 0.45, 0.1, 'glk'); var tr = sndTrem(c, d, 0.05, 0.35, 22, 0.6); sndSus(c, tr, 'triangle', 330, 290, 0.05, 0.35, 0.14, 0.02, 0.15); }, 1.41],
  ice: [1.0, function (c, d) { sndBoop(c, d, 0, 300, 150, 0.12, 0.4); sndArp(c, d, 0.02, [96, 100, 103, 108], 0.03, 0.5, 0.1, 'glk'); nz(c, d, 0, 0.4, 0.12, 'highpass', 3000, 8000, 0.8, 0.02); sndSparkle(c, d, 0.15, 6, 0.4, 91, 108, 0.06, 0.3); }, 1.41],
  // --- 터짐 (만화 '펑') ---
  boom: [1.1, function (c, d) { tone(c, d, 'sine', 600, 200, 0, 0.06, 0.32, 0.001, 0.03); sndPuff(c, d, 0, 0.55, 0.55, 1700, 240); sndBoing(c, d, 0.01, 170, 120, 0.42, 0.4, 11, 0.12, 'triangle'); }, 3.16],
  boomS: [0.5, function (c, d) { tone(c, d, 'sine', 700, 260, 0, 0.05, 0.28, 0.001, 0.03); sndPuff(c, d, 0, 0.3, 0.38, 2000, 320); sndBoing(c, d, 0, 240, 180, 0.26, 0.28, 14, 0.1, 'triangle'); }, 1.58],
  boomBig: [1.6, function (c, d) { tone(c, d, 'sine', 520, 160, 0, 0.08, 0.38, 0.001, 0.04); sndPuff(c, d, 0, 0.9, 0.6, 1800, 170); sndBoing(c, d, 0.01, 140, 95, 0.65, 0.45, 9, 0.14, 'triangle'); sndSparkle(c, d, 0.18, 7, 0.6, 86, 103, 0.06, 0.4); }, 2.51],
  boomFire: [1.2, function (c, d) { tone(c, d, 'sine', 560, 200, 0, 0.06, 0.3, 0.001, 0.03); sndPuff(c, d, 0, 0.5, 0.46, 1700, 260); nz(c, d, 0.02, 0.5, 0.22, 'bandpass', 500, 2000, 0.8, 0.05); sndBoing(c, d, 0, 180, 130, 0.35, 0.3, 12, 0.1, 'triangle'); for (var i = 0; i < 5; i++) sndPlip(c, d, 0.12 + Math.random() * 0.5, 600 + Math.random() * 600, 0.04, 0.15, 2.4); }, 3.2],
  // --- 처치 ---
  kill: [0.38, function (c, d) { tone(c, d, 'sine', 420, 1500, 0, 0.12, 0.38, 0.002, 0.07); tone(c, d, 'triangle', 210, 750, 0, 0.08, 0.13, 0.002, 0.07); nz(c, d, 0, 0.01, 0.22, 'bandpass', 2500, 2500, 1.5, 0.001); sndBar(c, d, 0.06, 2637, 0.2, 0.09, 'glk'); sndSparkle(c, d, 0.09, 2, 0.12, 98, 110, 0.045, 0.2); }, 1.41],
  pop: [0.22, function (c, d) { nz(c, d, 0, 0.014, 0.32, 'bandpass', 1600, 900, 1.2, 0.001); sndPlip(c, d, 0, 330, 0.05, 0.28, 2.6); }, 3.98],
  die: [0.35, function (c, d) { sndPuff(c, d, 0, 0.2, 0.28, 2000, 400); sndSqueak(c, d, 0.02, 1300, 600, 0.18, 0.16); }, 0.71],
  dieBig: [0.8, function (c, d) { sndBoop(c, d, 0, 330, 150, 0.12, 0.45); sndPuff(c, d, 0, 0.4, 0.42, 2200, 250); sndSlide(c, d, 0.05, 1400, 380, 0.45, 0.2); sndBar(c, d, 0.08, 2637, 0.3, 0.07, 'glk'); }, 0.47],
  bossDie: [2.5, function (c, d) { sndBoop(c, d, 0, 300, 120, 0.25, 0.5); sndPuff(c, d, 0, 1.1, 0.55, 2600, 150); sndBoing(c, d, 0.02, 130, 90, 0.7, 0.4, 8, 0.14, 'triangle'); sndSlide(c, d, 0.1, 1600, 420, 0.55, 0.18); sndArp(c, d, 0.55, [72, 76, 79, 84, 88, 91, 96], 0.07, 0.6, 0.17, 'xyl'); sndSparkle(c, d, 0.7, 12, 0.9, 88, 108, 0.06, 0.5); [72, 76, 79, 84].forEach(function (m) { sndBar(c, d, 1.15, mtof(m), 1.1, 0.12, 'toy'); }); }, 1.1],
  // --- 금화 ---
  coinS: [0.2, function (c, d) { tone(c, d, 'sine', 1976, 1976, 0, 0.1, 0.12, 0.001); tone(c, d, 'sine', 5450, 5450, 0, 0.035, 0.03, 0.001); tone(c, d, 'sine', 2637, 2637, 0.028, 0.13, 0.11, 0.001); tone(c, d, 'sine', 7280, 7280, 0.028, 0.04, 0.025, 0.001); }, 0.79],
  coin: [0.4, function (c, d) { sndBar(c, d, 0, 988, 0.1, 0.22, 'glk'); sndBar(c, d, 0.07, 1319, 0.3, 0.24, 'glk'); }, 0.79],
  chest: [1.0, function (c, d) { sndTok(c, d, 0, 600, 0.32, 0.08); sndTok(c, d, 0.07, 760, 0.24, 0.06); sndArp(c, d, 0.12, [79, 83, 86, 91, 95, 98], 0.055, 0.5, 0.13, 'box'); sndSparkle(c, d, 0.45, 5, 0.35, 91, 108, 0.05, 0.3); }],
  sell: [0.6, function (c, d) { sndPlip(c, d, 0, 500, 0.06, 0.22, 2); [2093, 2349, 2637, 3136].forEach(function (f, i) { sndBar(c, d, 0.05 + i * 0.05, f, 0.18, 0.09, 'glk'); }); }, 0.71],
  // --- 짓기, 강화 ---
  build: [0.7, function (c, d) { sndTok(c, d, 0, 700, 0.4, 0.08); sndTok(c, d, 0.1, 820, 0.4, 0.08); sndTok(c, d, 0.2, 700, 0.42, 0.08); sndBar(c, d, 0.3, 1568, 0.36, 0.13, 'glk'); sndBar(c, d, 0.3, 2093, 0.36, 0.09, 'glk'); }, 0.88],
  upgrade: [0.9, function (c, d) { sndArp(c, d, 0, [72, 76, 79, 84], 0.065, 0.45, 0.16, 'xyl'); sndArp(c, d, 0, [84, 88, 91, 96], 0.065, 0.5, 0.05, 'glk'); tone(c, d, 'sine', 500, 2000, 0, 0.35, 0.05, 0.03, 0.3); nz(c, d, 0.1, 0.5, 0.035, 'highpass', 6000, 9000, 1, 0.1); }],
  upgradeBig: [1.4, function (c, d) { sndArp(c, d, 0, [67, 72, 76, 79, 84, 88], 0.06, 0.6, 0.16, 'xyl'); sndArp(c, d, 0, [79, 84, 88, 91, 96, 100], 0.06, 0.7, 0.05, 'glk'); [72, 76, 79, 84].forEach(function (m) { sndBar(c, d, 0.4, mtof(m + 12), 0.85, 0.07, 'box'); }); sndSparkle(c, d, 0.4, 8, 0.5, 91, 108, 0.05, 0.4); nz(c, d, 0, 0.9, 0.04, 'highpass', 5000, 9000, 1, 0.2); }],
  powerup: [1.4, function (c, d) { sndSlide(c, d, 0, 400, 1600, 0.4, 0.14); sndArp(c, d, 0.35, [72, 76, 79, 84, 88], 0.06, 0.6, 0.15, 'mar'); [84, 88, 91].forEach(function (m) { sndBar(c, d, 0.65, mtof(m), 0.7, 0.07, 'glk'); }); sndSparkle(c, d, 0.6, 6, 0.4, 91, 108, 0.05, 0.3); }, 1.26],
  // --- 웨이브, 성문 ---
  horn: [1.6, function (c, d) { [[79, 76, 0, 0.11], [79, 76, 0.14, 0.11], [84, 79, 0.28, 0.6]].forEach(function (n, i) { sndHorn(c, d, n[2], mtof(n[0]), n[3], 0.2, i === 2 ? 1 : 0); sndHorn(c, d, n[2], mtof(n[1]), n[3], 0.11, 0); sndBoop(c, d, n[2], 210, 120, 0.1, i === 2 ? 0.32 : 0.2); }); sndSparkle(c, d, 0.3, 5, 0.45, 91, 108, 0.05, 0.4); }, 1.26],
  gate: [0.7, function (c, d) { sndBoop(c, d, 0, 300, 140, 0.12, 0.45); sndBoing(c, d, 0, 230, 200, 0.3, 0.32, 15, 0.2, 'triangle'); sndSqueak(c, d, 0.15, 1500, 700, 0.3, 0.22); }, 0.6],
  gateBreak: [2.4, function (c, d) { sndBoop(c, d, 0, 260, 100, 0.3, 0.55); sndPuff(c, d, 0, 1.0, 0.5, 2400, 160); for (var i = 0; i < 8; i++) sndTok(c, d, 0.15 + i * 0.11 + Math.random() * 0.04, 900 - i * 60 + Math.random() * 80, 0.3 - i * 0.02, 0.09); sndSlide(c, d, 0.3, 1200, 300, 0.9, 0.17); sndBoing(c, d, 1.3, 180, 150, 0.6, 0.32, 10, 0.2, 'triangle'); }, 1.41],
  // --- 적의 재주 ---
  heal: [0.6, function (c, d) { sndArp(c, d, 0, [84, 88, 91], 0.06, 0.38, 0.12, 'box'); tone(c, d, 'sine', 700, 1400, 0, 0.35, 0.05, 0.05, 0.3); }],
  shield: [0.6, function (c, d) { var tr = sndTrem(c, d, 0, 0.45, 18, 0.4); sndSus(c, tr, 'sine', 320, 820, 0, 0.42, 0.25, 0.02, 0.2, 0.3); sndBar(c, d, 0.25, 1760, 0.28, 0.08, 'glk'); }, 0.56],
  bones: [0.5, function (c, d) { var ms = [84, 86, 88, 91, 93, 96]; for (var i = 0; i < 7; i++) sndBar(c, d, i * 0.04 + Math.random() * 0.012, mtof(ms[Math.floor(Math.random() * 6)]), 0.14, 0.18, 'xyl'); }, 0.5],
  revive: [0.6, function (c, d) { sndBoing(c, d, 0, 220, 520, 0.35, 0.26, 12, 0.1); sndBar(c, d, 0.3, 2093, 0.24, 0.1, 'glk'); }, 0.66],
  roar: [1.6, function (c, d) {
    // 투덜대는 '그르르' + 끝에 '삑!'
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.3; bp.frequency.setValueAtTime(450, 0); bp.frequency.linearRampToValueAtTime(950, 0.3); bp.frequency.linearRampToValueAtTime(520, 0.75); bp.connect(d);
    var tr = sndTrem(c, bp, 0, 0.8, 24, 0.5);
    var o = sndSus(c, tr, 'sawtooth', 140, 140, 0, 0.78, 0.55, 0.06, 0.2); o.frequency.linearRampToValueAtTime(190, 0.28); o.frequency.linearRampToValueAtTime(125, 0.78);
    var o2 = sndSus(c, tr, 'square', 70, 70, 0, 0.78, 0.18, 0.06, 0.2); o2.frequency.linearRampToValueAtTime(95, 0.28); o2.frequency.linearRampToValueAtTime(62, 0.78);
    sndBoop(c, d, 0, 160, 100, 0.2, 0.3); sndSqueak(c, d, 0.74, 1300, 2100, 0.22, 0.24, 0.07);
  }, 1.12],
  slam: [1.4, function (c, d) { sndBoop(c, d, 0, 280, 120, 0.3, 0.55); tone(c, d, 'sine', 600, 340, 0, 0.14, 0.3, 0.001, 0.05); sndPuff(c, d, 0, 0.8, 0.5, 2200, 150); sndBoing(c, d, 0.05, 150, 110, 0.6, 0.35, 9, 0.15, 'triangle'); }, 1.41],
  brood: [0.6, function (c, d) { for (var i = 0; i < 4; i++) { var f = 1900 + Math.random() * 900; tone(c, d, 'sine', f, f * 1.35, i * 0.1 + Math.random() * 0.03, 0.06, 0.18, 0.004, 0.03); } }, 0.23],
  summon: [1.2, function (c, d) {
    // 테레민 '우우~'
    var o = sndSus(c, d, 'sine', 392, 392, 0, 1.0, 0.28, 0.15, 0.35); o.frequency.linearRampToValueAtTime(659, 0.35); o.frequency.linearRampToValueAtTime(523, 0.8); sndVib(c, o, 0, 1.0, 6.5, 14);
    var o2 = sndSus(c, d, 'triangle', 784, 784, 0.05, 0.95, 0.05, 0.15, 0.35); o2.frequency.linearRampToValueAtTime(1318, 0.4); o2.frequency.linearRampToValueAtTime(1046, 0.85); sndVib(c, o2, 0.05, 0.95, 6.5, 28);
    sndSparkle(c, d, 0.5, 4, 0.4, 88, 100, 0.04, 0.3);
  }, 0.38],
  blink: [0.6, function (c, d) { tone(c, d, 'sine', 1400, 300, 0, 0.12, 0.25, 0.002, 0.1); tone(c, d, 'sine', 300, 1600, 0.13, 0.12, 0.22, 0.002, 0.1); sndBar(c, d, 0.24, 2349, 0.25, 0.08, 'glk'); }],
  heartbeat: [1.2, function (c, d) { sndBoop(c, d, 0, 190, 110, 0.16, 0.42); tone(c, d, 'sine', 400, 230, 0, 0.07, 0.12, 0.002); sndBoop(c, d, 0.24, 175, 100, 0.2, 0.32); tone(c, d, 'sine', 370, 210, 0.24, 0.08, 0.09, 0.002); }],
  // --- 기술, 연출 ---
  rain: [1.6, function (c, d) { for (var i = 0; i < 18; i++) { var t = i * 0.072 + Math.random() * 0.05; if (i % 3 === 2) sndBar(c, d, t, mtof(sndPent(88 + Math.random() * 16)), 0.2, 0.08, 'glk'); else sndPlip(c, d, t, 700 + Math.random() * 900, 0.04, 0.16, 1.8); } nz(c, d, 0, 1.3, 0.04, 'highpass', 4000, 7000, 0.7, 0.3); }, 1.26],
  reinf: [1.4, function (c, d) { [[67, 0, 0.12], [72, 0.15, 0.12], [76, 0.3, 0.12], [79, 0.45, 0.6]].forEach(function (n, i) { sndHorn(c, d, n[1], mtof(n[0]), n[2], 0.18, i === 3 ? 1 : 0); sndBoop(c, d, n[1], 200, 120, 0.1, i === 3 ? 0.3 : 0.18); }); }],
  star: [0.8, function (c, d) { sndBar(c, d, 0, 2637, 0.55, 0.22, 'glk'); sndBar(c, d, 0.05, 3951, 0.45, 0.1, 'glk'); sndPlip(c, d, 0, 600, 0.06, 0.18, 2); nz(c, d, 0, 0.35, 0.04, 'highpass', 6000, 9000, 1, 0.05); }],
  dawn: [2.2, function (c, d) { [65, 69, 72, 77].forEach(function (m, i) { sndSus(c, d, 'triangle', mtof(m), mtof(m), i * 0.08, 1.9, 0.06, 0.5, 0.9); }); sndArp(c, d, 0.3, [77, 81, 84, 89, 93, 96], 0.12, 0.9, 0.11, 'glk'); sndSparkle(c, d, 0.9, 8, 0.8, 91, 108, 0.04, 0.4); nz(c, d, 0, 1.5, 0.05, 'highpass', 3000, 7000, 0.6, 0.6); }, 1.41],
  crown: [3.0, function (c, d) {
    sndBar(c, d, 0, 2093, 1.2, 0.24, 'glk'); sndBar(c, d, 0, 3136, 1.0, 0.11, 'glk');
    sndBoop(c, d, 0, 260, 120, 0.3, 0.5); sndPuff(c, d, 0, 0.8, 0.4, 3000, 300);
    nz(c, d, 0.05, 1.6, 0.1, 'highpass', 3000, 9000, 0.8, 0.3);
    sndSparkle(c, d, 0.1, 14, 1.5, 84, 110, 0.065, 0.5);
    sndArp(c, d, 0.35, [60, 64, 67, 72, 76, 79, 84], 0.08, 1.3, 0.13, 'box');
    [72, 76, 79, 84].forEach(function (m) { sndBar(c, d, 1.0, mtof(m), 1.7, 0.09, 'toy'); sndSus(c, d, 'triangle', mtof(m), mtof(m), 1.0, 1.8, 0.05, 0.3, 0.9); });
  }, 1.41],
  victory: [3.4, function (c, d) {
    // 장난감 나팔 '빰빠빰빠~ 빰빠 빠밤!'
    [[72, 0, 0.13], [76, 0.15, 0.13], [79, 0.3, 0.13], [84, 0.45, 0.45], [81, 1.0, 0.14], [83, 1.17, 0.14], [84, 1.34, 1.3]].forEach(function (x, i) { sndHorn(c, d, x[1], mtof(x[0]), x[2], 0.17, i === 6 ? 1 : 0); sndBar(c, d, x[1], mtof(x[0]), x[2] + 0.35, 0.12, 'mar'); });
    [[48, 0, 0.4], [43, 0.45, 0.45], [53, 1.0, 0.15], [55, 1.17, 0.15], [48, 1.34, 1.3]].forEach(function (b) { var f = mtof(b[0]); tone(c, d, 'sine', f, f, b[1], b[2], 0.35, 0.004); tone(c, d, 'triangle', f, f, b[1], 0.08, 0.15, 0.002); });
    [0, 0.45, 1.0, 1.34].forEach(function (t) { sndBoop(c, d, t, 210, 120, 0.12, 0.28); });
    sndSparkle(c, d, 1.38, 11, 1.2, 88, 108, 0.06, 0.5);
    [60, 64, 67, 72].forEach(function (m) { sndBar(c, d, 1.34, mtof(m + 12), 1.7, 0.07, 'toy'); });
  }],
  defeat: [3.2, function (c, d) {
    // 슬픈 트롬본 '빠-빠-빠-빠아앙' (거르개가 열렸다 닫히며 와와)
    [[58, 0, 0.42], [57, 0.48, 0.42], [56, 0.96, 0.42], [55, 1.44, 1.5]].forEach(function (x, i) {
      var f = mtof(x[0]), last = i === 3, lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4; lp.connect(d);
      lp.frequency.setValueAtTime(300, x[1]); lp.frequency.linearRampToValueAtTime(1400, x[1] + 0.13); lp.frequency.linearRampToValueAtTime(last ? 700 : 450, x[1] + 0.4);
      var o = sndSus(c, lp, 'sawtooth', f, last ? f * 0.97 : f, x[1], x[2], 0.32, 0.03, last ? 0.4 : 0.1);
      if (last) { sndVib(c, o, x[1] + 0.2, x[2] - 0.2, 5, f * 0.035); var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5; lg.gain.value = 450; l.connect(lg); lg.connect(lp.frequency); l.start(x[1] + 0.4); l.stop(x[1] + x[2]); }
      tone(c, d, 'sine', f / 2, f / 2, x[1], x[2], 0.18, 0.03);
    });
  }, 1.12],
  // --- 그 밖 ---
  stomp: [0.9, function (c, d) { sndBoop(c, d, 0, 230, 110, 0.3, 0.6); sndPuff(c, d, 0, 0.45, 0.35, 1400, 150); sndBoing(c, d, 0.03, 120, 100, 0.4, 0.25, 9, 0.15, 'triangle'); }, 1.41],
  hitHero: [0.3, function (c, d) { tone(c, d, 'sine', 600, 350, 0, 0.1, 0.32, 0.001, 0.04); sndBoop(c, d, 0, 220, 120, 0.1, 0.32); nz(c, d, 0, 0.01, 0.2, 'bandpass', 2200, 1800, 1.5, 0.001); }, 1.41],
  statue: [1.6, function (c, d) { sndBoop(c, d, 0, 200, 90, 0.3, 0.45); sndPuff(c, d, 0, 0.6, 0.35, 2000, 200); sndArp(c, d, 0.2, [72, 76, 79, 84, 88], 0.08, 0.9, 0.13, 'box'); sndSparkle(c, d, 0.3, 10, 0.8, 88, 108, 0.05, 0.4); }],
  join: [0.9, function (c, d) { sndArp(c, d, 0, [76, 79, 84, 88], 0.05, 0.3, 0.15, 'mar'); sndHorn(c, d, 0.02, mtof(67), 0.16, 0.12, 0); sndHorn(c, d, 0.2, mtof(72), 0.3, 0.14, 1); }],
  wood: [0.8, function (c, d) { sndBoop(c, d, 0, 240, 110, 0.15, 0.45); sndPuff(c, d, 0, 0.35, 0.3, 1800, 250); for (var i = 0; i < 6; i++) sndTok(c, d, 0.04 + i * 0.07 + Math.random() * 0.03, 650 + Math.random() * 500 - i * 40, 0.28 - i * 0.025, 0.08); }, 0.75],
  rock: [0.7, function (c, d) { tone(c, d, 'sine', 560, 300, 0, 0.12, 0.35, 0.001, 0.04); sndBoop(c, d, 0, 200, 100, 0.14, 0.4); sndPuff(c, d, 0, 0.3, 0.25, 2000, 300); for (var i = 0; i < 6; i++) sndTok(c, d, 0.05 + i * 0.05 + Math.random() * 0.03, 1300 + Math.random() * 1200, 0.18, 0.04); }, 0.84],
  bell: [1.4, function (c, d) { sndBar(c, d, 0, 1047, 1.2, 0.22, 'glk'); sndBar(c, d, 0, 1568, 1.0, 0.08, 'glk'); sndBar(c, d, 0.002, 2093, 0.8, 0.06, 'box'); }]
};

var SFX = {
  on: true, vol: 1, ready: false,
  init: function () {
    // 3개씩 나란히 만든다 (하나씩보다 빠름)
    var keys = Object.keys(SFX_DEF), i = 0, live = 0;
    function next() {
      if (i >= keys.length) { if (!live) SFX.ready = true; return; }
      var k = keys[i++], def = SFX_DEF[k]; live++;
      renderOffline(1, 32000, def[0] + 0.1, function (ctx, out) {
        var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -6; comp.ratio.value = 4; comp.channelCount = 1; comp.channelCountMode = 'explicit'; comp.connect(out);
        var g = ctx.createGain(); g.gain.value = def[2] || 1; g.connect(comp);
        def[1](ctx, g);
      }).then(function (b) { if (b) SFX_BUF[k] = b; live--; setTimeout(next, 0); });
    }
    for (var j = 0; j < 3; j++) next();
  },
  unlock: function () {
    try {
      if (!AC) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        AC = new Ctx();
        MASTER = AC.createDynamicsCompressor(); MASTER.threshold.value = -10; MASTER.ratio.value = 3; MASTER.connect(AC.destination);
        SFX_BUS = AC.createGain(); SFX_BUS.gain.value = 0.9; SFX_BUS.connect(MASTER);
      }
      if (AC.state !== 'running') AC.resume();
      var b = AC.createBuffer(1, 1, 22050), s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(0);
    } catch (e) { }
  },
  play: function (k, vol, rate) {
    if (!SFX.on) return;
    var now = performance.now(), L = SFX_LIM[k], n = SFX_VOX[k] || 0;
    if (SFX_LAST[k] && now - SFX_LAST[k] < (L ? L[0] : 45)) return;
    var b = SFX_BUF[k];
    // v2.0: 아직 안 만든 새 소리는 그 묶음을 지금 만들기 시작 (이번 한 번은 소리 없음)
    if (!b) { if (!L) SFX_LAST[k] = now; if (SFX.need) SFX.need(k); return; }
    if (L && (n >= L[1] || SFX_LIVE >= SFX_CAP)) return;
    SFX_LAST[k] = now;
    if (SFX.log) SFX.log.push([k, +(vol == null ? 1 : vol).toFixed(2), Math.round(now)]);   // 시험용 기록
    if (AC && AC.state === 'running') {
      try {
        var s = AC.createBufferSource(); s.buffer = b;
        s.playbackRate.value = (rate || 1) * (0.94 + Math.random() * 0.12);
        var g = AC.createGain(); g.gain.value = (vol == null ? 1 : vol) * SFX.vol * (L && n ? Math.pow(L[2] || 0.8, n) : 1);
        s.connect(g); g.connect(SFX_BUS); s.start();
        if (L) { SFX_VOX[k] = n + 1; SFX_LIVE++; s.onended = function () { SFX_VOX[k] = Math.max(0, (SFX_VOX[k] || 1) - 1); SFX_LIVE = Math.max(0, SFX_LIVE - 1); }; }
      } catch (e) { }
    } else SFX.fallback(k, vol);
  },
  fallback: function (k, vol) {
    if (['bow', 'kill', 'boom', 'coin', 'build', 'upgrade', 'horn', 'gate', 'click', 'ui', 'bowBig', 'cannon', 'victory', 'defeat', 'glass', 'powerup', 'thunk', 'creak', 'magic', 'zap', 'sell', 'star', 'chest', 'dieBig', 'roar', 'transform', 'transformU', 'fuse', 'blastHe', 'navgun', 'mslFire', 'alarm'].indexOf(k) < 0) return;
    var pool = SFX_EL[k];
    if (!pool) {
      var b = SFX_BUF[k]; if (!b) return;
      var url = URL.createObjectURL(wavBlob(b));
      pool = SFX_EL[k] = { i: 0, els: [new Audio(url), new Audio(url), new Audio(url)] };
    }
    var el = pool.els[pool.i++ % 3];
    try { el.volume = Math.min(1, (vol == null ? 1 : vol) * SFX.vol); el.currentTime = 0; var p = el.play(); if (p && p.catch) p.catch(function () { }); } catch (e) { }
  }
};
function wavBlob(buf) {
  var ch = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length, dl = n * ch * 2;
  var ab = new ArrayBuffer(44 + dl), v = new DataView(ab);
  function ws(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
  ws(0, 'RIFF'); v.setUint32(4, 36 + dl, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, dl, true);
  var chans = []; for (var c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
  var o = 44, le = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1, I = le ? new Int16Array(ab, 44, n * ch) : null, s, q = 0;
  // 리틀엔디언이면 Int16Array로 바로 씀 (훨씬 빠름)
  for (var i = 0; i < n; i++) for (var k = 0; k < ch; k++) { s = chans[k][i]; s = s > 1 ? 1 : s < -1 ? -1 : s; s = s < 0 ? s * 0x8000 : s * 0x7FFF; if (I) I[q++] = s; else { v.setInt16(o, s, true); o += 2; } }
  return new Blob([ab], { type: 'audio/wav' });
}

// ---------- 음악 ----------
function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function makeVerb(ctx, sec, decay) {
  var sr = ctx.sampleRate, len = Math.floor(sr * sec), ir = ctx.createBuffer(2, len, sr);
  for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
  var cv = ctx.createConvolver(); cv.buffer = ir; return cv;
}
// 음계 안에서 st칸 옮긴 음 (tonic: 으뜸음 0~11, sc: 음계 간격)
function sndDia(m, st, tonic, sc) {
  var r = m - tonic, o = Math.floor(r / 12), p = r - o * 12, i = sc.indexOf(p);
  if (i < 0) return m - 3;
  var j = i + st; o += Math.floor(j / sc.length); j = ((j % sc.length) + sc.length) % sc.length;
  return tonic + o * 12 + sc[j];
}
// 잔향: 렌더한 뒤 자바스크립트로 계산 (오프라인 렌더 안의 되먹임 지연 고리는 실행마다 결과가 달라짐)
// 반 속도 모노로 빗살 4개(높은 소리는 점점 깎음), 왼쪽 오른쪽은 올패스 길이를 달리해 넓게
function sndVerb(L, R, sr, wet) {
  var h = L.length >> 1, k = sr / 88200, m = new Float32Array(h), cb = new Float32Array(h), i, j, q, y, v, st, len, b, o, x;
  for (i = 0; i < h; i++) m[i] = (L[2 * i] + L[2 * i + 1] + R[2 * i] + R[2 * i + 1]) * 0.02;
  for (q = 0; q < 4; q++) {
    len = Math.round([1116, 1188, 1277, 1356][q] * k); b = new Float32Array(len); st = 0; j = 0;
    for (i = 0; i < h; i++) { y = b[j]; st = y * 0.8 + st * 0.2; b[j] = m[i] + st * 0.8; cb[i] += y; if (++j === len) j = 0; }
  }
  for (var ch = 0; ch < 2; ch++) {
    o = new Float32Array(cb); x = ch ? R : L;
    for (q = 0; q < 2; q++) {
      len = Math.round(([556, 441][q] + ch * 23) * k); b = new Float32Array(len); j = 0;
      for (i = 0; i < h; i++) { y = b[j]; v = o[i]; o[i] = y - v; b[j] = v + y * 0.5; if (++j === len) j = 0; }
    }
    for (i = 0; i < h - 1; i++) { x[2 * i] += o[i] * wet; x[2 * i + 1] += (o[i] + o[i + 1]) * 0.5 * wet; }
  }
}
var INST = {
  // 선율 악기
  box: function (c, d, t, v, m, len) { sndBar(c, d, t, mtof(m), Math.min(2, 1 + len), 0.17 * v, 'box'); },
  glk: function (c, d, t, v, m, len) { sndBar(c, d, t, mtof(m), Math.min(1.4, 0.7 + len), 0.12 * v, 'glk'); },
  mar: function (c, d, t, v, m, len) { sndBar(c, d, t, mtof(m), Math.min(1.1, 0.45 + len * 0.5), 0.26 * v, 'mar'); },
  xyl: function (c, d, t, v, m) { sndBar(c, d, t, mtof(m), 0.5, 0.17 * v, 'xyl'); },
  toy: function (c, d, t, v, m, len) { sndBar(c, d, t, mtof(m), Math.min(1.3, 0.6 + len), 0.15 * v, 'toy'); },
  pizz: function (c, d, t, v, m) { var f = mtof(m); tone(c, d, 'triangle', f, f, t, 0.32, 0.27 * v, 0.002); tone(c, d, 'sawtooth', f, f, t, 0.06, 0.09 * v, 0.002); },
  bass: function (c, d, t, v, m, len) { var f = mtof(m); tone(c, d, 'sine', f * 1.02, f, t, Math.min(1.2, len + 0.1), 0.34 * v, 0.004, 0.04); tone(c, d, 'triangle', f, f, t, 0.08, 0.15 * v, 0.002); },
  pad: function (c, d, t, v, m, len) {
    var g = c.createGain(), a = Math.min(0.5, len * 0.35), e = t + len + 0.35;
    g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04 * v, t + a); g.gain.setValueAtTime(0.04 * v, t + Math.max(a, len)); g.gain.linearRampToValueAtTime(0.0001, e); g.connect(d);
    [0.997, 1.003].forEach(function (k) { var o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m) * k; o.connect(g); o.start(t); o.stop(e + 0.02); });
  },
  organ: function (c, d, t, v, m, len) { var f = mtof(m), r = Math.min(0.05, len * 0.3); sndSus(c, d, 'square', f, f, t, len, 0.045 * v, 0.005, r); sndSus(c, d, 'sine', f * 2, f * 2, t, len, 0.05 * v, 0.005, r); },
  horn: function (c, d, t, v, m, len) { sndHorn(c, d, t, mtof(m), len, 0.1 * v, len > 0.5 ? 1 : 0); },
  // 북
  kick: function (c, d, t, v) { tone(c, d, 'sine', 170, 58, t, 0.18, 0.4 * v, 0.002, 0.07); tone(c, d, 'triangle', 340, 120, t, 0.03, 0.1 * v, 0.001, 0.02); },
  clap: function (c, d, t, v) {
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf(c); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.1;
    g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t);
    [0, 0.011, 0.022].forEach(function (o) { g.gain.setValueAtTime(0.0001, t + o); g.gain.linearRampToValueAtTime(0.5 * v, t + o + 0.001); g.gain.exponentialRampToValueAtTime(0.05 * v, t + o + 0.01); });
    g.gain.setValueAtTime(0.3 * v, t + 0.033); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    s.connect(f); f.connect(g); g.connect(d); s.start(t, Math.random()); s.stop(t + 0.2);
  },
  shk: function (c, d, t, v) { nz(c, d, t, 0.045, 0.1 * v, 'highpass', 6000, 7500, 0.8, 0.01); },
  wood: function (c, d, t, v, m) { sndTok(c, d, t, m ? mtof(m) : 1100, 0.22 * v, 0.06); },
  tri: function (c, d, t, v) { tone(c, d, 'sine', 4186, 4186, t, 0.9, 0.03 * v, 0.001); tone(c, d, 'sine', 5590, 5590, t, 0.6, 0.02 * v, 0.001); },
  tom: function (c, d, t, v, m) { var f = mtof(m || 50); tone(c, d, 'sine', f * 1.6, f, t, 0.2, 0.45 * v, 0.002, 0.05); tone(c, d, 'triangle', f * 3.2, f * 2, t, 0.05, 0.08 * v, 0.001, 0.03); },
  splash: function (c, d, t, v) { nz(c, d, t, 0.8, 0.06 * v, 'highpass', 5000, 7000, 0.7, 0.005); sndSparkle(c, d, t, 3, 0.2, 96, 108, 0.05 * v, 0.6); }
};
var SONGS = {
  // 처음 화면: F장조, 오르골 선율 + 부드러운 패드 + 낮은 베이스
  menu: { bpm: 100, bars: 16, vol: 1.05, wet: 0.3,
    // [베이스, 화음 3음]: F C/E Dm Bb F/A Gm C7 F | F C/E Dm Bb Gm C Bb C7
    prog: [[41, 65, 69, 72], [40, 64, 67, 72], [38, 65, 69, 74], [46, 65, 70, 74], [45, 65, 69, 72], [43, 67, 70, 74], [48, 64, 67, 70], [41, 65, 69, 72],
      [41, 65, 69, 72], [40, 64, 67, 72], [38, 65, 69, 74], [46, 65, 70, 74], [43, 67, 70, 74], [48, 64, 67, 72], [46, 65, 70, 74], [48, 64, 67, 70]],
    // 마디마다 [박, 길이, 음]
    mel: [
      [[0, 1, 69], [1, 0.5, 72], [1.5, 1.5, 77], [3, 0.5, 76], [3.5, 0.5, 77]], [[0, 1.5, 79], [1.5, 0.5, 76], [2, 2, 72]],
      [[0, 1, 74], [1, 0.5, 77], [1.5, 1.5, 81], [3, 0.5, 79], [3.5, 0.5, 77]], [[0, 1.5, 77], [1.5, 0.5, 72], [2, 2, 74]],
      [[0, 1, 69], [1, 0.5, 72], [1.5, 1.5, 77], [3, 0.5, 76], [3.5, 0.5, 77]], [[0, 1.5, 82], [1.5, 0.5, 81], [2, 2, 79]],
      [[0, 1, 76], [1, 1, 79], [2, 1, 82], [3, 0.5, 81], [3.5, 0.5, 79]], [[0, 2.5, 77], [3.5, 0.5, 67]],
      [[0, 1, 69], [1, 0.5, 72], [1.5, 1.5, 77], [3, 0.5, 76], [3.5, 0.5, 77]], [[0, 1.5, 79], [1.5, 0.5, 76], [2, 2, 72]],
      [[0, 1, 74], [1, 0.5, 77], [1.5, 1.5, 81], [3, 0.5, 79], [3.5, 0.5, 77]], [[0, 1.5, 77], [1.5, 0.5, 72], [2, 2, 74]],
      [[0, 1, 79], [1, 0.5, 82], [1.5, 1.5, 86], [3, 0.5, 84], [3.5, 0.5, 82]], [[0, 1.5, 79], [1.5, 0.5, 76], [2, 2, 72]],
      [[0, 1, 74], [1, 0.5, 77], [1.5, 1.5, 82], [3, 0.5, 81], [3.5, 0.5, 79]], [[0, 1, 77], [1, 1, 76], [2, 1, 74], [3, 0.5, 72], [3.5, 0.5, 67]]],
    build: function (S) {
      // 뒤 절에서 글로켄이 대답 (선율이 쉬는 자리)
      var ans = { 9: [[2.5, 0.5, 91], [3, 0.5, 88], [3.5, 0.5, 84]], 11: [[2.5, 0.5, 89], [3, 0.5, 86], [3.5, 0.5, 82]], 13: [[2.5, 0.5, 88], [3, 0.5, 91], [3.5, 0.5, 96]], 7: [[2.5, 0.5, 84], [3, 0.5, 81], [3.5, 0.5, 79]] };
      for (var b = 0; b < S.bars; b++) {
        var P = S.prog[b], t0 = b * 4, two = b >= 8;
        for (var k = 1; k < 4; k++) S.n('pad', t0, 4, P[k], 0.6);
        S.n('bass', t0, 1.8, P[0], 0.75); S.n('bass', t0 + 2, 1.8, P[3] - 24, 0.55);
        var arp = [P[1] - 12, P[2] - 12, P[3] - 12, P[2] - 12];
        for (var q = 0; q < 4; q++) S.n('mar', t0 + q, 1, arp[q], q ? 0.3 : 0.4);
        if (two) for (var q2 = 0; q2 < 4; q2++) S.n('mar', t0 + q2 + 0.5, 0.5, arp[(q2 + 2) % 4] + 12, 0.16);
        S.mel[b].forEach(function (x) { S.n('box', t0 + x[0], x[1], x[2] + 12, 0.95); if (two) S.n('mar', t0 + x[0], x[1], x[2], 0.32); });
        if (ans[b] && (two || b === 7)) ans[b].forEach(function (x) { S.n('glk', t0 + x[0], x[1], x[2], 0.85); });
        if (two) { S.n('wood', t0 + 1, 0.1, 96, 0.35); S.n('wood', t0 + 3, 0.1, 91, 0.35); S.d('shk', t0 + 1.5, 0.6); S.d('shk', t0 + 3.5, 0.6); }
        if (b === 8) S.d('tri', t0, 0.7);
      }
    } },
  // 전투: G장조, 마림바 후렴 + 실로폰 대답 + 통통 베이스 + 손뼉
  battle: { bpm: 132, bars: 24, vol: 0.95, wet: 0.2, comp: [-20, 10, 4, 0.002, 0.15],
    // A: G D Em C G D C D / B: C D Bm Em C D Am D
    prog: [[43, 59, 62, 67], [38, 57, 62, 66], [40, 59, 64, 67], [36, 60, 64, 67], [43, 59, 62, 67], [38, 57, 62, 66], [36, 60, 64, 67], [38, 57, 62, 66],
      [36, 60, 64, 67], [38, 57, 62, 66], [47, 59, 62, 66], [40, 59, 64, 67], [36, 60, 64, 67], [38, 57, 62, 66], [45, 60, 64, 69], [38, 57, 62, 66]],
    mel: [
      [[0, 0.5, 67], [0.5, 0.5, 71], [1, 1, 74], [2, 0.5, 76], [2.5, 1, 74], [3.5, 0.5, 71]], [[0, 0.5, 69], [0.5, 0.5, 74], [1, 1, 78], [2, 0.5, 76], [2.5, 1.5, 74]],
      [[0, 0.5, 71], [0.5, 0.5, 76], [1, 1, 79], [2, 0.5, 78], [2.5, 1, 76], [3.5, 0.5, 74]], [[0, 1, 76], [1, 0.5, 72], [1.5, 0.5, 74], [2, 2, 76]],
      [[0, 0.5, 67], [0.5, 0.5, 71], [1, 1, 74], [2, 0.5, 76], [2.5, 1, 74], [3.5, 0.5, 71]], [[0, 0.5, 69], [0.5, 0.5, 74], [1, 1, 78], [2, 0.5, 81], [2.5, 1.5, 78]],
      [[0, 0.5, 79], [0.5, 0.5, 76], [1, 0.5, 72], [1.5, 0.5, 76], [2, 1, 79], [3, 0.5, 81], [3.5, 0.5, 79]], [[0, 1.5, 78], [1.5, 0.5, 76], [2, 2, 74]],
      [[0, 1, 79], [1, 1, 76], [2, 1.5, 72], [3.5, 0.5, 74]], [[0, 1, 78], [1, 1, 74], [2, 1.5, 69], [3.5, 0.5, 71]],
      [[0, 1.5, 74], [1.5, 0.5, 71], [2, 1, 78], [3, 1, 83]], [[0, 2, 79], [2, 1, 78], [3, 1, 76]],
      [[0, 1, 79], [1, 1, 76], [2, 1.5, 72], [3.5, 0.5, 74]], [[0, 1, 78], [1, 1, 81], [2, 1.5, 86], [3.5, 0.5, 84]],
      [[0, 1, 83], [1, 1, 81], [2, 1, 79], [3, 1, 76]], [[0, 1, 78], [1, 0.5, 79], [1.5, 0.5, 81], [2, 2, 74]]],
    build: function (S) {
      var ans = { 1: [[3, 0.25, 86], [3.25, 0.25, 88], [3.5, 0.5, 90]], 3: [[2.5, 0.5, 79], [3, 0.5, 84], [3.5, 0.5, 88]], 5: [[3, 0.25, 86], [3.25, 0.25, 88], [3.5, 0.5, 93]], 7: [[2.5, 0.25, 81], [2.75, 0.25, 83], [3, 0.25, 86], [3.25, 0.25, 88], [3.5, 0.5, 90]] };
      var MAJ = [0, 2, 4, 5, 7, 9, 11];
      for (var b = 0; b < S.bars; b++) {
        var sec = b < 8 ? 0 : b < 16 ? 1 : 2, i8 = b % 8, idx = sec === 1 ? 8 + i8 : i8, P = S.prog[idx], r = P[0], t0 = b * 4, fill = i8 === 7;
        var M = S.mel[idx];
        if (sec === 1) {
          // 가운데 절: 장난감 피아노 선율, 걷는 베이스, 피치카토 펼침화음
          M.forEach(function (x) { S.n('toy', t0 + x[0], x[1], x[2], 0.95); if (x[1] >= 1) S.n('glk', t0 + x[0], x[1], x[2] + 12, 0.35); });
          [r, r + 7, r + 12, r + 7].forEach(function (m, q) { S.n('bass', t0 + q, 0.9, m, q ? 0.7 : 0.85); });
          [P[1], P[2], P[3], P[2], P[1] + 12, P[3], P[2], P[3]].forEach(function (m, q) { S.n('pizz', t0 + q * 0.5, 0.4, m, q % 2 ? 0.4 : 0.55); });
          S.n('pad', t0, 4, P[1], 0.7); S.n('pad', t0, 4, P[3], 0.6);
          S.d('kick', t0, 0.9); S.d('kick', t0 + 1.5, 0.6); S.d('kick', t0 + 2, 0.85);
          S.n('wood', t0 + 0.5, 0.1, 84, 0.5); S.n('wood', t0 + 2.5, 0.1, 79, 0.5);
          if (i8 % 4 === 0) S.d('tri', t0, 0.8);
        } else {
          // 후렴: 마림바 (마지막 절은 실로폰 겹침과 3도 화음)
          M.forEach(function (x) {
            S.n('mar', t0 + x[0], x[1], x[2], 1);
            if (sec === 2) { S.n('xyl', t0 + x[0], x[1], x[2] + 12, 0.42); S.n('mar', t0 + x[0], x[1], sndDia(x[2], -2, 7, MAJ), 0.45); }
          });
          if (ans[i8]) ans[i8].forEach(function (x) { S.n(sec === 2 ? 'glk' : 'xyl', t0 + x[0], x[1], x[2], sec === 2 ? 0.75 : 0.85); });
          // 쿵-짝 베이스와 피치카토 화음
          S.n('bass', t0, 0.9, r, 0.9); S.n('bass', t0 + 2, 0.9, r + 7, 0.75); S.n('bass', t0 + 3.5, 0.45, r + 12, 0.6);
          [1, 3].forEach(function (q) { for (var k = 1; k < 4; k++) S.n('pizz', t0 + q, 0.4, P[k], 0.5); });
          S.d('kick', t0, 1); S.d('kick', t0 + 2, 0.9);
          if (sec === 2 || i8 % 2) S.d('kick', t0 + 3.5, 0.55);
          if (sec === 2) S.n('pad', t0, 4, P[3] + 12, 0.45);
        }
        S.d('clap', t0 + 1, 0.8); if (!fill) S.d('clap', t0 + 3, 0.85);
        for (var h = 0; h < 8; h++) S.d('shk', t0 + h * 0.5, h % 2 ? 0.9 : 0.5);
        if (fill) [[2, 60], [2.5, 57], [3, 55], [3.25, 52], [3.5, 50], [3.75, 48]].forEach(function (x, k) { S.n('tom', t0 + x[0], 0.2, x[1], 0.55 + k * 0.06); });
        if (i8 === 0) S.d('splash', t0, sec === 2 ? 1 : 0.7);
      }
    } },
  // 우두머리: D단조, 피치카토 되풀이 + 장난감 오르간 부름 + 실로폰 대답 + 장난감 나팔
  boss: { bpm: 144, bars: 16, vol: 0.88, wet: 0.18, comp: [-20, 10, 4, 0.002, 0.15],
    // A: Dm Dm Bb A Dm Dm Gm A / B: Bb C A Dm Gm A Dm A
    prog: [[50, 62, 65, 69], [50, 62, 65, 69], [46, 58, 62, 65], [45, 57, 61, 64], [50, 62, 65, 69], [50, 62, 65, 69], [43, 55, 58, 62], [45, 57, 61, 64],
      [46, 58, 62, 65], [48, 60, 64, 67], [45, 57, 61, 64], [50, 62, 65, 69], [43, 55, 58, 62], [45, 57, 61, 64], [50, 62, 65, 69], [45, 57, 61, 64]],
    // [박, 길이, 음, 악기(0 오르간, 1 실로폰, 2 나팔)]
    mel: [
      [[0, 0.5, 74, 0], [0.5, 0.5, 74, 0], [1, 0.5, 77, 0], [1.5, 1, 81, 0], [2.5, 0.5, 79, 0], [3, 0.5, 77, 0], [3.5, 0.5, 76, 0]],
      [[0, 1.5, 74, 0], [2, 0.25, 86, 1], [2.25, 0.25, 88, 1], [2.5, 0.5, 89, 1], [3, 0.5, 86, 1], [3.5, 0.5, 81, 1]],
      [[0, 0.5, 74, 0], [0.5, 0.5, 74, 0], [1, 0.5, 77, 0], [1.5, 1, 82, 0], [2.5, 0.5, 81, 0], [3, 0.5, 79, 0], [3.5, 0.5, 77, 0]],
      [[0, 1.5, 76, 0], [2, 0.25, 85, 1], [2.25, 0.25, 86, 1], [2.5, 0.5, 88, 1], [3, 0.5, 85, 1], [3.5, 0.5, 81, 1]],
      [[0, 0.5, 74, 0], [0.5, 0.5, 74, 0], [1, 0.5, 77, 0], [1.5, 1, 81, 0], [2.5, 0.5, 79, 0], [3, 0.5, 77, 0], [3.5, 0.5, 76, 0]],
      [[0, 1.5, 74, 0], [2, 0.25, 86, 1], [2.25, 0.25, 88, 1], [2.5, 0.5, 89, 1], [3, 0.5, 86, 1], [3.5, 0.5, 81, 1]],
      [[0, 0.5, 79, 0], [0.5, 0.5, 79, 0], [1, 0.5, 82, 0], [1.5, 1, 86, 0], [2.5, 0.5, 84, 0], [3, 0.5, 82, 0], [3.5, 0.5, 81, 0]],
      [[0, 1, 81, 0], [1, 0.5, 79, 0], [1.5, 0.5, 77, 0], [2, 0.5, 76, 0], [2.5, 0.5, 74, 0], [3, 1, 73, 0]],
      [[0, 0.75, 77, 2], [0.75, 0.75, 79, 2], [1.5, 0.5, 82, 2], [2, 1.5, 81, 2], [2.5, 0.25, 89, 1], [2.75, 0.25, 91, 1], [3, 0.5, 94, 1], [3.5, 0.5, 77, 2]],
      [[0, 0.75, 79, 2], [0.75, 0.75, 81, 2], [1.5, 0.5, 84, 2], [2, 1.5, 82, 2], [2.5, 0.25, 91, 1], [2.75, 0.25, 93, 1], [3, 0.5, 96, 1], [3.5, 0.5, 79, 2]],
      [[0, 0.75, 81, 2], [0.75, 0.75, 82, 2], [1.5, 0.5, 85, 2], [2, 1, 88, 2], [3, 1, 85, 2]],
      [[0, 1.5, 86, 2], [1.5, 0.5, 84, 2], [2, 1, 81, 2], [3, 1, 77, 2]],
      [[0, 0.75, 79, 2], [0.75, 0.75, 82, 2], [1.5, 0.5, 86, 2], [2, 1.5, 82, 2], [2.5, 0.25, 91, 1], [2.75, 0.25, 94, 1], [3, 0.5, 98, 1], [3.5, 0.5, 79, 2]],
      [[0, 0.75, 81, 2], [0.75, 0.75, 85, 2], [1.5, 0.5, 88, 2], [2, 1.5, 85, 2], [2.5, 0.25, 93, 1], [2.75, 0.25, 97, 1], [3, 0.5, 100, 1], [3.5, 0.5, 81, 2]],
      [[0, 0.5, 86, 2], [0.5, 0.5, 84, 2], [1, 0.5, 81, 2], [1.5, 0.5, 77, 2], [2, 0.5, 74, 2], [2.5, 0.5, 77, 2], [3, 1, 81, 2]],
      [[0, 1, 85, 2], [1, 1, 88, 2], [2, 2, 81, 2]]],
    build: function (S) {
      var IN = ['organ', 'xyl', 'horn'];
      for (var b = 0; b < S.bars; b++) {
        var P = S.prog[b], r = P[0], m4 = P[1], t0 = b * 4, B = b >= 8, fill = b % 8 === 7;
        // 피치카토 되풀이 (레 라 레 라 파 라 레 라)
        [m4, m4 + 7, m4 + 12, m4 + 7, P[2] + 12, m4 + 7, m4 + 12, m4 + 7].forEach(function (m, q) { S.n('pizz', t0 + q * 0.5, 0.4, m, q % 2 ? 0.5 : 0.75); });
        S.n('bass', t0, 0.7, r, 0.8); S.n('bass', t0 + 1.5, 0.4, r, 0.5); S.n('bass', t0 + 2, 0.7, r + 7, 0.7); S.n('bass', t0 + 3, 0.4, r + 12, 0.5); S.n('bass', t0 + 3.5, 0.4, r + 7, 0.5);
        S.mel[b].forEach(function (x) { S.n(IN[x[3]], t0 + x[0], x[1], x[2], x[3] === 1 ? 1 : 1.35); });
        if (!B && b % 2) for (var k = 1; k < 4; k++) S.n('horn', t0, 0.35, P[k], 0.55);
        if (B) [0.5, 1.5, 2.5, 3.5].forEach(function (q) { for (var k2 = 1; k2 < 4; k2++) S.n('organ', t0 + q, 0.18, P[k2], 0.35); });
        for (var q3 = 0; q3 < 4; q3++) S.d('kick', t0 + q3, q3 % 2 ? 0.7 : 0.9);
        S.d('clap', t0 + 1, 0.75); if (!fill) S.d('clap', t0 + 3, 0.8);
        if (B) for (var h = 0; h < 16; h++) S.d('shk', t0 + h * 0.25, h % 2 ? 0.45 : 0.75);
        else { for (var h2 = 0; h2 < 8; h2++) S.d('shk', t0 + h2 * 0.5, h2 % 2 ? 0.8 : 0.45); S.n('wood', t0 + 0.5, 0.1, 86, 0.35); S.n('wood', t0 + 2.5, 0.1, 81, 0.35); }
        if (fill) [[2, 62], [2.25, 62], [2.5, 59], [2.75, 59], [3, 55], [3.25, 55], [3.5, 50], [3.75, 48]].forEach(function (x, k3) { S.n('tom', t0 + x[0], 0.2, x[1], 0.5 + k3 * 0.05); });
        if (b % 8 === 0) S.d('splash', t0, 1);
      }
    } }
};
var MUSIC = {
  on: true, cur: null, want: null, urls: {}, els: {}, rendering: {}, vol: 0.55, seq: 0, used: {}, stat: {}, keep: 5, queue: [], busy: null,
  // v2.0: 'menu', 'battle', 'boss'를 지금 챕터의 곡 이름으로 바꿈 (audio2.js의 sn2Song. 없으면 그대로)
  resolve: function (name) { try { return typeof sn2Song === 'function' ? sn2Song(name) : name; } catch (e) { return name; } },
  prepare: function (name, cb) {
    name = MUSIC.resolve(name);
    if (!SONGS[name]) { if (cb) cb(); return; }
    if (MUSIC.urls[name]) { if (cb) cb(); return; }
    if (MUSIC.rendering[name]) { MUSIC.rendering[name].push(cb); return; }
    MUSIC.rendering[name] = [cb];
    // 한 번에 한 곡만 녹음 (여러 곡을 같이 돌리면 지금 틀 곡이 늦어짐). 지금 틀려는 곡(want)이 맨 먼저
    MUSIC.queue.push(name); MUSIC.pump();
  },
  pump: function () {
    if (MUSIC.busy || !MUSIC.queue.length) return;
    var i = MUSIC.queue.indexOf(MUSIC.want), name = MUSIC.queue.splice(i < 0 ? 0 : i, 1)[0];
    MUSIC.busy = name; MUSIC.render(name);
  },
  render: function (name) {
    var S = SONGS[name], spb = 60 / S.bpm, dur = S.bars * (S.bpb || 4) * spb, tail = 2.2, sr = 22050, ev = [], t00 = performance.now();
    // 악보를 먼저 다 모아 시간순으로 정렬 (노드를 미리 다 만들면 렌더가 아주 느려서, 렌더 중에 1.5초씩 만든다)
    S.build({
      bars: S.bars, prog: S.prog, mel: S.mel, bpb: S.bpb || 4, song: S,
      n: function (inst, beat, len, m, v) { var t = beat * spb; if (t < dur) ev.push([t, inst, v, m, Math.min(len * spb, dur + tail - t - 0.7)]); },
      d: function (inst, beat, v) { var t = beat * spb; if (t < dur) ev.push([t, inst, v]); }
    });
    ev.sort(function (a, b) { return a[0] - b[0]; });
    renderOffline(2, sr, dur + tail, function (ctx, out) {
      // 채널 수를 2로 고정 (들어오는 채널 수가 바뀌어도 압축기 상태가 흔들리지 않게)
      var bus = ctx.createGain(); bus.gain.value = 0.85 * (S.vol || 1); bus.channelCount = 2; bus.channelCountMode = 'explicit';
      var comp = ctx.createDynamicsCompressor(), C = S.comp || [-14, 30, 3, 0.003, 0.25]; comp.threshold.value = C[0]; comp.knee.value = C[1]; comp.ratio.value = C[2]; comp.attack.value = C[3]; comp.release.value = C[4];
      comp.channelCount = 2; comp.channelCountMode = 'explicit'; comp.connect(out);
      bus.connect(comp);
      var i = 0, CH = 1.5;
      function feed(until) { while (i < ev.length && ev[i][0] < until) { var e = ev[i++]; try { INST[e[1]](ctx, bus, e[0], e[2], e[3], e[4]); } catch (er) { } } }
      var lazy = typeof ctx.suspend === 'function' && OAC === window.OfflineAudioContext;
      if (lazy) {
        try {
          for (var k = 1; k * CH < dur; k++) (function (ts) {
            ctx.suspend(ts).then(function () { feed(ts + CH + 0.3); var r = ctx.resume(); if (r && r.catch) r.catch(function () { }); }, function () { feed(ts + CH + 0.3); });
          })(k * CH);
        } catch (e) { lazy = false; }
      }
      feed(lazy ? CH + 0.3 : 1e9);
    }).then(function (buf) {
      if (buf && buf.numberOfChannels === 2) {
        // 잔향을 더하고, 끝에서 넘친 꼬리를 앞에 겹쳐 이음매 없이 돌게 한 뒤, 튀는 꼭대기만 부드럽게 누름
        var n = Math.round(dur * sr), ch = [buf.getChannelData(0), buf.getChannelData(1)], pk = 0, c, j, x, a, K = 0.72, sq = 0;
        sndVerb(ch[0], ch[1], sr, S.wet || 0.25);
        for (c = 0; c < 2; c++) {
          x = ch[c]; for (j = n; j < x.length; j++) x[j - n] += x[j];
          x = ch[c] = x.subarray(0, n);
          for (j = 0; j < n; j++) { a = x[j] < 0 ? -x[j] : x[j]; if (a > K) { a = K + (1 - K) * Math.tanh((a - K) / (1 - K)); x[j] = x[j] < 0 ? -a : a; } if (a > pk) pk = a; }
        }
        if (pk > 0.92) for (c = 0; c < 2; c++) { x = ch[c]; for (j = 0; j < n; j++) x[j] *= 0.92 / pk; }
        for (x = ch[0], j = 0; j < n; j += 4) sq += x[j] * x[j];
        MUSIC.stat[name] = { dur: +(n / sr).toFixed(2), peak: +Math.min(pk, 0.92).toFixed(3), rms: +Math.sqrt(sq / (n / 4)).toFixed(4), ms: Math.round(performance.now() - t00), notes: ev.length };
        MUSIC.urls[name] = URL.createObjectURL(wavBlob({ numberOfChannels: 2, sampleRate: sr, length: n, getChannelData: function (q) { return ch[q]; } }));
        MUSIC.gc(name);
      }
      var cbs = MUSIC.rendering[name] || []; delete MUSIC.rendering[name]; MUSIC.busy = null;
      cbs.forEach(function (f) { if (f) f(); });
      if (MUSIC.urls[name] && MUSIC.want === name && MUSIC.cur !== name) MUSIC.play(name);
      MUSIC.pump();
    });
  },
  el: function () {
    if (!MUSIC.audio) { MUSIC.audio = new Audio(); MUSIC.audio.loop = true; MUSIC.audio.preload = 'auto'; }
    return MUSIC.audio;
  },
  // 곡이 많아져(9곡) 다 쥐고 있으면 메모리가 커짐: 가장 오래 안 튼 곡의 녹음을 버림 (다시 필요하면 다시 녹음)
  gc: function (keepName) {
    var ks = Object.keys(MUSIC.urls).filter(function (k) { return k !== keepName && k !== MUSIC.cur && k !== MUSIC.want; });
    ks.sort(function (a, b) { return (MUSIC.used[a] || 0) - (MUSIC.used[b] || 0); });
    while (Object.keys(MUSIC.urls).length > MUSIC.keep && ks.length) { var k = ks.shift(); try { URL.revokeObjectURL(MUSIC.urls[k]); } catch (e) { } delete MUSIC.urls[k]; }
  },
  play: function (name) {
    if (name === 'victory' || name === 'defeat') { MUSIC.stop(); SFX.play(name, 0.9); MUSIC.want = null; return; }
    var asked = name; name = MUSIC.resolve(name);
    if (MUSIC.onPlay) { try { MUSIC.onPlay(asked, name); } catch (e) { } }
    if (!SONGS[name]) return;
    MUSIC.want = name;
    if (!MUSIC.on) return;
    if (MUSIC.cur === name) return;
    if (!MUSIC.urls[name]) { MUSIC.prepare(name); return; }
    var el = MUSIC.el(), seq = ++MUSIC.seq, was = MUSIC.cur && !el.paused;
    var go = function () {
      if (seq !== MUSIC.seq) return;
      try { el.pause(); } catch (e) { }
      if (el.src !== MUSIC.urls[name]) el.src = MUSIC.urls[name];
      el.volume = MUSIC.vol;
      try { el.currentTime = 0; } catch (e) { }
      var p = el.play(); if (p && p.catch) p.catch(function () { if (MUSIC.cur === name && seq === MUSIC.seq) MUSIC.cur = null; });
    };
    MUSIC.cur = name; MUSIC.used[name] = Date.now();
    // 곡 전환: 틀던 곡을 0.2초 줄인 뒤 바꿈 (뚝 끊기지 않게)
    if (was) MUSIC.fade(el, seq, go); else go();
  },
  fade: function (el, seq, done) {
    var v0 = el.volume, i = 0, id = setInterval(function () {
      if (seq !== MUSIC.seq) { clearInterval(id); return; }
      i++; try { el.volume = Math.max(0, v0 * (1 - i / 6)); } catch (e) { }
      if (i >= 6) { clearInterval(id); done(); }
    }, 32);
  },
  stop: function () { MUSIC.seq++; if (MUSIC.audio) { try { MUSIC.audio.pause(); MUSIC.audio.volume = MUSIC.vol; } catch (e) { } } MUSIC.cur = null; },
  unlock: function () {
    var el = MUSIC.el();
    if (MUSIC.want && MUSIC.cur !== MUSIC.want) MUSIC.play(MUSIC.want);
    else if (MUSIC.cur && el.paused && MUSIC.on) { var p = el.play(); if (p && p.catch) p.catch(function () { }); }
  },
  setOn: function (on) { MUSIC.on = on; if (!on) MUSIC.stop(); else if (MUSIC.want) { var w = MUSIC.want; MUSIC.cur = null; MUSIC.play(w); } }
};
