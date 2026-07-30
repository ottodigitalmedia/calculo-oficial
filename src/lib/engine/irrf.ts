/**
 * Imposto sobre a renda retido na fonte — `RN-011` a `RN-014`, `RN-013.1`.
 *
 * O cálculo de maior risco do sistema. Combina três mecanismos que interagem:
 *
 *   1. escolha entre deduções legais e desconto simplificado (`RN-012`);
 *   2. tabela progressiva com parcela a deduzir;
 *   3. redutor do art. 3º-A da Lei nº 9.250/1995, vigente a partir de 2026.
 *
 * Os cinco exemplos numéricos publicados pela Receita Federal exercitam os
 * três, e são casos-ouro em `tests/golden/`.
 */

import {
  aplicarAliquota,
  minimo,
  naoNegativo,
  proporcao,
  somar,
  subtrair,
} from './money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from './traco'
import { type BasisPoints, type Centavos, ZERO, basisPoints, centavos } from './types'
import type { DataISO, VigenciaResolvida } from '../params/tipos'
import type { Registro } from '../params/registry'

export const PARAMETROS_IRRF = [
  'irrf-tabela-progressiva',
  'irrf-deducao-dependente',
  'irrf-desconto-simplificado',
] as const

/**
 * Parâmetros do redutor. **Opcionais por construção.**
 *
 * O mecanismo passou a existir em 2026; antes disso não havia redução. Ausência
 * de vigência aqui significa "não havia redutor", e **não** "não temos o dado"
 * — que é o que `RN-003` significa em todo o resto do sistema.
 *
 * Confundir os dois bloquearia todo cálculo anterior a 2026. Por isso o redutor
 * é resolvido em bloco: ou os cinco parâmetros existem, ou nenhum se aplica.
 */
const PARAMETROS_REDUTOR = [
  'irrf-reducao-limite-integral',
  'irrf-reducao-valor-maximo',
  'irrf-reducao-constante',
  'irrf-reducao-coeficiente',
  'irrf-reducao-limite-aplicacao',
] as const

const POLITICA = 'meio_para_cima' as const

export interface EntradaIrrf {
  /** Rendimento bruto tributável do mês. */
  readonly rendimentoBruto: Centavos
  /** Contribuição previdenciária descontada. */
  readonly inss: Centavos
  readonly dependentes: number
  /** Pensão alimentícia por decisão judicial. */
  readonly pensao: Centavos
}

export type BaseEscolhida = 'deducoes_legais' | 'desconto_simplificado'

export interface SaidaIrrf {
  readonly imposto: Centavos
  readonly baseCalculo: Centavos
  readonly baseEscolhida: BaseEscolhida
  readonly aliquotaFaixa: BasisPoints
  readonly reducaoAplicada: Centavos
}

function valorMonetario(r: VigenciaResolvida): Centavos | null {
  return r.vigencia.valor.tipo === 'valor_monetario' ? centavos(r.vigencia.valor.centavos) : null
}

export function calcularIrrf(
  entrada: EntradaIrrf,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaIrrf> {
  if (entrada.rendimentoBruto < 0 || entrada.inss < 0 || entrada.pensao < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Valores não podem ser negativos.' }
  }
  if (!Number.isInteger(entrada.dependentes) || entrada.dependentes < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O número de dependentes deve ser inteiro e não negativo.',
    }
  }

  const tabela = registro.resolver('irrf-tabela-progressiva', dataReferencia)
  const porDependente = registro.resolver('irrf-deducao-dependente', dataReferencia)
  const simplificado = registro.resolver('irrf-desconto-simplificado', dataReferencia)

  for (const r of [tabela, porDependente, simplificado]) {
    if (!r.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: r.detalhe }
  }
  if (!tabela.ok || !porDependente.ok || !simplificado.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Parâmetro de IRRF indisponível.' }
  }
  if (tabela.resolvida.vigencia.valor.tipo !== 'tabela_faixas') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Parâmetro de IRRF inválido.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)
  traco.passo('Rendimento bruto', reais(entrada.rendimentoBruto), entrada.rendimentoBruto)

  // --- RN-011 · base pelas deduções legais -------------------------------
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

  const baseLegais = naoNegativo(
    subtrair(entrada.rendimentoBruto, somar(entrada.inss, totalDependentes, entrada.pensao)),
  )
  traco.passo(
    'Base pelas deduções legais',
    `${reais(entrada.rendimentoBruto)} − ${reais(entrada.inss)} − ${reais(totalDependentes)} − ${reais(entrada.pensao)}`,
    baseLegais,
  )

  // --- RN-012 · base pelo desconto simplificado --------------------------
  const limiteSimplificado = valorMonetario(simplificado.resolvida) ?? ZERO
  const baseSimplificada = naoNegativo(subtrair(entrada.rendimentoBruto, limiteSimplificado))
  traco.passoComParametro(
    'Base pelo desconto simplificado',
    `${reais(entrada.rendimentoBruto)} − ${reais(limiteSimplificado)}`,
    baseSimplificada,
    simplificado.resolvida,
  )

  // A mais favorável é a MENOR base — menos base, menos imposto.
  const usaSimplificado = baseSimplificada < baseLegais
  const baseCalculo = minimo(baseLegais, baseSimplificada)
  const baseEscolhida: BaseEscolhida = usaSimplificado
    ? 'desconto_simplificado'
    : 'deducoes_legais'

  traco.passo(
    'Base de cálculo adotada',
    `menor entre ${reais(baseLegais)} e ${reais(baseSimplificada)}`,
    baseCalculo,
  )
  // A justificativa é exigência de RN-012: a memória registra qual foi
  // aplicada E por quê.
  traco.passo(
    usaSimplificado ? 'Aplicado o desconto simplificado' : 'Aplicadas as deduções legais',
    usaSimplificado
      ? `O desconto simplificado produz base menor e é mais favorável ao contribuinte.`
      : `As deduções legais produzem base menor e são mais favoráveis ao contribuinte.`,
    baseCalculo,
  )

  // --- Tabela progressiva ------------------------------------------------
  const faixa =
    tabela.resolvida.vigencia.valor.faixas.find(
      (f) => f.limiteSuperiorCentavos === null || baseCalculo <= f.limiteSuperiorCentavos,
    ) ?? tabela.resolvida.vigencia.valor.faixas[tabela.resolvida.vigencia.valor.faixas.length - 1]

  if (!faixa) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Tabela de IRRF sem faixas.' }
  }

  const aliquota = basisPoints(faixa.aliquotaBp)
  const parcelaDeduzir = centavos(faixa.parcelaDeduzirCentavos ?? 0)
  const impostoTabela = naoNegativo(
    subtrair(aplicarAliquota(baseCalculo, aliquota, POLITICA), parcelaDeduzir),
  )

  traco.passoComParametro(
    `Imposto pela tabela — faixa de ${percentual(aliquota)}`,
    `${reais(baseCalculo)} × ${percentual(aliquota)} − ${reais(parcelaDeduzir)}`,
    impostoTabela,
    tabela.resolvida,
  )

  // --- RN-013.1 · redutor, quando vigente --------------------------------
  const reducao = calcularReducao(entrada.rendimentoBruto, impostoTabela, dataReferencia, registro, traco)

  // RN-014 · nunca negativo.
  const imposto = naoNegativo(subtrair(impostoTabela, reducao))
  traco.passo(
    'Imposto devido',
    reducao > 0 ? `${reais(impostoTabela)} − ${reais(reducao)}` : reais(impostoTabela),
    imposto,
  )

  return {
    ok: true,
    valores: {
      imposto,
      baseCalculo,
      baseEscolhida,
      aliquotaFaixa: aliquota,
      reducaoAplicada: reducao,
    },
    traco: traco.construir(),
  }
}

/**
 * Redução do art. 3º-A da Lei nº 9.250/1995 (`RN-013.1`).
 *
 * Devolve zero quando o mecanismo não vigia na data — sem erro, porque não
 * havia redutor antes de 2026 e isso não é falta de dado.
 *
 *   até R$ 5.000,00        redução de até R$ 312,89 — TETO FIXO, não fórmula
 *   R$ 5.000,01 a 7.350,00 978,62 − (0,133145 × rendimentos tributáveis)
 *   acima de R$ 7.350,00   nenhuma
 *
 * Sobre a primeira faixa: aplicar a fórmula ali produziria uma redução BRUTA
 * de R$ 446,04 num rendimento de R$ 4.000, contra o teto de R$ 312,89. O
 * imposto final, porém, seria o MESMO — o §1º limita a redução ao imposto
 * apurado, e quem ganha até R$ 5.000 nunca deve mais que R$ 312,89, porque a
 * base pelo simplificado é `rendimento − 607,20`. O teto foi calibrado
 * exatamente para isso.
 *
 * O que muda é a EXPLICAÇÃO exibida ao usuário. Num produto cuja tese é a
 * memória de cálculo, seguir o texto da norma continua sendo o certo — mas o
 * erro é de traço, não de valor. Verificado por teste de mutação.
 */
function calcularReducao(
  rendimentoBruto: Centavos,
  impostoTabela: Centavos,
  dataReferencia: DataISO,
  registro: Registro,
  traco: ConstrutorDeTraco,
): Centavos {
  const resolvidos = PARAMETROS_REDUTOR.map((id) => registro.resolver(id, dataReferencia))
  if (resolvidos.some((r) => !r.ok)) return ZERO

  const [limiteIntegral, valorMaximo, constante, coeficiente, limiteAplicacao] = resolvidos.map(
    (r) => (r.ok ? r.resolvida : null),
  )
  if (!limiteIntegral || !valorMaximo || !constante || !coeficiente || !limiteAplicacao) return ZERO

  const teto = valorMonetario(limiteIntegral) ?? ZERO
  const maximo = valorMonetario(valorMaximo) ?? ZERO
  const limite = valorMonetario(limiteAplicacao) ?? ZERO

  if (rendimentoBruto > limite) {
    traco.passoComParametro(
      'Redução do imposto',
      `Rendimento ${reais(rendimentoBruto)} acima de ${reais(limite)} — sem redução`,
      ZERO,
      limiteAplicacao,
    )
    return ZERO
  }

  let bruta: Centavos
  if (rendimentoBruto <= teto) {
    bruta = maximo
    traco.passoComParametro(
      'Redução do imposto',
      `Rendimento ${reais(rendimentoBruto)} até ${reais(teto)} — redução de até ${reais(maximo)}`,
      bruta,
      valorMaximo,
    )
  } else {
    const c = valorMonetario(constante) ?? ZERO
    const v = coeficiente.vigencia.valor
    if (v.tipo !== 'fracao') return ZERO
    // ADR-007: coeficiente em fração exata, aplicado sem ponto flutuante.
    const produto = proporcao(rendimentoBruto, v.numerador, v.denominador, POLITICA)
    bruta = naoNegativo(subtrair(c, produto))
    traco.passoComParametro(
      'Redução do imposto',
      `${reais(c)} − (${v.numerador}/${v.denominador} × ${reais(rendimentoBruto)}) = ${reais(bruta)}`,
      bruta,
      coeficiente,
    )
  }

  // §1º — a redução é limitada ao imposto apurado. Nunca gera crédito.
  const aplicada = minimo(bruta, impostoTabela)
  if (aplicada < bruta) {
    traco.passo(
      'Redução limitada ao imposto',
      `${reais(bruta)} limitada a ${reais(impostoTabela)}`,
      aplicada,
    )
  }
  return aplicada
}
