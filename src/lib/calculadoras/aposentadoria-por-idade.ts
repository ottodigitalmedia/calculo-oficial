/**
 * CALC-107 — Aposentadoria por idade: art. 18 (transição, para quem já era
 * filiado em 13/11/2019) ou art. 19 (permanente, para quem se filiou depois).
 *
 * Uma pergunta de entrada decide o artigo, e a diferença que mais confunde é
 * a do homem: quinze anos de contribuição na transição, vinte na permanente.
 *
 * Motor em `engine/calculadoras/regras-de-aposentadoria.ts`.
 */

import { calcularAposentadoriaPorIdade } from '../engine/calculadoras/regras-de-aposentadoria'
import { descreverMeses } from '../engine/calculadoras/aposentadoria-comum'
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
  destaquesDeCumprimento,
  mesesComoPrincipal,
} from './apresentacao-aposentadoria'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const antes = texto(valores, 'filiacao') !== 'depois'
  const r = calcularAposentadoriaPorIdade(
    {
      sexo: texto(valores, 'sexo') === 'homem' ? 'homem' : 'mulher',
      idadeAnos: numero(valores, 'idadeAnos'),
      idadeMeses: numero(valores, 'idadeMeses'),
      tempoAnos: numero(valores, 'tempoAnos'),
      tempoMeses: numero(valores, 'tempoMeses'),
      filiadoAntesDaEmenda: antes,
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
      principal: centavos(mesesComoPrincipal(v)),
      unidade: 'numero',
      casasDecimais: 0,
      detalhamento: [],
      destaques: [
        { rotulo: 'Regra aplicada', valor: antes ? 'Transição — art. 18' : 'Permanente — art. 19' },
        { rotulo: 'Idade exigida', valor: descreverMeses(v.idadeExigidaMeses) },
        { rotulo: 'Tempo mínimo de contribuição', valor: `${v.tempoMinimoAnos} anos` },
        ...destaquesDeCumprimento(v),
      ],
      notas: [
        antes
          ? 'Quem já era filiado em 13/11/2019 também tem as regras de pontos, da idade progressiva e dos pedágios — ' +
            'o comparador de regras mostra todas lado a lado.'
          : 'Quem se filiou depois de 13/11/2019 só tem a regra permanente: as regras de transição não se aplicam.',
        NOTA_PROJECAO,
        NOTA_VALOR,
        NOTA_FORA,
        NOTA_CNIS,
      ],
    },
  }
}

export const APOSENTADORIA_POR_IDADE: DefinicaoCalculadora = {
  id: 'CALC-107',
  slug: 'aposentadoria-por-idade',
  nome: 'Aposentadoria por idade',
  linhaDeContexto: 'A idade e o tempo mínimo exigidos de quem já contribuía antes da reforma — e de quem começou depois.',
  descricaoSeo:
    'Calcule a aposentadoria por idade depois da reforma: idade mínima, tempo de contribuição exigido na transição e na regra permanente, e o mês de cumprimento.',

  campos: [CAMPO_SEXO, CAMPO_FILIACAO, ...camposDeIdade(60), ...camposDeTempo(15)],

  parametrosRequeridos: [
    'aposentadoria-idade-transicao-mulher',
    'aposentadoria-idade-transicao-homem',
    'aposentadoria-idade-transicao-tempo',
    'aposentadoria-permanente-idade-mulher',
    'aposentadoria-permanente-idade-homem',
    'aposentadoria-permanente-tempo-mulher',
    'aposentadoria-permanente-tempo-homem',
  ],

  rotuloResultado: 'Meses até cumprir os requisitos',

  calcular,

  faq: [
    {
      pergunta: 'Qual a idade mínima para se aposentar por idade?',
      resposta:
        'Sessenta e dois anos para a mulher e sessenta e cinco para o homem, tanto na regra de transição do art. 18 quanto na regra permanente do art. 19 da Emenda Constitucional nº 103/2019. Na transição, a idade da mulher partiu de sessenta anos e subiu seis meses por ano até chegar a sessenta e dois, em 2023.',
    },
    {
      pergunta: 'Quanto tempo de contribuição é preciso?',
      resposta:
        'Para quem já era filiado ao INSS em 13 de novembro de 2019, quinze anos — para homens e mulheres. Para quem se filiou depois, quinze anos para a mulher e vinte para o homem.',
    },
    {
      pergunta: 'Por que a calculadora pergunta quando comecei a contribuir?',
      resposta:
        'Porque a data decide a regra. Quem já contribuía em 13 de novembro de 2019 fica na transição do art. 18 e tem acesso também às outras regras de transição; quem começou depois segue a regra permanente do art. 19, que exige mais tempo do homem.',
    },
    {
      pergunta: 'Parei de contribuir há anos. Ainda posso me aposentar por idade?',
      resposta:
        'Para a aposentadoria por idade, contam os requisitos de idade e de tempo de contribuição. Se você já tem o tempo mínimo, a idade é o que falta — e a calculadora mostra quando ela chega. Nesse caso, desconsidere a projeção do tempo, que supõe contribuição contínua.',
    },
    {
      pergunta: 'Esta regra é a melhor para mim?',
      resposta:
        'Para quem contribuiu pouco tempo, costuma ser a única. Para quem contribuiu muito, as regras de pontos, da idade progressiva e dos pedágios podem chegar antes — o comparador de regras mostra todas lado a lado.',
    },
  ],

  relacionadas: ['regras-de-aposentadoria', 'aposentadoria-idade-progressiva', 'aposentadoria-por-pontos', 'inss-autonomo-e-facultativo'],
}
