/**
 * CALC-042 — Quanto rende um valor por mês.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A taxa abre sugerida pela Selic corrente** (`RF-012`), com a data do dado na
 * tela. É sugestão, não parâmetro: o campo continua editável, e `ADR-006`
 * separa as duas coisas com todas as letras.
 *
 * A hipótese da conta é a de quem **retira** o rendimento todo mês, e por isso o
 * capital não cresce. Quem reinveste está na calculadora de juros compostos, e
 * o texto diz isso em vez de deixar o usuário descobrir pela diferença.
 */

import { calcularRendaMensal } from '../engine/calculadoras/renda-mensal'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularRendaMensal(
    {
      capital: centavos(numero(valores, 'capital')),
      taxa: basisPoints(numero(valores, 'taxa')),
      taxaAoAno: texto(valores, 'periodoTaxa') !== 'mes',
      aliquotaIrBp: basisPoints(numero(valores, 'aliquotaIr')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Rendimento bruto no mês', valor: v.rendimentoBrutoMensal, sinal: 'neutro' },
  ]
  if (v.impostoMensal > 0) {
    linhas.push({ rotulo: 'Imposto sobre o rendimento', valor: v.impostoMensal, sinal: 'debito' })
  }
  linhas.push({ rotulo: 'Sobra por mês', valor: v.rendimentoLiquidoMensal, sinal: 'neutro' })

  const destaques: Destaque[] = [
    { rotulo: 'Taxa mensal aplicada', valor: formatarPercentual(v.taxaMensalBp) },
    { rotulo: 'Em doze meses', valor: formatarReal(v.rendimentoLiquidoAnual) },
  ]
  if (v.impostoMensal > 0) {
    destaques.push({
      rotulo: 'Taxa mensal depois do imposto',
      valor: formatarPercentual(v.taxaLiquidaMensalBp),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.rendimentoLiquidoMensal,
      detalhamento: linhas,
      destaques,
      notas: [
        'A conta supõe que você RETIRA o rendimento todo mês, e por isso o capital não cresce. ' +
          'Quem deixa render sobre render tem outro resultado, e bem maior em prazos longos — é ' +
          'a calculadora de juros compostos.',
        'Taxa anual não se divide por doze. O rendimento de cada mês rende nos meses seguintes, ' +
          'então a mensal equivalente é a raiz décima segunda do fator anual, e sai menor que a ' +
          'divisão simples. O valor aplicado aparece no resultado.',
        'A alíquota de imposto é a que você informar. Em renda fixa ela cai conforme o prazo da ' +
          'aplicação, e a calculadora de IR sobre renda fixa apura qual é a sua. Com o campo em ' +
          'branco, o resultado é bruto.',
        'Inflação não entra. Um rendimento nominal de 1% ao mês com inflação de 0,5% deixa bem ' +
          'menos poder de compra do que o número sugere — a calculadora de poder de compra ' +
          'mostra o tamanho disso.',
      ],
    },
  }
}

export const RENDA_MENSAL: DefinicaoCalculadora = {
  id: 'CALC-042',
  slug: 'quanto-rende-por-mes',
  nome: 'Quanto rende por mês',
  linhaDeContexto: 'Quanto um valor investido paga por mês — com o imposto dentro da conta.',
  descricaoSeo:
    'Calcule quanto um valor investido rende por mês a partir da taxa e da alíquota de imposto. A taxa abre sugerida pela Selic corrente, com a data do dado.',

  campos: [
    {
      id: 'capital',
      rotulo: 'Valor investido',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 5_000_000_000,
    },
    {
      id: 'taxa',
      rotulo: 'Taxa de rendimento',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'Abre com a Selic corrente. Troque pela taxa da sua aplicação — um CDB a 100% do CDI rende perto da Selic.',
    },
    {
      id: 'periodoTaxa',
      rotulo: 'Período da taxa',
      tipo: 'selecao',
      padrao: 'ano',
      opcoes: [
        { valor: 'ano', rotulo: 'Ao ano' },
        { valor: 'mes', rotulo: 'Ao mês' },
      ],
    },
    {
      id: 'aliquotaIr',
      rotulo: 'Alíquota de imposto sobre o rendimento',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 9_999,
      ajuda: 'Em renda fixa ela cai com o prazo. Deixe em branco para ver o rendimento bruto.',
    },
  ],

  // Série econômica NÃO é parâmetro legal — `ADR-006`.
  parametrosRequeridos: [],

  /** `RF-012` — a taxa abre sugerida pela Selic, com a data do dado na tela. */
  sugestaoDeSerie: { campo: 'taxa', serie: 'selic-ao-ano' },

  rotuloResultado: 'Quanto sobra por mês',

  calcular,

  faq: [
    {
      pergunta: 'Por que a taxa mensal não é a anual dividida por doze?',
      resposta:
        'Porque o rendimento de cada mês passa a render nos meses seguintes. Uma taxa de 12% ao ano não corresponde a 1% ao mês: doze meses de 1% dão 12,68%, não 12%. A conversão correta é a raiz décima segunda do fator anual, e ela devolve um número menor que a divisão simples. O valor efetivamente aplicado aparece no resultado, para conferência.',
    },
    {
      pergunta: 'Qual alíquota de imposto eu informo?',
      resposta:
        'Depende do produto e do prazo. Em renda fixa tributada, a alíquota cai conforme o tempo de aplicação, e a calculadora de IR sobre renda fixa apura qual é a sua a partir do prazo. Alguns produtos têm tratamento tributário diferente. Se não souber, rode primeiro sem imposto para ver o teto e depois com a alíquota, para ver a diferença.',
    },
    {
      pergunta: 'Esse rendimento é garantido?',
      resposta:
        'Não. A conta aplica a taxa que você informou, e taxa informada não é taxa garantida: aplicações pós-fixadas acompanham um índice que muda, e prefixadas só entregam o combinado se levadas até o vencimento. A sugestão que abre no campo é a Selic do último mês publicado, com a data ao lado — é referência do momento, não projeção.',
    },
    {
      pergunta: 'E se eu deixar o dinheiro render em vez de retirar?',
      resposta:
        'Aí o resultado é bem maior, e a conta é outra. Esta calculadora supõe que você retira o rendimento todo mês, então o capital fica parado e a renda é sempre a mesma. Reinvestindo, o capital cresce e a renda cresce junto — é o que a calculadora de juros compostos mostra, com a evolução ano a ano.',
    },
    {
      pergunta: 'A inflação está considerada?',
      resposta:
        'Não. O número é nominal. Com inflação de 0,5% ao mês, um rendimento de 1% deixa perto de 0,5% de ganho real — metade do que o número sugere. A calculadora de poder de compra mostra quanto a inflação levou de um valor em um período, e vale rodar as duas juntas em prazos longos.',
    },
  ],

  relacionadas: ['juros-compostos', 'ir-renda-fixa', 'independencia-financeira'],
}
