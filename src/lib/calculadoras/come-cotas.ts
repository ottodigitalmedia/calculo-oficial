/**
 * CALC-098 — Come-cotas.
 *
 * A pergunta que traz a pessoa aqui costuma vir com susto: "sumiram cotas do meu
 * fundo". A página mostra quanto a retenção leva agora, qual é a alíquota final
 * pelo prazo e quanto ainda falta pagar no resgate — que é o que transforma o
 * susto em conta.
 *
 * Motor em `engine/calculadoras/come-cotas.ts`.
 */

import { calcularComeCotas } from '../engine/calculadoras/come-cotas'
import { centavos } from '../engine/types'
import { formatarPercentual } from '../format/moeda'
import { COME_COTAS } from '../params/data/come-cotas'
import { RENDA_FIXA } from '../params/data/renda-fixa'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(COME_COTAS, RENDA_FIXA)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularComeCotas(
    {
      rendimentoAcumulado: centavos(numero(valores, 'rendimento')),
      rendimentoJaTributado: centavos(numero(valores, 'jaTributado')),
      impostoJaRetido: centavos(numero(valores, 'jaRetido')),
      diasDesdeAplicacao: numero(valores, 'dias'),
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
      principal: v.comeCotas,
      detalhamento: [
        { rotulo: 'Base do come-cotas', valor: v.baseDoComeCotas, sinal: 'neutro' },
        { rotulo: 'Retenção deste semestre', valor: v.comeCotas, sinal: 'debito' },
        { rotulo: 'Imposto total se resgatar hoje', valor: v.impostoNoResgate, sinal: 'neutro' },
        { rotulo: 'Complemento no resgate', valor: v.complementoNoResgate, sinal: 'debito' },
      ],
      destaques: [
        { rotulo: 'Alíquota do come-cotas', valor: formatarPercentual(v.aliquotaPeriodica) },
        { rotulo: 'Alíquota final pelo prazo', valor: formatarPercentual(v.aliquotaFinal) },
      ],
      notas: [
        'A retenção acontece no último dia útil de maio e de novembro, em cotas: o valor em reais continua, ' +
          'mas você fica com menos cotas do que tinha.',
        'O come-cotas não é imposto a mais. Ele antecipa a alíquota da tabela regressiva — no resgate, cobra-se ' +
          'apenas a diferença que faltar. O custo real é o rendimento que o valor antecipado deixa de gerar.',
        'Fundos de prazo médio curto e fundos de ações têm regras próprias, que esta estimativa não cobre. ' +
          'Ela trata dos fundos da regra geral, de longo prazo.',
      ],
    },
  }
}

export const COME_COTAS_CALC: DefinicaoCalculadora = {
  id: 'CALC-098',
  slug: 'come-cotas',
  nome: 'Come-cotas do fundo de investimento',
  linhaDeContexto: 'Quanto a retenção de maio e novembro leva, e quanto ainda falta pagar no resgate.',
  descricaoSeo:
    'Calcule o come-cotas do seu fundo: a retenção semestral, a alíquota final pela tabela regressiva e o complemento devido no resgate.',

  campos: [
    {
      id: 'rendimento',
      rotulo: 'Rendimento acumulado desde a aplicação',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
      ajuda: 'Diferença entre o valor atual da aplicação e o que você aportou.',
    },
    {
      id: 'jaTributado',
      rotulo: 'Rendimento já tributado em come-cotas anteriores',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Se este é o primeiro come-cotas da aplicação, deixe zero.',
    },
    {
      id: 'jaRetido',
      rotulo: 'Imposto já retido em come-cotas anteriores',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'O total descontado nos semestres passados, conforme o informe do fundo.',
    },
    {
      id: 'dias',
      rotulo: 'Dias desde a aplicação',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 365,
      minimo: 1,
      maximo: 36_500,
      ajuda: 'É o prazo que decide a alíquota final da tabela regressiva.',
    },
  ],

  parametrosRequeridos: [
    'come-cotas-aliquota-periodica',
    'ir-renda-fixa-faixa-1',
    'ir-renda-fixa-faixa-2',
    'ir-renda-fixa-faixa-3',
    'ir-renda-fixa-faixa-4',
    'ir-renda-fixa-limite-1',
    'ir-renda-fixa-limite-2',
    'ir-renda-fixa-limite-3',
  ],

  rotuloResultado: 'Come-cotas estimado do semestre',

  calcular,

  faq: [
    {
      pergunta: 'O que é o come-cotas?',
      resposta:
        'É a antecipação do imposto de renda nos fundos de investimento. O art. 17 da Lei nº 14.754/2023 determina a retenção no último dia útil de maio e de novembro, sobre o rendimento ainda não tributado — mesmo que você não tenha resgatado nada. A cobrança é feita em cotas: o valor em reais permanece, mas a quantidade de cotas diminui.',
    },
    {
      pergunta: 'Eu pago imposto duas vezes?',
      resposta:
        'Não. O que já foi tributado entra no custo de aquisição e não volta a ser cobrado, como diz o § 2º do art. 17. E, no resgate, paga-se apenas o percentual que falta para chegar à alíquota da tabela regressiva pelo prazo da aplicação.',
    },
    {
      pergunta: 'Se o come-cotas antecipa o imposto, qual é o problema?',
      resposta:
        'O dinheiro que sai antes do tempo deixa de render. Duas aplicações com a mesma rentabilidade bruta terminam com saldos diferentes se uma sofre come-cotas e a outra só é tributada no resgate — a diferença cresce com o tempo, e é por isso que ela pesa mais em investimentos longos.',
    },
    {
      pergunta: 'Todo fundo tem come-cotas?',
      resposta:
        'Não. Fundos de ações têm regime próprio, e fundos de prazo médio curto seguem alíquotas diferentes, com retenção periódica maior e tabela própria no resgate. Esta calculadora trata dos fundos da regra geral, de longo prazo — os multimercados e os de renda fixa mais comuns.',
    },
    {
      pergunta: 'E se eu resgatar logo depois do come-cotas?',
      resposta:
        'A alíquota final é a da tabela regressiva pelo prazo da aplicação. Se ela for maior que a já retida, paga-se a diferença; se for igual, não há mais nada a pagar. Não há devolução quando o total retido supera o devido — o que ocorre é simplesmente a ausência de nova cobrança.',
    },
    {
      pergunta: 'Como eu sei quanto já foi retido?',
      resposta:
        'O informe de rendimentos do fundo e o extrato da instituição trazem o imposto retido em cada come-cotas e o rendimento tributado. São esses dois números que a calculadora pede para estimar o complemento com precisão.',
    },
  ],

  relacionadas: ['ir-renda-fixa', 'onde-render-mais', 'ir-em-bolsa-de-valores', 'valor-futuro-corrigido'],
}
