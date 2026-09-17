/**
 * CALC-099 — Consórcio ou financiamento.
 *
 * **As duas contas não se comparam pela parcela.** O consórcio costuma ter
 * parcela menor e não entrega o bem no dia da assinatura; o financiamento
 * entrega, e cobra juros por isso. Comparar só o valor mensal responde à
 * pergunta errada.
 *
 * O que esta calculadora coloca lado a lado:
 *
 * 1. **quanto sai do bolso no total**, em cada caminho;
 * 2. **quando o bem chega** — no financiamento, agora; no consórcio, no mês da
 *    contemplação, que é premissa declarada e não promessa;
 * 3. **o custo embutido de cada um**: no consórcio, a taxa de administração e o
 *    fundo de reserva; no financiamento, os juros.
 *
 * **Nenhum parâmetro legal entra aqui** (`ADR-006`): taxa de administração,
 * fundo de reserva e juros são preço de mercado, e vêm do contrato que o
 * usuário tem na mão. O que a calculadora garante é a aritmética e a
 * comparabilidade — inclusive convertendo o consórcio em taxa mensal
 * equivalente, que é o número que o vendedor nunca mostra.
 */

import { anualizar, taxaInternaMensal, parcelaPrice } from '../financeira'
import { aplicarAliquota, multiplicarPorInteiro, proporcao, somar, subtrair } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

const POLITICA = 'meio_para_cima' as const

export interface EntradaConsorcio {
  /** Valor do bem — a carta de crédito, no consórcio. */
  readonly valorDoBem: Centavos
  readonly prazoMeses: number
  /** Taxa de administração TOTAL do consórcio, em basis points. */
  readonly taxaAdministracaoBp: BasisPoints
  /** Fundo de reserva, em basis points do valor da carta. */
  readonly fundoReservaBp: BasisPoints
  /** Mês previsto de contemplação. Zero significa "só no fim do grupo". */
  readonly mesDaContemplacao: number
  /** Entrada dada no financiamento. */
  readonly entradaFinanciamento: Centavos
  /** Juros do financiamento, ao mês, em basis points. */
  readonly jurosMensalBp: BasisPoints
}

export interface SaidaConsorcio {
  readonly parcelaConsorcio: Centavos
  readonly totalConsorcio: Centavos
  readonly custoDoConsorcio: Centavos
  /** Taxa mensal equivalente do consórcio, quando calculável. */
  readonly taxaEquivalenteConsorcioBp: BasisPoints | null
  readonly parcelaFinanciamento: Centavos
  readonly totalFinanciamento: Centavos
  readonly custoDoFinanciamento: Centavos
  readonly jurosAnualBp: BasisPoints
  /** Positivo quando o consórcio sai mais barato no total. */
  readonly diferencaTotal: Centavos
  readonly mesDaContemplacao: number
}

/** Prazo máximo aceito — sanidade de entrada, não regra legal. */
// eslint-disable-next-line no-restricted-syntax -- limite de entrada (quarenta anos), não parâmetro legal
const PRAZO_MAXIMO = 480

export function calcularConsorcioOuFinanciamento(
  entrada: EntradaConsorcio,
  dataReferencia: DataISO,
): Resultado<SaidaConsorcio> {
  if (entrada.valorDoBem <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor do bem ou da carta de crédito.' }
  }
  if (!Number.isInteger(entrada.prazoMeses) || entrada.prazoMeses <= 0 || entrada.prazoMeses > PRAZO_MAXIMO) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Informe o prazo em meses, de 1 até 480.' }
  }
  if (entrada.taxaAdministracaoBp < 0 || entrada.fundoReservaBp < 0 || entrada.jurosMensalBp < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Taxas e juros não podem ser negativos.' }
  }
  if (entrada.entradaFinanciamento < 0 || entrada.entradaFinanciamento >= entrada.valorDoBem) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A entrada precisa ser menor que o valor do bem — sem financiamento, não há o que comparar.',
    }
  }
  if (
    !Number.isInteger(entrada.mesDaContemplacao) ||
    entrada.mesDaContemplacao < 0 ||
    entrada.mesDaContemplacao > entrada.prazoMeses
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O mês da contemplação precisa caber no prazo do grupo.' }
  }
  if (entrada.jurosMensalBp <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe os juros mensais do financiamento para comparar.' }
  }

  const etapas: Etapa[] = []

  // -------------------------------------------------------------------------
  // Consórcio: sem juros, com taxa de administração e fundo de reserva
  // -------------------------------------------------------------------------
  const taxaAdministracao = aplicarAliquota(entrada.valorDoBem, entrada.taxaAdministracaoBp, POLITICA)
  const fundoReserva = aplicarAliquota(entrada.valorDoBem, entrada.fundoReservaBp, POLITICA)
  const totalConsorcio = somar(entrada.valorDoBem, taxaAdministracao, fundoReserva)
  const parcelaConsorcio = proporcao(totalConsorcio, 1, entrada.prazoMeses, POLITICA)
  const custoDoConsorcio = somar(taxaAdministracao, fundoReserva)

  etapas.push({
    rotulo: 'Consórcio — o que se paga além da carta',
    formula: `${reais(entrada.valorDoBem)} + ${reais(taxaAdministracao)} de taxa de administração + ${reais(fundoReserva)} de fundo de reserva`,
    resultado: totalConsorcio,
    justificativa:
      'Consórcio não cobra juros: cobra taxa de administração e, na maioria dos grupos, fundo de reserva. Os dois são percentuais sobre o valor da carta, diluídos nas parcelas.',
  })
  etapas.push({
    rotulo: 'Parcela do consórcio',
    formula: `${reais(totalConsorcio)} ÷ ${entrada.prazoMeses} meses`,
    resultado: parcelaConsorcio,
    justificativa:
      'A parcela real costuma ser reajustada pela variação do valor do bem ao longo do grupo — esta estimativa mantém o valor de hoje, e a diferença aparece para cima.',
  })

  /**
   * A taxa mensal equivalente do consórcio: o fluxo é o mesmo de um empréstimo
   * em que o "liberado" é a carta e as parcelas são as do plano. Ela só existe
   * quando o total pago supera a carta — e é o número que torna os dois
   * caminhos comparáveis.
   */
  const taxaEquivalenteConsorcioBp = taxaInternaMensal(entrada.valorDoBem, parcelaConsorcio, entrada.prazoMeses)
  if (taxaEquivalenteConsorcioBp !== null) {
    etapas.push({
      rotulo: 'Taxa mensal equivalente do consórcio',
      formula: `${reais(entrada.valorDoBem)} de carta contra ${entrada.prazoMeses} parcelas de ${reais(parcelaConsorcio)}`,
      resultado: centavos(taxaEquivalenteConsorcioBp),
      unidade: 'percentual',
      justificativa:
        'É a taxa que faria um empréstimo desse valor ter exatamente essas parcelas. Serve para comparar com os juros do financiamento — e supõe a carta disponível desde o início, o que no consórcio não acontece.',
    })
  }

  // -------------------------------------------------------------------------
  // Financiamento: juros sobre o valor financiado
  // -------------------------------------------------------------------------
  const valorFinanciado = subtrair(entrada.valorDoBem, entrada.entradaFinanciamento)
  const parcelaFinanciamento = parcelaPrice(valorFinanciado, entrada.prazoMeses, entrada.jurosMensalBp)
  const somaDasParcelas = multiplicarPorInteiro(parcelaFinanciamento, entrada.prazoMeses)
  const totalFinanciamento = somar(somaDasParcelas, entrada.entradaFinanciamento)
  const custoDoFinanciamento = subtrair(totalFinanciamento, entrada.valorDoBem)
  const jurosAnualBp = anualizar(entrada.jurosMensalBp)

  etapas.push({
    rotulo: 'Financiamento — parcela pela tabela Price',
    formula: `${reais(valorFinanciado)} financiados em ${entrada.prazoMeses} meses a ${percentual(entrada.jurosMensalBp)} ao mês`,
    resultado: parcelaFinanciamento,
  })
  etapas.push({
    rotulo: 'Financiamento — total desembolsado',
    formula:
      entrada.entradaFinanciamento > 0
        ? `${reais(entrada.entradaFinanciamento)} de entrada + ${entrada.prazoMeses} × ${reais(parcelaFinanciamento)}`
        : `${entrada.prazoMeses} × ${reais(parcelaFinanciamento)}`,
    resultado: totalFinanciamento,
    justificativa: `Juros de ${percentual(entrada.jurosMensalBp)} ao mês equivalem a ${percentual(jurosAnualBp)} ao ano. Seguro e tarifas do contrato não entram aqui — a calculadora de CET soma esses custos.`,
  })

  // -------------------------------------------------------------------------
  // A comparação
  // -------------------------------------------------------------------------
  const diferencaTotal = subtrair(totalFinanciamento, totalConsorcio)
  etapas.push({
    rotulo: 'Diferença no total pago',
    formula: `${reais(totalFinanciamento)} no financiamento contra ${reais(totalConsorcio)} no consórcio`,
    resultado: diferencaTotal,
    justificativa:
      entrada.mesDaContemplacao === 0
        ? 'A comparação de totais ignora uma diferença que não é financeira: no consórcio sem contemplação prevista, o bem só chega no fim do grupo.'
        : `No consórcio, o bem chega no mês ${entrada.mesDaContemplacao} — até lá, paga-se sem ter o bem. No financiamento, ele chega no primeiro dia.`,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }
  return {
    ok: true,
    valores: {
      parcelaConsorcio,
      totalConsorcio,
      custoDoConsorcio,
      taxaEquivalenteConsorcioBp: taxaEquivalenteConsorcioBp === null ? null : basisPoints(taxaEquivalenteConsorcioBp),
      parcelaFinanciamento,
      totalFinanciamento,
      custoDoFinanciamento,
      jurosAnualBp,
      diferencaTotal,
      mesDaContemplacao: entrada.mesDaContemplacao,
    },
    traco,
  }
}
