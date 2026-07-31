/**
 * CALC-004 — Férias · CALC-005 — 13º salário.
 *
 * Ficam no mesmo arquivo porque **o 13º aparece dentro das férias**: a Lei nº
 * 4.749/1965, art. 2º, § 2º, permite receber o adiantamento da gratificação ao
 * ensejo das férias, e `03-functional-spec` §3.4 tem o campo para isso. Separar
 * os dois obrigaria um a importar o outro de qualquer forma.
 *
 * A diferença de incidência entre eles é o ponto que mais engana:
 *
 *   férias GOZADAS + terço   integram o salário-de-contribuição (RPS art. 214,
 *                            § 4º) e são tributáveis — natureza salarial
 *   abono pecuniário         NÃO integra a remuneração (CLT art. 144) nem a
 *                            base do imposto
 *   1ª parcela do 13º        adiantamento: sem INSS e sem imposto, que só
 *                            incidem no pagamento da última parcela
 *                            (RPS art. 216, § 1º)
 *
 * A pesquisa está em `docs/19-incidencias-verbas-rescisorias.md`; as férias
 * indenizadas, que seguem regra oposta, ficam em `rescisao.ts`.
 *
 * Regras: `RN-010`, `RN-015`, `RN-016`.
 */

import { calcularInss } from '../inss'
import { calcularIrrf } from '../irrf'
import { minimo, naoNegativo, proporcao, somar, subtrair } from '../money'
import { fundamentar, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import {
  CF_ART_7_XVII,
  CLT_ART_143,
  LEI_4749_ART_2,
  RPS_ART_214,
  RPS_ART_216,
  TST_SUMULA_45,
} from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const
const DIAS_DO_MES_COMERCIAL = 30
const AVOS_NO_ANO = 12
/** O terço constitucional é 1/3 — CF, art. 7º, XVII. */
const DIVISOR_DO_TERCO = 3
/** O abono converte 1/3 do período — CLT, art. 143. */
const DIVISOR_DO_ABONO = 3
/** O adiantamento é metade do salário — Lei nº 4.749/1965, art. 2º. */
const DIVISOR_DO_ADIANTAMENTO = 2

// ---------------------------------------------------------------------------
// CALC-005 — 13º salário
// ---------------------------------------------------------------------------

export type Parcela = 'total' | 'primeira' | 'segunda'

export interface EntradaDecimoTerceiro {
  readonly salario: Centavos
  readonly mesesTrabalhados: number
  readonly parcela: Parcela
  readonly mediaVariaveis: Centavos
  readonly dependentes: number
}

export interface SaidaDecimoTerceiro {
  readonly aReceber: Centavos
  readonly totalBruto: Centavos
  readonly primeiraParcela: Centavos
  readonly inss: Centavos
  readonly irrf: Centavos
  readonly avos: number
}

export function calcularDecimoTerceiro(
  entrada: EntradaDecimoTerceiro,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaDecimoTerceiro> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário bruto para ver o resultado.' }
  }
  if (entrada.mesesTrabalhados < 1 || entrada.mesesTrabalhados > AVOS_NO_ANO) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os meses trabalhados devem estar entre 1 e 12.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>()

  // `RN-016` — a base inclui a média das variáveis habituais.
  const base = somar(entrada.salario, entrada.mediaVariaveis)
  if (entrada.mediaVariaveis > 0) {
    etapas.push({
      rotulo: 'Base do 13º',
      formula: `${reais(entrada.salario)} + ${reais(entrada.mediaVariaveis)} (média de variáveis)`,
      resultado: base,
      fundamento: fundamentar(TST_SUMULA_45),
      justificativa:
        'A remuneração do serviço suplementar habitualmente prestado integra o cálculo da ' +
        'gratificação natalina.',
    })
  }

  const totalBruto = proporcao(base, entrada.mesesTrabalhados, AVOS_NO_ANO, POLITICA)
  etapas.push({
    rotulo: '13º proporcional',
    formula: `${reais(base)} × ${entrada.mesesTrabalhados}/12 avos`,
    resultado: totalBruto,
    justificativa: 'Conta como avo integral o mês com 15 dias ou mais de trabalho.',
  })

  /**
   * A 1ª parcela é **metade do salário**, não metade do 13º proporcional.
   *
   * Lei nº 4.749/1965, art. 2º: "metade do salário recebido pelo respectivo
   * empregado no mês anterior". Com poucos avos, metade do salário pode superar
   * o próprio 13º devido — por isso o limite: ninguém adianta mais do que tem a
   * receber.
   */
  const metadeDoSalario = proporcao(entrada.salario, 1, DIVISOR_DO_ADIANTAMENTO, POLITICA)
  const primeiraParcela = minimo(metadeDoSalario, totalBruto)
  etapas.push({
    rotulo: '1ª parcela — adiantamento',
    formula:
      `${reais(entrada.salario)} ÷ 2 = ${reais(metadeDoSalario)}` +
      (primeiraParcela < metadeDoSalario ? `, limitada ao 13º devido (${reais(totalBruto)})` : ''),
    resultado: primeiraParcela,
    fundamento: fundamentar(LEI_4749_ART_2),
    justificativa:
      'A lei fixa o adiantamento em metade do salário do mês anterior, e não em metade do ' +
      '13º proporcional.',
  })

  // `RN-010` / RPS art. 216, § 1º — a contribuição é apurada em separado e só
  // no pagamento da última parcela.
  const previdencia = calcularInss({ salarioContribuicao: totalBruto }, dataReferencia, registro)
  if (!previdencia.ok) return previdencia
  for (const v of previdencia.traco.vigenciasAplicadas) vigencias.add(v)

  etapas.push({
    rotulo: 'Contribuição previdenciária — apurada em separado',
    formula: `${reais(totalBruto)} com tabela própria = ${reais(previdencia.valores.contribuicao)}`,
    resultado: previdencia.valores.contribuicao,
    fundamento: fundamentar(RPS_ART_216),
    justificativa:
      'A contribuição sobre a gratificação natalina é calculada em separado da remuneração ' +
      'mensal, e é devida quando do pagamento da última parcela — a 1ª não sofre desconto.',
  })

  const imposto = calcularIrrf(
    {
      rendimentoBruto: totalBruto,
      inss: previdencia.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: ZERO,
    },
    dataReferencia,
    registro,
  )
  if (!imposto.ok) return imposto
  for (const e of imposto.traco.etapas) etapas.push(e)
  for (const v of imposto.traco.vigenciasAplicadas) vigencias.add(v)

  const segundaParcela = subtrair(
    subtrair(totalBruto, primeiraParcela),
    somar(previdencia.valores.contribuicao, imposto.valores.imposto),
  )

  etapas.push({
    rotulo: '2ª parcela',
    formula:
      `${reais(totalBruto)} − ${reais(primeiraParcela)} (1ª parcela)` +
      ` − ${reais(previdencia.valores.contribuicao)} (INSS)` +
      ` − ${reais(imposto.valores.imposto)} (IRRF)`,
    resultado: segundaParcela,
    justificativa:
      'Os descontos incidem sobre o valor TOTAL do 13º e são cobrados aqui. Por isso a ' +
      '2ª parcela é sempre menor que a 1ª — e pode ser zero quando os avos são poucos.',
  })

  const aReceber =
    entrada.parcela === 'primeira'
      ? primeiraParcela
      : entrada.parcela === 'segunda'
        ? segundaParcela
        : subtrair(totalBruto, somar(previdencia.valores.contribuicao, imposto.valores.imposto))

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }

  return {
    ok: true,
    valores: {
      aReceber,
      totalBruto,
      primeiraParcela,
      inss: previdencia.valores.contribuicao,
      irrf: imposto.valores.imposto,
      avos: entrada.mesesTrabalhados,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-004 — Férias
// ---------------------------------------------------------------------------

export type TipoFerias = 'integrais' | 'proporcionais'

export interface EntradaFerias {
  readonly salario: Centavos
  readonly tipo: TipoFerias
  readonly mesesTrabalhados: number
  readonly diasGozados: number
  readonly abonoPecuniario: boolean
  readonly adiantar13: boolean
  readonly dependentes: number
}

export interface SaidaFerias {
  readonly liquido: Centavos
  readonly remuneracaoFerias: Centavos
  readonly terco: Centavos
  readonly abono: Centavos
  readonly tercoDoAbono: Centavos
  readonly adiantamento13: Centavos
  readonly inss: Centavos
  readonly irrf: Centavos
  readonly diasDeDireito: number
  readonly diasGozados: number
  readonly diasDeAbono: number
}

export function calcularFerias(
  entrada: EntradaFerias,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaFerias> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário bruto para ver o resultado.' }
  }
  const meses = entrada.tipo === 'integrais' ? AVOS_NO_ANO : entrada.mesesTrabalhados
  if (meses < 1 || meses > AVOS_NO_ANO) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os meses do período aquisitivo devem estar entre 1 e 12.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>()

  // Direito em dias: 30 no período completo, proporcional aos avos quando não.
  const diasDeDireito = Math.floor((DIAS_DO_MES_COMERCIAL * meses) / AVOS_NO_ANO)
  etapas.push({
    rotulo: 'Dias de férias a que tem direito',
    formula:
      entrada.tipo === 'integrais'
        ? `Período aquisitivo completo — ${DIAS_DO_MES_COMERCIAL} dias`
        : `${DIAS_DO_MES_COMERCIAL} × ${meses}/12 avos = ${diasDeDireito} dias`,
    resultado: ZERO,
  })

  // `CLT art. 143` — o abono converte 1/3 do período em dinheiro.
  const diasDeAbono = entrada.abonoPecuniario
    ? Math.floor(diasDeDireito / DIVISOR_DO_ABONO)
    : 0
  const diasGozados = Math.max(0, Math.min(entrada.diasGozados, diasDeDireito - diasDeAbono))

  const remuneracaoFerias = proporcao(entrada.salario, diasGozados, DIAS_DO_MES_COMERCIAL, POLITICA)
  etapas.push({
    rotulo: 'Remuneração das férias',
    formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${diasGozados} dia(s) gozado(s)`,
    resultado: remuneracaoFerias,
  })

  const terco = proporcao(remuneracaoFerias, 1, DIVISOR_DO_TERCO, POLITICA)
  etapas.push({
    rotulo: 'Terço constitucional',
    formula: `${reais(remuneracaoFerias)} ÷ 3`,
    resultado: terco,
    fundamento: fundamentar(CF_ART_7_XVII),
  })

  let abono: Centavos = ZERO
  let tercoDoAbono: Centavos = ZERO
  if (diasDeAbono > 0) {
    abono = proporcao(entrada.salario, diasDeAbono, DIAS_DO_MES_COMERCIAL, POLITICA)
    tercoDoAbono = proporcao(abono, 1, DIVISOR_DO_TERCO, POLITICA)
    etapas.push({
      rotulo: 'Abono pecuniário — venda de 1/3 das férias',
      formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${diasDeAbono} dias + ${reais(tercoDoAbono)} (terço)`,
      resultado: somar(abono, tercoDoAbono),
      fundamento: fundamentar(CLT_ART_143),
      justificativa:
        'O abono e o respectivo terço NÃO integram a remuneração para efeito de previdência ' +
        'social nem de imposto de renda.',
    })
  }

  // Adiantamento da 1ª parcela do 13º — Lei nº 4.749/1965, art. 2º, § 2º.
  let adiantamento13: Centavos = ZERO
  if (entrada.adiantar13) {
    adiantamento13 = proporcao(entrada.salario, 1, DIVISOR_DO_ADIANTAMENTO, POLITICA)
    etapas.push({
      rotulo: 'Adiantamento da 1ª parcela do 13º',
      formula: `${reais(entrada.salario)} ÷ 2`,
      resultado: adiantamento13,
      fundamento: fundamentar(LEI_4749_ART_2),
      justificativa:
        'Pago ao ensejo das férias quando requerido em janeiro. É adiantamento: não sofre ' +
        'desconto de INSS nem de imposto de renda agora.',
    })
  }

  // -------------------------------------------------------------------------
  // Incidências
  // -------------------------------------------------------------------------
  const baseTributavel = somar(remuneracaoFerias, terco)

  const previdencia = calcularInss({ salarioContribuicao: baseTributavel }, dataReferencia, registro)
  if (!previdencia.ok) return previdencia
  for (const e of previdencia.traco.etapas) etapas.push(e)
  for (const v of previdencia.traco.vigenciasAplicadas) vigencias.add(v)

  etapas.push({
    rotulo: 'O terço das férias GOZADAS integra o salário-de-contribuição',
    formula: `${reais(terco)} dentro da base do INSS`,
    resultado: terco,
    fundamento: fundamentar(RPS_ART_214),
    justificativa:
      'A remuneração adicional de férias integra o salário-de-contribuição. É o oposto do ' +
      'que ocorre com as férias INDENIZADAS na rescisão, que a lei exclui expressamente.',
  })

  const naoIncidem = somar(abono, tercoDoAbono, adiantamento13)
  if (naoIncidem > 0) {
    etapas.push({
      rotulo: 'Abono e adiantamento ficam fora das duas bases',
      formula: `${reais(naoIncidem)} sem INSS e sem imposto`,
      resultado: ZERO,
      fundamento: fundamentar(CLT_ART_143),
      justificativa:
        'O abono não integra a remuneração (CLT, art. 144) e o adiantamento do 13º só sofre ' +
        'desconto no pagamento da última parcela.',
    })
  }

  const imposto = calcularIrrf(
    {
      rendimentoBruto: baseTributavel,
      inss: previdencia.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: ZERO,
    },
    dataReferencia,
    registro,
  )
  if (!imposto.ok) return imposto
  for (const e of imposto.traco.etapas) etapas.push(e)
  for (const v of imposto.traco.vigenciasAplicadas) vigencias.add(v)

  const bruto = somar(remuneracaoFerias, terco, abono, tercoDoAbono, adiantamento13)
  const liquido = naoNegativo(
    subtrair(bruto, somar(previdencia.valores.contribuicao, imposto.valores.imposto)),
  )

  etapas.push({
    rotulo: 'Valor líquido estimado a receber',
    formula: `${reais(bruto)} − ${reais(previdencia.valores.contribuicao)} (INSS) − ${reais(imposto.valores.imposto)} (IRRF)`,
    resultado: liquido,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }

  return {
    ok: true,
    valores: {
      liquido,
      remuneracaoFerias,
      terco,
      abono,
      tercoDoAbono,
      adiantamento13,
      inss: previdencia.valores.contribuicao,
      irrf: imposto.valores.imposto,
      diasDeDireito,
      diasGozados,
      diasDeAbono,
    },
    traco,
  }
}

export { centavos }
