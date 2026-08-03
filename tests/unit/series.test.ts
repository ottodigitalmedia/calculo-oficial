/**
 * A série econômica — `ADR-006`, `INT-001`.
 *
 * ORIGEM DOS DADOS DESTE ARQUIVO, DECLARADA
 *
 * As respostas usadas aqui são **capturas reais** do serviço do Banco Central,
 * feitas em 02/08/2026 com requisição própria — não exemplos de terceiro, que é
 * o que `06-api-spec` §4.1 proíbe em letras maiúsculas.
 *
 * Cada bloco corresponde a uma armadilha medida naquele dia, e três delas não
 * constavam da ficha do projeto irmão: a ordem que difere por série, o campo
 * `dataFim` que só algumas trazem, e o teto de vinte pontos do `ultimos/N`.
 *
 * Rede não é tocada aqui. O que decide se um dado entra no cache mora em
 * `normalizar.ts`, que é puro — e é essa separação que torna estes casos
 * possíveis.
 */

import { describe, expect, it } from 'vitest'

import {
  coletadoEm,
  estaDesatualizado,
  paraBasisPoints,
  pontosDaSerie,
  ultimoPonto,
} from '../../src/lib/series'
import { dataParaIso, normalizar, valorParaEscala } from '../../src/lib/series/normalizar'
import { SERIES, type SerieId } from '../../src/lib/series/tipos'
import type { DataISO } from '../../src/lib/params/tipos'

const SEM_LIMITE = { minimo: -1_000_000, maximo: 1_000_000 }

// ---------------------------------------------------------------------------
// Armadilha 1 — `valor` é string, com ponto decimal
// ---------------------------------------------------------------------------

describe('valor textual do provedor', () => {
  it('converte com a escala de quatro casas', () => {
    expect(valorParaEscala('14.15')).toBe(141_500)
    expect(valorParaEscala('0.16')).toBe(1_600)
    expect(valorParaEscala('0.1729')).toBe(1_729)
    expect(valorParaEscala('0')).toBe(0)
  })

  it('preserva o sinal negativo, que o IGP-M produz de verdade', () => {
    // Julho de 2026, medido: −1,16%.
    expect(valorParaEscala('-1.16')).toBe(-11_600)
  })

  it('não passa por ponto flutuante — a quarta casa sai exata', () => {
    // `Number("0.1729") * 10000` chega a 1728,9999999999998 em algumas
    // máquinas, e o truncamento seguinte perderia um milésimo em silêncio.
    for (const [texto, esperado] of [
      ['0.0001', 1],
      ['0.0003', 3],
      ['1.0001', 10_001],
      ['0.6739', 6_739],
    ] as const) {
      expect(valorParaEscala(texto), texto).toBe(esperado)
    }
  })

  /**
   * Precisão maior que a declarada não é detalhe a truncar: é sinal de que a
   * série mudou de formato. `S-4` manda rejeitar e ficar com o cache.
   */
  it('rejeita mais casas decimais do que a escala comporta', () => {
    // É o formato da Selic DIÁRIA, série 11, que este projeto não coleta.
    expect(valorParaEscala('0.052531')).toBeNull()
  })

  it('rejeita o que não é número', () => {
    for (const ruim of ['', 'abc', '1,15', '1.2.3', 'NaN', ' ']) {
      expect(valorParaEscala(ruim), ruim).toBeNull()
    }
  })
})

// ---------------------------------------------------------------------------
// Armadilha 2 — `data` vem em dd/MM/aaaa
// ---------------------------------------------------------------------------

describe('data do provedor', () => {
  it('converte para ISO', () => {
    expect(dataParaIso('01/07/2026')).toBe('2026-07-01')
    expect(dataParaIso('30/07/2026')).toBe('2026-07-30')
  })

  it('rejeita ISO e qualquer outra forma — o formato é um só', () => {
    for (const ruim of ['2026-07-01', '1/7/2026', '01-07-2026', '13/13/2026', '']) {
      expect(dataParaIso(ruim), ruim).toBeNull()
    }
  })
})

// ---------------------------------------------------------------------------
// Armadilha 3 — a ordem difere por série
// ---------------------------------------------------------------------------

/**
 * O achado que a ficha do projeto irmão não trazia, e o mais perigoso dos
 * cinco: as duas capturas abaixo saíram da MESMA chamada `ultimos/N`, no mesmo
 * dia, e vieram em ordens opostas. Ler o último item do array como "o mais
 * recente" acerta numa e erra na outra — devolvendo um valor plausível.
 */
describe('ordem dos pontos', () => {
  const selicDescendente = [
    { data: '01/07/2026', valor: '14.15' },
    { data: '01/06/2026', valor: '14.29' },
    { data: '01/05/2026', valor: '14.40' },
  ]
  const ipcaAscendente = [
    { data: '01/04/2026', valor: '0.67' },
    { data: '01/05/2026', valor: '0.58' },
    { data: '01/06/2026', valor: '0.16' },
  ]

  it('a série que chega decrescente sai crescente', () => {
    const { pontos } = normalizar(selicDescendente, SEM_LIMITE)
    expect(pontos.map((p) => p.data)).toEqual(['2026-05-01', '2026-06-01', '2026-07-01'])
    expect(pontos[pontos.length - 1]?.valor).toBe(141_500)
  })

  it('a que já chega crescente permanece crescente', () => {
    const { pontos } = normalizar(ipcaAscendente, SEM_LIMITE)
    expect(pontos.map((p) => p.data)).toEqual(['2026-04-01', '2026-05-01', '2026-06-01'])
    expect(pontos[pontos.length - 1]?.valor).toBe(1_600)
  })
})

// ---------------------------------------------------------------------------
// Armadilha 4 — o schema não é uniforme
// ---------------------------------------------------------------------------

describe('campos além de data e valor', () => {
  /** Captura real da TR (226) e da poupança (195): elas trazem `dataFim`. */
  const comDataFim = [
    { data: '29/07/2026', dataFim: '29/08/2026', valor: '0.1729' },
    { data: '30/07/2026', dataFim: '30/08/2026', valor: '0.1710' },
  ]

  it('não recusa o item por trazer campo desconhecido', () => {
    const { pontos, descartados } = normalizar(comDataFim, { minimo: 0, maximo: 50_000 })
    expect(descartados).toEqual([])
    expect(pontos).toHaveLength(2)
    expect(pontos[1]?.valor).toBe(1_710)
  })
})

// ---------------------------------------------------------------------------
// S-4 — validação por formato e por intervalo plausível
// ---------------------------------------------------------------------------

describe('validação da resposta', () => {
  it('descarta o ponto fora do intervalo plausível, e mantém os demais', () => {
    const { pontos, descartados } = normalizar(
      [
        { data: '01/06/2026', valor: '0.16' },
        { data: '01/07/2026', valor: '900.00' },
      ],
      { minimo: -100_000, maximo: 100_000 },
    )
    expect(pontos).toHaveLength(1)
    expect(descartados).toHaveLength(1)
    expect(descartados[0]).toContain('intervalo plausível')
  })

  it('resposta que não é lista devolve zero pontos, sem lançar', () => {
    for (const ruim of [null, undefined, 42, 'erro', { erro: { statusCode: 400 } }]) {
      const { pontos } = normalizar(ruim, SEM_LIMITE)
      expect(pontos).toEqual([])
    }
  })

  /**
   * O corpo do erro 400 do serviço é um OBJETO, não uma lista — e foi ele que
   * apareceu quando `ultimos/120` estourou o teto de vinte. Normalizar isso tem
   * de devolver vazio, e o coletor trata vazio como falha, mantendo o cache.
   */
  it('o corpo do erro do provedor não vira ponto', () => {
    const erro = {
      erro: { statusCode: 400, detail: 'A quantidade máxima de valores deve ser 20' },
    }
    expect(normalizar(erro, SEM_LIMITE).pontos).toEqual([])
  })

  it('item sem data ou sem valor é descartado, não aceito com buraco', () => {
    const { pontos, descartados } = normalizar(
      [{ data: '01/06/2026' }, { valor: '0.16' }, { data: '01/07/2026', valor: '0.20' }],
      SEM_LIMITE,
    )
    expect(pontos).toHaveLength(1)
    expect(descartados).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Conversão de escala e defasagem
// ---------------------------------------------------------------------------

describe('escala e basis points', () => {
  it('converte com arredondamento declarado', () => {
    expect(paraBasisPoints(141_500)).toBe(1_415)
    expect(paraBasisPoints(1_729)).toBe(17)
    expect(paraBasisPoints(1_750)).toBe(18)
    expect(paraBasisPoints(1_750, 'truncar')).toBe(17)
  })

  it('preserva sinal', () => {
    expect(paraBasisPoints(-11_600)).toBe(-116)
  })
})

describe('RN-033 · defasagem do indicador', () => {
  const ponto = { data: '2026-06-01' as DataISO, valor: 1_600 }

  it('dentro de trinta dias não avisa', () => {
    expect(estaDesatualizado(ponto, '2026-06-30' as DataISO)).toBe(false)
  })

  it('além de trinta dias avisa', () => {
    expect(estaDesatualizado(ponto, '2026-07-05' as DataISO)).toBe(true)
  })

  it('atravessa a virada do ano sem se perder', () => {
    const dezembro = { data: '2025-12-01' as DataISO, valor: 1_000 }
    expect(estaDesatualizado(dezembro, '2025-12-20' as DataISO)).toBe(false)
    expect(estaDesatualizado(dezembro, '2026-01-15' as DataISO)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// O cache versionado no repositório
// ---------------------------------------------------------------------------

/**
 * O arquivo de cache é gerado por script e **commitado** (`S-2`), o que o torna
 * a única fonte de dado do repositório que ninguém revisa linha a linha. Estas
 * asserções são estruturais de propósito: elas não fixam valores, que mudam a
 * cada coleta, e sim os invariantes de que o resto do sistema depende.
 */
describe('cache versionado', () => {
  for (const definicao of SERIES) {
    describe(definicao.id, () => {
      const pontos = pontosDaSerie(definicao.id as SerieId)

      it('existe e não está vazio', () => {
        expect(pontos.length).toBeGreaterThan(0)
        expect(coletadoEm(definicao.id as SerieId)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })

      it('está em ordem crescente — todo o resto do sistema depende disso', () => {
        const datas = pontos.map((p) => p.data)
        expect([...datas].sort()).toEqual(datas)
      })

      it('o último ponto é o mais recente', () => {
        expect(ultimoPonto(definicao.id as SerieId)?.data).toBe(pontos[pontos.length - 1]?.data)
      })

      it('todo valor está dentro do intervalo plausível declarado', () => {
        for (const p of pontos) {
          expect(p.valor, `${p.data}`).toBeGreaterThanOrEqual(definicao.minimoPlausivel)
          expect(p.valor, `${p.data}`).toBeLessThanOrEqual(definicao.maximoPlausivel)
        }
      })

      it('respeita o teto de pontos guardados', () => {
        expect(pontos.length).toBeLessThanOrEqual(definicao.pontosNoCache)
      })

      it('toda data é ISO válida', () => {
        for (const p of pontos) expect(p.data).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })
  }

  /**
   * O teto de vinte do `ultimos/N` é do provedor, e declará-lo maior aqui faria
   * a coleta falhar nas seis séries de uma vez — que foi exatamente o que
   * aconteceu na primeira execução.
   */
  it('nenhuma janela `ultimos` pede mais que o teto do provedor', () => {
    for (const s of SERIES) {
      if (s.janela.tipo === 'ultimos') {
        expect(s.janela.quantidade, s.id).toBeLessThanOrEqual(20)
      }
    }
  })

  it('toda série declara quem produz o dado, e não só quem o publica', () => {
    for (const s of SERIES) {
      expect(s.produtor.length, s.id).toBeGreaterThan(0)
    }
    // O BCB republica; o IBGE e a FGV produzem. Creditar só o republicador é
    // atribuição errada — sexta armadilha de §6.1.
    expect(SERIES.find((s) => s.id === 'ipca-mensal')?.produtor).toContain('IBGE')
    expect(SERIES.find((s) => s.id === 'igpm-mensal')?.produtor).toContain('Getulio Vargas')
  })
})
