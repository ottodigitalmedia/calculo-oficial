/**
 * CALC-056 — Financiamento de veículo.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O que a separa de CALC-024, que já calcula CET.** Aquela parte do valor que
 * o banco liberou; esta parte do **preço do carro e da entrada**, que é como a
 * decisão é tomada na loja. E ela responde o que a simulação da concessionária
 * não responde: quanto o carro custa no fim, e em quantas parcelas o que já saiu
 * do bolso passa do preço à vista.
 *
 * **O IOF entra como valor digitado, não como alíquota** — mesma decisão de
 * CALC-062, registrada em §7.33. Ele está discriminado no contrato.
 */

import { calcularFinanciamentoDeVeiculo } from '../engine/calculadoras/credito'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const precoDoVeiculo = centavos(numero(valores, 'precoDoVeiculo'))
  const entradaPaga = centavos(numero(valores, 'entrada'))

  const r = calcularFinanciamentoDeVeiculo(
    {
      precoDoVeiculo,
      entrada: entradaPaga,
      prazoMeses: numero(valores, 'prazoMeses'),
      taxaMensalBp: basisPoints(numero(valores, 'taxaMensal')),
      tarifas: centavos(numero(valores, 'tarifas')),
      seguroMensal: centavos(numero(valores, 'seguroMensal')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o total exibido. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Preço do veículo', valor: precoDoVeiculo, sinal: 'neutro' },
    { rotulo: 'Juros, tarifas e seguro', valor: v.custoAcimaDoPreco, sinal: 'neutro' },
    { rotulo: 'Quanto o carro custa no fim', valor: v.totalPago, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Parcela', valor: formatarReal(v.parcela) },
    { rotulo: 'Valor financiado', valor: formatarReal(v.valorFinanciadoComTarifas) },
    { rotulo: 'CET ao mês', valor: formatarPercentual(v.cetMensal) },
    { rotulo: 'CET ao ano', valor: formatarPercentual(v.cetAnual) },
    {
      rotulo: 'Você paga além do preço à vista',
      valor: `${formatarReal(v.custoAcimaDoPreco)} (${formatarPercentual(v.custoAcimaDoPrecoBp)})`,
    },
  ]

  if (v.mesesParaSuperarOPreco > 0) {
    destaques.push({
      rotulo: 'O preço à vista é ultrapassado na parcela',
      valor: `${v.mesesParaSuperarOPreco}ª`,
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.totalPago,
      detalhamento: linhas,
      destaques,
      notas: [
        'As tarifas de cadastro, o registro de contrato e o IOF entram DENTRO do valor ' +
          'financiado, e passam a render juros junto com o resto. É a prática do mercado, e é ' +
          'uma das razões de o CET ficar acima da taxa anunciada.',
        'Compare sempre pelo CET, e não pela taxa: duas propostas com a mesma taxa mensal podem ' +
          'ter custos efetivos bem diferentes, conforme as tarifas e o seguro embutidos.',
        'O seguro prestamista costuma ser opcional. Se ele estiver na simulação, pergunte se dá ' +
          'para tirar — e refaça a conta sem ele para ver quanto ele custa no total.',
        'O valor do IOF é digitado, e está discriminado no contrato. Esta calculadora não ' +
          'cadastra a alíquota: ela esteve sob disputa e publicar percentual não confirmado é ' +
          'exatamente o erro que este produto existe para evitar.',
        'Financiar não é só pagar juros: o carro deprecia enquanto a dívida corre. Nos primeiros ' +
          'meses é comum dever mais do que o carro vale, o que trava a venda antes da quitação.',
      ],
    },
  }
}

export const FINANCIAMENTO_DE_VEICULO: DefinicaoCalculadora = {
  id: 'CALC-056',
  slug: 'financiamento-de-veiculo',
  nome: 'Financiamento de veículo',
  linhaDeContexto: 'Quanto fica a parcela — e quanto o carro custa no fim, com o CET à mostra.',
  descricaoSeo:
    'Calcule a parcela do financiamento do carro a partir do preço e da entrada, com tarifas e IOF dentro. Veja o CET e quanto você paga além do preço à vista.',

  campos: [
    {
      id: 'precoDoVeiculo',
      rotulo: 'Preço do veículo',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'entrada',
      rotulo: 'Entrada',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
    },
    {
      id: 'prazoMeses',
      rotulo: 'Em quantas parcelas',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 48,
      minimo: 1,
      maximo: 120,
    },
    {
      id: 'taxaMensal',
      rotulo: 'Juros ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 1,
      maximo: 50_000,
      ajuda: 'A taxa mensal da proposta. Se você só tem a anual, peça a mensal — a divisão por doze subestima o custo.',
    },
    {
      id: 'tarifas',
      rotulo: 'Tarifas e IOF',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Cadastro, registro de contrato e IOF, somados. Todos estão discriminados na proposta.',
    },
    {
      id: 'seguroMensal',
      rotulo: 'Seguro cobrado na parcela',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Prestamista ou proteção financeira, quando houver. Costuma ser opcional.',
    },
  ],

  // Sem parâmetro legal: preço, taxa e tarifas são do contrato.
  parametrosRequeridos: [],

  rotuloResultado: 'Quanto o carro custa no fim',

  calcular,

  faq: [
    {
      pergunta: 'Por que o CET é maior que a taxa que me ofereceram?',
      resposta:
        'Porque a taxa mede só o juro, e o CET mede tudo o que sai do seu bolso. Tarifa de cadastro, registro de contrato, IOF e seguro entram no valor financiado ou na parcela, mas não voltam em veículo — e por isso empurram o custo para cima. É por essa razão que duas propostas com a mesma taxa mensal podem ter custos efetivos bem diferentes, e é pelo CET que elas se comparam.',
    },
    {
      pergunta: 'Vale a pena dar uma entrada maior?',
      resposta:
        'Em dinheiro, quase sempre: cada real de entrada é um real que deixa de render juros pelo prazo inteiro. Refaça a conta com entradas diferentes e compare o "quanto além do preço à vista". O que a conta não decide por você é o outro lado: entrada maior consome a reserva, e ficar sem reserva costuma custar mais caro do que os juros que ela economizou.',
    },
    {
      pergunta: 'Por que a calculadora não traz a alíquota do IOF?',
      resposta:
        'Porque ela esteve sob disputa quando esta página foi construída, e publicar percentual não confirmado em fonte oficial é exatamente o erro que este produto existe para evitar. O valor do IOF está discriminado na sua proposta, em reais, e é ele que entra no campo de tarifas — o que preserva a conta sem cadastrar um número que pode estar errado.',
    },
    {
      pergunta: 'O seguro prestamista é obrigatório?',
      resposta:
        'Pergunte. Ele costuma ser oferecido junto e apresentado como parte do pacote, mas em geral pode ser recusado — e a proposta precisa ser refeita sem ele. Rode a conta com e sem: a diferença no total costuma ser maior do que o prêmio mensal sugere, porque ele é cobrado em todas as parcelas.',
    },
    {
      pergunta: 'Por que devo mais do que o carro vale?',
      resposta:
        'Porque a dívida cai devagar no começo e o carro perde valor rápido. Nos primeiros meses de um financiamento longo o saldo devedor costuma ficar acima do valor de mercado do veículo, e isso trava a venda: quem quer vender precisa cobrir a diferença do próprio bolso. Entrada maior e prazo menor encurtam esse período.',
    },
  ],

  relacionadas: ['cet-custo-efetivo-total', 'depreciacao-de-veiculo', 'custo-mensal-do-carro'],
}
