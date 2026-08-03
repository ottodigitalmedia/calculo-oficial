/**
 * CALC-028 — Plano de quitação: bola de neve vs. avalanche.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A comparação só é honesta porque o desembolso mensal é o mesmo nas duas.**
 * Se uma estratégia gastasse mais por mês, ela quitaria antes por gastar mais, e
 * a página estaria medindo a carteira em vez da ordem. O que varia é apenas
 * QUAL dívida recebe a sobra — e é essa diferença, isolada, que a tela mostra.
 *
 * A avalanche sempre custa menos ou igual: cada real vai para onde evita mais
 * juro. Isso é aritmética, e a página diz. O que a página se recusa a dizer é
 * que ela é sempre a melhor escolha — a bola de neve entrega uma dívida a menos
 * na lista mais cedo, e desistir no meio custa mais que a diferença de juros.
 */

import { calcularPlanoDeQuitacao } from '../engine/calculadoras/listas'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import {
  lerLista,
  numero,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Meses em português, para o destaque não sair "1 meses". */
function emMeses(n: number): string {
  return `${n} ${n === 1 ? 'mês' : 'meses'}`
}

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularPlanoDeQuitacao(
    {
      dividas: lerLista(valores, 'dividas', 3),
      extraMensal: centavos(numero(valores, 'extraMensal')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /**
   * As linhas somam o total pago pela avalanche — que é o valor principal.
   * Saldo mais juros é exatamente o que sai do bolso.
   */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Saldo devedor de hoje', valor: v.saldoTotal, sinal: 'neutro' },
    /**
     * `neutro`, e não `debito`: a linha SOMA ao saldo para chegar ao total pago,
     * e o sinal de menos que `debito` imprime faria a coluna parecer não fechar
     * — o defeito de §7.12. A cor não substitui a leitura da conta.
     */
    { rotulo: 'Juros pagos no caminho', valor: v.avalanche.jurosPagos, sinal: 'neutro' },
    { rotulo: 'Total pago pela avalanche', valor: v.avalanche.totalPago, sinal: 'neutro' },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.avalanche.totalPago,
      detalhamento: linhas,
      destaques: [
        { rotulo: 'Sai do bolso por mês', valor: formatarReal(v.desembolsoMensal) },
        { rotulo: 'Tempo pela avalanche', valor: emMeses(v.avalanche.meses) },
        { rotulo: 'Tempo pela bola de neve', valor: emMeses(v.bolaDeNeve.meses) },
        {
          rotulo: 'Economia da avalanche',
          valor: formatarReal(v.economiaDaAvalanche),
        },
      ],
      tabela: {
        titulo: 'As duas estratégias, com o mesmo dinheiro por mês',
        colunas: ['Total pago', 'Juros pagos'],
        linhas: [
          {
            rotulo: `Avalanche — ${emMeses(v.avalanche.meses)}`,
            valores: [v.avalanche.totalPago, v.avalanche.jurosPagos],
          },
          {
            rotulo: `Bola de neve — ${emMeses(v.bolaDeNeve.meses)}`,
            valores: [v.bolaDeNeve.totalPago, v.bolaDeNeve.jurosPagos],
          },
        ],
      },
      notas: [
        'As duas estratégias gastam exatamente o MESMO por mês. A única diferença é para qual ' +
          'dívida vai a sobra depois de pagas as parcelas mínimas — e é só isso que produz a ' +
          'diferença no total.',
        'A avalanche ataca a maior TAXA. Ela sempre custa menos ou igual, porque cada real vai ' +
          'para onde evita mais juro. A bola de neve ataca o menor SALDO, e entrega uma dívida ' +
          'a menos na lista mais cedo.',
        'Conforme uma dívida é quitada, a parcela dela some do mínimo e engorda a sobra do mês ' +
          'seguinte. Esse efeito acontece nas duas estratégias — é o que faz o plano acelerar ' +
          'no fim.',
        ...(v.mesesDeDiferenca === 0 && v.economiaDaAvalanche === 0
          ? [
              'Com os números informados, as duas dão no mesmo. Acontece quando a dívida de maior ' +
                'taxa também é a de menor saldo — a ordem de ataque coincide.',
            ]
          : []),
        'A simulação supõe que você paga o mesmo valor todo mês, sem atraso e sem dívida nova. ' +
          'Um mês pulado recoloca juros sobre o saldo e adia tudo — é a diferença entre o plano ' +
          'e o que costuma acontecer.',
      ],
    },
  }
}

export const PLANO_DE_QUITACAO: DefinicaoCalculadora = {
  id: 'CALC-028',
  slug: 'plano-de-quitacao',
  nome: 'Plano de quitação de dívidas',
  linhaDeContexto:
    'Bola de neve ou avalanche: com o mesmo dinheiro por mês, qual ordem sai mais barata.',
  descricaoSeo:
    'Compare as estratégias bola de neve e avalanche para quitar suas dívidas. Veja quanto tempo cada uma leva, quanto de juros você paga e qual economiza mais.',

  campos: [
    {
      id: 'dividas',
      rotulo: 'Suas dívidas',
      tipo: 'lista',
      obrigatorio: true,
      colunas: [
        { id: 'saldo', rotulo: 'Saldo devedor', tipo: 'monetario', maximo: 1_000_000_000 },
        { id: 'taxa', rotulo: 'Juros ao mês', tipo: 'percentual', maximo: 50_000 },
        { id: 'minima', rotulo: 'Parcela mínima', tipo: 'monetario', maximo: 100_000_000 },
      ],
      linhasIniciais: 3,
      maximoDeLinhas: 15,
      ajuda:
        'Uma linha por dívida. A taxa é a mensal do contrato ou da fatura. Linhas em branco são ignoradas.',
    },
    {
      id: 'extraMensal',
      rotulo: 'Quanto sobra por mês, além das mínimas',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'É esse valor que vai para a dívida escolhida pela estratégia. Sem ele, as duas empatam.',
    },
  ],

  // Sem parâmetro legal: saldos e taxas são do contrato de cada um.
  parametrosRequeridos: [],

  rotuloResultado: 'Total pago pela avalanche',

  calcular,

  faq: [
    {
      pergunta: 'Qual é a diferença entre bola de neve e avalanche?',
      resposta:
        'A ordem de ataque, e só. Nas duas você paga as parcelas mínimas de todas as dívidas e joga o que sobra em uma delas. A avalanche escolhe a de maior taxa de juros; a bola de neve escolhe a de menor saldo, que morre mais rápido. Como o valor mensal é o mesmo nas duas, toda a diferença no total pago vem dessa escolha.',
    },
    {
      pergunta: 'A avalanche é sempre melhor?',
      resposta:
        'Em dinheiro, sim — ou empata. Cada real que vai para a dívida mais cara é o real que evita mais juro, e a aritmética não deixa ser diferente. Mas o plano que economiza mais é inútil se for abandonado no terceiro mês, e a bola de neve rende algo que a planilha não mede: uma dívida a menos na lista, mais cedo. Se a diferença entre as duas for pequena, escolher a que você consegue sustentar é a decisão certa.',
    },
    {
      pergunta: 'Por que o plano acelera com o tempo?',
      resposta:
        'Porque quando uma dívida é quitada, a parcela mínima dela deixa de existir e aquele dinheiro passa a engordar a sobra do mês seguinte. O valor que sai do seu bolso continua o mesmo, mas a fatia que ataca o principal cresce a cada dívida encerrada. Esse efeito acontece nas duas estratégias — o nome "bola de neve" descreve o efeito, não a estratégia que o tem.',
    },
    {
      pergunta: 'Onde encontro a taxa de juros de cada dívida?',
      resposta:
        'Na fatura ou no contrato. No cartão de crédito, a taxa do rotativo e a do parcelamento aparecem na própria fatura; no cheque especial, no extrato ou no aplicativo do banco; em empréstimos, no contrato e no demonstrativo de custo efetivo. Informe a taxa MENSAL. Se você só tem a anual, ela não pode ser dividida por doze — a conversão correta usa juro composto, e usar a divisão simples subestima o custo.',
    },
    {
      pergunta: 'A calculadora disse que as dívidas não são quitadas. O que fazer?',
      resposta:
        'Significa que, com o valor mensal informado, os juros crescem mais rápido que o pagamento — o saldo nunca chega a zero. Confira se as taxas foram digitadas ao mês e não ao ano, que é o engano mais comum. Se estiverem certas, o número mensal não é suficiente, e o caminho passa por renegociar a taxa antes de escolher qualquer estratégia de ordem.',
    },
  ],

  relacionadas: ['juros-compostos', 'orcamento-domestico', 'divisao-de-conta'],
}
