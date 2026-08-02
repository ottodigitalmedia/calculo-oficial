/**
 * CALC-049 — Precificação de hora: freelancer e autônomo.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **`docs/18` §3.6 nomeou o risco antes de a calculadora existir:** "o risco é
 * a calculadora parecer prescritiva". Ela não diz quanto alguém vale nem quanto
 * o mercado paga — resolve uma conta de cobertura, com premissas que o usuário
 * informa. O que o mercado aceita é outra pergunta, e a nota de tela diz isso em
 * vez de deixar o número falar por si.
 */

import { calcularPrecificacao } from '../engine/calculadoras/precificacao'
import { basisPoints, centavos } from '../engine/types'
import { formatarNumero, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const custosFixos = centavos(numero(valores, 'custosFixos'))

  const r = calcularPrecificacao(
    {
      rendaDesejadaMensal: centavos(numero(valores, 'rendaDesejada')),
      custosFixosMensais: custosFixos,
      diasTrabalhadosNoMes: numero(valores, 'diasNoMes'),
      horasPorDia: numero(valores, 'horasPorDia'),
      percentualFaturavelBp: basisPoints(numero(valores, 'percentualFaturavel')),
      aliquotaSobreFaturamentoBp: basisPoints(numero(valores, 'aliquota')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o faturamento necessário — renda, custos e imposto. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Renda que você quer receber', valor: centavos(numero(valores, 'rendaDesejada')), sinal: 'neutro' },
  ]
  if (custosFixos > 0) {
    linhas.push({ rotulo: 'Custos fixos do negócio', valor: custosFixos, sinal: 'debito' })
  }
  if (v.impostos > 0) {
    linhas.push({ rotulo: 'Imposto sobre o faturamento', valor: v.impostos, sinal: 'debito' })
  }
  linhas.push({
    rotulo: 'Faturamento necessário no mês',
    valor: v.faturamentoNecessario,
    sinal: 'neutro',
  })

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorHora,
      detalhamento: linhas,
      destaques: [
        { rotulo: 'Valor do dia', valor: formatarReal(v.valorDia) },
        { rotulo: 'Horas faturáveis no mês', valor: formatarNumero(v.horasFaturaveis) },
        { rotulo: 'Faturamento em doze meses', valor: formatarReal(v.faturamentoAnual) },
        { rotulo: 'A divisão ingênua daria', valor: formatarReal(v.valorHoraIngenuo) },
      ],
      notas: [
        'Este é o preço que FECHA A SUA CONTA, e não o que o mercado paga. As duas coisas podem ' +
          'não coincidir: se o número saiu acima do que a sua área pratica, as alavancas são ' +
          'reduzir custos fixos, aumentar a fatia de horas faturáveis ou rever a renda ' +
          'pretendida — e não simplesmente cobrar menos e absorver a diferença.',
        'A fatia de horas faturáveis é a premissa que mais muda o resultado, e a que mais é ' +
          'esquecida. Prospecção, orçamento, retrabalho, emissão de nota e administração ocupam ' +
          'expediente e ninguém paga por elas. Quem está começando costuma faturar bem menos da ' +
          'metade do tempo; com carteira estável, a fatia sobe.',
        'A alíquota é a que você informou. As faixas do Simples Nacional dependem do anexo da ' +
          'atividade e da receita bruta acumulada dos últimos doze meses, e esta calculadora não ' +
          'as consulta — informe a alíquota efetiva que o seu contador apura, ou deixe em zero ' +
          'para ver a conta sem imposto.',
        'Férias, meses fracos e pausas não estão nos dias informados. Se você trabalha onze ' +
          'meses por ano na prática, uma forma de embutir isso é reduzir os dias trabalhados no ' +
          'mês ou a fatia de horas faturáveis.',
      ],
    },
  }
}

export const PRECIFICACAO: DefinicaoCalculadora = {
  id: 'CALC-049',
  slug: 'precificacao-de-hora',
  nome: 'Precificação de hora',
  linhaDeContexto: 'Quanto cobrar por hora para fechar a sua conta — com hora não faturável dentro.',
  descricaoSeo:
    'Calcule o valor da sua hora como freelancer ou autônomo considerando renda pretendida, custos fixos, imposto por dentro e a fatia do expediente que realmente vira hora faturada.',

  campos: [
    {
      id: 'rendaDesejada',
      rotulo: 'Quanto você quer receber por mês',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'O que precisa sobrar para você, depois de pagar os custos do negócio e o imposto.',
    },
    {
      id: 'custosFixos',
      rotulo: 'Custos fixos do negócio por mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Ferramentas, assinaturas, contador, internet, energia do escritório, equipamento amortizado.',
    },
    {
      id: 'diasNoMes',
      rotulo: 'Dias trabalhados por mês',
      tipo: 'inteiro',
      padrao: 22,
      minimo: 1,
      maximo: 31,
    },
    {
      id: 'horasPorDia',
      rotulo: 'Horas de expediente por dia',
      tipo: 'decimal',
      padrao: 800,
      minimo: 1,
      maximo: 2_400,
    },
    {
      id: 'percentualFaturavel',
      rotulo: 'Fatia do expediente que vira hora faturada',
      tipo: 'percentual',
      padrao: 6_000,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'Prospecção, orçamento, retrabalho e administração ocupam expediente e ninguém paga. Sessenta por cento é uma premissa comum; quem começa fatura menos.',
    },
    {
      id: 'aliquota',
      rotulo: 'Alíquota sobre o faturamento',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 9_999,
      ajuda: 'A alíquota efetiva que você paga sobre o que fatura. Deixe em zero para ver a conta sem imposto.',
    },
  ],

  // Sem parâmetro legal: a alíquota é digitada — ver a nota do motor sobre D-3.
  parametrosRequeridos: [],

  rotuloResultado: 'Quanto cobrar por hora',

  calcular,

  faq: [
    {
      pergunta: 'Por que não basta dividir a renda que eu quero pelas horas que trabalho?',
      resposta:
        'Porque essa divisão supõe três coisas que não são verdade: que todo minuto de expediente é faturado, que o negócio não tem custo próprio e que não há imposto sobre o que entra. Prospectar, orçar, refazer, emitir nota e administrar ocupam parte do dia e ninguém paga por isso. O resultado mostra as duas contas lado a lado, e a distância entre elas costuma ser grande.',
    },
    {
      pergunta: 'Que fatia de horas faturáveis devo usar?',
      resposta:
        'Depende de como o seu trabalho funciona, e por isso é campo. Quem está começando ou trabalha com projetos curtos e muita prospecção costuma faturar bem menos da metade do expediente; quem tem carteira estável e contratos longos fatura mais. A forma mais honesta de descobrir é anotar por um mês quantas horas foram efetivamente cobradas de alguém.',
    },
    {
      pergunta: 'Por que o imposto entra dividindo, e não somando?',
      resposta:
        'Porque ele incide sobre o que entra, não sobre o que sobra. Se você precisa que sobrem cinco mil e paga seis por cento sobre o faturamento, faturar cinco mil e trezentos não basta — o correto é dividir cinco mil por noventa e quatro centésimos. A memória de cálculo mostra essa divisão, e a diferença entre os dois caminhos aparece na linha do imposto.',
    },
    {
      pergunta: 'Esse é o preço que eu devo cobrar?',
      resposta:
        'É o preço que fecha a conta que você informou, e essa é uma pergunta diferente de quanto o mercado paga. Se o número saiu acima do praticado na sua área, as saídas são reduzir custos fixos, aumentar a fatia de horas faturáveis ou revisar a renda pretendida. Cobrar abaixo dele e absorver a diferença é uma escolha possível, desde que consciente de que a diferença sai de algum lugar.',
    },
    {
      pergunta: 'Como incluir férias e meses fracos?',
      resposta:
        'Reduzindo os dias trabalhados no mês ou a fatia de horas faturáveis. Se na prática você trabalha onze meses por ano, informar vinte dias em vez de vinte e dois aproxima o resultado da realidade anual. A alternativa é tratar a diferença como custo fixo, informando nos custos a provisão mensal que cobre o mês parado.',
    },
  ],

  relacionadas: ['salario-liquido', 'custo-do-funcionario', 'reserva-de-emergencia'],
}
