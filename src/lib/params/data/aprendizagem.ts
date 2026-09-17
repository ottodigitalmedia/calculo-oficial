/**
 * Aprendiz e estagiário — CALC-083 e CALC-084.
 *
 * Os dois vínculos de formação do catálogo, no mesmo arquivo porque são
 * pesquisados juntos por quem está começando a trabalhar, e porque cada um tem
 * pouca coisa: o aprendiz, o salário mínimo HORÁRIO e o FGTS reduzido; o
 * estagiário, os dias de recesso.
 *
 * Transcrição literal de cada dispositivo em `fontes.ts`.
 */

import type { ConjuntoDeParametros } from '../tipos'
import {
  CLT_ART_432,
  DECRETO_12342_2024,
  DECRETO_12797_2025,
  LEI_11788_ART_13,
  LEI_8036_ART_15_P7,
} from './fontes'

export const APRENDIZAGEM: ConjuntoDeParametros = {
  fontes: [DECRETO_12342_2024, DECRETO_12797_2025, LEI_8036_ART_15_P7, LEI_11788_ART_13, CLT_ART_432],

  parametros: [
    {
      id: 'aprendiz-jornada-diaria',
      nome: 'Jornada diária máxima do aprendiz',
      descricao: 'Horas diárias que o aprendiz pode trabalhar, sem prorrogação nem compensação.',
      tipo: 'inteiro',
    },
    {
      id: 'aprendiz-jornada-diaria-estendida',
      nome: 'Jornada diária máxima do aprendiz com ensino fundamental completo',
      descricao:
        'Limite diário para o aprendiz que já completou o ensino fundamental, computadas as horas de aprendizagem teórica.',
      tipo: 'inteiro',
    },
    {
      id: 'salario-minimo-hora',
      nome: 'Salário mínimo — valor horário',
      descricao:
        'Valor da hora do salário mínimo, fixado no decreto anual. É o piso do aprendiz (CLT, art. 428, § 2º).',
      tipo: 'valor_monetario',
    },
    {
      id: 'fgts-aliquota-aprendiz',
      nome: 'Alíquota do FGTS no contrato de aprendizagem',
      descricao: 'Percentual reduzido do depósito mensal de FGTS para os contratos de aprendizagem.',
      tipo: 'percentual',
    },
    {
      id: 'estagio-recesso-dias',
      nome: 'Recesso do estagiário — dias por ano de estágio',
      descricao:
        'Dias de recesso assegurados a cada ano de estágio, concedidos proporcionalmente quando o estágio dura menos de um ano.',
      tipo: 'inteiro',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Salário mínimo horário — valor fixado pelo decreto, NÃO derivado do
    // mensal. Ver a nota em `DECRETO_12342_2024`.
    // -----------------------------------------------------------------------
    {
      id: 'salario-minimo-hora-2025',
      parametroId: 'salario-minimo-hora',
      fonteId: 'decreto-12342-2024',
      inicio: '2025-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'valor_monetario', centavos: 690 },
      observacao: 'Mensal de R$ 1.518,00 e diário de R$ 50,60 no mesmo decreto.',
    },
    {
      id: 'salario-minimo-hora-2026',
      parametroId: 'salario-minimo-hora',
      fonteId: 'decreto-12797-2025',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 737 },
      observacao: 'Mensal de R$ 1.621,00 no mesmo decreto.',
    },

    // -----------------------------------------------------------------------
    // Lei nº 8.036/1990, art. 15, § 7º (incl. Lei nº 10.097/2000) — 2%.
    // DOU de 20/12/2000, em vigor na publicação.
    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------
    // CLT, art. 432, caput e § 1º (red. Lei nº 10.097/2000) — seis horas, e
    // até oito para quem completou o ensino fundamental. DOU de 20/12/2000.
    // -----------------------------------------------------------------------
    {
      id: 'aprendiz-jornada-2000',
      parametroId: 'aprendiz-jornada-diaria',
      fonteId: 'clt-art-432',
      inicio: '2000-12-20',
      fim: null,
      valor: { tipo: 'inteiro', valor: 6 },
    },
    {
      id: 'aprendiz-jornada-estendida-2000',
      parametroId: 'aprendiz-jornada-diaria-estendida',
      fonteId: 'clt-art-432',
      inicio: '2000-12-20',
      fim: null,
      valor: { tipo: 'inteiro', valor: 8 },
      observacao: 'Só vale se as horas destinadas à aprendizagem teórica estiverem computadas nas oito.',
    },
    {
      id: 'fgts-aprendiz-2000',
      parametroId: 'fgts-aliquota-aprendiz',
      fonteId: 'lei-8036-1990-art-15-p7',
      inicio: '2000-12-20',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 200 },
    },

    // -----------------------------------------------------------------------
    // Lei nº 11.788/2008, art. 13 — 30 dias por ano, proporcional abaixo de
    // um ano. DOU de 26/09/2008, em vigor na publicação (art. 21).
    // -----------------------------------------------------------------------
    {
      id: 'estagio-recesso-2008',
      parametroId: 'estagio-recesso-dias',
      fonteId: 'lei-11788-2008-art-13',
      inicio: '2008-09-26',
      fim: null,
      valor: { tipo: 'inteiro', valor: 30 },
      observacao:
        'A lei não diz como arredondar a proporção de dias, nem manda indenizar recesso não gozado ao fim do estágio. A calculadora mostra a proporção exata e declara as duas lacunas, em vez de preenchê-las.',
    },
  ],
}
