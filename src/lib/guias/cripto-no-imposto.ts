/**
 * Guia — "Cripto no Imposto de Renda: o que muda a partir de quanto".
 *
 * Bloco de autônomo e PJ (§11.3), o item que sobrou dele.
 *
 * O teto da isenção é valor legal e entra por bloco que lê `lib/params/` (G-2).
 * NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const CRIPTO_NO_IMPOSTO: Guia = {
  slug: 'cripto-no-imposto-de-renda',
  titulo: 'Cripto no Imposto de Renda: o que muda a partir de quanto',
  subtitulo:
    'O limite que isenta olha quanto você vendeu, não quanto você lucrou — e essa distinção decide quase todos os casos.',
  descricaoSeo:
    'Como funciona o imposto sobre venda de criptoativos: o teto mensal de isenção, por que ele é degrau e não desconto, e por que trocar uma moeda por outra já é fato gerador.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['imposto-sobre-criptoativos', 'ganho-de-capital-imovel'],

  secoes: [
    {
      id: 'o-teto',
      titulo: 'O teto olha o total vendido',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A isenção que alcança criptoativos é a das alienações de pequeno valor, e ela tem uma característica que inverte a intuição de quase todo mundo: o que se compara com o teto é o total vendido no mês, e não o lucro obtido.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ganho-capital-isencao-pequeno-valor',
          legenda: 'Total alienado no mês até o qual o ganho fica isento.',
        },
        {
          tipo: 'destaque',
          texto:
            'Vender muito com lucro pequeno não é isento. Vender pouco com lucro grande é.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O conjunto soma todos os tipos de criptoativo — não há um teto por moeda —, e soma o que foi vendido no país com o que foi vendido no exterior. Duas vendas modestas em corretoras diferentes podem, juntas, passar do limite.',
        },
        {
          tipo: 'chamada',
          slug: 'imposto-sobre-criptoativos',
          texto:
            'A calculadora soma as vendas do mês, aplica o teto e mostra a folga que ainda resta.',
        },
      ],
    },

    {
      id: 'degrau',
      titulo: 'É degrau, não desconto',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Ultrapassado o teto, não se tributa apenas a parte excedente: o ganho de todas as alienações do mês passa a ser tributado. Um real acima do limite muda a natureza do mês inteiro.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A consequência prática é de planejamento: quando a venda pode ser dividida entre dois meses sem prejuízo, dividir costuma valer mais que qualquer otimização posterior. Quando não pode, o imposto é devido e ponto.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Havendo tributação, as alíquotas são as mesmas do ganho de capital em geral, progressivas por faixa. Cada alíquota alcança só a parcela do ganho contida na sua faixa — aplicar a da faixa alcançada sobre tudo cobra a mais.',
        },
        {
          tipo: 'chamada',
          slug: 'ganho-de-capital-imovel',
          texto:
            'A mesma tabela vale para imóveis, e a calculadora de ganho de capital a aplica com os fatores de redução próprios daquele caso.',
        },
      ],
    },

    {
      id: 'a-permuta',
      titulo: 'Trocar uma moeda por outra já é alienação',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'É o ponto que mais deixa imposto de fora das contas caseiras: converter uma criptomoeda em outra, sem passar por real, é alienação para fins tributários. O valor de mercado em reais na data da troca entra como valor de venda.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quem opera trocando ativos entre si pode acumular alienações relevantes num mês sem nunca ter sacado dinheiro — e descobrir o teto ultrapassado depois, quando a correção custa mais.',
        },
        {
          tipo: 'lista',
          itens: [
            'Guarde o registro de cada operação, com data, quantidade e valor em reais.',
            'O recolhimento é mensal, e vence no mês seguinte ao da operação.',
            'A obrigação de informar operações à Receita é distinta da de pagar imposto: existe mesmo quando há isenção.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma nota sobre quem mantém ativos em corretora no exterior: desde 2024 esse caso segue regime próprio, com regra diferente — e nele não há a isenção descrita aqui. As vendas lá entram no teste do teto, mas o imposto delas se apura de outra forma.',
        },
      ],
    },
  ],
}
