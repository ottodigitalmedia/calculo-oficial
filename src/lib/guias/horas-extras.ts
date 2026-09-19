/**
 * Guia — "Horas extras e o reflexo no descanso semanal"
 * (`03-functional-spec` §4). Ligado a CALC-006.
 *
 * Duas coisas que quase nenhuma conta caseira faz: o reflexo no repouso
 * semanal remunerado (Lei nº 605/1949, art. 7º, e Súmula 172 do TST) e a hora
 * noturna reduzida (CLT, art. 73, § 1º). As duas empurram o valor para cima, e
 * a segunda é a única aritmética de TEMPO do v1.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const HORAS_EXTRAS: Guia = {
  slug: 'horas-extras-e-o-descanso-semanal',
  titulo: 'Horas extras e o reflexo no descanso semanal',
  subtitulo:
    'A hora extra não termina nela mesma: ela repercute no repouso semanal, e a hora da madrugada dura menos que sessenta minutos.',
  descricaoSeo:
    'Como se calcula a hora extra a partir do salário mensal, por que ela reflete no descanso semanal remunerado e por que a hora noturna é reduzida.',
  atualizadoEm: '2026-09-18',
  calculadoras: [
    'horas-extras',
    'banco-de-horas',
    'salario-liquido',
    'adicional-noturno',
    'dsr-sobre-comissoes',
    'desconto-de-faltas',
    'sobreaviso-e-prontidao',
    'horas-trabalhadas',
    'escala-12x36',
  ],

  secoes: [
    {
      id: 'o-valor-da-hora',
      titulo: 'Primeiro é preciso saber quanto vale a sua hora',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quem recebe por mês não tem um valor de hora escrito no contrato — ele é obtido dividindo o salário mensal por um divisor que depende da jornada semanal contratada.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'É por isso que duas pessoas com o mesmo salário podem ter horas extras de valores diferentes: quem tem jornada semanal menor tem divisor menor, e portanto hora mais cara. Informar a jornada errada é o motivo mais comum de a estimativa não bater.',
        },
        {
          tipo: 'chamada',
          slug: 'horas-extras',
          texto:
            'A calculadora exibe o divisor usado e o valor da hora normal antes de aplicar qualquer adicional.',
        },
      ],
    },

    {
      id: 'antes-da-hora-extra-a-jornada',
      titulo: 'Antes da hora extra, a jornada',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Só existe hora extra quando a jornada passa do limite, e o limite é contado sem o intervalo: o almoço não é hora trabalhada. O intervalo, por sua vez, tem mínimo conforme a duração do trabalho, e o que faltar dele é pago à parte, com acréscimo.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'jornada-normal-diaria-minutos',
          legenda: 'Duração normal do trabalho por dia, em minutos.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'jornada-normal-semanal-minutos',
          legenda: 'Duração normal do trabalho por semana, em minutos.',
        },
        {
          tipo: 'chamada',
          slug: 'horas-trabalhadas',
          texto: 'A calculadora de horas trabalhadas monta a jornada a partir da entrada, da saída e do intervalo.',
        },
      ],
    },

    {
      id: 'o-adicional',
      titulo: 'O adicional, e o que pode aumentá-lo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Sobre a hora normal incide um acréscimo mínimo garantido pela Constituição. É mínimo, não fixo: convenção coletiva e acordo individual podem estabelecer percentual maior, e muitas categorias têm adicional acima do piso constitucional.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'hora-extra-adicional-minimo',
          legenda: 'Acréscimo mínimo sobre a hora normal, garantido pela Constituição.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Se a sua convenção fixa percentual maior, é ele que vale. Vale conferir o instrumento coletivo da categoria antes de concluir que a folha está errada — a lei estabelece o piso, não o teto.',
        },
      ],
    },

    {
      id: 'o-reflexo-no-descanso',
      titulo: 'O reflexo no descanso semanal remunerado',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Esta é a parte que quase nenhuma conta feita em casa inclui, e que costuma ser a maior diferença entre a estimativa e o holerite.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O repouso semanal é remunerado, e a remuneração dele acompanha o que se ganhou nos dias trabalhados da semana. Quando há horas extras habituais, elas aumentam a base do repouso — o que gera uma parcela adicional, separada, calculada a partir das próprias horas extras.',
        },
        {
          tipo: 'destaque',
          texto:
            'Quem soma apenas as horas extras e para por aí subestima o valor. O reflexo no repouso é verba própria, e aparece como linha separada na folha.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O reflexo também alcança outras verbas quando as horas extras são habituais: elas passam a compor a média que forma férias, décimo terceiro e a base do depósito da conta vinculada. Uma hora extra habitual custa ao empregador bem mais que o próprio adicional.',
        },
      ],
    },

    {
      id: 'a-hora-da-madrugada',
      titulo: 'A hora da madrugada dura menos',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O trabalho noturno tem duas vantagens acumuladas, e ignorar a segunda é o erro mais silencioso deste cálculo.',
        },
        {
          tipo: 'lista',
          itens: [
            'Há um adicional próprio sobre a hora diurna, que se soma ao regime comum de remuneração.',
            'A hora noturna é computada como período reduzido: ela dura menos que uma hora de relógio.',
          ],
        },
        {
          tipo: 'valorVigente',
          parametroId: 'adicional-noturno',
          legenda: 'Acréscimo sobre a hora diurna para o trabalho executado no período noturno.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'hora-noturna-segundos',
          legenda: 'Duração, em segundos, de uma hora de trabalho noturno — menor que a hora de relógio.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'A consequência prática é que um turno noturno rende mais horas contadas do que horas passadas no relógio. Quem converte o tempo de plantão direto em horas comuns paga menos que o devido, e a diferença não é pequena.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'No campo a regra é outra. A lei do trabalho rural define um horário noturno próprio — diferente na lavoura e na pecuária — e um adicional maior que o urbano, mas não reduz a hora: ali, uma hora noturna dura uma hora de relógio.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'adicional-noturno-rural',
          legenda: 'Acréscimo sobre a remuneração normal do trabalho noturno na lavoura e na pecuária.',
        },
        {
          tipo: 'chamada',
          slug: 'adicional-noturno',
          texto:
            'A calculadora de adicional noturno aplica a regra urbana ou a rural e mostra a conversão das horas quando ela existe.',
        },
      ],
    },

    {
      id: 'a-escala-12x36',
      titulo: 'Na escala 12 × 36, o feriado já está no salário',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A escala de doze horas de trabalho por trinta e seis de descanso é uma exceção ao limite diário, prevista na CLT desde a reforma de 2017, e pode ser combinada por acordo individual escrito ou por instrumento coletivo. O plantão se repete a cada dois dias, e a média semanal fica abaixo do limite constitucional — embora uma semana real tenha três ou quatro plantões.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'escala-12x36-trabalho-minutos',
          legenda: 'Trabalho seguido de cada plantão, em minutos.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'escala-12x36-descanso-minutos',
          legenda: 'Descanso ininterrupto depois de cada plantão, em minutos.',
        },
        {
          tipo: 'destaque',
          texto:
            'A lei diz que a remuneração mensal da escala já abrange o descanso semanal e os feriados, que se consideram compensados. Plantão em feriado, pela CLT, não é pago à parte — a convenção coletiva da categoria pode prever outra coisa.',
        },
        {
          tipo: 'chamada',
          slug: 'escala-12x36',
          texto: 'A calculadora da escala marca os plantões do mês a partir de um dia de plantão e aponta os que caem em domingo e em feriado nacional.',
        },
      ],
    },

    {
      id: 'quando-o-repouso-muda',
      titulo: 'Comissões aumentam o repouso, e faltas o tiram',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O mesmo repouso semanal que recebe o reflexo das horas extras também recebe o da remuneração variável. Quem ganha comissão tem o descanso e os feriados pagos sobre ela, e o valor sai da própria comissão do mês: dividida pelos dias trabalhados, ela dá o valor de um dia de repouso.',
        },
        {
          tipo: 'chamada',
          slug: 'dsr-sobre-comissoes',
          texto:
            'A calculadora de DSR sobre comissões divide o variável do mês pelos dias úteis e multiplica pelos domingos e feriados, arredondando uma vez só.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O caminho inverso também existe. A falta sem motivo justificado custa o dia não trabalhado e, além dele, o repouso remunerado daquela semana. Faltas justificadas — atestado médico, casamento, falecimento na família e as demais hipóteses da lei — não produzem nenhum dos dois descontos.',
        },
        {
          tipo: 'chamada',
          slug: 'desconto-de-faltas',
          texto:
            'A calculadora de desconto de faltas separa o valor dos dias e o do repouso perdido, semana a semana.',
        },
      ],
    },

    {
      id: 'quando-a-hora-nao-vira-dinheiro',
      titulo: 'Quando a hora extra não vira dinheiro',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A hora excedente pode ser compensada com folga, em vez de paga, se houver acordo válido de banco de horas. Nesse regime o que se acumula é tempo, e o prazo para compensar depende da forma como o acordo foi firmado.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Se o prazo se esgota sem a compensação, o saldo volta a ser dinheiro — e aí com o adicional, e não hora por hora. É a diferença entre compensar dentro do prazo e compensar fora dele.',
        },
        {
          tipo: 'chamada',
          slug: 'banco-de-horas',
          texto:
            'A calculadora de banco de horas mostra o prazo aplicável a cada forma de acordo e o que acontece com o saldo vencido.',
        },
      ],
    },

    {
      id: 'sobreaviso-e-prontidao',
      titulo: 'Horas de espera não são horas extras',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Ficar à disposição sem trabalhar tem regra própria. No sobreaviso o empregado espera em casa, ou à distância, podendo ser chamado a qualquer momento; na prontidão, espera nas dependências do empregador, aguardando ordens. As horas de espera não são pagas como horas normais nem como extras, e sim por uma fração do valor da hora.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'sobreaviso-fracao',
          legenda: 'Fração do salário normal pela qual são contadas as horas de sobreaviso.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'prontidao-fracao',
          legenda: 'Fração do salário-hora normal pela qual são contadas as horas de prontidão.',
        },
        {
          tipo: 'lista',
          itens: [
            'A regra da CLT foi escrita para os ferroviários. Para as demais categorias, o TST reconhece o sobreaviso de quem fica à distância, sob controle do empregador por celular ou outro meio, em plantão ou escala equivalente.',
            'Ter celular da empresa, sozinho, não caracteriza sobreaviso.',
            'Se o chamado acontece e o empregado trabalha, o tempo trabalhado deixa de ser espera e é pago como hora normal ou extra.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'sobreaviso-e-prontidao',
          texto:
            'A calculadora de sobreaviso e prontidão aplica a fração de cada regime sobre o valor da hora da sua jornada.',
        },
      ],
    },

    {
      id: 'os-descontos',
      titulo: 'Horas extras entram na base dos descontos',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Hora extra é verba salarial: entra na base da contribuição previdenciária e na do imposto de renda, junto com o salário do mês. Um mês com muitas horas extras pode cair em faixa mais alta que o mês seguinte, sem que nada tenha mudado no contrato.',
        },
        {
          tipo: 'chamada',
          slug: 'salario-liquido',
          texto:
            'Para ver o efeito no líquido do mês, some as horas extras à remuneração e compare na calculadora de salário líquido.',
        },
      ],
    },
  ],
}
