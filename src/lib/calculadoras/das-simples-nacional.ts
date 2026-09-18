/**
 * CALC-116 — DAS do Simples Nacional.
 *
 * A pergunta de quem sai do MEI, ou abre uma empresa no Simples: quanto vai
 * ser a guia do mês. A resposta passa por três coisas que confundem — o anexo
 * certo, a receita de doze meses (e não a do mês) e a alíquota efetiva, que é
 * menor que a da tabela.
 *
 * Motor em `engine/calculadoras/simples-das.ts`.
 */

import { PARAMETROS_DAS, calcularDas, type Atividade } from '../engine/calculadoras/simples-das'
import { centavos } from '../engine/types'
import { formatarComCasas, formatarPercentual, formatarReal } from '../format/moeda'
import { SIMPLES_NACIONAL } from '../params/data/simples-nacional'
import { construirRegistro } from '../params/registry'
import { basisPoints } from '../engine/types'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(SIMPLES_NACIONAL)

const ATIVIDADES: readonly Atividade[] = ['comercio', 'industria', 'servicos-anexo-iii', 'servicos-anexo-iv', 'servicos-fator-r']

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const atividade = ATIVIDADES.find((a) => a === texto(valores, 'atividade')) ?? 'comercio'
  const r = calcularDas(
    {
      atividade,
      rbt12: centavos(numero(valores, 'rbt12')),
      receitaDoMes: centavos(numero(valores, 'receitaDoMes')),
      folha12: centavos(numero(valores, 'folha12')),
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
      principal: v.das,
      detalhamento: [
        { rotulo: 'Receita do mês', valor: centavos(numero(valores, 'receitaDoMes')), sinal: 'neutro' },
        { rotulo: 'DAS do mês', valor: v.das, sinal: 'debito' },
      ],
      destaques: [
        { rotulo: 'Anexo e faixa', valor: `Anexo ${v.anexo}, ${v.faixa}ª faixa` },
        { rotulo: 'Alíquota nominal da faixa', valor: formatarPercentual(basisPoints(v.aliquotaNominalBp)) },
        { rotulo: 'Alíquota efetiva — a que se paga', valor: `${formatarComCasas(v.efetivaCentesimosBp, 4)}%` },
        ...(v.fatorRBp !== null ? [{ rotulo: 'Fator R', valor: formatarPercentual(basisPoints(v.fatorRBp)) }] : []),
        { rotulo: 'Parcela a deduzir', valor: formatarReal(v.parcelaDeduzir) },
      ],
      notas: [
        'A faixa é escolhida pela receita dos DOZE MESES anteriores, e a alíquota efetiva é aplicada sobre a receita do mês.',
        ...(v.anexo === 'IV'
          ? ['No Anexo IV a contribuição patronal sobre a folha não está no DAS — ela é recolhida à parte.']
          : []),
        ...(v.acimaDoSublimite
          ? ['Na última faixa, a partilha da lei não inclui ICMS nem ISS: eles passam a ser recolhidos fora do DAS, pelas regras normais.']
          : []),
        'Empresa com menos de doze meses usa uma receita proporcional, e há receitas com tratamento próprio — exportação, substituição tributária, ISS retido. Esta estimativa não as separa.',
        'Os anexos valem até 31/12/2026: a partir de 2027 a reforma tributária os substitui (LC nº 214/2025).',
      ],
    },
  }
}

export const DAS_SIMPLES_NACIONAL: DefinicaoCalculadora = {
  id: 'CALC-116',
  slug: 'das-simples-nacional',
  nome: 'DAS do Simples Nacional',
  linhaDeContexto: 'Quanto a empresa paga de Simples no mês: o anexo, a faixa e a alíquota efetiva — menor que a da tabela.',
  descricaoSeo:
    'Calcule o DAS do Simples Nacional: anexo por atividade, fator R, faixa pela receita de doze meses e a alíquota efetiva aplicada sobre a receita do mês.',

  campos: [
    {
      id: 'atividade',
      rotulo: 'Atividade',
      tipo: 'selecao',
      padrao: 'comercio',
      opcoes: [
        { valor: 'comercio', rotulo: 'Comércio — Anexo I' },
        { valor: 'industria', rotulo: 'Indústria — Anexo II' },
        { valor: 'servicos-anexo-iii', rotulo: 'Serviços sempre no Anexo III' },
        { valor: 'servicos-anexo-iv', rotulo: 'Serviços do Anexo IV (construção, limpeza, vigilância, advocacia)' },
        { valor: 'servicos-fator-r', rotulo: 'Serviços sujeitos ao fator R — Anexo III ou V' },
      ],
    },
    {
      id: 'rbt12',
      rotulo: 'Receita dos últimos 12 meses',
      tipo: 'monetario',
      obrigatorio: true,
      padrao: 50_000_000,
      minimo: 0,
      maximo: 480_000_000,
      ajuda: 'A receita bruta dos doze meses anteriores ao mês que está sendo apurado.',
    },
    {
      id: 'receitaDoMes',
      rotulo: 'Receita do mês',
      tipo: 'monetario',
      obrigatorio: true,
      padrao: 4_000_000,
      minimo: 0,
      maximo: 480_000_000,
    },
    {
      id: 'folha12',
      rotulo: 'Folha dos últimos 12 meses',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 480_000_000,
      ajuda: 'Salários, pró-labore, contribuição patronal e FGTS pagos em doze meses. Decide entre o Anexo III e o V.',
      visivelSe: { campo: 'atividade', em: ['servicos-fator-r'] },
    },
  ],

  parametrosRequeridos: [...PARAMETROS_DAS, 'simples-fator-r-limite'],

  rotuloResultado: 'DAS do mês',

  calcular,

  faq: [
    {
      pergunta: 'Como se calcula o DAS do Simples Nacional?',
      resposta:
        'A receita dos doze meses anteriores define a faixa do anexo. Com ela se calcula a alíquota efetiva — (receita de doze meses × alíquota nominal − parcela a deduzir) ÷ receita de doze meses, pelo art. 18, § 1º-A, da LC nº 123/2006 —, e essa alíquota é aplicada sobre a receita do mês.',
    },
    {
      pergunta: 'Por que a alíquota que eu pago é menor que a da tabela?',
      resposta:
        'Porque a da tabela é a nominal, da faixa inteira. A parcela a deduzir corrige o valor para que a alíquota maior só pese sobre a parte da receita que passou da faixa anterior. A que se paga é a efetiva.',
    },
    {
      pergunta: 'O que é o fator R?',
      resposta:
        'É a folha de pagamento dos doze meses — salários, pró-labore, contribuição patronal e FGTS — dividida pela receita dos doze meses. Para vários serviços, se ela fica em 28% ou mais, a empresa vai para o Anexo III; abaixo disso, para o Anexo V, que é mais caro.',
    },
    {
      pergunta: 'Qual anexo é o meu?',
      resposta:
        'Comércio no Anexo I e indústria no Anexo II. Os serviços se dividem entre os Anexos III, IV e V conforme a lista do art. 18 da LC nº 123/2006 — a classificação exata depende do CNAE e vale confirmar com o contador.',
    },
    {
      pergunta: 'Isso muda com a reforma tributária?',
      resposta:
        'Muda a partir de 2027: a LC nº 214/2025 substitui os anexos da LC nº 123/2006. As tabelas desta calculadora valem até 31 de dezembro de 2026.',
    },
  ],

  relacionadas: ['das-mei', 'limite-do-mei', 'clt-ou-pj', 'pro-labore'],
}
