/**
 * CALC-025 — Amortização: SAC vs. Price.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * A tabela de evolução reaproveita o molde de `TabelaResultado` criado em
 * CALC-022, e é resumida por ano — trezentas e sessenta linhas não são
 * memória de cálculo, são ruído.
 */

import { calcularAmortizacao } from '../engine/calculadoras/credito'
import { basisPoints, centavos } from '../engine/types'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularAmortizacao(
    {
      principal: centavos(numero(valores, 'principal')),
      prazoMeses: numero(valores, 'prazoMeses'),
      taxaMensal: basisPoints(numero(valores, 'taxaMensal')),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.economiaDoSac,
      detalhamento: [
        { rotulo: 'Total pago no Price', valor: v.totalPrice, sinal: 'debito' },
        { rotulo: 'Total pago no SAC', valor: v.totalSac, sinal: 'debito' },
        { rotulo: 'Diferença a favor do SAC', valor: v.economiaDoSac, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Parcela fixa no Price', valor: formatar(v.parcelaPriceConstante) },
        { rotulo: '1ª parcela no SAC', valor: formatar(v.primeiraParcelaSac) },
        { rotulo: 'Última parcela no SAC', valor: formatar(v.ultimaParcelaSac) },
      ],
      tabela: {
        titulo: 'Evolução ao fim de cada ano',
        colunas: ['Parcela SAC', 'Parcela Price', 'Saldo SAC', 'Saldo Price'],
        linhas: v.evolucao.map((linha) => ({
          rotulo: `Ano ${linha.ano}`,
          valores: [linha.parcelaSac, linha.parcelaPrice, linha.saldoSac, linha.saldoPrice],
        })),
      },
      notas: [
        'O SAC custa menos no total porque amortiza mais cedo — e cobra mais nas primeiras ' +
          'parcelas. Escolher entre os dois é escolher entre pagar menos no fim e caber no ' +
          'orçamento agora.',
        'O cálculo considera apenas juros e amortização. Seguros obrigatórios e taxa de ' +
          'administração variam por banco e por idade, e não entram aqui.',
      ],
    },
  }
}

/** Formata para os destaques, que são texto. */
function formatar(valor: number): string {
  const inteiro = Math.trunc(Math.abs(valor) / 100)
  const cents = Math.abs(valor) % 100
  const comSeparador = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `R$ ${comSeparador},${String(cents).padStart(2, '0')}`
}

export const AMORTIZACAO: DefinicaoCalculadora = {
  id: 'CALC-025',
  slug: 'amortizacao-sac-price',
  nome: 'Amortização — SAC vs. Price',
  linhaDeContexto:
    'Quanto muda entre parcela fixa e parcela decrescente — no bolso e no total.',
  descricaoSeo:
    'Compare os sistemas SAC e Price no mesmo financiamento: parcela inicial, parcela final, total pago e a evolução do saldo devedor ano a ano.',

  campos: [
    {
      id: 'principal',
      rotulo: 'Valor financiado',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'prazoMeses',
      rotulo: 'Prazo em meses',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 600,
    },
    {
      id: 'taxaMensal',
      rotulo: 'Taxa de juros ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'A taxa do contrato. Para comparar propostas, use o CET.',
    },
  ],

  parametrosRequeridos: [],

  rotuloResultado: 'Diferença a favor do SAC',

  calcular,

  faq: [
    {
      pergunta: 'Qual sistema é melhor?',
      resposta:
        'Depende do que aperta. O SAC custa menos no total, porque amortiza mais cedo e os juros incidem sobre um saldo que cai mais rápido. Em troca, a primeira parcela é maior — às vezes bem maior. O Price mantém a parcela fixa do começo ao fim, o que facilita o orçamento e custa mais no total.',
    },
    {
      pergunta: 'Por que a parcela do SAC diminui?',
      resposta:
        'Porque a amortização é constante e os juros não. Todo mês você devolve a mesma fatia do principal, e os juros incidem sobre o que ainda resta — que diminui em passos iguais. A parcela é a soma das duas coisas, então ela cai de forma regular.',
    },
    {
      pergunta: 'No Price eu pago só juros no começo?',
      resposta:
        'Quase. A prestação é constante, mas sua composição muda: no início a maior parte é juro e uma fatia pequena amortiza; com o tempo a proporção se inverte. Por isso quitar um financiamento Price nos primeiros anos abate menos saldo do que a intuição sugere.',
    },
    {
      pergunta: 'A tabela mostra todas as parcelas?',
      resposta:
        'Não. Ela resume o fim de cada ano, com a parcela do mês e o saldo devedor nos dois sistemas. Um financiamento de 30 anos tem 360 parcelas, e uma lista com todas elas não é memória de cálculo — é ruído. A memória mostra as fórmulas e os totais.',
    },
    {
      pergunta: 'Esse valor é o que o banco vai cobrar?',
      resposta:
        'É uma estimativa com base na taxa que você informou. Financiamentos reais incluem seguros obrigatórios e taxa de administração, que variam por banco e por idade do tomador e não entram neste cálculo. Para comparar propostas, o número certo é o CET.',
    },
  ],

  relacionadas: ['cet-custo-efetivo-total', 'juros-compostos'],
}
