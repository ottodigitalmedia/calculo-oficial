/**
 * Guia — "IR na renda fixa: a tabela regressiva e as isenções".
 *
 * Bloco de investimentos (§11.3). As quatro alíquotas e os três prazos entram
 * por bloco que lê `lib/params/` (G-2).
 *
 * NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const IR_NA_RENDA_FIXA: Guia = {
  slug: 'ir-na-renda-fixa',
  titulo: 'IR na renda fixa: a tabela regressiva e as isenções',
  subtitulo:
    'Duas aplicações com o mesmo rendimento anunciado podem entregar valores bem diferentes — e a diferença é o imposto.',
  descricaoSeo:
    'Como funciona a tabela regressiva do imposto de renda na renda fixa, quais aplicações são isentas, e por que comparar rendimento bruto leva à escolha errada.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['ir-renda-fixa', 'cdb-lci-lca', 'onde-render-mais', 'rendimento-da-poupanca'],

  secoes: [
    {
      id: 'a-tabela-regressiva',
      titulo: 'Quanto mais tempo, menos imposto',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O imposto sobre o rendimento da renda fixa não é fixo: ele diminui conforme o dinheiro fica aplicado. A lógica é premiar quem deixa o capital investido por mais tempo, e o efeito prático é que resgatar cedo custa caro.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ir-renda-fixa-faixa-1',
          legenda: 'Alíquota sobre o rendimento em aplicações de prazo mais curto.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ir-renda-fixa-limite-1',
          legenda: 'Prazo em dias até o qual vale a primeira alíquota.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ir-renda-fixa-faixa-4',
          legenda: 'Alíquota mínima, aplicada depois do prazo mais longo da tabela.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ir-renda-fixa-limite-3',
          legenda: 'Prazo em dias a partir do qual vale a alíquota mínima.',
        },
        {
          tipo: 'destaque',
          texto:
            'A alíquota incide sobre o RENDIMENTO, nunca sobre o valor aplicado. Quem resgata o principal não paga imposto sobre ele.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A tabela vale por aplicação, e o prazo conta a partir da data de cada aporte. Quem investe todo mês tem, na prática, várias aplicações com prazos diferentes — e o resgate costuma consumir primeiro as mais antigas.',
        },
      ],
    },

    {
      id: 'as-isentas',
      titulo: 'As isentas, e por que elas não são automaticamente melhores',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Algumas aplicações de renda fixa são isentas de imposto para a pessoa física — entre elas as letras de crédito imobiliário e do agronegócio. Isso faz o rendimento delas chegar inteiro ao investidor.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A consequência é que comparar uma isenta com uma tributada pelo rendimento anunciado é comparar coisas diferentes. A comparação correta põe as duas na mesma base: quanto sobra depois do imposto.',
        },
        {
          tipo: 'lista',
          itens: [
            'Numa aplicação tributada, o que importa é o rendimento líquido, depois da alíquota do prazo.',
            'Numa isenta, o rendimento anunciado já é o líquido.',
            'Por isso uma isenta com rendimento menor pode entregar mais que uma tributada com rendimento maior.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'cdb-lci-lca',
          texto:
            'A calculadora compara aplicações tributadas e isentas pelo rendimento líquido, no mesmo prazo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Vale conferir também a carência: várias isentas exigem prazo mínimo antes do resgate, e liquidez baixa tem custo — o dinheiro que não sai quando você precisa pode obrigar a recorrer a crédito caro.',
        },
      ],
    },

    {
      id: 'o-que-mais-morde',
      titulo: 'O imposto não é a única mordida',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Além da tabela regressiva, o resgate nos primeiros dias sofre um tributo adicional que cai rapidamente até desaparecer. Ele existe justamente para desestimular a aplicação de pouquíssimo prazo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Em fundos de investimento há ainda a antecipação semestral do imposto, que reduz o efeito dos juros compostos: parte do rendimento é tributada antes do resgate e deixa de render junto com o resto.',
        },
        {
          tipo: 'lista',
          itens: [
            'Taxa de administração e de custódia, quando houver, reduzem o rendimento antes do imposto.',
            'A poupança é isenta, mas rende por regra própria — e não acompanha necessariamente as demais.',
            'Comparar rendimento sem considerar o prazo de aplicação leva à escolha errada.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'onde-render-mais',
          texto:
            'A calculadora compara aplicações de perfis diferentes no mesmo prazo e com o imposto aplicado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A poupança merece nota à parte. Ela é isenta, o que a favorece na comparação, mas rende por uma regra própria que muda conforme o patamar da taxa básica — e que, na maior parte do tempo, entrega menos que aplicações conservadoras tributadas. A isenção não compensa a diferença de rendimento.',
        },
        {
          tipo: 'chamada',
          slug: 'rendimento-da-poupanca',
          texto:
            'A calculadora de poupança aplica a regra vigente e permite comparar com as demais no mesmo prazo.',
        },
      ],
    },
  ],
}
