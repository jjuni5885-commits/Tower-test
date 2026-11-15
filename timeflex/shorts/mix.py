# 소리 섞기: 게임 음악(조선 우두머리 곡) + 장면마다 실제로 난 게임 효과음 + 컷 휙 소리 → aud/mix.wav
import json, os, numpy as np, scipy.io.wavfile as wf, scipy.signal as ss
from plan import timeline, FPS, BOSS_DEATH

HERE = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(HERE, 'aud')
SR = 48000
T = timeline(); TOT = (T[-1]['f0'] + T[-1]['n']) / FPS
N = int((TOT + 0.05) * SR)
rng = np.random.default_rng(11)


def resamp(x, sr_in, rate=1.0):
    step = sr_in / SR * rate; n = int(len(x) / step)
    return np.interp(np.arange(n) * step, np.arange(len(x)), x).astype(np.float32)


# 음악
sr_m, m = wf.read(os.path.join(A, 'song_boss_joseon.wav')); m = m.astype(np.float32) / 32768
mus = np.stack([resamp(m[:, 0], sr_m), resamp(m[:, 1], sr_m)], 1)
reps = int(np.ceil(N / len(mus))) + 1; mus = np.tile(mus, (reps, 1))[:N]
env = np.ones(N, np.float32)
t_end = T[-1]['f0'] / FPS
a, b = int((t_end - 0.30) * SR), int((t_end + 0.05) * SR)
env[a:b] = np.linspace(1, 0, b - a); env[b:] = 0
mus *= env[:, None]

# 효과음
meta = json.load(open(os.path.join(A, 'sfx_meta.json')))
BUF = {k: np.load(os.path.join(A, 'sfx_%s.npy' % k)) for k in meta}
sfx = np.zeros((N, 2), np.float32)


def add(k, t, vol, rate=None, pan=None):
    if k not in BUF: return 0
    rate = rate if rate is not None else 0.94 + rng.random() * 0.12
    y = resamp(BUF[k], meta[k][0], rate) * vol
    pan = pan if pan is not None else (rng.random() - 0.5) * 0.4
    i0 = int(t * SR); i1 = min(N, i0 + len(y))
    if i1 <= i0 or i0 < 0: return 0
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    sfx[i0:i1, 0] += y[:i1 - i0] * gl * 1.414; sfx[i0:i1, 1] += y[:i1 - i0] * gr * 1.414
    return len(y) / SR


ev = []
lim = {}
for sc in T:
    if sc['name'] == 'end': continue
    j = json.load(open(os.path.join(HERE, 'frames', sc['name'] + '.json'))); lim.update(j.get('lim') or {})
    for k, vol, now in j['log']:
        rel = (now - j['t0']) / 1000 - sc['s0'] / FPS
        if 0 <= rel < sc['n'] / FPS: ev.append((sc['f0'] / FPS + rel, k, vol))
ev.sort()
act, used, skip = [], 0, 0   # (끝 시각, 키)
for t, k, vol in ev:
    act = [q for q in act if q[0] > t]
    L = lim.get(k); n = sum(1 for q in act if q[1] == k)
    if L and (n >= L[1] or len(act) >= 14): skip += 1; continue
    g = vol * 0.9 * ((L[2] if len(L) > 2 and L[2] else 0.8) ** n if L and n else 1)
    d = add(k, t, g)
    if L: act.append((t + d, k))
    used += 1

# 컷 휙 소리: 다음 장면 시작 직전 0.22초 동안 올라오는 바람 소리
def whoosh(t_cut, vol=0.22):
    n = int(0.26 * SR); x = rng.standard_normal(n).astype(np.float32)
    lo = ss.sosfilt(ss.butter(2, 900, 'low', fs=SR, output='sos'), x); hi = ss.sosfilt(ss.butter(2, [1800, 7000], 'band', fs=SR, output='sos'), x)
    u = np.linspace(0, 1, n); y = (lo * (1 - u) + hi * u * 0.8)
    e = np.minimum(1, u / 0.85) ** 2.2 * np.minimum(1, (1 - u) / 0.15 + 0.0); y = y * e / (np.abs(y).max() + 1e-6) * vol
    i0 = int((t_cut - 0.24) * SR); i1 = min(N, i0 + n)
    sfx[i0:i1] += y[:i1 - i0, None]

for sc in T[1:]:
    whoosh(sc['f0'] / FPS)
add('horn', 0.0, 0.7, 1.0, 0)
bs = [s for s in T if s['name'] == 'boss'][0]
add('boomBig', (bs['f0'] + BOSS_DEATH) / FPS, 0.8, 1.0, 0)
add('victory', T[-1]['f0'] / FPS + 0.05, 1.0, 1.0, 0)

out = mus * 0.55 + sfx * 0.72
pk = np.abs(out).max(); K = 0.8
a = np.abs(out); over = a > K
out[over] = np.sign(out[over]) * (K + (1 - K) * np.tanh((a[over] - K) / (1 - K)))
out *= 0.95 / max(1e-6, np.abs(out).max())
wf.write(os.path.join(A, 'mix.wav'), SR, out.astype(np.float32))
print('events', len(ev), 'used', used, 'skip', skip, 'peak_before', round(float(pk), 2), 'sec', round(N / SR, 2))
