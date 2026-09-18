/**
 * CALC-114 — Imposto sobre aluguel recebido.
 *
 * O aluguel é rendimento tributável pela tabela mensal, como o salário. O que
 * o separa do carnê-leão genérico (CALC-053) é o que NÃO entra na base — e é
 * isso que quase todo locador esquece (RIR/2018, arts. 42 e 689, com base na
 * Lei nº 7.739/1989, art. 14):
 *
 * - IPTU e demais impostos, taxas e emolumentos do imóvel;
 * - o condomínio pago pelo locador;
 * - a taxa da imobiliária — "despesas pagas para cobrança ou recebimento";
 * - o aluguel pago, quando o imóvel é sublocado.
 *
 * Tirado isso, o imposto sai pelo mesmo motor do carnê-leão: tabela mensal,
 * desconto simplificado quando vantajoso e o redutor de 2026. Quem paga decide
 * como o imposto é recolhido — pessoa física: carnê-leão, pelo próprio
 * locador; pessoa jurídica: retenção na fonte —, não quanto ele é.
 */

import { calcularCarneLeao, type SaidaCarneLeao } from './carne-leao'
import { minimo, somar, subtrair } from '../money'
import { fundamentar, reais, type Etapa, type Resultado } from '../traco'
import type { Centavos } from '../types'
import { ZERO } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { RIR_2018_ART_42, RIR_2018_ART_689 } from '../../params/data/fontes'

export type QuemPaga = 'pessoa-fisica' | 'pessoa-juridica'

export interface EntradaAluguel {
  readonly aluguel: Centavos
  /** IPTU e taxas do imóvel, na parcela do mês, quando pagos pelo locador. */
  readonly impostosETaxas: Centavos
  /** Condomínio pago pelo locador. */
  readonly condominio: Centavos
  /** Taxa de administração da imobiliária. */
  readonly administracao: Centavos
  /** Aluguel pago pelo imóvel, quando ele é sublocado. */
  readonly sublocacao: Centavos
  readonly dependentes: number
  readonly quemPaga: QuemPaga
}

export interface SaidaAluguel {
  readonly imposto: Centavos
  readonly exclusoes: Centavos
  readonly baseAntesDasDeducoes: Centavos
  /** O que sobra do aluguel depois das despesas excluídas e do imposto. */
  readonly liquido: Centavos
  /** Nulo quando as exclusões zeram a base. */
  readonly carneLeao: SaidaCarneLeao | null
}

export function calcularImpostoSobreAluguel(
  entrada: EntradaAluguel,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaAluguel> {
  if (entrada.aluguel <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o aluguel recebido no mês.' }
  }
  const partes = [entrada.impostosETaxas, entrada.condominio, entrada.administracao, entrada.sublocacao]
  if (partes.some((v) => v < 0)) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Valores não podem ser negativos.' }
  }

  // As exclusões não passam do próprio aluguel: o que sobrar não vira prejuízo.
  const somaDasExclusoes = somar(...partes)
  const exclusoes = minimo(somaDasExclusoes, entrada.aluguel)
  const base = subtrair(entrada.aluguel, exclusoes)

  const fonte = entrada.quemPaga === 'pessoa-fisica' ? RIR_2018_ART_42 : RIR_2018_ART_689
  const etapas: Etapa[] = [
    {
      rotulo: 'O que não entra na base',
      formula: [
        entrada.impostosETaxas > 0 ? `IPTU e taxas ${reais(entrada.impostosETaxas)}` : null,
        entrada.condominio > 0 ? `condomínio ${reais(entrada.condominio)}` : null,
        entrada.administracao > 0 ? `administração ${reais(entrada.administracao)}` : null,
        entrada.sublocacao > 0 ? `aluguel da sublocação ${reais(entrada.sublocacao)}` : null,
      ]
        .filter(Boolean)
        .join(' + ') || 'nenhuma exclusão informada',
      resultado: exclusoes,
      fundamento: fundamentar(fonte),
      justificativa:
        'Impostos e taxas do imóvel, condomínio, despesas de cobrança — como a taxa da imobiliária — e o aluguel pago na sublocação não são rendimento, e o regulamento os tira da base.',
    },
    {
      rotulo: 'Aluguel tributável',
      formula: `${reais(entrada.aluguel)} − ${reais(exclusoes)}`,
      resultado: base,
    },
  ]

  // Base zerada pelas exclusões: não há rendimento a tributar, e o motor do
  // carnê-leão — que pede um rendimento — nem precisa ser chamado.
  if (base === 0) {
    return {
      ok: true,
      valores: {
        imposto: ZERO,
        exclusoes,
        baseAntesDasDeducoes: base,
        liquido: ZERO,
        carneLeao: null,
      },
      traco: { etapas, dataReferencia, vigenciasAplicadas: [] },
    }
  }

  const r = calcularCarneLeao(
    { rendimento: base, livroCaixa: ZERO, excessoAnterior: ZERO, inss: ZERO, dependentes: entrada.dependentes, pensao: ZERO },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  return {
    ok: true,
    valores: {
      imposto: r.valores.imposto,
      exclusoes,
      baseAntesDasDeducoes: base,
      liquido: subtrair(base, r.valores.imposto),
      carneLeao: r.valores,
    },
    traco: {
      etapas: [...etapas, ...r.traco.etapas],
      dataReferencia,
      vigenciasAplicadas: r.traco.vigenciasAplicadas,
    },
  }
}
