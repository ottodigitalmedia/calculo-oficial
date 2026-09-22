/**
 * CALC-123 — Tesouro Selic: quanto rendeu, e quanto o imposto leva.
 *
 * A LFT rende a taxa Selic acumulada no período (Decreto nº 12.814/2026, art.
 * 3º). A série mensal da Selic já está no produto, e é ela que dá o bruto; o
 * que a conta acrescenta é o imposto pela tabela regressiva, que é onde a
 * conferência caseira erra — aplicando a alíquota sobre o total em vez de sobre
 * o rendimento.
 *
 * A JANELA É DE MESES CHEIOS, E ISSO ESTÁ DECLARADO
 *
 * A série é mensal, e a LFT rende todo dia útil. Por isso a entrada não é "data
 * de compra": são o **primeiro e o último mês de rendimento**, e os dois entram
 * na conta. Quem comprou no meio de um mês rendeu menos naquele mês do que a
 * série inteira indica — a página diz isso, em vez de fingir precisão diária
 * que a fonte não tem.
 *
 * **A diferença para CALC-060 é a janela.** Lá, corrigir de março para julho
 * aplica abril a julho, porque o índice de março já está no valor de março.
 * Aqui os meses escolhidos são os meses que renderam, e todos entram. As duas
 * usam o mesmo acumulador (`acumularFator`), e cada uma escolhe o recorte.
 *
 * O QUE NÃO ENTRA
 *
 * - **taxa de custódia da B3 e taxas da corretora**, que variam por instituição
 *   e por faixa de valor — a tela declara a ausência, como em CALC-045 e
 *   CALC-122;
 * - **ágio e deságio**: a LFT é negociada com pequena diferença sobre o valor
 *   nominal, e o resultado real fica um pouco acima ou abaixo deste;
 * - **IOF**: janelas menores que trinta dias são recusadas, porque a tabela do
 *   Anexo do Decreto nº 6.306/2007 ainda cobra.
 */

import { acumularFator, distanciaEmMeses, ESCALA_DO_FATOR, mesEm, type SerieMensal } from './indices'
import { aplicarAliquota, subtrair } from '../money'
import { citar, percentual, reais, type Etapa, type Resultado } from '../traco'
import { basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import { diasEntre, diasNoMes, type DataCivil } from '../datas'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

/** 100% em basis points. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
const BP_INTEIRO = 10_000n

export const PARAMETROS_TESOURO_SELIC = [
  'iof-renda-fixa-dias-sem-cobranca',
  'ir-renda-fixa-faixa-1',
  'ir-renda-fixa-faixa-2',
  'ir-renda-fixa-faixa-3',
  'ir-renda-fixa-faixa-4',
  'ir-renda-fixa-limite-1',
  'ir-renda-fixa-limite-2',
  'ir-renda-fixa-limite-3',
] as const

export interface EntradaTesouroSelic {
  readonly valorAplicado: Centavos
  /** Primeiro mês de rendimento, em `AAAA-MM`. Entra na conta. */
  readonly primeiroMes: string
  /** Último mês de rendimento, em `AAAA-MM`. Também entra. */
  readonly ultimoMes: string
  readonly serie: SerieMensal
}

export interface SaidaTesouroSelic {
  readonly bruto: Centavos
  readonly rendimento: Centavos
  readonly variacaoBp: BasisPoints
  readonly aliquotaIr: BasisPoints
  readonly imposto: Centavos
  readonly liquido: Centavos
  readonly mesesAplicados: number
  readonly diasCorridos: number
  readonly ultimoMesDisponivel: string
}

type Resolvido = { readonly valor: number; readonly resolvida: VigenciaResolvida } | null

function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

function percentualDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: r.resolvida.vigencia.valor.aliquotaBp, resolvida: r.resolvida }
}

/** O primeiro dia de um rótulo `AAAA-MM`. */
function primeiroDiaDoMes(rotulo: string): DataCivil | null {
  const m = /^(\d{4})-(\d{2})$/.exec(rotulo)
  if (!m) return null
  return { ano: Number(m[1]), mes: Number(m[2]), dia: 1 }
}

export function calcularTesouroSelic(
  entrada: EntradaTesouroSelic,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaTesouroSelic> {
  if (entrada.valorAplicado <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor aplicado para ver o resultado.' }
  }
  const { serie } = entrada
  if (serie.valores.length === 0 || serie.inicio === '') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Não há série da Selic disponível.' }
  }

  const ultimoMesDisponivel = mesEm(serie.inicio, serie.valores.length - 1)
  const inicio = primeiroDiaDoMes(entrada.primeiroMes)
  const passos = distanciaEmMeses(entrada.primeiroMes, entrada.ultimoMes)
  if (inicio === null || passos === null) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o primeiro e o último mês de rendimento.' }
  }
  if (passos < 0) {
    return { ok: false, motivo: 'inconsistencia_temporal', detalhe: 'O último mês não pode ser anterior ao primeiro.' }
  }

  const posicaoInicial = distanciaEmMeses(serie.inicio, entrada.primeiroMes)
  if (posicaoInicial === null || posicaoInicial < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `A série da Selic começa em ${serie.inicio}. Escolha um mês a partir dali.`,
    }
  }
  if (posicaoInicial + passos > serie.valores.length - 1) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `O último mês publicado da Selic é ${ultimoMesDisponivel}. A taxa de um mês só é conhecida depois que ele termina.`,
    }
  }

  const semIof = inteiroDe(registro, 'iof-renda-fixa-dias-sem-cobranca', dataReferencia)
  const limite1 = inteiroDe(registro, 'ir-renda-fixa-limite-1', dataReferencia)
  const limite2 = inteiroDe(registro, 'ir-renda-fixa-limite-2', dataReferencia)
  const limite3 = inteiroDe(registro, 'ir-renda-fixa-limite-3', dataReferencia)
  if (!semIof || !limite1 || !limite2 || !limite3) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há regras de imposto cadastradas para a data informada.' }
  }

  // Do primeiro dia do primeiro mês ao último dia do último mês.
  const fimRotulo = mesEm(entrada.primeiroMes, passos)
  const fimMes = primeiroDiaDoMes(fimRotulo)
  if (fimMes === null) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Mês final inválido.' }
  }
  const fim: DataCivil = { ...fimMes, dia: diasNoMes(fimMes.ano, fimMes.mes) }
  const diasCorridos = diasEntre(inicio, fim) + 1

  if (diasCorridos < semIof.valor) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `A janela tem ${diasCorridos} dias, e abaixo de ${semIof.valor} ainda incide IOF pela tabela do Anexo do Decreto nº 6.306/2007 — caso que esta conta não cobre.`,
    }
  }

  const mesesAplicados = passos + 1
  const fator = acumularFator(serie, posicaoInicial, posicaoInicial + passos)
  const bruto = centavos(Number((BigInt(entrada.valorAplicado) * fator) / ESCALA_DO_FATOR))
  const rendimento = subtrair(bruto, entrada.valorAplicado)
  const variacaoBp = basisPoints(
    Number(((fator - ESCALA_DO_FATOR) * BP_INTEIRO) / ESCALA_DO_FATOR),
  )

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
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há tabela regressiva cadastrada para a data informada.' }
  }
  const aliquotaIr = basisPoints(faixa.valor)
  const imposto = aplicarAliquota(rendimento, aliquotaIr, POLITICA)
  const liquido = subtrair(bruto, imposto)

  const etapas: Etapa[] = [
    {
      rotulo: `Selic acumulada — ${mesesAplicados} ${mesesAplicados === 1 ? 'mês' : 'meses'}`,
      formula: `de ${entrada.primeiroMes} a ${fimRotulo}, multiplicados um a um`,
      resultado: centavos(variacaoBp),
      unidade: 'percentual',
      justificativa:
        'As taxas mensais se multiplicam, não se somam. Os dois meses escolhidos entram: são os meses em que o dinheiro rendeu.',
    },
    {
      rotulo: 'Valor bruto',
      formula: `${reais(entrada.valorAplicado)} × (1 + Selic acumulada)`,
      resultado: bruto,
    },
    {
      rotulo: `Imposto de renda — ${percentual(aliquotaIr)}`,
      formula: `${diasCorridos} dias na janela · ${reais(rendimento)} × ${percentual(aliquotaIr)}`,
      resultado: imposto,
      parametro: citar(faixa.resolvida),
      justificativa: 'A alíquota cai com o prazo e incide só sobre o rendimento.',
    },
    {
      rotulo: 'Valor líquido',
      formula: `${reais(bruto)} − ${reais(imposto)}`,
      resultado: liquido,
      justificativa: 'Sem a taxa de custódia da B3 e sem taxas da corretora.',
    },
  ]

  return {
    ok: true,
    valores: {
      bruto,
      rendimento,
      variacaoBp,
      aliquotaIr,
      imposto,
      liquido,
      mesesAplicados,
      diasCorridos,
      ultimoMesDisponivel,
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [faixa.resolvida.vigencia.id, semIof.resolvida.vigencia.id],
    },
  }
}
