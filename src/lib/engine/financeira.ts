/**
 * Matemática financeira do motor — em inteiros, sem ponto flutuante.
 *
 * **O problema que este módulo resolve.** `ADR-004` proíbe ponto flutuante
 * sobre dinheiro, e até aqui isso foi fácil: toda conta era soma, subtração ou
 * uma proporção com denominador pequeno. Desconto de fluxo não é: exige elevar
 * `(1 + i)` a potências de até algumas centenas, e o resultado precisa manter
 * precisão suficiente para que a diferença de um centavo não vire diferença de
 * um real na parcela.
 *
 * A saída é `BigInt` com escala fixa. Inteiro de precisão arbitrária não tem
 * o erro de representação do `number`, e a escala de 10^12 deixa margem de
 * sobra sobre os centavos que saem no fim. Nenhum valor monetário passa por
 * `number` fracionário em momento algum.
 *
 * Nada aqui conhece norma: são fórmulas. Quem cita dispositivo é a calculadora
 * que as usa.
 */

import { centavos, type BasisPoints, type Centavos } from './types'

/**
 * Escala das contas intermediárias.
 *
 * 10^12 é folgado de propósito: o erro de truncamento por período fica na
 * décima segunda casa, e mesmo em 600 períodos não alcança o centavo.
 */
// eslint-disable-next-line no-restricted-syntax -- escala das contas intermediárias, não constante legal
export const ESCALA = 1_000_000_000_000n

/** 100% em basis points, como `BigInt`. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point (ADR-004 A-2)
const BP_INTEIRO = 10_000n

/**
 * Fator de desconto acumulado de `n` períodos, escalado.
 *
 * Devolve `ESCALA / (1 + i)^n`. Iterativo em vez de exponenciação direta
 * porque `(10.000 + i)^600` é um inteiro de milhares de dígitos — correto,
 * porém desnecessário: dividir a cada passo mantém o número pequeno e o erro
 * abaixo do centavo.
 */
function fatorDeDesconto(taxaBp: bigint, n: number): bigint {
  let fator = ESCALA
  for (let k = 0; k < n; k += 1) {
    fator = (fator * BP_INTEIRO) / (BP_INTEIRO + taxaBp)
  }
  return fator
}

/** `(1 + i)^n` escalado. */
/**
 * Exportado desde CALC-020: os fatores de redução do ganho de capital são o
 * INVERSO de (1+i)^n, e reusá-lo é o que mantém a exponenciação em inteiro
 * grande num só lugar do sistema.
 */
export function fatorDeCapitalizacao(taxaBp: bigint, n: number): bigint {
  let fator = ESCALA
  for (let k = 0; k < n; k += 1) {
    fator = (fator * (BP_INTEIRO + taxaBp)) / BP_INTEIRO
  }
  return fator
}

/**
 * Valor presente de `n` parcelas iguais, à taxa informada.
 *
 * É a soma de `parcela / (1 + i)^k` para k de 1 a n.
 */
export function valorPresenteDeSerie(
  parcela: Centavos,
  n: number,
  taxaBp: BasisPoints,
): Centavos {
  if (n <= 0) return centavos(0)

  const i = BigInt(taxaBp)
  const valor = BigInt(parcela)
  let fator = ESCALA
  let soma = 0n

  for (let k = 0; k < n; k += 1) {
    fator = (fator * BP_INTEIRO) / (BP_INTEIRO + i)
    soma += valor * fator
  }

  return centavos(Number(soma / ESCALA))
}

/**
 * Parcela do sistema francês (Price) — prestação constante.
 *
 *     P = PV × i × (1+i)^n / ((1+i)^n − 1)
 *
 * Com taxa zero a prestação é a simples divisão do principal, e a fórmula
 * acima seria uma divisão por zero — daí o desvio explícito.
 */
export function parcelaPrice(principal: Centavos, n: number, taxaBp: BasisPoints): Centavos {
  if (n <= 0) return centavos(0)
  if (taxaBp === 0) return centavos(Math.round(principal / n))

  const i = BigInt(taxaBp)
  const capitalizacao = fatorDeCapitalizacao(i, n)
  const numerador = BigInt(principal) * i * capitalizacao
  const denominador = BP_INTEIRO * (capitalizacao - ESCALA)

  // Arredondamento para o inteiro mais próximo, sem `Math.round` sobre float.
  const dobro = (2n * numerador) / denominador
  return centavos(Number((dobro + 1n) / 2n))
}

/**
 * A taxa que iguala o valor presente das parcelas ao valor liberado.
 *
 * É a taxa interna de retorno do fluxo, e é o que a Resolução CMN nº
 * 4.881/2020 chama de CET no art. 4º. Não existe forma fechada: resolve-se por
 * busca.
 *
 * **Bisseção, e não Newton.** Newton converge mais rápido e depende de uma
 * derivada e de um chute inicial — com fluxo degenerado ele diverge ou oscila,
 * e o resultado seria um número errado com aparência de certo. A bisseção
 * sobre inteiros em basis points é monótona, termina sempre, e o passo mínimo
 * é exatamente a precisão exibida: 0,01% ao mês.
 *
 * Devolve `null` quando o fluxo não tem solução no intervalo — o que acontece,
 * legitimamente, quando a soma das parcelas não supera o valor liberado.
 */
export function taxaInternaMensal(
  valorLiberado: Centavos,
  parcela: Centavos,
  n: number,
): BasisPoints | null {
  if (valorLiberado <= 0 || parcela <= 0 || n <= 0) return null

  // Sem juros nenhum, o valor presente é a soma nua das parcelas. Se ela não
  // alcança o liberado, não há taxa positiva que resolva.
  if (parcela * n <= valorLiberado) return null

  let piso = 0
  // 100% ao mês cobre qualquer crédito legal do país com folga larga.
  // eslint-disable-next-line no-restricted-syntax -- teto da busca, não parâmetro legal
  let teto = 10_000

  for (let passo = 0; passo < 64; passo += 1) {
    if (teto - piso <= 1) break
    const meio = Math.trunc((piso + teto) / 2)
    const presente = valorPresenteDeSerie(parcela, n, meio as BasisPoints)
    if (presente > valorLiberado) piso = meio
    else teto = meio
  }

  // Entre os dois vizinhos, fica o que erra menos.
  const noPiso = valorPresenteDeSerie(parcela, n, piso as BasisPoints)
  const noTeto = valorPresenteDeSerie(parcela, n, teto as BasisPoints)
  const escolhido =
    Math.abs(noPiso - valorLiberado) <= Math.abs(noTeto - valorLiberado) ? piso : teto

  return escolhido as BasisPoints
}

/**
 * Converte taxa mensal em anual equivalente: `(1 + i)^12 − 1`.
 *
 * A Resolução CMN nº 4.881/2020 expressa o CET ao ano descontando por dias
 * corridos sobre 365. Com parcelas mensais iguais, tratar cada período como um
 * doze avos do ano é a leitura usual e é a que esta calculadora declara — a
 * diferença aparece só quando as datas de vencimento são irregulares, hipótese
 * que a calculadora não aceita.
 */
export function anualizar(taxaMensalBp: BasisPoints): BasisPoints {
  const anual = fatorDeCapitalizacao(BigInt(taxaMensalBp), 12) - ESCALA
  return Number((anual * BP_INTEIRO) / ESCALA) as BasisPoints
}

/** Juros de um período sobre o saldo devedor. */
export function jurosDoPeriodo(saldo: Centavos, taxaBp: BasisPoints): Centavos {
  const bruto = (BigInt(saldo) * BigInt(taxaBp) * 2n) / BP_INTEIRO
  return centavos(Number((bruto + 1n) / 2n))
}

export { fatorDeDesconto }
