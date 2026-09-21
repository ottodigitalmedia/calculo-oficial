/**
 * Títulos públicos federais — CALC-122.
 *
 * Dois parâmetros, e os dois existem para a mesma conta: quanto um Tesouro
 * Prefixado paga no vencimento e quanto o imposto leva.
 *
 * **O valor nominal é o que faz a conta ser exata.** A LTN — o Tesouro
 * Prefixado sem juros semestrais — é resgatada "pelo valor nominal, na data de
 * vencimento", e o valor nominal é múltiplo de R$ 1.000,00. Quem compra sabe
 * quanto vai receber por título desde o primeiro dia; o preço pago é o valor
 * nominal descontado pela taxa contratada. É por isso que esta calculadora não
 * precisa de calendário de dias úteis: ela parte do preço que o investidor
 * pagou, que o extrato mostra, e não o recalcula.
 *
 * **A vigência começa em 2001 porque o texto atravessou quatro decretos.** O
 * mesmo dispositivo, com o mesmo valor, aparece no Decreto nº 3.859/2001, no nº
 * 9.292/2018, no nº 11.301/2022 e no nº 12.814/2026, cada um revogando o
 * anterior. Registrar quatro vigências idênticas não acrescentaria informação
 * — a `observacao` guarda a cadeia, e a fonte aponta para o decreto em vigor.
 *
 * **O IOF entra como fronteira, não como tabela.** A tabela do Anexo do Decreto
 * nº 6.306/2007 cobra de 96% a 3% do rendimento em aplicações de um a vinte e
 * nove dias, e zera no trigésimo. A calculadora não cobre resgate antes de
 * trinta dias: ela recusa e diz por quê, em vez de calcular sem o imposto.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { DECRETO_12814_ART_2, DECRETO_6306_ANEXO } from './fontes'

export const TITULOS_PUBLICOS: ConjuntoDeParametros = {
  fontes: [DECRETO_12814_ART_2, DECRETO_6306_ANEXO],

  parametros: [
    {
      id: 'ltn-valor-nominal',
      nome: 'Letra do Tesouro Nacional — valor nominal',
      descricao:
        'Valor pago por título na data de vencimento da LTN (Tesouro Prefixado sem juros semestrais).',
      tipo: 'valor_monetario',
    },
    {
      id: 'iof-renda-fixa-dias-sem-cobranca',
      nome: 'IOF na renda fixa — prazo a partir do qual a alíquota é zero',
      descricao:
        'Dias de aplicação a partir dos quais a tabela do Anexo do Decreto nº 6.306/2007 não cobra IOF.',
      tipo: 'inteiro',
    },
  ],

  vigencias: [
    {
      id: 'ltn-valor-nominal-2001',
      parametroId: 'ltn-valor-nominal',
      fonteId: 'decreto-12814-2026-art-2',
      inicio: '2001-07-05',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 100_000 },
      observacao:
        'Texto idêntico nos Decretos nº 3.859/2001 (DOU de 05/07/2001), nº 9.292/2018 (26/02/2018), nº 11.301/2022 (22/12/2022) e nº 12.814/2026 (12/01/2026), cada um revogando o anterior. A fonte aponta para o vigente.',
    },
    {
      id: 'iof-renda-fixa-dias-2007',
      parametroId: 'iof-renda-fixa-dias-sem-cobranca',
      fonteId: 'decreto-6306-2007-anexo',
      inicio: '2007-12-17',
      fim: null,
      valor: { tipo: 'inteiro', valor: 30 },
      observacao:
        'Última linha do Anexo: "30 | 00". Abaixo de trinta dias a alíquota é percentual do rendimento, e esta calculadora não cobre esse caso.',
    },
  ],
}
