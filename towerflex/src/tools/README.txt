철옹성: 차원전쟁 v2.0 (2026-11-12 기반 갈래): 엔진 구조와 등록 고리는 docs/ENGINE.md, 갈래 사이 약속은 docs/SPEC.md
- 판은 src/stages_chN.js(MAPS.push), 격자는 판마다 M.cols x M.rows(기본 10 x 17), 저장 키 ironhold.v1
- 시험: node tools/build.js, checkmaps.js, logictest.js, wavetest.js ., metatest.js / python3 tools/touchflow.py 360x640, gachaflow.py, metaflow.py 360x640, fdshot.py(전투 캡처)
- 노드 시험은 tools/fdload.js가 논리 파일을 빌드 순서대로 올림. 실제 판 뒤에 시험 판 t1 ~ t5(tools/teststages.js)를 붙이니 시험은 fdT('t1')로 판 번호를 찾을 것
- 판 설계(STGA): tools/sgdata.js(1, 2장 설계 자료) → node tools/sgmake.js print|write(격자 만들기, 판 파일 쓰기), python3 tools/sgsheet.py(챕터별 미리보기 그림판), python3 tools/sgshot.py [판 id ...](실제 전투 화면)
- 아래는 옛 기록(v1.3까지)

최후의 화살 귀염판 v1 (2026-11-03, v4.3에서 갈라져 나온 귀여운 그림체판. 게임 규칙, 맵, 밸런스, 저장 키는 v4.3과 같음)
- 그림과 소리만 다름: art_enemy.js(귀여운 적 21종), art_tower.js(사탕 색 탑, 꼬마 궁수), art_map.js(밝은 테마 9종, 귀여운 소품, 파스텔 성문), art_fx.js와 render.js(사탕 탄, 별과 하트 타격, 처치 때 뿅 구름과 색종이, 귀여운 피해 숫자, 주변 입자), audio.js(장난감 효과음 71개, 오르골, 마림바 음악 3곡), style.css, template.html, ui_art.js(크림 창, 분홍 버튼, 낮 하늘 타이틀, 파스텔 세계 지도)
- 글꼴: 로고 Bagel Fat One('LOGO', 정해진 글자만), 제목, 숫자, 버튼 Jua('CUTE'), 본문 Pretendard('PRT'). 2단계는 npm i @fontsource/jua @fontsource/bagel-fat-one pretendard
- 시험 도구(.py)는 자기 폴더 기준으로 out/index.html과 shots/를 찾음(ROOT)
- 안드로이드 앱(APK): src/android/ (WebView 껍데기, 만드는 법은 src/android/README.txt). 게임 쪽에는 main.js 끝에 앱이 부르는 window.__appBack, __appPause, __appResume이 있음

최후의 화살 v4 원본 다시 만들기 (작업 컨테이너 기준)
1. 아티팩트에서 src/*.js, src/style.css, src/template.html 을 /home/claude/td4/src 에, src/tools/* 를 /home/claude/td4/tools 에 받는다(.py.txt 는 .txt 떼기)
2. cd /home/claude/td4 && npm init -y && npm i @fontsource/black-han-sans pretendard && pip install --break-system-packages fonttools brotli   (v4.3부터 제목 Black Han Sans, 본문 Pretendard. 둘 다 SIL OFL 1.1, 앱 출시 때 오픈소스 라이선스 화면에 표기)
3. python3 tools/font_subset.py src node_modules out/font.css   (src 안 한글을 모아 글꼴을 자름. 한글 문구를 바꾸면 꼭 다시)
4. node tools/build.js   → out/index.html (최상위 함수, 변수 이름 겹침을 검사하고 겹치면 멈춤)
5. 검증: node tools/checkmaps.js (맵 12개 길 확인, 웨이브 미리보기)
         node tools/sim.js 0,1,2 normal 1 2   (맵들 난이도 실력 연구[0 없음/1 전부/2 진행만큼])
         node tools/simdbg.js 7 normal 1 0    (한 맵 웨이브별 자세히)
         node tools/logictest.js              (무한, 연구, 탑 40단계, 보스 능력)
         python3 tools/shot.py basic|battle|gallery 3,4,5 20|ui|flows|perf|misc|sheet  (화면 캡처 → shots/)
         python3 tools/touchflow.py 360x640   (폰 손가락 탭으로만 처음부터 끝까지 29단계. 버튼은 꼭 이걸로 확인: JS click()은 실제 탭 문제를 못 잡음)
         python3 tools/taptest.py 360x740     (타이틀 → 1번 노드 → 출전 → 이야기 → 전투, 탭 좌표 확인)
         python3 tools/fxshot.py 맵번호 6 3 2     (타격감 확인용 전투 화면: 간격 초, 장수, 속도)
6-3. v4.3 손잡이: 글꼴은 style.css의 'BHS'(제목, 숫자, 주요 버튼)와 'PRT'(본문), 캔버스 글자는 render.js 'px BHS, PRT'. 금화 모으기는 render.js COINS/coinBurst(튀어 오름, 개수 coinN)/drawCoins(날아가기, #fxTop 덮개 캔버스)/goldTxt(+N 글자, 가까우면 합침), 금화 칸 숫자는 ui.js hudTick(RD.coinPend만큼 늦게 올림)과 goldBump, 소리 audio.js coinS. 확인: python3 tools/v43shot.py 390x844
6-2. v4.2 탄 모양 손잡이: render.js ARROW_ST(화살 단계와 갈래별 길이, 빛 꼬리 색과 길이, 맞을 때 섬광 크기), LV_K(돌, 포탄, 노포 화살, 플라스크 크기), drawProjectiles, mountOf(탄이 나가는 실제 위치), powerOf(강화 때 '화력 +N%' 표시)
6-1. v4.1 시각 효과 손잡이: art_enemy.js enVis(적 크기), render.js dmgFx/killFx/upgradeFx(타격, 처치, 강화 연출), art_tower.js KS(단계별 탑 크기)와 twStageBack/twStageFront(받침, 기둥, 계급장), main.js autoQuality(느린 폰 자동 효과 줄이기)
6. 브라우저 콘솔: __td.st()(일시정지, 창, 효과 단계 상태), __td.pc()(입자 수), __td.build(종류, 열, 행), __td.upgrade(탑, 갈래), __td.start(맵번호, 'normal'), __td.bot(1), __td.speed(3), __td.step(n), __td.unlockAll(), __td.sheet('towers'), __td.prof(30)
파일 순서(build.js): util, data, path, logic, bot, art_core, art_map, art_tower, art_enemy, art_fx, render, audio, ui_art, ui, main

- 웨이브 정비 시간 시험(v4.4, 귀염판 v1.1): node tools/wavetest.js . (겹침 없음, 수동 대기, 보너스, 자동 3초, 봇 완주) / python3 tools/waveshot.py <루트 절대 경로> <접두어> (화면 캡처 /tmp/<접두어>_*.png)

[v1.2, 2026-11-05] 새 파일과 손잡이
- src/meta.js: [BM] 보석, 상점(탑 스킨 berry/star, 화살 스킨 heart/candy), 광고 어댑터 metaAdShow(window.AdBridge 있으면 실제 광고, 없으면 '광고 자리(시제품)' 5초), 패배 이어하기(판당 1회, logic.js metaRevive), [재방문] 도감 첫 처치 보석 +5, 오늘 임무 3개. 시험: window.__meta
- src/i18n.js, src/i18n_data.js: 13개 언어 번역 층(한국어 원문이 키, {0} 숫자, {s} 하위 문구, 원문@자리 = 좁은 칸용 짧은 번역). 문구 추가 → font_subset → build → i18ncheck. 시험 도구는 기본 한국어, 다른 언어는 ?lang=xx 또는 localStorage lastarrow.lang
- art_tower.js: twSkinReset(), twSkinPreview(id, px[, 탑, 단계, 갈래]), twSkinId(). render.js: FX_WORDS(의성어, 콤보 글자), fxProjPreview(id, px), fxBusy(붐빌 때 꾸밈 생략), fxBodyBox(조준 표시를 실제 몸 가운데에)
- 시험 도구: node tools/metatest.js(이어하기 논리), python3 tools/metaflow.py 360x640(상점, 광고, 임무, 도감 60단계), python3 tools/fitcheck.py(창 스크롤 없음 검사 12크기 396항목), python3 tools/i18ncheck.py all 360x640 all --quiet(언어별 남은 한글, 넘침), node tools/wavetest.js ., python3 tools/waveshot.py <루트> <접두어>

== v1.3 (2026-11-09) ==
- 맵 20개(13~20 2부), 상성 적 6종(iceslime, ember, mirror, bunny, guard, 보스 twinking), ENEMIES[k].weak/weakEl, MAPS[i].need
- 탑 소환(gacha.js): 처음 archer, catapult. 무료 하루 1회, 소환권 또는 보석 30, 10회 270. 일반 60 / 희귀 30 / 전설 10, 9번 연속 새 탑 없으면 10번째 확정. 중복은 별 +1(별마다 피해 +6%, logic.js tStar), 별 5 뒤 보석 10
- 능력 카드(logic.js CARD_DEFS, EL_CARD, COMBOS, abilityPick, abilitySnap/abilityRestore): 시작 카드(1맵은 빼고), 3웨이브마다 3장 중 1장. 속성(불, 얼음, 번개, 독), 탑별 능력 쌓기, 조합. 이어하기 저장에 포함(ui.js snapMid ab)
- 번역: i18n_v13_ui.js(화면), i18n_v13_maps.js(맵, 적, 이야기, 카드). build.js 순서 i18n_data → i18n_v13_ui → i18n_v13_maps → i18n
- 시험: gachaflow.py(64), v13shot.py(새 화면 캡처), 기존 시험의 newGame에 { cards: false }
