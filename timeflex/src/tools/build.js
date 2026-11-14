// index.html 만들기: node tools/build.js
const fs = require('fs'), path = require('path');
// 저장소(Tower-test)에서는 tools가 src 안에 있음: src 위치와 out 위치를 둘 다 지원
const SRC = fs.existsSync(path.join(__dirname, '..', 'src', 'util.js')) ? path.join(__dirname, '..', 'src') : path.join(__dirname, '..');
const OUT = SRC === path.join(__dirname, '..') ? path.join(SRC, '..', 'out') : path.join(__dirname, '..', 'out');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const S = p => fs.readFileSync(path.join(SRC, p), 'utf8');
// '?'로 시작하면 없어도 되는 파일 (v2.0: 갈래별 새 파일을 미리 등록해 둠, 순서 바꾸지 말 것)
const planned = ['util.js', 'data.js', '?data_towers2.js', '?data_enemies2.js', 'tf_data.js', 'tf_eras.js', '?stages_t1.js', '?stages_t2.js', '?stages_t3.js', '?stages_t4.js', '?stages_t5.js', '?stages_t6.js', '?stages_t7.js', '?stages_t8.js', '?stages_t9.js', '?stages_t10.js', '?stages_t11.js', '?stages_t12.js', '?stages_t13.js', '?stages_t14.js', '?stages_t15.js', '?tf_bonus.js',
  'path.js', 'logic.js', '?logic_towers2.js', '?logic_enemies2.js', '?logic_rules.js', '?logic_v22.js', 'bot.js', '?tf_alias.js',
  'art_core.js', 'art_map.js', '?art_map2.js', '?art_map3.js', 'art_tower.js', '?art_tower2.js', '?art_tower3.js', '?art_tower4.js',
  'art_enemy.js', '?art_enemy_ch2.js', '?art_enemy_ch3.js', '?art_enemy_ch4.js', '?tf_art_enemy.js', '?tf_art_enemy2.js', '?tf_art_v3.js', '?tf_art_v3_cfg.js', '?tf_spr.js', '?tf_art_tower.js', '?tf_art_tower2.js', '?tf_art_map.js', 'art_fx.js', '?art_fx2.js', 'render.js', '?render_tw.js', '?render_units.js',
  'audio.js', '?audio2.js', 'ui_art.js', '?ui_art2.js', 'ui.js', 'meta.js', 'gacha.js', '?chapters.js', '?loadout.js', '?admin.js', '?bonus.js', '?ui_v22.js', '?tf_audio.js', '?tf_music.js', '?tf_ui.js',
  'i18n_data.js', 'i18n_v13_ui.js', 'i18n_v13_maps.js', '?i18n_v20.js', 'i18n.js', 'main.js'];
const order = planned.filter(f => f[0] !== '?' || fs.existsSync(path.join(SRC, f.slice(1)))).map(f => f.replace(/^\?/, ''));
// 최상위 이름 겹침 검사 (한 함수 안에 이어 붙이면 뒤의 것이 앞의 것을 덮어씀)
const seen = {}; let dup = 0;
order.forEach(f => { const src = S(f); const re = /^(?:function\s+([A-Za-z_$][\w$]*)|var\s+([A-Za-z_$][\w$]*))/gm; let m; while ((m = re.exec(src))) { const n = m[1] || m[2]; if (seen[n] && seen[n] !== f) { console.error('겹친 이름', n, seen[n], f); dup++; } else if (seen[n] === f && m[1]) { console.error('같은 파일 안 겹친 함수', n, f); dup++; } seen[n] = f; } });
if (dup) { console.error('이름 겹침', dup, '건 → 빌드 중단'); process.exit(1); }
for (const f of order) { try { new (require('vm').Script)(S(f), { filename: f }); } catch (e) { console.error('문법 오류', f, e.message); process.exit(1); } }
let js = '(function(){"use strict";\n' + order.map(f => '// ---- ' + f + ' ----\n' + S(f)).join('\n') + '\n})();';
js = js.replace(/<\/script/gi, '<\\/script');
let html = S('template.html');
const fp = fs.existsSync(path.join(OUT, 'font.css')) ? path.join(OUT, 'font.css') : path.join(SRC, 'font.css');   // 저장소에는 src/font.css(글꼴 잘라 둔 것)
const font = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
html = html.replace('/*FONTS*/', () => font).replace('/*STYLE*/', () => S('style.css') + fs.readdirSync(SRC).filter(f => /^style_.*\.css$/.test(f)).sort().map(f => '\n/* ---- ' + f + ' ---- */\n' + S(f)).join('')).replace('/*SCRIPT*/', () => js);
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('index.html', Math.round(html.length / 1024) + 'KB (글꼴 ' + Math.round(font.length / 1024) + 'KB)');
