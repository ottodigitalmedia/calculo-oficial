/**
 * O Microempreendedor Individual — CALC-047 (DAS-MEI) e CALC-052 (limite).
 *
 * O DAS do MEI é a soma de parcelas FIXAS, e não um percentual do faturamento.
 * É a característica que define o regime, e a que mais surpreende quem chega:
 * faturar mil ou seis mil reais no mês não muda o valor da guia.
 *
 * COMO O VALOR DO INSS FOI OBTIDO — E POR QUE NÃO SÃO OS R$ 45,65 DA LEI
 *
 * A alínea "a" do art. 18-A, § 3º, V traz **R$ 45,65**, valor nominal de 2008.
 * Ele não é o que se paga: o § 11 do mesmo artigo manda reajustá-lo "de forma a
 * manter equivalência com a contribuição de que trata o § 2º do art. 21 da Lei
 * nº 8.212" — que é a alíquota de 5% sobre o limite mínimo, já cadastrada em
 * `inss-individual.ts` pelo mesmo dispositivo.
 *
 * Por isso o parâmetro daqui é o **percentual**, não o valor: cadastrar R$ 45,65
 * seria copiar o texto e errar o número; cadastrar um valor em reais atualizado
 * à mão seria inventar uma vigência que nenhuma norma fixa. O percentual com a
 * regra de equivalência é o que a lei de fato determina.
 *
 * A TRANSIÇÃO DA REFORMA TRIBUTÁRIA, E POR QUE ELA NÃO BLOQUEIA A CALCULADORA
 *
 * O art. 516 da LC 214/2025 substitui as alíneas "b" e "c" — os R$ 1,00 de ICMS
 * e R$ 5,00 de ISS — por remissões ao **Anexo VII**, que traz uma tabela com
 * ICMS, ISS, CBS e IBS ano a ano. A leitura do texto consolidado da LC 123
 * sozinha não resolve: ela marca as alíneas com "(Vide LC 214/2025)" e não diz
 * a partir de quando.
 *
 * **Quem resolve é o próprio Anexo VII**, que declara a vigência de cada linha:
 * a primeira começa em **1º/1/2027**. Até 31/12/2026 valem os valores das
 * alíneas "b" e "c".
 *
 * **As vigências de 2027 em diante foram cadastradas e depois REMOVIDAS.**
 * Parecia virtude — a lei já fixou a tabela até 2033, por que não registrá-la?
 * Porque o seletor de período de uma calculadora é derivado das vigências dos
 * parâmetros que ela usa, e cadastrar o futuro de UM parâmetro passou a oferecer
 * os anos de 2027 a 2033 numa página cujo outro parâmetro — o salário mínimo —
 * só existe até 2026. O resultado, medido em produção: a página abria em 2033,
 * anunciava "parâmetros legais vigentes em 15/06/2033" e calculava o INSS com o
 * salário mínimo de 2026, silenciosamente. É a extrapolação que `RN-003` existe
 * para impedir, entrando pela porta dos fundos.
 *
 * Elas voltam quando o salário mínimo dos anos correspondentes existir — o mesmo
 * critério de `RN-003`. Ver `ESTADO-DO-PROJETO` §7.48.
 *
 * O Anexo discrimina, em 2027-2028, CBS de R$ 0,994 e IBS de R$ 0,006 — três
 * casas decimais, que não cabem no invariante de centavos (`ADR-004` A-1). A
 * soma é exatamente R$ 1,00, e é ela que sairia do bolso: a divisão entre os
 * dois tributos é repartição de receita entre entes federativos.
 *
 * POR QUE NÃO HÁ VIGÊNCIA ANTERIOR A 2025
 *
 * Os valores existem desde 2009, mas o produto não os oferece: o salário mínimo
 * cadastrado começa em 2025, e a cobertura combinada é a interseção. Cadastrar
 * datas de início que não foram conferidas nas leis de origem, para vigências
 * que ninguém pode usar, seria afirmar um fato sem fonte.
 */

import type { ConjuntoDeParametros } from '../tipos'
import {
  LC123_ART_18A_LIMITES,
  LC123_ART_18A_P7,
  LC123_ART_18A_P11,
  LC123_ART_18A_V,
  LC214_ANEXO_VII,
} from './fontes'

export const MEI: ConjuntoDeParametros = {
  fontes: [
    LC123_ART_18A_V,
    LC123_ART_18A_P11,
    LC123_ART_18A_LIMITES,
    LC123_ART_18A_P7,
    LC214_ANEXO_VII,
  ],

  parametros: [
    {
      id: 'mei-inss-percentual',
      nome: 'INSS do MEI',
      descricao:
        'Percentual do limite mínimo do salário-de-contribuição recolhido a título de contribuição previdenciária, por equivalência do § 11.',
      tipo: 'percentual',
    },
    {
      id: 'mei-icms-valor-fixo',
      nome: 'ICMS do MEI',
      descricao: 'Valor fixo mensal de ICMS, devido pelo MEI contribuinte desse imposto.',
      tipo: 'valor_monetario',
    },
    {
      id: 'mei-iss-valor-fixo',
      nome: 'ISS do MEI',
      descricao: 'Valor fixo mensal de ISS, devido pelo MEI contribuinte desse imposto.',
      tipo: 'valor_monetario',
    },
    {
      id: 'mei-ibs-cbs-valor-fixo',
      nome: 'IBS e CBS do MEI',
      descricao:
        'Valor fixo mensal de IBS e CBS somados, conforme o Anexo VII da LC 214/2025. Zero antes de 2027.',
      tipo: 'valor_monetario',
    },
    {
      id: 'mei-limite-receita-anual',
      nome: 'Limite de receita bruta anual do MEI',
      descricao: 'Receita bruta do ano-calendário anterior que admite o enquadramento como MEI.',
      tipo: 'valor_monetario',
    },
    {
      id: 'mei-limite-mensal-inicio',
      nome: 'Limite mensal no ano de início de atividade',
      descricao:
        'Valor multiplicado pelo número de meses entre o início da atividade e o fim do ano-calendário.',
      tipo: 'valor_monetario',
    },
    {
      id: 'mei-tolerancia-excesso',
      nome: 'Tolerância do excesso de receita',
      descricao:
        'Percentual de excesso até o qual o desenquadramento produz efeitos só no ano seguinte, em vez de retroagir.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // INSS — 5% do limite mínimo, por equivalência do § 11 com o art. 21, § 2º,
    // II, "a", da Lei nº 8.212/1991.
    // -----------------------------------------------------------------------
    {
      id: 'mei-inss-2025',
      parametroId: 'mei-inss-percentual',
      fonteId: 'lc-123-2006-art-18a-p11',
      inicio: '2025-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 500 },
      observacao:
        'A alínea "a" traz o valor nominal de R$ 45,65, de 2008. O § 11 manda reajustá-lo mantendo equivalência com a contribuição do § 2º do art. 21 da Lei nº 8.212 — 5% do limite mínimo. É o percentual, e não o valor nominal, que a norma determina.',
    },

    // -----------------------------------------------------------------------
    // ICMS e ISS — alíneas "b" e "c" até 31/12/2026; Anexo VII da LC 214/2025
    // a partir de 1º/1/2027, com vigência declarada linha a linha no Anexo.
    // -----------------------------------------------------------------------
    {
      id: 'mei-icms-ate-2026',
      parametroId: 'mei-icms-valor-fixo',
      fonteId: 'lc-123-2006-art-18a-v',
      inicio: '2025-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 100 },
    },
    {
      id: 'mei-iss-ate-2026',
      parametroId: 'mei-iss-valor-fixo',
      fonteId: 'lc-123-2006-art-18a-v',
      inicio: '2025-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 500 },
    },
    {
      id: 'mei-ibs-cbs-ate-2026',
      parametroId: 'mei-ibs-cbs-valor-fixo',
      fonteId: 'lc-214-2025-anexo-vii',
      inicio: '2025-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 0 },
      observacao:
        'O Anexo VII da LC 214/2025 começa a valer em 1º/1/2027 e passa a incluir IBS e CBS. As vigências dele NÃO foram cadastradas — ver a nota de topo deste arquivo.',
    },

    // -----------------------------------------------------------------------
    // Limites e tolerância — CALC-052.
    // -----------------------------------------------------------------------
    {
      id: 'mei-limite-anual-2018',
      parametroId: 'mei-limite-receita-anual',
      fonteId: 'lc-123-2006-art-18a-limites',
      inicio: '2025-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 8_100_000 },
      observacao:
        'Redação da LC nº 188/2021. O valor de R$ 81.000,00 já vinha da LC nº 155/2016; não foram cadastradas vigências anteriores a 2025 porque o produto não as oferece.',
    },
    {
      id: 'mei-limite-mensal-2018',
      parametroId: 'mei-limite-mensal-inicio',
      fonteId: 'lc-123-2006-art-18a-limites',
      inicio: '2025-01-01',
      fim: null,
      valor: { tipo: 'valor_monetario', centavos: 675_000 },
      observacao: 'R$ 6.750,00 por mês de atividade, redação da LC nº 155/2016.',
    },
    {
      id: 'mei-tolerancia-2008',
      parametroId: 'mei-tolerancia-excesso',
      fonteId: 'lc-123-2006-art-18a-p7',
      inicio: '2025-01-01',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 2_000 },
      observacao:
        'Até 20% de excesso, o desenquadramento vale de 1º de janeiro do ano seguinte; acima disso, retroage ao ano da ocorrência.',
    },
  ],
}
