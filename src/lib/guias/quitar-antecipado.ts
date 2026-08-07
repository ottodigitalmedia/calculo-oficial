/**
 * Guia — "Quitar antes: quanto se economiza de verdade".
 *
 * Quinto e último do bloco de crédito. O ponto que ele precisa acertar é o
 * desconto proporcional dos juros — o direito que quase ninguém cobra.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const QUITAR_ANTECIPADO: Guia = {
  slug: 'quitar-antecipado',
  titulo: 'Quitar antes: quanto se economiza de verdade',
  subtitulo:
    'Antecipar parcelas dá direito a desconto dos juros, e não é o mesmo que pagar parcelas adiantadas.',
  descricaoSeo:
    'Como funciona a quitação antecipada de dívidas: o desconto proporcional dos juros, a diferença entre abater prazo e abater parcela, e por qual dívida começar.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['quitacao-antecipada', 'amortizacao-extra', 'plano-de-quitacao'],

  secoes: [
    {
      id: 'o-desconto-proporcional',
      titulo: 'O desconto que a lei garante',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quando se antecipa o pagamento de uma dívida, os juros embutidos nas parcelas futuras deixam de fazer sentido: eles remuneravam um tempo que não vai mais existir. A legislação de defesa do consumidor assegura a redução proporcional desses juros.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Na prática isso significa que quitar não é somar as parcelas que faltam. É calcular quanto vale hoje o que seria pago no futuro — e esse valor é sempre menor que a soma.',
        },
        {
          tipo: 'destaque',
          texto:
            'Se a instituição oferecer quitação pelo somatório das parcelas restantes, sem desconto, o valor está errado — e o direito ao abatimento é seu.',
        },
        {
          tipo: 'chamada',
          slug: 'quitacao-antecipada',
          texto:
            'A calculadora mostra o valor presente do saldo e quanto se economiza em relação a seguir pagando.',
        },
      ],
    },

    {
      id: 'prazo-ou-parcela',
      titulo: 'Abater prazo ou abater parcela',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem amortiza parte da dívida costuma poder escolher entre duas coisas, e a escolha muda bastante o resultado.',
        },
        {
          tipo: 'lista',
            itens: [
            'Reduzir o PRAZO mantém a parcela e antecipa o fim do contrato. Como os juros incidem sobre o saldo por menos tempo, é a opção que economiza mais.',
            'Reduzir a PARCELA mantém o prazo e alivia o orçamento mensal. Economiza menos, porque o saldo continua rendendo juros até o fim previsto.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A regra prática: quem consegue manter a parcela atual deve reduzir prazo. Reduzir parcela é a escolha de quem precisa de fôlego agora — legítima, e mais cara.',
        },
        {
          tipo: 'chamada',
          slug: 'amortizacao-extra',
          texto:
            'A calculadora de amortização extra compara as duas opções com os números do seu contrato.',
        },
      ],
    },

    {
      id: 'quando-antecipar',
      titulo: 'Quando antecipar vale, e quando não vale',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Antecipar rende, em economia de juros, aproximadamente o que a dívida custa. Isso dá um critério simples de comparação: se o dinheiro parado rende menos do que a dívida custa, quitar é melhor investimento que aplicar.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A comparação precisa ser feita com números líquidos: o rendimento de uma aplicação vem depois de imposto, e o custo da dívida deve ser o efetivo, com tarifas. Comparar taxa bruta de aplicação com taxa nominal de empréstimo favorece a aplicação sem motivo.',
        },
        {
          tipo: 'lista',
          itens: [
            'Antecipar cedo economiza muito; antecipar perto do fim economiza pouco, porque quase toda parcela já é amortização.',
            'Antes de antecipar, vale garantir a reserva de emergência — quitar dívida e ficar sem reserva costuma criar dívida nova, mais cara.',
            'Com várias dívidas, começar pela de maior custo efetivo economiza mais que começar pela de maior saldo.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'plano-de-quitacao',
          texto:
            'Com mais de uma dívida, a calculadora de plano de quitação ordena por onde começar.',
        },
      ],
    },
  ],
}
