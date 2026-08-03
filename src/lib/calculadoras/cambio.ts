/**
 * CALC-062 — Conversor de moeda com IOF.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A alíquota de IOF é campo, e a razão está em `ESTADO-DO-PROJETO` §7.33.** A
 * fonte oficial não resolve qual redação do art. 15-B do Decreto nº 6.306/2007
 * está em vigor — o texto consolidado exibe uma sustada por decreto legislativo,
 * a anterior restabelecida pelo mesmo ato, e uma ação em curso no Supremo.
 * `CLAUDE.md` regra 10 manda não publicar valor legal não confirmado, e
 * `00-catalogo` §14 dá a saída: o dado indispensável vira campo.
 *
 * **Ela também não usa série econômica.** A cotação é um PREÇO, e a máquina de
 * séries deste projeto é feita para percentual — escala fixa de quatro casas,
 * conversão para basis points. O euro, medido em 03/08/2026, vem com **sete**
 * casas decimais. Encaixar preço ali exigiria escala por série e um tipo não
 * percentual, e isso é ampliação de contrato que ainda não tem duas
 * calculadoras pedindo. Fica declarado, não improvisado.
 */

import { calcularCambio } from '../engine/calculadoras/cambio'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import {
  numero,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const tarifa = centavos(numero(valores, 'tarifa'))

  const r = calcularCambio(
    {
      valorEmMoeda: numero(valores, 'valorEmMoeda'),
      cotacao: centavos(numero(valores, 'cotacao')),
      spreadBp: basisPoints(numero(valores, 'spread')),
      iofBp: basisPoints(numero(valores, 'iof')),
      tarifa,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o custo total — cada custo só aparece se existir. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Convertido pela cotação', valor: v.valorPelaCotacao, sinal: 'neutro' },
  ]
  if (v.spread > 0) {
    linhas.push({ rotulo: 'Spread da casa de câmbio', valor: v.spread, sinal: 'debito' })
  }
  if (v.iof > 0) {
    linhas.push({ rotulo: 'IOF', valor: v.iof, sinal: 'debito' })
  }
  if (tarifa > 0) {
    linhas.push({ rotulo: 'Tarifa', valor: tarifa, sinal: 'debito' })
  }
  linhas.push({ rotulo: 'Custo total em reais', valor: v.custoTotal, sinal: 'neutro' })

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.custoTotal,
      detalhamento: linhas,
      destaques: [
        { rotulo: 'Cotação que você pagou', valor: formatarReal(v.cotacaoEfetiva) },
        { rotulo: 'Acima da cotação de tela', valor: formatarPercentual(v.acrescimoBp) },
      ],
      notas: [
        'A alíquota de IOF é campo, e não um valor cadastrado aqui. O art. 15-B do Decreto nº ' +
          '6.306/2007 está em disputa: o texto consolidado do Planalto exibe uma redação sustada ' +
          'por decreto legislativo, a anterior restabelecida pelo mesmo ato, e uma ação em curso ' +
          'no Supremo. Este produto não publica valor legal que não consegue fundamentar — ' +
          'informe a alíquota que consta do seu contrato de câmbio ou da sua fatura.',
        'A alíquota também varia com a operação: compra de moeda em espécie, cartão ' +
          'internacional, transferência e remessa não têm o mesmo tratamento. Um número único ' +
          'para todas seria errado mesmo sem a disputa.',
        'O spread costuma vir EMBUTIDO na cotação oferecida, e não discriminado. Para descobrir ' +
          'o seu, compare a cotação que lhe ofereceram com a cotação de referência do dia: a ' +
          'diferença percentual entre as duas é o spread.',
        'O número que permite comparar duas casas de câmbio é a cotação efetiva, e não a ' +
          'anunciada. Ela resume spread, imposto e tarifa num só valor — e é comum que a casa ' +
          'com a melhor cotação de tela tenha a pior cotação efetiva.',
      ],
    },
  }
}

export const CAMBIO: DefinicaoCalculadora = {
  id: 'CALC-062',
  slug: 'conversor-de-moeda',
  nome: 'Conversor de moeda com IOF',
  linhaDeContexto: 'Quanto você paga de verdade por dólar ou euro — com spread, IOF e tarifa dentro.',
  descricaoSeo:
    'Calcule o custo real de comprar moeda estrangeira somando cotação, spread da casa de câmbio, IOF e tarifa. Veja a cotação efetiva que você de fato pagou.',

  campos: [
    {
      id: 'valorEmMoeda',
      rotulo: 'Quanto você quer comprar, em moeda estrangeira',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000,
      ajuda: 'Em dólares, euros ou o que for. A conta não depende de qual moeda é.',
    },
    {
      id: 'cotacao',
      rotulo: 'Cotação, em reais por unidade',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000,
      ajuda: 'A cotação que a casa de câmbio ofereceu, ou a de referência do dia se você quiser medir o spread.',
    },
    {
      id: 'spread',
      rotulo: 'Spread sobre a cotação',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Deixe em zero se a cotação que você informou já é a oferecida — nesse caso o spread já está dentro dela.',
    },
    {
      id: 'iof',
      rotulo: 'Alíquota de IOF da operação',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'A que consta do seu contrato de câmbio ou da fatura. Ela varia conforme a operação, e a norma está em disputa — por isso não vem preenchida.',
    },
    {
      id: 'tarifa',
      rotulo: 'Tarifa cobrada',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
    },
  ],

  /**
   * Nenhum. A alíquota de IOF **não** é parâmetro deste sistema — ver o
   * cabeçalho do módulo e `ESTADO-DO-PROJETO` §7.33.
   */
  parametrosRequeridos: [],

  rotuloResultado: 'Custo total em reais',

  calcular,

  faq: [
    {
      pergunta: 'Por que o IOF não vem preenchido?',
      resposta:
        'Porque a norma que o fixa está em disputa, e este produto não publica valor legal que não consegue fundamentar. O texto consolidado do Decreto nº 6.306/2007 no site do Planalto mostra, ao mesmo tempo, uma redação do art. 15-B sustada por decreto legislativo do Congresso, a redação anterior restabelecida pelo mesmo ato, e uma ação em curso no Supremo. Nessa situação, qualquer número que aparecesse aqui teria aparência de certeza sem ter o lastro — e é exatamente isso que a calculadora existe para não fazer.',
    },
    {
      pergunta: 'Onde encontro a alíquota que se aplica a mim?',
      resposta:
        'No contrato de câmbio, quando a compra é em espécie ou por transferência, e na fatura do cartão, quando a compra foi no exterior. Nos dois casos o imposto aparece discriminado, com o valor e a alíquota. Essa é a fonte que vale para a sua operação — e ela também resolve a segunda dificuldade: a alíquota não é a mesma para espécie, cartão, transferência e remessa.',
    },
    {
      pergunta: 'O que é o spread e por que ele não aparece na fatura?',
      resposta:
        'É a diferença entre a cotação de mercado e a que a casa de câmbio pratica com você. Ele quase nunca é discriminado, porque já vem embutido na cotação oferecida. Para descobrir o seu, compare a cotação que lhe ofereceram com a cotação de referência daquele dia: a diferença percentual entre as duas é o spread. Se você informar aqui a cotação já oferecida, deixe o campo de spread em zero para não contá-lo duas vezes.',
    },
    {
      pergunta: 'Por que a cotação efetiva é o número que importa?',
      resposta:
        'Porque é o único que permite comparar. A cotação anunciada esconde o spread; a soma final esconde a quantidade comprada. A cotação efetiva — o total pago dividido pela moeda recebida — junta tudo num número comparável entre casas de câmbio. É comum que a casa com a melhor cotação de tela tenha a pior cotação efetiva, e essa comparação é a única que revela isso.',
    },
    {
      pergunta: 'A calculadora busca a cotação do dia?',
      resposta:
        'Não. A cotação é campo, e de propósito: o que interessa não é a cotação de referência, e sim a que ofereceram a você — que é diferente, e cuja diferença é justamente o que a página ajuda a medir. Além disso, o número que vale é o do momento do fechamento do câmbio, e ele muda ao longo do dia.',
    },
  ],

  relacionadas: ['porcentagem', 'ir-renda-fixa', 'poder-de-compra'],
}
