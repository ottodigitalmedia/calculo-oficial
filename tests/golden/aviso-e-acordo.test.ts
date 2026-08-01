/**
 * Casos-ouro de CALC-010 (aviso prévio proporcional) e CALC-008 (rescisão por
 * acordo mútuo).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As duas normas trazem os números no próprio corpo, e foram lidas no texto do
 * Planalto:
 *
 *   Lei nº 12.506/2011, art. 1º e parágrafo único — 30 dias, mais 3 por ano,
 *   até 90.
 *
 *   CLT, art. 484-A (Lei nº 13.467/2017) — "I - por metade: a) o aviso prévio,
 *   se indenizado; e b) a indenização sobre o saldo do [FGTS] [...] II - na
 *   integralidade, as demais verbas trabalhistas. § 1º [...] limitada até 80%
 *   (oitenta por cento) do valor dos depósitos. § 2º [...] não autoriza o
 *   ingresso no Programa de Seguro-Desemprego."
 *
 * Os casos de CALC-008 são escritos, sempre que possível, como **comparação com
 * a dispensa sem justa causa** rodada com a mesma entrada. É conferência mais
 * forte que número tabelado: ela afirma exatamente o que a norma diz que muda —
 * e, por consequência, o que ela diz que NÃO muda.
 */

import { describe, expect, it } from 'vitest'

import {
  calcularAvisoPrevio,
  diasDeAvisoPrevio,
} from '../../src/lib/engine/calculadoras/aviso-previo'
import { calcularRescisao } from '../../src/lib/engine/calculadoras/rescisao'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA)
const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-010 — Aviso prévio proporcional
// ---------------------------------------------------------------------------

describe('CALC-010 · a tabela da Lei nº 12.506/2011, conferida a lápis', () => {
  /**
   * A regra inteira em cinco linhas. Se alguma delas mudar sem que a lei mude,
   * é defeito.
   */
  const casos = [
    { anos: 0, dias: 30 },
    { anos: 1, dias: 33 },
    { anos: 5, dias: 45 },
    { anos: 20, dias: 90 },
    { anos: 40, dias: 90 },
  ] as const

  for (const { anos, dias } of casos) {
    it(`${anos} ano(s) completo(s) dão ${dias} dias`, () => {
      expect(diasDeAvisoPrevio(anos, 30, 3, 90, 'empregador')).toBe(dias)
    })
  }

  it('o teto de 90 dias é alcançado exatamente com 20 anos de casa', () => {
    expect(diasDeAvisoPrevio(19, 30, 3, 90, 'empregador')).toBe(87)
    expect(diasDeAvisoPrevio(20, 30, 3, 90, 'empregador')).toBe(90)
  })

  it('quem pede demissão deve 30 dias, sem acréscimo nenhum', () => {
    expect(diasDeAvisoPrevio(20, 30, 3, 90, 'empregado')).toBe(30)
  })
})

const AVISO_BASE = {
  admissao: '2016-03-01' as DataISO,
  desligamento: '2026-06-30' as DataISO,
  salario: centavos(300_000),
  quemAvisa: 'empregador',
  indenizado: true,
  fracaoBp: basisPoints(10_000),
} as const

describe('CALC-010 · dez anos de casa, salário de R$ 3.000,00', () => {
  const r = calcularAvisoPrevio(AVISO_BASE, REF, registro)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  it('conta 10 anos completos e 60 dias de aviso', () => {
    expect(r.valores.anosCompletos).toBe(10)
    expect(r.valores.diasTotais).toBe(60)
    expect(r.valores.diasAcrescidos).toBe(30)
  })

  it('o valor é o salário-dia vezes os dias — R$ 100,00 × 60', () => {
    expect(r.valores.valorCheio).toBe(600_000)
    expect(r.valores.valorDevido).toBe(600_000)
  })

  it('o aviso indenizado projeta o contrato', () => {
    expect(r.valores.dataProjetada).toBe('2026-08-29')
  })

  it('a memória cita a lei e declara a leitura adotada', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Dias de aviso prévio')
    expect(etapa?.parametro?.norma).toContain('12.506')
    expect(etapa?.justificativa).toContain('primeiro ano completo')
    expect(etapa?.unidade).toBe('numero')
  })
})

describe('CALC-010 · aviso trabalhado não projeta', () => {
  it('a data projetada é a do próprio desligamento', () => {
    const r = calcularAvisoPrevio({ ...AVISO_BASE, indenizado: false }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.dataProjetada).toBe('2026-06-30')
  })
})

describe('CALC-010 · a fração reduz a verba, nunca os dias', () => {
  it('metade do aviso mantém os 60 dias e corta o valor ao meio', () => {
    const r = calcularAvisoPrevio({ ...AVISO_BASE, fracaoBp: basisPoints(5_000) }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.diasTotais).toBe(60)
    expect(r.valores.valorCheio).toBe(600_000)
    expect(r.valores.valorDevido).toBe(300_000)
    // E a projeção continua sobre o prazo INTEIRO — art. 487, § 1º.
    expect(r.valores.dataProjetada).toBe('2026-08-29')
  })
})

describe('CALC-010 · entradas inválidas', () => {
  it('datas ausentes ou invertidas não produzem resultado', () => {
    expect(calcularAvisoPrevio({ ...AVISO_BASE, admissao: '' as DataISO }, REF, registro).ok).toBe(false)
    expect(
      calcularAvisoPrevio(
        { ...AVISO_BASE, admissao: '2026-07-01' as DataISO, desligamento: '2026-06-30' as DataISO },
        REF,
        registro,
      ).ok,
    ).toBe(false)
  })

  it('salário ausente mantém o estado pendente', () => {
    expect(calcularAvisoPrevio({ ...AVISO_BASE, salario: centavos(0) }, REF, registro).ok).toBe(false)
  })

  it('data anterior à Lei nº 12.506/2011 bloqueia o cálculo', () => {
    const r = calcularAvisoPrevio(AVISO_BASE, '2011-10-12' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// CALC-008 — Rescisão por acordo mútuo
// ---------------------------------------------------------------------------

const RESCISAO_BASE = {
  regime: 'clt',
  admissao: '2016-03-01' as DataISO,
  desligamento: '2026-06-30' as DataISO,
  salario: centavos(300_000),
  avisoPrevio: 'indenizado',
  temFeriasVencidas: false,
  saldoFgtsInformado: centavos(2_000_000),
  dependentes: 0,
} as const

const acordo = calcularRescisao({ ...RESCISAO_BASE, modalidade: 'acordo-mutuo' }, REF, registro)
const dispensa = calcularRescisao(
  { ...RESCISAO_BASE, modalidade: 'sem-justa-causa' },
  REF,
  registro,
)
if (!acordo.ok || !dispensa.ok) throw new Error('esperado sucesso nas duas modalidades')

/**
 * O CONJUNTO DE TESTES QUE DÁ SENTIDO À CALCULADORA.
 *
 * O art. 484-A é curto e diz exatamente o que muda. Estes casos afirmam cada
 * item dele **por comparação com a dispensa**, com a mesma entrada — o que
 * também trava o inverso: nenhuma outra verba pode mudar.
 */
describe('CALC-008 · o que o art. 484-A muda, item por item', () => {
  it('I, "a" — o aviso indenizado sai pela metade', () => {
    expect(acordo.valores.avisoPrevioValor).toBe(dispensa.valores.avisoPrevioValor / 2)
    expect(acordo.valores.fracaoAvisoBp).toBe(5_000)
  })

  it('I, "b" — a multa do FGTS cai de 40% para 20%', () => {
    expect(dispensa.valores.multaBp).toBe(4_000)
    expect(acordo.valores.multaBp).toBe(2_000)
    expect(acordo.valores.multaFgts).toBe(dispensa.valores.multaFgts / 2)
    // R$ 20.000,00 × 20% = R$ 4.000,00.
    expect(acordo.valores.multaFgts).toBe(400_000)
  })

  it('§ 1º — o saque fica limitado a 80% dos depósitos', () => {
    expect(acordo.valores.limiteSaqueBp).toBe(8_000)
    expect(acordo.valores.saqueDisponivel).toBe(1_600_000)
    // Na dispensa o saque é integral.
    expect(dispensa.valores.limiteSaqueBp).toBe(10_000)
    expect(dispensa.valores.saqueDisponivel).toBe(2_000_000)
  })

  it('§ 2º — a vedação do seguro-desemprego é etapa da memória, com fundamento', () => {
    const etapa = acordo.traco.etapas.find((e) => e.rotulo === 'Sem seguro-desemprego')
    expect(etapa?.fundamento?.dispositivo).toContain('§ 2º')
    expect(dispensa.traco.etapas.find((e) => e.rotulo === 'Sem seguro-desemprego')).toBeUndefined()
  })
})

/**
 * O inciso II — "na integralidade, as demais verbas trabalhistas" — é o que
 * mais se erra na prática, porque a intuição manda reduzir tudo pela metade.
 */
describe('CALC-008 · II · as demais verbas NÃO mudam', () => {
  it('saldo de salário, 13º e férias são idênticos aos da dispensa', () => {
    expect(acordo.valores.saldoSalario).toBe(dispensa.valores.saldoSalario)
    expect(acordo.valores.decimoTerceiro).toBe(dispensa.valores.decimoTerceiro)
    expect(acordo.valores.feriasProporcionais).toBe(dispensa.valores.feriasProporcionais)
  })

  /**
   * A consequência de a norma reduzir a VERBA e não o PRAZO: o período do aviso
   * continua integrando o tempo de serviço pelo art. 487, § 1º, e por isso a
   * projeção é a mesma — e os avos também.
   */
  it('os dias de aviso e a projeção do contrato são os mesmos', () => {
    expect(acordo.valores.diasAviso).toBe(dispensa.valores.diasAviso)
    expect(acordo.valores.dataProjetada).toBe(dispensa.valores.dataProjetada)
  })

  it('o total do acordo é menor, e a diferença é só do aviso e da multa', () => {
    expect(acordo.valores.totalBruto).toBeLessThan(dispensa.valores.totalBruto)
    const diferenca = dispensa.valores.totalBruto - acordo.valores.totalBruto
    const esperada =
      dispensa.valores.avisoPrevioValor -
      acordo.valores.avisoPrevioValor +
      (dispensa.valores.multaFgts - acordo.valores.multaFgts)
    expect(diferenca).toBe(esperada)
  })
})

describe('CALC-008 · o aviso TRABALHADO não sofre redução', () => {
  it('não há verba de aviso quando ele é cumprido, nas duas modalidades', () => {
    const r = calcularRescisao(
      { ...RESCISAO_BASE, modalidade: 'acordo-mutuo', avisoPrevio: 'trabalhado' },
      REF,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    // Aviso trabalhado é salário do período, já recebido — nunca vira verba
    // rescisória, e por isso não há o que reduzir pela metade.
    expect(r.valores.avisoPrevioValor).toBe(0)
    expect(r.valores.dataProjetada).toBe('2026-06-30')
  })
})

describe('CALC-008 · a memória mostra as duas etapas do aviso', () => {
  it('registra o valor cheio e o valor devido, com o dispositivo', () => {
    const cheio = acordo.traco.etapas.find((e) => e.rotulo === 'Aviso prévio indenizado — cheio')
    const devido = acordo.traco.etapas.find(
      (e) => e.rotulo === 'Aviso prévio indenizado — devido no acordo',
    )
    expect(cheio?.resultado).toBe(dispensa.valores.avisoPrevioValor)
    expect(devido?.resultado).toBe(acordo.valores.avisoPrevioValor)
    expect(devido?.parametro?.dispositivo).toContain('484-A')
    expect(devido?.justificativa).toContain('não o PRAZO')
  })

  it('a fórmula da multa exibe o percentual que foi de fato aplicado', () => {
    const etapa = acordo.traco.etapas.find((e) => e.rotulo.startsWith('Multa do FGTS'))
    expect(etapa?.formula).toContain('20,00%')
    expect(etapa?.formula).not.toContain('40,00%')
  })

  it('as vigências aplicadas incluem as do acordo', () => {
    expect(acordo.traco.vigenciasAplicadas).toContain('aviso-previo-fracao-acordo-2017')
    expect(acordo.traco.vigenciasAplicadas).toContain('fgts-multa-acordo-2017')
    expect(acordo.traco.vigenciasAplicadas).toContain('fgts-saque-acordo-2017')
  })
})

/**
 * A vigência é conferida NO REGISTRO, não pela rescisão inteira.
 *
 * Rodar `calcularRescisao` numa data de 2017 também falha — mas falha porque as
 * tabelas de INSS e IRRF só cobrem 2025 e 2026. O teste passaria com a vigência
 * do acordo cadastrada na data errada, que é exatamente o que ele deveria pegar.
 * Um teste que passa pelo motivo errado é pior que teste ausente.
 */
describe('CALC-008 · o acordo não existia antes da Reforma Trabalhista', () => {
  const parametros = [
    'fgts-multa-acordo-mutuo',
    'aviso-previo-fracao-acordo',
    'fgts-saque-acordo-mutuo',
  ] as const

  for (const id of parametros) {
    it(`${id} não tem vigência em 10/11/2017`, () => {
      expect(registro.resolver(id, '2017-11-10' as DataISO).ok).toBe(false)
    })

    it(`${id} vige a partir de 11/11/2017`, () => {
      const r = registro.resolver(id, '2017-11-11' as DataISO)
      expect(r.ok).toBe(true)
      if (!r.ok) throw new Error('esperado sucesso')
      expect(r.resolvida.fonte.dispositivo).toContain('484-A')
    })
  }
})
