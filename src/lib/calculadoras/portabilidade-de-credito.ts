/**
 * CALC-029 — Portabilidade de crédito.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A armadilha da portabilidade é o PRAZO, não a taxa.** A proposta que chega
 * mostra a parcela nova menor que a atual, e a conclusão parece óbvia. Mas
 * parcela menor com prazo maior custa mais no total, mesmo com taxa menor — e é
 * assim que se troca uma dívida cara e curta por uma barata e longa que sai mais
 * cara. A página compara os dois cenários e mostra, separadamente, o que a taxa
 * nova entregaria **sem alongar** a dívida.
 *
 * **A taxa do contrato atual é descoberta, não perguntada.** Quase ninguém sabe
 * qual é, e é ela que a proposta precisa bater.
 */

import { calcularPortabilidade } from '../engine/calculadoras/credito'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const parcelasRestantes = numero(valores, 'parcelasRestantes')
  const novoPrazo = numero(valores, 'novoPrazoMeses')

  const r = calcularPortabilidade(
    {
      saldoDevedor: centavos(numero(valores, 'saldoDevedor')),
      parcelaAtual: centavos(numero(valores, 'parcelaAtual')),
      parcelasRestantes,
      novaTaxaMensalBp: basisPoints(numero(valores, 'novaTaxa')),
      novoPrazoMeses: novoPrazo,
      custosDaPortabilidade: centavos(numero(valores, 'custos')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Taxa que seu contrato cobra hoje', valor: formatarPercentual(v.taxaAtualBp) },
    { rotulo: 'Parcela nova', valor: formatarReal(v.novaParcela) },
    {
      rotulo: v.diferencaDeParcela >= 0 ? 'A parcela cai' : 'A parcela sobe',
      valor: formatarReal(Math.abs(v.diferencaDeParcela)),
    },
    { rotulo: 'CET da nova operação, ao mês', valor: formatarPercentual(v.cetNovoMensal) },
  ]

  if (v.prazoAumentou) {
    destaques.push({
      rotulo: 'Com a taxa nova mantendo o prazo atual, o total seria',
      valor: formatarReal(v.totalNovoNoMesmoPrazo),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.economia,
      detalhamento: [
        { rotulo: 'Total que falta pagar hoje', valor: v.totalAtual, sinal: 'neutro' },
        { rotulo: 'Total pela proposta nova', valor: v.totalNovo, sinal: 'neutro' },
        {
          rotulo: v.economia >= 0 ? 'Economia' : 'Custo a mais',
          valor: v.economia,
          sinal: 'neutro',
        },
      ],
      destaques,
      notas: [
        'Compare pelo TOTAL, não pela parcela. Parcela menor com prazo maior custa mais dinheiro, ' +
          'mesmo com taxa menor — e é assim que uma dívida cara e curta vira uma barata e longa ' +
          'que sai mais cara.',
        ...(v.prazoAumentou
          ? [
              `A proposta alonga a dívida em ${v.mesesAMais} ${v.mesesAMais === 1 ? 'mês' : 'meses'}. ` +
                'O destaque com o prazo atual mantido mostra o que a taxa nova entrega SEM ' +
                'alongar — é o que separa ganho de juros de alívio de caixa.',
            ]
          : [
              'A proposta mantém ou encurta o prazo, e nesse caso a comparação pelo total é ' +
                'direta: o que sobra é ganho de taxa.',
            ]),
        'A taxa do seu contrato atual é descoberta a partir do saldo devedor, da parcela e das ' +
          'parcelas que faltam — não é preciso saber qual é. Peça o saldo para quitação ao seu ' +
          'banco: é ele que entra no primeiro campo, e não a soma das parcelas restantes.',
        'Alívio de caixa é motivo legítimo para alongar. Só não é economia, e a diferença entre ' +
          'as duas coisas é o que esta página existe para deixar visível.',
        'A portabilidade é feita entre bancos, e o banco atual costuma fazer contraproposta ' +
          'quando é avisado. A proposta que você trouxe aqui serve para negociar dos dois lados.',
      ],
    },
  }
}

export const PORTABILIDADE_DE_CREDITO: DefinicaoCalculadora = {
  id: 'CALC-029',
  slug: 'portabilidade-de-credito',
  nome: 'Portabilidade de crédito',
  linhaDeContexto: 'Se a proposta compensa de verdade — comparada pelo total, não pela parcela.',
  descricaoSeo:
    'Descubra se vale a pena levar sua dívida para outro banco. Compare o total pago, a taxa do seu contrato atual e o efeito de alongar o prazo.',

  campos: [
    {
      id: 'saldoDevedor',
      rotulo: 'Saldo devedor de hoje',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
      ajuda: 'O valor para quitar hoje, que o banco é obrigado a informar. Não é a soma das parcelas que faltam.',
    },
    {
      id: 'parcelaAtual',
      rotulo: 'Parcela que você paga hoje',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'parcelasRestantes',
      rotulo: 'Quantas parcelas ainda faltam',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 36,
      minimo: 1,
      maximo: 600,
    },
    {
      id: 'novaTaxa',
      rotulo: 'Juros ao mês na proposta nova',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 1,
      maximo: 50_000,
    },
    {
      id: 'novoPrazoMeses',
      rotulo: 'Prazo da proposta nova',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 36,
      minimo: 1,
      maximo: 600,
      ajuda: 'Para comparar só o ganho de taxa, use o mesmo número de parcelas que ainda faltam.',
    },
    {
      id: 'custos',
      rotulo: 'Custos da portabilidade',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'IOF e tarifas da nova operação, quando houver. Estão na proposta.',
    },
  ],

  // Sem parâmetro legal: saldo, parcela e taxas são do contrato.
  parametrosRequeridos: [],

  rotuloResultado: 'Quanto a portabilidade economiza',

  calcular,

  faq: [
    {
      pergunta: 'A parcela cai. Não basta isso?',
      resposta:
        'Não. Parcela menor pode significar apenas prazo maior, e prazo maior aumenta o total mesmo com taxa menor. É a troca mais comum e a menos percebida: sai uma dívida cara e curta, entra uma barata e longa que custa mais dinheiro. Por isso o resultado compara os totais, e quando a proposta alonga o prazo mostra separadamente o que a taxa nova entregaria sem alongar.',
    },
    {
      pergunta: 'Onde encontro o saldo devedor?',
      resposta:
        'Você pede ao seu banco o valor para quitação, e ele é obrigado a informar. Atenção a não confundir com a soma das parcelas que faltam: essa soma inclui juros que ainda não venceram, e usá-la aqui distorceria toda a comparação. O saldo para quitação já vem com os juros futuros retirados na proporção que a lei manda.',
    },
    {
      pergunta: 'Como a calculadora sabe a taxa do meu contrato?',
      resposta:
        'Ela descobre. Com o saldo devedor, o valor da parcela e quantas parcelas faltam, existe uma única taxa que faz essa conta fechar, e é ela que a calculadora encontra por busca — a mesma técnica que a norma manda usar para o custo efetivo total. É útil porque quase ninguém sabe a taxa do próprio contrato, e é ela que a proposta nova precisa bater.',
    },
    {
      pergunta: 'Alongar o prazo é sempre ruim?',
      resposta:
        'Não, mas não é economia. Trocar uma parcela que não cabe no orçamento por uma que cabe é motivo legítimo, e às vezes é o que evita o atraso — que custa muito mais caro. O que a página faz é separar as duas coisas: alívio de caixa é uma decisão, economia de juros é outra, e a proposta costuma vender a segunda mostrando só a primeira.',
    },
    {
      pergunta: 'Meu banco pode cobrir a oferta?',
      resposta:
        'Costuma tentar. Quando a portabilidade é solicitada, o banco atual é comunicado e com frequência apresenta contraproposta para manter o cliente. Vale rodar as duas nesta página, com o mesmo prazo, e comparar os totais — a proposta que você trouxe serve para negociar dos dois lados.',
    },
  ],

  relacionadas: ['cet-custo-efetivo-total', 'quitacao-antecipada', 'plano-de-quitacao'],
}
