/**
 * CALC-054 — Álcool ou gasolina: qual compensa.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A calculadora existe para desmentir uma regra de bolso.** A "regra dos 70%"
 * é uma média de rendimento entre os dois combustíveis, não uma norma — e ela
 * erra em todo carro cujo rendimento foge da média. Aqui o consumo real é
 * entrada obrigatória, e o preço de equilíbrio calculado a partir dele é a régua
 * que substitui a regra decorada.
 */

import { calcularCombustivel } from '../engine/calculadoras/aritmetica'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const NOME_DO_COMBUSTIVEL = {
  alcool: 'Álcool',
  gasolina: 'Gasolina',
  empate: 'Empate',
} as const

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularCombustivel(
    {
      precoAlcool: centavos(numero(valores, 'precoAlcool')),
      precoGasolina: centavos(numero(valores, 'precoGasolina')),
      consumoAlcool: numero(valores, 'consumoAlcool'),
      consumoGasolina: numero(valores, 'consumoGasolina'),
      distancia: numero(valores, 'distancia'),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores
  const distancia = numero(valores, 'distancia')

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.economia,
      detalhamento: [
        { rotulo: `Com álcool, em ${distancia} km`, valor: v.custoAlcool, sinal: 'debito' },
        { rotulo: `Com gasolina, em ${distancia} km`, valor: v.custoGasolina, sinal: 'debito' },
        { rotulo: 'Diferença', valor: v.economia, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Compensa abastecer com', valor: NOME_DO_COMBUSTIVEL[v.maisEconomico] },
        { rotulo: 'Preço de equilíbrio do álcool', valor: formatarReal(v.precoEquilibrioAlcool) },
        { rotulo: 'Rendimento do álcool sobre o da gasolina', valor: formatarPercentual(v.razaoConsumoBp) },
        { rotulo: 'Custo a cada 100 km com álcool', valor: formatarReal(v.custoCemKmAlcool) },
        { rotulo: 'Custo a cada 100 km com gasolina', valor: formatarReal(v.custoCemKmGasolina) },
      ],
      notas: [
        'A regra dos 70% não é lei nem norma técnica: é a razão MÉDIA entre o rendimento dos ' +
          'dois combustíveis, e ela varia de carro para carro. O preço de equilíbrio acima é a ' +
          'mesma régua calculada com o consumo do SEU veículo — é ele que decide, não a média.',
        'Para medir o próprio consumo, encha o tanque, zere o hodômetro parcial e anote quantos ' +
          'quilômetros rodou até o próximo abastecimento completo; divida pelos litros da ' +
          'segunda bomba. Repita com o outro combustível, no mesmo tipo de trajeto.',
      ],
    },
  }
}

export const COMBUSTIVEL: DefinicaoCalculadora = {
  id: 'CALC-054',
  slug: 'alcool-ou-gasolina',
  nome: 'Álcool ou gasolina',
  linhaDeContexto:
    'Qual compensa no seu carro — pelo consumo real, não pela regra dos 70%.',
  descricaoSeo:
    'Descubra se compensa abastecer com álcool ou gasolina pelo consumo real do seu carro. Veja o custo a cada 100 km e o preço de equilíbrio do etanol.',

  campos: [
    {
      id: 'precoAlcool',
      rotulo: 'Preço do álcool por litro',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000,
    },
    {
      id: 'precoGasolina',
      rotulo: 'Preço da gasolina por litro',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000,
    },
    {
      id: 'consumoAlcool',
      rotulo: 'Consumo com álcool, em km/l',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'Quantos quilômetros o carro faz com um litro de etanol.',
    },
    {
      id: 'consumoGasolina',
      rotulo: 'Consumo com gasolina, em km/l',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
    },
    {
      id: 'distancia',
      rotulo: 'Percurso considerado, em km',
      tipo: 'inteiro',
      padrao: 1_000,
      minimo: 1,
      maximo: 100_000,
      ajuda: 'Serve só para dimensionar a diferença. Ela é proporcional ao percurso.',
    },
  ],

  parametrosRequeridos: [],

  rotuloResultado: 'Diferença no percurso',

  calcular,

  faq: [
    {
      pergunta: 'A regra dos 70% não resolve?',
      resposta:
        'Resolve por aproximação, e erra sempre que o carro foge da média. A regra vem da razão típica de rendimento entre etanol e gasolina, que gira em torno de 70% — mas há veículos em que o etanol rende 65% e outros em que passa de 75%. Nessa faixa, a regra manda abastecer com o combustível errado em boa parte dos preços praticados.',
    },
    {
      pergunta: 'O que é o preço de equilíbrio?',
      resposta:
        'É o preço do álcool no qual tanto faz: acima dele a gasolina sai mais barata por quilômetro, abaixo dele o álcool sai. Ele é o preço da gasolina multiplicado pelo rendimento relativo do álcool no seu carro — é a regra dos 70% recalculada com o seu consumo em vez da média nacional.',
    },
    {
      pergunta: 'Como descubro o consumo do meu carro?',
      resposta:
        'Encha o tanque, zere o hodômetro parcial e rode normalmente. No próximo abastecimento completo, divida os quilômetros percorridos pelos litros que couberam. Faça isso com cada combustível e no mesmo tipo de trajeto — o consumo na cidade e na estrada é bem diferente, e comparar um com o outro distorce o resultado.',
    },
    {
      pergunta: 'O computador de bordo serve?',
      resposta:
        'Serve como ponto de partida, com ressalva: ele estima e costuma ser otimista em alguns pontos percentuais. Se você usá-lo, use para os dois combustíveis — o erro tende a ser na mesma direção, e a razão entre os dois rendimentos, que é o que decide, se mantém mais fiel que cada número isolado.',
    },
    {
      pergunta: 'Vale considerar o desgaste do motor?',
      resposta:
        'Esta calculadora compara apenas o custo do combustível no percurso informado. Diferenças de manutenção entre os dois combustíveis existem, variam por motor e por rodagem, e não há fonte oficial que as quantifique de forma aplicável a qualquer veículo — por isso não entram na conta, em vez de entrarem por um número inventado.',
    },
  ],

  relacionadas: ['porcentagem', 'juros-compostos'],
}
