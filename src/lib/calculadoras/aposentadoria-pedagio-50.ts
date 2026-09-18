/**
 * CALC-105 — Regra de transição do pedágio de 50% (EC nº 103/2019, art. 17).
 *
 * A única regra sem idade mínima — e a única com porta de entrada: só para
 * quem estava a menos de dois anos do tempo exigido em 13/11/2019.
 *
 * Motor em `engine/calculadoras/regras-de-aposentadoria.ts`.
 */

import { calcularPedagio50 } from '../engine/calculadoras/regras-de-aposentadoria'
import { descreverMeiosMeses, descreverMeses } from '../engine/calculadoras/aposentadoria-comum'
import { centavos } from '../engine/types'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import {
  CAMPO_SEXO,
  NOTA_CNIS,
  NOTA_PROJECAO,
  camposDeTempo,
  camposDeTempoNaEmenda,
  destaquesDeCumprimento,
  mesesComoPrincipal,
} from './apresentacao-aposentadoria'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularPedagio50(
    {
      sexo: texto(valores, 'sexo') === 'homem' ? 'homem' : 'mulher',
      tempoNaEmendaAnos: numero(valores, 'emendaAnos'),
      tempoNaEmendaMeses: numero(valores, 'emendaMeses'),
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
        { rotulo: 'Faltava em 13/11/2019', valor: descreverMeses(v.faltavaNaEmendaMeses) },
        { rotulo: 'Pedágio', valor: descreverMeiosMeses(v.pedagioMeiosMeses) },
        { rotulo: 'Tempo total exigido', valor: descreverMeiosMeses(v.exigidoMeiosMeses) },
        ...destaquesDeCumprimento(v),
      ],
      notas: [
        'O pedágio é calculado sobre o que faltava em 13 de novembro de 2019, e não sobre o que falta hoje.',
        'Não há idade mínima nesta regra. Em compensação, o valor é multiplicado pelo fator previdenciário ' +
          '(parágrafo único do art. 17), que costuma reduzi-lo para quem se aposenta jovem.',
        NOTA_PROJECAO,
        NOTA_CNIS,
      ],
    },
  }
}

export const APOSENTADORIA_PEDAGIO_50: DefinicaoCalculadora = {
  id: 'CALC-105',
  slug: 'aposentadoria-pedagio-50',
  nome: 'Aposentadoria pelo pedágio de 50%',
  linhaDeContexto: 'Para quem estava perto de completar o tempo em 2019: o pedágio, o total exigido e o mês de cumprimento.',
  descricaoSeo:
    'Calcule o pedágio de 50% da reforma da Previdência: quem pode usar, quanto tempo a mais contribuir e em que mês a aposentadoria fica disponível.',

  campos: [CAMPO_SEXO, ...camposDeTempoNaEmenda(29, true), ...camposDeTempo(30)],

  parametrosRequeridos: [
    'aposentadoria-pedagio-50-percentual',
    'aposentadoria-pedagio-50-corte-mulher',
    'aposentadoria-pedagio-50-corte-homem',
    'aposentadoria-pedagio-50-tempo-mulher',
    'aposentadoria-pedagio-50-tempo-homem',
  ],

  rotuloResultado: 'Meses até cumprir os requisitos',

  calcular,

  faq: [
    {
      pergunta: 'Quem pode usar o pedágio de 50%?',
      resposta:
        'Só quem, em 13 de novembro de 2019, tinha MAIS de vinte e oito anos de contribuição (mulher) ou mais de trinta e três (homem), conforme o art. 17 da Emenda Constitucional nº 103/2019. Quem tinha exatamente esse tempo, ou menos, não entra nesta regra.',
    },
    {
      pergunta: 'Como o pedágio é calculado?',
      resposta:
        'É a metade do tempo que faltava, naquela data, para os trinta anos (mulher) ou trinta e cinco (homem). Faltava um ano? O pedágio é de seis meses, e o total exigido passa a trinta anos e seis meses.',
    },
    {
      pergunta: 'E se faltava um número ímpar de meses?',
      resposta:
        'A metade termina em meio mês, e a calculadora mantém o meio mês na conta, sem arredondar. Só a data de cumprimento, que é um mês do calendário, conta o meio mês que sobra como mês inteiro.',
    },
    {
      pergunta: 'Tem idade mínima?',
      resposta:
        'Não. É a única regra de transição sem idade mínima. Em compensação, o valor do benefício é multiplicado pelo fator previdenciário, que leva em conta a idade e a expectativa de vida — e costuma reduzir o valor de quem se aposenta mais jovem.',
    },
    {
      pergunta: 'Onde encontro o meu tempo de contribuição em 2019?',
      resposta:
        'No extrato do CNIS, no Meu INSS. Some as contribuições até outubro de 2019. Períodos sem registro no CNIS — trabalho rural, serviço militar, empregos antigos — podem ser reconhecidos, mas precisam de comprovação.',
    },
  ],

  relacionadas: ['aposentadoria-pedagio-100', 'regras-de-aposentadoria', 'aposentadoria-por-pontos', 'aposentadoria-idade-progressiva'],
}
