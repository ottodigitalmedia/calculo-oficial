import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Saída autônoma: a imagem final não carrega código-fonte nem dependências
  // de desenvolvimento (13-deployment §3, regra D-1).
  //
  // `next start` NÃO serve esta saída. O caminho correto é
  // `node .next/standalone/server.js`, e o Next não copia `.next/static` nem
  // `public` para dentro dela — quem faz isso é `scripts/serve-standalone.mjs`
  // localmente e o Dockerfile em produção. Os dois lados andam juntos: mudar
  // um sem o outro produz um servidor que sobe e serve página sem estilo.
  output: 'standalone',

  // O rastreador de arquivos do Next inclui `typescript` na saída autônoma
  // porque este próprio arquivo é .ts. São 8,7 MB de dependência de
  // DESENVOLVIMENTO dentro da imagem de produção — violação direta de D-1,
  // verificada inspecionando a imagem construída.
  //
  // TypeScript é ferramenta de build e não participa de servir requisição.
  // A exclusão é conferida em T-002 subindo o contêiner e batendo em
  // /api/health e em /: se fosse necessário em runtime, o servidor não subiria.
  outputFileTracingExcludes: {
    '*': ['node_modules/typescript/**'],
  },

  // Barra final ausente; redirecionamento permanente quando presente
  // (06-api-spec §2.1).
  trailingSlash: false,

  reactStrictMode: true,

  // Falhar o build em erro de tipo ou de lint é deliberado: o pipeline de
  // 13-deployment §4 interrompe antes do build, e o build não deve ser a
  // primeira etapa complacente da cadeia.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
}

/**
 * Cabeçalhos de segurança — `07-security` §5.
 *
 * Entram aqui os que **não** dependem das origens da rede de anúncio.
 * `Content-Security-Policy` continua adiada, porque exige a lista exata do
 * provedor e não admite curinga. `Strict-Transport-Security` fica para o
 * T-108: `13-deployment` §7 condiciona a ativação a confirmar que o TLS está
 * estável, e HSTS mal configurado tira o site do ar por meses.
 *
 * REFERRER-POLICY · CORREÇÃO DE ESPECIFICAÇÃO
 *
 * `07-security` §5 pedia `strict-origin-when-cross-origin` e declarava como
 * ameaça mitigada o "vazamento de query string". Esse valor **não** mitiga a
 * ameaça neste produto: ele preserva a URL completa nas requisições de MESMA
 * origem, e aqui todas as requisições de recurso são de mesma origem.
 *
 * O efeito real, encontrado por TC-040: ao digitar o salário, `replaceState`
 * o coloca na query (`RF-006`); a partir daí, cada prefetch e cada pedaço de
 * JavaScript sai com `Referer: .../salario-liquido?salarioBruto=538271`. O
 * salário chegava ao registro de acesso do servidor — que `07-security` §11
 * descreve como contendo apenas IP, página e horário.
 *
 * `strict-origin` envia só a origem, inclusive para nós mesmos. Nenhuma query
 * viaja em cabeçalho, e os links para as normas oficiais continuam sabendo de
 * onde vieram.
 */
const CABECALHOS = [
  { key: 'Referrer-Policy', value: 'strict-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
]

nextConfig.headers = async () => [{ source: '/:caminho*', headers: CABECALHOS }]

export default nextConfig
