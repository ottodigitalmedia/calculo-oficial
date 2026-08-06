/**
 * Casos-ouro de CALC-053 — carnê-leão.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * **Nenhum parâmetro legal novo.** A tabela progressiva, a dedução por
 * dependente e o desconto simplificado são os já cadastrados em `irrf.ts` e
 * conferidos contra a Receita — e `irrf.test.ts` já os cobre contra os exemplos
 * oficiais. O que estes casos verificam é o que o carnê-leão acrescenta.
 *
 * Fundamentos lidos no Planalto em 06/08/2026:
 *
 *   Lei nº 7.713/1988, art. 8º, caput — "Fica sujeito ao pagamento do imposto
 *   de renda [...] a pessoa física que receber de outra pessoa física, ou de
 *   fontes situadas no exterior, rendimentos e ganhos de capital que não tenham
 *   sido tributados na fonte, no País."
 *
 *   Lei nº 8.134/1990, art. 6º, I a III — deduz-se da receita a remuneração
 *   paga a terceiros com vínculo e encargos, os emolumentos pagos a terceiros e
 *   as despesas de custeio necessárias.
 *
 *   Art. 6º, § 3º — as deduções "não poderão exceder à receita mensal da
 *   respectiva atividade, permitido o cômputo do excesso de deduções nos meses
 *   seguintes, até dezembro".
 *
 * As propriedades que estes casos travam:
 *
 *   1. **O livro-caixa reduz o RENDIMENTO, não a base** — ele entra antes das
 *      deduções legais e antes do desconto simplificado, e por isso muda qual
 *      das duas prevalece.
 *   2. **O excesso não se perde** — é o § 3º, e é a regra que mais muda o
 *      resultado de quem tem mês fraco.
 *   3. **A conta coincide com a de CALC-015** quando não há livro-caixa. Se
 *      divergirem, um dos dois está errado.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDef } from '../../src/lib/calculadoras/carne-leao'
import { calcularCarneLeao, liquidoDoMes } from '../../src/lib/engine/calculadoras/carne-leao'
import { calcularIrrf } from '../../src/lib/engine/irrf'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(IRRF, INSS)
const REF = '2026-06-15' as DataISO

const BASE = {
  rendimento: centavos(800_000),
  livroCaixa: centavos(0),
  excessoAnterior: centavos(0),
  inss: centavos(0),
  dependentes: 0,
  pensao: centavos(0),
}

function calc(over: Partial<typeof BASE> = {}, ref = REF) {
  const r = calcularCarneLeao({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

/**
 * A propriedade que impede as duas calculadoras de divergirem: sem livro-caixa,
 * o carnê-leão é o IRPF mensal, e usa o mesmo motor.
 */
describe('CALC-053 · sem livro-caixa, é o mesmo IRPF mensal de CALC-015', () => {
  it('o imposto coincide com o de calcularIrrf, entrada por entrada', () => {
    for (const rendimento of [200_000, 500_000, 800_000, 2_000_000]) {
      for (const dependentes of [0, 2]) {
        const carne = calc({ rendimento: centavos(rendimento), dependentes })
        const irrf = calcularIrrf(
          { rendimentoBruto: centavos(rendimento), inss: centavos(0), dependentes, pensao: centavos(0) },
          REF,
          registro,
        )
        if (!irrf.ok) throw new Error('esperado sucesso')
        expect(carne.imposto, `${rendimento} com ${dependentes} dependentes`).toBe(
          irrf.valores.imposto,
        )
        expect(carne.baseCalculo).toBe(irrf.valores.baseCalculo)
      }
    }
  })
})

describe('CALC-053 · o livro-caixa reduz o rendimento antes de tudo', () => {
  it('a receita tributável é a receita menos o livro-caixa', () => {
    const v = calc({ livroCaixa: centavos(200_000) })
    expect(v.livroCaixaAplicado).toBe(200_000)
    expect(v.rendimentoTributavel).toBe(600_000)
    expect(v.excessoATransportar).toBe(0)
  })

  it('livro-caixa maior reduz o imposto', () => {
    const sem = calc()
    const com = calc({ livroCaixa: centavos(300_000) })
    expect(com.imposto).toBeLessThan(sem.imposto)
  })

  it('livro-caixa suficiente zera o imposto', () => {
    const v = calc({ livroCaixa: centavos(800_000) })
    expect(v.rendimentoTributavel).toBe(0)
    expect(v.imposto).toBe(0)
  })

  it('o INSS e os dependentes continuam deduzindo depois dele', () => {
    const so = calc({ livroCaixa: centavos(200_000) })
    const comTudo = calc({ livroCaixa: centavos(200_000), inss: centavos(50_000), dependentes: 2 })
    expect(comTudo.imposto).toBeLessThan(so.imposto)
  })
})

/**
 * O § 3º do art. 6º, e a regra que quase ninguém aproveita: o excesso não se
 * perde no mês — ele vai para os seguintes.
 */
describe('CALC-053 · o excesso de livro-caixa transporta', () => {
  it('a dedução não passa da receita do mês, e o resto sobra', () => {
    const v = calc({ rendimento: centavos(300_000), livroCaixa: centavos(500_000) })
    expect(v.livroCaixaDisponivel).toBe(500_000)
    expect(v.livroCaixaAplicado).toBe(300_000)
    expect(v.excessoATransportar).toBe(200_000)
    expect(v.rendimentoTributavel).toBe(0)
    expect(v.imposto).toBe(0)
  })

  it('o excesso do mês anterior soma ao livro-caixa do mês', () => {
    const v = calc({
      rendimento: centavos(800_000),
      livroCaixa: centavos(100_000),
      excessoAnterior: centavos(200_000),
    })
    expect(v.livroCaixaDisponivel).toBe(300_000)
    expect(v.livroCaixaAplicado).toBe(300_000)
    expect(v.rendimentoTributavel).toBe(500_000)
    expect(v.excessoATransportar).toBe(0)
  })

  /**
   * A sequência de dois meses: mês fraco acumula, mês forte usa. Ignorar o
   * transporte cobraria imposto a mais no segundo mês.
   */
  it('dois meses seguidos: o que sobra no fraco alivia o forte', () => {
    const fraco = calc({ rendimento: centavos(200_000), livroCaixa: centavos(600_000) })
    expect(fraco.excessoATransportar).toBe(400_000)

    const forte = calc({
      rendimento: centavos(1_000_000),
      livroCaixa: centavos(0),
      excessoAnterior: centavos(fraco.excessoATransportar),
    })
    expect(forte.rendimentoTributavel).toBe(600_000)

    const semTransporte = calc({ rendimento: centavos(1_000_000) })
    expect(forte.imposto).toBeLessThan(semTransporte.imposto)
  })
})

describe('CALC-053 · o que a calculadora recusa e o que ela declara', () => {
  it('sem rendimento, o estado é pendente', () => {
    expect(calcularCarneLeao({ ...BASE, rendimento: centavos(0) }, REF, registro).ok).toBe(false)
  })

  it('valor negativo é recusado', () => {
    expect(
      calcularCarneLeao({ ...BASE, livroCaixa: centavos(-100) }, REF, registro).ok,
    ).toBe(false)
  })

  it('a memória declara quem deve recolher, com a lei ao lado', () => {
    const r = calcularCarneLeao(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const primeira = r.traco.etapas[0]
    expect(primeira?.justificativa).toContain('PESSOA FÍSICA')
    expect(primeira?.fundamento?.url).toContain('planalto.gov.br')
  })

  it('a memória declara a regra do transporte quando há livro-caixa', () => {
    const r = calcularCarneLeao({ ...BASE, livroCaixa: centavos(100_000) }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('aplicado neste mês'))
    expect(etapa?.justificativa).toContain('NÃO se perde')
  })

  it('a memória mantém as etapas do IRPF depois das próprias', () => {
    const r = calcularCarneLeao(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.traco.etapas.some((e) => e.rotulo.includes('desconto simplificado'))).toBe(true)
    expect(r.traco.vigenciasAplicadas.length).toBeGreaterThan(0)
  })
})

describe('CALC-053 · a definição publicada', () => {
  it('a coluna do resultado fecha com o que entrou', () => {
    const r = calcularDef({ rendimento: 800_000, livroCaixa: 0, excessoAnterior: 0 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const [imposto, sobra, recebido] = r.valores.detalhamento
    expect((imposto?.valor ?? 0) + (sobra?.valor ?? 0)).toBe(recebido?.valor)
    expect(r.valores.principal).toBe(imposto?.valor)
  })

  it('o líquido é o recebido menos o imposto', () => {
    const v = calc()
    expect(liquidoDoMes(v)).toBe(800_000 - v.imposto)
  })

  it('o destaque do excesso só aparece quando há excesso', () => {
    const com = calcularDef({ rendimento: 200_000, livroCaixa: 600_000 }, REF)
    if (!com.ok) throw new Error('esperado sucesso')
    expect((com.valores.destaques ?? []).some((d) => d.rotulo.includes('sobra'))).toBe(true)

    const sem = calcularDef({ rendimento: 800_000, livroCaixa: 0 }, REF)
    if (!sem.ok) throw new Error('esperado sucesso')
    expect((sem.valores.destaques ?? []).some((d) => d.rotulo.includes('sobra'))).toBe(false)
  })

  it('a nota sobre não somar renda de empresa aparece sempre', () => {
    const r = calcularDef({ rendimento: 800_000 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect((r.valores.notas ?? []).some((n) => n.includes('duas vezes'))).toBe(true)
  })
})
