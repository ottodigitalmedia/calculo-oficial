/**
 * CALC-104 — Regra de transição da idade progressiva (EC nº 103/2019, art. 16).
 *
 * Idade mínima que sobe seis meses por ano, com tempo mínimo de contribuição.
 * A página responde QUANDO os dois se cumprem — e a escada é o que torna a
 * resposta menos óbvia do que parece.
 *
 * Motor em `engine/calculadoras/regras-de-aposentadoria.ts`.
 */

import { calcularIdadeProgressiva } from '../engine/calculadoras/regras-de-aposentadoria'
import { descreverMeses } from '../engine/calculadoras/aposentadoria-comum'
import { centavos } from '../engine/types'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import {
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
  const r = calcularIdadeProgressiva(
    {
      sexo: texto(valores, 'sexo') === 'homem' ? 'homem' : 'mulher',
      idadeAnos: numero(valores, 'idadeAnos'),
      idadeMeses: numero(valores, 'idadeMeses'),
      tempoAnos: numero(valores, 'tempoAnos'),
      tempoMeses: numero(valores, 'tempoMeses'),
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
        { rotulo: 'Idade exigida neste ano', valor: descreverMeses(v.idadeExigidaMeses) },
        { rotulo: 'Tempo mínimo de contribuição', valor: `${v.tempoMinimoAnos} anos` },
        ...destaquesDeCumprimento(v),
        ...(v.idadeExigidaNoCumprimentoMeses !== null && !v.cumpreHoje
          ? [{ rotulo: 'Idade exigida naquele mês', valor: descreverMeses(v.idadeExigidaNoCumprimentoMeses) }]
          : []),
      ],
      notas: [
        'Regra de TRANSIÇÃO: vale para quem já era filiado ao Regime Geral em 13 de novembro de 2019.',
        NOTA_PROJECAO,
        NOTA_VALOR,
        NOTA_FORA,
        NOTA_CNIS,
      ],
    },
  }
}

export const APOSENTADORIA_IDADE_PROGRESSIVA: DefinicaoCalculadora = {
  id: 'CALC-104',
  slug: 'aposentadoria-idade-progressiva',
  nome: 'Aposentadoria pela idade progressiva',
  linhaDeContexto: 'A idade mínima sobe seis meses por ano — em que mês você a alcança, com o tempo de contribuição exigido.',
  descricaoSeo:
    'Calcule a regra de transição da idade progressiva: idade mínima do ano, tempo de contribuição exigido e o mês em que os dois requisitos se cumprem.',

  campos: [CAMPO_SEXO, ...camposDeIdade(58), ...camposDeTempo(30)],

  parametrosRequeridos: [
    'aposentadoria-idade-progressiva-mulher',
    'aposentadoria-idade-progressiva-homem',
    'aposentadoria-idade-progressiva-tempo-mulher',
    'aposentadoria-idade-progressiva-tempo-homem',
  ],

  rotuloResultado: 'Meses até cumprir os requisitos',

  calcular,

  faq: [
    {
      pergunta: 'O que é a regra da idade progressiva?',
      resposta:
        'É a regra de transição do art. 16 da Emenda Constitucional nº 103/2019. Ela exige, ao mesmo tempo, tempo mínimo de contribuição — trinta anos para a mulher e trinta e cinco para o homem — e uma idade mínima que aumenta a cada ano.',
    },
    {
      pergunta: 'Quanto a idade mínima sobe por ano?',
      resposta:
        'Seis meses a cada 1º de janeiro, desde 2020. A mulher começou em cinquenta e seis anos e chega a sessenta e dois em 2031; o homem começou em sessenta e um e chegou a sessenta e cinco em 2027, onde a escada parou.',
    },
    {
      pergunta: 'Por que demoro mais do que parece para alcançar a idade?',
      resposta:
        'Porque você envelhece doze meses por ano e a exigência sobe seis. A distância cai pela metade da velocidade até a escada chegar ao teto — daí em diante, cai no ritmo normal. É por isso que a calculadora projeta mês a mês.',
    },
    {
      pergunta: 'Quem pode usar esta regra?',
      resposta:
        'Quem já era filiado ao Regime Geral de Previdência Social em 13 de novembro de 2019, data em que a Emenda entrou em vigor. Quem começou a contribuir depois segue a regra permanente, com idade fixa.',
    },
    {
      pergunta: 'Esta é a melhor regra para mim?',
      resposta:
        'Depende do seu histórico. Há outras regras de transição — pontos, pedágio de cinquenta por cento, pedágio de cem por cento e idade —, e vale a mais favorável. O comparador de regras mostra todas lado a lado.',
    },
  ],

  relacionadas: ['regras-de-aposentadoria', 'aposentadoria-por-pontos', 'aposentadoria-por-idade', 'aposentadoria-pedagio-100'],
}
