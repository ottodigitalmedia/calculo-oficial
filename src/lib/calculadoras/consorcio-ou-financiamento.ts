/**
 * CALC-099 — Consórcio ou financiamento.
 *
 * A propaganda compara parcelas; a decisão depende de três números que ela não
 * mostra: o total pago, o custo embutido e quando o bem chega. A página põe os
 * três lado a lado — e converte o consórcio em taxa mensal equivalente, que é o
 * único jeito honesto de comparar com os juros do banco.
 *
 * Motor em `engine/calculadoras/consorcio.ts`.
 */

import { calcularConsorcioOuFinanciamento } from '../engine/calculadoras/consorcio'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularConsorcioOuFinanciamento(
    {
      valorDoBem: centavos(numero(valores, 'valorDoBem')),
      prazoMeses: numero(valores, 'prazo'),
      taxaAdministracaoBp: basisPoints(numero(valores, 'taxaAdministracao')),
      fundoReservaBp: basisPoints(numero(valores, 'fundoReserva')),
      mesDaContemplacao: numero(valores, 'contemplacao'),
      entradaFinanciamento: centavos(numero(valores, 'entrada')),
      jurosMensalBp: basisPoints(numero(valores, 'juros')),
    },
    dataReferencia,
  )
  if (!r.ok) return r
  const v = r.valores

  const consorcioSaiMaisBarato = v.diferencaTotal > 0

  const destaques: Destaque[] = [
    { rotulo: 'Parcela do consórcio', valor: formatarReal(v.parcelaConsorcio) },
    { rotulo: 'Parcela do financiamento', valor: formatarReal(v.parcelaFinanciamento) },
    ...(v.taxaEquivalenteConsorcioBp !== null
      ? [
          {
            rotulo: 'Taxa equivalente do consórcio',
            valor: `${formatarPercentual(v.taxaEquivalenteConsorcioBp)} ao mês`,
          },
        ]
      : []),
    { rotulo: 'Juros do financiamento ao ano', valor: formatarPercentual(v.jurosAnualBp) },
    {
      rotulo: 'Quando o bem chega',
      valor:
        v.mesDaContemplacao === 0
          ? 'Consórcio: fim do grupo · Financiamento: agora'
          : `Consórcio: mês ${v.mesDaContemplacao} · Financiamento: agora`,
    },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: consorcioSaiMaisBarato ? v.totalConsorcio : v.totalFinanciamento,
      detalhamento: [
        { rotulo: 'Total pago no consórcio', valor: v.totalConsorcio, sinal: 'neutro' },
        { rotulo: 'Custo do consórcio — taxa e fundo', valor: v.custoDoConsorcio, sinal: 'debito' },
        { rotulo: 'Total pago no financiamento', valor: v.totalFinanciamento, sinal: 'neutro' },
        { rotulo: 'Custo do financiamento — juros', valor: v.custoDoFinanciamento, sinal: 'debito' },
      ],
      destaques,
      notas: [
        consorcioSaiMaisBarato
          ? 'Pelos números informados, o consórcio custa menos no total — mas o bem só chega na contemplação, e é isso que a comparação de totais não mede.'
          : 'Pelos números informados, o financiamento custa menos no total, e ainda entrega o bem no primeiro dia.',
        'A parcela do consórcio costuma ser reajustada pela variação do preço do bem ao longo do grupo. Esta ' +
          'estimativa mantém o valor de hoje: na prática, a parcela tende a subir.',
        'Seguro, tarifas e lance não entram aqui. Para somar os custos de um contrato de crédito, use a ' +
          'calculadora de CET.',
        'Contemplação por sorteio não tem data garantida. Se o plano depende de lance, o valor do lance muda a ' +
          'conta — e ele não está nesta estimativa.',
      ],
    },
  }
}

export const CONSORCIO_OU_FINANCIAMENTO: DefinicaoCalculadora = {
  id: 'CALC-099',
  slug: 'consorcio-ou-financiamento',
  nome: 'Consórcio ou financiamento',
  linhaDeContexto: 'O total de cada caminho, o custo embutido e quando o bem chega em cada um.',
  descricaoSeo:
    'Compare consórcio e financiamento: parcela, total pago, taxa de administração contra juros e a taxa mensal equivalente do consórcio.',

  campos: [
    {
      id: 'valorDoBem',
      rotulo: 'Valor do bem ou da carta de crédito',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'prazo',
      rotulo: 'Prazo, em meses',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 60,
      minimo: 1,
      maximo: 480,
      ajuda: 'Use o mesmo prazo nos dois caminhos para a comparação fazer sentido.',
    },
    {
      id: 'taxaAdministracao',
      rotulo: 'Taxa de administração total do consórcio',
      tipo: 'percentual',
      padrao: 1_800,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Percentual sobre o valor da carta, somando todo o grupo. Está na proposta da administradora.',
    },
    {
      id: 'fundoReserva',
      rotulo: 'Fundo de reserva',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Nem todo grupo cobra. Também é percentual sobre a carta.',
    },
    {
      id: 'contemplacao',
      rotulo: 'Mês previsto de contemplação',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 480,
      ajuda: 'Zero significa "só no fim do grupo". Sorteio não tem data garantida — use uma hipótese sua.',
    },
    {
      id: 'entrada',
      rotulo: 'Entrada no financiamento',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
    },
    {
      id: 'juros',
      rotulo: 'Juros do financiamento, ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      padrao: 150,
      minimo: 1,
      maximo: 2_000,
      ajuda: 'A taxa da proposta do banco. Se só souber a anual, divida mentalmente por doze para uma ideia — e confira a mensal no contrato.',
    },
  ],

  // Preço de contrato, não norma: nenhum parâmetro legal entra nesta conta.
  parametrosRequeridos: [],

  rotuloResultado: 'Total do caminho mais barato',

  calcular,

  faq: [
    {
      pergunta: 'Consórcio é sempre mais barato que financiamento?',
      resposta:
        'Não. O consórcio não cobra juros, mas cobra taxa de administração e, em muitos grupos, fundo de reserva — e esses percentuais podem superar os juros de um financiamento barato. O que decide é a comparação dos totais, com o mesmo prazo e o mesmo valor de bem.',
    },
    {
      pergunta: 'O que é a taxa equivalente do consórcio?',
      resposta:
        'É a taxa de juros mensal que produziria exatamente as parcelas do seu plano de consórcio, se o valor da carta estivesse disponível desde o início. Serve para comparar com a taxa do banco em pé de igualdade — e costuma surpreender quem ouviu que "consórcio não tem juros".',
    },
    {
      pergunta: 'Por que o momento da contemplação importa tanto?',
      resposta:
        'Porque no financiamento o bem é seu desde o primeiro dia, e no consórcio você paga meses antes de recebê-lo. Se o bem é um imóvel para morar, esse intervalo tem custo — o aluguel que continua sendo pago. Se é um carro para trabalhar, é receita que não entra.',
    },
    {
      pergunta: 'E o lance?',
      resposta:
        'O lance antecipa a contemplação e muda a conta: ele exige dinheiro disponível e, dependendo da regra do grupo, abate parcelas ou reduz o prazo. Esta estimativa não modela lance — ela compara o plano sem ele, que é o piso da comparação.',
    },
    {
      pergunta: 'A parcela do consórcio é fixa?',
      resposta:
        'Não costuma ser. Os contratos preveem reajuste pela variação do preço do bem, para que a carta continue comprando o mesmo bem no fim do grupo. Esta calculadora trabalha com o valor de hoje, e o total real tende a ficar acima do estimado.',
    },
    {
      pergunta: 'O que mais entra no custo de um financiamento?',
      resposta:
        'Seguros obrigatórios, tarifa de avaliação e outras cobranças do contrato. Elas não aparecem na taxa de juros, mas aparecem no custo efetivo total — e a calculadora de CET existe justamente para somá-las.',
    },
  ],

  relacionadas: ['cet-custo-efetivo-total', 'financiamento-de-veiculo', 'financiamento-imobiliario', 'amortizacao-sac-price'],
}
