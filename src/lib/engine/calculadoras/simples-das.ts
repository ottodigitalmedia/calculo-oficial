/**
 * CALC-116 — DAS do Simples Nacional: alíquota efetiva e valor do mês.
 *
 * O art. 18, § 1º-A, da LC nº 123/2006 (redação da LC nº 155/2016) define a
 * alíquota efetiva como
 *
 *     (RBT12 × Aliq − PD) ÷ RBT12
 *
 * e ela é aplicada sobre a receita do mês. A conta aqui segue a fórmula SEM
 * arredondamento intermediário: o DAS é `receita × (RBT12 × Aliq − PD) ÷ RBT12`,
 * em inteiro grande, e só o resultado final vira centavo. A alíquota efetiva
 * aparece com quatro casas, para leitura.
 *
 * **A atividade escolhe o anexo** — comércio no I, indústria no II, os serviços
 * do § 5º-C no IV — e, para os serviços do § 5º-I, o **fator R** decide entre
 * III e V: folha de doze meses dividida pela receita de doze meses, com o Anexo
 * III a partir de 28% (§ 5º-J).
 *
 * **O que NÃO está aqui:** a partilha entre os tributos, o início de atividade
 * (RBT12 proporcional, § 2º), a receita acima do sublimite estadual — onde ICMS
 * e ISS saem do DAS — e a substituição tributária. As notas dizem isso.
 */

import { citar, percentual, reais, type Etapa, type Resultado } from '../traco'
import { basisPoints, centavos, type Centavos } from '../types'
import type { DataISO, Faixa, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

/** Um inteiro em basis points. Unidade, não parâmetro legal (ADR-004 A-2). */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-2)
const BP_POR_INTEIRO = 10_000n

/** Centésimos de basis point — a alíquota efetiva com quatro casas percentuais. */
// eslint-disable-next-line no-restricted-syntax -- unidade de exibição, não parâmetro legal
const CENTESIMOS = 100n

export type Atividade = 'comercio' | 'industria' | 'servicos-anexo-iii' | 'servicos-anexo-iv' | 'servicos-fator-r'
export type Anexo = 'I' | 'II' | 'III' | 'IV' | 'V'

const TABELA: Readonly<Record<Anexo, string>> = {
  I: 'simples-anexo-i',
  II: 'simples-anexo-ii',
  III: 'simples-anexo-iii',
  IV: 'simples-anexo-iv',
  V: 'simples-anexo-v',
}

export const PARAMETROS_DAS = ['simples-anexo-i', 'simples-anexo-ii', 'simples-anexo-iii', 'simples-anexo-iv', 'simples-anexo-v'] as const

export interface EntradaDas {
  readonly atividade: Atividade
  /** Receita bruta dos doze meses anteriores ao mês de apuração. */
  readonly rbt12: Centavos
  readonly receitaDoMes: Centavos
  /** Folha dos doze meses anteriores, com pró-labore e encargos — só para o fator R. */
  readonly folha12: Centavos
}

export interface SaidaDas {
  readonly das: Centavos
  readonly anexo: Anexo
  readonly faixa: number
  readonly aliquotaNominalBp: number
  readonly parcelaDeduzir: Centavos
  /** Alíquota efetiva em centésimos de basis point: 51234 = 5,1234%. */
  readonly efetivaCentesimosBp: number
  /** Fator R em basis points, quando aplicável. */
  readonly fatorRBp: number | null
  readonly acimaDoSublimite: boolean
}

/** Divisão inteira com arredondamento meio-para-cima, para números sem sinal. */
function dividirArredondando(numerador: bigint, denominador: bigint): bigint {
  return (numerador * 2n + denominador) / (denominador * 2n)
}

function tabelaDe(registro: Registro, id: string, data: DataISO): VigenciaResolvida | null {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'tabela_faixas') return null
  return r.resolvida
}

export function calcularDas(entrada: EntradaDas, dataReferencia: DataISO, registro: Registro): Resultado<SaidaDas> {
  if (entrada.rbt12 <= 0 || entrada.receitaDoMes <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a receita dos últimos doze meses e a receita do mês.',
    }
  }
  if (entrada.folha12 < 0) return { ok: false, motivo: 'entrada_invalida', detalhe: 'A folha não pode ser negativa.' }

  const etapas: Etapa[] = []
  const vigencias: string[] = []

  // --- O anexo -------------------------------------------------------------
  let anexo: Anexo
  let fatorRBp: number | null = null
  switch (entrada.atividade) {
    case 'comercio':
      anexo = 'I'
      break
    case 'industria':
      anexo = 'II'
      break
    case 'servicos-anexo-iii':
      anexo = 'III'
      break
    case 'servicos-anexo-iv':
      anexo = 'IV'
      break
    case 'servicos-fator-r': {
      const limite = registro.resolver('simples-fator-r-limite', dataReferencia)
      if (!limite.ok || limite.resolvida.vigencia.valor.tipo !== 'percentual') {
        return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há o limiar do fator R para a data informada.' }
      }
      const limiteBp = BigInt(limite.resolvida.vigencia.valor.aliquotaBp)
      // folha ÷ receita ≥ limite, sem divisão: folha × 10.000 ≥ limite × receita.
      const ehIII = BigInt(entrada.folha12) * BP_POR_INTEIRO >= limiteBp * BigInt(entrada.rbt12)
      anexo = ehIII ? 'III' : 'V'
      fatorRBp = Number(dividirArredondando(BigInt(entrada.folha12) * BP_POR_INTEIRO, BigInt(entrada.rbt12)))
      vigencias.push(limite.resolvida.vigencia.id)
      etapas.push({
        rotulo: `Fator R — ${percentual(basisPoints(fatorRBp))}: Anexo ${anexo}`,
        formula: `folha ${reais(entrada.folha12)} ÷ receita ${reais(entrada.rbt12)}, nos doze meses`,
        resultado: centavos(fatorRBp),
        unidade: 'percentual',
        parametro: citar(limite.resolvida),
        justificativa: 'Folha igual ou acima do limiar leva ao Anexo III; abaixo, ao Anexo V — em geral bem mais caro.',
      })
      break
    }
  }

  const tabela = tabelaDe(registro, TABELA[anexo], dataReferencia)
  if (tabela === null || tabela.vigencia.valor.tipo !== 'tabela_faixas') {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe:
        'Os anexos cadastrados valem de 01/01/2018 a 31/12/2026 — a partir de 2027 a LC nº 214/2025 os substitui, e os novos ainda não foram cadastrados.',
    }
  }
  vigencias.push(tabela.vigencia.id)

  const faixas: readonly Faixa[] = tabela.vigencia.valor.faixas
  const ultima = faixas[faixas.length - 1]
  const teto = ultima?.limiteSuperiorCentavos ?? null
  if (teto !== null && entrada.rbt12 > teto) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `Receita de doze meses acima de ${reais(centavos(teto))}: fora do Simples Nacional.`,
    }
  }
  const faixa = faixas.find((f) => f.limiteSuperiorCentavos === null || entrada.rbt12 <= f.limiteSuperiorCentavos)
  if (!faixa) return { ok: false, motivo: 'entrada_invalida', detalhe: 'Faixa não encontrada.' }
  const pd = faixa.parcelaDeduzirCentavos ?? 0

  // --- A fórmula do § 1º-A, em inteiro grande --------------------------------
  const rbt12 = BigInt(entrada.rbt12)
  const numerador = rbt12 * BigInt(faixa.aliquotaBp) - BigInt(pd) * BP_POR_INTEIRO // centavos × bp
  const efetivaCentesimosBp = Number(dividirArredondando(numerador * CENTESIMOS, rbt12))
  const das = centavos(Number(dividirArredondando(BigInt(entrada.receitaDoMes) * numerador, rbt12 * BP_POR_INTEIRO)))

  etapas.push(
    {
      rotulo: `Anexo ${anexo}, ${faixa.ordem}ª faixa — alíquota nominal de ${percentual(basisPoints(faixa.aliquotaBp))}`,
      formula: `receita de doze meses de ${reais(entrada.rbt12)}; parcela a deduzir de ${reais(centavos(pd))}`,
      resultado: centavos(faixa.aliquotaBp),
      unidade: 'percentual',
      parametro: citar(tabela),
    },
    {
      rotulo: 'Alíquota efetiva',
      formula: `(${reais(entrada.rbt12)} × ${percentual(basisPoints(faixa.aliquotaBp))} − ${reais(centavos(pd))}) ÷ ${reais(entrada.rbt12)}`,
      resultado: centavos(Math.round(efetivaCentesimosBp / Number(CENTESIMOS))),
      unidade: 'percentual',
      justificativa:
        'É a alíquota que se paga (art. 18, § 1º-A). A nominal da faixa, aplicada direto sobre a receita, cobraria a mais — a parcela a deduzir existe para corrigir isso.',
    },
    {
      rotulo: 'DAS do mês',
      formula: `${reais(entrada.receitaDoMes)} × alíquota efetiva`,
      resultado: das,
      justificativa: 'A fórmula é aplicada sem arredondar a alíquota no meio do caminho; só o valor final vira centavo.',
    },
  )

  // O sublimite estadual é a 5ª faixa: na 6ª, a partilha da lei não tem ICMS nem ISS.
  const acimaDoSublimite = faixa.ordem === faixas.length

  return {
    ok: true,
    valores: {
      das,
      anexo,
      faixa: faixa.ordem,
      aliquotaNominalBp: faixa.aliquotaBp,
      parcelaDeduzir: centavos(pd),
      efetivaCentesimosBp,
      fatorRBp,
      acimaDoSublimite,
    },
    traco: { etapas, dataReferencia, vigenciasAplicadas: vigencias },
  }
}
