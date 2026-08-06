/**
 * A margem consignável — CALC-027.
 *
 * **A margem está na lei; a base dela também, e é a base que quase todo mundo
 * erra.** O art. 2º, § 2º, I da Lei nº 10.820/2003, com a redação da Lei nº
 * 14.431/2022, limita a soma dos descontos a "40% (quarenta por cento) da
 * remuneração disponível". E o inciso VIII do mesmo artigo define remuneração
 * disponível como "os vencimentos, subsídios, soldos, salários ou remunerações,
 * **descontadas as consignações compulsórias**".
 *
 * Ou seja: 40% do LÍQUIDO de INSS, IRRF e demais descontos obrigatórios — nunca
 * 40% do salário bruto. Sobre um salário alto a diferença passa de mil reais de
 * margem.
 *
 * A alínea que reservava 5% para cartão de crédito consignado foi **revogada**
 * pela mesma Lei nº 14.431/2022: hoje o limite é único.
 *
 * O QUE NÃO ESTÁ AQUI, E POR QUÊ
 *
 * **Só a margem do empregado CLT.** Aposentados e pensionistas do INSS têm
 * regra própria, no art. 6º da mesma lei, e ela está sendo alterada pela Medida
 * Provisória nº 1.355, de 4 de maio de 2026 — norma em trânsito, que pode não
 * ser convertida. Servidores públicos seguem regulamento do próprio ente.
 *
 * Publicar a margem do INSS a partir de uma MP que ainda pode cair seria o
 * mesmo risco que `ESTADO-DO-PROJETO` §7.33 registrou no IOF. A calculadora diz
 * na tela que trata do empregado CLT.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_10820_ART_2 } from './fontes'

export const CONSIGNADO: ConjuntoDeParametros = {
  fontes: [LEI_10820_ART_2],

  parametros: [
    {
      id: 'consignado-margem-clt',
      nome: 'Margem consignável do empregado CLT',
      descricao:
        'Percentual máximo da remuneração disponível que pode ser comprometido com descontos consignados.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    {
      id: 'consignado-margem-clt-2022',
      parametroId: 'consignado-margem-clt',
      fonteId: 'lei-10820-2003-art-2',
      inicio: '2022-08-04',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 4_000 },
      observacao:
        'A Lei nº 14.431/2022 elevou o limite de 35% para 40% e revogou a alínea que reservava 5% ao cartão de crédito consignado — hoje o limite é único. Publicada no DOU de 4/8/2022.',
    },
  ],
}
