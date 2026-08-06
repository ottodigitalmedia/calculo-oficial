/**
 * Guia — "Rescisão sem justa causa: o que compõe o valor"
 * (`03-functional-spec` §4). Ligado a CALC-002.
 *
 * O guia da calculadora de maior busca do catálogo. O que ele explica não é a
 * aritmética — é a **natureza de cada verba**, porque é ela que decide se há
 * desconto, se entra na base do FGTS e se o valor projeta o tempo de serviço.
 * A pesquisa que o sustenta é `docs/19-incidencias-verbas-rescisorias.md`.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1). Prazos e percentuais entram
 * pelos blocos que leem `lib/params/`.
 */

import type { Guia } from './tipos'

export const RESCISAO_SEM_JUSTA_CAUSA: Guia = {
  slug: 'o-que-compoe-a-rescisao',
  titulo: 'Rescisão sem justa causa: o que compõe o valor',
  subtitulo:
    'O total não é um número só: são várias verbas de naturezas diferentes, e é a natureza de cada uma que decide se ela sofre desconto.',
  descricaoSeo:
    'O que entra no acerto da dispensa sem justa causa: saldo de salário, aviso prévio, férias, décimo terceiro e multa do FGTS — e por que só algumas dessas verbas sofrem INSS e Imposto de Renda.',
  atualizadoEm: '2026-08-06',
  calculadoras: ['rescisao-sem-justa-causa', 'fgts', 'seguro-desemprego'],

  secoes: [
    {
      id: 'nao-e-um-numero-so',
      titulo: 'O acerto não é um número só',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O valor da rescisão é a soma de verbas que foram criadas por normas diferentes, em épocas diferentes, para finalidades diferentes. Elas aparecem juntas no mesmo documento e por isso passam a impressão de serem uma coisa só — mas cada uma tem regra própria de cálculo e de desconto.',
        },
        {
          tipo: 'lista',
          itens: [
            'Saldo de salário: os dias efetivamente trabalhados no mês da saída.',
            'Aviso prévio: cumprido trabalhando ou pago em dinheiro, conforme o caso.',
            'Férias vencidas, se houver período completo não gozado, com o adicional constitucional.',
            'Férias proporcionais do período em curso, com o mesmo adicional.',
            'Décimo terceiro proporcional aos meses do ano.',
            'Multa rescisória sobre o saldo do FGTS, paga pelo empregador.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Duas coisas que a maioria espera encontrar no acerto não estão nessa lista: o saque do FGTS e o seguro-desemprego. Nenhum dos dois é pago pela empresa — a última seção explica por quê.',
        },
      ],
    },

    {
      id: 'o-aviso-previo',
      titulo: 'O aviso prévio, e por que ele mexe em tudo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O prazo do aviso não é fixo: ele parte de um mínimo e cresce com o tempo de casa, até um limite. Quem tem muitos anos na mesma empresa tem aviso bem mais longo que quem acabou de entrar.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aviso-previo-dias-base',
          legenda: 'Prazo mínimo, em dias, para quem conta até um ano de serviço na mesma empresa.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aviso-previo-dias-por-ano',
          legenda: 'Dias acrescidos ao prazo mínimo por ano de serviço prestado na mesma empresa.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aviso-previo-dias-maximo',
          legenda: 'Limite total do aviso prévio, já somados o prazo mínimo e os acréscimos.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quando o aviso é indenizado — isto é, pago em dinheiro em vez de cumprido —, o prazo dele é somado ao tempo de serviço para efeito das demais verbas. O contrato, para fins de cálculo, termina numa data posterior à do último dia de trabalho.',
        },
        {
          tipo: 'destaque',
          texto:
            'Essa projeção é o motivo de o acerto às vezes trazer um avo a mais de férias e de décimo terceiro do que a conta feita em casa apontava. Não é erro: a data que conta é a projetada.',
        },
      ],
    },

    {
      id: 'o-que-sofre-desconto',
      titulo: 'O que sofre desconto, e o que não sofre',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Aqui está a parte que mais separa uma estimativa correta de uma errada, e é também onde as calculadoras do mercado mais divergem entre si. A regra não é sobre o valor: é sobre a natureza da verba.',
        },
        {
          tipo: 'lista',
          itens: [
            'Verba de natureza salarial remunera trabalho — como o saldo de salário. Ela entra na base da contribuição previdenciária e na do imposto.',
            'Verba de natureza indenizatória repara a perda do emprego, não remunera serviço prestado — como a multa do FGTS e as férias indenizadas. Ela fica fora dessas bases.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A consequência prática é que duas rescisões de mesmo valor bruto podem ter líquidos bem diferentes, dependendo de quanto de cada natureza compõe o total. Um acerto formado sobretudo por verbas indenizatórias chega quase inteiro ao trabalhador.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Cada decisão dessas na calculadora vem de norma ou de tese vinculante, e a memória de cálculo mostra o dispositivo ao lado da etapa. Se a sua conferência divergir, o ponto exato da divergência aparece ali.',
        },
        {
          tipo: 'chamada',
          slug: 'rescisao-sem-justa-causa',
          texto:
            'A calculadora separa as verbas por natureza e mostra, verba a verba, o que entrou em cada base de desconto.',
        },
      ],
    },

    {
      id: 'a-multa-do-fgts',
      titulo: 'A multa do FGTS',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A multa incide sobre todos os depósitos feitos na conta vinculada durante o contrato, atualizados — e não sobre o saldo que está lá hoje. A diferença aparece quando houve saque durante o contrato: o saldo diminuiu, a base da multa não.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'fgts-multa-sem-justa-causa',
          legenda: 'Indenização sobre o montante dos depósitos, na dispensa sem justa causa.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quem já sacou por saque-aniversário costuma estranhar o valor da multa, porque compara com o extrato atual. A conta correta parte do somatório dos depósitos do contrato, que é maior.',
        },
        {
          tipo: 'chamada',
          slug: 'fgts',
          texto:
            'Para estimar o montante depositado a partir do salário e do tempo de contrato, a calculadora de FGTS faz essa parte.',
        },
      ],
    },

    {
      id: 'o-que-nao-vem-da-empresa',
      titulo: 'O que não vem da empresa',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Duas quantias importantes chegam por fora do acerto, e confundi-las com ele produz uma expectativa maior que a realidade do documento assinado na saída.',
        },
        {
          tipo: 'lista',
          itens: [
            'O saque do saldo do FGTS. O dinheiro já estava depositado em conta vinculada; a dispensa apenas libera o acesso. Ele não é pago pelo empregador na rescisão.',
            'O seguro-desemprego. É benefício previdenciário, pago pelo governo, com requisitos próprios de tempo de vínculo e número de solicitações anteriores.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'seguro-desemprego',
          texto:
            'O número de parcelas e o valor de cada uma seguem regra própria — a calculadora de seguro-desemprego mostra a faixa aplicada.',
        },
      ],
    },

    {
      id: 'quando-nao-bate',
      titulo: 'Quando a estimativa não bate com o termo de rescisão',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Diferença pequena costuma ser arredondamento de avos ou de salário-dia. Diferença grande quase sempre tem uma destas causas:',
        },
        {
          tipo: 'lista',
          itens: [
            'A base usada pela empresa inclui médias de horas extras, comissões ou adicionais habituais, que a estimativa não conhece.',
            'Havia férias vencidas, e elas não foram informadas na simulação — ou o contrário.',
            'A modalidade do aviso é outra: indenizado e trabalhado produzem datas de término diferentes.',
            'A convenção coletiva da categoria criou verba própria, que não vem da lei geral.',
            'O termo traz descontos contratuais — plano de saúde, adiantamento, consignado — que a simulação não tem como conhecer.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Vale comparar linha a linha, e não só o total: quando duas contas divergem, o ponto em que elas se separam costuma nomear a causa sozinho.',
        },
      ],
    },
  ],
}
