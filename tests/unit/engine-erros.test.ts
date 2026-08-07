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
import { calcularComparador } from '../../src/lib/engine/calculadoras/clt-pj-mei'
import { calcularCripto } from '../../src/lib/engine/calculadoras/cripto'
import { calcularIrpfAnual } from '../../src/lib/engine/calculadoras/irpf-anual'
import { calcularSolar } from '../../src/lib/engine/calculadoras/solar'
import { calcularIrrf } from '../../src/lib/engine/irrf'
import { percentual, reais } from '../../src/lib/engine/traco'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { ENERGIA_DISTRIBUIDA } from '../../src/lib/params/data/energia-distribuida'
import { GANHO_DE_CAPITAL } from '../../src/lib/params/data/ganho-de-capital'
import { IRPF_ANUAL } from '../../src/lib/params/data/irpf-anual'
import { TODOS_OS_CONJUNTOS } from '../../src/lib/params/data/todos'
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

// ---------------------------------------------------------------------------
// Ajuste anual — CALC-017 e CALC-019
// ---------------------------------------------------------------------------

describe('ajuste anual do IRPF · C-M3', () => {
  const entradaAnual = {
    rendimentosTributaveis: centavos(6_000_000),
    inss: centavos(660_000),
    dependentes: 0,
    instrucao: centavos(0),
    medicas: centavos(0),
    pensao: centavos(0),
    impostoRetido: centavos(0),
  }
  const registroAnual = construirRegistro(IRPF_ANUAL)
  const EM_2025 = '2025-06-15'

  it.each([
    ['rendimentos negativos', { rendimentosTributaveis: centavos(-1) }],
    ['INSS negativo', { inss: centavos(-1) }],
    ['instrução negativa', { instrucao: centavos(-1) }],
    ['despesa médica negativa', { medicas: centavos(-1) }],
    ['pensão negativa', { pensao: centavos(-1) }],
    ['imposto retido negativo', { impostoRetido: centavos(-1) }],
  ])('recusa %s', (_nome, campo) => {
    const r = calcularIrpfAnual({ ...entradaAnual, ...campo }, EM_2025, registroAnual)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it.each([
    ['fracionário', 1.5],
    ['negativo', -1],
  ])('recusa número de dependentes %s', (_nome, dependentes) => {
    const r = calcularIrpfAnual({ ...entradaAnual, dependentes }, EM_2025, registroAnual)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  /**
   * A tabela anual cadastrada com o tipo trocado só chega aqui se BV-06 tiver
   * sido contornado. Devolver imposto zero seria pior que falhar: zero é uma
   * resposta plausível, e ninguém desconfiaria dela.
   */
  it('recusa tabela anual cadastrada com o tipo errado', () => {
    const tipoTrocado: ConjuntoDeParametros = {
      ...IRPF_ANUAL,
      vigencias: IRPF_ANUAL.vigencias.map((v) =>
        v.parametroId === 'irpf-tabela-anual'
          ? { ...v, valor: { tipo: 'valor_monetario' as const, centavos: 100 } }
          : v,
      ),
    }
    const r = calcularIrpfAnual(entradaAnual, EM_2025, construirRegistro(tipoTrocado))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })
})

// ---------------------------------------------------------------------------
// Criptoativos, energia solar e o comparador — CALC-021, CALC-066 e CALC-048
// ---------------------------------------------------------------------------

describe('CALC-021 · criptoativos', () => {
  const registroCripto = construirRegistro(GANHO_DE_CAPITAL)
  const base = {
    alienadoBrasil: centavos(5_000_000),
    alienadoExterior: centavos(0),
    custoAquisicao: centavos(1_000_000),
  }

  it.each([
    ['vendas no Brasil', { alienadoBrasil: centavos(-1) }],
    ['vendas no exterior', { alienadoExterior: centavos(-1) }],
    ['custo de aquisição', { custoAquisicao: centavos(-1) }],
  ])('recusa %s negativo', (_n, campo) => {
    const r = calcularCripto({ ...base, ...campo }, '2026-06-15', registroCripto)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('recusa tabela cadastrada com tipo errado', () => {
    const trocado: ConjuntoDeParametros = {
      ...GANHO_DE_CAPITAL,
      vigencias: GANHO_DE_CAPITAL.vigencias.map((v) =>
        v.parametroId === 'ganho-capital-tabela'
          ? { ...v, valor: { tipo: 'valor_monetario' as const, centavos: 1 } }
          : v,
      ),
    }
    const r = calcularCripto(base, '2026-06-15', construirRegistro(trocado))
    expect(r.ok).toBe(false)
  })

  it('recusa teto de isenção cadastrado com tipo errado', () => {
    const trocado: ConjuntoDeParametros = {
      ...GANHO_DE_CAPITAL,
      vigencias: GANHO_DE_CAPITAL.vigencias.map((v) =>
        v.parametroId === 'ganho-capital-isencao-pequeno-valor'
          ? { ...v, valor: { tipo: 'inteiro' as const, valor: 1 } }
          : v,
      ),
    }
    const r = calcularCripto(base, '2026-06-15', construirRegistro(trocado))
    expect(r.ok).toBe(false)
  })
})

describe('CALC-066 · energia solar', () => {
  const registroSolar = construirRegistro(ENERGIA_DISTRIBUIDA)
  const base = {
    investimento: centavos(2_000_000),
    geracaoMensalKwh: 500,
    consumoMensalKwh: 600,
    tarifaKwh: centavos(95),
    tarifaFioBKwh: centavos(30),
    custoFixoMensal: centavos(5_000),
    regime: 'novo' as const,
  }

  it.each([
    ['investimento', { investimento: centavos(-1) }],
    ['tarifa', { tarifaKwh: centavos(-1) }],
    ['tarifa do Fio B', { tarifaFioBKwh: centavos(-1) }],
    ['custo fixo', { custoFixoMensal: centavos(-1) }],
  ])('recusa %s negativo', (_n, campo) => {
    const r = calcularSolar({ ...base, ...campo }, '2026-06-15', registroSolar)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it.each([
    ['geração fracionária', { geracaoMensalKwh: 1.5 }],
    ['consumo negativo', { consumoMensalKwh: -1 }],
  ])('recusa %s', (_n, campo) => {
    const r = calcularSolar({ ...base, ...campo }, '2026-06-15', registroSolar)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('recusa percentual do Fio B com tipo errado', () => {
    const trocado: ConjuntoDeParametros = {
      ...ENERGIA_DISTRIBUIDA,
      vigencias: ENERGIA_DISTRIBUIDA.vigencias.map((v) => ({
        ...v,
        valor: { tipo: 'valor_monetario' as const, centavos: 1 },
      })),
    }
    const r = calcularSolar(base, '2026-06-15', construirRegistro(trocado))
    expect(r.ok).toBe(false)
  })
})

describe('CALC-048 · comparador', () => {
  const registroComp = construirRegistro(...TODOS_OS_CONJUNTOS)
  const base = {
    salarioClt: centavos(1_000_000),
    faturamento: centavos(1_500_000),
    proLabore: centavos(200_000),
    folhaMensal: centavos(200_000),
    custoContabil: centavos(50_000),
    dependentes: 0,
    atividadeMei: 'servicos' as const,
  }

  it.each([
    ['salário', { salarioClt: centavos(-1) }],
    ['faturamento', { faturamento: centavos(-1) }],
    ['pró-labore', { proLabore: centavos(-1) }],
    ['folha', { folhaMensal: centavos(-1) }],
    ['contabilidade', { custoContabil: centavos(-1) }],
  ])('recusa %s negativo', (_n, campo) => {
    const r = calcularComparador({ ...base, ...campo }, '2026-06-15', registroComp)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('recusa dependentes fracionário', () => {
    const r = calcularComparador({ ...base, dependentes: 1.5 }, '2026-06-15', registroComp)
    expect(r.ok).toBe(false)
  })

  /**
   * Pró-labore maior que o faturamento não é cenário: seria distribuir o que
   * não entrou. Recusar é melhor que devolver lucro negativo saneado a zero,
   * que pareceria uma resposta.
   */
  it('recusa pró-labore maior que o faturamento', () => {
    const r = calcularComparador(
      { ...base, proLabore: centavos(2_000_000) },
      '2026-06-15',
      registroComp,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('faturamento zero não divide por zero — o fator R vira zero', () => {
    const r = calcularComparador(
      { ...base, faturamento: centavos(0), proLabore: centavos(0), folhaMensal: centavos(0) },
      '2026-06-15',
      registroComp,
    )
    // Sem receita não há Simples a calcular: a tabela não resolve.
    expect(r.ok).toBe(false)
  })
})
