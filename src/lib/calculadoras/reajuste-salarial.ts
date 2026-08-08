/**
 * CALC-063 — Reajuste de salário por inflação acumulada.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O que ela responde não é "quanto eu deveria ganhar".** Reajuste salarial se
 * negocia, e a lei não obriga a repor inflação fora do que a norma coletiva
 * estabelecer — afirmar o contrário seria a linguagem prescritiva que `RN-028`
 * proíbe. O que a conta entrega é uma medida: **quanto o salário precisaria ser
 * para ter o mesmo poder de compra**, e como o reajuste oferecido se posiciona
 * em relação a isso.
 *
 * O campo do reajuste oferecido é o que a torna útil na hora da conversa: com
 * ele, a tela mostra ganho ou perda real em reais e em percentual.
 */

import { corrigirPorIndice } from '../engine/calculadoras/indices'
import { aplicarAliquota, subtrair } from '../engine/money'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { indiceEscolhido, mesDe, OPCOES_DE_INDICE, serieDoIndice } from './indices-comuns'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const chave = texto(valores, 'indice')
  const salarioAtual = centavos(numero(valores, 'salario'))
  const reajusteOferecidoBp = basisPoints(numero(valores, 'reajusteOferecido'))

  const r = corrigirPorIndice(
    {
      valorOriginal: salarioAtual,
      de: mesDe(texto(valores, 'de')),
      ate: mesDe(texto(valores, 'ate')),
      serie: serieDoIndice(chave),
      nomeDoIndice: indiceEscolhido(chave).nome,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /**
   * O salário com o reajuste que está na mesa, e a distância dele para a
   * reposição integral.
   *
   * A comparação é feita em REAIS antes de virar percentual: comparar os dois
   * percentuais direto — "ofereceram 4%, a inflação foi 5%" — sugere uma perda
   * de 1% que não é a real, porque os dois incidem sobre a mesma base mas o
   * resultado se lê sobre o salário novo.
   */
  const salarioComOferta =
    reajusteOferecidoBp > 0
      ? centavos(salarioAtual + aplicarAliquota(salarioAtual, reajusteOferecidoBp, 'meio_para_cima'))
      : salarioAtual
  const diferenca = subtrair(salarioComOferta, v.valorCorrigido)

  const destaques: Destaque[] = [
    { rotulo: 'Inflação acumulada', valor: formatarPercentual(v.variacaoBp) },
    { rotulo: 'Meses no período', valor: `${v.mesesAplicados}` },
  ]

  if (reajusteOferecidoBp > 0) {
    destaques.push(
      { rotulo: 'Salário com o reajuste oferecido', valor: formatarReal(salarioComOferta) },
      {
        rotulo: diferenca >= 0 ? 'Ganho real sobre a inflação' : 'Perda real para a inflação',
        valor: formatarReal(Math.abs(diferenca)),
      },
    )
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorCorrigido,
      detalhamento: [
        { rotulo: 'Salário no início do período', valor: salarioAtual, sinal: 'neutro' },
        { rotulo: 'Reposição da inflação', valor: v.correcao, sinal: 'credito' },
        { rotulo: 'Salário com poder de compra mantido', valor: v.valorCorrigido, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        'Este NÃO é o salário a que alguém tem direito. Reajuste se negocia, e o que obriga é a ' +
          'norma coletiva da categoria, quando ela existe e no que ela estabelecer. O número ' +
          'acima é uma medida: o salário que manteria o mesmo poder de compra do início do ' +
          'período.',
        'O INPC é o índice mais usado em negociação coletiva, porque mede a cesta de famílias ' +
          'com renda de um a cinco salários mínimos. O IPCA é o índice oficial de inflação e ' +
          'costuma aparecer em cláusula de contrato individual.',
        'Reajuste e aumento não são a mesma coisa. Repor a inflação mantém o poder de compra; o ' +
          'que passa disso é ganho real, e é essa parte que a linha de comparação isola.',
      ],
    },
  }
}

export const REAJUSTE_SALARIAL: DefinicaoCalculadora = {
  id: 'CALC-063',
  slug: 'reajuste-de-salario',
  nome: 'Reajuste de salário pela inflação',
  linhaDeContexto: 'Quanto o salário precisaria ser para manter o poder de compra — e o que a proposta representa.',
  descricaoSeo:
    'Calcule quanto seu salário precisaria subir para repor a inflação por INPC, IPCA ou IGP-M, e compare com o reajuste oferecido para ver o ganho real.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário no início do período',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'O valor que vigorava desde o último reajuste.',
    },
    {
      id: 'indice',
      rotulo: 'Índice',
      tipo: 'selecao',
      padrao: 'inpc',
      opcoes: OPCOES_DE_INDICE,
      ajuda: 'O INPC é o mais usado em negociação coletiva; o IPCA é o índice oficial de inflação.',
    },
    {
      id: 'de',
      rotulo: 'Data do último reajuste',
      tipo: 'data',
      obrigatorio: true,
    },
    {
      id: 'ate',
      rotulo: 'Reajustar até',
      tipo: 'data',
      obrigatorio: true,
    },
    {
      id: 'reajusteOferecido',
      rotulo: 'Reajuste oferecido',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'O percentual que está na mesa. Deixe em branco para ver só a reposição da inflação.',
    },
  ],

  // Série econômica NÃO é parâmetro legal — `ADR-006`.
  parametrosRequeridos: [],

  rotuloResultado: 'Salário com o poder de compra mantido',

  calcular,

  faq: [
    {
      pergunta: 'Tenho direito a receber a reposição da inflação?',
      resposta:
        'Não existe uma regra geral que obrigue todo empregador a repor a inflação todo ano. O que obriga é a convenção ou o acordo coletivo da categoria, no que ele estabelecer, e cláusula de contrato individual quando houver. Esta calculadora não diz o que é devido — ela mede quanto seria preciso para o salário manter o mesmo poder de compra do início do período, que é uma informação para a conversa, não um direito apurado.',
    },
    {
      pergunta: 'INPC ou IPCA?',
      resposta:
        'Se há norma coletiva, o índice é o que ela indicar. Na ausência disso, o INPC é o mais usado em negociação salarial porque mede a cesta de consumo de famílias com renda de um a cinco salários mínimos, que é o público típico de reajuste por categoria. O IPCA é o índice oficial de inflação do país, com abrangência de renda maior, e aparece com frequência em contrato individual.',
    },
    {
      pergunta: 'Qual a diferença entre reajuste e aumento real?',
      resposta:
        'Reajuste é a reposição do que a inflação corroeu: o salário sobe, o poder de compra fica igual. Aumento real é o que passa disso — é quando o salário sobe mais que os preços e a pessoa efetivamente compra mais. Informando o percentual oferecido, o resultado separa as duas coisas e mostra em reais de que lado a proposta está.',
    },
    {
      pergunta: 'Por que comparar em reais e não os percentuais?',
      resposta:
        'Porque comparar percentuais direto engana. Ofereceram 4% e a inflação foi 5% não significa perda de 1% do salário: os dois percentuais incidem sobre a mesma base, mas o que interessa é a diferença entre os dois salários resultantes. O resultado faz a comparação em reais, que é o número que aparece no contracheque.',
    },
  ],

  relacionadas: ['salario-liquido', 'poder-de-compra', 'correcao-por-indice'],
}
