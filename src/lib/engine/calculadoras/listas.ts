/**
 * CALC-073 — Divisão de conta · CALC-075 — Média ponderada · CALC-028 — Plano
 * de quitação.
 *
 * As três primeiras do catálogo cuja entrada é uma **lista de tamanho variável**,
 * e as três que fizeram o contrato de `Campo` crescer — ver o comentário de
 * `TipoCampo` em `calculadoras/tipos.ts`.
 *
 * Dividem módulo porque dividem a forma da entrada, e não o assunto: cada uma
 * recebe uma matriz de inteiros e devolve o que aquela matriz significa. O que
 * elas têm de comum é o cuidado com a **linha em branco** — o usuário deixa
 * linhas sobrando o tempo todo, e uma linha de zeros que entrasse na conta
 * dividiria por gente que não existe ou mediria uma nota que ninguém tirou.
 */

import {
  aplicarAliquota,
  dividirPorInteiro,
  multiplicarPorInteiro,
  somar,
  subtrair,
} from '../money'
import { jurosDoPeriodo } from '../financeira'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

const POLITICA = 'meio_para_cima' as const

/**
 * Célula de uma linha, com ausência valendo zero.
 *
 * `lerLista` já entrega toda linha completada, e o índice fora da faixa é
 * impossível na prática — mas o compilador não sabe disso, e `?? 0` espalhado
 * por vinte pontos é vinte ramos que teste nenhum alcança. Concentrar aqui
 * mantém a garantia e devolve a medida de cobertura ao que ela deve medir.
 */
function celula(linha: readonly number[], indice: number): number {
  return linha[indice] ?? 0
}

// ---------------------------------------------------------------------------
// CALC-073 — Divisão de conta
// ---------------------------------------------------------------------------

export interface EntradaDivisao {
  /** Uma linha por pessoa, com o que ela consumiu. */
  readonly consumos: readonly (readonly number[])[]
  /** O que foi de todos e se divide igualmente. */
  readonly compartilhado: Centavos
  readonly gorjetaBp: BasisPoints
}

export interface ParteDaConta {
  readonly consumo: Centavos
  readonly rateio: Centavos
  readonly gorjeta: Centavos
  readonly total: Centavos
}

export interface SaidaDivisao {
  readonly pessoas: number
  readonly somaDosConsumos: Centavos
  readonly compartilhado: Centavos
  readonly gorjeta: Centavos
  readonly total: Centavos
  readonly partes: readonly ParteDaConta[]
}

export function dividirConta(
  entrada: EntradaDivisao,
  dataReferencia: DataISO,
): Resultado<SaidaDivisao> {
  const linhas = entrada.consumos.filter((l) => celula(l, 0) > 0)

  if (linhas.length === 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o que cada pessoa consumiu para ver o resultado.',
    }
  }

  const etapas: Etapa[] = []
  const pessoas = linhas.length

  const somaDosConsumos = centavos(linhas.reduce((t, l) => t + celula(l, 0), 0))
  etapas.push({
    rotulo: `Soma do que ${pessoas} ${pessoas === 1 ? 'pessoa consumiu' : 'pessoas consumiram'}`,
    formula: linhas.map((l) => reais(centavos(celula(l, 0)))).join(' + '),
    resultado: somaDosConsumos,
  })

  /**
   * O que é de todos se divide **igualmente**, e o resto se paga por consumo.
   *
   * O rateio é arredondado por pessoa e a sobra fica com a última — sem isso a
   * soma das partes ficaria alguns centavos abaixo do total, que é o defeito de
   * §7.12. Quem paga um centavo a mais é sempre a mesma posição, e isso está
   * declarado na nota da tela.
   */
  const rateioBase = pessoas > 0 ? dividirPorInteiro(entrada.compartilhado, pessoas, 'truncar') : ZERO
  const sobraDoRateio = subtrair(entrada.compartilhado, multiplicarPorInteiro(rateioBase, pessoas))

  if (entrada.compartilhado > 0) {
    etapas.push({
      rotulo: 'O que foi de todos, dividido igualmente',
      formula: `${reais(entrada.compartilhado)} ÷ ${pessoas}`,
      resultado: rateioBase,
    })
  }

  const semGorjeta = somar(somaDosConsumos, entrada.compartilhado)
  const gorjeta = aplicarAliquota(semGorjeta, entrada.gorjetaBp, POLITICA)

  if (gorjeta > 0) {
    etapas.push({
      rotulo: 'Gorjeta',
      formula: `${reais(semGorjeta)} × ${percentual(entrada.gorjetaBp)}`,
      resultado: gorjeta,
      justificativa:
        'A gorjeta incide sobre o que cada um consumiu, e por isso ela é distribuída na mesma ' +
        'proporção — quem consumiu mais paga mais gorjeta.',
    })
  }

  const total = somar(semGorjeta, gorjeta)

  const partes: ParteDaConta[] = linhas.map((l, i) => {
    const consumo = centavos(celula(l, 0))
    const rateio = i === pessoas - 1 ? somar(rateioBase, sobraDoRateio) : rateioBase
    const base = somar(consumo, rateio)
    const gorjetaDaPessoa = aplicarAliquota(base, entrada.gorjetaBp, POLITICA)
    return { consumo, rateio, gorjeta: gorjetaDaPessoa, total: somar(base, gorjetaDaPessoa) }
  })

  /**
   * A soma das partes tem de bater com o total, ao centavo.
   *
   * O arredondamento da gorjeta por pessoa pode deixar uma diferença de poucos
   * centavos; ela vai para a última parte, pelo mesmo motivo do rateio.
   */
  const somaDasPartes = centavos(partes.reduce((t, p) => t + p.total, 0))
  const ajuste = subtrair(total, somaDasPartes)
  const ultima = partes[partes.length - 1]
  if (ajuste !== 0 && ultima) {
    partes[partes.length - 1] = { ...ultima, total: somar(ultima.total, ajuste) }
  }

  etapas.push({
    rotulo: 'Total da conta',
    formula: `${reais(semGorjeta)} + ${reais(gorjeta)} de gorjeta`,
    resultado: total,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      pessoas,
      somaDosConsumos,
      compartilhado: entrada.compartilhado,
      gorjeta,
      total,
      partes,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-075 — Média ponderada
// ---------------------------------------------------------------------------

export interface EntradaMedia {
  /** Uma linha por avaliação: nota e peso, ambos em centésimos. */
  readonly notas: readonly (readonly number[])[]
  /** Média que se quer alcançar, em centésimos. Zero para não calcular. */
  readonly mediaDesejada: number
  /** Peso que ainda falta avaliar, em centésimos. */
  readonly pesoRestante: number
}

export interface SaidaMedia {
  readonly mediaPonderada: number
  readonly mediaSimples: number
  readonly somaDosPesos: number
  readonly avaliacoes: number
  /** Quanto é preciso tirar no que falta para alcançar a média desejada. */
  readonly notaNecessaria: number | null
  /** Verdadeiro quando nem a nota máxima plausível alcançaria. */
  readonly inalcancavel: boolean
}

export function calcularMediaPonderada(
  entrada: EntradaMedia,
  dataReferencia: DataISO,
): Resultado<SaidaMedia> {
  const linhas = entrada.notas.filter((l) => celula(l, 1) > 0)

  if (linhas.length === 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe ao menos uma nota com peso para ver o resultado.',
    }
  }

  const etapas: Etapa[] = []

  const somaDosPesos = linhas.reduce((t, l) => t + celula(l, 1), 0)

  /**
   * A soma de nota × peso, em centésimos ao quadrado, dividida uma vez só.
   *
   * Dividir a cada parcela e somar depois acumularia arredondamento por
   * avaliação — é o mesmo motivo de `somarAliquotasPorFaixa` existir em
   * `money.ts`, e a Receita já mostrou de que lado fica a razão.
   */
  const produto = linhas.reduce((t, l) => t + celula(l, 0) * celula(l, 1), 0)
  const mediaPonderada = Math.round(produto / somaDosPesos)

  etapas.push({
    rotulo: 'Soma de nota × peso',
    formula: linhas
      .map((l) => `${numeroCurto(celula(l, 0))}×${numeroCurto(celula(l, 1))}`)
      .join(' + '),
    resultado: centavos(Math.round(produto / CENTESIMOS_POR_UNIDADE)),
    unidade: 'numero',
  })

  etapas.push({
    rotulo: 'Média ponderada',
    formula: `soma dos produtos ÷ ${numeroCurto(somaDosPesos)} de peso total`,
    resultado: centavos(mediaPonderada),
    unidade: 'numero',
    justificativa:
      'A divisão é feita uma vez só, sobre a soma dos produtos. Dividir avaliação por ' +
      'avaliação e somar depois acumularia arredondamento em cada uma.',
  })

  const mediaSimples = Math.round(
    linhas.reduce((t, l) => t + celula(l, 0), 0) / linhas.length,
  )

  /**
   * Quanto falta tirar para alcançar a média desejada.
   *
   * `(desejada × pesoTotal − produtoAtual) ÷ pesoRestante`, com o peso total
   * incluindo o que ainda será avaliado. Sem peso restante não há pergunta a
   * responder, e a etapa não existe.
   */
  let notaNecessaria: number | null = null
  let inalcancavel = false

  if (entrada.mediaDesejada > 0 && entrada.pesoRestante > 0) {
    const pesoTotal = somaDosPesos + entrada.pesoRestante
    const faltando = entrada.mediaDesejada * pesoTotal - produto
    notaNecessaria = Math.ceil(faltando / entrada.pesoRestante)

    if (notaNecessaria < 0) notaNecessaria = 0
    // Dez, na escala de centésimos, é o teto usual de nota escolar no país.
    inalcancavel = notaNecessaria > 10 * CENTESIMOS_POR_UNIDADE

    etapas.push({
      rotulo: 'Nota necessária no que falta',
      formula:
        `(${numeroCurto(entrada.mediaDesejada)} × ${numeroCurto(pesoTotal)} − soma dos produtos) ` +
        `÷ ${numeroCurto(entrada.pesoRestante)}`,
      resultado: centavos(notaNecessaria),
      unidade: 'numero',
      justificativa: inalcancavel
        ? 'O valor passa de dez, que é o teto usual. Com os pesos informados, a média desejada ' +
          'não é alcançável no que resta.'
        : 'É o mínimo que zera a diferença. Tirar exatamente isso deixa a média no valor pedido.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      mediaPonderada,
      mediaSimples,
      somaDosPesos,
      avaliacoes: linhas.length,
      notaNecessaria,
      inalcancavel,
    },
    traco,
  }
}

/** Formata centésimos sem separador de milhar — notas e pesos são pequenos. */
function numeroCurto(centesimos: number): string {
  const inteiro = Math.trunc(centesimos / CENTESIMOS_POR_UNIDADE)
  const frac = Math.abs(centesimos % CENTESIMOS_POR_UNIDADE)
  return `${inteiro},${String(frac).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// CALC-028 — Plano de quitação: bola de neve vs. avalanche
// ---------------------------------------------------------------------------

export type Estrategia = 'avalanche' | 'bola-de-neve'

export interface EntradaQuitacao {
  /** Uma linha por dívida: saldo, taxa mensal e parcela mínima. */
  readonly dividas: readonly (readonly number[])[]
  /** Quanto sobra por mês, além das parcelas mínimas. */
  readonly extraMensal: Centavos
}

export interface ResultadoDaEstrategia {
  readonly meses: number
  readonly totalPago: Centavos
  readonly jurosPagos: Centavos
  readonly quitou: boolean
}

export interface SaidaPlanoDeQuitacao {
  readonly saldoTotal: Centavos
  readonly parcelasMinimas: Centavos
  readonly desembolsoMensal: Centavos
  readonly avalanche: ResultadoDaEstrategia
  readonly bolaDeNeve: ResultadoDaEstrategia
  /** Quanto a avalanche economiza sobre a bola de neve. */
  readonly economiaDaAvalanche: Centavos
  readonly mesesDeDiferenca: number
}

/** Teto da simulação: cinquenta anos. Guarda, não otimização. */
// eslint-disable-next-line no-restricted-syntax -- teto da simulação, não parâmetro legal
const LIMITE_DE_MESES = 600

/**
 * Roda o plano até quitar tudo, aplicando a sobra na dívida que a estratégia
 * escolhe.
 *
 * **O desembolso mensal é constante**, e é isso que dá sentido à comparação: as
 * duas estratégias gastam o mesmo por mês, e a única diferença é a ORDEM em que
 * as dívidas morrem. Conforme uma é quitada, a parcela dela some do mínimo e
 * engorda a sobra — é daí que vem o efeito "bola de neve", que existe nas duas.
 */
function simularPlano(
  dividas: readonly (readonly number[])[],
  extraMensal: Centavos,
  estrategia: Estrategia,
): ResultadoDaEstrategia {
  const saldos = dividas.map((d) => celula(d, 0))
  const taxas = dividas.map((d) => celula(d, 1) as BasisPoints)
  const minimos = dividas.map((d) => celula(d, 2))

  const desembolso = minimos.reduce((t, m) => t + m, 0) + extraMensal

  let totalPago = 0
  let jurosPagos = 0
  let meses = 0

  while (saldos.some((s) => s > 0) && meses < LIMITE_DE_MESES) {
    /**
     * O saldo do início do mês, para saber se o plano ANDA.
     *
     * Sem esta medida a simulação divergia em silêncio: com pagamento abaixo
     * dos juros, os saldos crescem exponencialmente e, muito antes dos 600
     * meses do teto, estouram o inteiro seguro — `centavos()` lança, e a página
     * quebra em vez de dizer "esse valor por mês não quita". Medido com dívida
     * de R$ 10.000,00 a 15% ao mês e parcela de R$ 1,00.
     */
    const saldoNoInicio = saldos.reduce((t, s) => t + Math.max(0, s), 0)

    // Juros do mês, sobre o saldo de cada dívida ainda viva.
    for (let i = 0; i < saldos.length; i += 1) {
      const saldo = celula(saldos, i)
      if (saldo <= 0) continue
      const juros = jurosDoPeriodo(centavos(saldo), taxas[i] ?? (0 as BasisPoints))
      saldos[i] = saldo + juros
      jurosPagos += juros
    }

    let disponivel = desembolso

    // Primeiro os mínimos, em toda dívida viva.
    for (let i = 0; i < saldos.length; i += 1) {
      const saldo = celula(saldos, i)
      if (saldo <= 0 || disponivel <= 0) continue
      const paga = Math.min(celula(minimos, i), saldo, disponivel)
      saldos[i] = saldo - paga
      disponivel -= paga
      totalPago += paga
    }

    /**
     * A sobra vai para o alvo da estratégia, e transborda para o próximo quando
     * o alvo é quitado no meio do mês. Sem o transbordo, dinheiro disponível
     * ficaria parado num mês em que havia dívida a pagar.
     */
    while (disponivel > 0 && saldos.some((s) => s > 0)) {
      let alvo = -1
      for (let i = 0; i < saldos.length; i += 1) {
        const saldo = celula(saldos, i)
        if (saldo <= 0) continue
        if (alvo === -1) {
          alvo = i
          continue
        }
        const melhor =
          estrategia === 'avalanche'
            ? celula(taxas, i) > celula(taxas, alvo)
            : saldo < celula(saldos, alvo)
        if (melhor) alvo = i
      }
      if (alvo === -1) break

      const saldoDoAlvo = celula(saldos, alvo)
      const paga = Math.min(disponivel, saldoDoAlvo)
      saldos[alvo] = saldoDoAlvo - paga
      disponivel -= paga
      totalPago += paga
    }

    meses += 1

    /**
     * O plano não anda: o saldo somado terminou o mês igual ou maior do que
     * começou. Insistir só multiplicaria a dívida — e a resposta honesta é
     * dizer que esse desembolso não quita, que é o que `quitou: false` faz.
     */
    if (saldos.reduce((t, s) => t + Math.max(0, s), 0) >= saldoNoInicio) break
  }

  return {
    meses,
    totalPago: centavos(totalPago),
    jurosPagos: centavos(jurosPagos),
    quitou: saldos.every((s) => s <= 0),
  }
}

export function calcularPlanoDeQuitacao(
  entrada: EntradaQuitacao,
  dataReferencia: DataISO,
): Resultado<SaidaPlanoDeQuitacao> {
  const dividas = entrada.dividas.filter((d) => celula(d, 0) > 0)

  if (dividas.length === 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe ao menos uma dívida, com saldo e taxa, para ver o resultado.',
    }
  }

  const saldoTotal = centavos(dividas.reduce((t, d) => t + celula(d, 0), 0))
  const parcelasMinimas = centavos(dividas.reduce((t, d) => t + celula(d, 2), 0))
  const desembolsoMensal = somar(parcelasMinimas, entrada.extraMensal)

  if (desembolsoMensal <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe as parcelas mínimas ou quanto sobra por mês para ver o resultado.',
    }
  }

  const etapas: Etapa[] = []

  etapas.push({
    rotulo: `Saldo somado de ${dividas.length} ${dividas.length === 1 ? 'dívida' : 'dívidas'}`,
    formula: dividas.map((d) => reais(centavos(celula(d, 0)))).join(' + '),
    resultado: saldoTotal,
  })

  etapas.push({
    rotulo: 'Quanto sai por mês, nas duas estratégias',
    formula: `${reais(parcelasMinimas)} de mínimos + ${reais(entrada.extraMensal)} de sobra`,
    resultado: desembolsoMensal,
    justificativa:
      'As duas gastam o MESMO por mês. A única diferença entre elas é a ordem em que as ' +
      'dívidas morrem — e é só isso que produz a diferença no total pago.',
  })

  const avalanche = simularPlano(dividas, entrada.extraMensal, 'avalanche')
  const bolaDeNeve = simularPlano(dividas, entrada.extraMensal, 'bola-de-neve')

  if (!avalanche.quitou || !bolaDeNeve.quitou) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        'Com esse valor por mês as dívidas não são quitadas: os juros crescem mais rápido que ' +
        'o pagamento. Aumente a sobra mensal ou reveja as taxas informadas.',
    }
  }

  etapas.push({
    rotulo: 'Avalanche — atacando a maior taxa primeiro',
    formula: `${avalanche.meses} meses, ${reais(avalanche.jurosPagos)} de juros`,
    resultado: avalanche.totalPago,
    justificativa:
      'Cada real vai para a dívida que cobra mais caro, que é onde ele evita mais juro. É a ' +
      'estratégia que sempre custa menos — a aritmética não deixa ser diferente.',
  })

  etapas.push({
    rotulo: 'Bola de neve — quitando a menor dívida primeiro',
    formula: `${bolaDeNeve.meses} meses, ${reais(bolaDeNeve.jurosPagos)} de juros`,
    resultado: bolaDeNeve.totalPago,
    justificativa:
      'Cada real vai para a dívida menor, que morre antes. Custa mais em juros e entrega algo ' +
      'que a planilha não mede: uma dívida a menos na lista, mais cedo.',
  })

  const economiaDaAvalanche = subtrair(bolaDeNeve.totalPago, avalanche.totalPago)
  const mesesDeDiferenca = bolaDeNeve.meses - avalanche.meses

  etapas.push({
    rotulo: 'Quanto a avalanche economiza',
    formula: `${reais(bolaDeNeve.totalPago)} − ${reais(avalanche.totalPago)}`,
    resultado: economiaDaAvalanche,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      saldoTotal,
      parcelasMinimas,
      desembolsoMensal,
      avalanche,
      bolaDeNeve,
      economiaDaAvalanche,
      mesesDeDiferenca,
    },
    traco,
  }
}
