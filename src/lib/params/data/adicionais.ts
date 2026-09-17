/**
 * Adicionais de insalubridade, periculosidade e trabalho noturno rural.
 *
 * Lote 1 da expansão do catálogo — CALC-077, CALC-078 e CALC-079. Transcrição
 * literal de cada dispositivo em `fontes.ts`, junto da fonte.
 *
 * **Vigência a partir da publicação, e não por exercício** — mesma razão de
 * `trabalhista.ts`: estes percentuais estão no corpo da lei e só mudam por
 * alteração legislativa. A insalubridade depende também do salário mínimo, que
 * muda todo ano; a cobertura combinada (`C-1`) cuida disso sozinha, pela
 * interseção com `salario-minimo`.
 *
 * Percentuais em basis points (`ADR-004` A-2).
 */

import type { ConjuntoDeParametros } from '../tipos'
import { CLT_ART_192, CLT_ART_193, LEI_5889_ART_7 } from './fontes'

export const ADICIONAIS: ConjuntoDeParametros = {
  fontes: [CLT_ART_192, CLT_ART_193, LEI_5889_ART_7],

  parametros: [
    {
      id: 'insalubridade-grau-maximo',
      nome: 'Adicional de insalubridade — grau máximo',
      descricao: 'Percentual sobre o salário mínimo devido na insalubridade classificada no grau máximo.',
      tipo: 'percentual',
    },
    {
      id: 'insalubridade-grau-medio',
      nome: 'Adicional de insalubridade — grau médio',
      descricao: 'Percentual sobre o salário mínimo devido na insalubridade classificada no grau médio.',
      tipo: 'percentual',
    },
    {
      id: 'insalubridade-grau-minimo',
      nome: 'Adicional de insalubridade — grau mínimo',
      descricao: 'Percentual sobre o salário mínimo devido na insalubridade classificada no grau mínimo.',
      tipo: 'percentual',
    },
    {
      id: 'periculosidade-adicional',
      nome: 'Adicional de periculosidade',
      descricao:
        'Percentual sobre o salário sem os acréscimos de gratificações, prêmios ou participações nos lucros.',
      tipo: 'percentual',
    },
    {
      id: 'adicional-noturno-rural',
      nome: 'Adicional noturno do trabalhador rural',
      descricao: 'Acréscimo sobre a remuneração normal do trabalho noturno na lavoura e na pecuária.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // CLT, art. 192 (red. Lei nº 6.514/1977) — 40%, 20% e 10% do salário
    // mínimo, conforme o grau. DOU de 23/12/1977, em vigor na publicação.
    // -----------------------------------------------------------------------
    {
      id: 'insalubridade-maximo-1977',
      parametroId: 'insalubridade-grau-maximo',
      fonteId: 'clt-art-192',
      inicio: '1977-12-23',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 4_000 },
      observacao:
        'A norma diz "salário-mínimo da região"; o salário mínimo é nacional desde a Constituição de 1988 (art. 7º, IV). Convenção coletiva ou contrato podem fixar base mais favorável, e por isso a calculadora aceita outra base informada.',
    },
    {
      id: 'insalubridade-medio-1977',
      parametroId: 'insalubridade-grau-medio',
      fonteId: 'clt-art-192',
      inicio: '1977-12-23',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
    },
    {
      id: 'insalubridade-minimo-1977',
      parametroId: 'insalubridade-grau-minimo',
      fonteId: 'clt-art-192',
      inicio: '1977-12-23',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_000 },
    },

    // -----------------------------------------------------------------------
    // CLT, art. 193, § 1º (incl. Lei nº 6.514/1977) — 30% sobre o salário sem
    // gratificações, prêmios ou PLR.
    // -----------------------------------------------------------------------
    {
      id: 'periculosidade-1977',
      parametroId: 'periculosidade-adicional',
      fonteId: 'clt-art-193',
      inicio: '1977-12-23',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 3_000 },
      observacao:
        'A base é o salário básico (Súmula 191, I, do TST). O eletricitário contratado antes da Lei nº 12.740/2012 tem base na totalidade das parcelas salariais (itens II e III) — caso que a calculadora declara e não resolve.',
    },

    // -----------------------------------------------------------------------
    // Lei nº 5.889/1973, art. 7º, parágrafo único — 25% sobre a remuneração
    // normal. DOU de 11/06/1973, em vigor na publicação (art. 21).
    // -----------------------------------------------------------------------
    {
      id: 'noturno-rural-1973',
      parametroId: 'adicional-noturno-rural',
      fonteId: 'lei-5889-1973-art-7',
      inicio: '1973-06-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_500 },
      observacao:
        'Noturno rural: das 21h às 5h na lavoura e das 20h às 4h na pecuária. A hora não é reduzida: a hora de 52min30s é regra do art. 73, § 1º, da CLT, e a lei rural não a reproduz.',
    },
  ],
}
