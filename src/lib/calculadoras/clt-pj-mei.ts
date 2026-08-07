/**
 * CALC-048 — Comparador CLT × PJ × MEI.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A última do catálogo, e a que mais esperou.** Foi bloqueada em 06/08/2026
 * quando a pesquisa mostrou que a premissa universal desse tipo de comparador —
 * "dividendo é isento" — tinha deixado de valer (§7.49). A leitura que a
 * destravou está em §10, e o que ela encontrou de mais importante foi uma data:
 * o art. 519 da LC nº 214/2025 substitui os anexos do Simples, mas só a partir
 * de 2027.
 *
 * O resultado principal é a **diferença entre o melhor e o pior regime**, e não
 * o valor de um deles: a pergunta que traz o usuário aqui é "qual compensa", e
 * quanto.
 */

import { calcularComparador, PARAMETROS_CLT_PJ_MEI } from '../engine/calculadoras/clt-pj-mei'
import type { AtividadeDoMei } from '../engine/calculadoras/mei'
import { multiplicarPorInteiro, subtrair } from '../engine/money'
import { centavos, type Centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { DIVIDENDOS } from '../params/data/dividendos'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { MEI } from '../params/data/mei'
import { SIMPLES_NACIONAL } from '../params/data/simples-nacional'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(INSS, IRRF, TRABALHISTA, SIMPLES_NACIONAL, DIVIDENDOS, MEI)

function atividade(v: string): AtividadeDoMei {
  return v === 'comercio' || v === 'comercio-e-servicos' ? v : 'servicos'
}

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularComparador(
    {
      salarioClt: centavos(numero(valores, 'salarioClt')),
      faturamento: centavos(numero(valores, 'faturamento')),
      proLabore: centavos(numero(valores, 'proLabore')),
      folhaMensal: centavos(numero(valores, 'folha')),
      custoContabil: centavos(numero(valores, 'contabilidade')),
      dependentes: numero(valores, 'dependentes'),
      atividadeMei: atividade(texto(valores, 'atividadeMei')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  const candidatos: readonly { readonly nome: string; readonly valor: Centavos }[] = [
    { nome: 'CLT', valor: v.clt },
    { nome: 'PJ no Simples', valor: v.pj },
    ...(v.mei !== null ? [{ nome: 'MEI', valor: v.mei }] : []),
  ]
  const melhor = candidatos.reduce((a, b) => (b.valor > a.valor ? b : a))
  const pior = candidatos.reduce((a, b) => (b.valor < a.valor ? b : a))
  const diferenca = subtrair(melhor.valor, pior.valor)
  const diferencaAnual = multiplicarPorInteiro(diferenca, 12)

  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'CLT — total por mês', valor: v.clt, sinal: 'neutro' },
    { rotulo: 'PJ no Simples — sobra por mês', valor: v.pj, sinal: 'neutro' },
    ...(v.mei !== null
      ? [{ rotulo: 'MEI — sobra por mês', valor: v.mei, sinal: 'neutro' as const }]
      : []),
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Compensa mais', valor: melhor.nome },
    { rotulo: 'Diferença por ano', valor: formatarReal(diferencaAnual) },
    { rotulo: `Anexo ${v.anexo} — fator R`, valor: formatarPercentual(v.fatorRBp) },
    { rotulo: 'Alíquota efetiva do Simples', valor: formatarPercentual(v.aliquotaEfetivaBp) },
  ]

  if (v.retencaoDividendos > 0) {
    destaques.push({
      rotulo: 'Retenção sobre dividendos',
      valor: formatarReal(v.retencaoDividendos),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: diferenca,
      detalhamento: linhas,
      destaques,
      notas: [
        `Com os números informados, ${melhor.nome} deixa ${formatarReal(diferenca)} a mais por mês ` +
          `que ${pior.nome} — ${formatarReal(diferencaAnual)} no ano.`,
        'O lado CLT soma o FGTS e as provisões de 13º e de férias com o terço. Sem elas a ' +
          'comparação seria desonesta com a carteira assinada: são valores que você recebe, ' +
          'apenas não no mesmo mês. A memória mostra cada parcela em separado.',
        v.anexo === 'V'
          ? 'Seu fator R ficou abaixo do limiar, então a empresa cai no Anexo V, que é bem mais ' +
            'caro. Aumentar o pró-labore pode levar ao Anexo III e reduzir o DAS — mas aumenta o ' +
            'INSS e o imposto sobre o pró-labore. Vale testar os dois cenários aqui.'
          : 'Seu fator R alcançou o limiar, e por isso a empresa é tributada pelo Anexo III. Se a ' +
            'folha cair em relação ao faturamento, ela volta para o Anexo V e o DAS sobe.',
        ...(v.retencaoDividendos > 0
          ? [
              'Os lucros distribuídos passaram do limite mensal, e por isso há retenção de imposto ' +
                'sobre o TOTAL distribuído — não apenas sobre o que excedeu. Um real a mais custa a ' +
                'retenção inteira. Distribuir parte em outro mês pode mudar isso.',
            ]
          : []),
        ...(v.acimaDaFronteira
          ? [
              'ATENÇÃO: o faturamento anual passa do limite a partir do qual existe tributação ' +
                'mínima do Imposto de Renda para a pessoa física. Essa tributação NÃO está ' +
                'calculada aqui, porque ela depende de um redutor que considera quanto a empresa ' +
                'já pagou sobre o lucro — número que só a contabilidade tem. O lado PJ acima está, ' +
                'portanto, otimista para você.',
            ]
          : []),
        ...(v.mei === null
          ? [
              'O MEI não aparece porque o faturamento anual passa do limite dele. Para ver o que ' +
                'muda ao ultrapassar esse teto, a calculadora de limite do MEI trata só disso.',
            ]
          : []),
        'Ficam de fora: contribuição sindical, ISS fixo de sociedade uniprofissional, custo de ' +
          'abertura da empresa e o Anexo IV, cujo INSS patronal é pago por fora do DAS. Também não ' +
          'entram benefícios da CLT que variam por empresa — plano de saúde, vale-refeição, ' +
          'participação nos lucros.',
      ],
    },
  }
}

export const CLT_PJ_MEI: DefinicaoCalculadora = {
  id: 'CALC-048',
  slug: 'clt-ou-pj',
  nome: 'CLT, PJ ou MEI',
  linhaDeContexto: 'Qual regime deixa mais dinheiro no seu bolso, com os seus números.',
  descricaoSeo:
    'Compare CLT, PJ no Simples Nacional e MEI: fator R, Anexo III ou V, alíquota efetiva do DAS e a retenção sobre dividendos. Com a norma de cada valor.',

  campos: [
    {
      id: 'salarioClt',
      rotulo: 'Salário bruto na proposta CLT',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000_000,
      ajuda: 'O salário mensal com carteira assinada, antes dos descontos.',
    },
    {
      id: 'faturamento',
      rotulo: 'Faturamento mensal na proposta PJ',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000_000,
      ajuda: 'O valor que a empresa contratante pagaria por mês à sua PJ.',
    },
    {
      id: 'proLabore',
      rotulo: 'Pró-labore mensal',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000_000,
      ajuda:
        'Quanto o sócio retira como remuneração pelo trabalho. É o que mais mexe no fator R — e no anexo aplicável.',
    },
    {
      id: 'folha',
      rotulo: 'Folha mensal total, incluindo o pró-labore',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000_000,
      ajuda:
        'Salários, pró-labore e os encargos efetivamente recolhidos. Se a empresa é só você, costuma ser o próprio pró-labore.',
    },
    {
      id: 'contabilidade',
      rotulo: 'Contabilidade e custos fixos da PJ',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_00,
      ajuda: 'Honorário contábil mensal e outros custos fixos de manter a empresa aberta.',
    },
    {
      id: 'dependentes',
      rotulo: 'Dependentes',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
    },
    {
      id: 'atividadeMei',
      rotulo: 'Se fosse MEI, a atividade seria',
      tipo: 'selecao',
      padrao: 'servicos',
      opcoes: [
        { valor: 'servicos', rotulo: 'Serviços' },
        { valor: 'comercio', rotulo: 'Comércio ou indústria' },
        { valor: 'comercio-e-servicos', rotulo: 'Comércio e serviços' },
      ],
      ajuda: 'Muda o tributo que entra no DAS do MEI além do INSS.',
    },
  ],

  parametrosRequeridos: [...PARAMETROS_CLT_PJ_MEI],
  rotuloResultado: 'Diferença por mês entre o melhor e o pior regime',
  calcular,

  avisoAdicional:
    'A comparação vale para os números informados e para o período selecionado. Não considera estabilidade, seguro-desemprego, aposentadoria futura nem o risco de a relação ser reconhecida como vínculo de emprego — que são decisivos e não cabem em número.',

  faq: [
    {
      pergunta: 'O que é o fator R, e por que ele muda tanto o resultado?',
      resposta:
        'É a razão entre a folha de salários e a receita bruta, ambas dos doze meses anteriores. Quando ela alcança o limiar legal, o serviço passa a ser tributado pelo Anexo III em vez do Anexo V — e a diferença entre os dois anexos, na primeira faixa, é de 15,50% para 6,00%. Aumentar o pró-labore é a forma usual de alcançar o limiar, mas ele traz INSS e imposto de renda junto: por isso a calculadora deixa você testar os dois cenários.',
    },
    {
      pergunta: 'A alíquota do meu anexo é a que eu pago?',
      resposta:
        'Não, e essa é a confusão mais cara desse cálculo. A alíquota da faixa é nominal; do valor apurado por ela se subtrai a parcela a deduzir, e o que sobra dividido pela receita é a alíquota EFETIVA — a que se paga de fato. Numa empresa de R$ 960 mil por ano no Anexo III, a nominal é 16% e a efetiva fica perto de 12,3%.',
    },
    {
      pergunta: 'Dividendo não era isento?',
      resposta:
        'Era, desde 1996. A Lei nº 15.270/2025 mudou isso a partir de janeiro de 2026: quando uma mesma empresa paga a uma mesma pessoa física mais que o limite mensal em lucros, há retenção de imposto na fonte sobre o TOTAL pago — não sobre o excedente. É degrau, não rampa, e a lei veda qualquer dedução dessa base.',
    },
    {
      pergunta: 'Por que a CLT aparece com valor maior do que o líquido do holerite?',
      resposta:
        'Porque a comparação soma o FGTS e as provisões mensais de 13º e de férias com o terço constitucional. Eles não caem na conta no mês, mas são seu — comparar só o líquido mensal faria a CLT parecer pior do que é. A memória de cálculo mostra cada parcela em separado, para você comparar do jeito que preferir.',
    },
    {
      pergunta: 'Por que a calculadora não aceita 2027?',
      resposta:
        'Porque a Lei Complementar nº 214/2025 substitui os anexos do Simples Nacional a partir de 1º de janeiro de 2027, e as tabelas novas ainda não foram lidas e cadastradas com a norma correspondente. Calcular 2027 com as tabelas de hoje produziria um número errado com aparência de exato.',
    },
  ],

  relacionadas: ['pro-labore', 'das-mei', 'limite-do-mei', 'salario-liquido'],
}
