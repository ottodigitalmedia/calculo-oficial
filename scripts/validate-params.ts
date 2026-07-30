/**
 * Verificações estruturais BV-01 a BV-12 (12-test-plan §4).
 *
 * Primeira etapa do pipeline (13-deployment §4) e bloqueador do build inteiro.
 * A ordem é deliberada: um parâmetro legal inválido interrompe em segundos,
 * antes de qualquer compilação.
 *
 * ESTADO: esboço de T-001. As verificações são implementadas em T-006, junto
 * do carregador de parâmetros — não faz sentido validar um modelo que ainda
 * não existe.
 *
 * Este esboço tem uma propriedade deliberada: ele NÃO permanece verde depois
 * que os parâmetros aparecerem. Ver `aindaNaoHaParametros()` abaixo. Um
 * validador que passa sem validar é pior que validador nenhum, porque produz
 * a sensação de cobertura que impede alguém de procurar a real.
 */

import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR_PARAMS = path.join(RAIZ, 'src', 'lib', 'params')

type Responsavel = 'validate:params' | 'lint' | 'ci'

interface Verificacao {
  readonly id: string
  readonly descricao: string
  readonly regra: string
  readonly onde: Responsavel
}

const VERIFICACOES: readonly Verificacao[] = [
  { id: 'BV-01', descricao: 'Todo parâmetro tem vigência, fonte e URL', regra: 'RN-001', onde: 'validate:params' },
  { id: 'BV-02', descricao: 'Nenhuma sobreposição de vigência do mesmo parâmetro', regra: 'RN-002, V-1', onde: 'validate:params' },
  { id: 'BV-03', descricao: 'No máximo uma vigência aberta por parâmetro', regra: 'V-3', onde: 'validate:params' },
  { id: 'BV-04', descricao: '`fim` posterior a `inicio`', regra: 'V-2', onde: 'validate:params' },
  { id: 'BV-05', descricao: 'Faixas contíguas, sem lacuna nem sobreposição', regra: 'FX-1, FX-2', onde: 'validate:params' },
  { id: 'BV-06', descricao: 'Formato de `valor` corresponde ao tipo do parâmetro', regra: 'V-4', onde: 'validate:params' },
  { id: 'BV-07', descricao: 'URL de fonte em domínio oficial', regra: 'F-1', onde: 'validate:params' },
  { id: 'BV-08', descricao: 'Toda calculadora tem cobertura de vigência para seus parâmetros', regra: 'C-1', onde: 'validate:params' },
  { id: 'BV-09', descricao: 'Todo caso-ouro declara `fonte_verificacao` não vazia', regra: 'CO-1', onde: 'validate:params' },
  { id: 'BV-10', descricao: 'Nenhum literal monetário fora do motor de parâmetros', regra: 'RN-001', onde: 'lint' },
  { id: 'BV-11', descricao: 'Nenhuma operação de ponto flutuante sobre valor monetário', regra: 'RN-005', onde: 'lint' },
  { id: 'BV-12', descricao: 'Mensagem de commit de parâmetro no formato exigido', regra: '05-data-model §5', onde: 'ci' },
]

/**
 * Há parâmetros cadastrados?
 *
 * Enquanto não houver, as verificações de estrutura não têm o que verificar e
 * o esboço pode passar. A partir do momento em que houver, passar seria
 * mentira — e o processo falha, apontando para T-006.
 */
function aindaNaoHaParametros(): boolean {
  const dirDados = path.join(DIR_PARAMS, 'data')
  if (!existsSync(dirDados)) return true
  return readdirSync(dirDados).filter((f) => f.endsWith('.ts')).length === 0
}

function main(): void {
  const doValidador = VERIFICACOES.filter((v) => v.onde === 'validate:params')
  const delegadas = VERIFICACOES.filter((v) => v.onde !== 'validate:params')

  console.log('\nVerificações estruturais — 12-test-plan §4\n')

  for (const v of doValidador) {
    console.log(`  PENDENTE  ${v.id}  ${v.descricao}  (${v.regra})`)
  }
  for (const v of delegadas) {
    console.log(`  DELEGADA  ${v.id}  ${v.descricao}  → \`npm run ${v.onde}\``)
  }

  if (!aindaNaoHaParametros()) {
    console.error(
      [
        '',
        'FALHA — há parâmetros cadastrados em src/lib/params/data/ e as',
        'verificações BV-01 a BV-09 ainda são esboço.',
        '',
        'Nenhum parâmetro legal chega à produção sem passar por RN-001, RN-002',
        'e pela suíte de casos-ouro (04-architecture §6). Implemente as',
        'verificações em T-006 antes de prosseguir.',
        '',
      ].join('\n'),
    )
    process.exit(1)
  }

  console.log(
    [
      '',
      `Nenhum parâmetro cadastrado ainda — ${doValidador.length} verificações sem objeto.`,
      'Implementação em T-006. Este esboço falha automaticamente assim que o',
      'primeiro parâmetro for cadastrado.',
      '',
    ].join('\n'),
  )
}

main()
