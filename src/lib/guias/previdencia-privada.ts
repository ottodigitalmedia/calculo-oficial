/**
 * Guia — "Previdência privada: PGBL, VGBL e os dois regimes de imposto".
 *
 * Lote 3 da expansão do catálogo, ligado a CALC-094. Guia novo porque a
 * pergunta é nova: os guias de imposto que já existem tratam da folha, da renda
 * fixa e da declaração anual. Aqui a dúvida é outra — duas escolhas feitas na
 * contratação decidem quanto o imposto leva anos depois.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const PREVIDENCIA_PRIVADA_GUIA: Guia = {
  slug: 'previdencia-privada-pgbl-e-vgbl',
  titulo: 'Previdência privada: PGBL, VGBL e os dois regimes de imposto',
  tituloSeo: 'PGBL, VGBL e os dois regimes de imposto',
  subtitulo:
    'O que muda entre os dois planos, o que muda entre os dois regimes — e por que a conta do resgate depende de escolhas feitas na contratação.',
  descricaoSeo:
    'Como o imposto incide no PGBL e no VGBL, a diferença entre os regimes regressivo e progressivo e o que decide a alíquota do resgate.',
  atualizadoEm: '2026-09-17',
  calculadoras: ['resgate-de-previdencia-privada'],

  secoes: [
    {
      id: 'duas-escolhas',
      titulo: 'Duas escolhas, feitas antes de existir saldo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem contrata um plano de previdência complementar decide duas coisas que só vão produzir efeito anos depois: o tipo de plano — PGBL ou VGBL — e o regime de tributação — regressivo ou progressivo. A primeira decide sobre QUAL valor o imposto incide; a segunda, com QUAL alíquota. Nenhuma das duas aparece no extrato mensal, e é por isso que o resgate costuma surpreender.',
        },
      ],
    },

    {
      id: 'pgbl-ou-vgbl',
      titulo: 'PGBL e VGBL: a diferença está na base',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'No PGBL as contribuições podem ser deduzidas na declaração completa, dentro de um limite da renda tributável, e por isso o resgate é tributado por inteiro. No VGBL não há dedução na entrada, e o imposto alcança apenas o rendimento do plano.',
        },
        {
          tipo: 'lista',
          itens: [
            'PGBL tende a compensar para quem declara no modelo completo e contribui para a Previdência Social.',
            'VGBL costuma fazer sentido para quem declara no modelo simplificado ou já usa todo o limite de dedução.',
            'A escolha errada não se corrige no resgate: ela aparece como imposto sobre um valor maior do que o necessário.',
          ],
        },
      ],
    },

    {
      id: 'os-dois-regimes',
      titulo: 'Regressivo e progressivo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'No regime regressivo, a alíquota cai conforme o prazo de acumulação — quanto mais tempo o dinheiro fica, menos imposto — e o que é retido é definitivo: não volta a ser ajustado na declaração.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'previdencia-regressiva-ate-2-anos',
          legenda: 'Alíquota do regime regressivo para o prazo de acumulação mais curto.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'previdencia-regressiva-acima-de-10-anos',
          legenda: 'Alíquota do regime regressivo para o prazo mais longo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'No regime progressivo, a fonte retém uma alíquota fixa no resgate — e ela é apenas antecipação. O valor entra na declaração anual junto com os demais rendimentos, e é a tabela progressiva que decide o imposto real.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'previdencia-progressiva-antecipacao',
          legenda: 'Retenção na fonte do regime progressivo, como antecipação.',
        },
        {
          tipo: 'chamada',
          slug: 'resgate-de-previdencia-privada',
          texto:
            'A calculadora de resgate aplica a alíquota do seu prazo, separa a base conforme o plano e mostra o líquido com a memória de cálculo.',
        },
      ],
    },

    {
      id: 'o-prazo-e-de-cada-aporte',
      titulo: 'O prazo é de cada aporte, não do plano',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Este é o ponto que mais produz conta errada no regime regressivo: o prazo de acumulação é contado de cada contribuição até o pagamento. Um plano aberto há quinze anos, com aportes mensais, tem parcelas velhas na menor alíquota e parcelas recentes na mais alta. O resgate parcial segue a ordem definida no plano, e o extrato da entidade é onde essa composição aparece.',
        },
        {
          tipo: 'destaque',
          texto:
            'Calcular o saldo inteiro pela alíquota mais baixa, só porque o plano é antigo, subestima o imposto — às vezes por muito.',
        },
      ],
    },
  ],
}
