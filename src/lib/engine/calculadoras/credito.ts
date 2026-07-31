/**
 * CALC-024 — CET · CALC-025 — Amortização SAC vs. Price.
 *
 * As duas primeiras do bloco de crédito, e as primeiras do catálogo **sem
 * parâmetro legal nenhum**: tudo o que entra é digitado. O que elas têm de
 * norma é o CET, cuja definição e fórmula estão na Resolução CMN nº
 * 4.881/2020 — e é ela que a memória cita.
 *
 * O motor de taxa interna que CALC-024 exige é o mesmo de que precisarão
 * CALC-029 (portabilidade), CALC-056 (financiamento de veículo) e o
 * comparativo de CALC-031. Construído uma vez, em `engine/financeira.ts`.
 */

import {
  anualizar,
  jurosDoPeriodo,
  parcelaPrice,
  taxaInternaMensal,
} from '../financeira'
import { multiplicarPorInteiro, naoNegativo, somar, subtrair } from '../money'
import { fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import { RESOLUCAO_CMN_4881 } from '../../params/data/fontes'

const AVOS_NO_ANO = 12

// ---------------------------------------------------------------------------
// CALC-024 — Custo efetivo total
// ---------------------------------------------------------------------------

export interface EntradaCet {
  /** O que entrou na conta do tomador. */
  readonly valorLiberado: Centavos
  readonly valorParcela: Centavos
  readonly prazoMeses: number
  /** Tarifas, seguros e tributos descontados na liberação. */
  readonly despesasNaLiberacao: Centavos
}

export interface SaidaCet {
  readonly cetMensal: BasisPoints
  readonly cetAnual: BasisPoints
  readonly recebidoDeFato: Centavos
  readonly totalPago: Centavos
  readonly custoTotal: Centavos
}

export function calcularCet(entrada: EntradaCet, dataReferencia: DataISO): Resultado<SaidaCet> {
  if (entrada.valorLiberado <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor liberado para ver o resultado.' }
  }
  if (entrada.valorParcela <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor da parcela para ver o resultado.' }
  }
  if (entrada.prazoMeses <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o número de parcelas para ver o resultado.' }
  }

  const etapas: Etapa[] = []

  /**
   * `FC0` da Resolução: o crédito concedido **deduzido** das despesas e
   * tarifas pagas antecipadamente.
   *
   * É a diferença entre o CET e a taxa do contrato. A taxa nominal olha o
   * valor contratado; o CET olha o que de fato entrou no bolso de quem tomou.
   */
  const recebidoDeFato = naoNegativo(subtrair(entrada.valorLiberado, entrada.despesasNaLiberacao))

  if (entrada.despesasNaLiberacao > 0) {
    etapas.push({
      rotulo: 'Valor que de fato entrou',
      formula: `${reais(entrada.valorLiberado)} − ${reais(entrada.despesasNaLiberacao)} (tarifas e despesas)`,
      resultado: recebidoDeFato,
      fundamento: fundamentar(RESOLUCAO_CMN_4881),
      justificativa:
        'A norma manda deduzir do crédito concedido as despesas e tarifas pagas ' +
        'antecipadamente. É essa dedução que separa o CET da taxa do contrato.',
    })
  } else {
    etapas.push({
      rotulo: 'Valor liberado',
      formula: `Informado: ${reais(recebidoDeFato)}`,
      resultado: recebidoDeFato,
    })
  }

  const totalPago = multiplicarPorInteiro(entrada.valorParcela, entrada.prazoMeses)
  etapas.push({
    rotulo: 'Total das parcelas',
    formula: `${reais(entrada.valorParcela)} × ${entrada.prazoMeses} parcelas`,
    resultado: totalPago,
  })

  const cetMensal = taxaInternaMensal(recebidoDeFato, entrada.valorParcela, entrada.prazoMeses)
  if (cetMensal === null) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        'A soma das parcelas não supera o valor recebido — confira os valores informados.',
    }
  }

  const cetAnual = anualizar(cetMensal)

  etapas.push({
    rotulo: 'CET ao mês',
    formula: `Taxa que iguala ${reais(recebidoDeFato)} ao valor presente de ${entrada.prazoMeses} parcelas de ${reais(entrada.valorParcela)}`,
    resultado: ZERO,
    fundamento: fundamentar(RESOLUCAO_CMN_4881),
    justificativa:
      `Resultado: ${percentual(cetMensal)} ao mês. Não existe fórmula fechada para essa ` +
      'taxa: ela é encontrada por busca, testando taxas até o valor presente das parcelas ' +
      'coincidir com o que foi recebido.',
  })

  etapas.push({
    rotulo: 'CET ao ano',
    formula: `(1 + ${percentual(cetMensal)})^12 − 1 = ${percentual(cetAnual)}`,
    resultado: ZERO,
  })

  const custoTotal = subtrair(totalPago, recebidoDeFato)
  etapas.push({
    rotulo: 'Custo total do crédito',
    formula: `${reais(totalPago)} − ${reais(recebidoDeFato)}`,
    resultado: custoTotal,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: { cetMensal, cetAnual, recebidoDeFato, totalPago, custoTotal },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-025 — SAC vs. Price
// ---------------------------------------------------------------------------

export interface EntradaAmortizacao {
  readonly principal: Centavos
  readonly prazoMeses: number
  readonly taxaMensal: BasisPoints
}

export interface LinhaDoAno {
  readonly ano: number
  readonly parcelaSac: Centavos
  readonly parcelaPrice: Centavos
  readonly saldoSac: Centavos
  readonly saldoPrice: Centavos
}

export interface SaidaAmortizacao {
  readonly primeiraParcelaSac: Centavos
  readonly ultimaParcelaSac: Centavos
  readonly totalSac: Centavos
  readonly jurosSac: Centavos
  readonly parcelaPriceConstante: Centavos
  readonly totalPrice: Centavos
  readonly jurosPrice: Centavos
  readonly economiaDoSac: Centavos
  readonly evolucao: readonly LinhaDoAno[]
}

export function calcularAmortizacao(
  entrada: EntradaAmortizacao,
  dataReferencia: DataISO,
): Resultado<SaidaAmortizacao> {
  if (entrada.principal <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor financiado para ver o resultado.' }
  }
  if (entrada.prazoMeses <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o prazo para ver o resultado.' }
  }
  if (entrada.taxaMensal < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A taxa não pode ser negativa.' }
  }

  const etapas: Etapa[] = []
  const n = entrada.prazoMeses

  // --- Price: prestação constante ---
  const parcelaConstante = parcelaPrice(entrada.principal, n, entrada.taxaMensal)
  etapas.push({
    rotulo: 'Price — prestação constante',
    formula: `${reais(entrada.principal)} × ${percentual(entrada.taxaMensal)} × (1+i)^${n} ÷ ((1+i)^${n} − 1)`,
    resultado: parcelaConstante,
    justificativa:
      'No sistema francês a prestação não muda. No começo quase tudo é juro, e a ' +
      'amortização cresce a cada mês.',
  })

  // --- SAC: amortização constante ---
  const amortizacaoConstante = centavos(Math.round(entrada.principal / n))
  const jurosPrimeiro = jurosDoPeriodo(entrada.principal, entrada.taxaMensal)
  const primeiraParcelaSac = somar(amortizacaoConstante, jurosPrimeiro)

  etapas.push({
    rotulo: 'SAC — amortização constante',
    formula: `${reais(entrada.principal)} ÷ ${n} = ${reais(amortizacaoConstante)} por mês, mais juros sobre o saldo`,
    resultado: primeiraParcelaSac,
    justificativa:
      'No sistema de amortização constante a parcela começa mais alta e cai todo mês, ' +
      'porque os juros incidem sobre um saldo que diminui em passos iguais.',
  })

  // --- Evolução mês a mês, resumida por ano ---
  let saldoSac: Centavos = entrada.principal
  let saldoPrice: Centavos = entrada.principal
  let totalSac: Centavos = ZERO
  let totalPrice: Centavos = ZERO
  let jurosSac: Centavos = ZERO
  let jurosPrice: Centavos = ZERO
  let ultimaParcelaSac: Centavos = ZERO
  const evolucao: LinhaDoAno[] = []

  for (let mes = 1; mes <= n; mes += 1) {
    const jurosDoMesSac = jurosDoPeriodo(saldoSac, entrada.taxaMensal)
    // A última parcela liquida o que restou, absorvendo o arredondamento.
    const amortizaSac = mes === n ? saldoSac : amortizacaoConstante
    const parcelaSac = somar(amortizaSac, jurosDoMesSac)
    saldoSac = naoNegativo(subtrair(saldoSac, amortizaSac))
    totalSac = somar(totalSac, parcelaSac)
    jurosSac = somar(jurosSac, jurosDoMesSac)
    ultimaParcelaSac = parcelaSac

    const jurosDoMesPrice = jurosDoPeriodo(saldoPrice, entrada.taxaMensal)
    const amortizaPrice =
      mes === n ? saldoPrice : naoNegativo(subtrair(parcelaConstante, jurosDoMesPrice))
    const pagoPrice = mes === n ? somar(saldoPrice, jurosDoMesPrice) : parcelaConstante
    saldoPrice = naoNegativo(subtrair(saldoPrice, amortizaPrice))
    totalPrice = somar(totalPrice, pagoPrice)
    jurosPrice = somar(jurosPrice, jurosDoMesPrice)

    if (mes % AVOS_NO_ANO === 0 || mes === n) {
      evolucao.push({
        ano: Math.ceil(mes / AVOS_NO_ANO),
        parcelaSac,
        parcelaPrice: pagoPrice,
        saldoSac,
        saldoPrice,
      })
    }
  }

  const economiaDoSac = subtrair(totalPrice, totalSac)

  etapas.push({
    rotulo: 'Total pago no SAC',
    formula: `Soma das ${n} parcelas decrescentes, de ${reais(primeiraParcelaSac)} a ${reais(ultimaParcelaSac)}`,
    resultado: totalSac,
  })

  etapas.push({
    rotulo: 'Total pago no Price',
    formula: `${reais(parcelaConstante)} × ${n} parcelas`,
    resultado: totalPrice,
  })

  etapas.push({
    rotulo: 'Diferença entre os dois sistemas',
    formula: `${reais(totalPrice)} (Price) − ${reais(totalSac)} (SAC)`,
    resultado: economiaDoSac,
    justificativa:
      'O SAC custa menos no total porque amortiza mais cedo — e exige mais no começo, ' +
      'que é exatamente o motivo de nem sempre ser a melhor escolha.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      primeiraParcelaSac,
      ultimaParcelaSac,
      totalSac,
      jurosSac,
      parcelaPriceConstante: parcelaConstante,
      totalPrice,
      jurosPrice,
      economiaDoSac,
      evolucao,
    },
    traco,
  }
}

export { basisPoints, centavos }
