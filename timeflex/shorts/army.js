// 적 무리 깔기 + 계속 들어오는 줄. a = {army:[[k,n],...], f0, f1, hpMul, boss, bossF, bossHp, stream:[k..], every, streamHp}
(a) => {
  const g = __td.G(), R = (x, y) => x + Math.random() * (y - x);
  const mk = (k, f, mul) => { const e = __td.fd.spawn(k, (Math.random() * 3) | 0, 0); if (!e) return null; e.hp = e.mhp = e.mhp * (mul || 1); if (f > 0 && e.P && e.P.len) e.d = e.P.len * f; return e; };
  let n = 0;
  (a.army || []).forEach(([k, c]) => { for (let i = 0; i < c; i++) { if (mk(k, R(a.f0 || 0.05, a.f1 || 0.6), a.hpMul)) n++; } });
  if (a.boss) { const e = mk(a.boss, a.bossF || 0.3, a.bossHp || 1); window.__boss = e; }
  if (a.every && a.stream) { let i = 0; window.__streamId = setInterval(() => { const k = a.stream[i++ % a.stream.length]; mk(k, a.streamF || 0, a.streamHp || a.hpMul); }, a.every); }
  return { n, en: g.enemies.length, boss: !!window.__boss };
}
