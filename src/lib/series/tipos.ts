/**
 * Série econômica externa — `ADR-006`, `RF-012`, `INT-001`.
 *
 * INDICADOR ECONÔMICO NÃO É PARÂMETRO LEGAL, E O SISTEMA TRATA OS DOIS DIFERENTE
 *
 * `ADR-006` abre com essa distinção porque as duas coisas se parecem e não são:
 *
 * | | Parâmetro legal | Indicador econômico |
 * |---|---|---|
 * | Se estiver errado | Cálculo errado, dano real | Sugestão imprecisa que o usuário sobrescreve |
 * | Se estiver ausente | Cálculo impossível | Campo vazio |
 * | Tratamento | Versionado, auditado, bloqueia o build | Cache, degrada em silêncio |
 *
 * Daí duas consequências que atravessam todo este diretório: nada aqui vive em
 * `lib/params/` (não tem vigência, não tem norma, não tem URL de dispositivo), e
 * falha de coleta **nunca** interrompe o build (regra R-3).
 *
 * A ESCALA, E POR QUE NÃO É BASIS POINT
 *
 * `ADR-004` A-2 representa alíquota em basis points, que tem resolução de 0,01%.
 * A TR e o rendimento da poupança são divulgados com **quatro** casas decimais
 * — 0,1729% —, e arredondá-los a basis point mudaria o valor em até 3%. É o
 * mesmo problema que `ESTADO-DO-PROJETO` §7.30 registra no MIP, e a saída aqui é
 * a que aquele caso não permitia: como a grandeza é publicada, e não digitada, a
 * escala pode acompanhar a publicação.
 *
 * O valor é o percentual multiplicado por 10.000 — ou seja, **basis point vezes
 * cem**. 14,15% é `141500`; 0,1729% é `1729`. Continua inteiro, continua sem
 * ponto flutuante, e converter para basis point é uma divisão com política
 * declarada (`paraBasisPoints`).
 */

import type { DataISO } from '../params/tipos'

/** Percentual em décimos de milésimo de ponto: 14,15% é `141500`. */
export type PercentualEscalado = number

/** O fator da escala acima, nomeado uma vez. */
export const ESCALA_DO_PERCENTUAL = 10_000

/** Quanto vale um basis point na escala acima. */
export const ESCALA_POR_BASIS_POINT = 100

export interface PontoDaSerie {
  /** Data a que o dado se refere — `S-5` exige que ela acompanhe o valor. */
  readonly data: DataISO
  readonly valor: PercentualEscalado
}

/**
 * Identificadores das séries que este projeto consome.
 *
 * Nome próprio, e não o código numérico do provedor: o código é detalhe da
 * fonte, e trocá-lo um dia não deve obrigar a reescrever quem consome.
 */
export type SerieId =
  | 'selic-ao-ano'
  | 'selic-mensal'
  | 'ipca-mensal'
  | 'igpm-mensal'
  | 'inpc-mensal'
  | 'poupanca-mensal'
  | 'tr-mensal'

export interface DefinicaoDeSerie {
  readonly id: SerieId
  /** Código no Sistema Gerenciador de Séries Temporais do Banco Central. */
  readonly codigoSgs: number
  readonly nome: string
  readonly unidade: string
  /**
   * Quem **produz** o dado, que nem sempre é quem o publica.
   *
   * O Banco Central republica o IGP-M, que é da FGV, e o IPCA e o INPC, que são
   * do IBGE. Creditar só o republicador seria atribuição errada — é a sexta
   * armadilha medida em `ESTADO-DO-PROJETO` §6.1.
   */
  readonly produtor: string
  /**
   * Como buscar — e a escolha entre as duas é **medida**, não estilística.
   *
   * `ultimos/N` é o caminho simples e tem **teto de 20**, dito pelo próprio
   * serviço em texto: *"A quantidade máxima de valores deve ser 20"*. Serve para
   * quem só precisa do valor corrente.
   *
   * `intervalo` é o caminho para histórico. A ficha do projeto irmão registra
   * janela máxima de 10 anos; a medição de 02/08/2026 mostrou que, para série
   * MENSAL, vinte anos passam sem erro — 246 pontos numa requisição. O limite
   * real acompanha a quantidade de pontos, não a quantidade de anos, e séries
   * diárias estouram muito antes.
   */
  readonly janela:
    | { readonly tipo: 'ultimos'; readonly quantidade: number }
    | { readonly tipo: 'intervalo'; readonly anos: number }
  /** Teto de pontos guardados, para o arquivo de cache não crescer sem limite. */
  readonly pontosNoCache: number
  /** Intervalo plausível, na escala do percentual — `ADR-006` S-4. */
  readonly minimoPlausivel: PercentualEscalado
  readonly maximoPlausivel: PercentualEscalado
  /**
   * Descarta o ponto do **mês em que a coleta roda**.
   *
   * Existe para uma armadilha medida em 07/08/2026 e que nenhuma outra série
   * deste catálogo tem: a Selic acumulada no mês (4390) publica o mês corrente
   * **em curso**, crescendo dia a dia. Na coleta daquele dia, agosto valia
   * 0,21% enquanto todo mês fechado do semestre ficou entre 1,07% e 1,22% —
   * quatro dias úteis decorridos, não um mês.
   *
   * Um índice de preço não faz isso: só aparece depois de apurado. Quem
   * multiplicasse os fatores mensais aplicaria um mês pela metade acreditando
   * ter aplicado um mês inteiro, e o resultado sairia **para menos**, plausível
   * e errado — a forma cara de errar que `CLAUDE.md` diz ser o risco número um
   * deste projeto.
   *
   * O ponto não é corrigido nem estimado. É descartado: o último mês publicado
   * passa a ser o último mês **fechado**, e a tela já mostra qual é.
   */
  readonly descartarMesCorrente?: boolean
}

/**
 * O catálogo de séries.
 *
 * Os códigos foram **conferidos por requisição real** ao serviço do Banco
 * Central em 02/08/2026, e não copiados de exemplo de terceiro — que é o que
 * `06-api-spec` §4.1 exige em letras maiúsculas. O que a medição encontrou está
 * em `docs/20-fonte-bcb-sgs.md`, inclusive três armadilhas que a ficha do
 * projeto irmão não listava.
 */
export const SERIES: readonly DefinicaoDeSerie[] = [
  {
    id: 'selic-ao-ano',
    codigoSgs: 4189,
    nome: 'Taxa Selic acumulada no mês, anualizada',
    unidade: '% ao ano',
    produtor: 'Banco Central do Brasil',
    janela: { tipo: 'ultimos', quantidade: 20 },
    pontosNoCache: 20,
    minimoPlausivel: 0,
    maximoPlausivel: 1_000_000,
  },
  /**
   * Selic **acumulada no mês**, e não a taxa diária.
   *
   * Entrou em 07/08/2026, ao resolver o item que dizia faltar "uma convenção
   * de fator diário para mensal" na correção por índice. A convenção não
   * faltava: o Banco Central já publica o acumulado mensal pronto, uma
   * observação por mês, na mesma forma do IPCA. A medição está em `docs/20`.
   *
   * É a mesma lição de CALC-041, registrada em `ESTADO-DO-PROJETO` §8 — antes
   * de inventar a transformação, verifique se a série não entrega o número
   * pronto. Aqui ela custou meses de "Em breve" numa opção que já era possível.
   *
   * NÃO É ÍNDICE DE INFLAÇÃO, e por isso não entra na lista compartilhada por
   * `poder-de-compra`, `reajuste-aluguel`, `reajuste-salarial` e `valor-futuro`.
   * Ver a separação das duas listas em `calculadoras/indices-comuns.ts`.
   */
  {
    id: 'selic-mensal',
    codigoSgs: 4390,
    nome: 'Selic acumulada no mês',
    unidade: '% ao mês',
    produtor: 'Banco Central do Brasil',
    janela: { tipo: 'intervalo', anos: 20 },
    pontosNoCache: 240,
    // Nunca negativa, e o teto é folgado de propósito: a série cobre períodos
    // de juro muito alto, e apertar isto descartaria ponto verdadeiro.
    minimoPlausivel: 0,
    maximoPlausivel: 100_000,
    // A única do catálogo que publica o mês em curso. Ver a nota do campo.
    descartarMesCorrente: true,
  },
  {
    id: 'ipca-mensal',
    codigoSgs: 433,
    nome: 'IPCA — variação mensal',
    unidade: '% ao mês',
    produtor: 'IBGE, republicado pelo Banco Central do Brasil',
    janela: { tipo: 'intervalo', anos: 20 },
    pontosNoCache: 240,
    minimoPlausivel: -100_000,
    maximoPlausivel: 100_000,
  },
  {
    id: 'igpm-mensal',
    codigoSgs: 189,
    nome: 'IGP-M — variação mensal',
    unidade: '% ao mês',
    produtor: 'Fundação Getulio Vargas, republicado pelo Banco Central do Brasil',
    janela: { tipo: 'intervalo', anos: 20 },
    pontosNoCache: 240,
    minimoPlausivel: -100_000,
    maximoPlausivel: 100_000,
  },
  {
    id: 'inpc-mensal',
    codigoSgs: 188,
    nome: 'INPC — variação mensal',
    unidade: '% ao mês',
    produtor: 'IBGE, republicado pelo Banco Central do Brasil',
    janela: { tipo: 'intervalo', anos: 20 },
    pontosNoCache: 240,
    minimoPlausivel: -100_000,
    maximoPlausivel: 100_000,
  },
  {
    id: 'poupanca-mensal',
    codigoSgs: 195,
    nome: 'Rendimento da poupança — período mensal',
    unidade: '% ao mês',
    produtor: 'Banco Central do Brasil',
    janela: { tipo: 'ultimos', quantidade: 20 },
    pontosNoCache: 20,
    minimoPlausivel: 0,
    maximoPlausivel: 50_000,
  },
  /**
   * TR — e "período mensal" aqui **não** quer dizer uma observação por mês.
   *
   * Medido em 07/08/2026: a série 226 devolve uma observação por **dia**, cada
   * uma com `data` e `dataFim` separadas por um mês. Cada ponto é a TR do
   * período mensal que *começa* naquele dia — o aniversário da conta.
   *
   * Por isso ela não vira vetor posicional por mês, e por isso a correção por
   * TR continua declarada como indisponível: escolher qual dia do mês vale é
   * uma convenção de verdade, e ela depende do contrato, não do site. Foi a
   * mesma guarda de calendário que já havia recusado a poupança (série 195).
   */
  {
    id: 'tr-mensal',
    codigoSgs: 226,
    nome: 'Taxa Referencial — período mensal',
    unidade: '% ao mês',
    produtor: 'Banco Central do Brasil',
    janela: { tipo: 'ultimos', quantidade: 20 },
    pontosNoCache: 20,
    minimoPlausivel: 0,
    maximoPlausivel: 50_000,
  },
]

export function definicaoDaSerie(id: SerieId): DefinicaoDeSerie | undefined {
  return SERIES.find((s) => s.id === id)
}

/** O formato do arquivo de cache versionado — `ADR-006` S-2. */
export interface SerieEmCache {
  readonly id: SerieId
  readonly codigoSgs: number
  readonly coletadoEm: DataISO
  /** Pontos em ordem CRESCENTE de data. Ver a armadilha da ordem em `docs/20`. */
  readonly pontos: readonly PontoDaSerie[]
}

export interface CacheDeSeries {
  /**
   * Versão do formato.
   *
   * A ideia é a do normalizador na chave de cache que `ESTADO-DO-PROJETO` §6.3
   * elogia no projeto irmão: mudou a forma, o consumidor sabe que mudou em vez
   * de ler dado antigo como se fosse novo.
   */
  readonly versao: number
  readonly series: readonly SerieEmCache[]
}

export const VERSAO_DO_CACHE = 1
