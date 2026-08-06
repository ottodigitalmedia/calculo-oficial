/**
 * CASOS-OURO — ajuste anual do IRPF (CALC-017 e CALC-019).
 *
 * fonte_verificacao: **conferência manual contra a tabela anual publicada pela
 * Receita Federal** para cada ano-calendário. É a primeira das três origens
 * admitidas por `CO-1`.
 *
 * Cada caso traz a conta refeita à mão no comentário. A tabela anual não é doze
 * vezes a mensal — ver o cabeçalho de `params/data/irpf-anual.ts` —, e por isso
 * nenhum valor aqui foi derivado dos casos-ouro do IRRF mensal.
 *
 * As datas de referência são explícitas e caem dentro do ano-calendário
 * correspondente, porque é o ano-calendário que decide a tabela.
 */

import { describe, expect, it } from 'vitest'

import { calcularIrpfAnual } from '../../src/lib/engine/calculadoras/irpf-anual'
import { centavos } from '../../src/lib/engine/types'
import { IRPF_ANUAL } from '../../src/lib/params/data/irpf-anual'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(IRPF_ANUAL)

const EM_2025 = '2025-06-15'
const EM_2024 = '2024-06-15'

interface Cenario {
  readonly rendimentos: number
  readonly inss?: number
  readonly dependentes?: number
  readonly instrucao?: number
  readonly medicas?: number
  readonly pensao?: number
  readonly retido?: number
}

function calcular(c: Cenario, data = EM_2025) {
  const r = calcularIrpfAnual(
    {
      rendimentosTributaveis: centavos(c.rendimentos),
      inss: centavos(c.inss ?? 0),
      dependentes: c.dependentes ?? 0,
      instrucao: centavos(c.instrucao ?? 0),
      medicas: centavos(c.medicas ?? 0),
      pensao: centavos(c.pensao ?? 0),
      impostoRetido: centavos(c.retido ?? 0),
    },
    data,
    registro,
  )
  if (!r.ok) throw new Error(`cálculo falhou: ${r.motivo} — ${r.detalhe}`)
  return r.valores
}

// ---------------------------------------------------------------------------
// Ano-calendário 2025 — exercício 2026
//
//   até        28.467,20   isento
//   28.467,21 a 33.919,80    7,5 %   deduzir  2.135,04
//   33.919,81 a 45.012,60     15 %   deduzir  4.679,03
//   45.012,61 a 55.976,16   22,5 %   deduzir  8.054,97
//   acima de   55.976,16    27,5 %   deduzir 10.853,78
// ---------------------------------------------------------------------------

describe('ano-calendário 2025', () => {
  /*
   * Isento pelos dois modelos, e restituição igual ao retido.
   *
   *   completo      30.000,00 − 2.400,00 = 27.600,00  → 1ª faixa → 0
   *   simplificado  20% de 30.000,00 = 6.000,00 (< teto)
   *                 30.000,00 − 6.000,00 = 24.000,00  → 1ª faixa → 0
   *   saldo         500,00 − 0 = 500,00 a restituir
   */
  it('rendimento na faixa isenta devolve todo o imposto retido', () => {
    const r = calcular({ rendimentos: 3_000_000, inss: 240_000, retido: 50_000 })
    expect(r.impostoDevido).toBe(0)
    expect(r.saldo).toBe(50_000)
    // Empate em zero adota o completo — a declaração com deduções descreve os fatos.
    expect(r.modeloAdotado).toBe('completo')
    expect(r.economiaDoModelo).toBe(0)
  })

  /*
   * O completo vence quando há deduções de verdade.
   *
   *   dependente      2.275,08
   *   instrução       5.000,00, dentro de 2 × 3.561,50 = 7.123,00
   *   deduções        6.600,00 + 2.275,08 + 5.000,00 + 3.000,00 = 16.875,08
   *   base completo   60.000,00 − 16.875,08 = 43.124,92  → 3ª faixa
   *                   43.124,92 × 15% = 6.468,74 − 4.679,03 = 1.789,71
   *   simplificado    20% de 60.000,00 = 12.000,00 (< teto)
   *                   base 48.000,00 → 4ª faixa
   *                   48.000,00 × 22,5% = 10.800,00 − 8.054,97 = 2.745,03
   *   economia        2.745,03 − 1.789,71 = 955,32
   *   saldo           3.000,00 − 1.789,71 = 1.210,29 a restituir
   */
  it('deduções relevantes fazem o modelo completo vencer', () => {
    const r = calcular({
      rendimentos: 6_000_000,
      inss: 660_000,
      dependentes: 1,
      instrucao: 500_000,
      medicas: 300_000,
      retido: 300_000,
    })
    expect(r.baseCompleto).toBe(4_312_492)
    expect(r.impostoCompleto).toBe(178_971)
    expect(r.impostoSimplificado).toBe(274_503)
    expect(r.modeloAdotado).toBe('completo')
    expect(r.impostoDevido).toBe(178_971)
    expect(r.economiaDoModelo).toBe(95_532)
    expect(r.saldo).toBe(121_029)
  })

  /*
   * Sem deduções e com renda alta, o simplificado vence — MESMO limitado.
   *
   *   completo      120.000,00 − 8.000,00 = 112.000,00 → 5ª faixa
   *                 112.000,00 × 27,5% = 30.800,00 − 10.853,78 = 19.946,22
   *   simplificado  20% de 120.000,00 = 24.000,00, LIMITADO a 16.754,34
   *                 base 103.245,66 → 5ª faixa
   *                 103.245,66 × 27,5% = 28.392,56 (arred.) − 10.853,78 = 17.538,78
   *   economia      19.946,22 − 17.538,78 = 2.407,44
   *   saldo         15.000,00 − 17.538,78 = −2.538,78  → A PAGAR
   */
  it('sem deduções, o simplificado vence mesmo com o desconto no teto', () => {
    const r = calcular({ rendimentos: 12_000_000, inss: 800_000, retido: 1_500_000 })
    expect(r.descontoSimplificado).toBe(1_675_434)
    expect(r.impostoCompleto).toBe(1_994_622)
    expect(r.impostoSimplificado).toBe(1_753_878)
    expect(r.modeloAdotado).toBe('simplificado')
    expect(r.economiaDoModelo).toBe(240_744)
    // Saldo negativo é imposto a pagar, não restituição.
    expect(r.saldo).toBe(-253_878)
  })

  /*
   * FRONTEIRA do desconto simplificado.
   *
   * 16.754,34 ÷ 20% = 83.771,70 — o rendimento em que o percentual encosta
   * EXATAMENTE no teto sem ultrapassá-lo. Um centavo a mais e o desconto passa
   * a ser o teto; um a menos e ele é o percentual.
   */
  it('no rendimento exato da fronteira, o desconto é o percentual e o teto ao mesmo tempo', () => {
    const r = calcular({ rendimentos: 8_377_170 })
    expect(r.descontoSimplificado).toBe(1_675_434)

    const acima = calcular({ rendimentos: 8_377_171 })
    expect(acima.descontoSimplificado).toBe(1_675_434)

    const abaixo = calcular({ rendimentos: 8_377_165 })
    expect(abaixo.descontoSimplificado).toBe(1_675_433)
  })

  /*
   * O teto de instrução é POR PESSOA e multiplica pelo número de pessoas.
   *
   *   pessoas       1 declarante + 2 dependentes = 3
   *   teto total    3 × 3.561,50 = 10.684,50
   *   instrução     20.000,00 informados → 10.684,50 dedutíveis
   *   deduções      8.000,00 + 4.550,16 + 10.684,50 = 23.234,66
   *   base          80.000,00 − 23.234,66 = 56.765,34 → 5ª faixa
   *                 56.765,34 × 27,5% = 15.610,47 (arred.) − 10.853,78 = 4.756,69
   */
  it('a instrução é limitada pelo teto por pessoa, somado', () => {
    const r = calcular({
      rendimentos: 8_000_000,
      inss: 800_000,
      dependentes: 2,
      instrucao: 2_000_000,
    })
    expect(r.instrucaoDedutivel).toBe(1_068_450)
    expect(r.baseCompleto).toBe(5_676_534)
    expect(r.impostoCompleto).toBe(475_669)
    expect(r.modeloAdotado).toBe('completo')
  })

  /*
   * Despesa médica NÃO tem teto — Lei nº 9.250/1995, art. 8º, II, "a".
   *
   * O caso existe para travar a regra: se alguém "descobrir" um limite e o
   * cadastrar, este teste reprova. Uma despesa médica maior que o rendimento
   * zera a base, e não é erro.
   */
  it('despesa médica não tem teto, e pode zerar a base do modelo completo', () => {
    const r = calcular({ rendimentos: 6_000_000, medicas: 9_000_000 })
    expect(r.baseCompleto).toBe(0)
    expect(r.impostoCompleto).toBe(0)
    expect(r.modeloAdotado).toBe('completo')
  })
})

// ---------------------------------------------------------------------------
// Ano-calendário 2024 — exercício 2025
//
//   até        26.963,20   isento
//   26.963,21 a 33.919,80    7,5 %   deduzir  2.022,24
//   33.919,81 a 45.012,60     15 %   deduzir  4.566,23
//   45.012,61 a 55.976,16   22,5 %   deduzir  7.942,17
//   acima de   55.976,16    27,5 %   deduzir 10.740,98
// ---------------------------------------------------------------------------

describe('ano-calendário 2024', () => {
  /*
   *   completo      60.000,00 − 6.600,00 = 53.400,00 → 4ª faixa
   *                 53.400,00 × 22,5% = 12.015,00 − 7.942,17 = 4.072,83
   *   simplificado  20% de 60.000,00 = 12.000,00
   *                 base 48.000,00 → 4ª faixa
   *                 48.000,00 × 22,5% = 10.800,00 − 7.942,17 = 2.857,83
   */
  it('o mesmo cenário rende imposto diferente de 2025 — a tabela é outra', () => {
    const r = calcular({ rendimentos: 6_000_000, inss: 660_000 }, EM_2024)
    expect(r.impostoCompleto).toBe(407_283)
    expect(r.impostoSimplificado).toBe(285_783)
    expect(r.modeloAdotado).toBe('simplificado')
    expect(r.economiaDoModelo).toBe(121_500)

    // O MESMO cenário em 2025 dá outro número. Se estes dois coincidirem, é
    // porque alguém aplicou a tabela errada a um dos dois anos.
    const em2025 = calcular({ rendimentos: 6_000_000, inss: 660_000 })
    expect(em2025.impostoCompleto).not.toBe(r.impostoCompleto)
  })
})

// ---------------------------------------------------------------------------
// O recorte de vigência — RN-003
// ---------------------------------------------------------------------------

describe('fora de 2024–2025 o cálculo é bloqueado', () => {
  /*
   * A Lei nº 15.270/2025 revogou o art. 11 da Lei nº 9.250/1995 e mudou a
   * estrutura da apuração a partir de 2026. Enquanto ela não for estudada,
   * bloquear é a resposta certa — extrapolar a tabela de 2025 produziria
   * número errado com aparência de exato.
   */
  it.each([
    ['2026-06-15', '2026, quando a estrutura mudou'],
    ['2023-06-15', '2023, anterior à cobertura'],
  ])('%s é recusado — %s', (data) => {
    const r = calcularIrpfAnual(
      {
        rendimentosTributaveis: centavos(6_000_000),
        inss: centavos(660_000),
        dependentes: 0,
        instrucao: centavos(0),
        medicas: centavos(0),
        pensao: centavos(0),
        impostoRetido: centavos(0),
      },
      data,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// Traço — `ADR-003` C-M1
// ---------------------------------------------------------------------------

describe('memória de cálculo', () => {
  it('mostra os dois modelos, e não só o adotado', () => {
    const r = calcularIrpfAnual(
      {
        rendimentosTributaveis: centavos(6_000_000),
        inss: centavos(660_000),
        dependentes: 1,
        instrucao: centavos(500_000),
        medicas: centavos(300_000),
        pensao: centavos(0),
        impostoRetido: centavos(300_000),
      },
      EM_2025,
      registro,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const rotulos = r.traco.etapas.map((e) => e.rotulo).join(' | ')
    expect(rotulos).toContain('Base pelo modelo completo')
    expect(rotulos).toContain('Base pelo modelo simplificado')
    expect(rotulos).toContain('Adotado o modelo completo')
    expect(rotulos).toContain('Saldo a restituir')

    // Toda etapa que aplica parâmetro legal cita a norma — RN-029.
    const comParametro = r.traco.etapas.filter((e) => e.parametro !== undefined)
    expect(comParametro.length).toBeGreaterThanOrEqual(3)
  })
})
