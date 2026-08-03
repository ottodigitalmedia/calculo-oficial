/**
 * CALC-065 — Consumo de energia por aparelho · CALC-069 — Orçamento 50/30/20.
 *
 * As duas do bloco de consumo doméstico que não dependem de nada: a primeira
 * converte potência e tempo em conta de luz, a segunda divide uma renda por
 * percentuais. Aritmética inteira, como o resto do sistema (`ADR-004`).
 *
 * NENHUMA NORMA, E ISSO ESTÁ DECLARADO NAS DUAS
 *
 * A tarifa de energia varia por concessionária e por bandeira, e `00-catalogo`
 * §12 é explícito: ela é campo do usuário, com instrução de onde achar na
 * fatura, e **não** se estima por região. Já o 50/30/20 é regra de bolso de um
 * livro, não norma — mesmo tratamento dos 30% de CALC-032 e da regra dos 4% de
 * CALC-043: os três percentuais são campos, com padrão declarado.
 */

import { aplicarAliquota, multiplicarPorInteiro, proporcao, somar, subtrair } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

const MESES_NO_ANO = 12

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/** Watts em um quilowatt. Definição de unidade, não constante legal. */
// eslint-disable-next-line no-restricted-syntax -- unidade do SI, não parâmetro legal
const WATTS_POR_QUILOWATT = 1_000

/** 100% em basis points. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
const BP_INTEIRO = 10_000

const POLITICA = 'meio_para_cima' as const

/** Base de mensalização de despesa diária. Convenção declarada, não medição. */
const DIAS_NO_MES_PADRAO = 30

/** Um centésimo de quilo são dez gramas. Definição de unidade. */
const GRAMAS_POR_CENTESIMO_DE_KG = 10

/** Formata centésimos como "1.234,56", só para compor `formula`. */
function numero(valor: Centavos): string {
  const abs = Math.abs(valor)
  const inteiro = Math.trunc(abs / CENTESIMOS_POR_UNIDADE)
  const frac = abs % CENTESIMOS_POR_UNIDADE
  const comSeparador = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${valor < 0 ? '−' : ''}${comSeparador},${String(frac).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// CALC-065 — Consumo de energia por aparelho
// ---------------------------------------------------------------------------

export interface EntradaEnergia {
  /** Potência em watts. */
  readonly potencia: number
  /** Horas de uso por dia, em centésimos: 2,5 h é `250`. */
  readonly horasPorDia: number
  readonly diasPorMes: number
  readonly quantidade: number
  /** Preço do quilowatt-hora, como aparece na fatura. */
  readonly tarifaKwh: Centavos
}

export interface SaidaEnergia {
  /** Consumo mensal em centésimos de kWh. */
  readonly kwhPorMes: Centavos
  readonly kwhPorDia: Centavos
  readonly custoMensal: Centavos
  readonly custoAnual: Centavos
  readonly horasNoMes: Centavos
}

export function calcularEnergia(
  entrada: EntradaEnergia,
  dataReferencia: DataISO,
): Resultado<SaidaEnergia> {
  if (entrada.potencia <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a potência do aparelho para ver o resultado.',
    }
  }
  if (entrada.horasPorDia <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quantas horas por dia o aparelho fica ligado para ver o resultado.',
    }
  }
  if (entrada.tarifaKwh <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a tarifa do quilowatt-hora para ver o resultado.',
    }
  }
  if (entrada.diasPorMes <= 0 || entrada.quantidade <= 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Dias de uso no mês e quantidade de aparelhos precisam ser maiores que zero.',
    }
  }

  const etapas: Etapa[] = []

  const horasNoMes = centavos(entrada.horasPorDia * entrada.diasPorMes * entrada.quantidade)
  etapas.push({
    rotulo: 'Horas de uso no mês',
    formula:
      `${numero(centavos(entrada.horasPorDia))} h por dia × ${entrada.diasPorMes} dias` +
      (entrada.quantidade > 1 ? ` × ${entrada.quantidade} aparelhos` : ''),
    resultado: horasNoMes,
    unidade: 'numero',
  })

  /**
   * Consumo em centésimos de kWh: potência (W) × horas ÷ 1.000.
   *
   * `horasNoMes` já vem em centésimos, e é isso que faz o resultado sair na
   * mesma escala sem multiplicação extra — potência é inteiro puro.
   */
  const kwhPorMes = proporcao(horasNoMes, entrada.potencia, WATTS_POR_QUILOWATT, POLITICA)
  etapas.push({
    rotulo: 'Consumo do mês',
    formula: `${entrada.potencia} W × ${numero(horasNoMes)} h ÷ 1.000`,
    resultado: kwhPorMes,
    unidade: 'numero',
    justificativa:
      'Potência vezes tempo é energia. Dividir por mil converte watt-hora em quilowatt-hora, ' +
      'que é a unidade em que a distribuidora cobra.',
  })

  const custoMensal = proporcao(entrada.tarifaKwh, kwhPorMes, CENTESIMOS_POR_UNIDADE, POLITICA)
  etapas.push({
    rotulo: 'Custo no mês',
    formula: `${numero(kwhPorMes)} kWh × ${reais(entrada.tarifaKwh)} por kWh`,
    resultado: custoMensal,
    justificativa:
      'A tarifa é a da sua fatura, e ela não é a mesma no país inteiro: varia por ' +
      'distribuidora, por bandeira tarifária e pelos tributos do seu estado. Por isso ela é ' +
      'campo, e não um valor que a calculadora escolhe.',
  })

  const custoAnual = multiplicarPorInteiro(custoMensal, MESES_NO_ANO)
  etapas.push({
    rotulo: 'Custo em doze meses',
    formula: `${reais(custoMensal)} × 12`,
    resultado: custoAnual,
  })

  const kwhPorDia = proporcao(kwhPorMes, 1, entrada.diasPorMes, POLITICA)

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: { kwhPorMes, kwhPorDia, custoMensal, custoAnual, horasNoMes },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-069 — Orçamento 50/30/20
// ---------------------------------------------------------------------------

export interface EntradaOrcamento {
  readonly rendaLiquida: Centavos
  readonly percentualNecessidadesBp: BasisPoints
  readonly percentualDesejosBp: BasisPoints
  readonly percentualPoupancaBp: BasisPoints
}

export interface SaidaOrcamento {
  readonly necessidades: Centavos
  readonly desejos: Centavos
  readonly poupanca: Centavos
  /** O que sobra quando os percentuais não somam cem. */
  readonly naoAlocado: Centavos
  readonly somaDosPercentuais: BasisPoints
  readonly poupancaEmDozeMeses: Centavos
}

export function calcularOrcamento(
  entrada: EntradaOrcamento,
  dataReferencia: DataISO,
): Resultado<SaidaOrcamento> {
  if (entrada.rendaLiquida <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a sua renda líquida mensal para ver o resultado.',
    }
  }

  const somaDosPercentuais = basisPoints(
    entrada.percentualNecessidadesBp +
      entrada.percentualDesejosBp +
      entrada.percentualPoupancaBp,
  )

  if (somaDosPercentuais <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe ao menos um percentual para dividir a renda.',
    }
  }
  if (somaDosPercentuais > BP_INTEIRO) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `Os percentuais somam ${percentual(somaDosPercentuais)} — não é possível dividir mais que a renda inteira.`,
    }
  }

  const etapas: Etapa[] = []

  const necessidades = aplicarAliquota(
    entrada.rendaLiquida,
    entrada.percentualNecessidadesBp,
    POLITICA,
  )
  const desejos = aplicarAliquota(entrada.rendaLiquida, entrada.percentualDesejosBp, POLITICA)
  const poupanca = aplicarAliquota(entrada.rendaLiquida, entrada.percentualPoupancaBp, POLITICA)

  etapas.push({
    rotulo: 'Necessidades',
    formula: `${reais(entrada.rendaLiquida)} × ${percentual(entrada.percentualNecessidadesBp)}`,
    resultado: necessidades,
    justificativa:
      'O que não dá para cortar sem mudar de vida: moradia, alimentação, transporte, saúde, ' +
      'contas fixas e a parcela mínima de dívidas existentes.',
  })

  etapas.push({
    rotulo: 'Desejos',
    formula: `${reais(entrada.rendaLiquida)} × ${percentual(entrada.percentualDesejosBp)}`,
    resultado: desejos,
    justificativa:
      'O que melhora a vida e poderia ser suspenso num mês difícil: lazer, assinaturas, ' +
      'restaurante, viagem.',
  })

  etapas.push({
    rotulo: 'Poupança e quitação de dívidas',
    formula: `${reais(entrada.rendaLiquida)} × ${percentual(entrada.percentualPoupancaBp)}`,
    resultado: poupanca,
    justificativa:
      'Reserva, investimento e o que for além do mínimo das dívidas. É a fatia que constrói ' +
      'folga, e a primeira a desaparecer quando as outras duas crescem.',
  })

  /**
   * As três fatias são arredondadas ao centavo, uma a uma, e o que sobra da
   * renda aparece como linha própria.
   *
   * Sem isso, a soma da tela poderia ficar alguns centavos abaixo da renda
   * informada — "cada número certo, a soma errada" (`ESTADO-DO-PROJETO` §7.12).
   * Aqui a diferença é visível e nomeada, em vez de silenciosa.
   */
  const naoAlocado = subtrair(entrada.rendaLiquida, somar(necessidades, desejos, poupanca))

  if (naoAlocado !== 0) {
    etapas.push({
      rotulo: somaDosPercentuais < BP_INTEIRO ? 'Ainda sem destino' : 'Diferença de arredondamento',
      formula: `${reais(entrada.rendaLiquida)} − ${reais(somar(necessidades, desejos, poupanca))}`,
      resultado: naoAlocado,
      justificativa:
        somaDosPercentuais < BP_INTEIRO
          ? `Os percentuais informados somam ${percentual(somaDosPercentuais)}. O que falta para ` +
            'cem por cento é renda sem destino declarado — e renda sem destino declarado tende ' +
            'a virar desejo.'
          : 'Centavos que sobram da divisão dos percentuais. Aparecem como linha para que a ' +
            'coluna feche com a renda informada.',
    })
  }

  const poupancaEmDozeMeses = multiplicarPorInteiro(poupanca, MESES_NO_ANO)
  if (poupanca > 0) {
    etapas.push({
      rotulo: 'O que a fatia de poupança acumula em um ano',
      formula: `${reais(poupanca)} × 12`,
      resultado: poupancaEmDozeMeses,
      justificativa: 'Sem contar rendimento nenhum — é só a soma dos doze depósitos.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      necessidades,
      desejos,
      poupanca,
      naoAlocado,
      somaDosPercentuais,
      poupancaEmDozeMeses,
    },
    traco,
  }
}

export { ZERO }

// ---------------------------------------------------------------------------
// CALC-068 — Duração e custo do botijão de gás
// ---------------------------------------------------------------------------

/**
 * A conta parte da **duração observada**, e não de potência de fogão.
 *
 * A alternativa seria estimar o consumo a partir da potência dos queimadores em
 * kcal/h e do tempo de uso — dados que quase ninguém tem e que ninguém mede. A
 * duração do último botijão, essa a pessoa sabe. É a mesma escolha de CALC-057
 * com o IPVA: pedir o dado que o usuário possui, em vez do que o produto
 * gostaria de ter.
 */
export interface EntradaBotijao {
  readonly precoDoBotijao: Centavos
  /** Quantos dias o botijão durou. */
  readonly duracaoDias: number
  /** Massa do botijão em quilos, em centésimos: 13 kg é `1300`. */
  readonly massaKg: number
}

export interface SaidaBotijao {
  readonly custoPorDia: Centavos
  readonly custoPorMes: Centavos
  readonly custoPorAno: Centavos
  readonly custoPorKg: Centavos
  /** Consumo médio diário, em gramas. */
  readonly gramasPorDia: number
}

export function calcularBotijao(
  entrada: EntradaBotijao,
  dataReferencia: DataISO,
): Resultado<SaidaBotijao> {
  if (entrada.precoDoBotijao <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quanto você pagou no botijão para ver o resultado.',
    }
  }
  if (entrada.duracaoDias <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quantos dias o botijão durou para ver o resultado.',
    }
  }
  if (entrada.massaKg <= 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A massa do botijão precisa ser maior que zero.',
    }
  }

  const etapas: Etapa[] = []

  const custoPorDia = proporcao(entrada.precoDoBotijao, 1, entrada.duracaoDias, POLITICA)
  etapas.push({
    rotulo: 'Custo por dia',
    formula: `${reais(entrada.precoDoBotijao)} ÷ ${entrada.duracaoDias} dias`,
    resultado: custoPorDia,
  })

  /**
   * O mês de trinta dias é convenção declarada, e não medição.
   *
   * O consumo de gás não segue o calendário — o que se quer aqui é uma base
   * comparável com as outras despesas mensais da casa, e trinta é a base que o
   * resto do produto usa quando mensaliza algo diário.
   */
  const custoPorMes = multiplicarPorInteiro(custoPorDia, DIAS_NO_MES_PADRAO)
  etapas.push({
    rotulo: 'Custo por mês',
    formula: `${reais(custoPorDia)} × 30 dias`,
    resultado: custoPorMes,
  })

  const custoPorAno = multiplicarPorInteiro(custoPorMes, MESES_NO_ANO)
  etapas.push({
    rotulo: 'Custo em doze meses',
    formula: `${reais(custoPorMes)} × 12`,
    resultado: custoPorAno,
  })

  /**
   * O custo por quilo é o número que compara revendas.
   *
   * Botijões de tamanhos diferentes não se comparam pelo preço: um de 8 kg mais
   * barato pode custar mais por quilo que um de 13 kg. É o mesmo raciocínio da
   * cotação efetiva em CALC-062.
   */
  const custoPorKg = proporcao(
    entrada.precoDoBotijao,
    CENTESIMOS_POR_UNIDADE,
    entrada.massaKg,
    POLITICA,
  )
  etapas.push({
    rotulo: 'Custo por quilo de gás',
    formula: `${reais(entrada.precoDoBotijao)} ÷ ${numero(centavos(entrada.massaKg))} kg`,
    resultado: custoPorKg,
    justificativa:
      'É o número que compara revendas e tamanhos diferentes. Botijão menor costuma sair mais ' +
      'caro por quilo, mesmo custando menos no total.',
  })

  // Gramas por dia: a massa em centésimos de quilo vira gramas ao multiplicar
  // por dez, e o resultado se divide pelos dias.
  const gramasPorDia = Math.round((entrada.massaKg * GRAMAS_POR_CENTESIMO_DE_KG) / entrada.duracaoDias)

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: { custoPorDia, custoPorMes, custoPorAno, custoPorKg, gramasPorDia },
    traco,
  }
}
