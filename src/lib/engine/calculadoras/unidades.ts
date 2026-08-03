/**
 * CALC-074 — Conversor de unidades.
 *
 * **Toda conversão aqui é uma fração exata, e a conta é feita com inteiro
 * grande.** A alternativa seria ponto flutuante, e ela erra de um jeito que
 * ninguém percebe: `0.1 + 0.2` já não é `0.3`, e uma cadeia de multiplicações e
 * divisões por fatores como 25,4 e 453,59237 acumula o erro até ele aparecer na
 * casa que o usuário lê. `BigInt` é aritmética de inteiro — não é ponto
 * flutuante, e não infringe `ADR-004` A-1; é a mesma disciplina de sempre, com
 * um tipo que aguenta o produto intermediário.
 *
 * **Cada unidade é declarada por uma razão inteira com a base da categoria.** A
 * polegada não é "25,4 mm aproximadamente": é 254/10 mm, exatamente, por acordo
 * internacional de 1959. A libra é 45.359.237/100 mg. Escrever a razão em vez do
 * decimal é o que permite a conta ser exata.
 *
 * **A escala do resultado é escolhida, não fixa.** Um milímetro em quilômetros é
 * 0,000001, e duas casas imprimiriam zero — ver `SaidaCalculadora.casasDecimais`.
 * O motor devolve o resultado e quantas casas ele carrega.
 *
 * **Temperatura não é fator, é reta.** Zero grau Celsius não é zero Fahrenheit,
 * e por isso ela tem caminho próprio: converte-se para kelvin e de volta.
 */

import type { Resultado, Traco } from '../traco'
import { centavos, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import {
  categoriaPorId,
  unidadePorId,
  type CategoriaDeUnidade,
  type UnidadeFisica,
} from '../../unidades/tabela'

// ---------------------------------------------------------------------------
// A conta
// ---------------------------------------------------------------------------

/** Casas mínimas e máximas do resultado. Ver `casasDecimais` em `tipos.ts`. */
const CASAS_MINIMAS = 2
const CASAS_MAXIMAS = 10
/** Abaixo disto o resultado tem menos de quatro algarismos e pede mais casas. */
// eslint-disable-next-line no-restricted-syntax -- limiar de legibilidade, não parâmetro legal
const ALGARISMOS_SUFICIENTES = 1_000n

/** Divisão com arredondamento meio para cima, em inteiro grande. */
function dividirArredondando(numerador: bigint, denominador: bigint): bigint {
  const quociente = numerador / denominador
  const resto = numerador % denominador
  return resto * 2n >= denominador ? quociente + 1n : quociente
}

export interface EntradaConversao {
  readonly categoriaId: string
  readonly deId: string
  readonly paraId: string
  /** O valor digitado, em centésimos da unidade de origem. */
  readonly valor: number
}

export interface SaidaConversao {
  readonly categoria: CategoriaDeUnidade
  readonly de: UnidadeFisica
  readonly para: UnidadeFisica
  /** O resultado, inteiro escalado por `10^casasDecimais`. */
  readonly resultado: Centavos
  readonly casasDecimais: number
  /** Quanto vale UMA unidade de origem na unidade de destino, e a volta. */
  readonly fator: Centavos
  readonly casasDoFator: number
  readonly fatorInverso: Centavos
  readonly casasDoInverso: number
}

/**
 * Escolhe a escala e devolve o inteiro escalado.
 *
 * **A regra é: mostrar o número que a conversão TEM.** A libra é 453,59237 g
 * exatos, e exibir 453,59 esconderia cinco algarismos que a definição da unidade
 * garante. Então a primeira tentativa é achar quantas casas bastam para o valor
 * ser exato — se a fração termina em cinco casas, são cinco casas.
 *
 * Quando a fração não termina — 500 GB em GiB não terminam —, não há número
 * exato a mostrar, e aí a régua passa a ser legibilidade: casas suficientes para
 * quatro algarismos, nunca menos de duas.
 *
 * O teto de dez casas e o limite do inteiro seguro valem nos dois caminhos.
 * Estourar é pior que arredondar, e arredondar em silêncio é pior que recusar.
 */
function escalar(numerador: bigint, denominador: bigint): { valor: number; casas: number } | null {
  for (let exatas = 0; exatas <= CASAS_MAXIMAS; exatas += 1) {
    if ((numerador * 10n ** BigInt(exatas)) % denominador !== 0n) continue

    /**
     * Duas casas primeiro, e o valor cru se elas não couberem. `100 TB` em
     * bytes são 10^14 — inteiro perfeitamente exibível, que só estouraria por
     * causa de duas casas decimais que a resposta nem precisa ter.
     */
    for (let casas = Math.max(exatas, CASAS_MINIMAS); casas >= exatas; casas -= 1) {
      const escalado = (numerador * 10n ** BigInt(casas)) / denominador
      if (cabe(escalado)) return { valor: Number(escalado), casas }
    }
    break
  }

  let casas = CASAS_MINIMAS
  let escalado = dividirArredondando(numerador * 10n ** BigInt(casas), denominador)

  /**
   * Nem duas casas cabem: o resultado passa do inteiro seguro da linguagem.
   * Acontece com `1.000.000 TB` em bytes, que é entrada legítima e resposta
   * impossível de exibir com exatidão. Recusar é o certo — um número desses
   * arredondado em silêncio pareceria exato.
   */
  if (!cabe(escalado)) return null

  while (casas < CASAS_MAXIMAS && abs(escalado) < ALGARISMOS_SUFICIENTES) {
    const proxima = casas + 1
    const candidato = dividirArredondando(numerador * 10n ** BigInt(proxima), denominador)
    if (!cabe(candidato)) break
    casas = proxima
    escalado = candidato
  }

  return { valor: Number(escalado), casas }
}

const LIMITE_SEGURO = BigInt(Number.MAX_SAFE_INTEGER)

function cabe(valor: bigint): boolean {
  return valor <= LIMITE_SEGURO && valor >= -LIMITE_SEGURO
}

function abs(valor: bigint): bigint {
  return valor < 0n ? -valor : valor
}

/** A razão exata entre duas unidades: quantas unidades de destino cabem em uma de origem. */
function razao(de: UnidadeFisica, para: UnidadeFisica): { num: bigint; den: bigint } {
  return {
    num: BigInt(de.numerador) * BigInt(para.denominador),
    den: BigInt(de.denominador) * BigInt(para.numerador),
  }
}

/**
 * Centésimos de kelvin, a partir da escala de origem.
 *
 * 27.315 e 45.967 são 273,15 e 459,67 em centésimos: as definições das escalas
 * Celsius e Fahrenheit em relação ao kelvin. Definição física, não parâmetro
 * legal — não têm vigência e nenhuma norma as altera.
 */
function paraKelvin(valorCentesimos: bigint, unidadeId: string): bigint {
  /* eslint-disable no-restricted-syntax -- definição de escala termométrica */
  if (unidadeId === 'C') return valorCentesimos + 27_315n
  if (unidadeId === 'F') return dividirArredondando((valorCentesimos + 45_967n) * 5n, 9n)
  /* eslint-enable no-restricted-syntax */
  return valorCentesimos
}

/** De centésimos de kelvin para a escala de destino, ainda em centésimos. */
function deKelvin(kelvinCentesimos: bigint, unidadeId: string): bigint {
  /* eslint-disable no-restricted-syntax -- definição de escala termométrica */
  if (unidadeId === 'C') return kelvinCentesimos - 27_315n
  if (unidadeId === 'F') return dividirArredondando(kelvinCentesimos * 9n, 5n) - 45_967n
  /* eslint-enable no-restricted-syntax */
  return kelvinCentesimos
}

export function converterUnidade(
  entrada: EntradaConversao,
  dataReferencia: DataISO,
): Resultado<SaidaConversao> {
  const categoria = categoriaPorId(entrada.categoriaId)
  if (!categoria) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Escolha uma categoria para ver o resultado.',
    }
  }

  const de = unidadePorId(categoria, entrada.deId)
  const para = unidadePorId(categoria, entrada.paraId)
  if (!de || !para) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Escolha a unidade de origem e a de destino para ver o resultado.',
    }
  }

  const convertido =
    categoria.id === 'temperatura'
      ? converterTemperatura(entrada.valor, de, para)
      : converterPorRazao(entrada.valor, categoria, de, para)

  if (!convertido) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        'O resultado dessa conversão é grande demais para ser exibido com exatidão. Use um ' +
        'valor menor, ou uma unidade de destino maior.',
    }
  }

  const traco: Traco = { etapas: convertido.etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      categoria,
      de,
      para,
      resultado: centavos(convertido.valor),
      casasDecimais: convertido.casas,
      fator: centavos(convertido.fator),
      casasDoFator: convertido.casasDoFator,
      fatorInverso: centavos(convertido.fatorInverso),
      casasDoInverso: convertido.casasDoInverso,
    },
    traco,
  }
}

interface Convertido {
  readonly valor: number
  readonly casas: number
  readonly fator: number
  readonly casasDoFator: number
  readonly fatorInverso: number
  readonly casasDoInverso: number
  readonly etapas: Traco['etapas']
}

function converterPorRazao(
  valorCentesimos: number,
  categoria: CategoriaDeUnidade,
  de: UnidadeFisica,
  para: UnidadeFisica,
): Convertido | null {
  const valor = BigInt(valorCentesimos)
  const { num, den } = razao(de, para)

  /**
   * O valor na base, para a memória de cálculo mostrar por onde a conta passou.
   * É o passo que torna a conversão auditável: quem confere um resultado de
   * polegada para centímetro confere o milímetro no meio.
   */
  /* eslint-disable no-restricted-syntax -- 100n desfaz os centésimos da entrada, não é parâmetro */
  const naBase = escalar(valor * BigInt(de.numerador), 100n * BigInt(de.denominador))
  const resultado = escalar(valor * num, 100n * den)
  /* eslint-enable no-restricted-syntax */
  const fator = escalar(num, den)
  const inverso = escalar(den, num)

  if (!naBase || !resultado || !fator || !inverso) return null

  return {
    valor: resultado.valor,
    casas: resultado.casas,
    fator: fator.valor,
    casasDoFator: fator.casas,
    fatorInverso: inverso.valor,
    casasDoInverso: inverso.casas,
    etapas: [
      {
        rotulo: `Valor em ${categoria.base}`,
        formula: `valor × ${de.numerador}${de.denominador === 1 ? '' : ` ÷ ${de.denominador}`}`,
        resultado: centavos(naBase.valor),
        unidade: 'numero',
        justificativa:
          'Cada unidade é declarada por uma razão EXATA com a base da categoria, e a conta é ' +
          'feita com inteiro. A polegada não é 25,4 mm aproximadamente: é 254 ÷ 10 mm.',
      },
      {
        rotulo: `De ${de.nome} para ${para.nome}`,
        formula: `${categoria.base} × ${para.denominador} ÷ ${para.numerador}`,
        resultado: centavos(resultado.valor),
        unidade: 'numero',
      },
    ],
  }
}

function converterTemperatura(
  valorCentesimos: number,
  de: UnidadeFisica,
  para: UnidadeFisica,
): Convertido {
  const kelvin = paraKelvin(BigInt(valorCentesimos), de.id)
  const destino = deKelvin(kelvin, para.id)

  /**
   * O "fator" de temperatura é o que uma variação de um grau vale na outra
   * escala — e não o que a leitura de 1 grau vale. Confundir os dois é o erro
   * clássico: 1 °C não são 33,8 °C de diferença, são 33,8 °F de leitura.
   */
  // eslint-disable-next-line no-restricted-syntax -- 100n é UM grau em centésimos
  const variacao = deKelvin(paraKelvin(100n, de.id), para.id) - destinoDeZero(de, para)

  return {
    valor: Number(destino),
    casas: 2,
    fator: Number(variacao),
    casasDoFator: 2,
    fatorInverso: 0,
    casasDoInverso: 2,
    etapas: [
      {
        rotulo: 'Valor em kelvin',
        formula:
          de.id === 'C'
            ? 'grau Celsius + 273,15'
            : de.id === 'F'
              ? '(grau Fahrenheit + 459,67) × 5 ÷ 9'
              : 'já está em kelvin',
        resultado: centavos(Number(kelvin)),
        unidade: 'numero',
        justificativa:
          'Temperatura não se converte por fator: zero grau Celsius não é zero Fahrenheit. A ' +
          'relação entre as escalas é uma reta com deslocamento, e o kelvin é o ponto comum.',
      },
      {
        rotulo: `Valor em ${para.nome}`,
        formula:
          para.id === 'C'
            ? 'kelvin − 273,15'
            : para.id === 'F'
              ? 'kelvin × 9 ÷ 5 − 459,67'
              : 'o próprio kelvin',
        resultado: centavos(Number(destino)),
        unidade: 'numero',
      },
    ],
  }
}

/** A leitura de zero da escala de origem, já na de destino — base da variação. */
function destinoDeZero(de: UnidadeFisica, para: UnidadeFisica): bigint {
  return deKelvin(paraKelvin(0n, de.id), para.id)
}
