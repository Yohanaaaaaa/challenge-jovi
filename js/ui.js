/* =============================================================
   Jovi Câmera — utilitários de interface
   Helpers de marcação, cenas em CSS art, cálculo dos filtros
   de imagem, toasts e folha modal.
   ============================================================= */
(function (global) {
  'use strict';

  var D = global.JOVI_DATA;

  /* ---------------------------------------------------------
     Básicos
  --------------------------------------------------------- */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function icon(name, cls) {
    return '<svg class="jv-ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + name + '"></use></svg>';
  }

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function byId(id) { return document.getElementById(id); }

  function findMode(id) {
    for (var i = 0; i < D.MODES.length; i++) if (D.MODES[i].id === id) return D.MODES[i];
    return null;
  }

  /* ---------------------------------------------------------
     Cenas desenhadas em CSS (nenhuma imagem externa)
  --------------------------------------------------------- */
  var SCENE_LAYERS = {
    paisagem: ['l-sky', 'l-clouds', 'l-peak2', 'l-peak', 'l-forest', 'l-river', 'l-rocks'],
    retrato: ['l-bg', 'l-glow', 'l-neck', 'l-body', 'l-hair', 'l-face', 'l-shadow', 'l-eyes', 'l-mouth'],
    sol: ['l-sky', 'l-cloud', 'l-sun', 'l-sea', 'l-glint'],
    urbano: ['l-sky', 'l-blockL', 'l-blockR', 'l-street', 'l-crosswalk', 'l-cab1', 'l-cab2'],
    noite: ['l-sky', 'l-stars', 'l-moon', 'l-city', 'l-water'],
    comida: ['l-table', 'l-wood', 'l-plate', 'l-food', 'l-herb'],
    acao: ['l-bg', 'l-blur', 'l-track', 'l-streak', 'l-runner'],
    praia: ['l-sky', 'l-sun', 'l-sea', 'l-foam', 'l-sand'],
    doc: ['l-desk', 'l-wood', 'l-paper', 'l-text']
  };

  /* Usa <span> para que a cena possa viver dentro de <button> sem
     quebrar a semântica do HTML. */
  function scene(name, opts) {
    opts = opts || {};
    var layers = SCENE_LAYERS[name] || SCENE_LAYERS.paisagem;
    var html = '<span class="jv-scene sc-' + esc(name) + ' ' + esc(opts.cls || '') + '"' +
      (opts.style ? ' style="' + opts.style + '"' : '') + '>';
    for (var i = 0; i < layers.length; i++) html += '<span class="' + layers[i] + '"></span>';
    if (opts.watermark) html += '<span class="jv-scene__wm">' + esc(opts.watermark) + '</span>';
    html += '</span>';
    return html;
  }

  /* ---------------------------------------------------------
     Ajustes -> filtros CSS
     Traduz os valores dos sliders em filtros aplicáveis ao visor
     e em uma camada de tonalidade (temperatura de cor).
  --------------------------------------------------------- */
  function normalize(values) {
    var out = {};
    for (var k in D.NEUTRAL) {
      out[k] = values && typeof values[k] === 'number' ? values[k] : D.NEUTRAL[k];
    }
    return out;
  }

  function toFilter(values) {
    var v = normalize(values);
    var brightness = 1 + v.exposicao * 0.22;
    var contrast = 1 + v.contraste / 110 + Math.max(0, v.nitidez) / 420;
    var saturate = 1 + v.saturacao / 50;
    var f = 'brightness(' + brightness.toFixed(3) + ') contrast(' + contrast.toFixed(3) + ') saturate(' + Math.max(0, saturate).toFixed(3) + ')';
    if (v.nitidez < 0) f += ' blur(' + (Math.abs(v.nitidez) / 45).toFixed(2) + 'px)';
    return f;
  }

  function toTint(values) {
    var v = normalize(values);
    var t = v.temperatura;
    if (!t) return { background: 'transparent', opacity: 0 };
    var color = t > 0 ? 'rgba(255,158,52,1)' : 'rgba(48,140,255,1)';
    return { background: color, opacity: (Math.abs(t) / 100 * 0.95).toFixed(3) };
  }

  /* Aplica os ajustes em qualquer elemento que contenha uma cena */
  function applyLook(root, values) {
    if (!root) return;
    var inner = root.querySelector('.jv-view__inner') || root;
    var tint = root.querySelector('.jv-view__tint');
    inner.style.filter = toFilter(values);
    if (tint) {
      var t = toTint(values);
      tint.style.background = t.background;
      tint.style.opacity = t.opacity;
    }
  }

  /* ---------------------------------------------------------
     Formatação de valores
  --------------------------------------------------------- */
  function fmt(key, value) {
    var meta = null;
    for (var i = 0; i < D.ADJUSTS.length; i++) if (D.ADJUSTS[i].key === key) meta = D.ADJUSTS[i];
    var dec = meta ? meta.decimals : 0;
    var n = Number(value) || 0;
    var txt = Math.abs(n).toFixed(dec).replace('.', ',');
    if (n > 0) return '+' + txt;
    if (n < 0) return '-' + txt;
    return dec ? '0,0' : '0';
  }

  function pct(key, value) {
    var meta = null;
    for (var i = 0; i < D.ADJUSTS.length; i++) if (D.ADJUSTS[i].key === key) meta = D.ADJUSTS[i];
    if (!meta) return 50;
    return ((Number(value) - meta.min) / (meta.max - meta.min)) * 100;
  }

  /* Bloco de sliders reutilizado em "detalhe" e "criar configuração" */
  function sliders(values, editable) {
    var v = normalize(values);
    var html = '';
    for (var i = 0; i < D.ADJUSTS.length; i++) {
      var a = D.ADJUSTS[i];
      html +=
        '<div class="jv-slider" data-slider="' + a.key + '">' +
          '<div class="jv-slider__head">' +
            '<span class="jv-slider__name">' + esc(a.name) + '</span>' +
            '<span class="jv-slider__val" data-val="' + a.key + '">' + fmt(a.key, v[a.key]) + '</span>' +
          '</div>' +
          '<div class="jv-slider__track"><span class="jv-slider__fill" data-fill="' + a.key + '" style="width:' + pct(a.key, v[a.key]).toFixed(1) + '%"></span></div>' +
          (editable
            ? '<input class="jv-range" type="range" data-range="' + a.key + '" min="' + a.min + '" max="' + a.max + '" step="' + a.step + '" value="' + v[a.key] + '" aria-label="' + esc(a.name) + '">'
            : '') +
        '</div>';
    }
    return html;
  }

  /* ---------------------------------------------------------
     Feedback: toast, folha modal e vibração
  --------------------------------------------------------- */
  var toastTimer = null;
  function toast(msg) {
    var el = byId('jv-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2200);
  }

  function buzz(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms || 12); } catch (e) { /* ignora */ } }
  }

  function sheet(title, items) {
    var el = byId('jv-sheet');
    if (!el) return;
    var html = '<div class="jv-sheet__panel">' +
      '<div class="jv-sheet__grip"></div>' +
      (title ? '<p class="jv-eyebrow mb-2">' + esc(title) + '</p>' : '');
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      html += '<button class="jv-sheet__item" data-act="' + esc(it.act) + '"' +
        (it.arg ? ' data-arg="' + esc(it.arg) + '"' : '') + '>' +
        icon(it.icon) + '<span>' + esc(it.label) + '</span></button>';
    }
    html += '</div>';
    openSheet(html);
  }

  /* Abre de forma síncrona: o reflow garante que a transição parta do estado
     inicial sem depender de requestAnimationFrame — se o fechamento chegasse
     antes do quadro seguinte, a folha reabria sozinha. */
  function openSheet(html) {
    var el = byId('jv-sheet');
    if (!el) return;
    el.innerHTML = html;
    el.setAttribute('aria-hidden', 'false');
    void el.offsetWidth;
    el.classList.add('is-on');
  }

  function closeSheet() {
    var el = byId('jv-sheet');
    if (!el) return;
    el.classList.remove('is-on');
    el.setAttribute('aria-hidden', 'true');
    setTimeout(function () { if (!el.classList.contains('is-on')) el.innerHTML = ''; }, 300);
  }

  function flash() {
    var el = byId('jv-flash');
    if (!el) return;
    el.classList.remove('is-on');
    void el.offsetWidth; /* reinicia a animação */
    el.classList.add('is-on');
  }

  /* Relógio da barra de status */
  function clock() {
    var el = byId('jv-clock');
    if (!el) return;
    var now = new Date();
    el.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  global.JOVI_UI = {
    esc: esc,
    icon: icon,
    clamp: clamp,
    byId: byId,
    findMode: findMode,
    scene: scene,
    normalize: normalize,
    toFilter: toFilter,
    toTint: toTint,
    applyLook: applyLook,
    fmt: fmt,
    pct: pct,
    sliders: sliders,
    toast: toast,
    buzz: buzz,
    sheet: sheet,
    openSheet: openSheet,
    closeSheet: closeSheet,
    flash: flash,
    clock: clock
  };
})(window);
