/**
 * CALC-042 — Quanto rende um capital por mês.
 *
 * A pergunta que a categoria de investimentos mais recebe, e a que mais é
 * respondida errado — de duas formas:
 *
 * 1. **Dividindo a taxa anual por doze.** 14,15% ao ano não são 1,18% ao mês:
 *    são 1,11%, porque os juros do mês rendem nos meses seguintes. A conversão
 *    correta é a raiz décima segunda, e ela vem de `juros-compostos.ts` — a
 *    mesma função, para não haver duas verdades sobre a aproximação.
 * 2. **Esquecendo o imposto.** Renda fixa é tributada na fonte por tabela
 *    regressiva, e a alíquota depende do prazo. Quem projeta renda mensal pelo
 *    bruto superestima em até 22,5%.
 *
 * **A alíquota é campo, e não parâmetro resolvido aqui.** Quem apura a tabela
 * regressiva é CALC-018, que já existe e tem os parâmetros cadastrados com
 * vigência. Duplicar a tabela neste motor criaria uma segunda cópia de uma
 * constante legal — exatamente o que `CLAUDE.md` regra 1 impede.
 */

import { aplicarAliquota, multiplicarPorInteiro, subtrair } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { type BasisPoints, type Centavos } from '../types'
import { taxaMensalEquivalente } from './juros-compostos'
import type { DataISO } from '../../params/tipos'

const MESES_NO_ANO = 12

/** 100% em basis points. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
const BP_INTEIRO = 10_000

export interface EntradaRendaMensal {
  readonly capital: Centavos
  readonly taxa: BasisPoints
  readonly taxaAoAno: boolean
  /** Alíquota de imposto sobre o rendimento. Zero para aplicação sem retenção. */
  readonly aliquotaIrBp: BasisPoints
}

export interface SaidaRendaMensal {
  readonly taxaMensalBp: BasisPoints
  readonly rendimentoBrutoMensal: Centavos
  readonly impostoMensal: Centavos
  readonly rendimentoLiquidoMensal: Centavos
  readonly rendimentoLiquidoAnual: Centavos
  /** A taxa mensal depois do imposto — o que de fato sobra por mês. */
  readonly taxaLiquidaMensalBp: BasisPoints
}

export function calcularRendaMensal(
  entrada: EntradaRendaMensal,
  dataReferencia: DataISO,
): Resultado<SaidaRendaMensal> {
  if (entrada.capital <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor investido para ver o resultado.',
    }
  }
  if (entrada.taxa <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a taxa de rendimento para ver o resultado.',
    }
  }
  if (entrada.aliquotaIrBp < 0 || entrada.aliquotaIrBp >= BP_INTEIRO) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A alíquota de imposto precisa ficar entre 0% e 100%.',
    }
  }

  const etapas: Etapa[] = []
  const taxaMensalBp = taxaMensalEquivalente(entrada.taxa, entrada.taxaAoAno)

  if (entrada.taxaAoAno) {
    etapas.push({
      rotulo: 'Taxa mensal equivalente',
      formula: `${percentual(entrada.taxa)} ao ano equivalem a ${percentual(taxaMensalBp)} ao mês`,
      resultado: taxaMensalBp as unknown as Centavos,
      unidade: 'percentual',
      justificativa:
        'Não é a taxa anual dividida por doze. A conversão considera que o rendimento de cada ' +
        'mês rende nos meses seguintes, então a mensal equivalente é a raiz décima segunda do ' +
        'fator anual — e sai MENOR que a divisão simples.',
    })
  }

  const rendimentoBrutoMensal = aplicarAliquota(entrada.capital, taxaMensalBp, 'meio_para_cima')
  etapas.push({
    rotulo: 'Rendimento bruto no mês',
    formula: `${reais(entrada.capital)} × ${percentual(taxaMensalBp)}`,
    resultado: rendimentoBrutoMensal,
  })

  const impostoMensal =
    entrada.aliquotaIrBp > 0
      ? aplicarAliquota(rendimentoBrutoMensal, entrada.aliquotaIrBp, 'meio_para_cima')
      : (0 as Centavos)

  if (entrada.aliquotaIrBp > 0) {
    etapas.push({
      rotulo: 'Imposto sobre o rendimento',
      formula: `${reais(rendimentoBrutoMensal)} × ${percentual(entrada.aliquotaIrBp)}`,
      resultado: impostoMensal,
      justificativa:
        'O imposto incide sobre o RENDIMENTO, e não sobre o capital. A alíquota é a que você ' +
        'informou — em renda fixa ela depende do prazo da aplicação, e a calculadora de IR ' +
        'sobre renda fixa apura qual é.',
    })
  }

  const rendimentoLiquidoMensal = subtrair(rendimentoBrutoMensal, impostoMensal)
  etapas.push({
    rotulo: 'Sobra por mês',
    formula:
      entrada.aliquotaIrBp > 0
        ? `${reais(rendimentoBrutoMensal)} − ${reais(impostoMensal)}`
        : `Sem imposto informado, o líquido é o próprio bruto`,
    resultado: rendimentoLiquidoMensal,
  })

  const rendimentoLiquidoAnual = multiplicarPorInteiro(rendimentoLiquidoMensal, MESES_NO_ANO)
  etapas.push({
    rotulo: 'Em doze meses',
    formula: `${reais(rendimentoLiquidoMensal)} × 12`,
    resultado: rendimentoLiquidoAnual,
    justificativa:
      'Doze vezes a renda mensal, e não o montante de quem reinveste: a hipótese aqui é a de ' +
      'quem RETIRA o rendimento todo mês, e por isso o capital não cresce.',
  })

  /**
   * A taxa que de fato sobra, depois do imposto.
   *
   * Derivada do rendimento líquido sobre o capital, e não da multiplicação das
   * duas alíquotas: a segunda daria o mesmo número em teoria e um número
   * ligeiramente diferente na prática, porque os arredondamentos acontecem em
   * lugares distintos. O que a tela mostra tem de sair do que a tela soma.
   */
  const taxaLiquidaMensalBp =
    entrada.capital > 0
      ? ((Math.round((rendimentoLiquidoMensal * BP_INTEIRO) / entrada.capital) as number) as BasisPoints)
      : (0 as BasisPoints)

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      taxaMensalBp,
      rendimentoBrutoMensal,
      impostoMensal,
      rendimentoLiquidoMensal,
      rendimentoLiquidoAnual,
      taxaLiquidaMensalBp,
    },
    traco,
  }
}
