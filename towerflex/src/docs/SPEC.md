# 철옹성: 차원전쟁 v2.0 설계서 (모든 작업 갈래의 공통 계약)

이 저장소(/home/claude/ih, git)는 세로형 HTML5 캔버스 타워 디펜스다. base 커밋 = '최후의 화살 귀염판 v1.3.1'(한 파일 HTML로 빌드: `node tools/build.js` → out/index.html, 안드로이드 WebView 앱으로도 나감). 구조와 시험 도구는 tools/README.txt.
이번 일은 v2.0 대개편이고 여러 작업 갈래(에이전트)가 각자 git 작업 사본(worktree)에서 동시에 일한 뒤 합친다. 이 문서가 갈래 사이의 약속이다. 여기 적힌 키, 이름, 파일, 함수 이름은 바꾸지 말 것. 모자라거나 틀린 점은 스스로 가장 합리적으로 정하고 보고서에 적을 것.

## 0. 사용자 요청 원문 (2026-11-12, 판단이 갈릴 때 기준)
"좀더 업그레이드 하자. vloons td는 뭐랄까 좀더 난이도가 있고 변신이나 합체까지도 있는것 같은데 내건 아직도 초등학생용 같아. 타워를 좀더 다양하게 선택할 수 있도록하고 나만 가질 수 있도록 해줘 그리고 관리자 권한으로 골드나 타워를 내맘대로 운용할 수 있는 모드도 하나 넣어줘 그리고 끝판이 너무 짧아 아직도 챕터1 챕터2 이런식으로해서 챕터1이 귀염이라면 2는 공포 3는 약간 모던 4는 한국전통 이런식으로 개선해봐. 타워가 10개는 너무 재미없어 변신도 단계를 좀더 올려주고 조합하는 재미, 변신하는걸 보는재미, 그리고 타워를 좀더 멋지게, 맵이 좀더 커보이게 타워가 작더라고 모양은 또렷하게, 미사일 화살 이런것도 최고수준으로 구현해줘봐 하루만에 깰수 있는 게임은 곤란해. 아 그리고 바다도 좀 나오고, 대공무기도 좀 제대로 나오고 이렇게 해봐 빌런도 진짜 잘그려주고 챕터 분위기에 맞도록, 그리고 각단계는 너무 똑같이 하지말고 그것도 테마를 가지고 해서 한판한판 도정할 수 잇게해주고 중간중간 보너스 게임도 넣어주고 이름도 최후의 화살 보다는 좀더 임팩트 있는걸로 비행기도 나오고 로케트도 나오고 좀 제대로 타워가 공격할때 타워 자체가 뭔가 역동적으로 구현하고."
(vloons td = Bloons TD. 사용자는 40대 직장인, 부수입용 앱. 가족과 지인이 폰으로 시험함. 이전 판 평가: 귀여운 몬스터는 반응 좋음, 깊이가 얕아 초등학생용 같다.)

## 1. 큰 그림
- 이름: 철옹성: 차원전쟁 (영문 IRONHOLD). GAME_TITLE = '철옹성', 부제 '차원전쟁', VERSION = 'v2.0'.
- 이야기 틀: 차원의 균열이 열려 네 세계가 차례로 침공당한다. 플레이어는 철옹성 수비대장. 챕터마다 세계와 분위기가 다르다.
- 챕터 4개 x 12판 = 48판 + 보너스 게임 12칸. 판 id는 c1s01 ~ c4s12, 보너스 칸은 c1b1 ~ c4b3.
  1장 말랑 왕국(귀염, 지금 그림체와 적 27종 그대로), 2장 저주받은 밤(공포), 3장 강철 전선(모던 군사), 4장 도깨비 고개(한국 전통 요괴).
- 격자: 가로 10 x 세로 17칸(예전 8 x 14). 칸이 작아지니 탑과 적은 작아도 또렷해야 한다. 판마다 M.cols, M.rows로 바꿀 수 있게.
- 영역 3가지: 땅(g), 하늘(a), 바다(s). 물 칸에는 수상 탑만 짓는다. 하늘 적은 대공 무기가 필요하다.
- 탑 24종(기존 10 + 새 14) + 관리자 전용 2종 + 합체 탑 8종. 변신 6단계(1, 2, 3단계 → 갈래 A/B 선택 4, 5단계 → 6단계 궁극). 5단계 이상 두 탑이 붙어 있으면 합체.
- 출전 편성: 가진 탑 중 8종을 골라 판에 들고 간다. 탑은 소환(뽑기)과 판 첫 승리 확정 보상으로 모은다.
- 난이도는 예전보다 확실히 어렵게. 하루 만에 못 깨게: 별 관문, 어려움 난이도, 탑 성장.
- 미성년자도 한다: 공포 챕터도 피, 잔혹 묘사 없이 으스스하고 멋지게. 가짜 타이머, 가짜 접속자 수, 공포 협박 같은 기만 설계 금지. 현금 결제 없음(보석은 게임 안에서만 얻음), 뽑기 확률은 항상 표시.

## 2. 공통 작업 규칙
- 자기 작업 사본에서만 일하고 원본(/home/claude/ih)은 건드리지 말 것. 의미 있는 단계마다 `git add -A && git commit -m "..."` (중간에 멈춰도 남게, 최소 20분에 한 번).
- 파일 소유를 지킬 것(3절). 남의 파일은 꼭 필요할 때 몇 줄짜리 고리만 넣고 보고서에 적을 것. 새 기능은 되도록 자기 새 파일에.
- 빌드는 여러 파일을 함수 하나로 이어 붙인다 → 새 최상위 이름(function, var)은 자기 접두사로 시작(3절). `node tools/build.js`가 이름 겹침을 검사한다. tools/build.js의 planned 목록은 이미 새 파일 이름을 다 담고 있으니 고치지 말 것(순서가 꼭 문제면 보고). CSS는 src/style_자기이름.css로 새로 만들면 자동으로 붙는다(style.css는 화면 갈래 소유).
- 화면 글자는 한국어로만 쓴다(번역은 마지막에 한꺼번에 함, i18n 파일 건드리지 말 것). 가운데 점(·) 금지(쉼표나 슬래시), 글자 크기는 정수 px, 회색 글씨 금지(본문은 진한 색), 증감은 +/-.
- 한글 문구를 넣었으면 `python3 tools/font_subset.py src node_modules out/font.css` 후 빌드해야 글꼴이 나온다.
- 저작권: 기존 게임, 만화 캐릭터, 실제 무기 상표를 닮게 하지 말 것. 전부 오리지널. 그림 안에 글자 넣지 말 것.
- 성능: 폰 60fps. 그림은 미리 구운 스프라이트, 매 프레임 그라디언트 생성 금지, 입자와 탄 개수 상한. 적 한 종류 그림 만들기 30ms 이하.
- 확인은 직접: 빌드, 콘솔 오류 0, 관련 시험 통과, 화면 캡처를 Read로 직접 보고 최소 두 번 다듬기(그림 갈래는 큰 그림판 130px, 작은 그림판 40px, 전투 화면).
- 시간 예산은 지시문에 적힌 대로. 중요한 것부터 하고, 못 한 것은 보고서에.
- 마지막 보고는 25줄 이내 한국어(바꾼 파일, 남의 파일에 넣은 고리, 시험 결과, 캡처 경로, 남은 문제). 자세한 내용은 자기 사본 docs/REPORT_이름.md에.

## 3. 파일 소유와 접두사
| 갈래 | 소유 파일 | 접두사 |
| FOUND 기반 | 격자, 영역, 등록 고리를 위해 모든 파일의 기계적 수정, docs/ENGINE.md | fd |
| ENG1 판과 적 | logic_enemies2.js, logic_rules.js, data_enemies2.js, logic.js의 적, 웨이브, 규칙 부분, path.js | en2, rl |
| ENG2 탑 | data_towers2.js, logic_towers2.js, data.js의 TOWERS, 카드, logic.js의 탑 부분, bot.js | tw2, fz |
| REN1 탑과 탄 그리기 | render_tw.js, art_fx2.js, render.js의 탑, 탄, 연출 부분, art_fx.js | rt |
| REN2 유닛과 판 그리기 | render_units.js, render.js의 적, 판, 덮개 부분 | ru |
| MA 지형 2, 3장 | art_map2.js | mq |
| MB 지형 4장과 바다 | art_map3.js, art_map.js의 물 그리기 | mw |
| EN2/EN3/EN4 적 그림 | art_enemy_ch2.js / art_enemy_ch3.js / art_enemy_ch4.js | e2 / e3 / e4 |
| TW1 기존 탑 10종 | art_tower.js | tw(기존) |
| TW2 / TW3 / TW4 새 탑 그림 | art_tower2.js / art_tower3.js / art_tower4.js | t2 / t3 / t4 |
| STGA / STGB 판 설계 | stages_ch1.js, stages_ch2.js / stages_ch3.js, stages_ch4.js | sg |
| UI 화면 | ui.js, ui_art.js, ui_art2.js, meta.js, gacha.js, chapters.js, loadout.js, style.css, template.html | ch, lo, ui |
| XTRA 관리자, 보너스 | admin.js, bonus.js, stages_bonus.js, style_admin.css, style_bonus.css | adm, bn |
| AUDIO | audio.js, audio2.js | snd, sn2 |
시험 도구는 tools/에 자기 이름이 들어간 새 파일로.

## 4. 판(스테이지) 스키마
판 파일(stages_chN.js)은 `MAPS.push({...})`로 순서대로 넣는다(FOUND가 data.js의 옛 MAPS 20개를 비우고 MAPS = [] 로 둠).
```
{ id: 'c2s05', ch: 2, no: 5, name: '판 이름', region: '지역 이름', theme: '지형 테마 키', cols: 10, rows: 17,
  grid: [17줄 x 10글자], paths: [[[c, r], ...], ...], sea: [[[c, r], ...], ...], air: [[c0, r0, c1, r1], ...],
  waves: 18, gold: 400, hpMul: 1.0, bud: 1.0, pool: [적 키...], intro: { 적 키: 처음 나오는 웨이브 }, boss: 적 키 | null,
  rule: { id: 규칙 키, ...값 } | null, ruleName: '도전 이름', ruleDesc: '한 줄 설명',
  need: [필요한 탑 키 0~3개], reward: { tower: 키 } | { tickets: n } | { gems: n } | null, desc: '한 줄', }
```
- grid 글자: '.' 풀밭(건설 가능), '=' 길, 'G' 성문(길 끝), '#' 바위(건설 불가), '~' 물(수상 탑만 건설, 바다 적이 지나감), 'L' 용암, 소문자 a~e와 C는 장애물과 보물(OBS, 기존과 같음).
- paths: 땅 길 꼭짓점(칸 좌표, 화면 밖 시작은 음수나 17 이상 가능), 끝은 성문. sea: 물 칸 위를 지나는 뱃길, 끝은 성문 옆 물가(부두). 바다 적이 끝에 닿으면 생명이 깎인다. air: 직선 항로(전투기, 폭격기, 미사일 같은 lane 적이 c0,r0에서 c1,r1로 날아감, 화면 밖 좌표 가능, 끝에 닿으면 생명이 깎임). 박쥐 같은 보통 하늘 적은 기존처럼 땅 길을 매끈하게 편 곡선을 따른다.
- 이야기: `STORY[id] = [[화자 키, 대사], ...]` 2~4줄, 화자는 SPEAKERS에 추가. 챕터 끝 결말은 STORY['c1end'] 식.
- 챕터 표: `CHAPTERS = [{ id: 1, name: '말랑 왕국', sub: '한 줄', mood: 'cute'|'horror'|'modern'|'korea', open: { stars: 0 }, gate: { 5: 8, 9: 18 } }, ...]` (data.js, FOUND가 만듦). open.stars = 앞 챕터에서 모아야 하는 별, gate = 그 챕터 안에서 판 번호: 필요한 별. 잠금 해제 기준: 갈래 변신(4, 5단계)은 c1s03 승리 뒤, 궁극(6단계)은 c1s08 승리 뒤, 합체는 c1s12 승리 뒤(상수 UNLOCKS = { branch: 'c1s03', ult: 'c1s08', fuse: 'c1s12' }).
- 보너스 칸: `BONUS_NODES = [{ id: 'c1b1', ch: 1, after: 3, game: 'gallery'|'memory'|'catch' }, ...]` 챕터마다 3, 6, 9판 뒤(stages_bonus.js, XTRA).
- 지형 테마 키: 1장 기존 9종(art_map.js의 THEME 키 그대로). 2장 graveyard(묘지), manor(폐저택 정원), pumpkin(호박밭), crypt(성 지하). 3장 city(도심 아스팔트), desert(사막 기지), harbor(항구, 바다), airfield(활주로). 4장 hanok(기와 마을), bamboo(대나무 숲), palace(궁궐 마당), pogu(바닷가 포구, 바다), sansa(단풍 산사).
- 도전 규칙 키(ENG1이 구현, 판 설계가 고름): fog(탑 사거리 -15%), night(탑 사거리 밖의 적은 안 보이고 조명 탑 근처만 밝음), rush(웨이브 간격 짧음), swarm(수는 많고 약함), elite(수는 적고 강함), poor(시작 금화 절반, 처치 금화 +30%), limit(n: 탑 n개까지만), ban(kinds: 못 쓰는 탑 목록), blackout(주기적으로 탑 몇 개가 3초 정지), meteor(주기적으로 운석이 떨어져 주변 탑 기절, 떨어질 자리 미리 표시), airraid(공습: 하늘 적 위주), landing(상륙 저지: 바다 적 위주), bossrush(보스 연속), fragile(생명 5). 판마다 규칙과 길 모양, 적 구성이 달라 매 판이 다른 도전이 되게.

## 5. 적 명단 (키, 이름, 영역, 크기는 src/data_enemies2.js 뼈대에 있음. 능력 수치는 ENG1이 채움)
1장(기존 27종, 그대로): goblin, orc, wolf, knight, bat, stalker, shaman, spider, skeleton, troll, golem(+golemM, golemS), wagon, wyvern, wraith, warlock, iceslime, ember, mirror, bunny, guard, 보스 grumsh, arachne, yotun(yotun2), varkan, twinking.
2장 저주받은 밤: zombie 좀비(느리고 질김, 죽으면 가끔 다시 일어남), ghoul 구울(빠름, 방책과 병사를 뛰어넘음), phantom 원혼(주기적으로 흐려져 못 맞힘, 조명 탑 근처에선 보임), pumpkin 호박머리(죽으면 폭발해 주변 탑 기절), bats 박쥐 떼(하늘, 작고 많음), witch 마녀(하늘, 빗자루, 탑 하나를 저주해 잠깐 멈추고 주변 적 치유), mummy 미라(붕대 갑옷, 죽으면 풍뎅이 떼), scarab 풍뎅이(아주 작고 빠름), werewolf 늑대인간(체력 절반 아래에서 폭주), vampire 흡혈귀(체력 절반에서 박쥐로 변신해 하늘로), coffin 관 수레(부서지면 좀비 4), doll 저주 인형(크게 맞으면 앞으로 순간 이동), gargoyle 가고일(하늘, 돌 갑옷). 보스: pumpking 호박 대왕(4판), count 흡혈 백작(8판), reaper 사신(12판).
3장 강철 전선: soldier 보병, biker 오토바이 정찰병(빠름), jeep 무장 지프, apc 장갑차(부서지면 보병 4), tank 전차(중갑, 포격으로 탑 기절), mech 보행 로봇, truck 보급 트럭(주변 차량 수리), drone 드론(하늘, 떼), heli 공격 헬기(하늘, 갑옷), jet 전투기(항로, 아주 빠름), bomber 폭격기(항로, 느리고 큼, 폭탄으로 탑 기절), missile 순항 미사일(항로, 아주 빠르고 약함, 성에 닿으면 생명 3), boat 고속정(바다, 빠름), destroyer 구축함(바다, 갑옷), submarine 잠수함(바다, 잠수 중엔 못 맞힘). 보스: bigtank 거대 전차(4판), fortress 공중 요새(8판, 하늘), carrier 항공모함(10판, 바다, 전투기를 띄움), titan 강철 거신(12판).
4장 도깨비 고개: dokkaebi 도깨비, wisp 도깨비불(하늘, 작고 빠름), egg 달걀귀신(가까이 올 때까지 숨음), maiden 처녀귀신(하늘, 비명으로 주변 탑 공격 속도 감소), gumiho 구미호(빠름, 탑 하나를 홀려 멈춤, 30% 회피), saja 저승사자(순간 이동), bulgasari 불가사리(쇠를 먹어 화살, 총알 같은 물리 피해에 강함, 불에 약함), jangsan 장산범(아주 빠름, 잠깐씩 숨음), eoduksini 어둑시니(살아 있는 동안 점점 커지고 강해짐), tal 탈광대(주변 적 빨라짐), horangi 창귀 호랑이(방책을 뛰어넘음), crows 까마귀 떼(하늘), mulgwisin 물귀신(바다, 숨음), pirate 수적선(바다). 보스: duryeok 도깨비 대장(4판), cheonho 천년 구미호(8판, 분신), imugi 이무기(12판, 바다에서 시작해 체력 절반에서 용 yong으로 변신해 하늘로).
- 영역: ENEMIES[k].dom = 'g'|'a'|'s' (없으면 fly면 'a', 아니면 'g'). 항로 비행은 lane: 1. 위에서 본 그림을 진행 방향으로 돌려 그리는 적은 EN_DRAW[k].top = 1(전투기, 폭격기, 미사일, 배 종류 권장).
- 적 그림(EN2~EN4): art_enemy.js의 방식(EN_DRAW[k] = { n, top, f }, enemyFrames, 맞을 때 흰 번쩍임, 오른쪽이 진행 방향)을 그대로 따르고 기존 27종 그림은 픽셀 하나 바꾸지 말 것. 챕터 분위기: 2장은 어두운 보라, 청록, 호박 주황의 으스스함(무섭지만 잔혹하지 않게, 실루엣이 멋지게), 3장은 군용 녹색, 강철 회청, 경고 주황의 탄탄한 기계(차량은 바퀴와 궤도와 프로펠러가 돌고, 통통 튀지 않음), 4장은 단청 오방색과 먹선 느낌의 요괴(탈, 한복, 갓, 방망이). 1장보다 덜 아기 같고 더 멋지게, 다만 같은 게임으로 보이게 진한 외곽선과 또렷한 실루엣은 유지. 40px에서도 실루엣과 대표색으로 구별될 것.

## 6. 탑 명단 (키, 이름, 갈래 이름은 src/data_towers2.js 뼈대에 있음. 수치와 공격 로직은 ENG2)
기존 10: archer, catapult, arcane, frost, ballista, bell, flame, alchemy, cannon, mint (갈래 이름은 data.js). 6단계 궁극 이름: archer 천리안 신궁 / 화살비 군단, catapult 유성 투석기 / 산사태 투척기, arcane 천둥왕의 첨탑 / 별빛 붕괴포, frost 절대영도 / 빙하 폭풍, ballista 용잡이 노포 / 폭풍 연노, bell 승전고 / 천상의 종, flame 태양룡의 숨결 / 지옥불 고리, alchemy 만물 용해액 / 대역병, cannon 성벽 파괴자 / 포화 요새, mint 황금 상단 / 용의 보물고.
새 14 (키 이름: 역할. A 갈래(궁극) / B 갈래(궁극)):
- flak 대공포: 하늘만, 빠른 연사와 작은 폭발. 팔랑크스(철의 장막) / 고사포 진지(하늘 분쇄기)
- sam 유도탄 포대: 하늘 우선 유도 미사일, 한 발이 강함. 장거리 요격탄(스카이 랜서) / 다탄두 미사일(미사일 폭풍, 지상도 타격)
- gatling 기관포탑: 땅과 하늘에 아주 빠른 연사, 갑옷에 약함. 철갑 개틀링(철갑 분쇄기) / 쌍열 벌컨(불꽃 회오리)
- sniper 저격탑: 아주 먼 사거리, 강한 한 발, 숨은 적을 봄. 대물 저격총(보스 사냥꾼) / 관측 저격조(천리 표적수, 표식)
- rocket 다연장 로켓: 땅과 바다에 로켓 여러 발 일제 사격, 재장전 김. 집속 로켓(강철 소나기) / 소이 로켓(불바다)
- laser 레이저 탑: 쏠수록 강해지는 광선. 프리즘 탑(무지개 분광포, 여러 갈래) / 집속 광선포(태양 창, 일직선 관통)
- tesla 테슬라 코일: 짧은 사거리 연쇄 번개, 기절. 폭풍 코일(번개 폭풍) / EMP 발생기(대정전, 기계와 보호막에 강함)
- airbase 비행장: 전투기를 띄워 주변을 돌며 기총 소사. 폭격 편대(융단 폭격단) / 요격 편대(에이스 편대, 하늘 추격)
- warship 전함(물 칸 전용): 먼 사거리 함포. 미사일 순양함(신의 방패함, 대공) / 드레드노트(거함거포)
- turtle 거북선(물 칸 전용): 가까운 거리 양현 포와 용머리 화염, 튼튼. 화룡 거북선(불 뿜는 용두선) / 판옥 대장선(삼도 수군 기함, 주변 수상 탑 강화)
- singijeon 신기전 화차: 로켓 화살 다발, 땅과 하늘. 대신기전(산화 신기전, 큰 폭발) / 백발 화차(천발 화차)
- jangseung 장승: 주변 적을 겁줘 느리게, 숨은 적과 귀신을 드러냄. 천하대장군(벽사 대장군, 주기 기절) / 지하여장군(저승길 여장군, 받는 피해 증가)
- barracks 수호 병영: 길 위에 병사 3명을 세워 땅 적을 막고 싸움. 철벽 방패대(불멸의 방패대) / 화랑 무사단(화랑 검성)
- shrine 서낭당: 부적을 날려 능력을 봉인, 귀신과 요괴에 강함. 봉인 부적(만귀 봉인진) / 벽력 부적(뇌공 강림)
관리자 전용 2: omega 천벌포(위성 궤도포, 화면 어디든 큰 광선), dragon 수호룡 둥지(용이 날아다니며 불을 뿜음).
합체 8 (재료 둘 다 5단계 이상, 이웃 8칸 안, 결과는 첫 재료 자리(수상 합체는 물 쪽 자리), 다른 자리는 비워짐):
fz_skybow 천상궁 = archer + ballista, fz_fortress 거포 요새 = cannon + catapult, fz_storm 뇌신탑 = arcane + tesla, fz_frostfire 빙염탑 = frost + flame, fz_aegis 이지스 방공망 = flak + sam, fz_arsenal 강철 비 = gatling + rocket, fz_carrier 항공모함(물) = warship + airbase, fz_dragonship 화룡선(물) = turtle + singijeon.
- 탑 자료 추가 칸: site: 'land'|'water', hit: 맞힐 수 있는 영역 글자 모음('gas', 'a', 'gs' 등), br[i].ult: 궁극 이름, br[i].tiers는 3개(4, 5, 6단계), fusion: 1(합체 탑), admin: 1(관리자 전용). 등급(소환): 일반 archer, catapult, frost, ballista, flak, gatling, barracks / 희귀 arcane, bell, flame, alchemy, sniper, rocket, tesla, jangseung, shrine, singijeon / 전설 cannon, mint, sam, laser, airbase, warship, turtle. 시작 탑: archer, catapult, flak.
- 탑 그림 계약(art_tower.js): 탑 한 모습 = 뒤 그림(back) + 움직이는 부분(parts) + 앞 그림(front). `towerSpr(type, L, B, S)` → { back: {c, ax, ay}, front: {c, ax, ay}, mounts: [[dx, dy]...], k }, L은 1~6(4 이상은 갈래 B = 0|1), `twPartsDraw(x, t, X, Y, S, time, info, g)`가 사이에서 움직이는 부분을 그린다. 새 탑은 `TW_EXT[키] = { spr: function (L, B, S), parts: function (x, t, X, Y, S, time, info, g) }`로 등록(art_tower.js에 고리 있음). 합체 탑과 관리자 탑은 L = 1 한 모습(강화 2번은 크기와 빛으로).
- 움직이는 부분이 쓸 수 있는 탑 상태(ENG2가 유지): t.aim(표적 방향 라디안, 화면 기준 오른쪽 0, 아래 +), t.fireT(쏜 직후 0.35에서 0으로 줄어드는 초), t.shots(쏜 횟수, 포신 번갈아 쏘기용), t.spin(연사 중 계속 커지는 회전값), t.busy(0~1, 광선 세기나 충전), t.out(비행기가 나가 있으면 1), t.born, t.lvl, t.br, t.frozenT, t.stunT. 없을 수 있으니 방어적으로 읽을 것.
- "탑이 쏠 때 탑 자체가 역동적으로": 포탑이 표적을 향해 돌고, 포신이 뒤로 밀렸다 돌아오고, 개틀링 총열이 돌고, 미사일 덮개가 열리고 연기를 뿜고, 화차가 화살을 쏟아내고, 레이더가 돌고, 장승 눈이 빛나고, 거북선 용머리가 불을 뿜는 식. 변신 단계마다 실루엣이 확 달라져 "변신하는 걸 보는 재미"가 있어야 한다(1 → 2 → 3은 커지고 부품이 늘고, 갈래 A와 B는 서로 다른 모습, 6단계는 한눈에 최종형). 36px 칸에서도 또렷하게: 굵은 덩어리, 진한 외곽선, 대표색 하나.

## 7. 탄, 사건, 상태 계약 (ENG와 REN이 같이 씀. 자세한 기존 구조는 FOUND가 쓰는 docs/ENGINE.md)
- 탄(g.proj의 p.kind) 새 종류: flakshell(터지면 검은 연기 꽃), missile(유도, 흰 연기 꼬리, 큰 폭발), bullet(예광탄), rocket(포물선 일제 사격, 불꼬리), sinarrow(로켓 화살, 불똥 꼬리), navshell(함포탄, 물기둥이나 폭발), ball(포환), bomb(위에서 떨어지는 폭탄), talisman(부적 종이), torpedo(물 위 흰 항적), ebomb(적 폭격기 폭탄), eshell(적 포탄). 공통 칸: x, y(칸 좌표), ang, z(높이, 칸), lvl(탑 단계 1~6), el(속성), big(0~1 크기). 모르는 종류는 빛나는 점으로라도 그릴 것.
- 순간 효과는 사건으로: emit(g, 'tracer', {x0, y0, x1, y1, k}), 'chain' {pts: [[x, y]...]}, 'beamOn'/'beamOff', 'blast' {x, y, r, k: 'he'|'fire'|'flak'|'emp'|'ice'|'holy'|'water'|'dark'}, 'muzzle' {tw, n}, 'transform' {tw, lvl, br, ult}, 'fuse' {a, b, tw}, 'launch' {tw}(미사일 발사), 'planeOut' {tw}, 'towerStun' {tw, sec, why}, 'ruleEv' {id, ...}.
- 아군 유닛 g.units: { kind: 'plane'|'soldier'|'dragon', x, y, ang, z, hp, tw(주인 탑), st }.
- 적 상태(그리기용): e.dom, e.z(하늘 높이), e.ang(진행 방향), e.fade(0~1 흐려짐), e.sub(0~1 잠수), e.rage(폭주), e.grow(배율), e.form(변신 뒤 모습 키), e.sealT(능력 봉인), e.markT(표식), e.fearT(공포 느림), 기존 상태는 그대로. 탑 상태: t.stunT(기절), t.hexT(저주), t.charmT(홀림).
- 판 규칙 상태: g.rule = { id, ... }, 시야(night), 안개, 운석 예고 자리 g.rule.marks = [{x, y, t}].

## 8. 화면 계약
- 흐름: 타이틀 → 챕터 고르기 → 챕터 지도(판 12 + 보너스 3) → 판 창(이름, 도전 규칙, 필요한 탑, 편성 8칸, 난이도) → 전투. 챕터마다 화면 색과 분위기가 달라진다(1장 파스텔, 2장 어두운 보라와 주황, 3장 강철 남색과 호박색, 4장 한지와 단청).
- newGame(mi, dk, opts): opts.towers(편성한 탑 키 목록), opts.towerStar, opts.maxLv(3|5|6), opts.fuse(합체 허용), opts.admin, opts.cards. 전투 중 탑 칸: 강화, 갈래 선택(변신), 궁극, 합체 단추(`fuseOptions(g, t)` → [{ with: 탑, to: 키 }], `fuseTowers(g, a, b)` ENG2 제공, 없으면 숨김).
- 저장: 새 키 'ironhold.v1'. 옛 저장(lastarrow.v4)에서 보석, 소환권, 가진 탑과 별, 스킨, 설정을 옮기고 판 기록은 새로.
- 관리자 모드(XTRA): 타이틀의 버전 글자를 7번 누르면 비밀번호 입력 → SAVE.admin = 1. 관리자 창: 보석, 소환권, 금화 넣기, 모든 탑과 판 열기, 탑 별 올리기, 관리자 전용 탑 2종 켜기, 전투 중 금화 +, 생명 채우기, 적 전멸, 웨이브 건너뛰기, 무료 건설, 즉시 승리.
- 보너스 게임(XTRA, bonus.js 안에서 자체 캔버스로): gallery(황금 과녁 사격: 날아다니는 과녁을 눌러 맞히기 30초), memory(탑 카드 짝 맞추기), catch(떨어지는 금화와 보석 받기). 보상은 보석과 소환권, 첫 완료 보상은 크게, 그 뒤 하루 1번 작은 보상.
