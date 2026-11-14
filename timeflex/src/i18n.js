// ===== i18n.js : 언어 설정과 번역 층 =====
// 기존 코드는 한국어를 그대로 쓰고, 화면에 나가는 순간 바꿈(사전은 i18n_data.js, 한국어 원문이 열쇠)
// (1) DOM 글자 노드와 placeholder, title, aria-label: MutationObserver
// (2) 캔버스 fillText, strokeText, measureText: 한글이 든 글자만
// (3) 코드에서 직접: T('웨이브 {0} / {1}', 3, 12)  (4) document.title, CSS content('새' 딱지)
// 한국어(ko)면 아무것도 감싸지 않음. 언어 고르기 창(i18nPicker)과 설정 줄(i18nRow)은 모든 언어에서 씀
// 언어 정하기: 주소 ?lang=xx → 저장(SAVE.set.lang, 없으면 localStorage 'lastarrow.lang') → 자동 시험 브라우저는 ko → navigator.languages → en
// 개발: window.__i18nMissing(번역 없는 한글), __i18n.audit('fr')(데이터 전체 점검), python3 tools/i18ncheck.py
var I18N_LANGS = [['ko', '한국어', 'ko'], ['en', 'English', 'en'], ['zh', '简体中文', 'zh-CN'], ['ja', '日本語', 'ja'], ['hi', 'हिन्दी', 'hi'], ['th', 'ไทย', 'th'], ['vi', 'Tiếng Việt', 'vi'], ['id', 'Bahasa Indonesia', 'id'], ['es', 'Español', 'es'], ['fr', 'Français', 'fr'], ['pt', 'Português (Brasil)', 'pt-BR'], ['ar', 'العربية', 'ar'], ['sw', 'Kiswahili', 'sw']];
var I18N_KEY = 'lastarrow.lang';
var I18N = { lang: 'ko', on: false, ex: null, tp: null, tk: null, cache: null, sep: ', ', miss: {}, empty: [] };
var I18N_HAN = /[\u1100-\u11FF\u3131-\u318E\uAC00-\uD7A3]/;
var I18N_NUM = '([+-]?\\d+(?:\\.\\d+)?만?|[\\u2160-\\u216B]+)';
// 좁은 자리용 짧은 번역: 사전의 '원문@자리'를 이 선택자 안 글자에 먼저 씀
var I18N_CTX = [['상단', '#mTitle'], ['기술', '.sk em'], ['도감칸', '.ci span'], ['타일', '.mbot .btn.tile span']];
// 시스템 글꼴로 그리는 언어: 귀염판 글꼴에 없는 글자를 이 글꼴들로(굵게)
var I18N_SYS = {
  zh: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', 'Noto Sans CJK SC', 'Source Han Sans SC'",
  ja: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', 'Noto Sans JP', 'Noto Sans CJK JP'",
  th: "'Noto Sans Thai', 'Noto Sans Thai UI', 'Thonburi', 'Leelawadee UI', 'Tahoma'",
  hi: "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Nirmala UI', 'Mangal'",
  ar: "'Noto Sans Arabic', 'Noto Naskh Arabic', 'Geeza Pro', 'Segoe UI', 'Tahoma'"
};
// Jua(CUTE)에 악센트 글자가 없는 언어: 라틴 글자를 Pretendard ExtraBold로 통째로 바꿔 한 낱말 안에 글꼴이 섞이지 않게
var I18N_LATX = { es: 1, fr: 1, pt: 1, vi: 1 };
// 넘침 고치기(모든 외국어 공통, 언어별). 글자 크기는 정수 px
var I18N_FIX_ALL =
  '.logo .l1{white-space:nowrap}.logo .l3{font-size:24px;letter-spacing:2px;padding-left:2px;white-space:nowrap}.logo .l3::before,.logo .l3::after{width:22px}' + // 제목 아래 부제: 한글용 넓은 자간을 줄임
  '.chCard .ccT b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:21px}.chCard.locked .ccT span{-webkit-line-clamp:1}.ccChip.lk{font-size:11px;line-height:1.2}' + // 장 카드: 제목 한 줄, 잠긴 장은 설명 한 줄(잠금 안내가 두 줄이 될 수 있어서)
  '#hud #bSpeed{padding-left:1px;padding-right:1px;gap:1px;letter-spacing:0}.mbot .btn.tile{padding-left:0;padding-right:0}' + // 속도 단추
  '.mbot .btn:not(.tile){min-width:0;padding:10px 5px;gap:3px;font-size:15px;line-height:1.1}.mbot .btn:not(.tile) img{width:22px;height:22px}.mbot .btn .dot{right:2px;top:2px}' + // 지도 아래 단추 셋이 한 줄에
  '.mbot .btn.tile span{max-width:100%;font-size:12px;line-height:1.1;text-align:center;overflow-wrap:normal;word-break:keep-all}' + // 지도 아래 타일 단추(화면 맞춤 작업의 5칸): 낱말 중간에서 안 끊고 넘치면 i18nFit 이 줄임
  '.tap{max-width:calc(100% - 24px);letter-spacing:1px;padding-left:16px;padding-right:16px;white-space:nowrap;font-size:17px}' + // 시작 단추
  '.mtop .mtt{font-size:18px;white-space:nowrap}' + // 지도 위 제목
  '#bWave .wl{font-size:13px;flex-wrap:wrap;white-space:normal;column-gap:3px;row-gap:0}#bWave .wl b{line-height:1}#bWave.pulse .wl b{font-size:16px}#bWave .wi .wi1 img{width:22px;height:22px}' + // 웨이브 단추: 길면 두 줄
  '.sk em{white-space:normal;width:max-content;max-width:64px;line-height:13px;padding:1px 3px;top:calc(100% + 2px);bottom:auto;text-align:center;overflow-wrap:normal}' + // 기술 이름표: 길면 두 줄(이웃과 안 겹치게)
  '.mbtns .btn{min-width:0;padding-left:6px;padding-right:6px}' + // 결과, 지역 창 아래 단추: 길면 두 줄
  '.cgrid{grid-template-columns:repeat(5,minmax(0,1fr))}.ci span{max-width:100%;text-align:center;font-size:11px;line-height:1.15;overflow-wrap:normal;word-break:keep-all}.tc .nm{max-width:100%;text-align:center;overflow-wrap:normal;word-break:keep-all}' + // 도감 칸, 탑 카드 이름: 낱말 중간에서 안 끊고 넘치면 i18nFit 이 줄임
  '.enl .en.new::after{font-size:9px;padding:0 3px}' + // '새' 딱지
  '.res.win .rt{font-size:44px}.mh>div{min-width:0;flex:1}' +
  '.res .rt,.pt,.mt,#banner .b1,.ecard .enm{white-space:nowrap}\n'; // 큰 제목은 한 줄로, 넘치면 i18nFit 이 글자를 줄임
var I18N_FIX = {
  en: '.logo .l2{display:none}\n', fr: '.logo .l2{display:none}.sk em,.ci span{font-size:10px}\n', pt: '.logo .l2{display:none}.sk em,.ci span{font-size:10px}\n', sw: '.logo .l2{display:none}.pkN{font-size:12px;overflow-wrap:anywhere;hyphens:auto}.pkD{font-size:11px}\n', // 제목이 Ironhold 라 아래 영문 줄과 같아서
  es: '.sk em,.ci span{font-size:10px}\n', vi: '.sk em,.ci span{font-size:10px}\n' // Pretendard 굵게는 Jua보다 넓음
};
// 칸보다 긴 글자: 글자 크기를 정수 px로 줄임(20px 넘으면 2px씩, 아니면 1px씩). 가장 작게 해도 넘치면 줄바꿈 허용. [선택자, 최소 크기]
var I18N_FIT = [['.mtop .mtt', 13], ['.chCard .ccT b', 15], ['.logo .l1', 34], ['.th .tt b', 12], ['.trow .btn.sm', 11], ['.res .rt', 22], ['.pt', 16], ['.mt', 16], ['#banner .b1', 18], ['.ecard .enm', 16], ['.ci span', 9], ['.tc .nm', 10], ['.mbot .btn.tile span', 9]];
var I18N_FIT_SEL = I18N_FIT.map(function (f) { return f[0]; }).join(',');

function i18nInfo(c) { for (var i = 0; i < I18N_LANGS.length; i++) if (I18N_LANGS[i][0] === c) return I18N_LANGS[i]; return null; }
function i18nDetect() {
  var q, l, i, list;
  try { q = /[?&#]lang=([a-z]{2})\b/.exec(location.search + location.hash); if (q && i18nInfo(q[1])) return q[1]; } catch (e) { }
  try { l = (typeof SAVE !== 'undefined' && SAVE && SAVE.set && SAVE.set.lang) || localStorage.getItem(I18N_KEY); if (l && i18nInfo(l)) return l; } catch (e) { }
  try { if (navigator.webdriver) return 'ko'; } catch (e) { } // 자동 시험 브라우저: 기존 시험 도구(shot.py, touchflow.py 등)가 그대로 한국어로 돌게
  return 'ko';   // 타임플렉스 v1.0: 새 시대 문구가 아직 한국어뿐이라 처음에는 한국어. 설정에서 고르면 그 언어
  try { list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']; } catch (e) { list = []; }
  for (i = 0; i < list.length; i++) {
    l = String(list[i] || '').toLowerCase().split(/[-_]/)[0];
    if (l === 'ms' || l === 'in') l = 'id'; // 말레이어, 옛 안드로이드 인도네시아어 코드
    if (i18nInfo(l)) return l;
  }
  return 'en';
}
function i18nSet(code) {
  try { if (typeof SAVE !== 'undefined' && SAVE && SAVE.set) { SAVE.set.lang = code; saveNow(); } } catch (e) { }
  try { localStorage.setItem(I18N_KEY, code); } catch (e) { }
  try { var u = location.href; if (/[?&#]lang=[a-z]{2}/.test(u)) location.replace(u.replace(/([?&#]lang=)[a-z]{2}/, '$1' + code)); else location.reload(); } catch (e) { }
}

// ---------- 사전 ----------
function i18nBuild(code) {
  var col = I18N_COLS.indexOf(code) + 1, en = I18N_COLS.indexOf('en') + 1, ex = new Map(), tp = [], tk = {};
  I18N.empty = [];
  I18N_ROWS.forEach(function (r) {
    var k = r[0], v = r[col];
    if (!v && k.indexOf('@') > 0) return; // 좁은 자리용 칸이 비면 보통 번역을 씀
    if (!v) { v = r[en] || k; I18N.empty.push(k); }
    if (/\{(\d|s|t)\}/.test(k)) { tp.push(i18nTpl(k, v)); tk[k] = v; } else ex.set(k, v);
  });
  tp.sort(function (a, b) { return b.lit - a.lit; }); // 글자가 많이 맞는 틀부터
  I18N.ex = ex; I18N.tp = tp; I18N.tk = tk; I18N.cache = new Map();
  I18N.sep = code === 'zh' ? '，' : code === 'ja' ? '、' : code === 'ar' ? '، ' : ', ';
  if (I18N.empty.length) try { console.warn('[i18n] ' + code + ' 빈 칸 ' + I18N.empty.length + '개는 영어로 대신 보여 줌'); } catch (e) { }
}
function i18nTpl(k, v) {
  var names = [], lit = 0, ctx = '', at = k.indexOf('@');
  if (at > 0) { ctx = k.slice(at + 1); k = k.slice(0, at); }
  var re = k.replace(/\{(\d|s|t)\}|[^{]+|\{/g, function (m, p) {
    if (p != null) { names.push(p); return /\d/.test(p) ? I18N_NUM : '(.+?)'; }
    lit += m.length; return m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  return { re: new RegExp('^' + re + '$'), names: names, v: v, lit: lit, ctx: ctx };
}
function i18nNum(n) { if (n.charAt(n.length - 1) !== '만') return n; var v = parseFloat(n.slice(0, -1)) * 10; return (Math.round(v * 10) / 10) + 'K'; } // util.js fmt(): '1.2만' = 12000 → 12K
// 한국어 s → 번역. 못 찾으면 null. ctx: 좁은 자리 이름, q: 못 찾아도 기록 안 함
function i18nTr(s, d, ctx, q) {
  if (typeof s !== 'string' || !I18N_HAN.test(s)) return s;
  var key = ctx ? s + '\u0001' + ctx : s, c = I18N.cache.get(key);
  if (c !== undefined) return c;
  var r = i18nTr0(s, d || 0, ctx);
  if (I18N.cache.size > 5000) I18N.cache.clear();
  I18N.cache.set(key, r);
  if (r == null && !d && !q) i18nMissing(s);
  return r;
}
function i18nTr0(s, d, ctx) {
  var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = m[2], v = null;
  if (ctx) v = I18N.ex.get(core + '@' + ctx);
  if (v == null) v = I18N.ex.get(core);
  if (v == null) v = i18nMatch(core, d, ctx);
  if (v == null && d < 4 && core.indexOf(', ') > 0) v = i18nList(core, d);
  if (v == null && /^[+-]?\d+(\.\d+)?만$/.test(core)) v = i18nNum(core);
  return v == null ? null : m[1] + v + m[3];
}
function i18nMatch(s, d, ctx) {
  var tp = I18N.tp;
  for (var i = 0; i < tp.length; i++) {
    var t = tp[i];
    if (t.ctx && t.ctx !== ctx) continue;
    var m = t.re.exec(s); if (!m) continue;
    var vals = {}, ok = true;
    for (var j = 0; j < t.names.length && ok; j++) {
      var n = t.names[j], g = m[j + 1];
      if (/\d/.test(n)) vals[n] = i18nNum(g);
      else { var sub = d < 4 ? i18nTr(g, d + 1, null, true) : null; if (sub == null) ok = false; else vals[n] = sub; }
    }
    if (ok) return t.v.replace(/\{(\d|s|t)\}/g, function (q, n) { return vals[n] != null ? vals[n] : q; });
  }
  return null;
}
// 'A, B, C' 처럼 쉼표로 이어 붙인 목록(능력치 줄 등): 조각마다 번역해서 그 언어의 쉼표로 다시 이음
function i18nList(s, d) {
  var p = s.split(', '), out = [];
  for (var i = 0; i < p.length; i++) { var v = i18nTr(p[i], d + 1, null, true); if (v == null) return null; out.push(v); }
  return out.join(I18N.sep);
}
function i18nMissing(s) {
  if (I18N.miss[s]) return; I18N.miss[s] = 1;
  try { window.__i18nMissing.push(s); console.warn('[i18n] 번역 없음 (' + I18N.lang + '): ' + s); } catch (e) { }
}
// 코드에서 직접: T(한국어 원문, 값...) 값은 원문에 나오는 자리표시 순서대로. {s},{t} 값(한국어)도 번역함
function T(k) {
  var a = arguments, src = k.replace(/@.*$/, ''), names = src.match(/\{(\d|s|t)\}/g) || [], vals = {}, v = src;
  names.forEach(function (p, i) { var n = p.charAt(1), x = a[i + 1]; if (x == null) return; x = String(x); vals[n] = !I18N.on ? x : /\d/.test(n) ? i18nNum(x) : (i18nTr(x, 1, null, true) || x); });
  if (I18N.on) {
    var w = I18N.ex.get(k); if (w == null) w = I18N.tk[k];
    if (w == null && k !== src) { w = I18N.ex.get(src); if (w == null) w = I18N.tk[src]; }
    if (w == null) i18nMissing(src); else v = w;
  }
  return v.replace(/\{(\d|s|t)\}/g, function (q, n) { return vals[n] != null ? vals[n] : q; });
}

// ---------- DOM ----------
var I18N_ATTRS = ['placeholder', 'title', 'aria-label'];
function i18nCtxOf(el) {
  if (!el || !el.matches) return null;
  for (var i = 0; i < I18N_CTX.length; i++) if (el.matches(I18N_CTX[i][1])) return I18N_CTX[i][0];
  return null;
}
function i18nText(n) {
  var p = n.parentNode; if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') return;
  var s = n.data; if (!I18N_HAN.test(s)) return;
  if (p.closest && p.closest('[translate="no"]')) return;
  var v = i18nTr(s, 0, i18nCtxOf(p));
  if (v != null && v !== s) n.data = v;
}
function i18nAttr(el) {
  if (!el.getAttribute) return;
  for (var i = 0; i < I18N_ATTRS.length; i++) {
    var s = el.getAttribute(I18N_ATTRS[i]);
    if (s && I18N_HAN.test(s)) { var v = i18nTr(s, 0); if (v != null) el.setAttribute(I18N_ATTRS[i], v); }
  }
}
function i18nWalk(root) {
  if (root.nodeType === 3) { i18nText(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 11) return;
  if (root.nodeName === 'SCRIPT' || root.nodeName === 'STYLE') return;
  if (root.nodeType === 1) i18nAttr(root);
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), t;
  while ((t = w.nextNode())) i18nText(t);
  if (root.querySelectorAll) root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(i18nAttr);
}
function i18nOnMut(list) {
  var fit = [];
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    if (m.type === 'characterData') { i18nText(m.target); fit.push(m.target.parentNode); }
    else if (m.type === 'attributes') i18nAttr(m.target);
    else { for (var j = 0; j < m.addedNodes.length; j++) i18nWalk(m.addedNodes[j]); if (m.addedNodes.length) fit.push(m.target); }
  }
  for (var k = 0; k < fit.length; k++) if (fit.indexOf(fit[k]) === k) i18nFitIn(fit[k]);
}
function i18nFit(el) {
  var min = 14, i, fs;
  for (i = 0; i < I18N_FIT.length; i++) if (el.matches(I18N_FIT[i][0])) { min = I18N_FIT[i][1]; break; }
  el.style.fontSize = ''; el.style.whiteSpace = '';
  if (!el.clientWidth || el.scrollWidth <= el.clientWidth) return;
  fs = Math.round(parseFloat(getComputedStyle(el).fontSize));
  while (fs > min && el.scrollWidth > el.clientWidth) { fs -= fs > 20 ? 2 : 1; el.style.fontSize = fs + 'px'; }
  if (el.scrollWidth > el.clientWidth && !el.matches('.mtop .mtt, .chCard .ccT b')) el.style.whiteSpace = 'normal'; // 가장 작게 해도 넘치면 줄바꿈 허용(한 줄 제목은 말줄임)
}
// 웨이브 단추: 글자가 두 줄이 되어 단추 높이를 넘으면 글자를 1px씩 줄임(11px까지)
function i18nFitWave() {
  var b = document.getElementById('bWave'), l = document.getElementById('waveLbl'), t, fs;
  if (!b || !l || !b.clientHeight) return;
  t = l.querySelectorAll('b, em'); t.forEach(function (e) { e.style.fontSize = ''; });
  if (b.scrollHeight <= b.clientHeight && l.scrollWidth <= l.clientWidth) return;
  fs = t.length ? Math.round(parseFloat(getComputedStyle(t[0]).fontSize)) : 14;
  while (fs > 11 && (b.scrollHeight > b.clientHeight || l.scrollWidth > l.clientWidth)) { fs--; t.forEach(function (e) { e.style.fontSize = fs + 'px'; }); }
}
function i18nRefit() { if (!I18N.on) return; try { requestAnimationFrame(function () { i18nFitIn(document.body); }); } catch (e) { } } // 화면이 바뀐 뒤(숨어 있을 때는 폭이 0이라 못 맞춤)
function i18nFitIn(root) {
  if (!root || root.nodeType !== 1 || !root.matches) return;
  var up = root.closest(I18N_FIT_SEL);
  if (up) i18nFit(up);
  root.querySelectorAll(I18N_FIT_SEL).forEach(i18nFit);
  if (root.closest('#bWave')) i18nFitWave();
}

// ---------- 캔버스 ----------
function i18nCanvas() {
  var C = window.CanvasRenderingContext2D; if (!C) return;
  var P = C.prototype, f = P.fillText, s = P.strokeText, m = P.measureText, ar = I18N.lang === 'ar';
  function tx(t) { if (typeof t !== 'string' || !I18N_HAN.test(t)) return t; var v = i18nTr(t, 0); return v == null ? t : v; }
  function draw(fn, ctx, a) {
    var t = tx(a[0]), d = null;
    if (ar && typeof t === 'string' && /[\u0600-\u06FF]/.test(t) && ctx.textAlign !== 'start' && ctx.textAlign !== 'end') { d = ctx.direction; ctx.direction = 'rtl'; }
    var r = a.length > 3 ? fn.call(ctx, t, a[1], a[2], a[3]) : fn.call(ctx, t, a[1], a[2]);
    if (d != null) ctx.direction = d;
    return r;
  }
  P.fillText = function () { return draw(f, this, arguments); };
  P.strokeText = function () { return draw(s, this, arguments); };
  P.measureText = function (t) { return m.call(this, tx(t)); };
}

// ---------- CSS ----------
function i18nRules(fnStyle, fnFace) {
  function walk(rules, media) {
    for (var j = 0; j < rules.length; j++) {
      var r = rules[j];
      if (r.type === 1 && fnStyle) fnStyle(r, media);
      else if (r.type === 4) walk(r.cssRules, r.media.mediaText);
      else if (r.type === 5 && fnFace) fnFace(r);
    }
  }
  for (var i = 0; i < document.styleSheets.length; i++) {
    var sh = document.styleSheets[i], rules;
    if (sh.ownerNode && sh.ownerNode.id === 'i18nCss') continue;
    try { rules = sh.cssRules; } catch (e) { continue; }
    if (rules) walk(rules, '');
  }
}
function i18nFamilies(ff, sys) {
  var a = ff.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x && !/^(sans-serif|serif|system-ui|monospace|cursive)$/i.test(x) && !/Apple SD Gothic Neo/i.test(x); });
  return a.join(', ') + ', ' + sys + ', system-ui, sans-serif';
}
function i18nLatinFace(logoToo) {
  var src = '';
  i18nRules(null, function (r) { var fam = (r.style.getPropertyValue('font-family') || '').replace(/["'\s]/g, ''); if (fam === 'PRT' && /800/.test(r.style.getPropertyValue('font-weight'))) src = r.style.getPropertyValue('src'); });
  if (!src) return '';
  var rng = 'U+0041-005A,U+0061-007A,U+00A1,U+00AB,U+00BB,U+00BF,U+00C0-024F,U+0300-036F,U+1E00-1EFF,U+2018-201F';
  function face(f) { return "@font-face{font-family:'" + f + "';src:" + src + ';font-weight:100 900;font-style:normal;font-display:block;unicode-range:' + rng + '}\n'; }
  return face('CUTE') + (logoToo ? face('LOGO') : '');
}
function i18nLangCss() {
  var L = I18N.lang, sys = I18N_SYS[L], out = [], rules = [];
  out.push('body{word-break:normal}');
  if (L === 'zh' || L === 'ja' || L === 'th') out.push('body{overflow-wrap:anywhere;line-break:auto}');
  if (L === 'ar') out.push('body *{unicode-bidi:plaintext}'); // 배치는 그대로, 글자 칸만 오른쪽에서 왼쪽
  if (I18N_LATX[L]) out.push(i18nLatinFace(L === 'vi'));
  i18nRules(function (r, media) {
    var st = r.style, add = '', ff = st.getPropertyValue('font-family'), ct = st.getPropertyValue('content');
    if (sys && ff && /CUTE|PRT|LOGO/.test(ff)) { add += 'font-family:' + i18nFamilies(ff, sys) + ';'; if (/^\s*["']?(CUTE|LOGO)/.test(ff)) add += 'font-weight:700;'; }
    if (ct && I18N_HAN.test(ct)) { var v = i18nTr(ct.replace(/^\s*["']|["']\s*$/g, ''), 0); if (v != null) add += 'content:' + JSON.stringify(v) + ';'; }
    if (add) rules.push((media ? '@media ' + media + '{' : '') + r.selectorText + '{' + add + '}' + (media ? '}' : ''));
  });
  return out.join('\n') + '\n' + rules.join('\n') + '\n' + I18N_FIX_ALL + (I18N_FIX[L] || '');
}
var I18N_PICK_CSS =
  '.lrow{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 10px 9px 12px;margin-bottom:8px;border-radius:16px;background:#fff;border:2px solid var(--pink2);box-shadow:0 3px 0 #f5b3cf;font-family:"CUTE","PRT",sans-serif;font-weight:400;font-size:17px;color:var(--ink);text-align:left}' +
  '.lrow .lrl{display:flex;align-items:center;gap:7px;min-width:0}.lrow .lgl{width:26px;height:26px;flex:none}' +
  '.lrow i{flex:none;display:flex;align-items:center;gap:5px;font-style:normal;font-family:"PRT",system-ui,sans-serif;font-weight:800;font-size:14px;line-height:20px;color:var(--hotd);background:#fff0f7;border:2px solid var(--pink);border-radius:14px;padding:3px 9px 2px 11px;white-space:nowrap}' +
  '.lrow i::after{content:"";border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:6px solid var(--hot)}' +
  '.lhead{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 12px}.lhead .lgl{width:34px;height:34px;flex:none;filter:drop-shadow(0 2px 0 rgba(74,42,90,.2))}.lhead .pt{margin:0}' +
  '.lgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}' +
  '.lopt{position:relative;min-height:44px;display:flex;align-items:center;justify-content:center;padding:5px 24px;border-radius:15px;background:#fff;border:2px solid var(--lilac2);box-shadow:0 3px 0 #e8ddf7;font-family:"PRT",system-ui,sans-serif;font-weight:800;font-size:15px;line-height:1.2;color:var(--ink);text-align:center}' +
  '.lopt:last-child:nth-child(odd){grid-column:1/-1}' +
  '.lopt.on{border-color:var(--hot);background:linear-gradient(180deg,#fff6fa,#ffe3ef);color:var(--hotd);box-shadow:0 3px 0 #f5a9c9,0 0 0 3px rgba(255,111,168,.18)}' +
  '.lopt .lck{position:absolute;right:6px;top:50%;width:20px;height:20px;margin-top:-10px}.lopt.wait{opacity:.55}' +
  '.lnote{font-size:12px;line-height:1.4;color:var(--ink2);text-align:center;margin:10px 0 0}\n';
var I18N_GLOBE = '<svg class="lgl" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.6" fill="#a9dcff" stroke="#4a2a5a" stroke-width="2"/>' +
  '<path d="M6.3 7.3c1.4-1 3.2-1.1 4.1-.2.8.8-.1 1.7.6 2.6.8 1 2.3.6 2.4 1.9.1 1.1-1.2 1.4-1.6 2.4-.4 1.1.3 2.4-.6 3.1-1 .8-2.4-.4-2.8-1.6-.4-1.1-1.6-1.7-1.9-2.9-.3-1.4.1-4.3 1.8-5.3z" fill="#9be38c" stroke="#4a2a5a" stroke-width="1.2" stroke-linejoin="round"/>' +
  '<path d="M15.1 5.3c1.3.3 2.7 1.1 3.5 2.3.5.8-.3 1.3-1.2 1.2-.9-.1-1.8.5-2.4-.2-.6-.7-.1-1.6.1-3.3zM16.4 13.1c1-.3 2.2.1 2.6 1 .3.7-.4 1.6-1.1 2.3-.8.8-1.9 1.4-2.4.8-.5-.7.1-1.4.2-2.2.1-.8-.1-1.6.7-1.9z" fill="#9be38c" stroke="#4a2a5a" stroke-width="1.2" stroke-linejoin="round"/>' +
  '<path d="M7.6 4.9c.9-.6 1.9-1 2.9-1.1" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';
var I18N_CHECK = '<svg class="lck" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#ff6fa8" stroke="#fff" stroke-width="1.5"/><path d="M5.8 10.3l2.8 2.8 5.6-6" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ---------- 설정 창 줄, 언어 고르기 창 ----------
// 설정 창(ui.js openSettings)에 넣는 줄. 누르면 i18nPicker (아래 i18nInit 의 클릭 위임)
function i18nRow(fromPause) {
  var L = i18nInfo(I18N.lang) || I18N_LANGS[0];
  return '<button class="lrow" id="sLang" data-fp="' + (fromPause ? 1 : 0) + '"><span class="lrl">' + I18N_GLOBE + '<span>' + T('언어') + '</span></span><i lang="' + L[2] + '" translate="no">' + L[1] + '</i></button>';
}
// 언어 고르기 창: 13개 언어를 그 언어 이름으로, 2열. 고르면 저장하고 다시 불러옴. 닫으면 설정 창으로(fromPause 가 null 이면 그냥 닫기)
function i18nPicker(fromPause) {
  var h = '<div class="lhead">' + I18N_GLOBE + '<div class="pt">' + T('언어') + '</div></div><div class="lgrid">';
  I18N_LANGS.forEach(function (L) { var on = L[0] === I18N.lang; h += '<button class="lopt' + (on ? ' on' : '') + '" data-lang="' + L[0] + '" lang="' + L[2] + '" translate="no"><span>' + L[1] + '</span>' + (on ? I18N_CHECK : '') + '</button>'; });
  h += '</div><p class="lnote">' + T('언어를 바꾸면 게임을 다시 불러옵니다') + '</p><button class="xbtn" id="lClose">' + T('닫기') + '</button>';
  openModal(h, 'lang');
  function back() { if (fromPause != null && typeof openSettings === 'function') openSettings(!!fromPause); else closeModal(); }
  $('modal').querySelectorAll('.lopt').forEach(function (b) {
    b.onclick = function () { var c = b.getAttribute('data-lang'); try { sfx('click', 0.4); } catch (e) { } if (c === I18N.lang) { back(); return; } b.classList.add('wait'); i18nSet(c); };
  });
  $('lClose').onclick = function () { try { sfx('click', 0.3); } catch (e) { } back(); };
}

// ---------- 점검(개발용): 데이터 전체를 지금 언어(또는 code)로 번역해 보고 못 찾은 원문 목록 ----------
function i18nAudit(code) {
  var keep = { lang: I18N.lang, on: I18N.on, ex: I18N.ex, tp: I18N.tp, tk: I18N.tk, cache: I18N.cache, sep: I18N.sep, empty: I18N.empty };
  var bad = {}, n = 0, R = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'];
  function chk(s) { if (typeof s !== 'string' || !I18N_HAN.test(s)) return; n++; if (i18nTr(s, 0, null, true) == null) bad[s] = 1; }
  try {
    if (code && (code !== I18N.lang || !I18N.on)) { if (code === 'ko') return { lang: 'ko', checked: 0, bad: [] }; I18N.lang = code; I18N.on = true; i18nBuild(code); }
    if (!I18N.on) return { lang: 'ko', checked: 0, bad: [] };
    I18N_ROWS.forEach(function (r) { if (!/\{|@/.test(r[0])) chk(r[0]); });
    TOWER_ORDER.forEach(function (k) { try {
      var W = TOWERS[k]; chk(W.name); chk(W.short); chk(W.desc); chk(W.name + ' 건설'); chk('숨은 ' + W.name + '을(를) 찾았습니다');
      W.br.forEach(function (B) { chk(B.name); chk(B.desc); chk(B.name + ' ' + R[5] + '단계로 강화'); chk(B.name + ' 완성'); });
      for (var l = 1; l <= 5; l++) for (var b = 0; b < 2; b++) { var st = towerStats(k, l, b); chk(statLine(st, k)); chk(statLine(st, null)); chk(towerTitle(k, l, b)); if (l > 1 && l < 6) chk(R[l] + '단계로 강화'); if (l <= 3) chk(l + '단계'); }
    } catch (e) { bad['점검 오류(' + k + '): ' + e] = 1; } });
    chk('화력 +35%'); chk('웨이브 금화 30 → 55'); chk('처치 12');
    ENEMY_ORDER.forEach(function (k) {
      var E = ENEMIES[k]; chk(E.name); chk(E.desc); chk(E.name.replace(/^.* /, ''));
      chk('체력 ' + Math.round(E.hp * HPK) + (E.armor ? ', 갑옷 ' + Math.round(E.armor * 100) + '%' : '') + (E.mres ? ', 마법 ' + (E.mres > 0 ? '저항 ' : '약점 ') + Math.round(Math.abs(E.mres) * 100) + '%' : '') + ', 속도 ' + E.spd + ', 성문 피해 ' + E.leak);
    });
    MAPS.forEach(function (M, i) {
      chk(M.name); chk(M.region); chk(M.desc); chk((i + 1) + '. ' + M.name); chk(M.region + ', 우두머리 출현');
      DIFF_ORDER.forEach(function (dk) { chk(diffInfo(i, dk)); chk(DIFFS[dk].name + ', 웨이브 ' + (M.waves + (DIFFS[dk].extra || 0))); });
      var nt = TOWER_ORDER.filter(function (k) { return TOWER_UNLOCK[k] === i; }); if (nt.length) chk('새 탑: ' + nt.map(function (k) { return TOWERS[k].name; }).join(', '));
    });
    DIFF_ORDER.forEach(function (dk) { chk(DIFFS[dk].name); });
    if (typeof WORLD_BANDS !== 'undefined') WORLD_BANDS.forEach(function (b) { chk(b[3]); });
    Object.keys(SKILLS).forEach(function (k) { var K = SKILLS[k]; chk(K.name); chk(K.desc); chk(K.desc + ' 전장을 누르세요'); chk(K.name + '은(는) ' + (K.unlock + 1) + '번째 지역부터 쓸 수 있습니다'); chk(K.name + ' 준비 중: 12초'); });
    RESEARCH.forEach(function (r) { chk(r.name); chk(r.desc); chk(r.desc + ' (먼저 ' + r.name + ')'); });
    Object.keys(SPEAKERS).forEach(function (k) { chk(SPEAKERS[k]); });
    Object.keys(STORY).forEach(function (k) { STORY[k].forEach(function (L) { chk(L[1]); }); });
    Object.keys(MODE_NAME).forEach(function (k) { chk(MODE_NAME[k]); chk('목표: ' + MODE_NAME[k]); });
    for (var w = 0; w < 8; w++) chk(loseTip({ mi: 0, wave: w }));
    chk(VERSION); chk(fmt(12345)); chk('3배'); chk('웨이브 3 / 12'); chk('이어하기 (웨이브 7)'); chk('일찍 불러서 금화 +15'); chk('별 +3 (공방에서 쓸 수 있습니다)'); chk('버틴 웨이브 31');
  } catch (e) { bad['점검 오류: ' + e] = 1; }
  finally { I18N.lang = keep.lang; I18N.on = keep.on; I18N.ex = keep.ex; I18N.tp = keep.tp; I18N.tk = keep.tk; I18N.cache = keep.cache; I18N.sep = keep.sep; I18N.empty = keep.empty; }
  return { lang: code || keep.lang, checked: n, bad: Object.keys(bad) };
}

// ---------- 시작 (main.js 부팅 전에, 이 파일을 읽는 순간 한 번) ----------
function i18nInit() {
  window.__i18nMissing = [];
  var L = i18nDetect(); I18N.lang = L;
  window.__i18n = { lang: function () { return I18N.lang; }, tr: function (s) { return I18N.on ? i18nTr(s, 0) : s; }, T: T, audit: i18nAudit, set: i18nSet, picker: function () { i18nPicker(null); }, empty: function () { return I18N.empty.slice(); }, langs: I18N_LANGS.map(function (x) { return x[0]; }) };
  // 설정 창 언어 줄 누르기(설정 창을 다시 그려도 그대로 동작하게 문서에 한 번만 걸어 둠)
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#sLang') : null; if (!b) return;
    e.stopPropagation(); try { sfx('click', 0.4); } catch (x) { }
    i18nPicker(b.getAttribute('data-fp') === '1');
  });
  var st = document.createElement('style'); st.id = 'i18nCss'; st.textContent = I18N_PICK_CSS;
  if (L !== 'ko') {
    I18N.on = true;
    document.documentElement.lang = i18nInfo(L)[2];
    i18nBuild(L);
    try { var tt = i18nTr(document.title, 0); if (tt) document.title = tt; } catch (e) { }
    i18nCanvas();
    try { st.textContent += i18nLangCss(); } catch (e) { try { console.warn('[i18n] CSS', e); } catch (x) { } }
  }
  document.head.appendChild(st);
  if (L === 'ko') return;
  i18nWalk(document.body); i18nFitIn(document.body);
  new MutationObserver(i18nOnMut).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });
  try { if (document.fonts && document.fonts.load) { document.fonts.load('20px CUTE', 'Aaé'); document.fonts.load('20px LOGO', 'Aaé'); document.fonts.addEventListener('loadingdone', function () { i18nFitIn(document.body); }); } } catch (e) { } // 글꼴이 늦게 오면 글자 폭이 바뀌니 다시 맞춤
}
i18nInit();
