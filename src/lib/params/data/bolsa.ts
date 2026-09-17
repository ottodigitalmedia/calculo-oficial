/**
 * Imposto sobre ganhos em bolsa — CALC-093.
 *
 * Lote 3 da expansão do catálogo. Transcrição literal de cada dispositivo em
 * `fontes.ts`, junto da fonte.
 *
 * **Vigência a partir da produção de efeitos, e não da publicação.** A Lei nº
 * 11.033/2004 é de 21/12/2004, mas o art. 23, I, adia os efeitos dos arts. 1º a
 * 5º para 1º/01/2005 — e é essa a data que decide qual alíquota vale para um
 * ganho apurado. A Lei nº 9.959/2000 produz efeitos desde 1º/01/2000 (art. 12).
 *
 * **A retenção na fonte da operação comum não cabe em basis points.** 0,005%
 * seriam 0,05 bp, e `ADR-004` A-2 exige inteiro. Entra como fração — 5 por cem
 * mil —, que é como a norma a expressa (`ADR-007` F-2).
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_9430_ART_68, LEI_9959_ART_8, LEI_11033_ART_2, LEI_11033_ART_3_I } from './fontes'

export const BOLSA: ConjuntoDeParametros = {
  fontes: [LEI_11033_ART_2, LEI_11033_ART_3_I, LEI_9959_ART_8, LEI_9430_ART_68],

  parametros: [
    {
      id: 'bolsa-aliquota-comum',
      nome: 'Imposto sobre ganho líquido em bolsa — operação comum',
      descricao: 'Alíquota sobre o ganho líquido mensal nas operações que não são day trade.',
      tipo: 'percentual',
    },
    {
      id: 'bolsa-aliquota-day-trade',
      nome: 'Imposto sobre ganho líquido em bolsa — day trade',
      descricao: 'Alíquota sobre o ganho líquido mensal nas operações iniciadas e encerradas no mesmo dia.',
      tipo: 'percentual',
    },
    {
      id: 'bolsa-isencao-vendas-mes',
      nome: 'Isenção das vendas de ações no mês',
      descricao:
        'Valor total de alienações no mercado à vista de ações, em cada mês, até o qual o ganho da pessoa física é isento.',
      tipo: 'valor_monetario',
    },
    {
      id: 'bolsa-irrf-comum',
      nome: 'Retenção na fonte — operação comum',
      descricao: 'Fração retida na fonte sobre o valor da alienação nas operações que não são day trade.',
      tipo: 'fracao',
    },
    {
      id: 'bolsa-irrf-day-trade',
      nome: 'Retenção na fonte — day trade',
      descricao: 'Alíquota retida na fonte sobre o resultado positivo das operações de day trade.',
      tipo: 'percentual',
    },
    {
      id: 'bolsa-irrf-dispensa',
      nome: 'Dispensa da retenção na fonte em bolsa',
      descricao: 'Valor de retenção mensal até o qual a instituição não retém o imposto na fonte.',
      tipo: 'valor_monetario',
    },
    {
      id: 'darf-valor-minimo',
      nome: 'Valor mínimo do DARF',
      descricao: 'Abaixo dele, o imposto do período é somado ao dos períodos seguintes, no mesmo código.',
      tipo: 'valor_monetario',
    },
  ],

  vigencias: [
    {
      id: 'bolsa-comum-2005',
      parametroId: 'bolsa-aliquota-comum',
      fonteId: 'lei-11033-2004-art-2',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_500 },
      observacao:
        'A MP nº 1.303/2025 proporia alíquota única e caducou; o texto compilado do Planalto marca as remissões a ela como de vigência encerrada.',
    },
    {
      id: 'bolsa-day-trade-2005',
      parametroId: 'bolsa-aliquota-day-trade',
      fonteId: 'lei-11033-2004-art-2',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
    },
    {
      id: 'bolsa-isencao-2005',
      parametroId: 'bolsa-isencao-vendas-mes',
      fonteId: 'lei-11033-2004-art-3-i',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 2_000_000 },
      observacao:
        'O limite é do valor VENDIDO no mês, e não do lucro. Vale para o mercado à vista de ações e não alcança day trade, fundos imobiliários nem mercados de opções, futuros e termo.',
    },
    {
      id: 'bolsa-irrf-comum-2005',
      parametroId: 'bolsa-irrf-comum',
      fonteId: 'lei-11033-2004-art-2',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'fracao', numerador: 5, denominador: 100_000 },
      observacao:
        '0,005% sobre o valor da alienação — a retenção que existe para informar a Receita de que houve operação. É deduzida do imposto devido no mês.',
    },
    {
      id: 'bolsa-irrf-day-trade-2000',
      parametroId: 'bolsa-irrf-day-trade',
      fonteId: 'lei-9959-2000-art-8',
      inicio: '2000-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 100 },
      observacao: 'Retida sobre o resultado positivo do dia, pela instituição intermediadora.',
    },
    {
      id: 'bolsa-irrf-dispensa-2005',
      parametroId: 'bolsa-irrf-dispensa',
      fonteId: 'lei-11033-2004-art-2',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 100 },
      observacao:
        'Art. 2º, § 4º: dispensada a retenção de valor igual ou inferior a R$ 1,00. O § 5º manda somar as operações do mês antes de aplicar o limite — é por isso que a conta é mensal, e não por operação.',
    },
    {
      id: 'darf-minimo-1997',
      parametroId: 'darf-valor-minimo',
      fonteId: 'lei-9430-1996-art-68',
      inicio: '1997-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 1_000 },
      observacao:
        'A Lei nº 9.430/1996 produz efeitos financeiros a partir de 1º/01/1997 (art. 87). Abaixo do piso, o imposto não deixa de existir: ele se acumula para o período seguinte, no mesmo código de receita.',
    },
  ],
}
