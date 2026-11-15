import sys, base64
from playwright.sync_api import sync_playwright
names = sys.argv[1].split(',')
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox']); pg = b.new_page(viewport={'width': 360, 'height': 640})
    pg.goto('file://' + __import__('os').path.dirname(__import__('os').path.abspath(__file__)) + '/game.html'); pg.wait_for_timeout(2000)
    for n in names:
        r = pg.evaluate("""(n)=>new Promise(res=>{ const s=__td.snd(); const S=s.SONGS[n]; s.MUSIC.prepare(n, async ()=>{ const u=s.MUSIC.urls[n]; if(!u) return res(null); const ab=await (await fetch(u)).arrayBuffer(); let bin=''; const v=new Uint8Array(ab); for(let i=0;i<v.length;i+=0x8000) bin+=String.fromCharCode.apply(null, v.subarray(i,i+0x8000)); res({b64:btoa(bin), bpm:S.bpm, st:s.MUSIC.stat[n]}); }); })""", n)
        if not r: print(n, 'none'); continue
        open('aud/song_%s.wav' % n, 'wb').write(base64.b64decode(r['b64'])); print(n, r['bpm'], r['st'])
    b.close()
