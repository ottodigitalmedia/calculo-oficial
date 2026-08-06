/**
 * CALC-020 — IR sobre ganho de capital na venda de imóvel.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Os fatores de redução são o que quase nenhuma calculadora do mercado
 * aplica**, e num imóvel dos anos 1990 eles derrubam a base pela metade ou
 * mais. Ignorá-los produz um imposto muito maior que o devido — e errar para
 * mais também é errar.
 *
 * **As isenções são afirmações do usuário, não deduções da página.** Ser o único
 * imóvel, não ter havido outra alienação em cinco anos, pretender reinvestir em
 * 180 dias: são fatos que só ele conhece. A calculadora pergunta e explica o que
 * cada resposta significa.
 */

import { calcularGanhoDeCapital } from '../engine/calculadoras/ganho-de-capital'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { GANHO_DE_CAPITAL as PARAMS } from '../params/data/ganho-de-capital'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(PARAMS)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const valorDeVenda = centavos(numero(valores, 'valorDeVenda'))

  const r = calcularGanhoDeCapital(
    {
      valorDeVenda,
      custoDeAquisicao: centavos(numero(valores, 'custoDeAquisicao')),
      dataDeAquisicao: texto(valores, 'dataDeAquisicao') as DataISO,
      dataDaVenda: texto(valores, 'dataDaVenda') as DataISO,
      imovelUnicoSemAlienacaoRecente: texto(valores, 'imovelUnico') === 'sim',
      reinvestido: centavos(numero(valores, 'reinvestido')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o valor da venda. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Valor da venda', valor: valorDeVenda, sinal: 'credito' },
    { rotulo: 'Imposto sobre o ganho', valor: v.imposto, sinal: 'debito' },
    { rotulo: 'Sobra da venda', valor: v.liquidoDaVenda, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Ganho de capital', valor: formatarReal(v.ganhoBruto) },
  ]

  if (v.isentoPorImovelUnico) {
    destaques.push({ rotulo: 'Situação', valor: 'Isento — imóvel único até o teto' })
  } else {
    if (v.meses1 > 0) {
      destaques.push({
        rotulo: `FR1 — ${v.meses1} meses até novembro de 2005`,
        valor: formatarPercentual(v.fr1Bp),
      })
    }
    if (v.meses2 > 0) {
      destaques.push({
        rotulo: `FR2 — ${v.meses2} meses até a venda`,
        valor: formatarPercentual(v.fr2Bp),
      })
    }
    destaques.push(
      { rotulo: 'Ganho depois dos fatores', valor: formatarReal(v.ganhoReduzido) },
      { rotulo: 'Base tributável', valor: formatarReal(v.baseTributavel) },
      { rotulo: 'O imposto sobre o ganho bruto dá', valor: formatarPercentual(v.aliquotaEfetivaBp) },
    )
    if (v.parcelaIsentaPorReinvestimento > 0) {
      destaques.push({
        rotulo: 'Isento pelo reinvestimento',
        valor: formatarReal(v.parcelaIsentaPorReinvestimento),
      })
    }
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.imposto,
      detalhamento: linhas,
      destaques,
      notas: [
        ...(v.isentoPorImovelUnico
          ? [
              'Pelo que você informou, a venda se enquadra na isenção do imóvel único: ela exige as ' +
                'TRÊS condições ao mesmo tempo — ser o seu único imóvel, o valor de alienação não ' +
                'passar do teto, e não ter havido outra alienação nos cinco anos anteriores. ' +
                'Confira se as três valem no seu caso.',
            ]
          : [
              'Os FATORES DE REDUÇÃO são a parte que quase nenhuma calculadora aplica, e são eles ' +
                'que derrubam a base em imóvel antigo. A lei divide a vida do imóvel em dois ' +
                'trechos, antes e depois de novembro de 2005, com um coeficiente mensal para cada.',
              'O imposto é PROGRESSIVO por faixa: 15% até R$ 5 milhões de ganho, e alíquotas ' +
                'maiores só sobre a parcela que passa de cada limite. Aplicar a alíquota da faixa ' +
                'alcançada ao ganho inteiro cobraria muito a mais.',
            ]),
        ...(v.parcelaIsentaPorReinvestimento > 0
          ? [
              'A isenção por reinvestimento é PROPORCIONAL: aplicar parte do produto da venda ' +
                'isenta a mesma fração do ganho. O prazo é de 180 dias contados do contrato, o ' +
                'imóvel comprado precisa ser residencial e no País, e o benefício vale uma vez a ' +
                'cada cinco anos.',
            ]
          : []),
        ...(v.temReducaoNaoAplicada
          ? [
              'ATENÇÃO: o imóvel foi adquirido antes de 1989, e nesse caso há uma redução ' +
                'adicional, de outra lei, que esta calculadora NÃO aplica. O imposto real tende a ' +
                'ser MENOR que o mostrado aqui — vale procurar um contador antes de recolher.',
            ]
          : []),
        'O custo de aquisição é o que você informou. Benfeitorias comprovadas, corretagem paga na ' +
          'compra e outros valores podem integrá-lo, e cada um tem regra própria de comprovação.',
        'O imposto sobre ganho de capital é recolhido até o último dia útil do mês seguinte ao do ' +
          'recebimento, em apuração própria — ele não entra na tabela mensal do salário.',
      ],
    },
  }
}

export const GANHO_DE_CAPITAL: DefinicaoCalculadora = {
  id: 'CALC-020',
  slug: 'ganho-de-capital-imovel',
  nome: 'IR sobre ganho de capital na venda de imóvel',
  linhaDeContexto: 'Quanto de imposto na venda — com os fatores de redução que quase ninguém aplica.',
  descricaoSeo:
    'Calcule o imposto sobre o ganho de capital na venda do seu imóvel, com os fatores de redução por tempo de posse e as isenções do imóvel único e do reinvestimento.',

  campos: [
    {
      id: 'valorDeVenda',
      rotulo: 'Valor da venda',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000_000,
    },
    {
      id: 'custoDeAquisicao',
      rotulo: 'Custo de aquisição',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000_000_000,
      ajuda: 'O valor pelo qual o imóvel consta na sua declaração, com benfeitorias comprovadas.',
    },
    {
      id: 'dataDeAquisicao',
      rotulo: 'Data da aquisição',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'É ela que define os fatores de redução — quanto mais antigo, menor a base.',
    },
    {
      id: 'dataDaVenda',
      rotulo: 'Data da venda',
      tipo: 'data',
      obrigatorio: true,
    },
    {
      id: 'imovelUnico',
      rotulo: 'É o seu único imóvel, sem outra venda nos últimos cinco anos?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não' },
        { valor: 'sim', rotulo: 'Sim — as duas coisas' },
      ],
      ajuda: 'A isenção do imóvel único exige as duas condições, além do teto de valor.',
    },
    {
      id: 'reinvestido',
      rotulo: 'Quanto será aplicado em outro imóvel residencial',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000_000,
      ajuda: 'Em até 180 dias, em imóvel residencial no País. A isenção é proporcional ao aplicado.',
    },
  ],

  parametrosRequeridos: [
    'ganho-capital-tabela',
    'ganho-capital-isencao-imovel-unico',
    'ganho-capital-fr1-coeficiente',
    'ganho-capital-fr2-coeficiente',
    'ganho-capital-prazo-reinvestimento',
  ],

  rotuloResultado: 'Imposto a pagar',

  calcular,

  faq: [
    {
      pergunta: 'O que são os fatores de redução?',
      resposta:
        'São dois coeficientes que reduzem a base do imposto conforme o tempo que você teve o imóvel, criados em 2005. A lei divide a vida do imóvel em dois trechos — antes e depois de novembro daquele ano — e aplica um coeficiente mensal a cada um. Num imóvel comprado nos anos 1990 eles derrubam a base pela metade ou mais. É a parte que quase nenhuma calculadora do mercado aplica, e quem a ignora chega a um imposto bem maior que o devido.',
    },
    {
      pergunta: 'Quando a venda é isenta?',
      resposta:
        'Há dois caminhos principais. O primeiro é o do imóvel único: se for o único que você possui, o valor da venda não passar do teto legal e você não tiver feito outra alienação nos cinco anos anteriores, o ganho é isento — as três condições valem juntas, não isoladamente. O segundo é o reinvestimento: aplicando o produto da venda na compra de outro imóvel residencial no País, em até 180 dias, o ganho fica isento na proporção do que foi aplicado. Esse segundo benefício só pode ser usado uma vez a cada cinco anos.',
    },
    {
      pergunta: 'Reinvesti só uma parte. Perco a isenção?',
      resposta:
        'Não, ela é proporcional. Aplicando metade do produto da venda em outro imóvel residencial, metade do ganho fica isenta e a outra metade é tributada. É o que a lei chama de tributação proporcional à parcela não aplicada, e é assim que a calculadora faz a conta. Informe no campo quanto pretende aplicar e o resultado mostra a parcela isenta.',
    },
    {
      pergunta: 'A alíquota é 15% sobre tudo?',
      resposta:
        'Só se o ganho não passar de R$ 5 milhões. Acima disso a tributação é progressiva por faixa, com alíquotas maiores incidindo apenas sobre a parcela que excede cada limite — chegando a 22,5% na última faixa. Aplicar a alíquota da faixa alcançada ao ganho inteiro, como se faz por engano, cobra muito a mais. O resultado mostra também quanto o imposto representa sobre o ganho bruto, que é a alíquota que de fato pesa.',
    },
    {
      pergunta: 'Comprei o imóvel antes de 1989. A conta vale?',
      resposta:
        'Vale como piso, e o imposto real tende a ser menor. Para imóveis adquiridos até 1988 existe uma redução adicional, de lei anterior, que esta calculadora não aplica — a lei de 2005 a preservou expressamente. Como não aplicá-la faz o imposto sair maior que o devido, a página avisa na tela quando a data informada é anterior a 1989, e nesse caso vale procurar um contador antes de recolher.',
    },
  ],

  relacionadas: ['custo-de-aquisicao-de-imovel', 'alugar-ou-comprar', 'rentabilidade-de-aluguel'],
}
