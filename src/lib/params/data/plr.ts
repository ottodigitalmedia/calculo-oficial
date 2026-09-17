/**
 * Participação nos lucros ou resultados — CALC-085.
 *
 * Tributação exclusiva na fonte, com tabela ANUAL própria (Lei nº 10.101/2000,
 * art. 3º, § 5º). Não se soma ao salário do mês e não entra na declaração de
 * ajuste — é a razão de a PLR ter calculadora própria.
 *
 * **As duas vigências de 2025 são as duas tabelas publicadas pela Receita**, e
 * a origem delas — com o que foi e o que não foi localizado — está registrada
 * em `RFB_TABELA_PLR`, em `fontes.ts`, junto da conferência aritmética de
 * continuidade entre as faixas.
 *
 * Mesmo corte de `irrf.ts`: janeiro a abril de 2025 numa vigência, maio de 2025
 * em diante em outra.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_10101_ART_3, RFB_TABELA_PLR } from './fontes'

export const PLR: ConjuntoDeParametros = {
  fontes: [LEI_10101_ART_3, RFB_TABELA_PLR],

  parametros: [
    {
      id: 'plr-tabela-exclusiva',
      nome: 'Tabela de tributação exclusiva da participação nos lucros',
      descricao:
        'Faixas anuais, alíquotas e parcela a deduzir do imposto retido exclusivamente na fonte sobre a PLR.',
      tipo: 'tabela_faixas',
    },
  ],

  vigencias: [
    {
      id: 'plr-tabela-2025-jan-abr',
      parametroId: 'plr-tabela-exclusiva',
      fonteId: 'rfb-tabela-plr',
      inicio: '2025-01-01',
      fim: '2025-04-30',
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 764_080, aliquotaBp: 0, parcelaDeduzirCentavos: 0 },
          { ordem: 2, limiteInferiorCentavos: 764_081, limiteSuperiorCentavos: 992_228, aliquotaBp: 750, parcelaDeduzirCentavos: 57_306 },
          { ordem: 3, limiteInferiorCentavos: 992_229, limiteSuperiorCentavos: 1_316_700, aliquotaBp: 1_500, parcelaDeduzirCentavos: 131_723 },
          { ordem: 4, limiteInferiorCentavos: 1_316_701, limiteSuperiorCentavos: 1_638_038, aliquotaBp: 2_250, parcelaDeduzirCentavos: 230_476 },
          { ordem: 5, limiteInferiorCentavos: 1_638_039, limiteSuperiorCentavos: null, aliquotaBp: 2_750, parcelaDeduzirCentavos: 312_378 },
        ],
      },
      observacao: 'Publicada pela Receita como "De janeiro a abril de 2025".',
    },
    {
      id: 'plr-tabela-2025-maio',
      parametroId: 'plr-tabela-exclusiva',
      fonteId: 'rfb-tabela-plr',
      inicio: '2025-05-01',
      fim: null,
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 821_440, aliquotaBp: 0, parcelaDeduzirCentavos: 0 },
          { ordem: 2, limiteInferiorCentavos: 821_441, limiteSuperiorCentavos: 992_228, aliquotaBp: 750, parcelaDeduzirCentavos: 61_608 },
          { ordem: 3, limiteInferiorCentavos: 992_229, limiteSuperiorCentavos: 1_316_700, aliquotaBp: 1_500, parcelaDeduzirCentavos: 136_025 },
          { ordem: 4, limiteInferiorCentavos: 1_316_701, limiteSuperiorCentavos: 1_638_038, aliquotaBp: 2_250, parcelaDeduzirCentavos: 234_778 },
          { ordem: 5, limiteInferiorCentavos: 1_638_039, limiteSuperiorCentavos: null, aliquotaBp: 2_750, parcelaDeduzirCentavos: 316_680 },
        ],
      },
      observacao:
        'Publicada pela Receita como "A partir de maio de 2025", e repetida sem alteração na página de tabelas de 2026.',
    },
  ],
}
