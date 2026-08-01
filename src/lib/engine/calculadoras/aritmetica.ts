/**
 * CALC-070 — Porcentagem · CALC-054 — Álcool ou gasolina.
 *
 * As duas mais simples do catálogo, e as duas primeiras cujo resultado **não é
 * dinheiro** o tempo todo. Juntas num módulo pela mesma razão que férias e 13º:
 * compartilham a peça que as torna possíveis — a declaração de unidade de
 * `traco.ts` — e separá-las duplicaria a explicação sem separar nada.
 *
 * NENHUMA NORMA, E ISSO ESTÁ DECLARADO
 *
 * Não há parâmetro legal aqui, nem fundamento a citar: é aritmética. O que a
 * memória de cálculo entrega nas duas não é autoridade normativa, é a conta
 * aberta — que continua sendo o diferencial, porque o concorrente típico devolve
 * um número e mais nada.
 *
 * A ARITMÉTICA É A MESMA DO DINHEIRO, E É DE PROPÓSITO
 *
 * `aplicarAliquota`, `proporcao` e `aliquotaEfetiva` foram escritas para
 * centavos e basis points, com arredondamento declarado e sem ponto flutuante
 * em lugar nenhum (`ADR-004`). Aplicá-las a centésimos de unidade qualquer não
 * afrouxa nada: o invariante que elas protegem é o da representação inteira, e
 * ele vale igual para "15% de 200" e para "15% de R$ 200,00".
 */

import { aplicarAliquota, aliquotaEfetiva, proporcao, subtrair, somar } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/**
 * Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`.
 *
 * Definição de unidade, não constante legal.
 */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/**
 * Arredondamento único deste módulo.
 *
 * `A-4` proíbe política implícita, e aqui não há norma que a escolha por nós.
 * "Meio para cima" é a convenção escolar de porcentagem e a que o usuário vai
 * conferir na calculadora do celular — que é o critério que importa numa
 * calculadora cuja tese é a conferibilidade.
 */
const POLITICA = 'meio_para_cima' as const

// ---------------------------------------------------------------------------
// CALC-070 — Porcentagem
// ---------------------------------------------------------------------------

export type OperacaoPorcentagem =
  /** Quanto é P% de V. */
  | 'parte'
  /** V acrescido de P%. */
  | 'acrescimo'
  /** V reduzido em P%. */
  | 'desconto'
  /** V é quantos por cento da referência. */
  | 'proporcao'
  /** Quanto variou, da referência para V. */
  | 'variacao'

export interface EntradaPorcentagem {
  readonly operacao: OperacaoPorcentagem
  /** Em centésimos da unidade: 200 é `20000`; 12,5 é `1250`. */
  readonly valor: number
  readonly percentualBp: BasisPoints
  /** O total, na proporção; o valor anterior, na variação. Mesma escala de `valor`. */
  readonly referencia: number
}

export interface SaidaPorcentagem {
  /** Como ler `resultado`: `'numero'` em centésimos, `'percentual'` em basis points. */
  readonly unidade: 'numero' | 'percentual'
  readonly resultado: Centavos
  /**
   * A grandeza complementar, sempre em centésimos da unidade: o que sobra, o
   * quanto foi somado, o quanto foi tirado, o quanto falta, o quanto mudou.
   */
  readonly diferenca: Centavos
}

export function calcularPorcentagem(
  entrada: EntradaPorcentagem,
  dataReferencia: DataISO,
): Resultado<SaidaPorcentagem> {
  const usaReferencia = entrada.operacao === 'proporcao' || entrada.operacao === 'variacao'

  if (usaReferencia && entrada.referencia === 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        entrada.operacao === 'proporcao'
          ? 'O total não pode ser zero — não existe parte de um todo inexistente.'
          : 'O valor anterior não pode ser zero: qualquer variação a partir do zero seria infinita.',
    }
  }

  const etapas: Etapa[] = []
  const valor = centavos(entrada.valor)
  const referencia = centavos(entrada.referencia)

  if (usaReferencia) {
    const diferenca = subtrair(valor, referencia)

    if (entrada.operacao === 'proporcao') {
      const resultado = aliquotaEfetiva(valor, referencia, POLITICA)
      etapas.push({
        rotulo: 'Quanto a parte representa do total',
        formula: `${numero(valor)} ÷ ${numero(referencia)} × 100`,
        resultado: centavos(resultado),
        unidade: 'percentual',
      })
      etapas.push({
        rotulo: 'Quanto falta para o total',
        formula: `${numero(referencia)} − ${numero(valor)}`,
        resultado: centavos(-diferenca),
        unidade: 'numero',
      })
      return respostaPorcentagem(centavos(resultado), 'percentual', centavos(-diferenca), etapas, dataReferencia)
    }

    const resultado = aliquotaEfetiva(diferenca, referencia, POLITICA)
    etapas.push({
      rotulo: 'Diferença entre os dois valores',
      formula: `${numero(valor)} − ${numero(referencia)}`,
      resultado: diferenca,
      unidade: 'numero',
    })
    etapas.push({
      rotulo: 'Variação sobre o valor anterior',
      formula: `${numero(diferenca)} ÷ ${numero(referencia)} × 100`,
      resultado: centavos(resultado),
      unidade: 'percentual',
      justificativa:
        'A variação percentual sempre se mede sobre o valor ANTERIOR, nunca sobre o novo. ' +
        'É por isso que subir 50% e depois cair 50% não devolve ao ponto de partida.',
    })
    return respostaPorcentagem(centavos(resultado), 'percentual', diferenca, etapas, dataReferencia)
  }

  const parte = aplicarAliquota(valor, entrada.percentualBp, POLITICA)
  etapas.push({
    rotulo: `${percentual(entrada.percentualBp)} de ${numero(valor)}`,
    formula: `${numero(valor)} × ${percentual(entrada.percentualBp)}`,
    resultado: parte,
    unidade: 'numero',
  })

  if (entrada.operacao === 'parte') {
    const sobra = subtrair(valor, parte)
    etapas.push({
      rotulo: 'Quanto sobra do valor original',
      formula: `${numero(valor)} − ${numero(parte)}`,
      resultado: sobra,
      unidade: 'numero',
    })
    return respostaPorcentagem(parte, 'numero', sobra, etapas, dataReferencia)
  }

  const total =
    entrada.operacao === 'acrescimo' ? somar(valor, parte) : subtrair(valor, parte)

  etapas.push({
    rotulo: entrada.operacao === 'acrescimo' ? 'Valor com o acréscimo' : 'Valor com o desconto',
    formula: `${numero(valor)} ${entrada.operacao === 'acrescimo' ? '+' : '−'} ${numero(parte)}`,
    resultado: total,
    unidade: 'numero',
  })

  return respostaPorcentagem(total, 'numero', parte, etapas, dataReferencia)
}

function respostaPorcentagem(
  resultado: Centavos,
  unidade: 'numero' | 'percentual',
  diferenca: Centavos,
  etapas: readonly Etapa[],
  dataReferencia: DataISO,
): Resultado<SaidaPorcentagem> {
  const traco: Traco = { etapas: [...etapas], dataReferencia, vigenciasAplicadas: [] }
  return { ok: true, valores: { unidade, resultado, diferenca }, traco }
}

/**
 * Formata centésimos como "1.234,56", só para compor `formula`.
 *
 * Gêmea de `reais` em `traco.ts` e pela mesma razão: uma fórmula com "20000 ×
 * 1500" não permite conferência alguma, que é o oposto do propósito da memória.
 */
function numero(valor: Centavos): string {
  const negativo = valor < 0
  const abs = Math.abs(valor)
  const inteiro = Math.trunc(abs / CENTESIMOS_POR_UNIDADE)
  const frac = abs % CENTESIMOS_POR_UNIDADE
  const comSeparador = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${negativo ? '−' : ''}${comSeparador},${String(frac).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// CALC-054 — Álcool ou gasolina
// ---------------------------------------------------------------------------

export interface EntradaCombustivel {
  /** Preço por litro. */
  readonly precoAlcool: Centavos
  readonly precoGasolina: Centavos
  /** Consumo em km/l, em centésimos: 10,5 km/l é `1050`. */
  readonly consumoAlcool: number
  readonly consumoGasolina: number
  /** Percurso considerado, em quilômetros inteiros. */
  readonly distancia: number
}

export interface SaidaCombustivel {
  readonly custoAlcool: Centavos
  readonly custoGasolina: Centavos
  /** Sempre positiva: quanto se economiza escolhendo o mais barato. */
  readonly economia: Centavos
  readonly maisEconomico: 'alcool' | 'gasolina' | 'empate'
  readonly custoCemKmAlcool: Centavos
  readonly custoCemKmGasolina: Centavos
  /**
   * O preço do álcool que empataria com a gasolina, dado o consumo informado.
   * Acima dele, gasolina; abaixo, álcool.
   */
  readonly precoEquilibrioAlcool: Centavos
  /** Consumo do álcool como fração do da gasolina. A famosa "regra dos 70%". */
  readonly razaoConsumoBp: BasisPoints
}

/**
 * A calculadora que existe para desmentir uma regra de bolso.
 *
 * A "regra dos 70%" diz que o álcool compensa quando custa menos de 70% do
 * preço da gasolina. Ela não é lei nem norma técnica: é a razão média entre os
 * rendimentos dos dois combustíveis, e ela **varia por veículo**. Num carro em
 * que o álcool rende 75% do que rende a gasolina, a regra manda abastecer com
 * gasolina em situações nas quais o álcool é mais barato.
 *
 * Por isso o consumo dos dois combustíveis é entrada obrigatória aqui, e não um
 * padrão embutido: um valor médio inventado seria exatamente o tipo de número
 * com aparência de certo que `CLAUDE.md` aponta como o erro mais provável deste
 * projeto. Quem não souber o próprio consumo tem, na razão calculada e no preço
 * de equilíbrio, a régua para conferir a regra no próprio carro.
 */
export function calcularCombustivel(
  entrada: EntradaCombustivel,
  dataReferencia: DataISO,
): Resultado<SaidaCombustivel> {
  if (entrada.precoAlcool <= 0 || entrada.precoGasolina <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o preço dos dois combustíveis para ver o resultado.',
    }
  }
  if (entrada.consumoAlcool <= 0 || entrada.consumoGasolina <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o consumo do carro com os dois combustíveis para ver o resultado.',
    }
  }
  if (entrada.distancia <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o percurso para ver o resultado.',
    }
  }

  const etapas: Etapa[] = []
  const percursoEmCentesimos = entrada.distancia * CENTESIMOS_POR_UNIDADE

  const litrosNota = (consumo: number) =>
    `${entrada.distancia} km ÷ ${numero(centavos(consumo))} km/l`

  const custoAlcool = proporcao(
    entrada.precoAlcool,
    percursoEmCentesimos,
    entrada.consumoAlcool,
    POLITICA,
  )
  etapas.push({
    rotulo: 'Custo do percurso com álcool',
    formula: `${litrosNota(entrada.consumoAlcool)} × ${reais(entrada.precoAlcool)} por litro`,
    resultado: custoAlcool,
  })

  const custoGasolina = proporcao(
    entrada.precoGasolina,
    percursoEmCentesimos,
    entrada.consumoGasolina,
    POLITICA,
  )
  etapas.push({
    rotulo: 'Custo do percurso com gasolina',
    formula: `${litrosNota(entrada.consumoGasolina)} × ${reais(entrada.precoGasolina)} por litro`,
    resultado: custoGasolina,
  })

  const diferenca = subtrair(custoGasolina, custoAlcool)
  const maisEconomico = diferenca > 0 ? 'alcool' : diferenca < 0 ? 'gasolina' : 'empate'
  const economia = centavos(Math.abs(diferenca))

  etapas.push({
    rotulo: 'Diferença no percurso',
    formula: `${reais(custoGasolina)} (gasolina) − ${reais(custoAlcool)} (álcool)`,
    resultado: diferenca,
    justificativa:
      maisEconomico === 'empate'
        ? 'Com esses preços e esses consumos, tanto faz.'
        : `Compensa abastecer com ${maisEconomico === 'alcool' ? 'álcool' : 'gasolina'}.`,
  })

  const razaoConsumoBp = aliquotaEfetiva(
    centavos(entrada.consumoAlcool),
    centavos(entrada.consumoGasolina),
    POLITICA,
  )

  const precoEquilibrioAlcool = proporcao(
    entrada.precoGasolina,
    entrada.consumoAlcool,
    entrada.consumoGasolina,
    POLITICA,
  )

  etapas.push({
    rotulo: 'Preço de equilíbrio do álcool',
    formula: `${reais(entrada.precoGasolina)} × ${percentual(razaoConsumoBp)} (rendimento do álcool sobre o da gasolina)`,
    resultado: precoEquilibrioAlcool,
    justificativa:
      `Neste carro o álcool rende ${percentual(razaoConsumoBp)} do que rende a gasolina — ` +
      'e não os 70% da regra de bolso, que é uma média e não vale para todo veículo. ' +
      `Abaixo de ${reais(precoEquilibrioAlcool)} por litro, o álcool compensa; acima, não.`,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      custoAlcool,
      custoGasolina,
      economia,
      maisEconomico,
      custoCemKmAlcool: proporcao(
        entrada.precoAlcool,
        CENTESIMOS_POR_UNIDADE * CENTESIMOS_POR_UNIDADE,
        entrada.consumoAlcool,
        POLITICA,
      ),
      custoCemKmGasolina: proporcao(
        entrada.precoGasolina,
        CENTESIMOS_POR_UNIDADE * CENTESIMOS_POR_UNIDADE,
        entrada.consumoGasolina,
        POLITICA,
      ),
      precoEquilibrioAlcool,
      razaoConsumoBp,
    },
    traco,
  }
}
