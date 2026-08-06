/**
 * CALC-051 — Pró-labore e encargos do sócio.
 *
 * **Os 11% que a empresa desconta não estão escritos em norma nenhuma.** É o
 * resultado de duas regras que se encontram:
 *
 *   Art. 22, III da Lei nº 8.212/1991 — a empresa recolhe **20%** sobre a
 *   remuneração paga a contribuinte individual que lhe presta serviço.
 *
 *   Art. 30, § 4º — o segurado "poderá deduzir, da sua contribuição mensal,
 *   quarenta e cinco por cento da contribuição da empresa [...] **limitada a
 *   dedução a nove por cento** do respectivo salário-de-contribuição".
 *
 * Com a patronal em 20%, 45% dela são exatamente 9%: o teto é alcançado, e a
 * contribuição do sócio cai dos 20% do caput para 11%. O motor faz essa
 * subtração à vista, e a memória mostra as duas parcelas — porque um número que
 * ninguém sabe de onde vem é um número que ninguém audita.
 *
 * **Quem retém é a empresa** (Lei nº 10.666/2003, art. 4º): ela arrecada a
 * contribuição do contribuinte individual a seu serviço, descontando-a da
 * remuneração, e recolhe junto com a parcela a seu cargo.
 *
 * O QUE A PÁGINA NÃO DECIDE
 *
 * Se a patronal de 20% é recolhida por fora ou está dentro do DAS do Simples é
 * **campo do usuário**, e não uma classificação que a calculadora faça: isso
 * depende do anexo em que a empresa é tributada, que muda com a atividade e com
 * o fator R. Quem sabe é o contador; a página pergunta.
 */

import { calcularIrrf } from '../irrf'
import {
  aliquotaEfetiva,
  aplicarAliquota,
  limitarAoTeto,
  multiplicarPorInteiro,
  somar,
  subtrair,
} from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { ZERO, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_10666_ART_4 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const
const MESES_NO_ANO = 12

export const PARAMETROS_PRO_LABORE = [
  'inss-individual-aliquota-completa',
  'inss-patronal-contribuinte-individual',
  'inss-individual-deducao-maxima',
  'inss-tabela-progressiva',
  'irrf-tabela-progressiva',
  'irrf-deducao-dependente',
  'irrf-desconto-simplificado',
] as const

export interface EntradaProLabore {
  readonly proLabore: Centavos
  /** A empresa recolhe a patronal de 20% por fora do DAS. */
  readonly patronalPorFora: boolean
  readonly dependentes: number
  readonly pensao: Centavos
}

export interface SaidaProLabore {
  readonly baseInss: Centavos
  readonly limitadoPeloTeto: boolean
  readonly aliquotaDoSocioBp: BasisPoints
  readonly inssDoSocio: Centavos
  readonly irrf: Centavos
  readonly liquidoDoSocio: Centavos
  readonly patronal: Centavos
  readonly custoDaEmpresa: Centavos
  readonly custoAnual: Centavos
  /** Quanto do que a empresa gasta chega ao bolso do sócio. */
  readonly parteQueChegaBp: BasisPoints
}

export function calcularProLabore(
  entrada: EntradaProLabore,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaProLabore> {
  if (entrada.proLabore <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor do pró-labore para ver o resultado.',
    }
  }

  const completa = registro.resolver('inss-individual-aliquota-completa', dataReferencia)
  const patronalBp = registro.resolver('inss-patronal-contribuinte-individual', dataReferencia)
  const tetoDeducao = registro.resolver('inss-individual-deducao-maxima', dataReferencia)
  const tabela = registro.resolver('inss-tabela-progressiva', dataReferencia)

  for (const r of [completa, patronalBp, tetoDeducao, tabela]) {
    if (!r.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: r.detalhe }
  }
  if (
    !completa.ok ||
    !patronalBp.ok ||
    !tetoDeducao.ok ||
    !tabela.ok ||
    completa.resolvida.vigencia.valor.tipo !== 'percentual' ||
    patronalBp.resolvida.vigencia.valor.tipo !== 'percentual' ||
    tetoDeducao.resolvida.vigencia.valor.tipo !== 'percentual' ||
    tabela.resolvida.vigencia.valor.tipo !== 'tabela_faixas'
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Parâmetro de INSS inválido.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)

  /** O teto é o limite superior da última faixa — a nota está em `inss.ts`. */
  const faixas = tabela.resolvida.vigencia.valor.faixas
  const teto = centavos(faixas[faixas.length - 1]?.limiteSuperiorCentavos ?? entrada.proLabore)
  const baseInss = limitarAoTeto(entrada.proLabore, teto)
  const limitadoPeloTeto = baseInss < entrada.proLabore

  if (limitadoPeloTeto) {
    traco.passoComParametro(
      'Base limitada ao teto previdenciário',
      `${reais(entrada.proLabore)} excede o teto de ${reais(teto)}`,
      baseInss,
      tabela.resolvida,
      'A contribuição do segurado não incide sobre a parcela que excede o teto. A patronal de ' +
        '20%, essa, incide sobre o pró-labore inteiro — ela não tem teto.',
    )
  }

  /**
   * A subtração que produz os 11%. Ela aparece na memória porque um número que
   * ninguém sabe de onde vem é um número que ninguém audita.
   */
  const completaBp = completa.resolvida.vigencia.valor.aliquotaBp as BasisPoints
  const tetoDeducaoBp = tetoDeducao.resolvida.vigencia.valor.aliquotaBp as BasisPoints
  const aliquotaDoSocioBp = (completaBp - tetoDeducaoBp) as BasisPoints

  traco.passoComParametro(
    'Alíquota do sócio, depois da dedução do § 4º',
    `${percentual(completaBp)} do caput − ${percentual(tetoDeducaoBp)} de dedução`,
    centavos(aliquotaDoSocioBp),
    tetoDeducao.resolvida,
    'Nenhuma norma escreve "11%". A lei manda deduzir 45% da contribuição da empresa, limitada ' +
      'a 9% do salário-de-contribuição — e como a patronal é de 20%, 45% dela dão exatamente os ' +
      '9% do teto. É a subtração que produz o número que aparece no seu recibo.',
  )

  const inssDoSocio = aplicarAliquota(baseInss, aliquotaDoSocioBp, POLITICA)
  traco.passoComFundamento(
    'INSS descontado do sócio',
    `${reais(baseInss)} × ${percentual(aliquotaDoSocioBp)}`,
    inssDoSocio,
    LEI_10666_ART_4,
    'Quem desconta e recolhe é a EMPRESA, junto com a parcela a seu cargo. O sócio não emite ' +
      'guia por essa parte.',
  )

  const irpf = calcularIrrf(
    {
      rendimentoBruto: entrada.proLabore,
      inss: inssDoSocio,
      dependentes: entrada.dependentes,
      pensao: entrada.pensao,
    },
    dataReferencia,
    registro,
  )
  if (!irpf.ok) return irpf

  const liquidoDoSocio = subtrair(entrada.proLabore, somar(inssDoSocio, irpf.valores.imposto))

  /**
   * A patronal incide sobre o pró-labore INTEIRO, sem teto — é a diferença que
   * mais surpreende quem compara com o empregado.
   */
  const patronalAliquotaBp = patronalBp.resolvida.vigencia.valor.aliquotaBp as BasisPoints
  const patronal = entrada.patronalPorFora
    ? aplicarAliquota(entrada.proLabore, patronalAliquotaBp, POLITICA)
    : ZERO

  if (entrada.patronalPorFora) {
    traco.passoComParametro(
      'Contribuição patronal',
      `${reais(entrada.proLabore)} × ${percentual(patronalAliquotaBp)}`,
      patronal,
      patronalBp.resolvida,
      'Ela incide sobre o pró-labore inteiro, sem teto — diferente do desconto do sócio, que ' +
        'para no limite máximo do salário-de-contribuição.',
    )
  }

  const custoDaEmpresa = somar(entrada.proLabore, patronal)
  traco.passo(
    'Custo total para a empresa',
    `${reais(entrada.proLabore)} de pró-labore + ${reais(patronal)} de patronal`,
    custoDaEmpresa,
  )

  const parteQueChegaBp = aliquotaEfetiva(liquidoDoSocio, custoDaEmpresa, POLITICA)

  return {
    ok: true,
    valores: {
      baseInss,
      limitadoPeloTeto,
      aliquotaDoSocioBp,
      inssDoSocio,
      irrf: irpf.valores.imposto,
      liquidoDoSocio,
      patronal,
      custoDaEmpresa,
      custoAnual: multiplicarPorInteiro(custoDaEmpresa, MESES_NO_ANO),
      parteQueChegaBp,
    },
    traco: {
      etapas: [...traco.construir().etapas, ...irpf.traco.etapas],
      dataReferencia,
      vigenciasAplicadas: [
        ...traco.construir().vigenciasAplicadas,
        ...irpf.traco.vigenciasAplicadas,
      ],
    },
  }
}
