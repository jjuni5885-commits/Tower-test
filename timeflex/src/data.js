// ===== data.js : 탑, 적, 맵, 웨이브, 연구, 이야기 =====
var GAME_TITLE = '타워플렉스';   // 부제 '차원전쟁' (타이틀 그림은 화면 갈래)
// 격자 기본 크기. 판마다 M.cols, M.rows로 바꿀 수 있으니 논리와 그리기는 g.cols, g.rows를 쓸 것 (COLS, ROWS는 기본값으로만)
var COLS = 10, ROWS = 17;

// ---------- 탑 ----------
// 종류(kind): arrow 화살, stone 투석, orb 마법탄, chain 연쇄 번개, beam 광선, pulse 냉기 파동,
//            bolt 관통 노포, cone 화염, ring 화염 고리, flask 독 플라스크, shell 포탄, aura 종탑, mint 조폐소
// dmgType: phys 물리(갑옷에 막힘), magic 마법, expl 폭발(갑옷 절반 무시)
// v2.0(ENG2): site, hit(영역), light(조명 탑), br[i].ult(궁극 이름), tiers 3번째 = 6단계 궁극. 새 탑 14종, 합체, 관리자 탑은 data_towers2.js가 뒤에 붙인다
var TOWER_ORDER = ['archer', 'catapult', 'arcane', 'frost', 'ballista', 'bell', 'flame', 'alchemy', 'cannon', 'mint'];
var TOWERS = {
  archer: { name: '궁수탑', short: '궁수', kind: 'arrow', dmgType: 'phys', air: 1, site: 'land', hit: 'gas', col: '#c9a35b',
    desc: '싸고 빠른 기본 탑. 날아다니는 적도 쏜다.',
    lv: [{ cost: 70, dmg: 8, rate: 1.7, range: 2.6 }, { cost: 60, dmg: 12, rate: 1.9, range: 2.8 }, { cost: 100, dmg: 17, rate: 2.1, range: 3.0 }],
    br: [
      { name: '매의 눈', ult: '천리안 신궁', desc: '아주 멀리서 강한 한 발. 치명타가 터지고 숨은 적을 본다.', tiers: [
        { cost: 190, dmg: 60, rate: 0.95, range: 4.2, crit: 0.2, critX: 2.5, detect: 1 },
        { cost: 300, dmg: 115, rate: 1.05, range: 4.8, crit: 0.3, critX: 3, detect: 1, ap: 0.5 },
        { cost: 480, dmg: 170, rate: 1.1, range: 5.8, crit: 0.35, critX: 3.2, detect: 1, ap: 0.8, apierce: 2 }] },
      { name: '연사 궁수대', ult: '화살비 군단', desc: '궁수가 늘어나 여러 적을 한꺼번에 쏜다.', tiers: [
        { cost: 180, dmg: 14, rate: 3.2, range: 3.0, multi: 2 },
        { cost: 290, dmg: 19, rate: 3.8, range: 3.2, multi: 3 },
        { cost: 460, dmg: 24, rate: 4.0, range: 3.5, multi: 4, abounce: 1 }] }] },
  catapult: { name: '투석기', short: '투석', kind: 'stone', dmgType: 'expl', air: 0, site: 'land', hit: 'gs', col: '#9b8f7a',
    desc: '멀리 바위를 날려 무리를 한꺼번에 친다. 공중은 못 친다.',
    lv: [{ cost: 110, dmg: 26, rate: 0.55, range: 3.2, splash: 0.85 }, { cost: 100, dmg: 40, rate: 0.58, range: 3.4, splash: 0.95 }, { cost: 150, dmg: 58, rate: 0.6, range: 3.6, splash: 1.05 }],
    br: [
      { name: '화염 투석기', ult: '유성 투석기', desc: '불 단지가 떨어진 자리가 한동안 불탄다.', tiers: [
        { cost: 290, dmg: 70, rate: 0.65, range: 3.7, splash: 1.1, zoneDps: 20, zoneT: 3 },
        { cost: 440, dmg: 100, rate: 0.7, range: 3.8, splash: 1.2, zoneDps: 42, zoneT: 4 },
        { cost: 700, dmg: 165, rate: 0.78, range: 4.2, splash: 1.45, zoneDps: 85, zoneT: 5, frag: 4 }] },
      { name: '거석 투척기', ult: '산사태 투척기', desc: '거대한 바위로 적을 기절시킨다.', tiers: [
        { cost: 290, dmg: 160, rate: 0.42, range: 3.8, splash: 1.3, stun: 0.6 },
        { cost: 440, dmg: 290, rate: 0.42, range: 4.0, splash: 1.5, stun: 1.0 },
        { cost: 700, dmg: 640, rate: 0.45, range: 4.4, splash: 1.9, stun: 1.4, knock: 0.5 }] }] },
  arcane: { name: '마법탑', short: '마법', kind: 'orb', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#8f7bd6',
    desc: '갑옷을 무시하는 마법탄. 철갑병, 골렘에 강하다.',
    lv: [{ cost: 100, dmg: 28, rate: 0.75, range: 2.5 }, { cost: 90, dmg: 42, rate: 0.8, range: 2.65 }, { cost: 140, dmg: 60, rate: 0.85, range: 2.8 }],
    br: [
      { name: '뇌전 첨탑', ult: '천둥왕의 첨탑', desc: '번개가 여러 적에게 튄다.', tiers: [
        { kind: 'chain', cost: 260, dmg: 55, rate: 0.9, range: 2.9, chain: 4, chainF: 0.85 },
        { kind: 'chain', cost: 400, dmg: 85, rate: 1.0, range: 3.0, chain: 6, chainF: 0.88, stun: 0.15 },
        { kind: 'chain', cost: 640, dmg: 125, rate: 1.15, range: 3.3, chain: 9, chainF: 0.9, stun: 0.3, mark: 0.15 }] },
      { name: '비전 집속탑', ult: '별빛 붕괴포', desc: '한 적을 오래 비출수록 광선이 세진다. 우두머리 사냥용.', tiers: [
        { kind: 'beam', cost: 260, dps0: 40, dps1: 170, ramp: 3, range: 2.9 },
        { kind: 'beam', cost: 400, dps0: 70, dps1: 340, ramp: 3, range: 3.1 },
        { kind: 'beam', cost: 640, dps0: 120, dps1: 640, ramp: 2.5, range: 3.5, beamSplash: 0.9, beamSplashF: 0.35 }] }] },
  frost: { name: '서리탑', short: '서리', kind: 'pulse', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#8fd3f0',
    desc: '주변 모든 적을 느리게 만든다.',
    lv: [{ cost: 90, dmg: 6, rate: 0.8, range: 1.7, slow: 0.3, slowT: 1.5 }, { cost: 80, dmg: 10, rate: 0.8, range: 1.85, slow: 0.36, slowT: 1.6 }, { cost: 125, dmg: 15, rate: 0.85, range: 2.0, slow: 0.42, slowT: 1.7 }],
    br: [
      { name: '혹한의 탑', ult: '절대영도', desc: '적을 얼려 멈춘다. 언 적은 더 아프게 맞는다.', tiers: [
        { cost: 230, dmg: 26, rate: 0.85, range: 2.1, slow: 0.45, slowT: 1.8, freeze: 0.15, freezeT: 1.2, shatter: 0.3 },
        { cost: 360, dmg: 40, rate: 0.9, range: 2.2, slow: 0.5, slowT: 2, freeze: 0.25, freezeT: 1.6, shatter: 0.35 },
        { cost: 580, dmg: 70, rate: 0.95, range: 2.5, slow: 0.6, slowT: 2.4, freeze: 0.4, freezeT: 2.0, shatter: 0.5 }] },
      { name: '눈보라 탑', ult: '빙하 폭풍', desc: '넓은 범위를 크게 느리게 한다.', tiers: [
        { cost: 230, dmg: 22, rate: 1.1, range: 2.6, slow: 0.5, slowT: 1.6 },
        { cost: 360, dmg: 34, rate: 1.2, range: 3.0, slow: 0.56, slowT: 1.8 },
        { cost: 580, dmg: 62, rate: 1.3, range: 3.6, slow: 0.65, slowT: 2.2, freeze: 0.12, freezeT: 1.0, shatter: 0.25 }] }] },
  ballista: { name: '노포', short: '노포', kind: 'bolt', dmgType: 'phys', air: 1, site: 'land', hit: 'gas', col: '#a7774a',
    desc: '일직선으로 여러 적을 꿰뚫는 거대한 화살. 사거리가 길다.',
    lv: [{ cost: 120, dmg: 42, rate: 0.6, range: 3.5, pierce: 3 }, { cost: 110, dmg: 64, rate: 0.62, range: 3.7, pierce: 4 }, { cost: 170, dmg: 92, rate: 0.65, range: 3.9, pierce: 5 }],
    br: [
      { name: '공성 노포', ult: '용잡이 노포', desc: '한 발에 줄줄이 꿰뚫고 갑옷을 부순다.', tiers: [
        { cost: 310, dmg: 200, rate: 0.55, range: 4.3, pierce: 8, shred: 0.2, shredT: 4 },
        { cost: 480, dmg: 340, rate: 0.55, range: 4.6, pierce: 12, shred: 0.3, shredT: 5 },
        { cost: 760, dmg: 600, rate: 0.6, range: 5.2, pierce: 20, shred: 0.4, shredT: 6, airX: 1.6, bossX: 1.3 }] },
      { name: '연노', ult: '폭풍 연노', desc: '노포 두 대가 번갈아 빠르게 쏜다.', tiers: [
        { cost: 300, dmg: 60, rate: 1.6, range: 3.9, pierce: 4 },
        { cost: 460, dmg: 86, rate: 2.2, range: 4.0, pierce: 5 },
        { cost: 740, dmg: 150, rate: 3.2, range: 4.2, pierce: 6, knockD: 0.12 }] }] },
  bell: { name: '성소 종탑', short: '종탑', kind: 'aura', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', light: 1, col: '#e8c76a',
    desc: '주변 탑의 피해를 올리고, 숨은 적을 드러낸다.',
    lv: [{ cost: 150, range: 1.6, aura: 0.12, reveal: 1.6 }, { cost: 130, range: 1.8, aura: 0.18, reveal: 1.8 }, { cost: 190, range: 2.0, aura: 0.24, reveal: 2.0 }],
    br: [
      { name: '전쟁의 북', ult: '승전고', desc: '주변 탑이 더 빨리 쏜다.', tiers: [
        { cost: 330, range: 2.2, aura: 0.25, auraSpd: 0.2, reveal: 2.2 },
        { cost: 500, range: 2.4, aura: 0.3, auraSpd: 0.35, auraRng: 0.1, reveal: 2.4 },
        { cost: 800, range: 2.7, aura: 0.36, auraSpd: 0.5, auraRng: 0.15, reveal: 2.7 }] },
      { name: '성광의 종', ult: '천상의 종', desc: '빛이 주변 적을 태우고 느리게 한다.', tiers: [
        { cost: 330, range: 2.2, aura: 0.24, auraDps: 20, auraSlow: 0.15, reveal: 3.0 },
        { cost: 500, range: 2.4, aura: 0.28, auraDps: 45, auraSlow: 0.2, auraShred: 0.15, reveal: 3.4 },
        { cost: 800, range: 2.8, aura: 0.32, auraDps: 100, auraSlow: 0.28, auraShred: 0.25, reveal: 4.0 }] }] },
  flame: { name: '화염탑', short: '화염', kind: 'cone', dmgType: 'magic', air: 1, site: 'land', hit: 'gas', col: '#ff8a3c',
    desc: '가까운 적을 불길로 쓸고 태운다. 사거리가 짧다.',
    lv: [{ cost: 110, dmg: 6, rate: 4, range: 1.6, cone: 62, burn: 8, burnT: 2 }, { cost: 100, dmg: 9, rate: 4, range: 1.7, cone: 62, burn: 12, burnT: 2 }, { cost: 150, dmg: 13, rate: 4, range: 1.8, cone: 64, burn: 18, burnT: 2.2 }],
    br: [
      { name: '용의 숨결', ult: '태양룡의 숨결', desc: '더 길고 뜨거운 불길.', tiers: [
        { cost: 280, dmg: 20, rate: 4, range: 2.3, cone: 70, burn: 30, burnT: 3 },
        { cost: 430, dmg: 32, rate: 4, range: 2.6, cone: 74, burn: 50, burnT: 3 },
        { cost: 690, dmg: 55, rate: 4, range: 3.1, cone: 80, burn: 90, burnT: 3.5 }] },
      { name: '업화의 고리', ult: '지옥불 고리', desc: '탑 둘레 전체에 불꽃 고리가 터진다.', tiers: [
        { kind: 'ring', cost: 280, dmg: 50, rate: 0.9, range: 1.7, burn: 25, burnT: 2.5 },
        { kind: 'ring', cost: 430, dmg: 90, rate: 0.95, range: 2.0, burn: 45, burnT: 3 },
        { kind: 'ring', cost: 690, dmg: 165, rate: 1.05, range: 2.5, burn: 80, burnT: 3.5, ringStun: 0.25 }] }] },
  alchemy: { name: '연금술 공방', short: '연금', kind: 'flask', dmgType: 'magic', air: 0, site: 'land', hit: 'gs', col: '#8fd14f',
    desc: '독 구름을 던져 지속 피해를 주고 갑옷을 녹인다.',
    lv: [{ cost: 120, dmg: 10, rate: 0.6, range: 2.6, cloudR: 0.8, cloudT: 3, poison: 10, shred: 0.1 }, { cost: 110, dmg: 14, rate: 0.62, range: 2.75, cloudR: 0.9, cloudT: 3, poison: 16, shred: 0.12 }, { cost: 160, dmg: 20, rate: 0.65, range: 2.9, cloudR: 1.0, cloudT: 3.2, poison: 24, shred: 0.15 }],
    br: [
      { name: '부식 산', ult: '만물 용해액', desc: '갑옷을 크게 녹인다.', tiers: [
        { cost: 300, dmg: 28, rate: 0.7, range: 3.0, cloudR: 1.1, cloudT: 3.5, poison: 30, shred: 0.4 },
        { cost: 460, dmg: 40, rate: 0.72, range: 3.1, cloudR: 1.2, cloudT: 4, poison: 45, shred: 0.6 },
        { cost: 740, dmg: 60, rate: 0.8, range: 3.4, cloudR: 1.4, cloudT: 5, poison: 100, shred: 0.85 }] },
      { name: '역병 공방', ult: '대역병', desc: '독으로 죽은 적이 주변에 독을 옮긴다.', tiers: [
        { cost: 300, dmg: 28, rate: 0.7, range: 3.0, cloudR: 1.1, cloudT: 4, poison: 45, shred: 0.15, plague: 1 },
        { cost: 460, dmg: 40, rate: 0.72, range: 3.1, cloudR: 1.25, cloudT: 5, poison: 70, shred: 0.2, plague: 1 },
        { cost: 740, dmg: 60, rate: 0.8, range: 3.4, cloudR: 1.5, cloudT: 6, poison: 120, shred: 0.3, plague: 1 }] }] },
  cannon: { name: '대포탑', short: '대포', kind: 'shell', dmgType: 'expl', air: 0, site: 'land', hit: 'gs', col: '#7d8794',
    desc: '한 방이 묵직한 포탄. 단단한 적에게 강하다.',
    lv: [{ cost: 130, dmg: 46, rate: 0.6, range: 2.7, splash: 0.6 }, { cost: 120, dmg: 70, rate: 0.62, range: 2.85, splash: 0.65 }, { cost: 180, dmg: 100, rate: 0.65, range: 3.0, splash: 0.7 }],
    br: [
      { name: '대구경 포', ult: '성벽 파괴자', desc: '거대한 포탄이 적을 뒤로 밀어낸다.', tiers: [
        { cost: 340, dmg: 260, rate: 0.45, range: 3.2, splash: 1.0, knock: 0.35 },
        { cost: 520, dmg: 460, rate: 0.45, range: 3.4, splash: 1.2, knock: 0.5 },
        { cost: 820, dmg: 1000, rate: 0.55, range: 3.8, splash: 1.6, knock: 0.7, stun: 0.5 }] },
      { name: '연발 포대', ult: '포화 요새', desc: '포신이 늘어나 쉬지 않고 쏜다.', tiers: [
        { cost: 330, dmg: 82, rate: 1.6, range: 3.0, splash: 0.6 },
        { cost: 500, dmg: 122, rate: 2.2, range: 3.1, splash: 0.65 },
        { cost: 800, dmg: 180, rate: 3.0, range: 3.4, splash: 0.75 }] }] },
  mint: { name: '왕실 조폐소', short: '조폐', kind: 'mint', dmgType: 'phys', air: 0, site: 'land', hit: '-', col: '#f2c94c',
    desc: '공격은 못 하지만 웨이브마다 금화를 만든다.',
    lv: [{ cost: 180, gold: 30 }, { cost: 160, gold: 55 }, { cost: 240, gold: 90 }],
    br: [
      { name: '상단 본부', ult: '황금 상단', desc: '웨이브마다 금화를 크게 번다.', tiers: [{ cost: 420, gold: 170 }, { cost: 650, gold: 300 },
        { cost: 1000, gold: 520 }] },
      { name: '왕실 금고', ult: '용의 보물고', desc: '가진 금화에 이자가 붙는다.', tiers: [{ cost: 420, gold: 90, interest: 0.04, cap: 80 }, { cost: 650, gold: 140, interest: 0.06, cap: 160 },
        { cost: 1000, gold: 220, interest: 0.08, cap: 300 }] }] }
};
// 옛 규칙(판 번호로 탑 열림)의 흔적: 옛 저장 옮기기(gacha.js gcMigrate)에서만 씀. v2.0은 가진 탑(SAVE.towers) 기준
var TOWER_UNLOCK = { archer: 0, catapult: 0, arcane: 1, frost: 2, ballista: 3, bell: 4, flame: 5, alchemy: 6, cannon: 7, mint: 8 };
// 단계: 1~3 공통, 4부터 갈래(br 0 또는 1)의 tiers를 차례로. tiers가 3개면 6단계(궁극)까지
function fdMaxLv(type, br) { // br을 안 주면 두 갈래 중 긴 쪽
  var T = TOWERS[type]; if (!T || !T.br || !T.br.length) return T && T.lv ? Math.min(3, T.lv.length) : 1;
  if (br === 0 || br === 1) return 3 + (T.br[br] && T.br[br].tiers ? T.br[br].tiers.length : 0);
  var m = 0; T.br.forEach(function (B) { m = Math.max(m, B.tiers ? B.tiers.length : 0); }); return 3 + m;
}
function towerStats(type, lvl, br) {
  var T = TOWERS[type], base = {};
  for (var i = 0; i < Math.min(lvl, 3, T.lv.length); i++) { var L = T.lv[i]; for (var k in L) if (k !== 'cost') base[k] = L[k]; }
  if (lvl >= 4 && T.br && T.br[br]) { var B = T.br[br]; for (var j = 0; j < Math.min(lvl - 3, B.tiers.length); j++) { var L2 = B.tiers[j]; for (var k2 in L2) if (k2 !== 'cost') base[k2] = L2[k2]; } }
  if (!base.kind) base.kind = T.kind;
  return base;
}
function upgCost(type, lvl, br) { // lvl: 지금 단계 → 다음 단계 비용 (더 없으면 0)
  var T = TOWERS[type];
  if (lvl < 3) return T.lv[lvl] ? T.lv[lvl].cost : 0;
  var B = T.br && T.br[br]; if (B && B.tiers[lvl - 3]) return B.tiers[lvl - 3].cost;
  return 0;
}
// 4, 5단계는 갈래 이름, 6단계는 궁극 이름(br[i].ult)
function towerTitle(type, lvl, br) { var T = TOWERS[type], B = T.br && T.br[br]; return lvl >= 6 && B && B.ult ? B.ult : lvl >= 4 && B ? B.name : T.name; }
// ---------- 영역 (v2.0): 적 dom 'g' 땅 | 'a' 하늘 | 's' 바다, 탑 site 'land' | 'water', 탑 hit = 맞힐 수 있는 영역 글자 모음 ----------
function fdDom(E) { return E.dom || (E.fly ? 'a' : 'g'); }
function fdSite(type) { return (TOWERS[type] && TOWERS[type].site) || 'land'; }
function fdHit(type) { var T = TOWERS[type]; return T.hit || (T.air ? 'gas' : 'gs'); }
// 적이 다니는 길: 'air' 직선 항로(lane: 1), 'sea' 뱃길, 'path' 땅 길(보통 하늘 적은 땅 길을 편 곡선)
function fdRoute(E) { return E.lane ? 'air' : fdDom(E) === 's' ? 'sea' : 'path'; }
function fdRouteN(M, E) { var r = fdRoute(E); return r === 'air' ? (M.air || []).length : r === 'sea' ? (M.sea || []).length : M.paths.length; }

// ---------- 적 ----------
// hp, spd(칸/초), armor(물리 감소), mres(마법 감소, 음수면 약점), gold, leak(성문 피해), size(키, 칸)
var ENEMIES = {
  goblin: { name: '고블린 약탈자', hp: 38, spd: 1.25, gold: 5, leak: 1, size: 0.52, desc: '작고 빠르다. 떼로 몰려온다.' },
  orc: { name: '오크 전사', hp: 95, spd: 0.85, gold: 10, leak: 1, size: 0.7, desc: '평범하지만 질기다.' },
  wolf: { name: '다이어울프', hp: 70, spd: 1.75, gold: 9, leak: 1, size: 0.66, desc: '아주 빠르다. 서리탑으로 붙잡아라.' },
  knight: { name: '철갑병', hp: 230, spd: 0.72, armor: 0.6, gold: 32, leak: 2, size: 0.76, desc: '두꺼운 갑옷이 화살을 60% 막는다. 마법, 폭발, 산으로 녹여라.' },
  bat: { name: '흡혈 박쥐', hp: 48, spd: 1.5, fly: 1, gold: 8, leak: 1, size: 0.55, desc: '하늘로 곧장 날아온다. 투석기, 대포, 연금술은 못 맞힌다.' },
  stalker: { name: '그림자 추적자', hp: 125, spd: 1.15, stealth: 1, gold: 18, leak: 1, size: 0.7, desc: '보이지 않는다. 종탑이나 매의 눈이 있어야 겨눌 수 있다. 폭발과 불, 독은 그냥 맞는다.' },
  skeleton: { name: '해골 병사', hp: 85, spd: 0.95, revive: 1, gold: 12, leak: 1, size: 0.66, desc: '쓰러져도 한 번 다시 일어난다.' },
  shaman: { name: '오크 주술사', hp: 150, spd: 0.8, heal: { r: 1.5, pct: 0.1, cd: 3 }, gold: 22, leak: 1, size: 0.7, desc: '주변 적의 상처를 치료한다. 먼저 잡아라.' },
  spider: { name: '새끼 거미', hp: 30, spd: 1.6, gold: 3, leak: 1, size: 0.42, desc: '거미 여왕이 끝없이 낳는다.' },
  troll: { name: '트롤', hp: 760, spd: 0.55, regen: 0.015, armor: 0.15, gold: 75, leak: 3, size: 1.0, desc: '체력이 엄청나고 상처가 저절로 아문다.' },
  golemL: { name: '바위 골렘', hp: 540, spd: 0.5, armor: 0.45, split: ['golemM', 2], gold: 30, leak: 3, size: 1.0, desc: '부서지면 작은 골렘 둘로 갈라진다. 그 골렘도 또 갈라진다.' },
  golemM: { name: '돌 골렘', hp: 210, spd: 0.65, armor: 0.35, split: ['golemS', 2], gold: 14, leak: 2, size: 0.72, desc: '바위 골렘의 조각.' },
  golemS: { name: '자갈 정령', hp: 72, spd: 0.85, armor: 0.2, gold: 5, leak: 1, size: 0.5, desc: '골렘의 마지막 조각.' },
  wagon: { name: '공성 수레', hp: 1600, spd: 0.42, armor: 0.35, carry: [['orc', 4], ['goblin', 3]], gold: 120, leak: 6, size: 1.3, desc: '부서지면 안에 탄 오크와 고블린이 쏟아진다.' },
  wyvern: { name: '와이번', hp: 420, spd: 0.9, fly: 1, armor: 0.2, gold: 60, leak: 3, size: 1.0, desc: '단단한 비행 괴수. 대공 화력을 모아라.' },
  wraith: { name: '망령', hp: 250, spd: 1.0, armor: 0.85, mres: -0.25, gold: 40, leak: 2, size: 0.74, desc: '물리 공격이 거의 통하지 않는다. 마법에 약하다.' },
  warlock: { name: '흑마법사', hp: 220, spd: 0.75, mres: 0.4, ward: { r: 1.7, pct: 0.25, cd: 4.5, n: 6 }, gold: 32, leak: 1, size: 0.72, desc: '주변 적에게 마법 보호막을 씌운다. 마법에 강하다.' },
  grumsh: { name: '오크 족장 그룸쉬', boss: 1, hp: 3800, spd: 0.45, armor: 0.25, warcry: { r: 2.2, spd: 0.5, dur: 3, cd: 7 }, gold: 300, leak: 20, size: 1.8, desc: '함성으로 주변 적을 빠르게 만든다.' },
  arachne: { name: '거미 여왕 아라크네', boss: 1, hp: 6400, spd: 0.42, armor: 0.2, mres: 0.2, brood: { n: 3, cd: 5, type: 'spider' }, gold: 400, leak: 20, size: 1.9, desc: '새끼 거미를 쉴 새 없이 낳는다.' },
  yotun: { name: '서리 거인 요툰', boss: 1, hp: 11000, spd: 0.36, armor: 0.4, frostNova: { r: 2.3, dur: 3.5, cd: 9 }, gold: 500, leak: 20, size: 2.2, desc: '주변 탑을 얼려 잠시 멈춘다.' },
  barkan: { name: '잿빛 군주 바르칸', boss: 1, final: 1, hp: 20000, spd: 0.38, armor: 0.3, mres: 0.3, summon: { type: 'wraith', n: 2, cd: 10 }, gold: 0, leak: 20, size: 2.0, desc: '망령을 부르고 어둠의 보호막을 두른다. 마지막 일격은 최후의 화살로.' },
  // ---- v1.3 상성 몬스터 (능력은 logic.js counterMul, 그림은 art_enemy.js가 이 키로) ----
  // iceArmor: 얼음 갑옷(불 외 피해 x0.25, 불에 맞으면 meltT초 녹음), fireImm: 불과 화상 면역, iceWeak: 얼음 계열 배수, slowK: 감속 세기 배수
  // regenCool: 느려진 동안 회복 멈춤, magRef: 마법 피해 0, slowX: 감속과 빙결 시간 배수, wallStun: 방책에 막히면 기절, frontGuard: 정면 단일 투사체 배수
  iceslime: { name: '얼음 젤리', hp: 210, spd: 0.8, iceArmor: 1, meltT: 4, gold: 22, leak: 1, size: 0.62, desc: '얼음 갑옷이 불 말고 모든 피해를 75% 막는다. 불로 녹이면 4초 동안 갑옷이 벗겨진다.' },
  ember: { name: '불씨 도깨비', hp: 175, spd: 1.25, fireImm: 1, iceWeak: 2, slowK: 1.5, regen: 0.03, regenCool: 1, gold: 20, leak: 1, size: 0.6, desc: '불과 화상이 통하지 않고 상처가 계속 아문다. 얼음으로 식히면 두 배로 아프고 회복도 멈춘다.' },
  mirror: { name: '거울 기사', hp: 240, spd: 0.78, armor: 0.6, magRef: 1, gold: 30, leak: 2, size: 0.74, desc: '마법을 모두 튕겨 낸다. 화살, 노포, 대포, 투석기 같은 물리와 폭발로 깨뜨려라.' },
  bunny: { name: '번개 토끼', hp: 90, spd: 2.6, slowX: 2, wallStun: 1, gold: 12, leak: 2, size: 0.56, desc: '번개처럼 빠르고 새면 생명 2를 잃는다. 느려지는 효과가 두 배로 오래 간다. 서리탑이나 얼음으로 붙잡아라.' },
  guard: { name: '방패 수호자', hp: 340, spd: 0.65, armor: 0.5, mres: 0.5, frontGuard: 0.15, gold: 34, leak: 2, size: 0.78, desc: '앞에서 날아온 화살과 마법탄을 방패로 막는다. 노포로 꿰뚫거나 폭발로 덮거나 옆과 뒤에서 쏴라.' },
  yotun2: { name: '각성한 요툰', boss: 1, art: 'yotun', hp: 11000, spd: 0.38, armor: 0.4, iceArmor: 1, meltT: 4, frostNova: { r: 2.6, dur: 3.5, cd: 8 }, gold: 600, leak: 20, size: 2.2, desc: '얼음 갑옷을 두르고 다시 깨어났다. 불로 녹이지 않으면 피해가 25%만 들어간다. 주변 탑을 얼린다.' },
  twinking: { name: '얼음불 쌍둥이 왕', boss: 1, hp: 19000, spd: 0.36, armor: 0.2, twin: { cd: 8 }, summon: { n: 2, cd: 11 }, gold: 0, leak: 20, size: 1.9, desc: '8초마다 불과 얼음을 바꿔 입는다. 불일 때는 얼음으로, 얼음일 때는 불로 쳐야 두 배로 아프다. 나머지는 40%만 들어간다.' }
};
var ENEMY_ORDER = ['goblin', 'orc', 'wolf', 'knight', 'bat', 'stalker', 'shaman', 'spider', 'skeleton', 'troll', 'golemL', 'golemM', 'golemS', 'wyvern', 'wraith', 'wagon', 'warlock', 'iceslime', 'ember', 'mirror', 'bunny', 'guard', 'grumsh', 'arachne', 'yotun', 'barkan', 'yotun2', 'twinking'];
// 상성: weak = 핵심 상성 탑 키, weakEl = 속성 카드로도 잡을 수 있는 속성
(function () {
  var W = {
    goblin: ['catapult', 'archer'], orc: ['archer', 'cannon'], wolf: ['frost', 'archer'], knight: ['arcane', 'cannon', 'alchemy'], bat: ['archer', 'ballista'],
    stalker: ['bell', 'catapult', 'flame'], shaman: ['ballista', 'archer'], spider: ['flame', 'catapult'], skeleton: ['catapult', 'archer'], troll: ['alchemy', 'flame'],
    golemL: ['arcane', 'cannon'], golemM: ['arcane', 'cannon'], golemS: ['catapult', 'archer'], wyvern: ['archer', 'ballista', 'arcane'], wraith: ['arcane', 'flame'],
    wagon: ['cannon', 'ballista'], warlock: ['ballista', 'cannon'], grumsh: ['frost', 'arcane'], arachne: ['flame', 'catapult'], yotun: ['arcane', 'alchemy'], barkan: ['arcane', 'ballista'],
    iceslime: ['flame', 'catapult'], ember: ['frost'], mirror: ['cannon', 'ballista', 'catapult'], bunny: ['frost'], guard: ['ballista', 'catapult', 'cannon'],
    yotun2: ['flame', 'arcane'], twinking: ['flame', 'frost']
  };
  var WE = { iceslime: ['fire'], ember: ['ice'], mirror: [], bunny: ['ice'], guard: ['poison'], yotun2: ['fire'], twinking: ['fire', 'ice'] };
  for (var k in W) { ENEMIES[k].weak = W[k]; if (WE[k]) ENEMIES[k].weakEl = WE[k]; }
})();
function threatOf(k) {
  var E = ENEMIES[k], c = E.hp * (1 + 0.9 * (E.armor || 0)) * (0.7 + 0.3 * E.spd);
  if (E.fly) c *= 1.4; if (E.stealth) c *= 1.35; if (E.revive) c *= 1.45; if (E.heal || E.ward) c *= 1.6; if (E.mres < 0) c *= 1.1;
  if (E.iceArmor) c *= 1.3; if (E.magRef) c *= 1.1; if (E.frontGuard) c *= 1.1; if (E.slowX) c *= (E.leak || 1) / 1.5;
  if (E.thr) c *= E.thr;   // v2.0: 새 능력(변신, 흐려짐, 포격 등)의 위협 배수는 자료(data_enemies2.js)에 적는다
  if (E.split) c += threatOf(E.split[0]) * E.split[1] * 0.8;
  if (E.carry) E.carry.forEach(function (x) { c += threatOf(x[0]) * x[1] * 0.8; });
  return c;
}

// ---------- 난이도 ----------
var DIFFS = {
  easy: { name: '쉬움', hp: 0.72, lives: 30, gold: 1.15, extra: 0, starMax: 1 },
  normal: { name: '보통', hp: 1.0, lives: 20, gold: 1.0, extra: 0, starMax: 3 },
  hard: { name: '어려움', hp: 1.18, lives: 15, gold: 1.0, extra: 5, starMax: 3, crown: 1 },
  endless: { name: '무한', hp: 1.0, lives: 20, gold: 1.0, extra: 0, endless: 1, starMax: 0 }
};
var DIFF_ORDER = ['easy', 'normal', 'hard', 'endless'];

// ---------- 판(스테이지) ----------
// v2.0: 판은 stages_chN.js가 MAPS.push({...})로 넣는다 (스키마는 docs/SPEC.md 4절, docs/ENGINE.md)
// 격자 글자: '.' 풀밭(건설 가능), '=' 길, 'G' 성문, '#' 바위, '~' 물(수상 탑만), 'L' 용암, a b c C 장애물, d 보물 상자, e~j 숨은 탑
var MAPS = [];
// 챕터 표 (open.stars = 앞 챕터에서 모아야 하는 별, gate = 그 챕터 안에서 판 번호: 필요한 별). 별 수는 임시값
var CHAPTERS = [
  { id: 1, name: '말랑 왕국', sub: '하늘에 금이 가고 말랑한 침략자들이 쏟아졌다', mood: 'cute', open: { stars: 0 }, gate: { 5: 8, 9: 18 } },
  { id: 2, name: '저주받은 밤', sub: '해가 뜨지 않는 세계, 묘지의 흙이 들썩인다', mood: 'horror', open: { stars: 26 }, gate: { 5: 9, 9: 20 } },
  { id: 3, name: '강철 전선', sub: '땅과 바다와 하늘에서 강철 군단이 밀려온다', mood: 'modern', open: { stars: 26 }, gate: { 5: 9, 9: 20 } },
  { id: 4, name: '도깨비 고개', sub: '고갯마루에 요괴들의 잔치가 열렸다', mood: 'korea', open: { stars: 28 }, gate: { 5: 10, 9: 22 } }
];
// 잠금 해제 기준 판(그 판을 이기면 열림): 갈래 변신(4, 5단계), 궁극(6단계), 합체
var UNLOCKS = { branch: 'c1s03', ult: 'c1s08', fuse: 'c1s12' };
// 장애물 종류
var OBS = {
  a: { hp: 60, gold: 15, sz: 0.62 }, b: { hp: 170, gold: 35, sz: 0.78 }, c: { hp: 320, gold: 60, sz: 0.95 }, C: { hp: 900, gold: 150, sz: 1.8 },
  d: { hp: 140, gold: 120, sz: 0.7, chest: 1 },
  e: { hp: 220, gold: 20, sz: 0.85, tower: 'archer' }, f: { hp: 260, gold: 20, sz: 0.85, tower: 'catapult' }, g: { hp: 260, gold: 20, sz: 0.85, tower: 'arcane' },
  h: { hp: 260, gold: 20, sz: 0.85, tower: 'frost' }, i: { hp: 300, gold: 20, sz: 0.85, tower: 'ballista' }, j: { hp: 320, gold: 20, sz: 0.85, tower: 'cannon' }
};

// ---------- 웨이브 만들기 ----------
var HPK = 1.55, BUDK = 1.1;   // v2.2: 전체 난이도 한 단계 위(적 체력 1.35 → 1.55, +15%)
// 뒤 웨이브 추가 성장(v2.0.1): 판에 late가 있으면 5웨이브 뒤부터 적 체력이 더 가파르게 오른다. 초반은 그대로 두고 후반이 싱거운 판에만 씀(late 1이면 15웨이브 2배, 25웨이브 3.8배)
function lateK(M, i) { return M.late ? 1 + M.late * Math.pow(Math.max(0, i - 4) / 10, 1.5) : 1; }
// v2.2: 전체를 한 단계 올리되, 이미 봇이 겨우 이기던 판은 올리기 전 세기로 둠(올리면 봇이 못 깸. docs/BALANCE.md v2.2 절)
var HP_KEEP = { c2s10: 0.93, c3s04: 0.87, c3s06: 0.87, c3s09: 0.87, c3s12: 0.93, c4s06: 0.87, c4s08: 0.93, c4s12: 0.93 };
function hpScale(mi, i, dk) { var M = MAPS[mi], dh = DIFFS[dk].hp; if (dh > 1) dh = 1 + (dh - 1) * Math.min(1, i / 14); return HPK * (1 + 0.035 * i + 0.0012 * i * i) * M.hpMul * lateK(M, i) * (HP_KEEP[M.id] || 1) * dh; }
// 길이 짧거나 갈래가 많으면 같은 웨이브도 더 어렵다 → 양을 줄인다
var _lenK = {};
function mapLenK(mi) {
  var M = MAPS[mi], L = 0, ck = M.id;
  if (_lenK[ck] != null) return _lenK[ck];
  M.paths.forEach(function (w) { L += buildPath(w, 0.5).len; });
  L /= M.paths.length;
  return (_lenK[ck] = clamp(Math.pow(L / 26, 0.8), 0.7, 1.2) * (1 - 0.07 * (M.paths.length - 1)));
}
function genWaves(mi, dk) {
  var M = MAPS[mi], D = DIFFS[dk], N = M.waves + (D.extra || 0), waves = [];
  var rnd = rngOf(hashStr(M.id + ':' + dk) ^ 0x51ed27);
  for (var i = 0; i < N; i++) waves.push(makeWave(mi, i, N, rnd, dk));
  return waves;
}
function makeWave(mi, i, N, rnd, dk) {
  if (typeof en2MakeWave === 'function') return en2MakeWave(mi, i, N, rnd, dk);   // v2.0: 영역(바다, 항로), 떼, 판 규칙을 아는 생성기(data_enemies2.js). 없으면 아래 옛 규칙
  var M = MAPS[mi], intro = M.intro || {};
  // 그 영역의 길이 이 판에 없는 적(뱃길 없는 판의 바다 적, 항로 없는 판의 항로 적)은 뺀다
  var avail = M.pool.filter(function (k) { var E = ENEMIES[k]; if (!E || fdRouteN(M, E) < 1) return false; var early = E.hp >= 1000 ? 6 : E.hp >= 400 ? 3 : (E.armor >= 0.5 || E.heal || E.ward) ? 2 : 0; return (intro[k] == null ? early : intro[k]) <= i; });
  if (!avail.length) avail = ['goblin'];
  var budget = 380 * BUDK * M.bud * mapLenK(mi) * (1 + 0.28 * i + 0.012 * i * i) * (i === 0 ? 0.7 : i === 1 ? 0.8 : i === 2 ? 0.9 : 1);
  var fresh = null;
  for (var k in intro) if (intro[k] === i && avail.indexOf(k) >= 0) fresh = k;
  var fast = avail.filter(function (k) { return ENEMIES[k].spd >= 1.25 && !ENEMIES[k].fly; });
  var big = avail.filter(function (k) { return ENEMIES[k].hp >= 400; });
  var fly = avail.filter(function (k) { return ENEMIES[k].fly; });
  var elite = avail.filter(function (k) { var E = ENEMIES[k]; return E.armor >= 0.5 || E.heal || E.ward || E.stealth || E.mres < 0; });
  var small = avail.filter(function (k) { return ENEMIES[k].hp <= 60 && !ENEMIES[k].fly; });
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  var parts = [], last = i === N - 1, kind;
  if (last && M.boss && !DIFFS[dk].endless) kind = 'boss';
  else if (last) kind = 'finale';
  else if (fresh) kind = 'intro';
  else { var pat = ['mix', 'rush', 'mix', 'tank', 'swarm', 'elite', 'air']; kind = pat[(i + mi) % pat.length]; }
  if (kind === 'rush' && !fast.length) kind = 'mix';
  if (kind === 'tank' && !big.length) kind = 'mix';
  if (kind === 'air' && !fly.length) kind = 'mix';
  if (kind === 'elite' && !elite.length) kind = 'mix';
  if (kind === 'swarm' && !small.length) kind = 'mix';
  if (i < 2 && kind !== 'intro') kind = 'basic';
  if (kind === 'basic') parts = [[avail[0], 1]];
  else if (kind === 'intro') parts = [[fresh, 0.55], [pick(avail.filter(function (k) { return k !== fresh; }).concat([avail[0]])), 0.45]];
  else if (kind === 'mix') { var a = pick(avail), b = pick(avail), c = pick(avail); parts = [[a, 0.4], [b, 0.35], [c, 0.25]]; }
  else if (kind === 'rush') parts = [[pick(fast), 0.7], [pick(avail), 0.3]];
  else if (kind === 'tank') parts = [[pick(big), 0.55], [pick(avail), 0.45]];
  else if (kind === 'swarm') parts = [[pick(small), 0.8], [pick(avail), 0.2]];
  else if (kind === 'elite') parts = [[pick(elite), 0.6], [pick(avail), 0.4]];
  else if (kind === 'air') parts = [[pick(fly), 0.65], [pick(avail), 0.35]];
  else if (kind === 'finale') { budget *= 1.25; parts = [[pick(big.length ? big : avail), 0.4], [pick(avail), 0.3], [pick(fast.length ? fast : avail), 0.3]]; }
  else if (kind === 'boss') { budget *= 0.75; parts = [[pick(avail), 0.5], [pick(avail), 0.5]]; }
  // [v1.3] 상성 몬스터(M.focus)를 웨이브마다 섞음: 2부는 35%, 1부 7~12판은 20%
  if (M.focus && avail.indexOf(M.focus) >= 0 && kind !== 'basic' && kind !== 'intro' && !parts.some(function (p) { return p[0] === M.focus; })) {
    var fs = M.focusK || 0.35; parts.forEach(function (p) { p[1] *= 1 - fs; }); parts.push([M.focus, fs]);
  }
  var groups = [], delay = 0;
  parts.forEach(function (p, gi) {
    var E = ENEMIES[p[0]], n = Math.max(1, Math.round(budget * p[1] / threatOf(p[0])));
    if (E.hp >= 1000) n = Math.min(n, 1 + Math.floor(i / 8));
    n = Math.min(n, 45);
    var gap = E.hp >= 400 ? 2.6 : E.spd >= 1.25 ? 0.5 : 0.85;
    var np = fdRouteN(M, E);   // 길 번호(path)는 그 적 영역의 길 목록 안에서 센다: 땅 M.paths, 바다 M.sea, 항로 M.air
    if (kind === 'rush') gap *= 0.6; if (kind === 'swarm') gap *= 0.55;
    var path = np > 1 ? (gi % np) : 0;
    if (np > 1 && n >= 6 && rnd() < 0.5) {
      var half = Math.ceil(n / 2);
      groups.push({ type: p[0], n: half, gap: gap, delay: delay, path: path });
      groups.push({ type: p[0], n: n - half, gap: gap, delay: delay + gap * 0.5, path: (path + 1) % np });
    } else groups.push({ type: p[0], n: n, gap: gap, delay: delay, path: path });
    delay += Math.min(n * gap * 0.55, 9) + 1.2;
  });
  if (kind === 'boss') groups.push({ type: M.boss, n: 1, gap: 1, delay: delay + 2, path: 0, boss: 1 });
  return { kind: kind, groups: groups };
}
// 무한 모드: 맵의 모든 적으로 계속 세게
function endlessWave(mi, i, rnd) {
  var w = makeWave(mi, Math.min(i, 40), 999, rnd, 'endless');
  var extra = 1 + Math.max(0, i - 25) * 0.06;
  w.groups.forEach(function (g) { g.n = Math.min(60, Math.round(g.n * extra)); });
  if (i > 0 && i % 10 === 9) { var bosses = ['grumsh', 'arachne', 'yotun']; w.groups.push({ type: bosses[(i / 10 | 0) % 3], n: 1, gap: 1, delay: 6, path: 0, boss: 1 }); }
  return w;
}

// ---------- 스킬 ----------
var SKILLS = {
  rain: { name: '화살비', cd: 26, unlock: 0, desc: '원하는 곳에 화살을 퍼붓는다. 숨은 적과 공중도 맞는다.' },
  wall: { name: '방책', cd: 40, unlock: 1, desc: '길 위에 방책을 세워 적을 붙잡는다.' },
  last: { name: '최후의 화살', cd: 75, unlock: 2, desc: '성에서 쏜 거대한 화살이 일직선으로 모든 적을 꿰뚫는다.' }
};

// ---------- 연구(별로 배우기) ----------
var RESEARCH = [
  { id: 'gold1', name: '왕실 보급', desc: '시작 금화 +60', cost: 2, fx: { startGold: 60 } },
  { id: 'wall', name: '성벽 보강', desc: '생명 +3', cost: 3, fx: { lives: 3 } },
  { id: 'archer', name: '정예 궁수', desc: '궁수탑 피해 +12%, 사거리 +8%', cost: 3, fx: { tdmg: { archer: 0.12 }, trng: { archer: 0.08 } } },
  { id: 'siege', name: '공성 기술', desc: '투석기, 노포, 대포탑 피해 +12%', cost: 3, fx: { tdmg: { catapult: 0.12, ballista: 0.12, cannon: 0.12 } } },
  { id: 'arcane', name: '비전 연구', desc: '마법탑, 서리탑 피해 +12%', cost: 3, fx: { tdmg: { arcane: 0.12, frost: 0.12 } } },
  { id: 'winter', name: '혹독한 겨울', desc: '둔화 +6%p, 지속 시간 +25%', cost: 3, fx: { slowAdd: 0.06, slowDur: 0.25 } },
  { id: 'alch', name: '불과 독', desc: '화상, 독 피해 +20%', cost: 3, fx: { dotMul: 0.2 } },
  { id: 'trade', name: '공정한 거래', desc: '판매할 때 돌려받는 금화 70% → 85%', cost: 2, fx: { refund: 0.15 } },
  { id: 'horn', name: '전령의 나팔', desc: '웨이브를 일찍 부를 때 받는 금화 +50%', cost: 2, fx: { earlyMul: 0.5 } },
  { id: 'loot', name: '약탈 전문가', desc: '장애물 금화 +40%, 처치 금화 +8%', cost: 3, fx: { obsGold: 0.4, killGold: 0.08 } },
  { id: 'rain', name: '화살비 숙련', desc: '화살비 재사용 -20%, 화살 +30%', cost: 3, fx: { rainCd: -0.2, rainN: 0.3 } },
  { id: 'barr', name: '방책 숙련', desc: '방책 내구도 +50%, 가시 피해 2배', cost: 3, fx: { barHp: 0.5, barThorn: 1 } },
  { id: 'gold2', name: '왕실 국고', desc: '시작 금화 +80', cost: 4, req: 'gold1', fx: { startGold: 80 } },
  { id: 'last', name: '최후의 화살 숙련', desc: '재사용 -25%, 피해 +30%', cost: 4, fx: { lastCd: -0.25, lastDmg: 0.3 } },
  { id: 'eng', name: '숙련 공병', desc: '건설, 강화 비용 -8%', cost: 5, fx: { costMul: -0.08 } }
];

// ---------- 이야기 (작전 브리핑) ----------
// v2.0: 판 파일이 STORY[판 id] = [[화자 키, 대사], ...] 로 넣고 화자는 SPEAKERS에 더한다. 챕터 결말은 STORY['c1end'] 식 (그 챕터 마지막 판을 처음 이기면 나옴)
var SPEAKERS = { bolton: '볼튼 대장', ria: '리아', tork: '토르크', mir: '미르', varkan: '바르칸', kael: '카엘', nar: '' };
var STORY = {};

// ---------- 능력 카드 (v1.3, 궁수의 전설식) ----------
// 3웨이브마다(그리고 1웨이브 전에 한 번) 3장 중 1장. 탑 종류별로 쌓이고(상한 max), 같은 탑에 짝 카드가 모이면 숨은 조합(COMBOS)이 켜짐
// 카드 객체(pick 사건): { id, kind: 'el'|'buff', tower, el, name, desc, rare, base, lv(고르면 될 단계), max, combo: [{ id, name, with }] }
var ELEMS = { fire: { name: '불', col: '#ff8a3c' }, ice: { name: '얼음', col: '#7cc8ff' }, bolt: { name: '번개', col: '#ffd23a' }, poison: { name: '독', col: '#8fdc4f' } };
var EL_ORDER = ['fire', 'ice', 'bolt', 'poison'];
// 속성 카드: 이름은 '{탑 이름} 불 속성' 꼴
var EL_CARD = {
  fire: { name: '{s} 불 속성', desc: '맞은 적이 불탄다. 불 피해는 얼음 갑옷을 녹인다' },
  ice: { name: '{s} 얼음 속성', desc: '맞은 적이 1.5초 동안 25% 느려진다. 불씨 도깨비에게 두 배' },
  bolt: { name: '{s} 번개 속성', desc: '25% 확률로 근처 적 둘에게 번개가 튄다' },
  poison: { name: '{s} 독 속성', desc: '맞은 적이 독에 걸리고 갑옷이 조금 녹는다' }
};
// 탑 성질상 이미 그 속성인 탑에는 같은 속성 카드를 내지 않음
var EL_NATURAL = { flame: 'fire', frost: 'ice', alchemy: 'poison' };
// 탑 전용 카드(tower: 그 탑 종류만)와 전체 카드(tower 없음)
var CARD_DEFS = {
  pierce: { towers: ['archer'], name: '관통샷', desc: '화살이 적 1명을 더 꿰뚫는다. 꿰뚫을 때마다 피해 -30%', max: 2, rare: 1 },
  front: { towers: ['archer'], name: '전방 화살 +1', desc: '앞으로 나가는 화살이 1발 늘어난다(피해 70%)', max: 2, rare: 1 },
  diag: { towers: ['archer'], name: '사선 화살 +1', desc: '좌우 대각선으로 화살을 1발씩 더 쏜다(피해 60%)', max: 2, rare: 1 },
  bounce: { towers: ['archer'], name: '튕기는 화살', desc: '맞힌 화살이 근처 적에게 한 번 더 튕긴다(피해 60%)', max: 2, rare: 0 },
  rapid: { towers: ['archer'], name: '연사', desc: '궁수탑 공격 속도 +20%', max: 3, rare: 0 },
  blast: { towers: ['catapult', 'cannon'], name: '큰 폭발', desc: '폭발 범위 +25%', max: 2, rare: 0 },
  frag: { towers: ['catapult', 'cannon'], name: '파편', desc: '터진 자리에서 작은 파편 3개가 튄다(피해 30%)', max: 2, rare: 1 },
  stun: { towers: ['catapult', 'cannon'], name: '기절탄', desc: '맞은 적이 25% 확률로 0.6초 기절한다', max: 2, rare: 0 },
  lance: { towers: ['ballista'], name: '관통 +2', desc: '노포 화살이 적 2명을 더 꿰뚫는다', max: 3, rare: 0 },
  knock: { towers: ['ballista'], name: '넉백', desc: '맞은 적을 0.3칸 뒤로 밀어낸다(우두머리 제외)', max: 2, rare: 1 },
  ap: { towers: ['ballista'], name: '갑옷 뚫기', desc: '갑옷을 30% 무시한다', max: 2, rare: 0 },
  chainP: { towers: ['arcane'], name: '연쇄 +1', desc: '마법이 근처 적 1명에게 더 튄다(피해 60%)', max: 3, rare: 0 },
  mark: { towers: ['arcane'], name: '증폭 표식', desc: '맞은 적이 3초 동안 모든 피해를 15% 더 받는다', max: 2, rare: 1 },
  freeze: { towers: ['frost'], name: '빙결', desc: '파동이 적을 얼려 멈출 확률과 시간이 늘어난다', max: 2, rare: 0 },
  shard: { towers: ['frost'], name: '얼음 파편', desc: '파동마다 근처 적에게 얼음 파편 2개를 쏜다', max: 2, rare: 1 },
  chill: { towers: ['frost'], name: '한기', desc: '서리탑 둔화 +10%p', max: 2, rare: 0 },
  bellR: { towers: ['bell'], name: '울림 확장', desc: '종탑 기운 범위 +20%', max: 2, rare: 0 },
  bellS: { towers: ['bell'], name: '전투 종소리', desc: '종탑 주변 탑 공격 속도 +10%', max: 2, rare: 0 },
  bellD: { towers: ['bell'], name: '축복', desc: '종탑 주변 탑 피해 +8%p', max: 2, rare: 1 },
  wide: { towers: ['flame'], name: '넓은 불길', desc: '불길 각도 +20도, 사거리 +10%', max: 2, rare: 0 },
  heat: { towers: ['flame'], name: '고열', desc: '화염탑 화상 피해 +40%', max: 3, rare: 0 },
  spread: { towers: ['flame'], name: '불씨 옮기기', desc: '불타던 적이 쓰러지면 주변 적에게 불이 옮는다', max: 1, rare: 1 },
  cloud: { towers: ['alchemy'], name: '큰 독구름', desc: '독구름 범위 +25%, 지속 +1초', max: 2, rare: 0 },
  acid: { towers: ['alchemy'], name: '강산', desc: '갑옷 깎기 +10%p', max: 2, rare: 0 },
  twin: { towers: ['alchemy'], name: '두 병 던지기', desc: '플라스크를 다른 적에게 1개 더 던진다', max: 1, rare: 1 },
  vault: { towers: ['mint'], name: '두둑한 금고', desc: '조폐소가 웨이브마다 만드는 금화 +25%', max: 3, rare: 0 },
  interest: { towers: ['mint'], name: '이자', desc: '웨이브마다 가진 금화의 2%를 더 받는다(최대 40)', max: 2, rare: 0 },
  g_spd: { name: '빠른 손', desc: '모든 탑 공격 속도 +15%', max: 2, rare: 0 },
  g_crit: { name: '날카로운 눈', desc: '모든 공격 탑 치명타 확률 +10%(피해 2배)', max: 3, rare: 0 },
  g_rng: { name: '높은 망루', desc: '모든 탑 사거리 +10%', max: 2, rare: 0 },
  g_gold: { name: '전리품', desc: '처치 금화 +20%', max: 2, rare: 0 },
  g_life: { name: '성벽 수리', desc: '성 생명 +3', max: 3, rare: 0 },
  g_boss: { name: '거인 사냥꾼', desc: '우두머리에게 주는 피해 +20%', max: 2, rare: 1 },
  g_dot: { name: '불과 독 연구', desc: '모든 화상과 독 피해 +30%', max: 2, rare: 1 }
};
// 숨은 조합: 같은 탑 종류에 a와 b가 함께 있으면 켜짐('el:fire'는 그 탑의 속성이 불). 한 판에 한 번 'combo' 사건
var COMBOS = [
  { id: 'fireLine', towers: ['archer'], a: 'pierce', b: 'el:fire', name: '불꽃길', desc: '불화살이 꿰뚫을 때마다 길 위에 불꽃 자국이 남는다' },
  { id: 'fan', towers: ['archer'], a: 'front', b: 'diag', name: '부채꼴 사격', desc: '화살이 부채꼴로 5발 넘게 퍼진다' },
  { id: 'thunderBounce', towers: ['archer'], a: 'bounce', b: 'el:bolt', name: '번개 튕김', desc: '화살이 튕길 때마다 번개가 친다' },
  { id: 'toxicBlast', towers: ['catapult', 'cannon'], a: 'blast', b: 'el:poison', name: '독 폭탄', desc: '폭발한 자리에 독구름이 남는다' },
  { id: 'fireworks', towers: ['catapult', 'cannon'], a: 'frag', b: 'el:fire', name: '불꽃놀이', desc: '파편이 떨어진 자리가 불탄다' },
  { id: 'iceBurst', towers: ['frost'], a: 'chill', b: 'shard', name: '얼음 폭발', desc: '얼음 파편이 터지며 주변 적을 얼린다' },
  { id: 'thunderChain', towers: ['arcane'], a: 'chainP', b: 'el:bolt', name: '천둥 사슬', desc: '연쇄 마법에 맞은 적이 잠깐 기절한다' },
  { id: 'iceLance', towers: ['ballista'], a: 'lance', b: 'el:ice', name: '얼음 창', desc: '노포에 꿰뚫린 적이 잠깐 얼어붙는다' },
  { id: 'wildfire', towers: ['flame'], a: 'wide', b: 'spread', name: '들불', desc: '쓰러진 적 자리에 불꽃 장판이 생긴다' },
  { id: 'bog', towers: ['alchemy'], a: 'cloud', b: 'acid', name: '부식 늪', desc: '독구름이 적을 30% 느리게 한다' }
];
