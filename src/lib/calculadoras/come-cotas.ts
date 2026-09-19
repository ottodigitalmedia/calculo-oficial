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
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(COME_COTAS, RENDA_FIXA)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const curto = texto(valores, 'fundo') === 'curto'
  const r = calcularComeCotas(
    {
      rendimentoAcumulado: centavos(numero(valores, 'rendimento')),
      rendimentoJaTributado: centavos(numero(valores, 'jaTributado')),
      impostoJaRetido: centavos(numero(valores, 'jaRetido')),
      diasDesdeAplicacao: numero(valores, 'dias'),
      fundo: curto ? 'curto' : 'longo',
      acimaDeSeisMeses: texto(valores, 'prazoCurto') === 'acima',
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
        { rotulo: 'Tipo de fundo', valor: curto ? 'curto prazo — carteira de até 365 dias' : 'longo prazo — regra geral' },
      ],
      notas: [
        'A retenção acontece no último dia útil de maio e de novembro, em cotas: o valor em reais continua, ' +
          'mas você fica com menos cotas do que tinha.',
        'O come-cotas não é imposto a mais. Ele antecipa a alíquota da tabela regressiva — no resgate, cobra-se ' +
          'apenas a diferença que faltar. O custo real é o rendimento que o valor antecipado deixa de gerar.',
        'Fundos de ações têm regime próprio, sem come-cotas, que esta estimativa não cobre. Os de curto prazo ' +
          '— carteira com prazo médio de até 365 dias — têm alíquotas próprias, escolhidas no primeiro campo.',
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
      id: 'fundo',
      rotulo: 'Tipo de fundo',
      tipo: 'selecao',
      padrao: 'longo',
      opcoes: [
        { valor: 'longo', rotulo: 'Longo prazo — a regra geral (multimercado, renda fixa comum)' },
        { valor: 'curto', rotulo: 'Curto prazo — carteira com prazo médio de até 365 dias' },
      ],
      ajuda: 'Está no regulamento e na lâmina do fundo. Na dúvida, a maioria dos fundos é de longo prazo.',
    },
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
      visivelSe: { campo: 'fundo', em: ['longo'] },
    },
    {
      id: 'prazoCurto',
      rotulo: 'Há quanto tempo a aplicação foi feita',
      tipo: 'selecao',
      padrao: 'ate',
      opcoes: [
        { valor: 'ate', rotulo: 'Até seis meses' },
        { valor: 'acima', rotulo: 'Mais de seis meses' },
      ],
      ajuda: 'Nos fundos de curto prazo, a lei conta o prazo em meses: são duas faixas.',
      visivelSe: { campo: 'fundo', em: ['curto'] },
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
    'come-cotas-curto-prazo-aliquota-periodica',
    'ir-fundo-curto-prazo-ate-seis-meses',
    'ir-fundo-curto-prazo-acima-seis-meses',
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
        'Não. Fundos de ações têm regime próprio, sem come-cotas. Os demais têm, e com duas regras: a geral, de longo prazo — a dos multimercados e da maioria dos fundos de renda fixa —, e a dos fundos de curto prazo, cuja carteira tem prazo médio de até 365 dias. A calculadora cobre as duas; escolha no primeiro campo.',
    },
    {
      pergunta: 'Como é o come-cotas do fundo de curto prazo?',
      resposta:
        'A retenção de maio e novembro é de 20%, e não de 15% (Lei nº 14.754/2023, art. 17, § 1º, II). No resgate, a alíquota final é de 22,5% para aplicações de até seis meses e de 20% acima disso (Lei nº 11.053/2004, art. 6º, § 2º). Com mais de seis meses, o come-cotas já antecipa a alíquota inteira: sobre o rendimento que passou por ele, não sobra complemento, e no resgate paga-se só o imposto do rendimento posterior à última retenção.',
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
