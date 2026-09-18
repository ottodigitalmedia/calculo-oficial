/**
 * Guia — "Benefícios do INSS: quanto cada um paga".
 *
 * Lote 5 da expansão do catálogo, ligado a CALC-100, CALC-101 e CALC-102. Guia
 * novo porque a pergunta é nova: os guias existentes tratam do que se DESCONTA
 * do salário; aqui a pergunta é o inverso — quanto se RECEBE quando o salário
 * para de vir.
 *
 * Os três benefícios dividem a mesma estrutura — uma base que quase nunca é o
 * último salário, um piso constitucional e o teto do regime —, e é essa
 * estrutura que o texto explica uma vez só.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const BENEFICIOS_DO_INSS: Guia = {
  slug: 'beneficios-do-inss',
  titulo: 'Benefícios do INSS: quanto cada um paga',
  tituloSeo: 'Benefícios do INSS: quanto cada um paga',
  subtitulo:
    'Pensão por morte, auxílio por incapacidade e salário-maternidade partem de bases diferentes — e quase nenhuma delas é o seu último salário.',
  descricaoSeo:
    'Como o INSS calcula a pensão por morte, o auxílio por incapacidade temporária e o salário-maternidade, com o piso do salário mínimo e o teto do regime.',
  atualizadoEm: '2026-09-18',
  calculadoras: ['pensao-por-morte', 'auxilio-por-incapacidade', 'salario-maternidade-do-inss', 'auxilio-acidente'],

  secoes: [
    {
      id: 'a-base-nao-e-o-ultimo-salario',
      titulo: 'A base quase nunca é o último salário',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O erro mais comum ao estimar um benefício é partir do salário atual. A Previdência trabalha com o salário de benefício, que é a média dos salários de contribuição atualizados desde julho de 1994 — e essa média costuma ser menor que o salário de hoje, porque inclui anos de contribuição baixa no começo da carreira.',
        },
        {
          tipo: 'destaque',
          texto:
            'Onde encontrar o número: no extrato do CNIS, no Meu INSS. É a lista de todas as contribuições reconhecidas — e conferi-la antes de pedir o benefício é o que evita surpresa na carta de concessão.',
        },
      ],
    },

    {
      id: 'piso-e-teto',
      titulo: 'O piso e o teto valem para todos',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Dois limites cercam qualquer benefício que substitua o salário. O piso é constitucional: nenhum deles pode ficar abaixo do salário mínimo. O teto é o limite máximo do salário de contribuição, publicado a cada ano na mesma portaria que reajusta a tabela do INSS.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'salario-minimo',
          legenda: 'Piso de qualquer benefício substitutivo do salário.',
        },
        {
          tipo: 'tabelaDeFaixas',
          parametroId: 'inss-tabela-progressiva',
          legenda: 'Tabela de contribuição do ano — o limite superior da última faixa é o teto do regime.',
        },
      ],
    },

    {
      id: 'pensao-por-morte',
      titulo: 'Pensão por morte: uma cota da família mais uma por dependente',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Desde a reforma de 2019, a pensão deixou de ser o valor integral da aposentadoria. Ela parte de uma cota familiar e soma uma cota por dependente, até o limite do valor inteiro. Havendo dependente inválido ou com deficiência, o benefício já nasce integral.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'pensao-cota-familiar',
          legenda: 'Cota familiar — a base da pensão.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'pensao-cota-por-dependente',
          legenda: 'Acréscimo por dependente habilitado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O detalhe que muda a vida da família vem depois: as cotas cessam quando cada dependente perde essa qualidade — o filho que atinge a idade-limite, por exemplo — e não são redistribuídas aos demais. A pensão encolhe com o tempo, e o planejamento precisa contar com isso.',
        },
        {
          tipo: 'chamada',
          slug: 'pensao-por-morte',
          texto: 'A calculadora de pensão por morte mostra o percentual aplicado e o valor do benefício.',
        },
      ],
    },

    {
      id: 'auxilio-por-incapacidade',
      titulo: 'Auxílio por incapacidade: o limite que surpreende',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O antigo auxílio-doença paga uma fração do salário de benefício. Até aí, nenhuma surpresa. A surpresa está num limite adicional: o benefício não pode superar a média dos últimos doze salários de contribuição.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'auxilio-incapacidade-percentual',
          legenda: 'Percentual do salário de benefício que forma a renda mensal.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quem ganhou mais no passado e menos nos últimos meses é limitado por essa regra, e recebe menos do que a média histórica sugeriria. No caso do empregado, os primeiros quinze dias de afastamento são pagos pela empresa; o benefício começa depois disso.',
        },
        {
          tipo: 'chamada',
          slug: 'auxilio-por-incapacidade',
          texto:
            'A calculadora de auxílio por incapacidade aplica o percentual, o limite dos últimos doze, o teto e o piso — nessa ordem.',
        },
      ],
    },

    {
      id: 'auxilio-acidente',
      titulo: 'Auxílio-acidente: o benefício que se soma ao salário',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem volta ao trabalho com uma sequela de acidente que reduz a capacidade para a atividade habitual recebe o auxílio-acidente. Ele não substitui o salário: é indenização, pago junto com ele, e por isso não tem o piso do salário mínimo.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'auxilio-acidente-percentual',
          legenda: 'Percentual do salário de benefício que forma o auxílio-acidente.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Ele começa no dia seguinte ao fim do auxílio por incapacidade temporária e dura até a véspera de qualquer aposentadoria — as duas coisas não se acumulam.',
        },
        {
          tipo: 'chamada',
          slug: 'auxilio-acidente',
          texto: 'A calculadora de auxílio-acidente aplica o percentual e o teto sobre o salário de benefício.',
        },
      ],
    },

    {
      id: 'salario-maternidade',
      titulo: 'Salário-maternidade: depende de como você contribui',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem tem carteira assinada recebe a remuneração integral, paga pela empresa e compensada junto à Previdência. Para as demais seguradas, a lei dá uma base diferente conforme a situação: o último salário de contribuição para a empregada doméstica, o piso para a segurada especial, e a média dos doze últimos salários de contribuição para contribuintes individuais, MEI, facultativas e desempregadas que mantêm a qualidade de segurada.',
        },
        {
          tipo: 'lista',
          itens: [
            'O benefício dura cento e vinte dias, como a licença da empregada.',
            'A adoção também dá direito, com a mesma duração.',
            'Há carência de dez contribuições para a contribuinte individual, a facultativa e a MEI.',
            'O valor entra na declaração anual como rendimento tributável.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'salario-maternidade-do-inss',
          texto:
            'A calculadora de salário-maternidade do INSS aplica a regra da sua categoria e mostra o total dos quatro meses.',
        },
      ],
    },
  ],
}
