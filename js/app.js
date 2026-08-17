/* =============================================================
   Jovi Câmera — aplicação
   Estado, roteador, ações e comportamentos da câmera.
   ============================================================= */
(function (global) {
  'use strict';

  var D = global.JOVI_DATA;
  var U = global.JOVI_UI;
  var S = global.JOVI_SCREENS;
  var CAM = global.JOVI_CAM;

  var STORAGE_KEY = 'jovi.state.v1';
  var root = U.byId('app');

  /* ---------------------------------------------------------
     Estado
  --------------------------------------------------------- */
  function defaults() {
    return {
      screen: 'splash',
      stack: [],
      back: false,

      onboarded: false,
      profile: { nivel: 'Iniciante', objetivo: 'Fotos do dia a dia', estilo: 'Natural' },

      camera: { mode: 'foto', model: 'paisagem', flash: 'off', hdr: true, ai: true, ratio: '3:4', zoom: 1, front: false, timer: 0 },
      settings: { grade: false, som: true, espelhar: true, local: false, iaAuto: true, guardarFotos: false },

      look: Object.assign({}, D.STYLE_VALUES['Natural']),
      lookName: 'Estilo Natural',

      liked: [],
      saved: [],
      customPresets: [],
      shots: [],

      tab: 'alta',
      cat: 'Todos',
      query: '',

      viewPreset: null,
      viewMode: 'retrato',
      viewShot: null,

      draft: Object.assign({}, D.NEUTRAL),
      draftName: '',
      draftDesc: '',
      draftScene: 'paisagem',

      aiCard: false,
      coachStep: 0,
      scanning: false,
      recording: false,
      recLabel: '00:00',
      thumbPop: false,
      focusSearch: false,

      /* câmera do aparelho */
      liveWanted: false,   /* preferência do usuário (persistida) */
      live: false,         /* fluxo realmente ativo agora */
      hwZoom: false,       /* o zoom foi feito pela lente, não por CSS */
      realRec: false,
      camError: null,      /* último erro, mostrado no visor */
      camStarting: false,  /* pedido em andamento (o navegador está perguntando) */
      camDiag: '',         /* navegador / protocolo / câmeras vistas */
      liveDismissed: false
    };
  }

  var state = defaults();

  var PERSIST = ['onboarded', 'profile', 'camera', 'settings', 'look', 'lookName', 'liked', 'saved', 'customPresets', 'shots', 'liveWanted'];

  /* Fotos reais são grandes: guarda as mais recentes e, se o espaço
     acabar, vai descartando as imagens antigas (a captura continua na
     galeria, exibindo a cena correspondente). */
  var KEEP_IMAGES = 6;

  function save() {
    var out = {};
    PERSIST.forEach(function (k) { out[k] = state[k]; });

    /* vídeos ficam em blob URL, que não sobrevive ao recarregamento */
    var shots = state.shots.slice(0, 24)
      .filter(function (s) { return !s.video; })
      .map(function (s) { return Object.assign({}, s); });

    /* Por padrão a imagem não é gravada: o localStorage é compartilhado por
       todas as páginas da mesma origem, e no GitHub Pages isso inclui os
       outros projetos publicados no mesmo domínio. Quem quiser manter as
       fotos entre sessões liga a opção em Ajustes. */
    var kept = 0;
    shots.forEach(function (s) {
      if (!s.src) return;
      if (!state.settings.guardarFotos) { delete s.src; return; }
      kept++;
      if (kept > KEEP_IMAGES) delete s.src;
    });
    out.shots = shots;

    for (var tries = 0; tries < 10; tries++) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(out)); return; }
      catch (e) {
        var dropped = false;
        for (var i = out.shots.length - 1; i >= 0; i--) {
          if (out.shots[i].src) { delete out.shots[i].src; dropped = true; break; }
        }
        if (!dropped) return; /* modo privado ou storage indisponível */
      }
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      PERSIST.forEach(function (k) {
        if (data[k] !== undefined && data[k] !== null) {
          state[k] = (typeof state[k] === 'object' && !Array.isArray(state[k]))
            ? Object.assign({}, state[k], data[k])
            : data[k];
        }
      });
    } catch (e) { /* estado corrompido: segue com o padrão */ }
  }

  /* ---------------------------------------------------------
     Temporizadores (limpos a cada troca de tela)
  --------------------------------------------------------- */
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }
  function clearTimers() {
    timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timers = [];
  }

  /* ---------------------------------------------------------
     Roteador
  --------------------------------------------------------- */
  var NAV_ROOTS = ['home', 'explorar', 'comunidade', 'perfil'];

  function go(screen, opts) {
    opts = opts || {};
    if (screen === state.screen && !opts.force) return;
    if (!opts.replace && state.screen) {
      if (NAV_ROOTS.indexOf(screen) > -1) state.stack = [];
      else state.stack.push(state.screen);
      if (state.stack.length > 12) state.stack.shift();
    }
    state.back = false;
    state.screen = screen;
    onEnter(screen);
    render();
  }

  function back() {
    var prev = state.stack.pop();
    if (!prev) prev = state.onboarded ? 'home' : 'onboarding';
    state.back = true;
    state.screen = prev;
    onEnter(prev);
    render();
  }

  /* Preparações feitas ao entrar em cada tela */
  function onEnter(screen) {
    state.aiCard = false;
    state.scanning = false;
    if (screen !== 'camera') {
      stopRecording(true);
      /* libera a câmera ao sair do visor: nada de luz acesa à toa */
      if (state.live) { CAM.stop(); state.live = false; }
    }
    if (screen === 'explorar') state.focusSearch = false;
    if (screen === 'criar' && !state.draftName) state.draft = Object.assign({}, state.look);
  }

  /* ---------------------------------------------------------
     Renderização
  --------------------------------------------------------- */
  function render() {
    clearTimers();
    state.allPresets = D.PRESETS.concat(state.customPresets);

    var view = S[state.screen] || S.home;
    root.innerHTML = view(state);

    var section = root.firstElementChild;
    if (section && state.back) section.classList.add('jv-screen--back');

    afterRender();
    state.thumbPop = false;
    save();
  }

  function afterRender() {
    U.clock();

    if (state.screen === 'splash') {
      later(function () { go(state.onboarded ? 'home' : 'onboarding', { replace: true }); }, 1500);
    }

    if (state.screen === 'camera') setupCamera();
    if (state.screen === 'explorar') setupSearch();

    /* sliders com pré-visualização ao vivo */
    Array.prototype.forEach.call(root.querySelectorAll('[data-preview]'), setupSliders);
  }

  /* ---------------------------------------------------------
     Sliders
  --------------------------------------------------------- */
  function setupSliders(box) {
    var preview = document.querySelector(box.getAttribute('data-preview'));
    box.addEventListener('input', function (ev) {
      var input = ev.target.closest ? ev.target.closest('[data-range]') : null;
      if (!input) return;
      var key = input.getAttribute('data-range');
      var value = parseFloat(input.value);
      state.draft[key] = value;

      var val = box.querySelector('[data-val="' + key + '"]');
      var fill = box.querySelector('[data-fill="' + key + '"]');
      if (val) val.textContent = U.fmt(key, value);
      if (fill) fill.style.width = U.pct(key, value).toFixed(1) + '%';
      if (preview) U.applyLook(preview, state.draft);
    });
  }

  /* ---------------------------------------------------------
     Busca
  --------------------------------------------------------- */
  function setupSearch() {
    var input = U.byId('jv-search');
    if (!input) return;
    if (state.focusSearch) {
      input.focus();
      var v = input.value;
      input.value = '';
      input.value = v;
    }
    input.addEventListener('input', function () {
      state.query = input.value;
      state.focusSearch = true;
      render();
    });
  }

  /* ---------------------------------------------------------
     Câmera
  --------------------------------------------------------- */
  function centerModes() {
    var track = U.byId('jv-modes-track');
    if (!track) return;
    var active = track.querySelector('.is-on') || track.firstElementChild;
    if (!active) return;
    var offset = active.offsetLeft + active.offsetWidth / 2;
    track.style.transform = 'translateX(' + (-offset) + 'px)';
  }

  /* ---------------------------------------------------------
     Câmera do aparelho
  --------------------------------------------------------- */
  var starting = false;
  var autoPending = false;

  function camError(err) {
    var name = err && err.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') return 'Permissão negada. Autorize a câmera nas configurações do navegador.';
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Nenhuma câmera encontrada neste aparelho.';
    if (name === 'NotReadableError') return 'A câmera está sendo usada por outro aplicativo.';
    if (name === 'TimeoutError') return (err && err.message) || 'A câmera não respondeu.';
    return (err && err.message) || 'Não foi possível abrir a câmera.';
  }

  function applyZoom(z) {
    state.hwZoom = state.live ? CAM.setZoom(z) : false;
  }

  function applyTorch() {
    if (state.live) CAM.setTorch(state.camera.flash === 'on');
  }

  function startLive(silencioso) {
    if (starting) return Promise.resolve(false);
    starting = true;
    state.camStarting = true;
    if (!silencioso) render();
    return CAM.start(state.camera.front ? 'front' : 'back')
      .then(function () {
        starting = false;
        state.camStarting = false;
        state.live = true;
        state.liveWanted = true;
        state.camError = null;
        applyZoom(state.camera.zoom);
        applyTorch();
        render();
        return true;
      })
      .catch(function (err) {
        starting = false;
        state.camStarting = false;
        state.live = false;
        state.liveWanted = false;
        /* o erro fica visível no visor, com diagnóstico e opção de repetir.
           O diagnóstico básico é síncrono: a contagem de câmeras depende de
           enumerateDevices, que nem sempre responde. */
        state.camError = { name: (err && err.name) || 'Error', message: camError(err) };
        state.camDiag = CAM.diagnose() + ' · ' + ((err && err.name) || 'erro');
        render();
        CAM.countCameras().then(function (n) {
          if (n < 0) return;
          state.camDiag = CAM.diagnose(n) + ' · ' + ((err && err.name) || 'erro');
          if (state.screen === 'camera') render();
        });
        return false;
      });
  }

  function stopLive() {
    CAM.stop();
    state.live = false;
    state.liveWanted = false;
    state.hwZoom = false;
    /* desligar é uma escolha: não reabre sozinha em seguida */
    state.liveDismissed = true;
    render();
  }

  function setupCamera() {
    /* duas passagens: a segunda corrige a medida depois que a fonte
       e o espaçamento entre letras já foram aplicados */
    requestAnimationFrame(centerModes);
    later(centerModes, 120);

    /* Abrir o visor é pedir a câmera: getUserMedia é chamado direto, sem
       depender de o usuário achar um botão. Só não insiste se já falhou
       nesta sessão ou se ele escolheu ficar na demonstração.
       O pedido sai fora deste ciclo para não renderizar dentro do render. */
    if (!state.live && !starting && !autoPending && CAM.usable() && !state.camError && !state.liveDismissed) {
      autoPending = true;
      /* microtask, e não later(): timers são limpos a cada render, o que
         cancelaria o pedido se outra renderização acontecesse no meio */
      Promise.resolve().then(function () {
        autoPending = false;
        if (state.screen === 'camera' && !state.live) startLive();
      });
    }
    if (state.live) CAM.attach(U.byId('jv-inner'));

    /* diagnóstico levantado uma única vez, para o painel de erro */
    if (!state.camDiag && !state.live) {
      state.camDiag = CAM.diagnose();
      CAM.countCameras().then(function (n) {
        if (n < 0) return;
        state.camDiag = CAM.diagnose(n);
        if (state.screen === 'camera' && !state.live) render();
      });
    }

    var c = state.camera;

    /* IA detecta a cena depois de um instante, como em um app real */
    if (c.mode === 'foto' && c.ai && state.settings.iaAuto && !state.aiCard) {
      later(function () {
        if (state.screen !== 'camera' || state.camera.mode !== 'foto') return;
        state.aiCard = true;
        render();
      }, 1600);
    }

    /* coach de enquadramento avança sozinho no modo retrato */
    if (c.mode === 'retrato') {
      every(function () {
        if (state.screen !== 'camera') return;
        state.coachStep++;
        var el = root.querySelector('.jv-coach');
        var model = U.findMode('retrato');
        if (el && model) {
          el.querySelector('.jv-coach__txt').textContent = model.coach[state.coachStep % model.coach.length];
          el.querySelector('.jv-coach__step').textContent = ((state.coachStep % 3) + 1) + '/3';
        }
      }, 4600);
    }

    /* toque para focar */
    var view = U.byId('jv-view');
    if (view) {
      view.addEventListener('click', function (ev) {
        if (ev.target.closest('button')) return;
        var rect = view.getBoundingClientRect();
        var dot = document.createElement('span');
        dot.className = 'jv-focus';
        dot.style.left = (ev.clientX - rect.left) + 'px';
        dot.style.top = (ev.clientY - rect.top) + 'px';
        view.appendChild(dot);
        setTimeout(function () { dot.remove(); }, 900);
      });
    }
  }

  function sceneForCamera() {
    if (state.camera.mode === 'documento') return 'doc';
    var m = U.findMode(state.camera.model);
    return m ? m.scene : 'paisagem';
  }

  function kindForCamera() {
    var c = state.camera;
    if (c.mode === 'documento') return 'Documento';
    if (c.mode === 'video') return 'Vídeo';
    if (c.mode === 'retrato') return 'Retrato';
    return 'Foto';
  }

  function ratioValue(r) {
    var p = String(r).split(':');
    return (parseFloat(p[0]) || 3) / (parseFloat(p[1]) || 4);
  }

  function pushShot(kind, src, isVideo) {
    var now = new Date();
    state.shots.unshift({
      id: 's' + now.getTime(),
      scene: sceneForCamera(),
      look: Object.assign({}, state.look),
      ratio: state.camera.ratio,
      zoom: state.camera.zoom,
      kind: kind || kindForCamera(),
      label: state.lookName,
      src: src || null,
      video: !!isVideo,
      time: now.toLocaleDateString('pt-BR') + ' · ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
    });
    if (state.shots.length > 30) state.shots.length = 30;
    state.thumbPop = true;
  }

  function capture() {
    U.flash();
    U.buzz(18);

    /* com a câmera real, o quadro vai para um canvas com os mesmos
       ajustes do visor — a foto salva é o que se vê */
    var src = null;
    if (state.live) {
      src = CAM.capture({
        ratio: ratioValue(state.camera.ratio),
        zoom: state.hwZoom ? 1 : state.camera.zoom,
        filter: U.toFilter(state.look),
        tint: U.toTint(state.look),
        mirror: state.camera.front && state.settings.espelhar
      });
    }

    pushShot(null, src);
    render();
    U.toast(kindForCamera() + ' salva na galeria');
  }

  function shutter() {
    var c = state.camera;

    if (c.mode === 'video') {
      state.recording ? stopRecording() : startRecording();
      return;
    }

    if (c.mode === 'documento') {
      if (state.scanning) return;
      state.scanning = true;
      render();
      later(function () {
        state.scanning = false;
        U.flash();
        var src = state.live ? CAM.capture({
          ratio: ratioValue(c.ratio),
          zoom: state.hwZoom ? 1 : c.zoom,
          filter: U.toFilter(state.look),
          tint: U.toTint(state.look),
          mirror: c.front && state.settings.espelhar
        }) : null;
        pushShot('Documento', src);
        render();
        U.toast('Documento escaneado e salvo na galeria');
      }, 1700);
      return;
    }

    if (c.timer > 0) {
      countdown(c.timer, capture);
      return;
    }
    capture();
  }

  function countdown(seconds, done) {
    var view = U.byId('jv-view');
    if (!view) { done(); return; }
    var el = document.createElement('div');
    el.className = 'jv-count';
    view.appendChild(el);

    var left = seconds;
    function tick() {
      el.textContent = left;
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
      U.buzz(8);
      left--;
      if (left < 0) {
        el.remove();
        done();
        return;
      }
      later(tick, 1000);
    }
    tick();
  }

  var recStart = 0;
  function startRecording() {
    state.recording = true;
    recStart = Date.now();
    state.recLabel = '00:00';
    /* grava de verdade quando a câmera do aparelho está ligada */
    state.realRec = state.live && CAM.canRecord() ? CAM.startRec() : false;
    render();
    every(function () {
      if (!state.recording) return;
      var s = Math.floor((Date.now() - recStart) / 1000);
      state.recLabel = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      var el = root.querySelector('.jv-rec');
      if (el) el.textContent = state.recLabel;
    }, 1000);
  }

  function stopRecording(silent) {
    if (!state.recording) return;
    state.recording = false;

    var wasReal = state.realRec;
    state.realRec = false;

    if (wasReal) {
      var label = state.recLabel;
      CAM.stopRec().then(function (url) {
        if (silent) { if (url) URL.revokeObjectURL(url); return; }
        pushShot('Vídeo', url, !!url);
        render();
        U.toast('Vídeo de ' + label + ' salvo na galeria');
      });
      return;
    }

    if (!silent) {
      pushShot('Vídeo');
      render();
      U.toast('Vídeo de ' + state.recLabel + ' salvo na galeria');
    }
  }

  /* ---------------------------------------------------------
     Aplicar modo / configuração
  --------------------------------------------------------- */
  function useMode(id) {
    if (id === 'doc') {
      state.camera.mode = 'documento';
      state.lookName = 'Modo Documento';
      state.look = Object.assign({}, D.NEUTRAL, { contraste: 26, saturacao: -20, nitidez: 46 });
      go('camera', { force: true });
      U.toast('Modo Documento ativado');
      return;
    }
    var m = U.findMode(id);
    if (!m) return;
    state.camera.model = m.id;
    state.camera.mode = m.id === 'retrato' ? 'retrato' : 'foto';
    state.look = Object.assign({}, m.values);
    state.lookName = 'Modo ' + m.name;
    state.coachStep = 0;
    go('camera', { force: true });
    U.toast('Modo ' + m.name + ' ativado');
  }

  function usePreset(id) {
    var p = null;
    state.allPresets.forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return;
    state.look = Object.assign({}, state.draft);
    state.lookName = p.name;
    state.camera.model = sceneToMode(p.scene);
    state.camera.mode = state.camera.model === 'retrato' ? 'retrato' : 'foto';
    go('camera', { force: true });
    U.toast('"' + p.name + '" aplicada ao visor');
  }

  function sceneToMode(sceneName) {
    for (var i = 0; i < D.MODES.length; i++) if (D.MODES[i].scene === sceneName) return D.MODES[i].id;
    return 'paisagem';
  }

  /* ---------------------------------------------------------
     Folha "Sobre"
  --------------------------------------------------------- */
  function openAbout() {
    U.openSheet(
      '<div class="jv-sheet__panel">' +
        '<div class="jv-sheet__grip"></div>' +
        '<p class="jv-eyebrow">Sobre o protótipo</p>' +
        '<h2 class="jv-h2 mt-2">Jovi Câmera</h2>' +
        '<p class="text-sm text-jv-mute leading-relaxed mt-2">Jornada navegável de um app de câmera com IA: onboarding que personaliza a recomendação, modos guiados, coach de enquadramento e comunidade de configurações.</p>' +
        '<p class="text-sm text-jv-mute leading-relaxed mt-3">Construído apenas com HTML, CSS, JavaScript e Tailwind CSS. A câmera do aparelho entra pelo visor quando autorizada; sem ela, as cenas são desenhadas em CSS puro e os ajustes usam filtros CSS em tempo real.</p>' +
        '<p class="jv-live-diag mt-3">versão ' + U.esc(D.VERSION) + ' · ' + U.esc(CAM.diagnose()) + '</p>' +
        '<button class="jv-btn jv-btn--ghost jv-btn--block mt-5" data-act="sheet-close">Fechar</button>' +
      '</div>'
    );
  }

  /* ---------------------------------------------------------
     Ações (delegação de eventos)
  --------------------------------------------------------- */
  var actions = {
    goto: function (arg) {
      if (arg === 'camera') { state.aiCard = false; go('camera', { force: true }); return; }
      go(arg);
    },

    back: back,

    /* Onboarding */
    'onb-pick': function (arg) {
      var parts = arg.split('|');
      state.profile[parts[0]] = parts[1];
      render();
      U.buzz(8);
    },
    'onb-done': function () {
      state.onboarded = true;
      state.look = Object.assign({}, D.STYLE_VALUES[state.profile.estilo] || D.NEUTRAL);
      state.lookName = 'Estilo ' + state.profile.estilo;
      var target = D.GOAL_TO_MODE[state.profile.objetivo];
      if (target === 'documento') {
        state.camera.mode = 'documento';
      } else {
        state.camera.model = target || 'paisagem';
        state.camera.mode = target === 'retrato' ? 'retrato' : 'foto';
      }
      state.stack = [];
      go('home', { replace: true, force: true });
      U.toast('Tudo pronto! Sua câmera foi personalizada.');
    },
    'reset-onb': function () {
      state.stack = [];
      go('onboarding', { force: true });
    },

    /* Câmera */
    'cam-mode': function (arg) {
      if (arg === 'mais') { go('modos'); return; }
      stopRecording(true);
      state.camera.mode = arg;
      state.aiCard = false;
      state.coachStep = 0;
      if (arg === 'retrato') state.camera.model = 'retrato';
      if (arg === 'foto' && state.camera.model === 'retrato') state.camera.model = 'paisagem';
      render();
      U.buzz(10);
    },
    'live-dismiss': function () {
      state.liveDismissed = true;
      state.camError = null;
      render();
    },

    'cam-live': function () {
      if (state.live) { stopLive(); U.toast('Câmera desligada — voltando à demonstração'); return; }
      if (!CAM.usable()) { U.toast(CAM.reason()); return; }
      /* fora do visor, liga ao chegar lá: assim o fluxo nunca fica
         aberto numa tela que não mostra a imagem */
      if (state.screen !== 'camera') { state.liveWanted = true; go('camera', { force: true }); return; }
      U.toast('Abrindo a câmera…');
      startLive().then(function (ok) { if (ok) U.toast('Câmera ligada'); });
    },

    'cam-flash': function () {
      var seq = ['off', 'auto', 'on'];
      var next = seq[(seq.indexOf(state.camera.flash) + 1) % seq.length];
      state.camera.flash = next;
      applyTorch();
      render();
      var msg = 'Flash: ' + (next === 'off' ? 'desligado' : next === 'auto' ? 'automático' : 'ligado');
      if (state.live && next === 'on' && !CAM.hasTorch()) msg += ' (sem lanterna neste aparelho)';
      U.toast(msg);
    },
    'cam-hdr': function () {
      state.camera.hdr = !state.camera.hdr;
      render();
      U.toast('HDR ' + (state.camera.hdr ? 'ativado' : 'desativado'));
    },
    'cam-ai': function () {
      state.camera.ai = !state.camera.ai;
      state.aiCard = false;
      render();
      U.toast('Sugestões da IA ' + (state.camera.ai ? 'ativadas' : 'desativadas'));
    },
    'cam-ratio': function (arg) {
      var seq = ['3:4', '1:1', '9:16'];
      state.camera.ratio = arg || seq[(seq.indexOf(state.camera.ratio) + 1) % seq.length];
      render();
      U.toast('Proporção ' + state.camera.ratio);
    },
    'cam-zoom': function (arg) {
      state.camera.zoom = parseFloat(arg);
      applyZoom(state.camera.zoom);   /* usa a lente quando o aparelho permite */
      render();
    },
    'cam-timer': function (arg) {
      state.camera.timer = parseInt(arg, 10) || 0;
      render();
      U.toast(state.camera.timer ? 'Temporizador de ' + state.camera.timer + 's' : 'Temporizador desligado');
    },
    shutter: shutter,
    flip: function () {
      state.camera.front = !state.camera.front;
      render();
      U.toast(state.camera.front ? 'Câmera frontal' : 'Câmera traseira');
      if (state.live) {
        CAM.start(state.camera.front ? 'front' : 'back')
          .then(function () { applyZoom(state.camera.zoom); applyTorch(); render(); })
          .catch(function (err) { state.live = false; render(); U.toast(camError(err)); });
      }
    },
    'coach-next': function () {
      state.coachStep++;
      render();
    },
    'ai-more': function () {
      state.viewMode = sceneToMode(sceneForCamera());
      go('modo');
    },

    /* Modos */
    'mode-open': function (arg) {
      state.viewMode = arg;
      go('modo');
    },
    'mode-use': useMode,

    /* Comunidade */
    tab: function (arg) { state.tab = arg; render(); },
    cat: function (arg) { state.cat = arg; state.focusSearch = false; render(); },
    'search-clear': function () { state.query = ''; state.focusSearch = true; render(); },

    'preset-open': function (arg) {
      var p = null;
      state.allPresets.forEach(function (x) { if (x.id === arg) p = x; });
      if (!p) return;
      state.viewPreset = p;
      state.draft = Object.assign({}, p.values);
      go('preset', { force: true });
    },
    'preset-reset': function () {
      if (!state.viewPreset) return;
      state.draft = Object.assign({}, state.viewPreset.values);
      render();
      U.toast('Valores originais restaurados');
    },
    'preset-use': usePreset,

    like: function (arg) {
      var i = state.liked.indexOf(arg);
      i > -1 ? state.liked.splice(i, 1) : state.liked.push(arg);
      render();
      U.buzz(10);
      U.toast(i > -1 ? 'Curtida removida' : 'Você curtiu esta configuração');
    },
    save: function (arg) {
      var i = state.saved.indexOf(arg);
      i > -1 ? state.saved.splice(i, 1) : state.saved.push(arg);
      render();
      U.toast(i > -1 ? 'Removida das salvas' : 'Salva no seu perfil');
    },

    /* Criar configuração */
    'draft-scene': function (arg) { state.draftScene = arg; render(); },
    'draft-reset': function () { state.draft = Object.assign({}, D.NEUTRAL); render(); },
    'create-save': function () {
      var name = (U.byId('jv-name') || {}).value || '';
      var desc = (U.byId('jv-desc') || {}).value || '';
      name = name.trim();
      if (!name) {
        U.toast('Dê um nome para a sua configuração');
        var f = U.byId('jv-name');
        if (f) f.focus();
        return;
      }
      var id = 'my' + Date.now();
      state.customPresets.unshift({
        id: id,
        name: name,
        author: '@voce',
        scene: state.draftScene,
        views: '0',
        likes: 0,
        feed: ['recentes', 'seguindo'],
        tag: 'Minhas',
        mine: true,
        desc: desc.trim() || 'Configuração criada por você neste protótipo.',
        values: Object.assign({}, state.draft)
      });
      state.draftName = '';
      state.draftDesc = '';
      state.tab = 'recentes';
      state.stack = [];
      go('comunidade', { force: true });
      U.toast('"' + name + '" publicada na comunidade');
    },

    /* Galeria */
    'shot-open': function (arg) { state.viewShot = arg; go('foto', { force: true }); },
    'shot-delete': function (arg) {
      state.shots = state.shots.filter(function (s) {
        if (s.id === arg && s.video && s.src) { try { URL.revokeObjectURL(s.src); } catch (e) {} }
        return s.id !== arg;
      });
      back();
      U.toast('Captura excluída');
    },
    share: function () { U.toast('Compartilhamento indisponível no protótipo'); },

    /* Ajustes */
    toggle: function (arg) {
      state.settings[arg] = !state.settings[arg];
      render();
    },
    'look-reset': function () {
      state.look = Object.assign({}, D.STYLE_VALUES[state.profile.estilo] || D.NEUTRAL);
      state.lookName = 'Estilo ' + state.profile.estilo;
      render();
      U.toast('Aparência padrão restaurada');
    },

    /* Menus */
    'sheet-menu': function () {
      U.sheet('Ir para', [
        { act: 'goto', arg: 'home', icon: 'ic-home', label: 'Início' },
        { act: 'goto', arg: 'comunidade', icon: 'ic-users', label: 'Comunidade' },
        { act: 'goto', arg: 'galeria', icon: 'ic-image', label: 'Galeria' },
        { act: 'goto', arg: 'ajustes', icon: 'ic-gear', label: 'Ajustes da câmera' },
        { act: 'sheet-close', icon: 'ic-close', label: 'Fechar' }
      ]);
    },
    'sheet-close': U.closeSheet,
    about: openAbout
  };

  function handle(ev) {
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    var arg = el.getAttribute('data-arg');
    /* só ações declaradas: evita cair em membros herdados de Object.prototype */
    if (!Object.prototype.hasOwnProperty.call(actions, act)) return;

    /* qualquer ação vinda da folha modal fecha a folha antes de seguir */
    if (el.closest('#jv-sheet') && act !== 'sheet-close') U.closeSheet();

    ev.preventDefault();
    actions[act](arg, el, ev);
  }

  root.addEventListener('click', handle);
  U.byId('jv-sheet').addEventListener('click', function (ev) {
    if (ev.target.id === 'jv-sheet') { U.closeSheet(); return; }
    handle(ev);
  });

  /* ---------------------------------------------------------
     Teclado (facilita a navegação no desktop)
  --------------------------------------------------------- */
  document.addEventListener('keydown', function (ev) {
    var typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);

    if (ev.key === 'Escape') {
      if (U.byId('jv-sheet').classList.contains('is-on')) { U.closeSheet(); return; }
      back();
      return;
    }
    if (typing) return;

    if (state.screen === 'camera') {
      var ids = D.CAM_MODES.map(function (m) { return m.id; });
      var i = ids.indexOf(state.camera.mode);
      if (ev.key === 'ArrowRight') { ev.preventDefault(); actions['cam-mode'](ids[Math.min(ids.length - 1, i + 1)]); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); actions['cam-mode'](ids[Math.max(0, i - 1)]); }
      if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); shutter(); }
    }
  });

  window.addEventListener('resize', function () {
    if (state.screen === 'camera') centerModes();
  });

  /* ---------------------------------------------------------
     Início
  --------------------------------------------------------- */
  load();
  state.allPresets = D.PRESETS.concat(state.customPresets);

  /* Link direto para uma tela: index.html#/camera, #/comunidade, ... */
  var deep = (location.hash || '').replace(/^#\/?/, '');
  /* hasOwnProperty e não `S[deep]`: nomes herdados de Object.prototype
     ("constructor", "toString"…) passariam na checagem e quebrariam a tela */
  if (deep && Object.prototype.hasOwnProperty.call(S, deep)) {
    if (deep !== 'splash' && deep !== 'onboarding') state.onboarded = true;
    if (deep === 'preset' && !state.viewPreset) {
      state.viewPreset = D.PRESETS[0];
      state.draft = Object.assign({}, D.PRESETS[0].values);
    }
    if (deep === 'foto' && !state.shots.length) deep = 'galeria';
    if (deep === 'foto') state.viewShot = state.shots[0].id;
    state.screen = deep;
  }

  render();
  setInterval(U.clock, 30000);

  /* exposto para depuração no console */
  global.JOVI = { state: state, go: go, render: render, reset: function () { localStorage.removeItem(STORAGE_KEY); location.reload(); } };
})(window);
