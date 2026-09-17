/**
 * Guia — "Imposto na bolsa: a isenção, o day trade e o prejuízo que se
 * aproveita".
 *
 * Lote 3 da expansão do catálogo, ligado a CALC-093. Guia novo porque a
 * pergunta é nova: o guia de renda fixa trata da tabela regressiva, que é
 * retida na fonte e não exige nada de quem investe. Em bolsa, quem apura, paga
 * e declara é a pessoa física — e é isso que o texto precisa explicar.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const IMPOSTO_NA_BOLSA: Guia = {
  slug: 'imposto-na-bolsa-de-valores',
  titulo: 'Imposto na bolsa: a isenção, o day trade e o prejuízo que se aproveita',
  tituloSeo: 'Imposto na bolsa: isenção, day trade e prejuízo',
  subtitulo:
    'Na renda variável, quem apura o imposto é você — mês a mês, com regras diferentes para cada tipo de operação.',
  descricaoSeo:
    'Como funciona o imposto sobre ações: a isenção pelo valor vendido no mês, a apuração separada do day trade, a compensação de prejuízo e o DARF.',
  atualizadoEm: '2026-09-17',
  calculadoras: ['ir-em-bolsa-de-valores'],

  secoes: [
    {
      id: 'quem-apura-e-voce',
      titulo: 'Aqui quem apura é você',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Na renda fixa o imposto é retido na fonte e chega no extrato já descontado. Em bolsa não: a pessoa física apura o resultado de cada mês, calcula o imposto, emite o DARF e paga até o último dia útil do mês seguinte. A corretora retém apenas uma parcela mínima, que serve de aviso à Receita — e não substitui a conta.',
        },
        {
          tipo: 'destaque',
          texto:
            'Errar essa apuração é comum e caro: o imposto não pago vira multa e juros, e o prejuízo não declarado no mês em que ocorreu perde a chance de abater ganhos futuros.',
        },
      ],
    },

    {
      id: 'a-isencao-e-do-valor-vendido',
      titulo: 'A isenção é do valor vendido, não do lucro',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Este é o ponto que mais produz conta errada. A isenção da pessoa física olha quanto você VENDEU no mês no mercado à vista de ações, somando todas as vendas — inclusive as que deram prejuízo. Dentro do limite, o ganho não é tributado, por maior que ele seja. Acima dele, o imposto incide sobre o ganho inteiro, e não só sobre o excesso.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'bolsa-isencao-vendas-mes',
          legenda: 'Limite mensal de vendas de ações para a isenção da pessoa física.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O limite vale para o conjunto das ações no mercado à vista. Ele não alcança day trade, fundos imobiliários, opções, futuros e contratos a termo — nesses casos, qualquer ganho é tributado.',
        },
      ],
    },

    {
      id: 'dois-bolsos',
      titulo: 'Operação comum e day trade são dois bolsos',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Day trade é a operação aberta e encerrada no mesmo dia, com o mesmo ativo. A lei a trata em separado: alíquota maior, sem a isenção mensal e com prejuízo que só compensa ganho da mesma espécie.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'bolsa-aliquota-comum',
          legenda: 'Alíquota sobre o ganho líquido das operações comuns.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'bolsa-aliquota-day-trade',
          legenda: 'Alíquota sobre o ganho líquido do day trade.',
        },
        {
          tipo: 'chamada',
          slug: 'ir-em-bolsa-de-valores',
          texto:
            'A calculadora separa os dois bolsos, aplica a compensação de cada um e mostra o DARF do mês com a memória de cálculo.',
        },
      ],
    },

    {
      id: 'o-prejuizo-nao-se-perde',
      titulo: 'O prejuízo não se perde — se for declarado',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A perda de um mês abate ganhos dos meses seguintes, dentro do mesmo bolso, sem prazo para acabar. Duas condições: ela precisa ser informada no demonstrativo de renda variável do mês em que ocorreu, e só vale para a frente — perda de agora não volta para abater ganho de mês já encerrado.',
        },
        {
          tipo: 'lista',
          itens: [
            'Perda em operação comum abate ganho em operação comum.',
            'Perda em day trade abate apenas ganho em day trade.',
            'Mês dentro da isenção com prejuízo: a perda continua aproveitável, desde que informada.',
            'Venda fora de bolsa segue a regra de ganho de capital, e não entra nesta compensação.',
          ],
        },
      ],
    },

    {
      id: 'a-retencao-e-o-darf',
      titulo: 'A retenção na fonte e o piso do DARF',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A corretora retém uma parcela mínima sobre as vendas comuns — o apelido de mercado é "dedo-duro", porque a função dela é informar a Receita de que houve operação. No day trade a retenção é maior e incide sobre o resultado positivo do dia. Nos dois casos, o valor retido é antecipação: entra como dedução no imposto do mês.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'bolsa-irrf-comum',
          legenda: 'Fração retida na fonte sobre o valor vendido nas operações comuns.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'bolsa-irrf-day-trade',
          legenda: 'Alíquota retida na fonte sobre o ganho do day trade.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quando o imposto apurado fica abaixo do valor mínimo do DARF, ele não é pago naquele mês — mas também não desaparece: soma-se ao dos meses seguintes, no mesmo código de receita, até alcançar o mínimo.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'darf-valor-minimo',
          legenda: 'Valor mínimo para emissão de um DARF.',
        },
      ],
    },
  ],
}
