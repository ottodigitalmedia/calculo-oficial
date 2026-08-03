/**
 * CALC-064 — Valor futuro corrigido · CALC-045 — Tesouro IPCA+.
 *
 * As duas projetam para a frente, e por isso são as primeiras do catálogo cujo
 * resultado **não é verificável contra nada**: não existe fonte para o futuro. O
 * que elas entregam é aritmética sobre uma premissa que o usuário informa, e o
 * texto de tela diz isso em vez de deixar o número parecer medição.
 *
 * PROJEÇÃO NÃO É CORREÇÃO, E O SISTEMA TRATA AS DUAS DIFERENTE
 *
 * `corrigirPorIndice` aplica índices **publicados**, um a um, e recusa mês que
 * ainda não saiu — o passado é dado. Aqui a taxa é uma hipótese, aplicada de
 * forma composta, e nenhuma recusa por defasagem faz sentido. Misturar as duas
 * num motor só faria a projeção herdar a aparência de lastro que só a correção
 * tem.
 *
 * O QUE CALC-045 EXISTE PARA MOSTRAR
 *
 * O imposto de renda incide sobre o rendimento **nominal** — inclusive sobre a
 * parte que apenas repôs a inflação. Quem olha "IPCA + 6%" e imagina 6% de ganho
 * real depois do imposto erra, e erra mais quanto maior a inflação. A conta
 * separa as duas parcelas e mostra a mordida sobre cada uma.
 */

import { aplicarAliquota, subtrair } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/** Escala das contas intermediárias, como em `financeira.ts`. */
// eslint-disable-next-line no-restricted-syntax -- escala das contas intermediárias, não parâmetro legal
const ESCALA = 1_000_000_000_000n

/** 100% em basis points. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
const BP_INTEIRO = 10_000n

/**
 * `(1 + taxa)^anos`, escalado — em inteiros, sem ponto flutuante.
 *
 * Iterativo e não por exponenciação direta, pela mesma razão de
 * `fatorDeCapitalizacao` em `financeira.ts`: dividir a cada passo mantém o
 * número pequeno e o erro abaixo do centavo.
 */
function fatorComposto(taxaBp: BasisPoints, periodos: number): bigint {
  let fator = ESCALA
  for (let k = 0; k < periodos; k += 1) {
    fator = (fator * (BP_INTEIRO + BigInt(taxaBp))) / BP_INTEIRO
  }
  return fator
}

/** Converte um fator escalado em variação percentual, em basis points. */
function variacaoDoFator(fator: bigint): BasisPoints {
  return Number(((fator - ESCALA) * BP_INTEIRO) / ESCALA) as BasisPoints
}

function aplicarFator(valor: Centavos, fator: bigint): Centavos {
  return centavos(Number((BigInt(valor) * fator) / ESCALA))
}

// ---------------------------------------------------------------------------
// CALC-064 — Valor futuro corrigido
// ---------------------------------------------------------------------------

export interface EntradaProjecao {
  readonly valorHoje: Centavos
  /** Inflação anual projetada. É premissa do usuário, não dado. */
  readonly inflacaoAnualBp: BasisPoints
  readonly anos: number
}

export interface SaidaProjecao {
  /** Quanto seria preciso ter, em moeda futura, para comprar o mesmo. */
  readonly valorFuturoEquivalente: Centavos
  /** O que o valor de hoje compraria lá na frente, em poder de compra de hoje. */
  readonly poderDeCompraFuturo: Centavos
  readonly inflacaoAcumuladaBp: BasisPoints
  readonly perdaDePoderBp: BasisPoints
}

export function projetarValorFuturo(
  entrada: EntradaProjecao,
  dataReferencia: DataISO,
): Resultado<SaidaProjecao> {
  if (entrada.valorHoje <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor de hoje para ver o resultado.',
    }
  }
  if (entrada.inflacaoAnualBp <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a inflação anual que você quer projetar para ver o resultado.',
    }
  }
  if (!Number.isInteger(entrada.anos) || entrada.anos < 1) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o prazo em anos para ver o resultado.',
    }
  }

  const etapas: Etapa[] = []
  const fator = fatorComposto(entrada.inflacaoAnualBp, entrada.anos)
  const inflacaoAcumuladaBp = variacaoDoFator(fator)

  etapas.push({
    rotulo: 'Inflação acumulada no período',
    formula: `(1 + ${percentual(entrada.inflacaoAnualBp)})^${entrada.anos} − 1`,
    resultado: centavos(inflacaoAcumuladaBp),
    unidade: 'percentual',
    justificativa:
      'A inflação de cada ano incide sobre preços já corrigidos pelos anos anteriores, então ' +
      'ela se acumula de forma composta. Multiplicar a taxa anual pelo número de anos ' +
      'subestima, e a diferença cresce rápido em prazos longos.',
  })

  const valorFuturoEquivalente = aplicarFator(entrada.valorHoje, fator)
  etapas.push({
    rotulo: 'Quanto seria preciso ter lá na frente',
    formula: `${reais(entrada.valorHoje)} × (1 + inflação acumulada)`,
    resultado: valorFuturoEquivalente,
    justificativa:
      'É o valor em moeda futura que compraria o mesmo que o valor de hoje compra agora.',
  })

  const poderDeCompraFuturo =
    fator > 0n ? centavos(Number((BigInt(entrada.valorHoje) * ESCALA) / fator)) : entrada.valorHoje
  const perdaDePoderBp = (
    fator > 0n ? Number(((fator - ESCALA) * BP_INTEIRO) / fator) : 0
  ) as BasisPoints

  etapas.push({
    rotulo: 'O que essa quantia comprará lá na frente',
    formula: `${reais(entrada.valorHoje)} ÷ (1 + inflação acumulada)`,
    resultado: poderDeCompraFuturo,
    justificativa:
      'A leitura inversa, e a que dói: guardando o dinheiro sem render nada, é isso que ele ' +
      'comprará, em poder de compra de hoje.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      valorFuturoEquivalente,
      poderDeCompraFuturo,
      inflacaoAcumuladaBp,
      perdaDePoderBp,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-045 — Tesouro IPCA+
// ---------------------------------------------------------------------------

export interface EntradaIpcaMais {
  readonly valorInvestido: Centavos
  /** O "+X%" do título: o juro real contratado, ao ano. */
  readonly taxaRealAnualBp: BasisPoints
  /** Inflação anual projetada — premissa do usuário. */
  readonly inflacaoAnualBp: BasisPoints
  readonly anos: number
  /** Alíquota de imposto sobre o rendimento nominal. */
  readonly aliquotaIrBp: BasisPoints
}

export interface SaidaIpcaMais {
  readonly valorBrutoNoVencimento: Centavos
  readonly rendimentoNominal: Centavos
  /** A parte do rendimento que apenas repôs a inflação. */
  readonly parteQueReposInflacao: Centavos
  /** A parte que é ganho acima da inflação. */
  readonly parteDeGanhoReal: Centavos
  readonly imposto: Centavos
  readonly valorLiquido: Centavos
  /** O líquido trazido a poder de compra de hoje. */
  readonly liquidoEmMoedaDeHoje: Centavos
  /** O ganho real que sobra depois do imposto, ao ano. */
  readonly ganhoRealLiquidoBp: BasisPoints
  readonly taxaNominalAnualBp: BasisPoints
}

export function calcularIpcaMais(
  entrada: EntradaIpcaMais,
  dataReferencia: DataISO,
): Resultado<SaidaIpcaMais> {
  if (entrada.valorInvestido <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor investido para ver o resultado.',
    }
  }
  if (entrada.taxaRealAnualBp <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a taxa real contratada — o "mais" do título — para ver o resultado.',
    }
  }
  if (entrada.inflacaoAnualBp < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A inflação projetada não pode ser negativa nesta conta.',
    }
  }
  if (!Number.isInteger(entrada.anos) || entrada.anos < 1) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o prazo em anos para ver o resultado.',
    }
  }
  if (entrada.aliquotaIrBp < 0 || entrada.aliquotaIrBp >= Number(BP_INTEIRO)) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A alíquota de imposto precisa ficar entre 0% e 100%.',
    }
  }

  const etapas: Etapa[] = []

  const fatorInflacao = fatorComposto(entrada.inflacaoAnualBp, entrada.anos)
  const fatorReal = fatorComposto(entrada.taxaRealAnualBp, entrada.anos)
  const fatorNominal = (fatorInflacao * fatorReal) / ESCALA

  /**
   * A taxa nominal **não** é a soma da inflação com o juro real.
   *
   * "IPCA + 6%" com inflação de 5% não rende 11% ao ano, e sim 11,3%: os dois
   * fatores se multiplicam. A diferença é pequena num ano e relevante em dez.
   */
  const taxaNominalAnualBp = variacaoDoFator(
    (fatorComposto(entrada.inflacaoAnualBp, 1) * fatorComposto(entrada.taxaRealAnualBp, 1)) /
      ESCALA,
  )

  etapas.push({
    rotulo: 'Taxa nominal ao ano',
    formula:
      `(1 + ${percentual(entrada.inflacaoAnualBp)}) × (1 + ${percentual(entrada.taxaRealAnualBp)}) − 1 ` +
      `= ${percentual(taxaNominalAnualBp)}`,
    resultado: centavos(taxaNominalAnualBp),
    unidade: 'percentual',
    justificativa:
      'Não é a soma das duas. Inflação e juro real se multiplicam, e por isso a taxa nominal ' +
      'sai um pouco acima da soma — a diferença é o juro incidindo sobre a correção.',
  })

  const valorBrutoNoVencimento = aplicarFator(entrada.valorInvestido, fatorNominal)
  const rendimentoNominal = subtrair(valorBrutoNoVencimento, entrada.valorInvestido)

  etapas.push({
    rotulo: 'Valor bruto no vencimento',
    formula: `${reais(entrada.valorInvestido)} × (1 + taxa nominal)^${entrada.anos}`,
    resultado: valorBrutoNoVencimento,
  })

  /**
   * A separação que dá sentido à calculadora.
   *
   * Parte do rendimento apenas repôs a inflação — não é ganho, é manutenção do
   * poder de compra. O resto é ganho real. O imposto, porém, não faz essa
   * distinção.
   */
  const valorSoCorrigido = aplicarFator(entrada.valorInvestido, fatorInflacao)
  const parteQueReposInflacao = subtrair(valorSoCorrigido, entrada.valorInvestido)
  const parteDeGanhoReal = subtrair(rendimentoNominal, parteQueReposInflacao)

  etapas.push({
    rotulo: 'Do rendimento, o que só repôs a inflação',
    formula: `${reais(valorSoCorrigido)} − ${reais(entrada.valorInvestido)}`,
    resultado: parteQueReposInflacao,
    justificativa:
      'Esta parte não é ganho: é o que mantém o poder de compra parado. Ela existe no papel e ' +
      'não no bolso — e ainda assim é tributada.',
  })

  etapas.push({
    rotulo: 'E o que é ganho acima da inflação',
    formula: `${reais(rendimentoNominal)} − ${reais(parteQueReposInflacao)}`,
    resultado: parteDeGanhoReal,
  })

  const imposto =
    entrada.aliquotaIrBp > 0
      ? aplicarAliquota(rendimentoNominal, entrada.aliquotaIrBp, 'meio_para_cima')
      : (0 as Centavos)

  if (entrada.aliquotaIrBp > 0) {
    etapas.push({
      rotulo: 'Imposto sobre o rendimento NOMINAL',
      formula: `${reais(rendimentoNominal)} × ${percentual(entrada.aliquotaIrBp)}`,
      resultado: imposto,
      justificativa:
        'O imposto incide sobre o rendimento inteiro, inclusive sobre a parte que apenas ' +
        'repôs a inflação. É por isso que o ganho real depois do imposto fica abaixo da taxa ' +
        'contratada — e quanto maior a inflação, maior a diferença.',
    })
  }

  const valorLiquido = subtrair(valorBrutoNoVencimento, imposto)
  etapas.push({
    rotulo: 'Valor líquido no vencimento',
    formula: `${reais(valorBrutoNoVencimento)} − ${reais(imposto)}`,
    resultado: valorLiquido,
  })

  const liquidoEmMoedaDeHoje =
    fatorInflacao > 0n
      ? centavos(Number((BigInt(valorLiquido) * ESCALA) / fatorInflacao))
      : valorLiquido

  etapas.push({
    rotulo: 'O líquido em poder de compra de hoje',
    formula: `${reais(valorLiquido)} ÷ (1 + inflação acumulada)`,
    resultado: liquidoEmMoedaDeHoje,
    justificativa:
      'É o número que responde à pergunta que interessa: quanto isso vai comprar, medido em ' +
      'dinheiro de hoje.',
  })

  /**
   * O ganho real líquido, ao ano.
   *
   * Derivado do líquido em moeda de hoje sobre o investido — e não da taxa
   * contratada menos alguma coisa. É a única forma de o número fechar com o que
   * as linhas acima mostram.
   */
  const fatorRealLiquido =
    entrada.valorInvestido > 0
      ? (BigInt(liquidoEmMoedaDeHoje) * ESCALA) / BigInt(entrada.valorInvestido)
      : ESCALA

  /**
   * Busca a taxa anual cujo fator composto reproduz o acumulado real líquido.
   *
   * Bisseção sobre inteiros, pelo mesmo motivo de `taxaInternaMensal` em
   * `financeira.ts`: é monótona, termina sempre, e o passo mínimo é a precisão
   * exibida. Newton aqui divergiria com ganho real negativo, que é hipótese
   * legítima — inflação alta com imposto pesado produz exatamente isso.
   */
  let piso = -Number(BP_INTEIRO)
  let teto = Number(BP_INTEIRO)
  for (let passo = 0; passo < 40; passo += 1) {
    if (teto - piso <= 1) break
    const meio = Math.trunc((piso + teto) / 2)
    if (fatorComposto(meio as BasisPoints, entrada.anos) < fatorRealLiquido) piso = meio
    else teto = meio
  }

  /**
   * Entre os dois vizinhos, fica o que erra menos — mesma escolha de
   * `taxaInternaMensal` em `financeira.ts`, e pelo mesmo motivo.
   *
   * **Sem esta linha o resultado exato saía um centésimo abaixo.** A bisseção
   * converge para o maior inteiro cujo fator ainda é MENOR que o alvo; quando o
   * alvo cai exatamente sobre um inteiro — o caso trivial de 10% de juro real
   * sem imposto —, aquele inteiro vai para o teto e o piso fica um abaixo. A
   * tela mostrava 9,99% onde a resposta é 10,00%, num campo cuja função é
   * justamente ser comparado com a taxa contratada.
   */
  const distanciaAoPiso =
    fatorRealLiquido - fatorComposto(piso as BasisPoints, entrada.anos)
  const distanciaAoTeto =
    fatorComposto(teto as BasisPoints, entrada.anos) - fatorRealLiquido
  const ganhoRealLiquidoBp = (distanciaAoPiso <= distanciaAoTeto ? piso : teto) as BasisPoints

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      valorBrutoNoVencimento,
      rendimentoNominal,
      parteQueReposInflacao,
      parteDeGanhoReal,
      imposto,
      valorLiquido,
      liquidoEmMoedaDeHoje,
      ganhoRealLiquidoBp,
      taxaNominalAnualBp,
    },
    traco,
  }
}
