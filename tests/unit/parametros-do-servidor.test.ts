/**
 * O registro do servidor cobre TODA calculadora publicada.
 *
 * **O defeito que este arquivo existe para impedir já aconteceu.** CALC-050 foi
 * ao ar com quatro parâmetros legais cadastrados, calculando certo, e exibindo
 * abaixo do resultado o aviso de *"esta calculadora não consulta parâmetro legal
 * com vigência"*. O conjunto novo não estava na lista escrita à mão que a página
 * usava para montar o registro do servidor, e sem cobertura resolvida o
 * componente escolhe a redação de calculadora sem fundamento legal.
 *
 * Num produto cuja tese é a auditabilidade, **negar fundamento legal onde há é
 * tão grave quanto alegá-lo onde não há** — e o segundo caso já tinha sido
 * corrigido duas vezes, com nota em `Calculadora.tsx`. O primeiro passou porque
 * nada o verificava.
 *
 * São duas verificações, e a segunda é a que fecha a porta:
 *
 *   1. Toda calculadora que declara `parametrosRequeridos` tem cobertura
 *      resolvível no registro do servidor.
 *   2. Todo conjunto de parâmetros que existe em disco está na lista única.
 */

import { readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

import { CALCULADORAS } from '../../src/lib/calculadoras'
import { TODOS_OS_CONJUNTOS } from '../../src/lib/params/data/todos'
import { construirRegistro } from '../../src/lib/params/registry'
import type { ConjuntoDeParametros } from '../../src/lib/params/tipos'

const registro = construirRegistro(...TODOS_OS_CONJUNTOS)

describe('registro do servidor', () => {
  const comParametros = CALCULADORAS.filter((c) => c.parametrosRequeridos.length > 0)

  it('há calculadoras com parâmetro legal — senão o teste não verifica nada', () => {
    expect(comParametros.length).toBeGreaterThan(10)
  })

  it.each(comParametros.map((c) => [c.slug, c] as const))(
    '%s tem cobertura de vigência resolvível',
    (_slug, calculadora) => {
      for (const parametroId of calculadora.parametrosRequeridos) {
        expect(
          registro.cobertura(parametroId),
          `${calculadora.slug} exige "${parametroId}", que o registro do servidor não conhece`,
        ).not.toBeNull()
      }

      /**
       * A cobertura COMBINADA é a que a página usa, e ela é a interseção — pode
       * ser nula mesmo com todos os parâmetros existindo, se as vigências não se
       * sobrepuserem. É esse valor que decide qual aviso aparece na tela.
       */
      expect(
        registro.coberturaCombinada(calculadora.parametrosRequeridos),
        `${calculadora.slug}: as vigências exigidas não se sobrepõem`,
      ).not.toBeNull()
    },
  )

  /**
   * A verificação que impede a divergência de voltar: a lista única precisa
   * conter todo conjunto que existe em disco.
   */
  it('a lista única contém todos os conjuntos do diretório', async () => {
    const dir = path.resolve(__dirname, '../../src/lib/params/data')
    const arquivos = readdirSync(dir).filter(
      (f) => f.endsWith('.ts') && f !== 'fontes.ts' && f !== 'todos.ts',
    )

    const emDisco: string[] = []
    for (const arquivo of arquivos) {
      const modulo: Record<string, unknown> = await import(
        /* @vite-ignore */ pathToFileURL(path.join(dir, arquivo)).href
      )
      for (const [nome, valor] of Object.entries(modulo)) {
        if (ehConjunto(valor)) emDisco.push(`${arquivo} → ${nome}`)
      }
    }

    /**
     * Sem esta linha o teste passaria com zero conjuntos encontrados — um
     * verificador que sempre passa é pior que verificador ausente (§7.5).
     */
    expect(emDisco.length, 'nenhum conjunto foi encontrado em disco').toBeGreaterThan(5)
    expect(emDisco.length, emDisco.join(' · ')).toBe(TODOS_OS_CONJUNTOS.length)
  })
})

function ehConjunto(valor: unknown): valor is ConjuntoDeParametros {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    Array.isArray((valor as ConjuntoDeParametros).parametros) &&
    Array.isArray((valor as ConjuntoDeParametros).vigencias)
  )
}
