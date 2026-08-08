/**
 * CALC-069 — Orçamento doméstico: a regra 50/30/20.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **É a quarta do catálogo a tratar um número de bolso como campo** — depois dos
 * 30% de CALC-032, dos seis meses de CALC-044 e da regra dos 4% de CALC-043. O
 * 50/30/20 vem de um livro, não de norma, e nada obriga ninguém a segui-lo. Os
 * três percentuais são campos com padrão declarado, e a soma deles é exibida:
 * quem quiser 60/20/20 informa e a conta acompanha.
 *
 * `docs/18` §3.4 registra que "é divisão, e o valor está no texto, não na
 * conta". É exatamente por isso que o texto aqui é longo e a aritmética é curta.
 */

import { calcularOrcamento } from '../engine/calculadoras/consumo'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const rendaLiquida = centavos(numero(valores, 'rendaLiquida'))

  const r = calcularOrcamento(
    {
      rendaLiquida,
      percentualNecessidadesBp: basisPoints(numero(valores, 'percentualNecessidades')),
      percentualDesejosBp: basisPoints(numero(valores, 'percentualDesejos')),
      percentualPoupancaBp: basisPoints(numero(valores, 'percentualPoupanca')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As quatro linhas somam a renda informada — inclusive os centavos que sobram. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Necessidades', valor: v.necessidades, sinal: 'debito' },
    { rotulo: 'Desejos', valor: v.desejos, sinal: 'debito' },
    { rotulo: 'Poupança e dívidas', valor: v.poupanca, sinal: 'debito' },
  ]
  if (v.naoAlocado !== 0) {
    linhas.push({ rotulo: 'Ainda sem destino', valor: v.naoAlocado, sinal: 'debito' })
  }
  linhas.push({ rotulo: 'Renda líquida do mês', valor: rendaLiquida, sinal: 'neutro' })

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.poupanca,
      detalhamento: linhas,
      destaques: [
        { rotulo: 'A fatia de poupança em doze meses', valor: formatarReal(v.poupancaEmDozeMeses) },
        { rotulo: 'Percentuais informados somam', valor: formatarPercentual(v.somaDosPercentuais) },
      ],
      notas: [
        'A divisão 50/30/20 NÃO é norma. Ela vem de um livro de finanças pessoais e é uma regra ' +
          'de bolso — útil como ponto de partida, e não como obrigação. Os três percentuais aqui ' +
          'são campos: quem precisa de 60 para necessidades informa 60, e a conta acompanha.',
        'Use a renda líquida, o que efetivamente cai na conta depois dos descontos. Para quem é ' +
          'CLT, a calculadora de salário líquido chega a esse número a partir do bruto.',
        'Necessidades são o que não dá para cortar sem mudar de vida, incluindo o pagamento ' +
          'mínimo das dívidas que já existem. O que passa do mínimo em quitação de dívida ' +
          'pertence à terceira fatia, junto com a poupança — porque abater dívida cara rende ' +
          'mais que quase qualquer aplicação.',
      ],
    },
  }
}

export const ORCAMENTO: DefinicaoCalculadora = {
  id: 'CALC-069',
  slug: 'orcamento-domestico',
  nome: 'Orçamento doméstico 50/30/20',
  linhaDeContexto: 'Como dividir a renda do mês — com os percentuais no seu controle, não fixos.',
  descricaoSeo:
    'Divida sua renda líquida entre necessidades, desejos e poupança pela regra 50/30/20, ou pelos percentuais que escolher. Veja o valor de cada fatia.',

  campos: [
    {
      id: 'rendaLiquida',
      rotulo: 'Renda líquida do mês',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'O que cai na conta depois dos descontos, somando todas as fontes.',
    },
    {
      id: 'percentualNecessidades',
      rotulo: 'Percentual para necessidades',
      tipo: 'percentual',
      padrao: 5_000,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Moradia, alimentação, transporte, saúde, contas fixas e o mínimo das dívidas.',
    },
    {
      id: 'percentualDesejos',
      rotulo: 'Percentual para desejos',
      tipo: 'percentual',
      padrao: 3_000,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Lazer, assinaturas, restaurante — o que poderia ser suspenso num mês difícil.',
    },
    {
      id: 'percentualPoupanca',
      rotulo: 'Percentual para poupança e dívidas',
      tipo: 'percentual',
      padrao: 2_000,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Reserva, investimento e o que for além do mínimo das dívidas.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Quanto guardar por mês',

  calcular,

  faq: [
    {
      pergunta: 'A regra 50/30/20 é obrigatória?',
      resposta:
        'Não é regra de nada além de um livro de finanças pessoais. Não há norma, órgão ou dispositivo legal que divida renda em fatias, e a proporção que funciona depende do custo de moradia da sua cidade, do tamanho da família e da fase da vida. Aqui os três percentuais são campos justamente por isso: o 50/30/20 é o ponto de partida, não o destino.',
    },
    {
      pergunta: 'E se as necessidades já passam de 50%?',
      resposta:
        'É a situação mais comum de quem mora em cidade cara, e ela não significa que o orçamento está errado. Informe o percentual real e veja o que sobra para as outras duas fatias — o valor dessa conta é enxergar o tamanho do aperto, não receber um veredito. Com as necessidades em 70%, a pergunta seguinte deixa de ser como dividir e passa a ser o que reduzir ou como aumentar a renda.',
    },
    {
      pergunta: 'Dívida entra em qual fatia?',
      resposta:
        'O pagamento mínimo, que não dá para deixar de fazer, entra em necessidades. O que você paga além do mínimo pertence à terceira fatia, ao lado da poupança — e não por simetria, mas por aritmética: abater dívida de rotativo ou de cheque especial economiza ao mês muito mais do que qualquer aplicação conservadora rende. As calculadoras de rotativo e de cheque especial mostram esse custo do outro lado.',
    },
    {
      pergunta: 'Uso a renda bruta ou a líquida?',
      resposta:
        'A líquida, que é o que de fato entra na conta. Usar a bruta infla as três fatias e dá um plano que não fecha no fim do mês, porque INSS e imposto de renda saem antes. Quem é CLT chega ao número líquido pela calculadora de salário líquido; quem tem renda variável costuma usar a média dos últimos meses, e a fatia de poupança serve também para amortecer os meses fracos.',
    },
  ],

  relacionadas: ['salario-liquido', 'reserva-de-emergencia', 'consumo-de-energia'],
}
