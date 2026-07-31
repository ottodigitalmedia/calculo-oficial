/**
 * Registro de guias publicados — `ADR-009`.
 *
 * Mesmo contrato do registro de calculadoras: acrescentar um guia é
 * acrescentar uma entrada aqui. Não há rota nova a escrever.
 */

import { BRUTO_E_LIQUIDO } from './bruto-e-liquido'
import { COMO_O_INSS_E_CALCULADO } from './como-o-inss-e-calculado'
import { IMPOSTO_DE_RENDA_NA_FOLHA } from './imposto-de-renda-na-folha'
import type { Guia } from './tipos'

/** Ordem de exibição em `/guias`: do mais geral para o mais específico. */
export const GUIAS: readonly Guia[] = [
  BRUTO_E_LIQUIDO,
  COMO_O_INSS_E_CALCULADO,
  IMPOSTO_DE_RENDA_NA_FOLHA,
]

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug)
}

/**
 * Guias que levam a uma calculadora — a relação invertida.
 *
 * Declarada num lugar só (no guia) e invertida aqui, para que um guia novo
 * apareça na calculadora sem ninguém precisar editar os dois lados. Duas
 * listas manuais divergem; esta não tem como.
 */
export function guiasDaCalculadora(slug: string): readonly Guia[] {
  return GUIAS.filter((g) => g.calculadoras.includes(slug))
}

export type { Guia } from './tipos'
