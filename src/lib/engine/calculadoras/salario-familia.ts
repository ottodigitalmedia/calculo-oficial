/**
 * CALC-088 — Salário-família.
 *
 * Duas perguntas, nesta ordem: a remuneração cabe no limite? Se cabe, quantas
 * cotas? A resposta é tudo ou nada — não há faixa intermediária, e um centavo
 * acima do limite zera o benefício. É isso que a memória precisa deixar claro,
 * porque é o que surpreende quem recebe um aumento pequeno e perde as cotas.
 *
 * **O que fica de fora, declarado.** No mês de admissão e no de demissão a cota
 * é proporcional aos dias trabalhados (art. 4º, § 4º, das portarias), mas a
 * norma não fixa o divisor da proporção — e a calculadora não inventa um. Ela
 * calcula o mês cheio.
 */

import { multiplicarPorInteiro } from '../money'
import { citar, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

type Monetario = { readonly valor: Centavos; readonly resolvida: VigenciaResolvida } | null

function resolverMonetario(registro: Registro, id: string, data: DataISO): Monetario {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'valor_monetario') return null
  return { valor: centavos(r.resolvida.vigencia.valor.centavos), resolvida: r.resolvida }
}

export interface EntradaSalarioFamilia {
  /** Remuneração do mês, sem 13º nem adicional de férias. */
  readonly remuneracao: Centavos
  /** Filhos ou equiparados até 14 anos, ou inválidos de qualquer idade. */
  readonly filhos: number
}

export interface SaidaSalarioFamilia {
  readonly total: Centavos
  readonly cota: Centavos
  readonly limite: Centavos
  readonly elegivel: boolean
  /** Quanto falta (ou sobra) em relação ao limite: positivo quando cabe. */
  readonly folga: Centavos
}

export function calcularSalarioFamilia(
  entrada: EntradaSalarioFamilia,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaSalarioFamilia> {
  if (entrada.remuneracao <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a remuneração mensal.' }
  }
  if (!Number.isInteger(entrada.filhos) || entrada.filhos < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O número de filhos precisa ser um inteiro sem sinal.' }
  }
  if (entrada.filhos === 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quantos filhos até 14 anos, ou inválidos de qualquer idade, você tem.',
    }
  }

  const cota = resolverMonetario(registro, 'salario-familia-cota', dataReferencia)
  const limite = resolverMonetario(registro, 'salario-familia-limite', dataReferencia)
  if (cota === null || limite === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há valores de salário-família cadastrados para a data informada.' }
  }

  const etapas: Etapa[] = []
  const elegivel = entrada.remuneracao <= limite.valor
  const folga = centavos(limite.valor - entrada.remuneracao)

  etapas.push({
    rotulo: elegivel ? 'Remuneração dentro do limite' : 'Remuneração acima do limite',
    formula: `${reais(entrada.remuneracao)} ${elegivel ? '≤' : '>'} ${reais(limite.valor)}`,
    resultado: limite.valor,
    parametro: citar(limite.resolvida),
    justificativa: elegivel
      ? 'Até o limite, o segurado recebe uma cota por filho. O 13º salário e o adicional de férias não entram na remuneração considerada.'
      : 'Acima do limite, não há cota nenhuma — o benefício não diminui aos poucos, ele deixa de existir.',
  })

  let total: Centavos = ZERO
  if (elegivel) {
    total = multiplicarPorInteiro(cota.valor, entrada.filhos)
    etapas.push({
      rotulo: 'Salário-família do mês',
      formula: `${reais(cota.valor)} × ${entrada.filhos} ${entrada.filhos === 1 ? 'filho' : 'filhos'}`,
      resultado: total,
      parametro: citar(cota.resolvida),
      justificativa:
        'Pago pela empresa junto com o salário, que depois compensa o valor nas contribuições que recolhe ' +
        '(Lei nº 8.213/1991, art. 68).',
    })
  }

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: elegivel
      ? [limite.resolvida.vigencia.id, cota.resolvida.vigencia.id]
      : [limite.resolvida.vigencia.id],
  }
  return {
    ok: true,
    valores: { total, cota: cota.valor, limite: limite.valor, elegivel, folga },
    traco,
  }
}
