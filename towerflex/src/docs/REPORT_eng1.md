# ENG1 보고 (판과 적)

## 한 일
- 2~4장 적 53종 수치와 능력, 우두머리 12종 체력 구간별 변화. 능력은 자료(data_enemies2.js)에 적고 공통 해석기(logic_enemies2.js)가 돌림 → 밸런스는 숫자만 고치면 됨.
- 웨이브 생성이 바다, 항로, 떼, 규칙을 앎. 1장 땅 판 웨이브는 기반과 동일.
- 도전 규칙 14종(logic_rules.js), ruleBlocks(g, key), rlInfo(M), g.whyNot.
- drone 0.5, bats/crows 0.46, scarab/wisp 0.45, pumpking/count 1.5, vampbat(form: 1), submarine_sub(alt: 1) 정식 자료(도감 제외). e.ang 매 걸음 갱신.

## 다른 갈래와의 약속
- 적 상태: SPEC 7절 그대로 + e.cast = { k, t, T, r, fx }(예고 중 광역 공격), e.hopT, e.ph(체력 구간), e.clone, e.dark, e.dash, e.scat, e.elite, e.mini.
- 변신은 제자리: e.k는 vampire, imugi로 남고 e.form, e.F, 능력치, 영역, 길이 바뀜. 용은 가까운 항로 또는 하늘 곡선.
- 탑 상태: stunT, hexT, charmT, jamT/jamF(처녀귀신 공격 속도 감소), immT(풀린 뒤 2.5초 면제), dark(night).
- 사건: towerStun { tw, sec, why, k: stun|hex|charm|jam }, morph { e, en, to, from }, blink, rage, leap { over }, phase, scatter, reveal, laneWarn, warn { x, y, r, sec, k, cancel }, blast { enemy: 1 }, eshoot, ruleEv { id, k: block|warn|hit|mark|push|siren }. summon에 type, n, launch, clone. kill에 form, die.
- 탄: eshell(포물선), ebomb(낙하). 칸 x, y, z, tx, ty, T, u, br, big, fx, enemy: 1.
- ENG2: leap 적(ghoul, horangi)은 방책과 block 유닛을 넘음(봉인 중엔 못 넘음). sealT, fearT는 엔진이 줄임, 탑은 걸기만. 공포 느림은 e.fearF(0~0.8). 조명 판정은 bell reveal, jangseung, TOWERS[k].light 또는 st.light, st.detect. 상성 표시 kin, ghost, yokai, mech. aaOnly는 tw.hit에 'g'가 있으면, hull은 tw.site가 water가 아니면 피해 감소. 탑 멈추기는 전부 en2StunTower(g, t, sec, why, k)(관리자 탑 면제, 합체 탑 절반).
- 화면: night는 g.rule.lit = [{ x, y, r, light }], meteor는 g.rule.marks = [{ x, y, t, T, r }]. 규칙 이름과 설명은 rlInfo(M).

## 판 설계용
- 바다 적은 뱃길이 있으면 웨이브 예산 22~40%, 항로 적은 세 웨이브에 두 번 20~40%. 길이 없는 영역의 적은 빠짐. 떼는 5마리 무리.
- 규칙 기본값: fog k 0.85 / night k 0.7 / rush k 0.55 / swarm n 1.8, hp 0.55 / elite n 0.5, hp 1.9 / poor k 0.5, gold 1.3 / limit n / ban kinds / blackout cd 14, n 2, sec 3 / meteor cd 12, r 1.3, sec 3, tele 2 / airraid, landing k 0.65 / bossrush every 4, list, hp 0.5, leak 8 / fragile lives 5.
- bossrush는 list 없으면 그 챕터 우두머리를 차례로(바르칸과 그 판 boss 제외).

## 스스로 정한 것
- 전투기, 폭격기, 공중 요새는 범용 탑 피해 60~75%, 구축함, 항공모함, 수적선은 땅 탑 피해 65~75%.
- night: 어두운 탑 사거리 -30%, 조명 탑이나 성문 곁은 그대로.
- rush: 시간이 다 되면 적이 남아도 다음 웨이브(능력 카드 고를 때는 기다림).
- 예고 광역 공격(사신 낫, 거신 충격, 도깨비 대장 내려치기, 이무기 해일)은 기절이나 봉인으로 끊김.
- 소환 적 금화 40%, 분신 금화 0, 적 상한 110.

## 남은 문제
- 수치 초안. 장산범, 어둑시니는 조명 탑 없으면 강함.
- 용 도감: ui.js에 metaSlain(ev.form) 한 줄 필요(kill 사건 k는 imugi).
- 2~4장 bud 1.0이면 적 수 적음. 무한 모드 우두머리 목록은 1장 3종 그대로.
- ENG2 병사와 en2Block이 둘 다 유닛 체력을 깎으면 두 배로 닳음 → 합친 뒤 확인.
- 시험: en2test 149항목, build, checkmaps, logictest, wavetest, metatest, touchflow 360x640 통과.
