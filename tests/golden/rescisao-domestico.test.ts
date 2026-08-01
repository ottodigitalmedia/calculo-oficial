/**
 * Casos-ouro de CALC-012 — rescisão do empregado doméstico.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Lei Complementar nº 150/2015, lida no texto do Planalto:
 *
 *   Art. 22 — "o empregador doméstico depositará a importância de 3,2% [...]
 *   destinada ao pagamento da indenização compensatória da perda do emprego,
 *   sem justa causa ou por culpa do empregador, NÃO SE APLICANDO ao empregado
 *   doméstico o disposto nos §§ 1º a 3º do art. 18 da Lei nº 8.036".
 *
 *   Art. 23, § 1º e § 2º — 30 dias, mais 3 por ano, até 90.
 *
 * Como em CALC-008, os casos são escritos por **comparação com o regime
 * celetista rodado com a mesma entrada**. É a conferência mais forte disponível:
 * ela afirma o que a lei especial muda e, no mesmo movimento, tudo o que ela
 * deixa igual.
 */

import { describe, expect, it } from 'vitest'

import { calcularRescisao } from '../../src/lib/engine/calculadoras/rescisao'
import { centavos } from '../../src/lib/engine/types'
import { DOMESTICO } from '../../src/lib/params/data/domestico'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA, DOMESTICO)
const REF = '2026-06-15' as DataISO

const BASE = {
  admissao: '2016-03-01' as DataISO,
  desligamento: '2026-06-30' as DataISO,
  salario: centavos(300_000),
  avisoPrevio: 'indenizado',
  temFeriasVencidas: false,
  saldoFgtsInformado: centavos(0),
  dependentes: 0,
} as const

const domestico = calcularRescisao(
  { ...BASE, regime: 'domestico', modalidade: 'sem-justa-causa' },
  REF,
  registro,
)
const celetista = calcularRescisao(
  { ...BASE, regime: 'clt', modalidade: 'sem-justa-causa' },
  REF,
  registro,
)
if (!domestico.ok || !celetista.ok) throw new Error('esperado sucesso nos dois regimes')

/**
 * O QUE A LEI ESPECIAL MUDA — e é só isto.
 */
describe('CALC-012 · não existe multa de 40% no doméstico', () => {
  it('a multa é zero, e não uma multa menor', () => {
    expect(domestico.valores.multaFgts).toBe(0)
    expect(domestico.valores.multaBp).toBe(0)
  })

  it('no mesmo caso, o celetista recebe multa de 40%', () => {
    expect(celetista.valores.multaBp).toBe(4_000)
    expect(celetista.valores.multaFgts).toBeGreaterThan(0)
  })

  it('em compensação, o doméstico tem o fundo de 3,2% liberado', () => {
    expect(domestico.valores.indenizacaoLiberada).toBe(true)
    expect(domestico.valores.indenizacaoCompensatoria).toBeGreaterThan(0)
    expect(celetista.valores.indenizacaoCompensatoria).toBe(0)
  })

  /**
   * O legislador dimensionou o fundo para chegar perto da multa: 3,2% é
   * exatamente 40% de 8%. O teste registra a coincidência **sem** usá-la como
   * fórmula — o motor calcula os 3,2% sobre a remuneração acumulada, e não
   * sobre o saldo do FGTS, porque as duas contas têm correção própria.
   */
  it('o fundo de 3,2% chega perto da multa de 40%, por desenho da lei', () => {
    const diferenca = Math.abs(
      domestico.valores.indenizacaoCompensatoria - celetista.valores.multaFgts,
    )
    expect(diferenca).toBeLessThanOrEqual(100)
  })

  it('a etapa da indenização cita a LC 150, art. 22', () => {
    const etapa = domestico.traco.etapas.find((e) => e.rotulo.startsWith('Indenização compensatória'))
    expect(etapa?.parametro?.norma).toContain('150')
    expect(etapa?.parametro?.dispositivo).toContain('22')
  })
})

describe('CALC-012 · o § 1º decide quem movimenta o fundo', () => {
  const pedido = calcularRescisao(
    { ...BASE, regime: 'domestico', modalidade: 'pedido-demissao', avisoPrevio: 'cumprido' },
    REF,
    registro,
  )
  if (!pedido.ok) throw new Error('esperado sucesso')

  it('no pedido de demissão o fundo não é liberado ao trabalhador', () => {
    expect(pedido.valores.indenizacaoLiberada).toBe(false)
    expect(pedido.valores.indenizacaoCompensatoria).toBe(0)
  })

  it('a memória explica que o empregador é quem movimenta', () => {
    const etapa = pedido.traco.etapas.find((e) => e.rotulo.startsWith('Indenização compensatória'))
    expect(etapa?.justificativa).toContain('quem o movimenta é o empregador')
  })
})

/**
 * O inverso do teste acima: tudo o que a lei especial NÃO muda.
 */
describe('CALC-012 · as verbas base são idênticas às da CLT', () => {
  it('saldo, 13º e férias não mudam com o regime', () => {
    expect(domestico.valores.saldoSalario).toBe(celetista.valores.saldoSalario)
    expect(domestico.valores.decimoTerceiro).toBe(celetista.valores.decimoTerceiro)
    expect(domestico.valores.feriasProporcionais).toBe(celetista.valores.feriasProporcionais)
  })

  it('o aviso prévio proporcional dá os mesmos dias e o mesmo valor', () => {
    expect(domestico.valores.diasAviso).toBe(celetista.valores.diasAviso)
    expect(domestico.valores.diasAviso).toBe(60)
    expect(domestico.valores.avisoPrevioValor).toBe(celetista.valores.avisoPrevioValor)
  })

  it('a projeção do aviso indenizado é a mesma', () => {
    expect(domestico.valores.dataProjetada).toBe(celetista.valores.dataProjetada)
  })

  it('as incidências de INSS e IRRF são as mesmas', () => {
    expect(domestico.valores.inss).toBe(celetista.valores.inss)
    expect(domestico.valores.irrf).toBe(celetista.valores.irrf)
  })
})

/**
 * NÚMEROS IGUAIS, FUNDAMENTOS DISTINTOS.
 *
 * É o ponto que justifica os parâmetros duplicados: a memória de uma rescisão
 * doméstica não pode citar a Lei nº 12.506/2011, que não rege aquele contrato.
 */
describe('CALC-012 · o aviso prévio cita a LC 150, não a Lei nº 12.506', () => {
  it('a etapa de dias cita a lei complementar', () => {
    const etapa = domestico.traco.etapas.find((e) => e.rotulo === 'Dias de aviso prévio')
    expect(etapa?.parametro?.norma).toContain('Complementar nº 150')
    expect(etapa?.parametro?.norma).not.toContain('12.506')
  })

  it('no regime celetista, a mesma etapa cita a Lei nº 12.506', () => {
    const etapa = celetista.traco.etapas.find((e) => e.rotulo === 'Dias de aviso prévio')
    expect(etapa?.parametro?.norma).toContain('12.506')
  })

  it('as vigências aplicadas são as do regime doméstico', () => {
    expect(domestico.traco.vigenciasAplicadas).toContain('domestico-aviso-base-2015')
    expect(domestico.traco.vigenciasAplicadas).toContain('domestico-indenizacao-2015')
    expect(celetista.traco.vigenciasAplicadas).toContain('aviso-previo-base-2011')
  })
})

describe('CALC-012 · a data importa — a LC 150 é de 2015', () => {
  it('os parâmetros do doméstico não existem em 01/06/2015', () => {
    expect(registro.resolver('domestico-indenizacao-compensatoria', '2015-06-01' as DataISO).ok).toBe(
      false,
    )
  })

  it('e existem a partir de 02/06/2015, data da publicação', () => {
    const r = registro.resolver('domestico-indenizacao-compensatoria', '2015-06-02' as DataISO)
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.resolvida.vigencia.valor).toEqual({ tipo: 'percentual', aliquotaBp: 320 })
  })
})

describe('CALC-012 · o desconto do aviso não cumprido — art. 23, § 4º', () => {
  it('quem pede demissão sem cumprir aviso tem o desconto', () => {
    const r = calcularRescisao(
      { ...BASE, regime: 'domestico', modalidade: 'pedido-demissao', avisoPrevio: 'nao-cumprido' },
      REF,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.descontoAvisoPrevio).toBeGreaterThan(0)
    // O prazo devido POR ele é o base, sem o acréscimo proporcional.
    expect(r.valores.diasAviso).toBe(30)
  })
})
