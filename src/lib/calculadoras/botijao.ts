/**
 * CALC-068 — Duração e custo do botijão de gás.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Ela parte da duração observada, e não da potência do fogão.** A alternativa
 * exigiria kcal/h dos queimadores e tempo de uso — dados que quase ninguém tem e
 * que ninguém mede. Quanto durou o último botijão, essa a pessoa sabe. É a mesma
 * escolha de CALC-057 com o IPVA: pedir o dado que o usuário possui.
 *
 * O número que dá utilidade à página é o **custo por quilo**: botijões de
 * tamanhos diferentes não se comparam pelo preço, e o menor costuma sair mais
 * caro por quilo mesmo custando menos no total.
 */

import { calcularBotijao } from '../engine/calculadoras/consumo'
import { centavos } from '../engine/types'
import { formatarNumero, formatarReal } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularBotijao(
    {
      precoDoBotijao: centavos(numero(valores, 'preco')),
      duracaoDias: numero(valores, 'duracaoDias'),
      massaKg: numero(valores, 'massaKg'),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.custoPorMes,
      detalhamento: [
        { rotulo: 'Custo por mês', valor: v.custoPorMes, sinal: 'neutro' },
        { rotulo: 'Custo em doze meses', valor: v.custoPorAno, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Custo por dia', valor: formatarReal(v.custoPorDia) },
        { rotulo: 'Custo por quilo de gás', valor: formatarReal(v.custoPorKg) },
        { rotulo: 'Consumo médio por dia', valor: `${formatarNumero(v.gramasPorDia * 100)} g` },
      ],
      notas: [
        'O custo por quilo é o número que compara revendas e tamanhos. Um botijão de 8 kg mais ' +
          'barato costuma sair mais CARO por quilo que um de 13 kg — a comparação pelo preço ' +
          'cheio esconde isso.',
        'A conta parte de quanto durou o SEU último botijão, e por isso já embute o seu uso. Se ' +
          'a rotina da casa mudou desde então — mais gente, mais refeições —, a estimativa fica ' +
          'defasada na mesma medida.',
        'O mês aqui é de trinta dias, por convenção, para que o valor seja comparável com as ' +
          'outras despesas mensais da casa. O consumo de gás não segue o calendário.',
        'Botijão de 13 kg é o mais comum em cozinha residencial. Os de 8 kg e 5 kg existem para ' +
          'outros usos e costumam ter preço por quilo mais alto.',
      ],
    },
  }
}

export const BOTIJAO: DefinicaoCalculadora = {
  id: 'CALC-068',
  slug: 'custo-do-botijao-de-gas',
  nome: 'Custo do botijão de gás',
  linhaDeContexto: 'Quanto o gás pesa por mês — e quanto você paga por quilo, que é o que compara.',
  descricaoSeo:
    'Calcule quanto o botijão de gás custa por dia, por mês e por quilo a partir do preço pago e de quantos dias ele durou na sua casa.',

  campos: [
    {
      id: 'preco',
      rotulo: 'Preço pago no botijão',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000,
    },
    {
      id: 'duracaoDias',
      rotulo: 'Quantos dias ele durou',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 60,
      minimo: 1,
      maximo: 1_000,
      ajuda: 'Do dia da troca até acabar. É esse número que embute o uso da sua casa.',
    },
    {
      id: 'massaKg',
      rotulo: 'Massa do botijão, em kg',
      tipo: 'decimal',
      padrao: 1_300,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'O de cozinha costuma ser de 13 kg.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Custo do gás por mês',

  calcular,

  faq: [
    {
      pergunta: 'Por que o custo por quilo importa?',
      resposta:
        'Porque é o único número que compara botijões de tamanhos diferentes e revendas diferentes. Um botijão de 8 kg custando menos que um de 13 kg parece mais barato e quase sempre é mais caro por quilo de gás. A mesma lógica vale entre revendedores: o mais barato no total pode não ser o mais barato por quilo, se o botijão for menor.',
    },
    {
      pergunta: 'Como sei quanto tempo o meu botijão dura?',
      resposta:
        'Anotando a data da troca. Basta registrar quando trocou e quando acabou — a diferença em dias é o número que a calculadora pede. Fazer isso uma vez já dá uma estimativa útil, e fazer duas ou três dá uma média melhor, porque o uso varia entre meses.',
    },
    {
      pergunta: 'A conta serve se a minha casa mudou de rotina?',
      resposta:
        'Serve como ponto de partida, e vale desconfiar. A duração informada já embute o uso do período em que ela foi observada: mais gente em casa, mais refeições feitas ali ou um inverno com mais banho quente mudam o consumo, e a estimativa fica defasada na mesma medida. Depois da próxima troca, refaça com o número novo.',
    },
    {
      pergunta: 'Vale a pena trocar por gás encanado?',
      resposta:
        'A comparação é entre o custo por mês que aparece aqui e a conta do gás encanado para um consumo equivalente, somando a tarifa fixa que a distribuidora cobra mesmo sem consumo. Como o encanado é cobrado por metro cúbico e o botijão por quilo, comparar preços diretamente não funciona — o custo mensal de cada um é o que se compara.',
    },
  ],

  relacionadas: ['consumo-de-energia', 'orcamento-domestico', 'porcentagem'],
}
