/**
 * Guia — "Rotativo e cheque especial: o crédito mais caro que existe".
 *
 * Primeiro do bloco de crédito (`ESTADO-DO-PROJETO` §11.3), escolhido para
 * abrir porque é o de maior busca e o de maior dano quando mal explicado.
 *
 * Os dois tetos são valor legal e entram por bloco que lê `lib/params/` —
 * `ADR-009` G-2. NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const ROTATIVO_E_CHEQUE_ESPECIAL: Guia = {
  slug: 'rotativo-e-cheque-especial',
  titulo: 'Rotativo e cheque especial: o crédito mais caro que existe',
  subtitulo:
    'São os dois créditos que ninguém contrata de propósito — e é justamente por isso que eles custam o que custam.',
  descricaoSeo:
    'Como funcionam o rotativo do cartão e o cheque especial, por que os juros deles são os maiores do mercado, quais tetos a lei impõe e como sair dos dois.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['rotativo-do-cartao', 'cheque-especial', 'plano-de-quitacao'],

  secoes: [
    {
      id: 'ninguem-contrata',
      titulo: 'Ninguém contrata: você cai',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Todo outro crédito começa com uma decisão. Você compara taxas, assina um contrato, sabe quanto vai pagar. O rotativo e o cheque especial começam com uma ausência: você não paga a fatura inteira, ou a conta fica negativa, e o crédito acontece sozinho.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Essa é a diferença que explica o preço. Quem empresta sabe que quem recebe não escolheu, não comparou e provavelmente não tinha alternativa naquele momento — e cobra de acordo.',
        },
        {
          tipo: 'destaque',
          texto:
            'Pagar o valor mínimo da fatura não é uma opção de pagamento. É a contratação do crédito mais caro que o mercado oferece.',
        },
      ],
    },

    {
      id: 'os-tetos',
      titulo: 'Os tetos que a lei impõe',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Os dois têm limite legal, e conhecê-los serve para uma coisa prática: conferir se o que está sendo cobrado de você cabe dentro do que a norma permite.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'cheque-especial-teto-juros-mes',
          legenda: 'Teto dos juros do cheque especial, ao mês, em conta de pessoa física.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Um teto mensal parece modesto até ser composto por doze meses. Juro sobre juro é o mecanismo que transforma um percentual mensal de aparência tolerável numa taxa anual que ninguém aceitaria se ela fosse anunciada assim.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'cartao-teto-juros-encargos',
          legenda:
            'Limite do total de juros e encargos no rotativo e no parcelamento da fatura, sobre o valor original da dívida.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O teto do cartão tem forma diferente: em vez de limitar a taxa, ele limita o quanto a dívida pode crescer em relação ao valor original. É um limite de destino, não de velocidade — e ele existe justamente porque a velocidade era alta demais.',
        },
        {
          tipo: 'chamada',
          slug: 'rotativo-do-cartao',
          texto:
            'A calculadora mostra quanto a fatura vira em alguns meses de rotativo, e onde o teto passa a valer.',
        },
      ],
    },

    {
      id: 'a-armadilha-do-minimo',
      titulo: 'A armadilha do pagamento mínimo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O valor mínimo é calculado sobre a fatura do mês, e não sobre a dívida acumulada. Quem paga só o mínimo abate uma fração pequena do saldo e financia o resto pela taxa mais alta da casa — e a fatura seguinte chega maior que a anterior, mesmo sem nenhuma compra nova.',
        },
        {
          tipo: 'lista',
          itens: [
            'A parte não paga vira crédito rotativo, com juros sobre o saldo inteiro.',
            'A fatura seguinte traz o saldo antigo, os juros e as compras novas.',
            'O mínimo da fatura seguinte é maior, porque a fatura é maior.',
            'Repetido alguns meses, o saldo cresce mais rápido do que os pagamentos o reduzem.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'É por isso que a saída do rotativo quase nunca é pagar um pouco mais por mês. Ela costuma ser trocar a dívida por outra mais barata, e parar de usar o cartão enquanto isso não acontece.',
        },
      ],
    },

    {
      id: 'como-sair',
      titulo: 'Como se sai dos dois',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A troca por um crédito mais barato — parcelamento negociado, empréstimo pessoal, consignado — quase sempre reduz o custo total, mesmo alongando o prazo. Não porque prazo longo seja bom, mas porque a taxa que se abandona é muito maior que a que se assume.',
        },
        {
          tipo: 'lista',
          itens: [
            'Compare pelo custo efetivo total, não pela taxa anunciada: tarifas e seguros entram na conta.',
            'Confira se a nova parcela cabe no orçamento sem gerar novo rotativo no mês seguinte.',
            'Quitar primeiro a dívida de maior taxa costuma economizar mais que quitar a de maior saldo.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'plano-de-quitacao',
          texto:
            'Com várias dívidas, a calculadora de plano de quitação mostra qual ordem economiza mais juros.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma observação sobre o cheque especial que quase ninguém percebe: como ele é usado por poucos dias e depois coberto pelo salário, o custo aparece em valores pequenos e frequentes. Somados ao longo do ano, esses valores costumam superar o de uma dívida única que assustaria muito mais.',
        },
        {
          tipo: 'chamada',
          slug: 'cheque-especial',
          texto:
            'A calculadora de cheque especial soma o custo dos dias usados e mostra o total do período.',
        },
      ],
    },
  ],
}
