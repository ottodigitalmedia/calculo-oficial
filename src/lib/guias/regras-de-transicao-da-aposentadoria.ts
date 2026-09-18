/**
 * Guia — "Regras de aposentadoria depois da reforma: qual se cumpre primeiro".
 *
 * Lote 6 da expansão do catálogo, ligado a CALC-104 a CALC-108. Guia novo
 * porque a pergunta é nova: o guia da regra de pontos explica UMA regra; este
 * responde qual delas — e a resposta depende de comparar todas.
 *
 * **O texto separa QUANDO de QUANTO.** Cumprir primeiro não é ser a mais
 * vantajosa, e o leitor que confunde as duas coisas pode pedir o benefício
 * pela regra errada.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1) — nem nos nomes dos pedágios,
 * que aqui aparecem descritos em vez de numerados.
 */

import type { Guia } from './tipos'

export const REGRAS_DE_TRANSICAO_DA_APOSENTADORIA: Guia = {
  slug: 'regras-de-transicao-da-aposentadoria',
  titulo: 'Regras de aposentadoria depois da reforma: qual se cumpre primeiro',
  tituloSeo: 'Regras de aposentadoria da reforma: qual vale para você',
  subtitulo:
    'Quem já contribuía em novembro de 2019 tem cinco caminhos para se aposentar. O primeiro a se abrir nem sempre é o que paga mais.',
  descricaoSeo:
    'As regras de aposentadoria da reforma da Previdência lado a lado: pontos, idade progressiva, os dois pedágios e a idade — e como saber qual se cumpre primeiro.',
  atualizadoEm: '2026-09-18',
  calculadoras: [
    'regras-de-aposentadoria',
    'aposentadoria-idade-progressiva',
    'aposentadoria-pedagio-50',
    'aposentadoria-pedagio-100',
    'aposentadoria-por-idade',
    'valor-da-aposentadoria',
    'aposentadoria-do-professor',
  ],

  secoes: [
    {
      id: 'a-data-que-decide',
      titulo: 'A data que decide tudo: 13 de novembro de 2019',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A Emenda Constitucional da reforma entrou em vigor nesse dia. Quem já era filiado ao INSS ganhou regras de transição, pensadas para não mudar de uma vez o plano de quem estava perto de se aposentar. Quem começou a contribuir depois segue só a regra permanente, com idade mínima fixa.',
        },
        {
          tipo: 'destaque',
          texto:
            'Na dúvida sobre a sua situação, o extrato do CNIS, no Meu INSS, mostra a data da primeira contribuição — é por ela que se começa.',
        },
      ],
    },

    {
      id: 'as-cinco-regras',
      titulo: 'As cinco regras de quem já contribuía',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'Pontos: a soma da idade com o tempo de contribuição precisa alcançar a pontuação do ano, que sobe um ponto a cada ano até um teto.',
            'Idade progressiva: uma idade mínima que sobe seis meses por ano, somada ao tempo mínimo de contribuição.',
            'Pedágio da metade: sem idade mínima, para quem estava a menos de dois anos do tempo exigido na data da reforma — contribui-se metade do que faltava, a mais.',
            'Pedágio do tempo inteiro: idade mínima fixa e mais baixa, em troca de contribuir, a mais, todo o tempo que faltava na data da reforma.',
            'Idade: a idade mínima, com um tempo de contribuição bem menor que o das outras regras.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Todas exigem tempo mínimo de contribuição, e os requisitos de cada uma são cumulativos: idade de sobra não compensa tempo curto, e vice-versa.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-idade-progressiva-tempo-mulher',
          legenda: 'Tempo de contribuição exigido da mulher na idade progressiva, em anos.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-idade-progressiva-tempo-homem',
          legenda: 'Tempo de contribuição exigido do homem na idade progressiva, em anos.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-idade-transicao-tempo',
          legenda: 'Tempo de contribuição exigido na aposentadoria por idade de quem já era filiado, em anos — igual para os dois sexos.',
        },
      ],
    },

    {
      id: 'os-pedagios',
      titulo: 'Os pedágios são contados sobre 2019, não sobre hoje',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O erro mais comum com os pedágios é calcular sobre o tempo que falta hoje. A Emenda manda olhar o que faltava na data da reforma, e esse número não muda mais. Por isso as calculadoras dos pedágios pedem dois tempos de contribuição: o de novembro de 2019 e o de hoje.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-pedagio-50-percentual',
          legenda: 'Pedágio da metade: fração do tempo que faltava em 2019 que precisa ser cumprida a mais.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-pedagio-50-corte-mulher',
          legenda: 'Pedágio da metade: a mulher precisava ter MAIS do que estes anos de contribuição em 2019.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-pedagio-50-corte-homem',
          legenda: 'Pedágio da metade: o homem precisava ter MAIS do que estes anos de contribuição em 2019.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O pedágio da metade tem porta de entrada estreita e nenhuma idade mínima — e o valor do benefício leva o fator previdenciário, que costuma reduzi-lo para quem se aposenta jovem. O pedágio do tempo inteiro vale para qualquer filiado antes da reforma, mas pede idade mínima.',
        },
        {
          tipo: 'chamada',
          slug: 'aposentadoria-pedagio-100',
          texto: 'A calculadora do pedágio do tempo inteiro mostra se é a idade ou o tempo que está segurando a data.',
        },
      ],
    },

    {
      id: 'quando-nao-e-quanto',
      titulo: 'Quando não é o mesmo que quanto',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Comparar as regras responde a primeira pergunta: em que mês a aposentadoria fica disponível. A segunda — quanto ela vai pagar — depende da média das contribuições desde julho de 1994 e de um cálculo que muda de regra para regra.',
        },
        {
          tipo: 'destaque',
          texto:
            'A regra que se cumpre primeiro pode pagar menos. Antes de pedir, vale estimar o valor por cada regra disponível — esperar alguns meses por outra regra às vezes compensa pelo resto da vida.',
        },
        {
          tipo: 'chamada',
          slug: 'regras-de-aposentadoria',
          texto:
            'O comparador de regras põe as cinco lado a lado, com o mês em que cada uma se cumpre, e aponta a primeira.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Na maior parte das regras, o valor parte de um percentual da média e cresce a cada ano completo de contribuição acima de um limite, que é menor para a mulher. No pedágio do tempo inteiro, o valor é a média integral.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-valor-coeficiente-base',
          legenda: 'Percentual da média antes do acréscimo por ano de contribuição.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-valor-acrescimo-por-ano',
          legenda: 'Acréscimo por ano completo de contribuição acima do limite.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-valor-anos-sem-acrescimo-mulher',
          legenda: 'Anos de contribuição da mulher a partir dos quais cada ano acrescenta.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-valor-anos-sem-acrescimo-homem',
          legenda: 'Anos de contribuição do homem a partir dos quais cada ano acrescenta.',
        },
        {
          tipo: 'chamada',
          slug: 'valor-da-aposentadoria',
          texto: 'A calculadora de valor da aposentadoria aplica o percentual, o teto e o piso sobre a sua média.',
        },
      ],
    },

    {
      id: 'o-professor',
      titulo: 'O professor tem regras próprias',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem tem todo o tempo de contribuição em efetivo exercício de magistério na educação infantil ou nos ensinos fundamental e médio tem versões próprias da regra de pontos, da idade progressiva, do pedágio do tempo inteiro e da regra permanente — em geral com cinco anos a menos de idade e de tempo.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-professor-pontos-tempo-mulher',
          legenda: 'Anos de magistério exigidos da professora na regra de pontos.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-professor-pontos-tempo-homem',
          legenda: 'Anos de magistério exigidos do professor na regra de pontos.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Tempo em outra atividade tira a pessoa dessas regras e a leva para as gerais. Professor universitário não está nelas.',
        },
        {
          tipo: 'chamada',
          slug: 'aposentadoria-do-professor',
          texto: 'A calculadora do professor compara as regras do magistério e aponta a primeira a se cumprir.',
        },
      ],
    },

    {
      id: 'quem-comecou-depois',
      titulo: 'Quem começou a contribuir depois da reforma',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Para quem se filiou depois de novembro de 2019 existe uma regra só: idade mínima e tempo mínimo de contribuição, que para o homem é maior que o exigido na transição.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-permanente-tempo-mulher',
          legenda: 'Regra permanente: tempo de contribuição da mulher, em anos.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aposentadoria-permanente-tempo-homem',
          legenda: 'Regra permanente: tempo de contribuição do homem, em anos.',
        },
        {
          tipo: 'chamada',
          slug: 'aposentadoria-por-idade',
          texto: 'A calculadora de aposentadoria por idade aplica a transição ou a regra permanente, conforme a data de filiação.',
        },
      ],
    },
  ],
}
