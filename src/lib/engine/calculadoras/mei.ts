/**
 * CALC-047 — DAS-MEI · CALC-052 — Limite de faturamento e desenquadramento.
 *
 * As duas leem o mesmo artigo — o 18-A da LC 123/2006 — e por isso dividem
 * módulo, como férias e 13º dividem o deles.
 *
 * **O DAS do MEI é soma de parcelas FIXAS, e é isso que define o regime.**
 * Faturar mil ou seis mil no mês não muda a guia. Quem chega procurando "quanto
 * pago de MEI sobre o que faturei" está fazendo a pergunta errada, e a página
 * precisa responder a pergunta certa sem fingir que a errada faz sentido.
 *
 * **O valor do INSS é percentual, e não valor fixo em reais.** A alínea "a" traz
 * R$ 45,65, de 2008, e o § 11 manda reajustá-lo mantendo equivalência com os 5%
 * do § 2º do art. 21 da Lei nº 8.212. Ver a nota longa em `params/data/mei.ts`.
 *
 * **A partir de 2027 a composição muda**, pelo Anexo VII da LC 214/2025: entram
 * IBS e CBS, e de 2033 em diante o ICMS e o ISS somem. As vigências já estão
 * cadastradas, e o motor não sabe de nada disso — ele soma o que o registro
 * resolver na data.
 */

import { aplicarAliquota, multiplicarPorInteiro, naoNegativo, somar, subtrair } from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { ZERO, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const MESES_NO_ANO = 12
const POLITICA = 'meio_para_cima' as const

export const PARAMETROS_DAS_MEI = [
  'mei-inss-percentual',
  'mei-icms-valor-fixo',
  'mei-iss-valor-fixo',
  'mei-ibs-cbs-valor-fixo',
  'salario-minimo',
] as const

export const PARAMETROS_LIMITE_MEI = [
  'mei-limite-receita-anual',
  'mei-limite-mensal-inicio',
  'mei-tolerancia-excesso',
] as const

// ---------------------------------------------------------------------------
// CALC-047 — o valor do DAS
// ---------------------------------------------------------------------------

/** Quais tributos o MEI recolhe além do INSS, conforme a atividade. */
export type AtividadeDoMei = 'comercio' | 'servicos' | 'comercio-e-servicos'

export interface EntradaDasMei {
  readonly atividade: AtividadeDoMei
}

export interface SaidaDasMei {
  readonly inss: Centavos
  readonly icms: Centavos
  readonly iss: Centavos
  readonly ibsCbs: Centavos
  readonly total: Centavos
  readonly totalAnual: Centavos
  readonly baseDoInss: Centavos
  readonly percentualDoInssBp: BasisPoints
}

export function calcularDasMei(
  entrada: EntradaDasMei,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaDasMei> {
  const minimo = registro.resolver('salario-minimo', dataReferencia)
  if (!minimo.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: minimo.detalhe }
  if (minimo.resolvida.vigencia.valor.tipo !== 'valor_monetario') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Salário mínimo não é monetário.' }
  }

  const percentualInss = registro.resolver('mei-inss-percentual', dataReferencia)
  if (!percentualInss.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: percentualInss.detalhe }
  }
  if (percentualInss.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O INSS do MEI não é percentual.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)

  const baseDoInss = centavos(minimo.resolvida.vigencia.valor.centavos)
  const percentualDoInssBp = percentualInss.resolvida.vigencia.valor.aliquotaBp as BasisPoints
  const inss = aplicarAliquota(baseDoInss, percentualDoInssBp, POLITICA)

  traco.passoComParametro(
    'INSS — a maior parcela da guia',
    `${reais(baseDoInss)} de salário mínimo × ${percentual(percentualDoInssBp)}`,
    inss,
    percentualInss.resolvida,
    'A lei escreve um valor em reais de 2008, e manda reajustá-lo mantendo equivalência com os ' +
      '5% sobre o limite mínimo. É o percentual que vale, e por isso a guia sobe todo ano junto ' +
      'com o salário mínimo.',
  )

  const cobraIcms = entrada.atividade !== 'servicos'
  const cobraIss = entrada.atividade !== 'comercio'

  const icms = cobraIcms ? valorOuZero(registro, 'mei-icms-valor-fixo', dataReferencia) : ZERO
  const iss = cobraIss ? valorOuZero(registro, 'mei-iss-valor-fixo', dataReferencia) : ZERO
  const ibsCbs = valorOuZero(registro, 'mei-ibs-cbs-valor-fixo', dataReferencia)

  const icmsResolvido = registro.resolver('mei-icms-valor-fixo', dataReferencia)
  if (!icmsResolvido.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: icmsResolvido.detalhe }
  }

  if (cobraIcms && icms > 0) {
    traco.passoComParametro(
      'ICMS — valor fixo de quem vende mercadoria',
      'Valor fixo mensal, independente do que foi faturado',
      icms,
      icmsResolvido.resolvida,
    )
  }

  if (cobraIss && iss > 0) {
    const issResolvido = registro.resolver('mei-iss-valor-fixo', dataReferencia)
    if (issResolvido.ok) {
      traco.passoComParametro(
        'ISS — valor fixo de quem presta serviço',
        'Valor fixo mensal, independente do que foi faturado',
        iss,
        issResolvido.resolvida,
      )
    }
  }

  if (ibsCbs > 0) {
    const ibsResolvido = registro.resolver('mei-ibs-cbs-valor-fixo', dataReferencia)
    if (ibsResolvido.ok) {
      traco.passoComParametro(
        'IBS e CBS',
        'Valores do Anexo VII da LC nº 214/2025, somados',
        ibsCbs,
        ibsResolvido.resolvida,
        'A partir de 2027 a guia passa a incluir IBS e CBS, pela transição da reforma tributária. ' +
          'O Anexo VII fixa os valores ano a ano até 2033.',
      )
    }
  }

  const total = somar(inss, icms, iss, ibsCbs)
  traco.passo(
    'Total do DAS no mês',
    `${reais(inss)} de INSS` +
      (icms > 0 ? ` + ${reais(icms)} de ICMS` : '') +
      (iss > 0 ? ` + ${reais(iss)} de ISS` : '') +
      (ibsCbs > 0 ? ` + ${reais(ibsCbs)} de IBS e CBS` : ''),
    total,
  )

  return {
    ok: true,
    valores: {
      inss,
      icms,
      iss,
      ibsCbs,
      total,
      totalAnual: multiplicarPorInteiro(total, MESES_NO_ANO),
      baseDoInss,
      percentualDoInssBp,
    },
    traco: traco.construir(),
  }
}

/**
 * Lê um parâmetro monetário, com zero quando ele não resolve.
 *
 * Zero é resposta legítima aqui, e não falha: de 2033 em diante o Anexo VII não
 * traz mais ICMS nem ISS, e antes de 2027 não traz IBS nem CBS. A parcela que
 * não existe vale zero e não aparece na memória de cálculo.
 */
function valorOuZero(registro: Registro, parametroId: string, data: DataISO): Centavos {
  const r = registro.resolver(parametroId, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'valor_monetario') return ZERO
  return centavos(r.resolvida.vigencia.valor.centavos)
}

// ---------------------------------------------------------------------------
// CALC-052 — o limite e o desenquadramento
// ---------------------------------------------------------------------------

/**
 * **A pergunta que traz gente aqui é "estourei o limite, e agora?"** — e a
 * resposta da lei tem dois desfechos muito diferentes, separados por uma linha
 * de 20%:
 *
 *   até 20% de excesso  → o desenquadramento vale de 1º de janeiro do ano
 *                         SEGUINTE, e o MEI recolhe a diferença em janeiro;
 *   acima de 20%        → o desenquadramento RETROAGE a 1º de janeiro do ano do
 *                         excesso, e a tributação do ano inteiro muda.
 *
 * A diferença entre os dois desfechos é grande, e o que separa um do outro é
 * um valor que o próprio MEI controla até dezembro. É isso que a página existe
 * para mostrar a tempo.
 */

export interface EntradaLimiteMei {
  /** Quanto já foi faturado no ano-calendário. */
  readonly faturamentoNoAno: Centavos
  /**
   * Meses de atividade no ano, quando ele é o ano de ABERTURA. Zero significa
   * ano cheio, e o limite é o anual.
   */
  readonly mesesDeAtividade: number
}

export type SituacaoDoMei = 'dentro' | 'excedeu-ate-20' | 'excedeu-acima-de-20'

export interface SaidaLimiteMei {
  readonly limite: Centavos
  readonly limiteComTolerancia: Centavos
  readonly faturamento: Centavos
  readonly situacao: SituacaoDoMei
  /** Quanto ainda cabe antes de estourar o limite. Zero quando já estourou. */
  readonly margem: Centavos
  /** Quanto ainda cabe antes de o desenquadramento retroagir. */
  readonly margemAteRetroagir: Centavos
  readonly excesso: Centavos
  /** Quanto poderia faturar por mês, no resto do ano, sem estourar. */
  readonly mediaMensalDoLimite: Centavos
  readonly proRata: boolean
}

export function calcularLimiteMei(
  entrada: EntradaLimiteMei,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaLimiteMei> {
  if (entrada.faturamentoNoAno < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O faturamento não pode ser negativo.' }
  }
  if (entrada.mesesDeAtividade < 0 || entrada.mesesDeAtividade > MESES_NO_ANO) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Os meses de atividade precisam estar entre 1 e 12.',
    }
  }

  const anual = registro.resolver('mei-limite-receita-anual', dataReferencia)
  if (!anual.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: anual.detalhe }
  if (anual.resolvida.vigencia.valor.tipo !== 'valor_monetario') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O limite anual não é monetário.' }
  }

  const mensal = registro.resolver('mei-limite-mensal-inicio', dataReferencia)
  if (!mensal.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: mensal.detalhe }
  if (mensal.resolvida.vigencia.valor.tipo !== 'valor_monetario') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O limite mensal não é monetário.' }
  }

  const tolerancia = registro.resolver('mei-tolerancia-excesso', dataReferencia)
  if (!tolerancia.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: tolerancia.detalhe }
  if (tolerancia.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A tolerância não é percentual.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)

  /**
   * No ano de abertura o limite é PROPORCIONAL, e é o erro mais comum: quem abre
   * em outubro não tem R$ 81.000,00 de teto, tem três doze avos disso — e a lei
   * conta fração de mês como mês inteiro.
   */
  const proRata = entrada.mesesDeAtividade > 0 && entrada.mesesDeAtividade < MESES_NO_ANO
  const limite = proRata
    ? multiplicarPorInteiro(
        centavos(mensal.resolvida.vigencia.valor.centavos),
        entrada.mesesDeAtividade,
      )
    : centavos(anual.resolvida.vigencia.valor.centavos)

  if (proRata) {
    traco.passoComParametro(
      'Limite proporcional ao ano de abertura',
      `${reais(centavos(mensal.resolvida.vigencia.valor.centavos))} × ${entrada.mesesDeAtividade} meses`,
      limite,
      mensal.resolvida,
      'Quem abre no meio do ano não tem o limite cheio. A lei conta fração de mês como mês ' +
        'inteiro, e é o engano mais comum de quem se enquadrou em outubro.',
    )
  } else {
    traco.passoComParametro(
      'Limite de receita bruta do ano',
      'Limite anual do MEI',
      limite,
      anual.resolvida,
    )
  }

  const toleranciaBp = tolerancia.resolvida.vigencia.valor.aliquotaBp as BasisPoints
  const limiteComTolerancia = somar(limite, aplicarAliquota(limite, toleranciaBp, POLITICA))

  traco.passoComParametro(
    'A linha em que o desenquadramento passa a retroagir',
    `${reais(limite)} + ${percentual(toleranciaBp)}`,
    limiteComTolerancia,
    tolerancia.resolvida,
    'Até este valor, o desenquadramento vale a partir de 1º de janeiro do ano seguinte. Acima ' +
      'dele, ele RETROAGE ao começo do ano do excesso, e a tributação do ano inteiro muda.',
  )

  const excesso = naoNegativo(subtrair(entrada.faturamentoNoAno, limite))
  const situacao: SituacaoDoMei =
    entrada.faturamentoNoAno <= limite
      ? 'dentro'
      : entrada.faturamentoNoAno <= limiteComTolerancia
        ? 'excedeu-ate-20'
        : 'excedeu-acima-de-20'

  if (excesso > 0) {
    traco.passo(
      'Quanto passou do limite',
      `${reais(entrada.faturamentoNoAno)} − ${reais(limite)}`,
      excesso,
    )
  }

  const margem = naoNegativo(subtrair(limite, entrada.faturamentoNoAno))
  const margemAteRetroagir = naoNegativo(
    subtrair(limiteComTolerancia, entrada.faturamentoNoAno),
  )

  /**
   * Quanto cabe por mês no limite do ano — a referência que permite corrigir a
   * rota antes de dezembro, que é a única hora em que dá para corrigir.
   */
  const mesesDoLimite = proRata ? entrada.mesesDeAtividade : MESES_NO_ANO
  const mediaMensalDoLimite = centavos(Math.floor(limite / mesesDoLimite))

  return {
    ok: true,
    valores: {
      limite,
      limiteComTolerancia,
      faturamento: entrada.faturamentoNoAno,
      situacao,
      margem,
      margemAteRetroagir,
      excesso,
      mediaMensalDoLimite,
      proRata,
    },
    traco: traco.construir(),
  }
}
