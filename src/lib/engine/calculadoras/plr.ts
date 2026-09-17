/**
 * CALC-085 — Imposto sobre a participação nos lucros (PLR).
 *
 * **A PLR não soma ao salário.** É tributada exclusivamente na fonte, em
 * separado, com tabela ANUAL própria (Lei nº 10.101/2000, art. 3º, § 5º) — e
 * quem a soma ao salário do mês e aplica a tabela mensal chega a um imposto
 * várias vezes maior que o devido.
 *
 * **A segunda parcela recalcula a primeira** (§ 7º): o imposto é apurado sobre o
 * total recebido no ano, e desconta-se o que já foi retido. Por isso duas
 * parcelas pequenas, isentas cada uma, podem gerar imposto juntas.
 *
 * A pensão alimentícia paga sobre a PLR sai da base (§ 10).
 */

import { aplicarAliquota, naoNegativo, somar, subtrair } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_10101_ART_3 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

export interface EntradaPlr {
  /** Valor bruto da parcela de PLR que está sendo paga. */
  readonly valorPlr: Centavos
  /** Pensão alimentícia descontada desta parcela, por decisão ou acordo. */
  readonly pensao: Centavos
  /** Base das parcelas de PLR já recebidas no mesmo ano, já sem a pensão. */
  readonly baseAnterior: Centavos
  /** Imposto já retido sobre essas parcelas anteriores. */
  readonly impostoRetidoAnterior: Centavos
}

export interface SaidaPlr {
  readonly imposto: Centavos
  readonly liquido: Centavos
  readonly baseDaParcela: Centavos
  readonly baseAnual: Centavos
  readonly impostoAnual: Centavos
  readonly aliquotaFaixa: BasisPoints
  readonly isento: boolean
}

export function calcularPlr(
  entrada: EntradaPlr,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaPlr> {
  if (entrada.valorPlr <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor da PLR para ver o resultado.' }
  }
  if (entrada.pensao < 0 || entrada.baseAnterior < 0 || entrada.impostoRetidoAnterior < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os valores não podem ser negativos.' }
  }
  if (entrada.pensao > entrada.valorPlr) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A pensão alimentícia não pode ser maior que a PLR.' }
  }

  const tabela = registro.resolver('plr-tabela-exclusiva', dataReferencia)
  if (!tabela.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: tabela.detalhe }
  if (tabela.resolvida.vigencia.valor.tipo !== 'tabela_faixas') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A tabela da PLR não tem faixas.' }
  }
  const faixas = tabela.resolvida.vigencia.valor.faixas

  const etapas: Etapa[] = []

  const baseDaParcela = subtrair(entrada.valorPlr, entrada.pensao)
  etapas.push({
    rotulo: 'Base desta parcela',
    formula:
      entrada.pensao > 0
        ? `${reais(entrada.valorPlr)} − ${reais(entrada.pensao)} de pensão alimentícia`
        : reais(entrada.valorPlr),
    resultado: baseDaParcela,
    fundamento: fundamentar(LEI_10101_ART_3),
    justificativa:
      entrada.pensao > 0
        ? 'A pensão alimentícia paga sobre a PLR, por decisão ou acordo homologado, sai da base do imposto.'
        : 'A PLR é tributada em separado dos demais rendimentos: não se soma ao salário do mês.',
  })

  const baseAnual = somar(baseDaParcela, entrada.baseAnterior)
  if (entrada.baseAnterior > 0) {
    etapas.push({
      rotulo: 'Base de toda a PLR do ano',
      formula: `${reais(baseDaParcela)} + ${reais(entrada.baseAnterior)} já recebidos no ano`,
      resultado: baseAnual,
      fundamento: fundamentar(LEI_10101_ART_3),
      justificativa:
        'Quando há mais de uma parcela no mesmo ano, o imposto é recalculado sobre o total recebido, e ' +
        'desconta-se o que já foi retido.',
    })
  }

  const faixa =
    faixas.find((f) => f.limiteSuperiorCentavos === null || baseAnual <= f.limiteSuperiorCentavos) ??
    faixas[faixas.length - 1]
  if (!faixa) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Tabela da PLR sem faixas.' }
  }

  const aliquotaFaixa = basisPoints(faixa.aliquotaBp)
  const parcelaDeduzir = centavos(faixa.parcelaDeduzirCentavos ?? 0)
  const impostoAnual = naoNegativo(subtrair(aplicarAliquota(baseAnual, aliquotaFaixa, POLITICA), parcelaDeduzir))
  const isento = aliquotaFaixa === 0

  etapas.push({
    rotulo: isento ? 'Imposto pela tabela — faixa isenta' : `Imposto pela tabela — faixa de ${percentual(aliquotaFaixa)}`,
    formula: isento
      ? `${reais(baseAnual)} está dentro da faixa de isenção`
      : `${reais(baseAnual)} × ${percentual(aliquotaFaixa)} − ${reais(parcelaDeduzir)}`,
    resultado: impostoAnual,
    parametro: citar(tabela.resolvida),
  })

  const imposto = naoNegativo(subtrair(impostoAnual, entrada.impostoRetidoAnterior))
  if (entrada.baseAnterior > 0 || entrada.impostoRetidoAnterior > 0) {
    etapas.push({
      rotulo: 'Imposto desta parcela',
      formula: `${reais(impostoAnual)} − ${reais(entrada.impostoRetidoAnterior)} já retidos`,
      resultado: imposto,
    })
  }

  const liquido = subtrair(subtrair(entrada.valorPlr, entrada.pensao), imposto)
  etapas.push({
    rotulo: 'PLR líquida',
    formula:
      entrada.pensao > 0
        ? `${reais(entrada.valorPlr)} − ${reais(entrada.pensao)} (pensão) − ${reais(imposto)} (imposto)`
        : `${reais(entrada.valorPlr)} − ${reais(imposto)}`,
    resultado: liquido,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [tabela.resolvida.vigencia.id] }
  return {
    ok: true,
    valores: { imposto, liquido, baseDaParcela, baseAnual, impostoAnual, aliquotaFaixa, isento },
    traco,
  }
}
