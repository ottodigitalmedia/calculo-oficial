/**
 * CALC-066 — Retorno de um sistema de energia solar.
 *
 * O catálogo marcava "Fonte: —, Manutenção: Nula", e a leitura fácil era que
 * bastava código. `ESTADO-DO-PROJETO` §7.40 explicou por que não bastava: o Fio
 * B da Lei nº 14.300/2022 é valor legal, cresce ano a ano, e uma calculadora de
 * retorno que o ignore devolve payback **otimista com aparência de exato**.
 *
 * Agora ele está em `lib/params/`, e a conta pode existir.
 *
 * ## O desenho: o que o usuário sabe, e o que a lei sabe
 *
 * Três números vêm da proposta do instalador ou da fatura, e não da norma —
 * geração, tarifa e o mínimo que se continua pagando. É o precedente de §7.62 e
 * a regra do catálogo §12 para tarifa: preço de quilowatt-hora varia por
 * distribuidora, bandeira e tributo estadual, e estimá-lo daria a um palpite a
 * mesma aparência de solidez que o resto da página tem.
 *
 * Da lei vem uma coisa só, e é a que ninguém sabe responder: o **percentual do
 * Fio B** do ano.
 *
 * ## A bifurcação do art. 26
 *
 * Quem já tinha sistema em 06/01/2022, ou pediu acesso em até doze meses, fica
 * fora do cronograma até 31/12/2045. Não é um valor: é outro caminho da conta.
 * Por isso `regime` é campo, e não parâmetro.
 *
 * ## O que este motor NÃO faz, e a tela declara
 *
 * - **Degradação do painel** — os módulos perdem eficiência ao longo dos anos.
 * - **Reajuste da tarifa** — que puxa o retorno para melhor, e é a variável
 *   mais incerta de todas.
 * - **Manutenção, troca de inversor e seguro.**
 * - **Bandeiras tarifárias.**
 *
 * As duas primeiras puxam em direções OPOSTAS, e é por isso que nenhuma foi
 * estimada: escolher uma só enviesaria o resultado para o lado escolhido. O
 * payback devolvido é o do cenário congelado de hoje, e a página diz isso.
 */

import { aplicarAliquota, minimo, multiplicarPorInteiro, naoNegativo, subtrair } from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_14300_ART_26 } from '../../params/data/fontes'
import { fundamentar } from '../traco'

const POLITICA = 'meio_para_cima' as const

export const PARAMETROS_SOLAR = ['fio-b-percentual'] as const

/**
 * Quem entrou antes da lei tem direito adquirido; quem entrou depois, não.
 * `anterior` é o art. 26; `novo` é o art. 27.
 */
export type RegimeSolar = 'anterior' | 'novo'

export interface EntradaSolar {
  readonly investimento: Centavos
  /** Geração média do sistema, em kWh por mês. Vem da proposta. */
  readonly geracaoMensalKwh: number
  /** Consumo médio da unidade, em kWh por mês. Vem da fatura. */
  readonly consumoMensalKwh: number
  /** Tarifa cheia por kWh, com tributos, como está na fatura. */
  readonly tarifaKwh: Centavos
  /** Componente Fio B por kWh. */
  readonly tarifaFioBKwh: Centavos
  /** O mínimo que se continua pagando por mês, mesmo gerando tudo. */
  readonly custoFixoMensal: Centavos
  readonly regime: RegimeSolar
}

export interface SaidaSolar {
  /** Meses até o investimento se pagar. `null` quando não se paga. */
  readonly paybackMeses: number | null
  readonly economiaMensal: Centavos
  /** Energia que efetivamente substitui compra da distribuidora. */
  readonly compensadaKwh: number
  /** Sobra que vira crédito e não entra na economia deste mês. */
  readonly excedenteKwh: number
  readonly economiaBruta: Centavos
  readonly custoFioBMensal: Centavos
  readonly percentualFioB: BasisPoints
  readonly isentoDeFioB: boolean
}

export function calcularSolar(
  entrada: EntradaSolar,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaSolar> {
  if (
    entrada.investimento < 0 ||
    entrada.tarifaKwh < 0 ||
    entrada.tarifaFioBKwh < 0 ||
    entrada.custoFixoMensal < 0
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Valores não podem ser negativos.' }
  }
  if (
    !Number.isInteger(entrada.geracaoMensalKwh) ||
    !Number.isInteger(entrada.consumoMensalKwh) ||
    entrada.geracaoMensalKwh < 0 ||
    entrada.consumoMensalKwh < 0
  ) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Geração e consumo devem ser inteiros não negativos, em kWh.',
    }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)

  /*
   * O que a geração substitui é limitado pelo CONSUMO.
   *
   * Gerar mais que o consumo não vira dinheiro no mês: vira crédito, que abate
   * consumo futuro e vence em 60 meses. Tratar o excedente como economia
   * imediata infla o retorno — é o erro mais comum das propostas comerciais,
   * porque dimensionar o sistema "com folga" passa a parecer gratuito.
   */
  const compensadaKwh = Math.min(entrada.geracaoMensalKwh, entrada.consumoMensalKwh)
  const excedenteKwh = entrada.geracaoMensalKwh - compensadaKwh

  const economiaBruta = multiplicarPorInteiro(entrada.tarifaKwh, compensadaKwh)
  traco.passo(
    'Energia que deixa de ser comprada',
    `${compensadaKwh} kWh × ${reais(entrada.tarifaKwh)}`,
    economiaBruta,
  )

  if (excedenteKwh > 0) {
    traco.passo(
      'Excedente que vira crédito, não dinheiro',
      `${entrada.geracaoMensalKwh} kWh gerados − ${entrada.consumoMensalKwh} kWh consumidos`,
      ZERO,
    )
  }

  // --- O Fio B -------------------------------------------------------------
  let percentualFioB: BasisPoints = basisPoints(0)
  let custoFioBMensal: Centavos = ZERO
  const isentoDeFioB = entrada.regime === 'anterior'

  if (isentoDeFioB) {
    traco.passoComFundamento(
      'Fio B não incide',
      'sistema anterior à Lei nº 14.300/2022',
      ZERO,
      fundamentar(LEI_14300_ART_26),
      'O art. 26 afasta a cobrança até 31/12/2045 para quem já tinha o sistema na publicação da lei, ou pediu acesso em até doze meses.',
    )
  } else {
    const fioB = registro.resolver('fio-b-percentual', dataReferencia)
    if (!fioB.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: fioB.detalhe }
    if (fioB.resolvida.vigencia.valor.tipo !== 'percentual') {
      return { ok: false, motivo: 'entrada_invalida', detalhe: 'Percentual do Fio B inválido.' }
    }

    percentualFioB = basisPoints(fioB.resolvida.vigencia.valor.aliquotaBp)
    const fioBCheio = multiplicarPorInteiro(entrada.tarifaFioBKwh, compensadaKwh)
    custoFioBMensal = aplicarAliquota(fioBCheio, percentualFioB, POLITICA)

    traco.passoComParametro(
      'Fio B sobre a energia compensada',
      `${compensadaKwh} kWh × ${reais(entrada.tarifaFioBKwh)} × ${percentual(percentualFioB)}`,
      custoFioBMensal,
      fioB.resolvida,
      'O percentual cresce a cada ano de 2023 a 2028. Quem conecta depois paga mais, e o retorno piora.',
    )
  }

  // --- A economia que sobra -------------------------------------------------
  const economiaMensal = naoNegativo(
    subtrair(economiaBruta, custoFioBMensal),
  )
  traco.passo(
    'Economia mensal',
    custoFioBMensal > 0
      ? `${reais(economiaBruta)} − ${reais(custoFioBMensal)}`
      : reais(economiaBruta),
    economiaMensal,
  )

  /*
   * O custo fixo NÃO entra na economia — ele já era pago antes.
   *
   * A taxa mínima existe com ou sem painel; ela limita quanto a fatura pode
   * cair, mas não é despesa nova causada pelo sistema. Descontá-la da economia
   * contaria duas vezes. O que ela faz é impedir a fatura de chegar a zero, e a
   * tela diz isso.
   */
  const economiaEfetiva = minimo(
    economiaMensal,
    naoNegativo(
      subtrair(
        multiplicarPorInteiro(entrada.tarifaKwh, entrada.consumoMensalKwh),
        entrada.custoFixoMensal,
      ),
    ),
  )
  if (economiaEfetiva < economiaMensal) {
    traco.passo(
      'Limitada pelo mínimo da fatura',
      `a conta não desce abaixo de ${reais(entrada.custoFixoMensal)}`,
      economiaEfetiva,
    )
  }

  const paybackMeses =
    economiaEfetiva > 0 ? Math.ceil(entrada.investimento / economiaEfetiva) : null

  traco.passo(
    paybackMeses === null ? 'Sem retorno' : 'Meses para o investimento se pagar',
    paybackMeses === null
      ? 'a economia mensal é zero'
      : `${reais(entrada.investimento)} ÷ ${reais(economiaEfetiva)}`,
    centavos(paybackMeses ?? 0),
  )

  return {
    ok: true,
    valores: {
      paybackMeses,
      economiaMensal: economiaEfetiva,
      compensadaKwh,
      excedenteKwh,
      economiaBruta,
      custoFioBMensal,
      percentualFioB,
      isentoDeFioB,
    },
    traco: traco.construir(),
  }
}
