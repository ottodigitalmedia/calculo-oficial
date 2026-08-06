/**
 * Modelo de parâmetros legais por vigência — `ENT-001` a `ENT-004` de
 * `05-data-model`, decidido em `ADR-001`.
 *
 * ZERO DEPENDÊNCIA DE RUNTIME, e isso não é acidente.
 *
 * `04-architecture` §5 mostra o motor selecionando a vigência por conta
 * própria (`RN-002`). Ou seja: o motor **importa** este módulo. Se aqui
 * houvesse Zod, o motor herdaria a cadeia de dependências que `ADR-003`
 * proíbe justamente no ponto que toca o dado do usuário (AM-01).
 *
 * A separação que resolve isso:
 *
 * | módulo | quando roda | dependências |
 * |---|---|---|
 * | `tipos.ts`, `registry.ts`, `data/` | runtime, dentro do motor | nenhuma |
 * | `schema.ts` + `scripts/validate-params.ts` | **build**, no pipeline | Zod |
 *
 * Zod é `devDependency` por isso. As restrições que um banco imporia em
 * tempo de execução são impostas no build, onde falham antes de chegar ao
 * usuário (`05-data-model` §1).
 */

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

/**
 * Data no formato `AAAA-MM-DD`.
 *
 * Texto, não `Date`. Três razões, nesta ordem:
 *
 * 1. `Date` carrega fuso. `new Date('2026-01-01')` é UTC e vira 31/12/2025 em
 *    Brasília — o tipo de defeito que muda a vigência aplicada e produz o
 *    número errado exatamente na virada do exercício, que é quando ninguém
 *    está olhando.
 * 2. Em `AAAA-MM-DD`, a ordem lexicográfica **é** a ordem cronológica. A
 *    comparação com `<` e `>` é exata e não constrói objeto algum.
 * 3. `C-M2` proíbe o motor de ler o relógio. Sem `Date`, não há como
 *    acidentalmente chamar `new Date()` sem argumento.
 */
export type DataISO = string

// ---------------------------------------------------------------------------
// ENT-001 · Fonte
// ---------------------------------------------------------------------------

export type OrgaoEmissor =
  | 'Congresso Nacional'
  | 'Presidência da República'
  | 'Ministério da Previdência Social'
  | 'Ministério da Fazenda'
  | 'Ministério do Trabalho e Emprego'
  | 'Receita Federal do Brasil'
  // Tribunais superiores entraram em CALC-002. Não emitem parâmetro numérico:
  // emitem **fundamento de incidência** — a tese que decide se uma verba sofre
  // contribuição ou imposto. `schema.ts` já admitia `jus.br` como domínio
  // oficial justamente por isso; faltava o órgão no tipo.
  | 'Supremo Tribunal Federal'
  | 'Superior Tribunal de Justiça'
  | 'Tribunal Superior do Trabalho'
  | 'Banco Central do Brasil'
  // O CODEFAT entrou em 06/08/2026, com a Resolução nº 957/2022 — a norma que
  // manda reajustar a tabela do seguro-desemprego e diz a quem cabe divulgá-la.
  // É conselho deliberativo, não ministério: emite resolução com força própria,
  // por competência do art. 19 da Lei nº 7.998/1990, e não em nome do MTE.
  // Registrá-lo como "Ministério do Trabalho e Emprego" apagaria justamente a
  // procedência que torna a fonte forte.
  | 'Conselho Deliberativo do Fundo de Amparo ao Trabalhador'

/**
 * Origem normativa de um parâmetro. Nenhum parâmetro existe sem fonte
 * (`RN-001`), e a `url` precisa ser de domínio oficial (regra F-1, BV-07).
 */
export interface Fonte {
  readonly id: string
  /** Identificação da norma. Ex.: "Lei nº 9.250, de 26 de dezembro de 1995". */
  readonly norma: string
  /** Artigo, inciso, anexo. Ex.: "Art. 3º-A". */
  readonly dispositivo?: string
  /** URL absoluta, de domínio oficial. */
  readonly url: string
  readonly orgao: OrgaoEmissor
}

// ---------------------------------------------------------------------------
// ENT-004 · Faixa
// ---------------------------------------------------------------------------

/** Linha de uma tabela progressiva. Existe só dentro de `tabela_faixas`. */
export interface Faixa {
  /** Sequencial a partir de 1. */
  readonly ordem: number
  readonly limiteInferiorCentavos: number
  /** `null` na última faixa. */
  readonly limiteSuperiorCentavos: number | null
  /** Alíquota em basis points: 7,5% é `750` (`ADR-004` A-2). */
  readonly aliquotaBp: number
  /** Presente quando a tabela usa parcela a deduzir, como a do imposto. */
  readonly parcelaDeduzirCentavos?: number
}

// ---------------------------------------------------------------------------
// Valor do parâmetro
// ---------------------------------------------------------------------------

/**
 * Valor de uma vigência, discriminado por tipo.
 *
 * União discriminada e não `unknown` com validação tardia: o compilador
 * obriga o tratamento de cada tipo no ponto de uso, e `V-4` (formato do valor
 * corresponde ao tipo) deixa de depender só do build.
 */
export type ValorParametro =
  | { readonly tipo: 'valor_monetario'; readonly centavos: number }
  | { readonly tipo: 'percentual'; readonly aliquotaBp: number }
  | { readonly tipo: 'inteiro'; readonly valor: number }
  /**
   * Coeficiente que não cabe em basis points (`ADR-007`).
   * Registrado como a norma o expressa, sem simplificar (regra F-2).
   */
  | { readonly tipo: 'fracao'; readonly numerador: number; readonly denominador: number }
  | { readonly tipo: 'tabela_faixas'; readonly faixas: readonly Faixa[] }
  /**
   * Data que se repete todo ano — o feriado nacional de CALC-072.
   *
   * **Por que não coube em nenhum dos tipos acima.** Um feriado não é dinheiro,
   * alíquota nem faixa, e codificá-lo como inteiro (`421` para 21 de abril)
   * seria o encoding que §7.30 já registrou como caminho errado: o dado
   * deixaria de ser legível e a validação deixaria de valer.
   *
   * **E ele PRECISA da máquina de vigências**, que é o que o distingue das
   * razões entre unidades físicas de `lib/unidades/`. Três dos nove feriados
   * nacionais entraram depois: 21 de abril e 2 de novembro em 2002, e 20 de
   * novembro em 2023. Contar dias úteis de 2020 com o feriado de 2023 dentro
   * seria errado — e é exatamente o que `RN-003` existe para impedir.
   */
  | { readonly tipo: 'data_fixa'; readonly mes: number; readonly dia: number }

export type TipoParametro = ValorParametro['tipo']

// ---------------------------------------------------------------------------
// ENT-002 · Parametro  ·  ENT-003 · Vigencia
// ---------------------------------------------------------------------------

export interface Parametro {
  readonly id: string
  /** Nome exibível ao usuário na memória de cálculo. */
  readonly nome: string
  /** Uma linha explicando o que representa. */
  readonly descricao: string
  readonly tipo: TipoParametro
}

/**
 * Entidade central do sistema: um valor válido num intervalo de tempo.
 *
 * `fim` nulo significa vigente indefinidamente a partir de `inicio` (`RN-004`).
 * Vigência publicada nunca é editada para corrigir valor — ver `05-data-model`
 * §6 e o procedimento `RB-06`.
 */
export interface Vigencia {
  readonly id: string
  readonly parametroId: string
  readonly fonteId: string
  readonly inicio: DataISO
  readonly fim: DataISO | null
  readonly valor: ValorParametro
  readonly observacao?: string
}

/** Conjunto completo, como cada módulo de `data/` o exporta. */
export interface ConjuntoDeParametros {
  readonly fontes: readonly Fonte[]
  readonly parametros: readonly Parametro[]
  readonly vigencias: readonly Vigencia[]
}

// ---------------------------------------------------------------------------
// Resultado da consulta
// ---------------------------------------------------------------------------

/** Vigência resolvida, já acompanhada da fonte para a memória de cálculo. */
export interface VigenciaResolvida {
  readonly parametro: Parametro
  readonly vigencia: Vigencia
  readonly fonte: Fonte
}

/**
 * Intervalo coberto por um parâmetro. `fim` nulo = cobertura aberta.
 * É o que a mensagem de `RN-003` mostra ao usuário.
 */
export interface IntervaloCobertura {
  readonly inicio: DataISO
  readonly fim: DataISO | null
}

export type ResultadoVigencia =
  | { readonly ok: true; readonly resolvida: VigenciaResolvida }
  | {
      readonly ok: false
      readonly motivo: 'vigencia_ausente' | 'parametro_desconhecido'
      readonly detalhe: string
      /** Ausente quando o parâmetro nem existe. */
      readonly cobertura?: IntervaloCobertura
    }
