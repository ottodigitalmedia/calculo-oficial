/**
 * Guia — "Empregado doméstico: o que muda na rescisão".
 *
 * Bloco trabalhista restante (§11.3). O ponto que ele precisa acertar é que o
 * doméstico **não tem a multa de 40%** — tem um fundo próprio, formado mês a
 * mês —, o que é a diferença mais cara e a menos conhecida do regime.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const EMPREGADO_DOMESTICO: Guia = {
  slug: 'empregado-domestico-na-rescisao',
  titulo: 'Empregado doméstico: o que muda na rescisão',
  subtitulo:
    'Quase tudo é igual ao da CLT comum — menos a parte que mais pesa no acerto, que funciona de outro jeito.',
  descricaoSeo:
    'O que muda na rescisão do empregado doméstico: a indenização compensatória no lugar da multa do FGTS, o aviso prévio com norma própria e o que permanece igual.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['rescisao-domestico', 'rescisao-sem-justa-causa', 'custo-do-funcionario'],

  secoes: [
    {
      id: 'o-que-e-igual',
      titulo: 'O que é igual, e é quase tudo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A lei específica do trabalho doméstico organizou direitos que já existiam e acrescentou outros. Na hora da rescisão, a maior parte da conta é a mesma de qualquer contrato com carteira assinada.',
        },
        {
          tipo: 'lista',
          itens: [
            'Saldo de salário pelos dias trabalhados no mês da saída.',
            'Férias vencidas e proporcionais, com o adicional constitucional.',
            'Décimo terceiro proporcional aos meses do ano.',
            'As mesmas regras de incidência: o que é salarial sofre desconto, o que é indenizatório não.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A diferença está concentrada em dois pontos — e um deles é justamente o de maior valor no acerto de quem é dispensado.',
        },
      ],
    },

    {
      id: 'a-indenizacao-compensatoria',
      titulo: 'Não há multa de FGTS: há um fundo formado antes',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'No contrato comum, a indenização por dispensa sem justa causa é calculada no momento da saída, como percentual sobre os depósitos do contrato inteiro. No doméstico não é assim.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A lei afastou expressamente aquela indenização e pôs no lugar um recolhimento mensal, feito junto com o FGTS ao longo de todo o contrato, que forma um fundo reservado para a rescisão.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'domestico-indenizacao-compensatoria',
          legenda:
            'Percentual da remuneração recolhido mensalmente para formar a indenização compensatória.',
        },
        {
          tipo: 'destaque',
          texto:
            'A consequência prática é que o empregador doméstico não leva um susto na rescisão: ele já pagou, mês a mês. E o empregado recebe um valor que depende do que foi recolhido, não de um percentual aplicado no fim.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Há um detalhe que gera dúvida frequente: quando a saída é por iniciativa do empregado, o valor acumulado nesse fundo não é dele — retorna ao empregador, na forma que a lei prevê.',
        },
        {
          tipo: 'chamada',
          slug: 'rescisao-domestico',
          texto:
            'A calculadora aplica o regime do doméstico e mostra a indenização compensatória em linha própria.',
        },
      ],
    },

    {
      id: 'o-aviso-previo',
      titulo: 'O aviso prévio tem norma própria, com os mesmos números',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O aviso prévio do doméstico segue artigo próprio da lei específica — e não o da lei geral. Os prazos coincidem, mas o fundamento é outro, e isso importa quando se discute o caso.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'domestico-aviso-previo-dias-base',
          legenda: 'Prazo mínimo do aviso prévio no contrato doméstico.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'domestico-aviso-previo-dias-por-ano',
          legenda: 'Dias acrescidos por ano de serviço ao mesmo empregador.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Citar o dispositivo certo não é preciosismo: quando a norma geral é alterada e a específica não, quem confunde as duas passa a usar uma regra que não se aplica àquele contrato.',
        },
      ],
    },

    {
      id: 'o-custo-para-quem-contrata',
      titulo: 'O custo para quem contrata',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O regime unificou os recolhimentos do empregador doméstico num documento só, com vencimento mensal. Ele reúne a contribuição previdenciária do empregado e a do empregador, o FGTS, o seguro contra acidentes e a indenização compensatória.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Somados, esses itens fazem o custo mensal ficar bem acima do salário combinado — e é isso que costuma surpreender quem contrata pela primeira vez, sobretudo porque parte do valor é reserva para uma rescisão que talvez demore anos.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-do-funcionario',
          texto:
            'A calculadora de custo do funcionário mostra a soma dos encargos sobre a remuneração.',
        },
      ],
    },
  ],
}
