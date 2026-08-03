/**
 * CALC-050 — INSS do contribuinte individual e do facultativo.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A confusão que ela desfaz:** a tabela progressiva de 7,5% a 14% é a do
 * segurado EMPREGADO. Quem recolhe por conta própria paga alíquota única, e a
 * base dos planos reduzidos é fixa no salário mínimo — não acompanha a renda.
 *
 * **O que ela recusa a fazer** está declarado na tela e no motor: a
 * complementação do § 3º sai sem os juros moratórios, porque eles dependem da
 * Selic acumulada da competência. Chamar a diferença de alíquota de "valor a
 * pagar" erraria para menos.
 */

import { calcularInssIndividual, diferencaMensal } from '../engine/calculadoras/inss-individual'
import type { PlanoDeContribuicao } from '../engine/calculadoras/inss-individual'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { INSS_INDIVIDUAL } from '../params/data/inss-individual'
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
const registro = construirRegistro(INSS, INSS_INDIVIDUAL)

const PLANOS_VALIDOS: readonly PlanoDeContribuicao[] = ['completo', 'simplificado', 'baixa-renda']

function lerPlano(valor: string): PlanoDeContribuicao {
  return PLANOS_VALIDOS.includes(valor as PlanoDeContribuicao)
    ? (valor as PlanoDeContribuicao)
    : 'completo'
}

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const plano = lerPlano(texto(valores, 'plano'))

  const r = calcularInssIndividual(
    { plano, salarioDeContribuicao: centavos(numero(valores, 'renda')) },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam a contribuição exibida. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Base de cálculo', valor: v.baseDeCalculo, sinal: 'neutro' },
    {
      rotulo: `Contribuição — ${formatarPercentual(v.aliquotaBp)} sobre a base`,
      valor: v.contribuicao,
      sinal: 'neutro',
    },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Alíquota', valor: formatarPercentual(v.aliquotaBp) },
    { rotulo: 'Em doze meses', valor: formatarReal(v.contribuicaoAnual) },
  ]

  if (v.ehPlanoReduzido) {
    destaques.push(
      { rotulo: 'No plano completo, seria', valor: formatarReal(v.contribuicaoNoCompleto) },
      { rotulo: 'Diferença por mês', valor: formatarReal(diferencaMensal(v)) },
      {
        rotulo: 'Diferença até os 20%, sem juros',
        valor: formatarReal(v.complementacaoMensal),
      },
    )
  } else {
    destaques.push(
      { rotulo: 'Teto do salário-de-contribuição', valor: formatarReal(v.limiteMaximo) },
      { rotulo: 'Limite mínimo', valor: formatarReal(v.limiteMinimo) },
    )
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.contribuicao,
      detalhamento: linhas,
      destaques,
      notas: [
        'A tabela progressiva de 7,5% a 14% é a do segurado EMPREGADO, e não vale aqui. Quem ' +
          'recolhe por conta própria paga alíquota única sobre a base do seu plano.',
        ...(v.ehPlanoReduzido
          ? [
              'Nos planos reduzidos a base é FIXA no salário mínimo, por determinação da lei — ela ' +
                'não acompanha o quanto você ganha. Informar renda maior não muda o valor a pagar, ' +
                'e é por isso que o campo de renda serve aqui só para a comparação com o plano ' +
                'completo.',
              'A opção pelo plano reduzido exclui o direito ao benefício de aposentadoria por tempo ' +
                'de contribuição. Para contar esse tempo depois, a lei exige complementar a ' +
                'diferença até os 20% sobre o limite mínimo, acrescida de juros.',
              'A "diferença até os 20%" mostrada acima é só a diferença de ALÍQUOTA. O valor real ' +
                'do recolhimento complementar é maior: a lei manda acrescer juros moratórios que ' +
                'dependem da Selic acumulada desde a competência a ser complementada, e esta ' +
                'calculadora não os projeta.',
            ]
          : [
              'No plano completo a base é o valor que você declara, entre o limite mínimo e o teto. ' +
                'Contribuir sobre valor acima do teto não é possível — a contribuição do segurado ' +
                'não incide sobre a parcela que o excede.',
              'Contribuir sobre base maior aumenta o valor pago e influencia o cálculo dos ' +
                'benefícios, que segue regra própria e não é objeto desta página.',
            ]),
        'Esta conta é de quem recolhe por conta própria, pela sua guia. Quem presta serviço a ' +
          'empresa tem a contribuição retida e recolhida por ela, com regra própria — e nesse ' +
          'caso o valor não sai daqui.',
        'O microempreendedor individual não usa esta página: o MEI recolhe a contribuição dentro ' +
          'do DAS, com valor próprio.',
      ],
    },
  }
}

export const INSS_AUTONOMO: DefinicaoCalculadora = {
  id: 'CALC-050',
  slug: 'inss-autonomo-e-facultativo',
  nome: 'INSS do autônomo e do facultativo',
  linhaDeContexto: 'Quanto recolher por conta própria — e por que a tabela do empregado não vale.',
  descricaoSeo:
    'Calcule a contribuição do INSS de quem recolhe por conta própria: plano completo de 20%, simplificado de 11% e o de 5% do facultativo de baixa renda.',

  campos: [
    {
      id: 'plano',
      rotulo: 'Como você contribui',
      tipo: 'selecao',
      padrao: 'completo',
      opcoes: [
        { valor: 'completo', rotulo: 'Plano completo — 20% sobre o que eu declarar' },
        { valor: 'simplificado', rotulo: 'Plano simplificado — 11% sobre o salário mínimo' },
        { valor: 'baixa-renda', rotulo: 'Facultativo de baixa renda — 5% sobre o salário mínimo' },
      ],
    },
    {
      id: 'renda',
      rotulo: 'Sobre quanto você quer contribuir',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_00,
      ajuda:
        'No plano completo é a base do cálculo, entre o mínimo e o teto. Nos planos reduzidos a base é fixa no salário mínimo, e este valor serve só para comparar.',
    },
  ],

  parametrosRequeridos: [
    'inss-individual-aliquota-completa',
    'inss-individual-aliquota-simplificada',
    'inss-individual-aliquota-baixa-renda',
    'inss-individual-complementacao',
    'salario-minimo',
    'inss-tabela-progressiva',
  ],

  rotuloResultado: 'Contribuição do mês',

  calcular,

  faq: [
    {
      pergunta: 'Por que o valor não muda quando eu aumento a renda?',
      resposta:
        'Porque nos planos simplificado e de baixa renda a base é fixa no salário mínimo, por determinação da lei — ela não acompanha o quanto você ganha. Quem paga 11% paga 11% do salário mínimo, ganhando dois mil ou dez mil reais. Só no plano completo a base é o valor que você declara, e aí sim a renda muda o resultado.',
    },
    {
      pergunta: 'Vale a pena pagar 11% em vez de 20%?',
      resposta:
        'Depende do que você quer do tempo de contribuição, e não só do valor da guia. A opção pelo plano reduzido exclui o direito ao benefício de aposentadoria por tempo de contribuição, e para contar esse tempo depois a lei exige complementar a diferença até os 20% sobre o limite mínimo, acrescida de juros. O resultado mostra a diferença mensal entre os dois planos justamente para essa comparação — o que ele não faz é decidir por você, porque a resposta depende de qual benefício você pretende pedir e quando.',
    },
    {
      pergunta: 'Por que a tabela de 7,5% a 14% não vale para mim?',
      resposta:
        'Porque ela é a do segurado empregado, doméstico e avulso, que tem desconto progressivo por faixa na folha. O contribuinte individual e o facultativo recolhem por alíquota única, sobre a base do plano escolhido. É a confusão mais comum de quem procura o assunto, e ela erra bastante: 14% sobre uma renda alta não é o que se paga aqui, e 7,5% sobre o mínimo também não.',
    },
    {
      pergunta: 'Quanto custa a complementação para contar o tempo?',
      resposta:
        'A lei manda recolher, sobre o limite mínimo, a diferença entre o percentual pago e os 20%, acrescida de juros moratórios. Esta página mostra a diferença de alíquota — 9 pontos para quem paga 11%, 15 para quem paga 5% — mas não projeta os juros, que dependem da Selic acumulada desde a competência a ser complementada até o recolhimento. O valor real é maior que o exibido, e ele é apurado na hora de emitir a guia.',
    },
    {
      pergunta: 'Presto serviço para empresas. Uso esta calculadora?',
      resposta:
        'Não para essa parte da renda. Quando o contribuinte individual presta serviço a uma empresa, é ela que retém e recolhe a contribuição, por regra própria — o valor não sai desta página. Esta conta é de quem recolhe por conta própria, emitindo a sua guia, que é o caso de quem atende pessoas físicas e do segurado facultativo.',
    },
  ],

  relacionadas: ['inss', 'salario-liquido', 'precificacao-de-hora'],
}
