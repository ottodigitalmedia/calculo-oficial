/**
 * Guia — "A declaração anual: restituição, modelos e o que dá para deduzir".
 *
 * Bloco de autônomo e PJ (§11.3), mas serve a todo assalariado também.
 *
 * A tabela anual e os limites de dedução entram por bloco que lê `lib/params/`
 * (G-2). NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const DECLARACAO_ANUAL: Guia = {
  slug: 'declaracao-anual-do-imposto-de-renda',
  titulo: 'A declaração anual: restituição, modelos e o que dá para deduzir',
  subtitulo:
    'A restituição não é um prêmio: é a devolução do que foi retido a mais durante o ano.',
  descricaoSeo:
    'Como funciona o ajuste anual do Imposto de Renda: por que dá restituição ou imposto a pagar, a diferença entre o modelo simplificado e o completo, e quais despesas são dedutíveis.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['restituicao-irpf', 'simplificado-ou-completo', 'carne-leao'],

  secoes: [
    {
      id: 'o-que-e-o-ajuste',
      titulo: 'O ajuste é um acerto de contas, não uma cobrança nova',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Ao longo do ano, cada fonte pagadora retém imposto na fonte usando a tabela mensal. Nenhuma delas conhece o seu ano inteiro: nem as outras rendas, nem as despesas que você pode deduzir.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A declaração anual junta tudo e recalcula. Se o total retido foi maior que o devido, a diferença volta como restituição; se foi menor, há imposto a pagar. Não é imposto novo — é o mesmo imposto, calculado com a informação completa.',
        },
        {
          tipo: 'destaque',
          texto:
            'Restituição grande não é boa notícia: significa que você emprestou dinheiro ao governo, sem juros, durante o ano inteiro.',
        },
      ],
    },

    {
      id: 'por-que-da-a-pagar',
      titulo: 'Por que tanta gente cai no imposto a pagar',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A causa mais comum tem uma explicação simples: cada fonte pagadora retém como se fosse a única. Com dois empregos, ou emprego mais aposentadoria, cada uma aplica a tabela desde a primeira faixa.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Somadas no ano, as duas rendas caem numa faixa mais alta do que qualquer uma delas isoladamente — e o ajuste cobra a diferença. Não houve erro em nenhuma das folhas: houve informação incompleta nas duas.',
        },
        {
          tipo: 'lista',
          itens: [
            'Duas ou mais fontes pagadoras no mesmo ano.',
            'Rendimento recebido de pessoa física sem recolhimento mensal do carnê-leão.',
            'Aluguel recebido e não declarado mensalmente.',
            'Venda de bens com ganho de capital não recolhido no mês.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'restituicao-irpf',
          texto:
            'A calculadora estima o saldo do ajuste — a restituir ou a pagar — com os seus números.',
        },
      ],
    },

    {
      id: 'os-dois-modelos',
      titulo: 'Simplificado ou completo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O modelo simplificado aplica um desconto padrão sobre os rendimentos tributáveis, com teto, e substitui TODAS as demais deduções. Quem opta por ele não lança despesa alguma — e não precisa comprovar nada.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'irpf-simplificado-limite-anual',
          legenda: 'Teto do desconto simplificado, qualquer que seja o rendimento.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O modelo completo soma as deduções reais. Ele vence quando essa soma supera o desconto padrão, o que costuma acontecer com quem tem dependentes, plano de saúde e escola.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Como o desconto simplificado tem teto e os rendimentos não, a partir de certo patamar de renda ele para de crescer — e o completo tende a vencer para quem tem despesas dedutíveis relevantes.',
        },
        {
          tipo: 'chamada',
          slug: 'simplificado-ou-completo',
          texto:
            'A calculadora apura os dois modelos com os seus números e mostra quanto o melhor economiza.',
        },
      ],
    },

    {
      id: 'o-que-deduz',
      titulo: 'O que dá para deduzir, e com qual limite',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Nem toda despesa é dedutível, e das dedutíveis nem todas têm o mesmo tratamento. Duas têm teto e uma não tem nenhum.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'irpf-dependente-anual',
          legenda: 'Dedução anual por dependente declarado.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'irpf-instrucao-limite-anual',
          legenda: 'Teto anual da despesa com instrução — por pessoa, não no conjunto.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Despesa médica não tem teto: a lei enumera o que é dedutível e não fixa limite. A contrapartida é a comprovação — recibo identificando quem prestou e quem pagou, e a despesa precisa ser sua ou de dependente declarado.',
        },
        {
          tipo: 'lista',
          itens: [
            'Ensino regular e superior entram na dedução de instrução; curso livre e material escolar não.',
            'Plano de saúde entra como despesa médica; medicamento avulso, não.',
            'Contribuição previdenciária oficial é dedutível sem teto.',
            'Pensão alimentícia entra apenas quando fixada em decisão judicial ou acordo homologado.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Declarar um dependente traz a dedução, mas obriga a somar os rendimentos dele à sua declaração. Quando o dependente tem renda própria relevante, o resultado pode ser pior — vale testar as duas formas antes de decidir.',
        },
      ],
    },
  ],
}
