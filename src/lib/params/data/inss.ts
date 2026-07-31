/**
 * Contribuição previdenciária do segurado empregado, doméstico e avulso.
 *
 * A tabela é **progressiva por faixa** (`RN-008`): quem ganha R$ 5.000 não paga
 * 14% sobre tudo — paga 7,5% sobre a parcela contida na primeira faixa, 9%
 * sobre a da segunda, e assim por diante. Aplicar alíquota única superestima o
 * desconto em centenas de reais, e é o erro mais comum do mercado.
 *
 * O **teto** é o limite superior da última faixa (`RN-009`). Não existe
 * parâmetro separado para ele de propósito: duplicar o mesmo fato em dois
 * lugares é convidar os dois a divergirem numa atualização futura.
 *
 * Valores em centavos; alíquotas em basis points (`ADR-004`).
 */

import type { ConjuntoDeParametros } from '../tipos'
import { PORTARIA_MPS_MF_13_2026, PORTARIA_MPS_MF_6_2025 } from './fontes'

export const INSS: ConjuntoDeParametros = {
  fontes: [PORTARIA_MPS_MF_6_2025, PORTARIA_MPS_MF_13_2026],

  parametros: [
    {
      id: 'inss-tabela-progressiva',
      nome: 'Tabela de contribuição previdenciária',
      descricao:
        'Faixas e alíquotas progressivas da contribuição do segurado empregado, doméstico e avulso.',
      tipo: 'tabela_faixas',
    },
    {
      id: 'salario-minimo',
      nome: 'Salário mínimo',
      descricao: 'Salário mínimo nacional, fixado anualmente.',
      tipo: 'valor_monetario',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // 2025 — Portaria Interministerial MPS/MF nº 6, de 10/01/2025, Anexo II
    //
    //   até        1.518,00   7,5 %
    //   de 1.518,01 até 2.793,88   9 %
    //   de 2.793,89 até 4.190,83  12 %
    //   de 4.190,84 até 8.157,41  14 %
    // -----------------------------------------------------------------------
    {
      id: 'inss-tabela-2025',
      parametroId: 'inss-tabela-progressiva',
      fonteId: 'portaria-mps-mf-6-2025',
      inicio: '2025-01-01',
      fim: '2025-12-31',
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 151_800, aliquotaBp: 750 },
          { ordem: 2, limiteInferiorCentavos: 151_801, limiteSuperiorCentavos: 279_388, aliquotaBp: 900 },
          { ordem: 3, limiteInferiorCentavos: 279_389, limiteSuperiorCentavos: 419_083, aliquotaBp: 1_200 },
          { ordem: 4, limiteInferiorCentavos: 419_084, limiteSuperiorCentavos: 815_741, aliquotaBp: 1_400 },
        ],
      },
      observacao:
        'Teto do salário de contribuição: R$ 8.157,41, limite superior da última faixa. Conferido no texto do Anexo II da portaria.',
    },

    // -----------------------------------------------------------------------
    // 2026 — Portaria Interministerial MPS/MF nº 13, de 09/01/2026, Anexo II
    //
    //   até        1.621,00   7,5 %
    //   de 1.621,01 até 2.902,84   9 %
    //   de 2.902,85 até 4.354,27  12 %
    //   de 4.354,28 até 8.475,55  14 %
    // -----------------------------------------------------------------------
    {
      id: 'inss-tabela-2026',
      parametroId: 'inss-tabela-progressiva',
      fonteId: 'portaria-mps-mf-13-2026',
      inicio: '2026-01-01',
      fim: null,
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 162_100, aliquotaBp: 750 },
          { ordem: 2, limiteInferiorCentavos: 162_101, limiteSuperiorCentavos: 290_284, aliquotaBp: 900 },
          { ordem: 3, limiteInferiorCentavos: 290_285, limiteSuperiorCentavos: 435_427, aliquotaBp: 1_200 },
          { ordem: 4, limiteInferiorCentavos: 435_428, limiteSuperiorCentavos: 847_555, aliquotaBp: 1_400 },
        ],
      },
      observacao:
        'Teto do salário de contribuição: R$ 8.475,55, limite superior da última faixa. Conferido faixa a faixa no Anexo II da portaria (DOU de 12/01/2026, edição 7, seção 1, página 58).',
    },

    // -----------------------------------------------------------------------
    // Salário mínimo — fixado nas mesmas portarias.
    // -----------------------------------------------------------------------
    {
      id: 'salario-minimo-2025',
      parametroId: 'salario-minimo',
      fonteId: 'portaria-mps-mf-6-2025',
      inicio: '2025-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'valor_monetario', centavos: 151_800 },
    },
    {
      id: 'salario-minimo-2026',
      parametroId: 'salario-minimo',
      fonteId: 'portaria-mps-mf-13-2026',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 162_100 },
    },
  ],
}
