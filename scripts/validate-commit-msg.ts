/**
 * BV-12 — formato da mensagem de commit (12-test-plan §4, 05-data-model §5).
 *
 * Duas regras, com pesos muito diferentes:
 *
 *  1. Formato convencional com escopo obrigatório, para todo commit.
 *  2. Commit de parâmetro legal (`params(...)`) exige fonte, URL, forma de
 *     conferência e casos-ouro afetados.
 *
 * A segunda é a que importa. O histórico do Git é a trilha de auditoria deste
 * projeto — não há tabela `updated_by`, não há painel, não há banco
 * (05-data-model §5). Um commit de parâmetro sem fonte declarada é uma
 * alteração de constante legal que ninguém consegue reconstituir depois, e
 * "depois" costuma ser durante um incidente (15-runbook RB-06).
 *
 * Uso:
 *   tsx scripts/validate-commit-msg.ts <intervalo-git>
 *   tsx scripts/validate-commit-msg.ts abc123..def456
 *   tsx scripts/validate-commit-msg.ts            # padrão: HEAD~1..HEAD
 */

import { execFileSync } from 'node:child_process'

const TIPOS = [
  'feat',
  'fix',
  'docs',
  'chore',
  'test',
  'refactor',
  'perf',
  'ci',
  'build',
  'style',
  'revert',
  'params',
] as const

// Escopo obrigatório: `tipo(escopo): assunto`. CLAUDE.md, seção Commits.
const CABECALHO = new RegExp(`^(${TIPOS.join('|')})\\(([a-z0-9][a-z0-9._/-]*)\\): (.+)$`)

// Campos exigidos no corpo de um commit de parâmetro, na ordem em que
// aparecem no modelo de 05-data-model §5.
const CAMPOS_PARAMETRO = [
  'Fonte:',
  'URL:',
  'Verificado contra:',
  'Casos-ouro afetados:',
] as const

interface Commit {
  readonly sha: string
  readonly mensagem: string
}

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' })
}

function lerCommits(intervalo: string): Commit[] {
  // --no-merges: mensagem de merge é gerada pela ferramenta e não descreve
  // alteração alguma. Exigir formato dela seria ruído que ensina a ignorar
  // a verificação.
  // Separador de registro (0x1E) escrito como escape: não aparece em mensagem
  // de commit. Um separador "improvável" como espaço ou linha em branco
  // quebraria em qualquer corpo multiparágrafo — e os commits de parâmetro
  // são justamente os multiparágrafo.
  const sep = '\x1e'
  const bruto = git('log', '--no-merges', `--format=%H%n%B${sep}`, intervalo)
  return bruto
    .split(sep)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((bloco) => {
      const quebra = bloco.indexOf('\n')
      return quebra === -1
        ? { sha: bloco, mensagem: '' }
        : { sha: bloco.slice(0, quebra), mensagem: bloco.slice(quebra + 1).trim() }
    })
}

function validar(c: Commit): string[] {
  const erros: string[] = []
  const linhas = c.mensagem.split('\n')
  const cabecalho = linhas[0] ?? ''

  const m = CABECALHO.exec(cabecalho)
  if (!m) {
    erros.push(
      `cabeçalho fora do formato convencional com escopo obrigatório.\n` +
        `      esperado: tipo(escopo): assunto\n` +
        `      tipos:    ${TIPOS.join(', ')}\n` +
        `      recebido: ${cabecalho || '(vazio)'}`,
    )
    return erros
  }

  const [, tipo, , assunto] = m
  if (tipo !== 'params') return erros

  // --- daqui para baixo, só commits de parâmetro legal ---

  if (!/vig[êe]ncia a partir de \S+/i.test(assunto ?? '')) {
    erros.push(
      `commit params deve declarar a vigência no assunto.\n` +
        `      esperado: params(<parametro-id>): vigência a partir de <inicio>`,
    )
  }

  const corpo = linhas.slice(1).join('\n')
  for (const campo of CAMPOS_PARAMETRO) {
    const linha = corpo.split('\n').find((l) => l.trim().startsWith(campo))
    if (!linha) {
      erros.push(`campo obrigatório ausente no corpo: "${campo}"`)
      continue
    }
    if (!linha.slice(linha.indexOf(campo) + campo.length).trim()) {
      erros.push(`campo obrigatório vazio: "${campo}"`)
    }
  }

  const url = corpo.split('\n').find((l) => l.trim().startsWith('URL:'))
  if (url && !/https?:\/\/\S+/.test(url)) {
    erros.push(
      `"URL:" deve conter uma URL absoluta da fonte oficial.\n` +
        `      (o domínio oficial em si é verificado por BV-07, sobre o parâmetro)`,
    )
  }

  return erros
}

function main(): void {
  const intervalo = process.argv[2] ?? 'HEAD~1..HEAD'

  let commits: Commit[]
  try {
    commits = lerCommits(intervalo)
  } catch {
    console.log(`Intervalo "${intervalo}" não pôde ser lido — nada a verificar.`)
    return
  }

  if (commits.length === 0) {
    console.log(`Nenhum commit em "${intervalo}".`)
    return
  }

  let reprovados = 0
  for (const c of commits) {
    const erros = validar(c)
    const curto = c.sha.slice(0, 7)
    if (erros.length === 0) {
      console.log(`  ok    ${curto}  ${c.mensagem.split('\n')[0]}`)
      continue
    }
    reprovados++
    console.error(`  FALHA ${curto}  ${c.mensagem.split('\n')[0]}`)
    for (const e of erros) console.error(`      → ${e}`)
  }

  if (reprovados > 0) {
    console.error(
      [
        '',
        `BV-12: ${reprovados} de ${commits.length} commits fora do formato.`,
        '',
        'Modelo de commit de parâmetro legal (05-data-model §5):',
        '',
        '    params(<parametro-id>): vigência a partir de <inicio>',
        '',
        '    Fonte: <norma e dispositivo>',
        '    URL: <url oficial>',
        '    Verificado contra: <como foi conferido>',
        '    Casos-ouro afetados: <ids>',
        '',
      ].join('\n'),
    )
    process.exit(1)
  }

  console.log(`\nBV-12: ${commits.length} commits conformes.`)
}

main()
