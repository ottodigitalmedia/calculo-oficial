/**
 * Casos-ouro de CALC-004 (férias) e CALC-005 (13º).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Como em `rescisao.test.ts`: não existe exemplo oficial resolvido publicado
 * por órgão público para estas duas, então os casos são **derivados da norma**,
 * com o dispositivo citado ao lado de cada valor. Onde o caso depende de INSS
 * ou de IRRF, quem calcula é o motor já conferido contra os cinco exemplos da
 * Receita — este arquivo verifica a composição e as incidências.
 *
 * **O teste mais importante do arquivo** é o que separa férias GOZADAS de
 * férias INDENIZADAS: as duas têm regra oposta de INSS, e trocá-las produz um
 * número plausível e errado.
 */

import { describe, expect, it } from 'vitest'

import {
  calcularDecimoTerceiro,
  calcularFerias,
} from '../../src/lib/engine/calculadoras/ferias-e-decimo-terceiro'
import { calcularRescisao } from '../../src/lib/engine/calculadoras/rescisao'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA)
const REF = '2026-06-15' as DataISO

const FERIAS_BASE = {
  salario: centavos(300_000),
  tipo: 'integrais' as const,
  mesesTrabalhados: 12,
  diasGozados: 30,
  abonoPecuniario: false,
  adiantar13: false,
  dependentes: 0,
}

// ---------------------------------------------------------------------------
// CALC-004 — Férias
// ---------------------------------------------------------------------------

describe('CALC-004 · férias integrais de 30 dias, salário R$ 3.000,00', () => {
  const r = calcularFerias(FERIAS_BASE, REF, registro)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  it('a remuneração das férias é o salário do período — CLT art. 142', () => {
    expect(r.valores.diasDeDireito).toBe(30)
    expect(r.valores.remuneracaoFerias).toBe(300_000)
  })

  it('o terço constitucional é um terço — CF art. 7º, XVII', () => {
    // R$ 3.000,00 ÷ 3 = R$ 1.000,00
    expect(r.valores.terco).toBe(100_000)
  })

  it('sem abono declarado, não há venda de dias', () => {
    expect(r.valores.abono).toBe(0)
    expect(r.valores.diasDeAbono).toBe(0)
    expect(r.valores.diasGozados).toBe(30)
  })

  it('o INSS incide sobre a remuneração MAIS o terço', () => {
    // Base R$ 4.000,00 na tabela de 2026:
    //   1.621,00 × 7,5%   = 121,575
    //   1.281,84 × 9%     = 115,3656
    //   1.097,16 × 12%    = 131,6592
    //   soma = 368,5998 → 368,60
    expect(r.valores.inss).toBe(36_860)
  })
})

describe('CALC-004 · abono pecuniário — CLT art. 143 e 144', () => {
  const r = calcularFerias({ ...FERIAS_BASE, abonoPecuniario: true, diasGozados: 20 }, REF, registro)
  if (!r.ok) throw new Error('esperado sucesso')

  it('converte um terço do período: 10 dias de 30', () => {
    expect(r.valores.diasDeAbono).toBe(10)
    expect(r.valores.diasGozados).toBe(20)
  })

  it('o abono vale os dias correspondentes, com terço próprio', () => {
    // R$ 3.000,00 ÷ 30 × 10 = R$ 1.000,00 ; terço = R$ 333,33
    expect(r.valores.abono).toBe(100_000)
    expect(r.valores.tercoDoAbono).toBe(33_333)
  })

  it('o abono NÃO entra na base do INSS — a base cai junto com os dias gozados', () => {
    const semAbono = calcularFerias(FERIAS_BASE, REF, registro)
    if (!semAbono.ok) throw new Error('esperado sucesso')
    // Com abono, a base tributável é só 20 dias + terço, não os 30.
    expect(r.valores.inss).toBeLessThan(semAbono.valores.inss)
  })

  it('a etapa do abono cita a norma que o exclui da remuneração', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo.startsWith('Abono pecuniário'))
    expect(etapa?.fundamento?.dispositivo).toContain('143')
  })
})

describe('CALC-004 · adiantamento do 13º nas férias — Lei 4.749/1965, art. 2º, § 2º', () => {
  const r = calcularFerias({ ...FERIAS_BASE, adiantar13: true }, REF, registro)
  if (!r.ok) throw new Error('esperado sucesso')

  it('adianta metade do salário', () => {
    expect(r.valores.adiantamento13).toBe(150_000)
  })

  it('o adiantamento não altera o desconto — é adiantamento, não remuneração do mês', () => {
    const sem = calcularFerias(FERIAS_BASE, REF, registro)
    if (!sem.ok) throw new Error('esperado sucesso')
    expect(r.valores.inss).toBe(sem.valores.inss)
    expect(r.valores.irrf).toBe(sem.valores.irrf)
  })

  it('mas aumenta o líquido no valor cheio', () => {
    const sem = calcularFerias(FERIAS_BASE, REF, registro)
    if (!sem.ok) throw new Error('esperado sucesso')
    expect(r.valores.liquido).toBe(sem.valores.liquido + 150_000)
  })
})

describe('CALC-004 · proporcionais', () => {
  it('seis meses dão quinze dias de direito', () => {
    const r = calcularFerias(
      { ...FERIAS_BASE, tipo: 'proporcionais', mesesTrabalhados: 6, diasGozados: 30 },
      REF,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.diasDeDireito).toBe(15)
    // Pedir 30 dias não cria direito: fica limitado ao que existe.
    expect(r.valores.diasGozados).toBe(15)
    expect(r.valores.remuneracaoFerias).toBe(150_000)
  })

  it('meses fora do intervalo são recusados', () => {
    const r = calcularFerias(
      { ...FERIAS_BASE, tipo: 'proporcionais', mesesTrabalhados: 13 },
      REF,
      registro,
    )
    expect(r.ok).toBe(false)
  })
})

/**
 * O teste que impede a troca mais cara desta família de calculadoras.
 */
describe('CALC-004 · férias GOZADAS e INDENIZADAS têm regra oposta de INSS', () => {
  it('nas gozadas o terço integra o salário-de-contribuição — RPS art. 214, § 4º', () => {
    const r = calcularFerias(FERIAS_BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.inss).toBeGreaterThan(0)
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('integra o salário-de-contribuição'))
    expect(etapa?.fundamento?.dispositivo).toContain('214')
  })

  it('nas indenizadas da rescisão a lei as exclui expressamente', () => {
    const r = calcularRescisao(
      {
        admissao: '2020-03-10' as DataISO,
        desligamento: '2026-07-15' as DataISO,
        salario: centavos(300_000),
        modalidade: 'sem-justa-causa',
      regime: 'clt',
        avisoPrevio: 'indenizado',
        temFeriasVencidas: true,
        saldoFgtsInformado: centavos(0),
        dependentes: 0,
      },
      REF,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.traco.etapas.map((e) => e.rotulo)).toContain(
      'Férias indenizadas e multa do FGTS — sem contribuição previdenciária',
    )
  })
})

// ---------------------------------------------------------------------------
// CALC-005 — 13º salário
// ---------------------------------------------------------------------------

const DECIMO_BASE = {
  salario: centavos(300_000),
  mesesTrabalhados: 12,
  parcela: 'total' as const,
  mediaVariaveis: centavos(0),
  dependentes: 0,
}

describe('CALC-005 · 13º integral, salário R$ 3.000,00', () => {
  const r = calcularDecimoTerceiro(DECIMO_BASE, REF, registro)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  it('doze avos equivalem ao salário — Lei 4.090/1962', () => {
    expect(r.valores.totalBruto).toBe(300_000)
  })

  it('a 1ª parcela é metade do salário — Lei 4.749/1965, art. 2º', () => {
    expect(r.valores.primeiraParcela).toBe(150_000)
  })

  it('o INSS é apurado em separado — RPS art. 216, § 1º', () => {
    // R$ 3.000,00 na tabela de 2026:
    //   1.621,00 × 7,5% = 121,575
    //   1.281,84 × 9%   = 115,3656
    //     97,16 × 12%   =  11,6592
    //   soma = 248,5998 → 248,60
    expect(r.valores.inss).toBe(24_860)
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('apurada em separado'))
    expect(etapa?.fundamento?.dispositivo).toContain('216')
  })
})

describe('CALC-005 · as três parcelas somam o mesmo total', () => {
  const total = calcularDecimoTerceiro(DECIMO_BASE, REF, registro)
  const primeira = calcularDecimoTerceiro({ ...DECIMO_BASE, parcela: 'primeira' }, REF, registro)
  const segunda = calcularDecimoTerceiro({ ...DECIMO_BASE, parcela: 'segunda' }, REF, registro)
  if (!total.ok || !primeira.ok || !segunda.ok) throw new Error('esperado sucesso')

  it('1ª + 2ª = total líquido', () => {
    expect(primeira.valores.aReceber + segunda.valores.aReceber).toBe(total.valores.aReceber)
  })

  it('a 1ª parcela não sofre desconto', () => {
    expect(primeira.valores.aReceber).toBe(150_000)
  })

  it('a 2ª parcela absorve os dois descontos, sobre o total', () => {
    const descontos = total.valores.inss + total.valores.irrf
    expect(segunda.valores.aReceber).toBe(300_000 - 150_000 - descontos)
  })
})

describe('CALC-005 · proporcionalidade e limite do adiantamento', () => {
  it('sete avos dão sete doze avos do salário', () => {
    const r = calcularDecimoTerceiro({ ...DECIMO_BASE, mesesTrabalhados: 7 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.totalBruto).toBe(175_000)
  })

  /**
   * A lei diz "metade do salário", não "metade do 13º". Com poucos avos, isso
   * ultrapassaria o devido — e adiantar mais do que se tem a receber não é
   * adiantamento, é dívida.
   */
  it('com um avo, o adiantamento é limitado ao 13º devido', () => {
    const r = calcularDecimoTerceiro({ ...DECIMO_BASE, mesesTrabalhados: 1 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.totalBruto).toBe(25_000)
    expect(r.valores.primeiraParcela).toBe(25_000)
    const etapa = r.traco.etapas.find((e) => e.rotulo.startsWith('1ª parcela'))
    expect(etapa?.formula).toContain('limitada ao 13º devido')
  })

  it('meses fora do intervalo são recusados', () => {
    expect(calcularDecimoTerceiro({ ...DECIMO_BASE, mesesTrabalhados: 0 }, REF, registro).ok).toBe(false)
    expect(calcularDecimoTerceiro({ ...DECIMO_BASE, mesesTrabalhados: 13 }, REF, registro).ok).toBe(false)
  })

  it('salário zerado mantém o estado pendente', () => {
    expect(calcularDecimoTerceiro({ ...DECIMO_BASE, salario: centavos(0) }, REF, registro).ok).toBe(false)
  })
})

describe('CALC-005 · a média de variáveis integra a base — Súmula 45 do TST', () => {
  const r = calcularDecimoTerceiro({ ...DECIMO_BASE, mediaVariaveis: centavos(50_000) }, REF, registro)
  if (!r.ok) throw new Error('esperado sucesso')

  it('soma à base antes da proporcionalidade', () => {
    expect(r.valores.totalBruto).toBe(350_000)
  })

  it('a etapa cita a súmula', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Base do 13º')
    expect(etapa?.fundamento?.norma).toContain('Súmula 45')
  })
})

describe('CALC-005 · o §3º do Art. 3º-A alcança o 13º', () => {
  it('a redução do imposto aparece no traço, e zera o imposto na faixa alcançada', () => {
    // Salário de R$ 4.500,00: a tabela sozinha cobraria, a redução zera.
    const r = calcularDecimoTerceiro({ ...DECIMO_BASE, salario: centavos(450_000) }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.irrf).toBe(0)
    const citou = r.traco.etapas.some((e) => e.parametro?.parametroId.startsWith('irrf-reducao'))
    expect(citou, 'a memória precisa mostrar a redução, não apenas o imposto zerado').toBe(true)
  })
})

describe('CALC-005 · C-M1 · não existe cálculo sem memória', () => {
  it('toda etapa tem rótulo e fórmula com valores substituídos', () => {
    const r = calcularDecimoTerceiro(DECIMO_BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.traco.etapas.length).toBeGreaterThan(5)
    for (const etapa of r.traco.etapas) {
      expect(etapa.rotulo.length).toBeGreaterThan(0)
      expect(etapa.formula.length).toBeGreaterThan(0)
    }
  })
})
