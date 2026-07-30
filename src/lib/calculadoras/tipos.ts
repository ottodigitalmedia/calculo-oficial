/**
 * Definição declarativa de calculadora — `ADR-008` regra E-1.
 *
 * **O molde.** Uma calculadora nova não constrói página: declara campos,
 * escreve a função de cálculo e lista o FAQ. Uma única página genérica
 * renderiza qualquer definição que satisfaça este contrato.
 *
 * É o que faz o custo marginal de cada calculadora cair de um dia para horas,
 * e o que torna viável adicionar as seis trabalhistas durante os 90 dias de
 * medição em vez de antes do lançamento.
 */

import type { Resultado } from '../engine/traco'
import type { Centavos } from '../engine/types'
import type { DataISO } from '../params/tipos'
import type { Registro } from '../params/registry'

// ---------------------------------------------------------------------------
// Campos
// ---------------------------------------------------------------------------

export type TipoCampo = 'monetario' | 'inteiro' | 'selecao' | 'percentual'

export interface OpcaoSelecao {
  readonly valor: string
  readonly rotulo: string
  /** Desabilitada com "Em breve" — para não sugerir cobertura que não existe. */
  readonly indisponivel?: boolean
}

export interface Campo {
  readonly id: string
  readonly rotulo: string
  readonly tipo: TipoCampo
  readonly obrigatorio?: boolean
  /** Valor inicial. Monetário e inteiro em número; seleção pelo `valor`. */
  readonly padrao?: number | string
  readonly minimo?: number
  readonly maximo?: number
  readonly opcoes?: readonly OpcaoSelecao[]
  /** Texto curto abaixo do campo. */
  readonly ajuda?: string
  /** Habilitação condicional. Ver `03-functional-spec` §3. */
  readonly visivelSe?: (valores: ValoresFormulario) => boolean
}

/** Valores crus do formulário. Monetário em CENTAVOS; seleção em texto. */
export type ValoresFormulario = Readonly<Record<string, number | string>>

// ---------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------

export type Sinal = 'credito' | 'debito' | 'neutro'

/**
 * Linha do detalhamento.
 *
 * `sinal` é semântico, não visual: `10-ux-ui-spec` §2.1 exige que crédito e
 * débito se distingam por **sinal e rótulo**, não só por cor — cor sozinha
 * exclui quem não a percebe.
 */
export interface LinhaDetalhamento {
  readonly rotulo: string
  readonly valor: Centavos
  readonly sinal: Sinal
}

/**
 * Saída secundária não monetária. Ex.: "Alíquota efetiva: 11,62%" em CALC-016,
 * que `03-functional-spec` §3.9 destaca por ser *"a informação que mais
 * surpreende o usuário e a que mais gera desconfiança quando não explicada"*.
 *
 * Já formatada: o motor devolve basis points e quem converte para texto é a
 * definição da calculadora, que já vive na camada de apresentação.
 */
export interface Destaque {
  readonly rotulo: string
  readonly valor: string
}

/** Tabela auxiliar. Ex.: a evolução ano a ano em CALC-022. */
export interface TabelaResultado {
  readonly titulo: string
  readonly colunas: readonly string[]
  readonly linhas: readonly { readonly rotulo: string; readonly valores: readonly Centavos[] }[]
}

export interface SaidaCalculadora {
  readonly principal: Centavos
  readonly detalhamento: readonly LinhaDetalhamento[]
  readonly destaques?: readonly Destaque[]
  readonly tabela?: TabelaResultado
  /** Notas fixas exibidas com o resultado. Ex.: a nota do 13º. */
  readonly notas?: readonly string[]
}

// ---------------------------------------------------------------------------
// Definição
// ---------------------------------------------------------------------------

export interface PerguntaFaq {
  readonly pergunta: string
  readonly resposta: string
}

export interface DefinicaoCalculadora {
  /** `CALC-NNN`, conforme o catálogo. Nenhuma calculadora existe sem ID. */
  readonly id: string
  /** Parte da URL. **Nunca alterado após publicação** (restrição C-2). */
  readonly slug: string
  readonly nome: string
  /** Uma linha sob o título, explicando o que a calculadora faz. */
  readonly linhaDeContexto: string
  readonly descricaoSeo: string

  readonly campos: readonly Campo[]

  /**
   * Parâmetros legais consumidos. Determina o intervalo de datas aceito, por
   * interseção das coberturas (restrição C-1) — calculado, nunca escrito.
   */
  readonly parametrosRequeridos: readonly string[]

  readonly rotuloResultado: string

  readonly calcular: (
    valores: ValoresFormulario,
    dataReferencia: DataISO,
    registro: Registro,
  ) => Resultado<SaidaCalculadora>

  readonly faq: readonly PerguntaFaq[]
  /** Slugs de 2 a 4 calculadoras relacionadas. */
  readonly relacionadas: readonly string[]
  /** Aviso adicional ao de estimativa. Ex.: o de FGTS (`RN-023`). */
  readonly avisoAdicional?: string
}

// ---------------------------------------------------------------------------
// Leitura de valores
// ---------------------------------------------------------------------------

/** Lê um campo numérico do formulário, com zero como ausência. */
export function numero(valores: ValoresFormulario, id: string): number {
  const v = valores[id]
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** Lê um campo de seleção. */
export function texto(valores: ValoresFormulario, id: string): string {
  const v = valores[id]
  return typeof v === 'string' ? v : ''
}
