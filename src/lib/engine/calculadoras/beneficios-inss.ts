/**
 * CALC-100 — Pensão por morte · CALC-101 — Auxílio por incapacidade temporária ·
 * CALC-102 — Salário-maternidade pago pelo INSS.
 *
 * Os três benefícios do lote de previdência, no mesmo arquivo pela razão de
 * `adicionais.ts`: são curtos, compartilham o piso constitucional e o teto do
 * regime, e cada arquivo novo no motor é um pedaço a mais no pacote adiado.
 *
 * **O que os três têm em comum e a memória precisa mostrar:**
 *
 * - **piso**: nenhum benefício que substitua o salário de contribuição fica
 *   abaixo do salário mínimo (CF, art. 201, § 2º);
 * - **teto**: o salário de contribuição tem limite máximo, que é o limite
 *   superior da última faixa da tabela do INSS — o mesmo dado, uma fonte só;
 * - **a base não é o salário de hoje**: é média de salários de contribuição, e
 *   é isso que separa a estimativa da conta real do INSS.
 *
 * Lote 7 acrescentou CALC-109 (valor da aposentadoria, EC nº 103/2019, art. 26)
 * e CALC-110 (auxílio-acidente, Lei nº 8.213/1991, art. 86), no fim do arquivo.
 *
 * **O que estes motores NÃO fazem, e declaram:** apurar a média dos salários de
 * contribuição. Ela depende do extrato do CNIS, com valores atualizados
 * monetariamente desde julho de 1994 (EC nº 103/2019, art. 26) — dado que o
 * produto não tem e não inventa. A média entra como campo.
 */

import { aplicarAliquota, maximo, minimo, somar } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import {
  CF_ART_201_P2,
  EC_103_ART_26,
  LEI_8213_ART_33,
  LEI_8213_ART_61,
  LEI_8213_ART_73,
  LEI_8213_ART_86,
} from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

type Resolvido<T> = { readonly valor: T; readonly resolvida: VigenciaResolvida } | null

function percentualDe(registro: Registro, id: string, data: DataISO): Resolvido<BasisPoints> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: basisPoints(r.resolvida.vigencia.valor.aliquotaBp), resolvida: r.resolvida }
}

function monetarioDe(registro: Registro, id: string, data: DataISO): Resolvido<Centavos> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'valor_monetario') return null
  return { valor: centavos(r.resolvida.vigencia.valor.centavos), resolvida: r.resolvida }
}

/**
 * O teto do salário de contribuição é o limite superior da ÚLTIMA faixa da
 * tabela do INSS — o mesmo número que a portaria publica como teto. Lê-se da
 * tabela em vez de cadastrar de novo: dois cadastros do mesmo valor divergem na
 * primeira virada de exercício.
 */
function tetoDoRegime(registro: Registro, data: DataISO): Resolvido<Centavos> {
  const r = registro.resolver('inss-tabela-progressiva', data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'tabela_faixas') return null
  const faixas = r.resolvida.vigencia.valor.faixas
  const ultima = faixas[faixas.length - 1]
  if (!ultima || ultima.limiteSuperiorCentavos === null) return null
  return { valor: centavos(ultima.limiteSuperiorCentavos), resolvida: r.resolvida }
}

// ---------------------------------------------------------------------------
// CALC-100 — Pensão por morte
// ---------------------------------------------------------------------------

export interface EntradaPensao {
  /** Aposentadoria recebida pelo falecido, ou a que ele teria direito. */
  readonly valorDaAposentadoria: Centavos
  /** Quantidade de dependentes habilitados. */
  readonly dependentes: number
  /** Há dependente inválido ou com deficiência — § 2º do art. 23. */
  readonly temDependenteInvalido: boolean
}

export interface SaidaPensao {
  readonly valorDaPensao: Centavos
  readonly percentualAplicado: BasisPoints
  readonly cotaFamiliar: BasisPoints
  readonly valorPorDependente: Centavos
  readonly aplicouPiso: boolean
  readonly salarioMinimo: Centavos
}

/** Limite de sanidade da entrada — não é regra legal. */
const DEPENDENTES_MAXIMO = 20

export function calcularPensaoPorMorte(
  entrada: EntradaPensao,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaPensao> {
  if (entrada.valorDaAposentadoria <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor da aposentadoria recebida, ou daquela a que o segurado teria direito.',
    }
  }
  if (
    !Number.isInteger(entrada.dependentes) ||
    entrada.dependentes < 1 ||
    entrada.dependentes > DEPENDENTES_MAXIMO
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Informe ao menos um dependente habilitado.' }
  }

  const cotaFamiliar = percentualDe(registro, 'pensao-cota-familiar', dataReferencia)
  const cotaDependente = percentualDe(registro, 'pensao-cota-por-dependente', dataReferencia)
  const cotaMaxima = percentualDe(registro, 'pensao-cota-maxima', dataReferencia)
  const salarioMinimo = monetarioDe(registro, 'salario-minimo', dataReferencia)
  if (cotaFamiliar === null || cotaDependente === null || cotaMaxima === null || salarioMinimo === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há regras de pensão por morte cadastradas para a data informada.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([cotaMaxima.resolvida.vigencia.id, salarioMinimo.resolvida.vigencia.id])

  let percentualAplicado: BasisPoints
  if (entrada.temDependenteInvalido) {
    percentualAplicado = cotaMaxima.valor
    etapas.push({
      rotulo: 'Dependente inválido ou com deficiência — cota integral',
      formula: `${percentual(cotaMaxima.valor)} da aposentadoria`,
      resultado: entrada.valorDaAposentadoria,
      parametro: citar(cotaMaxima.resolvida),
      justificativa:
        'O § 2º do art. 23 da Emenda garante o valor integral quando há dependente inválido ou com deficiência intelectual, mental ou grave.',
    })
  } else {
    vigencias.add(cotaFamiliar.resolvida.vigencia.id)
    vigencias.add(cotaDependente.resolvida.vigencia.id)
    const somaDasCotas = basisPoints(
      cotaFamiliar.valor + cotaDependente.valor * entrada.dependentes,
    )
    percentualAplicado = basisPoints(Math.min(somaDasCotas, cotaMaxima.valor))
    etapas.push({
      rotulo: 'Cota familiar mais as cotas por dependente',
      formula: `${percentual(cotaFamiliar.valor)} + ${entrada.dependentes} × ${percentual(cotaDependente.valor)}${
        somaDasCotas > cotaMaxima.valor ? `, limitado a ${percentual(cotaMaxima.valor)}` : ''
      }`,
      resultado: centavos(percentualAplicado),
      unidade: 'percentual',
      parametro: citar(cotaFamiliar.resolvida),
      justificativa:
        'As cotas por dependente cessam quando o dependente perde essa qualidade e não são revertidas aos demais — o valor da pensão cai ao longo do tempo, salvo quando restarem cinco ou mais dependentes.',
    })
  }

  const valorCalculado = aplicarAliquota(entrada.valorDaAposentadoria, percentualAplicado, POLITICA)
  etapas.push({
    rotulo: 'Pensão calculada',
    formula: `${reais(entrada.valorDaAposentadoria)} × ${percentual(percentualAplicado)}`,
    resultado: valorCalculado,
  })

  const valorDaPensao = maximo(valorCalculado, salarioMinimo.valor)
  const aplicouPiso = valorDaPensao > valorCalculado
  if (aplicouPiso) {
    etapas.push({
      rotulo: 'Piso constitucional',
      formula: `${reais(valorCalculado)} abaixo do salário mínimo de ${reais(salarioMinimo.valor)}`,
      resultado: valorDaPensao,
      fundamento: fundamentar(CF_ART_201_P2),
      justificativa:
        'Nenhum benefício que substitua o salário de contribuição pode ficar abaixo do salário mínimo.',
    })
  }

  const valorPorDependente = entrada.dependentes > 0
    ? aplicarAliquota(entrada.valorDaAposentadoria, cotaDependente.valor, POLITICA)
    : ZERO

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: {
      valorDaPensao,
      percentualAplicado,
      cotaFamiliar: cotaFamiliar.valor,
      valorPorDependente,
      aplicouPiso,
      salarioMinimo: salarioMinimo.valor,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-101 — Auxílio por incapacidade temporária
// ---------------------------------------------------------------------------

export interface EntradaAuxilioIncapacidade {
  /** Salário de benefício: média dos salários de contribuição desde julho/1994. */
  readonly salarioDeBeneficio: Centavos
  /** Média dos últimos doze salários de contribuição — o limite do art. 29, § 10. */
  readonly mediaDosUltimosDoze: Centavos
}

export interface SaidaAuxilioIncapacidade {
  readonly valorDoBeneficio: Centavos
  readonly valorAntesDosLimites: Centavos
  readonly percentual: BasisPoints
  readonly aplicouLimiteDosDoze: boolean
  readonly aplicouPiso: boolean
  readonly aplicouTeto: boolean
  readonly teto: Centavos
  readonly salarioMinimo: Centavos
}

export function calcularAuxilioIncapacidade(
  entrada: EntradaAuxilioIncapacidade,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaAuxilioIncapacidade> {
  if (entrada.salarioDeBeneficio <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o salário de benefício — a média dos seus salários de contribuição.',
    }
  }
  if (entrada.mediaDosUltimosDoze < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A média dos últimos doze não pode ser negativa.' }
  }

  const aliquota = percentualDe(registro, 'auxilio-incapacidade-percentual', dataReferencia)
  const salarioMinimo = monetarioDe(registro, 'salario-minimo', dataReferencia)
  const teto = tetoDoRegime(registro, dataReferencia)
  if (aliquota === null || salarioMinimo === null || teto === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há parâmetros do benefício por incapacidade para a data informada.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([
    aliquota.resolvida.vigencia.id,
    salarioMinimo.resolvida.vigencia.id,
    teto.resolvida.vigencia.id,
  ])

  const valorAntesDosLimites = aplicarAliquota(entrada.salarioDeBeneficio, aliquota.valor, POLITICA)
  etapas.push({
    rotulo: `Renda mensal — ${percentual(aliquota.valor)} do salário de benefício`,
    formula: `${reais(entrada.salarioDeBeneficio)} × ${percentual(aliquota.valor)}`,
    resultado: valorAntesDosLimites,
    parametro: citar(aliquota.resolvida),
    justificativa:
      'O salário de benefício é a média de 100% dos salários de contribuição desde julho de 1994, atualizados — e não o último salário recebido.',
  })

  let valor = valorAntesDosLimites
  const aplicouLimiteDosDoze = entrada.mediaDosUltimosDoze > 0 && valor > entrada.mediaDosUltimosDoze
  if (aplicouLimiteDosDoze) {
    valor = minimo(valor, entrada.mediaDosUltimosDoze)
    etapas.push({
      rotulo: 'Limite dos últimos doze salários de contribuição',
      formula: `${reais(valorAntesDosLimites)} limitado a ${reais(entrada.mediaDosUltimosDoze)}`,
      resultado: valor,
      fundamento: fundamentar(LEI_8213_ART_61),
      justificativa:
        'O § 10 do art. 29 impede que o benefício supere a média dos últimos doze salários de contribuição — é o limite que surpreende quem contribuiu menos nos últimos anos.',
    })
  }

  const aplicouTeto = valor > teto.valor
  if (aplicouTeto) {
    valor = minimo(valor, teto.valor)
    etapas.push({
      rotulo: 'Teto do Regime Geral',
      formula: `limitado a ${reais(teto.valor)}`,
      resultado: valor,
      parametro: citar(teto.resolvida),
    })
  }

  const aplicouPiso = valor < salarioMinimo.valor
  if (aplicouPiso) {
    valor = maximo(valor, salarioMinimo.valor)
    etapas.push({
      rotulo: 'Piso constitucional',
      formula: `elevado ao salário mínimo de ${reais(salarioMinimo.valor)}`,
      resultado: valor,
      fundamento: fundamentar(CF_ART_201_P2),
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: {
      valorDoBeneficio: valor,
      valorAntesDosLimites,
      percentual: aliquota.valor,
      aplicouLimiteDosDoze,
      aplicouPiso,
      aplicouTeto,
      teto: teto.valor,
      salarioMinimo: salarioMinimo.valor,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-102 — Salário-maternidade pago pelo INSS
// ---------------------------------------------------------------------------

/**
 * As três situações do art. 73, mais a desempregada do parágrafo único — que
 * segue a regra das "demais seguradas".
 */
export type CategoriaDaSegurada = 'domestica' | 'especial' | 'demais'

export interface EntradaSalarioMaternidade {
  readonly categoria: CategoriaDaSegurada
  /** Último salário de contribuição — usado pela empregada doméstica. */
  readonly ultimoSalarioDeContribuicao: Centavos
  /** Soma dos doze últimos salários de contribuição — demais seguradas. */
  readonly somaDosDozeUltimos: Centavos
}

export interface SaidaSalarioMaternidade {
  readonly valorMensal: Centavos
  readonly valorAntesDosLimites: Centavos
  readonly aplicouPiso: boolean
  readonly aplicouTeto: boolean
  readonly teto: Centavos
  readonly salarioMinimo: Centavos
}

/** Doze avos — a fração que o art. 73, III, usa. Unidade da conta, não valor legal. */
const MESES_DO_ANO = 12

export function calcularSalarioMaternidadeInss(
  entrada: EntradaSalarioMaternidade,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaSalarioMaternidade> {
  const salarioMinimo = monetarioDe(registro, 'salario-minimo', dataReferencia)
  const teto = tetoDoRegime(registro, dataReferencia)
  if (salarioMinimo === null || teto === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há salário mínimo ou teto cadastrados para a data informada.' }
  }

  if (entrada.categoria === 'domestica' && entrada.ultimoSalarioDeContribuicao <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o último salário de contribuição.' }
  }
  if (entrada.categoria === 'demais' && entrada.somaDosDozeUltimos <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a soma dos doze últimos salários de contribuição.',
    }
  }
  if (entrada.ultimoSalarioDeContribuicao < 0 || entrada.somaDosDozeUltimos < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os valores informados não podem ser negativos.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([salarioMinimo.resolvida.vigencia.id, teto.resolvida.vigencia.id])

  let valorAntesDosLimites: Centavos
  if (entrada.categoria === 'domestica') {
    valorAntesDosLimites = entrada.ultimoSalarioDeContribuicao
    etapas.push({
      rotulo: 'Empregada doméstica — último salário de contribuição',
      formula: reais(valorAntesDosLimites),
      resultado: valorAntesDosLimites,
      fundamento: fundamentar(LEI_8213_ART_73),
    })
  } else if (entrada.categoria === 'especial') {
    valorAntesDosLimites = salarioMinimo.valor
    etapas.push({
      rotulo: 'Segurada especial — um salário mínimo',
      formula: reais(salarioMinimo.valor),
      resultado: valorAntesDosLimites,
      parametro: citar(salarioMinimo.resolvida),
      justificativa:
        'A trabalhadora rural em regime de economia familiar recebe o piso, salvo se contribuiu facultativamente sobre valor maior — hipótese que esta estimativa não cobre.',
    })
  } else {
    valorAntesDosLimites = centavos(Math.round(entrada.somaDosDozeUltimos / MESES_DO_ANO))
    etapas.push({
      rotulo: 'Demais seguradas — um doze avos da soma dos doze últimos',
      formula: `${reais(entrada.somaDosDozeUltimos)} ÷ ${MESES_DO_ANO}`,
      resultado: valorAntesDosLimites,
      fundamento: fundamentar(LEI_8213_ART_73),
      justificativa:
        'A soma é apurada num período não superior a quinze meses. A mesma regra vale para a segurada desempregada que mantém a qualidade de segurada.',
    })
  }

  let valorMensal = valorAntesDosLimites
  const aplicouTeto = valorMensal > teto.valor
  if (aplicouTeto) {
    valorMensal = minimo(valorMensal, teto.valor)
    etapas.push({
      rotulo: 'Teto do Regime Geral',
      formula: `limitado a ${reais(teto.valor)}`,
      resultado: valorMensal,
      parametro: citar(teto.resolvida),
    })
  }

  const aplicouPiso = valorMensal < salarioMinimo.valor
  if (aplicouPiso) {
    valorMensal = maximo(valorMensal, salarioMinimo.valor)
    etapas.push({
      rotulo: 'Piso — um salário mínimo',
      formula: `elevado a ${reais(salarioMinimo.valor)}`,
      resultado: valorMensal,
      fundamento: fundamentar(CF_ART_201_P2),
      justificativa: 'O próprio art. 73 abre com a garantia do salário mínimo.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: {
      valorMensal,
      valorAntesDosLimites,
      aplicouPiso,
      aplicouTeto,
      teto: teto.valor,
      salarioMinimo: salarioMinimo.valor,
    },
    traco,
  }
}

/** Reexportado para as definições comporem o total de quatro meses de licença. */
export function somarMeses(valor: Centavos, meses: number): Centavos {
  let total: Centavos = ZERO
  for (let i = 0; i < meses; i += 1) total = somar(total, valor)
  return total
}

// ---------------------------------------------------------------------------
// CALC-109 — Valor da aposentadoria (EC nº 103/2019, art. 26)
// ---------------------------------------------------------------------------

/**
 * Em que regra a aposentadoria é concedida — é o que decide o coeficiente.
 *
 * - `programada`: pontos, idade progressiva, idade (transição e permanente) e
 *   as regras do professor — 60% mais o acréscimo por ano (art. 26, § 2º);
 * - `pedagio-100`: 100% da média (art. 26, § 3º, I);
 * - `incapacidade-comum`: incapacidade permanente — 60% mais o acréscimo
 *   (§ 2º, III);
 * - `incapacidade-acidentaria`: incapacidade permanente por acidente de
 *   trabalho, doença profissional ou do trabalho — 100% (§ 3º, II).
 *
 * O pedágio de 50% fica fora: o valor dele leva o fator previdenciário (art.
 * 17, parágrafo único), que depende da tábua de mortalidade do ano.
 */
export type HipoteseDoValor = 'programada' | 'pedagio-100' | 'incapacidade-comum' | 'incapacidade-acidentaria'

export interface EntradaValorDaAposentadoria {
  /** Média de todos os salários de contribuição desde julho de 1994, atualizados. */
  readonly media: Centavos
  readonly sexo: 'mulher' | 'homem'
  /** Anos COMPLETOS de contribuição — só o ano inteiro acrescenta. */
  readonly anosDeContribuicao: number
  readonly hipotese: HipoteseDoValor
}

export interface SaidaValorDaAposentadoria {
  readonly valorDoBeneficio: Centavos
  readonly mediaConsiderada: Centavos
  readonly coeficiente: BasisPoints
  /** Anos que acrescentaram ao coeficiente — zero nas hipóteses de 100%. */
  readonly anosComAcrescimo: number
  readonly aplicouTetoNaMedia: boolean
  readonly aplicouPiso: boolean
  readonly aplicouTeto: boolean
  readonly teto: Centavos
  readonly salarioMinimo: Centavos
}

/** Limite de sanidade da entrada — não é regra legal. */
const ANOS_MAXIMO = 70

export function calcularValorDaAposentadoria(
  entrada: EntradaValorDaAposentadoria,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaValorDaAposentadoria> {
  if (entrada.media <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a média dos seus salários de contribuição desde julho de 1994.',
    }
  }
  if (!Number.isInteger(entrada.anosDeContribuicao) || entrada.anosDeContribuicao < 0 || entrada.anosDeContribuicao > ANOS_MAXIMO) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Informe os anos completos de contribuição, sem as frações.' }
  }

  const base = percentualDe(registro, 'aposentadoria-valor-coeficiente-base', dataReferencia)
  const acrescimo = percentualDe(registro, 'aposentadoria-valor-acrescimo-por-ano', dataReferencia)
  const integral = percentualDe(registro, 'aposentadoria-valor-coeficiente-integral', dataReferencia)
  const limiteRes = registro.resolver(
    entrada.sexo === 'mulher' ? 'aposentadoria-valor-anos-sem-acrescimo-mulher' : 'aposentadoria-valor-anos-sem-acrescimo-homem',
    dataReferencia,
  )
  const salarioMinimo = monetarioDe(registro, 'salario-minimo', dataReferencia)
  const teto = tetoDoRegime(registro, dataReferencia)
  if (
    base === null ||
    acrescimo === null ||
    integral === null ||
    !limiteRes.ok ||
    limiteRes.resolvida.vigencia.valor.tipo !== 'inteiro' ||
    salarioMinimo === null ||
    teto === null
  ) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'O cálculo do valor pela Emenda Constitucional nº 103/2019 vale a partir de 13/11/2019 — não há parâmetros para a data informada.',
    }
  }
  const limite = limiteRes.resolvida.vigencia.valor.valor

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([salarioMinimo.resolvida.vigencia.id, teto.resolvida.vigencia.id])

  // 1. A média é limitada ao teto antes de tudo (§ 1º).
  const aplicouTetoNaMedia = entrada.media > teto.valor
  const mediaConsiderada = minimo(entrada.media, teto.valor)
  if (aplicouTetoNaMedia) {
    etapas.push({
      rotulo: 'Média limitada ao teto do Regime Geral',
      formula: `${reais(entrada.media)} limitada a ${reais(teto.valor)}`,
      resultado: mediaConsiderada,
      parametro: citar(teto.resolvida),
      fundamento: fundamentar(EC_103_ART_26),
      justificativa: 'O § 1º do art. 26 limita a própria média ao teto do salário de contribuição.',
    })
  }

  // 2. O coeficiente.
  const cem = entrada.hipotese === 'pedagio-100' || entrada.hipotese === 'incapacidade-acidentaria'
  let coeficiente: BasisPoints
  let anosComAcrescimo = 0
  if (cem) {
    coeficiente = integral.valor
    vigencias.add(integral.resolvida.vigencia.id)
    etapas.push({
      rotulo: `Coeficiente — ${percentual(coeficiente)} da média`,
      formula:
        entrada.hipotese === 'pedagio-100'
          ? 'aposentadoria pelo pedágio de 100% (art. 20)'
          : 'incapacidade permanente por acidente de trabalho, doença profissional ou do trabalho',
      resultado: centavos(coeficiente),
      unidade: 'percentual',
      parametro: citar(integral.resolvida),
      justificativa: 'O § 3º do art. 26 dá a média integral nessas duas hipóteses, sem depender do tempo de contribuição.',
    })
  } else {
    anosComAcrescimo = Math.max(0, entrada.anosDeContribuicao - limite)
    coeficiente = basisPoints(base.valor + acrescimo.valor * anosComAcrescimo)
    vigencias.add(base.resolvida.vigencia.id)
    vigencias.add(acrescimo.resolvida.vigencia.id)
    vigencias.add(limiteRes.resolvida.vigencia.id)
    etapas.push({
      rotulo: `Coeficiente — ${percentual(coeficiente)} da média`,
      formula: `${percentual(base.valor)} + ${anosComAcrescimo} × ${percentual(acrescimo.valor)} (${entrada.anosDeContribuicao} anos, acréscimo a partir de ${limite})`,
      resultado: centavos(coeficiente),
      unidade: 'percentual',
      parametro: citar(base.resolvida),
      justificativa:
        entrada.sexo === 'mulher'
          ? 'Para a mulher, cada ano completo acima de quinze acrescenta ao coeficiente (art. 26, § 5º).'
          : 'Para o homem, cada ano completo acima de vinte acrescenta ao coeficiente (art. 26, § 2º). Não há limite de cem por cento no coeficiente — quem passa dele encontra o teto do benefício.',
    })
  }

  const valorCalculado = aplicarAliquota(mediaConsiderada, coeficiente, POLITICA)
  etapas.push({
    rotulo: 'Valor calculado',
    formula: `${reais(mediaConsiderada)} × ${percentual(coeficiente)}`,
    resultado: valorCalculado,
  })

  // 3. Teto e piso do benefício que substitui o salário (Lei nº 8.213, art. 33).
  let valor = valorCalculado
  const aplicouTeto = valor > teto.valor
  if (aplicouTeto) {
    valor = minimo(valor, teto.valor)
    etapas.push({
      rotulo: 'Teto do benefício',
      formula: `limitado a ${reais(teto.valor)}`,
      resultado: valor,
      parametro: citar(teto.resolvida),
      fundamento: fundamentar(LEI_8213_ART_33),
    })
  }
  const aplicouPiso = valor < salarioMinimo.valor
  if (aplicouPiso) {
    valor = maximo(valor, salarioMinimo.valor)
    etapas.push({
      rotulo: 'Piso constitucional',
      formula: `elevado ao salário mínimo de ${reais(salarioMinimo.valor)}`,
      resultado: valor,
      fundamento: fundamentar(CF_ART_201_P2),
      justificativa: 'Nenhuma aposentadoria fica abaixo do salário mínimo — é benefício que substitui o salário.',
    })
  }

  return {
    ok: true,
    valores: {
      valorDoBeneficio: valor,
      mediaConsiderada,
      coeficiente,
      anosComAcrescimo,
      aplicouTetoNaMedia,
      aplicouPiso,
      aplicouTeto,
      teto: teto.valor,
      salarioMinimo: salarioMinimo.valor,
    },
    traco: { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] },
  }
}

// ---------------------------------------------------------------------------
// CALC-110 — Auxílio-acidente (Lei nº 8.213/1991, art. 86)
// ---------------------------------------------------------------------------

export interface EntradaAuxilioAcidente {
  /** Salário de benefício: a média dos salários de contribuição. */
  readonly salarioDeBeneficio: Centavos
}

export interface SaidaAuxilioAcidente {
  readonly valorDoBeneficio: Centavos
  readonly salarioDeBeneficioConsiderado: Centavos
  readonly percentual: BasisPoints
  readonly aplicouTeto: boolean
  readonly teto: Centavos
  /** Para a nota: o auxílio-acidente pode ficar abaixo dele. */
  readonly salarioMinimo: Centavos
  readonly abaixoDoMinimo: boolean
}

export function calcularAuxilioAcidente(
  entrada: EntradaAuxilioAcidente,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaAuxilioAcidente> {
  if (entrada.salarioDeBeneficio <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o salário de benefício — a média dos seus salários de contribuição.',
    }
  }

  const aliquota = percentualDe(registro, 'auxilio-acidente-percentual', dataReferencia)
  const salarioMinimo = monetarioDe(registro, 'salario-minimo', dataReferencia)
  const teto = tetoDoRegime(registro, dataReferencia)
  if (aliquota === null || salarioMinimo === null || teto === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há parâmetros do auxílio-acidente para a data informada.' }
  }

  const etapas: Etapa[] = []
  const aplicouTeto = entrada.salarioDeBeneficio > teto.valor
  const sb = minimo(entrada.salarioDeBeneficio, teto.valor)
  if (aplicouTeto) {
    etapas.push({
      rotulo: 'Salário de benefício limitado ao teto',
      formula: `${reais(entrada.salarioDeBeneficio)} limitado a ${reais(teto.valor)}`,
      resultado: sb,
      parametro: citar(teto.resolvida),
      fundamento: fundamentar(EC_103_ART_26),
    })
  }

  const valor = aplicarAliquota(sb, aliquota.valor, POLITICA)
  etapas.push({
    rotulo: `Auxílio-acidente — ${percentual(aliquota.valor)} do salário de benefício`,
    formula: `${reais(sb)} × ${percentual(aliquota.valor)}`,
    resultado: valor,
    parametro: citar(aliquota.resolvida),
    fundamento: fundamentar(LEI_8213_ART_86),
    justificativa:
      'É indenização, e não substitui o salário: pode ser recebido junto com ele e pode ficar abaixo do salário mínimo. Cessa na véspera de qualquer aposentadoria.',
  })

  return {
    ok: true,
    valores: {
      valorDoBeneficio: valor,
      salarioDeBeneficioConsiderado: sb,
      percentual: aliquota.valor,
      aplicouTeto,
      teto: teto.valor,
      salarioMinimo: salarioMinimo.valor,
      abaixoDoMinimo: valor < salarioMinimo.valor,
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [aliquota.resolvida.vigencia.id, teto.resolvida.vigencia.id, salarioMinimo.resolvida.vigencia.id],
    },
  }
}
