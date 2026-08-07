/**
 * Guia — "SAC ou Price: a diferença aparece na primeira parcela".
 *
 * Terceiro do bloco de crédito, e o que cobre mais calculadoras: os três
 * financiamentos e a tabela de amortização.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1) — e aqui não há valor legal
 * nenhum: os dois sistemas são aritmética, não norma.
 */

import type { Guia } from './tipos'

export const SAC_OU_PRICE: Guia = {
  slug: 'sac-ou-price',
  titulo: 'SAC ou Price: a diferença aparece na primeira parcela',
  subtitulo:
    'Os dois sistemas pagam a mesma dívida com a mesma taxa. O que muda é quando você paga — e quanto paga no total.',
  descricaoSeo:
    'A diferença entre os sistemas SAC e Price de amortização: por que a primeira parcela do SAC é maior, por que o total pago é menor, e qual dos dois escolher.',
  atualizadoEm: '2026-08-07',
  calculadoras: [
    'amortizacao-sac-price',
    'financiamento-imobiliario',
    'financiamento-de-veiculo',
    'financiamento-de-reforma',
  ],

  secoes: [
    {
      id: 'o-que-e-amortizar',
      titulo: 'Toda parcela tem duas partes',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Uma parcela de financiamento nunca é só pagamento da dívida. Ela se divide em duas: a amortização, que reduz o saldo devedor, e os juros, que remuneram o saldo que ainda existe.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Como os juros incidem sobre o saldo, e o saldo cai a cada mês, a parte de juros diminui ao longo do contrato. É por isso que quitar cedo economiza muito e quitar tarde economiza pouco: no fim, quase toda parcela já é amortização.',
        },
        {
          tipo: 'destaque',
          texto:
            'A diferença entre SAC e Price está inteira em qual das duas partes o sistema mantém constante.',
        },
      ],
    },

    {
      id: 'os-dois-sistemas',
      titulo: 'O que cada um mantém fixo',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'No SAC, a AMORTIZAÇÃO é constante: o saldo cai sempre no mesmo valor, e a parcela diminui mês a mês, porque a parte de juros encolhe.',
            'Na Price, a PARCELA é constante: para que ela não mude, a amortização começa pequena e cresce, enquanto os juros começam grandes e diminuem.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A consequência prática é imediata. A primeira parcela do SAC é maior que a da Price, para o mesmo valor e o mesmo prazo — e a última é bem menor. Em algum ponto do contrato as duas se cruzam.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'E há uma consequência menos visível: como o SAC derruba o saldo mais rápido, ele gera menos juros ao longo do contrato. O total pago no SAC é menor, e a diferença cresce com o prazo.',
        },
        {
          tipo: 'chamada',
          slug: 'amortizacao-sac-price',
          texto:
            'A calculadora mostra as duas tabelas lado a lado, parcela a parcela, com o total pago em cada uma.',
        },
      ],
    },

    {
      id: 'qual-escolher',
      titulo: 'Qual dos dois escolher',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A escolha raramente é sobre qual é "melhor" no papel — o SAC quase sempre é, no total pago. Ela é sobre o que cabe no orçamento hoje.',
        },
        {
          tipo: 'lista',
          itens: [
            'O SAC pede mais folga no começo, e é ele que a análise de crédito costuma exigir mais renda para aprovar.',
            'A Price cabe em orçamento mais apertado no início, e custa mais no fim.',
            'Quem pretende amortizar antecipadamente tende a se beneficiar do SAC, porque chega ao momento da amortização com saldo menor.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Vale lembrar que a parcela do financiamento imobiliário costuma trazer, além de juros e amortização, seguros obrigatórios e taxa de administração. Eles não mudam entre os dois sistemas, mas mudam o valor que sai da conta — e entram no custo efetivo total.',
        },
        {
          tipo: 'chamada',
          slug: 'financiamento-imobiliario',
          texto:
            'A calculadora de financiamento imobiliário monta a parcela completa, com seguros e taxa.',
        },
      ],
    },

    {
      id: 'a-correcao-do-saldo',
      titulo: 'O que nenhuma simulação de longo prazo acerta',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Financiamentos longos costumam ter o saldo devedor corrigido por um índice, e esse índice é o que nenhuma projeção conhece. Uma simulação feita hoje descreve o contrato com a correção de hoje — não com a que virá.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Isso não invalida a comparação entre SAC e Price: a correção incide igual nos dois, e a diferença entre eles se mantém. O que ela invalida é ler o valor da última parcela, daqui a vinte anos, como se fosse uma previsão.',
        },
        {
          tipo: 'chamada',
          slug: 'financiamento-de-veiculo',
          texto:
            'Em prazos curtos, como o de veículo, a incerteza é menor — e a comparação entre sistemas fica mais próxima do que se pagará de fato.',
        },
      ],
    },
  ],
}
