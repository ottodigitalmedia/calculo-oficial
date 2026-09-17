/**
 * Benefícios do Regime Geral de Previdência Social — CALC-100 a CALC-103.
 *
 * Lote 5 da expansão do catálogo, e a primeira vez que o projeto entra em
 * previdência. Transcrição literal de cada dispositivo em `fontes.ts`, junto da
 * fonte.
 *
 * **A tabela de pontos é DADO, e não conta feita no motor.** O § 1º do art. 15
 * da EC nº 103/2019 acrescenta um ponto por ano, e seria fácil escrever
 * `86 + (ano − 2019)` no código. Seria também constante legal fora de
 * `lib/params/` — três delas, aliás: o ponto de partida, o ano inicial do
 * acréscimo e o teto. Cada ano tem a sua vigência, e o registro resolve pela
 * data como resolve qualquer outro parâmetro.
 *
 * **O que NÃO está aqui, de propósito:** as demais regras de transição da
 * Emenda (idade progressiva, pedágio de 50% e de 100%), a aposentadoria por
 * idade e o cálculo do valor da aposentadoria. Elas dependem de mais variáveis
 * e de conferência dedicada — `00-catalogo` §18.6 registra isso.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { EC_103_ART_15, EC_103_ART_23, LEI_8213_ART_61, LEI_8213_ART_73 } from './fontes'

export const PREVIDENCIA_RGPS: ConjuntoDeParametros = {
  fontes: [EC_103_ART_23, EC_103_ART_15, LEI_8213_ART_61, LEI_8213_ART_73],

  parametros: [
    {
      id: 'pensao-cota-familiar',
      nome: 'Pensão por morte — cota familiar',
      descricao: 'Percentual da aposentadoria que forma a base da pensão, antes das cotas por dependente.',
      tipo: 'percentual',
    },
    {
      id: 'pensao-cota-por-dependente',
      nome: 'Pensão por morte — cota por dependente',
      descricao: 'Pontos percentuais acrescidos por dependente à cota familiar.',
      tipo: 'percentual',
    },
    {
      id: 'pensao-cota-maxima',
      nome: 'Pensão por morte — limite das cotas',
      descricao: 'Percentual máximo da aposentadoria que a soma das cotas pode alcançar.',
      tipo: 'percentual',
    },
    {
      id: 'auxilio-incapacidade-percentual',
      nome: 'Auxílio por incapacidade temporária — percentual',
      descricao: 'Percentual do salário de benefício que forma a renda mensal do benefício.',
      tipo: 'percentual',
    },
    {
      id: 'aposentadoria-pontos-mulher',
      nome: 'Regra de pontos — mulher',
      descricao: 'Soma de idade e tempo de contribuição exigida da mulher na regra de transição por pontos.',
      tipo: 'inteiro',
    },
    {
      id: 'aposentadoria-pontos-homem',
      nome: 'Regra de pontos — homem',
      descricao: 'Soma de idade e tempo de contribuição exigida do homem na regra de transição por pontos.',
      tipo: 'inteiro',
    },
    {
      id: 'aposentadoria-tempo-minimo-mulher',
      nome: 'Regra de pontos — tempo mínimo de contribuição da mulher',
      descricao: 'Anos de contribuição exigidos da mulher, além da pontuação.',
      tipo: 'inteiro',
    },
    {
      id: 'aposentadoria-tempo-minimo-homem',
      nome: 'Regra de pontos — tempo mínimo de contribuição do homem',
      descricao: 'Anos de contribuição exigidos do homem, além da pontuação.',
      tipo: 'inteiro',
    },
  ],

  vigencias: [
    {
      id: 'pensao-cota-familiar-2019',
      parametroId: 'pensao-cota-familiar',
      fonteId: 'ec-103-2019-art-23',
      inicio: '2019-11-13',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 5_000 },
      observacao:
        'Antes da Emenda, a pensão era de 100% da aposentadoria (Lei nº 8.213/1991, art. 75). A cobertura cadastrada começa na vigência da regra nova — óbito anterior a 13/11/2019 segue a regra antiga, que esta calculadora não cobre.',
    },
    {
      id: 'pensao-cota-dependente-2019',
      parametroId: 'pensao-cota-por-dependente',
      fonteId: 'ec-103-2019-art-23',
      inicio: '2019-11-13',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 1_000 },
    },
    {
      id: 'pensao-cota-maxima-2019',
      parametroId: 'pensao-cota-maxima',
      fonteId: 'ec-103-2019-art-23',
      inicio: '2019-11-13',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 10_000 },
      observacao:
        'Havendo dependente inválido ou com deficiência, o § 2º garante 100% desde logo — a calculadora trata isso como opção de entrada.',
    },
    {
      id: 'auxilio-incapacidade-1995',
      parametroId: 'auxilio-incapacidade-percentual',
      fonteId: 'lei-8213-1991-art-61',
      inicio: '1995-04-29',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 9_100 },
      observacao:
        'Redação da Lei nº 9.032/1995, publicada no DOU extra de 29/04/1995. O § 10 do art. 29 limita o benefício à média dos últimos doze salários de contribuição.',
    },
    {
      id: 'pontos-mulher-2019',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2019-11-13',
      fim: '2019-12-31',
      valor: { tipo: 'inteiro', valor: 86 },
      observacao:
        'Regra de transição por pontos, aberta na publicação da Emenda. O acréscimo anual do § 1º começa em 1º/01/2020, e cada ano tem a sua vigência própria — a tabela é dado, não conta feita no motor.',
    },
    {
      id: 'pontos-mulher-2020',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2020-01-01',
      fim: '2020-12-31',
      valor: { tipo: 'inteiro', valor: 87 },
    },
    {
      id: 'pontos-mulher-2021',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2021-01-01',
      fim: '2021-12-31',
      valor: { tipo: 'inteiro', valor: 88 },
    },
    {
      id: 'pontos-mulher-2022',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2022-01-01',
      fim: '2022-12-31',
      valor: { tipo: 'inteiro', valor: 89 },
    },
    {
      id: 'pontos-mulher-2023',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2023-01-01',
      fim: '2023-12-31',
      valor: { tipo: 'inteiro', valor: 90 },
    },
    {
      id: 'pontos-mulher-2024',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2024-01-01',
      fim: '2024-12-31',
      valor: { tipo: 'inteiro', valor: 91 },
    },
    {
      id: 'pontos-mulher-2025',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2025-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'inteiro', valor: 92 },
    },
    {
      id: 'pontos-mulher-2026',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2026-01-01',
      fim: '2026-12-31',
      valor: { tipo: 'inteiro', valor: 93 },
    },
    {
      id: 'pontos-mulher-2027',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2027-01-01',
      fim: '2027-12-31',
      valor: { tipo: 'inteiro', valor: 94 },
    },
    {
      id: 'pontos-mulher-2028',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2028-01-01',
      fim: '2028-12-31',
      valor: { tipo: 'inteiro', valor: 95 },
    },
    {
      id: 'pontos-mulher-2029',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2029-01-01',
      fim: '2029-12-31',
      valor: { tipo: 'inteiro', valor: 96 },
    },
    {
      id: 'pontos-mulher-2030',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2030-01-01',
      fim: '2030-12-31',
      valor: { tipo: 'inteiro', valor: 97 },
    },
    {
      id: 'pontos-mulher-2031',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2031-01-01',
      fim: '2031-12-31',
      valor: { tipo: 'inteiro', valor: 98 },
    },
    {
      id: 'pontos-mulher-2032',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2032-01-01',
      fim: '2032-12-31',
      valor: { tipo: 'inteiro', valor: 99 },
    },
    {
      id: 'pontos-mulher-2033',
      parametroId: 'aposentadoria-pontos-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2033-01-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 100 },
    },
    {
      id: 'pontos-homem-2019',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2019-11-13',
      fim: '2019-12-31',
      valor: { tipo: 'inteiro', valor: 96 },
    },
    {
      id: 'pontos-homem-2020',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2020-01-01',
      fim: '2020-12-31',
      valor: { tipo: 'inteiro', valor: 97 },
    },
    {
      id: 'pontos-homem-2021',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2021-01-01',
      fim: '2021-12-31',
      valor: { tipo: 'inteiro', valor: 98 },
    },
    {
      id: 'pontos-homem-2022',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2022-01-01',
      fim: '2022-12-31',
      valor: { tipo: 'inteiro', valor: 99 },
    },
    {
      id: 'pontos-homem-2023',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2023-01-01',
      fim: '2023-12-31',
      valor: { tipo: 'inteiro', valor: 100 },
    },
    {
      id: 'pontos-homem-2024',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2024-01-01',
      fim: '2024-12-31',
      valor: { tipo: 'inteiro', valor: 101 },
    },
    {
      id: 'pontos-homem-2025',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2025-01-01',
      fim: '2025-12-31',
      valor: { tipo: 'inteiro', valor: 102 },
    },
    {
      id: 'pontos-homem-2026',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2026-01-01',
      fim: '2026-12-31',
      valor: { tipo: 'inteiro', valor: 103 },
    },
    {
      id: 'pontos-homem-2027',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2027-01-01',
      fim: '2027-12-31',
      valor: { tipo: 'inteiro', valor: 104 },
    },
    {
      id: 'pontos-homem-2028',
      parametroId: 'aposentadoria-pontos-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2028-01-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 105 },
    },
    {
      id: 'tempo-minimo-mulher-2019',
      parametroId: 'aposentadoria-tempo-minimo-mulher',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2019-11-13',
      fim: null,
      valor: { tipo: 'inteiro', valor: 30 },
    },
    {
      id: 'tempo-minimo-homem-2019',
      parametroId: 'aposentadoria-tempo-minimo-homem',
      fonteId: 'ec-103-2019-art-15',
      inicio: '2019-11-13',
      fim: null,
      valor: { tipo: 'inteiro', valor: 35 },
    },
  ],
}
