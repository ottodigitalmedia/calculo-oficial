/**
 * CALC-001 — Salário líquido. A primeira calculadora, e o molde de todas.
 *
 * Campos e microcopy de `03-functional-spec` §3.1, usados literalmente — o
 * documento diz que todo texto entre aspas ali é final.
 */

import { calcularSalarioLiquido } from '../engine/calculadoras/salario-liquido'
import { centavos } from '../engine/types'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { construirRegistro } from '../params/registry'

/**
 * Registro montado aqui, e não recebido de fora.
 *
 * Vive no módulo ADIADO: as tabelas legais só entram no navegador junto com o
 * cálculo que as usa, e não no pacote estático de toda rota. Ver `tipos.ts`,
 * `FuncaoCalculo`.
 */
const registro = construirRegistro(INSS, IRRF)

/**
 * Exportação de topo, e não método do literal abaixo — de propósito.
 *
 * `calculo.ts` importa **só isto** no pedaço adiado. Sendo exportação nomeada,
 * o empacotador descarta o resto do módulo do pacote do navegador: FAQ, texto
 * de SEO e nome, que só o servidor renderiza. Como método, o objeto inteiro
 * viajaria junto — foram ~0,6 kB comprimidos por calculadora, de texto que o
 * navegador baixava para nunca exibir.
 *
 * O literal continua sendo a definição completa e continua sendo a fonte única:
 * ele referencia esta função, não uma cópia.
 */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularSalarioLiquido(
    {
      salarioBruto: centavos(numero(valores, 'salarioBruto')),
      dependentes: numero(valores, 'dependentes'),
      pensao: centavos(numero(valores, 'pensao')),
      outrosDescontos: centavos(numero(valores, 'outrosDescontos')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const bruto = centavos(numero(valores, 'salarioBruto'))
  const pensao = centavos(numero(valores, 'pensao'))
  const outros = centavos(numero(valores, 'outrosDescontos'))

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: r.valores.liquido,
      detalhamento: [
        { rotulo: 'Salário bruto', valor: bruto, sinal: 'credito' },
        { rotulo: 'Contribuição previdenciária (INSS)', valor: r.valores.inss, sinal: 'debito' },
        { rotulo: 'Imposto de Renda retido na fonte', valor: r.valores.irrf, sinal: 'debito' },
        ...(pensao > 0
          ? ([{ rotulo: 'Pensão alimentícia', valor: pensao, sinal: 'debito' }] as const)
          : []),
        ...(outros > 0
          ? ([{ rotulo: 'Outros descontos', valor: outros, sinal: 'debito' }] as const)
          : []),
        { rotulo: 'Salário líquido', valor: r.valores.liquido, sinal: 'neutro' },
      ],
    },
  }
}

export const SALARIO_LIQUIDO: DefinicaoCalculadora = {
  id: 'CALC-001',
  slug: 'salario-liquido',
  nome: 'Salário líquido',
  linhaDeContexto: 'Quanto sobra do seu salário depois dos descontos legais — com a conta à mostra.',
  descricaoSeo:
    'Calcule o salário líquido com desconto de INSS e Imposto de Renda. Veja o passo a passo, o parâmetro legal usado, a vigência e o link para a norma.',

  campos: [
    {
      id: 'salarioBruto',
      rotulo: 'Salário bruto mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'dependentes',
      rotulo: 'Número de dependentes',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
      ajuda: 'Cada dependente reduz a base do Imposto de Renda.',
    },
    {
      id: 'pensao',
      rotulo: 'Pensão alimentícia (desconto judicial)',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
    },
    {
      id: 'outrosDescontos',
      rotulo: 'Outros descontos (plano de saúde, etc.)',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
    },
  ],

  parametrosRequeridos: [
    'inss-tabela-progressiva',
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
  ],

  rotuloResultado: 'Salário líquido estimado',

  calcular,

  faq: [
    {
      pergunta: 'Por que o desconto do INSS não é uma alíquota única?',
      resposta:
        'A contribuição é progressiva por faixa. Quem ganha R$ 5.000 não paga 14% sobre tudo: paga 7,5% sobre a parcela contida na primeira faixa, 9% sobre a da segunda, e assim por diante. Por isso a alíquota efetiva — o quanto o desconto representa do salário — é sempre menor que a alíquota da última faixa alcançada. A memória de cálculo mostra faixa a faixa.',
    },
    {
      pergunta: 'O que é o desconto simplificado e quando ele é usado?',
      resposta:
        'É uma dedução alternativa às deduções legais (previdência, dependentes e pensão). O cálculo apura as duas bases e aplica a que resultar em menos imposto para você. A memória registra qual foi aplicada e por quê.',
    },
    {
      pergunta: 'Por que o resultado muda quando eu troco o período?',
      resposta:
        'As tabelas de INSS e de Imposto de Renda mudam por norma, e nem sempre na virada do ano — a tabela do imposto mudou em maio de 2025, por exemplo. Ao escolher outro período, o cálculo usa a tabela que valia na época, e a memória mostra qual foi.',
    },
    {
      pergunta: 'Este valor é o que vou receber exatamente?',
      resposta:
        'É uma estimativa com base nos dados informados. O valor final pode variar conforme acordos, convenções coletivas, vale-transporte, adiantamentos e particularidades do seu contrato. Use o resultado para conferir o holerite, não para substituí-lo.',
    },
  ],

  relacionadas: ['inss', 'irrf'],
}
