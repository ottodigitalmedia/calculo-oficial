/**
 * Registro de guias publicados — `ADR-009`.
 *
 * Mesmo contrato do registro de calculadoras: acrescentar um guia é
 * acrescentar uma entrada aqui. Não há rota nova a escrever.
 */

import { ALUGAR_OU_COMPRAR } from './alugar-ou-comprar'
import { AS_CONTAS_DA_CASA } from './as-contas-da-casa'
import { AVISO_PREVIO } from './aviso-previo'
import { BRUTO_E_LIQUIDO } from './bruto-e-liquido'
import { CET_CUSTO_EFETIVO_TOTAL } from './cet-custo-efetivo-total'
import { CONSIGNADO } from './consignado'
import { COMO_O_INSS_E_CALCULADO } from './como-o-inss-e-calculado'
import { DECIMO_TERCEIRO } from './decimo-terceiro'
import { CAMBIO_E_IOF } from './cambio-e-iof'
import { CONTRATO_INTERMITENTE } from './contrato-intermitente'
import { CRIPTO_NO_IMPOSTO } from './cripto-no-imposto'
import { CUSTO_DE_TER_UM_CARRO } from './custo-de-ter-um-carro'
import { CUSTO_DO_FUNCIONARIO } from './custo-do-funcionario'
import { DECLARACAO_ANUAL } from './declaracao-anual'
import { EMPREGADO_DOMESTICO } from './empregado-domestico'
import { ENERGIA_SOLAR } from './energia-solar'
import { FERIAS } from './ferias'
import { GANHO_REAL } from './ganho-real'
import { FGTS_GUIA } from './fgts'
import { HORAS_EXTRAS } from './horas-extras'
import { IMOVEL_PARA_ALUGAR } from './imovel-para-alugar'
import { INSS_SEM_CARTEIRA } from './inss-sem-carteira'
import { IMPOSTO_DE_RENDA_NA_FOLHA } from './imposto-de-renda-na-folha'
import { IR_NA_RENDA_FIXA } from './ir-na-renda-fixa'
import { IR_NA_VENDA_DE_IMOVEL } from './ir-na-venda-de-imovel'
import { JUROS_COMPOSTOS } from './juros-compostos'
import { MATEMATICA_DO_DIA_A_DIA } from './matematica-do-dia-a-dia'
import { MEI_DAS_E_LIMITE } from './mei-das-e-limite'
import { ORCAMENTO_DOMESTICO } from './orcamento-domestico'
import { PEDIDO_DE_DEMISSAO } from './pedido-de-demissao'
import { QUAL_COMBUSTIVEL_COMPENSA } from './qual-combustivel-compensa'
import { QUANTO_COBRAR_POR_HORA } from './quanto-cobrar-por-hora'
import { QUANTO_IMOVEL_CABE } from './quanto-imovel-cabe'
import { QUITAR_ANTECIPADO } from './quitar-antecipado'
import { RESCISAO_SEM_JUSTA_CAUSA } from './rescisao-sem-justa-causa'
import { VIVER_DE_RENDA } from './viver-de-renda'
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

  // Bloco trabalhista restante — §11.3.
  AVISO_PREVIO,
  EMPREGADO_DOMESTICO,
  CONTRATO_INTERMITENTE,
  CUSTO_DO_FUNCIONARIO,

  // Bloco de investimentos — §11.3.
  IR_NA_RENDA_FIXA,
  GANHO_REAL,
  VIVER_DE_RENDA,

  // Autônomo e PJ, o que sobrou do bloco — §11.3.
  QUANTO_COBRAR_POR_HORA,
  CRIPTO_NO_IMPOSTO,

  // Veículos — §11.3.
  CUSTO_DE_TER_UM_CARRO,
  QUAL_COMBUSTIVEL_COMPENSA,

  // Casa e consumo — §11.3.
  AS_CONTAS_DA_CASA,
  ENERGIA_SOLAR,
  ORCAMENTO_DOMESTICO,

  // Câmbio — §11.3.
  CAMBIO_E_IOF,

  // Utilitárias, num guia só — §11.2 explica por que não são seis.
  MATEMATICA_DO_DIA_A_DIA,
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
