/**
 * CALC-096 — Imposto em fundos imobiliários.
 *
 * **A confusão que a página desfaz.** "Fundo imobiliário é isento" é meia
 * verdade, e a metade que falta custa dinheiro: a isenção alcança os
 * RENDIMENTOS distribuídos, e só quando três condições estão presentes ao mesmo
 * tempo. O GANHO na venda de cotas é sempre tributado, sem a isenção mensal que
 * existe para ações — e o imposto é apurado e pago pelo próprio investidor.
 *
 * As três condições da isenção dos rendimentos (Lei nº 11.033/2004, art. 3º,
 * III e § 1º):
 *
 * 1. cotas admitidas à negociação exclusivamente em bolsa ou balcão organizado;
 * 2. fundo com o número mínimo de cotistas;
 * 3. cotista pessoa física abaixo do limite de participação — nas cotas ou nos
 *    rendimentos —, inclusive somado ao conjunto de pessoas ligadas.
 */

import { aplicarAliquota, minimo, naoNegativo, somar, subtrair } from '../money'
import { citar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

type Resolvido<T> = { readonly valor: T; readonly resolvida: VigenciaResolvida } | null

function percentualDe(registro: Registro, id: string, data: DataISO): Resolvido<BasisPoints> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: basisPoints(r.resolvida.vigencia.valor.aliquotaBp), resolvida: r.resolvida }
}

function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido<number> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

function monetarioDe(registro: Registro, id: string, data: DataISO): Resolvido<Centavos> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'valor_monetario') return null
  return { valor: centavos(r.resolvida.vigencia.valor.centavos), resolvida: r.resolvida }
}

export interface EntradaFundosImobiliarios {
  /** Rendimentos distribuídos recebidos no mês. */
  readonly rendimentos: Centavos
  /** Ganho apurado na venda de cotas no mês. */
  readonly ganhoNaVenda: Centavos
  /** Perda apurada na venda de cotas no mês. */
  readonly perdaNaVenda: Centavos
  /** Prejuízo de meses anteriores, em operações com cotas de fundo imobiliário. */
  readonly prejuizoAcumulado: Centavos
  readonly cotasNegociadasEmBolsa: boolean
  /** Quantos cotistas o fundo tem, conforme o informe. Zero = não sei. */
  readonly cotistasDoFundo: number
  /** Participação do investidor — nas cotas ou nos rendimentos —, em basis points. */
  readonly participacaoBp: BasisPoints
}

export interface SaidaFundosImobiliarios {
  readonly impostoRendimentos: Centavos
  readonly impostoGanho: Centavos
  readonly impostoTotal: Centavos
  readonly darf: Centavos
  readonly rendimentosIsentos: boolean
  readonly baseGanho: Centavos
  readonly prejuizoAProximoMes: Centavos
  readonly minimoDeCotistas: number
  readonly limiteParticipacao: BasisPoints
  /** Verdadeiro quando o imposto do ganho existe mas fica abaixo do piso do DARF. */
  readonly acumulaParaOProximoMes: boolean
}

export function calcularIrFundosImobiliarios(
  entrada: EntradaFundosImobiliarios,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaFundosImobiliarios> {
  if (
    entrada.rendimentos < 0 ||
    entrada.ganhoNaVenda < 0 ||
    entrada.perdaNaVenda < 0 ||
    entrada.prejuizoAcumulado < 0 ||
    entrada.participacaoBp < 0
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Nenhum dos valores informados pode ser negativo.' }
  }
  if (entrada.cotistasDoFundo < 0 || !Number.isInteger(entrada.cotistasDoFundo)) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O número de cotistas precisa ser um inteiro.' }
  }
  if (entrada.rendimentos === 0 && entrada.ganhoNaVenda === 0 && entrada.perdaNaVenda === 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe os rendimentos recebidos no mês, o resultado da venda de cotas, ou os dois.',
    }
  }

  const aliquotaRendimentos = percentualDe(registro, 'fii-aliquota-rendimentos', dataReferencia)
  const aliquotaGanho = percentualDe(registro, 'fii-aliquota-ganho', dataReferencia)
  const minimoCotistas = inteiroDe(registro, 'fii-isencao-minimo-cotistas', dataReferencia)
  const limiteParticipacao = percentualDe(registro, 'fii-isencao-participacao-maxima', dataReferencia)
  const minimoDarf = monetarioDe(registro, 'darf-valor-minimo', dataReferencia)
  if (
    aliquotaRendimentos === null ||
    aliquotaGanho === null ||
    minimoCotistas === null ||
    limiteParticipacao === null ||
    minimoDarf === null
  ) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'Não há regras de tributação de fundo imobiliário cadastradas para a data informada.',
    }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([aliquotaGanho.resolvida.vigencia.id])

  // -------------------------------------------------------------------------
  // Rendimentos distribuídos — isentos só com as três condições
  // -------------------------------------------------------------------------
  const temCotistas = entrada.cotistasDoFundo >= minimoCotistas.valor
  const participacaoAbaixoDoLimite = entrada.participacaoBp < limiteParticipacao.valor
  const rendimentosIsentos = entrada.cotasNegociadasEmBolsa && temCotistas && participacaoAbaixoDoLimite

  let impostoRendimentos: Centavos = ZERO

  if (entrada.rendimentos > 0) {
    vigencias.add(minimoCotistas.resolvida.vigencia.id)
    vigencias.add(limiteParticipacao.resolvida.vigencia.id)

    if (rendimentosIsentos) {
      etapas.push({
        rotulo: 'Rendimentos distribuídos — isentos',
        formula: `${reais(entrada.rendimentos)} recebidos no mês`,
        resultado: ZERO,
        parametro: citar(minimoCotistas.resolvida),
        justificativa:
          'As três condições estão presentes: cotas negociadas em bolsa ou balcão organizado, fundo com o número mínimo de cotistas e participação do investidor abaixo do limite.',
      })
    } else {
      const motivo = !entrada.cotasNegociadasEmBolsa
        ? 'as cotas não são negociadas exclusivamente em bolsa ou balcão organizado'
        : !temCotistas
          ? `o fundo tem menos de ${minimoCotistas.valor} cotistas`
          : `a participação informada alcança ${percentual(limiteParticipacao.valor)} das cotas ou dos rendimentos`
      impostoRendimentos = aplicarAliquota(entrada.rendimentos, aliquotaRendimentos.valor, POLITICA)
      vigencias.add(aliquotaRendimentos.resolvida.vigencia.id)
      etapas.push({
        rotulo: `Rendimentos distribuídos — ${percentual(aliquotaRendimentos.valor)} na fonte`,
        formula: `${reais(entrada.rendimentos)} × ${percentual(aliquotaRendimentos.valor)}`,
        resultado: impostoRendimentos,
        parametro: citar(aliquotaRendimentos.resolvida),
        justificativa: `Sem isenção porque ${motivo}. A retenção é feita pelo administrador do fundo, e para a pessoa física a tributação é exclusiva.`,
      })
    }
  }

  // -------------------------------------------------------------------------
  // Ganho na venda de cotas — sempre tributado
  // -------------------------------------------------------------------------
  const resultadoDaVenda = subtrair(entrada.ganhoNaVenda, entrada.perdaNaVenda)
  const ganhoLiquido = naoNegativo(resultadoDaVenda)
  const perdaDoMes = naoNegativo(subtrair(ZERO, resultadoDaVenda))

  let baseGanho: Centavos = ZERO
  let impostoGanho: Centavos = ZERO
  let prejuizoRestante = entrada.prejuizoAcumulado

  if (ganhoLiquido > 0) {
    const compensado = minimo(entrada.prejuizoAcumulado, ganhoLiquido)
    prejuizoRestante = subtrair(entrada.prejuizoAcumulado, compensado)
    baseGanho = subtrair(ganhoLiquido, compensado)

    etapas.push({
      rotulo: 'Ganho na venda de cotas',
      formula:
        compensado > 0
          ? `${reais(ganhoLiquido)} − ${reais(compensado)} de prejuízo acumulado em cotas de fundo imobiliário`
          : `${reais(ganhoLiquido)} apurados no mês`,
      resultado: baseGanho,
      justificativa:
        'A isenção mensal de vendas é do mercado à vista de ações e não alcança cotas de fundo imobiliário: aqui, qualquer ganho é tributado. Esta estimativa compensa o prejuízo apenas contra ganhos do mesmo tipo de operação.',
    })

    impostoGanho = aplicarAliquota(baseGanho, aliquotaGanho.valor, POLITICA)
    etapas.push({
      rotulo: `Imposto sobre o ganho — ${percentual(aliquotaGanho.valor)}`,
      formula: `${reais(baseGanho)} × ${percentual(aliquotaGanho.valor)}`,
      resultado: impostoGanho,
      parametro: citar(aliquotaGanho.resolvida),
      justificativa:
        'Apurado pelo próprio investidor e pago por DARF até o último dia útil do mês seguinte. A retenção feita pela corretora é apenas antecipação e aparece na nota de corretagem.',
    })
  }

  const impostoTotal = somar(impostoRendimentos, impostoGanho)
  const acumulaParaOProximoMes = impostoGanho > 0 && impostoGanho < minimoDarf.valor
  const darf = acumulaParaOProximoMes ? ZERO : impostoGanho

  if (acumulaParaOProximoMes) {
    vigencias.add(minimoDarf.resolvida.vigencia.id)
    etapas.push({
      rotulo: 'Abaixo do valor mínimo do DARF',
      formula: `${reais(impostoGanho)} < ${reais(minimoDarf.valor)}`,
      resultado: ZERO,
      parametro: citar(minimoDarf.resolvida),
      justificativa: 'O imposto se acumula para os meses seguintes, no mesmo código de receita, até alcançar o mínimo.',
    })
  }

  const prejuizoAProximoMes = somar(prejuizoRestante, perdaDoMes)
  if (prejuizoAProximoMes > 0) {
    etapas.push({
      rotulo: 'Prejuízo a transportar',
      formula: `${reais(prejuizoAProximoMes)} em cotas de fundo imobiliário`,
      resultado: prejuizoAProximoMes,
      justificativa:
        'Para usá-lo depois, ele precisa estar informado no demonstrativo de renda variável do mês em que ocorreu.',
    })
  }

  etapas.push({
    rotulo: 'Imposto do mês',
    formula:
      impostoRendimentos > 0
        ? `${reais(impostoRendimentos)} retidos nos rendimentos + ${reais(impostoGanho)} sobre o ganho`
        : reais(impostoGanho),
    resultado: impostoTotal,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: {
      impostoRendimentos,
      impostoGanho,
      impostoTotal,
      darf,
      rendimentosIsentos,
      baseGanho,
      prejuizoAProximoMes,
      minimoDeCotistas: minimoCotistas.valor,
      limiteParticipacao: limiteParticipacao.valor,
      acumulaParaOProximoMes,
    },
    traco,
  }
}
