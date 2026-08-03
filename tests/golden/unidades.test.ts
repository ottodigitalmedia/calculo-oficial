/**
 * Casos-ouro de CALC-074 — conversor de unidades.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As razões usadas aqui são **definições**, não medições, e é isso que permite
 * conferi-las de cabeça:
 *
 *   1 polegada = 25,4 mm exatos (acordo internacional da jarda e da libra, 1959)
 *   1 libra    = 453,59237 g exatos, pelo mesmo acordo
 *   1 milha    = 1.609,344 m exatos
 *   1 acre     = 4.046,8564224 m²
 *   0 °C       = 273,15 K · 0 °F = 255,372… K
 *
 * As quatro propriedades que estes casos travam:
 *
 *   1. **Ida e volta fecha.** Converter e desconverter devolve o original —
 *      é o teste que pega erro de razão invertida, que passa despercebido
 *      quando só se olha um sentido.
 *   2. **A escala se adapta.** 1 mm em km é 0,000001, e duas casas fixas
 *      imprimiriam 0,00 — um número errado com cara de certo.
 *   3. **Temperatura não é fator.** 1 °C de LEITURA são 33,8 °F; 1 °C de
 *      VARIAÇÃO são 1,8 °F. Confundir os dois é o erro clássico.
 *   4. **Conversão que não cabe é recusada**, não arredondada em silêncio.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDef } from '../../src/lib/calculadoras/conversor-de-unidades'
import { converterUnidade } from '../../src/lib/engine/calculadoras/unidades'
import { CATEGORIAS } from '../../src/lib/unidades/tabela'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

/** Converte `valor` (em unidades inteiras) e devolve o resultado escalado. */
function converter(categoriaId: string, deId: string, paraId: string, valor: number) {
  const r = converterUnidade(
    { categoriaId, deId, paraId, valor: Math.round(valor * 100) },
    REF,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-074 · as razões que são definições', () => {
  it('1 polegada são 25,40 milímetros', () => {
    const v = converter('comprimento', 'pol', 'mm', 1)
    expect(v.resultado / 10 ** v.casasDecimais).toBe(25.4)
  })

  it('1 milha são 1.609,344 metros', () => {
    const v = converter('comprimento', 'mi', 'm', 1)
    expect(v.resultado / 10 ** v.casasDecimais).toBe(1_609.344)
  })

  it('1 libra são 453,59237 gramas', () => {
    const v = converter('massa', 'lb', 'g', 1)
    expect(v.resultado / 10 ** v.casasDecimais).toBe(453.59237)
  })

  it('1 arroba brasileira são 15 quilos', () => {
    const v = converter('massa', 'arroba', 'kg', 1)
    expect(v.resultado / 10 ** v.casasDecimais).toBe(15)
  })

  it('1 acre são 4.046,8564224 metros quadrados', () => {
    const v = converter('area', 'acre', 'm2', 1)
    expect(v.resultado / 10 ** v.casasDecimais).toBeCloseTo(4_046.8564224, 4)
  })

  /**
   * O alqueire mineiro é exatamente o DOBRO do paulista, e usar o errado dobra
   * ou reduz pela metade o resultado. A propriedade fica travada aqui.
   */
  it('o alqueire mineiro é o dobro do paulista', () => {
    const paulista = converter('area', 'alqueire-paulista', 'ha', 1)
    const mineiro = converter('area', 'alqueire-mineiro', 'ha', 1)
    expect(mineiro.resultado / 10 ** mineiro.casasDecimais).toBe(
      (paulista.resultado / 10 ** paulista.casasDecimais) * 2,
    )
  })

  it('1 m/s são 3,6 km/h', () => {
    const v = converter('velocidade', 'ms', 'kmh', 1)
    expect(v.resultado / 10 ** v.casasDecimais).toBe(3.6)
  })

  it('1 galão americano são 3,785411784 litros', () => {
    const v = converter('volume', 'gal', 'l', 1)
    expect(v.resultado / 10 ** v.casasDecimais).toBeCloseTo(3.785411784, 6)
  })
})

/**
 * A propriedade que pega razão invertida — o defeito que passa quando só se
 * olha um sentido da conversão.
 */
describe('CALC-074 · ida e volta fecham', () => {
  it('converter e desconverter devolve o valor original', () => {
    for (const categoria of CATEGORIAS) {
      for (const de of categoria.unidades) {
        for (const para of categoria.unidades) {
          const ida = converter(categoria.id, de.id, para.id, 100)
          const emUnidades = ida.resultado / 10 ** ida.casasDecimais
          /**
           * A volta só é comparável quando o valor intermediário é de pelo
           * menos uma unidade: o campo aceita duas casas decimais, e voltar de
           * um número menor que isso perde mais na ENTRADA do que a conversão
           * jamais perderia.
           */
          if (emUnidades < 1) continue
          const volta = converterUnidade(
            {
              categoriaId: categoria.id,
              deId: para.id,
              paraId: de.id,
              valor: Math.round(emUnidades * 100),
            },
            REF,
          )
          if (!volta.ok) continue
          const original = volta.valores.resultado / 10 ** volta.valores.casasDecimais
          expect(
            Math.abs(original - 100),
            `${categoria.id}: ${de.id} → ${para.id} → ${de.id} devolveu ${original}`,
          ).toBeLessThan(1)
        }
      }
    }
  })
})

describe('CALC-074 · a escala se adapta ao tamanho do número', () => {
  /**
   * O caso que motivou `casasDecimais` existir: com duas casas fixas, esta
   * conversão legítima imprimiria 0,00.
   */
  it('1 milímetro em quilômetros não vira zero', () => {
    const v = converter('comprimento', 'mm', 'km', 1)
    expect(v.casasDecimais).toBeGreaterThan(2)
    expect(v.resultado).toBeGreaterThan(0)
    expect(v.resultado / 10 ** v.casasDecimais).toBe(0.000001)
  })

  it('número grande fica nas duas casas de sempre', () => {
    const v = converter('comprimento', 'km', 'mm', 1)
    expect(v.casasDecimais).toBe(2)
    expect(v.resultado).toBe(1_000_000_00)
  })

  it('o fator e o inverso são recíprocos', () => {
    const v = converter('comprimento', 'km', 'm', 1)
    const fator = v.fator / 10 ** v.casasDoFator
    const inverso = v.fatorInverso / 10 ** v.casasDoInverso
    expect(fator).toBe(1_000)
    expect(inverso).toBe(0.001)
  })
})

describe('CALC-074 · temperatura é reta, não fator', () => {
  it('0 °C são 32 °F, e 100 °C são 212 °F', () => {
    expect(converter('temperatura', 'C', 'F', 0).resultado).toBe(3_200)
    expect(converter('temperatura', 'C', 'F', 100).resultado).toBe(21_200)
  })

  it('−40 é o ponto em que as duas escalas se encontram', () => {
    expect(converter('temperatura', 'C', 'F', -40).resultado).toBe(-4_000)
  })

  it('0 °C são 273,15 K', () => {
    expect(converter('temperatura', 'C', 'K', 0).resultado).toBe(27_315)
  })

  /**
   * O erro clássico: 1 °C de LEITURA são 33,8 °F, mas 1 °C de VARIAÇÃO são
   * 1,8 °F. A tela mostra os dois, com rótulos distintos.
   */
  it('a leitura e a variação são números diferentes, e ambos aparecem', () => {
    const v = converter('temperatura', 'C', 'F', 1)
    expect(v.resultado).toBe(3_380)
    expect(v.fator).toBe(180)
  })

  it('kelvin para kelvin não mexe no número', () => {
    expect(converter('temperatura', 'K', 'K', 300).resultado).toBe(30_000)
  })
})

describe('CALC-074 · dados digitais, e a diferença que o disco mostra', () => {
  it('1 kB são 1.000 bytes e 1 KiB são 1.024', () => {
    expect(converter('dados', 'kB', 'B', 1).resultado).toBe(100_000)
    expect(converter('dados', 'KiB', 'B', 1).resultado).toBe(102_400)
  })

  /**
   * A afirmação que a página faz sobre o mundo: o disco de 500 GB aparece como
   * ~465 GiB. Aqui ela é verificada.
   */
  it('500 GB são cerca de 465,66 GiB', () => {
    const v = converter('dados', 'GB', 'GiB', 500)
    expect(v.resultado / 10 ** v.casasDecimais).toBeCloseTo(465.66, 2)
  })
})

describe('CALC-074 · o que a calculadora recusa', () => {
  it('categoria ou unidade desconhecida mantém o estado pendente', () => {
    expect(converterUnidade({ categoriaId: 'peso', deId: 'kg', paraId: 'g', valor: 100 }, REF).ok)
      .toBe(false)
    expect(
      converterUnidade({ categoriaId: 'massa', deId: 'kg', paraId: 'stone', valor: 100 }, REF).ok,
    ).toBe(false)
  })

  /**
   * Resultado que não cabe no inteiro seguro é recusado em vez de arredondado
   * em silêncio — um número desses pareceria exato.
   */
  it('conversão grande demais vira erro, não número plausível', () => {
    const r = converterUnidade(
      { categoriaId: 'dados', deId: 'TB', paraId: 'B', valor: 100_000_000 },
      REF,
    )
    expect(r.ok).toBe(false)
  })

  it('valor zero é resposta válida, não estado pendente', () => {
    const v = converter('comprimento', 'm', 'cm', 0)
    expect(v.resultado).toBe(0)
  })
})

describe('CALC-074 · a definição publicada', () => {
  it('lê a categoria e o par de campos correspondente', () => {
    const r = calcularDef(
      { valor: 100, categoria: 'comprimento', 'de-comprimento': 'pol', 'para-comprimento': 'cm' },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    // 1 pol = 2,54 cm
    expect(r.valores.principal / 10 ** (r.valores.casasDecimais ?? 2)).toBe(2.54)
    expect(r.valores.unidade).toBe('numero')
    expect(r.valores.detalhamento).toEqual([])
  })

  it('o par de outra categoria não interfere', () => {
    const r = calcularDef(
      {
        valor: 100,
        categoria: 'massa',
        'de-comprimento': 'pol',
        'para-comprimento': 'cm',
        'de-massa': 'kg',
        'para-massa': 'g',
      },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal / 10 ** (r.valores.casasDecimais ?? 2)).toBe(1_000)
  })

  it('em temperatura, o destaque é a variação e não há inverso', () => {
    const r = calcularDef(
      { valor: 100, categoria: 'temperatura', 'de-temperatura': 'C', 'para-temperatura': 'F' },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.destaques).toHaveLength(1)
    expect(r.valores.destaques?.[0]?.rotulo).toContain('grau a mais')
  })
})
