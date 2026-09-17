/**
 * Multas de trânsito — CALC-097.
 *
 * Lote 4 da expansão do catálogo. Transcrição literal de cada dispositivo em
 * `fontes.ts`, junto da fonte.
 *
 * **Três normas com três datas diferentes, e é isso que a calculadora precisa
 * respeitar.** Os valores são da Lei nº 13.281/2016, em vigor desde 01/11/2016;
 * a pontuação é do texto original do Código, em vigor desde 22/01/1998; os
 * limites de pontos para a suspensão são da Lei nº 14.071/2020, em vigor desde
 * 12/04/2021. Uma multa de 2019 tem o valor de hoje e o limite de suspensão de
 * ontem — e a cobertura combinada (`C-1`) faz a página dizer isso sozinha.
 *
 * Valores monetários em centavos (`ADR-004` A-1).
 */

import type { ConjuntoDeParametros } from '../tipos'
import { CTB_ART_258, CTB_ART_259, CTB_ART_261, CTB_ART_284 } from './fontes'

const VALORES = '2016-11-01'
const PONTOS = '1998-01-22'
const SUSPENSAO = '2021-04-12'

export const TRANSITO: ConjuntoDeParametros = {
  fontes: [CTB_ART_258, CTB_ART_259, CTB_ART_261, CTB_ART_284],

  parametros: [
    {
      id: 'multa-gravissima-valor',
      nome: 'Multa de infração gravíssima',
      descricao: 'Valor da multa de natureza gravíssima, antes de qualquer fator multiplicador.',
      tipo: 'valor_monetario',
    },
    {
      id: 'multa-grave-valor',
      nome: 'Multa de infração grave',
      descricao: 'Valor da multa de natureza grave.',
      tipo: 'valor_monetario',
    },
    {
      id: 'multa-media-valor',
      nome: 'Multa de infração média',
      descricao: 'Valor da multa de natureza média.',
      tipo: 'valor_monetario',
    },
    {
      id: 'multa-leve-valor',
      nome: 'Multa de infração leve',
      descricao: 'Valor da multa de natureza leve.',
      tipo: 'valor_monetario',
    },
    {
      id: 'multa-gravissima-pontos',
      nome: 'Pontos da infração gravíssima',
      descricao: 'Pontos computados na carteira por infração gravíssima.',
      tipo: 'inteiro',
    },
    {
      id: 'multa-grave-pontos',
      nome: 'Pontos da infração grave',
      descricao: 'Pontos computados na carteira por infração grave.',
      tipo: 'inteiro',
    },
    {
      id: 'multa-media-pontos',
      nome: 'Pontos da infração média',
      descricao: 'Pontos computados na carteira por infração média.',
      tipo: 'inteiro',
    },
    {
      id: 'multa-leve-pontos',
      nome: 'Pontos da infração leve',
      descricao: 'Pontos computados na carteira por infração leve.',
      tipo: 'inteiro',
    },
    {
      id: 'suspensao-limite-com-duas-gravissimas',
      nome: 'Limite de pontos — com duas ou mais gravíssimas',
      descricao: 'Pontos em doze meses que levam à suspensão quando há duas ou mais infrações gravíssimas.',
      tipo: 'inteiro',
    },
    {
      id: 'suspensao-limite-com-uma-gravissima',
      nome: 'Limite de pontos — com uma gravíssima',
      descricao: 'Pontos em doze meses que levam à suspensão quando há uma infração gravíssima.',
      tipo: 'inteiro',
    },
    {
      id: 'suspensao-limite-sem-gravissima',
      nome: 'Limite de pontos — sem gravíssima',
      descricao: 'Pontos em doze meses que levam à suspensão quando não há infração gravíssima.',
      tipo: 'inteiro',
    },
    {
      id: 'multa-desconto-vencimento',
      nome: 'Pagamento até o vencimento',
      descricao: 'Percentual do valor da multa devido quando o pagamento é feito até a data do vencimento.',
      tipo: 'percentual',
    },
    {
      id: 'multa-desconto-notificacao-eletronica',
      nome: 'Pagamento com adesão à notificação eletrônica',
      descricao:
        'Percentual do valor da multa devido quando o infrator adere ao sistema eletrônico e renuncia a defesa e recurso.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    // --- Valores: Lei nº 13.281/2016 ----------------------------------------
    {
      id: 'multa-gravissima-valor-2016',
      parametroId: 'multa-gravissima-valor',
      fonteId: 'ctb-art-258',
      inicio: VALORES,
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 29_347 },
      observacao:
        'Valor base. Diversas infrações do Código preveem fator multiplicador próprio — o § 2º do art. 258 chama essas de multa agravada, e a calculadora aceita o fator como entrada.',
    },
    {
      id: 'multa-grave-valor-2016',
      parametroId: 'multa-grave-valor',
      fonteId: 'ctb-art-258',
      inicio: VALORES,
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 19_523 },
    },
    {
      id: 'multa-media-valor-2016',
      parametroId: 'multa-media-valor',
      fonteId: 'ctb-art-258',
      inicio: VALORES,
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 13_016 },
    },
    {
      id: 'multa-leve-valor-2016',
      parametroId: 'multa-leve-valor',
      fonteId: 'ctb-art-258',
      inicio: VALORES,
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 8_838 },
    },

    // --- Pontos: texto original do Código -----------------------------------
    {
      id: 'multa-gravissima-pontos-1998',
      parametroId: 'multa-gravissima-pontos',
      fonteId: 'ctb-art-259',
      inicio: PONTOS,
      fim: null,
      valor: { tipo: 'inteiro', valor: 7 },
    },
    {
      id: 'multa-grave-pontos-1998',
      parametroId: 'multa-grave-pontos',
      fonteId: 'ctb-art-259',
      inicio: PONTOS,
      fim: null,
      valor: { tipo: 'inteiro', valor: 5 },
    },
    {
      id: 'multa-media-pontos-1998',
      parametroId: 'multa-media-pontos',
      fonteId: 'ctb-art-259',
      inicio: PONTOS,
      fim: null,
      valor: { tipo: 'inteiro', valor: 4 },
    },
    {
      id: 'multa-leve-pontos-1998',
      parametroId: 'multa-leve-pontos',
      fonteId: 'ctb-art-259',
      inicio: PONTOS,
      fim: null,
      valor: { tipo: 'inteiro', valor: 3 },
    },

    // --- Limites de suspensão: Lei nº 14.071/2020 ---------------------------
    {
      id: 'suspensao-duas-gravissimas-2021',
      parametroId: 'suspensao-limite-com-duas-gravissimas',
      fonteId: 'ctb-art-261',
      inicio: SUSPENSAO,
      fim: null,
      valor: { tipo: 'inteiro', valor: 20 },
      observacao:
        'Antes da Lei nº 14.071/2020 o limite era único, de vinte pontos, sem olhar a gravidade das infrações. A cobertura cadastrada começa na vigência da regra nova.',
    },
    {
      id: 'suspensao-uma-gravissima-2021',
      parametroId: 'suspensao-limite-com-uma-gravissima',
      fonteId: 'ctb-art-261',
      inicio: SUSPENSAO,
      fim: null,
      valor: { tipo: 'inteiro', valor: 30 },
    },
    {
      id: 'suspensao-sem-gravissima-2021',
      parametroId: 'suspensao-limite-sem-gravissima',
      fonteId: 'ctb-art-261',
      inicio: SUSPENSAO,
      fim: null,
      valor: { tipo: 'inteiro', valor: 40 },
      observacao:
        'O condutor que exerce atividade remunerada ao veículo tem a suspensão imposta neste mesmo limite, qualquer que seja a natureza das infrações cometidas — a calculadora trata isso como opção de entrada.',
    },

    // --- Descontos: art. 284 ------------------------------------------------
    {
      id: 'multa-desconto-vencimento-1998',
      parametroId: 'multa-desconto-vencimento',
      fonteId: 'ctb-art-284',
      inicio: PONTOS,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 8_000 },
      observacao: 'O caput do art. 284 é texto original: paga-se 80% do valor quando o pagamento ocorre até o vencimento.',
    },
    {
      id: 'multa-desconto-sne-2023',
      parametroId: 'multa-desconto-notificacao-eletronica',
      fonteId: 'ctb-art-284',
      inicio: '2023-06-20',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 6_000 },
      observacao:
        'Exige adesão ao sistema de notificação eletrônica ANTES do envio da notificação da autuação e renúncia a defesa prévia e recurso.',
    },
  ],
}
