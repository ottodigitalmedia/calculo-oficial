/**
 * Guia — "Viver de renda: quanto é preciso acumular".
 *
 * Fecha o bloco de investimentos (§11.3). Cobre a meta de independência, a
 * renda mensal e o dividend yield — três recortes da mesma pergunta.
 *
 * Sem valor legal envolvido. NENHUM VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const VIVER_DE_RENDA: Guia = {
  slug: 'viver-de-renda',
  titulo: 'Viver de renda: quanto é preciso acumular',
  subtitulo:
    'A conta é mais simples do que parece — e o número que ela devolve costuma ser maior do que se espera.',
  descricaoSeo:
    'Como calcular o patrimônio necessário para viver de renda, por que a taxa de retirada importa mais que o rendimento, e o que a inflação faz com a meta ao longo do tempo.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['independencia-financeira', 'quanto-rende-por-mes', 'dividend-yield'],

  secoes: [
    {
      id: 'a-conta-basica',
      titulo: 'A conta é uma divisão',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Viver de renda significa cobrir as despesas com o que o patrimônio produz, sem consumir o patrimônio. A conta que responde quanto é preciso acumular é uma divisão: a despesa mensal desejada dividida pela taxa de retirada segura.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O que assusta é a escala. Uma taxa de retirada modesta implica um patrimônio muitas vezes maior que a renda anual pretendida — e é essa multiplicação que faz o número parecer inalcançável na primeira vez que se calcula.',
        },
        {
          tipo: 'destaque',
          texto:
            'Reduzir a despesa mensal alvo tem efeito duplo: diminui a meta e acelera o acúmulo, porque sobra mais para investir.',
        },
        {
          tipo: 'chamada',
          slug: 'independencia-financeira',
          texto:
            'A calculadora mostra a meta de patrimônio e o tempo até alcançá-la com os aportes informados.',
        },
      ],
    },

    {
      id: 'a-taxa-de-retirada',
      titulo: 'A taxa de retirada não é o rendimento',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O erro mais comum é usar o rendimento nominal como taxa de retirada. Se a aplicação rende e os preços sobem, retirar tudo o que ela rendeu significa manter o saldo e perder poder de compra ano após ano.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A taxa que sustenta a renda no longo prazo é a real — o que sobra depois da inflação e depois do imposto. Ela é sempre menor que a nominal, e é a diferença entre uma renda que dura e uma que encolhe.',
        },
        {
          tipo: 'lista',
          itens: [
            'Retirar o rendimento nominal inteiro mantém o saldo e reduz o que ele compra.',
            'Retirar apenas o ganho real mantém o poder de compra da renda.',
            'Retirar mais que o ganho real consome o patrimônio — o que pode ser uma escolha legítima, desde que consciente.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'quanto-rende-por-mes',
          texto:
            'A calculadora converte um patrimônio em renda mensal e mostra o efeito da taxa escolhida.',
        },
      ],
    },

    {
      id: 'renda-de-dividendos',
      titulo: 'Renda de dividendos: o que o percentual anunciado esconde',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Muita gente monta a renda com ativos que distribuem proventos, e usa o percentual distribuído no último ano como se fosse a renda futura. Duas coisas desmentem essa leitura.',
        },
        {
          tipo: 'lista',
          itens: [
            'O percentual é calculado sobre o preço do ativo: quando o preço cai, ele sobe sem que nada tenha melhorado.',
            'A distribuição depende do resultado, e resultado passado não obriga distribuição futura.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Um percentual alto costuma ser sinal de preço em queda, e não de negócio generoso. Vale olhar a consistência da distribuição ao longo dos anos antes de projetar renda a partir dela.',
        },
        {
          tipo: 'chamada',
          slug: 'dividend-yield',
          texto:
            'A calculadora relaciona proventos, preço e renda mensal a partir dos números que você informar.',
        },
      ],
    },

    {
      id: 'o-que-a-conta-nao-cobre',
      titulo: 'O que a conta não cobre',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A projeção supõe uma taxa constante por décadas, e nenhuma aplicação se comporta assim. Ela descreve uma trajetória média, não uma promessa — e a sequência dos retornos importa tanto quanto a média deles.',
        },
        {
          tipo: 'lista',
          itens: [
            'Anos ruins logo no começo das retiradas machucam muito mais que anos ruins no fim.',
            'Despesas grandes e imprevistas — saúde, família, reparos — não entram na média mensal.',
            'O imposto muda conforme a aplicação e o prazo, e reduz a taxa efetiva de retirada.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Por isso a meta calculada é um ponto de partida para o planejamento, não uma linha de chegada exata. O valor de fazê-la está menos no número final e mais em descobrir cedo o tamanho do esforço necessário.',
        },
      ],
    },
  ],
}
