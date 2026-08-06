/**
 * Guia — "Férias: integrais, proporcionais e abono"
 * (`03-functional-spec` §4). Ligado a CALC-004.
 *
 * O ponto que o guia precisa acertar é a **incidência**: férias gozadas e o
 * respectivo adicional integram o salário-de-contribuição e a base do imposto;
 * o abono pecuniário e o seu adicional não integram nem uma nem outra. É a
 * diferença que faz o líquido das férias surpreender, e está transcrita no
 * cabeçalho de `engine/calculadoras/ferias-e-decimo-terceiro.ts`.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const FERIAS: Guia = {
  slug: 'ferias-integrais-proporcionais-e-abono',
  titulo: 'Férias: integrais, proporcionais e abono',
  subtitulo:
    'O valor das férias não é o salário do mês — e a parte vendida segue regra de desconto oposta à parte descansada.',
  descricaoSeo:
    'Como se forma o valor das férias: período aquisitivo, adicional constitucional, férias proporcionais, venda de parte do período e por que o abono não sofre os mesmos descontos.',
  atualizadoEm: '2026-08-06',
  calculadoras: ['ferias', 'salario-liquido', 'decimo-terceiro'],

  secoes: [
    {
      id: 'os-dois-periodos',
      titulo: 'Os dois períodos que quase todo mundo mistura',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Férias envolvem dois prazos distintos, e confundi-los é a origem da maior parte das dúvidas sobre quando elas podem ser tiradas e o que acontece se não forem.',
        },
        {
          tipo: 'lista',
          itens: [
            'O período aquisitivo é o tempo de trabalho que forma o direito. Ele começa na admissão e se repete a cada ano de contrato.',
            'O período concessivo é o prazo que a empresa tem, depois disso, para conceder o descanso.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Um período aquisitivo completo e não gozado é o que a rescisão chama de férias vencidas. É por isso que aquele campo existe na calculadora de rescisão: ele muda bastante o acerto, e muita gente não sabe que tem um período nessa condição.',
        },
      ],
    },

    {
      id: 'como-o-valor-se-forma',
      titulo: 'Como o valor se forma',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A remuneração das férias parte do salário e é proporcional aos dias de descanso. Sobre ela incide o adicional constitucional de férias, que é acrescentado ao valor e não substitui nada.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quando o período aquisitivo não está completo, a conta é feita por avos: cada mês trabalhado do período em curso acrescenta uma fração ao valor devido. É o cálculo de férias proporcionais, o mesmo que aparece na rescisão.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Adicionais habituais integram a base. Horas extras prestadas com habitualidade, comissões e adicionais de turno compõem a remuneração das férias por média, e não pelo salário-base isolado.',
        },
        {
          tipo: 'chamada',
          slug: 'ferias',
          texto:
            'A calculadora mostra a remuneração, o adicional e os descontos em etapas separadas, com a norma de cada uma.',
        },
      ],
    },

    {
      id: 'a-venda-de-parte-do-periodo',
      titulo: 'A venda de parte do período, e a armadilha do líquido',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A lei permite converter parte do período de descanso em dinheiro. Essa parte convertida é o abono pecuniário, e ela tem uma característica que engana quem compara valores brutos:',
        },
        {
          tipo: 'destaque',
          texto:
            'O abono e o adicional que o acompanha não integram a remuneração para efeito de previdência, e ficam fora da base do imposto. A parte descansada, sim.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O efeito é que a parte vendida chega quase inteira ao trabalhador, enquanto a parte descansada sofre os dois descontos. Comparar apenas os brutos, nesse caso, leva à conclusão errada sobre qual opção rende mais.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Há ainda a possibilidade de receber o adiantamento da gratificação natalina junto com as férias. Ele entra no mesmo pagamento, mas segue a regra do décimo terceiro: é adiantamento, e os descontos dele só acontecem na parcela final, no fim do ano.',
        },
      ],
    },

    {
      id: 'os-descontos',
      titulo: 'Os descontos sobre a parte tributável',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Sobre a parte que integra a remuneração incidem a contribuição previdenciária e o imposto de renda, pelas mesmas tabelas progressivas da folha mensal.',
        },
        {
          tipo: 'tabelaDeFaixas',
          parametroId: 'inss-tabela-progressiva',
          legenda: 'Faixas e alíquotas da contribuição previdenciária aplicadas à parcela tributável.',
        },
        {
          tipo: 'tabelaDeFaixas',
          parametroId: 'irrf-tabela-progressiva',
          legenda: 'Tabela progressiva mensal do imposto de renda retido na fonte.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Como o valor das férias costuma superar o salário do mês — por causa do adicional —, ele pode cair numa faixa mais alta que a do holerite comum. É a explicação mais frequente para o desconto parecer desproporcional.',
        },
      ],
    },

    {
      id: 'ferias-indenizadas',
      titulo: 'Férias indenizadas seguem a regra oposta',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quando as férias não são gozadas e o contrato termina, elas são pagas na rescisão. Nessa situação a natureza muda: o pagamento passa a reparar um descanso que não aconteceu, em vez de remunerar o período de descanso.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A consequência é o inverso do que acontece nas férias gozadas — a verba fica fora das bases de desconto. É a razão de férias pagas na rescisão chegarem proporcionalmente maiores que férias tiradas durante o contrato.',
        },
        {
          tipo: 'chamada',
          slug: 'salario-liquido',
          texto:
            'Para comparar o mês de férias com um mês comum de salário, a calculadora de salário líquido serve de referência.',
        },
      ],
    },
  ],
}
