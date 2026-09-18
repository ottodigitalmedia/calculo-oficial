/**
 * Férias concedidas fora do prazo — CALC-112.
 *
 * Os três números da conta são da CLT, na redação do Decreto-lei nº
 * 1.535/1977 (DOU de 13/04/1977, em vigor em 1º/05/1977, art. 3º): doze meses
 * para adquirir (art. 130), doze para conceder (art. 134) e o pagamento em
 * dobro do que for gozado depois (art. 137). A Súmula 81 do TST faz a dobra
 * incidir dia a dia.
 *
 * **Conjunto próprio** porque nenhum outro conjunto tinha parâmetro de férias:
 * CALC-004 trabalha só com as tabelas de INSS e IRRF.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { CLT_ART_130, CLT_ART_134, CLT_ART_137 } from './fontes'

export const FERIAS_FORA_DO_PRAZO: ConjuntoDeParametros = {
  fontes: [CLT_ART_130, CLT_ART_134, CLT_ART_137],

  parametros: [
    {
      id: 'ferias-periodo-aquisitivo-meses',
      nome: 'Férias — período aquisitivo',
      descricao: 'Meses de contrato que dão direito a um período de férias.',
      tipo: 'inteiro',
    },
    {
      id: 'ferias-periodo-concessivo-meses',
      nome: 'Férias — período concessivo',
      descricao: 'Meses, contados do fim do período aquisitivo, para o empregador conceder as férias.',
      tipo: 'inteiro',
    },
    {
      id: 'ferias-fora-do-prazo-fator',
      nome: 'Férias fora do prazo — multiplicador',
      descricao: 'Quantas vezes a remuneração dos dias gozados após o período concessivo é paga.',
      tipo: 'fracao',
    },
  ],

  vigencias: [
    {
      id: 'ferias-periodo-aquisitivo-1977',
      parametroId: 'ferias-periodo-aquisitivo-meses',
      fonteId: 'clt-art-130',
      inicio: '1977-05-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 12 },
    },
    {
      id: 'ferias-periodo-concessivo-1977',
      parametroId: 'ferias-periodo-concessivo-meses',
      fonteId: 'clt-art-134',
      inicio: '1977-05-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 12 },
    },
    {
      id: 'ferias-fora-do-prazo-fator-1977',
      parametroId: 'ferias-fora-do-prazo-fator',
      fonteId: 'clt-art-137',
      inicio: '1977-05-01',
      fim: null,
      valor: { tipo: 'fracao', numerador: 2, denominador: 1 },
      observacao:
        '"Em dobro" (art. 137). A Súmula 81 do TST aplica a dobra aos DIAS gozados após o período concessivo, e não às férias inteiras.',
    },
  ],
}
