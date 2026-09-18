/**
 * CALC-109 — Valor da aposentadoria (EC nº 103/2019, art. 26).
 *
 * As regras de acesso (CALC-103 a CALC-108) respondem QUANDO. Esta responde
 * QUANTO: o percentual da média que o benefício paga, e os limites que o
 * cercam. A média entra como campo — ela está no extrato do CNIS e o produto
 * não a inventa.
 *
 * Motor em `engine/calculadoras/beneficios-inss.ts`.
 */

import { calcularValorDaAposentadoria, type HipoteseDoValor } from '../engine/calculadoras/beneficios-inss'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import { centavos } from '../engine/types'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS, INSS)

const HIPOTESES: readonly HipoteseDoValor[] = ['programada', 'pedagio-100', 'incapacidade-comum', 'incapacidade-acidentaria']

function hipoteseDe(valor: string): HipoteseDoValor {
  return HIPOTESES.find((h) => h === valor) ?? 'programada'
}

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularValorDaAposentadoria(
    {
      media: centavos(numero(valores, 'media')),
      sexo: texto(valores, 'sexo') === 'homem' ? 'homem' : 'mulher',
      anosDeContribuicao: numero(valores, 'anos'),
      hipotese: hipoteseDe(texto(valores, 'hipotese')),
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
      principal: v.valorDoBeneficio,
      detalhamento: [
        { rotulo: 'Média considerada', valor: v.mediaConsiderada, sinal: 'neutro' },
        { rotulo: 'Aposentadoria mensal estimada', valor: v.valorDoBeneficio, sinal: 'credito' },
      ],
      destaques: [
        { rotulo: 'Percentual da média', valor: formatarPercentual(v.coeficiente) },
        ...(v.anosComAcrescimo > 0 ? [{ rotulo: 'Anos que acrescentaram', valor: `${v.anosComAcrescimo}` }] : []),
        ...(v.aplicouTetoNaMedia ? [{ rotulo: 'Média limitada ao teto', valor: 'Sim' }] : []),
        ...(v.aplicouPiso ? [{ rotulo: 'Elevado ao salário mínimo', valor: formatarReal(v.salarioMinimo) }] : []),
        ...(v.aplicouTeto ? [{ rotulo: 'Limitado ao teto', valor: formatarReal(v.teto) }] : []),
      ],
      notas: [
        'A média é a de TODOS os salários de contribuição desde julho de 1994, atualizados — e costuma ser menor ' +
          'que o salário atual. Ela está no extrato do CNIS, no Meu INSS.',
        'Só o ano completo acrescenta: 34 anos e 11 meses contam como 34.',
        'A lei permite excluir da média as contribuições que a reduzem, desde que mantido o tempo mínimo exigido ' +
          '(art. 26, § 6º) — mas o tempo excluído deixa de contar para o acréscimo. Pode compensar, e vale simular.',
        'O pedágio de 50% não está aqui: o valor dele leva o fator previdenciário, que depende da tábua de ' +
          'mortalidade do ano em que o benefício é pedido.',
      ],
    },
  }
}

export const VALOR_DA_APOSENTADORIA: DefinicaoCalculadora = {
  id: 'CALC-109',
  slug: 'valor-da-aposentadoria',
  nome: 'Valor da aposentadoria',
  linhaDeContexto: 'Quanto a aposentadoria paga depois da reforma: o percentual da média e os limites do INSS.',
  descricaoSeo:
    'Calcule o valor da aposentadoria pela reforma da Previdência: 60% da média mais 2% por ano de contribuição, com o piso do salário mínimo e o teto do INSS.',

  campos: [
    {
      id: 'media',
      rotulo: 'Média dos salários de contribuição',
      tipo: 'monetario',
      obrigatorio: true,
      padrao: 400_000,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Todos os salários de contribuição desde julho de 1994, atualizados. Está no extrato do CNIS.',
    },
    {
      id: 'sexo',
      rotulo: 'Sexo',
      tipo: 'selecao',
      padrao: 'mulher',
      opcoes: [
        { valor: 'mulher', rotulo: 'Mulher' },
        { valor: 'homem', rotulo: 'Homem' },
      ],
      ajuda: 'O acréscimo começa a contar em anos diferentes para cada caso.',
    },
    {
      id: 'anos',
      rotulo: 'Anos completos de contribuição',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 30,
      minimo: 0,
      maximo: 70,
    },
    {
      id: 'hipotese',
      rotulo: 'Por qual regra',
      tipo: 'selecao',
      padrao: 'programada',
      opcoes: [
        { valor: 'programada', rotulo: 'Pontos, idade progressiva, idade ou professor' },
        { valor: 'pedagio-100', rotulo: 'Pedágio de 100%' },
        { valor: 'incapacidade-comum', rotulo: 'Incapacidade permanente — doença ou acidente comum' },
        { valor: 'incapacidade-acidentaria', rotulo: 'Incapacidade permanente — acidente ou doença do trabalho' },
      ],
    },
  ],

  parametrosRequeridos: ['aposentadoria-valor-coeficiente-base', 'salario-minimo', 'inss-tabela-progressiva'],

  rotuloResultado: 'Aposentadoria mensal estimada',

  calcular,

  faq: [
    {
      pergunta: 'Como é calculado o valor da aposentadoria depois da reforma?',
      resposta:
        'Pelo art. 26 da Emenda Constitucional nº 103/2019: 60% da média de todos os salários de contribuição desde julho de 1994, mais 2 pontos percentuais por ano completo de contribuição acima de 20 anos, para o homem, ou de 15 anos, para a mulher.',
    },
    {
      pergunta: 'Quantos anos preciso para receber 100% da média?',
      resposta:
        'Quarenta anos de contribuição para o homem e trinta e cinco para a mulher. Acima disso o percentual continua subindo — não há limite de cem por cento no coeficiente —, mas o benefício nunca passa do teto do INSS.',
    },
    {
      pergunta: 'Em que casos a aposentadoria é de 100% da média?',
      resposta:
        'No pedágio de 100% e na aposentadoria por incapacidade permanente decorrente de acidente de trabalho, doença profissional ou doença do trabalho (art. 26, § 3º). Nesses casos o tempo de contribuição não altera o percentual.',
    },
    {
      pergunta: 'Existe valor mínimo e máximo?',
      resposta:
        'Sim. Nenhuma aposentadoria fica abaixo do salário mínimo, e nenhuma passa do teto do salário de contribuição (Lei nº 8.213/1991, art. 33). A própria média também é limitada ao teto antes do cálculo.',
    },
    {
      pergunta: 'Por que o pedágio de 50% não está na calculadora?',
      resposta:
        'Porque o valor dele é a média multiplicada pelo fator previdenciário (art. 17, parágrafo único), que depende da idade, do tempo e da expectativa de sobrevida da tábua do IBGE do ano do pedido. É outra conta, com outro dado.',
    },
  ],

  relacionadas: ['regras-de-aposentadoria', 'aposentadoria-por-pontos', 'pensao-por-morte', 'auxilio-acidente'],
}
