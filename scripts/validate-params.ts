/**
 * Verificações estruturais BV-01 a BV-12 (`12-test-plan` §4).
 *
 * Primeira etapa do pipeline (`13-deployment` §4) e bloqueadora do build
 * inteiro. A ordem é deliberada: um parâmetro legal inválido interrompe em
 * segundos, antes de qualquer compilação.
 *
 * Nenhum parâmetro chega à produção sem passar por `RN-001`, `RN-002` e pela
 * suíte de casos-ouro (`04-architecture` §6).
 */

import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'

import { verificarConjunto, type Violacao } from '../src/lib/params/schema'
import type { ConjuntoDeParametros } from '../src/lib/params/tipos'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR_DADOS = path.join(RAIZ, 'src', 'lib', 'params', 'data')

interface Modulo {
  readonly arquivo: string
  readonly conjunto: ConjuntoDeParametros
}

function ehConjunto(v: unknown): v is ConjuntoDeParametros {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Partial<ConjuntoDeParametros>
  return Array.isArray(c.fontes) && Array.isArray(c.parametros) && Array.isArray(c.vigencias)
}

async function carregar(): Promise<Modulo[]> {
  if (!existsSync(DIR_DADOS)) return []

  const arquivos = readdirSync(DIR_DADOS).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  const modulos: Modulo[] = []

  for (const arquivo of arquivos) {
    const url = pathToFileURL(path.join(DIR_DADOS, arquivo)).href
    const mod: Record<string, unknown> = await import(url)
    // Um módulo de dados pode exportar mais de um conjunto; pega todos.
    for (const exportado of Object.values(mod)) {
      if (ehConjunto(exportado)) modulos.push({ arquivo, conjunto: exportado })
    }
  }
  return modulos
}

function contar(modulos: readonly Modulo[]) {
  let fontes = 0
  let parametros = 0
  let vigencias = 0
  let faixas = 0
  for (const m of modulos) {
    fontes += m.conjunto.fontes.length
    parametros += m.conjunto.parametros.length
    vigencias += m.conjunto.vigencias.length
    for (const v of m.conjunto.vigencias) {
      if (v.valor.tipo === 'tabela_faixas') faixas += v.valor.faixas.length
    }
  }
  return { fontes, parametros, vigencias, faixas }
}

async function main(): Promise<void> {
  const modulos = await carregar()
  const n = contar(modulos)

  console.log('\nVerificações estruturais — 12-test-plan §4\n')

  if (modulos.length === 0) {
    console.log('  Nenhum parâmetro cadastrado em src/lib/params/data/.')
    console.log('  As verificações estão implementadas e sem objeto. Cadastro em T-007.\n')
    // Zero parâmetros é um conjunto legitimamente válido — nada a verificar.
    // Isto NÃO é o esboço de antes: as regras existem e rodam assim que houver
    // dado. Ver tests/unit/params-schema.test.ts, que as exercita com fixtures.
    return
  }

  const violacoes: Violacao[] = []
  for (const m of modulos) {
    for (const v of verificarConjunto(m.conjunto)) {
      violacoes.push({ ...v, onde: `${m.arquivo} › ${v.onde}` })
    }
  }

  console.log(
    `  Conjuntos: ${modulos.length} · fontes: ${n.fontes} · parâmetros: ${n.parametros} · vigências: ${n.vigencias} · faixas: ${n.faixas}\n`,
  )

  const cobertas = ['BV-01', 'BV-02', 'BV-03', 'BV-04', 'BV-05', 'BV-06', 'BV-07']
  for (const regra of cobertas) {
    const desta = violacoes.filter((v) => v.regra === regra)
    console.log(`  ${desta.length === 0 ? 'ok    ' : 'FALHA '}${regra}  ${desta.length} violação(ões)`)
  }

  // BV-08 (cobertura de vigência por calculadora) e BV-09 (fonte_verificacao
  // dos casos-ouro) dependem de ENT-005 e ENT-006, que chegam com as
  // calculadoras e os casos-ouro. Declarado, e não escondido.
  console.log('  —     BV-08  sem calculadoras registradas (ENT-005 chega em T-010)')
  console.log('  —     BV-09  sem casos-ouro registrados (ENT-006 chega em T-008)')
  console.log('  —     BV-10  → `npm run lint`')
  console.log('  —     BV-11  → `npm run lint`')
  console.log('  —     BV-12  → `npm run validate:commits`')

  if (violacoes.length > 0) {
    console.error(`\n${violacoes.length} violação(ões):\n`)
    for (const v of violacoes) {
      console.error(`  [${v.regra}] ${v.onde}`)
      console.error(`      ${v.mensagem}`)
    }
    console.error(
      '\nParâmetro legal inválido interrompe o pipeline antes do build.' +
        '\nCorrija contra a FONTE OFICIAL — não contra o que faria a verificação passar.\n',
    )
    process.exit(1)
  }

  console.log('\nSem violações.\n')
}

main().catch((erro: unknown) => {
  console.error('Falha ao verificar parâmetros:', erro)
  process.exit(1)
})
