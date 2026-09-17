/**
 * CALC-079 — Adicional de periculosidade.
 *
 * Duas coisas que a calculadora deixa visíveis: a base é o salário BÁSICO, sem
 * outros adicionais (CLT, art. 193, § 1º, e Súmula 191, I, do TST), e o
 * adicional não se acumula com a insalubridade — o empregado escolhe (§ 2º).
 * A comparação opcional responde à pergunta que vem logo depois: qual dos dois
 * é maior?
 *
 * Motor em `engine/calculadoras/adicionais.ts`.
 */

import { calcularPericulosidade, type GrauInsalubridade } from '../engine/calculadoras/adicionais'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { ADICIONAIS } from '../params/data/adicionais'
import { INSS } from '../params/data/inss'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(INSS, ADICIONAIS)

/**
 * Local, e não importada de `insalubridade.ts`: importar daquele módulo traria a
 * definição inteira da insalubridade — FAQ e textos de SEO junto — para o
 * pedaço adiado desta calculadora (`ESTADO-DO-PROJETO` §7.6).
 */
function grauDe(valor: string): GrauInsalubridade | null {
  return valor === 'maximo' || valor === 'medio' || valor === 'minimo' ? valor : null
}

const VEREDITO = {
  periculosidade: 'A periculosidade é maior',
  insalubridade: 'A insalubridade é maior',
  iguais: 'Os dois adicionais são iguais',
} as const

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const comparar = texto(valores, 'comparar')
  const r = calcularPericulosidade(
    {
      salarioBasico: centavos(numero(valores, 'salarioBasico')),
      compararCom: grauDe(comparar),
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
      principal: v.adicional,
      detalhamento: [
        { rotulo: 'Adicional de periculosidade', valor: v.adicional, sinal: 'credito' },
        { rotulo: 'Salário básico com o adicional', valor: v.salarioComAdicional, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Percentual aplicado', valor: formatarPercentual(v.aliquota) },
        ...(v.insalubridade !== null && v.maisVantajoso !== null
          ? [
              { rotulo: 'Insalubridade no grau escolhido', valor: formatarReal(v.insalubridade) },
              { rotulo: 'Comparação', valor: VEREDITO[v.maisVantajoso] },
            ]
          : []),
      ],
      notas: [
        'O adicional integra a remuneração: sofre INSS e imposto de renda junto com o salário do mês.',
        'Eletricitário contratado antes da Lei nº 12.740/2012 tem outra base de cálculo, que esta ' +
          'estimativa não cobre.',
      ],
    },
  }
}

export const PERICULOSIDADE: DefinicaoCalculadora = {
  id: 'CALC-079',
  slug: 'periculosidade',
  nome: 'Adicional de periculosidade',
  linhaDeContexto: 'O adicional sobre o salário básico, e a comparação com a insalubridade quando cabem os dois.',
  descricaoSeo:
    'Calcule o adicional de periculosidade sobre o salário básico e compare com a insalubridade para ver qual dos dois é maior no seu caso.',

  campos: [
    {
      id: 'salarioBasico',
      rotulo: 'Salário básico mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'Sem gratificações, prêmios, participação nos lucros ou outros adicionais.',
    },
    {
      id: 'comparar',
      rotulo: 'Comparar com a insalubridade?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não comparar' },
        { valor: 'maximo', rotulo: 'Insalubridade em grau máximo' },
        { valor: 'medio', rotulo: 'Insalubridade em grau médio' },
        { valor: 'minimo', rotulo: 'Insalubridade em grau mínimo' },
      ],
      ajuda: 'Para quem está exposto às duas condições e precisa escolher um dos adicionais.',
    },
  ],

  parametrosRequeridos: [
    'periculosidade-adicional',
    'salario-minimo',
    'insalubridade-grau-maximo',
    'insalubridade-grau-medio',
    'insalubridade-grau-minimo',
  ],

  rotuloResultado: 'Adicional de periculosidade estimado',

  calcular,

  faq: [
    {
      pergunta: 'Sobre qual valor a periculosidade é calculada?',
      resposta:
        'Sobre o salário básico. O art. 193, § 1º, da CLT exclui da base as gratificações, os prêmios e a participação nos lucros, e a Súmula 191, I, do TST diz que o adicional não incide sobre outros adicionais. Horas extras, adicional noturno e comissões ficam de fora.',
    },
    {
      pergunta: 'Quais atividades são consideradas perigosas?',
      resposta:
        'O art. 193 da CLT lista a exposição permanente a inflamáveis, explosivos ou energia elétrica, a roubos e violência física na segurança pessoal ou patrimonial, e a acidentes e violência na atividade dos agentes de trânsito. O § 4º acrescenta o trabalho em motocicleta. A caracterização depende da regulamentação do Ministério do Trabalho.',
    },
    {
      pergunta: 'Quem fica exposto só de vez em quando recebe o adicional?',
      resposta:
        'A Súmula 364 do TST considera devido o adicional na exposição permanente e também na intermitente. Ele deixa de ser devido apenas quando o contato é eventual — fortuito, ou habitual por tempo extremamente reduzido. A súmula também invalida acordo que pague percentual menor, proporcional ao tempo de exposição.',
    },
    {
      pergunta: 'Posso receber periculosidade e insalubridade juntas?',
      resposta:
        'Não. O art. 193, § 2º, da CLT permite ao empregado optar pela insalubridade, e os dois não se acumulam. Como a periculosidade incide sobre o salário básico e a insalubridade sobre o salário mínimo, qual é maior depende do salário — use a comparação para ver no seu caso.',
    },
    {
      pergunta: 'O que muda para o eletricitário?',
      resposta:
        'Segundo a Súmula 191 do TST, o eletricitário contratado antes da Lei nº 12.740/2012 tem o adicional calculado sobre a totalidade das parcelas de natureza salarial, e não só sobre o salário básico. Para contratos a partir dessa lei, vale a regra geral. Esta estimativa usa a regra geral.',
    },
  ],

  relacionadas: ['insalubridade', 'salario-liquido', 'adicional-noturno'],
}
