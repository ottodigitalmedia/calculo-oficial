/**
 * Guia — "Alugar ou comprar: a conta que quase ninguém faz certo".
 *
 * Bloco de imóveis (§11.3). O ponto que ele precisa acertar é o erro estrutural
 * da comparação popular — "aluguel é dinheiro jogado fora" —, que ignora o
 * custo de oportunidade da entrada e os custos de posse.
 *
 * Sem valor legal envolvido: é comparação patrimonial, não norma. NENHUM VALOR
 * LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const ALUGAR_OU_COMPRAR: Guia = {
  slug: 'alugar-ou-comprar',
  titulo: 'Alugar ou comprar: a conta que quase ninguém faz certo',
  subtitulo:
    'Comparar aluguel com parcela é a forma errada de decidir — e é a forma como quase todo mundo decide.',
  descricaoSeo:
    'Por que comparar aluguel com prestação leva à conclusão errada, o que entra de verdade na conta de comprar, e como comparar os dois caminhos pelo patrimônio ao fim do prazo.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['alugar-ou-comprar', 'capacidade-de-financiamento', 'rentabilidade-de-aluguel'],

  secoes: [
    {
      id: 'o-erro-da-comparacao',
      titulo: 'O erro está em comparar aluguel com parcela',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A comparação popular põe o aluguel de um lado e a prestação do financiamento do outro, e conclui que pagar prestação é melhor porque "no fim o imóvel é seu". A conclusão pode até estar certa, mas o raciocínio não sustenta.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Duas coisas ficam de fora dele. A primeira é que boa parte da prestação, sobretudo nos primeiros anos, é juros — dinheiro que vai embora exatamente como o aluguel. A segunda é que quem compra imobiliza a entrada, e esse dinheiro deixaria de render se estivesse aplicado.',
        },
        {
          tipo: 'destaque',
          texto:
            'A pergunta correta não é "qual mensalidade é menor". É "com qual dos dois caminhos eu tenho mais patrimônio ao fim do prazo".',
        },
      ],
    },

    {
      id: 'o-que-entra',
      titulo: 'O que entra de verdade em cada lado',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem compra assume custos que não existem para quem aluga, e alguns deles são recorrentes:',
        },
        {
          tipo: 'lista',
          itens: [
            'Os custos de aquisição — imposto de transmissão, registro, escritura —, que somam uma parcela relevante do valor e não voltam.',
            'O imposto anual sobre a propriedade, que é do dono e não do inquilino.',
            'A manutenção estrutural e as obras do condomínio, que recaem sobre o proprietário.',
            'Os seguros obrigatórios embutidos na prestação do financiamento.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'E quem aluga tem uma vantagem que raramente é contabilizada: a entrada e a diferença mensal, quando o aluguel é menor que a prestação, permanecem aplicadas e rendendo. Ignorar esse rendimento é o que faz a compra parecer melhor do que às vezes é.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-de-aquisicao-de-imovel',
          texto:
            'A calculadora de custo de aquisição mostra quanto se paga além do preço anunciado.',
        },
      ],
    },

    {
      id: 'como-comparar',
      titulo: 'A comparação pelo patrimônio',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O método que funciona é projetar os dois cenários até o mesmo horizonte e olhar o que sobra em cada um:',
        },
        {
          tipo: 'lista',
          itens: [
            'Comprando: valor estimado do imóvel ao fim do prazo, menos o saldo devedor que ainda existir.',
            'Alugando: a entrada aplicada, mais os aportes mensais da diferença entre aluguel e prestação, rendendo pelo prazo inteiro.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Feita assim, a comparação passa a depender de três variáveis, e não de opinião: a valorização do imóvel, o rendimento da aplicação e o prazo. Mudar qualquer uma delas pode inverter o resultado — e é por isso que a resposta não é a mesma para todo mundo.',
        },
        {
          tipo: 'chamada',
          slug: 'alugar-ou-comprar',
          texto:
            'A calculadora projeta os dois cenários e mostra a diferença de patrimônio ao fim do prazo.',
        },
      ],
    },

    {
      id: 'o-que-a-conta-nao-decide',
      titulo: 'O que a conta não decide',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O resultado numérico é um dos fatores da decisão, e não o único. Alguns dos mais pesados não têm como entrar numa planilha:',
        },
        {
          tipo: 'lista',
          itens: [
            'Estabilidade: quem pode precisar mudar de cidade em poucos anos tende a perder com a compra, porque os custos de aquisição não se diluem.',
            'A liberdade de reformar, ter animal, ficar quanto tempo quiser.',
            'O peso de dever a longo prazo, que afeta decisões de carreira mesmo quando a conta fecha.',
            'A disciplina real de investir a diferença — o cenário do aluguel só funciona se ela for aplicada de fato.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Esse último item merece honestidade. A comparação supõe que a diferença mensal seja investida todo mês, sem falha. Quem sabe que não fará isso deve considerar que, na prática, o financiamento funciona como poupança forçada — e isso tem valor, ainda que não apareça na conta.',
        },
        {
          tipo: 'chamada',
          slug: 'capacidade-de-financiamento',
          texto:
            'Se a decisão for comprar, a calculadora de capacidade mostra quanto de imóvel cabe no orçamento.',
        },
      ],
    },
  ],
}
