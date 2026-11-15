# python3 capture.py 장면이름 [probe]  → frames/<이름>/0000.jpg..., frames/<이름>.json(소리 기록)
import sys, json, os, time
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
name = sys.argv[1]; probe = len(sys.argv) > 2 and sys.argv[2] == 'probe'
SC = json.load(open(os.path.join(HERE, 'scenes.json')))[name]
SET = open(os.path.join(HERE, 'setup.js')).read(); ARMY = open(os.path.join(HERE, 'army.js')).read()
FPS = 30; DSF = 1 if probe else 3
OUT = os.path.join(HERE, 'probe' if probe else 'frames', name); os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 360, 'height': 640}, device_scale_factor=DSF, has_touch=True, is_mobile=True)
    ctx.clock.install()
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + HERE + '/game.html'); pg.wait_for_timeout(2200)
    built = {}; arm = {}
    if SC.get('title'):
        pg.wait_for_timeout(1500); pg.evaluate("()=>{ const st=document.createElement('style'); st.textContent='#ver,.tgem{visibility:hidden!important}'; document.head.appendChild(st); }")
    else:
        pg.evaluate("()=>{ const s=__td.snd(); try{ if(!Object.keys(s.BUF).length) s.SFX.init(); }catch(e){} }")
        pg.evaluate("(m)=>{__td.start(m,'normal')}", SC['mi']); pg.wait_for_timeout(1500)
        for i in range(4): pg.evaluate("()=>{try{__td.closeModal()}catch(e){}}"); pg.wait_for_timeout(120)
        built = pg.evaluate(SET, SC)
        for w in range(SC.get('waves', 0)): pg.evaluate("()=>document.getElementById('bWave').click()"); pg.wait_for_timeout(120)
        pg.wait_for_timeout(SC.get('warm', 2500))   # 시대 소리 만들 시간
        for i in range(3): pg.evaluate("()=>{try{__td.closeModal()}catch(e){}}")
        arm = pg.evaluate(ARMY, SC)
        pg.evaluate("()=>{ const g=__td.G(); g.lives=30; g.gold=4000+Math.floor(Math.random()*3000); }")
        pg.evaluate("(v)=>{__td.speed(v)}", SC.get('speed', 1))
    now = pg.evaluate("()=>Date.now()"); ctx.clock.pause_at(now + 50)
    cdp = ctx.new_cdp_session(pg); cdp.send('Animation.enable'); arate = SC.get('arate', 0.18); cdp.send('Animation.setPlaybackRate', {'playbackRate': arate})   # CSS 움직임도 게임 시간에 맞춰 느리게
    ctx.clock.run_for(SC.get('preroll', 1200))
    t0 = pg.evaluate("()=>{ const s=__td.snd(); s.SFX.log=[]; return performance.now(); }")
    lim = pg.evaluate("()=>__td.snd().LIM")
    N = int(round(SC['dur'] * FPS)); ev = sorted(SC.get('events', []), key=lambda q: q[0]); ei = 0; stats = []
    tt = time.time()
    tr = time.time()
    for i in range(N):
        if i and i % 10 == 0:
            per = (time.time() - tr) / 10; tr = time.time(); arate = max(0.03, min(1.0, (1.0 / FPS) / per)); cdp.send('Animation.setPlaybackRate', {'playbackRate': arate})
        while ei < len(ev) and ev[ei][0] * FPS <= i: pg.evaluate("()=>{" + ev[ei][1] + "}"); ei += 1
        ctx.clock.run_for(round((i + 1) * 1000 / FPS) - round(i * 1000 / FPS))
        if not SC.get('title'): pg.evaluate("()=>{ const st=__td.st(); if(st.modal && st.kind!=='pause') __td.closeModal(); }")
        if not probe or i % 10 == 0 or i == N - 1:
            pg.screenshot(path=os.path.join(OUT, '%04d.jpg' % i), type='jpeg', quality=92)
        if not SC.get('title') and (i % 15 == 0 or SC.get('events')): stats.append(pg.evaluate("()=>{const g=__td.G(), b=window.__boss; return [g.enemies.length, b&&!b.dead&&b.hp>0? Math.round(100*b.hp/b.mhp):-1, g.wave, g.lives]}"))
    log = pg.evaluate("()=>__td.snd().SFX.log")
    json.dump({'t0': t0, 'log': log, 'N': N, 'fps': FPS, 'stats': stats, 'lim': lim}, open(os.path.join(HERE, 'probe' if probe else 'frames', name + '.json'), 'w'))
    print(name, 'built', built.get('built', [])[:3], 'L', built.get('L'), 'W', built.get('W'), 'army', arm, 'sec', round(time.time() - tt, 1))
    print(name, 'stats', stats if len(stats) < 40 else stats[::5]); print(name, 'sfx', len(log), sorted(set(q[0] for q in log))[:30]); print(name, 'errs', errs[:3])
    b.close()
