/**
 * CALC-093 — Imposto sobre ganhos em bolsa, mês a mês.
 *
 * **O erro que a página existe para impedir.** A isenção de renda variável é do
 * VALOR VENDIDO no mês, não do lucro: quem vendeu acima do limite paga imposto
 * sobre o ganho inteiro, mesmo que o lucro tenha sido pequeno; quem vendeu
 * abaixo dele não paga nada, mesmo com lucro alto. Quase toda conta feita de
 * cabeça troca uma coisa pela outra.
 *
 * **Três separações que a lei impõe e a conta precisa respeitar:**
 *
 * 1. **Day trade é um bolso à parte.** Alíquota maior e perdas que só compensam
 *    ganhos da mesma espécie (Lei nº 9.959/2000, art. 8º, § 6º).
 * 2. **A isenção não alcança o day trade** nem os mercados de opções, futuros e
 *    termo — o art. 3º, I, fala do mercado à vista de ações e do ouro ativo
 *    financeiro.
 * 3. **A retenção na fonte não é o imposto.** Ela é antecipação, e sai do valor
 *    a pagar no DARF.
 *
 * O mês isento com prejuízo continua acumulando perda: a publicação de
 * perguntas e respostas da Receita dispensa o demonstrativo nas operações
 * isentas "exceto no caso de pretender compensar as perdas apuradas com ganhos
 * auferidos em operações realizadas em bolsa sujeitas à incidência do imposto".
 */

import { aplicarAliquota, minimo, naoNegativo, proporcao, somar, subtrair } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_9959_ART_8 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

type Resolvido<T> = { readonly valor: T; readonly resolvida: VigenciaResolvida } | null

function percentualDe(registro: Registro, id: string, data: DataISO): Resolvido<BasisPoints> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: basisPoints(r.resolvida.vigencia.valor.aliquotaBp), resolvida: r.resolvida }
}

function monetarioDe(registro: Registro, id: string, data: DataISO): Resolvido<Centavos> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'valor_monetario') return null
  return { valor: centavos(r.resolvida.vigencia.valor.centavos), resolvida: r.resolvida }
}

type Fracao = { readonly numerador: number; readonly denominador: number }

function fracaoDe(registro: Registro, id: string, data: DataISO): Resolvido<Fracao> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'fracao') return null
  const v = r.resolvida.vigencia.valor
  return { valor: { numerador: v.numerador, denominador: v.denominador }, resolvida: r.resolvida }
}

export interface EntradaBolsa {
  /** Total vendido no mês no mercado à vista de ações — o que decide a isenção. */
  readonly vendasComuns: Centavos
  /** Resultado das operações comuns no mês. Pode ser negativo. */
  readonly resultadoComum: Centavos
  /** Prejuízo de meses anteriores em operações comuns, sempre positivo. */
  readonly prejuizoAcumuladoComum: Centavos
  /** Resultado das operações de day trade no mês. Pode ser negativo. */
  readonly resultadoDayTrade: Centavos
  readonly prejuizoAcumuladoDayTrade: Centavos
  /** Retenção já sofrida no mês. Zero pede a estimativa pelas regras da lei. */
  readonly irrfRetidoInformado: Centavos
}

export interface SaidaBolsa {
  readonly darf: Centavos
  readonly impostoTotal: Centavos
  readonly impostoComum: Centavos
  readonly impostoDayTrade: Centavos
  readonly baseComum: Centavos
  readonly baseDayTrade: Centavos
  readonly isentoNoMes: boolean
  readonly irrfDeduzido: Centavos
  readonly irrfEstimado: boolean
  readonly prejuizoAProximoComum: Centavos
  readonly prejuizoAProximoDayTrade: Centavos
  readonly limiteIsencao: Centavos
  /** Verdadeiro quando o imposto existe mas fica abaixo do piso do DARF. */
  readonly acumulaParaOProximoMes: boolean
}

export function calcularIrBolsa(
  entrada: EntradaBolsa,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaBolsa> {
  if (entrada.vendasComuns < 0 || entrada.prejuizoAcumuladoComum < 0 || entrada.prejuizoAcumuladoDayTrade < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Vendas e prejuízos acumulados não podem ser negativos.' }
  }
  if (entrada.irrfRetidoInformado < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A retenção na fonte não pode ser negativa.' }
  }
  if (entrada.resultadoComum === 0 && entrada.resultadoDayTrade === 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o resultado do mês em operações comuns, em day trade, ou nos dois.',
    }
  }
  if (entrada.resultadoComum > 0 && entrada.vendasComuns < entrada.resultadoComum) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O total vendido no mês não pode ser menor que o lucro apurado nessas vendas.',
    }
  }

  const aliquotaComum = percentualDe(registro, 'bolsa-aliquota-comum', dataReferencia)
  const aliquotaDayTrade = percentualDe(registro, 'bolsa-aliquota-day-trade', dataReferencia)
  const limite = monetarioDe(registro, 'bolsa-isencao-vendas-mes', dataReferencia)
  const fonteComum = fracaoDe(registro, 'bolsa-irrf-comum', dataReferencia)
  const fonteDayTrade = percentualDe(registro, 'bolsa-irrf-day-trade', dataReferencia)
  const minimoDarf = monetarioDe(registro, 'darf-valor-minimo', dataReferencia)
  const dispensaRetencao = monetarioDe(registro, 'bolsa-irrf-dispensa', dataReferencia)
  if (
    aliquotaComum === null ||
    aliquotaDayTrade === null ||
    limite === null ||
    fonteComum === null ||
    fonteDayTrade === null ||
    minimoDarf === null ||
    dispensaRetencao === null
  ) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há regras de tributação em bolsa para a data informada.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([
    aliquotaComum.resolvida.vigencia.id,
    aliquotaDayTrade.resolvida.vigencia.id,
    limite.resolvida.vigencia.id,
    minimoDarf.resolvida.vigencia.id,
  ])

  // -------------------------------------------------------------------------
  // Operações comuns — a isenção decide antes de tudo
  // -------------------------------------------------------------------------
  const isentoNoMes = entrada.vendasComuns <= limite.valor
  const ganhoComum = naoNegativo(entrada.resultadoComum)
  const perdaComumDoMes = naoNegativo(subtrair(ZERO, entrada.resultadoComum))

  etapas.push({
    rotulo: isentoNoMes ? 'Vendas do mês dentro da isenção' : 'Vendas do mês acima da isenção',
    formula: `${reais(entrada.vendasComuns)} ${isentoNoMes ? '≤' : '>'} ${reais(limite.valor)} vendidos no mês`,
    resultado: limite.valor,
    parametro: citar(limite.resolvida),
    justificativa: isentoNoMes
      ? 'A isenção olha o valor VENDIDO no mês, não o lucro: dentro do limite, o ganho das operações comuns não é tributado. O limite não alcança day trade nem os mercados de opções, futuros e termo.'
      : 'Passando do limite, o imposto incide sobre o ganho inteiro do mês — e não apenas sobre o que excedeu o limite.',
  })

  let baseComum: Centavos = ZERO
  let impostoComum: Centavos = ZERO
  let prejuizoComumRestante = entrada.prejuizoAcumuladoComum

  if (!isentoNoMes && ganhoComum > 0) {
    const compensado = minimo(entrada.prejuizoAcumuladoComum, ganhoComum)
    prejuizoComumRestante = subtrair(entrada.prejuizoAcumuladoComum, compensado)
    baseComum = subtrair(ganhoComum, compensado)

    if (compensado > 0) {
      etapas.push({
        rotulo: 'Compensação do prejuízo acumulado — operações comuns',
        formula: `${reais(ganhoComum)} − ${reais(compensado)} de prejuízo de meses anteriores`,
        resultado: baseComum,
        justificativa:
          'A perda de meses anteriores compensa o ganho dos meses seguintes, até acabar. Perda de um mês não volta para compensar ganho de mês já encerrado.',
      })
    }

    impostoComum = aplicarAliquota(baseComum, aliquotaComum.valor, POLITICA)
    etapas.push({
      rotulo: `Imposto das operações comuns — ${percentual(aliquotaComum.valor)}`,
      formula: `${reais(baseComum)} × ${percentual(aliquotaComum.valor)}`,
      resultado: impostoComum,
      parametro: citar(aliquotaComum.resolvida),
    })
  } else if (isentoNoMes && ganhoComum > 0) {
    etapas.push({
      rotulo: 'Ganho das operações comuns — isento',
      formula: `${reais(ganhoComum)} de ganho, sem imposto`,
      resultado: ZERO,
      parametro: citar(limite.resolvida),
    })
  }

  // -------------------------------------------------------------------------
  // Day trade — bolso separado
  // -------------------------------------------------------------------------
  const ganhoDayTrade = naoNegativo(entrada.resultadoDayTrade)
  const perdaDayTradeDoMes = naoNegativo(subtrair(ZERO, entrada.resultadoDayTrade))
  let baseDayTrade: Centavos = ZERO
  let impostoDayTrade: Centavos = ZERO
  let prejuizoDayTradeRestante = entrada.prejuizoAcumuladoDayTrade

  if (ganhoDayTrade > 0) {
    const compensado = minimo(entrada.prejuizoAcumuladoDayTrade, ganhoDayTrade)
    prejuizoDayTradeRestante = subtrair(entrada.prejuizoAcumuladoDayTrade, compensado)
    baseDayTrade = subtrair(ganhoDayTrade, compensado)

    etapas.push({
      rotulo: 'Day trade — apuração separada',
      formula:
        compensado > 0
          ? `${reais(ganhoDayTrade)} − ${reais(compensado)} de prejuízo de day trade`
          : `${reais(ganhoDayTrade)} de ganho no mês`,
      resultado: baseDayTrade,
      fundamento: fundamentar(LEI_9959_ART_8),
      justificativa:
        'As perdas em day trade só compensam ganhos de day trade. Misturar os dois bolsos é o erro que mais aparece em planilha feita à mão.',
    })

    impostoDayTrade = aplicarAliquota(baseDayTrade, aliquotaDayTrade.valor, POLITICA)
    etapas.push({
      rotulo: `Imposto do day trade — ${percentual(aliquotaDayTrade.valor)}`,
      formula: `${reais(baseDayTrade)} × ${percentual(aliquotaDayTrade.valor)}`,
      resultado: impostoDayTrade,
      parametro: citar(aliquotaDayTrade.resolvida),
    })
  }

  const impostoTotal = somar(impostoComum, impostoDayTrade)

  // -------------------------------------------------------------------------
  // Retenção na fonte — antecipação, não imposto
  // -------------------------------------------------------------------------
  const irrfEstimado = entrada.irrfRetidoInformado <= 0
  let irrfDeduzido = entrada.irrfRetidoInformado

  if (irrfEstimado) {
    const retidoComum = isentoNoMes
      ? ZERO
      : proporcao(entrada.vendasComuns, fonteComum.valor.numerador, fonteComum.valor.denominador, POLITICA)
    const retidoDayTrade = aplicarAliquota(ganhoDayTrade, fonteDayTrade.valor, POLITICA)
    const somaRetida = somar(retidoComum, retidoDayTrade)
    /**
     * Art. 2º, § 4º: retenção de até R$ 1,00 no mês é dispensada — e o § 5º
     * manda somar as operações do mês antes de aplicar o limite. Sem isto, a
     * estimativa descontaria um imposto que a corretora não reteve.
     */
    const dispensada = somaRetida > 0 && somaRetida <= dispensaRetencao.valor
    irrfDeduzido = dispensada ? ZERO : somaRetida
    if (dispensada) {
      vigencias.add(dispensaRetencao.resolvida.vigencia.id)
      etapas.push({
        rotulo: 'Retenção na fonte dispensada no mês',
        formula: `${reais(somaRetida)} ≤ ${reais(dispensaRetencao.valor)}`,
        resultado: ZERO,
        parametro: citar(dispensaRetencao.resolvida),
        justificativa:
          'Somadas as operações do mês, a retenção ficou dentro do limite de dispensa — nada é retido, e nada há a deduzir do imposto.',
      })
    }
    if (retidoComum > 0) vigencias.add(fonteComum.resolvida.vigencia.id)
    if (retidoDayTrade > 0) vigencias.add(fonteDayTrade.resolvida.vigencia.id)

    if (irrfDeduzido > 0) {
      etapas.push({
        rotulo: 'Retenção na fonte estimada',
        formula: [
          retidoComum > 0
            ? `${reais(entrada.vendasComuns)} × ${fonteComum.valor.numerador}/${fonteComum.valor.denominador.toLocaleString('pt-BR')} = ${reais(retidoComum)}`
            : '',
          retidoDayTrade > 0
            ? `${reais(ganhoDayTrade)} × ${percentual(fonteDayTrade.valor)} = ${reais(retidoDayTrade)}`
            : '',
        ]
          .filter((p) => p !== '')
          .join(' · '),
        resultado: irrfDeduzido,
        parametro: citar(retidoComum > 0 ? fonteComum.resolvida : fonteDayTrade.resolvida),
        justificativa:
          'A retenção da operação comum é o "dedo-duro": existe para a Receita saber que houve operação, e é deduzida do imposto do mês. O valor real está na nota de corretagem.',
      })
    }
  } else {
    etapas.push({
      rotulo: 'Retenção na fonte informada',
      formula: `${reais(irrfDeduzido)} já retidos no mês`,
      resultado: irrfDeduzido,
    })
  }

  const darfBruto = naoNegativo(subtrair(impostoTotal, irrfDeduzido))
  const acumulaParaOProximoMes = darfBruto > 0 && darfBruto < minimoDarf.valor
  const darf = acumulaParaOProximoMes ? ZERO : darfBruto

  etapas.push({
    rotulo: 'Imposto a pagar no mês',
    formula: `${reais(impostoTotal)} − ${reais(irrfDeduzido)} retidos`,
    resultado: darfBruto,
  })

  if (acumulaParaOProximoMes) {
    etapas.push({
      rotulo: 'Abaixo do valor mínimo do DARF',
      formula: `${reais(darfBruto)} < ${reais(minimoDarf.valor)}`,
      resultado: ZERO,
      parametro: citar(minimoDarf.resolvida),
      justificativa:
        'O imposto não desaparece: ele é somado ao dos meses seguintes, no mesmo código de receita, até alcançar o mínimo.',
    })
  }

  // -------------------------------------------------------------------------
  // O que sobra para os próximos meses
  // -------------------------------------------------------------------------
  const prejuizoAProximoComum = somar(prejuizoComumRestante, perdaComumDoMes)
  const prejuizoAProximoDayTrade = somar(prejuizoDayTradeRestante, perdaDayTradeDoMes)

  if (prejuizoAProximoComum > 0 || prejuizoAProximoDayTrade > 0) {
    etapas.push({
      rotulo: 'Prejuízo a transportar para os próximos meses',
      formula: `${reais(prejuizoAProximoComum)} em operações comuns · ${reais(prejuizoAProximoDayTrade)} em day trade`,
      resultado: somar(prejuizoAProximoComum, prejuizoAProximoDayTrade),
      justificativa:
        'Cada bolso guarda o seu prejuízo. Para usá-lo depois, ele precisa estar declarado no demonstrativo de renda variável do mês em que ocorreu.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: {
      darf,
      impostoTotal,
      impostoComum,
      impostoDayTrade,
      baseComum,
      baseDayTrade,
      isentoNoMes,
      irrfDeduzido,
      irrfEstimado,
      prejuizoAProximoComum,
      prejuizoAProximoDayTrade,
      limiteIsencao: limite.valor,
      acumulaParaOProximoMes,
    },
    traco,
  }
}
