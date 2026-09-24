/**
 * Aritmética monetária — `ADR-004`, `RN-005` a `RN-007`.
 *
 * POR QUE ESTE ARQUIVO NÃO ESTÁ EM `tests/golden/`
 *
 * O BACKLOG lista `tests/golden/money.test.ts` para T-005, mas um caso-ouro
 * tem definição estrita: resultado conferido contra **fonte oficial**, com a
 * origem declarada em `fonte_verificacao` (`CO-1`, verificado por BV-09).
 * Aritmética de inteiros não tem fonte oficial — sua correção é matemática,
 * não normativa.
 *
 * Colocar estes testes em `golden/` obrigaria a inventar um `fonte_verificacao`
 * para cada um, e é assim que a distinção que dá sentido a `CO-1` se dissolve:
 * quando "caso-ouro" passa a significar "qualquer teste", ninguém mais sabe
 * quais foram realmente conferidos contra a norma.
 *
 * `tests/golden/` recebe os casos-ouro de verdade a partir de T-008.
 */

import { describe, expect, it } from 'vitest'

import {
  aliquotaEfetiva,
  aplicarAliquota,
  dividirPorInteiro,
  ehNegativo,
  ehZero,
  limitarAoTeto,
  maximo,
  minimo,
  multiplicarPorInteiro,
  naoNegativo,
  negar,
  proporcao,
  somar,
  subtrair,
} from '../../src/lib/engine/money'
import { ZERO, basisPoints, centavos } from '../../src/lib/engine/types'

const c = centavos
const bp = basisPoints

describe('RN-005 · soma e subtração são exatas', () => {
  it('soma sem erro de representação onde o ponto flutuante falha', () => {
    // O caso canônico: 0,10 + 0,20 não dá 0,30 em ponto flutuante.
    expect(0.1 + 0.2).not.toBe(0.3)
    // Em centavos, dá — e é por isso que ADR-004 existe.
    expect(somar(c(10), c(20))).toBe(30)
  })

  it('mantém exatidão ao longo de muitas parcelas', () => {
    // Dez etapas encadeadas: o cenário que ADR-004 descreve como o que torna
    // um erro de centavo visível contra o holerite.
    const parcelas = Array.from({ length: 10 }, () => c(1))
    expect(somar(...parcelas)).toBe(10)

    let flutuante = 0
    for (let i = 0; i < 10; i++) flutuante += 0.01
    expect(flutuante).not.toBe(0.1)
  })

  it('soma sem argumentos é zero', () => {
    expect(somar()).toBe(0)
  })

  it('subtrai e nega', () => {
    expect(subtrair(c(450000), c(33750))).toBe(416250)
    expect(negar(c(1234))).toBe(-1234)
    expect(negar(ZERO)).toBe(0)
  })

  it('nenhuma operação produz zero negativo', () => {
    // `-0 === 0` é verdadeiro, então o zero negativo atravessa comparação sem
    // alarde — e chega à formatação como "R$ -0,00". `toBe` usa Object.is e
    // distingue os dois, que é o que torna esta verificação possível.
    expect(negar(ZERO)).toBe(0)
    expect(subtrair(c(500), c(500))).toBe(0)
    expect(multiplicarPorInteiro(c(-100), 0)).toBe(0)
    expect(dividirPorInteiro(ZERO, -12, 'meio_para_cima')).toBe(0)
    expect(aplicarAliquota(ZERO, bp(-750), 'meio_para_cima')).toBe(0)
    expect(proporcao(ZERO, 7, -12, 'truncar')).toBe(0)
    expect(aliquotaEfetiva(ZERO, c(-1000), 'meio_para_cima')).toBe(0)
  })

  it('multiplica por inteiro de forma exata', () => {
    expect(multiplicarPorInteiro(c(15000), 22)).toBe(330000)
    expect(multiplicarPorInteiro(c(-5000), 3)).toBe(-15000)
    expect(multiplicarPorInteiro(c(999), 0)).toBe(0)
  })

  it('recusa quantidade fracionária', () => {
    expect(() => multiplicarPorInteiro(c(100), 1.5)).toThrow(TypeError)
  })
})

describe('A-4 · a política de arredondamento é declarada e obedecida', () => {
  // 1000 centavos ÷ 3 = 333,333…  → nenhuma política diverge (resto < metade)
  it('sem empate, todas as políticas concordam na parte inteira', () => {
    expect(dividirPorInteiro(c(1000), 3, 'truncar')).toBe(333)
    expect(dividirPorInteiro(c(1000), 3, 'meio_para_cima')).toBe(333)
    expect(dividirPorInteiro(c(1000), 3, 'meio_afastando_de_zero')).toBe(333)
  })

  it('sem empate, mas fração acima da metade, os "meio" sobem juntos', () => {
    // 2000 ÷ 3 = 666,66…
    expect(dividirPorInteiro(c(2000), 3, 'truncar')).toBe(666)
    expect(dividirPorInteiro(c(2000), 3, 'meio_para_cima')).toBe(667)
    expect(dividirPorInteiro(c(2000), 3, 'meio_afastando_de_zero')).toBe(667)
  })

  it('no empate positivo, "meio" sobem e "truncar" desce', () => {
    // 5 ÷ 2 = 2,5 — empate exato
    expect(dividirPorInteiro(c(5), 2, 'truncar')).toBe(2)
    expect(dividirPorInteiro(c(5), 2, 'meio_para_cima')).toBe(3)
    expect(dividirPorInteiro(c(5), 2, 'meio_afastando_de_zero')).toBe(3)
  })

  it('no empate NEGATIVO as políticas divergem — é onde o defeito passaria', () => {
    // −2,5. É a única situação em que "meio para cima" e "meio afastando de
    // zero" dão resultados diferentes, e valor negativo aparece em desconto e
    // em aviso prévio não cumprido (RN-018).
    expect(dividirPorInteiro(c(-5), 2, 'meio_para_cima')).toBe(-2)
    expect(dividirPorInteiro(c(-5), 2, 'meio_afastando_de_zero')).toBe(-3)
    expect(dividirPorInteiro(c(-5), 2, 'truncar')).toBe(-2)
  })

  it('fora do empate, negativo se comporta como esperado', () => {
    expect(dividirPorInteiro(c(-26), 10, 'meio_para_cima')).toBe(-3)
    expect(dividirPorInteiro(c(-24), 10, 'meio_para_cima')).toBe(-2)
    expect(dividirPorInteiro(c(-26), 10, 'truncar')).toBe(-2)
  })

  it('divisão exata não é afetada por política alguma', () => {
    expect(dividirPorInteiro(c(440000), 220, 'truncar')).toBe(2000)
    expect(dividirPorInteiro(c(440000), 220, 'meio_para_cima')).toBe(2000)
  })

  it('divisão exata com resultado negativo preserva o sinal', () => {
    // Sem resto não há política a aplicar, mas o sinal ainda precisa
    // atravessar — é o caminho de um desconto que divide certinho.
    expect(dividirPorInteiro(c(-1000), 2, 'meio_para_cima')).toBe(-500)
    expect(dividirPorInteiro(c(1000), -2, 'truncar')).toBe(-500)
    expect(dividirPorInteiro(c(-1000), -2, 'meio_afastando_de_zero')).toBe(500)
  })

  it('recusa divisor zero e divisor fracionário', () => {
    expect(() => dividirPorInteiro(c(100), 0, 'meio_para_cima')).toThrow(RangeError)
    expect(() => dividirPorInteiro(c(100), 2.5, 'meio_para_cima')).toThrow(TypeError)
  })
})

describe('aplicarAliquota · multiplica antes de dividir', () => {
  it('aplica alíquota inteira sem resto', () => {
    // 7,5% de R$ 1.000,00
    expect(aplicarAliquota(c(100000), bp(750), 'meio_para_cima')).toBe(7500)
  })

  it('aplica alíquota com fração de centavo segundo a política', () => {
    // 7,5% de R$ 1.621,00 = 121,575 → 121,58 ou 121,57
    expect(aplicarAliquota(c(162100), bp(750), 'meio_para_cima')).toBe(12158)
    expect(aplicarAliquota(c(162100), bp(750), 'truncar')).toBe(12157)
  })

  it('100% devolve a própria base e 0% devolve zero', () => {
    expect(aplicarAliquota(c(123456), bp(10_000), 'meio_para_cima')).toBe(123456)
    expect(aplicarAliquota(c(123456), bp(0), 'meio_para_cima')).toBe(0)
  })

  it('multiplicar antes de dividir não é equivalente a dividir antes', () => {
    // A ordem importa: dividir primeiro descartaria a fração antes de ela
    // influenciar o resultado, e o erro se acumularia por faixa.
    const base = c(333)
    const aliquota = bp(750)
    const corretoMultiplicaAntes = aplicarAliquota(base, aliquota, 'truncar') // (333×750)/10000 = 24,975 → 24
    const erradoDivideAntes = Math.trunc(Math.trunc(base / 10_000) * 750) // = 0
    expect(corretoMultiplicaAntes).toBe(24)
    expect(erradoDivideAntes).toBe(0)
  })

  /**
   * A recusa é do RESULTADO, não do caminho (§7.99). Até 24/09/2026 a guarda
   * olhava o produto intermediário e recusava contas com resposta exata.
   */
  it('recusa quando o resultado estouraria o inteiro seguro', () => {
    expect(() => aplicarAliquota(c(Number.MAX_SAFE_INTEGER), bp(20_000), 'truncar')).toThrow(
      RangeError,
    )
  })

  it('produto acima do inteiro seguro com resultado que cabe sai exato', () => {
    // 9.007.199.254.740.991 × 100% = ele mesmo; o produto passa de 2⁵³.
    expect(aplicarAliquota(c(Number.MAX_SAFE_INTEGER), bp(10_000), 'truncar')).toBe(
      Number.MAX_SAFE_INTEGER,
    )
    // 49.999.000.000.000 × 22,5%: o caso que derrubava CALC-122.
    // 49.999.000.000.000 × 2.250 / 10.000 = 11.249.775.000.000, exato.
    expect(aplicarAliquota(c(49_999_000_000_000), bp(2_250), 'meio_para_cima')).toBe(
      11_249_775_000_000,
    )
  })
})

describe('RN-016 · proporcionalidade por avos', () => {
  it('doze avos devolvem a base inteira', () => {
    expect(proporcao(c(450000), 12, 12, 'meio_para_cima')).toBe(450000)
  })

  it('um avo e onze avos', () => {
    expect(proporcao(c(450000), 1, 12, 'meio_para_cima')).toBe(37500)
    expect(proporcao(c(450000), 11, 12, 'meio_para_cima')).toBe(412500)
  })

  it('zero avo é zero', () => {
    expect(proporcao(c(450000), 0, 12, 'meio_para_cima')).toBe(0)
  })

  it('preserva a fração até o único arredondamento', () => {
    // 100000 × 7 / 12 = 58333,33…  Se dividisse antes: (100000/12)=8333 ×7 = 58331.
    expect(proporcao(c(100000), 7, 12, 'truncar')).toBe(58333)
    expect(Math.trunc(Math.trunc(100000 / 12) * 7)).toBe(58331)
  })

  it('recusa numerador ou denominador fracionário', () => {
    expect(() => proporcao(c(100), 1.5, 12, 'truncar')).toThrow(TypeError)
    expect(() => proporcao(c(100), 1, 12.5, 'truncar')).toThrow(TypeError)
  })

  /**
   * O produto que derrubava a página de IR na renda fixa na auditoria (§7.99):
   * 158.726.882 × 59.458.680 é 9,4 × 10¹⁵, acima de 2⁵³ — e, dividido de volta,
   * o resultado é trivial.
   */
  it('produto acima do inteiro seguro sai exato, com o arredondamento de sempre', () => {
    expect(proporcao(c(158_726_882), 59_458_680, 158_726_882, 'truncar')).toBe(59_458_680)
    // 10¹⁵ × 7 / 12 = 583.333.333.333.333,33… — truncar e meio para cima divergem
    // só no último dígito, como na faixa segura.
    expect(proporcao(c(1_000_000_000_000_000), 7, 12, 'truncar')).toBe(583_333_333_333_333)
    expect(proporcao(c(1_000_000_000_000_000), 11, 12, 'meio_para_cima')).toBe(916_666_666_666_667)
    // Sinal: negativo em qualquer um dos três termos inverte o resultado.
    expect(proporcao(c(-1_000_000_000_000_000), 11, 12, 'truncar')).toBe(-916_666_666_666_666)
    expect(proporcao(c(1_000_000_000_000_000), 11, -12, 'truncar')).toBe(-916_666_666_666_666)
  })

  it('recusa quando o resultado não cabe', () => {
    expect(() => proporcao(c(Number.MAX_SAFE_INTEGER), 3, 2, 'truncar')).toThrow(RangeError)
  })

  it('divisão por zero continua recusada, também fora da faixa segura', () => {
    expect(() => proporcao(c(Number.MAX_SAFE_INTEGER), 3, 0, 'truncar')).toThrow(RangeError)
  })
})

describe('limites e comparações', () => {
  it('RN-009 · limita ao teto previdenciário', () => {
    const teto = c(800000)
    expect(limitarAoTeto(c(1000000), teto)).toBe(800000)
    expect(limitarAoTeto(c(500000), teto)).toBe(500000)
    expect(limitarAoTeto(teto, teto)).toBe(800000)
  })

  it('RN-014 · imposto negativo vira zero, nunca crédito', () => {
    expect(naoNegativo(c(-1))).toBe(0)
    expect(naoNegativo(c(-999999))).toBe(0)
    expect(naoNegativo(c(150))).toBe(150)
    expect(naoNegativo(ZERO)).toBe(0)
  })

  it('mínimo e máximo', () => {
    expect(minimo(c(10), c(20))).toBe(10)
    expect(maximo(c(10), c(20))).toBe(20)
    expect(minimo(c(-10), c(-20))).toBe(-20)
  })

  it('predicados', () => {
    expect(ehZero(ZERO)).toBe(true)
    expect(ehZero(c(1))).toBe(false)
    expect(ehNegativo(c(-1))).toBe(true)
    expect(ehNegativo(ZERO)).toBe(false)
  })
})

describe('aliquotaEfetiva · saída secundária de CALC-016', () => {
  it('calcula a proporção em basis points', () => {
    // 825,00 sobre 10.000,00 = 8,25% = 825 bp
    expect(aliquotaEfetiva(c(82500), c(1000000), 'meio_para_cima')).toBe(825)
  })

  it('total zero devolve zero em vez de erro', () => {
    expect(aliquotaEfetiva(c(0), ZERO, 'meio_para_cima')).toBe(0)
  })

  it('parte igual ao total é 100%', () => {
    expect(aliquotaEfetiva(c(5000), c(5000), 'meio_para_cima')).toBe(10_000)
  })
})

describe('guardas de invariante — defeito, não erro de domínio (C-M3)', () => {
  it('recusa decimal onde se espera centavos', () => {
    expect(() => centavos(45.5)).toThrow(TypeError)
    expect(() => centavos(0.1)).toThrow(TypeError)
  })

  it('recusa NaN e valores não numéricos', () => {
    expect(() => centavos(Number.NaN)).toThrow(TypeError)
    expect(() => centavos(Number.POSITIVE_INFINITY)).toThrow(TypeError)
  })

  it('recusa inteiro fora do intervalo seguro', () => {
    expect(() => centavos(Number.MAX_SAFE_INTEGER + 2)).toThrow()
  })

  it('aceita zero e negativos', () => {
    expect(centavos(0)).toBe(0)
    expect(centavos(-1)).toBe(-1)
  })

  it('vale igualmente para basis points', () => {
    expect(() => basisPoints(7.5)).toThrow(TypeError)
    expect(basisPoints(750)).toBe(750)
  })
})
