/**
 * CALC-113 — Ganho de capital na venda de bens: carro, moto, joias, obras de
 * arte, cotas de empresa.
 *
 * "Vendi meu carro: tenho de pagar imposto?" A resposta quase sempre é não — e
 * a página mostra por quê: a isenção olha o PREÇO de venda no mês, e a maioria
 * dos carros vendidos com lucro fica abaixo do teto.
 *
 * Motor em `engine/calculadoras/venda-de-bens.ts`.
 */

import { PARAMETROS_VENDA_DE_BENS, calcularVendaDeBem } from '../engine/calculadoras/venda-de-bens'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { GANHO_DE_CAPITAL } from '../params/data/ganho-de-capital'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(GANHO_DE_CAPITAL)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularVendaDeBem(
    {
      valorDeVenda: centavos(numero(valores, 'valorDeVenda')),
      custoDeAquisicao: centavos(numero(valores, 'custo')),
      outrasVendasNoMes: centavos(numero(valores, 'outrasVendas')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.imposto,
      detalhamento: [
        { rotulo: 'Ganho de capital', valor: v.ganho, sinal: 'neutro' },
        { rotulo: 'Imposto', valor: v.imposto, sinal: 'debito' },
        { rotulo: 'Ganho depois do imposto', valor: v.liquido, sinal: 'credito' },
      ],
      destaques: [
        { rotulo: 'Situação', valor: v.isento ? 'Isento — pequeno valor' : v.ganho <= 0 ? 'Sem ganho a tributar' : 'Tributado' },
        { rotulo: 'Vendido no mês', valor: formatarReal(v.conjuntoNoMes) },
        { rotulo: 'Teto da isenção', valor: formatarReal(v.tetoIsencao) },
      ],
      notas: [
        'A isenção olha o PREÇO de venda no mês, não o lucro — e soma os bens da mesma natureza vendidos no mesmo mês. Dois carros de R$ 20 mil vendidos no mesmo mês somam R$ 40 mil.',
        'Passado o teto, o ganho inteiro é tributado: o teto é degrau, não dedução.',
        'Imóvel tem regras próprias (fatores de redução, imóvel único), assim como criptoativos e ações — cada um tem calculadora própria.',
        'O custo de aquisição é o que consta da declaração de bens, com as benfeitorias e despesas comprovadas. Prejuízo não gera imposto e não é compensado aqui.',
      ],
    },
  }
}

export const GANHO_DE_CAPITAL_NA_VENDA_DE_BENS: DefinicaoCalculadora = {
  id: 'CALC-113',
  slug: 'ganho-de-capital-na-venda-de-bens',
  nome: 'Imposto na venda de carro e outros bens',
  linhaDeContexto: 'Vendeu com lucro um carro, joias ou cotas de empresa? Se o preço passou do teto, há imposto sobre o ganho.',
  descricaoSeo:
    'Calcule o imposto de renda na venda de carro, moto, joias ou cotas de empresa: a isenção de pequeno valor e as alíquotas de 15% a 22,5% sobre o ganho.',

  campos: [
    {
      id: 'valorDeVenda',
      rotulo: 'Preço de venda',
      tipo: 'monetario',
      obrigatorio: true,
      padrao: 6_000_000,
      minimo: 0,
      maximo: 100_000_000_000,
    },
    {
      id: 'custo',
      rotulo: 'Custo de aquisição',
      tipo: 'monetario',
      obrigatorio: true,
      padrao: 4_500_000,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'O valor que consta na sua declaração de bens.',
    },
    {
      id: 'outrasVendas',
      rotulo: 'Outros bens da mesma natureza vendidos no mesmo mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'Outro carro, outra joia — eles somam para o teste do teto.',
    },
  ],

  parametrosRequeridos: [...PARAMETROS_VENDA_DE_BENS],

  rotuloResultado: 'Imposto sobre o ganho',

  calcular,

  faq: [
    {
      pergunta: 'Vendi meu carro. Preciso pagar imposto?',
      resposta:
        'Só se houver ganho — preço de venda maior que o custo de aquisição — e se o preço de venda no mês passar de R$ 35 mil. Abaixo disso o ganho é isento (Lei nº 9.250/1995, art. 22, II). Como carro costuma ser vendido por menos do que custou, o caso mais comum é não haver ganho algum.',
    },
    {
      pergunta: 'A isenção de R$ 35 mil é sobre o lucro?',
      resposta:
        'Não. É sobre o preço de venda no mês. Quem vende um bem por R$ 50 mil com R$ 2 mil de lucro paga imposto sobre esses R$ 2 mil; quem vende por R$ 34 mil com R$ 10 mil de lucro não paga.',
    },
    {
      pergunta: 'E se eu vender vários bens no mesmo mês?',
      resposta:
        'Bens da mesma natureza vendidos no mesmo mês somam para o teste do teto (parágrafo único do art. 22). Dois carros de R$ 20 mil vendidos no mesmo mês são R$ 40 mil, e a isenção deixa de valer para os dois.',
    },
    {
      pergunta: 'Quais são as alíquotas?',
      resposta:
        'De 15% a 22,5%, por faixas do ganho, conforme o art. 21 da Lei nº 8.981/1995 com a redação da Lei nº 13.259/2016. Cada alíquota incide só sobre a parcela do ganho dentro da sua faixa.',
    },
    {
      pergunta: 'Serve para imóvel, ações ou criptomoedas?',
      resposta:
        'Não. Imóvel tem fatores de redução e a isenção do imóvel único; criptoativos e ações têm regras próprias. Cada um tem a sua calculadora.',
    },
  ],

  relacionadas: ['imposto-sobre-criptoativos', 'ganho-de-capital-imovel', 'ir-em-bolsa-de-valores', 'custo-mensal-do-carro'],
}
