// ===== tools/teststages.js : 엔진 시험용 판 5개(t1 ~ t5)와 임시 적. 게임 빌드에는 들어가지 않는다 =====
// tools/fdload.js가 실제 판 파일(src/stages_ch*.js)을 읽은 뒤 이 파일을 읽어 MAPS 끝에 붙인다. 노드 시험은 fdT('t1') 로 판 번호를 찾아 쓸 것
// (예전 src/stages_ch1.js의 시험 판 c1s01 ~ c1s05가 t1 ~ t5로 옮겨 온 것: t1 외길, t2 두 길, t3 엇갈림과 우두머리, t4 물과 뱃길, t5 항로 2개)
// 임시 적(기존 적 복제): fdBoat 바다 적, fdJet 항로 적
(function () {
  function clone(k, o) { var E = ENEMIES[k], c = {}; for (var a in E) c[a] = E[a]; for (var b in o) c[b] = o[b]; return c; }
  ENEMIES.fdBoat = clone('orc', { name: '시험용 배', art: 'orc', dom: 's', hp: 110, spd: 0.9, gold: 10, weak: ['catapult', 'archer'], desc: '시험용 바다 적. 뱃길을 따라와 부두에 닿으면 생명이 깎인다.' });
  ENEMIES.fdJet = clone('bat', { name: '시험용 전투기', art: 'bat', dom: 'a', fly: 1, lane: 1, hp: 70, spd: 2.2, gold: 10, weak: ['archer'], desc: '시험용 항로 적. 항로를 따라 곧게 날아와 끝에 닿으면 생명이 깎인다.' });
})();
MAPS.push({ id: 't1', ch: 0, no: 1, test: 1, name: '시험판 1 외길', region: '시험장', theme: 'meadow', cols: 10, rows: 17,
  grid: ['a.=..c....', '..=.a....b', '..=.......', '..======..', '.......=..', 'b...d..=a.', '.......=.a', '..======..', '..=.......', 'a.=..a....', '..=......c', '..======..', '.......=..', 'c...b..=..', '....====.a', '....=.....', '#...G....#'],
  paths: [[[2, -2], [2, 3], [7, 3], [7, 7], [2, 7], [2, 11], [7, 11], [7, 14], [4, 14], [4, 16]]],
  waves: 10, gold: 300, hpMul: 1.0, bud: 0.9, pool: ['goblin', 'orc'], intro: { orc: 2 }, boss: null,
  rule: null, ruleName: '', ruleDesc: '', need: ['archer', 'catapult'], reward: { tickets: 1 }, desc: '시험용: 땅 길 하나.' });
MAPS.push({ id: 't2', ch: 0, no: 2, test: 1, name: '시험판 2 두 길', region: '시험장', theme: 'meadow', cols: 10, rows: 17,
  grid: ['a=...c..=.', '.=..a...=b', '.=......=.', '.=....===.', '.=....=...', 'b======.a.', '....=....a', '....=.....', '....=.....', 'a...=a....', '....====.c', '.......=..', '.......=..', 'c...b..=..', '.....===.a', '.....=....', '#....G...#'],
  paths: [[[1, -2], [1, 5], [4, 5], [4, 10], [7, 10], [7, 14], [5, 14], [5, 16]], [[8, -2], [8, 3], [6, 3], [6, 5], [4, 5], [4, 10], [7, 10], [7, 14], [5, 14], [5, 16]]],
  waves: 10, gold: 320, hpMul: 1.0, bud: 0.95, pool: ['goblin', 'orc', 'wolf'], intro: { wolf: 3 }, boss: null,
  rule: null, ruleName: '', ruleDesc: '', need: ['archer', 'catapult'], reward: { tickets: 1 }, desc: '시험용: 두 길이 하나로 모인다.' });
MAPS.push({ id: 't3', ch: 0, no: 3, test: 1, name: '시험판 3 엇갈림', region: '시험장', theme: 'forest', cols: 10, rows: 17,
  grid: ['a..=.c....', '...=a....b', '...=......', '...=......', '...=......', 'b..=d...a.', '...====..a', '......=...', '......=...', '=========.', '......=.=c', '......=.=.', '....===.=.', 'c...=...=.', '....=====a', '....=.....', '#...G....#'],
  paths: [[[3, -2], [3, 6], [6, 6], [6, 12], [4, 12], [4, 16]], [[-2, 9], [8, 9], [8, 14], [4, 14], [4, 16]]],
  waves: 12, gold: 360, hpMul: 1.0, bud: 1.0, pool: ['goblin', 'orc', 'wolf', 'knight', 'bat'], intro: { knight: 4, bat: 3 }, boss: 'grumsh',
  rule: null, ruleName: '', ruleDesc: '', need: ['archer', 'catapult'], reward: { gems: 20 }, desc: '시험용: 두 길이 한가운데서 엇갈린다. 우두머리 출현.' });
MAPS.push({ id: 't4', ch: 0, no: 4, test: 1, name: '시험판 4 물과 뱃길', region: '시험장', theme: 'meadow', cols: 10, rows: 17,
  grid: ['a.=....~~~', '..=.b..~~~', '..=...a~~~', '..=....~~~', '..====.~~~', '.....=.~~~', 'c...a=.~~~', '.....=b~~~', '.....=.~~~', '..====.~~~', '..=....~~~', 'a.=d...~~~', '..=....~~~', '..====.~~~', '.....=.~~~', '....a=.~~~', '#....G~~~~'],
  paths: [[[2, -2], [2, 4], [5, 4], [5, 9], [2, 9], [2, 13], [5, 13], [5, 16]]],
  sea: [[[8, -2], [8, 7], [7, 7], [7, 13], [8, 13], [8, 16], [6, 16]]],
  waves: 10, gold: 360, hpMul: 1.0, bud: 0.95, pool: ['goblin', 'orc', 'wolf', 'fdBoat'], intro: { fdBoat: 1 }, boss: null, focus: 'fdBoat', focusK: 0.35,
  rule: null, ruleName: '', ruleDesc: '', need: ['archer', 'catapult'], reward: { tickets: 1 }, desc: '시험용: 오른쪽 강을 따라 배가 온다. 물 칸에는 수상 탑만 지을 수 있다.' });
MAPS.push({ id: 't5', ch: 0, no: 5, test: 1, name: '시험판 5 항로', region: '시험장', theme: 'meadow', cols: 10, rows: 17,
  grid: ['a....=....', '....a=...b', '.....=....', '..====....', '..=.......', 'b.=.d...a.', '..=......a', '..=.......', '..======..', 'a....a.=..', '.......=.c', '.......=..', '....====..', 'c...=.....', '....=....a', '....=.....', '#...G....#'],
  paths: [[[5, -2], [5, 3], [2, 3], [2, 8], [7, 8], [7, 12], [4, 12], [4, 16]]],
  air: [[-2, 2, 11, 13], [11, 4, -2, 15]],
  waves: 10, gold: 360, hpMul: 1.0, bud: 0.95, pool: ['goblin', 'orc', 'bat', 'fdJet'], intro: { fdJet: 1, bat: 3 }, boss: null, focus: 'fdJet', focusK: 0.35,
  rule: null, ruleName: '', ruleDesc: '', need: ['archer'], reward: { tickets: 1 }, desc: '시험용: 항로 둘을 따라 비행체가 곧게 날아온다. 대공이 되는 탑이 필요하다.' });
// 시험 판 번호 찾기: fdT('t1') → MAPS 안 번호 (없으면 -1). 실제 판은 fdT('c1s06') 식으로도 찾을 수 있다
function fdT(id) { for (var i = 0; i < MAPS.length; i++) if (MAPS[i].id === id) return i; return -1; }
