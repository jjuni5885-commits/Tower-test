// ===== tf_art_v3_cfg.js : v1.3 코드 그림 적 설정 (X3[적 키]) =====
// rig: 'beast'면 네발 짐승(x3Beast), 없으면 사람(x3Man). 색은 탑, 맵과 같은 따뜻한 색 + 굵은 먹갈색 선. 시간 침략자 표시는 가슴의 푸른 금(rune)
(function () {
  var SK = { a: '#e2ad80', b: '#d9a273', c: '#c98f62', d: '#b07a4a', e: '#9a6a42', f: '#7e5434' };
  // ---- 1장 석기 ----
  X3.caveman = { b: 1.22, belly: 1, hs: 1.05, skin: SK.c, hair: { s: 'shag', c: '#3b2a1c' }, beard: '#3b2a1c', face: { mouth: 'teeth' }, top: { t: 'fur', c: '#6e4a2c', bare: SK.a }, bot: { t: 'fur', c: '#5e3e24' }, feet: { t: 'bare' }, wpn: { t: 'club', c: '#8a5a32', hold: 0.5, ang: 0.6 } };
  X3.hunter = { b: 1.0, skin: SK.d, hair: { s: 'long', c: '#2a1d14' }, face: { paint: '#c8352a' }, feather: '#c8352a', band: '#7a4a28', top: { t: 'fur', c: '#a07040' }, bot: { t: 'fur', c: '#8a5a32' }, feet: { t: 'bare' }, neck: '#efe6cf', wpn: { t: 'spear', c: '#8a5a32', m: '#9a9590', L: 1.1, hold: 0.4, ang: 0.15 } };
  X3.cshaman = { b: 0.95, hs: 1.08, skin: SK.c, hat: { t: 'wolf', c: '#7f7a72' }, top: { t: 'fur', c: '#6a5440' }, bot: { t: 'robe', c: '#5a4630' }, feet: { t: 'bare' }, neck: '#efe6cf', face: { paint: '#ffffff' }, wpn: { t: 'staff', c: '#7a5a3a', top: 'skull', feather: '#c8352a', hold: 0.15, ang: 0.05 }, hunch: 1 };
  X3.sabertooth = { rig: 'beast', kind: 'cat', c: '#d79a4a', c2: '#f3dcb0', stripe: '#8a5a2a', sabre: 1, len: 0.8, tall: 0.24, thick: 0.19, head: 0.16, legw: 0.088, wide: 0.22 };
  X3.mammoth = { rig: 'beast', kind: 'mammoth', c: '#7a4a2e', fur: 1, tusk: '#efe2c2', hair: '#5a3420', len: 0.9, tall: 0.23, thick: 0.29, head: 0.19, legw: 0.12, hump: 1, wide: 0.32 };
  X3.rhino = { rig: 'beast', kind: 'rhino', c: '#8c857c', c2: '#b8b0a2', horn: '#efe2c2', fur: 1, len: 0.92, tall: 0.2, thick: 0.24, head: 0.19, legw: 0.1, wide: 0.28, hump: 1 };
  X3.mammothKing = { rig: 'beast', kind: 'mammoth', c: '#6a3a24', fur: 1, tusk: '#f6e9c6', hair: '#4a2414', crown: '#e8b83a', len: 0.95, tall: 0.3, thick: 0.27, head: 0.18, legw: 0.09, hump: 1, wide: 0.32 };
  // ---- 2장 이집트 ----
  X3.eg_spear = { skin: SK.d, hat: { t: 'nemes', c: '#efe2b8', c2: '#3a6ab0' }, top: { c: SK.d }, neck: '#3a8ab0', bot: { t: 'kilt', c: '#f3ead2', c2: '#d7a640' }, feet: { t: 'sandal', c: '#9a6a3a' }, belt: '#d7a640', wpn: { t: 'spear', c: '#8a5a32', m: '#d7a640', L: 1.1, hold: 0.4, ang: 0.15 }, sh: { t: 'round', c: '#8a5a32', c2: '#d7a640' } };
  X3.eg_mummy = { b: 1.0, skin: '#d9ccaa', face: { t: 'wrap' }, top: { t: 'robe', c: '#d9ccaa' }, sleeve: '#d9ccaa', bot: { t: 'pants', c: '#cfc09a' }, legs: '#cfc09a', feet: { t: 'bare', c: '#cfc09a' }, zombie: 1, hunch: 1, gait: 0.7 };
  X3.eg_priest = { skin: SK.d, hair: { s: 'bald' }, top: { t: 'robe', c: '#f3ead2', c2: '#d7a640' }, bot: { t: 'robe', c: '#f3ead2' }, feet: { t: 'sandal', c: '#9a6a3a' }, neck: '#d7a640', cape: '#c8873a', wpn: { t: 'staff', c: '#d7a640', top: 'ankh', m: '#e8b83a', hold: 0.15, ang: 0.05 } };
  X3.eg_pharaoh = { b: 1.25, hs: 1.05, skin: SK.e, hat: { t: 'nemes', c: '#e8b83a', c2: '#2f5fae', cobra: 1 }, beard: '#2a2018', face: { glow: '#ffd84a' }, top: { t: 'armor', c: '#d7a640', c2: '#2f5fae' }, sleeve: SK.e, bot: { t: 'kilt', c: '#f6eed8', c2: '#e8b83a' }, feet: { t: 'sandal', c: '#d7a640' }, cape: '#2f5fae', neck: '#3a8ab0', wpn: { t: 'khopesh', c: '#d7a640', m: '#e8c86a' } };
  // ---- 3장 로마 ----
  X3.ro_legion = { b: 1.08, skin: SK.b, hat: { t: 'galea', c: '#b8bec6', crest: '#c8352a' }, top: { t: 'lorica', c: '#b8bec6', c2: '#d7a640' }, sleeve: '#b8352a', bot: { t: 'kilt', c: '#b8352a', c2: '#d7a640' }, feet: { t: 'sandal', c: '#7a4a28' }, wpn: { t: 'gladius', c: '#7a4a28' }, sh: { t: 'scutum', c: '#a8302a', c2: '#e8b83a' } };
  X3.ro_spy = { b: 0.9, skin: SK.b, hat: { t: 'hood', c: '#4a4a56' }, face: { glow: '#ff6a4a' }, top: { t: 'robe', c: '#5a5a66' }, bot: { t: 'robe', c: '#4a4a56' }, feet: { t: 'boot', c: '#2a2a30' }, wpn: { t: 'dagger', c: '#3a2a20' }, hunch: 1 };
  X3.ro_medic = { skin: SK.b, hair: { s: 'short', c: '#5a3a24' }, top: { t: 'tunic', c: '#eee6d0', c2: '#c8352a' }, sleeve: '#eee6d0', bot: { t: 'kilt', c: '#eee6d0', c2: '#c8352a' }, feet: { t: 'sandal', c: '#7a4a28' }, pack: '#8a5a32', belt: '#7a4a28', wpn: { t: 'staff', c: '#8a5a32', orb: '#7dff9a', hold: 0.15, ang: 0.05 } };
  X3.ro_glad = { b: 1.2, belly: 1, skin: SK.c, hat: { t: 'visor', c: '#b8bec6', v: '#3a3f45' }, top: { c: SK.c, strap: '#7a4a28' }, sleeve: SK.c, bot: { t: 'loin', c: '#d7a640' }, feet: { t: 'sandal', c: '#7a4a28' }, belt: '#7a4a28', wpn: { t: 'trident', c: '#7a4a28', m: '#c9ccd2', L: 1.05, hold: 0.4, ang: 0.15 }, sh: { t: 'buckler', c: '#b8bec6', c2: '#d7a640' } };
  X3.ro_horse = { rig: 'beast', kind: 'horse', c: '#7a5236', c2: '#a8805a', mc: '#2a1d14', saddle: '#a8302a', len: 0.9, tall: 0.33, thick: 0.17, head: 0.12, legw: 0.06, wide: 0.2, rider: { skin: SK.b, hat: { t: 'galea', c: '#b8bec6', crest: '#c8352a' }, top: { t: 'lorica', c: '#b8bec6' }, sleeve: '#b8352a', wpn: { t: 'spear', c: '#8a5a32', L: 1.0 } } };
  X3.ro_eleph = { rig: 'beast', kind: 'elephant', c: '#8c8a90', tusk: '#efe2c2', saddle: '#a8302a', len: 1.0, tall: 0.32, thick: 0.27, head: 0.18, legw: 0.095, wide: 0.32 };
  X3.ro_tyrant = { rig: 'beast', kind: 'horse', c: '#3a3a42', c2: '#5a5a62', mc: '#1a1a1e', saddle: '#6a2a8a', len: 0.95, tall: 0.34, thick: 0.18, head: 0.13, legw: 0.065, wide: 0.22, rider: { b: 1.2, skin: SK.b, hat: { t: 'crown', c: '#e8b83a' }, face: { glow: '#ffd84a' }, top: { t: 'armor', c: '#d7a640', c2: '#6a2a8a' }, sleeve: '#d7a640', cape: '#6a2a8a', wpn: { t: 'sword', c: '#6a2a8a', m: '#e8c86a' } } };
})();

// ---- 2~15장 (사람, 네발 짐승. 탈것, 배, 하늘, 유령은 옛 그림 그대로) ----
(function () {
  var SK = { a: '#e2ad80', b: '#d9a273', c: '#c98f62', d: '#b07a4a', e: '#9a6a42' };
  X3.eg_sphinx = { rig: 'beast', kind: 'cat', c: '#d9b26a', c2: '#f0deb0', mane: '#2f5fae', len: 0.85, tall: 0.24, thick: 0.21, head: 0.17, legw: 0.09, wide: 0.24 };
  // 4장 삼국
  X3.tk_spear = { skin: SK.b, hat: { t: 'bandana', c: '#c8352a' }, top: { t: 'armor', c: '#8a5a32', c2: '#c8352a' }, sleeve: '#c8352a', bot: { t: 'pants', c: '#4a3a2e' }, feet: { t: 'boot', c: '#2a2018' }, wpn: { t: 'spear', c: '#7a4a28', m: '#c9ccd2', L: 1.15, hold: 0.4, ang: 0.15, flag: '#c8352a' } };
  X3.tk_ninja = { b: 0.92, skin: SK.b, hat: { t: 'hood', c: '#2a2a34' }, face: { glow: '#ff5a4a' }, top: { t: 'tunic', c: '#3a3a46' }, sleeve: '#3a3a46', bot: { t: 'pants', c: '#2a2a34' }, feet: { t: 'boot', c: '#1a1a20' }, belt: '#c8352a', wpn: { t: 'katana', c: '#2a2a34' }, lean: 0.15 };
  X3.tk_drum = { b: 1.15, belly: 1, skin: SK.c, hat: { t: 'bandana', c: '#e8b83a' }, top: { t: 'vest', c: '#c8352a', c3: SK.c }, sleeve: SK.c, bot: { t: 'pants', c: '#4a3a2e' }, feet: { t: 'boot', c: '#2a2018' }, wpn: { t: 'drum', c: '#b8432f', hold: 0.9, ang: 0 } };
  X3.tk_shield = { b: 1.15, skin: SK.b, hat: { t: 'kettle', c: '#6a6e76' }, top: { t: 'armor', c: '#6a6e76', c2: '#c8352a' }, sleeve: '#8a5a32', bot: { t: 'kilt', c: '#8a5a32' }, feet: { t: 'boot', c: '#2a2018' }, wpn: { t: 'sword', c: '#3a2a20' }, sh: { t: 'round', c: '#c8352a', c2: '#e8b83a' } };
  X3.tk_cav = { rig: 'beast', kind: 'horse', c: '#a86a3a', c2: '#d0a070', mc: '#2a1d14', saddle: '#c8352a', len: 0.9, tall: 0.33, thick: 0.17, head: 0.12, legw: 0.06, wide: 0.2, rider: { skin: SK.b, hat: { t: 'bandana', c: '#c8352a' }, top: { t: 'armor', c: '#8a5a32', c2: '#c8352a' }, sleeve: '#c8352a', wpn: { t: 'halberd', c: '#7a4a28', L: 1.0 } } };
  X3.tk_general = { b: 1.35, hs: 1.0, skin: SK.c, hat: { t: 'kettle', c: '#3a3a42', c2: '#e8b83a' }, beard: '#1a1410', face: { glow: '#ff5a4a' }, top: { t: 'armor', c: '#4a4a54', c2: '#e8b83a' }, sleeve: '#4a4a54', bot: { t: 'kilt', c: '#a8302a', c2: '#e8b83a' }, feet: { t: 'boot', c: '#1a1a20' }, cape: '#a8302a', belt: '#e8b83a', wpn: { t: 'halberd', c: '#5a3a24', m: '#d7dbe0', L: 1.3, hold: 0.4, ang: 0.15 } };
  // 5장 바이킹
  X3.nr_raider = { b: 1.15, skin: SK.a, hat: { t: 'horn', c: '#8a9098', c2: '#d7a640' }, beard: '#c8783a', top: { t: 'fur', c: '#6a5a4a' }, sleeve: '#7a5a3a', bot: { t: 'pants', c: '#4a3a2e' }, feet: { t: 'boot', c: '#3a2a1e' }, belt: '#5a3a24', wpn: { t: 'axe', c: '#7a4a28' }, sh: { t: 'round', c: '#2f5fae', c2: '#d7dbe0' } };
  X3.nr_pelt = { b: 1.2, belly: 1, skin: SK.a, hat: { t: 'wolf', c: '#7f7a72' }, beard: '#8a5a32', face: { mouth: 'teeth', glow: '#ff5a4a' }, top: { t: 'fur', c: '#7f7a72', bare: SK.a }, bot: { t: 'fur', c: '#6a5a4a' }, feet: { t: 'boot', c: '#3a2a1e' }, wpn: { t: 'axe', c: '#7a4a28' }, lean: 0.14 };
  X3.nr_shield = { b: 1.15, skin: SK.a, hat: { t: 'kettle', c: '#8a9098' }, beard: '#d8b060', top: { t: 'mail', c: '#8a9098' }, sleeve: '#6a5a4a', bot: { t: 'pants', c: '#4a3a2e' }, feet: { t: 'boot', c: '#3a2a1e' }, wpn: { t: 'spear', c: '#7a4a28', L: 1.1, hold: 0.4, ang: 0.15 }, sh: { t: 'round', c: '#c8352a', c2: '#e8e0cc' } };
  X3.nr_horn = { b: 1.0, skin: SK.a, hat: { t: 'horn', c: '#8a9098' }, beard: '#e8e0cc', top: { t: 'robe', c: '#3a5a7a' }, bot: { t: 'robe', c: '#3a5a7a' }, feet: { t: 'boot', c: '#3a2a1e' }, neck: '#d7a640', wpn: { t: 'staff', c: '#7a5a3a', orb: '#9fe8ff', hold: 0.15, ang: 0.05 } };
  X3.nr_troll = { b: 1.45, belly: 1, hs: 0.9, skin: '#7f9a6a', hair: { s: 'shag', c: '#3a4a2a' }, face: { mouth: 'teeth', tusk: 1 }, top: { t: 'fur', c: '#5a4a3a', bare: '#7f9a6a' }, bot: { t: 'fur', c: '#4a3a2a' }, feet: { t: 'bare' }, wpn: { t: 'club', c: '#6a4a2a', L: 1.2, hold: 0.5, ang: 0.6 }, hunch: 1, gait: 0.8 };
  X3.nr_wolf = { rig: 'beast', kind: 'dog', c: '#8e8a86', c2: '#d8d2c8', len: 0.8, tall: 0.26, thick: 0.17, head: 0.14, legw: 0.07, wide: 0.2, fur: 1 };
  X3.nr_giant = { b: 1.4, hs: 1.0, skin: '#a8c8e0', hat: { t: 'crown', c: '#bfe8ff' }, beard: '#eef6fb', face: { glow: '#7fe6ff' }, top: { t: 'armor', c: '#4a6a8a', c2: '#bfe8ff' }, sleeve: '#a8c8e0', bot: { t: 'fur', c: '#d8d2c8' }, feet: { t: 'boot', c: '#3a4a5a' }, cape: '#d8d2c8', belt: '#bfe8ff', wpn: { t: 'axe', c: '#5a4a3a', m: '#bfe8ff', L: 1.2 }, gait: 0.85 };
  // 6장 중세
  X3.ca_foot = { skin: SK.b, hat: { t: 'kettle', c: '#8a9098' }, top: { t: 'tunic', c: '#2f5fae', c2: '#e8b83a' }, sleeve: '#8a9098', bot: { t: 'pants', c: '#5a4a3a' }, feet: { t: 'boot', c: '#3a2a1e' }, belt: '#5a3a24', wpn: { t: 'pike', c: '#7a4a28', L: 1.25, hold: 0.4, ang: 0.15 }, sh: { t: 'kite', c: '#2f5fae', c2: '#e8b83a' } };
  X3.ca_thief = { b: 0.92, skin: SK.b, hat: { t: 'hood', c: '#3f6a3a' }, face: { glow: '#ffd84a' }, top: { t: 'tunic', c: '#4a7a44' }, sleeve: '#4a7a44', bot: { t: 'pants', c: '#4a3a2e' }, feet: { t: 'boot', c: '#3a2a1e' }, belt: '#7a4a28', wpn: { t: 'dagger', c: '#3a2a20' }, lean: 0.14, pack: '#8a5a32' };
  X3.ca_monk = { skin: SK.b, hat: { t: 'hood', c: '#6a4a32' }, top: { t: 'robe', c: '#7a5a3a' }, bot: { t: 'robe', c: '#7a5a3a' }, feet: { t: 'sandal', c: '#5a3a24' }, belt: '#d8c79a', neck: '#d7a640', wpn: { t: 'torch', c: '#6a4a2a', hold: 0.6, ang: 0.2 } };
  X3.ca_knight = { b: 1.18, skin: SK.b, hat: { t: 'visor', c: '#b8bec6', v: '#3a3f45' }, top: { t: 'armor', c: '#b8bec6', c2: '#c8352a' }, sleeve: '#b8bec6', bot: { t: 'pants', c: '#9aa0a8' }, legs: '#9aa0a8', feet: { t: 'boot', c: '#7a8088' }, cape: '#c8352a', wpn: { t: 'sword', c: '#5a3a24' }, sh: { t: 'kite', c: '#c8352a', c2: '#e8b83a' } };
  X3.ca_rider = { rig: 'beast', kind: 'horse', c: '#d8d2c8', c2: '#eeeae2', mc: '#8a8478', saddle: '#2f5fae', len: 0.92, tall: 0.33, thick: 0.18, head: 0.12, legw: 0.062, wide: 0.21, rider: { skin: SK.b, hat: { t: 'visor', c: '#b8bec6', v: '#3a3f45' }, top: { t: 'armor', c: '#b8bec6', c2: '#2f5fae' }, sleeve: '#b8bec6', wpn: { t: 'spear', c: '#7a4a28', L: 1.1, flag: '#2f5fae' } } };
  X3.ca_giant = { b: 1.45, hs: 0.95, skin: '#b8bec6', hat: { t: 'visor', c: '#c8d8e6', v: '#2a3a4a' }, face: { glow: '#7fe6ff' }, top: { t: 'armor', c: '#c8d8e6', c2: '#7fe6ff' }, sleeve: '#c8d8e6', bot: { t: 'pants', c: '#a8b8c6' }, legs: '#a8b8c6', feet: { t: 'boot', c: '#8898a6' }, cape: '#2f5fae', wpn: { t: 'sword', c: '#3a4a5a', m: '#bfe8ff', L: 1.3 }, gait: 0.8 };
  // 7장 해적
  X3.sa_pirate = { skin: SK.c, hat: { t: 'bandana', c: '#c8352a' }, beard: '#3a2a1e', top: { t: 'vest', c: '#3a3a46', c3: '#efe6d6' }, sleeve: '#efe6d6', bot: { t: 'pants', c: '#2f5fae' }, feet: { t: 'boot', c: '#2a1d14' }, belt: '#7a4a28', wpn: { t: 'cutlass', c: '#3a2a20' } };
  X3.sa_runner = { b: 0.9, skin: SK.d, hat: { t: 'bandana', c: '#e8b83a' }, top: { t: 'vest', c: '#7a4a28', c3: '#efe6d6' }, sleeve: SK.d, bot: { t: 'pants', c: '#5a6a7a' }, feet: { t: 'bare' }, belt: '#c8352a', wpn: { t: 'dagger', c: '#3a2a20' }, lean: 0.14 };
  X3.sa_ghost = { skin: '#cfe8e0', face: { t: 'skull' }, hat: { t: 'tricorn', c: '#2a2a34' }, top: { t: 'coat', c: '#3a5a5a', c2: '#d7a640' }, sleeve: '#3a5a5a', bot: { t: 'pants', c: '#2a3a3a' }, feet: { t: 'boot', c: '#1a2a2a' }, wpn: { t: 'cutlass', c: '#3a2a20', m: '#9fe8d8' } };
  X3.sa_cook = { b: 1.25, belly: 1, skin: SK.a, hat: { t: 'turban', c: '#f3eee4' }, beard: '#5a3a24', top: { t: 'vest', c: '#efe6d6', c3: '#efe6d6' }, sleeve: SK.a, bot: { t: 'pants', c: '#5a4a3a' }, feet: { t: 'boot', c: '#2a1d14' }, belt: '#c8352a', wpn: { t: 'axe', c: '#5a3a24', m: '#d7dbe0' } };
  X3.sa_brute = { b: 1.4, belly: 1, hs: 0.95, skin: SK.e, hair: { s: 'bald' }, beard: '#2a1d14', face: { mouth: 'teeth' }, top: { c: SK.e, strap: '#7a4a28' }, sleeve: SK.e, bot: { t: 'pants', c: '#3a3a46' }, feet: { t: 'boot', c: '#2a1d14' }, belt: '#7a4a28', wpn: { t: 'club', c: '#5a5a62', L: 1.15, hold: 0.5, ang: 0.6 }, gait: 0.85 };
  // 8장 조선 요괴
  X3.jo_raider = { b: 1.15, skin: '#c8503a', hair: { s: 'shag', c: '#2a1d14' }, face: { mouth: 'teeth', tusk: 1, glow: '#ffd84a' }, feather: null, top: { t: 'fur', c: '#e8b83a', bare: '#c8503a' }, bot: { t: 'fur', c: '#3a6ab0' }, feet: { t: 'bare' }, wpn: { t: 'club', c: '#6a4a2a', hold: 0.5, ang: 0.6 } };
  X3.jo_fox = { rig: 'beast', kind: 'dog', c: '#e8873a', c2: '#fbeee0', len: 0.78, tall: 0.24, thick: 0.16, head: 0.14, legw: 0.065, wide: 0.19 };
  X3.jo_tiger = { rig: 'beast', kind: 'tiger', c: '#e8963a', c2: '#fbeee0', stripe: '#2a1d14', len: 0.78, tall: 0.24, thick: 0.2, head: 0.17, legw: 0.092, wide: 0.24 };
  // 9~15장 군인(시대별 옷)
  X3.tr_rifle = { skin: SK.b, hat: { t: 'brodie', c: '#7a7a5a' }, top: { t: 'uniform', c: '#8a7a54' }, sleeve: '#8a7a54', bot: { t: 'pants', c: '#7a6a48' }, feet: { t: 'boot', c: '#4a3a2a' }, belt: '#5a4a2a', pack: '#6a5a3a', wpn: { t: 'rifle', c: '#6a4a2a', hold: 0.55, ang: 0.95 } };
  X3.tr_gas = { skin: SK.b, hat: { t: 'visor', c: '#6a6a52', v: '#9ab8a8' }, top: { t: 'uniform', c: '#7a7a5a' }, sleeve: '#7a7a5a', bot: { t: 'pants', c: '#6a6a4a' }, feet: { t: 'boot', c: '#4a3a2a' }, belt: '#5a4a2a', pack: '#5a5a42', wpn: { t: 'rifle', c: '#6a4a2a', hold: 0.55, ang: 0.95 } };
  X3.tr_horse = { rig: 'beast', kind: 'horse', c: '#6a4a34', c2: '#9a7a5a', mc: '#2a1d14', saddle: '#6a5a3a', len: 0.9, tall: 0.33, thick: 0.17, head: 0.12, legw: 0.06, wide: 0.2, rider: { skin: SK.b, hat: { t: 'brodie', c: '#7a7a5a' }, top: { t: 'uniform', c: '#8a7a54' }, wpn: { t: 'sword', c: '#3a2a20' } } };
  X3.st_rifle = { skin: SK.b, hat: { t: 'stahl', c: '#6a7266' }, top: { t: 'uniform', c: '#6a7a6a' }, sleeve: '#6a7a6a', bot: { t: 'pants', c: '#5a6a5a' }, feet: { t: 'boot', c: '#2a2a24' }, belt: '#3a3a2a', pack: '#5a5a4a', wpn: { t: 'rifle', c: '#5a3a24', hold: 0.55, ang: 0.95 } };
  X3.st_sniper = { b: 0.95, skin: SK.b, hat: { t: 'cap', c: '#5a6a4a' }, top: { t: 'uniform', c: '#5a6a4a', strap: '#3a3a2a' }, sleeve: '#5a6a4a', bot: { t: 'pants', c: '#4a5a3a' }, feet: { t: 'boot', c: '#2a2a24' }, wpn: { t: 'musket', c: '#5a3a24', hold: 0.55, ang: 0.95 } };
  X3.wi_rifle = { skin: SK.b, hat: { t: 'stahl', c: '#5a6a4a', net: 1 }, top: { t: 'uniform', c: '#5a6a4a' }, sleeve: '#5a6a4a', bot: { t: 'pants', c: '#4a5a3a' }, feet: { t: 'boot', c: '#2a2a24' }, belt: '#3a3a2a', pack: '#4a5a3a', wpn: { t: 'rifle', c: '#3a3a3a', hold: 0.55, ang: 0.95 } };
  X3.wi_ghost = { b: 0.95, skin: SK.b, hat: { t: 'hood', c: '#d8dde2' }, face: { glow: '#7fe6ff' }, top: { t: 'coat', c: '#e8ecef' }, sleeve: '#e8ecef', bot: { t: 'pants', c: '#c8ced4' }, feet: { t: 'boot', c: '#5a6068' }, wpn: { t: 'rifle', c: '#3a3a3a', hold: 0.55, ang: 0.95 } };
  X3.ju_rifle = { skin: SK.d, hat: { t: 'cap', c: '#4a6a3a' }, top: { t: 'uniform', c: '#4a6a3a', strap: '#2a3a24' }, sleeve: '#4a6a3a', bot: { t: 'pants', c: '#3a5a2a' }, feet: { t: 'boot', c: '#2a2a1e' }, wpn: { t: 'smg', c: '#2a2a2a', hold: 0.55, ang: 0.95 } };
  X3.ju_tunnel = { b: 0.92, skin: SK.d, hat: { t: 'bandana', c: '#3a3a2a' }, top: { t: 'vest', c: '#3a3a2a', c3: '#5a5a42' }, sleeve: SK.d, bot: { t: 'pants', c: '#2a2a20' }, feet: { t: 'bare' }, wpn: { t: 'dagger', c: '#2a2a20' }, lean: 0.16, hunch: 1 };
  X3.du_rifle = { skin: SK.c, hat: { t: 'stahl', c: '#c8a874' }, top: { t: 'uniform', c: '#c8a874', strap: '#7a6a4a' }, sleeve: '#c8a874', bot: { t: 'pants', c: '#b8986a' }, feet: { t: 'boot', c: '#6a5a3a' }, pack: '#a88a5a', face: {}, wpn: { t: 'rifle', c: '#2a2a2a', hold: 0.55, ang: 0.95 } };
  X3.cy_cloak = { b: 0.95, skin: SK.b, hat: { t: 'visor', c: '#2a2a3a', v: '#ff3ad0' }, top: { t: 'coat', c: '#2a2a3a', c2: '#ff3ad0' }, sleeve: '#2a2a3a', bot: { t: 'pants', c: '#1a1a2a' }, feet: { t: 'boot', c: '#3a3a4a' }, wpn: { t: 'blaster', c: '#3a3a4a', hold: 0.55, ang: 0.95 } };
  X3.sp_grunt = { b: 1.05, hs: 1.12, skin: '#7fd06a', hat: { t: 'visor', c: '#5a4a8a', v: '#7dff9a' }, top: { t: 'armor', c: '#5a4a8a', c2: '#7dff9a' }, sleeve: '#5a4a8a', bot: { t: 'pants', c: '#3a2a6a' }, feet: { t: 'boot', c: '#2a1a4a' }, wpn: { t: 'blaster', c: '#3a2a5a', hold: 0.55, ang: 0.95 } };
  X3.sp_hopper = Object.assign({}, X3.sp_grunt, { b: 0.9, hat: { t: 'visor', c: '#2f8a6a', v: '#ffd84a' }, top: { t: 'armor', c: '#2f8a6a', c2: '#ffd84a' }, sleeve: '#2f8a6a', bot: { t: 'pants', c: '#1f5a4a' }, lean: 0.15 });
  X3.sp_cloak = Object.assign({}, X3.sp_grunt, { hat: { t: 'hood', c: '#3a2a5a' }, face: { glow: '#ff3ad0' }, top: { t: 'robe', c: '#3a2a5a' }, bot: { t: 'robe', c: '#3a2a5a' }, wpn: { t: 'dagger', c: '#2a1a4a', m: '#ff3ad0' } });
})();
// ---- v1.3 2차: 탈것, 배, 하늘, 유령, 특수 괴물 ----
(function () {
  function B(o) { return Object.assign({ rig: 'fly', kind: 'bird' }, o); }
  X3.ptero = B({ c: '#8a6a4a', hc: '#8a6a4a', bk: '#d8b070', crest: '#c8352a', beak: 0.72, wing: 0.95, len: 0.95 });
  X3.eg_vulture = B({ c: '#5a4a3a', hc: '#e0b8a0', bk: '#e8d0a0' });
  X3.ro_eagle = B({ c: '#6a4a2a', hc: '#f3eee4', bk: '#e8b83a' });
  X3.sa_parrot = B({ c: '#2fae6a', hc: '#e8433a', bk: '#3a3a3a', len: 0.7 });
  X3.jo_crow = B({ c: '#2a2a34', bk: '#3a3a3a', len: 0.7 });
  X3.nr_raven = B({ c: '#1a1a24', bk: '#3a3a3a', crest: '#3a3a4a' });
  X3.ca_gargoyle = B({ c: '#8a8a90', hc: '#8a8a90', bk: '#6a6a70', crest: '#6a6a70', wing: 1.0 });
  X3.tk_kite = { rig: 'fly', kind: 'kite', c: '#f3eee4', c2: '#c8352a' };
  X3.nr_wisp = { rig: 'ghost', t: 'wisp', c: '#bfe8ff', glow: '#7fe6ff' };
  X3.eg_ghost = { rig: 'ghost', t: 'sheet', c: '#f0ead8', glow: '#ffd84a', hat: { t: 'nemes', c: '#efe2b8', c2: '#3a6ab0' } };
  X3.jo_egg = { rig: 'ghost', t: 'egg', c: '#f6f2ea' };
  X3.jo_tal = { rig: 'ghost', t: 'tal', c: '#e8e0d0', glow: '#ff9a7a' };
  // 배
  function S(o) { return Object.assign({ rig: 'boat' }, o); }
  X3.raft = S({ kind: 'raft', c: '#a07a4a', sail: '#d8c79a', mast: 0.55 });
  X3.eg_boat = S({ kind: 'ship', c: '#c8a060', sail: '#f3eee4', mark: '#3a6ab0' });
  X3.ro_galley = S({ kind: 'galley', c: '#8a5a32', sail: '#c8352a', flag: '#e8b83a' });
  X3.tk_junk = S({ kind: 'junk', c: '#6a3a24', sail: '#c8a060' });
  X3.nr_ship = S({ kind: 'longship', c: '#7a5a3a', sail: '#c8352a', mark: '#efe6d0' });
  X3.ca_boat = S({ kind: 'ship', c: '#7a5a3a', sail: '#2f5fae', flag: '#e8b83a' });
  X3.jo_ship = S({ kind: 'junk', c: '#4a3a2a', sail: '#e8e0cc' });
  X3.sa_ship = S({ kind: 'ship', c: '#5a3a24', sail: '#2a2a2a', mark: 'skull', flag: '#2a2a2a', len: 1.1, mast: 0.85 });
  X3.sa_ghostship = S({ kind: 'ship', c: '#3a5a5a', sail: '#9fe8d8', mark: 'skull', mast: 0.85 });
  X3.sa_shark = S({ kind: 'shark' });
  X3.tr_boat = S({ kind: 'gunboat', c: '#6a7a6a' }); X3.st_landing = S({ kind: 'gunboat', c: '#6a7a5a', len: 0.9 }); X3.wi_boat = S({ kind: 'gunboat', c: '#5a6a7a' });
  X3.ju_boat = S({ kind: 'gunboat', c: '#4a6a3a', len: 0.85 }); X3.du_boat = S({ kind: 'gunboat', c: '#b8986a' }); X3.cy_boat = S({ kind: 'gunboat', c: '#2a2a3a', c2: '#ff3ad0' });
  X3.st_sub = S({ kind: 'sub', c: '#4a5a6a' });
  X3.ju_gunship = S({ kind: 'carrier', c: '#5a6a5a', len: 1.3, ht: 0.24 });
  X3.sa_kraken = { rig: 'serp', c: '#8a3a3a', c2: '#e8b0a0', tent: '#8a3a3a' };
  X3.jo_imugi = { rig: 'serp', c: '#2f6a5a', c2: '#d8e8b0', horn: '#efe2c2', whisk: '#efe2c2' };
  // 땅 탈것
  function V(o) { return Object.assign({ rig: 'veh' }, o); }
  X3.ca_ram = V({ kind: 'cart', ram: 1, c: '#8a6a4a', c2: '#6a4a2a', len: 1.0, ht: 0.36 });
  X3.sa_cart = V({ kind: 'cart', c: '#8a6a4a', cargo: '#6a4a2a', len: 0.9 });
  X3.tk_tower = V({ kind: 'tower', c: '#8a6a4a', c2: '#c8352a', len: 0.7 }); X3.ca_tower = V({ kind: 'tower', c: '#7a6a5a', c2: '#2f5fae', len: 0.7 });
  X3.tr_tractor = V({ kind: 'truck', c: '#8a7a54', cargo: '#6a5a3a', stack: 1 }); X3.tr_medic = V({ kind: 'truck', c: '#8a8a6a', cargo: '#e8e0cc', cross: 1 });
  X3.st_supply = V({ kind: 'truck', c: '#6a7a6a', cargo: '#5a6a5a' }); X3.wi_truck = V({ kind: 'truck', c: '#5a6a4a', cargo: '#4a5a3a' }); X3.ju_truck = V({ kind: 'truck', c: '#4a6a3a', cargo: '#6a5a3a', camo: '#3a4a2a' });
  X3.du_truck = V({ kind: 'truck', c: '#c8a874', cargo: '#a88a5a' }); X3.cy_fixer = V({ kind: 'truck', c: '#2a2a3a', cargo: '#3a3a4a', c2: '#ff3ad0' });
  X3.st_tank = V({ kind: 'tank', c: '#6a7266', turret: 1, gunL: 0.55 }); X3.wi_tank = V({ kind: 'tank', c: '#5a6a4a', turret: 1, gunL: 0.6, camo: '#4a5a3a' });
  X3.du_tank = V({ kind: 'tank', c: '#c8a874', turret: 1, gunL: 0.6, camo: '#a88a5a' }); X3.cy_tank = V({ kind: 'tank', c: '#2a2a3a', c2: '#ff3ad0', turret: 1, gunL: 0.6 });
  X3.tr_mk1 = V({ kind: 'tank', c: '#6a6a4a', ht: 0.4, turret2: 1, stack: 1 }); X3.st_ht = V({ kind: 'apc', c: '#6a7266', gun: 1 }); X3.wi_apc = V({ kind: 'apc', c: '#5a6a4a', gun: 1, wheels: 3 }); X3.ju_apc = V({ kind: 'apc', c: '#4a6a3a', gun: 1, camo: '#3a4a2a', track: 1 });
  X3.st_jeep = V({ kind: 'jeep', c: '#6a7a5a', gun: 1 }); X3.du_jeep = V({ kind: 'jeep', c: '#c8a874', gun: 1 });
  X3.tr_landship = V({ kind: 'big', c: '#5a6a4a', len: 1.15, ht: 0.42, turret2: 1, stack: 1, wide: 0.4 });
  X3.st_super = V({ kind: 'big', c: '#5a5a52', len: 1.15, ht: 0.38, turret: 1, gunL: 0.7, tw: 0.32, wide: 0.42 });
  X3.du_king = V({ kind: 'big', c: '#b8986a', len: 1.15, ht: 0.38, turret: 1, gunL: 0.75, tw: 0.32, camo: '#9a7a4a', wide: 0.42 });
  var biker = function (c, hat) { return { skin: '#d9a273', hat: hat, top: { t: 'coat', c: c }, sleeve: c, wpn: { t: 'smg', c: '#2a2a2a' } }; };
  X3.wi_bike = V({ kind: 'bike', c: '#5a6a4a', rider: biker('#5a6a4a', { t: 'stahl', c: '#5a6a4a' }) }); X3.ju_bike = V({ kind: 'bike', c: '#4a6a3a', rider: biker('#4a6a3a', { t: 'bandana', c: '#3a3a2a' }) }); X3.cy_bike = V({ kind: 'bike', c: '#2a2a3a', rider: biker('#2a2a3a', { t: 'visor', c: '#2a2a3a', v: '#ff3ad0' }) });
  // 하늘 탈것
  X3.tr_plane = { rig: 'fly', kind: 'plane', c: '#8a7a54', len: 0.85 }; X3.st_fighter = { rig: 'fly', kind: 'plane', c: '#5a6a7a', len: 0.85 };
  X3.tr_zep = { rig: 'fly', kind: 'zep', c: '#b8b0a2', len: 1.1 }; X3.st_bomber = { rig: 'fly', kind: 'bomber', c: '#6a7266', len: 1.05 };
  X3.wi_fortress = { rig: 'fly', kind: 'bomber', c: '#5a6a7a', len: 1.0, jet: 1, sc: 1.0 };
  X3.wi_heli = { rig: 'fly', kind: 'heli', c: '#5a6a4a' }; X3.ju_heli = { rig: 'fly', kind: 'heli', c: '#4a6a3a' };
  X3.du_drone = { rig: 'fly', kind: 'drone', c: '#c8a874', len: 0.6 }; X3.cy_drone = { rig: 'fly', kind: 'drone', c: '#2a2a3a', eye: '#ff3ad0', len: 0.6 }; X3.cy_swarm = { rig: 'fly', kind: 'drone', c: '#3a3a4a', eye: '#ff3ad0', len: 0.5 };
  X3.du_missile = { rig: 'fly', kind: 'missile', c: '#d8d8d0' }; X3.cy_missile = { rig: 'fly', kind: 'missile', c: '#3a3a4a', tip: '#ff3ad0' };
  X3.sp_saucer = { rig: 'fly', kind: 'saucer', c: '#8a8aa0', pilot: 1, len: 0.8 }; X3.sp_ray = { rig: 'fly', kind: 'saucer', c: '#5a4a8a', beam: 1, len: 0.8 }; X3.sp_cruiser = { rig: 'fly', kind: 'saucer', c: '#4a3a6a', pilot: 1, len: 1.0 };
  X3.sp_mother = { rig: 'fly', kind: 'saucer', c: '#3a2a5a', dome: '#9dff8a', beam: 1, len: 0.95, sc: 0.9 };
  // 특수 괴물
  X3.eg_scorp = { rig: 'bug', c: '#c8903a', len: 0.8 };
  X3.sp_crusher = { rig: 'bug', c: '#5a4a8a', len: 0.9 }; X3.sp_walker = { rig: 'bug', c: '#3a2a6a', len: 1.0 };
  X3.sp_blob = { rig: 'blob', c: '#9dff8a' };
  X3.jo_bulga = { rig: 'beast', kind: 'bull', c: '#6a6a72', c2: '#9a9aa2', horns: '#c8c8d0', len: 0.9, tall: 0.24, thick: 0.24, head: 0.17, legw: 0.1, wide: 0.28, fur: 1 };
  X3.ju_croc = { rig: 'beast', kind: 'rhino', c: '#4a6a3a', c2: '#a8b880', len: 1.0, tall: 0.12, thick: 0.14, head: 0.15, legw: 0.08, wide: 0.24, tail: true, tfr: false };
  var robot = function (c, v, b) { return { b: b || 1.3, hs: 0.95, skin: '#9aa0a8', hat: { t: 'visor', c: c, v: v }, face: { glow: v }, top: { t: 'armor', c: c, c2: v }, sleeve: c, bot: { t: 'pants', c: x3c(c, -0.15) }, legs: x3c(c, -0.15), feet: { t: 'boot', c: x3c(c, -0.3) }, wpn: { t: 'blaster', c: '#3a3a3a', hold: 0.55, ang: 0.95 }, gait: 0.8 }; };
  X3.du_mech = robot('#b8986a', '#ffb43c'); X3.cy_mech = robot('#3a3a4a', '#ff3ad0'); X3.cy_titan = robot('#2a2a3a', '#ff3ad0', 1.5);
})();
