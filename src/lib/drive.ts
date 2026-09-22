// Converte links de compartilhamento do Google Drive em URL de exibição direta.
// Links comuns:
//   https://drive.google.com/file/d/<ID>/view?usp=sharing
//   https://drive.google.com/open?id=<ID>
// Saída: https://lh3.googleusercontent.com/d/<ID> (renderiza em <img>, sem cookies)
// URLs fora desses padrões são retornadas como vieram (tolerante).

const FILE_PATH_RE = /drive\.google\.com\/file\/d\/([^/?#]+)/
const ID_PARAM_RE = /[?&]id=([^&#]+)/

export function driveImageSrc(url: string): string {
  const match = url.match(FILE_PATH_RE) ?? url.match(ID_PARAM_RE)
  if (!match) return url
  return `https://lh3.googleusercontent.com/d/${match[1]}`
}
