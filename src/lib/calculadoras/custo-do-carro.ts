/**
 * CALC-057 — Custo mensal real de ter um carro.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O que ela existe para desmontar é a frase "o carro já está aí mesmo".** O
 * custo que se tem em mente ao dizer isso é o do posto; o que o carro cobra por
 * mês inclui IPVA, seguro, licenciamento, manutenção e perda de valor — que não
 * chegam todo mês, e é por isso que somem da conta.
 *
 * O IPVA tem alíquota estadual e o licenciamento é taxa estadual: `00-catalogo`
 * §14 exclui dado hiperlocal, e os dois entram como valor digitado, tirado do
 * documento que o usuário tem em mãos.
 */

import { calcularCustoDoCarro } from '../engine/calculadoras/veiculos'
import { centavos } from '../engine/types'
import { formatarNumero, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const estacionamentoMensal = centavos(numero(valores, 'estacionamentoMensal'))

  const r = calcularCustoDoCarro(
    {
      kmPorMes: numero(valores, 'kmPorMes'),
      consumo: numero(valores, 'consumo'),
      precoLitro: centavos(numero(valores, 'precoLitro')),
      ipvaAnual: centavos(numero(valores, 'ipvaAnual')),
      seguroAnual: centavos(numero(valores, 'seguroAnual')),
      licenciamentoAnual: centavos(numero(valores, 'licenciamentoAnual')),
      manutencaoAnual: centavos(numero(valores, 'manutencaoAnual')),
      depreciacaoAnual: centavos(numero(valores, 'depreciacaoAnual')),
      estacionamentoMensal,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /**
   * Só entra na coluna o que existe.
   *
   * Zero num detalhamento de custos lê-se tanto como "não se aplica" quanto
   * como "esqueci de preencher", e a segunda leitura é a que faz desconfiar do
   * total. As linhas mensais somam exatamente a última — cada custo anual foi
   * dividido por doze já arredondado, e o total é a soma delas (ver o motor).
   */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Combustível', valor: v.combustivelMensal, sinal: 'debito' },
  ]
  const opcionais: readonly (readonly [string, number])[] = [
    ['IPVA', v.ipvaMensal],
    ['Seguro', v.seguroMensal],
    ['Licenciamento', v.licenciamentoMensal],
    ['Manutenção', v.manutencaoMensal],
    ['Perda de valor do veículo', v.depreciacaoMensal],
    ['Estacionamento', estacionamentoMensal],
  ]
  for (const [rotulo, valor] of opcionais) {
    if (valor > 0) linhas.push({ rotulo, valor: centavos(valor), sinal: 'debito' })
  }
  linhas.push({ rotulo: 'Custo de um mês', valor: v.custoMensal, sinal: 'neutro' })

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.custoMensal,
      detalhamento: linhas,
      destaques: [
        { rotulo: 'Em doze meses', valor: formatarReal(v.custoAnual) },
        { rotulo: 'Por quilômetro rodado', valor: formatarReal(v.custoPorQuilometro) },
        { rotulo: 'Litros por mês', valor: formatarNumero(v.litrosPorMes) },
      ],
      notas: [
        'IPVA, seguro, licenciamento, manutenção e perda de valor foram divididos por doze. É ' +
          'o que permite comparar o carro com qualquer outra despesa mensal — e é justamente ' +
          'por não chegarem todo mês que eles somem da conta de quem estima o custo olhando ' +
          'para o posto.',
        'A perda de valor costuma ser o maior custo de um carro novo e o mais invisível, porque ' +
          'nunca vira boleto. Uma estimativa possível é a diferença entre o preço de tabela do ' +
          'seu modelo hoje e o de um ano atrás.',
        'Financiamento não entra aqui. Se o carro está financiado, a parcela é uma despesa ' +
          'à parte, e a calculadora de amortização mostra o que ela custa em juros.',
      ],
    },
  }
}

export const CUSTO_DO_CARRO: DefinicaoCalculadora = {
  id: 'CALC-057',
  slug: 'custo-mensal-do-carro',
  nome: 'Custo mensal de ter um carro',
  linhaDeContexto: 'Quanto o carro custa por mês de verdade — não só o que sai no posto.',
  descricaoSeo:
    'Some tudo o que um carro custa por mês: combustível, IPVA, seguro, licenciamento, manutenção, estacionamento e perda de valor. Veja o custo por quilômetro rodado.',

  campos: [
    {
      id: 'kmPorMes',
      rotulo: 'Quilômetros rodados por mês',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000,
    },
    {
      id: 'consumo',
      rotulo: 'Consumo do carro, em km/l',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'O consumo real no uso do dia a dia, que costuma ser pior que o de estrada.',
    },
    {
      id: 'precoLitro',
      rotulo: 'Preço do combustível por litro',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000,
    },
    {
      id: 'ipvaAnual',
      rotulo: 'IPVA do ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'O valor do seu carnê. A alíquota varia por estado, então o número é o seu.',
    },
    {
      id: 'seguroAnual',
      rotulo: 'Seguro do ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
    },
    {
      id: 'licenciamentoAnual',
      rotulo: 'Licenciamento do ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000,
    },
    {
      id: 'manutencaoAnual',
      rotulo: 'Manutenção no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Revisões, pneus, óleo e o que mais apareceu nos últimos doze meses.',
    },
    {
      id: 'depreciacaoAnual',
      rotulo: 'Perda de valor no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 50_000_000,
      ajuda: 'Quanto o carro vale hoje a menos do que valia um ano atrás. Costuma ser o maior custo, e o mais invisível.',
    },
    {
      id: 'estacionamentoMensal',
      rotulo: 'Estacionamento por mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000,
      ajuda: 'Vaga alugada, garagem, ou o que você gasta estacionando no mês.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Custo do carro por mês',

  calcular,

  faq: [
    {
      pergunta: 'Por que a perda de valor entra na conta?',
      resposta:
        'Porque ela é dinheiro seu que deixou de existir, mesmo sem nunca virar boleto. Um carro que valia sessenta mil e vale cinquenta e três mil um ano depois custou sete mil naquele ano, e isso aparece no dia em que você o vende. Em carro novo costuma ser o maior item da lista, e é o que mais falta nas contas caseiras.',
    },
    {
      pergunta: 'Como estimo a perda de valor?',
      resposta:
        'A forma mais simples é comparar o preço de tabela do seu modelo e ano hoje com o de doze meses atrás, em qualquer consulta pública de preço médio. Se preferir não estimar, deixe o campo em branco: o resultado então mostra o custo de manter o carro, sem o custo de tê-lo, e a página diz isso.',
    },
    {
      pergunta: 'A parcela do financiamento entra aqui?',
      resposta:
        'Não. A parcela é uma despesa à parte, e misturá-la com o custo de uso confunde duas coisas diferentes: o carro custa o que custa para rodar, financiado ou não. Se o seu está financiado, a calculadora de amortização mostra quanto daquela parcela é juro, e a de quitação antecipada mostra o que se economiza adiantando.',
    },
    {
      pergunta: 'Esse custo por quilômetro serve para comparar com aplicativo?',
      resposta:
        'Serve, e é para isso que ele está no resultado. A comparação honesta usa o custo cheio por quilômetro, não só o do combustível — que é o número que se tem em mente ao dizer que o carro já está aí mesmo. Para trajetos pontuais em que o carro ficaria parado de todo modo, o combustível sozinho já é uma aproximação razoável.',
    },
  ],

  relacionadas: ['custo-de-viagem', 'alcool-ou-gasolina', 'amortizacao-sac-price'],
}
