// ===== data_enemies2.js : v2.0 2~4장 적 53종 수치와 능력 자료, 영역을 아는 웨이브 생성 (ENG1) =====
// 능력은 자료로 적고 logic_enemies2.js가 해석한다(밸런스는 이 파일 숫자만 고치면 됨).
// 공통 칸: ch 챕터, dom 'g' 땅 | 'a' 하늘 | 's' 바다, lane 항로 비행, kin 종족('undead' | 'ghost' | 'beast' | 'human' | 'machine' | 'yokai'), ghost/yokai/mech 표시(탑 상성용),
//          weak 상성 탑 1~3개, weakEl 약한 속성, die 죽는 연출('boom' | 'ghost' | 'ink' | 'poof'), thr 위협 배수(웨이브 예산용), cap 한 묶음 최대 수, swarm 떼(무리로 나옴)
// 성질 칸: leap 방책과 병사를 뛰어넘음, rise {p, hp, t} 쓰러지면 p 확률로 다시 일어남(불타는 중이면 못 일어남), fadeCyc {on, off} 주기적으로 흐려짐(조명 탑 근처에서는 안 흐려짐),
//          boom {r, stun} 죽으면 터져 주변 탑 기절(얼어 있으면 안 터짐), rage {hp, spd} 체력 hp 아래에서 폭주, morph {to, hp, heal} 체력 hp 아래에서 변신(영역이 바뀜),
//          blinkHit {pct, dist, cd} 한 번에 최대 체력의 pct 이상 맞으면 앞으로 순간 이동, subCyc {up, down} 잠수 주기, hide {near} 길 끝 near칸 전까지 숨음,
//          evade 회피 확률(느려졌거나 기절, 표식, 봉인 중에는 못 피함), grow {rate, max} 살아 있는 동안 커짐(조명 탑 근처에서는 멈춤), haste {r, spd} 주변 적 가속,
//          aaOnly 땅도 치는 범용 탑에게 받는 피해 배수(대공 전용 탑은 그대로), hull 땅 탑에게 받는 피해 배수(수상 탑은 그대로), fireX/boltX 그 속성 피해 배수,
//          smash 방책과 병사를 부수는 배수, shield0 시작 보호막(최대 체력 비율), warn 나타날 때 경고 사건
// 행동 칸: acts [{ k, cd, ... }] 저마다 cd초마다, rot { cd, acts } 차례로 번갈아, phase [{ below, set }] 체력 비율이 below 아래로 내려가면 set의 칸으로 바뀜(spdX 속도 배수)
//   k: 'hex' 저주 | 'charm' 홀림 | 'stun' 기절 {r, sec, n, rand} / 'shell' 포격 {r, n, stun, br} / 'bomb' 폭탄 {r, stun, br} / 'slam' 예고 뒤 광역 기절 {r, stun, tele, fx}
//      'jam' 탑 공격 속도 감소 {r, sec, f} / 'summon' 소환 {type, n} / 'launch' 발진(성문으로 곧게) {type, n, max} / 'clone' 분신 {type, n, hp}
//      'repair' 차량 수리 {r, pct} / 'shield' 보호막 {pct} / 'blink' 순간 이동 {dist} / 'dash' 돌진 {sec, spd} / 'scatter' 박쥐 떼로 흩어짐 {sec, spd, type, n} / 'drain' 흡혈 {r, n, sec, heal}
(function () {
  function put(k, o) { ENEMIES[k] = o; }
  // ---------- 2장 저주받은 밤 ----------
  put('zombie', { name: '좀비', ch: 2, dom: 'g', kin: 'undead', hp: 260, spd: 0.6, gold: 12, leak: 1, size: 0.72, rise: { p: 0.35, hp: 0.5, t: 1.6 }, thr: 1.25, weak: ['flame', 'catapult', 'shrine'], weakEl: ['fire'], die: 'poof',
    desc: '느리지만 질기다. 쓰러져도 가끔 다시 일어난다. 불타는 동안에는 못 일어난다.' });
  put('ghoul', { name: '구울', ch: 2, dom: 'g', kin: 'undead', hp: 150, spd: 1.9, gold: 8, leak: 1, size: 0.6, leap: 1, thr: 1.15, weak: ['frost', 'gatling', 'archer'], weakEl: ['ice'], die: 'poof',
    desc: '빠르게 기어 온다. 방책과 병사를 뛰어넘으니 느리게 만들어 잡아라.' });
  put('phantom', { name: '원혼', ch: 2, dom: 'g', kin: 'ghost', ghost: 1, hp: 180, spd: 1.0, armor: 0.5, mres: -0.2, gold: 10, leak: 1, size: 0.66, fadeCyc: { on: 3, off: 1.6 }, thr: 1.4, weak: ['bell', 'jangseung', 'arcane'], die: 'ghost',
    desc: '흐려지는 동안에는 맞지 않는다. 종탑이나 장승 같은 조명 탑 근처에서는 흐려지지 못한다.' });
  put('pumpkin', { name: '호박머리', ch: 2, dom: 'g', kin: 'undead', hp: 170, spd: 1.1, gold: 9, leak: 1, size: 0.62, boom: { r: 1.3, stun: 2 }, thr: 1.2, weak: ['frost', 'sniper', 'ballista'], weakEl: ['ice'], die: 'boom',
    desc: '쓰러지면 터져서 주변 탑을 기절시킨다. 멀리서 잡거나 얼려서 잡으면 터지지 않는다.' });
  put('bats', { name: '박쥐 떼', ch: 2, dom: 'a', fly: 1, kin: 'beast', hp: 60, spd: 1.9, gold: 3, leak: 1, size: 0.46, swarm: 1, weak: ['flak', 'archer', 'gatling'], die: 'poof',
    desc: '작고 많다. 대공 무기로 쓸어 내라.' });
  put('witch', { name: '마녀', ch: 2, dom: 'a', fly: 1, kin: 'human', hp: 320, spd: 1.0, mres: 0.3, gold: 16, leak: 1, size: 0.7, heal: { r: 1.6, pct: 0.08, cd: 4 }, acts: [{ k: 'hex', cd: 7, r: 2.6, sec: 2.5 }], thr: 1.2, weak: ['sam', 'flak', 'sniper'], die: 'poof',
    desc: '빗자루를 타고 탑 하나를 저주해 멈추고 주변 적을 치유한다. 먼저 떨어뜨려라.' });
  put('mummy', { name: '미라', ch: 2, dom: 'g', kin: 'undead', hp: 420, spd: 0.7, armor: 0.5, gold: 14, leak: 2, size: 0.76, split: ['scarab', 4], fireX: 1.6, weak: ['flame', 'alchemy', 'cannon'], weakEl: ['fire'], die: 'poof',
    desc: '붕대 갑옷이 단단하지만 불에 잘 탄다. 쓰러지면 풍뎅이 떼가 쏟아진다.' });
  put('scarab', { name: '풍뎅이', ch: 2, dom: 'g', kin: 'beast', hp: 35, spd: 2.2, gold: 2, leak: 1, size: 0.45, swarm: 1, weak: ['catapult', 'flame', 'tesla'], die: 'poof',
    desc: '아주 작고 빠르다. 범위 공격으로 쓸어 내라.' });
  put('werewolf', { name: '늑대인간', ch: 2, dom: 'g', kin: 'beast', hp: 480, spd: 1.2, armor: 0.2, gold: 22, leak: 2, size: 0.78, rage: { hp: 0.5, spd: 1.7 }, thr: 1.25, weak: ['sniper', 'frost', 'cannon'], weakEl: ['ice'], die: 'poof',
    desc: '체력이 절반 아래로 떨어지면 폭주해 훨씬 빨라진다. 한 방이 센 탑으로 단숨에 잡아라.' });
  put('vampire', { name: '흡혈귀', ch: 2, dom: 'g', kin: 'undead', hp: 400, spd: 1.1, mres: 0.2, gold: 18, leak: 1, size: 0.72, morph: { to: 'vampbat', hp: 0.5, heal: 0.15 }, thr: 1.35, weak: ['shrine', 'flak', 'arcane'], die: 'ghost',
    desc: '궁지에 몰리면 박쥐로 변신해 하늘로 달아난다. 대공 무기를 준비하라.' });
  put('vampbat', { name: '흡혈귀(박쥐)', ch: 2, dom: 'a', fly: 1, form: 1, art: 'bat', kin: 'undead', hp: 400, spd: 1.8, gold: 18, leak: 1, size: 0.56, weak: ['flak', 'sam', 'archer'], die: 'ghost', desc: '흡혈귀가 변신한 모습.' });
  put('coffin', { name: '관 수레', ch: 2, dom: 'g', kin: 'undead', hp: 700, spd: 0.55, armor: 0.35, gold: 20, leak: 3, size: 0.9, carry: [['zombie', 4]], weak: ['cannon', 'ballista', 'rocket'], die: 'poof',
    desc: '부서지면 좀비 넷이 쏟아져 나온다. 시간의 문에서 먼 곳에서 부숴라.' });
  put('doll', { name: '저주 인형', ch: 2, dom: 'g', kin: 'ghost', ghost: 1, hp: 200, spd: 1.3, gold: 10, leak: 1, size: 0.5, blinkHit: { pct: 0.2, dist: 1.6, cd: 2.5 }, thr: 1.3, weak: ['gatling', 'flame', 'alchemy'], weakEl: ['poison', 'fire'], die: 'ghost',
    desc: '크게 맞으면 앞으로 순간 이동한다. 잘게 여러 번 때리거나 불과 독으로 잡아라.' });
  put('gargoyle', { name: '가고일', ch: 2, dom: 'a', fly: 1, kin: 'yokai', hp: 520, spd: 1.0, armor: 0.6, gold: 24, leak: 2, size: 0.74, weak: ['sam', 'arcane', 'laser'], die: 'boom',
    desc: '하늘을 나는 돌덩이. 화살과 총알은 60% 막으니 유도탄이나 마법으로 잡아라.' });
  put('pumpking', { name: '호박 대왕', ch: 2, dom: 'g', kin: 'undead', boss: 1, hp: 9000, spd: 0.45, armor: 0.2, gold: 400, leak: 20, size: 1.5, weak: ['frost', 'sniper', 'cannon'], die: 'boom',
    acts: [{ k: 'summon', cd: 7, type: 'pumpkin', n: 2 }, { k: 'shell', cd: 9, r: 3.4, n: 1, stun: 2.2, br: 0.6, fx: 'pumpkin' }],
    phase: [{ below: 0.5, set: { acts: [{ k: 'summon', cd: 6, type: 'pumpkin', n: 3 }, { k: 'shell', cd: 8, r: 3.6, n: 2, stun: 2.2, br: 0.6, fx: 'pumpkin' }] } }, { below: 0.25, set: { spdX: 1.3 } }],
    desc: '호박머리를 끝없이 불러내고 호박 폭탄을 던져 탑을 기절시킨다. 체력이 줄수록 거세진다.' });
  put('count', { name: '흡혈 백작', ch: 2, dom: 'g', kin: 'undead', boss: 1, hp: 16000, spd: 0.5, mres: 0.3, gold: 700, leak: 20, size: 1.5, weak: ['shrine', 'flak', 'arcane'], die: 'ghost',
    acts: [{ k: 'scatter', cd: 12, sec: 3, spd: 1.8, type: 'bats', n: 4 }, { k: 'drain', cd: 8, r: 2.8, n: 2, sec: 2, heal: 0.02 }],
    phase: [{ below: 0.4, set: { acts: [{ k: 'scatter', cd: 8, sec: 3, spd: 1.8, type: 'bats', n: 6 }, { k: 'drain', cd: 7, r: 3, n: 3, sec: 2, heal: 0.02 }] } }],
    desc: '박쥐 떼로 흩어지는 동안에는 맞지 않는다. 가까운 탑의 기운을 빨아 멈추고 회복한다.' });
  put('reaper', { name: '사신', ch: 2, dom: 'g', kin: 'ghost', ghost: 1, boss: 1, hp: 30000, spd: 0.42, armor: 0.3, mres: 0.3, gold: 1300, leak: 20, size: 2.0, weak: ['bell', 'shrine', 'laser'], die: 'ghost',
    acts: [{ k: 'slam', cd: 10, r: 2.4, stun: 2.5, tele: 1.3, fx: 'dark' }, { k: 'summon', cd: 11, type: 'phantom', n: 3 }],
    phase: [{ below: 0.5, set: { acts: [{ k: 'slam', cd: 8, r: 2.6, stun: 2.5, tele: 1.3, fx: 'dark' }, { k: 'summon', cd: 10, type: 'phantom', n: 4 }, { k: 'blink', cd: 14, dist: 2 }, { k: 'shield', cd: 12, pct: 0.05 }] } }],
    desc: '큰 낫을 치켜들었다가 휘둘러 주변 탑을 멈추고 원혼을 부른다. 낫을 드는 동안 기절시키면 끊을 수 있다.' });
  // ---------- 3장 강철 전선 ----------
  put('soldier', { name: '보병', ch: 3, dom: 'g', kin: 'human', hp: 200, spd: 1.0, gold: 9, leak: 1, size: 0.56, weak: ['gatling', 'catapult', 'archer'], die: 'poof', desc: '기본 병력. 수가 많다.' });
  put('biker', { name: '오토바이 정찰병', ch: 3, dom: 'g', kin: 'machine', mech: 1, hp: 160, spd: 2.3, gold: 8, leak: 1, size: 0.62, weak: ['frost', 'gatling', 'tesla'], weakEl: ['ice'], die: 'boom', desc: '아주 빠르게 돌파한다. 느리게 만들어 잡아라.' });
  put('jeep', { name: '무장 지프', ch: 3, dom: 'g', kin: 'machine', mech: 1, hp: 380, spd: 1.6, armor: 0.2, gold: 17, leak: 1, size: 0.78, weak: ['cannon', 'rocket', 'tesla'], die: 'boom', desc: '빠르고 가벼운 장갑.' });
  put('apc', { name: '장갑차', ch: 3, dom: 'g', kin: 'machine', mech: 1, hp: 900, spd: 0.8, armor: 0.45, gold: 30, leak: 2, size: 0.92, carry: [['soldier', 4]], weak: ['cannon', 'rocket', 'alchemy'], die: 'boom', desc: '부서지면 보병 넷이 내린다.' });
  put('tank', { name: '전차', ch: 3, dom: 'g', kin: 'machine', mech: 1, hp: 1600, spd: 0.55, armor: 0.65, gold: 75, leak: 3, size: 1.0, acts: [{ k: 'shell', cd: 7, r: 3.2, n: 1, stun: 1.8, br: 0.45 }], thr: 1.15, weak: ['rocket', 'cannon', 'laser'], die: 'boom',
    desc: '중갑. 포격으로 가까운 탑을 기절시킨다. 로켓과 대포, 산으로 갑옷을 뚫어라.' });
  put('mech', { name: '보행 로봇', ch: 3, dom: 'g', kin: 'machine', mech: 1, hp: 1200, spd: 0.8, armor: 0.4, mres: 0.2, gold: 55, leak: 2, size: 0.95, shield0: 0.2, acts: [{ k: 'shield', cd: 9, pct: 0.2 }], boltX: 1.5, thr: 1.2, weak: ['tesla', 'laser', 'arcane'], weakEl: ['bolt'], die: 'boom',
    desc: '전자 보호막을 계속 다시 두른다. 번개에 약하다.' });
  put('truck', { name: '보급 트럭', ch: 3, dom: 'g', kin: 'machine', mech: 1, hp: 600, spd: 0.9, armor: 0.2, gold: 27, leak: 1, size: 0.86, acts: [{ k: 'repair', cd: 2.5, r: 1.8, pct: 0.07 }], thr: 1.5, weak: ['sniper', 'ballista', 'cannon'], die: 'boom',
    desc: '주변 차량을 수리한다. 먼저 잡아라.' });
  put('drone', { name: '드론', ch: 3, dom: 'a', fly: 1, kin: 'machine', mech: 1, hp: 70, spd: 1.8, gold: 3, leak: 1, size: 0.5, swarm: 1, boltX: 1.5, weak: ['flak', 'tesla', 'gatling'], weakEl: ['bolt'], die: 'boom', desc: '떼로 몰려오는 작은 비행체.' });
  put('heli', { name: '공격 헬기', ch: 3, dom: 'a', fly: 1, kin: 'machine', mech: 1, hp: 800, spd: 1.0, armor: 0.4, gold: 36, leak: 2, size: 0.9, weak: ['sam', 'flak', 'gatling'], die: 'boom', desc: '하늘의 장갑. 대공 무기가 필요하다.' });
  put('jet', { name: '전투기', ch: 3, dom: 'a', fly: 1, lane: 1, kin: 'machine', mech: 1, hp: 320, spd: 3.4, gold: 20, leak: 1, size: 0.9, aaOnly: 0.5, cap: 6, weak: ['sam', 'flak', 'airbase'], die: 'boom',
    desc: '항로를 따라 눈 깜짝할 새 지나간다. 대공 전용 무기가 아니면 잘 맞지 않는다.' });
  put('bomber', { name: '폭격기', ch: 3, dom: 'a', fly: 1, lane: 1, kin: 'machine', mech: 1, hp: 1400, spd: 1.1, armor: 0.3, gold: 80, leak: 3, size: 1.15, aaOnly: 0.6, cap: 3, acts: [{ k: 'bomb', cd: 3.2, r: 1.7, stun: 2.2, br: 0.8 }], thr: 1.2, weak: ['sam', 'flak', 'airbase'], die: 'boom',
    desc: '느리지만 지나가는 길의 탑에 폭탄을 떨어뜨려 멈춘다. 항로 초입에서 격추하라.' });
  put('missile', { name: '순항 미사일', ch: 3, dom: 'a', fly: 1, lane: 1, kin: 'machine', mech: 1, hp: 90, spd: 4.0, gold: 6, leak: 2, size: 0.6, warn: 1, cap: 4, thr: 2.2, weak: ['flak', 'sam'], die: 'boom',
    desc: '성에 닿으면 생명 3. 대공 무기로 격추하라.' });
  put('boat', { name: '고속정', ch: 3, dom: 's', kin: 'machine', mech: 1, hp: 300, spd: 1.9, gold: 14, leak: 1, size: 0.7, weak: ['warship', 'turtle', 'gatling'], die: 'boom', desc: '물길로 빠르게 파고든다.' });
  put('destroyer', { name: '구축함', ch: 3, dom: 's', kin: 'machine', mech: 1, hp: 1400, spd: 0.7, armor: 0.4, gold: 80, leak: 3, size: 1.1, hull: 0.65, acts: [{ k: 'shell', cd: 8, r: 3.4, n: 1, stun: 1.8, br: 0.45 }], thr: 1.2, weak: ['warship', 'turtle', 'rocket'], die: 'boom',
    desc: '바다의 중갑. 땅에서 쏜 공격은 65%만 통하고 함포로 탑을 노린다. 수상 탑으로 맞서라.' });
  put('submarine', { name: '잠수함', ch: 3, dom: 's', kin: 'machine', mech: 1, hp: 900, spd: 0.9, armor: 0.3, gold: 42, leak: 2, size: 0.95, subCyc: { up: 4, down: 2.5 }, thr: 1.5, weak: ['warship', 'turtle', 'sniper'], die: 'boom',
    desc: '잠수 중에는 맞지 않는다. 떠오른 동안 화력을 몰아라. 부두 앞에서는 반드시 떠오른다.' });
  put('bigtank', { name: '거대 전차', ch: 3, dom: 'g', kin: 'machine', mech: 1, boss: 1, hp: 14000, spd: 0.4, armor: 0.6, gold: 640, leak: 20, size: 1.9, weak: ['rocket', 'cannon', 'laser'], die: 'boom',
    acts: [{ k: 'shell', cd: 6, r: 3.6, n: 2, stun: 2, br: 0.5, big: 1 }],
    phase: [{ below: 0.6, set: { acts: [{ k: 'shell', cd: 6, r: 3.6, n: 2, stun: 2, br: 0.5, big: 1 }, { k: 'summon', cd: 10, type: 'soldier', n: 3 }] } },
      { below: 0.3, set: { acts: [{ k: 'shell', cd: 5, r: 3.8, n: 2, stun: 2, br: 0.5, big: 1 }, { k: 'summon', cd: 9, type: 'soldier', n: 4 }, { k: 'dash', cd: 12, sec: 4, spd: 1.6 }] } }],
    desc: '쌍포로 탑 둘을 한꺼번에 기절시킨다. 상처를 입으면 보병을 내리고 마지막에는 돌진한다.' });
  put('fortress', { name: '공중 요새', ch: 3, dom: 'a', fly: 1, kin: 'machine', mech: 1, boss: 1, hp: 22000, spd: 0.4, armor: 0.4, gold: 1000, leak: 20, size: 2.1, aaOnly: 0.75, weak: ['sam', 'flak', 'airbase'], die: 'boom',
    acts: [{ k: 'summon', cd: 8, type: 'drone', n: 4 }, { k: 'bomb', cd: 5, r: 1.9, stun: 2.2, br: 0.9 }],
    phase: [{ below: 0.5, set: { acts: [{ k: 'summon', cd: 7, type: 'drone', n: 6 }, { k: 'bomb', cd: 4, r: 2.1, stun: 2.2, br: 0.9 }, { k: 'shield', cd: 12, pct: 0.08 }] } }],
    desc: '하늘에서 드론을 쏟아내고 폭탄을 떨어뜨린다. 대공 전용 무기를 모아라.' });
  put('carrier', { name: '항공모함', ch: 3, dom: 's', kin: 'machine', mech: 1, boss: 1, hp: 26000, spd: 0.35, armor: 0.5, gold: 1180, leak: 20, size: 2.2, hull: 0.7, weak: ['warship', 'turtle', 'sam'], die: 'boom',
    acts: [{ k: 'launch', cd: 9, type: 'jet', n: 2 }, { k: 'shell', cd: 7, r: 3.6, n: 1, stun: 1.8, br: 0.45 }],
    phase: [{ below: 0.5, set: { acts: [{ k: 'launch', cd: 8, type: 'jet', n: 3 }, { k: 'shell', cd: 7, r: 3.6, n: 2, stun: 1.8, br: 0.45 }] } },
      { below: 0.3, set: { acts: [{ k: 'launch', cd: 8, type: 'jet', n: 3 }, { k: 'shell', cd: 7, r: 3.6, n: 2, stun: 1.8, br: 0.45 }, { k: 'launch', cd: 11, type: 'missile', n: 1, max: 4 }] } }],
    desc: '전투기를 계속 띄우고 갑판포로 탑을 노린다. 궁지에 몰리면 순항 미사일을 쏜다.' });
  put('titan', { name: '강철 거신', ch: 3, dom: 'g', kin: 'machine', mech: 1, boss: 1, hp: 42000, spd: 0.38, armor: 0.5, mres: 0.3, gold: 1900, leak: 20, size: 2.2, boltX: 1.3, weak: ['tesla', 'laser', 'rocket'], weakEl: ['bolt'], die: 'boom',
    rot: { cd: 8, acts: [{ k: 'shield', pct: 0.08 }, { k: 'shell', r: 4.2, n: 4, stun: 1.8, br: 0.45, rand: 1, fx: 'missile' }, { k: 'slam', r: 2.8, stun: 2.5, tele: 1.5, fx: 'emp' }] },
    phase: [{ below: 0.5, set: { rotCd: 6 } }, { below: 0.2, set: { rotCd: 5, spdX: 1.2 } }],
    desc: '보호막, 미사일 일제 사격, 전자기 충격을 번갈아 쓴다. 충격을 모으는 동안 기절시키면 끊을 수 있다.' });
  // ---------- 4장 도깨비 고개 ----------
  put('dokkaebi', { name: '도깨비', ch: 4, dom: 'g', kin: 'yokai', yokai: 1, hp: 240, spd: 1.0, gold: 11, leak: 1, size: 0.66, smash: 2.5, weak: ['archer', 'catapult', 'shrine'], die: 'ink',
    desc: '방망이를 든 장난꾸러기 요괴. 방책과 병사를 금세 두들겨 부순다.' });
  put('wisp', { name: '도깨비불', ch: 4, dom: 'a', fly: 1, kin: 'ghost', ghost: 1, hp: 80, spd: 2.0, gold: 3, leak: 1, size: 0.45, swarm: 1, fireImm: 1, iceWeak: 2, weak: ['flak', 'frost', 'shrine'], weakEl: ['ice'], die: 'ghost',
    desc: '작고 빠른 푸른 불. 불은 통하지 않고 얼음에 두 배로 약하다.' });
  put('egg', { name: '달걀귀신', ch: 4, dom: 'g', kin: 'ghost', ghost: 1, hp: 220, spd: 1.1, gold: 11, leak: 1, size: 0.6, hide: { near: 4.5 }, thr: 1.35, weak: ['bell', 'jangseung', 'sniper'], die: 'ghost',
    desc: '시간의 문 가까이 올 때까지 보이지 않는다. 종탑이나 장승, 숨은 적을 보는 탑으로 드러내라.' });
  put('maiden', { name: '처녀귀신', ch: 4, dom: 'a', fly: 1, kin: 'ghost', ghost: 1, hp: 360, spd: 1.0, mres: 0.3, gold: 17, leak: 1, size: 0.7, acts: [{ k: 'jam', cd: 7, r: 2.2, sec: 3, f: 0.4 }], thr: 1.25, weak: ['shrine', 'sam', 'flak'], die: 'ghost',
    desc: '비명으로 주변 탑의 공격을 느리게 한다.' });
  put('gumiho', { name: '구미호', ch: 4, dom: 'g', kin: 'yokai', yokai: 1, hp: 420, spd: 1.7, gold: 20, leak: 1, size: 0.72, evade: 0.3, acts: [{ k: 'charm', cd: 8, r: 2.4, sec: 2.5, n: 1 }], thr: 1.4, weak: ['frost', 'flame', 'shrine'], weakEl: ['ice'], die: 'ink',
    desc: '탑을 홀려 멈추고 공격을 30% 피한다. 느려지면 피하지 못한다. 불과 독은 피하지 못한다.' });
  put('saja', { name: '저승사자', ch: 4, dom: 'g', kin: 'ghost', ghost: 1, hp: 520, spd: 0.9, mres: 0.3, gold: 24, leak: 1, size: 0.76, acts: [{ k: 'blink', cd: 6, dist: 1.8 }], thr: 1.3, weak: ['shrine', 'jangseung', 'frost'], die: 'ghost',
    desc: '순간 이동으로 길을 건너뛴다. 느려진 동안에는 건너뛰지 못한다.' });
  put('bulgasari', { name: '불가사리', ch: 4, dom: 'g', kin: 'yokai', yokai: 1, hp: 1100, spd: 0.7, armor: 0.8, gold: 50, leak: 2, size: 0.9, fireX: 2, weak: ['flame', 'singijeon', 'alchemy'], weakEl: ['fire'], die: 'ink',
    desc: '쇠를 먹는다. 화살과 총알은 80% 막고 불에는 두 배로 약하다.' });
  put('jangsan', { name: '장산범', ch: 4, dom: 'g', kin: 'yokai', yokai: 1, hp: 460, spd: 2.4, gold: 22, leak: 2, size: 0.8, fadeCyc: { on: 2.2, off: 1.2 }, thr: 1.3, weak: ['jangseung', 'bell', 'frost'], weakEl: ['ice'], die: 'ink',
    desc: '아주 빠르고 잠깐씩 모습을 감춘다. 조명 탑 근처에서는 숨지 못한다.' });
  put('eoduksini', { name: '어둑시니', ch: 4, dom: 'g', kin: 'ghost', ghost: 1, hp: 500, spd: 0.8, gold: 26, leak: 2, size: 0.7, grow: { rate: 0.06, max: 2.5 }, thr: 1.6, weak: ['bell', 'jangseung', 'sniper'], die: 'ghost',
    desc: '살아 있는 동안 점점 커지고 강해진다. 빨리 잡거나 조명 탑으로 비춰 자라지 못하게 하라.' });
  put('tal', { name: '탈광대', ch: 4, dom: 'g', kin: 'yokai', yokai: 1, hp: 300, spd: 1.1, gold: 15, leak: 1, size: 0.66, haste: { r: 1.8, spd: 0.35 }, thr: 1.5, weak: ['sniper', 'ballista', 'shrine'], die: 'ink',
    desc: '장단을 쳐서 주변 요괴를 빠르게 한다. 먼저 잡아라.' });
  put('horangi', { name: '창귀 호랑이', ch: 4, dom: 'g', kin: 'yokai', yokai: 1, hp: 800, spd: 1.5, armor: 0.25, gold: 36, leak: 2, size: 0.9, leap: 1, thr: 1.15, weak: ['frost', 'cannon', 'sniper'], weakEl: ['ice'], die: 'ink',
    desc: '방책과 병사를 뛰어넘는다.' });
  put('crows', { name: '까마귀 떼', ch: 4, dom: 'a', fly: 1, kin: 'beast', hp: 70, spd: 1.9, gold: 3, leak: 1, size: 0.46, swarm: 1, weak: ['flak', 'singijeon', 'gatling'], die: 'poof', desc: '하늘을 뒤덮는 작은 떼.' });
  put('mulgwisin', { name: '물귀신', ch: 4, dom: 's', kin: 'ghost', ghost: 1, hp: 380, spd: 1.0, gold: 18, leak: 1, size: 0.68, hide: { near: 5 }, thr: 1.35, weak: ['jangseung', 'bell', 'turtle'], die: 'ghost',
    desc: '물속에 숨어 부두 앞까지 다가온다. 조명 탑으로 드러내라.' });
  put('pirate', { name: '수적선', ch: 4, dom: 's', kin: 'yokai', yokai: 1, hp: 1000, spd: 0.9, armor: 0.35, gold: 58, leak: 2, size: 1.0, cap: 3, hull: 0.75, weak: ['warship', 'turtle', 'singijeon'], die: 'boom',
    desc: '도깨비 수적이 탄 배. 땅에서 쏜 공격은 75%만 통한다.' });
  put('duryeok', { name: '도깨비 대장', ch: 4, dom: 'g', kin: 'yokai', yokai: 1, boss: 1, hp: 18000, spd: 0.42, armor: 0.3, gold: 820, leak: 20, size: 1.9, smash: 3, weak: ['frost', 'shrine', 'cannon'], die: 'ink',
    acts: [{ k: 'summon', cd: 8, type: 'dokkaebi', n: 3 }, { k: 'slam', cd: 10, r: 2.2, stun: 2, tele: 1.2, fx: 'he' }],
    phase: [{ below: 0.5, set: { acts: [{ k: 'summon', cd: 7, type: 'dokkaebi', n: 3 }, { k: 'slam', cd: 9, r: 2.4, stun: 2, tele: 1.2, fx: 'he' }, { k: 'summon', cd: 9, type: 'wisp', n: 4 }] } }, { below: 0.25, set: { spdX: 1.3 } }],
    desc: '도깨비 방망이를 두드려 부하를 불러내고, 땅을 내리쳐 주변 탑을 기절시킨다.' });
  put('cheonho', { name: '천년 구미호', ch: 4, dom: 'g', kin: 'yokai', yokai: 1, boss: 1, hp: 26000, spd: 0.6, mres: 0.4, gold: 1180, leak: 20, size: 1.8, evade: 0.2, weak: ['frost', 'shrine', 'flame'], weakEl: ['ice'], die: 'ink',
    acts: [{ k: 'clone', cd: 12, type: 'gumiho', n: 2, hp: 0.05 }, { k: 'charm', cd: 10, r: 3, sec: 2.5, n: 3 }],
    phase: [{ below: 0.5, set: { acts: [{ k: 'clone', cd: 11, type: 'gumiho', n: 3, hp: 0.05 }, { k: 'charm', cd: 9, r: 3.2, sec: 2.5, n: 4 }, { k: 'summon', cd: 11, type: 'wisp', n: 5 }] } }],
    desc: '분신을 만들고 여러 탑을 한꺼번에 홀린다. 느리게 만들면 피하지 못한다.' });
  put('imugi', { name: '이무기', ch: 4, dom: 's', kin: 'yokai', yokai: 1, boss: 1, hp: 50000, spd: 0.36, armor: 0.4, mres: 0.2, gold: 2270, leak: 20, size: 2.2, morph: { to: 'yong', hp: 0.5 }, weak: ['warship', 'turtle', 'sam'], die: 'ink',
    acts: [{ k: 'slam', cd: 9, r: 3, stun: 2, tele: 1.4, fx: 'water' }, { k: 'summon', cd: 12, type: 'mulgwisin', n: 2 }],
    desc: '바다에서 올라와 해일로 탑을 멈춘다. 체력이 절반이 되면 용으로 변신해 날아오르니 대공 무기를 남겨 둬라.' });
  put('yong', { name: '용', ch: 4, dom: 'a', fly: 1, kin: 'yokai', yokai: 1, boss: 1, hp: 25000, spd: 0.5, armor: 0.3, mres: 0.4, gold: 1130, leak: 20, size: 2.3, weak: ['sam', 'flak', 'shrine'], die: 'ink',
    acts: [{ k: 'stun', cd: 6, r: 4, n: 2, sec: 2, rand: 1, fx: 'bolt' }, { k: 'summon', cd: 12, type: 'wisp', n: 4 }],
    phase: [{ below: 0.2, set: { spdX: 1.25, acts: [{ k: 'stun', cd: 5, r: 4.2, n: 3, sec: 2, rand: 1, fx: 'bolt' }, { k: 'shield', cd: 10, pct: 0.04 }] } }],
    desc: '이무기가 변신한 모습. 벼락으로 탑을 멈추고 도깨비불을 부른다.' });
  // 그림 전용 모습(도감에 없고 적으로 소환하지 않음): 잠수함의 잠수 모습. 잠수 상태는 e.sub(0~1)로만 나타낸다
  put('submarine_sub', { name: '잠수함(잠수)', ch: 3, dom: 's', alt: 1, form: 1, kin: 'machine', mech: 1, hp: 900, spd: 0.9, armor: 0.3, gold: 0, leak: 2, size: 0.95, weak: ['warship', 'turtle', 'sniper'], die: 'boom', desc: '잠수함이 물속에 잠긴 모습.' });
})();
// 도감 순서(챕터 순). vampbat(변신 모습, form: 1)과 submarine_sub(그림 전용, alt: 1)은 도감에 없음
var EN2_ORDER = ['zombie', 'ghoul', 'phantom', 'pumpkin', 'bats', 'witch', 'mummy', 'scarab', 'werewolf', 'vampire', 'coffin', 'doll', 'gargoyle', 'pumpking', 'count', 'reaper', 'soldier', 'biker', 'jeep', 'apc', 'tank', 'mech', 'truck', 'drone', 'heli', 'jet', 'bomber', 'missile', 'boat', 'destroyer', 'submarine', 'bigtank', 'fortress', 'carrier', 'titan', 'dokkaebi', 'wisp', 'egg', 'maiden', 'gumiho', 'saja', 'bulgasari', 'jangsan', 'eoduksini', 'tal', 'horangi', 'crows', 'mulgwisin', 'pirate', 'duryeok', 'cheonho', 'imugi', 'yong'];
// [BAL] 2~4장 적의 처치 금화 배수. 초안은 체력당 금화가 1장의 절반 아래라 판이 길어질수록 돈이 말라 탑을 못 늘렸다(우두머리 제외)
var EN2_GOLDK = 1.5;
(function () {
  EN2_ORDER.forEach(function (k) { var E = ENEMIES[k]; if (E && !E.boss && (E.ch || 1) >= 2) E.gold = Math.round(E.gold * EN2_GOLDK); });
  ENEMY_ORDER.forEach(function (k) { if (ENEMIES[k] && !ENEMIES[k].ch) ENEMIES[k].ch = 1; });   // 1장 기존 적
  EN2_ORDER.forEach(function (k) { if (ENEMY_ORDER.indexOf(k) < 0) ENEMY_ORDER.push(k); });
})();
// 챕터의 우두머리 목록(도감 순, 변신 모습 제외)
function en2Bosses(ch) { return ENEMY_ORDER.filter(function (k) { var E = ENEMIES[k]; return E && E.boss && (E.ch || 1) === ch && k !== 'yong' && k !== 'yotun2'; }); }

// ---------- 웨이브 생성 (data.js makeWave가 이 함수로 넘긴다) ----------
// 기존 규칙(예산, 소개, 종류 차례)을 그대로 두고 영역을 더했다: 뱃길이 있으면 바다 적을, 항로가 있으면 항로 적을 꾸준히 섞고, 길이 없는 영역의 적은 뺀다.
// 떼(swarm)는 5마리씩 뭉쳐 나온다. 판 규칙 swarm, elite, airraid, landing, bossrush는 여기서 구성을 바꾼다(미리보기와 실제가 같게).
function en2Share(parts, list) { var s = 0; parts.forEach(function (p) { if (list.indexOf(p[0]) >= 0) s += p[1]; }); return s; }
function en2Force(parts, list, s, rnd) {   // list의 적이 예산의 s 이상을 차지하게
  var cur = en2Share(parts, list); if (!list.length || cur >= s - 0.01) return;
  var k = list[Math.floor(rnd() * list.length)], f = (1 - s) / Math.max(0.01, 1 - cur);
  parts.forEach(function (p) { if (list.indexOf(p[0]) < 0) p[1] *= f; });
  parts.push([k, s - cur]);
}
function en2MakeWave(mi, i, N, rnd, dk) {
  var M = MAPS[mi], intro = M.intro || {}, RU = M.rule || {}, rid = RU.id;
  var avail = M.pool.filter(function (k) { var E = ENEMIES[k]; if (!E || fdRouteN(M, E) < 1) return false; var early = E.hp >= 1000 ? 6 : E.hp >= 400 ? 3 : (E.armor >= 0.5 || E.heal || E.ward) ? 2 : 0; return (intro[k] == null ? early : intro[k]) <= i; });
  if (!avail.length) avail = [M.pool.filter(function (k) { return ENEMIES[k] && fdRouteN(M, ENEMIES[k]) > 0; })[0] || 'goblin'];
  var budget = 380 * BUDK * M.bud * mapLenK(mi) * (1 + 0.28 * i + 0.012 * i * i) * (i === 0 ? 0.7 : i === 1 ? 0.8 : i === 2 ? 0.9 : 1);
  var fresh = null;
  for (var k in intro) if (intro[k] === i && avail.indexOf(k) >= 0) fresh = k;
  var fast = avail.filter(function (k) { return ENEMIES[k].spd >= 1.25 && !ENEMIES[k].fly; });
  var big = avail.filter(function (k) { return ENEMIES[k].hp >= 400; });
  var fly = avail.filter(function (k) { return ENEMIES[k].fly; });
  var elite = avail.filter(function (k) { var E = ENEMIES[k]; return E.armor >= 0.5 || E.heal || E.ward || E.stealth || E.mres < 0 || E.thr >= 1.3; });
  var small = avail.filter(function (k) { return (ENEMIES[k].hp <= 60 || ENEMIES[k].swarm) && !ENEMIES[k].fly; });
  var seaA = avail.filter(function (k) { return fdDom(ENEMIES[k]) === 's'; }), laneA = avail.filter(function (k) { return ENEMIES[k].lane; });
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  var parts = [], last = i === N - 1, kind, endless = !!DIFFS[dk].endless;
  if (last && M.boss && !endless) kind = 'boss';
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
  // [v1.3] 상성 몬스터(M.focus)를 웨이브마다 섞음
  if (M.focus && avail.indexOf(M.focus) >= 0 && kind !== 'basic' && kind !== 'intro' && !parts.some(function (p) { return p[0] === M.focus; })) {
    var fs = M.focusK || 0.35; parts.forEach(function (p) { p[1] *= 1 - fs; }); parts.push([M.focus, fs]);
  }
  // [v2.0] 영역 섞기: 바다 적은 거의 매 웨이브, 항로 적은 세 웨이브에 두 번. 판 규칙 airraid(하늘 위주), landing(바다 위주)
  if (kind !== 'basic' || rid === 'airraid' || rid === 'landing') {
    if (rid === 'landing') en2Force(parts, seaA, RU.k || 0.65, rnd);
    else if (seaA.length && kind !== 'intro') en2Force(parts, seaA, (i + mi) % 4 === 3 ? 0.4 : 0.22, rnd);
    if (rid === 'airraid') en2Force(parts, fly, RU.k || 0.65, rnd);
    else if (laneA.length && kind !== 'intro' && (i + mi) % 3 !== 0) en2Force(parts, laneA, kind === 'air' ? 0.4 : 0.2, rnd);
  }
  // v1.2 중반 이후: 섞어 웨이브에 중장갑, 특수 적 끼우기, 떼 웨이브 일부를 중장갑 웨이브로
  var lq = typeof tfLateQ === 'function' ? tfLateQ(M, i, N, dk) : 0;
  if (lq > 0 && kind !== 'basic' && kind !== 'intro' && kind !== 'boss') {
    var hv = elite.concat(big).filter(function (k) { var E = ENEMIES[k]; return !E.fly && fdDom(E) !== 's'; });
    if (kind === 'swarm' && big.length && rnd() < lq * 0.7) { kind = 'tank'; parts = [[pick(big), 0.55], [pick(avail), 0.45]]; }
    else if (hv.length && !parts.some(function (p) { return hv.indexOf(p[0]) >= 0; }) && rnd() < 0.25 + 0.35 * lq) {
      var sh = 0.22 + 0.13 * lq; parts.forEach(function (p) { p[1] *= 1 - sh; }); parts.push([pick(hv), sh]);
    }
  }
  var nK = rid === 'swarm' ? (RU.n || 1.8) : rid === 'elite' ? (RU.n || 0.5) : 1, gK = rid === 'swarm' ? 0.6 : 1;
  var lGap = 1 + (TF_LATE ? TF_LATE.gap : 0) * lq;
  var groups = [], delay = 0;
  parts.forEach(function (p, gi) {
    var E = ENEMIES[p[0]], n = Math.max(1, Math.round(budget * p[1] / threatOf(p[0]) * nK * (lq > 0 && !tfLateBig(E) ? tfLateCut(lq, E) : 1)));
    if (E.hp >= 1000) n = Math.min(n, Math.max(1, Math.round((1 + Math.floor(i / 8)) * Math.max(1, nK))));
    if (E.cap) n = Math.min(n, Math.round(E.cap * Math.max(1, nK)));
    n = Math.min(n, rid === 'swarm' ? 60 : 45);
    var gap = (E.hp >= 400 ? 2.6 : E.spd >= 1.25 ? 0.5 : 0.85) * gK * (E.hp >= 400 ? 1 : lGap);
    var np = fdRouteN(M, E);   // 길 번호(path)는 그 적 영역의 길 목록 안에서 센다: 땅 M.paths, 바다 M.sea, 항로 M.air
    if (kind === 'rush') gap *= 0.6; if (kind === 'swarm') gap *= 0.55;
    var path = np > 1 ? (gi % np) : 0;
    if (E.swarm && n >= 4) {
      // 떼: 5마리씩 바짝 붙어 한 무리, 무리 사이는 1.6초. 길이 여럿이면 무리마다 길을 바꿈
      var left = n, q = 0;
      var fl = lq > 0.45 ? 4 : 5, fg = 0.16 * (1 + 0.8 * lq), fi = 1.6 * (1 + 0.35 * lq);   // v1.2: 무리를 작고 성기게
      while (left > 0) { var m = Math.min(fl, left); groups.push({ type: p[0], n: m, gap: fg, delay: delay + q * fi * gK, path: (path + q) % np, flock: 1 }); left -= m; q++; }
      delay += Math.min(q * 1.6 * gK * 0.55, 9) + 1.2;
      return;
    }
    if (np > 1 && n >= 6 && rnd() < 0.5) {
      var half = Math.ceil(n / 2);
      groups.push({ type: p[0], n: half, gap: gap, delay: delay, path: path });
      groups.push({ type: p[0], n: n - half, gap: gap, delay: delay + gap * 0.5, path: (path + 1) % np });
    } else groups.push({ type: p[0], n: n, gap: gap, delay: delay, path: path });
    delay += Math.min(n * gap * 0.55, 9) + 1.2;
  });
  if (kind === 'boss') groups.push({ type: M.boss, n: 1, gap: 1, delay: delay + 2, path: 0, boss: 1 });
  // 판 규칙 bossrush: every 웨이브마다(기본 4) 우두머리가 하나씩 더 온다. list가 없으면 그 챕터의 우두머리를 차례로
  if (rid === 'bossrush' && !last && i >= 1) {
    var ev = RU.every || 4, bl = (RU.list && RU.list.length ? RU.list : en2Bosses(M.ch || 1)).filter(function (bk) { return ENEMIES[bk] && !ENEMIES[bk].final && fdRouteN(M, ENEMIES[bk]) > 0 && bk !== M.boss; });   // 바르칸(final: 최후의 화살로 마무리)은 중간 우두머리로 쓰지 않음
    if (!bl.length && M.boss) bl = [M.boss];
    if (bl.length && (i + 1) % ev === 0) { groups.push({ type: bl[(Math.floor((i + 1) / ev) - 1) % bl.length], n: 1, gap: 1, delay: delay + 1, path: 0, boss: 1 }); if (kind !== 'boss') kind = 'boss'; }
  }
  return { kind: kind, groups: groups };
}
