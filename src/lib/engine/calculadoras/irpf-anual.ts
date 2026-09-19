/**
 * CALC-017 — Restituição estimada do IRPF · CALC-019 — simplificado vs. completo.
 *
 * **Um motor, duas calculadoras**, pela razão que `docs/18` já registrava:
 * CALC-019 "é CALC-017 rodado duas vezes". Só que não são duas execuções — é
 * uma, porque a apuração anual **já calcula os dois modelos** e adota o menor
 * imposto. O que muda entre as duas calculadoras é o que a tela destaca:
 * CALC-017 mostra o saldo, CALC-019 mostra a distância entre os modelos.
 *
 * Separar em dois motores duplicaria a parte cara — as deduções e seus tetos —
 * e as duas divergiriam na primeira manutenção. É a mesma decisão de
 * `rescisao.ts`, que atende três modalidades.
 *
 * ## O que este motor NÃO faz, e por quê
 *
 * - **Rendimentos de tributação exclusiva** (13º, aplicações financeiras).
 *   Não entram no ajuste, por definição.
 * - **Carnê-leão, rendimentos no exterior, ganho de capital.** Cada um tem
 *   apuração própria; CALC-053 já faz o primeiro.
 *
 * ## O que entrou no lote 13 (19/09/2026)
 *
 * - **Previdência privada (PGBL)**, dedutível no modelo completo até 12% dos
 *   rendimentos tributáveis, e só para quem contribui ao regime geral ou
 *   próprio — ou é aposentado ou pensionista (Lei nº 9.532/1997, art. 11).
 * - **A redução anual do art. 11-A da Lei nº 9.250/1995**, a partir do
 *   ano-calendário de 2026. A faixa é definida pelos RENDIMENTOS TRIBUTÁVEIS, e
 *   não pela base: deduções — o PGBL inclusive — reduzem o imposto da tabela,
 *   mas não mudam a redução. Ela vale para os dois modelos e é limitada ao
 *   imposto de cada um (§ 1º). Antes de 2026 os parâmetros não vigem e a redução
 *   é zero: não havia redução, e isso não é falta de dado.
 *
 * Regras: `RN-011`, `RN-012`, `RN-014`.
 */

import { limitarAoTeto, maximo, minimo, naoNegativo, proporcao, somar, subtrair, aplicarAliquota } from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

export const PARAMETROS_IRPF_ANUAL = [
  'irpf-tabela-anual',
  'irpf-dependente-anual',
  'irpf-instrucao-limite-anual',
  'irpf-simplificado-percentual-anual',
  'irpf-simplificado-limite-anual',
  'irpf-previdencia-privada-limite-anual',
] as const

/**
 * Parâmetros da redução anual do art. 11-A. **Opcionais por construção**: o
 * mecanismo nasceu no ano-calendário de 2026, e ausência de vigência antes
 * disso significa "não havia redução" — a mesma decisão do redutor mensal em
 * `engine/irrf.ts`.
 */
export const PARAMETROS_REDUCAO_ANUAL = [
  'irpf-reducao-anual-limite-integral',
  'irpf-reducao-anual-valor-maximo',
  'irpf-reducao-anual-constante',
  'irpf-reducao-anual-coeficiente',
  'irpf-reducao-anual-limite-aplicacao',
] as const

/** `RN-007`: empate para cima, como no restante do motor. */
const POLITICA = 'meio_para_cima' as const

export interface EntradaIrpfAnual {
  /** Rendimentos tributáveis recebidos de pessoa jurídica no ano-calendário. */
  readonly rendimentosTributaveis: Centavos
  /** Contribuição previdenciária oficial paga no ano. */
  readonly inss: Centavos
  readonly dependentes: number
  /** Despesas com instrução, somadas. O teto é por pessoa — ver `tetoInstrucao`. */
  readonly instrucao: Centavos
  /** Despesas médicas. **Sem teto** — Lei nº 9.250/1995, art. 8º, II, "a". */
  readonly medicas: Centavos
  /** Pensão alimentícia por decisão judicial. Sem teto. */
  readonly pensao: Centavos
  /** Imposto retido na fonte ao longo do ano. */
  readonly impostoRetido: Centavos
  /** Contribuições à previdência privada (PGBL) no ano. Ausente = zero. */
  readonly previdenciaPrivada?: Centavos
  /**
   * Contribui ao regime geral ou próprio — ou é aposentado ou pensionista? A
   * dedução do PGBL depende disso (Lei nº 9.532/1997, art. 11, caput e § 5º).
   * Ausente = sim.
   */
  readonly contribuiParaRegime?: boolean
}

export type ModeloAdotado = 'completo' | 'simplificado'

export interface SaidaIrpfAnual {
  /** Positivo, a restituir; negativo, a pagar. Zero, nem uma coisa nem outra. */
  readonly saldo: Centavos
  readonly modeloAdotado: ModeloAdotado
  readonly impostoDevido: Centavos
  readonly impostoCompleto: Centavos
  readonly impostoSimplificado: Centavos
  /** Quanto o modelo adotado economiza em relação ao outro. Nunca negativo. */
  readonly economiaDoModelo: Centavos
  readonly baseCompleto: Centavos
  readonly baseSimplificado: Centavos
  readonly deducoesCompleto: Centavos
  readonly descontoSimplificado: Centavos
  /** Instrução efetivamente dedutível, já limitada. */
  readonly instrucaoDedutivel: Centavos
  readonly aliquotaFaixa: BasisPoints
  /** PGBL efetivamente dedutível no completo, já limitado. */
  readonly previdenciaDedutivel: Centavos
  /** O limite de 12% dos rendimentos tributáveis, em reais. */
  readonly limitePrevidencia: Centavos
  /** Redução do art. 11-A aplicada em cada modelo. Zero antes de 2026. */
  readonly reducaoCompleto: Centavos
  readonly reducaoSimplificado: Centavos
}

function valorMonetario(r: VigenciaResolvida): Centavos | null {
  return r.vigencia.valor.tipo === 'valor_monetario' ? centavos(r.vigencia.valor.centavos) : null
}

function percentualDe(r: VigenciaResolvida): BasisPoints | null {
  return r.vigencia.valor.tipo === 'percentual' ? basisPoints(r.vigencia.valor.aliquotaBp) : null
}

/**
 * Imposto pela tabela anual: alíquota da faixa menos a parcela a deduzir.
 *
 * A parcela existe justamente para que a alíquota da faixa possa ser aplicada
 * sobre a base INTEIRA sem cobrar a mais das faixas de baixo — é a forma
 * fechada da tabela progressiva, e é como a norma a escreve.
 */
function impostoPelaTabela(
  base: Centavos,
  tabela: VigenciaResolvida,
): { readonly imposto: Centavos; readonly aliquota: BasisPoints; readonly parcela: Centavos } | null {
  if (tabela.vigencia.valor.tipo !== 'tabela_faixas') return null
  const faixas = tabela.vigencia.valor.faixas

  const faixa =
    faixas.find((f) => f.limiteSuperiorCentavos === null || base <= f.limiteSuperiorCentavos) ??
    faixas[faixas.length - 1]
  if (!faixa) return null

  const aliquota = basisPoints(faixa.aliquotaBp)
  const parcela = centavos(faixa.parcelaDeduzirCentavos ?? 0)
  return {
    imposto: naoNegativo(subtrair(aplicarAliquota(base, aliquota, POLITICA), parcela)),
    aliquota,
    parcela,
  }
}

export function calcularIrpfAnual(
  entrada: EntradaIrpfAnual,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaIrpfAnual> {
  const naoNegativos = [
    entrada.rendimentosTributaveis,
    entrada.inss,
    entrada.instrucao,
    entrada.medicas,
    entrada.pensao,
    entrada.impostoRetido,
    entrada.previdenciaPrivada ?? ZERO,
  ]
  if (naoNegativos.some((v) => v < 0)) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Valores não podem ser negativos.' }
  }
  if (!Number.isInteger(entrada.dependentes) || entrada.dependentes < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O número de dependentes deve ser inteiro e não negativo.',
    }
  }

  const tabela = registro.resolver('irpf-tabela-anual', dataReferencia)
  const porDependente = registro.resolver('irpf-dependente-anual', dataReferencia)
  const tetoInstrucao = registro.resolver('irpf-instrucao-limite-anual', dataReferencia)
  const percSimplificado = registro.resolver('irpf-simplificado-percentual-anual', dataReferencia)
  const tetoSimplificado = registro.resolver('irpf-simplificado-limite-anual', dataReferencia)
  const limitePrev = registro.resolver('irpf-previdencia-privada-limite-anual', dataReferencia)

  for (const r of [tabela, porDependente, tetoInstrucao, percSimplificado, tetoSimplificado, limitePrev]) {
    if (!r.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: r.detalhe }
  }
  if (
    !tabela.ok ||
    !porDependente.ok ||
    !tetoInstrucao.ok ||
    !percSimplificado.ok ||
    !tetoSimplificado.ok ||
    !limitePrev.ok
  ) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Parâmetro anual indisponível.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)
  traco.passo(
    'Rendimentos tributáveis no ano',
    reais(entrada.rendimentosTributaveis),
    entrada.rendimentosTributaveis,
  )

  // --- Modelo completo: as deduções legais -------------------------------
  const deducaoDependente = valorMonetario(porDependente.resolvida) ?? ZERO
  const totalDependentes = centavos(deducaoDependente * entrada.dependentes)
  if (entrada.dependentes > 0) {
    traco.passoComParametro(
      'Dedução por dependentes',
      `${entrada.dependentes} × ${reais(deducaoDependente)}`,
      totalDependentes,
      porDependente.resolvida,
    )
  }

  /*
   * O teto da instrução é POR PESSOA, e o campo é um só.
   *
   * A lei dá a cada pessoa — declarante e cada dependente — o seu próprio
   * limite. A calculadora recebe a soma, e por isso aplica o teto ao conjunto:
   * limite × (declarante + dependentes).
   *
   * **Isso é uma aproximação, e ela está declarada na tela e no traço.** Ela
   * coincide com a lei quando nenhuma pessoa isoladamente estourou o próprio
   * teto, que é o caso comum. Quando uma só concentra a despesa, o resultado
   * fica otimista — e é por isso que a etapa abaixo mostra o limite aplicado em
   * vez de escondê-lo dentro do total.
   */
  const tetoPorPessoa = valorMonetario(tetoInstrucao.resolvida) ?? ZERO
  const pessoas = 1 + entrada.dependentes
  const tetoInstrucaoTotal = centavos(tetoPorPessoa * pessoas)
  const instrucaoDedutivel = limitarAoTeto(entrada.instrucao, tetoInstrucaoTotal)

  if (entrada.instrucao > 0) {
    traco.passoComParametro(
      'Instrução dedutível',
      instrucaoDedutivel < entrada.instrucao
        ? `${reais(entrada.instrucao)} limitado a ${pessoas} × ${reais(tetoPorPessoa)}`
        : `${reais(entrada.instrucao)}, dentro do limite de ${pessoas} × ${reais(tetoPorPessoa)}`,
      instrucaoDedutivel,
      tetoInstrucao.resolvida,
      'O teto é por pessoa. Aplicado ao conjunto, ele supõe que ninguém isoladamente ultrapassou o próprio limite.',
    )
  }

  if (entrada.medicas > 0) {
    traco.passo(
      'Despesas médicas',
      `${reais(entrada.medicas)} — sem teto legal`,
      entrada.medicas,
    )
  }

  // --- Previdência privada: 12% dos rendimentos, com a condição do regime ----
  const percPrev = percentualDe(limitePrev.resolvida) ?? basisPoints(0)
  const limitePrevidencia = aplicarAliquota(entrada.rendimentosTributaveis, percPrev, POLITICA)
  const pgbl = entrada.previdenciaPrivada ?? ZERO
  const podeDeduzir = entrada.contribuiParaRegime !== false
  const previdenciaDedutivel = podeDeduzir ? limitarAoTeto(pgbl, limitePrevidencia) : ZERO
  if (pgbl > 0) {
    traco.passoComParametro(
      'Previdência privada dedutível',
      !podeDeduzir
        ? `${reais(pgbl)} — não dedutível sem contribuição ao regime geral ou próprio`
        : previdenciaDedutivel < pgbl
          ? `${reais(pgbl)} limitado a ${percentual(percPrev)} de ${reais(entrada.rendimentosTributaveis)}`
          : `${reais(pgbl)}, dentro do limite de ${percentual(percPrev)} (${reais(limitePrevidencia)})`,
      previdenciaDedutivel,
      limitePrev.resolvida,
      'Só no modelo completo. A dedução exige contribuição também ao regime geral ou próprio, salvo aposentados e pensionistas.',
    )
  }

  const deducoesCompleto = somar(
    entrada.inss,
    totalDependentes,
    instrucaoDedutivel,
    entrada.medicas,
    entrada.pensao,
    previdenciaDedutivel,
  )
  const baseCompleto = naoNegativo(subtrair(entrada.rendimentosTributaveis, deducoesCompleto))
  traco.passo(
    'Base pelo modelo completo',
    `${reais(entrada.rendimentosTributaveis)} − ${reais(deducoesCompleto)}`,
    baseCompleto,
  )

  // --- Modelo simplificado ------------------------------------------------
  const perc = percentualDe(percSimplificado.resolvida) ?? basisPoints(0)
  const tetoSimpl = valorMonetario(tetoSimplificado.resolvida) ?? ZERO
  const descontoBruto = aplicarAliquota(entrada.rendimentosTributaveis, perc, POLITICA)
  const descontoSimplificado = limitarAoTeto(descontoBruto, tetoSimpl)

  traco.passoComParametro(
    'Desconto simplificado',
    descontoSimplificado < descontoBruto
      ? `${percentual(perc)} de ${reais(entrada.rendimentosTributaveis)}, limitado a ${reais(tetoSimpl)}`
      : `${percentual(perc)} de ${reais(entrada.rendimentosTributaveis)}`,
    descontoSimplificado,
    tetoSimplificado.resolvida,
    'Substitui TODAS as demais deduções — Lei nº 9.250/1995, art. 10, § 1º.',
  )

  const baseSimplificado = naoNegativo(
    subtrair(entrada.rendimentosTributaveis, descontoSimplificado),
  )
  traco.passo(
    'Base pelo modelo simplificado',
    `${reais(entrada.rendimentosTributaveis)} − ${reais(descontoSimplificado)}`,
    baseSimplificado,
  )

  // --- Imposto por cada modelo -------------------------------------------
  const porCompleto = impostoPelaTabela(baseCompleto, tabela.resolvida)
  const porSimplificado = impostoPelaTabela(baseSimplificado, tabela.resolvida)
  if (!porCompleto || !porSimplificado) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Tabela anual sem faixas.' }
  }

  traco.passoComParametro(
    `Imposto pelo completo — faixa de ${percentual(porCompleto.aliquota)}`,
    `${reais(baseCompleto)} × ${percentual(porCompleto.aliquota)} − ${reais(porCompleto.parcela)}`,
    porCompleto.imposto,
    tabela.resolvida,
  )
  traco.passoComParametro(
    `Imposto pelo simplificado — faixa de ${percentual(porSimplificado.aliquota)}`,
    `${reais(baseSimplificado)} × ${percentual(porSimplificado.aliquota)} − ${reais(porSimplificado.parcela)}`,
    porSimplificado.imposto,
    tabela.resolvida,
  )

  // --- Redução anual do art. 11-A, quando vige -----------------------------
  const reducaoBruta = reducaoAnual(entrada.rendimentosTributaveis, dataReferencia, registro, traco)
  // § 1º: limitada ao imposto da tabela — de CADA modelo.
  const reducaoCompleto = minimo(reducaoBruta, porCompleto.imposto)
  const reducaoSimplificado = minimo(reducaoBruta, porSimplificado.imposto)
  const impostoCompleto = subtrair(porCompleto.imposto, reducaoCompleto)
  const impostoSimplificado = subtrair(porSimplificado.imposto, reducaoSimplificado)
  if (reducaoBruta > 0) {
    traco.passo(
      'Imposto pelo completo, depois da redução',
      `${reais(porCompleto.imposto)} − ${reais(reducaoCompleto)}`,
      impostoCompleto,
    )
    traco.passo(
      'Imposto pelo simplificado, depois da redução',
      `${reais(porSimplificado.imposto)} − ${reais(reducaoSimplificado)}`,
      impostoSimplificado,
    )
  }

  // --- O modelo adotado ---------------------------------------------------
  // Empate vai para o completo: `<` e não `<=`. Sem diferença no imposto, a
  // declaração com deduções comprovadas é a que descreve os fatos.
  const usaSimplificado = impostoSimplificado < impostoCompleto
  const modeloAdotado: ModeloAdotado = usaSimplificado ? 'simplificado' : 'completo'
  const escolhido = usaSimplificado ? porSimplificado : porCompleto
  const impostoDevido = usaSimplificado ? impostoSimplificado : impostoCompleto
  const economiaDoModelo = subtrair(
    maximo(impostoCompleto, impostoSimplificado),
    minimo(impostoCompleto, impostoSimplificado),
  )

  traco.passo(
    usaSimplificado ? 'Adotado o modelo simplificado' : 'Adotado o modelo completo',
    economiaDoModelo > 0
      ? `menor imposto, economia de ${reais(economiaDoModelo)}`
      : 'os dois modelos produzem o mesmo imposto',
    impostoDevido,
  )

  // --- Saldo ---------------------------------------------------------------
  traco.passo('Imposto retido na fonte', reais(entrada.impostoRetido), entrada.impostoRetido)

  const saldo = subtrair(entrada.impostoRetido, impostoDevido)
  traco.passo(
    saldo > 0 ? 'Saldo a restituir' : saldo < 0 ? 'Saldo a pagar' : 'Sem saldo',
    `${reais(entrada.impostoRetido)} − ${reais(impostoDevido)}`,
    saldo,
  )

  return {
    ok: true,
    valores: {
      saldo,
      modeloAdotado,
      impostoDevido,
      impostoCompleto,
      impostoSimplificado,
      economiaDoModelo,
      baseCompleto,
      baseSimplificado,
      deducoesCompleto,
      descontoSimplificado,
      instrucaoDedutivel,
      aliquotaFaixa: escolhido.aliquota,
      previdenciaDedutivel,
      limitePrevidencia,
      reducaoCompleto,
      reducaoSimplificado,
    },
    traco: traco.construir(),
  }
}

/**
 * Redução do art. 11-A, antes do limite do § 1º. Zero quando não vige.
 *
 *   até R$ 60.000,00          até R$ 2.694,15 — teto fixo
 *   R$ 60.000,01 a 88.200,00  8.429,73 − (0,095575 × rendimentos tributáveis)
 *   acima de R$ 88.200,00     nenhuma
 *
 * **Segue a letra da tabela, inclusive na fronteira.** Em R$ 60.000,01 a fórmula
 * dá R$ 2.695,23, um real acima do teto da primeira faixa. A lei é assim, e a
 * calculadora não a "corrige".
 */
function reducaoAnual(
  rendimentos: Centavos,
  dataReferencia: DataISO,
  registro: Registro,
  traco: ConstrutorDeTraco,
): Centavos {
  const resolvidos = PARAMETROS_REDUCAO_ANUAL.map((id) => registro.resolver(id, dataReferencia))
  if (resolvidos.some((r) => !r.ok)) return ZERO
  const [limiteIntegral, valorMaximo, constante, coeficiente, limiteAplicacao] = resolvidos.map((r) =>
    r.ok ? r.resolvida : null,
  )
  if (!limiteIntegral || !valorMaximo || !constante || !coeficiente || !limiteAplicacao) return ZERO

  const teto = valorMonetario(limiteIntegral) ?? ZERO
  const maximoReducao = valorMonetario(valorMaximo) ?? ZERO
  const limite = valorMonetario(limiteAplicacao) ?? ZERO

  if (rendimentos > limite) {
    traco.passoComParametro(
      'Redução anual do imposto',
      `Rendimentos de ${reais(rendimentos)}, acima de ${reais(limite)} — sem redução`,
      ZERO,
      limiteAplicacao,
    )
    return ZERO
  }
  if (rendimentos <= teto) {
    traco.passoComParametro(
      'Redução anual do imposto',
      `Rendimentos de ${reais(rendimentos)}, até ${reais(teto)} — redução de até ${reais(maximoReducao)}`,
      maximoReducao,
      valorMaximo,
      'A faixa da redução é definida pelos rendimentos tributáveis, e não pela base de cálculo (Lei nº 9.250/1995, art. 11-A).',
    )
    return maximoReducao
  }
  const c = valorMonetario(constante) ?? ZERO
  const v = coeficiente.vigencia.valor
  if (v.tipo !== 'fracao') return ZERO
  // ADR-007: coeficiente em fração exata, sem ponto flutuante.
  const produto = proporcao(rendimentos, v.numerador, v.denominador, POLITICA)
  const bruta = naoNegativo(subtrair(c, produto))
  traco.passoComParametro(
    'Redução anual do imposto',
    `${reais(c)} − (${v.numerador}/${v.denominador} × ${reais(rendimentos)}) = ${reais(bruta)}`,
    bruta,
    coeficiente,
    'A faixa da redução é definida pelos rendimentos tributáveis, e não pela base de cálculo (Lei nº 9.250/1995, art. 11-A).',
  )
  return bruta
}

// ---------------------------------------------------------------------------
// CALC-121 — Quanto o PGBL economiza de imposto
// ---------------------------------------------------------------------------

export interface SaidaEconomiaPgbl {
  /** Imposto devido sem e com a contribuição, cada um no modelo mais vantajoso. */
  readonly impostoSem: Centavos
  readonly impostoCom: Centavos
  readonly economia: Centavos
  readonly modeloSem: ModeloAdotado
  readonly modeloCom: ModeloAdotado
  /** Contribuição considerada — a informada, ou o limite quando ela vem zerada. */
  readonly contribuicao: Centavos
  readonly dedutivel: Centavos
  readonly limite: Centavos
}

/**
 * A apuração anual rodada duas vezes: sem e com a contribuição.
 *
 * **Por que duas apurações, e não "alíquota × contribuição".** O PGBL só
 * deduz no modelo completo; a redução de 2026 depende dos rendimentos e é
 * limitada ao imposto; e a contribuição pode fazer o completo passar à frente
 * do simplificado. A economia verdadeira é a diferença entre os dois impostos
 * devidos, cada um no melhor modelo — e é isso que a conta entrega.
 *
 * Contribuição zerada simula o limite de 12%, que é a pergunta de quem ainda vai
 * aplicar: "quanto posso colocar, e quanto isso economiza?".
 */
export function calcularEconomiaPgbl(
  entrada: Omit<EntradaIrpfAnual, 'impostoRetido'>,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaEconomiaPgbl> {
  const base: EntradaIrpfAnual = { ...entrada, impostoRetido: ZERO, previdenciaPrivada: ZERO }
  const sem = calcularIrpfAnual(base, dataReferencia, registro)
  if (!sem.ok) return sem

  const informada = entrada.previdenciaPrivada ?? ZERO
  const contribuicao = informada > 0 ? informada : sem.valores.limitePrevidencia
  const com = calcularIrpfAnual(
    { ...base, previdenciaPrivada: contribuicao, contribuiParaRegime: entrada.contribuiParaRegime !== false },
    dataReferencia,
    registro,
  )
  if (!com.ok) return com

  const economia = naoNegativo(subtrair(sem.valores.impostoDevido, com.valores.impostoDevido))
  const etapas = [
    ...com.traco.etapas,
    {
      rotulo: 'Sem o PGBL, o imposto seria',
      formula: `modelo ${sem.valores.modeloAdotado}`,
      resultado: sem.valores.impostoDevido,
    },
    {
      rotulo: 'Economia de imposto com o PGBL',
      formula: `${reais(sem.valores.impostoDevido)} − ${reais(com.valores.impostoDevido)}`,
      resultado: economia,
    },
  ]

  return {
    ok: true,
    valores: {
      impostoSem: sem.valores.impostoDevido,
      impostoCom: com.valores.impostoDevido,
      economia,
      modeloSem: sem.valores.modeloAdotado,
      modeloCom: com.valores.modeloAdotado,
      contribuicao,
      dedutivel: com.valores.previdenciaDedutivel,
      limite: com.valores.limitePrevidencia,
    },
    traco: { etapas, dataReferencia, vigenciasAplicadas: com.traco.vigenciasAplicadas },
  }
}
