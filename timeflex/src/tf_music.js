// ===== tf_music.js : 타임플렉스 시대 음악 생성기 =====
// 시대마다 음계, 화음 진행, 빠르기, 악기, 북 무늬를 적은 표(TF_MUS)에서 곡 세 벌을 만든다
//   map_<mood>: 장 지도 곡(조용히, 가락과 화음, 북은 가볍게), battle_<mood>: 전투곡, boss_<mood>: 우두머리곡(빠르고 무겁게)
// 가락은 씨앗 난수로 2마디 동기를 만들고 변주해 16마디를 채운다(같은 시대는 늘 같은 곡). 원시(prim)는 tf_audio.js의 손으로 쓴 곡을 쓰고 지도 곡만 여기서
// 북 무늬 기호: 한 마디를 칸으로 나눈 문자열. '.' 쉼, 'x' 센 소리, 'o' 약한 소리 (악기마다 한 줄)
var TF_MUS = {
  prim: { root: 45, scale: [0, 3, 5, 7, 10], prog: [0, 0, 3, 4, 0, 2, 3, 4], bpm: 104, lead: 'fife', lead2: 'wood', pad: 'pad', bass: 'bass', perc: { tom: 'x.o.x.oox.o.x.o.', buk: 'x.......x.......', shk: 'o.o.o.o.o.o.o.o.' } },
  egypt: { root: 50, scale: [0, 1, 4, 5, 7, 8, 10], prog: [0, 0, 1, 0, 3, 1, 0, 0], bpm: 112, lead: 'piri', lead2: 'gyg', pad: 'pad', bass: 'bass', drone: 1, perc: { tom: 'x..o..x.x..o....', wood: '..x...x...x...x.', shk: 'oooooooooooooooo', tri: '........x.......' } },
  rome: { root: 48, scale: [0, 2, 4, 5, 7, 9, 10], prog: [0, 3, 4, 0, 5, 3, 4, 0], bpm: 116, lead: 'brs', lead2: 'horn', pad: 'str', bass: 'bass', perc: { snr: 'x.oox.o.x.oox.oo', timp: 'x.......x.......', kick: 'x...x...x...x...' } },
  three: { root: 50, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 0, 2, 3, 1, 0], bpm: 110, lead: 'fife', lead2: 'gyg', pad: 'str', bass: 'bass', perc: { buk: 'x...x...x..xx...', tom: '..o...o...o...o.', jing: 'x...............', wood: '....x.......x...' } },
  norse: { root: 50, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 6, 0, 3, 5, 6, 4], bpm: 108, lead: 'horn', lead2: 'fife', pad: 'str', bass: 'bass', drone: 1, perc: { tom: 'x..x..x.x..x..x.', timp: 'x.......x.......', kick: 'x...x...x...x...', clap: '....x.......x...' } },
  castle: { root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 3, 4, 0, 6, 4, 0], bpm: 100, lead: 'organ', lead2: 'pizz', pad: 'str', bass: 'bass', perc: { tom: 'x.......x...o.o.', snr: '....x.......x...', timp: 'x...............' } },
  sail: { root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 0, 4, 0, 6, 4, 0], bpm: 132, bpb: 3, six: 1, lead: 'box', lead2: 'fife', pad: 'pad', bass: 'bass', perc: { kick: 'x.....x.....', clap: '...x.....x..', wood: 'x.ox.ox.ox.o' } },
  joseon: { song: 4 },
  trench: { root: 46, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4, 0, 5, 4, 0], bpm: 112, lead: 'fife', lead2: 'brs', pad: 'str', bass: 'bass', perc: { snr: 'xoxox.oxxoxox.ox', kick: 'x.......x.......', cym: 'x...............' } },
  steel: { root: 48, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 0, 4, 5, 3, 4, 0], bpm: 136, swing: 1, lead: 'brs', lead2: 'horn', pad: 'organ', bass: 'pizz', walk: 1, perc: { snr: '....x.......x...', kick: 'x.......x.......', shk: 'x.ox.ox.ox.ox.ox' } },
  winter: { root: 45, scale: [0, 2, 3, 5, 7, 8, 11], prog: [0, 5, 3, 4, 0, 5, 4, 4], bpm: 96, lead: 'horn', lead2: 'str', pad: 'str', bass: 'bass', perc: { timp: 'x.......x.......', snr: 'x.o.x.oox.o.x.oo', cym: 'x...............' } },
  jungle: { root: 52, scale: [0, 3, 5, 6, 7, 10], prog: [0, 0, 3, 3, 4, 3, 0, 4], bpm: 150, lead: 'pizz', lead2: 'organ', pad: 'organ', bass: 'bass', perc: { kick: 'x.....x.x.......', snr: '....x.......x...', shk: 'xxxxxxxxxxxxxxxx' } },
  dune: { root: 50, scale: [0, 1, 4, 5, 7, 8, 10], prog: [0, 1, 0, 6, 0, 1, 6, 0], bpm: 120, lead: 'thm', lead2: 'arp', pad: 'pad', bass: 'sbs', perc: { kick: 'x..x..x.x..x....', tom: '......o.....o.oo', snr: '....x.......x...', shk: 'o.o.o.o.o.o.o.o.' } },
  cyber: { root: 45, scale: [0, 3, 5, 7, 8, 10], prog: [0, 5, 3, 6, 0, 5, 3, 4], bpm: 132, lead: 'arp', lead2: 'thm', pad: 'pad', bass: 'sbs', arp: 1, perc: { kick: 'x...x...x...x...', clap: '....x.......x...', shk: '..x...x...x...x.' } },
  space: { root: 47, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 6, 4, 0, 5, 3, 4], bpm: 112, lead: 'bell2', lead2: 'brs', pad: 'str', bass: 'sbs', arp: 1, perc: { kick: 'x.......x.......', snr: '....x.......x...', timp: 'x...............' } }
};
// 표 하나로 곡 하나: kind 'map' | 'battle' | 'boss'
function tfSongOf(mood, kind) {
  var C = TF_MUS[mood], boss = kind === 'boss', map = kind === 'map', bpb = C.bpb || 4, six = !!C.six;
  var rnd = rngOf(mood.length * 97 + mood.charCodeAt(0) * 13 + (boss ? 7 : 0)), sc = C.scale, N = sc.length;
  function note(deg, oct) { var o = Math.floor(deg / N), d = ((deg % N) + N) % N; return C.root + (boss ? -2 : 0) + sc[d] + 12 * (o + (oct || 0)); }
  function chord(deg) { return [note(deg), note(deg + 2), note(deg + 4)]; }
  // 2마디 동기: [박, 길이, 음계 번호(으뜸=0 기준 위로)]
  var unit = six ? 0.5 : 0.5, steps = Math.round(bpb * 2 / unit), motif = [], pos = 0, deg = N;
  while (pos < bpb * 2 - 0.01) {
    var L = [unit, unit, unit * 2, unit * 2, unit * 3][Math.floor(rnd() * 5)]; if (pos + L > bpb * 2) L = bpb * 2 - pos;
    deg += [-2, -1, -1, 1, 1, 2, 0, 3, -3][Math.floor(rnd() * 9)]; deg = Math.max(N - 2, Math.min(N * 2 + 2, deg));
    if (rnd() < 0.18 && pos > 0) { pos += L; continue; }
    motif.push([pos, L * 0.95, deg]); pos += L;
  }
  var bars = 16, prog = [];
  for (var i = 0; i < bars; i++) prog.push(C.prog[i % C.prog.length]);
  return { bpm: Math.round(C.bpm * (boss ? 1.14 : map ? 0.86 : 1)), bpb: bpb, bars: bars, vol: map ? 1.2 : boss ? 0.92 : 1, wet: map ? 0.36 : 0.26, prog: prog,
    build: function (S) {
      for (var b = 0; b < S.bars; b++) {
        var t0 = b * bpb, r = S.prog[b], ch = chord(r), sec = b >= 8, half = b % 2, k;
        // 베이스: 지도 곡은 길게, 전투는 박마다(걷는 베이스면 음계를 따라 걷기)
        if (map || C.drone) { S.n(C.bass, t0, bpb * 0.95, ch[0] - 24, map ? 0.55 : 0.7); if (C.drone && !map) S.n(C.bass, t0, bpb * 0.95, C.root - 24, 0.35); }
        if (!map) for (k = 0; k < bpb; k++) { var bm = C.walk ? note(r + [0, 2, 4, 5][k % 4], -2) : (k % 2 ? ch[0] - 12 + (boss ? 0 : 7) : ch[0] - 24); S.n(C.bass, t0 + k, 0.9, bm, (k === 0 ? 0.85 : 0.6) * (boss ? 1.1 : 1)); }
        // 화음 깔개
        if (map || sec || boss) ch.forEach(function (m) { S.n(C.pad, t0, bpb * 0.96, m - 12, map ? 0.3 : 0.24); });
        // 신스 아르페지오(현대, 우주)
        if (C.arp && !map) for (k = 0; k < bpb * 4; k++) S.n('arp', t0 + k * 0.25, 0.22, ch[k % 3] + (k % 6 < 3 ? 0 : 12), 0.32);
        // 가락: 동기(2마디)를 반복하며 뒤 절은 한 음 위로, 우두머리곡은 겹 옥타브
        motif.forEach(function (q) {
          if (q[0] < half * bpb || q[0] >= (half + 1) * bpb) return;
          var tt = t0 + q[0] - half * bpb, dg = q[2] + (sec && b % 4 >= 2 ? 1 : 0), m = note(dg);
          if (C.swing && (q[0] * 2) % 2 === 1) tt += 0.08;
          S.n(C.lead, tt, q[1], m, map ? 0.75 : 1.05);
          if (boss || (sec && !map)) S.n(C.lead2, tt, q[1], m + (C.lead2 === 'gyg' || C.lead2 === 'pizz' || C.lead2 === 'xyl' ? 12 : -12), 0.5);
        });
        // 북: 지도 곡은 첫째 줄만 약하게
        var P = C.perc, keys = Object.keys(P);
        keys.forEach(function (inst, ii) {
          if (map && ii > 0) return; var pat = P[inst], n = pat.length, step = bpb / n;
          for (var s = 0; s < n; s++) { var ch2 = pat[s]; if (ch2 === '.') continue; var v = (ch2 === 'x' ? 0.8 : 0.45) * (map ? 0.45 : boss ? 1.1 : 1);
            var tt2 = t0 + s * step + (C.swing && s % 2 ? step * 0.33 : 0);
            if (inst === 'tom') S.n('tom', tt2, 0.2, ch2 === 'x' ? 45 : 50, v); else if (inst === 'timp') S.n('timp', tt2, 0.5, ch[0] - 12, v); else S.d(inst, tt2, v); }
        });
        // 마디 묶음 끝 채우기와 강조
        if (!map && b % 4 === 3) { for (k = 0; k < 4; k++) S.n('tom', t0 + bpb - 1 + k * 0.25, 0.18, 50 - k * 2, 0.5 + k * 0.08); }
        if (!map && b % 8 === 0) S.d('cym', t0, boss ? 0.8 : 0.55);
        if (boss && b % 2 === 0) S.n('timp', t0, 0.6, ch[0] - 12, 0.7);
      }
    } };
}
(function () {
  Object.keys(TF_MUS).forEach(function (m) {
    var C = TF_MUS[m];
    if (C.song) { SONGS['battle_' + m] = SONGS['battle' + C.song]; SONGS['boss_' + m] = SONGS['boss' + C.song]; SONGS['map_' + m] = SONGS['battle' + C.song]; return; }
    if (m !== 'prim') { SONGS['battle_' + m] = tfSongOf(m, 'battle'); SONGS['boss_' + m] = tfSongOf(m, 'boss'); }
    SONGS['map_' + m] = tfSongOf(m, 'map');
  });
  // 타이틀: 시계 초침(딱딱이) 위에 현악과 금관이 커지는 시간의 주제 (D 단조)
  SONGS.tf_title = { bpm: 92, bars: 12, vol: 1.3, wet: 0.4, prog: [0, 5, 3, 4, 0, 5, 6, 4, 0, 5, 3, 4],
    build: function (S) {
      var R = 50, sc = [0, 2, 3, 5, 7, 8, 10], P = S.prog, mel = [[0, 1.5, 4], [1.5, 0.5, 3], [2, 1, 2], [3, 1, 4], [0, 2, 5], [2, 1, 4], [3, 1, 3], [0, 3, 1], [0, 1.5, 4], [1.5, 0.5, 5], [2, 2, 7], [0, 4, 4]];
      function nt(d, o) { return R + sc[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + (o || 0)); }
      for (var b = 0; b < S.bars; b++) {
        var t0 = b * 4, r = P[b], k;
        for (k = 0; k < 4; k++) S.n('wood', t0 + k, 0.08, k % 2 ? 84 : 88, 0.35);
        S.n('bass', t0, 3.9, nt(r, -2), 0.7); [0, 2, 4].forEach(function (q) { S.n('str', t0, 3.9, nt(r + q, -1), b < 4 ? 0.3 : 0.42); });
        if (b >= 4) { S.n('timp', t0, 0.6, nt(r, -2), 0.6); S.n('timp', t0 + 2.5, 0.4, nt(r, -2), 0.4); }
        var q = mel[b]; S.n(b < 4 ? 'bell2' : 'horn', t0 + q[0], q[1], nt(q[2], 1), 1); if (b >= 8) S.n('brs', t0 + q[0], q[1], nt(q[2]), 0.6);
        if (b === 7 || b === 11) S.d('cym', t0 + 3, 0.6);
      }
    } };
})();
