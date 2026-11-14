# MB 보고: 4장 지형 5종 + 바다 그리기 (접두사 mw)

## 바꾼 파일
- src/art_map3.js (새 파일): 1부 바다(모든 테마 공통), 2부 4장 테마 5종(THEME, 소품 30여 종, 배경, 길, 성문, 날씨 입자)
- src/art_map.js 고리 3줄: paintLiquids 첫 줄(mwPaintSea), paintRoads 다리 앞(mwBridges), renderBackground 가장자리 소품 루프(격자 밖 물 위에는 뭍 소품 안 놓음)
- src/render.js 고리 1줄: drawLiquidAnim 첫 줄(mwLiquidAnim)
- tools/mw_shot.py: 캡처와 프레임 측정
- 고리 없이 감싼 것(art_map3.js 끝 mwInstall, mw 테마만 가로채고 나머지는 원래 함수): renderBackground, gateSpr, initAmbient, drawAmbient, PROPS.bigrock(바위 칸), PROPS.chest(보물)

## 판 설계와 다른 갈래가 쓸 수 있는 칸
- M.sea: [[[c, r], ...], ...] 또는 한 갈래 [[c, r], ...]. 마지막 점이 부두. 뱃길은 buildPath(점, 0.5)로 둥글려 그림(첫 점이 격자 밖이나 가장자리면 바깥으로 8칸 늘림). 부두는 끝 칸의 이웃 뭍 칸(성문에 가까운 쪽) 방향으로 놓임
- M.rule.id === 'night' 또는 M.night: 4장 테마에서 달빛 색 보정, 길가 청사초롱, 반딧불 추가
- M.amb: 4장 테마 날씨 바꾸기(mwFly, mwMist, mwSnow, mwGull, mwMaple)
- THEME[k].sea [깊은, 가운데, 얕은], THEME[k].pier 'wood'|'concrete', THEME[k].bridge 'wood'|'stone': 없으면 MW_SEA, MW_HARD, MW_STONE 표(2, 3장 테마 키를 미리 넣어 둠), 그것도 없으면 THEME[k].water 에서 만듦
- THEME[k].ui [진, 중, 밝](지도 띠 색), THEME[k].key(대표색), mwThemeUi(th)

## 바다
- 물 모양 밭(칸당 12px, 화면 밖까지 가장자리 물 칸 연장) → 화면 절반 해상도로 색 굽기: 물가 모래 띠, 얕은 물과 깊은 물, 셀 그림 얼룩, 뱃길 물색, 흰 거품 두 줄
- 잔물결, 연잎(초원과 늪의 얕은 물만), 뱃길 점선과 부표, 부두(나무, 콘크리트), 다리(나무, 돌. 물 위를 건너는 길 칸은 물이 다리 밑으로 이어짐)
- 움직임: 물 안쪽 자리에 미리 구운 흰 물마루와 반짝이를 켰다 끔(칸당 0.85개, 최대 130개, 느린 폰 모드에서 절반)
- 얼음(눈 테마)과 용암은 예전 그림 그대로

## 시험
- 임시 판 10x17 6종(shots/mw_testmaps_i18n_v20.js.txt 를 src/i18n_v20.js 로 복사하면 다시 쓸 수 있음, 커밋 금지), 원래 8x14 판도 확인
- python3 tools/mw_shot.py 360x640 0,1,2,3,4 꼬리표 [bot초] [prof]
- 물 구간 프레임 시간: 예전 0.46 ~ 0.53ms, 지금 0.35 ~ 0.65ms(같은 판, 헤드리스 크롬, 잡음 큼)
