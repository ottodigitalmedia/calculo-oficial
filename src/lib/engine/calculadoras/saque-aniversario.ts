/**
 * CALC-095 — Saque-aniversário do FGTS.
 *
 * A conta é curta: alíquota da faixa sobre a SOMA de todos os saldos, mais a
 * parcela adicional da mesma faixa (Lei nº 8.036/1990, art. 20-D). O que a
 * página precisa mostrar, além do valor, é o que a opção custa — na sistemática
 * do saque-aniversário, a despedida sem justa causa deixa de ser hipótese de
 * movimentação da conta (art. 20-A, § 2º, II), e voltar atrás só produz efeito
 * no primeiro dia do vigésimo quinto mês seguinte ao pedido (art. 20-C).
 *
 * **A parcela é ADICIONAL, não a deduzir.** É a diferença desta tabela para as
 * do imposto de renda, e é ela que mantém o saque contínuo na fronteira: com
 * R$ 1.000,00 de saldo saca-se o mesmo que com R$ 1.000,01.
 */

import { aplicarAliquota, somar, subtrair } from '../money'
import { citar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO, Faixa } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

export interface EntradaSaqueAniversario {
  /** Soma de todos os saldos das contas vinculadas, na data do saque. */
  readonly saldo: Centavos
}

export interface SaidaSaqueAniversario {
  readonly saque: Centavos
  readonly saldoRestante: Centavos
  readonly aliquota: BasisPoints
  readonly parcelaAdicional: Centavos
  /** Quanto o saque representa do saldo, em basis points. */
  readonly percentualEfetivo: BasisPoints
}

/** 100% em basis points. Unidade, não parâmetro legal. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
const BP_INTEIRO = 10_000

function faixaDoSaldo(faixas: readonly Faixa[], saldo: number): Faixa | null {
  for (const f of faixas) {
    const dentroDoPiso = saldo >= f.limiteInferiorCentavos
    const dentroDoTeto = f.limiteSuperiorCentavos === null || saldo <= f.limiteSuperiorCentavos
    if (dentroDoPiso && dentroDoTeto) return f
  }
  return null
}

export function calcularSaqueAniversario(
  entrada: EntradaSaqueAniversario,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaSaqueAniversario> {
  if (entrada.saldo <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o saldo somado das suas contas do FGTS.' }
  }

  const r = registro.resolver('fgts-saque-aniversario-tabela', dataReferencia)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'tabela_faixas') {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'A tabela do saque-aniversário não está cadastrada para a data informada.',
    }
  }

  const faixa = faixaDoSaldo(r.resolvida.vigencia.valor.faixas, entrada.saldo)
  if (!faixa) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O saldo informado não cai em nenhuma faixa da tabela.' }
  }

  const aliquota = basisPoints(faixa.aliquotaBp)
  const parcelaAdicional = centavos(faixa.parcelaAdicionalCentavos ?? 0)

  const parteVariavel = aplicarAliquota(entrada.saldo, aliquota, POLITICA)
  const saque = somar(parteVariavel, parcelaAdicional)
  const saldoRestante = subtrair(entrada.saldo, saque)

  const etapas: Etapa[] = [
    {
      rotulo: `Alíquota da faixa — ${percentual(aliquota)}`,
      formula: `${reais(entrada.saldo)} × ${percentual(aliquota)}`,
      resultado: parteVariavel,
      parametro: citar(r.resolvida),
      justificativa:
        'A alíquota incide sobre a soma de TODOS os saldos das contas vinculadas do titular, apurados na data do saque — e não sobre a conta do emprego atual.',
    },
  ]

  if (parcelaAdicional > 0) {
    etapas.push({
      rotulo: 'Parcela adicional da faixa',
      formula: `${reais(parteVariavel)} + ${reais(parcelaAdicional)}`,
      resultado: saque,
      parametro: citar(r.resolvida),
      justificativa:
        'A parcela é somada, e não deduzida: é ela que impede o saque de cair quando o saldo passa para a faixa seguinte.',
    })
  }

  etapas.push({
    rotulo: 'Saque-aniversário',
    formula: parcelaAdicional > 0 ? `${reais(parteVariavel)} + ${reais(parcelaAdicional)}` : reais(parteVariavel),
    resultado: saque,
  })
  etapas.push({
    rotulo: 'Saldo que permanece na conta',
    formula: `${reais(entrada.saldo)} − ${reais(saque)}`,
    resultado: saldoRestante,
    justificativa:
      'O restante continua rendendo na conta vinculada — e, na sistemática do saque-aniversário, não pode ser sacado em caso de despedida sem justa causa.',
  })

  const percentualEfetivo = basisPoints(Math.round((saque * BP_INTEIRO) / entrada.saldo))

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [r.resolvida.vigencia.id] }
  return {
    ok: true,
    valores: { saque, saldoRestante, aliquota, parcelaAdicional, percentualEfetivo },
    traco,
  }
}
