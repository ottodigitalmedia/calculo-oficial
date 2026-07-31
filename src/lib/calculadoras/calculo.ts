/**
 * Carga adiada da função de cálculo, uma por calculadora.
 *
 * **O problema que isto resolve.** `RNF-004` limita cada rota de calculadora a
 * 120 kB comprimidos de JavaScript, e a medição de 31/07/2026 mostrou o porquê
 * de o limite apertar: o casco — componente genérico, campos, memória de
 * cálculo, registro de parâmetros e as tabelas de INSS e IRRF — custa 9,7 kB, e
 * **cada calculadora acrescenta ~1,1 kB ao pacote de TODAS as rotas**. Com
 * quatro publicadas a rota estava em 117,6 kB. A quinta chegaria a ~118,7 e a
 * sexta estouraria — com 71 calculadoras no catálogo por construir.
 *
 * A conta muda de forma quando cada rota carrega só o seu cálculo: o total
 * passa a ser casco + uma calculadora, e para de crescer com o catálogo.
 *
 * **Por que um mapa explícito, e não `import(`./${slug}`)`.** O caminho
 * calculado funcionaria — o empacotador cria um módulo de contexto —, mas
 * arrastaria para dentro dele todo arquivo do diretório, inclusive `tipos.ts`
 * e os dois registros. O mapa diz exatamente o que existe, e o nome fixo de
 * cada pedaço (`webpackChunkName`) é o que permite a `verificar-orcamento.ts`
 * medir a rota real de cada calculadora em vez de fingir que a parte adiada é
 * de graça. Um orçamento que deixa de enxergar metade do que baixa é o
 * `--passWithNoTests` de novo, em outra roupa.
 *
 * **`import type` é apagado na compilação** — nada aqui importa definição em
 * tempo de execução, e é isso que mantém o módulo minúsculo.
 *
 * `catalogo.test.ts` cobra a paridade com o registro: calculadora publicada sem
 * entrada aqui reprova na suíte, não em produção.
 */

import type { FuncaoCalculo } from './tipos'

/**
 * **`webpackExports` não é enfeite.** Sem ele, o pedaço adiado carrega o módulo
 * inteiro da definição — FAQ, descrição de SEO, nome, relacionadas —, texto que
 * só o servidor renderiza. Medido: o pedaço do salário líquido caiu de 3,3 para
 * 2,3 kB comprimidos quando a diretiva entrou.
 *
 * Ela depende de `calcular` ser **exportação nomeada de topo** em cada
 * definição, e não método do literal: como método, o objeto é alcançável e nada
 * pode ser descartado. É por isso que os quatro arquivos declaram a função
 * antes do objeto e a referenciam por nome.
 */
const CALCULOS: Readonly<Record<string, () => Promise<FuncaoCalculo>>> = {
  'salario-liquido': () =>
    import(
      /* webpackChunkName: "calc-salario-liquido" */
      /* webpackExports: ["calcular"] */
      './salario-liquido'
    ).then((m) => m.calcular),
  'rescisao-sem-justa-causa': () =>
    import(
      /* webpackChunkName: "calc-rescisao-sem-justa-causa" */
      /* webpackExports: ["calcular"] */
      './rescisao-sem-justa-causa'
    ).then((m) => m.calcular),
  inss: () =>
    import(
      /* webpackChunkName: "calc-inss" */
      /* webpackExports: ["calcular"] */
      './inss'
    ).then((m) => m.calcular),
  irrf: () =>
    import(
      /* webpackChunkName: "calc-irrf" */
      /* webpackExports: ["calcular"] */
      './irrf'
    ).then((m) => m.calcular),
  'juros-compostos': () =>
    import(
      /* webpackChunkName: "calc-juros-compostos" */
      /* webpackExports: ["calcular"] */
      './juros-compostos'
    ).then((m) => m.calcular),
}

/** Slugs com cálculo registrado. Usado pelo teste de paridade. */
export const SLUGS_COM_CALCULO: readonly string[] = Object.keys(CALCULOS)

/**
 * Carrega a função de cálculo do slug, ou `null` se ele não existe.
 *
 * Devolve `null` em vez de lançar: o slug chega da rota, e rota inexistente já
 * foi tratada com `notFound()` antes daqui. Um erro lançado no cliente por
 * causa disso viraria tela em branco por um caminho que não deveria existir.
 */
export function carregarCalculo(slug: string): Promise<FuncaoCalculo> | null {
  const carregador = CALCULOS[slug]
  return carregador ? carregador() : null
}
