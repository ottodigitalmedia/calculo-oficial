/**
 * CALC-018 — IR sobre renda fixa: tabela regressiva.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Fecha o bloco tributário do v2 pelo caminho seguro.** A restituição do IRPF
 * anual — CALC-017 — depende da tabela anual de um ano-calendário em que a
 * mensal mudou no meio, e ficou adiada por fonte. Esta não tem esse problema:
 * prazos e alíquotas estão no corpo da Lei nº 11.033/2004 e não mudam por
 * exercício.
 */

import { calcularRendaFixa } from '../engine/calculadoras/renda-fixa'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { RENDA_FIXA as PARAMS } from '../params/data/renda-fixa'
import { construirRegistro } from '../params/registry'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `salario-liquido.ts`. */
const registro = construirRegistro(PARAMS)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const isenta = texto(valores, 'tipo') === 'isenta'

  const r = calcularRendaFixa(
    {
      valorAplicado: centavos(numero(valores, 'valorAplicado')),
      taxaAnual: basisPoints(numero(valores, 'taxaAnual')),
      prazoMeses: numero(valores, 'prazoMeses'),
      isenta,
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    {
      rotulo: 'Alíquota aplicada',
      valor: isenta ? 'Isenta' : formatarPercentual(v.aliquota),
    },
    { rotulo: 'Prazo em dias', valor: `${v.prazoDias} dias` },
    { rotulo: 'Rentabilidade líquida no período', valor: formatarPercentual(v.rentabilidadeLiquidaBp) },
  ]

  if (v.economiaNaProximaFaixa > 0) {
    destaques.push({
      rotulo: `Economia esperando mais ${v.diasParaProximaFaixa} dia(s)`,
      valor: formatarReal(v.economiaNaProximaFaixa),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.montanteLiquido,
      detalhamento: [
        { rotulo: 'Valor aplicado', valor: v.valorAplicado, sinal: 'neutro' },
        { rotulo: 'Rendimento bruto', valor: v.rendimentoBruto, sinal: 'credito' },
        ...(isenta
          ? []
          : ([{ rotulo: 'Imposto de renda na fonte', valor: v.imposto, sinal: 'debito' }] as const)),
        { rotulo: 'Valor líquido no resgate', valor: v.montanteLiquido, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        ...(v.economiaNaProximaFaixa > 0
          ? [
              `Faltam ${v.diasParaProximaFaixa} dia(s) para a próxima faixa da tabela. A economia ` +
                'mostrada é só o efeito da troca de alíquota sobre o rendimento já acumulado — os ' +
                'dias a mais também rendem, e isso entra por cima.',
            ]
          : []),
        ...(isenta
          ? [
              'A isenção do art. 3º, II, da Lei nº 11.033/2004 alcança LCI, LCA, CRI, CRA e letras ' +
                'hipotecárias, para pessoa física. Compare sempre a taxa líquida: um CDB a 12% ao ' +
                'ano pode render mais que uma LCI a 10%, ou menos, conforme o prazo.',
            ]
          : []),
        'A conta não inclui IOF, que incide apenas em resgates antes de 30 dias — prazo abaixo do ' +
          'mínimo desta calculadora. Também não inclui taxa de custódia nem de administração.',
      ],
    },
  }
}

export const RENDA_FIXA: DefinicaoCalculadora = {
  id: 'CALC-018',
  slug: 'ir-renda-fixa',
  nome: 'IR sobre renda fixa',
  linhaDeContexto: 'Quanto o imposto tira do seu rendimento — e quanto o prazo devolve.',
  descricaoSeo:
    'Calcule o imposto de renda sobre CDB, Tesouro e outras aplicações pela tabela regressiva da Lei nº 11.033/2004, de 22,5% a 15%, e veja quanto se ganha esperando a faixa seguinte.',

  campos: [
    {
      id: 'valorAplicado',
      rotulo: 'Valor aplicado',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'taxaAnual',
      rotulo: 'Taxa contratada ao ano',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'A taxa efetiva anual da aplicação. Para papéis atrelados ao CDI, use a taxa esperada.',
    },
    {
      id: 'prazoMeses',
      rotulo: 'Prazo até o resgate, em meses',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 600,
      ajuda: 'A lei conta em dias; o cálculo usa o mês comercial de trinta.',
    },
    {
      id: 'tipo',
      rotulo: 'Tipo de aplicação',
      tipo: 'selecao',
      padrao: 'tributada',
      opcoes: [
        { valor: 'tributada', rotulo: 'Tributada — CDB, Tesouro, debênture comum' },
        { valor: 'isenta', rotulo: 'Isenta — LCI, LCA, CRI, CRA' },
      ],
    },
  ],

  parametrosRequeridos: [
    'ir-renda-fixa-faixa-1',
    'ir-renda-fixa-faixa-4',
    'ir-renda-fixa-limite-1',
    'ir-renda-fixa-limite-3',
  ],

  rotuloResultado: 'Valor líquido no resgate',

  calcular,

  faq: [
    {
      pergunta: 'Como funciona a tabela regressiva?',
      resposta:
        'São quatro degraus, pelo art. 1º da Lei nº 11.033/2004: 22,5% em aplicações de até 180 dias, 20% de 181 a 360, 17,5% de 361 a 720 e 15% acima de 720 dias. Quanto mais tempo o dinheiro fica, menor a mordida.',
    },
    {
      pergunta: 'A alíquota menor vale só para o rendimento do período extra?',
      resposta:
        'Não, e é isso que faz o prazo valer tanto. A alíquota da faixa alcançada incide sobre TODO o rendimento acumulado desde a aplicação. Resgatar no dia 721 em vez do dia 719 troca 17,5% por 15% sobre o rendimento inteiro — não sobre o de dois dias.',
    },
    {
      pergunta: 'LCI e LCA são realmente isentas?',
      resposta:
        'Para pessoa física, sim. O art. 3º, II, da mesma lei isenta, na fonte e na declaração de ajuste anual, a remuneração produzida por letras hipotecárias, certificados de recebíveis imobiliários e letras de crédito imobiliário. Mas compare sempre pela taxa líquida: um CDB a 12% ao ano pode render mais que uma LCI a 10%, ou menos, dependendo do prazo.',
    },
    {
      pergunta: 'Essa tabela não ia mudar?',
      resposta:
        'A Medida Provisória nº 1.303, de junho de 2025, propunha substituir a tabela regressiva por uma alíquota única e tributar os títulos hoje isentos. Ela perdeu eficácia sem ser convertida em lei — o Planalto a marca como de vigência encerrada —, e a tabela da Lei nº 11.033/2004 continua sendo a que vale. Se isso mudar, o parâmetro aqui ganha nova vigência e os resultados antigos continuam reproduzíveis.',
    },
    {
      pergunta: 'E o IOF?',
      resposta:
        'O IOF sobre aplicações financeiras incide apenas em resgates antes de 30 dias, com tabela regressiva própria que zera no trigésimo dia. Como o prazo mínimo desta calculadora é de um mês, ele não entra na conta. Taxa de custódia e de administração também ficam de fora — elas variam por instituição e por papel.',
    },
    {
      pergunta: 'Por que o cálculo usa meses e a lei usa dias?',
      resposta:
        'Porque é assim que se contrata e se pensa em prazo de aplicação. A conversão usa o mês comercial de trinta dias, e ela é exata justamente nas fronteiras que decidem a alíquota: 6, 12 e 24 meses caem em 180, 360 e 720 dias. Se o seu resgate tem data marcada, confira os dias corridos — perto da virada de faixa, um dia muda o resultado.',
    },
  ],

  relacionadas: ['juros-compostos', 'irrf', 'cet-custo-efetivo-total'],
}
