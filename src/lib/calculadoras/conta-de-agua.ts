/**
 * CALC-067 — Conta de água.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **As faixas de tarifa são campo do usuário, e isso é premissa do catálogo**
 * (§14): tarifa de água varia por concessionária, por município e por categoria
 * de imóvel, e o produto não estima tarifa por região. O que a página faz é o
 * que a fatura não faz — mostrar a conta.
 *
 * **A calculadora existe porque a tarifa é progressiva.** Consumo × tarifa é a
 * conta que a maioria faz, e ela erra sempre para menos. E o número que muda
 * comportamento não é o custo médio: é quanto custa o PRÓXIMO metro cúbico, que
 * é o que a economia devolve.
 */

import { calcularContaDeAgua } from '../engine/calculadoras/consumo'
import { basisPoints, centavos } from '../engine/types'
import { formatarNumero, formatarReal } from '../format/moeda'
import {
  lerLista,
  numero,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const taxaFixa = centavos(numero(valores, 'taxaFixa'))

  const r = calcularContaDeAgua(
    {
      faixas: lerLista(valores, 'faixas', 2),
      consumo: numero(valores, 'consumo'),
      consumoMinimo: numero(valores, 'consumoMinimo'),
      esgotoBp: basisPoints(numero(valores, 'esgoto')),
      taxaFixa,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o total exibido. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Água', valor: v.agua, sinal: 'neutro' },
  ]
  if (v.esgoto > 0) {
    linhas.push({ rotulo: 'Esgoto', valor: v.esgoto, sinal: 'neutro' })
  }
  if (taxaFixa > 0) {
    linhas.push({ rotulo: 'Taxa fixa', valor: taxaFixa, sinal: 'neutro' })
  }
  linhas.push({ rotulo: 'Total da conta', valor: v.total, sinal: 'neutro' })

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.total,
      detalhamento: linhas,
      destaques: [
        {
          rotulo: 'Consumo faturado',
          valor: `${formatarNumero(v.consumoFaturado)} m³`,
        },
        { rotulo: 'Custo médio por m³', valor: formatarReal(v.custoMedioPorM3) },
        { rotulo: 'Quanto custa o próximo m³', valor: formatarReal(v.custoDoProximoM3) },
        { rotulo: 'Custo por dia', valor: formatarReal(v.custoPorDia) },
      ],
      tabela: {
        titulo: 'A conta, faixa a faixa',
        colunas: ['Metros cúbicos', 'Tarifa por m³', 'Valor'],
        linhas: v.faixasAplicadas.map((f) => ({
          rotulo: f.rotulo,
          valores: [centavos(f.volume), f.tarifa, f.valor],
        })),
      },
      notas: [
        'A tarifa é PROGRESSIVA: cada metro cúbico é cobrado pelo preço da faixa em que ele cai, ' +
          'e não pelo preço da faixa mais alta que você alcançou. Multiplicar o consumo inteiro ' +
          'pela tarifa da última faixa cobra a mais — e é a conta que a maioria faz.',
        'Compare o custo médio com o custo do PRÓXIMO metro cúbico. É o segundo que a economia ' +
          'devolve: reduzir um m³ deixa de pagar o preço da faixa mais alta, não o preço médio.',
        'As faixas, o percentual de esgoto e a taxa fixa estão na sua fatura — normalmente no ' +
          'verso ou no detalhamento. Eles mudam por concessionária, por município e por ' +
          'categoria de imóvel, e por isso não vêm preenchidos.',
        'O esgoto quase nunca é medido: cobra-se um percentual sobre a água, presumindo que o ' +
          'que entra sai. Onde não há rede coletora, esse percentual costuma ser zero.',
        'O mês aqui é de trinta dias, por convenção, para o custo diário ser comparável com as ' +
          'outras despesas da casa.',
      ],
    },
  }
}

export const CONTA_DE_AGUA: DefinicaoCalculadora = {
  id: 'CALC-067',
  slug: 'conta-de-agua',
  nome: 'Conta de água',
  linhaDeContexto: 'Quanto a água custa com a tarifa progressiva — e quanto custa o próximo m³.',
  descricaoSeo:
    'Calcule a conta de água com a tarifa progressiva por faixa da sua concessionária, o esgoto e a taxa fixa. Veja quanto custa cada metro cúbico a mais.',

  campos: [
    {
      id: 'consumo',
      rotulo: 'Consumo do mês, em m³',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000,
      ajuda:
        'Está na fatura. Para antecipar a conta, é a leitura de hoje do hidrômetro menos a do mês passado.',
    },
    {
      id: 'faixas',
      rotulo: 'Faixas de tarifa da sua concessionária',
      tipo: 'lista',
      obrigatorio: true,
      colunas: [
        { id: 'limite', rotulo: 'Até quantos m³', tipo: 'decimal', maximo: 1_000_000 },
        { id: 'tarifa', rotulo: 'R$ por m³', tipo: 'monetario', maximo: 1_000_000 },
      ],
      linhasIniciais: 4,
      maximoDeLinhas: 10,
      ajuda:
        'Uma linha por faixa, da menor para a maior. A ÚLTIMA linha vale para todo consumo acima da faixa anterior — o limite dela é ignorado.',
    },
    {
      id: 'esgoto',
      rotulo: 'Esgoto, como percentual da água',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 20_000,
      ajuda: 'Está na fatura. Costuma ser 80% ou 100%. Deixe em zero onde não há rede coletora.',
    },
    {
      id: 'consumoMinimo',
      rotulo: 'Consumo mínimo faturado, em m³',
      tipo: 'decimal',
      padrao: 0,
      minimo: 0,
      maximo: 100_000,
      ajuda: 'Muitas concessionárias cobram um mínimo mesmo de quem consome menos. Zero se não houver.',
    },
    {
      id: 'taxaFixa',
      rotulo: 'Taxa fixa da fatura',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Disponibilidade, cadastro ou qualquer valor cobrado independentemente do consumo.',
    },
  ],

  // Sem parâmetro legal: a tarifa é da concessionária, e §14 do catálogo é
  // explícito — o produto não estima tarifa por região.
  parametrosRequeridos: [],

  rotuloResultado: 'Total da conta de água',

  calcular,

  faq: [
    {
      pergunta: 'Por que a conta não é o consumo vezes a tarifa?',
      resposta:
        'Porque a tarifa é progressiva, como o Imposto de Renda. Quem consome 25 m³ não paga 25 vezes o preço da primeira faixa nem 25 vezes o da última: paga cada metro cúbico pelo preço da faixa em que ele caiu. A conta de cabeça — consumo × tarifa da faixa alcançada — cobra a mais, e a diferença cresce com o consumo. A tabela do resultado mostra faixa por faixa.',
    },
    {
      pergunta: 'Onde encontro as faixas de tarifa da minha cidade?',
      resposta:
        'Na fatura, normalmente no verso ou no detalhamento, e no site da concessionária, que é obrigada a publicar a tabela vigente. Preste atenção na categoria: residencial, comercial e social têm tabelas diferentes, e usar a errada muda o resultado inteiro. Esta calculadora não traz tarifas preenchidas de propósito — elas mudam por município e por concessionária, e um número errado com aparência de certo é o pior resultado possível.',
    },
    {
      pergunta: 'Por que a conta não zera quando viajo o mês inteiro?',
      resposta:
        'Porque a maioria das concessionárias cobra um consumo mínimo faturado, normalmente na casa dos 10 m³, mesmo de quem consumiu menos. É o campo "consumo mínimo faturado". Se você informá-lo, o cálculo usa o maior entre ele e o seu consumo real, que é o que a fatura faz.',
    },
    {
      pergunta: 'Por que pago esgoto se não sei quanto esgoto produzo?',
      resposta:
        'Porque ele não é medido: cobra-se um percentual sobre o valor da água, presumindo que o que entra na casa sai pela rede. O percentual varia — 80% e 100% são os mais comuns — e está na sua fatura. Onde não há rede coletora, ele costuma ser zero, e nesse caso deixe o campo zerado.',
    },
    {
      pergunta: 'Quanto eu economizo reduzindo o consumo?',
      resposta:
        'Mais do que o custo médio sugere. Numa tarifa progressiva, o metro cúbico que você deixa de consumir é sempre o mais caro — o da faixa mais alta que você alcançou —, e sobre ele ainda incide o esgoto. Por isso o resultado mostra os dois números separados: o custo médio por m³, que serve para entender a conta, e o custo do próximo m³, que é o que a economia devolve.',
    },
  ],

  relacionadas: ['consumo-de-energia', 'orcamento-domestico', 'custo-do-botijao-de-gas'],
}
