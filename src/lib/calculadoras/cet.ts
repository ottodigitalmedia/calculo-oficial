/**
 * CALC-024 — CET, custo efetivo total.
 *
 * `03-functional-spec` não cobre esta calculadora — ele especifica as dez do
 * v1. Os textos aqui foram escritos junto com ela, seguindo os padrões de §1.
 *
 * **É a chave da categoria de crédito.** O motor de taxa interna que ela exige
 * serve também a CALC-029, CALC-056 e ao comparativo de CALC-031.
 */

import { calcularCet } from '../engine/calculadoras/credito'
import { centavos } from '../engine/types'
import { formatarPercentual } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularCet(
    {
      valorLiberado: centavos(numero(valores, 'valorLiberado')),
      valorParcela: centavos(numero(valores, 'valorParcela')),
      prazoMeses: numero(valores, 'prazoMeses'),
      despesasNaLiberacao: centavos(numero(valores, 'despesas')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.custoTotal,
      detalhamento: [
        { rotulo: 'Valor que de fato entrou', valor: v.recebidoDeFato, sinal: 'credito' },
        { rotulo: 'Total das parcelas', valor: v.totalPago, sinal: 'debito' },
        { rotulo: 'Custo total do crédito', valor: v.custoTotal, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'CET ao mês', valor: formatarPercentual(v.cetMensal) },
        { rotulo: 'CET ao ano', valor: formatarPercentual(v.cetAnual) },
      ],
      notas: [
        'O CET é a taxa que considera tudo: juros, tarifas, tributos e seguros. Ele é sempre ' +
          'maior que a taxa de juros anunciada no contrato, e é o número que permite comparar ' +
          'duas propostas.',
      ],
    },
  }
}

export const CET: DefinicaoCalculadora = {
  id: 'CALC-024',
  slug: 'cet-custo-efetivo-total',
  nome: 'CET — custo efetivo total',
  linhaDeContexto:
    'Quanto o empréstimo custa de verdade — com tarifas e seguros dentro da conta.',
  descricaoSeo:
    'Calcule o CET de um empréstimo pelo valor recebido, pela parcela e pelo prazo. Veja a taxa mensal e anual, o custo total e a norma do Banco Central.',

  campos: [
    {
      id: 'valorLiberado',
      rotulo: 'Valor do empréstimo',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'O valor contratado, antes de descontos.',
    },
    {
      id: 'valorParcela',
      rotulo: 'Valor de cada parcela',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'prazoMeses',
      rotulo: 'Número de parcelas',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 600,
    },
    {
      id: 'despesas',
      rotulo: 'Tarifas, seguros e IOF descontados na liberação',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'O que foi cobrado antes de o dinheiro chegar na sua conta.',
    },
  ],

  // Sem parâmetro legal: tudo é digitado. A norma define o método, não valores.
  parametrosRequeridos: [],

  rotuloResultado: 'Custo total do crédito',

  calcular,

  faq: [
    {
      pergunta: 'Qual a diferença entre a taxa de juros e o CET?',
      resposta:
        'A taxa de juros olha só os juros sobre o valor contratado. O CET olha o que de fato entrou na sua conta e tudo o que sai dela: juros, tarifas, tributos e seguros. Por isso o CET é sempre maior — e é o único número que permite comparar duas propostas de bancos diferentes.',
    },
    {
      pergunta: 'De onde vem essa definição?',
      resposta:
        'Da Resolução CMN nº 4.881, de 23 de dezembro de 2020. O art. 2º define o CET como a taxa que representa de forma consolidada os encargos e as despesas da operação; o art. 3º diz o que entra na conta; e o art. 4º traz a fórmula. A norma também obriga a instituição a informar o CET antes da contratação.',
    },
    {
      pergunta: 'Por que o cálculo é feito por tentativa?',
      resposta:
        'Porque não existe fórmula fechada para essa taxa. O CET é o número que faz o valor presente de todas as parcelas coincidir com o que você recebeu, e ele só pode ser encontrado testando taxas até fechar. O cálculo aqui usa busca por bisseção, que sempre termina e nunca diverge.',
    },
    {
      pergunta: 'As tarifas mudam tanto assim o resultado?',
      resposta:
        'Mudam, e é justamente por isso que a norma manda deduzi-las. Uma tarifa cobrada na liberação reduz o que entrou no seu bolso sem reduzir nenhuma parcela — o efeito é o mesmo de uma taxa de juros maior, e ele não aparece na taxa anunciada.',
    },
    {
      pergunta: 'Serve para financiamento de veículo e imóvel?',
      resposta:
        'Serve para qualquer operação com parcelas iguais e mensais. Se as parcelas variam — como no sistema SAC —, o CET exige o fluxo completo, e o cálculo aqui não o cobre. Para comparar sistemas de amortização, use a calculadora de SAC e Price.',
    },
  ],

  relacionadas: ['amortizacao-sac-price', 'juros-compostos'],
}
