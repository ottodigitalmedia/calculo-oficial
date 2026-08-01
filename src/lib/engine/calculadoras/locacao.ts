/**
 * CALC-035 — Rentabilidade de imóvel para locação.
 *
 * **A aritmética é simples, e é justamente por isso que ela engana.** O número
 * que se vê anunciado — "aluguel de R$ 2.500,00 num imóvel de R$ 500.000,00, meio
 * por cento ao mês" — é a rentabilidade **bruta**, e ela ignora quatro coisas que
 * o proprietário paga de verdade: a taxa da imobiliária, o IPTU, a manutenção e
 * os meses em que o imóvel fica vago, quando ele ainda arca com o condomínio.
 *
 * O cálculo é feito **em um ano**, e não em um mês, porque três dos quatro custos
 * são anuais ou intermitentes por natureza. Mensalizar antes de somar obrigaria a
 * inventar um duodécimo para a vacância, que não acontece todo mês.
 *
 * Sem parâmetro legal: tudo o que entra é digitado. O IPTU varia por município e
 * `00-catalogo` §14 exclui dado hiperlocal — ele entra como campo, que é o que a
 * própria exclusão prescreve.
 */

import {
  aliquotaEfetiva,
  aplicarAliquota,
  dividirPorInteiro,
  multiplicarPorInteiro,
  proporcao,
  somar,
  subtrair,
} from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

const MESES_NO_ANO = 12

/** Escala das etapas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

export interface EntradaLocacao {
  readonly valorDoImovel: Centavos
  readonly aluguelMensal: Centavos
  /** Percentual que a imobiliária cobra sobre o aluguel recebido. */
  readonly taxaAdministracaoBp: BasisPoints
  readonly iptuAnual: Centavos
  /** Condomínio mensal — só pesa nos meses em que o imóvel está vago. */
  readonly condominioMensal: Centavos
  readonly manutencaoAnual: Centavos
  readonly mesesVagosPorAno: number
}

export interface SaidaLocacao {
  readonly aluguelRecebidoNoAno: Centavos
  readonly custoAdministracao: Centavos
  readonly custoCondominioVago: Centavos
  readonly despesasTotais: Centavos
  readonly liquidoAnual: Centavos
  readonly liquidoMensal: Centavos
  readonly rentabilidadeBrutaAnualBp: BasisPoints
  readonly rentabilidadeLiquidaAnualBp: BasisPoints
  readonly rentabilidadeLiquidaMensalBp: BasisPoints
  /** Anos de aluguel líquido para reunir o valor do imóvel, em centésimos. */
  readonly anosParaSePagarCentesimos: number
}

export function calcularLocacao(
  entrada: EntradaLocacao,
  dataReferencia: DataISO,
): Resultado<SaidaLocacao> {
  if (entrada.valorDoImovel <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor do imóvel para ver o resultado.',
    }
  }
  if (entrada.aluguelMensal <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor do aluguel para ver o resultado.',
    }
  }
  if (entrada.mesesVagosPorAno < 0 || entrada.mesesVagosPorAno >= MESES_NO_ANO) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Os meses vagos precisam ficar entre 0 e 11 — com 12 não haveria aluguel nenhum.',
    }
  }

  const etapas: Etapa[] = []
  const mesesAlugado = MESES_NO_ANO - entrada.mesesVagosPorAno

  const aluguelRecebidoNoAno = multiplicarPorInteiro(entrada.aluguelMensal, mesesAlugado)
  etapas.push({
    rotulo: 'Aluguel recebido em um ano',
    formula: `${reais(entrada.aluguelMensal)} × ${mesesAlugado} meses alugado`,
    resultado: aluguelRecebidoNoAno,
    ...(entrada.mesesVagosPorAno > 0
      ? {
          justificativa:
            `Com ${entrada.mesesVagosPorAno} mês(es) vago(s), o ano rende ${mesesAlugado} ` +
            'aluguéis, e não doze. A vacância é o custo que mais some das contas de ' +
            'rentabilidade, e é o único que não chega em forma de boleto.',
        }
      : {}),
  })

  const custoAdministracao = aplicarAliquota(
    aluguelRecebidoNoAno,
    entrada.taxaAdministracaoBp,
    'meio_para_cima',
  )
  if (custoAdministracao > 0) {
    etapas.push({
      rotulo: 'Taxa de administração',
      formula: `${reais(aluguelRecebidoNoAno)} × ${percentual(entrada.taxaAdministracaoBp)}`,
      resultado: custoAdministracao,
    })
  }

  const custoCondominioVago = multiplicarPorInteiro(
    entrada.condominioMensal,
    entrada.mesesVagosPorAno,
  )
  if (custoCondominioVago > 0) {
    etapas.push({
      rotulo: 'Condomínio nos meses vagos',
      formula: `${reais(entrada.condominioMensal)} × ${entrada.mesesVagosPorAno} mês(es) sem inquilino`,
      resultado: custoCondominioVago,
      justificativa:
        'Com o imóvel alugado o condomínio costuma ser do inquilino. Vago, ele volta para o ' +
        'proprietário — e é aí que a vacância cobra duas vezes: pelo que não entra e pelo que sai.',
    })
  }

  const despesasTotais = somar(
    custoAdministracao,
    entrada.iptuAnual,
    custoCondominioVago,
    entrada.manutencaoAnual,
  )
  const liquidoAnual = subtrair(aluguelRecebidoNoAno, despesasTotais)

  etapas.push({
    rotulo: 'Sobra em um ano',
    formula: `${reais(aluguelRecebidoNoAno)} − ${reais(despesasTotais)} de despesas`,
    resultado: liquidoAnual,
  })

  const liquidoMensal = dividirPorInteiro(liquidoAnual, MESES_NO_ANO, 'meio_para_cima')

  const aluguelCheioNoAno = multiplicarPorInteiro(entrada.aluguelMensal, MESES_NO_ANO)
  const rentabilidadeBrutaAnualBp = aliquotaEfetiva(
    aluguelCheioNoAno,
    entrada.valorDoImovel,
    'meio_para_cima',
  )
  const rentabilidadeLiquidaAnualBp = aliquotaEfetiva(
    liquidoAnual,
    entrada.valorDoImovel,
    'meio_para_cima',
  )
  const rentabilidadeLiquidaMensalBp = aliquotaEfetiva(
    liquidoMensal,
    entrada.valorDoImovel,
    'meio_para_cima',
  )

  etapas.push({
    rotulo: 'Rentabilidade bruta ao ano',
    formula:
      `${reais(aluguelCheioNoAno)} ÷ ${reais(entrada.valorDoImovel)} = ` +
      `${percentual(rentabilidadeBrutaAnualBp)}`,
    // Em unidade `percentual` o resultado é basis point — ver `Unidade`.
    resultado: centavos(rentabilidadeBrutaAnualBp),
    unidade: 'percentual',
    justificativa:
      'É o número que se vê anunciado: doze aluguéis cheios sobre o valor do imóvel, sem ' +
      'desconto nenhum e sem vacância. Serve para comparar anúncios, não para estimar renda.',
  })

  etapas.push({
    rotulo: 'Rentabilidade líquida ao ano',
    formula:
      `${reais(liquidoAnual)} ÷ ${reais(entrada.valorDoImovel)} = ` +
      `${percentual(rentabilidadeLiquidaAnualBp)}`,
    resultado: centavos(rentabilidadeLiquidaAnualBp),
    unidade: 'percentual',
    justificativa:
      'É o que de fato fica, sobre o que de fato foi imobilizado. A distância para a linha ' +
      'acima é a soma de tudo o que o proprietário paga e o anúncio não menciona.',
  })

  /**
   * Quantos anos de aluguel líquido reúnem o valor do imóvel.
   *
   * Só existe quando sobra algo: com resultado negativo o imóvel não se paga
   * nunca, e devolver um número aqui sugeriria o contrário.
   */
  const anosParaSePagarCentesimos =
    liquidoAnual > 0
      ? proporcao(entrada.valorDoImovel, CENTESIMOS_POR_UNIDADE, liquidoAnual, 'meio_para_cima')
      : 0

  if (anosParaSePagarCentesimos > 0) {
    etapas.push({
      rotulo: 'Anos de aluguel para reunir o valor do imóvel',
      formula: `${reais(entrada.valorDoImovel)} ÷ ${reais(liquidoAnual)} por ano`,
      resultado: centavos(anosParaSePagarCentesimos),
      unidade: 'numero',
      justificativa:
        'Sem contar valorização, reajuste do aluguel nem inflação. É a leitura mais simples do ' +
        'investimento, e a mais fácil de comparar com qualquer outra aplicação.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      aluguelRecebidoNoAno,
      custoAdministracao,
      custoCondominioVago,
      despesasTotais,
      liquidoAnual,
      liquidoMensal,
      rentabilidadeBrutaAnualBp,
      rentabilidadeLiquidaAnualBp,
      rentabilidadeLiquidaMensalBp,
      anosParaSePagarCentesimos,
    },
    traco,
  }
}
