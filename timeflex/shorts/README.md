# 타임플렉스 쇼츠 만들기 (Claude 작업 공간용)

실제 게임 화면을 가상 시계로 한 프레임씩 돌려 찍고(끊김 없는 30fps), 자막과 컷 연출을 입힌 뒤 게임 음악과 그 장면에서 실제로 난 효과음을 섞는다.
화려하게 보이도록 탑은 최고 단계로 세우고 적은 몰아서 넣는 연출판이다(게임 그림, 효과, 소리는 전부 실제 게임 것).

순서 (timeflex/shorts 안에서):
1. `cd ../src && node tools/build.js && cd ../shorts` 로 ../out/index.html 만들기
2. `python3 make_game.py` (녹화용 game.html)
3. 장면 찍기: `python3 capture.py <장면>` (scenes.json: 판 번호 mi, 탑, 적 무리, 우두머리, 길이). 시험은 `python3 capture.py <장면> probe` (작게, 10프레임마다)
   - 2코어면 `printf "%s\n" hook boss m1 m2 m3 m4 m5 m6 m7 m8 end | xargs -P2 -I{} sh -c 'python3 capture.py {} > cap_{}.log 2>&1'` 약 3분
4. 소리 재료: `python3 music.py boss_joseon` (aud/song_*.wav), 장면을 찍은 뒤 aud/keys.json(쓰인 효과음 목록)을 만들고 `python3 sfxexp.py`
5. 구성표 plan.py (140bpm 박자에 컷을 맞춤, 자막 문구). 우두머리 죽는 프레임이 바뀌면 frames/boss.json stats로 BOSS_DEATH와 boss 시작 프레임 조정
6. `python3 compose.py` (장면마다 clips/*.mp4), 미리보기 `python3 compose.py pv hook:12 end:70` → ex/pv_*.jpg
7. `python3 mix.py` → aud/mix.wav, 이어 붙이고 소리 넣기:
   `ffmpeg -f concat -safe 0 -i clips/list.txt -c copy v.mp4 && ffmpeg -i v.mp4 -i aud/mix.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k out.mp4`

주의: 쇼츠 설명란 링크는 눌리지 않음. 끝 화면은 '링크는 채널 프로필에'.
CSS 움직임(우두머리 처치 띠 등)은 가상 시계가 못 잡아서 capture.py가 Animation.setPlaybackRate로 녹화 속도에 맞춰 늦춘다.
