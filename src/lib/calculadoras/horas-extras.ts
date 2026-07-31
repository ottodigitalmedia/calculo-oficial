/**
 * CALC-006 — Horas extras.
 *
 * Campos e microcopy de `03-functional-spec` §3.6, usados literalmente.
 *
 * **A única do v1 com aritmética de tempo.** A hora noturna dura 52 minutos e
 * 30 segundos, e a conversão está no motor — quem multiplica horas de relógio
 * direto pelo adicional perde 1/8 do valor.
 *
 * Regras: `RN-024` a `RN-026`.
 */

import { calcularHorasExtras } from '../engine/calculadoras/jornada-e-fgts'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Registro montado no módulo adiado — ver a nota em `salario-liquido.ts`. */
const registro = construirRegistro(TRABALHISTA)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularHorasExtras(
    {
      salario: centavos(numero(valores, 'salario')),
      jornadaSemanal: Number(texto(valores, 'jornadaSemanal') || '44'),
      horasExtras50: numero(valores, 'horasExtras50'),
      horasExtras100: numero(valores, 'horasExtras100'),
      horasNoturnas: numero(valores, 'horasNoturnas'),
      refletirDSR: texto(valores, 'refletirDSR') !== 'nao',
      diasUteis: numero(valores, 'diasUteis'),
      diasDescanso: numero(valores, 'diasDescanso'),
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
        ...(v.extras50 > 0
          ? ([{ rotulo: 'Horas extras a 50%', valor: v.extras50, sinal: 'credito' }] as const)
          : []),
        ...(v.extras100 > 0
          ? ([{ rotulo: 'Horas extras a 100%', valor: v.extras100, sinal: 'credito' }] as const)
          : []),
        ...(v.adicionalNoturno > 0
          ? ([{ rotulo: 'Adicional noturno', valor: v.adicionalNoturno, sinal: 'credito' }] as const)
          : []),
        ...(v.reflexoDsr > 0
          ? ([
              { rotulo: 'Reflexo no descanso semanal', valor: v.reflexoDsr, sinal: 'credito' },
            ] as const)
          : []),
        { rotulo: 'Total das horas', valor: v.total, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Valor da hora normal', valor: formatarReal(v.valorHoraNormal) },
        { rotulo: 'Divisor aplicado', valor: String(v.divisor) },
        ...(v.horasNoturnasComputadas > 0
          ? [{ rotulo: 'Horas noturnas computadas', valor: `${v.horasNoturnasComputadas}h` }]
          : []),
      ],
      notas: [
        'Este valor é bruto: as horas extras integram o salário do mês e sofrem INSS e Imposto ' +
          'de Renda junto com ele. Use a calculadora de salário líquido para ver o desconto.',
      ],
    },
  }
}

export const HORAS_EXTRAS: DefinicaoCalculadora = {
  id: 'CALC-006',
  slug: 'horas-extras',
  nome: 'Horas extras',
  linhaDeContexto:
    'Quanto valem suas horas extras, o adicional noturno e o reflexo no descanso semanal.',
  descricaoSeo:
    'Calcule horas extras a 50% e 100%, adicional noturno com a hora reduzida de 52min30s e o reflexo no DSR. Veja o divisor aplicado e a norma de cada etapa.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário bruto mensal',
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
      ajuda: 'O divisor mensal é a jornada × 5 — 220 para 44h, 200 para 40h.',
    },
    {
      id: 'horasExtras50',
      rotulo: 'Horas extras a 50%',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 200,
    },
    {
      id: 'horasExtras100',
      rotulo: 'Horas extras a 100%',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 200,
    },
    {
      id: 'horasNoturnas',
      rotulo: 'Horas noturnas',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 200,
      ajuda: 'Horas de relógio trabalhadas entre 22h e 5h.',
    },
    {
      id: 'refletirDSR',
      rotulo: 'Calcular reflexo no DSR?',
      tipo: 'selecao',
      padrao: 'sim',
      opcoes: [
        { valor: 'sim', rotulo: 'Sim' },
        { valor: 'nao', rotulo: 'Não' },
      ],
      ajuda: 'Devido quando as horas extras são habituais.',
    },
    {
      id: 'diasUteis',
      rotulo: 'Dias úteis no mês',
      tipo: 'inteiro',
      padrao: 25,
      minimo: 1,
      maximo: 27,
      visivelSe: { campo: 'refletirDSR', em: ['sim'] },
    },
    {
      id: 'diasDescanso',
      rotulo: 'Dias de descanso no mês',
      tipo: 'inteiro',
      padrao: 5,
      minimo: 1,
      maximo: 10,
      visivelSe: { campo: 'refletirDSR', em: ['sim'] },
    },
  ],

  parametrosRequeridos: [
    'hora-extra-adicional-minimo',
    'adicional-noturno',
    'hora-noturna-segundos',
  ],

  rotuloResultado: 'Total a receber pelas horas',

  calcular,

  faq: [
    {
      pergunta: 'Por que 7 horas noturnas viram 8 no cálculo?',
      resposta:
        'Porque a hora noturna é mais curta. O art. 73, § 1º, da CLT manda computá-la como 52 minutos e 30 segundos, e não como 60. Sete horas de relógio entre 22h e 5h equivalem a oito horas noturnas — quem multiplica as horas de relógio direto pelo adicional perde um oitavo do valor. A memória de cálculo mostra a conversão.',
    },
    {
      pergunta: 'De onde vem o divisor 220?',
      resposta:
        'Do art. 64 da CLT, que manda dividir o salário mensal por 30 vezes as horas diárias. Com a semana de seis dias, isso equivale à jornada semanal multiplicada por 5: 44 × 5 = 220. Para 40 horas dá 200, exatamente o divisor fixado pela Súmula 431 do TST — a coincidência com a súmula é a conferência do método.',
    },
    {
      pergunta: 'O que é o reflexo no DSR?',
      resposta:
        'A Lei nº 605/1949, art. 7º, manda computar as horas extraordinárias habitualmente prestadas na remuneração do repouso semanal, e a Súmula 172 do TST confirma. O cálculo divide o total das horas pelos dias úteis do mês e multiplica pelos dias de descanso. Sem habitualidade não há reflexo, e por isso o campo é opcional.',
    },
    {
      pergunta: 'O adicional de 100% é garantido por lei?',
      resposta:
        'Não. A Constituição garante no mínimo 50% no art. 7º, XVI. Os 100% costumam vir de convenção coletiva ou do trabalho em domingo e feriado não compensado. Informe no campo correspondente apenas o que o seu contrato ou a sua convenção prevê.',
    },
    {
      pergunta: 'Esse valor já vem com desconto de INSS e imposto?',
      resposta:
        'Não. O resultado é bruto. As horas extras integram o salário do mês e sofrem os descontos junto com ele, pela tabela progressiva — por isso não faz sentido descontá-las isoladamente. Some o valor ao salário e use a calculadora de salário líquido.',
    },
  ],

  relacionadas: ['salario-liquido', 'decimo-terceiro', 'inss'],
}
