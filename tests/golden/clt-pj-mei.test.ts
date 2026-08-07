/**
 * CASOS-OURO — comparador CLT × PJ × MEI (CALC-048).
 *
 * fonte_verificacao: **conferência manual contra o texto da norma** — LC nº
 * 123/2006, Anexos III e V e art. 18, §§ 5º-J, 5º-K e 24; Lei nº 9.250/1995,
 * arts. 6º-A e 16-A. É a primeira das três origens de `CO-1`.
 *
 * O INSS e o IRRF que entram aqui já têm casos-ouro próprios, contra exemplos
 * publicados pela Receita. O que estes casos verificam é o que CALC-048
 * acrescenta: o fator R, a alíquota efetiva do Simples e o degrau do art. 6º-A.
 *
 * Cada valor esperado foi refeito à mão, e a conta está no comentário.
 */

import { describe, expect, it } from 'vitest'

import {
  calcularComparador,
  type EntradaComparador,
} from '../../src/lib/engine/calculadoras/clt-pj-mei'
import { centavos } from '../../src/lib/engine/types'
import { TODOS_OS_CONJUNTOS } from '../../src/lib/params/data/todos'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(...TODOS_OS_CONJUNTOS)
const EM_2026 = '2026-06-15'

const BASE: EntradaComparador = {
  salarioClt: centavos(1_000_000),
  faturamento: centavos(1_500_000),
  proLabore: centavos(200_000),
  folhaMensal: centavos(200_000),
  custoContabil: centavos(50_000),
  dependentes: 0,
  atividadeMei: 'servicos',
}

function calcular(ajustes: Partial<EntradaComparador> = {}, data = EM_2026) {
  const r = calcularComparador({ ...BASE, ...ajustes }, data, registro)
  if (!r.ok) throw new Error(`cálculo falhou: ${r.motivo} — ${r.detalhe}`)
  return r.valores
}

describe('o fator R decide qual anexo se aplica', () => {
  /*
   * Pró-labore de R$ 2.000,00 sobre faturamento de R$ 15.000,00:
   *   fator R = 2.000 ÷ 15.000 = 13,33% → abaixo de 28% → Anexo V
   *
   * RBT12 = 15.000 × 12 = R$ 180.000,00, que é a 1ª faixa (até R$ 180.000,00).
   * Sem parcela a deduzir, a efetiva é a própria nominal: 15,50%.
   *   DAS = 15.000,00 × 15,50% = R$ 2.325,00
   */
  it('abaixo do limiar, cai no Anexo V e paga 15,50%', () => {
    const v = calcular()
    expect(v.fatorRBp).toBe(1_333)
    expect(v.anexo).toBe('V')
    expect(v.aliquotaEfetivaBp).toBe(1_550)
    expect(v.das).toBe(232_500)
  })

  /*
   * O MESMO faturamento, com pró-labore de R$ 4.500,00:
   *   fator R = 4.500 ÷ 15.000 = 30% → Anexo III → 6,00%
   *   DAS = 15.000,00 × 6% = R$ 900,00
   *
   * Aumentar o pró-labore em R$ 2.500,00 derruba o DAS em R$ 1.425,00. É a
   * decisão que o fator R governa, e a razão de esta calculadora existir.
   */
  it('acima do limiar, o mesmo faturamento paga menos que a metade', () => {
    const v = calcular({ proLabore: centavos(450_000), folhaMensal: centavos(450_000) })
    expect(v.fatorRBp).toBe(3_000)
    expect(v.anexo).toBe('III')
    expect(v.aliquotaEfetivaBp).toBe(600)
    expect(v.das).toBe(90_000)
    expect(v.das).toBeLessThan(calcular().das)
  })

  /*
   * A FRONTEIRA. O § 5º-J diz "igual ou superior a 28%" — o empate vai para o
   * Anexo III. Pró-labore de R$ 2.240,00 sobre R$ 8.000,00 dá exatamente 28%.
   */
  it('exatamente no limiar já é Anexo III', () => {
    const noLimiar = calcular({
      faturamento: centavos(800_000),
      proLabore: centavos(224_000),
      folhaMensal: centavos(224_000),
    })
    expect(noLimiar.fatorRBp).toBe(2_800)
    expect(noLimiar.anexo).toBe('III')

    const umPoucoAbaixo = calcular({
      faturamento: centavos(800_000),
      proLabore: centavos(223_000),
      folhaMensal: centavos(223_000),
    })
    expect(umPoucoAbaixo.anexo).toBe('V')
  })
})

describe('a alíquota efetiva não é a nominal da faixa', () => {
  /*
   * Faturamento de R$ 80.000,00/mês → RBT12 = R$ 960.000,00, que cai na 4ª
   * faixa do Anexo III: nominal 16%, deduzir R$ 35.640,00.
   *
   *   efetiva = (960.000,00 × 16% − 35.640,00) ÷ 960.000,00
   *           = (153.600,00 − 35.640,00) ÷ 960.000,00
   *           = 117.960,00 ÷ 960.000,00 = 12,2875%  → 12,29% arredondado
   *
   *   DAS = 80.000,00 × 12,29% = R$ 9.832,00
   *
   * Aplicar os 16% nominais direto daria R$ 12.800,00 — quase três mil a mais
   * por mês. É o erro mais comum das planilhas de comparação.
   */
  it('a parcela a deduzir derruba a efetiva bem abaixo da nominal', () => {
    const v = calcular({
      faturamento: centavos(8_000_000),
      proLabore: centavos(2_240_000),
      folhaMensal: centavos(2_240_000),
      custoContabil: centavos(100_000),
      salarioClt: centavos(3_000_000),
    })
    expect(v.anexo).toBe('III')
    expect(v.aliquotaEfetivaBp).toBe(1_229)
    expect(v.das).toBe(983_200)
    // A nominal da faixa seria 16%: o DAS por ela passaria de R$ 12.000,00.
    expect(v.das).toBeLessThan(1_200_000)
  })
})

describe('o degrau do art. 6º-A sobre dividendos', () => {
  /*
   * Faturamento de R$ 100.000,00/mês, pró-labore de R$ 28.000,00 (fator R 28%,
   * Anexo III), contabilidade de R$ 1.000,00.
   *
   *   RBT12 = R$ 1.200.000,00 → 4ª faixa: nominal 16%, deduzir R$ 35.640,00
   *   efetiva = (1.200.000,00 × 16% − 35.640,00) ÷ 1.200.000,00
   *           = (192.000,00 − 35.640,00) ÷ 1.200.000,00 = 13,03%
   *   DAS = 100.000,00 × 13,03% = R$ 13.030,00
   *   lucro = 100.000,00 − 13.030,00 − 28.000,00 − 1.000,00 = R$ 57.970,00
   *
   * R$ 57.970,00 passa de R$ 50.000,00 → retenção de 10% sobre O TOTAL:
   *   R$ 5.797,00 — e não sobre os R$ 7.970,00 que excederam.
   */
  it('passou do limite, a retenção incide sobre o total distribuído', () => {
    const v = calcular({
      faturamento: centavos(10_000_000),
      proLabore: centavos(2_800_000),
      folhaMensal: centavos(2_800_000),
      custoContabil: centavos(100_000),
      salarioClt: centavos(4_000_000),
    })
    expect(v.anexo).toBe('III')
    expect(v.aliquotaEfetivaBp).toBe(1_303)
    expect(v.das).toBe(1_303_000)
    expect(v.lucroDistribuido).toBe(5_797_000)
    expect(v.retencaoDividendos).toBe(579_700)
    // Sobre o excedente seriam R$ 797,00. É degrau, não rampa.
    expect(v.retencaoDividendos).toBeGreaterThan(79_700)
  })

  it('dentro do limite não há retenção nenhuma', () => {
    const v = calcular()
    expect(v.lucroDistribuido).toBe(1_017_500)
    expect(v.retencaoDividendos).toBe(0)
  })
})

describe('o lado CLT soma o que não cai na conta no mês', () => {
  /*
   * Salário de R$ 10.000,00:
   *   FGTS       = 10.000,00 × 8%              = R$   800,00
   *   13º        = 10.000,00 ÷ 12              = R$   833,33
   *   terço      = 10.000,00 ÷ 3               = R$ 3.333,33
   *   férias     = (10.000,00 + 3.333,33) ÷ 12 = R$ 1.111,11
   *   provisões  = 833,33 + 1.111,11           = R$ 1.944,44
   *
   * A primeira versão deste caso dizia R$ 1.944,46, por ter arredondado as duas
   * divisões para cima onde a terceira casa é 3. O motor estava certo; o caso,
   * não — e é a ordem em que `tests/golden/README` manda investigar.
   */
  it('FGTS e provisões entram, e aparecem separados', () => {
    const v = calcular()
    expect(v.cltFgts).toBe(80_000)
    expect(v.cltProvisoes).toBe(194_444)
    expect(v.clt).toBe(v.cltLiquidoNaConta + v.cltFgts + v.cltProvisoes)
    // Sem FGTS e provisões a CLT pareceria pior do que é.
    expect(v.clt).toBeGreaterThan(v.cltLiquidoNaConta)
  })
})

describe('o MEI entra quando cabe, e some quando não cabe', () => {
  it('faturamento alto não cabe no MEI', () => {
    const v = calcular()
    expect(v.meiCabe).toBe(false)
    expect(v.mei).toBeNull()
  })

  /*
   * R$ 6.000,00 por mês são R$ 72.000,00 no ano — dentro do limite do MEI. O
   * DAS vem de CALC-047, e não é recalculado aqui.
   */
  it('faturamento dentro do limite calcula o MEI pelo motor de CALC-047', () => {
    const v = calcular({ faturamento: centavos(600_000), proLabore: centavos(0), folhaMensal: centavos(0) })
    expect(v.meiCabe).toBe(true)
    expect(v.mei).not.toBeNull()
    expect(v.dasMei).toBeGreaterThan(0)
    // O MEI paga um valor FIXO, não proporcional — é a vantagem dele.
    expect(v.mei).toBe(600_000 - v.dasMei)
  })
})

describe('a fronteira declarada — art. 16-A', () => {
  it('abaixo do limite anual, a conta não avisa nada', () => {
    expect(calcular().acimaDaFronteira).toBe(false)
  })

  /*
   * R$ 80.000,00/mês são R$ 960.000,00 no ano, acima dos R$ 600.000,00 do art.
   * 16-A. A tributação mínima passa a incidir e NÃO está calculada aqui — o
   * resultado avisa que o lado PJ está otimista.
   */
  it('acima do limite anual, avisa que o lado PJ está otimista', () => {
    const v = calcular({
      faturamento: centavos(8_000_000),
      proLabore: centavos(2_240_000),
      folhaMensal: centavos(2_240_000),
    })
    expect(v.acimaDaFronteira).toBe(true)
  })
})

describe('o recorte de vigência — RN-003', () => {
  /*
   * O art. 519 da LC nº 214/2025 substitui os Anexos I a V a partir de 2027,
   * por força do art. 544, III, na redação da LC nº 227/2026. Enquanto os
   * anexos novos não forem lidos, 2027 é bloqueio.
   */
  it.each([
    ['2027-06-15', 'os anexos mudam em 2027'],
    ['2025-06-15', 'a retenção de dividendos só existe a partir de 2026'],
  ])('%s é recusado — %s', (data) => {
    const r = calcularComparador(BASE, data, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
