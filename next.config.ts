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
 * `Content-Security-Policy` **entrou em 08/08/2026** — ver a nota própria dela
 * logo abaixo. Ficava adiada por depender das origens do provedor de anúncio, e
 * essa dependência nunca chegou a existir.
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
/**
 * CONTENT-SECURITY-POLICY · ATIVADA EM 08/08/2026
 *
 * `07-security` §5 a especifica como mitigadora de **AM-01, AM-02 e AM-04** — a
 * lista de ameaças mais grave do documento — e ela era a única das seis que
 * faltava. A justificativa registrada era *"depende das origens exatas do
 * provedor de anúncio"*, e essa justificativa **deixou de existir**: não há
 * provedor de anúncio no código. Estava adiada por uma dependência que ninguém
 * criou.
 *
 * ## `connect-src` É A DIRETIVA QUE IMPORTA NESTE PRODUTO
 *
 * `RF-006` põe salário, pensão e saldo de FGTS na query. A ameaça específica
 * daqui não é desfiguração de página: é **um script conseguir mandar isso para
 * fora**. `connect-src` fecha exatamente essa porta, e a fecha por completo,
 * independentemente de qualquer coisa que `script-src` permita.
 *
 * `form-action 'self'` fecha a variante por formulário; `base-uri 'self'` impede
 * reescrever a base das URLs relativas; `object-src 'none'` e
 * `frame-ancestors 'none'` fecham plugin e sobreposição de clique.
 *
 * ## O LIMITE HONESTO: `'unsafe-inline'` EM `script-src`
 *
 * O Next injeta script embutido para hidratar, com conteúdo que muda a cada
 * build — hash não serve. A alternativa é nonce, e nonce exige `middleware`,
 * que **torna dinâmica toda página hoje estática**. Isso derruba o modelo de
 * entrega inteiro e a decisão é de `ADR-008`, reservada ao mantenedor.
 *
 * Então `script-src` continua admitindo embutido. O que ele passa a proibir é
 * script vindo de origem não listada — que é o vetor de AM-02 em que um pacote
 * comprometido chama código de fora. E o `connect-src` acima continua valendo
 * mesmo para um script que consiga executar: sem canal de saída, o dado fica.
 *
 * > ⚠️ VERIFICAR EM PRODUÇÃO, uma vez, com o console aberto. O GA4 pode usar
 * > pontos de coleta regionais (`region1.google-analytics.com` e afins) que não
 * > estão listados. Se aparecerem bloqueios, **acrescente o host exato** — nunca
 * > um curinga: `CLAUDE.md` proíbe, e curinga aqui anula a proteção contra
 * > AM-02, que é a ameaça mais provável do sistema.
 *
 * `upgrade-insecure-requests` fica de fora por ser redundante com o HSTS acima e
 * por mascarar, em vez de reprovar, uma referência a `http://` que entrasse.
 */
/**
 * OS HOSTS DO GOOGLE, UM A UM — ampliado em 14/08/2026.
 *
 * O aviso acima ("VERIFICAR EM PRODUÇÃO, uma vez, com o console aberto") foi
 * cumprido em 14/08/2026: a coleta saiu para `www.google-analytics.com`, sem
 * bloqueio. **A CSP nunca foi a causa do relatório vazio** — a causa era o
 * consentimento negado por omissão, corrigido em `components/Medicao.tsx`.
 *
 * O que entra agora é o que a concessão de consentimento passa a acionar, e que
 * a lista antiga não cobria:
 *
 * - `region1.google-analytics.com` — ponto de coleta regional. O GA4 escolhe o
 *   endpoint em tempo de execução; quem cair nele com a lista antiga perderia o
 *   hit inteiro, e em silêncio. É a armadilha que o aviso previa;
 * - `stats.g.doubleclick.net` e `td.doubleclick.net` — Google Signals e
 *   remarketing, que só disparam com `ad_storage` concedido.
 *
 * **Nenhum curinga**, e não é preferência de estilo: `CLAUDE.md` proíbe, e
 * curinga aqui anula a proteção contra AM-02. Se aparecer bloqueio de um host
 * não listado, acrescente **o host exato** — nunca `*.google-analytics.com`.
 *
 * `connect-src` continua sendo a linha que importa, e ampliá-la não afrouxa
 * `RN-030`: o que sai para esses hosts é sanitizado na origem, em `Medicao.tsx`,
 * antes de qualquer etiqueta rodar. A CSP decide PARA ONDE se pode falar; ela
 * nunca foi o que decide O QUE se fala.
 */
const GTM = 'https://www.googletagmanager.com'
const GA = 'https://www.google-analytics.com'
const GA_REGIONAL = 'https://region1.google-analytics.com'
const GA_ALT = 'https://analytics.google.com'
const SIGNALS = 'https://stats.g.doubleclick.net'
const SIGNALS_ALT = 'https://td.doubleclick.net'

const POLITICA_DE_CONTEUDO = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Sem fonte externa e sem imagem remota: medido, o site não usa nenhuma das
  // duas. `data:` cobre o favicon embutido.
  "font-src 'self'",
  `img-src 'self' data: ${GTM} ${GA} ${GA_REGIONAL} ${SIGNALS} ${SIGNALS_ALT}`,
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline' ${GTM} ${GA}`,
  // A porta de saída do dado digitado. É a linha mais importante do arquivo.
  `connect-src 'self' ${GTM} ${GA} ${GA_REGIONAL} ${GA_ALT} ${SIGNALS} ${SIGNALS_ALT}`,
].join('; ')

const CABECALHOS = [
  { key: 'Content-Security-Policy', value: POLITICA_DE_CONTEUDO },
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
