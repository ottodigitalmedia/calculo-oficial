/**
 * Casos-ouro de CALC-047 (DAS-MEI) e CALC-052 (limite do MEI).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Texto consolidado da LC nº 123/2006 e texto da LC nº 214/2025, no Planalto,
 * lidos em 06/08/2026.
 *
 *   Art. 18-A, § 3º, V — "o MEI [...] recolherá [...] valor fixo mensal
 *   correspondente à soma das seguintes parcelas: a) R$ 45,65 [...]; b) R$ 1,00
 *   (um real), a título do imposto referido no inciso VII do caput do art. 13
 *   [ICMS], caso seja contribuinte do ICMS; e c) R$ 5,00 (cinco reais) [...]
 *   [ISS], caso seja contribuinte do ISS".
 *
 *   Art. 18-A, § 11 — o valor da alínea "a" "será reajustado [...] de forma a
 *   manter equivalência com a contribuição de que trata o § 2º do art. 21 da Lei
 *   nº 8.212" — os 5% sobre o limite mínimo. **É por isso que o INSS do MEI é
 *   5% do salário mínimo, e não os R$ 45,65 escritos.**
 *
 *   Art. 18-A, § 1º (LC 188/2021) — limite de R$ 81.000,00.
 *   Art. 18-A, § 2º (LC 155/2016) — R$ 6.750,00 × meses, no ano de abertura.
 *   Art. 18-A, § 7º, III — até 20% de excesso o efeito é do ano seguinte;
 *   acima de 20%, retroage.
 *
 *   LC 214/2025, Anexo VII — vigência declarada linha a linha, a primeira
 *   começando em 1º/1/2027. É o que garante que R$ 1,00 e R$ 5,00 continuam
 *   valendo até 31/12/2026.
 *
 * As contas fecham à mão, com o mínimo de 2026 (R$ 1.621,00):
 *
 *   5% de 1.621,00 = 81,05    +1,00 (ICMS) = 82,05    +5,00 (ISS) = 86,05
 *   comércio E serviços: 81,05 + 1,00 + 5,00 = 87,05
 *   81.000,00 + 20% = 97.200,00
 *
 * As propriedades que estes casos travam:
 *
 *   1. **O DAS não depende do faturamento** — é a definição do regime.
 *   2. **A guia acompanha o salário mínimo**, porque a maior parcela é
 *      percentual dele.
 *   3. **A linha dos 20%** separa dois desfechos muito diferentes.
 *   4. **O limite do ano de abertura é proporcional**, com fração de mês
 *      contando como mês inteiro.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDasDef, DAS_MEI } from '../../src/lib/calculadoras/das-mei'
import { calcular as calcularLimiteDef } from '../../src/lib/calculadoras/limite-do-mei'
import { calcularDasMei, calcularLimiteMei } from '../../src/lib/engine/calculadoras/mei'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { MEI } from '../../src/lib/params/data/mei'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, MEI)
const REF_2026 = '2026-06-15' as DataISO
const REF_2025 = '2025-06-15' as DataISO

function das(atividade: 'comercio' | 'servicos' | 'comercio-e-servicos', ref = REF_2026) {
  const r = calcularDasMei({ atividade }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

// ---------------------------------------------------------------------------
// CALC-047 — DAS-MEI
// ---------------------------------------------------------------------------

describe('CALC-047 · a composição da guia', () => {
  it('o INSS são 5% do salário mínimo — R$ 81,05 em 2026', () => {
    const v = das('comercio')
    expect(v.baseDoInss).toBe(162_100)
    expect(v.percentualDoInssBp).toBe(500)
    expect(v.inss).toBe(8_105)
  })

  it('comércio paga INSS mais R$ 1,00 de ICMS', () => {
    const v = das('comercio')
    expect(v.icms).toBe(100)
    expect(v.iss).toBe(0)
    expect(v.total).toBe(8_205)
  })

  it('serviços paga INSS mais R$ 5,00 de ISS', () => {
    const v = das('servicos')
    expect(v.icms).toBe(0)
    expect(v.iss).toBe(500)
    expect(v.total).toBe(8_605)
  })

  it('quem faz as duas coisas paga as duas parcelas', () => {
    const v = das('comercio-e-servicos')
    expect(v.total).toBe(8_105 + 100 + 500)
    expect(v.totalAnual).toBe(v.total * 12)
  })

  /**
   * A propriedade que define o regime: o valor é fixo, e a página não pergunta
   * faturamento. Um campo de faturamento aqui sugeriria uma relação que não
   * existe — este caso trava a decisão contra alguém "completar" o formulário.
   */
  it('a página não tem campo de faturamento, e isso é decisão', () => {
    const campos = DAS_MEI.campos.map((c) => c.id)
    expect(campos).toEqual(['atividade'])
    expect(DAS_MEI.campos.every((c) => c.tipo !== 'monetario')).toBe(true)
  })

  /**
   * A explicação que quase nenhuma página dá: a guia sobe todo ano porque o
   * mínimo sobe.
   */
  it('a guia de 2025 é menor porque o mínimo era menor', () => {
    const v2025 = das('comercio-e-servicos', REF_2025)
    // 5% de R$ 1.518,00 = R$ 75,90
    expect(v2025.baseDoInss).toBe(151_800)
    expect(v2025.inss).toBe(7_590)
    expect(v2025.total).toBe(7_590 + 100 + 500)
    expect(v2025.total).toBeLessThan(das('comercio-e-servicos').total)
  })

  it('antes de 2027 não há IBS nem CBS na guia', () => {
    expect(das('comercio-e-servicos').ibsCbs).toBe(0)
    expect(das('comercio-e-servicos', REF_2025).ibsCbs).toBe(0)
  })

  /**
   * As vigências do Anexo VII (2027 a 2033) foram cadastradas e removidas — ver
   * a nota de topo de `params/data/mei.ts` e §7.48. Enquanto o salário mínimo
   * dos anos correspondentes não existir, o seletor não pode oferecê-los: ele
   * abria em 2033 e calculava o INSS com o mínimo de 2026.
   *
   * Este caso trava a decisão: o seletor de período não oferece ano além de
   * 2026, que é até onde o salário mínimo vai.
   */
  it('o seletor não oferece ano além da cobertura do salário mínimo', () => {
    const anos = registro.anosDisponiveis([...DAS_MEI.parametrosRequeridos])
    expect(Math.max(...anos)).toBe(2026)
    expect(anos).toContain(2025)
  })

  it('a memória cita a vigência de cada parcela', () => {
    const r = calcularDasMei({ atividade: 'comercio-e-servicos' }, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.traco.vigenciasAplicadas).toContain('mei-inss-2025')
    expect(r.traco.vigenciasAplicadas).toContain('mei-icms-ate-2026')
    expect(r.traco.vigenciasAplicadas).toContain('mei-iss-ate-2026')
  })

  it('a coluna do resultado fecha com o total', () => {
    const r = calcularDasDef({ atividade: 'comercio-e-servicos' }, REF_2026)
    if (!r.ok) throw new Error('esperado sucesso')
    const linhas = r.valores.detalhamento
    const total = linhas[linhas.length - 1]
    const parcelas = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
    expect(parcelas).toBe(total?.valor)
    expect(r.valores.principal).toBe(8_705)
  })

  it('atividade desconhecida na URL não quebra a página', () => {
    const r = calcularDasDef({ atividade: 'inventada' }, REF_2026)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(8_705)
  })
})

// ---------------------------------------------------------------------------
// CALC-052 — limite e desenquadramento
// ---------------------------------------------------------------------------

function limite(faturamento: number, meses = 0, ref = REF_2026) {
  const r = calcularLimiteMei(
    { faturamentoNoAno: centavos(faturamento), mesesDeAtividade: meses },
    ref,
    registro,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-052 · o limite e a linha dos 20%', () => {
  it('o limite anual é R$ 81.000,00 e a linha dos 20% é R$ 97.200,00', () => {
    const v = limite(1_000_000)
    expect(v.limite).toBe(8_100_000)
    expect(v.limiteComTolerancia).toBe(9_720_000)
  })

  it('dentro do limite, a margem é o que falta', () => {
    const v = limite(5_000_000)
    expect(v.situacao).toBe('dentro')
    expect(v.margem).toBe(8_100_000 - 5_000_000)
    expect(v.excesso).toBe(0)
    expect(v.margemAteRetroagir).toBe(9_720_000 - 5_000_000)
  })

  /**
   * A propriedade central: os três desfechos, e as fronteiras exatas entre eles.
   * Um centavo separa "vale do ano que vem" de "retroage ao ano inteiro".
   */
  it('as fronteiras dos três desfechos estão no centavo certo', () => {
    expect(limite(8_100_000).situacao).toBe('dentro')
    expect(limite(8_100_001).situacao).toBe('excedeu-ate-20')
    expect(limite(9_720_000).situacao).toBe('excedeu-ate-20')
    expect(limite(9_720_001).situacao).toBe('excedeu-acima-de-20')
  })

  it('o excesso é medido do limite, não da linha dos 20%', () => {
    const v = limite(9_000_000)
    expect(v.excesso).toBe(9_000_000 - 8_100_000)
    expect(v.margem).toBe(0)
  })

  /**
   * O segundo engano mais comum: quem abre em outubro não tem o teto cheio, e a
   * lei conta fração de mês como mês inteiro.
   */
  it('no ano de abertura o limite é proporcional aos meses', () => {
    const v = limite(1_000_000, 3)
    expect(v.proRata).toBe(true)
    expect(v.limite).toBe(675_000 * 3)
    expect(v.limiteComTolerancia).toBe(675_000 * 3 + Math.round(675_000 * 3 * 0.2))
  })

  it('doze meses de atividade equivalem ao ano cheio', () => {
    expect(limite(1_000_000, 12).proRata).toBe(false)
    expect(limite(1_000_000, 12).limite).toBe(8_100_000)
    expect(limite(1_000_000, 0).limite).toBe(8_100_000)
  })

  it('quem abriu em outubro estoura com um faturamento que caberia no ano cheio', () => {
    const anoCheio = limite(2_500_000, 0)
    const tresMeses = limite(2_500_000, 3)
    expect(anoCheio.situacao).toBe('dentro')
    expect(tresMeses.situacao).toBe('excedeu-acima-de-20')
  })

  it('a média mensal do limite acompanha os meses considerados', () => {
    expect(limite(1_000_000).mediaMensalDoLimite).toBe(Math.floor(8_100_000 / 12))
    expect(limite(1_000_000, 3).mediaMensalDoLimite).toBe(675_000)
  })

  it('entrada inválida é recusada em vez de calculada', () => {
    expect(
      calcularLimiteMei(
        { faturamentoNoAno: centavos(0), mesesDeAtividade: 13 },
        REF_2026,
        registro,
      ).ok,
    ).toBe(false)
  })

  it('a coluna do resultado fecha nos dois desfechos', () => {
    const dentro = calcularLimiteDef({ faturamento: 5_000_000, mesesDeAtividade: 0 }, REF_2026)
    if (!dentro.ok) throw new Error('esperado sucesso')
    const [faturado, cabe, limiteLinha] = dentro.valores.detalhamento
    expect((faturado?.valor ?? 0) + (cabe?.valor ?? 0)).toBe(limiteLinha?.valor)

    const fora = calcularLimiteDef({ faturamento: 9_000_000, mesesDeAtividade: 0 }, REF_2026)
    if (!fora.ok) throw new Error('esperado sucesso')
    const [lim, excesso, total] = fora.valores.detalhamento
    expect((lim?.valor ?? 0) + (excesso?.valor ?? 0)).toBe(total?.valor)
  })

  it('a nota do desfecho corresponde à situação', () => {
    const grave = calcularLimiteDef({ faturamento: 12_000_000, mesesDeAtividade: 0 }, REF_2026)
    if (!grave.ok) throw new Error('esperado sucesso')
    expect((grave.valores.notas ?? []).some((n) => n.includes('passou dos 20%'))).toBe(true)

    const leve = calcularLimiteDef({ faturamento: 8_500_000, mesesDeAtividade: 0 }, REF_2026)
    if (!leve.ok) throw new Error('esperado sucesso')
    expect((leve.valores.notas ?? []).some((n) => n.includes('dentro dos 20%'))).toBe(true)
  })
})
