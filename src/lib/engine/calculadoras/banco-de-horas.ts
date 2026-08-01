/**
 * CALC-013 — Banco de horas e jornada acumulada.
 *
 * **A pergunta que ela responde é sobre dinheiro, não sobre horas.** Quem
 * procura banco de horas quer saber duas coisas: quanto tempo tem para
 * compensar, e quanto vale o saldo se não compensar. A segunda é a que a CLT
 * responde com precisão, no art. 59, § 3º — na rescisão sem compensação
 * integral, as horas não compensadas são pagas *"sobre o valor da remuneração na
 * data da rescisão"*, com adicional.
 *
 * O QUE O PRODUTO NÃO SABE, E DIZ QUE NÃO SABE
 *
 * `docs/18` já alertava: a regra de compensação depende do acordo coletivo, que
 * este produto não conhece — convenções fixam prazos menores, limites diários
 * distintos e às vezes adicional maior que o legal. Por isso a modalidade e o
 * adicional são **entrada**, e o resultado declara que o prazo mostrado é o teto
 * da lei, não o do contrato de quem consulta. `RN-028` vale em dobro aqui.
 *
 * O SALDO É NEGATIVO COM FREQUÊNCIA, E ISSO MUDA A RESPOSTA
 *
 * Horas devidas pelo trabalhador não viram desconto automático: o art. 59-B
 * limita a consequência do descumprimento ao adicional, e a compensação é o
 * caminho normal. A calculadora mostra o saldo negativo pelo que ele é — horas a
 * cumprir — sem transformá-lo em dívida em reais.
 */

import { aplicarAliquota, proporcao, somar } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CLT_ART_59, CLT_ART_59_REFORMA } from '../../params/data/fontes'

/** `RN-007`: empate para cima. */
const POLITICA = 'meio_para_cima' as const

/**
 * Divisor mensal: jornada semanal × 5 — `RN-024`. Ver a nota em
 * `jornada-e-fgts.ts`, onde ele foi estabelecido em CALC-006.
 */
const DIAS_UTEIS_POR_MES_SOBRE_SEMANA = 5

/**
 * Escala das horas em centésimos. Uma hora e meia é `150`.
 *
 * Definição de unidade, não constante legal.
 */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_HORA = 100

export type ModalidadeBanco = 'coletivo' | 'individual-escrito' | 'mesmo-mes'

export interface EntradaBancoDeHoras {
  readonly salario: Centavos
  readonly jornadaSemanal: number
  /** Horas de crédito acumuladas, em centésimos de hora. */
  readonly horasPositivas: number
  /** Horas de débito, em centésimos de hora. */
  readonly horasNegativas: number
  readonly modalidade: ModalidadeBanco
  /** Adicional pactuado. Zero usa o mínimo legal. */
  readonly adicionalPactuado: BasisPoints
}

export interface SaidaBancoDeHoras {
  /** Positivo é crédito do trabalhador; negativo, horas a cumprir. */
  readonly saldoHoras: number
  readonly valorHoraNormal: Centavos
  readonly valorHoraComAdicional: Centavos
  readonly adicionalAplicado: BasisPoints
  /** O que o saldo positivo vale se não for compensado — art. 59, § 3º. */
  readonly valorSeNaoCompensado: Centavos
  readonly prazoEmMeses: number
  readonly divisor: number
}

function inteiroDe(registro: Registro, id: string, data: DataISO): number | null {
  const r = registro.resolver(id, data)
  if (!r.ok) return null
  return r.resolvida.vigencia.valor.tipo === 'inteiro' ? r.resolvida.vigencia.valor.valor : null
}

export function calcularBancoDeHoras(
  entrada: EntradaBancoDeHoras,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaBancoDeHoras> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário para ver o resultado.' }
  }
  if (entrada.jornadaSemanal <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a jornada semanal para ver o resultado.' }
  }
  if (entrada.horasPositivas < 0 || entrada.horasNegativas < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'As horas informadas não podem ser negativas.' }
  }
  if (entrada.horasPositivas === 0 && entrada.horasNegativas === 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe as horas acumuladas — de crédito, de débito, ou as duas.',
    }
  }

  const idDoPrazo =
    entrada.modalidade === 'coletivo'
      ? 'banco-horas-prazo-coletivo'
      : entrada.modalidade === 'individual-escrito'
        ? 'banco-horas-prazo-individual'
        : 'banco-horas-prazo-mesmo-mes'

  const prazoEmMeses = inteiroDe(registro, idDoPrazo, dataReferencia)
  const rPrazo = registro.resolver(idDoPrazo, dataReferencia)
  const rAdicionalLegal = registro.resolver('hora-extra-adicional-minimo', dataReferencia)

  if (prazoEmMeses === null || !rPrazo.ok) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe:
        entrada.modalidade === 'coletivo'
          ? 'Não há parâmetros de banco de horas para a data informada.'
          : 'Esta modalidade de acordo só existe a partir da Reforma Trabalhista, em 11/11/2017.',
    }
  }
  if (!rAdicionalLegal.ok || rAdicionalLegal.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há adicional de hora extra para a data informada.' }
  }

  const adicionalLegal = basisPoints(rAdicionalLegal.resolvida.vigencia.valor.aliquotaBp)
  const usouPactuado = entrada.adicionalPactuado > adicionalLegal
  const adicionalAplicado = usouPactuado ? entrada.adicionalPactuado : adicionalLegal

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([
    rPrazo.resolvida.vigencia.id,
    rAdicionalLegal.resolvida.vigencia.id,
  ])

  // -------------------------------------------------------------------------
  // 1. O saldo
  // -------------------------------------------------------------------------
  const saldoHoras = entrada.horasPositivas - entrada.horasNegativas

  etapas.push({
    rotulo: 'Saldo do banco de horas',
    formula: `${horas(entrada.horasPositivas)}h de crédito − ${horas(entrada.horasNegativas)}h de débito`,
    resultado: centavos(saldoHoras),
    unidade: 'numero',
    justificativa:
      saldoHoras > 0
        ? 'Saldo positivo: são horas que a empresa deve a você, para compensar em folga ou pagar.'
        : saldoHoras < 0
          ? 'Saldo negativo: são horas que você deve cumprir. Elas não viram desconto automático ' +
            'em dinheiro — a compensação é o caminho normal.'
          : 'O banco está zerado.',
  })

  // -------------------------------------------------------------------------
  // 2. O prazo para compensar — art. 59, §§ 2º, 5º e 6º
  // -------------------------------------------------------------------------
  etapas.push({
    rotulo: 'Prazo máximo para compensar',
    formula:
      entrada.modalidade === 'coletivo'
        ? `${prazoEmMeses} meses — banco de horas por acordo ou convenção coletiva`
        : entrada.modalidade === 'individual-escrito'
          ? `${prazoEmMeses} meses — banco de horas por acordo individual escrito`
          : `${prazoEmMeses} mês — compensação por acordo individual, no mesmo mês`,
    resultado: centavos(prazoEmMeses * CENTESIMOS_POR_HORA),
    unidade: 'numero',
    parametro: citar(rPrazo.resolvida),
    justificativa:
      'Este é o TETO da lei. A norma coletiva da sua categoria pode fixar prazo menor, limite ' +
      'diário distinto e adicional maior — e ela prevalece sobre o que está aqui.',
  })

  // -------------------------------------------------------------------------
  // 3. Quanto vale a hora
  // -------------------------------------------------------------------------
  const divisor = entrada.jornadaSemanal * DIAS_UTEIS_POR_MES_SOBRE_SEMANA
  const valorHoraNormal = proporcao(entrada.salario, 1, divisor, POLITICA)

  etapas.push({
    rotulo: 'Valor da hora normal',
    formula: `${reais(entrada.salario)} ÷ ${divisor} (jornada de ${entrada.jornadaSemanal}h × 5)`,
    resultado: valorHoraNormal,
  })

  const acrescimo = aplicarAliquota(valorHoraNormal, adicionalAplicado, POLITICA)
  const valorHoraComAdicional = somar(valorHoraNormal, acrescimo)

  etapas.push({
    rotulo: 'Valor da hora com adicional',
    formula: `${reais(valorHoraNormal)} + ${percentual(adicionalAplicado)}`,
    resultado: valorHoraComAdicional,
    ...(usouPactuado ? {} : { parametro: citar(rAdicionalLegal.resolvida) }),
    justificativa: usouPactuado
      ? `Adicional de ${percentual(adicionalAplicado)} informado por você, acima do mínimo legal ` +
        `de ${percentual(adicionalLegal)}.`
      : 'Adicional mínimo da lei. Convenções coletivas frequentemente fixam mais — confira a sua.',
  })

  // -------------------------------------------------------------------------
  // 4. O que o saldo vale se não for compensado — art. 59, § 3º
  // -------------------------------------------------------------------------
  const valorSeNaoCompensado =
    saldoHoras > 0
      ? proporcao(valorHoraComAdicional, saldoHoras, CENTESIMOS_POR_HORA, POLITICA)
      : ZERO

  if (saldoHoras > 0) {
    etapas.push({
      rotulo: 'Saldo pago em rescisão, se não compensado',
      formula: `${reais(valorHoraComAdicional)} × ${horas(saldoHoras)}h`,
      resultado: valorSeNaoCompensado,
      fundamento: fundamentar(CLT_ART_59),
      justificativa:
        'Na rescisão sem compensação integral, as horas não compensadas são pagas sobre a ' +
        'remuneração da data da rescisão, com adicional. Saldo positivo não compensado não ' +
        'evapora — vira dinheiro.',
    })
  } else {
    etapas.push({
      rotulo: 'Sem valor a receber',
      formula: 'O saldo não é positivo',
      resultado: ZERO,
      fundamento: fundamentar(CLT_ART_59_REFORMA),
      justificativa:
        'O art. 59-B limita a consequência do descumprimento das exigências de compensação ao ' +
        'adicional, e não à repetição das horas. Saldo negativo é tempo a cumprir, não dívida ' +
        'em dinheiro.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }

  return {
    ok: true,
    valores: {
      saldoHoras,
      valorHoraNormal,
      valorHoraComAdicional,
      adicionalAplicado,
      valorSeNaoCompensado,
      prazoEmMeses,
      divisor,
    },
    traco,
  }
}

/** Formata centésimos de hora como "12,50", só para compor `formula`. */
function horas(centesimos: number): string {
  const negativo = centesimos < 0
  const abs = Math.abs(centesimos)
  const inteiro = Math.trunc(abs / CENTESIMOS_POR_HORA)
  const frac = abs % CENTESIMOS_POR_HORA
  return `${negativo ? '−' : ''}${inteiro},${String(frac).padStart(2, '0')}`
}
