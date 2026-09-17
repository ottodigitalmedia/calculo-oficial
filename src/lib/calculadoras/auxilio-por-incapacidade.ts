/**
 * CALC-101 — Auxílio por incapacidade temporária.
 *
 * O nome antigo é auxílio-doença, e a pergunta que traz a pessoa aqui é sempre
 * a mesma: "vou receber quanto do meu salário?". A resposta quase nunca é uma
 * fração do salário atual — é uma fração da MÉDIA, e depois passa por dois
 * limites e um piso.
 *
 * Motor em `engine/calculadoras/beneficios-inss.ts`.
 */

import { calcularAuxilioIncapacidade } from '../engine/calculadoras/beneficios-inss'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS, INSS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularAuxilioIncapacidade(
    {
      salarioDeBeneficio: centavos(numero(valores, 'salarioDeBeneficio')),
      mediaDosUltimosDoze: centavos(numero(valores, 'mediaDoze')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Percentual do salário de benefício', valor: formatarPercentual(v.percentual) },
    { rotulo: 'Teto do INSS', valor: formatarReal(v.teto) },
    ...(v.aplicouLimiteDosDoze
      ? [{ rotulo: 'Limitado pela média dos últimos 12', valor: 'Sim' }]
      : []),
    ...(v.aplicouPiso ? [{ rotulo: 'Piso aplicado', valor: formatarReal(v.salarioMinimo) }] : []),
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorDoBeneficio,
      detalhamento: [
        { rotulo: 'Renda mensal calculada', valor: v.valorAntesDosLimites, sinal: 'neutro' },
        { rotulo: 'Benefício mensal estimado', valor: v.valorDoBeneficio, sinal: 'credito' },
      ],
      destaques,
      notas: [
        'O salário de benefício é a média dos seus salários de contribuição desde julho de 1994, atualizados ' +
          'monetariamente — não é o último salário. Ele está no extrato do CNIS, no Meu INSS.',
        'Os primeiros quinze dias de afastamento são pagos pela empresa, no caso do empregado; o benefício ' +
          'começa a partir do décimo sexto dia.',
        'A perícia decide a incapacidade e a data de cessação. Esta estimativa trata do valor, não da concessão.',
      ],
    },
  }
}

export const AUXILIO_POR_INCAPACIDADE: DefinicaoCalculadora = {
  id: 'CALC-101',
  slug: 'auxilio-por-incapacidade',
  nome: 'Auxílio por incapacidade temporária',
  linhaDeContexto: 'Quanto o antigo auxílio-doença paga, com o limite que quase ninguém conhece.',
  descricaoSeo:
    'Calcule o auxílio por incapacidade temporária do INSS: percentual do salário de benefício, limite da média dos últimos doze, teto e piso.',

  campos: [
    {
      id: 'salarioDeBeneficio',
      rotulo: 'Salário de benefício (média das contribuições)',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000,
      ajuda: 'Média dos salários de contribuição desde julho de 1994, atualizados. Está no extrato do CNIS.',
    },
    {
      id: 'mediaDoze',
      rotulo: 'Média dos últimos 12 salários de contribuição',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Deixe zero se não souber — sem esse número, o limite legal não é aplicado e o valor pode sair maior que o real.',
    },
  ],

  parametrosRequeridos: ['auxilio-incapacidade-percentual', 'salario-minimo', 'inss-tabela-progressiva'],

  rotuloResultado: 'Benefício mensal estimado',

  calcular,

  faq: [
    {
      pergunta: 'O auxílio é uma porcentagem do meu salário?',
      resposta:
        'Do salário de benefício, que é a média dos seus salários de contribuição desde julho de 1994, atualizados — e não do salário que você recebe hoje. O art. 61 da Lei nº 8.213/1991 fixa o benefício em 91% dessa média.',
    },
    {
      pergunta: 'Qual é o limite que quase ninguém conhece?',
      resposta:
        'O § 10 do art. 29 da Lei nº 8.213/1991: o benefício não pode exceder a média aritmética simples dos últimos doze salários de contribuição. Quem ganhou mais no passado e menos nos últimos meses costuma ser limitado por essa regra — e é a surpresa mais comum na carta de concessão.',
    },
    {
      pergunta: 'Existe valor mínimo?',
      resposta:
        'Existe: um salário mínimo, pela regra do art. 201, § 2º, da Constituição. E há também o teto do Regime Geral, que é o limite máximo do salário de contribuição publicado a cada ano.',
    },
    {
      pergunta: 'Quem paga os primeiros dias de afastamento?',
      resposta:
        'No caso do empregado, a empresa paga os primeiros quinze dias e o INSS assume a partir do décimo sexto. Para o contribuinte individual, o benefício é devido desde o início da incapacidade, observado o requerimento.',
    },
    {
      pergunta: 'Preciso de carência?',
      resposta:
        'Em regra, doze contribuições mensais — dispensadas nos casos de acidente de qualquer natureza, acidente do trabalho e nas doenças graves listadas em ato do Ministério da Saúde e da Previdência.',
    },
    {
      pergunta: 'O benefício desconta imposto de renda?',
      resposta:
        'O benefício por incapacidade temporária é tributável como rendimento. Já a aposentadoria por invalidez decorrente de doença grave listada em lei tem isenção — são situações diferentes, e a carta de concessão informa qual é a sua.',
    },
  ],

  relacionadas: ['pensao-por-morte', 'salario-maternidade-do-inss', 'inss', 'salario-liquido'],
}
