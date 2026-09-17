/**
 * Guia — "Insalubridade e periculosidade: base, graus e a escolha".
 *
 * Lote 1 da expansão do catálogo, ligado a CALC-078 e CALC-079. Um guia para
 * os dois, e não um por calculadora, pelo critério de `CLAUDE.md` passo 9: as
 * duas respondem à mesma dúvida — quanto vale trabalhar em condição de risco —
 * e a pergunta que as une é justamente a que só um texto conjunto responde:
 * qual das duas, quando cabem as duas.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const INSALUBRIDADE_E_PERICULOSIDADE: Guia = {
  slug: 'insalubridade-e-periculosidade',
  titulo: 'Insalubridade e periculosidade: base, graus e a escolha',
  subtitulo:
    'Os dois adicionais pagam pelo risco, mas incidem sobre bases diferentes — e quem está exposto às duas condições recebe só um.',
  descricaoSeo:
    'A diferença entre insalubridade e periculosidade: a base de cada adicional, os graus, quem define a exposição e como escolher quando cabem os dois.',
  atualizadoEm: '2026-09-17',
  calculadoras: ['insalubridade', 'periculosidade'],

  secoes: [
    {
      id: 'duas-condicoes-diferentes',
      titulo: 'Duas condições diferentes',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Insalubridade é a exposição a agentes que prejudicam a saúde ao longo do tempo — ruído, calor, produtos químicos, agentes biológicos — acima dos limites de tolerância. Periculosidade é a exposição a um risco acentuado à vida: inflamáveis, explosivos, energia elétrica, violência na segurança patrimonial, o trabalho em motocicleta.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Nenhuma das duas é declaração do empregado ou do empregador. A caracterização e a classificação são feitas por perícia de médico ou engenheiro do trabalho, segundo as normas do Ministério do Trabalho.',
        },
      ],
    },

    {
      id: 'a-base-da-insalubridade',
      titulo: 'A insalubridade é calculada sobre o salário mínimo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Este é o ponto que mais produz conta errada. O adicional de insalubridade não incide sobre o salário do empregado, e sim sobre o salário mínimo — o mesmo valor para quem ganha pouco e para quem ganha muito. O que varia é o percentual, conforme o grau apontado no laudo.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'salario-minimo',
          legenda: 'Salário mínimo vigente — a base legal do adicional de insalubridade.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'insalubridade-grau-maximo',
          legenda: 'Percentual sobre o salário mínimo no grau máximo.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'insalubridade-grau-medio',
          legenda: 'Percentual sobre o salário mínimo no grau médio.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'insalubridade-grau-minimo',
          legenda: 'Percentual sobre o salário mínimo no grau mínimo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Convenção coletiva ou contrato podem prever uma base maior, como o piso da categoria. Nunca menor. E como o salário mínimo é reajustado todo ano, o adicional muda todo ano mesmo sem nenhuma mudança no contrato.',
        },
        {
          tipo: 'chamada',
          slug: 'insalubridade',
          texto:
            'A calculadora de insalubridade aplica o percentual do grau sobre o salário mínimo do período escolhido, ou sobre a base da convenção.',
        },
      ],
    },

    {
      id: 'a-base-da-periculosidade',
      titulo: 'A periculosidade é calculada sobre o salário básico',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Aqui a base é o salário do próprio empregado — mas só o básico. Gratificações, prêmios e participação nos lucros ficam de fora pela lei, e a jurisprudência do Tribunal Superior do Trabalho exclui também os outros adicionais: horas extras, adicional noturno e comissões não entram na conta.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'periculosidade-adicional',
          legenda: 'Percentual do adicional de periculosidade sobre o salário básico.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Há uma exceção antiga: o eletricitário contratado antes da mudança feita na lei em 2012 continua com o adicional calculado sobre todas as parcelas de natureza salarial. Para os contratos a partir dela, vale a regra geral.',
        },
        {
          tipo: 'destaque',
          texto:
            'Exposição intermitente também conta. O adicional só deixa de ser devido quando o contato é eventual ou extremamente breve.',
        },
      ],
    },

    {
      id: 'quando-cabem-os-dois',
      titulo: 'Quando cabem os dois, recebe-se um',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Os adicionais não se acumulam. Quem trabalha exposto às duas condições pode optar pela insalubridade, mas não recebe as duas ao mesmo tempo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Como as bases são diferentes, a escolha depende do salário. Para quem ganha perto do mínimo, a insalubridade em grau máximo costuma render mais. À medida que o salário básico sobe, a periculosidade passa à frente — e o ponto de virada muda todo ano, junto com o salário mínimo.',
        },
        {
          tipo: 'chamada',
          slug: 'periculosidade',
          texto:
            'A calculadora de periculosidade compara os dois adicionais no grau que você informar e mostra qual é maior no período escolhido.',
        },
      ],
    },

    {
      id: 'o-que-muda-no-contracheque',
      titulo: 'O que muda no contracheque',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Enquanto é pago, o adicional integra a remuneração. Ele sofre contribuição previdenciária e imposto de renda junto com o salário do mês, e entra na base das férias, do décimo terceiro e do FGTS.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Quando o risco à saúde ou à integridade física é eliminado, o adicional deixa de ser devido. Ele remunera a exposição, não o cargo.',
        },
        {
          tipo: 'chamada',
          slug: 'salario-liquido',
          texto: 'Para ver o efeito no valor que cai na conta, some o adicional ao salário na calculadora de salário líquido.',
        },
      ],
    },
  ],
}
