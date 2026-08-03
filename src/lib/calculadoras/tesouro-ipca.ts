/**
 * CALC-045 — Tesouro IPCA+: rendimento real projetado.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O que ela existe para mostrar cabe em uma frase:** o imposto incide sobre o
 * rendimento nominal, inclusive sobre a parte que apenas repôs a inflação. Quem
 * olha "IPCA + 6%" e imagina 6% de ganho real depois do imposto erra — e erra
 * mais quanto maior a inflação e menor o prazo.
 *
 * O resultado separa as duas parcelas do rendimento e mostra o que sobra em
 * poder de compra de hoje, que é a única leitura que responde à pergunta real.
 */

import { calcularIpcaMais } from '../engine/calculadoras/projecao'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { acumuladoDosUltimos, ultimoMesDoIndice } from './indices-comuns'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

const MESES_DE_REFERENCIA = 12

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const valorInvestido = centavos(numero(valores, 'valorInvestido'))

  const r = calcularIpcaMais(
    {
      valorInvestido,
      taxaRealAnualBp: basisPoints(numero(valores, 'taxaReal')),
      inflacaoAnualBp: basisPoints(numero(valores, 'inflacaoAnual')),
      anos: numero(valores, 'anos'),
      aliquotaIrBp: basisPoints(numero(valores, 'aliquotaIr')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores
  const acumulado = acumuladoDosUltimos('ipca', MESES_DE_REFERENCIA)
  const ultimoMes = ultimoMesDoIndice('ipca')

  /** As linhas somam o valor bruto no vencimento. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Valor investido', valor: valorInvestido, sinal: 'neutro' },
    { rotulo: 'Correção da inflação', valor: v.parteQueReposInflacao, sinal: 'credito' },
    { rotulo: 'Ganho acima da inflação', valor: v.parteDeGanhoReal, sinal: 'credito' },
    { rotulo: 'Valor bruto no vencimento', valor: v.valorBrutoNoVencimento, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Taxa nominal ao ano', valor: formatarPercentual(v.taxaNominalAnualBp) },
    { rotulo: 'Valor líquido no vencimento', valor: formatarReal(v.valorLiquido) },
    { rotulo: 'Em poder de compra de hoje', valor: formatarReal(v.liquidoEmMoedaDeHoje) },
    { rotulo: 'Ganho real líquido ao ano', valor: formatarPercentual(v.ganhoRealLiquidoBp) },
  ]

  if (acumulado !== null && ultimoMes !== null) {
    destaques.push({
      rotulo: `IPCA nos últimos 12 meses, até ${ultimoMes}`,
      valor: formatarPercentual(acumulado),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.liquidoEmMoedaDeHoje,
      detalhamento: linhas,
      destaques,
      notas: [
        'O imposto incide sobre o rendimento NOMINAL, e não sobre o ganho real. Isso significa ' +
          'que ele morde também a parte que apenas repôs a inflação — dinheiro que não é ganho, ' +
          'e sim manutenção do poder de compra. É por isso que o ganho real líquido sai abaixo ' +
          'da taxa contratada.',
        'A inflação usada é a que você projetou. Ninguém sabe a inflação futura, e o acumulado ' +
          'dos últimos doze meses aparece ao lado apenas como referência para a escolha.',
        'A conta supõe o título levado até o VENCIMENTO. Vendendo antes, o preço oscila com as ' +
          'taxas de mercado, e o resultado pode ser bem diferente — inclusive negativo em ' +
          'termos reais.',
        'Taxa de custódia da bolsa e eventuais taxas da corretora não entram. Elas reduzem o ' +
          'resultado, e em prazos longos a diferença não é desprezível.',
      ],
    },
  }
}

export const TESOURO_IPCA: DefinicaoCalculadora = {
  id: 'CALC-045',
  slug: 'tesouro-ipca-mais',
  nome: 'Tesouro IPCA+ — ganho real',
  linhaDeContexto: 'Quanto sobra de ganho real depois do imposto — que morde a correção também.',
  descricaoSeo:
    'Projete o rendimento de um título atrelado à inflação e veja quanto sobra em poder de compra de hoje, com o imposto incidindo sobre o rendimento nominal.',

  campos: [
    {
      id: 'valorInvestido',
      rotulo: 'Valor investido',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'taxaReal',
      rotulo: 'Taxa real contratada ao ano',
      tipo: 'percentual',
      obrigatorio: true,
      padrao: 600,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'O "mais" do título: em "IPCA + 6%", são os 6%.',
    },
    {
      id: 'inflacaoAnual',
      rotulo: 'Inflação anual projetada',
      tipo: 'percentual',
      obrigatorio: true,
      padrao: 450,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'É a sua premissa. O acumulado recente do IPCA aparece no resultado, como referência.',
    },
    {
      id: 'anos',
      rotulo: 'Prazo em anos',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 10,
      minimo: 1,
      maximo: 40,
    },
    {
      id: 'aliquotaIr',
      rotulo: 'Alíquota de imposto no resgate',
      tipo: 'percentual',
      padrao: 1_500,
      minimo: 0,
      maximo: 9_999,
      ajuda: 'Em renda fixa ela cai com o prazo. A calculadora de IR sobre renda fixa apura qual é a sua.',
    },
  ],

  // Série econômica NÃO é parâmetro legal — `ADR-006`.
  parametrosRequeridos: [],

  rotuloResultado: 'O que isso comprará, em dinheiro de hoje',

  calcular,

  faq: [
    {
      pergunta: 'Por que o ganho real líquido é menor que a taxa contratada?',
      resposta:
        'Porque o imposto incide sobre o rendimento nominal, que inclui a correção da inflação. Parte do que o título pagou não foi ganho: foi apenas a reposição do poder de compra. O imposto não faz essa distinção e cobra sobre o total, então o que sobra de ganho real fica abaixo do "mais" contratado. Quanto maior a inflação no período, maior essa diferença.',
    },
    {
      pergunta: 'Por que a taxa nominal não é a soma da inflação com a taxa real?',
      resposta:
        'Porque as duas se multiplicam, não se somam. Com inflação de 4,5% e taxa real de 6%, a taxa nominal é 10,77% ao ano, e não 10,5%: o juro real também incide sobre o valor já corrigido. A diferença é pequena em um ano e relevante em dez, e a memória de cálculo mostra a multiplicação.',
    },
    {
      pergunta: 'E se eu vender antes do vencimento?',
      resposta:
        'A conta deixa de valer. Títulos atrelados à inflação têm o preço oscilando conforme as taxas de mercado, e vender antes do vencimento pode render bem mais ou bem menos que o contratado — inclusive prejuízo em termos reais. O resultado aqui pressupõe o título carregado até o fim, que é a única hipótese em que a taxa contratada se realiza.',
    },
    {
      pergunta: 'A inflação projetada muda muito o resultado?',
      resposta:
        'Muda o resultado nominal bastante e o resultado real pouco — e essa é justamente a característica do título. Como ele corrige pela inflação, o poder de compra final é protegido; o que a inflação alta faz é aumentar a mordida do imposto, porque a base tributável cresce. Rode com duas inflações diferentes e compare a última linha: é ali que a diferença aparece.',
    },
    {
      pergunta: 'As taxas de custódia estão na conta?',
      resposta:
        'Não. A taxa de custódia da bolsa e eventuais taxas da corretora reduzem o resultado e não entram aqui, porque variam por instituição e por faixa de valor. Em prazos longos elas não são desprezíveis — vale somá-las por fora ao comparar com outra aplicação.',
    },
  ],

  relacionadas: ['ir-renda-fixa', 'poder-de-compra', 'quanto-rende-por-mes'],
}
