/**
 * CALC-021 — Imposto de renda sobre criptoativos.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Ficou no catálogo como "regra em mudança" desde o levantamento**, e a
 * mudança não veio: a MP nº 1.303/2025, que poria alíquota única de 17,5% e
 * acabaria com a isenção mensal, caducou em 08/10/2025. Ver a nota em
 * `engine/calculadoras/cripto.ts` e §7.66.
 *
 * **Sem parâmetro legal novo além do teto.** A tabela é a mesma de CALC-020 —
 * ganho de capital é ganho de capital, e a lei não tem tabela própria para
 * cripto. Reaproveitar em vez de recadastrar é o que garante que as duas nunca
 * divirjam, e foi assim que o defeito de 100× nas faixas apareceu.
 */

import { calcularCripto, PARAMETROS_CRIPTO } from '../engine/calculadoras/cripto'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { GANHO_DE_CAPITAL } from '../params/data/ganho-de-capital'
import { construirRegistro } from '../params/registry'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(GANHO_DE_CAPITAL)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularCripto(
    {
      alienadoBrasil: centavos(numero(valores, 'alienadoBrasil')),
      alienadoExterior: centavos(numero(valores, 'alienadoExterior')),
      custoAquisicao: centavos(numero(valores, 'custoAquisicao')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Ganho apurado nas vendas no Brasil', valor: v.ganho, sinal: 'neutro' },
    { rotulo: 'Imposto sobre o ganho', valor: v.imposto, sinal: 'debito' },
    { rotulo: 'Ganho depois do imposto', valor: v.liquido, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Situação no mês', valor: v.isento ? 'Isento' : 'Tributado' },
    { rotulo: 'Total vendido no mês', valor: formatarReal(v.totalAlienadoNoMes) },
    { rotulo: 'Teto da isenção', valor: formatarReal(v.tetoIsencao) },
  ]

  if (v.isento) {
    destaques.push({
      rotulo: 'Ainda cabe vender no mês',
      valor: formatarReal(v.folgaAteOTeto),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.imposto,
      detalhamento: linhas,
      destaques,
      notas: [
        'A isenção olha o TOTAL VENDIDO no mês, não o lucro. Quem vendeu muito com lucro pequeno ' +
          'não é isento — e quem vendeu pouco com lucro grande é.',
        'O teto é um degrau, não um desconto. Ultrapassado, o ganho de TODAS as vendas do mês é ' +
          'tributado, e não apenas a parte que passou do limite.',
        'O conjunto soma todos os tipos de criptoativo — Bitcoin, altcoins, stablecoins, NFTs — e ' +
          'soma o que foi vendido no Brasil com o que foi vendido no exterior. Por isso o campo ' +
          'do exterior existe aqui mesmo sem entrar no imposto calculado.',
        ...(v.temExterior
          ? [
              'Você informou vendas no exterior. Desde 1º de janeiro de 2024 elas seguem a Lei nº ' +
                '14.754/2023, como aplicação financeira no exterior, e para elas NÃO há isenção. ' +
                'Esta calculadora usa esse valor apenas para testar o teto — o imposto dessas ' +
                'vendas não está no resultado acima.',
            ]
          : []),
        'Trocar uma criptomoeda por outra é alienação, mesmo sem passar por real. O valor da ' +
          'moeda recebida, em reais na data da troca, entra como venda — é onde a maioria das ' +
          'contas caseiras deixa imposto de fora.',
        'O recolhimento vence no último dia útil do mês seguinte ao da operação, no código de ' +
          'receita 4600. Esta conta é mensal: cada mês tem o seu próprio teto.',
      ],
    },
  }
}

export const CRIPTO: DefinicaoCalculadora = {
  id: 'CALC-021',
  slug: 'imposto-sobre-criptoativos',
  nome: 'Imposto sobre criptoativos',
  linhaDeContexto: 'Se as suas vendas do mês passaram do teto de isenção, e quanto pagar.',
  descricaoSeo:
    'Calcule o imposto de renda sobre a venda de criptoativos no mês: teto de isenção, alíquotas progressivas do ganho de capital e a norma de cada valor.',

  campos: [
    {
      id: 'alienadoBrasil',
      rotulo: 'Total vendido no mês, no Brasil',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000_000,
      ajuda:
        'Soma de tudo o que você vendeu ou trocou no mês, em corretoras no Brasil. Troca de uma moeda por outra também conta.',
    },
    {
      id: 'custoAquisicao',
      rotulo: 'Custo de aquisição do que foi vendido',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'Quanto você pagou pelas moedas que vendeu, incluindo taxas de compra.',
    },
    {
      id: 'alienadoExterior',
      rotulo: 'Total vendido no mês, no exterior',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda:
        'Só para o teste do teto: o limite observa o conjunto vendido no Brasil e no exterior. O imposto dessas vendas segue regra própria.',
    },
  ],

  parametrosRequeridos: [...PARAMETROS_CRIPTO],
  rotuloResultado: 'Imposto do mês',
  calcular,

  avisoAdicional:
    'Esta conta cobre criptoativo custodiado ou negociado no Brasil. O que está em corretora no exterior segue a Lei nº 14.754/2023 desde 2024, sem isenção, e não é calculado aqui. A calculadora também não compensa prejuízos entre meses.',

  faq: [
    {
      pergunta: 'Vendi R$ 30.000,00 em bitcoin e R$ 10.000,00 em outra moeda. Sou isento?',
      resposta:
        'Não. O limite de R$ 35.000,00 observa o conjunto de criptoativos vendidos no mês, somados todos os tipos — Bitcoin, altcoins, stablecoins, NFTs. Os R$ 40.000,00 ultrapassam o teto, e o ganho de todas as vendas do mês passa a ser tributado.',
    },
    {
      pergunta: 'O limite é sobre o lucro ou sobre o valor vendido?',
      resposta:
        'Sobre o valor vendido. É o erro mais comum sobre este imposto: quem vendeu R$ 200.000,00 e lucrou R$ 1.000,00 não é isento, porque o total alienado passou do teto. E quem vendeu R$ 30.000,00 com R$ 25.000,00 de lucro é isento, porque não passou.',
    },
    {
      pergunta: 'Trocar uma cripto por outra paga imposto?',
      resposta:
        'Sim. A Receita trata a permuta como alienação, ainda que a moeda recebida não seja convertida em real: o valor de mercado em reais na data da troca é o valor de alienação. É a orientação da resposta 653 do "Perguntas e Respostas IRPF", apoiada no art. 118 do Código Tributário Nacional.',
    },
    {
      pergunta: 'A alíquota não passou a ser 17,5% em 2026?',
      resposta:
        'Não. A Medida Provisória nº 1.303/2025 propunha alíquota única de 17,5% e o fim da isenção mensal a partir de 2026, mas perdeu a vigência em 8 de outubro de 2025 sem ser convertida em lei. O texto consolidado da Lei nº 9.250/1995 marca as remissões a ela como "Vigência encerrada". Valem as alíquotas progressivas de 15% a 22,5% e o teto mensal.',
    },
    {
      pergunta: 'E as moedas que estão numa corretora estrangeira?',
      resposta:
        'Elas entram no teste do teto, e por isso há campo para elas aqui. Mas o imposto delas segue os arts. 3º e 4º da Lei nº 14.754/2023 desde 1º de janeiro de 2024, como aplicação financeira no exterior — e ali, nas palavras da própria Receita, "não há previsão legal de isenção". Esse cálculo não é feito nesta página.',
    },
  ],

  relacionadas: ['ganho-de-capital-imovel', 'restituicao-irpf', 'irrf', 'carne-leao'],
}
