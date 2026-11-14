// ===== tf_alias.js : 시대 적(본보기를 복사한 적)이 본보기의 키 표(능력, 기계, 정령, 도약)를 그대로 쓰게 이어 줌. 전투 논리 파일 뒤에 둔다 =====
(function () {
  for (var k in ENEMIES) {
    var E = ENEMIES[k], t = E.tpl; if (!t || !E.tf) continue;
    if (typeof EN_AB !== 'undefined' && EN_AB[t] && !EN_AB[k]) EN_AB[k] = EN_AB[t];
    if (typeof TW2_MECH !== 'undefined' && TW2_MECH[t]) E.mech = 1;
    if (typeof TW2_SPIRIT !== 'undefined' && TW2_SPIRIT[t]) E.spirit = 1;
    if (typeof TW2_LEAP !== 'undefined' && TW2_LEAP[t]) E.leap = 1;
  }
})();
