/* =============================================================
   Jovi Câmera — dados do protótipo
   Conteúdo estático que alimenta as telas (modos, configurações
   da comunidade, dicas do coach e perguntas do onboarding).
   ============================================================= */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------
     Modos / modelos de captura
  --------------------------------------------------------- */
  var MODES = [
    {
      id: 'retrato',
      name: 'Retrato',
      icon: 'ic-person',
      scene: 'retrato',
      short: 'Ideal para fotos de pessoas com desfoque no fundo.',
      desc: 'Ideal para fotos de pessoas, com desfoque de fundo e foco no rosto.',
      best: ['Ensaios pessoais', 'Fotos de perfil', 'Fotos de amigos e família'],
      tips: ['Fique a 1-2 metros do objeto', 'Use luz natural sempre que possível', 'Ative o modo retrato'],
      coach: [
        'Incline levemente a cabeça para o lado esquerdo.',
        'Afaste o fundo: dois passos à frente já criam desfoque.',
        'Deixe a luz vir de frente, um pouco acima dos olhos.'
      ],
      values: { exposicao: 0.1, contraste: 5, saturacao: 5, temperatura: 8, nitidez: 20 }
    },
    {
      id: 'paisagem',
      name: 'Paisagem',
      icon: 'ic-mountain',
      scene: 'paisagem',
      short: 'Cores vibrantes e nitidez para paisagens incríveis.',
      desc: 'Amplia a faixa de cores e mantém tudo em foco, do primeiro plano ao horizonte.',
      best: ['Montanhas e trilhas', 'Praias e cachoeiras', 'Fotos de viagem'],
      tips: ['Mantenha o horizonte reto', 'Use a grade para aplicar a regra dos terços', 'Fotografe no início da manhã ou fim da tarde'],
      coach: [
        'Alinhe o horizonte com a linha da grade.',
        'Coloque uma pedra ou árvore no primeiro plano.',
        'Aguarde o vento parar para congelar a água.'
      ],
      values: { exposicao: -0.2, contraste: 15, saturacao: 25, temperatura: -5, nitidez: 30 }
    },
    {
      id: 'noite',
      name: 'Noite',
      icon: 'ic-moon',
      scene: 'noite',
      short: 'Melhor captura com pouca luz, com menos ruído.',
      desc: 'Combina várias fotos em sequência para clarear a cena sem estourar as luzes.',
      best: ['Cidade à noite', 'Céu estrelado', 'Ambientes internos escuros'],
      tips: ['Apoie o celular em algo firme', 'Segure por 3 segundos após o disparo', 'Evite o zoom digital'],
      coach: [
        'Segure firme: a captura leva 3 segundos.',
        'Apoie os cotovelos no corpo para reduzir tremidas.',
        'Procure uma fonte de luz para dar profundidade.'
      ],
      values: { exposicao: 0.6, contraste: -5, saturacao: -5, temperatura: -12, nitidez: 10 }
    },
    {
      id: 'comida',
      name: 'Comida',
      icon: 'ic-food',
      scene: 'comida',
      short: 'Cores reais e detalhes para fotos de comidas.',
      desc: 'Realça texturas e mantém as cores fiéis, sem deixar o prato amarelado.',
      best: ['Pratos em restaurantes', 'Receitas para redes sociais', 'Cardápios'],
      tips: ['Fotografe de cima ou a 45°', 'Aproveite a luz da janela', 'Limpe as bordas do prato'],
      coach: [
        'Suba um pouco o celular: 45° valoriza o prato.',
        'Gire o prato até a parte mais bonita ficar à frente.',
        'Evite a sombra do próprio celular sobre a comida.'
      ],
      values: { exposicao: 0.2, contraste: 12, saturacao: 18, temperatura: 6, nitidez: 35 }
    },
    {
      id: 'acao',
      name: 'Ação',
      icon: 'ic-run',
      scene: 'acao',
      short: 'Captura movimentos com mais nitidez.',
      desc: 'Usa velocidade alta de obturador para congelar o movimento sem borrar.',
      best: ['Esportes', 'Crianças e pets', 'Shows e eventos'],
      tips: ['Acompanhe o movimento com o celular', 'Dispare em rajada segurando o botão', 'Prefira lugares bem iluminados'],
      coach: [
        'Acompanhe o movimento antes de disparar.',
        'Segure o botão para capturar em rajada.',
        'Deixe espaço à frente de quem se move.'
      ],
      values: { exposicao: 0.1, contraste: 18, saturacao: 8, temperatura: 0, nitidez: 45 }
    },
    {
      id: 'praia',
      name: 'Praia / Sol',
      icon: 'ic-sun',
      scene: 'praia',
      short: 'Cores vivas e exposição perfeita para dias de sol.',
      desc: 'Controla o excesso de luz para o céu não ficar branco e a areia não estourar.',
      best: ['Dias de sol forte', 'Mar e piscina', 'Fotos ao ar livre'],
      tips: ['Deixe o sol atrás de você', 'Reduza a exposição em -0,3', 'Use a sombra como moldura'],
      coach: [
        'Vire de costas para o sol para iluminar o rosto.',
        'Reduza a exposição para o céu não estourar.',
        'Inclua uma faixa de areia no primeiro plano.'
      ],
      values: { exposicao: -0.4, contraste: 14, saturacao: 22, temperatura: 4, nitidez: 25 }
    }
  ];

  /* ---------------------------------------------------------
     Modos da barra da câmera (faixa inferior)
  --------------------------------------------------------- */
  var CAM_MODES = [
    { id: 'video', label: 'VÍDEO' },
    { id: 'foto', label: 'FOTO' },
    { id: 'retrato', label: 'RETRATO' },
    { id: 'documento', label: 'DOCUMENTO' },
    { id: 'mais', label: 'MAIS' }
  ];

  /* ---------------------------------------------------------
     Configurações da comunidade
  --------------------------------------------------------- */
  var PRESETS = [
    {
      id: 'por-do-sol',
      name: 'Pôr do Sol Perfeito',
      author: '@fotografo',
      scene: 'sol',
      views: '234,8k',
      likes: 345,
      feed: ['alta', 'seguindo'],
      tag: 'Paisagem',
      desc: 'Configuração ideal para capturar as cores intensas do pôr do sol.',
      values: { exposicao: -0.3, contraste: 10, saturacao: 20, temperatura: 5, nitidez: 15 }
    },
    {
      id: 'vibes-urbanas',
      name: 'Vibes Urbanas',
      author: '@fotografo',
      scene: 'urbano',
      views: '234,8k',
      likes: 345,
      feed: ['alta', 'recentes'],
      tag: 'Cidade',
      desc: 'Contraste alto e cores frias para fotos de rua com clima de filme.',
      values: { exposicao: -0.1, contraste: 28, saturacao: -12, temperatura: -18, nitidez: 40 }
    },
    {
      id: 'retrato-pro',
      name: 'Retrato Profissional',
      author: '@fotografo',
      scene: 'retrato',
      views: '234,8k',
      likes: 345,
      feed: ['alta', 'seguindo'],
      tag: 'Retrato',
      desc: 'Pele natural, fundo suave e um leve calor para valorizar o rosto.',
      values: { exposicao: 0.2, contraste: 6, saturacao: 4, temperatura: 12, nitidez: 18 }
    },
    {
      id: 'noite-cine',
      name: 'Noite Cinematográfica',
      author: '@fotografo',
      scene: 'noite',
      views: '234,8k',
      likes: 345,
      feed: ['alta', 'recentes'],
      tag: 'Noite',
      desc: 'Sombras profundas e luzes âmbar para cenas noturnas com clima de cinema.',
      values: { exposicao: 0.4, contraste: 22, saturacao: -6, temperatura: -14, nitidez: 12 }
    },
    {
      id: 'verde-tropical',
      name: 'Verde Tropical',
      author: '@marina.f',
      scene: 'paisagem',
      views: '98,2k',
      likes: 187,
      feed: ['recentes'],
      tag: 'Paisagem',
      desc: 'Verdes mais vivos e sombras abertas para trilhas e cachoeiras.',
      values: { exposicao: 0.1, contraste: 12, saturacao: 34, temperatura: -8, nitidez: 28 }
    },
    {
      id: 'mesa-posta',
      name: 'Mesa Posta',
      author: '@chef.duda',
      scene: 'comida',
      views: '61,4k',
      likes: 122,
      feed: ['recentes', 'seguindo'],
      tag: 'Comida',
      desc: 'Cores fiéis e textura realçada para pratos ficarem apetitosos.',
      values: { exposicao: 0.25, contraste: 10, saturacao: 16, temperatura: 8, nitidez: 44 }
    }
  ];

  /* ---------------------------------------------------------
     Parâmetros de ajuste (sliders)
  --------------------------------------------------------- */
  var ADJUSTS = [
    { key: 'exposicao', name: 'Exposição', min: -2, max: 2, step: 0.1, decimals: 1 },
    { key: 'contraste', name: 'Contraste', min: -50, max: 50, step: 1, decimals: 0 },
    { key: 'saturacao', name: 'Saturação', min: -50, max: 50, step: 1, decimals: 0 },
    { key: 'temperatura', name: 'Temperatura', min: -50, max: 50, step: 1, decimals: 0 },
    { key: 'nitidez', name: 'Nitidez', min: -50, max: 50, step: 1, decimals: 0 }
  ];

  var NEUTRAL = { exposicao: 0, contraste: 0, saturacao: 0, temperatura: 0, nitidez: 0 };

  /* ---------------------------------------------------------
     Onboarding
  --------------------------------------------------------- */
  var ONBOARDING = [
    {
      key: 'nivel',
      title: 'Qual seu nível de experiência?',
      style: 'chips',
      options: ['Iniciante', 'Intermediário', 'Avançado']
    },
    {
      key: 'objetivo',
      title: 'Qual seu objetivo principal?',
      style: 'list',
      options: ['Fotos do dia a dia', 'Retratos', 'Viagens', 'Trabalho / Documentos', 'Conteúdos para redes sociais']
    },
    {
      key: 'estilo',
      title: 'Qual estilo você prefere?',
      style: 'list',
      options: ['Natural', 'Vibrante', 'Escuro / Dramático', 'Preto e branco']
    }
  ];

  /* Objetivo escolhido -> modo recomendado */
  var GOAL_TO_MODE = {
    'Fotos do dia a dia': 'paisagem',
    'Retratos': 'retrato',
    'Viagens': 'paisagem',
    'Trabalho / Documentos': 'documento',
    'Conteúdos para redes sociais': 'comida'
  };

  /* Estilo escolhido -> ajuste base aplicado no visor */
  var STYLE_VALUES = {
    'Natural': { exposicao: 0, contraste: 4, saturacao: 4, temperatura: 0, nitidez: 12 },
    'Vibrante': { exposicao: 0.15, contraste: 18, saturacao: 32, temperatura: 6, nitidez: 26 },
    'Escuro / Dramático': { exposicao: -0.4, contraste: 30, saturacao: -10, temperatura: -12, nitidez: 20 },
    'Preto e branco': { exposicao: 0, contraste: 24, saturacao: -50, temperatura: 0, nitidez: 30 }
  };

  /* ---------------------------------------------------------
     Dicas rápidas (home / explorar)
  --------------------------------------------------------- */
  var TIPS = [
    { id: 't1', title: 'Regra dos terços', text: 'Ative a grade e posicione o assunto nos cruzamentos das linhas — a foto ganha equilíbrio na hora.', tag: 'Composição' },
    { id: 't2', title: 'Toque para focar', text: 'Toque no visor sobre o assunto antes de disparar. O foco e a exposição se ajustam ao ponto escolhido.', tag: 'Básico' },
    { id: 't3', title: 'Luz da janela', text: 'Coloque a pessoa de lado para a janela: é a luz mais bonita e gratuita que existe.', tag: 'Iluminação' },
    { id: 't4', title: 'Menos zoom, mais passos', text: 'O zoom digital corta pixels. Sempre que puder, aproxime-se do assunto.', tag: 'Nitidez' }
  ];

  /* Texto da IA quando a câmera real está ligada: aqui a cena é a de
     verdade, então a mensagem fala dos ajustes, não do conteúdo. */
  var AI_LIVE = 'Ajustamos exposição, cor e nitidez para este tipo de cena.';

  /* Detecções simuladas da IA por cena (modo demonstração) */
  var AI_DETECT = {
    paisagem: { title: 'IA: Paisagem', text: 'Céu limpo, montanhas e água. Detectamos o melhor modo para sua foto.' },
    retrato: { title: 'IA: Retrato', text: 'Rosto detectado a 1,2 m. Sugerimos desfoque de fundo médio.' },
    noite: { title: 'IA: Noite', text: 'Pouca luz detectada. Vamos combinar 3 capturas para reduzir o ruído.' },
    comida: { title: 'IA: Comida', text: 'Prato detectado. Ajustamos as cores para ficarem fiéis ao real.' },
    acao: { title: 'IA: Ação', text: 'Movimento rápido no quadro. Aumentamos a velocidade do obturador.' },
    praia: { title: 'IA: Praia / Sol', text: 'Luz forte e céu aberto. Reduzimos a exposição para preservar o céu.' },
    urbano: { title: 'IA: Cidade', text: 'Linhas retas e prédios. Sugerimos a grade para alinhar o enquadramento.' },
    sol: { title: 'IA: Pôr do sol', text: 'Céu alaranjado detectado. Realçamos as cores quentes da cena.' }
  };

  /* Marcador de versão: aparece em "Sobre o protótipo" e ajuda a saber
     se o navegador está mostrando a versão nova ou uma guardada em cache. */
  var VERSION = '4 · câmera automática';

  global.JOVI_DATA = {
    VERSION: VERSION,
    MODES: MODES,
    CAM_MODES: CAM_MODES,
    PRESETS: PRESETS,
    ADJUSTS: ADJUSTS,
    NEUTRAL: NEUTRAL,
    ONBOARDING: ONBOARDING,
    GOAL_TO_MODE: GOAL_TO_MODE,
    STYLE_VALUES: STYLE_VALUES,
    TIPS: TIPS,
    AI_DETECT: AI_DETECT,
    AI_LIVE: AI_LIVE
  };
})(window);
