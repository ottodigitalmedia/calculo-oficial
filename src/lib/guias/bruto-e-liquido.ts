/**
 * Guia — "Salário bruto e líquido: por que a diferença surpreende"
 * (`03-functional-spec` §4). Ligado a CALC-001.
 *
 * É o guia de topo de funil: quem chega buscando "quanto vou receber" cai
 * aqui. NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const BRUTO_E_LIQUIDO: Guia = {
  slug: 'salario-bruto-e-liquido',
  titulo: 'Salário bruto e líquido: por que a diferença surpreende',
  subtitulo: 'O valor combinado na entrevista e o valor que cai na conta nunca são o mesmo — e a distância entre eles cresce mais rápido que o salário.',
  descricaoSeo:
    'Por que o salário líquido é bem menor que o bruto: quais descontos são obrigatórios, quais dependem do contrato e o que aparece no holerite sem reduzir o que você recebe.',
  atualizadoEm: '2026-07-31',
  calculadoras: ['salario-liquido', 'inss', 'irrf'],

  secoes: [
    {
      id: 'bruto-e-liquido',
      titulo: 'O que é bruto e o que é líquido',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Bruto é o valor do contrato, o que se combina na proposta. Líquido é o que sobra depois dos descontos e efetivamente cai na conta. Entre um e outro há duas naturezas de desconto muito diferentes, e confundi-las é o que produz a surpresa.',
        },
        {
          tipo: 'lista',
          itens: [
            'Descontos legais: contribuição previdenciária e imposto de renda. Incidem sobre qualquer contrato com carteira assinada e não dependem de acordo.',
            'Descontos contratuais: plano de saúde, vale-transporte, vale-refeição, adiantamentos, empréstimo consignado. Variam de empresa para empresa e de pessoa para pessoa.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma estimativa de líquido só considera os legais. Os contratuais só quem tem o holerite em mãos consegue somar.',
        },
      ],
    },

    {
      id: 'por-que-a-diferenca-cresce',
      titulo: 'Por que a diferença cresce mais rápido que o salário',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Os dois descontos legais são progressivos: a parte do salário que entra em faixa mais alta é tributada mais caro que a parte de baixo. O efeito é que um aumento não chega inteiro ao líquido — parte dele é consumida na faixa nova.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'É a razão de um aumento no bruto parecer decepcionante no extrato. Não houve erro na folha: o pedaço acrescentado foi tributado na alíquota da faixa onde ele caiu, que é mais alta que a média do salário anterior.',
        },
        {
          tipo: 'destaque',
          texto:
            'A previdência tem teto e para de crescer; o imposto de renda não tem. Em salários altos, é o imposto que domina a diferença entre bruto e líquido.',
        },
        {
          tipo: 'chamada',
          slug: 'salario-liquido',
          texto: 'Simule dois valores de salário na calculadora e compare os líquidos — o efeito fica visível em poucos segundos.',
        },
      ],
    },

    {
      id: 'a-ordem-dos-descontos',
      titulo: 'A ordem dos descontos, e por que ela importa',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A previdência é calculada primeiro, sobre o salário. O imposto de renda vem depois, e a contribuição previdenciária já descontada é uma das deduções que reduzem a base sobre a qual ele incide.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Ou seja: o imposto não incide sobre o salário cheio, e também não incide sobre o valor previdenciário. Calcular os dois separadamente sobre o bruto, e somar, produz um desconto maior que o real.',
        },
        {
          tipo: 'lista',
          itens: [
            'Apura-se a contribuição previdenciária sobre o salário, por faixas.',
            'Subtrai-se essa contribuição, e as demais deduções, para chegar à base do imposto.',
            'Aplica-se a tabela do imposto sobre essa base.',
            'Líquido é o salário menos os dois, menos os descontos contratuais.',
          ],
        },
      ],
    },

    {
      id: 'o-que-nao-reduz-o-liquido',
      titulo: 'O que aparece no holerite e não reduz o líquido',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Nem tudo que está impresso no demonstrativo é desconto. Duas rubricas confundem com frequência:',
        },
        {
          tipo: 'lista',
          itens: [
            'O FGTS. É depósito feito pelo empregador em conta vinculada, calculado sobre a remuneração. Aparece informado no holerite, mas não sai do salário.',
            'A contribuição previdenciária patronal. É obrigação do empregador, calculada à parte, e não tem relação com o valor descontado do trabalhador.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Somar essas rubricas aos descontos é o terceiro motivo mais frequente de a conta feita em casa não bater com a do holerite.',
        },
      ],
    },

    {
      id: 'quando-nao-bate',
      titulo: 'Quando a estimativa não bate com o holerite',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Uma diferença pequena costuma vir de arredondamento ou de rubricas específicas da folha. Uma diferença grande quase sempre tem uma destas causas:',
        },
        {
          tipo: 'lista',
          itens: [
            'A base considerada pela empresa inclui adicionais, comissões ou horas extras, que a estimativa não conhece.',
            'O mês tem descontos contratuais que não entraram na simulação.',
            'O período usado na consulta tem tabela diferente da que valia no mês do holerite.',
            'Houve férias, décimo terceiro ou rescisão no mês, que seguem apuração própria.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Vale conferir a memória de cálculo etapa por etapa contra o demonstrativo: quando os números divergem, o ponto exato em que eles se separam costuma indicar a causa.',
        },
        {
          tipo: 'chamada',
          slug: 'inss',
          texto: 'Para isolar só a parte previdenciária, a calculadora de INSS mostra o desconto faixa a faixa.',
        },
      ],
    },
  ],
}
