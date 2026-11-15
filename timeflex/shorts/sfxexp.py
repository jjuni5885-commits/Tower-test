import json, base64, numpy as np
from playwright.sync_api import sync_playwright
keys = json.load(open('aud/keys.json')) + ['horn', 'victory', 'upgradeBig', 'powerup', 'crown', 'gate', 'warn']
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox']); pg = b.new_page(viewport={'width': 360, 'height': 640})
    pg.goto('file://' + __import__('os').path.dirname(__import__('os').path.abspath(__file__)) + '/game.html'); pg.wait_for_timeout(2000)
    pg.evaluate("(ks)=>{ const s=__td.snd(); if(!Object.keys(s.BUF).length) s.SFX.init(); ks.forEach(k=>{ if(!s.BUF[k] && s.SFX.need) s.SFX.need(k); }); }", keys)
    for i in range(40):
        pg.wait_for_timeout(1000)
        miss = pg.evaluate("(ks)=>{ const s=__td.snd(); ks.forEach(k=>{ if(!s.BUF[k] && s.SFX.need) s.SFX.need(k); }); return ks.filter(k=>!s.BUF[k]); }", keys)
        if not miss: break
    print('missing', miss)
    meta = {}
    for k in keys:
        r = pg.evaluate("""(k)=>{ const b=__td.snd().BUF[k]; if(!b) return null; const d=b.getChannelData(0); const u=new Uint8Array(d.buffer.slice(d.byteOffset, d.byteOffset+d.byteLength)); let s=''; for(let i=0;i<u.length;i+=0x8000) s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000)); return {sr:b.sampleRate, ch:b.numberOfChannels, b64:btoa(s)}; }""", k)
        if not r: continue
        x = np.frombuffer(base64.b64decode(r['b64']), dtype=np.float32); np.save('aud/sfx_%s.npy' % k, x); meta[k] = [r['sr'], len(x), r['ch']]
    json.dump(meta, open('aud/sfx_meta.json', 'w')); print(len(meta), list(meta.items())[:4])
    b.close()
