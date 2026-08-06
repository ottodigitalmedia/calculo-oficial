/**
 * CALC-038 — Financiamento de reforma.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O que impede esta página de ser uma segunda CALC-024.** O CET simula UMA
 * operação, para quem já escolheu onde tomar o crédito. Quem vai reformar não
 * está nesse ponto: tem o orçamento da obra na mão e várias portas abertas, com
 * taxas que diferem por um fator de cinco entre a mais barata e a mais cara.
 *
 * Aqui a comparação é entre as modalidades **para a mesma obra**, mais a porta
 * que nenhum banco mostra: esperar e pagar à vista.
 *
 * **Modalidade não informada não aparece.** O campo em branco significa "não
 * tenho essa opção", e a tabela mostra só o que existe de verdade para aquela
 * pessoa — em vez de encher a tela com linhas que ela não pode escolher.
 */

import { calcularFinanciamentoDeReforma } from '../engine/calculadoras/credito'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/**
 * As portas mais comuns de quem vai reformar, da mais barata à mais cara na
 * prática do mercado. A ordem aqui é só a do formulário — a tabela do resultado
 * ordena pelo que a conta disser.
 */
const MODALIDADES = [
  { id: 'garantiaImovel', rotulo: 'Crédito com garantia de imóvel' },
  { id: 'consignado', rotulo: 'Consignado' },
  { id: 'pessoal', rotulo: 'Empréstimo pessoal' },
  { id: 'cartao', rotulo: 'Parcelamento no cartão' },
] as const

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const valorDaObra = centavos(numero(valores, 'valorDaObra'))

  const r = calcularFinanciamentoDeReforma(
    {
      valorDaObra,
      prazoMeses: numero(valores, 'prazoMeses'),
      modalidades: MODALIDADES.map((m) => ({
        rotulo: m.rotulo,
        taxaMensalBp: basisPoints(numero(valores, m.id)),
        tarifas: centavos(0),
      })),
      guardaPorMes: centavos(numero(valores, 'guardaPorMes')),
      rendimentoMensalBp: basisPoints(numero(valores, 'rendimento')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o total da opção mais barata. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Valor da obra', valor: valorDaObra, sinal: 'neutro' },
    { rotulo: 'Custo do crédito mais barato', valor: v.maisBarata.custoDoCredito, sinal: 'neutro' },
    { rotulo: `Total por ${v.maisBarata.rotulo.toLowerCase()}`, valor: v.maisBarata.totalPago, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Melhor opção informada', valor: v.maisBarata.rotulo },
    { rotulo: 'Parcela nela', valor: formatarReal(v.maisBarata.parcela) },
    { rotulo: 'CET dela, ao mês', valor: formatarPercentual(v.maisBarata.cetMensal) },
  ]

  if (v.linhas.length > 1) {
    destaques.push({
      rotulo: 'Escolher a pior custaria a mais',
      valor: formatarReal(v.diferencaEntreModalidades),
    })
  }

  if (v.mesesParaJuntar > 0) {
    destaques.push({
      rotulo: 'Guardando, você junta o valor em',
      valor: `${v.mesesParaJuntar} ${v.mesesParaJuntar === 1 ? 'mês' : 'meses'}`,
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.maisBarata.totalPago,
      detalhamento: linhas,
      destaques,
      tabela: {
        titulo: 'A mesma obra, por cada porta',
        colunas: ['Parcela', 'Total pago', 'Custo do crédito'],
        linhas: v.linhas.map((l) => ({
          rotulo: `${l.rotulo} — ${formatarPercentual(l.taxaMensalBp)} ao mês`,
          valores: [l.parcela, l.totalPago, l.custoDoCredito],
        })),
      },
      notas: [
        'É a MESMA obra em todas as linhas, pelo mesmo prazo. Toda a diferença vem de onde o ' +
          'crédito é tomado — e ela costuma ser maior que qualquer desconto que se negocie no ' +
          'material. Quem passa a tarde pesquisando piso e assina o crédito mais caro da mesa ' +
          'perdeu dinheiro na conta que não olhou.',
        'Deixe em branco a modalidade que você não tem. A tabela mostra só as portas que estão ' +
          'realmente abertas para você.',
        ...(v.mesesParaJuntar > 0
          ? [
              v.juntarDemoraMais
                ? 'Juntar leva mais tempo que o prazo do financiamento. É uma escolha entre pagar ' +
                  'juros e esperar — e o que se economiza esperando é exatamente o custo do ' +
                  'crédito da tabela.'
                : 'Juntar leva menos tempo que o prazo do financiamento, e sai sem custo de ' +
                  'crédito nenhum. Vale conferir se a obra pode esperar esse período.',
            ]
          : [
              'Informe quanto você consegue guardar por mês para ver a alternativa de esperar. Ela ' +
                'é a porta que não aparece na mesa do banco.',
            ]),
        'A conta de juntar não supõe rendimento nenhum por padrão — o campo de rendimento é seu, ' +
          'e começa em zero. Supor um rendimento otimista enviesaria a comparação a favor de ' +
          'esperar.',
        'Obra que atrasa ou estoura o orçamento muda esta conta, e as duas coisas são comuns. Se ' +
          'houver folga no prazo, refazer a simulação com o valor real conforme a obra anda evita ' +
          'a surpresa de precisar de um segundo crédito, quase sempre mais caro que o primeiro.',
      ],
    },
  }
}

export const FINANCIAMENTO_DE_REFORMA: DefinicaoCalculadora = {
  id: 'CALC-038',
  slug: 'financiamento-de-reforma',
  nome: 'Financiamento de reforma',
  linhaDeContexto: 'A mesma obra por cada porta de crédito — e quanto custa esperar em vez disso.',
  descricaoSeo:
    'Compare as opções de crédito para financiar sua reforma pelo total pago e pelo CET, e veja em quanto tempo você juntaria o valor da obra guardando por mês.',

  campos: [
    {
      id: 'valorDaObra',
      rotulo: 'Quanto custa a obra',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
      ajuda: 'O orçamento fechado, com material e mão de obra.',
    },
    {
      id: 'prazoMeses',
      rotulo: 'Em quantas parcelas',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 24,
      minimo: 1,
      maximo: 240,
    },
    {
      id: 'garantiaImovel',
      rotulo: 'Juros ao mês — crédito com garantia de imóvel',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 50_000,
      ajuda: 'Deixe em branco se você não tem essa opção.',
    },
    {
      id: 'consignado',
      rotulo: 'Juros ao mês — consignado',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 50_000,
    },
    {
      id: 'pessoal',
      rotulo: 'Juros ao mês — empréstimo pessoal',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 50_000,
    },
    {
      id: 'cartao',
      rotulo: 'Juros ao mês — parcelamento no cartão',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 50_000,
    },
    {
      id: 'guardaPorMes',
      rotulo: 'Quanto você consegue guardar por mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Para ver em quanto tempo a obra sairia sem crédito nenhum.',
    },
    {
      id: 'rendimento',
      rotulo: 'Rendimento ao mês do que for guardado',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Começa em zero de propósito. Preencha só se você sabe quanto rende.',
    },
  ],

  // Sem parâmetro legal: taxas e orçamento são do usuário.
  parametrosRequeridos: [],

  rotuloResultado: 'Total pela opção mais barata',

  calcular,

  faq: [
    {
      pergunta: 'Por que comparar as modalidades muda tanto?',
      resposta:
        'Porque as taxas diferem muito mais entre linhas de crédito do que entre bancos da mesma linha. Crédito com garantia de imóvel, consignado, empréstimo pessoal e parcelamento no cartão podem separar-se por um fator de cinco na taxa mensal — e sobre a mesma obra, pelo mesmo prazo, isso vira uma diferença grande no total. O resultado mostra quanto custaria escolher a pior das opções que você informou.',
    },
    {
      pergunta: 'Vale mais a pena financiar ou esperar e pagar à vista?',
      resposta:
        'A conta que decide está no resultado: o custo do crédito é exatamente o que você economiza esperando, e o preço de esperar é o tempo. Informe quanto consegue guardar por mês e a calculadora mostra em quantos meses o valor da obra é juntado. Se esse prazo for parecido com o do financiamento, esperar costuma ser a escolha óbvia; se for muito maior, a decisão passa a depender de quanto a obra é urgente — e isso a conta não decide.',
    },
    {
      pergunta: 'Por que o rendimento começa em zero?',
      resposta:
        'Porque supor um rendimento otimista enviesaria a comparação a favor de esperar, e este produto não escolhe o resultado por você. Zero é o cenário conservador: dinheiro guardado sem render. Se você sabe quanto rende a sua reserva, preencha o campo — a conta passa a considerar o rendimento mês a mês, e o prazo para juntar encurta.',
    },
    {
      pergunta: 'Devo comparar pela parcela ou pelo total?',
      resposta:
        'Pelo total, sempre. Parcela menor quase sempre significa prazo maior, e prazo maior aumenta o total mesmo com taxa igual. A tabela traz as duas colunas justamente para essa comparação: a parcela diz se cabe no orçamento do mês, e o total diz quanto a obra custou de verdade. As duas informações decidem coisas diferentes.',
    },
    {
      pergunta: 'E se a obra estourar o orçamento?',
      resposta:
        'É comum, e muda a conta. Um segundo crédito, tomado no meio da obra e com pressa, quase sempre sai mais caro que o primeiro — a urgência tira o poder de negociar. Se houver folga no prazo, vale refazer a simulação com o valor real conforme a obra anda, e considerar desde o começo uma margem sobre o orçamento fechado.',
    },
  ],

  relacionadas: ['cet-custo-efetivo-total', 'portabilidade-de-credito', 'juros-compostos'],
}
