/**
 * Modelo e carregador de parâmetros por vigência — T-006.
 *
 * Exercita BV-01 a BV-07 com fixtures sintéticas, e a consulta por data com
 * `RN-002`, `RN-003` e `RN-004`.
 *
 * Fixture sintética, e não a tabela real: aqui se verifica que a REGRA
 * dispara, não que o valor está certo. Se o INSS de verdade entrasse como
 * fixture, este arquivo passaria a falhar na virada do exercício por motivo
 * nenhum — que é como suítes morrem (`12-test-plan` §3.2).
 */

import { describe, expect, it } from 'vitest'

import { construirRegistro } from '../../src/lib/params/registry'
import { ehDominioOficial, verificarConjunto } from '../../src/lib/params/schema'
import type { ConjuntoDeParametros, Fonte, Parametro, Vigencia } from '../../src/lib/params/tipos'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fonte: Fonte = {
  id: 'norma-exemplo',
  norma: 'Norma de exemplo nº 1, de 1º de janeiro de 2000',
  dispositivo: 'Art. 1º',
  url: 'https://www.planalto.gov.br/exemplo',
  orgao: 'Congresso Nacional',
}

const parametroTabela: Parametro = {
  id: 'tabela-exemplo',
  nome: 'Tabela de exemplo',
  descricao: 'Tabela progressiva sintética, só para exercitar as regras.',
  tipo: 'tabela_faixas',
}

function vigenciaTabela(over: Partial<Vigencia> = {}): Vigencia {
  return {
    id: 'tabela-exemplo-2025',
    parametroId: 'tabela-exemplo',
    fonteId: 'norma-exemplo',
    inicio: '2025-01-01',
    fim: '2025-12-31',
    valor: {
      tipo: 'tabela_faixas',
      faixas: [
        { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 100_000, aliquotaBp: 750 },
        { ordem: 2, limiteInferiorCentavos: 100_001, limiteSuperiorCentavos: null, aliquotaBp: 900 },
      ],
    },
    ...over,
  }
}

function conjunto(over: Partial<ConjuntoDeParametros> = {}): ConjuntoDeParametros {
  return {
    fontes: [fonte],
    parametros: [parametroTabela],
    vigencias: [vigenciaTabela()],
    ...over,
  }
}

const regras = (c: ConjuntoDeParametros) => verificarConjunto(c).map((v) => v.regra)

// ---------------------------------------------------------------------------

describe('BV-07 · a fonte precisa ser de domínio oficial (regra F-1)', () => {
  it('aceita os domínios restritos do governo brasileiro', () => {
    expect(ehDominioOficial('https://www.planalto.gov.br/ccivil_03/leis/l9250.htm')).toBe(true)
    expect(ehDominioOficial('https://www.gov.br/inss/pt-br/tabela')).toBe(true)
    expect(ehDominioOficial('https://www2.camara.leg.br/legin/fed/lei/2025/x.html')).toBe(true)
    expect(ehDominioOficial('https://scon.stj.jus.br/SCON/sumstj/doc.jsp')).toBe(true)
  })

  it('recusa domínio que apenas TERMINA parecido com oficial', () => {
    // "evilgov.br" termina em "gov.br" — a checagem por sufixo precisa exigir
    // o ponto, senão qualquer um registra um domínio que passa na regra.
    expect(ehDominioOficial('https://evilgov.br/tabela')).toBe(false)
    expect(ehDominioOficial('https://gov.br.exemplo.com/tabela')).toBe(false)
  })

  it('recusa blog, concorrente e software de terceiro', () => {
    expect(ehDominioOficial('https://blog-contabil.com.br/tabela-inss')).toBe(false)
    expect(ehDominioOficial('https://calculadora-concorrente.com.br/inss')).toBe(false)
  })

  it('exige HTTPS — link http vira conteúdo misto e quebra RN-029 na prática', () => {
    expect(ehDominioOficial('http://www.planalto.gov.br/exemplo')).toBe(false)
  })

  it('recusa URL malformada', () => {
    expect(ehDominioOficial('nao-e-url')).toBe(false)
    expect(ehDominioOficial('')).toBe(false)
  })

  it('reprova o conjunto inteiro quando a fonte é não oficial', () => {
    const c = conjunto({
      fontes: [{ ...fonte, url: 'https://algum-blog.com.br/tabela' }],
    })
    expect(regras(c)).toContain('BV-07')
  })
})

describe('BV-01 · parâmetro sem fonte não compila (RN-001)', () => {
  it('reprova vigência que aponta para fonte inexistente', () => {
    const c = conjunto({ vigencias: [vigenciaTabela({ fonteId: 'nao-existe' })] })
    expect(regras(c)).toContain('BV-01')
  })

  it('reprova vigência que aponta para parâmetro inexistente', () => {
    const c = conjunto({ vigencias: [vigenciaTabela({ parametroId: 'nao-existe' })] })
    expect(regras(c)).toContain('BV-01')
  })

  it('reprova fonte sem norma declarada', () => {
    const c = conjunto({ fontes: [{ ...fonte, norma: '' }] })
    expect(regras(c)).toContain('BV-01')
  })

  it('aprova o conjunto íntegro', () => {
    expect(verificarConjunto(conjunto())).toEqual([])
  })
})

describe('BV-02 · vigências do mesmo parâmetro não se sobrepõem (RN-002, V-1)', () => {
  it('reprova sobreposição', () => {
    const c = conjunto({
      vigencias: [
        vigenciaTabela({ id: 'v-2025', inicio: '2025-01-01', fim: '2025-12-31' }),
        vigenciaTabela({ id: 'v-2025b', inicio: '2025-06-01', fim: '2026-05-31' }),
      ],
    })
    expect(regras(c)).toContain('BV-02')
  })

  it('reprova vigência nova depois de uma que ficou aberta', () => {
    const c = conjunto({
      vigencias: [
        vigenciaTabela({ id: 'v-2025', inicio: '2025-01-01', fim: null }),
        vigenciaTabela({ id: 'v-2026', inicio: '2026-01-01', fim: null }),
      ],
    })
    const r = regras(c)
    expect(r).toContain('BV-02')
    expect(r).toContain('BV-03')
  })

  it('aceita vigências adjacentes sem sobrepor', () => {
    const c = conjunto({
      vigencias: [
        vigenciaTabela({ id: 'v-2025', inicio: '2025-01-01', fim: '2025-12-31' }),
        vigenciaTabela({ id: 'v-2026', inicio: '2026-01-01', fim: null }),
      ],
    })
    expect(verificarConjunto(c)).toEqual([])
  })

  it('aceita LACUNA entre vigências — lacuna é informação, não erro', () => {
    // 05-data-model §3: lacuna sinaliza honestamente "não sabemos"; quem
    // bloqueia o cálculo é RN-003, em tempo de consulta.
    const c = conjunto({
      vigencias: [
        vigenciaTabela({ id: 'v-2023', inicio: '2023-01-01', fim: '2023-12-31' }),
        vigenciaTabela({ id: 'v-2026', inicio: '2026-01-01', fim: null }),
      ],
    })
    expect(verificarConjunto(c)).toEqual([])
  })
})

describe('BV-04 · fim posterior a inicio (V-2)', () => {
  it('reprova fim anterior ao inicio', () => {
    const c = conjunto({ vigencias: [vigenciaTabela({ inicio: '2026-01-01', fim: '2025-12-31' })] })
    expect(regras(c)).toContain('BV-04')
  })

  it('reprova fim igual ao inicio', () => {
    const c = conjunto({ vigencias: [vigenciaTabela({ inicio: '2026-01-01', fim: '2026-01-01' })] })
    expect(regras(c)).toContain('BV-04')
  })
})

describe('BV-05 · faixas contíguas, sem lacuna nem sobreposição (FX-1, FX-2)', () => {
  it('reprova LACUNA entre faixas', () => {
    // O salário que cai na lacuna não gera erro visível: gera contribuição
    // zero naquele trecho. É o defeito mais silencioso da tabela.
    const c = conjunto({
      vigencias: [
        vigenciaTabela({
          valor: {
            tipo: 'tabela_faixas',
            faixas: [
              { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 100_000, aliquotaBp: 750 },
              { ordem: 2, limiteInferiorCentavos: 100_050, limiteSuperiorCentavos: null, aliquotaBp: 900 },
            ],
          },
        }),
      ],
    })
    const violacoes = verificarConjunto(c)
    expect(violacoes.map((v) => v.regra)).toContain('BV-05')
    expect(violacoes.some((v) => v.mensagem.includes('LACUNA'))).toBe(true)
  })

  it('reprova SOBREPOSIÇÃO entre faixas', () => {
    const c = conjunto({
      vigencias: [
        vigenciaTabela({
          valor: {
            tipo: 'tabela_faixas',
            faixas: [
              { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 100_000, aliquotaBp: 750 },
              { ordem: 2, limiteInferiorCentavos: 99_000, limiteSuperiorCentavos: null, aliquotaBp: 900 },
            ],
          },
        }),
      ],
    })
    expect(verificarConjunto(c).some((v) => v.mensagem.includes('SOBREPOSIÇÃO'))).toBe(true)
  })

  it('reprova primeira faixa que não começa em zero', () => {
    const c = conjunto({
      vigencias: [
        vigenciaTabela({
          valor: {
            tipo: 'tabela_faixas',
            faixas: [
              { ordem: 1, limiteInferiorCentavos: 100, limiteSuperiorCentavos: null, aliquotaBp: 750 },
            ],
          },
        }),
      ],
    })
    expect(regras(c)).toContain('BV-05')
  })

  it('reprova limite nulo em faixa que não é a última (FX-3)', () => {
    const c = conjunto({
      vigencias: [
        vigenciaTabela({
          valor: {
            tipo: 'tabela_faixas',
            faixas: [
              { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: null, aliquotaBp: 750 },
              { ordem: 2, limiteInferiorCentavos: 100_001, limiteSuperiorCentavos: null, aliquotaBp: 900 },
            ],
          },
        }),
      ],
    })
    expect(regras(c)).toContain('BV-05')
  })
})

describe('BV-06 · o valor corresponde ao tipo declarado (V-4)', () => {
  it('reprova parâmetro declarado como tabela recebendo valor monetário', () => {
    const c = conjunto({
      vigencias: [vigenciaTabela({ valor: { tipo: 'valor_monetario', centavos: 162_100 } })],
    })
    expect(regras(c)).toContain('BV-06')
  })
})

describe('ADR-007 · fração exata é aceita', () => {
  const c = conjunto({
    parametros: [{ ...parametroTabela, id: 'coeficiente-exemplo', tipo: 'fracao' }],
    vigencias: [
      vigenciaTabela({
        parametroId: 'coeficiente-exemplo',
        valor: { tipo: 'fracao', numerador: 133_145, denominador: 1_000_000 },
      }),
    ],
  })

  it('aprova fração com denominador válido', () => {
    expect(verificarConjunto(c)).toEqual([])
  })

  it('reprova denominador zero (F-1)', () => {
    const invalido = conjunto({
      parametros: [{ ...parametroTabela, id: 'coeficiente-exemplo', tipo: 'fracao' }],
      vigencias: [
        vigenciaTabela({
          parametroId: 'coeficiente-exemplo',
          valor: { tipo: 'fracao', numerador: 1, denominador: 0 },
        }),
      ],
    })
    expect(verificarConjunto(invalido).length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Consulta
// ---------------------------------------------------------------------------

describe('RN-002 · resolve exatamente a vigência da data', () => {
  const registro = construirRegistro(
    conjunto({
      vigencias: [
        vigenciaTabela({ id: 'v-2025', inicio: '2025-01-01', fim: '2025-12-31' }),
        vigenciaTabela({ id: 'v-2026', inicio: '2026-01-01', fim: null }),
      ],
    }),
  )

  it('resolve a vigência correta em cada exercício', () => {
    const a = registro.resolver('tabela-exemplo', '2025-06-15')
    const b = registro.resolver('tabela-exemplo', '2026-06-15')
    expect(a.ok && a.resolvida.vigencia.id).toBe('v-2025')
    expect(b.ok && b.resolvida.vigencia.id).toBe('v-2026')
  })

  it('resolve corretamente nas datas de fronteira', () => {
    const ultimoDia = registro.resolver('tabela-exemplo', '2025-12-31')
    const primeiroDia = registro.resolver('tabela-exemplo', '2026-01-01')
    expect(ultimoDia.ok && ultimoDia.resolvida.vigencia.id).toBe('v-2025')
    expect(primeiroDia.ok && primeiroDia.resolvida.vigencia.id).toBe('v-2026')
  })

  it('RN-004 · vigência com fim nulo vale indefinidamente', () => {
    const distante = registro.resolver('tabela-exemplo', '2099-12-31')
    expect(distante.ok && distante.resolvida.vigencia.id).toBe('v-2026')
  })

  it('RN-029 · a fonte acompanha a vigência resolvida', () => {
    const r = registro.resolver('tabela-exemplo', '2026-03-01')
    expect(r.ok && r.resolvida.fonte.url).toBe('https://www.planalto.gov.br/exemplo')
    expect(r.ok && r.resolvida.fonte.dispositivo).toBe('Art. 1º')
  })
})

describe('RN-003 · data sem cobertura bloqueia, nunca extrapola', () => {
  const registro = construirRegistro(
    conjunto({
      vigencias: [
        vigenciaTabela({ id: 'v-2025', inicio: '2025-01-01', fim: '2025-12-31' }),
        vigenciaTabela({ id: 'v-2027', inicio: '2027-01-01', fim: '2027-12-31' }),
      ],
    }),
  )

  it('data anterior à menor vigência devolve erro tipado com o intervalo', () => {
    const r = registro.resolver('tabela-exemplo', '2020-01-01')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.motivo).toBe('vigencia_ausente')
    expect(r.cobertura).toEqual({ inicio: '2025-01-01', fim: '2027-12-31' })
    expect(r.detalhe).toContain('2025-01-01')
  })

  it('data posterior à maior vigência encerrada NÃO extrapola', () => {
    // Extrapolar aqui produziria um número errado com aparência de certo —
    // exatamente o dano que o projeto existe para evitar.
    const r = registro.resolver('tabela-exemplo', '2028-01-01')
    expect(r.ok).toBe(false)
  })

  it('data dentro da LACUNA entre vigências também bloqueia', () => {
    const r = registro.resolver('tabela-exemplo', '2026-06-01')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('parâmetro desconhecido é motivo distinto de vigência ausente', () => {
    const r = registro.resolver('nao-existe', '2026-01-01')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('parametro_desconhecido')
  })
})

describe('mensagem de RN-003 descreve a cobertura de forma legível', () => {
  it('cobertura aberta é descrita como "em diante"', () => {
    const registro = construirRegistro(
      conjunto({ vigencias: [vigenciaTabela({ inicio: '2026-01-01', fim: null })] }),
    )
    const r = registro.resolver('tabela-exemplo', '2020-01-01')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.detalhe).toContain('em diante')
    expect(r.cobertura).toEqual({ inicio: '2026-01-01', fim: null })
  })

  it('parâmetro declarado sem nenhuma vigência bloqueia com mensagem própria', () => {
    const registro = construirRegistro(conjunto({ vigencias: [] }))
    const r = registro.resolver('tabela-exemplo', '2026-01-01')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.motivo).toBe('vigencia_ausente')
    expect(r.detalhe).toContain('nenhuma vigência')
    expect(r.cobertura).toBeUndefined()
    expect(registro.cobertura('tabela-exemplo')).toBeNull()
  })
})

describe('RN-029 · resolver sem fonte falha em vez de devolver resultado mudo', () => {
  it('vigência apontando para fonte inexistente não resolve', () => {
    // Só acontece se BV-01 tiver sido contornado. Devolver o valor sem a fonte
    // seria pior que falhar: a memória de cálculo exibiria um número sem
    // origem, que é exatamente o que o produto critica no mercado.
    const registro = construirRegistro(
      conjunto({ vigencias: [vigenciaTabela({ fonteId: 'fonte-que-sumiu' })] }),
    )
    const r = registro.resolver('tabela-exemplo', '2025-06-01')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.detalhe).toContain('fonte inexistente')
  })
})

describe('C-1 · o intervalo aceito por uma calculadora é calculado, não escrito', () => {
  const registro = construirRegistro({
    fontes: [fonte],
    parametros: [
      parametroTabela,
      { ...parametroTabela, id: 'outro-parametro', tipo: 'valor_monetario' },
    ],
    vigencias: [
      vigenciaTabela({ id: 'a-2024', inicio: '2024-01-01', fim: '2026-12-31' }),
      vigenciaTabela({
        id: 'b-2025',
        parametroId: 'outro-parametro',
        inicio: '2025-01-01',
        fim: null,
        valor: { tipo: 'valor_monetario', centavos: 162_100 },
      }),
    ],
  })

  it('a cobertura combinada é a INTERSEÇÃO, não a união', () => {
    // Um parâmetro cobre 2024–2026 e o outro 2025 em diante. A calculadora que
    // usa os dois só aceita 2025-01-01 a 2026-12-31.
    expect(registro.coberturaCombinada(['tabela-exemplo', 'outro-parametro'])).toEqual({
      inicio: '2025-01-01',
      fim: '2026-12-31',
    })
  })

  it('um parâmetro encerrado limita o conjunto mesmo com outro aberto', () => {
    const c = registro.coberturaCombinada(['tabela-exemplo', 'outro-parametro'])
    expect(c?.fim).toBe('2026-12-31')
  })

  it('parâmetro inexistente anula a cobertura combinada', () => {
    expect(registro.coberturaCombinada(['tabela-exemplo', 'fantasma'])).toBeNull()
  })

  it('lista vazia devolve nulo', () => {
    expect(registro.coberturaCombinada([])).toBeNull()
  })

  it('todos os parâmetros abertos produzem cobertura aberta', () => {
    const r = construirRegistro({
      fontes: [fonte],
      parametros: [parametroTabela, { ...parametroTabela, id: 'segundo' }],
      vigencias: [
        vigenciaTabela({ id: 'a', inicio: '2024-01-01', fim: null }),
        vigenciaTabela({ id: 'b', parametroId: 'segundo', inicio: '2026-01-01', fim: null }),
      ],
    })
    // Interseção de [2024,∞) com [2026,∞) começa no mais tardio e não termina.
    expect(r.coberturaCombinada(['tabela-exemplo', 'segundo'])).toEqual({
      inicio: '2026-01-01',
      fim: null,
    })
  })

  it('coberturas que NÃO se sobrepõem devolvem nulo', () => {
    // Uma calculadora cujos parâmetros não têm data em comum não aceita data
    // alguma — e é melhor descobrir isso no build que na tela do usuário.
    const r = construirRegistro({
      fontes: [fonte],
      parametros: [parametroTabela, { ...parametroTabela, id: 'segundo' }],
      vigencias: [
        vigenciaTabela({ id: 'a', inicio: '2020-01-01', fim: '2021-12-31' }),
        vigenciaTabela({ id: 'b', parametroId: 'segundo', inicio: '2026-01-01', fim: '2026-12-31' }),
      ],
    })
    expect(r.coberturaCombinada(['tabela-exemplo', 'segundo'])).toBeNull()
  })
})

describe('validações restantes do esquema', () => {
  it('reprova data com mês ou dia fora do calendário', () => {
    const c = conjunto({ vigencias: [vigenciaTabela({ inicio: '2026-13-01' })] })
    expect(verificarConjunto(c).length).toBeGreaterThan(0)

    const d = conjunto({ vigencias: [vigenciaTabela({ inicio: '2026-02-32' })] })
    expect(verificarConjunto(d).length).toBeGreaterThan(0)
  })

  it('reprova faixa com ordem fora de sequência', () => {
    const c = conjunto({
      vigencias: [
        vigenciaTabela({
          valor: {
            tipo: 'tabela_faixas',
            faixas: [
              { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 100_000, aliquotaBp: 750 },
              { ordem: 5, limiteInferiorCentavos: 100_001, limiteSuperiorCentavos: null, aliquotaBp: 900 },
            ],
          },
        }),
      ],
    })
    expect(regras(c)).toContain('BV-05')
  })

  it('reprova faixa com limite superior menor que o inferior', () => {
    const c = conjunto({
      vigencias: [
        vigenciaTabela({
          valor: {
            tipo: 'tabela_faixas',
            faixas: [
              { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 100_000, aliquotaBp: 750 },
              { ordem: 2, limiteInferiorCentavos: 100_001, limiteSuperiorCentavos: 50_000, aliquotaBp: 900 },
            ],
          },
        }),
      ],
    })
    expect(regras(c)).toContain('BV-05')
  })
})
