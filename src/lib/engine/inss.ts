/**
 * Contribuição previdenciária do segurado — `RN-008`, `RN-009`.
 *
 * **Progressiva por faixa.** Quem ganha R$ 5.000 não paga 14% sobre tudo: paga
 * 7,5% sobre a parcela contida na primeira faixa, 9% sobre a da segunda, e
 * assim por diante. Aplicar alíquota única superestima o desconto em centenas
 * de reais, e é o erro mais comum em calculadora feita às pressas.
 *
 * O arredondamento é **do total**, não de cada faixa — ver `somarAliquotasPorFaixa`.
 */

import { aliquotaEfetiva, limitarAoTeto, somarAliquotasPorFaixa, subtrair } from './money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from './traco'
import { type BasisPoints, type Centavos, basisPoints, centavos } from './types'
import type { DataISO } from '../params/tipos'
import type { Registro } from '../params/registry'

export const PARAMETROS_INSS = ['inss-tabela-progressiva'] as const

/**
 * Meio para cima é o padrão dos valores publicados pela Receita nos exemplos
 * de aplicação da Lei nº 15.270/2025, conferido nos quatro rendimentos ali.
 *
 * `> ⚠️ VERIFICAR: nenhuma norma consultada declara a política expressamente.
 * A escolha decorre de conferência contra valores oficiais publicados, o que
 * é evidência forte mas não é o texto da norma. Confirmar na regulamentação.`
 */
const POLITICA = 'meio_para_cima' as const

export interface EntradaInss {
  readonly salarioContribuicao: Centavos
}

export interface SaidaInss {
  readonly contribuicao: Centavos
  /** Base efetivamente usada: o salário, ou o teto quando ele é excedido. */
  readonly baseAplicada: Centavos
  /** Quanto a contribuição representa do salário. Saída secundária de CALC-016. */
  readonly aliquotaEfetiva: BasisPoints
  /** Verdadeiro quando `RN-009` limitou a base. */
  readonly limitadaPeloTeto: boolean
}

export function calcularInss(
  entrada: EntradaInss,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaInss> {
  if (entrada.salarioContribuicao < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O salário de contribuição não pode ser negativo.',
    }
  }

  const tabela = registro.resolver('inss-tabela-progressiva', dataReferencia)
  if (!tabela.ok) {
    // RN-003: sem cobertura, bloqueia. Nunca extrapola a tabela mais recente.
    return { ok: false, motivo: 'vigencia_ausente', detalhe: tabela.detalhe }
  }
  if (tabela.resolvida.vigencia.valor.tipo !== 'tabela_faixas') {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O parâmetro de INSS não é uma tabela de faixas.',
    }
  }

  const faixas = tabela.resolvida.vigencia.valor.faixas
  const traco = new ConstrutorDeTraco(dataReferencia)

  // RN-009 — o teto é o limite superior da última faixa.
  const ultima = faixas[faixas.length - 1]
  const teto = centavos(ultima?.limiteSuperiorCentavos ?? entrada.salarioContribuicao)
  const base = limitarAoTeto(entrada.salarioContribuicao, teto)
  const limitadaPeloTeto = base < entrada.salarioContribuicao

  if (limitadaPeloTeto) {
    traco.passoComParametro(
      'Base limitada ao teto previdenciário',
      `${reais(entrada.salarioContribuicao)} excede o teto de ${reais(teto)}`,
      base,
      tabela.resolvida,
      'A contribuição do segurado não incide sobre a parcela do salário que excede o teto.',
    )
  } else {
    traco.passo(
      'Base de contribuição',
      `Salário de contribuição ${reais(base)}`,
      base,
    )
  }

  // RN-008 — cada faixa incide apenas sobre a parcela nela contida.
  const parcelas: { base: Centavos; aliquota: BasisPoints }[] = []
  let piso = 0

  for (const faixa of faixas) {
    if (base <= piso) break

    const topo = faixa.limiteSuperiorCentavos ?? base
    const parcela = centavos(Math.min(base, topo) - piso)
    const aliquota = basisPoints(faixa.aliquotaBp)
    parcelas.push({ base: parcela, aliquota })

    // O valor da etapa é a contribuição daquela faixa isolada. O total é
    // arredondado uma vez só, então a soma das etapas exibidas pode diferir do
    // total em um centavo — e é por isso que a etapa final mostra a soma.
    const daFaixa = somarAliquotasPorFaixa([{ base: parcela, aliquota }], POLITICA)
    traco.passoComParametro(
      `Contribuição — ${faixa.ordem}ª faixa`,
      `${reais(parcela)} × ${percentual(aliquota)}`,
      daFaixa,
      tabela.resolvida,
    )

    piso = topo
  }

  const contribuicao = somarAliquotasPorFaixa(parcelas, POLITICA)

  traco.passo(
    'Total da contribuição',
    `Soma das faixas, arredondada uma única vez`,
    contribuicao,
  )

  const efetiva = aliquotaEfetiva(contribuicao, entrada.salarioContribuicao, POLITICA)

  traco.passo(
    'Alíquota efetiva',
    `${reais(contribuicao)} ÷ ${reais(entrada.salarioContribuicao)} = ${percentual(efetiva)}`,
    contribuicao,
  )

  return {
    ok: true,
    valores: {
      contribuicao,
      baseAplicada: base,
      aliquotaEfetiva: efetiva,
      limitadaPeloTeto,
    },
    traco: traco.construir(),
  }
}

/** Salário menos a contribuição. Atalho usado por CALC-001. */
export function liquidoAposInss(salario: Centavos, contribuicao: Centavos): Centavos {
  return subtrair(salario, contribuicao)
}
