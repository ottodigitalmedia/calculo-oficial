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
 * provedor e não admite curinga.
 *
 * STRICT-TRANSPORT-SECURITY · CONDIÇÃO SATISFEITA
 *
 * `13-deployment` §7 condicionava a ativação a confirmar que o TLS está
 * estável — e HSTS mal configurado tira o site do ar por meses, então a
 * condição não era formalidade. Ela foi satisfeita **por evidência, não por
 * configuração**: o certificado foi substituído sozinho em 30/07/2026, sem
 * intervenção. Registrado em `13-deployment` §7.
 *
 * `includeSubDomains` porque `07-security` §5 pede "ativo, com subdomínios".
 * Hoje só o ápice é servido; a diretiva não exige que subdomínio exista, só
 * proíbe que ele seja servido em texto claro quando existir.
 *
 * **`preload` fica de fora, deliberadamente.** Entrar na lista de pré-carga é
 * uma porta de mão única: a remoção leva meses e passa por navegador de
 * terceiro, não por nós. O pré-requisito de infraestrutura foi satisfeito em
 * 31/07/2026 — `www` passou a ser servido em HTTPS —, mas o ganho continua
 * estreito: `preload` só vale para a PRIMEIRA visita de quem nunca esteve
 * aqui; para todos os demais, este cabeçalho já basta. Trocar ganho estreito
 * por compromisso irreversível é decisão a registrar, não configuração a
 * ligar.
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
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Referrer-Policy', value: 'strict-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
]

nextConfig.headers = async () => [{ source: '/:caminho*', headers: CABECALHOS }]

/**
 * `www` redireciona para o ápice — `13-deployment` §7.
 *
 * O documento manda **escolher um e manter**. Até 31/07/2026 `www` não era
 * servido: quem digitasse chegava a um erro de certificado. Passou a ser
 * servido no mesmo dia, e servir o MESMO conteúdo em dois domínios é conteúdo
 * duplicado — o buscador precisa decidir qual indexar, e decide sozinho.
 *
 * As canônicas já apontam para o ápice, o que resolveria o caso. O
 * redirecionamento é melhor mesmo assim: canônica é dica, redirecionamento é
 * instrução, e ele também consolida num só endereço os links que outros sites
 * fizerem para `www`. Com busca orgânica como único canal de aquisição, essa
 * consolidação é o ativo.
 *
 * `permanent: true` emite 308, que preserva o método e é tratado como
 * permanente pelos buscadores.
 *
 * A condição de `host` casa contra o cabeçalho `Host` da requisição, então em
 * desenvolvimento e nos testes (onde o host é `localhost`) a regra simplesmente
 * não se aplica. Há teste com `Host` forjado em `tests/e2e/cabecalhos.spec.ts`,
 * para que ela não deixe de valer sem ninguém notar.
 */
nextConfig.redirects = async () => [
  {
    source: '/:caminho*',
    has: [{ type: 'host', value: 'www.calculoficial.com.br' }],
    destination: 'https://calculoficial.com.br/:caminho*',
    permanent: true,
  },
]

export default nextConfig
