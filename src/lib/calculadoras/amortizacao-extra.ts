/**
 * CALC-036 — Amortização extra no financiamento: prazo ou parcela.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Ela e CALC-026 respondem perguntas diferentes, e o motor mostra isso.** A
 * quitação antecipada parte do valor da parcela e deduz o saldo devedor a valor
 * presente — o que só vale com parcela constante. Aqui o saldo devedor é dado
 * de entrada, porque é o que o extrato do financiamento traz, e o sistema pode
 * ser SAC, em que parcela nenhuma se repete.
 *
 * E as duas escolhas aparecem **juntas**, sem o usuário ter de optar antes de
 * ver. A escolha é o que ele veio decidir.
 */

import { calcularAmortizacaoExtra } from '../engine/calculadoras/amortizacao-extra'
import { basisPoints, centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularAmortizacaoExtra(
    {
      saldoDevedor: centavos(numero(valores, 'saldoDevedor')),
      prazoRestanteMeses: numero(valores, 'prazoRestante'),
      taxaMensal: basisPoints(numero(valores, 'taxaMensal')),
      sistema: texto(valores, 'sistema') === 'price' ? 'price' : 'sac',
      valorExtra: centavos(numero(valores, 'valorExtra')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Prestações eliminadas', valor: `${v.mesesEliminados}` },
    { rotulo: 'Prazo que sobra', valor: `${v.novoPrazo} meses` },
  ]

  if (!v.quitacaoTotal) {
    destaques.push(
      { rotulo: 'Economia ao reduzir a parcela', valor: formatarReal(v.economiaParcela) },
      { rotulo: 'Prestação se reduzir a parcela', valor: formatarReal(v.novaParcela) },
    )
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.economiaPrazo,
      /**
       * Comparação, não decomposição — e ainda assim a coluna tem de fechar:
       * a primeira linha menos a segunda é exatamente a terceira. Um caso-ouro
       * roda a função DESTA definição e cobra a identidade
       * (`ESTADO-DO-PROJETO` §7.12).
       */
      detalhamento: [
        { rotulo: 'Seguindo o contrato até o fim', valor: v.totalSemAmortizar, sinal: 'debito' },
        {
          rotulo: 'Amortizando hoje e mantendo a prestação',
          valor: v.totalReduzindoPrazo,
          sinal: 'debito',
        },
        { rotulo: 'Economia ao reduzir o prazo', valor: v.economiaPrazo, sinal: 'neutro' },
      ],
      destaques,
      tabela: {
        titulo: 'As duas escolhas, com o mesmo dinheiro no mesmo dia',
        colunas: ['Total a pagar', 'Economia'],
        linhas: [
          { rotulo: 'Sem amortizar', valores: [v.totalSemAmortizar, centavos(0)] },
          { rotulo: 'Reduzindo o prazo', valores: [v.totalReduzindoPrazo, v.economiaPrazo] },
          {
            rotulo: 'Reduzindo a parcela',
            valores: [v.totalReduzindoParcela, v.economiaParcela],
          },
        ],
      },
      notas: [
        v.quitacaoTotal
          ? 'O valor informado cobre o saldo devedor inteiro: isso é quitação total, e não ' +
            'amortização parcial. Não há prazo nem parcela a reduzir depois, e a economia é ' +
            'tudo o que havia de juros pela frente.'
          : 'Reduzir o prazo economiza mais, sempre, porque cada mês eliminado é um mês inteiro ' +
            'de juros que deixa de existir. Reduzir a parcela alivia o orçamento agora e ' +
            'devolve menos no total — as duas são direito seu, e a escolha é sua.',
        'O saldo devedor a usar é o do extrato, não a soma das parcelas que faltam. A soma das ' +
          'parcelas embute juros de meses que ainda não correram, e usá-la aqui inflaria a ' +
          'economia.',
        'A conta considera apenas juros e amortização. Seguros e tarifa de administração ' +
          'continuam sendo cobrados nas prestações que sobrarem, e no financiamento imobiliário ' +
          'o saldo ainda pode ser corrigido por índice — os dois empurram o resultado real.',
      ],
    },
  }
}

export const AMORTIZACAO_EXTRA: DefinicaoCalculadora = {
  id: 'CALC-036',
  slug: 'amortizacao-extra',
  nome: 'Amortização extra — prazo ou parcela',
  linhaDeContexto:
    'O que rende mais com o mesmo dinheiro: encurtar o contrato ou baixar a prestação.',
  descricaoSeo:
    'Simule uma amortização extra e compare as duas escolhas lado a lado: reduzir o prazo ou reduzir a parcela, com a economia de juros de cada uma.',

  campos: [
    {
      id: 'saldoDevedor',
      rotulo: 'Saldo devedor de hoje',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 500_000_000,
      ajuda: 'O valor que o extrato do financiamento mostra como devido — não a soma das parcelas que faltam.',
    },
    {
      id: 'prazoRestante',
      rotulo: 'Prestações que ainda faltam',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 420,
    },
    {
      id: 'taxaMensal',
      rotulo: 'Taxa de juros ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'A taxa do contrato, que aparece no extrato ao lado do saldo.',
    },
    {
      id: 'sistema',
      rotulo: 'Sistema de amortização do contrato',
      tipo: 'selecao',
      padrao: 'sac',
      opcoes: [
        { valor: 'sac', rotulo: 'SAC — a prestação vem caindo' },
        { valor: 'price', rotulo: 'Price — a prestação é sempre a mesma' },
      ],
      ajuda: 'Se as suas prestações são todas iguais, é Price. Se diminuem todo mês, é SAC.',
    },
    {
      id: 'valorExtra',
      rotulo: 'Quanto você vai amortizar agora',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 500_000_000,
      ajuda: 'O pagamento extra, fora a prestação do mês.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Economia ao reduzir o prazo',

  calcular,

  faq: [
    {
      pergunta: 'Reduzir o prazo ou reduzir a parcela?',
      resposta:
        'Em economia de juros, reduzir o prazo ganha sempre. Cada prestação eliminada do fim do contrato leva embora um mês inteiro de juros. Reduzir a parcela mantém o contrato correndo pelo mesmo tempo e apenas dilui o abatimento — o alívio aparece no orçamento do mês, e o total pago cai bem menos. A tabela acima mostra as duas com o mesmo dinheiro, no mesmo dia.',
    },
    {
      pergunta: 'O banco pode escolher por mim?',
      resposta:
        'A escolha é do consumidor. O art. 52, § 2º do Código de Defesa do Consumidor assegura a liquidação antecipada, total ou parcial, com redução proporcional dos juros — e é comum a instituição oferecer só uma das modalidades no aplicativo, sem mencionar a outra. Se a que você quer não estiver disponível ali, ela pode ser pedida.',
    },
    {
      pergunta: 'Por que preciso do saldo devedor, e não do valor das parcelas?',
      resposta:
        'Porque a soma das parcelas que faltam embute juros de meses que ainda não correram, e o saldo devedor não. Se o seu contrato tem prestações iguais e você não sabe o saldo, a calculadora de quitação antecipada deduz o saldo a partir das parcelas. Num contrato SAC, em que as prestações caem todo mês, esse caminho não serve — e o extrato já traz o número certo.',
    },
    {
      pergunta: 'Amortizar compensa mais do que investir esse dinheiro?',
      resposta:
        'A comparação é entre a taxa do financiamento e o rendimento líquido de imposto do investimento. Se o crédito custa mais ao mês do que a aplicação rende depois do imposto, amortizar rende mais — e sem risco. Em financiamento imobiliário, cujas taxas são das mais baixas do mercado de crédito, essa conta às vezes se inverte, e vale fazê-la antes de decidir.',
    },
    {
      pergunta: 'É melhor amortizar várias vezes menores ou juntar e amortizar uma vez só?',
      resposta:
        'Antes é melhor. Cada real abatido para de gerar juros a partir do dia em que entra, então adiar a amortização para juntar um valor maior custa os juros do intervalo. Guardar faz sentido se o dinheiro estiver rendendo mais que a taxa do contrato, ou se houver carência contratual para amortização extra — condição que vale conferir no contrato.',
    },
  ],

  relacionadas: ['quitacao-antecipada', 'financiamento-imobiliario', 'amortizacao-sac-price'],
}
