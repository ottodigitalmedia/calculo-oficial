/**
 * CALC-082 — Desconto do vale-transporte.
 *
 * A regra de `RN-027`, que CALC-001 aplica dentro do salário líquido, com a
 * conta inteira à mostra: o custo do mês, a cota do empregado e a parte que o
 * empregador paga. Motor em `engine/calculadoras/vale-transporte.ts`.
 */

import { calcularValeTransporte } from '../engine/calculadoras/vale-transporte'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { VALE_TRANSPORTE } from '../params/data/vale-transporte'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(VALE_TRANSPORTE)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularValeTransporte(
    {
      salarioBasico: centavos(numero(valores, 'salarioBasico')),
      valorPassagem: centavos(numero(valores, 'valorPassagem')),
      viagensPorDia: numero(valores, 'viagensPorDia'),
      diasUteis: numero(valores, 'diasUteis'),
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
      principal: v.desconto,
      detalhamento: [
        { rotulo: 'Custo do transporte no mês', valor: v.custoMensal, sinal: 'neutro' },
        { rotulo: 'Desconto no seu salário', valor: v.desconto, sinal: 'debito' },
        { rotulo: 'Parte paga pelo empregador', valor: v.parteDoEmpregador, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Cota máxima do empregado', valor: formatarReal(v.cotaDoEmpregado) },
        { rotulo: 'Percentual da cota', valor: formatarPercentual(v.aliquota) },
      ],
      notas: v.limitadoAoCusto
        ? ['O transporte custa menos que a cota: o desconto é só o custo, e não a cota inteira.']
        : ['O transporte custa mais que a cota: o empregado paga a cota e o empregador paga o restante.'],
    },
  }
}

export const VALE_TRANSPORTE_CALC: DefinicaoCalculadora = {
  id: 'CALC-082',
  slug: 'vale-transporte',
  nome: 'Desconto do vale-transporte',
  linhaDeContexto: 'Quanto sai do seu salário pelo vale-transporte, e quanto o empregador paga do resto.',
  descricaoSeo:
    'Calcule o desconto do vale-transporte: o custo das passagens no mês, a cota sobre o salário básico e a parte que fica por conta do empregador.',

  campos: [
    {
      id: 'salarioBasico',
      rotulo: 'Salário básico mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'Sem adicionais, horas extras ou outras vantagens.',
    },
    {
      id: 'valorPassagem',
      rotulo: 'Valor de uma passagem',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
    },
    {
      id: 'viagensPorDia',
      rotulo: 'Passagens por dia',
      tipo: 'inteiro',
      padrao: 2,
      minimo: 1,
      maximo: 8,
      ajuda: 'Ida e volta de ônibus direto são 2. Com integração ou baldeação paga, some todas.',
    },
    {
      id: 'diasUteis',
      rotulo: 'Dias de trabalho no mês',
      tipo: 'inteiro',
      padrao: 22,
      minimo: 1,
      maximo: 27,
    },
  ],

  parametrosRequeridos: ['vale-transporte-cota-do-empregado'],

  rotuloResultado: 'Desconto do vale-transporte estimado',

  calcular,

  faq: [
    {
      pergunta: 'Quanto a empresa pode descontar de vale-transporte?',
      resposta:
        'No máximo a cota do empregado sobre o salário básico, prevista no art. 4º, parágrafo único, da Lei nº 7.418/1985. Se o transporte custar menos que essa cota, o desconto é o próprio custo — nunca a cota inteira. A memória de cálculo mostra qual dos dois foi aplicado.',
    },
    {
      pergunta: 'A cota incide sobre o salário com horas extras?',
      resposta:
        'Não. O art. 114 do Decreto nº 10.854/2021 fixa a base no salário básico, sem adicionais nem vantagens. Horas extras, adicional noturno e comissões não aumentam o desconto do vale-transporte.',
    },
    {
      pergunta: 'Posso recusar o vale-transporte para não ter o desconto?',
      resposta:
        'O vale-transporte é um benefício que o empregado solicita, informando os deslocamentos. Quem não precisa ou não quer não o solicita, e então não há desconto. Quem gasta pouco com transporte costuma ter desconto pequeno, porque ele é limitado ao custo real.',
    },
    {
      pergunta: 'O vale-transporte pode ser pago em dinheiro?',
      resposta:
        'Como regra, não. O art. 110 do Decreto nº 10.854/2021 proíbe o empregador de substituir o vale-transporte por antecipação em dinheiro ou outra forma de pagamento, exceto para o empregador doméstico. Quando a operadora não consegue fornecer o vale e o empregado paga o deslocamento por conta própria, ele é ressarcido na folha seguinte. O que esta calculadora mostra é a divisão do custo entre empregado e empregador.',
    },
  ],

  relacionadas: ['salario-liquido', 'custo-do-funcionario', 'desconto-de-faltas'],
}
