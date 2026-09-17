/**
 * CALC-082 — Desconto do vale-transporte.
 *
 * A mesma regra que CALC-001 aplica dentro do salário líquido (`RN-027`), com a
 * conta que CALC-001 não mostra: quanto o transporte custa no mês e quanto
 * disso o empregador paga.
 *
 * **O desconto é o MENOR de dois números**: a cota do empregado sobre o salário
 * básico e o custo real do transporte. Descontar a cota cheia de quem gasta
 * menos cobraria por transporte que não existe — é o erro que a memória de
 * cálculo existe para mostrar.
 */

import { aplicarAliquota, minimo, multiplicarPorInteiro, subtrair } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { basisPoints, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { DEC_10854_ART_114 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

export interface EntradaValeTransporte {
  /** Salário básico — sem adicionais nem vantagens (Decreto nº 10.854/2021, art. 114, I). */
  readonly salarioBasico: Centavos
  readonly valorPassagem: Centavos
  readonly viagensPorDia: number
  readonly diasUteis: number
}

export interface SaidaValeTransporte {
  readonly custoMensal: Centavos
  readonly cotaDoEmpregado: Centavos
  readonly desconto: Centavos
  readonly parteDoEmpregador: Centavos
  readonly aliquota: BasisPoints
  /** Verdadeiro quando o custo é menor que a cota e o desconto é o próprio custo. */
  readonly limitadoAoCusto: boolean
}

export function calcularValeTransporte(
  entrada: EntradaValeTransporte,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaValeTransporte> {
  if (entrada.salarioBasico <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário básico para ver o resultado.' }
  }
  if (entrada.valorPassagem <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor da passagem.' }
  }
  if (entrada.viagensPorDia <= 0 || entrada.diasUteis <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe as viagens por dia e os dias de trabalho no mês.' }
  }

  const cota = registro.resolver('vale-transporte-cota-do-empregado', dataReferencia)
  if (!cota.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: cota.detalhe }
  if (cota.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A cota do vale-transporte não é percentual.' }
  }
  const aliquota = basisPoints(cota.resolvida.vigencia.valor.aliquotaBp)

  const etapas: Etapa[] = []

  const custoMensal = multiplicarPorInteiro(
    multiplicarPorInteiro(entrada.valorPassagem, entrada.viagensPorDia),
    entrada.diasUteis,
  )
  etapas.push({
    rotulo: 'Custo do transporte no mês',
    formula: `${reais(entrada.valorPassagem)} × ${entrada.viagensPorDia} ${entrada.viagensPorDia === 1 ? 'viagem' : 'viagens'} × ${entrada.diasUteis} dias`,
    resultado: custoMensal,
  })

  const cotaDoEmpregado = aplicarAliquota(entrada.salarioBasico, aliquota, POLITICA)
  etapas.push({
    rotulo: 'Cota máxima do empregado',
    formula: `${reais(entrada.salarioBasico)} × ${percentual(aliquota)}`,
    resultado: cotaDoEmpregado,
    parametro: citar(cota.resolvida),
  })
  etapas.push({
    rotulo: 'Base da cota — salário básico',
    formula: 'Sem adicionais, horas extras nem outras vantagens',
    resultado: entrada.salarioBasico,
    fundamento: fundamentar(DEC_10854_ART_114),
    justificativa:
      'A cota incide sobre o salário básico, e não sobre a remuneração total do mês. Quem recebe adicionais ' +
      'tem a cota calculada sem eles.',
  })

  const desconto = minimo(cotaDoEmpregado, custoMensal)
  const limitadoAoCusto = custoMensal < cotaDoEmpregado
  etapas.push({
    rotulo: 'Desconto do empregado',
    formula: `menor entre a cota, ${reais(cotaDoEmpregado)}, e o custo, ${reais(custoMensal)}`,
    resultado: desconto,
    justificativa: limitadoAoCusto
      ? 'O transporte custa menos que a cota, então o desconto é o próprio custo — nunca a cota inteira.'
      : 'O transporte custa mais que a cota: o empregado paga a cota e o empregador arca com todo o excedente.',
  })

  const parteDoEmpregador = subtrair(custoMensal, desconto)
  etapas.push({
    rotulo: 'Parte paga pelo empregador',
    formula: `${reais(custoMensal)} − ${reais(desconto)}`,
    resultado: parteDoEmpregador,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [cota.resolvida.vigencia.id] }
  return {
    ok: true,
    valores: { custoMensal, cotaDoEmpregado, desconto, parteDoEmpregador, aliquota, limitadoAoCusto },
    traco,
  }
}
