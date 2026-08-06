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
 * ## O recorte: 2024 e 2025, e nada além
 *
 * A **Lei nº 15.270/2025 revogou o art. 11** da Lei nº 9.250/1995 — o artigo da
 * tabela anual — e mudou o limite do desconto simplificado a partir do
 * ano-calendário de 2026. De 2026 em diante a apuração anual não é a mesma conta
 * com outros números: entra o redutor do art. 3º-A, que é estrutura nova.
 *
 * Cadastrar 2026 pela metade — limite novo, estrutura velha — faria a
 * calculadora **oferecer 2026 no seletor e calcular errado**, que é o defeito de
 * `ESTADO-DO-PROJETO` §7.48 com consequência pior: lá a página exibia um ano e
 * usava outro; aqui exibiria o ano certo e aplicaria uma norma revogada.
 *
 * Por isso as vigências desta tabela são **fechadas**, sem nenhuma aberta. A
 * consequência é deliberada: quem escolher um exercício fora de 2024–2025 recebe
 * o bloqueio de `RN-003`, que é a resposta correta enquanto a estrutura de 2026
 * não for estudada.
 *
 * Valores em centavos; alíquotas em basis points (`ADR-004`).
 */

import type { ConjuntoDeParametros } from '../tipos'
import {
  LEI_9250_ART_8,
  LEI_9250_ART_10,
  RFB_TABELA_ANUAL_2024,
  RFB_TABELA_ANUAL_2025,
} from './fontes'

export const IRPF_ANUAL: ConjuntoDeParametros = {
  fontes: [RFB_TABELA_ANUAL_2024, RFB_TABELA_ANUAL_2025, LEI_9250_ART_8, LEI_9250_ART_10],

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
        'O percentual está no CAPUT e é mais antigo que 2015; a janela acompanha a do limite do inciso IX, com o qual ele forma uma regra só. A calculadora nunca resolve fora de 2024–2025.',
    },
    {
      id: 'irpf-simplificado-limite-2015',
      parametroId: 'irpf-simplificado-limite-anual',
      fonteId: 'lei-9250-1995-art-10',
      inicio: '2015-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'valor_monetario', centavos: 1_675_434 },
      observacao:
        'Inciso IX. A partir do ano-calendário de 2026 o inciso X fixa R$ 17.640,00 — não cadastrado, porque a estrutura da apuração também mudou.',
    },
  ],
}
