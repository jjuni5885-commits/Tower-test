# 장면별 프레임에 자막, 컷 연출을 입혀 장면마다 mp4 하나씩 만든다: python3 compose.py [장면...]
import os, sys, subprocess, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from plan import timeline, F, FPS, BOSS_DEATH

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
os.makedirs(os.path.join(HERE, 'clips'), exist_ok=True)


def font(px):
    return ImageFont.truetype(FONT, px, index=1)


def text_w(f, s):
    return f.getlength(s)


def render_caption(label, lines, big=128):
    """꼬리표(어두운 알약, 노란 글) + 큰 글(흰 글, 검은 테두리). RGBA 한 장"""
    # 큰 글 크기: 가장 긴 줄이 960px 안에 들게
    px = big
    while True:
        f = font(px)
        wmax = max(sum(text_w(f, t) for t, _ in ln) for ln in lines)
        if wmax <= 960 or px <= 70: break
        px -= 4
    f = font(px); lf = font(50)
    st = max(8, px // 11)
    lh = int(px * 1.16)
    lw = text_w(lf, label) if label else 0
    pill_h = 84 if label else 0
    gap = 26 if label else 0
    cw = int(max(wmax, lw + 64)) + st * 2 + 40
    ch = pill_h + gap + lh * len(lines) + st * 2 + 30
    img = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    # 그림자 층
    sh = Image.new('RGBA', (cw, ch), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    d = ImageDraw.Draw(img)
    if label:
        pw = int(lw + 64); px0 = (cw - pw) // 2
        sd.rounded_rectangle([px0, 6, px0 + pw, pill_h + 6], radius=pill_h // 2, fill=(0, 0, 0, 120))
        d.rounded_rectangle([px0, 0, px0 + pw, pill_h], radius=pill_h // 2, fill=(17, 19, 38, 232), outline=(255, 216, 74, 255), width=4)
        d.text((cw / 2, pill_h / 2 - 2), label, font=lf, fill='#FFD84A', anchor='mm')
    y = pill_h + gap + st
    for ln in lines:
        tw = sum(text_w(f, t) for t, _ in ln); x = (cw - tw) / 2
        for t, col in ln:
            sd.text((x, y + 10), t, font=f, fill=(0, 0, 0, 150), stroke_width=st, stroke_fill=(0, 0, 0, 150))
            d.text((x, y), t, font=f, fill=col, stroke_width=st, stroke_fill='#1b0f0a')
            x += text_w(f, t)
        y += lh
    sh = sh.filter(ImageFilter.GaussianBlur(8))
    sh.alpha_composite(img)
    return sh


def pop(t):
    """자막 등장 크기: 0.62 → 1.1(4프레임) → 1.0(8프레임)"""
    if t >= 8: return 1.0, 1.0
    if t < 4:
        u = t / 4; s = 0.62 + (1.1 - 0.62) * (1 - (1 - u) ** 2)
    else:
        u = (t - 4) / 4; s = 1.1 - 0.1 * u
    return s, min(1.0, (t + 1) / 3)


def place(frame, cap, t, cy):
    s, a = pop(t)
    im = cap
    if s != 1.0:
        im = cap.resize((max(1, int(cap.width * s)), max(1, int(cap.height * s))), Image.BILINEAR)
    if a < 1.0:
        al = im.getchannel('A').point(lambda v: int(v * a)); im = im.copy(); im.putalpha(al)
    x = (W - im.width) // 2; y = int(cy - im.height / 2)
    frame.alpha_composite(im, (x, y))


def zoom(img, z, dx=0, dy=0):
    if z <= 1.0001 and not dx and not dy: return img
    cw, ch = W / z, H / z
    x0 = (W - cw) / 2 - dx / z; y0 = (H - ch) / 2 - dy / z
    x0 = max(0, min(W - cw, x0)); y0 = max(0, min(H - ch, y0))
    return img.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))


def end_overlay():
    """끝 화면: 무료 플레이 안내"""
    img = Image.new('RGBA', (W, 420), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    sh = Image.new('RGBA', (W, 420), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    f1 = font(104); f2 = font(54)
    t1 = '지금 무료로 플레이'
    sd.text((W / 2, 110 + 10), t1, font=f1, fill=(0, 0, 0, 170), anchor='mm', stroke_width=11, stroke_fill=(0, 0, 0, 170))
    d.text((W / 2, 110), t1, font=f1, fill='#FFFFFF', anchor='mm', stroke_width=11, stroke_fill='#1b0f0a')
    t2 = '링크는 채널 프로필에'
    w2 = f2.getlength(t2) + 80
    d.rounded_rectangle([(W - w2) / 2, 210, (W + w2) / 2, 300], radius=45, fill=(17, 19, 38, 235), outline=(255, 216, 74, 255), width=4)
    d.text((W / 2, 253), t2, font=f2, fill='#FFD84A', anchor='mm')
    sh = sh.filter(ImageFilter.GaussianBlur(8)); sh.alpha_composite(img)
    return sh


def resolve(v, sc):
    if v is None: return sc['n']
    if isinstance(v, int): return v
    if v == 'H1': return F(5)
    if v.startswith('K'):
        return BOSS_DEATH + (int(v[2:]) if '+' in v else 0)
    return int(v)


def build(sc, only=None):
    name = sc['name']; n = sc['n']; s0 = sc['s0']
    src = os.path.join(HERE, 'frames', name)
    files = sorted(f for f in os.listdir(src) if f.endswith('.jpg'))
    caps = [(resolve(q[0], sc), resolve(q[1], sc), render_caption(q[2], q[3]), q[4] if len(q) > 4 else None) for q in sc['caps']]
    eo = end_overlay() if name == 'end' else None
    tmp = os.path.join(HERE, 'clips', name + '.tmp.mp4'); out = os.path.join(HERE, 'clips', name + '.mp4')
    p = None if only else subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-movflags', '+faststart', tmp], stdin=subprocess.PIPE)
    rnd = random.Random(7)
    first = sc['f0'] == 0
    for i in (only or range(n)):
        fi = min(len(files) - 1, s0 + i)
        img = Image.open(os.path.join(src, files[fi])).convert('RGB')
        z, dx, dy, flash = 1.0, 0, 0, 0.0
        # 컷 들어올 때 살짝 당겼다 놓기 + 하얀 번쩍
        K = 12 if first else 7; Z0 = 1.12 if first else 1.06
        if i < K:
            u = i / K; z = 1 + (Z0 - 1) * (1 - u) ** 3
            flash = [0.75, 0.45, 0.22, 0.08][i] if i < 4 else 0
        if name == 'boss':
            k = i - BOSS_DEATH
            if 0 <= k < 12:
                z = max(z, 1 + 0.06 * (1 - k / 12) ** 2)
                amp = 16 * (1 - k / 12); dx = rnd.uniform(-amp, amp); dy = rnd.uniform(-amp, amp)
                flash = max(flash, [0.35, 0.2, 0.08][k] if k < 3 else 0)
        if name == 'end':
            z = 1.0 + 0.035 * i / n
        img = zoom(img, z, dx, dy)
        if flash > 0:
            img = Image.blend(img, Image.new('RGB', (W, H), (255, 250, 235)), flash)
        fr = img.convert('RGBA')
        for a, b, cap, cy in caps:
            if a <= i < b: place(fr, cap, i - a, cy or (470 if cap.height < 420 else 520))
        if eo is not None:
            t = i - 6
            if t >= 0: place(fr, eo, t, 1335)
        if only: fr.convert('RGB').save(os.path.join(HERE, 'ex', 'pv_%s_%d.jpg' % (name, i)), quality=88); continue
        p.stdin.write(fr.convert('RGB').tobytes())
    if only: return
    p.stdin.close(); rc = p.wait()
    if rc == 0: os.replace(tmp, out)
    print(name, n, 'ok' if rc == 0 else 'FAIL')


if __name__ == '__main__':
    T = timeline(); want = sys.argv[1:]
    if want and want[0] == 'pv':
        for q in want[1:]:
            nm, i = q.split(':'); build([t for t in T if t['name'] == nm][0], [int(i)])
    else:
        for sc in T:
            if not want or sc['name'] in want: build(sc)
