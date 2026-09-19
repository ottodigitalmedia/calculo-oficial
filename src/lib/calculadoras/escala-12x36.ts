/**
 * CALC-120 — Escala 12 × 36.
 *
 * "Quantos plantões eu faço no mês? Quantas horas? Vou trabalhar no feriado?" —
 * a partir de um dia de plantão, a página marca os do período e responde as
 * três, com a regra do art. 59-A da CLT sobre feriado na escala.
 *
 * Motor em `engine/calculadoras/escala-12x36.ts`.
 */

import { calcularEscala12x36, PARAMETROS_ESCALA_12X36 } from '../engine/calculadoras/escala-12x36'
import { centavos } from '../engine/types'
import { formatarData } from '../format/moeda'
import { FERIADOS } from '../params/data/feriados'
import { JORNADA } from '../params/data/jornada'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import { texto, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(JORNADA, FERIADOS)

const MINUTOS_NA_HORA = 60
/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
const CENTESIMOS_POR_UNIDADE = 100
/** Até um mês e pouco, a lista de datas cabe no resultado; acima disso, só a contagem. */
const LISTA_ATE = 31

function horas(minutos: number): string {
  const h = Math.floor(minutos / MINUTOS_NA_HORA)
  const m = minutos % MINUTOS_NA_HORA
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/** "02/06" — dia e mês bastam dentro de um período curto. */
function diaEMes(iso: DataISO): string {
  return formatarData(iso).slice(0, 5)
}

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularEscala12x36(
    {
      plantao: texto(valores, 'plantao') as DataISO,
      inicio: texto(valores, 'inicio') as DataISO,
      fim: texto(valores, 'fim') as DataISO,
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Horas de plantão no período', valor: horas(v.minutosTrabalhados) },
    { rotulo: 'Plantões em domingo', valor: `${v.emDomingo}` },
    { rotulo: 'Plantões em feriado nacional', valor: `${v.emFeriado.length}` },
    { rotulo: 'Média semanal da escala', valor: horas(v.mediaSemanalMinutos) },
  ]
  if (v.plantoes.length > 0 && v.plantoes.length <= LISTA_ATE) {
    destaques.push({ rotulo: 'Dias de plantão', valor: v.plantoes.map(diaEMes).join(', ') })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: centavos(v.plantoes.length * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      casasDecimais: 0,
      detalhamento: [],
      destaques,
      ...(v.emFeriado.length > 0
        ? {
            tabela: {
              titulo: 'Plantões que caem em feriado nacional',
              colunas: [],
              linhas: v.emFeriado.map((f) => ({ rotulo: `${formatarData(f.data)} — ${f.nome}`, valores: [] })),
            },
          }
        : {}),
      notas: [
        `A escala do art. 59-A da CLT é de ${horas(v.minutosPorPlantao)} seguidas de trabalho por ${horas(v.minutosDeDescanso)} ininterruptas de descanso: um plantão a cada ${v.diasDoCiclo} dias. O plantão é contado no dia em que começa, mesmo o noturno que termina na manhã seguinte.`,
        'Pelo parágrafo único do art. 59-A, a remuneração mensal da escala já abrange o descanso semanal remunerado e os feriados, que se consideram compensados. A convenção ou o acordo coletivo da categoria pode prever outra coisa — vale conferir.',
        'Só entram os feriados nacionais. Feriado estadual e municipal, e datas como Carnaval e Corpus Christi, que são ponto facultativo, não estão na conta.',
        'Plantão noturno tem adicional e hora reduzida entre 22h e 5h, que esta conta não inclui — a calculadora de adicional noturno faz essa parte.',
      ],
    },
  }
}

export const ESCALA_12X36: DefinicaoCalculadora = {
  id: 'CALC-120',
  slug: 'escala-12x36',
  nome: 'Escala 12 × 36',
  linhaDeContexto: 'Quantos plantões e quantas horas no mês, e quais caem em domingo ou feriado.',
  descricaoSeo:
    'Calcule os plantões da escala 12x36 no mês ou em qualquer período: quantidade, horas, domingos e feriados nacionais, com a regra do art. 59-A da CLT.',

  campos: [
    {
      id: 'plantao',
      rotulo: 'Um dia em que você tem plantão',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Qualquer um: o último, o próximo ou o primeiro da escala. A conta segue a partir dele, para a frente e para trás.',
    },
    {
      id: 'inicio',
      rotulo: 'Início do período',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Para ver um mês, use o dia 1º.',
    },
    {
      id: 'fim',
      rotulo: 'Fim do período',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Os dois dias entram na conta. O período pode ter até um ano.',
    },
  ],

  parametrosRequeridos: [...PARAMETROS_ESCALA_12X36],
  vigenciaPelaData: 'inicio',

  rotuloResultado: 'Plantões no período',

  calcular,

  faq: [
    {
      pergunta: 'Quantos plantões tem a escala 12 × 36 no mês?',
      resposta:
        'Quinze ou dezesseis num mês de trinta e um dias, quinze num de trinta, e catorze ou quinze em fevereiro — depende do dia em que cai o primeiro plantão. Como o plantão se repete a cada dois dias, a calculadora marca a partir de um dia de plantão que você conhece e conta os do período.',
    },
    {
      pergunta: 'Quantas horas a escala 12 × 36 dá por semana?',
      resposta:
        'Em média, quarenta e duas: doze horas a cada dois dias são três plantões e meio por semana. Numa semana real são três ou quatro plantões — 36 ou 48 horas —, e a média só aparece no conjunto de duas semanas.',
    },
    {
      pergunta: 'Quem trabalha em 12 × 36 recebe feriado em dobro?',
      resposta:
        'Pela CLT, não. O parágrafo único do art. 59-A, incluído pela reforma trabalhista de 2017, diz que a remuneração mensal da escala já abrange o descanso semanal e os feriados, e que os feriados trabalhados se consideram compensados. A convenção ou o acordo coletivo da categoria pode prever pagamento diferente, e por isso vale conferir o instrumento coletivo.',
    },
    {
      pergunta: 'Como a escala 12 × 36 pode ser combinada?',
      resposta:
        'Por acordo individual escrito, convenção coletiva ou acordo coletivo de trabalho, segundo o art. 59-A da CLT, observados ou indenizados os intervalos para repouso e alimentação.',
    },
    {
      pergunta: 'O plantão noturno conta no dia em que começa ou no que termina?',
      resposta:
        'Nesta calculadora, no dia em que começa — é como as escalas costumam ser publicadas. Quem entra às 19h de sexta e sai às 7h de sábado tem o plantão de sexta. Se o plantão começa num feriado, é ele que aparece na lista de plantões em feriado.',
    },
  ],

  relacionadas: ['adicional-noturno', 'horas-trabalhadas', 'dias-uteis-entre-datas', 'horas-extras'],
}
