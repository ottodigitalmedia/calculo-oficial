/**
 * CASOS-OURO — CALC-076 Acordo mútuo ou dispensa sem justa causa.
 *
 * fonte_verificacao: CLT, art. 484-A, I, "a" e "b", § 1º e § 2º — os mesmos
 * dispositivos já verificados em CALC-008, cujos casos-ouro fixam os valores das
 * verbas. Aqui não se refixa nenhum deles.
 *
 * ## O QUE ESTE ARQUIVO COBRA, E POR QUE NÃO SÃO OS VALORES
 *
 * O comparador não tem aritmética de verba própria: ele chama `calcularRescisao`
 * duas vezes e `calcularSeguroDesemprego` uma. Refixar aqui os valores das
 * verbas criaria um SEGUNDO lugar para os mesmos números — a família de defeito
 * que este projeto persegue desde §7.41 —, e o dia em que uma tabela mudasse
 * dois arquivos teriam de mudar juntos.
 *
 * O que se cobra é o que só existe aqui:
 *
 *   1. **não divergência** — cada lado bate, ao centavo, com a calculadora
 *      publicada correspondente;
 *   2. **a composição** — três correntes somadas, sem recontar a multa;
 *   3. **a vedação do § 2º** — o acordo tem seguro-desemprego zero, sempre;
 *   4. **o vínculo curto** — não bloqueia a tela, vira resultado;
 *   5. **a memória** — as duas rescisões distinguíveis uma da outra.
 */

import { describe, expect, it } from 'vitest'

import {
  calcularAcordoOuDispensa,
  type EntradaAcordoOuDispensa,
} from '../../src/lib/engine/calculadoras/acordo-ou-dispensa'
import { calcularRescisao } from '../../src/lib/engine/calculadoras/rescisao'
import { calcularSeguroDesemprego } from '../../src/lib/engine/calculadoras/seguro-desemprego'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { SEGURO_DESEMPREGO } from '../../src/lib/params/data/seguro-desemprego'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA, SEGURO_DESEMPREGO)
const REF = '2026-06-15' as DataISO

const BASE: EntradaAcordoOuDispensa = {
  admissao: '2021-06-01' as DataISO,
  desligamento: '2026-06-15' as DataISO,
  salario: centavos(300_000),
  avisoPrevio: 'indenizado' as const,
  temFeriasVencidas: false,
  saldoFgtsInformado: centavos(0),
  dependentes: 0,
  solicitacaoSeguro: 'primeira' as const,
}

function comparar(over: Partial<EntradaAcordoOuDispensa> = {}) {
  const r = calcularAcordoOuDispensa({ ...BASE, ...over }, REF, registro)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

// ---------------------------------------------------------------------------
// 1 · não divergência — o motivo de o comparador não ter motor próprio
// ---------------------------------------------------------------------------

describe('CALC-076 · cada lado bate com a calculadora publicada', () => {
  const entradaRescisao = {
    admissao: BASE.admissao,
    desligamento: BASE.desligamento,
    salario: BASE.salario,
    regime: 'clt' as const,
    avisoPrevio: BASE.avisoPrevio,
    temFeriasVencidas: BASE.temFeriasVencidas,
    saldoFgtsInformado: BASE.saldoFgtsInformado,
    dependentes: BASE.dependentes,
  }

  it('o lado da dispensa é CALC-002, ao centavo', () => {
    const sozinha = calcularRescisao(
      { ...entradaRescisao, modalidade: 'sem-justa-causa' },
      REF,
      registro,
    )
    if (!sozinha.ok) throw new Error('esperado sucesso')

    const v = comparar().valores.dispensa
    expect(v.rescisaoLiquida).toBe(sozinha.valores.totalLiquido)
    expect(v.fgtsSacavel).toBe(sozinha.valores.saqueDisponivel)
  })

  it('o lado do acordo é CALC-008, ao centavo', () => {
    const sozinha = calcularRescisao(
      { ...entradaRescisao, modalidade: 'acordo-mutuo' },
      REF,
      registro,
    )
    if (!sozinha.ok) throw new Error('esperado sucesso')

    const v = comparar().valores.acordo
    expect(v.rescisaoLiquida).toBe(sozinha.valores.totalLiquido)
    expect(v.fgtsSacavel).toBe(sozinha.valores.saqueDisponivel)
  })

  it('o seguro-desemprego é CALC-009, ao centavo', () => {
    const sozinho = calcularSeguroDesemprego(
      {
        salarios: [BASE.salario, BASE.salario, BASE.salario],
        mesesTrabalhados: 36,
        solicitacao: 'primeira',
      },
      REF,
      registro,
    )
    if (!sozinho.ok) throw new Error('esperado sucesso')

    expect(comparar().valores.dispensa.seguroDesemprego).toBe(sozinho.valores.total)
  })
})

// ---------------------------------------------------------------------------
// 2 · a composição
// ---------------------------------------------------------------------------

describe('CALC-076 · o total soma três correntes e não reconta nenhuma', () => {
  const v = comparar().valores

  it('cada total é a soma das próprias parcelas', () => {
    expect(v.dispensa.total).toBe(
      v.dispensa.rescisaoLiquida + v.dispensa.fgtsSacavel + v.dispensa.seguroDesemprego,
    )
    expect(v.acordo.total).toBe(v.acordo.rescisaoLiquida + v.acordo.fgtsSacavel)
  })

  /**
   * A multa do FGTS entra em `rescisaoLiquida` como crédito. `fgtsSacavel` é
   * fração do saldo de DEPÓSITOS. Somá-las só é legítimo porque são conjuntos
   * disjuntos — e se um dia `saqueDisponivel` passasse a incluir a multa, este
   * caso é o que denunciaria a dupla contagem.
   */
  it('o FGTS sacável não contém a multa, que já está na rescisão', () => {
    const d = v.dispensa.detalhe
    expect(d.multaFgts).toBeGreaterThan(0)
    expect(d.saqueDisponivel).toBe(d.baseFgts)
    expect(d.saqueDisponivel).not.toBe(d.baseFgts + d.multaFgts)
  })

  it('a diferença é a soma das duas parcelas que a compõem', () => {
    expect(v.diferenca).toBe(v.reducaoNasVerbas + v.dispensa.seguroDesemprego)
    expect(v.diferenca).toBe(v.dispensa.total - v.acordo.total)
  })

  it('a dispensa nunca entrega menos que o acordo', () => {
    for (const salario of [162_100, 300_000, 800_000, 2_000_000]) {
      const r = comparar({ salario: centavos(salario) }).valores
      expect(r.dispensa.total, `${salario}`).toBeGreaterThanOrEqual(r.acordo.total)
      expect(r.diferenca, `${salario}`).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// 3 · a vedação do § 2º
// ---------------------------------------------------------------------------

describe('CALC-076 · art. 484-A, § 2º — o acordo não dá seguro-desemprego', () => {
  it('é zero em toda combinação, e não por arredondamento', () => {
    for (const solicitacaoSeguro of ['primeira', 'segunda', 'terceira-ou-mais'] as const) {
      for (const salario of [162_100, 300_000, 800_000]) {
        const r = comparar({ solicitacaoSeguro, salario: centavos(salario) }).valores
        expect(r.acordo.seguroDesemprego, `${solicitacaoSeguro}/${salario}`).toBe(0)
      }
    }
  })

  it('e o da dispensa é positivo nas mesmas entradas — a vedação é o que difere', () => {
    expect(comparar().valores.dispensa.seguroDesemprego).toBeGreaterThan(0)
  })
})

/**
 * O TETO INVERTE QUAL PARCELA PESA MAIS, E A TELA DEPENDE DISSO.
 *
 * A primeira versão da nota do resultado afirmava que o seguro-desemprego era
 * sempre a maior parte da diferença. É falso: o benefício tem teto e as reduções
 * do FGTS crescem com o salário. Estes dois casos fixam a inversão, para que a
 * generalização não volte por descuido.
 */
describe('CALC-076 · qual parcela domina depende do salário', () => {
  it('no salário mínimo, o seguro-desemprego pesa mais que as reduções', () => {
    const v = comparar({ salario: centavos(162_100) }).valores
    expect(v.dispensa.seguroDesemprego).toBeGreaterThan(v.reducaoNasVerbas)
  })

  it('em salário alto, as reduções pesam mais que o seguro-desemprego', () => {
    const v = comparar({ salario: centavos(800_000) }).valores
    expect(v.reducaoNasVerbas).toBeGreaterThan(v.dispensa.seguroDesemprego)
  })
})

// ---------------------------------------------------------------------------
// 4 · vínculo curto — resultado, e não bloqueio
// ---------------------------------------------------------------------------

/**
 * `calcularSeguroDesemprego` devolve `entrada_invalida` abaixo do mínimo legal
 * de meses. Propagar isso bloquearia a comparação justamente para quem tem a
 * informação mais útil a receber: sem direito ao benefício em nenhum caminho, a
 * vedação do acordo deixa de pesar, e a diferença encolhe muito.
 */
describe('CALC-076 · vínculo abaixo do mínimo legal não bloqueia a tela', () => {
  const curto = comparar({ admissao: '2025-10-01' as DataISO })

  it('calcula, em vez de recusar', () => {
    expect(curto.valores.seguro).toBeNull()
    expect(curto.valores.motivoSemSeguro).toContain('12 meses')
  })

  it('o seguro-desemprego é zero nos DOIS caminhos', () => {
    expect(curto.valores.dispensa.seguroDesemprego).toBe(0)
    expect(curto.valores.acordo.seguroDesemprego).toBe(0)
  })

  it('e a diferença passa a ser só as reduções', () => {
    expect(curto.valores.diferenca).toBe(curto.valores.reducaoNasVerbas)
  })

  it('a memória explica a ausência em vez de omiti-la', () => {
    const etapa = curto.traco.etapas.find((e) => e.rotulo.includes('não alcançado'))
    expect(etapa).toBeDefined()
    expect(etapa?.justificativa).toContain('deixa de pesar')
  })

  /** Erro que NÃO é vínculo curto continua bloqueando — `RN-003`. */
  it('data sem cobertura de vigência bloqueia, e não vira zero', () => {
    const r = calcularAcordoOuDispensa(BASE, '2019-01-01' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// 5 · a memória
// ---------------------------------------------------------------------------

describe('CALC-076 · a memória distingue as duas rescisões', () => {
  const r = comparar()

  /**
   * As duas rescisões produzem etapas de MESMO NOME. Sem prefixo, a memória
   * mostraria "Saldo de salário" duas vezes com valores diferentes e nada
   * explicaria por quê — o oposto de auditável.
   */
  it('toda etapa das rescisões diz a que caminho pertence', () => {
    const daDispensa = r.traco.etapas.filter((e) => e.rotulo.startsWith('Dispensa · '))
    const doAcordo = r.traco.etapas.filter((e) => e.rotulo.startsWith('Acordo · '))
    expect(daDispensa.length).toBeGreaterThan(5)
    expect(doAcordo.length).toBeGreaterThan(5)
  })

  it('a comparação aparece no fim, com os dois totais e a diferença', () => {
    const rotulos = r.traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Dispensa sem justa causa · total disponível')
    expect(rotulos).toContain('Acordo mútuo · total disponível')
    expect(rotulos[rotulos.length - 1]).toBe('Diferença entre os caminhos')
  })

  /**
   * As asserções não fixam o ANO da vigência — `fgts-multa-1997` viraria
   * `fgts-multa-2027` no dia em que a lei mudasse, e o teste reprovaria por uma
   * alteração legítima. O que se cobra é que os três motores tenham contribuído.
   */
  it('as vigências dos três motores entram no traço, sem repetir', () => {
    const vs = r.traco.vigenciasAplicadas
    expect(new Set(vs).size, 'vigência repetida no traço').toBe(vs.length)

    // Só o acordo aplica a multa reduzida; só a dispensa, a integral.
    expect(vs.some((v) => v.startsWith('fgts-multa-acordo'))).toBe(true)
    expect(
      vs.some((v) => v.startsWith('fgts-multa-') && !v.startsWith('fgts-multa-acordo')),
      'a multa integral da dispensa não aparece — os dois lados precisam estar no traço',
    ).toBe(true)

    // E o seguro-desemprego, que só existe num dos caminhos.
    expect(vs.some((v) => v.startsWith('sd-'))).toBe(true)
  })

  /** `RN-028` — a memória não diz o que fazer. */
  it('a etapa da diferença não recomenda caminho nenhum', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Diferença entre os caminhos')
    expect(etapa?.justificativa).toContain('não de qual caminho convém')
    expect(etapa?.justificativa).not.toMatch(/você deve|vale a pena|escolha/i)
  })
})
