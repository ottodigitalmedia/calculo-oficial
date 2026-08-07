/**
 * Guia — "Álcool, gasolina ou elétrico: qual compensa".
 *
 * Bloco de veículos (§11.3). Cobre as duas comparações de energia do catálogo.
 *
 * NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const QUAL_COMBUSTIVEL_COMPENSA: Guia = {
  slug: 'qual-combustivel-compensa',
  titulo: 'Álcool, gasolina ou elétrico: qual compensa',
  subtitulo:
    'A regra dos setenta por cento resolve o primeiro caso. O segundo exige uma conta bem maior.',
  descricaoSeo:
    'Como decidir entre álcool e gasolina pela relação de preço e consumo, e como comparar um carro elétrico com um a combustão considerando energia, manutenção e preço de compra.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['alcool-ou-gasolina', 'eletrico-ou-combustao', 'custo-mensal-do-carro'],

  secoes: [
    {
      id: 'alcool-ou-gasolina',
      titulo: 'Álcool ou gasolina: por que existe uma proporção',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O etanol tem menor densidade energética que a gasolina: o mesmo litro leva o carro menos longe. Por isso não basta comparar o preço do litro — é preciso comparar o preço por quilômetro rodado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Daí nasce a regra prática que circula nos postos, na forma de uma proporção entre os dois preços. Ela funciona como atalho, e tem um limite importante: usa um rendimento médio de motor, não o do seu carro.',
        },
        {
          tipo: 'destaque',
          texto:
            'A proporção que decide não é universal: ela depende do consumo do SEU carro com cada combustível. Um motor que aproveita bem o etanol muda o ponto de virada.',
        },
        {
          tipo: 'chamada',
          slug: 'alcool-ou-gasolina',
          texto:
            'A calculadora usa o consumo do seu carro com cada combustível, e não uma média de mercado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Para medir o próprio consumo basta encher o tanque, zerar o marcador de percurso e, no abastecimento seguinte, dividir os quilômetros pelos litros. Feito uma vez com cada combustível, o número passa a ser seu.',
        },
      ],
    },

    {
      id: 'eletrico',
      titulo: 'Elétrico contra combustão: a conta muda de tamanho',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Aqui não se comparam dois combustíveis no mesmo carro, e sim dois carros diferentes. O custo por quilômetro do elétrico costuma ser bem menor, e o preço de compra costuma ser bem maior — a decisão está no encontro dessas duas curvas.',
        },
        {
          tipo: 'lista',
          itens: [
            'Energia: o custo por quilômetro depende do preço do kWh onde você carrega — em casa é uma coisa, em eletroposto é outra.',
            'Manutenção: menos peças móveis, menos trocas de óleo, mas bateria com vida útil e custo de reposição.',
            'Preço de compra: a diferença inicial precisa ser recuperada pela economia de uso.',
            'Depreciação: ainda pouco previsível em elétricos, e ela pesa mais que a economia mensal.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A conta que responde é a mesma dos financiamentos: em quantos quilômetros a economia acumulada cobre a diferença de preço. Abaixo disso, o elétrico não se pagou; acima, sim.',
        },
        {
          tipo: 'chamada',
          slug: 'eletrico-ou-combustao',
          texto:
            'A calculadora compara os dois pelo custo por quilômetro e mostra em quanto tempo a diferença se paga.',
        },
      ],
    },

    {
      id: 'o-que-nao-entra',
      titulo: 'O que não entra na conta',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Nenhuma dessas comparações projeta o preço futuro do combustível ou da energia, e os dois oscilam por razões que não cabem numa calculadora — safra, câmbio, política de preços, bandeira tarifária.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Também ficam de fora conveniência de abastecimento, autonomia em viagem longa e disponibilidade de carregador no trajeto. São fatores decisivos para muita gente, e nenhum deles tem unidade monetária.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-mensal-do-carro',
          texto:
            'Para a decisão completa, vale somar o combustível ao restante do custo de ter o carro.',
        },
      ],
    },
  ],
}
