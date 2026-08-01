/**
 * CALC-044 — Reserva de emergência: dimensionamento.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O ponto delicado é o mesmo de CALC-032:** o número que todo mundo repete —
 * seis meses — não está em norma nenhuma. Ele é campo, com padrão declarado como
 * praxe, e a memória de cálculo diz na etapa que a escolha foi do usuário.
 */

import { calcularReserva } from '../engine/calculadoras/reserva'
import { basisPoints, centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const jaGuardado = centavos(numero(valores, 'jaGuardado'))

  const r = calcularReserva(
    {
      despesaMensal: centavos(numero(valores, 'despesaMensal')),
      mesesDeCobertura: numero(valores, 'mesesDeCobertura'),
      jaGuardado,
      aporteMensal: centavos(numero(valores, 'aporteMensal')),
      rendimentoMensalBp: basisPoints(numero(valores, 'rendimentoMensal')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [{ rotulo: 'Meta da reserva', valor: formatarReal(v.meta) }]

  if (v.metaAlcancada) {
    destaques.push({
      rotulo: 'Acima da meta',
      valor: formatarReal(jaGuardado - v.meta),
    })
  } else if (v.alcancavel) {
    destaques.push(
      { rotulo: 'Meses de aporte até a meta', valor: `${v.mesesAteAMeta}` },
      { rotulo: 'Total a aportar até lá', valor: formatarReal(v.totalAportado) },
    )
    if (v.rendimentoAcumulado > 0) {
      destaques.push({
        rotulo: 'Do rendimento, no caminho',
        valor: formatarReal(v.rendimentoAcumulado),
      })
    }
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.faltaReunir,
      /** A meta menos o que já existe é exatamente o que falta. */
      detalhamento: [
        { rotulo: 'Meta da reserva', valor: v.meta, sinal: 'neutro' },
        { rotulo: 'Já guardado', valor: jaGuardado, sinal: 'credito' },
        { rotulo: 'Falta reunir', valor: v.faltaReunir, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        'O número de meses de cobertura NÃO está em norma nenhuma. Seis é a praxe mais repetida, ' +
          'e ela não distingue quem tem renda estável de quem não tem: com renda variável ou ' +
          'sem estabilidade, o mesmo raciocínio costuma levar a um prazo maior. O valor usado ' +
          'aqui foi você quem escolheu.',
        'Use a despesa essencial, não a despesa total. A reserva existe para cobrir o que não ' +
          'dá para cortar em um mês difícil — moradia, comida, transporte, saúde e as contas ' +
          'que não param.',
        'A ideia de reserva pressupõe dinheiro disponível no dia em que ele for necessário. Onde ' +
          'guardá-lo é decisão que esta calculadora não toma: ela estima o valor e o prazo, e a ' +
          'escolha da aplicação é sua.',
        ...(!v.metaAlcancada && !v.alcancavel
          ? [
              'Sem aporte mensal informado, não há prazo a estimar — o resultado acima é só o ' +
                'tamanho da meta e a distância até ela. Informe quanto pretende guardar por mês ' +
                'para ver em quanto tempo ela fecha.',
            ]
          : []),
      ],
    },
  }
}

export const RESERVA_DE_EMERGENCIA: DefinicaoCalculadora = {
  id: 'CALC-044',
  slug: 'reserva-de-emergencia',
  nome: 'Reserva de emergência',
  linhaDeContexto: 'De quanto ela precisa ser, quanto falta e em quanto tempo o seu aporte fecha.',
  descricaoSeo:
    'Dimensione sua reserva de emergência a partir da despesa mensal essencial e dos meses de cobertura que você escolher. Veja quanto falta reunir e em quanto tempo o aporte chega lá.',

  campos: [
    {
      id: 'despesaMensal',
      rotulo: 'Despesa mensal essencial',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'O que não dá para cortar num mês difícil: moradia, comida, transporte, saúde e contas fixas.',
    },
    {
      id: 'mesesDeCobertura',
      rotulo: 'Meses que a reserva deve cobrir',
      tipo: 'inteiro',
      padrao: 6,
      minimo: 1,
      maximo: 36,
      ajuda: 'Seis é a praxe mais repetida — não é regra, e renda instável costuma pedir mais.',
    },
    {
      id: 'jaGuardado',
      rotulo: 'Quanto você já tem guardado',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 500_000_000,
    },
    {
      id: 'aporteMensal',
      rotulo: 'Quanto pretende guardar por mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Deixe em branco para ver só o tamanho da meta.',
    },
    {
      id: 'rendimentoMensal',
      rotulo: 'Rendimento ao mês',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'O que a aplicação rende, já descontado o imposto. Em branco, a conta ignora rendimento.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Quanto ainda falta reunir',

  calcular,

  faq: [
    {
      pergunta: 'Seis meses de reserva é uma regra?',
      resposta:
        'Não. Não há norma, órgão regulador ou dispositivo legal que fixe prazo de reserva de emergência — é praxe repetida, e ela ignora a diferença que mais importa: a estabilidade da sua renda. Quem tem vínculo estável e recebe verbas rescisórias na saída está numa situação diferente de quem trabalha por conta própria. Por isso o prazo aqui é campo, e não um parâmetro do sistema.',
    },
    {
      pergunta: 'Uso a despesa total ou só a essencial?',
      resposta:
        'A essencial. A reserva existe para sustentar o que não dá para cortar num mês em que a renda some — moradia, alimentação, transporte, saúde, e as contas que continuam chegando. Incluir gastos que seriam suspensos numa emergência infla a meta e faz a reserva parecer inalcançável, o que costuma terminar em nenhuma reserva.',
    },
    {
      pergunta: 'Vale a pena guardar reserva tendo dívida cara?',
      resposta:
        'São duas contas que dá para pôr lado a lado. A dívida de rotativo ou de cheque especial custa ao mês muito mais do que qualquer aplicação conservadora rende, e enquanto ela existe cada real guardado rende menos do que o mesmo real abatendo a dívida. Por outro lado, ficar sem nenhuma folga é o que costuma criar a próxima dívida. As calculadoras de rotativo e de cheque especial mostram o custo do lado de lá.',
    },
    {
      pergunta: 'Por que o rendimento aqui é campo, e ao mês?',
      resposta:
        'Porque esta calculadora não consulta série econômica nem promete taxa de aplicação nenhuma. Se você sabe quanto a sua aplicação rende ao mês, já descontado o imposto, informe — a conta então mostra quanto do caminho o rendimento percorre por você. Em branco, ela considera só os aportes, que é a hipótese conservadora.',
    },
    {
      pergunta: 'Em quanto tempo consigo montar a reserva?',
      resposta:
        'Depende do aporte, e o resultado mostra o número de meses assim que você informa quanto pretende guardar. Se o prazo sair longo demais, as duas alavancas são o aporte e o tamanho da meta — e reduzir a meta para um prazo menor de cobertura, começando por ele, costuma ser mais realista do que não começar.',
    },
  ],

  relacionadas: ['juros-compostos', 'salario-liquido', 'rotativo-do-cartao'],
}
