/**
 * CALC-103 — Regra de transição por pontos.
 *
 * A pergunta é "quando eu posso me aposentar?", e a resposta útil não é
 * sim/não: é o ANO. A página responde as duas — se os requisitos já estão
 * cumpridos e, se não, em que ano estarão, mantida a contribuição.
 *
 * Motor em `engine/calculadoras/aposentadoria-pontos.ts`.
 */

import { calcularRegraDePontos, type Sexo } from '../engine/calculadoras/aposentadoria-pontos'
import { centavos } from '../engine/types'
import { formatarComCasas } from '../format/moeda'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularRegraDePontos(
    {
      sexo: texto(valores, 'sexo') === 'homem' ? ('homem' as Sexo) : ('mulher' as Sexo),
      idadeAnos: numero(valores, 'idadeAnos'),
      idadeMeses: numero(valores, 'idadeMeses'),
      tempoContribuicaoAnos: numero(valores, 'tempoAnos'),
      tempoContribuicaoMeses: numero(valores, 'tempoMeses'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Seus pontos hoje', valor: formatarComCasas(v.pontosAtuaisCentesimos, 2) },
    { rotulo: 'Pontos exigidos neste ano', valor: `${v.pontosExigidos}` },
    { rotulo: 'Tempo mínimo de contribuição', valor: `${v.tempoMinimoExigido} anos` },
    {
      rotulo: 'Situação',
      valor: v.cumpreTudo
        ? 'Requisitos cumpridos'
        : v.cumpreOsPontos
          ? 'Faltam anos de contribuição'
          : 'Faltam pontos',
    },
    ...(v.anoDeCumprimento !== null && !v.cumpreTudo
      ? [
          { rotulo: 'Ano em que cumpre', valor: `${v.anoDeCumprimento}` },
          { rotulo: 'Pontos exigidos naquele ano', valor: `${v.pontosExigidosNoAno ?? '—'}` },
        ]
      : []),
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: centavos(v.pontosAtuaisCentesimos),
      unidade: 'numero',
      detalhamento: [],
      destaques,
      notas: [
        'Esta é uma das regras de TRANSIÇÃO: vale para quem já era filiado ao Regime Geral em 13 de novembro ' +
          'de 2019. Quem começou a contribuir depois segue a regra permanente, com idade mínima.',
        'Há outras regras de transição — idade progressiva, pedágio de 50% e pedágio de 100% —, e vale a mais ' +
          'favorável no seu caso. Esta calculadora trata apenas da regra de pontos.',
        'A projeção supõe contribuição sem interrupção. Cada ano acrescenta um ano de idade e um de ' +
          'contribuição, enquanto a exigência sobe um ponto até o teto da Emenda.',
        'O tempo de contribuição é o do extrato do CNIS, no Meu INSS, e pode incluir períodos que você não ' +
          'lembra — ou deixar de fora períodos que precisam ser acertados.',
      ],
    },
  }
}

export const APOSENTADORIA_POR_PONTOS: DefinicaoCalculadora = {
  id: 'CALC-103',
  slug: 'aposentadoria-por-pontos',
  nome: 'Aposentadoria pela regra de pontos',
  linhaDeContexto: 'Se a soma de idade e contribuição já basta — e, se não basta, em que ano vai bastar.',
  descricaoSeo:
    'Calcule a regra de pontos da aposentadoria: soma de idade e tempo de contribuição, pontuação exigida no ano e a projeção do ano de cumprimento.',

  campos: [
    {
      id: 'sexo',
      rotulo: 'Sexo',
      tipo: 'selecao',
      padrao: 'mulher',
      opcoes: [
        { valor: 'mulher', rotulo: 'Mulher' },
        { valor: 'homem', rotulo: 'Homem' },
      ],
      ajuda: 'A regra exige pontuação e tempo mínimo diferentes para cada caso.',
    },
    {
      id: 'idadeAnos',
      rotulo: 'Sua idade — anos',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 55,
      minimo: 1,
      maximo: 110,
    },
    {
      id: 'idadeMeses',
      rotulo: 'Sua idade — meses',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 11,
      ajuda: 'As frações contam: a Emenda manda apurar idade e tempo em dias.',
    },
    {
      id: 'tempoAnos',
      rotulo: 'Tempo de contribuição — anos',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 30,
      minimo: 0,
      maximo: 70,
      ajuda: 'O total do extrato do CNIS, no Meu INSS.',
    },
    {
      id: 'tempoMeses',
      rotulo: 'Tempo de contribuição — meses',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 11,
    },
  ],

  parametrosRequeridos: [
    'aposentadoria-pontos-mulher',
    'aposentadoria-pontos-homem',
    'aposentadoria-tempo-minimo-mulher',
    'aposentadoria-tempo-minimo-homem',
  ],

  rotuloResultado: 'Seus pontos hoje',

  calcular,

  faq: [
    {
      pergunta: 'O que é a regra de pontos?',
      resposta:
        'É uma das regras de transição criadas pela Emenda Constitucional nº 103/2019, no art. 15. Ela soma a idade e o tempo de contribuição: alcançada a pontuação do ano e o tempo mínimo — trinta anos para a mulher, trinta e cinco para o homem —, a aposentadoria é devida.',
    },
    {
      pergunta: 'Por que a pontuação muda todo ano?',
      resposta:
        'Porque o § 1º do art. 15 acrescenta um ponto por ano desde 2020, até o limite de cem pontos para a mulher e cento e cinco para o homem. Na prática, esperar um ano rende dois pontos — um de idade e um de contribuição — e custa um, então a distância diminui, mas mais devagar do que parece.',
    },
    {
      pergunta: 'Pontos de sobra substituem tempo de contribuição?',
      resposta:
        'Não. Os dois requisitos são cumulativos. Quem tem muitos pontos por causa da idade, mas não alcançou o tempo mínimo de contribuição, não se aposenta por esta regra — e essa é a confusão mais comum.',
    },
    {
      pergunta: 'Quem pode usar esta regra?',
      resposta:
        'Quem já era filiado ao Regime Geral de Previdência Social na data em que a Emenda entrou em vigor, em 13 de novembro de 2019. Quem começou a contribuir depois segue a regra permanente, que exige idade mínima.',
    },
    {
      pergunta: 'Existem outras regras de transição?',
      resposta:
        'Sim: a da idade progressiva, a do pedágio de cinquenta por cento e a do pedágio de cem por cento, além da regra por idade. Vale a mais favorável ao segurado, e a comparação depende do histórico de contribuições. Esta calculadora cobre apenas a regra de pontos.',
    },
    {
      pergunta: 'Alcançar os pontos define o valor da aposentadoria?',
      resposta:
        'Não. Os pontos definem o direito; o valor é calculado à parte, com base na média das contribuições desde julho de 1994 e num percentual que cresce com o tempo de contribuição. São duas contas diferentes, e esta página responde a primeira.',
    },
  ],

  relacionadas: ['inss', 'inss-autonomo-e-facultativo', 'pensao-por-morte', 'resgate-de-previdencia-privada'],
}
