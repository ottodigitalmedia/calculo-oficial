/**
 * CALC-085 — Imposto sobre a participação nos lucros (PLR).
 *
 * A PLR tem tabela anual própria e é tributada em separado do salário (Lei nº
 * 10.101/2000, art. 3º, § 5º). Somá-la ao salário do mês e aplicar a tabela
 * mensal — o que muita planilha faz — cobra várias vezes o imposto devido.
 *
 * Motor em `engine/calculadoras/plr.ts`.
 */

import { calcularPlr } from '../engine/calculadoras/plr'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { PLR } from '../params/data/plr'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PLR)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const valorPlr = centavos(numero(valores, 'valorPlr'))
  const pensao = centavos(numero(valores, 'pensao'))
  const r = calcularPlr(
    {
      valorPlr,
      pensao,
      baseAnterior: centavos(numero(valores, 'baseAnterior')),
      impostoRetidoAnterior: centavos(numero(valores, 'impostoRetidoAnterior')),
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
      principal: v.liquido,
      detalhamento: [
        { rotulo: 'PLR bruta', valor: valorPlr, sinal: 'credito' },
        ...(pensao > 0 ? ([{ rotulo: 'Pensão alimentícia', valor: pensao, sinal: 'debito' }] as const) : []),
        { rotulo: 'Imposto de renda retido', valor: v.imposto, sinal: 'debito' },
        { rotulo: 'PLR líquida', valor: v.liquido, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Faixa da tabela da PLR', valor: v.isento ? 'Isenta' : formatarPercentual(v.aliquotaFaixa) },
        ...(v.baseAnual !== v.baseDaParcela
          ? [{ rotulo: 'Base de toda a PLR do ano', valor: formatarReal(v.baseAnual) }]
          : []),
      ],
      notas: [
        'A PLR não se soma ao salário: o imposto é retido em separado, com tabela anual própria, e o valor ' +
          'não entra na base da declaração de ajuste.',
      ],
    },
  }
}

export const IMPOSTO_SOBRE_PLR: DefinicaoCalculadora = {
  id: 'CALC-085',
  slug: 'imposto-sobre-plr',
  nome: 'Imposto sobre a PLR',
  linhaDeContexto: 'Quanto de imposto sai da participação nos lucros, pela tabela própria da PLR.',
  descricaoSeo:
    'Calcule o imposto de renda sobre a PLR pela tabela exclusiva da participação nos lucros, com o recálculo da segunda parcela e a dedução da pensão.',

  campos: [
    {
      id: 'valorPlr',
      rotulo: 'Valor bruto da PLR',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'pensao',
      rotulo: 'Pensão alimentícia sobre a PLR',
      tipo: 'monetario',
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Só a pensão fixada por decisão judicial, acordo homologado ou escritura, descontada desta PLR.',
    },
    {
      id: 'baseAnterior',
      rotulo: 'PLR já recebida neste ano',
      tipo: 'monetario',
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Se esta é a segunda parcela do ano, informe a primeira, já sem a pensão.',
    },
    {
      id: 'impostoRetidoAnterior',
      rotulo: 'Imposto já retido sobre essa PLR',
      tipo: 'monetario',
      minimo: 0,
      maximo: 1_000_000_000,
    },
  ],

  parametrosRequeridos: ['plr-tabela-exclusiva'],

  rotuloResultado: 'PLR líquida estimada',

  calcular,

  faq: [
    {
      pergunta: 'A PLR é somada ao salário para calcular o imposto?',
      resposta:
        'Não. O art. 3º, § 5º, da Lei nº 10.101/2000 manda tributar a PLR exclusivamente na fonte, em separado dos demais rendimentos, com uma tabela anual própria. Ela também não entra na base da declaração de ajuste anual. Somar a PLR ao salário e aplicar a tabela mensal produz um imposto muito maior que o devido.',
    },
    {
      pergunta: 'Por que a segunda parcela paga mais imposto?',
      resposta:
        'Porque o § 7º manda recalcular o imposto sobre o total recebido no ano e descontar o que já foi retido. Duas parcelas que seriam isentas cada uma podem, somadas, passar da faixa de isenção — e todo o imposto do ano cai na segunda. Informe a primeira parcela e o imposto já retido para ver esse efeito.',
    },
    {
      pergunta: 'Sobre a PLR incide INSS ou FGTS?',
      resposta:
        'Não, quando paga nos termos da Lei nº 10.101/2000. O caput do art. 3º diz que a participação não substitui nem complementa a remuneração e não constitui base de incidência de encargo trabalhista. Pagamentos fora das regras da lei podem ser tratados como salário.',
    },
    {
      pergunta: 'A pensão alimentícia reduz o imposto da PLR?',
      resposta:
        'Reduz. O § 10 do art. 3º permite deduzir da base a pensão alimentícia paga em cumprimento de decisão judicial, acordo homologado ou divórcio por escritura, desde que correspondente à própria PLR. A mesma parcela não pode ser deduzida de novo dos outros rendimentos.',
    },
    {
      pergunta: 'Por que o imposto mudou em 2025?',
      resposta:
        'A tabela da PLR publicada pela Receita Federal mudou em maio de 2025, com uma faixa de isenção maior. Uma PLR paga até abril de 2025 segue a tabela anterior. A memória de cálculo mostra qual tabela foi aplicada e desde quando ela vale.',
    },
  ],

  relacionadas: ['irrf', 'salario-liquido', 'restituicao-irpf'],
}
