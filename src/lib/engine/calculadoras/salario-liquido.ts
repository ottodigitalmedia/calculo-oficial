/**
 * CALC-001 — Salário líquido.
 *
 * Compõe os motores de INSS e IRRF já verificados contra os exemplos oficiais
 * da Receita. Não reimplementa cálculo algum: encadeia os dois e junta os
 * traços, de modo que a memória do salário líquido seja a memória do INSS
 * seguida da do imposto, sem costura visível.
 *
 * `> ⚠️ VERIFICAR: o vale-transporte (RN-027) ainda não entra. O desconto é
 * limitado ao percentual legal sobre o salário, e esse percentual é parâmetro
 * legal que ainda não foi pesquisado em fonte oficial. Entra num commit
 * `params(...)` próprio, com a norma citada — nunca por memória.`
 */

import { naoNegativo, somar, subtrair } from '../money'
import { calcularInss } from '../inss'
import { calcularIrrf } from '../irrf'
import { reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, type Centavos, centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'

export interface EntradaSalarioLiquido {
  readonly salarioBruto: Centavos
  readonly dependentes: number
  readonly pensao: Centavos
  readonly outrosDescontos: Centavos
}

export interface SaidaSalarioLiquido {
  readonly liquido: Centavos
  readonly inss: Centavos
  readonly irrf: Centavos
  readonly totalDescontos: Centavos
}

export function calcularSalarioLiquido(
  entrada: EntradaSalarioLiquido,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaSalarioLiquido> {
  if (entrada.salarioBruto <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o salário bruto para ver o resultado.',
    }
  }

  const previdencia = calcularInss({ salarioContribuicao: entrada.salarioBruto }, dataReferencia, registro)
  if (!previdencia.ok) return previdencia

  const imposto = calcularIrrf(
    {
      rendimentoBruto: entrada.salarioBruto,
      inss: previdencia.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: entrada.pensao,
    },
    dataReferencia,
    registro,
  )
  if (!imposto.ok) return imposto

  const totalDescontos = somar(
    previdencia.valores.contribuicao,
    imposto.valores.imposto,
    entrada.pensao,
    entrada.outrosDescontos,
  )
  const liquido = naoNegativo(subtrair(entrada.salarioBruto, totalDescontos))

  // Os dois traços entram inteiros, na ordem em que a conta acontece.
  const etapas: Etapa[] = [
    ...previdencia.traco.etapas,
    ...imposto.traco.etapas,
  ]

  if (entrada.outrosDescontos > 0) {
    etapas.push({
      rotulo: 'Outros descontos',
      formula: `Informado pelo usuário: ${reais(entrada.outrosDescontos)}`,
      resultado: entrada.outrosDescontos,
    })
  }

  etapas.push({
    rotulo: 'Salário líquido',
    formula:
      `${reais(entrada.salarioBruto)} − ${reais(previdencia.valores.contribuicao)} (previdência)` +
      ` − ${reais(imposto.valores.imposto)} (imposto)` +
      (entrada.pensao > 0 ? ` − ${reais(entrada.pensao)} (pensão)` : '') +
      (entrada.outrosDescontos > 0 ? ` − ${reais(entrada.outrosDescontos)} (outros)` : ''),
    resultado: liquido,
  })

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: [
      ...new Set([
        ...previdencia.traco.vigenciasAplicadas,
        ...imposto.traco.vigenciasAplicadas,
      ]),
    ],
  }

  return {
    ok: true,
    valores: {
      liquido,
      inss: previdencia.valores.contribuicao,
      irrf: imposto.valores.imposto,
      totalDescontos,
    },
    traco,
  }
}

/** Zero tipado, para composição de entradas ausentes. */
export const SEM_VALOR: Centavos = ZERO
export { centavos }
