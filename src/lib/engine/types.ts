/**
 * Tipos fundamentais do motor de cálculo.
 *
 * `ADR-004` decidiu representar dinheiro como inteiro em centavos e alíquota
 * como inteiro em basis points. A decisão elimina o erro de representação,
 * mas sozinha não impede o erro mais provável que sobra: **passar o número
 * certo no lugar errado**. `750` é 7,50% em basis points e é R$ 7,50 em
 * centavos, e nada no tipo `number` distingue os dois.
 *
 * Por isso os tipos abaixo são marcados. A marca não existe em tempo de
 * execução — some na compilação e não custa um byte no pacote — mas faz o
 * compilador recusar `aplicarAliquota(aliquota, base)` com os argumentos
 * trocados, que é exatamente o defeito que nenhum caso-ouro pegaria se as
 * duas grandezas fossem só `number`.
 *
 * Consequência negativa reconhecida em `ADR-004`: menos legível. `450000` no
 * lugar de `4500.00`. Os construtores `centavos()` e `basisPoints()` existem
 * para que a conversão seja sempre explícita e sempre validada.
 */

declare const marcaCentavos: unique symbol
declare const marcaBasisPoints: unique symbol

/**
 * Valor monetário em centavos. Sempre inteiro (`A-1`).
 *
 * R$ 4.500,00 é `450000`. Nunca `4500.00` — ponto flutuante sobre dinheiro é
 * proibido e verificado por BV-11.
 */
export type Centavos = number & { readonly [marcaCentavos]: true }

/**
 * Alíquota em pontos-base. Sempre inteiro (`A-2`).
 *
 * 7,5% é `750`. 100% é `10000`. A unidade evita decimal na tabela de
 * parâmetros, onde `0.075` seria a porta de entrada do ponto flutuante.
 */
export type BasisPoints = number & { readonly [marcaBasisPoints]: true }

/**
 * Política de arredondamento, declarada em cada operação que divide (`A-4`).
 *
 * Não há política padrão, e a ausência é deliberada: qual arredondamento a
 * norma exige em cada etapa é **pesquisa jurídica**, não escolha de
 * implementação. `RN-006` registra isso como verificação pendente, e
 * `ADR-004` a aponta como a fonte mais provável de divergência de centavos
 * que sobra no sistema. Obrigar a escolha em cada chamada é o que impede que
 * ela seja feita por omissão.
 *
 * A diferença entre as três só aparece em valor negativo — desconto, aviso
 * prévio não cumprido — e é justamente onde passaria despercebida:
 *
 * | valor  | `meio_para_cima` | `meio_afastando_de_zero` | `truncar` |
 * |--------|------------------|--------------------------|-----------|
 * |  2,5   |        3         |            3             |     2     |
 * | −2,5   |       −2         |           −3             |    −2     |
 */
export type PoliticaArredondamento =
  /** Empate vai para o maior valor (+∞). É o "meio para cima" de `RN-007`. */
  | 'meio_para_cima'
  /** Empate se afasta do zero. Simétrico entre crédito e débito. */
  | 'meio_afastando_de_zero'
  /** Descarta a fração, aproximando de zero. Para normas que mandam truncar. */
  | 'truncar'

/**
 * Erro de domínio do motor (`C-M3` de `ADR-003`).
 *
 * O motor nunca lança exceção para erro de domínio — retorna valor tipado.
 * Exceção significa **defeito**, e é o que dispara o estado de erro
 * inesperado de `03-functional-spec` §1.5.
 *
 * Os construtores deste módulo são a exceção coerente com a regra: receber
 * `NaN` ou um decimal onde se espera centavos não é situação de domínio que o
 * usuário possa provocar — é engano de programação, e lançar é o
 * comportamento correto.
 */
export type MotivoErro =
  | 'vigencia_ausente'
  | 'entrada_invalida'
  | 'entrada_incompleta'
  | 'inconsistencia_temporal'

export interface ResultadoErro {
  readonly ok: false
  readonly motivo: MotivoErro
  readonly detalhe: string
}

/**
 * Acima do inteiro seguro da linguagem a soma deixa de ser exata **em
 * silêncio** — que é o único jeito de `A-3` falhar sem alarde. As guardas
 * abaixo transformam esse limite em erro visível.
 */
function exigirInteiroSeguro(valor: number, unidade: string): void {
  if (typeof valor !== 'number' || Number.isNaN(valor)) {
    throw new TypeError(`${unidade}: esperado número, recebido ${String(valor)}`)
  }
  if (!Number.isInteger(valor)) {
    throw new TypeError(
      `${unidade}: esperado inteiro, recebido ${valor}. ` +
        `Valor monetário é inteiro em centavos e alíquota é inteiro em basis points (ADR-004 A-1/A-2). ` +
        `Se veio de entrada do usuário, converta na fronteira, não aqui.`,
    )
  }
  if (!Number.isSafeInteger(valor)) {
    throw new RangeError(
      `${unidade}: ${valor} excede o inteiro seguro da linguagem; a aritmética deixaria de ser exata.`,
    )
  }
}

/**
 * Garante que um produto intermediário não estoure o inteiro seguro.
 *
 * `aplicarAliquota` multiplica antes de dividir, para não perder precisão no
 * caminho. A multiplicação é o ponto onde o estouro aconteceria, e um estouro
 * aqui não lança nada por conta própria: devolve um número arredondado que
 * parece plausível. Esta guarda existe para que ele deixe de parecer.
 */
export function exigirProdutoSeguro(a: number, b: number, contexto: string): void {
  if (a !== 0 && Math.abs(b) > Number.MAX_SAFE_INTEGER / Math.abs(a)) {
    throw new RangeError(
      `${contexto}: o produto ${a} × ${b} excede o inteiro seguro e deixaria de ser exato.`,
    )
  }
}

/**
 * Normaliza o zero negativo.
 *
 * `-0` sobrevive a `===` (`-0 === 0` é verdadeiro) e por isso atravessa
 * comparação e teste sem alarde — mas chega à formatação e vira **"R$ -0,00"**
 * na tela. Num produto cuja tese é confiança, um valor que aparece negado sem
 * razão lê como defeito, e o usuário não tem como saber que é cosmético.
 *
 * Aparece naturalmente em `negar(0)` e em qualquer divisão de zero por
 * divisor negativo. Normalizar no construtor cobre todas as origens de uma vez,
 * em vez de deixar cada operação lembrar sozinha.
 */
function semZeroNegativo(valor: number): number {
  return valor === 0 ? 0 : valor
}

/** Constrói um valor em centavos, validando o invariante de `A-1`. */
export function centavos(valor: number): Centavos {
  exigirInteiroSeguro(valor, 'Centavos')
  return semZeroNegativo(valor) as Centavos
}

/** Constrói uma alíquota em basis points, validando o invariante de `A-2`. */
export function basisPoints(valor: number): BasisPoints {
  exigirInteiroSeguro(valor, 'BasisPoints')
  return semZeroNegativo(valor) as BasisPoints
}

/** Zero monetário. Atalho legível para `centavos(0)`. */
export const ZERO: Centavos = 0 as Centavos
