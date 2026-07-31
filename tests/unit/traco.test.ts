/**
 * Traço de cálculo — `ENT-008`, contrato `C-M1`.
 *
 * O traço é a promessa central do produto em forma de tipo. Estes testes
 * cobrem as duas coisas que quebram em silêncio: a formatação que compõe a
 * fórmula (um separador de milhar errado torna a conferência impossível) e a
 * omissão de campo opcional, que com `exactOptionalPropertyTypes` ligado é a
 * diferença entre "sem dispositivo" e "dispositivo indefinido".
 */

import { describe, expect, it } from 'vitest'

import { ConstrutorDeTraco, fundamentar, percentual, reais } from '../../src/lib/engine/traco'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

describe('reais — formatação usada só para compor a fórmula', () => {
  it('separa milhar e mantém dois dígitos de centavo', () => {
    expect(reais(centavos(123_456))).toBe('R$ 1.234,56')
  })

  it('preenche o centavo com zero à esquerda', () => {
    expect(reais(centavos(100_005))).toBe('R$ 1.000,05')
  })

  it('valor abaixo de um real não ganha separador', () => {
    expect(reais(centavos(7))).toBe('R$ 0,07')
  })

  it('zero é zero', () => {
    expect(reais(centavos(0))).toBe('R$ 0,00')
  })

  it('negativo usa o sinal de menos tipográfico', () => {
    expect(reais(centavos(-2_550))).toBe('−R$ 25,50')
  })

  it('milhão tem dois separadores', () => {
    expect(reais(centavos(100_000_000))).toBe('R$ 1.000.000,00')
  })
})

describe('percentual', () => {
  it('converte basis points em pontos percentuais', () => {
    expect(percentual(basisPoints(750))).toBe('7,50%')
  })

  it('preenche a fração com zero', () => {
    expect(percentual(basisPoints(1_400))).toBe('14,00%')
  })

  it('alíquota quebrada mantém os dois dígitos', () => {
    expect(percentual(basisPoints(1_162))).toBe('11,62%')
  })

  it('negativo leva o sinal', () => {
    expect(percentual(basisPoints(-250))).toBe('−2,50%')
  })
})

describe('fundamentar — omite o campo em vez de defini-lo como indefinido', () => {
  it('mantém o dispositivo quando existe', () => {
    const f = fundamentar({ norma: 'Súmula 386 do STJ', dispositivo: 'Primeira Seção', url: 'https://x.jus.br/a' })
    expect(f).toEqual({ norma: 'Súmula 386 do STJ', dispositivo: 'Primeira Seção', url: 'https://x.jus.br/a' })
  })

  it('OMITE a chave quando não há dispositivo — não a define como undefined', () => {
    const f = fundamentar({ norma: 'Lei nº 8.036/1990', url: 'https://x.gov.br/b' })
    expect(Object.hasOwn(f, 'dispositivo')).toBe(false)
  })
})

describe('ConstrutorDeTraco', () => {
  it('acumula etapas na ordem em que a conta acontece', () => {
    const c = new ConstrutorDeTraco(REF)
    c.passo('Primeira', 'a', centavos(1))
    c.passo('Segunda', 'b', centavos(2))

    const t = c.construir()
    expect(t.etapas.map((e) => e.rotulo)).toEqual(['Primeira', 'Segunda'])
    expect(t.dataReferencia).toBe(REF)
  })

  it('o passo devolve o próprio resultado, para encadear a conta', () => {
    const c = new ConstrutorDeTraco(REF)
    expect(c.passo('x', 'y', centavos(42))).toBe(42)
  })

  it('passoComFundamento registra a norma e devolve o resultado', () => {
    const c = new ConstrutorDeTraco(REF)
    const valor = c.passoComFundamento(
      'Sem incidência',
      'fora da base',
      centavos(0),
      { norma: 'Tema 478 do STJ', url: 'https://x.jus.br/t' },
      'por não se tratar de verba salarial',
    )

    expect(valor).toBe(0)
    const etapa = c.construir().etapas[0]
    expect(etapa?.fundamento?.norma).toBe('Tema 478 do STJ')
    expect(etapa?.justificativa).toBe('por não se tratar de verba salarial')
  })

  it('sem justificativa, a chave não existe na etapa', () => {
    const c = new ConstrutorDeTraco(REF)
    c.passoComFundamento('r', 'f', centavos(0), { norma: 'n', url: 'https://x.gov.br/u' })
    const etapa = c.construir().etapas[0]
    expect(etapa && Object.hasOwn(etapa, 'justificativa')).toBe(false)
  })

  it('passoComParametro cita a vigência e acumula o id para o rodapé', () => {
    const c = new ConstrutorDeTraco(REF)
    const resolvida = {
      parametro: { id: 'p', nome: 'Parâmetro', descricao: '', tipo: 'percentual' as const },
      vigencia: {
        id: 'v-2026',
        parametroId: 'p',
        fonteId: 'f',
        inicio: '2026-01-01' as DataISO,
        fim: null,
        valor: { tipo: 'percentual' as const, aliquotaBp: 750 },
      },
      fonte: {
        id: 'f',
        norma: 'Lei nº 1',
        url: 'https://x.gov.br/n',
        orgao: 'Congresso Nacional' as const,
      },
    }

    // Sem justificativa: a chave não deve existir (exactOptionalPropertyTypes).
    c.passoComParametro('Etapa', 'formula', centavos(10), resolvida)
    const semJust = c.construir().etapas[0]
    expect(semJust?.parametro?.nome).toBe('Parâmetro')
    expect(semJust && Object.hasOwn(semJust, 'justificativa')).toBe(false)
    // Sem dispositivo na fonte, a citação também o omite.
    expect(semJust?.parametro && Object.hasOwn(semJust.parametro, 'dispositivo')).toBe(false)
    expect(c.construir().vigenciasAplicadas).toEqual(['v-2026'])
  })

  it('traço vazio ainda é traço — não lança', () => {
    const t = new ConstrutorDeTraco(REF).construir()
    expect(t.etapas).toEqual([])
    expect(t.vigenciasAplicadas).toEqual([])
  })
})
