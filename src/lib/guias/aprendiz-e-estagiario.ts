/**
 * Guia — "Aprendiz e estagiário: salário, jornada e recesso".
 *
 * Lote 1 da expansão do catálogo, ligado a CALC-083 e CALC-084. Os dois
 * vínculos de formação num texto só porque quem pesquisa um quase sempre está
 * decidindo entre os dois, e a diferença que importa — um é emprego, o outro
 * não — só aparece com eles lado a lado.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const APRENDIZ_E_ESTAGIARIO: Guia = {
  slug: 'aprendiz-e-estagiario',
  titulo: 'Aprendiz e estagiário: salário, jornada e recesso',
  subtitulo:
    'Os dois começam a vida profissional aprendendo, mas só um deles tem carteira assinada — e essa diferença muda cada linha da conta.',
  descricaoSeo:
    'A diferença entre jovem aprendiz e estagiário: como se calcula o salário e a bolsa, o limite de jornada, o FGTS reduzido e o recesso proporcional.',
  atualizadoEm: '2026-09-17',
  calculadoras: ['jovem-aprendiz', 'recesso-de-estagio'],

  secoes: [
    {
      id: 'um-e-emprego-o-outro-nao',
      titulo: 'Um é emprego, o outro não',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O aprendiz é empregado. O contrato de aprendizagem é um contrato de trabalho especial, por prazo determinado e anotado na carteira, com formação técnico-profissional acompanhada por entidade qualificada. Há contribuição previdenciária, FGTS, férias e décimo terceiro.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O estagiário não é. O estágio feito dentro das regras da lei não cria vínculo de emprego de nenhuma natureza: não há FGTS, décimo terceiro nem as demais verbas da CLT. O que existe é a bolsa, o auxílio-transporte no estágio não obrigatório e o recesso.',
        },
      ],
    },

    {
      id: 'o-salario-do-aprendiz',
      titulo: 'O salário do aprendiz é pago por hora',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A lei garante ao aprendiz o salário mínimo por hora, e não o salário mínimo do mês. Como a jornada do aprendiz costuma ser menor que a integral, o salário mensal é proporcional às horas contratadas — e pode ficar abaixo do mínimo mensal sem descumprir nada.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'salario-minimo-hora',
          legenda: 'Valor horário do salário mínimo, fixado no decreto anual — o piso da hora do aprendiz.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Para chegar ao mês, as horas semanais são multiplicadas por cinco. É a mesma conta que transforma a jornada integral no divisor usado para horas extras, e ela já inclui o descanso semanal remunerado.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aprendiz-jornada-diaria',
          legenda: 'Jornada diária máxima do aprendiz, sem prorrogação nem compensação.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'aprendiz-jornada-diaria-estendida',
          legenda:
            'Limite diário para quem já completou o ensino fundamental, com as horas de aprendizagem teórica incluídas.',
        },
        {
          tipo: 'chamada',
          slug: 'jovem-aprendiz',
          texto:
            'A calculadora do jovem aprendiz multiplica a hora pela jornada contratada e mostra o INSS, o líquido e o FGTS.',
        },
      ],
    },

    {
      id: 'o-fgts-do-aprendiz',
      titulo: 'O FGTS do aprendiz é reduzido',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O depósito de FGTS existe, mas com alíquota menor que a dos demais empregados. É pago pela empresa, por fora, e não sai do salário do aprendiz.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'fgts-aliquota-aprendiz',
          legenda: 'Alíquota do depósito mensal de FGTS nos contratos de aprendizagem.',
        },
      ],
    },

    {
      id: 'a-bolsa-do-estagiario',
      titulo: 'A bolsa do estagiário',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'No estágio não obrigatório, a bolsa e o auxílio-transporte são compulsórios. No estágio obrigatório, aquele exigido pelo curso, a bolsa é facultativa. Benefícios como alimentação e saúde podem ser concedidos sem que isso crie vínculo de emprego.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Não há contribuição previdenciária obrigatória sobre a bolsa. O estagiário que quiser contar o período para a aposentadoria pode se inscrever e contribuir como segurado facultativo.',
        },
      ],
    },

    {
      id: 'o-recesso',
      titulo: 'O estagiário não tem férias, tem recesso',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A cada ano de estágio, a lei assegura um período de recesso, a ser gozado de preferência nas férias escolares. Quem estagia menos de um ano tem o recesso proporcional aos meses. Não existe o adicional de um terço das férias.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'estagio-recesso-dias',
          legenda: 'Dias de recesso por ano de estágio, concedidos proporcionalmente abaixo de um ano.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O recesso é remunerado quando há bolsa. A lei deixa duas perguntas sem resposta: como arredondar a fração de dias, e se o recesso não gozado deve ser pago ao fim do estágio. O termo de compromisso pode tratar das duas.',
        },
        {
          tipo: 'chamada',
          slug: 'recesso-de-estagio',
          texto:
            'A calculadora de recesso de estágio mostra os dias adquiridos sem arredondar e o valor deles quando há bolsa.',
        },
      ],
    },
  ],
}
