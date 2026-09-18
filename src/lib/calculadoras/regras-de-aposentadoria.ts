/**
 * CALC-108 — Comparador das regras de aposentadoria da EC nº 103/2019.
 *
 * A pergunta real de quem pesquisa aposentadoria não é "como funciona a regra
 * de pontos": é "quando eu me aposento". A resposta depende de qual das seis
 * regras se cumpre primeiro, e só a comparação a dá.
 *
 * **O comparador diz qual se cumpre PRIMEIRO, e diz que isso não é o mesmo que
 * ser a mais vantajosa.** O valor muda de regra para regra — o pedágio de 50%
 * leva o fator previdenciário —, e esperar alguns meses por outra regra pode
 * valer a pena. A página não esconde isso.
 *
 * Motor em `engine/calculadoras/regras-de-aposentadoria.ts`.
 */

import { compararRegras, type AvaliacaoDaRegra } from '../engine/calculadoras/regras-de-aposentadoria'
import { centavos } from '../engine/types'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import {
  CAMPO_FILIACAO,
  CAMPO_SEXO,
  NOTA_CNIS,
  NOTA_FORA,
  NOTA_PROJECAO,
  NOTA_VALOR,
  camposDeIdade,
  camposDeTempo,
  camposDeTempoNaEmenda,
  quando,
} from './apresentacao-aposentadoria'
import { numero, texto, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS)

function situacao(r: AvaliacaoDaRegra): string {
  switch (r.situacao) {
    case 'cumpre':
      return 'Já cumpre'
    case 'cumprira':
      return r.anoDeCumprimento !== null && r.mesDeCumprimento !== null
        ? quando(r.anoDeCumprimento, r.mesDeCumprimento)
        : 'Sem previsão'
    case 'fora_do_horizonte':
      return 'Sem previsão nos próximos sessenta anos'
    case 'nao_se_aplica':
    case 'falta_dado':
      return r.motivo ?? 'Não se aplica'
  }
}

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = compararRegras(
    {
      sexo: texto(valores, 'sexo') === 'homem' ? 'homem' : 'mulher',
      idadeAnos: numero(valores, 'idadeAnos'),
      idadeMeses: numero(valores, 'idadeMeses'),
      tempoAnos: numero(valores, 'tempoAnos'),
      tempoMeses: numero(valores, 'tempoMeses'),
      filiadoAntesDaEmenda: texto(valores, 'filiacao') !== 'depois',
      tempoNaEmendaAnos: numero(valores, 'emendaAnos'),
      tempoNaEmendaMeses: numero(valores, 'emendaMeses'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const { regras, maisCedo } = r.valores

  const destaques: Destaque[] = [
    {
      rotulo: 'Primeira regra a se cumprir',
      valor: maisCedo === null ? 'Nenhuma nos próximos sessenta anos' : maisCedo.nome,
    },
    ...regras.map((regra) => ({ rotulo: regra.nome, valor: situacao(regra) })),
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: centavos(maisCedo?.mesesAteCumprir ?? 0),
      unidade: 'numero',
      casasDecimais: 0,
      detalhamento: [],
      destaques,
      notas: [
        'Cumprir primeiro não é o mesmo que ser a mais vantajosa. O valor muda de uma regra para outra — o ' +
          'pedágio de 50% leva o fator previdenciário —, e esperar alguns meses por outra regra pode compensar.',
        NOTA_VALOR,
        NOTA_PROJECAO,
        NOTA_FORA,
        NOTA_CNIS,
      ],
    },
  }
}

export const REGRAS_DE_APOSENTADORIA: DefinicaoCalculadora = {
  id: 'CALC-108',
  slug: 'regras-de-aposentadoria',
  nome: 'Comparador de regras de aposentadoria',
  linhaDeContexto: 'Todas as regras da reforma lado a lado — e qual delas se cumpre primeiro no seu caso.',
  descricaoSeo:
    'Compare as regras de aposentadoria da reforma da Previdência — pontos, idade progressiva, pedágios de 50% e 100% e idade — e veja qual se cumpre primeiro.',

  campos: [
    CAMPO_SEXO,
    CAMPO_FILIACAO,
    ...camposDeIdade(57),
    ...camposDeTempo(32),
    ...camposDeTempoNaEmenda(0, false).map((c) => ({ ...c, visivelSe: { campo: 'filiacao', em: ['antes'] } })),
  ],

  parametrosRequeridos: [
    'aposentadoria-pontos-mulher',
    'aposentadoria-idade-progressiva-mulher',
    'aposentadoria-pedagio-50-percentual',
    'aposentadoria-pedagio-100-idade-mulher',
    'aposentadoria-idade-transicao-mulher',
    'aposentadoria-permanente-idade-mulher',
  ],

  rotuloResultado: 'Meses até a primeira regra',

  calcular,

  faq: [
    {
      pergunta: 'Quantas regras de aposentadoria existem depois da reforma?',
      resposta:
        'Para quem já contribuía em 13 de novembro de 2019, cinco: pontos (art. 15), idade progressiva (art. 16), pedágio de cinquenta por cento (art. 17), idade (art. 18) e pedágio de cem por cento (art. 20) da Emenda Constitucional nº 103/2019. Para quem começou depois, uma: a regra permanente do art. 19.',
    },
    {
      pergunta: 'Posso escolher a regra?',
      resposta:
        'Pode — e vale a mais favorável. Cumprido qualquer conjunto de requisitos, a aposentadoria pode ser pedida por aquela regra. Conferir antes qual delas resulta no melhor valor evita surpresa na carta de concessão.',
    },
    {
      pergunta: 'A regra que se cumpre primeiro é a melhor?',
      resposta:
        'Nem sempre. Ela responde QUANDO, não QUANTO. O valor é calculado de forma diferente em cada regra, e no pedágio de cinquenta por cento entra o fator previdenciário. Em alguns casos, esperar alguns meses por outra regra aumenta o benefício.',
    },
    {
      pergunta: 'Por que a calculadora pede o tempo de contribuição em 2019?',
      resposta:
        'Porque os dois pedágios são calculados sobre o que faltava em 13 de novembro de 2019. Sem esse dado, a comparação mostra as demais regras e indica que os pedágios ficaram de fora.',
    },
    {
      pergunta: 'O que a comparação não cobre?',
      resposta:
        'Aposentadoria do professor, da atividade especial e da pessoa com deficiência, que têm regras próprias, e o valor do benefício, que depende da média de todas as contribuições desde julho de 1994.',
    },
  ],

  relacionadas: ['aposentadoria-por-pontos', 'aposentadoria-idade-progressiva', 'aposentadoria-pedagio-100', 'aposentadoria-por-idade'],
}
