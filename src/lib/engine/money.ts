/**
 * Aritmética monetária em inteiros de centavos (`ADR-004`, `RN-005`).
 *
 * Soma e subtração são exatas por construção (`A-3`). O trabalho de verdade
 * está na divisão: é onde a fração aparece, onde a política de arredondamento
 * precisa ser escolhida (`A-4`), e onde `ADR-004` reconhece que sobra o risco
 * residual do sistema — saber **em quais etapas a norma exige arredondar** é
 * pesquisa jurídica, não decisão de implementação (`RN-006`).
 *
 * Este módulo não tem dependência de runtime e não conhece formatação. Devolve
 * centavos e basis points; converter para "R$ 4.500,00" é da camada de
 * apresentação (`C-M4` de `ADR-003`).
 */

import {
  type BasisPoints,
  type Centavos,
  type PoliticaArredondamento,
  ZERO,
  basisPoints,
  centavos,
  exigirProdutoSeguro,
} from './types'

/**
 * Denominador do basis point: 100% = 10.000 bp.
 *
 * É definição de unidade, não constante legal — daí a dispensa de BV-10, que
 * existe para impedir tabela de INSS escrita à mão dentro do motor.
 */
// eslint-disable-next-line no-restricted-syntax -- definição da unidade basis point (A-2), não parâmetro legal
const BP_POR_INTEIRO = 10_000

// ---------------------------------------------------------------------------
// Soma e subtração — exatas (A-3)
// ---------------------------------------------------------------------------

/** Soma valores em centavos. Exata: nenhum arredondamento acontece aqui. */
export function somar(...valores: readonly Centavos[]): Centavos {
  let total = 0
  for (const v of valores) total += v
  return centavos(total)
}

/** Subtrai `b` de `a`. Exata. */
export function subtrair(a: Centavos, b: Centavos): Centavos {
  return centavos(a - b)
}

/** Inverte o sinal. Útil para exibir desconto como débito. */
export function negar(valor: Centavos): Centavos {
  return centavos(-valor)
}

/** Multiplica por uma quantidade inteira — dias, parcelas, dependentes. Exata. */
export function multiplicarPorInteiro(valor: Centavos, quantidade: number): Centavos {
  if (!Number.isInteger(quantidade)) {
    throw new TypeError(`multiplicarPorInteiro: quantidade deve ser inteira, recebido ${quantidade}`)
  }
  exigirProdutoSeguro(valor, quantidade, 'multiplicarPorInteiro')
  return centavos(valor * quantidade)
}

// ---------------------------------------------------------------------------
// Divisão — onde a política importa
// ---------------------------------------------------------------------------

/**
 * Divisão inteira exata, com quociente e resto em magnitude.
 *
 * Não usa `Math.round` nem `toFixed`: ambos operam em ponto flutuante, e a
 * proibição de `A-6` não é estilística. O quociente aproximado da divisão em
 * ponto flutuante é corrigido por comparação com multiplicação inteira, que é
 * exata dentro do inteiro seguro — as duas correções abaixo executam no máximo
 * uma vez cada.
 */
function dividirEmMagnitude(
  dividendo: number,
  divisor: number,
): { readonly quociente: number; readonly resto: number; readonly negativo: boolean } {
  if (divisor === 0) {
    throw new RangeError('divisão por zero')
  }
  const negativo = dividendo < 0 !== divisor < 0 && dividendo !== 0
  const a = Math.abs(dividendo)
  const b = Math.abs(divisor)

  let q = Math.floor(a / b)
  while (q * b > a) q--
  while ((q + 1) * b <= a) q++

  return { quociente: q, resto: a - q * b, negativo }
}

/**
 * Aplica a política sobre quociente e resto, ambos em magnitude.
 *
 * A distinção entre as políticas só aparece no empate — `2 × resto === divisor`
 * — e só muda o resultado em valor negativo. Ver a tabela em `PoliticaArredondamento`.
 */
function arredondarMagnitude(
  quociente: number,
  resto: number,
  divisor: number,
  negativo: boolean,
  politica: PoliticaArredondamento,
): number {
  if (resto === 0) return negativo ? -quociente : quociente

  const dobro = 2 * resto
  let magnitude: number

  switch (politica) {
    case 'truncar':
      magnitude = quociente
      break
    case 'meio_afastando_de_zero':
      magnitude = dobro >= divisor ? quociente + 1 : quociente
      break
    case 'meio_para_cima':
      // Empate sobe para +∞: em valor positivo isso aumenta a magnitude; em
      // valor negativo, a mantém. Daí a comparação estrita quando negativo.
      magnitude = negativo
        ? dobro > divisor
          ? quociente + 1
          : quociente
        : dobro >= divisor
          ? quociente + 1
          : quociente
      break
  }

  return negativo ? -magnitude : magnitude
}

/**
 * Divide um valor monetário por um inteiro, com política explícita.
 *
 * Usado onde a norma divide: salário pelo divisor de jornada, base por avos,
 * parcela por número de meses.
 */
export function dividirPorInteiro(
  valor: Centavos,
  divisor: number,
  politica: PoliticaArredondamento,
): Centavos {
  if (!Number.isInteger(divisor)) {
    throw new TypeError(`dividirPorInteiro: divisor deve ser inteiro, recebido ${divisor}`)
  }
  const { quociente, resto, negativo } = dividirEmMagnitude(valor, divisor)
  return centavos(arredondarMagnitude(quociente, resto, Math.abs(divisor), negativo, politica))
}

/**
 * Aplica uma alíquota em basis points sobre uma base.
 *
 * Multiplica **antes** de dividir, de propósito: dividir primeiro descartaria
 * a fração antes de ela influenciar o resultado, e o erro se acumularia a cada
 * faixa da tabela progressiva.
 */
export function aplicarAliquota(
  base: Centavos,
  aliquota: BasisPoints,
  politica: PoliticaArredondamento,
): Centavos {
  exigirProdutoSeguro(base, aliquota, 'aplicarAliquota')
  const { quociente, resto, negativo } = dividirEmMagnitude(base * aliquota, BP_POR_INTEIRO)
  return centavos(arredondarMagnitude(quociente, resto, BP_POR_INTEIRO, negativo, politica))
}

/**
 * Soma contribuições de uma tabela progressiva, arredondando **uma única vez**
 * no total (`RN-008`).
 *
 * Arredondar faixa a faixa e somar dá resultado diferente de somar e arredondar
 * — a diferença é de um centavo e aparece com frequência. Para um salário de
 * R$ 5.000,00 na tabela de 2025, faixa a faixa dá R$ 509,59 e o total
 * arredondado dá R$ 509,60.
 *
 * **A Receita Federal publica R$ 509,60**, nos exemplos de aplicação da Lei
 * nº 15.270/2025. É evidência oficial de qual das duas formas vale, e é o
 * motivo de esta função existir em vez de um laço com `aplicarAliquota`.
 *
 * A precisão é preservada acumulando o produto `base × alíquota` em inteiros,
 * sem dividir por 10.000 no caminho.
 */
export function somarAliquotasPorFaixa(
  parcelas: readonly { readonly base: Centavos; readonly aliquota: BasisPoints }[],
  politica: PoliticaArredondamento,
): Centavos {
  let acumulado = 0
  for (const { base, aliquota } of parcelas) {
    exigirProdutoSeguro(base, aliquota, 'somarAliquotasPorFaixa')
    acumulado += base * aliquota
  }
  const { quociente, resto, negativo } = dividirEmMagnitude(acumulado, BP_POR_INTEIRO)
  return centavos(arredondarMagnitude(quociente, resto, BP_POR_INTEIRO, negativo, politica))
}

/**
 * Aplica uma proporção `numerador/denominador` — a forma dos avos (`RN-016`).
 *
 * `proporcao(base, 7, 12, ...)` são sete avos. Existe separada de
 * `dividirPorInteiro` porque multiplicar antes de dividir muda o resultado:
 * `(base × 7) / 12` e `(base / 12) × 7` divergem em centavos, e a primeira é a
 * que preserva a fração até o único arredondamento.
 */
export function proporcao(
  base: Centavos,
  numerador: number,
  denominador: number,
  politica: PoliticaArredondamento,
): Centavos {
  if (!Number.isInteger(numerador) || !Number.isInteger(denominador)) {
    throw new TypeError(
      `proporcao: numerador e denominador devem ser inteiros, recebidos ${numerador}/${denominador}`,
    )
  }
  exigirProdutoSeguro(base, numerador, 'proporcao')
  const { quociente, resto, negativo } = dividirEmMagnitude(base * numerador, denominador)
  return centavos(
    arredondarMagnitude(quociente, resto, Math.abs(denominador), negativo, politica),
  )
}

// ---------------------------------------------------------------------------
// Comparação e limites
// ---------------------------------------------------------------------------

/** Menor dos valores. */
export function minimo(a: Centavos, b: Centavos): Centavos {
  return a <= b ? a : b
}

/** Maior dos valores. */
export function maximo(a: Centavos, b: Centavos): Centavos {
  return a >= b ? a : b
}

/**
 * Limita um valor ao teto informado — a forma de `RN-009`, o teto
 * previdenciário.
 */
export function limitarAoTeto(valor: Centavos, teto: Centavos): Centavos {
  return minimo(valor, teto)
}

/**
 * Impede resultado negativo, devolvendo zero no lugar.
 *
 * É a forma de `RN-014`: imposto apurado negativo é zero, nunca crédito.
 */
export function naoNegativo(valor: Centavos): Centavos {
  return maximo(valor, ZERO)
}

export function ehZero(valor: Centavos): boolean {
  return valor === 0
}

export function ehNegativo(valor: Centavos): boolean {
  return valor < 0
}

// ---------------------------------------------------------------------------
// Derivadas
// ---------------------------------------------------------------------------

/**
 * Alíquota efetiva: quanto a parte representa do total, em basis points.
 *
 * Alimenta a saída secundária de CALC-016 (`03-functional-spec` §3.9) — "é a
 * informação que mais surpreende o usuário e a que mais gera desconfiança
 * quando não explicada".
 *
 * Total zero devolve zero: não há alíquota efetiva sobre base inexistente, e
 * devolver erro aqui obrigaria todo chamador a tratar um caso que não é erro.
 */
export function aliquotaEfetiva(
  parte: Centavos,
  total: Centavos,
  politica: PoliticaArredondamento,
): BasisPoints {
  if (total === 0) return basisPoints(0)
  exigirProdutoSeguro(parte, BP_POR_INTEIRO, 'aliquotaEfetiva')
  const { quociente, resto, negativo } = dividirEmMagnitude(parte * BP_POR_INTEIRO, total)
  return basisPoints(
    arredondarMagnitude(quociente, resto, Math.abs(total), negativo, politica),
  )
}
