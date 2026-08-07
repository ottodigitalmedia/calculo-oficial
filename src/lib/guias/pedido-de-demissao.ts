/**
 * Guia — "Pedido de demissão: o que muda no que você recebe"
 * (`03-functional-spec` §4). Ligado a CALC-003.
 *
 * O guia existe para desfazer duas confusões de sinal contrário: a de que quem
 * pede demissão "não recebe nada", e a de que o acerto é igual ao da dispensa
 * menos a multa. Nenhuma das duas é verdade, e o motor de `rescisao.ts` mostra
 * por quê: mudam **três** coisas, e só três.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const PEDIDO_DE_DEMISSAO: Guia = {
  slug: 'pedido-de-demissao',
  titulo: 'Pedido de demissão: o que muda no que você recebe',
  subtitulo:
    'Sair por vontade própria não zera o acerto — muda três coisas nele, e uma delas pode virar desconto em vez de crédito.',
  descricaoSeo:
    'O que continua sendo pago quando o pedido de saída parte do trabalhador, o que deixa de ser, e por que o aviso prévio pode aparecer como desconto no termo de rescisão.',
  atualizadoEm: '2026-08-06',
  calculadoras: [
    'rescisao-pedido-demissao',
    'rescisao-sem-justa-causa',
    'rescisao-acordo-mutuo',
    // CALC-076 responde à mesma pergunta do leitor — "qual saída me deixa com
    // quanto" —, e por isso entra aqui em vez de ganhar guia próprio (§11.2).
    'acordo-ou-dispensa',
  ],

  secoes: [
    {
      id: 'o-que-continua-igual',
      titulo: 'O que continua exatamente igual',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A crença de que pedir demissão significa sair sem nada é o engano mais frequente sobre este tema. A maior parte das verbas do acerto remunera tempo já trabalhado, e tempo trabalhado não deixa de ser devido porque a saída partiu do trabalhador.',
        },
        {
          tipo: 'lista',
          itens: [
            'Saldo de salário pelos dias trabalhados no mês da saída.',
            'Férias vencidas, se houver período completo não gozado, com o adicional constitucional.',
            'Férias proporcionais do período em curso, com o mesmo adicional.',
            'Décimo terceiro proporcional aos meses do ano.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'As regras de desconto também são as mesmas: o que é salarial entra na base da contribuição previdenciária e do imposto; o que é indenizatório fica fora. A natureza da verba não muda com o motivo da saída.',
        },
      ],
    },

    {
      id: 'as-tres-diferencas',
      titulo: 'As três diferenças',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Comparado com a dispensa sem justa causa, o pedido de demissão altera três pontos — e conhecer os três explica praticamente toda a diferença entre os dois valores.',
        },
        {
          tipo: 'lista',
          itens: [
            'Não há indenização sobre os depósitos do FGTS. A multa rescisória existe para a dispensa, e é o item de maior peso no acerto de quem é mandado embora.',
            'O aviso prévio troca de lado: em vez de ser recebido, ele passa a ser devido pelo trabalhador à empresa.',
            'Não se abre o saque do saldo da conta vinculada, e não há acesso ao seguro-desemprego.',
          ],
        },
        {
          tipo: 'destaque',
          texto:
            'Nada além desses três pontos muda. Quem espera um acerto muito menor costuma estar somando diferenças que não existem.',
        },
      ],
    },

    {
      id: 'o-aviso-que-vira-desconto',
      titulo: 'O aviso que vira desconto',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quando quem pede demissão não cumpre o período de aviso, o valor correspondente pode ser descontado do acerto. É a razão de alguns termos de rescisão chegarem perto de zero — ou, em contratos curtos com férias vencidas ausentes, ficarem abaixo do que a pessoa esperava.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O prazo usado nesse desconto é o mínimo legal, e não o prazo proporcional que cresce com o tempo de casa: o acréscimo por ano de serviço foi criado em favor de quem é dispensado. Cumprir o aviso trabalhando evita o desconto inteiro.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aviso-previo-dias-base',
          legenda: 'Prazo mínimo de aviso prévio, em dias.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O aviso não cumprido também não projeta a data de término do contrato. Na dispensa, o aviso indenizado empurra a data para a frente e às vezes acrescenta um avo de férias e de décimo terceiro; aqui isso não acontece.',
        },
        {
          tipo: 'chamada',
          slug: 'rescisao-pedido-demissao',
          texto:
            'A calculadora permite simular com e sem cumprimento do aviso, e mostra o desconto como etapa separada da memória de cálculo.',
        },
      ],
    },

    {
      id: 'antes-de-decidir',
      titulo: 'Antes de decidir, vale comparar os três caminhos',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Existe uma terceira via, criada pela reforma trabalhista: o acordo entre as duas partes. Nele a indenização do FGTS e o aviso indenizado saem pela metade, o saque da conta vinculada é parcial e não há seguro-desemprego.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Ele costuma ser proposto como alternativa ao pedido de demissão, e a comparação numérica entre os dois raramente é óbvia — depende do saldo da conta vinculada, do tempo de casa e de haver ou não férias vencidas.',
        },
        {
          tipo: 'chamada',
          slug: 'rescisao-acordo-mutuo',
          texto:
            'Simular a mesma situação nas duas calculadoras, com os mesmos dados, deixa a diferença visível em números.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Uma observação sobre o que este site não faz: combinar dispensa e pedido de demissão para simular um desligamento que não ocorreu daquela forma é conta que nenhuma calculadora resolve. Os números aqui descrevem cenários, e o cenário verdadeiro é o que estiver no documento assinado.',
        },
      ],
    },

    {
      id: 'quando-nao-bate',
      titulo: 'Quando a estimativa não bate',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'O termo traz desconto de aviso e a simulação foi feita com o aviso cumprido, ou o contrário.',
            'Havia férias vencidas não informadas — é o item que mais muda o total nesse tipo de saída.',
            'A base da empresa inclui médias de horas extras ou comissões habituais.',
            'Descontos contratuais do mês, que a simulação não conhece, foram abatidos no mesmo documento.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A memória de cálculo mostra cada etapa com o dispositivo aplicado. Conferir etapa a etapa contra o termo costuma localizar a divergência mais rápido que recalcular o total.',
        },
      ],
    },
  ],
}
