/**
 * CALC-106 — Regra de transição do pedágio de 100% (EC nº 103/2019, art. 20).
 *
 * Idade mínima fixa e mais baixa que a das outras regras, em troca de
 * contribuir o tempo inteiro que faltava em 13/11/2019. Idade e tempo correm
 * juntos, e o cumprimento é o que chegar por último.
 *
 * Motor em `engine/calculadoras/regras-de-aposentadoria.ts`.
 */

import { calcularPedagio100 } from '../engine/calculadoras/regras-de-aposentadoria'
import { descreverMeses } from '../engine/calculadoras/aposentadoria-comum'
import { centavos } from '../engine/types'
import { PREVIDENCIA_RGPS } from '../params/data/previdencia-rgps'
import { construirRegistro } from '../params/registry'
import {
  CAMPO_SEXO,
  NOTA_CNIS,
  NOTA_FORA,
  NOTA_PROJECAO,
  camposDeIdade,
  camposDeTempo,
  camposDeTempoNaEmenda,
  destaquesDeCumprimento,
  mesesComoPrincipal,
} from './apresentacao-aposentadoria'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularPedagio100(
    {
      sexo: texto(valores, 'sexo') === 'homem' ? 'homem' : 'mulher',
      idadeAnos: numero(valores, 'idadeAnos'),
      idadeMeses: numero(valores, 'idadeMeses'),
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
        { rotulo: 'Idade mínima', valor: descreverMeses(v.idadeExigidaMeses) },
        { rotulo: 'Faltava em 13/11/2019 — o pedágio', valor: descreverMeses(v.faltavaNaEmendaMeses) },
        { rotulo: 'Tempo total exigido', valor: descreverMeses(v.exigidoMeses) },
        ...destaquesDeCumprimento(v),
      ],
      notas: [
        'Regra de TRANSIÇÃO: vale para quem já era filiado ao Regime Geral em 13 de novembro de 2019.',
        'O pedágio é o tempo INTEIRO que faltava em 13 de novembro de 2019 — não o que falta hoje.',
        'O valor é apurado na forma da lei (art. 20, § 2º, II) e não pode ficar abaixo do salário mínimo (§ 3º).',
        NOTA_PROJECAO,
        NOTA_FORA,
        NOTA_CNIS,
      ],
    },
  }
}

export const APOSENTADORIA_PEDAGIO_100: DefinicaoCalculadora = {
  id: 'CALC-106',
  slug: 'aposentadoria-pedagio-100',
  nome: 'Aposentadoria pelo pedágio de 100%',
  linhaDeContexto: 'Idade mínima menor, em troca de contribuir o dobro do que faltava em 2019 — e em que mês isso se cumpre.',
  descricaoSeo:
    'Calcule o pedágio de 100% da reforma da Previdência: idade mínima, tempo total exigido e o mês em que idade e contribuição se cumprem juntas.',

  campos: [CAMPO_SEXO, ...camposDeIdade(55), ...camposDeTempoNaEmenda(25, true), ...camposDeTempo(32)],

  parametrosRequeridos: [
    'aposentadoria-pedagio-100-idade-mulher',
    'aposentadoria-pedagio-100-idade-homem',
    'aposentadoria-pedagio-100-tempo-mulher',
    'aposentadoria-pedagio-100-tempo-homem',
  ],

  rotuloResultado: 'Meses até cumprir os requisitos',

  calcular,

  faq: [
    {
      pergunta: 'O que é o pedágio de 100%?',
      resposta:
        'É a regra de transição do art. 20 da Emenda Constitucional nº 103/2019. Ela exige idade mínima — cinquenta e sete anos para a mulher e sessenta para o homem —, o tempo de contribuição de trinta ou trinta e cinco anos e, além dele, um período adicional igual ao tempo que faltava em 13 de novembro de 2019.',
    },
    {
      pergunta: 'Por que se chama pedágio de 100%?',
      resposta:
        'Porque o tempo adicional é o que faltava na data da Emenda, inteiro. Se faltavam três anos, você contribui esses três e mais três. O efeito é que o esforço dobra — daí o nome.',
    },
    {
      pergunta: 'Qual a diferença para o pedágio de 50%?',
      resposta:
        'O de cinquenta por cento não tem idade mínima, mas só vale para quem estava a menos de dois anos do tempo exigido em 2019, e o valor leva o fator previdenciário. O de cem por cento vale para qualquer filiado antes da Emenda, pede idade mínima e dobra o tempo que faltava.',
    },
    {
      pergunta: 'A idade mínima sobe com os anos?',
      resposta:
        'Não. Diferente da regra da idade progressiva, a idade do pedágio de cem por cento é fixa. É isso que costuma torná-la a primeira a se cumprir para quem começou a contribuir cedo.',
    },
    {
      pergunta: 'Idade e tempo precisam se cumprir ao mesmo tempo?',
      resposta:
        'Os dois são cumulativos. Como correm juntos — cada mês soma um de idade e um de contribuição —, o cumprimento é a data em que o último deles chega. A calculadora mostra qual dos dois está segurando a data.',
    },
  ],

  relacionadas: ['aposentadoria-pedagio-50', 'regras-de-aposentadoria', 'aposentadoria-idade-progressiva', 'aposentadoria-por-pontos'],
}
