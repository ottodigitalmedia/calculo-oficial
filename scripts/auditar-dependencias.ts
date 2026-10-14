/**
 * AM-01 — auditoria de dependências do pipeline (`07-security` §8).
 *
 * Era `npm audit --audit-level=high`, e em 14/10/2026 ele passou a reprovar
 * todo deploy por um alerta **sem correção publicada**: `braces` ≤ 3.0.3
 * (GHSA-vfj7-8cjw-p6xm), que entra só pelo plugin de lint do Next e roda sobre
 * padrões de arquivo escritos por nós — não é alcançável em produção. As
 * opções eram baixar o nível do audit, tirar o lint do Next ou travar todo
 * deploy até alguém publicar uma versão. As três pioravam o projeto.
 *
 * A regra agora tem duas camadas, e nenhuma é mais frouxa que a anterior onde
 * importa:
 *
 * 1. **Produção não tem exceção.** Vulnerabilidade alta ou crítica em
 *    dependência que vai para a imagem reprova, sempre.
 * 2. **Desenvolvimento reprova igual**, salvo alerta listado em `EXCECOES` —
 *    um a um, pelo identificador, com o motivo e uma data de validade. Exceção
 *    vencida reprova, para que ninguém a esqueça aqui.
 *
 * Uso: `npm run audit:deps`.
 */

import { execSync } from 'node:child_process'

interface Excecao {
  /** Identificador do alerta, como aparece na URL do GitHub Advisory. */
  readonly alerta: string
  readonly pacote: string
  readonly motivo: string
  /** Último dia em que a exceção vale (AAAA-MM-DD). */
  readonly valeAte: string
}

const EXCECOES: readonly Excecao[] = [
  {
    alerta: 'GHSA-vfj7-8cjw-p6xm',
    pacote: 'braces',
    motivo:
      'Sem versão corrigida publicada (afeta ≤ 3.0.3, a mais recente). Entra só por ' +
      '@next/eslint-plugin-next → fast-glob → micromatch, em tempo de lint, sobre padrões ' +
      'do próprio repositório. Não vai para a imagem de produção.',
    valeAte: '2026-12-31',
  },
]

const GRAVES = new Set(['high', 'critical'])

interface Via {
  readonly url?: string
  readonly severity?: string
  readonly name?: string
}

interface Vulnerabilidade {
  readonly severity: string
  readonly via: readonly (string | Via)[]
}

function auditar(argumentos: string): Record<string, Vulnerabilidade> {
  // `npm audit` sai com código diferente de zero quando acha algo; o JSON vem
  // do mesmo jeito, e é ele que decide.
  let saida: string
  try {
    saida = execSync(`npm audit --json ${argumentos}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (erro) {
    saida = (erro as { stdout?: string }).stdout ?? ''
  }
  const dados = JSON.parse(saida) as { vulnerabilities?: Record<string, Vulnerabilidade> }
  return dados.vulnerabilities ?? {}
}

/** Os alertas graves, pelo identificador — os que estão na origem de cada cadeia. */
function alertasGraves(vulns: Record<string, Vulnerabilidade>): Map<string, string> {
  const alertas = new Map<string, string>()
  for (const [pacote, v] of Object.entries(vulns)) {
    for (const via of v.via) {
      if (typeof via === 'string' || !via.url || !GRAVES.has(via.severity ?? '')) continue
      const id = via.url.split('/').pop() ?? via.url
      alertas.set(id, via.name ?? pacote)
    }
  }
  return alertas
}

const hoje = new Date().toISOString().slice(0, 10)
const falhas: string[] = []

const deProducao = alertasGraves(auditar('--omit=dev'))
for (const [id, pacote] of deProducao) {
  falhas.push(`${pacote} (${id}) — dependência de PRODUÇÃO; aqui não há exceção.`)
}

const todos = alertasGraves(auditar(''))
for (const [id, pacote] of todos) {
  if (deProducao.has(id)) continue
  const excecao = EXCECOES.find((e) => e.alerta === id)
  if (!excecao) {
    falhas.push(`${pacote} (${id}) — sem exceção registrada.`)
  } else if (excecao.valeAte < hoje) {
    falhas.push(`${pacote} (${id}) — a exceção venceu em ${excecao.valeAte}. Reavalie.`)
  } else {
    console.log(`  exceção  ${pacote} (${id}) até ${excecao.valeAte}: ${excecao.motivo}`)
  }
}

for (const e of EXCECOES) {
  if (!todos.has(e.alerta)) {
    console.log(`  aviso    a exceção de ${e.pacote} (${e.alerta}) não é mais necessária — retire-a.`)
  }
}

if (falhas.length > 0) {
  console.error('AM-01 · vulnerabilidade alta ou crítica:')
  for (const f of falhas) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`AM-01 · produção sem vulnerabilidade alta ou crítica; ${todos.size} alerta(s) de desenvolvimento, todos com exceção válida.`)
