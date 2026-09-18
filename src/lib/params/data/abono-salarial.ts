/**
 * Abono salarial (PIS/Pasep) — CALC-118.
 *
 * Três números: a fração de 1/12 por mês trabalhado (Lei nº 7.998/1990, art.
 * 9º, § 2º), o salário mínimo da data do pagamento — que já é parâmetro do
 * sistema — e o limite de renda do ano-base, que desde a EC nº 135/2024 é
 * corrigido pelo INPC a cada ano (Constituição, art. 239, § 3º).
 *
 * **O limite é por ano de PAGAMENTO**, e fecha no ano: o de 2027 depende do
 * INPC de 2025 e da publicação do Ministério. Sem ele, 2027 bloqueia
 * (`RN-003`) — que é o certo.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { CF_ART_239_P3, LEI_7998_ART_9, MTE_ABONO_2026 } from './fontes'

export const ABONO_SALARIAL: ConjuntoDeParametros = {
  fontes: [LEI_7998_ART_9, MTE_ABONO_2026, CF_ART_239_P3],

  parametros: [
    {
      id: 'abono-limite-remuneracao-media',
      nome: 'Abono salarial — limite de remuneração média',
      descricao: 'Remuneração média mensal do ano-base até a qual o abono é devido, pelo ano do pagamento.',
      tipo: 'valor_monetario',
    },
    {
      id: 'abono-fracao-por-mes',
      nome: 'Abono salarial — fração por mês trabalhado',
      descricao: 'Fração do salário mínimo da data do pagamento por mês trabalhado no ano-base.',
      tipo: 'fracao',
    },
  ],

  vigencias: [
    {
      id: 'abono-limite-pagamento-2026',
      parametroId: 'abono-limite-remuneracao-media',
      fonteId: 'mte-abono-salarial-2026',
      inicio: '2026-01-01',
      fim: '2026-12-31',
      valor: { tipo: 'valor_monetario', centavos: 276_600 },
      observacao:
        'Pagamento em 2026, ano-base 2024: dois salários mínimos do ano-base de 2023 corrigidos pelo INPC de 2024, como manda o art. 239, § 3º, na redação da EC nº 135/2024. O número é o publicado pelo Ministério do Trabalho.',
    },
    {
      id: 'abono-fracao-2016',
      parametroId: 'abono-fracao-por-mes',
      fonteId: 'lei-7998-1990-art-9',
      inicio: '2016-01-01',
      fim: null,
      valor: { tipo: 'fracao', numerador: 1, denominador: 12 },
      observacao:
        'Lei nº 13.134/2015, com efeitos financeiros a partir do exercício de 2016 (ano-base 2015). Antes, o abono era de um salário mínimo inteiro.',
    },
  ],
}
