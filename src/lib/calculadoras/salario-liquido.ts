/**
 * CALC-001 — Salário líquido. A primeira calculadora, e o molde de todas.
 *
 * Campos e microcopy de `03-functional-spec` §3.1, usados literalmente — o
 * documento diz que todo texto entre aspas ali é final.
 */

import { calcularSalarioLiquido } from '../engine/calculadoras/salario-liquido'
import { centavos } from '../engine/types'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { VALE_TRANSPORTE } from '../params/data/vale-transporte'
import { construirRegistro } from '../params/registry'

/**
 * Registro montado aqui, e não recebido de fora.
 *
 * Vive no módulo ADIADO: as tabelas legais só entram no navegador junto com o
 * cálculo que as usa, e não no pacote estático de toda rota. Ver `tipos.ts`,
 * `FuncaoCalculo`.
 */
const registro = construirRegistro(INSS, IRRF, VALE_TRANSPORTE)

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
      /**
       * O campo de custo só vale quando o usuário declarou que usa o benefício.
       *
       * Sem este recorte, desmarcar "Uso" e deixar o custo digitado manteria o
       * desconto no resultado — o campo some da tela e o valor continua na URL
       * (`RF-006`). É a mesma classe de defeito de um filtro que fica ativo
       * depois de escondido.
       */
      custoValeTransporte:
        texto(valores, 'optanteVT') === 'usa'
          ? centavos(numero(valores, 'custoVT'))
          : centavos(0),
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
        ...(r.valores.valeTransporte > 0
          ? ([
              {
                rotulo: 'Vale-transporte',
                valor: r.valores.valeTransporte,
                sinal: 'debito',
              },
            ] as const)
          : []),
        ...(outros > 0
          ? ([{ rotulo: 'Outros descontos', valor: outros, sinal: 'debito' }] as const)
          : []),
        { rotulo: 'Salário líquido', valor: r.valores.liquido, sinal: 'neutro' },
      ],
      notas:
        r.valores.valeTransporte > 0
          ? [
              'A cota do vale-transporte incide sobre o salário BÁSICO, sem adicionais nem ' +
                'vantagens. Esta calculadora usa o salário bruto que você informou — se ele ' +
                'inclui hora extra, adicional noturno ou periculosidade, a cota real é menor ' +
                'que a calculada aqui.',
              'O desconto nunca passa do custo real do seu transporte: quando ele é menor que a ' +
                'cota, o desconto é o próprio custo, e o empregador não participa.',
            ]
          : [],
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
      id: 'optanteVT',
      rotulo: 'Vale-transporte',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não uso' },
        { valor: 'usa', rotulo: 'Uso' },
      ],
      ajuda:
        'O desconto é o menor valor entre a cota do empregado sobre o salário e o custo real do seu transporte. O empregador arca com o que exceder.',
    },
    {
      id: 'custoVT',
      rotulo: 'Custo mensal do vale-transporte',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      // `03-functional-spec` §3.1: só aparece quando o usuário declara que usa.
      visivelSe: { campo: 'optanteVT', em: ['usa'] },
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
    'vale-transporte-cota-do-empregado',
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
      pergunta: 'Como o vale-transporte é descontado?',
      resposta:
        'O desconto é o menor valor entre dois números: a cota do empregado sobre o salário e o custo real do seu transporte no mês. Se o transporte custa mais que a cota, você paga a cota e o empregador arca com todo o excedente — é ele quem cobre a diferença, não você. Se custa menos, o desconto é o próprio custo, e nesse caso o empregador não participa. A memória de cálculo mostra os dois números e qual deles prevaleceu.',
    },
    {
      pergunta: 'A cota do vale-transporte incide sobre o quê, exatamente?',
      resposta:
        'Sobre o salário básico, excluídos quaisquer adicionais ou vantagens — é o que o regulamento determina. Esta calculadora aplica a cota sobre o salário bruto que você informar, porque é o campo que ela tem. Para quem não recebe adicional os dois valores coincidem e o resultado é exato. Para quem recebe hora extra, adicional noturno ou periculosidade, a cota real é um pouco menor que a exibida aqui — e isso só muda o desconto de quem gasta mais em transporte do que a cota.',
    },
    {
      pergunta: 'Este valor é o que vou receber exatamente?',
      resposta:
        'É uma estimativa com base nos dados informados. O valor final pode variar conforme acordos, convenções coletivas, vale-transporte, adiantamentos e particularidades do seu contrato. Use o resultado para conferir o holerite, não para substituí-lo.',
    },
  ],

  relacionadas: ['inss', 'irrf'],
}
