/**
 * CALC-081 — Desconto de faltas.
 *
 * A falta sem justificativa custa duas coisas, e quase todo mundo só conta uma:
 * o dia não trabalhado e o repouso semanal remunerado daquela semana (Lei nº
 * 605/1949, art. 6º). A memória separa as duas.
 *
 * Nenhum parâmetro com vigência. Motor em `engine/calculadoras/repouso.ts`.
 */

import { calcularDescontoDeFaltas } from '../engine/calculadoras/repouso'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularDescontoDeFaltas(
    {
      salario: centavos(numero(valores, 'salario')),
      faltas: numero(valores, 'faltas'),
      semanasComFalta: numero(valores, 'semanasComFalta'),
    },
    dataReferencia,
  )
  if (!r.ok) return r
  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.descontoTotal,
      detalhamento: [
        { rotulo: 'Dias de falta', valor: v.descontoDosDias, sinal: 'debito' },
        ...(v.descontoDoRepouso > 0
          ? ([{ rotulo: 'Repouso semanal perdido', valor: v.descontoDoRepouso, sinal: 'debito' }] as const)
          : []),
        { rotulo: 'Salário bruto após o desconto', valor: v.salarioAposDesconto, sinal: 'neutro' },
      ],
      destaques: [{ rotulo: 'Valor de um dia', valor: formatarReal(v.salarioDia) }],
      notas: [
        'Só a falta sem motivo justificado gera desconto. Atestado médico, casamento, falecimento na ' +
          'família, doação de sangue e as demais hipóteses legais não descontam o dia nem o repouso.',
      ],
    },
  }
}

export const DESCONTO_DE_FALTAS: DefinicaoCalculadora = {
  id: 'CALC-081',
  slug: 'desconto-de-faltas',
  nome: 'Desconto de faltas no salário',
  linhaDeContexto: 'Quanto uma falta sem justificativa tira do salário, contando o dia e o descanso semanal.',
  descricaoSeo:
    'Calcule o desconto de faltas no salário: o valor dos dias e a perda do descanso semanal remunerado da semana da falta, com a lei de cada etapa.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário bruto mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'faltas',
      rotulo: 'Dias de falta sem justificativa',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 30,
    },
    {
      id: 'semanasComFalta',
      rotulo: 'Semanas com pelo menos uma falta',
      tipo: 'inteiro',
      padrao: 1,
      minimo: 0,
      maximo: 5,
      ajuda: 'Cada semana com falta injustificada perde um descanso semanal remunerado.',
    },
  ],

  parametrosRequeridos: [],

  rotuloResultado: 'Desconto estimado',

  calcular,

  faq: [
    {
      pergunta: 'Uma falta desconta um dia ou dois?',
      resposta:
        'Pode descontar dois. Além do dia não trabalhado, o art. 6º da Lei nº 605/1949 tira a remuneração do repouso semanal da semana em que houve falta sem motivo justificado. Duas faltas na mesma semana perdem um só repouso; duas faltas em semanas diferentes perdem dois.',
    },
    {
      pergunta: 'Por que o dia vale um trinta avos do salário?',
      resposta:
        'Porque o salário mensal remunera o mês comercial de 30 dias, que é a base do art. 64 da CLT para calcular salário-hora e salário-dia. Por isso o valor de um dia é o mesmo em fevereiro e em março, independentemente de quantos dias o mês tem.',
    },
    {
      pergunta: 'Quais faltas não podem ser descontadas?',
      resposta:
        'As justificadas. O art. 473 da CLT lista, entre outras, o falecimento de parente próximo, o casamento, o nascimento de filho, a doação de sangue, o alistamento eleitoral e o comparecimento em juízo. A Lei nº 605/1949 acrescenta a doença comprovada por atestado e o acidente de trabalho. Nesses casos não há desconto do dia nem do repouso.',
    },
    {
      pergunta: 'A empresa pode descontar atraso?',
      resposta:
        'Atraso também é tempo não trabalhado e pode ser descontado proporcionalmente, observada a tolerância do art. 58, § 1º, da CLT e o que prevê a convenção coletiva. Esta calculadora trata de dias inteiros de falta, não de minutos de atraso.',
    },
    {
      pergunta: 'O desconto muda o INSS e o imposto do mês?',
      resposta:
        'Muda, para menos. O INSS e o imposto de renda incidem sobre o salário efetivamente pago, e o salário após o desconto é menor. Use o valor de salário bruto após o desconto na calculadora de salário líquido.',
    },
  ],

  relacionadas: ['dsr-sobre-comissoes', 'salario-liquido', 'banco-de-horas'],
}
