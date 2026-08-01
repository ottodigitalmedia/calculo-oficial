/**
 * Prazos de compensação do banco de horas — CALC-013.
 *
 * **Três prazos, duas vigências, e a diferença entre elas conta uma história.**
 * O prazo de um ano por norma coletiva existe desde 2001. Os outros dois — seis
 * meses por acordo individual escrito e a compensação no mesmo mês por acordo
 * tácito — foram criados pela Reforma Trabalhista de 2017, e é por isso que
 * cada um tem sua própria data de início.
 *
 * Registrar os três com a mesma vigência apagaria justamente o que distingue o
 * regime anterior do atual, e produziria resposta errada para qualquer cálculo
 * referente a contrato encerrado antes de novembro de 2017.
 *
 * O que **não** está aqui: o adicional de 50%. Ele já é
 * `hora-extra-adicional-minimo` desde CALC-006, e o art. 59, § 1º fixa o mesmo
 * número que a Constituição — mesmo contexto, um parâmetro só.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { CLT_ART_59, CLT_ART_59_REFORMA } from './fontes'

export const BANCO_DE_HORAS: ConjuntoDeParametros = {
  fontes: [CLT_ART_59, CLT_ART_59_REFORMA],

  parametros: [
    {
      id: 'banco-horas-prazo-coletivo',
      nome: 'Banco de horas — prazo de compensação por norma coletiva',
      descricao:
        'Prazo máximo, em meses, para compensar o saldo quando o banco de horas é pactuado por acordo ou convenção coletiva.',
      tipo: 'inteiro',
    },
    {
      id: 'banco-horas-prazo-individual',
      nome: 'Banco de horas — prazo por acordo individual escrito',
      descricao:
        'Prazo máximo, em meses, para compensar quando o banco de horas é pactuado por acordo individual escrito.',
      tipo: 'inteiro',
    },
    {
      id: 'banco-horas-prazo-mesmo-mes',
      nome: 'Compensação por acordo individual tácito — prazo',
      descricao:
        'Prazo máximo, em meses, do regime de compensação estabelecido por acordo individual tácito ou escrito.',
      tipo: 'inteiro',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // CLT, art. 59, § 2º (red. MP nº 2.164-41, de 24 de agosto de 2001)
    //
    //   "Poderá ser dispensado o acréscimo de salário se, por força de acordo ou
    //    convenção coletiva de trabalho, o excesso de horas em um dia for
    //    compensado pela correspondente diminuição em outro dia, de maneira que
    //    não exceda, no período máximo de UM ANO, à soma das jornadas semanais
    //    de trabalho previstas, nem seja ultrapassado o limite máximo de dez
    //    horas diárias."
    //
    // A redação anterior, da Lei nº 9.601/1998, dava cento e vinte dias. A MP
    // 2.164-41 é de 24/08/2001 e está entre as mantidas em vigor pelo art. 2º da
    // Emenda Constitucional nº 32/2001.
    // -----------------------------------------------------------------------
    {
      id: 'banco-horas-coletivo-2001',
      parametroId: 'banco-horas-prazo-coletivo',
      fonteId: 'clt-art-59',
      inicio: '2001-08-24',
      fim: null,
      valor: { tipo: 'inteiro', valor: 12 },
      observacao:
        'A norma diz "período máximo de um ano"; registrado em meses para casar com a unidade dos demais prazos. A redação anterior, da Lei nº 9.601/1998, previa cento e vinte dias.',
    },

    // -----------------------------------------------------------------------
    // CLT, art. 59, § 5º e § 6º (incluídos pela Lei nº 13.467, de 2017)
    //
    //   "§ 5º O banco de horas de que trata o § 2º deste artigo poderá ser
    //    pactuado por acordo individual escrito, desde que a compensação ocorra
    //    no período máximo de SEIS MESES.
    //    § 6º É lícito o regime de compensação de jornada estabelecido por
    //    acordo individual, tácito ou escrito, para a compensação NO MESMO MÊS."
    //
    // Vigência a partir de 11/11/2017, cento e vinte dias após a publicação da
    // Lei nº 13.467, conforme o art. 6º dela.
    // -----------------------------------------------------------------------
    {
      id: 'banco-horas-individual-2017',
      parametroId: 'banco-horas-prazo-individual',
      fonteId: 'clt-art-59-reforma',
      inicio: '2017-11-11',
      fim: null,
      valor: { tipo: 'inteiro', valor: 6 },
      observacao:
        'Antes da Reforma Trabalhista o banco de horas só podia ser pactuado por norma coletiva. O acordo individual escrito é hipótese nova, com prazo próprio.',
    },
    {
      id: 'banco-horas-mesmo-mes-2017',
      parametroId: 'banco-horas-prazo-mesmo-mes',
      fonteId: 'clt-art-59-reforma',
      inicio: '2017-11-11',
      fim: null,
      valor: { tipo: 'inteiro', valor: 1 },
    },
  ],
}
