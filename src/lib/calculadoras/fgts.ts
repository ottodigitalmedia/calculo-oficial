/**
 * CALC-007 — FGTS: saldo acumulado e multa rescisória.
 *
 * Campos e microcopy de `03-functional-spec` §3.7, usados literalmente.
 *
 * **`RN-023` governa esta calculadora inteira.** O saldo real inclui correção
 * monetária e juros e só existe no extrato da conta vinculada; tudo o que se
 * pode fazer a partir do salário é uma **estimativa**, e ela precisa ser
 * declarada como tal em todo lugar onde aparece — no aviso, na nota e na
 * memória.
 *
 * Regras: `RN-021` a `RN-023`.
 */

import { calcularFgts } from '../engine/calculadoras/jornada-e-fgts'
import { centavos } from '../engine/types'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Registro montado no módulo adiado — ver a nota em `salario-liquido.ts`. */
const registro = construirRegistro(TRABALHISTA)

const MOTIVOS = ['trabalhando', 'sem-justa-causa', 'pedido-demissao', 'acordo-mutuo'] as const
type Motivo = (typeof MOTIVOS)[number]

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const escolha = texto(valores, 'motivoSaida')
  const motivo: Motivo = (MOTIVOS as readonly string[]).includes(escolha)
    ? (escolha as Motivo)
    : 'trabalhando'

  const r = calcularFgts(
    {
      salario: centavos(numero(valores, 'salario')),
      mesesTrabalhados: numero(valores, 'mesesTrabalhados'),
      incluir13: texto(valores, 'incluir13') !== 'nao',
      motivoSaida: motivo,
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.totalComMulta,
      detalhamento: [
        { rotulo: 'Depósito mensal', valor: v.depositoMensal, sinal: 'neutro' },
        { rotulo: 'Saldo estimado dos depósitos', valor: v.saldoEstimado, sinal: 'credito' },
        // §3.7: o bloco de multa só aparece quando o motivo a comporta.
        ...(v.temMulta
          ? ([{ rotulo: 'Multa rescisória', valor: v.multa, sinal: 'credito' }] as const)
          : []),
        { rotulo: 'Total estimado', valor: v.totalComMulta, sinal: 'neutro' },
      ],
      destaques: [
        {
          rotulo: 'Multa aplicada',
          valor: v.temMulta ? `${(v.percentualMulta / 100).toFixed(0)}%` : 'não devida',
        },
      ],
      notas: [
        'ESTIMATIVA. O saldo real inclui correção monetária e juros, e ignora aumentos, faltas ' +
          'e afastamentos. O valor exato está no extrato da conta vinculada, no aplicativo do ' +
          'FGTS ou na Caixa.',
        ...(motivo === 'acordo-mutuo'
          ? [
              'Na extinção por acordo, a movimentação da conta é limitada a 80% dos depósitos ' +
                '(CLT, art. 484-A, § 1º), e não há direito ao seguro-desemprego.',
            ]
          : []),
        ...(motivo === 'pedido-demissao'
          ? [
              'No pedido de demissão não há multa nem direito ao saque, salvo nas hipóteses ' +
                'previstas em lei.',
            ]
          : []),
      ],
    },
  }
}

export const FGTS: DefinicaoCalculadora = {
  id: 'CALC-007',
  slug: 'fgts',
  nome: 'FGTS — saldo e multa',
  linhaDeContexto:
    'Quanto deve ter na sua conta do FGTS e quanto é a multa, conforme o motivo da saída.',
  descricaoSeo:
    'Estime o saldo do FGTS a partir do salário e do tempo de contrato, e a multa rescisória de 40% ou 20%. Veja a norma de cada percentual e a vigência aplicada.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário bruto mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'mesesTrabalhados',
      rotulo: 'Meses de contrato',
      tipo: 'inteiro',
      obrigatorio: true,
      minimo: 1,
      maximo: 600,
    },
    {
      id: 'incluir13',
      rotulo: 'Incluir 13º salário no cálculo?',
      tipo: 'selecao',
      padrao: 'sim',
      opcoes: [
        { valor: 'sim', rotulo: 'Sim' },
        { valor: 'nao', rotulo: 'Não' },
      ],
      ajuda: 'A lei inclui a gratificação natalina na base do depósito.',
    },
    {
      id: 'motivoSaida',
      rotulo: 'Motivo da saída',
      tipo: 'selecao',
      padrao: 'trabalhando',
      opcoes: [
        { valor: 'trabalhando', rotulo: 'Ainda trabalhando' },
        { valor: 'sem-justa-causa', rotulo: 'Demissão sem justa causa' },
        { valor: 'pedido-demissao', rotulo: 'Pedido de demissão' },
        { valor: 'acordo-mutuo', rotulo: 'Acordo mútuo' },
      ],
    },
  ],

  parametrosRequeridos: ['fgts-aliquota-deposito'],

  rotuloResultado: 'Total estimado do FGTS',

  calcular,

  // `RN-023` — aviso próprio, sempre presente.
  avisoAdicional:
    'O saldo aqui é ESTIMADO a partir do salário informado. O valor real inclui correção ' +
    'monetária e juros e consta apenas do extrato da conta vinculada.',

  faq: [
    {
      pergunta: 'Por que o valor não bate com o meu extrato?',
      resposta:
        'Porque esta é uma estimativa a partir do salário atual. O saldo real acumula correção monetária e juros desde cada depósito, e reflete aumentos, faltas, afastamentos e eventuais saques que o cálculo não conhece. Use o resultado para conferir a ordem de grandeza, não para substituir o extrato.',
    },
    {
      pergunta: 'Quanto é depositado por mês?',
      resposta:
        'São 8% da remuneração, conforme o art. 15 da Lei nº 8.036/1990. A lei inclui expressamente a gratificação natalina na base, e por isso o ano tem treze depósitos, não doze — é o que o campo do 13º controla.',
    },
    {
      pergunta: 'Quando tenho direito à multa?',
      resposta:
        'Na dispensa pelo empregador sem justa causa, a multa é de 40% sobre o montante dos depósitos, pelo art. 18, § 1º, da Lei nº 8.036/1990. Na extinção por acordo entre as partes ela é devida pela metade — 20% —, conforme o art. 484-A, I, da CLT. No pedido de demissão não há multa.',
    },
    {
      pergunta: 'Posso sacar tudo no acordo mútuo?',
      resposta:
        'Não. O art. 484-A, § 1º, da CLT limita a movimentação da conta a 80% do valor dos depósitos, e o § 2º afasta o direito ao seguro-desemprego. É a contrapartida de uma saída negociada.',
    },
    {
      pergunta: 'A multa incide sobre o saldo com correção?',
      resposta:
        'Sim. O art. 18, § 1º, fala em "todos os depósitos realizados na conta vinculada, atualizados monetariamente e acrescidos dos respectivos juros". Como esta calculadora estima os depósitos sem correção, a multa estimada também fica abaixo da real — informe o saldo do extrato numa calculadora de rescisão para o valor exato.',
    },
  ],

  relacionadas: ['rescisao-sem-justa-causa', 'salario-liquido', 'rescisao-pedido-demissao'],
}
