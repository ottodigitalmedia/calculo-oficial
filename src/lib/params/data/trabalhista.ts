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
import {
  CF_ART_7_XVI,
  CLT_ART_73,
  CLT_ART_484A,
  CLT_ART_484A_AVISO,
  CLT_ART_484A_SAQUE,
  LEI_8036_ART_15,
  LEI_8036_ART_18,
  LEI_12506_2011,
} from './fontes'

export const TRABALHISTA: ConjuntoDeParametros = {
  fontes: [
    LEI_8036_ART_15,
    LEI_8036_ART_18,
    LEI_12506_2011,
    CF_ART_7_XVI,
    CLT_ART_73,
    CLT_ART_484A,
    CLT_ART_484A_AVISO,
    CLT_ART_484A_SAQUE,
  ],

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
      id: 'hora-extra-adicional-minimo',
      nome: 'Adicional mínimo da hora extraordinária',
      descricao: 'Percentual mínimo sobre a hora normal, garantido pela Constituição.',
      tipo: 'percentual',
    },
    {
      id: 'adicional-noturno',
      nome: 'Adicional noturno',
      descricao: 'Acréscimo sobre a hora diurna para o trabalho executado entre 22h e 5h.',
      tipo: 'percentual',
    },
    {
      id: 'hora-noturna-segundos',
      nome: 'Duração da hora noturna',
      descricao: 'A hora do trabalho noturno é computada como período reduzido.',
      tipo: 'inteiro',
    },
    {
      id: 'fgts-multa-acordo-mutuo',
      nome: 'Multa do FGTS — extinção por acordo',
      descricao: 'Metade da indenização do art. 18, § 1º, da Lei nº 8.036/1990.',
      tipo: 'percentual',
    },
    {
      id: 'aviso-previo-fracao-acordo',
      nome: 'Aviso prévio indenizado — fração devida na extinção por acordo',
      descricao:
        'Percentual do aviso prévio indenizado devido quando o contrato é extinto por acordo entre as partes.',
      tipo: 'percentual',
    },
    {
      id: 'fgts-saque-acordo-mutuo',
      nome: 'FGTS — limite de saque na extinção por acordo',
      descricao:
        'Percentual máximo dos depósitos da conta vinculada que o trabalhador pode movimentar na extinção por acordo.',
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
    // -----------------------------------------------------------------------
    // Jornada
    //
    //   CF, art. 7º, XVI: "remuneração do serviço extraordinário superior, no
    //     mínimo, em cinquenta por cento à do normal"
    //   CLT, art. 73: "acréscimo de 20% (vinte por cento), pelo menos, sobre a
    //     hora diurna"; § 1º: "A hora do trabalho noturno será computada como
    //     de 52 minutos e 30 segundos" — 3.150 segundos
    // -----------------------------------------------------------------------
    {
      id: 'hora-extra-2088',
      parametroId: 'hora-extra-adicional-minimo',
      fonteId: 'cf-1988-art-7-xvi',
      inicio: '1988-10-05',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 5_000 },
      observacao:
        'É o mínimo constitucional. Convenção coletiva pode elevá-lo, e o trabalho em domingo ou feriado costuma ser remunerado a 100% — por isso a calculadora aceita os dois adicionais em campos separados.',
    },
    {
      id: 'adicional-noturno-1946',
      parametroId: 'adicional-noturno',
      fonteId: 'clt-art-73',
      inicio: '1943-05-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
    },
    {
      id: 'hora-noturna-1946',
      parametroId: 'hora-noturna-segundos',
      fonteId: 'clt-art-73',
      inicio: '1943-05-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 3_150 },
      observacao:
        '52 minutos e 30 segundos. A razão 3.600/3.150 faz 7 horas de relógio valerem 8 horas noturnas.',
    },
    {
      id: 'fgts-multa-acordo-2017',
      parametroId: 'fgts-multa-acordo-mutuo',
      fonteId: 'clt-art-484a',
      inicio: '2017-11-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
      observacao:
        'Metade dos 40% do art. 18, § 1º, da Lei nº 8.036/1990, conforme o art. 484-A, I, "b", da CLT. A movimentação da conta fica limitada a 80% dos depósitos (§ 1º).',
    },

    // -----------------------------------------------------------------------
    // Extinção por acordo — CLT, art. 484-A (Lei nº 13.467/2017)
    //
    //   "I - por metade:
    //     a) o aviso prévio, se indenizado; e
    //     b) a indenização sobre o saldo do Fundo de Garantia [...]
    //    II - na integralidade, as demais verbas trabalhistas.
    //    § 1º A extinção do contrato prevista no caput deste artigo permite a
    //    movimentação da conta vinculada [...] limitada até 80% (oitenta por
    //    cento) do valor dos depósitos."
    //
    // Repare no SE da alínea "a": só o aviso indenizado é reduzido. O aviso
    // trabalhado é salário do período, e salário não se paga pela metade.
    // -----------------------------------------------------------------------
    {
      id: 'aviso-previo-fracao-acordo-2017',
      parametroId: 'aviso-previo-fracao-acordo',
      fonteId: 'clt-art-484a-aviso',
      inicio: '2017-11-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 5_000 },
      observacao:
        'Aplica-se apenas ao aviso indenizado. O aviso trabalhado é salário do período e não sofre redução. O número de DIAS continua sendo o da Lei nº 12.506/2011 — o que a norma reduz é a verba, não o prazo.',
    },
    {
      id: 'fgts-saque-acordo-2017',
      parametroId: 'fgts-saque-acordo-mutuo',
      fonteId: 'clt-art-484a-saque',
      inicio: '2017-11-11',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 8_000 },
      observacao:
        'Limite de movimentação da conta vinculada, não valor devido: os 20% restantes continuam na conta do trabalhador. O § 2º veda o ingresso no Programa de Seguro-Desemprego.',
    },

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
