/**
 * Ajuste anual do imposto de renda — CALC-017 e CALC-019.
 *
 * **Conjunto separado do `irrf.ts` de propósito.** São grandezas diferentes com
 * o mesmo nome: a tabela mensal e a anual não se convertem uma na outra por
 * multiplicação, e misturá-las num conjunto só convidaria alguém a resolver
 * `irrf-tabela-progressiva` numa conta anual. O nome de cada parâmetro carrega o
 * sufixo `-anual` pela mesma razão.
 *
 * **Por que a anual não é doze vezes a mensal.** Em 2025 a tabela mudou em maio;
 * em 2024, em fevereiro. O ano tem, portanto, dois trechos, e a anual publicada
 * é a mistura ponderada pelos meses de cada um. A conferência está em
 * `RFB_TABELA_ANUAL_2025` e fecha ao centavo nos dois exercícios.
 *
 * ## 2024, 2025 e — desde o lote 13 — 2026
 *
 * A **Lei nº 15.270/2025 revogou o art. 11** da Lei nº 9.250/1995 — o artigo da
 * tabela anual —, mudou o limite do desconto simplificado a partir do
 * ano-calendário de 2026 e criou a **redução anual do art. 11-A**. De 2026 em
 * diante a apuração não é a mesma conta com outros números: é a tabela anual
 * publicada pela Receita MAIS a redução, limitada ao imposto da tabela.
 *
 * Até 19/09/2026 o ano de 2026 ficou bloqueado, de propósito: cadastrar o limite
 * novo com a estrutura velha teria oferecido 2026 no seletor e calculado errado
 * (`ESTADO-DO-PROJETO` §7.48). Agora entram as três peças juntas — a tabela, o
 * limite do simplificado (inciso X do art. 10) e os parâmetros da redução —, e
 * o motor aplica a redução quando ela vige.
 *
 * As tabelas continuam com vigência **fechada** no ano: tabela anual vale para o
 * exercício dela. Um ano-calendário sem tabela publicada recebe o bloqueio de
 * `RN-003`.
 *
 * Valores em centavos; alíquotas em basis points (`ADR-004`).
 */

import type { ConjuntoDeParametros } from '../tipos'
import {
  LEI_9250_ART_8,
  LEI_9250_ART_10,
  LEI_9250_ART_11A,
  LEI_9532_ART_11,
  RFB_TABELA_ANUAL_2024,
  RFB_TABELA_ANUAL_2025,
  RFB_TABELA_ANUAL_2026,
} from './fontes'

export const IRPF_ANUAL: ConjuntoDeParametros = {
  fontes: [
    RFB_TABELA_ANUAL_2024,
    RFB_TABELA_ANUAL_2025,
    RFB_TABELA_ANUAL_2026,
    LEI_9250_ART_8,
    LEI_9250_ART_10,
    LEI_9250_ART_11A,
    LEI_9532_ART_11,
  ],

  parametros: [
    {
      id: 'irpf-tabela-anual',
      nome: 'Tabela progressiva anual do imposto de renda',
      descricao:
        'Faixas, alíquotas e parcela a deduzir da apuração anual, na Declaração de Ajuste Anual.',
      tipo: 'tabela_faixas',
    },
    {
      id: 'irpf-dependente-anual',
      nome: 'Dedução anual por dependente',
      descricao: 'Valor dedutível da base de cálculo anual, por dependente declarado.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irpf-instrucao-limite-anual',
      nome: 'Limite anual de dedução com instrução',
      descricao:
        'Teto individual da despesa com instrução — vale por pessoa, e o que excede não é dedutível.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irpf-simplificado-percentual-anual',
      nome: 'Percentual do desconto simplificado',
      descricao:
        'Percentual dos rendimentos tributáveis que o desconto simplificado deduz, em substituição a todas as demais deduções.',
      tipo: 'percentual',
    },
    {
      id: 'irpf-simplificado-limite-anual',
      nome: 'Limite do desconto simplificado',
      descricao: 'Teto do desconto simplificado, qualquer que seja o rendimento.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irpf-previdencia-privada-limite-anual',
      nome: 'Limite de dedução da previdência privada',
      descricao:
        'Percentual dos rendimentos tributáveis até o qual as contribuições à previdência privada (PGBL) são dedutíveis no modelo completo.',
      tipo: 'percentual',
    },
    {
      id: 'irpf-reducao-anual-limite-integral',
      nome: 'Redução anual — limite de rendimento da redução integral',
      descricao: 'Rendimentos tributáveis anuais até os quais vale a redução máxima do art. 11-A.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irpf-reducao-anual-valor-maximo',
      nome: 'Redução anual — valor máximo',
      descricao: 'Redução máxima do imposto anual, para rendimentos dentro do limite integral.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irpf-reducao-anual-constante',
      nome: 'Redução anual — constante da fórmula',
      descricao: 'Parcela fixa da fórmula de redução na faixa intermediária.',
      tipo: 'valor_monetario',
    },
    {
      id: 'irpf-reducao-anual-coeficiente',
      nome: 'Redução anual — coeficiente da fórmula',
      descricao: 'Fator multiplicado pelos rendimentos tributáveis na fórmula da faixa intermediária.',
      tipo: 'fracao',
    },
    {
      id: 'irpf-reducao-anual-limite-aplicacao',
      nome: 'Redução anual — limite de rendimento para qualquer redução',
      descricao: 'Rendimentos tributáveis anuais acima dos quais não há redução.',
      tipo: 'valor_monetario',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Ano-calendário 2024 — exercício 2025
    //
    //   até        26.963,20   isento
    //   26.963,21 a 33.919,80    7,5 %   deduzir  2.022,24
    //   33.919,81 a 45.012,60     15 %   deduzir  4.566,23
    //   45.012,61 a 55.976,16   22,5 %   deduzir  7.942,17
    //   acima de   55.976,16    27,5 %   deduzir 10.740,98
    //
    // Confere por reprodução: 2024 teve tabela mensal nova em fevereiro, então
    // a isenção anual é 1 × 2.112,00 + 11 × 2.259,20 = 26.963,20.
    // -----------------------------------------------------------------------
    {
      id: 'irpf-tabela-anual-2024',
      parametroId: 'irpf-tabela-anual',
      fonteId: 'rfb-tabela-anual-ac2024',
      inicio: '2024-01-01',
      fim: '2024-12-31',
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 2_696_320, aliquotaBp: 0, parcelaDeduzirCentavos: 0 },
          { ordem: 2, limiteInferiorCentavos: 2_696_321, limiteSuperiorCentavos: 3_391_980, aliquotaBp: 750, parcelaDeduzirCentavos: 202_224 },
          { ordem: 3, limiteInferiorCentavos: 3_391_981, limiteSuperiorCentavos: 4_501_260, aliquotaBp: 1_500, parcelaDeduzirCentavos: 456_623 },
          { ordem: 4, limiteInferiorCentavos: 4_501_261, limiteSuperiorCentavos: 5_597_616, aliquotaBp: 2_250, parcelaDeduzirCentavos: 794_217 },
          { ordem: 5, limiteInferiorCentavos: 5_597_617, limiteSuperiorCentavos: null, aliquotaBp: 2_750, parcelaDeduzirCentavos: 1_074_098 },
        ],
      },
      observacao:
        'Vigência FECHADA no fim do ano-calendário: tabela anual vale para o exercício dela, e não "até segunda ordem".',
    },

    // -----------------------------------------------------------------------
    // Ano-calendário 2025 — exercício 2026
    //
    //   até        28.467,20   isento
    //   28.467,21 a 33.919,80    7,5 %   deduzir  2.135,04
    //   33.919,81 a 45.012,60     15 %   deduzir  4.679,03
    //   45.012,61 a 55.976,16   22,5 %   deduzir  8.054,97
    //   acima de   55.976,16    27,5 %   deduzir 10.853,78
    //
    // Confere por reprodução: 4 × 2.259,20 + 8 × 2.428,80 = 28.467,20, porque a
    // tabela mensal mudou em maio de 2025.
    // -----------------------------------------------------------------------
    {
      id: 'irpf-tabela-anual-2025',
      parametroId: 'irpf-tabela-anual',
      fonteId: 'rfb-tabela-anual-ac2025',
      inicio: '2025-01-01',
      fim: '2025-12-31',
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 2_846_720, aliquotaBp: 0, parcelaDeduzirCentavos: 0 },
          { ordem: 2, limiteInferiorCentavos: 2_846_721, limiteSuperiorCentavos: 3_391_980, aliquotaBp: 750, parcelaDeduzirCentavos: 213_504 },
          { ordem: 3, limiteInferiorCentavos: 3_391_981, limiteSuperiorCentavos: 4_501_260, aliquotaBp: 1_500, parcelaDeduzirCentavos: 467_903 },
          { ordem: 4, limiteInferiorCentavos: 4_501_261, limiteSuperiorCentavos: 5_597_616, aliquotaBp: 2_250, parcelaDeduzirCentavos: 805_497 },
          { ordem: 5, limiteInferiorCentavos: 5_597_617, limiteSuperiorCentavos: null, aliquotaBp: 2_750, parcelaDeduzirCentavos: 1_085_378 },
        ],
      },
      observacao:
        'Fechada em 31/12/2025. A Lei nº 15.270/2025 revogou o art. 11 da Lei nº 9.250/1995 e alterou o regime a partir de 2026 — ver o cabeçalho deste arquivo.',
    },

    // -----------------------------------------------------------------------
    // Ano-calendário 2026 — exercício 2027
    //
    //   até        29.145,60   isento
    //   29.145,61 a 33.919,80    7,5 %   deduzir  2.185,92
    //   33.919,81 a 45.012,60     15 %   deduzir  4.729,91
    //   45.012,61 a 55.976,16   22,5 %   deduzir  8.105,85
    //   acima de   55.976,16    27,5 %   deduzir 10.904,66
    //
    // Os limites são 12 × os mensais (a tabela mensal não mudou no ano). As
    // parcelas são as PUBLICADAS pela Receita, que diferem de 12 × as mensais
    // por centavos — ver `RFB_TABELA_ANUAL_2026`.
    // -----------------------------------------------------------------------
    {
      id: 'irpf-tabela-anual-2026',
      parametroId: 'irpf-tabela-anual',
      fonteId: 'rfb-tabela-anual-ac2026',
      inicio: '2026-01-01',
      fim: '2026-12-31',
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 2_914_560, aliquotaBp: 0, parcelaDeduzirCentavos: 0 },
          { ordem: 2, limiteInferiorCentavos: 2_914_561, limiteSuperiorCentavos: 3_391_980, aliquotaBp: 750, parcelaDeduzirCentavos: 218_592 },
          { ordem: 3, limiteInferiorCentavos: 3_391_981, limiteSuperiorCentavos: 4_501_260, aliquotaBp: 1_500, parcelaDeduzirCentavos: 472_991 },
          { ordem: 4, limiteInferiorCentavos: 4_501_261, limiteSuperiorCentavos: 5_597_616, aliquotaBp: 2_250, parcelaDeduzirCentavos: 810_585 },
          { ordem: 5, limiteInferiorCentavos: 5_597_617, limiteSuperiorCentavos: null, aliquotaBp: 2_750, parcelaDeduzirCentavos: 1_090_466 },
        ],
      },
      observacao: 'Fechada no fim do ano-calendário, como as anteriores. A redução do art. 11-A é aplicada sobre o imposto desta tabela.',
    },

    // ---- Redução anual — Lei nº 9.250/1995, art. 11-A (Lei nº 15.270/2025) --
    { id: 'irpf-reducao-anual-limite-integral-2026', parametroId: 'irpf-reducao-anual-limite-integral', fonteId: 'lei-9250-1995-art-11a',
      inicio: '2026-01-01', fim: null, valor: { tipo: 'valor_monetario', centavos: 6_000_000 } },
    { id: 'irpf-reducao-anual-valor-maximo-2026', parametroId: 'irpf-reducao-anual-valor-maximo', fonteId: 'lei-9250-1995-art-11a',
      inicio: '2026-01-01', fim: null, valor: { tipo: 'valor_monetario', centavos: 269_415 } },
    { id: 'irpf-reducao-anual-constante-2026', parametroId: 'irpf-reducao-anual-constante', fonteId: 'lei-9250-1995-art-11a',
      inicio: '2026-01-01', fim: null, valor: { tipo: 'valor_monetario', centavos: 842_973 } },
    // 0,095575 registrado como a norma o escreve — ADR-007, regra F-2.
    { id: 'irpf-reducao-anual-coeficiente-2026', parametroId: 'irpf-reducao-anual-coeficiente', fonteId: 'lei-9250-1995-art-11a',
      inicio: '2026-01-01', fim: null, valor: { tipo: 'fracao', numerador: 95_575, denominador: 1_000_000 } },
    { id: 'irpf-reducao-anual-limite-aplicacao-2026', parametroId: 'irpf-reducao-anual-limite-aplicacao', fonteId: 'lei-9250-1995-art-11a',
      inicio: '2026-01-01', fim: null, valor: { tipo: 'valor_monetario', centavos: 8_820_000 },
      observacao: '§ 2º: acima deste rendimento tributável anual, não há redução.' },

    // ---- Previdência privada — Lei nº 9.532/1997, art. 11 --------------------
    {
      id: 'irpf-previdencia-privada-limite-2024',
      parametroId: 'irpf-previdencia-privada-limite-anual',
      fonteId: 'lei-9532-1997-art-11',
      inicio: '2024-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_200 },
      observacao:
        'Redação da Lei nº 10.887/2004. Cadastrado a partir do primeiro ano-calendário que esta calculadora cobre; a regra é mais antiga. Exige contribuição ao regime geral ou próprio, salvo aposentados e pensionistas (§ 5º).',
    },

    // -----------------------------------------------------------------------
    // Deduções — Lei nº 9.250/1995, art. 8º, com a redação da Lei nº 13.149/2015
    //
    // Estas seguem "a partir do ano-calendário de 2015", sem prazo final no
    // texto, e por isso ficam ABERTAS. Não estragam o seletor: a cobertura da
    // calculadora é a INTERSEÇÃO das coberturas (restrição C-1), e quem a limita
    // a 2024–2025 é a tabela anual acima.
    // -----------------------------------------------------------------------
    {
      id: 'irpf-dependente-anual-2015',
      parametroId: 'irpf-dependente-anual',
      fonteId: 'lei-9250-1995-art-8',
      inicio: '2015-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 227_508 },
      observacao:
        'Art. 8º, II, "c", item 9. O texto consolidado empilha redações; esta é a última — Lei nº 13.149/2015.',
    },
    {
      id: 'irpf-instrucao-limite-anual-2015',
      parametroId: 'irpf-instrucao-limite-anual',
      fonteId: 'lei-9250-1995-art-8',
      inicio: '2015-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 356_150 },
      observacao:
        'Art. 8º, II, "b", item 10. Teto POR PESSOA — do declarante e de cada dependente, cada um com o seu.',
    },

    // -----------------------------------------------------------------------
    // Desconto simplificado — Lei nº 9.250/1995, art. 10
    //
    // O inciso IX, na redação da Lei nº 15.270/2025, diz "a partir do
    // ano-calendário de 2015 ATÉ o ano-calendário de 2025". A vigência fecha
    // onde a norma manda fechar — e o inciso X, de 2026, não entra aqui pela
    // razão no cabeçalho deste arquivo.
    // -----------------------------------------------------------------------
    {
      id: 'irpf-simplificado-percentual-2015',
      parametroId: 'irpf-simplificado-percentual-anual',
      fonteId: 'lei-9250-1995-art-10',
      inicio: '2015-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
      observacao:
        'O percentual está no CAPUT e é mais antigo que 2015; a janela acompanha a do limite do inciso IX, com o qual ele forma uma regra só.',
    },
    {
      id: 'irpf-simplificado-percentual-2026',
      parametroId: 'irpf-simplificado-percentual-anual',
      fonteId: 'lei-9250-1995-art-10',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
      observacao: 'Mesmo caput; acompanha o limite do inciso X.',
    },
    {
      id: 'irpf-simplificado-limite-2015',
      parametroId: 'irpf-simplificado-limite-anual',
      fonteId: 'lei-9250-1995-art-10',
      inicio: '2015-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'valor_monetario', centavos: 1_675_434 },
      observacao: 'Inciso IX. A partir do ano-calendário de 2026, o inciso X.',
    },
    {
      id: 'irpf-simplificado-limite-2026',
      parametroId: 'irpf-simplificado-limite-anual',
      fonteId: 'lei-9250-1995-art-10',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 1_764_000 },
      observacao: 'Inciso X, na redação da Lei nº 15.270/2025: a partir do ano-calendário de 2026.',
    },
  ],
}
