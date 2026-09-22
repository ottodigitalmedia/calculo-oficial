/**
 * CALC-123 — Tesouro Selic: quanto rendeu.
 *
 * A pergunta chega assim: "deixei R$ 20 mil no Tesouro Selic o ano passado,
 * quanto rendeu?". O site do Tesouro mostra o saldo; o que falta é separar o
 * que é rendimento do que é imposto — e a alíquota depende do tempo.
 *
 * **A janela é de meses cheios**, porque a série da Selic é mensal. Os dois
 * meses escolhidos entram na conta, e a tela diz que quem entrou no meio de um
 * mês rendeu menos naquele mês.
 *
 * Motor em `engine/calculadoras/tesouro-selic.ts`.
 */

import {
  calcularTesouroSelic,
  PARAMETROS_TESOURO_SELIC,
} from '../engine/calculadoras/tesouro-selic'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { RENDA_FIXA } from '../params/data/renda-fixa'
import { TITULOS_PUBLICOS } from '../params/data/titulos-publicos'
import { construirRegistro } from '../params/registry'
import { mesDe, serieDoIndice, ultimoMesDoIndice } from './indices-comuns'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(TITULOS_PUBLICOS, RENDA_FIXA)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularTesouroSelic(
    {
      valorAplicado: centavos(numero(valores, 'valorAplicado')),
      // O campo de data entrega `AAAA-MM-DD`; a série é mensal — mesmo recorte
      // de CALC-060, e pela mesma razão.
      primeiroMes: mesDe(texto(valores, 'primeiroMes')),
      ultimoMes: mesDe(texto(valores, 'ultimoMes')),
      serie: serieDoIndice('selic'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores
  const ultimo = ultimoMesDoIndice('selic')

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.liquido,
      detalhamento: [
        { rotulo: 'Valor aplicado', valor: centavos(numero(valores, 'valorAplicado')), sinal: 'neutro' },
        { rotulo: 'Rendimento no período', valor: v.rendimento, sinal: 'credito' },
        { rotulo: 'Imposto de renda', valor: v.imposto, sinal: 'debito' },
        { rotulo: 'Valor líquido', valor: v.liquido, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Selic acumulada no período', valor: formatarPercentual(v.variacaoBp) },
        { rotulo: 'Valor bruto', valor: formatarReal(v.bruto) },
        { rotulo: 'Alíquota do imposto pelo prazo', valor: formatarPercentual(v.aliquotaIr) },
        { rotulo: 'Janela', valor: `${v.mesesAplicados} ${v.mesesAplicados === 1 ? 'mês' : 'meses'} · ${v.diasCorridos} dias` },
        ...(ultimo ? [{ rotulo: 'Último mês publicado da Selic', valor: ultimo }] : []),
      ],
      notas: [
        'Os dois meses escolhidos entram na conta: são os meses em que o dinheiro rendeu. Quem aplicou no meio de um mês rendeu menos naquele mês do que a taxa cheia indica.',
        'A taxa de custódia da B3 e eventuais taxas da corretora não entram. No Tesouro Selic elas pesam proporcionalmente mais que em outros títulos, porque o rendimento é menor.',
        'O título é negociado com pequena diferença sobre o valor de referência — o ágio ou deságio do dia —, e por isso o resultado real fica um pouco acima ou abaixo desta estimativa.',
        'O imposto incide só sobre o rendimento, pela tabela regressiva contada em dias corridos. Resgates com menos de trinta dias ainda têm IOF, e a calculadora recusa esse caso em vez de calcular sem ele.',
      ],
    },
  }
}

export const TESOURO_SELIC: DefinicaoCalculadora = {
  id: 'CALC-123',
  slug: 'tesouro-selic',
  nome: 'Tesouro Selic — quanto rendeu',
  linhaDeContexto: 'Quanto a Selic acumulada rendeu no período, e quanto sobra depois do imposto.',
  descricaoSeo:
    'Calcule o rendimento do Tesouro Selic pela Selic acumulada mês a mês, com o imposto de renda da tabela regressiva e o valor líquido do período.',

  campos: [
    {
      id: 'valorAplicado',
      rotulo: 'Valor aplicado',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'primeiroMes',
      rotulo: 'Primeiro mês de rendimento',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Só o mês importa: a Selic é publicada por mês, e este mês entra na conta.',
    },
    {
      id: 'ultimoMes',
      rotulo: 'Último mês de rendimento',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Também entra na conta. A taxa de um mês só é conhecida depois que ele termina.',
    },
  ],

  parametrosRequeridos: [...PARAMETROS_TESOURO_SELIC],

  rotuloResultado: 'Valor líquido no período',

  calcular,

  faq: [
    {
      pergunta: 'Como o Tesouro Selic rende?',
      resposta:
        'Pela taxa Selic acumulada no período: é a característica da Letra Financeira do Tesouro, definida no Decreto nº 12.814/2026, art. 3º. O rendimento se acumula dia a dia, e esta calculadora usa a série mensal oficial da taxa, multiplicando mês a mês.',
    },
    {
      pergunta: 'Por que a calculadora pede meses, e não datas exatas?',
      resposta:
        'Porque a série de Selic que alimenta a conta é mensal. Fingir precisão diária daria um número com aparência de exato e origem inventada. Com meses cheios, a memória de cálculo mostra exatamente quais taxas entraram — e quem aplicou no meio de um mês sabe que rendeu um pouco menos naquele mês.',
    },
    {
      pergunta: 'Quanto de imposto de renda eu pago?',
      resposta:
        'A tabela regressiva: 22,5% até 180 dias, 20% até 360, 17,5% até 720 e 15% acima disso, sempre sobre o rendimento. Como o Tesouro Selic pode ser resgatado a qualquer momento, o prazo da aplicação é o que decide a alíquota — sair cedo demais custa caro em imposto.',
    },
    {
      pergunta: 'Por que o meu extrato mostra um valor um pouco diferente?',
      resposta:
        'Por três motivos: a taxa de custódia da B3 e as taxas da corretora, que não entram aqui; o ágio ou deságio com que o título é negociado; e os dias do primeiro e do último mês, se a aplicação não começou no dia 1º. A ordem de grandeza é a mesma, e a memória mostra cada passo.',
    },
    {
      pergunta: 'Tesouro Selic ou poupança?',
      resposta:
        'São contas diferentes: a poupança rende por aniversário mensal e é isenta de imposto; o Tesouro Selic acompanha a taxa básica e paga imposto sobre o rendimento, decrescente com o prazo. Com a Selic alta, o Tesouro costuma render mais mesmo depois do imposto — mas a comparação precisa ser feita com os números do período, e o comparador de investimentos faz isso.',
    },
  ],

  relacionadas: ['tesouro-prefixado', 'ir-renda-fixa', 'rendimento-da-poupanca', 'onde-render-mais'],
}
