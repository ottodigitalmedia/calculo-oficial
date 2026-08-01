/**
 * CALC-018 — Imposto de renda sobre renda fixa, pela tabela regressiva.
 *
 * **Reaproveita o motor de CALC-022 inteiro.** A capitalização com conversão de
 * taxa anual em mensal equivalente já existe, já está documentada e já é testada
 * desde o lançamento. O que esta calculadora acrescenta é a mordida do imposto —
 * e é ela que responde a pergunta que o investidor de fato faz.
 *
 * A TABELA PREMIA O PRAZO, E É ISSO QUE A CALCULADORA MOSTRA
 *
 * De 22,5% a 15%, em quatro degraus. A diferença entre resgatar no dia 719 e no
 * dia 721 é de 2,5 pontos percentuais sobre **todo** o rendimento acumulado —
 * não sobre o rendimento do último dia. Em aplicações longas isso vale bem mais
 * que a diferença de taxa entre dois emissores.
 *
 * A CONVENÇÃO DE PRAZO, DECLARADA
 *
 * A lei conta o prazo em **dias**; a entrada aqui é em **meses**, porque é assim
 * que se contrata e se pensa. A conversão usa o mês comercial de trinta dias, e
 * ela é exata nas fronteiras que importam: 6, 12 e 24 meses caem precisamente
 * em 180, 360 e 720 dias.
 */

import { calcularJurosCompostos } from './juros-compostos'
import { aplicarAliquota, aliquotaEfetiva, subtrair } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_11033_ART_3 } from '../../params/data/fontes'

/** `RN-007`: empate para cima, como no restante do motor. */
const POLITICA = 'meio_para_cima' as const

/** Mês comercial. Unidade, não parâmetro legal — ver a nota em `rescisao.ts`. */
const DIAS_DO_MES = 30

export interface EntradaRendaFixa {
  readonly valorAplicado: Centavos
  /** Taxa contratada ao ano, em basis points. */
  readonly taxaAnual: BasisPoints
  readonly prazoMeses: number
  /** LCI, LCA, CRI, CRA e poupança são isentos — art. 3º, II. */
  readonly isenta: boolean
}

export interface SaidaRendaFixa {
  /**
   * Devolvido para que a tela não o reconstrua por subtração.
   *
   * É a segunda vez que a subtração `montante − rendimento` aparece numa
   * definição, e a segunda vez que o compilador a recusa: `Centavos` menos
   * `Centavos` é `number`, e a marca de `ADR-004` se perde. O motor devolver o
   * valor é mais barato que a tela remontá-lo.
   */
  readonly valorAplicado: Centavos
  readonly montanteBruto: Centavos
  readonly rendimentoBruto: Centavos
  readonly imposto: Centavos
  readonly montanteLiquido: Centavos
  readonly rendimentoLiquido: Centavos
  readonly aliquota: BasisPoints
  readonly prazoDias: number
  readonly faixa: number
  /** Rentabilidade líquida sobre o valor aplicado, no período. */
  readonly rentabilidadeLiquidaBp: BasisPoints
  /** Quanto o imposto custaria a menos na faixa seguinte, se houver. */
  readonly economiaNaProximaFaixa: Centavos
  readonly diasParaProximaFaixa: number
}

function inteiroDe(registro: Registro, id: string, data: DataISO): number | null {
  const r = registro.resolver(id, data)
  if (!r.ok) return null
  return r.resolvida.vigencia.valor.tipo === 'inteiro' ? r.resolvida.vigencia.valor.valor : null
}

export function calcularRendaFixa(
  entrada: EntradaRendaFixa,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaRendaFixa> {
  if (entrada.valorAplicado <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor aplicado para ver o resultado.' }
  }
  if (entrada.prazoMeses <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o prazo da aplicação para ver o resultado.' }
  }
  if (entrada.taxaAnual <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a taxa contratada para ver o resultado.' }
  }

  const limites = [
    inteiroDe(registro, 'ir-renda-fixa-limite-1', dataReferencia),
    inteiroDe(registro, 'ir-renda-fixa-limite-2', dataReferencia),
    inteiroDe(registro, 'ir-renda-fixa-limite-3', dataReferencia),
  ]
  if (limites.some((l) => l === null)) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'Não há tabela de imposto sobre renda fixa para a data informada.',
    }
  }
  const [limite1, limite2, limite3] = limites as [number, number, number]

  // -------------------------------------------------------------------------
  // 1. Rendimento bruto — o motor de CALC-022, sem aportes
  // -------------------------------------------------------------------------
  const bruto = calcularJurosCompostos(
    {
      valorInicial: entrada.valorAplicado,
      aporteMensal: centavos(0),
      taxa: entrada.taxaAnual,
      taxaAoAno: true,
      meses: entrada.prazoMeses,
    },
    dataReferencia,
  )
  if (!bruto.ok) return bruto

  const montanteBruto = bruto.valores.montante
  const rendimentoBruto = bruto.valores.totalJuros

  const etapas: Etapa[] = [
    {
      rotulo: 'Rendimento bruto no período',
      formula:
        `${reais(entrada.valorAplicado)} a ${percentual(entrada.taxaAnual)} ao ano ` +
        `(${percentual(bruto.valores.taxaMensalBp)} ao mês) por ${entrada.prazoMeses} meses`,
      resultado: rendimentoBruto,
      justificativa:
        'O saldo capitaliza mês a mês, e cada mês arredonda uma vez — que é como a aplicação ' +
        'real se comporta.',
    },
  ]

  const vigencias = new Set<string>()

  // -------------------------------------------------------------------------
  // 2. Isenção do art. 3º, II — o caminho curto
  // -------------------------------------------------------------------------
  if (entrada.isenta) {
    etapas.push({
      rotulo: 'Aplicação isenta de imposto de renda',
      formula: 'LCI, LCA, CRI, CRA e poupança — sem retenção na fonte',
      resultado: ZERO,
      fundamento: fundamentar(LEI_11033_ART_3),
      justificativa:
        'A remuneração produzida por letras hipotecárias, certificados de recebíveis ' +
        'imobiliários e letras de crédito imobiliário é isenta na fonte e na declaração de ' +
        'ajuste anual da pessoa física. Por isso o rendimento líquido é igual ao bruto.',
    })

    const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }
    return {
      ok: true,
      valores: {
        valorAplicado: entrada.valorAplicado,
        montanteBruto,
        rendimentoBruto,
        imposto: ZERO,
        montanteLiquido: montanteBruto,
        rendimentoLiquido: rendimentoBruto,
        aliquota: basisPoints(0),
        prazoDias: entrada.prazoMeses * DIAS_DO_MES,
        faixa: 0,
        rentabilidadeLiquidaBp: aliquotaEfetiva(rendimentoBruto, entrada.valorAplicado, POLITICA),
        economiaNaProximaFaixa: ZERO,
        diasParaProximaFaixa: 0,
      },
      traco,
    }
  }

  // -------------------------------------------------------------------------
  // 3. A faixa da tabela regressiva — art. 1º
  // -------------------------------------------------------------------------
  const prazoDias = entrada.prazoMeses * DIAS_DO_MES

  const faixa = prazoDias <= limite1 ? 1 : prazoDias <= limite2 ? 2 : prazoDias <= limite3 ? 3 : 4
  const rFaixa = registro.resolver(`ir-renda-fixa-faixa-${faixa}`, dataReferencia)
  if (!rFaixa.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: rFaixa.detalhe }
  if (rFaixa.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A alíquota da tabela não é percentual.' }
  }
  const aliquota = basisPoints(rFaixa.resolvida.vigencia.valor.aliquotaBp)
  vigencias.add(rFaixa.resolvida.vigencia.id)

  const imposto = aplicarAliquota(rendimentoBruto, aliquota, POLITICA)
  const rendimentoLiquido = subtrair(rendimentoBruto, imposto)
  const montanteLiquido = subtrair(montanteBruto, imposto)

  etapas.push({
    rotulo: `Alíquota da ${faixa}ª faixa`,
    formula: `Prazo de ${entrada.prazoMeses} meses = ${prazoDias} dias`,
    resultado: centavos(aliquota),
    unidade: 'percentual',
    parametro: citar(rFaixa.resolvida),
    justificativa:
      'A tabela é regressiva: quanto mais tempo a aplicação fica, menor a alíquota — e ela ' +
      'incide sobre TODO o rendimento acumulado, não só sobre o do último período.',
  })

  etapas.push({
    rotulo: 'Imposto retido na fonte',
    formula: `${reais(rendimentoBruto)} × ${percentual(aliquota)}`,
    resultado: imposto,
  })

  etapas.push({
    rotulo: 'Rendimento líquido',
    formula: `${reais(rendimentoBruto)} − ${reais(imposto)}`,
    resultado: rendimentoLiquido,
  })

  // -------------------------------------------------------------------------
  // 4. O degrau seguinte — a informação acionável
  // -------------------------------------------------------------------------
  let economiaNaProximaFaixa: Centavos = ZERO
  let diasParaProximaFaixa = 0

  if (faixa < 4) {
    const limiteAtual = faixa === 1 ? limite1 : faixa === 2 ? limite2 : limite3
    diasParaProximaFaixa = limiteAtual + 1 - prazoDias

    const rProxima = registro.resolver(`ir-renda-fixa-faixa-${faixa + 1}`, dataReferencia)
    if (rProxima.ok && rProxima.resolvida.vigencia.valor.tipo === 'percentual') {
      const proxima = basisPoints(rProxima.resolvida.vigencia.valor.aliquotaBp)
      // Comparação sobre o MESMO rendimento: o efeito isolado da alíquota, sem
      // o rendimento extra dos dias a mais, que confundiria as duas coisas.
      economiaNaProximaFaixa = subtrair(
        imposto,
        aplicarAliquota(rendimentoBruto, proxima, POLITICA),
      )

      etapas.push({
        rotulo: 'Se esperar até a faixa seguinte',
        formula:
          `Mais ${diasParaProximaFaixa} dia(s) levam a alíquota de ${percentual(aliquota)} ` +
          `para ${percentual(proxima)}`,
        resultado: economiaNaProximaFaixa,
        parametro: citar(rProxima.resolvida),
        justificativa:
          'A economia mostrada é só o efeito da troca de alíquota sobre o rendimento já ' +
          'acumulado. Os dias a mais também rendem, e isso entra por cima.',
      })
    }
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }

  return {
    ok: true,
    valores: {
      valorAplicado: entrada.valorAplicado,
      montanteBruto,
      rendimentoBruto,
      imposto,
      montanteLiquido,
      rendimentoLiquido,
      aliquota,
      prazoDias,
      faixa,
      rentabilidadeLiquidaBp: aliquotaEfetiva(rendimentoLiquido, entrada.valorAplicado, POLITICA),
      economiaNaProximaFaixa,
      diasParaProximaFaixa,
    },
    traco,
  }
}
