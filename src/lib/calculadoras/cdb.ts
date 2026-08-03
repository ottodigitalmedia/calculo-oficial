/**
 * CALC-039 — CDB, LCI e LCA: rendimento líquido.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Nenhum motor novo, e nenhuma tabela nova.** O imposto é o de CALC-018, que
 * já tem a tabela regressiva cadastrada em `lib/params/` com vigência e fonte.
 * O que esta calculadora acrescenta é a porta de entrada que o mercado de fato
 * usa: ninguém oferece "um CDB a 15,56% ao ano" — oferece **"110% do CDI"**, e
 * converter isso em rendimento é o atrito que a página remove.
 *
 * O CDI acompanha de perto a taxa básica de juros, e por isso o campo abre
 * sugerido pela Selic corrente (`RF-012`), com a data do dado. É aproximação
 * declarada, não identidade: o texto diz que os dois andam juntos e não são a
 * mesma coisa.
 */

import { calcularRendaFixa } from '../engine/calculadoras/renda-fixa'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { RENDA_FIXA as PARAMS_RENDA_FIXA } from '../params/data/renda-fixa'
import { construirRegistro } from '../params/registry'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

const registro = construirRegistro(PARAMS_RENDA_FIXA)

/** 100% em basis points. */
const BP_INTEIRO = 10_000

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const valorAplicado = centavos(numero(valores, 'valorAplicado'))
  const taxaCdi = numero(valores, 'taxaCdi')
  const percentualDoCdi = numero(valores, 'percentualDoCdi')
  const isenta = texto(valores, 'produto') === 'isento'

  /**
   * "110% do CDI" vira taxa ao ano.
   *
   * Aritmética inteira sobre basis points, arredondada uma vez ao centésimo de
   * ponto — que é a resolução com que a taxa é exibida e conferida. Guardar
   * mais casas aqui daria um resultado que ninguém consegue reproduzir na
   * calculadora do celular.
   */
  const taxaAnual = basisPoints(Math.round((taxaCdi * percentualDoCdi) / BP_INTEIRO))

  const r = calcularRendaFixa(
    {
      valorAplicado,
      taxaAnual,
      prazoMeses: numero(valores, 'prazoMeses'),
      isenta,
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Valor aplicado', valor: v.valorAplicado, sinal: 'neutro' },
    { rotulo: 'Rendimento bruto', valor: v.rendimentoBruto, sinal: 'credito' },
  ]
  if (v.imposto > 0) {
    linhas.push({ rotulo: 'Imposto de renda', valor: v.imposto, sinal: 'debito' })
  }
  linhas.push({ rotulo: 'Valor líquido no resgate', valor: v.montanteLiquido, sinal: 'neutro' })

  const destaques: Destaque[] = [
    { rotulo: 'Taxa efetiva ao ano', valor: formatarPercentual(taxaAnual) },
    { rotulo: 'Rendimento líquido', valor: formatarReal(v.rendimentoLiquido) },
    { rotulo: 'Rentabilidade líquida no período', valor: formatarPercentual(v.rentabilidadeLiquidaBp) },
  ]

  if (v.imposto > 0) {
    destaques.push({ rotulo: 'Alíquota aplicada', valor: formatarPercentual(v.aliquota) })
    if (v.economiaNaProximaFaixa > 0) {
      destaques.push({
        rotulo: `Esperando mais ${v.diasParaProximaFaixa} dias, o imposto cai`,
        valor: formatarReal(v.economiaNaProximaFaixa),
      })
    }
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.montanteLiquido,
      detalhamento: linhas,
      destaques,
      notas: [
        'O CDI acompanha de perto a taxa básica de juros, mas não é a mesma coisa: costuma ' +
          'ficar um pouco abaixo dela. O campo abre com a Selic do último mês publicado, com a ' +
          'data ao lado, e é editável — se você tem o CDI do período, use-o.',
        'A taxa contratada não é o que você recebe. Em produto tributado, o imposto cai sobre o ' +
          'rendimento conforme o prazo, e é por isso que a comparação honesta entre aplicações ' +
          'usa o valor LÍQUIDO, e não o percentual do CDI.',
        'Produto isento rende menos por ponto de CDI e costuma entregar mais no fim. Medido com ' +
          'CDI a 10% ao ano, um isento a 95% supera um tributado a 105% em TODO prazo até cerca ' +
          'de dez anos — a vantagem começa pequena e cresce. O tributado só passa à frente em ' +
          'horizontes bem mais longos, quando a alíquota mínima já vigora há muito tempo e a ' +
          'diferença de taxa se acumula. Rode os dois com o seu prazo.',
        'O resultado supõe o dinheiro parado até o resgate, sem aportes e sem saques. Aplicações ' +
          'pós-fixadas acompanham um índice que muda ao longo do tempo, então o valor real ' +
          'depende do caminho da taxa, e não só do ponto de partida.',
      ],
    },
  }
}

export const CDB: DefinicaoCalculadora = {
  id: 'CALC-039',
  slug: 'cdb-lci-lca',
  nome: 'CDB, LCI e LCA — rendimento líquido',
  linhaDeContexto: 'Quanto sobra de "110% do CDI" depois do imposto — e quando o isento ganha.',
  descricaoSeo:
    'Converta o percentual do CDI em rendimento e veja quanto sobra depois do imposto de renda, com a alíquota que o prazo determina. Compare produto tributado e isento.',

  campos: [
    {
      id: 'valorAplicado',
      rotulo: 'Valor aplicado',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'percentualDoCdi',
      rotulo: 'Percentual do CDI',
      tipo: 'percentual',
      obrigatorio: true,
      padrao: 10_000,
      minimo: 1,
      maximo: 30_000,
      ajuda: 'É como o produto é oferecido: "110% do CDI" são 110,00%.',
    },
    {
      id: 'taxaCdi',
      rotulo: 'CDI ao ano',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'Abre com a Selic do último mês publicado. O CDI anda junto dela, e costuma ficar um pouco abaixo.',
    },
    {
      id: 'produto',
      rotulo: 'Tipo de produto',
      tipo: 'selecao',
      padrao: 'tributado',
      opcoes: [
        { valor: 'tributado', rotulo: 'Com imposto — CDB, Tesouro, debênture comum' },
        { valor: 'isento', rotulo: 'Isento de imposto — LCI, LCA, CRI, CRA' },
      ],
      ajuda: 'Confirme na lâmina do produto: é ela que diz o tratamento tributário.',
    },
    {
      id: 'prazoMeses',
      rotulo: 'Prazo em meses',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 12,
      minimo: 1,
      maximo: 600,
      ajuda: 'É o prazo que define a alíquota do imposto, e ele cai em degraus.',
    },
  ],

  /**
   * A tabela regressiva vem de `lib/params/` — os mesmos quatro de CALC-018.
   *
   * A lista precisa ser a mesma: é dela que saem os anos disponíveis e o
   * intervalo de cobertura que a tela exibe. Declarar menos daria uma cobertura
   * mais larga que a real.
   */
  parametrosRequeridos: [
    'ir-renda-fixa-faixa-1',
    'ir-renda-fixa-faixa-4',
    'ir-renda-fixa-limite-1',
    'ir-renda-fixa-limite-3',
  ],

  /** `RF-012` — o CDI abre sugerido pela Selic corrente, com a data do dado. */
  sugestaoDeSerie: { campo: 'taxaCdi', serie: 'selic-ao-ano' },

  rotuloResultado: 'Valor líquido no resgate',

  calcular,

  faq: [
    {
      pergunta: 'O que significa "110% do CDI"?',
      resposta:
        'Que o produto paga 110% do que o CDI render no período. Se o CDI ficar em 14% ao ano, o título rende 15,4% ao ano. O percentual sozinho não diz quanto você ganha: falta saber o CDI do período e, se o produto for tributado, quanto o imposto leva. É essa conta que a página faz.',
    },
    {
      pergunta: 'CDI e Selic são a mesma coisa?',
      resposta:
        'São próximos e não são iguais. O CDI é a taxa das operações entre bancos e costuma ficar um pouco abaixo da Selic, acompanhando os movimentos dela. O campo abre com a Selic do último mês publicado porque é o dado oficial disponível, com a data ao lado — se você tem o CDI efetivo do período, troque.',
    },
    {
      pergunta: 'Isento a 95% do CDI é melhor que tributado a 110%?',
      resposta:
        'Nesse par específico, e com CDI a 10% ao ano, o isento ganha em todo prazo até cerca de dez anos — e a vantagem dele CRESCE ao longo desse intervalo, em vez de encolher. A intuição comum diz o contrário, porque a alíquota do imposto cai com o tempo; o que ela esquece é que o valor sobre o qual o imposto incide cresce mais rápido. O tributado só passa à frente em horizontes bem mais longos. Rode os dois aqui com o seu prazo e o seu CDI: a resposta muda conforme a distância entre os dois percentuais.',
    },
    {
      pergunta: 'Por que o prazo muda o imposto?',
      resposta:
        'Porque a tabela é regressiva: a alíquota cai conforme o dinheiro fica aplicado, em degraus por faixa de dias. Resgatar poucos dias antes de um degrau custa caro sem necessidade — e o resultado mostra quanto você economizaria esperando até a faixa seguinte, quando ela existir.',
    },
    {
      pergunta: 'Esse valor é garantido?',
      resposta:
        'É uma estimativa a partir dos números que você informou. Produtos pós-fixados acompanham o CDI, que muda ao longo do tempo — então o rendimento real depende do caminho da taxa, e não só do ponto de partida. A conta também supõe o dinheiro parado até o resgate, sem aportes nem saques no meio.',
    },
  ],

  relacionadas: ['ir-renda-fixa', 'quanto-rende-por-mes', 'rendimento-da-poupanca'],
}
