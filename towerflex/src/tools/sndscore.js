// 악보 정적 검사 (브라우저 없이): node tools/sndscore.js
// 곡마다 build를 돌려 음표를 모으고: 악기가 있는지, 박이 곡 안인지, 선율 음이 그 곡의 음계 안인지, 마디마다 선율 길이가 넘치지 않는지, 사건 표와 소리 표가 서로 맞는지
const fs = require('fs'), path = require('path');
const R = p => fs.readFileSync(path.join(__dirname, '..', 'src', p), 'utf8');
const stubW = { OfflineAudioContext: function () { }, AudioContext: function () { } };
const f = new Function('window', 'performance', 'setInterval', 'setTimeout', 'clearInterval', 'MAPS', 'ENEMIES', 'clamp', 'URL', 'Audio',
  R('audio.js') + '\n' + R('audio2.js') + '\nreturn { SONGS: SONGS, SN2_DEF: SN2_DEF, SND_EV: SND_EV, INST: INST, SND_TW: SND_TW, SND_EN: SND_EN, SFX_DEF: SFX_DEF, SFX_LIM: SFX_LIM, pick: sn2Song };');
const A = f(stubW, { now: () => 0 }, () => 0, () => 0, () => 0, [], {}, (v, a, b) => Math.max(a, Math.min(b, v)), {}, function () { });
let bad = 0; const fail = m => { bad++; console.log('  실패', m); };
const SCALE = { title: [2, 4, 5, 7, 9, 10, 0, 1, 11], battle2: [9, 11, 0, 2, 4, 5, 7, 8], battle3: [4, 6, 7, 9, 11, 0, 2, 3, 1], battle4: [4, 7, 9, 11, 2] };
const DRUM = { kick: 1, clap: 1, shk: 1, tri: 1, splash: 1, cym: 1, snr: 1, buk: 1, jing: 1, jg: 1, kkw: 1, wood: 1, tom: 1, timp: 1 };
Object.keys(A.SONGS).forEach(name => {
  const S = A.SONGS[name], bpb = S.bpb || 4, total = S.bars * bpb, cnt = {}, lo = {}, hi = {}; let n = 0, off = 0;
  S.build({ bars: S.bars, prog: S.prog, mel: S.mel, bpb: bpb, song: S,
    n: (inst, beat, len, m, v) => { n++; cnt[inst] = (cnt[inst] || 0) + 1; if (!A.INST[inst]) fail(name + ': 없는 악기 ' + inst); if (!(beat >= 0 && beat < total)) fail(name + ': 박이 곡 밖 ' + inst + ' ' + beat); if (!(len > 0)) fail(name + ': 길이 0 ' + inst); if (!(v > 0 && v < 1.6)) fail(name + ': 크기 이상 ' + inst + ' ' + v);
      if (!DRUM[inst]) { if (!(m >= 24 && m <= 108)) fail(name + ': 음높이 이상 ' + inst + ' ' + m); lo[inst] = Math.min(lo[inst] == null ? 999 : lo[inst], m); hi[inst] = Math.max(hi[inst] || 0, m); if (SCALE[name] && SCALE[name].indexOf(((m % 12) + 12) % 12) < 0) off++; } },
    d: (inst, beat, v) => { n++; cnt[inst] = (cnt[inst] || 0) + 1; if (!A.INST[inst]) fail(name + ': 없는 악기 ' + inst); if (!(beat >= 0 && beat < total)) fail(name + ': 박이 곡 밖 ' + inst + ' ' + beat); } });
  if (Array.isArray(S.mel)) S.mel.forEach((bar, i) => { let end = 0; bar.forEach(x => { if (x[0] < end - 1e-6 && x[3] === undefined) fail(name + ' 선율 ' + (i + 1) + '마디: 음이 겹침'); end = Math.max(end, x[0] + x[1]); if (x[0] + x[1] > bpb + 1e-6) fail(name + ' 선율 ' + (i + 1) + '마디: 마디를 넘음'); }); });
  if (SCALE[name] && off) fail(name + ': 음계 밖 음 ' + off + '개');
  console.log(name.padEnd(8), (60 / S.bpm * total).toFixed(1) + '초', S.bars + '마디 x ' + bpb + '박', '음표 ' + n, Object.keys(cnt).map(k => k + ' ' + cnt[k] + (lo[k] != null ? '(' + lo[k] + '~' + hi[k] + ')' : '')).join(', '));
});
// 소리 표: 사건과 탑, 적 표가 가리키는 소리가 실제로 있는지, 새 소리마다 동시 발음 제한이 있는지
const has = k => A.SN2_DEF[k] || A.SFX_DEF[k];
Object.keys(A.SND_TW).forEach(k => { const s = A.SND_TW[k]; if (!has(s[0]) || (s[2] && !has(s[2]))) fail('SND_TW ' + k + ' → 없는 소리'); });
Object.keys(A.SND_EN).forEach(k => { if (!has(A.SND_EN[k][0])) fail('SND_EN ' + k + ' → 없는 소리'); });
Object.keys(A.SN2_DEF).forEach(k => { if (!A.SFX_LIM[k]) fail('동시 발음 제한 없음: ' + k); if (A.SFX_DEF[k]) fail('옛 소리와 이름 겹침: ' + k); });
const src = R('audio2.js'), used = new Set(); let m; const re = /sn2Play\((?:[^'()]*\? *)?'([A-Za-z0-9]+)'(?: *: *'([A-Za-z0-9]+)')?/g; while ((m = re.exec(src))) { used.add(m[1]); if (m[2]) used.add(m[2]); }
used.forEach(k => { if (!has(k)) fail('사건 표가 없는 소리를 부름: ' + k); });
Object.keys(A.SND_TW).forEach(k => { used.add(A.SND_TW[k][0]); if (A.SND_TW[k][2]) used.add(A.SND_TW[k][2]); }); Object.keys(A.SND_EN).forEach(k => { used.add(A.SND_EN[k][0]); if (A.SND_EN[k][4]) used.add(A.SND_EN[k][4]); });
['curse', 'charm', 'stun', 'powerDown'].forEach(k => used.add(k));   // towerStun이 이유(why)에 따라 고름
const un = Object.keys(A.SN2_DEF).filter(k => !used.has(k) && A.SN2_DEF[k][3] !== 'bonus');
console.log('새 효과음', Object.keys(A.SN2_DEF).length + '개, 사건', Object.keys(A.SND_EV).length + '종, 탑과 탄', Object.keys(A.SND_TW).length + '키, 적', Object.keys(A.SND_EN).length + '종. 표에서 안 쓰는 소리:', un.join(' ') || '없음');
console.log(bad ? '실패 ' + bad + '건' : '전부 통과'); process.exit(bad ? 1 : 0);
