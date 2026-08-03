/**
 * Contribuição do segurado contribuinte individual e do facultativo — CALC-050.
 *
 * **Aqui não há tabela progressiva.** A do empregado, em `inss.ts`, cobra
 * 7,5% a 14% por faixa. A do contribuinte individual é **alíquota única**, e o
 * que muda entre os planos é a alíquota e a BASE sobre a qual ela incide:
 *
 * | Plano | Alíquota | Base | Dispositivo |
 * |---|---|---|---|
 * | Completo | 20% | salário-de-contribuição declarado | Art. 21, caput |
 * | Simplificado | 11% | limite mínimo (salário mínimo) | Art. 21, § 2º, I |
 * | Facultativo de baixa renda | 5% | limite mínimo | Art. 21, § 2º, II, "b" |
 *
 * **A base dos dois planos reduzidos é FIXA no limite mínimo, por lei.** Não é
 * escolha e não acompanha o quanto a pessoa ganha: o § 2º diz "incidente sobre
 * o limite mínimo mensal do salário de contribuição". Quem paga 11% paga 11%
 * do salário mínimo, ganhe o que ganhar — e é por isso que o valor dos dois
 * planos reduzidos não depende de renda nenhuma.
 *
 * O 5% do inciso II, alínea "a", é o do microempreendedor individual, e não
 * está aqui: o MEI recolhe por DAS, que é CALC-047.
 *
 * DATAS DE INÍCIO, E POR QUE ESTAS
 *
 * A Lei nº 12.470/2011 tem regra de efeitos própria (art. 5º): a alínea "a" do
 * inciso II e o § 3º produzem efeitos desde 1º/05/2011, e **os demais
 * dispositivos desde a publicação**, que foi em 1º/09/2011. É essa a data das
 * duas vigências do § 2º cadastradas aqui.
 *
 * Os 11% já existiam com o mesmo percentual desde a LC 123/2006, e os 20% do
 * caput são anteriores à redação de 1999 — o que estas vigências afirmam é que
 * as alíquotas valem A PARTIR das datas registradas, não que fossem outras
 * antes. A Lei nº 9.876/1999 (art. 8º) manda contar os efeitos de majoração de
 * contribuição do primeiro dia do mês seguinte ao nonagésimo dia da publicação
 * de 29/11/1999 — daí 1º/03/2000.
 *
 * O limite mínimo é o salário mínimo (art. 28, § 3º: piso salarial da
 * categoria ou, inexistindo, o salário mínimo — e para quem contribui por conta
 * própria não há piso de categoria). O limite máximo é o teto, que já vive em
 * `inss.ts` como o limite superior da última faixa: duplicá-lo aqui seria
 * convidar os dois a divergirem.
 */

import type { ConjuntoDeParametros } from '../tipos'
import {
  LEI_8212_ART_21_CAPUT,
  LEI_8212_ART_21_P2,
  LEI_8212_ART_21_P3,
} from './fontes'

export const INSS_INDIVIDUAL: ConjuntoDeParametros = {
  fontes: [LEI_8212_ART_21_CAPUT, LEI_8212_ART_21_P2, LEI_8212_ART_21_P3],

  parametros: [
    {
      id: 'inss-individual-aliquota-completa',
      nome: 'Alíquota do plano completo',
      descricao:
        'Alíquota do contribuinte individual e do facultativo sobre o salário-de-contribuição declarado.',
      tipo: 'percentual',
    },
    {
      id: 'inss-individual-aliquota-simplificada',
      nome: 'Alíquota do plano simplificado',
      descricao:
        'Alíquota sobre o limite mínimo, na opção pela exclusão do direito à aposentadoria por tempo de contribuição.',
      tipo: 'percentual',
    },
    {
      id: 'inss-individual-aliquota-baixa-renda',
      nome: 'Alíquota do facultativo de baixa renda',
      descricao:
        'Alíquota sobre o limite mínimo, para o facultativo sem renda própria dedicado ao trabalho doméstico na própria residência, em família de baixa renda.',
      tipo: 'percentual',
    },
    {
      id: 'inss-individual-complementacao',
      nome: 'Complementação para contagem de tempo',
      descricao:
        'Diferença entre o percentual pago no plano reduzido e os 20% do caput, recolhida sobre o limite mínimo.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Art. 21, caput — 20% sobre o salário-de-contribuição.
    // -----------------------------------------------------------------------
    {
      id: 'inss-individual-completa-2000',
      parametroId: 'inss-individual-aliquota-completa',
      fonteId: 'lei-8212-1991-art-21-caput',
      inicio: '2000-03-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
    },

    // -----------------------------------------------------------------------
    // Art. 21, § 2º, I — 11% sobre o limite mínimo.
    // Art. 21, § 2º, II, "b" — 5% sobre o limite mínimo.
    //
    // Lei nº 12.470/2011, art. 5º, II: efeitos desde a publicação (1º/09/2011).
    // -----------------------------------------------------------------------
    {
      id: 'inss-individual-simplificada-2011',
      parametroId: 'inss-individual-aliquota-simplificada',
      fonteId: 'lei-8212-1991-art-21-p2',
      inicio: '2011-09-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_100 },
    },
    {
      id: 'inss-individual-baixa-renda-2011',
      parametroId: 'inss-individual-aliquota-baixa-renda',
      fonteId: 'lei-8212-1991-art-21-p2',
      inicio: '2011-09-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 500 },
    },

    // -----------------------------------------------------------------------
    // Art. 21, § 3º — a complementação é a DIFERENÇA entre o percentual pago e
    // os 20%. Cadastrada como os 20% de destino: a diferença é derivada, e
    // gravá-la pronta obrigaria a manter dois números em sincronia.
    // -----------------------------------------------------------------------
    {
      id: 'inss-individual-complementacao-2011',
      parametroId: 'inss-individual-complementacao',
      fonteId: 'lei-8212-1991-art-21-p3',
      inicio: '2011-09-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
    },
  ],
}
