/**
 * Leitura da série econômica em cache — `ADR-006` S-5 e S-6.
 *
 * **Puro, e do lado do servidor.** Não lê rede, não lê relógio: a data de
 * referência entra como parâmetro, como no motor (`C-M2`). E o arquivo de cache
 * **não pode** atravessar para o navegador — são dezenas de quilobytes de série
 * histórica, e `RNF-004` mede o que a rota baixa. O que cruza a fronteira é o
 * ponto resolvido, não a série.
 *
 * A regra é verificada por lint, e não por lembrança: `SERIES_FORA_DO_CLIENTE`
 * em `eslint.config.js`. É o mesmo padrão do registro de parâmetros, e existe
 * pelo mesmo motivo — a volta seria um import de uma linha, e nenhum teste
 * funcional a pegaria.
 */

import bruto from './dados/cache.json'
import {
  definicaoDaSerie,
  ESCALA_POR_BASIS_POINT,
  VERSAO_DO_CACHE,
  type CacheDeSeries,
  type PontoDaSerie,
  type SerieId,
} from './tipos'
import type { DataISO } from '../params/tipos'

const cache = bruto as CacheDeSeries

/**
 * Dias a partir dos quais o dado é anunciado como possivelmente desatualizado
 * (`RN-033`).
 */
const DIAS_ATE_AVISAR = 30

/**
 * O último ponto conhecido de uma série, ou `null`.
 *
 * `null` é resposta legítima, e não erro: `06-api-spec` §4.2 prevê o cenário de
 * primeira execução sem cache, e manda que o campo simplesmente fique sem
 * sugestão — nunca uma mensagem de erro ao usuário por causa de indicador.
 */
export function ultimoPonto(id: SerieId): PontoDaSerie | null {
  if (cache.versao !== VERSAO_DO_CACHE) return null
  const serie = cache.series.find((s) => s.id === id)
  if (!serie || serie.pontos.length === 0) return null
  // Os pontos são gravados em ordem crescente pelo coletor, e o último é o mais
  // recente. Ver a armadilha da ordem em `docs/20`: a ORIGEM não garante isso.
  return serie.pontos[serie.pontos.length - 1] ?? null
}

/** Quando o cache daquela série foi coletado. */
export function coletadoEm(id: SerieId): DataISO | null {
  if (cache.versao !== VERSAO_DO_CACHE) return null
  return cache.series.find((s) => s.id === id)?.coletadoEm ?? null
}

/** Todos os pontos de uma série, em ordem crescente de data. */
export function pontosDaSerie(id: SerieId): readonly PontoDaSerie[] {
  if (cache.versao !== VERSAO_DO_CACHE) return []
  return cache.series.find((s) => s.id === id)?.pontos ?? []
}

/**
 * Converte o percentual escalado em basis points, com política declarada.
 *
 * `ADR-004` A-4 proíbe arredondamento implícito, e aqui há de fato uma perda:
 * 0,1729% não cabe em basis point. Quem chama declara o que fazer com a fração.
 */
export function paraBasisPoints(
  valor: number,
  politica: 'meio_para_cima' | 'truncar' = 'meio_para_cima',
): number {
  const negativo = valor < 0
  const abs = Math.abs(valor)
  const quociente = Math.trunc(abs / ESCALA_POR_BASIS_POINT)
  const resto = abs % ESCALA_POR_BASIS_POINT
  const arredondado =
    politica === 'truncar' || 2 * resto < ESCALA_POR_BASIS_POINT ? quociente : quociente + 1
  return negativo ? -arredondado : arredondado
}

/**
 * Distância em dias entre duas datas ISO, sem relógio e sem `new Date(string)`.
 *
 * A proibição de `new Date(string)` vale aqui pelo mesmo motivo que vale no
 * motor: o construtor interpreta "2026-08-02" como UTC e "02/08/2026" como
 * inválido, e a diferença aparece como um dia a mais ou a menos conforme o fuso
 * de quem roda o build.
 */
function diasEntre(inicio: DataISO, fim: DataISO): number {
  const [a1, m1, d1] = inicio.split('-').map(Number) as [number, number, number]
  const [a2, m2, d2] = fim.split('-').map(Number) as [number, number, number]
  const umDia = 86_400_000
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / umDia)
}

/**
 * O dado é velho o bastante para merecer aviso? — `RN-033`.
 *
 * Recebe a data de referência em vez de consultar o relógio: é a mesma
 * disciplina de `C-M2`, e é o que torna este comportamento testável sem
 * congelar o tempo.
 */
export function estaDesatualizado(ponto: PontoDaSerie, dataReferencia: DataISO): boolean {
  return diasEntre(ponto.data, dataReferencia) > DIAS_ATE_AVISAR
}

/**
 * O que o servidor entrega ao navegador sobre uma série: um valor, a data dele
 * e o aviso de defasagem. **Nunca a série inteira.**
 */
export interface SugestaoDeSerie {
  /** `id` do campo que a sugestão pré-preenche. */
  readonly campo: string
  /** Já na unidade interna do campo — basis points, para campo percentual. */
  readonly valor: number
  readonly rotulo: string
  readonly dataDoDado: DataISO
  readonly desatualizada: boolean
}

/**
 * Resolve a sugestão de um campo a partir da série, ou `null` se não há dado.
 *
 * O rótulo nomeia a série e a data, porque `S-5` exige que o valor exibido
 * sempre acompanhe a data a que se refere — sem isso o número vira afirmação
 * sem lastro, que é exatamente o que este produto não faz.
 */
export function sugestaoDe(campo: string, id: SerieId): SugestaoDeSerie | null {
  const ponto = ultimoPonto(id)
  const definicao = definicaoDaSerie(id)
  if (!ponto || !definicao) return null

  /**
   * A defasagem é medida contra a data da COLETA, e não contra o relógio.
   *
   * Duas razões. A primeira é disciplina: nada em `lib/` lê relógio, e um
   * `new Date()` aqui tornaria a página não determinística entre build e
   * render. A segunda é que a comparação certa é essa mesma — o site é
   * reconstruído na revalidação diária, então a data da coleta é o "agora" que
   * o dado conheceu, e o que `RN-033` quer saber é se o INDICADOR ficou para
   * trás, não se o build ficou.
   */
  const dataReferencia = coletadoEm(id) ?? ponto.data

  return {
    campo,
    valor: paraBasisPoints(ponto.valor),
    rotulo: definicao.nome,
    dataDoDado: ponto.data,
    desatualizada: estaDesatualizado(ponto, dataReferencia),
  }
}
