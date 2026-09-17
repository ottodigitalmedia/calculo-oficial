/**
 * CALC-077 — Adicional noturno.
 *
 * Lote 1 da expansão do catálogo. CALC-006 já calcula o adicional noturno junto
 * das horas extras; esta calculadora existe pelo que aquela não cobre — o
 * trabalho RURAL, com percentual e horário próprios e sem hora reduzida — e
 * porque "calcular adicional noturno" é uma pergunta que chega sozinha.
 *
 * Motor e regras em `engine/calculadoras/adicionais.ts`.
 */

import { calcularAdicionalNoturno, type RegimeNoturno } from '../engine/calculadoras/adicionais'
import { centavos } from '../engine/types'
import { formatarNumero, formatarReal } from '../format/moeda'
import { ADICIONAIS } from '../params/data/adicionais'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Registro montado no módulo adiado — ver a nota em `salario-liquido.ts`. */
const registro = construirRegistro(TRABALHISTA, ADICIONAIS)

function regime(valor: string): RegimeNoturno {
  return valor === 'lavoura' || valor === 'pecuaria' ? valor : 'urbano'
}

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const refletirDSR = texto(valores, 'refletirDSR') !== 'nao'
  const r = calcularAdicionalNoturno(
    {
      salario: centavos(numero(valores, 'salario')),
      jornadaSemanal: Number(texto(valores, 'jornadaSemanal') || '44'),
      regime: regime(texto(valores, 'regime')),
      horasNoturnasCentesimos: numero(valores, 'horasNoturnas'),
      refletirDSR,
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
        { rotulo: 'Adicional noturno', valor: v.adicional, sinal: 'credito' },
        ...(v.reflexoDsr > 0
          ? ([{ rotulo: 'Reflexo no descanso semanal', valor: v.reflexoDsr, sinal: 'credito' }] as const)
          : []),
        { rotulo: 'Total do adicional', valor: v.total, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Valor da hora normal', valor: formatarReal(v.valorHoraNormal) },
        { rotulo: 'Adicional por hora', valor: formatarReal(v.adicionalPorHora) },
        {
          rotulo: v.horaReduzida ? 'Horas noturnas computadas' : 'Horas noturnas (sem redução)',
          valor: `${formatarNumero(v.horasComputadasCentesimos)}h`,
        },
      ],
      notas: [
        'O valor é bruto: o adicional integra o salário do mês e sofre INSS e imposto de renda junto com ' +
          'ele. Use a calculadora de salário líquido para ver o desconto.',
      ],
    },
  }
}

export const ADICIONAL_NOTURNO: DefinicaoCalculadora = {
  id: 'CALC-077',
  slug: 'adicional-noturno',
  nome: 'Adicional noturno',
  linhaDeContexto: 'Quanto vale o trabalho à noite, na cidade ou no campo, com a hora noturna de cada regra.',
  descricaoSeo:
    'Calcule o adicional noturno urbano, com a hora reduzida de 52min30s, e o rural, da lavoura e da pecuária. Veja a norma de cada etapa.',

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
      id: 'regime',
      rotulo: 'Onde o trabalho é feito',
      tipo: 'selecao',
      padrao: 'urbano',
      opcoes: [
        { valor: 'urbano', rotulo: 'Cidade (urbano)' },
        { valor: 'lavoura', rotulo: 'Lavoura' },
        { valor: 'pecuaria', rotulo: 'Pecuária' },
      ],
      ajuda: 'Na cidade, das 22h às 5h. Na lavoura, das 21h às 5h. Na pecuária, das 20h às 4h.',
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
      ajuda: 'Define o valor da hora normal: o salário dividido pela jornada semanal vezes 5.',
    },
    {
      id: 'horasNoturnas',
      rotulo: 'Horas trabalhadas à noite no mês',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 30_000,
      ajuda: 'Horas de relógio dentro do horário noturno. A conversão para hora noturna é feita no cálculo.',
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
      ajuda: 'Devido quando o trabalho noturno é habitual.',
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
      rotulo: 'Domingos e feriados no mês',
      tipo: 'inteiro',
      padrao: 5,
      minimo: 1,
      maximo: 10,
      visivelSe: { campo: 'refletirDSR', em: ['sim'] },
    },
  ],

  parametrosRequeridos: ['adicional-noturno', 'hora-noturna-segundos', 'adicional-noturno-rural'],

  rotuloResultado: 'Adicional noturno estimado',

  calcular,

  faq: [
    {
      pergunta: 'Por que 7 horas de trabalho à noite viram 8 no cálculo?',
      resposta:
        'No trabalho urbano, o art. 73, § 1º, da CLT manda computar a hora noturna como 52 minutos e 30 segundos. Sete horas de relógio entre 22h e 5h equivalem a oito horas noturnas, e o adicional é pago sobre as oito. A memória de cálculo mostra a conversão.',
    },
    {
      pergunta: 'O trabalhador rural também tem a hora reduzida?',
      resposta:
        'Não. A Lei nº 5.889/1973 define o horário noturno rural e um percentual próprio, maior que o urbano, mas não reduz a hora — a hora de 52 minutos e 30 segundos é regra da CLT para o trabalho urbano. Por isso a calculadora não converte as horas quando você escolhe lavoura ou pecuária.',
    },
    {
      pergunta: 'Se eu continuar trabalhando depois das 5h, ainda recebo o adicional?',
      resposta:
        'Segundo a Súmula 60, II, do TST, quem cumpre a jornada inteira no período noturno e a prorroga tem o adicional também sobre as horas prorrogadas. Nesse caso, inclua essas horas no campo de horas trabalhadas à noite.',
    },
    {
      pergunta: 'O adicional noturno reflete no descanso semanal?',
      resposta:
        'Quando é pago com habitualidade, sim: a Súmula 60, I, do TST diz que ele integra o salário para todos os efeitos, e o repouso semanal é calculado sobre o salário. O reflexo divide o adicional pelos dias úteis e multiplica pelos domingos e feriados do mês.',
    },
    {
      pergunta: 'Esse valor já vem com desconto de INSS e imposto?',
      resposta:
        'Não. O resultado é bruto. O adicional soma ao salário do mês e sofre os descontos junto com ele, pela tabela progressiva — descontá-lo isoladamente daria um valor errado. Some o adicional ao salário e use a calculadora de salário líquido.',
    },
  ],

  relacionadas: ['horas-extras', 'salario-liquido', 'dsr-sobre-comissoes'],
}
