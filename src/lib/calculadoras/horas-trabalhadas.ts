/**
 * CALC-115 — Horas trabalhadas e intervalos.
 *
 * Da entrada, da saída e do intervalo, a jornada do dia e da semana — e o que a
 * lei diz dela: se passa das oito e das quarenta e quatro horas, se o intervalo
 * é o mínimo exigido, quanto vale o intervalo que faltou e se há onze horas até
 * a próxima jornada.
 *
 * Motor em `engine/calculadoras/horas-trabalhadas.ts`.
 */

import { calcularHorasTrabalhadas, descreverMinutos } from '../engine/calculadoras/horas-trabalhadas'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { JORNADA } from '../params/data/jornada'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(JORNADA)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularHorasTrabalhadas(
    {
      entradaHora: numero(valores, 'entradaHora'),
      entradaMinuto: numero(valores, 'entradaMinuto'),
      saidaHora: numero(valores, 'saidaHora'),
      saidaMinuto: numero(valores, 'saidaMinuto'),
      intervaloMinutos: numero(valores, 'intervalo'),
      diasPorSemana: numero(valores, 'dias'),
      valorDaHora: centavos(numero(valores, 'valorHora')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Horas por dia', valor: descreverMinutos(v.minutosPorDia) },
    { rotulo: 'Horas por semana', valor: descreverMinutos(v.minutosPorSemana) },
    ...(v.minutosAlemDaDiaria > 0 ? [{ rotulo: 'Além das oito horas diárias', valor: descreverMinutos(v.minutosAlemDaDiaria) }] : []),
    ...(v.minutosAlemDaSemanal > 0 ? [{ rotulo: 'Além das quarenta e quatro semanais', valor: descreverMinutos(v.minutosAlemDaSemanal) }] : []),
    {
      rotulo: 'Intervalo',
      valor:
        v.intervaloSuprimido > 0
          ? `faltam ${descreverMinutos(v.intervaloSuprimido)} por dia`
          : v.intervaloExigido === 0
            ? 'não exigido para esta duração'
            : 'mínimo respeitado',
    },
    ...(v.intervaloAcimaDoMaximo ? [{ rotulo: 'Intervalo acima de duas horas', valor: 'só com acordo escrito ou coletivo' }] : []),
    ...(v.valorSuprimidoPorSemana > 0 ? [{ rotulo: 'Intervalo que faltou, por semana', valor: formatarReal(v.valorSuprimidoPorSemana) }] : []),
    {
      rotulo: 'Descanso até a próxima jornada',
      valor: `${descreverMinutos(v.descansoEntreJornadas)}${v.descansoAbaixoDoMinimo ? ' — abaixo das onze horas' : ''}`,
    },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: centavos(Math.round((v.minutosPorSemana * 100) / 60)),
      unidade: 'numero',
      casasDecimais: 2,
      detalhamento: [],
      destaques,
      notas: [
        ...(v.passaPeloPeriodoNoturno
          ? ['A jornada passa pelo período das 22h às 5h: ali a hora é reduzida e há adicional noturno — a calculadora de adicional noturno faz essa conta.']
          : []),
        'Acordo ou convenção coletiva podem compensar horas e reduzir o intervalo em casos previstos em lei. Esta conta mostra a regra geral da CLT.',
        'Hora extra se paga com adicional de pelo menos 50% — a calculadora de horas extras faz o valor.',
        'O descanso entre jornadas supõe o mesmo horário no dia seguinte de trabalho.',
      ],
    },
  }
}

export const HORAS_TRABALHADAS: DefinicaoCalculadora = {
  id: 'CALC-115',
  slug: 'horas-trabalhadas',
  nome: 'Horas trabalhadas e intervalo',
  linhaDeContexto: 'Da entrada, da saída e do almoço: as horas do dia e da semana, o intervalo mínimo e o descanso entre jornadas.',
  descricaoSeo:
    'Calcule as horas trabalhadas por dia e por semana pela entrada, saída e intervalo, e confira o intervalo mínimo e o descanso entre jornadas da CLT.',

  campos: [
    { id: 'entradaHora', rotulo: 'Entrada — hora', tipo: 'inteiro', obrigatorio: true, padrao: 8, minimo: 0, maximo: 23 },
    { id: 'entradaMinuto', rotulo: 'Entrada — minutos', tipo: 'inteiro', padrao: 0, minimo: 0, maximo: 59 },
    { id: 'saidaHora', rotulo: 'Saída — hora', tipo: 'inteiro', obrigatorio: true, padrao: 17, minimo: 0, maximo: 23 },
    { id: 'saidaMinuto', rotulo: 'Saída — minutos', tipo: 'inteiro', padrao: 48, minimo: 0, maximo: 59 },
    { id: 'intervalo', rotulo: 'Intervalo, em minutos', tipo: 'inteiro', padrao: 60, minimo: 0, maximo: 720, ajuda: 'Almoço ou descanso — não conta como trabalho.' },
    { id: 'dias', rotulo: 'Dias de trabalho na semana', tipo: 'inteiro', padrao: 5, minimo: 1, maximo: 7 },
    { id: 'valorHora', rotulo: 'Valor da sua hora normal (opcional)', tipo: 'monetario', padrao: 0, minimo: 0, maximo: 10_000_000, ajuda: 'Para calcular quanto vale o intervalo que faltou.' },
  ],

  parametrosRequeridos: [
    'jornada-normal-diaria-minutos',
    'jornada-normal-semanal-minutos',
    'intervalo-limite-jornada-longa-minutos',
    'intervalo-minimo-jornada-longa-minutos',
    'intervalo-maximo-sem-acordo-minutos',
    'intervalo-limite-jornada-curta-minutos',
    'intervalo-minimo-jornada-curta-minutos',
    'interjornada-minima-minutos',
    'intervalo-suprimido-acrescimo',
  ],

  rotuloResultado: 'Horas trabalhadas por semana',

  calcular,

  faq: [
    {
      pergunta: 'Quantas horas posso trabalhar por dia?',
      resposta:
        'A duração normal é de oito horas por dia e quarenta e quatro por semana (Constituição, art. 7º, XIII). Acima disso há hora extra, salvo compensação ajustada em acordo ou convenção coletiva.',
    },
    {
      pergunta: 'Qual o intervalo mínimo para almoço?',
      resposta:
        'Uma hora, quando o trabalho passa de seis horas no dia, e no máximo duas, salvo acordo (CLT, art. 71). Quem trabalha mais de quatro e até seis horas tem direito a quinze minutos. O intervalo não conta como hora trabalhada.',
    },
    {
      pergunta: 'E se o intervalo não for dado inteiro?',
      resposta:
        'O período que faltou é pago com acréscimo de 50% sobre a hora normal, e o pagamento tem natureza indenizatória (art. 71, § 4º, na redação da Lei nº 13.467/2017). Só o que faltou é pago — não a hora inteira.',
    },
    {
      pergunta: 'Quanto tempo de descanso entre um dia e outro?',
      resposta:
        'Onze horas seguidas entre o fim de uma jornada e o começo da próxima (CLT, art. 66). Quem sai às 23h só deveria voltar às 10h.',
    },
    {
      pergunta: 'Trabalho de noite. A conta muda?',
      resposta:
        'Muda. Entre 22h e 5h a hora noturna é reduzida e há adicional. A calculadora mostra quando a sua jornada passa por esse período, e a de adicional noturno faz a conta.',
    },
  ],

  relacionadas: ['horas-extras', 'banco-de-horas', 'adicional-noturno', 'desconto-de-faltas'],
}
