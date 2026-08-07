/**
 * Guia — "Quanto cobrar por hora".
 *
 * Bloco de autônomo e PJ (§11.3), o segundo item que sobrou dele.
 *
 * Sem valor legal envolvido: precificação é método, não norma. NENHUM VALOR
 * LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const QUANTO_COBRAR_POR_HORA: Guia = {
  slug: 'quanto-cobrar-por-hora',
  titulo: 'Quanto cobrar por hora',
  subtitulo:
    'Dividir o salário desejado por 220 horas é a conta que leva o autônomo a ganhar menos que um empregado.',
  descricaoSeo:
    'Como calcular o preço da hora de trabalho autônomo: horas realmente faturáveis, custos fixos, impostos e as provisões que a CLT dá e o autônomo precisa criar.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['precificacao-de-hora', 'inss-autonomo-e-facultativo', 'clt-ou-pj'],

  secoes: [
    {
      id: 'o-erro-do-220',
      titulo: 'O erro está no divisor',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A conta mais comum pega a renda mensal desejada e divide pelas horas de um mês de trabalho. O resultado é um preço de hora que parece razoável e que, na prática, produz renda menor que a de um emprego equivalente.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O problema é o divisor. Nem toda hora trabalhada é faturável: prospecção, orçamento, reunião não cobrada, retrabalho, administração, estudo. Essas horas existem, são necessárias e não entram em nota nenhuma.',
        },
        {
          tipo: 'destaque',
          texto:
            'Quem fatura metade das horas que trabalha precisa cobrar o dobro por hora para chegar ao mesmo lugar.',
        },
        {
          tipo: 'chamada',
          slug: 'precificacao-de-hora',
          texto:
            'A calculadora parte das horas realmente faturáveis, e não do total trabalhado.',
        },
      ],
    },

    {
      id: 'o-que-a-clt-dava',
      titulo: 'O que a CLT dava e agora é por sua conta',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem sai da carteira assinada perde um conjunto de coisas que continuavam acontecendo mesmo quando não se trabalhava — e que agora precisam estar embutidas no preço.',
        },
        {
          tipo: 'lista',
          itens: [
            'Férias: um mês por ano sem faturar, mais o adicional que a CLT pagava.',
            'Décimo terceiro: um mês a mais de renda que agora não existe sozinho.',
            'Fundo de garantia: o depósito mensal que ninguém mais faz por você.',
            'Dias parados por doença, que na CLT eram cobertos.',
            'Contribuição previdenciária, que passa a ser recolhida por você.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Nada disso é opcional: são despesas certas, apenas distribuídas de forma irregular. Não embuti-las no preço da hora significa financiá-las com o próprio padrão de vida quando elas chegam.',
        },
        {
          tipo: 'chamada',
          slug: 'inss-autonomo-e-facultativo',
          texto:
            'A calculadora de INSS do autônomo mostra o custo da contribuição em cada plano.',
        },
      ],
    },

    {
      id: 'os-custos-fixos',
      titulo: 'Os custos fixos entram, mesmo os pequenos',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'Contabilidade, quando há empresa aberta.',
            'Impostos sobre o faturamento, conforme o regime.',
            'Ferramentas, assinaturas de software e equipamento — com a reposição dele.',
            'Espaço de trabalho, energia e internet, ainda que em casa.',
            'Formação e atualização, que num trabalho técnico não são luxo.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Somados e divididos pelas horas faturáveis, esses custos costumam representar uma parcela relevante do preço — e quem os ignora descobre no fim do ano que trabalhou muito para pagar ferramenta.',
        },
        {
          tipo: 'chamada',
          slug: 'clt-ou-pj',
          texto:
            'Para comparar o resultado com uma proposta de carteira assinada, a calculadora de CLT, PJ ou MEI põe os dois lados completos.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma nota final sobre preço: a conta descrita aqui devolve o piso — abaixo dele o trabalho não se sustenta. O quanto acima do piso se cobra é decisão de posicionamento, e essa nenhuma calculadora resolve.',
        },
      ],
    },
  ],
}
