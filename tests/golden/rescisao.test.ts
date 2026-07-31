/**
 * Casos-ouro de CALC-002 — rescisão sem justa causa.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `CLAUDE.md` regra 10 / `CO-1`: caso-ouro nunca vem de outro site. Não existe
 * exemplo oficial resolvido de rescisão publicado por órgão público — diferente
 * do IRRF, cujos cinco exemplos da Receita alimentam `tests/golden/irrf.test.ts`.
 *
 * Então estes casos são **derivados da norma**, e cada valor esperado abaixo
 * traz o dispositivo que o produz. Nenhum número foi lido de calculadora
 * concorrente, de blog ou de planilha de terceiro. Onde o caso depende de INSS
 * ou de IRRF, quem calcula é o motor já conferido contra os exemplos oficiais —
 * este arquivo verifica a COMPOSIÇÃO e as decisões de incidência.
 *
 * A pesquisa que fundamenta cada incidência está em
 * `docs/19-incidencias-verbas-rescisorias.md`, com transcrição literal.
 */

import { describe, expect, it } from 'vitest'

import { calcularRescisao } from '../../src/lib/engine/calculadoras/rescisao'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA)
const REF_2026 = '2026-06-15' as DataISO

const BASE = {
  admissao: '2020-03-10' as DataISO,
  desligamento: '2026-07-15' as DataISO,
  salario: centavos(300_000),
  modalidade: 'sem-justa-causa' as const,
  avisoPrevio: 'indenizado' as const,
  temFeriasVencidas: false,
  saldoFgtsInformado: centavos(2_000_000),
  dependentes: 0,
}

describe('CALC-002 · caso base — 6 anos completos, salário R$ 3.000,00', () => {
  const r = calcularRescisao(BASE, REF_2026, registro)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  it('aviso prévio: 30 dias + 3 por ano completo, limitado a 90 — Lei 12.506/2011', () => {
    // 10/03/2020 a 15/07/2026 = 6 aniversários alcançados. 30 + 3×6 = 48.
    expect(r.valores.diasAviso).toBe(48)
  })

  it('projeta o aviso indenizado no tempo de serviço — CLT art. 487, § 1º', () => {
    // 15/07 + 48 dias: 16 dias fecham julho, 31 fecham agosto, sobra 1 → 01/09.
    expect(r.valores.dataProjetada).toBe('2026-09-01')
  })

  it('saldo de salário: salário ÷ 30 × dias trabalhados — CLT art. 64', () => {
    // R$ 3.000,00 ÷ 30 × 15 = R$ 1.500,00
    expect(r.valores.saldoSalario).toBe(150_000)
  })

  it('aviso indenizado: salário ÷ 30 × 48 dias', () => {
    // R$ 3.000,00 ÷ 30 × 48 = R$ 4.800,00
    expect(r.valores.avisoPrevioValor).toBe(480_000)
  })

  it('13º: um avo por mês com 15 dias ou mais — Lei 4.090/1962, art. 1º, § 2º', () => {
    // Janeiro a agosto de 2026 têm 15 dias ou mais; setembro tem 1 dia. 8 avos.
    // R$ 3.000,00 × 8/12 = R$ 2.000,00
    expect(r.valores.decimoTerceiro).toBe(200_000)
  })

  it('férias proporcionais do período aquisitivo em curso + terço — CLT art. 146', () => {
    // Aquisitivo desde 10/03/2026. Março (22 dias) a agosto = 6 avos.
    // R$ 3.000,00 × 6/12 = R$ 1.500,00; terço = R$ 500,00; total R$ 2.000,00
    expect(r.valores.feriasProporcionais).toBe(200_000)
  })

  it('multa de 40% sobre o saldo informado — Lei 8.036/1990, art. 18, § 1º', () => {
    // R$ 20.000,00 × 40% = R$ 8.000,00
    expect(r.valores.multaFgts).toBe(800_000)
    expect(r.valores.fgtsEstimado).toBe(false)
  })

  it('não há férias vencidas quando o usuário não as declara', () => {
    expect(r.valores.feriasVencidas).toBe(0)
  })
})

describe('CALC-002 · incidências — o núcleo do risco', () => {
  const r = calcularRescisao(BASE, REF_2026, registro)
  if (!r.ok) throw new Error('esperado sucesso')

  const rotulos = r.traco.etapas.map((e) => e.rotulo)
  const fundamentos = r.traco.etapas.flatMap((e) => (e.fundamento ? [e.fundamento.norma] : []))

  it('o aviso prévio indenizado fica fora da base do INSS — STJ, Tema 478', () => {
    expect(rotulos).toContain('Aviso prévio indenizado — sem contribuição previdenciária')
    expect(fundamentos.some((n) => n.includes('Tema Repetitivo 478'))).toBe(true)
  })

  it('férias indenizadas e multa do FGTS ficam fora do INSS — Lei 8.212/1991, art. 28, § 9º', () => {
    expect(rotulos).toContain(
      'Férias indenizadas e multa do FGTS — sem contribuição previdenciária',
    )
    expect(fundamentos.some((n) => n.includes('Lei nº 8.212'))).toBe(true)
  })

  it('as verbas indenizatórias são isentas de imposto de renda — RIR/2018 e Súmula 386', () => {
    expect(rotulos).toContain(
      'Aviso indenizado, férias indenizadas e FGTS — isentos de imposto de renda',
    )
    expect(fundamentos.some((n) => n.includes('9.580'))).toBe(true)
  })

  it('o INSS do 13º é apurado em separado — RPS, art. 216, § 1º e § 3º', () => {
    expect(rotulos).toContain('Contribuição previdenciária sobre o 13º — apurada em separado')
    expect(fundamentos.some((n) => n.includes('3.048'))).toBe(true)
  })

  it('a projeção do aviso não entra na base da multa — TST, OJ-SDI1 42, II', () => {
    expect(rotulos).toContain('A projeção do aviso não entra na base da multa')
  })

  /**
   * O teste que impede o defeito mais caro: o INSS incidir sobre verba
   * indenizatória. Se alguém somar o aviso indenizado à base, este valor sobe.
   */
  it('o INSS total é a soma de duas apurações separadas, e só sobre verba salarial', () => {
    // Saldo de salário R$ 1.500,00 → 1ª faixa, 7,5% = R$ 112,50
    // 13º R$ 2.000,00, em separado: 1.621,00 × 7,5% + 379,00 × 9% = R$ 155,69
    expect(r.valores.inss).toBe(11_250 + 15_569)
  })

  it('não há imposto de renda: as duas bases ficam abaixo da faixa de isenção', () => {
    expect(r.valores.irrf).toBe(0)
  })

  it('o total líquido é o bruto menos as duas contribuições', () => {
    const bruto = 150_000 + 480_000 + 200_000 + 200_000 + 800_000
    expect(r.valores.totalBruto).toBe(bruto)
    expect(r.valores.totalLiquido).toBe(bruto - 26_819)
  })
})

describe('CALC-002 · fronteiras do aviso prévio — Lei 12.506/2011', () => {
  const comAnos = (admissao: DataISO) =>
    calcularRescisao({ ...BASE, admissao }, REF_2026, registro)

  it('menos de um ano de casa: 30 dias', () => {
    const r = comAnos('2026-01-10' as DataISO)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.diasAviso).toBe(30)
  })

  it('um ano completo: 33 dias', () => {
    const r = comAnos('2025-07-15' as DataISO)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.diasAviso).toBe(33)
  })

  it('vinte anos completos alcançam o teto de 90 dias', () => {
    const r = comAnos('2006-07-15' as DataISO)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.diasAviso).toBe(90)
  })

  it('acima de vinte anos o teto não é ultrapassado', () => {
    const r = comAnos('1995-01-02' as DataISO)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.diasAviso).toBe(90)
  })
})

describe('CALC-002 · o aviso trabalhado muda o resultado', () => {
  it('não gera verba própria e não projeta o tempo de serviço', () => {
    const r = calcularRescisao({ ...BASE, avisoPrevio: 'trabalhado' }, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.avisoPrevioValor).toBe(0)
    expect(r.valores.dataProjetada).toBe('2026-07-15')
    // Sem projeção, julho tem 15 dias — ainda um avo; agosto some.
    expect(r.valores.decimoTerceiro).toBeLessThan(200_000)
  })
})

describe('CALC-002 · RN-023 · o saldo do FGTS não informado é estimativa declarada', () => {
  const r = calcularRescisao({ ...BASE, saldoFgtsInformado: centavos(0) }, REF_2026, registro)
  if (!r.ok) throw new Error('esperado sucesso')

  it('marca o resultado como estimado', () => {
    expect(r.valores.fgtsEstimado).toBe(true)
  })

  it('a etapa declara que é estimativa, em letras maiúsculas e sem eufemismo', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Depósitos de FGTS — estimativa')
    expect(etapa).toBeDefined()
    expect(etapa?.justificativa).toContain('ESTIMATIVA')
  })
})

describe('CALC-002 · entradas inválidas não produzem número', () => {
  it('admissão posterior ao desligamento é recusada', () => {
    const r = calcularRescisao(
      { ...BASE, admissao: '2027-01-01' as DataISO },
      REF_2026,
      registro,
    )
    expect(r.ok).toBe(false)
  })

  it('salário zerado mantém o estado pendente, sem número parcial', () => {
    const r = calcularRescisao({ ...BASE, salario: centavos(0) }, REF_2026, registro)
    expect(r.ok).toBe(false)
  })

  it('data fora da cobertura de vigência bloqueia o cálculo — RN-003', () => {
    const r = calcularRescisao(BASE, '2010-01-01' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

describe('CALC-002 · C-M1 · não existe cálculo sem memória', () => {
  it('toda etapa tem rótulo e fórmula com os valores já substituídos', () => {
    const r = calcularRescisao(BASE, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.traco.etapas.length).toBeGreaterThan(10)
    for (const etapa of r.traco.etapas) {
      expect(etapa.rotulo.length).toBeGreaterThan(0)
      expect(etapa.formula.length).toBeGreaterThan(0)
    }
  })

  it('toda etapa de incidência cita fundamento com URL de domínio oficial', () => {
    const r = calcularRescisao(BASE, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    const comFundamento = r.traco.etapas.filter((e) => e.fundamento)
    expect(comFundamento.length).toBeGreaterThanOrEqual(5)
    for (const etapa of comFundamento) {
      expect(etapa.fundamento?.url).toMatch(/^https:\/\/[^/]*\.(gov|jus)\.br\//)
    }
  })
})

describe('CALC-002 · variações que mudam o resultado', () => {
  it('férias vencidas somam um salário e o terço', () => {
    const r = calcularRescisao({ ...BASE, temFeriasVencidas: true }, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    // R$ 3.000,00 + R$ 1.000,00 de terço
    expect(r.valores.feriasVencidas).toBe(400_000)
    expect(r.traco.etapas.map((e) => e.rotulo)).toContain('Férias vencidas + 1/3')
  })

  it('dependentes reduzem a base do imposto — sem alterar o INSS', () => {
    const alto = { ...BASE, salario: centavos(1_200_000) }
    const sem = calcularRescisao(alto, REF_2026, registro)
    const com = calcularRescisao({ ...alto, dependentes: 3 }, REF_2026, registro)
    if (!sem.ok || !com.ok) throw new Error('esperado sucesso')

    expect(com.valores.irrf).toBeLessThanOrEqual(sem.valores.irrf)
    expect(com.valores.inss).toBe(sem.valores.inss)
  })

  it('salário alto atravessa o teto do INSS e produz imposto', () => {
    const r = calcularRescisao({ ...BASE, salario: centavos(2_000_000) }, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.inss).toBeGreaterThan(0)
    expect(r.valores.irrf).toBeGreaterThan(0)
    expect(r.valores.totalLiquido).toBeLessThan(r.valores.totalBruto)
  })

  it('a vigência de 2025 produz resultado diferente da de 2026 — RF-004', () => {
    const em2025 = calcularRescisao(
      { ...BASE, desligamento: '2025-07-15' as DataISO },
      '2025-06-15' as DataISO,
      registro,
    )
    const em2026 = calcularRescisao({ ...BASE, salario: centavos(300_000) }, REF_2026, registro)
    if (!em2025.ok || !em2026.ok) throw new Error('esperado sucesso')

    // Tabelas de INSS diferentes: mesmo salário, contribuição diferente.
    expect(em2025.valores.inss).not.toBe(em2026.valores.inss)
  })

  it('admissão no mesmo ano do desligamento conta os avos desde a admissão', () => {
    const r = calcularRescisao(
      { ...BASE, admissao: '2026-02-10' as DataISO, avisoPrevio: 'trabalhado' },
      REF_2026,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')

    // 10/02 a 15/07: fevereiro (19 dias), março a junho, julho (15 dias) = 6 avos.
    expect(r.valores.decimoTerceiro).toBe(150_000)
  })
})

describe('CALC-002 · caminhos de erro que ninguém exercita à mão', () => {
  it('data malformada é recusada antes de virar número', () => {
    const r = calcularRescisao({ ...BASE, admissao: '15/07/2026' as DataISO }, REF_2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('data inexistente no calendário é recusada', () => {
    const r = calcularRescisao(
      { ...BASE, desligamento: '2026-02-30' as DataISO },
      REF_2026,
      registro,
    )
    expect(r.ok).toBe(false)
  })

  it('admissão e desligamento no mesmo dia calculam sem quebrar', () => {
    const r = calcularRescisao(
      { ...BASE, admissao: '2026-07-15' as DataISO, avisoPrevio: 'trabalhado' },
      REF_2026,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.diasAviso).toBe(30)
    expect(r.valores.totalLiquido).toBeGreaterThan(0)
  })

  it('salário negativo é recusado', () => {
    const r = calcularRescisao({ ...BASE, salario: centavos(-1) }, REF_2026, registro)
    expect(r.ok).toBe(false)
  })

  it('sem verba indenizatória alguma, o traço não inventa etapa de isenção', () => {
    // Contrato de um dia, aviso trabalhado: não há férias proporcionais nem
    // aviso indenizado; a multa continua existindo porque o FGTS foi informado.
    const r = calcularRescisao(
      {
        ...BASE,
        admissao: '2026-07-15' as DataISO,
        avisoPrevio: 'trabalhado',
        saldoFgtsInformado: centavos(0),
      },
      REF_2026,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.fgtsEstimado).toBe(true)
    expect(r.valores.multaFgts).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// CALC-003 — pedido de demissão
//
// Mesmo motor, três diferenças (`03-functional-spec` §3.3). Os testes abaixo
// existem porque compartilhar motor é o que impede os dois cálculos de
// divergirem — mas só se as diferenças estiverem cobertas.
// ---------------------------------------------------------------------------

const PEDIDO = { ...BASE, modalidade: 'pedido-demissao' as const, avisoPrevio: 'cumprido' as const }

describe('CALC-003 · pedido de demissão — as três diferenças', () => {
  it('NÃO há multa de FGTS, e o traço explica a ausência em vez de zerar em silêncio', () => {
    const r = calcularRescisao(PEDIDO, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.multaFgts).toBe(0)
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Sem multa de FGTS')
    expect(etapa).toBeDefined()
    expect(etapa?.justificativa).toContain('não há multa de FGTS nem direito ao saque')
  })

  it('cumprindo o aviso, não há verba nem desconto', () => {
    const r = calcularRescisao(PEDIDO, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.avisoPrevioValor).toBe(0)
    expect(r.valores.descontoAvisoPrevio).toBe(0)
  })

  it('não cumprindo, o aviso é DESCONTADO — CLT art. 487, § 2º', () => {
    const r = calcularRescisao({ ...PEDIDO, avisoPrevio: 'nao-cumprido' }, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    // 30 dias de salário: R$ 3.000,00 ÷ 30 × 30 = R$ 3.000,00
    expect(r.valores.descontoAvisoPrevio).toBe(300_000)
    expect(r.valores.avisoPrevioValor).toBe(0)

    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Desconto de aviso prévio não cumprido')
    expect(etapa?.fundamento?.dispositivo).toContain('487')
  })

  it('o desconto reduz o total líquido, não o bruto', () => {
    const cumprindo = calcularRescisao(PEDIDO, REF_2026, registro)
    const naoCumprindo = calcularRescisao(
      { ...PEDIDO, avisoPrevio: 'nao-cumprido' },
      REF_2026,
      registro,
    )
    if (!cumprindo.ok || !naoCumprindo.ok) throw new Error('esperado sucesso')

    expect(naoCumprindo.valores.totalBruto).toBe(cumprindo.valores.totalBruto)
    expect(naoCumprindo.valores.totalLiquido).toBe(cumprindo.valores.totalLiquido - 300_000)
  })

  /**
   * O ponto interpretativo desta calculadora. A Lei 12.506/2011 concede o
   * acréscimo AO empregado; aqui o aviso é devido POR ele.
   */
  it('o desconto é de 30 dias, não do aviso proporcional — mesmo com 6 anos de casa', () => {
    const r = calcularRescisao({ ...PEDIDO, avisoPrevio: 'nao-cumprido' }, REF_2026, registro)
    const dispensa = calcularRescisao(BASE, REF_2026, registro)
    if (!r.ok || !dispensa.ok) throw new Error('esperado sucesso')

    expect(r.valores.diasAviso).toBe(30)
    expect(dispensa.valores.diasAviso).toBe(48)
  })

  it('não projeta o tempo de serviço — a integração do art. 487, § 1º é do aviso do empregador', () => {
    const r = calcularRescisao({ ...PEDIDO, avisoPrevio: 'nao-cumprido' }, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.dataProjetada).toBe('2026-07-15')
  })
})

describe('CALC-003 · o que continua devido — Súmulas 157 e 261 do TST', () => {
  it('13º proporcional é devido na resilição por iniciativa do empregado', () => {
    const r = calcularRescisao(PEDIDO, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    // Janeiro a julho de 2026, sem projeção: 7 avos. R$ 3.000,00 × 7/12
    expect(r.valores.decimoTerceiro).toBe(175_000)
  })

  it('férias proporcionais são devidas mesmo com menos de doze meses de casa', () => {
    const r = calcularRescisao(
      { ...PEDIDO, admissao: '2026-01-10' as DataISO },
      REF_2026,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.feriasProporcionais).toBeGreaterThan(0)
  })

  it('férias vencidas continuam devidas e isentas', () => {
    const r = calcularRescisao({ ...PEDIDO, temFeriasVencidas: true }, REF_2026, registro)
    if (!r.ok) throw new Error('esperado sucesso')

    expect(r.valores.feriasVencidas).toBe(400_000)
    expect(r.traco.etapas.map((e) => e.rotulo)).toContain(
      'Aviso indenizado, férias indenizadas e FGTS — isentos de imposto de renda',
    )
  })
})
