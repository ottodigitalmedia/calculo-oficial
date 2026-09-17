/**
 * CALC-086 · CALC-087 · CALC-088 — casos-ouro das licenças e do salário-família.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: contagem de calendário e aritmética direta sobre as
 * normas transcritas em `fontes.ts` — CF, art. 7º, XVIII (cento e vinte dias);
 * CLT, art. 392, § 1º (início a partir do 28º dia antes do parto); ADCT, art.
 * 10, § 1º (cinco dias até 2026); Lei nº 15.371/2026, arts. 2º, § 1º, e 11 (dez
 * dias em 2027, quinze em 2028, contados do nascimento); Lei nº 11.770/2008,
 * art. 1º (sessenta e quinze dias de prorrogação); Portarias Interministeriais
 * MPS/MF nº 6/2025 e nº 13/2026, art. 4º (cota e limite do salário-família).
 * Cada data esperada tem a contagem ao lado — o dia de início é o primeiro dia.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularLicencaMaternidade,
  calcularLicencaPaternidade,
} from '../../src/lib/engine/calculadoras/licencas'
import { calcularSalarioFamilia } from '../../src/lib/engine/calculadoras/salario-familia'
import { centavos } from '../../src/lib/engine/types'
import { LICENCAS } from '../../src/lib/params/data/licencas'
import { SALARIO_FAMILIA } from '../../src/lib/params/data/salario-familia'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(LICENCAS, SALARIO_FAMILIA)
const REF = '2026-09-17' as DataISO
const d = (s: string) => s as DataISO

// ---------------------------------------------------------------------------
// CALC-086 — Licença-maternidade
// ---------------------------------------------------------------------------

function maternidade(inicio: string, empresaCidada = false, parto = '') {
  const r = calcularLicencaMaternidade(
    { inicio: d(inicio), parto: parto === '' ? '' : d(parto), empresaCidada },
    REF,
    registro,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-086 · licença-maternidade', () => {
  /**
   * 02/03/2026 é o dia 1. Março tem 30 dias a partir do dia 2 (até 31/03, +29),
   * abril +30 (30/04, +59), maio +31 (31/05, +90), junho: +119 cai em 29/06.
   */
  it('cento e vinte dias a partir de 02/03/2026 terminam em 29/06/2026', () => {
    const v = maternidade('2026-03-02')
    expect(v.diasLicenca).toBe(120)
    expect(v.fimLicenca).toBe('2026-06-29')
    expect(v.retorno).toBe('2026-06-30')
    expect(v.fimProrrogacao).toBeNull()
  })

  /** 29/06 + 60 dias: 30/06 (+1), julho (+32 em 31/07), 28/08 (+60). Total 180. */
  it('com a Empresa Cidadã, sessenta dias a mais logo em seguida', () => {
    const v = maternidade('2026-03-02', true)
    expect(v.diasProrrogacao).toBe(60)
    expect(v.totalDias).toBe(180)
    expect(v.fimLicenca).toBe('2026-06-29')
    expect(v.fimProrrogacao).toBe('2026-08-28')
    expect(v.retorno).toBe('2026-08-29')
  })

  /**
   * 15/01/2028: 31/01 é +16, 29/02 (bissexto) +45, 31/03 +76, 30/04 +106,
   * 13/05 +119. Em 2027, sem o dia 29, o mesmo início termina em 14/05.
   */
  it('atravessa fevereiro bissexto sem perder um dia', () => {
    expect(maternidade('2028-01-15').fimLicenca).toBe('2028-05-13')
    expect(maternidade('2027-01-15').fimLicenca).toBe('2027-05-14')
  })

  /** Parto em 20/03/2026: 28 dias antes é 20/02/2026. */
  it('início no 28º dia antes do parto é aceito', () => {
    expect(maternidade('2026-02-20', false, '2026-03-20').diasLicenca).toBe(120)
  })

  it('início um dia antes da janela é recusado', () => {
    const r = calcularLicencaMaternidade(
      { inicio: d('2026-02-19'), parto: d('2026-03-20'), empresaCidada: false },
      REF,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('início depois do parto é recusado', () => {
    const r = calcularLicencaMaternidade(
      { inicio: d('2026-03-21'), parto: d('2026-03-20'), empresaCidada: false },
      REF,
      registro,
    )
    expect(r.ok).toBe(false)
  })

  it('RN-003 — Empresa Cidadã antes de 2025 não tem cobertura cadastrada', () => {
    const r = calcularLicencaMaternidade({ inicio: d('2024-06-01'), parto: '', empresaCidada: true }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
    expect(maternidade('2024-06-01').diasLicenca).toBe(120)
  })

  it('a memória cita a janela do art. 392 e a duração constitucional', () => {
    const r = calcularLicencaMaternidade({ inicio: d('2026-03-02'), parto: '', empresaCidada: true }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.vigenciasAplicadas).toEqual([
      'licenca-maternidade-inicio-2002',
      'licenca-maternidade-1988',
      'empresa-cidada-maternidade-2025',
    ])
  })

  it('sem data de início, fica pendente; parto inexistente é recusado', () => {
    const vazio = calcularLicencaMaternidade({ inicio: d(''), parto: '', empresaCidada: false }, REF, registro)
    expect(vazio.ok).toBe(false)
    if (!vazio.ok) expect(vazio.motivo).toBe('entrada_incompleta')

    const invalido = calcularLicencaMaternidade(
      { inicio: d('2026-03-02'), parto: d('2026-02-30'), empresaCidada: false },
      REF,
      registro,
    )
    expect(invalido.ok).toBe(false)
    if (!invalido.ok) expect(invalido.motivo).toBe('entrada_invalida')
  })
})

// ---------------------------------------------------------------------------
// CALC-087 — Licença-paternidade
// ---------------------------------------------------------------------------

function paternidade(nascimento: string, empresaCidada = false) {
  const r = calcularLicencaPaternidade({ nascimento: d(nascimento), empresaCidada }, REF, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r
}

describe('CALC-087 · licença-paternidade muda com a data do nascimento', () => {
  /** ADCT: cinco dias. 30/12/2026 é o dia 1; 03/01/2027 é o dia 5. */
  it('nascimento em 30/12/2026 — cinco dias, mesmo terminando em 2027', () => {
    const v = paternidade('2026-12-30').valores
    expect(v.diasLicenca).toBe(5)
    expect(v.fimLicenca).toBe('2027-01-03')
    expect(v.retorno).toBe('2027-01-04')
  })

  /** Lei nº 15.371, art. 11, I: dez dias. 01/01 a 10/01/2027. */
  it('nascimento em 01/01/2027 — dez dias', () => {
    const v = paternidade('2027-01-01').valores
    expect(v.diasLicenca).toBe(10)
    expect(v.fimLicenca).toBe('2027-01-10')
    expect(v.retorno).toBe('2027-01-11')
  })

  /** Art. 11, II: quinze dias. 20/02/2028 + 14: 29/02 é +9, 05/03 é +14. */
  it('nascimento em 20/02/2028 — quinze dias, com 29 de fevereiro', () => {
    const v = paternidade('2028-02-20').valores
    expect(v.diasLicenca).toBe(15)
    expect(v.fimLicenca).toBe('2028-03-05')
  })

  /** 5 + 15 = 20; 03/01/2027 + 15 = 18/01/2027. */
  it('Empresa Cidadã em 2026 — cinco mais quinze', () => {
    const v = paternidade('2026-12-30', true).valores
    expect(v.totalDias).toBe(20)
    expect(v.fimProrrogacao).toBe('2027-01-18')
    expect(v.retorno).toBe('2027-01-19')
  })

  /** 10 + 15 = 25; 10/01/2027 + 15 = 25/01/2027. 15 + 15 = 30 em 2028. */
  it('Empresa Cidadã a partir de 2027 — quinze além do período novo', () => {
    const v2027 = paternidade('2027-01-01', true).valores
    expect(v2027.totalDias).toBe(25)
    expect(v2027.fimProrrogacao).toBe('2027-01-25')
    expect(paternidade('2028-02-20', true).valores.totalDias).toBe(30)
  })

  it('RN-003 — a partir de 2029 a duração depende de meta fiscal e não é calculada', () => {
    const r = calcularLicencaPaternidade({ nascimento: d('2029-01-01'), empresaCidada: false }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('a partir de 2027 a contagem cita a lei nova; antes, declara que a norma não fixa o dia inicial', () => {
    expect(paternidade('2027-03-01').traco.etapas[0]?.fundamento?.norma).toContain('15.371')
    expect(paternidade('2026-03-01').traco.etapas[0]?.fundamento).toBeUndefined()
  })

  it('sem data, fica pendente', () => {
    const r = calcularLicencaPaternidade({ nascimento: d('2026-13-01'), empresaCidada: false }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })
})

// ---------------------------------------------------------------------------
// CALC-088 — Salário-família
// ---------------------------------------------------------------------------

function familia(remuneracao: number, filhos: number, ref = REF) {
  const r = calcularSalarioFamilia({ remuneracao: centavos(remuneracao), filhos }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-088 · salário-família', () => {
  /** 2026: remuneração exatamente no limite de R$ 1.980,38; 2 × R$ 67,54 = R$ 135,08. */
  it('no limite exato, recebe as cotas', () => {
    const v = familia(198_038, 2)
    expect(v.elegivel).toBe(true)
    expect(v.total).toBe(13_508)
    expect(v.folga).toBe(0)
  })

  /** Um centavo acima do limite: nenhuma cota. */
  it('um centavo acima do limite zera o benefício', () => {
    const v = familia(198_039, 2)
    expect(v.elegivel).toBe(false)
    expect(v.total).toBe(0)
    expect(v.folga).toBe(-1)
  })

  /** 2025: limite R$ 1.906,04, cota R$ 65,00. R$ 1.950,00 cabia em 2026 e não cabia em 2025. */
  it('a mesma remuneração muda de resposta entre 2025 e 2026', () => {
    expect(familia(195_000, 1, '2025-06-15' as DataISO).total).toBe(0)
    expect(familia(195_000, 1).total).toBe(6_754)
    expect(familia(190_604, 3, '2025-06-15' as DataISO).total).toBe(19_500)
  })

  it('RN-003 — antes de 2025 não há valores cadastrados', () => {
    const r = calcularSalarioFamilia({ remuneracao: centavos(150_000), filhos: 1 }, '2024-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('sem filhos ou sem remuneração, fica pendente; filhos fracionados são recusados', () => {
    const semFilhos = calcularSalarioFamilia({ remuneracao: centavos(150_000), filhos: 0 }, REF, registro)
    expect(semFilhos.ok).toBe(false)
    if (!semFilhos.ok) expect(semFilhos.motivo).toBe('entrada_incompleta')

    const semRemuneracao = calcularSalarioFamilia({ remuneracao: centavos(0), filhos: 1 }, REF, registro)
    expect(semRemuneracao.ok).toBe(false)

    const fracionado = calcularSalarioFamilia({ remuneracao: centavos(150_000), filhos: 1.5 }, REF, registro)
    expect(fracionado.ok).toBe(false)
    if (!fracionado.ok) expect(fracionado.motivo).toBe('entrada_invalida')
  })
})
