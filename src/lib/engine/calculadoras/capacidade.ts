/**
 * CALC-032 — Capacidade de financiamento: renda × parcela.
 *
 * **Responde a pergunta ao contrário das outras do bloco.** CALC-024 e CALC-025
 * partem do valor financiado e chegam à parcela; esta parte da renda e chega ao
 * valor. É a mesma matemática lida de trás para frente — `valorPresenteDeSerie`,
 * que já existe em `financeira.ts` desde CALC-024.
 *
 * NENHUM PARÂMETRO LEGAL, E ISSO PRECISA ESTAR DITO
 *
 * O limite de comprometimento de renda — os famosos 30% — **não está em lei
 * nenhuma**. É política de crédito de cada instituição, varia por banco, por
 * linha e por perfil, e o Banco Central não o fixa. Por isso ele é **campo**,
 * com um padrão declarado como praxe de mercado e não como norma.
 *
 * Inventar um parâmetro legal onde não existe seria pior que não ter a
 * calculadora: o produto inteiro se sustenta em não fazer isso.
 */

import { parcelaPrice, valorPresenteDeSerie } from '../financeira'
import { aplicarAliquota, subtrair, somar } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/** `RN-007`: empate para cima. */
const POLITICA = 'meio_para_cima' as const

export interface EntradaCapacidade {
  readonly rendaMensal: Centavos
  /** Outras parcelas já comprometidas por mês. */
  readonly dividasAtuais: Centavos
  /** Percentual da renda que o banco admite comprometer. */
  readonly comprometimentoBp: BasisPoints
  readonly taxaMensal: BasisPoints
  readonly prazoMeses: number
  /** Quanto se tem de entrada. Soma-se ao valor financiável. */
  readonly entrada: Centavos
}

export interface SaidaCapacidade {
  readonly parcelaMaxima: Centavos
  readonly valorFinanciavel: Centavos
  /** Financiável mais a entrada — o teto do imóvel ou do bem. */
  readonly valorTotalDoBem: Centavos
  readonly totalPago: Centavos
  readonly jurosTotais: Centavos
  /** Verdadeiro quando as dívidas atuais já consomem a margem inteira. */
  readonly semMargem: boolean
}

export function calcularCapacidade(
  entrada: EntradaCapacidade,
  dataReferencia: DataISO,
): Resultado<SaidaCapacidade> {
  if (entrada.rendaMensal <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a renda mensal para ver o resultado.' }
  }
  if (entrada.comprometimentoBp <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o percentual de comprometimento admitido.' }
  }
  if (entrada.prazoMeses <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o prazo do financiamento.' }
  }
  if (entrada.taxaMensal < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A taxa não pode ser negativa.' }
  }
  if (entrada.dividasAtuais < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'As dívidas atuais não podem ser negativas.' }
  }

  const etapas: Etapa[] = []

  // -------------------------------------------------------------------------
  // 1. A margem
  // -------------------------------------------------------------------------
  const margemBruta = aplicarAliquota(entrada.rendaMensal, entrada.comprometimentoBp, POLITICA)
  etapas.push({
    rotulo: 'Margem admitida sobre a renda',
    formula: `${reais(entrada.rendaMensal)} × ${percentual(entrada.comprometimentoBp)}`,
    resultado: margemBruta,
    justificativa:
      'Este percentual NÃO está em lei. É política de crédito, varia por banco, por linha e por ' +
      'perfil — o valor usado aqui foi você quem informou.',
  })

  const parcelaMaxima = subtrair(margemBruta, entrada.dividasAtuais)
  const semMargem = parcelaMaxima <= 0

  if (entrada.dividasAtuais > 0) {
    etapas.push({
      rotulo: 'Margem que sobra',
      formula: `${reais(margemBruta)} − ${reais(entrada.dividasAtuais)} (parcelas já comprometidas)`,
      resultado: semMargem ? ZERO : parcelaMaxima,
      justificativa:
        'O banco olha o comprometimento TOTAL da renda, não só o do financiamento novo. ' +
        'Parcelas de outros contratos entram na conta e reduzem o que sobra.',
    })
  }

  if (semMargem) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        `As parcelas atuais (${reais(entrada.dividasAtuais)}) já consomem toda a margem de ` +
        `${reais(margemBruta)}. Não há espaço para um financiamento novo neste cenário.`,
    }
  }

  // -------------------------------------------------------------------------
  // 2. Da parcela ao valor — a inversão que dá nome à calculadora
  // -------------------------------------------------------------------------
  const valorFinanciavel = valorPresenteDeSerie(parcelaMaxima, entrada.prazoMeses, entrada.taxaMensal)

  etapas.push({
    rotulo: 'Quanto essa parcela financia',
    formula:
      `Valor presente de ${entrada.prazoMeses} parcelas de ${reais(parcelaMaxima)} ` +
      `descontadas a ${percentual(entrada.taxaMensal)} ao mês`,
    resultado: valorFinanciavel,
    justificativa:
      'É a conta do financiamento lida de trás para frente: em vez de partir do valor e chegar ' +
      'à parcela, parte da parcela que cabe no seu orçamento e chega ao valor que ela sustenta.',
  })

  const valorTotalDoBem = somar(valorFinanciavel, entrada.entrada)

  if (entrada.entrada > 0) {
    etapas.push({
      rotulo: 'Com a entrada',
      formula: `${reais(valorFinanciavel)} + ${reais(entrada.entrada)}`,
      resultado: valorTotalDoBem,
      justificativa:
        'A entrada não é financiada, então ela soma direto ao teto — cada real de entrada vale ' +
        'um real a mais de bem, sem juros por cima.',
    })
  }

  // -------------------------------------------------------------------------
  // 3. O que o financiamento custa
  // -------------------------------------------------------------------------
  const parcelaConferida = parcelaPrice(valorFinanciavel, entrada.prazoMeses, entrada.taxaMensal)
  const totalPago = centavos(parcelaConferida * entrada.prazoMeses)
  const jurosTotais = subtrair(totalPago, valorFinanciavel)

  etapas.push({
    rotulo: 'Total pago ao fim do prazo',
    formula: `${reais(parcelaConferida)} × ${entrada.prazoMeses} parcelas`,
    resultado: totalPago,
  })

  etapas.push({
    rotulo: 'Juros ao longo do contrato',
    formula: `${reais(totalPago)} − ${reais(valorFinanciavel)}`,
    resultado: jurosTotais,
    justificativa:
      'Em prazos longos os juros costumam superar o valor financiado. É o número que o prazo ' +
      'esconde: alongar reduz a parcela e aumenta muito o total.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      parcelaMaxima,
      valorFinanciavel,
      valorTotalDoBem,
      totalPago,
      jurosTotais,
      semMargem: false,
    },
    traco,
  }
}
