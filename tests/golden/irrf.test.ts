/**
 * CASOS-OURO — imposto sobre a renda retido na fonte.
 *
 * fonte_verificacao: **exemplos numéricos publicados pela Receita Federal** em
 * "Exemplos de Aplicação da Lei 15.270/2025". É a segunda das três origens
 * admitidas por `CO-1`: exemplo publicado em fonte oficial.
 *
 * Cada exemplo foi refeito à mão antes de virar teste, e a memória do cálculo
 * manual está no comentário de cada caso.
 *
 * POR QUE A DATA DE REFERÊNCIA É 2026
 *
 * Os exemplos combinam a tabela do imposto vigente desde maio/2025 com o
 * redutor que só passou a valer em janeiro/2026. A contribuição previdenciária
 * neles foi calculada com a tabela de 2025 — os exemplos são de dezembro/2025,
 * antes da portaria de 2026 existir.
 *
 * Isso não é contradição, porque aqui a contribuição é **entrada**, não
 * resultado: `CALC-015` recebe o INSS como campo editável
 * (`03-functional-spec` §3.8). Passamos o valor publicado e verificamos o
 * imposto — que é o que estes casos testam.
 */

import { describe, expect, it } from 'vitest'

import { calcularIrrf } from '../../src/lib/engine/irrf'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(INSS, IRRF)
const EM_2026 = '2026-01-01'

function calcular(rendimento: number, inss: number, data = EM_2026, dependentes = 0) {
  const r = calcularIrrf(
    {
      rendimentoBruto: centavos(rendimento),
      inss: centavos(inss),
      dependentes,
      pensao: centavos(0),
    },
    data,
    registro,
  )
  if (!r.ok) throw new Error(`cálculo falhou: ${r.detalhe}`)
  return r
}

describe('Exemplos oficiais da Receita Federal — Lei 15.270/2025', () => {
  /**
   * Exemplo 1 · alíquota zero
   *   bruto 3.036,00 − INSS 257,73          = 2.778,27  (deduções legais)
   *   bruto 3.036,00 − simplificado 607,20  = 2.428,80  (mais favorável)
   *   base 2.428,80 está na faixa isenta     → imposto 0
   */
  it('exemplo 1 · R$ 3.036,00 fica isento', () => {
    const r = calcular(303_600, 25_773)
    expect(r.valores.baseCalculo).toBe(242_880)
    expect(r.valores.baseEscolhida).toBe('desconto_simplificado')
    expect(r.valores.imposto).toBe(0)
  })

  /**
   * Exemplo 2 · renda até R$ 5.000
   *   legais 4.000,00 − 373,41 = 3.626,59
   *   simplificado 4.000,00 − 607,20 = 3.392,80  (mais favorável)
   *   3.392,80 × 15% = 508,92 − 394,16 = 114,76
   *   redução: rendimento ≤ 5.000 → até 312,89, limitada ao imposto → 114,76
   *   imposto devido = 0
   */
  it('exemplo 2 · R$ 4.000,00 zera pelo redutor', () => {
    const r = calcular(400_000, 37_341)
    expect(r.valores.baseCalculo).toBe(339_280)
    expect(r.valores.imposto).toBe(0)
    expect(r.valores.reducaoAplicada).toBe(11_476)
  })

  /**
   * Exemplo 3 · exatamente R$ 5.000 — a fronteira do teto fixo
   *   legais 5.000,00 − 509,60 = 4.490,40
   *   simplificado 5.000,00 − 607,20 = 4.392,80  (mais favorável)
   *   4.392,80 × 22,5% = 988,38 − 675,49 = 312,89
   *   redução: 312,89, limitada ao imposto → 312,89
   *   imposto devido = 0
   */
  it('exemplo 3 · R$ 5.000,00 zera exatamente', () => {
    const r = calcular(500_000, 50_960)
    expect(r.valores.baseCalculo).toBe(439_280)
    expect(r.valores.imposto).toBe(0)
    expect(r.valores.reducaoAplicada).toBe(31_289)
  })

  /**
   * Exemplo 4 · faixa da FÓRMULA, e o caso que mais informa
   *   legais 6.000,00 − 649,60 = 5.350,40   (mais favorável desta vez)
   *   simplificado 6.000,00 − 607,20 = 5.392,80
   *   5.350,40 × 27,5% = 1.471,36 − 908,73 = 562,63
   *   redução = 978,62 − (0,133145 × 6.000,00) = 978,62 − 798,87 = 179,75
   *   imposto devido = 562,63 − 179,75 = 382,88
   */
  it('exemplo 4 · R$ 6.000,00 usa a fórmula e as deduções legais', () => {
    const r = calcular(600_000, 64_960)
    expect(r.valores.baseCalculo).toBe(535_040)
    // RN-012: aqui as deduções legais vencem o simplificado.
    expect(r.valores.baseEscolhida).toBe('deducoes_legais')
    expect(r.valores.reducaoAplicada).toBe(17_975)
    expect(r.valores.imposto).toBe(38_288)
  })

  /**
   * Exemplo 5 · acima do limite de aplicação
   *   simplificado 7.607,20 − 607,20 = 7.000,00
   *   7.000,00 × 27,5% = 1.925,00 − 908,73 = 1.016,27
   *   rendimento 7.607,20 > 7.350,00 → sem redução
   */
  it('exemplo 5 · R$ 7.607,20 não tem redução', () => {
    const r = calcular(760_720, 0)
    expect(r.valores.baseCalculo).toBe(700_000)
    expect(r.valores.reducaoAplicada).toBe(0)
    expect(r.valores.imposto).toBe(101_627)
  })
})

/**
 * fonte_verificacao: cálculo manual conferido contra o texto do Art. 3º-A da
 * Lei nº 9.250/1995, na publicação original da Lei nº 15.270/2025.
 */
describe('RN-013.1 · a faixa de até R$ 5.000 usa teto fixo, não a fórmula', () => {
  /**
   * ESTE BLOCO VERIFICA O TRAÇO, NÃO O NÚMERO — e a razão importa.
   *
   * O teto de R$ 312,89 é calibrado para que um rendimento de R$ 5.000 pague
   * zero. Como a base pelo simplificado é sempre `rendimento − 607,20`, o
   * imposto de quem ganha até R$ 5.000 nunca passa de R$ 312,89 — e o §1º, que
   * limita a redução ao imposto apurado, sempre morde.
   *
   * Consequência: aplicar a fórmula nesta faixa produz o **mesmo imposto**. O
   * que muda é a EXPLICAÇÃO que o usuário lê na memória de cálculo — "redução
   * de até R$ 312,89" contra "978,62 − 0,133145 × 4.000". Num produto cuja
   * tese é a explicação, isso é defeito; mas é defeito de traço, não de valor.
   *
   * Descoberto por teste de mutação: a versão anterior deste bloco checava só
   * os valores e passava com a implementação errada.
   */
  it('em R$ 4.000 a memória cita o teto fixo, não a fórmula', () => {
    const r = calcular(400_000, 0)
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Redução do imposto')
    expect(etapa).toBeDefined()
    expect(etapa?.formula).toContain('até R$ 312,89')
    // A fórmula não pode aparecer nesta faixa.
    expect(etapa?.formula).not.toContain('133145')
  })

  it('em R$ 6.000 a memória cita a fórmula, com o coeficiente da norma', () => {
    const r = calcular(600_000, 64_960)
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Redução do imposto')
    expect(etapa?.formula).toContain('133145/1000000')
    expect(etapa?.formula).not.toContain('até R$')
  })

  it('o imposto é o mesmo nas duas leituras — o que difere é a explicação', () => {
    // Registrado como caso porque foi exatamente aqui que a checagem por
    // valores se mostrou insuficiente.
    const r = calcular(400_000, 0)
    expect(r.valores.reducaoAplicada).toBe(11_476)
    expect(r.valores.imposto).toBe(0)
  })

  it('no limite superior da fórmula a redução chega a zero', () => {
    // 978,62 − (0,133145 × 7.350,00) = 978,62 − 978,62 = 0
    const r = calcular(735_000, 0)
    expect(r.valores.reducaoAplicada).toBe(0)
  })

  it('um centavo acima do limite não tem redução', () => {
    const r = calcular(735_001, 0)
    expect(r.valores.reducaoAplicada).toBe(0)
  })
})

describe('RN-013.1 · o redutor não existia antes de 2026', () => {
  it('em 2025 o imposto é apurado sem redução alguma', () => {
    // Mesma entrada do exemplo 2, mas em 2025: sem redutor, o imposto aparece.
    const r = calcular(400_000, 37_341, '2025-06-15')
    expect(r.valores.reducaoAplicada).toBe(0)
    expect(r.valores.imposto).toBe(11_476)
  })

  it('a ausência do redutor NÃO bloqueia o cálculo de 2025', () => {
    // Confundir "não havia redutor" com "não temos o dado" bloquearia todo
    // cálculo anterior a 2026. O redutor é opcional por construção.
    const r = calcularIrrf(
      { rendimentoBruto: centavos(400_000), inss: centavos(37_341), dependentes: 0, pensao: centavos(0) },
      '2025-06-15',
      registro,
    )
    expect(r.ok).toBe(true)
  })
})

describe('RN-012 · a base mais favorável é escolhida e justificada', () => {
  it('TC-009 · simplificado mais favorável', () => {
    const r = calcular(400_000, 37_341)
    expect(r.valores.baseEscolhida).toBe('desconto_simplificado')
    expect(r.traco.etapas.some((e) => e.rotulo.includes('desconto simplificado'))).toBe(true)
  })

  it('TC-010 · deduções legais mais favoráveis', () => {
    const r = calcular(600_000, 64_960)
    expect(r.valores.baseEscolhida).toBe('deducoes_legais')
    expect(r.traco.etapas.some((e) => e.rotulo.includes('deduções legais'))).toBe(true)
  })

  it('dependentes entram nas deduções legais e podem virar a escolha', () => {
    const sem = calcular(600_000, 64_960, EM_2026, 0)
    const com = calcular(600_000, 64_960, EM_2026, 3)
    // 3 × R$ 189,59 = R$ 568,77 a menos na base.
    expect(sem.valores.baseCalculo - com.valores.baseCalculo).toBe(56_877)
    expect(com.valores.imposto).toBeLessThan(sem.valores.imposto)
  })
})

describe('RN-014 · imposto nunca é negativo', () => {
  it('TC-008 · redução maior que o imposto resulta em zero, não em crédito', () => {
    const r = calcular(300_000, 0)
    expect(r.valores.imposto).toBe(0)
    expect(r.valores.imposto).toBeGreaterThanOrEqual(0)
  })
})

describe('RF-004 · a mesma entrada em vigências diferentes', () => {
  it('a mudança de tabela em maio de 2025 muda o resultado', () => {
    // Base pelo simplificado difere: 564,80 até abril, 607,20 a partir de maio.
    const abril = calcular(400_000, 37_341, '2025-04-30')
    const maio = calcular(400_000, 37_341, '2025-05-01')
    expect(abril.valores.baseCalculo).toBe(343_520)
    expect(maio.valores.baseCalculo).toBe(339_280)
    expect(abril.valores.imposto).not.toBe(maio.valores.imposto)
  })
})

describe('C-M1 · o traço permite refazer a conta', () => {
  it('toda etapa com parâmetro cita vigência e fonte oficial', () => {
    const r = calcular(600_000, 64_960)
    const comParametro = r.traco.etapas.filter((e) => e.parametro !== undefined)
    expect(comParametro.length).toBeGreaterThanOrEqual(3)
    for (const e of comParametro) {
      expect(e.parametro?.url).toMatch(/^https:\/\/[^/]*\.(gov|leg|jus)\.br\//)
      expect(e.parametro?.vigenciaInicio).toBeTruthy()
    }
  })

  it('a fórmula traz os valores substituídos, não notação algébrica (MC-2)', () => {
    const r = calcular(600_000, 64_960)
    const tabela = r.traco.etapas.find((e) => e.rotulo.includes('Imposto pela tabela'))
    expect(tabela?.formula).toContain('R$')
    expect(tabela?.formula).toContain('%')
  })
})
