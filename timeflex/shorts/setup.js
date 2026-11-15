// 전투 꾸미기: a = {towers:[...], n, lv, waves, r0, r1, off}
(a) => {
  const g = __td.G(); g.cardsOn = false; g.pickWait = false; g.pickCards = null; g.ev = g.ev.filter(e => e.t !== 'pick');
  try { __td.closeModal(); } catch (e) {}
  g.lives = 999; g.gold = 999999;
  for (const k in __td.EN) g.seenEnemies[k] = 1;
  g.towersOk = Object.keys(__tf.towersOf()); g.maxLv = 6; g.fuse = true; g.fuseOk = true;
  const WATER = { galleon: 1, turtle: 1, warship: 1 };
  const isP = i => g.kind[i] === 'p' || (g.seaCell && g.seaCell[i]);
  const L = [], W = [];
  for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
    const i = r * g.cols + c; if (g.towerAt[i] >= 0) continue; const o = g.obsAt ? g.obsAt[i] : -1; if (o >= 0 && g.obs[o] && g.obs[o].alive) continue;
    const land = g.kind[i] === 'g', wat = g.kind[i] === 'water' && !(g.seaCell && g.seaCell[i]); if (!land && !wat) continue;
    let near = 0; for (const d of [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]]) { const cc = c + d[0], rr = r + d[1]; if (cc >= 0 && rr >= 0 && cc < g.cols && rr < g.rows && isP(rr * g.cols + cc)) near += Math.abs(d[0]) + Math.abs(d[1]) === 1 ? 2 : 1; }
    if (near >= 2 && r >= (a.r0 == null ? 1 : a.r0) && r <= g.rows - 1 - (a.r1 == null ? 1 : a.r1)) (land ? L : W).push([c, r]);
  }
  const want = a.n || 10, out = [], used = {};
  const nW = a.towers.filter(k => WATER[k]).length, nL = a.towers.length - nW;
  const cntW = nW ? Math.round(want * nW / a.towers.length) : 0, cntL = want - cntW;
  const pick = (arr, cnt, keys) => { if (!arr.length || !keys.length) return; const st = arr.length / Math.max(1, cnt); for (let j = 0; j < cnt; j++) { const q = arr[Math.min(arr.length - 1, Math.floor((j + (a.off || 0.5)) * st))]; if (!q || used[q]) continue; used[q] = 1; const k = keys[j % keys.length]; const t = __td.build(k, q[0], q[1]); if (t) { const lv = Array.isArray(a.lv) ? a.lv[j % a.lv.length] : (a.lv || 6); for (let l = 1; l < lv; l++) __td.upgrade(t, j % 2); out.push(k + ':' + t.lvl); } else out.push('x' + k); } };
  pick(L, cntL, a.towers.filter(k => !WATER[k])); pick(W, cntW, a.towers.filter(k => WATER[k]));
  return { built: out, L: L.length, W: W.length };
}
