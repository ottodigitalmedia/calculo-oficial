/**
 * CALC-020 — Imposto sobre o ganho de capital na venda de imóvel.
 *
 * **Os fatores de redução são o que quase nenhuma calculadora do mercado
 * aplica**, e são justamente o que faz a diferença em imóvel antigo. O art. 40
 * da Lei nº 11.196/2005 manda multiplicar o ganho por dois:
 *
 *     FR1 = 1 / 1,0060^m1     FR2 = 1 / 1,0035^m2
 *
 * `m1` são os meses entre a aquisição e novembro de 2005 — o mês da publicação
 * da lei —, e `m2` os meses entre dezembro de 2005 (ou o mês da aquisição, se
 * posterior) e o da alienação. Para imóvel adquirido até 31/12/1995 o § 2º manda
 * contar o FR1 só a partir de 1º/01/1996.
 *
 * Sobre um imóvel comprado nos anos 1990 os dois fatores juntos derrubam a base
 * pela metade ou mais. Ignorá-los produz um imposto muito maior que o devido —
 * errar para mais também é errar.
 *
 * **A exponenciação é em inteiro grande**, reusando `fatorDeCapitalizacao` de
 * `financeira.ts`. Nenhum ponto flutuante entra na conta.
 *
 * A TABELA É PROGRESSIVA, E A REDAÇÃO VIGENTE É A TERCEIRA
 *
 * Ver a nota longa em `params/data/ganho-de-capital.ts`: o art. 21 aparece com
 * três redações empilhadas, e a da MP nº 692/2015 traz faixas que não valem.
 *
 * O QUE ESTA CALCULADORA NÃO FAZ, DECLARADO
 *
 * **A redução do art. 18 da Lei nº 7.713/1988** — um percentual adicional para
 * imóveis adquiridos até 1988 — não é aplicada. O § 2º do art. 40 a preserva
 * expressamente ("sem prejuízo do disposto no art. 18"), e não implementá-la faz
 * o imposto sair MAIOR que o devido para quem comprou antes de 1989. A tela diz
 * isso quando a data de aquisição é anterior.
 */

import { compararDatas, lerData, type DataCivil } from '../datas'
import { ESCALA, fatorDeCapitalizacao } from '../financeira'
import {
  aliquotaEfetiva,
  naoNegativo,
  proporcao,
  somarAliquotasPorFaixa,
  subtrair,
} from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_11196_ART_39, LEI_11196_ART_40 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

export const PARAMETROS_GANHO_DE_CAPITAL = [
  'ganho-capital-tabela',
  'ganho-capital-isencao-imovel-unico',
  'ganho-capital-fr1-coeficiente',
  'ganho-capital-fr2-coeficiente',
  'ganho-capital-prazo-reinvestimento',
] as const

/**
 * Marcos do art. 40, e por que são DATAS e não parâmetros.
 *
 * Eles não são valores que mudam com o tempo: são a estrutura da própria regra.
 * O art. 40 divide a vida do imóvel em dois trechos usando a publicação da Lei
 * nº 11.196/2005 como divisor, e o § 2º fixa 1996 como piso do primeiro. Trocar
 * qualquer um deles não é "atualizar um parâmetro" — é outra regra.
 *
 * A data de publicação está registrada em `params/data/ganho-de-capital.ts`,
 * onde vive a vigência dos coeficientes.
 */
/* eslint-disable no-restricted-syntax -- marcos estruturais do art. 40, não parâmetros */
const MES_DA_PUBLICACAO: DataCivil = { ano: 2005, mes: 11, dia: 1 }
const PRIMEIRO_MES_DO_FR2: DataCivil = { ano: 2005, mes: 12, dia: 1 }
/** O § 2º: para imóvel adquirido até 31/12/1995, o FR1 conta de 1996 em diante. */
const INICIO_DO_FR1: DataCivil = { ano: 1996, mes: 1, dia: 1 }
/** Antes disto vale a redução do art. 18 da Lei nº 7.713/1988, que fica de fora. */
const PRIMEIRO_ANO_SEM_REDUCAO_ADICIONAL = 1989
/* eslint-enable no-restricted-syntax */

/** Cem por cento em basis points — unidade, não parâmetro (`ADR-004` A-2). */
// eslint-disable-next-line no-restricted-syntax -- unidade de basis points
const BP_INTEIRO = 10_000

export interface EntradaGanhoDeCapital {
  readonly valorDeVenda: Centavos
  readonly custoDeAquisicao: Centavos
  readonly dataDeAquisicao: DataISO
  readonly dataDaVenda: DataISO
  /** É o único imóvel e não houve outra alienação nos cinco anos anteriores. */
  readonly imovelUnicoSemAlienacaoRecente: boolean
  /** Quanto do produto da venda será aplicado em imóvel residencial em 180 dias. */
  readonly reinvestido: Centavos
}

export interface SaidaGanhoDeCapital {
  readonly ganhoBruto: Centavos
  readonly meses1: number
  readonly meses2: number
  readonly fr1Bp: BasisPoints
  readonly fr2Bp: BasisPoints
  readonly ganhoReduzido: Centavos
  readonly isentoPorImovelUnico: boolean
  readonly parcelaIsentaPorReinvestimento: Centavos
  readonly baseTributavel: Centavos
  readonly imposto: Centavos
  readonly aliquotaEfetivaBp: BasisPoints
  readonly liquidoDaVenda: Centavos
  /** Aquisição anterior a 1989 — há redução adicional que a página não aplica. */
  readonly temReducaoNaoAplicada: boolean
}

/**
 * A base composta do fator, escrita como a lei a escreve: `1,0060`, `1,0035`.
 *
 * **É ela que aparece na memória de cálculo, e não o percentual.** O fator é
 * aplicado com a divisão exata; o percentual é arredondado a quatro casas para
 * caber na tela. Escrever `× 65,78%` no passo daria um número que não bate
 * quando alguém confere na calculadora — 57 reais de diferença num ganho de
 * oitocentos mil. Numa memória de cálculo auditável, um passo que não se
 * reproduz é pior que passo nenhum.
 *
 * A montagem é textual de propósito: `1,` mais os basis points com zeros à
 * esquerda. Nenhuma divisão em ponto flutuante para exibir.
 */
function baseComposta(aliquotaBp: number): string {
  return `1,${String(aliquotaBp).padStart(4, '0')}`
}

/** Meses-calendário decorridos entre dois marcos, nunca negativo. */
function mesesEntre(de: DataCivil, ate: DataCivil): number {
  const bruto = (ate.ano - de.ano) * 12 + (ate.mes - de.mes)
  return Math.max(0, bruto)
}

/**
 * **O fator é aplicado em inteiro grande, e só depois vira basis points para a
 * tela.** Converter antes de aplicar custaria dinheiro de verdade: basis points
 * têm resolução de 0,0001, e sobre um ganho de oitocentos mil reais isso é mais
 * de cem reais de base — num produto cuja tese é a exatidão da conta.
 *
 * `divisorDoFator` devolve (1+i)^m na escala de `financeira.ts`; dividir por ele
 * é multiplicar pelo fator de redução, sem perda no caminho.
 */
function divisorDoFator(coeficienteBp: number, meses: number): bigint {
  return meses <= 0 ? ESCALA : fatorDeCapitalizacao(BigInt(coeficienteBp), meses)
}

/** O mesmo fator em basis points — para EXIBIR, nunca para aplicar. */
function fatorEmBp(divisor: bigint): BasisPoints {
  return basisPoints(Number((ESCALA * BigInt(BP_INTEIRO)) / divisor))
}

/** Aplica os dois fatores de uma vez, em inteiro grande. */
function aplicarFatores(ganho: Centavos, divisor1: bigint, divisor2: bigint): Centavos {
  const numerador = BigInt(ganho) * ESCALA * ESCALA
  const denominador = divisor1 * divisor2
  // Meio para cima, na magnitude — mesma política do resto do motor.
  const dobro = (numerador * 2n) / denominador
  return centavos(Number((dobro + 1n) / 2n))
}

export function calcularGanhoDeCapital(
  entrada: EntradaGanhoDeCapital,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaGanhoDeCapital> {
  const aquisicao = lerData(entrada.dataDeAquisicao)
  const venda = lerData(entrada.dataDaVenda)

  if (entrada.valorDeVenda <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor da venda para ver o resultado.',
    }
  }
  if (!aquisicao || !venda) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a data de aquisição e a data da venda para ver o resultado.',
    }
  }
  if (compararDatas(aquisicao, venda) > 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A data da venda precisa ser posterior à da aquisição.',
    }
  }

  const tabela = registro.resolver('ganho-capital-tabela', dataReferencia)
  const isencaoUnico = registro.resolver('ganho-capital-isencao-imovel-unico', dataReferencia)
  const fr1 = registro.resolver('ganho-capital-fr1-coeficiente', dataReferencia)
  const fr2 = registro.resolver('ganho-capital-fr2-coeficiente', dataReferencia)

  for (const r of [tabela, isencaoUnico, fr1, fr2]) {
    if (!r.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: r.detalhe }
  }
  if (
    !tabela.ok ||
    !isencaoUnico.ok ||
    !fr1.ok ||
    !fr2.ok ||
    tabela.resolvida.vigencia.valor.tipo !== 'tabela_faixas' ||
    isencaoUnico.resolvida.vigencia.valor.tipo !== 'valor_monetario' ||
    fr1.resolvida.vigencia.valor.tipo !== 'percentual' ||
    fr2.resolvida.vigencia.valor.tipo !== 'percentual'
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Parâmetro inválido.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)

  const ganhoBruto = naoNegativo(subtrair(entrada.valorDeVenda, entrada.custoDeAquisicao))
  traco.passo(
    'Ganho de capital',
    `${reais(entrada.valorDeVenda)} de venda − ${reais(entrada.custoDeAquisicao)} de custo`,
    ganhoBruto,
  )

  /**
   * Venda com prejuízo não gera imposto, e a conta para aqui — aplicar fatores
   * e faixas sobre zero só produziria ruído na memória.
   */
  if (ganhoBruto === 0) {
    return {
      ok: true,
      valores: {
        ganhoBruto: ZERO,
        meses1: 0,
        meses2: 0,
        fr1Bp: basisPoints(BP_INTEIRO),
        fr2Bp: basisPoints(BP_INTEIRO),
        ganhoReduzido: ZERO,
        isentoPorImovelUnico: false,
        parcelaIsentaPorReinvestimento: ZERO,
        baseTributavel: ZERO,
        imposto: ZERO,
        aliquotaEfetivaBp: basisPoints(0),
        liquidoDaVenda: entrada.valorDeVenda,
        temReducaoNaoAplicada: aquisicao.ano < PRIMEIRO_ANO_SEM_REDUCAO_ADICIONAL,
      },
      traco: traco.construir(),
    }
  }

  /**
   * A isenção do imóvel único é do art. 23 da Lei nº 9.250/1995, e depende de
   * três condições cumulativas que só o usuário conhece — por isso ela é uma
   * afirmação dele, e não uma dedução da calculadora.
   */
  const tetoDoUnico = centavos(isencaoUnico.resolvida.vigencia.valor.centavos)
  const isentoPorImovelUnico =
    entrada.imovelUnicoSemAlienacaoRecente && entrada.valorDeVenda <= tetoDoUnico

  if (isentoPorImovelUnico) {
    traco.passoComParametro(
      'Isenção do imóvel único',
      `${reais(entrada.valorDeVenda)} não excede ${reais(tetoDoUnico)}`,
      ZERO,
      isencaoUnico.resolvida,
      'A isenção exige três condições ao mesmo tempo: ser o único imóvel, o valor de alienação ' +
        'não passar do teto, e não ter havido outra alienação nos cinco anos anteriores.',
    )

    return {
      ok: true,
      valores: {
        ganhoBruto,
        meses1: 0,
        meses2: 0,
        fr1Bp: basisPoints(BP_INTEIRO),
        fr2Bp: basisPoints(BP_INTEIRO),
        ganhoReduzido: ganhoBruto,
        isentoPorImovelUnico: true,
        parcelaIsentaPorReinvestimento: ZERO,
        baseTributavel: ZERO,
        imposto: ZERO,
        aliquotaEfetivaBp: basisPoints(0),
        liquidoDaVenda: entrada.valorDeVenda,
        temReducaoNaoAplicada: aquisicao.ano < PRIMEIRO_ANO_SEM_REDUCAO_ADICIONAL,
      },
      traco: traco.construir(),
    }
  }

  // --- Os fatores de redução do art. 40 -----------------------------------
  const inicioDoFr1 = compararDatas(aquisicao, INICIO_DO_FR1) < 0 ? INICIO_DO_FR1 : aquisicao
  const meses1 =
    compararDatas(aquisicao, MES_DA_PUBLICACAO) >= 0 ? 0 : mesesEntre(inicioDoFr1, MES_DA_PUBLICACAO)

  const inicioDoFr2 =
    compararDatas(aquisicao, PRIMEIRO_MES_DO_FR2) > 0 ? aquisicao : PRIMEIRO_MES_DO_FR2
  const meses2 = mesesEntre(inicioDoFr2, venda)

  const divisor1 = divisorDoFator(fr1.resolvida.vigencia.valor.aliquotaBp, meses1)
  const divisor2 = divisorDoFator(fr2.resolvida.vigencia.valor.aliquotaBp, meses2)
  const fr1Bp = fatorEmBp(divisor1)
  const fr2Bp = fatorEmBp(divisor2)

  const aposFr1 = aplicarFatores(ganhoBruto, divisor1, ESCALA)
  const ganhoReduzido = aplicarFatores(ganhoBruto, divisor1, divisor2)

  if (meses1 > 0) {
    traco.passoComParametro(
      `FR1 — ${meses1} meses até a publicação da lei`,
      `${reais(ganhoBruto)} ÷ ${baseComposta(fr1.resolvida.vigencia.valor.aliquotaBp)}^${meses1}`,
      aposFr1,
      fr1.resolvida,
      `O fator é 1 dividido por ${baseComposta(fr1.resolvida.vigencia.valor.aliquotaBp)} elevado ao ` +
        `número de meses, e aqui dá ${percentual(fr1Bp)}. A conta é feita pela divisão, sem ` +
        'arredondar o fator. Quanto mais antigo o imóvel, menor a base — e é a parte que quase ' +
        'nenhuma calculadora do mercado aplica.',
    )
  }

  if (meses2 > 0) {
    traco.passoComParametro(
      `FR2 — ${meses2} meses de dezembro de 2005 até a venda`,
      `${reais(aposFr1)} ÷ ${baseComposta(fr2.resolvida.vigencia.valor.aliquotaBp)}^${meses2}`,
      ganhoReduzido,
      fr2.resolvida,
      `O fator aqui dá ${percentual(fr2Bp)}, e vale a mesma observação: a divisão é feita com o ` +
        'valor exato.',
    )
  }

  // --- A isenção por reinvestimento, proporcional --------------------------
  const reinvestido = entrada.reinvestido > entrada.valorDeVenda
    ? entrada.valorDeVenda
    : entrada.reinvestido

  const parcelaIsenta =
    reinvestido > 0
      ? proporcao(ganhoReduzido, reinvestido, entrada.valorDeVenda, POLITICA)
      : ZERO

  const baseTributavel = naoNegativo(subtrair(ganhoReduzido, parcelaIsenta))

  if (reinvestido > 0) {
    traco.passoComFundamento(
      'Parcela isenta pelo reinvestimento',
      `${reais(ganhoReduzido)} × ${reais(reinvestido)} ÷ ${reais(entrada.valorDeVenda)}`,
      parcelaIsenta,
      LEI_11196_ART_39,
      'A isenção é PROPORCIONAL: aplicar parte do produto da venda isenta a mesma fração do ' +
        'ganho. O prazo é de 180 dias contados do contrato, e o benefício vale uma vez a cada ' +
        'cinco anos.',
    )
  }

  // --- A tabela progressiva ------------------------------------------------
  const faixas = tabela.resolvida.vigencia.valor.faixas
  const parcelas = faixas
    .map((faixa) => {
      const piso = faixa.limiteInferiorCentavos
      const teto = faixa.limiteSuperiorCentavos ?? baseTributavel
      const naFaixa = Math.min(baseTributavel, teto) - piso + (piso === 0 ? 0 : 1)
      return {
        base: centavos(Math.max(0, Math.min(naFaixa, baseTributavel))),
        aliquota: basisPoints(faixa.aliquotaBp),
      }
    })
    .filter((p) => p.base > 0)

  const imposto = somarAliquotasPorFaixa(parcelas, POLITICA)

  traco.passoComParametro(
    'Imposto sobre o ganho',
    `${reais(baseTributavel)} pelas faixas de 15% a 22,5%`,
    imposto,
    tabela.resolvida,
    'Cada alíquota incide só sobre a parcela do ganho contida na sua faixa — a lei diz "sobre a ' +
      'parcela dos ganhos que…". Aplicar a alíquota da faixa alcançada ao ganho inteiro cobraria ' +
      'muito a mais.',
  )

  const aliquotaEfetivaBp =
    ganhoBruto > 0
      ? aliquotaEfetiva(imposto, ganhoBruto, POLITICA)
      : basisPoints(0)

  return {
    ok: true,
    valores: {
      ganhoBruto,
      meses1,
      meses2,
      fr1Bp,
      fr2Bp,
      ganhoReduzido,
      isentoPorImovelUnico: false,
      parcelaIsentaPorReinvestimento: parcelaIsenta,
      baseTributavel,
      imposto,
      aliquotaEfetivaBp,
      liquidoDaVenda: subtrair(entrada.valorDeVenda, imposto),
      temReducaoNaoAplicada: aquisicao.ano < PRIMEIRO_ANO_SEM_REDUCAO_ADICIONAL,
    },
    traco: traco.construir(),
  }
}

export { LEI_11196_ART_40 }
