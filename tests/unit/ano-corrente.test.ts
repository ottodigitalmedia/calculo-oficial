/**
 * O seletor de período não oferece ano que ainda não chegou.
 *
 * Existe por um defeito medido em produção em 18/09/2026: CALC-103 abria em
 * "parâmetros legais vigentes em 15/06/2033", porque a tabela de pontos da
 * EC nº 103/2019 tem vigência cadastrada até lá — e a página abre no ano mais
 * recente que o registro oferece.
 */

import { describe, expect, it } from 'vitest'

import { CALCULADORAS, porSlug } from '../../src/lib/calculadoras'
import { formularioDe } from '../../src/lib/calculadoras/tipos'
import { TODOS_OS_CONJUNTOS } from '../../src/lib/params/data/todos'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(...TODOS_OS_CONJUNTOS)

describe('ano corrente no seletor de período', () => {
  it('a regra de pontos abre no ano corrente, não no fim da tabela', () => {
    const pontos = porSlug('aposentadoria-por-pontos')!
    expect(formularioDe(pontos, registro).anosDisponiveis[0]).toBe(2033)
    const f = formularioDe(pontos, registro, 2026)
    expect(f.anosDisponiveis[0]).toBe(2026)
    expect(f.anosDisponiveis.at(-1)).toBe(2019)
  })

  it('nenhuma calculadora oferece ano posterior ao corrente', () => {
    for (const c of CALCULADORAS) {
      const anos = formularioDe(c, registro, 2026).anosDisponiveis
      expect(anos.every((a) => a <= 2026) || anos.every((a) => a > 2026), c.slug).toBe(true)
    }
  })

  it('se toda a cobertura é futura, a lista fica como está', () => {
    const pontos = porSlug('aposentadoria-por-pontos')!
    expect(formularioDe(pontos, registro, 2010).anosDisponiveis).toEqual(
      formularioDe(pontos, registro).anosDisponiveis,
    )
  })
})
