/**
 * CALC-102 — Salário-maternidade pago pelo INSS.
 *
 * A empregada com carteira recebe a remuneração integral pela empresa, que é
 * reembolsada — e para ela não há o que estimar. Esta página é das OUTRAS: a
 * doméstica, a segurada especial, a contribuinte individual, a MEI e a
 * desempregada que mantém a qualidade de segurada. Cada uma tem uma base
 * diferente, e é isso que a calculadora resolve.
 *
 * Motor em `engine/calculadoras/beneficios-inss.ts`.
 */

import {
  calcularSalarioMaternidadeInss,
  somarMeses,
  type CategoriaDaSegurada,
} from '../engine/calculadoras/beneficios-inss'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS, INSS)

const CATEGORIAS: readonly CategoriaDaSegurada[] = ['domestica', 'especial', 'demais']

function categoriaDe(valor: string): CategoriaDaSegurada {
  return CATEGORIAS.find((c) => c === valor) ?? 'demais'
}

/** A licença dura cento e vinte dias — quatro meses de benefício. */
const MESES_DE_BENEFICIO = 4

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularSalarioMaternidadeInss(
    {
      categoria: categoriaDe(texto(valores, 'categoria')),
      ultimoSalarioDeContribuicao: centavos(numero(valores, 'ultimoSalario')),
      somaDosDozeUltimos: centavos(numero(valores, 'somaDoze')),
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
      principal: v.valorMensal,
      detalhamento: [
        { rotulo: 'Parcela mensal', valor: v.valorMensal, sinal: 'credito' },
        {
          rotulo: 'Total dos quatro meses de licença',
          valor: somarMeses(v.valorMensal, MESES_DE_BENEFICIO),
          sinal: 'neutro',
        },
      ],
      destaques: [
        { rotulo: 'Teto do INSS', valor: formatarReal(v.teto) },
        { rotulo: 'Piso — salário mínimo', valor: formatarReal(v.salarioMinimo) },
        ...(v.aplicouTeto ? [{ rotulo: 'Limitado pelo teto', valor: 'Sim' }] : []),
      ],
      notas: [
        'A empregada com carteira assinada não entra nesta conta: ela recebe a remuneração integral, paga pela ' +
          'empresa e compensada junto à Previdência. Para ela, o valor é o próprio salário.',
        'O benefício dura cento e vinte dias. O total acima soma quatro parcelas mensais, que é a leitura ' +
          'usual do período — a distribuição exata das parcelas depende da data de início.',
        'Há carência de dez contribuições para a contribuinte individual, a facultativa e a MEI; para a ' +
          'empregada doméstica e a segurada especial, as regras são outras.',
      ],
    },
  }
}

export const SALARIO_MATERNIDADE_DO_INSS: DefinicaoCalculadora = {
  id: 'CALC-102',
  slug: 'salario-maternidade-do-inss',
  nome: 'Salário-maternidade pago pelo INSS',
  linhaDeContexto: 'Quanto recebe quem não é empregada com carteira: doméstica, autônoma, MEI ou desempregada.',
  descricaoSeo:
    'Calcule o salário-maternidade pago pelo INSS conforme a sua categoria de segurada, com o piso do salário mínimo e o teto do regime.',

  campos: [
    {
      id: 'categoria',
      rotulo: 'Sua situação',
      tipo: 'selecao',
      padrao: 'demais',
      opcoes: [
        { valor: 'demais', rotulo: 'Contribuinte individual, MEI, facultativa ou desempregada' },
        { valor: 'domestica', rotulo: 'Empregada doméstica' },
        { valor: 'especial', rotulo: 'Segurada especial (trabalhadora rural)' },
      ],
    },
    {
      id: 'somaDoze',
      rotulo: 'Soma dos 12 últimos salários de contribuição',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Apurados em período não superior a quinze meses. Usado por quem é contribuinte individual, MEI, facultativa ou desempregada.',
      visivelSe: { campo: 'categoria', em: ['demais'] },
    },
    {
      id: 'ultimoSalario',
      rotulo: 'Último salário de contribuição',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Usado pela empregada doméstica.',
      visivelSe: { campo: 'categoria', em: ['domestica'] },
    },
  ],

  parametrosRequeridos: ['salario-minimo', 'inss-tabela-progressiva'],

  rotuloResultado: 'Parcela mensal estimada',

  calcular,

  faq: [
    {
      pergunta: 'Quem recebe o salário-maternidade direto do INSS?',
      resposta:
        'A empregada doméstica, a segurada especial, a contribuinte individual, a facultativa, a MEI e a desempregada que mantém a qualidade de segurada. A empregada com carteira assinada recebe da empresa, que depois é reembolsada pela Previdência.',
    },
    {
      pergunta: 'Como o valor é calculado em cada caso?',
      resposta:
        'O art. 73 da Lei nº 8.213/1991 traz três regras: o último salário de contribuição para a empregada doméstica; um salário mínimo para a segurada especial; e um doze avos da soma dos doze últimos salários de contribuição para as demais. O parágrafo único estende essa última regra à desempregada que mantém a qualidade de segurada.',
    },
    {
      pergunta: 'Existe valor mínimo e máximo?',
      resposta:
        'O próprio art. 73 assegura o piso de um salário mínimo. E há o teto do Regime Geral, que é o limite máximo do salário de contribuição publicado a cada ano — nenhum benefício ultrapassa esse valor.',
    },
    {
      pergunta: 'Quanto tempo dura?',
      resposta:
        'Cento e vinte dias, como a licença-maternidade da empregada. A adoção também dá direito ao benefício, e o pai pode recebê-lo nas hipóteses em que a lei transfere o direito, como no falecimento da mãe.',
    },
    {
      pergunta: 'Preciso ter contribuído por quanto tempo?',
      resposta:
        'A contribuinte individual, a facultativa e a MEI precisam de dez contribuições mensais de carência. A empregada doméstica e a segurada especial seguem regras próprias — a especial precisa comprovar o exercício da atividade rural nos meses anteriores ao parto.',
    },
    {
      pergunta: 'O benefício desconta imposto de renda?',
      resposta:
        'O salário-maternidade é rendimento tributável e entra na declaração anual. Quando pago pelo INSS, a retenção segue a tabela mensal — e a calculadora de imposto de renda na folha mostra o efeito.',
    },
  ],

  relacionadas: ['licenca-maternidade', 'pensao-por-morte', 'inss-autonomo-e-facultativo', 'salario-familia'],
}
