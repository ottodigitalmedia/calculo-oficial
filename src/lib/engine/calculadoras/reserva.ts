/**
 * CALC-044 — Reserva de emergência: dimensionamento.
 *
 * **O número de meses não é regra, e a calculadora não finge que é.** "Seis
 * meses de despesa" é praxe repetida, não norma — não há dispositivo legal, nem
 * órgão que a fixe, e o valor adequado depende da estabilidade da renda de cada
 * um. Ele entra como **campo**, com padrão declarado, pelo mesmo motivo que o
 * percentual de comprometimento em CALC-032: alegar fundamento onde não há é o
 * pior tipo de imprecisão num produto cuja tese é a auditabilidade.
 *
 * O que a calculadora faz é aritmética verificável: multiplicar a despesa pelos
 * meses, subtrair o que já existe e simular quanto tempo o aporte leva para
 * fechar a diferença.
 *
 * Sem parâmetro legal: tudo o que entra é digitado.
 */

import { jurosDoPeriodo } from '../financeira'
import {
  aplicarAliquota,
  dividirPorInteiro,
  multiplicarPorInteiro,
  naoNegativo,
  proporcao,
  somar,
  subtrair,
} from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/** Escala das etapas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

const MESES_NO_ANO = 12

/**
 * Teto da simulação: cem anos de aportes.
 *
 * Não é otimização, é guarda. Sem aporte e sem rendimento o saldo fica parado e
 * o laço não terminaria — e um aporte pequeno demais diante de uma meta grande
 * produz um número de meses que não é resposta, é ruído. Alcançado o teto, a
 * calculadora diz que não alcança, em vez de devolver "1.200 meses".
 */
// eslint-disable-next-line no-restricted-syntax -- teto da simulação, não parâmetro legal
const LIMITE_DE_MESES = 1_200

export interface Acumulacao {
  readonly meses: number
  readonly saldoFinal: Centavos
  readonly rendimentoAcumulado: Centavos
  readonly alcancou: boolean
}

/**
 * Quantos meses de aporte levam o saldo até a meta.
 *
 * Compartilhada por CALC-044 e CALC-043, que fazem a mesma pergunta em escalas
 * diferentes: uma acumula meses de despesa, a outra acumula o patrimônio que
 * sustenta a despesa para sempre. A conta é a mesma, e duplicá-la deixaria duas
 * verdades sobre o mesmo laço — que divergem na primeira manutenção.
 */
export function acumularAte(
  saldoInicial: Centavos,
  meta: Centavos,
  aporteMensal: Centavos,
  rendimentoMensalBp: BasisPoints,
): Acumulacao {
  let saldo = saldoInicial
  let meses = 0
  let rendimentoAcumulado: Centavos = ZERO

  while (saldo < meta && meses < LIMITE_DE_MESES) {
    const rendimento = jurosDoPeriodo(saldo, rendimentoMensalBp)
    const passo = somar(rendimento, aporteMensal)
    // Sem aporte e sem rendimento o saldo não anda — dizer isso é melhor que
    // devolver o teto do laço como se fosse resposta.
    if (passo <= 0) break
    saldo = somar(saldo, passo)
    rendimentoAcumulado = somar(rendimentoAcumulado, rendimento)
    meses += 1
  }

  return { meses, saldoFinal: saldo, rendimentoAcumulado, alcancou: saldo >= meta }
}

export interface EntradaReserva {
  readonly despesaMensal: Centavos
  readonly mesesDeCobertura: number
  readonly jaGuardado: Centavos
  readonly aporteMensal: Centavos
  readonly rendimentoMensalBp: BasisPoints
}

export interface SaidaReserva {
  readonly meta: Centavos
  readonly faltaReunir: Centavos
  readonly metaAlcancada: boolean
  /** Verdadeiro quando o aporte informado fecha a diferença dentro do teto. */
  readonly alcancavel: boolean
  readonly mesesAteAMeta: number
  readonly totalAportado: Centavos
  readonly rendimentoAcumulado: Centavos
}

export function calcularReserva(
  entrada: EntradaReserva,
  dataReferencia: DataISO,
): Resultado<SaidaReserva> {
  if (entrada.despesaMensal <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a sua despesa mensal para ver o resultado.',
    }
  }
  if (entrada.mesesDeCobertura <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quantos meses a reserva deve cobrir para ver o resultado.',
    }
  }
  if (entrada.jaGuardado < 0 || entrada.aporteMensal < 0 || entrada.rendimentoMensalBp < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Valor guardado, aporte e rendimento não podem ser negativos.',
    }
  }

  const etapas: Etapa[] = []

  const meta = multiplicarPorInteiro(entrada.despesaMensal, entrada.mesesDeCobertura)
  etapas.push({
    rotulo: 'Meta da reserva',
    formula: `${reais(entrada.despesaMensal)} × ${entrada.mesesDeCobertura} meses de cobertura`,
    resultado: meta,
    justificativa:
      'O número de meses foi você quem escolheu. Não existe percentual ou prazo fixado em ' +
      'norma para reserva de emergência — o que se repete por aí é praxe, e ela não distingue ' +
      'quem tem renda estável de quem não tem.',
  })

  const faltaReunir = naoNegativo(subtrair(meta, entrada.jaGuardado))
  const metaAlcancada = entrada.jaGuardado >= meta

  etapas.push({
    rotulo: metaAlcancada ? 'Meta já alcançada' : 'Quanto ainda falta reunir',
    formula: `${reais(meta)} − ${reais(entrada.jaGuardado)} já guardados`,
    resultado: faltaReunir,
  })

  // --- Quanto tempo o aporte leva para fechar a diferença ---
  const acumulacao = acumularAte(
    entrada.jaGuardado,
    meta,
    entrada.aporteMensal,
    entrada.rendimentoMensalBp,
  )
  const rendimentoAcumulado = acumulacao.rendimentoAcumulado

  const alcancavel = metaAlcancada || acumulacao.alcancou
  const mesesAteAMeta = alcancavel ? acumulacao.meses : 0
  const totalAportado = multiplicarPorInteiro(entrada.aporteMensal, mesesAteAMeta)

  if (metaAlcancada) {
    etapas.push({
      rotulo: 'Sobra sobre a meta',
      formula: `${reais(entrada.jaGuardado)} − ${reais(meta)}`,
      resultado: subtrair(entrada.jaGuardado, meta),
      justificativa:
        'O que passa da meta não deixa de ser seu — deixa apenas de ter a função de reserva, e ' +
        'pode ser tratado como qualquer outro dinheiro poupado.',
    })
  } else if (alcancavel) {
    etapas.push({
      rotulo: 'Meses de aporte até fechar a diferença',
      formula:
        `${reais(faltaReunir)} com aportes de ${reais(entrada.aporteMensal)} ao mês` +
        (entrada.rendimentoMensalBp > 0
          ? `, rendendo ${percentual(entrada.rendimentoMensalBp)} ao mês`
          : ', sem rendimento'),
      resultado: centavos(mesesAteAMeta * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
    })

    if (rendimentoAcumulado > 0) {
      etapas.push({
        rotulo: 'Quanto o rendimento contribuiu no caminho',
        formula: `${reais(faltaReunir)} a reunir − ${reais(totalAportado)} de aportes`,
        resultado: rendimentoAcumulado,
        justificativa:
          'Quanto mais longo o caminho, maior a fatia que vem do rendimento em vez do bolso.',
      })
    }
  } else {
    etapas.push({
      rotulo: 'Com este aporte, a meta não é alcançada',
      formula:
        entrada.aporteMensal === 0
          ? 'Nenhum aporte mensal foi informado'
          : `${reais(entrada.aporteMensal)} ao mês não fecham ${reais(faltaReunir)} em prazo útil`,
      resultado: ZERO,
      justificativa:
        'A calculadora prefere dizer isso a devolver um prazo de décadas, que não é resposta ' +
        'para uma reserva de emergência.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      meta,
      faltaReunir,
      metaAlcancada,
      alcancavel,
      mesesAteAMeta,
      totalAportado,
      rendimentoAcumulado,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-043 — Meta de independência financeira
// ---------------------------------------------------------------------------

/**
 * **A "regra dos 4%" é heurística, não norma — e aqui ela é campo.**
 *
 * Ela vem de um estudo sobre carteiras americanas ao longo do século XX, e o que
 * ele mede é a taxa de retirada que sobreviveu aos piores trinta anos daquela
 * série. Não é lei, não é garantia, e não foi medida sobre juro brasileiro. O
 * mesmo critério de CALC-032 e CALC-044 se aplica: o número entra como campo com
 * padrão declarado, e a memória diz que a escolha foi do usuário.
 */
export interface EntradaIndependencia {
  readonly despesaMensalDesejada: Centavos
  /** Taxa anual de retirada sobre o patrimônio. 4,00% é `400`. */
  readonly taxaDeRetiradaAnualBp: BasisPoints
  readonly jaInvestido: Centavos
  readonly aporteMensal: Centavos
  readonly rendimentoMensalBp: BasisPoints
}

export interface SaidaIndependencia {
  readonly despesaAnual: Centavos
  readonly patrimonioNecessario: Centavos
  readonly faltaAcumular: Centavos
  readonly metaAlcancada: boolean
  readonly alcancavel: boolean
  readonly mesesAteAMeta: number
  readonly anosAteAMetaCentesimos: number
  readonly totalAportado: Centavos
  readonly rendimentoAcumulado: Centavos
  /** Quanto o patrimônio de hoje já sustentaria por mês, à mesma taxa. */
  readonly rendaMensalDeHoje: Centavos
}

export function calcularIndependencia(
  entrada: EntradaIndependencia,
  dataReferencia: DataISO,
): Resultado<SaidaIndependencia> {
  if (entrada.despesaMensalDesejada <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a renda mensal que você quer sustentar para ver o resultado.',
    }
  }
  if (entrada.taxaDeRetiradaAnualBp <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a taxa de retirada anual para ver o resultado.',
    }
  }
  if (entrada.jaInvestido < 0 || entrada.aporteMensal < 0 || entrada.rendimentoMensalBp < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Patrimônio, aporte e rendimento não podem ser negativos.',
    }
  }

  const etapas: Etapa[] = []

  const despesaAnual = multiplicarPorInteiro(entrada.despesaMensalDesejada, MESES_NO_ANO)
  etapas.push({
    rotulo: 'Quanto você quer retirar em um ano',
    formula: `${reais(entrada.despesaMensalDesejada)} × 12 meses`,
    resultado: despesaAnual,
  })

  /**
   * Patrimônio = retirada anual ÷ taxa de retirada.
   *
   * A divisão é feita como proporção sobre o denominador do basis point, e não
   * por ponto flutuante: é a mesma aritmética inteira do resto do sistema.
   */
  const patrimonioNecessario = proporcao(
    despesaAnual,
    // eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
    10_000,
    entrada.taxaDeRetiradaAnualBp,
    'meio_para_cima',
  )

  etapas.push({
    rotulo: 'Patrimônio que sustenta essa retirada',
    formula: `${reais(despesaAnual)} ÷ ${percentual(entrada.taxaDeRetiradaAnualBp)} ao ano`,
    resultado: patrimonioNecessario,
    justificativa:
      'A taxa de retirada foi você quem escolheu. Os quatro por cento que se repetem por aí ' +
      'vêm de um estudo sobre carteiras americanas do século passado, medindo quanto sobreviveu ' +
      'aos piores trinta anos daquela série. Não é norma, não é garantia, e não foi medida ' +
      'sobre juro brasileiro.',
  })

  const rendaMensalDeHoje = dividirPorInteiro(
    aplicarAliquota(entrada.jaInvestido, entrada.taxaDeRetiradaAnualBp, 'meio_para_cima'),
    MESES_NO_ANO,
    'meio_para_cima',
  )

  if (entrada.jaInvestido > 0) {
    etapas.push({
      rotulo: 'O que o seu patrimônio de hoje já sustentaria por mês',
      formula: `${reais(entrada.jaInvestido)} × ${percentual(entrada.taxaDeRetiradaAnualBp)} ÷ 12`,
      resultado: rendaMensalDeHoje,
    })
  }

  const faltaAcumular = naoNegativo(subtrair(patrimonioNecessario, entrada.jaInvestido))
  const metaAlcancada = entrada.jaInvestido >= patrimonioNecessario

  etapas.push({
    rotulo: metaAlcancada ? 'Meta já alcançada' : 'Quanto ainda falta acumular',
    formula: `${reais(patrimonioNecessario)} − ${reais(entrada.jaInvestido)}`,
    resultado: faltaAcumular,
  })

  const acumulacao = acumularAte(
    entrada.jaInvestido,
    patrimonioNecessario,
    entrada.aporteMensal,
    entrada.rendimentoMensalBp,
  )
  const alcancavel = metaAlcancada || acumulacao.alcancou
  const mesesAteAMeta = alcancavel ? acumulacao.meses : 0
  const totalAportado = multiplicarPorInteiro(entrada.aporteMensal, mesesAteAMeta)
  const anosAteAMetaCentesimos = proporcao(
    centavos(mesesAteAMeta * CENTESIMOS_POR_UNIDADE),
    1,
    MESES_NO_ANO,
    'meio_para_cima',
  )

  if (!metaAlcancada && alcancavel) {
    etapas.push({
      rotulo: 'Meses de aporte até lá',
      formula:
        `${reais(faltaAcumular)} com aportes de ${reais(entrada.aporteMensal)} ao mês` +
        (entrada.rendimentoMensalBp > 0
          ? `, rendendo ${percentual(entrada.rendimentoMensalBp)} ao mês`
          : ', sem rendimento'),
      resultado: centavos(mesesAteAMeta * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      justificativa:
        `São cerca de ${Math.trunc(mesesAteAMeta / MESES_NO_ANO)} anos no ritmo informado. ` +
        'O caminho é sensível ao rendimento: uma diferença pequena na taxa mensal desloca o ' +
        'prazo em anos, e é por isso que ela é campo e não um número que a calculadora escolhe.',
    })

    if (acumulacao.rendimentoAcumulado > 0) {
      etapas.push({
        rotulo: 'Quanto veio do rendimento, e não do bolso',
        formula: `${reais(faltaAcumular)} a acumular − ${reais(totalAportado)} de aportes`,
        resultado: acumulacao.rendimentoAcumulado,
      })
    }
  } else if (!metaAlcancada) {
    etapas.push({
      rotulo: 'Com este aporte, a meta não é alcançada',
      formula:
        entrada.aporteMensal === 0
          ? 'Nenhum aporte mensal foi informado'
          : `${reais(entrada.aporteMensal)} ao mês não fecham ${reais(faltaAcumular)} em prazo útil`,
      resultado: ZERO,
      justificativa:
        'Prazo de mais de cem anos não é resposta. As alavancas são o aporte, o rendimento e a ' +
        'própria despesa que se quer sustentar — e esta última costuma ser a mais eficaz, ' +
        'porque encolhe a meta e o caminho ao mesmo tempo.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      despesaAnual,
      patrimonioNecessario,
      faltaAcumular,
      metaAlcancada,
      alcancavel,
      mesesAteAMeta,
      anosAteAMetaCentesimos,
      totalAportado,
      rendimentoAcumulado: acumulacao.rendimentoAcumulado,
      rendaMensalDeHoje,
    },
    traco,
  }
}
