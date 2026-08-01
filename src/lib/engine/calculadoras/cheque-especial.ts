/**
 * CALC-030 — Cheque especial: custo real.
 *
 * **Prima do rotativo, e com a mesma estrutura de argumento:** existe um teto
 * legal, quase ninguém sabe dele, e o número que assusta não é a taxa mensal —
 * é a anual equivalente.
 *
 * A Resolução CMN nº 4.765/2019, art. 3º, limita os juros a **8% ao mês**. Em
 * capitalização composta isso é mais de 150% ao ano: o teto é alto, não baixo, e
 * dizer isso com o número na tela é o serviço que a calculadora presta.
 *
 * A CONVENÇÃO DE PRAZO ESTÁ DECLARADA, NÃO ESCONDIDA
 *
 * A norma limita a taxa "ao mês" e não prescreve como converter para o período
 * de uso, que quase sempre é de alguns dias. Esta calculadora aplica **proporção
 * linear sobre o mês de trinta dias** — a leitura mais simples e a que o usuário
 * consegue conferir. Bancos capitalizam por dia, o que produz valor um pouco
 * maior; a memória de cálculo diz isso.
 */

import { anualizar } from '../financeira'
import { aplicarAliquota, minimo, proporcao, somar, subtrair } from '../money'
import { citar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'

/** `RN-007`: empate para cima — a leitura conservadora sobre custo de dívida. */
const POLITICA = 'meio_para_cima' as const

/** Dias do mês comercial, como no restante do motor. Unidade, não parâmetro. */
const DIAS_DO_MES = 30

export interface EntradaChequeEspecial {
  /** Quanto do limite foi efetivamente usado. */
  readonly valorUsado: Centavos
  readonly diasDeUso: number
  /** Taxa cobrada pelo banco, ao mês. */
  readonly taxaMensal: BasisPoints
}

export interface SaidaChequeEspecial {
  /** Devolvido para que a tela não precise reconstruí-lo por subtração. */
  readonly valorUsado: Centavos
  readonly jurosDoPeriodo: Centavos
  readonly totalAPagar: Centavos
  /** A taxa informada, anualizada por capitalização composta. */
  readonly taxaAnual: BasisPoints
  readonly tetoMensal: BasisPoints
  readonly tetoAnual: BasisPoints
  readonly acimaDoTeto: boolean
  /** Quanto os juros seriam se a taxa estivesse no teto legal. */
  readonly jurosNoTeto: Centavos
  readonly excessoCobrado: Centavos
}

export function calcularChequeEspecial(
  entrada: EntradaChequeEspecial,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaChequeEspecial> {
  if (entrada.valorUsado <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe quanto do limite foi usado para ver o resultado.' }
  }
  if (entrada.diasDeUso <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe por quantos dias você ficou no limite para ver o resultado.' }
  }
  if (entrada.taxaMensal <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a taxa de juros do cheque especial para ver o resultado.' }
  }

  const rTeto = registro.resolver('cheque-especial-teto-juros-mes', dataReferencia)
  if (!rTeto.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: rTeto.detalhe }
  if (rTeto.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O parâmetro de teto não é percentual.' }
  }
  const tetoMensal = basisPoints(rTeto.resolvida.vigencia.valor.aliquotaBp)

  const etapas: Etapa[] = []

  /**
   * Juros de um mês cheio primeiro, e só depois a proporção dos dias. A ordem
   * importa: proporcionalizar o VALOR e depois aplicar a taxa daria o mesmo
   * número, mas a memória ficaria dizendo que o saldo devedor foi menor do que
   * de fato foi — e a memória é o produto.
   */
  const jurosDeUmMes = aplicarAliquota(entrada.valorUsado, entrada.taxaMensal, POLITICA)
  etapas.push({
    rotulo: 'Juros de um mês cheio',
    formula: `${reais(entrada.valorUsado)} × ${percentual(entrada.taxaMensal)}`,
    resultado: jurosDeUmMes,
  })

  const jurosDoPeriodo = proporcao(jurosDeUmMes, entrada.diasDeUso, DIAS_DO_MES, POLITICA)
  etapas.push({
    rotulo: `Juros de ${entrada.diasDeUso} dia(s)`,
    formula: `${reais(jurosDeUmMes)} ÷ ${DIAS_DO_MES} × ${entrada.diasDeUso} dias`,
    resultado: jurosDoPeriodo,
    justificativa:
      'A norma limita a taxa AO MÊS e não diz como converter para o período de uso. Aqui a ' +
      'conversão é proporcional ao mês de trinta dias, que é a leitura mais simples e a que ' +
      'você consegue conferir. O banco capitaliza por dia, o que produz um valor pouco maior.',
  })

  const totalAPagar = somar(entrada.valorUsado, jurosDoPeriodo)
  etapas.push({
    rotulo: 'Total a devolver',
    formula: `${reais(entrada.valorUsado)} + ${reais(jurosDoPeriodo)}`,
    resultado: totalAPagar,
  })

  // -------------------------------------------------------------------------
  // O teto legal, e o número que assusta
  // -------------------------------------------------------------------------
  const taxaAnual = anualizar(entrada.taxaMensal)
  const tetoAnual = anualizar(tetoMensal)
  const acimaDoTeto = entrada.taxaMensal > tetoMensal

  const jurosNoTetoDeUmMes = aplicarAliquota(entrada.valorUsado, tetoMensal, POLITICA)
  const jurosNoTeto = proporcao(jurosNoTetoDeUmMes, entrada.diasDeUso, DIAS_DO_MES, POLITICA)
  const excessoCobrado = acimaDoTeto ? subtrair(jurosDoPeriodo, jurosNoTeto) : centavos(0)

  etapas.push({
    rotulo: 'Teto legal da taxa',
    formula: `${percentual(tetoMensal)} ao mês, que equivalem a ${percentual(tetoAnual)} ao ano`,
    resultado: minimo(jurosNoTeto, jurosDoPeriodo),
    parametro: citar(rTeto.resolvida),
    justificativa: acimaDoTeto
      ? `A taxa informada, ${percentual(entrada.taxaMensal)} ao mês, ULTRAPASSA o teto. No ` +
        `limite legal os juros do período seriam ${reais(jurosNoTeto)} — diferença de ` +
        `${reais(excessoCobrado)}. Vale questionar o banco.`
      : 'A taxa informada está dentro do limite. Repare que o teto é alto: oito por cento ao ' +
        'mês, capitalizados, passam de 150% ao ano.',
  })

  etapas.push({
    rotulo: 'A taxa informada, ao ano',
    formula: `(1 + ${percentual(entrada.taxaMensal)})^12 − 1`,
    resultado: centavos(taxaAnual),
    unidade: 'percentual',
    justificativa:
      'É o mesmo número da taxa mensal, dito de outro jeito — e é o jeito que permite comparar ' +
      'o cheque especial com qualquer outra forma de crédito.',
  })

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: [rTeto.resolvida.vigencia.id],
  }

  return {
    ok: true,
    valores: {
      valorUsado: entrada.valorUsado,
      jurosDoPeriodo,
      totalAPagar,
      taxaAnual,
      tetoMensal,
      tetoAnual,
      acimaDoTeto,
      jurosNoTeto,
      excessoCobrado,
    },
    traco,
  }
}
