/**
 * CALC-022 — Juros compostos com aportes.
 *
 * A única do lançamento **sem parâmetro legal**: `parametrosRequeridos` é
 * vazio, e a página lida com isso sem tratamento especial — a cobertura
 * combinada de zero parâmetros é nula, o seletor de período não aparece, e
 * nada mais muda.
 */

import { calcularJurosCompostos } from '../engine/calculadoras/juros-compostos'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual } from '../format/moeda'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const MESES_NO_ANO = 12

/**
 * Exportação de topo — ver a nota em `salario-liquido.ts`.
 *
 * Não usa `registro`: esta é a única calculadora sem parâmetro legal.
 */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const emAnos = texto(valores, 'periodoPrazo') === 'anos'
  const prazo = numero(valores, 'prazo')
  const meses = emAnos ? prazo * MESES_NO_ANO : prazo

  const r = calcularJurosCompostos(
    {
      valorInicial: centavos(numero(valores, 'valorInicial')),
      aporteMensal: centavos(numero(valores, 'aporteMensal')),
      taxa: basisPoints(numero(valores, 'taxa')),
      taxaAoAno: texto(valores, 'periodoTaxa') === 'ano',
      meses,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: r.valores.montante,
      detalhamento: [
        { rotulo: 'Total investido', valor: r.valores.totalInvestido, sinal: 'neutro' },
        { rotulo: 'Total em juros', valor: r.valores.totalJuros, sinal: 'credito' },
        { rotulo: 'Montante final', valor: r.valores.montante, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Taxa mensal aplicada', valor: formatarPercentual(r.valores.taxaMensalBp) },
        { rotulo: 'Prazo', valor: `${meses} ${meses === 1 ? 'mês' : 'meses'}` },
      ],
      tabela: {
        titulo: 'Evolução ano a ano',
        colunas: ['Investido', 'Juros', 'Saldo'],
        linhas: r.valores.evolucao.map((l) => ({
          rotulo: `Ano ${l.ano}`,
          valores: [l.investido, l.juros, l.saldo],
        })),
      },
      notas: ['Este cálculo não considera imposto de renda, taxas de administração nem inflação.'],
    },
  }
}

export const JUROS_COMPOSTOS: DefinicaoCalculadora = {
  id: 'CALC-022',
  slug: 'juros-compostos',
  nome: 'Juros compostos',
  linhaDeContexto: 'Quanto um valor rende ao longo do tempo, com aportes mensais.',
  descricaoSeo:
    'Calcule juros compostos com aportes mensais. Veja o montante, o total investido, o total em juros e a evolução ano a ano, com a conta à mostra.',

  campos: [
    {
      id: 'valorInicial',
      rotulo: 'Valor inicial',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
    },
    {
      id: 'aporteMensal',
      rotulo: 'Aporte mensal',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
    },
    {
      id: 'taxa',
      rotulo: 'Taxa de juros',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
    },
    {
      id: 'periodoTaxa',
      rotulo: 'Período da taxa',
      tipo: 'selecao',
      padrao: 'ano',
      opcoes: [
        { valor: 'ano', rotulo: 'Ao ano' },
        { valor: 'mes', rotulo: 'Ao mês' },
      ],
    },
    {
      id: 'prazo',
      rotulo: 'Prazo',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 12,
      minimo: 1,
      maximo: 600,
    },
    {
      id: 'periodoPrazo',
      rotulo: 'Unidade do prazo',
      tipo: 'selecao',
      padrao: 'meses',
      opcoes: [
        { valor: 'meses', rotulo: 'Meses' },
        { valor: 'anos', rotulo: 'Anos' },
      ],
    },
  ],

  // Nenhum. A taxa é digitada; não há constante legal envolvida.
  parametrosRequeridos: [],

  rotuloResultado: 'Montante final',

  calcular,

  faq: [
    {
      pergunta: 'Por que o tempo importa mais que a taxa?',
      resposta:
        'Porque os juros do mês passam a render no mês seguinte. Nos primeiros anos a maior parte do saldo é o que você depositou; com o tempo, a parcela de juros cresce e ultrapassa os aportes. A tabela de evolução mostra esse cruzamento acontecendo ano a ano.',
    },
    {
      pergunta: 'Como a taxa anual vira taxa mensal?',
      resposta:
        'Não é a taxa anual dividida por doze. A conversão correta considera que os juros de cada mês rendem nos meses seguintes, então a taxa mensal equivalente é a raiz décima segunda do fator anual. O valor efetivamente aplicado aparece no resultado, para você conferir.',
    },
    {
      pergunta: 'O aporte do mês rende no próprio mês?',
      resposta:
        'Não. O cálculo capitaliza o saldo e só então recebe o aporte, que é a convenção de depósito ao fim do período. É a hipótese mais conservadora, e a memória de cálculo mostra a ordem das operações mês a mês.',
    },
    {
      pergunta: 'Por que o resultado não bate exatamente com o do meu banco?',
      resposta:
        'Este cálculo arredonda o rendimento a cada mês, como uma conta real faz, e não considera imposto de renda, taxas de administração nem inflação. Produtos diferentes também têm convenções diferentes de contagem de dias. Use o resultado como referência, não como extrato.',
    },
  ],

  relacionadas: ['salario-liquido'],
}
