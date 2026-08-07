/**
 * Guia — "MEI: o DAS, o limite e o que acontece se você passar".
 *
 * Bloco de autônomo e PJ (§11.3). Os valores fixos do DAS e o limite são valor
 * legal e entram por bloco que lê `lib/params/` (G-2).
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const MEI_DAS_E_LIMITE: Guia = {
  slug: 'mei-das-e-limite',
  titulo: 'MEI: o DAS, o limite e o que acontece se você passar',
  subtitulo:
    'É o regime mais simples que existe — e o que mais gente descobre tarde demais que deixou de caber.',
  descricaoSeo:
    'Como se forma o DAS do MEI, o que ele já inclui, qual é o limite anual de faturamento e o que acontece quando o limite é ultrapassado, com ou sem tolerância.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['das-mei', 'limite-do-mei', 'clt-ou-pj'],

  secoes: [
    {
      id: 'o-que-o-das-cobre',
      titulo: 'Um valor fixo, e o que ele já resolve',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O MEI não paga imposto proporcional ao que fatura. Ele paga um valor fixo por mês, e é isso que torna o regime tão simples: fature muito ou pouco, o boleto é o mesmo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A maior parte desse valor é contribuição previdenciária, calculada como um percentual do salário mínimo — e é ela que garante ao MEI aposentadoria, auxílio-doença e salário-maternidade.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'mei-inss-percentual',
          legenda: 'Percentual do salário mínimo recolhido como contribuição previdenciária do MEI.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Sobre isso somam-se valores fixos conforme a atividade: um para quem vende mercadoria, outro para quem presta serviço. Quem faz as duas coisas recolhe os dois.',
        },
        {
          tipo: 'destaque',
          texto:
            'Como a contribuição acompanha o salário mínimo, o boleto do MEI muda toda virada de ano — sem que nada mude no negócio.',
        },
        {
          tipo: 'chamada',
          slug: 'das-mei',
          texto: 'A calculadora monta o DAS conforme a atividade e mostra cada parcela dele.',
        },
      ],
    },

    {
      id: 'o-limite',
      titulo: 'O limite de faturamento',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O enquadramento como MEI depende de o faturamento do ano ficar dentro de um teto. Ele é anual, mas quem começa no meio do ano tem o teto proporcional aos meses de atividade — detalhe que pega muita gente no primeiro ano.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'mei-limite-receita-anual',
          legenda: 'Receita bruta máxima do ano-calendário para permanecer no MEI.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O que conta é a receita bruta — o total faturado, sem descontar custo, comissão de plataforma ou taxa de maquininha. Quem calcula pelo que sobrou subestima o próprio faturamento e passa do teto sem perceber.',
        },
        {
          tipo: 'chamada',
          slug: 'limite-do-mei',
          texto:
            'A calculadora mostra quanto ainda cabe no ano e o que muda se o teto for ultrapassado.',
        },
      ],
    },

    {
      id: 'passou-do-teto',
      titulo: 'Passou do teto: há dois cenários, e eles são bem diferentes',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Ultrapassar o limite não cancela o MEI automaticamente, e a gravidade depende de quanto se passou. A norma prevê uma faixa de tolerância.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'mei-tolerancia-excesso',
          legenda: 'Excesso sobre o limite até o qual o desenquadramento vale apenas para o ano seguinte.',
        },
        {
          tipo: 'lista',
          itens: [
            'Excesso dentro da tolerância: o desenquadramento vale a partir de janeiro do ano seguinte, e o excedente é tributado como empresa do Simples.',
            'Excesso acima da tolerância: o desenquadramento retroage ao início do ano, e todo o faturamento passa a ser tributado como empresa do Simples — inclusive o que já foi recolhido como MEI.',
          ],
        },
        {
          tipo: 'destaque',
          texto:
            'A diferença entre os dois cenários é grande, e ela depende apenas de quanto se passou do teto. Acompanhar o acumulado do ano é o que evita o segundo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quem percebe que vai passar tem duas saídas legítimas: adiar faturamento para o ano seguinte, quando o contrato permitir, ou preparar a migração para microempresa antes que o excesso ultrapasse a tolerância.',
        },
      ],
    },

    {
      id: 'quando-sair-compensa',
      titulo: 'Sair do MEI nem sempre é ruim',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O desenquadramento costuma ser tratado como problema, e nem sempre é. Como empresa do Simples, o imposto passa a ser proporcional ao faturamento — o que dói em quem fatura pouco e é razoável em quem fatura bem.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O que muda de fato é a complexidade: passa a haver contabilidade, obrigações acessórias e a distinção entre pró-labore e lucro. Essa mudança tem custo mensal, e ele entra na comparação.',
        },
        {
          tipo: 'chamada',
          slug: 'clt-ou-pj',
          texto:
            'A calculadora de CLT, PJ ou MEI compara os três regimes com os seus números, incluindo o custo contábil.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma observação sobre a aposentadoria que quase ninguém faz a tempo: a contribuição do MEI é calculada sobre o salário mínimo, e por isso o benefício futuro tende a ficar nesse patamar. Quem quer benefício maior precisa complementar a contribuição — e há regra própria para isso.',
        },
        {
          tipo: 'chamada',
          slug: 'inss-autonomo-e-facultativo',
          texto:
            'A calculadora de INSS do autônomo mostra as alíquotas e o que a complementação exige.',
        },
      ],
    },
  ],
}
