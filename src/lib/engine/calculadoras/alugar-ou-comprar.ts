/**
 * CALC-034 — Alugar vs. comprar: comparativo de longo prazo.
 *
 * A mais composta do catálogo, e a que mais depende de **premissa**. Por isso a
 * decisão de desenho mais importante dela não é de conta: é que **toda premissa
 * é campo**, e nenhuma vem embutida. Valorização do imóvel, rendimento da
 * carteira e reajuste do aluguel são três chutes sobre o futuro, e chutes
 * embutidos num motor viram conclusão com aparência de medição.
 *
 * O QUE O MODELO COMPARA, E POR QUE ASSIM
 *
 * Não é "prestação contra aluguel" — essa comparação é a que engana. Ela ignora
 * que quem compra está construindo patrimônio a cada amortização, e que quem
 * aluga tem, parado, o dinheiro da entrada e dos custos de aquisição.
 *
 * O que se compara é **patrimônio ao fim do prazo**:
 *
 *   Comprador  = valor do imóvel valorizado − saldo devedor que resta
 *   Locatário  = carteira, que começa com a entrada e os custos de aquisição
 *                que ele NÃO gastou, rende todo mês, e recebe (ou financia) a
 *                diferença entre os dois desembolsos mensais
 *
 * **A diferença anda nos dois sentidos**, e isso não é detalhe. Quando o aluguel
 * é mais barato que a prestação, o locatário investe a sobra; quando é mais
 * caro, ele tira da carteira para cobrir. Modelar só o primeiro sentido daria
 * vantagem sistemática ao aluguel — que é exatamente o viés que este tipo de
 * comparação costuma carregar.
 *
 * A VALORIZAÇÃO DE EQUILÍBRIO
 *
 * O número mais útil da página não é o patrimônio de nenhum dos dois: é **quanto
 * o imóvel precisaria valorizar ao ano para as duas pontas empatarem**. Ele
 * transforma a pergunta "qual é melhor" — que depende de três chutes — na
 * pergunta "o imóvel valoriza mais ou menos que isso", que é uma só, e sobre a
 * qual a pessoa tem opinião informada.
 *
 * Resolvido por bisseção, como `taxaInternaMensal` em `financeira.ts`.
 */

import { jurosDoPeriodo, parcelaPrice } from '../financeira'
import { dividirPorInteiro, naoNegativo, somar, subtrair } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type BasisPoints, type Centavos } from '../types'
import { taxaMensalEquivalente } from './juros-compostos'
import type { DataISO } from '../../params/tipos'

const MESES_NO_ANO = 12

export type SistemaDoFinanciamento = 'sac' | 'price'

export interface EntradaAlugarOuComprar {
  readonly valorDoImovel: Centavos
  readonly entrada: Centavos
  /** ITBI, cartório e avaliação — pagos uma vez, e que o locatário não paga. */
  readonly custosDeAquisicao: Centavos
  readonly prazoFinanciamentoMeses: number
  readonly taxaFinanciamentoMensal: BasisPoints
  readonly sistema: SistemaDoFinanciamento
  /** O que só o dono paga por mês: manutenção, seguro, IPTU quando é dele. */
  readonly custosDoDonoMensais: Centavos
  readonly aluguelMensal: Centavos
  /** Premissas, todas ao ano. */
  readonly reajusteAluguelAnualBp: BasisPoints
  readonly valorizacaoAnualBp: BasisPoints
  readonly rendimentoCarteiraAnualBp: BasisPoints
  readonly anos: number
}

export interface SaidaAlugarOuComprar {
  readonly patrimonioComprador: Centavos
  readonly patrimonioLocatario: Centavos
  /** Positiva quando comprar sai à frente. */
  readonly diferenca: Centavos
  readonly valorDoImovelNoFim: Centavos
  readonly saldoDevedorNoFim: Centavos
  readonly totalDesembolsadoComprando: Centavos
  readonly totalDesembolsadoAlugando: Centavos
  readonly primeiraPrestacao: Centavos
  /** Quanto o imóvel precisaria valorizar ao ano para empatar. */
  readonly valorizacaoDeEquilibrioBp: BasisPoints | null
}

interface Resultado2 {
  readonly patrimonioComprador: Centavos
  readonly patrimonioLocatario: Centavos
  readonly valorDoImovelNoFim: Centavos
  readonly saldoDevedorNoFim: Centavos
  readonly totalComprando: Centavos
  readonly totalAlugando: Centavos
  readonly primeiraPrestacao: Centavos
}

/**
 * Roda os dois caminhos, mês a mês, sob a mesma premissa de valorização.
 *
 * Separada da função pública para que a bisseção da valorização de equilíbrio
 * possa reexecutá-la sem repetir validação nem montar traço — o traço é caro e
 * a busca a chamaria quarenta vezes.
 */
function simular(
  entrada: EntradaAlugarOuComprar,
  valorizacaoAnualBp: BasisPoints,
): Resultado2 {
  const meses = entrada.anos * MESES_NO_ANO
  const financiado = naoNegativo(subtrair(entrada.valorDoImovel, entrada.entrada))

  const valorizacaoMensal = taxaMensalEquivalente(valorizacaoAnualBp, true)
  const rendimentoMensal = taxaMensalEquivalente(entrada.rendimentoCarteiraAnualBp, true)

  const parcelaConstante = parcelaPrice(
    financiado,
    entrada.prazoFinanciamentoMeses,
    entrada.taxaFinanciamentoMensal,
  )
  const amortizacaoConstante =
    entrada.prazoFinanciamentoMeses > 0
      ? dividirPorInteiro(financiado, entrada.prazoFinanciamentoMeses, 'meio_para_cima')
      : ZERO

  let saldo: Centavos = financiado
  let valorDoImovel: Centavos = entrada.valorDoImovel
  let aluguel: Centavos = entrada.aluguelMensal
  let totalComprando: Centavos = somar(entrada.entrada, entrada.custosDeAquisicao)
  let totalAlugando: Centavos = ZERO
  let primeiraPrestacao: Centavos = ZERO

  /**
   * A carteira do locatário começa com o que ele **não** gastou para comprar.
   *
   * Esquecer isso é o erro mais comum da comparação: quem aluga não fica só com
   * a diferença mensal, fica também com a entrada e os custos de aquisição
   * rendendo desde o primeiro dia.
   */
  let carteira: Centavos = somar(entrada.entrada, entrada.custosDeAquisicao)

  for (let mes = 1; mes <= meses; mes += 1) {
    // --- O comprador ---
    let prestacao: Centavos = ZERO
    if (saldo > 0 && mes <= entrada.prazoFinanciamentoMeses) {
      const juros = jurosDoPeriodo(saldo, entrada.taxaFinanciamentoMensal)
      const amortiza =
        mes === entrada.prazoFinanciamentoMeses
          ? saldo
          : entrada.sistema === 'sac'
            ? amortizacaoConstante
            : naoNegativo(subtrair(parcelaConstante, juros))
      prestacao = somar(amortiza, juros)
      saldo = naoNegativo(subtrair(saldo, amortiza))
    }

    const desembolsoComprador = somar(prestacao, entrada.custosDoDonoMensais)
    totalComprando = somar(totalComprando, desembolsoComprador)
    if (mes === 1) primeiraPrestacao = prestacao

    // --- O locatário ---
    totalAlugando = somar(totalAlugando, aluguel)

    /**
     * A carteira rende primeiro e só então recebe o fluxo do mês — mesma
     * convenção de `juros-compostos.ts`, e a mais conservadora.
     */
    carteira = somar(carteira, jurosDoPeriodo(carteira, rendimentoMensal))
    carteira = centavos(carteira + desembolsoComprador - aluguel)

    // --- O tempo passa ---
    valorDoImovel = somar(valorDoImovel, jurosDoPeriodo(valorDoImovel, valorizacaoMensal))
    if (mes % MESES_NO_ANO === 0) {
      aluguel = somar(aluguel, jurosDoPeriodo(aluguel, entrada.reajusteAluguelAnualBp))
    }
  }

  return {
    patrimonioComprador: centavos(valorDoImovel - saldo),
    patrimonioLocatario: carteira,
    valorDoImovelNoFim: valorDoImovel,
    saldoDevedorNoFim: saldo,
    totalComprando,
    totalAlugando,
    primeiraPrestacao,
  }
}

export function compararAlugarOuComprar(
  entrada: EntradaAlugarOuComprar,
  dataReferencia: DataISO,
): Resultado<SaidaAlugarOuComprar> {
  if (entrada.valorDoImovel <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor do imóvel para ver o resultado.',
    }
  }
  if (entrada.aluguelMensal <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o aluguel do imóvel equivalente para ver o resultado.',
    }
  }
  if (!Number.isInteger(entrada.anos) || entrada.anos < 1) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o horizonte da comparação, em anos.',
    }
  }
  if (entrada.entrada > entrada.valorDoImovel) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A entrada não pode superar o valor do imóvel.',
    }
  }
  if (entrada.prazoFinanciamentoMeses < 0 || entrada.taxaFinanciamentoMensal < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Prazo e taxa não podem ser negativos.' }
  }

  const r = simular(entrada, entrada.valorizacaoAnualBp)
  const diferenca = subtrair(r.patrimonioComprador, r.patrimonioLocatario)

  const etapas: Etapa[] = []

  etapas.push({
    rotulo: 'O que o comprador desembolsa de entrada',
    formula: `${reais(entrada.entrada)} de entrada + ${reais(entrada.custosDeAquisicao)} de custos de aquisição`,
    resultado: somar(entrada.entrada, entrada.custosDeAquisicao),
    justificativa:
      'É exatamente este dinheiro que o locatário NÃO gasta, e que por isso começa a render na ' +
      'carteira dele desde o primeiro mês. Esquecer isso é o erro mais comum da comparação.',
  })

  etapas.push({
    rotulo: 'Primeira prestação do financiamento',
    formula:
      entrada.sistema === 'sac'
        ? `${reais(naoNegativo(subtrair(entrada.valorDoImovel, entrada.entrada)))} ÷ ${entrada.prazoFinanciamentoMeses}, mais juros sobre o saldo`
        : `Prestação constante do sistema francês a ${percentual(entrada.taxaFinanciamentoMensal)} ao mês`,
    resultado: r.primeiraPrestacao,
  })

  etapas.push({
    rotulo: `Patrimônio de quem comprou, em ${entrada.anos} anos`,
    formula: `${reais(r.valorDoImovelNoFim)} de imóvel − ${reais(r.saldoDevedorNoFim)} que ainda se deve`,
    resultado: r.patrimonioComprador,
    justificativa:
      `O imóvel valorizando ${percentual(entrada.valorizacaoAnualBp)} ao ano — que é premissa ` +
      'sua, e não projeção desta calculadora.',
  })

  etapas.push({
    rotulo: `Patrimônio de quem alugou, em ${entrada.anos} anos`,
    formula:
      `Carteira iniciada com ${reais(somar(entrada.entrada, entrada.custosDeAquisicao))}, ` +
      `rendendo ${percentual(entrada.rendimentoCarteiraAnualBp)} ao ano e recebendo a diferença mensal`,
    resultado: r.patrimonioLocatario,
    justificativa:
      'A diferença entre os dois desembolsos entra na carteira quando o aluguel é mais barato ' +
      'que a prestação, e sai dela quando é mais caro. Modelar só um dos sentidos daria ' +
      'vantagem sistemática a um dos lados.',
  })

  etapas.push({
    rotulo: diferenca >= 0 ? 'Vantagem de comprar' : 'Vantagem de alugar',
    formula: `${reais(r.patrimonioComprador)} − ${reais(r.patrimonioLocatario)}`,
    resultado: diferenca,
  })

  /**
   * A valorização que faz as duas pontas empatarem.
   *
   * Bisseção entre −50% e +50% ao ano. O patrimônio do comprador cresce
   * monotonicamente com a valorização e o do locatário não depende dela, então a
   * diferença é monótona e a busca termina sempre.
   *
   * Devolve `null` quando nem o extremo superior alcança o empate — caso em que
   * dizer "não há valorização que resolva" é mais honesto que devolver o teto da
   * busca como se fosse resposta.
   */
  // eslint-disable-next-line no-restricted-syntax -- limites da busca, não parâmetro legal
  let piso = -5_000
  // eslint-disable-next-line no-restricted-syntax -- limites da busca, não parâmetro legal
  let teto = 5_000

  const diferencaEm = (bp: number): number => {
    const s = simular(entrada, bp as BasisPoints)
    return s.patrimonioComprador - s.patrimonioLocatario
  }

  let valorizacaoDeEquilibrioBp: BasisPoints | null = null
  if (diferencaEm(piso) < 0 && diferencaEm(teto) > 0) {
    for (let passo = 0; passo < 40; passo += 1) {
      if (teto - piso <= 1) break
      const meio = Math.trunc((piso + teto) / 2)
      if (diferencaEm(meio) < 0) piso = meio
      else teto = meio
    }
    valorizacaoDeEquilibrioBp = (Math.abs(diferencaEm(piso)) <= Math.abs(diferencaEm(teto))
      ? piso
      : teto) as BasisPoints

    etapas.push({
      rotulo: 'Valorização anual que faria as duas pontas empatarem',
      formula: `A que iguala os dois patrimônios ao fim de ${entrada.anos} anos`,
      resultado: centavos(valorizacaoDeEquilibrioBp),
      unidade: 'percentual',
      justificativa:
        'É o número mais útil da página. Ele troca a pergunta "qual é melhor", que depende de ' +
        'três premissas, pela pergunta "o imóvel valoriza mais ou menos que isso" — que é uma ' +
        'só, e sobre a qual você tem opinião informada.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      patrimonioComprador: r.patrimonioComprador,
      patrimonioLocatario: r.patrimonioLocatario,
      diferenca,
      valorDoImovelNoFim: r.valorDoImovelNoFim,
      saldoDevedorNoFim: r.saldoDevedorNoFim,
      totalDesembolsadoComprando: r.totalComprando,
      totalDesembolsadoAlugando: r.totalAlugando,
      primeiraPrestacao: r.primeiraPrestacao,
      valorizacaoDeEquilibrioBp,
    },
    traco,
  }
}
