/**
 * CALC-091 — Sobreaviso e prontidão.
 *
 * As horas de espera não são pagas como horas de trabalho: o sobreaviso vale um
 * terço da hora e a prontidão, dois terços (CLT, art. 244, §§ 2º e 3º). A página
 * aceita as duas no mesmo mês e declara o limite de cada escala.
 *
 * Motor em `engine/calculadoras/disponibilidade.ts`.
 */

import { calcularSobreaviso } from '../engine/calculadoras/disponibilidade'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { DISPONIBILIDADE } from '../params/data/disponibilidade'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(DISPONIBILIDADE)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularSobreaviso(
    {
      salario: centavos(numero(valores, 'salario')),
      jornadaSemanal: Number(texto(valores, 'jornadaSemanal')),
      horasSobreavisoCentesimos: numero(valores, 'horasSobreaviso'),
      horasProntidaoCentesimos: numero(valores, 'horasProntidao'),
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
      principal: v.total,
      detalhamento: [
        ...(v.sobreaviso > 0
          ? ([{ rotulo: 'Horas de sobreaviso', valor: v.sobreaviso, sinal: 'credito' }] as const)
          : []),
        ...(v.prontidao > 0
          ? ([{ rotulo: 'Horas de prontidão', valor: v.prontidao, sinal: 'credito' }] as const)
          : []),
      ],
      destaques: [
        { rotulo: 'Valor da hora normal', valor: formatarReal(v.valorHoraNormal) },
        { rotulo: 'Divisor mensal', valor: `${v.divisor}` },
      ],
      notas: [
        'Se você for chamado e trabalhar durante o sobreaviso ou a prontidão, as horas trabalhadas são pagas ' +
          'como horas normais ou extras, e não por esta fração.',
        'O texto da CLT é dos ferroviários. O sobreaviso vale para outras categorias nas condições da Súmula ' +
          '428 do TST; para a prontidão, confira a convenção coletiva da sua categoria.',
      ],
    },
  }
}

export const SOBREAVISO_E_PRONTIDAO: DefinicaoCalculadora = {
  id: 'CALC-091',
  slug: 'sobreaviso-e-prontidao',
  nome: 'Sobreaviso e prontidão',
  linhaDeContexto: 'Quanto valem as horas de plantão à distância e as horas de espera no local de trabalho.',
  descricaoSeo:
    'Calcule as horas de sobreaviso e de prontidão pela fração da hora normal prevista na CLT, com o divisor da sua jornada semanal.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'jornadaSemanal',
      rotulo: 'Jornada semanal',
      tipo: 'selecao',
      padrao: '44',
      opcoes: [
        { valor: '44', rotulo: '44h' },
        { valor: '40', rotulo: '40h' },
        { valor: '36', rotulo: '36h' },
        { valor: '30', rotulo: '30h' },
        { valor: '20', rotulo: '20h' },
      ],
    },
    {
      id: 'horasSobreaviso',
      rotulo: 'Horas de sobreaviso no mês',
      tipo: 'decimal',
      padrao: 0,
      minimo: 0,
      maximo: 74_400,
      ajuda: 'Tempo de plantão fora do local de trabalho, aguardando chamado.',
    },
    {
      id: 'horasProntidao',
      rotulo: 'Horas de prontidão no mês',
      tipo: 'decimal',
      padrao: 0,
      minimo: 0,
      maximo: 74_400,
      ajuda: 'Tempo nas dependências da empresa, aguardando ordens.',
    },
  ],

  parametrosRequeridos: ['sobreaviso-fracao', 'prontidao-fracao'],

  rotuloResultado: 'Sobreaviso e prontidão estimados',

  calcular,

  faq: [
    {
      pergunta: 'Qual a diferença entre sobreaviso e prontidão?',
      resposta:
        'No sobreaviso o empregado fica em casa, ou à distância, aguardando ser chamado a qualquer momento. Na prontidão ele fica nas dependências do empregador, aguardando ordens. Por isso a prontidão vale mais: o art. 244 da CLT conta as horas de sobreaviso a um terço do salário e as de prontidão a dois terços do salário-hora.',
    },
    {
      pergunta: 'Ter celular da empresa já dá direito a sobreaviso?',
      resposta:
        'Não. A Súmula 428 do TST diz que o uso de celular ou outro instrumento fornecido pela empresa, por si só, não caracteriza sobreaviso. É preciso estar à distância, submetido a controle do empregador por esses meios, em plantão ou escala equivalente, aguardando chamado durante o descanso.',
    },
    {
      pergunta: 'Existe limite de horas por escala?',
      resposta:
        'Existe. Pelo art. 244 da CLT, cada escala de sobreaviso tem no máximo vinte e quatro horas e a de prontidão, no máximo doze. A calculadora recebe o total do mês e não verifica escala por escala — confira isso no seu controle de jornada.',
    },
    {
      pergunta: 'E se eu for chamado durante o sobreaviso?',
      resposta:
        'O tempo de trabalho efetivo deixa de ser sobreaviso e passa a ser hora trabalhada, paga como hora normal ou como hora extra, conforme a jornada do dia. Informe aqui só as horas de espera.',
    },
    {
      pergunta: 'Como é calculado o valor da hora?',
      resposta:
        'O salário mensal é dividido pelo número de horas do mês: a jornada semanal vezes cinco, que dá o divisor 220 para 44 horas e 200 para 40 horas, este confirmado pela Súmula 431 do TST. A fração do sobreaviso ou da prontidão é aplicada sobre esse valor, sem arredondar a hora no caminho.',
    },
  ],

  relacionadas: ['horas-extras', 'adicional-noturno', 'banco-de-horas'],
}
