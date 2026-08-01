/**
 * Parâmetros legais do crédito ao consumidor.
 *
 * **O primeiro parâmetro do bloco de crédito.** CALC-022, CALC-024, CALC-025 e
 * CALC-026 não têm nenhum: tudo o que entra nelas é digitado, e o que elas têm
 * de norma é método — a definição do CET, a forma da redução proporcional.
 * CALC-023 é diferente: o teto de juros do cartão é um **valor**, com vigência e
 * com data de início determinada por lei.
 *
 * Por isso ele entra aqui, e não no motor. `CLAUDE.md`, regra 1.
 *
 * **A vigência começa na eficácia, não na publicação.** A Lei nº 14.690 é de
 * 3 de outubro de 2023, mas o art. 28, § 1º só passou a valer decorridos os 90
 * dias que o próprio dispositivo concede à autorregulação — e a Resolução CMN
 * nº 4.549/2017, no art. 2º-D incluído pela Resolução CMN nº 5.112/2023, diz
 * isso com todas as letras: o teto *"se aplica somente às operações realizadas
 * após o prazo de 90 (noventa) dias de que trata o § 1º do art. 28 da Lei nº
 * 14.690, de 2023"*. Daí `2024-01-03`.
 *
 * Registrar a data de publicação seria aplicar o teto a três meses em que ele
 * não existia — e `RN-002` resolve vigência por data, então o erro produziria
 * número errado com aparência de certo em toda fatura do último trimestre de
 * 2023.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_14690_ART_28, RES_CMN_4549 } from './fontes'

export const CREDITO: ConjuntoDeParametros = {
  fontes: [LEI_14690_ART_28, RES_CMN_4549],

  parametros: [
    {
      id: 'cartao-teto-juros-encargos',
      nome: 'Teto de juros e encargos no financiamento da fatura do cartão',
      descricao:
        'Limite do total cobrado a título de juros e encargos financeiros no crédito rotativo e no parcelamento da fatura, expresso como percentual do valor original da dívida.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Lei nº 14.690, de 3 de outubro de 2023
    //
    //   Art. 28, § 1º:
    //     "Se os limites referidos no caput deste artigo não forem aprovados
    //      no prazo máximo de 90 (noventa) dias, contado da data da publicação
    //      desta Lei, o total cobrado em cada caso a título de juros e encargos
    //      financeiros não poderá exceder o valor original da dívida."
    //
    // "Não poderá exceder o valor original da dívida" é 100% — um para um. Está
    // aqui em basis points e não como a fração 1/1 porque a grandeza é a mesma
    // que o motor compara: o teto é uma alíquota aplicada sobre a dívida
    // original, exatamente como qualquer outra alíquota do sistema.
    // -----------------------------------------------------------------------
    {
      id: 'cartao-teto-juros-encargos-2024',
      parametroId: 'cartao-teto-juros-encargos',
      fonteId: 'lei-14690-2023-art-28',
      inicio: '2024-01-03',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 10_000 },
      observacao:
        'Eficácia a partir de 03/01/2024, decorridos os 90 dias do art. 28, § 1º. A Resolução CMN nº 4.549/2017, art. 2º-D (incluído pela Resolução CMN nº 5.112/2023), confirma que o teto se aplica somente às operações realizadas após esse prazo, independentemente da data de assinatura do contrato. Na migração do rotativo para o parcelamento, o valor original da dívida é o montante inicial do rotativo e os juros são apurados desde o início dele — art. 2º-A, parágrafo único, I e II.',
    },
  ],
}
