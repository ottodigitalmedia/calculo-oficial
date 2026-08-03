/**
 * CALC-073 — Divisão de conta entre pessoas.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A primeira publicada com campo de lista.** A alternativa — dividir o total
 * por N — resolve o caso fácil e erra o caso real: quase nunca todo mundo
 * consome igual, e é aí que a conta vira discussão. Uma linha por pessoa é o
 * que torna a página útil.
 *
 * **A sobra do arredondamento fica com a última pessoa, e a tela diz isso.** É
 * a única forma de a soma das partes fechar com o total ao centavo — e um
 * centavo faltando numa conta de restaurante é exatamente o tipo de coisa que
 * alguém confere.
 */

import { dividirConta } from '../engine/calculadoras/listas'
import { basisPoints, centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import {
  lerLista,
  numero,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const compartilhado = centavos(numero(valores, 'compartilhado'))

  const r = dividirConta(
    {
      consumos: lerLista(valores, 'consumos', 1),
      compartilhado,
      gorjetaBp: basisPoints(numero(valores, 'gorjeta')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o total exibido. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Soma dos consumos', valor: v.somaDosConsumos, sinal: 'neutro' },
  ]
  if (compartilhado > 0) {
    linhas.push({ rotulo: 'Itens de todos', valor: compartilhado, sinal: 'neutro' })
  }
  if (v.gorjeta > 0) {
    linhas.push({ rotulo: 'Gorjeta', valor: v.gorjeta, sinal: 'neutro' })
  }
  linhas.push({ rotulo: 'Total da conta', valor: v.total, sinal: 'neutro' })

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.total,
      detalhamento: linhas,
      destaques: [
        { rotulo: 'Pessoas', valor: `${v.pessoas}` },
        {
          rotulo: 'Se dividissem igualmente',
          valor: formatarReal(Math.round(v.total / v.pessoas)),
        },
      ],
      tabela: {
        titulo: 'Quanto cada pessoa paga',
        colunas: ['Consumo', 'Parte dos itens de todos', 'Gorjeta', 'Total'],
        linhas: v.partes.map((p, i) => ({
          rotulo: `Pessoa ${i + 1}`,
          valores: [p.consumo, p.rateio, p.gorjeta, p.total],
        })),
      },
      notas: [
        'Linhas em branco não entram na conta. Adicione uma pessoa por linha e informe o que ' +
          'cada uma consumiu — quem não consumiu nada simplesmente não aparece.',
        'A gorjeta é distribuída na proporção do consumo: quem consumiu mais paga mais gorjeta. ' +
          'É a divisão que a maioria considera justa, e a que a conta faz por padrão.',
        'Os itens de todos são divididos em partes iguais. Quando a divisão não é exata, os ' +
          'centavos que sobram ficam com a ÚLTIMA pessoa da lista — é o que faz a soma das ' +
          'partes fechar exatamente com o total.',
        'O destaque "se dividissem igualmente" existe para comparação: em mesas onde o consumo ' +
          'foi parecido, a diferença some e dividir por igual é mais simples.',
      ],
    },
  }
}

export const DIVISAO_DE_CONTA: DefinicaoCalculadora = {
  id: 'CALC-073',
  slug: 'divisao-de-conta',
  nome: 'Divisão de conta',
  linhaDeContexto: 'Quanto cada um paga quando o consumo foi diferente — com gorjeta na proporção.',
  descricaoSeo:
    'Divida a conta do restaurante por consumo individual, com itens compartilhados e gorjeta distribuída proporcionalmente. Veja quanto cada pessoa paga.',

  campos: [
    {
      id: 'consumos',
      rotulo: 'O que cada pessoa consumiu',
      tipo: 'lista',
      obrigatorio: true,
      colunas: [
        { id: 'valor', rotulo: 'Consumo', tipo: 'monetario', maximo: 100_000_000 },
      ],
      maximoDeLinhas: 30,
      ajuda: 'Uma linha por pessoa. Linhas em branco são ignoradas.',
    },
    {
      id: 'compartilhado',
      rotulo: 'Itens de todos',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Entradas, couvert, aquilo que ninguém consegue separar. É dividido em partes iguais.',
    },
    {
      id: 'gorjeta',
      rotulo: 'Gorjeta',
      tipo: 'percentual',
      padrao: 1_000,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Dez por cento é o usual. Deixe em zero se não vai pagar.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Total da conta',

  calcular,

  faq: [
    {
      pergunta: 'Por que não basta dividir o total pelo número de pessoas?',
      resposta:
        'Porque quase nunca todo mundo consome igual, e é aí que a conta vira discussão. Quem tomou água e dividiu uma entrada paga o mesmo que quem pediu prato caro e três cervejas. O resultado mostra os dois números — o que cada um deve pelo próprio consumo e quanto sairia dividindo por igual —, para que a mesa decida com os dois à vista.',
    },
    {
      pergunta: 'Como a gorjeta é dividida?',
      resposta:
        'Na proporção do consumo. Quem consumiu mais paga mais gorjeta, o que é coerente com a forma como ela é cobrada: um percentual sobre o total. A alternativa seria dividir a gorjeta em partes iguais, o que faria quem consumiu pouco subsidiar quem consumiu muito justamente na parte opcional da conta.',
    },
    {
      pergunta: 'E os centavos que sobram na divisão?',
      resposta:
        'Ficam com a última pessoa da lista. Quando o valor compartilhado não divide exato entre as pessoas, alguém precisa levar a diferença — se ninguém levasse, a soma das partes ficaria alguns centavos abaixo do total, e a conta não fecharia. A escolha é declarada aqui em vez de escondida: a diferença é de centavos e sempre da mesma posição.',
    },
    {
      pergunta: 'Posso usar para dividir contas de casa?',
      resposta:
        'Pode, e funciona bem quando as despesas são individualizáveis. Informe o que cada pessoa deve por conta própria nas linhas e ponha as despesas comuns — aluguel, internet, luz — no campo de itens de todos, que divide por igual. A gorjeta pode ficar em zero.',
    },
  ],

  relacionadas: ['porcentagem', 'orcamento-domestico', 'media-ponderada'],
}
