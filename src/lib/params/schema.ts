/**
 * Verificação estrutural dos parâmetros legais — BV-01 a BV-09
 * (`12-test-plan` §4).
 *
 * **Este módulo roda apenas no BUILD.** É o único de `params/` que importa
 * Zod, e Zod é `devDependency` por isso: se ele entrasse no caminho de
 * runtime, o motor — que importa `registry.ts` — herdaria a cadeia de
 * dependências que `ADR-003` proíbe no ponto que toca o dado do usuário.
 *
 * Nada aqui é importado por `registry.ts` nem por `src/lib/engine/`.
 *
 * As restrições que um banco imporia em tempo de execução são impostas aqui,
 * onde falham antes de chegar ao usuário (`05-data-model` §1).
 */

import { z } from 'zod'

import type { ConjuntoDeParametros, Vigencia } from './tipos'

// ---------------------------------------------------------------------------
// Regra F-1 · domínio oficial (BV-07)
// ---------------------------------------------------------------------------

/**
 * Domínios de topo restritos do governo brasileiro. O registro nesses domínios
 * é controlado, o que os torna um teste sólido de "fonte oficial" — ao
 * contrário de uma lista de sites, que envelhece.
 *
 * `gov.br` cobre planalto, Diário Oficial, Receita, Previdência e INSS.
 * `leg.br` cobre Câmara e Senado. `jus.br` cobre os tribunais superiores,
 * necessário para súmula citada como fundamento de incidência.
 */
const DOMINIOS_OFICIAIS = ['gov.br', 'leg.br', 'jus.br'] as const

export function ehDominioOficial(url: string): boolean {
  let host: string
  let protocolo: string
  try {
    const u = new URL(url)
    host = u.hostname.toLowerCase()
    protocolo = u.protocol
  } catch {
    return false
  }

  // HTTPS obrigatório. Não é preciosismo: a URL vai para a memória de cálculo
  // numa página servida por HTTPS, e link `http://` ali vira conteúdo misto —
  // bloqueado pelo navegador, quebrando RN-029 na prática.
  if (protocolo !== 'https:') return false

  // Sufixo com ponto, nunca `endsWith(dominio)` puro: "evilgov.br" termina em
  // "gov.br" e não é oficial coisa nenhuma.
  return DOMINIOS_OFICIAIS.some((d) => host === d || host.endsWith(`.${d}`))
}

// ---------------------------------------------------------------------------
// Esquemas
// ---------------------------------------------------------------------------

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar em AAAA-MM-DD')
  .refine((s) => {
    const [a, m, d] = s.split('-').map(Number)
    if (a === undefined || m === undefined || d === undefined) return false
    if (m < 1 || m > 12 || d < 1 || d > 31) return false
    return true
  }, 'data inexistente no calendário')

const inteiro = z.number().int('deve ser inteiro').refine(Number.isSafeInteger, 'fora do inteiro seguro')

const identificador = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'identificador em kebab-case, sem acento')

export const fonteSchema = z.object({
  id: identificador,
  // BV-01: norma e URL são obrigatórias. Sem elas o parâmetro não é auditável,
  // e um parâmetro não auditável derruba a tese do produto inteiro.
  norma: z.string().min(1, 'RN-001: norma obrigatória'),
  dispositivo: z.string().min(1).optional(),
  url: z
    .string()
    .url('URL absoluta obrigatória')
    // BV-07 / regra F-1.
    .refine(ehDominioOficial, {
      message: `URL fora de domínio oficial (${DOMINIOS_OFICIAIS.join(', ')}) ou sem HTTPS. Copiar tabela de blog, concorrente ou software de terceiro é a forma como o erro se propaga no mercado — CO-1 e CLAUDE.md proíbem.`,
    }),
  orgao: z.string().min(1),
})

export const faixaSchema = z.object({
  ordem: inteiro.min(1),
  limiteInferiorCentavos: inteiro.min(0),
  limiteSuperiorCentavos: inteiro.min(0).nullable(),
  aliquotaBp: inteiro.min(0),
  parcelaDeduzirCentavos: inteiro.min(0).optional(),
})

export const valorSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('valor_monetario'), centavos: inteiro }),
  z.object({ tipo: z.literal('percentual'), aliquotaBp: inteiro }),
  z.object({ tipo: z.literal('inteiro'), valor: inteiro }),
  z.object({
    tipo: z.literal('fracao'),
    numerador: inteiro,
    // ADR-007 F-1.
    denominador: inteiro.refine((n) => n !== 0, 'denominador não pode ser zero'),
  }),
  z.object({ tipo: z.literal('tabela_faixas'), faixas: z.array(faixaSchema).min(1) }),
])

export const parametroSchema = z.object({
  id: identificador,
  nome: z.string().min(1),
  descricao: z.string().min(1),
  tipo: z.enum(['valor_monetario', 'percentual', 'inteiro', 'fracao', 'tabela_faixas']),
})

export const vigenciaSchema = z.object({
  id: identificador,
  parametroId: identificador,
  fonteId: identificador,
  inicio: dataISO,
  fim: dataISO.nullable(),
  valor: valorSchema,
  observacao: z.string().min(1).optional(),
})

export const conjuntoSchema = z.object({
  fontes: z.array(fonteSchema),
  parametros: z.array(parametroSchema),
  vigencias: z.array(vigenciaSchema),
})

// ---------------------------------------------------------------------------
// Verificações que o esquema sozinho não expressa
// ---------------------------------------------------------------------------

export interface Violacao {
  readonly regra: string
  readonly onde: string
  readonly mensagem: string
}

/** BV-04 · `fim` posterior a `inicio` (restrição V-2). */
function verificarOrdemDasDatas(vigencias: readonly Vigencia[]): Violacao[] {
  return vigencias
    .filter((v) => v.fim !== null && v.fim <= v.inicio)
    .map((v) => ({
      regra: 'BV-04',
      onde: v.id,
      mensagem: `fim (${v.fim}) deve ser posterior a inicio (${v.inicio}).`,
    }))
}

/**
 * BV-02 · nenhuma sobreposição de vigência do mesmo parâmetro (`RN-002`, V-1).
 *
 * Duas vigências cobrindo a mesma data tornam o resultado dependente da ordem
 * de leitura do arquivo — o mesmo cálculo daria números diferentes conforme o
 * empacotador resolvesse os módulos.
 */
function verificarSobreposicao(vigencias: readonly Vigencia[]): Violacao[] {
  const violacoes: Violacao[] = []
  const porParametro = new Map<string, Vigencia[]>()

  for (const v of vigencias) {
    const lista = porParametro.get(v.parametroId)
    if (lista) lista.push(v)
    else porParametro.set(v.parametroId, [v])
  }

  for (const [parametroId, lista] of porParametro) {
    const ordenadas = lista.slice().sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
    for (let i = 1; i < ordenadas.length; i++) {
      const anterior = ordenadas[i - 1]
      const atual = ordenadas[i]
      if (!anterior || !atual) continue
      if (anterior.fim === null || atual.inicio <= anterior.fim) {
        violacoes.push({
          regra: 'BV-02',
          onde: `${parametroId}: ${anterior.id} × ${atual.id}`,
          mensagem:
            anterior.fim === null
              ? `"${anterior.id}" está aberta e "${atual.id}" começa em ${atual.inicio}. Encerre a anterior com fim.`
              : `"${anterior.id}" termina em ${anterior.fim} e "${atual.id}" começa em ${atual.inicio}.`,
        })
      }
    }
  }
  return violacoes
}

/** BV-03 · no máximo uma vigência aberta por parâmetro (restrição V-3). */
function verificarVigenciaAberta(vigencias: readonly Vigencia[]): Violacao[] {
  const abertas = new Map<string, string[]>()
  for (const v of vigencias) {
    if (v.fim !== null) continue
    const lista = abertas.get(v.parametroId)
    if (lista) lista.push(v.id)
    else abertas.set(v.parametroId, [v.id])
  }
  return [...abertas.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([parametroId, ids]) => ({
      regra: 'BV-03',
      onde: parametroId,
      mensagem: `${ids.length} vigências abertas ao mesmo tempo: ${ids.join(', ')}.`,
    }))
}

/**
 * BV-05 · faixas contíguas, sem lacuna nem sobreposição (FX-1, FX-2, FX-3).
 *
 * Lacuna entre faixas é pior que erro de alíquota: o salário que cai nela não
 * produz erro visível, produz **contribuição zero** naquele trecho.
 */
function verificarFaixas(vigencias: readonly Vigencia[]): Violacao[] {
  const violacoes: Violacao[] = []

  for (const v of vigencias) {
    if (v.valor.tipo !== 'tabela_faixas') continue
    const faixas = v.valor.faixas.slice().sort((a, b) => a.ordem - b.ordem)

    faixas.forEach((f, i) => {
      if (f.ordem !== i + 1) {
        violacoes.push({
          regra: 'BV-05',
          onde: `${v.id} faixa ${f.ordem}`,
          mensagem: `ordem deve ser sequencial a partir de 1; esperado ${i + 1}.`,
        })
      }
      if (f.limiteSuperiorCentavos !== null && f.limiteSuperiorCentavos <= f.limiteInferiorCentavos) {
        violacoes.push({
          regra: 'BV-05',
          onde: `${v.id} faixa ${f.ordem}`,
          mensagem: `limite superior (${f.limiteSuperiorCentavos}) não é maior que o inferior (${f.limiteInferiorCentavos}).`,
        })
      }
    })

    const primeira = faixas[0]
    if (primeira && primeira.limiteInferiorCentavos !== 0) {
      violacoes.push({
        regra: 'BV-05',
        onde: `${v.id} faixa 1`,
        mensagem: `a primeira faixa deve começar em 0, começa em ${primeira.limiteInferiorCentavos}.`,
      })
    }

    for (let i = 1; i < faixas.length; i++) {
      const anterior = faixas[i - 1]
      const atual = faixas[i]
      if (!anterior || !atual) continue
      if (anterior.limiteSuperiorCentavos === null) {
        violacoes.push({
          regra: 'BV-05',
          onde: `${v.id} faixa ${anterior.ordem}`,
          mensagem: 'só a última faixa pode ter limite superior nulo (FX-3).',
        })
        continue
      }
      // FX-1: contiguidade em centavos — o inferior da seguinte é o superior
      // da anterior mais um centavo.
      const esperado = anterior.limiteSuperiorCentavos + 1
      if (atual.limiteInferiorCentavos !== esperado) {
        violacoes.push({
          regra: 'BV-05',
          onde: `${v.id} faixas ${anterior.ordem}→${atual.ordem}`,
          mensagem:
            atual.limiteInferiorCentavos > esperado
              ? `LACUNA de ${atual.limiteInferiorCentavos - esperado} centavo(s): a faixa anterior termina em ${anterior.limiteSuperiorCentavos} e esta começa em ${atual.limiteInferiorCentavos}.`
              : `SOBREPOSIÇÃO: esta faixa começa em ${atual.limiteInferiorCentavos}, dentro da anterior que vai até ${anterior.limiteSuperiorCentavos}.`,
        })
      }
    }
  }
  return violacoes
}

/** BV-06 · o formato do valor corresponde ao tipo declarado (V-4). */
function verificarTipoDoValor(conjunto: ConjuntoDeParametros): Violacao[] {
  const tipos = new Map(conjunto.parametros.map((p) => [p.id, p.tipo]))
  return conjunto.vigencias
    .filter((v) => {
      const esperado = tipos.get(v.parametroId)
      return esperado !== undefined && esperado !== v.valor.tipo
    })
    .map((v) => ({
      regra: 'BV-06',
      onde: v.id,
      mensagem: `parâmetro declara tipo "${tipos.get(v.parametroId)}" e a vigência traz "${v.valor.tipo}".`,
    }))
}

/** BV-01 · integridade referencial: toda vigência aponta para fonte e parâmetro existentes. */
function verificarReferencias(conjunto: ConjuntoDeParametros): Violacao[] {
  const fontes = new Set(conjunto.fontes.map((f) => f.id))
  const parametros = new Set(conjunto.parametros.map((p) => p.id))
  const violacoes: Violacao[] = []

  for (const v of conjunto.vigencias) {
    if (!parametros.has(v.parametroId)) {
      violacoes.push({
        regra: 'BV-01',
        onde: v.id,
        mensagem: `referencia parâmetro inexistente "${v.parametroId}".`,
      })
    }
    if (!fontes.has(v.fonteId)) {
      violacoes.push({
        regra: 'BV-01',
        onde: v.id,
        mensagem: `RN-001: referencia fonte inexistente "${v.fonteId}". Parâmetro sem fonte não compila.`,
      })
    }
  }
  return violacoes
}

/**
 * Executa BV-01 a BV-06 sobre um conjunto. Devolve todas as violações
 * encontradas, não só a primeira — quem está cadastrando uma tabela quer ver
 * os quatro erros de uma vez, não descobrir um por execução.
 */
export function verificarConjunto(conjunto: ConjuntoDeParametros): Violacao[] {
  const resultado = conjuntoSchema.safeParse(conjunto)
  if (!resultado.success) {
    return resultado.error.issues.map((i) => ({
      regra: i.path.includes('url') ? 'BV-07' : 'BV-01',
      onde: i.path.join('.') || '(raiz)',
      mensagem: i.message,
    }))
  }

  return [
    ...verificarReferencias(conjunto),
    ...verificarOrdemDasDatas(conjunto.vigencias),
    ...verificarSobreposicao(conjunto.vigencias),
    ...verificarVigenciaAberta(conjunto.vigencias),
    ...verificarFaixas(conjunto.vigencias),
    ...verificarTipoDoValor(conjunto),
  ]
}
