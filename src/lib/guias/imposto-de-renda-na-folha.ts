/**
 * Guia — "Imposto de renda na folha: como chegar ao valor"
 * (`03-functional-spec` §4). Ligado a CALC-015 (IRRF) e CALC-001.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const IMPOSTO_DE_RENDA_NA_FOLHA: Guia = {
  slug: 'imposto-de-renda-na-folha',
  titulo: 'Imposto de renda na folha: como chegar ao valor',
  subtitulo: 'O imposto não incide sobre o salário. Incide sobre a base — e chegar até ela é metade do trabalho.',
  descricaoSeo:
    'Como o Imposto de Renda Retido na Fonte é calculado no salário: a base de cálculo, as deduções legais, o desconto simplificado e a parcela a deduzir da tabela.',
  atualizadoEm: '2026-07-31',
  calculadoras: ['irrf', 'salario-liquido'],

  secoes: [
    {
      id: 'a-base-nao-e-o-salario',
      titulo: 'A base não é o salário',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O primeiro passo do cálculo não tem nada a ver com a tabela do imposto: é descobrir sobre quanto o imposto incide. Esse valor, a base de cálculo, é menor que o salário bruto — às vezes bem menor.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Procurar o salário bruto diretamente na tabela do imposto costuma apontar para uma faixa mais alta que a real, e o valor estimado sai maior que o descontado no holerite.',
        },
        {
          tipo: 'destaque',
          texto: 'A ordem importa: primeiro se apura a base, só depois se consulta a tabela.',
        },
      ],
    },

    {
      id: 'dois-caminhos',
      titulo: 'Dois caminhos para chegar à base, e o mais favorável vence',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A legislação permite apurar a base de duas maneiras, e quem calcula deve aplicar a que resultar em menos imposto. Não é escolha do empregador nem do trabalhador: é comparação obrigatória.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O primeiro caminho soma as deduções legais e as subtrai do rendimento: a contribuição previdenciária efetivamente descontada, um valor fixo por dependente e a pensão alimentícia fixada judicialmente.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O segundo caminho ignora tudo isso e aplica um desconto simplificado de valor fixo, em substituição às deduções. Para quem tem poucas deduções, ele costuma ser mais vantajoso; para quem tem muitos dependentes ou paga pensão, geralmente não.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'irrf-desconto-simplificado',
          legenda: 'Desconto simplificado mensal, aplicado em substituição às deduções legais quando for mais favorável.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'irrf-deducao-dependente',
          legenda: 'Dedução mensal por dependente, no caminho das deduções legais.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma consequência prática: declarar um dependente a mais nem sempre reduz o imposto. Se o caminho simplificado já estava vencendo, acrescentar dedução ao outro caminho pode não mudar nada até que ele ultrapasse o simplificado.',
        },
      ],
    },

    {
      id: 'a-tabela',
      titulo: 'A tabela, e a tal da parcela a deduzir',
      blocos: [
        {
          tipo: 'tabelaDeFaixas',
          parametroId: 'irrf-tabela-progressiva',
          legenda: 'Faixas, alíquotas e parcela a deduzir aplicadas sobre a base de cálculo mensal.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A tabela do imposto também é progressiva, mas é aplicada de um jeito diferente da previdenciária. Em vez de fatiar a base e somar as parcelas, encontra-se a faixa da base, multiplica-se a base inteira pela alíquota daquela faixa e subtrai-se a parcela a deduzir.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A parcela a deduzir existe justamente para corrigir esse atalho. Ela devolve o excesso que a multiplicação sobre a base inteira cobrou a mais nas faixas de baixo. Os dois métodos dão exatamente o mesmo resultado — o da parcela a deduzir só tem menos passos.',
        },
        {
          tipo: 'destaque',
          texto: 'Esquecer de subtrair a parcela a deduzir é o segundo erro mais comum, e ele infla o imposto de forma expressiva.',
        },
      ],
    },

    {
      id: 'a-faixa-isenta',
      titulo: 'A faixa isenta e o redutor',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A primeira faixa da tabela tem alíquota zero: base até aquele limite não gera imposto. Além dela, a legislação mais recente criou um redutor que diminui o imposto apurado de quem recebe até certo patamar, encolhendo conforme o rendimento sobe até desaparecer.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O redutor nunca ultrapassa o imposto devido — ou seja, não gera valor a receber. Quando ele iguala o imposto, o resultado é zero, e não negativo.',
        },
        {
          tipo: 'chamada',
          slug: 'irrf',
          texto:
            'A calculadora de IRRF mostra na memória qual caminho venceu, o valor do redutor aplicado e a norma de cada parâmetro usado.',
        },
      ],
    },

    {
      id: 'retencao-nao-e-final',
      titulo: 'A retenção mensal não é o imposto final',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O que sai do holerite é antecipação. O acerto acontece na declaração anual, que considera o ano inteiro, outras fontes de renda e deduções que a folha não conhece — despesas médicas e de instrução, por exemplo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Por isso, uma retenção mensal alta não significa imposto alto no fim das contas, e uma retenção baixa não garante que não haverá valor a pagar depois.',
        },
        {
          tipo: 'lista',
          itens: [
            'O décimo terceiro é tributado separadamente, em apuração exclusiva, e não se soma ao salário do mês.',
            'Férias gozadas entram na base do mês em que são pagas, o que costuma elevar a retenção daquele mês.',
            'Rendimentos de mais de um emprego são somados só na declaração, não na folha de cada um.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'salario-liquido',
          texto: 'Para ver o imposto junto do INSS e chegar ao valor que cai na conta, use a calculadora de salário líquido.',
        },
      ],
    },
  ],
}
