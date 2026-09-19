/**
 * CALC-114 — Imposto sobre aluguel recebido.
 *
 * O carnê-leão genérico (CALC-053) não sabe o que o locador pode tirar da base:
 * IPTU, condomínio, taxa da imobiliária, o aluguel da sublocação. Esta página
 * sabe, e mostra quanto isso muda.
 *
 * Motor em `engine/calculadoras/aluguel.ts`.
 */

import { calcularImpostoSobreAluguel, type QuemPaga } from '../engine/calculadoras/aluguel'
import { PARAMETROS_CARNE_LEAO } from '../engine/calculadoras/carne-leao'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(IRRF, INSS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const quemPaga: QuemPaga = texto(valores, 'quemPaga') === 'pessoa-juridica' ? 'pessoa-juridica' : 'pessoa-fisica'
  const r = calcularImpostoSobreAluguel(
    {
      aluguel: centavos(numero(valores, 'aluguel')),
      impostosETaxas: centavos(numero(valores, 'iptu')),
      condominio: centavos(numero(valores, 'condominio')),
      administracao: centavos(numero(valores, 'administracao')),
      sublocacao: centavos(numero(valores, 'sublocacao')),
      dependentes: numero(valores, 'dependentes'),
      quemPaga,
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
        { rotulo: 'Aluguel recebido', valor: centavos(numero(valores, 'aluguel')), sinal: 'credito' },
        { rotulo: 'Fora da base — IPTU, condomínio, administração', valor: v.exclusoes, sinal: 'neutro' },
        { rotulo: quemPaga === 'pessoa-fisica' ? 'Carnê-leão do mês' : 'Imposto retido pela empresa', valor: v.imposto, sinal: 'debito' },
      ],
      destaques: [
        { rotulo: 'Aluguel tributável', valor: formatarReal(v.baseAntesDasDeducoes) },
        { rotulo: 'Quanto o imposto leva do aluguel', valor: v.carneLeao === null ? '0%' : formatarPercentual(v.carneLeao.mordidaBp) },
        {
          rotulo: 'Como se recolhe',
          valor: quemPaga === 'pessoa-fisica' ? 'Carnê-leão, pelo próprio locador' : 'Retido na fonte pela empresa',
        },
      ],
      notas: [
        'Só entram as despesas pagas pelo LOCADOR. Se o inquilino paga o IPTU e o condomínio, não há o que tirar.',
        'Se você recebe outros rendimentos de pessoas físicas no mesmo mês, o carnê-leão é um só, sobre a soma — a calculadora de carnê-leão faz essa conta.',
        'Aluguel pago por pessoa jurídica tem o imposto retido na fonte, pela mesma tabela e com as mesmas exclusões.',
        'No ajuste anual, o aluguel soma aos demais rendimentos tributáveis, e o imposto pago no mês é compensado.',
        ...(v.exclusoes > 0
          ? [
              'O redutor de 2026 é enquadrado pelo aluguel tributável, já sem as despesas excluídas — que a lei tira da base. Não há exemplo oficial de aluguel com o redutor; se a Receita enquadrar pelo aluguel bruto, o redutor sai menor para quem tem exclusões.',
            ]
          : []),
      ],
    },
  }
}

export const IMPOSTO_SOBRE_ALUGUEL: DefinicaoCalculadora = {
  id: 'CALC-114',
  slug: 'imposto-sobre-aluguel',
  nome: 'Imposto de renda sobre aluguel',
  linhaDeContexto: 'Quanto de imposto sai do aluguel que você recebe — depois de tirar IPTU, condomínio e a taxa da imobiliária.',
  descricaoSeo:
    'Calcule o imposto de renda sobre aluguel recebido: carnê-leão ou retenção na fonte, com as exclusões de IPTU, condomínio e taxa de administração.',

  campos: [
    { id: 'aluguel', rotulo: 'Aluguel recebido no mês', tipo: 'monetario', obrigatorio: true, padrao: 350_000, minimo: 0, maximo: 100_000_000 },
    {
      id: 'quemPaga',
      rotulo: 'Quem paga o aluguel',
      tipo: 'selecao',
      padrao: 'pessoa-fisica',
      opcoes: [
        { valor: 'pessoa-fisica', rotulo: 'Pessoa física' },
        { valor: 'pessoa-juridica', rotulo: 'Empresa' },
      ],
    },
    { id: 'iptu', rotulo: 'IPTU e taxas do imóvel, no mês', tipo: 'monetario', padrao: 0, minimo: 0, maximo: 10_000_000, ajuda: 'Só se pagos por você, o locador. O IPTU anual dividido pelos meses.' },
    { id: 'condominio', rotulo: 'Condomínio pago por você', tipo: 'monetario', padrao: 0, minimo: 0, maximo: 10_000_000 },
    { id: 'administracao', rotulo: 'Taxa da imobiliária', tipo: 'monetario', padrao: 0, minimo: 0, maximo: 10_000_000 },
    { id: 'sublocacao', rotulo: 'Aluguel que você paga, se o imóvel é sublocado', tipo: 'monetario', padrao: 0, minimo: 0, maximo: 100_000_000 },
    { id: 'dependentes', rotulo: 'Dependentes', tipo: 'inteiro', padrao: 0, minimo: 0, maximo: 20 },
  ],

  parametrosRequeridos: [...PARAMETROS_CARNE_LEAO],
  // O redutor de 2026, como no carnê-leão (§7.88).
  parametrosOpcionais: ['irrf-reducao-limite-integral'],

  rotuloResultado: 'Imposto do mês',

  calcular,

  faq: [
    {
      pergunta: 'O que posso descontar do aluguel antes do imposto?',
      resposta:
        'IPTU e demais impostos e taxas do imóvel, o condomínio, as despesas de cobrança — como a taxa da imobiliária — e, se o imóvel é sublocado, o aluguel que você paga por ele. É o que diz o art. 42 do Regulamento do Imposto de Renda, com base no art. 14 da Lei nº 7.739/1989. Só vale para despesas pagas por você, o locador.',
    },
    {
      pergunta: 'Recebo aluguel de pessoa física. Como pago o imposto?',
      resposta:
        'Pelo carnê-leão, calculado por você mesmo sobre o que recebeu no mês. Se houver outros rendimentos de pessoas físicas no mesmo mês, eles somam.',
    },
    {
      pergunta: 'E se quem paga é uma empresa?',
      resposta:
        'A empresa retém o imposto na fonte e repassa o aluguel já descontado. A tabela e as exclusões são as mesmas (art. 689 do Regulamento).',
    },
    {
      pergunta: 'O aluguel entra na declaração anual?',
      resposta:
        'Entra, como rendimento tributável. No ajuste, soma-se aos demais rendimentos, e o imposto pago mês a mês é descontado do devido no ano.',
    },
    {
      pergunta: 'A isenção de 2026 vale para o aluguel?',
      resposta:
        'O redutor da Lei nº 15.270/2025 alcança os rendimentos tributáveis sujeitos à incidência mensal, e o aluguel é um deles — no carnê-leão e na retenção pela empresa, que a Receita incluiu expressamente (IN RFB nº 1.500/2014, art. 22, VI, na redação da IN RFB nº 2.299/2025). A calculadora aplica o redutor a partir de 2026 e o enquadra pelo aluguel tributável, já sem IPTU, condomínio e taxa de administração. A Receita não publicou exemplo de aluguel com o redutor: se ela enquadrar pelo aluguel bruto, o redutor sai menor para quem tem essas despesas.',
    },
  ],

  relacionadas: ['carne-leao', 'rentabilidade-de-aluguel', 'reajuste-de-aluguel', 'restituicao-irpf'],
}
