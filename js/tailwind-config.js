/* =============================================================
   Jovi Câmera — configuração do Tailwind
   Em arquivo próprio (e não em <script> inline) para que a política
   de segurança da página possa exigir script-src 'self', sem abrir
   exceção para código inline.
   ============================================================= */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        jv: {
          amber: '#FFC300',
          amber2: '#E5A800',
          ink: '#000000',
          surface: '#0B0B0D',
          card: '#17171A',
          card2: '#202024',
          line: '#2A2A30',
          mute: '#9A9AA4'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    }
  }
};
