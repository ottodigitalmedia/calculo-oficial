/**
 * Guia — "Imóvel para alugar: o que sobra depois de tudo".
 *
 * Bloco de imóveis (§11.3). Fecha o bloco cobrindo a rentabilidade de locação e
 * o reajuste do aluguel — as duas pontas de quem tem imóvel para render.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const IMOVEL_PARA_ALUGAR: Guia = {
  slug: 'imovel-para-alugar',
  titulo: 'Imóvel para alugar: o que sobra depois de tudo',
  subtitulo:
    'O rendimento anunciado como "quanto por cento ao mês" costuma ignorar metade dos custos — e todos os meses vazios.',
  descricaoSeo:
    'Como calcular a rentabilidade real de um imóvel alugado: custos de posse, vacância, imposto sobre o aluguel e o reajuste anual pelo índice do contrato.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['rentabilidade-de-aluguel', 'reajuste-de-aluguel', 'alugar-ou-comprar'],

  secoes: [
    {
      id: 'o-numero-que-enganam',
      titulo: 'O número que engana',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A rentabilidade de um imóvel costuma ser anunciada dividindo o aluguel pelo valor do imóvel. O resultado é um percentual mensal de aparência confortável — e ele descreve um cenário que não existe: o imóvel alugado doze meses por ano, sem custo nenhum.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A conta que descreve a realidade parte do aluguel recebido e subtrai o que o proprietário paga. O que sobra, dividido pelo capital investido, é o rendimento de verdade — quase sempre bem menor que o anunciado.',
        },
        {
          tipo: 'destaque',
          texto:
            'O capital investido não é o preço do imóvel: é o preço mais os custos de aquisição, que não voltam.',
        },
      ],
    },

    {
      id: 'o-que-o-dono-paga',
      titulo: 'O que sai do bolso do dono',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'O imposto anual sobre a propriedade, quando não repassado, e mesmo repassado nos meses vazios.',
            'O condomínio nos períodos sem inquilino.',
            'A manutenção estrutural e as obras — pintura, hidráulica, telhado.',
            'A taxa da administradora, quando há.',
            'O imposto de renda sobre o aluguel recebido, que segue a tabela mensal.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'O último item surpreende muita gente: aluguel recebido de pessoa física é rendimento tributável e entra no recolhimento mensal obrigatório. Quem não recolhe acumula com a declaração anual, e com acréscimos.',
        },
        {
          tipo: 'chamada',
          slug: 'carne-leao',
          texto:
            'A calculadora de carnê-leão apura o imposto mensal sobre o aluguel recebido de pessoa física.',
        },
      ],
    },

    {
      id: 'a-vacancia',
      titulo: 'A vacância é o custo que ninguém coloca na planilha',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Entre um inquilino e outro há meses sem receber — e com despesas correndo. Um mês vazio por ano já derruba o rendimento anual em uma fração relevante, e dois meses derrubam bem mais.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Vale estimar a vacância pelo histórico do próprio imóvel ou da região, e não supor que ela será zero. Uma projeção sem vacância descreve o melhor caso e o apresenta como o caso provável.',
        },
        {
          tipo: 'chamada',
          slug: 'rentabilidade-de-aluguel',
          texto:
            'A calculadora considera vacância e custos e devolve o rendimento líquido sobre o capital investido.',
        },
      ],
    },

    {
      id: 'o-reajuste',
      titulo: 'O reajuste anual, e o índice que o contrato escolheu',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O contrato de locação costuma prever reajuste anual por um índice de preços. Qual índice foi escolhido importa mais do que parece: eles medem cestas diferentes e podem divergir bastante num mesmo ano.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Reajustar por um índice que subiu muito acima da inflação percebida costuma provocar renegociação ou saída do inquilino — e a vacância que vem depois pode custar mais que o reajuste que se pretendia obter.',
        },
        {
          tipo: 'chamada',
          slug: 'reajuste-de-aluguel',
          texto:
            'A calculadora aplica o índice do contrato ao período e mostra o valor reajustado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma última comparação vale a pena antes de comprar para alugar: o rendimento líquido do imóvel contra o de uma aplicação de risco baixo, no mesmo período. O imóvel tem a valorização a favor e a liquidez contra — e a conta honesta considera as duas.',
        },
      ],
    },
  ],
}
