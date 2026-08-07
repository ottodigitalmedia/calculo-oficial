/**
 * Registro de guias publicados — `ADR-009`.
 *
 * Mesmo contrato do registro de calculadoras: acrescentar um guia é
 * acrescentar uma entrada aqui. Não há rota nova a escrever.
 */

import { ALUGAR_OU_COMPRAR } from './alugar-ou-comprar'
import { BRUTO_E_LIQUIDO } from './bruto-e-liquido'
import { CET_CUSTO_EFETIVO_TOTAL } from './cet-custo-efetivo-total'
import { CONSIGNADO } from './consignado'
import { COMO_O_INSS_E_CALCULADO } from './como-o-inss-e-calculado'
import { DECIMO_TERCEIRO } from './decimo-terceiro'
import { DECLARACAO_ANUAL } from './declaracao-anual'
import { FERIAS } from './ferias'
import { FGTS_GUIA } from './fgts'
import { HORAS_EXTRAS } from './horas-extras'
import { IMOVEL_PARA_ALUGAR } from './imovel-para-alugar'
import { INSS_SEM_CARTEIRA } from './inss-sem-carteira'
import { IMPOSTO_DE_RENDA_NA_FOLHA } from './imposto-de-renda-na-folha'
import { IR_NA_VENDA_DE_IMOVEL } from './ir-na-venda-de-imovel'
import { JUROS_COMPOSTOS } from './juros-compostos'
import { MEI_DAS_E_LIMITE } from './mei-das-e-limite'
import { PEDIDO_DE_DEMISSAO } from './pedido-de-demissao'
import { QUANTO_IMOVEL_CABE } from './quanto-imovel-cabe'
import { QUITAR_ANTECIPADO } from './quitar-antecipado'
import { RESCISAO_SEM_JUSTA_CAUSA } from './rescisao-sem-justa-causa'
import { ROTATIVO_E_CHEQUE_ESPECIAL } from './rotativo-e-cheque-especial'
import { SAC_OU_PRICE } from './sac-ou-price'
import type { Guia } from './tipos'

/**
 * Ordem de exibição em `/guias`: do mais geral para o mais específico.
 *
 * Os dez guias de `03-functional-spec` §4, agrupados pelo caminho que o leitor
 * costuma percorrer: primeiro a folha do mês, depois as verbas que aparecem uma
 * vez por ano, depois o fim do contrato, e por último o único que não trata de
 * norma trabalhista.
 */
export const GUIAS: readonly Guia[] = [
  BRUTO_E_LIQUIDO,
  COMO_O_INSS_E_CALCULADO,
  IMPOSTO_DE_RENDA_NA_FOLHA,
  HORAS_EXTRAS,
  FERIAS,
  DECIMO_TERCEIRO,
  FGTS_GUIA,
  RESCISAO_SEM_JUSTA_CAUSA,
  PEDIDO_DE_DEMISSAO,
  JUROS_COMPOSTOS,

  // Bloco de crédito — §11.3. Primeiro da cobertura pedida em 07/08/2026,
  // escolhido para abrir por ser o de maior busca e o de maior dano quando mal
  // explicado.
  ROTATIVO_E_CHEQUE_ESPECIAL,
  CET_CUSTO_EFETIVO_TOTAL,
  SAC_OU_PRICE,
  CONSIGNADO,
  QUITAR_ANTECIPADO,

  // Bloco de imóveis — §11.3.
  QUANTO_IMOVEL_CABE,
  ALUGAR_OU_COMPRAR,
  IMOVEL_PARA_ALUGAR,
  IR_NA_VENDA_DE_IMOVEL,

  // Bloco de autônomo e PJ — §11.3.
  INSS_SEM_CARTEIRA,
  MEI_DAS_E_LIMITE,
  DECLARACAO_ANUAL,
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
