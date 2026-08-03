/**
 * CALC-046 — Dividend yield e renda passiva.
 *
 * Aritmética simples, e uma armadilha de produto que não é.
 *
 * **O yield olha para trás.** Ele divide o que foi pago nos últimos doze meses
 * pelo preço de hoje — e nada obriga a empresa a repetir aquele pagamento. Uma
 * queda de preço eleva o yield sem que nada de bom tenha acontecido, e é
 * exatamente assim que a métrica engana: o número sobe quando a ação cai.
 *
 * A calculadora não pode impedir essa leitura, mas pode não a induzir. Por isso
 * o texto de tela nomeia o que o número é — histórico —, e a página não fala em
 * "renda garantida" em lugar nenhum.
 *
 * **Nenhum tratamento tributário é assumido.** A tributação de proventos varia
 * por tipo de provento e por veículo, e este módulo não a apura nem a menciona
 * como se soubesse: o que ele devolve é o valor bruto, e o texto diz isso.
 */

import { aliquotaEfetiva, multiplicarPorInteiro, proporcao } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

const MESES_NO_ANO = 12

export interface EntradaDividendos {
  readonly precoPorAcao: Centavos
  /** O que foi pago por ação nos últimos doze meses. */
  readonly dividendoAnualPorAcao: Centavos
  readonly quantidade: number
  /** Renda mensal desejada. Zero para não calcular o investimento necessário. */
  readonly rendaMensalDesejada: Centavos
}

export interface SaidaDividendos {
  readonly investimentoTotal: Centavos
  readonly rendaAnual: Centavos
  readonly rendaMensal: Centavos
  readonly yieldAnualBp: BasisPoints
  /** Quantas ações e quanto seria preciso para a renda desejada. */
  readonly acoesParaARenda: number
  readonly investimentoParaARenda: Centavos
}

export function calcularDividendos(
  entrada: EntradaDividendos,
  dataReferencia: DataISO,
): Resultado<SaidaDividendos> {
  if (entrada.precoPorAcao <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o preço da ação para ver o resultado.',
    }
  }
  if (entrada.dividendoAnualPorAcao <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quanto foi pago por ação nos últimos doze meses.',
    }
  }
  if (!Number.isInteger(entrada.quantidade) || entrada.quantidade < 1) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quantas ações você tem ou pretende ter.',
    }
  }

  const etapas: Etapa[] = []

  const yieldAnualBp = aliquotaEfetiva(
    entrada.dividendoAnualPorAcao,
    entrada.precoPorAcao,
    'meio_para_cima',
  )

  etapas.push({
    rotulo: 'Dividend yield dos últimos doze meses',
    formula: `${reais(entrada.dividendoAnualPorAcao)} ÷ ${reais(entrada.precoPorAcao)} = ${percentual(yieldAnualBp)}`,
    resultado: centavos(yieldAnualBp),
    unidade: 'percentual',
    justificativa:
      'O yield olha para TRÁS: divide o que já foi pago pelo preço de hoje. Nada obriga a ' +
      'empresa a repetir o pagamento — e uma queda no preço eleva o yield sem que nada de bom ' +
      'tenha acontecido.',
  })

  const investimentoTotal = multiplicarPorInteiro(entrada.precoPorAcao, entrada.quantidade)
  etapas.push({
    rotulo: 'Investimento',
    formula: `${reais(entrada.precoPorAcao)} × ${entrada.quantidade} ações`,
    resultado: investimentoTotal,
  })

  const rendaAnual = multiplicarPorInteiro(entrada.dividendoAnualPorAcao, entrada.quantidade)
  etapas.push({
    rotulo: 'Proventos em doze meses, no mesmo ritmo',
    formula: `${reais(entrada.dividendoAnualPorAcao)} × ${entrada.quantidade} ações`,
    resultado: rendaAnual,
  })

  const rendaMensal = proporcao(rendaAnual, 1, MESES_NO_ANO, 'meio_para_cima')
  etapas.push({
    rotulo: 'Média por mês',
    formula: `${reais(rendaAnual)} ÷ 12`,
    resultado: rendaMensal,
    justificativa:
      'É média, e não mensalidade: proventos costumam ser pagos em datas irregulares, e alguns ' +
      'meses não têm pagamento nenhum.',
  })

  /**
   * A pergunta invertida: quanto seria preciso ter para uma renda alvo.
   *
   * O arredondamento é para CIMA, e de propósito: com arredondamento para baixo
   * a quantidade devolvida renderia **menos** que a renda pedida, e a resposta
   * estaria errada exatamente no sentido que decepciona.
   */
  let acoesParaARenda = 0
  let investimentoParaARenda: Centavos = centavos(0)

  if (entrada.rendaMensalDesejada > 0) {
    const alvoAnual = multiplicarPorInteiro(entrada.rendaMensalDesejada, MESES_NO_ANO)
    acoesParaARenda = Math.ceil(alvoAnual / entrada.dividendoAnualPorAcao)
    investimentoParaARenda = multiplicarPorInteiro(entrada.precoPorAcao, acoesParaARenda)

    etapas.push({
      rotulo: `Para receber ${reais(entrada.rendaMensalDesejada)} por mês`,
      formula:
        `${reais(alvoAnual)} ao ano ÷ ${reais(entrada.dividendoAnualPorAcao)} por ação = ` +
        `${acoesParaARenda} ações × ${reais(entrada.precoPorAcao)}`,
      resultado: investimentoParaARenda,
      justificativa:
        'Ao ritmo atual de pagamento e ao preço atual. As duas coisas mudam, e a segunda muda ' +
        'todo dia.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      investimentoTotal,
      rendaAnual,
      rendaMensal,
      yieldAnualBp,
      acoesParaARenda,
      investimentoParaARenda,
    },
    traco,
  }
}
