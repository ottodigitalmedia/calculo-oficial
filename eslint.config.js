import js from '@eslint/js'
import next from '@next/eslint-plugin-next'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

/**
 * Regras de fronteira e de tipo monetário.
 *
 * Cada bloco abaixo implementa uma regra inviolável de CLAUDE.md. Não são
 * preferências de estilo: cada uma protege uma propriedade do sistema, e a
 * origem está citada na mensagem para que quem esbarrar nelas saiba o porquê
 * sem precisar procurar.
 *
 *   Regra 1 / BV-10  — nenhuma constante legal fora de lib/params/
 *   Regra 2 / BV-11  — dinheiro é inteiro em centavos; float é proibido
 *   Regra 3 / ADR-003 — engine não importa app/, components/ nem format/
 *   Regra 4 / C-M2   — o motor não lê relógio, rede nem ambiente
 */

/**
 * Regra 3 — fronteira de módulo do motor (ADR-003, 13-deployment §2).
 *
 * Só é permitido import RELATIVO, e só sem escapar para as camadas de cima.
 *
 * A expressão regular substitui um `group: ['*', ...]` que parecia certo e
 * estava errado: os padrões de `no-restricted-imports` usam semântica de
 * gitignore, na qual `*` casa em qualquer nível do caminho — então `./types`,
 * um import interno legítimo, era barrado junto com os pacotes de terceiro.
 * O defeito ficou invisível enquanto o motor tinha um arquivo só.
 */
const FRONTEIRA_DO_MOTOR = {
  patterns: [
    {
      // Tudo que não começa com ponto: pacote de npm, builtin do Node e
      // apelido `@/`. O motor não importa nada disso.
      regex: '^[^.]',
      message:
        'ADR-003: o motor só admite import relativo dentro de src/lib/engine/. ZERO dependência de runtime é decisão de segurança, não de portabilidade: a parte que toca o dado do usuário não pode ter cadeia de dependências a comprometer (AM-01). Para consumir parâmetros, use caminho relativo.',
    },
    {
      // Caminho relativo que sobe até as camadas proibidas.
      regex: '^\\.\\.?/(\\.\\./)*(app|components)/|(^|/)lib/format/|^\\.\\./format/',
      message:
        'ADR-003: src/lib/engine/ não importa de app/, components/ nem format/. Caminho relativo não contorna a regra — apenas a esconde. A formatação pertence à apresentação (C-M4).',
    },
  ],
}

/** Regra 4 — o motor não lê relógio, rede nem ambiente (ADR-003 C-M2). */
const MOTOR_DETERMINISTICO = [
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message:
      'C-M2: o motor não lê o relógio. A data de referência é sempre parâmetro explícito — sem isso os casos-ouro passam a falhar sozinhos na virada do exercício.',
  },
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'C-M2: o motor não lê o relógio. Receba a data de referência como parâmetro.',
  },
  {
    selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
    message:
      'C-M2: o motor é puro. Mesma entrada e mesma data de referência produzem sempre a mesma saída.',
  },
]

/** Regra 2 / BV-11 — aritmética monetária em inteiros (ADR-004, RN-005). */
const ARITMETICA_EM_CENTAVOS = [
  {
    selector: 'Literal[raw=/^[0-9][0-9_]*\\.[0-9]/]',
    message:
      'BV-11 (ADR-004 A-1/A-6): literal decimal indica conta em ponto flutuante sobre dinheiro. Valor monetário é inteiro em centavos; alíquota é inteiro em basis points (7,5% = 750).',
  },
  {
    selector: "CallExpression[callee.property.name='toFixed']",
    message:
      'BV-11: toFixed opera em ponto flutuante e arredonda de forma implícita. Arredondamento monetário é explícito, com a política declarada na assinatura da função (ADR-004 A-4).',
  },
  {
    selector: "CallExpression[callee.name='parseFloat'], MemberExpression[object.name='Number'][property.name='parseFloat']",
    message: 'BV-11: parseFloat produz ponto flutuante. Converta para centavos inteiros na fronteira (A-7).',
  },
]

/** Regra 1 / BV-10 — nenhuma constante legal fora de lib/params/ (RN-001, ADR-001). */
const SEM_CONSTANTE_LEGAL = {
  selector: 'Literal[value>=100]',
  message:
    'BV-10 (RN-001): número grande dentro do motor quase sempre é constante legal disfarçada. Todo parâmetro vive em src/lib/params/ com vigência, fonte e URL oficial. Se este número não é um parâmetro legal, desative a regra nesta linha com a justificativa ao lado.',
}

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'docs/**',
      'next-env.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Regras do Next e dos hooks vêm dos plugins diretos, não de
  // `eslint-config-next`. O bundle arrastava eslint-plugin-import,
  // jsx-a11y e react com uma cadeia transitiva vulnerável e sem correção
  // publicada (07-security §8). Trocá-lo pelos plugins que realmente usamos
  // tirou 178 pacotes da árvore — "menos componentes vence mais recursos"
  // (CLAUDE.md, contexto de decisão).
  //
  // O que se perde: as regras de acessibilidade de jsx-a11y. Elas não cobriam
  // RNF-008 de todo modo — a meta WCAG 2.1 AA é verificada por TC-044 com
  // verificador dedicado, em T-032.
  //
  // O plugin do Next é registrado sem `files` porque `next build` inspeciona a
  // configuração resolvida para confirmar que ele está presente; registrá-lo
  // dentro de um bloco restrito faz o build avisar que não o encontrou.
  { plugins: { '@next/next': next } },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...next.flatConfig.coreWebVitals.rules,
      ...reactHooks.configs.recommended.rules,
    },
  },

  // ------------------------------------------------------------------------
  // src/lib/engine/ — o núcleo. Todas as quatro regras valem aqui.
  // ------------------------------------------------------------------------
  {
    files: ['src/lib/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', FRONTEIRA_DO_MOTOR],
      'no-restricted-syntax': [
        'error',
        ...MOTOR_DETERMINISTICO,
        ...ARITMETICA_EM_CENTAVOS,
        SEM_CONSTANTE_LEGAL,
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'C-M2: o motor não lê rede.' },
        { name: 'XMLHttpRequest', message: 'C-M2: o motor não lê rede.' },
        { name: 'process', message: 'C-M2: o motor não lê ambiente.' },
        { name: 'window', message: 'ADR-003: o motor executa em Node e no navegador sem alteração.' },
        { name: 'document', message: 'ADR-003: o motor não conhece interface.' },
        { name: 'localStorage', message: 'RN-030: nenhum valor digitado sai da sessão.' },
      ],
    },
  },

  // ------------------------------------------------------------------------
  // src/lib/params/ — os parâmetros legais. Aritmética inteira, mas aqui as
  // constantes são o conteúdo legítimo do módulo: BV-10 não se aplica.
  // ------------------------------------------------------------------------
  {
    files: ['src/lib/params/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...ARITMETICA_EM_CENTAVOS],
    },
  },

  // ------------------------------------------------------------------------
  // Apresentação — BV-11 continua valendo. Formatar é converter, não recalcular.
  // ------------------------------------------------------------------------
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}', 'src/lib/format/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...ARITMETICA_EM_CENTAVOS],
    },
  },

  // ------------------------------------------------------------------------
  // Testes e scripts de build. Casos-ouro precisam de literais e de datas
  // explícitas; scripts leem ambiente e rede por definição.
  // ------------------------------------------------------------------------
  {
    files: [
      'tests/**/*.{ts,tsx,mjs}',
      'scripts/**/*.{ts,tsx,mjs}',
      '*.config.{ts,js,mjs}',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-restricted-syntax': 'off',
      'no-restricted-imports': 'off',
      'no-restricted-globals': 'off',
    },
  },
)
