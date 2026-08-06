/**
 * CALC-027 — Empréstimo consignado: margem e parcela.
 *
 * **A margem é 40% da remuneração DISPONÍVEL, e é aí que quase todo mundo
 * erra.** O art. 2º, VIII da Lei nº 10.820/2003 define remuneração disponível
 * como "os vencimentos, subsídios, soldos, salários ou remunerações,
 * **descontadas as consignações compulsórias**" — o líquido de INSS, IRRF e
 * demais descontos obrigatórios.
 *
 * Quem calcula 40% do bruto superestima a própria margem, descobre no banco, e
 * a diferença passa de mil reais em salários altos. Por isso a página parte do
 * BRUTO e mostra a dedução: reaproveita os motores de INSS e IRRF, que já
 * existem e já são conferidos, em vez de pedir um líquido que o usuário pode
 * informar errado.
 *
 * **A margem livre vira um valor de empréstimo pelo valor presente.** Sabendo
 * quanto cabe por mês, o prazo e a taxa, o quanto se pode tomar é o valor
 * presente dessa série — a mesma função que CALC-024 usa para o CET, pelo
 * caminho inverso.
 *
 * O QUE ESTA CALCULADORA NÃO COBRE, DECLARADO
 *
 * **Só o empregado CLT.** Aposentados e pensionistas do INSS têm regra própria
 * no art. 6º da mesma lei, hoje em alteração pela Medida Provisória nº 1.355, de
 * 2026 — norma em trânsito. Servidor público segue regulamento do próprio ente.
 */

import { parcelaPrice, taxaInternaMensal, valorPresenteDeSerie } from '../financeira'
import { calcularInss } from '../inss'
import { calcularIrrf } from '../irrf'
import { aplicarAliquota, multiplicarPorInteiro, naoNegativo, somar, subtrair } from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

export const PARAMETROS_CONSIGNADO = [
  'consignado-margem-clt',
  'inss-tabela-progressiva',
  'irrf-tabela-progressiva',
  'irrf-deducao-dependente',
  'irrf-desconto-simplificado',
] as const

export interface EntradaConsignado {
  readonly salarioBruto: Centavos
  readonly dependentes: number
  /** Pensão alimentícia judicial e outros descontos obrigatórios. */
  readonly outrosCompulsorios: Centavos
  /** Parcelas de consignado que já comprometem a folha. */
  readonly jaConsignado: Centavos
  readonly prazoMeses: number
  readonly taxaMensalBp: BasisPoints
}

export interface SaidaConsignado {
  readonly inss: Centavos
  readonly irrf: Centavos
  readonly remuneracaoDisponivel: Centavos
  readonly margemBp: BasisPoints
  readonly margemTotal: Centavos
  readonly margemLivre: Centavos
  readonly margemSobreOBruto: Centavos
  /** Quanto se pode tomar emprestado com a margem livre, no prazo e na taxa. */
  readonly emprestimoPossivel: Centavos
  readonly parcela: Centavos
  readonly totalPago: Centavos
  readonly custoDoCredito: Centavos
  readonly cetMensal: BasisPoints
  readonly margemEsgotada: boolean
}

export function calcularConsignado(
  entrada: EntradaConsignado,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaConsignado> {
  if (entrada.salarioBruto <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o salário bruto para ver o resultado.',
    }
  }
  if (entrada.prazoMeses <= 0 || entrada.taxaMensalBp <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o prazo e a taxa mensal da proposta para ver quanto cabe na margem.',
    }
  }

  const margem = registro.resolver('consignado-margem-clt', dataReferencia)
  if (!margem.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: margem.detalhe }
  if (margem.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A margem não é percentual.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)
  traco.passo('Salário bruto', reais(entrada.salarioBruto), entrada.salarioBruto)

  /**
   * As consignações COMPULSÓRIAS saem antes — é o que o inciso VIII manda. Os
   * dois motores já existem e já são conferidos; reaproveitá-los é o que impede
   * esta página de divergir de CALC-016 e CALC-015.
   */
  const previdencia = calcularInss({ salarioContribuicao: entrada.salarioBruto }, dataReferencia, registro)
  if (!previdencia.ok) return previdencia

  const imposto = calcularIrrf(
    {
      rendimentoBruto: entrada.salarioBruto,
      inss: previdencia.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: entrada.outrosCompulsorios,
    },
    dataReferencia,
    registro,
  )
  if (!imposto.ok) return imposto

  const compulsorias = somar(
    previdencia.valores.contribuicao,
    imposto.valores.imposto,
    entrada.outrosCompulsorios,
  )
  const remuneracaoDisponivel = naoNegativo(subtrair(entrada.salarioBruto, compulsorias))

  traco.passo(
    'Remuneração disponível',
    `${reais(entrada.salarioBruto)} − ${reais(previdencia.valores.contribuicao)} de INSS − ` +
      `${reais(imposto.valores.imposto)} de IRRF` +
      (entrada.outrosCompulsorios > 0
        ? ` − ${reais(entrada.outrosCompulsorios)} de outros descontos obrigatórios`
        : ''),
    remuneracaoDisponivel,
  )

  const margemBp = margem.resolvida.vigencia.valor.aliquotaBp as BasisPoints
  const margemTotal = aplicarAliquota(remuneracaoDisponivel, margemBp, POLITICA)

  traco.passoComParametro(
    'Margem consignável',
    `${reais(remuneracaoDisponivel)} × ${percentual(margemBp)}`,
    margemTotal,
    margem.resolvida,
    'A lei manda calcular sobre a remuneração DISPONÍVEL — o líquido das consignações ' +
      'compulsórias —, e não sobre o salário bruto. Quem usa o bruto superestima a margem e ' +
      'descobre a diferença no banco.',
  )

  /** O mesmo percentual sobre o bruto, só para mostrar o tamanho do engano. */
  const margemSobreOBruto = aplicarAliquota(entrada.salarioBruto, margemBp, POLITICA)

  const margemLivre = naoNegativo(subtrair(margemTotal, entrada.jaConsignado))
  const margemEsgotada = margemLivre <= 0

  if (entrada.jaConsignado > 0) {
    traco.passo(
      'Margem ainda livre',
      `${reais(margemTotal)} − ${reais(entrada.jaConsignado)} já comprometidos`,
      margemLivre,
    )
  }

  /**
   * Quanto cabe de empréstimo: o valor presente de uma série de parcelas iguais
   * à margem livre. É a mesma função do CET, usada pelo caminho inverso.
   */
  const emprestimoPossivel = margemEsgotada
    ? ZERO
    : valorPresenteDeSerie(margemLivre, entrada.prazoMeses, entrada.taxaMensalBp)

  const parcela = margemEsgotada
    ? ZERO
    : parcelaPrice(emprestimoPossivel, entrada.prazoMeses, entrada.taxaMensalBp)

  if (!margemEsgotada) {
    traco.passo(
      'Quanto cabe de empréstimo',
      `valor presente de ${entrada.prazoMeses} parcelas de ${reais(margemLivre)} a ` +
        `${percentual(entrada.taxaMensalBp)} ao mês`,
      emprestimoPossivel,
    )
  }

  const totalPago = multiplicarPorInteiro(parcela, entrada.prazoMeses)
  const custoDoCredito = subtrair(totalPago, emprestimoPossivel)

  if (!margemEsgotada) {
    traco.passo(
      'Custo do crédito',
      `${entrada.prazoMeses} × ${reais(parcela)} − ${reais(emprestimoPossivel)}`,
      custoDoCredito,
    )
  }

  const cet = margemEsgotada
    ? null
    : taxaInternaMensal(emprestimoPossivel, parcela, entrada.prazoMeses)

  return {
    ok: true,
    valores: {
      inss: previdencia.valores.contribuicao,
      irrf: imposto.valores.imposto,
      remuneracaoDisponivel,
      margemBp,
      margemTotal,
      margemLivre,
      margemSobreOBruto,
      emprestimoPossivel,
      parcela,
      totalPago,
      custoDoCredito,
      cetMensal: cet ?? basisPoints(0),
      margemEsgotada,
    },
    traco: {
      etapas: [...traco.construir().etapas],
      dataReferencia,
      vigenciasAplicadas: [
        ...traco.construir().vigenciasAplicadas,
        ...previdencia.traco.vigenciasAplicadas,
        ...imposto.traco.vigenciasAplicadas,
      ],
    },
  }
}

export { centavos }
