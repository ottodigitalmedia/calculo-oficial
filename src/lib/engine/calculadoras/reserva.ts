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
import { multiplicarPorInteiro, naoNegativo, somar, subtrair } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/** Escala das etapas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

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
  let saldo = entrada.jaGuardado
  let meses = 0
  let rendimentoAcumulado: Centavos = ZERO

  while (saldo < meta && meses < LIMITE_DE_MESES) {
    const rendimento = jurosDoPeriodo(saldo, entrada.rendimentoMensalBp)
    const passo = somar(rendimento, entrada.aporteMensal)
    // Sem aporte e sem rendimento o saldo não anda — dizer isso é melhor que
    // devolver o teto do laço como se fosse resposta.
    if (passo <= 0) break
    saldo = somar(saldo, passo)
    rendimentoAcumulado = somar(rendimentoAcumulado, rendimento)
    meses += 1
  }

  const alcancavel = metaAlcancada || saldo >= meta
  const mesesAteAMeta = alcancavel ? meses : 0
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
