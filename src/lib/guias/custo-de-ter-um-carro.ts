/**
 * Guia — "Quanto custa ter um carro, de verdade".
 *
 * Bloco de veículos (§11.3). O ponto é a depreciação: ela costuma ser o maior
 * custo e é a única que não passa pela conta corrente.
 *
 * NENHUM VALOR LEGAL NA PROSA (G-1) — e aqui não há valor legal nenhum.
 */

import type { Guia } from './tipos'

export const CUSTO_DE_TER_UM_CARRO: Guia = {
  slug: 'quanto-custa-ter-um-carro',
  titulo: 'Quanto custa ter um carro, de verdade',
  subtitulo:
    'O maior custo do carro não aparece em nenhum boleto — e é justamente por isso que ele é ignorado.',
  descricaoSeo:
    'O custo real de manter um carro: depreciação, seguro, impostos, manutenção e combustível, e por que a conta por quilômetro é a única comparável.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['custo-mensal-do-carro', 'depreciacao-de-veiculo', 'custo-de-viagem'],

  secoes: [
    {
      id: 'o-custo-invisivel',
      titulo: 'O custo que não tem boleto',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quando se pergunta quanto custa o carro, a resposta costuma somar combustível, seguro, imposto anual e as revisões. Falta a maior parcela: a perda de valor do próprio veículo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A depreciação não gera cobrança nenhuma. Ela aparece uma única vez, no dia da venda, na diferença entre o que se pagou e o que se recebe — e nesse momento já é passado.',
        },
        {
          tipo: 'destaque',
          texto:
            'Num carro novo, a depreciação dos primeiros anos costuma superar todos os outros custos somados.',
        },
        {
          tipo: 'chamada',
          slug: 'depreciacao-de-veiculo',
          texto:
            'A calculadora projeta a perda de valor ao longo dos anos a partir do preço de compra.',
        },
      ],
    },

    {
      id: 'as-parcelas',
      titulo: 'As parcelas do custo mensal',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'Depreciação — a perda de valor, dividida pelos meses de uso.',
            'Seguro, que varia com o perfil do condutor e a região.',
            'Imposto anual sobre o veículo e licenciamento.',
            'Manutenção programada e a não programada, que existe mesmo quando não se planeja.',
            'Combustível, o único que varia com o quanto se roda.',
            'Estacionamento, pedágio e lavagem, que somam mais do que parecem.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Só a última linha depende do uso. As demais existem com o carro parado — e é isso que torna o custo por quilômetro tão alto para quem roda pouco.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-mensal-do-carro',
          texto: 'A calculadora soma as parcelas e devolve o custo mensal e o custo por quilômetro.',
        },
      ],
    },

    {
      id: 'a-comparacao-honesta',
      titulo: 'A comparação que faz sentido',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Comparar o carro com aplicativo ou transporte público pelo preço do combustível favorece o carro por construção — ele ignora tudo o que não é abastecimento.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A comparação honesta usa o custo total dividido pelos quilômetros rodados. Feita assim, ela costuma mudar a conclusão de quem roda pouco, e confirmá-la para quem roda muito.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-de-viagem',
          texto:
            'Para uma viagem específica, a calculadora estima combustível, pedágio e o custo por passageiro.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma ressalva honesta: o carro entrega coisas que não cabem em custo por quilômetro — horário, bagagem, segurança percebida, autonomia em emergência. A conta serve para tornar a escolha consciente, não para decidi-la sozinha.',
        },
      ],
    },
  ],
}
