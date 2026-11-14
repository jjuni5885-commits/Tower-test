// ===== logic_towers2.js : v2.0 새 탑 14종, 관리자 탑 2종, 합체 탑 8종의 공격 로직과 합체 (ENG2) =====
// 등록 고리(docs/ENGINE.md 5절): TW_ACT[kind], TW_INIT, TW_SOLD, PROJ_UPD[탄 kind], UNIT_UPD[유닛 kind]. 수치는 data_towers2.js
// 탄, 사건, 유닛, 탑 상태 칸은 docs/SPEC.md 7절 그대로. 더한 칸과 사건은 docs/REPORT_eng2.md 표 참고
var TW2_UNIT_CAP = 48, TW2_PLANE_MAX = 6, TW2_HOLD_MAX = 10;
// 기계(EMP에 약함), 귀신과 요괴(부적에 약함): ENEMIES[k].mech, .spirit이 있으면 그것도 인정. 병사를 뛰어넘는 적: ENEMIES[k].leap 또는 아래 표
var TW2_MECH = { golemL: 1, golemM: 1, golemS: 1, wagon: 1, biker: 1, jeep: 1, apc: 1, tank: 1, mech: 1, truck: 1, drone: 1, heli: 1, jet: 1, bomber: 1, missile: 1, boat: 1, destroyer: 1, submarine: 1, bigtank: 1, fortress: 1, carrier: 1, titan: 1 };
var TW2_SPIRIT = { stalker: 1, skeleton: 1, wraith: 1, warlock: 1, barkan: 1, zombie: 1, ghoul: 1, phantom: 1, pumpkin: 1, bats: 1, witch: 1, mummy: 1, scarab: 1, werewolf: 1, vampire: 1, vampbat: 1, coffin: 1, doll: 1, gargoyle: 1, pumpking: 1, count: 1, reaper: 1 };
var TW2_LEAP = { ghoul: 1, horangi: 1 };
function tw2IsMech(e) { var D = e.F || e.E; return !!(D && (D.mech || TW2_MECH[e.k])); }   // e.F = 변신 뒤 자료(ENG1)
function tw2IsSpirit(e) { var D = e.F || e.E; return !!(D && (D.spirit || D.ghost || D.yokai || TW2_SPIRIT[e.k])); }   // 타임플렉스: 장 번호(ch 4)로 귀신을 가리지 않음, spirit, ghost, yokai 표시로
function tw2Alive(e) { return !!e && (e.kind === 'obs' ? !!e.alive : !e.dead && !e.untarget); }
function tw2Src(t) { return { tw: t, ap: t.st.ap || 0, el: t.st.el }; }
function tw2Aim(t, x, y) { t.aim = Math.atan2(y - t.y, x - t.x); }
// 쏜 직후 상태(그리기용): fireT 0.35 → 0, shots, side. n > 0이면 포구 섬광 사건 'muzzle'
function tw2Fired(g, t, n) { t.fireT = 0.35; t.shots = (t.shots || 0) + 1; t.side = 1 - (t.side || 0); if (n) emit(g, 'muzzle', { tw: t, n: n, x: t.x, y: t.y, k: t.k, aim: t.aim }); }
function tw2EZ(e) { return !e || e.kind === 'obs' ? 0.2 : e.dom === 'a' ? (e.z || 0.75) : e.size * 0.3; }

// ---------- 능력치 고리 (logic.js refreshStats에서 불림) ----------
// 끝이 Dmg, Dps인 덤 피해 칸에 연구, 종탑, 탑 별 배수(dm), 새 탑 카드 28장
function tw2Stats(g, t, st, dm, dot, C) {
  for (var k in st) { if (k === 'dmg' || k === 'zoneDps' || k === 'auraDps' || typeof st[k] !== 'number') continue; var n = k.length; if (n > 3 && (k.indexOf('Dmg', n - 3) === n - 3 || k.indexOf('Dps', n - 3) === n - 3)) st[k] *= dm; }
  if (st.kind === 'totem') { if (st.auraDps) st.auraDps *= dm; }
  if (C.fl_rapid) st.rate *= 1 + 0.2 * C.fl_rapid;
  if (C.fl_burst && st.splash) st.splash *= 1 + 0.3 * C.fl_burst;
  if (C.sm_warhead) st.dmg *= 1 + 0.25 * C.sm_warhead;
  if (C.sm_twin) st.extra = 1;
  if (C.gt_ap) { st.ap = Math.max(st.ap || 0, 0.3 * C.gt_ap); st.soft = Math.max(0, (st.soft || 0) - 0.2 * C.gt_ap); }
  if (C.gt_heat) st.rate *= 1 + 0.15 * C.gt_heat;
  if (C.sn_crit) { st.crit = (st.crit || 0) + 0.15 * C.sn_crit; st.critX = Math.max(st.critX || 0, 2.5); }
  if (C.sn_stun) st.stun = Math.max(st.stun || 0, 0.4 * C.sn_stun);
  if (C.rk_more && st.n) st.n += 2 * C.rk_more;
  if (C.rk_reload) st.rate /= 1 - 0.15 * C.rk_reload;
  if (C.ls_focus && st.ramp) st.ramp *= Math.pow(0.65, C.ls_focus);
  if (C.ls_range) st.range *= 1 + 0.12 * C.ls_range;
  if (C.ts_chain && st.chain) st.chain += 2 * C.ts_chain;
  if (C.ts_stun) st.stun = (st.stun || 0) + 0.15 * C.ts_stun;
  if (C.ab_plane) st.planes = (st.planes || 1) + 1;
  if (C.ab_gun) st.dmg *= 1 + 0.25 * C.ab_gun;
  if (C.ws_range) st.range *= 1 + 0.12 * C.ws_range;
  if (C.ws_shell && st.splash) st.splash *= 1 + 0.25 * C.ws_shell;
  if (C.tt_flame && st.flameDps) st.flameDps *= 1 + 0.4 * C.tt_flame;
  if (C.tt_ball && st.n) st.n += 1;
  if (C.sj_more && st.n) st.n += 3 * C.sj_more;
  if (C.sj_fire) { st.burn = Math.max(st.burn || 0, 10 + st.dmg); st.burnT = st.burnT || 2.5; }
  if (C.js_fear && st.fear) st.fear = Math.min(0.75, st.fear + 0.08 * C.js_fear);
  if (C.js_wide) st.range *= 1 + 0.2 * C.js_wide;
  if (C.bk_hp && st.sHp) st.sHp *= 1 + 0.35 * C.bk_hp;
  if (C.bk_fast && st.respawn) st.respawn *= Math.pow(0.6, C.bk_fast);
  if (C.sh_seal && st.seal) st.seal += C.sh_seal;
  if (C.sh_multi) st.multi = (st.multi || 1) + 1;
  if (st.kind === 'totem') st.reveal = st.range;   // 드러내기 범위는 기운 범위와 같게(카드, 안개 반영 전 범위)
}
// 판옥 대장선(navAura): 주변 수상 탑의 피해, 공격 속도 버프 (종탑 버프와 큰 쪽)
function tw2Buff(g, t, b) {
  if (t.site !== 'water') return;
  for (var i = 0; i < g.towers.length; i++) {
    var o = g.towers[i]; if (o === t || o.k !== 'turtle' || o.lvl < 4 || o.br !== 1) continue;
    var s = towerStats(o.k, o.lvl, o.br); if (!s.navAura || d2(o.x, o.y, t.x, t.y) > s.navR * s.navR + 0.01) continue;
    b.dmg = Math.max(b.dmg, s.navAura); b.spd = Math.max(b.spd, s.navSpd || 0);
  }
}
// 탑의 덤 효과 묶음: 보통은 st 그대로, 켜진 조합이 있으면 덧붙인 복사본 (st가 바뀔 때마다 다시 만듦)
function tw2F(g, t) {
  var st = t.st; if (t.fSt === st) return t.fObj;
  var k = t.k, add = null, f = st;
  if (k === 'flak' && cmbOn(g, k, 'barrage')) add = { slow: Math.max(st.slow || 0, 0.2), slowT: st.slowT || 1.2 };
  else if (k === 'laser' && cmbOn(g, k, 'coldBeam')) add = { slow: Math.max(st.slow || 0, 0.3), slowT: st.slowT || 1 };
  else if (k === 'warship' && cmbOn(g, k, 'spotter')) add = { slow: 0.2, slowT: 1.5 };
  else if (k === 'shrine' && cmbOn(g, k, 'sealWard')) add = { mark: Math.max(st.mark || 0, 0.15), markT: st.seal || 3 };
  if (add) { f = {}; for (var a in st) f[a] = st[a]; for (var b in add) f[b] = add[b]; }
  t.fSt = st; t.fObj = f; return f;
}

// ---------- 피해와 덤 효과 ----------
// 표적별 배수
function tw2Mul(e, f) {
  if (!f || e.kind === 'obs') return 1; var m = 1;
  if (f.airX && e.dom === 'a') m *= f.airX;
  if (f.seaX && e.dom === 's') m *= f.seaX;
  if (f.bossX && e.boss) m *= f.bossX;
  if (f.armX && !e.boss && e.armor >= 0.4) m *= f.armX;
  if (f.spiritX && tw2IsSpirit(e)) m *= f.spiritX;
  if (f.mechX && tw2IsMech(e)) m *= f.mechX;
  if (f.swat && !e.boss && e.size <= 0.62) m *= f.swat;
  if (f.soft) m *= 1 - f.soft * effArmor(e);
  return m;
}
// 맞은 적에게 덤 효과 (ENG1과의 약속: 봉인 e.sealT, 표식 e.markT/markA, 공포 e.fearT)
function tw2Fx(g, e, f, dmg, src) {
  if (!f || e.dead) return;
  if (f.slow) slowE(e, f.slow, f.slowT || 1.5);
  if (f.stun) stunE(e, f.stun);
  if (f.burn) burnE(e, f.burn, f.burnT || 2.5);
  if (f.shred) { e.shredA = Math.max(e.shredA, f.shred); e.shredT = Math.max(e.shredT, f.shredT || 4); }
  if (f.shredAdd) { e.shredA = Math.max(e.shredA, Math.min(f.shredMax || 0.3, e.shredA + f.shredAdd)); e.shredT = Math.max(e.shredT, 3); }
  if (f.seal) tw2Seal(g, e, f.seal, f.sealBreak);
  if (f.mark) { e.markT = Math.max(e.markT, f.markT || 4); e.markA = Math.max(e.markA, f.mark); }
  if (f.knock && !e.boss && e.dom === 'g') knockE(e, f.knock * (e.size < 0.9 ? 1 : 0.5));
  if (f.exec && !e.boss && e.hp < e.mhp * f.exec) { emit(g, 'blast', { x: e.x, y: e.y, r: 0.4, k: 'dark', exec: 1 }); hurt(g, e, e.hp + e.shield + 1, 'true', src); return; }
  if (f.cardEl) elHit(g, f, e, dmg, src);
}
// 능력 봉인: e.sealT(초). brk면 보호막과 가속도 벗김. 시간 줄이기와 능력 정지는 적 쪽(ENG1)
function tw2Seal(g, e, sec, brk) {
  if (e.boss) sec *= 0.5;
  if (!(e.sealT > 0)) emit(g, 'seal', { en: e, x: e.x, y: e.y, sec: sec });
  e.sealT = Math.max(e.sealT || 0, sec);
  if (brk) { if (e.shield > 0) { e.shield = 0; emit(g, 'shieldBreak', { x: e.x, y: e.y }); } e.buffSpdT = 0; }
}
// 한 적(또는 장애물)에게 피해 + 덤 효과. 돌려주는 값 = 들어간 피해
function tw2Hit(g, e, dmg, dk, src, f, opt) {
  if (!e) return 0;
  if (e.kind === 'obs') { hurtObs(g, e, dmg); return dmg; }
  if (e.dead) return 0;
  var a = hurt(g, e, dmg * tw2Mul(e, f), dk, src, !!(opt && opt.quiet), opt || null);
  if (a > 0 && !e.dead) tw2Fx(g, e, f, dmg, src);
  return a;
}
// 범위 피해: 가장자리로 갈수록 35%까지 줄어듦. hit = 영역 글자 모음
function tw2Splash(g, x, y, r, dmg, dk, src, f, hit, quiet) {
  var hs = fdHitOf(hit), n = 0, opt = quiet ? { quiet: 1 } : null;
  for (var i = 0; i < g.enemies.length; i++) {
    var e = g.enemies[i]; if (e.dead || e.untarget || hs.indexOf(e.dom) < 0) continue;
    var rr = r + e.size * 0.2, dd = d2(e.x, e.y, x, y); if (dd > rr * rr) continue;
    tw2Hit(g, e, dmg * (1 - 0.35 * Math.sqrt(dd) / rr), dk, src, f, opt); n++;
  }
  for (var j = 0; j < g.obs.length; j++) { var o = g.obs[j]; if (o.alive && g.focus && g.focus.o === o && d2(o.x, o.y, x, y) < (r + 0.4) * (r + 0.4)) hurtObs(g, o, dmg * 0.6); }
  return n;
}
// 사거리 안 표적 n개 (앞선 순서, first가 맨 앞)
function tw2Targets(g, t, st, hit, n, first, range) {
  var out = first && first.kind !== 'obs' ? [first] : [], r = (range || st.range) + 0.12, L = [];
  if (out.length >= n) return out;
  for (var i = 0; i < g.enemies.length; i++) { var e = g.enemies[i]; if (e === first || !targetable(g, e, hit) || !seenBy(e, st) || !inR(t, e.x, e.y, r + e.size * 0.2)) continue; L.push(e); }
  L.sort(function (a, b) { return (a.P.len - a.d) - (b.P.len - b.d); });
  for (var j = 0; j < L.length && out.length < n; j++) out.push(L[j]);
  return out;
}
function tw2AnyIn(g, t, r, hit) { for (var i = 0; i < g.enemies.length; i++) { var e = g.enemies[i]; if (targetable(g, e, hit) && inR(t, e.x, e.y, r + e.size * 0.2)) return true; } return false; }

// ---------- 탄 ----------
// 쫓는 탄(flakshell, missile, bullet, talisman, sinarrow, torpedo): 표적을 따라가 맞으면 tw2Impact
// 공통 칸(SPEC 7절): x, y, z, ang, lvl, el, big. 더한 칸: tgt, tx, ty, sp, dmg, dk, src, f(덤 효과), hit, splash, bk(폭발 종류), k(쏜 탑 키), turn(미사일 선회)
function tw2Shot(g, t, kind, e, o) {
  var p = { kind: kind, x: t.x + Math.cos(t.aim) * 0.3, y: t.y + Math.sin(t.aim) * 0.3, z: 0.6, ang: t.aim, tgt: e, tx: e.x, ty: e.y, sp: 10, dmg: 0, dk: TOWERS[t.k].dmgType, src: null, f: null, hit: t.hit, splash: 0, bk: null, lvl: t.lvl, el: t.st.cardEl || null, big: 0, t: 0, k: t.k };
  for (var a in o) p[a] = o[a];
  if (!p.src) p.src = tw2Src(t);
  if (p.f === null) p.f = tw2F(g, t);
  p.sx0 = p.x; p.sy0 = p.y;
  g.proj.push(p); return p;
}
function tw2HomingUpd(g, p, dt) {
  if (!p.src || p.sp == null) return p.t > (p.life || 3);   // 이 파일이 쏜 탄이 아니면(그리기 시험용 가짜 탄) 건드리지 않고 수명만
  var e = p.tgt, alive = tw2Alive(e);
  if (alive) { p.tx = e.x; p.ty = e.y; p.tz = tw2EZ(e); }
  else if (p.retarget && !p.lost) { var nx = nearEnemies(g, p.tx, p.ty, p.retarget, 1, null, p.hit)[0]; if (nx) { p.tgt = nx; return false; } p.lost = 1; }
  if (p.acc) p.sp = Math.min(p.spMax || 99, p.sp + p.acc * dt);
  var dx = p.tx - p.x, dy = p.ty - p.y, L = Math.hypot(dx, dy), s = p.sp * dt;
  if (p.tz != null) p.z += (p.tz - p.z) * Math.min(1, s / Math.max(L, s));
  if (p.turn && p.t < 1.4 && L > 0.3 + s) {   // 미사일: 처음에는 쏜 방향으로 나가다 휘어 들어감. 1.4초 뒤에는 곧장
    var mx = p.turn * (1 + p.t * 2) * dt; p.ang += clamp(angDiff(p.ang, Math.atan2(dy, dx)), -mx, mx);
    p.x += Math.cos(p.ang) * s; p.y += Math.sin(p.ang) * s;
    return false;
  }
  if (L > 1e-6) p.ang = Math.atan2(dy, dx);
  if (L <= s || L < 0.06) { p.x = p.tx; p.y = p.ty; tw2Impact(g, p, alive ? e : null); return true; }
  p.x += dx / L * s; p.y += dy / L * s;
  if (p.t > (p.life || 5)) { tw2Impact(g, p, null); return true; }
  return false;
}
// 포물선 탄(rocket, navshell, ball, bomb): sx, sy → tx, ty를 T초에. z = 높이, u = 진행(0~1)
function tw2Lob(g, t, kind, tx, ty, o) {
  var sx = o.sx != null ? o.sx : t.x, sy = o.sy != null ? o.sy : t.y, dist = hyp(sx, sy, tx, ty);
  var p = { kind: kind, sx: sx, sy: sy, tx: tx, ty: ty, x: sx, y: sy, z: 0.6, h0: 0.6, h: 0.5 + dist * 0.15, T: 0.4 + dist * 0.08, u: 0, ang: Math.atan2(ty - sy, tx - sx), dmg: 0, dk: TOWERS[t.k].dmgType, src: null, f: null, hit: t.hit, splash: 0.5, bk: 'he', lvl: t.lvl, el: t.st.cardEl || null, big: 0, t: 0, k: t.k };
  for (var a in o) p[a] = o[a];
  if (!p.src) p.src = tw2Src(t);
  if (p.f === null) p.f = tw2F(g, t);
  p.z = p.h0; g.proj.push(p); return p;
}
function tw2LobUpd(g, p, dt) {
  if (!p.src || p.T == null) return p.t > (p.life || 3);
  var u = Math.min(1, p.t / p.T); p.u = u;
  p.x = lerp(p.sx, p.tx, u); p.y = lerp(p.sy, p.ty, u); p.z = p.h0 * (1 - u) + 4 * p.h * u * (1 - u);
  if (u < 1) return false;
  p.z = 0; tw2Impact(g, p, p.tgt && p.tgt.kind === 'obs' && p.tgt.alive ? p.tgt : null); return true;
}
// 탄이 닿았을 때: 범위(splash)면 주변 전부, 아니면 표적 하나. 그 뒤 장판(zone), 탑별 덤(on), 사건(blast 또는 impact)
function tw2Impact(g, p, e) {
  var x = p.x, y = p.y;
  if (p.splash) { tw2Splash(g, x, y, p.splash, p.dmg, p.dk, p.src, p.f, p.hit); if (e && e.kind === 'obs') hurtObs(g, e, p.dmg); }
  else if (e) tw2Hit(g, e, p.dmg, p.dk, p.src, p.f, { single: 1, fx: p.sx0, fy: p.sy0 });
  if (p.zone) g.zones.push({ kind: 'fire', x: x, y: y, r: p.zone.r, t: p.zone.t, T: p.zone.t, dps: p.zone.dps, src: p.src });
  if (p.on) p.on(g, p, e, x, y);
  var bk = p.bk; if (bk === 'auto') { var ci = Math.floor(y) * g.cols + Math.floor(x); bk = x >= 0 && y >= 0 && x < g.cols && y < g.rows && g.kind[ci] === 'water' ? 'water' : 'he'; }
  if (bk) emit(g, 'blast', { x: x, y: y, r: p.splash || 0.3, k: bk, lvl: p.lvl, el: p.el, z: p.z || 0, big: p.big || 0, src: p.kind, tw: p.src && p.src.tw });
  else emit(g, 'impact', { x: x, y: y, z: p.z || 0, k: p.kind, en: e && e.kind !== 'obs' ? e : null, el: p.el, lvl: p.lvl, tw: p.src && p.src.tw });
}
PROJ_UPD.flakshell = tw2HomingUpd; PROJ_UPD.missile = tw2HomingUpd; PROJ_UPD.bullet = tw2HomingUpd; PROJ_UPD.talisman = tw2HomingUpd; PROJ_UPD.sinarrow = tw2HomingUpd; PROJ_UPD.torpedo = tw2HomingUpd;
PROJ_UPD.rocket = tw2LobUpd; PROJ_UPD.navshell = tw2LobUpd; PROJ_UPD.ball = tw2LobUpd; PROJ_UPD.bomb = tw2LobUpd;
// 적의 포탄, 폭탄(ebomb, eshell)을 사거리 안에서 하나 떨어뜨림 (신의 방패함, 이지스)
function tw2Intercept(g, t, r) {
  for (var i = 0; i < g.proj.length; i++) { var p = g.proj[i]; if ((p.kind === 'ebomb' || p.kind === 'eshell') && !p.icpt && inR(t, p.x, p.y, r)) { p.icpt = 1; g.proj.splice(i, 1); emit(g, 'blast', { x: p.x, y: p.y, r: 0.5, k: 'flak', z: p.z || 0.6, icpt: 1, tw: t }); emit(g, 'tracer', { x0: t.x, y0: t.y, z0: 0.7, x1: p.x, y1: p.y, z1: p.z || 0.6, k: 'icpt', tw: t }); return true; } }
  return false;
}
// 일제 사격 상태 기계(로켓, 신기전): t.salvoN 발을 gap 간격으로 fire(i)
function tw2Salvo(g, t, dt, gap, fire) {
  if (!(t.salvoN > 0)) return false;
  t.salvoT -= dt;
  while (t.salvoN > 0 && t.salvoT <= 0) { fire(t.salvoI++); t.salvoN--; t.salvoT += gap; }
  return true;
}

// ---------- 대공포 (flak): 하늘만, 빠른 연사와 작은 폭발 ----------
// A 팔랑크스: 초연사, 작은 적에 배수(swat), 6단계 철의 장막 = 사거리 안 하늘 적을 계속 느리게. B 고사포: 큰 폭발과 감속, 6단계 하늘 분쇄기 = 폭발이 4갈래로 더 터지고 갑옷 깎음
function tw2FlakCluster(g, p, e, x, y) {
  var n = p.f.cluster || 0;
  for (var i = 0; i < n; i++) { var a = i / n * 6.283 + p.t * 3, cx = x + Math.cos(a) * 0.8, cy = y + Math.sin(a) * 0.8; tw2Splash(g, cx, cy, p.splash * 0.5, p.dmg * 0.2, p.dk, p.src, null, p.hit, true); emit(g, 'blast', { x: cx, y: cy, r: p.splash * 0.5, k: 'flak', z: p.z || 0.7, lvl: p.lvl, sub: 1 }); }
}
TW_ACT.flak = function (g, t, dt) {
  var st = t.st; t.cd -= dt;
  if (st.curtain) { t.curT = (t.curT || 0) - dt; if (t.curT <= 0) { t.curT = 0.4; for (var i = 0; i < g.enemies.length; i++) { var o = g.enemies[i]; if (!o.dead && o.dom === 'a' && inR(t, o.x, o.y, st.range)) slowE(o, st.curtain, 0.7); } } }
  if (t.cd > 0) return;
  var e = pickTarget(g, t, st); if (!e) { t.cd = 0.08; return; }
  t.cd = 1 / st.rate; tw2Aim(t, e.x, e.y); tw2Fired(g, t, 1);
  tw2Shot(g, t, 'flakshell', e, { sp: 13, dmg: st.dmg * critMul(g, st), splash: st.splash, bk: 'flak', big: st.big || 0, on: st.cluster ? tw2FlakCluster : null });
};

// ---------- 유도탄 포대 (missile): 하늘 우선 유도 미사일 ----------
// A 장거리 요격탄: 아주 먼 사거리, 우두머리 배수, 6단계 스카이 랜서 = 체력 15% 아래 하늘 적 처형. B 다탄두: 여러 표적, 땅도, 6단계 미사일 폭풍 = 7발과 기절
function tw2Missile(g, t, e, dmg, o) {
  var st = t.st, a = t.aim + (o && o.da || 0);
  var p = tw2Shot(g, t, 'missile', e, { x: t.x + Math.cos(a) * 0.2, y: t.y - 0.25 + Math.sin(a) * 0.2, z: 0.8, ang: a, sp: 2.5, acc: 16, spMax: 11, turn: 4, dmg: dmg, splash: st.splash || 0.5, bk: 'he', big: st.big || 0, retarget: 2.5, life: 6 });
  if (o) for (var k in o) if (k !== 'da') p[k] = o[k];
  return p;
}
TW_ACT.missile = function (g, t, dt) {
  var st = t.st; t.cd -= dt; t.busy = clamp(1 - t.cd * st.rate, 0, 1);
  if (t.cd > 0) return;
  var hit = t.hit, e = hit !== 'a' ? pickTarget(g, t, st, 'a') : null; if (!e) e = pickTarget(g, t, st, hit);   // 하늘 먼저
  if (!e) { t.cd = 0.1; return; }
  var n = (st.multi || 1) + (st.extra || 0), tg = e.kind === 'obs' ? [e] : tw2Targets(g, t, st, 'a', n, e.dom === 'a' ? e : null);
  if (e.kind !== 'obs' && tg.indexOf(e) < 0) tg.unshift(e);
  if (hit !== 'a' && tg.length < n && e.kind !== 'obs') tw2Targets(g, t, st, hit, n, e).forEach(function (q) { if (tg.indexOf(q) < 0 && tg.length < n) tg.push(q); });
  t.cd = 1 / st.rate; tw2Aim(t, e.x, e.y); t.fireT = 0.35; t.shots = (t.shots || 0) + 1; t.busy = 0;
  emit(g, 'launch', { tw: t, n: Math.min(n, tg.length + 1), x: t.x, y: t.y, k: t.k });
  n = Math.min(n, tg.length + 1);   // 표적이 모자라면 덤 한 발(절반 피해)까지만
  for (var i = 0; i < n; i++) {
    var q = tg[i % tg.length], half = i >= tg.length || (st.extra && i === n - 1 && n > (st.multi || 1));
    tw2Missile(g, t, q, st.dmg * critMul(g, st) * (half ? 0.5 : 1), { da: (i - (n - 1) / 2) * 0.5, hit: hit });
  }
};

// ---------- 기관포탑 (gatling): 땅과 하늘에 아주 빠른 연사, 갑옷에 약함(soft) ----------
// t.spin 총열 회전, t.busy 가열(B). A 철갑 개틀링: 갑옷 무시와 쌓이는 갑옷 깎기, 6단계 = 10발마다 고폭탄. B 쌍열 벌컨: 쏠수록 빨라짐(ramp), 6단계 = 불탄과 두 번째 표적
function tw2Bullet(g, t, e, dmg, f, o) {
  if (g.proj.length > PROJ_CAP) {   // 탄이 너무 많으면 바로 맞히고 줄기만 그림
    emit(g, 'tracer', { x0: t.x, y0: t.y, z0: 0.6, x1: e.x, y1: e.y, z1: tw2EZ(e), k: 'bullet', tw: t, lvl: t.lvl });
    tw2Hit(g, e, dmg, 'phys', tw2Src(t), f, { single: 1, fx: t.x, fy: t.y, quiet: 0 }); return null;
  }
  var p = tw2Shot(g, t, 'bullet', e, { sp: 20, dmg: dmg, f: f, z: 0.55, life: 1.2 });
  if (o) for (var k in o) p[k] = o[k];
  return p;
}
function tw2GatlingRun(g, t, dt, st, hit) {
  var e = pickTarget(g, t, st, hit);
  if (!e) { t.heat = Math.max(0, (t.heat || 0) - dt * 0.5); if (st.ramp) t.busy = t.heat; if (t.cd > 0) t.cd -= dt; return null; }
  tw2Aim(t, e.x, e.y);
  t.heat = Math.min(1, (t.heat || 0) + dt / (st.rampT || 2.5));
  var rate = st.rate * (st.ramp ? 1 + (st.ramp - 1) * t.heat : 1), f = tw2F(g, t), n = 0;
  t.spin = (t.spin || 0) + dt * rate * 0.9; t.busy = st.ramp ? t.heat : 1; t.fireT = Math.max(t.fireT, 0.12);
  t.cd -= dt;
  while (t.cd <= 0 && n < 3) {
    t.cd += 1 / rate; n++; t.shots = (t.shots || 0) + 1; t.side = 1 - (t.side || 0);
    var q = e;
    if (st.dual && t.heat >= 0.99 && t.shots % 2 && e.kind !== 'obs') { var o2 = tw2Targets(g, t, st, hit || t.hit, 2, e)[1]; if (o2) q = o2; }
    if (st.heN && t.shots % st.heN === 0) tw2Shot(g, t, 'bullet', q, { sp: 18, dmg: st.dmg * st.heX, splash: st.heR, bk: 'he', dk: 'expl', big: 1, life: 1.2 });
    else tw2Bullet(g, t, q, st.dmg * critMul(g, st), f, null);
    if (t.shots % 10 === 0 && q.kind !== 'obs' && cmbOn(g, t.k, 'stormBelt')) zapFrom(g, q, 2, st.dmg * 3, tw2Src(t));
  }
  if (t.cd < -0.2) t.cd = 0;
  t.mzT = (t.mzT || 0) - dt; if (n && t.mzT <= 0) { t.mzT = 0.09; emit(g, 'muzzle', { tw: t, n: n, x: t.x, y: t.y, k: t.k, aim: t.aim }); }
  return e;
}
TW_ACT.gatling = function (g, t, dt) { tw2GatlingRun(g, t, dt, t.st, null); };

// ---------- 저격탑 (sniper): 아주 먼 사거리, 강한 한 발, 숨은 적을 봄. 탄 없이 줄기(tracer)로 바로 맞힘 ----------
// A 대물 저격총: 우두머리, 갑옷 배수와 기절, 6단계 보스 사냥꾼 = 우두머리 최대 체력 3% 덤. B 관측 저격조: 표식(markT), 6단계 천리 표적수 = 전장 어디든, 표식이 주변 3명에게 번짐
TW_INIT.sniper = function (g, t) { t.mode = 'strong'; };
TW_ACT.sniper = function (g, t, dt) {
  var st = t.st; t.cd -= dt;
  var e = pickTarget(g, t, st);
  if (e) tw2Aim(t, e.x, e.y);
  t.busy = e ? clamp(1 - t.cd * st.rate, 0, 1) : 0;   // 조준 진행
  if (!e) { if (t.cd < 0.05) t.cd = 0.05; return; }
  if (t.cd > 0) return;
  t.cd = 1 / st.rate; tw2Fired(g, t, 1);
  var crit = (st.crit || 0) + (st.cc || 0) > 0 && g.rnd() < (st.crit || 0) + (st.cc || 0), dmg = st.dmg * (crit ? st.critX || 2 : 1), src = tw2Src(t);
  if (st.pctBoss && e.boss) dmg += Math.min(st.pctCap || 4000, e.mhp * st.pctBoss);
  emit(g, 'tracer', { x0: t.x, y0: t.y, z0: 0.9, x1: e.x, y1: e.y, z1: tw2EZ(e), k: 'sniper', tw: t, lvl: t.lvl, crit: crit ? 1 : 0 });
  if (e.kind === 'obs') { hurtObs(g, e, dmg); return; }
  var ex = e.x, ey = e.y;
  tw2Hit(g, e, dmg, 'phys', src, tw2F(g, t), { single: 1, fx: t.x, fy: t.y });
  if (crit) { emit(g, 'crit', { x: ex, y: ey, en: e, tw: t }); if (cmbOn(g, t.k, 'headshot')) tw2Splash(g, ex, ey, 0.8, dmg * 0.5, 'phys', src, null, t.hit, true); }
  if (st.markN) nearEnemies(g, ex, ey, 2.2, st.markN, null, t.hit).forEach(function (o) { o.markT = Math.max(o.markT, st.markT || 4); o.markA = Math.max(o.markA, st.mark); });
};

// ---------- 다연장 로켓 (salvo): 땅과 바다에 로켓 여러 발 일제 사격, 재장전 김 ----------
// t.busy = 재장전 진행(1이면 장전 끝). A 집속 로켓: 발수가 많고 터진 자리 둘레에 자탄(cluster), 6단계 = 기절. B 소이 로켓: 불 장판, 6단계 불바다 = 넓고 오래 타는 불
function tw2RocketOn(g, p, e, x, y) {
  var f = p.f || {}, n = f.cluster || 0, i;
  for (i = 0; i < n; i++) { var a = i / n * 6.283 + p.sx, cx = x + Math.cos(a) * 0.55, cy = y + Math.sin(a) * 0.55; tw2Splash(g, cx, cy, p.splash * 0.55, p.dmg * 0.35, p.dk, p.src, null, p.hit, true); emit(g, 'blast', { x: cx, y: cy, r: p.splash * 0.55, k: 'he', lvl: p.lvl, sub: 1 }); }
  if (p.napalm) g.zones.push({ kind: 'fire', x: x, y: y, r: 0.5, t: 3, T: 3, dps: p.dmg * 0.3, src: p.src });
}
function tw2RocketFire(g, t, i, W) {
  var e = t.salvoTgt, st = t.st;
  if (!tw2Alive(e)) { e = pickTarget(g, t, st, W.hit); t.salvoTgt = e; }
  var tx = t.salvoX, ty = t.salvoY, T = 0.45 + hyp(t.x, t.y, tx, ty) * 0.09;
  if (e) { var pp = predict(e, T); tx = t.salvoX = pp.x; ty = t.salvoY = pp.y; tw2Aim(t, tx, ty); }
  var a = g.rnd() * 6.283, r = Math.sqrt(g.rnd()) * (W.spread || 0.5) * (i ? 1 : 0.3);
  t.fireT = 0.35; t.shots = (t.shots || 0) + 1; t.side = 1 - (t.side || 0);
  tw2Lob(g, t, 'rocket', tx + Math.cos(a) * r, ty + Math.sin(a) * r * 0.8, { dmg: W.dmg * critMul(g, st), splash: W.splash, bk: W.zone ? 'fire' : 'he', T: T + i * 0.012, h: 0.9 + hyp(t.x, t.y, tx, ty) * 0.16, hit: W.hit, dk: 'expl', tgt: e && e.kind === 'obs' ? e : null,
    zone: W.zone || null, on: W.cluster || W.napalm ? tw2RocketOn : null, napalm: W.napalm ? 1 : 0, f: W.f, big: W.big || 0 });
  if (i % 2 === 0) emit(g, 'muzzle', { tw: t, n: 1, x: t.x, y: t.y, k: t.k, aim: t.aim, rocket: 1 });
}
TW_ACT.salvo = function (g, t, dt) {
  var st = t.st;
  var W = { dmg: st.dmg, splash: st.splash, spread: st.spread, hit: t.hit, cluster: st.cluster, napalm: cmbOn(g, t.k, 'napalm'), f: tw2F(g, t), zone: st.zoneDps ? { r: st.zoneR || st.splash * 0.8, t: st.zoneT, dps: st.zoneDps } : null, big: t.lvl >= 6 ? 1 : 0 };
  if (tw2Salvo(g, t, dt, 0.07, function (i) { tw2RocketFire(g, t, i, W); })) { t.busy = 0; return; }
  t.cd -= dt; t.busy = clamp(1 - t.cd * st.rate, 0, 1);
  if (t.cd > 0) return;
  var e = pickTarget(g, t, st); if (!e) { t.cd = 0.1; return; }
  t.cd = 1 / st.rate; t.salvoN = st.n; t.salvoI = 0; t.salvoT = 0; t.salvoTgt = e; t.salvoX = e.x; t.salvoY = e.y; tw2Aim(t, e.x, e.y);
  emit(g, 'launch', { tw: t, n: st.n, x: t.x, y: t.y, k: t.k });
};

// ---------- 레이저 탑 (beam2): 쏠수록 강해지는 광선 (표적이 바뀌어도 세기 유지, 쉬면 식음) ----------
// t.busy = 세기 0~1, t.beamTgt = 주 표적, t.beams = [[x0, y0, x1, y1, 굵기 0~1]...] (t.fireT > 0일 때만 유효), 사건 beamOn/beamOff { tw }
// A 프리즘: 주 표적 주변으로 갈라짐(split), 6단계 무지개 분광포 = 갈래도 온전한 피해, 화상과 감속. B 집속 광선포: 일직선 관통(line), 6단계 태양 창 = 화면 끝까지
TW_ACT.beam2 = function (g, t, dt) {
  var st = t.st, e = pickTarget(g, t, st);
  if (!e) {
    if (t.beamOn) { t.beamOn = 0; emit(g, 'beamOff', { tw: t }); }
    t.beamTgt = null; t.beams = null; t.beamT = Math.max(0, (t.beamT || 0) - dt * 1.5); t.busy = clamp(t.beamT / st.ramp, 0, 1); return;
  }
  if (!t.beamOn) { t.beamOn = 1; emit(g, 'beamOn', { tw: t, x: t.x, y: t.y, k: t.k }); }
  t.beamTgt = e; t.beamT = Math.min(st.ramp, (t.beamT || 0) + dt); t.busy = clamp(t.beamT / st.ramp, 0, 1); t.fireT = 0.1; tw2Aim(t, e.x, e.y);
  var dps = lerp(st.dps0, st.dps1, t.busy), src = tw2Src(t), beams = [], hitL = [], q = { quiet: 1 }, i, o;
  if (e.kind === 'obs') { hurtObs(g, e, dps * dt); beams.push([t.x, t.y, e.x, e.y, 1]); }
  else if (st.line) {
    var L = st.lineLen || st.range + 0.3, ax = Math.cos(t.aim), ay = Math.sin(t.aim), w = st.lineW || 0.3;
    for (i = 0; i < g.enemies.length; i++) {
      o = g.enemies[i]; if (!targetable(g, o, t.hit) || !seenBy(o, st)) continue;
      var px = o.x - t.x, py = o.y - t.y, tt = px * ax + py * ay; if (tt < 0 || tt > L) continue;
      var qx = px - ax * tt, qy = py - ay * tt, ww = w + o.size * 0.2; if (qx * qx + qy * qy > ww * ww) continue;
      hitL.push(o); tw2Hit(g, o, dps * dt, 'magic', src, null, q);
    }
    beams.push([t.x, t.y, t.x + ax * L, t.y + ay * L, 1]);
  } else {
    hitL.push(e); tw2Hit(g, e, dps * dt, 'magic', src, null, q); beams.push([t.x, t.y, e.x, e.y, 1]);
    if (st.split) { var sk = {}; sk[e.id] = 1; nearEnemies(g, e.x, e.y, 1.9, st.split, sk, t.hit).forEach(function (s) { hitL.push(s); tw2Hit(g, s, dps * dt * st.splitF, 'magic', src, null, q); beams.push([e.x, e.y, s.x, s.y, st.splitF]); }); }
  }
  t.beams = beams;
  t.elT = (t.elT || 0) - dt;   // 덤 효과(화상, 감속, 속성 카드)는 0.5초마다
  if (t.elT <= 0) { t.elT = 0.5; var f = tw2F(g, t); for (i = 0; i < hitL.length; i++) if (!hitL[i].dead) tw2Fx(g, hitL[i], f, dps * 0.5, src); }
};
TW_SOLD.beam2 = function (g, t) { if (t.beamOn) { t.beamOn = 0; emit(g, 'beamOff', { tw: t }); } };

// ---------- 테슬라 코일 (tesla): 짧은 사거리 연쇄 번개와 기절. t.busy = 충전 ----------
// 사건 chain { pts: [[x, y]...] } (점은 몸 가운데 높이로 올린 좌표, 기존 zap과 같은 꼴). A 폭풍 코일: 연쇄 수, 6단계 번개 폭풍 = 5번째 방전마다 사거리 안 전부.
// B EMP 발생기: 사거리 안 전부, 기계 배수와 긴 기절, 보호막 깸, 6단계 대정전 = 능력 봉인
function tw2Chain(g, t, st, e, dmg, n, src, f) {
  var pts = [[t.x, t.y - 0.9]], hitSet = {}, cur = e, last = null, hit = t.hit;
  for (var c = 0; c < n && cur; c++) {
    pts.push([cur.x, cur.y - (cur.kind === 'obs' ? 0.3 : cur.dom === 'a' ? (cur.z || 0.7) : cur.size * 0.5)]);
    if (cur.kind === 'obs') { hurtObs(g, cur, dmg); break; }
    hitSet[cur.id] = 1; last = cur; tw2Hit(g, cur, dmg, 'magic', src, f, null);
    dmg *= st.chainF || 0.8;
    var nx = null, nb = 2.9;
    for (var q = 0; q < g.enemies.length; q++) { var o = g.enemies[q]; if (hitSet[o.id] || !targetable(g, o, hit) || !seenBy(o, st)) continue; var dd = d2(o.x, o.y, cur.x, cur.y); if (dd < nb) { nb = dd; nx = o; } }
    cur = nx;
  }
  emit(g, 'chain', { pts: pts, tw: t, lvl: t.lvl, k: t.k, el: st.cardEl || 'bolt' });
  return last;
}
TW_ACT.tesla = function (g, t, dt) {
  var st = t.st, src, i, o; t.cd -= dt; t.busy = clamp(1 - t.cd * st.rate, 0, 1);
  if (t.cd > 0) return;
  if (st.emp) {
    if (!tw2AnyIn(g, t, st.range, t.hit)) { t.cd = 0.1; return; }
    t.cd = 1 / st.rate; tw2Fired(g, t, 0); src = tw2Src(t);
    for (i = 0; i < g.enemies.length; i++) {
      o = g.enemies[i]; if (!targetable(g, o, t.hit) || !inR(t, o.x, o.y, st.range + o.size * 0.2)) continue;
      var mech = tw2IsMech(o);
      if (o.shield > 0) { o.shield = 0; emit(g, 'shieldBreak', { x: o.x, y: o.y }); }
      tw2Hit(g, o, st.dmg, 'magic', src, { mechX: st.mechX, stun: st.stun * (mech ? st.mechStun || 1.5 : 1), seal: st.seal, cardEl: st.cardEl, rate: st.rate }, null);
    }
    emit(g, 'blast', { x: t.x, y: t.y, r: st.range, k: 'emp', tw: t, lvl: t.lvl });
    return;
  }
  var e = pickTarget(g, t, st); if (!e) { t.cd = 0.08; return; }
  t.cd = 1 / st.rate; tw2Aim(t, e.x, e.y); tw2Fired(g, t, 0); src = tw2Src(t);
  var dmg = st.dmg * critMul(g, st);
  if (st.stormN && t.shots % st.stormN === 0) {   // 번개 폭풍: 사거리 안 전부
    for (i = 0; i < g.enemies.length; i++) { o = g.enemies[i]; if (!targetable(g, o, t.hit) || !inR(t, o.x, o.y, st.range + o.size * 0.2)) continue; emit(g, 'chain', { pts: [[t.x, t.y - 0.9], [o.x, o.y - (o.dom === 'a' ? (o.z || 0.7) : o.size * 0.5)]], tw: t, lvl: t.lvl, k: t.k, el: 'bolt' }); tw2Hit(g, o, dmg * st.stormX, 'magic', src, { stun: st.stormStun, cardEl: st.cardEl, rate: st.rate }, null); }
    emit(g, 'blast', { x: t.x, y: t.y, r: st.range, k: 'emp', tw: t, lvl: t.lvl, storm: 1 });
    return;
  }
  var last = tw2Chain(g, t, st, e, dmg, st.chain || 3, src, tw2F(g, t));
  if (last && cmbOn(g, t.k, 'overload')) { tw2Splash(g, last.x, last.y, 0.7, dmg * 0.8, 'magic', src, null, t.hit, true); emit(g, 'blast', { x: last.x, y: last.y, r: 0.7, k: 'emp', lvl: t.lvl, sub: 1 }); }
};

// ---------- 유닛 공통 ----------
// 탑의 유닛 목록(t.units)을 n개로 맞춤. 저장 복원이나 강화 뒤에도 매 걸음 맞춰지므로 따로 준비할 것이 없다. 전체 유닛은 TW2_UNIT_CAP개까지
function tw2Units(g, t, kind, n, mk) {
  var L = t.units || (t.units = []), i;
  for (i = L.length - 1; i >= 0; i--) if (L[i].gone) L.splice(i, 1);
  while (L.length > n) { var u = L.pop(); u.dead = 1; u.gone = 1; }
  while (L.length < n && g.units.length < TW2_UNIT_CAP) { var nu = mk(L.length); nu.kind = kind; nu.tw = t; nu.gone = 0; L.push(nu); g.units.push(nu); }
  return L;
}
function tw2UnitsOff(g, t) { t.sold = 1; if (t.units) t.units.forEach(function (u) { u.dead = 1; u.gone = 1; }); if (t.slots) t.slots.forEach(function (u) { if (u && u.kind) { if (u.held) tw2Release(u); u.dead = 1; u.gone = 1; } }); t.units = null; t.slots = null; t.out = 0; }
// 방향을 조금씩 틀며 날기 (bank = 기울기 -1~1)
function tw2Steer(u, gx, gy, sp, turn, dt) {
  var mx = turn * dt, da = clamp(angDiff(u.ang, Math.atan2(gy - u.y, gx - u.x)), -mx, mx);
  u.ang += da; u.bank = (u.bank || 0) * 0.85 + (da / mx) * 0.15;
  u.x += Math.cos(u.ang) * sp * dt; u.y += Math.sin(u.ang) * sp * dt;
}

// ---------- 비행장 (airbase): 전투기(g.units kind 'plane')가 떠서 표적을 스치며 기총 소사 ----------
// t.out = 떠 있는 전투기가 있으면 1, 사건 planeOut { tw }. st.range = 작전 반경(비행장에서 이 거리 안의 적만 쫓음)
// 유닛 칸: x, y, ang, z(0 = 지상, 1 = 비행), hp, tw, st('park' 대기 | 'out' 출격 | 'back' 귀환), i(편대 번호), bank, fireT(쏜 직후), lvl
// A 폭격 편대: 땅과 바다 적 위에서 폭탄(bomb), 6단계 융단 폭격단 = 3발씩과 불. B 요격 편대: 하늘 적을 먼저 쫓고 미사일, 6단계 에이스 편대 = 전장 어디든, 2발씩
function tw2MkPlane(t) { return function (i) { return { x: t.x, y: t.y, ang: -Math.PI / 2 + i * 0.5, z: 0, hp: 1, st: 'park', i: i, bank: 0, wait: 0.25 * i, gunT: 0, bombT: 0.6, aamT: 0.8, fireT: 0, lvl: t.lvl, k: t.k }; }; }
function tw2AirRun(g, t, dt, st, airFirst) {
  var L = tw2Units(g, t, 'plane', Math.min(TW2_PLANE_MAX, st.planes || 1), tw2MkPlane(t));
  t.cd -= dt;
  if (t.cd <= 0 || !tw2Alive(t.tgt)) { t.cd = 0.25; var e = airFirst ? pickTarget(g, t, st, 'a') : null; t.tgt = e || pickTarget(g, t, st); if (t.tgt && t.tgt.kind === 'obs') t.tgt = null; }
  var has = tw2Alive(t.tgt);
  t.idleT = has ? 0 : (t.idleT || 0) + dt;
  var want = has ? 1 : t.idleT > 2.5 ? 0 : (t.wantOut || 0);
  if (want && !t.wantOut) emit(g, 'planeOut', { tw: t, n: L.length, x: t.x, y: t.y, k: t.k });
  t.wantOut = want;
  var out = 0; for (var i = 0; i < L.length; i++) if (L[i].st !== 'park') out = 1;
  t.out = out; if (has && t.tgt.kind !== 'obs') tw2Aim(t, t.tgt.x, t.tgt.y);
  return L;
}
TW_ACT.airbase = function (g, t, dt) { tw2AirRun(g, t, dt, t.st, !!t.st.aamDmg); };
TW_SOLD.airbase = tw2UnitsOff;
function tw2BombOn(g, p, e, x, y) { if (p.fz) g.zones.push({ kind: 'fire', x: x, y: y, r: p.fz.r, t: p.fz.t, T: p.fz.t, dps: p.fz.dps, src: p.src }); }
UNIT_UPD.plane = function (g, u, dt) {
  if (!u.tw) return false;   // 주인 탑이 없는 유닛(다른 갈래의 시험용)은 건드리지 않음
  var t = u.tw; if (!t || t.sold || u.gone || !t.st) { u.gone = 1; return true; }
  var st = t.st, sp = 3.4, gx, gy;
  u.lvl = t.lvl; if (u.fireT > 0) u.fireT -= dt;
  if (u.st === 'park') { u.x = t.x; u.y = t.y; u.z = 0; u.bank = 0; if (t.wantOut) { u.wait -= dt; if (u.wait <= 0) { u.st = 'out'; u.ang = (t.aim || 0) + (u.i - 1) * 0.4; } } else u.wait = 0.25 * u.i; return false; }
  var e = tw2Alive(t.tgt) && t.tgt.kind !== 'obs' ? t.tgt : null;
  if (!t.wantOut) u.st = 'back'; else if (u.st === 'back') u.st = 'out';
  if (u.st === 'back') {
    gx = t.x; gy = t.y; var dh = d2(u.x, u.y, gx, gy);
    if (dh < 0.09) { u.st = 'park'; u.z = 0; u.wait = 0.25 * u.i; u.x = t.x; u.y = t.y; return false; }
    u.z = dh < 1.5 ? Math.max(0.15, u.z - dt * 1.2) : Math.min(1, u.z + dt * 1.6);
    tw2Steer(u, gx, gy, sp * (dh < 1 ? 0.7 : 1), 5 + (dh < 2 ? 4 : 0), dt); return false;
  }
  u.z = Math.min(1, u.z + dt * 1.6);
  if (e) { gx = e.x; gy = e.y; } else { var a = g.t * 1.3 + u.i * 2.1; gx = t.x + Math.cos(a) * 1.3; gy = t.y + Math.sin(a) * 1.3; }
  if (e && d2(u.x, u.y, gx, gy) < 0.5) { u.x += Math.cos(u.ang) * sp * dt; u.y += Math.sin(u.ang) * sp * dt; u.bank *= 0.9; }   // 표적 바로 위에서는 곧게 지나감
  else tw2Steer(u, gx + Math.cos(u.i * 2.4) * 0.25, gy + Math.sin(u.i * 2.4) * 0.25, sp, 4, dt);
  // 기총: 앞쪽 부채꼴 안의 가장 가까운 적
  u.gunT -= dt;
  if (u.gunT <= 0) {
    var best = null, bd = 1.9 * 1.9, i, o;
    for (i = 0; i < g.enemies.length; i++) {
      o = g.enemies[i]; if (!targetable(g, o, t.hit) || (o.stealth && !o.revealed)) continue;
      var dd = d2(o.x, o.y, u.x, u.y); if (dd > bd) continue;
      if (dd > 0.09 && Math.abs(angDiff(u.ang, Math.atan2(o.y - u.y, o.x - u.x))) > 0.8) continue;
      bd = dd; best = o;
    }
    if (best) {
      u.gunT = 1 / st.rate; u.fireT = 0.12;
      emit(g, 'tracer', { x0: u.x, y0: u.y, z0: u.z, x1: best.x, y1: best.y, z1: tw2EZ(best), k: 'plane', tw: t, u: u, lvl: t.lvl });
      tw2Hit(g, best, st.dmg * critMul(g, st), 'phys', tw2Src(t), { airX: st.airX, cardEl: st.cardEl, rate: st.rate * 2 }, { single: 1, fx: u.x, fy: u.y });
    } else u.gunT = 0.05;
  }
  // 폭탄: 발밑에 땅이나 바다 적이 있으면
  if (st.bombDmg) {
    u.bombT -= dt;
    if (u.bombT <= 0) {
      var bx = u.x + Math.cos(u.ang) * 0.45, by = u.y + Math.sin(u.ang) * 0.45, under = nearEnemies(g, bx, by, 0.75, 1, null, 'gs')[0];
      if (under) {
        u.bombT = st.bombCd; var nb = st.bombN || 1;
        for (var b = 0; b < nb; b++) { var off = (b - (nb - 1) / 2) * 0.55; tw2Lob(g, t, 'bomb', bx + Math.cos(u.ang) * off, by + Math.sin(u.ang) * off, { sx: u.x, sy: u.y, h0: u.z, h: 0, T: 0.45 + b * 0.06, dmg: st.bombDmg, splash: st.bombR, hit: 'gs', dk: 'expl', bk: 'auto', f: { cardEl: st.cardEl, rate: 1 }, on: st.zoneDps ? tw2BombOn : null, fz: st.zoneDps ? { r: st.bombR * 0.7, t: st.zoneT, dps: st.zoneDps } : null, big: Math.min(1, st.bombR - 0.4) }); }
      } else u.bombT = 0.08;
    }
  }
  // 공대공 미사일
  if (st.aamDmg) {
    u.aamT -= dt;
    if (u.aamT <= 0) {
      var at = nearEnemies(g, u.x, u.y, 4, st.aamN || 1, null, 'a');
      if (at.length) { u.aamT = st.aamCd; at.forEach(function (q) { tw2Shot(g, t, 'missile', q, { x: u.x, y: u.y, z: u.z, ang: u.ang, sp: 5, acc: 14, spMax: 12, turn: 5, dmg: st.aamDmg, splash: 0.5, bk: 'he', hit: 'a', retarget: 2.5, life: 5, f: { cardEl: st.cardEl, rate: 1 }, big: 0.2 }); }); emit(g, 'launch', { tw: t, u: u, n: at.length, x: u.x, y: u.y, z: u.z, k: t.k }); }
      else u.aamT = 0.2;
    }
  }
  return false;
};

// ---------- 전함 (navgun, 물 칸 전용): 먼 사거리 함포 ----------
// A 미사일 순양함: 대공 미사일(aa), 6단계 신의 방패함 = 3발과 적 포탄, 폭탄 요격. B 드레드노트: 여러 문 일제 사격, 6단계 거함거포 = 4문, 기절과 밀어내기
function tw2NavFire(g, t, st, e, n, dmg, splash, f) {
  var dist = hyp(t.x, t.y, e.x, e.y), T = 0.35 + dist * 0.07, pp = predict(e, T);
  for (var i = 0; i < n; i++) {
    var a = i ? g.rnd() * 6.283 : 0, r = i ? 0.35 + g.rnd() * 0.3 : 0;
    tw2Lob(g, t, 'navshell', pp.x + Math.cos(a) * r, pp.y + Math.sin(a) * r, { dmg: dmg * critMul(g, st), splash: splash, hit: 'gs', dk: 'expl', bk: 'auto', T: T + i * 0.08, h: 0.6 + dist * 0.12, big: st.big || 0, tgt: e.kind === 'obs' ? e : null, f: f });
  }
}
function tw2AA(g, t, dt, st, range) {   // 대공 미사일 (하늘 적 aaN명)
  t.aaT = (t.aaT == null ? 0.5 : t.aaT) - dt; if (t.aaT > 0) return;
  var tg = tw2Targets(g, t, st, 'a', st.aaN || 1, null, range || st.range);
  if (!tg.length) { t.aaT = 0.15; return; }
  t.aaT = st.aaCd; emit(g, 'launch', { tw: t, n: tg.length, x: t.x, y: t.y, k: t.k, aa: 1 });
  tg.forEach(function (q, i) { tw2Shot(g, t, 'missile', q, { x: t.x, y: t.y - 0.3, z: 0.8, ang: -Math.PI / 2 + (i - (tg.length - 1) / 2) * 0.6, sp: 2.5, acc: 16, spMax: 12, turn: 4, dmg: st.aaDmg, splash: 0.6, bk: 'he', hit: 'a', dk: 'expl', retarget: 3, life: 7, f: { cardEl: st.cardEl, rate: 1 }, big: 0.5 }); });
}
TW_ACT.navgun = function (g, t, dt) {
  var st = t.st; t.cd -= dt;
  if (st.aaDmg) tw2AA(g, t, dt, st, 0);
  if (st.icpt) { t.icT = (t.icT || 0) - dt; if (t.icT <= 0) t.icT = tw2Intercept(g, t, st.range) ? st.icpt : 0.1; }
  if (t.cd > 0) return;
  var e = pickTarget(g, t, st, 'gs'); if (!e) { t.cd = 0.1; return; }
  t.cd = 1 / st.rate; tw2Aim(t, e.x, e.y); tw2Fired(g, t, st.n || 1);
  tw2NavFire(g, t, st, e, st.n || 1, st.dmg, st.splash, tw2F(g, t));
};

// ---------- 거북선 (broadside, 물 칸 전용): 가까운 거리 양현 포(ball)와 용머리 화염 ----------
// t.aim = 용머리 방향, t.busy = 화염 세기 0~1 (화염은 길이 st.flameR, 반각 st.cone / 2도의 부채꼴). 한 표적에는 포의 절반까지만 쏠 수 있다(양현)
// A 화룡 거북선: 길고 뜨거운 화염, 6단계 = 하늘도 태우고 불 장판. B 판옥 대장선: 포 수, 주변 수상 탑 강화(tw2Buff), 6단계 = 포 7문, 공격 속도도
function tw2Flame(g, t, dt, st, src) {
  var e = pickTarget(g, t, { range: st.flameR, detect: st.detect }, st.flameHit || 'gs');
  if (!e) { t.busy = Math.max(0, (t.busy || 0) - dt * 3); return null; }
  tw2Aim(t, e.x, e.y); t.busy = Math.min(1, (t.busy || 0) + dt * 4); t.fireT = Math.max(t.fireT, 0.1);
  var half = (st.cone || 50) * Math.PI / 360, hs = st.flameHit || 'gs', dmg = st.flameDps * dt;
  if (e.kind === 'obs') hurtObs(g, e, dmg);
  for (var i = 0; i < g.enemies.length; i++) {
    var o = g.enemies[i]; if (o.dead || o.untarget || hs.indexOf(o.dom) < 0 || !inR(t, o.x, o.y, st.flameR + o.size * 0.25)) continue;
    if (Math.abs(angDiff(t.aim, Math.atan2(o.y - t.y, o.x - t.x))) > half && d2(t.x, t.y, o.x, o.y) > 0.16) continue;
    hurt(g, o, dmg * tw2Mul(o, st), 'magic', src, true, { el: 'fire', quiet: 1 });
    if (!o.dead) burnE(o, st.burn, st.burnT || 2);
  }
  if (st.flameZone) { t.fzT = (t.fzT || 0) - dt; if (t.fzT <= 0 && e.kind !== 'obs' && e.dom !== 'a') { t.fzT = 1.2; g.zones.push({ kind: 'fire', x: e.x, y: e.y, r: 0.7, t: 3, T: 3, dps: st.burn * 0.8, src: src }); } }
  return e;
}
function tw2Balls(g, t, st, n, dmg, src) {
  var tg = tw2Targets(g, t, st, 'gs', n, null), F = g.focus && g.focus.o && g.focus.o.alive && inR(t, g.focus.o.x, g.focus.o.y, st.range) ? g.focus.o : null;
  if (F) tg.unshift(F);
  if (!tg.length) return 0;
  var per = Math.ceil(n / 2), shots = Math.min(n, tg.length * per), fb = t.fBall;
  if (!fb || t.fBallSt !== st) { fb = t.fBall = { seaX: st.seaX, cardEl: st.cardEl, rate: st.rate, burn: cmbOn(g, t.k, 'fireShot') ? st.burn : 0, burnT: st.burnT }; t.fBallSt = st; }
  for (var i = 0; i < shots; i++) {
    var q = tg[i % tg.length], dist = hyp(t.x, t.y, q.x, q.y), T = 0.22 + dist * 0.07, pp = predict(q, T), side = i % 2 ? 1 : -1;
    tw2Lob(g, t, 'ball', pp.x, pp.y, { sx: t.x + side * 0.2, sy: t.y, dmg: dmg * critMul(g, st), splash: st.splash || 0.35, hit: 'gs', dk: 'expl', bk: 'auto', T: T + (i >> 1) * 0.05, h: 0.2 + dist * 0.06, h0: 0.35, f: fb, src: src, tgt: q.kind === 'obs' ? q : null, big: Math.min(1, dmg / 300) });
  }
  return shots;
}
TW_ACT.broadside = function (g, t, dt) {
  var st = t.st, src = tw2Src(t); t.cd -= dt;
  var fe = tw2Flame(g, t, dt, st, src);
  if (t.cd > 0) return;
  var n = tw2Balls(g, t, st, st.n || 2, st.dmg, src);
  if (!n) { t.cd = 0.1; return; }
  t.cd = 1 / st.rate; tw2Fired(g, t, n);
  if (!fe) { var q = tw2Targets(g, t, st, 'gs', 1, null)[0]; if (q) tw2Aim(t, q.x, q.y); }
};

// ---------- 신기전 화차 (hwacha): 로켓 화살(sinarrow) 다발, 땅과 하늘 ----------
// A 대신기전: 큰 로켓 한 발(big 1)이 터지며 불똥(sparks)이 주변 적에게 날아감, 6단계 산화 신기전 = 불 장판. B 백발 화차: 화살 수, 6단계 천발 화차 = 4번째 일제 사격마다 두 배
function tw2SparkOn(g, p, e, x, y) {
  var n = p.sparks || 0; if (!n || g.proj.length > PROJ_CAP + 40) return;
  var sk = {}; if (e && e.id) sk[e.id] = 1;
  var near = nearEnemies(g, x, y, 2.2, n, sk, p.hit);
  for (var i = 0; i < n; i++) {
    var q = near.length ? near[i % near.length] : null; if (!q) break;
    g.proj.push({ kind: 'sinarrow', x: x, y: y, z: 0.4, ang: i / n * 6.283, tgt: q, tx: q.x, ty: q.y, sp: 7, dmg: p.dmg * 0.15, dk: p.dk, src: p.src, f: null, hit: p.hit, splash: 0, bk: null, lvl: p.lvl, el: p.el, big: 0, t: 0, k: p.k, spark: 1, sx0: x, sy0: y });
  }
}
function tw2ArrowOn(g, p, e, x, y) { if (e && e.dom !== 'a') g.zones.push({ kind: 'fire', x: x, y: y, r: 0.35, t: 2, T: 2, dps: p.dmg * 0.4, src: p.src }); }
function tw2ArrowFire(g, t, i, W) {
  var tg = t.salvoTg, st = t.st, q = null, guard = 0;
  while (tg.length && guard++ < 8) { q = tg[(i + guard - 1) % tg.length]; if (tw2Alive(q)) break; q = null; }
  if (!q) { q = pickTarget(g, t, st, W.hit); if (!q) return; t.salvoTg = tg = [q]; }
  t.fireT = 0.35; t.shots = (t.shots || 0) + 1; t.side = 1 - (t.side || 0);
  var a = Math.atan2(q.y - t.y, q.x - t.x) + (g.rnd() - 0.5) * 0.5; if (i === 0) t.aim = a;
  tw2Shot(g, t, 'sinarrow', q, { x: t.x + Math.cos(a) * 0.25, y: t.y - 0.2 + Math.sin(a) * 0.25, z: 0.6, ang: a, sp: 9 + g.rnd() * 2, dmg: W.dmg * critMul(g, st), hit: W.hit, f: W.f, life: 3, on: W.fireRain && i % 3 === 0 ? tw2ArrowOn : null, wob: g.rnd() * 6.283 });
  if (i % 3 === 0) emit(g, 'muzzle', { tw: t, n: 1, x: t.x, y: t.y, k: t.k, aim: a, arrow: 1 });
}
TW_ACT.hwacha = function (g, t, dt) {
  var st = t.st, f = tw2F(g, t);
  var W = { dmg: st.dmg, hit: t.hit, f: f, fireRain: cmbOn(g, t.k, 'fireRain') };
  if (tw2Salvo(g, t, dt, 0.035, function (i) { tw2ArrowFire(g, t, i, W); })) return;
  t.cd -= dt; t.busy = clamp(1 - t.cd * st.rate, 0, 1);
  if (t.cd > 0) return;
  var e = pickTarget(g, t, st); if (!e) { t.cd = 0.1; return; }
  t.cd = 1 / st.rate; tw2Aim(t, e.x, e.y); t.volleys = (t.volleys || 0) + 1;
  var n = st.n * (st.megaN && t.volleys % st.megaN === 0 ? 2 : 1);
  t.salvoTg = e.kind === 'obs' ? [e] : tw2Targets(g, t, st, t.hit, Math.min(6, Math.ceil(n / 2)), e); t.salvoN = n; t.salvoI = 0; t.salvoT = 0;
  emit(g, 'launch', { tw: t, n: n, x: t.x, y: t.y, k: t.k, mega: n > st.n ? 1 : 0 });
  if (st.bigDmg) tw2Shot(g, t, 'sinarrow', e, { z: 0.7, sp: 8, dmg: st.bigDmg * critMul(g, st), splash: st.bigR, bk: 'fire', big: 1, f: f, life: 4, sparks: st.sparks || 0, on: tw2SparkOn, zone: st.zoneDps ? { r: st.bigR * 0.7, t: st.zoneT, dps: st.zoneDps } : null });
};

// ---------- 장승 (totem): 주변 적을 겁줘 느리게(e.fearT), 숨은 적을 드러냄. 조명 탑(TOWERS.jangseung.light) ----------
// t.busy = 눈빛(적이 범위 안에 있으면 1로). 드러내기: 범위 안 숨은 적의 e.stealth를 잠깐 벗김(e.tw2Hid로 표시, 범위를 벗어나면 되돌림)
// A 천하대장군: 주기적으로 기절 파동(blast holy), 6단계 벽사 대장군 = 봉인과 밀어내기. B 지하여장군: 범위 안 적이 받는 피해 증가(markT/markA), 6단계 저승길 여장군 = 체력 10% 아래 처형
function tw2Unhide(g) { for (var i = 0; i < g.enemies.length; i++) { var e = g.enemies[i]; if (e.tw2Hid && !(e.tw2RevT > g.t)) { e.tw2Hid = 0; e.stealth = true; } } }
TW_ACT.totem = function (g, t, dt) {
  var st = t.st, src = tw2Src(t), any = 0, hs = t.hit, i, e; t.cd -= dt;
  var pulse = st.pulseCd && t.cd <= 0, L = pulse ? [] : null, ownRev = typeof en2Lit !== 'function', ownFear = typeof en2Common !== 'function';
  for (i = 0; i < g.enemies.length; i++) {
    e = g.enemies[i]; if (e.dead) continue;
    if (e.tw2Hid && !(e.tw2RevT > g.t)) { e.tw2Hid = 0; e.stealth = true; }
    if (!inR(t, e.x, e.y, st.range + e.size * 0.2)) continue;
    if (ownRev) { if (e.stealth) { e.stealth = false; e.tw2Hid = 1; } if (e.tw2Hid) { e.tw2RevT = g.t + 0.3; e.revealed = 1; } }   // 드러내기는 모든 영역 (ENG1이 있으면 조명 탑 규칙 en2Lights가 맡음)
    if (e.untarget || hs.indexOf(e.dom) < 0) continue;
    any = 1;
    var ff = e.boss ? st.fear * 0.5 : st.fear;
    e.fearF = e.fearT > 0 ? Math.max(e.fearF || 0, ff) : ff; e.fearT = Math.max(e.fearT || 0, 0.5);   // 공포: ENG1의 en2Common이 fearT를 줄이고 fearF만큼 느리게 함
    if (ownFear) slowE(e, st.fear, 0.4);                                                                // (ENG1이 없을 때만 직접 감속)
    if (st.markAura) { e.markT = Math.max(e.markT, 0.5); e.markA = Math.max(e.markA, st.markAura); }
    if (st.auraDps) hurt(g, e, st.auraDps * dt, 'magic', src, true);
    if (e.dead) continue;
    if (st.exec && !e.boss && e.hp < e.mhp * st.exec) { emit(g, 'blast', { x: e.x, y: e.y, r: 0.4, k: 'dark', exec: 1, tw: t }); hurt(g, e, e.hp + e.shield + 1, 'true', src); continue; }
    if (L) L.push(e);
  }
  t.busy = any ? Math.min(1, (t.busy || 0) + dt * 4) : Math.max(0, (t.busy || 0) - dt * 2);
  if (pulse) {
    if (!L.length) { t.cd = 0.15; return; }
    t.cd = st.pulseCd; tw2Fired(g, t, 0);
    for (i = 0; i < L.length; i++) { e = L[i]; if (e.dead) continue; tw2Hit(g, e, st.pulseDmg, 'magic', src, { stun: st.pulseStun, seal: st.seal, knock: st.pulseKnock && tw2IsSpirit(e) ? st.pulseKnock : 0 }, null); }
    emit(g, 'blast', { x: t.x, y: t.y, r: st.range, k: 'holy', tw: t, lvl: t.lvl });
  }
};
TW_SOLD.totem = function (g, t) { for (var i = 0; i < g.enemies.length; i++) { var e = g.enemies[i]; if (e.tw2Hid) e.tw2RevT = 0; } tw2Unhide(g); };

// ---------- 수호 병영 (barracks): 길 위에 병사(g.units kind 'soldier')를 세워 땅 적을 막고 싸움 ----------
// 병사는 탑에서 가장 가까운 길 지점(t.post) 둘레에 서서, 닿는 땅 적을 block명까지 붙잡는다(붙잡힌 적은 e.blocked = 병사, e.tw2By).
// 우두머리와 큰 적(size 1.25 이상), 뛰어넘는 적(TW2_LEAP, E.leap)은 못 붙잡고 지나가는 동안 때리기만. 한 적은 모두 합쳐 TW2_HOLD_MAX초까지만 붙잡힘
// 병사가 쓰러지면 사건 unitDown, respawn초 뒤 탑에서 다시 걸어 나옴. 유닛 칸: x, y, ang, z 0, hp, mhp, tw, st('walk' | 'guard' | 'fight'), i, face, atkT(휘두른 직후)
// A 철벽 방패대: 체력, 방어, 한 명이 2~3명을 막음, 6단계 불멸 = 3초 만에 복귀와 가시 피해. B 화랑 무사단: 빠르고 강한 칼, 6단계 화랑 검성 = 4명, 세 번째 칼마다 주변 베기
function tw2Rally(g, t) {
  var best = null, bd = (t.st.range + 0.3) * (t.st.range + 0.3);
  g.paths.forEach(function (p, pi) { for (var s = 0; s < p.n; s += 2) { var x = p.xs[s], y = p.ys[s]; if (x < 0.3 || y < 0.3 || x > g.cols - 0.3 || y > g.rows - 0.3) continue; var dd = d2(x, y, t.x, t.y); if (dd < bd) { bd = dd; best = { pi: pi, d: s * PSTEP, x: x, y: y }; } } });
  t.post = best; t.postR = t.st.range;
}
// 병사 체력: ENG1의 en2Block은 방어를 모르고 깎으므로 방어(sArmor)를 체력에 녹여 둔다(유효 체력)
function tw2SoldierHp(st) { return typeof en2Block === 'function' ? st.sHp / (1 - (st.sArmor || 0)) : st.sHp; }
function tw2Soldier(g, t, i) {
  var st = t.st, n = st.soldiers || 3, P = g.paths[t.post.pi], d = clamp(t.post.d + (i - (n - 1) / 2) * 0.42, 0.3, P.len - 0.6), q = pathAt(P, d, { x: 0, y: 0, dx: 0, dy: 0 }), off = i % 2 ? 0.14 : -0.14;
  var hp = tw2SoldierHp(st);
  var u = { kind: 'soldier', x: t.x, y: t.y, ang: 0, z: 0, hp: hp, mhp: hp, tw: t, st: 'walk', i: i, px: q.x - q.dy * off, py: q.y + q.dx * off, face: 1, atkT: 0, cd: 0.3, held: [], tgt: null, hits: 0, gone: 0, lvl: t.lvl, br: t.br, k: t.k };
  g.units.push(u); return u;
}
TW_ACT.barracks = function (g, t, dt) {
  var st = t.st, n = st.soldiers || 3, alive = 0, i;
  if (!t.post || t.postR !== st.range) tw2Rally(g, t);
  var S = t.slots || (t.slots = []);
  for (i = n; i < S.length; i++) if (S[i] && S[i].kind) { tw2Release(S[i]); S[i].dead = 1; S[i].gone = 1; }
  if (S.length > n) S.length = n;
  for (i = 0; i < n; i++) {
    var u = S[i];
    if (u && u.kind) { if (u.gone) S[i] = st.respawn; else { alive++; continue; } }
    if (typeof S[i] !== 'number') S[i] = 0.2 + i * 0.25;
    S[i] -= dt;
    if (S[i] <= 0 && t.post && g.units.length < TW2_UNIT_CAP) { S[i] = tw2Soldier(g, t, i); alive++; }
  }
  t.out = alive ? 1 : 0; t.busy = alive / n;
};
TW_SOLD.barracks = tw2UnitsOff;
function tw2Release(u) { for (var i = 0; i < u.held.length; i++) { var e = u.held[i]; if (e.tw2By === u) e.tw2By = null; } u.held.length = 0; u.tgt = null; }
function tw2CanHold(e) { return !e.boss && e.size < 1.25 && !TW2_LEAP[e.k] && !(e.E && e.E.leap) && !e.leap && !e.tw2Free; }
UNIT_UPD.soldier = function (g, u, dt) {
  if (!u.tw || !u.held) return false;   // 주인 탑이 없는 유닛(다른 갈래의 시험용)은 건드리지 않음
  var t = u.tw; if (!t || t.sold || u.gone || !t.st) { tw2Release(u); u.gone = 1; return true; }
  var st = t.st, i, e;
  u.lvl = t.lvl; u.br = t.br; if (u.atkT > 0) u.atkT -= dt;
  var mh = tw2SoldierHp(st), ext = typeof en2Block === 'function';
  if (mh !== u.mhp) { u.hp += Math.max(0, mh - u.mhp); u.mhp = mh; }
  if (u.st === 'walk') { u.block = 0;
    var dx = u.px - u.x, dy = u.py - u.y, L = Math.hypot(dx, dy), s = 1.8 * dt;
    if (L <= s) { u.x = u.px; u.y = u.py; u.st = 'guard'; } else { u.x += dx / L * s; u.y += dy / L * s; u.ang = Math.atan2(dy, dx); if (Math.abs(dx) > 0.02) u.face = dx > 0 ? 1 : -1; }
    return false;
  }
  var cap = st.block || 1, pass = null, hurtIn = 0;
  if (ext) {
    // ENG1(en2Block)이 붙잡기와 병사 체력 깎기를 맡는다: 여기서는 붙잡힌 적(e.blocked === u)과 닿는 적을 찾아 싸우기만
    u.block = cap; u.held.length = 0;
    for (i = 0; i < g.enemies.length; i++) {
      e = g.enemies[i]; if (e.dead || e.untarget || e.dom !== 'g') continue;
      if (e.blocked === u) { u.held.push(e); if (st.thorn) hurt(g, e, st.thorn * dt, 'phys', null, true); }
      else if (!pass && !(e.stealth && !e.revealed) && d2(e.x, e.y, u.x, u.y) < 0.36) pass = e;
    }
  } else {
  // 붙잡은 적 정리
  for (i = u.held.length - 1; i >= 0; i--) { e = u.held[i]; if (e.dead || e.untarget || e.dom !== 'g' || e.tw2By !== u || e.tw2Free) { if (e.tw2By === u) e.tw2By = null; u.held.splice(i, 1); } }
  // 새로 닿은 적 붙잡기 / 못 붙잡는 적은 지나가는 동안 표적으로만
  for (i = 0; i < g.enemies.length; i++) {
    e = g.enemies[i]; if (e.dead || e.untarget || e.dom !== 'g' || (e.stealth && !e.revealed)) continue;
    var rr = 0.5 + e.size * 0.15; if (d2(e.x, e.y, u.x, u.y) > rr * rr) continue;
    if (tw2CanHold(e)) { if (!e.tw2By && u.held.length < cap) { e.tw2By = u; e.tw2HoldD = e.d; u.held.push(e); } }
    else { pass = pass || e; hurtIn += e.boss ? 120 : 20 + e.mhp * 0.02; }
  }
  for (i = 0; i < u.held.length; i++) {
    e = u.held[i];
    if (e.d > e.tw2HoldD) { e.d = e.tw2HoldD; placeEnemy(e); }
    e.blocked = u; e.tw2Held = (e.tw2Held || 0) + dt; if (e.tw2Held > TW2_HOLD_MAX) e.tw2Free = 1;
    hurtIn += 6 + e.mhp * 0.025;
    if (st.thorn) hurt(g, e, st.thorn * dt, 'phys', null, true);
  }
  }
  if (!tw2Alive(u.tgt) || (u.held.indexOf(u.tgt) < 0 && u.tgt !== pass)) u.tgt = u.held[0] || pass || null;
  u.st = u.tgt ? 'fight' : 'guard';
  if (u.tgt) {
    e = u.tgt; u.ang = Math.atan2(e.y - u.y, e.x - u.x); if (Math.abs(e.x - u.x) > 0.02) u.face = e.x > u.x ? 1 : -1;
    u.cd -= dt;
    if (u.cd <= 0) {
      u.cd = 1 / (st.rate || 1); u.atkT = 0.25; u.hits++;
      var src = tw2Src(t), crit = st.crit && g.rnd() < st.crit, dmg = st.dmg * (crit ? st.critX || 2 : critMul(g, st));
      if (st.cleaveN && u.hits % st.cleaveN === 0) { tw2Splash(g, u.x, u.y, st.cleaveR || 0.9, dmg, 'phys', src, null, 'g'); emit(g, 'blast', { x: u.x, y: u.y, r: st.cleaveR || 0.9, k: 'holy', sub: 1, tw: t, sword: 1 }); }
      else { emit(g, 'impact', { x: e.x, y: e.y, z: e.size * 0.3, k: 'sword', en: e, tw: t, u: u, crit: crit ? 1 : 0 }); tw2Hit(g, e, dmg, 'phys', src, null, { single: 1, fx: u.x, fy: u.y }); }
    }
  } else if (u.hp < u.mhp) u.hp = Math.min(u.mhp, u.hp + u.mhp * 0.08 * dt);
  if (hurtIn > 0) u.hp -= hurtIn * (1 - (st.sArmor || 0)) * dt;
  {
    if (u.hp <= 0) {
      if (cmbOn(g, t.k, 'unyield')) for (i = 0; i < g.enemies.length; i++) { e = g.enemies[i]; if (!e.dead && e.dom === 'g' && d2(e.x, e.y, u.x, u.y) < 1) stunE(e, 1); }
      tw2Release(u); u.gone = 1; emit(g, 'unitDown', { x: u.x, y: u.y, k: 'soldier', tw: t, u: u }); return true;
    }
  }
  return false;
};

// ---------- 서낭당 (talisman): 부적을 날려 능력 봉인(e.sealT), 귀신과 요괴에 배수(spiritX) ----------
// A 봉인 부적: 긴 봉인, 보호막과 가속 벗김, 여러 장, 6단계 만귀 봉인진 = 8초마다 범위 안 전부 봉인과 감속. B 벽력 부적: 터지며 벼락(범위, 기절), 6단계 뇌공 강림 = 4번째 부적마다 큰 벼락이 6명에게 튐
function tw2ThunderOn(g, p, e, x, y) {
  var t = p.src.tw, st = t.st, pts = [[x, y - 3], [x, y - 0.3]], sk = {}, tg = nearEnemies(g, x, y, 3, st.thunderChain || 6, null, p.hit);
  tg.forEach(function (o) { pts.push([o.x, o.y - (o.dom === 'a' ? (o.z || 0.7) : o.size * 0.5)]); sk[o.id] = 1; tw2Hit(g, o, p.dmg * 0.8, 'magic', p.src, { stun: 0.6, spiritX: st.spiritX }, null); });
  emit(g, 'chain', { pts: pts, tw: t, lvl: t.lvl, k: t.k, el: 'bolt', sky: 1 }); emit(g, 'blast', { x: x, y: y, r: 1.6, k: 'holy', tw: t, lvl: t.lvl, big: 1 });
}
TW_ACT.talisman = function (g, t, dt) {
  var st = t.st; t.cd -= dt;
  if (st.fieldCd) {
    t.fT = (t.fT == null ? st.fieldCd * 0.5 : t.fT) - dt;
    if (t.fT <= 0) {
      if (tw2AnyIn(g, t, st.range, t.hit)) { t.fT = st.fieldCd; for (var i = 0; i < g.enemies.length; i++) { var o = g.enemies[i]; if (targetable(g, o, t.hit) && inR(t, o.x, o.y, st.range + o.size * 0.2)) { tw2Seal(g, o, st.fieldSeal, 1); slowE(o, 0.4, 3); } } emit(g, 'blast', { x: t.x, y: t.y, r: st.range, k: 'holy', tw: t, lvl: t.lvl, field: 1 }); }
      else t.fT = 0.2;
    }
  }
  if (t.cd > 0) return;
  var e = pickTarget(g, t, st); if (!e) { t.cd = 0.08; return; }
  t.cd = 1 / st.rate; tw2Aim(t, e.x, e.y); tw2Fired(g, t, 0);
  var tg = e.kind === 'obs' ? [e] : tw2Targets(g, t, st, t.hit, st.multi || 1, e), f = tw2F(g, t), th = st.thunderN && t.shots % st.thunderN === 0;
  // 봉인이 안 걸린 적을 먼저
  if (tg.length > 1) tg.sort(function (a, b) { return ((a.sealT > 0) ? 1 : 0) - ((b.sealT > 0) ? 1 : 0); });
  tg.forEach(function (q, i) { tw2Shot(g, t, 'talisman', q, { x: t.x, y: t.y - 0.4, z: 0.7, sp: 7.5, dmg: st.dmg * critMul(g, st), dk: 'magic', splash: st.splash || 0, bk: st.splash ? 'holy' : null, f: f, life: 4, big: th ? 1 : 0, on: th && i === 0 ? tw2ThunderOn : null, wob: i * 2.1 }); });
  emit(g, 'muzzle', { tw: t, n: tg.length, x: t.x, y: t.y, k: t.k, aim: t.aim, paper: 1 });
};

// ---------- 관리자 전용: 천벌포 (orbital), 수호룡 둥지 (dragon) ----------
// 천벌포: 전장 어디든 큰 광선. 사건 orbital { x, y, r, tw } + blast holy. t.busy = 충전
TW_ACT.orbital = function (g, t, dt) {
  var st = t.st; t.cd -= dt; t.busy = clamp(1 - t.cd * st.rate, 0, 1);
  if (t.cd > 0) return;
  var e = pickTarget(g, t, { range: 60, detect: 1 }); if (!e) { t.cd = 0.1; return; }
  t.cd = 1 / st.rate; tw2Aim(t, e.x, e.y); tw2Fired(g, t, 0); t.busy = 0;
  var src = tw2Src(t), x = e.x, y = e.y;
  emit(g, 'orbital', { x: x, y: y, r: st.splash, tw: t, lvl: t.lvl });
  tw2Splash(g, x, y, st.splash, st.dmg, 'true', src, { stun: 0.4, cardEl: st.cardEl, rate: st.rate }, 'gas'); if (e.kind === 'obs') hurtObs(g, e, st.dmg);
  if (st.zoneDps) g.zones.push({ kind: 'fire', x: x, y: y, r: st.splash * 0.8, t: st.zoneT, T: st.zoneT, dps: st.zoneDps, src: src });
  emit(g, 'blast', { x: x, y: y, r: st.splash, k: 'holy', tw: t, lvl: t.lvl, big: 1, orbital: 1 });
};
// 수호룡: 유닛(kind 'dragon')이 가장 앞선 적에게 날아가 불을 뿜음. 유닛 칸: x, y, ang, z, hp, tw, st('fly' | 'breath'), breath(0~1 불 세기), flameR, cone
TW_ACT.dragon = function (g, t, dt) {
  tw2Units(g, t, 'dragon', 1, function () { return { x: t.x, y: t.y, ang: -Math.PI / 2, z: 0.2, hp: 1, st: 'fly', breath: 0, bank: 0, i: 0, lvl: t.lvl, k: t.k }; });
  t.out = 1; t.cd -= dt;
  if (t.cd <= 0 || !tw2Alive(t.tgt)) { t.cd = 0.3; t.tgt = pickTarget(g, t, { range: 60, detect: 1 }); if (t.tgt && t.tgt.kind === 'obs') t.tgt = null; }
};
TW_SOLD.dragon = tw2UnitsOff;
UNIT_UPD.dragon = function (g, u, dt) {
  if (!u.tw) return false;
  var t = u.tw; if (!t || t.sold || u.gone || !t.st) { u.gone = 1; return true; }
  var st = t.st, e = tw2Alive(t.tgt) ? t.tgt : null, gx, gy;
  u.lvl = t.lvl; u.z = Math.min(1.2, u.z + dt); u.flameR = st.flameR; u.cone = st.cone;
  if (e) { gx = e.x; gy = e.y; } else { var a = g.t * 0.8; gx = t.x + Math.cos(a) * 1.5; gy = t.y + Math.sin(a) * 1.5; }
  var dist = hyp(u.x, u.y, gx, gy), near = e && dist < st.flameR * 0.8;
  tw2Steer(u, gx, gy, near ? (dist < 0.9 ? 0 : 0.3) : 3.6, near ? 8 : 3.5, dt);   // 가까이서는 멈춰 서서 표적을 바라봄
  var facing = e && dist < st.flameR && (dist < 0.3 || Math.abs(angDiff(u.ang, Math.atan2(e.y - u.y, e.x - u.x))) < 0.6);
  u.breath = facing ? Math.min(1, u.breath + dt * 4) : Math.max(0, u.breath - dt * 3); u.st = u.breath > 0.05 ? 'breath' : 'fly';
  if (facing) {
    var half = (st.cone || 60) * Math.PI / 360, src = tw2Src(t);
    for (var i = 0; i < g.enemies.length; i++) {
      var o = g.enemies[i]; if (o.dead || o.untarget || d2(o.x, o.y, u.x, u.y) > st.flameR * st.flameR) continue;
      if (Math.abs(angDiff(u.ang, Math.atan2(o.y - u.y, o.x - u.x))) > half && d2(o.x, o.y, u.x, u.y) > 0.16) continue;
      hurt(g, o, st.flameDps * dt, 'magic', src, true, { el: 'fire', quiet: 1 }); if (!o.dead) burnE(o, st.burn, st.burnT || 3);
    }
  }
  return false;
};

// ---------- 합체 ----------
// fuseOptions(g, t) → [{ with: 상대 탑, to: 합체 탑 키 }]: 합체가 열려 있고(g.fuse 또는 g.fuseOk) 둘 다 5단계 이상, 이웃 8칸
function fuseOptions(g, t) {
  var out = []; if (!g || !t || !(g.fuse || g.fuseOk) || t.lvl < 5 || !TOWERS[t.k] || TOWERS[t.k].fusion || TOWERS[t.k].admin) return out;
  for (var i = 0; i < FUSIONS.length; i++) {
    var F = FUSIONS[i], other = F.a === t.k ? F.b : F.b === t.k ? F.a : null; if (!other || !TOWERS[F.to]) continue;
    for (var j = 0; j < g.towers.length; j++) { var o = g.towers[j]; if (o !== t && o.k === other && o.lvl >= 5 && Math.abs(o.c - t.c) <= 1 && Math.abs(o.r - t.r) <= 1) out.push({ 'with': o, to: F.to }); }
  }
  return out;
}
// fuseTowers(g, a, b) → 새 탑 | null. 자리는 a의 칸(수상 합체는 물 쪽 재료의 칸), 다른 칸은 비워짐. 들인 금화, 처치, 피해를 합치고 재료가 6단계면 한 개마다 +1단계
function fuseTowers(g, a, b) {
  var ops = fuseOptions(g, a), op = null, i;
  for (i = 0; i < ops.length; i++) if (ops[i]['with'] === b) op = ops[i];
  if (!op) return null;
  var to = op.to, keep = fdSite(to) === 'water' ? (a.site === 'water' ? a : b.site === 'water' ? b : null) : a; if (!keep) return null;
  var saved = g.towers, ev0 = g.ev.length, built0 = g.stats.built;
  g.towers = saved.filter(function (t) { return t !== a && t !== b; }); reindexTowers(g);
  var nt = buildTower(g, to, keep.c, keep.r, true);
  if (!nt) { g.towers = saved; reindexTowers(g); refreshStats(g); return null; }
  g.ev.length = ev0; g.stats.built = built0;   // 건설 사건 대신 합체 사건
  [a, b].forEach(function (m) { if (m.st && TW_SOLD[m.st.kind]) TW_SOLD[m.st.kind](g, m); m.sold = 1; m.fused = 1; });
  nt.lvl = Math.min(fdMaxLv(to), g.maxLv, 1 + (a.lvl >= 6 ? 1 : 0) + (b.lvl >= 6 ? 1 : 0));
  nt.spent = a.spent + b.spent; nt.kills = a.kills + b.kills; nt.dmg = a.dmg + b.dmg; nt.mode = a.mode; nt.from = [a.k, b.k];
  refreshStats(g);
  if (g.focus && (g.focus.t === a || g.focus.t === b)) g.focus = null;
  g.stats.fused = (g.stats.fused || 0) + 1;
  emit(g, 'fuse', { a: a, b: b, tw: nt, k: to, x: nt.x, y: nt.y, lvl: nt.lvl });
  return nt;
}
// 합체 탑의 재료 [a, b] (도감, 화면용)
function fzParts(k) { for (var i = 0; i < FUSIONS.length; i++) if (FUSIONS[i].to === k) return [FUSIONS[i].a, FUSIONS[i].b]; return null; }

// 그림이 아직 없는 탑의 대역(art_tower.js towerSpr의 한 줄 고리가 부름): 비슷한 기존 탑 키. 그림 갈래가 TW_EXT[키]를 등록하면 쓰이지 않는다
var TW2_ART = { flak: 'cannon', sam: 'ballista', gatling: 'archer', sniper: 'archer', rocket: 'catapult', laser: 'arcane', tesla: 'arcane', airbase: 'bell', warship: 'cannon', turtle: 'flame', singijeon: 'ballista', jangseung: 'bell', barracks: 'mint', shrine: 'alchemy', omega: 'arcane', dragon: 'flame' };
function tw2ArtStand(k) { var P = fzParts(k), a = TW2_ART[k] || (P ? (TW2_ART[P[0]] || P[0]) : 'archer'); return TW2_ART[a] || a; }

// ---------- 합체 탑 8종 ----------
// 천상궁: 여러 표적에 빠른 화살 + bigCd마다 화면을 가로지르는 거대한 관통 화살(기존 탄 bolt, big 1, sky 1). t.busy = 큰 화살 시위
TW_ACT.fz_skybow = function (g, t, dt) {
  var st = t.st; t.cd -= dt; t.cd2 = (t.cd2 == null ? st.bigCd * 0.5 : t.cd2) - dt; t.busy = clamp(1 - t.cd2 / st.bigCd, 0, 1);
  var e = pickTarget(g, t, st);
  if (!e) { if (t.cd < 0) t.cd = 0; if (t.cd2 < 0) t.cd2 = 0; return; }
  tw2Aim(t, e.x, e.y); var src = tw2Src(t);
  if (t.cd <= 0) {
    t.cd = 1 / st.rate; var tg = e.kind === 'obs' ? [e] : tw2Targets(g, t, st, t.hit, st.multi || 3, e);
    tg.forEach(function (tt, n) {
      var crit = st.crit && g.rnd() < st.crit, dist = hyp(t.x, t.y, tt.x, tt.y);
      g.proj.push({ kind: 'arrow', sx: t.x + (n - (tg.length - 1) / 2) * 0.12, sy: t.y, h0: 0.95, x: t.x, y: t.y, tx: tt.x, ty: tt.y, tgt: tt, t: 0, T: 0.1 + dist / 11, h: 0.2 + dist * 0.06, dmg: st.dmg * (crit ? st.critX || 2 : 1), dt: 'phys', src: src, crit: crit, big: true, pierce: 1, bounce: 0, el: st.cardEl, extra: 0, st: st, lvl: 6 });
    });
    t.shots = (t.shots || 0) + 1; t.side = 1 - (t.side || 0); emit(g, 'muzzle', { tw: t, n: tg.length, x: t.x, y: t.y, k: t.k, aim: t.aim, arrow: 1 });
  }
  if (t.cd2 <= 0) {
    t.cd2 = st.bigCd; t.fireT = 0.35;
    var pp = predict(e, hyp(t.x, t.y, e.x, e.y) / 13), ang = Math.atan2(pp.y - t.y, pp.x - t.x); t.aim = ang;
    g.proj.push({ kind: 'bolt', x: t.x, y: t.y - 0.35, vx: Math.cos(ang) * 13, vy: Math.sin(ang) * 13, left: 34, pierce: 999, hit: {}, dmg: st.bigDmg, st: { shred: st.shred, shredT: st.shredT || 5, cardEl: st.cardEl, rate: 0.5 }, src: src, tgtObs: e.kind === 'obs' ? e : null, lvl: 6, br: 0, ang: ang, el: st.cardEl, big: 1, sky: 1 });
    emit(g, 'launch', { tw: t, n: 1, x: t.x, y: t.y, k: t.k, ang: ang, sky: 1 });
  }
};
// 거포 요새: 거대한 포탄(navshell, big 1), 넓은 범위와 기절, 밀어내기. quakeN발마다 지진탄(범위와 피해 quakeX배, blast에 quake 1)
TW_ACT.fz_fortress = function (g, t, dt) {
  var st = t.st; t.cd -= dt; t.busy = clamp(1 - t.cd * st.rate, 0, 1);
  if (t.cd > 0) return;
  var e = pickTarget(g, t, st); if (!e) { t.cd = 0.1; return; }
  t.cd = 1 / st.rate; tw2Aim(t, e.x, e.y); tw2Fired(g, t, 1); t.busy = 0;
  var qk = st.quakeN && t.shots % st.quakeN === 0, dist = hyp(t.x, t.y, e.x, e.y), T = 0.5 + dist * 0.08, pp = predict(e, T), k = qk ? st.quakeX || 1.6 : 1;
  tw2Lob(g, t, 'navshell', pp.x, pp.y, { dmg: st.dmg * critMul(g, st) * (qk ? 1.5 : 1), splash: st.splash * k, T: T, h: 1.2 + dist * 0.2, big: 1, bk: 'he', quake: qk ? 1 : 0, tgt: e.kind === 'obs' ? e : null, on: qk ? function (g2, p, e2, x, y) { emit(g2, 'blast', { x: x, y: y, r: p.splash * 1.2, k: 'he', big: 1, quake: 1, tw: t }); } : null });
};
// 뇌신탑: 전장 어디든 n명에게 벼락(chain, sky 1) + bigCd마다 모든 적에게 큰 벼락과 기절(blast emp, big 1). t.busy = 큰 벼락 충전
TW_ACT.fz_storm = function (g, t, dt) {
  var st = t.st, i, o; t.cd -= dt; t.cd2 = (t.cd2 == null ? st.bigCd : t.cd2) - dt; t.busy = clamp(1 - t.cd2 / st.bigCd, 0, 1);
  if (t.cd > 0 && t.cd2 > 0) return;
  var L = []; for (i = 0; i < g.enemies.length; i++) { o = g.enemies[i]; if (targetable(g, o, t.hit) && o.x > -0.5 && o.y > -0.5 && o.x < g.cols + 0.5 && o.y < g.rows + 0.5) L.push(o); }
  if (!L.length) { if (t.cd < 0) t.cd = 0.15; if (t.cd2 < 0) t.cd2 = 0; return; }
  var src = tw2Src(t), f = { stun: st.stun, cardEl: st.cardEl, rate: st.rate };
  if (t.cd <= 0) {
    t.cd = 1 / st.rate; tw2Fired(g, t, 0);
    L.sort(function (a, b) { return (a.P.len - a.d) - (b.P.len - b.d); });
    var n = Math.min(st.n, L.length), F = g.focus && g.focus.e; if (F && L.indexOf(F) >= n) L[n - 1] = F;
    for (i = 0; i < n; i++) { o = L[i]; var oy = o.y - (o.dom === 'a' ? (o.z || 0.7) : o.size * 0.5); emit(g, 'chain', { pts: [[o.x + (g.rnd() - 0.5) * 0.6, oy - 4], [o.x, oy]], tw: t, lvl: t.lvl, k: t.k, el: 'bolt', sky: 1 }); tw2Hit(g, o, st.dmg * critMul(g, st), 'magic', src, f, null); }
    tw2Aim(t, L[0].x, L[0].y);
  }
  if (t.cd2 <= 0) {
    t.cd2 = st.bigCd; t.fireT = 0.35;
    for (i = 0; i < L.length; i++) if (!L[i].dead) tw2Hit(g, L[i], st.bigDmg, 'magic', src, { stun: st.bigStun }, null);
    emit(g, 'blast', { x: t.x, y: t.y, r: 14, k: 'emp', tw: t, lvl: t.lvl, big: 1, storm: 1 });
  }
};
// 빙염탑: 얼음 파동과 불 파동을 번갈아(blast ice / fire, r = 사거리). 얼어 있는 적은 불에 더 아프게 맞음(shatter). t.side = 다음이 불이면 1
TW_ACT.fz_frostfire = function (g, t, dt) {
  var st = t.st, i, e; t.cd -= dt; t.busy = clamp(1 - t.cd * st.rate, 0, 1);
  if (t.cd > 0) return;
  if (!tw2AnyIn(g, t, st.range, t.hit)) { t.cd = 0.1; return; }
  t.cd = 1 / st.rate; var ice = !t.phase; t.phase = ice ? 1 : 0; tw2Fired(g, t, 0); t.side = t.phase;
  var src = tw2Src(t);
  for (i = 0; i < g.enemies.length; i++) {
    e = g.enemies[i]; if (!targetable(g, e, t.hit) || !inR(t, e.x, e.y, st.range + e.size * 0.2)) continue;
    if (ice) { hurt(g, e, st.dmg, 'magic', src, false, { el: 'ice' }); if (e.dead) continue; slowE(e, st.slow, st.slowT); if (!e.boss && g.rnd() < st.freeze) freezeE(e, st.freezeT, st.shatter); }
    else { hurt(g, e, st.fireDmg, 'magic', src, false, { el: 'fire' }); if (!e.dead) burnE(e, st.burn, st.burnT); }
    if (!e.dead && st.cardEl) elHit(g, st, e, st.dmg, src);
  }
  emit(g, 'blast', { x: t.x, y: t.y, r: st.range, k: ice ? 'ice' : 'fire', tw: t, lvl: t.lvl, big: 1, wave: 1 });
};
// 이지스 방공망: 대공포 탄막 + aaCd마다 전장 어디든 하늘 적 aaN명에게 미사일 + 적 포탄, 폭탄 요격
TW_ACT.fz_aegis = function (g, t, dt) {
  var st = t.st; t.cd -= dt;
  tw2AA(g, t, dt, st, st.aaRange || 30);
  if (st.icpt) { t.icT = (t.icT || 0) - dt; if (t.icT <= 0) t.icT = tw2Intercept(g, t, st.range + 2) ? st.icpt : 0.1; }
  if (t.cd > 0) return;
  var e = pickTarget(g, t, st); if (!e) { t.cd = 0.08; return; }
  t.cd = 1 / st.rate; tw2Aim(t, e.x, e.y); tw2Fired(g, t, 1); t.spin = (t.spin || 0) + 0.5;
  tw2Shot(g, t, 'flakshell', e, { sp: 14, dmg: st.dmg * critMul(g, st), splash: st.splash, bk: 'flak', big: 0.3 });
};
// 강철 비: 기관포 연사(tw2GatlingRun) + rkCd마다 로켓 rkN발 일제 사격(땅과 바다)
TW_ACT.fz_arsenal = function (g, t, dt) {
  var st = t.st;
  var W = { dmg: st.rkDmg, splash: st.rkR, spread: st.rkSpread, hit: 'gs', cluster: 0, napalm: 0, f: { cardEl: st.cardEl, rate: 1 }, zone: null, big: 1 };
  tw2Salvo(g, t, dt, 0.06, function (i) { tw2RocketFire(g, t, i, W); });
  tw2GatlingRun(g, t, dt, st, null);
  t.cd2 = (t.cd2 == null ? 1 : t.cd2) - dt;
  if (t.cd2 <= 0 && !(t.salvoN > 0)) {
    var e = pickTarget(g, t, st, 'gs'); if (!e) { t.cd2 = 0.15; return; }
    t.cd2 = st.rkCd; t.salvoN = st.rkN; t.salvoI = 0; t.salvoT = 0; t.salvoTgt = e; t.salvoX = e.x; t.salvoY = e.y;
    emit(g, 'launch', { tw: t, n: st.rkN, x: t.x, y: t.y, k: t.k });
  }
};
// 항공모함(물): 전투기 편대(기총, 폭탄, 공대공 미사일) + 함포
TW_ACT.fz_carrier = function (g, t, dt) {
  var st = t.st; tw2AirRun(g, t, dt, st, false);
  t.cd2 = (t.cd2 == null ? 1 : t.cd2) - dt; if (t.cd2 > 0) return;
  var e = pickTarget(g, t, st, 'gs'); if (!e) { t.cd2 = 0.15; return; }
  t.cd2 = st.gunCd; tw2Fired(g, t, 1); tw2NavFire(g, t, st, e, 1, st.gunDmg, st.gunR, { cardEl: st.cardEl, rate: 1, seaX: 1.4 });
};
TW_SOLD.fz_carrier = tw2UnitsOff;
// 화룡선(물): 용머리 화염(하늘도) + 양현 포 + arrowCd마다 로켓 화살 arrowN발
TW_ACT.fz_dragonship = function (g, t, dt) {
  var st = t.st, src = tw2Src(t); t.cd -= dt;
  var W = { dmg: st.arrowDmg, hit: 'gas', f: { cardEl: st.cardEl, rate: 2 }, fireRain: 0 };
  tw2Salvo(g, t, dt, 0.03, function (i) { tw2ArrowFire(g, t, i, W); });
  var fe = tw2Flame(g, t, dt, st, src);
  if (t.cd <= 0) { var n = tw2Balls(g, t, st, st.n, st.dmg, src); if (n) { t.cd = 1 / st.rate; tw2Fired(g, t, n); } else t.cd = 0.1; }
  t.cd2 = (t.cd2 == null ? 0.8 : t.cd2) - dt;
  if (t.cd2 <= 0 && !(t.salvoN > 0)) {
    var e = fe && fe.kind !== 'obs' ? fe : pickTarget(g, t, st, 'gas'); if (!e || e.kind === 'obs') { t.cd2 = 0.15; return; }
    t.cd2 = st.arrowCd; t.salvoTg = tw2Targets(g, t, st, 'gas', 6, e); t.salvoN = st.arrowN; t.salvoI = 0; t.salvoT = 0;
    emit(g, 'launch', { tw: t, n: st.arrowN, x: t.x, y: t.y, k: t.k });
  }
};
