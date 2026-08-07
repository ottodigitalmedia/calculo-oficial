/**
 * Guia — "Aviso prévio: o prazo, a projeção e quando ele vira desconto".
 *
 * Bloco trabalhista restante (§11.3). Os três parâmetros do prazo entram por
 * bloco que lê `lib/params/` (G-2).
 *
 * NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const AVISO_PREVIO: Guia = {
  slug: 'aviso-previo-prazo-e-projecao',
  titulo: 'Aviso prévio: o prazo, a projeção e quando ele vira desconto',
  subtitulo:
    'O mesmo instituto pode ser dinheiro que você recebe ou desconto que você paga — e quem decide isso é quem rompeu o contrato.',
  descricaoSeo:
    'Como se calcula o prazo do aviso prévio proporcional, por que o aviso indenizado projeta a data de saída, e em que situação ele é descontado do acerto.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['aviso-previo-proporcional', 'rescisao-sem-justa-causa', 'rescisao-pedido-demissao'],

  secoes: [
    {
      id: 'para-que-serve',
      titulo: 'Para que ele existe',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O aviso prévio é o tempo que uma parte dá à outra para se organizar antes do fim do contrato. Quem é dispensado ganha prazo para procurar emprego; quem perde um empregado ganha prazo para repor a vaga.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Por isso ele funciona nos dois sentidos, e é essa simetria que confunde: no mesmo instituto cabem um crédito e um débito, dependendo apenas de quem tomou a iniciativa de encerrar o contrato.',
        },
        {
          tipo: 'destaque',
          texto:
            'Dispensa sem justa causa: o aviso é do trabalhador. Pedido de demissão: o aviso é da empresa, e não cumpri-lo pode gerar desconto.',
        },
      ],
    },

    {
      id: 'o-prazo',
      titulo: 'O prazo cresce com o tempo de casa',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Havia um prazo único, igual para todos. A lei o transformou num prazo mínimo que aumenta conforme os anos de serviço na mesma empresa, até um limite.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aviso-previo-dias-base',
          legenda: 'Prazo mínimo, em dias, para quem conta até um ano de serviço na mesma empresa.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aviso-previo-dias-por-ano',
          legenda: 'Dias acrescidos por ano de serviço prestado na mesma empresa.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aviso-previo-dias-maximo',
          legenda: 'Limite total do aviso, somados o prazo mínimo e os acréscimos.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Há um ponto de interpretação que muda o resultado de quem tem poucos anos de casa: a partir de qual ano o acréscimo começa a contar. O texto fala em prazo mínimo para quem conta "até um ano" e acréscimo "por ano de serviço prestado" — e a leitura dessa fronteira precisa ser uma só, aplicada de forma consistente.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O acréscimo proporcional foi criado em favor de quem é dispensado. Quando o aviso é devido pelo trabalhador que pediu demissão, aplica-se o prazo mínimo.',
        },
        {
          tipo: 'chamada',
          slug: 'aviso-previo-proporcional',
          texto: 'A calculadora conta os dias a partir das datas de admissão e de saída.',
        },
      ],
    },

    {
      id: 'trabalhado-ou-indenizado',
      titulo: 'Trabalhado, indenizado — e a projeção',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O aviso pode ser cumprido trabalhando, com redução de jornada ou de dias, ou pago em dinheiro. A segunda forma tem um efeito que quase ninguém conhece e que aparece no acerto.',
        },
        {
          tipo: 'destaque',
          texto:
            'Quando o aviso é indenizado, o prazo dele é somado ao tempo de serviço para efeito das demais verbas. O contrato, para fins de cálculo, termina numa data posterior ao último dia de trabalho.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'É por isso que o termo de rescisão às vezes traz um avo a mais de férias e de décimo terceiro do que a conta feita em casa apontava — e por isso ele pode acrescentar um ano completo ao tempo de casa de quem estava perto da virada.',
        },
        {
          tipo: 'chamada',
          slug: 'rescisao-sem-justa-causa',
          texto:
            'A calculadora de rescisão mostra a data projetada e as verbas recalculadas a partir dela.',
        },
      ],
    },

    {
      id: 'quando-vira-desconto',
      titulo: 'Quando ele vira desconto',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem pede demissão deve o aviso à empresa. Cumprindo o período trabalhando, nada é descontado. Saindo antes, o valor correspondente pode ser abatido do acerto.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'É a razão de alguns termos de rescisão de pedido de demissão chegarem perto de zero — sobretudo em contratos curtos, em que as verbas proporcionais ainda são pequenas e o desconto é do prazo inteiro.',
        },
        {
          tipo: 'lista',
          itens: [
            'A empresa pode dispensar o cumprimento do aviso, e nesse caso não há desconto.',
            'O aviso não cumprido pelo trabalhador não projeta a data de saída, ao contrário do indenizado na dispensa.',
            'Havendo justa causa, as regras são outras e o aviso não é devido pelo empregador.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'rescisao-pedido-demissao',
          texto:
            'A calculadora de pedido de demissão permite simular com e sem cumprimento do aviso.',
        },
      ],
    },
  ],
}
