/**
 * Caminhos de erro do motor — contrato `C-M3` de `ADR-003`.
 *
 * *"Erro de domínio retorna valor tipado, nunca exceção. Exceção significa
 * defeito."* Estes testes verificam o contrato, não o cálculo — por isso ficam
 * em `tests/unit/` e não em `tests/golden/`, que é reservado a cenários
 * conferidos contra fonte oficial (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularInss, liquidoAposInss } from '../../src/lib/engine/inss'
import { calcularIrrf } from '../../src/lib/engine/irrf'
import { percentual, reais } from '../../src/lib/engine/traco'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { construirRegistro } from '../../src/lib/params/registry'
import type { ConjuntoDeParametros } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, IRRF)
const EM_2026 = '2026-01-01'

const entradaIrrf = {
  rendimentoBruto: centavos(400_000),
  inss: centavos(37_341),
  dependentes: 0,
  pensao: centavos(0),
}

describe('C-M3 · entrada inválida devolve valor tipado, não exceção', () => {
  it('INSS recusa salário negativo', () => {
    const r = calcularInss({ salarioContribuicao: centavos(-1) }, EM_2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it.each([
    ['rendimento negativo', { rendimentoBruto: centavos(-1) }],
    ['INSS negativo', { inss: centavos(-1) }],
    ['pensão negativa', { pensao: centavos(-1) }],
  ])('IRRF recusa %s', (_rotulo, over) => {
    const r = calcularIrrf({ ...entradaIrrf, ...over }, EM_2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it.each([
    ['fracionário', 1.5],
    ['negativo', -1],
  ])('IRRF recusa número de dependentes %s', (_rotulo, dependentes) => {
    const r = calcularIrrf({ ...entradaIrrf, dependentes }, EM_2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })
})

describe('RN-003 · data sem cobertura devolve vigencia_ausente', () => {
  it('IRRF bloqueia data anterior à cobertura', () => {
    const r = calcularIrrf(entradaIrrf, '2019-01-01', registro)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.motivo).toBe('vigencia_ausente')
      expect(r.detalhe).toContain('2025')
    }
  })

  it('INSS bloqueia data posterior a uma cobertura encerrada', () => {
    // Registro só com a vigência de 2025, encerrada em 31/12.
    const so2025: ConjuntoDeParametros = {
      ...INSS,
      vigencias: INSS.vigencias.filter((v) => v.id === 'inss-tabela-2025'),
    }
    const r = calcularInss(
      { salarioContribuicao: centavos(400_000) },
      '2026-06-15',
      construirRegistro(so2025),
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

describe('defeito de cadastro é detectado em vez de produzir número', () => {
  /**
   * Um parâmetro declarado como tabela mas cadastrado como valor monetário só
   * passa aqui se BV-06 tiver sido contornado. Devolver um número nessa
   * situação seria pior que falhar.
   */
  const tipoTrocado: ConjuntoDeParametros = {
    fontes: INSS.fontes,
    parametros: INSS.parametros,
    vigencias: [
      {
        id: 'inss-tabela-2026',
        parametroId: 'inss-tabela-progressiva',
        fonteId: 'portaria-mps-mf-13-2026',
        inicio: '2026-01-01',
        fim: null,
        valor: { tipo: 'valor_monetario', centavos: 100 },
      },
    ],
  }

  it('INSS recusa parâmetro com tipo trocado', () => {
    const r = calcularInss(
      { salarioContribuicao: centavos(400_000) },
      EM_2026,
      construirRegistro(tipoTrocado),
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('IRRF recusa tabela com tipo trocado', () => {
    const irrfTrocado: ConjuntoDeParametros = {
      ...IRRF,
      vigencias: IRRF.vigencias.map((v) =>
        v.id === 'irrf-tabela-2025-05'
          ? { ...v, valor: { tipo: 'valor_monetario' as const, centavos: 100 } }
          : v,
      ),
    }
    const r = calcularIrrf(entradaIrrf, EM_2026, construirRegistro(irrfTrocado))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })
})

describe('redutor incompleto não é aplicado pela metade', () => {
  it('faltando um dos cinco parâmetros, nenhuma redução se aplica', () => {
    // Ou o mecanismo está inteiro, ou não se aplica. Aplicar parte da regra
    // produziria um imposto que não corresponde a norma alguma.
    const semCoeficiente: ConjuntoDeParametros = {
      ...IRRF,
      vigencias: IRRF.vigencias.filter((v) => v.parametroId !== 'irrf-reducao-coeficiente'),
    }
    const r = calcularIrrf(
      { ...entradaIrrf, rendimentoBruto: centavos(600_000), inss: centavos(64_960) },
      EM_2026,
      construirRegistro(semCoeficiente),
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.valores.reducaoAplicada).toBe(0)
  })
})

describe('utilitários', () => {
  it('liquidoAposInss subtrai a contribuição', () => {
    expect(liquidoAposInss(centavos(400_000), centavos(37_341))).toBe(362_659)
  })

  it('reais formata positivo, negativo e zero', () => {
    expect(reais(centavos(450_000))).toBe('R$ 4.500,00')
    expect(reais(centavos(5))).toBe('R$ 0,05')
    expect(reais(centavos(0))).toBe('R$ 0,00')
    expect(reais(centavos(-12_345))).toBe('−R$ 123,45')
    expect(reais(centavos(100_000_000))).toBe('R$ 1.000.000,00')
  })

  it('percentual formata basis points', () => {
    expect(percentual(basisPoints(750))).toBe('7,50%')
    expect(percentual(basisPoints(2_750))).toBe('27,50%')
    expect(percentual(basisPoints(10_000))).toBe('100,00%')
    expect(percentual(basisPoints(-750))).toBe('−7,50%')
  })
})

describe('tabela de faixas sem teto', () => {
  /**
   * Nem toda tabela progressiva tem limite superior — a do imposto de renda
   * não tem. O motor de faixas precisa lidar com a última faixa aberta sem
   * inventar um teto, e sem tratar isso como erro.
   */
  const semTeto: ConjuntoDeParametros = {
    fontes: INSS.fontes,
    parametros: INSS.parametros,
    vigencias: [
      {
        id: 'inss-tabela-2026',
        parametroId: 'inss-tabela-progressiva',
        fonteId: 'portaria-mps-mf-13-2026',
        inicio: '2026-01-01',
        fim: null,
        valor: {
          tipo: 'tabela_faixas',
          faixas: [
            { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 100_000, aliquotaBp: 1_000 },
            { ordem: 2, limiteInferiorCentavos: 100_001, limiteSuperiorCentavos: null, aliquotaBp: 2_000 },
          ],
        },
      },
    ],
  }

  it('a última faixa aberta incide sobre todo o excedente, sem limitar', () => {
    const r = calcularInss(
      { salarioContribuicao: centavos(300_000) },
      EM_2026,
      construirRegistro(semTeto),
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // 1.000,00 × 10% = 100,00  +  2.000,00 × 20% = 400,00  →  500,00
    expect(r.valores.contribuicao).toBe(50_000)
    expect(r.valores.limitadaPeloTeto).toBe(false)
    expect(r.valores.baseAplicada).toBe(300_000)
  })
})
