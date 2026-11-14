# 타임플렉스(TIME FLEX) 개발 메모

타워플렉스 v2.3 엔진을 복사해 만든 두 번째 게임. 저장 키 timeflex.v1(타워플렉스와 따로).

## 새 파일
- src/tf_data.js: 장 15개(CHAPTERS, mood), 시대 이름, 시대 탑(원시 4종: sling, spear, bonfire, totem), 시대 표(TF_ERA), 시대 고증과 시간 초월(TF_MODES, TF_TIME_HP), 원시 적 9종, 원시 지형(TF_THEMES)
- src/stages_t1.js: 1장 7판(tools/tf_stage.js 1 이 tools/tf_st1.js 정의에서 만듦, 직접 고치지 말 것)
- src/tf_bonus.js: 보너스 칸(장마다 3판, 5판 뒤)
- src/tf_art_enemy.js: 원시 적 그림(4장 먹선 도구 e4* 사용, 시간 균열 무늬 tfRune)
- src/tf_art_tower.js: 원시 탑 그림(art_tower3 틀 t3Reg), 탄 모양 TF_PJ(render.js가 tw.k로 부름)
- src/tf_art_map.js: 지형 테마 등록, 시간의 문(성문) 그림
- src/tf_audio.js: battle_prim, boss_prim (audio2.js sn2Song이 장 mood로 고름)
- src/tf_ui.js: 시대 고증/시간 초월 줄, 편성 시대 필터(tfLoFilter), 시대 탑 지급, 장 카드 그림, 타이틀 그림, 시험 고리 window.__tf
- src/style_tf.css

## 엔진에 넣은 고리
- logic.js: 적 체력 x g.tfHp, 별 상한(시간 초월 2), 종탑류 판정 tfBellK(토템도 종탑처럼)
- ui.js: 저장 키, towersFor, startBattle의 tfApplyMode, showResult의 tfOnResult
- chapters.js: 판 창 모드 줄과 힌트, 장 지도 들어갈 때 tfGrantEra, 제목
- loadout.js: loUsable(mi)가 tfLoFilter를 거침
- gacha.js: 시작 탑 sling, spear
- audio2.js sn2Song, ui_art2.js uiChMap(원시 장식), uiChCard와 uiTitleArt2는 tf_ui.js로 교체(옛것은 Old 이름)
- render.js: 탄 그리기 TF_PJ 고리, 쟁반 아래 고정(v2.3)

## 시험
- node tools/build.js, node tools/checkmaps.js, node tools/sim.js c1 normal 1 0 all towers=sling,spear,bonfire,totem fuse=0
- python3 tools/touchflow.py 360x640 (40/40), python3 tools/tfshot.py 360x740, python3 tools/tf_sheet.py enemies|towers 키들 크기

## v1.0 배포판 (2026-11-14)
- 처음 언어는 한국어(i18n.js i18nDetect, 새 시대 문구가 한국어뿐). 상점 사탕 스킨 숨김(style_tf.css, meta.js metaFixSave가 기본 모양으로)
- 귀염판 분홍, 라일락 → 양피지, 청동, 붉은 쇠(style_tf.css 끝 v1.0 묶음, 아이콘 소환권, 광고 TV, 깃발, 상점 주머니, 도감)
- '성문' 문구를 '시간의 문'으로(결과 창, 규칙, 적 설명, 기술 이름). 시대 고증 첫 승리 보석은 결과 창 줄로(tf_ui.js tfOnResult)
- 물길 판 힌트(tf_ui.js tfModeHtml, 판 격자에 '~'가 있으면). 봇은 물가를 비워 물길 판에서 지지만 tools/humanplay.js로 물가 배치를 흉내 내면 c2s05 보통 별 3
- 시험: node tools/tfsweep.js 1-15 normal era all(8이면 편성 8종), python3 tools/rendersweep.py(105판 실제 화면, 오류 0), tools/pinkscan.py(남은 분홍 찾기), tools/relshot.py 360x740 [장](주요 화면 캡처)

## v1.2 (2026-11-14)
- 적 원화 14종(제미나이, 앞/뒤/옆 세 모습): caveman, mammothKing, tr_landship, eg_pharaoh, eg_spear, ro_tyrant, ro_legion, tk_general, tk_spear, nr_giant, nr_raider, ca_giant, ca_foot, sa_kraken
  - 넣기: python3 tools/sprite_in.py 그림 키 [mo=walk|heavy|drive|crawl|fly] [h=몸높이] → src/sprites/, src/tf_sprites.js. 검수 tools/sprcheck.py 키, tools/sprshot.py 키 판번호
  - 걸음: 우두머리 heavy(ca_giant h1.0, nr_giant h1.05, tk_general h1.1), 전차, 전함 drive(tr_landship h0.85), 크라켄 crawl(h1.0), 나머지 walk(h1.2)
  - sprite_in: 무기, 촉수가 옆 모습까지 뻗어도 조각별로 나눔(split_masks), 몸에 닿은 반짝이도 색으로 지움(kill_sparkle)
- 난이도(중반 이후, tf_data.js TF_LATE, tfLateQ): 3장부터 10장까지 세지고, 판 안에서는 앞 30% 웨이브는 그대로, 85% 이후 전부
  - 같은 체력 총량을 최대 33% 적은 마릿수에 몰음(한 마리 체력 최대 약 1.6배, 총량 +8%). 떼, 하늘 잔챙이(체력 160 이하)는 더 크게(마릿수 -46%, 총량 +23%)
  - 무리 간격 최대 1.55배, 떼 무리는 4마리, 섞어 웨이브에 땅 중장갑, 특수 적 끼움, 떼 웨이브 일부를 중장갑 웨이브로. 금화 총량은 그대로(한 마리 몫을 올림)
  - 점검: node tools/balprof.js 1-15 normal strong (한방=90% 이상에서 한 번에 죽음, 몰살=0.25초에 4마리 이상). 값 바꿔 보기: sim.js tfl=cut:0.3,tot:0.1 (from:99는 끔)
  - 결과(앞서가는 선수 봇): 승 94→92/105, 몰살 8~13장 15~27% → 5~14%, 한방 8~15장 8~32% → 2~24%
- 남은 분홍 정리(보스 막대, 전투 시작 버튼 깜빡임, 적 줄 우두머리 칸 등 style_tf.css v1.2 묶음)
