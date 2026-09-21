/**
 * CALC-122 — Tesouro Prefixado levado ao vencimento.
 *
 * **A conta é exata, e isso é raro em investimento.** A LTN é resgatada pelo
 * valor nominal na data de vencimento (Decreto nº 12.814/2026, art. 2º, V), e o
 * valor nominal é de R$ 1.000,00 por título no Tesouro Direto. Quem comprou
 * sabe o preço unitário que pagou; o bruto no vencimento é o valor aplicado
 * dividido pelo preço e multiplicado pelo valor nominal. Nenhuma projeção,
 * nenhuma premissa de mercado.
 *
 * **Por que a entrada é o PREÇO, e não a taxa.** O preço do título sai de
 * `1.000 ÷ (1 + taxa)^(du/252)`, e `du` são dias ÚTEIS pelo calendário de
 * feriados bancários — que inclui datas que não são feriado nacional. Pedir a
 * taxa obrigaria a reconstruir esse calendário e a errar em silêncio quando ele
 * mudasse. O preço unitário está na tela da compra e no extrato, e é dado do
 * usuário: a conta parte dele.
 *
 * **O que esta conta NÃO cobre:**
 *
 * - **venda antecipada.** Antes do vencimento vale o preço de mercado do dia,
 *   que sobe e desce com as taxas — pode render mais ou menos que o contratado,
 *   inclusive prejuízo. A página diz isso;
 * - **resgate com menos de trinta dias**, quando ainda há IOF pela tabela do
 *   Anexo do Decreto nº 6.306/2007. O cálculo é recusado, com a explicação;
 * - **taxa de custódia da B3 e taxas da corretora**, que reduzem o resultado e
 *   variam por instituição e por faixa de valor. A tela declara a ausência,
 *   como em CALC-045;
 * - **Tesouro Prefixado com Juros Semestrais** (NTN-F), que paga cupons e tem
 *   imposto a cada um deles.
 */

import { aliquotaEfetiva, aplicarAliquota, proporcao, subtrair } from '../money'
import { citar, percentual, reais, type Etapa, type Resultado } from '../traco'
import { basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import { diasEntre, lerData } from '../datas'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

export const PARAMETROS_TESOURO_PREFIXADO = [
  'ltn-valor-nominal',
  'iof-renda-fixa-dias-sem-cobranca',
  'ir-renda-fixa-faixa-1',
  'ir-renda-fixa-faixa-2',
  'ir-renda-fixa-faixa-3',
  'ir-renda-fixa-faixa-4',
  'ir-renda-fixa-limite-1',
  'ir-renda-fixa-limite-2',
  'ir-renda-fixa-limite-3',
] as const

export interface EntradaTesouroPrefixado {
  /** Valor aplicado na compra. */
  readonly valorAplicado: Centavos
  /** Preço unitário pago pelo título — o PU da tela de compra e do extrato. */
  readonly precoUnitario: Centavos
  readonly compra: DataISO
  readonly vencimento: DataISO
}

export interface SaidaTesouroPrefixado {
  readonly valorNominal: Centavos
  /** Quantidade de títulos, em centésimos — a fração que o Tesouro Direto negocia. */
  readonly quantidadeEmCentesimos: number
  readonly brutoNoVencimento: Centavos
  readonly rendimento: Centavos
  readonly aliquotaIr: BasisPoints
  readonly imposto: Centavos
  readonly liquidoNoVencimento: Centavos
  readonly diasCorridos: number
  /** Rentabilidade do período sobre o valor aplicado, bruta e líquida. */
  readonly rentabilidadeBrutaBp: BasisPoints
  readonly rentabilidadeLiquidaBp: BasisPoints
}

type Resolvido = { readonly valor: number; readonly resolvida: VigenciaResolvida } | null

function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

function moedaDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'valor_monetario') return null
  return { valor: r.resolvida.vigencia.valor.centavos, resolvida: r.resolvida }
}

function percentualDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: r.resolvida.vigencia.valor.aliquotaBp, resolvida: r.resolvida }
}

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

export function calcularTesouroPrefixado(
  entrada: EntradaTesouroPrefixado,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaTesouroPrefixado> {
  if (entrada.valorAplicado <= 0 || entrada.precoUnitario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor aplicado e o preço do título na compra.' }
  }
  const compra = lerData(entrada.compra)
  const vencimento = lerData(entrada.vencimento)
  if (!compra || !vencimento) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a data da compra e a do vencimento.' }
  }

  const nominal = moedaDe(registro, 'ltn-valor-nominal', dataReferencia)
  const semIof = inteiroDe(registro, 'iof-renda-fixa-dias-sem-cobranca', dataReferencia)
  const limite1 = inteiroDe(registro, 'ir-renda-fixa-limite-1', dataReferencia)
  const limite2 = inteiroDe(registro, 'ir-renda-fixa-limite-2', dataReferencia)
  const limite3 = inteiroDe(registro, 'ir-renda-fixa-limite-3', dataReferencia)
  if (!nominal || !semIof || !limite1 || !limite2 || !limite3) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há parâmetros de títulos públicos cadastrados para a data informada.' }
  }

  const valorNominal = centavos(nominal.valor)
  if (entrada.precoUnitario >= valorNominal) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `O preço de compra fica abaixo do valor de resgate (${reais(valorNominal)} por título) — é o deságio que remunera o título.`,
    }
  }

  const diasCorridos = diasEntre(compra, vencimento)
  if (diasCorridos <= 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O vencimento precisa ser depois da data da compra.' }
  }
  if (diasCorridos < semIof.valor) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `Com menos de ${semIof.valor} dias entre a compra e o vencimento ainda incide IOF, pela tabela do Anexo do Decreto nº 6.306/2007 — caso que esta conta não cobre.`,
    }
  }

  // Bruto = aplicado × valor nominal ÷ preço. Um arredondamento, no fim.
  const brutoNoVencimento = proporcao(entrada.valorAplicado, valorNominal, entrada.precoUnitario, POLITICA)
  const quantidadeEmCentesimos = Math.round(
    (entrada.valorAplicado * CENTESIMOS_POR_UNIDADE) / entrada.precoUnitario,
  )
  const rendimento = subtrair(brutoNoVencimento, entrada.valorAplicado)

  const idDaFaixa =
    diasCorridos <= limite1.valor
      ? 'ir-renda-fixa-faixa-1'
      : diasCorridos <= limite2.valor
        ? 'ir-renda-fixa-faixa-2'
        : diasCorridos <= limite3.valor
          ? 'ir-renda-fixa-faixa-3'
          : 'ir-renda-fixa-faixa-4'
  const faixa = percentualDe(registro, idDaFaixa, dataReferencia)
  if (!faixa) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há tabela regressiva de imposto cadastrada para a data informada.' }
  }
  const aliquotaIr = basisPoints(faixa.valor)
  const imposto = aplicarAliquota(rendimento, aliquotaIr, POLITICA)
  const liquidoNoVencimento = subtrair(brutoNoVencimento, imposto)

  const rentabilidadeBrutaBp = aliquotaEfetiva(rendimento, entrada.valorAplicado, POLITICA)
  const rentabilidadeLiquidaBp = aliquotaEfetiva(
    subtrair(liquidoNoVencimento, entrada.valorAplicado),
    entrada.valorAplicado,
    POLITICA,
  )

  const etapas: Etapa[] = [
    {
      rotulo: 'Títulos comprados',
      formula: `${reais(entrada.valorAplicado)} ÷ ${reais(entrada.precoUnitario)} por título`,
      resultado: centavos(quantidadeEmCentesimos),
      unidade: 'numero',
      justificativa: 'O Tesouro Direto negocia frações de 0,01 título, e é por isso que a quantidade tem casas decimais.',
    },
    {
      rotulo: 'Valor bruto no vencimento',
      formula: `${reais(entrada.valorAplicado)} × ${reais(valorNominal)} ÷ ${reais(entrada.precoUnitario)}`,
      resultado: brutoNoVencimento,
      parametro: citar(nominal.resolvida),
      justificativa:
        'A LTN é resgatada pelo valor nominal na data de vencimento. O que o investidor recebe por título não depende do mercado — só de levar o título até o fim.',
    },
    {
      rotulo: `Imposto de renda — ${percentual(aliquotaIr)}`,
      formula: `${diasCorridos} dias de aplicação · ${reais(rendimento)} × ${percentual(aliquotaIr)}`,
      resultado: imposto,
      parametro: citar(faixa.resolvida),
      justificativa: 'A alíquota cai com o prazo, pela tabela regressiva, e incide só sobre o rendimento.',
    },
    {
      rotulo: 'Valor líquido no vencimento',
      formula: `${reais(brutoNoVencimento)} − ${reais(imposto)}`,
      resultado: liquidoNoVencimento,
      justificativa: 'Sem a taxa de custódia da B3 e sem taxas da corretora, que variam por instituição.',
    },
  ]

  return {
    ok: true,
    valores: {
      valorNominal,
      quantidadeEmCentesimos,
      brutoNoVencimento,
      rendimento,
      aliquotaIr,
      imposto,
      liquidoNoVencimento,
      diasCorridos,
      rentabilidadeBrutaBp,
      rentabilidadeLiquidaBp,
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [nominal.resolvida.vigencia.id, faixa.resolvida.vigencia.id, semIof.resolvida.vigencia.id],
    },
  }
}
