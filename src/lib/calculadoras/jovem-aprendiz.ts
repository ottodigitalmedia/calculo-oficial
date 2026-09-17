/**
 * CALC-083 — Salário do jovem aprendiz.
 *
 * O piso do aprendiz é o salário mínimo HORÁRIO (CLT, art. 428, § 2º), e não o
 * mensal: como a jornada costuma ser menor que a integral, o salário do mês é
 * proporcional às horas. Os descontos saem do mesmo motor do salário líquido,
 * e o FGTS é o reduzido da aprendizagem.
 *
 * Motor em `engine/calculadoras/aprendizagem.ts`.
 */

import { calcularAprendiz } from '../engine/calculadoras/aprendizagem'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { APRENDIZAGEM } from '../params/data/aprendizagem'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(INSS, IRRF, APRENDIZAGEM)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularAprendiz(
    {
      horasDiarias: numero(valores, 'horasDiarias'),
      diasPorSemana: numero(valores, 'diasPorSemana'),
      valorHoraContratado: centavos(numero(valores, 'valorHora')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.liquido,
      detalhamento: [
        { rotulo: 'Salário bruto', valor: v.salarioBruto, sinal: 'credito' },
        { rotulo: 'INSS', valor: v.inss, sinal: 'debito' },
        ...(v.irrf > 0 ? ([{ rotulo: 'Imposto de renda', valor: v.irrf, sinal: 'debito' }] as const) : []),
        { rotulo: 'Salário líquido', valor: v.liquido, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Valor da hora', valor: formatarReal(v.valorHora) },
        { rotulo: 'Horas remuneradas no mês', valor: `${v.horasMensais}h` },
        { rotulo: 'FGTS depositado pela empresa', valor: formatarReal(v.fgts) },
      ],
      notas: [
        ...(v.jornadaEstendida
          ? [
              'Jornada acima de seis horas só é permitida a quem já completou o ensino fundamental, e se as ' +
                'horas de aprendizagem teórica estiverem incluídas nela.',
            ]
          : []),
        ...(v.aplicadoPiso
          ? ['O valor da hora informado estava abaixo do salário mínimo horário, e o cálculo usou o mínimo.']
          : []),
        'O FGTS não sai do salário: é depositado pela empresa, por fora, na conta do aprendiz.',
      ],
    },
  }
}

export const JOVEM_APRENDIZ: DefinicaoCalculadora = {
  id: 'CALC-083',
  slug: 'jovem-aprendiz',
  nome: 'Salário do jovem aprendiz',
  linhaDeContexto: 'Quanto o aprendiz recebe pela jornada contratada, com os descontos e o FGTS da aprendizagem.',
  descricaoSeo:
    'Calcule o salário do jovem aprendiz pelo salário mínimo hora e pela jornada contratada, com INSS, líquido e o FGTS reduzido da aprendizagem.',

  campos: [
    {
      id: 'horasDiarias',
      rotulo: 'Horas de trabalho por dia',
      tipo: 'inteiro',
      padrao: 4,
      minimo: 1,
      maximo: 8,
      ajuda: 'Até seis horas. Até oito só para quem completou o ensino fundamental, contando as aulas teóricas.',
    },
    {
      id: 'diasPorSemana',
      rotulo: 'Dias de trabalho por semana',
      tipo: 'inteiro',
      padrao: 5,
      minimo: 1,
      maximo: 6,
    },
    {
      id: 'valorHora',
      rotulo: 'Valor da hora no contrato (opcional)',
      tipo: 'monetario',
      minimo: 0,
      maximo: 100_000,
      ajuda: 'Deixe em branco para usar o salário mínimo horário, que é o piso do aprendiz.',
    },
  ],

  parametrosRequeridos: [
    'salario-minimo-hora',
    'fgts-aliquota-aprendiz',
    'aprendiz-jornada-diaria',
    'aprendiz-jornada-diaria-estendida',
    'inss-tabela-progressiva',
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
  ],

  rotuloResultado: 'Salário líquido do aprendiz estimado',

  calcular,

  faq: [
    {
      pergunta: 'O jovem aprendiz recebe um salário mínimo inteiro?',
      resposta:
        'Não necessariamente. O art. 428, § 2º, da CLT garante ao aprendiz o salário mínimo hora, salvo condição mais favorável. Como a jornada do aprendiz costuma ser menor que a integral, o salário do mês é proporcional às horas contratadas — e pode ficar abaixo do salário mínimo mensal sem descumprir a lei.',
    },
    {
      pergunta: 'Qual é a jornada máxima do aprendiz?',
      resposta:
        'Seis horas diárias, sem prorrogação nem compensação, pelo art. 432 da CLT. Para quem já completou o ensino fundamental, a jornada pode chegar a oito horas, desde que as horas de aprendizagem teórica estejam incluídas nelas.',
    },
    {
      pergunta: 'Por que as horas do mês são a jornada semanal vezes 5?',
      resposta:
        'É a mesma conta que transforma a jornada de 44 horas semanais no divisor 220, derivada do art. 64 da CLT: a semana de seis dias aplicada aos 30 dias do mês. Ela já inclui o descanso semanal remunerado, e é a mesma usada no cálculo das horas extras.',
    },
    {
      pergunta: 'O aprendiz tem FGTS?',
      resposta:
        'Tem, com alíquota reduzida: a Lei nº 8.036/1990, art. 15, § 7º, fixa um percentual menor para os contratos de aprendizagem. O depósito é feito pela empresa, por fora, e não é descontado do salário.',
    },
    {
      pergunta: 'O aprendiz paga INSS?',
      resposta:
        'Sim. O aprendiz é empregado e contribui para o INSS pela mesma tabela progressiva dos demais, sobre o salário bruto. Como o salário costuma ser baixo, a contribuição fica na primeira faixa e o imposto de renda normalmente não incide.',
    },
  ],

  relacionadas: ['recesso-de-estagio', 'salario-liquido', 'fgts'],
}
