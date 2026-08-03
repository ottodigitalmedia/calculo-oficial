/**
 * CALC-034 — Alugar ou comprar: comparativo de longo prazo.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A mais composta do catálogo, e a que mais depende de premissa.** Três chutes
 * sobre o futuro entram nela — valorização do imóvel, rendimento da carteira e
 * reajuste do aluguel —, e nenhum deles vem embutido: os três são campos, e o
 * texto diz que são seus.
 *
 * Por isso o número que a página coloca em destaque não é o patrimônio de
 * nenhum dos dois lados, e sim a **valorização de equilíbrio**: quanto o imóvel
 * precisaria valorizar ao ano para as duas pontas empatarem. Ele troca uma
 * pergunta que depende de três premissas por uma que depende de uma só.
 */

import { compararAlugarOuComprar } from '../engine/calculadoras/alugar-ou-comprar'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = compararAlugarOuComprar(
    {
      valorDoImovel: centavos(numero(valores, 'valorDoImovel')),
      entrada: centavos(numero(valores, 'entrada')),
      custosDeAquisicao: centavos(numero(valores, 'custosDeAquisicao')),
      prazoFinanciamentoMeses: numero(valores, 'prazoFinanciamento'),
      taxaFinanciamentoMensal: basisPoints(numero(valores, 'taxaFinanciamento')),
      sistema: texto(valores, 'sistema') === 'price' ? 'price' : 'sac',
      custosDoDonoMensais: centavos(numero(valores, 'custosDoDono')),
      aluguelMensal: centavos(numero(valores, 'aluguelMensal')),
      reajusteAluguelAnualBp: basisPoints(numero(valores, 'reajusteAluguel')),
      valorizacaoAnualBp: basisPoints(numero(valores, 'valorizacaoAnual')),
      rendimentoCarteiraAnualBp: basisPoints(numero(valores, 'rendimentoCarteira')),
      anos: numero(valores, 'anos'),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    {
      rotulo: 'Sai à frente',
      valor: v.diferenca > 0 ? 'Comprar' : v.diferenca < 0 ? 'Alugar' : 'Empate',
    },
  ]

  if (v.valorizacaoDeEquilibrioBp !== null) {
    destaques.push({
      rotulo: 'Valorização anual que empata as duas pontas',
      valor: formatarPercentual(v.valorizacaoDeEquilibrioBp),
    })
  }

  destaques.push(
    { rotulo: 'Valor do imóvel ao fim', valor: formatarReal(v.valorDoImovelNoFim) },
    { rotulo: 'Ainda devido ao fim', valor: formatarReal(v.saldoDevedorNoFim) },
    { rotulo: 'Desembolsado comprando', valor: formatarReal(v.totalDesembolsadoComprando) },
    { rotulo: 'Desembolsado alugando', valor: formatarReal(v.totalDesembolsadoAlugando) },
  )

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.diferenca,
      /** A primeira linha menos a segunda é exatamente a terceira. */
      detalhamento: [
        { rotulo: 'Patrimônio comprando', valor: v.patrimonioComprador, sinal: 'neutro' },
        { rotulo: 'Patrimônio alugando', valor: v.patrimonioLocatario, sinal: 'neutro' },
        { rotulo: 'Diferença', valor: v.diferenca, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        'Três números desta conta são PREMISSA SUA, e não projeção nossa: a valorização do ' +
          'imóvel, o rendimento da carteira e o reajuste do aluguel. O que decide o resultado é ' +
          'sobretudo a distância entre os dois primeiros — e é por isso que a valorização de ' +
          'equilíbrio está em destaque: ela resume os três numa pergunta só.',
        'A comparação NÃO é prestação contra aluguel. Quem compra constrói patrimônio a cada ' +
          'amortização; quem aluga tem a entrada e os custos de aquisição rendendo desde o ' +
          'primeiro mês. O que se compara é o patrimônio de cada um ao fim do prazo.',
        'A diferença entre os dois desembolsos anda nos dois sentidos: entra na carteira de ' +
          'quem aluga quando o aluguel é mais barato, e sai dela quando é mais caro. Comparações ' +
          'que só modelam o primeiro sentido dão vantagem sistemática ao aluguel.',
        'Imposto sobre o rendimento da carteira não entra, e ele reduziria o lado de quem ' +
          'aluga. Do outro lado ficam de fora a corretagem na venda do imóvel e o imposto sobre ' +
          'eventual ganho de capital. Nenhum dos dois lados está completo, e os dois erram para ' +
          'o mesmo lado: a favor de si mesmos.',
        'O que não cabe em conta nenhuma: estabilidade, liberdade de mudar de cidade, o custo ' +
          'de um imóvel que não vende quando você precisa, e o valor de morar no que é seu. A ' +
          'aritmética informa a decisão; ela não a toma.',
      ],
    },
  }
}

export const ALUGAR_OU_COMPRAR: DefinicaoCalculadora = {
  id: 'CALC-034',
  slug: 'alugar-ou-comprar',
  nome: 'Alugar ou comprar',
  linhaDeContexto: 'Qual constrói mais patrimônio no seu prazo — e quanto o imóvel teria que valorizar para empatar.',
  descricaoSeo:
    'Compare alugar e comprar pelo patrimônio ao fim do prazo, com financiamento, custos de aquisição e a carteira de quem aluga. Veja a valorização anual que faria as duas pontas empatarem.',

  campos: [
    {
      id: 'valorDoImovel',
      rotulo: 'Valor do imóvel',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 5_000_000_000,
    },
    {
      id: 'aluguelMensal',
      rotulo: 'Aluguel de um imóvel equivalente',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000,
      ajuda: 'O aluguel do mesmo imóvel, ou de um parecido no mesmo bairro. É esta comparação que dá sentido ao resto.',
    },
    {
      id: 'anos',
      rotulo: 'Horizonte da comparação, em anos',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 10,
      minimo: 1,
      maximo: 50,
      ajuda: 'Por quanto tempo você pretende ficar. O prazo importa, mas menos que a distância entre a valorização do imóvel e o rendimento da carteira.',
    },
    {
      id: 'entrada',
      rotulo: 'Entrada',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 5_000_000_000,
      ajuda: 'Este dinheiro é o que a carteira de quem aluga começa rendendo.',
    },
    {
      id: 'custosDeAquisicao',
      rotulo: 'Custos de aquisição',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 500_000_000,
      ajuda: 'ITBI, cartório e avaliação. Pagos uma vez, e quem aluga não paga.',
    },
    {
      id: 'prazoFinanciamento',
      rotulo: 'Prazo do financiamento, em meses',
      tipo: 'inteiro',
      padrao: 360,
      minimo: 0,
      maximo: 420,
      ajuda: 'Zero para compra à vista.',
    },
    {
      id: 'taxaFinanciamento',
      rotulo: 'Taxa do financiamento ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      padrao: 90,
      minimo: 0,
      maximo: 10_000,
    },
    {
      id: 'sistema',
      rotulo: 'Sistema de amortização',
      tipo: 'selecao',
      padrao: 'sac',
      opcoes: [
        { valor: 'sac', rotulo: 'SAC — prestação decrescente' },
        { valor: 'price', rotulo: 'Price — prestação constante' },
      ],
    },
    {
      id: 'custosDoDono',
      rotulo: 'Custos que só o dono paga, por mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Manutenção, seguro do imóvel, e o que mais o inquilino não pagaria.',
    },
    {
      id: 'valorizacaoAnual',
      rotulo: 'Valorização do imóvel ao ano',
      tipo: 'percentual',
      padrao: 400,
      minimo: 0,
      maximo: 5_000,
      ajuda: 'Premissa sua. O resultado é muito sensível a ela — compare com a valorização de equilíbrio que aparece no resultado.',
    },
    {
      id: 'rendimentoCarteira',
      rotulo: 'Rendimento da carteira ao ano',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Quanto rende o dinheiro de quem aluga. Abre com a Selic do último mês publicado.',
    },
    {
      id: 'reajusteAluguel',
      rotulo: 'Reajuste do aluguel ao ano',
      tipo: 'percentual',
      padrao: 450,
      minimo: 0,
      maximo: 5_000,
      ajuda: 'Premissa sua. Contratos costumam reajustar por IGP-M ou IPCA.',
    },
  ],

  // Série econômica NÃO é parâmetro legal — `ADR-006`.
  parametrosRequeridos: [],

  /** `RF-012` — o rendimento da carteira abre sugerido pela Selic corrente. */
  sugestaoDeSerie: { campo: 'rendimentoCarteira', serie: 'selic-ao-ano' },

  rotuloResultado: 'Diferença de patrimônio ao fim do prazo',

  calcular,

  faq: [
    {
      pergunta: 'Por que não basta comparar a prestação com o aluguel?',
      resposta:
        'Porque essa comparação ignora as duas coisas que decidem o resultado. Quem paga a prestação está construindo patrimônio a cada amortização — parte daquele dinheiro volta como imóvel. E quem aluga tem, parado e rendendo, a entrada e os custos de aquisição que não gastou. Comparar só o desembolso mensal favorece sistematicamente quem aluga em prestações altas e quem compra em prestações baixas, e nos dois casos pela razão errada.',
    },
    {
      pergunta: 'O que é a valorização de equilíbrio?',
      resposta:
        'É quanto o imóvel precisaria valorizar por ano para os dois caminhos terminarem com o mesmo patrimônio. Ela é o número mais útil da página porque troca uma pergunta difícil — "alugar ou comprar", que depende de três premissas suas — por uma pergunta sobre a qual você tem opinião: o imóvel valoriza mais ou menos que isso? Se a resposta for claramente mais, comprar sai à frente; se for claramente menos, alugar.',
    },
    {
      pergunta: 'De onde vêm a valorização e o rendimento?',
      resposta:
        'De você. Nenhum dos dois é projeção desta calculadora, e não existe fonte para o futuro. O rendimento da carteira abre sugerido pela Selic do último mês publicado, com a data ao lado, porque é o dado oficial disponível — mas é editável, e o resto é premissa. O resultado é muito sensível aos três chutes: mude a valorização em um ponto percentual e a resposta pode inverter.',
    },
    {
      pergunta: 'O prazo muda a resposta?',
      resposta:
        'Muda, e menos do que se costuma dizer. O que domina o resultado é a DISTÂNCIA entre a valorização do imóvel e o rendimento da carteira: se a carteira rende bem mais que o imóvel valoriza, alugar ganha em qualquer prazo, e ganha mais quanto mais longo ele for — porque a diferença é composta. O efeito dos custos de aquisição, que pesam mais em prazo curto, aparece quando as duas taxas são próximas: com valorização e rendimento parecidos, alugar sai à frente nos primeiros anos e comprar assume em algum ponto entre cinco e dez. Rode a sua conta com dois prazos antes de concluir.',
    },
    {
      pergunta: 'O que ficou de fora da conta?',
      resposta:
        'Coisas dos dois lados, e é honesto dizer quais. Do lado de quem aluga, o imposto sobre o rendimento da carteira, que reduziria o resultado dele. Do lado de quem compra, a corretagem na venda e o imposto sobre eventual ganho de capital. E, dos dois lados, tudo o que não é dinheiro: estabilidade, liberdade de mudar, o custo de um imóvel que não vende na hora em que você precisa. A aritmética informa a decisão; ela não a toma.',
    },
  ],

  relacionadas: ['financiamento-imobiliario', 'rentabilidade-de-aluguel', 'capacidade-de-financiamento'],
}
