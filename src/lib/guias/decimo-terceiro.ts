/**
 * Guia — "13º salário: as duas parcelas e os descontos"
 * (`03-functional-spec` §4). Ligado a CALC-005.
 *
 * O guia responde à pergunta que mais chega sobre o tema: por que a segunda
 * parcela é tão menor que a primeira. A resposta é que a primeira é
 * adiantamento sem desconto e a segunda concentra os dois descontos, apurados
 * sobre o valor total — `RPS` art. 216, § 1º.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const DECIMO_TERCEIRO: Guia = {
  slug: 'decimo-terceiro-em-duas-parcelas',
  titulo: '13º salário: as duas parcelas e os descontos',
  subtitulo:
    'A segunda parcela vir bem menor que a primeira não é erro da folha — é onde os dois descontos do ano inteiro são cobrados de uma vez.',
  descricaoSeo:
    'Como o décimo terceiro é calculado por avos, por que a primeira parcela não tem desconto, por que a segunda concentra INSS e Imposto de Renda, e por que ela pode chegar a zero.',
  atualizadoEm: '2026-08-06',
  calculadoras: ['decimo-terceiro', 'ferias', 'salario-liquido'],

  secoes: [
    {
      id: 'a-conta-por-avos',
      titulo: 'A conta é por avos, não por ano fechado',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A gratificação natalina é proporcional aos meses trabalhados no ano. Quem passou o ano inteiro na empresa recebe o valor cheio; quem entrou no meio recebe a fração correspondente aos meses de contrato.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Um mês incompleto só entra na conta se a parte trabalhada nele alcançar a fração mínima que a lei exige. Abaixo disso, o mês não conta — e é comum a estimativa feita em casa divergir da folha exatamente por um avo, por causa dessa regra.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Adicionais habituais integram a base. A jurisprudência trabalhista firmou que o serviço suplementar prestado com habitualidade compõe o cálculo da gratificação, o que também vale para comissões e adicionais pagos com regularidade.',
        },
      ],
    },

    {
      id: 'as-duas-parcelas',
      titulo: 'Por que a segunda parcela é tão menor',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O pagamento costuma ser dividido em duas parcelas, e elas têm naturezas diferentes — o que explica a diferença de tamanho entre uma e outra.',
        },
        {
          tipo: 'lista',
          itens: [
            'A primeira parcela é adiantamento puro: sai sem contribuição previdenciária e sem imposto de renda.',
            'A segunda parcela é o encontro de contas. Os dois descontos são calculados sobre o valor TOTAL do décimo terceiro e cobrados inteiros aqui.',
          ],
        },
        {
          tipo: 'destaque',
          texto:
            'Com poucos avos, ou com salário em faixa mais alta, a segunda parcela pode chegar a zero. Isso não é erro de cálculo — é o desconto do total consumindo o que restava a pagar.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Outro detalhe: o adiantamento é calculado sobre o salário do mês anterior, e não sobre o décimo terceiro proporcional já apurado. Quando os avos são poucos, esse adiantamento poderia superar o próprio valor devido, e nesse caso ele é limitado ao devido.',
        },
        {
          tipo: 'chamada',
          slug: 'decimo-terceiro',
          texto:
            'A calculadora mostra as duas parcelas separadamente, com o desconto de cada uma e o limite aplicado quando ele existe.',
        },
      ],
    },

    {
      id: 'o-desconto-em-separado',
      titulo: 'O desconto é em separado — e isso é a favor de quem recebe',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A contribuição previdenciária sobre o décimo terceiro é apurada em separado da do salário do mês, com aplicação própria da tabela progressiva. O imposto de renda também é tributado de forma exclusiva, e não se soma ao salário na declaração de ajuste.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Somar as duas bases — décimo terceiro e salário do mês — antes de aplicar a tabela é um dos erros mais frequentes do mercado, e ele sempre produz desconto maior que o devido, porque empurra a base para faixas mais altas.',
        },
        {
          tipo: 'tabelaDeFaixas',
          parametroId: 'inss-tabela-progressiva',
          legenda: 'Tabela progressiva aplicada de forma autônoma sobre a gratificação natalina.',
        },
        {
          tipo: 'tabelaDeFaixas',
          parametroId: 'irrf-tabela-progressiva',
          legenda: 'Tabela do imposto de renda aplicada sobre o valor total do décimo terceiro.',
        },
      ],
    },

    {
      id: 'o-fgts-e-o-decimo-terceiro',
      titulo: 'O décimo terceiro também gera depósito de FGTS',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A gratificação entra na base do depósito da conta vinculada, como qualquer remuneração. O valor não sai do bolso de quem recebe — é obrigação do empregador —, mas ele engorda o saldo, e por consequência a base da indenização em caso de dispensa.',
        },
        {
          tipo: 'chamada',
          slug: 'fgts',
          texto:
            'Na calculadora de FGTS há um campo para incluir ou não a gratificação na estimativa do saldo.',
        },
      ],
    },

    {
      id: 'quando-nao-bate',
      titulo: 'Quando a estimativa não bate com o holerite',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'A contagem de avos difere por um mês, por causa da regra da fração mínima.',
            'A base da empresa inclui médias de horas extras, comissões ou adicionais que a simulação não conhece.',
            'Houve afastamento no ano, e certos períodos não contam como tempo de serviço para este fim.',
            'A empresa antecipou a primeira parcela junto com as férias, e ela não apareceu no mês esperado.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Comparar o valor total do décimo terceiro, e não o de cada parcela isoladamente, costuma esclarecer a diferença mais rápido — as parcelas podem ter sido divididas de outra forma sem que o total esteja errado.',
        },
      ],
    },
  ],
}
