/**
 * Guia — "As contas da casa: luz, água e gás".
 *
 * Bloco de casa e consumo (§11.3). Cobre as três calculadoras de consumo
 * doméstico.
 *
 * A tarifa é campo do usuário por decisão do catálogo (§12), e não parâmetro —
 * ela varia por distribuidora, bandeira e tributo estadual. NENHUM VALOR LEGAL
 * NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const AS_CONTAS_DA_CASA: Guia = {
  slug: 'as-contas-da-casa',
  titulo: 'As contas da casa: luz, água e gás',
  subtitulo:
    'Descobrir qual aparelho pesa na conta é mais útil que qualquer dica genérica de economia.',
  descricaoSeo:
    'Como estimar o consumo de energia por aparelho, entender a conta de água e comparar o custo do gás de botijão com o encanado.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['consumo-de-energia', 'conta-de-agua', 'custo-do-botijao-de-gas'],

  secoes: [
    {
      id: 'a-conta-de-luz',
      titulo: 'A conta de luz, aparelho por aparelho',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A conta de luz mede uma coisa só: energia consumida, em quilowatt-hora. E energia é potência multiplicada por tempo — o que explica por que aparelhos muito diferentes podem pesar igual.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Um chuveiro tem potência altíssima e fica ligado poucos minutos; uma geladeira tem potência baixa e nunca desliga. Os dois costumam disputar o topo da conta, por caminhos opostos.',
        },
        {
          tipo: 'lista',
          itens: [
            'Aparelhos de aquecimento — chuveiro, forno, secadora, ferro — têm potência alta e pesam mesmo em pouco tempo de uso.',
            'Aparelhos que ficam ligados o tempo todo pesam pelo tempo, não pela potência.',
            'Aparelhos com motor ou termostato não consomem a potência cheia o tempo todo: ligam e desligam sozinhos.',
            'O consumo em espera existe, é pequeno por aparelho e relevante somado.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'consumo-de-energia',
          texto:
            'A calculadora estima o custo mensal de cada aparelho a partir da potência e das horas de uso.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A tarifa vem da sua fatura, e não de uma média: ela muda por distribuidora, por bandeira tarifária e pelos tributos do seu estado. Um valor médio nacional pareceria tão sólido quanto o resto da conta sem ter o mesmo lastro.',
        },
      ],
    },

    {
      id: 'a-conta-de-agua',
      titulo: 'A conta de água não é proporcional',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A tarifa de água costuma ser cobrada por faixas de consumo, e as faixas superiores custam mais por metro cúbico. Isso significa que economizar na margem vale mais que a média sugere: os últimos metros cúbicos são os mais caros.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Há também uma cobrança mínima que existe mesmo com consumo baixo, e o esgoto, que costuma ser calculado como percentual da água consumida — de modo que cada metro cúbico economizado reduz duas linhas da fatura.',
        },
        {
          tipo: 'chamada',
          slug: 'conta-de-agua',
          texto:
            'A calculadora aplica as faixas informadas e mostra o efeito de reduzir o consumo.',
        },
      ],
    },

    {
      id: 'o-gas',
      titulo: 'Gás: comparar botijão com encanado exige a mesma unidade',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O botijão é vendido por unidade e o gás encanado é cobrado por metro cúbico. Comparar os dois exige converter para a mesma base — e é aí que a comparação costuma parar antes de começar.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Feita a conversão, a comparação fica direta: quanto custa a mesma quantidade de energia em cada modalidade. Vale incluir a taxa fixa do encanado, que existe mesmo em mês de pouco uso.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-do-botijao-de-gas',
          texto:
            'A calculadora estima a duração do botijão pelo uso e o custo mensal equivalente.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma observação prática: a duração de um botijão varia enormemente com o número de pessoas e o hábito de cozinhar. Estimar pelo histórico da própria casa — quanto tempo durou o último — é mais confiável que qualquer média.',
        },
      ],
    },
  ],
}
