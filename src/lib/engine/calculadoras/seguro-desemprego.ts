/**
 * CALC-009 — Seguro-desemprego: parcelas e valor.
 *
 * **A calculadora que fecha a pergunta que CALC-008 deixa aberta.** A rescisão
 * por acordo avisa que o trabalhador perde o seguro-desemprego (CLT, art. 484-A,
 * § 2º) e não diz quanto isso vale. Aqui vale.
 *
 * DUAS CONTAS COM NATUREZAS DIFERENTES
 *
 * O **número de parcelas** sai do art. 4º, § 2º, da Lei nº 7.998/1990: é uma
 * tabela de degraus sobre o tempo de vínculo nos 36 meses anteriores, e o piso de
 * acesso muda conforme seja a primeira, a segunda ou a terceira solicitação.
 *
 * O **valor da parcela** sai do art. 5º: três faixas sobre a média dos três
 * últimos salários, com fatores de 0,8 e 0,5 e um teto — e um piso que é o
 * salário mínimo, pelo § 2º. Os limites das faixas são reajustados anualmente
 * pelo INPC; os fatores, não.
 *
 * O QUE ESTA CALCULADORA NÃO FAZ
 *
 * Não decide se a pessoa tem direito. Os requisitos do art. 3º incluem não
 * possuir renda própria suficiente à manutenção, não estar em gozo de benefício
 * previdenciário continuado e a dispensa ter sido sem justa causa — condições
 * que não se apuram a partir de números. O que ela responde é: **cumprido o
 * tempo de vínculo, quantas parcelas e de quanto.**
 */

import {
  aplicarAliquota,
  dividirPorInteiro,
  maximo,
  minimo,
  multiplicarPorInteiro,
  somar,
  subtrair,
} from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_7998_ART_4, LEI_7998_ART_5 } from '../../params/data/fontes'

/** `RN-007`: empate para cima, como no restante do motor. */
const POLITICA = 'meio_para_cima' as const

/** Quantidade de salários que compõem a média — art. 5º, § 1º. */
const MESES_DA_MEDIA = 3

/**
 * Escala das etapas em unidade `'numero'` — ver `Unidade` em `traco.ts`.
 * Definição de unidade, não constante legal.
 */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

export type Solicitacao = 'primeira' | 'segunda' | 'terceira-ou-mais'

export interface EntradaSeguroDesemprego {
  /** Os três últimos salários. Art. 5º, § 1º. */
  readonly salarios: readonly Centavos[]
  /** Meses de vínculo nos 36 anteriores à dispensa. */
  readonly mesesTrabalhados: number
  readonly solicitacao: Solicitacao
}

export interface SaidaSeguroDesemprego {
  readonly media: Centavos
  readonly parcela: Centavos
  readonly numeroDeParcelas: number
  readonly total: Centavos
  /** 1, 2 ou 3 — qual faixa do art. 5º decidiu o valor. */
  readonly faixaAplicada: number
  /** Verdadeiro quando o piso do salário mínimo elevou o valor apurado. */
  readonly aplicouPiso: boolean
  readonly aplicouTeto: boolean
  readonly mesesMinimos: number
}

function inteiroDe(registro: Registro, id: string, data: DataISO): number | null {
  const r = registro.resolver(id, data)
  if (!r.ok) return null
  return r.resolvida.vigencia.valor.tipo === 'inteiro' ? r.resolvida.vigencia.valor.valor : null
}

function dinheiroDe(registro: Registro, id: string, data: DataISO): Centavos | null {
  const r = registro.resolver(id, data)
  if (!r.ok) return null
  return r.resolvida.vigencia.valor.tipo === 'valor_monetario'
    ? centavos(r.resolvida.vigencia.valor.centavos)
    : null
}

function taxaDe(registro: Registro, id: string, data: DataISO): BasisPoints | null {
  const r = registro.resolver(id, data)
  if (!r.ok) return null
  return r.resolvida.vigencia.valor.tipo === 'percentual'
    ? basisPoints(r.resolvida.vigencia.valor.aliquotaBp)
    : null
}

export function calcularSeguroDesemprego(
  entrada: EntradaSeguroDesemprego,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaSeguroDesemprego> {
  const informados = entrada.salarios.filter((s) => s > 0)
  if (informados.length === 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe ao menos o último salário para ver o resultado.' }
  }
  if (entrada.mesesTrabalhados <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe quantos meses você trabalhou para ver o resultado.' }
  }

  const idDoPiso =
    entrada.solicitacao === 'primeira'
      ? 'seguro-desemprego-meses-minimos-1a'
      : entrada.solicitacao === 'segunda'
        ? 'seguro-desemprego-meses-minimos-2a'
        : 'seguro-desemprego-meses-minimos-3a'

  const mesesMinimos = inteiroDe(registro, idDoPiso, dataReferencia)
  const mesesPara4 = inteiroDe(registro, 'seguro-desemprego-meses-para-4-parcelas', dataReferencia)
  const mesesPara5 = inteiroDe(registro, 'seguro-desemprego-meses-para-5-parcelas', dataReferencia)
  const limite1 = dinheiroDe(registro, 'seguro-desemprego-faixa-1-limite', dataReferencia)
  const limite2 = dinheiroDe(registro, 'seguro-desemprego-faixa-2-limite', dataReferencia)
  const fator1 = taxaDe(registro, 'seguro-desemprego-faixa-1-fator', dataReferencia)
  const fator2 = taxaDe(registro, 'seguro-desemprego-faixa-2-fator', dataReferencia)
  const aSomar = dinheiroDe(registro, 'seguro-desemprego-parcela-somar', dataReferencia)
  const teto = dinheiroDe(registro, 'seguro-desemprego-teto', dataReferencia)
  const piso = dinheiroDe(registro, 'salario-minimo', dataReferencia)

  if (
    mesesMinimos === null || mesesPara4 === null || mesesPara5 === null ||
    limite1 === null || limite2 === null || fator1 === null || fator2 === null ||
    aSomar === null || teto === null || piso === null
  ) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'Não há parâmetros de seguro-desemprego para a data informada.',
    }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>()
  const registrarVigencia = (id: string) => {
    const r = registro.resolver(id, dataReferencia)
    if (r.ok) vigencias.add(r.resolvida.vigencia.id)
    return r
  }

  // -------------------------------------------------------------------------
  // 1. Número de parcelas — art. 4º, § 2º
  // -------------------------------------------------------------------------
  const rPiso = registrarVigencia(idDoPiso)
  registrarVigencia('seguro-desemprego-meses-para-4-parcelas')
  registrarVigencia('seguro-desemprego-meses-para-5-parcelas')

  if (entrada.mesesTrabalhados < mesesMinimos) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        `Com ${entrada.mesesTrabalhados} mês(es) de vínculo não há direito ao benefício nesta ` +
        `solicitação: a lei exige no mínimo ${mesesMinimos} meses nos 36 anteriores à dispensa.`,
    }
  }

  const numeroDeParcelas =
    entrada.mesesTrabalhados >= mesesPara5 ? 5 : entrada.mesesTrabalhados >= mesesPara4 ? 4 : 3

  etapas.push({
    rotulo: 'Número de parcelas',
    formula:
      `${entrada.mesesTrabalhados} meses de vínculo nos últimos 36 → ${numeroDeParcelas} parcelas ` +
      `(mínimo de ${mesesMinimos} meses nesta solicitação)`,
    resultado: centavos(numeroDeParcelas * CENTESIMOS_POR_UNIDADE),
    unidade: 'numero',
    ...(rPiso.ok ? { parametro: citar(rPiso.resolvida) } : {}),
    justificativa:
      'A tabela do art. 4º, § 2º tem os mesmos degraus nas três solicitações — 4 parcelas a ' +
      'partir de 12 meses e 5 a partir de 24. O que muda é o piso de acesso: 12 meses na ' +
      'primeira, 9 na segunda, 6 da terceira em diante.',
  })

  // -------------------------------------------------------------------------
  // 2. Média dos últimos salários — art. 5º, § 1º
  // -------------------------------------------------------------------------
  const soma = somar(...informados)
  const media = dividirPorInteiro(soma, informados.length, POLITICA)

  etapas.push({
    rotulo: 'Média dos últimos salários',
    formula:
      informados.length === MESES_DA_MEDIA
        ? `(${informados.map(reais).join(' + ')}) ÷ ${MESES_DA_MEDIA}`
        : `${informados.map(reais).join(' + ')} ÷ ${informados.length} — meses informados`,
    resultado: media,
    fundamento: fundamentar(LEI_7998_ART_5),
    justificativa:
      informados.length === MESES_DA_MEDIA
        ? 'A lei manda considerar a média dos salários dos três meses anteriores à dispensa.'
        : 'A lei manda considerar os três últimos meses. Com menos valores informados, a média ' +
          'é feita sobre o que foi informado — informe os três para o resultado exato.',
  })

  // -------------------------------------------------------------------------
  // 3. Valor da parcela — art. 5º, I a III
  // -------------------------------------------------------------------------
  let apurado: Centavos
  let faixaAplicada: number

  if (media <= limite1) {
    faixaAplicada = 1
    apurado = aplicarAliquota(media, fator1, POLITICA)
    const r = registrarVigencia('seguro-desemprego-faixa-1-fator')
    etapas.push({
      rotulo: '1ª faixa — média até o primeiro limite',
      formula: `${reais(media)} × ${percentual(fator1)}`,
      resultado: apurado,
      ...(r.ok ? { parametro: citar(r.resolvida) } : {}),
    })
  } else if (media <= limite2) {
    faixaAplicada = 2
    const excedente = subtrair(media, limite1)
    const sobreExcedente = aplicarAliquota(excedente, fator2, POLITICA)
    apurado = somar(aSomar, sobreExcedente)
    const r = registrarVigencia('seguro-desemprego-parcela-somar')
    registrarVigencia('seguro-desemprego-faixa-2-fator')
    etapas.push({
      rotulo: '2ª faixa — o que excede o primeiro limite',
      formula:
        `(${reais(media)} − ${reais(limite1)}) × ${percentual(fator2)} + ${reais(aSomar)}`,
      resultado: apurado,
      ...(r.ok ? { parametro: citar(r.resolvida) } : {}),
      justificativa:
        'A parcela somada é o benefício apurado sobre o limite da primeira faixa. A conta não ' +
        'aplica o fator maior sobre o salário inteiro — só sobre a parte que cabe na 1ª faixa.',
    })
  } else {
    faixaAplicada = 3
    apurado = teto
    const r = registrarVigencia('seguro-desemprego-teto')
    etapas.push({
      rotulo: '3ª faixa — acima do segundo limite, valor invariável',
      formula: `Média de ${reais(media)} acima de ${reais(limite2)} → teto`,
      resultado: apurado,
      ...(r.ok ? { parametro: citar(r.resolvida) } : {}),
      justificativa:
        'Acima deste limite o benefício não acompanha mais o salário: é o mesmo valor para ' +
        'todo mundo, por maior que tenha sido a remuneração.',
    })
  }

  const aplicouTeto = faixaAplicada === 3 || apurado > teto
  const comTeto = minimo(apurado, teto)

  const rPisoSalario = registrarVigencia('salario-minimo')
  const parcela = maximo(comTeto, piso)
  const aplicouPiso = comTeto < piso

  if (aplicouPiso) {
    etapas.push({
      rotulo: 'Piso do salário mínimo',
      formula: `${reais(comTeto)} é menor que ${reais(piso)}`,
      resultado: parcela,
      ...(rPisoSalario.ok ? { parametro: citar(rPisoSalario.resolvida) } : {}),
      justificativa:
        'O art. 5º, § 2º, determina que o benefício não pode ser inferior ao salário mínimo. ' +
        'É o piso que faz quem ganhava pouco receber, proporcionalmente, mais do que a fórmula daria.',
    })
  }

  const total = multiplicarPorInteiro(parcela, numeroDeParcelas)
  etapas.push({
    rotulo: 'Total do benefício',
    formula: `${reais(parcela)} × ${numeroDeParcelas} parcelas`,
    resultado: total,
    fundamento: fundamentar(LEI_7998_ART_4),
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }

  return {
    ok: true,
    valores: {
      media,
      parcela,
      numeroDeParcelas,
      total,
      faixaAplicada,
      aplicouPiso,
      aplicouTeto,
      mesesMinimos,
    },
    traco,
  }
}

export { ZERO }
