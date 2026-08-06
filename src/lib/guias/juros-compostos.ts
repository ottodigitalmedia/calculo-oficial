/**
 * Guia — "Juros compostos: por que o tempo importa mais que a taxa"
 * (`03-functional-spec` §4). Ligado a CALC-022.
 *
 * É o único dos guias do v1 sem parâmetro legal envolvido: aqui não há norma,
 * há aritmética. Por isso ele não tem bloco que leia `lib/params/` — e a
 * ausência é deliberada, não esquecimento.
 *
 * O erro que o guia precisa atacar é o da **unidade da taxa**: dividir a taxa
 * anual por doze para achar a mensal subestima o resultado, e é o engano mais
 * frequente de quem simula em planilha.
 *
 * NENHUM VALOR NA PROSA — aqui a regra é mais fácil de cumprir, porque nenhum
 * número deste tema é fixo (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const JUROS_COMPOSTOS: Guia = {
  slug: 'juros-compostos-e-o-tempo',
  titulo: 'Juros compostos: por que o tempo importa mais que a taxa',
  subtitulo:
    'Dobrar a taxa dobra o rendimento; dobrar o prazo faz muito mais que dobrar — e é essa assimetria que quase ninguém sente na intuição.',
  descricaoSeo:
    'A diferença entre juros simples e compostos, por que o prazo pesa mais que a taxa, como os aportes mensais mudam a conta e o erro de unidade que subestima qualquer simulação.',
  atualizadoEm: '2026-08-06',
  calculadoras: ['juros-compostos', 'valor-futuro-corrigido', 'reserva-de-emergencia'],

  secoes: [
    {
      id: 'juros-sobre-juros',
      titulo: 'A diferença está em o que rende',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'No regime simples, o rendimento de cada período é calculado sempre sobre o valor inicial. No regime composto, o rendimento de um período passa a fazer parte do valor que rende no período seguinte.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Nos primeiros períodos os dois caminhos andam quase juntos, e é isso que engana. A distância entre eles cresce devagar no começo e depois acelera, porque a base sobre a qual o rendimento incide não para de aumentar.',
        },
        {
          tipo: 'destaque',
          texto:
            'Toda a diferença vem de uma escolha só: se o rendimento fica de fora ou entra na conta do próximo período.',
        },
      ],
    },

    {
      id: 'o-tempo-contra-a-taxa',
      titulo: 'Por que o tempo pesa mais que a taxa',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A taxa entra na conta multiplicando; o prazo entra como número de vezes que essa multiplicação se repete. São papéis matematicamente diferentes, e é daí que vem a assimetria.',
        },
        {
          tipo: 'lista',
          itens: [
            'Aumentar a taxa melhora cada período isoladamente, de forma proporcional.',
            'Aumentar o prazo acrescenta períodos inteiros, e cada um deles parte de uma base maior que a do anterior.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Na prática isso significa que começar cedo com pouco costuma vencer começar tarde com mais — e que a busca por uma taxa um pouco melhor raramente compensa adiar o início. Simular os dois cenários lado a lado mostra a diferença melhor que qualquer explicação.',
        },
        {
          tipo: 'chamada',
          slug: 'juros-compostos',
          texto:
            'Simule o mesmo valor com prazos diferentes e depois com taxas diferentes: a comparação torna a assimetria visível em poucos segundos.',
        },
      ],
    },

    {
      id: 'os-aportes',
      titulo: 'O aporte mensal muda a natureza da conta',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Com aportes periódicos, cada depósito entra num momento diferente e rende por um prazo diferente. O primeiro aporte trabalha o tempo todo; o último, quase nada.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Por isso o total acumulado não é o aporte multiplicado pelo número de meses mais um rendimento único. Cada parcela tem a sua própria trajetória, e o resultado é a soma delas.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma consequência útil: em prazos longos, a parte do montante que veio de rendimento costuma superar a que veio de aporte. O ponto em que isso acontece é uma das informações mais reveladoras de uma simulação.',
        },
      ],
    },

    {
      id: 'a-unidade-da-taxa',
      titulo: 'O erro de unidade que subestima tudo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A taxa e o prazo precisam estar na mesma unidade. Taxa mensal com prazo em meses; taxa anual com prazo em anos. Misturar as duas é o erro mais comum das planilhas caseiras.',
        },
        {
          tipo: 'destaque',
          texto:
            'Dividir a taxa anual pelo número de meses do ano não produz a taxa mensal equivalente. Produz um número menor, e a simulação inteira sai abaixo do correto.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A conversão correta é a que respeita o próprio regime composto: a taxa mensal equivalente é aquela que, aplicada doze vezes seguidas, reproduz a taxa anual. A divisão simples ignora justamente o efeito que o regime existe para representar.',
        },
      ],
    },

    {
      id: 'o-que-a-simulacao-nao-sabe',
      titulo: 'O que a simulação não sabe',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Uma projeção de juros compostos é uma conta sobre uma hipótese: a de que a taxa informada se repete, igual, em todos os períodos. Nenhuma aplicação real se comporta assim, e a projeção é tanto mais frágil quanto mais longo for o prazo.',
        },
        {
          tipo: 'lista',
          itens: [
            'Imposto sobre o rendimento, que varia conforme o produto e o prazo.',
            'Taxas de administração e de custódia, que incidem sobre o montante e reduzem a taxa efetiva.',
            'Inflação, que corrói o poder de compra do valor final sem alterar o número exibido.',
            'Variação da própria taxa ao longo do tempo, quando a aplicação não é prefixada.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'O valor projetado descreve o crescimento nominal. Para saber quanto ele representa em poder de compra no futuro, é preciso corrigir por um índice de preços — que é outra conta, e ela existe separada aqui.',
        },
        {
          tipo: 'chamada',
          slug: 'valor-futuro-corrigido',
          texto:
            'A calculadora de valor futuro corrigido projeta o montante e mostra também o resultado em poder de compra.',
        },
      ],
    },
  ],
}
