/**
 * CALC-059 — Depreciação de veículo.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **`docs/18` §8 registrava a dúvida sobre se esta calculadora deveria
 * existir**, e a razão era boa: sem a tabela FIPE, que tem licenciamento
 * restrito, o caminho fácil seria pedir ao usuário a taxa de depreciação — ou
 * seja, pedir a resposta.
 *
 * A saída é não pedir. Ela pergunta o que o dono do carro tem: quanto pagou,
 * quanto o carro vale hoje — consulta pública e gratuita na FIPE — e há quanto
 * tempo. Desses três sai a taxa REAL daquele carro, que vale mais que qualquer
 * média de mercado, e com ela a projeção.
 *
 * **O número que a página existe para mostrar é a perda por mês.** Ela costuma
 * ser maior que o combustível e não tem boleto — é o custo que ninguém soma.
 */

import { calcularDepreciacao } from '../engine/calculadoras/veiculos'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const anos = numero(valores, 'anosDeProjecao')

  const r = calcularDepreciacao(
    {
      valorDeCompra: centavos(numero(valores, 'valorDeCompra')),
      valorHoje: centavos(numero(valores, 'valorHoje')),
      mesesDePosse: numero(valores, 'mesesDePosse'),
      anosDeProjecao: anos,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Perda por mês', valor: formatarReal(v.perdaPorMes) },
    { rotulo: 'Do valor de compra, já se foram', valor: formatarPercentual(v.perdaPercentualBp) },
  ]

  if (!v.valorizou) {
    destaques.push(
      { rotulo: 'Taxa de depreciação ao ano', valor: formatarPercentual(v.taxaAnualBp) },
      {
        rotulo: `Valor projetado em ${anos} ${anos === 1 ? 'ano' : 'anos'}`,
        valor: formatarReal(v.valorProjetado),
      },
    )
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.perdaAcumulada,
      /**
       * Vazia: perda acumulada, perda mensal e valor projetado não são parcelas
       * de uma soma. A decomposição que existe é a da projeção, e ela está na
       * tabela, ano a ano.
       */
      detalhamento: [],
      destaques,
      ...(v.valorizou
        ? {}
        : {
            tabela: {
              titulo: 'Se continuar caindo no mesmo ritmo',
              colunas: ['Valor do carro', 'Perda no ano'],
              linhas: v.projecao.map((p) => ({
                rotulo: `Daqui a ${p.ano} ${p.ano === 1 ? 'ano' : 'anos'}`,
                valores: [p.valor, p.perdaNoAno],
              })),
            },
          }),
      notas: [
        'A taxa sai do SEU carro, não de uma média de mercado: é a que leva do valor que você ' +
          'pagou ao valor que ele tem hoje. É por isso que a calculadora pede os dois — pedir a ' +
          'taxa de depreciação seria pedir a resposta.',
        'O valor de hoje pode ser consultado de graça na tabela FIPE, pela marca, modelo e ano ' +
          'do seu carro. Anúncios de veículos iguais ao seu servem de conferência: a FIPE é ' +
          'referência de mercado, e o preço real de venda costuma ficar por perto.',
        'A perda por mês é o custo que não tem boleto, e é ele que a maioria esquece ao somar o ' +
          'custo de ter um carro. Some-o ao combustível, ao seguro e ao IPVA para ver o número ' +
          'inteiro.',
        'Depreciação é COMPOSTA: incide sobre o valor que sobrou, não sobre o de compra. Por isso ' +
          'a perda em reais diminui a cada ano, mesmo com a taxa constante — o primeiro ano é ' +
          'sempre o mais caro.',
        'A projeção supõe que o ritmo continua. Ela ignora o que o mercado faz: modelo ' +
          'descontinuado, recall, câmbio e escassez de peças mexem na curva, às vezes muito.',
        ...(v.valorizou
          ? [
              'Pelos valores informados o carro não perdeu valor. Acontece com modelo raro, com ' +
                'compra abaixo do mercado e em período de escassez — e nesse caso não há taxa de ' +
                'depreciação a projetar.',
            ]
          : []),
      ],
    },
  }
}

export const DEPRECIACAO_DE_VEICULO: DefinicaoCalculadora = {
  id: 'CALC-059',
  slug: 'depreciacao-de-veiculo',
  nome: 'Depreciação de veículo',
  linhaDeContexto: 'Quanto o carro perde por mês — o custo que não tem boleto — e quanto valerá.',
  descricaoSeo:
    'Descubra quanto seu carro já perdeu de valor, qual a taxa real de depreciação dele por ano e quanto ele deve valer daqui a alguns anos.',

  campos: [
    {
      id: 'valorDeCompra',
      rotulo: 'Quanto você pagou no carro',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'valorHoje',
      rotulo: 'Quanto ele vale hoje',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
      ajuda: 'A consulta na tabela FIPE é gratuita, pela marca, modelo e ano do veículo.',
    },
    {
      id: 'mesesDePosse',
      rotulo: 'Há quantos meses o carro é seu',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 24,
      minimo: 1,
      maximo: 600,
      ajuda: 'É esse prazo que transforma a perda total na taxa por ano.',
    },
    {
      id: 'anosDeProjecao',
      rotulo: 'Projetar para quantos anos à frente',
      tipo: 'inteiro',
      padrao: 5,
      minimo: 1,
      maximo: 20,
    },
  ],

  // Sem parâmetro legal: preço de compra e valor de mercado são do usuário.
  parametrosRequeridos: [],

  rotuloResultado: 'Quanto o carro já perdeu',

  calcular,

  faq: [
    {
      pergunta: 'Por que a calculadora não sabe quanto meu carro vale?',
      resposta:
        'Porque a tabela FIPE tem licenciamento restrito e este produto não copia tabela de terceiro. Mas a consulta na própria FIPE é pública e gratuita: informe marca, modelo e ano e você tem o valor em segundos. Com ele e o que você pagou, a calculadora descobre a taxa real de depreciação do seu carro — que é melhor do que qualquer média de mercado, porque é a dele.',
    },
    {
      pergunta: 'Quanto um carro perde por ano, em média?',
      resposta:
        'A pergunta tem muitas respostas e nenhuma serve para o seu caso: depende de marca, modelo, ano, quilometragem, estado de conservação e do que o mercado está fazendo. Por isso esta página não publica uma média — ela calcula a taxa do seu carro a partir do que aconteceu com ele. Se você acabou de comprar e ainda não tem histórico, não há taxa a descobrir, e essa é uma limitação honesta da conta.',
    },
    {
      pergunta: 'Por que a perda em reais diminui a cada ano?',
      resposta:
        'Porque a depreciação é composta: a taxa incide sobre o valor que sobrou, não sobre o preço de compra. Um carro de R$ 100 mil perdendo 15% ao ano perde R$ 15 mil no primeiro ano e cerca de R$ 12,7 mil no segundo, sobre os R$ 85 mil que restaram. É por isso que o primeiro ano é sempre o mais caro, e por isso comprar seminovo muda tanto a conta.',
    },
    {
      pergunta: 'Por que somar a depreciação ao custo do carro?',
      resposta:
        'Porque ela é dinheiro que saiu, mesmo sem sair da conta corrente. Um carro que perde R$ 700 por mês custa isso todo mês, além de combustível, seguro, IPVA e manutenção — e você só percebe na hora de vender. É a maior despesa invisível de ter um carro, e a que mais distorce a comparação com alugar, com aplicativo ou com transporte público.',
    },
    {
      pergunta: 'A projeção é confiável?',
      resposta:
        'Ela é uma extrapolação, e vale o que vale uma extrapolação: supõe que o carro continua perdendo valor no mesmo ritmo dos últimos meses. O mercado não coopera com isso. Modelo descontinuado, recall, escassez de peças e variação do câmbio mudam a curva, às vezes muito, e a pandemia mostrou que carro usado pode até valorizar. Use o número como ordem de grandeza, não como previsão.',
    },
  ],

  relacionadas: ['custo-mensal-do-carro', 'eletrico-ou-combustao', 'custo-de-viagem'],
}
