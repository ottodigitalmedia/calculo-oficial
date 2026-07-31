/**
 * Guia — "Como o desconto do INSS é calculado" (`03-functional-spec` §4).
 *
 * Ligado a CALC-016 (INSS) e CALC-001 (salário líquido).
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1). Faixas, alíquotas e teto entram
 * pelos blocos que leem `lib/params/`.
 */

import type { Guia } from './tipos'

export const COMO_O_INSS_E_CALCULADO: Guia = {
  slug: 'como-o-inss-e-calculado',
  titulo: 'Como o desconto do INSS é calculado',
  subtitulo: 'A alíquota da sua faixa não incide sobre o salário inteiro — e é aí que quase todo mundo erra a conta.',
  descricaoSeo:
    'Entenda o cálculo progressivo do INSS na folha: por que a alíquota da faixa não vale para o salário todo, como funciona o teto e o que é alíquota efetiva.',
  atualizadoEm: '2026-07-31',
  calculadoras: ['inss', 'salario-liquido'],

  secoes: [
    {
      id: 'o-erro-mais-comum',
      titulo: 'O erro mais comum',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quase todo mundo faz a mesma conta: olha a tabela, encontra a linha onde o próprio salário se encaixa, pega a alíquota daquela linha e multiplica pelo salário inteiro. O resultado sai bem maior que o desconto real do holerite — e a diferença faz a pessoa achar que foi descontada a mais.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A tabela não funciona assim. Ela é progressiva por faixa: cada pedaço do salário é tributado pela alíquota do pedaço onde ele cai, e não pela alíquota da faixa mais alta que o salário alcança.',
        },
        {
          tipo: 'destaque',
          texto:
            'Chegar na última faixa não significa pagar a alíquota mais alta sobre tudo. Significa pagar a alíquota mais alta só sobre a parte que passou do limite anterior.',
        },
      ],
    },

    {
      id: 'como-a-conta-anda',
      titulo: 'Como a conta anda, passo a passo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O salário é fatiado nos limites das faixas. Cada fatia recebe a alíquota da sua própria faixa, e o desconto é a soma das fatias.',
        },
        {
          tipo: 'lista',
          itens: [
            'A parte do salário que cabe dentro da primeira faixa é multiplicada pela alíquota da primeira faixa.',
            'A parte que passa da primeira e cabe na segunda é multiplicada pela alíquota da segunda — e só ela.',
            'O mesmo vale para as faixas seguintes, até acabar o salário ou acabar a tabela.',
            'O desconto é a soma de todas essas parcelas.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quem tem salário na primeira faixa paga uma alíquota única, porque só existe uma fatia. A partir daí, cada aumento salarial só é tributado mais caro na parte que ultrapassa o limite — o que já estava embaixo continua sendo cobrado igual.',
        },
      ],
    },

    {
      id: 'a-tabela',
      titulo: 'A tabela em vigor',
      blocos: [
        {
          tipo: 'tabelaDeFaixas',
          parametroId: 'inss-tabela-progressiva',
          legenda: 'Faixas e alíquotas da contribuição previdenciária do trabalhador com carteira assinada.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Os limites são reajustados por portaria, normalmente no começo do ano, junto com o salário mínimo. Por isso o mesmo salário pode gerar descontos diferentes em anos diferentes, sem nada ter mudado no contrato.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'salario-minimo',
          legenda: 'Piso salarial nacional, que também baliza o início da tabela.',
        },
      ],
    },

    {
      id: 'o-teto',
      titulo: 'O teto: a partir daqui o desconto para de crescer',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A última faixa tem um limite superior, e ele é um teto de verdade: a parte do salário que passa desse valor não sofre desconto previdenciário nenhum. Quem ganha muito acima do teto tem sempre a mesma contribuição, em reais, de quem ganha exatamente o teto.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'É a razão de o desconto do INSS, em folha, parecer proporcionalmente pequeno em salários altos: ele parou de crescer, enquanto o salário continuou.',
        },
      ],
    },

    {
      id: 'aliquota-efetiva',
      titulo: 'Alíquota efetiva: o número que realmente descreve o seu desconto',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Alíquota efetiva é o desconto dividido pelo salário bruto. Ela é sempre menor que a alíquota da faixa em que o salário se encaixa — consequência direta do cálculo por fatias.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Vale a pena olhar esse número antes de concluir que houve erro na folha. Se a alíquota efetiva estiver entre a alíquota da primeira faixa e a da faixa onde o salário caiu, a conta está coerente com a tabela.',
        },
        {
          tipo: 'chamada',
          slug: 'inss',
          texto: 'A calculadora de INSS mostra uma linha por faixa e a alíquota efetiva ao lado do total.',
        },
      ],
    },

    {
      id: 'o-que-nao-entra',
      titulo: 'O que não entra nessa conta',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'A parte paga pelo empregador. Ela existe, é calculada à parte e não aparece como desconto no holerite.',
            'O FGTS. É depósito do empregador em conta vinculada, não desconto do salário — por isso não reduz o líquido.',
            'Contribuições de autônomos e de segurados facultativos, que seguem regra própria.',
            'Adicionais e verbas que a legislação exclui da base de contribuição, que variam conforme a natureza de cada rubrica.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Também fica de fora qualquer acordo ou convenção coletiva que altere rubricas específicas da folha. O cálculo aqui parte do salário informado, sem conhecer o teor do seu contrato.',
        },
      ],
    },

    {
      id: 'conferindo',
      titulo: 'Conferindo o seu holerite',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Se o valor descontado não bater, três coisas explicam a maior parte das diferenças: a base de cálculo pode incluir verbas além do salário-base, o mês pode ter tabela diferente da que você consultou, ou o desconto pode ter sido calculado sobre a remuneração total e não sobre o salário contratual.',
        },
        {
          tipo: 'chamada',
          slug: 'salario-liquido',
          texto: 'Para ver o INSS junto do Imposto de Renda e chegar ao líquido, use a calculadora de salário líquido.',
        },
      ],
    },
  ],
}
