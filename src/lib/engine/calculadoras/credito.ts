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

// ---------------------------------------------------------------------------
// CALC-056 — Financiamento de veículo
// ---------------------------------------------------------------------------

/**
 * **O que separa esta calculadora de CALC-024, que já calcula CET.** CALC-024
 * parte do que o banco liberou; esta parte do **preço do carro e da entrada**,
 * que é como a decisão é tomada na loja. E ela responde a pergunta que a
 * simulação da concessionária não responde: quanto o carro custa no fim.
 *
 * **As tarifas entram DENTRO do valor financiado, porque é isso que acontece.**
 * Cadastro, registro de contrato e IOF são embutidos no contrato na prática do
 * mercado — o cliente não os paga no ato, financia-os. Somá-los ao valor
 * financiado é o que faz a parcela bater com a do contrato, e é também o que
 * revela por que o CET fica acima da taxa anunciada.
 *
 * **O IOF entra como valor digitado, não como alíquota.** É a mesma decisão de
 * CALC-062, registrada em `ESTADO-DO-PROJETO` §7.33: a alíquota do IOF estava
 * sob disputa quando esta calculadora foi construída, e publicar alíquota não
 * confirmada é o dano que este produto existe para evitar. O valor está no
 * contrato, discriminado.
 */

export interface EntradaFinanciamentoDeVeiculo {
  readonly precoDoVeiculo: Centavos
  readonly entrada: Centavos
  readonly prazoMeses: number
  readonly taxaMensalBp: BasisPoints
  /** Cadastro, registro de contrato e IOF — todos digitados, todos do contrato. */
  readonly tarifas: Centavos
  /** Seguro prestamista ou proteção financeira cobrada junto da parcela. */
  readonly seguroMensal: Centavos
}

export interface SaidaFinanciamentoDeVeiculo {
  readonly valorFinanciado: Centavos
  readonly valorFinanciadoComTarifas: Centavos
  readonly parcela: Centavos
  readonly totalPago: Centavos
  readonly custoAcimaDoPreco: Centavos
  readonly custoAcimaDoPrecoBp: BasisPoints
  readonly cetMensal: BasisPoints
  readonly cetAnual: BasisPoints
  /** Em quantas parcelas o que já saiu do bolso ultrapassa o preço à vista. */
  readonly mesesParaSuperarOPreco: number
}

export function calcularFinanciamentoDeVeiculo(
  entrada: EntradaFinanciamentoDeVeiculo,
  dataReferencia: DataISO,
): Resultado<SaidaFinanciamentoDeVeiculo> {
  if (entrada.precoDoVeiculo <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o preço do veículo para ver o resultado.',
    }
  }
  if (entrada.prazoMeses <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe em quantos meses o financiamento será pago para ver o resultado.',
    }
  }
  if (entrada.taxaMensalBp <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a taxa de juros mensal do contrato para ver o resultado.',
    }
  }

  const valorFinanciado = subtrair(entrada.precoDoVeiculo, entrada.entrada)
  if (valorFinanciado <= 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        'A entrada cobre o preço do veículo inteiro — não há financiamento a calcular. Reduza a ' +
        'entrada para simular o parcelamento.',
    }
  }

  const etapas: Etapa[] = []

  etapas.push({
    rotulo: 'Quanto será financiado',
    formula: `${reais(entrada.precoDoVeiculo)} de preço − ${reais(entrada.entrada)} de entrada`,
    resultado: valorFinanciado,
  })

  const valorFinanciadoComTarifas = somar(valorFinanciado, entrada.tarifas)
  if (entrada.tarifas > 0) {
    etapas.push({
      rotulo: 'Com as tarifas embutidas',
      formula: `${reais(valorFinanciado)} + ${reais(entrada.tarifas)} de cadastro, registro e IOF`,
      resultado: valorFinanciadoComTarifas,
      justificativa:
        'As tarifas não são pagas no ato: entram no valor financiado e passam a render juros ' +
        'junto com o resto. É a prática do mercado, e é uma das razões de o custo efetivo ficar ' +
        'acima da taxa anunciada.',
    })
  }

  const parcelaSemSeguro = parcelaPrice(
    valorFinanciadoComTarifas,
    entrada.prazoMeses,
    entrada.taxaMensalBp,
  )
  const parcela = somar(parcelaSemSeguro, entrada.seguroMensal)

  etapas.push({
    rotulo: 'Parcela',
    formula:
      `${reais(valorFinanciadoComTarifas)} em ${entrada.prazoMeses}× a ` +
      `${percentual(entrada.taxaMensalBp)} ao mês` +
      (entrada.seguroMensal > 0 ? `, mais ${reais(entrada.seguroMensal)} de seguro` : ''),
    resultado: parcela,
    fundamento: fundamentar(CDC_ART_52),
  })

  const totalDasParcelas = multiplicarPorInteiro(parcela, entrada.prazoMeses)
  const totalPago = somar(totalDasParcelas, entrada.entrada)

  etapas.push({
    rotulo: 'Quanto o carro custa no fim',
    formula: `${reais(entrada.entrada)} de entrada + ${entrada.prazoMeses} × ${reais(parcela)}`,
    resultado: totalPago,
  })

  const custoAcimaDoPreco = subtrair(totalPago, entrada.precoDoVeiculo)
  const custoAcimaDoPrecoBp = aliquotaEfetiva(
    custoAcimaDoPreco,
    entrada.precoDoVeiculo,
    'meio_para_cima',
  )

  etapas.push({
    rotulo: 'Quanto além do preço à vista',
    formula: `${reais(totalPago)} − ${reais(entrada.precoDoVeiculo)}`,
    resultado: custoAcimaDoPreco,
    justificativa:
      'É o preço de comprar hoje em vez de esperar. Comparar esse número com o rendimento do ' +
      'mesmo dinheiro no prazo é a conta que decide entre financiar e juntar.',
  })

  /**
   * O CET compara o fluxo das parcelas com o que o tomador de fato recebeu — o
   * carro, e não o valor com as tarifas dentro. É a definição da Resolução CMN
   * nº 4.881/2020, e é o que faz as tarifas aparecerem no custo.
   */
  const cetMensal = taxaInternaMensal(valorFinanciado, parcela, entrada.prazoMeses)
  const cetMensalBp = cetMensal ?? basisPoints(0)

  etapas.push({
    rotulo: 'Custo efetivo total ao mês',
    formula: `taxa que iguala ${entrada.prazoMeses} × ${reais(parcela)} a ${reais(valorFinanciado)}`,
    resultado: centavos(cetMensalBp),
    unidade: 'percentual',
    fundamento: fundamentar(RESOLUCAO_CMN_4881),
    justificativa:
      'O CET compara as parcelas com o que você de fato recebeu — o carro. Tarifas e seguro ' +
      'saem do seu bolso mas não voltam em veículo, e por isso empurram o custo para cima da ' +
      'taxa anunciada.',
  })

  const cetAnual = anualizar(cetMensalBp)

  /**
   * Em quantas parcelas o que já saiu do bolso passa do preço à vista. É a
   * tradução do custo em tempo, e costuma surpreender mais que o percentual.
   */
  let acumulado = entrada.entrada
  let mesesParaSuperarOPreco = 0
  for (let mes = 1; mes <= entrada.prazoMeses; mes += 1) {
    acumulado = somar(acumulado, parcela)
    if (acumulado > entrada.precoDoVeiculo) {
      mesesParaSuperarOPreco = mes
      break
    }
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      valorFinanciado,
      valorFinanciadoComTarifas,
      parcela,
      totalPago,
      custoAcimaDoPreco,
      custoAcimaDoPrecoBp,
      cetMensal: cetMensalBp,
      cetAnual,
      mesesParaSuperarOPreco,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-029 — Portabilidade de crédito
// ---------------------------------------------------------------------------

/**
 * **A armadilha da portabilidade é o PRAZO, não a taxa.**
 *
 * A proposta que chega mostra a parcela nova menor que a atual, e a conclusão
 * parece óbvia. Mas parcela menor com prazo maior custa mais no total, mesmo
 * com taxa menor — e é assim que se troca uma dívida cara e curta por uma
 * barata e longa que custa mais dinheiro.
 *
 * Por isso esta calculadora compara **os dois cenários no prazo que o usuário
 * informar** e diz explicitamente quando o prazo aumentou. Comparar só a
 * parcela é o erro que a página existe para desfazer.
 *
 * **A taxa do contrato ATUAL é descoberta, não perguntada** — a maioria das
 * pessoas não sabe qual é, e o extrato nem sempre traz. Ela sai do saldo
 * devedor, da parcela e do número de parcelas que faltam, pela mesma busca do
 * CET.
 */

export interface EntradaPortabilidade {
  /** O que falta pagar hoje, se quitasse — o banco é obrigado a informar. */
  readonly saldoDevedor: Centavos
  readonly parcelaAtual: Centavos
  readonly parcelasRestantes: number
  readonly novaTaxaMensalBp: BasisPoints
  readonly novoPrazoMeses: number
  /** IOF e tarifas da nova operação, quando houver. */
  readonly custosDaPortabilidade: Centavos
}

export interface SaidaPortabilidade {
  /** A taxa que o contrato atual cobra, descoberta pelo fluxo. */
  readonly taxaAtualBp: BasisPoints
  readonly novaParcela: Centavos
  readonly totalAtual: Centavos
  readonly totalNovo: Centavos
  readonly economia: Centavos
  readonly diferencaDeParcela: Centavos
  readonly cetNovoMensal: BasisPoints
  /** Verdadeiro quando o novo prazo é maior — a armadilha da proposta. */
  readonly prazoAumentou: boolean
  readonly mesesAMais: number
  /** O total da nova proposta se ela mantivesse o prazo atual. */
  readonly totalNovoNoMesmoPrazo: Centavos
}

export function calcularPortabilidade(
  entrada: EntradaPortabilidade,
  dataReferencia: DataISO,
): Resultado<SaidaPortabilidade> {
  if (entrada.saldoDevedor <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o saldo devedor de hoje para ver o resultado.',
    }
  }
  if (entrada.parcelaAtual <= 0 || entrada.parcelasRestantes <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a parcela atual e quantas ainda faltam para ver o resultado.',
    }
  }
  if (entrada.novaTaxaMensalBp <= 0 || entrada.novoPrazoMeses <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a taxa e o prazo da proposta nova para ver o resultado.',
    }
  }

  const etapas: Etapa[] = []

  const taxaAtual = taxaInternaMensal(
    entrada.saldoDevedor,
    entrada.parcelaAtual,
    entrada.parcelasRestantes,
  )
  const taxaAtualBp = taxaAtual ?? basisPoints(0)

  etapas.push({
    rotulo: 'Taxa que o seu contrato cobra hoje',
    formula:
      `taxa que iguala ${entrada.parcelasRestantes} × ${reais(entrada.parcelaAtual)} a ` +
      `${reais(entrada.saldoDevedor)}`,
    resultado: centavos(taxaAtualBp),
    unidade: 'percentual',
    fundamento: fundamentar(RESOLUCAO_CMN_4881),
    justificativa:
      'Ela é descoberta pelo fluxo, e não perguntada: quase ninguém sabe a taxa do próprio ' +
      'contrato, e é ela que a proposta nova precisa bater para valer a pena.',
  })

  const novoFinanciado = somar(entrada.saldoDevedor, entrada.custosDaPortabilidade)
  if (entrada.custosDaPortabilidade > 0) {
    etapas.push({
      rotulo: 'Quanto a nova operação financia',
      formula: `${reais(entrada.saldoDevedor)} + ${reais(entrada.custosDaPortabilidade)} de custos`,
      resultado: novoFinanciado,
    })
  }

  const novaParcela = parcelaPrice(novoFinanciado, entrada.novoPrazoMeses, entrada.novaTaxaMensalBp)
  etapas.push({
    rotulo: 'Parcela na proposta nova',
    formula:
      `${reais(novoFinanciado)} em ${entrada.novoPrazoMeses}× a ` +
      `${percentual(entrada.novaTaxaMensalBp)} ao mês`,
    resultado: novaParcela,
  })

  const totalAtual = multiplicarPorInteiro(entrada.parcelaAtual, entrada.parcelasRestantes)
  const totalNovo = multiplicarPorInteiro(novaParcela, entrada.novoPrazoMeses)

  etapas.push({
    rotulo: 'Total que falta pagar hoje',
    formula: `${entrada.parcelasRestantes} × ${reais(entrada.parcelaAtual)}`,
    resultado: totalAtual,
  })
  etapas.push({
    rotulo: 'Total pela proposta nova',
    formula: `${entrada.novoPrazoMeses} × ${reais(novaParcela)}`,
    resultado: totalNovo,
  })

  const economia = subtrair(totalAtual, totalNovo)
  etapas.push({
    rotulo: economia >= 0 ? 'Quanto a portabilidade economiza' : 'Quanto a portabilidade custa a mais',
    formula: `${reais(totalAtual)} − ${reais(totalNovo)}`,
    resultado: economia,
  })

  /**
   * A comparação honesta: a mesma proposta no PRAZO ATUAL. É ela que separa o
   * ganho de taxa do alívio de caixa — e que revela quando a economia anunciada
   * vem só de empurrar a dívida para a frente.
   */
  const parcelaNoMesmoPrazo = parcelaPrice(
    novoFinanciado,
    entrada.parcelasRestantes,
    entrada.novaTaxaMensalBp,
  )
  const totalNovoNoMesmoPrazo = multiplicarPorInteiro(
    parcelaNoMesmoPrazo,
    entrada.parcelasRestantes,
  )

  const prazoAumentou = entrada.novoPrazoMeses > entrada.parcelasRestantes
  if (prazoAumentou) {
    etapas.push({
      rotulo: 'A mesma taxa, mantendo o prazo atual',
      formula: `${entrada.parcelasRestantes} × ${reais(parcelaNoMesmoPrazo)}`,
      resultado: totalNovoNoMesmoPrazo,
      justificativa:
        'Prazo maior baixa a parcela e aumenta o total, mesmo com taxa menor. Esta linha mostra ' +
        'o que a taxa nova entrega sem alongar a dívida — é a comparação que separa ganho de ' +
        'juros de alívio de caixa.',
    })
  }

  const cetNovo = taxaInternaMensal(entrada.saldoDevedor, novaParcela, entrada.novoPrazoMeses)

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      taxaAtualBp,
      novaParcela,
      totalAtual,
      totalNovo,
      economia,
      diferencaDeParcela: subtrair(entrada.parcelaAtual, novaParcela),
      cetNovoMensal: cetNovo ?? basisPoints(0),
      prazoAumentou,
      mesesAMais: Math.max(0, entrada.novoPrazoMeses - entrada.parcelasRestantes),
      totalNovoNoMesmoPrazo,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-038 — Financiamento de reforma
// ---------------------------------------------------------------------------

/**
 * **O que impede esta calculadora de ser uma segunda CALC-024.**
 *
 * O CET simula UMA operação: o usuário já escolheu onde tomar o crédito e quer
 * saber quanto custa. Quem vai reformar não está nesse ponto — ele tem o
 * orçamento da obra na mão e várias portas abertas, com taxas que diferem por um
 * fator de cinco entre a mais barata e a mais cara.
 *
 * Esta página compara **as modalidades disponíveis para a MESMA obra**, e
 * acrescenta a porta que nenhum banco mostra: **esperar e pagar à vista**.
 *
 * **A afirmação que ela faz sobre o mundo, e que os próprios números do usuário
 * verificam:** a diferença entre modalidades costuma ser maior que qualquer
 * desconto negociável no material da obra. Quem passa uma tarde pesquisando piso
 * e assina o crédito mais caro da mesa perdeu dinheiro na conta que não olhou.
 *
 * **A alternativa de juntar não supõe rendimento por padrão.** Supor um
 * rendimento otimista enviesaria a comparação a favor de esperar; supor zero
 * enviesa a favor de financiar, mas é o cenário que o usuário controla — e a
 * taxa é campo dele, com zero como padrão declarado.
 */

export interface ModalidadeDeReforma {
  /** Como a linha aparece na tabela. */
  readonly rotulo: string
  readonly taxaMensalBp: BasisPoints
  /** Tarifas e tributos embutidos no valor financiado, quando houver. */
  readonly tarifas: Centavos
}

export interface LinhaDaModalidade {
  readonly rotulo: string
  readonly taxaMensalBp: BasisPoints
  readonly parcela: Centavos
  readonly totalPago: Centavos
  readonly custoDoCredito: Centavos
  readonly cetMensal: BasisPoints
}

export interface EntradaReforma {
  readonly valorDaObra: Centavos
  readonly prazoMeses: number
  readonly modalidades: readonly ModalidadeDeReforma[]
  /** Quanto dá para guardar por mês, para a alternativa de esperar. */
  readonly guardaPorMes: Centavos
  /** Rendimento mensal do que for guardado. Zero é o padrão declarado. */
  readonly rendimentoMensalBp: BasisPoints
}

export interface SaidaReforma {
  readonly linhas: readonly LinhaDaModalidade[]
  readonly maisBarata: LinhaDaModalidade
  readonly maisCara: LinhaDaModalidade
  /** Quanto separa a melhor porta da pior, no total pago. */
  readonly diferencaEntreModalidades: Centavos
  /** Em quantos meses o valor da obra é juntado. Zero quando não se guarda nada. */
  readonly mesesParaJuntar: number
  /** Verdadeiro quando juntar leva mais tempo que o prazo do financiamento. */
  readonly juntarDemoraMais: boolean
}

/** Teto da simulação de poupança: vinte anos. Guarda, não otimização. */
// eslint-disable-next-line no-restricted-syntax -- teto da simulação, não parâmetro legal
const LIMITE_DE_MESES_JUNTANDO = 240

export function calcularFinanciamentoDeReforma(
  entrada: EntradaReforma,
  dataReferencia: DataISO,
): Resultado<SaidaReforma> {
  if (entrada.valorDaObra <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quanto custa a obra para ver o resultado.',
    }
  }
  if (entrada.prazoMeses <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe em quantas parcelas você pretende pagar para ver o resultado.',
    }
  }

  const disponiveis = entrada.modalidades.filter((m) => m.taxaMensalBp > 0)
  if (disponiveis.length === 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe:
        'Informe a taxa mensal de ao menos uma modalidade de crédito para ver a comparação.',
    }
  }

  const etapas: Etapa[] = []

  const linhas: LinhaDaModalidade[] = disponiveis.map((m) => {
    const financiado = somar(entrada.valorDaObra, m.tarifas)
    const parcela = parcelaPrice(financiado, entrada.prazoMeses, m.taxaMensalBp)
    const totalPago = multiplicarPorInteiro(parcela, entrada.prazoMeses)
    /**
     * O CET compara o fluxo com o que o tomador recebeu — a obra, e não o valor
     * com as tarifas dentro. Mesma definição de CALC-024.
     */
    const cet = taxaInternaMensal(entrada.valorDaObra, parcela, entrada.prazoMeses)
    return {
      rotulo: m.rotulo,
      taxaMensalBp: m.taxaMensalBp,
      parcela,
      totalPago,
      custoDoCredito: subtrair(totalPago, entrada.valorDaObra),
      cetMensal: cet ?? basisPoints(0),
    }
  })

  const ordenadas = [...linhas].sort((a, b) => a.totalPago - b.totalPago)
  const maisBarata = ordenadas[0]
  const maisCara = ordenadas[ordenadas.length - 1]

  if (!maisBarata || !maisCara) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Nenhuma modalidade calculável.' }
  }

  for (const linha of linhas) {
    etapas.push({
      rotulo: `${linha.rotulo} — ${entrada.prazoMeses}× de ${reais(linha.parcela)}`,
      formula: `${reais(entrada.valorDaObra)} a ${percentual(linha.taxaMensalBp)} ao mês`,
      resultado: linha.totalPago,
      fundamento: fundamentar(RESOLUCAO_CMN_4881),
    })
  }

  const diferencaEntreModalidades = subtrair(maisCara.totalPago, maisBarata.totalPago)

  if (linhas.length > 1) {
    etapas.push({
      rotulo: 'Diferença entre a porta mais barata e a mais cara',
      formula: `${reais(maisCara.totalPago)} − ${reais(maisBarata.totalPago)}`,
      resultado: diferencaEntreModalidades,
      justificativa:
        'É a mesma obra, pelo mesmo prazo. A diferença sai inteira da escolha de onde tomar o ' +
        'crédito — e costuma ser maior que qualquer desconto negociável no material.',
    })
  }

  /**
   * A porta que nenhum banco mostra: guardar e pagar à vista. Sem rendimento
   * informado a conta é divisão pura, que é o cenário conservador.
   */
  let mesesParaJuntar = 0
  if (entrada.guardaPorMes > 0) {
    let acumulado = ZERO
    while (acumulado < entrada.valorDaObra && mesesParaJuntar < LIMITE_DE_MESES_JUNTANDO) {
      acumulado = somar(
        acumulado,
        entrada.guardaPorMes,
        jurosDoPeriodo(acumulado, entrada.rendimentoMensalBp),
      )
      mesesParaJuntar += 1
    }

    etapas.push({
      rotulo: 'Meses para juntar o valor da obra',
      formula:
        `${reais(entrada.guardaPorMes)} por mês` +
        (entrada.rendimentoMensalBp > 0
          ? `, rendendo ${percentual(entrada.rendimentoMensalBp)} ao mês`
          : ', sem rendimento'),
      resultado: centavos(mesesParaJuntar * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      justificativa:
        'Esperar é a alternativa que não aparece na mesa do banco. Ela custa tempo, e o que se ' +
        'economiza é exatamente o custo do crédito da coluna acima.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      linhas,
      maisBarata,
      maisCara,
      diferencaEntreModalidades,
      mesesParaJuntar,
      juntarDemoraMais: mesesParaJuntar > entrada.prazoMeses,
    },
    traco,
  }
}

export { basisPoints, centavos }
