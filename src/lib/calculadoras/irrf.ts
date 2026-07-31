/**
 * CALC-015 — IRRF mensal.
 *
 * O cálculo de maior risco do catálogo, e aqui ele é só uma declaração: o
 * motor e os casos-ouro vieram de T-102.
 *
 * A contribuição previdenciária é **campo editável**, e não valor calculado
 * (`03-functional-spec` §3.8) — quem confere um holerite quer poder informar o
 * INSS que veio descontado, mesmo que difira do que a tabela produziria.
 */

import { calcularInss } from '../engine/inss'
import { calcularIrrf } from '../engine/irrf'
import { centavos } from '../engine/types'
import { formatarPercentual } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia, registro) => {
  const bruto = centavos(numero(valores, 'rendimentoBruto'))
  const informado = centavos(numero(valores, 'inss'))

  // INSS zerado significa "calcule para mim". Ainda assim é o motor de
  // T-102 que calcula — não há segunda implementação.
  let inss = informado
  if (informado === 0) {
    const prev = calcularInss({ salarioContribuicao: bruto }, dataReferencia, registro)
    if (!prev.ok) return prev
    inss = prev.valores.contribuicao
  }

  const r = calcularIrrf(
    {
      rendimentoBruto: bruto,
      inss,
      dependentes: numero(valores, 'dependentes'),
      pensao: centavos(numero(valores, 'pensao')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const notas = [
    informado > 0
      ? 'Usando o valor de contribuição previdenciária que você informou.'
      : 'A contribuição previdenciária foi calculada pela tabela do período. Informe o valor do seu holerite se ele for diferente.',
    r.valores.baseEscolhida === 'desconto_simplificado'
      ? 'O desconto simplificado produziu base menor e foi aplicado por ser mais favorável.'
      : 'As deduções legais produziram base menor e foram aplicadas por serem mais favoráveis.',
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: r.valores.imposto,
      detalhamento: [
        { rotulo: 'Rendimento bruto', valor: bruto, sinal: 'credito' },
        { rotulo: 'Contribuição previdenciária', valor: inss, sinal: 'debito' },
        { rotulo: 'Base de cálculo', valor: r.valores.baseCalculo, sinal: 'neutro' },
        ...(r.valores.reducaoAplicada > 0
          ? ([
              { rotulo: 'Redução do imposto', valor: r.valores.reducaoAplicada, sinal: 'credito' },
            ] as const)
          : []),
        { rotulo: 'Imposto devido', valor: r.valores.imposto, sinal: 'debito' },
      ],
      destaques: [
        { rotulo: 'Faixa da tabela', valor: formatarPercentual(r.valores.aliquotaFaixa) },
      ],
      notas,
    },
  }
}

export const IRRF_MENSAL: DefinicaoCalculadora = {
  id: 'CALC-015',
  slug: 'irrf',
  nome: 'Imposto de Renda na fonte',
  linhaDeContexto:
    'Quanto é retido de IRRF no mês — com a escolha entre deduções legais e desconto simplificado à mostra.',
  descricaoSeo:
    'Calcule o IRRF mensal com a tabela progressiva vigente, desconto simplificado e a redução do imposto. Veja cada etapa, a vigência e o link para a norma.',

  campos: [
    {
      id: 'rendimentoBruto',
      rotulo: 'Rendimento bruto do mês',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'inss',
      rotulo: 'Contribuição previdenciária descontada',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Deixe zerado para usar o valor calculado pela tabela do período.',
    },
    {
      id: 'dependentes',
      rotulo: 'Número de dependentes',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
    },
    {
      id: 'pensao',
      rotulo: 'Pensão alimentícia (desconto judicial)',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
    },
  ],

  parametrosRequeridos: [
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
    'inss-tabela-progressiva',
  ],

  rotuloResultado: 'Imposto retido na fonte',

  calcular,

  faq: [
    {
      pergunta: 'O que é o desconto simplificado?',
      resposta:
        'É uma dedução alternativa às deduções legais — previdência, dependentes e pensão. O cálculo apura as duas bases e aplica a que resultar em menos imposto para você. A memória de cálculo mostra as duas bases lado a lado e registra qual foi adotada.',
    },
    {
      pergunta: 'Por que meu imposto ficou zero mesmo eu estando numa faixa tributável?',
      resposta:
        'A partir de janeiro de 2026 existe uma redução do imposto para rendimentos até R$ 7.350,00. Até R$ 5.000,00 a redução alcança o valor necessário para zerar o imposto; acima disso ela diminui progressivamente até se anular. A memória mostra a redução como etapa separada, com o link para a norma.',
    },
    {
      pergunta: 'Por que a contribuição previdenciária aparece como campo?',
      resposta:
        'Porque ela é dedução da base do imposto, e o valor que interessa é o que veio no seu holerite. Se você deixar zerado, calculamos pela tabela do período; se informar, usamos o seu. A memória registra qual dos dois foi usado.',
    },
    {
      pergunta: 'Este cálculo considera outros rendimentos e a declaração anual?',
      resposta:
        'Não. Esta calculadora cobre a retenção mensal na fonte sobre um rendimento. O ajuste anual considera todos os rendimentos do ano, outras deduções e pode gerar restituição ou imposto a pagar.',
    },
  ],

  relacionadas: ['salario-liquido', 'inss'],
}
