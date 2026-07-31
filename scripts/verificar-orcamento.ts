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
 * O pedaço adiado de cada calculadora — `lib/calculadoras/calculo.ts`.
 *
 * **Por que o script precisa disto.** A partir de 31/07/2026 a função de
 * cálculo de cada calculadora viaja em pedaço próprio, carregado sob demanda.
 * Pedaço adiado **não aparece** no manifesto da rota. Medir só o manifesto
 * mostraria a rota emagrecendo de 117,6 para 110,9 kB e não contaria os 3,5 kB
 * que o navegador baixa em seguida para que a calculadora funcione.
 *
 * Isso seria um orçamento que passa por deixar de olhar — a mesma falha do
 * `echo` que fingiu ser este verificador do T-003 ao T-105, e do
 * `--passWithNoTests`. O nome fixo do pedaço (`webpackChunkName`) existe para
 * tornar esta medição possível.
 *
 * **Slug publicado sem pedaço é erro, não zero.** Se o `webpackChunkName` for
 * removido ou renomeado, o padrão deixa de casar; sem esta checagem o script
 * relataria a rota mais leve e continuaria verde.
 */
function pedacoDaCalculadora(slug: string): number {
  if (!existsSync(PEDACOS)) return 0
  const alvo = readdirSync(PEDACOS).filter((f) => f.startsWith(`calc-${slug}.`) && f.endsWith('.js'))

  if (alvo.length === 0) {
    console.error(
      `Nenhum pedaço "calc-${slug}.*.js" em ${PEDACOS}.\n` +
        `A calculadora "${slug}" está publicada, então o cálculo dela é baixado\n` +
        `por alguém — e este script precisa somá-lo à rota. Confira o\n` +
        `webpackChunkName em src/lib/calculadoras/calculo.ts.`,
    )
    process.exit(1)
  }

  return alvo.reduce((soma, f) => soma + gzip(join(PEDACOS, f)), 0)
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
      for (const slug of SLUGS) {
        const proprio = pedacoDaCalculadora(slug)
        medidas.push({
          rota: `/calculadora/${slug}`,
          bytes: bytes + proprio,
          arquivos: contados + 1,
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
