/**
 * Imposto no resgate da previdência complementar — CALC-094.
 *
 * Lote 3 da expansão do catálogo. Transcrição literal de cada dispositivo em
 * `fontes.ts`, junto da fonte.
 *
 * **Por que a tabela regressiva NÃO entra como `tabela_faixas`.** Aquele tipo
 * existe para faixa de DINHEIRO — limites em centavos, com alíquota por trecho
 * de base. Aqui o eixo é TEMPO, em anos, e usar o campo de centavos para
 * guardar anos seria o encoding que `ESTADO-DO-PROJETO` §7.30 registra como
 * caminho errado: o dado deixaria de ser legível e a validação estrutural
 * deixaria de valer. Cada alíquota e cada fronteira entram como parâmetro
 * próprio, com o mesmo nome que a lei usa.
 *
 * Vigência a partir de 1º/01/2005, quando a lei passou a produzir efeitos
 * (art. 8º) — e não da publicação, em 29/12/2004.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_11053_ART_1, LEI_11053_ART_3 } from './fontes'

const INICIO = '2005-01-01'

export const PREVIDENCIA_PRIVADA: ConjuntoDeParametros = {
  fontes: [LEI_11053_ART_1, LEI_11053_ART_3],

  parametros: [
    {
      id: 'previdencia-regressiva-ate-2-anos',
      nome: 'Regime regressivo — até 2 anos de acumulação',
      descricao: 'Alíquota definitiva na fonte para recursos com prazo de acumulação de até dois anos.',
      tipo: 'percentual',
    },
    {
      id: 'previdencia-regressiva-2-a-4-anos',
      nome: 'Regime regressivo — de 2 a 4 anos',
      descricao: 'Alíquota definitiva na fonte para prazo de acumulação superior a dois e até quatro anos.',
      tipo: 'percentual',
    },
    {
      id: 'previdencia-regressiva-4-a-6-anos',
      nome: 'Regime regressivo — de 4 a 6 anos',
      descricao: 'Alíquota definitiva na fonte para prazo de acumulação superior a quatro e até seis anos.',
      tipo: 'percentual',
    },
    {
      id: 'previdencia-regressiva-6-a-8-anos',
      nome: 'Regime regressivo — de 6 a 8 anos',
      descricao: 'Alíquota definitiva na fonte para prazo de acumulação superior a seis e até oito anos.',
      tipo: 'percentual',
    },
    {
      id: 'previdencia-regressiva-8-a-10-anos',
      nome: 'Regime regressivo — de 8 a 10 anos',
      descricao: 'Alíquota definitiva na fonte para prazo de acumulação superior a oito e até dez anos.',
      tipo: 'percentual',
    },
    {
      id: 'previdencia-regressiva-acima-de-10-anos',
      nome: 'Regime regressivo — acima de 10 anos',
      descricao: 'Alíquota definitiva na fonte para prazo de acumulação superior a dez anos.',
      tipo: 'percentual',
    },
    {
      id: 'previdencia-regressiva-degrau-anos',
      nome: 'Regime regressivo — degrau da tabela, em anos',
      descricao: 'Intervalo, em anos, entre uma alíquota da tabela regressiva e a seguinte.',
      tipo: 'inteiro',
    },
    {
      id: 'previdencia-regressiva-ultimo-degrau-anos',
      nome: 'Regime regressivo — último degrau, em anos',
      descricao: 'Prazo de acumulação a partir do qual vale a menor alíquota da tabela.',
      tipo: 'inteiro',
    },
    {
      id: 'previdencia-progressiva-antecipacao',
      nome: 'Regime progressivo — retenção no resgate',
      descricao:
        'Alíquota retida na fonte no resgate, como antecipação do imposto devido na declaração de ajuste anual.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    {
      id: 'previdencia-regressiva-ate-2-anos-2005',
      parametroId: 'previdencia-regressiva-ate-2-anos',
      fonteId: 'lei-11053-2004-art-1',
      inicio: INICIO,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 3_500 },
      observacao:
        'A opção pelo regime regressivo é irretratável e o imposto é definitivo (art. 1º, § 2º): o valor não volta a ser ajustado na declaração anual.',
    },
    {
      id: 'previdencia-regressiva-2-a-4-anos-2005',
      parametroId: 'previdencia-regressiva-2-a-4-anos',
      fonteId: 'lei-11053-2004-art-1',
      inicio: INICIO,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 3_000 },
    },
    {
      id: 'previdencia-regressiva-4-a-6-anos-2005',
      parametroId: 'previdencia-regressiva-4-a-6-anos',
      fonteId: 'lei-11053-2004-art-1',
      inicio: INICIO,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_500 },
    },
    {
      id: 'previdencia-regressiva-6-a-8-anos-2005',
      parametroId: 'previdencia-regressiva-6-a-8-anos',
      fonteId: 'lei-11053-2004-art-1',
      inicio: INICIO,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
    },
    {
      id: 'previdencia-regressiva-8-a-10-anos-2005',
      parametroId: 'previdencia-regressiva-8-a-10-anos',
      fonteId: 'lei-11053-2004-art-1',
      inicio: INICIO,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_500 },
    },
    {
      id: 'previdencia-regressiva-acima-de-10-anos-2005',
      parametroId: 'previdencia-regressiva-acima-de-10-anos',
      fonteId: 'lei-11053-2004-art-1',
      inicio: INICIO,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_000 },
    },
    {
      id: 'previdencia-regressiva-degrau-2005',
      parametroId: 'previdencia-regressiva-degrau-anos',
      fonteId: 'lei-11053-2004-art-1',
      inicio: INICIO,
      fim: null,
      valor: { tipo: 'inteiro', valor: 2 },
      observacao:
        'Os incisos I a V da tabela avançam de dois em dois anos. O prazo de acumulação é contado do aporte até o pagamento (art. 1º, § 3º), e não da abertura do plano.',
    },
    {
      id: 'previdencia-regressiva-ultimo-degrau-2005',
      parametroId: 'previdencia-regressiva-ultimo-degrau-anos',
      fonteId: 'lei-11053-2004-art-1',
      inicio: INICIO,
      fim: null,
      valor: { tipo: 'inteiro', valor: 10 },
    },
    {
      id: 'previdencia-progressiva-antecipacao-2005',
      parametroId: 'previdencia-progressiva-antecipacao',
      fonteId: 'lei-11053-2004-art-3',
      inicio: INICIO,
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_500 },
      observacao:
        'É antecipação, e não imposto final: o valor entra na declaração de ajuste, onde a tabela anual decide quanto era realmente devido.',
    },
  ],
}
