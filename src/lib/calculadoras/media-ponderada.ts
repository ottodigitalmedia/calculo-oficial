/**
 * CALC-075 — Média ponderada e média escolar.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A pergunta que traz gente até aqui não é "qual é a minha média".** É
 * "quanto preciso tirar na última prova", e ela precisa dos pesos do que já foi
 * e do peso do que falta. Por isso os dois campos existem, e por isso a resposta
 * arredonda **para cima**: uma nota arredondada para baixo deixaria a média
 * abaixo do pedido, que é o único erro que essa conta não pode cometer.
 */

import { calcularMediaPonderada } from '../engine/calculadoras/listas'
import { centavos } from '../engine/types'
import { formatarNumero } from '../format/moeda'
import {
  lerLista,
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularMediaPonderada(
    {
      notas: lerLista(valores, 'notas', 2),
      mediaDesejada: numero(valores, 'mediaDesejada'),
      pesoRestante: numero(valores, 'pesoRestante'),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Avaliações consideradas', valor: `${v.avaliacoes}` },
    { rotulo: 'Peso total', valor: formatarNumero(v.somaDosPesos) },
    { rotulo: 'Média simples, para comparar', valor: formatarNumero(v.mediaSimples) },
  ]

  if (v.notaNecessaria !== null) {
    destaques.push({
      rotulo: v.inalcancavel
        ? 'Nota necessária — acima do teto usual'
        : 'Nota necessária no que falta',
      valor: formatarNumero(v.notaNecessaria),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      // Centésimos de ponto, não centavos — `unidade` é que diz como ler.
      principal: centavos(v.mediaPonderada),
      unidade: 'numero',
      /**
       * Vazio, como em CALC-070 e CALC-071: média, peso e nota necessária não
       * são parcelas de uma soma, e a coluna do resultado é a forma que o
       * produto usa para decompor totais.
       */
      detalhamento: [],
      destaques,
      notas: [
        'Linhas em branco não entram. Avaliação com peso zero também não — é ela que sinaliza ' +
          'o que ainda não aconteceu, e somá-la puxaria a média para baixo sem motivo.',
        'A média simples aparece só para comparação. Quando os pesos são todos iguais, as duas ' +
          'coincidem; quando não são, a distância entre elas mostra o quanto o peso está ' +
          'decidindo o resultado.',
        ...(v.notaNecessaria !== null
          ? [
              v.inalcancavel
                ? 'A nota necessária passa de dez, que é o teto usual. Com os pesos informados, a ' +
                  'média desejada não é alcançável no que resta — vale conferir se o peso do que ' +
                  'falta está certo.'
                : 'A nota necessária é o MÍNIMO que fecha a conta, arredondado para cima. Tirar ' +
                  'exatamente esse valor deixa a média no número pedido; tirar menos, abaixo dele.',
            ]
          : []),
        'Cada escola tem a sua regra de arredondamento e o seu critério de aprovação. A conta ' +
          'aqui é a média ponderada pura, e o regulamento da instituição é que diz o que ela ' +
          'significa.',
      ],
    },
  }
}

export const MEDIA_PONDERADA: DefinicaoCalculadora = {
  id: 'CALC-075',
  slug: 'media-ponderada',
  nome: 'Média ponderada e média escolar',
  linhaDeContexto: 'Qual é a sua média com os pesos — e quanto falta tirar no que resta.',
  descricaoSeo:
    'Calcule a média ponderada de notas com pesos diferentes e descubra quanto precisa tirar na avaliação que falta para alcançar a média que você quer.',

  campos: [
    {
      id: 'notas',
      rotulo: 'Notas e pesos',
      tipo: 'lista',
      obrigatorio: true,
      colunas: [
        { id: 'nota', rotulo: 'Nota', tipo: 'decimal', maximo: 100_000 },
        { id: 'peso', rotulo: 'Peso', tipo: 'decimal', maximo: 100_000 },
      ],
      maximoDeLinhas: 20,
      ajuda: 'Uma linha por avaliação. Peso 1 em todas equivale a média simples.',
    },
    {
      id: 'mediaDesejada',
      rotulo: 'Média que você quer alcançar',
      tipo: 'decimal',
      padrao: 0,
      minimo: 0,
      maximo: 100_000,
      ajuda: 'Deixe em branco para ver só a média atual.',
    },
    {
      id: 'pesoRestante',
      rotulo: 'Peso do que ainda falta',
      tipo: 'decimal',
      padrao: 0,
      minimo: 0,
      maximo: 100_000,
      ajuda: 'O peso da prova ou trabalho que ainda não tem nota.',
    },
  ],

  // Sem parâmetro legal: é aritmética.
  parametrosRequeridos: [],

  rotuloResultado: 'Média ponderada',

  calcular,

  faq: [
    {
      pergunta: 'Como descubro quanto preciso tirar na última prova?',
      resposta:
        'Informe as notas que você já tem com os respectivos pesos, a média que quer alcançar e o peso da avaliação que falta. O resultado mostra a nota mínima que fecha a conta. Ela é arredondada para cima de propósito: se fosse para baixo, tirar exatamente aquele valor deixaria a média um pouco abaixo do que você pediu — que é o único erro que essa conta não pode cometer.',
    },
    {
      pergunta: 'Qual a diferença entre média ponderada e média simples?',
      resposta:
        'Na média simples todas as notas valem o mesmo. Na ponderada, cada uma vale conforme o peso: uma prova de peso 3 pesa três vezes mais que um trabalho de peso 1. O resultado mostra as duas lado a lado — quando os pesos são todos iguais elas coincidem, e quanto mais diferentes forem, maior a distância entre as duas.',
    },
    {
      pergunta: 'Posso deixar linhas em branco?',
      resposta:
        'Pode, e elas são ignoradas. Avaliação com peso zero também não entra na conta: é assim que se marca o que ainda não aconteceu. Somar uma nota zero de uma prova que ainda não foi feita puxaria a média para baixo sem motivo, e é um erro comum quando se usa planilha.',
    },
    {
      pergunta: 'A nota necessária passou de dez. E agora?',
      resposta:
        'Significa que, com os pesos informados, a média desejada não é alcançável no que resta — nem tirando a nota máxima. Antes de concluir isso, vale conferir dois números: o peso do que falta, que às vezes é maior do que se imagina, e a média desejada, que pode estar acima do critério real de aprovação da sua escola.',
    },
    {
      pergunta: 'Serve para qualquer escola?',
      resposta:
        'A aritmética é a mesma em qualquer lugar, mas o que ela significa não. Cada instituição define a sua regra de arredondamento, o seu critério de aprovação e às vezes exige nota mínima em avaliações específicas, além da média. Use o resultado como o número da conta, e o regulamento da escola como o que decide.',
    },
  ],

  relacionadas: ['porcentagem', 'regra-de-tres', 'divisao-de-conta'],
}
