/**
 * Simples Nacional — Anexos III e V, e o fator R. CALC-048.
 *
 * ## A janela é fechada, e a leitura que a fechou é o trabalho todo
 *
 * O art. 519 da **LC nº 214/2025** substitui os Anexos I a V da LC nº 123/2006
 * pelos Anexos XVIII a XXII dela. O que salva esta transcrição é a data: o art.
 * 544, III, na redação da **LC nº 227/2026**, só põe os arts. 519 a 534 em
 * vigor **a partir de 1º de janeiro de 2027**.
 *
 * Por isso as vigências abaixo **fecham em 31/12/2026**, e nenhuma fica aberta.
 * Escolher 2027 devolve `RN-003`, que é a resposta certa enquanto os anexos
 * novos não forem lidos e cadastrados.
 *
 * `ESTADO-DO-PROJETO` §10 mandava ler a LC 214 **antes** de transcrever
 * qualquer coisa, e é por isso: sem essa data, o cadastro inteiro seria de uma
 * tabela que deixa de valer — a armadilha de §7.42 no tamanho de dois anexos.
 *
 * ## O que a tabela significa, e o que ela NÃO é
 *
 * A alíquota da faixa **não é a que se paga**. O art. 18 manda calcular a
 * alíquota EFETIVA:
 *
 * ```
 * efetiva = (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12
 * ```
 *
 * É a mesma forma da parcela a deduzir do imposto de renda: existe para que a
 * alíquota da faixa possa incidir sobre a receita inteira sem cobrar a mais das
 * faixas de baixo. Quem aplica a nominal direto sobre o faturamento cobra muito
 * a mais — e é o erro mais comum das planilhas de comparação CLT × PJ.
 *
 * ## O fator R não é parâmetro de valor, é chave de tabela
 *
 * O § 5º-J manda tributar os serviços do § 5º-I pelo **Anexo III** quando a
 * razão entre folha e receita bruta for **igual ou superior a 28%**; abaixo,
 * pelo **Anexo V**. O § 5º-K manda usar os doze meses anteriores, e o § 24
 * define folha incluindo as retiradas de pró-labore.
 *
 * O limiar entra aqui como parâmetro porque é valor legal; o que ele decide é
 * qual das duas tabelas o motor resolve.
 *
 * Valores em centavos; alíquotas em basis points (`ADR-004`).
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LC_123_ANEXO_III, LC_123_ANEXO_V, LC_123_ART_18_FATOR_R } from './fontes'

/** Vigência dos anexos da LC nº 155/2016. */
const INICIO = '2018-01-01'

/**
 * Fim da janela: o art. 519 da LC nº 214/2025 substitui os anexos a partir de
 * 1º/01/2027, por força do art. 544, III, na redação da LC nº 227/2026.
 */
const FIM = '2026-12-31'

export const SIMPLES_NACIONAL: ConjuntoDeParametros = {
  fontes: [LC_123_ANEXO_III, LC_123_ANEXO_V, LC_123_ART_18_FATOR_R],

  parametros: [
    {
      id: 'simples-anexo-iii',
      nome: 'Simples Nacional — Anexo III',
      descricao:
        'Faixas de receita bruta em doze meses, alíquotas nominais e parcelas a deduzir dos serviços tributados pelo Anexo III.',
      tipo: 'tabela_faixas',
    },
    {
      id: 'simples-anexo-v',
      nome: 'Simples Nacional — Anexo V',
      descricao:
        'Faixas, alíquotas nominais e parcelas a deduzir dos serviços tributados pelo Anexo V, quando o fator R fica abaixo do limiar.',
      tipo: 'tabela_faixas',
    },
    {
      id: 'simples-fator-r-limite',
      nome: 'Limiar do fator R',
      descricao:
        'Razão entre folha de salários e receita bruta, ambas dos doze meses anteriores, a partir da qual o serviço é tributado pelo Anexo III em vez do Anexo V.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Anexo III — serviços com fator R igual ou superior ao limiar.
    //
    //   até        180.000,00    6,00 %   deduzir        —
    //   180.000,01 a 360.000,00 11,20 %   deduzir   9.360,00
    //   360.000,01 a 720.000,00 13,50 %   deduzir  17.640,00
    //   720.000,01 a 1.800.000,00 16,00 % deduzir  35.640,00
    //   1.800.000,01 a 3.600.000,00 21,00 % deduzir 125.640,00
    //   3.600.000,01 a 4.800.000,00 33,00 % deduzir 648.000,00
    // -----------------------------------------------------------------------
    {
      id: 'simples-anexo-iii-2018',
      parametroId: 'simples-anexo-iii',
      fonteId: 'lc-123-2006-anexo-iii',
      inicio: INICIO,
      fim: FIM,
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 18_000_000, aliquotaBp: 600, parcelaDeduzirCentavos: 0 },
          { ordem: 2, limiteInferiorCentavos: 18_000_001, limiteSuperiorCentavos: 36_000_000, aliquotaBp: 1_120, parcelaDeduzirCentavos: 936_000 },
          { ordem: 3, limiteInferiorCentavos: 36_000_001, limiteSuperiorCentavos: 72_000_000, aliquotaBp: 1_350, parcelaDeduzirCentavos: 1_764_000 },
          { ordem: 4, limiteInferiorCentavos: 72_000_001, limiteSuperiorCentavos: 180_000_000, aliquotaBp: 1_600, parcelaDeduzirCentavos: 3_564_000 },
          { ordem: 5, limiteInferiorCentavos: 180_000_001, limiteSuperiorCentavos: 360_000_000, aliquotaBp: 2_100, parcelaDeduzirCentavos: 12_564_000 },
          { ordem: 6, limiteInferiorCentavos: 360_000_001, limiteSuperiorCentavos: 480_000_000, aliquotaBp: 3_300, parcelaDeduzirCentavos: 64_800_000 },
        ],
      },
      observacao:
        'Fechada em 31/12/2026: o art. 519 da LC nº 214/2025 substitui os anexos a partir de 2027, por força do art. 544, III, na redação da LC nº 227/2026.',
    },

    // -----------------------------------------------------------------------
    // Anexo V — serviços com fator R abaixo do limiar.
    //
    //   até        180.000,00   15,50 %   deduzir        —
    //   180.000,01 a 360.000,00 18,00 %   deduzir   4.500,00
    //   360.000,01 a 720.000,00 19,50 %   deduzir   9.900,00
    //   720.000,01 a 1.800.000,00 20,50 % deduzir  17.100,00
    //   1.800.000,01 a 3.600.000,00 23,00 % deduzir  62.100,00
    //   3.600.000,01 a 4.800.000,00 30,50 % deduzir 540.000,00
    // -----------------------------------------------------------------------
    {
      id: 'simples-anexo-v-2018',
      parametroId: 'simples-anexo-v',
      fonteId: 'lc-123-2006-anexo-v',
      inicio: INICIO,
      fim: FIM,
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 18_000_000, aliquotaBp: 1_550, parcelaDeduzirCentavos: 0 },
          { ordem: 2, limiteInferiorCentavos: 18_000_001, limiteSuperiorCentavos: 36_000_000, aliquotaBp: 1_800, parcelaDeduzirCentavos: 450_000 },
          { ordem: 3, limiteInferiorCentavos: 36_000_001, limiteSuperiorCentavos: 72_000_000, aliquotaBp: 1_950, parcelaDeduzirCentavos: 990_000 },
          { ordem: 4, limiteInferiorCentavos: 72_000_001, limiteSuperiorCentavos: 180_000_000, aliquotaBp: 2_050, parcelaDeduzirCentavos: 1_710_000 },
          { ordem: 5, limiteInferiorCentavos: 180_000_001, limiteSuperiorCentavos: 360_000_000, aliquotaBp: 2_300, parcelaDeduzirCentavos: 6_210_000 },
          { ordem: 6, limiteInferiorCentavos: 360_000_001, limiteSuperiorCentavos: 480_000_000, aliquotaBp: 3_050, parcelaDeduzirCentavos: 54_000_000 },
        ],
      },
      observacao: 'Fechada pelo mesmo motivo do Anexo III.',
    },

    // -----------------------------------------------------------------------
    // O limiar do fator R — art. 18, § 5º-J.
    // -----------------------------------------------------------------------
    {
      id: 'simples-fator-r-2018',
      parametroId: 'simples-fator-r-limite',
      fonteId: 'lc-123-2006-art-18-fator-r',
      inicio: INICIO,
      fim: FIM,
      valor: { tipo: 'percentual', aliquotaBp: 2_800 },
      observacao:
        '"caso a razão entre a folha de salários e a receita bruta da pessoa jurídica seja igual ou superior a 28%". Igual ao limiar já basta para o Anexo III.',
    },
  ],
}
