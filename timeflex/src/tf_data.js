// ===== tf_data.js : 타임플렉스(TIME FLEX) 자료 — 시대(장) 15개, 시대 탑, 시대 적, 시대 고증과 시간 초월 =====
// 타워플렉스 v2.3 엔진 위에 얹는다. 이 파일은 data.js, data_towers2.js, data_enemies2.js 다음, 판 파일(stages_t*.js) 앞에 읽힌다
GAME_TITLE = '타임플렉스';
var TF_SUB = '시간 전쟁';
// 이야기 틀: 시간을 비틀어 각 시대의 무기를 훔쳐 쓰는 '시간 침략자 군단'이 역사를 뒤집으려 한다. 플레이어는 시간의 문을 지키는 수호대장
// 실제 나라, 국기, 지도자, 종교 상징은 쓰지 않는다. 장 이름도 시대 표현으로
CHAPTERS = [
  { id: 1, era: 1, name: '원시의 들판', sub: '얼음이 녹는 땅, 시간의 틈에서 맹수와 부족이 쏟아진다', mood: 'prim', open: { stars: 0 }, gate: { 7: 12 } },
  { id: 2, era: 2, name: '황금 사막의 강', sub: '거대한 강과 피라미드, 잠든 왕의 저주가 깨어났다', mood: 'egypt', open: { stars: 10 }, gate: { 7: 12 } },
  { id: 3, era: 3, name: '대리석 제국', sub: '돌길 위로 방패 군단과 전투 코끼리가 행진한다', mood: 'rome', open: { stars: 10 }, gate: { 7: 12 } },
  { id: 4, era: 4, name: '붉은 강의 결전', sub: '천하를 다투는 대군, 강 위의 불길', mood: 'three', open: { stars: 12 }, gate: { 7: 13 } },
  { id: 5, era: 5, name: '얼음 바다의 약탈자', sub: '피오르와 긴 배, 도끼와 방패벽', mood: 'norse', open: { stars: 12 }, gate: { 7: 13 } },
  { id: 6, era: 6, name: '성벽의 시대', sub: '공성탑과 투석기, 강철 기사들의 성벽 공략', mood: 'castle', open: { stars: 12 }, gate: { 7: 13 } },
  { id: 7, era: 7, name: '대항해의 바다', sub: '갤리온과 해적선, 바다 괴물이 깨어난다', mood: 'sail', open: { stars: 12 }, gate: { 7: 13 } },
  { id: 8, era: 8, name: '조선의 바다와 성', sub: '신기전과 거북선, 바다를 건너온 침략자들', mood: 'joseon', open: { stars: 13 }, gate: { 7: 14 } },
  { id: 9, era: 9, name: '참호의 시대', sub: '1910년대, 철조망과 참호와 비행선', mood: 'trench', open: { stars: 13 }, gate: { 7: 14 } },
  { id: 10, era: 10, name: '철의 해안', sub: '1940년대, 전차와 폭격기와 상륙정', mood: 'steel', open: { stars: 13 }, gate: { 7: 14 } },
  { id: 11, era: 11, name: '얼어붙은 고지', sub: '1950년대, 눈 덮인 산과 강', mood: 'winter', open: { stars: 14 }, gate: { 7: 15 } },
  { id: 12, era: 12, name: '정글 강', sub: '1960년대, 헬기와 땅굴과 늪', mood: 'jungle', open: { stars: 14 }, gate: { 7: 15 } },
  { id: 13, era: 13, name: '모래 폭풍', sub: '사막의 미사일과 첫 드론', mood: 'dune', open: { stars: 14 }, gate: { 7: 15 } },
  { id: 14, era: 14, name: '최첨단 전선', sub: '드론 떼, 레이저, 보이지 않는 적', mood: 'cyber', open: { stars: 15 }, gate: { 7: 16 } },
  { id: 15, era: 15, name: '별의 전쟁', sub: '궤도 포대와 외계 함대, 마지막 시간의 문', mood: 'space', open: { stars: 15 }, gate: { 7: 16 } }
];
// 화면 색 묶음(style_ch.css의 body[data-ch]): 고대~조선 4(종이와 먹), 1910~1990년대 3(강철), 최첨단과 우주 2(어둠)
var TF_SKIN = { prim: 4, egypt: 4, rome: 4, three: 4, norse: 4, castle: 4, sail: 4, joseon: 4, trench: 3, steel: 3, winter: 3, jungle: 3, dune: 3, cyber: 2, space: 2 };
function tfSkin(ch) { var C = null; for (var i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === ch) C = CHAPTERS[i]; return C && TF_SKIN[C.mood] || 4; }
var TF_ERA_NAME = ['', '원시', '고대 이집트', '고대 로마', '삼국', '바이킹', '중세', '대항해', '조선', '1910년대', '1940년대', '1950년대', '1960년대', '1990년대', '최첨단', '우주'];
// 잠금 해제: 갈래 변신(4, 5단계)은 1장 2판, 궁극(6단계)은 1장 5판, 합체는 3장 관문 판
UNLOCKS = { branch: 'c1s02', ult: 'c1s05', fuse: 'c3s07' };   // 판 id는 엔진 형식 그대로 c<장>s<번호>

// ---------- 시대 탑 (원시) ----------
// 기존 탑의 공격 방식(kind)을 빌리고 이름, 수치, 그림은 새로. 그림은 tf_art_tower.js, 탄 모양은 tf_art_tower.js TF_PJ
function tfClone(o) { return JSON.parse(JSON.stringify(o)); }
(function () {
  var sling = tfClone(TOWERS.archer);
  sling.name = '돌팔매 터'; sling.short = '돌팔매'; sling.col = '#b98a52'; sling.era = 1;
  sling.desc = '싸고 빠르게 돌을 날린다. 하늘의 익룡도 맞힌다.';
  sling.lv = [{ cost: 60, dmg: 8, rate: 1.6, range: 2.5 }, { cost: 55, dmg: 12, rate: 1.8, range: 2.7 }, { cost: 95, dmg: 17, rate: 2.0, range: 2.9 }];
  sling.br[0].name = '눈 밝은 투척꾼'; sling.br[0].ult = '천 리 돌팔매'; sling.br[0].desc = '아주 멀리서 무거운 돌 한 발. 치명타가 터지고 숨은 적을 본다.';
  sling.br[1].name = '연속 돌팔매'; sling.br[1].ult = '돌 소나기'; sling.br[1].desc = '투척꾼 여럿이 쉬지 않고 돌을 쏟아붓는다.';
  TOWERS.sling = sling;

  var spear = tfClone(TOWERS.ballista);
  spear.name = '투창 터'; spear.short = '투창'; spear.col = '#9a6a3c'; spear.era = 1;
  spear.desc = '큰 창이 일직선으로 여러 적을 꿰뚫는다. 털코뿔소의 두꺼운 가죽에 강하다.';
  spear.lv = [{ cost: 110, dmg: 40, rate: 0.6, range: 3.3, pierce: 3, ap: 0.3 }, { cost: 100, dmg: 60, rate: 0.62, range: 3.5, pierce: 4, ap: 0.35 }, { cost: 160, dmg: 88, rate: 0.65, range: 3.7, pierce: 5, ap: 0.4 }];
  spear.br[0].name = '매머드 사냥창'; spear.br[0].ult = '거인 사냥 투창'; spear.br[0].desc = '한 발에 줄줄이 꿰뚫고 가죽을 찢는다.';
  spear.br[1].name = '쌍 투창'; spear.br[1].ult = '창 폭풍'; spear.br[1].desc = '창잡이 둘이 번갈아 빠르게 던진다.';
  TOWERS.spear = spear;

  var fire = tfClone(TOWERS.flame);
  fire.name = '모닥불 터'; fire.short = '모닥불'; fire.col = '#ff8a3c'; fire.era = 1;
  fire.desc = '가까운 적을 불길로 태운다. 맹수는 불을 무서워해 화상이 오래 간다.';
  fire.br[0].name = '들불'; fire.br[0].ult = '산불'; fire.br[0].desc = '더 길고 뜨거운 불길을 뿜는다.';
  fire.br[1].name = '불 고리'; fire.br[1].ult = '화산 고리'; fire.br[1].desc = '모닥불 둘레 전체에 불꽃 고리가 터진다.';
  TOWERS.bonfire = fire;

  var totem = tfClone(TOWERS.bell);
  totem.name = '토템 기둥'; totem.short = '토템'; totem.col = '#d9a24a'; totem.era = 1; totem.bellLike = 1;
  totem.desc = '주변 탑을 북돋우고, 몸을 숨긴 사냥꾼을 드러낸다.';
  totem.br[0].name = '전쟁 북'; totem.br[0].ult = '천둥 북'; totem.br[0].desc = '북소리에 주변 탑이 더 빨리 쏜다.';
  totem.br[1].name = '정령 토템'; totem.br[1].ult = '조상신 토템'; totem.br[1].desc = '정령의 빛이 주변 적을 태우고 느리게 한다.';
  TOWERS.totem = totem;
})();
var TF_ERA_TOWERS = { 1: ['sling', 'spear', 'bonfire', 'totem'] };
var TF_START = ['sling', 'spear'];
// 기존 탑의 시대(시대 고증 모드에서 그 장 시대까지의 탑만 씀). 없는 탑은 99(쓰려면 시간 초월)
var TF_ERA = { sling: 1, spear: 1, bonfire: 1, totem: 1,
  archer: 2, catapult: 2, bell: 2, ballista: 3, barracks: 3, flame: 4, arcane: 5, frost: 5, alchemy: 6, cannon: 7, warship: 7, mint: 7,
  singijeon: 8, turtle: 8, jangseung: 8, shrine: 8, gatling: 9, flak: 9, airbase: 10, rocket: 10, sniper: 11, sam: 13, laser: 14, tesla: 14 };
function tfEraOf(k) { var T = TOWERS[k]; if (!T) return 99; if (T.era) return T.era; if (TF_ERA[k]) return TF_ERA[k]; if (T.fusion && typeof fzParts === 'function') { var P = fzParts(k); if (P) return Math.max(tfEraOf(P[0]), tfEraOf(P[1])); } return T.admin ? 99 : 99; }
TOWER_ORDER = ['sling', 'spear', 'bonfire', 'totem'].concat(TOWER_ORDER);
// 종탑과 같은 지원 방식(주변 강화, 드러내기)을 쓰는 탑인지 (logic.js가 'bell' 대신 부름)
function tfBellK(k) { return k === 'bell' || !!(TOWERS[k] && TOWERS[k].bellLike); }

// ---------- 시대 고증과 시간 초월 ----------
// era: 그 장 시대까지의 탑만(자동 편성). 보상 보통, 첫 승리 고증 보너스 보석 +5, 별 3개까지
// time: 가진 모든 탑. 적 체력 쉬움 +30%, 보통 +50%, 어려움 +80%, 별 2개까지, 고증 보너스 없음
var TF_MODES = { era: { name: '시대 고증', desc: '이 시대까지의 탑만 가지고 들어갑니다. 별 3개, 첫 승리 보석 +5' }, time: { name: '시간 초월', desc: '다른 시대 탑도 고를 수 있습니다. 탑 성능은 이 시대에 맞게 바뀝니다(앞선 시대 탑은 약해지고 지난 시대 탑은 강해짐). 별은 2개까지' } };
var TF_TIME_HP = { easy: 1.05, normal: 1.1, hard: 1.15, endless: 1.1 };   // v1.3: 시간 초월은 탑 성능을 시대에 맞추므로 적 체력은 조금만
// v1.3 시간 초월 탑 성능: 그 시대 적의 단단함(장별 평균 적 체력 x 판 중간 웨이브 배율)의 비로 맞춤. (이 판 시대 / 탑 시대)^0.8, 0.3 ~ 3배
var _tfPow = null;
function tfEraPow(e) {
  if (!_tfPow) {
    _tfPow = {}; var acc = {};
    MAPS.forEach(function (M, mi) { if (!/^c\d+s\d+$/.test(M.id || '')) return; var h = 0, n = 0; (M.pool || []).forEach(function (k) { var E = ENEMIES[k]; if (E && !E.boss) { h += E.hp; n++; } }); if (!n) return; var t = (h / n) * hpScale(mi, Math.floor((M.waves || 12) / 2), 'normal'); (acc[M.ch] = acc[M.ch] || []).push(t); });
    for (var c in acc) { var a = acc[c]; _tfPow[c] = a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
  }
  return _tfPow[e] || _tfPow[15] || 1000;
}
function tfEraMul(k, era) {
  var te = tfEraOf(k); if (!(te >= 1 && te <= 15) || !era) return 1;
  return clamp(Math.pow(tfEraPow(era) / tfEraPow(te), 0.8), 0.3, 3);
}

// ---------- 원시 시대 적 ----------
(function () {
  var E = {
    caveman: { name: '시간 부족 전사', hp: 40, spd: 1.15, gold: 5, leak: 1, size: 0.58, desc: '시간의 틈에서 쏟아진 부족 전사. 몽둥이를 들고 떼로 달려온다.' },
    sabertooth: { name: '검치호', hp: 78, spd: 1.85, gold: 9, leak: 1, size: 0.72, desc: '아주 빠르다. 모닥불에 데면 겁먹고 화상이 오래 간다.' },
    ptero: { name: '익룡', hp: 52, spd: 1.45, fly: 1, gold: 8, leak: 1, size: 0.66, desc: '하늘로 곧장 날아온다. 돌팔매나 투창으로 떨어뜨려라. 모닥불 불길은 닿지 않는다.' },
    rhino: { name: '털코뿔소', hp: 250, spd: 0.74, armor: 0.6, gold: 32, leak: 2, size: 0.86, desc: '두꺼운 털가죽이 돌을 60% 막는다. 투창으로 꿰뚫거나 불로 태워라.' },
    hunter: { name: '그림자 사냥꾼', hp: 120, spd: 1.1, stealth: 1, gold: 18, leak: 1, size: 0.64, desc: '털가죽 위장으로 숨어 다닌다. 토템 곁이나 Ⅴ단계 탑, 눈 밝은 투척꾼만 겨눌 수 있다.' },
    cshaman: { name: '동굴 주술사', hp: 150, spd: 0.8, heal: { r: 1.5, pct: 0.1, cd: 3 }, gold: 22, leak: 1, size: 0.66, desc: '뼈 지팡이로 주변 적의 상처를 낫게 한다. 먼저 잡아라.' },
    mammoth: { name: '매머드', hp: 820, spd: 0.5, armor: 0.2, carry: [['caveman', 3]], gold: 70, leak: 3, size: 1.1, desc: '체력이 엄청나다. 쓰러지면 등에 탄 전사 셋이 뛰어내린다.' },
    raft: { name: '통나무 뗏목', dom: 's', hp: 150, spd: 0.85, gold: 14, leak: 2, size: 0.82, desc: '강을 타고 내려온다. 강가에 탑을 세워 맞혀라.' },
    mammothKing: { name: '거대 매머드 왕', boss: 1, hp: 5200, spd: 0.4, armor: 0.3, warcry: { r: 2.4, spd: 0.5, dur: 3, cd: 7 }, gold: 300, leak: 20, size: 1.9, desc: '땅을 울리는 울음으로 주변 적을 빠르게 만든다. 울음이 들리면 기절 기술로 끊어라.' }
  };
  var W = { caveman: ['sling', 'bonfire'], sabertooth: ['bonfire', 'sling'], ptero: ['sling', 'spear'], rhino: ['spear', 'bonfire'], hunter: ['totem', 'sling'], cshaman: ['spear', 'sling'], mammoth: ['spear', 'bonfire'], raft: ['sling', 'spear'], mammothKing: ['spear', 'totem'] };
  for (var k in E) { E[k].ch = 1; E[k].tf = 1; E[k].die = 'poof'; E[k].weak = W[k]; ENEMIES[k] = E[k]; ENEMY_ORDER.push(k); }
  ENEMIES.sabertooth.weakEl = ['fire']; ENEMIES.rhino.weakEl = ['fire'];
})();

// ---------- 시대별 지형 (귀여운 1장 그림 대신 2, 3, 4장의 차분한 그리기(mq, mw)를 바탕으로 색과 소품을 바꿈) ----------
// base: 바탕 테마(mw 계열 hanok, sansa, pogu, bamboo / mq 계열 desert, manor, city, crypt, harbor, airfield). ch: 0 이면 2장 어둠, 3장 경고 줄무늬를 쓰지 않음
function tfTh(base, o) { o.base = base; if (o.ch == null) o.ch = 0; return o; }
var TF_THEMES = {
  // 1 원시
  prim_steppe: tfTh('hanok', { g: ['#8a9a52', '#97a75e', '#a6b46c'], patch: '#b8b47a', grass: ['#5e7036', '#748640', '#90a250', '#c4cc86'], dirt: ['#6a4a2a', '#a8865a', '#b89a6c', '#d2b88a'], road: 'mwTrail', tree: ['#3e5a2e', '#557040', '#6e8a50', '#a8bc80'], trunk: '#5a3e26', rock: '#9a9286', moss: '#7a8a48', flowers: ['#e8dcae', '#d0a050'], water: ['#3a7a8a', '#5a9aa4', '#c8e0dc'], shore: '#b8a878', sea: ['#2a6a7a', '#3a8a96', '#9ccac4'], light: '#ffe6b0', lightA: 0.14, shade: '#4a3a50', amb: 'mwFly', ambN: 10, props: ['mwPine', 'mwSeaRock', 'mwCairn', 'mwPine', 'mwGoeseok', 'mwLeafPile'], a: 'mwCairn', b: 'mwSeaRock', c: 'mwPine', C: 'mwGoeseok', rk: 'h', ui: ['#a6b46c', '#b8c27e', '#cad294'], key: '#5a3e26' }),
  prim_canyon: tfTh('hanok', { g: ['#b07850', '#bc865c', '#c8966a'], patch: '#d4a878', grass: ['#7a5a36', '#8e6a40', '#a88050', '#d8b888'], dirt: ['#5a3a22', '#94643c', '#a6764a', '#c8986a'], road: 'mwTrail', tree: ['#5a5a2e', '#707040', '#8a8a50', '#b8b480'], trunk: '#5a3a22', rock: '#a8846a', moss: '#a08050', flowers: ['#f2d8a0'], water: ['#3a7a8a', '#5a9aa4', '#c8e0dc'], shore: '#c8a070', sea: ['#2a6a7a', '#3a8a96', '#9ccac4'], light: '#ffd8a0', lightA: 0.16, shade: '#5a3048', amb: 'mwFly', ambN: 6, props: ['mwSeaRock', 'mwGoeseok', 'mwCairn', 'mwSeaRock'], a: 'mwCairn', b: 'mwSeaRock', c: 'mwPine', C: 'mwGoeseok', rk: 'h' }),
  prim_forest: tfTh('hanok', { g: ['#3e6a3a', '#487844', '#548650'], patch: '#6a9058', grass: ['#2a5028', '#386234', '#4e7a44', '#86a86a'], dirt: ['#4a3420', '#7a5a38', '#8a6a46', '#a8885e'], road: 'mwTrail', tree: ['#1e4a2a', '#2e6038', '#447a48', '#7ea870'], trunk: '#4a3020', rock: '#8a8a7a', moss: '#5a8a48', flowers: ['#e8dcae'], water: ['#2a6a6a', '#3a8a84', '#a8d8c8'], shore: '#8a8a5a', sea: ['#1a5a5a', '#2a7a74', '#88c8b8'], light: '#e8f0c0', lightA: 0.1, shade: '#203040', amb: 'mwMist', ambN: 6, props: ['mwBigTree', 'mwPine', 'mwPine', 'mwLeafPile', 'mwSeaRock', 'mwPine'], a: 'mwLeafPile', b: 'mwSeaRock', c: 'mwPine', C: 'mwBigTree', rk: 'h' }),
  prim_ice: tfTh('hanok', { g: ['#dfe6ee', '#e8eef4', '#f2f6fa'], patch: '#cfdae6', grass: ['#9ab0c4', '#b0c4d4', '#c8d8e4', '#ffffff'], dirt: ['#7a8aa0', '#b8c6d4', '#c8d4e0', '#e4ecf4'], road: 'mwTrail', tree: ['#3e5a5a', '#4e6e6a', '#6e8a84', '#c8dcd8'], trunk: '#4a3a30', rock: '#9aa4b0', moss: '#c8d4dc', flowers: ['#ffffff'], water: ['#5a8aaa', '#8ab4cc', '#e4f2f8'], shore: '#d8e2ec', sea: ['#4a7a9a', '#6a9ab8', '#c4e0ee'], light: '#ffffff', lightA: 0.18, shade: '#4a5a7a', amb: 'mwSnow', ambN: 30, props: ['mwPine', 'mwSeaRock', 'mwPine', 'mwCairn', 'mwPine'], a: 'mwCairn', b: 'mwSeaRock', c: 'mwPine', C: 'mwGoeseok', rk: 'h' }),
  prim_lava: tfTh('desert', { gnd: 'sand', road: 'packed', g: ['#4a3a36', '#56443e', '#625048'], patch: '#6a4a3a', grass: ['#3a2a26', '#4a3630', '#5e463a', '#8a6a52'], dirt: ['#2a1e1a', '#5a3a2a', '#6a4632', '#8a5e44'], tree: ['#3a3a2a', '#4a4a36', '#5e5e46', '#8a8a6a'], trunk: '#2a1e1a', rock: '#5a4e4a', moss: '#6a4a3a', flowers: ['#ff8a3a'], water: ['#c8401a', '#ff7a2a', '#ffd070'], shore: '#3a2a26', light: '#ffb070', lightA: 0.18, shade: '#2a1020', veil: '#3a1a10', veilA: 0.22, rim: '#ffd0a0', amb: 'sandwind', props: ['qrockD', 'mwGoeseok', 'qdead', 'qrockD', 'mwSeaRock'], a: 'qrockD', b: 'mwSeaRock', c: 'qdead', C: 'mwGoeseok', d: 'qcrate', e: 'qrockD', blk: ['qrockD', 'mwSeaRock', 'qdead'] }),
  // 2 이집트
  eg_dune: tfTh('desert', { gnd: 'sand', road: 'packed', g: ['#d8b878', '#e2c486', '#ead094'], patch: '#f0dca8', grass: ['#a08a50', '#b49c5e', '#c8b070', '#f0e0b0'], dirt: ['#7a5a32', '#b8925a', '#c8a26a', '#e0c08a'], tree: ['#4a6a34', '#5e8240', '#78a050', '#b8d088'], trunk: '#7a5a38', rock: '#c8a878', moss: '#c8b070', flowers: ['#3a8aa8'], water: ['#2a8a9a', '#48aab0', '#c8f0e8'], shore: '#c8b07a', light: '#fff0c0', lightA: 0.18, shade: '#6a4a3a', veil: '#5a3a1a', veilA: 0.1, rim: '#fff4d8', amb: 'sandwind', props: ['qcol', 'mwJars', 'qrockD', 'mwUrn', 'qcolB', 'mwJar'], a: 'mwJars', b: 'qcolB', c: 'qcol', C: 'qsarc', d: 'qcrate', e: 'mwUrn', blk: ['qrockD', 'qcolB', 'mwJars'] }),
  eg_nile: tfTh('pogu', { g: ['#b8b070', '#c4bc7c', '#d0c88a'], patch: '#a8c070', grass: ['#5e8a3a', '#74a046', '#90b858', '#c8e090'], dirt: ['#7a5a32', '#c09a62', '#d0aa72', '#e8c894'], road: 'mwDirt', tree: ['#3e7a3a', '#529048', '#6eaa5a', '#aad890'], trunk: '#7a5a38', rock: '#c8a878', moss: '#90b858', water: ['#2a8aa0', '#4aaab8', '#c8f0f0'], shore: '#d8c890', sea: ['#1a7a90', '#2a9aaa', '#9adcd8'], light: '#fff0c0', lightA: 0.18, shade: '#5a4a5a', amb: 'mwGull', ambN: 4, props: ['mwJars', 'mwBasket', 'qcol', 'mwBoatL', 'mwJar', 'mwShoots'], wprops: ['mwBoat', 'mwSeaRock'], a: 'mwJars', b: 'mwBasket', c: 'qcol', C: 'qsarc', rk: 's' }),
  // 3 로마
  ro_road: tfTh('hanok', { g: ['#9aae6a', '#a8ba78', '#b6c688'], patch: '#c8c89a', grass: ['#5e8040', '#70944c', '#8aaa5e', '#c8dc98'], dirt: ['#8a8070', '#d8d0c0', '#e4dccc', '#f2ece0'], road: 'mwPave', tree: ['#2e5a3a', '#3e6e46', '#5a8a58', '#9cc090'], trunk: '#5a4030', rock: '#d0ccc4', moss: '#8aaa5e', water: ['#3a8ab0', '#5aa8c8', '#d0f0f8'], shore: '#d8d0b8', sea: ['#2a7aa8', '#3a98c0', '#a8dcec'], light: '#fff6d8', lightA: 0.16, shade: '#5a5070', amb: 'mwFly', ambN: 8, props: ['qcol', 'qstatue', 'mwPine', 'qurn', 'qcolB', 'mwPine', 'qhedge'], a: 'qurn', b: 'qcolB', c: 'mwPine', C: 'qfount', rk: 'h' }),
  ro_arena: tfTh('manor', { gnd: 'flag', road: 'cobble', g: ['#c8b898', '#d2c4a6', '#dccfb4'], patch: '#bca888', grass: ['#7a8a4a', '#8a9a58', '#a2b06c', '#d0d8a0'], dirt: ['#6a5a4a', '#a89880', '#b8a890', '#d4c6b0'], tree: ['#2e5a3a', '#3e6e46', '#5a8a58', '#9cc090'], trunk: '#5a4030', rock: '#d0c8bc', moss: '#a2b06c', flowers: ['#c8483a'], water: ['#3a8ab0', '#5aa8c8', '#d0f0f8'], shore: '#d8d0b8', light: '#fff6d8', lightA: 0.18, shade: '#6a5048', veil: '#3a2a20', veilA: 0.08, rim: '#fff4e0', amb: 'leaves2', props: ['qcol', 'qstatue', 'qurn', 'qcolB', 'qtorch', 'qcol'], a: 'qurn', b: 'qcolB', c: 'qstatue', C: 'qfount', d: 'qchest', e: 'qurn', blk: ['qcol', 'qstatue', 'qcolB'] }),
  // 4 삼국
  tk_bamboo: tfTh('bamboo', { road: 'mwDirt', ch: 0 }),
  tk_river: tfTh('hanok', { g: ['#9ab468', '#a8c076', '#b8cc86'], road: 'mwDirt', props: ['mwPine', 'mwJars', 'mwHay', 'mwSeaRock', 'mwBamboo', 'mwWall'], a: 'mwJars', b: 'mwHay', c: 'mwBamboo', C: 'mwSeaRock', amb: 'mwFly' }),
  // 5 바이킹 피오르
  nr_fjord: tfTh('pogu', { g: ['#c8d4d8', '#d4dee2', '#e2eaee'], patch: '#b8c8cc', grass: ['#6a7e7a', '#80948e', '#9aaca6', '#eef4f4'], dirt: ['#4a4a46', '#8a8e88', '#9ca098', '#c4c8c0'], road: 'mwTrail', tree: ['#1e3a36', '#2a4a44', '#3e6058', '#a8c4c0'], trunk: '#3a2e26', rock: '#7a8288', moss: '#6a807a', water: ['#2a4a5a', '#3e6272', '#b8d4dc'], sea: ['#183846', '#244e5e', '#8ab4c0'], light: '#e8f4ff', lightA: 0.12, shade: '#24344a', amb: 'mwSnow', ambN: 34, props: ['mwPine', 'mwSeaRock', 'mwBoatL', 'mwPine', 'mwNet', 'mwCairn', 'mwHay'], wprops: ['mwSeaRock', 'mwSeaRock', 'mwBoat'], a: 'mwNet', b: 'mwCairn', c: 'mwHay', C: 'mwIslet' }),
  nr_village: tfTh('hanok', { g: ['#a8b498', '#b4c0a4', '#c2ccb2'], patch: '#d8e0d0', grass: ['#5a6e4e', '#6e8260', '#8a9c78', '#e4eadc'], dirt: ['#4a3e32', '#8a7a64', '#9a8a72', '#c0b49c'], road: 'mwTrail', tree: ['#1e3a32', '#2a4a40', '#3e6054', '#a8c0b4'], trunk: '#3a2e26', rock: '#8a8e90', moss: '#6a7e6a', light: '#eef6ff', lightA: 0.12, shade: '#2a3a52', amb: 'mwSnow', ambN: 26, props: ['mwPine', 'mwHay', 'mwCairn', 'mwWall', 'mwPine', 'mwBoulder', 'mwPine'], a: 'mwHay', b: 'mwCairn', c: 'mwPine', C: 'mwBoulder' }),
  // 6 중세 성벽
  ca_keep: tfTh('manor', { gnd: 'flag', road: 'cobble', g: ['#7a8a6a', '#869676', '#92a282'], patch: '#9aa08a', grass: ['#4a5a3a', '#5a6a46', '#6e8058', '#a8b490'], dirt: ['#3a3430', '#6a625a', '#7a7268', '#9a9286'], tree: ['#2a4a32', '#385c3e', '#4e7450', '#88a884'], trunk: '#3a2a20', rock: '#8a8680', moss: '#6e8058', flowers: ['#c8b8e8'], water: ['#3a5a7a', '#5a7a98', '#b8d0e0'], shore: '#7a7a6a', light: '#e8e8f0', lightA: 0.12, shade: '#2a2a40', veil: '#1a1a2a', veilA: 0.14, rim: '#e0e4f0', amb: 'leaves2', props: ['qhedge', 'qtorch', 'qfence', 'qdead', 'qhay', 'qlamp'], a: 'qhay', b: 'qfence', c: 'qtorch', C: 'qstatue', d: 'qchest', e: 'qhay', blk: ['qtorch', 'qhedge', 'qfence'] }),
  ca_field: tfTh('desert', { gnd: 'wild', road: 'mud', g: ['#7a8a50', '#869658', '#92a264'], patch: '#a0a070', grass: ['#4a5a30', '#5a6a3a', '#6e8048', '#a8b480'], dirt: ['#3a2e22', '#6a5438', '#7a6244', '#9a8060'], tree: ['#2a4a32', '#385c3e', '#4e7450', '#88a884'], trunk: '#3a2a20', rock: '#8a8478', moss: '#6e8048', flowers: ['#e8d070'], water: ['#3a5a7a', '#5a7a98', '#b8d0e0'], shore: '#7a7a5a', light: '#f0e8d0', lightA: 0.12, shade: '#3a3040', veil: '#2a2018', veilA: 0.12, rim: '#f0e8d8', amb: 'mist', props: ['qhay', 'qfence', 'qdead', 'qcrate', 'qhay', 'mwPine'], a: 'qhay', b: 'qfence', c: 'qdead', C: 'mwBigTree', d: 'qcrate', e: 'qhay', blk: ['qhay', 'qfence', 'qdead'] }),
  // 7 대항해
  sa_port: tfTh('pogu', { props: ['qcrate', 'mwNet', 'qdrum', 'mwBoatL', 'qbollard', 'mwBasket', 'mwPine'], a: 'qdrum', b: 'mwNet', c: 'qcrate', C: 'mwIslet' }),
  sa_isle: tfTh('pogu', { g: ['#e8d8a8', '#f0e2b8', '#f6ecc8'], water: ['#2ab4c4', '#5ad0d8', '#d8fcf8'], sea: ['#0a88a8', '#2aaac4', '#9aeaee'], props: ['mwPine', 'mwSeaRock', 'qcrate', 'mwBoatL', 'mwPine'], a: 'qcrate', b: 'mwSeaRock', c: 'mwPine', C: 'mwIslet' }),
  // 9 1910년대 참호
  tr_mud: tfTh('desert', { gnd: 'wild', road: 'mud', g: ['#6a604a', '#746a52', '#80765c'], patch: '#8a7e60', grass: ['#4a4430', '#5a5238', '#6e6448', '#9a9070'], dirt: ['#2a2218', '#4e4230', '#5e5038', '#7a6a50'], tree: ['#3a3a2a', '#4a4a36', '#5a5a44', '#8a8a6a'], trunk: '#2a2218', rock: '#7a7468', moss: '#6e6448', flowers: ['#c8302a'], water: ['#4a5a50', '#6a7a68', '#b0b8a0'], shore: '#5a5440', light: '#e0dcc8', lightA: 0.1, shade: '#2a2a30', veil: '#2a2620', veilA: 0.2, rim: '#e0dcd0', amb: 'mist', props: ['qwire', 'qsandbag', 'qhedgehog', 'qdead', 'qcrate', 'qdrum'], a: 'qdrum', b: 'qwire', c: 'qsandbag', C: 'qdead', d: 'qcrate', e: 'qsandbag', blk: ['qhedgehog', 'qsandbag', 'qdead'] }),
  // 10 1940년대 해안
  st_beach: tfTh('desert', { gnd: 'sand', road: 'packed', g: ['#d6c69a', '#ded0a6', '#e6dab4'], patch: '#c8b88c', grass: ['#8a9a5a', '#9aaa66', '#b0bc7a', '#dce2b0'], dirt: ['#6a5a40', '#a8946c', '#b8a47a', '#d4c49c'], water: ['#3a7a9a', '#5a9ab4', '#d0eef4'], shore: '#e0d0a0', light: '#fff4d8', lightA: 0.14, props: ['qhedgehog', 'qsandbag', 'qwire', 'qcrate', 'qdrum', 'qhedgehog'], a: 'qdrum', b: 'qwire', c: 'qsandbag', C: 'qradar', blk: ['qhedgehog', 'qsandbag', 'qwire'] }),
  st_port: tfTh('harbor', {}),
  // 11 1950년대 겨울 고지
  wi_ridge: tfTh('hanok', { g: ['#e2e8ee', '#eaeff4', '#f4f7fa'], patch: '#d0d8e0', grass: ['#8a9aaa', '#a4b2c0', '#c0ccd8', '#ffffff'], dirt: ['#6a7480', '#b0bac4', '#c4ccd6', '#e2e8ee'], road: 'mwTrail', tree: ['#2e4a4a', '#3e5e5a', '#5e7a74', '#c0d4d0'], trunk: '#3a2e28', rock: '#8e98a4', moss: '#c0ccd8', flowers: ['#ffffff'], water: ['#4a7a9a', '#7aa4bc', '#e0f0f8'], shore: '#d4dce4', sea: ['#3a6a8a', '#5a8aa8', '#b8d8e8'], light: '#ffffff', lightA: 0.16, shade: '#3a4a6a', amb: 'mwSnow', ambN: 40, props: ['mwPine', 'qsandbag', 'mwPine', 'qwire', 'mwSeaRock', 'mwPine'], a: 'qsandbag', b: 'mwSeaRock', c: 'mwPine', C: 'mwGoeseok', rk: 'h' }),
  // 12 1960년대 정글
  ju_jungle: tfTh('bamboo', { g: ['#2e6a3a', '#387844', '#44864e'], grass: ['#1e5028', '#2a6034', '#3e7a44', '#7aa868'], dirt: ['#4a3420', '#7a5a38', '#8a6a46', '#a8885e'], road: 'mwDirt', water: ['#4a6a4a', '#5a7e5a', '#a8c0a0'], sea: ['#3a5a40', '#4a6e4e', '#90b088'], props: ['mwBigTree', 'mwBamboo', 'mwShoots', 'mwBamboo', 'qcrate', 'mwLeafPile'], a: 'mwShoots', b: 'qcrate', c: 'mwBamboo', C: 'mwBigTree', amb: 'mwMist', ambN: 8, ch: 0 }),
  // 13 1990년대 사막
  du_sand: tfTh('desert', {}),
  // 14 최첨단
  cy_city: tfTh('city', { g: ['#1e2436', '#242c40', '#2a334a'], patch: '#303a54', grass: ['#1a2030', '#222a3c', '#2c364c', '#4a5878'], dirt: ['#0e1220', '#1e2436', '#262e44', '#3a4664'], light: '#7ff4ff', lightA: 0.12, shade: '#100a30', veil: '#05061a', veilA: 0.28, rim: '#7ff4ff', amb: 'rain', props: ['qcont1', 'qslamp', 'qsignal', 'qradarS', 'qgen', 'qblock'], a: 'qgen', b: 'qblock', c: 'qslamp', C: 'qradarS', blk: ['qblock', 'qsignal', 'qgen'] }),
  // 15 우주
  sp_moon: tfTh('crypt', { gnd: 'flag', road: 'flag', wall: 0, g: ['#4a4658', '#524e62', '#5a566c'], patch: '#625e76', grass: ['#2e2a3a', '#3a3648', '#4a465a', '#7a7690'], dirt: ['#1a1824', '#3a3648', '#46425a', '#625e78'], tree: ['#3a3a5a', '#4a4a6e', '#6060a0', '#a0a0e0'], trunk: '#2a2a3a', rock: '#6a6680', moss: '#5a5672', flowers: ['#a07bff'], water: ['#3a2a7a', '#6a4ab8', '#d0c0ff'], shore: '#4a4660', light: '#c8b8ff', lightA: 0.14, shade: '#0a0620', veil: '#05031a', veilA: 0.3, rim: '#c8b8ff', amb: 'cryptdust', props: ['qradarS', 'qantenna', 'qgen', 'qcolB', 'qrockD', 'qradarS'], a: 'qgen', b: 'qrockD', c: 'qantenna', C: 'qradar', d: 'qcrate', e: 'qgen', blk: ['qrockD', 'qcolB', 'qantenna'] })
};
// THEME은 그림 파일(art_map*.js)에 있어 여기서는 아직 없다 → tf_art_map.js가 THEME[base]에 위 값을 덮어 THEME[키]로 넣는다

// v1.2 난이도(중반 이후): 탑이 강해지는 3장부터 뒤 웨이브의 체력 총량을 더 적고 단단한 적에 몰고(광역 한 방에 안 죽게),
// 무리 사이를 벌리고(광역 효율 낮춤), 섞어 웨이브에 중장갑, 특수 적을 더 넣는다. 금화는 마릿수가 준 만큼 한 마리 몫을 올려 총량 유지
// q: 0(영향 없음) ~ 1(최대). 장 진행 p(2장 0 → 10장 이후 1) × 판 안 웨이브 진행(앞 30%는 0, 85% 이후 전부) × 난이도
var TF_LATE = { from: 2, span: 8, cut: 0.33, tot: 0.08, gap: 0.55, w0: 0.3, fod: 1.4, fodHp: 0.15 };
function tfLateQ(M, i, N, dk) {
  if (!M || !M.ch || !/^c\d+s\d+$/.test(M.id || '')) return 0;
  var D = DIFFS[dk] || {}; if (D.endless) return 0;
  var p = clamp((M.ch - TF_LATE.from) / TF_LATE.span, 0, 1); if (!(p > 0)) return 0;
  var wf = N > 1 ? i / (N - 1) : 1, wk = clamp((wf - TF_LATE.w0) / (1 - TF_LATE.w0 - 0.15), 0, 1);   // 판 앞쪽(경제 쌓는 때)은 그대로
  return p * wk * (dk === 'easy' ? 0.6 : dk === 'hard' ? 1.15 : 1);
}
// 떼, 하늘 잔챙이(드론, 미사일 등 체력 160 이하)는 광역 한 방 대상이라 더 크게 몬다
function tfLateFod(E) { return !!E && E.hp <= 160 && (!!E.swarm || !!E.fly); }
function tfLateCut(q, E) { return 1 - TF_LATE.cut * (tfLateFod(E) ? TF_LATE.fod : 1) * q; }                  // 마릿수 배율
function tfLateHp(q, E) { return (1 + (TF_LATE.tot + (tfLateFod(E) ? TF_LATE.fodHp : 0)) * q) / tfLateCut(q, E); }   // 한 마리 체력 배율
function tfLateBig(E) { return E.hp >= 1000 || !!E.cap; }               // 이미 한두 마리만 오는 큰 적: 마릿수는 그대로, 체력만 총량 배율
