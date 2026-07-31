/**
 * Aritmética de datas — `src/lib/engine/datas.ts`.
 *
 * **Por que este arquivo é grande para um módulo pequeno.** É onde um defeito
 * não aparece como erro: desloca um dia, o mês perde a fração de 15 dias, e um
 * avo de 13º ou de férias some do resultado sem nenhum sintoma. O usuário
 * recebe um número plausível e menor do que o devido.
 *
 * Os casos de fronteira aqui são todos de dia: 14 contra 15, véspera de
 * aniversário contra aniversário, 28 contra 29 de fevereiro.
 */

import { describe, expect, it } from 'vitest'

import {
  anosCompletos,
  avosPorQuinzena,
  compararDatas,
  diasEntre,
  diasNoMes,
  ehBissexto,
  escreverData,
  inicioPeriodoAquisitivo,
  lerData,
  somarDias,
} from '../../src/lib/engine/datas'

const d = (iso: string) => {
  const r = lerData(iso)
  if (!r) throw new Error(`data inválida no teste: ${iso}`)
  return r
}

describe('lerData', () => {
  it('lê a forma ISO', () => {
    expect(lerData('2026-07-15')).toEqual({ ano: 2026, mes: 7, dia: 15 })
  })

  it('recusa formato fora do ISO', () => {
    expect(lerData('15/07/2026')).toBeNull()
    expect(lerData('2026-7-15')).toBeNull()
    expect(lerData('')).toBeNull()
  })

  it('recusa data que não existe no calendário', () => {
    expect(lerData('2026-02-30')).toBeNull()
    expect(lerData('2026-13-01')).toBeNull()
    expect(lerData('2026-00-10')).toBeNull()
    expect(lerData('2026-04-31')).toBeNull()
  })

  it('aceita 29 de fevereiro só em ano bissexto', () => {
    expect(lerData('2024-02-29')).not.toBeNull()
    expect(lerData('2026-02-29')).toBeNull()
  })
})

describe('escreverData', () => {
  it('preenche mês e dia com zero à esquerda', () => {
    expect(escreverData({ ano: 2026, mes: 1, dia: 5 })).toBe('2026-01-05')
  })
})

describe('ehBissexto — a regra secular é a que se erra', () => {
  it('múltiplo de 4 é bissexto', () => {
    expect(ehBissexto(2024)).toBe(true)
  })

  it('múltiplo de 100 NÃO é bissexto', () => {
    expect(ehBissexto(1900)).toBe(false)
  })

  it('múltiplo de 400 é bissexto', () => {
    expect(ehBissexto(2000)).toBe(true)
  })

  it('ano comum não é bissexto', () => {
    expect(ehBissexto(2026)).toBe(false)
  })
})

describe('diasNoMes', () => {
  it('fevereiro tem 28 ou 29 conforme o ano', () => {
    expect(diasNoMes(2026, 2)).toBe(28)
    expect(diasNoMes(2024, 2)).toBe(29)
  })

  it('conhece os meses de 30 e de 31', () => {
    expect(diasNoMes(2026, 4)).toBe(30)
    expect(diasNoMes(2026, 12)).toBe(31)
  })
})

describe('compararDatas', () => {
  it('ordena por ano, mês e dia', () => {
    expect(compararDatas(d('2025-12-31'), d('2026-01-01'))).toBeLessThan(0)
    expect(compararDatas(d('2026-03-10'), d('2026-02-28'))).toBeGreaterThan(0)
    expect(compararDatas(d('2026-05-05'), d('2026-05-05'))).toBe(0)
  })
})

describe('somarDias', () => {
  it('atravessa o fim do mês', () => {
    expect(escreverData(somarDias(d('2026-07-15'), 48))).toBe('2026-09-01')
  })

  it('atravessa a virada do ano', () => {
    expect(escreverData(somarDias(d('2026-12-20'), 30))).toBe('2027-01-19')
  })

  it('respeita fevereiro bissexto', () => {
    expect(escreverData(somarDias(d('2024-02-28'), 1))).toBe('2024-02-29')
    expect(escreverData(somarDias(d('2026-02-28'), 1))).toBe('2026-03-01')
  })

  it('anda para trás', () => {
    expect(escreverData(somarDias(d('2026-03-01'), -1))).toBe('2026-02-28')
    expect(escreverData(somarDias(d('2026-01-01'), -1))).toBe('2025-12-31')
  })

  it('somar zero não move', () => {
    expect(escreverData(somarDias(d('2026-06-10'), 0))).toBe('2026-06-10')
  })
})

describe('diasEntre', () => {
  it('conta dias corridos', () => {
    expect(diasEntre(d('2026-07-15'), d('2026-09-01'))).toBe(48)
  })

  it('conta o dia extra do ano bissexto', () => {
    expect(diasEntre(d('2024-01-01'), d('2025-01-01'))).toBe(366)
    expect(diasEntre(d('2026-01-01'), d('2027-01-01'))).toBe(365)
  })

  it('é simétrica com sinal', () => {
    expect(diasEntre(d('2026-09-01'), d('2026-07-15'))).toBe(-48)
  })

  it('atravessa o século sem erro', () => {
    // 1900 não é bissexto e 2000 é: 100 anos com 24 bissextos, não 25.
    expect(diasEntre(d('1900-01-01'), d('2000-01-01'))).toBe(36_524)
  })
})

describe('anosCompletos — a véspera do aniversário é o erro clássico', () => {
  it('não conta o ano na véspera', () => {
    expect(anosCompletos(d('2020-03-10'), d('2026-03-09'))).toBe(5)
  })

  it('conta no próprio aniversário', () => {
    expect(anosCompletos(d('2020-03-10'), d('2026-03-10'))).toBe(6)
  })

  it('conta depois do aniversário', () => {
    expect(anosCompletos(d('2020-03-10'), d('2026-07-15'))).toBe(6)
  })

  it('nunca é negativo', () => {
    expect(anosCompletos(d('2026-07-15'), d('2020-03-10'))).toBe(0)
  })

  it('mês anterior ao de admissão não fecha o ano', () => {
    expect(anosCompletos(d('2020-07-10'), d('2026-06-30'))).toBe(5)
  })
})

describe('avosPorQuinzena — RN-015, a fronteira dos 15 dias', () => {
  it('14 dias no mês NÃO contam avo', () => {
    // 18/01 a 31/01 = 14 dias.
    expect(avosPorQuinzena(d('2026-01-18'), d('2026-01-31'), 12)).toBe(0)
  })

  it('exatamente 15 dias contam avo', () => {
    // 17/01 a 31/01 = 15 dias.
    expect(avosPorQuinzena(d('2026-01-17'), d('2026-01-31'), 12)).toBe(1)
  })

  it('conta um avo por mês cheio', () => {
    expect(avosPorQuinzena(d('2026-01-01'), d('2026-08-31'), 12)).toBe(8)
  })

  it('o último mês parcial só conta se alcançar 15 dias', () => {
    expect(avosPorQuinzena(d('2026-01-01'), d('2026-09-01'), 12)).toBe(8)
    expect(avosPorQuinzena(d('2026-01-01'), d('2026-09-15'), 12)).toBe(9)
  })

  it('respeita o teto de 12 avos', () => {
    expect(avosPorQuinzena(d('2020-01-01'), d('2026-12-31'), 12)).toBe(12)
  })

  it('intervalo invertido devolve zero em vez de número negativo', () => {
    expect(avosPorQuinzena(d('2026-09-01'), d('2026-01-01'), 12)).toBe(0)
  })

  it('fevereiro curto ainda alcança o avo com 15 dias', () => {
    expect(avosPorQuinzena(d('2026-02-14'), d('2026-02-28'), 12)).toBe(1)
    expect(avosPorQuinzena(d('2026-02-15'), d('2026-02-28'), 12)).toBe(0)
  })
})

describe('inicioPeriodoAquisitivo', () => {
  it('devolve o último aniversário alcançado', () => {
    expect(escreverData(inicioPeriodoAquisitivo(d('2020-03-10'), d('2026-07-15')))).toBe('2026-03-10')
  })

  it('antes do aniversário, devolve o do ano anterior', () => {
    expect(escreverData(inicioPeriodoAquisitivo(d('2020-03-10'), d('2026-02-01')))).toBe('2025-03-10')
  })

  it('admitido em 29 de fevereiro: em ano comum o aniversário cai em 1º de março', () => {
    expect(escreverData(inicioPeriodoAquisitivo(d('2024-02-29'), d('2026-06-01')))).toBe('2026-03-01')
  })

  it('admitido em 29 de fevereiro: em ano bissexto o aniversário é o próprio dia', () => {
    expect(escreverData(inicioPeriodoAquisitivo(d('2024-02-29'), d('2028-06-01')))).toBe('2028-02-29')
  })

  it('no primeiro ano de contrato, o período aquisitivo começa na admissão', () => {
    expect(escreverData(inicioPeriodoAquisitivo(d('2026-01-10'), d('2026-07-15')))).toBe('2026-01-10')
  })
})
