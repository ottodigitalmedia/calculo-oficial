/**
 * Traço de cálculo — `ENT-008`, contrato `C-M1`.
 *
 * **Toda função pública do motor retorna resultado E traço.** Não existe
 * caminho de cálculo sem memória (restrição T-1). É o que torna `RF-003`
 * estrutural em vez de opcional: uma calculadora nova não tem como "esquecer"
 * de produzir a memória, porque o tipo de retorno não permite.
 *
 * O traço é efêmero: produzido a cada cálculo e descartado ao fim da sessão.
 * Nunca é persistido — não há onde persistir (`ADR-002`).
 */

import type { DataISO, VigenciaResolvida } from '../params/tipos'
import type { BasisPoints, Centavos, MotivoErro } from './types'

/**
 * Citação de um parâmetro legal usado numa etapa (`RN-029`, MC-3).
 *
 * Carrega vigência e fonte porque a memória de cálculo precisa exibir as duas
 * ao lado do valor — sem isso o usuário vê um número e tem que acreditar,
 * que é exatamente o que o produto se propõe a não fazer.
 */
export interface CitacaoParametro {
  readonly parametroId: string
  readonly nome: string
  readonly vigenciaInicio: DataISO
  readonly vigenciaFim: DataISO | null
  readonly norma: string
  readonly dispositivo?: string
  readonly url: string
}

/**
 * Uma etapa da conta.
 *
 * `formula` traz os valores **já substituídos** (MC-2): "R$ 1.621,00 × 7,50%",
 * não "base × alíquota". Notação algébrica obriga o leitor a fazer a
 * substituição de cabeça, e o objetivo é o oposto — que ele confira com uma
 * calculadora comum.
 *
 * Os valores saem em centavos e basis points; a formatação em pt-BR é da
 * camada de apresentação (`C-M4`).
 */
/**
 * Fundamento normativo **sem valor numérico** — `MC-3`.
 *
 * Responde "esta verba sofre incidência?", não "quanto". A distinção não é
 * acadêmica: `CitacaoParametro` exige vigência e id de parâmetro, e uma súmula
 * não tem nem um nem outro. Forçá-la naquele formato produziria vigência
 * inventada.
 *
 * Nasceu em CALC-002, onde metade das etapas é decisão de incidência: o aviso
 * prévio indenizado não sofre contribuição previdenciária por força do Tema 478
 * do STJ, e as férias indenizadas são isentas de imposto de renda por força da
 * Súmula 386. Sem este campo, a memória diria "não incide" sem dizer por quê —
 * e é exatamente isso que o produto existe para não fazer.
 *
 * Os objetos vêm de `lib/params/data/fontes.ts`, nunca escritos no motor:
 * `CLAUDE.md` regra 1 exige que toda referência normativa tenha URL oficial e
 * viva em `lib/params/`.
 */
export interface CitacaoFundamento {
  readonly norma: string
  readonly dispositivo?: string
  readonly url: string
}

/**
 * Constrói a citação a partir de uma `Fonte` de `lib/params/`.
 *
 * O tipo de entrada é estrutural de propósito: o motor não importa `Fonte`
 * como tipo para não amarrar `engine/` ao formato de `params/` além do que
 * `registry.ts` já exige. `exactOptionalPropertyTypes` está ligado neste
 * projeto, então `dispositivo` precisa ser **omitido**, não posto como
 * `undefined` — daí o espalhamento condicional em vez da atribuição direta.
 */
export function fundamentar(fonte: {
  readonly norma: string
  readonly dispositivo?: string | undefined
  readonly url: string
}): CitacaoFundamento {
  return {
    norma: fonte.norma,
    ...(fonte.dispositivo === undefined ? {} : { dispositivo: fonte.dispositivo }),
    url: fonte.url,
  }
}

export interface Etapa {
  /** Nome em linguagem comum. Ex.: "Contribuição — 2ª faixa". */
  readonly rotulo: string
  /** Expressão com os valores substituídos. */
  readonly formula: string
  readonly resultado: Centavos
  /** Presente quando a etapa usa parâmetro legal. */
  readonly parametro?: CitacaoParametro
  /** Presente quando a etapa aplica regra normativa sem valor próprio. */
  readonly fundamento?: CitacaoFundamento
  /** Explica uma escolha do motor. Usado por `RN-012`. */
  readonly justificativa?: string
}

export interface Traco {
  readonly etapas: readonly Etapa[]
  readonly dataReferencia: DataISO
  /** Ids das vigências aplicadas, para o rodapé da memória. */
  readonly vigenciasAplicadas: readonly string[]
}

/** Resultado de qualquer função pública do motor (`C-M1`, `C-M3`). */
export type Resultado<T> =
  | { readonly ok: true; readonly valores: T; readonly traco: Traco }
  | { readonly ok: false; readonly motivo: MotivoErro; readonly detalhe: string }

/** Converte uma vigência resolvida na citação que a memória exibe. */
export function citar(resolvida: VigenciaResolvida): CitacaoParametro {
  const { parametro, vigencia, fonte } = resolvida
  return {
    parametroId: parametro.id,
    nome: parametro.nome,
    vigenciaInicio: vigencia.inicio,
    vigenciaFim: vigencia.fim,
    norma: fonte.norma,
    ...(fonte.dispositivo === undefined ? {} : { dispositivo: fonte.dispositivo }),
    url: fonte.url,
  }
}

// ---------------------------------------------------------------------------
// Construção do traço
// ---------------------------------------------------------------------------

/**
 * Acumulador de etapas.
 *
 * Existe para que escrever uma calculadora nova seja registrar etapas na ordem
 * em que a conta acontece, e não montar uma estrutura no fim — que é como se
 * esquece uma etapa "óbvia demais para registrar". `RF-003` diz explicitamente
 * que nenhuma etapa é omitida por ser óbvia.
 */
export class ConstrutorDeTraco {
  private readonly etapas: Etapa[] = []
  private readonly vigencias = new Set<string>()

  constructor(private readonly dataReferencia: DataISO) {}

  /** Registra uma etapa simples, sem parâmetro legal. */
  passo(rotulo: string, formula: string, resultado: Centavos): Centavos {
    this.etapas.push({ rotulo, formula, resultado })
    return resultado
  }

  /**
   * Registra uma etapa cuja regra vem da norma, mas sem valor próprio.
   *
   * É o caso de toda decisão de incidência: "esta verba não sofre INSS porque
   * o Tema 478 do STJ assim decidiu". A conta é trivial — o valor é zero ou é
   * o próprio principal —, e o que precisa ficar visível é o fundamento.
   */
  passoComFundamento(
    rotulo: string,
    formula: string,
    resultado: Centavos,
    fundamento: CitacaoFundamento,
    justificativa?: string,
  ): Centavos {
    this.etapas.push({
      rotulo,
      formula,
      resultado,
      fundamento: {
        norma: fundamento.norma,
        ...(fundamento.dispositivo === undefined ? {} : { dispositivo: fundamento.dispositivo }),
        url: fundamento.url,
      },
      ...(justificativa === undefined ? {} : { justificativa }),
    })
    return resultado
  }

  /** Registra uma etapa que usa parâmetro legal, citando vigência e fonte. */
  passoComParametro(
    rotulo: string,
    formula: string,
    resultado: Centavos,
    resolvida: VigenciaResolvida,
    justificativa?: string,
  ): Centavos {
    this.vigencias.add(resolvida.vigencia.id)
    this.etapas.push({
      rotulo,
      formula,
      resultado,
      parametro: citar(resolvida),
      ...(justificativa === undefined ? {} : { justificativa }),
    })
    return resultado
  }

  construir(): Traco {
    return {
      etapas: [...this.etapas],
      dataReferencia: this.dataReferencia,
      vigenciasAplicadas: [...this.vigencias],
    }
  }
}

// ---------------------------------------------------------------------------
// Formatação mínima para a fórmula
// ---------------------------------------------------------------------------

/**
 * Formata centavos como "R$ 1.234,56" **apenas para compor `formula`**.
 *
 * Não contradiz `C-M4`: o contrato proíbe o motor de formatar o *resultado*,
 * e aqui o texto é o próprio dado — a fórmula é uma frase, e uma frase com
 * "162100 × 750" não permite conferência alguma. Os campos `resultado`
 * continuam saindo em centavos.
 */
/**
 * Definições de unidade, não constantes legais — daí a dispensa de BV-10, que
 * existe para impedir tabela de INSS escrita à mão dentro do motor.
 *
 * Um real tem cem centavos (`A-1`); um ponto percentual tem cem basis points
 * (`A-2`). Nomeadas uma vez em vez de quatro exceções espalhadas.
 */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTAVOS_POR_REAL = 100
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-2)
const BP_POR_PONTO_PERCENTUAL = 100

export function reais(centavos: Centavos): string {
  const negativo = centavos < 0
  const abs = Math.abs(centavos)
  const inteiro = Math.trunc(abs / CENTAVOS_POR_REAL)
  const cents = abs % CENTAVOS_POR_REAL
  const comSeparador = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${negativo ? '−' : ''}R$ ${comSeparador},${String(cents).padStart(2, '0')}`
}

/** Formata basis points como "7,50%", também só para compor `formula`. */
export function percentual(bp: BasisPoints): string {
  const inteiro = Math.trunc(Math.abs(bp) / BP_POR_PONTO_PERCENTUAL)
  const frac = Math.abs(bp) % BP_POR_PONTO_PERCENTUAL
  return `${bp < 0 ? '−' : ''}${inteiro},${String(frac).padStart(2, '0')}%`
}
