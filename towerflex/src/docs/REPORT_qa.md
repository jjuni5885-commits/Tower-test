# QA 갈래 보고 (v2.0 통합 점검, 2026-11-13)

## 시험 결과 (한 번에 하나씩 돌림)
| 시험 | 결과 |
| node build / logictest / checkmaps(53판) / metatest / wavetest / en2test -q(149) / tw2test | 전부 통과 |
| touchflow 360x640, 412x915 | 41/41, 41/41 |
| gachaflow / metaflow | 76/76 / 60/60 |
| fitcheck (12크기 전체 1회 + 마지막 3크기) | 744항목 중 '이야기 이름표'만 실패 → 고친 뒤 186/186 |
| uibflow / uibfit(12크기) | 47/47 / 504/504 |
| xflow / tw2flow / sndcheck | 69/69 / ALL OK / 전부 통과 |

## 고친 것 (커밋 순)
- 시험: touchflow, uibfit, uibflow가 첫 승리 탑 보상 연출(#rwLayer)을 닫게. gachaflow가 챕터 시작 이야기(c1in, c2in)를 확인 후 넘김. fitcheck 이야기 이름표(.who, 일부러 상자 밖) 예외. uibflow 가짜(FAKE) 제거 → 실제 엔진 점검(REAL: 그림, 6단계, 합체, 관리자 함수), 물 칸 있는 실제 판 c1s06, 실제 ban 규칙, 실제 보상. uibfit/uibshot도 REAL. xflow: 지도 관리자 단추는 #mAdm, 보너스 대비 단추는 숨는 것을 확인.
- meta.js metaKeepWallet에 admin, admPin, admTw, admOpt, bonus, bnDay, lo 추가(rwGot, fused는 이미 있었음). kill 사건에 form이 있으면 metaSlain(form)도(용 도감).
- render.js drawBeam, 반짝이, arcH1의 하늘 높이 0.75 → ruFlyZ(e).
- ui.js 옛 goMap, openStage, openCodex 본문과 쓰지 않는 uibReward 삭제(얇은 연결만 남김).
- 챕터 결말 이야기: 예전엔 결과 창에서 4.2초 안에 나가면 '본 것'으로 기록되고 영영 안 나왔음 → UI.pendStory로 미뤄 두고 지도에 들어가며 보여 줌(본 뒤에 기록). '다음 지역'이 새 챕터면 그 챕터 지도로 들어가며 시작 이야기(chEnter).
- 관리자: 지도 위 #mAdm을 톱니 그림만으로(좁은 폰에서 챕터 이름 '도깨...' 잘림 해결, data-adm). 전투 구석 단추는 빈 틈이 없으면 위 막대 안 빈 틈(왼쪽 칸과 배속 단추 사이)에 둠(전장 가림 해결).
- 보너스: 챕터 지도가 보너스 칸을 그리므로 #bnFab 숨김(챕터 고르기에서 1장 카드와 겹쳤음). 하루 보상 합계 상한 보석 60(BN_DAILY_CAP, SAVE.bnDay), 상한이면 결과 창 안내.
- 빌드 보기: 자료 없는 탑 키를 걸러 예외 방지.
- 화면: --ink2(보조 글자)를 전 챕터 진하게(회색 느낌 제거: 판 창 부제, 웨이브/생명 줄). 받은 보상 칸 opacity 0.6 제거. 1장 밖 설정 창(진행 기록 지우기 글자가 안 보였음), 켬/끔 단추, 언어 줄, 상점 장착 칩, 전투 웨이브 단추, 기술 단추 바탕을 챕터 색으로. 전투 위 막대 단추 30 → 32px.
- 성능: autoQuality 낮은 효과 단계가 render_tw.js 입자(RT_MAXP 220 → 120)도 줄임. __td.lowFx(v) 시험 고리.

## 성능 (tools/qaperf.py, 360x640 dpr2 헤드리스, __td.prof(60))
- v2.0 밤 규칙 c2s03, 6단계 탑 20 + 적 60: 프레임 48~50ms(입자 640, 불꽃 319), 낮은 효과 39ms
- 1.3.1 귀염판 같은 크기(5단계 탑 20 + 적 60): 27.5ms → 약 1.8배(2배 미만). 차이는 입자(parts 16 대 9), 탄(proj 7.7 대 2.6), 밤 덮개(screenfx 3.8)

## 저장 이전
- lastarrow.v4(보석 321, 소환권 7, 탑 archer 별2/cannon/mint, 스킨, 설정)으로 열면 전부 옮겨지고 시작 탑 catapult, flak 추가, 판 기록 0, 옛 저장 남김, 안내 창, 판 시작까지 콘솔 오류 0.

## 캡처
- shots/qa_360x640_*.png, qa_412x915_*.png(메뉴 전체), qa_360x780_battle_*.png, tools/qashot.py로 다시 만듦. 시트: 메뉴 21장, 전투 8판 + 결과 + 보너스 3종 확인.

## 남은 문제
- 기술 단추 그림(화살비 구름, 방책, 화살)은 2~4장에서도 1장 귀염 그림(바탕만 챕터 색).
- 불꽃 탑 입자가 장면 입자의 절반(불꽃 상한 따로 두면 더 가벼워짐). 실제 폰 fps는 미확인.
- 관리자 켠 직후 0.9초 동안 지도에 구석 단추가 잠깐 겹쳐 보일 수 있음(admHasExt 캐시).
- 결과 창 0.9초 뒤 탑 보상 연출이 결과 창 단추를 덮음(확인을 눌러야 함, 의도된 연출).
