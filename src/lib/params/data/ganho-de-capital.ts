/**
 * Ganho de capital na alienação de imóvel — CALC-020.
 *
 * A TABELA É PROGRESSIVA POR FAIXA, E A REDAÇÃO VIGENTE É A TERCEIRA
 *
 * O art. 21 da Lei nº 8.981/1995 aparece no texto consolidado com **três
 * redações empilhadas**. A da Medida Provisória nº 692/2015 traz faixas
 * completamente diferentes — 15%/20%/25%/30%, com o primeiro corte em R$ 1
 * milhão — e não é a vigente: a Lei nº 13.259/2016 a substituiu. Quem parar na
 * primeira ocorrência cadastra uma tabela inteira que não vale. É a armadilha de
 * `ESTADO-DO-PROJETO` §7.42 no seu pior caso.
 *
 * O texto diz "sobre a parcela dos ganhos que…": cada alíquota incide só sobre a
 * parcela contida na sua faixa, como no INSS.
 *
 * OS FATORES DE REDUÇÃO SÃO COEFICIENTES MENSAIS, NÃO DESCONTOS
 *
 * O art. 40 da Lei nº 11.196/2005 manda multiplicar o ganho por dois fatores:
 *
 *     FR1 = 1 / 1,0060^m1     FR2 = 1 / 1,0035^m2
 *
 * Os 0,60% e 0,35% são cadastrados como basis points porque é isso que eles são:
 * taxas mensais compostas. O motor as eleva com `fatorDeCapitalizacao`, em
 * inteiro grande — sem ponto flutuante em lugar nenhum.
 *
 * A lei foi publicada no **DOU de 22/11/2005**, e é dessa data que saem os
 * marcos de `m1` e `m2`. O § 2º manda contar o FR1 a partir de 1º/01/1996 para
 * imóveis adquiridos até 31/12/1995.
 */

import type { ConjuntoDeParametros } from '../tipos'
import {
  LEI_8981_ART_21,
  LEI_9250_ART_22,
  LEI_9250_ART_23,
  LEI_11196_ART_39,
  LEI_11196_ART_40,
  RFB_PR_IRPF_CRIPTOATIVOS,
} from './fontes'

/** Publicação da Lei nº 13.259/2016, que deu a redação vigente ao art. 21. */
const VIGENCIA_DA_TABELA = '2016-03-17'

/*
 * 🚨 UNIDADE: CENTAVOS, agrupados de três em três — e isto custou um defeito.
 *
 * As fronteiras da tabela foram cadastradas em 06/08/2026 como
 * `500_000_000_00`, que **lê** como "R$ 500.000.000 e 00 centavos" e **vale**
 * 50.000.000.000 centavos, ou seja R$ 500 milhões. A fronteira da lei é R$ 5
 * milhões — o valor entrou CEM VEZES maior, e a calculadora cobrou 15% onde
 * devia cobrar até 22,5%.
 *
 * O caso-ouro não pegou porque **foi escrito na mesma unidade errada**: ele
 * vendia por `900_000_000_00` e verificava que a base passava de
 * `500_000_000_00`. Dois erros que se confirmam não são dois erros — são um só,
 * com testemunha.
 *
 * A regra que fica: neste arquivo, valor monetário é centavo puro, agrupado de
 * três em três a partir da direita. `5_000_000_00` não existe; R$ 5.000.000,00
 * se escreve `500_000_000`. Quando o número tiver mais de seis dígitos, conferir
 * dividindo por cem antes de commitar.
 */

/** Publicação da Lei nº 11.196/2005, no DOU de 22/11/2005. */
const PUBLICACAO_11196 = '2005-11-22'

export const GANHO_DE_CAPITAL: ConjuntoDeParametros = {
  fontes: [
    LEI_8981_ART_21,
    LEI_9250_ART_22,
    LEI_9250_ART_23,
    LEI_11196_ART_39,
    LEI_11196_ART_40,
    RFB_PR_IRPF_CRIPTOATIVOS,
  ],

  parametros: [
    {
      id: 'ganho-capital-tabela',
      nome: 'Tabela do imposto sobre ganho de capital',
      descricao:
        'Faixas e alíquotas progressivas do imposto sobre o ganho de capital da pessoa física.',
      tipo: 'tabela_faixas',
    },
    {
      id: 'ganho-capital-isencao-pequeno-valor',
      nome: 'Teto mensal da isenção de bens de pequeno valor',
      descricao:
        'Total de alienações no mês até o qual o ganho de capital é isento. Observa o CONJUNTO de bens da mesma natureza vendidos no mês, e não cada venda.',
      tipo: 'valor_monetario',
    },
    {
      id: 'ganho-capital-isencao-imovel-unico',
      nome: 'Teto da isenção do imóvel único',
      descricao:
        'Valor de alienação até o qual o ganho na venda do único imóvel é isento, sem outra alienação nos cinco anos anteriores.',
      tipo: 'valor_monetario',
    },
    {
      id: 'ganho-capital-fr1-coeficiente',
      nome: 'Coeficiente mensal do fator de redução FR1',
      descricao:
        'Taxa mensal composta do FR1, aplicada aos meses até a publicação da Lei nº 11.196/2005.',
      tipo: 'percentual',
    },
    {
      id: 'ganho-capital-fr2-coeficiente',
      nome: 'Coeficiente mensal do fator de redução FR2',
      descricao:
        'Taxa mensal composta do FR2, aplicada aos meses a partir de dezembro de 2005.',
      tipo: 'percentual',
    },
    {
      id: 'ganho-capital-prazo-reinvestimento',
      nome: 'Prazo para reinvestir e isentar',
      descricao:
        'Dias contados da celebração do contrato para aplicar o produto da venda em imóvel residencial no País.',
      tipo: 'inteiro',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Art. 21 da Lei nº 8.981/1995, redação da Lei nº 13.259/2016.
    //
    //   até         5.000.000,00   15 %
    //   de  5.000.000,01 a 10.000.000,00   17,5 %
    //   de 10.000.000,01 a 30.000.000,00     20 %
    //   acima de 30.000.000,00             22,5 %
    // -----------------------------------------------------------------------
    {
      id: 'ganho-capital-tabela-2016',
      parametroId: 'ganho-capital-tabela',
      fonteId: 'lei-8981-1995-art-21',
      inicio: VIGENCIA_DA_TABELA,
      fim: null,
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          {
            ordem: 1,
            limiteInferiorCentavos: 0,
            limiteSuperiorCentavos: 500_000_000,
            aliquotaBp: 1_500,
          },
          {
            ordem: 2,
            limiteInferiorCentavos: 500_000_001,
            limiteSuperiorCentavos: 1_000_000_000,
            aliquotaBp: 1_750,
          },
          {
            ordem: 3,
            limiteInferiorCentavos: 1_000_000_001,
            limiteSuperiorCentavos: 3_000_000_000,
            aliquotaBp: 2_000,
          },
          {
            ordem: 4,
            limiteInferiorCentavos: 3_000_000_001,
            limiteSuperiorCentavos: null,
            aliquotaBp: 2_250,
          },
        ],
      },
      observacao:
        'Redação da Lei nº 13.259/2016. A redação anterior, da MP nº 692/2015, trazia faixas diferentes — 15/20/25/30% com corte em R$ 1 milhão — e não é a vigente.',
    },

    // -----------------------------------------------------------------------
    // Isenção de pequeno valor — art. 22, II, da Lei nº 9.250/1995, com a
    // redação da Lei nº 11.196/2005.
    //
    // É DEGRAU, NÃO DEDUÇÃO. O parágrafo único manda somar o conjunto de bens
    // da mesma natureza alienados no mês; ultrapassado o teto, o ganho inteiro
    // é tributado — não só a parte que excedeu.
    //
    // A MP nº 1.303/2025 revogaria isto para criptoativos e CADUCOU em
    // 08/10/2025. Ver a nota em `LEI_9250_ART_22`.
    // -----------------------------------------------------------------------
    {
      id: 'ganho-capital-pequeno-valor-2005',
      parametroId: 'ganho-capital-isencao-pequeno-valor',
      fonteId: 'lei-9250-1995-art-22',
      inicio: PUBLICACAO_11196,
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 3_500_000 },
      observacao:
        'Inciso II — "nos demais casos". O inciso I trata de ações negociadas no mercado de balcão, com teto de R$ 20.000,00, e não se aplica a criptoativo.',
    },

    // -----------------------------------------------------------------------
    // Isenção do imóvel único — art. 23 da Lei nº 9.250/1995, texto original.
    // -----------------------------------------------------------------------
    {
      id: 'ganho-capital-imovel-unico-1996',
      parametroId: 'ganho-capital-isencao-imovel-unico',
      fonteId: 'lei-9250-1995-art-23',
      inicio: '1996-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 44_000_000 },
      observacao:
        'O art. 23 exige três condições cumulativas: ser o ÚNICO imóvel do titular, valor de alienação até o teto, e nenhuma outra alienação nos cinco anos anteriores.',
    },

    // -----------------------------------------------------------------------
    // Fatores de redução e prazo de reinvestimento — Lei nº 11.196/2005,
    // publicada no DOU de 22/11/2005.
    // -----------------------------------------------------------------------
    {
      id: 'ganho-capital-fr1-2005',
      parametroId: 'ganho-capital-fr1-coeficiente',
      fonteId: 'lei-11196-2005-art-40',
      inicio: PUBLICACAO_11196,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 60 },
      observacao: 'FR1 = 1 / 1,0060^m1 — 0,60% ao mês, composto.',
    },
    {
      id: 'ganho-capital-fr2-2005',
      parametroId: 'ganho-capital-fr2-coeficiente',
      fonteId: 'lei-11196-2005-art-40',
      inicio: PUBLICACAO_11196,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 35 },
      observacao: 'FR2 = 1 / 1,0035^m2 — 0,35% ao mês, composto.',
    },
    {
      id: 'ganho-capital-reinvestimento-2005',
      parametroId: 'ganho-capital-prazo-reinvestimento',
      fonteId: 'lei-11196-2005-art-39',
      inicio: PUBLICACAO_11196,
      fim: null,
      valor: { tipo: 'inteiro', valor: 180 },
      observacao:
        'Contados da celebração do contrato. O § 5º limita o benefício a uma vez a cada cinco anos, e o § 2º tributa proporcionalmente a parcela não aplicada.',
    },
  ],
}
