/**
 * CALC-023 — Juros do rotativo do cartão: custo real.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O aviso adicional não é formalidade.** `00-catalogo` §6 registra que a
 * categoria de crédito é *"a de maior fragilidade ética: o usuário chega
 * endividado e o anúncio ao lado vende crédito"*, e exige que o aviso de
 * não-aconselhamento seja **contextual e visível, não só no rodapé**. É o que
 * `avisoAdicional` entrega — ele aparece na mesma dobra do resultado.
 */

import { calcularRotativo } from '../engine/calculadoras/rotativo'
import { basisPoints, centavos } from '../engine/types'
import { CREDITO } from '../params/data/credito'
import { construirRegistro } from '../params/registry'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `salario-liquido.ts`. */
const registro = construirRegistro(CREDITO)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularRotativo(
    {
      valorDaFatura: centavos(numero(valores, 'valorDaFatura')),
      valorPago: centavos(numero(valores, 'valorPago')),
      taxaRotativo: basisPoints(numero(valores, 'taxaRotativo')),
      taxaParcelamento: basisPoints(numero(valores, 'taxaParcelamento')),
      parcelas: numero(valores, 'parcelas'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  const detalhamento: LinhaDetalhamento[] = [
    { rotulo: 'Saldo que entrou no rotativo', valor: v.financiado, sinal: 'neutro' },
    { rotulo: 'Juros de um mês de rotativo', valor: v.jurosDoRotativo, sinal: 'debito' },
    { rotulo: 'Juros do parcelamento', valor: v.jurosDoParcelamento, sinal: 'debito' },
    { rotulo: 'Total a pagar', valor: v.totalPago, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Parcela do parcelamento', valor: formatarReal(v.parcelaDoParcelamento) },
    { rotulo: 'Teto legal de juros e encargos', valor: formatarReal(v.tetoLegal) },
    {
      rotulo: 'Juros sobre a dívida original',
      valor: formatarPercentual(
        // Regra de três em inteiros, na camada de apresentação: a proporção é
        // exibição, não cálculo — o número que a lei limita é o da memória.
        v.financiado === 0 ? 0 : Math.round((v.jurosEEncargos * 10_000) / v.financiado),
      ),
    },
  ]

  const notas: string[] = []

  if (v.tetoAtingido) {
    notas.push(
      `Nesse cenário os juros passariam de ${formatarReal(v.jurosSemTeto)}, mas a lei limita a ` +
        `cobrança a ${formatarReal(v.tetoLegal)} — o valor original da dívida. O limite vale para ` +
        'rotativo e parcelamento somados, contados desde o início do rotativo, e a fatura é ' +
        'obrigada a detalhar esse valor. Se a sua não detalha, questione o emissor.',
    )
  }

  if (v.parcelamentoNaoEMaisVantajoso) {
    notas.push(
      'A taxa de parcelamento usada aqui não é menor que a do rotativo. A norma só admite o ' +
        'parcelamento da fatura em condições mais vantajosas para o cliente, inclusive quanto aos ' +
        'encargos — vale conferir a taxa do parcelamento na fatura.',
    )
  }

  notas.push(
    'O rotativo dura um ciclo. Depois do vencimento da fatura seguinte, o saldo tem de migrar ' +
      'para um parcelamento mais barato — isso não é uma opção que você precisa pedir, é o que a ' +
      'norma determina desde 2017.',
  )

  return {
    ok: true,
    traco: r.traco,
    valores: { principal: v.jurosEEncargos, detalhamento, destaques, notas },
  }
}

export const ROTATIVO_CARTAO: DefinicaoCalculadora = {
  id: 'CALC-023',
  slug: 'rotativo-do-cartao',
  nome: 'Rotativo do cartão — custo real',
  linhaDeContexto:
    'Quanto custa não pagar a fatura inteira — e qual é o teto que a lei impõe à cobrança.',
  descricaoSeo:
    'Calcule o custo real do crédito rotativo do cartão: um ciclo de rotativo, a migração obrigatória para o parcelamento e o teto legal que limita juros e encargos ao valor original da dívida.',

  campos: [
    {
      id: 'valorDaFatura',
      rotulo: 'Valor da fatura',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'valorPago',
      rotulo: 'Quanto você pagou',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'O que foi efetivamente pago no vencimento. A diferença é o que entra no rotativo.',
    },
    {
      id: 'taxaRotativo',
      rotulo: 'Taxa do rotativo ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Consta da própria fatura, que é obrigada a informá-la antes da cobrança.',
    },
    {
      id: 'taxaParcelamento',
      rotulo: 'Taxa do parcelamento da fatura ao mês',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Em branco, o cálculo repete a taxa do rotativo — que é o pior caso possível.',
    },
    {
      id: 'parcelas',
      rotulo: 'Em quantas parcelas o saldo seria financiado',
      tipo: 'inteiro',
      padrao: 12,
      minimo: 1,
      maximo: 60,
    },
  ],

  parametrosRequeridos: ['cartao-teto-juros-encargos'],

  rotuloResultado: 'Juros e encargos que você pagaria',

  calcular,

  // `00-catalogo` §6: aviso contextual, não só no rodapé.
  avisoAdicional:
    'Esta calculadora não recomenda contratar nem deixar de contratar crédito. Se a dívida do cartão já existe, o Banco Central orienta procurar o emissor para renegociar — é direito assegurado a qualquer momento.',

  faq: [
    {
      pergunta: 'Posso ficar meses no rotativo?',
      resposta:
        'Não. A Resolução CMN nº 4.549, de 2017, determina no art. 1º que o saldo não pago só pode ficar no crédito rotativo até o vencimento da fatura seguinte. Depois disso, o emissor é obrigado a migrar o saldo para um parcelamento — e o art. 2º exige que esse parcelamento seja em condições mais vantajosas que as do rotativo, inclusive nos encargos. Simulações de "doze meses de rotativo" descrevem algo que a norma proíbe há anos.',
    },
    {
      pergunta: 'Existe limite para os juros do cartão?',
      resposta:
        'Existe, desde 3 de janeiro de 2024. A Lei nº 14.690, de 2023, no art. 28, § 1º, determina que o total cobrado a título de juros e encargos financeiros não pode exceder o valor original da dívida. Em outras palavras: uma dívida de mil reais nunca pode gerar mais de mil reais de juros e encargos. O teto não limita a taxa — limita o acumulado.',
    },
    {
      pergunta: 'O teto zera quando a dívida é parcelada ou renegociada?',
      resposta:
        'Não, e essa é a parte que mais confunde. A Resolução CMN nº 4.549/2017, no art. 2º-A, parágrafo único, incluído pela Resolução CMN nº 5.112/2023, determina que na migração do rotativo para o parcelamento o valor original da dívida continua sendo o montante inicial do rotativo, e que os juros e encargos são apurados desde o início dele. Na renegociação vale a mesma lógica pelo art. 2º-C, descontando o que já foi pago. Sem isso, bastaria reparcelar para reiniciar a contagem.',
    },
    {
      pergunta: 'Por que o cálculo separa rotativo de parcelamento?',
      resposta:
        'Porque são duas operações com taxas diferentes, e tratá-las como uma só distorce o resultado nos dois sentidos. Aplicar a taxa do rotativo por doze meses superestima bastante o custo; ignorar o mês de rotativo e usar só a do parcelamento subestima. A conta aqui segue a sequência que a norma impõe: um ciclo de rotativo, e o restante parcelado.',
    },
    {
      pergunta: 'Pagar um pouco a mais que o mínimo muda muita coisa?',
      resposta:
        'Muda tudo, e de forma desproporcional. O que entra no rotativo é a diferença entre a fatura e o que você pagou — e é sobre esse saldo que incidem os juros do rotativo, depois os do parcelamento, e é ele que define o teto legal. Aumentar o pagamento reduz a base das três coisas ao mesmo tempo. Simule aqui com dois valores de pagamento e compare: a diferença no total costuma ser bem maior que a diferença no que se pagou a mais.',
    },
    {
      pergunta: 'Esse é o valor exato que vou pagar?',
      resposta:
        'É uma estimativa com base nas taxas que você informou. A fatura real pode incluir IOF, multa e juros de mora por atraso, e tarifas — que, pela norma, entram na conta do teto como encargos financeiros. A fatura é obrigada a detalhar o valor original da dívida e o total de juros e encargos de cada operação, pelo art. 2º-B.',
    },
  ],

  relacionadas: ['juros-compostos', 'cet-custo-efetivo-total', 'quitacao-antecipada'],
}
