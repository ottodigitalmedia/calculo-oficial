/**
 * Guia — "Aposentadoria pela regra de pontos: o que conta e o que falta".
 *
 * Lote 5 da expansão do catálogo, ligado a CALC-103. Guia novo porque a
 * pergunta é a de maior volume da previdência — "quando posso me aposentar?" —
 * e nenhuma das páginas existentes responde a ela.
 *
 * **O texto declara o que a calculadora NÃO faz.** Existem quatro regras de
 * transição e uma regra permanente; esta trata de uma. Um guia que não dissesse
 * isso deixaria o leitor concluir que não tem direito quando, por outra regra,
 * talvez tenha.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const APOSENTADORIA_REGRA_DE_PONTOS: Guia = {
  slug: 'aposentadoria-regra-de-pontos',
  titulo: 'Aposentadoria pela regra de pontos: o que conta e o que falta',
  tituloSeo: 'Aposentadoria por pontos: o que conta e o que falta',
  subtitulo:
    'A soma de idade e tempo de contribuição abre a aposentadoria — desde que o tempo mínimo também esteja cumprido.',
  descricaoSeo:
    'Como funciona a regra de pontos da aposentadoria: a soma de idade e contribuição, o tempo mínimo exigido e o aumento anual da pontuação.',
  atualizadoEm: '2026-09-18',
  calculadoras: ['aposentadoria-por-pontos'],

  secoes: [
    {
      id: 'dois-requisitos',
      titulo: 'São dois requisitos, e os dois precisam ser cumpridos',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A regra de pontos soma a sua idade ao seu tempo de contribuição. Alcançada a pontuação do ano, falta ainda o segundo requisito: o tempo mínimo de contribuição, que é diferente para homens e mulheres. Os dois são cumulativos — e é aqui que a maioria das contas de internet erra.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-tempo-minimo-mulher',
          legenda: 'Tempo mínimo de contribuição exigido da mulher, em anos.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-tempo-minimo-homem',
          legenda: 'Tempo mínimo de contribuição exigido do homem, em anos.',
        },
        {
          tipo: 'destaque',
          texto:
            'Quem soma muitos pontos por causa da idade, mas contribuiu pouco, não se aposenta por esta regra — por mais alta que seja a soma.',
        },
      ],
    },

    {
      id: 'a-pontuacao-sobe',
      titulo: 'A pontuação sobe um ponto por ano',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A exigência não é fixa: ela cresce a cada ano desde 2020, até um teto definido na própria Emenda. O efeito prático é menos intuitivo do que parece — quem continua contribuindo ganha dois pontos por ano, um de idade e um de contribuição, enquanto a régua sobe um. A distância diminui, mas na metade da velocidade.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-pontos-mulher',
          legenda: 'Pontuação exigida da mulher no ano vigente.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-pontos-homem',
          legenda: 'Pontuação exigida do homem no ano vigente.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quando a exigência chega ao teto, ela para de subir — e a partir daí cada ano de contribuição aproxima o dobro. É por isso que a projeção do ano de cumprimento muda de ritmo no meio do caminho.',
        },
        {
          tipo: 'chamada',
          slug: 'aposentadoria-por-pontos',
          texto:
            'A calculadora mostra seus pontos de hoje, a exigência do ano e em que mês os dois requisitos se cumprem, mantida a contribuição.',
        },
      ],
    },

    {
      id: 'quem-pode-usar',
      titulo: 'Quem pode usar esta regra — e quais são as outras',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A regra de pontos é de transição: vale para quem já era filiado ao Regime Geral quando a reforma entrou em vigor, em novembro de 2019. Quem começou a contribuir depois segue a regra permanente, com idade mínima.',
        },
        {
          tipo: 'lista',
          itens: [
            'Regra de pontos: soma de idade e tempo de contribuição, com tempo mínimo — a desta página.',
            'Regra da idade progressiva: idade mínima que sobe ano a ano, também com tempo mínimo de contribuição.',
            'Pedágio menor: para quem estava a menos de dois anos do tempo exigido quando a reforma entrou em vigor — contribui-se metade do que faltava, além do tempo em si.',
            'Pedágio maior: idade mínima mais baixa, em troca de contribuir o dobro do tempo que faltava naquela data.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Vale a regra mais favorável ao segurado, e a comparação depende do histórico completo de contribuições. Antes de decidir a data do pedido, vale conferir o extrato do CNIS e simular também as outras regras — inclusive porque o VALOR do benefício muda de uma para outra.',
        },
        {
          tipo: 'chamada',
          slug: 'regras-de-aposentadoria',
          texto: 'O comparador de regras põe todas lado a lado e mostra em que mês cada uma se cumpre.',
        },
      ],
    },
  ],
}
