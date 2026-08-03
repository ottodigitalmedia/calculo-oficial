/**
 * CALC-031 — Financiamento imobiliário: SAC vs. Price, com os encargos dentro.
 *
 * **O que a separa de CALC-025.** A amortização é a mesma matemática, e ela já
 * está em `credito.ts`. O que muda é o que o banco cobra ao lado dela: o seguro
 * de morte e invalidez (MIP), o seguro de danos ao imóvel (DFI) e a tarifa
 * mensal de administração. Numa parcela de financiamento imobiliário longo esses
 * três costumam responder por uma fatia que a taxa anunciada não menciona, e é
 * essa fatia que esta calculadora existe para tornar visível.
 *
 * **Nenhum dos três é estimado.** `docs/18` §3.2 já registrava o motivo: os
 * prêmios variam por seguradora, por banco e pela idade do tomador, e não há
 * fonte oficial que os fixe. Eles entram como valor digitado, tirados da
 * simulação que o banco entrega — e a calculadora só faz com eles a aritmética
 * que o contrato manda fazer.
 *
 * **A única modelagem que este motor assume, declarada.** O MIP incide sobre o
 * **saldo devedor** e o DFI sobre o **valor de avaliação do imóvel**. O primeiro
 * cai a cada mês junto com o saldo; o segundo não muda, porque a base dele não
 * muda. Como o que o usuário tem em mãos é o prêmio da **primeira** prestação, o
 * MIP dos meses seguintes é obtido pela proporção do saldo — que é o que a
 * incidência sobre saldo devedor significa. Nenhuma alíquota é inferida e
 * exibida como se fosse do contrato: o que entra na conta é a proporção, e ela
 * está declarada na memória.
 *
 * Sem parâmetro legal: como em CALC-024 a CALC-026, tudo o que entra é digitado.
 */

import { jurosDoPeriodo, parcelaPrice } from '../financeira'
import {
  aliquotaEfetiva,
  aplicarAliquota,
  dividirPorInteiro,
  naoNegativo,
  proporcao,
  somar,
  subtrair,
} from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

const AVOS_NO_ANO = 12

/**
 * Qual dos dois sistemas o contrato usa.
 *
 * É escolha do banco, não do produto: no crédito imobiliário brasileiro a
 * instituição costuma oferecer um só. Por isso o sistema é **campo**, e a
 * comparação com o outro sai junto — em vez de o usuário ter de rodar duas
 * vezes para saber o que perdeu ou ganhou.
 */
export type SistemaAmortizacao = 'sac' | 'price'

export interface EntradaFinanciamento {
  readonly valorFinanciado: Centavos
  readonly prazoMeses: number
  readonly taxaMensal: BasisPoints
  readonly sistema: SistemaAmortizacao
  /** Prêmio do MIP na PRIMEIRA prestação. Incide sobre o saldo, e cai com ele. */
  readonly mipPrimeiraParcela: Centavos
  /** Prêmio do DFI por mês. A base é o valor do imóvel, que não muda. */
  readonly dfiMensal: Centavos
  /** Tarifa mensal de administração do contrato, quando houver. */
  readonly tarifaMensal: Centavos
}

export interface LinhaDoAnoFinanciamento {
  readonly ano: number
  readonly prestacao: Centavos
  readonly juros: Centavos
  readonly encargos: Centavos
  readonly saldo: Centavos
}

export interface SaidaFinanciamento {
  readonly sistema: SistemaAmortizacao
  readonly primeiraPrestacao: Centavos
  readonly ultimaPrestacao: Centavos
  /** A prestação inicial sem seguros nem tarifa — o número que o simulador anuncia. */
  readonly primeiraSemEncargos: Centavos
  readonly totalPago: Centavos
  readonly totalJuros: Centavos
  readonly totalSeguros: Centavos
  readonly totalTarifas: Centavos
  /** Seguros e tarifa somados, que é o que a taxa anunciada não menciona. */
  readonly totalEncargos: Centavos
  /** Quanto os encargos representam do total pago. */
  readonly parteDosEncargosBp: BasisPoints
  readonly totalSac: Centavos
  readonly totalPrice: Centavos
  readonly economiaDoSac: Centavos
  readonly evolucao: readonly LinhaDoAnoFinanciamento[]
}

interface Simulacao {
  readonly primeiraPrestacao: Centavos
  readonly ultimaPrestacao: Centavos
  readonly primeiraSemEncargos: Centavos
  readonly total: Centavos
  readonly juros: Centavos
  readonly seguros: Centavos
  readonly tarifas: Centavos
  readonly evolucao: readonly LinhaDoAnoFinanciamento[]
}

/**
 * Roda o contrato mês a mês, no sistema pedido.
 *
 * Simulação e não fórmula fechada, pelo mesmo motivo de `amortizarAteZerar` em
 * `credito.ts`: é assim que o banco de fato apura, e é a única forma de a última
 * prestação sair certa — ela liquida o que sobrou do arredondamento e quase
 * nunca é igual às demais.
 *
 * A identidade que o resultado precisa satisfazer, e que um caso-ouro cobra:
 * **total = valor financiado + juros + seguros + tarifas**. Ela vale por
 * construção — a soma das amortizações é o principal, porque o último mês
 * liquida o saldo.
 */
function simular(entrada: EntradaFinanciamento, sistema: SistemaAmortizacao): Simulacao {
  const n = entrada.prazoMeses
  const parcelaConstante = parcelaPrice(entrada.valorFinanciado, n, entrada.taxaMensal)
  const amortizacaoConstante = dividirPorInteiro(entrada.valorFinanciado, n, 'meio_para_cima')

  let saldo: Centavos = entrada.valorFinanciado
  let total: Centavos = ZERO
  let juros: Centavos = ZERO
  let seguros: Centavos = ZERO
  let tarifas: Centavos = ZERO
  let primeiraPrestacao: Centavos = ZERO
  let primeiraSemEncargos: Centavos = ZERO
  let ultimaPrestacao: Centavos = ZERO
  const evolucao: LinhaDoAnoFinanciamento[] = []

  for (let mes = 1; mes <= n; mes += 1) {
    const jurosDoMes = jurosDoPeriodo(saldo, entrada.taxaMensal)

    /**
     * O MIP do mês, na proporção do saldo que ainda resta.
     *
     * Com o saldo cheio — que é o do primeiro mês — a proporção devolve
     * exatamente o valor informado, e é por isso que a conta não distorce o
     * dado do usuário: ela o reproduz onde ele foi medido e o reduz onde a
     * base reduziu.
     */
    const mip =
      entrada.mipPrimeiraParcela === 0
        ? ZERO
        : proporcao(entrada.mipPrimeiraParcela, saldo, entrada.valorFinanciado, 'meio_para_cima')

    // A última prestação liquida o saldo, absorvendo o arredondamento.
    const amortiza =
      mes === n
        ? saldo
        : sistema === 'sac'
          ? amortizacaoConstante
          : naoNegativo(subtrair(parcelaConstante, jurosDoMes))

    const encargos = somar(mip, entrada.dfiMensal, entrada.tarifaMensal)
    const semEncargos = somar(amortiza, jurosDoMes)
    const prestacao = somar(semEncargos, encargos)

    saldo = naoNegativo(subtrair(saldo, amortiza))
    total = somar(total, prestacao)
    juros = somar(juros, jurosDoMes)
    seguros = somar(seguros, mip, entrada.dfiMensal)
    tarifas = somar(tarifas, entrada.tarifaMensal)

    if (mes === 1) {
      primeiraPrestacao = prestacao
      primeiraSemEncargos = semEncargos
    }
    ultimaPrestacao = prestacao

    if (mes % AVOS_NO_ANO === 0 || mes === n) {
      evolucao.push({
        ano: Math.ceil(mes / AVOS_NO_ANO),
        prestacao,
        juros: jurosDoMes,
        encargos,
        saldo,
      })
    }
  }

  return {
    primeiraPrestacao,
    ultimaPrestacao,
    primeiraSemEncargos,
    total,
    juros,
    seguros,
    tarifas,
    evolucao,
  }
}

export function calcularFinanciamentoImobiliario(
  entrada: EntradaFinanciamento,
  dataReferencia: DataISO,
): Resultado<SaidaFinanciamento> {
  if (entrada.valorFinanciado <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor financiado para ver o resultado.',
    }
  }
  if (entrada.prazoMeses <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o prazo para ver o resultado.',
    }
  }
  if (entrada.taxaMensal < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A taxa não pode ser negativa.' }
  }
  if (entrada.mipPrimeiraParcela < 0 || entrada.dfiMensal < 0 || entrada.tarifaMensal < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Seguros e tarifa não podem ser negativos.',
    }
  }

  const sac = simular(entrada, 'sac')
  const price = simular(entrada, 'price')
  const escolhida = entrada.sistema === 'sac' ? sac : price
  const nomeDoSistema = entrada.sistema === 'sac' ? 'SAC' : 'Price'

  const n = entrada.prazoMeses
  const etapas: Etapa[] = []

  if (entrada.sistema === 'sac') {
    etapas.push({
      rotulo: 'SAC — a parte que amortiza é constante',
      formula:
        `${reais(entrada.valorFinanciado)} ÷ ${n} = ` +
        `${reais(dividirPorInteiro(entrada.valorFinanciado, n, 'meio_para_cima'))} por mês, ` +
        `mais ${percentual(entrada.taxaMensal)} sobre o saldo devedor`,
      resultado: escolhida.primeiraSemEncargos,
      justificativa:
        'Todo mês você devolve a mesma fatia do que tomou, e os juros incidem sobre o que ' +
        'ainda resta — que cai em passos iguais. Por isso a prestação começa mais alta e ' +
        'diminui do começo ao fim.',
    })
  } else {
    etapas.push({
      rotulo: 'Price — a prestação de amortização e juros é constante',
      formula:
        `${reais(entrada.valorFinanciado)} × ${percentual(entrada.taxaMensal)} × ` +
        `(1+i)^${n} ÷ ((1+i)^${n} − 1)`,
      resultado: escolhida.primeiraSemEncargos,
      justificativa:
        'No sistema francês a soma de amortização e juros não muda. O que muda é a ' +
        'composição: no começo quase tudo é juro, e a fatia que amortiza cresce a cada mês.',
    })
  }

  if (entrada.mipPrimeiraParcela > 0) {
    etapas.push({
      rotulo: 'Seguro MIP da primeira prestação',
      formula: `Informado: ${reais(entrada.mipPrimeiraParcela)} sobre um saldo de ${reais(entrada.valorFinanciado)}`,
      resultado: entrada.mipPrimeiraParcela,
      justificativa:
        'O prêmio do seguro de morte e invalidez incide sobre o saldo devedor. Como o saldo ' +
        'cai a cada amortização, o prêmio cai na mesma proporção — a conta reduz o valor que ' +
        'você informou junto com o saldo, mês a mês. Seguradoras também reajustam o prêmio ' +
        'conforme a idade do segurado, e esse reajuste não entra aqui.',
    })
  }

  const fixosPorMes = somar(entrada.dfiMensal, entrada.tarifaMensal)
  if (fixosPorMes > 0) {
    etapas.push({
      rotulo: 'Seguro DFI e tarifa, iguais todo mês',
      formula:
        `${reais(entrada.dfiMensal)} de DFI + ${reais(entrada.tarifaMensal)} de tarifa`,
      resultado: fixosPorMes,
      justificativa:
        'O DFI cobre danos ao imóvel e incide sobre o valor de avaliação, que não muda ao ' +
        'longo do contrato. A tarifa de administração é valor fixo do contrato. Os dois ' +
        'seguem iguais até a última prestação, e por isso pesam mais no fim, quando a parte ' +
        'de juros já encolheu.',
    })
  }

  etapas.push({
    rotulo: 'Primeira prestação, com tudo o que é cobrado',
    formula: `${reais(escolhida.primeiraSemEncargos)} + ${reais(subtrair(escolhida.primeiraPrestacao, escolhida.primeiraSemEncargos))} de seguros e tarifa`,
    resultado: escolhida.primeiraPrestacao,
    justificativa:
      'É este o valor que sai da conta, e não o da linha acima — que é o que a taxa ' +
      'anunciada descreve.',
  })

  etapas.push({
    rotulo: 'Última prestação',
    formula: `Prestação ${n} de ${n}, no sistema ${nomeDoSistema}`,
    resultado: escolhida.ultimaPrestacao,
  })

  etapas.push({
    rotulo: `Total pago nas ${n} prestações`,
    formula: `Soma das ${n} prestações do sistema ${nomeDoSistema}`,
    resultado: escolhida.total,
  })

  etapas.push({
    rotulo: 'Do que esse total é feito',
    formula:
      `${reais(entrada.valorFinanciado)} financiados + ${reais(escolhida.juros)} de juros + ` +
      `${reais(escolhida.seguros)} de seguros + ${reais(escolhida.tarifas)} de tarifa`,
    resultado: escolhida.total,
    justificativa:
      'A soma fecha com o total acima porque as amortizações devolvem exatamente o que foi ' +
      'financiado — tudo o mais é custo do crédito.',
  })

  const totalEncargos = somar(escolhida.seguros, escolhida.tarifas)
  const parteDosEncargosBp = aliquotaEfetiva(totalEncargos, escolhida.total, 'meio_para_cima')

  if (totalEncargos > 0) {
    etapas.push({
      rotulo: 'Quanto os seguros e a tarifa pesam',
      formula: `${reais(totalEncargos)} ÷ ${reais(escolhida.total)} = ${percentual(parteDosEncargosBp)} do total pago`,
      resultado: totalEncargos,
      justificativa:
        'Esta é a parte que a taxa de juros anunciada não descreve, e é ela que separa o ' +
        'custo real do custo divulgado.',
    })
  }

  const economiaDoSac = subtrair(price.total, sac.total)
  etapas.push({
    rotulo: 'Comparação entre os dois sistemas',
    formula: `${reais(price.total)} (Price) − ${reais(sac.total)} (SAC)`,
    resultado: economiaDoSac,
    justificativa:
      'Com a mesma taxa e o mesmo prazo, o SAC custa menos no total porque amortiza mais ' +
      'cedo — e exige mais nas primeiras prestações, que é exatamente o motivo de nem ' +
      'sempre ser a escolha possível.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      sistema: entrada.sistema,
      primeiraPrestacao: escolhida.primeiraPrestacao,
      ultimaPrestacao: escolhida.ultimaPrestacao,
      primeiraSemEncargos: escolhida.primeiraSemEncargos,
      totalPago: escolhida.total,
      totalJuros: escolhida.juros,
      totalSeguros: escolhida.seguros,
      totalTarifas: escolhida.tarifas,
      totalEncargos,
      parteDosEncargosBp,
      totalSac: sac.total,
      totalPrice: price.total,
      economiaDoSac,
      evolucao: escolhida.evolucao,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-033 — Custo total de aquisição de imóvel
// ---------------------------------------------------------------------------

/**
 * **Nenhum dos custos daqui pode ser cadastrado, e isso não é limitação: é o
 * §14 do catálogo funcionando.** O ITBI tem alíquota MUNICIPAL, e são mais de
 * cinco mil municípios; os emolumentos de tabelionato e de registro seguem
 * tabela ESTADUAL, revista todo ano. Publicar uma média nacional seria publicar
 * um número errado com aparência de certo para quase todo mundo.
 *
 * A saída é a mesma de CALC-057 com o IPVA e de CALC-067 com a tarifa de água:
 * o dado entra digitado, e a ajuda do campo diz onde encontrá-lo. A guia do
 * ITBI vem da prefeitura, os emolumentos do site do tribunal de justiça do
 * estado, e o banco informa a tarifa de avaliação.
 *
 * **O que a calculadora entrega é o que ninguém soma antes de assinar:** quanto
 * é preciso ter EM DINHEIRO no dia, que não é a entrada — é a entrada mais os
 * custos, e é aí que o negócio trava.
 */

export interface EntradaAquisicao {
  readonly valorDoImovel: Centavos
  readonly entrada: Centavos
  /** Alíquota do ITBI do município, digitada. */
  readonly itbiBp: BasisPoints
  /** Emolumentos do tabelionato, quando há escritura pública. */
  readonly escritura: Centavos
  /** Emolumentos do registro de imóveis. */
  readonly registro: Centavos
  /** Tarifa de avaliação do banco, quando há financiamento. */
  readonly avaliacao: Centavos
  readonly outrasDespesas: Centavos
}

export interface SaidaAquisicao {
  readonly itbi: Centavos
  readonly custosAlemDoPreco: Centavos
  readonly custosBp: BasisPoints
  /** Entrada mais custos: o que precisa estar em dinheiro no dia. */
  readonly desembolsoNaAssinatura: Centavos
  readonly valorFinanciado: Centavos
  readonly custoTotalDaCompra: Centavos
}

export function calcularCustoDeAquisicao(
  entrada: EntradaAquisicao,
  dataReferencia: DataISO,
): Resultado<SaidaAquisicao> {
  if (entrada.valorDoImovel <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor do imóvel para ver o resultado.',
    }
  }
  if (entrada.entrada > entrada.valorDoImovel) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A entrada não pode ser maior que o valor do imóvel.',
    }
  }

  const etapas: Etapa[] = []

  /**
   * A base do ITBI é o valor da transação ou o valor venal de referência do
   * município, o que for maior — e o segundo o produto não tem como saber. O
   * campo aceita o valor informado, e a nota da tela avisa que a prefeitura
   * pode arbitrar base diferente.
   */
  const itbi = aplicarAliquota(entrada.valorDoImovel, entrada.itbiBp, 'meio_para_cima')
  if (entrada.itbiBp > 0) {
    etapas.push({
      rotulo: 'ITBI',
      formula: `${reais(entrada.valorDoImovel)} × ${percentual(entrada.itbiBp)}`,
      resultado: itbi,
      justificativa:
        'A alíquota é municipal e foi digitada por você. A prefeitura pode calcular o imposto ' +
        'sobre o valor venal de referência dela, e não sobre o preço do negócio — quando o ' +
        'valor de referência é maior, a guia sai acima desta conta.',
    })
  }

  const custosAlemDoPreco = somar(
    itbi,
    entrada.escritura,
    entrada.registro,
    entrada.avaliacao,
    entrada.outrasDespesas,
  )

  etapas.push({
    rotulo: 'Custos além do preço',
    formula:
      `${reais(itbi)} de ITBI + ${reais(entrada.escritura)} de escritura + ` +
      `${reais(entrada.registro)} de registro + ${reais(entrada.avaliacao)} de avaliação + ` +
      `${reais(entrada.outrasDespesas)} de outras`,
    resultado: custosAlemDoPreco,
  })

  const custosBp = aliquotaEfetiva(custosAlemDoPreco, entrada.valorDoImovel, 'meio_para_cima')
  etapas.push({
    rotulo: 'O que os custos representam sobre o preço',
    formula: `${reais(custosAlemDoPreco)} ÷ ${reais(entrada.valorDoImovel)}`,
    resultado: centavos(custosBp),
    unidade: 'percentual',
  })

  const desembolsoNaAssinatura = somar(entrada.entrada, custosAlemDoPreco)
  etapas.push({
    rotulo: 'Quanto precisa estar em dinheiro',
    formula: `${reais(entrada.entrada)} de entrada + ${reais(custosAlemDoPreco)} de custos`,
    resultado: desembolsoNaAssinatura,
    justificativa:
      'Este é o número que trava negócio: o comprador junta a entrada e descobre os custos ' +
      'depois. Eles não podem ser financiados junto com o imóvel — saem do bolso no dia.',
  })

  const valorFinanciado = subtrair(entrada.valorDoImovel, entrada.entrada)
  const custoTotalDaCompra = somar(entrada.valorDoImovel, custosAlemDoPreco)

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      itbi,
      custosAlemDoPreco,
      custosBp,
      desembolsoNaAssinatura,
      valorFinanciado,
      custoTotalDaCompra,
    },
    traco,
  }
}
