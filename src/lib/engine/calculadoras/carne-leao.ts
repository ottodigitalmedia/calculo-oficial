/**
 * CALC-053 — Carnê-leão: recolhimento mensal do autônomo.
 *
 * **Nenhum parâmetro legal novo.** A tabela é a mesma do IRRF mensal, já
 * cadastrada e conferida, e o motor de `engine/irrf.ts` já resolve deduções
 * legais, desconto simplificado e a escolha da base mais favorável. O que este
 * módulo acrescenta é o que o carnê-leão tem de próprio: **o livro-caixa**.
 *
 * QUEM DEVE RECOLHER — Lei nº 7.713/1988, art. 8º
 *
 * "Fica sujeito ao pagamento do imposto de renda [...] a pessoa física que
 * receber de OUTRA PESSOA FÍSICA, ou de fontes situadas no exterior,
 * rendimentos e ganhos de capital que não tenham sido tributados na fonte, no
 * País."
 *
 * É a distinção que a página existe para deixar clara: quem recebe de empresa
 * tem retenção na fonte e não usa carnê-leão pela mesma renda. Quem atende
 * pessoas físicas recolhe por conta própria, todo mês.
 *
 * O LIVRO-CAIXA, E A REGRA QUE QUASE NINGUÉM CONHECE — Lei nº 8.134/1990, art. 6º
 *
 * Deduzem-se da receita da atividade: remuneração paga a terceiros com vínculo
 * e respectivos encargos (I), emolumentos pagos a terceiros (II) e despesas de
 * custeio necessárias à percepção da receita e à manutenção da fonte produtora
 * (III).
 *
 * O § 1º exclui depreciação, arrendamento e, salvo representante comercial
 * autônomo, despesas de locomoção e transporte.
 *
 * **E o § 3º é a regra que muda o resultado de quem tem mês fraco:** as
 * deduções "não poderão exceder à receita mensal da respectiva atividade,
 * permitido o cômputo do excesso de deduções nos meses seguintes, até
 * dezembro". O excesso não se perde no mês — ele transporta. Só não atravessa
 * o ano.
 */

import { calcularIrrf, type SaidaIrrf } from '../irrf'
import { aliquotaEfetiva, minimo, naoNegativo, somar, subtrair } from '../money'
import { fundamentar, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_7713_ART_8, LEI_8134_ART_6 } from '../../params/data/fontes'

export const PARAMETROS_CARNE_LEAO = [
  'irrf-tabela-progressiva',
  'irrf-deducao-dependente',
  'irrf-desconto-simplificado',
] as const

export interface EntradaCarneLeao {
  /** Recebido de pessoa física ou do exterior, sem retenção na fonte no País. */
  readonly rendimento: Centavos
  /** Despesas escrituradas no livro-caixa, no mês. */
  readonly livroCaixa: Centavos
  /** Excesso de livro-caixa vindo dos meses anteriores do mesmo ano. */
  readonly excessoAnterior: Centavos
  /** Contribuição previdenciária paga no mês. */
  readonly inss: Centavos
  readonly dependentes: number
  readonly pensao: Centavos
}

export interface SaidaCarneLeao {
  readonly rendimento: Centavos
  /** Livro-caixa do mês somado ao excesso que veio de trás. */
  readonly livroCaixaDisponivel: Centavos
  /** Quanto do livro-caixa coube na receita do mês — o § 3º. */
  readonly livroCaixaAplicado: Centavos
  /** O que sobrou e vai para o mês seguinte, até dezembro. */
  readonly excessoATransportar: Centavos
  /** Receita já líquida do livro-caixa, que é a base do IRPF. */
  readonly rendimentoTributavel: Centavos
  readonly imposto: Centavos
  readonly baseCalculo: Centavos
  readonly baseEscolhida: SaidaIrrf['baseEscolhida']
  readonly aliquotaFaixa: SaidaIrrf['aliquotaFaixa']
  /** Quanto o imposto representa do que entrou. */
  readonly mordidaBp: BasisPoints
}

export function calcularCarneLeao(
  entrada: EntradaCarneLeao,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaCarneLeao> {
  if (entrada.rendimento < 0 || entrada.livroCaixa < 0 || entrada.excessoAnterior < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Valores não podem ser negativos.' }
  }
  if (entrada.rendimento <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quanto você recebeu de pessoas físicas no mês para ver o resultado.',
    }
  }

  const etapas: Etapa[] = [
    {
      rotulo: 'Recebido de pessoas físicas no mês',
      formula: reais(entrada.rendimento),
      resultado: entrada.rendimento,
      fundamento: fundamentar(LEI_7713_ART_8),
      justificativa:
        'O carnê-leão alcança o que se recebe de outra PESSOA FÍSICA ou do exterior, sem ' +
        'retenção na fonte no País. O que vem de empresa já tem imposto retido e não entra aqui.',
    },
  ]

  /**
   * O § 3º do art. 6º: a dedução não pode passar da receita do mês, e o que
   * sobra vai para os meses seguintes. Ignorar isso zeraria o excesso de quem
   * teve mês fraco — e é justamente quem mais precisa dele.
   */
  const livroCaixaDisponivel = somar(entrada.livroCaixa, entrada.excessoAnterior)
  const livroCaixaAplicado = minimo(livroCaixaDisponivel, entrada.rendimento)
  const excessoATransportar = subtrair(livroCaixaDisponivel, livroCaixaAplicado)

  if (livroCaixaDisponivel > 0) {
    etapas.push({
      rotulo: 'Livro-caixa disponível',
      formula:
        entrada.excessoAnterior > 0
          ? `${reais(entrada.livroCaixa)} do mês + ${reais(entrada.excessoAnterior)} vindos de trás`
          : reais(entrada.livroCaixa),
      resultado: livroCaixaDisponivel,
      fundamento: fundamentar(LEI_8134_ART_6),
      justificativa:
        'Entram remuneração paga a terceiros com vínculo e encargos, emolumentos pagos a ' +
        'terceiros e despesas de custeio necessárias à atividade. Ficam de fora depreciação, ' +
        'arrendamento e — salvo representante comercial autônomo — locomoção e transporte.',
    })

    etapas.push({
      rotulo: 'Livro-caixa aplicado neste mês',
      formula: `menor entre ${reais(livroCaixaDisponivel)} e a receita de ${reais(entrada.rendimento)}`,
      resultado: livroCaixaAplicado,
      fundamento: fundamentar(LEI_8134_ART_6),
      justificativa:
        'A dedução não pode exceder a receita do mês. O que sobra NÃO se perde: é computado nos ' +
        'meses seguintes, até dezembro. O que restar em dezembro é que não passa para o ano ' +
        'seguinte.',
    })
  }

  const rendimentoTributavel = naoNegativo(subtrair(entrada.rendimento, livroCaixaAplicado))

  if (livroCaixaAplicado > 0) {
    etapas.push({
      rotulo: 'Rendimento tributável',
      formula: `${reais(entrada.rendimento)} − ${reais(livroCaixaAplicado)}`,
      resultado: rendimentoTributavel,
    })
  }

  /**
   * Daqui para a frente é o IRPF mensal, e o motor é o mesmo de CALC-015 — com
   * as deduções legais, o desconto simplificado e a escolha da base mais
   * favorável. Reaproveitar em vez de reescrever é o que garante que os dois
   * caminhos nunca divirjam.
   */
  const irpf = calcularIrrf(
    {
      rendimentoBruto: rendimentoTributavel,
      inss: entrada.inss,
      dependentes: entrada.dependentes,
      pensao: entrada.pensao,
    },
    dataReferencia,
    registro,
  )
  if (!irpf.ok) return irpf

  const traco: Traco = {
    etapas: [...etapas, ...irpf.traco.etapas],
    dataReferencia,
    vigenciasAplicadas: irpf.traco.vigenciasAplicadas,
  }

  const mordidaBp = aliquotaEfetiva(irpf.valores.imposto, entrada.rendimento, 'meio_para_cima')

  return {
    ok: true,
    valores: {
      rendimento: entrada.rendimento,
      livroCaixaDisponivel,
      livroCaixaAplicado,
      excessoATransportar,
      rendimentoTributavel,
      imposto: irpf.valores.imposto,
      baseCalculo: irpf.valores.baseCalculo,
      baseEscolhida: irpf.valores.baseEscolhida,
      aliquotaFaixa: irpf.valores.aliquotaFaixa,
      mordidaBp,
    },
    traco,
  }
}

/** Quanto sobra depois do imposto. */
export function liquidoDoMes(saida: SaidaCarneLeao): Centavos {
  return subtrair(saida.rendimento, saida.imposto)
}

export { ZERO }
