/**
 * Come-cotas — CALC-098.
 *
 * Lote 4 da expansão do catálogo. Transcrição literal do dispositivo em
 * `fontes.ts`, junto da fonte.
 *
 * **Os fundos de curto prazo** (carteira com prazo médio de até 365 dias) têm
 * as três alíquotas próprias abaixo: 20% no come-cotas (Lei nº 14.754/2023, art.
 * 17, § 1º, II) e 22,5% ou 20% no resgate, conforme a aplicação tenha até seis
 * meses ou mais (Lei nº 11.053/2004, art. 6º, § 2º).
 *
 * **Na regra geral, um parâmetro só, e é de propósito.** A alíquota da tributação periódica é o
 * que a Lei nº 14.754/2023 acrescentou; a alíquota FINAL continua sendo a da
 * tabela regressiva da Lei nº 11.033/2004, que já está cadastrada em
 * `renda-fixa.ts` — e é ela que o come-cotas antecipa. Duplicar a tabela aqui
 * criaria duas fontes para o mesmo número, que é exatamente o defeito que
 * `ADR-001` existe para impedir.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_11053_ART_6, LEI_14754_ART_17 } from './fontes'

export const COME_COTAS: ConjuntoDeParametros = {
  fontes: [LEI_14754_ART_17, LEI_11053_ART_6],

  parametros: [
    {
      id: 'come-cotas-aliquota-periodica',
      nome: 'Come-cotas — alíquota da tributação periódica',
      descricao:
        'Alíquota retida no último dia útil de maio e de novembro sobre o rendimento ainda não tributado, nos fundos de regra geral.',
      tipo: 'percentual',
    },
    {
      id: 'come-cotas-curto-prazo-aliquota-periodica',
      nome: 'Come-cotas — alíquota periódica dos fundos de curto prazo',
      descricao:
        'Alíquota retida no último dia útil de maio e de novembro nos fundos cuja carteira tem prazo médio de até 365 dias.',
      tipo: 'percentual',
    },
    {
      id: 'ir-fundo-curto-prazo-ate-seis-meses',
      nome: 'IR no resgate — fundo de curto prazo, aplicação de até seis meses',
      descricao: 'Alíquota final do imposto de renda no resgate, em aplicações com prazo de até seis meses.',
      tipo: 'percentual',
    },
    {
      id: 'ir-fundo-curto-prazo-acima-seis-meses',
      nome: 'IR no resgate — fundo de curto prazo, aplicação de mais de seis meses',
      descricao: 'Alíquota final do imposto de renda no resgate, em aplicações com prazo acima de seis meses.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    {
      id: 'come-cotas-curto-prazo-periodica-2024',
      parametroId: 'come-cotas-curto-prazo-aliquota-periodica',
      fonteId: 'lei-14754-2023-art-17',
      inicio: '2024-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
      observacao: 'Art. 17, § 1º, II, "a", da Lei nº 14.754/2023.',
    },
    {
      id: 'ir-fundo-curto-prazo-ate-seis-meses-2005',
      parametroId: 'ir-fundo-curto-prazo-ate-seis-meses',
      fonteId: 'lei-11053-2004-art-6',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_250 },
      observacao: 'Art. 6º, § 2º, I: "em aplicações com prazo de até 6 (seis) meses".',
    },
    {
      id: 'ir-fundo-curto-prazo-acima-seis-meses-2005',
      parametroId: 'ir-fundo-curto-prazo-acima-seis-meses',
      fonteId: 'lei-11053-2004-art-6',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
      observacao: 'Art. 6º, § 2º, II: "em aplicações com prazo acima de 6 (seis) meses".',
    },
    {
      id: 'come-cotas-periodica-2024',
      parametroId: 'come-cotas-aliquota-periodica',
      fonteId: 'lei-14754-2023-art-17',
      inicio: '2024-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_500 },
      observacao:
        'Regra geral do art. 17, § 1º, I, "a". Os fundos de prazo médio curto (art. 6º da Lei nº 11.053/2004) têm alíquota periódica e tabela de resgate próprias, cadastradas acima. No resgate, a diferença até a alíquota da tabela regressiva é cobrada como complemento.',
    },
  ],
}
