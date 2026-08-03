/**
 * CALC-047 — DAS-MEI, valor mensal.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A página responde uma pergunta diferente da que muita gente faz.** Quem
 * procura "quanto pago de MEI sobre o que faturei" está partindo de uma premissa
 * errada: o DAS é soma de parcelas FIXAS, e faturar mil ou seis mil no mês não
 * muda a guia. Não há campo de faturamento aqui de propósito — ele sugeriria uma
 * relação que não existe.
 *
 * **A guia sobe todo ano junto com o salário mínimo**, porque a maior parcela
 * dela é percentual do mínimo. É a explicação que quase nenhuma página dá.
 */

import { calcularDasMei } from '../engine/calculadoras/mei'
import type { AtividadeDoMei } from '../engine/calculadoras/mei'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { MEI } from '../params/data/mei'
import { construirRegistro } from '../params/registry'
import {
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(INSS, MEI)

const ATIVIDADES: readonly AtividadeDoMei[] = ['comercio', 'servicos', 'comercio-e-servicos']

function lerAtividade(valor: string): AtividadeDoMei {
  return ATIVIDADES.includes(valor as AtividadeDoMei)
    ? (valor as AtividadeDoMei)
    : 'comercio-e-servicos'
}

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularDasMei(
    { atividade: lerAtividade(texto(valores, 'atividade')) },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o total exibido. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'INSS', valor: v.inss, sinal: 'neutro' },
  ]
  if (v.icms > 0) linhas.push({ rotulo: 'ICMS', valor: v.icms, sinal: 'neutro' })
  if (v.iss > 0) linhas.push({ rotulo: 'ISS', valor: v.iss, sinal: 'neutro' })
  if (v.ibsCbs > 0) linhas.push({ rotulo: 'IBS e CBS', valor: v.ibsCbs, sinal: 'neutro' })
  linhas.push({ rotulo: 'Total do DAS', valor: v.total, sinal: 'neutro' })

  const destaques: Destaque[] = [
    { rotulo: 'Em doze meses', valor: formatarReal(v.totalAnual) },
    {
      rotulo: 'O INSS é',
      valor: `${formatarPercentual(v.percentualDoInssBp)} do salário mínimo de ${formatarReal(v.baseDoInss)}`,
    },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.total,
      detalhamento: linhas,
      destaques,
      notas: [
        'O DAS do MEI é FIXO: ele não muda com o quanto você faturou no mês. É por isso que não ' +
          'há campo de faturamento aqui — ele sugeriria uma relação que não existe.',
        'A guia sobe todo ano junto com o salário mínimo, porque a maior parcela dela é um ' +
          'percentual do mínimo. Não é reajuste da Receita: é o mínimo que subiu.',
        'O ICMS é devido por quem vende mercadoria e o ISS por quem presta serviço. Quem faz as ' +
          'duas coisas paga os dois, e é o caso mais comum de quem vende com instalação.',
        'Pagar o DAS em dia é o que mantém a contagem para os benefícios do INSS. Atraso não é ' +
          'só multa: é mês que pode não contar.',
        'Se o seu faturamento está perto do limite anual, a conta que interessa é outra — veja a ' +
          'calculadora de limite do MEI, que mostra o que acontece ao ultrapassar.',
      ],
    },
  }
}

export const DAS_MEI: DefinicaoCalculadora = {
  id: 'CALC-047',
  slug: 'das-mei',
  nome: 'DAS-MEI — valor mensal',
  linhaDeContexto: 'Quanto o MEI paga por mês — valor fixo, que não muda com o faturamento.',
  descricaoSeo:
    'Veja o valor do DAS-MEI deste ano, com INSS, ICMS e ISS separados, e entenda por que a guia sobe todo ano junto com o salário mínimo.',

  campos: [
    {
      id: 'atividade',
      rotulo: 'O que você faz',
      tipo: 'selecao',
      padrao: 'comercio-e-servicos',
      opcoes: [
        { valor: 'comercio', rotulo: 'Comércio ou indústria — vendo mercadoria' },
        { valor: 'servicos', rotulo: 'Serviços — presto serviço' },
        { valor: 'comercio-e-servicos', rotulo: 'Comércio e serviços — faço as duas coisas' },
      ],
      ajuda: 'Define se entra ICMS, ISS ou os dois. O INSS é igual nos três casos.',
    },
  ],

  parametrosRequeridos: [
    'mei-inss-percentual',
    'mei-icms-valor-fixo',
    'mei-iss-valor-fixo',
    'mei-ibs-cbs-valor-fixo',
    'salario-minimo',
  ],

  rotuloResultado: 'DAS do mês',

  calcular,

  faq: [
    {
      pergunta: 'O DAS muda conforme o quanto eu faturo?',
      resposta:
        'Não. É um valor fixo mensal, e essa é a característica que define o regime do MEI: você paga o mesmo faturando mil ou seis mil reais no mês. O faturamento importa por outro motivo — ele tem um teto anual, e ultrapassá-lo tira você do regime. Por isso esta página não tem campo de faturamento: ele sugeriria uma relação que não existe.',
    },
    {
      pergunta: 'Por que o valor da guia subiu este ano?',
      resposta:
        'Porque a maior parcela do DAS é um percentual do salário mínimo, e o mínimo subiu. A lei escreve um valor em reais de 2008 e manda reajustá-lo mantendo equivalência com essa contribuição — é o percentual que vale na prática. As parcelas de ICMS e ISS, essas sim, são valores fixos em reais e ficam paradas.',
    },
    {
      pergunta: 'Pago ICMS, ISS ou os dois?',
      resposta:
        'Depende do que você faz. Quem vende mercadoria é contribuinte de ICMS; quem presta serviço é contribuinte de ISS; quem faz as duas coisas paga as duas parcelas. Um vendedor que instala o que vende costuma cair no terceiro caso. Na dúvida, o CNAE registrado no seu CNPJ é o que decide, e ele aparece no seu Certificado da Condição de MEI.',
    },
    {
      pergunta: 'O que acontece se eu atrasar o DAS?',
      resposta:
        'Além dos acréscimos por atraso, o mês pode não contar para os benefícios do INSS, e essa é a parte que costuma doer mais tarde. A contagem de tempo depende do recolhimento, e a regularização posterior nem sempre recompõe tudo automaticamente. Se houver atraso, o valor atualizado é gerado no próprio portal do Simples Nacional.',
    },
    {
      pergunta: 'A reforma tributária vai mudar o DAS?',
      resposta:
        'Vai, e a lei já fixou como. A partir de 2027 entram duas parcelas novas no valor fixo — IBS e CBS — e as de ICMS e ISS começam a diminuir ano a ano, até desaparecerem em 2033. Os valores de cada ano estão em anexo da própria lei complementar, e esta calculadora já os utiliza conforme a data de referência escolhida.',
    },
  ],

  relacionadas: ['limite-do-mei', 'inss-autonomo-e-facultativo', 'precificacao-de-hora'],
}
