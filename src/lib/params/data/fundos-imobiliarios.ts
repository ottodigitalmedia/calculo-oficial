/**
 * Imposto em fundos imobiliários — CALC-096.
 *
 * Lote 4 da expansão do catálogo. Transcrição literal de cada dispositivo em
 * `fontes.ts`, junto da fonte.
 *
 * **Duas datas diferentes, de propósito.** As alíquotas de 20% vêm da Lei nº
 * 9.779/1999 e valem desde a publicação dela; as condições da isenção dos
 * rendimentos entram com a redação da Lei nº 14.754/2023, que produz efeitos
 * desde 1º/01/2024. Uma calculadora que use as duas coisas só responde de 2024
 * em diante — e é isso que `RN-003` faz aparecer, em vez de misturar redações.
 *
 * **Por que a cobertura das condições começa em 2024, e não em 2005.** O número
 * mínimo de cotistas mudou (50 → 100), o inciso das pessoas ligadas é novo, e o
 * texto compilado traz as redações sobrepostas com uma medida provisória de
 * vigência encerrada no meio. Cadastrar as redações antigas exigiria conferir
 * cada data de produção de efeitos; enquanto isso não for feito, a cobertura
 * declarada é a do texto que está valendo.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_8668_ART_17_18, LEI_11033_ART_3_III } from './fontes'

export const FUNDOS_IMOBILIARIOS: ConjuntoDeParametros = {
  fontes: [LEI_8668_ART_17_18, LEI_11033_ART_3_III],

  parametros: [
    {
      id: 'fii-aliquota-rendimentos',
      nome: 'Fundo imobiliário — imposto sobre os rendimentos distribuídos',
      descricao: 'Alíquota retida na fonte sobre os rendimentos distribuídos, quando não cabe a isenção.',
      tipo: 'percentual',
    },
    {
      id: 'fii-aliquota-ganho',
      nome: 'Fundo imobiliário — imposto sobre o ganho na venda de cotas',
      descricao: 'Alíquota sobre o ganho apurado na alienação ou no resgate de cotas.',
      tipo: 'percentual',
    },
    {
      id: 'fii-isencao-minimo-cotistas',
      nome: 'Isenção dos rendimentos — mínimo de cotistas do fundo',
      descricao: 'Número mínimo de cotistas que o fundo precisa ter para que a isenção seja concedida.',
      tipo: 'inteiro',
    },
    {
      id: 'fii-isencao-participacao-maxima',
      nome: 'Isenção dos rendimentos — participação máxima do cotista',
      descricao:
        'Percentual de cotas, ou de rendimentos, a partir do qual o cotista pessoa física perde a isenção.',
      tipo: 'percentual',
    },
    {
      id: 'fii-isencao-participacao-ligados',
      nome: 'Isenção dos rendimentos — participação máxima do conjunto de cotistas ligados',
      descricao:
        'Percentual de cotas, ou de rendimentos, a partir do qual o conjunto de pessoas físicas ligadas perde a isenção.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    {
      id: 'fii-rendimentos-1999',
      parametroId: 'fii-aliquota-rendimentos',
      fonteId: 'lei-8668-1993-art-17-18',
      inicio: '1999-01-20',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
      observacao:
        'Retida na fonte pelo administrador do fundo. Para a pessoa física, quando não há isenção, a tributação é exclusiva (art. 19, II).',
    },
    {
      id: 'fii-ganho-1999',
      parametroId: 'fii-aliquota-ganho',
      fonteId: 'lei-8668-1993-art-17-18',
      inicio: '1999-01-20',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
      observacao:
        'A isenção mensal das vendas de até certo valor é do mercado à vista de AÇÕES (Lei nº 11.033/2004, art. 3º, I) e não alcança cotas de fundo imobiliário: qualquer ganho é tributado.',
    },
    {
      id: 'fii-isencao-cotistas-2024',
      parametroId: 'fii-isencao-minimo-cotistas',
      fonteId: 'lei-11033-2004-art-3-iii',
      inicio: '2024-01-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 100 },
      observacao:
        'Redação da Lei nº 14.754/2023, com efeitos a partir de 1º/01/2024. A exigência anterior era de 50 cotistas, e a MP nº 1.184/2024, que pedia 500, está marcada como de vigência encerrada.',
    },
    {
      id: 'fii-isencao-participacao-2024',
      parametroId: 'fii-isencao-participacao-maxima',
      fonteId: 'lei-11033-2004-art-3-iii',
      inicio: '2024-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_000 },
      observacao:
        'O cotista que detém essa fatia das cotas — ou que recebe mais que essa fatia dos rendimentos do fundo — não tem a isenção, ainda que o fundo cumpra as demais condições.',
    },
    {
      id: 'fii-isencao-ligados-2024',
      parametroId: 'fii-isencao-participacao-ligados',
      fonteId: 'lei-11033-2004-art-3-iii',
      inicio: '2024-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 3_000 },
      observacao: 'Inciso III, incluído pela Lei nº 14.754/2023: vale para o conjunto de pessoas físicas ligadas.',
    },
  ],
}
