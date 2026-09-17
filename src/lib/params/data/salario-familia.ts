/**
 * Salário-família — cota por filho e limite de remuneração.
 *
 * Lote 2 da expansão do catálogo — CALC-088. Os dois valores saem do art. 4º
 * da portaria interministerial anual que reajusta os benefícios, a mesma que
 * `inss.ts` usa para a tabela de contribuição — lida no mesmo PDF.
 *
 * Vigência por exercício: a portaria diz "a partir de 1º de janeiro".
 */

import type { ConjuntoDeParametros } from '../tipos'
import { PORTARIA_MPS_MF_13_2026_ART_4, PORTARIA_MPS_MF_6_2025_ART_4 } from './fontes'

export const SALARIO_FAMILIA: ConjuntoDeParametros = {
  fontes: [PORTARIA_MPS_MF_6_2025_ART_4, PORTARIA_MPS_MF_13_2026_ART_4],

  parametros: [
    {
      id: 'salario-familia-cota',
      nome: 'Salário-família — valor da cota',
      descricao: 'Valor mensal pago por filho ou equiparado até 14 anos, ou inválido de qualquer idade.',
      tipo: 'valor_monetario',
    },
    {
      id: 'salario-familia-limite',
      nome: 'Salário-família — remuneração máxima',
      descricao: 'Remuneração mensal acima da qual o segurado não recebe a cota.',
      tipo: 'valor_monetario',
    },
  ],

  vigencias: [
    {
      id: 'salario-familia-cota-2025',
      parametroId: 'salario-familia-cota',
      fonteId: 'portaria-mps-mf-6-2025-art-4',
      inicio: '2025-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'valor_monetario', centavos: 6_500 },
    },
    {
      id: 'salario-familia-cota-2026',
      parametroId: 'salario-familia-cota',
      fonteId: 'portaria-mps-mf-13-2026-art-4',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 6_754 },
    },
    {
      id: 'salario-familia-limite-2025',
      parametroId: 'salario-familia-limite',
      fonteId: 'portaria-mps-mf-6-2025-art-4',
      inicio: '2025-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'valor_monetario', centavos: 190_604 },
      observacao:
        'O 13º salário e o adicional de férias não entram na remuneração considerada (art. 4º, § 3º).',
    },
    {
      id: 'salario-familia-limite-2026',
      parametroId: 'salario-familia-limite',
      fonteId: 'portaria-mps-mf-13-2026-art-4',
      inicio: '2026-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 198_038 },
      observacao:
        'O 13º salário e o adicional de férias não entram na remuneração considerada (art. 4º, § 3º).',
    },
  ],
}
