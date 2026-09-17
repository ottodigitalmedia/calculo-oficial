/**
 * Saque-aniversário do FGTS — CALC-095.
 *
 * Lote 3 da expansão do catálogo. Transcrição literal do dispositivo em
 * `fontes.ts`, junto da fonte.
 *
 * **A tabela do Anexo SOMA uma parcela, não a deduz.** É a primeira tabela do
 * sistema com esse formato, e foi por ela que `Faixa` ganhou
 * `parcelaAdicionalCentavos` — ver a nota em `params/tipos.ts`. Guardar a
 * parcela adicional no campo de dedução, com sinal trocado, calcularia certo e
 * mentiria para quem auditasse o cadastro.
 *
 * Vigência a partir de 12/12/2019, data em que a Lei nº 13.932 foi publicada —
 * e em que estes dispositivos passaram a valer (art. 11, III).
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_8036_ART_20_D } from './fontes'

export const SAQUE_ANIVERSARIO: ConjuntoDeParametros = {
  fontes: [LEI_8036_ART_20_D],

  parametros: [
    {
      id: 'fgts-saque-aniversario-tabela',
      nome: 'Saque-aniversário do FGTS — tabela do Anexo',
      descricao:
        'Alíquota por faixa de saldo somado das contas vinculadas, com a parcela adicional correspondente.',
      tipo: 'tabela_faixas',
    },
  ],

  vigencias: [
    {
      id: 'fgts-saque-aniversario-2019',
      parametroId: 'fgts-saque-aniversario-tabela',
      fonteId: 'lei-8036-1990-art-20-d',
      inicio: '2019-12-12',
      fim: null,
      valor: {
        tipo: 'tabela_faixas',
        faixas: [
          { ordem: 1, limiteInferiorCentavos: 0, limiteSuperiorCentavos: 50_000, aliquotaBp: 5_000 },
          {
            ordem: 2,
            limiteInferiorCentavos: 50_001,
            limiteSuperiorCentavos: 100_000,
            aliquotaBp: 4_000,
            parcelaAdicionalCentavos: 5_000,
          },
          {
            ordem: 3,
            limiteInferiorCentavos: 100_001,
            limiteSuperiorCentavos: 500_000,
            aliquotaBp: 3_000,
            parcelaAdicionalCentavos: 15_000,
          },
          {
            ordem: 4,
            limiteInferiorCentavos: 500_001,
            limiteSuperiorCentavos: 1_000_000,
            aliquotaBp: 2_000,
            parcelaAdicionalCentavos: 65_000,
          },
          {
            ordem: 5,
            limiteInferiorCentavos: 1_000_001,
            limiteSuperiorCentavos: 1_500_000,
            aliquotaBp: 1_500,
            parcelaAdicionalCentavos: 115_000,
          },
          {
            ordem: 6,
            limiteInferiorCentavos: 1_500_001,
            limiteSuperiorCentavos: 2_000_000,
            aliquotaBp: 1_000,
            parcelaAdicionalCentavos: 190_000,
          },
          {
            ordem: 7,
            limiteInferiorCentavos: 2_000_001,
            limiteSuperiorCentavos: null,
            aliquotaBp: 500,
            parcelaAdicionalCentavos: 290_000,
          },
        ],
      },
      observacao:
        'A alíquota incide sobre a SOMA de todos os saldos das contas vinculadas do titular, apurados na data do débito (art. 20-D, I). A tabela é contínua nas fronteiras: cada parcela adicional existe para que o saque não caia ao passar de faixa.',
    },
  ],
}
