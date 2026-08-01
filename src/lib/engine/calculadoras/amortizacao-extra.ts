/**
 * CALC-036 — Amortização extra no financiamento: reduzir prazo ou reduzir parcela.
 *
 * **Por que não é CALC-026 de novo.** A quitação antecipada parte do *valor da
 * parcela* e do número de parcelas que faltam, e deduz o saldo devedor trazendo
 * as parcelas a valor presente (art. 52, § 2º do CDC). Isso pressupõe parcela
 * constante — ou seja, sistema francês. Num financiamento imobiliário no SAC as
 * parcelas **não são iguais**, e a pergunta de quem tem um extrato na mão é
 * outra: o extrato já traz o **saldo devedor**, e o que falta saber é o que
 * acontece com ele.
 *
 * **E a comparação é a razão de a página existir** (`docs/18` §3.2). CALC-026
 * pede que o usuário escolha a modalidade antes de ver o resultado; aqui as duas
 * aparecem lado a lado, porque a escolha é justamente o que ele veio decidir — e
 * o banco costuma oferecer só uma delas sem dizer que a outra existe.
 *
 * Sem parâmetro legal: tudo o que entra é digitado.
 */

import { jurosDoPeriodo, parcelaPrice } from '../financeira'
import { dividirPorInteiro, maximo, minimo, somar, subtrair } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/** Escala das etapas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

export type SistemaDoContrato = 'sac' | 'price'

export interface EntradaAmortizacaoExtra {
  /** O que o extrato do financiamento mostra como devido hoje. */
  readonly saldoDevedor: Centavos
  readonly prazoRestanteMeses: number
  readonly taxaMensal: BasisPoints
  readonly sistema: SistemaDoContrato
  /** Quanto se pretende amortizar agora, fora da parcela do mês. */
  readonly valorExtra: Centavos
}

export interface SaidaAmortizacaoExtra {
  readonly totalSemAmortizar: Centavos
  /** O extra de fato aplicado — limitado ao saldo, porque não se paga além dele. */
  readonly valorAmortizado: Centavos
  readonly quitacaoTotal: boolean
  readonly totalReduzindoPrazo: Centavos
  readonly totalReduzindoParcela: Centavos
  readonly economiaPrazo: Centavos
  readonly economiaParcela: Centavos
  /** Quanto a escolha certa vale sobre a outra. */
  readonly diferencaEntreEscolhas: Centavos
  readonly novoPrazo: number
  readonly mesesEliminados: number
  readonly parcelaOriginal: Centavos
  readonly novaParcela: Centavos
}

interface Plano {
  readonly total: Centavos
  readonly meses: number
  readonly primeiraParcela: Centavos
}

/**
 * Roda a amortização mês a mês, com a política de quanto amortizar por mês.
 *
 * Simulação e não fórmula fechada pelo mesmo motivo de `amortizarAteZerar` em
 * `credito.ts`: é assim que o banco apura, e é a única forma de a última parcela
 * sair certa — ela liquida o que sobrou e quase nunca é igual às demais.
 *
 * `limite` não é otimização, é guarda: uma política que amortizasse zero deixaria
 * o saldo parado e o laço não terminaria.
 */
function correr(
  saldoInicial: Centavos,
  taxa: BasisPoints,
  limite: number,
  quantoAmortizar: (saldo: Centavos, juros: Centavos, mes: number) => Centavos,
): Plano {
  let saldo = saldoInicial
  let total: Centavos = ZERO
  let meses = 0
  let primeiraParcela: Centavos = ZERO

  while (saldo > 0 && meses < limite) {
    const juros = jurosDoPeriodo(saldo, taxa)
    const desejada = quantoAmortizar(saldo, juros, meses + 1)
    // Nunca além do saldo — é o que faz a última parcela liquidar o contrato.
    const amortiza = minimo(maximo(desejada, ZERO), saldo)
    if (amortiza === 0) break

    const parcela = somar(amortiza, juros)
    saldo = subtrair(saldo, amortiza)
    total = somar(total, parcela)
    meses += 1
    if (meses === 1) primeiraParcela = parcela
  }

  return { total, meses, primeiraParcela }
}

/**
 * A política do contrato: amortizar em `prazo` meses, no sistema dado.
 *
 * O desvio do último mês existe porque a divisão do SAC e a prestação do Price
 * são arredondadas ao centavo: o que sobra dessa fração não desaparece, ele
 * entra na última cobrança.
 */
function politicaDoPrazo(
  saldo: Centavos,
  prazo: number,
  taxa: BasisPoints,
  sistema: SistemaDoContrato,
): (saldoAtual: Centavos, juros: Centavos, mes: number) => Centavos {
  if (sistema === 'sac') {
    const constante = dividirPorInteiro(saldo, prazo, 'meio_para_cima')
    return (saldoAtual, _juros, mes) => (mes >= prazo ? saldoAtual : constante)
  }
  const parcela = parcelaPrice(saldo, prazo, taxa)
  return (saldoAtual, juros, mes) => (mes >= prazo ? saldoAtual : subtrair(parcela, juros))
}

/**
 * A política de manter o ritmo de pagamento do contrato — que é o que reduzir o
 * prazo significa: a prestação não muda, e o contrato acaba antes.
 */
function politicaDoRitmo(
  saldoOriginal: Centavos,
  prazo: number,
  taxa: BasisPoints,
  sistema: SistemaDoContrato,
): (saldoAtual: Centavos, juros: Centavos, mes: number) => Centavos {
  if (sistema === 'sac') {
    const constante = dividirPorInteiro(saldoOriginal, prazo, 'meio_para_cima')
    return () => constante
  }
  const parcela = parcelaPrice(saldoOriginal, prazo, taxa)
  return (_saldoAtual, juros) => subtrair(parcela, juros)
}

export function calcularAmortizacaoExtra(
  entrada: EntradaAmortizacaoExtra,
  dataReferencia: DataISO,
): Resultado<SaidaAmortizacaoExtra> {
  if (entrada.saldoDevedor <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o saldo devedor para ver o resultado.',
    }
  }
  if (entrada.prazoRestanteMeses <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quantos meses ainda faltam para ver o resultado.',
    }
  }
  if (entrada.taxaMensal < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A taxa não pode ser negativa.' }
  }
  if (entrada.valorExtra <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quanto você pretende amortizar para ver o resultado.',
    }
  }

  const n = entrada.prazoRestanteMeses
  const taxa = entrada.taxaMensal
  const sistema = entrada.sistema
  const nomeDoSistema = sistema === 'sac' ? 'SAC' : 'Price'
  const etapas: Etapa[] = []

  // --- O contrato como está ---
  const contrato = correr(
    entrada.saldoDevedor,
    taxa,
    n,
    politicaDoPrazo(entrada.saldoDevedor, n, taxa, sistema),
  )

  etapas.push({
    rotulo: 'Prestação atual do contrato',
    formula:
      sistema === 'sac'
        ? `${reais(entrada.saldoDevedor)} ÷ ${n} de amortização, mais ${percentual(taxa)} sobre o saldo`
        : `${reais(entrada.saldoDevedor)} distribuídos em ${n} parcelas a ${percentual(taxa)} ao mês`,
    resultado: contrato.primeiraParcela,
  })

  etapas.push({
    rotulo: 'Total a pagar seguindo o contrato até o fim',
    formula: `Soma das ${n} prestações que faltam, no sistema ${nomeDoSistema}`,
    resultado: contrato.total,
    justificativa:
      'É o que sai do seu bolso se nada for antecipado. Ele é maior que o saldo devedor ' +
      'porque dentro de cada prestação futura ainda há juros a correr.',
  })

  // --- A amortização de hoje ---
  const valorAmortizado = minimo(entrada.valorExtra, entrada.saldoDevedor)
  const quitacaoTotal = valorAmortizado >= entrada.saldoDevedor
  const novoSaldo = subtrair(entrada.saldoDevedor, valorAmortizado)

  etapas.push({
    rotulo: 'Saldo depois da amortização extra',
    formula: `${reais(entrada.saldoDevedor)} − ${reais(valorAmortizado)}`,
    resultado: novoSaldo,
    justificativa:
      'A amortização extra abate o saldo devedor direto, sem juros por cima — é dinheiro que ' +
      'deixa de render juros para o banco a partir de hoje.',
  })

  // --- Escolha 1: reduzir o prazo ---
  const comPrazoMenor = correr(
    novoSaldo,
    taxa,
    n,
    politicaDoRitmo(entrada.saldoDevedor, n, taxa, sistema),
  )
  const totalReduzindoPrazo = somar(valorAmortizado, comPrazoMenor.total)
  const novoPrazo = comPrazoMenor.meses
  const mesesEliminados = n - novoPrazo

  etapas.push({
    rotulo: 'Escolha 1 — manter a prestação e encurtar o contrato',
    formula:
      `${reais(novoSaldo)} amortizado no ritmo atual: ${novoPrazo} prestações no lugar de ${n}`,
    resultado: centavos(mesesEliminados * CENTESIMOS_POR_UNIDADE),
    unidade: 'numero',
    justificativa:
      `São ${mesesEliminados} meses eliminados do fim do contrato — e cada mês que deixa de ` +
      'existir é um mês inteiro de juros que deixa de ser cobrado. É por isso que esta ' +
      'escolha economiza mais.',
  })

  // --- Escolha 2: reduzir a parcela ---
  const comParcelaMenor = correr(
    novoSaldo,
    taxa,
    n,
    politicaDoPrazo(novoSaldo, n, taxa, sistema),
  )
  const totalReduzindoParcela = somar(valorAmortizado, comParcelaMenor.total)

  etapas.push({
    rotulo: 'Escolha 2 — manter o prazo e baixar a prestação',
    formula:
      `${reais(novoSaldo)} redistribuído nas mesmas ${n} prestações: ` +
      `${reais(contrato.primeiraParcela)} passa a ${reais(comParcelaMenor.primeiraParcela)}`,
    resultado: comParcelaMenor.primeiraParcela,
    justificativa:
      'O contrato continua correndo pelo mesmo tempo, e o alívio aparece todo mês. Economiza ' +
      'menos que encurtar o prazo, e é a escolha que faz sentido quando o problema é o ' +
      'orçamento agora, não o custo total.',
  })

  // --- O que cada escolha vale ---
  const economiaPrazo = subtrair(contrato.total, totalReduzindoPrazo)
  const economiaParcela = subtrair(contrato.total, totalReduzindoParcela)
  const diferencaEntreEscolhas = subtrair(economiaPrazo, economiaParcela)

  etapas.push({
    rotulo: 'Economia ao reduzir o prazo',
    formula: `${reais(contrato.total)} − ${reais(totalReduzindoPrazo)}`,
    resultado: economiaPrazo,
  })

  etapas.push({
    rotulo: 'Economia ao reduzir a parcela',
    formula: `${reais(contrato.total)} − ${reais(totalReduzindoParcela)}`,
    resultado: economiaParcela,
  })

  etapas.push({
    rotulo: 'Quanto a escolha certa vale',
    formula: `${reais(economiaPrazo)} − ${reais(economiaParcela)}`,
    resultado: diferencaEntreEscolhas,
    justificativa:
      'Com o mesmo dinheiro, no mesmo dia. A diferença é só a de para onde a folga foi ' +
      'direcionada — e o banco costuma oferecer uma das duas sem mencionar a outra.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      totalSemAmortizar: contrato.total,
      valorAmortizado,
      quitacaoTotal,
      totalReduzindoPrazo,
      totalReduzindoParcela,
      economiaPrazo,
      economiaParcela,
      diferencaEntreEscolhas,
      novoPrazo,
      mesesEliminados,
      parcelaOriginal: contrato.primeiraParcela,
      novaParcela: comParcelaMenor.primeiraParcela,
    },
    traco,
  }
}
