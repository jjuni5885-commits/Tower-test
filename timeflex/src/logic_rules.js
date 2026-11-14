// ===== logic_rules.js : v2.0 판 도전 규칙 14종 (ENG1). 판 자료 rule: { id, ...값 } → g.rule(얕은 복사) =====
// 고리(ENGINE.md 5절): RULES[id] = { init(g), tick(g, dt), canBuild(g, type, c, r), stats(g, t, st), spawn(g, e), wave(g, W, 번호), why(g, type) }
// 구성을 바꾸는 규칙(swarm, elite, airraid, landing, bossrush)의 웨이브 쪽은 data_enemies2.js en2MakeWave가 M.rule을 보고 만든다(미리보기와 실제가 같게).
// 사건: ruleEv { id, k, ... }  k: 'block'(건설 막힘, why) | 'warn'(곧 일어남, sec) | 'hit'(일어남) | 'mark'(운석 예고 자리) | 'push'(rush가 다음 웨이브를 밀어 넣음) | 'siren'(공습, 상륙 경보)
// 값(없으면 기본): fog k 0.85 / night k 0.7, gate 2.5 / rush k 0.55 / swarm n 1.8, hp 0.55 / elite n 0.5, hp 1.9 / poor k 0.5, gold 1.3 / limit n 8 / ban kinds []
//   blackout cd 14, n 2, sec 3 / meteor cd 12, r 1.3, sec 3, tele 2 / airraid k 0.65 / landing k 0.65 / bossrush every 4, list [], hp 0.5, leak 8 / fragile lives 5
var RULE_INFO = {
  fog: { name: '짙은 안개', desc: '모든 탑의 사거리가 15% 줄어든다.' },
  night: { name: '칠흑 같은 밤', desc: '조명 탑(종탑, 장승)이나 시간의 문 곁이 아닌 탑은 사거리가 30% 줄어든다.' },
  rush: { name: '몰아치기', desc: '웨이브 사이가 짧고, 시간이 다 되면 적이 남아 있어도 다음 웨이브가 온다.' },
  swarm: { name: '인해전술', desc: '적이 약하지만 훨씬 많이 몰려온다.' },
  elite: { name: '정예 부대', desc: '적의 수는 적지만 하나하나가 훨씬 강하다.' },
  poor: { name: '빈손 출발', desc: '시작 금화가 절반이다. 대신 처치 금화가 30% 많다.' },
  limit: { name: '소수 정예', desc: '탑을 정해진 수까지만 지을 수 있다.' },
  ban: { name: '금지령', desc: '몇몇 탑을 쓸 수 없다.' },
  blackout: { name: '정전', desc: '주기적으로 탑 몇 개가 3초 동안 멈춘다.' },
  meteor: { name: '운석우', desc: '운석이 떨어져 주변 탑을 기절시킨다. 떨어질 자리는 미리 표시된다.' },
  airraid: { name: '공습 경보', desc: '하늘의 적이 주력이다. 대공 무기를 준비하라.' },
  landing: { name: '상륙 저지', desc: '바다의 적이 주력이다. 수상 탑으로 물길을 막아라.' },
  bossrush: { name: '우두머리 행진', desc: '우두머리가 잇따라 나타난다.' },
  fragile: { name: '위태로운 시간의 문', desc: '생명이 5뿐이다.' }
};
var RULE_ORDER = ['fog', 'night', 'rush', 'swarm', 'elite', 'poor', 'limit', 'ban', 'blackout', 'meteor', 'airraid', 'landing', 'bossrush', 'fragile'];
// 규칙 이름과 설명: 판 자료(ruleName, ruleDesc)가 있으면 그것, 없으면 기본 문구. 규칙이 없으면 null
function rlInfo(M) {
  if (!M || !M.rule || !M.rule.id) return null;
  var I = RULE_INFO[M.rule.id] || { name: M.rule.id, desc: '' }, d = M.ruleDesc || I.desc;
  if (!M.ruleDesc && M.rule.id === 'limit') d = '탑을 ' + (M.rule.n || 8) + '개까지만 지을 수 있다.';
  if (!M.ruleDesc && M.rule.id === 'ban' && M.rule.kinds) d = M.rule.kinds.map(function (k) { return TOWERS[k] ? TOWERS[k].name : k; }).join(', ') + ' 사용 금지.';
  return { id: M.rule.id, name: M.ruleName || I.name, desc: d };
}
// 규칙이 이 탑의 건설을 막는 이유(화면 알림용 문자열). 막지 않으면 null
function ruleBlocks(g, towerKey) {
  var R = g && g.rule, RL = R && RULES[R.id];
  return RL && RL.why ? RL.why(g, towerKey) || null : null;
}
function rlCan(g, type) { return !ruleBlocks(g, type); }
function rlBusy(g) { return !g.waiting && !g.over && (g.enemies.length > 0 || g.spawnQ.length > 0); }   // 웨이브가 진행 중일 때만 방해
function rlStun(g, t, sec, why) { return typeof en2StunTower === 'function' ? en2StunTower(g, t, sec, why, 'stun') : (t.stunT > 0 ? false : (t.stunT = sec, emit(g, 'towerStun', { tw: t, sec: sec, why: why, k: 'stun', x: t.x, y: t.y }), true)); }
// 조명 탑의 빛 반경(능력치 계산 중에도 쓸 수 있게 기본 수치로): 종탑 reveal, 장승과 light 표시 탑은 사거리, 숨은 적을 보는 탑은 사거리
function rlLightR(t) {
  var T = TOWERS[t.k]; if (!T) return 0;
  var s = towerStats(t.k, t.lvl, t.br);
  return s.reveal || ((T.light || s.light || t.k === 'jangseung') ? (s.lightR || s.range || 2) : 0) || (s.detect ? s.range : 0);
}

RULES.fog = { init: function (g) { refreshStats(g); }, stats: function (g, t, st) { if (st.range && !tfBellK(t.k) && t.k !== 'mint') st.range *= g.rule.k || 0.85; } };

// 밤: 조명 탑의 빛이나 성문 불빛 안에 있지 않은 탑은 시야가 좁다(사거리 x k). g.rule.lit = [{ x, y, r }] 밝은 곳(그리기용), e.dark = 어둠 속의 적
RULES.night = {
  init: function (g) { g.rule.lit = []; g.rule.t = 0; refreshStats(g); },
  stats: function (g, t, st) {
    var lit = rlLightR(t) > 0 || d2(t.x, t.y, g.gate.x, g.gate.y) <= Math.pow(g.rule.gate || 2.5, 2);
    for (var i = 0; i < g.towers.length && !lit; i++) { var o = g.towers[i]; if (o === t) continue; var r = rlLightR(o); if (r > 0 && d2(o.x, o.y, t.x, t.y) <= r * r) lit = true; }
    t.dark = lit ? 0 : 1;
    if (!lit && st.range && t.k !== 'mint') st.range *= g.rule.k || 0.7;
  },
  tick: function (g, dt) {
    var R = g.rule; R.t -= dt; if (R.t > 0) return; R.t = 0.2;
    var L = [{ x: g.gate.x, y: g.gate.y, r: R.gate || 2.5 }];
    g.towers.forEach(function (t) { var lr = rlLightR(t), r = Math.max(lr, t.st && t.st.range ? t.st.range : 1); L.push({ x: t.x, y: t.y, r: r, light: lr > 0 ? 1 : 0 }); });
    R.lit = L;
    for (var i = 0; i < g.enemies.length; i++) { var e = g.enemies[i], dk = 1; for (var j = 0; j < L.length; j++) if (d2(L[j].x, L[j].y, e.x, e.y) <= L[j].r * L[j].r) { dk = 0; break; } e.dark = dk; }
  }
};

// 몰아치기: 다음 웨이브까지 시간이 짧고, 시간이 다 되면 적이 남아 있어도 다음 웨이브가 온다(능력 카드를 고를 차례에는 기다려 줌)
RULES.rush = {
  wave: function (g, W, n) { if (g.wave < g.N) { g.nextMax = Math.max(6, g.nextMax * (g.rule.k || 0.55)); g.nextT = g.nextMax; } },
  tick: function (g, dt) {
    if (g.waiting || g.over || g.wave >= g.N || g.pickWait || g.nextT > 0 || fieldClear(g) || pickDue(g)) return;
    emit(g, 'ruleEv', { id: 'rush', k: 'push', i: g.wave + 1 });
    startWave(g);
  }
};

// 인해전술, 정예 부대: 수는 en2MakeWave가, 체력과 금화는 여기서(우두머리 제외)
RULES.swarm = { spawn: function (g, e) { if (e.boss) return; var k = g.rule.hp || 0.55; e.hp *= k; e.mhp *= k; if (e.shield) e.shield *= k; e.gold = Math.max(1, Math.round(e.gold * 0.6)); } };
RULES.elite = { spawn: function (g, e) { if (e.boss) return; var k = g.rule.hp || 1.9; e.hp *= k; e.mhp *= k; if (e.shield) e.shield *= k; e.gold = Math.round(e.gold * 1.8); e.elite = 1; } };

RULES.poor = {
  init: function (g) { g.gold = Math.round(g.gold * (g.rule.k || 0.5)); },
  spawn: function (g, e) { e.gold = Math.round(e.gold * (g.rule.gold || 1.3)); }
};

RULES.limit = {
  why: function (g, type) { var n = g.rule.n || 8; return g.towers.length >= n ? '이 판은 탑을 ' + n + '개까지만 지을 수 있습니다' : null; },
  canBuild: rlCan
};
RULES.ban = {
  why: function (g, type) { return (g.rule.kinds || []).indexOf(type) >= 0 ? '이 판에서는 ' + (TOWERS[type] ? TOWERS[type].name : type) + ' 사용 금지' : null; },
  canBuild: rlCan
};

// 정전: cd초마다 탑 n개(지은 탑의 30%까지)가 sec초 멈춘다. 1.2초 전에 예고
RULES.blackout = {
  init: function (g) { g.rule.t = (g.rule.cd || 14) * 0.7; g.rule.warned = 0; },
  tick: function (g, dt) {
    var R = g.rule; if (!rlBusy(g) || !g.towers.length) return;
    R.t -= dt;
    if (R.t <= 1.2 && !R.warned) { R.warned = 1; emit(g, 'ruleEv', { id: 'blackout', k: 'warn', sec: 1.2 }); }
    if (R.t > 0) return;
    R.t = R.cd || 14; R.warned = 0;
    var n = Math.min(R.n || 2, Math.max(1, Math.ceil(g.towers.length * 0.3))), pool = g.towers.slice(), hit = [];
    while (pool.length && hit.length < n) { var t = pool.splice(Math.floor(g.rnd() * pool.length), 1)[0]; if (rlStun(g, t, R.sec || 3, 'blackout')) hit.push(t); }
    emit(g, 'ruleEv', { id: 'blackout', k: 'hit', tws: hit, sec: R.sec || 3 });
  }
};

// 운석우: cd초마다 탑 근처에 예고 표시(g.rule.marks = [{ x, y, t, T, r }]), tele초 뒤 떨어져 반경 r 안의 탑이 sec초 기절. 그 자리의 적도 다친다
RULES.meteor = {
  init: function (g) { g.rule.marks = []; g.rule.t = (g.rule.cd || 12) * 0.6; },
  tick: function (g, dt) {
    var R = g.rule, r = R.r || 1.3, keep = [];
    for (var i = 0; i < R.marks.length; i++) {
      var m = R.marks[i]; m.t -= dt;
      if (m.t > 0) { keep.push(m); continue; }
      var n = 0; g.towers.forEach(function (t) { if (d2(t.x, t.y, m.x, m.y) <= m.r * m.r && rlStun(g, t, R.sec || 3, 'meteor')) n++; });
      splashAt(g, m.x, m.y, m.r, 60 + 14 * g.wave, 'expl', null, null, 'gs');
      emit(g, 'blast', { x: m.x, y: m.y, r: m.r, k: 'he', big: 1, rule: 'meteor' });
      emit(g, 'ruleEv', { id: 'meteor', k: 'hit', x: m.x, y: m.y, r: m.r, n: n });
    }
    R.marks = keep;
    if (!rlBusy(g)) return;
    R.t -= dt; if (R.t > 0) return;
    R.t = R.cd || 12;
    var x, y;
    if (g.towers.length) { var t = g.towers[Math.floor(g.rnd() * g.towers.length)]; x = t.x + (g.rnd() - 0.5) * 1.2; y = t.y + (g.rnd() - 0.5) * 1.2; }
    else { x = 1 + g.rnd() * (g.cols - 2); y = 2 + g.rnd() * (g.rows - 4); }
    var tele = R.tele || 2, mk = { x: clamp(x, 0.5, g.cols - 0.5), y: clamp(y, 0.5, g.rows - 0.5), t: tele, T: tele, r: r };
    R.marks.push(mk);
    emit(g, 'ruleEv', { id: 'meteor', k: 'mark', x: mk.x, y: mk.y, r: r, sec: tele });
  }
};

// 공습, 상륙 저지: 구성은 en2MakeWave. 그 영역의 적이 있는 웨이브가 시작되면 경보 사건
function rlSiren(id, dom) {
  return { wave: function (g, W, n) { if (W.groups.some(function (gr) { var E = ENEMIES[gr.type]; return E && fdDom(E) === dom; })) emit(g, 'ruleEv', { id: id, k: 'siren', i: n }); } };
}
RULES.airraid = rlSiren('airraid', 'a');
RULES.landing = rlSiren('landing', 's');

// 우두머리 행진: 중간에 나오는 우두머리(판의 마지막 우두머리가 아닌 것)는 체력 x hp, 새면 생명 leak만큼
RULES.bossrush = {
  spawn: function (g, e) {
    if (!e.boss || e.k === g.M.boss || e.summoned) return;
    var k = g.rule.hp || 0.5; e.hp *= k; e.mhp *= k; e.leak = Math.min(e.leak, g.rule.leak || 8); e.gold = Math.round(e.gold * 0.5); e.mini = 1;
  }
};

// 위태로운 성문: 생명 lives(기본 5). 이어하기 복원 뒤에도 최대 생명이 유지되게 매 걸음 확인
RULES.fragile = {
  init: function (g) { g.lives = g.maxLives = g.rule.lives || 5; },
  tick: function (g, dt) { var mx = (g.rule.lives || 5) + 3 * ((g.buffs && g.buffs.g_life) || 0); if (g.maxLives !== mx) { g.maxLives = mx; if (g.lives > mx) g.lives = mx; } }
};
