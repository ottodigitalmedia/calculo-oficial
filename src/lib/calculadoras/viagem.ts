/**
 * CALC-055 — Consumo e custo de viagem por combustível.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A metade esquecida é a volta.** O erro mais comum ao estimar uma viagem de
 * carro não é de aritmética: é contar só a ida. Por isso ida e volta é campo com
 * padrão declarado, e a memória mostra a duplicação como etapa própria.
 */

import { calcularViagem } from '../engine/calculadoras/veiculos'
import { centavos } from '../engine/types'
import { formatarNumero, formatarReal } from '../format/moeda'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const pedagios = centavos(numero(valores, 'pedagios'))
  const pessoas = numero(valores, 'pessoas')

  const r = calcularViagem(
    {
      distancia: numero(valores, 'distancia'),
      consumo: numero(valores, 'consumo'),
      precoLitro: centavos(numero(valores, 'precoLitro')),
      idaEVolta: texto(valores, 'trajeto') !== 'so-ida',
      pedagios,
      pessoas: pessoas > 0 ? pessoas : 1,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Combustível', valor: v.custoCombustivel, sinal: 'debito' },
  ]
  if (pedagios > 0) {
    linhas.push({ rotulo: 'Pedágios', valor: pedagios, sinal: 'debito' })
  }
  linhas.push({ rotulo: 'Custo da viagem', valor: v.custoTotal, sinal: 'neutro' })

  const destaques: Destaque[] = [
    { rotulo: 'Distância total', valor: `${v.distanciaTotal} km` },
    { rotulo: 'Litros necessários', valor: formatarNumero(v.litros) },
    { rotulo: 'Custo por quilômetro', valor: formatarReal(v.custoPorQuilometro) },
  ]

  if (pessoas > 1) {
    destaques.push({ rotulo: 'Por pessoa', valor: formatarReal(v.custoPorPessoa) })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.custoTotal,
      detalhamento: linhas,
      destaques,
      notas: [
        'Use o consumo real do seu carro, não o da tabela do fabricante. Ele muda com a ' +
          'estrada, com o ar-condicionado, com o peso da bagagem e com a velocidade — e em ' +
          'viagem longa costuma ser melhor que o consumo urbano.',
        'A conta cobre combustível e pedágio. Desgaste de pneu, óleo e a parcela de manutenção ' +
          'que a viagem consome não entram aqui: para o custo cheio de rodar, a calculadora de ' +
          'custo mensal do carro mostra quanto sai por quilômetro.',
      ],
    },
  }
}

export const VIAGEM: DefinicaoCalculadora = {
  id: 'CALC-055',
  slug: 'custo-de-viagem',
  nome: 'Custo de viagem de carro',
  linhaDeContexto: 'Quanto a viagem gasta de combustível e pedágio — ida, volta e por pessoa.',
  descricaoSeo:
    'Calcule quantos litros e quanto custa uma viagem de carro a partir da distância, do consumo real do veículo e do preço do combustível. Com pedágio, ida e volta e divisão por pessoa.',

  campos: [
    {
      id: 'distancia',
      rotulo: 'Distância de ida, em km',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000,
    },
    {
      id: 'trajeto',
      rotulo: 'Trajeto',
      tipo: 'selecao',
      padrao: 'ida-e-volta',
      opcoes: [
        { valor: 'ida-e-volta', rotulo: 'Ida e volta' },
        { valor: 'so-ida', rotulo: 'Só a ida' },
      ],
      ajuda: 'A volta é a metade que costuma ser esquecida na conta.',
    },
    {
      id: 'consumo',
      rotulo: 'Consumo do carro, em km/l',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'O consumo real na estrada, que costuma ser melhor que o da cidade.',
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
      id: 'pedagios',
      rotulo: 'Pedágios no trajeto',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'O total do percurso escolhido. Some ida e volta se for o caso.',
    },
    {
      id: 'pessoas',
      rotulo: 'Pessoas dividindo o custo',
      tipo: 'inteiro',
      padrao: 1,
      minimo: 1,
      maximo: 50,
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Custo da viagem',

  calcular,

  faq: [
    {
      pergunta: 'Qual consumo devo informar?',
      resposta:
        'O do seu carro, medido por você, e não o da tabela do fabricante. A forma mais simples de medir é encher o tanque, zerar o hodômetro parcial, rodar até a próxima parada e dividir os quilômetros percorridos pelos litros que couberam. Em viagem de estrada o consumo costuma ser melhor que o urbano, então usar o número da cidade superestima o gasto.',
    },
    {
      pergunta: 'A conta inclui o desgaste do carro?',
      resposta:
        'Não. Aqui entram combustível e pedágio, que é o que sai do bolso no dia da viagem. Pneu, óleo, revisão e a perda de valor do veículo são custos reais e não aparecem no posto — a calculadora de custo mensal do carro mostra quanto eles somam por quilômetro rodado.',
    },
    {
      pergunta: 'Compensa mais ir de carro ou de ônibus?',
      resposta:
        'Compare o custo por pessoa que aparece no resultado com a passagem. Viajando sozinho o carro raramente ganha; com o carro cheio, a conta costuma virar. E lembre de somar do lado do carro o que ele custa além do combustível, além do estacionamento no destino.',
    },
    {
      pergunta: 'Álcool ou gasolina, para essa viagem?',
      resposta:
        'Depende do consumo do seu carro com cada um, e não da regra dos setenta por cento. Há uma calculadora só para isso, que compara os dois pelo rendimento real do veículo e mostra o preço de equilíbrio do álcool — abaixo dele o etanol compensa, acima não.',
    },
  ],

  relacionadas: ['alcool-ou-gasolina', 'custo-mensal-do-carro', 'porcentagem'],
}
