# MA 갈래 보고: 2장, 3장 지형 테마 8종 (src/art_map2.js, 접두사 mq)

## 만든 것
- 새 파일 src/art_map2.js (1161줄), 시험 도구 tools/mqshot.py. 다른 파일은 고치지 않음.
- THEME에 8종 등록(기존 칸 전부 + mq 전용 칸): graveyard, manor, pumpkin, crypt / city, desert, harbor, airfield.
  mq 전용 칸: mq(1), ch(장), gnd(땅 무늬), road(길 모양), d(보물 소품), e(숨은 탑 덮개), blk(바위 칸 '#' 소품 목록), veil/veilA(격자 밖 덮개), rim(가장자리 빛), ui({ band: [진, 중, 밝], accent, ink }).
- PROPS에 소품 46종(q 이름) 등록. 테마별 a, b, c, C, d(보물), blk, 가장자리(props) 배치는 MQ_THEMES 표 참고.
- 배경: mqBackground(땅 바탕 → 땅 무늬 MQ_GND → 물은 art_map.js paintLiquids 그대로 → 길 mqRoads → 뱃길 끝 부두 mqPiers → 가장자리 mqMargin → 색 보정 mqGrade).
- 길: gravel(묘지 자갈), cobble(폐저택 둥근 포장돌), mud(호박밭 진흙과 바퀴 자국, 물웅덩이), flag(성 지하 돌바닥), asphalt(도심, 흰 갓선과 주황 점선), packed(사막 다져진 흙), concrete(항구, 주황 검정 경고 띠), taxiway(활주로, 노란 중앙선과 콘크리트 갓길, 파란 유도등).
- 성문: mqGate. 2장 = 쇠창살 뾰족 아치 성문 + 망루 + 횃불, 3장 = 강화 콘크리트 벙커 + 방폭문 + 경광등. 불빛 자리는 render.js drawGate(문 옆 0.36칸, 높이 0.62칸)에 맞춤.
- 날씨: mqAmbient. mist(낮은 안개, 청록 빛 알갱이), leaves2(낙엽), bats(박쥐 그림자 4 + 주황 불티), cryptdust(푸른 먼지), rain(비), sandwind(모래바람), gulls(작은 갈매기 3 + 그림자), wind(마른 바람).
- 지도, 미리보기 대표색: THEME[키].ui, mqUi(th), mqUiReg()(UI_BAND_COL에 8종 넣음), mqMapDeco(x, th, X, Y, S, r, r2)(지도 위 작은 장식).

## 고리 (남의 파일 수정 0줄)
art_map2.js 끝에서 네 함수를 감싸 mq 테마일 때만 가로챔(다른 테마는 원래 함수로): renderBackground, propSpr, gateSpr, drawAmbient.
- propSpr: 'chest' → T.d, 모르는 소품 이름(render.js가 바위 칸에 넘기는 'bigrock', 크기 0.6배) → T.blk[seed % n], 크기를 칸 기준으로 되돌림(S / 0.6).
- 합칠 때 알 것: render.js rdPrepare의 바위 칸 소품 줄이 테마 이름으로 박혀 있음. REN2가 그 배율(0.6)을 바꾸면 mq 바위 칸 소품 크기가 어긋남 → `T.blk`를 직접 쓰게 바꾸는 편이 깔끔.
- MB(art_map3.js)가 같은 식으로 감싸도 사슬로 이어져 문제없음. art_map.js에 명시적 고리를 두고 싶으면 renderBackground 첫 줄에 `if (T.mq) return mqBackground(g, view);` 한 줄로 바꿀 수 있음.
- UI_BAND_COL 등록은 setTimeout(0)과 배경을 처음 구울 때 한 번(ui_art.js가 뒤에 읽히기 때문).

## 시험
- node tools/build.js 통과(이름 겹침 없음), 콘솔 오류 0(전투, 미리보기, 지도).
- python3 tools/mqshot.py [360x640] [테마들|all] [battle|preview|sheet|bench|all] [초]: 실행 중에만 __td.MAPS[i].theme을 바꿔 캡처(파일은 안 바꿈).
- 캡처(shots/, git에는 안 들어감): mq_<테마>_360_0/1.png, mq_<테마>_412_0/1.png(전투), mq_prev_<테마>_360.png(판 미리보기), mq_sheet_<테마>_130/40.png(소품 그림판), mq_map_360_*.png(지도: ui_art.js를 임시로 고쳐 찍고 되돌림), mq_grid10x17_360.png(data.js를 임시로 10x17로 늘려 찍고 되돌림), mq_reg2.png(기존 테마 그대로인지).
- 성능(같은 판, 같은 화면에서 옛 8종과 새 8종을 번갈아 10회, 끝에 화소를 읽어 실제 칠하는 시간까지): 배경 한 장 평균 옛 655~1221ms, 새 443~818ms / 최소 옛 248~724ms, 새 136~308ms. 날씨 한 프레임 옛 1.1~10.5ms, 새 1.3~7.6ms.
  절대값은 믿지 말 것: 다른 갈래와 같이 도는 기계라 평소의 10배쯤 느리게 나옴(한가할 때 화소 읽기 없이 잰 값은 옛 23~57ms, 새 21~45ms). 비율로만 보면 새 테마가 같거나 가벼움.

## 남은 문제
- 한가한 기계에서 절대 시간(배경, fps)을 다시 재야 함. 실제 폰 확인 못 함.
- 지도 장식(mqMapDeco)은 단순한 도형 수준. UI 갈래가 챕터 지도를 새로 만들 때 색(ui.band, accent)만 쓰고 장식은 다시 그리는 편이 낫다.
- 돌바닥, 포장돌 길은 굽은 곳에서 돌이 조금 어지럽게 겹침. 두 길이 합쳐지는 곳도 약간 지저분함.
- 항구 물가 경고 줄무늬는 칸 경계에 곧게 그려서 둥근 물가 모양(art_map.js)과 딱 맞지 않음. MB가 물 모양을 바꾸면 다시 맞춰야 함.
- 날씨 중 비는 아주 옅음(전장 가독성 우선). 갈매기는 3장 비행기 적과 헷갈리지 않게 작고 옅게 했지만 실제 적 그림과 같이 놓고 본 것은 아님.
- 2장, 3장 적과 새 탑 그림이 아직 없어 귀염판 적과 탑으로만 대비를 확인함. 어두운 2장 땅 위에서 새 탑(어두운 색일 경우)이 묻히는지는 합친 뒤 봐야 함.
- 숨은 탑 장애물(e~j)은 render.js가 T.b, T.c를 쓰므로 T.e는 지금은 안 쓰임.
