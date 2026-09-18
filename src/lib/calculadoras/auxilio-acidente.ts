/**
 * CALC-110 — Auxílio-acidente (Lei nº 8.213/1991, art. 86).
 *
 * O benefício que mais surpreende pelo que NÃO faz: não substitui o salário,
 * não tem o piso do salário mínimo e é pago junto com o salário de quem volta
 * a trabalhar. A página diz as três coisas.
 *
 * Motor em `engine/calculadoras/beneficios-inss.ts`.
 */

import { calcularAuxilioAcidente } from '../engine/calculadoras/beneficios-inss'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS, INSS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularAuxilioAcidente({ salarioDeBeneficio: centavos(numero(valores, 'salarioDeBeneficio')) }, dataReferencia, registro)
  if (!r.ok) return r
  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorDoBeneficio,
      detalhamento: [
        { rotulo: 'Salário de benefício considerado', valor: v.salarioDeBeneficioConsiderado, sinal: 'neutro' },
        { rotulo: 'Auxílio-acidente mensal', valor: v.valorDoBeneficio, sinal: 'credito' },
      ],
      destaques: [
        { rotulo: 'Percentual', valor: formatarPercentual(v.percentual) },
        ...(v.aplicouTeto ? [{ rotulo: 'Limitado ao teto', valor: formatarReal(v.teto) }] : []),
        ...(v.abaixoDoMinimo ? [{ rotulo: 'Abaixo do salário mínimo', valor: 'Sim — é indenização' }] : []),
      ],
      notas: [
        'O auxílio-acidente é indenização: não substitui o salário, por isso pode ficar abaixo do salário mínimo e ' +
          'é recebido junto com o salário de quem continua trabalhando.',
        'Começa no dia seguinte ao fim do auxílio por incapacidade temporária e vai até a véspera de qualquer ' +
          'aposentadoria — não se acumula com ela.',
        'O salário de benefício é a média dos salários de contribuição desde julho de 1994, atualizados — está no ' +
          'extrato do CNIS, no Meu INSS.',
      ],
    },
  }
}

export const AUXILIO_ACIDENTE: DefinicaoCalculadora = {
  id: 'CALC-110',
  slug: 'auxilio-acidente',
  nome: 'Auxílio-acidente',
  linhaDeContexto: 'Metade do salário de benefício, somada ao salário — para quem ficou com sequela de acidente.',
  descricaoSeo:
    'Calcule o auxílio-acidente do INSS: 50% do salário de benefício, pago junto com o salário e sem o piso do salário mínimo.',

  campos: [
    {
      id: 'salarioDeBeneficio',
      rotulo: 'Salário de benefício',
      tipo: 'monetario',
      obrigatorio: true,
      padrao: 300_000,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'A média dos salários de contribuição desde julho de 1994, atualizados. Não é o último salário.',
    },
  ],

  parametrosRequeridos: ['auxilio-acidente-percentual', 'salario-minimo', 'inss-tabela-progressiva'],

  rotuloResultado: 'Auxílio-acidente mensal',

  calcular,

  faq: [
    {
      pergunta: 'Quanto é o auxílio-acidente?',
      resposta:
        'Cinquenta por cento do salário de benefício, conforme o § 1º do art. 86 da Lei nº 8.213/1991. O salário de benefício é a média dos salários de contribuição, limitada ao teto do INSS.',
    },
    {
      pergunta: 'Quem recebe o auxílio-acidente?',
      resposta:
        'O segurado que, depois de consolidadas as lesões de um acidente de qualquer natureza, fica com sequela que reduz a capacidade para o trabalho que exercia habitualmente.',
    },
    {
      pergunta: 'Posso trabalhar e receber o auxílio-acidente?',
      resposta:
        'Sim. Ele é indenização e é devido independentemente de qualquer remuneração (art. 86, § 2º). É por isso que pode ser menor que o salário mínimo.',
    },
    {
      pergunta: 'Até quando o auxílio-acidente é pago?',
      resposta:
        'Até a véspera do início de qualquer aposentadoria ou até o óbito do segurado. Ele não se acumula com aposentadoria.',
    },
    {
      pergunta: 'Qual a diferença para o auxílio por incapacidade temporária?',
      resposta:
        'O auxílio por incapacidade — o antigo auxílio-doença — substitui o salário enquanto a pessoa não pode trabalhar, e tem piso do salário mínimo. O auxílio-acidente vem depois, quando a pessoa volta ao trabalho com sequela, e indeniza a redução da capacidade.',
    },
  ],

  relacionadas: ['auxilio-por-incapacidade', 'valor-da-aposentadoria', 'pensao-por-morte', 'inss'],
}
