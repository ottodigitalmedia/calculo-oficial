/**
 * CALC-084 — Recesso do estágio.
 *
 * O estagiário não tem férias: tem recesso, com regra própria (Lei nº
 * 11.788/2008, art. 13). A calculadora responde às duas perguntas de quem
 * procura — quantos dias, e quanto vale — e declara as duas lacunas da lei: o
 * arredondamento da fração e a indenização do recesso não gozado.
 *
 * Motor em `engine/calculadoras/aprendizagem.ts`.
 */

import { calcularRecessoEstagio } from '../engine/calculadoras/aprendizagem'
import { centavos } from '../engine/types'
import { formatarNumero, formatarReal } from '../format/moeda'
import { APRENDIZAGEM } from '../params/data/aprendizagem'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(APRENDIZAGEM)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const diasGozadosCentesimos = numero(valores, 'diasGozados')
  const r = calcularRecessoEstagio(
    {
      mesesDeEstagio: numero(valores, 'mesesDeEstagio'),
      bolsa: centavos(numero(valores, 'bolsa')),
      diasGozadosCentesimos,
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
      principal: centavos(v.diasRestantesCentesimos),
      unidade: 'numero',
      detalhamento: [
        { rotulo: 'Dias adquiridos', valor: centavos(v.diasAdquiridosCentesimos), sinal: 'credito' },
        ...(diasGozadosCentesimos > 0
          ? ([{ rotulo: 'Dias já gozados', valor: centavos(diasGozadosCentesimos), sinal: 'debito' }] as const)
          : []),
        { rotulo: 'Dias de recesso a gozar', valor: centavos(v.diasRestantesCentesimos), sinal: 'neutro' },
      ],
      destaques: [
        {
          rotulo: 'Remuneração dos dias a gozar',
          valor: v.remunerado ? formatarReal(v.valor) : 'Não remunerado — estágio sem bolsa',
        },
        { rotulo: 'Dias por mês de estágio', valor: formatarNumero(250) },
      ],
      notas: [
        'A lei não manda pagar em dinheiro o recesso não gozado ao fim do estágio. O que ela garante é o ' +
          'recesso, de preferência durante as férias escolares.',
      ],
    },
  }
}

export const RECESSO_DE_ESTAGIO: DefinicaoCalculadora = {
  id: 'CALC-084',
  slug: 'recesso-de-estagio',
  nome: 'Recesso de estágio',
  linhaDeContexto: 'Quantos dias de recesso o estágio já garantiu, e quanto eles valem quando há bolsa.',
  descricaoSeo:
    'Calcule os dias de recesso do estagiário, proporcionais aos meses de estágio, e o valor do recesso remunerado para quem recebe bolsa.',

  campos: [
    {
      id: 'mesesDeEstagio',
      rotulo: 'Meses de estágio',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 24,
      ajuda: 'Na mesma parte concedente. O estágio dura no máximo dois anos, exceto para pessoa com deficiência.',
    },
    {
      id: 'bolsa',
      rotulo: 'Bolsa mensal',
      tipo: 'monetario',
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Deixe em branco se o estágio não tem bolsa.',
    },
    {
      id: 'diasGozados',
      rotulo: 'Dias de recesso já gozados',
      tipo: 'decimal',
      minimo: 0,
      maximo: 6_000,
    },
  ],

  parametrosRequeridos: ['estagio-recesso-dias'],

  rotuloResultado: 'Dias de recesso a gozar',

  calcular,

  faq: [
    {
      pergunta: 'Estagiário tem férias?',
      resposta:
        'Não tem férias como o empregado CLT, mas tem recesso. O art. 13 da Lei nº 11.788/2008 assegura 30 dias de recesso a cada ano de estágio, a serem gozados de preferência durante as férias escolares. Não há o adicional de um terço das férias.',
    },
    {
      pergunta: 'Quem estagia menos de um ano tem recesso?',
      resposta:
        'Tem, proporcional. O § 2º do art. 13 manda conceder os dias de forma proporcional quando o estágio dura menos de um ano. A conta é 30 dias vezes os meses de estágio, dividido por 12 — dois dias e meio por mês. A lei não diz como arredondar a fração, e por isso a calculadora mostra o valor exato.',
    },
    {
      pergunta: 'O recesso é remunerado?',
      resposta:
        'É remunerado quando o estagiário recebe bolsa ou outra forma de contraprestação, pelo § 1º do art. 13. Em estágio sem bolsa, os dias de recesso existem, mas não há valor a receber por eles.',
    },
    {
      pergunta: 'Se o estágio acabar sem eu tirar o recesso, recebo em dinheiro?',
      resposta:
        'A Lei nº 11.788/2008 não prevê pagamento do recesso não gozado ao fim do estágio, e o termo de compromisso pode tratar do assunto. A calculadora mostra quanto os dias valeriam, mas não afirma que esse valor seja devido.',
    },
    {
      pergunta: 'O estagiário tem 13º, FGTS e INSS?',
      resposta:
        'Não como regra. O estágio não cria vínculo de emprego, e por isso não há 13º, FGTS nem as verbas da CLT. A contribuição ao INSS é facultativa, pelo próprio estagiário, se ele quiser contar o tempo para a aposentadoria.',
    },
  ],

  relacionadas: ['jovem-aprendiz', 'ferias'],
}
