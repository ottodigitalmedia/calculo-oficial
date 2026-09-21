/**
 * CALC-122 — Tesouro Prefixado: quanto recebo no vencimento.
 *
 * A pergunta é "comprei, e agora?". O site do Tesouro mostra o valor bruto; o
 * que falta é o imposto, que come uma fatia do rendimento conforme o prazo — e
 * é onde a conta caseira erra, porque aplica a alíquota sobre o total em vez de
 * sobre o rendimento.
 *
 * Motor em `engine/calculadoras/tesouro-prefixado.ts`.
 */

import {
  calcularTesouroPrefixado,
  PARAMETROS_TESOURO_PREFIXADO,
} from '../engine/calculadoras/tesouro-prefixado'
import { centavos } from '../engine/types'
import { formatarNumero, formatarPercentual, formatarReal } from '../format/moeda'
import { RENDA_FIXA } from '../params/data/renda-fixa'
import { TITULOS_PUBLICOS } from '../params/data/titulos-publicos'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(TITULOS_PUBLICOS, RENDA_FIXA)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularTesouroPrefixado(
    {
      valorAplicado: centavos(numero(valores, 'valorAplicado')),
      precoUnitario: centavos(numero(valores, 'preco')),
      compra: texto(valores, 'compra') as DataISO,
      vencimento: texto(valores, 'vencimento') as DataISO,
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
      principal: v.liquidoNoVencimento,
      detalhamento: [
        { rotulo: 'Valor aplicado', valor: centavos(numero(valores, 'valorAplicado')), sinal: 'neutro' },
        { rotulo: 'Rendimento até o vencimento', valor: v.rendimento, sinal: 'credito' },
        { rotulo: 'Imposto de renda', valor: v.imposto, sinal: 'debito' },
        { rotulo: 'Líquido no vencimento', valor: v.liquidoNoVencimento, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Bruto no vencimento', valor: formatarReal(v.brutoNoVencimento) },
        { rotulo: 'Títulos comprados', valor: formatarNumero(centavos(v.quantidadeEmCentesimos)) },
        { rotulo: 'Alíquota do imposto pelo prazo', valor: formatarPercentual(v.aliquotaIr) },
        { rotulo: 'Rentabilidade no período', valor: `${formatarPercentual(v.rentabilidadeBrutaBp)} bruta · ${formatarPercentual(v.rentabilidadeLiquidaBp)} líquida` },
        { rotulo: 'Prazo', valor: `${v.diasCorridos} dias corridos` },
      ],
      notas: [
        `Cada título paga ${formatarReal(v.valorNominal)} no vencimento, qualquer que seja o mercado — a LTN é resgatada pelo valor nominal (Decreto nº 12.814/2026, art. 2º, V). O que varia é o preço de compra.`,
        'Vendendo antes do vencimento, esta conta deixa de valer: o preço do dia sobe e desce com as taxas de mercado, e o resultado pode ser bem menor — inclusive negativo.',
        'A taxa de custódia da B3 e eventuais taxas da corretora não entram. Elas reduzem o resultado e variam por instituição e por faixa de valor.',
        'A rentabilidade mostrada é a do período inteiro, e não ao ano. A taxa anunciada na compra é expressa ao ano, em dias úteis — outra base de contagem.',
        'O Tesouro Prefixado com Juros Semestrais paga cupons ao longo do caminho, com imposto em cada um: esta conta é a do título sem cupons.',
      ],
    },
  }
}

export const TESOURO_PREFIXADO: DefinicaoCalculadora = {
  id: 'CALC-122',
  slug: 'tesouro-prefixado',
  nome: 'Tesouro Prefixado no vencimento',
  linhaDeContexto: 'Quanto cai na conta no vencimento, depois do imposto que o prazo define.',
  descricaoSeo:
    'Calcule quanto o Tesouro Prefixado paga no vencimento: valor bruto pelos títulos comprados, imposto de renda pela tabela regressiva e valor líquido.',

  campos: [
    {
      id: 'valorAplicado',
      rotulo: 'Valor aplicado na compra',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'preco',
      rotulo: 'Preço de um título na compra',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 99_999,
      ajuda: 'O preço unitário da tela de compra e do extrato. É sempre menor que os R$ 1.000,00 pagos no vencimento.',
    },
    {
      id: 'compra',
      rotulo: 'Data da compra',
      tipo: 'data',
      obrigatorio: true,
    },
    {
      id: 'vencimento',
      rotulo: 'Data de vencimento do título',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Está no nome do título: o Tesouro Prefixado 2029 vence em 1º de janeiro de 2029.',
    },
  ],

  parametrosRequeridos: [...PARAMETROS_TESOURO_PREFIXADO],
  vigenciaPelaData: 'compra',

  rotuloResultado: 'Líquido no vencimento',

  calcular,

  faq: [
    {
      pergunta: 'Quanto o Tesouro Prefixado paga no vencimento?',
      resposta:
        'R$ 1.000,00 por título. A LTN é resgatada pelo valor nominal na data de vencimento (Decreto nº 12.814/2026, art. 2º), e o valor nominal negociado no Tesouro Direto é de mil reais. O rendimento vem do deságio: quanto menor o preço pago, maior o ganho.',
    },
    {
      pergunta: 'Por que a calculadora pede o preço do título, e não a taxa?',
      resposta:
        'Porque o preço já contém a taxa, e é um dado que você tem no extrato. Converter taxa em preço exige contar dias ÚTEIS pelo calendário bancário, que inclui datas que não são feriado nacional — reconstruí-lo aqui seria uma fonte de erro silencioso. Com o preço, a conta é exata.',
    },
    {
      pergunta: 'Quanto de imposto de renda eu pago?',
      resposta:
        'A tabela regressiva: 22,5% até 180 dias, 20% até 360, 17,5% até 720 e 15% acima disso, sempre sobre o RENDIMENTO, nunca sobre o total. Quem conta o prazo a partir da compra e leva o título ao vencimento costuma ficar na menor alíquota.',
    },
    {
      pergunta: 'E se eu vender antes do vencimento?',
      resposta:
        'Aí vale o preço de mercado do dia, que varia com as taxas: se elas subirem, o preço do seu título cai, e vender pode dar menos que o contratado ou até prejuízo. A garantia de receber o valor nominal existe só na data de vencimento.',
    },
    {
      pergunta: 'A taxa de custódia entra na conta?',
      resposta:
        'Não. A custódia da B3 e eventuais taxas da corretora reduzem o resultado, mas variam por instituição e por faixa de valor — e o produto não publica número que não possa confirmar em fonte oficial. Some-as por fora ao comparar com outra aplicação.',
    },
  ],

  relacionadas: ['tesouro-ipca-mais', 'ir-renda-fixa', 'cdb-lci-lca', 'onde-render-mais'],
}
