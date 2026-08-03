/**
 * Registro de calculadoras publicadas.
 *
 * A página genérica resolve o slug aqui. Adicionar uma calculadora é
 * acrescentar uma definição a esta lista — não há rota nova a escrever
 * (`ADR-008` E-1).
 */

import { DECIMO_TERCEIRO } from './decimo-terceiro'
import { ALUGAR_OU_COMPRAR } from './alugar-ou-comprar'
import { AMORTIZACAO } from './amortizacao'
import { AMORTIZACAO_EXTRA } from './amortizacao-extra'
import { AVISO_PREVIO } from './aviso-previo'
import { BANCO_DE_HORAS } from './banco-de-horas'
import { CAMBIO } from './cambio'
import { CAPACIDADE } from './capacidade'
import { CDB } from './cdb'
import { COMPARADOR_INVESTIMENTOS } from './comparador-investimentos'
import { CET } from './cet'
import { CHEQUE_ESPECIAL } from './cheque-especial'
import { CORRECAO_POR_INDICE } from './correcao-por-indice'
import { CUSTO_EMPREGADOR } from './custo-empregador'
import { CUSTO_DO_CARRO } from './custo-do-carro'
import { COMBUSTIVEL } from './combustivel'
import { FERIAS } from './ferias'
import { FINANCIAMENTO_IMOBILIARIO } from './financiamento-imobiliario'
import { FGTS } from './fgts'
import { ENERGIA } from './energia'
import { HORAS_EXTRAS } from './horas-extras'
import { INDEPENDENCIA } from './independencia'
import { INSS_MENSAL } from './inss'
import { IRRF_MENSAL } from './irrf'
import { JUROS_COMPOSTOS } from './juros-compostos'
import { LOCACAO } from './locacao'
import { ORCAMENTO } from './orcamento'
import { PODER_DE_COMPRA } from './poder-de-compra'
import { PORCENTAGEM } from './porcentagem'
import { POUPANCA } from './poupanca'
import { PRECIFICACAO } from './precificacao'
import { REAJUSTE_ALUGUEL } from './reajuste-aluguel'
import { REAJUSTE_SALARIAL } from './reajuste-salarial'
import { REGRA_DE_TRES } from './regra-de-tres'
import { RENDA_FIXA } from './renda-fixa'
import { RENDA_MENSAL } from './renda-mensal'
import { TESOURO_IPCA } from './tesouro-ipca'
import { VALOR_FUTURO } from './valor-futuro'
import { RESERVA_DE_EMERGENCIA } from './reserva'
import { VIAGEM } from './viagem'
import { QUITACAO_ANTECIPADA } from './quitacao-antecipada'
import { ROTATIVO_CARTAO } from './rotativo-cartao'
import { RESCISAO_ACORDO_MUTUO } from './rescisao-acordo-mutuo'
import { RESCISAO_DOMESTICO } from './rescisao-domestico'
import { RESCISAO_PEDIDO_DEMISSAO } from './rescisao-pedido-demissao'
import { RESCISAO_SEM_JUSTA_CAUSA } from './rescisao-sem-justa-causa'
import { SALARIO_LIQUIDO } from './salario-liquido'
import { SEGURO_DESEMPREGO } from './seguro-desemprego'
import type { DefinicaoCalculadora } from './tipos'

export const CALCULADORAS: readonly DefinicaoCalculadora[] = [
  SALARIO_LIQUIDO,
  RESCISAO_SEM_JUSTA_CAUSA,
  RESCISAO_PEDIDO_DEMISSAO,
  RESCISAO_ACORDO_MUTUO,
  RESCISAO_DOMESTICO,
  AVISO_PREVIO,
  SEGURO_DESEMPREGO,
  CUSTO_EMPREGADOR,
  FERIAS,
  DECIMO_TERCEIRO,
  HORAS_EXTRAS,
  BANCO_DE_HORAS,
  FGTS,
  INSS_MENSAL,
  IRRF_MENSAL,
  RENDA_FIXA,
  JUROS_COMPOSTOS,
  CET,
  AMORTIZACAO,
  ROTATIVO_CARTAO,
  CHEQUE_ESPECIAL,
  CAPACIDADE,
  FINANCIAMENTO_IMOBILIARIO,
  QUITACAO_ANTECIPADA,
  AMORTIZACAO_EXTRA,
  LOCACAO,
  ALUGAR_OU_COMPRAR,
  RENDA_MENSAL,
  POUPANCA,
  CDB,
  COMPARADOR_INVESTIMENTOS,
  TESOURO_IPCA,
  RESERVA_DE_EMERGENCIA,
  INDEPENDENCIA,
  PRECIFICACAO,
  ORCAMENTO,
  ENERGIA,
  CORRECAO_POR_INDICE,
  PODER_DE_COMPRA,
  CAMBIO,
  VALOR_FUTURO,
  REAJUSTE_SALARIAL,
  REAJUSTE_ALUGUEL,
  PORCENTAGEM,
  REGRA_DE_TRES,
  COMBUSTIVEL,
  VIAGEM,
  CUSTO_DO_CARRO,
]

export function porSlug(slug: string): DefinicaoCalculadora | undefined {
  return CALCULADORAS.find((c) => c.slug === slug)
}

export const SLUGS: readonly string[] = CALCULADORAS.map((c) => c.slug)
