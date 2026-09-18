/**
 * CALC-111 — Aposentadoria do professor da educação infantil e dos ensinos
 * fundamental e médio.
 *
 * As quatro regras do professor na EC nº 103/2019, lado a lado: pontos
 * (art. 15, § 3º), idade progressiva (art. 16, § 2º), pedágio de 100% (art. 20,
 * § 1º) e a permanente (art. 19, § 1º, II). O tempo é o de MAGISTÉRIO; tempo
 * misto segue as regras gerais, de CALC-108.
 *
 * Motor em `engine/calculadoras/regras-de-aposentadoria.ts`.
 */

import { compararRegrasDoProfessor, type AvaliacaoDaRegra } from '../engine/calculadoras/regras-de-aposentadoria'
import { centavos } from '../engine/types'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import {
  CAMPO_FILIACAO,
  CAMPO_SEXO,
  NOTA_CNIS,
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
      return r.anoDeCumprimento !== null && r.mesDeCumprimento !== null ? quando(r.anoDeCumprimento, r.mesDeCumprimento) : 'Sem previsão'
    case 'fora_do_horizonte':
      return 'Sem previsão nos próximos sessenta anos'
    case 'nao_se_aplica':
    case 'falta_dado':
      return r.motivo ?? 'Não se aplica'
  }
}

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = compararRegrasDoProfessor(
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
    { rotulo: 'Primeira regra a se cumprir', valor: maisCedo === null ? 'Nenhuma nos próximos sessenta anos' : maisCedo.nome },
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
        'Só conta o tempo de EFETIVO exercício de magistério na educação infantil e nos ensinos fundamental e ' +
          'médio. Quem tem também outro tempo de contribuição segue as regras gerais — o comparador de regras de ' +
          'aposentadoria as mostra.',
        'Professor universitário não entra nestas regras.',
        NOTA_PROJECAO,
        NOTA_VALOR,
        NOTA_CNIS,
      ],
    },
  }
}

export const APOSENTADORIA_DO_PROFESSOR: DefinicaoCalculadora = {
  id: 'CALC-111',
  slug: 'aposentadoria-do-professor',
  nome: 'Aposentadoria do professor',
  linhaDeContexto: 'As regras do magistério depois da reforma — com cinco anos a menos — e qual se cumpre primeiro.',
  descricaoSeo:
    'Calcule a aposentadoria do professor pela reforma da Previdência: pontos, idade progressiva, pedágio de 100% e regra permanente, com o mês de cumprimento.',

  campos: [
    CAMPO_SEXO,
    CAMPO_FILIACAO,
    ...camposDeIdade(50),
    ...camposDeTempo(25, 'Tempo de magistério hoje'),
    ...camposDeTempoNaEmenda(0, false).map((c) => ({
      ...c,
      rotulo: c.rotulo.replace('Tempo de contribuição', 'Tempo de magistério'),
      visivelSe: { campo: 'filiacao', em: ['antes'] },
    })),
  ],

  parametrosRequeridos: [
    'aposentadoria-professor-pontos-mulher',
    'aposentadoria-professor-idade-progressiva-mulher',
    'aposentadoria-professor-pedagio-100-idade-mulher',
    'aposentadoria-professor-permanente-idade-mulher',
  ],

  rotuloResultado: 'Meses até a primeira regra',

  calcular,

  faq: [
    {
      pergunta: 'O professor se aposenta mais cedo?',
      resposta:
        'Sim, com cinco anos a menos de idade e de tempo de contribuição na maior parte das regras — desde que todo o tempo seja de efetivo exercício de magistério na educação infantil ou nos ensinos fundamental e médio.',
    },
    {
      pergunta: 'Quais são as regras do professor depois da reforma?',
      resposta:
        'Para quem já contribuía em 13 de novembro de 2019: pontos (art. 15, § 3º), idade progressiva (art. 16, § 2º) e pedágio de 100% (art. 20, § 1º) da Emenda Constitucional nº 103/2019. Para quem começou depois: 57 anos, se mulher, e 60, se homem, com 25 anos de magistério (art. 19, § 1º, II).',
    },
    {
      pergunta: 'Quantos pontos o professor precisa?',
      resposta:
        'A professora começou com 81 pontos e o professor com 91, em 2019, com um ponto a mais a cada ano até 92 e 100. Além dos pontos, são exigidos 25 anos de magistério da mulher e 30 do homem.',
    },
    {
      pergunta: 'Tempo fora da sala de aula conta?',
      resposta:
        'As regras falam em efetivo exercício das funções de magistério. Quem tem tempo de contribuição em outra atividade segue as regras gerais, e o comparador de regras de aposentadoria mostra essas outras regras.',
    },
    {
      pergunta: 'E o valor da aposentadoria do professor?',
      resposta:
        'Segue o art. 26 da Emenda: 60% da média mais 2 pontos percentuais por ano acima de 20 anos, para o homem, e de 15, para a mulher; no pedágio de 100%, a média integral. A calculadora de valor da aposentadoria faz essa conta.',
    },
  ],

  relacionadas: ['regras-de-aposentadoria', 'valor-da-aposentadoria', 'aposentadoria-por-pontos', 'aposentadoria-pedagio-100'],
}
