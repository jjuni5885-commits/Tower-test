# v2.0 갈래 보고 요약 (조정자 기록)
보고서 파일을 못 쓴 갈래들의 핵심을 여기 모음. 자세한 내용은 각 파일 머리 주석.

- STGA(1, 2장 판): 시험 판은 tools/teststages.js(t1~t5, t4 뱃길, t5 항로). 보스 키 barkan. 판 파일이 원본, 수치는 tools/sgdata.js와 함께 고칠 것(sgmake.js write가 덮어씀). 2장 별 관문 open 26, gate 5: 9, 9: 20. 봇(옛 10탑) 기준 1장 6/8/10/11/12, 2장 대부분 패배(대공 없음). 1장 4, 5판은 쉬운 편.
- STGB(3, 4장 판): 판 파일은 생성물(tools/sgb_ch3.js, sgb_ch4.js 정의 → node tools/sgb_gen.js). bud 3장 1.6~2.0, 4장 2.0~2.4, 첫 웨이브 적음. c3s08 공중 요새는 g.fly[0], c3s10 항모는 sea[0]. c4s12 이무기 → 용 항로 이동 미검증. 결말: 이무기가 네 세계 기운으로 용이 되려 함.
- XTRA: 관리자 = 버전 글자 7번 → 비밀번호 7777. admOpen, admBattle, 구석 단추 #admFab, 보너스 bnOpen/bnState, 대비 단추 #bnFab. 보너스 상수 bonus.js 맨 위(BN_FIRST, BN_DAILY, BN_GAMES). 하루 최대 보석 180 → 상한 검토. meta.js metaKeepWallet에 admin, admPin, admTw, admOpt, bonus 추가 권장.
- ENG2: docs/REPORT_eng2.md. 사거리 30 탑 4종 사거리 원이 화면보다 큼.
- REN1: 사건 impact/seal/unitDown/orbital, t.beams. 기존 탄(화살, 돌, 구슬) 다듬기는 안 함.
- AUDIO: 새 효과음 50, 음악 7곡, SND_EV/SND_TW/SND_EN. XTRA는 sfx('bnHit' 등) 사용.
- TW1/TW2/TW3/TW4/EN2/EN3/EN4/MA/MB: 그림 완료, 각 갈래 사본 shots/ 에 캡처.
