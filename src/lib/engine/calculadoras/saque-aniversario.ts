/**
 * CALC-095 — Saque-aniversário do FGTS.
 *
 * A conta é curta: alíquota da faixa sobre a SOMA de todos os saldos, mais a
 * parcela adicional da mesma faixa (Lei nº 8.036/1990, art. 20-D). O que a
 * página precisa mostrar, além do valor, é o que a opção custa — na sistemática
 * do saque-aniversário, a despedida sem justa causa deixa de ser hipótese de
 * movimentação da conta (art. 20-A, § 2º, II), e voltar atrás só produz efeito
 * no primeiro dia do vigésimo quinto mês seguinte ao pedido (art. 20-C).
 *
 * **A parcela é ADICIONAL, não a deduzir.** É a diferença desta tabela para as
 * do imposto de renda, e é ela que mantém o saque contínuo na fronteira: com
 * R$ 1.000,00 de saldo saca-se o mesmo que com R$ 1.000,01.
 */

import { aplicarAliquota, multiplicarPorInteiro, somar, subtrair } from '../money'
import { citar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO, Faixa } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

export interface EntradaSaqueAniversario {
  /** Soma de todos os saldos das contas vinculadas, na data do saque. */
  readonly saldo: Centavos
}

export interface SaidaSaqueAniversario {
  readonly saque: Centavos
  readonly saldoRestante: Centavos
  readonly aliquota: BasisPoints
  readonly parcelaAdicional: Centavos
  /** Quanto o saque representa do saldo, em basis points. */
  readonly percentualEfetivo: BasisPoints
}

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/** 100% em basis points. Unidade, não parâmetro legal. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
const BP_INTEIRO = 10_000

function faixaDoSaldo(faixas: readonly Faixa[], saldo: number): Faixa | null {
  for (const f of faixas) {
    const dentroDoPiso = saldo >= f.limiteInferiorCentavos
    const dentroDoTeto = f.limiteSuperiorCentavos === null || saldo <= f.limiteSuperiorCentavos
    if (dentroDoPiso && dentroDoTeto) return f
  }
  return null
}

export function calcularSaqueAniversario(
  entrada: EntradaSaqueAniversario,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaSaqueAniversario> {
  if (entrada.saldo <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o saldo somado das suas contas do FGTS.' }
  }

  const r = registro.resolver('fgts-saque-aniversario-tabela', dataReferencia)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'tabela_faixas') {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'A tabela do saque-aniversário não está cadastrada para a data informada.',
    }
  }

  const faixa = faixaDoSaldo(r.resolvida.vigencia.valor.faixas, entrada.saldo)
  if (!faixa) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O saldo informado não cai em nenhuma faixa da tabela.' }
  }

  const aliquota = basisPoints(faixa.aliquotaBp)
  const parcelaAdicional = centavos(faixa.parcelaAdicionalCentavos ?? 0)

  const parteVariavel = aplicarAliquota(entrada.saldo, aliquota, POLITICA)
  const saque = somar(parteVariavel, parcelaAdicional)
  const saldoRestante = subtrair(entrada.saldo, saque)

  const etapas: Etapa[] = [
    {
      rotulo: `Alíquota da faixa — ${percentual(aliquota)}`,
      formula: `${reais(entrada.saldo)} × ${percentual(aliquota)}`,
      resultado: parteVariavel,
      parametro: citar(r.resolvida),
      justificativa:
        'A alíquota incide sobre a soma de TODOS os saldos das contas vinculadas do titular, apurados na data do saque — e não sobre a conta do emprego atual.',
    },
  ]

  if (parcelaAdicional > 0) {
    etapas.push({
      rotulo: 'Parcela adicional da faixa',
      formula: `${reais(parteVariavel)} + ${reais(parcelaAdicional)}`,
      resultado: saque,
      parametro: citar(r.resolvida),
      justificativa:
        'A parcela é somada, e não deduzida: é ela que impede o saque de cair quando o saldo passa para a faixa seguinte.',
    })
  }

  etapas.push({
    rotulo: 'Saque-aniversário',
    formula: parcelaAdicional > 0 ? `${reais(parteVariavel)} + ${reais(parcelaAdicional)}` : reais(parteVariavel),
    resultado: saque,
  })
  etapas.push({
    rotulo: 'Saldo que permanece na conta',
    formula: `${reais(entrada.saldo)} − ${reais(saque)}`,
    resultado: saldoRestante,
    justificativa:
      'O restante continua rendendo na conta vinculada — e, na sistemática do saque-aniversário, não pode ser sacado em caso de despedida sem justa causa.',
  })

  const percentualEfetivo = basisPoints(Math.round((saque * BP_INTEIRO) / entrada.saldo))

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [r.resolvida.vigencia.id] }
  return {
    ok: true,
    valores: { saque, saldoRestante, aliquota, parcelaAdicional, percentualEfetivo },
    traco,
  }
}

// ---------------------------------------------------------------------------
// Limites da antecipação — Resolução CCFGTS nº 958/2020
// ---------------------------------------------------------------------------

export const PARAMETROS_ANTECIPACAO = [
  'antecipacao-saques-maximos',
  'antecipacao-valor-minimo-por-saque',
  'antecipacao-valor-maximo-por-saque',
  'antecipacao-carencia-dias',
  'antecipacao-juros-teto-mensal',
] as const

export interface LimitesDaAntecipacao {
  readonly saquesMaximos: number
  readonly minimoPorSaque: Centavos
  readonly maximoPorSaque: Centavos
  /** O que dá para ceder de cada saque: o próprio saque, limitado ao máximo. */
  readonly cedivelPorSaque: Centavos
  /** O total que pode ser cedido na contratação. Zero quando o saque não chega ao mínimo. */
  readonly totalCedivel: Centavos
  readonly atendeMinimo: boolean
  readonly carenciaDias: number
  readonly jurosTetoBp: BasisPoints
}

/**
 * Quanto a antecipação pode alcançar, pelos limites do Conselho Curador.
 *
 * **O que esta conta NÃO faz: dizer quanto cai na conta.** O valor liberado é o
 * cedido menos o desconto que o banco cobra pelo prazo, e nenhuma norma define
 * esse desconto — a Resolução nº 958/2020 só limita a taxa (art. 5º, por
 * remissão). Publicar um "valor que você recebe" exigiria inventar uma
 * convenção financeira e apresentá-la como regra, que é o erro que este produto
 * existe para não cometer. A página entrega os limites e o teto de juros, e diz
 * o que falta.
 *
 * Cada saque cedido vale o próprio saque-aniversário daquele ano, limitado ao
 * máximo por saque. Os saques futuros dependem do saldo futuro, que ninguém
 * conhece: a conta usa o saque de hoje para todos, e declara isso.
 */
export function calcularLimitesDaAntecipacao(
  saque: Centavos,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<LimitesDaAntecipacao> {
  const resolvidos = PARAMETROS_ANTECIPACAO.map((id) => registro.resolver(id, dataReferencia))
  if (resolvidos.some((r) => !r.ok)) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe:
        'Os limites da antecipação valem a partir de 20/10/2025, quando a Resolução CCFGTS nº 1.130/2025 foi publicada — não há parâmetros para a data informada.',
    }
  }
  const [saques, minimo, maximo, carencia, juros] = resolvidos.map((r) => (r.ok ? r.resolvida : null))
  if (!saques || !minimo || !maximo || !carencia || !juros) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Parâmetro da antecipação indisponível.' }
  }

  const vInteiro = (v: typeof saques) => (v.vigencia.valor.tipo === 'inteiro' ? v.vigencia.valor.valor : 0)
  const vMoeda = (v: typeof minimo) =>
    centavos(v.vigencia.valor.tipo === 'valor_monetario' ? v.vigencia.valor.centavos : 0)

  const saquesMaximos = vInteiro(saques)
  const minimoPorSaque = vMoeda(minimo)
  const maximoPorSaque = vMoeda(maximo)
  const carenciaDias = vInteiro(carencia)
  const jurosTetoBp = basisPoints(
    juros.vigencia.valor.tipo === 'percentual' ? juros.vigencia.valor.aliquotaBp : 0,
  )

  const atendeMinimo = saque >= minimoPorSaque
  const cedivelPorSaque = saque < maximoPorSaque ? saque : maximoPorSaque
  const totalCedivel = atendeMinimo
    ? multiplicarPorInteiro(cedivelPorSaque, saquesMaximos)
    : centavos(0)

  const etapas: Etapa[] = [
    {
      rotulo: `Saques que podem ser cedidos — ${saquesMaximos}`,
      formula: `um por competência de aniversário, com o anterior quitado`,
      resultado: centavos(saquesMaximos * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(saques),
      justificativa:
        'A regra permanente é de três saques; até 31/10/2026 vale a transição, de cinco. A data da consulta decide qual aparece aqui.',
    },
    {
      rotulo: 'Quanto dá para ceder de cada saque',
      formula: atendeMinimo
        ? `${reais(saque)} do saque-aniversário, limitado a ${reais(maximoPorSaque)}`
        : `${reais(saque)} — abaixo do mínimo de ${reais(minimoPorSaque)}`,
      resultado: atendeMinimo ? cedivelPorSaque : centavos(0),
      parametro: citar(maximo),
      justificativa:
        'Cada saque-aniversário cedido entra entre o mínimo e o máximo da resolução. Os saques futuros dependem do saldo de cada ano, que esta conta não conhece: ela repete o saque de hoje.',
    },
    {
      rotulo: 'Total que pode ser cedido',
      formula: atendeMinimo
        ? `${reais(cedivelPorSaque)} × ${saquesMaximos} saques`
        : 'não há contratação possível com este saldo',
      resultado: totalCedivel,
    },
  ]

  return {
    ok: true,
    valores: {
      saquesMaximos,
      minimoPorSaque,
      maximoPorSaque,
      cedivelPorSaque,
      totalCedivel,
      atendeMinimo,
      carenciaDias,
      jurosTetoBp,
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [saques.vigencia.id, minimo.vigencia.id, maximo.vigencia.id, carencia.vigencia.id, juros.vigencia.id],
    },
  }
}
