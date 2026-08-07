/**
 * Guia — "Consignado: a margem, a base dela e o que ela não cobre".
 *
 * Quarto do bloco de crédito. A margem é valor legal e entra por bloco que lê
 * `lib/params/`; a fronteira dos regimes vem de §7.57, que decidiu o recorte de
 * CALC-027 — a calculadora cobre o CLT, e declara que aposentado e servidor têm
 * regra própria.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const CONSIGNADO: Guia = {
  slug: 'consignado-margem-e-base',
  titulo: 'Consignado: a margem, a base dela e o que ela não cobre',
  subtitulo:
    'É o crédito mais barato disponível para quem tem carteira assinada — e o cálculo da margem engana quase todo mundo.',
  descricaoSeo:
    'Como funciona o empréstimo consignado: sobre o que a margem é calculada, por que ela é menor do que parece, e por que aposentados e servidores seguem regra diferente.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['emprestimo-consignado', 'cet-custo-efetivo-total', 'plano-de-quitacao'],

  secoes: [
    {
      id: 'por-que-e-barato',
      titulo: 'Por que ele é barato',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A parcela do consignado é descontada na folha, antes de o salário chegar à sua conta. Quem empresta não depende de você lembrar de pagar, nem de ter saldo no dia do vencimento — o risco de não receber cai muito, e a taxa cai junto.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'É a mesma lógica do rotativo, ao contrário: lá o credor cobra caro porque quem toma não escolheu e pode não pagar; aqui ele cobra barato porque o pagamento vem antes de qualquer escolha.',
        },
        {
          tipo: 'destaque',
          texto:
            'Essa mesma característica é o risco: a parcela sai antes de tudo, inclusive antes das contas que você considera essenciais.',
        },
      ],
    },

    {
      id: 'a-margem',
      titulo: 'A margem, e a base sobre a qual ela incide',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A lei limita quanto do salário pode ser comprometido com o desconto em folha. O limite é um percentual — e o que quase ninguém lê com atenção é sobre o que esse percentual incide.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'consignado-margem-clt',
          legenda:
            'Limite do desconto em folha para o empregado com carteira assinada, sobre a base legal de cálculo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A base não é o salário bruto, e não é o líquido que cai na conta. É a remuneração depois dos descontos obrigatórios — os que a lei manda descontar —, e antes dos descontos que existem por acordo ou por opção sua.',
        },
        {
          tipo: 'lista',
          itens: [
            'Entram na base: o salário e as verbas de natureza salarial habituais.',
            'Saem antes do cálculo: os descontos obrigatórios, como a contribuição previdenciária e o imposto de renda.',
            'Não saem: plano de saúde, vale-transporte, adiantamentos e outros descontos contratuais.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A consequência é que a margem calculada sobre o líquido do holerite dá um número maior que o real, e a calculadora que faz isso promete um empréstimo que o empregador não vai autorizar.',
        },
        {
          tipo: 'chamada',
          slug: 'emprestimo-consignado',
          texto:
            'A calculadora aplica o percentual sobre a base correta e mostra a margem disponível.',
        },
      ],
    },

    {
      id: 'quem-nao-esta-aqui',
      titulo: 'Quem tem regra própria, e não está nesta conta',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O consignado não é um só. O que este guia descreve é o do empregado com carteira assinada, cuja margem está em lei firme.',
        },
        {
          tipo: 'lista',
          itens: [
            'Aposentados e pensionistas seguem norma própria, com limite global distinto e reservas específicas para cartão consignado e cartão de benefício.',
            'Servidores públicos seguem o regulamento do próprio ente — União, estado ou município —, e os limites variam entre eles.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Aplicar a margem do trabalhador celetista a qualquer um desses dois produz um número que parece certo e não é. Quando a norma de um grupo está em alteração, o mais honesto é dizer isso em vez de estimar — é o critério que este site adota.',
        },
      ],
    },

    {
      id: 'barato-nao-e-gratis',
      titulo: 'Barato não é grátis',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A taxa menor faz o consignado parecer inofensivo, e prazos longos reforçam a impressão porque derrubam a parcela. Mas o custo total cresce com o prazo, e o desconto em folha atravessa anos de mudanças na vida de quem contratou.',
        },
        {
          tipo: 'lista',
            itens: [
            'Compare pelo custo efetivo total, não pela taxa: tarifas e seguros entram.',
            'Prazo maior, parcela menor, total pago maior — sempre.',
            'Trocar dívida cara por consignado costuma economizar; somar consignado à dívida cara, não.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'cet-custo-efetivo-total',
          texto: 'O CET é o número que torna duas propostas de consignado comparáveis.',
        },
      ],
    },
  ],
}
