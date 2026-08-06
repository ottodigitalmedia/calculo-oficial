/**
 * CASOS-OURO — retorno de energia solar (CALC-066).
 *
 * fonte_verificacao: **conferência manual contra o texto da norma** — Lei nº
 * 14.300/2022, arts. 26 e 27. É a primeira das três origens de `CO-1`.
 *
 * O único valor legal aqui é o percentual do Fio B. Tarifa, geração e mínimo da
 * fatura são entrada do usuário, por decisão registrada em `00-catalogo` §12 e
 * em `ESTADO-DO-PROJETO` §7.40 — e por isso os cenários abaixo usam números
 * redondos: o que eles verificam é a REGRA, não o preço do quilowatt-hora.
 *
 * Cenário-base, repetido em quase todos os casos:
 *
 *   investimento     R$ 20.000,00      geração    500 kWh/mês
 *   tarifa cheia     R$ 0,95/kWh       consumo    600 kWh/mês
 *   tarifa Fio B     R$ 0,30/kWh       mínimo     R$ 50,00/mês
 */

import { describe, expect, it } from 'vitest'

import { calcularSolar, type EntradaSolar } from '../../src/lib/engine/calculadoras/solar'
import { centavos } from '../../src/lib/engine/types'
import { ENERGIA_DISTRIBUIDA } from '../../src/lib/params/data/energia-distribuida'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(ENERGIA_DISTRIBUIDA)

const BASE: EntradaSolar = {
  investimento: centavos(2_000_000),
  geracaoMensalKwh: 500,
  consumoMensalKwh: 600,
  tarifaKwh: centavos(95),
  tarifaFioBKwh: centavos(30),
  custoFixoMensal: centavos(5_000),
  regime: 'novo',
}

function calcular(ajustes: Partial<EntradaSolar> = {}, data = '2026-06-15') {
  const r = calcularSolar({ ...BASE, ...ajustes }, data, registro)
  if (!r.ok) throw new Error(`cálculo falhou: ${r.motivo} — ${r.detalhe}`)
  return r.valores
}

describe('o Fio B corrói o retorno, e o ano de conexão decide quanto', () => {
  /*
   * 2026 — inciso IV, 60%.
   *
   *   500 kWh × R$ 0,95            = R$ 475,00 de energia não comprada
   *   500 kWh × R$ 0,30 × 60%      = R$  90,00 de Fio B
   *                                  ------------
   *   economia mensal                R$ 385,00
   *   R$ 20.000,00 ÷ R$ 385,00     = 52 meses
   */
  it('em 2026 o Fio B é 60% e o retorno vem em 52 meses', () => {
    const v = calcular()
    expect(v.percentualFioB).toBe(6_000)
    expect(v.economiaBruta).toBe(47_500)
    expect(v.custoFioBMensal).toBe(9_000)
    expect(v.economiaMensal).toBe(38_500)
    expect(v.paybackMeses).toBe(52)
  })

  /*
   * 2023 — inciso I, 15%. O MESMO sistema, conectado três anos antes, paga
   * R$ 67,50 a menos de Fio B por mês e se paga sete meses antes.
   */
  it('o mesmo sistema em 2023 se paga sete meses antes', () => {
    const v = calcular({}, '2023-06-15')
    expect(v.percentualFioB).toBe(1_500)
    expect(v.custoFioBMensal).toBe(2_250)
    expect(v.paybackMeses).toBe(45)
  })

  it('o percentual sobe a cada ano, e o payback com ele', () => {
    const anos = ['2023-06-15', '2024-06-15', '2025-06-15', '2026-06-15']
    const percentuais = anos.map((d) => calcular({}, d).percentualFioB)
    expect(percentuais).toEqual([1_500, 3_000, 4_500, 6_000])

    const paybacks = anos.map((d) => calcular({}, d).paybackMeses ?? 0)
    for (let i = 1; i < paybacks.length; i += 1) {
      expect(paybacks[i] ?? 0).toBeGreaterThan(paybacks[i - 1] ?? 0)
    }
  })
})

describe('o art. 26 é outra conta, não outro número', () => {
  /*
   * Quem já tinha o sistema quando a lei saiu não paga Fio B até 2045. A
   * economia é a bruta inteira, e o retorno vem em 43 meses — nove a menos que
   * o mesmo sistema conectado em 2026.
   */
  it('sistema anterior à lei não paga Fio B nenhum', () => {
    const v = calcular({ regime: 'anterior' })
    expect(v.isentoDeFioB).toBe(true)
    expect(v.custoFioBMensal).toBe(0)
    expect(v.economiaMensal).toBe(47_500)
    expect(v.paybackMeses).toBe(43)
  })

  /*
   * E ele não depende de vigência cadastrada: um sistema do art. 26 calcula em
   * 2027, ano que o cronograma ainda não cobre. É o que prova que a isenção é
   * bifurcação de caminho, e não um percentual igual a zero.
   */
  it('o regime anterior calcula mesmo em ano sem percentual cadastrado', () => {
    const r = calcularSolar({ ...BASE, regime: 'anterior' }, '2027-06-15', registro)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.valores.paybackMeses).toBe(43)
  })
})

describe('gerar mais que o consumo não vira dinheiro', () => {
  /*
   * A armadilha das propostas comerciais: dimensionar "com folga" parece
   * gratuito. O excedente vira crédito, que abate consumo futuro — não entra
   * na economia do mês.
   *
   * Gerar 800 kWh com consumo de 600 dá EXATAMENTE o mesmo resultado que gerar
   * 600. Se este teste falhar, o motor passou a contar crédito como dinheiro.
   */
  it('gerar 800 kWh com consumo de 600 rende o mesmo que gerar 600', () => {
    const comFolga = calcular({ geracaoMensalKwh: 800 })
    const naMedida = calcular({ geracaoMensalKwh: 600 })

    expect(comFolga.compensadaKwh).toBe(600)
    expect(comFolga.excedenteKwh).toBe(200)
    expect(comFolga.economiaMensal).toBe(naMedida.economiaMensal)
    expect(comFolga.paybackMeses).toBe(naMedida.paybackMeses)
    expect(comFolga.paybackMeses).toBe(44)
  })
})

describe('o mínimo da fatura limita o quanto a conta pode cair', () => {
  /*
   * Com mínimo de R$ 500,00 e consumo de R$ 570,00, sobra pouco para economizar
   * — a fatura não desce abaixo do mínimo, por mais que o sistema gere.
   */
  it('a economia não passa do que a fatura tem para cair', () => {
    const v = calcular({ custoFixoMensal: centavos(50_000) })
    expect(v.economiaMensal).toBe(7_000)
    expect(v.paybackMeses).toBe(286)
  })

  it('sem economia possível, não há retorno', () => {
    const v = calcular({ custoFixoMensal: centavos(57_000) })
    expect(v.economiaMensal).toBe(0)
    expect(v.paybackMeses).toBeNull()
  })
})

describe('o recorte de vigência — RN-003', () => {
  /*
   * Os incisos V (75% em 2027) e VI (90% em 2028) existem na lei e NÃO foram
   * cadastrados, por §7.48: com eles, o seletor abriria a página em 2028.
   *
   * A consequência é este bloqueio, e ele é deliberado. Quando 2027 chegar,
   * acrescenta-se a linha — e este caso passa a cobrar 2028.
   */
  it.each([
    ['2027-06-15', 'inciso V, ainda não cadastrado'],
    ['2022-06-15', 'antes do início do cronograma'],
  ])('%s é recusado no regime novo — %s', (data) => {
    const r = calcularSolar(BASE, data, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
