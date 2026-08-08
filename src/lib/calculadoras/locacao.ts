/**
 * CALC-035 — Rentabilidade de imóvel para locação.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O que ela existe para mostrar é a distância entre dois números**: a
 * rentabilidade bruta, que é a do anúncio, e a líquida, que é a que chega. A
 * memória de cálculo exibe as duas lado a lado justamente porque a diferença
 * entre elas costuma ser de um terço.
 */

import { calcularLocacao } from '../engine/calculadoras/locacao'
import { basisPoints, centavos } from '../engine/types'
import { formatarNumero, formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const iptuAnual = centavos(numero(valores, 'iptuAnual'))
  const manutencaoAnual = centavos(numero(valores, 'manutencaoAnual'))

  const r = calcularLocacao(
    {
      valorDoImovel: centavos(numero(valores, 'valorDoImovel')),
      aluguelMensal: centavos(numero(valores, 'aluguelMensal')),
      taxaAdministracaoBp: basisPoints(numero(valores, 'taxaAdministracao')),
      iptuAnual,
      condominioMensal: centavos(numero(valores, 'condominioMensal')),
      manutencaoAnual,
      mesesVagosPorAno: numero(valores, 'mesesVagos'),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /**
   * Linha de despesa só aparece quando existe.
   *
   * Zero num detalhamento de custos lê-se como "esta despesa não se aplica" e
   * como "esqueci de preencher" — e a segunda leitura é a que faz o usuário
   * desconfiar do total. Ausente, a pergunta não se coloca.
   */
  const despesas: LinhaDetalhamento[] = []
  if (v.custoAdministracao > 0) {
    despesas.push({ rotulo: 'Taxa de administração', valor: v.custoAdministracao, sinal: 'debito' })
  }
  if (iptuAnual > 0) {
    despesas.push({ rotulo: 'IPTU do ano', valor: iptuAnual, sinal: 'debito' })
  }
  if (v.custoCondominioVago > 0) {
    despesas.push({
      rotulo: 'Condomínio nos meses vagos',
      valor: v.custoCondominioVago,
      sinal: 'debito',
    })
  }
  if (manutencaoAnual > 0) {
    despesas.push({ rotulo: 'Manutenção e reparos', valor: manutencaoAnual, sinal: 'debito' })
  }

  const destaques: Destaque[] = [
    { rotulo: 'Média por mês', valor: formatarReal(v.liquidoMensal) },
    { rotulo: 'Rentabilidade líquida ao ano', valor: formatarPercentual(v.rentabilidadeLiquidaAnualBp) },
    { rotulo: 'Rentabilidade bruta ao ano', valor: formatarPercentual(v.rentabilidadeBrutaAnualBp) },
  ]

  if (v.anosParaSePagarCentesimos > 0) {
    destaques.push({
      rotulo: 'Anos de aluguel para pagar o imóvel',
      valor: formatarNumero(v.anosParaSePagarCentesimos),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.liquidoAnual,
      detalhamento: [
        { rotulo: 'Aluguel recebido no ano', valor: v.aluguelRecebidoNoAno, sinal: 'credito' },
        ...despesas,
        { rotulo: 'Sobra em um ano', valor: v.liquidoAnual, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        'A rentabilidade bruta é a do anúncio: doze aluguéis cheios sobre o valor do imóvel. A ' +
          'líquida desconta a taxa da imobiliária, o IPTU, a manutenção e os meses vagos — e é ' +
          'a distância entre as duas que decide se o investimento é o que parecia.',
        'Valorização do imóvel, reajuste do aluguel e inflação ficam de fora. A conta é de renda ' +
          'em um ano, sobre o valor de hoje, e não de retorno total do investimento.',
        'O imposto de renda sobre o aluguel também não entra: ele depende da soma dos seus ' +
          'rendimentos do mês e da tabela progressiva, não do imóvel. Com aluguel acima do ' +
          'limite de isenção, o líquido real fica abaixo do mostrado aqui.',
      ],
    },
  }
}

export const LOCACAO: DefinicaoCalculadora = {
  id: 'CALC-035',
  slug: 'rentabilidade-de-aluguel',
  nome: 'Rentabilidade de imóvel para locação',
  linhaDeContexto: 'Quanto o imóvel rende de verdade — depois da vacância, do IPTU e da taxa.',
  descricaoSeo:
    'Calcule a rentabilidade líquida de um imóvel alugado descontando administração, IPTU, manutenção e vacância. Compare com a do anúncio.',

  campos: [
    {
      id: 'valorDoImovel',
      rotulo: 'Valor do imóvel',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 500_000_000,
      ajuda: 'O quanto ele vale hoje, ou o quanto custou — é sobre esse valor que a rentabilidade é medida.',
    },
    {
      id: 'aluguelMensal',
      rotulo: 'Aluguel mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000,
    },
    {
      id: 'taxaAdministracao',
      rotulo: 'Taxa da imobiliária sobre o aluguel',
      tipo: 'percentual',
      padrao: 1_000,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Dez por cento é o mais comum. Deixe em zero se você mesmo administra.',
    },
    {
      id: 'mesesVagos',
      rotulo: 'Meses vagos por ano',
      tipo: 'inteiro',
      padrao: 1,
      minimo: 0,
      maximo: 11,
      ajuda: 'Entre um inquilino e outro. É o custo que mais some das contas de rentabilidade.',
    },
    {
      id: 'iptuAnual',
      rotulo: 'IPTU do ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'O valor total do carnê, mesmo que você pague parcelado.',
    },
    {
      id: 'condominioMensal',
      rotulo: 'Condomínio mensal',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Só entra na conta nos meses em que o imóvel está vago — alugado, costuma ser do inquilino.',
    },
    {
      id: 'manutencaoAnual',
      rotulo: 'Manutenção e reparos no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Pintura, reparos e o que mais o proprietário custeia entre um contrato e outro.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Sobra do aluguel em um ano',

  calcular,

  faq: [
    {
      pergunta: 'Por que a rentabilidade líquida é tão menor que a do anúncio?',
      resposta:
        'Porque o anúncio divide doze aluguéis cheios pelo valor do imóvel e para por aí. Na prática saem dali a taxa da imobiliária, o IPTU, a manutenção e os meses em que o imóvel fica vago — e nos meses vagos o proprietário ainda paga o condomínio. Somadas, essas quatro coisas costumam consumir perto de um terço do aluguel bruto.',
    },
    {
      pergunta: 'Qual rentabilidade é considerada boa?',
      resposta:
        'Não existe número certo, e desconfie de quem oferece um. O que dá para fazer é comparar: veja quanto o mesmo dinheiro renderia numa aplicação conservadora, líquida de imposto, e ponha ao lado a rentabilidade líquida daqui. O imóvel ainda tem a valorização, que esta conta não estima, e a iliquidez, que a aplicação não tem.',
    },
    {
      pergunta: 'Quantos meses de vacância devo considerar?',
      resposta:
        'Depende do imóvel e da região, e por isso o campo é seu. Um mês por ano é uma premissa conservadora comum para imóvel residencial bem localizado; imóveis maiores ou comerciais costumam demorar mais para alugar. Rode a conta com um valor e com o dobro dele: se o investimento só faz sentido na hipótese otimista, isso em si é a resposta.',
    },
    {
      pergunta: 'O imposto de renda sobre o aluguel entra na conta?',
      resposta:
        'Não. O imposto sobre aluguel recebido de pessoa física depende da soma dos seus rendimentos no mês e da tabela progressiva — é uma conta sobre você, não sobre o imóvel. Se o aluguel ultrapassa o limite de isenção mensal, o líquido real fica abaixo do mostrado aqui, e a calculadora de imposto de renda na fonte ajuda a estimar quanto.',
    },
    {
      pergunta: 'E a valorização do imóvel?',
      resposta:
        'Fica de fora, de propósito. Valorização é expectativa, não dado: projetá-la transformaria uma conta verificável numa previsão, e o número resultante pareceria tão sólido quanto o resto da página sem ter o mesmo lastro. O que está aqui é a renda que o imóvel gera hoje, sobre o valor que ele tem hoje.',
    },
  ],

  relacionadas: ['financiamento-imobiliario', 'capacidade-de-financiamento', 'juros-compostos'],
}
