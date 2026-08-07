/**
 * Guia — "Energia solar vale a pena?".
 *
 * Bloco de casa e consumo (§11.3). O percentual do Fio B é valor legal e entra
 * por bloco que lê `lib/params/` (G-2) — foi o que destravou CALC-066.
 *
 * NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const ENERGIA_SOLAR: Guia = {
  slug: 'energia-solar-vale-a-pena',
  titulo: 'Energia solar vale a pena?',
  subtitulo:
    'A proposta mostra a economia. Ela raramente mostra o que a lei passou a cobrar sobre a energia que você injeta.',
  descricaoSeo:
    'O que considerar antes de instalar energia solar: a cobrança do Fio B que cresce a cada ano, o excedente que vira crédito e não dinheiro, e o mínimo que a fatura continua cobrando.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['retorno-energia-solar', 'consumo-de-energia'],

  secoes: [
    {
      id: 'como-funciona',
      titulo: 'O sistema não guarda energia: ele troca com a rede',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Um sistema residencial comum não tem bateria. O que ele gera durante o dia é consumido na hora e, o que sobra, é injetado na rede da distribuidora — que devolve depois, como abatimento na fatura.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Entender isso explica quase tudo o que vem a seguir: a rede funciona como uma conta corrente de energia, e o que se contrata não é independência, e sim compensação.',
        },
        {
          tipo: 'destaque',
          texto:
            'Sem bateria, faltou energia na rua, faltou na casa — mesmo com sol e painéis no telhado.',
        },
      ],
    },

    {
      id: 'o-fio-b',
      titulo: 'O Fio B, que a proposta raramente mostra',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Compensar energia usa a rede de distribuição, e a lei passou a cobrar por esse uso. A cobrança incide sobre a energia compensada e cresce ano a ano, num cronograma definido em lei.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'fio-b-percentual',
          legenda:
            'Percentual das componentes de distribuição que incide sobre a energia compensada.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O percentual do ano de conexão importa menos do que parece: ele continua subindo nos anos seguintes, e uma simulação feita com o número de hoje descreve o melhor ano do contrato, não a média dele.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quem instalou antes da lei tem situação diferente: há uma regra de transição que preserva por muitos anos quem já tinha o sistema, ou pediu acesso logo depois. É um direito de quem entrou cedo, e ele não se transfere para uma instalação nova.',
        },
        {
          tipo: 'chamada',
          slug: 'retorno-energia-solar',
          texto: 'A calculadora aplica o percentual do período e distingue os dois regimes.',
        },
      ],
    },

    {
      id: 'as-duas-armadilhas',
      titulo: 'Duas armadilhas das propostas comerciais',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A primeira é dimensionar o sistema acima do consumo. O excedente vira crédito, que abate consumo futuro e vence depois de alguns anos — não vira dinheiro, e não é pago.',
        },
        {
          tipo: 'destaque',
          texto:
            'Gerar mais do que se consome aumenta o investimento sem aumentar a economia na mesma proporção.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A segunda é prometer conta zerada. Existe um valor mínimo que a fatura cobra de qualquer imóvel conectado à rede, mais encargos e iluminação pública. A conta cai muito; a zero, não chega.',
        },
        {
          tipo: 'chamada',
          slug: 'consumo-de-energia',
          texto:
            'Antes de dimensionar, vale saber para onde vai o consumo — a calculadora mostra por aparelho.',
        },
      ],
    },

    {
      id: 'o-que-a-conta-nao-projeta',
      titulo: 'O que nenhuma projeção de vinte anos acerta',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'A degradação dos painéis, que reduz a geração ao longo dos anos.',
            'O reajuste da tarifa, que aumenta a economia e é a variável mais incerta.',
            'A troca do inversor, que costuma acontecer uma vez na vida do sistema.',
            'Manutenção, limpeza e seguro.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'As duas primeiras puxam o resultado em direções opostas, e é por isso que estimar apenas uma delas enviesa a conclusão para o lado escolhido. Uma projeção honesta descreve o cenário congelado de hoje e diz que é isso o que ela descreve.',
        },
      ],
    },
  ],
}
