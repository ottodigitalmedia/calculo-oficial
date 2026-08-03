/**
 * CALC-033 — Custo total de aquisição de imóvel.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Nenhum custo daqui pode ser cadastrado, e isso é o §14 do catálogo
 * funcionando.** O ITBI tem alíquota municipal — são mais de cinco mil
 * municípios —, e os emolumentos de tabelionato e registro seguem tabela
 * estadual revista todo ano. Uma média nacional seria um número errado com
 * aparência de certo para quase todo mundo.
 *
 * **O que a página entrega é o número que trava negócio:** quanto precisa estar
 * em DINHEIRO no dia. Não é a entrada — é a entrada mais os custos, e eles não
 * podem ser financiados junto com o imóvel.
 */

import { calcularCustoDeAquisicao } from '../engine/calculadoras/imobiliario'
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
  const valorDoImovel = centavos(numero(valores, 'valorDoImovel'))
  const escritura = centavos(numero(valores, 'escritura'))
  const registro = centavos(numero(valores, 'registro'))
  const avaliacao = centavos(numero(valores, 'avaliacao'))
  const outrasDespesas = centavos(numero(valores, 'outrasDespesas'))

  const r = calcularCustoDeAquisicao(
    {
      valorDoImovel,
      entrada: centavos(numero(valores, 'entrada')),
      itbiBp: basisPoints(numero(valores, 'itbi')),
      escritura,
      registro,
      avaliacao,
      outrasDespesas,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o total exibido. */
  const linhas: LinhaDetalhamento[] = []
  if (v.itbi > 0) linhas.push({ rotulo: 'ITBI', valor: v.itbi, sinal: 'neutro' })
  if (escritura > 0) linhas.push({ rotulo: 'Escritura', valor: escritura, sinal: 'neutro' })
  if (registro > 0) linhas.push({ rotulo: 'Registro', valor: registro, sinal: 'neutro' })
  if (avaliacao > 0) {
    linhas.push({ rotulo: 'Avaliação do banco', valor: avaliacao, sinal: 'neutro' })
  }
  if (outrasDespesas > 0) {
    linhas.push({ rotulo: 'Outras despesas', valor: outrasDespesas, sinal: 'neutro' })
  }
  linhas.push({ rotulo: 'Custos além do preço', valor: v.custosAlemDoPreco, sinal: 'neutro' })

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.custosAlemDoPreco,
      detalhamento: linhas,
      destaques: [
        {
          rotulo: 'Precisa estar em dinheiro no dia',
          valor: formatarReal(v.desembolsoNaAssinatura),
        },
        { rotulo: 'Os custos representam', valor: formatarPercentual(v.custosBp) },
        { rotulo: 'Valor a financiar', valor: formatarReal(v.valorFinanciado) },
        { rotulo: 'Imóvel mais custos', valor: formatarReal(v.custoTotalDaCompra) },
      ],
      notas: [
        'Os custos de aquisição NÃO são financiados junto com o imóvel: saem do bolso no dia da ' +
          'assinatura, somados à entrada. É esse número, e não a entrada sozinha, que precisa ' +
          'estar disponível — e é onde a maioria dos negócios trava.',
        'A alíquota do ITBI é municipal e foi digitada por você. A prefeitura pode calcular o ' +
          'imposto sobre o VALOR VENAL DE REFERÊNCIA dela, e não sobre o preço do negócio — ' +
          'quando esse valor é maior, a guia sai acima desta conta.',
        'Os emolumentos de escritura e de registro seguem tabela estadual, publicada pelo ' +
          'tribunal de justiça do estado e revista todo ano. Eles variam por faixa de valor do ' +
          'imóvel, e o cartório informa o valor exato antes do ato.',
        'Quando a compra é financiada, pergunte ao banco se o contrato substitui a escritura ' +
          'pública no seu caso. Quando substitui, o custo do tabelionato sai da conta e sobra só ' +
          'o registro.',
        'Esta calculadora não traz nenhum desses valores preenchidos, de propósito: eles mudam ' +
          'por município e por estado, e um número médio estaria errado para quase todo mundo.',
      ],
    },
  }
}

export const CUSTO_DE_AQUISICAO: DefinicaoCalculadora = {
  id: 'CALC-033',
  slug: 'custo-de-aquisicao-de-imovel',
  nome: 'Custo total de aquisição de imóvel',
  linhaDeContexto: 'Quanto precisa estar em dinheiro no dia — que não é só a entrada.',
  descricaoSeo:
    'Some ITBI, escritura, registro e avaliação para saber quanto custa comprar um imóvel além do preço, e quanto precisa estar disponível na assinatura.',

  campos: [
    {
      id: 'valorDoImovel',
      rotulo: 'Valor do imóvel',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000_000_000,
    },
    {
      id: 'entrada',
      rotulo: 'Entrada que você vai dar',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000_000,
      ajuda: 'Deixe em zero para ver só os custos além do preço.',
    },
    {
      id: 'itbi',
      rotulo: 'Alíquota do ITBI do seu município',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Está no site da prefeitura ou na guia do imposto. Varia de município para município.',
    },
    {
      id: 'escritura',
      rotulo: 'Escritura pública',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Emolumentos do tabelionato. A tabela é estadual e o cartório informa o valor exato.',
    },
    {
      id: 'registro',
      rotulo: 'Registro do imóvel',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Emolumentos do cartório de registro de imóveis, também por tabela estadual.',
    },
    {
      id: 'avaliacao',
      rotulo: 'Avaliação do banco',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'Tarifa cobrada pelo banco para avaliar o imóvel. Só existe quando há financiamento.',
    },
    {
      id: 'outrasDespesas',
      rotulo: 'Outras despesas',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Certidões, assessoria, mudança — o que mais entrar na conta.',
    },
  ],

  // Sem parâmetro legal: ITBI é municipal e emolumentos são estaduais — §14 do
  // catálogo fecha a porta do dado hiperlocal, e a saída é o campo do usuário.
  parametrosRequeridos: [],

  rotuloResultado: 'Custos além do preço do imóvel',

  calcular,

  faq: [
    {
      pergunta: 'Posso financiar os custos de aquisição junto com o imóvel?',
      resposta:
        'Em regra não: ITBI, escritura e registro são pagos à vista, no ato, e somam-se à entrada. Alguns bancos financiam parte das despesas em contratos específicos, e vale perguntar — mas planeje pelo cenário de pagar tudo do próprio bolso. É por não fazer essa conta antes que muito negócio trava depois da proposta aceita.',
    },
    {
      pergunta: 'Por que a calculadora não sabe o ITBI da minha cidade?',
      resposta:
        'Porque são mais de cinco mil municípios, cada um com a sua alíquota e as suas regras, e este produto não publica dado que não pode confirmar em fonte oficial. A alíquota está no site da prefeitura e na própria guia do imposto. Uma média nacional seria um número errado para quase todo mundo — e errado com aparência de certo é o pior resultado possível aqui.',
    },
    {
      pergunta: 'A prefeitura pode cobrar ITBI sobre um valor maior que o preço?',
      resposta:
        'Pode acontecer, e é comum. Muitos municípios calculam o imposto sobre um valor venal de referência próprio, e quando ele é maior que o preço do negócio a guia sai acima desta conta. Se for o seu caso, informe aqui o valor de referência do município no lugar do preço para conferir a diferença — e verifique na prefeitura, porque esse ponto é objeto de discussão frequente.',
    },
    {
      pergunta: 'Preciso de escritura pública se estou financiando?',
      resposta:
        'Pergunte ao banco. Em boa parte dos financiamentos o próprio contrato faz as vezes da escritura, e nesse caso o custo do tabelionato sai da conta e resta só o registro. Como isso depende do tipo de contrato e da praxe do cartório, o valor certo vem do banco e do cartório antes da assinatura — deixe o campo em zero enquanto não tiver a resposta.',
    },
    {
      pergunta: 'Vale a pena negociar quem paga o quê?',
      resposta:
        'Vale, e é negociável mais do que parece. A prática de mercado atribui ITBI e registro ao comprador e a corretagem ao vendedor, mas nada disso é imutável entre as partes — o que está escrito no contrato é o que vale. Ter o número total à mão antes da negociação é o que permite pedir abatimento no preço em vez de descobrir o custo depois.',
    },
  ],

  relacionadas: ['financiamento-imobiliario', 'capacidade-de-financiamento', 'alugar-ou-comprar'],
}
