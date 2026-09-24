/**
 * O seletor de período alcança toda vigência — inclusive a que começa no meio
 * do ano (`ESTADO-DO-PROJETO` §7.99).
 *
 * O seletor oferecia anos, e cada ano virava 15 de junho. A tabela do IR mudou
 * em 01/05/2025: janeiro a abril de 2025 não podiam ser escolhidos em nenhuma
 * das vinte calculadoras que a usam, e uma rescisão de março de 2025 saía com
 * a tabela de maio.
 */

import { describe, expect, it } from 'vitest'

import { CALCULADORAS, porSlug } from '../../src/lib/calculadoras'
import { formularioDe, opcaoDoPeriodo } from '../../src/lib/calculadoras/tipos'
import { TODOS_OS_CONJUNTOS } from '../../src/lib/params/data/todos'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(...TODOS_OS_CONJUNTOS)
const periodos = (slug: string) => formularioDe(porSlug(slug)!, registro, 2026).periodos

describe('o ano em que a tabela muda no meio vira trechos', () => {
  it('IRRF: 2025 tem dois trechos, com a virada de 01/05', () => {
    expect(periodos('irrf')).toEqual([
      { data: '2026-06-15', rotulo: '2026', inicio: '2026-01-01', fim: '2026-12-31' },
      { data: '2025-06-15', rotulo: '2025 — de 01/05 a 31/12', inicio: '2025-05-01', fim: '2025-12-31' },
      { data: '2025-01-01', rotulo: '2025 — de 01/01 a 30/04', inicio: '2025-01-01', fim: '2025-04-30' },
    ])
  })

  it('o trecho de janeiro a abril calcula com a tabela de janeiro — e o de maio, com a de maio', () => {
    const irrf = porSlug('irrf')!
    const vigencias = (data: string) => {
      const r = irrf.calcular({ rendimentoBruto: 400_000, houveContribuicao: 'sim', inss: 0 }, data as DataISO)
      if (!r.ok) throw new Error(r.detalhe)
      return r.traco.vigenciasAplicadas
    }
    expect(vigencias('2025-01-01')).not.toEqual(vigencias('2025-06-15'))
  })

  it('seguro-desemprego: 2026 parte em 11/01, quando a tabela anual passa a valer', () => {
    const p = periodos('seguro-desemprego')
    expect(p.map((x) => x.rotulo)).toContain('2026 — de 01/01 a 10/01')
    expect(p.find((x) => x.rotulo === '2026 — de 01/01 a 10/01')?.data).toBe('2026-01-01')
  })

  it('a virada que o seletor não controla não parte o ano — saque-aniversário', () => {
    // Os limites da antecipação são resolvidos pela data da contratação.
    expect(periodos('saque-aniversario-do-fgts').every((p) => !p.rotulo.includes('—'))).toBe(true)
  })

  it('ano sem virada no meio continua uma opção só, com o valor de sempre', () => {
    expect(periodos('inss').map((p) => p.data)).toEqual(['2026-06-15', '2025-06-15'])
    expect(periodos('horas-extras')).toHaveLength(1)
  })
})

describe('invariantes, em todo o catálogo', () => {
  for (const calc of CALCULADORAS) {
    const f = formularioDe(calc, registro, 2026)
    it(`${calc.slug}: os trechos não se sobrepõem, cobrem o ano e cada data cai no seu`, () => {
      for (const p of f.periodos) {
        expect(p.inicio <= p.fim).toBe(true)
        // Ano inteiro mantém 15 de junho mesmo quando a cobertura começa depois —
        // `Calculadora.tsx` ajusta a data inicial; trecho sempre contém a sua.
        if (p.rotulo.includes('—')) expect(p.data >= p.inicio && p.data <= p.fim).toBe(true)
      }
      const ordenados = [...f.periodos].sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
      for (let i = 1; i < ordenados.length; i++) {
        expect(ordenados[i]!.inicio > ordenados[i - 1]!.fim).toBe(true)
      }
      // Um trecho por ano, no mínimo — nenhum ano do seletor antigo sumiu.
      expect(new Set(f.periodos.map((p) => p.inicio.slice(0, 4))).size).toBe(f.anosDisponiveis.length)
      // O padrão da página continua sendo uma opção do seletor.
      if (f.anosDisponiveis.length > 0) {
        expect(f.periodos.map((p) => p.data)).toContain(`${f.anosDisponiveis[0]}-06-15`)
      }
    })
  }
})

describe('o link com data qualquer mostra o trecho que a contém', () => {
  it('ref=2025-03-10 aparece como "2025 — de 01/01 a 30/04"', () => {
    expect(opcaoDoPeriodo(periodos('irrf'), '2025-03-10')).toBe('2025-01-01')
    expect(opcaoDoPeriodo(periodos('irrf'), '2025-09-30')).toBe('2025-06-15')
  })

  it('data fora de todos os trechos fica como veio', () => {
    expect(opcaoDoPeriodo(periodos('irrf'), '2019-06-15')).toBe('2019-06-15')
  })
})
