/**
 * Licença-maternidade e licença-paternidade, com a prorrogação do Programa
 * Empresa Cidadã.
 *
 * Lote 2 da expansão do catálogo — CALC-086 e CALC-087. Transcrição literal de
 * cada dispositivo em `fontes.ts`, junto da fonte.
 *
 * **A paternidade muda três vezes em três anos, e é por isso que este arquivo
 * existe com vigências.** Cinco dias pelo ADCT até 31/12/2026; dez em 2027 e
 * quinze em 2028 pela Lei nº 15.371/2026. Os vinte dias de 2029 dependem de meta
 * fiscal (art. 11, §§ 1º e 2º) e NÃO estão cadastrados: a vigência de 2028 fecha
 * em 31/12/2028, e um nascimento a partir de 2029 bloqueia o cálculo (`RN-003`)
 * em vez de adivinhar se valem quinze ou vinte.
 *
 * **As vigências são resolvidas pela data do nascimento ou do início da
 * licença**, que é o fato que define a duração — mesmo precedente de CALC-072,
 * que resolve cada feriado pelo dia, e não pela data de referência da página.
 */

import type { ConjuntoDeParametros } from '../tipos'
import {
  ADCT_ART_10_P1,
  CF_ART_7_XVIII,
  CLT_ART_392,
  LEI_11770_ART_1,
  LEI_15371_ART_10,
  LEI_15371_ART_11,
} from './fontes'

export const LICENCAS: ConjuntoDeParametros = {
  fontes: [CF_ART_7_XVIII, CLT_ART_392, ADCT_ART_10_P1, LEI_15371_ART_11, LEI_11770_ART_1, LEI_15371_ART_10],

  parametros: [
    {
      id: 'licenca-maternidade-dias',
      nome: 'Licença-maternidade — duração',
      descricao: 'Dias de licença à gestante, sem prejuízo do emprego e do salário.',
      tipo: 'inteiro',
    },
    {
      id: 'licenca-maternidade-inicio-antes-do-parto',
      nome: 'Licença-maternidade — início mais cedo',
      descricao: 'Quantos dias antes do parto o afastamento pode começar, mediante atestado médico.',
      tipo: 'inteiro',
    },
    {
      id: 'licenca-paternidade-dias',
      nome: 'Licença-paternidade — duração',
      descricao: 'Dias de licença-paternidade obrigatória, contados do nascimento, da adoção ou da guarda.',
      tipo: 'inteiro',
    },
    {
      id: 'empresa-cidada-maternidade-dias',
      nome: 'Empresa Cidadã — prorrogação da licença-maternidade',
      descricao: 'Dias acrescidos à licença-maternidade na empresa que aderiu ao Programa Empresa Cidadã.',
      tipo: 'inteiro',
    },
    {
      id: 'empresa-cidada-paternidade-dias',
      nome: 'Empresa Cidadã — prorrogação da licença-paternidade',
      descricao: 'Dias acrescidos à licença-paternidade na empresa que aderiu ao Programa Empresa Cidadã.',
      tipo: 'inteiro',
    },
  ],

  vigencias: [
    // -----------------------------------------------------------------------
    // CF, art. 7º, XVIII — cento e vinte dias, desde a promulgação.
    // -----------------------------------------------------------------------
    {
      id: 'licenca-maternidade-1988',
      parametroId: 'licenca-maternidade-dias',
      fonteId: 'cf-1988-art-7-xviii',
      inicio: '1988-10-05',
      fim: null,
      valor: { tipo: 'inteiro', valor: 120 },
      observacao:
        'O afastamento pode começar entre o 28º dia antes do parto e o parto (CLT, art. 392, § 1º). Atestado médico pode aumentar em duas semanas os repousos antes e depois do parto (§ 2º), e internação ligada ao parto que passe dessas duas semanas estende a licença (§ 7º).',
    },

    // CLT, art. 392, § 1º (red. Lei nº 10.421/2002, DOU de 16/04/2002, em vigor
    // na publicação — art. 6º): "entre o 28º (vigésimo oitavo) dia antes do
    // parto e ocorrência deste".
    {
      id: 'licenca-maternidade-inicio-2002',
      parametroId: 'licenca-maternidade-inicio-antes-do-parto',
      fonteId: 'clt-art-392',
      inicio: '2002-04-16',
      fim: null,
      valor: { tipo: 'inteiro', valor: 28 },
    },

    // -----------------------------------------------------------------------
    // Licença-paternidade: ADCT até 2026; Lei nº 15.371/2026 a partir de 2027.
    // -----------------------------------------------------------------------
    {
      id: 'licenca-paternidade-adct',
      parametroId: 'licenca-paternidade-dias',
      fonteId: 'adct-art-10-p1',
      inicio: '1988-10-05',
      fim: '2026-12-31',
      valor: { tipo: 'inteiro', valor: 5 },
      observacao:
        'Regra transitória "até que a lei venha a disciplinar" a licença. A lei veio — a Lei nº 15.371/2026 —, e entra em vigor em 1º/01/2027.',
    },
    {
      id: 'licenca-paternidade-2027',
      parametroId: 'licenca-paternidade-dias',
      fonteId: 'lei-15371-2026-art-11',
      inicio: '2027-01-01',
      fim: '2027-12-31',
      valor: { tipo: 'inteiro', valor: 10 },
    },
    {
      id: 'licenca-paternidade-2028',
      parametroId: 'licenca-paternidade-dias',
      fonteId: 'lei-15371-2026-art-11',
      inicio: '2028-01-01',
      fim: '2028-12-31',
      valor: { tipo: 'inteiro', valor: 15 },
      observacao:
        'Encerrada em 31/12/2028 de propósito. O art. 11, III, prevê vinte dias a partir de 2029, mas só se a meta fiscal for cumprida (§ 1º); se não for, a mudança passa para o segundo exercício seguinte (§ 2º). Até se saber qual dos dois vale, a calculadora não calcula nascimentos de 2029 em diante.',
    },

    // -----------------------------------------------------------------------
    // Empresa Cidadã — Lei nº 11.770/2008, art. 1º.
    //
    // A cobertura começa em 2025, e não em 2008 ou 2016: a produção de efeitos
    // dessas prorrogações foi condicionada à estimativa da renúncia fiscal (art.
    // 8º da Lei nº 11.770; art. 40 da Lei nº 13.257), e a data resultante não
    // está no texto de nenhuma das duas leis. Em 2025 a regra está em vigor sem
    // dúvida; antes disso, `RN-003` bloqueia em vez de supor.
    // -----------------------------------------------------------------------
    {
      id: 'empresa-cidada-maternidade-2025',
      parametroId: 'empresa-cidada-maternidade-dias',
      fonteId: 'lei-11770-2008-art-1',
      inicio: '2025-01-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 60 },
      observacao:
        'Só vale se a empresa aderiu ao programa e a empregada pediu até o fim do primeiro mês após o parto. A prorrogação começa logo depois da licença de cento e vinte dias. Início de cobertura cadastrado: 2025 — ver o comentário do arquivo.',
    },
    {
      id: 'empresa-cidada-paternidade-2025',
      parametroId: 'empresa-cidada-paternidade-dias',
      fonteId: 'lei-11770-2008-art-1',
      inicio: '2025-01-01',
      fim: '2026-12-31',
      valor: { tipo: 'inteiro', valor: 15 },
      observacao:
        'Além dos cinco dias do ADCT. O empregado precisa pedir em até dois dias úteis após o parto e comprovar participação em programa de orientação sobre paternidade responsável (art. 1º, § 1º, II). Início de cobertura cadastrado: 2025.',
    },
    {
      id: 'empresa-cidada-paternidade-2027',
      parametroId: 'empresa-cidada-paternidade-dias',
      fonteId: 'lei-15371-2026-art-10',
      inicio: '2027-01-01',
      fim: null,
      valor: { tipo: 'inteiro', valor: 15 },
      observacao: 'Mesmos quinze dias, agora "além do período obrigatório fixado em lei".',
    },
  ],
}
