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

/**
 * `data` entrou em CALC-002, que é a primeira calculadora cuja entrada é um
 * PERÍODO e não um valor. Como `selecao`, seu valor interno é texto — no
 * formato ISO "AAAA-MM-DD", que é o que o motor lê em `engine/datas.ts` e o
 * que o `<input type="date">` do navegador produz. Texto e não número porque
 * data não tem unidade inteira natural, e inventar uma (dias desde uma época)
 * tornaria a URL compartilhada ilegível.
 */
export type TipoCampo = 'monetario' | 'inteiro' | 'selecao' | 'percentual' | 'data'

/** Campos cujo valor interno é texto, não número. */
export function campoEhTexto(tipo: TipoCampo): boolean {
  return tipo === 'selecao' || tipo === 'data'
}

export interface OpcaoSelecao {
  readonly valor: string
  readonly rotulo: string
  /** Desabilitada com "Em breve" — para não sugerir cobertura que não existe. */
  readonly indisponivel?: boolean
}

/**
 * Habilitação condicional — `03-functional-spec` §3.
 *
 * **Dado, não função.** Era `(valores) => boolean`, e uma função não atravessa
 * a fronteira servidor→cliente: ela não é serializável. Enquanto a definição
 * inteira vivia no pacote do navegador isso não incomodava; a partir do momento
 * em que o servidor passa a entregar o formulário pronto (ver
 * `FormularioCalculadora`), incomoda.
 *
 * A troca não perdeu capacidade em uso: `visivelSe` estava declarado desde o
 * T-103 e **nenhuma das quatro calculadoras publicadas o usava**. Era contrato
 * especulativo. O formato declarativo cobre o caso real que vem a seguir —
 * campo que aparece conforme uma seleção, como o tipo de aviso prévio em
 * CALC-002.
 *
 * Se algum dia um caso não couber aqui, o certo é ampliar esta forma — não
 * voltar à função. Ver `ESTADO-DO-PROJETO` §7.4.
 */
export interface CondicaoVisibilidade {
  /** `id` do campo observado. */
  readonly campo: string
  /** Visível quando o valor daquele campo está nesta lista. */
  readonly em: readonly (string | number)[]
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
  readonly visivelSe?: CondicaoVisibilidade
}

/** Avalia `visivelSe`. Campo sem condição é sempre visível. */
export function campoVisivel(campo: Campo, valores: ValoresFormulario): boolean {
  if (!campo.visivelSe) return true
  const valor = valores[campo.visivelSe.campo]
  return valor !== undefined && campo.visivelSe.em.includes(valor)
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

/**
 * A função de cálculo, isolada do resto da definição para poder ser adiada.
 *
 * **Não recebe o registro de parâmetros.** Recebia, e isso obrigava o
 * componente de cliente a construí-lo — arrastando para o pacote ESTÁTICO de
 * toda rota as tabelas de INSS, de IRRF e as trabalhistas, que só são usadas
 * no momento do cálculo. Agora cada definição monta o próprio registro, dentro
 * do módulo adiado, com os conjuntos que ela de fato consome.
 *
 * O que o formulário ainda precisa saber sobre vigências — os anos disponíveis
 * e o intervalo coberto — chega pronto do servidor, em
 * `FormularioCalculadora`. São dois dados serializáveis; as tabelas inteiras
 * não precisavam atravessar.
 */
export type FuncaoCalculo = (
  valores: ValoresFormulario,
  dataReferencia: DataISO,
) => Resultado<SaidaCalculadora>

/**
 * O recorte da definição que o **navegador** precisa para desenhar e operar o
 * formulário — e nada além disso.
 *
 * **Por que existe.** O componente de calculadora é de cliente, e importava a
 * definição inteira do registro. Com isso o navegador baixava, em toda rota de
 * calculadora: as quatro definições, os textos de FAQ e de SEO das quatro (que
 * só o servidor renderiza) e os motores de todas — para operar **uma**.
 * `RNF-004` mede 120 kB comprimidos por rota e a folga estava em 2,4 kB, com
 * 71 calculadoras no catálogo a construir.
 *
 * Este objeto é **inteiramente serializável**, de propósito: é o servidor que o
 * entrega, como propriedade, já resolvido para o slug da rota. O formulário
 * continua saindo pronto no HTML estático — nenhuma etapa de hidratação
 * precisa acontecer para ele aparecer.
 *
 * `calcular` **não** está aqui: chega depois, por `lib/calculadoras/calculo`,
 * e traz o motor junto. O usuário precisa digitar antes de haver o que
 * calcular, e é nessa folga que o pedaço chega.
 */
export interface FormularioCalculadora {
  readonly slug: string
  readonly campos: readonly Campo[]
  readonly rotuloResultado: string
  readonly avisoAdicional?: string
  /** Anos que a interseção das vigências admite. Vazio quando não há parâmetro legal. */
  readonly anosDisponiveis: readonly number[]
  /** Intervalo coberto, para a frase sob o seletor de período. */
  readonly cobertura: { readonly inicio: DataISO; readonly fim: DataISO | null } | null
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

  readonly calcular: FuncaoCalculo

  readonly faq: readonly PerguntaFaq[]
  /** Slugs de 2 a 4 calculadoras relacionadas. */
  readonly relacionadas: readonly string[]
  /** Aviso adicional ao de estimativa. Ex.: o de FGTS (`RN-023`). */
  readonly avisoAdicional?: string
}

/**
 * Extrai o recorte que vai para o navegador.
 *
 * Derivado, nunca escrito à mão: duas listas do mesmo conjunto divergem, e este
 * projeto já pagou por isso uma vez — o rodapé que anunciava como "em breve"
 * três calculadoras publicadas (T-106).
 */
export function formularioDe(
  definicao: DefinicaoCalculadora,
  registro: Registro,
): FormularioCalculadora {
  const cobertura = registro.coberturaCombinada(definicao.parametrosRequeridos)
  return {
    slug: definicao.slug,
    campos: definicao.campos,
    rotuloResultado: definicao.rotuloResultado,
    ...(definicao.avisoAdicional ? { avisoAdicional: definicao.avisoAdicional } : {}),
    anosDisponiveis: registro.anosDisponiveis(definicao.parametrosRequeridos),
    cobertura: cobertura ? { inicio: cobertura.inicio, fim: cobertura.fim } : null,
  }
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
