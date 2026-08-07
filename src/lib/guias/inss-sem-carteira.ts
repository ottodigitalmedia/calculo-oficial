/**
 * Guia — "INSS de quem não tem carteira assinada".
 *
 * Bloco de autônomo e PJ (§11.3). As três alíquotas do art. 21 da Lei nº
 * 8.212/1991 são valor legal e entram por bloco que lê `lib/params/` (G-2) — a
 * pesquisa que as cadastrou está registrada em `ESTADO-DO-PROJETO` §7.42.
 *
 * NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const INSS_SEM_CARTEIRA: Guia = {
  slug: 'inss-sem-carteira-assinada',
  titulo: 'INSS de quem não tem carteira assinada',
  subtitulo:
    'São três alíquotas diferentes, e a escolha entre elas decide a que benefícios você terá direito.',
  descricaoSeo:
    'Como contribuir para o INSS sendo autônomo, facultativo ou sócio: as alíquotas, o que cada uma dá direito, e como funciona a complementação para não perder a aposentadoria por tempo de contribuição.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['inss-autonomo-e-facultativo', 'pro-labore', 'carne-leao'],

  secoes: [
    {
      id: 'quem-precisa',
      titulo: 'Quem precisa recolher por conta própria',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem tem carteira assinada não pensa nisso: o desconto sai da folha e a empresa recolhe. Fora da CLT, a contribuição é responsabilidade de quem trabalha — e ela não é opcional para quem exerce atividade remunerada.',
        },
        {
          tipo: 'lista',
          itens: [
            'Contribuinte individual: quem trabalha por conta própria ou presta serviço sem vínculo, incluindo o sócio que retira pró-labore.',
            'Facultativo: quem não exerce atividade remunerada e quer manter a proteção — estudante, dona de casa, desempregado.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A distinção importa porque as alíquotas e os direitos são diferentes, e porque contribuir como facultativo exercendo atividade remunerada é irregular — a Previdência pode reclassificar e cobrar a diferença.',
        },
      ],
    },

    {
      id: 'as-tres-aliquotas',
      titulo: 'As três alíquotas, e o que cada uma custa em direitos',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A alíquota cheia é a que preserva todos os direitos, incluindo a contagem de tempo para a aposentadoria por tempo de contribuição.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'inss-individual-aliquota-completa',
          legenda: 'Alíquota do plano completo, sobre o salário de contribuição declarado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Existe um plano simplificado, com alíquota menor, restrito a quem contribui sobre o salário mínimo. Ele custa menos por mês e cobra um preço em direitos.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'inss-individual-aliquota-simplificada',
          legenda: 'Alíquota do plano simplificado, limitada ao salário mínimo como base.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'E há uma alíquota reduzida para o facultativo de baixa renda que atenda aos requisitos de inscrição em cadastro social e ausência de renda própria.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'inss-individual-aliquota-baixa-renda',
          legenda: 'Alíquota do facultativo de baixa renda, também sobre o salário mínimo.',
        },
        {
          tipo: 'destaque',
          texto:
            'Quem contribui pelos planos reduzidos NÃO conta o tempo para a aposentadoria por tempo de contribuição — só para a por idade.',
        },
      ],
    },

    {
      id: 'a-complementacao',
      titulo: 'A complementação, que quase ninguém conhece',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem contribuiu pelo plano reduzido e depois quer aquele tempo contado para a aposentadoria por tempo de contribuição pode complementar a diferença, com acréscimos.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'inss-individual-complementacao',
          legenda: 'Diferença de alíquota a recolher para converter a contribuição reduzida em completa.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Vale saber disso antes de escolher o plano barato, e não depois: a complementação é possível, mas custa mais do que teria custado contribuir corretamente na época — e o dinheiro precisa existir no momento em que se descobre a necessidade.',
        },
        {
          tipo: 'chamada',
          slug: 'inss-autonomo-e-facultativo',
          texto:
            'A calculadora mostra o valor de cada plano e o que a complementação exigiria.',
        },
      ],
    },

    {
      id: 'o-socio',
      titulo: 'O sócio que retira pró-labore',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O sócio que trabalha na empresa é contribuinte individual, e a retirada dele tem uma particularidade: a empresa desconta uma parte e recolhe outra por fora, própria dela.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A parte descontada do sócio respeita o teto do salário de contribuição — acima dele, não há mais desconto. A parte da empresa não tem teto: ela incide sobre a retirada inteira, e é por isso que pró-labore alto custa mais à empresa do que parece.',
        },
        {
          tipo: 'chamada',
          slug: 'pro-labore',
          texto:
            'A calculadora de pró-labore separa a parte do sócio da parte da empresa, com o teto aplicado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Há ainda um efeito indireto que decide muito dinheiro: numa empresa do Simples que presta serviço, o pró-labore compõe a folha, e a folha decide qual anexo se aplica. Aumentar a retirada pode reduzir o imposto da empresa mais do que aumenta o custo previdenciário.',
        },
        {
          tipo: 'chamada',
          slug: 'clt-ou-pj',
          texto:
            'A calculadora de CLT, PJ ou MEI mostra o fator R e o anexo resultante da retirada informada.',
        },
      ],
    },
  ],
}
