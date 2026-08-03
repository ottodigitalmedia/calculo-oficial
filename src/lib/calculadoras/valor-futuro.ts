/**
 * CALC-064 — Valor futuro corrigido: projeção por inflação.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **É a primeira do catálogo que projeta, e o texto muda por causa disso.** Não
 * existe fonte para o futuro: a inflação é premissa do usuário, e a página diz
 * isso em vez de deixar o número parecer medição. O que a série entrega é uma
 * **referência** — quanto o índice de fato acumulou nos últimos doze meses —,
 * exibida ao lado da premissa para dar lastro à escolha sem transformá-la em
 * previsão do produto.
 */

import { projetarValorFuturo } from '../engine/calculadoras/projecao'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  acumuladoDosUltimos,
  indiceEscolhido,
  OPCOES_DE_INDICE,
  ultimoMesDoIndice,
} from './indices-comuns'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

const MESES_DE_REFERENCIA = 12

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const valorHoje = centavos(numero(valores, 'valorHoje'))

  const r = projetarValorFuturo(
    {
      valorHoje,
      inflacaoAnualBp: basisPoints(numero(valores, 'inflacaoAnual')),
      anos: numero(valores, 'anos'),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores
  const chave = texto(valores, 'indiceDeReferencia')
  const acumulado = acumuladoDosUltimos(chave, MESES_DE_REFERENCIA)
  const ultimoMes = ultimoMesDoIndice(chave)

  const destaques: Destaque[] = [
    { rotulo: 'Inflação acumulada no período', valor: formatarPercentual(v.inflacaoAcumuladaBp) },
    { rotulo: 'Perda de poder de compra', valor: formatarPercentual(v.perdaDePoderBp) },
    {
      rotulo: 'Guardando parado, comprará',
      valor: formatarReal(v.poderDeCompraFuturo),
    },
  ]

  /**
   * A referência entra só quando existe.
   *
   * Sem série em cache o destaque simplesmente não aparece — nunca uma mensagem
   * de erro por causa de indicador (`06-api-spec` §4.2).
   */
  if (acumulado !== null && ultimoMes !== null) {
    destaques.push({
      rotulo: `${indiceEscolhido(chave).nome} nos últimos 12 meses, até ${ultimoMes}`,
      valor: formatarPercentual(acumulado),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorFuturoEquivalente,
      detalhamento: [
        { rotulo: 'Valor de hoje', valor: valorHoje, sinal: 'neutro' },
        {
          rotulo: 'O que a inflação projetada acrescenta',
          valor: centavos(v.valorFuturoEquivalente - valorHoje),
          sinal: 'credito',
        },
        {
          rotulo: 'Equivalente lá na frente',
          valor: v.valorFuturoEquivalente,
          sinal: 'neutro',
        },
      ],
      destaques,
      notas: [
        'A inflação usada é a que VOCÊ projetou, e não uma previsão desta calculadora. Ninguém ' +
          'sabe a inflação futura. O acumulado dos últimos doze meses aparece ao lado apenas ' +
          'como referência para a escolha.',
        'Inflação se acumula de forma composta: a de cada ano incide sobre preços já corrigidos ' +
          'pelos anteriores. Multiplicar a taxa anual pelo número de anos subestima, e a ' +
          'diferença cresce rápido em prazos longos.',
        'São dois números diferentes no resultado. O principal diz quanto seria preciso TER lá ' +
          'na frente para comprar o mesmo. O destaque diz o que a quantia de hoje COMPRARÁ, se ' +
          'ficar parada — e é sempre menor.',
        'Rendimento não entra. Dinheiro aplicado rende e compensa parte disso; a calculadora de ' +
          'juros compostos mostra quanto, e vale rodar as duas juntas.',
      ],
    },
  }
}

export const VALOR_FUTURO: DefinicaoCalculadora = {
  id: 'CALC-064',
  slug: 'valor-futuro-corrigido',
  nome: 'Valor futuro corrigido pela inflação',
  linhaDeContexto: 'Quanto será preciso ter lá na frente — e o que o dinheiro parado comprará.',
  descricaoSeo:
    'Projete quanto um valor de hoje precisará ser no futuro para manter o poder de compra, pela inflação anual que você estimar, com o acumulado recente como referência.',

  campos: [
    {
      id: 'valorHoje',
      rotulo: 'Valor de hoje',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'inflacaoAnual',
      rotulo: 'Inflação anual projetada',
      tipo: 'percentual',
      obrigatorio: true,
      padrao: 450,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'É a sua premissa, não uma previsão nossa. O acumulado recente do índice aparece no resultado, como referência.',
    },
    {
      id: 'anos',
      rotulo: 'Daqui a quantos anos',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 10,
      minimo: 1,
      maximo: 60,
    },
    {
      id: 'indiceDeReferencia',
      rotulo: 'Índice de referência',
      tipo: 'selecao',
      padrao: 'ipca',
      opcoes: OPCOES_DE_INDICE,
      ajuda: 'Serve só para mostrar quanto esse índice acumulou nos últimos doze meses. Não muda a projeção.',
    },
  ],

  // Série econômica NÃO é parâmetro legal — `ADR-006`.
  parametrosRequeridos: [],

  rotuloResultado: 'Equivalente lá na frente',

  calcular,

  faq: [
    {
      pergunta: 'Vocês estão prevendo a inflação?',
      resposta:
        'Não, e nenhuma calculadora deveria. A taxa usada é a que você informa, e o resultado é aritmética sobre essa premissa. O que a página mostra da série oficial é o quanto o índice acumulou nos últimos doze meses — um dado do passado, exibido com a data, para ajudar você a escolher uma premissa razoável. Projeção é sua; medição é nossa.',
    },
    {
      pergunta: 'Por que não multiplico a inflação anual pelo número de anos?',
      resposta:
        'Porque ela se acumula de forma composta: a inflação de cada ano incide sobre preços que já subiram nos anos anteriores. Dez anos a 4,5% não somam 45%, dão 55,3%. Em prazos longos a diferença entre multiplicar e compor fica grande, e sempre para o mesmo lado — quem multiplica subestima o que vai precisar.',
    },
    {
      pergunta: 'Qual dos dois números do resultado eu uso?',
      resposta:
        'Depende da pergunta. O resultado principal responde quanto será preciso TER lá na frente para comprar o que aquele valor compra hoje — é o número para planejar uma meta. O destaque responde o que a mesma quantia COMPRARÁ se ficar parada — é o número que mostra o custo de não investir. Os dois saem do mesmo fator.',
    },
    {
      pergunta: 'E se eu investir o dinheiro?',
      resposta:
        'Aí a inflação é compensada, em parte ou no todo, pelo rendimento — e esta conta não considera isso. A calculadora de juros compostos projeta o montante de quem aplica, e a de quanto rende por mês mostra a renda de quem só retira. Rodando as duas com o mesmo prazo dá para ver se o rendimento esperado supera a inflação projetada, que é a comparação que importa.',
    },
  ],

  relacionadas: ['poder-de-compra', 'juros-compostos', 'independencia-financeira'],
}
