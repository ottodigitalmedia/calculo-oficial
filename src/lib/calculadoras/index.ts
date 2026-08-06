/**
 * Registro de calculadoras publicadas.
 *
 * A página genérica resolve o slug aqui. Adicionar uma calculadora é
 * acrescentar uma definição a esta lista — não há rota nova a escrever
 * (`ADR-008` E-1).
 */

import { DAS_MEI } from './das-mei'
import { DECIMO_TERCEIRO } from './decimo-terceiro'
import { ALUGAR_OU_COMPRAR } from './alugar-ou-comprar'
import { AMORTIZACAO } from './amortizacao'
import { AMORTIZACAO_EXTRA } from './amortizacao-extra'
import { AVISO_PREVIO } from './aviso-previo'
import { BANCO_DE_HORAS } from './banco-de-horas'
import { BOTIJAO } from './botijao'
import { CAMBIO } from './cambio'
import { CAPACIDADE } from './capacidade'
import { CARNE_LEAO } from './carne-leao'
import { CRIPTO } from './cripto'
import { SOLAR } from './solar'
import { RESTITUICAO_IRPF } from './restituicao-irpf'
import { SIMPLIFICADO_OU_COMPLETO } from './simplificado-ou-completo'
import { CDB } from './cdb'
import { COMPARADOR_INVESTIMENTOS } from './comparador-investimentos'
import { CET } from './cet'
import { CHEQUE_ESPECIAL } from './cheque-especial'
import { CONTA_DE_AGUA } from './conta-de-agua'
import { CONVERSOR_DE_UNIDADES } from './conversor-de-unidades'
import { CONSIGNADO } from './consignado'
import { INTERMITENTE } from './intermitente'
import { CORRECAO_POR_INDICE } from './correcao-por-indice'
import { CUSTO_DE_AQUISICAO } from './custo-de-aquisicao'
import { CUSTO_EMPREGADOR } from './custo-empregador'
import { CUSTO_DO_CARRO } from './custo-do-carro'
import { DEPRECIACAO_DE_VEICULO } from './depreciacao-de-veiculo'
import { DIAS_UTEIS } from './dias-uteis'
import { DIVIDENDOS } from './dividendos'
import { DIVISAO_DE_CONTA } from './divisao-de-conta'
import { ELETRICO_VS_COMBUSTAO } from './eletrico-vs-combustao'
import { COMBUSTIVEL } from './combustivel'
import { FERIAS } from './ferias'
import { FINANCIAMENTO_DE_REFORMA } from './financiamento-de-reforma'
import { FINANCIAMENTO_DE_VEICULO } from './financiamento-de-veiculo'
import { FINANCIAMENTO_IMOBILIARIO } from './financiamento-imobiliario'
import { FGTS } from './fgts'
import { GANHO_DE_CAPITAL } from './ganho-de-capital'
import { ENERGIA } from './energia'
import { HORAS_EXTRAS } from './horas-extras'
import { INDEPENDENCIA } from './independencia'
import { INSS_AUTONOMO } from './inss-autonomo'
import { INSS_MENSAL } from './inss'
import { IRRF_MENSAL } from './irrf'
import { JUROS_COMPOSTOS } from './juros-compostos'
import { LIMITE_DO_MEI } from './limite-do-mei'
import { LOCACAO } from './locacao'
import { MEDIA_PONDERADA } from './media-ponderada'
import { ORCAMENTO } from './orcamento'
import { PLANO_DE_QUITACAO } from './plano-de-quitacao'
import { PODER_DE_COMPRA } from './poder-de-compra'
import { PORTABILIDADE_DE_CREDITO } from './portabilidade-de-credito'
import { PORCENTAGEM } from './porcentagem'
import { POUPANCA } from './poupanca'
import { PRECIFICACAO } from './precificacao'
import { PRO_LABORE } from './pro-labore'
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
  INTERMITENTE,
  FGTS,
  INSS_MENSAL,
  INSS_AUTONOMO,
  IRRF_MENSAL,
  RENDA_FIXA,
  JUROS_COMPOSTOS,
  CET,
  AMORTIZACAO,
  ROTATIVO_CARTAO,
  CHEQUE_ESPECIAL,
  CAPACIDADE,
  FINANCIAMENTO_IMOBILIARIO,
  CUSTO_DE_AQUISICAO,
  GANHO_DE_CAPITAL,
  QUITACAO_ANTECIPADA,
  AMORTIZACAO_EXTRA,
  PLANO_DE_QUITACAO,
  PORTABILIDADE_DE_CREDITO,
  FINANCIAMENTO_DE_REFORMA,
  CONSIGNADO,
  LOCACAO,
  ALUGAR_OU_COMPRAR,
  RENDA_MENSAL,
  POUPANCA,
  CDB,
  COMPARADOR_INVESTIMENTOS,
  TESOURO_IPCA,
  DIVIDENDOS,
  RESERVA_DE_EMERGENCIA,
  INDEPENDENCIA,
  PRECIFICACAO,
  DAS_MEI,
  LIMITE_DO_MEI,
  CARNE_LEAO,
  RESTITUICAO_IRPF,
  SIMPLIFICADO_OU_COMPLETO,
  CRIPTO,
  SOLAR,
  PRO_LABORE,
  ORCAMENTO,
  ENERGIA,
  BOTIJAO,
  CONTA_DE_AGUA,
  CORRECAO_POR_INDICE,
  PODER_DE_COMPRA,
  CAMBIO,
  VALOR_FUTURO,
  REAJUSTE_SALARIAL,
  REAJUSTE_ALUGUEL,
  PORCENTAGEM,
  REGRA_DE_TRES,
  DIAS_UTEIS,
  COMBUSTIVEL,
  VIAGEM,
  CUSTO_DO_CARRO,
  ELETRICO_VS_COMBUSTAO,
  DEPRECIACAO_DE_VEICULO,
  FINANCIAMENTO_DE_VEICULO,
  DIVISAO_DE_CONTA,
  MEDIA_PONDERADA,
  CONVERSOR_DE_UNIDADES,
]

export function porSlug(slug: string): DefinicaoCalculadora | undefined {
  return CALCULADORAS.find((c) => c.slug === slug)
}

export const SLUGS: readonly string[] = CALCULADORAS.map((c) => c.slug)
