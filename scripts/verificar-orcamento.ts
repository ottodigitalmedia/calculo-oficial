/**
 * TC-051 — orçamento de JavaScript por rota (`RNF-004`).
 *
 * Até o T-106 este passo era um `echo` no pipeline, com a justificativa de que
 * ainda não havia rota de calculadora para medir. Havia desde o T-103, e o
 * `echo` continuou passando — que é exatamente o que o comentário ao lado dele
 * advertia: *"um verificador que sempre passa por falta de objeto é pior que a
 * ausência dele"*.
 *
 * Mede o que o navegador de fato baixa: a soma **comprimida** de todos os
 * pedaços de JavaScript que a rota carrega. Comprimida porque é assim que o
 * arquivo trafega, e `RNF-004` fala em KB comprimidos.
 *
 * **Uma linha por calculadora publicada, não uma pelo molde.** Ninguém abre
 * `/calculadora/[slug]`; abre-se `/calculadora/inss`. Desde 31/07/2026 cada
 * calculadora tem o cálculo em pedaço próprio, adiado — e pedaço adiado não
 * consta do manifesto da rota. Somar só o manifesto mostraria a rota
 * emagrecendo e deixaria de contar justamente a parte que cresce com o
 * catálogo. `pedacoDaCalculadora` fecha esse buraco, e **reprova** se o pedaço
 * de uma calculadora publicada não for encontrado.
 *
 * Uso: `npm run check:orcamento` depois de `npm run build`.
 */

import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import { SLUGS } from '../src/lib/calculadoras'

const DIRETORIO_BUILD = '.next'
const MANIFESTO = join(DIRETORIO_BUILD, 'app-build-manifest.json')
const PEDACOS = join(DIRETORIO_BUILD, 'static', 'chunks')

/** `RNF-004`. Em bytes, sobre o conteúdo comprimido. */
const ORCAMENTO_CALCULADORA = 120 * 1024

/**
 * Rotas sujeitas ao limite bloqueante.
 *
 * `RNF-004` fala de rota de calculadora, que é onde o produto é usado e onde a
 * lentidão custa uso. As demais são medidas e exibidas, sem bloquear.
 */
const BLOQUEANTES = [/^\/calculadora\//]

interface Medida {
  readonly rota: string
  readonly bytes: number
  readonly arquivos: number
  readonly bloqueante: boolean
}

function gzip(caminho: string): number {
  // Nível 9: o que o servidor entrega com compressão ligada. Medir o arquivo
  // cru superestimaria em mais de três vezes e tornaria o orçamento impossível
  // de cumprir por um motivo falso.
  return gzipSync(readFileSync(caminho), { level: 9 }).byteLength
}

/**
 * Os pedaços adiados de cada calculadora — `lib/calculadoras/calculo.ts`.
 *
 * **Este trecho já esteve errado, e o erro era do tipo que este arquivo existe
 * para impedir.** A primeira versão procurava o arquivo pelo nome
 * (`calc-<slug>.*.js`) e somava só ele. Funcionou enquanto cada calculadora
 * tinha um pedaço só. Quando a SEGUNDA calculadora de rescisão entrou, o
 * empacotador extraiu o motor compartilhado para um pedaço anônimo — e a rota
 * de rescisão *caiu* de 118,2 para 113,7 kB no relatório, enquanto o navegador
 * continuava baixando a mesma coisa. Melhora aparente por deixar de olhar.
 *
 * Agora a medição segue o **grafo real**: o pedaço da rota declara, para cada
 * slug, exatamente quais pedaços o navegador busca —
 *
 *     "rescisao-sem-justa-causa": () => Promise.all([e(138), e(57), e(624)])
 *
 * e é essa lista que é somada. Pedaço compartilhado entra na conta de todas as
 * rotas que o carregam, porque todas de fato o baixam.
 *
 * **Falha alto de propósito.** Se o formato da saída do empacotador mudar, a
 * extração devolve vazio e o script encerra com erro em vez de relatar rotas
 * mais leves. Um orçamento que se cala é pior que um orçamento ausente.
 */
interface MapaDeSlugs {
  readonly [slug: string]: readonly string[]
}

function lerPedacoDaRota(): string {
  const dir = join(DIRETORIO_BUILD, 'static', 'chunks', 'app', 'calculadora', '[slug]')
  if (!existsSync(dir)) {
    console.error(
      `Diretório do pedaço da rota não encontrado: ${dir}.` +
        `\nRode "npm run build" antes — não há o que medir sem build.`,
    )
    process.exit(1)
  }
  const arquivo = readdirSync(dir).find((f) => f.startsWith('page') && f.endsWith('.js'))
  if (!arquivo) {
    console.error(`Nenhum arquivo "page*.js" em ${dir}.`)
    process.exit(1)
  }
  return readFileSync(join(dir, arquivo), 'utf8')
}

/** Extrai, do pedaço da rota, o slug e os ids que ele manda buscar. */
function mapearSlugs(): MapaDeSlugs {
  const fonte = lerPedacoDaRota()
  const mapa: Record<string, string[]> = {}

  // A chave sai com aspas quando o slug tem hífen e sem aspas quando é
  // identificador válido — `inss` e `irrf` caem no segundo caso.
  const padrao = /["']?([a-z][a-z0-9-]{2,40})["']?:\s*\(\)\s*=>\s*(Promise\.all\(\[[^\]]*\]\)|[A-Za-z_$][\w$]*\.e\(\d+\))/g

  for (const achado of fonte.matchAll(padrao)) {
    const slug = achado[1]
    const expressao = achado[2]
    if (slug === undefined || expressao === undefined) continue
    const ids = [...expressao.matchAll(/\.e\((\d+)\)/g)].map((m) => m[1] as string)
    if (ids.length > 0) mapa[slug] = ids
  }

  if (Object.keys(mapa).length === 0) {
    console.error(
      'Não foi possível extrair o mapa de pedaços adiados do pedaço da rota.' +
        '\nO formato da saída do empacotador provavelmente mudou. NÃO ignore isto:' +
        '\nsem o mapa, o orçamento mediria menos do que o navegador baixa e passaria' +
        '\npor deixar de olhar. Ajuste `mapearSlugs` em scripts/verificar-orcamento.ts.',
    )
    process.exit(1)
  }

  return mapa
}

/**
 * Resolve id de pedaço → nome de arquivo, lendo o **runtime do empacotador**.
 *
 * O runtime carrega a função que o próprio navegador usa para montar a URL:
 *
 *     u = (e) => "static/chunks/" + ({106:"calc-salario-liquido", …}[e] || e)
 *                                 + "." + ({57:"590ef…", 106:"33a9…"}[e]) + ".js"
 *
 * Nem todo id vira nome: só os que receberam `webpackChunkName`. Os pedaços
 * extraídos por serem compartilhados ficam com o número. Deduzir o arquivo pelo
 * padrão do nome erraria justamente nesses — que são os que passaram
 * despercebidos antes.
 */
function resolvedorDeArquivo(): (id: string) => string | undefined {
  const runtime = readdirSync(PEDACOS).find((f) => f.startsWith('webpack-') && f.endsWith('.js'))
  if (runtime === undefined) {
    console.error(`Runtime do empacotador não encontrado em ${PEDACOS}.`)
    process.exit(1)
  }

  const fonte = readFileSync(join(PEDACOS, runtime), 'utf8')
  const trecho = fonte.slice(fonte.indexOf('.u='), fonte.indexOf('.u=') + 2_000)

  const objetos = [...trecho.matchAll(/\{((?:\s*\d+:\s*"[^"]*",?)+)\}/g)].map((m) => {
    const dicionario: Record<string, string> = {}
    for (const par of (m[1] ?? '').matchAll(/(\d+):\s*"([^"]*)"/g)) {
      const chave = par[1]
      const valor = par[2]
      if (chave !== undefined && valor !== undefined) dicionario[chave] = valor
    }
    return dicionario
  })

  const nomes = objetos[0] ?? {}
  const hashes = objetos[1] ?? {}

  if (Object.keys(hashes).length === 0) {
    console.error(
      'Não foi possível ler o mapa de hashes do runtime do empacotador.' +
        '\nSem ele não há como saber o nome do arquivo de cada pedaço adiado, e o' +
        '\norçamento mediria menos do que o navegador baixa.',
    )
    process.exit(1)
  }

  return (id) => {
    const hash = hashes[id]
    if (hash === undefined) return undefined
    return `${nomes[id] ?? id}.${hash}.js`
  }
}

/** Soma os pedaços adiados de um slug, pelo id declarado no grafo. */
function pedacosDaCalculadora(
  slug: string,
  mapa: MapaDeSlugs,
  resolver: (id: string) => string | undefined,
): number {
  const ids = mapa[slug]
  if (ids === undefined) {
    console.error(
      `A calculadora "${slug}" está publicada e não aparece no mapa de carga adiada.` +
        `\nOu falta a entrada em src/lib/calculadoras/calculo.ts, ou a extração parou` +
        `\nde reconhecê-la. Nos dois casos o cálculo dela não chegaria ao navegador.`,
    )
    process.exit(1)
  }

  let bytes = 0

  for (const id of ids) {
    const arquivo = resolver(id)
    if (arquivo === undefined || !existsSync(join(PEDACOS, arquivo))) {
      console.error(`Pedaço ${id}, exigido por "${slug}", não existe em ${PEDACOS}.`)
      process.exit(1)
    }
    bytes += gzip(join(PEDACOS, arquivo))
  }

  return bytes
}

function medir(): readonly Medida[] {
  if (!existsSync(MANIFESTO)) {
    console.error(
      `Manifesto não encontrado em ${MANIFESTO}.\n` +
        `Rode "npm run build" antes — não há o que medir sem build.`,
    )
    process.exit(1)
  }

  const manifesto = JSON.parse(readFileSync(MANIFESTO, 'utf8')) as {
    readonly pages: Record<string, readonly string[]>
  }

  const medidas: Medida[] = []

  for (const [chave, arquivos] of Object.entries(manifesto.pages)) {
    // "/calculadora/[slug]/page" -> "/calculadora/[slug]"
    const rota = chave.replace(/\/page$/, '').replace(/\/route$/, '') || '/'

    let bytes = 0
    let contados = 0
    for (const arquivo of arquivos) {
      if (!arquivo.endsWith('.js')) continue
      const caminho = join(DIRETORIO_BUILD, arquivo)
      if (!existsSync(caminho)) continue
      bytes += gzip(caminho)
      contados += 1
    }

    const bloqueante = BLOQUEANTES.some((padrao) => padrao.test(rota))

    /**
     * `/calculadora/[slug]` é um molde, não uma rota que alguém abre. Quem
     * abre abre `/calculadora/salario-liquido` — e baixa o que está no
     * manifesto MAIS o pedaço daquela calculadora.
     *
     * Medir cada slug separadamente é o que dá sentido ao limite: ele passa a
     * valer sobre o que uma pessoa de fato baixa, e para de crescer a cada
     * calculadora nova. Era o motivo de a folga estar em 2,4 kB com quatro
     * publicadas e 71 por publicar.
     */
    if (rota === '/calculadora/[slug]') {
      const mapa = mapearSlugs()
      const resolver = resolvedorDeArquivo()
      for (const slug of SLUGS) {
        const proprio = pedacosDaCalculadora(slug, mapa, resolver)
        medidas.push({
          rota: `/calculadora/${slug}`,
          bytes: bytes + proprio,
          arquivos: contados + (mapa[slug]?.length ?? 0),
          bloqueante,
        })
      }
      continue
    }

    medidas.push({ rota, bytes, arquivos: contados, bloqueante })
  }

  return medidas.sort((a, b) => b.bytes - a.bytes)
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} kB`
}

function main(): void {
  const medidas = medir()
  const largura = Math.max(...medidas.map((m) => m.rota.length))

  console.log(`\nTC-051 · JavaScript comprimido por rota (RNF-004: ≤ ${kb(ORCAMENTO_CALCULADORA)})\n`)

  const estouros: Medida[] = []

  for (const m of medidas) {
    const marca = m.bloqueante ? '▸' : ' '
    const proporcao = m.bytes / ORCAMENTO_CALCULADORA
    const situacao = !m.bloqueante
      ? ''
      : proporcao > 1
        ? `  ESTOUROU em ${kb(m.bytes - ORCAMENTO_CALCULADORA)}`
        : `  folga de ${kb(ORCAMENTO_CALCULADORA - m.bytes)}`

    console.log(`${marca} ${m.rota.padEnd(largura)}  ${kb(m.bytes).padStart(9)}${situacao}`)
    if (m.bloqueante && m.bytes > ORCAMENTO_CALCULADORA) estouros.push(m)
  }

  console.log(`\n▸ = sujeita ao limite bloqueante\n`)

  if (estouros.length > 0) {
    console.error(
      `RNF-004 violado por ${estouros.length} rota(s).\n` +
        `O limite não é decorativo: o produto é consumido majoritariamente em\n` +
        `rede móvel, e cada quilobyte adiado é resultado que demora a aparecer.\n` +
        `Antes de aumentar o orçamento, procure o que entrou no pacote sem precisar.`,
    )
    process.exit(1)
  }

  const maiorBloqueante = medidas.find((m) => m.bloqueante)
  if (maiorBloqueante) {
    const folga = ORCAMENTO_CALCULADORA - maiorBloqueante.bytes
    // Aviso, não falha: a margem é informação de planejamento, e transformar
    // "está apertado" em erro faria o build quebrar sem nada ter piorado.
    if (folga < 8 * 1024) {
      console.warn(
        `Aviso: a folga da maior rota de calculadora é de apenas ${kb(folga)}.\n` +
          `Vale medir antes de acrescentar dependência de cliente.`,
      )
    }
  }
}

main()
