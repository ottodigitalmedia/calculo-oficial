/**
 * CALC-113 — Ganho de capital na venda de bens: carro, moto, joias, obras de
 * arte, cotas de empresa.
 *
 * A mesma regra de CALC-021, sem o recorte do criptoativo:
 *
 * 1. **isenção de pequeno valor** (Lei nº 9.250/1995, art. 22, II): o ganho é
 *    isento quando o PREÇO de alienação no mês não passa do teto — e, havendo
 *    vários bens da mesma natureza, conta o CONJUNTO vendido no mês
 *    (parágrafo único). Carro de R$ 30.000,00 vendido com lucro: isento. Carro
 *    de R$ 60.000,00: o ganho inteiro é tributado;
 * 2. **alíquotas progressivas** sobre o ganho (Lei nº 8.981/1995, art. 21),
 *    cada uma sobre a parcela contida na sua faixa — a tabela de CALC-020.
 *
 * **Fica de fora, e a tela diz:** imóvel (CALC-020, com os fatores de redução
 * e a isenção do imóvel único), criptoativo (CALC-021), ações em bolsa
 * (CALC-093) e ações no mercado de balcão, cujo teto é outro (inciso I).
 */

import { naoNegativo, somar, somarAliquotasPorFaixa, subtrair } from '../money'
import { ConstrutorDeTraco, reais, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

export const PARAMETROS_VENDA_DE_BENS = ['ganho-capital-tabela', 'ganho-capital-isencao-pequeno-valor'] as const

export interface EntradaVendaDeBem {
  /** Preço de venda do bem. */
  readonly valorDeVenda: Centavos
  /** Quanto o bem custou, com as benfeitorias e despesas de aquisição comprovadas. */
  readonly custoDeAquisicao: Centavos
  /**
   * Outros bens DA MESMA NATUREZA vendidos no mesmo mês — dois carros, três
   * joias. Somam no teste do teto (art. 22, parágrafo único).
   */
  readonly outrasVendasNoMes: Centavos
}

export interface SaidaVendaDeBem {
  readonly imposto: Centavos
  /** Pode ser negativo: prejuízo. */
  readonly ganho: Centavos
  readonly conjuntoNoMes: Centavos
  readonly tetoIsencao: Centavos
  readonly isento: boolean
  readonly liquido: Centavos
}

export function calcularVendaDeBem(
  entrada: EntradaVendaDeBem,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaVendaDeBem> {
  if (entrada.valorDeVenda <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o preço de venda do bem.' }
  }
  if (entrada.custoDeAquisicao < 0 || entrada.outrasVendasNoMes < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Valores não podem ser negativos.' }
  }

  const tabela = registro.resolver('ganho-capital-tabela', dataReferencia)
  const teto = registro.resolver('ganho-capital-isencao-pequeno-valor', dataReferencia)
  if (!tabela.ok || !teto.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há as regras de ganho de capital para a data informada.' }
  }
  if (tabela.resolvida.vigencia.valor.tipo !== 'tabela_faixas' || teto.resolvida.vigencia.valor.tipo !== 'valor_monetario') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Parâmetro de ganho de capital em formato inesperado.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)
  const tetoIsencao = centavos(teto.resolvida.vigencia.valor.centavos)

  const conjuntoNoMes = somar(entrada.valorDeVenda, entrada.outrasVendasNoMes)
  traco.passo(
    'Vendido no mês — bens da mesma natureza',
    entrada.outrasVendasNoMes > 0
      ? `${reais(entrada.valorDeVenda)} + ${reais(entrada.outrasVendasNoMes)} de outros bens da mesma natureza`
      : reais(entrada.valorDeVenda),
    conjuntoNoMes,
  )

  // Prejuízo não gera imposto, e este motor não o compensa com outros ganhos:
  // a compensação tem regra própria, e inventá-la seria pior que omiti-la.
  const ganhoBruto = subtrair(entrada.valorDeVenda, entrada.custoDeAquisicao)
  const ganho = naoNegativo(ganhoBruto)
  traco.passo('Ganho de capital', `${reais(entrada.valorDeVenda)} − ${reais(entrada.custoDeAquisicao)}`, ganhoBruto)

  const isento = conjuntoNoMes <= tetoIsencao
  traco.passoComParametro(
    isento ? 'Isento — pequeno valor' : 'Tributado — o conjunto do mês passou do teto',
    `${reais(conjuntoNoMes)} ${isento ? '≤' : '>'} ${reais(tetoIsencao)}`,
    isento ? ZERO : ganho,
    teto.resolvida,
    isento
      ? 'A isenção olha o PREÇO de venda no mês, não o lucro — e soma os bens da mesma natureza vendidos no mesmo mês.'
      : 'Passado o teto, o ganho inteiro é tributado — o teto é degrau, não dedução.',
  )

  if (isento || ganho === ZERO) {
    traco.passo('Imposto devido', isento ? 'isento' : 'sem ganho a tributar', ZERO)
    return {
      ok: true,
      valores: { imposto: ZERO, ganho: ganhoBruto, conjuntoNoMes, tetoIsencao, isento, liquido: ganhoBruto },
      traco: traco.construir(),
    }
  }

  // A mesma leitura por faixa de CALC-020 e CALC-021: cada alíquota alcança só
  // a parcela do ganho contida na sua faixa.
  const parcelas = tabela.resolvida.vigencia.valor.faixas
    .map((faixa) => {
      const piso = faixa.limiteInferiorCentavos
      const topo = faixa.limiteSuperiorCentavos ?? ganho
      const naFaixa = Math.min(ganho, topo) - piso + (piso === 0 ? 0 : 1)
      return { base: centavos(Math.max(0, Math.min(naFaixa, ganho))), aliquota: basisPoints(faixa.aliquotaBp) }
    })
    .filter((p) => p.base > 0)

  const imposto = somarAliquotasPorFaixa(parcelas, POLITICA)
  traco.passoComParametro(
    'Imposto sobre o ganho',
    `${reais(ganho)} pelas faixas da tabela progressiva`,
    imposto,
    tabela.resolvida,
    'Cada alíquota incide só sobre a parcela do ganho contida na sua faixa.',
  )

  const liquido = subtrair(ganho, imposto)
  traco.passo('Ganho depois do imposto', `${reais(ganho)} − ${reais(imposto)}`, liquido)

  return {
    ok: true,
    valores: { imposto, ganho: ganhoBruto, conjuntoNoMes, tetoIsencao, isento, liquido },
    traco: traco.construir(),
  }
}
