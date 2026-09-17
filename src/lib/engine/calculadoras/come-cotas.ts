/**
 * CALC-098 — Come-cotas: o imposto que chega antes do resgate.
 *
 * **O que quase ninguém vê no extrato.** Duas vezes por ano — no último dia útil
 * de maio e de novembro — o fundo retém imposto sobre o rendimento ainda não
 * tributado, mesmo que ninguém tenha resgatado nada. A retenção não é imposto
 * adicional: ela ANTECIPA a alíquota da tabela regressiva, e no resgate paga-se
 * apenas a diferença que faltar.
 *
 * **O custo real do come-cotas não é o imposto: é o que ele deixa de render.**
 * O valor retido sai do fundo antes do tempo e não capitaliza mais — a página
 * mostra o imposto, e a memória diz de onde ele vem.
 *
 * O prazo decide a alíquota final pela tabela da Lei nº 11.033/2004, a mesma que
 * CALC-018 usa: o cadastro é um só (`renda-fixa.ts`).
 */

import { aplicarAliquota, naoNegativo, subtrair } from '../money'
import { citar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { basisPoints, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

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

export interface EntradaComeCotas {
  /** Rendimento acumulado da aplicação, desde o aporte até hoje. */
  readonly rendimentoAcumulado: Centavos
  /** Parte desse rendimento que já sofreu come-cotas em semestres anteriores. */
  readonly rendimentoJaTributado: Centavos
  /** Imposto já retido nos come-cotas anteriores. */
  readonly impostoJaRetido: Centavos
  /** Dias decorridos desde a aplicação. Decide a alíquota final da tabela. */
  readonly diasDesdeAplicacao: number
}

export interface SaidaComeCotas {
  /** Quanto o próximo come-cotas retém, se ocorrer hoje. */
  readonly comeCotas: Centavos
  readonly baseDoComeCotas: Centavos
  readonly aliquotaPeriodica: BasisPoints
  /** Alíquota final da tabela regressiva para o prazo informado. */
  readonly aliquotaFinal: BasisPoints
  /** Imposto total devido se o resgate acontecer hoje. */
  readonly impostoNoResgate: Centavos
  /** Diferença ainda a pagar no resgate, já descontado o que foi retido. */
  readonly complementoNoResgate: Centavos
}

/** Dias máximos aceitos — sanidade de entrada, não regra legal. */
// eslint-disable-next-line no-restricted-syntax -- limite de entrada, não parâmetro legal
const DIAS_MAXIMO = 36_500

export function calcularComeCotas(
  entrada: EntradaComeCotas,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaComeCotas> {
  if (entrada.rendimentoAcumulado <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o rendimento acumulado da aplicação.' }
  }
  if (entrada.rendimentoJaTributado < 0 || entrada.impostoJaRetido < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os valores já tributados não podem ser negativos.' }
  }
  if (entrada.rendimentoJaTributado > entrada.rendimentoAcumulado) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O rendimento já tributado não pode ser maior que o rendimento acumulado.',
    }
  }
  if (
    !Number.isInteger(entrada.diasDesdeAplicacao) ||
    entrada.diasDesdeAplicacao <= 0 ||
    entrada.diasDesdeAplicacao > DIAS_MAXIMO
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Informe quantos dias se passaram desde a aplicação.' }
  }

  const periodica = percentualDe(registro, 'come-cotas-aliquota-periodica', dataReferencia)
  const limite1 = inteiroDe(registro, 'ir-renda-fixa-limite-1', dataReferencia)
  const limite2 = inteiroDe(registro, 'ir-renda-fixa-limite-2', dataReferencia)
  const limite3 = inteiroDe(registro, 'ir-renda-fixa-limite-3', dataReferencia)
  if (periodica === null || limite1 === null || limite2 === null || limite3 === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há regras de come-cotas cadastradas para a data informada.' }
  }

  const idDaFaixa =
    entrada.diasDesdeAplicacao <= limite1.valor
      ? 'ir-renda-fixa-faixa-1'
      : entrada.diasDesdeAplicacao <= limite2.valor
        ? 'ir-renda-fixa-faixa-2'
        : entrada.diasDesdeAplicacao <= limite3.valor
          ? 'ir-renda-fixa-faixa-3'
          : 'ir-renda-fixa-faixa-4'
  const faixaFinal = percentualDe(registro, idDaFaixa, dataReferencia)
  if (faixaFinal === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há tabela regressiva cadastrada para a data informada.' }
  }

  const etapas: Etapa[] = []
  const vigencias = [
    periodica.resolvida.vigencia.id,
    faixaFinal.resolvida.vigencia.id,
    limite1.resolvida.vigencia.id,
  ]

  // --- O come-cotas de agora -------------------------------------------------
  const baseDoComeCotas = subtrair(entrada.rendimentoAcumulado, entrada.rendimentoJaTributado)
  const comeCotas = aplicarAliquota(baseDoComeCotas, periodica.valor, POLITICA)

  etapas.push({
    rotulo: `Come-cotas de ${percentual(periodica.valor)} sobre o rendimento ainda não tributado`,
    formula:
      entrada.rendimentoJaTributado > 0
        ? `(${reais(entrada.rendimentoAcumulado)} − ${reais(entrada.rendimentoJaTributado)}) × ${percentual(periodica.valor)}`
        : `${reais(entrada.rendimentoAcumulado)} × ${percentual(periodica.valor)}`,
    resultado: comeCotas,
    parametro: citar(periodica.resolvida),
    justificativa:
      'A retenção acontece no último dia útil de maio e de novembro, mesmo sem resgate. Ela incide só sobre o que ainda não foi tributado — o que já sofreu come-cotas entra no custo de aquisição e não é cobrado de novo.',
  })

  // --- O imposto final, quando houver resgate --------------------------------
  const impostoNoResgate = aplicarAliquota(entrada.rendimentoAcumulado, faixaFinal.valor, POLITICA)
  etapas.push({
    rotulo: `Alíquota final pela tabela regressiva — ${percentual(faixaFinal.valor)}`,
    formula: `${entrada.diasDesdeAplicacao} dias de aplicação · ${reais(entrada.rendimentoAcumulado)} × ${percentual(faixaFinal.valor)}`,
    resultado: impostoNoResgate,
    parametro: citar(faixaFinal.resolvida),
    justificativa:
      'O come-cotas não é imposto a mais: ele antecipa esta alíquota. No resgate, cobra-se apenas o percentual que falta para chegar nela.',
  })

  const complementoNoResgate = naoNegativo(subtrair(impostoNoResgate, entrada.impostoJaRetido))
  etapas.push({
    rotulo: 'Complemento a pagar no resgate de hoje',
    formula: `${reais(impostoNoResgate)} − ${reais(entrada.impostoJaRetido)} já retidos`,
    resultado: complementoNoResgate,
    justificativa:
      'Se o total já retido for maior que o devido — porque o prazo cresceu e a alíquota caiu —, não há restituição no resgate: o imposto simplesmente não é cobrado de novo.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: vigencias }
  return {
    ok: true,
    valores: {
      comeCotas,
      baseDoComeCotas,
      aliquotaPeriodica: periodica.valor,
      aliquotaFinal: faixaFinal.valor,
      impostoNoResgate,
      complementoNoResgate,
    },
    traco,
  }
}
