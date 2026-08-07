/**
 * Guia — "Quanto custa um funcionário para a empresa".
 *
 * Fecha o bloco trabalhista (§11.3). É o único guia escrito do lado do
 * empregador, e o que explica a distância entre o salário combinado e o custo
 * real — a origem da comparação CLT × PJ que CALC-048 resolve.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const CUSTO_DO_FUNCIONARIO: Guia = {
  slug: 'quanto-custa-um-funcionario',
  titulo: 'Quanto custa um funcionário para a empresa',
  subtitulo:
    'O salário combinado é a menor parte da conta — e a diferença não é imprevisível, é calculável.',
  descricaoSeo:
    'O custo real de um empregado com carteira assinada: contribuição patronal, seguro de acidentes, FGTS e as provisões de 13º e férias que se acumulam mês a mês.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['custo-do-funcionario', 'clt-ou-pj', 'salario-liquido'],

  secoes: [
    {
      id: 'tres-camadas',
      titulo: 'O custo tem três camadas',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem contrata olha o salário e imagina que o custo seja aquele valor, talvez com um acréscimo. O acréscimo existe, é grande, e se organiza em três camadas distintas.',
        },
        {
          tipo: 'lista',
          itens: [
            'O que a empresa recolhe SOBRE a folha, e que não passa pelo bolso do empregado.',
            'O que a empresa deposita em nome dele, e que ele só acessa em certas situações.',
            'O que a empresa provisiona hoje para pagar depois — décimo terceiro e férias com o adicional.',
          ],
        },
        {
          tipo: 'destaque',
          texto:
            'Nenhuma das três aparece no holerite como custo. Todas saem do caixa da empresa todo mês.',
        },
      ],
    },

    {
      id: 'o-que-incide-sobre-a-folha',
      titulo: 'O que incide sobre a folha',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A contribuição previdenciária patronal é a maior parcela dessa camada. Ela é diferente da que o empregado paga: incide sobre a remuneração inteira, sem o teto que limita o desconto do trabalhador.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'contribuicao-patronal',
          legenda: 'Contribuição previdenciária a cargo da empresa, sobre a remuneração paga.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Soma-se a ela a contribuição para o seguro contra acidentes do trabalho, cuja alíquota varia conforme o grau de risco da atividade da empresa — não do cargo do empregado.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'rat-risco-leve',
          legenda: 'Alíquota do seguro de acidentes para atividade de risco considerado leve.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'rat-risco-grave',
          legenda: 'Alíquota para atividade de risco considerado grave — mesma folha, custo maior.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Há ainda as contribuições destinadas a terceiros, que variam conforme o enquadramento sindical e patronal da empresa, e por isso não cabem numa conta genérica.',
        },
      ],
    },

    {
      id: 'o-fgts-e-as-provisoes',
      titulo: 'O FGTS e as provisões',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O depósito do fundo de garantia é mensal e calculado sobre a remuneração — e a gratificação natalina entra na base, o que faz o ano ter treze depósitos, não doze.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'fgts-aliquota-deposito',
          legenda: 'Depósito mensal do empregador em conta vinculada do trabalhador.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'As provisões são a camada que mais engana. O décimo terceiro e as férias com o adicional não são despesa de dezembro nem do mês das férias: são obrigações que se formam mês a mês, e uma empresa que não as reserva descobre isso no pior momento.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Some-se que sobre essas verbas também incidem os encargos da camada anterior — e o custo mensal real fica bem acima do salário contratado.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-do-funcionario',
          texto:
            'A calculadora soma as três camadas e mostra o custo mensal e o anual a partir do salário.',
        },
      ],
    },

    {
      id: 'e-a-comparacao-com-pj',
      titulo: 'E a comparação com PJ',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'É desse número que nasce a proposta de contratar como pessoa jurídica: se o custo do empregado é bem maior que o salário, parte da diferença pode virar remuneração do prestador — e os dois lados saem ganhando, na aparência.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A comparação, feita corretamente, precisa colocar dos dois lados o que cada um recebe de fato: no lado da CLT, o líquido mais o fundo de garantia e as provisões; no lado da PJ, o faturamento menos o imposto do regime, o custo contábil e a tributação da retirada.',
        },
        {
          tipo: 'chamada',
          slug: 'clt-ou-pj',
          texto:
            'A calculadora de CLT, PJ ou MEI faz essa comparação com os dois lados completos.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma ressalva que nenhuma conta resolve: quando a relação tem subordinação, pessoalidade e habitualidade, ela é de emprego independentemente do contrato assinado. O risco de reconhecimento do vínculo é do contratante, e ele não aparece em nenhuma planilha.',
        },
      ],
    },
  ],
}
