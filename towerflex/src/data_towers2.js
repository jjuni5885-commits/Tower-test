// ===== data_towers2.js : v2.0 새 탑 14종, 관리자 탑 2종, 합체 탑 8종, 소환 등급, 새 능력 카드 (ENG2) =====
// 공격 로직은 logic_towers2.js (TW_ACT[kind]). 수치 칸 설명은 docs/REPORT_eng2.md
// 공통 칸: site 'land'|'water', hit 맞히는 영역 글자 모음(갈래 tiers에 hit이 있으면 그 갈래부터 바뀜), br[i].el = 그 갈래의 계열
// 배수 칸: airX 하늘, seaX 바다, bossX 우두머리, armX 갑옷 0.4 이상, spiritX 귀신과 요괴, mechX 기계, swat 작은 적, soft 갑옷에 약함(0~1)
// 덤 효과 칸: slow/slowT, stun, burn/burnT, shred/shredT, shredAdd/shredMax(쌓임), seal(능력 봉인 초), sealBreak, mark/markT, knock, exec(체력 비율 아래 처형)
// 끝이 Dmg, Dps인 칸(bigDmg, aaDmg, bombDmg, flameDps...)은 연구, 종탑, 탑 별 배수를 함께 받는다
TOWERS.flak = { name: '대공포', short: '대공', kind: 'flak', dmgType: 'expl', air: 1, site: 'land', hit: 'a', col: '#7d8fa8',
  desc: '하늘만 노리는 빠른 연사포. 작은 폭발로 떼를 쓸어 낸다.',
  lv: [{ cost: 100, dmg: 11, rate: 3.0, range: 3.0, splash: 0.45 }, { cost: 90, dmg: 15, rate: 3.4, range: 3.2, splash: 0.5 }, { cost: 140, dmg: 21, rate: 3.8, range: 3.4, splash: 0.55 }],
  br: [{ name: '팔랑크스', ult: '철의 장막', desc: '초연사. 미사일과 작은 비행체를 요격한다.', tiers: [
      { cost: 260, dmg: 15, rate: 9, range: 3.6, splash: 0.3, swat: 1.8 },
      { cost: 380, dmg: 21, rate: 11, range: 3.9, splash: 0.3, swat: 2 },
      { cost: 600, dmg: 30, rate: 14, range: 4.5, splash: 0.35, swat: 2.2, curtain: 0.35 }] },
    { name: '고사포 진지', ult: '하늘 분쇄기', desc: '큰 폭발로 하늘의 적을 느리게 한다.', tiers: [
      { cost: 260, dmg: 75, rate: 1.7, range: 3.8, splash: 1.1, slow: 0.3, slowT: 1.5, big: 0.6 },
      { cost: 380, dmg: 115, rate: 1.9, range: 4.1, splash: 1.3, slow: 0.35, slowT: 1.8, big: 0.8 },
      { cost: 600, dmg: 140, rate: 2.1, range: 4.6, splash: 1.6, slow: 0.45, slowT: 2, big: 1, cluster: 4, shred: 0.3, shredT: 4 }] }] };
TOWERS.sam = { name: '유도탄 포대', short: '유도탄', kind: 'missile', dmgType: 'expl', air: 1, site: 'land', hit: 'a', col: '#5f8fd0',
  desc: '하늘의 적을 끝까지 쫓는 미사일. 한 발이 강하다.',
  lv: [{ cost: 160, dmg: 100, rate: 0.4, range: 4.0, splash: 0.5 }, { cost: 140, dmg: 150, rate: 0.42, range: 4.3, splash: 0.55 }, { cost: 210, dmg: 215, rate: 0.46, range: 4.6, splash: 0.6 }],
  br: [{ name: '장거리 요격탄', ult: '스카이 랜서', desc: '아주 먼 곳의 큰 비행체를 잡는다.', tiers: [
      { cost: 380, dmg: 560, rate: 0.42, range: 6.0, splash: 0.6, bossX: 1.4, big: 0.6 },
      { cost: 560, dmg: 950, rate: 0.45, range: 6.8, splash: 0.7, bossX: 1.6, big: 0.8 },
      { cost: 900, dmg: 1750, rate: 0.5, range: 8.5, splash: 0.8, bossX: 2, big: 1, exec: 0.15 }] },
    { name: '다탄두 미사일', ult: '미사일 폭풍', desc: '여러 표적을 한꺼번에, 땅의 적도 때린다.', tiers: [
      { cost: 380, dmg: 150, rate: 0.6, range: 4.8, splash: 0.6, multi: 3, hit: 'gas' },
      { cost: 560, dmg: 200, rate: 0.65, range: 5.0, splash: 0.65, multi: 4, hit: 'gas' },
      { cost: 900, dmg: 270, rate: 0.72, range: 5.6, splash: 0.75, multi: 6, hit: 'gas', stun: 0.3 }] }] };
TOWERS.gatling = { name: '기관포탑', short: '기관포', kind: 'gatling', dmgType: 'phys', air: 1, site: 'land', hit: 'ga', col: '#c7a04a',
  desc: '땅과 하늘에 아주 빠르게 쏜다. 갑옷에는 약하다.',
  lv: [{ cost: 90, dmg: 4, rate: 6, range: 2.4, soft: 0.4 }, { cost: 80, dmg: 5.5, rate: 7, range: 2.6 }, { cost: 120, dmg: 7.5, rate: 8, range: 2.8 }],
  br: [{ name: '철갑 개틀링', ult: '철갑 분쇄기', desc: '갑옷을 깎는 철갑탄.', tiers: [
      { cost: 230, dmg: 15, rate: 9, range: 3.0, soft: 0, ap: 0.5, shredAdd: 0.03, shredMax: 0.3 },
      { cost: 340, dmg: 21, rate: 10, range: 3.2, soft: 0, ap: 0.7, shredAdd: 0.04, shredMax: 0.4 },
      { cost: 540, dmg: 28, rate: 12, range: 3.5, soft: 0, ap: 1, shredAdd: 0.05, shredMax: 0.6, heN: 10, heX: 3, heR: 0.7 }] },
    { name: '쌍열 벌컨', ult: '불꽃 회오리', desc: '쏠수록 빨라지는 쌍열포.', tiers: [
      { cost: 230, dmg: 9, rate: 9, range: 3.0, ramp: 2.0, rampT: 2.5 },
      { cost: 340, dmg: 12, rate: 10, range: 3.2, ramp: 2.4, rampT: 2.5 },
      { cost: 540, dmg: 16, rate: 11, range: 3.5, soft: 0.3, ramp: 3.0, rampT: 2.2, burn: 30, burnT: 2, dual: 1 }] }] };
TOWERS.sniper = { name: '저격탑', short: '저격', kind: 'sniper', dmgType: 'phys', air: 1, site: 'land', hit: 'gas', col: '#6e8f6a',
  desc: '아주 멀리서 강한 한 발. 숨은 적을 본다.',
  lv: [{ cost: 130, dmg: 70, rate: 0.3, range: 5.0, detect: 1, ap: 0.3 }, { cost: 110, dmg: 110, rate: 0.32, range: 5.5 }, { cost: 170, dmg: 160, rate: 0.35, range: 6.0 }],
  br: [{ name: '대물 저격총', ult: '보스 사냥꾼', desc: '우두머리와 갑옷에 큰 피해, 기절.', tiers: [
      { cost: 300, dmg: 540, rate: 0.3, range: 6.5, ap: 0.8, bossX: 1.5, armX: 1.3, stun: 0.4 },
      { cost: 450, dmg: 920, rate: 0.32, range: 7, ap: 1, bossX: 1.75, armX: 1.4, stun: 0.6 },
      { cost: 720, dmg: 1700, rate: 0.36, range: 8.5, ap: 1, bossX: 2, armX: 1.5, stun: 0.8, pctBoss: 0.03, pctCap: 4000 }] },
    { name: '관측 저격조', ult: '천리 표적수', desc: '표식을 남겨 그 적이 받는 피해를 늘린다.', tiers: [
      { cost: 300, dmg: 230, rate: 0.7, range: 6.5, mark: 0.2, markT: 4 },
      { cost: 450, dmg: 340, rate: 0.85, range: 7, mark: 0.3, markT: 5 },
      { cost: 720, dmg: 400, rate: 0.9, range: 30, mark: 0.4, markT: 6, markN: 3, crit: 0.2, critX: 2.5 }] }] };
TOWERS.rocket = { name: '다연장 로켓', short: '로켓', kind: 'salvo', dmgType: 'expl', air: 0, site: 'land', hit: 'gs', col: '#b5633f',
  desc: '로켓 여러 발을 한꺼번에 쏟는다. 재장전이 길다.',
  lv: [{ cost: 150, dmg: 26, rate: 0.22, range: 3.6, splash: 0.6, n: 4, spread: 0.5 }, { cost: 130, dmg: 34, rate: 0.23, range: 3.8, n: 5 }, { cost: 190, dmg: 46, rate: 0.24, range: 4.0, splash: 0.65, n: 6 }],
  br: [{ name: '집속 로켓', ult: '강철 소나기', desc: '넓은 범위를 뒤덮는다.', tiers: [
      { cost: 320, dmg: 62, rate: 0.25, range: 4.3, splash: 0.7, n: 8, spread: 0.8, cluster: 3 },
      { cost: 480, dmg: 88, rate: 0.26, range: 4.6, splash: 0.8, n: 10, spread: 0.9, cluster: 3 },
      { cost: 760, dmg: 135, rate: 0.29, range: 5.2, splash: 0.9, n: 14, spread: 1.2, cluster: 4, stun: 0.3 }] },
    { name: '소이 로켓', ult: '불바다', desc: '떨어진 자리에 불이 남는다.', el: 'fire', tiers: [
      { cost: 320, dmg: 58, rate: 0.25, range: 4.3, splash: 0.75, n: 6, spread: 0.7, zoneDps: 26, zoneT: 4, burn: 20, burnT: 2.5 },
      { cost: 480, dmg: 82, rate: 0.26, range: 4.6, splash: 0.85, n: 7, zoneDps: 42, zoneT: 5, burn: 34, burnT: 3 },
      { cost: 760, dmg: 125, rate: 0.29, range: 5.2, splash: 1.0, n: 9, zoneDps: 75, zoneT: 7, zoneR: 1.4, burn: 60, burnT: 3.5 }] }] };
TOWERS.laser = { name: '레이저 탑', short: '레이저', kind: 'beam2', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#e0507a',
  desc: '쏠수록 강해지는 광선.',
  lv: [{ cost: 170, dps0: 10, dps1: 40, ramp: 3, range: 2.9 }, { cost: 150, dps0: 17, dps1: 68, range: 3.0 }, { cost: 220, dps0: 27, dps1: 105, range: 3.2 }],
  br: [{ name: '프리즘 탑', ult: '무지개 분광포', desc: '광선이 여러 갈래로 갈라진다.', tiers: [
      { cost: 360, dps0: 46, dps1: 175, range: 3.4, split: 2, splitF: 0.6 },
      { cost: 540, dps0: 72, dps1: 270, range: 3.6, split: 3, splitF: 0.65 },
      { cost: 860, dps0: 115, dps1: 430, range: 4.2, split: 5, splitF: 0.8, burn: 40, burnT: 2, slow: 0.25, slowT: 1 }] },
    { name: '집속 광선포', ult: '태양 창', desc: '일직선으로 모두 꿰뚫는다.', tiers: [
      { cost: 360, dps0: 58, dps1: 240, range: 3.6, line: 1, lineW: 0.3 },
      { cost: 540, dps0: 90, dps1: 380, range: 3.8, line: 1, lineW: 0.32 },
      { cost: 860, dps0: 150, dps1: 660, range: 4.4, line: 1, lineLen: 24, lineW: 0.45, burn: 60, burnT: 2 }] }] };
TOWERS.tesla = { name: '테슬라 코일', short: '전격', kind: 'tesla', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#7c6fe0',
  desc: '가까운 적들 사이로 번개가 튄다. 기절.',
  lv: [{ cost: 140, dmg: 22, rate: 0.9, range: 1.9, chain: 3, chainF: 0.8, stun: 0.12 }, { cost: 120, dmg: 32, rate: 0.95, range: 2.0 }, { cost: 180, dmg: 45, rate: 1.0, range: 2.1, chain: 4, stun: 0.18 }],
  br: [{ name: '폭풍 코일', ult: '번개 폭풍', desc: '더 많은 적에게 튄다.', tiers: [
      { cost: 300, dmg: 72, rate: 1.1, range: 2.4, chain: 6, chainF: 0.88, stun: 0.2 },
      { cost: 450, dmg: 104, rate: 1.2, range: 2.6, chain: 8, chainF: 0.9, stun: 0.22 },
      { cost: 720, dmg: 155, rate: 1.4, range: 3.0, chain: 12, chainF: 0.92, stun: 0.25, stormN: 5, stormX: 1.5, stormStun: 0.6 }] },
    { name: 'EMP 발생기', ult: '대정전', desc: '기계를 멈추고 보호막을 깬다.', tiers: [
      { cost: 300, dmg: 62, rate: 0.6, range: 2.4, emp: 1, stun: 0.5, mechX: 2, mechStun: 1.6 },
      { cost: 450, dmg: 92, rate: 0.65, range: 2.6, emp: 1, stun: 0.7, mechX: 2.2, mechStun: 1.8 },
      { cost: 720, dmg: 190, rate: 0.72, range: 3.2, emp: 1, stun: 1.0, mechX: 2.5, mechStun: 2, seal: 3 }] }] };
TOWERS.airbase = { name: '비행장', short: '비행장', kind: 'airbase', dmgType: 'phys', air: 1, site: 'land', hit: 'gas', col: '#4f86a8',
  desc: '전투기를 띄워 주변을 돌며 기총 소사한다.',
  lv: [{ cost: 200, dmg: 14, rate: 6, range: 3.0, planes: 1 }, { cost: 170, dmg: 19, rate: 6.5, range: 3.3 }, { cost: 250, dmg: 20, rate: 7, range: 3.6, planes: 2 }],
  br: [{ name: '폭격 편대', ult: '융단 폭격단', desc: '길 위에 폭탄을 쏟는다.', tiers: [
      { cost: 400, dmg: 17, range: 4.0, planes: 2, bombDmg: 130, bombR: 0.9, bombCd: 1.3 },
      { cost: 600, dmg: 21, range: 4.4, planes: 3, bombDmg: 190, bombR: 1.0, bombCd: 1.15 },
      { cost: 950, dmg: 28, range: 5.0, planes: 4, bombDmg: 110, bombR: 1.1, bombCd: 1.3, bombN: 3, zoneDps: 40, zoneT: 3 }] },
    { name: '요격 편대', ult: '에이스 편대', desc: '하늘의 적을 쫓아가 미사일을 쏜다.', tiers: [
      { cost: 400, dmg: 21, range: 5.0, planes: 2, aamDmg: 160, aamCd: 2.0, airX: 1.5 },
      { cost: 600, dmg: 26, range: 6.0, planes: 3, aamDmg: 220, aamCd: 1.8, airX: 1.6 },
      { cost: 950, dmg: 30, range: 30, planes: 4, aamDmg: 300, aamCd: 1.6, airX: 1.8, aamN: 2 }] }] };
TOWERS.warship = { name: '전함', short: '전함', kind: 'navgun', dmgType: 'expl', air: 0, site: 'water', hit: 'gs', col: '#5a7fa0',
  desc: '물 위에만 짓는다. 아주 먼 사거리의 함포.',
  lv: [{ cost: 180, dmg: 60, rate: 0.45, range: 4.5, splash: 0.7, seaX: 1.6 }, { cost: 150, dmg: 90, rate: 0.47, range: 4.8 }, { cost: 220, dmg: 130, rate: 0.5, range: 5.2, splash: 0.8 }],
  br: [{ name: '미사일 순양함', ult: '신의 방패함', desc: '대공 미사일을 함께 쏜다.', tiers: [
      { cost: 380, dmg: 200, rate: 0.55, range: 5.6, splash: 0.85, hit: 'gas', aaDmg: 260, aaCd: 2.2, aaN: 1 },
      { cost: 560, dmg: 290, rate: 0.6, range: 6.0, splash: 0.9, hit: 'gas', aaDmg: 400, aaCd: 2.0, aaN: 2 },
      { cost: 900, dmg: 460, rate: 0.65, range: 7.0, splash: 1.0, hit: 'gas', aaDmg: 640, aaCd: 1.6, aaN: 3, icpt: 1.2 }] },
    { name: '드레드노트', ult: '거함거포', desc: '큰 포 여러 문 일제 사격.', tiers: [
      { cost: 380, dmg: 210, rate: 0.4, range: 5.8, splash: 1.1, n: 2, big: 0.6 },
      { cost: 560, dmg: 250, rate: 0.4, range: 6.3, splash: 1.25, n: 3, big: 0.8 },
      { cost: 900, dmg: 330, rate: 0.42, range: 8, splash: 1.5, n: 4, big: 1, stun: 0.6, knock: 0.4 }] }] };
TOWERS.turtle = { name: '거북선', short: '거북선', kind: 'broadside', dmgType: 'expl', air: 0, site: 'water', hit: 'gs', col: '#4f8a5a',
  desc: '물 위에만 짓는다. 가까운 적에게 양현 포와 용머리 화염. 튼튼해서 멈춤이 절반만 간다.',
  lv: [{ cost: 170, dmg: 22, rate: 0.8, range: 2.2, splash: 0.35, n: 2, flameDps: 8, flameR: 1.6, cone: 50, burn: 8, burnT: 2, seaX: 1.4, tough: 1 }, { cost: 150, dmg: 31, rate: 0.82, range: 2.3, flameDps: 13, burn: 12 }, { cost: 210, dmg: 40, rate: 0.85, range: 2.4, n: 3, flameDps: 20, flameR: 1.8, burn: 18 }],
  br: [{ name: '화룡 거북선', ult: '불 뿜는 용두선', desc: '용머리 화염이 길고 뜨겁다.', el: 'fire', tiers: [
      { cost: 360, dmg: 60, range: 2.6, flameDps: 85, flameR: 2.6, cone: 56, burn: 40, burnT: 3 },
      { cost: 540, dmg: 85, range: 2.8, flameDps: 130, flameR: 3.0, cone: 60, burn: 70, burnT: 3 },
      { cost: 860, dmg: 125, range: 3.2, flameDps: 230, flameR: 3.6, cone: 66, burn: 120, burnT: 3.5, flameHit: 'gas', flameZone: 1, hit: 'gas' }] },
    { name: '판옥 대장선', ult: '삼도 수군 기함', desc: '포가 늘고 주변 수상 탑을 강하게 한다.', tiers: [
      { cost: 360, dmg: 60, rate: 0.9, range: 2.8, n: 4, flameDps: 34, navAura: 0.15, navR: 2.5 },
      { cost: 540, dmg: 85, rate: 1.0, range: 3.0, n: 5, flameDps: 50, navAura: 0.2, navR: 2.8 },
      { cost: 860, dmg: 125, rate: 1.1, range: 3.4, n: 7, flameDps: 80, navAura: 0.3, navSpd: 0.15, navR: 3.5 }] }] };
TOWERS.singijeon = { name: '신기전 화차', short: '신기전', kind: 'hwacha', dmgType: 'expl', air: 1, site: 'land', hit: 'ga', col: '#c0503a',
  desc: '로켓 화살 다발을 쏟아낸다. 하늘도 맞힌다.',
  lv: [{ cost: 120, dmg: 9, rate: 0.62, range: 3.0, n: 4 }, { cost: 100, dmg: 11.5, rate: 0.65, range: 3.15, n: 5 }, { cost: 150, dmg: 14, rate: 0.68, range: 3.3, n: 7 }],
  br: [{ name: '대신기전', ult: '산화 신기전', desc: '큰 로켓이 터지며 불꽃이 흩어진다.', tiers: [
      { cost: 280, dmg: 16, n: 4, range: 3.8, rate: 0.5, bigDmg: 260, bigR: 1.0, sparks: 4 },
      { cost: 420, dmg: 22, n: 4, range: 4.2, rate: 0.52, bigDmg: 400, bigR: 1.2, sparks: 6 },
      { cost: 680, dmg: 32, n: 6, range: 4.8, rate: 0.56, bigDmg: 680, bigR: 1.5, sparks: 10, zoneDps: 45, zoneT: 4 }] },
    { name: '백발 화차', ult: '천발 화차', desc: '화살 수가 크게 늘어난다.', tiers: [
      { cost: 280, dmg: 15, n: 12, range: 3.6, rate: 0.75 },
      { cost: 420, dmg: 22, n: 16, range: 3.8, rate: 0.8 },
      { cost: 680, dmg: 26, n: 26, range: 4.2, rate: 0.85, megaN: 4 }] }] };
TOWERS.jangseung = { name: '장승', short: '장승', kind: 'totem', dmgType: 'magic', air: 0, site: 'land', hit: 'gs', col: '#a0703a', light: 1,
  desc: '주변 적을 겁줘 느리게 하고 숨은 적과 귀신을 드러낸다. 주변을 밝히는 조명 탑.',
  lv: [{ cost: 110, range: 1.9, fear: 0.2, auraDps: 6, reveal: 1.9 }, { cost: 90, range: 2.1, fear: 0.26, auraDps: 10, reveal: 2.1 }, { cost: 140, range: 2.3, fear: 0.32, auraDps: 15, reveal: 2.3 }],
  br: [{ name: '천하대장군', ult: '벽사 대장군', desc: '주기적으로 주변 적을 기절시킨다.', tiers: [
      { cost: 260, range: 2.5, fear: 0.38, auraDps: 22, reveal: 2.5, pulseCd: 6, pulseDmg: 90, pulseStun: 0.8 },
      { cost: 380, range: 2.7, fear: 0.42, auraDps: 30, reveal: 2.7, pulseCd: 5, pulseDmg: 150, pulseStun: 1.0 },
      { cost: 620, range: 3.1, fear: 0.5, auraDps: 45, reveal: 3.1, pulseCd: 4, pulseDmg: 280, pulseStun: 1.3, seal: 3, pulseKnock: 0.6 }] },
    { name: '지하여장군', ult: '저승길 여장군', desc: '주변 적이 받는 피해가 늘어난다.', tiers: [
      { cost: 260, range: 2.5, fear: 0.36, auraDps: 32, reveal: 2.5, markAura: 0.2 },
      { cost: 380, range: 2.7, fear: 0.4, auraDps: 52, reveal: 2.7, markAura: 0.28 },
      { cost: 620, range: 3.1, fear: 0.45, auraDps: 95, reveal: 3.1, markAura: 0.4, exec: 0.1 }] }] };
TOWERS.barracks = { name: '수호 병영', short: '병영', kind: 'barracks', dmgType: 'phys', air: 0, site: 'land', hit: 'g', col: '#8a6fb0',
  desc: '길 위에 병사 셋을 세워 적을 막고 싸운다.',
  lv: [{ cost: 100, dmg: 7, rate: 1, range: 2.0, soldiers: 3, sHp: 110, respawn: 9 }, { cost: 85, dmg: 11, sHp: 170 }, { cost: 130, dmg: 16, sHp: 250, sArmor: 0.2 }],
  br: [{ name: '철벽 방패대', ult: '불멸의 방패대', desc: '잘 쓰러지지 않는 방패병.', tiers: [
      { cost: 240, dmg: 20, sHp: 620, sArmor: 0.4, block: 2, respawn: 8 },
      { cost: 360, dmg: 28, sHp: 980, sArmor: 0.5, block: 2, respawn: 7 },
      { cost: 580, dmg: 42, sHp: 1700, sArmor: 0.6, block: 3, respawn: 3, thorn: 30 }] },
    { name: '화랑 무사단', ult: '화랑 검성', desc: '빠르고 강한 검사.', tiers: [
      { cost: 240, dmg: 30, rate: 1.6, sHp: 380, sArmor: 0.2, crit: 0.2, critX: 2 },
      { cost: 360, dmg: 44, rate: 1.8, sHp: 560, sArmor: 0.25, crit: 0.25, critX: 2 },
      { cost: 580, dmg: 62, rate: 2.0, sHp: 900, sArmor: 0.3, crit: 0.3, critX: 2.5, soldiers: 4, cleaveN: 3, cleaveR: 0.9 }] }] };
TOWERS.shrine = { name: '서낭당', short: '부적', kind: 'talisman', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#d0a030',
  desc: '부적을 날려 적의 능력을 봉인한다. 귀신과 요괴에 강하다.',
  lv: [{ cost: 130, dmg: 30, rate: 0.8, range: 2.8, seal: 2, spiritX: 1.6 }, { cost: 110, dmg: 45, rate: 0.85, range: 2.95, seal: 2.5 }, { cost: 170, dmg: 62, rate: 0.9, range: 3.1, seal: 3 }],
  br: [{ name: '봉인 부적', ult: '만귀 봉인진', desc: '보호막을 깨고 능력을 오래 막는다.', tiers: [
      { cost: 280, dmg: 110, rate: 1.0, range: 3.4, seal: 4, sealBreak: 1, multi: 2, spiritX: 1.8 },
      { cost: 420, dmg: 160, rate: 1.1, range: 3.6, seal: 5, sealBreak: 1, multi: 2, spiritX: 2 },
      { cost: 680, dmg: 250, rate: 1.2, range: 4.0, seal: 7, sealBreak: 1, multi: 3, spiritX: 2.2, fieldCd: 8, fieldSeal: 4 }] },
    { name: '벽력 부적', ult: '뇌공 강림', desc: '부적이 터지며 벼락이 떨어진다.', el: 'bolt', tiers: [
      { cost: 280, dmg: 150, rate: 0.8, range: 3.4, splash: 0.9, stun: 0.3 },
      { cost: 420, dmg: 230, rate: 0.85, range: 3.6, splash: 1.0, stun: 0.4 },
      { cost: 680, dmg: 340, rate: 0.95, range: 4.0, splash: 1.3, stun: 0.5, thunderN: 4, thunderChain: 6 }] }] };
// ---------- 관리자 전용 (값 0, g.admin일 때만 건설) ----------
TOWERS.omega = { name: '천벌포', short: '천벌', kind: 'orbital', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#ffd23a', admin: 1,
  desc: '관리자 전용. 위성 궤도포가 화면 어디든 큰 광선을 내리꽂는다.',
  lv: [{ cost: 0, dmg: 900, rate: 0.4, range: 30, splash: 1.4, detect: 1 }, { cost: 900, dmg: 1600, rate: 0.45, splash: 1.6 }, { cost: 1400, dmg: 2800, rate: 0.5, splash: 1.9, zoneDps: 120, zoneT: 4 }], br: [] };
TOWERS.dragon = { name: '수호룡 둥지', short: '수호룡', kind: 'dragon', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#e05a3a', admin: 1,
  desc: '관리자 전용. 수호룡이 날아다니며 불을 뿜는다.',
  lv: [{ cost: 0, flameDps: 320, range: 30, burn: 60, burnT: 3, flameR: 2.2, cone: 60, detect: 1 }, { cost: 900, flameDps: 520, burn: 100 }, { cost: 1400, flameDps: 850, burn: 160, flameR: 2.6 }], br: [] };
// ---------- 합체 탑 (fuseTowers로만 생김. 1단계 = 합체 직후, 재료가 6단계면 한 개마다 +1단계. 강화 2번) ----------
TOWERS.fz_skybow = { name: '천상궁', short: '천상궁', kind: 'fz_skybow', dmgType: 'phys', air: 1, site: 'land', hit: 'gas', col: '#f0c860', fusion: 1,
  desc: '합체: 궁수탑 + 노포. 화면을 가로지르는 거대한 관통 화살.',
  lv: [{ cost: 0, dmg: 70, rate: 3, multi: 3, range: 5.2, bigDmg: 1000, bigCd: 2.4, shred: 0.25, shredT: 5, crit: 0.25, critX: 2.5, detect: 1, ap: 0.4 }, { cost: 1000, dmg: 105, multi: 4, range: 5.6, bigDmg: 1600, bigCd: 2.2, shred: 0.3 }, { cost: 1500, dmg: 160, multi: 5, range: 6.0, bigDmg: 2600, bigCd: 2.0, shred: 0.4 }], br: [] };
TOWERS.fz_fortress = { name: '거포 요새', short: '거포', kind: 'fz_fortress', dmgType: 'expl', air: 0, site: 'land', hit: 'gs', col: '#8a6a50', fusion: 1,
  desc: '합체: 대포탑 + 투석기. 넓은 범위를 날려 버리는 거포.',
  lv: [{ cost: 0, dmg: 1300, rate: 0.42, range: 5.0, splash: 2.0, stun: 0.6, knock: 0.4, quakeN: 4, quakeX: 1.6 }, { cost: 1000, dmg: 2100, range: 5.4, splash: 2.2, stun: 0.8 }, { cost: 1500, dmg: 3400, range: 6.0, splash: 2.5, stun: 1.0, knock: 0.6 }], br: [] };
TOWERS.fz_storm = { name: '뇌신탑', short: '뇌신', kind: 'fz_storm', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#8f7cf0', fusion: 1,
  desc: '합체: 마법탑 + 테슬라 코일. 온 전장에 번개 폭풍.',
  lv: [{ cost: 0, dmg: 280, rate: 1.0, n: 5, range: 30, stun: 0.15, bigDmg: 420, bigCd: 8, bigStun: 0.8, detect: 1 }, { cost: 1000, dmg: 420, n: 7, bigDmg: 700, bigCd: 7 }, { cost: 1500, dmg: 650, n: 10, bigDmg: 1150, bigCd: 6, bigStun: 1.0 }], br: [] };
TOWERS.fz_frostfire = { name: '빙염탑', short: '빙염', kind: 'fz_frostfire', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#70c8e8', fusion: 1,
  desc: '합체: 서리탑 + 화염탑. 얼음과 불의 파동을 번갈아 터뜨린다.',
  lv: [{ cost: 0, dmg: 170, fireDmg: 250, rate: 1.1, range: 3.4, slow: 0.55, slowT: 2, freeze: 0.3, freezeT: 1.4, shatter: 0.4, burn: 110, burnT: 3 }, { cost: 1000, dmg: 260, fireDmg: 390, range: 3.7, slow: 0.6, freeze: 0.35, burn: 170 }, { cost: 1500, dmg: 410, fireDmg: 620, range: 4.1, slow: 0.65, freeze: 0.4, freezeT: 1.8, shatter: 0.5, burn: 270 }], br: [] };
TOWERS.fz_aegis = { name: '이지스 방공망', short: '이지스', kind: 'fz_aegis', dmgType: 'expl', air: 1, site: 'land', hit: 'a', col: '#6fa0d8', fusion: 1,
  desc: '합체: 대공포 + 유도탄 포대. 하늘의 모든 것을 떨어뜨린다.',
  lv: [{ cost: 0, dmg: 55, rate: 10, range: 5.0, splash: 0.6, swat: 2, aaDmg: 750, aaCd: 2.0, aaN: 4, aaRange: 30, icpt: 0.6 }, { cost: 1000, dmg: 80, rate: 12, range: 5.5, aaDmg: 1200, aaN: 5 }, { cost: 1500, dmg: 120, rate: 14, range: 6.0, aaDmg: 1900, aaN: 6, aaCd: 1.7 }], br: [] };
TOWERS.fz_arsenal = { name: '강철 비', short: '강철 비', kind: 'fz_arsenal', dmgType: 'phys', air: 1, site: 'land', hit: 'gas', col: '#c08a4a', fusion: 1,
  desc: '합체: 기관포탑 + 다연장 로켓. 총알과 로켓의 폭풍.',
  lv: [{ cost: 0, dmg: 20, rate: 20, range: 3.8, ap: 0.5, rkDmg: 170, rkN: 8, rkCd: 3.6, rkR: 0.85, rkSpread: 0.9 }, { cost: 1000, dmg: 30, rate: 23, range: 4.1, rkDmg: 260, rkN: 10 }, { cost: 1500, dmg: 42, rate: 26, range: 4.5, ap: 0.8, rkDmg: 380, rkN: 12, rkCd: 3.4 }], br: [] };
TOWERS.fz_carrier = { name: '항공모함', short: '항모', kind: 'fz_carrier', dmgType: 'expl', air: 1, site: 'water', hit: 'gas', col: '#5f88a8', fusion: 1,
  desc: '합체: 전함 + 비행장. 물 위에서 전투기 편대를 띄운다.',
  lv: [{ cost: 0, dmg: 24, rate: 7, range: 6.0, planes: 4, bombDmg: 200, bombR: 1.0, bombCd: 1.4, aamDmg: 260, aamCd: 2.2, gunDmg: 380, gunCd: 2.2, gunR: 1.0, airX: 1.4 }, { cost: 1000, dmg: 34, planes: 5, bombDmg: 300, aamDmg: 400, gunDmg: 600, range: 6.5 }, { cost: 1500, dmg: 46, planes: 6, bombDmg: 430, bombR: 1.2, aamDmg: 620, gunDmg: 950, range: 7.5 }], br: [] };
TOWERS.fz_dragonship = { name: '화룡선', short: '화룡선', kind: 'fz_dragonship', dmgType: 'expl', air: 1, site: 'water', hit: 'gas', col: '#d0603a', fusion: 1,
  desc: '합체: 거북선 + 신기전 화차. 불 뿜는 용머리와 로켓 화살.',
  lv: [{ cost: 0, dmg: 130, rate: 0.9, n: 4, range: 3.6, splash: 0.45, flameDps: 240, flameR: 3.4, cone: 64, burn: 90, burnT: 3, flameHit: 'gas', arrowDmg: 36, arrowN: 14, arrowCd: 1.5, seaX: 1.3, tough: 1 }, { cost: 1000, dmg: 190, n: 5, range: 3.9, flameDps: 360, flameR: 3.7, burn: 130, arrowDmg: 52, arrowN: 16 }, { cost: 1500, dmg: 280, n: 6, range: 4.3, flameDps: 540, flameR: 4.1, burn: 190, arrowDmg: 75, arrowN: 20 }], br: [] };
var TW2_ORDER = ["flak", "sam", "gatling", "sniper", "rocket", "laser", "tesla", "airbase", "warship", "turtle", "singijeon", "jangseung", "barracks", "shrine"];
var TW2_ADMIN = ['omega', 'dragon'];
var FUSIONS = [{ to: 'fz_skybow', a: 'archer', b: 'ballista' }, { to: 'fz_fortress', a: 'cannon', b: 'catapult' }, { to: 'fz_storm', a: 'arcane', b: 'tesla' }, { to: 'fz_frostfire', a: 'frost', b: 'flame' },
  { to: 'fz_aegis', a: 'flak', b: 'sam' }, { to: 'fz_arsenal', a: 'gatling', b: 'rocket' }, { to: 'fz_carrier', a: 'warship', b: 'airbase' }, { to: 'fz_dragonship', a: 'turtle', b: 'singijeon' }];
// 전투와 소환에 나오는 탑 24종 (관리자 탑, 합체 탑은 여기 없음)
TW2_ORDER.forEach(function (k) { if (TOWER_ORDER.indexOf(k) < 0) TOWER_ORDER.push(k); });
// 소환 등급 (SPEC 6절). 화면 갈래(gacha.js)가 읽는다
var TW_RARITY = {
  common: ['archer', 'catapult', 'frost', 'ballista', 'flak', 'gatling', 'barracks'],
  rare: ['arcane', 'bell', 'flame', 'alchemy', 'sniper', 'rocket', 'tesla', 'jangseung', 'shrine', 'singijeon'],
  legend: ['cannon', 'mint', 'sam', 'laser', 'airbase', 'warship', 'turtle']
};
var TW_START = ['archer', 'catapult', 'flak'];
// 속성 카드를 내지 않는 탑(공격하지 않거나 유닛, 기운으로 싸움), 성질상 속성
var TW_NOEL = { mint: 1, bell: 1, jangseung: 1, barracks: 1, airbase: 1 };
EL_NATURAL.tesla = 'bolt';

// ---------- 능력 카드: 새 탑마다 2장 ----------
CARD_DEFS.fl_rapid = { towers: ['flak'], name: '탄띠 급탄', desc: '대공포 공격 속도 +20%', max: 3, rare: 0 };
CARD_DEFS.fl_burst = { towers: ['flak'], name: '근접 신관', desc: '대공포 폭발 범위 +30%', max: 2, rare: 0 };
CARD_DEFS.sm_warhead = { towers: ['sam'], name: '대형 탄두', desc: '유도탄 피해 +25%', max: 3, rare: 0 };
CARD_DEFS.sm_twin = { towers: ['sam'], name: '쌍발 발사', desc: '쏠 때마다 미사일을 한 발 더 쏜다(피해 50%)', max: 1, rare: 1 };
CARD_DEFS.gt_ap = { towers: ['gatling'], name: '철갑탄', desc: '기관포가 갑옷을 30% 무시한다', max: 2, rare: 0 };
CARD_DEFS.gt_heat = { towers: ['gatling'], name: '과열 사격', desc: '기관포 공격 속도 +15%', max: 3, rare: 0 };
CARD_DEFS.sn_crit = { towers: ['sniper'], name: '급소 사격', desc: '저격탑 치명타 확률 +15%(피해 2.5배)', max: 2, rare: 0 };
CARD_DEFS.sn_stun = { towers: ['sniper'], name: '충격탄', desc: '저격에 맞은 적이 0.4초 기절한다', max: 2, rare: 1 };
CARD_DEFS.rk_more = { towers: ['rocket'], name: '추가 발사관', desc: '한 번에 쏘는 로켓 +2발', max: 2, rare: 1 };
CARD_DEFS.rk_reload = { towers: ['rocket'], name: '자동 장전', desc: '로켓 재장전 시간 -15%', max: 2, rare: 0 };
CARD_DEFS.ls_focus = { towers: ['laser'], name: '빠른 예열', desc: '광선이 최대 세기에 닿는 시간 -35%', max: 2, rare: 0 };
CARD_DEFS.ls_range = { towers: ['laser'], name: '집광 렌즈', desc: '레이저 사거리 +12%', max: 2, rare: 0 };
CARD_DEFS.ts_chain = { towers: ['tesla'], name: '연쇄 +2', desc: '번개가 적 2명에게 더 튄다', max: 2, rare: 0 };
CARD_DEFS.ts_stun = { towers: ['tesla'], name: '고압 전류', desc: '번개 기절 시간 +0.15초', max: 2, rare: 1 };
CARD_DEFS.ab_plane = { towers: ['airbase'], name: '증원 편대', desc: '전투기 +1대', max: 1, rare: 1 };
CARD_DEFS.ab_gun = { towers: ['airbase'], name: '기총 강화', desc: '전투기 기총 피해 +25%', max: 3, rare: 0 };
CARD_DEFS.ws_range = { towers: ['warship'], name: '사격 통제', desc: '전함 사거리 +12%', max: 2, rare: 0 };
CARD_DEFS.ws_shell = { towers: ['warship'], name: '고폭탄', desc: '함포 폭발 범위 +25%', max: 2, rare: 0 };
CARD_DEFS.tt_flame = { towers: ['turtle'], name: '용머리 유황', desc: '거북선 화염 피해 +40%', max: 2, rare: 0 };
CARD_DEFS.tt_ball = { towers: ['turtle'], name: '포문 추가', desc: '한 번에 쏘는 포환 +1발', max: 1, rare: 1 };
CARD_DEFS.sj_more = { towers: ['singijeon'], name: '화살 다발', desc: '한 번에 쏘는 로켓 화살 +3발', max: 2, rare: 0 };
CARD_DEFS.sj_fire = { towers: ['singijeon'], name: '불화살', desc: '로켓 화살에 맞은 적이 불탄다', max: 1, rare: 1 };
CARD_DEFS.js_fear = { towers: ['jangseung'], name: '부릅뜬 눈', desc: '장승의 공포 느림 +8%p', max: 2, rare: 0 };
CARD_DEFS.js_wide = { towers: ['jangseung'], name: '마을 어귀', desc: '장승 범위 +20%', max: 2, rare: 0 };
CARD_DEFS.bk_hp = { towers: ['barracks'], name: '단단한 갑주', desc: '병사 체력 +35%', max: 3, rare: 0 };
CARD_DEFS.bk_fast = { towers: ['barracks'], name: '예비대', desc: '쓰러진 병사가 40% 빨리 돌아온다', max: 2, rare: 0 };
CARD_DEFS.sh_seal = { towers: ['shrine'], name: '굵은 붓글씨', desc: '봉인 시간 +1초', max: 2, rare: 0 };
CARD_DEFS.sh_multi = { towers: ['shrine'], name: '부적 한 장 더', desc: '부적을 다른 적에게 1장 더 날린다', max: 1, rare: 1 };
// 숨은 조합 (새 탑)
COMBOS.push(
  { id: 'barrage', towers: ['flak'], a: 'fl_rapid', b: 'fl_burst', name: '탄막', desc: '대공포 폭발이 하늘의 적을 20% 느리게 한다' },
  { id: 'stormBelt', towers: ['gatling'], a: 'gt_heat', b: 'el:bolt', name: '전격 탄띠', desc: '기관포 10발마다 번개가 튄다' },
  { id: 'headshot', towers: ['sniper'], a: 'sn_crit', b: 'sn_stun', name: '정밀 저격', desc: '치명타가 터지면 주변 적도 절반의 피해를 받는다' },
  { id: 'napalm', towers: ['rocket'], a: 'rk_more', b: 'el:fire', name: '네이팜', desc: '로켓이 떨어진 자리가 불탄다' },
  { id: 'overload', towers: ['tesla'], a: 'ts_chain', b: 'ts_stun', name: '과부하', desc: '번개의 마지막 표적에서 전기 폭발이 일어난다' },
  { id: 'coldBeam', towers: ['laser'], a: 'ls_focus', b: 'el:ice', name: '냉각 광선', desc: '광선에 닿은 적이 30% 느려진다' },
  { id: 'fireRain', towers: ['singijeon'], a: 'sj_more', b: 'sj_fire', name: '불화살비', desc: '화살이 꽂힌 자리에 작은 불이 남는다' },
  { id: 'sealWard', towers: ['shrine'], a: 'sh_seal', b: 'sh_multi', name: '결계', desc: '봉인된 적이 받는 피해가 15% 늘어난다' },
  { id: 'unyield', towers: ['barracks'], a: 'bk_hp', b: 'bk_fast', name: '불굴', desc: '병사가 쓰러질 때 주변 적이 1초 기절한다' },
  { id: 'fireShot', towers: ['turtle'], a: 'tt_flame', b: 'tt_ball', name: '화포 일제', desc: '포환에 맞은 적이 불탄다' },
  { id: 'spotter', towers: ['warship'], a: 'ws_range', b: 'ws_shell', name: '관측 사격', desc: '함포에 맞은 적이 1.5초 동안 20% 느려진다' }
);
