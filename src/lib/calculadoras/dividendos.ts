/**
 * CALC-046 — Dividend yield e renda passiva.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A armadilha aqui é de leitura, não de conta.** O yield é histórico — divide
 * o que já foi pago pelo preço de hoje —, e sobe quando a ação cai. Um produto
 * que apresentasse o número como "renda garantida" estaria induzindo justamente
 * o erro que a métrica provoca. A página nomeia o que ele é, em todo lugar em
 * que ele aparece.
 */

import { calcularDividendos } from '../engine/calculadoras/dividendos'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularDividendos(
    {
      precoPorAcao: centavos(numero(valores, 'precoPorAcao')),
      dividendoAnualPorAcao: centavos(numero(valores, 'dividendoAnual')),
      quantidade: numero(valores, 'quantidade'),
      rendaMensalDesejada: centavos(numero(valores, 'rendaDesejada')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Dividend yield dos últimos 12 meses', valor: formatarPercentual(v.yieldAnualBp) },
    { rotulo: 'Investimento', valor: formatarReal(v.investimentoTotal) },
    { rotulo: 'Proventos em doze meses', valor: formatarReal(v.rendaAnual) },
  ]

  if (v.acoesParaARenda > 0) {
    destaques.push(
      { rotulo: 'Ações para a renda desejada', valor: `${v.acoesParaARenda}` },
      { rotulo: 'Investimento para chegar lá', valor: formatarReal(v.investimentoParaARenda) },
    )
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.rendaMensal,
      /**
       * Vazio, como em CALC-070: as grandezas desta página — investimento,
       * proventos e yield — não são parcelas de uma soma, e enfileirá-las numa
       * coluna que o resto do produto usa para decompor totais sugeriria uma
       * adição que não existe.
       */
      detalhamento: [],
      destaques,
      notas: [
        'O dividend yield olha para TRÁS. Ele divide o que já foi pago nos últimos doze meses ' +
          'pelo preço de hoje, e nada obriga a empresa a repetir aquele pagamento. Uma queda no ' +
          'preço da ação eleva o yield sem que nada de bom tenha acontecido — é a forma mais ' +
          'comum de a métrica enganar.',
        'A média mensal é média, e não mensalidade. Proventos são pagos em datas irregulares, e ' +
          'é normal haver meses sem pagamento nenhum. Quem depende dessa renda para despesas ' +
          'fixas precisa considerar isso.',
        'Os valores são brutos. O tratamento tributário de proventos varia conforme o tipo de ' +
          'provento e o veículo pelo qual você investe, e esta calculadora não o apura.',
        'Yield alto merece a pergunta seguinte, não entusiasmo: por que ele está alto? Pode ser ' +
          'um pagamento extraordinário que não se repete, ou um preço que caiu por um motivo ' +
          'que ainda vale.',
      ],
    },
  }
}

export const DIVIDENDOS: DefinicaoCalculadora = {
  id: 'CALC-046',
  slug: 'dividend-yield',
  nome: 'Dividend yield e renda passiva',
  linhaDeContexto: 'Quanto os proventos rendem sobre o preço — e quanto seria preciso para viver deles.',
  descricaoSeo:
    'Calcule o dividend yield a partir do preço da ação e dos proventos dos últimos doze meses, e descubra quanto seria preciso investir para uma renda mensal alvo.',

  campos: [
    {
      id: 'precoPorAcao',
      rotulo: 'Preço da ação',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000,
    },
    {
      id: 'dividendoAnual',
      rotulo: 'Proventos por ação nos últimos 12 meses',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000,
      ajuda: 'A soma do que foi pago por ação no período. É um dado do passado.',
    },
    {
      id: 'quantidade',
      rotulo: 'Quantas ações',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 100,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'rendaDesejada',
      rotulo: 'Renda mensal que você quer receber',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Deixe em branco para ver só o rendimento da posição que você informou.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Média de proventos por mês',

  calcular,

  faq: [
    {
      pergunta: 'Yield alto é sinal de bom investimento?',
      resposta:
        'Não por si só, e às vezes é o contrário. O yield é uma divisão: proventos pagos sobre preço atual. Ele sobe quando os proventos sobem — o que é bom — e também quando o preço cai, o que costuma ter um motivo. Um yield muito acima dos pares merece a pergunta "por quê" antes de qualquer entusiasmo: pode ser um pagamento extraordinário que não se repete, ou um preço que despencou por uma razão que continua valendo.',
    },
    {
      pergunta: 'Essa renda é garantida?',
      resposta:
        'Não. O número parte do que foi pago nos últimos doze meses e supõe que o mesmo se repita, o que nada assegura: proventos dependem do lucro e da decisão de distribuí-lo, e ambos mudam. A calculadora projeta um ritmo, não uma promessa.',
    },
    {
      pergunta: 'Por que a média mensal não é o que eu recebo todo mês?',
      resposta:
        'Porque proventos raramente são mensais. Eles são pagos em datas definidas pela empresa, às vezes uma ou duas vezes ao ano, e é normal haver meses sem nenhum pagamento. A média serve para dimensionar a renda anual, não para planejar o fluxo de um mês específico — quem depende dela para despesas fixas precisa de reserva para atravessar os meses vazios.',
    },
    {
      pergunta: 'Os valores já estão com imposto descontado?',
      resposta:
        'Não. O resultado é bruto. O tratamento tributário de proventos varia conforme o tipo de provento e o veículo pelo qual se investe, e esta calculadora não o apura — informe-se sobre o que se aplica ao seu caso antes de contar com o valor cheio.',
    },
  ],

  relacionadas: ['quanto-rende-por-mes', 'independencia-financeira', 'juros-compostos'],
}
