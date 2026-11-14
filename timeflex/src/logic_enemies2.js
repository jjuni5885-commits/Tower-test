// ===== logic_enemies2.js : v2.0 2~4장 적 능력 (ENG1). 자료는 data_enemies2.js, 여기는 그 자료를 해석하는 공통 코드 =====
// 등록: EN2_ORDER와 변신 모습(vampbat)의 EN_AB[k] = { spawn, tick, hurt, die } 를 한 벌의 공통 함수로 건다.
// 그리기용 적 상태(SPEC 7절): e.fade(0~1 흐려짐), e.sub(0~1 잠수), e.rage(폭주), e.grow(배율), e.form(변신 뒤 모습 키), e.z, e.ang, e.dom
//   추가: e.cast = { k, t, T, r }(예고 중인 광역 공격, 0이 되면 터짐), e.hopT(뛰어넘는 중), e.ph(체력 구간 번호), e.clone(분신), e.dark(night 규칙에서 어둠 속), e.dash(돌진 중)
// 탑 상태: t.stunT(기절), t.hexT(저주), t.charmT(홀림), t.jamT/jamF(공격 속도 감소), t.immT(이 시각까지는 다시 멈추지 않음)
// 사건: towerStun { tw, sec, why, k: 'stun' | 'hex' | 'charm' | 'jam', x, y }, morph { e, to, from, x, y }, blink { en, x0, y0, x1, y1 }, rage { en }, leap { en, over },
//       warn { en, x, y, r, sec, k }(광역 공격 예고), blast { x, y, r, k }, phase { en, n, k }, scatter { en, on }, laneWarn { en, k }, reveal { en }, 기존 heal, ward, summon, bones
// 다른 갈래와의 약속
//   막는 유닛(ENG2 병사): u.block이 참이고 살아 있으면(u.dead 아님, u.hp > 0) en2Block이 땅 적을 그 앞에 세운다. u.block 숫자 = 한 번에 붙잡는 수.
//     붙잡힌 적은 e.blocked = u, 유닛 체력(u.hp)은 여기서 방책과 같은 세기로 깎는다(병사 쪽에서도 깎으면 한쪽을 뺄 것). leap 적은 방책과 유닛을 지나간다(봉인 중에는 못 넘음).
//   e.sealT, e.fearT는 en2Common이 매 걸음 줄인다(탑 쪽은 걸기만). 공포 느림은 e.fearF(0~0.8)를 같이 주면 이동 속도에 반영.
//   봉인 중 정지: 행동(acts), 흐려짐, 잠수, 폭주, 변신, 성장, 회피, 순간 이동, 부활, 폭발, 뛰어넘기, 1장 적의 능력(abilities).
//   변신은 제자리 변신: e.k는 원래 키(vampire, imugi)로 남고 e.form, e.F(변신 뒤 자료), 능력치, 영역, 길이 바뀐다. kill 사건에 form 칸.
//   상성 표시: ENEMIES[k].kin, ghost, yokai, mech. aaOnly는 src.tw.hit에 'g'가 있으면, hull은 src.tw.site가 'water'가 아니면 피해가 준다.
//   탑을 멈추는 효과는 전부 en2StunTower 하나를 거친다(관리자 탑 면제, 합체 탑 절반, 풀려난 뒤 EN2_IMM초 면제, g.adm.god이면 무시).
var EN2_IMM = 2.5;      // 탑이 풀려난 뒤 다시 멈추지 않는 시간(초): 계속 멈춰 있는 불공정을 막는다
var EN2_MAXEN = 110;    // 소환으로 전장의 적이 이 수를 넘지 않게

// ---------- 탑 멈추기 공통 도우미 ----------
// k: 'stun' 기절(t.stunT) | 'hex' 저주(t.hexT) | 'charm' 홀림(t.charmT). why: 누가 왜(적 키, 규칙 키). 걸렸으면 true
function en2StunTower(g, t, sec, why, k) {
  if (!t || !(sec > 0)) return false;
  var T = TOWERS[t.k]; if (T && T.admin) return false;                 // 관리자 전용 탑은 안 멈춤
  if (g.adm && g.adm.god) return false;
  if ((t.immT || 0) > g.t || t.stunT > 0 || t.hexT > 0 || t.charmT > 0) return false;   // 멈춰 있거나 막 풀려난 탑은 건너뜀
  if (T && T.fusion) sec *= 0.5;                                        // 합체 탑은 절반만
  k = k || 'stun';
  if (k === 'hex') t.hexT = sec; else if (k === 'charm') t.charmT = sec; else t.stunT = sec;
  t.immT = g.t + sec + EN2_IMM;
  emit(g, 'towerStun', { tw: t, sec: sec, why: why || '', k: k, x: t.x, y: t.y });
  return true;
}
function en2TowerFree(g, t) { return !((t.immT || 0) > g.t || t.stunT > 0 || t.hexT > 0 || t.charmT > 0) && !(TOWERS[t.k] && TOWERS[t.k].admin) && t.st && t.st.kind !== 'mint'; }
// 가까운 탑 n개(멈출 수 있는 것만). rand면 범위 안에서 무작위
function en2Towers(g, x, y, r, n, rand) {
  var out = [];
  for (var i = 0; i < g.towers.length; i++) { var t = g.towers[i], dd = d2(t.x, t.y, x, y); if (dd <= r * r && en2TowerFree(g, t)) out.push([rand ? g.rnd() : dd, t]); }
  out.sort(function (a, b) { return a[0] - b[0]; });
  return out.slice(0, n || 1).map(function (q) { return q[1]; });
}
function en2StunArea(g, x, y, r, sec, why, k) { var n = 0; g.towers.forEach(function (t) { if (d2(t.x, t.y, x, y) <= r * r && en2StunTower(g, t, sec, why, k)) n++; }); return n; }

// ---------- 조명(숨은 적, 흐려지는 적을 드러냄): 종탑(reveal), 장승, TOWERS[k].light, 숨은 적을 보는 탑(detect) ----------
function en2Lights(g) {
  if (g.litAt === g.t && g.lits) return g.lits;
  var L = [];
  for (var i = 0; i < g.towers.length; i++) {
    var t = g.towers[i], st = t.st, T = TOWERS[t.k]; if (!st || t.frozenT > 0 || t.stunT > 0 || t.hexT > 0 || t.charmT > 0) continue;
    var r = st.reveal || ((T.light || st.light || t.k === 'jangseung') ? (st.lightR || st.range || 2) : 0) || (st.detect ? st.range : 0);
    if (r > 0) L.push({ x: t.x, y: t.y, r: r });
  }
  g.lits = L; g.litAt = g.t;
  return L;
}
function en2Lit(g, x, y) { var L = en2Lights(g); for (var i = 0; i < L.length; i++) if (d2(L[i].x, L[i].y, x, y) <= L[i].r * L[i].r) return true; return false; }

// ---------- 길 도우미 ----------
function en2NearS(P, x, y, s0, s1) {   // 길 P에서 (x, y)에 가장 가까운 표본 번호
  var best = s0 || 0, bd = 1e9; s1 = s1 == null ? P.n - 1 : s1;
  for (var s = s0 || 0; s <= s1; s += 2) { var dd = d2(P.xs[s], P.ys[s], x, y); if (dd < bd) { bd = dd; best = s; } }
  return best;
}
// (x, y)에서 길 P의 s번째 표본으로 부드럽게 들어가 끝까지 가는 새 길
function en2Join(P, x, y, s) {
  var pts = [[x, y]], ahead = Math.min(P.n - 1, s + 30), mx = P.xs[ahead], my = P.ys[ahead];
  for (var k = 1; k < 8; k++) { var u = k / 8, e = u * u * (3 - 2 * u); pts.push([x + (mx - x) * e, y + (my - y) * e]); }
  for (var q = ahead; q < P.n; q += 3) pts.push([P.xs[q], P.ys[q]]);
  pts.push([P.xs[P.n - 1], P.ys[P.n - 1]]);
  return resample(pts);
}
// 적 종류 E가 다닐 길 목록(spawnEnemy와 같은 규칙)
function en2ListOf(g, E) {
  var rt = fdRoute(E), fly = fdDom(E) === 'a', list = rt === 'air' ? g.air : rt === 'sea' ? g.sea : fly ? g.fly : g.paths;
  if (!list.length) list = fly ? g.fly : g.paths;
  return list;
}
// 소환: e 곁(같은 길이면 바로 뒤, 다른 영역이면 그 영역 길에서 가장 가까운 곳)에 type을 n마리. 소환된 적의 금화는 40%
function en2Summon(g, e, type, n, extra) {
  var Et = ENEMIES[type]; if (!Et || g.enemies.length >= EN2_MAXEN) return 0;
  var list = en2ListOf(g, Et), same = list.indexOf(e.P) >= 0, pi = same ? e.pi : e.pi % list.length, P = list[pi], d0 = same ? e.d : en2NearS(P, e.x, e.y) * PSTEP, made = 0;
  for (var j = 0; j < n && g.enemies.length < EN2_MAXEN; j++) {
    var ex = { off: fdDom(Et) === 'a' ? 0 : (g.rnd() - 0.5) * 0.36, gold: Math.round(Et.gold * 0.4), summoned: 1 };
    if (extra) for (var k in extra) ex[k] = extra[k];
    spawnEnemy(g, type, pi, clamp(d0 - 0.35 - j * 0.24, 0, Math.max(0, P.len - 0.5)), ex); made++;
  }
  return made;
}
function en2Blink(g, e, dist) {
  var d1 = Math.min(e.d + dist, e.P.len - 1.8); if (d1 <= e.d + 0.2) return false;
  var x0 = e.x, y0 = e.y; e.d = d1; e.blocked = null; placeEnemy(e);
  emit(g, 'blink', { en: e, x0: x0, y0: y0, x1: e.x, y1: e.y });
  return true;
}
// 변신: 모습(e.form), 능력치, 영역과 길을 to의 것으로. 체력은 이어짐. 하늘로 올라가면 항로(있으면)나 하늘 곡선으로 부드럽게 들어감
function en2Morph(g, e, to, heal) {
  var F = ENEMIES[to]; if (!F || e.form === to || e.dead) return false;
  var x0 = e.x, y0 = e.y, dom = fdDom(F), from = e.form || e.k, dom0 = e.dom, fr = e.d / Math.max(0.01, e.P.len);
  e.form = to; e.F = F; e.ph = 0; e.cdT = null; e.cast = null; e.rot = 0;
  e.armor = F.armor || 0; e.mres = F.mres || 0; e.spd = F.spd; e.size = F.size; e.fade = 0; e.sub = 0; e.untarget = 0; e.stealth = !!F.stealth; e.rage = 0; e.blocked = null;
  if (dom !== e.dom) {
    e.dom = dom; e.fly = dom === 'a'; e.z = e.fly ? 0.75 : 0; e.off = 0;
    var lane = e.fly && g.air.length && (F.lane || e.boss), list = lane ? g.air : en2ListOf(g, F), pi = e.pi % list.length, P = list[pi], s;
    if (lane) { var bd = 1e9; for (var a = 0; a < list.length; a++) { var sa = en2NearS(list[a], x0, y0, 0, Math.floor(list[a].n * 0.4)), dd = d2(list[a].xs[sa], list[a].ys[sa], x0, y0); if (dd < bd) { bd = dd; pi = a; } } P = list[pi]; s = en2NearS(P, x0, y0, 0, Math.floor(P.n * 0.4)); }
    else if (dom0 === 'g') { var sc = fr * (P.n - 1), w = P.n * 0.2; s = en2NearS(P, x0, y0, Math.max(0, Math.floor(sc - w)), Math.min(P.n - 1, Math.ceil(sc + w))); }   // 땅 → 하늘: 같은 진행도 언저리에서 가장 가까운 곳
    else s = en2NearS(P, x0, y0, 0, Math.floor(P.n * 0.7));
    s = Math.min(s, Math.max(0, P.n - 60));
    e.P = en2Join(P, x0, y0, s); e.d = 0; e.pi = pi; e.route = lane ? 'air' : dom === 's' ? 'sea' : 'path'; e.lane = lane ? 1 : 0;
  }
  placeEnemy(e);
  if (heal) e.hp = Math.min(e.mhp, e.hp + e.mhp * heal);
  emit(g, 'morph', { e: e, en: e, to: to, from: from, x: x0, y: y0 });
  if (ENEMY_ORDER.indexOf(to) >= 0 && !g.seenEnemies[to]) { g.seenEnemies[to] = 1; emit(g, 'newEnemy', { k: to }); }
  return true;
}

// ---------- 적의 포탄과 폭탄 (탄 종류 eshell, ebomb: SPEC 7절) ----------
// eshell: 적에서 탑으로 포물선. ebomb: 하늘에서 탑 자리로 낙하. 닿으면 반경 br 안의 탑이 stun초 기절
function en2Shell(g, e, t, a, bomb) {
  var dist = hyp(e.x, e.y, t.x, t.y), T = bomb ? 1.0 : 0.55 + dist * 0.12;
  g.proj.push({ kind: bomb ? 'ebomb' : 'eshell', x: e.x, y: e.y, sx: e.x, sy: e.y, tx: t.x, ty: t.y, z: bomb ? (e.z || 0.75) : 0.4, z0: bomb ? (e.z || 0.75) : 0.4, h: bomb ? 0 : 0.7 + dist * 0.16, T: T, t: 0, ang: Math.atan2(t.y - e.y, t.x - e.x),
    br: a.br || 0.45, stun: a.stun || 1.5, why: e.k, big: a.big ? 1 : 0.5, fx: a.fx || null, lvl: 1, el: 'expl', enemy: 1 });
  emit(g, 'eshoot', { en: e, x: e.x, y: e.y, tx: t.x, ty: t.y, k: bomb ? 'ebomb' : 'eshell', fx: a.fx || null });
}
function en2ProjUpd(g, p, dt) {
  var u = Math.min(1, p.t / p.T);
  p.x = lerp(p.sx, p.tx, u); p.y = lerp(p.sy, p.ty, u); p.u = u;
  p.z = p.kind === 'ebomb' ? p.z0 * (1 - u * u) : p.z0 * (1 - u) + 4 * p.h * u * (1 - u);
  if (u < 1) return false;
  var n = en2StunArea(g, p.tx, p.ty, p.br, p.stun, p.why, 'stun');
  emit(g, 'blast', { x: p.tx, y: p.ty, r: p.br, k: p.fx === 'emp' ? 'emp' : 'he', enemy: 1, n: n });
  return true;
}
PROJ_UPD.eshell = en2ProjUpd;
PROJ_UPD.ebomb = en2ProjUpd;

// ---------- 행동 (자료의 acts, rot) ----------
// 한 행동을 실행. 할 일이 없었으면(범위에 탑이 없음 등) false → 곧 다시 시도
function en2Act(g, e, a) {
  var k = a.k, tw, n = 0, i;
  if (k === 'hex' || k === 'charm' || k === 'stun') {
    tw = en2Towers(g, e.x, e.y, a.r, a.n || 1, a.rand);
    for (i = 0; i < tw.length; i++) if (en2StunTower(g, tw[i], a.sec, e.k, k)) n++;
    if (n && a.fx) emit(g, 'blast', { x: tw[0].x, y: tw[0].y, r: 0.5, k: a.fx === 'bolt' ? 'emp' : a.fx, enemy: 1, pts: tw.map(function (t) { return [t.x, t.y]; }), from: [e.x, e.y] });
    return n > 0;
  }
  if (k === 'shell' || k === 'bomb') {
    tw = en2Towers(g, e.x, e.y, a.r, a.n || 1, a.rand);
    for (i = 0; i < tw.length; i++) { en2Shell(g, e, tw[i], a, k === 'bomb'); n++; }
    return n > 0;
  }
  if (k === 'slam') {
    if (!g.towers.some(function (t) { return d2(t.x, t.y, e.x, e.y) <= (a.r + 0.6) * (a.r + 0.6); })) return false;
    e.cast = { k: 'slam', t: a.tele || 1.2, T: a.tele || 1.2, r: a.r, stun: a.stun, fx: a.fx || 'he' };
    emit(g, 'warn', { en: e, x: e.x, y: e.y, r: a.r, sec: e.cast.T, k: e.cast.fx });
    return true;
  }
  if (k === 'jam') {
    g.towers.forEach(function (t) { if (d2(t.x, t.y, e.x, e.y) > a.r * a.r || !en2TowerFree(g, t)) return; t.jamT = Math.max(t.jamT || 0, a.sec); t.jamF = a.f || 0.4; n++; emit(g, 'towerStun', { tw: t, sec: a.sec, why: e.k, k: 'jam', x: t.x, y: t.y }); });
    if (n) emit(g, 'roar', { x: e.x, y: e.y, r: a.r, k: e.k });
    return n > 0;
  }
  if (k === 'summon') { n = en2Summon(g, e, a.type, a.n || 1); if (n) emit(g, 'summon', { x: e.x, y: e.y, k: e.k, type: a.type, n: n }); return n > 0; }
  if (k === 'launch') {   // 발진: 지금 자리에서 성문으로 곧게 날아가는 항로
    var Et = ENEMIES[a.type]; if (!Et || g.enemies.length >= EN2_MAXEN) return false;
    if (a.max) { e.lnN = e.lnN || {}; if ((e.lnN[a.type] || 0) >= a.max) return false; }
    for (i = 0; i < (a.n || 1); i++) {
      var ox = (i - ((a.n || 1) - 1) / 2) * 0.5, P = airPath([e.x - 0.5 + ox, e.y - 0.5, g.gate.c, g.gate.r]);
      spawnEnemy(g, a.type, 0, 0, { P: P, route: 'air', lane: 1, off: 0, gold: Math.round(Et.gold * 0.4), summoned: 1 }); n++;
      if (a.max) e.lnN[a.type] = (e.lnN[a.type] || 0) + 1;
    }
    emit(g, 'summon', { x: e.x, y: e.y, k: e.k, type: a.type, n: n, launch: 1 });
    return true;
  }
  if (k === 'clone') {   // 분신: 본체 모습(e.form)을 한 약한 가짜. 금화 없음
    var hp = e.mhp * (a.hp || 0.05);
    n = en2Summon(g, e, a.type, a.n || 1, { clone: 1, form: e.k, gold: 0, noAct: 1, hp: hp, mhp: hp, size: Math.min(e.size, 1.2) });
    if (n) emit(g, 'summon', { x: e.x, y: e.y, k: e.k, type: a.type, n: n, clone: 1 });
    return n > 0;
  }
  if (k === 'repair' || k === 'healAll') {
    g.enemies.forEach(function (o) { if (o.dead || o === e || o.boss || o.hp >= o.mhp || d2(o.x, o.y, e.x, e.y) > a.r * a.r) return; if (k === 'repair' && !(o.F || o.E).mech) return; o.hp = Math.min(o.mhp, o.hp + o.mhp * a.pct); n++; });
    if (n) emit(g, 'heal', { x: e.x, y: e.y, r: a.r, k: e.k });
    return n > 0;
  }
  if (k === 'shield') { if (e.shield > 0) return false; e.shield = e.mhp * a.pct; emit(g, 'ward', { x: e.x, y: e.y, r: e.size * 0.6, boss: e.boss ? 1 : 0, k: e.k }); return true; }
  if (k === 'blink') { if (e.slowT > 0 || e.blocked) return false; return en2Blink(g, e, a.dist); }
  if (k === 'dash') { e.dash = a.sec; e.dashK = a.spd; emit(g, 'rage', { en: e, x: e.x, y: e.y, dash: 1 }); return true; }
  if (k === 'scatter') {   // 박쥐 떼로 흩어짐: 그동안 맞지 않고 빨라짐
    e.scat = a.sec; e.scatK = a.spd || 1.5; e.fade = 1; e.untarget = 1;
    if (a.type) { n = en2Summon(g, e, a.type, a.n || 3); if (n) emit(g, 'summon', { x: e.x, y: e.y, k: e.k, type: a.type, n: n }); }
    emit(g, 'scatter', { en: e, x: e.x, y: e.y, on: 1, sec: a.sec });
    return true;
  }
  if (k === 'drain') {   // 흡혈: 가까운 탑을 저주로 멈추고 그만큼 회복
    tw = en2Towers(g, e.x, e.y, a.r, a.n || 1);
    for (i = 0; i < tw.length; i++) if (en2StunTower(g, tw[i], a.sec, e.k, 'hex')) n++;
    if (n) { e.hp = Math.min(e.mhp, e.hp + e.mhp * (a.heal || 0.02) * n); emit(g, 'heal', { x: e.x, y: e.y, r: a.r, k: e.k, drain: 1 }); }
    return n > 0;
  }
  return false;
}
// 체력 구간(phase)을 반영한 자료 칸
function en2P(e, D, key) { if (e.ph && D.phase) for (var i = Math.min(e.ph, D.phase.length) - 1; i >= 0; i--) if (D.phase[i].set[key] !== undefined) return D.phase[i].set[key]; return D[key]; }

// ---------- 등록 고리 4종 (모든 새 적이 같이 씀) ----------
function en2Spawn(g, e) {
  var D = e.F || e.E;
  e.ph = 0; e.spdK = 1;
  if (D.hide) e.stealth = true;
  if (D.shield0) e.shield = e.mhp * D.shield0;
  if (D.grow) e.grow = 1;
  if (D.warn) emit(g, 'laneWarn', { en: e, k: e.k, x: e.x, y: e.y, pi: e.pi });
}
function en2Tick(g, e, dt) {
  var D = e.F || e.E, sealed = e.sealT > 0, stun = e.stunT > 0, hpR = e.hp / e.mhp, v, i;
  // 체력 구간
  if (D.phase && !sealed) while (e.ph < D.phase.length && hpR < D.phase[e.ph].below) { e.ph++; e.cdT = null; emit(g, 'phase', { en: e, n: e.ph, k: e.form || e.k, x: e.x, y: e.y }); }
  if ((v = en2P(e, D, 'spdX'))) e.spdK *= v;
  // 주기적으로 흐려짐(원혼, 장산범): 조명 탑 근처, 봉인, 빙결 중에는 못 흐려짐
  if ((v = D.fadeCyc)) {
    if (e.fdT == null) e.fdT = v.on * (0.4 + 0.6 * e.anim);
    if (sealed || e.frozen || en2Lit(g, e.x, e.y)) e.fdT = Math.max(e.fdT, 0.5); else { e.fdT -= dt; if (e.fdT < -v.off) e.fdT = v.on; }
    e.fade = clamp((e.fade || 0) + (e.fdT < 0 ? dt : -dt) / 0.25, 0, 1); e.untarget = e.fade > 0.5 ? 1 : 0;
  }
  // 잠수 주기(잠수함): 봉인, 기절 중이거나 길 끝 2.5칸 안에서는 떠 있음
  if ((v = D.subCyc)) {
    if (e.sbT == null) e.sbT = v.up * (0.4 + 0.6 * e.anim);
    if (sealed || stun || e.P.len - e.d < 2.5) e.sbT = Math.max(e.sbT, 0.3); else { e.sbT -= dt; if (e.sbT < -v.down) e.sbT = v.up; }
    e.sub = clamp((e.sub || 0) + (e.sbT < 0 ? dt : -dt) / 0.5, 0, 1); e.untarget = e.sub > 0.5 ? 1 : 0;
  }
  // 숨음(달걀귀신, 물귀신): 길 끝 near칸 전까지. 봉인되면 드러남
  if (D.hide && e.stealth) { if (e.P.len - e.d < D.hide.near) { e.stealth = false; e.revealed = 0; emit(g, 'reveal', { en: e, x: e.x, y: e.y }); } else if (sealed) e.revealed = 1; }
  // 폭주(늑대인간)
  if ((v = D.rage)) { if (!e.rage && hpR < v.hp && !sealed) { e.rage = 1; emit(g, 'rage', { en: e, x: e.x, y: e.y }); } if (e.rage && !sealed) e.spdK *= v.spd; }
  // 변신(흡혈귀, 이무기)
  if ((v = D.morph) && !e.form && hpR < v.hp && !sealed && !stun) { en2Morph(g, e, v.to, v.heal); return; }
  // 성장(어둑시니): 조명 탑 근처와 봉인 중에는 멈춤
  if ((v = D.grow) && !sealed && e.grow < v.max && !en2Lit(g, e.x, e.y)) {
    var g0 = e.grow, g1 = Math.min(v.max, g0 + v.rate * dt), base = e.mhp / g0;
    e.grow = g1; e.mhp = base * g1; e.hp += base * (g1 - g0); e.size = D.size * (1 + (g1 - 1) * 0.45); e.armor = Math.min(0.5, (D.armor || 0) + (g1 - 1) * 0.25);
  }
  // 주변 적 가속(탈광대)
  if ((v = D.haste) && !sealed && !stun) {
    e.hsT = (e.hsT || 0) - dt;
    if (e.hsT <= 0) { e.hsT = 0.25; for (i = 0; i < g.enemies.length; i++) { var o = g.enemies[i]; if (o.dead || o === e || o.boss || d2(o.x, o.y, e.x, e.y) > v.r * v.r) continue; o.buffSpd = Math.max(o.buffSpdT > 0 ? o.buffSpd : 0, v.spd); o.buffSpdT = Math.max(o.buffSpdT, 0.5); } }
  }
  // 흩어짐(흡혈 백작), 돌진(거대 전차)
  if (e.scat > 0) { e.scat -= dt; e.spdK *= e.scatK; e.fade = 1; e.untarget = 1; if (e.scat <= 0 || sealed) { e.scat = 0; e.fade = 0; e.untarget = 0; emit(g, 'scatter', { en: e, x: e.x, y: e.y, on: 0 }); } }
  if (e.dash > 0) { e.dash -= dt; if (!sealed) e.spdK *= e.dashK; }
  // 예고 중인 광역 공격: 기절이나 봉인으로 끊을 수 있다. 모으는 동안은 느리게 걷는다
  if (e.cast) {
    if (sealed || stun) { emit(g, 'warn', { en: e, x: e.x, y: e.y, r: e.cast.r, sec: 0, k: e.cast.fx, cancel: 1 }); e.cast = null; }
    else {
      e.cast.t -= dt; e.spdK *= 0.3;
      if (e.cast.t <= 0) { var c = e.cast; e.cast = null; var hit = en2StunArea(g, e.x, e.y, c.r, c.stun, e.k, 'stun'); emit(g, 'blast', { x: e.x, y: e.y, r: c.r, k: c.fx, enemy: 1, n: hit, big: 1 }); }
    }
    return;
  }
  if (sealed || e.noAct || e.scat > 0) return;
  // 행동: 저마다의 재사용 시간. 기절 중에는 시간만 흐르고 쓰지 못함
  var acts = en2P(e, D, 'acts'), T = e.cdT || (e.cdT = {});
  if (acts) for (i = 0; i < acts.length; i++) {
    var a = acts[i], key = 'a' + i;
    if (T[key] == null) T[key] = a.cd * (0.45 + 0.5 * e.anim);
    if (a.k === 'shield' && e.shield > 0) { T[key] = a.cd; continue; }   // 보호막은 깨진 뒤 cd초가 지나야 다시 두른다
    T[key] -= dt; if (T[key] > 0) continue;
    if (stun) { T[key] = 0; continue; }
    T[key] = en2Act(g, e, a) ? a.cd : 0.6;
    if (e.cast || e.dead) return;
  }
  if ((v = D.rot)) {   // 차례로 번갈아 쓰는 행동(강철 거신)
    var rc = en2P(e, D, 'rotCd') || v.cd;
    if (T.rot == null) T.rot = rc * 0.6;
    T.rot -= dt;
    if (T.rot <= 0 && !stun) { var ra = v.acts[(e.rot || 0) % v.acts.length]; e.rot = (e.rot || 0) + 1; T.rot = en2Act(g, e, ra) ? rc : 1; }
  }
}
// 피해 고리: 갑옷과 상성을 셈한 피해 a를 받아 바뀐 피해를 돌려줌(0이면 안 맞음)
function en2Hurt(g, e, a, info) {
  var D = e.F || e.E, tw = info.src && info.src.tw, v;
  if (e.fade > 0.5 || e.sub > 0.5) return 0;                                             // 흐려짐, 잠수: 안 맞음
  if (D.aaOnly && tw && (tw.hit || '').indexOf('g') >= 0) a *= D.aaOnly;                 // 고속 비행체: 대공 전용이 아니면 덜 맞음
  if (D.hull && tw && tw.site !== 'water') a *= D.hull;                                  // 두꺼운 선체: 땅 탑은 덜 통함
  if (D.fireX && info.el === 'fire') a *= D.fireX;
  if (D.boltX && info.el === 'bolt') a *= D.boltX;
  var sealed = e.sealT > 0;
  if (D.evade && !sealed && !info.quiet && !(e.slowT > 0) && !(e.stunT > 0) && !(e.markT > 0) && g.rnd() < D.evade) { cfx(g, e, 'dodge'); return 0; }   // 회피
  if ((v = D.blinkHit) && !sealed && !info.quiet && a >= e.mhp * v.pct && a < e.hp && !((e.bkT || 0) > g.t) && !(e.stunT > 0)) { e.bkT = g.t + v.cd; en2Blink(g, e, v.dist); }   // 크게 맞으면 순간 이동
  return a;
}
// 죽기 직전 고리: false면 죽음 취소
function en2Die(g, e, src) {
  var D = e.F || e.E, sealed = e.sealT > 0, v;
  if ((v = D.rise) && !e.risen && !sealed && !(e.burnT > 0) && g.rnd() < v.p) {   // 다시 일어남(좀비)
    e.risen = 1; e.hp = e.mhp * v.hp; e.reviveT = v.t; e.untarget = 1; e.poisonT = 0; e.poisonDps = 0;
    emit(g, 'bones', { x: e.x, y: e.y, id: e.id, k: e.k });
    return false;
  }
  if ((v = D.boom) && !sealed && !e.frozen) {   // 터짐(호박머리): 얼어 있으면 안 터짐
    var n = en2StunArea(g, e.x, e.y, v.r, v.stun, e.k, 'stun');
    emit(g, 'blast', { x: e.x, y: e.y, r: v.r, k: 'fire', enemy: 1, n: n });
  }
  if (e.cast) e.cast = null;
}
(function () {
  var AB = { spawn: en2Spawn, tick: en2Tick, hurt: en2Hurt, die: en2Die };
  EN2_ORDER.concat(['vampbat']).forEach(function (k) { if (ENEMIES[k] && !EN_AB[k]) EN_AB[k] = AB; });
})();

// ---------- 엔진 고리 (logic.js updateEnemies가 부름) ----------
// 매 걸음 한 번: 탑 공격 속도 감소(jam). t.cd를 쓰는 탑은 재장전이 jamF만큼 느려진다
function en2Step(g, dt) {
  for (var i = 0; i < g.towers.length; i++) { var t = g.towers[i]; if (t.jamT > 0) { t.jamT -= dt; if (t.cd > 0) t.cd += dt * (t.jamF || 0.4); } }
  for (var u = 0; u < g.units.length; u++) g.units[u].bn = 0;   // 막는 유닛이 이번 걸음에 붙잡은 적 수
}
// 적마다 매 걸음(1장 적 포함): 봉인과 공포 시간, 속도 배수 초기화, 조명 탑이 숨은 적을 드러냄, night 규칙의 어둠
function en2Common(g, e, dt) {
  if (e.sealT > 0) e.sealT -= dt;
  if (e.fearT > 0) e.fearT -= dt;
  if (e.hopT > 0) e.hopT -= dt;
  e.spdK = e.fearT > 0 && e.fearF ? 1 - Math.min(0.8, e.fearF) : 1;   // 공포 느림: 탑 쪽이 e.fearF(0~0.8)를 주면 반영
  if (e.stealth && !e.revealed && en2Lit(g, e.x, e.y)) e.revealed = 1;
}
// 막는 유닛(병사): u.block이 참이고 살아 있는 유닛은 길 위에서 땅 적을 세운다. u.block = 한 번에 붙잡는 수(1이면 한 마리)
// 붙잡힌 적은 e.blocked = u, 유닛 체력(u.hp가 숫자면)은 방책과 같은 세기로 깎인다. 뛰어넘는 적(leap)은 지나가며 'leap' 사건
function en2Block(g, e, nd, dt) {
  if (nd <= e.d) return nd;
  var leap = e.E.leap && !(e.sealT > 0);
  for (var i = 0; i < g.units.length; i++) {
    var u = g.units[i]; if (!u.block || u.dead || (typeof u.hp === 'number' && u.hp <= 0)) continue;
    var dx = u.x - e.x, dy = u.y - e.y, rr = 0.42 + e.size * 0.12;
    if (dx * dx + dy * dy > rr * rr || dx * e.dirx + dy * e.diry < -0.12) continue;   // 앞쪽 가까이에 있는 유닛만
    if (leap) { if (!(e.hopT > 0)) emit(g, 'leap', { en: e, x: e.x, y: e.y, over: 'unit' }); e.hopT = 0.45; continue; }
    var cap = u.block === true ? 1 : +u.block || 1;
    if ((u.bn || 0) >= cap) continue;
    u.bn = (u.bn || 0) + 1; e.blocked = u;
    if (typeof u.hp === 'number') u.hp -= (e.boss ? 260 : 6 + e.mhp * 0.025) * (e.E.smash || 1) * dt;
    return e.d;
  }
  return nd;
}
