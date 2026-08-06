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
  'inss-autonomo-e-facultativo': () =>
    import(
      /* webpackChunkName: "calc-inss-autonomo" */
      /* webpackExports: ["calcular"] */
      './inss-autonomo'
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
  'custo-de-aquisicao-de-imovel': () =>
    import(
      /* webpackChunkName: "calc-custo-de-aquisicao" */
      /* webpackExports: ["calcular"] */
      './custo-de-aquisicao'
    ).then((m) => m.calcular),
  'contrato-intermitente': () =>
    import(
      /* webpackChunkName: "calc-intermitente" */
      /* webpackExports: ["calcular"] */
      './intermitente'
    ).then((m) => m.calcular),
  'ganho-de-capital-imovel': () =>
    import(
      /* webpackChunkName: "calc-ganho-de-capital" */
      /* webpackExports: ["calcular"] */
      './ganho-de-capital'
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
  'plano-de-quitacao': () =>
    import(
      /* webpackChunkName: "calc-plano-de-quitacao" */
      /* webpackExports: ["calcular"] */
      './plano-de-quitacao'
    ).then((m) => m.calcular),
  'portabilidade-de-credito': () =>
    import(
      /* webpackChunkName: "calc-portabilidade-de-credito" */
      /* webpackExports: ["calcular"] */
      './portabilidade-de-credito'
    ).then((m) => m.calcular),
  'financiamento-de-reforma': () =>
    import(
      /* webpackChunkName: "calc-financiamento-de-reforma" */
      /* webpackExports: ["calcular"] */
      './financiamento-de-reforma'
    ).then((m) => m.calcular),
  'emprestimo-consignado': () =>
    import(
      /* webpackChunkName: "calc-consignado" */
      /* webpackExports: ["calcular"] */
      './consignado'
    ).then((m) => m.calcular),
  'rentabilidade-de-aluguel': () =>
    import(
      /* webpackChunkName: "calc-locacao" */
      /* webpackExports: ["calcular"] */
      './locacao'
    ).then((m) => m.calcular),
  'alugar-ou-comprar': () =>
    import(
      /* webpackChunkName: "calc-alugar-ou-comprar" */
      /* webpackExports: ["calcular"] */
      './alugar-ou-comprar'
    ).then((m) => m.calcular),
  'quanto-rende-por-mes': () =>
    import(
      /* webpackChunkName: "calc-renda-mensal" */
      /* webpackExports: ["calcular"] */
      './renda-mensal'
    ).then((m) => m.calcular),
  'rendimento-da-poupanca': () =>
    import(
      /* webpackChunkName: "calc-poupanca" */
      /* webpackExports: ["calcular"] */
      './poupanca'
    ).then((m) => m.calcular),
  'cdb-lci-lca': () =>
    import(
      /* webpackChunkName: "calc-cdb" */
      /* webpackExports: ["calcular"] */
      './cdb'
    ).then((m) => m.calcular),
  'onde-render-mais': () =>
    import(
      /* webpackChunkName: "calc-comparador-investimentos" */
      /* webpackExports: ["calcular"] */
      './comparador-investimentos'
    ).then((m) => m.calcular),
  'tesouro-ipca-mais': () =>
    import(
      /* webpackChunkName: "calc-tesouro-ipca" */
      /* webpackExports: ["calcular"] */
      './tesouro-ipca'
    ).then((m) => m.calcular),
  'dividend-yield': () =>
    import(
      /* webpackChunkName: "calc-dividendos" */
      /* webpackExports: ["calcular"] */
      './dividendos'
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
  'das-mei': () =>
    import(
      /* webpackChunkName: "calc-das-mei" */
      /* webpackExports: ["calcular"] */
      './das-mei'
    ).then((m) => m.calcular),
  'limite-do-mei': () =>
    import(
      /* webpackChunkName: "calc-limite-do-mei" */
      /* webpackExports: ["calcular"] */
      './limite-do-mei'
    ).then((m) => m.calcular),
  'carne-leao': () =>
    import(
      /* webpackChunkName: "calc-carne-leao" */
      /* webpackExports: ["calcular"] */
      './carne-leao'
    ).then((m) => m.calcular),
  'pro-labore': () =>
    import(
      /* webpackChunkName: "calc-pro-labore" */
      /* webpackExports: ["calcular"] */
      './pro-labore'
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
  'custo-do-botijao-de-gas': () =>
    import(
      /* webpackChunkName: "calc-botijao" */
      /* webpackExports: ["calcular"] */
      './botijao'
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
  'conversor-de-moeda': () =>
    import(
      /* webpackChunkName: "calc-cambio" */
      /* webpackExports: ["calcular"] */
      './cambio'
    ).then((m) => m.calcular),
  'valor-futuro-corrigido': () =>
    import(
      /* webpackChunkName: "calc-valor-futuro" */
      /* webpackExports: ["calcular"] */
      './valor-futuro'
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
  'dias-uteis-entre-datas': () =>
    import(
      /* webpackChunkName: "calc-dias-uteis" */
      /* webpackExports: ["calcular"] */
      './dias-uteis'
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
  'eletrico-ou-combustao': () =>
    import(
      /* webpackChunkName: "calc-eletrico-vs-combustao" */
      /* webpackExports: ["calcular"] */
      './eletrico-vs-combustao'
    ).then((m) => m.calcular),
  'depreciacao-de-veiculo': () =>
    import(
      /* webpackChunkName: "calc-depreciacao-de-veiculo" */
      /* webpackExports: ["calcular"] */
      './depreciacao-de-veiculo'
    ).then((m) => m.calcular),
  'financiamento-de-veiculo': () =>
    import(
      /* webpackChunkName: "calc-financiamento-de-veiculo" */
      /* webpackExports: ["calcular"] */
      './financiamento-de-veiculo'
    ).then((m) => m.calcular),
  'divisao-de-conta': () =>
    import(
      /* webpackChunkName: "calc-divisao-de-conta" */
      /* webpackExports: ["calcular"] */
      './divisao-de-conta'
    ).then((m) => m.calcular),
  'media-ponderada': () =>
    import(
      /* webpackChunkName: "calc-media-ponderada" */
      /* webpackExports: ["calcular"] */
      './media-ponderada'
    ).then((m) => m.calcular),
  'conta-de-agua': () =>
    import(
      /* webpackChunkName: "calc-conta-de-agua" */
      /* webpackExports: ["calcular"] */
      './conta-de-agua'
    ).then((m) => m.calcular),
  'conversor-de-unidades': () =>
    import(
      /* webpackChunkName: "calc-conversor-de-unidades" */
      /* webpackExports: ["calcular"] */
      './conversor-de-unidades'
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
