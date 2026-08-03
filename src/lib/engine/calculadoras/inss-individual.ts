/**
 * CALC-050 — INSS do contribuinte individual e do facultativo.
 *
 * **Não é a mesma conta de CALC-016, e confundir as duas é o erro que esta
 * página existe para desfazer.** A do empregado é progressiva por faixa, de
 * 7,5% a 14%. A do contribuinte individual é **alíquota única**, e o que muda
 * entre os planos é a alíquota E a base:
 *
 *   Completo      20% sobre o salário-de-contribuição declarado (art. 21, caput)
 *   Simplificado  11% sobre o LIMITE MÍNIMO                     (art. 21, § 2º, I)
 *   Baixa renda    5% sobre o LIMITE MÍNIMO                     (art. 21, § 2º, II, "b")
 *
 * **A base dos dois planos reduzidos é fixa por lei, não por escolha.** Quem
 * opta por eles paga sobre o salário mínimo, ganhe o que ganhar — o § 2º diz
 * "incidente sobre o limite mínimo mensal do salário de contribuição". É por
 * isso que informar a renda não muda o valor nesses dois planos, e é a dúvida
 * mais frequente de quem chega aqui.
 *
 * O QUE ESTA CALCULADORA NÃO FAZ, DECLARADO
 *
 * **Quem presta serviço a empresa não recolhe por conta própria**: a empresa
 * retém e recolhe (Lei nº 10.666/2003), com regra própria de dedução. Esta
 * página trata de quem emite a própria guia, e diz isso na tela.
 *
 * **A complementação do § 3º sai sem os juros.** A norma manda acrescer juros
 * moratórios do art. 5º, § 3º, da Lei nº 9.430/1996 — que dependem da Selic
 * acumulada da competência a ser complementada até o recolhimento. Publicar o
 * valor sem os juros e chamá-lo de total seria errar para menos; o que a tela
 * mostra é a diferença de alíquota, nomeada como tal.
 */

import { aplicarAliquota, limitarAoTeto, maximo, multiplicarPorInteiro, subtrair } from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const MESES_NO_ANO = 12
const POLITICA = 'meio_para_cima' as const

export type PlanoDeContribuicao = 'completo' | 'simplificado' | 'baixa-renda'

/** O parâmetro de alíquota de cada plano, e o rótulo que a tela usa. */
const PLANOS: Readonly<
  Record<PlanoDeContribuicao, { readonly parametroId: string; readonly nome: string }>
> = {
  completo: {
    parametroId: 'inss-individual-aliquota-completa',
    nome: 'Plano completo',
  },
  simplificado: {
    parametroId: 'inss-individual-aliquota-simplificada',
    nome: 'Plano simplificado',
  },
  'baixa-renda': {
    parametroId: 'inss-individual-aliquota-baixa-renda',
    nome: 'Facultativo de baixa renda',
  },
}

export const PARAMETROS_INSS_INDIVIDUAL = [
  'inss-individual-aliquota-completa',
  'inss-individual-aliquota-simplificada',
  'inss-individual-aliquota-baixa-renda',
  'inss-individual-complementacao',
  'salario-minimo',
  'inss-tabela-progressiva',
] as const

export interface EntradaInssIndividual {
  readonly plano: PlanoDeContribuicao
  /** Só entra na conta no plano completo — nos outros a base é o limite mínimo. */
  readonly salarioDeContribuicao: Centavos
}

export interface SaidaInssIndividual {
  readonly plano: PlanoDeContribuicao
  readonly baseDeCalculo: Centavos
  readonly aliquotaBp: BasisPoints
  readonly contribuicao: Centavos
  readonly contribuicaoAnual: Centavos
  readonly limiteMinimo: Centavos
  readonly limiteMaximo: Centavos
  /** Como a base foi ajustada, quando foi. */
  readonly ajuste: 'minimo' | 'teto' | null
  /** Quanto custaria o plano completo sobre a mesma renda — para comparar. */
  readonly contribuicaoNoCompleto: Centavos
  /** Diferença de alíquota até os 20%, sobre o limite mínimo. SEM os juros. */
  readonly complementacaoMensal: Centavos
  readonly ehPlanoReduzido: boolean
}

export function calcularInssIndividual(
  entrada: EntradaInssIndividual,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaInssIndividual> {
  if (entrada.salarioDeContribuicao < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O salário de contribuição não pode ser negativo.',
    }
  }

  const plano = PLANOS[entrada.plano]
  const aliquota = registro.resolver(plano.parametroId, dataReferencia)
  if (!aliquota.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: aliquota.detalhe }
  }
  if (aliquota.resolvida.vigencia.valor.tipo !== 'percentual') {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O parâmetro de alíquota não é um percentual.',
    }
  }

  const minimo = registro.resolver('salario-minimo', dataReferencia)
  if (!minimo.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: minimo.detalhe }
  }
  if (minimo.resolvida.vigencia.valor.tipo !== 'valor_monetario') {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O parâmetro de salário mínimo não é um valor monetário.',
    }
  }

  /**
   * O teto vem da última faixa da tabela do empregado, e não de um parâmetro
   * próprio: é o mesmo limite máximo do art. 28, § 5º, e duplicá-lo seria
   * convidar os dois a divergirem numa atualização — a nota está em `inss.ts`.
   */
  const tabela = registro.resolver('inss-tabela-progressiva', dataReferencia)
  if (!tabela.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: tabela.detalhe }
  }
  if (tabela.resolvida.vigencia.valor.tipo !== 'tabela_faixas') {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O parâmetro de INSS não é uma tabela de faixas.',
    }
  }

  const faixas = tabela.resolvida.vigencia.valor.faixas
  const ultima = faixas[faixas.length - 1]
  const limiteMaximo = centavos(ultima?.limiteSuperiorCentavos ?? 0)
  const limiteMinimo = centavos(minimo.resolvida.vigencia.valor.centavos)

  const aliquotaBp = aliquota.resolvida.vigencia.valor.aliquotaBp as BasisPoints
  const ehPlanoReduzido = entrada.plano !== 'completo'

  const traco = new ConstrutorDeTraco(dataReferencia)

  /**
   * A base: no plano completo é o declarado, preso entre o mínimo e o teto; nos
   * reduzidos é o limite mínimo, e a renda informada não participa.
   */
  let baseDeCalculo: Centavos
  let ajuste: 'minimo' | 'teto' | null = null

  if (ehPlanoReduzido) {
    baseDeCalculo = limiteMinimo
    traco.passoComParametro(
      'Base de cálculo — o limite mínimo',
      `Salário mínimo de ${reais(limiteMinimo)}`,
      baseDeCalculo,
      minimo.resolvida,
      'Nos planos reduzidos a base é FIXA no limite mínimo, por determinação do § 2º do art. 21 ' +
        '— não acompanha o quanto se ganha. É por isso que informar a renda não muda este valor.',
    )
  } else {
    const comMinimo = maximo(entrada.salarioDeContribuicao, limiteMinimo)
    baseDeCalculo = limitarAoTeto(comMinimo, limiteMaximo)

    if (baseDeCalculo > entrada.salarioDeContribuicao) {
      ajuste = 'minimo'
      traco.passoComParametro(
        'Base elevada ao limite mínimo',
        `${reais(entrada.salarioDeContribuicao)} está abaixo do mínimo de ${reais(limiteMinimo)}`,
        baseDeCalculo,
        minimo.resolvida,
        'A contribuição não incide sobre base menor que o limite mínimo do salário-de-contribuição.',
      )
    } else if (baseDeCalculo < entrada.salarioDeContribuicao) {
      ajuste = 'teto'
      traco.passoComParametro(
        'Base limitada ao teto previdenciário',
        `${reais(entrada.salarioDeContribuicao)} excede o teto de ${reais(limiteMaximo)}`,
        baseDeCalculo,
        tabela.resolvida,
        'A contribuição não incide sobre a parcela que excede o limite máximo do ' +
          'salário-de-contribuição. Contribuir acima do teto não é possível.',
      )
    } else {
      traco.passo(
        'Base de cálculo',
        `Salário-de-contribuição declarado de ${reais(baseDeCalculo)}`,
        baseDeCalculo,
      )
    }
  }

  const contribuicao = aplicarAliquota(baseDeCalculo, aliquotaBp, POLITICA)
  traco.passoComParametro(
    `${plano.nome} — contribuição do mês`,
    `${reais(baseDeCalculo)} × ${percentual(aliquotaBp)}`,
    contribuicao,
    aliquota.resolvida,
    'Alíquota ÚNICA, e não progressiva por faixa: a tabela de 7,5% a 14% é a do segurado ' +
      'empregado, e não se aplica a quem recolhe por conta própria.',
  )

  /**
   * Quanto custaria o plano completo sobre a MESMA renda. É a comparação que
   * dá sentido à escolha — sem ela, o plano reduzido parece só mais barato.
   */
  const completa = registro.resolver('inss-individual-aliquota-completa', dataReferencia)
  if (!completa.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: completa.detalhe }
  }
  if (completa.resolvida.vigencia.valor.tipo !== 'percentual') {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O parâmetro de alíquota do plano completo não é um percentual.',
    }
  }
  const aliquotaCompletaBp = completa.resolvida.vigencia.valor.aliquotaBp as BasisPoints

  const baseNoCompleto = limitarAoTeto(
    maximo(entrada.salarioDeContribuicao, limiteMinimo),
    limiteMaximo,
  )
  const contribuicaoNoCompleto = aplicarAliquota(baseNoCompleto, aliquotaCompletaBp, POLITICA)

  /**
   * A complementação do § 3º: a diferença entre o percentual pago e os 20%,
   * sobre o limite mínimo. **Sem os juros**, que dependem da Selic acumulada da
   * competência — ver a nota de topo. O nome na tela diz o que ela é.
   */
  const complementacaoMensal = ehPlanoReduzido
    ? aplicarAliquota(limiteMinimo, (aliquotaCompletaBp - aliquotaBp) as BasisPoints, POLITICA)
    : centavos(0)

  if (ehPlanoReduzido) {
    const complementacao = registro.resolver('inss-individual-complementacao', dataReferencia)
    if (complementacao.ok) {
      traco.passoComParametro(
        'Diferença até os 20%, se quiser contar o tempo',
        `${reais(limiteMinimo)} × ${percentual((aliquotaCompletaBp - aliquotaBp) as BasisPoints)}`,
        complementacaoMensal,
        complementacao.resolvida,
        'É a diferença de alíquota do § 3º, SEM os juros moratórios que a norma manda acrescer — ' +
          'eles dependem da Selic acumulada da competência a ser complementada, e por isso o ' +
          'valor final do recolhimento é maior que este.',
      )
    }
  }

  const contribuicaoAnual = multiplicarPorInteiro(contribuicao, MESES_NO_ANO)

  return {
    ok: true,
    valores: {
      plano: entrada.plano,
      baseDeCalculo,
      aliquotaBp,
      contribuicao,
      contribuicaoAnual,
      limiteMinimo,
      limiteMaximo,
      ajuste,
      contribuicaoNoCompleto,
      complementacaoMensal,
      ehPlanoReduzido,
    },
    traco: traco.construir(),
  }
}

/** Quanto o plano completo custa a mais por mês que o escolhido. */
export function diferencaMensal(saida: SaidaInssIndividual): Centavos {
  return subtrair(saida.contribuicaoNoCompleto, saida.contribuicao)
}
