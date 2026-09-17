/**
 * CALC-096 — Imposto em fundos imobiliários.
 *
 * "FII é isento" é a frase que traz a pessoa aqui, e ela é meia verdade: a
 * isenção é dos rendimentos distribuídos, com três condições, e não alcança o
 * ganho na venda das cotas. A página responde as duas perguntas na mesma tela.
 *
 * Motor em `engine/calculadoras/fundos-imobiliarios.ts`.
 */

import { calcularIrFundosImobiliarios } from '../engine/calculadoras/fundos-imobiliarios'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { BOLSA } from '../params/data/bolsa'
import { FUNDOS_IMOBILIARIOS } from '../params/data/fundos-imobiliarios'
import { construirRegistro } from '../params/registry'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

const registro = construirRegistro(FUNDOS_IMOBILIARIOS, BOLSA)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularIrFundosImobiliarios(
    {
      rendimentos: centavos(numero(valores, 'rendimentos')),
      ganhoNaVenda: centavos(numero(valores, 'ganhoNaVenda')),
      perdaNaVenda: centavos(numero(valores, 'perdaNaVenda')),
      prejuizoAcumulado: centavos(numero(valores, 'prejuizoAcumulado')),
      cotasNegociadasEmBolsa: texto(valores, 'emBolsa') !== 'nao',
      cotistasDoFundo: numero(valores, 'cotistas'),
      participacaoBp: basisPoints(numero(valores, 'participacao')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const detalhamento: LinhaDetalhamento[] = [
    ...(v.impostoRendimentos > 0
      ? ([{ rotulo: 'Imposto retido nos rendimentos', valor: v.impostoRendimentos, sinal: 'debito' }] as const)
      : []),
    ...(v.impostoGanho > 0
      ? ([{ rotulo: 'Imposto sobre o ganho na venda', valor: v.impostoGanho, sinal: 'debito' }] as const)
      : []),
    { rotulo: 'DARF do mês', valor: v.darf, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    {
      rotulo: 'Rendimentos distribuídos',
      valor: v.rendimentosIsentos ? 'Isentos' : 'Tributados na fonte',
    },
    { rotulo: 'Mínimo de cotistas para a isenção', valor: `${v.minimoDeCotistas}` },
    { rotulo: 'Limite de participação do cotista', valor: formatarPercentual(v.limiteParticipacao) },
    ...(v.prejuizoAProximoMes > 0
      ? [{ rotulo: 'Prejuízo a transportar', valor: formatarReal(v.prejuizoAProximoMes) }]
      : []),
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.impostoTotal,
      detalhamento,
      destaques,
      notas: [
        'A isenção alcança os rendimentos distribuídos — os "dividendos" do fundo. O ganho na venda de cotas ' +
          'é tributado sempre, e a isenção mensal de vendas das ações não vale aqui.',
        'O imposto do ganho é apurado por você e pago por DARF até o último dia útil do mês seguinte. O dos ' +
          'rendimentos, quando devido, é retido pelo administrador do fundo.',
        'Esta estimativa compensa prejuízo apenas contra ganhos em cotas de fundo imobiliário. Se você pretende ' +
          'usar prejuízo de outra espécie de operação, confirme a regra aplicável antes de considerar o valor.',
        ...(v.acumulaParaOProximoMes
          ? [
              'O imposto do ganho ficou abaixo do mínimo do DARF: continua devido e se acumula para os meses ' +
                'seguintes, no mesmo código de receita.',
            ]
          : []),
      ],
    },
  }
}

export const IR_EM_FUNDOS_IMOBILIARIOS: DefinicaoCalculadora = {
  id: 'CALC-096',
  slug: 'ir-em-fundos-imobiliarios',
  nome: 'Imposto em fundos imobiliários',
  linhaDeContexto: 'Quando o rendimento é mesmo isento, e quanto o ganho na venda de cotas paga.',
  descricaoSeo:
    'Calcule o imposto do mês em fundos imobiliários: isenção dos rendimentos e suas condições, imposto sobre o ganho na venda de cotas e o DARF.',

  campos: [
    {
      id: 'rendimentos',
      rotulo: 'Rendimentos recebidos no mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'O valor distribuído pelo fundo e creditado na sua conta.',
    },
    {
      id: 'emBolsa',
      rotulo: 'As cotas são negociadas em bolsa ou balcão organizado?',
      tipo: 'selecao',
      padrao: 'sim',
      opcoes: [
        { valor: 'sim', rotulo: 'Sim' },
        { valor: 'nao', rotulo: 'Não, ou não sei' },
      ],
      ajuda: 'É a primeira condição da isenção dos rendimentos.',
    },
    {
      id: 'cotistas',
      rotulo: 'Número de cotistas do fundo',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Consta do informe de rendimentos e dos relatórios do fundo. Deixe zero se não souber — sem o número, a calculadora não aplica a isenção.',
    },
    {
      id: 'participacao',
      rotulo: 'Sua participação no fundo',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Percentual das cotas, ou dos rendimentos, que cabe a você. Para quem investe pouco, zero.',
    },
    {
      id: 'ganhoNaVenda',
      rotulo: 'Ganho na venda de cotas no mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Diferença positiva entre o que recebeu na venda e o custo das cotas, já descontados os custos.',
    },
    {
      id: 'perdaNaVenda',
      rotulo: 'Prejuízo na venda de cotas no mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
    },
    {
      id: 'prejuizoAcumulado',
      rotulo: 'Prejuízo acumulado de meses anteriores',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Em operações com cotas de fundo imobiliário, informado no demonstrativo de renda variável.',
    },
  ],

  parametrosRequeridos: [
    'fii-aliquota-rendimentos',
    'fii-aliquota-ganho',
    'fii-isencao-minimo-cotistas',
    'fii-isencao-participacao-maxima',
    'darf-valor-minimo',
  ],

  rotuloResultado: 'Imposto estimado do mês',

  calcular,

  faq: [
    {
      pergunta: 'Fundo imobiliário é isento de imposto de renda?',
      resposta:
        'Os rendimentos distribuídos são isentos para a pessoa física, mas só quando três condições estão presentes: as cotas são negociadas exclusivamente em bolsa ou balcão organizado, o fundo tem o número mínimo de cotistas exigido pela lei e o investidor está abaixo do limite de participação. É o que diz o art. 3º, III e § 1º, da Lei nº 11.033/2004.',
    },
    {
      pergunta: 'O ganho na venda das cotas também é isento?',
      resposta:
        'Não. O art. 18 da Lei nº 8.668/1993 tributa o ganho na alienação ou no resgate de cotas, e a isenção mensal que existe para ações — vendas até certo valor no mês — é do mercado à vista de ações e não alcança fundos imobiliários. Qualquer ganho é tributado, mesmo que você tenha vendido pouco.',
    },
    {
      pergunta: 'O que mudou nas condições da isenção?',
      resposta:
        'A Lei nº 14.754/2023 elevou o número mínimo de cotistas do fundo e acrescentou uma regra para o conjunto de pessoas físicas ligadas, com efeitos a partir de 2024. Uma medida provisória de 2024 chegou a exigir um número ainda maior e teve a vigência encerrada — vale a redação da lei. Por isso esta calculadora cobre de 2024 em diante.',
    },
    {
      pergunta: 'Quem paga o imposto?',
      resposta:
        'São dois caminhos. Nos rendimentos, quando não há isenção, a retenção é feita pelo administrador do fundo e a tributação é exclusiva. No ganho da venda, quem apura e paga é o investidor, por DARF, até o último dia útil do mês seguinte — como na renda variável em geral.',
    },
    {
      pergunta: 'Dá para compensar prejuízo?',
      resposta:
        'O prejuízo apurado na venda de cotas compensa ganhos futuros do mesmo tipo de operação, e precisa ter sido informado no demonstrativo de renda variável do mês em que ocorreu. Esta calculadora trabalha com essa compensação — a mesma espécie de operação —, e não mistura com resultados de ações.',
    },
    {
      pergunta: 'E o Fiagro, segue as mesmas regras?',
      resposta:
        'A lei trata os dois juntos: o inciso da isenção e as condições do § 1º mencionam expressamente os Fundos de Investimento nas Cadeias Produtivas Agroindustriais ao lado dos fundos imobiliários. As condições e o limite de participação são os mesmos.',
    },
  ],

  relacionadas: ['ir-em-bolsa-de-valores', 'ir-renda-fixa', 'rentabilidade-de-aluguel', 'dividend-yield'],
}
