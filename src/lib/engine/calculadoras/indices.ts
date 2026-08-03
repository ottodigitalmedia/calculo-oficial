/**
 * CALC-060 — Correção de valor por índice.
 *
 * A primeira do catálogo que consome **série econômica** em vez de parâmetro
 * legal, e `ADR-006` separa as duas com todas as letras: índice errado produz
 * estimativa imprecisa; parâmetro legal errado produz dano. Nada aqui tem
 * vigência, norma ou URL de dispositivo — e nada aqui bloqueia o build.
 *
 * **A série entra por parâmetro, como o registro entra nas trabalhistas.** O
 * motor não importa `lib/series`: `ADR-003` manda que ele não leia nada
 * ambiente, e a disciplina é a mesma que faz `dataReferencia` ser argumento em
 * vez de relógio.
 *
 * A CONVENÇÃO DA JANELA, DECLARADA PORQUE MUDA O RESULTADO
 *
 * Corrigir de março para julho aplica os índices de **abril a julho** — quatro
 * meses, não cinco. O índice de março mede a variação ocorrida *durante* março,
 * que já está embutida no valor de março. Incluí-lo contaria um mês a mais, e a
 * diferença aparece em qualquer intervalo. A memória de cálculo nomeia o
 * primeiro e o último mês aplicados, e diz quantos foram, para que a conferência
 * não dependa de acreditar nesta nota.
 */

import { subtrair } from '../money'
import { reais, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/**
 * Escala das contas intermediárias, como em `financeira.ts`.
 */
// eslint-disable-next-line no-restricted-syntax -- escala das contas intermediárias, não parâmetro legal
const ESCALA = 1_000_000_000_000n

/**
 * O denominador do percentual escalado da série.
 *
 * O valor vem em décimos de milésimo de ponto — 0,58% é `5800` —, então somar
 * um ponto percentual completo significa somar `1_000_000` ao denominador.
 */
// eslint-disable-next-line no-restricted-syntax -- definição da escala da série, não parâmetro legal
const CEM_POR_CENTO = 1_000_000n

/** 100% em basis points. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
const BP_INTEIRO = 10_000n

const MESES_NO_ANO = 12

/** A série na forma compacta: um mês inicial e um vetor posicional. */
export interface SerieMensal {
  /** Primeiro mês, em `AAAA-MM`. */
  readonly inicio: string
  readonly valores: readonly number[]
}

export interface EntradaCorrecao {
  readonly valorOriginal: Centavos
  /** Mês de partida, em `AAAA-MM`. */
  readonly de: string
  /** Mês de chegada, em `AAAA-MM`. */
  readonly ate: string
  readonly serie: SerieMensal
  readonly nomeDoIndice: string
}

export interface SaidaCorrecao {
  readonly valorCorrigido: Centavos
  readonly correcao: Centavos
  readonly variacaoBp: BasisPoints
  /**
   * O mesmo valor lido na direção contrária: quanto ele COMPRARIA na moeda do
   * mês inicial.
   *
   * Corrigir e deflacionar são a mesma conta, e é por isso que as duas saem
   * daqui em vez de virarem dois motores. `R$ 1.000,00` de 2015 equivalem a
   * `R$ 1.600,00` hoje — e `R$ 1.000,00` de hoje compram o que `R$ 625,00`
   * compravam em 2015. Os dois números respondem perguntas diferentes e
   * confundi-los é o erro clássico deste assunto.
   */
  readonly valorDeflacionado: Centavos
  /** Quanto do poder de compra se perdeu no período. */
  readonly perdaDePoderBp: BasisPoints
  readonly mesesAplicados: number
  readonly primeiroMesAplicado: string
  readonly ultimoMesAplicado: string
  /** O último mês que a série cobre, para a tela poder declarar o limite. */
  readonly ultimoMesDisponivel: string
}

/** Quantos meses separam dois rótulos `AAAA-MM`. Negativo se o segundo é antes. */
function distanciaEmMeses(de: string, ate: string): number | null {
  const a = /^(\d{4})-(\d{2})$/.exec(de)
  const b = /^(\d{4})-(\d{2})$/.exec(ate)
  if (!a || !b) return null
  return (Number(b[1]) - Number(a[1])) * MESES_NO_ANO + (Number(b[2]) - Number(a[2]))
}

/** O rótulo `AAAA-MM` que fica `n` meses depois de `inicio`. */
function mesEm(inicio: string, n: number): string {
  const encontrado = /^(\d{4})-(\d{2})$/.exec(inicio)
  if (!encontrado) return inicio
  const total = Number(encontrado[1]) * MESES_NO_ANO + (Number(encontrado[2]) - 1) + n
  const ano = Math.floor(total / MESES_NO_ANO)
  const mes = (total % MESES_NO_ANO) + 1
  return `${ano}-${String(mes).padStart(2, '0')}`
}

export function corrigirPorIndice(
  entrada: EntradaCorrecao,
  dataReferencia: DataISO,
): Resultado<SaidaCorrecao> {
  if (entrada.valorOriginal <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor a corrigir para ver o resultado.',
    }
  }

  const { serie } = entrada
  if (serie.valores.length === 0 || serie.inicio === '') {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Não há série disponível para este índice.',
    }
  }

  const ultimoMesDisponivel = mesEm(serie.inicio, serie.valores.length - 1)

  const passos = distanciaEmMeses(entrada.de, entrada.ate)
  if (passos === null) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe os dois meses para ver o resultado.' }
  }
  if (passos < 0) {
    return {
      ok: false,
      motivo: 'inconsistencia_temporal',
      detalhe: 'O mês final não pode ser anterior ao inicial.',
    }
  }

  const posicaoInicial = distanciaEmMeses(serie.inicio, entrada.de)
  if (posicaoInicial === null || posicaoInicial < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `A série do ${entrada.nomeDoIndice} começa em ${serie.inicio}. Escolha um mês a partir dali.`,
    }
  }
  if (posicaoInicial + passos > serie.valores.length - 1) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        `O último mês publicado do ${entrada.nomeDoIndice} é ${ultimoMesDisponivel}. ` +
        'Índices são divulgados com defasagem, e não há como corrigir para um mês que ainda não saiu.',
    }
  }

  const etapas: Etapa[] = []

  etapas.push({
    rotulo: 'Valor de partida',
    formula: `${reais(entrada.valorOriginal)} em ${entrada.de}`,
    resultado: entrada.valorOriginal,
  })

  /**
   * Acumula o fator, mês a mês, em `BigInt`.
   *
   * Multiplicar percentuais mês a mês é composição, não soma: quatro meses de
   * 1% não somam 4%, dão 4,06%. Fazer isso em ponto flutuante acumularia erro
   * ao longo de duzentos e quarenta meses, e `ADR-004` A-6 o proíbe de todo
   * modo.
   */
  let fator = ESCALA
  const primeiroAplicado = posicaoInicial + 1

  for (let k = primeiroAplicado; k <= posicaoInicial + passos; k += 1) {
    const valor = serie.valores[k]
    if (valor === undefined) continue
    fator = (fator * (CEM_POR_CENTO + BigInt(valor))) / CEM_POR_CENTO
  }

  const mesesAplicados = passos
  const primeiroMesAplicado = mesesAplicados > 0 ? mesEm(serie.inicio, primeiroAplicado) : entrada.ate
  const ultimoMesAplicado = entrada.ate

  const valorCorrigido = centavos(Number((BigInt(entrada.valorOriginal) * fator) / ESCALA))
  const correcao = subtrair(valorCorrigido, entrada.valorOriginal)
  const variacaoBp = Number(((fator - ESCALA) * BP_INTEIRO) / ESCALA) as BasisPoints

  /**
   * A leitura inversa: dividir em vez de multiplicar.
   *
   * Com fator zero ou negativo — hipótese que só a deflação extrema produziria
   * — a divisão não teria sentido, e o valor deflacionado fica igual ao
   * original em vez de virar um número absurdo.
   */
  const valorDeflacionado =
    fator > 0n
      ? centavos(Number((BigInt(entrada.valorOriginal) * ESCALA) / fator))
      : entrada.valorOriginal
  const perdaDePoderBp = (
    fator > 0n ? Number(((fator - ESCALA) * BP_INTEIRO) / fator) : 0
  ) as BasisPoints

  if (mesesAplicados === 0) {
    etapas.push({
      rotulo: 'Nenhum mês a aplicar',
      formula: `${entrada.de} e ${entrada.ate} são o mesmo mês`,
      resultado: entrada.valorOriginal,
      justificativa:
        'Corrigir um valor para o próprio mês não muda nada. Escolha um mês final posterior ' +
        'para ver a correção.',
    })
  } else {
    etapas.push({
      rotulo: `Índices aplicados — ${mesesAplicados} ${mesesAplicados === 1 ? 'mês' : 'meses'}`,
      formula: `${entrada.nomeDoIndice} de ${primeiroMesAplicado} a ${ultimoMesAplicado}, multiplicados um a um`,
      resultado: centavos(variacaoBp),
      unidade: 'percentual',
      justificativa:
        `O índice de ${entrada.de} NÃO entra: ele mede a variação ocorrida durante aquele mês, ` +
        'que já está dentro do valor de partida. Índices se multiplicam, não se somam — a ' +
        'variação acumulada é o produto dos fatores mensais, e não a soma dos percentuais.',
    })
  }

  etapas.push({
    rotulo: 'Correção',
    formula: `${reais(entrada.valorOriginal)} × (1 + variação acumulada)`,
    resultado: valorCorrigido,
  })

  etapas.push({
    rotulo: 'Quanto foi acrescentado',
    formula: `${reais(valorCorrigido)} − ${reais(entrada.valorOriginal)}`,
    resultado: correcao,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      valorCorrigido,
      correcao,
      variacaoBp,
      valorDeflacionado,
      perdaDePoderBp,
      mesesAplicados,
      primeiroMesAplicado,
      ultimoMesAplicado,
      ultimoMesDisponivel,
    },
    traco,
  }
}
