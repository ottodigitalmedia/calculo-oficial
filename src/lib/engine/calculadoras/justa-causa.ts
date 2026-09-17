/**
 * CALC-092 — Rescisão por justa causa.
 *
 * **A calculadora mais curta do bloco de desligamento, e é esse o ponto.** Na
 * justa causa quase tudo some: não há aviso prévio, não há 13º proporcional
 * (Lei nº 4.090/1962, art. 3º, que só alcança a rescisão "sem justa causa"),
 * não há férias proporcionais (Súmula 171 do TST) e não há multa nem saque do
 * FGTS. Sobram duas verbas — o saldo de salário e as férias já adquiridas.
 *
 * **O que a memória precisa mostrar não é só o que entra: é o que NÃO entra, e
 * por quê.** Quem procura esta conta costuma estar conferindo um termo de
 * rescisão que veio muito menor do que esperava, e a pergunta real é "isso está
 * certo?". Um total sem a lista do que foi excluído não responde.
 *
 * As incidências seguem `docs/19`: o saldo de salário é salarial e sofre INSS e
 * imposto de renda; as férias vencidas pagas na rescisão são indenizatórias —
 * fora da base do INSS (Lei nº 8.212/1991, art. 28, § 9º, "d") e isentas de
 * imposto (Súmula 386 do STJ).
 */

import { lerData } from '../datas'
import { calcularInss } from '../inss'
import { calcularIrrf } from '../irrf'
import { multiplicarPorInteiro, proporcao, somar, subtrair } from '../money'
import { fundamentar, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import {
  CLT_ART_146,
  LEI_4090_ART_3,
  LEI_8036_ART_20,
  LEI_8212_ART_28,
  STJ_SUMULA_386,
  TST_SUMULA_171,
} from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

/** O dia do mensalista é um trinta avos — CLT, art. 64, como em `rescisao.ts`. */
const DIAS_DO_MES_COMERCIAL = 30

export interface EntradaJustaCausa {
  readonly desligamento: DataISO
  readonly salario: Centavos
  /** Períodos aquisitivos completos e não gozados. Zero é o caso comum. */
  readonly periodosVencidos: number
  readonly dependentes: number
}

export interface SaidaJustaCausa {
  readonly totalLiquido: Centavos
  readonly totalBruto: Centavos
  readonly saldoSalario: Centavos
  readonly feriasVencidas: Centavos
  readonly inss: Centavos
  readonly irrf: Centavos
  /** Dias trabalhados no mês do desligamento. */
  readonly diasTrabalhados: number
}

/** Máximo de períodos aquisitivos acumulados que a entrada aceita. Sanidade. */
const PERIODOS_MAXIMO = 5

export function calcularJustaCausa(
  entrada: EntradaJustaCausa,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaJustaCausa> {
  const desligamento = lerData(entrada.desligamento)
  if (!desligamento) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a data do desligamento.' }
  }
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o último salário bruto para ver o resultado.' }
  }
  if (
    !Number.isInteger(entrada.periodosVencidos) ||
    entrada.periodosVencidos < 0 ||
    entrada.periodosVencidos > PERIODOS_MAXIMO
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Informe de zero a cinco períodos de férias vencidas.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>()

  // --- Saldo de salário -----------------------------------------------------
  const saldoSalario = proporcao(entrada.salario, desligamento.dia, DIAS_DO_MES_COMERCIAL, POLITICA)
  etapas.push({
    rotulo: 'Saldo de salário',
    formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${desligamento.dia} dia(s) trabalhado(s)`,
    resultado: saldoSalario,
    justificativa:
      'Os dias trabalhados no mês são devidos em qualquer modalidade de rescisão — inclusive na justa causa.',
  })

  // --- Férias vencidas + 1/3 ------------------------------------------------
  const feriasBase = multiplicarPorInteiro(entrada.salario, entrada.periodosVencidos)
  const terco = proporcao(feriasBase, 1, 3, POLITICA)
  const feriasVencidas = somar(feriasBase, terco)

  if (entrada.periodosVencidos > 0) {
    etapas.push({
      rotulo: 'Férias vencidas + 1/3',
      formula: `${reais(entrada.salario)} × ${entrada.periodosVencidos} + ${reais(terco)} (terço constitucional)`,
      resultado: feriasVencidas,
      fundamento: fundamentar(CLT_ART_146),
      justificativa:
        'O art. 146 manda pagar as férias já adquiridas "qualquer que seja a causa" da cessação do contrato. ' +
        'A justa causa tira as proporcionais, não as vencidas.',
    })
  }

  // --- O que a justa causa retira -------------------------------------------
  etapas.push({
    rotulo: 'Sem 13º proporcional',
    formula: 'A gratificação da rescisão é devida na rescisão sem justa causa',
    resultado: ZERO,
    fundamento: fundamentar(LEI_4090_ART_3),
    justificativa:
      'O art. 3º da Lei nº 4.090/1962 prevê a gratificação proporcional para a rescisão "sem justa causa" — ' +
      'e é só nessa hipótese que a lei manda pagá-la na saída.',
  })
  etapas.push({
    rotulo: 'Sem férias proporcionais',
    formula: 'A exceção da súmula é exatamente a dispensa por justa causa',
    resultado: ZERO,
    fundamento: fundamentar(TST_SUMULA_171),
    justificativa:
      'Nas demais formas de extinção, as férias proporcionais são devidas mesmo com o período aquisitivo ' +
      'incompleto. Na justa causa, não.',
  })
  etapas.push({
    rotulo: 'Sem multa do FGTS e sem saque',
    formula: 'A dispensa por justa causa não está entre as hipóteses de movimentação',
    resultado: ZERO,
    fundamento: fundamentar(LEI_8036_ART_20),
    justificativa:
      'Os depósitos continuam na conta vinculada e podem ser sacados nas outras hipóteses da lei — ' +
      'aposentadoria, doença grave, compra da casa própria, saque-aniversário.',
  })
  etapas.push({
    rotulo: 'Sem aviso prévio',
    formula: 'Não há aviso a receber nem prazo a cumprir',
    resultado: ZERO,
    justificativa:
      'A justa causa rompe o contrato de imediato. Também não há seguro-desemprego: o programa exige ' +
      'dispensa sem justa causa.',
  })

  // --- Incidências ----------------------------------------------------------
  const previdencia = calcularInss({ salarioContribuicao: saldoSalario }, dataReferencia, registro)
  if (!previdencia.ok) return previdencia
  for (const e of previdencia.traco.etapas) etapas.push(e)
  for (const v of previdencia.traco.vigenciasAplicadas) vigencias.add(v)

  if (entrada.periodosVencidos > 0) {
    etapas.push({
      rotulo: 'Férias vencidas — fora da base do INSS e isentas de imposto',
      formula: `${reais(feriasVencidas)} sem desconto`,
      resultado: ZERO,
      fundamento: fundamentar(LEI_8212_ART_28),
      justificativa:
        'Pagas na rescisão, as férias e o terço têm natureza indenizatória: o art. 28, § 9º, "d", da Lei nº ' +
        '8.212/1991 as exclui da contribuição, e a Súmula 386 do STJ afasta o imposto de renda.',
    })
    etapas.push({
      rotulo: 'Imposto de renda — férias indenizadas',
      formula: 'Isentas',
      resultado: ZERO,
      fundamento: fundamentar(STJ_SUMULA_386),
    })
  }

  const imposto = calcularIrrf(
    {
      rendimentoBruto: saldoSalario,
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

  // --- Totais ---------------------------------------------------------------
  const totalBruto = somar(saldoSalario, feriasVencidas)
  const descontos = somar(previdencia.valores.contribuicao, imposto.valores.imposto)
  const totalLiquido = subtrair(totalBruto, descontos)

  etapas.push({
    rotulo: 'Total bruto',
    formula:
      entrada.periodosVencidos > 0
        ? `${reais(saldoSalario)} + ${reais(feriasVencidas)}`
        : reais(saldoSalario),
    resultado: totalBruto,
  })
  etapas.push({
    rotulo: 'Total líquido',
    formula: `${reais(totalBruto)} − ${reais(descontos)} de INSS e imposto`,
    resultado: totalLiquido,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: {
      totalLiquido,
      totalBruto,
      saldoSalario,
      feriasVencidas,
      inss: previdencia.valores.contribuicao,
      irrf: imposto.valores.imposto,
      diasTrabalhados: desligamento.dia,
    },
    traco,
  }
}

/** Reexportado para o teste conferir o limite sem duplicar o número. */
export const PERIODOS_VENCIDOS_MAXIMO = PERIODOS_MAXIMO
