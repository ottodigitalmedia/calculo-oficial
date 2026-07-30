/**
 * CALC-022 — Juros compostos com aportes mensais.
 *
 * A única do lançamento **sem parâmetro legal**: a taxa é digitada pelo
 * usuário. Manutenção nula, nenhuma vigência a auditar — e é a única na
 * vertical de maior valor publicitário do catálogo.
 *
 * COMO A ARITMÉTICA SE MANTÉM INTEIRA
 *
 * O saldo capitaliza mês a mês em centavos, e cada mês arredonda uma vez —
 * que é como uma conta real se comporta. Nenhuma potência é aplicada sobre
 * dinheiro.
 *
 * A exceção é a CONVERSÃO da taxa anual em mensal equivalente, que exige a
 * raiz décima segunda e é irracional por natureza. Ela é feita uma única vez,
 * sobre a TAXA e não sobre valor monetário, e o resultado é fixado como
 * fração exata de denominador 1e9 (`ADR-007`) — precisão suficiente para que o
 * erro não se acumule ao longo de centenas de meses. A taxa efetivamente
 * usada aparece na memória, arredondada, para o usuário poder conferir.
 */

import { proporcao, somar } from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { ZERO, type BasisPoints, type Centavos, basisPoints, centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/** Denominador da taxa mensal em fração exata (`ADR-007`). */
// eslint-disable-next-line no-restricted-syntax -- denominador de precisão, não parâmetro legal (BV-10)
const PRECISAO = 1_000_000_000

/** 100% em basis points. Definição de unidade (`ADR-004` A-2), não constante legal. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (BV-10)
const BP_POR_INTEIRO = 10_000

const MESES_NO_ANO = 12

export interface EntradaJurosCompostos {
  readonly valorInicial: Centavos
  readonly aporteMensal: Centavos
  /** Taxa em basis points. 10,5% é `1050`. */
  readonly taxa: BasisPoints
  readonly taxaAoAno: boolean
  readonly meses: number
}

export interface LinhaEvolucao {
  readonly ano: number
  readonly investido: Centavos
  readonly juros: Centavos
  readonly saldo: Centavos
}

export interface SaidaJurosCompostos {
  readonly montante: Centavos
  readonly totalInvestido: Centavos
  readonly totalJuros: Centavos
  /** Taxa mensal efetivamente aplicada, em basis points, para exibição. */
  readonly taxaMensalBp: BasisPoints
  readonly evolucao: readonly LinhaEvolucao[]
}

/**
 * Numerador da taxa mensal sobre `PRECISAO`.
 *
 * Único ponto de ponto flutuante do motor, e ele não toca dinheiro: converte
 * uma taxa em outra taxa. `(1 + i)^(1/12) − 1` não tem forma racional exata,
 * e fingir que tem seria pior que declarar a aproximação.
 */
function numeradorDaTaxaMensal(taxa: BasisPoints, aoAno: boolean): number {
  if (!aoAno) {
    // Basis points já são /10.000; reescalados para /1e9 sem perda.
    return taxa * (PRECISAO / BP_POR_INTEIRO)
  }
  const anual = taxa / BP_POR_INTEIRO
  const mensal = Math.pow(1 + anual, 1 / MESES_NO_ANO) - 1
  return Math.round(mensal * PRECISAO)
}

export function calcularJurosCompostos(
  entrada: EntradaJurosCompostos,
  dataReferencia: DataISO,
): Resultado<SaidaJurosCompostos> {
  if (entrada.valorInicial < 0 || entrada.aporteMensal < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Valores não podem ser negativos.' }
  }
  if (entrada.taxa <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a taxa de juros para ver o resultado.',
    }
  }
  if (!Number.isInteger(entrada.meses) || entrada.meses < 1) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o prazo para ver o resultado.',
    }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)
  const numerador = numeradorDaTaxaMensal(entrada.taxa, entrada.taxaAoAno)
  const taxaMensalBp = basisPoints(Math.round((numerador / PRECISAO) * BP_POR_INTEIRO))

  traco.passo('Valor inicial', reais(entrada.valorInicial), entrada.valorInicial)

  if (entrada.taxaAoAno) {
    traco.passo(
      'Taxa mensal equivalente',
      `${percentual(entrada.taxa)} ao ano equivalem a ${percentual(taxaMensalBp)} ao mês`,
      ZERO,
    )
  }

  let saldo = entrada.valorInicial
  let investido = entrada.valorInicial
  const evolucao: LinhaEvolucao[] = []

  for (let mes = 1; mes <= entrada.meses; mes++) {
    // Capitaliza o saldo e só então recebe o aporte — o aporte do mês não
    // rende no próprio mês, que é a convenção de depósito ao fim do período.
    const juros = proporcao(saldo, numerador, PRECISAO, 'meio_para_cima')
    saldo = somar(saldo, juros, entrada.aporteMensal)
    investido = somar(investido, entrada.aporteMensal)

    if (mes <= 3 || mes === entrada.meses) {
      traco.passo(
        `Mês ${mes}`,
        `${reais(saldo)} = saldo anterior + juros ${reais(juros)} + aporte ${reais(entrada.aporteMensal)}`,
        saldo,
      )
    }

    if (mes % MESES_NO_ANO === 0 || mes === entrada.meses) {
      evolucao.push({
        ano: Math.ceil(mes / MESES_NO_ANO),
        investido,
        juros: centavos(saldo - investido),
        saldo,
      })
    }
  }

  const totalJuros = centavos(saldo - investido)

  traco.passo('Total investido', `Valor inicial mais os aportes`, investido)
  traco.passo('Total em juros', `${reais(saldo)} − ${reais(investido)}`, totalJuros)
  traco.passo('Montante final', reais(saldo), saldo)

  return {
    ok: true,
    valores: {
      montante: saldo,
      totalInvestido: investido,
      totalJuros,
      taxaMensalBp,
      evolucao,
    },
    traco: traco.construir(),
  }
}
