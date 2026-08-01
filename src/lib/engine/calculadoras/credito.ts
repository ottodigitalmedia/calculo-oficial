/**
 * CALC-024 — CET · CALC-025 — Amortização SAC vs. Price.
 *
 * As duas primeiras do bloco de crédito, e as primeiras do catálogo **sem
 * parâmetro legal nenhum**: tudo o que entra é digitado. O que elas têm de
 * norma é o CET, cuja definição e fórmula estão na Resolução CMN nº
 * 4.881/2020 — e é ela que a memória cita.
 *
 * O motor de taxa interna que CALC-024 exige é o mesmo de que precisarão
 * CALC-029 (portabilidade), CALC-056 (financiamento de veículo) e o
 * comparativo de CALC-031. Construído uma vez, em `engine/financeira.ts`.
 */

import {
  anualizar,
  jurosDoPeriodo,
  parcelaPrice,
  taxaInternaMensal,
  valorPresenteDeSerie,
} from '../financeira'
import {
  aliquotaEfetiva,
  minimo,
  multiplicarPorInteiro,
  naoNegativo,
  somar,
  subtrair,
} from '../money'
import { fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import { CDC_ART_52, RESOLUCAO_CMN_4881 } from '../../params/data/fontes'

const AVOS_NO_ANO = 12

/**
 * Escala das etapas em unidade `'numero'` — ver `Unidade` em `traco.ts`.
 *
 * Definição de unidade, não constante legal: BV-10 existe para impedir tabela
 * de INSS escrita à mão dentro do motor, não para proibir a base decimal.
 */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

// ---------------------------------------------------------------------------
// CALC-024 — Custo efetivo total
// ---------------------------------------------------------------------------

export interface EntradaCet {
  /** O que entrou na conta do tomador. */
  readonly valorLiberado: Centavos
  readonly valorParcela: Centavos
  readonly prazoMeses: number
  /** Tarifas, seguros e tributos descontados na liberação. */
  readonly despesasNaLiberacao: Centavos
}

export interface SaidaCet {
  readonly cetMensal: BasisPoints
  readonly cetAnual: BasisPoints
  readonly recebidoDeFato: Centavos
  readonly totalPago: Centavos
  readonly custoTotal: Centavos
}

export function calcularCet(entrada: EntradaCet, dataReferencia: DataISO): Resultado<SaidaCet> {
  if (entrada.valorLiberado <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor liberado para ver o resultado.' }
  }
  if (entrada.valorParcela <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor da parcela para ver o resultado.' }
  }
  if (entrada.prazoMeses <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o número de parcelas para ver o resultado.' }
  }

  const etapas: Etapa[] = []

  /**
   * `FC0` da Resolução: o crédito concedido **deduzido** das despesas e
   * tarifas pagas antecipadamente.
   *
   * É a diferença entre o CET e a taxa do contrato. A taxa nominal olha o
   * valor contratado; o CET olha o que de fato entrou no bolso de quem tomou.
   */
  const recebidoDeFato = naoNegativo(subtrair(entrada.valorLiberado, entrada.despesasNaLiberacao))

  if (entrada.despesasNaLiberacao > 0) {
    etapas.push({
      rotulo: 'Valor que de fato entrou',
      formula: `${reais(entrada.valorLiberado)} − ${reais(entrada.despesasNaLiberacao)} (tarifas e despesas)`,
      resultado: recebidoDeFato,
      fundamento: fundamentar(RESOLUCAO_CMN_4881),
      justificativa:
        'A norma manda deduzir do crédito concedido as despesas e tarifas pagas ' +
        'antecipadamente. É essa dedução que separa o CET da taxa do contrato.',
    })
  } else {
    etapas.push({
      rotulo: 'Valor liberado',
      formula: `Informado: ${reais(recebidoDeFato)}`,
      resultado: recebidoDeFato,
    })
  }

  const totalPago = multiplicarPorInteiro(entrada.valorParcela, entrada.prazoMeses)
  etapas.push({
    rotulo: 'Total das parcelas',
    formula: `${reais(entrada.valorParcela)} × ${entrada.prazoMeses} parcelas`,
    resultado: totalPago,
  })

  const cetMensal = taxaInternaMensal(recebidoDeFato, entrada.valorParcela, entrada.prazoMeses)
  if (cetMensal === null) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        'A soma das parcelas não supera o valor recebido — confira os valores informados.',
    }
  }

  const cetAnual = anualizar(cetMensal)

  etapas.push({
    rotulo: 'CET ao mês',
    formula: `Taxa que iguala ${reais(recebidoDeFato)} ao valor presente de ${entrada.prazoMeses} parcelas de ${reais(entrada.valorParcela)}`,
    resultado: ZERO,
    fundamento: fundamentar(RESOLUCAO_CMN_4881),
    justificativa:
      `Resultado: ${percentual(cetMensal)} ao mês. Não existe fórmula fechada para essa ` +
      'taxa: ela é encontrada por busca, testando taxas até o valor presente das parcelas ' +
      'coincidir com o que foi recebido.',
  })

  etapas.push({
    rotulo: 'CET ao ano',
    formula: `(1 + ${percentual(cetMensal)})^12 − 1 = ${percentual(cetAnual)}`,
    resultado: ZERO,
  })

  const custoTotal = subtrair(totalPago, recebidoDeFato)
  etapas.push({
    rotulo: 'Custo total do crédito',
    formula: `${reais(totalPago)} − ${reais(recebidoDeFato)}`,
    resultado: custoTotal,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: { cetMensal, cetAnual, recebidoDeFato, totalPago, custoTotal },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-025 — SAC vs. Price
// ---------------------------------------------------------------------------

export interface EntradaAmortizacao {
  readonly principal: Centavos
  readonly prazoMeses: number
  readonly taxaMensal: BasisPoints
}

export interface LinhaDoAno {
  readonly ano: number
  readonly parcelaSac: Centavos
  readonly parcelaPrice: Centavos
  readonly saldoSac: Centavos
  readonly saldoPrice: Centavos
}

export interface SaidaAmortizacao {
  readonly primeiraParcelaSac: Centavos
  readonly ultimaParcelaSac: Centavos
  readonly totalSac: Centavos
  readonly jurosSac: Centavos
  readonly parcelaPriceConstante: Centavos
  readonly totalPrice: Centavos
  readonly jurosPrice: Centavos
  readonly economiaDoSac: Centavos
  readonly evolucao: readonly LinhaDoAno[]
}

export function calcularAmortizacao(
  entrada: EntradaAmortizacao,
  dataReferencia: DataISO,
): Resultado<SaidaAmortizacao> {
  if (entrada.principal <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor financiado para ver o resultado.' }
  }
  if (entrada.prazoMeses <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o prazo para ver o resultado.' }
  }
  if (entrada.taxaMensal < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A taxa não pode ser negativa.' }
  }

  const etapas: Etapa[] = []
  const n = entrada.prazoMeses

  // --- Price: prestação constante ---
  const parcelaConstante = parcelaPrice(entrada.principal, n, entrada.taxaMensal)
  etapas.push({
    rotulo: 'Price — prestação constante',
    formula: `${reais(entrada.principal)} × ${percentual(entrada.taxaMensal)} × (1+i)^${n} ÷ ((1+i)^${n} − 1)`,
    resultado: parcelaConstante,
    justificativa:
      'No sistema francês a prestação não muda. No começo quase tudo é juro, e a ' +
      'amortização cresce a cada mês.',
  })

  // --- SAC: amortização constante ---
  const amortizacaoConstante = centavos(Math.round(entrada.principal / n))
  const jurosPrimeiro = jurosDoPeriodo(entrada.principal, entrada.taxaMensal)
  const primeiraParcelaSac = somar(amortizacaoConstante, jurosPrimeiro)

  etapas.push({
    rotulo: 'SAC — amortização constante',
    formula: `${reais(entrada.principal)} ÷ ${n} = ${reais(amortizacaoConstante)} por mês, mais juros sobre o saldo`,
    resultado: primeiraParcelaSac,
    justificativa:
      'No sistema de amortização constante a parcela começa mais alta e cai todo mês, ' +
      'porque os juros incidem sobre um saldo que diminui em passos iguais.',
  })

  // --- Evolução mês a mês, resumida por ano ---
  let saldoSac: Centavos = entrada.principal
  let saldoPrice: Centavos = entrada.principal
  let totalSac: Centavos = ZERO
  let totalPrice: Centavos = ZERO
  let jurosSac: Centavos = ZERO
  let jurosPrice: Centavos = ZERO
  let ultimaParcelaSac: Centavos = ZERO
  const evolucao: LinhaDoAno[] = []

  for (let mes = 1; mes <= n; mes += 1) {
    const jurosDoMesSac = jurosDoPeriodo(saldoSac, entrada.taxaMensal)
    // A última parcela liquida o que restou, absorvendo o arredondamento.
    const amortizaSac = mes === n ? saldoSac : amortizacaoConstante
    const parcelaSac = somar(amortizaSac, jurosDoMesSac)
    saldoSac = naoNegativo(subtrair(saldoSac, amortizaSac))
    totalSac = somar(totalSac, parcelaSac)
    jurosSac = somar(jurosSac, jurosDoMesSac)
    ultimaParcelaSac = parcelaSac

    const jurosDoMesPrice = jurosDoPeriodo(saldoPrice, entrada.taxaMensal)
    const amortizaPrice =
      mes === n ? saldoPrice : naoNegativo(subtrair(parcelaConstante, jurosDoMesPrice))
    const pagoPrice = mes === n ? somar(saldoPrice, jurosDoMesPrice) : parcelaConstante
    saldoPrice = naoNegativo(subtrair(saldoPrice, amortizaPrice))
    totalPrice = somar(totalPrice, pagoPrice)
    jurosPrice = somar(jurosPrice, jurosDoMesPrice)

    if (mes % AVOS_NO_ANO === 0 || mes === n) {
      evolucao.push({
        ano: Math.ceil(mes / AVOS_NO_ANO),
        parcelaSac,
        parcelaPrice: pagoPrice,
        saldoSac,
        saldoPrice,
      })
    }
  }

  const economiaDoSac = subtrair(totalPrice, totalSac)

  etapas.push({
    rotulo: 'Total pago no SAC',
    formula: `Soma das ${n} parcelas decrescentes, de ${reais(primeiraParcelaSac)} a ${reais(ultimaParcelaSac)}`,
    resultado: totalSac,
  })

  etapas.push({
    rotulo: 'Total pago no Price',
    formula: `${reais(parcelaConstante)} × ${n} parcelas`,
    resultado: totalPrice,
  })

  etapas.push({
    rotulo: 'Diferença entre os dois sistemas',
    formula: `${reais(totalPrice)} (Price) − ${reais(totalSac)} (SAC)`,
    resultado: economiaDoSac,
    justificativa:
      'O SAC custa menos no total porque amortiza mais cedo — e exige mais no começo, ' +
      'que é exatamente o motivo de nem sempre ser a melhor escolha.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      primeiraParcelaSac,
      ultimaParcelaSac,
      totalSac,
      jurosSac,
      parcelaPriceConstante: parcelaConstante,
      totalPrice,
      jurosPrice,
      economiaDoSac,
      evolucao,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-026 — Quitação antecipada
// ---------------------------------------------------------------------------

/**
 * O que fazer com a folga quando o pagamento é parcial.
 *
 * A escolha é do consumidor e o banco costuma oferecer só uma delas. Reduzir o
 * prazo economiza mais — cada parcela cortada é uma parcela inteira de juros
 * que deixa de existir. Reduzir a parcela alivia o mês, e é o que faz sentido
 * quando o orçamento é o problema.
 */
export type ModalidadeQuitacao = 'reduzir-prazo' | 'reduzir-parcela'

export interface EntradaQuitacao {
  readonly valorParcela: Centavos
  readonly parcelasRestantes: number
  readonly taxaMensal: BasisPoints
  /** Quanto se pretende pagar agora. Zero (ou o saldo inteiro) = quitação total. */
  readonly valorDisponivel: Centavos
  readonly modalidade: ModalidadeQuitacao
}

export interface SaidaQuitacao {
  /** O que se pagaria seguindo o contrato até o fim. */
  readonly somaDasParcelas: Centavos
  /** O saldo devedor de hoje — art. 52, § 2º do CDC. */
  readonly saldoPresente: Centavos
  readonly quitacaoTotal: boolean
  readonly valorPagoAgora: Centavos
  readonly totalFuturo: Centavos
  readonly economia: Centavos
  /** Quanto a economia representa da soma das parcelas. */
  readonly descontoBp: BasisPoints
  readonly novoPrazo: number
  /** A parcela que passa a valer. Igual à antiga quando a escolha foi cortar prazo. */
  readonly novaParcela: Centavos
}

/**
 * Roda a amortização mês a mês até o saldo zerar.
 *
 * Feita por simulação e não por fórmula fechada de propósito: é assim que o
 * banco de fato roda, e é a única forma de a última parcela sair certa — ela
 * quase nunca é igual às demais, porque liquida o que sobrou.
 *
 * `limite` não é otimização, é guarda: se a parcela não cobrisse nem os juros
 * do mês, o saldo cresceria e o laço não terminaria.
 */
function amortizarAteZerar(
  saldoInicial: Centavos,
  parcela: Centavos,
  taxa: BasisPoints,
  limite: number,
): { readonly total: Centavos; readonly meses: number } {
  let saldo = saldoInicial
  let total: Centavos = ZERO
  let meses = 0

  while (saldo > 0 && meses < limite) {
    const juros = jurosDoPeriodo(saldo, taxa)
    const devido = somar(saldo, juros)
    const paga = minimo(parcela, devido)
    saldo = naoNegativo(subtrair(devido, paga))
    total = somar(total, paga)
    meses += 1
  }

  /**
   * A última parcela absorve o arredondamento — é o que `calcularAmortizacao`
   * já faz, e é o que o banco faz. A prestação do sistema francês é arredondada
   * ao centavo, e o que sobra dessa fração ao fim do prazo não desaparece: ele
   * entra na última cobrança. Sem esta linha o total sairia alguns centavos
   * menor que o devido, e a economia, alguns centavos maior.
   */
  return { total: somar(total, saldo), meses }
}

export function calcularQuitacaoAntecipada(
  entrada: EntradaQuitacao,
  dataReferencia: DataISO,
): Resultado<SaidaQuitacao> {
  if (entrada.valorParcela <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor da parcela para ver o resultado.' }
  }
  if (entrada.parcelasRestantes <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe quantas parcelas ainda faltam para ver o resultado.' }
  }
  if (entrada.taxaMensal < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A taxa não pode ser negativa.' }
  }
  if (entrada.valorDisponivel < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O valor a pagar agora não pode ser negativo.' }
  }

  const etapas: Etapa[] = []
  const n = entrada.parcelasRestantes

  const somaDasParcelas = multiplicarPorInteiro(entrada.valorParcela, n)
  etapas.push({
    rotulo: 'Soma das parcelas que faltam',
    formula: `${reais(entrada.valorParcela)} × ${n} parcelas`,
    resultado: somaDasParcelas,
    justificativa:
      'É o que sairia do seu bolso seguindo o contrato até o fim. Não é o saldo devedor — ' +
      'dentro dele há juros de meses que ainda não passaram.',
  })

  /**
   * O coração da calculadora.
   *
   * O saldo devedor de hoje é o **valor presente** das parcelas que faltam, e
   * não a soma delas. Os juros embutidos em cada parcela remuneram o tempo até
   * o vencimento dela; antecipando, esse tempo não corre, e o art. 52, § 2º do
   * CDC manda reduzi-los **proporcionalmente**.
   */
  const saldoPresente = valorPresenteDeSerie(entrada.valorParcela, n, entrada.taxaMensal)
  etapas.push({
    rotulo: 'Saldo devedor hoje, com os juros reduzidos proporcionalmente',
    formula:
      `Valor presente de ${n} parcelas de ${reais(entrada.valorParcela)} ` +
      `descontadas a ${percentual(entrada.taxaMensal)} ao mês`,
    resultado: saldoPresente,
    fundamento: fundamentar(CDC_ART_52),
    justificativa:
      'A lei assegura a liquidação antecipada mediante redução proporcional dos juros. ' +
      'Proporcional significa trazer cada parcela a valor de hoje: os juros que remuneram ' +
      'o tempo que não vai correr deixam de ser devidos.',
  })

  const quitacaoTotal =
    entrada.valorDisponivel <= 0 || entrada.valorDisponivel >= saldoPresente

  let valorPagoAgora: Centavos
  let totalFuturo: Centavos
  let novoPrazo: number
  let novaParcela: Centavos

  if (quitacaoTotal) {
    valorPagoAgora = saldoPresente
    totalFuturo = ZERO
    novoPrazo = 0
    novaParcela = ZERO
  } else {
    valorPagoAgora = entrada.valorDisponivel
    const novoSaldo = subtrair(saldoPresente, valorPagoAgora)

    etapas.push({
      rotulo: 'Saldo que sobra depois da amortização',
      formula: `${reais(saldoPresente)} − ${reais(valorPagoAgora)}`,
      resultado: novoSaldo,
    })

    if (entrada.modalidade === 'reduzir-parcela') {
      novaParcela = parcelaPrice(novoSaldo, n, entrada.taxaMensal)
      const simulada = amortizarAteZerar(novoSaldo, novaParcela, entrada.taxaMensal, n)
      totalFuturo = simulada.total
      novoPrazo = simulada.meses

      etapas.push({
        rotulo: 'Nova parcela, com o prazo mantido',
        formula: `${reais(novoSaldo)} distribuído em ${n} parcelas a ${percentual(entrada.taxaMensal)} ao mês`,
        resultado: novaParcela,
        justificativa:
          'O prazo continua o mesmo e a prestação cai. É a escolha que alivia o mês — e a ' +
          'que economiza menos, porque os juros continuam correndo pelo prazo inteiro.',
      })
    } else {
      novaParcela = entrada.valorParcela
      const simulada = amortizarAteZerar(novoSaldo, entrada.valorParcela, entrada.taxaMensal, n)
      totalFuturo = simulada.total
      novoPrazo = simulada.meses

      etapas.push({
        rotulo: 'Novo prazo, com a parcela mantida',
        formula:
          `${reais(novoSaldo)} amortizado com parcelas de ${reais(entrada.valorParcela)} ` +
          `a ${percentual(entrada.taxaMensal)} ao mês`,
        resultado: centavos(novoPrazo * CENTESIMOS_POR_UNIDADE),
        unidade: 'numero',
        justificativa:
          `Sobram ${novoPrazo} parcelas no lugar de ${n}. Cortar prazo economiza mais que ` +
          'reduzir parcela, porque cada mês eliminado é um mês inteiro de juros que deixa de existir.',
      })
    }
  }

  const totalNovo = somar(valorPagoAgora, totalFuturo)
  etapas.push({
    rotulo: 'Total que você passa a pagar',
    formula:
      quitacaoTotal
        ? `${reais(valorPagoAgora)} hoje, e nada depois`
        : `${reais(valorPagoAgora)} hoje + ${reais(totalFuturo)} nas parcelas restantes`,
    resultado: totalNovo,
  })

  const economia = subtrair(somaDasParcelas, totalNovo)
  const descontoBp = aliquotaEfetiva(economia, somaDasParcelas, 'meio_para_cima')

  etapas.push({
    rotulo: 'Economia de juros',
    formula: `${reais(somaDasParcelas)} − ${reais(totalNovo)} = ${percentual(descontoBp)} da soma das parcelas`,
    resultado: economia,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      somaDasParcelas,
      saldoPresente,
      quitacaoTotal,
      valorPagoAgora,
      totalFuturo,
      economia,
      descontoBp,
      novoPrazo,
      novaParcela,
    },
    traco,
  }
}

export { basisPoints, centavos }
