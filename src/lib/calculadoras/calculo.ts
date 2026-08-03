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
  'rescisao-pedido-demissao': () =>
    import(
      /* webpackChunkName: "calc-rescisao-pedido-demissao" */
      /* webpackExports: ["calcular"] */
      './rescisao-pedido-demissao'
    ).then((m) => m.calcular),
  'rescisao-acordo-mutuo': () =>
    import(
      /* webpackChunkName: "calc-rescisao-acordo-mutuo" */
      /* webpackExports: ["calcular"] */
      './rescisao-acordo-mutuo'
    ).then((m) => m.calcular),
  'rescisao-domestico': () =>
    import(
      /* webpackChunkName: "calc-rescisao-domestico" */
      /* webpackExports: ["calcular"] */
      './rescisao-domestico'
    ).then((m) => m.calcular),
  'aviso-previo-proporcional': () =>
    import(
      /* webpackChunkName: "calc-aviso-previo" */
      /* webpackExports: ["calcular"] */
      './aviso-previo'
    ).then((m) => m.calcular),
  'seguro-desemprego': () =>
    import(
      /* webpackChunkName: "calc-seguro-desemprego" */
      /* webpackExports: ["calcular"] */
      './seguro-desemprego'
    ).then((m) => m.calcular),
  'cheque-especial': () =>
    import(
      /* webpackChunkName: "calc-cheque-especial" */
      /* webpackExports: ["calcular"] */
      './cheque-especial'
    ).then((m) => m.calcular),
  'custo-do-funcionario': () =>
    import(
      /* webpackChunkName: "calc-custo-empregador" */
      /* webpackExports: ["calcular"] */
      './custo-empregador'
    ).then((m) => m.calcular),
  ferias: () =>
    import(
      /* webpackChunkName: "calc-ferias" */
      /* webpackExports: ["calcular"] */
      './ferias'
    ).then((m) => m.calcular),
  'decimo-terceiro': () =>
    import(
      /* webpackChunkName: "calc-decimo-terceiro" */
      /* webpackExports: ["calcular"] */
      './decimo-terceiro'
    ).then((m) => m.calcular),
  'horas-extras': () =>
    import(
      /* webpackChunkName: "calc-horas-extras" */
      /* webpackExports: ["calcular"] */
      './horas-extras'
    ).then((m) => m.calcular),
  'banco-de-horas': () =>
    import(
      /* webpackChunkName: "calc-banco-de-horas" */
      /* webpackExports: ["calcular"] */
      './banco-de-horas'
    ).then((m) => m.calcular),
  fgts: () =>
    import(
      /* webpackChunkName: "calc-fgts" */
      /* webpackExports: ["calcular"] */
      './fgts'
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
  'cet-custo-efetivo-total': () =>
    import(
      /* webpackChunkName: "calc-cet" */
      /* webpackExports: ["calcular"] */
      './cet'
    ).then((m) => m.calcular),
  'amortizacao-sac-price': () =>
    import(
      /* webpackChunkName: "calc-amortizacao" */
      /* webpackExports: ["calcular"] */
      './amortizacao'
    ).then((m) => m.calcular),
  'ir-renda-fixa': () =>
    import(
      /* webpackChunkName: "calc-renda-fixa" */
      /* webpackExports: ["calcular"] */
      './renda-fixa'
    ).then((m) => m.calcular),
  'juros-compostos': () =>
    import(
      /* webpackChunkName: "calc-juros-compostos" */
      /* webpackExports: ["calcular"] */
      './juros-compostos'
    ).then((m) => m.calcular),
  'rotativo-do-cartao': () =>
    import(
      /* webpackChunkName: "calc-rotativo-cartao" */
      /* webpackExports: ["calcular"] */
      './rotativo-cartao'
    ).then((m) => m.calcular),
  'capacidade-de-financiamento': () =>
    import(
      /* webpackChunkName: "calc-capacidade" */
      /* webpackExports: ["calcular"] */
      './capacidade'
    ).then((m) => m.calcular),
  'financiamento-imobiliario': () =>
    import(
      /* webpackChunkName: "calc-financiamento-imobiliario" */
      /* webpackExports: ["calcular"] */
      './financiamento-imobiliario'
    ).then((m) => m.calcular),
  'quitacao-antecipada': () =>
    import(
      /* webpackChunkName: "calc-quitacao-antecipada" */
      /* webpackExports: ["calcular"] */
      './quitacao-antecipada'
    ).then((m) => m.calcular),
  'amortizacao-extra': () =>
    import(
      /* webpackChunkName: "calc-amortizacao-extra" */
      /* webpackExports: ["calcular"] */
      './amortizacao-extra'
    ).then((m) => m.calcular),
  'rentabilidade-de-aluguel': () =>
    import(
      /* webpackChunkName: "calc-locacao" */
      /* webpackExports: ["calcular"] */
      './locacao'
    ).then((m) => m.calcular),
  'reserva-de-emergencia': () =>
    import(
      /* webpackChunkName: "calc-reserva" */
      /* webpackExports: ["calcular"] */
      './reserva'
    ).then((m) => m.calcular),
  'independencia-financeira': () =>
    import(
      /* webpackChunkName: "calc-independencia" */
      /* webpackExports: ["calcular"] */
      './independencia'
    ).then((m) => m.calcular),
  'precificacao-de-hora': () =>
    import(
      /* webpackChunkName: "calc-precificacao" */
      /* webpackExports: ["calcular"] */
      './precificacao'
    ).then((m) => m.calcular),
  'orcamento-domestico': () =>
    import(
      /* webpackChunkName: "calc-orcamento" */
      /* webpackExports: ["calcular"] */
      './orcamento'
    ).then((m) => m.calcular),
  'consumo-de-energia': () =>
    import(
      /* webpackChunkName: "calc-energia" */
      /* webpackExports: ["calcular"] */
      './energia'
    ).then((m) => m.calcular),
  'correcao-por-indice': () =>
    import(
      /* webpackChunkName: "calc-correcao-por-indice" */
      /* webpackExports: ["calcular"] */
      './correcao-por-indice'
    ).then((m) => m.calcular),
  'poder-de-compra': () =>
    import(
      /* webpackChunkName: "calc-poder-de-compra" */
      /* webpackExports: ["calcular"] */
      './poder-de-compra'
    ).then((m) => m.calcular),
  'reajuste-de-salario': () =>
    import(
      /* webpackChunkName: "calc-reajuste-salarial" */
      /* webpackExports: ["calcular"] */
      './reajuste-salarial'
    ).then((m) => m.calcular),
  'reajuste-de-aluguel': () =>
    import(
      /* webpackChunkName: "calc-reajuste-aluguel" */
      /* webpackExports: ["calcular"] */
      './reajuste-aluguel'
    ).then((m) => m.calcular),
  porcentagem: () =>
    import(
      /* webpackChunkName: "calc-porcentagem" */
      /* webpackExports: ["calcular"] */
      './porcentagem'
    ).then((m) => m.calcular),
  'regra-de-tres': () =>
    import(
      /* webpackChunkName: "calc-regra-de-tres" */
      /* webpackExports: ["calcular"] */
      './regra-de-tres'
    ).then((m) => m.calcular),
  'alcool-ou-gasolina': () =>
    import(
      /* webpackChunkName: "calc-combustivel" */
      /* webpackExports: ["calcular"] */
      './combustivel'
    ).then((m) => m.calcular),
  'custo-de-viagem': () =>
    import(
      /* webpackChunkName: "calc-viagem" */
      /* webpackExports: ["calcular"] */
      './viagem'
    ).then((m) => m.calcular),
  'custo-mensal-do-carro': () =>
    import(
      /* webpackChunkName: "calc-custo-do-carro" */
      /* webpackExports: ["calcular"] */
      './custo-do-carro'
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
