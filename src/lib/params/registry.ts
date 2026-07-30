/**
 * Consulta de parâmetros por data de referência — `RN-002`, `RN-003`, `RN-004`.
 *
 * Zero dependência de runtime: o motor importa este módulo (`04-architecture`
 * §5) e `ADR-003` não admite cadeia de dependências ali.
 *
 * O índice é construído uma vez, na inicialização, conforme `05-data-model` §9.
 * A busca é binária sobre intervalos ordenados — mas a razão de ser binária não
 * é desempenho: com poucas vigências por parâmetro, varredura linear serviria.
 * É que a ordenação prévia é o que permite responder o **intervalo disponível**
 * quando a data não é coberta, e essa mensagem é requisito de `RN-003`.
 */

import type {
  ConjuntoDeParametros,
  DataISO,
  Fonte,
  IntervaloCobertura,
  Parametro,
  ResultadoVigencia,
  Vigencia,
} from './tipos'

interface IndiceDeParametro {
  readonly parametro: Parametro
  /** Vigências ordenadas por `inicio` crescente, sem sobreposição (BV-02). */
  readonly vigencias: readonly Vigencia[]
}

export interface Registro {
  /** Resolve o parâmetro vigente na data. `RN-002`, `RN-003`. */
  resolver(parametroId: string, dataReferencia: DataISO): ResultadoVigencia
  /** Intervalo coberto por um parâmetro, ou `null` se ele não existe. */
  cobertura(parametroId: string): IntervaloCobertura | null
  /**
   * Interseção da cobertura de vários parâmetros — a restrição `C-1`.
   *
   * É o intervalo de datas que uma calculadora aceita, e `05-data-model` diz
   * que ele é calculado, nunca escrito à mão. `null` quando algum parâmetro
   * não existe ou quando as coberturas não se sobrepõem.
   */
  coberturaCombinada(parametrosIds: readonly string[]): IntervaloCobertura | null
  /**
   * Anos que o seletor de vigência pode oferecer, do mais recente ao mais
   * antigo.
   *
   * Derivado das vigências reais, não do intervalo de cobertura. A cobertura
   * termina em `null` quando a vigência mais recente está aberta, e `null` não
   * diz qual é o ano mais recente — usá-lo como limite fazia o seletor exibir
   * um ano e o cálculo usar outro.
   */
  anosDisponiveis(parametrosIds: readonly string[]): readonly number[]
  readonly parametros: readonly Parametro[]
}

/**
 * Uma data está dentro de `[inicio, fim]`?
 *
 * Comparação lexicográfica de texto `AAAA-MM-DD`, que em ISO equivale à
 * cronológica. Sem `Date`, sem fuso, sem alocação. Ver a nota em `DataISO`.
 */
function cobre(vigencia: Vigencia, data: DataISO): boolean {
  if (data < vigencia.inicio) return false
  // `fim` nulo = vigente indefinidamente (RN-004).
  return vigencia.fim === null || data <= vigencia.fim
}

/** Busca binária pela vigência que cobre a data. `null` se nenhuma cobre. */
function buscar(vigencias: readonly Vigencia[], data: DataISO): Vigencia | null {
  let baixo = 0
  let alto = vigencias.length - 1

  while (baixo <= alto) {
    const meio = (baixo + alto) >> 1
    const candidata = vigencias[meio]
    if (candidata === undefined) break

    if (cobre(candidata, data)) return candidata
    if (data < candidata.inicio) alto = meio - 1
    else baixo = meio + 1
  }
  return null
}

function descreverCobertura(c: IntervaloCobertura): string {
  return c.fim === null ? `de ${c.inicio} em diante` : `de ${c.inicio} a ${c.fim}`
}

/**
 * Constrói o registro a partir de um ou mais conjuntos de dados.
 *
 * Não valida: validação é BV-01 a BV-09, no build, antes de qualquer teste
 * (`13-deployment` §4). Repetir aqui custaria tempo em toda inicialização para
 * detectar, tarde, o que o pipeline já barrou cedo.
 *
 * A única exceção é a ordenação — feita aqui porque a busca binária depende
 * dela e depender da ordem em que alguém escreveu o arquivo seria frágil.
 */
export function construirRegistro(...conjuntos: readonly ConjuntoDeParametros[]): Registro {
  const fontes = new Map<string, Fonte>()
  const indices = new Map<string, IndiceDeParametro>()
  const porParametro = new Map<string, Vigencia[]>()

  for (const conjunto of conjuntos) {
    for (const f of conjunto.fontes) fontes.set(f.id, f)
    for (const v of conjunto.vigencias) {
      const lista = porParametro.get(v.parametroId)
      if (lista) lista.push(v)
      else porParametro.set(v.parametroId, [v])
    }
  }

  const todosParametros: Parametro[] = []
  for (const conjunto of conjuntos) {
    for (const p of conjunto.parametros) {
      todosParametros.push(p)
      const vigencias = (porParametro.get(p.id) ?? []).slice().sort((a, b) =>
        a.inicio < b.inicio ? -1 : a.inicio > b.inicio ? 1 : 0,
      )
      indices.set(p.id, { parametro: p, vigencias })
    }
  }

  function cobertura(parametroId: string): IntervaloCobertura | null {
    const indice = indices.get(parametroId)
    if (!indice || indice.vigencias.length === 0) return null
    const primeira = indice.vigencias[0]
    const ultima = indice.vigencias[indice.vigencias.length - 1]
    if (!primeira || !ultima) return null
    return { inicio: primeira.inicio, fim: ultima.fim }
  }

  return {
    parametros: todosParametros,

    cobertura,

    resolver(parametroId, dataReferencia) {
      const indice = indices.get(parametroId)
      if (!indice) {
        return {
          ok: false,
          motivo: 'parametro_desconhecido',
          detalhe: `Parâmetro "${parametroId}" não existe no registro.`,
        }
      }

      const vigencia = buscar(indice.vigencias, dataReferencia)
      if (!vigencia) {
        // RN-003: nunca extrapolar. Bloquear e informar o intervalo disponível.
        // A lacuna é informação honesta — a extrapolação produziria um número
        // errado com aparência de certo.
        const c = cobertura(parametroId)
        return {
          ok: false,
          motivo: 'vigencia_ausente',
          detalhe: c
            ? `Sem parâmetro "${parametroId}" para ${dataReferencia}. Disponível ${descreverCobertura(c)}.`
            : `Parâmetro "${parametroId}" não tem nenhuma vigência cadastrada.`,
          ...(c ? { cobertura: c } : {}),
        }
      }

      const fonte = fontes.get(vigencia.fonteId)
      if (!fonte) {
        // Só acontece se BV-01 tiver sido contornado. RN-029 exige a fonte na
        // memória de cálculo, então resolver sem ela seria pior que falhar.
        return {
          ok: false,
          motivo: 'parametro_desconhecido',
          detalhe: `Vigência "${vigencia.id}" referencia fonte inexistente "${vigencia.fonteId}".`,
        }
      }

      return { ok: true, resolvida: { parametro: indice.parametro, vigencia, fonte } }
    },

    anosDisponiveis(parametrosIds) {
      const combinada = this.coberturaCombinada(parametrosIds)
      if (!combinada) return []

      const ano = (d: DataISO) => Number(d.slice(0, 4))
      let ultimo = ano(combinada.inicio)

      // O ano mais recente vem das vigências, não da cobertura: se a mais nova
      // está aberta, `fim` é nulo e não informa ano algum.
      for (const id of parametrosIds) {
        for (const v of indices.get(id)?.vigencias ?? []) {
          ultimo = Math.max(ultimo, ano(v.inicio))
          if (v.fim !== null) ultimo = Math.max(ultimo, ano(v.fim))
        }
      }
      if (combinada.fim !== null) ultimo = Math.min(ultimo, ano(combinada.fim))

      const anos: number[] = []
      for (let a = ultimo; a >= ano(combinada.inicio); a--) anos.push(a)
      return anos
    },

    coberturaCombinada(parametrosIds) {
      if (parametrosIds.length === 0) return null

      let inicio: DataISO | null = null
      let fim: DataISO | null = null
      let algumAberto = false

      for (const id of parametrosIds) {
        const c = cobertura(id)
        if (!c) return null
        if (inicio === null || c.inicio > inicio) inicio = c.inicio
        if (c.fim === null) algumAberto = true
        else if (fim === null || c.fim < fim) fim = c.fim
      }

      if (inicio === null) return null

      // Interseção fechada só é aberta se TODOS forem abertos: basta um
      // parâmetro encerrado para limitar o conjunto.
      const fimFinal = algumAberto && fim === null ? null : fim
      if (fimFinal !== null && fimFinal < inicio) return null

      return { inicio, fim: fimFinal }
    },
  }
}
