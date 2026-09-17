/**
 * CALC-089 · CALC-090 · CALC-091 — casos-ouro do contrato a prazo, da
 * transferência e do sobreaviso.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a CLT — art. 479 (metade da
 * remuneração até o termo), art. 64 (o dia do mensalista é um trinta avos do
 * salário), art. 469, § 3º (pagamento suplementar nunca inferior a 25%), art.
 * 244, §§ 2º e 3º (horas contadas a um terço e a dois terços) — e sobre a
 * Súmula 431 do TST (divisor 200 para 40 horas). A conta de cada caso está ao
 * lado da asserção.
 *
 * Nenhuma das três tem exemplo oficial resolvido publicado por órgão público.
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularContratoAPrazo,
  calcularSobreaviso,
  calcularTransferencia,
  type EntradaContratoAPrazo,
  type EntradaSobreaviso,
} from '../../src/lib/engine/calculadoras/disponibilidade'
import { ZERO, basisPoints, centavos } from '../../src/lib/engine/types'
import { DISPONIBILIDADE } from '../../src/lib/params/data/disponibilidade'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(DISPONIBILIDADE)
const REF = '2026-09-17' as DataISO

// ---------------------------------------------------------------------------
// CALC-089 — Contrato a prazo
// ---------------------------------------------------------------------------

const CONTRATO: EntradaContratoAPrazo = {
  salario: centavos(300_000),
  mediaVariavel: ZERO,
  dataRescisao: '2026-03-10' as DataISO,
  dataTermo: '2026-04-09' as DataISO,
}

function contrato(over: Partial<EntradaContratoAPrazo> = {}) {
  const r = calcularContratoAPrazo({ ...CONTRATO, ...over }, REF, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-089 · indenização do art. 479', () => {
  /** 10/03 a 09/04: 30 dias restantes. R$ 3.000,00 ÷ 30 × 30 = R$ 3.000,00; metade R$ 1.500,00. */
  it('caso redondo', () => {
    const v = contrato()
    expect(v.diasRestantes).toBe(30)
    expect(v.remuneracaoAteOTermo).toBe(300_000)
    expect(v.indenizacao).toBe(150_000)
  })

  /**
   * R$ 2.500,00 + R$ 500,00 de média variável = R$ 3.000,00.
   * 01/01 a 01/03/2026: 31 + 28 = 59 dias. 3.000,00 × 59 ÷ 30 = R$ 5.900,00; metade R$ 2.950,00.
   */
  it('a parte variável entra pela média', () => {
    const v = contrato({
      salario: centavos(250_000),
      mediaVariavel: centavos(50_000),
      dataRescisao: '2026-01-01' as DataISO,
      dataTermo: '2026-03-01' as DataISO,
    })
    expect(v.remuneracaoMensal).toBe(300_000)
    expect(v.diasRestantes).toBe(59)
    expect(v.indenizacao).toBe(295_000)
  })

  /**
   * R$ 2.000,00, 7 dias:
   *   período:     2.000,00 × 7 ÷ 30 = 466,666… → R$ 466,67
   *   indenização: 2.000,00 × 7 ÷ 60 = 233,333… → R$ 233,33
   * Metade do período já arredondado daria 233,335 → R$ 233,34. Um arredondamento só.
   */
  it('arredonda uma vez, sobre o salário', () => {
    const v = contrato({
      salario: centavos(200_000),
      dataRescisao: '2026-05-01' as DataISO,
      dataTermo: '2026-05-08' as DataISO,
    })
    expect(v.remuneracaoAteOTermo).toBe(46_667)
    expect(v.indenizacao).toBe(23_333)
  })

  it('termo igual ou anterior à dispensa é recusado', () => {
    const r = calcularContratoAPrazo({ ...CONTRATO, dataTermo: CONTRATO.dataRescisao }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('sem datas ou sem salário, fica pendente; média negativa é recusada', () => {
    const semData = calcularContratoAPrazo({ ...CONTRATO, dataTermo: '' as DataISO }, REF, registro)
    expect(semData.ok).toBe(false)
    if (!semData.ok) expect(semData.motivo).toBe('entrada_incompleta')

    const semSalario = calcularContratoAPrazo({ ...CONTRATO, salario: ZERO }, REF, registro)
    expect(semSalario.ok).toBe(false)

    const negativa = calcularContratoAPrazo({ ...CONTRATO, mediaVariavel: centavos(-1) }, REF, registro)
    expect(negativa.ok).toBe(false)
    if (!negativa.ok) expect(negativa.motivo).toBe('entrada_invalida')
  })

  it('RN-003 — antes da CLT não há regra', () => {
    const r = calcularContratoAPrazo(
      { ...CONTRATO, dataRescisao: '1940-01-01' as DataISO, dataTermo: '1940-02-01' as DataISO },
      REF,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// CALC-090 — Transferência
// ---------------------------------------------------------------------------

describe('CALC-090 · adicional de transferência', () => {
  /** R$ 4.000,00 × 25% = R$ 1.000,00; com o salário, R$ 5.000,00. */
  it('mínimo legal', () => {
    const r = calcularTransferencia({ salario: centavos(400_000), percentualInformado: basisPoints(0) }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.valores.adicional).toBe(100_000)
    expect(r.valores.salarioComAdicional).toBe(500_000)
    expect(r.valores.aliquota).toBe(2_500)
  })

  /** R$ 4.000,00 × 30% = R$ 1.200,00. */
  it('percentual combinado maior que o mínimo', () => {
    const r = calcularTransferencia({ salario: centavos(400_000), percentualInformado: basisPoints(3_000) }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.valores.adicional).toBe(120_000)
  })

  /** R$ 3.333,33 × 25% = 833,3325 → R$ 833,33. */
  it('arredondamento', () => {
    const r = calcularTransferencia({ salario: centavos(333_333), percentualInformado: basisPoints(0) }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.valores.adicional).toBe(83_333)
  })

  it('percentual abaixo do mínimo legal é recusado', () => {
    const r = calcularTransferencia({ salario: centavos(400_000), percentualInformado: basisPoints(2_000) }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('sem salário fica pendente; antes de 1975 não há regra', () => {
    const semSalario = calcularTransferencia({ salario: ZERO, percentualInformado: basisPoints(0) }, REF, registro)
    expect(semSalario.ok).toBe(false)
    const antes = calcularTransferencia(
      { salario: centavos(100_000), percentualInformado: basisPoints(0) },
      '1975-04-17' as DataISO,
      registro,
    )
    expect(antes.ok).toBe(false)
    if (!antes.ok) expect(antes.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// CALC-091 — Sobreaviso e prontidão
// ---------------------------------------------------------------------------

const SOBREAVISO: EntradaSobreaviso = {
  salario: centavos(220_000),
  jornadaSemanal: 44,
  horasSobreavisoCentesimos: 3_000,
  horasProntidaoCentesimos: 1_200,
}

function horas(over: Partial<EntradaSobreaviso> = {}) {
  const r = calcularSobreaviso({ ...SOBREAVISO, ...over }, REF, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-091 · sobreaviso e prontidão', () => {
  /**
   * R$ 2.200,00 ÷ 220 = R$ 10,00 por hora.
   * Sobreaviso: 10,00 × 1/3 × 30h = R$ 100,00. Prontidão: 10,00 × 2/3 × 12h = R$ 80,00.
   */
  it('caso redondo, 44 horas', () => {
    const v = horas()
    expect(v.divisor).toBe(220)
    expect(v.valorHoraNormal).toBe(1_000)
    expect(v.sobreaviso).toBe(10_000)
    expect(v.prontidao).toBe(8_000)
    expect(v.total).toBe(18_000)
  })

  /** R$ 3.000,00 ÷ 200 = R$ 15,00. Sobreaviso 7,5h: 15 × 7,5 ÷ 3 = R$ 37,50. Prontidão 5h: 15 × 5 × 2 ÷ 3 = R$ 50,00. */
  it('40 horas, horas quebradas', () => {
    const v = horas({ salario: centavos(300_000), jornadaSemanal: 40, horasSobreavisoCentesimos: 750, horasProntidaoCentesimos: 500 })
    expect(v.divisor).toBe(200)
    expect(v.sobreaviso).toBe(3_750)
    expect(v.prontidao).toBe(5_000)
  })

  /**
   * R$ 2.500,00, 44h, 7h de sobreaviso:
   *   sobre o salário:      2.500,00 × 7 ÷ (220 × 3) = 26,5151… → R$ 26,52
   *   sobre a hora já arredondada: 11,36 × 7 ÷ 3 = 26,5066… → R$ 26,51
   * A conta certa parte do salário.
   */
  it('não arredonda a hora no caminho', () => {
    const v = horas({ salario: centavos(250_000), horasSobreavisoCentesimos: 700, horasProntidaoCentesimos: 0 })
    expect(v.valorHoraNormal).toBe(1_136)
    expect(v.sobreaviso).toBe(2_652)
    expect(v.prontidao).toBe(0)
  })

  it('só uma das duas aplica só o parâmetro dela', () => {
    const r = calcularSobreaviso({ ...SOBREAVISO, horasProntidaoCentesimos: 0 }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.vigenciasAplicadas).toEqual(['sobreaviso-1966'])
  })

  it('sem horas fica pendente; horas negativas e jornada zero são recusadas', () => {
    const semHoras = calcularSobreaviso({ ...SOBREAVISO, horasSobreavisoCentesimos: 0, horasProntidaoCentesimos: 0 }, REF, registro)
    expect(semHoras.ok).toBe(false)
    if (!semHoras.ok) expect(semHoras.motivo).toBe('entrada_incompleta')

    const negativa = calcularSobreaviso({ ...SOBREAVISO, horasProntidaoCentesimos: -100 }, REF, registro)
    expect(negativa.ok).toBe(false)
    if (!negativa.ok) expect(negativa.motivo).toBe('entrada_invalida')

    const semJornada = calcularSobreaviso({ ...SOBREAVISO, jornadaSemanal: 0 }, REF, registro)
    expect(semJornada.ok).toBe(false)

    const semSalario = calcularSobreaviso({ ...SOBREAVISO, salario: ZERO }, REF, registro)
    expect(semSalario.ok).toBe(false)
  })

  it('RN-003 — antes do Decreto-lei nº 5/1966 não há regra cadastrada', () => {
    const r = calcularSobreaviso(SOBREAVISO, '1966-04-04' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
