/**
 * CALC-014 — Contrato intermitente: o acerto de cada convocação.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O nome mudou de "rescisão" para "acerto do período", e o motivo é legal.**
 * O regime de rescisão do intermitente morreu com a MP nº 808/2017, que caducou
 * em 23/04/2018 levando consigo os arts. 452-B a 452-H. O que sobrou em vigor —
 * e o que o trabalhador precisa conferir — é o § 6º do art. 452-A: o pagamento
 * imediato ao fim de CADA período de prestação. A nota longa está no motor.
 */

import { calcularIntermitente } from '../engine/calculadoras/intermitente'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(INSS, IRRF, TRABALHISTA)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const horas = numero(valores, 'horas')

  const r = calcularIntermitente(
    {
      valorDaHora: centavos(numero(valores, 'valorDaHora')),
      horas,
      repousoEAdicionais: centavos(numero(valores, 'repousoEAdicionais')),
      dependentes: numero(valores, 'dependentes'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o total bruto do período. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Remuneração das horas', valor: v.remuneracao, sinal: 'credito' },
    ...(v.baseDosProporcionais > v.remuneracao
      ? [
          {
            rotulo: 'Repouso semanal e adicionais',
            valor: centavos(v.baseDosProporcionais - v.remuneracao),
            sinal: 'credito' as const,
          },
        ]
      : []),
    { rotulo: 'Décimo terceiro proporcional', valor: v.decimoTerceiro, sinal: 'credito' },
    { rotulo: 'Férias proporcionais', valor: v.feriasProporcionais, sinal: 'credito' },
    { rotulo: 'Terço constitucional', valor: v.tercoDeFerias, sinal: 'credito' },
    { rotulo: 'INSS', valor: v.inss, sinal: 'debito' },
    { rotulo: 'Imposto de renda na fonte', valor: v.irrf, sinal: 'debito' },
    { rotulo: 'Líquido a receber', valor: v.liquido, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Total bruto do período', valor: formatarReal(v.totalBruto) },
    { rotulo: 'A hora que de fato entra no bolso', valor: formatarReal(v.valorHoraLiquidoEfetivo) },
    {
      rotulo: `FGTS depositado — ${formatarPercentual(v.fgtsAliquotaBp)} que não é desconto`,
      valor: formatarReal(v.fgtsDepositado),
    },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.liquido,
      detalhamento: linhas,
      destaques,
      notas: [
        'Este é o acerto de UM período de convocação. O § 6º manda pagar de imediato, ao final ' +
          'de cada período: a remuneração, o repouso semanal, as férias proporcionais com o terço, ' +
          'o décimo terceiro proporcional e os adicionais legais — tudo discriminado no recibo.',
        'O REPOUSO SEMANAL você informa, e há razão para isso: a Lei nº 605/1949 diz que, para ' +
          'quem trabalha por hora, ele corresponde à "jornada normal de trabalho" — e o contrato ' +
          'intermitente não tem jornada normal. A norma não responde, e a calculadora não inventa ' +
          'o número. Confira o valor no seu recibo e informe aqui.',
        'ESTA CALCULADORA NÃO CALCULA AVISO PRÉVIO nem multa do FGTS de rescisão, e o motivo não ' +
          'é técnico: as regras de rescisão do contrato intermitente vieram na Medida Provisória ' +
          'nº 808/2017, que CADUCOU em 23/04/2018 sem virar lei. Hoje não há norma dizendo sobre ' +
          'que base calcular o aviso prévio de quem não tem salário fixo. Se o seu contrato foi ' +
          'encerrado, procure orientação — o valor tende a ser MAIOR que o mostrado aqui.',
        'O FGTS aparece porque o § 8º manda o empregador recolher e entregar o comprovante, mas ' +
          'ele não sai do que você recebe: entra na conta vinculada, além do líquido.',
        'A cada doze meses de contrato você adquire o direito de tirar um mês de férias nos doze ' +
          'meses seguintes, período em que não pode ser convocado pelo mesmo empregador. Esse mês ' +
          'não é pago de novo — as férias já vieram proporcionalmente em cada período.',
      ],
    },
  }
}

export const INTERMITENTE: DefinicaoCalculadora = {
  id: 'CALC-014',
  slug: 'contrato-intermitente',
  nome: 'Contrato intermitente — o acerto de cada convocação',
  linhaDeContexto: 'Quanto entra a cada chamada, com o 13º e as férias que a lei manda pagar na hora.',
  descricaoSeo:
    'Calcule quanto você recebe em cada período de convocação no contrato intermitente: remuneração das horas, férias proporcionais com o terço, décimo terceiro, INSS, imposto de renda e o FGTS depositado.',

  campos: [
    {
      id: 'valorDaHora',
      rotulo: 'Valor da hora no contrato',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_00,
      ajuda: 'O art. 452-A exige contrato escrito com o valor da hora, nunca abaixo do mínimo horário.',
    },
    {
      id: 'horas',
      rotulo: 'Horas trabalhadas no período',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 744,
      ajuda: 'As horas efetivamente prestadas nesta convocação.',
    },
    {
      id: 'repousoEAdicionais',
      rotulo: 'Repouso semanal e adicionais legais do recibo',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Informe como veio no recibo — a lei não fixa a fórmula para quem não tem jornada normal.',
    },
    {
      id: 'dependentes',
      rotulo: 'Dependentes para o imposto de renda',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
    },
  ],

  parametrosRequeridos: ['inss-tabela-progressiva', 'irrf-tabela-progressiva', 'fgts-aliquota-deposito'],

  rotuloResultado: 'Líquido do período',

  calcular,

  faq: [
    {
      pergunta: 'O que é o contrato intermitente?',
      resposta:
        'É o contrato em que a prestação de serviço não é contínua: o empregador convoca com pelo menos três dias corridos de antecedência, e você tem um dia útil para responder — o silêncio vale como recusa. Recusar não descaracteriza o vínculo, e o período de inatividade não é tempo à disposição, o que permite trabalhar para outros contratantes. O contrato precisa ser escrito e fixar o valor da hora, que não pode ser inferior ao horário do salário mínimo nem ao dos demais empregados que exerçam a mesma função.',
    },
    {
      pergunta: 'O que tenho de receber ao fim de cada convocação?',
      resposta:
        'Cinco parcelas, de imediato e discriminadas no recibo: a remuneração das horas, as férias proporcionais com o acréscimo de um terço, o décimo terceiro proporcional, o repouso semanal remunerado e os adicionais legais. Isso está no § 6º do art. 452-A, e é o que esta calculadora reproduz. O empregador ainda recolhe o INSS e deposita o FGTS sobre os valores pagos no período, e deve entregar o comprovante de que fez as duas coisas.',
    },
    {
      pergunta: 'Por que o repouso semanal é campo, e não conta?',
      resposta:
        'Porque a lei não dá a fórmula para este contrato. A Lei nº 605/1949 diz que, para quem trabalha por hora, o repouso corresponde à sua jornada normal de trabalho — e o trabalhador intermitente, por definição, não tem jornada normal. Qualquer número que a calculadora escolhesse aqui seria uma escolha dela, não da norma, e apareceria na tela com a mesma aparência de certeza dos que vêm da lei. Preferimos perguntar: confira no recibo e informe.',
    },
    {
      pergunta: 'E se o contrato acabar? Tenho aviso prévio?',
      resposta:
        'Esta calculadora não responde a isso, e a razão é que a lei também não. As regras de rescisão do contrato intermitente — aviso prévio e multa do FGTS pela metade, calculados pela média dos valores recebidos — vieram na Medida Provisória nº 808/2017, que caducou em 23 de abril de 2018 sem ser convertida em lei. Com ela caíram os arts. 452-B a 452-H inteiros. Hoje não há norma dizendo sobre que base calcular o aviso prévio de quem não tem salário fixo, e o assunto se resolve caso a caso. Se o seu contrato foi encerrado, procure orientação: o que você tem a receber tende a ser maior que o mostrado aqui.',
    },
    {
      pergunta: 'As férias que recebo em cada período são as mesmas do mês de descanso?',
      resposta:
        'São. A cada doze meses de contrato você adquire o direito de usufruir, nos doze meses seguintes, um mês de férias, e nesse período não pode ser convocado pelo mesmo empregador. Mas esse mês não é pago de novo: as férias proporcionais já foram recebidas, com o terço, ao fim de cada período de prestação. Na prática é um mês de descanso obrigatório sem pagamento novo — o que torna a conta de cada convocação a que realmente importa acompanhar.',
    },
  ],

  relacionadas: ['salario-liquido', 'inss', 'fgts'],
}
