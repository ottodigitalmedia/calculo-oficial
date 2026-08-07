/**
 * Guia — "Ganho real: o que sobra depois da inflação".
 *
 * Bloco de investimentos (§11.3), e ele cobre também o de índices — corrigir
 * valor no tempo e medir poder de compra são a mesma pergunta vista de dois
 * lados.
 *
 * Sem valor legal: índice não é norma. NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const GANHO_REAL: Guia = {
  slug: 'ganho-real-e-inflacao',
  titulo: 'Ganho real: o que sobra depois da inflação',
  subtitulo:
    'Render dez por cento num ano em que os preços subiram nove não é ganhar dez — é ganhar quase nada.',
  descricaoSeo:
    'A diferença entre rendimento nominal e ganho real, como corrigir valores pela inflação, e por que o mesmo salário compra menos a cada ano sem que nada tenha mudado.',
  atualizadoEm: '2026-08-07',
  calculadoras: [
    'tesouro-ipca-mais',
    'poder-de-compra',
    'correcao-por-indice',
    'reajuste-de-salario',
  ],

  secoes: [
    {
      id: 'nominal-e-real',
      titulo: 'Dois números, e só um deles importa',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Todo rendimento tem duas leituras. A nominal é a que aparece no extrato: quanto o saldo cresceu. A real é a que responde à pergunta que interessa: quanto a mais você consegue comprar depois de ter aplicado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Se os preços subiram no mesmo ritmo do rendimento, o saldo aumentou e o poder de compra ficou igual. O ganho existiu no papel e não existiu na prática.',
        },
        {
          tipo: 'destaque',
          texto:
            'O ganho real pode ser negativo mesmo com o saldo crescendo. É o caso mais comum de aplicação conservadora em período de inflação alta.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'E há uma sutileza no cálculo: descontar a inflação não é subtrair um percentual do outro. Os dois se compõem, e a subtração simples superestima o ganho — pouco em períodos curtos, bastante em prazos longos.',
        },
      ],
    },

    {
      id: 'qual-indice',
      titulo: 'Qual índice usar, e por que eles divergem',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Não existe "a inflação": existem índices que medem cestas diferentes, para públicos diferentes, em regiões diferentes. Num mesmo ano eles podem apontar valores bem distintos, e isso não é erro de nenhum deles.',
        },
        {
          tipo: 'lista',
          itens: [
            'Índices de preço ao consumidor medem o custo de vida das famílias, com faixas de renda distintas conforme o índice.',
            'Índices gerais de preços incorporam também o atacado e a construção, e por isso oscilam mais.',
            'Contratos costumam fixar qual índice se aplica — e é esse que vale para aquela correção, não o que subiu menos.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Para medir poder de compra pessoal, um índice ao consumidor costuma ser o mais próximo da experiência de quem pergunta. Para corrigir um valor contratual, o índice certo é o que o contrato escolheu.',
        },
        {
          tipo: 'chamada',
          slug: 'correcao-por-indice',
          texto:
            'A calculadora corrige um valor entre duas datas pelo índice selecionado, com a série oficial.',
        },
      ],
    },

    {
      id: 'o-salario',
      titulo: 'O salário que não mudou, mas encolheu',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A mesma conta explica uma sensação comum: o salário é o mesmo há dois anos e não compra mais o que comprava. Não é impressão — é aritmética.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Um reajuste igual à inflação do período não é aumento: é reposição. Ele devolve o poder de compra que existia antes, e nada além disso. Aumento de verdade é o que passa disso.',
        },
        {
          tipo: 'chamada',
          slug: 'reajuste-de-salario',
          texto:
            'A calculadora mostra quanto o salário precisaria ser para manter o poder de compra do início do período.',
        },
        {
          tipo: 'chamada',
          slug: 'poder-de-compra',
          texto:
            'E a de poder de compra faz o caminho inverso: quanto um valor do passado representa hoje.',
        },
      ],
    },

    {
      id: 'aplicacoes-indexadas',
      titulo: 'Aplicações que já entregam o ganho real',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Existem títulos cuja remuneração é definida como um índice de inflação mais uma taxa. Eles resolvem o problema pela raiz: qualquer que seja a inflação do período, o ganho acima dela está contratado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Duas ressalvas honestas sobre eles. A primeira é o imposto: ele incide sobre o rendimento nominal, inclusive sobre a parte que foi apenas correção — então o ganho real depois do imposto é menor que a taxa contratada.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A segunda é a marcação a mercado: vender antes do vencimento pode render mais ou menos que o contratado, porque o preço do título oscila com as expectativas de juros. A taxa contratada é uma promessa para quem leva até o fim.',
        },
        {
          tipo: 'chamada',
          slug: 'tesouro-ipca-mais',
          texto:
            'A calculadora separa a correção do ganho real e aplica o imposto sobre o rendimento nominal.',
        },
      ],
    },
  ],
}
