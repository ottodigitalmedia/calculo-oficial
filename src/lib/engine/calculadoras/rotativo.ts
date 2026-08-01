/**
 * CALC-023 — Rotativo do cartão: o custo real.
 *
 * **A calculadora mais estrutural do bloco de crédito**, e a única dele com
 * parâmetro legal. As outras aplicam fórmula sobre número digitado; esta aplica
 * uma arquitetura normativa que quase ninguém conhece e que muda o resultado
 * por completo:
 *
 * 1. **O rotativo dura UM ciclo.** Resolução CMN nº 4.549/2017, art. 1º: o saldo
 *    não pago *"somente pode ser objeto de financiamento na modalidade de
 *    crédito rotativo até o vencimento da fatura subsequente"*. Simular doze
 *    meses de rotativo — que é o que a intuição e boa parte dos concorrentes
 *    fazem — é simular algo que a norma proíbe, e o número sai alto demais.
 *
 * 2. **O que sobra vai para parcelamento MAIS BARATO.** Art. 2º: o saldo
 *    remanescente pode ser parcelado *"desde que em condições mais vantajosas
 *    para o cliente em relação àquelas praticadas na modalidade de crédito
 *    rotativo, inclusive no que diz respeito à cobrança de encargos
 *    financeiros"*. Não é cortesia: é condição de validade.
 *
 * 3. **Juros e encargos não podem passar do valor original da dívida.** Lei nº
 *    14.690/2023, art. 28, § 1º. E o teto vale para a **cadeia inteira**: na
 *    migração do rotativo para o parcelamento, o valor original é o montante
 *    inicial do rotativo e os juros são apurados desde o início dele —
 *    Resolução CMN nº 4.549/2017, art. 2º-A, parágrafo único, I e II.
 *
 * O terceiro item é o que nenhuma calculadora concorrente mostra, e é o que
 * transforma um número assustador em informação acionável: existe um limite, ele
 * está na lei, e a fatura é obrigada a detalhá-lo (art. 2º-B).
 *
 * Módulo próprio, e não dentro de `credito.ts`: aquele arquivo já serve três
 * calculadoras, e o pedaço adiado desta carregaria CET, amortização e quitação
 * junto. Ver `ESTADO-DO-PROJETO` §7.6.
 */

import { parcelaPrice } from '../financeira'
import { aplicarAliquota, minimo, multiplicarPorInteiro, naoNegativo, somar, subtrair } from '../money'
import {
  citar,
  fundamentar,
  percentual,
  reais,
  type Etapa,
  type Resultado,
  type Traco,
} from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { RES_CMN_4549 } from '../../params/data/fontes'

/**
 * `RN-007`: empate para cima. Em favor de quem cobra, que é a leitura
 * conservadora — a calculadora nunca deve subestimar o custo de uma dívida.
 */
const POLITICA = 'meio_para_cima' as const

export interface EntradaRotativo {
  readonly valorDaFatura: Centavos
  /** O que foi efetivamente pago no vencimento. */
  readonly valorPago: Centavos
  /** Taxa do crédito rotativo ao mês, como consta da fatura. */
  readonly taxaRotativo: BasisPoints
  /** Taxa do parcelamento da fatura ao mês. Zero = usa a do rotativo. */
  readonly taxaParcelamento: BasisPoints
  readonly parcelas: number
}

export interface SaidaRotativo {
  /** O valor original da dívida, na definição do art. 2º-A, IV. */
  readonly financiado: Centavos
  readonly jurosDoRotativo: Centavos
  readonly dividaAposRotativo: Centavos
  readonly parcelaDoParcelamento: Centavos
  readonly jurosDoParcelamento: Centavos
  /** Juros e encargos da cadeia inteira, **já limitados** ao teto legal. */
  readonly jurosEEncargos: Centavos
  /** O que seria cobrado se o teto não existisse. */
  readonly jurosSemTeto: Centavos
  readonly tetoLegal: Centavos
  readonly tetoAtingido: boolean
  readonly totalPago: Centavos
  readonly taxaParcelamentoUsada: BasisPoints
  /**
   * Verdadeiro quando a taxa de parcelamento informada **não é** mais vantajosa
   * que a do rotativo — hipótese que o art. 2º não admite.
   */
  readonly parcelamentoNaoEMaisVantajoso: boolean
}

export function calcularRotativo(
  entrada: EntradaRotativo,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaRotativo> {
  if (entrada.valorDaFatura <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor da fatura para ver o resultado.' }
  }
  if (entrada.taxaRotativo <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a taxa do rotativo para ver o resultado.' }
  }
  if (entrada.parcelas <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe em quantas parcelas o saldo seria financiado.' }
  }
  if (entrada.valorPago < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O valor pago não pode ser negativo.' }
  }
  if (entrada.valorPago >= entrada.valorDaFatura) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        'A fatura foi paga por inteiro — não há saldo financiado, e nenhum juro é devido. É sempre o melhor cenário.',
    }
  }

  const teto = registro.resolver('cartao-teto-juros-encargos', dataReferencia)
  if (!teto.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: teto.detalhe }
  if (teto.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O parâmetro de teto não é percentual.' }
  }
  const tetoBp = basisPoints(teto.resolvida.vigencia.valor.aliquotaBp)

  const etapas: Etapa[] = []

  // -------------------------------------------------------------------------
  // O valor original da dívida — art. 2º-A, IV
  // -------------------------------------------------------------------------
  const financiado = subtrair(entrada.valorDaFatura, entrada.valorPago)
  etapas.push({
    rotulo: 'Saldo que entrou no rotativo',
    formula: `${reais(entrada.valorDaFatura)} (fatura) − ${reais(entrada.valorPago)} (pago)`,
    resultado: financiado,
    fundamento: fundamentar(RES_CMN_4549),
    justificativa:
      'Este é o "valor original da dívida" da norma, e é sobre ele que o teto legal é medido. ' +
      'Guarde o número: ele volta no fim.',
  })

  // -------------------------------------------------------------------------
  // Um ciclo de rotativo, e apenas um — art. 1º
  // -------------------------------------------------------------------------
  const jurosDoRotativo = aplicarAliquota(financiado, entrada.taxaRotativo, POLITICA)
  const dividaAposRotativo = somar(financiado, jurosDoRotativo)

  etapas.push({
    rotulo: 'Juros de um mês de rotativo',
    formula: `${reais(financiado)} × ${percentual(entrada.taxaRotativo)}`,
    resultado: jurosDoRotativo,
    fundamento: fundamentar(RES_CMN_4549),
    justificativa:
      'Um mês, e não mais: o saldo não pago só pode ficar no rotativo até o vencimento da ' +
      'fatura seguinte. Simulações de "doze meses no rotativo" descrevem algo que a norma ' +
      'proíbe desde 2017.',
  })

  etapas.push({
    rotulo: 'Dívida ao fim do ciclo do rotativo',
    formula: `${reais(financiado)} + ${reais(jurosDoRotativo)}`,
    resultado: dividaAposRotativo,
  })

  // -------------------------------------------------------------------------
  // Migração obrigatória para o parcelamento — art. 2º
  // -------------------------------------------------------------------------
  const taxaParcelamentoUsada =
    entrada.taxaParcelamento > 0 ? entrada.taxaParcelamento : entrada.taxaRotativo
  const parcelamentoNaoEMaisVantajoso = taxaParcelamentoUsada >= entrada.taxaRotativo

  const parcelaDoParcelamento = parcelaPrice(
    dividaAposRotativo,
    entrada.parcelas,
    taxaParcelamentoUsada,
  )
  const totalDoParcelamento = multiplicarPorInteiro(parcelaDoParcelamento, entrada.parcelas)
  const jurosDoParcelamento = naoNegativo(subtrair(totalDoParcelamento, dividaAposRotativo))

  etapas.push({
    rotulo: `Parcelamento em ${entrada.parcelas} vezes`,
    formula: `${reais(dividaAposRotativo)} a ${percentual(taxaParcelamentoUsada)} ao mês, em ${entrada.parcelas} parcelas de ${reais(parcelaDoParcelamento)}`,
    resultado: totalDoParcelamento,
    fundamento: fundamentar(RES_CMN_4549),
    justificativa: parcelamentoNaoEMaisVantajoso
      ? 'ATENÇÃO: a taxa usada aqui NÃO é menor que a do rotativo, e o art. 2º só admite o ' +
        'parcelamento em condições mais vantajosas para o cliente, inclusive quanto aos ' +
        'encargos. Confira a taxa do parcelamento na sua fatura.'
      : 'A norma exige que o parcelamento seja mais barato que o rotativo. Não é liberalidade ' +
        'do banco: é condição para que ele possa oferecê-lo.',
  })

  etapas.push({
    rotulo: 'Juros do parcelamento',
    formula: `${reais(totalDoParcelamento)} − ${reais(dividaAposRotativo)}`,
    resultado: jurosDoParcelamento,
  })

  // -------------------------------------------------------------------------
  // O teto — Lei nº 14.690/2023, art. 28, § 1º
  // -------------------------------------------------------------------------
  const jurosSemTeto = somar(jurosDoRotativo, jurosDoParcelamento)
  const tetoLegal = aplicarAliquota(financiado, tetoBp, POLITICA)
  const jurosEEncargos = minimo(jurosSemTeto, tetoLegal)
  const tetoAtingido = jurosSemTeto > tetoLegal

  etapas.push({
    rotulo: 'Juros e encargos acumulados desde o início do rotativo',
    formula: `${reais(jurosDoRotativo)} (rotativo) + ${reais(jurosDoParcelamento)} (parcelamento)`,
    resultado: jurosSemTeto,
    fundamento: fundamentar(RES_CMN_4549),
    justificativa:
      'Somados desde o início do rotativo, e não a partir do parcelamento. É o que determina o ' +
      'art. 2º-A, parágrafo único, II — sem essa regra o teto seria zerado a cada migração.',
  })

  etapas.push({
    rotulo: 'Teto legal de juros e encargos',
    formula: `${reais(financiado)} × ${percentual(tetoBp)} do valor original da dívida`,
    resultado: tetoLegal,
    parametro: citar(teto.resolvida),
    justificativa: tetoAtingido
      ? `Os juros calculados (${reais(jurosSemTeto)}) ULTRAPASSAM o teto. A lei limita a cobrança ` +
        `a ${reais(tetoLegal)}, e a fatura é obrigada a detalhar esse valor.`
      : 'Neste cenário a cobrança fica abaixo do limite legal. O teto continua valendo como ' +
        'garantia: por mais que a dívida role, juros e encargos nunca podem passar dele.',
  })

  const totalPago = somar(financiado, jurosEEncargos)
  etapas.push({
    rotulo: 'Total a pagar',
    formula: `${reais(financiado)} + ${reais(jurosEEncargos)}`,
    resultado: totalPago,
  })

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: [teto.resolvida.vigencia.id],
  }

  return {
    ok: true,
    valores: {
      financiado,
      jurosDoRotativo,
      dividaAposRotativo,
      parcelaDoParcelamento,
      jurosDoParcelamento,
      jurosEEncargos,
      jurosSemTeto,
      tetoLegal,
      tetoAtingido,
      totalPago,
      taxaParcelamentoUsada,
      parcelamentoNaoEMaisVantajoso,
    },
    traco,
  }
}

export { ZERO, centavos }
