/**
 * CALC-119 — Juros simples.
 *
 * Sem parâmetro legal, como CALC-022: a taxa é digitada, e a página não tem
 * seletor de período. O que ela acrescenta ao "C × i × n" de qualquer livro é
 * a conversão de unidades declarada — prazo em dias com taxa ao mês, prazo em
 * meses com taxa ao ano — e a comparação com os juros compostos, que mostra
 * quando cada regime dá mais.
 *
 * Motor em `engine/calculadoras/juros-simples.ts`.
 */

import {
  calcularJurosSimples,
  type PeriodoDaTaxa,
  type UnidadeDoPrazo,
} from '../engine/calculadoras/juros-simples'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { numero, texto, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

const PERIODOS: readonly PeriodoDaTaxa[] = ['dia', 'mes', 'ano']
const UNIDADES: readonly UnidadeDoPrazo[] = ['dias', 'meses', 'anos']

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const periodo = texto(valores, 'periodoTaxa')
  const unidade = texto(valores, 'periodoPrazo')

  const r = calcularJurosSimples(
    {
      capital: centavos(numero(valores, 'capital')),
      taxa: basisPoints(numero(valores, 'taxa')),
      periodoDaTaxa: PERIODOS.includes(periodo as PeriodoDaTaxa) ? (periodo as PeriodoDaTaxa) : 'mes',
      prazo: numero(valores, 'prazo'),
      unidadeDoPrazo: UNIDADES.includes(unidade as UnidadeDoPrazo) ? (unidade as UnidadeDoPrazo) : 'meses',
    },
    dataReferencia,
  )
  if (!r.ok) return r
  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Juros no prazo', valor: formatarReal(v.juros) },
    { rotulo: 'Taxa acumulada no prazo', valor: formatarPercentual(v.taxaNoPrazoBp) },
  ]
  if (v.composto) {
    const diferenca = v.montante - v.composto.montante
    destaques.push({ rotulo: 'Em juros compostos, o montante seria', valor: formatarReal(v.composto.montante) })
    destaques.push({
      rotulo: 'Diferença para o composto',
      valor:
        diferenca === 0
          ? 'nenhuma'
          : diferenca > 0
            ? `o simples dá ${formatarReal(diferenca)} a mais`
            : `o simples dá ${formatarReal(-diferenca)} a menos`,
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.montante,
      detalhamento: [
        { rotulo: 'Capital', valor: centavos(numero(valores, 'capital')), sinal: 'neutro' },
        { rotulo: 'Juros', valor: v.juros, sinal: 'credito' },
        { rotulo: 'Montante', valor: v.montante, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        'No regime simples, os juros de cada período incidem sempre sobre o capital inicial — os juros já ganhos não rendem.',
        'Quando a taxa e o prazo estão em unidades diferentes, a conversão é proporcional, pelo calendário comercial: mês de 30 dias e ano de 360. Com o ano civil de 365 dias, o resultado de um prazo em dias muda um pouco.',
        'A comparação com os juros compostos aparece quando o prazo é de meses ou anos e a taxa é mensal ou anual. Em menos de um período da taxa, o simples rende mais; a partir daí, o composto passa à frente.',
        'Este cálculo não considera imposto de renda, IOF, tarifas nem inflação.',
      ],
    },
  }
}

export const JUROS_SIMPLES: DefinicaoCalculadora = {
  id: 'CALC-119',
  slug: 'juros-simples',
  nome: 'Juros simples',
  linhaDeContexto: 'Juros sobre o capital inicial, com taxa e prazo em qualquer unidade — e a comparação com os compostos.',
  descricaoSeo:
    'Calcule juros simples e montante com taxa ao dia, ao mês ou ao ano e prazo em dias, meses ou anos, e compare com o resultado em juros compostos.',

  campos: [
    {
      id: 'capital',
      rotulo: 'Capital',
      tipo: 'monetario',
      obrigatorio: true,
      padrao: 100_000,
      minimo: 1,
      maximo: 10_000_000_000,
    },
    {
      id: 'taxa',
      rotulo: 'Taxa de juros',
      tipo: 'percentual',
      obrigatorio: true,
      padrao: 200,
      minimo: 1,
      maximo: 100_000,
    },
    {
      id: 'periodoTaxa',
      rotulo: 'A taxa é',
      tipo: 'selecao',
      padrao: 'mes',
      opcoes: [
        { valor: 'mes', rotulo: 'Ao mês' },
        { valor: 'ano', rotulo: 'Ao ano' },
        { valor: 'dia', rotulo: 'Ao dia' },
      ],
    },
    {
      id: 'prazo',
      rotulo: 'Prazo',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 12,
      minimo: 1,
      maximo: 36_000,
    },
    {
      id: 'periodoPrazo',
      rotulo: 'O prazo está em',
      tipo: 'selecao',
      padrao: 'meses',
      opcoes: [
        { valor: 'meses', rotulo: 'Meses' },
        { valor: 'anos', rotulo: 'Anos' },
        { valor: 'dias', rotulo: 'Dias' },
      ],
      ajuda: 'Pode ser diferente da unidade da taxa: a conversão é feita e aparece na memória de cálculo.',
    },
  ],

  // Sem parâmetro legal: a taxa é do usuário — ver CALC-022.
  parametrosRequeridos: [],

  rotuloResultado: 'Montante no fim do prazo',

  calcular,

  faq: [
    {
      pergunta: 'Qual é a fórmula dos juros simples?',
      resposta:
        'Juros = capital × taxa × prazo, com a taxa e o prazo na mesma unidade. O montante é o capital mais os juros. R$ 1.000,00 a 2% ao mês por 12 meses dão R$ 240,00 de juros e R$ 1.240,00 de montante: são R$ 20,00 por mês, todo mês, porque o juro incide sempre sobre os mesmos R$ 1.000,00.',
    },
    {
      pergunta: 'Como converter a taxa ao ano em taxa ao mês nos juros simples?',
      resposta:
        'Dividindo por 12. No regime simples as taxas são proporcionais: 24% ao ano equivalem a 2% ao mês. É o contrário do regime composto, em que dividir por 12 subestima a taxa mensal e a conversão exige raiz. A calculadora aceita a taxa e o prazo em unidades diferentes e mostra a conversão na memória de cálculo.',
    },
    {
      pergunta: 'E se o prazo estiver em dias?',
      resposta:
        'A conta usa o calendário comercial: mês de 30 dias e ano de 360. Com 2% ao mês por 45 dias, o prazo é de 45 ÷ 30 = 1,5 mês, e os juros são 3% do capital. Há contratos que usam o ano civil de 365 dias — os chamados juros exatos —, e neles o resultado sai um pouco diferente.',
    },
    {
      pergunta: 'Juros simples ou compostos: qual rende mais?',
      resposta:
        'Depende do prazo. Em menos de um período da taxa — 15 dias com taxa mensal, 6 meses com taxa anual —, os juros simples dão mais. Em exatamente um período, os dois empatam. Depois disso, os compostos passam à frente, e a distância cresce cada vez mais depressa, porque os juros passam a render juros.',
    },
    {
      pergunta: 'Onde os juros simples ainda aparecem?',
      resposta:
        'Sempre que um contrato ou acordo prevê juros sobre o valor original, sem que os juros de um período entrem na base do seguinte — comum em acertos entre pessoas e em cobranças simples. Financiamentos, cartões e aplicações financeiras usam juros compostos, e para eles a calculadora de juros compostos é a certa.',
    },
  ],

  relacionadas: ['juros-compostos', 'porcentagem', 'regra-de-tres', 'cet-custo-efetivo-total'],
}
