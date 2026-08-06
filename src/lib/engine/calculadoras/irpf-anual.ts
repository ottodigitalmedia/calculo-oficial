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
 * - **Previdência privada (PGBL).** Dedutível até 12% dos rendimentos
 *   tributáveis (Lei nº 9.532/1997, art. 11), e o limite é um parâmetro legal
 *   que não foi conferido em fonte oficial nesta sessão. Omitir erra para
 *   MENOS restituição, e a tela declara a ausência — o precedente é `RN-027`.
 * - **Rendimentos de tributação exclusiva** (13º, aplicações financeiras).
 *   Não entram no ajuste, por definição.
 * - **Carnê-leão, rendimentos no exterior, ganho de capital.** Cada um tem
 *   apuração própria; CALC-053 já faz o primeiro.
 * - **O redutor do art. 3º-A e a tabela de 2026 em diante.** Ver o cabeçalho de
 *   `params/data/irpf-anual.ts`: a Lei nº 15.270/2025 revogou o art. 11, e 2026
 *   é outra estrutura. O bloqueio de `RN-003` é a resposta certa até que ela
 *   seja estudada.
 *
 * Regras: `RN-011`, `RN-012`, `RN-014`.
 */

import { limitarAoTeto, maximo, minimo, naoNegativo, somar, subtrair, aplicarAliquota } from '../money'
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

  for (const r of [tabela, porDependente, tetoInstrucao, percSimplificado, tetoSimplificado]) {
    if (!r.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: r.detalhe }
  }
  if (
    !tabela.ok ||
    !porDependente.ok ||
    !tetoInstrucao.ok ||
    !percSimplificado.ok ||
    !tetoSimplificado.ok
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

  const deducoesCompleto = somar(
    entrada.inss,
    totalDependentes,
    instrucaoDedutivel,
    entrada.medicas,
    entrada.pensao,
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

  // --- O modelo adotado ---------------------------------------------------
  // Empate vai para o completo: `<` e não `<=`. Sem diferença no imposto, a
  // declaração com deduções comprovadas é a que descreve os fatos.
  const usaSimplificado = porSimplificado.imposto < porCompleto.imposto
  const modeloAdotado: ModeloAdotado = usaSimplificado ? 'simplificado' : 'completo'
  const escolhido = usaSimplificado ? porSimplificado : porCompleto
  const impostoDevido = escolhido.imposto
  const economiaDoModelo = subtrair(
    maximo(porCompleto.imposto, porSimplificado.imposto),
    minimo(porCompleto.imposto, porSimplificado.imposto),
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
      impostoCompleto: porCompleto.imposto,
      impostoSimplificado: porSimplificado.imposto,
      economiaDoModelo,
      baseCompleto,
      baseSimplificado,
      deducoesCompleto,
      descontoSimplificado,
      instrucaoDedutivel,
      aliquotaFaixa: escolhido.aliquota,
    },
    traco: traco.construir(),
  }
}
