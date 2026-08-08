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

import { readFileSync } from 'node:fs'

import { CALCULADORAS } from '../src/lib/calculadoras'
import { TODOS_OS_CONJUNTOS } from '../src/lib/params/data/todos'
import { construirRegistro } from '../src/lib/params/registry'
import { verificarConjunto, type Violacao } from '../src/lib/params/schema'
import type { ConjuntoDeParametros } from '../src/lib/params/tipos'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR_DADOS = path.join(RAIZ, 'src', 'lib', 'params', 'data')
const DIR_OURO = path.join(RAIZ, 'tests', 'golden')

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

/**
 * BV-08 · toda calculadora tem cobertura de vigência para os parâmetros que exige.
 *
 * Restrição `C-1`. Uma calculadora cujo parâmetro não cobre a data escolhida não
 * quebra: ela **recusa educadamente**, o que é o comportamento certo e o
 * sintoma mais fácil de não notar. Foi assim que CALC-006 foi ao ar sem
 * calcular — a data padrão caía fora da vigência dos parâmetros de jornada.
 *
 * Aqui a conferência é estrutural, e não por data: o parâmetro exigido precisa
 * **existir**, e a interseção das coberturas precisa produzir algum intervalo.
 * Interseção vazia significa que duas vigências exigidas nunca coincidem, e
 * nesse caso não há data nenhuma em que a calculadora funcione.
 */
function verificarBv08(): Violacao[] {
  const registro = construirRegistro(...TODOS_OS_CONJUNTOS)
  const violacoes: Violacao[] = []

  for (const c of CALCULADORAS) {
    for (const id of c.parametrosRequeridos) {
      if (registro.maisRecente(id) === null) {
        violacoes.push({
          regra: 'BV-08',
          onde: `${c.id} ${c.slug} › ${id}`,
          mensagem:
            `A calculadora exige o parâmetro "${id}", que não existe em ` +
            `src/lib/params/. Ou o identificador está errado, ou o parâmetro ` +
            `nunca foi cadastrado com fonte oficial.`,
        })
      }
    }

    if (c.parametrosRequeridos.length > 0 && !registro.coberturaCombinada(c.parametrosRequeridos)) {
      violacoes.push({
        regra: 'BV-08',
        onde: `${c.id} ${c.slug}`,
        mensagem:
          `A interseção das vigências exigidas é vazia (C-1): não existe data ` +
          `em que esta calculadora consiga calcular. Confira as coberturas de ` +
          `${c.parametrosRequeridos.join(', ')}.`,
      })
    }
  }

  return violacoes
}

/**
 * BV-09 · todo arquivo de casos-ouro declara a origem dos valores esperados.
 *
 * Regra `CO-1` / regra 10 de `CLAUDE.md`: **caso-ouro nunca vem de outro site.**
 * É a verificação que protege o pior defeito possível deste produto — publicar
 * um número errado com aparência de certo, copiado de um concorrente.
 *
 * ## POR QUE ELA ACEITA DUAS FORMAS DE ESCREVER, E NÃO UMA
 *
 * `12-test-plan` fala em `fonte_verificacao`, e nove arquivos usam esse termo.
 * Os outros quarenta declaram a mesma coisa sob o título "ORIGEM DOS VALORES
 * ESPERADOS, DECLARADA" — e declaram bem: `rescisao.test.ts` explica que não há
 * exemplo oficial resolvido de rescisão e que cada valor vem do dispositivo,
 * apontando `docs/19`; `credito.test.ts` explica que o esperado é identidade
 * matemática verificada por construção, mais forte que tabela externa.
 *
 * Exigir só um dos dois termos reprovaria quarenta arquivos **que cumprem a
 * regra**, e o caminho mais curto para calar a verificação seria colar o termo
 * em cada cabeçalho sem ler nada. Verificação que se satisfaz com carimbo é
 * pior que verificação nenhuma.
 *
 * ## O QUE ELA DE FATO PEGA
 *
 * Arquivo de casos-ouro **novo** que nasça sem declarar de onde vieram os
 * números. É o momento em que a regra é violada — depois, ninguém revisita.
 * O que ela não alcança é a veracidade da declaração: isso é auditoria humana,
 * como `12-test-plan` §11 já diz da transcrição das tabelas.
 */
const MARCADORES_DE_ORIGEM = [/fonte_verificacao/i, /ORIGEM DOS VALORES/i]

function verificarBv09(): Violacao[] {
  if (!existsSync(DIR_OURO)) return []

  const violacoes: Violacao[] = []
  const arquivos = readdirSync(DIR_OURO).filter((f) => f.endsWith('.test.ts'))

  for (const arquivo of arquivos) {
    const texto = readFileSync(path.join(DIR_OURO, arquivo), 'utf8')
    if (!MARCADORES_DE_ORIGEM.some((m) => m.test(texto))) {
      violacoes.push({
        regra: 'BV-09',
        onde: `tests/golden/${arquivo}`,
        mensagem:
          'Não declara de onde vieram os valores esperados (CO-1). Escreva no ' +
          'cabeçalho do arquivo, ou antes de cada bloco, um "fonte_verificacao:" ' +
          'com a norma, o exemplo oficial ou a identidade matemática que sustenta ' +
          'cada número. Resultado de outro site, de software de terceiro ou de ' +
          'modelo de linguagem não vale.',
      })
    }
  }

  return violacoes
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
  violacoes.push(...verificarBv08(), ...verificarBv09())

  console.log(
    `  Conjuntos: ${modulos.length} · fontes: ${n.fontes} · parâmetros: ${n.parametros} · vigências: ${n.vigencias} · faixas: ${n.faixas}\n`,
  )

  const casosOuro = readdirSync(DIR_OURO).filter((f) => f.endsWith('.test.ts')).length
  console.log(
    `  Calculadoras: ${CALCULADORAS.length} · arquivos de casos-ouro: ${casosOuro}\n`,
  )

  /**
   * BV-08 e BV-09 entraram em 08/08/2026, e o que havia no lugar delas era o
   * defeito que este projeto mais teme num verificador.
   *
   * As duas linhas eram `console.log` fixos: *"sem calculadoras registradas
   * (ENT-005 chega em T-010)"* e *"sem casos-ouro registrados (ENT-006 chega em
   * T-008)"*. Verdade quando foram escritas; falsa desde a primeira calculadora.
   * Com 76 calculadoras e 50 arquivos de casos-ouro no repositório, o relatório
   * seguia anunciando que não havia o que verificar — e fechava com "Sem
   * violações", que quem lê entende como "tudo conferido".
   *
   * **BV-09 é a verificação de `CO-1`**, a regra que impede caso-ouro copiado de
   * concorrente. Ela nunca rodou. Ver §7.75: verificador é código, e código que
   * ninguém executa não envelhece — apodrece.
   */
  const cobertas = ['BV-01', 'BV-02', 'BV-03', 'BV-04', 'BV-05', 'BV-06', 'BV-07', 'BV-08', 'BV-09']
  for (const regra of cobertas) {
    const desta = violacoes.filter((v) => v.regra === regra)
    console.log(`  ${desta.length === 0 ? 'ok    ' : 'FALHA '}${regra}  ${desta.length} violação(ões)`)
  }

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
