/**
 * CALC-026 — Quitação antecipada: economia de juros.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **É a primeira do bloco de crédito que tem norma a citar.** CALC-024 e
 * CALC-025 são fórmulas; esta aplica um direito: o art. 52, § 2º do Código de
 * Defesa do Consumidor assegura a liquidação antecipada *"mediante redução
 * proporcional dos juros e demais acréscimos"*. A palavra que decide a conta é
 * **proporcional** — quitar antes não é pagar a soma das parcelas restantes, é
 * pagar o valor presente delas.
 */

import { calcularQuitacaoAntecipada } from '../engine/calculadoras/credito'
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
  const r = calcularQuitacaoAntecipada(
    {
      valorParcela: centavos(numero(valores, 'valorParcela')),
      parcelasRestantes: numero(valores, 'parcelasRestantes'),
      taxaMensal: basisPoints(numero(valores, 'taxaMensal')),
      valorDisponivel: centavos(numero(valores, 'valorDisponivel')),
      modalidade: texto(valores, 'modalidade') === 'reduzir-parcela'
        ? 'reduzir-parcela'
        : 'reduzir-prazo',
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Saldo devedor hoje', valor: formatarReal(v.saldoPresente) },
    { rotulo: 'Desconto sobre a soma das parcelas', valor: formatarPercentual(v.descontoBp) },
  ]

  if (!v.quitacaoTotal) {
    destaques.push(
      { rotulo: 'Parcelas restantes', valor: `${v.novoPrazo}` },
      { rotulo: 'Nova parcela', valor: formatarReal(v.novaParcela) },
    )
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.economia,
      detalhamento: [
        { rotulo: 'Seguindo o contrato até o fim', valor: v.somaDasParcelas, sinal: 'debito' },
        { rotulo: 'Pago agora', valor: v.valorPagoAgora, sinal: 'debito' },
        { rotulo: 'Ainda a pagar depois', valor: v.totalFuturo, sinal: 'debito' },
        { rotulo: 'Economia de juros', valor: v.economia, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        v.quitacaoTotal
          ? 'O banco é obrigado a aceitar a quitação antecipada e a reduzir os juros na ' +
            'proporção do tempo que deixou de correr. Se o valor oferecido para quitar for ' +
            'a soma das parcelas que faltam, ele está cobrando juros de meses que não vão ' +
            'existir — peça o cálculo do saldo devedor por escrito.'
          : 'Entre reduzir o prazo e reduzir a parcela, reduzir o prazo economiza mais: cada ' +
            'mês eliminado é um mês inteiro de juros que deixa de existir. Reduzir a parcela ' +
            'alivia o orçamento agora e custa mais no total.',
        'A conta usa a taxa que você informou. Se o contrato tiver seguro prestamista ou taxa ' +
          'de administração embutidos na parcela, o saldo real será um pouco diferente — o ' +
          'número exato só o banco pode emitir, e ele é obrigado a fornecê-lo.',
      ],
    },
  }
}

export const QUITACAO_ANTECIPADA: DefinicaoCalculadora = {
  id: 'CALC-026',
  slug: 'quitacao-antecipada',
  nome: 'Quitação antecipada — economia de juros',
  linhaDeContexto:
    'Quanto custa quitar hoje, com os juros reduzidos na proporção que a lei manda.',
  descricaoSeo:
    'Calcule o saldo devedor real e quanto se economiza quitando antes do prazo, com a redução de juros que o art. 52, § 2º do CDC assegura.',

  campos: [
    {
      id: 'valorParcela',
      rotulo: 'Valor de cada parcela',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'parcelasRestantes',
      rotulo: 'Parcelas que ainda faltam',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 600,
    },
    {
      id: 'taxaMensal',
      rotulo: 'Taxa de juros ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'A taxa do contrato. Consta no contrato e na fatura, ao lado do CET.',
    },
    {
      id: 'valorDisponivel',
      rotulo: 'Quanto você pretende pagar agora',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Deixe em branco para simular a quitação total.',
    },
    {
      id: 'modalidade',
      rotulo: 'Na amortização parcial, o que reduzir',
      tipo: 'selecao',
      padrao: 'reduzir-prazo',
      opcoes: [
        { valor: 'reduzir-prazo', rotulo: 'Reduzir o prazo — economiza mais' },
        { valor: 'reduzir-parcela', rotulo: 'Reduzir a parcela — alivia o mês' },
      ],
      ajuda: 'A escolha é sua, e o banco é obrigado a oferecer as duas.',
    },
  ],

  // Sem parâmetro legal: o CDC dá o método, não um valor com vigência.
  parametrosRequeridos: [],

  rotuloResultado: 'Economia de juros',

  calcular,

  faq: [
    {
      pergunta: 'O banco pode recusar a quitação antecipada?',
      resposta:
        'Não. O art. 52, § 2º do Código de Defesa do Consumidor assegura a liquidação antecipada do débito, total ou parcialmente, mediante redução proporcional dos juros e demais acréscimos. É direito do consumidor, e não uma cortesia da instituição.',
    },
    {
      pergunta: 'Por que o valor para quitar é menor que a soma das parcelas?',
      resposta:
        'Porque dentro de cada parcela futura há juros que remuneram o tempo até o vencimento dela. Antecipando, esse tempo não corre — e a lei manda reduzir os juros na mesma proporção. Pagar a soma nua das parcelas seria pagar juros de meses que não vão existir.',
    },
    {
      pergunta: 'Compensa mais reduzir o prazo ou a parcela?',
      resposta:
        'Reduzir o prazo economiza mais, sempre. Cada mês eliminado do fim do contrato é um mês inteiro de juros que deixa de ser cobrado. Reduzir a parcela mantém o contrato correndo pelo mesmo tempo e só distribui o alívio — faz sentido quando o problema é o orçamento do mês, não o custo total.',
    },
    {
      pergunta: 'Esse é exatamente o valor que o banco vai cobrar?',
      resposta:
        'É a estimativa a partir da taxa que você informou. Contratos reais podem ter seguro prestamista e taxa de administração embutidos na parcela, e isso muda o saldo em alguma medida. O número oficial é o banco que emite — e ele é obrigado a informá-lo quando solicitado.',
    },
    {
      pergunta: 'Vale a pena quitar ou é melhor investir o dinheiro?',
      resposta:
        'A comparação é entre a taxa do financiamento e o rendimento líquido do investimento. Se o crédito custa mais ao mês do que a aplicação rende depois do imposto, quitar rende mais que investir — e sem risco nenhum. Taxas de crédito ao consumidor costumam ser bem maiores que a de qualquer aplicação conservadora.',
    },
  ],

  relacionadas: ['amortizacao-sac-price', 'cet-custo-efetivo-total', 'juros-compostos'],
}
