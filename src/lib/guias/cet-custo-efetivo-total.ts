/**
 * Guia — "CET: por que a taxa anunciada não é o que você paga".
 *
 * Segundo do bloco de crédito. Ele existe para dar ao leitor a única ferramenta
 * que torna propostas de crédito comparáveis entre si.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1). Aqui isso é fácil: não há tabela
 * legal envolvida — o CET é método de cálculo, não parâmetro.
 */

import type { Guia } from './tipos'

export const CET_CUSTO_EFETIVO_TOTAL: Guia = {
  slug: 'cet-custo-efetivo-total',
  titulo: 'CET: por que a taxa anunciada não é o que você paga',
  subtitulo:
    'Duas propostas com a mesma taxa podem custar valores bem diferentes — e o número que revela isso não é a taxa.',
  descricaoSeo:
    'O que é o Custo Efetivo Total, por que ele é sempre maior que a taxa de juros anunciada, o que entra nele e como usá-lo para comparar propostas de crédito.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['cet-custo-efetivo-total', 'portabilidade-de-credito', 'amortizacao-sac-price'],

  secoes: [
    {
      id: 'a-taxa-nao-basta',
      titulo: 'A taxa sozinha não diz o preço',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A taxa de juros mede o custo do dinheiro emprestado. O crédito, porém, não é só dinheiro emprestado: vem com tarifa de cadastro, seguro embutido, registro de contrato, avaliação de bem, tributo. Tudo isso é pago por quem toma o empréstimo, e nada disso aparece na taxa.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O Custo Efetivo Total é o número que reúne tudo. Ele responde à pergunta que a taxa não responde: considerando o que entra na sua conta e tudo o que sai dela, qual é a taxa que descreve esse contrato?',
        },
        {
          tipo: 'destaque',
          texto:
            'O CET é sempre maior ou igual à taxa de juros. Quando a diferença entre os dois é grande, o custo está nas tarifas — e é ali que se negocia.',
        },
      ],
    },

    {
      id: 'o-que-entra',
      titulo: 'O que entra na conta',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'Os juros propriamente ditos.',
            'Tarifas cobradas pela instituição — cadastro, avaliação de garantia, emissão de contrato.',
            'Seguros exigidos como condição do crédito, como o de morte e invalidez no financiamento imobiliário.',
            'Tributos incidentes sobre a operação.',
            'Qualquer despesa que você só teria se contratasse aquele crédito.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'O critério prático é esse último item. Se a despesa existe por causa do empréstimo, ela é custo do empréstimo — mesmo que a proposta a apresente como serviço à parte, opcional na aparência e obrigatório na prática.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Vale prestar atenção em seguro apresentado como opcional que aparece já marcado, e em tarifa diluída nas parcelas em vez de cobrada na abertura. Nos dois casos o CET revela o que a taxa esconde.',
        },
      ],
    },

    {
      id: 'como-comparar',
      titulo: 'Como comparar duas propostas',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Comparar propostas de crédito pela taxa é como comparar carros pelo tamanho do motor. A regra é curta:',
        },
        {
          tipo: 'lista',
          itens: [
            'Mesmo valor liberado e mesmo prazo: compare o CET, e o menor vence.',
            'Prazos diferentes: o CET continua comparável, porque é uma taxa; o total pago, não.',
            'Se uma proposta não informa o CET, peça — a instituição é obrigada a informá-lo antes da contratação.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'cet-custo-efetivo-total',
          texto:
            'A calculadora devolve o CET a partir do valor liberado, das parcelas e das tarifas informadas.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Um detalhe que muda a conta: o que importa é o valor que efetivamente cai na sua conta, não o valor do contrato. Quando as tarifas são financiadas junto, o contrato é maior que o dinheiro recebido — e é sobre o dinheiro recebido que o custo deve ser medido.',
        },
      ],
    },

    {
      id: 'trocar-de-credito',
      titulo: 'Quando vale trocar de credor',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A portabilidade permite levar uma dívida para outra instituição que ofereça condições melhores. A comparação, de novo, é pelo custo efetivo do saldo que resta — e não pela taxa anunciada na proposta nova.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Duas armadilhas comuns nessa troca: alongar o prazo faz a parcela cair e o total pago subir; e a proposta nova pode trazer tarifas próprias, que consomem parte da economia. As duas aparecem no CET e desaparecem na taxa.',
        },
        {
          tipo: 'chamada',
          slug: 'portabilidade-de-credito',
          texto:
            'A calculadora de portabilidade compara o saldo atual com a proposta nova, considerando prazo e custos.',
        },
      ],
    },
  ],
}
