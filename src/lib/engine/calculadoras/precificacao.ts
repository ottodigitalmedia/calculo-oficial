/**
 * CALC-049 — Precificação de hora: freelancer e autônomo.
 *
 * **A armadilha desta calculadora é de produto, e `docs/18` §3.6 já a nomeava:**
 * "o risco é a calculadora parecer prescritiva". Ela não diz quanto alguém vale
 * nem quanto o mercado paga — faz uma conta de cobertura: dado o que a pessoa
 * quer receber, o que o negócio custa e quantas horas ela de fato consegue
 * faturar, qual preço de hora fecha essa conta. O mercado pode não pagar esse
 * preço, e a nota de tela diz isso.
 *
 * **A grandeza que separa esta conta da conta ingênua é a hora faturável.** A
 * divisão que quase todo mundo faz — renda desejada dividida pelas horas de
 * trabalho — ignora que prospecção, orçamento, retrabalho, administração e
 * intervalo entre projetos ocupam parte do expediente e não são faturados. Com
 * 100% de horas faturáveis a conta desta calculadora vira a ingênua, e é por
 * isso que o percentual é campo obrigatório e não uma premissa escondida.
 *
 * **O imposto entra por dentro, e é aí que a conta ingênua erra de novo.**
 * Faturar mil e pagar 6% não deixa 940 líquidos de custo: para sobrar mil é
 * preciso faturar mil dividido por 0,94. A distinção é a mesma de qualquer
 * tributo por dentro, e a memória de cálculo a exibe.
 *
 * Sem parâmetro legal: a alíquota é digitada. As faixas do Simples dependem de
 * anexo e de receita bruta acumulada, e isso é `docs/18` D-3 — pesquisa que este
 * módulo não faz e não finge fazer.
 */

import { aplicarAliquota, multiplicarPorInteiro, proporcao, somar, subtrair } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

const MESES_NO_ANO = 12

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/** 100% em basis points. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
const BP_INTEIRO = 10_000

const POLITICA = 'meio_para_cima' as const

/** Formata centésimos como "1.234,56", só para compor `formula`. */
function numero(valor: Centavos): string {
  const abs = Math.abs(valor)
  const inteiro = Math.trunc(abs / CENTESIMOS_POR_UNIDADE)
  const frac = abs % CENTESIMOS_POR_UNIDADE
  const comSeparador = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${valor < 0 ? '−' : ''}${comSeparador},${String(frac).padStart(2, '0')}`
}

export interface EntradaPrecificacao {
  readonly rendaDesejadaMensal: Centavos
  readonly custosFixosMensais: Centavos
  readonly diasTrabalhadosNoMes: number
  /** Horas de expediente por dia, em centésimos: 8 h é `800`. */
  readonly horasPorDia: number
  /** Fatia do expediente que vira hora faturada. 60,00% é `6000`. */
  readonly percentualFaturavelBp: BasisPoints
  /** Alíquota sobre o faturamento — Simples, ISS, o que for. */
  readonly aliquotaSobreFaturamentoBp: BasisPoints
}

export interface SaidaPrecificacao {
  readonly horasNoMes: Centavos
  readonly horasFaturaveis: Centavos
  readonly precisaCobrirNoMes: Centavos
  readonly impostos: Centavos
  readonly faturamentoNecessario: Centavos
  readonly valorHora: Centavos
  readonly valorDia: Centavos
  readonly faturamentoAnual: Centavos
  /** O preço que a divisão ingênua produziria, para comparação. */
  readonly valorHoraIngenuo: Centavos
}

export function calcularPrecificacao(
  entrada: EntradaPrecificacao,
  dataReferencia: DataISO,
): Resultado<SaidaPrecificacao> {
  if (entrada.rendaDesejadaMensal <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quanto você quer receber por mês para ver o resultado.',
    }
  }
  if (entrada.diasTrabalhadosNoMes <= 0 || entrada.horasPorDia <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe os dias e as horas de trabalho para ver o resultado.',
    }
  }
  if (entrada.percentualFaturavelBp <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe qual fatia do expediente você consegue faturar para ver o resultado.',
    }
  }
  if (entrada.percentualFaturavelBp > BP_INTEIRO) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Não é possível faturar mais que 100% do expediente.',
    }
  }
  if (entrada.aliquotaSobreFaturamentoBp < 0 || entrada.aliquotaSobreFaturamentoBp >= BP_INTEIRO) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A alíquota sobre o faturamento precisa ficar entre 0% e 100%.',
    }
  }
  if (entrada.custosFixosMensais < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Os custos fixos não podem ser negativos.',
    }
  }

  const etapas: Etapa[] = []

  // --- As horas ---
  const horasNoMes = centavos(entrada.horasPorDia * entrada.diasTrabalhadosNoMes)
  etapas.push({
    rotulo: 'Horas de expediente no mês',
    formula: `${numero(centavos(entrada.horasPorDia))} h por dia × ${entrada.diasTrabalhadosNoMes} dias`,
    resultado: horasNoMes,
    unidade: 'numero',
  })

  const horasFaturaveis = aplicarAliquota(horasNoMes, entrada.percentualFaturavelBp, POLITICA)
  etapas.push({
    rotulo: 'Dessas, as que viram hora faturada',
    formula: `${numero(horasNoMes)} h × ${percentual(entrada.percentualFaturavelBp)}`,
    resultado: horasFaturaveis,
    unidade: 'numero',
    justificativa:
      'Prospectar, orçar, refazer, emitir nota e administrar ocupam expediente e não são ' +
      'faturados a ninguém. É essa distinção que separa esta conta da divisão ingênua — e é ' +
      'onde a precificação de quem trabalha por conta própria costuma errar para baixo.',
  })

  // --- O que precisa entrar ---
  const precisaCobrirNoMes = somar(entrada.rendaDesejadaMensal, entrada.custosFixosMensais)
  etapas.push({
    rotulo: 'O que precisa sobrar depois dos impostos',
    formula:
      `${reais(entrada.rendaDesejadaMensal)} de renda + ` +
      `${reais(entrada.custosFixosMensais)} de custos fixos`,
    resultado: precisaCobrirNoMes,
  })

  /**
   * O imposto é **por dentro**: faturar mil e pagar 6% não deixa mil menos 6%
   * de sobra útil — para sobrar mil é preciso faturar mil dividido por 0,94.
   *
   * A divisão é feita como proporção sobre o denominador do basis point, em
   * inteiros, como o resto do sistema.
   */
  const faturamentoNecessario =
    entrada.aliquotaSobreFaturamentoBp === 0
      ? precisaCobrirNoMes
      : proporcao(
          precisaCobrirNoMes,
          BP_INTEIRO,
          BP_INTEIRO - entrada.aliquotaSobreFaturamentoBp,
          POLITICA,
        )

  const impostos = subtrair(faturamentoNecessario, precisaCobrirNoMes)

  if (entrada.aliquotaSobreFaturamentoBp > 0) {
    etapas.push({
      rotulo: 'Faturamento necessário, com o imposto por dentro',
      formula:
        `${reais(precisaCobrirNoMes)} ÷ (100% − ${percentual(entrada.aliquotaSobreFaturamentoBp)})`,
      resultado: faturamentoNecessario,
      justificativa:
        'O imposto incide sobre o que entra, não sobre o que sobra. Acrescentar a alíquota por ' +
        'fora deixaria a conta curta: para sobrar o valor da linha acima é preciso faturar mais ' +
        `que ele, e a diferença é de ${reais(impostos)}.`,
    })
  }

  // --- O preço ---
  const valorHora = proporcao(
    faturamentoNecessario,
    CENTESIMOS_POR_UNIDADE,
    horasFaturaveis,
    POLITICA,
  )

  etapas.push({
    rotulo: 'Preço da hora que fecha a conta',
    formula: `${reais(faturamentoNecessario)} ÷ ${numero(horasFaturaveis)} h faturáveis`,
    resultado: valorHora,
  })

  const valorHoraIngenuo = proporcao(
    entrada.rendaDesejadaMensal,
    CENTESIMOS_POR_UNIDADE,
    horasNoMes,
    POLITICA,
  )

  etapas.push({
    rotulo: 'O que a divisão ingênua daria',
    formula: `${reais(entrada.rendaDesejadaMensal)} ÷ ${numero(horasNoMes)} h de expediente`,
    resultado: valorHoraIngenuo,
    justificativa:
      'Renda desejada dividida pelas horas trabalhadas, sem custos, sem imposto e supondo que ' +
      'todo minuto é faturado. Está aqui para comparação: a distância entre as duas linhas é o ' +
      'tamanho do que costuma ficar de fora.',
  })

  const valorDia = proporcao(valorHora, entrada.horasPorDia, CENTESIMOS_POR_UNIDADE, POLITICA)
  const faturamentoAnual = multiplicarPorInteiro(faturamentoNecessario, MESES_NO_ANO)

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      horasNoMes,
      horasFaturaveis,
      precisaCobrirNoMes,
      impostos,
      faturamentoNecessario,
      valorHora,
      valorDia,
      faturamentoAnual,
      valorHoraIngenuo,
    },
    traco,
  }
}
