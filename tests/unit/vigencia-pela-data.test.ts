/**
 * `vigenciaPelaData` — a calculadora que resolve a vigência por um campo de
 * data não oferece seletor de período, e o aviso cita o campo.
 *
 * Existe por um defeito medido em produção em 17/09/2026: a licença-paternidade
 * abria em "parâmetros legais vigentes em 15/06/2028".
 */

import { describe, expect, it } from 'vitest'

import { CALCULADORAS, porSlug } from '../../src/lib/calculadoras'
import { formularioDe } from '../../src/lib/calculadoras/tipos'
import { TODOS_OS_CONJUNTOS } from '../../src/lib/params/data/todos'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(...TODOS_OS_CONJUNTOS)

describe('vigenciaPelaData', () => {
  it('toda declaração aponta para um campo de data que existe', () => {
    for (const c of CALCULADORAS) {
      if (c.vigenciaPelaData === undefined) continue
      const campo = c.campos.find((x) => x.id === c.vigenciaPelaData)
      expect(campo?.tipo, `${c.slug} declara "${c.vigenciaPelaData}"`).toBe('data')
    }
  })

  it('o formulário das licenças leva o rótulo do campo que decide', () => {
    const f = formularioDe(porSlug('licenca-paternidade')!, registro)
    expect(f.vigenciaPelaData).toEqual({ campo: 'nascimento', rotulo: 'Data do nascimento, da adoção ou da guarda' })
    expect(formularioDe(porSlug('licenca-maternidade')!, registro).vigenciaPelaData?.campo).toBe('inicio')
    expect(formularioDe(porSlug('salario-familia')!, registro).vigenciaPelaData).toBeUndefined()
  })

  it('a memória da licença cita a data do nascimento, não a da página', async () => {
    const r = porSlug('licenca-paternidade')!.calcular(
      { nascimento: '2027-01-01', empresaCidada: 'nao' },
      '2028-06-15' as DataISO,
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.traco.dataReferencia).toBe('2027-01-01')
  })
})
