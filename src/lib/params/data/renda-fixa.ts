/**
 * Tabela regressiva do imposto de renda sobre aplicações financeiras —
 * CALC-018.
 *
 * **Alíquotas e prazos vivem juntos aqui, e isso não é acidente.** O art. 1º da
 * Lei nº 11.033/2004 é uma tabela: cada alíquota só significa alguma coisa junto
 * do prazo que a delimita. Deixar os prazos como número solto no motor poria
 * constante legal fora de `lib/params/` — a fronteira dos 180 dias é tão legal
 * quanto os 22,5%.
 *
 * O tipo `tabela_faixas` não serve: ele mede limites em **centavos**, e estes são
 * medidos em **dias**. Sete parâmetros simples representam a tabela sem forçar o
 * modelo a ser o que não é.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_11033_ART_1 } from './fontes'

export const RENDA_FIXA: ConjuntoDeParametros = {
  fontes: [LEI_11033_ART_1],

  parametros: [
    {
      id: 'ir-renda-fixa-faixa-1',
      nome: 'IR sobre renda fixa — até 180 dias',
      descricao: 'Alíquota de imposto de renda na fonte para aplicações resgatadas em até 180 dias.',
      tipo: 'percentual',
    },
    {
      id: 'ir-renda-fixa-faixa-2',
      nome: 'IR sobre renda fixa — de 181 a 360 dias',
      descricao: 'Alíquota para aplicações resgatadas entre 181 e 360 dias.',
      tipo: 'percentual',
    },
    {
      id: 'ir-renda-fixa-faixa-3',
      nome: 'IR sobre renda fixa — de 361 a 720 dias',
      descricao: 'Alíquota para aplicações resgatadas entre 361 e 720 dias.',
      tipo: 'percentual',
    },
    {
      id: 'ir-renda-fixa-faixa-4',
      nome: 'IR sobre renda fixa — acima de 720 dias',
      descricao: 'Alíquota mínima, para aplicações mantidas por mais de 720 dias.',
      tipo: 'percentual',
    },
    {
      id: 'ir-renda-fixa-limite-1',
      nome: 'IR sobre renda fixa — limite da 1ª faixa, em dias',
      descricao: 'Prazo até o qual se aplica a alíquota mais alta.',
      tipo: 'inteiro',
    },
    {
      id: 'ir-renda-fixa-limite-2',
      nome: 'IR sobre renda fixa — limite da 2ª faixa, em dias',
      descricao: 'Prazo até o qual se aplica a segunda alíquota.',
      tipo: 'inteiro',
    },
    {
      id: 'ir-renda-fixa-limite-3',
      nome: 'IR sobre renda fixa — limite da 3ª faixa, em dias',
      descricao: 'Prazo acima do qual se aplica a alíquota mínima.',
      tipo: 'inteiro',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Lei nº 11.033/2004, art. 1º
    //
    //   "I - 22,5% [...] em aplicações com prazo de até 180 (cento e oitenta)
    //        dias;
    //    II - 20% [...] de 181 (cento e oitenta e um) dias até 360 (trezentos e
    //        sessenta) dias;
    //    III - 17,5% [...] de 361 (trezentos e sessenta e um) dias até 720
    //        (setecentos e vinte) dias;
    //    IV - 15% [...] acima de 720 (setecentos e vinte) dias."
    //
    // O caput dá a vigência: "relativamente às aplicações e operações realizadas
    // a partir de 1º de janeiro de 2005".
    //
    // ATENÇÃO A QUEM FOR ATUALIZAR: o texto compilado traz "(Vide Medida
    // Provisória nº 1.303, de 2025)" ao lado destes incisos. Aquela MP propunha
    // substituir a tabela por alíquota única e tributar os títulos hoje isentos
    // — e CADUCOU. O Planalto a marca com "Vigência encerrada". A tabela abaixo
    // continua sendo a vigente.
    // -----------------------------------------------------------------------
    {
      id: 'ir-renda-fixa-faixa-1-2005',
      parametroId: 'ir-renda-fixa-faixa-1',
      fonteId: 'lei-11033-2004-art-1',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_250 },
      observacao:
        'A Medida Provisória nº 1.303/2025 propunha substituir esta tabela por alíquota única e perdeu eficácia sem conversão em lei — o Planalto a marca como de vigência encerrada.',
    },
    {
      id: 'ir-renda-fixa-faixa-2-2005',
      parametroId: 'ir-renda-fixa-faixa-2',
      fonteId: 'lei-11033-2004-art-1',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
    },
    {
      id: 'ir-renda-fixa-faixa-3-2005',
      parametroId: 'ir-renda-fixa-faixa-3',
      fonteId: 'lei-11033-2004-art-1',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_750 },
    },
    {
      id: 'ir-renda-fixa-faixa-4-2005',
      parametroId: 'ir-renda-fixa-faixa-4',
      fonteId: 'lei-11033-2004-art-1',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_500 },
    },
    {
      id: 'ir-renda-fixa-limite-1-2005',
      parametroId: 'ir-renda-fixa-limite-1',
      fonteId: 'lei-11033-2004-art-1',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 180 },
    },
    {
      id: 'ir-renda-fixa-limite-2-2005',
      parametroId: 'ir-renda-fixa-limite-2',
      fonteId: 'lei-11033-2004-art-1',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 360 },
    },
    {
      id: 'ir-renda-fixa-limite-3-2005',
      parametroId: 'ir-renda-fixa-limite-3',
      fonteId: 'lei-11033-2004-art-1',
      inicio: '2005-01-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 720 },
    },
  ],
}
