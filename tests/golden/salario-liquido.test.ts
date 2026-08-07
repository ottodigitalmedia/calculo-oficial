/**
 * CASOS-OURO — CALC-001 Salário líquido.
 *
 * fonte_verificacao: cálculo manual conferido contra as tabelas cadastradas em
 * T-101, ambas de fonte oficial. A memória de cada cálculo manual está no
 * comentário do caso.
 *
 * Data de referência sempre explícita (`12-test-plan` §3.2).
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularNaTela } from '../../src/lib/calculadoras/salario-liquido'
import { calcularSalarioLiquido } from '../../src/lib/engine/calculadoras/salario-liquido'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { VALE_TRANSPORTE } from '../../src/lib/params/data/vale-transporte'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(INSS, IRRF, VALE_TRANSPORTE)

const vazio = {
  dependentes: 0,
  pensao: centavos(0),
  outrosDescontos: centavos(0),
  custoValeTransporte: centavos(0),
}

function calcular(salario: number, data: string, over: Partial<typeof vazio> = {}) {
  const r = calcularSalarioLiquido(
    { salarioBruto: centavos(salario), ...vazio, ...over },
    data,
    registro,
  )
  if (!r.ok) throw new Error(r.detalhe)
  return r
}

describe('salário líquido em 2026', () => {
  /**
   *   R$ 5.000,00 · sem dependentes
   *   INSS      R$   501,51   (tabela 2026, arredondado no total)
   *   base      R$ 4.392,80   (simplificado, mais favorável)
   *   imposto   R$   312,89   zerado pelo redutor (teto R$ 312,89)
   *   líquido   R$ 4.498,49
   */
  it('R$ 5.000,00 tem o imposto zerado pelo redutor', () => {
    const r = calcular(500_000, '2026-06-15')
    expect(r.valores.inss).toBe(50_151)
    expect(r.valores.irrf).toBe(0)
    expect(r.valores.liquido).toBe(449_849)
  })

  /**
   *   R$ 8.500,00 · 2 dependentes — acima do teto e acima do redutor
   *   INSS      R$   988,09   (base limitada ao teto de R$ 8.475,55)
   *   base      R$ 7.132,73   (deduções legais: 8.500 − 988,09 − 379,18)
   *   imposto   R$ 1.052,77   sem redução (rendimento > R$ 7.350,00)
   *   líquido   R$ 6.459,14
   */
  it('R$ 8.500,00 com 2 dependentes passa do teto e não tem redução', () => {
    const r = calcular(850_000, '2026-06-15', { dependentes: 2 })
    expect(r.valores.inss).toBe(98_809)
    expect(r.valores.irrf).toBe(105_277)
    expect(r.valores.liquido).toBe(645_914)
  })

  /**
   *   R$ 3.000,00 · pensão R$ 200,00 · outros descontos R$ 150,00
   *   INSS      R$   248,60
   *   base      R$ 2.392,80   (simplificado) → faixa isenta
   *   imposto   R$     0,00
   *   líquido   3.000 − 248,60 − 0 − 200 − 150 = R$ 2.401,40
   */
  it('pensão e outros descontos entram no líquido', () => {
    const r = calcular(300_000, '2026-06-15', {
      pensao: centavos(20_000),
      outrosDescontos: centavos(15_000),
    })
    expect(r.valores.inss).toBe(24_860)
    expect(r.valores.irrf).toBe(0)
    expect(r.valores.liquido).toBe(240_140)
  })
})

describe('RF-004 · o mesmo salário em 2025 e em 2026', () => {
  it('difere por DOIS motivos somados: tabela de INSS e existência do redutor', () => {
    const em2026 = calcular(500_000, '2026-06-15')
    const em2025 = calcular(500_000, '2025-06-15')

    expect(em2026.valores.inss).toBe(50_151)
    expect(em2025.valores.inss).toBe(50_960)

    // Em 2025 não havia redutor, então o imposto aparece.
    expect(em2026.valores.irrf).toBe(0)
    expect(em2025.valores.irrf).toBe(31_289)

    expect(em2026.valores.liquido).toBe(449_849)
    expect(em2025.valores.liquido).toBe(417_751)
  })
})

describe('C-M1 · o traço encadeia previdência, imposto e líquido', () => {
  it('a última etapa é o líquido e bate com o valor exibido (MC-8)', () => {
    const r = calcular(500_000, '2026-06-15')
    const ultima = r.traco.etapas[r.traco.etapas.length - 1]
    expect(ultima?.rotulo).toBe('Salário líquido')
    expect(ultima?.resultado).toBe(r.valores.liquido)
  })

  it('as vigências de INSS e IRRF aparecem juntas, sem duplicar', () => {
    const r = calcular(500_000, '2026-06-15')
    expect(r.traco.vigenciasAplicadas).toContain('inss-tabela-2026')
    expect(r.traco.vigenciasAplicadas).toContain('irrf-tabela-2025-05')
    expect(new Set(r.traco.vigenciasAplicadas).size).toBe(r.traco.vigenciasAplicadas.length)
  })

  it('outros descontos só viram etapa quando existem', () => {
    const sem = calcular(300_000, '2026-06-15')
    const com = calcular(300_000, '2026-06-15', { outrosDescontos: centavos(15_000) })
    expect(sem.traco.etapas.some((e) => e.rotulo === 'Outros descontos')).toBe(false)
    expect(com.traco.etapas.some((e) => e.rotulo === 'Outros descontos')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// RN-027 · vale-transporte
// ---------------------------------------------------------------------------

/**
 * fonte_verificacao: Lei nº 7.418/1985, art. 4º, parágrafo único, e Decreto
 * nº 10.854/2021, art. 114, I — ambos lidos no texto do Planalto em 07/08/2026.
 *
 * **A regra inteira é um mínimo entre dois números**, e é isso que estes casos
 * fixam. O percentual sobre o salário é uma multiplicação que qualquer um
 * confere; o que erra na prática é descontar a cota cheia de quem gasta menos
 * que ela — cobrando por transporte que não houve.
 *
 * O líquido é conferido por DIFERENÇA, e não por valor absoluto: as parcelas de
 * INSS e IRRF já estão fixadas nos casos acima, e repeti-las aqui criaria dois
 * lugares para o mesmo número — a família de defeito que este projeto persegue.
 */
describe('RN-027 · vale-transporte é o menor entre a cota e o custo', () => {
  const SALARIO = 300_000 // R$ 3.000,00 · cota de 6% = R$ 180,00
  const COTA = 18_000

  it('custo acima da cota desconta a COTA, e o empregador paga o excedente', () => {
    const r = calcular(SALARIO, '2026-06-15', { custoValeTransporte: centavos(30_000) })
    expect(r.valores.valeTransporte).toBe(COTA)
  })

  it('custo abaixo da cota desconta o CUSTO, e não a cota', () => {
    const r = calcular(SALARIO, '2026-06-15', { custoValeTransporte: centavos(10_000) })
    expect(r.valores.valeTransporte).toBe(10_000)
  })

  /** A fronteira: custo exatamente igual à cota dá o mesmo pelos dois caminhos. */
  it('custo igual à cota desconta esse valor uma vez só', () => {
    const r = calcular(SALARIO, '2026-06-15', { custoValeTransporte: centavos(COTA) })
    expect(r.valores.valeTransporte).toBe(COTA)
  })

  it('quem não usa o benefício não sofre desconto nem ganha etapa', () => {
    const r = calcular(SALARIO, '2026-06-15')
    expect(r.valores.valeTransporte).toBe(0)
    expect(r.traco.etapas.some((e) => e.rotulo === 'Vale-transporte')).toBe(false)
  })

  it('o desconto sai do líquido, exatamente uma vez', () => {
    const sem = calcular(SALARIO, '2026-06-15')
    const com = calcular(SALARIO, '2026-06-15', { custoValeTransporte: centavos(10_000) })
    expect(sem.valores.liquido - com.valores.liquido).toBe(10_000)
    expect(com.valores.totalDescontos - sem.valores.totalDescontos).toBe(10_000)
  })

  /**
   * O arredondamento da cota, sobre um salário que não fecha em conta redonda.
   *
   * 6% de R$ 1.234,57 são R$ 74,0742 — e a política declarada é meio para cima,
   * então param em R$ 74,07. Sem um caso aqui, uma troca de política passaria
   * despercebida por mexer em centavos.
   */
  it('a cota arredonda pela política declarada', () => {
    const r = calcular(123_457, '2026-06-15', { custoValeTransporte: centavos(50_000) })
    expect(r.valores.valeTransporte).toBe(7_407)
  })

  /**
   * A MEMÓRIA PRECISA CITAR A NORMA — é a razão de o produto existir.
   *
   * Uma etapa de vale-transporte sem `parametro` mostraria um desconto sem
   * dizer de onde ele vem, que é exatamente o que este site promete não fazer.
   */
  it('a etapa cita o parâmetro, a vigência e a norma', () => {
    const r = calcular(SALARIO, '2026-06-15', { custoValeTransporte: centavos(30_000) })
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Vale-transporte')
    expect(etapa).toBeDefined()
    expect(etapa?.parametro?.parametroId).toBe('vale-transporte-cota-do-empregado')
    expect(etapa?.parametro?.norma).toContain('7.418')
    expect(etapa?.parametro?.url).toMatch(/^https:\/\/www\.planalto\.gov\.br/)
    expect(r.traco.vigenciasAplicadas).toContain('vale-transporte-cota-do-empregado-1985')
  })

  /**
   * `RN-003` — sem cobertura de vigência, o cálculo BLOQUEIA em vez de supor.
   *
   * Aqui o registro é montado sem o conjunto do vale-transporte, que é o que
   * aconteceria se alguém esquecesse de ligá-lo em `construirRegistro`. Sem
   * esta asserção, o esquecimento sairia como desconto zero — silencioso.
   */
  it('sem o parâmetro no registro, o cálculo recusa em vez de descontar zero', () => {
    const semVale = construirRegistro(INSS, IRRF)
    const r = calcularSalarioLiquido(
      { salarioBruto: centavos(SALARIO), ...vazio, custoValeTransporte: centavos(30_000) },
      '2026-06-15',
      semVale,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  /** E sem custo informado ele não é exigido — quem não usa não deve bloquear. */
  it('sem o parâmetro no registro, quem não usa o benefício continua calculando', () => {
    const semVale = construirRegistro(INSS, IRRF)
    const r = calcularSalarioLiquido(
      { salarioBruto: centavos(SALARIO), ...vazio },
      '2026-06-15',
      semVale,
    )
    expect(r.ok).toBe(true)
  })
})

/**
 * A PORTA DO CAMPO — `optanteVT` decide se `custoVT` conta.
 *
 * `custoVT` só aparece na tela quando o usuário marca "Uso" (`visivelSe`), mas
 * o valor digitado continua na URL (`RF-006`) depois de o campo sumir. Sem o
 * recorte em `calcular`, desmarcar manteria o desconto — campo invisível
 * mexendo no resultado, que é a classe de defeito de um filtro que fica ativo
 * depois de escondido.
 */
describe('CALC-001 · o custo do vale só conta quando o usuário declara que usa', () => {
  const BASE = {
    salarioBruto: 300_000,
    dependentes: 0,
    pensao: 0,
    outrosDescontos: 0,
    custoVT: 30_000,
  }

  function liquidoCom(optanteVT: string) {
    const r = calcularNaTela({ ...BASE, optanteVT }, '2026-06-15')
    if (!r.ok) throw new Error(r.detalhe)
    return r
  }

  it('marcado "Uso", o desconto entra', () => {
    const r = liquidoCom('usa')
    expect(r.valores.detalhamento.some((l) => l.rotulo === 'Vale-transporte')).toBe(true)
  })

  it('marcado "Não uso", o custo residual na URL é ignorado', () => {
    const r = liquidoCom('nao')
    expect(r.valores.detalhamento.some((l) => l.rotulo === 'Vale-transporte')).toBe(false)
    expect(r.valores.principal).toBe(liquidoCom('nao').valores.principal)
    expect(r.valores.principal).toBeGreaterThan(liquidoCom('usa').valores.principal)
  })
})

describe('C-M3 · erros de domínio', () => {
  it('salário zero devolve entrada_incompleta, não zero', () => {
    const r = calcularSalarioLiquido(
      { salarioBruto: centavos(0), ...vazio },
      '2026-06-15',
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('data sem cobertura propaga o erro do motor de INSS', () => {
    const r = calcularSalarioLiquido(
      { salarioBruto: centavos(500_000), ...vazio },
      '2019-01-01',
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
