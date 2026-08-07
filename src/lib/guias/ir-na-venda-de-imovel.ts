/**
 * Guia — "IR na venda de imóvel: as isenções e os fatores que quase ninguém aplica".
 *
 * Bloco de imóveis (§11.3). Este é o de maior valor por leitor do bloco: os
 * fatores de redução do art. 40 da Lei nº 11.196/2005 derrubam a base pela
 * metade num imóvel antigo, e quase nenhuma calculadora do mercado os aplica —
 * é o que `ESTADO-DO-PROJETO` §9 registrou ao construir CALC-020.
 *
 * Todos os valores legais entram por bloco que lê `lib/params/` (G-2). NENHUM
 * VALOR LEGAL NA PROSA (G-1).
 */

import type { Guia } from './tipos'

export const IR_NA_VENDA_DE_IMOVEL: Guia = {
  slug: 'ir-na-venda-de-imovel',
  titulo: 'IR na venda de imóvel: as isenções e os fatores que quase ninguém aplica',
  subtitulo:
    'Antes de calcular o imposto, vale verificar se ele é devido — e, se for, se a base não pode encolher pela metade.',
  descricaoSeo:
    'Como funciona o imposto sobre o ganho de capital na venda de imóvel: as isenções, os fatores de redução por tempo de posse e o reinvestimento que zera o imposto.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['ganho-de-capital-imovel', 'custo-de-aquisicao-de-imovel', 'rentabilidade-de-aluguel'],

  secoes: [
    {
      id: 'o-que-e-o-ganho',
      titulo: 'O imposto não incide sobre a venda, e sim sobre o ganho',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Vender um imóvel por um valor alto não gera imposto por si só. O que é tributado é a diferença entre o que se recebeu na venda e o custo de aquisição — o ganho de capital. Quem vende pelo mesmo valor que pagou não tem imposto a recolher.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O custo de aquisição costuma ser maior do que as pessoas lembram. Ele inclui o valor pago, mas também a corretagem da compra, o imposto de transmissão, o registro e as benfeitorias comprovadas com nota. Cada real acrescentado ali reduz o ganho na mesma medida.',
        },
        {
          tipo: 'destaque',
          texto:
            'Guardar as notas da reforma é uma decisão tributária. Sem elas, a benfeitoria não entra no custo e o ganho fica artificialmente maior.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-de-aquisicao-de-imovel',
          texto:
            'A calculadora de custo de aquisição soma o que entrou no preço além do valor do imóvel.',
        },
      ],
    },

    {
      id: 'as-isencoes',
      titulo: 'Primeiro: verifique se há isenção',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Antes de calcular qualquer coisa, vale checar três hipóteses em que o imposto simplesmente não é devido. A primeira alcança vendas de valor modesto.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ganho-capital-isencao-pequeno-valor',
          legenda:
            'Alienações no mês até este total ficam isentas — observado o conjunto de bens da mesma natureza vendidos no período.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A segunda alcança quem vende o único imóvel que possui, desde que não tenha feito outra alienação nos anos anteriores que a norma indica.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ganho-capital-isencao-imovel-unico',
          legenda: 'Valor de alienação até o qual a venda do único imóvel é isenta.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A terceira é a mais usada e a mais mal compreendida: aplicar o produto da venda na compra de outro imóvel residencial no país, dentro do prazo legal, afasta o imposto. Ela tem condições próprias — e uma delas limita a quantas vezes o benefício pode ser usado.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ganho-capital-prazo-reinvestimento',
          legenda: 'Prazo em dias, contados da celebração do contrato, para aplicar o produto da venda.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Aplicar apenas parte do produto da venda não anula o benefício: a parcela não aplicada é tributada proporcionalmente. É um detalhe que muda o resultado de quem compra um imóvel mais barato que o vendido.',
        },
      ],
    },

    {
      id: 'os-fatores-de-reducao',
      titulo: 'Os fatores de redução, que quase nenhuma calculadora aplica',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Havendo imposto a pagar, entra em cena o mecanismo que mais muda o resultado em imóveis antigos: a lei reduz a base tributável em função do tempo decorrido, por meio de dois fatores que se acumulam mês a mês.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ganho-capital-fr1-coeficiente',
          legenda: 'Taxa mensal composta do primeiro fator de redução.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'ganho-capital-fr2-coeficiente',
          legenda: 'Taxa mensal composta do segundo fator, contado a partir de marco próprio.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Percentuais mensais pequenos, compostos por décadas, produzem reduções grandes. Num imóvel comprado nos anos 1990, eles chegam a derrubar a base pela metade ou mais — e ignorá-los produz um imposto muito maior que o devido.',
        },
        {
          tipo: 'destaque',
          texto:
            'Errar para mais também é errar. Pagar imposto que não era devido é tão grave quanto deixar de pagar o que era.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Há ainda uma sutileza no primeiro fator: para imóveis adquiridos até certa data, a contagem não começa na compra, e sim num marco fixado pela norma. Quem conta a partir da escritura, nesses casos, subestima a redução.',
        },
        {
          tipo: 'chamada',
          slug: 'ganho-de-capital-imovel',
          texto:
            'A calculadora aplica os dois fatores e mostra, na memória, quanto cada um reduziu da base.',
        },
      ],
    },

    {
      id: 'a-tabela-progressiva',
      titulo: 'A alíquota é progressiva por faixa',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Sobre a base já reduzida incide uma tabela progressiva. Como em toda tabela desse tipo, cada alíquota alcança apenas a parcela do ganho contida na sua faixa — e não o ganho inteiro.',
        },
        {
          tipo: 'tabelaDeFaixas',
          parametroId: 'ganho-capital-tabela',
          legenda: 'Faixas e alíquotas do imposto sobre o ganho de capital da pessoa física.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Aplicar a alíquota da faixa alcançada sobre o ganho todo é o erro mais comum, e ele sempre cobra a mais. O recolhimento vence no mês seguinte ao do recebimento, e a venda parcelada permite recolher na medida em que o dinheiro entra.',
        },
      ],
    },
  ],
}
