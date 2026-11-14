# 엔진 안내 (v2.0 기반 갈래 FOUND 작성, 다음 갈래가 제일 먼저 읽는 문서)

빌드는 src의 파일을 한 함수로 이어 붙인다(순서는 tools/build.js). 논리(util, data, stages, path, logic, bot)는 화면 없이 노드에서 돈다.
등록 고리 표는 맨 앞 파일 util.js에 있어 어느 파일에서든 끼울 수 있다. 규칙은 하나: **등록돼 있으면 그것을 쓰고, 없으면 기존 동작.**

## 1. 판과 격자
- 판은 `MAPS.push({...})`(stages_chN.js, 스키마는 SPEC 4절). data.js에는 `MAPS = []`, `CHAPTERS`(4개, 별 수는 임시), `UNLOCKS`, `STORY = {}`, `SPEAKERS`만 있다.
- 격자는 판마다 `M.cols`, `M.rows`(없으면 기본 `COLS = 10`, `ROWS = 17`). 코드에서는 반드시 `g.cols`, `g.rows`(그리기에서 g가 없으면 `RD.cols`, `RD.rows`). 칸 번호는 `r * g.cols + c`.
- `parseMap(mi)` → `{ kind[], obsAt[], obs[], gate, errs[], cols, rows, sea[] }`. kind: 'g' 풀밭, 'p' 길, 'rock', 'water', 'lava'. 뱃길이 지나는 물 칸은 `g.seaCell[i] = 1`.
- 길: `g.paths`(땅, buildPath), `g.fly`(땅 길을 편 하늘 곡선), `g.sea`(뱃길), `g.air`(직선 항로, `airPath([c0, r0, c1, r1])`). 모두 `{ xs, ys, len, n }`, 위치는 `pathAt(P, d, out)` → x, y, dx, dy.
- 화면 칸 크기: `rdLayout(g, top, bot)`이 `min(폭 / g.cols, (높이 - 위 막대 - 아래 막대) / g.rows)`로 잡는다. 화면 좌표는 `WX(칸 x)`, `WY(칸 y)`, 칸 크기 `RD.view.S`(기기 화소).

## 2. 주요 상태
- 게임 g: `mi, dk, M, D, cols, rows, t, gold, lives, maxLives, wave, N, waiting, over(0 | 1 승 | -1 패), enemies[], towers[], proj[], zones[], bars[](방책), units[](아군 유닛), obs[], gate{x, y}, ev[](사건), rule(판 규칙 상태 또는 null), maxLv, fuse, admin, towersOk(편성), tStar, attr/build/buffs(능력 카드), sk(기술 쿨다운), unlockedSkills, focus, boss, rnd()`.
- 탑 t: `id, k(탑 키), lvl(1~6), br(0 | 1), c, r, x, y, st(지금 능력치: towerStats에 연구, 종탑, 카드, 규칙 반영. st.kind = 공격 종류, st.el), cd, aim(라디안), tgt, mode('first' | 'last' | 'strong' | 'close'), spent, kills, dmg, fireT, side, shots, spin, busy, out, born, hit(영역 글자 모음), site, frozenT, stunT, hexT, charmT, buff`. frozenT, stunT, hexT, charmT가 0보다 크면 towerAct가 시간을 깎고 아무것도 안 한다.
- 적 e: `id, k, E(ENEMIES[k]), hp, mhp, armor, mres, spd, gold, leak, size, dom('g' | 'a' | 's'), fly(dom이 'a'), lane, route('path' | 'sea' | 'air'), pi(길 번호), P(길), d(길 위 거리), off, x, y, z(하늘 0.75), ang, dirx, diry, face, stealth, revealed, untarget, boss, slowF, slowT, stunT, frozen, burnDps, burnT, poisonDps, poisonT, shredA, shredT, shield, markT, markA, buffSpd, buffSpdT, abilT, hitT, age, dead`. 새 상태(fade, sub, rage, grow, form, sealT, fearT)는 필요한 갈래가 e에 그냥 붙인다.
- 탄 p: `kind, x, y, (z, ang, lvl, el, big), src{ tw, ap, el }, dmg, st, t(자동으로 늘어남)`. 기존 종류: arrow, stone, flask, frag, orb, shell, bolt, dart.

## 3. 주요 함수 (logic.js, data.js)
- `newGame(mi, dk, opts)`: opts = research, towers, towerStar, maxLv(3 | 5 | 6, 기본 6), skills, autoWave, cards(false면 능력 카드 없음), fuse, admin. `stepGame(g, dt)`, `DT = 1 / 60`. `callEarly(g)`가 첫 웨이브 시작과 다음 웨이브 부르기.
- 탑: `canBuildAt(g, c, r, type)`, `fdCellSite(g, c, r)`, `buildTower(g, type, c, r, free)` → t | null, `canUpgrade(g, t)`, `upgradeTower(g, t, br)`(3단계에서만 br 0 | 1 필요), `sellTower(g, t)`, `towerCost`, `refreshStats(g)`(능력치 다시 계산: 판 상태를 바꿨으면 부를 것), `towerStats(type, lvl, br)`, `upgCost`, `towerTitle`(6단계는 br[i].ult), `fdMaxLv(type, br)`(갈래 tiers 길이 + 3).
- 적: `spawnEnemy(g, type, pathIdx, d, extra)` → e (영역에 맞는 길 목록에서 pathIdx를 고름), `hurt(g, e, amt, kind, src, quiet, opt)` → 들어간 피해. kind 'phys' | 'expl' | 'magic' | 'true', opt { el, single, fx, fy }. `killEnemy(g, e, src)`, `leak(g, e)`, `slowE(e, f, sec)`, `stunE(e, sec)`, `freezeE(e, sec, shatter)`, `burnE(e, dps, sec)`, `poisonE(e, dps, sec, shred)`, `placeEnemy(e)`(e.d를 바꾼 뒤).
- 표적: `pickTarget(g, t, st, hit글자모음?)`, `targetable(g, e, hit?)`, `seenBy(e, st)`, `nearEnemies(g, x, y, r, n, skip, hit)`, `splashAt(g, x, y, r, dmg, kind, src, st, hit)`, `predict(e, sec)`, `inR(t, x, y, r)`. hit 자리에 옛 true/false도 된다(true 'gas', false 'gs').
- 사건: `emit(g, 이름, {…})` → g.ev. 화면은 매 프레임 `rdEvents(g)`가 비우며 효과와 소리를 내고 `uiEvent(g, ev)`로 넘긴다.
  기존 이름: build, upgrade, sell, shoot, hit, crit, miss, dmg, kill, boom, splat, zap, pulse, ring, orbHit, fragHit, leak, wave, clear, early, boss, bossDie, newEnemy, win, lose, cont, pick, picked, combo, heal, ward, roar, brood, nova, summon, split, wreck, bones, revive, resist, melt, refreeze, twinSwap, bonk, mint, rain, rainHit, wall, wallBreak, last, crown, kneel, focus, obsDie, foundTower, allObs, elHit, bounce, spread, plague, iceBurst, shieldBreak.
  v2.0에서 더한 것: `transform { tw, lvl, br, ult, x, y, k }`(4단계 갈래 선택과 6단계 궁극, upgrade 사건 바로 뒤). leak에 dom, ex, ey, kill에 dom. 나머지 새 사건(tracer, chain, blast, muzzle, fuse, launch, planeOut, towerStun, ruleEv 등 SPEC 7절)은 내는 갈래가 emit하고 그리는 갈래가 FX_EV로 받는다.

## 4. 영역 규칙
- 적: `fdDom(E)` = E.dom 또는 fly면 'a', 아니면 'g'. 길은 `fdRoute(E)`: lane: 1이면 항로(g.air), dom 's'면 뱃길(g.sea), 그 밖은 땅 길(보통 하늘 적은 g.fly). 그 길이 판에 없으면 makeWave가 그 적을 빼고, spawnEnemy는 땅 길로 보낸다. 길 끝에 닿으면 leak(생명 깎임).
- 웨이브 묶음의 `path`는 그 적 영역의 길 목록 안 번호다(땅 M.paths, 바다 M.sea, 항로 M.air).
- 탑: `fdSite(type)` 'land' | 'water'. 물 칸(뱃길 칸 제외)에는 site 'water'만, 풀밭에는 'land'만. `fdHit(type)` = T.hit 또는 air: 1이면 'gas', 아니면 'gs'. pickTarget, targetable, nearEnemies, splashAt이 이 글자 모음을 지킨다. 범위 공격(파동, 고리, 불길, 종탑)은 기존처럼 모든 영역을 친다.
- 방책과 빙판 가속은 땅 적(dom 'g')만. 장판(불, 독)은 하늘 적 제외.

## 5. 등록 고리 (이름 고정, 표는 util.js)
| 고리 | 호출 시점과 인자 |
|---|---|
| `TW_ACT[kind](g, t, dt)` | 매 걸음 towerAct에서 fireT 감소, 멈춤 상태 확인 뒤. kind = t.st.kind. 등록되면 쿨다운(t.cd), 표적, 탄, 사건을 전부 맡는다 |
| `TW_INIT[kind](g, t)` | buildTower 끝(능력치 계산 뒤). 강화로 kind가 바뀌면 옛 kind의 TW_SOLD 뒤 새 kind의 TW_INIT |
| `TW_SOLD[kind](g, t)` | sellTower에서 목록에서 뺀 뒤(딸린 유닛 치우기) |
| `EN_AB[적 키].spawn(g, e)` | spawnEnemy 끝 |
| `EN_AB[k].tick(g, e, dt)` | 매 걸음 상태 갱신과 기존 능력 뒤, 이동 앞 |
| `EN_AB[k].hurt(g, e, dmg, info)` → 바뀐 피해 | hurt에서 갑옷, 상성, 표식을 셈한 뒤, 보호막을 깎기 전. info = { kind, el, src, opt, raw, quiet }. 0 이하를 돌려주면 안 맞음 |
| `EN_AB[k].die(g, e, src)` | killEnemy에서 죽기 직전. false를 돌려주면 죽음 취소(e.hp를 올려 둘 것) |
| `PROJ_UPD[p.kind](g, p, dt)` → true면 끝 | updateProj, p.t는 이미 더해져 있음 |
| `UNIT_UPD[u.kind](g, u, dt)` → true면 없앰 | stepGame에서 탄과 장판 뒤. u.dead = 1도 없앰 |
| `RULES[id].init(g)` | newGame 끝(g.rule = M.rule의 얕은 복사) |
| `RULES[id].tick(g, dt)` | stepGame 맨 앞(웨이브 흐름 앞) |
| `RULES[id].canBuild(g, type, c, r)` → false면 금지, `.stats(g, t, st)`(refreshStats 끝에서 st를 고침), `.spawn(g, e)`, `.wave(g, W, 번호)` | 있으면 불림 |
| `PROJ_DRAW[p.kind](x, g, p, S, time)` | drawProjectiles. 없고 기존 종류도 아니면 빛나는 점(fdProjDot) |
| `UNIT_DRAW[u.kind](x, g, u, S, time)` | 탄 그리기 바로 앞. 없으면 빛나는 점 |
| `FX_EV[사건 이름](g, ev)` | rdEvents. true를 돌려주면 기존 처리를 건너뜀(uiEvent는 항상 불림) |
| `function EN_OVER(x, g, e, X, Y, hh, time)` | drawEnemy 끝. X, Y는 몸 발밑 화면 좌표, hh는 키(화소) |
| `function TW_OVER(x, g, t, X, Y, S, time)` | drawTower에서 몸을 그린 뒤. X, Y는 탑 발밑 |
newGame은 opts.fuse, opts.admin을 g.fuse, g.admin으로 복사만 한다. `fuseOptions`, `fuseTowers`는 ENG2가 만든다.

## 6. 최소 예시
```
// 탑 공격 종류 하나 (logic_towers2.js): TOWERS.flak.kind = 'flak'
TW_ACT.flak = function (g, t, dt) {
  t.cd -= dt; if (t.cd > 0) return;
  var e = pickTarget(g, t, t.st); if (!e) { t.cd = 0.08; return; }     // t.hit('a')만 겨눔
  t.cd = 1 / t.st.rate; t.aim = Math.atan2(e.y - t.y, e.x - t.x); t.fireT = 0.35; t.shots++;
  g.proj.push({ kind: 'flakshell', x: t.x, y: t.y, z: 0.6, tgt: e, sp: 9, dmg: t.st.dmg, lvl: t.lvl, src: { tw: t, el: t.st.el } });
  emit(g, 'muzzle', { tw: t, n: 1 });
};
PROJ_UPD.flakshell = function (g, p, dt) {
  var e = p.tgt; if (!e || e.dead) return true;
  var dx = e.x - p.x, dy = e.y - p.y, L = Math.hypot(dx, dy), s = p.sp * dt; p.ang = Math.atan2(dy, dx);
  if (L > s) { p.x += dx / L * s; p.y += dy / L * s; return false; }
  splashAt(g, e.x, e.y, 0.6, p.dmg, 'expl', p.src, null, 'a'); emit(g, 'blast', { x: e.x, y: e.y, r: 0.6, k: 'flak' }); return true;
};
// 적 능력 하나 (logic_enemies2.js)
EN_AB.phantom = { spawn: function (g, e) { e.fadeT = 3; }, tick: function (g, e, dt) { e.fadeT -= dt; if (e.fadeT < -1.5) e.fadeT = 3; e.fade = e.fadeT < 0 ? 1 : 0; e.untarget = e.fade; },
  hurt: function (g, e, dmg, info) { return e.fade ? 0 : dmg; } };
// 규칙 하나 (logic_rules.js): 판에 rule: { id: 'fog', k: 0.85 }
RULES.fog = { init: function (g) { refreshStats(g); }, stats: function (g, t, st) { if (st.range && t.k !== 'bell' && t.k !== 'mint') st.range *= g.rule.k || 0.85; } };
// 탄 그리기 하나 (render_tw.js)
PROJ_DRAW.flakshell = function (x, g, p, S, time) { var X = WX(p.x), Y = WY(p.y) - (p.z || 0) * S; x.fillStyle = '#3a3340'; x.beginPath(); x.arc(X, Y, S * 0.07, 0, 6.283); x.fill(); };
FX_EV.blast = function (g, ev) { ringFx(ev.x, ev.y, ev.r, '#55505c', 0.4, 0.08); };
```

## 7. 진행, 저장, 화면 쪽 (ui.js)
- 저장 키 `ironhold.v1`(SAVE.v = 1). 옛 `lastarrow.v4`가 있고 새 저장이 없으면 `fdMigrateOld`가 보석, 소환권, 가진 탑과 별, 스킨, 설정만 옮긴다(옛 저장은 지우지 않음). 시작 탑 archer, catapult, flak(flak은 TOWER_ORDER에 없어 전투 목록에는 아직 안 나옴).
- 판 진행은 id 기준: `fdWon(id)`, `fdMi(id)`, `fdStageOpen(mi)` → { ok, why: 'prev' | 'chapter' | 'gate', need, have }, `fdCurStage()`, `fdChStars(ch)`, `mapStars(id)`, `fdUnlocked('branch' | 'ult' | 'fuse')`(기준 판이 MAPS에 없으면 열린 것으로, SAVE.admin이면 전부 열림).
- `towersFor(mi)` = 가진 탑, `maxLvFor(mi)` 3 | 5 | 6, `skillsFor(mi)`(방책은 c1s01, 최후의 화살은 c1s02 승리 뒤), `fdGameOpts(mi)` = newGame에 넘길 한 벌(startBattle이 씀).
- 지도 화면은 옛 것 그대로 MAPS 개수만큼 노드를 그린다(챕터 화면은 화면 갈래). 챕터 결말은 STORY['c1end'] 식을 그 챕터 마지막 판 첫 승리 때 한 번.
- 건설 쟁반은 칸의 자리(땅, 물)에 맞는 탑만 보여 준다. 강화 쟁반은 fdMaxLv와 g.maxLv를 따른다.

## 8. 시험 명령 (전부 통과해야 함)
```
node tools/build.js                      # 이름 겹침 검사 + out/index.html
node tools/checkmaps.js                  # 격자, 길, 뱃길(물 위, 부두), 항로, 적의 길, 웨이브 미리보기
node tools/logictest.js                  # 격자 크기, 영역, 물 칸, 변신 단계, 등록 고리 전부, 보스
node tools/wavetest.js . ; node tools/metatest.js ; node tools/sim.js all normal 1 0 nocard
python3 tools/touchflow.py 360x640 ; python3 tools/touchflow.py 412x915   # 29단계
python3 tools/gachaflow.py ; python3 tools/metaflow.py 360x640
python3 tools/fdshot.py                  # 땅, 물, 항로 판 전투 캡처 → shots/fd_<크기>_<판>.png
```
노드 시험은 `tools/fdload.js`가 논리 파일을 빌드 순서대로 올린다(새 logic_*.js, stages_*.js도 자동). 브라우저 콘솔: `__td.fd.open(mi)`, `__td.fd.unlocked(k)`, `__td.fd.opts(mi)`, `__td.fd.spawn(적 키, 길, d)`.

## 9. 임시로 둔 것 (갈아 끼울 것)
- [STGA가 바꿈] 시험 판 5개는 `tools/teststages.js`로 옮겨 id가 t1 ~ t5가 됐다(t1 외길, t2 두 길, t3 엇갈림과 우두머리, t4 물과 뱃길, t5 항로 2개). `tools/fdload.js`가 실제 판 뒤에 붙이므로 노드 시험은 `fdT('t4')`처럼 id로 판 번호를 찾아 쓸 것(MAPS[0]은 이제 실제 1장 1판). 게임 빌드에는 시험 판이 없다. `src/stages_ch1.js`, `stages_ch2.js`는 실제 판(docs/REPORT_stga.md).
- 임시 적 `fdBoat`(orc 복제, 바다), `fdJet`(bat 복제, 항로): tools/teststages.js 안에 있어 노드 시험에서만 보인다. 그림은 `E.art` 키의 것을 빌린다(art_enemy.js enemyFrames 한 줄).
- CHAPTERS의 별 수(open.stars, gate)는 임시값. 판 보상(M.reward)과 도전 규칙 표시는 아직 화면에 없다(지급은 옛 소환권 규칙 gcWinTickets 그대로).
- 6단계 그림: 기존 탑은 towerSpr가 5단계 그림으로 대신한다(art_tower.js 두 줄). 기존 10탑의 tiers는 아직 2개라 5단계까지만 오른다(ENG2가 3번째 tier를 넣으면 6단계).
- 뱃길과 항로의 길 표시, 위에서 본 적 돌려 그리기(EN_DRAW[k].top), 하늘 높이 e.z 반영은 그리기 갈래 몫. 뱃길 시작점에는 임시로 땅 길과 같은 균열 표시를 둔다.
- art_fx.js의 주변 입자(initAmbient)는 기본 COLS, ROWS를 쓴다(기본 크기 판에서는 차이 없음). 바르칸 무릎 꿇기(최후의 화살로 마무리) 논리는 그대로 남아 있다.
