/**
 * CALC-030 — Cheque especial: custo real.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * Mesma tese de CALC-023: existe teto legal, quase ninguém sabe dele, e o número
 * que assusta é o anual. Mesmo aviso contextual, pela mesma razão de
 * `00-catalogo` §6.
 */

import { calcularChequeEspecial } from '../engine/calculadoras/cheque-especial'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { CREDITO } from '../params/data/credito'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

/** Registro montado no módulo adiado — ver a nota em `salario-liquido.ts`. */
const registro = construirRegistro(CREDITO)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularChequeEspecial(
    {
      valorUsado: centavos(numero(valores, 'valorUsado')),
      diasDeUso: numero(valores, 'diasDeUso'),
      taxaMensal: basisPoints(numero(valores, 'taxaMensal')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'A taxa informada, ao ano', valor: formatarPercentual(v.taxaAnual) },
    { rotulo: 'Teto legal', valor: `${formatarPercentual(v.tetoMensal)} ao mês` },
  ]

  if (v.acimaDoTeto) {
    destaques.push({ rotulo: 'Cobrado acima do teto', valor: formatarReal(v.excessoCobrado) })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.jurosDoPeriodo,
      detalhamento: [
        { rotulo: 'Valor usado do limite', valor: v.valorUsado, sinal: 'neutro' },
        { rotulo: 'Juros do período', valor: v.jurosDoPeriodo, sinal: 'debito' },
        { rotulo: 'Total a devolver', valor: v.totalAPagar, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        ...(v.acimaDoTeto
          ? [
              `A taxa informada ultrapassa o teto da Resolução CMN nº 4.765/2019, que limita os ` +
                `juros do cheque especial a ${formatarPercentual(v.tetoMensal)} ao mês. No limite ` +
                `legal os juros seriam ${formatarReal(v.jurosNoTeto)}. Confira a taxa no extrato e ` +
                `questione o banco.`,
            ]
          : [
              'Repare que o teto é ALTO, não baixo: oito por cento ao mês, capitalizados, passam ' +
                'de 150% ao ano. Estar dentro do limite legal não faz do cheque especial um ' +
                'crédito barato — ele continua sendo um dos mais caros do mercado.',
            ]),
        'A conversão para o período usa proporção linear sobre o mês de trinta dias, que é a ' +
          'leitura mais simples e a que você consegue conferir. O banco capitaliza por dia, o que ' +
          'produz um valor pouco maior.',
      ],
    },
  }
}

export const CHEQUE_ESPECIAL: DefinicaoCalculadora = {
  id: 'CALC-030',
  slug: 'cheque-especial',
  nome: 'Cheque especial — custo real',
  linhaDeContexto: 'Quanto custam os dias no vermelho — e qual é o teto que a lei impõe.',
  descricaoSeo:
    'Calcule os juros do cheque especial pelo valor usado e pelos dias de uso, veja a taxa anual equivalente e compare com o teto de 8% ao mês da Resolução CMN nº 4.765/2019.',

  campos: [
    {
      id: 'valorUsado',
      rotulo: 'Quanto do limite você usou',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'diasDeUso',
      rotulo: 'Por quantos dias ficou no vermelho',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 365,
    },
    {
      id: 'taxaMensal',
      rotulo: 'Taxa de juros ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Consta do extrato e do aplicativo do banco, ao lado do limite.',
    },
  ],

  parametrosRequeridos: ['cheque-especial-teto-juros-mes'],

  rotuloResultado: 'Juros do período',

  calcular,

  avisoAdicional:
    'Esta calculadora não recomenda contratar nem deixar de contratar crédito. Se você usa o cheque especial com frequência, o Banco Central orienta procurar o banco para trocar por uma linha mais barata.',

  faq: [
    {
      pergunta: 'Existe limite para os juros do cheque especial?',
      resposta:
        'Existe, desde 6 de janeiro de 2020. A Resolução CMN nº 4.765, de 2019, no art. 3º, limita os juros remuneratórios sobre o valor utilizado a no máximo 8% ao mês. O limite vale para conta de depósitos à vista de pessoa natural e de microempreendedor individual.',
    },
    {
      pergunta: 'Oito por cento ao mês é pouco?',
      resposta:
        'É muito. Oito por cento ao mês, capitalizados, passam de 150% ao ano — o teto é alto, não baixo. Ele impede o abuso, não torna o cheque especial barato. Praticamente qualquer outra linha de crédito, inclusive o parcelamento da fatura do cartão, custa menos.',
    },
    {
      pergunta: 'O banco ainda pode cobrar tarifa pelo limite?',
      resposta:
        'Não. A mesma resolução criou, no art. 2º, uma tarifa de até 0,25% ao mês sobre o limite que excedesse R$ 500,00 — mas esse artigo foi revogado a partir de 1º de novembro de 2021 pela Resolução CMN nº 4.962/2021, e o Supremo Tribunal Federal o declarou inconstitucional na ADI 6.407. Muita explicação que circula por aí ainda descreve o texto de 2019 e menciona essa tarifa.',
    },
    {
      pergunta: 'Por que o cálculo usa trinta dias?',
      resposta:
        'Porque a norma limita a taxa ao mês e não diz como converter para o período de uso. O cálculo aplica proporção linear sobre um mês de trinta dias, que é a leitura mais simples e a única que você consegue conferir com uma calculadora comum. O banco capitaliza por dia, o que produz um valor um pouco maior — a memória de cálculo declara essa escolha.',
    },
    {
      pergunta: 'Vale a pena trocar o cheque especial por outro crédito?',
      resposta:
        'A comparação certa é entre a taxa anual desta calculadora e a taxa anual da outra linha, não entre os valores mensais. Um empréstimo pessoal a 3% ao mês custa cerca de 42% ao ano; o cheque especial no teto custa mais de 150%. Esta calculadora estima custos e não recomenda produto — a decisão e a contratação são suas.',
    },
  ],

  relacionadas: ['rotativo-do-cartao', 'cet-custo-efetivo-total', 'juros-compostos'],
}
