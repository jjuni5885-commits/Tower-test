// ===== tf_eras.js : 타임플렉스 2~15장 시대 자료 (시대 탑, 시대 적 명단) =====
// 적은 기존 적 하나를 '틀'로 삼아 능력과 수치를 그대로 가져오고 이름, 설명, 그림만 바꾼다(tfE).
//  그림: tf_art_enemy2.js에 EN_DRAW[키]가 있으면 새 그림, 없으면 art(기본은 틀의 그림)
//  역할(role): basic 기본, fast 빠름, air 하늘, armor 갑옷, stealth 은신, healer 치유, tank 큰 적, sea 바다, boss 우두머리, x1 x2 그 시대 특수
// 탑은 기존 탑의 공격 방식(kind)을 빌린 새 탑(그림은 tf_art_tower2.js), 귀여운 옛 탑은 시대 99(시간 초월에서만)
function tfE(k, tpl, ch, o) {
  var T = ENEMIES[tpl], E = JSON.parse(JSON.stringify(T)), tch = T.ch || 1;
  delete E.name; delete E.desc; delete E.weak; delete E.hidden;
  E.die = T.die || (tch === 3 ? 'boom' : tch === 4 ? 'ink' : tch === 2 ? 'ghost' : 'poof');
  if (tch === 4 && !E.ghost && !E.yokai && !E.mech) E.spirit = 1;
  E.art = o.art || T.art || tpl; E.tpl = tpl;
  for (var q in o) if (q !== 'art') E[q] = o[q];
  E.ch = ch; E.tf = 1; ENEMIES[k] = E; ENEMY_ORDER.push(k);
  return E;
}
var TF_ROSTER = {};
(function () {
  function R(ch, list) { var r = {}; list.forEach(function (q) { var k = q[0], role = q[1], tpl = q[2], o = q[3]; tfE(k, tpl, ch, o); (r[role] = r[role] || []).push(k); }); TF_ROSTER[ch] = r; }
  // 2 황금 사막의 강
  R(2, [
    ['eg_spear', 'basic', 'orc', { name: '사막 창병', desc: '줄무늬 두건을 쓴 창병. 떼로 몰려온다.', die: 'poof' }],
    ['eg_scorp', 'fast', 'wolf', { name: '거대 전갈', desc: '모래 위를 빠르게 기어 온다. 불에 약하다.', weakEl: ['fire'] }],
    ['eg_vulture', 'air', 'bats', { name: '독수리 떼', desc: '하늘에서 무리 지어 내려온다. 범위 공격으로 한꺼번에.', art: 'crows', die: 'poof' }],
    ['eg_sphinx', 'armor', 'guard', { name: '스핑크스 석상', desc: '돌 몸이 앞에서 오는 공격을 막는다. 옆이나 뒤에서, 또는 마법으로.' }],
    ['eg_ghost', 'stealth', 'phantom', { name: '사막 망령', desc: '모래바람 속에서 잠깐씩 사라진다.', stealth: 1 }],
    ['eg_priest', 'healer', 'shaman', { name: '저주 사제', desc: '주변 적의 상처를 낫게 한다. 먼저 잡아라.', die: 'poof' }],
    ['eg_mummy', 'tank', 'mummy', { name: '왕의 미라', desc: '쓰러지면 황금 풍뎅이 넷이 흩어진다. 불에 약하다.', split: ['eg_scarab', 4] }],
    ['eg_scarab', 'x1', 'scarab', { name: '황금 풍뎅이', desc: '아주 빠른 작은 벌레 떼.' }],
    ['eg_boat', 'sea', 'raft', { name: '파피루스 배', desc: '나일강을 타고 내려온다.' }],
    ['eg_pharaoh', 'boss', 'count', { name: '저주받은 파라오', desc: '때때로 풍뎅이 떼로 흩어졌다가 다시 모인다. 흩어질 때 범위 공격으로.', acts: [{ k: 'scatter', cd: 12, sec: 3, spd: 1.8, type: 'eg_scarab', n: 4 }, { k: 'drain', cd: 8, r: 2.8, n: 2, sec: 2, heal: 0.04 }], die: 'ghost' }]
  ]);
  // 3 대리석 제국
  R(3, [
    ['ro_legion', 'basic', 'guard', { name: '방패 군단병', desc: '큰 방패로 앞을 막는다. 화살은 막히고 마법과 범위 공격이 통한다.', hp: 160, gold: 12, size: 0.62, die: 'poof' }],
    ['ro_horse', 'fast', 'wolf', { name: '기병', desc: '말을 타고 빠르게 돌파한다.', hp: 170, gold: 14, size: 0.8, die: 'poof' }],
    ['ro_eagle', 'air', 'bat', { name: '군단 독수리', desc: '군기를 단 독수리가 날아온다.', art: 'crows', hp: 120, gold: 10, die: 'poof' }],
    ['ro_glad', 'armor', 'werewolf', { name: '검투사', desc: '체력이 절반 아래로 떨어지면 미쳐 날뛰며 빨라진다.', die: 'poof' }],
    ['ro_spy', 'stealth', 'stalker', { name: '그림자 첩자', desc: '망토로 몸을 숨긴다. 탐지 탑이나 탑 곁에서만 보인다.', art: 'stalker', die: 'poof' }],
    ['ro_medic', 'healer', 'shaman', { name: '군의관', desc: '다친 병사를 치료한다.', hp: 260, gold: 24, die: 'poof' }],
    ['ro_eleph', 'tank', 'troll', { name: '전투 코끼리', desc: '등의 망루에 탄 군단병 둘이 쓰러질 때 뛰어내린다.', hp: 1500, carry: [['ro_legion', 2]], regen: 0, size: 1.15 }],
    ['ro_galley', 'sea', 'pirate', { name: '갤리선', desc: '노 젓는 군선이 강을 거슬러 온다.', hp: 420, gold: 50, die: 'boom' }],
    ['ro_tyrant', 'boss', 'grumsh', { name: '폭군 황제', desc: '전차를 탄 황제가 군단을 부른다. 함성이 들리면 주변 적이 빨라진다.', hp: 9000, die: 'poof' }]
  ]);
  // 4 붉은 강의 결전
  R(4, [
    ['tk_spear', 'basic', 'soldier', { name: '창병', desc: '긴 창을 든 대군의 앞줄.', art: 'tk_spear', hp: 160, gold: 11, die: 'poof', kin: 'human', mech: 0 }],
    ['tk_cav', 'fast', 'ghoul', { name: '기마병', desc: '말을 박차고 뛰어넘는다.', hp: 200, gold: 15, size: 0.8, die: 'poof' }],
    ['tk_kite', 'air', 'bats', { name: '불 연', desc: '불씨를 매단 연 떼.', art: 'wisp', hp: 90, gold: 6 }],
    ['tk_shield', 'armor', 'guard', { name: '등패병', desc: '등나무 방패로 앞을 막는다.', hp: 420, gold: 34, die: 'poof' }],
    ['tk_ninja', 'stealth', 'stalker', { name: '야습대', desc: '밤에 몰래 숨어 든다.', hp: 240, gold: 22, die: 'poof' }],
    ['tk_drum', 'healer', 'tal', { name: '북 치는 고수', desc: '북소리로 주변 적을 빠르게 한다. 먼저 잡아라.', die: 'poof' }],
    ['tk_tower', 'tank', 'wagon', { name: '공성 누차', desc: '창병 셋을 태운 높은 누각 수레.', art: 'ca_tower', hp: 1600, carry: [['tk_spear', 3]], gold: 70 }],
    ['tk_junk', 'sea', 'pirate', { name: '전선', desc: '돛을 단 큰 배가 강을 건너온다.', hp: 600, die: 'boom' }],
    ['tk_general', 'boss', 'duryeok', { name: '천하무적 맹장', desc: '큰 칼로 땅을 내리쳐 탑을 멈추고 창병을 부른다. 내리칠 자리가 빛나면 탑을 나눠라.', hp: 15000, acts: [{ k: 'summon', cd: 8, type: 'tk_spear', n: 3 }, { k: 'slam', cd: 10, r: 2.2, stun: 2, tele: 1.2 }], die: 'poof', yokai: 0, spirit: 0 }]
  ]);
  // 5 얼음 바다의 약탈자 (바이킹)
  R(5, [
    ['nr_raider', 'basic', 'dokkaebi', { name: '약탈자', desc: '둥근 투구와 도끼를 든 북쪽의 약탈자.', spirit: 0, yokai: 0, ghost: 0, kin: 'human', die: 'poof' }],
    ['nr_wolf', 'fast', 'gumiho', { name: '서리 늑대', desc: '빠르게 달리며 울음으로 근처 탑 하나를 잠깐 멈춘다.', spirit: 0, yokai: 0, ghost: 0, kin: 'beast', die: 'poof' }],
    ['nr_raven', 'air', 'maiden', { name: '까마귀 떼', desc: '탑 위를 맴돌며 쏘는 손을 늦춘다.', spirit: 0, yokai: 0, ghost: 0, kin: 'beast', die: 'poof' }],
    ['nr_shield', 'armor', 'guard', { name: '방패벽 전사', desc: '큰 원형 방패로 앞을 막는다. 범위 공격과 마법이 통한다.', hp: 420, gold: 34, spirit: 0, die: 'poof' }],
    ['nr_pelt', 'stealth', 'egg', { name: '늑대 가죽 전사', desc: '눈 속에 몸을 숨긴다. 탑 가까이에서만 보인다.', spirit: 0, yokai: 0, ghost: 0, kin: 'human', die: 'poof' }],
    ['nr_horn', 'healer', 'tal', { name: '뿔나팔 전사', desc: '뿔나팔을 불어 주변 적을 빠르게 한다. 먼저 잡아라.', spirit: 0, yokai: 0, ghost: 0, kin: 'human', die: 'poof' }],
    ['nr_troll', 'tank', 'horangi', { name: '서리 트롤', desc: '얼음 몸의 거인. 탑을 뛰어넘어 달려든다.', spirit: 0, yokai: 0, ghost: 0, kin: 'beast', die: 'poof' }],
    ['nr_wisp', 'x1', 'wisp', { name: '오로라 정령', desc: '하늘을 나는 작은 빛.' }],
    ['nr_ship', 'sea', 'pirate', { name: '긴 배', desc: '용머리 긴 배가 피오르를 거슬러 온다.', hp: 380, die: 'boom', spirit: 0 }],
    ['nr_giant', 'boss', 'duryeok', { name: '서리 거인 왕', hp: 11000, desc: '얼음 도끼로 땅을 내리쳐 탑을 멈추고 약탈자를 부른다.', spirit: 0, die: 'poof', acts: [{ k: 'summon', cd: 8, type: 'nr_raider', n: 3 }, { k: 'slam', cd: 10, r: 2.2, stun: 2, tele: 1.2, fx: 'water' }] }]
  ]);
  // 6 성벽의 시대
  R(6, [
    ['ca_foot', 'basic', 'soldier', { name: '창 보병', desc: '사슬 갑옷의 보병.', hp: 230, gold: 14, die: 'poof', kin: 'human' }],
    ['ca_rider', 'fast', 'werewolf', { name: '기사 기병', desc: '창을 겨누고 돌격한다. 다치면 더 빨라진다.', die: 'poof' }],
    ['ca_gargoyle', 'air', 'gargoyle', { name: '돌 가고일', desc: '돌 날개로 날아온다. 단단하다.' }],
    ['ca_knight', 'armor', 'mirror', { name: '흑기사', desc: '거울 같은 갑옷이 마법을 튕겨 낸다. 물리 공격으로.', die: 'poof' }],
    ['ca_thief', 'stealth', 'phantom', { name: '성벽 침입자', desc: '그림자 속에서 사라졌다 나타난다.', die: 'poof' }],
    ['ca_monk', 'healer', 'witch', { name: '수도사', desc: '주변을 치료하고 탑에 저주를 건다.', fly: 0, dom: 'g', die: 'poof' }],
    ['ca_ram', 'tank', 'tank', { name: '파성추', desc: '무거운 통나무로 성문을 들이받는다.', acts: [], kin: 'machine', die: 'boom' }],
    ['ca_tower', 'x1', 'apc', { name: '공성탑', desc: '쓰러지면 보병 넷이 쏟아진다.', carry: [['ca_foot', 4]] }],
    ['ca_boat', 'sea', 'pirate', { name: '해자 뗏목', desc: '해자를 건너는 큰 뗏목.', hp: 620, die: 'boom' }],
    ['ca_giant', 'boss', 'yotun', { name: '강철 거인 기사', desc: '얼음 같은 갑옷의 거인. 주변 탑을 얼린다. 마법이 잘 통한다.', die: 'poof' }]
  ]);
  // 7 대항해의 바다
  R(7, [
    ['sa_pirate', 'basic', 'soldier', { name: '해적', desc: '굽은 칼을 든 해적.', hp: 220, gold: 14, die: 'poof', kin: 'human' }],
    ['sa_parrot', 'air', 'bats', { name: '앵무새 떼', desc: '시끄럽게 몰려드는 앵무새.', art: 'crows' }],
    ['sa_runner', 'fast', 'wolf', { name: '갑판 돌격대', desc: '밧줄을 타고 빠르게 뛰어든다.', art: 'sa_pirate', hp: 200, gold: 14, die: 'poof' }],
    ['sa_cart', 'tank', 'apc', { name: '대포 수레', desc: '쓰러지면 해적 셋이 뛰어내린다.', art: 'ca_ram', carry: [['sa_pirate', 3]] }],
    ['sa_shark', 'x1', 'boat', { name: '상어', desc: '바닷길을 빠르게 헤엄쳐 온다.', die: 'poof', mech: 0, kin: 'beast' }],
    ['sa_brute', 'armor', 'guard', { name: '갑판장', desc: '두꺼운 가죽 갑옷의 거한.', die: 'poof' }],
    ['sa_ghost', 'stealth', 'saja', { name: '유령 선원', desc: '순간 이동하며 다가온다.' }],
    ['sa_cook', 'healer', 'shaman', { name: '선상 요리사', desc: '주변 해적을 먹여 회복시킨다.', hp: 300, gold: 26, die: 'poof' }],
    ['sa_ship', 'sea', 'destroyer', { name: '해적선', desc: '대포를 쏘아 탑을 멈춘다.', die: 'boom' }],
    ['sa_ghostship', 'x1', 'submarine', { name: '유령선', desc: '안개 속에 잠겼다 떠오른다. 떠올랐을 때 맞혀라.', die: 'ghost' }],
    ['sa_kraken', 'boss', 'imugi', { name: '크라켄', desc: '촉수로 바다를 내리쳐 탑을 멈춘다.', morph: null, hp: 30000, die: 'ink', acts: [{ k: 'slam', cd: 9, r: 3, stun: 2, tele: 1.4, fx: 'water' }, { k: 'summon', cd: 12, type: 'sa_shark', n: 2 }] }]
  ]);
  // 8 조선의 바다와 성
  R(8, [
    ['jo_raider', 'basic', 'dokkaebi', { name: '바다 약탈자', desc: '바다를 건너온 약탈자 무리.', yokai: 0, spirit: 0, yokai: 0, ghost: 0, kin: 'human', die: 'poof' }],
    ['jo_fox', 'fast', 'gumiho', { name: '구미호', desc: '빠르고 공격을 피하며 탑을 홀린다.' }],
    ['jo_crow', 'air', 'crows', { name: '까마귀 떼', desc: '까마귀가 떼로 날아온다.' }],
    ['jo_bulga', 'armor', 'bulgasari', { name: '불가사리', desc: '쇠를 먹는 괴물. 불에 아주 약하다.' }],
    ['jo_egg', 'stealth', 'egg', { name: '달걀귀신', desc: '탑에서 멀리 있으면 보이지 않는다.' }],
    ['jo_tal', 'healer', 'tal', { name: '탈광대', desc: '주변 적을 빠르게 한다.' }],
    ['jo_tiger', 'tank', 'horangi', { name: '창귀 호랑이', desc: '탑을 뛰어넘는다.' }],
    ['jo_ship', 'sea', 'pirate', { name: '약탈선', desc: '바다를 건너온 큰 배.' }],
    ['jo_imugi', 'boss', 'imugi', { name: '이무기', desc: '물을 내리쳐 탑을 멈추고 까마귀를 부른다. 체력이 절반이 되면 먹구름 용으로 변해 하늘로 오른다.', morph: { to: 'jo_yong', hp: 0.5 }, acts: [{ k: 'slam', cd: 9, r: 3, stun: 2, tele: 1.4, fx: 'water' }, { k: 'summon', cd: 12, type: 'jo_crow', n: 3 }] }]
  ]);
  // 9 참호의 시대
  R(9, [
    ['tr_rifle', 'basic', 'soldier', { name: '돌격 보병', desc: '참호를 넘어 돌격한다.', art: 'tr_rifle' }],
    ['tr_horse', 'fast', 'biker', { name: '전령 기병', desc: '참호 사이를 빠르게 달린다.', art: 'ro_horse', mech: 0, kin: 'beast', die: 'poof' }],
    ['tr_plane', 'air', 'jet', { name: '복엽기', desc: '날개가 두 겹인 전투기. 대공 무기로.', spd: 2.2, hp: 260 }],
    ['tr_mk1', 'armor', 'apc', { name: '초기 전차', desc: '마름모꼴 강철 전차. 쓰러지면 보병이 나온다.', carry: [['tr_rifle', 3]] }],
    ['tr_gas', 'stealth', 'phantom', { name: '독가스 부대', desc: '가스 구름 속에서 사라졌다 나타난다.', art: 'tr_gas', kin: 'human', die: 'poof', ghost: 0 }],
    ['tr_medic', 'healer', 'truck', { name: '구급차', desc: '주변을 고친다.', art: 'truck' }],
    ['tr_tractor', 'tank', 'wagon', { name: '포병 견인차', desc: '대포를 끄는 무거운 차. 체력이 아주 많다.', art: 'truck', mech: 1, die: 'boom', carry: [['tr_rifle', 3]] }],
    ['tr_zep', 'x1', 'bomber', { name: '비행선', desc: '폭탄을 떨어뜨려 탑을 멈춘다.', spd: 0.6, hp: 2400, lane: 0 }],
    ['tr_boat', 'sea', 'boat', { name: '포함', desc: '강을 거슬러 오는 작은 군함.' }],
    ['tr_landship', 'boss', 'bigtank', { name: '육상 전함', desc: '참호를 짓밟는 거대한 강철 차. 포탄으로 탑을 멈춘다.' }]
  ]);
  // 10 철의 해안
  R(10, [
    ['st_rifle', 'basic', 'soldier', { name: '상륙 보병', desc: '해안으로 밀려드는 보병.' }],
    ['st_jeep', 'fast', 'jeep', { name: '정찰 지프', desc: '빠르게 달린다.' }],
    ['st_fighter', 'air', 'jet', { name: '전투기', desc: '빠르게 지나간다. 대공 무기로.' }],
    ['st_tank', 'armor', 'tank', { name: '전차', desc: '포탄으로 탑을 멈춘다.' }],
    ['st_sniper', 'stealth', 'stalker', { name: '위장 저격병', desc: '수풀에 숨어 다가온다.', art: 'soldier', hp: 300, gold: 24 }],
    ['st_supply', 'healer', 'truck', { name: '보급 트럭', desc: '주변을 고친다.' }],
    ['st_ht', 'tank', 'apc', { name: '반궤도 장갑차', desc: '쓰러지면 보병 셋이 내린다.', carry: [['st_rifle', 3]] }],
    ['st_bomber', 'x1', 'bomber', { name: '폭격기', desc: '폭탄을 떨어뜨려 탑을 멈춘다.' }],
    ['st_landing', 'sea', 'boat', { name: '상륙정', desc: '해안으로 빠르게 다가온다.' }],
    ['st_sub', 'x1', 'submarine', { name: '잠수함', desc: '잠수했다 떠오른다.' }],
    ['st_super', 'boss', 'bigtank', { name: '초중전차', desc: '거대한 포탑 둘의 전차.' }]
  ]);
  // 11 얼어붙은 고지
  R(11, [
    ['wi_rifle', 'basic', 'soldier', { name: '설원 보병', desc: '눈보라 속에서 밀려온다.' }],
    ['wi_bike', 'fast', 'biker', { name: '설상 정찰병', desc: '빠르게 달린다. 얼음에 약하다.' }],
    ['wi_heli', 'air', 'heli', { name: '공격 헬기', desc: '산 위로 날아온다.' }],
    ['wi_apc', 'armor', 'apc', { name: '장갑차', desc: '쓰러지면 보병 넷이 나온다.', carry: [['wi_rifle', 4]] }],
    ['wi_ghost', 'stealth', 'stalker', { name: '설원 매복병', desc: '흰 위장으로 숨어 다가온다.', art: 'soldier', hp: 320, gold: 24 }],
    ['wi_truck', 'healer', 'truck', { name: '수리 트럭', desc: '주변을 고친다.' }],
    ['wi_tank', 'tank', 'tank', { name: '설원 전차', desc: '포탄으로 탑을 멈춘다.' }],
    ['wi_boat', 'sea', 'boat', { name: '강 고속정', desc: '언 강 사이 물길로 달려온다.' }],
    ['wi_fortress', 'boss', 'fortress', { name: '공중 요새', desc: '드론을 쏟아 내고 폭탄을 떨어뜨린다.', acts: [{ k: 'summon', cd: 8, type: 'wi_heli', n: 2 }, { k: 'bomb', cd: 5, r: 1.9, stun: 2 }] }]
  ]);
  // 12 정글 강
  R(12, [
    ['ju_rifle', 'basic', 'soldier', { name: '정글 보병', desc: '수풀을 헤치고 나온다.' }],
    ['ju_bike', 'fast', 'biker', { name: '오토바이 부대', desc: '정글 길을 달린다.' }],
    ['ju_heli', 'air', 'heli', { name: '헬기', desc: '나무 위로 날아온다.' }],
    ['ju_croc', 'armor', 'bulgasari', { name: '늪 악어', desc: '두꺼운 가죽. 불에 약하다.', art: 'ju_croc', yokai: 0, spirit: 0, yokai: 0, ghost: 0, kin: 'beast', die: 'poof' }],
    ['ju_tunnel', 'stealth', 'egg', { name: '땅굴병', desc: '땅굴로 숨어 다닌다. 탑 가까이에서만 보인다.', art: 'soldier', ghost: 0, kin: 'human', die: 'poof' }],
    ['ju_truck', 'healer', 'truck', { name: '보급 트럭', desc: '주변을 고친다.' }],
    ['ju_apc', 'tank', 'apc', { name: '장갑차', desc: '쓰러지면 보병이 나온다.', carry: [['ju_rifle', 4]] }],
    ['ju_boat', 'sea', 'boat', { name: '강 순찰정', desc: '강을 빠르게 달린다.' }],
    ['ju_gunship', 'boss', 'carrier', { name: '강의 포함', hp: 15000, desc: '헬기를 띄우고 포를 쏜다.', acts: [{ k: 'launch', cd: 9, type: 'ju_heli', n: 2 }, { k: 'shell', cd: 7, r: 3.6, n: 1, stun: 1.8, br: 0.45 }] }]
  ]);
  // 13 모래 폭풍
  R(13, [
    ['du_rifle', 'basic', 'soldier', { name: '사막 보병', desc: '모래바람 속 보병.' }],
    ['du_jeep', 'fast', 'jeep', { name: '무장 지프', desc: '빠르게 달린다.' }],
    ['du_drone', 'air', 'drone', { name: '첫 드론', desc: '작은 드론 떼. 전기에 약하다.' }],
    ['du_tank', 'armor', 'tank', { name: '사막 전차', desc: '포탄으로 탑을 멈춘다.' }],
    ['du_missile', 'stealth', 'missile', { name: '순항 미사일', desc: '경고 뒤 곧장 날아온다. 대공 무기로.' }],
    ['du_truck', 'healer', 'truck', { name: '정비 트럭', desc: '주변을 고친다.' }],
    ['du_mech', 'tank', 'mech', { name: '보행 로봇', desc: '방어막을 켠다. 전기에 약하다.' }],
    ['du_boat', 'sea', 'boat', { name: '고속정', desc: '빠르게 달린다.' }],
    ['du_king', 'boss', 'bigtank', { name: '사막의 강철 왕', desc: '거대한 전차. 포탄으로 탑을 멈춘다.' }]
  ]);
  // 14 최첨단 전선
  R(14, [
    ['cy_drone', 'basic', 'drone', { name: '자폭 드론', desc: '떼로 몰려온다.', fly: 0, dom: 'g', hp: 160, gold: 8 }],
    ['cy_bike', 'fast', 'biker', { name: '광속 바이크', desc: '아주 빠르다.', hp: 300 }],
    ['cy_swarm', 'air', 'drone', { name: '드론 떼', desc: '하늘을 덮는 드론. 전기에 약하다.', hp: 120 }],
    ['cy_mech', 'armor', 'mech', { name: '전투 로봇', desc: '방어막을 켠다.' }],
    ['cy_cloak', 'stealth', 'stalker', { name: '광학 위장병', desc: '빛을 굽혀 보이지 않는다.', art: 'soldier', hp: 420, gold: 28 }],
    ['cy_fixer', 'healer', 'truck', { name: '수리 로봇', desc: '주변을 고친다.' }],
    ['cy_missile', 'x1', 'missile', { name: '극초음속 미사일', desc: '경고 뒤 곧장 날아온다.' }],
    ['cy_boat', 'sea', 'boat', { name: '무인 고속정', desc: '빠르게 달린다.' }],
    ['cy_tank', 'tank', 'tank', { name: '레일건 전차', desc: '포탄으로 탑을 멈춘다.' }],
    ['cy_titan', 'boss', 'titan', { name: '강철 거신', desc: '방어막과 포탄을 번갈아 쓴다. 전기에 약하다.' }]
  ]);
  // 15 별의 전쟁
  R(15, [
    ['sp_grunt', 'basic', 'soldier', { name: '외계 병사', desc: '빛나는 총을 든 외계 병사.', art: 'sp_grunt', kin: 'alien', die: 'poof' }],
    ['sp_hopper', 'fast', 'ghoul', { name: '외계 사냥개', desc: '탑을 뛰어넘는다.', art: 'sp_grunt', hp: 320, gold: 16 }],
    ['sp_saucer', 'air', 'heli', { name: '비행접시', desc: '하늘을 미끄러지듯 난다.', art: 'sp_saucer', die: 'boom' }],
    ['sp_walker', 'armor', 'mech', { name: '외계 보행기', desc: '방어막을 켠다. 전기에 약하다.', art: 'sp_walker' }],
    ['sp_cloak', 'stealth', 'stalker', { name: '그림자 외계인', desc: '보이지 않게 다가온다.', art: 'sp_grunt', hp: 460, gold: 28 }],
    ['sp_blob', 'healer', 'golemL', { name: '분열 점액', desc: '쓰러지면 작은 점액 둘로 나뉜다.', art: 'sp_blob', split: ['sp_blobS', 2], hp: 900, gold: 40 }],
    ['sp_blobS', 'x1', 'golemM', { name: '작은 점액', desc: '분열한 점액.', art: 'sp_blob', split: null, size: 0.6 }],
    ['sp_crusher', 'tank', 'tank', { name: '외계 분쇄기', desc: '빛의 포탄으로 탑을 멈추는 무거운 보행기.', art: 'sp_walker', kin: 'alien', hp: 1500 }],
    ['sp_cruiser', 'x1', 'bomber', { name: '외계 순양함', desc: '폭탄을 떨어뜨려 탑을 멈춘다.', art: 'sp_saucer', hp: 2600, lane: 0, spd: 0.6 }],
    ['sp_ray', 'sea', 'boat', { name: '우주 가오리', desc: '빛의 강을 헤엄쳐 온다.', art: 'sp_saucer' }],
    ['sp_mother', 'boss', 'fortress', { name: '외계 모선', desc: '비행접시를 쏟아 내고 폭탄을 떨어뜨린다. 마지막 시간의 문을 노린다.', art: 'sp_mother', acts: [{ k: 'summon', cd: 8, type: 'sp_saucer', n: 3 }, { k: 'bomb', cd: 5, r: 1.9, stun: 2 }] }]
  ]);
  ENEMIES.sp_blobS.size = 0.6;
})();

// ---------- 시대 탑 (2~7장, 15장) ----------
(function () {
  function C(k, tpl, era, name, short, col, desc, a, au, ad, b, bu, bd, mod) {
    var T = tfClone(TOWERS[tpl]); T.name = name; T.short = short; T.col = col; T.era = era; T.desc = desc; T.tfTpl = tpl;
    if (T.br && T.br[0]) { T.br[0].name = a; T.br[0].ult = au; T.br[0].desc = ad; }
    if (T.br && T.br[1]) { T.br[1].name = b; T.br[1].ult = bu; T.br[1].desc = bd; }
    if (mod) mod(T);
    TOWERS[k] = T; TOWER_ORDER.push(k);
  }
  C('chariot', 'archer', 2, '전차 궁수대', '전차 궁수', '#d9a24a', '바퀴 달린 전차 위 궁수. 하늘과 강도 맞힌다.', '황금 전차', '태양의 전차', '멀리서 무거운 화살로 치명타, 숨은 적을 본다.', '쌍두 전차', '전차 군단', '두 궁수가 쉬지 않고 쏜다.');
  C('obelisk', 'arcane', 2, '태양 오벨리스크', '오벨리스크', '#ffcf5a', '태양 빛을 모아 쏜다. 갑옷과 방패를 무시하는 마법 공격.', '태양 원반', '라의 눈', '한 점에 강한 빛을 모은다.', '신전 기둥', '태양 신전', '빛이 터져 주변까지 태운다.');
  C('scorpio', 'ballista', 3, '스코르피오 노포', '노포', '#b0473a', '큰 화살이 일직선으로 꿰뚫는다.', '군단 노포', '황제의 노포', '한 발이 줄줄이 꿰뚫는다.', '연속 노포', '노포 포대', '빠르게 연달아 쏜다.');
  C('onager', 'catapult', 3, '오나거', '오나거', '#8a6a4a', '돌을 높이 던져 땅의 적을 한꺼번에 친다.', '무거운 오나거', '성벽 파괴자', '더 큰 돌로 넓게 친다.', '불 항아리', '불의 오나거', '불붙은 항아리를 던진다.');
  C('repeater', 'archer', 4, '연노 진지', '연노', '#c8483a', '화살을 연달아 쏟아붓는 쇠뇌.', '독 연노', '만 발 연노', '빠르게 쏟고 치명타가 터진다.', '불화살 연노', '불 비', '불화살을 쏟는다.', function (T) { T.lv = T.lv.map(function (l) { var o = tfClone(l); o.rate = (o.rate || 1) * 1.5; o.dmg = Math.round((o.dmg || 8) * 0.7); return o; }); });
  C('firecart', 'flame', 4, '화공 수레', '화공', '#ff6a2a', '기름을 뿌려 불을 붙인다. 강 위의 배에도 닿는다.', '불 수레', '적벽의 불', '더 멀리 불을 뿜는다.', '불 항아리 수레', '불바다', '주변에 불 고리를 퍼뜨린다.');
  C('runestone', 'tesla', 5, '룬 비석', '룬 비석', '#7fd8ff', '새긴 룬에서 번개가 일어 적에서 적으로 튄다.', '천둥 룬', '폭풍의 비석', '번개가 더 많이 튄다.', '서리 룬', '오로라 비석', '주변을 번개로 감싼다.');
  C('winterhorn', 'frost', 5, '겨울 뿔나팔', '뿔나팔', '#a8d8ff', '뿔나팔 소리에 냉기가 퍼져 주변 적을 느리게 한다.', '서리 뿔나팔', '혹한의 나팔', '얼려 멈추게 한다.', '눈보라 나팔', '극야의 나팔', '더 넓게 느리게 한다.');
  C('crossbow', 'ballista', 6, '석궁 망루', '석궁', '#6a7a8a', '강철 석궁이 갑옷을 꿰뚫는다.', '중석궁', '성벽 석궁', '한 발이 갑옷을 뚫는다.', '연사 석궁', '석궁 대열', '빠르게 연달아 쏜다.');
  C('trebuchet', 'catapult', 6, '트레뷰셋', '투석기', '#7a5a3a', '평형추로 큰 돌을 아주 멀리 던진다.', '거대 트레뷰셋', '성 파괴자', '더 큰 돌.', '불 트레뷰셋', '불 비', '불붙은 돌을 던진다.', function (T) { T.lv = T.lv.map(function (l) { var o = tfClone(l); o.range = (o.range || 3) + 0.6; return o; }); });
  C('fort', 'cannon', 7, '항구 포대', '포대', '#4a4a5a', '돌 성벽 위 대포. 바다와 땅을 친다.', '해안 거포', '요새 거포', '한 방이 무겁다.', '쌍포 포대', '포대 진지', '두 문이 번갈아 쏜다.');
  C('galleon', 'warship', 7, '갤리온', '갤리온', '#8a5a2a', '물 위에 세우는 범선. 옆으로 대포를 쏜다.', '전열함', '무적 함대', '대포가 더 크다.', '쾌속 범선', '바다의 여왕', '빠르게 쏜다.');
  C('mortar', 'catapult', 12, '박격포 진지', '박격포', '#6a7a4a', '모래주머니 뒤 박격포가 높이 쏘아 땅의 적을 한꺼번에 친다.', '중박격포', '포병 진지', '더 큰 포탄으로 넓게 친다.', '연속 박격포', '탄막', '빠르게 연달아 쏜다.');
  C('orbital', 'laser', 15, '궤도 포대', '궤도포', '#a07bff', '하늘의 위성이 빛줄기를 내리꽂는다.', '집속 궤도포', '항성 창', '한 줄기에 힘을 모은다.', '분산 궤도포', '별빛 폭풍', '여러 줄기로 나눈다.');
})();
TF_ERA_TOWERS[2] = ['chariot', 'obelisk']; TF_ERA_TOWERS[3] = ['scorpio', 'onager', 'barracks']; TF_ERA_TOWERS[4] = ['repeater', 'firecart']; TF_ERA_TOWERS[5] = ['runestone', 'winterhorn'];
TF_ERA_TOWERS[6] = ['crossbow', 'trebuchet']; TF_ERA_TOWERS[7] = ['fort', 'galleon']; TF_ERA_TOWERS[8] = ['singijeon', 'turtle', 'jangseung', 'shrine']; TF_ERA_TOWERS[9] = ['gatling', 'flak'];
TF_ERA_TOWERS[10] = ['rocket', 'airbase', 'warship']; TF_ERA_TOWERS[11] = ['sniper']; TF_ERA_TOWERS[12] = ['mortar']; TF_ERA_TOWERS[13] = ['sam']; TF_ERA_TOWERS[14] = ['laser', 'tesla']; TF_ERA_TOWERS[15] = ['orbital'];
// 귀여운 옛 탑은 시대 고증에서 빼고(시간 초월 전용), 남은 기존 탑은 시대에 맞춤
['archer', 'catapult', 'ballista', 'flame', 'arcane', 'frost', 'alchemy', 'cannon', 'bell', 'mint'].forEach(function (k) { TF_ERA[k] = 99; });
TF_ERA.barracks = 3; TF_ERA.warship = 10;
// 능력 카드: 옛 게임 적 이름을 빼고, 시대 탑도 본보기 탑의 타고난 속성을 그대로
EL_CARD.ice.desc = '맞은 적이 1.5초 동안 25% 느려진다';
if (!EL_NATURAL.bonfire) EL_NATURAL.bonfire = 'fire';
for (var tk in TOWERS) { var tp = TOWERS[tk].tfTpl; if (tp && EL_NATURAL[tp] && !EL_NATURAL[tk]) EL_NATURAL[tk] = EL_NATURAL[tp]; }
// 이무기가 변하는 먹구름 용(판에는 직접 나오지 않음, 우두머리 변신 전용)
tfE('jo_yong', 'yong', 8, { name: '먹구름 용', hp: 16000, desc: '먹구름을 타고 번개로 탑을 멈춘다.', acts: [{ k: 'stun', cd: 6, r: 4, n: 2, sec: 2, rand: 1, fx: 'bolt' }, { k: 'summon', cd: 12, type: 'jo_crow', n: 3 }] });
