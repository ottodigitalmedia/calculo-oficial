/**
 * CALC-032 — Capacidade de financiamento.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O ponto delicado é o percentual de comprometimento.** Os "30% da renda" que
 * todo mundo repete não estão em lei nenhuma — são política de crédito, variam
 * por banco e por linha, e o Banco Central não os fixa. Por isso o campo tem
 * padrão declarado como praxe de mercado, e a memória de cálculo diz, na etapa,
 * que o número foi informado pelo usuário.
 */

import { calcularCapacidade } from '../engine/calculadoras/capacidade'
import { basisPoints, centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const entradaDoUsuario = centavos(numero(valores, 'entrada'))

  const r = calcularCapacidade(
    {
      rendaMensal: centavos(numero(valores, 'rendaMensal')),
      dividasAtuais: centavos(numero(valores, 'dividasAtuais')),
      comprometimentoBp: basisPoints(numero(valores, 'comprometimento')),
      taxaMensal: basisPoints(numero(valores, 'taxaMensal')),
      prazoMeses: numero(valores, 'prazoMeses'),
      entrada: entradaDoUsuario,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorTotalDoBem,
      detalhamento: [
        { rotulo: 'Valor financiável', valor: v.valorFinanciavel, sinal: 'neutro' },
        ...(entradaDoUsuario > 0
          ? ([{ rotulo: 'Entrada informada', valor: entradaDoUsuario, sinal: 'neutro' }] as const)
          : []),
        { rotulo: 'Teto do bem', valor: v.valorTotalDoBem, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Parcela máxima', valor: formatarReal(v.parcelaMaxima) },
        { rotulo: 'Total pago ao fim do prazo', valor: formatarReal(v.totalPago) },
        { rotulo: 'Juros ao longo do contrato', valor: formatarReal(v.jurosTotais) },
      ],
      notas: [
        'O percentual de comprometimento da renda NÃO está em lei. Ele é política de crédito de ' +
          'cada instituição, varia por banco, por linha e por perfil — o valor usado aqui foi ' +
          'você quem informou, e o banco pode admitir mais ou menos.',
        'Financiamentos reais incluem seguros obrigatórios e taxa de administração, que entram na ' +
          'parcela e reduzem o valor financiável. Para comparar propostas de verdade, o número ' +
          'certo é o CET.',
        'Alongar o prazo reduz a parcela e aumenta muito o total. Compare o valor dos juros acima ' +
          'entre dois prazos antes de escolher o mais longo só porque a parcela cabe.',
      ],
    },
  }
}

export const CAPACIDADE: DefinicaoCalculadora = {
  id: 'CALC-032',
  slug: 'capacidade-de-financiamento',
  nome: 'Capacidade de financiamento',
  linhaDeContexto: 'Quanto de financiamento a sua renda sustenta — e quanto ele custa no total.',
  descricaoSeo:
    'Descubra quanto você consegue financiar a partir da renda, das parcelas já comprometidas, da taxa e do prazo. Veja a parcela máxima, o teto do bem e os juros do contrato.',

  campos: [
    {
      id: 'rendaMensal',
      rotulo: 'Renda mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'Bancos costumam considerar a renda bruta comprovável, e somam a do cônjuge quando há.',
    },
    {
      id: 'comprometimento',
      rotulo: 'Percentual da renda que o banco admite comprometer',
      tipo: 'percentual',
      padrao: 3_000,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'Trinta por cento é a praxe mais comum — não é regra legal, e varia por instituição.',
    },
    {
      id: 'dividasAtuais',
      rotulo: 'Parcelas mensais já comprometidas',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Outros financiamentos e empréstimos. O banco olha o comprometimento total.',
    },
    {
      id: 'taxaMensal',
      rotulo: 'Taxa de juros ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 0,
      maximo: 10_000,
    },
    {
      id: 'prazoMeses',
      rotulo: 'Prazo em meses',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 420,
    },
    {
      id: 'entrada',
      rotulo: 'Entrada disponível',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Soma direto ao teto do bem, sem juros por cima.',
    },
  ],

  // Sem parâmetro legal: tudo o que entra é digitado.
  parametrosRequeridos: [],

  rotuloResultado: 'Teto do bem que a sua renda sustenta',

  calcular,

  faq: [
    {
      pergunta: 'A regra dos 30% da renda está em lei?',
      resposta:
        'Não. É praxe de mercado, não norma. Cada instituição define o comprometimento que admite, e isso varia por linha de crédito e por perfil do tomador — alguns bancos trabalham com 25%, outros aceitam mais em financiamento imobiliário com garantia real. Por isso o percentual aqui é campo, e não um parâmetro legal do sistema.',
    },
    {
      pergunta: 'Por que as minhas outras parcelas entram na conta?',
      resposta:
        'Porque o banco avalia o comprometimento TOTAL da renda, não só o do contrato novo. Um financiamento de veículo em andamento reduz a margem disponível para o imobiliário na mesma medida. Informar as parcelas atuais é o que aproxima o resultado do que a análise de crédito vai encontrar.',
    },
    {
      pergunta: 'Esse é o valor que o banco vai aprovar?',
      resposta:
        'É uma estimativa a partir dos números que você informou. A aprovação depende ainda de análise de crédito, avaliação do bem dado em garantia, idade do tomador e comprovação de renda. E financiamentos reais incluem seguros obrigatórios e taxa de administração, que entram na parcela e reduzem o valor financiável.',
    },
    {
      pergunta: 'Vale a pena alongar o prazo para caber na parcela?',
      resposta:
        'Depende do que se quer otimizar. Alongar reduz a parcela e aumenta muito o total pago — em prazos longos, os juros costumam superar o valor financiado. Rode a calculadora com dois prazos diferentes e compare o campo de juros: a diferença costuma surpreender.',
    },
    {
      pergunta: 'A entrada muda o quanto eu consigo financiar?',
      resposta:
        'Não muda o valor financiável, que depende só da parcela que cabe na renda. Mas ela soma direto ao teto do bem, porque não é financiada — cada real de entrada vale um real a mais de imóvel ou veículo, sem juros por cima. É por isso que a entrada é a alavanca mais barata que existe nesse cálculo.',
    },
  ],

  relacionadas: ['amortizacao-sac-price', 'cet-custo-efetivo-total', 'quitacao-antecipada'],
}
