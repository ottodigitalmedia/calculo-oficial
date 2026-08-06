/**
 * CALC-027 — Empréstimo consignado: margem e parcela.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A página existe para corrigir uma conta que quase todo mundo faz errado.**
 * A margem é 40% da remuneração DISPONÍVEL — o líquido das consignações
 * compulsórias —, e não do salário bruto. Quem calcula sobre o bruto
 * superestima a própria margem e descobre a diferença no banco. O resultado
 * mostra os dois números lado a lado, para que o engano fique visível.
 *
 * **Ela parte do bruto e deduz.** Pedir o líquido seria mais simples e menos
 * confiável: o usuário informaria o que acha que é o líquido. Reaproveitar os
 * motores de INSS e IRRF, que já existem e já são conferidos, é o que garante
 * que esta página nunca divirja de CALC-015 e CALC-016.
 */

import { calcularConsignado } from '../engine/calculadoras/consignado'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { CONSIGNADO as PARAMS_CONSIGNADO } from '../params/data/consignado'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { construirRegistro } from '../params/registry'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(PARAMS_CONSIGNADO, INSS, IRRF)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const salarioBruto = centavos(numero(valores, 'salarioBruto'))

  const r = calcularConsignado(
    {
      salarioBruto,
      dependentes: numero(valores, 'dependentes'),
      outrosCompulsorios: centavos(numero(valores, 'outrosCompulsorios')),
      jaConsignado: centavos(numero(valores, 'jaConsignado')),
      prazoMeses: numero(valores, 'prazoMeses'),
      taxaMensalBp: basisPoints(numero(valores, 'taxaMensal')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o salário bruto. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Salário bruto', valor: salarioBruto, sinal: 'credito' },
    { rotulo: 'INSS', valor: v.inss, sinal: 'debito' },
    { rotulo: 'IRRF', valor: v.irrf, sinal: 'debito' },
    { rotulo: 'Remuneração disponível', valor: v.remuneracaoDisponivel, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Margem total', valor: formatarReal(v.margemTotal) },
    { rotulo: 'Margem ainda livre', valor: formatarReal(v.margemLivre) },
    {
      rotulo: `Se fosse ${formatarPercentual(v.margemBp)} do BRUTO, seria`,
      valor: formatarReal(v.margemSobreOBruto),
    },
  ]

  if (!v.margemEsgotada) {
    destaques.push(
      { rotulo: 'Parcela que cabe na margem', valor: formatarReal(v.parcela) },
      { rotulo: 'Total pago no fim', valor: formatarReal(v.totalPago) },
      { rotulo: 'Custo do crédito', valor: formatarReal(v.custoDoCredito) },
      { rotulo: 'CET ao mês', valor: formatarPercentual(v.cetMensal) },
    )
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.emprestimoPossivel,
      detalhamento: linhas,
      destaques,
      notas: [
        'A margem é 40% da remuneração DISPONÍVEL — o que sobra depois das consignações ' +
          'compulsórias, como INSS e IRRF —, e não do salário bruto. O destaque mostra os dois ' +
          'números: a diferença entre eles é o tamanho do engano mais comum sobre consignado.',
        ...(v.margemEsgotada
          ? [
              'A sua margem já está totalmente comprometida pelo que você informou. Não há espaço ' +
                'para nova parcela sem antes reduzir o que já está consignado.',
            ]
          : [
              'O valor do empréstimo é o máximo que CABE na margem livre, com o prazo e a taxa que ' +
                'você informou. Prazo maior aumenta o valor que cabe e aumenta o total pago — as ' +
                'duas coisas juntas, sempre.',
            ]),
        'Esta conta é do empregado CLT. Aposentados e pensionistas do INSS têm regra própria, que ' +
          'está em alteração por medida provisória, e servidores públicos seguem o regulamento do ' +
          'próprio órgão — nos dois casos o número daqui não vale.',
        'Consignado costuma ter a taxa mais baixa do mercado justamente porque o desconto é ' +
          'automático. Isso não o torna barato em termos absolutos: compare o custo do crédito com ' +
          'o valor tomado antes de decidir.',
        'A margem é um teto, não uma meta. Comprometer o limite inteiro deixa a folha sem folga ' +
          'para qualquer imprevisto, e o consignado é justamente a dívida que não se pode atrasar.',
      ],
    },
  }
}

export const CONSIGNADO: DefinicaoCalculadora = {
  id: 'CALC-027',
  slug: 'emprestimo-consignado',
  nome: 'Empréstimo consignado — margem e parcela',
  linhaDeContexto: 'Quanto cabe na sua margem — calculada sobre o líquido, como manda a lei.',
  descricaoSeo:
    'Calcule sua margem consignável de 40% sobre a remuneração disponível e descubra quanto de empréstimo cabe nela, com a parcela e o custo do crédito.',

  campos: [
    {
      id: 'salarioBruto',
      rotulo: 'Salário bruto do mês',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'dependentes',
      rotulo: 'Dependentes para o IRRF',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
    },
    {
      id: 'outrosCompulsorios',
      rotulo: 'Outros descontos obrigatórios',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Pensão alimentícia judicial e demais consignações compulsórias da sua folha.',
    },
    {
      id: 'jaConsignado',
      rotulo: 'Parcelas de consignado que você já paga',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Some tudo o que já é descontado em folha por empréstimo ou cartão consignado.',
    },
    {
      id: 'prazoMeses',
      rotulo: 'Prazo pretendido',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 48,
      minimo: 1,
      maximo: 120,
    },
    {
      id: 'taxaMensal',
      rotulo: 'Juros ao mês da proposta',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 1,
      maximo: 50_000,
      ajuda: 'A taxa mensal oferecida. Consignado costuma ficar bem abaixo do crédito pessoal.',
    },
  ],

  parametrosRequeridos: [
    'consignado-margem-clt',
    'inss-tabela-progressiva',
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
  ],

  rotuloResultado: 'Quanto cabe de empréstimo',

  calcular,

  faq: [
    {
      pergunta: 'A margem é sobre o salário bruto ou sobre o líquido?',
      resposta:
        'Sobre a remuneração disponível, que a lei define como o salário descontadas as consignações compulsórias — INSS, Imposto de Renda e outros descontos obrigatórios. É o engano mais comum sobre consignado: quem calcula 40% do bruto chega a um número maior do que o banco vai aprovar, e a diferença cresce com o salário, porque os descontos obrigatórios crescem junto. O resultado mostra os dois valores lado a lado.',
    },
    {
      pergunta: 'Qual é a margem hoje?',
      resposta:
        'Para o empregado regido pela CLT, 40% da remuneração disponível. Esse limite subiu de 35% para 40% em 2022, e na mesma mudança deixou de existir a reserva de 5% que só podia ser usada com cartão de crédito consignado — hoje o teto é único e vale para o conjunto dos descontos. A calculadora usa a vigência correspondente à data de referência escolhida.',
    },
    {
      pergunta: 'Vale para aposentado do INSS?',
      resposta:
        'Não. Aposentados e pensionistas do Regime Geral têm regra própria, em outro artigo da mesma lei, com limites e reservas específicas para cartão consignado e cartão de benefício. Essa regra está sendo alterada por medida provisória, e enquanto ela não se estabilizar esta calculadora não a publica — um número que pode mudar antes de a página ser lida é pior que a ausência dele. Servidores públicos, por sua vez, seguem o regulamento do próprio órgão.',
    },
    {
      pergunta: 'Por que prazo maior aumenta o valor que cabe?',
      resposta:
        'Porque a margem limita a PARCELA, não o valor tomado. Espalhando a mesma parcela por mais meses, o valor presente dela cresce — e é ele que o banco libera. O que também cresce é o total pago: mais parcelas significam mais juros. O resultado mostra as duas consequências juntas, e é por isso que comparar propostas pela parcela leva a decisões ruins.',
    },
    {
      pergunta: 'Devo usar a margem inteira?',
      resposta:
        'A margem é um teto legal, não uma recomendação. Comprometê-la por completo deixa a folha sem nenhuma folga, e o consignado é justamente a dívida que não dá para atrasar — o desconto acontece antes de o salário chegar. Quem usa o limite inteiro perde a única reserva que teria em caso de imprevisto, e costuma acabar recorrendo a crédito mais caro fora da folha.',
    },
  ],

  relacionadas: ['cet-custo-efetivo-total', 'portabilidade-de-credito', 'salario-liquido'],
}
