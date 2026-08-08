/**
 * CALC-061 — Poder de compra ao longo do tempo.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Ela e CALC-060 fazem a mesma multiplicação e respondem perguntas opostas**,
 * e é justamente a confusão entre as duas que ela existe para desfazer.
 *
 *   Corrigir: R$ 1.000,00 de 2015 **equivalem a** R$ 1.600,00 hoje.
 *   Deflacionar: R$ 1.000,00 de hoje **compram o que** R$ 625,00 compravam em 2015.
 *
 * Os dois números saem do mesmo fator — um multiplica, o outro divide — e
 * trocá-los é o erro clássico do assunto. Aqui os dois aparecem juntos,
 * nomeados, com a perda de poder de compra em percentual ao lado.
 *
 * E a perda **não é o simétrico da inflação**: 60% de inflação não são 60% de
 * perda, são 37,5%. A memória mostra as duas contas.
 */

import { corrigirPorIndice } from '../engine/calculadoras/indices'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { indiceEscolhido, mesDe, OPCOES_DE_INDICE, serieDoIndice } from './indices-comuns'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const chave = texto(valores, 'indice')
  const valorOriginal = centavos(numero(valores, 'valor'))

  const r = corrigirPorIndice(
    {
      valorOriginal,
      de: mesDe(texto(valores, 'de')),
      ate: mesDe(texto(valores, 'ate')),
      serie: serieDoIndice(chave),
      nomeDoIndice: indiceEscolhido(chave).nome,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorCorrigido,
      detalhamento: [
        { rotulo: 'Valor na época', valor: valorOriginal, sinal: 'neutro' },
        { rotulo: 'O que a inflação acrescentou', valor: v.correcao, sinal: 'credito' },
        { rotulo: 'Equivalente hoje', valor: v.valorCorrigido, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Inflação acumulada', valor: formatarPercentual(v.variacaoBp) },
        { rotulo: 'Perda de poder de compra', valor: formatarPercentual(v.perdaDePoderBp) },
        {
          rotulo: 'A mesma quantia hoje compraria, na época',
          valor: formatarReal(v.valorDeflacionado),
        },
        { rotulo: 'Meses aplicados', valor: `${v.mesesAplicados}` },
      ],
      notas: [
        'São dois números diferentes, e trocá-los é o erro mais comum deste assunto. O primeiro ' +
          'diz quanto seria preciso ter hoje para comprar o que aquele valor comprava. O ' +
          'segundo diz o que a mesma quantia, hoje, compraria na época — e é sempre menor.',
        'A perda de poder de compra NÃO é o mesmo número que a inflação acumulada. Com 60% de ' +
          'inflação, a perda é de 37,5%: o poder de compra vira um dividido por um vírgula seis, ' +
          'e não um menos zero vírgula seis.',
        'Índices medem uma cesta média de consumo, não a sua. Quem gasta mais com aluguel, ' +
          'saúde ou educação sente uma inflação diferente da oficial, e a diferença pode ser ' +
          'grande em períodos longos.',
      ],
    },
  }
}

export const PODER_DE_COMPRA: DefinicaoCalculadora = {
  id: 'CALC-061',
  slug: 'poder-de-compra',
  nome: 'Poder de compra ao longo do tempo',
  linhaDeContexto: 'Quanto o dinheiro perdeu — e quanto seria preciso hoje para comprar o mesmo.',
  descricaoSeo:
    'Descubra quanto um valor do passado equivale hoje e quanto do poder de compra a inflação levou, por IPCA, INPC ou IGP-M, nos dois sentidos.',

  campos: [
    {
      id: 'valor',
      rotulo: 'Valor na época',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'indice',
      rotulo: 'Índice',
      tipo: 'selecao',
      padrao: 'ipca',
      opcoes: OPCOES_DE_INDICE,
      ajuda: 'O IPCA é o índice oficial de inflação do país, e o mais usado para esta comparação.',
    },
    {
      id: 'de',
      rotulo: 'Data do valor',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Só o mês importa: índices são mensais.',
    },
    {
      id: 'ate',
      rotulo: 'Comparar com',
      tipo: 'data',
      obrigatorio: true,
    },
  ],

  // Série econômica NÃO é parâmetro legal — `ADR-006`.
  parametrosRequeridos: [],

  rotuloResultado: 'Equivalente hoje',

  calcular,

  faq: [
    {
      pergunta: 'Qual dos dois números eu devo usar?',
      resposta:
        'Depende da pergunta. Se você quer saber quanto precisaria ter hoje para comprar o que aquele valor comprava, é o resultado principal — o equivalente atualizado. Se quer saber o que a mesma quantia compraria na época, é o segundo, que aparece nos destaques e é sempre menor. Um salário de mil reais em 2010 "vale" hoje o primeiro número; mil reais de hoje "valiam" o segundo.',
    },
    {
      pergunta: 'Por que a perda de poder de compra não é igual à inflação?',
      resposta:
        'Porque as duas medem coisas diferentes. Se a inflação acumulada foi de 60%, o preço multiplicou por 1,6 — e o poder de compra do dinheiro virou um dividido por 1,6, ou seja, 62,5% do que era. A perda é de 37,5%, e não de 60%. Quanto maior a inflação, maior a diferença entre os dois números.',
    },
    {
      pergunta: 'Esse cálculo vale para o meu caso?',
      resposta:
        'Vale como referência, e não como retrato do seu orçamento. Índices oficiais medem uma cesta média de consumo, com pesos que valem para a população pesquisada, não para uma pessoa. Quem gasta uma fatia maior com aluguel, saúde ou educação costuma sentir uma inflação pessoal diferente da oficial, e em períodos longos a distância pode ser grande.',
    },
    {
      pergunta: 'Por que não consigo comparar com o mês atual?',
      resposta:
        'Porque o índice daquele mês ainda não foi publicado. Institutos divulgam com defasagem de cerca de um mês, e cada índice tem calendário próprio. O resultado mostra qual é o último mês disponível do índice escolhido.',
    },
  ],

  relacionadas: ['correcao-por-indice', 'juros-compostos', 'independencia-financeira'],
}
