/* =============================================================
   Jovi Câmera — telas
   Cada função devolve a marcação de uma tela. O roteador em
   app.js decide qual renderizar e liga os comportamentos.
   ============================================================= */
(function (global) {
  'use strict';

  var D = global.JOVI_DATA;
  var U = global.JOVI_UI;
  var esc = U.esc, icon = U.icon, scene = U.scene;

  /* ---------------------------------------------------------
     Blocos reutilizáveis
  --------------------------------------------------------- */
  function nav(active) {
    var items = [
      { id: 'home', label: 'Início', ic: 'ic-home' },
      { id: 'explorar', label: 'Explorar', ic: 'ic-search' },
      { id: 'camera', label: '', ic: 'ic-camera' },
      { id: 'comunidade', label: 'Comunidade', ic: 'ic-users' },
      { id: 'perfil', label: 'Perfil', ic: 'ic-user' }
    ];
    return '<nav class="jv-nav">' + items.map(function (it) {
      if (it.id === 'camera') {
        return '<button class="jv-nav__fab" data-act="goto" data-arg="camera" aria-label="Abrir câmera">' + icon(it.ic) + '</button>';
      }
      return '<button class="jv-nav__item ' + (active === it.id ? 'is-on' : '') + '" data-act="goto" data-arg="' + it.id + '">' +
        icon(it.ic, 'jv-ic--sm') + '<span>' + it.label + '</span></button>';
    }).join('') + '</nav>';
  }

  function appbar(opts) {
    opts = opts || {};
    return '<header class="jv-appbar">' +
      (opts.back === false ? '<span class="w-10"></span>'
        : '<button class="jv-iconbtn" data-act="back" aria-label="Voltar">' + icon(opts.arrow || 'ic-chevron-left') + '</button>') +
      '<h1 class="jv-appbar__title">' + esc(opts.title || '') + '</h1>' +
      (opts.menu === false ? '<span class="w-10"></span>'
        : '<button class="jv-iconbtn" data-act="sheet-menu" aria-label="Mais opções">' + icon('ic-dots') + '</button>') +
      '</header>';
  }

  function presetCard(p, state) {
    var liked = state.liked.indexOf(p.id) > -1;
    return '<button class="jv-preset" data-act="preset-open" data-arg="' + esc(p.id) + '">' +
      '<span class="jv-preset__art">' + scene(p.scene) + '</span>' +
      '<span class="jv-preset__info">' +
        '<span class="jv-preset__title">' + esc(p.name) + '</span>' +
        '<span class="jv-preset__author">Por ' + esc(p.author) + '</span>' +
        '<span class="jv-meta mt-2">' +
          '<span>' + icon('ic-eye', 'jv-ic--sm') + esc(p.views) + '</span>' +
          '<span class="' + (liked ? 'jv-like is-on' : '') + '">' + icon('ic-heart', 'jv-ic--sm') + (p.likes + (liked ? 1 : 0)) + '</span>' +
        '</span>' +
      '</span>' +
    '</button>';
  }

  /* Arte de uma captura: a foto ou o vídeo reais quando existirem,
     senão a cena desenhada em CSS com os ajustes aplicados. */
  function shotArt(s) {
    if (s.src && s.video) {
      return `<video class="jv-shotimg" src="${esc(s.src)}" muted playsinline loop autoplay></video>`;
    }
    if (s.src) {
      return `<img class="jv-shotimg" src="${esc(s.src)}" alt="Captura em modo ${esc(s.kind)}">`;
    }
    return `<span class="absolute inset-0" style="filter:${U.toFilter(s.look)}">${scene(s.scene)}</span>` +
           `<span class="absolute inset-0" style="background:${U.toTint(s.look).background};opacity:${U.toTint(s.look).opacity};mix-blend-mode:soft-light"></span>`;
  }

  /* Painel que explica o estado da câmera real: convite, erro com
     diagnóstico ou instrução quando o navegador bloqueia o acesso. */
  function livePanel(state) {
    var CAM = global.JOVI_CAM;
    var err = state.camError;
    var bloqueado = !CAM.usable();

    /* pedindo agora: o navegador está mostrando o aviso de permissão */
    if (state.camStarting) {
      return `
        <div class="jv-live-panel">
          <span class="jv-live-panel__ic jv-pulse">${icon('ic-camera')}</span>
          <p class="jv-live-panel__title">Abrindo a câmera…</p>
          <p class="jv-live-panel__txt">Toque em <b>Permitir</b> no aviso do navegador para usar a câmera do seu celular.</p>
        </div>`;
    }

    var titulo = err ? 'Não consegui abrir a câmera'
      : bloqueado ? 'Câmera indisponível aqui'
      : 'Ver a imagem real';
    var texto = err ? err.message
      : bloqueado ? CAM.reason()
      : 'Toque para usar a câmera do seu celular — as fotos ficam reais.';

    var dica = CAM.inAppBrowser()
      ? 'Toque no menu do app (••• ou ⇧) e escolha “Abrir no Safari” / “Abrir no navegador”.'
      : (err && err.name === 'NotAllowedError')
        ? 'Toque no ícone à esquerda da barra de endereço e libere a câmera para este site.'
        : '';

    return `
      <div class="jv-live-panel">
        <span class="jv-live-panel__ic">${icon('ic-camera')}</span>
        <p class="jv-live-panel__title">${esc(titulo)}</p>
        <p class="jv-live-panel__txt">${esc(texto)}</p>
        ${dica ? `<p class="jv-live-panel__hint">${esc(dica)}</p>` : ''}
        ${bloqueado ? '' : `<button class="jv-btn jv-btn--primary jv-btn--sm jv-btn--block mt-4" data-act="cam-live">${err ? 'Tentar de novo' : 'Ativar câmera'}</button>`}
        ${(err || bloqueado) && state.camDiag ? `<p class="jv-live-diag">${esc(state.camDiag)}</p>` : ''}
        <button class="jv-live-panel__skip" data-act="live-dismiss">Continuar na demonstração</button>
      </div>`;
  }

  function modeRow(m) {
    return '<button class="jv-row" data-act="mode-open" data-arg="' + esc(m.id) + '">' +
      '<span class="jv-tile jv-tile--' + esc(m.id) + '">' + icon(m.icon) + '</span>' +
      '<span class="jv-row__txt">' +
        '<span class="jv-row__title block">' + esc(m.name) + '</span>' +
        '<span class="jv-row__desc block">' + esc(m.short) + '</span>' +
      '</span>' +
      icon('ic-chevron-right', 'jv-row__chev') +
    '</button>';
  }

  /* ---------------------------------------------------------
     1. Splash
  --------------------------------------------------------- */
  function splash() {
    return `
      <section class="jv-screen jv-screen--dark jv-splash">
        <div class="jv-splash__logo">
          <div class="jv-splash__ring">${icon('ic-camera', 'jv-ic--lg')}</div>
          <h1 class="text-3xl font-bold tracking-tight">Jovi Câmera</h1>
          <p class="jv-sub max-w-[260px] mx-auto">Sua câmera aprende com você e ensina a fotografar melhor.</p>
          <div class="mt-8 flex justify-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-jv-amber jv-pulse"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-white/25"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-white/25"></span>
          </div>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------
     2. Onboarding
  --------------------------------------------------------- */
  function onboarding(state) {
    var blocks = D.ONBOARDING.map(function (q) {
      var current = state.profile[q.key];
      if (q.style === 'chips') {
        return `
          <div>
            <p class="jv-label">${esc(q.title)}</p>
            <div class="flex flex-wrap gap-2">
              ${q.options.map(function (o) {
                return `<button class="jv-chip ${current === o ? 'is-on' : ''}" data-act="onb-pick" data-arg="${esc(q.key)}|${esc(o)}">${esc(o)}</button>`;
              }).join('')}
            </div>
          </div>`;
      }
      return `
        <div>
          <p class="jv-label">${esc(q.title)}</p>
          <div class="jv-optlist">
            ${q.options.map(function (o) {
              return `<button class="jv-opt ${current === o ? 'is-on' : ''}" data-act="onb-pick" data-arg="${esc(q.key)}|${esc(o)}">
                        <span>${esc(o)}</span>${icon('ic-check', 'jv-ic--sm jv-opt__dot')}
                      </button>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    return `
      <section class="jv-screen">
        <header class="jv-appbar">
          <button class="jv-iconbtn" data-act="back" aria-label="Voltar">${icon('ic-arrow-left')}</button>
        </header>
        <div class="jv-body jv-scroll">
          <h1 class="jv-h1">Vamos configurar<br>sua experiência</h1>
          <p class="jv-sub mb-7">Responda algumas perguntas rápidas para personalizarmos sua câmera.</p>
          <div class="grid gap-7 jv-stagger">${blocks}</div>
          <div class="h-6"></div>
        </div>
        <div class="jv-cta">
          <button class="jv-btn jv-btn--primary jv-btn--block" data-act="onb-done">Continuar</button>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------
     3. Início
  --------------------------------------------------------- */
  /* Modo recomendado a partir do objetivo escolhido no onboarding.
     "Trabalho / Documentos" aponta para o escaneamento, que não é um
     modo da lista e por isso vira um item sintético. */
  var DOC_MODE = { id: 'doc', name: 'Documento', icon: 'ic-doc', scene: 'doc', short: 'Digitaliza papéis com bordas e contraste corrigidos.' };

  function recommended(state) {
    var goal = D.GOAL_TO_MODE[state.profile.objetivo];
    if (goal === 'documento') return DOC_MODE;
    return U.findMode(goal) || D.MODES[1];
  }

  function home(state) {
    var rec = recommended(state);
    var hour = new Date().getHours();
    var hi = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    var trending = D.PRESETS.filter(function (p) { return p.feed.indexOf('alta') > -1; }).slice(0, 2);
    var tip = D.TIPS[new Date().getDate() % D.TIPS.length];

    return `
      <section class="jv-screen">
        <div class="jv-body jv-body--pad-top jv-scroll">
          <div class="flex items-start justify-between pt-3">
            <div>
              <p class="jv-eyebrow">${esc(hi)}</p>
              <h1 class="jv-h1 mt-1">Pronto para<br>fotografar?</h1>
            </div>
            <button class="jv-iconbtn" data-act="goto" data-arg="perfil" aria-label="Perfil">${icon('ic-user')}</button>
          </div>

          <div class="jv-stagger grid gap-7 mt-7">

            <!-- Recomendação personalizada -->
            <button class="relative block w-full h-[168px] rounded-2xl overflow-hidden text-left" data-act="mode-use" data-arg="${esc(rec.id)}">
              <span class="absolute inset-0">${scene(rec.scene)}</span>
              <span class="absolute inset-0" style="background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.82))"></span>
              <span class="relative flex flex-col justify-end h-full p-4">
                <span class="jv-eyebrow text-jv-amber">Recomendado para você</span>
                <span class="flex items-center gap-3 mt-2">
                  <span class="jv-tile jv-tile--${esc(rec.id)}">${icon(rec.icon)}</span>
                  <span class="flex-1 min-w-0">
                    <span class="block text-lg font-semibold truncate">Modo ${esc(rec.name)}</span>
                    <span class="block text-xs text-white/70 mt-0.5 truncate">Combina com "${esc(state.profile.objetivo)}"</span>
                  </span>
                  <span class="jv-btn jv-btn--primary jv-btn--sm flex-none">Usar agora</span>
                </span>
              </span>
            </button>

            <!-- Atalhos -->
            <div class="grid grid-cols-4 gap-2">
              ${[
                { act: 'goto', arg: 'camera', ic: 'ic-camera', label: 'Câmera' },
                { act: 'goto', arg: 'modos', ic: 'ic-grid', label: 'Modos' },
                { act: 'goto', arg: 'comunidade', ic: 'ic-users', label: 'Comunidade' },
                { act: 'goto', arg: 'galeria', ic: 'ic-image', label: 'Galeria' }
              ].map(function (a) {
                return `<button class="jv-card flex flex-col items-center gap-2 py-3.5" data-act="${a.act}" data-arg="${a.arg}">
                          <span class="text-jv-amber">${icon(a.ic)}</span>
                          <span class="text-[11px] text-jv-mute">${a.label}</span>
                        </button>`;
              }).join('')}
            </div>

            <!-- Modos -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h2 class="jv-h2">Modos</h2>
                <button class="text-xs text-jv-amber" data-act="goto" data-arg="modos">Ver todos</button>
              </div>
              <div class="flex gap-3 overflow-x-auto jv-scroll -mx-5 px-5 pb-1">
                ${D.MODES.map(function (m) {
                  return `<button class="flex-none w-[120px] jv-card p-3 text-left" data-act="mode-open" data-arg="${esc(m.id)}">
                            <span class="jv-tile jv-tile--${esc(m.id)}">${icon(m.icon)}</span>
                            <span class="block text-sm font-semibold mt-2.5">${esc(m.name)}</span>
                            <span class="block text-[11px] text-jv-mute leading-snug mt-1">${esc(m.short.slice(0, 38))}…</span>
                          </button>`;
                }).join('')}
              </div>
            </div>

            <!-- Comunidade -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h2 class="jv-h2">Em alta na comunidade</h2>
                <button class="text-xs text-jv-amber" data-act="goto" data-arg="comunidade">Ver tudo</button>
              </div>
              <div class="grid gap-3">${trending.map(function (p) { return presetCard(p, state); }).join('')}</div>
            </div>

            <!-- Dica do dia -->
            <div class="jv-card jv-card--line p-4 flex gap-3">
              <span class="text-jv-amber mt-0.5">${icon('ic-bulb')}</span>
              <span>
                <span class="block text-sm font-semibold">Dica do dia · ${esc(tip.title)}</span>
                <span class="block text-xs text-jv-mute leading-relaxed mt-1">${esc(tip.text)}</span>
              </span>
            </div>
          </div>
          <div class="h-4"></div>
        </div>
        ${nav('home')}
      </section>`;
  }

  /* ---------------------------------------------------------
     4. Explorar
  --------------------------------------------------------- */
  function explorar(state) {
    var q = (state.query || '').toLowerCase().trim();
    var cat = state.cat || 'Todos';
    var cats = ['Todos'].concat(D.MODES.map(function (m) { return m.name; }));

    function hit(text) { return !q || text.toLowerCase().indexOf(q) > -1; }

    var modes = D.MODES.filter(function (m) {
      return (cat === 'Todos' || m.name === cat) && (hit(m.name) || hit(m.short) || hit(m.desc));
    });
    var presets = state.allPresets.filter(function (p) {
      return (cat === 'Todos' || p.tag === cat || (cat === 'Praia / Sol' && p.tag === 'Praia')) &&
        (hit(p.name) || hit(p.desc) || hit(p.author) || hit(p.tag));
    });
    var tips = cat === 'Todos' ? D.TIPS.filter(function (t) { return hit(t.title) || hit(t.text) || hit(t.tag); }) : [];
    var total = modes.length + presets.length + tips.length;

    return `
      <section class="jv-screen">
        <div class="jv-body jv-body--pad-top jv-scroll">
          <h1 class="jv-h1 pt-3">Explorar</h1>
          <p class="jv-sub mb-5">Modos, configurações e dicas para melhorar suas fotos.</p>

          <div class="jv-field mb-4">
            ${icon('ic-search', 'jv-ic--sm')}
            <input id="jv-search" type="search" placeholder="Buscar modo, configuração ou dica" value="${esc(state.query || '')}" autocomplete="off">
            ${state.query ? `<button data-act="search-clear" aria-label="Limpar busca">${icon('ic-close', 'jv-ic--sm')}</button>` : ''}
          </div>

          <div class="flex gap-2 overflow-x-auto jv-scroll -mx-5 px-5 pb-1 mb-6">
            ${cats.map(function (c) {
              return `<button class="jv-chip flex-none ${cat === c ? 'is-on' : ''}" data-act="cat" data-arg="${esc(c)}">${esc(c)}</button>`;
            }).join('')}
          </div>

          ${total === 0 ? `
            <div class="jv-empty">
              ${icon('ic-search')}
              <p class="text-sm">Nada encontrado para "<span class="text-white">${esc(state.query)}</span>".</p>
              <button class="jv-btn jv-btn--ghost jv-btn--sm mt-4" data-act="search-clear">Limpar busca</button>
            </div>` : ''}

          <div class="grid gap-7 jv-stagger">
            ${modes.length ? `
              <div>
                <h2 class="jv-h2 mb-3">Modos <span class="text-jv-mute text-sm font-normal">${modes.length}</span></h2>
                <div class="grid gap-2.5">${modes.map(modeRow).join('')}</div>
              </div>` : ''}

            ${presets.length ? `
              <div>
                <h2 class="jv-h2 mb-3">Configurações <span class="text-jv-mute text-sm font-normal">${presets.length}</span></h2>
                <div class="grid gap-3">${presets.map(function (p) { return presetCard(p, state); }).join('')}</div>
              </div>` : ''}

            ${tips.length ? `
              <div>
                <h2 class="jv-h2 mb-3">Dicas rápidas</h2>
                <div class="grid gap-2.5">
                  ${tips.map(function (t) {
                    return `<div class="jv-card p-4">
                              <span class="jv-eyebrow text-jv-amber">${esc(t.tag)}</span>
                              <p class="text-sm font-semibold mt-1.5">${esc(t.title)}</p>
                              <p class="text-xs text-jv-mute leading-relaxed mt-1">${esc(t.text)}</p>
                            </div>`;
                  }).join('')}
                </div>
              </div>` : ''}
          </div>
          <div class="h-4"></div>
        </div>
        ${nav('explorar')}
      </section>`;
  }

  /* ---------------------------------------------------------
     5. Comunidade
  --------------------------------------------------------- */
  function comunidade(state) {
    var tabs = [{ id: 'alta', label: 'Em alta' }, { id: 'recentes', label: 'Recentes' }, { id: 'seguindo', label: 'Seguindo' }];
    var list = state.allPresets.filter(function (p) { return p.feed.indexOf(state.tab) > -1; });

    return `
      <section class="jv-screen">
        ${appbar({ title: 'Comunidade' })}
        <div class="jv-body jv-scroll">
          <div class="jv-tabs mb-5">
            ${tabs.map(function (t) {
              return `<button class="jv-tab ${state.tab === t.id ? 'is-on' : ''}" data-act="tab" data-arg="${t.id}">${t.label}</button>`;
            }).join('')}
          </div>

          ${list.length ? `<div class="grid gap-3 jv-stagger">${list.map(function (p) { return presetCard(p, state); }).join('')}</div>`
            : `<div class="jv-empty">${icon('ic-users')}<p class="text-sm">Nada por aqui ainda.<br>Crie a sua primeira configuração.</p></div>`}

          <button class="jv-btn jv-btn--primary jv-btn--block mt-6" data-act="goto" data-arg="criar">
            ${icon('ic-plus', 'jv-ic--sm')} Criar configuração
          </button>
          <div class="h-4"></div>
        </div>
        ${nav('comunidade')}
      </section>`;
  }

  /* ---------------------------------------------------------
     6. Detalhe da configuração
  --------------------------------------------------------- */
  function preset(state) {
    var p = state.viewPreset;
    if (!p) return comunidade(state);
    var liked = state.liked.indexOf(p.id) > -1;
    var saved = state.saved.indexOf(p.id) > -1;
    var v = state.draft;

    return `
      <section class="jv-screen jv-screen--warm">
        <div class="jv-body jv-scroll px-0 pb-0">
          <div class="relative h-[240px]" id="jv-preset-hero">
            <div class="jv-view__inner absolute inset-0" style="filter:${U.toFilter(v)}">${scene(p.scene)}</div>
            <div class="jv-view__tint absolute inset-0" style="background:${U.toTint(v).background};opacity:${U.toTint(v).opacity}"></div>
            <div class="absolute inset-0" style="background:linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,.1) 32%,rgba(46,38,34,.92) 100%)"></div>
            <div class="jv-hero__bar absolute inset-x-0 flex items-center justify-between px-3">
              <button class="jv-iconbtn jv-iconbtn--solid" data-act="back" aria-label="Voltar">${icon('ic-arrow-left')}</button>
              <button class="jv-iconbtn jv-iconbtn--solid jv-like ${liked ? 'is-on' : ''}" data-act="like" data-arg="${esc(p.id)}" aria-label="Curtir">${icon('ic-heart')}</button>
            </div>
          </div>

          <div class="px-5 -mt-16 relative">
            <div class="flex items-start gap-3">
              <div class="flex-1">
                <h1 class="text-2xl font-bold tracking-tight">${esc(p.name)}</h1>
                <p class="text-sm text-jv-mute mt-0.5">Por ${esc(p.author)}</p>
                <div class="jv-meta mt-2">
                  <span>${icon('ic-eye', 'jv-ic--sm')}${esc(p.views)}</span>
                  <span class="${liked ? 'jv-like is-on' : ''}">${icon('ic-heart', 'jv-ic--sm')}${p.likes + (liked ? 1 : 0)}</span>
                </div>
              </div>
              <button class="jv-iconbtn jv-bookmark ${saved ? 'is-on' : ''}" data-act="save" data-arg="${esc(p.id)}" aria-label="Salvar configuração">${icon('ic-bookmark')}</button>
            </div>
            <p class="text-sm text-white/60 leading-relaxed mt-3">${esc(p.desc)}</p>

            <div class="jv-card mt-5 p-4" id="jv-preset-sliders" data-preview="#jv-preset-hero">
              <div class="flex items-center justify-between mb-1">
                <span class="jv-eyebrow">Ajustes</span>
                <span class="text-[11px] text-jv-mute">arraste para testar</span>
              </div>
              ${U.sliders(v, true)}
            </div>

            <button class="w-full text-center text-xs text-jv-mute py-4" data-act="preset-reset" data-arg="${esc(p.id)}">Restaurar valores originais</button>
          </div>
        </div>
        <div class="jv-cta">
          <button class="jv-btn jv-btn--primary jv-btn--block" data-act="preset-use" data-arg="${esc(p.id)}">Usar configuração</button>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------
     7. Modos
  --------------------------------------------------------- */
  function modos(state) {
    return `
      <section class="jv-screen jv-screen--dark">
        <header class="jv-appbar">
          <button class="jv-iconbtn" data-act="back" aria-label="Voltar">${icon('ic-arrow-left')}</button>
          <span class="flex-1"></span>
          <button class="jv-iconbtn" data-act="sheet-menu" aria-label="Mais opções">${icon('ic-dots')}</button>
        </header>
        <div class="jv-body jv-scroll">
          <h1 class="jv-h1">Modos</h1>
          <p class="jv-sub mb-6">Escolha o modo ideal para<br>cada ocasião.</p>
          <div class="grid gap-2.5 jv-stagger">
            ${D.MODES.map(modeRow).join('')}
          </div>
          <div class="h-4"></div>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------
     8. Detalhe do modo
  --------------------------------------------------------- */
  function modo(state) {
    var m = U.findMode(state.viewMode);
    if (!m) return modos(state);
    return `
      <section class="jv-screen jv-screen--dark">
        <header class="jv-appbar">
          <button class="jv-iconbtn" data-act="back" aria-label="Voltar">${icon('ic-arrow-left')}</button>
        </header>
        <div class="jv-body jv-scroll">
          <div class="flex items-center gap-3.5 jv-stagger">
            <span class="jv-tile jv-tile--lg jv-tile--${esc(m.id)}">${icon(m.icon, 'jv-ic--lg')}</span>
            <h1 class="text-3xl font-bold tracking-tight">${esc(m.name)}</h1>
          </div>

          <p class="text-[15px] text-white/85 leading-relaxed mt-7">${esc(m.desc)}</p>

          <div class="mt-7">
            <p class="text-[15px] mb-2">Melhor para:</p>
            <ul class="list-disc pl-5 grid gap-1.5 text-[14.5px] text-white/80">
              ${m.best.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('')}
            </ul>
          </div>

          <div class="mt-7">
            <p class="text-[15px] mb-2">Dicas:</p>
            <ul class="list-disc pl-5 grid gap-1.5 text-[14.5px] text-white/80">
              ${m.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('')}
            </ul>
          </div>

          <div class="jv-card mt-7 p-4">
            <span class="jv-eyebrow">Ajustes aplicados por este modo</span>
            <div class="mt-2">${U.sliders(m.values, false)}</div>
          </div>
          <div class="h-4"></div>
        </div>
        <div class="jv-cta">
          <button class="jv-btn jv-btn--primary jv-btn--block" data-act="mode-use" data-arg="${esc(m.id)}">Usar este modelo</button>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------
     9. Câmera
  --------------------------------------------------------- */
  function camera(state) {
    var c = state.camera;
    var isVideo = c.mode === 'video';
    var isDoc = c.mode === 'documento';
    var isPortrait = c.mode === 'retrato';
    var look = state.look;
    var model = U.findMode(c.model);
    var sceneName = isDoc ? 'doc' : (model ? model.scene : 'paisagem');
    var flashIcon = c.flash === 'off' ? 'ic-bolt-off' : 'ic-bolt';
    var live = state.live;
    var CAM = global.JOVI_CAM;
    /* com zoom da lente o visor não precisa (nem deve) escalar por CSS */
    var cssZoom = state.hwZoom ? 1 : (c.zoom < 1 ? 1 : c.zoom);

    /* sobreposições do visor conforme o modo */
    var overlay = '';
    if (isDoc) {
      overlay += `<div class="jv-docframe"><i></i><i></i><i></i><i></i></div>`;
      if (state.scanning) {
        overlay += `<div class="jv-scanline"></div>
          <div class="jv-hint"><p class="jv-hint__title">Escaneando…</p><p class="jv-hint__txt">Mantenha o celular parado.</p></div>`;
      } else {
        overlay += `<div class="jv-hint">
            <p class="jv-hint__title">Documento detectado</p>
            <p class="jv-hint__txt">Pressione o documento<br>para escanear.</p>
          </div>`;
      }
    } else if (isPortrait) {
      overlay += `<button class="jv-coach" data-act="coach-next">
          <span class="jv-coach__txt">${esc(model && model.coach ? model.coach[state.coachStep % model.coach.length] : '')}</span>
          <span class="jv-coach__step">${(state.coachStep % 3) + 1}/3</span>
        </button>`;
    } else if (state.aiCard && c.ai) {
      var det = D.AI_DETECT[sceneName] || D.AI_DETECT.paisagem;
      var aiTitle = live ? 'IA: ' + (model ? model.name : 'Cena') : det.title;
      var aiText = live ? D.AI_LIVE : det.text;
      var aiThumb = live
        ? `<span class="text-jv-amber">${icon('ic-sparkle', 'jv-ic--sm')}</span>`
        : `<span class="jv-aicard__thumb">${scene(sceneName)}</span>`;
      overlay += `<div class="jv-aicard">
          <div class="jv-aicard__head">${aiThumb}${esc(aiTitle)}</div>
          <p class="jv-aicard__txt">${esc(aiText)}</p>
          <button class="jv-aicard__btn" data-act="ai-more">Saber mais</button>
        </div>`;
    }

    /* estado da câmera real: painel explicativo enquanto o usuário não
       decidiu, atalho discreto depois, e a etiqueta do modelo quando ao vivo */
    var showPanel = !live && (state.camStarting || !state.liveDismissed || state.camError);
    if (showPanel) {
      overlay += livePanel(state);
    } else if (!live && CAM.usable()) {
      overlay += `<button class="jv-live-cta" data-act="cam-live">${icon('ic-camera', 'jv-ic--sm')} Usar a câmera do aparelho</button>`;
    } else if (!live) {
      overlay += `<span class="jv-live-note">${icon('ic-info', 'jv-ic--sm')} ${esc(CAM.reason())}</span>`;
    } else if (model && !isDoc && !state.aiCard) {
      overlay += `<div class="jv-badge">${icon('ic-sparkle', 'jv-ic--sm')}${esc(model.name)}</div>`;
    }
    if (state.recording) {
      overlay += `<div class="jv-rec">${state.recLabel || '00:00'}</div>`;
    }

    var zoomBar = (c.mode === 'foto' || isVideo) ? `
      <div class="absolute inset-x-0 bottom-4 flex justify-center">
        <div class="jv-zoom">
          ${[0.5, 1, 2].map(function (z) {
            return `<button class="${c.zoom === z ? 'is-on' : ''}" data-act="cam-zoom" data-arg="${z}">${z === 1 ? '1x' : String(z).replace('.', ',')}</button>`;
          }).join('')}
        </div>
      </div>` : '';

    var last = state.shots[0];

    return `
      <section class="jv-screen jv-cam">
        <div class="jv-cam__top">
          <button class="jv-cam__ctrl ${c.flash !== 'off' ? 'is-on' : ''}" data-act="cam-flash" aria-label="Flash">${icon(flashIcon)}</button>
          <button class="jv-cam__ctrl ${c.hdr ? 'is-on' : ''}" data-act="cam-hdr">${isDoc ? 'HD' : 'HDR'}</button>
          <button class="jv-cam__ctrl ${c.ai ? 'is-on' : ''}" data-act="cam-ai">IA</button>
          <button class="jv-cam__ctrl" data-act="cam-ratio" aria-label="Proporção">${icon('ic-aspect')}</button>
          <button class="jv-cam__ctrl" data-act="goto" data-arg="ajustes" aria-label="Ajustes">${icon('ic-gear')}</button>
        </div>

        <div class="jv-view" data-ratio="${esc(c.ratio)}" data-act="focus" id="jv-view">
          <div class="jv-view__inner" id="jv-inner" style="filter:${U.toFilter(look)};transform:scale(${cssZoom})${c.front ? ' scaleX(-1)' : ''}">
            ${live ? '' : scene(sceneName)}
          </div>
          <div class="jv-view__tint" style="background:${U.toTint(look).background};opacity:${U.toTint(look).opacity}"></div>
          <div class="jv-grid ${state.settings.grade ? 'is-on' : ''}"></div>
          <div class="jv-view__vig"></div>
          ${overlay}
          ${zoomBar}
        </div>

        <div class="jv-cam__bottom">
          <div class="jv-modes">
            <div class="jv-modes__track" id="jv-modes-track">
              ${D.CAM_MODES.map(function (m) {
                return `<button class="jv-modes__item ${c.mode === m.id ? 'is-on' : ''}" data-act="cam-mode" data-arg="${m.id}">${m.label}</button>`;
              }).join('')}
            </div>
          </div>

          <div class="jv-cam__actions">
            <button class="jv-thumb ${state.thumbPop ? 'jv-thumb--pop' : ''}" data-act="goto" data-arg="galeria" aria-label="Abrir galeria">
              ${last ? shotArt(last) : `<span class="absolute inset-0" style="filter:${U.toFilter(look)}">${scene(sceneName)}</span>`}
            </button>
            <button class="jv-shutter ${isVideo ? (state.recording ? 'jv-shutter--rec' : 'jv-shutter--video') : ''}"
                    data-act="shutter" aria-label="${isVideo ? 'Gravar' : 'Tirar foto'}"></button>
            <button class="jv-flipbtn ${state.camera.front ? 'is-flipped' : ''}" data-act="flip" aria-label="Virar câmera">${icon('ic-flip')}</button>
          </div>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------
     10. Galeria
  --------------------------------------------------------- */
  function galeria(state) {
    return `
      <section class="jv-screen jv-screen--dark">
        ${appbar({ title: 'Galeria', arrow: 'ic-arrow-left' })}
        <div class="jv-body jv-scroll px-0">
          ${state.shots.length ? `
            <p class="px-5 pb-3 text-xs text-jv-mute">${state.shots.length} ${state.shots.length === 1 ? 'captura' : 'capturas'} neste protótipo</p>
            <div class="jv-gal">
              ${state.shots.map(function (s) {
                return `<button class="jv-gal__cell" data-act="shot-open" data-arg="${esc(s.id)}">
                          ${shotArt(s)}
                          <span class="jv-gal__tag">${esc(s.kind)}</span>
                        </button>`;
              }).join('')}
            </div>` : `
            <div class="jv-empty">
              ${icon('ic-image')}
              <p class="text-sm">Nenhuma captura ainda.</p>
              <button class="jv-btn jv-btn--primary jv-btn--sm mt-4" data-act="goto" data-arg="camera">Abrir a câmera</button>
            </div>`}
          <div class="h-4"></div>
        </div>
        ${nav('galeria')}
      </section>`;
  }

  /* ---------------------------------------------------------
     11. Visualizador de captura
  --------------------------------------------------------- */
  function foto(state) {
    var s = null;
    for (var i = 0; i < state.shots.length; i++) if (state.shots[i].id === state.viewShot) s = state.shots[i];
    if (!s) return galeria(state);

    return `
      <section class="jv-screen jv-screen--dark">
        <header class="jv-appbar">
          <button class="jv-iconbtn" data-act="back" aria-label="Voltar">${icon('ic-arrow-left')}</button>
          <span class="jv-appbar__title">${esc(s.kind)}</span>
          <button class="jv-iconbtn" data-act="share" aria-label="Compartilhar">${icon('ic-share')}</button>
        </header>
        <div class="jv-body jv-scroll px-0">
          <div class="relative w-full" style="aspect-ratio:${s.ratio.replace(':', '/')}">
            ${s.src && s.video
              ? `<video class="jv-shotimg" src="${esc(s.src)}" controls playsinline></video>`
              : shotArt(s)}
          </div>
          <div class="px-5 pt-5">
            <p class="text-xs text-jv-mute">${esc(s.time)} · proporção ${esc(s.ratio)} · zoom ${String(s.zoom).replace('.', ',')}x${s.src ? ' · captura real' : ''}</p>
            <p class="text-lg font-semibold mt-1">${esc(s.label)}</p>
            <div class="jv-card mt-4 p-4">
              <span class="jv-eyebrow">Como esta foto foi tratada</span>
              <div class="mt-2">${U.sliders(s.look, false)}</div>
            </div>
            <div class="grid grid-cols-2 gap-3 mt-4">
              <button class="jv-btn jv-btn--ghost" data-act="share">${icon('ic-download', 'jv-ic--sm')} Salvar</button>
              <button class="jv-btn jv-btn--outline" data-act="shot-delete" data-arg="${esc(s.id)}">${icon('ic-trash', 'jv-ic--sm')} Excluir</button>
            </div>
          </div>
          <div class="h-6"></div>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------
     12. Criar configuração
  --------------------------------------------------------- */
  function criar(state) {
    var v = state.draft;
    return `
      <section class="jv-screen">
        ${appbar({ title: 'Nova configuração', menu: false, arrow: 'ic-close' })}
        <div class="jv-body jv-scroll px-0">
          <div class="relative mx-5 h-[190px] rounded-2xl overflow-hidden" id="jv-create-preview">
            <div class="jv-view__inner absolute inset-0" style="filter:${U.toFilter(v)}">${scene(state.draftScene)}</div>
            <div class="jv-view__tint absolute inset-0" style="background:${U.toTint(v).background};opacity:${U.toTint(v).opacity}"></div>
            <div class="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto jv-scroll">
              ${['paisagem', 'retrato', 'sol', 'urbano', 'noite', 'comida'].map(function (sc) {
                return `<button class="flex-none w-12 h-12 rounded-lg overflow-hidden relative ${state.draftScene === sc ? 'ring-2 ring-jv-amber' : 'ring-1 ring-white/30'}"
                          data-act="draft-scene" data-arg="${sc}" aria-label="Pré-visualizar em ${sc}">${scene(sc)}</button>`;
              }).join('')}
            </div>
          </div>

          <div class="px-5 mt-5 grid gap-3">
            <div class="jv-field"><input id="jv-name" type="text" maxlength="28" placeholder="Nome da configuração" value="${esc(state.draftName || '')}"></div>
            <div class="jv-field jv-field--area"><textarea id="jv-desc" rows="2" maxlength="120" placeholder="Descreva quando usar esta configuração">${esc(state.draftDesc || '')}</textarea></div>

            <div class="jv-card p-4" id="jv-create-sliders" data-preview="#jv-create-preview">
              <span class="jv-eyebrow">Ajustes</span>
              ${U.sliders(v, true)}
            </div>

            <button class="text-xs text-jv-mute py-2" data-act="draft-reset">Zerar todos os ajustes</button>
          </div>
          <div class="h-4"></div>
        </div>
        <div class="jv-cta">
          <button class="jv-btn jv-btn--primary jv-btn--block" data-act="create-save">Salvar configuração</button>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------
     13. Perfil
  --------------------------------------------------------- */
  function perfil(state) {
    var mine = state.allPresets.filter(function (p) { return p.mine; });
    var saved = state.allPresets.filter(function (p) { return state.saved.indexOf(p.id) > -1; });

    return `
      <section class="jv-screen">
        <div class="jv-body jv-body--pad-top jv-scroll">
          <div class="flex items-center gap-4 pt-3">
            <span class="w-16 h-16 rounded-full grid place-items-center text-xl font-bold"
                  style="background:linear-gradient(150deg,#ffc300,#ff8a00);color:#1a1300">JV</span>
            <div class="flex-1">
              <h1 class="text-xl font-bold">Você</h1>
              <p class="text-sm text-jv-mute">@voce · nível ${esc(state.profile.nivel.toLowerCase())}</p>
            </div>
            <button class="jv-iconbtn" data-act="goto" data-arg="ajustes" aria-label="Ajustes">${icon('ic-gear')}</button>
          </div>

          <div class="grid grid-cols-3 gap-2.5 mt-6">
            ${[
              { n: state.shots.length, l: 'capturas' },
              { n: mine.length, l: 'criadas' },
              { n: saved.length, l: 'salvas' }
            ].map(function (s) {
              return `<div class="jv-card py-3.5 text-center">
                        <span class="block text-xl font-bold">${s.n}</span>
                        <span class="block text-[11px] text-jv-mute mt-0.5">${s.l}</span>
                      </div>`;
            }).join('')}
          </div>

          <div class="jv-card jv-card--line p-4 mt-5">
            <div class="flex items-center justify-between">
              <span class="jv-eyebrow">Sua configuração inicial</span>
              <button class="text-xs text-jv-amber" data-act="reset-onb">Refazer</button>
            </div>
            <div class="flex flex-wrap gap-2 mt-3">
              <span class="jv-chip is-on">${esc(state.profile.nivel)}</span>
              <span class="jv-chip is-on">${esc(state.profile.objetivo)}</span>
              <span class="jv-chip is-on">${esc(state.profile.estilo)}</span>
            </div>
          </div>

          ${mine.length ? `
            <div class="mt-7">
              <h2 class="jv-h2 mb-3">Minhas configurações</h2>
              <div class="grid gap-3">${mine.map(function (p) { return presetCard(p, state); }).join('')}</div>
            </div>` : ''}

          ${saved.length ? `
            <div class="mt-7">
              <h2 class="jv-h2 mb-3">Salvas</h2>
              <div class="grid gap-3">${saved.map(function (p) { return presetCard(p, state); }).join('')}</div>
            </div>` : ''}

          <div class="mt-7 grid gap-2.5">
            <button class="jv-row" data-act="goto" data-arg="galeria">
              <span class="jv-tile jv-tile--doc">${icon('ic-image')}</span>
              <span class="jv-row__txt"><span class="jv-row__title block">Galeria</span><span class="jv-row__desc block">Suas capturas neste protótipo</span></span>
              ${icon('ic-chevron-right', 'jv-row__chev')}
            </button>
            <button class="jv-row" data-act="goto" data-arg="ajustes">
              <span class="jv-tile jv-tile--acao">${icon('ic-sliders')}</span>
              <span class="jv-row__txt"><span class="jv-row__title block">Ajustes da câmera</span><span class="jv-row__desc block">Grade, som, proporção e IA</span></span>
              ${icon('ic-chevron-right', 'jv-row__chev')}
            </button>
            <button class="jv-row" data-act="about">
              <span class="jv-tile jv-tile--praia">${icon('ic-info')}</span>
              <span class="jv-row__txt"><span class="jv-row__title block">Sobre o protótipo</span><span class="jv-row__desc block">Como esta demo foi construída</span></span>
              ${icon('ic-chevron-right', 'jv-row__chev')}
            </button>
          </div>
          <div class="h-4"></div>
        </div>
        ${nav('perfil')}
      </section>`;
  }

  /* ---------------------------------------------------------
     14. Ajustes da câmera
  --------------------------------------------------------- */
  function ajustes(state) {
    var toggles = [
      { key: 'grade', label: 'Grade de composição', desc: 'Linhas guia para a regra dos terços' },
      { key: 'som', label: 'Som do obturador', desc: 'Feedback sonoro ao disparar' },
      { key: 'espelhar', label: 'Espelhar selfies', desc: 'Salvar como você vê no visor' },
      { key: 'local', label: 'Salvar localização', desc: 'Guardar onde a foto foi feita' },
      { key: 'iaAuto', label: 'IA sempre ativa', desc: 'Detectar a cena automaticamente' }
    ];

    var privacidade = [
      { key: 'guardarFotos', label: 'Guardar fotos neste navegador', desc: 'Desligado, as capturas somem ao recarregar a página' }
    ];

    return `
      <section class="jv-screen">
        ${appbar({ title: 'Ajustes', menu: false })}
        <div class="jv-body jv-scroll">
          <p class="jv-eyebrow mb-3">Câmera do aparelho</p>
          <button class="jv-row" data-act="cam-live" ${global.JOVI_CAM.usable() ? '' : 'disabled'}>
            <span class="jv-tile jv-tile--paisagem">${icon('ic-camera')}</span>
            <span class="jv-row__txt">
              <span class="jv-row__title block">Usar a câmera real</span>
              <span class="jv-row__desc block">${global.JOVI_CAM.usable()
                ? 'Mostra a imagem da câmera no visor e salva fotos de verdade'
                : esc(global.JOVI_CAM.reason())}</span>
            </span>
            <span class="jv-switch ${state.live ? 'is-on' : ''}"></span>
          </button>

          <p class="jv-eyebrow mt-7 mb-3">Captura</p>
          <div class="grid gap-2.5">
            ${toggles.map(function (t) {
              return `<button class="jv-row" data-act="toggle" data-arg="${t.key}">
                        <span class="jv-row__txt">
                          <span class="jv-row__title block">${t.label}</span>
                          <span class="jv-row__desc block">${t.desc}</span>
                        </span>
                        <span class="jv-switch ${state.settings[t.key] ? 'is-on' : ''}"></span>
                      </button>`;
            }).join('')}
          </div>

          <p class="jv-eyebrow mt-7 mb-3">Privacidade</p>
          <div class="grid gap-2.5">
            ${privacidade.map(function (t) {
              return `<button class="jv-row" data-act="toggle" data-arg="${t.key}">
                        <span class="jv-row__txt">
                          <span class="jv-row__title block">${t.label}</span>
                          <span class="jv-row__desc block">${t.desc}</span>
                        </span>
                        <span class="jv-switch ${state.settings[t.key] ? 'is-on' : ''}"></span>
                      </button>`;
            }).join('')}
          </div>
          <p class="text-[11px] text-jv-mute leading-relaxed mt-2.5">
            As fotos ficam sempre no aparelho — o app não faz nenhuma chamada de rede.
            Esta opção decide apenas se elas continuam guardadas ao fechar a página.
          </p>

          <p class="jv-eyebrow mt-7 mb-3">Proporção da foto</p>
          <div class="flex gap-2">
            ${['3:4', '1:1', '9:16'].map(function (r) {
              return `<button class="jv-chip ${state.camera.ratio === r ? 'is-on' : ''}" data-act="cam-ratio" data-arg="${r}">${r}</button>`;
            }).join('')}
          </div>

          <p class="jv-eyebrow mt-7 mb-3">Temporizador</p>
          <div class="flex gap-2">
            ${[0, 3, 10].map(function (t) {
              return `<button class="jv-chip ${state.camera.timer === t ? 'is-on' : ''}" data-act="cam-timer" data-arg="${t}">${t === 0 ? 'Desligado' : t + 's'}</button>`;
            }).join('')}
          </div>

          <p class="jv-eyebrow mt-7 mb-3">Aparência aplicada ao visor</p>
          <div class="jv-card p-4">
            <p class="text-sm text-jv-mute mb-1">${esc(state.lookName)}</p>
            ${U.sliders(state.look, false)}
            <button class="jv-btn jv-btn--ghost jv-btn--sm jv-btn--block mt-3" data-act="look-reset">Voltar ao padrão do estilo</button>
          </div>

          <div class="h-4"></div>
        </div>
      </section>`;
  }

  global.JOVI_SCREENS = {
    splash: splash,
    onboarding: onboarding,
    home: home,
    explorar: explorar,
    comunidade: comunidade,
    preset: preset,
    modos: modos,
    modo: modo,
    camera: camera,
    galeria: galeria,
    foto: foto,
    criar: criar,
    perfil: perfil,
    ajustes: ajustes
  };
})(window);
