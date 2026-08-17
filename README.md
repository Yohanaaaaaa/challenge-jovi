# Jovi Câmera

Protótipo navegável de um app de câmera com IA: o onboarding personaliza o app,
a câmera sugere o modo pela cena, um coach orienta o enquadramento em tempo real
e a comunidade compartilha configurações que podem ser aplicadas no visor na hora.

Feito **apenas com HTML, CSS, JavaScript e Tailwind CSS** — sem build, sem
frameworks de JS, sem imagens externas.

---

## Como executar

Abra o arquivo `index.html` no navegador (duplo clique já funciona).
Não há instalação nem etapa de build.

> O Tailwind é carregado por CDN, então a primeira abertura precisa de internet.
> Todo o resto — layout, componentes, animações e as “fotos” — está em
> `css/styles.css`, que é local.

Para reiniciar o protótipo do zero (limpa o onboarding, as capturas e as
configurações criadas), rode no console do navegador:

```js
JOVI.reset()
```

---

## Tecnologias

| Item | Uso |
| --- | --- |
| **HTML** | Estrutura da página, moldura do dispositivo e biblioteca de ícones em SVG inline |
| **CSS** | Identidade visual, componentes, animações, responsividade e as cenas em CSS art |
| **Tailwind CSS** | Utilitários de layout, espaçamento e tipografia na marcação |
| **JavaScript** | Estado, roteador entre telas, comportamento da câmera e persistência |

Nada além disso é usado: sem React, sem jQuery, sem bibliotecas de ícones,
sem imagens ou fontes externas.

---

## Estrutura

```
challenge-jovi/
├── index.html          moldura do app, ícones SVG e painel lateral (desktop)
├── css/
│   └── styles.css      tokens, componentes, câmera, cenas em CSS art, animações
└── js/
    ├── data.js         modos, configurações da comunidade, dicas, onboarding
    ├── ui.js           helpers de marcação, cenas, filtros, toast e folha modal
    ├── screens.js      as 14 telas do app (cada uma devolve sua marcação)
    └── app.js          estado, roteador, ações e lógica da câmera
```

Os scripts são carregados como scripts clássicos (sem `type="module"`), de
propósito: assim o `index.html` funciona ao ser aberto direto do disco, sem
precisar de servidor local.

---

## A jornada

1. **Splash → Onboarding** — três perguntas (nível, objetivo, estilo) definem
   o modo recomendado e a aparência inicial aplicada ao visor.
2. **Início** — recomendação personalizada, atalhos, modos, destaques da
   comunidade e dica do dia.
3. **Câmera** — visor com modos VÍDEO, FOTO, RETRATO, DOCUMENTO e MAIS.
4. **Modos** — lista dos seis modelos, cada um com tela de detalhe explicando
   quando usar, dicas e os ajustes que aplica.
5. **Comunidade** — abas Em alta / Recentes / Seguindo, detalhe da configuração
   com sliders e criação de configuração própria.
6. **Galeria e Perfil** — capturas feitas no protótipo, configurações criadas e
   salvas, e os ajustes da câmera.

### O que cada modo da câmera faz

| Modo | Comportamento |
| --- | --- |
| **FOTO** | Após um instante, a IA detecta a cena e sugere o modo ideal (“Saber mais” abre o detalhe). Barra de zoom 0,5 / 1x / 2. |
| **RETRATO** | Coach de enquadramento com dicas que avançam sozinhas (1/3, 2/3, 3/3) ou ao toque. |
| **DOCUMENTO** | Detecta o documento com as marcações de canto; ao disparar, roda a animação de escaneio e salva. |
| **VÍDEO** | O botão vira gravação, com cronômetro e indicador piscando. |
| **MAIS** | Abre a tela de Modos. |

---

## Detalhes de implementação

**As “fotos” são desenhadas em CSS.** Não há nenhuma imagem no projeto: cada
cena (paisagem, retrato, pôr do sol, cidade, noite, comida, ação, praia e
documento) é montada com gradientes, `clip-path`, `border-radius` e `filter`
em camadas — veja a seção *Cenas em CSS art* de `css/styles.css`. Isso mantém o
protótipo autocontido e faz as miniaturas, o visor e as prévias usarem
exatamente o mesmo desenho.

**Os sliders alteram a imagem de verdade.** Cada ajuste vira filtro CSS
aplicado ao visor em tempo real (`js/ui.js` → `toFilter` / `toTint`):

| Ajuste | Tradução |
| --- | --- |
| Exposição | `brightness()` |
| Contraste | `contrast()` |
| Saturação | `saturate()` — em -50 a imagem fica preto e branco |
| Temperatura | camada de cor quente/fria em `mix-blend-mode: soft-light` |
| Nitidez | `contrast()` sutil no positivo, `blur()` no negativo |

Por isso “Usar configuração” muda o visor na hora, e o estilo escolhido no
onboarding (Natural, Vibrante, Escuro/Dramático, Preto e branco) já chega
aplicado na câmera.

**Estado persistido.** Perfil, ajustes, curtidas, salvas, configurações criadas
e capturas ficam no `localStorage`, então a jornada continua de onde parou.

**Renderização.** Cada tela é uma função que devolve marcação; o roteador em
`app.js` troca o conteúdo de `#app` e liga os comportamentos. Os cliques usam
delegação de eventos com `data-act` / `data-arg`, então não há listeners
espalhados nem vazamento entre telas.

---

## Acessibilidade e responsividade

- Estrutura semântica, `aria-label` nos botões de ícone e `aria-live` nos avisos.
- Foco visível por teclado; `Esc` volta, `←`/`→` trocam de modo na câmera e
  `Espaço` dispara.
- `prefers-reduced-motion` desliga as animações.
- No desktop o app aparece dentro de uma moldura de celular com um painel de
  apresentação ao lado; abaixo de 780px ele ocupa a tela inteira, como um app real.

## Links diretos

Para revisar uma tela isolada, basta usar o hash: `index.html#/camera`,
`#/comunidade`, `#/preset`, `#/modos`, `#/perfil`, `#/galeria`, `#/criar`,
`#/ajustes`, `#/onboarding`.
