/**
 * Imposto sobre a renda retido na fonte — tabela mensal, deduções e redutor.
 *
 * TRÊS VIGÊNCIAS EM DOIS ANOS, e é isso que justifica o modelo de vigências:
 *
 *   jan–abr/2025   Lei nº 14.848/2024   isenção até R$ 2.259,20
 *   mai/2025 →     Lei nº 15.191/2025   isenção até R$ 2.428,80
 *   jan/2026 →     acrescenta o redutor do art. 3º-A da Lei nº 9.250/1995
 *
 * A tabela mudou **no meio de 2025**. Uma constante única por ano — o padrão do
 * mercado — não representa isso, e quem conferir um holerite de abril de 2025
 * com a tabela de maio encontra divergência sem saber por quê.
 *
 * A vigência de maio/2025 segue **aberta**: a tabela de 2026 é a mesma, o que a
 * página da Receita confirma ao atribuí-la à mesma Lei nº 15.191/2025.
 *
 * Valores em centavos; alíquotas em basis points (`ADR-004`).
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_14848_2024, LEI_15191_2025, LEI_9250_ART_3A } from './fontes'

export const IRRF: ConjuntoDeParametros = {
  fontes: [LEI_14848_2024, LEI_15191_2025, LEI_9250_ART_3A],

  parametros: [
    {
      id: 'irrf-tabela-progressiva',
      nome: 'Tabela progressiva mensal do imposto de renda',
      descricao: 'Faixas, alíquotas e parcela a deduzir da incidência mensal.',
      tipo: 'tabela_faixas',
    },
    {
      id: 'irrf-deducao-dependente',
      nome: 'Dedução por dependente',
      descricao: 'Valor mensal dedutível da base de cálculo, por dependente.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irrf-desconto-simplificado',
      nome: 'Desconto simplificado mensal',
      descricao:
        'Dedução alternativa às deduções legais; aplica-se a mais favorável ao contribuinte.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irrf-reducao-limite-integral',
      nome: 'Limite de rendimento para redução integral',
      descricao: 'Rendimento tributável até o qual vale a redução máxima do imposto.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irrf-reducao-valor-maximo',
      nome: 'Redução máxima do imposto',
      descricao: 'Valor máximo da redução mensal para rendimento dentro do limite integral.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irrf-reducao-constante',
      nome: 'Constante da fórmula de redução',
      descricao: 'Parcela fixa da fórmula de redução na faixa intermediária.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irrf-reducao-coeficiente',
      nome: 'Coeficiente da fórmula de redução',
      descricao:
        'Fator multiplicado pelo rendimento tributável na fórmula de redução da faixa intermediária.',
      tipo: 'fracao',
    },
    {
      id: 'irrf-reducao-limite-aplicacao',
      nome: 'Limite de rendimento para qualquer redução',
      descricao: 'Rendimento tributável acima do qual não há redução.',
      tipo: 'valor_monetario',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // jan–abr/2025 — Lei nº 14.848, de 1º/05/2024
    //
    //   até        2.259,20   isento
    //   2.259,21 a 2.826,65    7,5 %   deduzir  169,44
    //   2.826,66 a 3.751,05     15 %   deduzir  381,44
    //   3.751,06 a 4.664,68   22,5 %   deduzir  662,77
    //   acima de   4.664,68   27,5 %   deduzir  896,00
    // -----------------------------------------------------------------------
    {
      id: 'irrf-tabela-2025-01',
      parametroId: 'irrf-tabela-progressiva',
      fonteId: 'lei-14848-2024',
      inicio: '2025-01-01',
      fim: '2025-04-30',
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 225_920, aliquotaBp: 0, parcelaDeduzirCentavos: 0 },
          { ordem: 2, limiteInferiorCentavos: 225_921, limiteSuperiorCentavos: 282_665, aliquotaBp: 750, parcelaDeduzirCentavos: 16_944 },
          { ordem: 3, limiteInferiorCentavos: 282_666, limiteSuperiorCentavos: 375_105, aliquotaBp: 1_500, parcelaDeduzirCentavos: 38_144 },
          { ordem: 4, limiteInferiorCentavos: 375_106, limiteSuperiorCentavos: 466_468, aliquotaBp: 2_250, parcelaDeduzirCentavos: 66_277 },
          { ordem: 5, limiteInferiorCentavos: 466_469, limiteSuperiorCentavos: null, aliquotaBp: 2_750, parcelaDeduzirCentavos: 89_600 },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // mai/2025 em diante — Lei nº 15.191, de 11/08/2025
    //
    //   até        2.428,80   isento
    //   2.428,81 a 2.826,65    7,5 %   deduzir  182,16
    //   2.826,66 a 3.751,05     15 %   deduzir  394,16
    //   3.751,06 a 4.664,68   22,5 %   deduzir  675,49
    //   acima de   4.664,68   27,5 %   deduzir  908,73
    // -----------------------------------------------------------------------
    {
      id: 'irrf-tabela-2025-05',
      parametroId: 'irrf-tabela-progressiva',
      fonteId: 'lei-15191-2025',
      inicio: '2025-05-01',
      fim: null,
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 242_880, aliquotaBp: 0, parcelaDeduzirCentavos: 0 },
          { ordem: 2, limiteInferiorCentavos: 242_881, limiteSuperiorCentavos: 282_665, aliquotaBp: 750, parcelaDeduzirCentavos: 18_216 },
          { ordem: 3, limiteInferiorCentavos: 282_666, limiteSuperiorCentavos: 375_105, aliquotaBp: 1_500, parcelaDeduzirCentavos: 39_416 },
          { ordem: 4, limiteInferiorCentavos: 375_106, limiteSuperiorCentavos: 466_468, aliquotaBp: 2_250, parcelaDeduzirCentavos: 67_549 },
          { ordem: 5, limiteInferiorCentavos: 466_469, limiteSuperiorCentavos: null, aliquotaBp: 2_750, parcelaDeduzirCentavos: 90_873 },
        ],
      },
      observacao:
        'Vigência aberta: a página da Receita para 2026 publica esta mesma tabela, atribuída à mesma lei.',
    },

    // -----------------------------------------------------------------------
    // Dedução por dependente — R$ 189,59, inalterada nos dois períodos.
    // Duas vigências e não uma: o valor é o mesmo, a norma que o publica não.
    // -----------------------------------------------------------------------
    {
      id: 'irrf-dependente-2025-01',
      parametroId: 'irrf-deducao-dependente',
      fonteId: 'lei-14848-2024',
      inicio: '2025-01-01',
      fim: '2025-04-30',
      valor: { tipo: 'valor_monetario', centavos: 18_959 },
    },
    {
      id: 'irrf-dependente-2025-05',
      parametroId: 'irrf-deducao-dependente',
      fonteId: 'lei-15191-2025',
      inicio: '2025-05-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 18_959 },
    },

    // -----------------------------------------------------------------------
    // Desconto simplificado — este SIM mudou: 564,80 → 607,20.
    // -----------------------------------------------------------------------
    {
      id: 'irrf-simplificado-2025-01',
      parametroId: 'irrf-desconto-simplificado',
      fonteId: 'lei-14848-2024',
      inicio: '2025-01-01',
      fim: '2025-04-30',
      valor: { tipo: 'valor_monetario', centavos: 56_480 },
    },
    {
      id: 'irrf-simplificado-2025-05',
      parametroId: 'irrf-desconto-simplificado',
      fonteId: 'lei-15191-2025',
      inicio: '2025-05-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 60_720 },
    },

    // -----------------------------------------------------------------------
    // Redutor — art. 3º-A da Lei nº 9.250/1995, a partir de janeiro de 2026.
    //
    //   rendimentos até R$ 5.000,00        redução de até R$ 312,89
    //   de R$ 5.000,01 a R$ 7.350,00       978,62 − (0,133145 × rendimentos)
    //   acima de R$ 7.350,00               sem redução
    //
    // Decomposto em cinco parâmetros e não num bloco único: cada um
    // corresponde a UM número do texto legal, e é assim que a auditoria
    // confere dígito a dígito.
    //
    // NÃO há vigência anterior a 2026. O mecanismo não existia, e inventar uma
    // vigência "sem redução" para 2025 exigiria citar uma norma que não trata
    // do assunto. Consequência para T-102: o motor precisa tratar este
    // parâmetro como OPCIONAL, e não confundir "não havia redutor" com "não
    // temos o dado" — que é o que RN-003 significa.
    // -----------------------------------------------------------------------
    {
      id: 'irrf-reducao-limite-integral-2026',
      parametroId: 'irrf-reducao-limite-integral',
      fonteId: 'lei-9250-1995-art-3a',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 500_000 },
    },
    {
      id: 'irrf-reducao-valor-maximo-2026',
      parametroId: 'irrf-reducao-valor-maximo',
      fonteId: 'lei-9250-1995-art-3a',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 31_289 },
    },
    {
      id: 'irrf-reducao-constante-2026',
      parametroId: 'irrf-reducao-constante',
      fonteId: 'lei-9250-1995-art-3a',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 97_862 },
    },
    {
      id: 'irrf-reducao-coeficiente-2026',
      parametroId: 'irrf-reducao-coeficiente',
      fonteId: 'lei-9250-1995-art-3a',
      inicio: '2026-01-01',
      fim: null,
      // 0,133145 não cabe em basis points (seria 1331,45). Registrado como a
      // norma o expressa, sem simplificar — ADR-007, regra F-2.
      valor: { tipo: 'fracao', numerador: 133_145, denominador: 1_000_000 },
    },
    {
      id: 'irrf-reducao-limite-aplicacao-2026',
      parametroId: 'irrf-reducao-limite-aplicacao',
      fonteId: 'lei-9250-1995-art-3a',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 735_000 },
    },
  ],
}
