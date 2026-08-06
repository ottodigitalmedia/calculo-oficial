/**
 * Os feriados nacionais — CALC-072.
 *
 * **O senso comum erra aqui, e a maioria das calculadoras de dias úteis erra
 * junto.** Carnaval, Sexta-feira Santa e Corpus Christi NÃO são feriados
 * nacionais. A Lei nº 9.093/1995 é explícita:
 *
 *   Art. 1º — são feriados CIVIS os declarados em lei federal, a data magna do
 *   Estado (lei estadual) e o centenário do Município (lei municipal).
 *
 *   Art. 2º — são feriados RELIGIOSOS os dias de guarda declarados em lei
 *   MUNICIPAL, em número não superior a quatro, "neste incluída a Sexta-Feira
 *   da Paixão".
 *
 * Carnaval e Corpus Christi são ponto facultativo — o art. 3º da Lei nº
 * 662/1949 fala deles como decretados por Estados, DF ou Municípios.
 *
 * Por isso só os nove abaixo são cadastrados. Os móveis e os locais entram por
 * escolha do usuário na tela, declarados como o que são.
 *
 * POR QUE CADA UM TEM VIGÊNCIA PRÓPRIA
 *
 * Três entraram depois, e contar dias úteis de um ano anterior com eles dentro
 * daria um número errado:
 *
 *   21 de abril e 2 de novembro — Lei nº 10.607/2002, que deu nova redação ao
 *   art. 1º da Lei nº 662/1949. Publicada no DOU de 20/12/2002.
 *   20 de novembro — Lei nº 14.759/2023, publicada no DOU de 22/12/2023.
 *   12 de outubro — Lei nº 6.802/1980, publicada no DOU de 1º/07/1980.
 *
 * Os quatro da redação original de 1949 têm vigência declarada a partir da
 * publicação daquela lei, em 13/04/1949.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_662_ART_1, LEI_6802_ART_1, LEI_14759_ART_1 } from './fontes'

/** Data de publicação de cada lei, que é onde a vigência de cada feriado começa. */
const PUBLICACAO_LEI_662 = '1949-04-13'
const PUBLICACAO_LEI_6802 = '1980-07-01'
const PUBLICACAO_LEI_10607 = '2002-12-20'
const PUBLICACAO_LEI_14759 = '2023-12-22'

export const FERIADOS: ConjuntoDeParametros = {
  fontes: [LEI_662_ART_1, LEI_6802_ART_1, LEI_14759_ART_1],

  parametros: [
    { id: 'feriado-confraternizacao', nome: 'Confraternização Universal', descricao: '1º de janeiro — feriado nacional.', tipo: 'data_fixa' },
    { id: 'feriado-tiradentes', nome: 'Tiradentes', descricao: '21 de abril — feriado nacional desde a Lei nº 10.607/2002.', tipo: 'data_fixa' },
    { id: 'feriado-trabalho', nome: 'Dia do Trabalho', descricao: '1º de maio — feriado nacional.', tipo: 'data_fixa' },
    { id: 'feriado-independencia', nome: 'Independência', descricao: '7 de setembro — feriado nacional.', tipo: 'data_fixa' },
    { id: 'feriado-aparecida', nome: 'Nossa Senhora Aparecida', descricao: '12 de outubro — feriado nacional desde a Lei nº 6.802/1980.', tipo: 'data_fixa' },
    { id: 'feriado-finados', nome: 'Finados', descricao: '2 de novembro — feriado nacional desde a Lei nº 10.607/2002.', tipo: 'data_fixa' },
    { id: 'feriado-republica', nome: 'Proclamação da República', descricao: '15 de novembro — feriado nacional.', tipo: 'data_fixa' },
    { id: 'feriado-consciencia-negra', nome: 'Dia Nacional de Zumbi e da Consciência Negra', descricao: '20 de novembro — feriado nacional desde a Lei nº 14.759/2023.', tipo: 'data_fixa' },
    { id: 'feriado-natal', nome: 'Natal', descricao: '25 de dezembro — feriado nacional.', tipo: 'data_fixa' },
  ],

  vigencias: [
    // ---- Redação original da Lei nº 662/1949 --------------------------------
    { id: 'feriado-confraternizacao-1949', parametroId: 'feriado-confraternizacao', fonteId: 'lei-662-1949-art-1',
      inicio: PUBLICACAO_LEI_662, fim: null, valor: { tipo: 'data_fixa', mes: 1, dia: 1 } },
    { id: 'feriado-trabalho-1949', parametroId: 'feriado-trabalho', fonteId: 'lei-662-1949-art-1',
      inicio: PUBLICACAO_LEI_662, fim: null, valor: { tipo: 'data_fixa', mes: 5, dia: 1 } },
    { id: 'feriado-independencia-1949', parametroId: 'feriado-independencia', fonteId: 'lei-662-1949-art-1',
      inicio: PUBLICACAO_LEI_662, fim: null, valor: { tipo: 'data_fixa', mes: 9, dia: 7 } },
    { id: 'feriado-republica-1949', parametroId: 'feriado-republica', fonteId: 'lei-662-1949-art-1',
      inicio: PUBLICACAO_LEI_662, fim: null, valor: { tipo: 'data_fixa', mes: 11, dia: 15 } },
    { id: 'feriado-natal-1949', parametroId: 'feriado-natal', fonteId: 'lei-662-1949-art-1',
      inicio: PUBLICACAO_LEI_662, fim: null, valor: { tipo: 'data_fixa', mes: 12, dia: 25 } },

    // ---- Lei nº 6.802/1980 --------------------------------------------------
    { id: 'feriado-aparecida-1980', parametroId: 'feriado-aparecida', fonteId: 'lei-6802-1980-art-1',
      inicio: PUBLICACAO_LEI_6802, fim: null, valor: { tipo: 'data_fixa', mes: 10, dia: 12 } },

    // ---- Lei nº 10.607/2002, que reescreveu o art. 1º da Lei nº 662 ---------
    { id: 'feriado-tiradentes-2002', parametroId: 'feriado-tiradentes', fonteId: 'lei-662-1949-art-1',
      inicio: PUBLICACAO_LEI_10607, fim: null, valor: { tipo: 'data_fixa', mes: 4, dia: 21 },
      observacao: 'Incluído na lista de feriados nacionais pela nova redação do art. 1º, dada pela Lei nº 10.607/2002.' },
    { id: 'feriado-finados-2002', parametroId: 'feriado-finados', fonteId: 'lei-662-1949-art-1',
      inicio: PUBLICACAO_LEI_10607, fim: null, valor: { tipo: 'data_fixa', mes: 11, dia: 2 },
      observacao: 'Incluído na lista de feriados nacionais pela nova redação do art. 1º, dada pela Lei nº 10.607/2002.' },

    // ---- Lei nº 14.759/2023 -------------------------------------------------
    { id: 'feriado-consciencia-negra-2023', parametroId: 'feriado-consciencia-negra', fonteId: 'lei-14759-2023-art-1',
      inicio: PUBLICACAO_LEI_14759, fim: null, valor: { tipo: 'data_fixa', mes: 11, dia: 20 } },
  ],
}

/** Os ids na ordem do calendário — o motor percorre esta lista. */
export const IDS_DOS_FERIADOS = FERIADOS.parametros.map((p) => p.id)
