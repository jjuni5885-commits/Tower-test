# 게임 빌드(../out/index.html)에 녹화용 소리 손잡이(__td.snd)를 붙인 game.html 만들기. 게임 원본은 안 바꿈
import os
HERE = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(HERE, '..', 'out', 'index.html'), encoding='utf-8').read()
assert s.count('window.__td = {') == 1
s = s.replace('window.__td = {', 'window.__td = { snd: function () { return { LIM: SFX_LIM, CAP: SFX_CAP, SFX: SFX, BUF: SFX_BUF, MUSIC: MUSIC, SONGS: SONGS, RD: RD, UI: UI }; },', 1)
open(os.path.join(HERE, 'game.html'), 'w', encoding='utf-8').write(s); print('game.html ok')
