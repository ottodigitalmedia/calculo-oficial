/**
 * CALC-104 a CALC-108 — casos-ouro das demais regras de acesso à aposentadoria.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a EC nº 103/2019, no texto
 * compilado do Planalto, lido em 18/09/2026:
 *
 * - art. 16 (idade progressiva): 30/35 anos de contribuição; idade de 56 (mulher)
 *   e 61 (homem), mais seis meses a cada 1º de janeiro desde 2020, até 62 e 65.
 *   Em 2026: 59 anos e 6 meses para a mulher, 64 anos e 6 meses para o homem;
 * - art. 17 (pedágio de 50%): mais de 28/33 anos em 13/11/2019; 30/35 anos mais
 *   metade do que faltava naquela data;
 * - art. 18 (idade, filiado até a Emenda): 60 anos da mulher mais seis meses por
 *   ano até 62, alcançados em 2023; 65 do homem; 15 anos para os dois sexos;
 * - art. 19 (permanente): 62/65 anos; 15 anos da mulher, 20 do homem;
 * - art. 20 (pedágio de 100%): 57/60 anos; 30/35 anos mais o tempo inteiro que
 *   faltava em 13/11/2019.
 *
 * Referência dos casos: 15/06/2026. A projeção é mês a mês — cada mês soma um
 * mês de idade e um de contribuição —, e a conta de cada caso vai escrita nele.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularAposentadoriaPorIdade,
  calcularIdadeProgressiva,
  calcularPedagio100,
  calcularPedagio50,
  compararRegras,
  type EntradaComparador,
} from '../../src/lib/engine/calculadoras/regras-de-aposentadoria'
import { PREVIDENCIA_RGPS } from '../../src/lib/params/data/previdencia-rgps'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS)
const REF = '2026-06-15' as DataISO

function ok<T>(r: { ok: true; valores: T } | { ok: false; detalhe: string }): T {
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

// ---------------------------------------------------------------------------
// CALC-104 — idade progressiva
// ---------------------------------------------------------------------------

describe('CALC-104 · a idade progressiva sobe seis meses por ano', () => {
  const idadeExigida = (sexo: 'mulher' | 'homem', data: string) =>
    ok(calcularIdadeProgressiva({ sexo, idadeAnos: 70, idadeMeses: 0, tempoAnos: 40, tempoMeses: 0 }, data as DataISO, registro))
      .idadeExigidaMeses

  it('a escada da mulher: 56 anos em 2019, 62 a partir de 2031', () => {
    expect(idadeExigida('mulher', '2019-12-01')).toBe(56 * 12)
    expect(idadeExigida('mulher', '2020-06-15')).toBe(56 * 12 + 6)
    expect(idadeExigida('mulher', '2026-06-15')).toBe(59 * 12 + 6)
    expect(idadeExigida('mulher', '2030-06-15')).toBe(61 * 12 + 6)
    expect(idadeExigida('mulher', '2031-01-01')).toBe(62 * 12)
    expect(idadeExigida('mulher', '2045-06-15')).toBe(62 * 12)
  })

  it('a escada do homem: 61 anos em 2019, 65 a partir de 2027', () => {
    expect(idadeExigida('homem', '2019-12-01')).toBe(61 * 12)
    expect(idadeExigida('homem', '2026-06-15')).toBe(64 * 12 + 6)
    expect(idadeExigida('homem', '2027-01-01')).toBe(65 * 12)
    expect(idadeExigida('homem', '2040-06-15')).toBe(65 * 12)
  })

  it('RN-003 — antes da Emenda não há regra cadastrada', () => {
    const r = calcularIdadeProgressiva(
      { sexo: 'mulher', idadeAnos: 60, idadeMeses: 0, tempoAnos: 31, tempoMeses: 0 },
      '2019-11-12' as DataISO,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  /** 60 anos contra 59 e 6 meses; 31 anos de contribuição contra 30. */
  it('mulher que cumpre hoje', () => {
    const v = ok(calcularIdadeProgressiva({ sexo: 'mulher', idadeAnos: 60, idadeMeses: 0, tempoAnos: 31, tempoMeses: 0 }, REF, registro))
    expect(v.cumpreHoje).toBe(true)
    expect(v.mesesAteCumprir).toBe(0)
  })

  /**
   * Mulher com 58 anos e 30 de contribuição em junho de 2026. A idade dela sobe
   * doze meses por ano; a exigida, seis. A diferença cai seis meses por ano:
   * - dezembro de 2027: 59 anos e 6 meses, contra 60 — não;
   * - dezembro de 2028, 30 meses adiante: 60 anos e 6 meses, contra 60 e 6 — cumpre.
   */
  it('a escada adia o cumprimento — a distância cai pela metade da velocidade', () => {
    const v = ok(calcularIdadeProgressiva({ sexo: 'mulher', idadeAnos: 58, idadeMeses: 0, tempoAnos: 30, tempoMeses: 0 }, REF, registro))
    expect(v.cumpreHoje).toBe(false)
    expect(v.mesesAteCumprir).toBe(30)
    expect(v.anoDeCumprimento).toBe(2028)
    expect(v.mesDeCumprimento).toBe(12)
    expect(v.idadeExigidaNoCumprimentoMeses).toBe(60 * 12 + 6)
  })

  /**
   * Homem com 62 anos e 36 de contribuição. Em 2027 a escada chega ao teto de
   * 65 anos e para; ele os alcança em junho de 2029, 36 meses adiante.
   */
  it('depois do teto, só a idade corre', () => {
    const v = ok(calcularIdadeProgressiva({ sexo: 'homem', idadeAnos: 62, idadeMeses: 0, tempoAnos: 36, tempoMeses: 0 }, REF, registro))
    expect(v.mesesAteCumprir).toBe(36)
    expect(v.anoDeCumprimento).toBe(2029)
    expect(v.mesDeCumprimento).toBe(6)
    expect(v.idadeExigidaNoCumprimentoMeses).toBe(65 * 12)
  })

  /** Idade de sobra, tempo curto: 25 anos de contribuição precisam de mais 60 meses. */
  it('idade sem o tempo mínimo não abre a regra', () => {
    const v = ok(calcularIdadeProgressiva({ sexo: 'mulher', idadeAnos: 62, idadeMeses: 0, tempoAnos: 25, tempoMeses: 0 }, REF, registro))
    expect(v.cumpreIdade).toBe(true)
    expect(v.cumpreTempo).toBe(false)
    expect(v.mesesAteCumprir).toBe(60)
    expect(v.anoDeCumprimento).toBe(2031)
  })

  it('a memória cita o art. 16', () => {
    const r = calcularIdadeProgressiva({ sexo: 'mulher', idadeAnos: 58, idadeMeses: 0, tempoAnos: 30, tempoMeses: 0 }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.etapas[0]?.parametro?.dispositivo).toContain('Art. 16')
    expect(r.traco.etapas.some((e) => e.rotulo.includes('12/2028'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CALC-105 — pedágio de 50%
// ---------------------------------------------------------------------------

describe('CALC-105 · pedágio de 50%', () => {
  /**
   * Mulher com 29 anos em 13/11/2019: faltava 1 ano; o pedágio é de 6 meses, e
   * o total exigido, 30 anos e 6 meses. Com 30 anos hoje, faltam 6 meses:
   * dezembro de 2026.
   */
  it('metade do que faltava na data da Emenda', () => {
    const v = ok(calcularPedagio50({ sexo: 'mulher', tempoNaEmendaAnos: 29, tempoNaEmendaMeses: 0, tempoAnos: 30, tempoMeses: 0 }, REF, registro))
    expect(v.faltavaNaEmendaMeses).toBe(12)
    expect(v.pedagioMeiosMeses).toBe(12)
    expect(v.exigidoMeiosMeses).toBe((30 * 12 + 6) * 2)
    expect(v.mesesAteCumprir).toBe(6)
    expect(v.anoDeCumprimento).toBe(2026)
    expect(v.mesDeCumprimento).toBe(12)
  })

  it('com o tempo total cumprido, cumpre hoje — sem idade mínima', () => {
    const v = ok(calcularPedagio50({ sexo: 'mulher', tempoNaEmendaAnos: 29, tempoNaEmendaMeses: 0, tempoAnos: 30, tempoMeses: 6 }, REF, registro))
    expect(v.cumpreHoje).toBe(true)
    expect(v.faltaMeiosMeses).toBe(0)
  })

  /**
   * Homem com 33 anos e 11 meses em 13/11/2019: faltavam 13 meses; o pedágio é
   * de 6 meses e MEIO, sem arredondar. Com 35 anos hoje, faltam 6 meses e meio —
   * e o mês de cumprimento é o sétimo: janeiro de 2027.
   */
  it('metade de um número ímpar de meses fica em meio mês', () => {
    const v = ok(calcularPedagio50({ sexo: 'homem', tempoNaEmendaAnos: 33, tempoNaEmendaMeses: 11, tempoAnos: 35, tempoMeses: 0 }, REF, registro))
    expect(v.faltavaNaEmendaMeses).toBe(13)
    expect(v.pedagioMeiosMeses).toBe(13)
    expect(v.faltaMeiosMeses).toBe(13)
    expect(v.mesesAteCumprir).toBe(7)
    expect(v.anoDeCumprimento).toBe(2027)
    expect(v.mesDeCumprimento).toBe(1)
  })

  it('"mais de" 28 anos: com exatamente 28, a regra não se aplica', () => {
    const r = calcularPedagio50({ sexo: 'mulher', tempoNaEmendaAnos: 28, tempoNaEmendaMeses: 0, tempoAnos: 33, tempoMeses: 0 }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.motivo).toBe('entrada_invalida')
      expect(r.detalhe).toContain('MAIS de 28 anos')
    }
    // Um mês a mais abre a porta: faltavam 23 meses, pedágio de 11 meses e meio.
    const v = ok(calcularPedagio50({ sexo: 'mulher', tempoNaEmendaAnos: 28, tempoNaEmendaMeses: 1, tempoAnos: 33, tempoMeses: 0 }, REF, registro))
    expect(v.pedagioMeiosMeses).toBe(23)
    expect(v.cumpreHoje).toBe(true)
  })

  it('o corte do homem é 33 anos', () => {
    const r = calcularPedagio50({ sexo: 'homem', tempoNaEmendaAnos: 33, tempoNaEmendaMeses: 0, tempoAnos: 36, tempoMeses: 0 }, REF, registro)
    expect(r.ok).toBe(false)
  })

  it('entradas recusadas', () => {
    const semEmenda = calcularPedagio50({ sexo: 'mulher', tempoNaEmendaAnos: 0, tempoNaEmendaMeses: 0, tempoAnos: 30, tempoMeses: 0 }, REF, registro)
    expect(semEmenda.ok).toBe(false)
    if (!semEmenda.ok) expect(semEmenda.motivo).toBe('entrada_incompleta')

    const encolheu = calcularPedagio50({ sexo: 'mulher', tempoNaEmendaAnos: 29, tempoNaEmendaMeses: 0, tempoAnos: 28, tempoMeses: 0 }, REF, registro)
    expect(encolheu.ok).toBe(false)
    if (!encolheu.ok) expect(encolheu.motivo).toBe('entrada_invalida')

    const mesesDemais = calcularPedagio50({ sexo: 'mulher', tempoNaEmendaAnos: 29, tempoNaEmendaMeses: 12, tempoAnos: 30, tempoMeses: 0 }, REF, registro)
    expect(mesesDemais.ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// CALC-106 — pedágio de 100%
// ---------------------------------------------------------------------------

describe('CALC-106 · pedágio de 100%', () => {
  /**
   * Mulher com 55 anos, 32 de contribuição hoje e 25 em 13/11/2019. Faltavam 5
   * anos: o total exigido é 35. Faltam 3 anos de contribuição (36 meses) e 2 de
   * idade (24 meses, até 57). Vale o que chegar por último: junho de 2029.
   */
  it('o tempo é o que chega por último', () => {
    const v = ok(
      calcularPedagio100(
        { sexo: 'mulher', idadeAnos: 55, idadeMeses: 0, tempoNaEmendaAnos: 25, tempoNaEmendaMeses: 0, tempoAnos: 32, tempoMeses: 0 },
        REF,
        registro,
      ),
    )
    expect(v.faltavaNaEmendaMeses).toBe(60)
    expect(v.exigidoMeses).toBe(35 * 12)
    expect(v.faltaTempoMeses).toBe(36)
    expect(v.faltaIdadeMeses).toBe(24)
    expect(v.mesesAteCumprir).toBe(36)
    expect(v.anoDeCumprimento).toBe(2029)
    expect(v.mesDeCumprimento).toBe(6)
  })

  /**
   * Homem com 58 anos, 36 de contribuição e 34 em 13/11/2019. Faltava 1 ano:
   * o exigido é 36, já cumprido. Falta a idade — 60 anos, em junho de 2028.
   */
  it('a idade é o que chega por último', () => {
    const v = ok(
      calcularPedagio100(
        { sexo: 'homem', idadeAnos: 58, idadeMeses: 0, tempoNaEmendaAnos: 34, tempoNaEmendaMeses: 0, tempoAnos: 36, tempoMeses: 0 },
        REF,
        registro,
      ),
    )
    expect(v.faltaTempoMeses).toBe(0)
    expect(v.faltaIdadeMeses).toBe(24)
    expect(v.anoDeCumprimento).toBe(2028)
    expect(v.mesDeCumprimento).toBe(6)
  })

  it('com idade e tempo cumpridos, cumpre hoje', () => {
    const v = ok(
      calcularPedagio100(
        { sexo: 'homem', idadeAnos: 61, idadeMeses: 0, tempoNaEmendaAnos: 34, tempoNaEmendaMeses: 0, tempoAnos: 37, tempoMeses: 0 },
        REF,
        registro,
      ),
    )
    expect(v.cumpreHoje).toBe(true)
  })

  it('entradas recusadas', () => {
    const base = { sexo: 'mulher' as const, idadeAnos: 55, idadeMeses: 0, tempoNaEmendaAnos: 25, tempoNaEmendaMeses: 0, tempoAnos: 32, tempoMeses: 0 }
    for (const over of [{ idadeAnos: 0 }, { idadeAnos: 30, tempoAnos: 32 }, { idadeMeses: 12 }, { tempoNaEmendaAnos: 0 }]) {
      expect(calcularPedagio100({ ...base, ...over }, REF, registro).ok).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// CALC-107 — aposentadoria por idade
// ---------------------------------------------------------------------------

describe('CALC-107 · aposentadoria por idade', () => {
  const porIdade = (over: Partial<Parameters<typeof calcularAposentadoriaPorIdade>[0]>, data = REF) =>
    ok(
      calcularAposentadoriaPorIdade(
        { sexo: 'mulher', idadeAnos: 61, idadeMeses: 6, tempoAnos: 15, tempoMeses: 0, filiadoAntesDaEmenda: true, ...over },
        data,
        registro,
      ),
    )

  it('a idade da mulher na transição subiu até 62 anos em 2023', () => {
    expect(porIdade({}, '2019-12-01' as DataISO).idadeExigidaMeses).toBe(60 * 12)
    expect(porIdade({}, '2020-06-15' as DataISO).idadeExigidaMeses).toBe(60 * 12 + 6)
    expect(porIdade({}, '2022-06-15' as DataISO).idadeExigidaMeses).toBe(61 * 12 + 6)
    expect(porIdade({}, '2023-06-15' as DataISO).idadeExigidaMeses).toBe(62 * 12)
    expect(porIdade({}).idadeExigidaMeses).toBe(62 * 12)
  })

  /** 61 anos e 6 meses em junho: os 62 chegam em dezembro de 2026. */
  it('mulher filiada antes da Emenda: faltam seis meses de idade', () => {
    const v = porIdade({})
    expect(v.mesesAteCumprir).toBe(6)
    expect(v.anoDeCumprimento).toBe(2026)
    expect(v.mesDeCumprimento).toBe(12)
  })

  it('homem filiado antes da Emenda: 65 anos e 15 de contribuição', () => {
    const v = porIdade({ sexo: 'homem', idadeAnos: 65, idadeMeses: 0 })
    expect(v.idadeExigidaMeses).toBe(65 * 12)
    expect(v.tempoMinimoAnos).toBe(15)
    expect(v.cumpreHoje).toBe(true)
  })

  /** Filiado depois: o homem precisa de 20 anos — faltam 5, junho de 2031. */
  it('homem filiado depois da Emenda: a regra permanente exige 20 anos', () => {
    const v = porIdade({ sexo: 'homem', idadeAnos: 65, idadeMeses: 0, filiadoAntesDaEmenda: false })
    expect(v.tempoMinimoAnos).toBe(20)
    expect(v.cumpreHoje).toBe(false)
    expect(v.mesesAteCumprir).toBe(60)
    expect(v.anoDeCumprimento).toBe(2031)
  })

  it('mulher filiada depois: 62 anos e 15 de contribuição', () => {
    const v = porIdade({ idadeAnos: 62, idadeMeses: 0, filiadoAntesDaEmenda: false })
    expect(v.idadeExigidaMeses).toBe(62 * 12)
    expect(v.tempoMinimoAnos).toBe(15)
    expect(v.cumpreHoje).toBe(true)
  })

  it('a memória cita o artigo da regra aplicada', () => {
    const antes = calcularAposentadoriaPorIdade(
      { sexo: 'homem', idadeAnos: 65, idadeMeses: 0, tempoAnos: 15, tempoMeses: 0, filiadoAntesDaEmenda: true },
      REF,
      registro,
    )
    const depois = calcularAposentadoriaPorIdade(
      { sexo: 'homem', idadeAnos: 65, idadeMeses: 0, tempoAnos: 15, tempoMeses: 0, filiadoAntesDaEmenda: false },
      REF,
      registro,
    )
    if (!antes.ok || !depois.ok) throw new Error('esperado sucesso')
    expect(antes.traco.etapas[0]?.parametro?.dispositivo).toContain('Art. 18')
    expect(depois.traco.etapas[0]?.parametro?.dispositivo).toContain('Art. 19')
  })

  it('entradas recusadas', () => {
    for (const over of [{ idadeAnos: 0, idadeMeses: 0 }, { idadeAnos: 14, tempoAnos: 15 }, { tempoMeses: -1 }]) {
      const r = calcularAposentadoriaPorIdade(
        { sexo: 'mulher', idadeAnos: 61, idadeMeses: 6, tempoAnos: 15, tempoMeses: 0, filiadoAntesDaEmenda: true, ...over },
        REF,
        registro,
      )
      expect(r.ok).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// CALC-108 — comparador
// ---------------------------------------------------------------------------

describe('CALC-108 · comparador de regras', () => {
  const BASE: EntradaComparador = {
    sexo: 'mulher',
    idadeAnos: 57,
    idadeMeses: 0,
    tempoAnos: 32,
    tempoMeses: 0,
    filiadoAntesDaEmenda: true,
    tempoNaEmendaAnos: 25,
    tempoNaEmendaMeses: 5,
  }
  const comparar = (over: Partial<EntradaComparador> = {}) => ok(compararRegras({ ...BASE, ...over }, REF, registro))
  const regra = (v: ReturnType<typeof comparar>, id: string) => v.regras.find((r) => r.id === id)!

  /**
   * Mulher com 57 anos, 32 de contribuição hoje e 25 anos e 5 meses em
   * 13/11/2019:
   * - pontos: 89 hoje; 1/6 de ponto por mês contra a régua do ano — alcança
   *   96 em dezembro de 2029 (42 meses);
   * - idade progressiva: 57 anos contra a escada — alcança 61 e 6 meses em
   *   dezembro de 2030 (54 meses);
   * - pedágio de 50%: 25 anos e 5 meses não passam dos 28 — não se aplica;
   * - pedágio de 100%: faltavam 4 anos e 7 meses; exigido 34 anos e 7 meses;
   *   faltam 2 anos e 7 meses, e a idade de 57 já está cumprida — janeiro de
   *   2029 (31 meses);
   * - idade (art. 18): 62 anos em junho de 2031 (60 meses).
   * A primeira é o pedágio de 100%.
   */
  it('põe as regras lado a lado e aponta a que se cumpre primeiro', () => {
    const v = comparar()
    expect(regra(v, 'pontos').mesesAteCumprir).toBe(42)
    expect(regra(v, 'pontos').anoDeCumprimento).toBe(2029)
    expect(regra(v, 'pontos').mesDeCumprimento).toBe(12)
    expect(regra(v, 'idade-progressiva').mesesAteCumprir).toBe(54)
    expect(regra(v, 'pedagio-50').situacao).toBe('nao_se_aplica')
    expect(regra(v, 'pedagio-50').motivo).toContain('28 anos')
    expect(regra(v, 'pedagio-100').mesesAteCumprir).toBe(31)
    expect(regra(v, 'pedagio-100').anoDeCumprimento).toBe(2029)
    expect(regra(v, 'pedagio-100').mesDeCumprimento).toBe(1)
    expect(regra(v, 'idade').mesesAteCumprir).toBe(60)
    expect(regra(v, 'permanente').situacao).toBe('nao_se_aplica')
    expect(v.maisCedo?.id).toBe('pedagio-100')
  })

  /**
   * Mulher com 50 anos, 31 de contribuição e 28 anos e 6 meses em 13/11/2019:
   * faltava 1 ano e 6 meses, pedágio de 9 meses, exigido 30 anos e 9 meses —
   * já cumprido. O pedágio de 50% não tem idade mínima.
   */
  it('o pedágio de 50% abre a aposentadoria sem idade mínima', () => {
    const v = comparar({ idadeAnos: 50, tempoAnos: 31, tempoNaEmendaAnos: 28, tempoNaEmendaMeses: 6 })
    expect(regra(v, 'pedagio-50').situacao).toBe('cumpre')
    expect(v.maisCedo?.id).toBe('pedagio-50')
    expect(v.maisCedo?.mesesAteCumprir).toBe(0)
  })

  it('sem o tempo de 13/11/2019, os pedágios pedem o dado e as demais respondem', () => {
    const v = comparar({ tempoNaEmendaAnos: 0, tempoNaEmendaMeses: 0 })
    expect(regra(v, 'pedagio-50').situacao).toBe('falta_dado')
    expect(regra(v, 'pedagio-100').situacao).toBe('falta_dado')
    expect(regra(v, 'pontos').situacao).toBe('cumprira')
    expect(v.maisCedo?.id).toBe('pontos')
  })

  it('quem se filiou depois da Emenda só tem a regra permanente', () => {
    const v = comparar({ idadeAnos: 40, tempoAnos: 5, filiadoAntesDaEmenda: false, tempoNaEmendaAnos: 0, tempoNaEmendaMeses: 0 })
    for (const id of ['pontos', 'idade-progressiva', 'pedagio-50', 'pedagio-100', 'idade']) {
      expect(regra(v, id).situacao, id).toBe('nao_se_aplica')
    }
    // 62 anos: faltam 22 anos, 264 meses — junho de 2048.
    expect(regra(v, 'permanente').mesesAteCumprir).toBe(264)
    expect(v.maisCedo?.id).toBe('permanente')
  })

  it('a memória reúne as regras e diz que cumprir primeiro não é ser a mais vantajosa', () => {
    const r = compararRegras(BASE, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.etapas.some((e) => e.rotulo.startsWith('Pedágio de 100% ·'))).toBe(true)
    const ultima = r.traco.etapas.at(-1)
    expect(ultima?.rotulo).toContain('Pedágio de 100%')
    expect(ultima?.justificativa).toContain('fator previdenciário')
    expect(new Set(r.traco.vigenciasAplicadas).size).toBe(r.traco.vigenciasAplicadas.length)
  })

  it('entradas incoerentes são recusadas', () => {
    for (const over of [
      { tempoNaEmendaAnos: 33 },
      { idadeAnos: 20, tempoAnos: 32 },
      { tempoNaEmendaMeses: 12 },
      { idadeAnos: 0, idadeMeses: 0 },
    ]) {
      expect(compararRegras({ ...BASE, ...over }, REF, registro).ok).toBe(false)
    }
  })

  it('RN-003 — antes da Emenda, nada é comparado', () => {
    const r = compararRegras(BASE, '2019-11-12' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
