/**
 * Parâmetros das verbas rescisórias — FGTS e aviso prévio.
 *
 * Pesquisa e transcrição literal em `docs/19-incidencias-verbas-rescisorias.md`.
 *
 * **Por que a vigência começa na publicação da norma e não no exercício.**
 * Diferente das tabelas de INSS e IRRF, que são reajustadas por portaria ou lei
 * a cada exercício, estes valores estão **no corpo da lei** e só mudam por
 * alteração legislativa. Abrir uma vigência por ano seria inventar mudança onde
 * a norma não mudou — e `RN-002` resolve por data, não por ano.
 *
 * A cobertura combinada (`C-1`) continua sendo a interseção: como as tabelas de
 * INSS e IRRF cobrem 2025 e 2026, é esse o intervalo que a calculadora aceita,
 * mesmo que estes parâmetros cubram desde 1990.
 *
 * Valores em basis points e em dias inteiros (`ADR-004`).
 */

import type { ConjuntoDeParametros } from '../tipos'
import { LEI_8036_ART_15, LEI_8036_ART_18, LEI_12506_2011 } from './fontes'

export const TRABALHISTA: ConjuntoDeParametros = {
  fontes: [LEI_8036_ART_15, LEI_8036_ART_18, LEI_12506_2011],

  parametros: [
    {
      id: 'fgts-aliquota-deposito',
      nome: 'Alíquota do depósito mensal de FGTS',
      descricao:
        'Percentual sobre a remuneração, incluída a gratificação natalina, depositado mensalmente na conta vinculada.',
      tipo: 'percentual',
    },
    {
      id: 'fgts-multa-sem-justa-causa',
      nome: 'Multa rescisória do FGTS — dispensa sem justa causa',
      descricao:
        'Percentual sobre o montante de todos os depósitos do contrato, atualizados monetariamente e acrescidos de juros.',
      tipo: 'percentual',
    },
    {
      id: 'aviso-previo-dias-base',
      nome: 'Aviso prévio — dias devidos até um ano de serviço',
      descricao: 'Prazo mínimo de aviso prévio para quem conta até um ano na mesma empresa.',
      tipo: 'inteiro',
    },
    {
      id: 'aviso-previo-dias-por-ano',
      nome: 'Aviso prévio — dias acrescidos por ano de serviço',
      descricao: 'Dias somados ao prazo base por ano de serviço prestado na mesma empresa.',
      tipo: 'inteiro',
    },
    {
      id: 'aviso-previo-dias-maximo',
      nome: 'Aviso prévio — total máximo em dias',
      descricao: 'Limite total do aviso prévio, somados o prazo base e os acréscimos.',
      tipo: 'inteiro',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // FGTS — Lei nº 8.036/1990
    //
    //   Art. 15, caput (red. Lei 14.438/2022):
    //     "a importância correspondente a 8% (oito por cento) da remuneração
    //      paga ou devida, no mês anterior, a cada trabalhador, incluídas na
    //      remuneração as parcelas de que tratam os arts. 457 e 458 da CLT e a
    //      Gratificação de Natal de que trata a Lei nº 4.090, de 1962"
    //
    //   Art. 18, § 1º (red. Lei 9.491/1997):
    //     "importância igual a quarenta por cento do montante de todos os
    //      depósitos realizados na conta vinculada durante a vigência do
    //      contrato de trabalho, atualizados monetariamente e acrescidos dos
    //      respectivos juros"
    // -----------------------------------------------------------------------
    {
      id: 'fgts-aliquota-2022',
      parametroId: 'fgts-aliquota-deposito',
      fonteId: 'lei-8036-1990-art-15',
      inicio: '1990-05-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 800 },
      observacao:
        'A alíquota de 8% permanece desde a redação original; a Lei nº 14.438/2022 alterou o prazo de recolhimento e a redação, não o percentual. Contrato de aprendizagem tem 2% pelo § 7º — fora do escopo de CALC-002.',
    },
    {
      id: 'fgts-multa-1997',
      parametroId: 'fgts-multa-sem-justa-causa',
      fonteId: 'lei-8036-1990-art-18',
      inicio: '1990-05-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 4_000 },
      observacao:
        'Culpa recíproca e força maior reduzem a 20% pelo § 2º, mas dependem de reconhecimento pela Justiça do Trabalho — não é escolha do usuário e por isso não entra como campo.',
    },

    // -----------------------------------------------------------------------
    // Aviso prévio — Lei nº 12.506/2011
    //
    //   Art. 1º: "será concedido na proporção de 30 (trinta) dias aos
    //            empregados que contem até 1 (um) ano de serviço na mesma
    //            empresa."
    //   Par. único: "serão acrescidos 3 (três) dias por ano de serviço
    //            prestado na mesma empresa, até o máximo de 60 (sessenta)
    //            dias, perfazendo um total de até 90 (noventa) dias."
    //
    // O teto de 60 dias é o do ACRÉSCIMO; 90 é o total. Cadastramos o total,
    // que é o que o cálculo aplica — e são equivalentes, porque 30 + 60 = 90.
    // -----------------------------------------------------------------------
    {
      id: 'aviso-previo-base-2011',
      parametroId: 'aviso-previo-dias-base',
      fonteId: 'lei-12506-2011',
      inicio: '2011-10-13',
      fim: null,
      valor: { tipo: 'inteiro', valor: 30 },
      observacao: 'Vigência a partir da publicação no DOU de 13/10/2011 (art. 2º).',
    },
    {
      id: 'aviso-previo-por-ano-2011',
      parametroId: 'aviso-previo-dias-por-ano',
      fonteId: 'lei-12506-2011',
      inicio: '2011-10-13',
      fim: null,
      valor: { tipo: 'inteiro', valor: 3 },
    },
    {
      id: 'aviso-previo-maximo-2011',
      parametroId: 'aviso-previo-dias-maximo',
      fonteId: 'lei-12506-2011',
      inicio: '2011-10-13',
      fim: null,
      valor: { tipo: 'inteiro', valor: 90 },
    },
  ],
}
