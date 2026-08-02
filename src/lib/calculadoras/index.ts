/**
 * Registro de calculadoras publicadas.
 *
 * A página genérica resolve o slug aqui. Adicionar uma calculadora é
 * acrescentar uma definição a esta lista — não há rota nova a escrever
 * (`ADR-008` E-1).
 */

import { DECIMO_TERCEIRO } from './decimo-terceiro'
import { AMORTIZACAO } from './amortizacao'
import { AMORTIZACAO_EXTRA } from './amortizacao-extra'
import { AVISO_PREVIO } from './aviso-previo'
import { BANCO_DE_HORAS } from './banco-de-horas'
import { CAPACIDADE } from './capacidade'
import { CET } from './cet'
import { CHEQUE_ESPECIAL } from './cheque-especial'
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
import { PORCENTAGEM } from './porcentagem'
import { REGRA_DE_TRES } from './regra-de-tres'
import { RENDA_FIXA } from './renda-fixa'
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
  RESERVA_DE_EMERGENCIA,
  INDEPENDENCIA,
  ORCAMENTO,
  ENERGIA,
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
