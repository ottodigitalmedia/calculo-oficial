/**
 * CALC-095 — Saque-aniversário do FGTS.
 *
 * O valor é a parte fácil. O que decide a escolha é o outro lado: quem adere
 * deixa de poder sacar o saldo na despedida sem justa causa, e voltar atrás
 * demora dois anos. A página mostra os dois números — o que entra agora e o que
 * fica preso — porque é a comparação entre eles que responde à pergunta real.
 *
 * Motor em `engine/calculadoras/saque-aniversario.ts`.
 */

import {
  calcularLimitesDaAntecipacao,
  calcularSaqueAniversario,
  PARAMETROS_ANTECIPACAO,
} from '../engine/calculadoras/saque-aniversario'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { SAQUE_ANIVERSARIO } from '../params/data/saque-aniversario'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

const registro = construirRegistro(SAQUE_ANIVERSARIO)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularSaqueAniversario(
    { saldo: centavos(numero(valores, 'saldo')) },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Alíquota da faixa', valor: formatarPercentual(v.aliquota) },
    { rotulo: 'Fatia do saldo sacada', valor: formatarPercentual(v.percentualEfetivo) },
  ]
  const notasDaAntecipacao: string[] = []
  let etapas = r.traco.etapas
  let vigencias = r.traco.vigenciasAplicadas

  /**
   * O bloco da antecipação entra por escolha. Ele não muda o saque: mostra até
   * onde a cessão pode ir, pelos limites do Conselho Curador.
   */
  if (texto(valores, 'antecipacao') === 'sim') {
    /**
     * **A data vem do campo, e não do seletor de período — é correção.** O
     * seletor resolve o ano no dia 15 de junho, e os saques cedíveis caem de
     * cinco para três em 1º/11/2026: resolvida em junho, a página mostraria o
     * limite antigo nos dois últimos meses do ano. Quem contrata sabe a data.
     */
    const quando = (texto(valores, 'dataDaContratacao') || dataReferencia) as DataISO
    const a = calcularLimitesDaAntecipacao(v.saque, quando, registro)
    if (a.ok) {
      const lim = a.valores
      destaques.push(
        { rotulo: 'Saques que podem ser cedidos', valor: `${lim.saquesMaximos}` },
        {
          rotulo: 'Cedível por saque',
          valor: lim.atendeMinimo
            ? `${formatarReal(lim.cedivelPorSaque)} — entre ${formatarReal(lim.minimoPorSaque)} e ${formatarReal(lim.maximoPorSaque)}`
            : `nada: o saque não chega ao mínimo de ${formatarReal(lim.minimoPorSaque)}`,
        },
        { rotulo: 'Total que pode ser cedido', valor: formatarReal(lim.totalCedivel) },
        { rotulo: 'Juros da antecipação', valor: `abaixo de ${formatarPercentual(lim.jurosTetoBp)} ao mês` },
      )
      notasDaAntecipacao.push(
        `A antecipação é um empréstimo com os saques futuros em garantia. Cada saque cedido fica entre ${formatarReal(lim.minimoPorSaque)} e ${formatarReal(lim.maximoPorSaque)}, uma contratação por competência de aniversário, e a anterior precisa estar quitada.`,
        `A contratação só pode ser autorizada depois de ${lim.carenciaDias} dias do início da vigência da opção pelo saque-aniversário.`,
        `As taxas têm de ficar ABAIXO de ${formatarPercentual(lim.jurosTetoBp)} ao mês — a resolução diz "inferiores", e cada banco pratica a sua.`,
        'Quanto CAI NA CONTA não está nesta estimativa: o banco desconta os juros do prazo até cada aniversário, e nenhuma norma fixa essa conta. O que está aqui é o limite do que pode ser cedido.',
        'Os saques dos próximos anos dependem do saldo de cada ano, que esta conta não conhece — ela repete o saque de hoje para todos.',
      )
      etapas = [...etapas, ...a.traco.etapas]
      vigencias = [...vigencias, ...a.traco.vigenciasAplicadas]
    } else {
      notasDaAntecipacao.push(
        'Os limites da antecipação valem a partir de 20/10/2025, quando a Resolução CCFGTS nº 1.130/2025 foi publicada. Para a data escolhida, o produto não publica esses números.',
      )
    }
  }

  return {
    ok: true,
    traco: { etapas, dataReferencia, vigenciasAplicadas: vigencias },
    valores: {
      principal: v.saque,
      detalhamento: [
        { rotulo: 'Saque-aniversário', valor: v.saque, sinal: 'credito' },
        { rotulo: 'Saldo que permanece na conta', valor: v.saldoRestante, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        ...notasDaAntecipacao,
        'A alíquota incide sobre a soma de todas as suas contas do FGTS, e não apenas sobre a do emprego ' +
          'atual. Informe o total.',
        'Aderindo ao saque-aniversário, a despedida sem justa causa deixa de liberar o saldo da conta — a ' +
          'multa rescisória continua devida pelo empregador. As demais hipóteses de saque, como doença grave ' +
          'e compra da casa própria, seguem valendo.',
        'Voltar para a sistemática do saque-rescisão só produz efeito no primeiro dia do vigésimo quinto mês ' +
          'seguinte ao pedido — dois anos de espera.',
        'A lei fala em saque anual, no mês de aniversário; o período em que ele fica disponível é definido ' +
          'pelo agente operador do Fundo — confirme a janela do seu mês no aplicativo oficial.',
      ],
    },
  }
}

export const SAQUE_ANIVERSARIO_FGTS: DefinicaoCalculadora = {
  id: 'CALC-095',
  slug: 'saque-aniversario-do-fgts',
  nome: 'Saque-aniversário do FGTS',
  linhaDeContexto: 'Quanto sai da conta no seu mês de aniversário — e quanto fica preso lá dentro.',
  descricaoSeo:
    'Calcule o saque-aniversário do FGTS pela tabela da lei: alíquota da faixa, parcela adicional, valor sacado e saldo que permanece na conta.',

  campos: [
    {
      id: 'saldo',
      rotulo: 'Saldo somado das contas do FGTS',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'Some todas as suas contas, inclusive as de empregos antigos. É esse total que a tabela usa.',
    },
    {
      id: 'antecipacao',
      rotulo: 'Mostrar os limites da antecipação em banco?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não' },
        { valor: 'sim', rotulo: 'Sim — quero ver quanto dá para antecipar' },
      ],
      ajuda: 'A antecipação é um empréstimo com os saques futuros em garantia, e o Conselho Curador limita quantos e quanto.',
    },
    {
      id: 'dataDaContratacao',
      rotulo: 'Data da contratação da antecipação',
      tipo: 'data',
      visivelSe: { campo: 'antecipacao', em: ['sim'] },
      ajuda: 'Os saques que podem ser cedidos caem de cinco para três em 1º/11/2026 — a data decide qual limite vale.',
    },
  ],

  parametrosRequeridos: ['fgts-saque-aniversario-tabela'],
  // Os limites da antecipação nasceram em 20/10/2025: antes disso, a resolução
  // não os fixava, e o saque-aniversário continua calculando sem eles.
  parametrosOpcionais: [...PARAMETROS_ANTECIPACAO],

  rotuloResultado: 'Saque-aniversário estimado',

  calcular,

  faq: [
    {
      pergunta: 'Como o valor do saque-aniversário é calculado?',
      resposta:
        'Pelo art. 20-D da Lei nº 8.036/1990: aplica-se à soma de todos os saldos das contas vinculadas a alíquota da faixa correspondente, prevista no Anexo da lei, e acrescenta-se a parcela adicional daquela mesma faixa. Quanto maior o saldo, menor a fatia sacada.',
    },
    {
      pergunta: 'Para que serve a parcela adicional?',
      resposta:
        'Para manter a tabela contínua. Sem ela, passar de uma faixa para a outra reduziria o valor do saque, e um real a mais de saldo poderia significar dezenas de reais a menos na mão. A parcela é somada ao resultado da alíquota, e não deduzida como nas tabelas do imposto de renda.',
    },
    {
      pergunta: 'O que eu perco ao aderir?',
      resposta:
        'O saque do saldo na demissão sem justa causa. O art. 20-A, § 2º, II, afasta essa hipótese de movimentação para quem está no saque-aniversário. A multa rescisória continua sendo devida pelo empregador, e as demais hipóteses de saque — aposentadoria, doença grave, compra da casa própria, entre outras — continuam valendo.',
    },
    {
      pergunta: 'Posso voltar atrás?',
      resposta:
        'Pode, mas não na hora. O art. 20-C determina que a alteração de sistemática produz efeitos no primeiro dia do vigésimo quinto mês seguinte ao pedido — dois anos. É por isso que a decisão merece a comparação entre o que se saca agora e o que fica retido.',
    },
    {
      pergunta: 'Quando posso sacar?',
      resposta:
        'O art. 20 da Lei nº 8.036/1990 prevê o saque anual, no mês de aniversário do trabalhador. Quanto tempo a janela fica aberta depois disso é regra operacional do agente que administra o Fundo, e não da lei — confirme no aplicativo oficial antes de contar com o valor.',
    },
    {
      pergunta: 'Vale a pena antecipar o saque-aniversário num banco?',
      resposta:
        'A antecipação é um empréstimo: o banco adianta os saques futuros e cobra juros por isso, com os direitos aos saques anuais cedidos em garantia — o § 3º do art. 20-D permite essa cessão e manda que as taxas fiquem abaixo das do consignado dos servidores federais. Compare mesmo assim com as demais linhas, e lembre-se de que, enquanto o contrato durar, o saque de cada ano vai para o banco.',
    },
    {
      pergunta: 'Quantos saques dá para antecipar?',
      resposta:
        'Até 31 de outubro de 2026, cinco; a partir de 1º de novembro de 2026, três. A regra permanente é a do art. 1º, § 3º, da Resolução CCFGTS nº 958/2020, na redação da nº 1.130/2025, e os cinco valem pela transição do art. 2º dessa resolução. Marque a opção na calculadora e ela responde pela data escolhida, com a norma ao lado.',
    },
    {
      pergunta: 'Existe valor mínimo e máximo por saque antecipado?',
      resposta:
        'Existe: cada saque-aniversário cedido não pode ficar abaixo de R$ 100,00 nem acima de R$ 500,00, e cabe uma contratação por competência de aniversário, com a anterior quitada. Também há carência: a autorização só pode ser dada noventa dias depois do início da opção pelo saque-aniversário.',
    },
    {
      pergunta: 'A calculadora mostra quanto o banco deposita na antecipação?',
      resposta:
        'Não, e o motivo é o mesmo de sempre aqui: nenhuma norma define o desconto que o banco aplica sobre cada parcela até o aniversário correspondente. O que a página mostra é o limite do que pode ser cedido e o teto de juros — as taxas precisam ficar abaixo de 1,80% ao mês. O valor depositado quem informa é a instituição, na proposta.',
    },
  ],

  relacionadas: ['fgts', 'rescisao-sem-justa-causa', 'emprestimo-consignado'],
}
