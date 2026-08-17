/* =============================================================
   Jovi Câmera — acesso à câmera do aparelho
   Encapsula getUserMedia, a captura em canvas (com os mesmos
   ajustes aplicados no visor) e a gravação de vídeo.
   Se a câmera não estiver disponível, o app segue com as cenas
   desenhadas em CSS — nada aqui é obrigatório para navegar.
   ============================================================= */
(function (global) {
  'use strict';

  var video = null;
  var stream = null;
  var track = null;
  var caps = {};
  var recorder = null;
  var chunks = [];

  /* ---------------------------------------------------------
     Disponibilidade
  --------------------------------------------------------- */
  function supported() {
    return !!(global.navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  function secure() {
    /* file:// não é contexto seguro: o navegador bloqueia a câmera */
    return global.isSecureContext !== false;
  }

  function usable() { return supported() && secure(); }

  /* Navegadores embutidos em apps (WhatsApp, Instagram, Facebook…) costumam
     bloquear a câmera. No iOS eles se identificam como "Mobile/" sem
     "Safari/", que é o jeito prático de reconhecê-los. */
  function inAppBrowser() {
    var ua = navigator.userAgent || '';
    if (/FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|MicroMessenger|Snapchat|TikTok/i.test(ua)) return true;
    var ios = /iPhone|iPad|iPod/i.test(ua);
    if (ios && /Mobile\//.test(ua) && !/Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)) return true;
    return false;
  }

  function reason() {
    if (!supported()) return 'Este navegador não permite acesso à câmera.';
    if (!secure()) return 'Abra o site por HTTPS para usar a câmera.';
    if (inAppBrowser()) return 'Abra no Safari ou no Chrome: o navegador embutido do app bloqueia a câmera.';
    return '';
  }

  /* Quantas câmeras o navegador enxerga (antes da permissão os nomes vêm
     vazios, mas a contagem já ajuda a diagnosticar). */
  function countCameras() {
    if (!supported() || !navigator.mediaDevices.enumerateDevices) return Promise.resolve(-1);
    return navigator.mediaDevices.enumerateDevices()
      .then(function (list) {
        return list.filter(function (d) { return d.kind === 'videoinput'; }).length;
      })
      .catch(function () { return -1; });
  }

  /* Linha curta de diagnóstico, mostrada quando algo dá errado */
  function diagnose(cameras) {
    var ua = navigator.userAgent || '';
    var nav = /CriOS/i.test(ua) ? 'Chrome iOS'
      : /FxiOS/i.test(ua) ? 'Firefox iOS'
      : /EdgiOS/i.test(ua) ? 'Edge iOS'
      : inAppBrowser() ? 'navegador de app'
      : /Safari\//i.test(ua) && /Mobile\//.test(ua) ? 'Safari iOS'
      : /Chrome\//i.test(ua) ? 'Chrome'
      : /Safari\//i.test(ua) ? 'Safari'
      : 'navegador desconhecido';
    var parts = [nav, location.protocol.replace(':', '')];
    parts.push(secure() ? 'contexto seguro' : 'contexto inseguro');
    if (typeof cameras === 'number' && cameras >= 0) parts.push(cameras + ' câmera(s) visível(is)');
    return parts.join(' · ');
  }

  function isActive() { return !!(stream && track && track.readyState === 'live'); }

  /* ---------------------------------------------------------
     Elemento de vídeo (criado uma única vez e reaproveitado
     entre renderizações, para o fluxo não reiniciar)
  --------------------------------------------------------- */
  function element() {
    if (video) return video;
    video = document.createElement('video');
    video.className = 'jv-video';
    video.setAttribute('playsinline', '');   /* essencial no iOS */
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.muted = true;
    return video;
  }

  function attach(container) {
    if (!container || !video) return;
    if (video.parentNode !== container) container.appendChild(video);
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado: ignora */ });
  }

  /* ---------------------------------------------------------
     Liga / desliga
  --------------------------------------------------------- */
  /* Tenta as restrições em ordem, da mais desejável para a mais permissiva.
     Erro de permissão não adianta repetir com outras restrições. */
  function tryConstraints(list, i) {
    i = i || 0;
    return navigator.mediaDevices.getUserMedia(list[i]).catch(function (err) {
      var permissao = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      if (permissao || i >= list.length - 1) throw err;
      return tryConstraints(list, i + 1);
    });
  }

  var LIMITE_MS = 15000;

  function start(facing) {
    if (!usable()) return Promise.reject(new Error(reason()));

    stopTracks();
    element();

    var wanted = facing === 'front' ? 'user' : 'environment';
    var lista = [
      { audio: false, video: { facingMode: { ideal: wanted }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
      { audio: false, video: { facingMode: wanted } },
      { audio: false, video: true }
    ];

    return new Promise(function (resolve, reject) {
      var expirou = false;

      /* sem isto o app pode ficar preso em "abrindo a câmera" para sempre:
         há navegadores em que a promessa simplesmente nunca se resolve */
      var timer = setTimeout(function () {
        expirou = true;
        var e = new Error('A câmera não respondeu. Feche outros apps que possam estar usando a câmera e tente de novo.');
        e.name = 'TimeoutError';
        reject(e);
      }, LIMITE_MS);

      tryConstraints(lista).then(function (s) {
        if (expirou) {
          /* chegou tarde: descarta para não deixar a câmera ligada */
          s.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
          return;
        }
        clearTimeout(timer);
        stream = s;
        track = s.getVideoTracks()[0] || null;
        caps = (track && track.getCapabilities) ? (track.getCapabilities() || {}) : {};
        video.srcObject = s;
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
        resolve(true);
      }, function (err) {
        if (expirou) return;
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function stopTracks() {
    if (recorder && recorder.state === 'recording') { try { recorder.stop(); } catch (e) {} }
    recorder = null;
    if (stream) stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
    stream = null;
    track = null;
    caps = {};
    if (video) video.srcObject = null;
  }

  function stop() {
    stopTracks();
    if (video && video.parentNode) video.parentNode.removeChild(video);
  }

  /* ---------------------------------------------------------
     Recursos de hardware (quando o aparelho oferece)
  --------------------------------------------------------- */
  function hasTorch() { return !!caps.torch; }
  function hasZoom() { return !!(caps.zoom && caps.zoom.max > caps.zoom.min); }

  function setTorch(on) {
    if (!track || !hasTorch()) return false;
    try { track.applyConstraints({ advanced: [{ torch: !!on }] }); return true; }
    catch (e) { return false; }
  }

  /* Devolve true se o zoom foi feito na lente; false para o app
     cair no zoom por CSS. */
  function setZoom(z) {
    if (!track || !hasZoom()) return false;
    var min = caps.zoom.min, max = caps.zoom.max;
    var target = z <= 0.5 ? min : Math.min(max, Math.max(min, z));
    try { track.applyConstraints({ advanced: [{ zoom: target }] }); return true; }
    catch (e) { return false; }
  }

  /* ---------------------------------------------------------
     Captura de foto
     Recorta o quadro na proporção do visor, aplica os mesmos
     filtros dos ajustes e devolve um JPEG em data URL.
  --------------------------------------------------------- */
  function capture(opts) {
    opts = opts || {};
    if (!video || !video.videoWidth) return null;

    var vw = video.videoWidth, vh = video.videoHeight;
    var target = opts.ratio || 3 / 4;          /* largura ÷ altura */

    var sw = vw, sh = vh;
    if (vw / vh > target) sw = vh * target; else sh = vw / target;

    var z = Math.max(1, opts.zoom || 1);       /* o zoom por CSS recorta mais */
    sw /= z; sh /= z;

    var sx = (vw - sw) / 2;
    var sy = (vh - sh) / 2;

    var outW = Math.min(1000, Math.round(sw));
    var outH = Math.round(outW / target);

    var canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    var ctx = canvas.getContext('2d');

    if (opts.filter && 'filter' in ctx) ctx.filter = opts.filter;
    if (opts.mirror) { ctx.translate(outW, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if ('filter' in ctx) ctx.filter = 'none';

    /* temperatura de cor: mesma camada usada no visor */
    var tint = opts.tint;
    if (tint && parseFloat(tint.opacity) > 0) {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = parseFloat(tint.opacity);
      ctx.fillStyle = tint.background;
      ctx.fillRect(0, 0, outW, outH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    try { return canvas.toDataURL('image/jpeg', 0.78); }
    catch (e) { return null; }
  }

  /* ---------------------------------------------------------
     Gravação de vídeo (sem áudio, para não pedir o microfone)
  --------------------------------------------------------- */
  var MIMES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];

  function canRecord() {
    return isActive() && typeof global.MediaRecorder === 'function';
  }

  function startRec() {
    if (!canRecord()) return false;
    var mime = '';
    for (var i = 0; i < MIMES.length; i++) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(MIMES[i])) { mime = MIMES[i]; break; }
    }
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (e) { return false; }

    chunks = [];
    recorder.ondataavailable = function (ev) { if (ev.data && ev.data.size) chunks.push(ev.data); };
    recorder.start();
    return true;
  }

  function stopRec() {
    return new Promise(function (resolve) {
      if (!recorder || recorder.state !== 'recording') { resolve(null); return; }
      recorder.onstop = function () {
        var type = recorder.mimeType || 'video/mp4';
        var blob = new Blob(chunks, { type: type });
        chunks = [];
        recorder = null;
        resolve(blob.size ? URL.createObjectURL(blob) : null);
      };
      try { recorder.stop(); } catch (e) { recorder = null; resolve(null); }
    });
  }

  global.JOVI_CAM = {
    supported: supported,
    secure: secure,
    usable: usable,
    reason: reason,
    inAppBrowser: inAppBrowser,
    countCameras: countCameras,
    diagnose: diagnose,
    isActive: isActive,
    element: element,
    attach: attach,
    start: start,
    stop: stop,
    hasTorch: hasTorch,
    hasZoom: hasZoom,
    setTorch: setTorch,
    setZoom: setZoom,
    capture: capture,
    canRecord: canRecord,
    startRec: startRec,
    stopRec: stopRec
  };
})(window);
