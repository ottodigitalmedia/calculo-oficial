/**
 * CALC-040 — Comparador: Tesouro Selic, CDB e poupança.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Nenhum motor novo.** As três pernas saem de coisas que já existem: o CDB e o
 * Tesouro Selic passam por `calcularRendaFixa`, que traz a tabela regressiva de
 * `lib/params/`; a poupança passa por `calcularJurosCompostos`. O que ela
 * acrescenta é a comparação — e o cuidado de fazê-la pelo valor **líquido**, que
 * é a única forma honesta.
 *
 * **A poupança não é campo, e isso é modelagem, não descuido.** As outras duas
 * são ofertas: existe CDB a 98% e a 112% do CDI, e o usuário sabe qual recebeu.
 * Poupança não tem oferta — a taxa é a que o Banco Central publica, igual em
 * qualquer banco. Ela entra como dado, com a data ao lado, e não como campo que
 * finge escolha onde não há.
 *
 * `docs/18` §7 chegou a listar esta calculadora como dependente de campo de
 * lista. Não é: os três produtos são fixos. O erro está corrigido em
 * `ESTADO-DO-PROJETO` §4.2.
 */

import { calcularJurosCompostos } from '../engine/calculadoras/juros-compostos'
import { calcularRendaFixa } from '../engine/calculadoras/renda-fixa'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { RENDA_FIXA as PARAMS_RENDA_FIXA } from '../params/data/renda-fixa'
import { construirRegistro } from '../params/registry'
import { ULTIMAS_TAXAS } from '../series/dados/compacto'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

const registro = construirRegistro(PARAMS_RENDA_FIXA)

const BP_INTEIRO = 10_000

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const valorAplicado = centavos(numero(valores, 'valorAplicado'))
  const prazoMeses = numero(valores, 'prazoMeses')
  const taxaCdi = numero(valores, 'taxaCdi')

  const taxaDe = (percentualDoCdi: number) =>
    basisPoints(Math.round((taxaCdi * percentualDoCdi) / BP_INTEIRO))

  /**
   * O Tesouro Selic acompanha a taxa básica, e por isso entra a 100% do CDI.
   *
   * É aproximação declarada — o título tem ainda a taxa de custódia da bolsa,
   * que a nota menciona e a conta não desconta, porque ela varia por faixa de
   * valor e por corretora.
   */
  const tesouro = calcularRendaFixa(
    { valorAplicado, taxaAnual: taxaDe(BP_INTEIRO), prazoMeses, isenta: false },
    dataReferencia,
    registro,
  )
  const cdb = calcularRendaFixa(
    {
      valorAplicado,
      taxaAnual: taxaDe(numero(valores, 'percentualDoCdi')),
      prazoMeses,
      isenta: false,
    },
    dataReferencia,
    registro,
  )

  if (!tesouro.ok) return tesouro
  if (!cdb.ok) return cdb

  /**
   * A poupança, com a taxa publicada.
   *
   * Sem série em cache, a perna simplesmente não aparece — nunca uma mensagem
   * de erro por causa de indicador (`06-api-spec` §4.2).
   */
  const taxaPoupanca = ULTIMAS_TAXAS['poupanca-mensal']
  const poupanca = taxaPoupanca
    ? calcularJurosCompostos(
        {
          valorInicial: valorAplicado,
          aporteMensal: centavos(0),
          taxa: basisPoints(Math.round(taxaPoupanca.valor / 100)),
          taxaAoAno: false,
          meses: prazoMeses,
        },
        dataReferencia,
      )
    : null

  const liquidoDaPoupanca = poupanca?.ok ? poupanca.valores.montante : null

  const concorrentes: readonly { readonly nome: string; readonly liquido: number }[] = [
    { nome: 'CDB', liquido: cdb.valores.montanteLiquido },
    { nome: 'Tesouro Selic', liquido: tesouro.valores.montanteLiquido },
    ...(liquidoDaPoupanca !== null
      ? [{ nome: 'Poupança', liquido: liquidoDaPoupanca }]
      : []),
  ]

  const vencedor = concorrentes.reduce((a, b) => (b.liquido > a.liquido ? b : a))
  const ultimo = concorrentes.reduce((a, b) => (b.liquido < a.liquido ? b : a))

  const destaques: Destaque[] = [
    { rotulo: 'Melhor no prazo', valor: vencedor.nome },
    {
      rotulo: `Vantagem sobre ${ultimo.nome}`,
      valor: formatarReal(centavos(vencedor.liquido - ultimo.liquido)),
    },
    { rotulo: 'Alíquota de imposto no prazo', valor: formatarPercentual(cdb.valores.aliquota) },
  ]

  if (taxaPoupanca) {
    destaques.push({
      rotulo: `Poupança publicada em ${taxaPoupanca.data}`,
      valor: formatarPercentual(Math.round(taxaPoupanca.valor / 100)),
    })
  }

  return {
    ok: true,
    /** O traço é o do CDB: é a perna com imposto, e a que tem o que explicar. */
    traco: cdb.traco,
    valores: {
      principal: centavos(vencedor.liquido),
      /** Decomposição da perna vencedora — as linhas somam o valor exibido. */
      detalhamento: [
        { rotulo: 'Valor aplicado', valor: valorAplicado, sinal: 'neutro' },
        {
          rotulo: `Rendimento líquido — ${vencedor.nome}`,
          valor: centavos(vencedor.liquido - valorAplicado),
          sinal: 'credito',
        },
        { rotulo: `Valor final — ${vencedor.nome}`, valor: centavos(vencedor.liquido), sinal: 'neutro' },
      ],
      destaques,
      tabela: {
        titulo: 'As três aplicações, pelo valor líquido',
        colunas: ['Valor final', 'Rendimento líquido'],
        linhas: concorrentes.map((c) => ({
          rotulo: c.nome,
          valores: [centavos(c.liquido), centavos(c.liquido - valorAplicado)],
        })),
      },
      notas: [
        'A comparação é feita pelo valor LÍQUIDO, depois do imposto. Comparar percentual do CDI ' +
          'com rendimento da poupança é comparar coisas diferentes, e é assim que a poupança ' +
          'costuma parecer melhor do que é — ou pior.',
        'A taxa da poupança não é campo porque não é oferta: ela é a que o Banco Central ' +
          'publica, igual em qualquer banco. A data da última publicação aparece no resultado.',
        'O Tesouro Selic entra a 100% do CDI, que é aproximação. Ele tem ainda a taxa de ' +
          'custódia da bolsa, que não é descontada aqui porque varia por faixa de valor e por ' +
          'corretora — em valores pequenos e prazos longos, ela muda a ordem.',
        'O resultado supõe o dinheiro parado até o fim do prazo. Resgatar antes muda a alíquota ' +
          'do imposto nas duas aplicações tributadas, e na poupança faz perder o rendimento do ' +
          'mês em curso.',
      ],
    },
  }
}

export const COMPARADOR_INVESTIMENTOS: DefinicaoCalculadora = {
  id: 'CALC-040',
  slug: 'onde-render-mais',
  nome: 'Tesouro Selic, CDB ou poupança',
  linhaDeContexto: 'Qual das três entrega mais no seu prazo — comparadas pelo líquido, não pela taxa.',
  descricaoSeo:
    'Compare Tesouro Selic, CDB e poupança pelo valor líquido no seu prazo, com o imposto de renda na conta e a taxa da poupança publicada pelo Banco Central.',

  campos: [
    {
      id: 'valorAplicado',
      rotulo: 'Valor a aplicar',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'prazoMeses',
      rotulo: 'Por quantos meses',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 12,
      minimo: 1,
      maximo: 600,
      ajuda: 'O prazo define a alíquota do imposto nas duas aplicações tributadas.',
    },
    {
      id: 'taxaCdi',
      rotulo: 'CDI ao ano',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'Abre com a Selic do último mês publicado. O CDI anda junto dela.',
    },
    {
      id: 'percentualDoCdi',
      rotulo: 'Percentual do CDI que o CDB paga',
      tipo: 'percentual',
      obrigatorio: true,
      padrao: 10_000,
      minimo: 1,
      maximo: 30_000,
      ajuda: 'O que o banco ofereceu: "110% do CDI" são 110,00%.',
    },
  ],

  /** A tabela regressiva vem de `lib/params/` — a mesma de CALC-018. */
  parametrosRequeridos: [
    'ir-renda-fixa-faixa-1',
    'ir-renda-fixa-faixa-4',
    'ir-renda-fixa-limite-1',
    'ir-renda-fixa-limite-3',
  ],

  /** `RF-012` — o CDI abre sugerido pela Selic corrente, com a data do dado. */
  sugestaoDeSerie: { campo: 'taxaCdi', serie: 'selic-ao-ano' },

  rotuloResultado: 'Melhor resultado no prazo',

  calcular,

  faq: [
    {
      pergunta: 'Por que a poupança não tem campo de taxa?',
      resposta:
        'Porque ela não é oferta. Existe CDB a 98% e a 112% do CDI, e você sabe qual recebeu — mas poupança rende o mesmo em qualquer banco, pela regra que o Banco Central aplica e publica. Colocar um campo ali fingiria uma escolha que não existe. A taxa usada é a última publicada, e a data aparece no resultado.',
    },
    {
      pergunta: 'Por que comparar pelo líquido e não pela taxa?',
      resposta:
        'Porque as três não são tributadas do mesmo jeito, e a taxa bruta esconde isso. Um CDB a 100% do CDI rende mais que a poupança em bruto e pode render menos em líquido num prazo curto, quando a alíquota do imposto é a mais alta. A única comparação que responde à pergunta "onde sobra mais dinheiro" é a do valor final depois do imposto.',
    },
    {
      pergunta: 'O prazo muda quem ganha?',
      resposta:
        'Muda, e é o principal motivo de rodar a conta. A alíquota do imposto cai em degraus conforme o dinheiro fica aplicado, então as aplicações tributadas melhoram com o tempo em relação à poupança. Rode com o seu prazo real — e, se ele for incerto, rode com o mais curto que você pode precisar do dinheiro.',
    },
    {
      pergunta: 'A taxa de custódia do Tesouro está na conta?',
      resposta:
        'Não. A taxa de custódia da bolsa incide sobre o valor aplicado e varia por faixa e por corretora, e por isso não é descontada aqui. Em valores pequenos e prazos longos ela é suficiente para mudar a ordem entre Tesouro Selic e CDB — vale somá-la por fora antes de decidir por diferenças pequenas.',
    },
    {
      pergunta: 'E se eu precisar sacar antes?',
      resposta:
        'A conta deixa de valer, e para os três de formas diferentes. Nas aplicações tributadas, sacar antes significa alíquota maior, porque a tabela é regressiva. Na poupança, sacar antes do aniversário mensal faz perder todo o rendimento do período — não há proporcional. Se o prazo é incerto, esse detalhe pesa mais que a diferença de taxa.',
    },
  ],

  relacionadas: ['cdb-lci-lca', 'rendimento-da-poupanca', 'ir-renda-fixa'],
}
