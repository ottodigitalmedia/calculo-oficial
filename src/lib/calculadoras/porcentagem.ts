/**
 * CALC-070 — Porcentagem: parte, acréscimo, desconto, proporção e variação.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A mais simples do catálogo e a de maior volume de busca.** Ela existe por
 * duas razões: é porta de entrada para as calculadoras-âncora, e é onde o
 * diferencial do produto aparece de forma mais nua — o concorrente típico
 * devolve o número e nada mais, e aqui a conta fica aberta ao lado dele.
 *
 * **É também a primeira cujo resultado não é dinheiro.** Ver `Unidade` em
 * `engine/traco.ts` para o que isso exigiu do molde.
 */

import { calcularPorcentagem, type OperacaoPorcentagem } from '../engine/calculadoras/aritmetica'
import { basisPoints } from '../engine/types'
import { formatarNumero } from '../format/moeda'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
} from './tipos'

const OPERACOES: readonly OperacaoPorcentagem[] = [
  'parte',
  'acrescimo',
  'desconto',
  'proporcao',
  'variacao',
]

/** Rótulo da grandeza complementar, que muda de sentido conforme a operação. */
const ROTULO_DIFERENCA: Readonly<Record<OperacaoPorcentagem, string>> = {
  parte: 'Quanto sobra do valor',
  acrescimo: 'Quanto foi acrescentado',
  desconto: 'Quanto foi descontado',
  proporcao: 'Quanto falta para o total',
  variacao: 'Diferença absoluta',
}

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const escolhida = texto(valores, 'operacao')
  const operacao = OPERACOES.find((o) => o === escolhida) ?? 'parte'

  const r = calcularPorcentagem(
    {
      operacao,
      valor: numero(valores, 'valor'),
      percentualBp: basisPoints(numero(valores, 'percentual')),
      referencia: numero(valores, 'referencia'),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.resultado,
      unidade: v.unidade,
      /**
       * Vazio de propósito. O detalhamento compartilha a unidade do principal,
       * e aqui as duas grandezas têm unidades diferentes — na proporção, o
       * resultado é percentual e a diferença é número. Forçá-las na mesma lista
       * imprimiria uma das duas com a unidade da outra, que é exatamente o
       * defeito que a declaração de unidade existe para impedir.
       */
      detalhamento: [],
      destaques: [
        { rotulo: ROTULO_DIFERENCA[operacao], valor: formatarNumero(v.diferenca) },
      ],
      notas: [
        'Porcentagem não é comutativa no acúmulo: subir 10% e depois cair 10% não devolve ao ' +
          'ponto de partida, porque a queda incide sobre um valor já maior. A memória de ' +
          'cálculo abaixo mostra sobre qual valor cada percentual foi aplicado.',
      ],
    },
  }
}

export const PORCENTAGEM: DefinicaoCalculadora = {
  id: 'CALC-070',
  slug: 'porcentagem',
  nome: 'Porcentagem',
  linhaDeContexto:
    'Parte, acréscimo, desconto, proporção e variação — com a conta aberta ao lado.',
  descricaoSeo:
    'Calcule porcentagem nos cinco casos que aparecem no dia a dia: quanto é X% de um valor, quanto sobra com desconto, quanto fica com acréscimo, que fração um valor representa de outro e qual foi a variação percentual entre dois valores.',

  campos: [
    {
      id: 'operacao',
      rotulo: 'O que você quer calcular',
      tipo: 'selecao',
      padrao: 'parte',
      opcoes: [
        { valor: 'parte', rotulo: 'Quanto é X% de um valor' },
        { valor: 'desconto', rotulo: 'Quanto fica com X% de desconto' },
        { valor: 'acrescimo', rotulo: 'Quanto fica com X% de acréscimo' },
        { valor: 'proporcao', rotulo: 'Um valor é quantos % de outro' },
        { valor: 'variacao', rotulo: 'Qual foi a variação percentual' },
      ],
    },
    {
      id: 'valor',
      rotulo: 'Valor',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
      ajuda: 'Na variação, é o valor NOVO — o de depois.',
    },
    {
      id: 'percentual',
      rotulo: 'Percentual',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 100_000,
      visivelSe: { campo: 'operacao', em: ['parte', 'acrescimo', 'desconto'] },
    },
    {
      id: 'referencia',
      rotulo: 'Valor de referência',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
      ajuda: 'Na proporção, é o total. Na variação, é o valor ANTERIOR — o de antes.',
      visivelSe: { campo: 'operacao', em: ['proporcao', 'variacao'] },
    },
  ],

  parametrosRequeridos: [],

  rotuloResultado: 'Resultado',

  calcular,

  faq: [
    {
      pergunta: 'Como se calcula X% de um valor?',
      resposta:
        'Multiplica-se o valor pelo percentual e divide-se por cem. Para 15% de 200: 200 × 15 ÷ 100 = 30. A memória de cálculo mostra a substituição com os seus números, para que a conferência não dependa de acreditar no resultado.',
    },
    {
      pergunta: 'Por que subir 10% e cair 10% não volta ao valor original?',
      resposta:
        'Porque cada percentual incide sobre uma base diferente. Cem sobe 10% e vira 110; 10% de 110 são 11, e a queda leva a 99 — não a 100. É o mesmo motivo pelo qual um desconto de 50% seguido de outro de 50% não zera o preço: dá 25% do original.',
    },
    {
      pergunta: 'Qual a diferença entre proporção e variação?',
      resposta:
        'A proporção responde "quanto isto representa daquilo": 30 é 15% de 200. A variação responde "quanto isto mudou em relação ao que era": de 200 para 230, a variação foi de 15%. Nos dois casos o denominador é o valor de referência, mas o numerador muda — na proporção é o valor inteiro, na variação é só a diferença.',
    },
    {
      pergunta: 'A variação percentual se calcula sobre o valor antigo ou o novo?',
      resposta:
        'Sempre sobre o antigo. É a convenção universal em estatística, em economia e na contabilidade, e é o que permite comparar variações de períodos diferentes. Usar o valor novo como base produz um número menor em qualquer alta e maior em qualquer queda — é o erro que faz uma alta de 100% parecer de 50%.',
    },
    {
      pergunta: 'Serve para calcular desconto em compra?',
      resposta:
        'Serve. Escolha "quanto fica com X% de desconto", informe o preço e o percentual, e o resultado é o valor final; o destaque mostra quanto foi abatido. Para desconto sobre desconto, rode a calculadora duas vezes — usando o resultado da primeira como valor da segunda, que é como a loja de fato aplica.',
    },
  ],

  relacionadas: ['juros-compostos', 'salario-liquido', 'inss'],
}
