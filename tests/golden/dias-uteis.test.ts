/**
 * Casos-ouro de CALC-072 — dias úteis entre datas.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Os feriados nacionais vêm das leis, lidas no Planalto em 06/08/2026:
 *
 *   Lei nº 662/1949, art. 1º, com a redação da Lei nº 10.607/2002 — "São
 *   feriados nacionais os dias 1º de janeiro, 21 de abril, 1º de maio, 7 de
 *   setembro, 2 de novembro, 15 de novembro e 25 de dezembro."
 *
 *   Lei nº 6.802/1980, art. 1º — 12 de outubro.
 *   Lei nº 14.759/2023, art. 1º — 20 de novembro.
 *
 *   Lei nº 9.093/1995, art. 1º e 2º — feriados civis são os de lei federal; a
 *   Sexta-Feira da Paixão é feriado RELIGIOSO, de lei MUNICIPAL, dentro de um
 *   limite de quatro. Carnaval e Corpus Christi não estão em nenhuma das duas
 *   listas: são ponto facultativo.
 *
 * As datas de Páscoa usadas para conferir o cômputo gregoriano são públicas e
 * verificáveis em qualquer calendário litúrgico:
 *
 *   2024 — 31 de março     2025 — 20 de abril     2026 — 5 de abril
 *   2027 — 28 de março     2000 — 23 de abril     1999 — 4 de abril
 *
 * As propriedades que estes casos travam:
 *
 *   1. **Carnaval, Sexta-feira Santa e Corpus Christi NÃO entram por padrão.**
 *      É o erro que quase toda calculadora do gênero comete, e o motivo de esta
 *      página existir.
 *   2. **O feriado só conta a partir da lei que o criou** — 20 de novembro não
 *      existe em 2020, e contar seria a extrapolação que `RN-003` impede.
 *   3. **Feriado que cai em fim de semana não desconta duas vezes.**
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDef } from '../../src/lib/calculadoras/dias-uteis'
import {
  calcularDiasUteis,
  dataDoMovel,
  domingoDePascoa,
} from '../../src/lib/engine/calculadoras/dias-uteis'
import type { FeriadoMovel } from '../../src/lib/engine/calculadoras/dias-uteis'
import { FERIADOS } from '../../src/lib/params/data/feriados'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(FERIADOS)
const REF_2026 = '2026-06-15' as DataISO

const BASE: {
  inicio: DataISO
  fim: DataISO
  moveis: readonly FeriadoMovel[]
  locaisEmDiaDeSemana: number
  sabadoEhUtil: boolean
} = {
  inicio: '2026-01-01' as DataISO,
  fim: '2026-01-31' as DataISO,
  moveis: [],
  locaisEmDiaDeSemana: 0,
  sabadoEhUtil: false,
}

function calc(over: Partial<typeof BASE> = {}, ref = REF_2026) {
  const r = calcularDiasUteis({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-072 · o cômputo da Páscoa', () => {
  it('reproduz as datas conhecidas', () => {
    const casos: readonly [number, number, number][] = [
      [2024, 3, 31],
      [2025, 4, 20],
      [2026, 4, 5],
      [2027, 3, 28],
      [2000, 4, 23],
      [1999, 4, 4],
    ]
    for (const [ano, mes, dia] of casos) {
      expect(domingoDePascoa(ano), `Páscoa de ${ano}`).toEqual({ ano, mes, dia })
    }
  })

  it('os móveis derivam da Páscoa pelos deslocamentos conhecidos', () => {
    // Páscoa de 2026 em 5 de abril: carnaval em 17/02, sexta-santa em 03/04,
    // Corpus Christi em 04/06.
    expect(dataDoMovel(2026, 'carnaval')).toEqual({ ano: 2026, mes: 2, dia: 17 })
    expect(dataDoMovel(2026, 'sexta-santa')).toEqual({ ano: 2026, mes: 4, dia: 3 })
    expect(dataDoMovel(2026, 'corpus-christi')).toEqual({ ano: 2026, mes: 6, dia: 4 })
  })
})

describe('CALC-072 · a contagem', () => {
  it('janeiro de 2026 tem 21 dias úteis', () => {
    // 31 dias; 1º de janeiro é quinta e é feriado. Sábados e domingos: 9.
    const v = calc()
    expect(v.diasCorridos).toBe(31)
    expect(v.fimDeSemana).toBe(9)
    expect(v.feriadosEmDiaUtil).toHaveLength(1)
    expect(v.feriadosEmDiaUtil[0]?.nome).toBe('Confraternização Universal')
    expect(v.diasUteis).toBe(21)
  })

  it('o mesmo dia nos dois extremos conta como um', () => {
    const v = calc({ inicio: '2026-03-10' as DataISO, fim: '2026-03-10' as DataISO })
    expect(v.diasCorridos).toBe(1)
    expect(v.diasUteis).toBe(1)
  })

  it('contando o sábado, sobram só os domingos', () => {
    const v = calc({ sabadoEhUtil: true })
    expect(v.fimDeSemana).toBe(4)
    expect(v.diasUteis).toBe(31 - 4 - 1)
  })

  /**
   * Feriado em fim de semana já foi contado como fim de semana — descontá-lo de
   * novo tiraria um dia útil que não existe.
   */
  it('feriado que cai em fim de semana não desconta duas vezes', () => {
    // 15 de novembro de 2026 é um domingo.
    const v = calc({ inicio: '2026-11-15' as DataISO, fim: '2026-11-15' as DataISO })
    expect(v.diasCorridos).toBe(1)
    expect(v.fimDeSemana).toBe(1)
    expect(v.feriadosEmDiaUtil).toHaveLength(0)
    expect(v.diasUteis).toBe(0)
  })

  it('data final antes da inicial é recusada', () => {
    const r = calcularDiasUteis(
      { ...BASE, inicio: '2026-03-10' as DataISO, fim: '2026-03-09' as DataISO },
      REF_2026,
      registro,
    )
    expect(r.ok).toBe(false)
  })

  it('data ausente mantém o estado pendente', () => {
    const r = calcularDiasUteis({ ...BASE, fim: '' as DataISO }, REF_2026, registro)
    expect(r.ok).toBe(false)
  })
})

/**
 * A razão de existir da página: os três não são feriados nacionais, e não
 * entram sozinhos.
 */
describe('CALC-072 · os móveis não entram por padrão', () => {
  it('a semana do carnaval de 2026 tem cinco dias úteis sem marcar nada', () => {
    // Carnaval em 17/02/2026, uma terça. Semana de 16 a 20 de fevereiro.
    const v = calc({ inicio: '2026-02-16' as DataISO, fim: '2026-02-20' as DataISO })
    expect(v.diasUteis).toBe(5)
    expect(v.feriadosEmDiaUtil).toHaveLength(0)
  })

  it('marcando o carnaval, a mesma semana tem quatro', () => {
    const v = calc({
      inicio: '2026-02-16' as DataISO,
      fim: '2026-02-20' as DataISO,
      moveis: ['carnaval'],
    })
    expect(v.diasUteis).toBe(4)
    expect(v.feriadosEmDiaUtil[0]?.nacional).toBe(false)
  })

  it('a Sexta-feira da Paixão e Corpus Christi seguem a mesma regra', () => {
    const semanaSanta = { inicio: '2026-04-03' as DataISO, fim: '2026-04-03' as DataISO }
    expect(calc(semanaSanta).diasUteis).toBe(1)
    expect(calc({ ...semanaSanta, moveis: ['sexta-santa'] }).diasUteis).toBe(0)

    const corpus = { inicio: '2026-06-04' as DataISO, fim: '2026-06-04' as DataISO }
    expect(calc(corpus).diasUteis).toBe(1)
    expect(calc({ ...corpus, moveis: ['corpus-christi'] }).diasUteis).toBe(0)
  })

  it('o que é marcado aparece como NÃO nacional', () => {
    const v = calc({
      inicio: '2026-02-16' as DataISO,
      fim: '2026-06-30' as DataISO,
      moveis: ['carnaval', 'sexta-santa', 'corpus-christi'],
    })
    const naoNacionais = v.feriadosEmDiaUtil.filter((f) => !f.nacional)
    expect(naoNacionais).toHaveLength(3)
  })
})

/**
 * `RN-003` pela porta da frente: o feriado só existe a partir da lei que o
 * criou, e contar antes disso seria extrapolar.
 */
describe('CALC-072 · o feriado só conta a partir da lei que o criou', () => {
  /**
   * A prova de que os feriados saem do PERÍODO, e não da data de referência:
   * as duas contas abaixo usam a MESMA data de referência — hoje — e mesmo
   * assim dão resultados diferentes, porque os anos consultados são outros.
   */
  it('20 de novembro é dia útil em 2020 e feriado em 2026, com a mesma referência', () => {
    // 20/11/2020 foi uma sexta-feira; 20/11/2026 também é sexta.
    const em2020 = calc({ inicio: '2020-11-20' as DataISO, fim: '2020-11-20' as DataISO })
    expect(em2020.diasUteis).toBe(1)
    expect(em2020.feriadosEmDiaUtil).toHaveLength(0)

    const em2026 = calc({ inicio: '2026-11-20' as DataISO, fim: '2026-11-20' as DataISO })
    expect(em2026.diasUteis).toBe(0)
    expect(em2026.feriadosEmDiaUtil[0]?.nome).toContain('Zumbi')
  })

  it('21 de abril não era feriado nacional antes de 2002', () => {
    // 21/04/2000 foi uma sexta-feira.
    expect(calc({ inicio: '2000-04-21' as DataISO, fim: '2000-04-21' as DataISO }).diasUteis).toBe(1)
    // 21/04/2026 é uma terça — já feriado.
    expect(calc({ inicio: '2026-04-21' as DataISO, fim: '2026-04-21' as DataISO }).diasUteis).toBe(0)
  })

  it('um período que atravessa a lei conta cada ano com a sua lista', () => {
    // De 20/11/2023 (segunda) a 20/11/2024 (quarta). O de 2023 é anterior à
    // publicação da lei, em 22/12/2023; o de 2024 já é feriado.
    const v = calc({ inicio: '2023-11-20' as DataISO, fim: '2024-11-20' as DataISO })
    const zumbis = v.feriadosEmDiaUtil.filter((f) => f.nome.includes('Zumbi'))
    expect(zumbis).toHaveLength(1)
    expect(zumbis[0]?.data).toBe('2024-11-20')
  })

  it('período anterior à primeira lei de feriados bloqueia o cálculo', () => {
    const r = calcularDiasUteis(
      { ...BASE, inicio: '1940-01-01' as DataISO, fim: '1940-01-31' as DataISO },
      REF_2026,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

describe('CALC-072 · os feriados locais', () => {
  it('descontam dos dias úteis, pela quantidade informada', () => {
    const semLocais = calc()
    const comLocais = calc({ locaisEmDiaDeSemana: 2 })
    expect(comLocais.diasUteis).toBe(semLocais.diasUteis - 2)
    expect(comLocais.locaisDescontados).toBe(2)
  })

  it('não descontam mais do que existe de dia útil', () => {
    const v = calc({ inicio: '2026-03-10' as DataISO, fim: '2026-03-10' as DataISO, locaisEmDiaDeSemana: 9 })
    expect(v.diasUteis).toBe(0)
    expect(v.locaisDescontados).toBe(1)
  })

  it('quantidade negativa é recusada', () => {
    expect(calcularDiasUteis({ ...BASE, locaisEmDiaDeSemana: -1 }, REF_2026, registro).ok).toBe(false)
  })
})

describe('CALC-072 · a definição publicada', () => {
  it('devolve a contagem sem casas decimais', () => {
    const r = calcularDef({ inicio: '2026-01-01', fim: '2026-01-31' }, REF_2026)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(21)
    expect(r.valores.casasDecimais).toBe(0)
    expect(r.valores.unidade).toBe('numero')
  })

  it('os móveis só entram quando a resposta é "sim"', () => {
    const sem = calcularDef({ inicio: '2026-02-16', fim: '2026-02-20' }, REF_2026)
    if (!sem.ok) throw new Error('esperado sucesso')
    expect(sem.valores.principal).toBe(5)

    const com = calcularDef(
      { inicio: '2026-02-16', fim: '2026-02-20', carnaval: 'sim' },
      REF_2026,
    )
    if (!com.ok) throw new Error('esperado sucesso')
    expect(com.valores.principal).toBe(4)
  })

  it('a tabela nomeia o que não é feriado nacional', () => {
    const r = calcularDef(
      { inicio: '2026-02-16', fim: '2026-02-20', carnaval: 'sim' },
      REF_2026,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.tabela?.linhas[0]?.rotulo).toContain('não é feriado nacional')
  })

  it('sem feriado no período, não há tabela', () => {
    const r = calcularDef({ inicio: '2026-03-09', fim: '2026-03-13' }, REF_2026)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.tabela).toBeUndefined()
    expect(r.valores.principal).toBe(5)
  })

  it('a nota sobre os móveis aparece sempre', () => {
    const r = calcularDef({ inicio: '2026-01-01', fim: '2026-01-31' }, REF_2026)
    if (!r.ok) throw new Error('esperado sucesso')
    expect((r.valores.notas ?? []).some((n) => n.includes('NÃO são feriados nacionais'))).toBe(true)
  })
})
