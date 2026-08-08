/**
 * CALC-014 — casos-ouro do acerto do contrato intermitente.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: os valores esperados são **derivados do texto da norma**,
 * e cada bloco abaixo cita o dispositivo que o produz — art. 452-A, §§ 6º e 8º
 * da CLT para a estrutura das cinco parcelas e para a base do FGTS, e art. 28,
 * § 9º, "d" da Lei nº 8.212/1991 para a exclusão das indenizadas do
 * salário-de-contribuição. Não existe exemplo oficial resolvido de acerto
 * intermitente publicado por órgão público.
 *
 * Nenhum número foi lido de calculadora concorrente, de blog, de planilha de
 * terceiro ou de resposta gerada por modelo de linguagem (`CO-1`, regra 10 de
 * `CLAUDE.md`). Onde o caso depende de INSS, o esperado é `calcularInss`
 * chamado diretamente — o motor já conferido contra os exemplos publicados pela
 * Receita em `tests/golden/inss.test.ts` —, e não um valor congelado: o que
 * precisa ficar travado aqui é QUAL base entra na contribuição.
 *
 * **O que estes casos medem é a COMPOSIÇÃO do § 6º**, não a tabela do INSS nem
 * a do imposto de renda: essas têm casos-ouro próprios, conferidos contra a
 * norma, e repeti-los aqui só multiplicaria o custo de manutenção sem cobrir
 * nada novo. O que é exclusivo desta calculadora é a estrutura das cinco
 * parcelas, a proporção de um avo e as incidências verba a verba.
 *
 * Por isso as asserções de INSS comparam com `calcularInss` chamado
 * diretamente, em vez de congelar um número: o que precisa ficar travado é
 * QUAL base entra na contribuição, e essa é a decisão desta calculadora.
 */

import { describe, expect, it } from 'vitest'

import { calcularIntermitente } from '../../src/lib/engine/calculadoras/intermitente'
import { calcularInss } from '../../src/lib/engine/inss'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA)
const REF = '2026-06-15' as DataISO

const BASE = {
  valorDaHora: centavos(20_00),
  horas: 40,
  repousoEAdicionais: centavos(32_00),
  dependentes: 0,
}

function calc(over: Partial<typeof BASE> = {}, ref = REF) {
  const r = calcularIntermitente({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-014 · as cinco parcelas do § 6º', () => {
  it('a remuneração é o valor da hora pelas horas prestadas', () => {
    expect(calc().remuneracao).toBe(80_000)
    expect(calc({ horas: 8 }).remuneracao).toBe(16_000)
  })

  /**
   * O repouso e os adicionais entram na base dos proporcionais porque o § 6º os
   * lista como parcelas do mesmo pagamento, e o 13º e as férias são
   * proporcionais À REMUNERAÇÃO do período — não só às horas secas.
   */
  it('o repouso informado entra na base dos proporcionais', () => {
    const v = calc()
    expect(v.baseDosProporcionais).toBe(83_200)
    const semRepouso = calc({ repousoEAdicionais: centavos(0) })
    expect(semRepouso.baseDosProporcionais).toBe(80_000)
    expect(v.decimoTerceiro).toBeGreaterThan(semRepouso.decimoTerceiro)
  })

  it('o décimo terceiro e as férias são um avo da base, e o terço é 1/3 das férias', () => {
    const v = calc()
    expect(v.decimoTerceiro).toBe(6_933) // 832,00 ÷ 12 = 69,3333 → 69,34
    expect(v.feriasProporcionais).toBe(6_933)
    expect(v.tercoDeFerias).toBe(2_311) // 69,33 ÷ 3
  })

  /**
   * **Um período de três dias tem de produzir 13º e férias.** A regra dos 15
   * dias da Lei nº 4.090/1962, aplicada literalmente, daria zero e tornaria
   * impossível o pagamento que o § 6º manda fazer ao fim de CADA período.
   */
  it('um período curto ainda gera 13º e férias proporcionais', () => {
    const v = calc({ horas: 8, repousoEAdicionais: centavos(0) })
    expect(v.decimoTerceiro).toBeGreaterThan(0)
    expect(v.feriasProporcionais).toBeGreaterThan(0)
    expect(v.tercoDeFerias).toBeGreaterThan(0)
  })

  it('o total bruto é a soma das cinco parcelas', () => {
    const v = calc()
    expect(v.totalBruto).toBe(
      v.baseDosProporcionais + v.decimoTerceiro + v.feriasProporcionais + v.tercoDeFerias,
    )
  })

  it('o líquido é o bruto menos INSS e imposto', () => {
    const v = calc()
    expect(v.liquido).toBe(v.totalBruto - v.inss - v.irrf)
  })
})

describe('CALC-014 · as incidências, verba a verba', () => {
  /**
   * Pagas SEM o gozo, as férias proporcionais e o terço são indenizadas, e o
   * art. 28, § 9º, "d" da Lei nº 8.212/1991 as exclui do salário-de-contribuição.
   * Somá-las à base seria cobrar contribuição sobre verba que a lei exclui.
   */
  it('as férias e o terço ficam fora da base do INSS', () => {
    const v = calc()

    const sobrePeriodo = calcularInss({ salarioContribuicao: centavos(83_200) }, REF, registro)
    const sobre13 = calcularInss({ salarioContribuicao: centavos(v.decimoTerceiro) }, REF, registro)
    if (!sobrePeriodo.ok || !sobre13.ok) throw new Error('esperado sucesso')

    expect(v.inss).toBe(sobrePeriodo.valores.contribuicao + sobre13.valores.contribuicao)

    // E a prova pelo avesso: se as indenizadas entrassem, a contribuição subiria.
    const seEntrassem = calcularInss({ salarioContribuicao: centavos(v.totalBruto) }, REF, registro)
    if (!seEntrassem.ok) throw new Error('esperado sucesso')
    expect(seEntrassem.valores.contribuicao).toBeGreaterThan(sobrePeriodo.valores.contribuicao)
  })

  it('o décimo terceiro tem base própria, não se soma ao período', () => {
    const v = calc({ valorDaHora: centavos(150_00), horas: 160, repousoEAdicionais: centavos(0) })
    const juntos = calcularInss(
      { salarioContribuicao: centavos(2_400_000 + v.decimoTerceiro) },
      REF,
      registro,
    )
    if (!juntos.ok) throw new Error('esperado sucesso')
    // Somados, os dois estourariam o teto uma vez só; em separado, cada um tem o seu.
    expect(v.inss).not.toBe(juntos.valores.contribuicao)
  })

  /** O § 8º manda depositar sobre os VALORES PAGOS no período — não sobre o bruto com as indenizadas. */
  it('o FGTS incide sobre a remuneração do período, e não é desconto', () => {
    const v = calc()
    expect(v.fgtsAliquotaBp).toBe(800)
    expect(v.fgtsDepositado).toBe(6_656) // 832,00 × 8%
    expect(v.liquido + v.inss + v.irrf).toBe(v.totalBruto) // o FGTS não sai do líquido
  })
})

describe('CALC-014 · o que a página promete', () => {
  /**
   * A afirmação da tela: a hora que entra no bolso é maior que a contratada,
   * porque o § 6º manda pagar 13º e férias junto. Aqui ela é medida.
   */
  it('a hora efetiva supera a hora do contrato mesmo depois dos descontos', () => {
    const v = calc({ repousoEAdicionais: centavos(0) })
    expect(v.valorHoraLiquidoEfetivo).toBeGreaterThan(20_00)
  })

  it('entrada incompleta bloqueia em vez de calcular', () => {
    expect(calcularIntermitente({ ...BASE, horas: 0 }, REF, registro).ok).toBe(false)
    expect(
      calcularIntermitente({ ...BASE, valorDaHora: centavos(0) }, REF, registro).ok,
    ).toBe(false)
  })

  /** `RN-003` — data sem cobertura de vigência bloqueia, nunca extrapola. */
  it('data fora da cobertura bloqueia o cálculo', () => {
    const r = calcularIntermitente(BASE, '1990-01-01' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('a memória cita a norma em cada etapa que tem fundamento ou parâmetro', () => {
    const r = calcularIntermitente(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const citadas = r.traco.etapas.filter((e) => e.parametro ?? e.fundamento)
    expect(citadas.length).toBeGreaterThanOrEqual(6)
    // A tabela do INSS vem de portaria interministerial publicada no gov.br —
    // oficial, e fora do Planalto. Exigir "planalto.gov.br" reprovaria a fonte certa.
    expect(
      citadas.every((e) => (e.parametro?.url ?? e.fundamento?.url ?? '').includes('.gov.br')),
    ).toBe(true)
  })
})
