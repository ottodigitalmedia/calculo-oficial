/**
 * Normalização da resposta do provedor — `ADR-006` S-4.
 *
 * **Puro e separado do coletor de propósito.** O coletor faz rede, e rede não se
 * testa sem ficção. Tudo o que decide se um dado entra no cache mora aqui, e é
 * exercitado por caso-ouro com as respostas **reais** que a medição de
 * 02/08/2026 capturou — inclusive as três armadilhas que a ficha do projeto
 * irmão não listava.
 *
 * AS ARMADILHAS QUE ESTE MÓDULO EXISTE PARA NEUTRALIZAR
 *
 * Medidas com requisição real ao serviço, e registradas em `docs/20`:
 *
 * 1. `valor` vem como **string** com ponto decimal, nunca como número.
 * 2. `data` vem em `dd/MM/aaaa`, nunca em ISO.
 * 3. **A ordem não é garantida e difere por série.** A `4189` volta decrescente
 *    e a `433` volta crescente, na mesma chamada `ultimos/N`. Ler o último item
 *    do array como "o mais recente" acerta numa e erra na outra — e erra
 *    devolvendo um valor plausível, que é a pior forma de errar.
 * 4. **O schema não é uniforme.** A TR e a poupança trazem um terceiro campo,
 *    `dataFim`, que as demais não têm. Validador que recusa campo desconhecido
 *    rejeitaria as duas séries inteiras.
 */

import { ESCALA_DO_PERCENTUAL, type PercentualEscalado, type PontoDaSerie } from './tipos'
import type { DataISO } from '../params/tipos'

/** Casas decimais que a escala comporta. Ver `PercentualEscalado`. */
const CASAS_DA_ESCALA = 4

/**
 * Converte o valor textual do provedor em inteiro escalado.
 *
 * **Sem ponto flutuante em momento algum** (`ADR-004` A-6/A-7): a string é
 * decomposta em sinal, parte inteira e parte fracionária, e recomposta por
 * multiplicação inteira. `Number("0.1729") * 10000` daria 1728,9999999999998 em
 * alguns casos, e o truncamento seguinte perderia um milésimo sem alarde.
 *
 * Devolve `null` quando o formato não é o esperado — inclusive quando vêm mais
 * casas decimais do que a escala comporta. Precisão maior que a declarada não é
 * um detalhe a truncar em silêncio: é sinal de que a série mudou de formato, e
 * `S-4` manda rejeitar e ficar com o valor em cache.
 */
export function valorParaEscala(bruto: string): PercentualEscalado | null {
  const encontrado = /^(-)?(\d+)(?:\.(\d+))?$/.exec(bruto.trim())
  if (!encontrado) return null

  const [, sinal, inteiro, fracao] = encontrado
  if (inteiro === undefined) return null
  if (fracao !== undefined && fracao.length > CASAS_DA_ESCALA) return null

  const casas = (fracao ?? '').padEnd(CASAS_DA_ESCALA, '0')
  const magnitude = Number(inteiro) * ESCALA_DO_PERCENTUAL + Number(casas)
  if (!Number.isSafeInteger(magnitude)) return null

  return sinal === '-' ? -magnitude : magnitude
}

/**
 * Converte `dd/MM/aaaa` em `AAAA-MM-DD`.
 *
 * Parsing explícito, e nunca `new Date(string)`: o construtor aceitaria a forma
 * errada em silêncio e devolveria `Invalid Date` ou uma data deslocada pelo
 * fuso de quem roda o build. É a mesma regra que vale no motor.
 */
export function dataParaIso(bruto: string): DataISO | null {
  const encontrado = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(bruto.trim())
  if (!encontrado) return null

  const [, dia, mes, ano] = encontrado
  if (dia === undefined || mes === undefined || ano === undefined) return null

  const d = Number(dia)
  const m = Number(mes)
  if (m < 1 || m > 12 || d < 1 || d > 31) return null

  return `${ano}-${mes}-${dia}` as DataISO
}

/** O que o provedor devolve, com os campos que interessam. */
interface PontoBruto {
  readonly data?: unknown
  readonly valor?: unknown
}

export interface ResultadoDaNormalizacao {
  readonly pontos: readonly PontoDaSerie[]
  /** Motivos de descarte, para o coletor registrar aviso. */
  readonly descartados: readonly string[]
}

/**
 * Valida e normaliza a resposta inteira.
 *
 * **Não rejeita campo desconhecido** — armadilha 4. O contrato é "cada item tem
 * `data` e `valor` legíveis"; o que mais vier junto é ignorado, e não motivo de
 * recusa.
 *
 * **Ordena por data ao final** — armadilha 3. A ordem da origem não é garantida,
 * e todo o resto do sistema assume que o último ponto é o mais recente.
 */
export function normalizar(
  bruto: unknown,
  limites: { readonly minimo: number; readonly maximo: number },
): ResultadoDaNormalizacao {
  if (!Array.isArray(bruto)) {
    return { pontos: [], descartados: ['a resposta não é uma lista'] }
  }

  const pontos: PontoDaSerie[] = []
  const descartados: string[] = []

  for (const item of bruto as readonly PontoBruto[]) {
    if (item === null || typeof item !== 'object') {
      descartados.push('item que não é objeto')
      continue
    }
    if (typeof item.data !== 'string' || typeof item.valor !== 'string') {
      descartados.push('item sem data ou valor em texto')
      continue
    }

    const data = dataParaIso(item.data)
    if (data === null) {
      descartados.push(`data fora do formato dd/MM/aaaa: ${item.data}`)
      continue
    }

    const valor = valorParaEscala(item.valor)
    if (valor === null) {
      descartados.push(`valor fora do formato esperado: ${item.valor}`)
      continue
    }

    // `S-4`: intervalo plausível. Um valor absurdo é sintoma de série trocada
    // ou de mudança de unidade na origem, e nos dois casos o cache é melhor.
    if (valor < limites.minimo || valor > limites.maximo) {
      descartados.push(`valor fora do intervalo plausível: ${item.valor}`)
      continue
    }

    pontos.push({ data, valor })
  }

  pontos.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0))

  return { pontos, descartados }
}
