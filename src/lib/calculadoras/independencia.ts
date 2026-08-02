/**
 * CALC-043 — Meta de independência financeira.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **É a terceira do catálogo a tratar um número de bolso como campo**, depois
 * dos 30% de comprometimento em CALC-032 e dos seis meses de reserva em
 * CALC-044. A "regra dos 4%" é heurística de um estudo sobre carteiras
 * americanas do século passado, não norma e não garantia — e certamente não foi
 * medida sobre juro brasileiro. Ela é o padrão declarado do campo, e a memória
 * de cálculo diz que a escolha foi do usuário.
 */

import { calcularIndependencia } from '../engine/calculadoras/reserva'
import { basisPoints, centavos } from '../engine/types'
import { formatarNumero, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const jaInvestido = centavos(numero(valores, 'jaInvestido'))

  const r = calcularIndependencia(
    {
      despesaMensalDesejada: centavos(numero(valores, 'rendaDesejada')),
      taxaDeRetiradaAnualBp: basisPoints(numero(valores, 'taxaDeRetirada')),
      jaInvestido,
      aporteMensal: centavos(numero(valores, 'aporteMensal')),
      rendimentoMensalBp: basisPoints(numero(valores, 'rendimentoMensal')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = []

  if (jaInvestido > 0) {
    destaques.push({
      rotulo: 'O que você já sustenta por mês',
      valor: formatarReal(v.rendaMensalDeHoje),
    })
  }

  if (v.metaAlcancada) {
    destaques.push({ rotulo: 'Situação', valor: 'Meta alcançada' })
  } else if (v.alcancavel) {
    destaques.push(
      { rotulo: 'Meses até a meta', valor: `${v.mesesAteAMeta}` },
      { rotulo: 'Anos até a meta', valor: formatarNumero(v.anosAteAMetaCentesimos) },
      { rotulo: 'Do rendimento, no caminho', valor: formatarReal(v.rendimentoAcumulado) },
    )
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.patrimonioNecessario,
      /** O patrimônio necessário menos o que já existe é o que falta. */
      detalhamento: [
        { rotulo: 'Patrimônio necessário', valor: v.patrimonioNecessario, sinal: 'neutro' },
        { rotulo: 'Já investido', valor: jaInvestido, sinal: 'credito' },
        { rotulo: 'Falta acumular', valor: v.faltaAcumular, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        'A taxa de retirada NÃO está em norma nenhuma. Os quatro por cento que se repetem vêm ' +
          'de um estudo sobre carteiras americanas do século passado, que mediu quanto uma ' +
          'retirada anual sobreviveu aos piores trinta anos daquela série. Não é lei, não é ' +
          'garantia e não foi medida sobre juro brasileiro — o valor usado aqui foi você quem ' +
          'escolheu.',
        'A conta ignora inflação, imposto sobre o rendimento e mudança de padrão de vida. Os ' +
          'três empurram o patrimônio necessário para cima, e o primeiro é o que mais pesa em ' +
          'prazos longos: manter o mesmo poder de compra daqui a vinte anos exige mais dinheiro ' +
          'do que a mesma quantia de hoje.',
        'O prazo é muito sensível ao rendimento informado. Vale rodar a conta com duas taxas ' +
          'diferentes e comparar: a distância entre elas costuma ser de anos, e é a melhor ' +
          'medida de quanto a estimativa depende de uma premissa.',
      ],
    },
  }
}

export const INDEPENDENCIA: DefinicaoCalculadora = {
  id: 'CALC-043',
  slug: 'independencia-financeira',
  nome: 'Meta de independência financeira',
  linhaDeContexto: 'Quanto patrimônio sustenta a renda que você quer — e quanto tempo até lá.',
  descricaoSeo:
    'Calcule o patrimônio necessário para viver de renda a partir da despesa mensal que você quer sustentar e da taxa de retirada que escolher. Veja quanto falta e em quantos anos o seu aporte chega lá.',

  campos: [
    {
      id: 'rendaDesejada',
      rotulo: 'Renda mensal que você quer sustentar',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'O quanto você quer poder retirar por mês, em valores de hoje.',
    },
    {
      id: 'taxaDeRetirada',
      rotulo: 'Taxa de retirada ao ano',
      tipo: 'percentual',
      padrao: 400,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'Quatro por cento é a heurística mais repetida — não é norma, e não foi medida sobre juro brasileiro.',
    },
    {
      id: 'jaInvestido',
      rotulo: 'Patrimônio já investido',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 5_000_000_000,
    },
    {
      id: 'aporteMensal',
      rotulo: 'Quanto pretende investir por mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Deixe em branco para ver só o tamanho da meta.',
    },
    {
      id: 'rendimentoMensal',
      rotulo: 'Rendimento ao mês, na fase de acumulação',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'O que a carteira rende por mês, já descontado o imposto. Em branco, a conta ignora rendimento.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Patrimônio para viver de renda',

  calcular,

  faq: [
    {
      pergunta: 'A regra dos 4% é confiável?',
      resposta:
        'Ela é uma referência, não uma garantia, e não é norma nenhuma. Nasceu de um estudo sobre carteiras americanas do século passado, que testou quanto uma retirada anual fixa sobreviveu aos piores trinta anos daquela série histórica. Nada disso foi medido sobre juro, inflação ou tributação brasileiros. Por isso a taxa aqui é campo: rode com quatro, com três e com cinco por cento, e veja o tamanho da diferença.',
    },
    {
      pergunta: 'Por que o patrimônio necessário é tão alto?',
      resposta:
        'Porque a conta é uma divisão, e dividir por um número pequeno produz um número grande. Sustentar cinco mil reais por mês a uma retirada de quatro por cento ao ano exige um milhão e meio: sessenta mil por ano divididos por quatro centésimos. Cada ponto percentual a mais na taxa de retirada reduz muito o patrimônio exigido — e aumenta na mesma medida o risco de o dinheiro acabar antes.',
    },
    {
      pergunta: 'A inflação está na conta?',
      resposta:
        'Não, e isso importa. O resultado está em valores de hoje: se o prazo for de vinte anos, o patrimônio calculado sustentará menos coisas do que a mesma quantia sustenta agora. A leitura honesta do número é como meta em poder de compra atual, a ser revista periodicamente — e não como um valor nominal a alcançar e esquecer.',
    },
    {
      pergunta: 'Como o prazo muda tanto com o rendimento?',
      resposta:
        'Porque a acumulação é composta: o rendimento de cada mês passa a render nos meses seguintes. Em prazos longos essa realimentação domina o resultado, e uma diferença de meio ponto percentual ao mês desloca a meta em anos. É a mesma mecânica da calculadora de juros compostos, vista do outro lado — lá você informa o prazo e vê o montante, aqui você informa o montante e vê o prazo.',
    },
    {
      pergunta: 'Vale mais aumentar o aporte ou reduzir a despesa?',
      resposta:
        'Reduzir a despesa costuma valer mais, e por um motivo aritmético: ela aparece dos dois lados da conta. Cada real a menos de despesa mensal reduz a meta em muitas vezes esse valor, e ao mesmo tempo pode virar aporte. Aumentar o aporte encurta o caminho; reduzir a despesa encurta o caminho e aproxima o destino.',
    },
  ],

  relacionadas: ['juros-compostos', 'reserva-de-emergencia', 'ir-renda-fixa'],
}
