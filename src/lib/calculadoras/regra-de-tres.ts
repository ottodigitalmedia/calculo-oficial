/**
 * CALC-071 — Regra de três simples e composta.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A conta é trivial e a armadilha não é.** Nenhuma calculadora descobre
 * sozinha se mais operários significam menos tempo ou mais tempo — isso está no
 * problema, não na aritmética. O sentido de cada grandeza é campo, e a memória
 * declara qual foi aplicado; é a única decisão da página, e ela é do usuário.
 */

import {
  calcularRegraDeTres,
  type SentidoDaGrandeza,
  type TipoRegraDeTres,
} from '../engine/calculadoras/aritmetica'
import { formatarNumero } from '../format/moeda'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const sentidoDe = (valor: string): SentidoDaGrandeza => (valor === 'inversa' ? 'inversa' : 'direta')

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const tipo: TipoRegraDeTres = texto(valores, 'tipo') === 'composta' ? 'composta' : 'simples'

  const r = calcularRegraDeTres(
    {
      tipo,
      a: numero(valores, 'a'),
      b: numero(valores, 'b'),
      c: numero(valores, 'c'),
      sentido: sentidoDe(texto(valores, 'sentido')),
      a2: numero(valores, 'a2'),
      c2: numero(valores, 'c2'),
      sentido2: sentidoDe(texto(valores, 'sentido2')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: r.valores.resultado,
      unidade: 'numero',
      /**
       * Vazio, como em CALC-070: as grandezas do problema não são parcelas de
       * uma soma, e enfileirá-las numa coluna que o resto do produto usa para
       * decompor totais sugeriria uma adição que não existe.
       */
      detalhamento: [],
      ...(tipo === 'composta'
        ? {
            destaques: [
              {
                rotulo: 'Depois só da primeira grandeza',
                valor: formatarNumero(r.valores.parcial),
              },
            ],
          }
        : {}),
      notas: [
        'Proporção direta é quando as duas grandezas andam para o mesmo lado: mais quilos, mais ' +
          'preço. Inversa é quando andam para lados opostos: mais operários, menos tempo. ' +
          'Escolher o sentido errado devolve um número plausível, e é por isso que ele é campo, ' +
          'e não um palpite da calculadora.',
        'Na composta, cada grandeza é aplicada separadamente, uma depois da outra, com o seu ' +
          'próprio sentido. A memória de cálculo mostra o valor intermediário entre as duas — é ' +
          'ali que se confere se o sentido escolhido fazia sentido.',
      ],
    },
  }
}

export const REGRA_DE_TRES: DefinicaoCalculadora = {
  id: 'CALC-071',
  slug: 'regra-de-tres',
  nome: 'Regra de três',
  linhaDeContexto: 'Simples ou composta, direta ou inversa — com a proporção aberta ao lado.',
  descricaoSeo:
    'Resolva regra de três simples e composta, direta ou inversa, com o passo a passo da proporção. Escolha o sentido de cada grandeza e veja a conta aberta.',

  campos: [
    {
      id: 'tipo',
      rotulo: 'Quantas grandezas variam',
      tipo: 'selecao',
      padrao: 'simples',
      opcoes: [
        { valor: 'simples', rotulo: 'Uma — regra de três simples' },
        { valor: 'composta', rotulo: 'Duas — regra de três composta' },
      ],
    },
    {
      id: 'a',
      rotulo: 'Primeiro valor conhecido',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'A grandeza de referência. Exemplo: 4 operários.',
    },
    {
      id: 'b',
      rotulo: 'Resultado que corresponde a ele',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'O que se sabe que acontece com o primeiro valor. Exemplo: 12 dias.',
    },
    {
      id: 'sentido',
      rotulo: 'Sentido da primeira grandeza',
      tipo: 'selecao',
      padrao: 'direta',
      opcoes: [
        { valor: 'direta', rotulo: 'Direta — sobe junto' },
        { valor: 'inversa', rotulo: 'Inversa — sobe de um lado, desce do outro' },
      ],
      ajuda: 'Mais operários, menos dias: inversa. Mais quilos, mais preço: direta.',
    },
    {
      id: 'c',
      rotulo: 'Novo valor da primeira grandeza',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'Aquele para o qual você quer o resultado. Exemplo: 6 operários.',
    },
    {
      id: 'a2',
      rotulo: 'Segunda grandeza — valor conhecido',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      visivelSe: { campo: 'tipo', em: ['composta'] },
    },
    {
      id: 'sentido2',
      rotulo: 'Sentido da segunda grandeza',
      tipo: 'selecao',
      padrao: 'direta',
      opcoes: [
        { valor: 'direta', rotulo: 'Direta — sobe junto' },
        { valor: 'inversa', rotulo: 'Inversa — sobe de um lado, desce do outro' },
      ],
      visivelSe: { campo: 'tipo', em: ['composta'] },
    },
    {
      id: 'c2',
      rotulo: 'Segunda grandeza — novo valor',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      visivelSe: { campo: 'tipo', em: ['composta'] },
    },
  ],

  // Sem parâmetro legal: é aritmética.
  parametrosRequeridos: [],

  rotuloResultado: 'Valor procurado',

  calcular,

  faq: [
    {
      pergunta: 'Como sei se a proporção é direta ou inversa?',
      resposta:
        'Pergunte o que acontece com o resultado quando a grandeza aumenta. Se ele aumenta também, é direta: o dobro de quilos custa o dobro. Se ele diminui, é inversa: o dobro de operários leva metade do tempo, o dobro de velocidade leva metade da duração. Essa pergunta está no enunciado do problema, não na conta — e é por isso que a calculadora não decide por você.',
    },
    {
      pergunta: 'Quando a regra de três é composta?',
      resposta:
        'Quando duas grandezas mudam ao mesmo tempo. Se quatro operários levantam um muro em doze dias, e você quer saber quanto levam seis operários para um muro do dobro do tamanho, há duas grandezas em jogo: o número de operários, que é inversa, e o tamanho do muro, que é direta. Cada uma entra separadamente, e o resultado de uma alimenta a outra.',
    },
    {
      pergunta: 'Por que o resultado tem casas decimais?',
      resposta:
        'Porque a proporção quase nunca dá um número redondo. O arredondamento aqui é sempre na segunda casa, com meio para cima — a mesma convenção que a calculadora do celular usa, para que você possa conferir. A memória de cálculo mostra a multiplicação e a divisão exatas que produziram o valor.',
    },
    {
      pergunta: 'Serve para converter unidades e escalas?',
      resposta:
        'Serve, e é um dos usos mais comuns. Converter uma receita para mais pessoas, ajustar uma escala de planta, achar preço por quilo a partir do preço de outra quantidade — tudo isso é proporção direta. Para porcentagem especificamente há uma calculadora própria, que já traz os cinco casos prontos.',
    },
  ],

  relacionadas: ['porcentagem', 'juros-compostos', 'alcool-ou-gasolina'],
}
