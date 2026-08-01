/**
 * Encargos previdenciários a cargo da empresa — CALC-011.
 *
 * **A fronteira que este arquivo não atravessa.** `00-catalogo` §14 exclui em
 * definitivo o *tributário empresarial complexo*, e `docs/18` alerta que
 * CALC-011 corre risco de virar isso pelas alíquotas de terceiros — o Sistema S
 * —, que variam por código FPAS e dependem de tabela mantida por outro órgão.
 *
 * A saída é a que o próprio §14 prescreve: *"onde o dado é indispensável, ele
 * entra como campo preenchido pelo usuário"*. Terceiros é campo, não parâmetro.
 * Aqui ficam só as alíquotas que estão **no corpo da Lei nº 8.212/1991**, e que
 * só mudam por alteração legislativa.
 *
 * O FGTS não está aqui: `fgts-aliquota-deposito` existe desde T-105, em
 * `trabalhista.ts`.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_8212_ART_22 } from './fontes'

export const EMPREGADOR: ConjuntoDeParametros = {
  fontes: [LEI_8212_ART_22],

  parametros: [
    {
      id: 'contribuicao-patronal',
      nome: 'Contribuição previdenciária patronal',
      descricao:
        'Percentual sobre o total das remunerações pagas aos segurados empregados, a cargo da empresa.',
      tipo: 'percentual',
    },
    {
      id: 'rat-risco-leve',
      nome: 'RAT — risco ambiental do trabalho, grau leve',
      descricao:
        'Percentual para empresas cuja atividade preponderante tem risco de acidente do trabalho considerado leve.',
      tipo: 'percentual',
    },
    {
      id: 'rat-risco-medio',
      nome: 'RAT — risco ambiental do trabalho, grau médio',
      descricao: 'Percentual para empresas cuja atividade preponderante tem risco médio.',
      tipo: 'percentual',
    },
    {
      id: 'rat-risco-grave',
      nome: 'RAT — risco ambiental do trabalho, grau grave',
      descricao: 'Percentual para empresas cuja atividade preponderante tem risco grave.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // Lei nº 8.212/1991, art. 22
    //
    //   I (red. Lei nº 9.876/1999):
    //     "vinte por cento sobre o total das remunerações pagas, devidas ou
    //      creditadas a qualquer título, durante o mês, aos segurados
    //      empregados e trabalhadores avulsos que lhe prestem serviços"
    //
    //   II (red. Lei nº 9.732/1998):
    //     "a) 1% (um por cento) para as empresas em cuja atividade preponderante
    //         o risco de acidentes do trabalho seja considerado leve;
    //      b) 2% (dois por cento) [...] risco seja considerado médio;
    //      c) 3% (três por cento) [...] risco seja considerado grave."
    //
    // As datas de início são as das leis que deram a redação vigente. Não são
    // alíquotas de exercício: só mudam por alteração legislativa, como as do
    // FGTS e do aviso prévio.
    // -----------------------------------------------------------------------
    {
      id: 'contribuicao-patronal-1999',
      parametroId: 'contribuicao-patronal',
      fonteId: 'lei-8212-1991-art-22',
      inicio: '1999-11-26',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
      observacao:
        'Data da Lei nº 9.876, de 26 de novembro de 1999, que deu ao inciso I a redação atual. Não se aplica a empresas optantes pelo Simples Nacional na maior parte dos anexos, nem a quem esteja sob desoneração da folha — hipóteses fora do escopo desta calculadora.',
    },
    {
      id: 'rat-leve-1998',
      parametroId: 'rat-risco-leve',
      fonteId: 'lei-8212-1991-art-22',
      inicio: '1998-12-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 100 },
      observacao:
        'Data da Lei nº 9.732, de 11 de dezembro de 1998, que deu ao inciso II a redação atual. O grau de risco é o da atividade preponderante da empresa e consta do enquadramento por CNAE; o FAP pode multiplicar a alíquota por fator entre 0,5 e 2,0, o que esta calculadora não estima.',
    },
    {
      id: 'rat-medio-1998',
      parametroId: 'rat-risco-medio',
      fonteId: 'lei-8212-1991-art-22',
      inicio: '1998-12-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 200 },
    },
    {
      id: 'rat-grave-1998',
      parametroId: 'rat-risco-grave',
      fonteId: 'lei-8212-1991-art-22',
      inicio: '1998-12-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 300 },
    },
  ],
}
