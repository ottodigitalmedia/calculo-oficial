/**
 * Guia — "Abono salarial do PIS: quem recebe e quanto".
 *
 * Lote 10 da expansão do catálogo, ligado a CALC-118. Guia novo porque a
 * pergunta é nova: nenhum guia existente fala de benefício pago pelo governo a
 * quem trabalhou com carteira, e o abono mudou de regra com a EC nº 135/2024 —
 * que é o que mais se pergunta sobre ele.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const ABONO_SALARIAL_GUIA: Guia = {
  slug: 'abono-salarial',
  titulo: 'Abono salarial do PIS: quem recebe e quanto',
  tituloSeo: 'Abono salarial do PIS: quem recebe e quanto',
  subtitulo:
    'O limite de renda deixou de acompanhar o salário mínimo, e o valor depende de quantos meses você trabalhou dois anos antes.',
  descricaoSeo:
    'Como funciona o abono salarial do PIS/Pasep depois da Emenda 135: o limite de renda corrigido pelo INPC, o valor proporcional aos meses e o calendário.',
  atualizadoEm: '2026-09-18',
  calculadoras: ['abono-salarial-pis'],

  secoes: [
    {
      id: 'o-limite-mudou',
      titulo: 'O limite de renda mudou — e vai continuar mudando',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Até o pagamento de 2025, recebia o abono quem tinha ganhado, em média, até dois salários mínimos no ano-base. A Emenda Constitucional nº 135, de 2024, congelou esse limite no valor de 2023 e passou a corrigi-lo pelo INPC, a inflação medida pelo IBGE. Como o salário mínimo costuma subir mais que a inflação, o limite, medido em salários mínimos, tende a encolher a cada ano.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'abono-limite-remuneracao-media',
          legenda: 'Limite de remuneração média mensal do ano-base, para o pagamento do ano.',
        },
        {
          tipo: 'destaque',
          texto:
            'A Constituição garante um piso: o limite nunca fica abaixo de uma vez e meia o salário mínimo. Quando a correção pela inflação chegar lá, o piso passa a valer.',
        },
      ],
    },

    {
      id: 'o-valor',
      titulo: 'O valor é proporcional aos meses',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O abono é uma fração do salário mínimo da data do pagamento por mês trabalhado no ano-base. Quinze dias ou mais de trabalho no mês contam como mês inteiro, e o total é arredondado para cima até o real inteiro.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'abono-fracao-por-mes',
          legenda: 'Fração do salário mínimo por mês trabalhado.',
        },
        {
          tipo: 'chamada',
          slug: 'abono-salarial-pis',
          texto: 'A calculadora do abono confere o critério de renda e faz a conta dos meses.',
        },
      ],
    },

    {
      id: 'quando-e-quem',
      titulo: 'Quando se recebe, e quem mais precisa cumprir o quê',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O abono paga o trabalho de dois anos antes: o calendário de um ano é o do ano-base de dois anos atrás. O pagamento é escalonado pelo mês de nascimento, a partir de fevereiro.',
        },
        {
          tipo: 'lista',
          itens: [
            'Ter trabalhado pelo menos trinta dias no ano-base para empregador que contribui para o PIS ou o Pasep.',
            'Estar cadastrado no PIS/Pasep há pelo menos cinco anos, contados do primeiro emprego.',
            'Ter os dados informados pelo empregador no eSocial — sem isso, o direito não é identificado.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A remuneração média que entra no critério não conta o décimo terceiro nem o terço de férias.',
        },
      ],
    },
  ],
}
