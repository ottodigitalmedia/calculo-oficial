/**
 * CALC-112 — Férias vencidas pagas em dobro.
 *
 * Quem tira as férias depois do prazo recebe em dobro — mas só os dias que
 * caírem depois do prazo (Súmula 81 do TST). A página mostra o prazo, os dias
 * de cada lado e o quanto a dobra acrescenta.
 *
 * Motor em `engine/calculadoras/ferias-em-dobro.ts`.
 */

import { calcularFeriasEmDobro } from '../engine/calculadoras/ferias-em-dobro'
import { lerData } from '../engine/datas'
import { centavos } from '../engine/types'
import { formatarData, formatarReal } from '../format/moeda'
import { FERIAS_FORA_DO_PRAZO } from '../params/data/ferias-fora-do-prazo'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(FERIAS_FORA_DO_PRAZO)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  // A regra aplicada é a vigente no início das férias (`vigenciaPelaData`).
  const inicioDasFerias = texto(valores, 'inicioFerias')
  const dataDoFato = lerData(inicioDasFerias) === null ? dataReferencia : (inicioDasFerias as DataISO)
  const r = calcularFeriasEmDobro(
    {
      salario: centavos(numero(valores, 'salario')),
      inicioDoAquisitivo: texto(valores, 'inicioAquisitivo'),
      inicioDasFerias,
      dias: numero(valores, 'dias'),
    },
    dataDoFato,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.total,
      detalhamento: [
        ...(v.diasSimples > 0 ? [{ rotulo: `${v.diasSimples} dias dentro do prazo, com o terço`, valor: v.valorSimples, sinal: 'credito' as const }] : []),
        ...(v.diasEmDobro > 0 ? [{ rotulo: `${v.diasEmDobro} dias em dobro, com o terço`, valor: v.valorEmDobro, sinal: 'credito' as const }] : []),
        { rotulo: 'Acréscimo pela dobra', valor: v.acrescimoDaDobra, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Prazo para conceder as férias', valor: `até ${formatarData(v.fimDoConcessivo)}` },
        { rotulo: 'Dias em dobro', valor: `${v.diasEmDobro}` },
        ...(v.acrescimoDaDobra > 0 ? [{ rotulo: 'A dobra acrescenta', valor: formatarReal(v.acrescimoDaDobra) }] : []),
      ],
      notas: [
        'Só os dias gozados depois do prazo são pagos em dobro (Súmula 81 do TST). Férias que começam dentro do ' +
          'prazo e terminam fora dele têm a dobra apenas nos dias de fora.',
        'A dobra incide sobre a remuneração de férias, que já inclui o terço constitucional.',
        'Adicionais habituais — horas extras, noturno, insalubridade, periculosidade — entram no salário informado ' +
          'pela média do período aquisitivo (art. 142 da CLT).',
        'Valores brutos: INSS e imposto de renda ainda incidem.',
      ],
    },
  }
}

export const FERIAS_EM_DOBRO: DefinicaoCalculadora = {
  id: 'CALC-112',
  slug: 'ferias-em-dobro',
  nome: 'Férias vencidas em dobro',
  linhaDeContexto: 'Tirou férias depois do prazo? Os dias de fora do prazo são pagos em dobro, com o terço.',
  descricaoSeo:
    'Calcule as férias vencidas pagas em dobro: o prazo para conceder, os dias fora do prazo e o valor com o terço constitucional, dia a dia.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário mensal',
      tipo: 'monetario',
      obrigatorio: true,
      padrao: 300_000,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Com a média dos adicionais habituais do período aquisitivo.',
    },
    {
      id: 'inicioAquisitivo',
      rotulo: 'Início do período aquisitivo',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'A data de admissão, ou o aniversário dela no ano em que o período começou.',
    },
    {
      id: 'inicioFerias',
      rotulo: 'Primeiro dia das férias',
      tipo: 'data',
      obrigatorio: true,
    },
    {
      id: 'dias',
      rotulo: 'Dias de férias',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 30,
      minimo: 1,
      maximo: 30,
      ajuda: 'Trinta, salvo faltas injustificadas no período aquisitivo (art. 130 da CLT) ou venda de dez dias.',
    },
  ],

  parametrosRequeridos: ['ferias-periodo-aquisitivo-meses', 'ferias-periodo-concessivo-meses', 'ferias-fora-do-prazo-fator'],
  vigenciaPelaData: 'inicioFerias',

  rotuloResultado: 'Total das férias',

  calcular,

  faq: [
    {
      pergunta: 'Quando as férias são pagas em dobro?',
      resposta:
        'Quando são concedidas depois do prazo: o empregador tem doze meses, contados do fim do período aquisitivo, para conceder as férias (art. 134 da CLT). Depois disso, a remuneração é paga em dobro (art. 137).',
    },
    {
      pergunta: 'As férias inteiras dobram?',
      resposta:
        'Não necessariamente. Pela Súmula 81 do TST, os DIAS gozados depois do prazo é que são pagos em dobro. Férias que começam no último mês do prazo e terminam depois dele têm a dobra só nos dias de fora.',
    },
    {
      pergunta: 'O terço constitucional também dobra?',
      resposta:
        'A dobra incide sobre a remuneração de férias, e a remuneração de férias inclui o terço previsto no art. 7º, XVII, da Constituição. Cada dia fora do prazo vale duas vezes o dia de férias com o terço.',
    },
    {
      pergunta: 'Como sei qual é o meu período aquisitivo?',
      resposta:
        'É cada período de doze meses de contrato, contado da admissão (art. 130 da CLT). Quem foi admitido em 10 de março tem períodos aquisitivos de 10 de março a 9 de março do ano seguinte.',
    },
    {
      pergunta: 'E se eu for demitido com férias vencidas?',
      resposta:
        'Na rescisão, as férias cujo prazo de concessão já passou são pagas em dobro, com o terço (art. 146 da CLT). A calculadora de rescisão soma as férias vencidas de forma simples; se o prazo já tinha passado, esta página mostra quanto a dobra acrescenta.',
    },
  ],

  relacionadas: ['ferias', 'rescisao-sem-justa-causa', 'salario-liquido', 'decimo-terceiro'],
}
