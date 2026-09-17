/**
 * Come-cotas — CALC-098.
 *
 * Lote 4 da expansão do catálogo. Transcrição literal do dispositivo em
 * `fontes.ts`, junto da fonte.
 *
 * **Um parâmetro só, e é de propósito.** A alíquota da tributação periódica é o
 * que a Lei nº 14.754/2023 acrescentou; a alíquota FINAL continua sendo a da
 * tabela regressiva da Lei nº 11.033/2004, que já está cadastrada em
 * `renda-fixa.ts` — e é ela que o come-cotas antecipa. Duplicar a tabela aqui
 * criaria duas fontes para o mesmo número, que é exatamente o defeito que
 * `ADR-001` existe para impedir.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_14754_ART_17 } from './fontes'

export const COME_COTAS: ConjuntoDeParametros = {
  fontes: [LEI_14754_ART_17],

  parametros: [
    {
      id: 'come-cotas-aliquota-periodica',
      nome: 'Come-cotas — alíquota da tributação periódica',
      descricao:
        'Alíquota retida no último dia útil de maio e de novembro sobre o rendimento ainda não tributado, nos fundos de regra geral.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    {
      id: 'come-cotas-periodica-2024',
      parametroId: 'come-cotas-aliquota-periodica',
      fonteId: 'lei-14754-2023-art-17',
      inicio: '2024-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_500 },
      observacao:
        'Regra geral do art. 17, § 1º, I, "a". Os fundos de prazo médio curto (art. 6º da Lei nº 11.053/2004) têm alíquota periódica de 20% e tabela própria no resgate — caso que a calculadora declara e não cobre. No resgate, a diferença até a alíquota da tabela regressiva é cobrada como complemento.',
    },
  ],
}
