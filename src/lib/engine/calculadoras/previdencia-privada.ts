/**
 * CALC-094 — Imposto no resgate da previdência privada.
 *
 * **Duas escolhas feitas anos antes decidem o imposto de hoje:** o regime
 * (regressivo ou progressivo) e o tipo de plano (PGBL ou VGBL). A calculadora
 * existe porque a combinação das duas muda o resultado em dezenas de por cento,
 * e quase nenhum extrato explica isso.
 *
 * - **regime regressivo**: a alíquota cai com o prazo de acumulação — de 35% até
 *   dois anos a 10% acima de dez —, e o imposto é DEFINITIVO (Lei nº
 *   11.053/2004, art. 1º, § 2º);
 * - **regime progressivo**: a fonte retém 15% como ANTECIPAÇÃO (art. 3º), e a
 *   conta real acontece na declaração de ajuste, pela tabela anual;
 * - **PGBL**: o imposto incide sobre o valor resgatado INTEIRO, porque as
 *   contribuições foram deduzidas na declaração;
 * - **VGBL**: incide só sobre o RENDIMENTO (art. 3º, II).
 *
 * O prazo de acumulação é contado do aporte até o pagamento (art. 1º, § 3º), e
 * não da abertura do plano — cada aporte tem o seu. Esta estimativa trata um
 * prazo por vez, e a página declara isso.
 */

import { aplicarAliquota, naoNegativo, subtrair } from '../money'
import { citar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

export type TipoDePlano = 'pgbl' | 'vgbl'
export type RegimeDeTributacao = 'regressivo' | 'progressivo'

/**
 * As alíquotas do regime regressivo, da mais alta para a mais baixa. A ORDEM é
 * significativa: ela espelha os incisos I a VI do art. 1º, e o degrau entre
 * elas — dois anos — é parâmetro, não número escrito aqui.
 */
const FAIXAS_REGRESSIVAS = [
  'previdencia-regressiva-ate-2-anos',
  'previdencia-regressiva-2-a-4-anos',
  'previdencia-regressiva-4-a-6-anos',
  'previdencia-regressiva-6-a-8-anos',
  'previdencia-regressiva-8-a-10-anos',
  'previdencia-regressiva-acima-de-10-anos',
] as const

type Resolvido<T> = { readonly valor: T; readonly resolvida: VigenciaResolvida } | null

function percentualDe(registro: Registro, id: string, data: DataISO): Resolvido<BasisPoints> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: basisPoints(r.resolvida.vigencia.valor.aliquotaBp), resolvida: r.resolvida }
}

function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido<number> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

export interface EntradaPrevidencia {
  readonly tipoDePlano: TipoDePlano
  readonly regime: RegimeDeTributacao
  readonly valorResgate: Centavos
  /** Quanto foi aportado no plano. Usado para separar o rendimento no VGBL. */
  readonly totalAportado: Centavos
  /** Prazo de acumulação, em anos completos. Só o regime regressivo o usa. */
  readonly anosDeAcumulacao: number
}

export interface SaidaPrevidencia {
  readonly liquido: Centavos
  readonly imposto: Centavos
  readonly base: Centavos
  readonly aliquota: BasisPoints
  /** Falso no regime progressivo: lá a retenção é antecipação. */
  readonly impostoDefinitivo: boolean
  readonly rendimento: Centavos
}

/** Anos máximos aceitos na entrada. Sanidade, não regra legal. */
const ANOS_MAXIMO = 60

export function calcularResgatePrevidencia(
  entrada: EntradaPrevidencia,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaPrevidencia> {
  if (entrada.valorResgate <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor do resgate.' }
  }
  if (entrada.totalAportado < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O total aportado não pode ser negativo.' }
  }
  if (entrada.tipoDePlano === 'vgbl' && entrada.totalAportado <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'No VGBL, o imposto incide só sobre o rendimento — informe quanto foi aportado.',
    }
  }
  if (
    entrada.regime === 'regressivo' &&
    (!Number.isInteger(entrada.anosDeAcumulacao) ||
      entrada.anosDeAcumulacao < 0 ||
      entrada.anosDeAcumulacao > ANOS_MAXIMO)
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Informe o prazo de acumulação em anos completos.' }
  }

  const etapas: Etapa[] = []
  const vigencias: string[] = []

  // --- Base de cálculo: o que separa PGBL de VGBL ---------------------------
  const rendimento = naoNegativo(subtrair(entrada.valorResgate, entrada.totalAportado))
  const base = entrada.tipoDePlano === 'pgbl' ? entrada.valorResgate : rendimento

  etapas.push({
    rotulo: entrada.tipoDePlano === 'pgbl' ? 'Base — o resgate inteiro (PGBL)' : 'Base — só o rendimento (VGBL)',
    formula:
      entrada.tipoDePlano === 'pgbl'
        ? reais(entrada.valorResgate)
        : `${reais(entrada.valorResgate)} − ${reais(entrada.totalAportado)} aportados`,
    resultado: base,
    justificativa:
      entrada.tipoDePlano === 'pgbl'
        ? 'No PGBL as contribuições foram deduzidas da base do imposto na declaração; por isso o resgate é tributado por inteiro.'
        : 'No VGBL as contribuições não foram deduzidas, e o imposto alcança apenas o que o plano rendeu.',
  })

  // --- Alíquota -------------------------------------------------------------
  let aliquota: BasisPoints
  let definitivo: boolean

  if (entrada.regime === 'regressivo') {
    const degrau = inteiroDe(registro, 'previdencia-regressiva-degrau-anos', dataReferencia)
    const ultimo = inteiroDe(registro, 'previdencia-regressiva-ultimo-degrau-anos', dataReferencia)
    if (degrau === null || ultimo === null || degrau.valor <= 0) {
      return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há tabela regressiva cadastrada para a data informada.' }
    }

    /**
     * "Superior a N e inferior ou igual a N+2": um prazo de exatamente dois
     * anos fica na PRIMEIRA faixa, e não na segunda. `Math.ceil` sobre o degrau
     * reproduz isso sem `if` encadeado — e o prazo acima do último degrau cai
     * na faixa final.
     */
    const indice =
      entrada.anosDeAcumulacao > ultimo.valor
        ? FAIXAS_REGRESSIVAS.length - 1
        : Math.max(0, Math.ceil(entrada.anosDeAcumulacao / degrau.valor) - 1)
    const idDaFaixa = FAIXAS_REGRESSIVAS[Math.min(indice, FAIXAS_REGRESSIVAS.length - 1)] as string

    const faixa = percentualDe(registro, idDaFaixa, dataReferencia)
    if (faixa === null) {
      return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há tabela regressiva cadastrada para a data informada.' }
    }

    aliquota = faixa.valor
    definitivo = true
    vigencias.push(degrau.resolvida.vigencia.id, ultimo.resolvida.vigencia.id, faixa.resolvida.vigencia.id)

    etapas.push({
      rotulo: `Alíquota do regime regressivo — ${percentual(aliquota)}`,
      formula: `${entrada.anosDeAcumulacao} ano(s) de acumulação`,
      resultado: base,
      parametro: citar(faixa.resolvida),
      justificativa:
        'O prazo é contado de cada aporte até o pagamento. Dois anos completos ainda estão na primeira faixa: a lei fala em prazo "superior a" para mudar de degrau.',
    })
  } else {
    const antecipacao = percentualDe(registro, 'previdencia-progressiva-antecipacao', dataReferencia)
    if (antecipacao === null) {
      return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há alíquota do regime progressivo para a data informada.' }
    }
    aliquota = antecipacao.valor
    definitivo = false
    vigencias.push(antecipacao.resolvida.vigencia.id)

    etapas.push({
      rotulo: `Retenção do regime progressivo — ${percentual(aliquota)}`,
      formula: `${reais(base)} × ${percentual(aliquota)}`,
      resultado: base,
      parametro: citar(antecipacao.resolvida),
      justificativa:
        'Aqui a retenção é ANTECIPAÇÃO: o valor resgatado entra na declaração de ajuste anual, onde a tabela progressiva decide o imposto real — que pode ser maior, menor ou zero.',
    })
  }

  const imposto = aplicarAliquota(base, aliquota, POLITICA)
  const liquido = subtrair(entrada.valorResgate, imposto)

  etapas.push({
    rotulo: definitivo ? 'Imposto retido — definitivo' : 'Imposto retido — a ajustar na declaração',
    formula: `${reais(base)} × ${percentual(aliquota)}`,
    resultado: imposto,
  })
  etapas.push({
    rotulo: 'Valor líquido do resgate',
    formula: `${reais(entrada.valorResgate)} − ${reais(imposto)}`,
    resultado: liquido,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: vigencias }
  return {
    ok: true,
    valores: {
      liquido,
      imposto,
      base,
      aliquota,
      impostoDefinitivo: definitivo,
      rendimento: entrada.totalAportado > 0 ? rendimento : ZERO,
    },
    traco,
  }
}
