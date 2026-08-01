/**
 * Parâmetros do seguro-desemprego — CALC-009.
 *
 * **Dois grupos com naturezas muito diferentes, e isso importa para a
 * auditoria.**
 *
 * Os que decidem o NÚMERO DE PARCELAS estão no corpo da Lei nº 7.998/1990, art.
 * 4º, § 2º, com a redação da Lei nº 13.134/2015. Só mudam por alteração
 * legislativa, e por isso a vigência começa na eficácia da lei que os pôs ali —
 * não por exercício.
 *
 * Os que decidem o VALOR são reajustados todo ano pelo INPC. O art. 5º fixa o
 * método e expressa os limites em BTN, moeda extinta em 1991; os valores em
 * reais vêm da tabela anual do Ministério do Trabalho e Emprego. É por isso que
 * eles têm vigência de exercício, como as tabelas de INSS e de IRRF — e é por
 * isso que a fonte deles é a mais fraca do projeto, o que está declarado em
 * `MTE_TABELA_SEGURO_DESEMPREGO`.
 *
 * **O piso não está aqui.** O art. 5º, § 2º, diz que o benefício "não poderá ser
 * inferior ao valor do salário mínimo", e o salário mínimo já é parâmetro do
 * sistema desde T-102. Cadastrá-lo de novo criaria duas verdades sobre o mesmo
 * número — e uma delas ficaria para trás na primeira virada de ano.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_7998_ART_4, LEI_7998_ART_5, MTE_TABELA_SEGURO_DESEMPREGO } from './fontes'

export const SEGURO_DESEMPREGO: ConjuntoDeParametros = {
  fontes: [LEI_7998_ART_4, LEI_7998_ART_5, MTE_TABELA_SEGURO_DESEMPREGO],

  parametros: [
    // --- Número de parcelas: Lei nº 7.998/1990, art. 4º, § 2º ---
    {
      id: 'seguro-desemprego-meses-minimos-1a',
      nome: 'Seguro-desemprego — meses mínimos na 1ª solicitação',
      descricao:
        'Tempo mínimo de vínculo nos 36 meses anteriores à dispensa para ter direito ao benefício na primeira solicitação.',
      tipo: 'inteiro',
    },
    {
      id: 'seguro-desemprego-meses-minimos-2a',
      nome: 'Seguro-desemprego — meses mínimos na 2ª solicitação',
      descricao: 'Tempo mínimo de vínculo para ter direito na segunda solicitação.',
      tipo: 'inteiro',
    },
    {
      id: 'seguro-desemprego-meses-minimos-3a',
      nome: 'Seguro-desemprego — meses mínimos da 3ª solicitação em diante',
      descricao: 'Tempo mínimo de vínculo para ter direito da terceira solicitação em diante.',
      tipo: 'inteiro',
    },
    {
      id: 'seguro-desemprego-meses-para-4-parcelas',
      nome: 'Seguro-desemprego — meses para 4 parcelas',
      descricao: 'Tempo de vínculo a partir do qual são devidas quatro parcelas.',
      tipo: 'inteiro',
    },
    {
      id: 'seguro-desemprego-meses-para-5-parcelas',
      nome: 'Seguro-desemprego — meses para 5 parcelas',
      descricao: 'Tempo de vínculo a partir do qual são devidas cinco parcelas, o máximo legal.',
      tipo: 'inteiro',
    },

    // --- Valor da parcela: art. 5º, com os limites da tabela anual ---
    {
      id: 'seguro-desemprego-faixa-1-limite',
      nome: 'Seguro-desemprego — limite da 1ª faixa de salário médio',
      descricao: 'Salário médio até o qual se aplica apenas o fator da primeira faixa.',
      tipo: 'valor_monetario',
    },
    {
      id: 'seguro-desemprego-faixa-2-limite',
      nome: 'Seguro-desemprego — limite da 2ª faixa de salário médio',
      descricao: 'Salário médio acima do qual o benefício é o valor invariável do teto.',
      tipo: 'valor_monetario',
    },
    {
      id: 'seguro-desemprego-faixa-1-fator',
      nome: 'Seguro-desemprego — fator da 1ª faixa',
      descricao: 'Fator aplicado ao salário médio dentro da primeira faixa.',
      tipo: 'percentual',
    },
    {
      id: 'seguro-desemprego-faixa-2-fator',
      nome: 'Seguro-desemprego — fator da 2ª faixa',
      descricao: 'Fator aplicado à parte do salário médio que excede o limite da primeira faixa.',
      tipo: 'percentual',
    },
    {
      id: 'seguro-desemprego-parcela-somar',
      nome: 'Seguro-desemprego — parcela a somar na 2ª faixa',
      descricao:
        'Valor somado ao resultado da segunda faixa, correspondente ao benefício apurado sobre o limite da primeira.',
      tipo: 'valor_monetario',
    },
    {
      id: 'seguro-desemprego-teto',
      nome: 'Seguro-desemprego — valor máximo da parcela',
      descricao: 'Valor invariável do benefício para salário médio acima do limite da segunda faixa.',
      tipo: 'valor_monetario',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Lei nº 7.998/1990, art. 4º, § 2º (red. Lei nº 13.134/2015)
    //
    //   "I - para a primeira solicitação:
    //     a) 4 (quatro) parcelas, se o trabalhador comprovar vínculo [...] de,
    //        no mínimo, 12 (doze) meses e, no máximo, 23 (vinte e três) meses [...]
    //     b) 5 (cinco) parcelas, [...] de, no mínimo, 24 (vinte e quatro) meses;
    //    II - para a segunda solicitação:
    //     a) 3 (três) parcelas, [...] no mínimo, 9 (nove) meses e, no máximo, 11 [...]
    //    III - a partir da terceira solicitação: [...] no mínimo, 6 (seis) meses [...]"
    //
    // Os limites de 12 e 24 meses para 4 e 5 parcelas repetem-se nos três
    // incisos; o que muda entre eles é só o piso de acesso. Registrar assim —
    // três pisos e dois degraus — reproduz a tabela inteira sem duplicar número.
    // -----------------------------------------------------------------------
    {
      id: 'sd-meses-minimos-1a-2015',
      parametroId: 'seguro-desemprego-meses-minimos-1a',
      fonteId: 'lei-7998-1990-art-4',
      inicio: '2015-06-17',
      fim: null,
      valor: { tipo: 'inteiro', valor: 12 },
      observacao:
        'Vigência a partir da publicação da Lei nº 13.134, de 16 de junho de 2015, que deu ao art. 4º a redação atual.',
    },
    {
      id: 'sd-meses-minimos-2a-2015',
      parametroId: 'seguro-desemprego-meses-minimos-2a',
      fonteId: 'lei-7998-1990-art-4',
      inicio: '2015-06-17',
      fim: null,
      valor: { tipo: 'inteiro', valor: 9 },
    },
    {
      id: 'sd-meses-minimos-3a-2015',
      parametroId: 'seguro-desemprego-meses-minimos-3a',
      fonteId: 'lei-7998-1990-art-4',
      inicio: '2015-06-17',
      fim: null,
      valor: { tipo: 'inteiro', valor: 6 },
    },
    {
      id: 'sd-meses-4-parcelas-2015',
      parametroId: 'seguro-desemprego-meses-para-4-parcelas',
      fonteId: 'lei-7998-1990-art-4',
      inicio: '2015-06-17',
      fim: null,
      valor: { tipo: 'inteiro', valor: 12 },
    },
    {
      id: 'sd-meses-5-parcelas-2015',
      parametroId: 'seguro-desemprego-meses-para-5-parcelas',
      fonteId: 'lei-7998-1990-art-4',
      inicio: '2015-06-17',
      fim: null,
      valor: { tipo: 'inteiro', valor: 24 },
    },

    // -----------------------------------------------------------------------
    // Tabela anual do MTE — vigente a partir de 11/01/2026
    //
    //   "Até R$ 2.222,17 – Multiplica-se o salário médio por 0,8
    //    De R$ 2.222,18 até R$ 3.703,99 – O que exceder a R$ 2.222,17
    //      multiplica-se por 0,5 e soma-se com R$ 1.777,74
    //    Acima de R$ 3.703,99 – O valor será invariável de R$ 2.518,65"
    //
    // Os fatores 0,8 e 0,5 estão no art. 5º da lei e não mudam com o reajuste;
    // ainda assim vivem aqui, com a mesma vigência dos limites, porque separá-los
    // faria a memória de cálculo citar duas datas para uma conta só.
    //
    // A parcela de R$ 1.777,74 é o benefício apurado sobre o limite da primeira
    // faixa (0,8 × R$ 2.222,17 = R$ 1.777,736). Está registrada como a fonte a
    // publica, e não recalculada — regra F-2: a norma decide o arredondamento,
    // não nós.
    // -----------------------------------------------------------------------
    {
      id: 'sd-faixa-1-limite-2026',
      parametroId: 'seguro-desemprego-faixa-1-limite',
      fonteId: 'mte-tabela-seguro-desemprego-2026',
      inicio: '2026-01-11',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 222_217 },
      observacao:
        'Reajuste pelo INPC acumulado de 3,90% em 2025, na forma da Resolução CODEFAT nº 957/2022. Valores lidos no portal do MTE em 01/08/2026; a portaria que os formaliza não foi localizada — ver a nota em MTE_TABELA_SEGURO_DESEMPREGO.',
    },
    {
      id: 'sd-faixa-2-limite-2026',
      parametroId: 'seguro-desemprego-faixa-2-limite',
      fonteId: 'mte-tabela-seguro-desemprego-2026',
      inicio: '2026-01-11',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 370_399 },
    },
    {
      id: 'sd-faixa-1-fator-2026',
      parametroId: 'seguro-desemprego-faixa-1-fator',
      fonteId: 'mte-tabela-seguro-desemprego-2026',
      inicio: '2026-01-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 8_000 },
      observacao: 'O fator 0,8 (oito décimos) está no art. 5º, I, da Lei nº 7.998/1990.',
    },
    {
      id: 'sd-faixa-2-fator-2026',
      parametroId: 'seguro-desemprego-faixa-2-fator',
      fonteId: 'mte-tabela-seguro-desemprego-2026',
      inicio: '2026-01-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 5_000 },
      observacao: 'O fator 0,5 (cinco décimos) está no art. 5º, II, da Lei nº 7.998/1990.',
    },
    {
      id: 'sd-parcela-somar-2026',
      parametroId: 'seguro-desemprego-parcela-somar',
      fonteId: 'mte-tabela-seguro-desemprego-2026',
      inicio: '2026-01-11',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 177_774 },
    },
    {
      id: 'sd-teto-2026',
      parametroId: 'seguro-desemprego-teto',
      fonteId: 'mte-tabela-seguro-desemprego-2026',
      inicio: '2026-01-11',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 251_865 },
    },
  ],
}
