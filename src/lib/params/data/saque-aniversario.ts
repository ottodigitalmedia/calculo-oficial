/**
 * Saque-aniversário do FGTS — CALC-095.
 *
 * Lote 3 da expansão do catálogo. Transcrição literal do dispositivo em
 * `fontes.ts`, junto da fonte.
 *
 * **A tabela do Anexo SOMA uma parcela, não a deduz.** É a primeira tabela do
 * sistema com esse formato, e foi por ela que `Faixa` ganhou
 * `parcelaAdicionalCentavos` — ver a nota em `params/tipos.ts`. Guardar a
 * parcela adicional no campo de dedução, com sinal trocado, calcularia certo e
 * mentiria para quem auditasse o cadastro.
 *
 * Vigência a partir de 12/12/2019, data em que a Lei nº 13.932 foi publicada —
 * e em que estes dispositivos passaram a valer (art. 11, III).
 *
 * ## Os limites da ANTECIPAÇÃO, desde 21/09/2026
 *
 * A antecipação é empréstimo com os saques futuros em garantia (art. 20-D, §
 * 3º), e quem a limita é o Conselho Curador. Os quatro parâmetros abaixo saem
 * da Resolução nº 958/2020 com a redação da nº 1.130/2025, e o teto de juros,
 * de uma cadeia de três normas descrita em `PORTARIA_MGI_7588`.
 *
 * **As parcelas mudam de cinco para três em 1º/11/2026**, e é exatamente para
 * isso que a vigência existe: a página responde cinco hoje e três depois, sem
 * ninguém precisar lembrar da data.
 *
 * Antes de 20/10/2025 não havia esses limites na norma do Conselho, e as
 * vigências começam ali. Quem consultar data anterior recebe o bloqueio de
 * `RN-003` no bloco da antecipação — e o saque-aniversário continua calculando,
 * porque os parâmetros são opcionais para a calculadora.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_8036_ART_20_D, PORTARIA_MGI_7588, RES_CCFGTS_958 } from './fontes'

export const SAQUE_ANIVERSARIO: ConjuntoDeParametros = {
  fontes: [LEI_8036_ART_20_D, RES_CCFGTS_958, PORTARIA_MGI_7588],

  parametros: [
    {
      id: 'fgts-saque-aniversario-tabela',
      nome: 'Saque-aniversário do FGTS — tabela do Anexo',
      descricao:
        'Alíquota por faixa de saldo somado das contas vinculadas, com a parcela adicional correspondente.',
      tipo: 'tabela_faixas',
    },
    {
      id: 'antecipacao-saques-maximos',
      nome: 'Antecipação — saques anuais que podem ser cedidos',
      descricao: 'Número máximo de saques-aniversário futuros que podem ser alienados ou cedidos numa contratação.',
      tipo: 'inteiro',
    },
    {
      id: 'antecipacao-valor-minimo-por-saque',
      nome: 'Antecipação — valor mínimo cedido por saque',
      descricao: 'Valor mínimo que pode ser cedido de cada saque-aniversário anual.',
      tipo: 'valor_monetario',
    },
    {
      id: 'antecipacao-valor-maximo-por-saque',
      nome: 'Antecipação — valor máximo cedido por saque',
      descricao: 'Valor máximo que pode ser cedido de cada saque-aniversário anual.',
      tipo: 'valor_monetario',
    },
    {
      id: 'antecipacao-carencia-dias',
      nome: 'Antecipação — carência desde a opção pelo saque-aniversário',
      descricao: 'Dias mínimos entre o início da vigência da opção pelo saque-aniversário e a autorização para contratar.',
      tipo: 'inteiro',
    },
    {
      id: 'antecipacao-juros-teto-mensal',
      nome: 'Antecipação — limite de juros ao mês',
      descricao:
        'Percentual ao mês que as taxas da antecipação precisam ficar ABAIXO, por remissão da Resolução CCFGTS nº 958/2020 ao teto do consignado federal.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    {
      id: 'fgts-saque-aniversario-2019',
      parametroId: 'fgts-saque-aniversario-tabela',
      fonteId: 'lei-8036-1990-art-20-d',
      inicio: '2019-12-12',
      fim: null,
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 50_000, aliquotaBp: 5_000 },
          {
            ordem: 2,
            limiteInferiorCentavos: 50_001,
            limiteSuperiorCentavos: 100_000,
            aliquotaBp: 4_000,
            parcelaAdicionalCentavos: 5_000,
          },
          {
            ordem: 3,
            limiteInferiorCentavos: 100_001,
            limiteSuperiorCentavos: 500_000,
            aliquotaBp: 3_000,
            parcelaAdicionalCentavos: 15_000,
          },
          {
            ordem: 4,
            limiteInferiorCentavos: 500_001,
            limiteSuperiorCentavos: 1_000_000,
            aliquotaBp: 2_000,
            parcelaAdicionalCentavos: 65_000,
          },
          {
            ordem: 5,
            limiteInferiorCentavos: 1_000_001,
            limiteSuperiorCentavos: 1_500_000,
            aliquotaBp: 1_500,
            parcelaAdicionalCentavos: 115_000,
          },
          {
            ordem: 6,
            limiteInferiorCentavos: 1_500_001,
            limiteSuperiorCentavos: 2_000_000,
            aliquotaBp: 1_000,
            parcelaAdicionalCentavos: 190_000,
          },
          {
            ordem: 7,
            limiteInferiorCentavos: 2_000_001,
            limiteSuperiorCentavos: null,
            aliquotaBp: 500,
            parcelaAdicionalCentavos: 290_000,
          },
        ],
      },
      observacao:
        'A alíquota incide sobre a SOMA de todos os saldos das contas vinculadas do titular, apurados na data do débito (art. 20-D, I). A tabela é contínua nas fronteiras: cada parcela adicional existe para que o saque não caia ao passar de faixa.',
    },

    // ---- Antecipação: limites do Conselho Curador -------------------------
    // Cinco saques até 31/10/2026 (art. 2º da Resolução nº 1.130/2025) e três
    // a partir de 1º/11/2026 (art. 1º, § 3º, da Resolução nº 958/2020).
    {
      id: 'antecipacao-saques-maximos-transicao',
      parametroId: 'antecipacao-saques-maximos',
      fonteId: 'res-ccfgts-958-2020',
      inicio: '2025-10-20',
      fim: '2026-10-31',
      valor: { tipo: 'inteiro', valor: 5 },
      observacao: 'Regra de transição do art. 2º da Resolução nº 1.130/2025, que vale "até 31 de outubro de 2026".',
    },
    {
      id: 'antecipacao-saques-maximos-2026',
      parametroId: 'antecipacao-saques-maximos',
      fonteId: 'res-ccfgts-958-2020',
      inicio: '2026-11-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 3 },
      observacao: 'Art. 1º, § 3º, da Resolução nº 958/2020, na redação da nº 1.130/2025.',
    },
    {
      id: 'antecipacao-valor-minimo-2025',
      parametroId: 'antecipacao-valor-minimo-por-saque',
      fonteId: 'res-ccfgts-958-2020',
      inicio: '2025-10-20',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 10_000 },
    },
    {
      id: 'antecipacao-valor-maximo-2025',
      parametroId: 'antecipacao-valor-maximo-por-saque',
      fonteId: 'res-ccfgts-958-2020',
      inicio: '2025-10-20',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 50_000 },
    },
    {
      id: 'antecipacao-carencia-2025',
      parametroId: 'antecipacao-carencia-dias',
      fonteId: 'res-ccfgts-958-2020',
      inicio: '2025-10-20',
      fim: null,
      valor: { tipo: 'inteiro', valor: 90 },
    },
    {
      id: 'antecipacao-juros-teto-2023',
      parametroId: 'antecipacao-juros-teto-mensal',
      fonteId: 'portaria-mgi-7588-2023',
      inicio: '2023-11-29',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 180 },
      observacao:
        'A Resolução CCFGTS nº 958/2020, art. 5º, manda que as taxas sejam INFERIORES a este limite, e não iguais a ele.',
    },
  ],
}
