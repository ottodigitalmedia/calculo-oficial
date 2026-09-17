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

import { calcularSaqueAniversario } from '../engine/calculadoras/saque-aniversario'
import { centavos } from '../engine/types'
import { formatarPercentual } from '../format/moeda'
import { SAQUE_ANIVERSARIO } from '../params/data/saque-aniversario'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(SAQUE_ANIVERSARIO)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularSaqueAniversario(
    { saldo: centavos(numero(valores, 'saldo')) },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.saque,
      detalhamento: [
        { rotulo: 'Saque-aniversário', valor: v.saque, sinal: 'credito' },
        { rotulo: 'Saldo que permanece na conta', valor: v.saldoRestante, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Alíquota da faixa', valor: formatarPercentual(v.aliquota) },
        { rotulo: 'Fatia do saldo sacada', valor: formatarPercentual(v.percentualEfetivo) },
      ],
      notas: [
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
  ],

  parametrosRequeridos: ['fgts-saque-aniversario-tabela'],

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
  ],

  relacionadas: ['fgts', 'rescisao-sem-justa-causa', 'emprestimo-consignado'],
}
