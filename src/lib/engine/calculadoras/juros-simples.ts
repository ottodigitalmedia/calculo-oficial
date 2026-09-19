/**
 * CALC-119 — Juros simples.
 *
 * `J = C × i × n`: o juro de cada período incide sempre sobre o capital
 * inicial. Sem parâmetro legal — a taxa é digitada —, e por isso sem vigência
 * a auditar, como CALC-022.
 *
 * AS UNIDADES — O ÚNICO LUGAR ONDE DÁ PARA ERRAR
 *
 * Taxa e prazo podem vir em unidades diferentes: 2% ao mês por 90 dias, 12% ao
 * ano por 6 meses. No regime simples a conversão é PROPORCIONAL — 12% ao ano
 * são 1% ao mês —, e é exatamente isso que o distingue do composto, onde a
 * conversão é por potência (CALC-022). O motor não converte a taxa: converte o
 * PRAZO em dias e divide pelos dias do período da taxa, no calendário
 * comercial de mês de trinta dias e ano de trezentos e sessenta. A convenção
 * é declarada no traço e na tela, porque quem usa o ano civil de 365 dias
 * chega a outro número.
 *
 * A CONTA É INTEIRA DO COMEÇO AO FIM
 *
 * `capital × taxa em bp × prazo em dias ÷ (10.000 × dias do período)`, em
 * `bigint`, com um único arredondamento no final. O produto passa do inteiro
 * seguro com facilidade — cem milhões de reais a 10% ao dia por cem anos —, e
 * `bigint` é o que deixa isso exato sem ponto flutuante sobre dinheiro.
 *
 * A COMPARAÇÃO COM O COMPOSTO
 *
 * Quando o prazo é de meses inteiros e a taxa é mensal ou anual, a página mostra
 * lado a lado o que o mesmo capital daria em juros compostos — calculado pelo
 * motor de CALC-022, para que exista uma só verdade sobre essa conta. Abaixo de
 * um período da taxa, o simples dá MAIS que o composto; acima, menos. É a
 * informação que a comparação existe para mostrar.
 */

import { calcularJurosCompostos } from './juros-compostos'
import { somar } from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

export type PeriodoDaTaxa = 'dia' | 'mes' | 'ano'
export type UnidadeDoPrazo = 'dias' | 'meses' | 'anos'

/** Calendário comercial: convenção de mercado, não parâmetro legal. */
const DIAS_NO_MES_COMERCIAL = 30
// eslint-disable-next-line no-restricted-syntax -- convenção do calendário comercial, não parâmetro legal
const DIAS_NO_ANO_COMERCIAL = 360

/** 100% em basis points. Definição de unidade (`ADR-004` A-2), não constante legal. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (BV-10)
const BP_POR_INTEIRO = 10_000n

/** Limite de tela: cem anos comerciais de prazo. */
// eslint-disable-next-line no-restricted-syntax -- limite de interface, não parâmetro legal
export const PRAZO_MAXIMO_EM_DIAS = 36_000

const DIAS_DO_PERIODO: Readonly<Record<PeriodoDaTaxa, number>> = {
  dia: 1,
  mes: DIAS_NO_MES_COMERCIAL,
  ano: DIAS_NO_ANO_COMERCIAL,
}

const DIAS_DA_UNIDADE: Readonly<Record<UnidadeDoPrazo, number>> = {
  dias: 1,
  meses: DIAS_NO_MES_COMERCIAL,
  anos: DIAS_NO_ANO_COMERCIAL,
}

const NOME_DO_PERIODO: Readonly<Record<PeriodoDaTaxa, string>> = {
  dia: 'ao dia',
  mes: 'ao mês',
  ano: 'ao ano',
}

const NOME_DA_UNIDADE: Readonly<Record<UnidadeDoPrazo, [string, string]>> = {
  dias: ['dia', 'dias'],
  meses: ['mês', 'meses'],
  anos: ['ano', 'anos'],
}

export interface EntradaJurosSimples {
  readonly capital: Centavos
  /** Taxa em basis points. 1,5% é `150`. */
  readonly taxa: BasisPoints
  readonly periodoDaTaxa: PeriodoDaTaxa
  readonly prazo: number
  readonly unidadeDoPrazo: UnidadeDoPrazo
}

export interface ComparacaoComposta {
  readonly montante: Centavos
  readonly juros: Centavos
}

export interface SaidaJurosSimples {
  readonly juros: Centavos
  readonly montante: Centavos
  readonly prazoEmDias: number
  /** Taxa acumulada no prazo inteiro (`i × n`), em basis points arredondados, para exibição. */
  readonly taxaNoPrazoBp: BasisPoints
  /** Presente quando o prazo é de meses inteiros e a taxa é mensal ou anual. */
  readonly composto: ComparacaoComposta | null
}

/** Divide com arredondamento meio-para-cima, em magnitude — só entra valor não negativo. */
function dividirArredondando(numerador: bigint, denominador: bigint): bigint {
  const q = numerador / denominador
  const r = numerador % denominador
  return 2n * r >= denominador ? q + 1n : q
}

function descreverPrazo(prazo: number, unidade: UnidadeDoPrazo): string {
  const [um, varios] = NOME_DA_UNIDADE[unidade]
  return `${prazo} ${prazo === 1 ? um : varios}`
}

export function calcularJurosSimples(
  entrada: EntradaJurosSimples,
  dataReferencia: DataISO,
): Resultado<SaidaJurosSimples> {
  if (entrada.capital <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o capital para ver o resultado.' }
  }
  if (entrada.taxa <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a taxa de juros para ver o resultado.' }
  }
  if (!Number.isInteger(entrada.prazo) || entrada.prazo < 1) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o prazo, em número inteiro, para ver o resultado.' }
  }

  const prazoEmDias = entrada.prazo * DIAS_DA_UNIDADE[entrada.unidadeDoPrazo]
  if (prazoEmDias > PRAZO_MAXIMO_EM_DIAS) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O prazo pode ter no máximo cem anos.' }
  }
  const diasDoPeriodo = DIAS_DO_PERIODO[entrada.periodoDaTaxa]

  const numerador = BigInt(entrada.capital) * BigInt(entrada.taxa) * BigInt(prazoEmDias)
  const denominador = BP_POR_INTEIRO * BigInt(diasDoPeriodo)
  const juros = centavos(Number(dividirArredondando(numerador, denominador)))
  const montante = somar(entrada.capital, juros)
  const taxaNoPrazoBp = basisPoints(
    Number(dividirArredondando(BigInt(entrada.taxa) * BigInt(prazoEmDias), BigInt(diasDoPeriodo))),
  )

  const traco = new ConstrutorDeTraco(dataReferencia)
  traco.passo('Capital', reais(entrada.capital), entrada.capital)

  const periodos =
    prazoEmDias % diasDoPeriodo === 0
      ? `${prazoEmDias / diasDoPeriodo}`
      : `${prazoEmDias}/${diasDoPeriodo}`
  const mesmaUnidade = DIAS_DA_UNIDADE[entrada.unidadeDoPrazo] === diasDoPeriodo
  traco.passo(
    'Prazo na unidade da taxa',
    mesmaUnidade
      ? `${descreverPrazo(entrada.prazo, entrada.unidadeDoPrazo)}: ${periodos} períodos da taxa`
      : `${descreverPrazo(entrada.prazo, entrada.unidadeDoPrazo)} = ${prazoEmDias} dias comerciais; ÷ ${diasDoPeriodo} = ${periodos} períodos da taxa (mês de ${DIAS_NO_MES_COMERCIAL} e ano de ${DIAS_NO_ANO_COMERCIAL} dias)`,
    ZERO,
  )
  traco.passo(
    'Taxa no prazo inteiro',
    `${percentual(entrada.taxa)} ${NOME_DO_PERIODO[entrada.periodoDaTaxa]} × ${periodos} = ${percentual(taxaNoPrazoBp)}, proporcional`,
    ZERO,
  )
  traco.passo(
    'Juros',
    `${reais(entrada.capital)} × ${percentual(entrada.taxa)} × ${periodos} — sempre sobre o capital inicial`,
    juros,
  )
  traco.passo('Montante', `${reais(entrada.capital)} + ${reais(juros)}`, montante)

  /**
   * O composto só é comparável quando o prazo cabe em meses inteiros e a taxa
   * tem conversão mensal no motor de CALC-022 — taxa ao dia fica de fora.
   */
  let composto: ComparacaoComposta | null = null
  const meses = prazoEmDias / DIAS_NO_MES_COMERCIAL
  if (entrada.periodoDaTaxa !== 'dia' && entrada.unidadeDoPrazo !== 'dias' && Number.isInteger(meses)) {
    const c = calcularJurosCompostos(
      {
        valorInicial: entrada.capital,
        aporteMensal: ZERO,
        taxa: entrada.taxa,
        taxaAoAno: entrada.periodoDaTaxa === 'ano',
        meses,
      },
      dataReferencia,
    )
    if (c.ok) {
      composto = { montante: c.valores.montante, juros: c.valores.totalJuros }
      traco.passo(
        'Em juros compostos, para comparar',
        `o mesmo capital, a mesma taxa e ${meses} ${meses === 1 ? 'mês' : 'meses'}, com capitalização mensal`,
        c.valores.montante,
      )
    }
  }

  return {
    ok: true,
    valores: { juros, montante, prazoEmDias, taxaNoPrazoBp, composto },
    traco: traco.construir(),
  }
}
