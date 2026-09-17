/**
 * CALC-093 — Imposto sobre ganhos em bolsa (ações e day trade).
 *
 * A pergunta que traz a pessoa aqui é sempre a mesma: "preciso pagar DARF este
 * mês?". A resposta depende de três coisas que quase toda conta de cabeça
 * confunde — o limite de isenção é do valor VENDIDO, day trade é um bolso
 * separado, e a retenção na fonte é antecipação, não imposto.
 *
 * Motor em `engine/calculadoras/bolsa.ts`.
 */

import { calcularIrBolsa } from '../engine/calculadoras/bolsa'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { BOLSA } from '../params/data/bolsa'
import { construirRegistro } from '../params/registry'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

const registro = construirRegistro(BOLSA)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularIrBolsa(
    {
      vendasComuns: centavos(numero(valores, 'vendasComuns')),
      resultadoComum: centavos(numero(valores, 'ganhoComum') - numero(valores, 'perdaComum')),
      prejuizoAcumuladoComum: centavos(numero(valores, 'prejuizoComum')),
      resultadoDayTrade: centavos(numero(valores, 'ganhoDayTrade') - numero(valores, 'perdaDayTrade')),
      prejuizoAcumuladoDayTrade: centavos(numero(valores, 'prejuizoDayTrade')),
      irrfRetidoInformado: centavos(numero(valores, 'irrfRetido')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const detalhamento: LinhaDetalhamento[] = [
    ...(v.impostoComum > 0
      ? ([{ rotulo: 'Imposto das operações comuns', valor: v.impostoComum, sinal: 'debito' }] as const)
      : []),
    ...(v.impostoDayTrade > 0
      ? ([{ rotulo: 'Imposto do day trade', valor: v.impostoDayTrade, sinal: 'debito' }] as const)
      : []),
    ...(v.irrfDeduzido > 0
      ? ([{ rotulo: 'Retenção na fonte já sofrida', valor: v.irrfDeduzido, sinal: 'credito' }] as const)
      : []),
    { rotulo: 'DARF do mês', valor: v.darf, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Limite de isenção no mês', valor: formatarReal(v.limiteIsencao) },
    {
      rotulo: 'Vendas de ações no mês',
      valor: v.isentoNoMes ? 'Dentro da isenção' : 'Acima do limite',
    },
    ...(v.prejuizoAProximoComum > 0
      ? [{ rotulo: 'Prejuízo a transportar — comum', valor: formatarReal(v.prejuizoAProximoComum) }]
      : []),
    ...(v.prejuizoAProximoDayTrade > 0
      ? [{ rotulo: 'Prejuízo a transportar — day trade', valor: formatarReal(v.prejuizoAProximoDayTrade) }]
      : []),
  ]

  const notas = [
    'O imposto é apurado mês a mês e pago até o último dia útil do mês seguinte, no código de receita da ' +
      'renda variável. A calculadora trata de um mês por vez.',
    'A isenção vale para o mercado à vista de ações. Day trade, fundos imobiliários, opções, futuros e termo ' +
      'ficam de fora dela.',
    ...(v.irrfEstimado
      ? [
          'A retenção na fonte foi estimada pelas regras da lei. O valor efetivamente retido está na sua nota ' +
            'de corretagem e no informe da corretora — informe-o para a conta ficar exata.',
        ]
      : []),
    ...(v.acumulaParaOProximoMes
      ? [
          'O imposto apurado ficou abaixo do valor mínimo do DARF: ele não é pago agora, mas continua devido — ' +
            'soma-se ao dos meses seguintes, no mesmo código, até alcançar o mínimo.',
        ]
      : []),
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: { principal: v.darf, detalhamento, destaques, notas },
  }
}

export const IR_EM_BOLSA: DefinicaoCalculadora = {
  id: 'CALC-093',
  slug: 'ir-em-bolsa-de-valores',
  nome: 'Imposto sobre ganhos em bolsa',
  linhaDeContexto: 'Se há DARF a pagar no mês, com a isenção das vendas, o day trade à parte e o prejuízo compensado.',
  descricaoSeo:
    'Calcule o imposto mensal sobre ações e day trade: isenção pelo valor vendido, compensação de prejuízo, retenção na fonte e o DARF do mês.',

  campos: [
    {
      id: 'vendasComuns',
      rotulo: 'Total vendido em ações no mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Soma de todas as vendas no mercado à vista, mesmo as que deram prejuízo. É este valor que decide a isenção.',
    },
    {
      id: 'ganhoComum',
      rotulo: 'Lucro do mês em operações comuns',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Já descontados custos e corretagem. Zero se o mês fechou no prejuízo.',
    },
    {
      id: 'perdaComum',
      rotulo: 'Prejuízo do mês em operações comuns',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Preencha só um dos dois: o mês fecha em lucro ou em prejuízo.',
    },
    {
      id: 'prejuizoComum',
      rotulo: 'Prejuízo acumulado de meses anteriores — comum',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Saldo ainda não compensado, informado no demonstrativo de renda variável.',
    },
    {
      id: 'ganhoDayTrade',
      rotulo: 'Lucro do mês em day trade',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Operações abertas e encerradas no mesmo dia.',
    },
    {
      id: 'perdaDayTrade',
      rotulo: 'Prejuízo do mês em day trade',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
    },
    {
      id: 'prejuizoDayTrade',
      rotulo: 'Prejuízo acumulado de meses anteriores — day trade',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Só compensa ganhos de day trade.',
    },
    {
      id: 'irrfRetido',
      rotulo: 'Retenção na fonte já sofrida no mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'O valor da nota de corretagem. Deixe zero para a calculadora estimar pelas regras da lei.',
    },
  ],

  parametrosRequeridos: [
    'bolsa-aliquota-comum',
    'bolsa-aliquota-day-trade',
    'bolsa-isencao-vendas-mes',
    'bolsa-irrf-comum',
    'bolsa-irrf-day-trade',
    'bolsa-irrf-dispensa',
    'darf-valor-minimo',
  ],

  rotuloResultado: 'DARF estimado do mês',

  calcular,

  faq: [
    {
      pergunta: 'A isenção é sobre o lucro ou sobre o valor vendido?',
      resposta:
        'Sobre o valor vendido. O art. 3º, I, da Lei nº 11.033/2004 isenta o ganho da pessoa física quando o total das alienações do mês no mercado à vista de ações não passa do limite. Quem vendeu acima dele paga imposto sobre o ganho inteiro, e não apenas sobre a parte que excedeu — é a confusão mais comum de quem calcula sozinho.',
    },
    {
      pergunta: 'Por que o day trade é calculado à parte?',
      resposta:
        'Porque a lei o separa. A alíquota é maior (art. 2º, I, da Lei nº 11.033/2004), a isenção mensal não o alcança e as perdas em day trade só compensam ganhos de day trade, conforme o art. 8º da Lei nº 9.959/2000. Somar os dois resultados num número só produz imposto errado nos dois sentidos.',
    },
    {
      pergunta: 'Como funciona a compensação de prejuízo?',
      resposta:
        'O prejuízo de um mês compensa ganhos dos meses seguintes, dentro do mesmo bolso, até acabar — não há prazo para usá-lo. O que não se pode é compensar perda de um mês com ganho de mês anterior, já encerrado. Para usar o saldo depois, ele precisa ter sido informado no demonstrativo de renda variável do mês em que ocorreu.',
    },
    {
      pergunta: 'O que é aquela retenção de 0,005%?',
      resposta:
        'É o chamado "dedo-duro": uma retenção mínima na fonte, prevista no art. 2º, § 1º, da Lei nº 11.033/2004, que existe para a Receita saber que houve operação. No day trade a retenção é de 1% sobre o resultado positivo do dia. Nos dois casos ela é antecipação: sai do imposto a pagar no mês.',
    },
    {
      pergunta: 'E se o imposto do mês der menos de dez reais?',
      resposta:
        'O art. 68 da Lei nº 9.430/1996 proíbe DARF abaixo de R$ 10,00, e o § 1º manda somar o valor ao dos períodos seguintes, no mesmo código de receita, até alcançar o mínimo. O imposto não deixa de ser devido: ele espera.',
    },
    {
      pergunta: 'Dividendos e fundos imobiliários entram nesta conta?',
      resposta:
        'Não. Dividendos têm regra própria e esta calculadora trata do ganho na venda. Cotas de fundos imobiliários também ficam de fora: elas não têm a isenção mensal das ações e seguem alíquota própria. Informe aqui apenas ações do mercado à vista e operações de day trade.',
    },
  ],

  relacionadas: ['ir-renda-fixa', 'ganho-de-capital-imovel', 'dividend-yield', 'imposto-sobre-criptoativos'],
}
