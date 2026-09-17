/**
 * CALC-100 — Pensão por morte.
 *
 * A conta é de percentuais, e o que ela precisa explicar é o que muda com o
 * tempo: as cotas por dependente cessam quando o dependente perde essa
 * qualidade e não voltam para os outros — a pensão encolhe ao longo dos anos.
 *
 * Motor em `engine/calculadoras/beneficios-inss.ts`.
 */

import { calcularPensaoPorMorte } from '../engine/calculadoras/beneficios-inss'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS, INSS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularPensaoPorMorte(
    {
      valorDaAposentadoria: centavos(numero(valores, 'aposentadoria')),
      dependentes: numero(valores, 'dependentes'),
      temDependenteInvalido: texto(valores, 'invalido') === 'sim',
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
      principal: v.valorDaPensao,
      detalhamento: [
        { rotulo: 'Pensão mensal estimada', valor: v.valorDaPensao, sinal: 'credito' },
      ],
      destaques: [
        { rotulo: 'Percentual aplicado', valor: formatarPercentual(v.percentualAplicado) },
        { rotulo: 'Cota familiar', valor: formatarPercentual(v.cotaFamiliar) },
        { rotulo: 'Valor de cada cota por dependente', valor: formatarReal(v.valorPorDependente) },
        ...(v.aplicouPiso ? [{ rotulo: 'Piso aplicado', valor: formatarReal(v.salarioMinimo) }] : []),
      ],
      notas: [
        'A pensão é rateada em partes iguais entre os dependentes habilitados — o valor acima é o total do ' +
          'benefício, não o que cada um recebe.',
        'As cotas por dependente cessam quando o dependente perde essa qualidade, e não são revertidas aos ' +
          'demais: a pensão diminui com o tempo, salvo quando restarem cinco ou mais dependentes.',
        'A duração da pensão do cônjuge ou companheiro depende da idade e do tempo de casamento ou união, em ' +
          'regra própria que esta estimativa não calcula.',
        'Para óbitos anteriores a 13 de novembro de 2019 vale a regra antiga, de cem por cento da ' +
          'aposentadoria — a calculadora recusa datas anteriores em vez de aplicar a regra errada.',
      ],
    },
  }
}

export const PENSAO_POR_MORTE: DefinicaoCalculadora = {
  id: 'CALC-100',
  slug: 'pensao-por-morte',
  nome: 'Pensão por morte do INSS',
  linhaDeContexto: 'Quanto a família recebe, pela cota familiar mais as cotas de cada dependente.',
  descricaoSeo:
    'Calcule a pensão por morte do INSS pela regra da Emenda 103: cota familiar, cotas por dependente, limite de cem por cento e piso do salário mínimo.',

  campos: [
    {
      id: 'aposentadoria',
      rotulo: 'Aposentadoria do segurado falecido',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000,
      ajuda: 'A aposentadoria que ele recebia — ou a que teria direito por incapacidade permanente, se ainda não era aposentado.',
    },
    {
      id: 'dependentes',
      rotulo: 'Dependentes habilitados',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 1,
      minimo: 1,
      maximo: 20,
      ajuda: 'Cônjuge ou companheiro, filhos menores ou inválidos, e demais dependentes reconhecidos.',
    },
    {
      id: 'invalido',
      rotulo: 'Há dependente inválido ou com deficiência?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não' },
        { valor: 'sim', rotulo: 'Sim' },
      ],
      ajuda: 'Deficiência intelectual, mental ou grave, nos termos da Emenda.',
    },
  ],

  parametrosRequeridos: [
    'pensao-cota-familiar',
    'pensao-cota-por-dependente',
    'pensao-cota-maxima',
    'salario-minimo',
  ],

  rotuloResultado: 'Pensão mensal estimada',

  calcular,

  faq: [
    {
      pergunta: 'Como a pensão por morte é calculada hoje?',
      resposta:
        'Pelo art. 23 da Emenda Constitucional nº 103/2019: uma cota familiar de metade do valor da aposentadoria, acrescida de dez pontos percentuais por dependente, até o limite de cem por cento. Antes da Emenda, a pensão correspondia à aposentadoria integral.',
    },
    {
      pergunta: 'A pensão diminui com o tempo?',
      resposta:
        'Diminui. O § 1º do art. 23 diz que as cotas por dependente cessam quando o dependente perde essa qualidade — por exemplo, quando o filho atinge a idade-limite — e não são revertidas aos demais. A exceção é quando restarem cinco ou mais dependentes: aí o valor de cem por cento é preservado.',
    },
    {
      pergunta: 'E se houver dependente inválido ou com deficiência?',
      resposta:
        'O § 2º garante o valor integral da aposentadoria nesse caso, independentemente do número de dependentes. É a hipótese em que a pensão começa já nos cem por cento.',
    },
    {
      pergunta: 'A pensão pode ser menor que um salário mínimo?',
      resposta:
        'Não. O art. 201, § 2º, da Constituição impede que qualquer benefício que substitua o salário de contribuição fique abaixo do salário mínimo. Quando o percentual leva a um valor menor, o piso se aplica.',
    },
    {
      pergunta: 'Por quanto tempo o cônjuge recebe?',
      resposta:
        'Depende da idade do cônjuge ou companheiro na data do óbito e do tempo de casamento ou união estável, além do número de contribuições do falecido. A duração varia de alguns meses até a vitaliciedade, em tabela própria — esta calculadora trata do valor, não do prazo.',
    },
    {
      pergunta: 'O valor é dividido entre os dependentes?',
      resposta:
        'Sim. O total calculado é rateado em partes iguais entre os dependentes habilitados. Quando um deles perde a qualidade, a cota dele deixa de compor o benefício, em vez de ser redistribuída.',
    },
  ],

  relacionadas: ['auxilio-por-incapacidade', 'salario-maternidade-do-inss', 'inss'],
}
