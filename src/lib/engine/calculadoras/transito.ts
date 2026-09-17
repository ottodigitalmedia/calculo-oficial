/**
 * CALC-097 — Multa de trânsito: valor, desconto e pontos.
 *
 * **Duas perguntas numa tela só**, porque quem recebe a notificação faz as duas:
 * quanto vou pagar, e quanto isso me aproxima de perder a carteira.
 *
 * O que a conta precisa respeitar:
 *
 * - o valor da multa depende da NATUREZA da infração, e muitas infrações têm
 *   fator multiplicador próprio (CTB, art. 258, § 2º) — ele entra como campo,
 *   porque está no artigo de cada infração, e não numa tabela geral;
 * - o desconto é do PRAZO e da forma: 80% do valor até o vencimento, 60% com
 *   adesão à notificação eletrônica e renúncia a defesa e recurso (art. 284);
 * - o limite de pontos para suspender a habilitação mudou em 2021 e passou a
 *   depender de quantas gravíssimas há no período (art. 261, I) — e o condutor
 *   que exerce atividade remunerada tem sempre o limite mais alto.
 */

import { aplicarAliquota, multiplicarPorInteiro } from '../money'
import { citar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

export type NaturezaDaInfracao = 'gravissima' | 'grave' | 'media' | 'leve'
export type FormaDePagamento = 'integral' | 'ate-vencimento' | 'notificacao-eletronica'

const VALOR_POR_NATUREZA: Readonly<Record<NaturezaDaInfracao, string>> = {
  gravissima: 'multa-gravissima-valor',
  grave: 'multa-grave-valor',
  media: 'multa-media-valor',
  leve: 'multa-leve-valor',
}

const PONTOS_POR_NATUREZA: Readonly<Record<NaturezaDaInfracao, string>> = {
  gravissima: 'multa-gravissima-pontos',
  grave: 'multa-grave-pontos',
  media: 'multa-media-pontos',
  leve: 'multa-leve-pontos',
}

const NOME_DA_NATUREZA: Readonly<Record<NaturezaDaInfracao, string>> = {
  gravissima: 'gravíssima',
  grave: 'grave',
  media: 'média',
  leve: 'leve',
}

type Resolvido<T> = { readonly valor: T; readonly resolvida: VigenciaResolvida } | null

function monetarioDe(registro: Registro, id: string, data: DataISO): Resolvido<Centavos> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'valor_monetario') return null
  return { valor: centavos(r.resolvida.vigencia.valor.centavos), resolvida: r.resolvida }
}

function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido<number> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

function percentualDe(registro: Registro, id: string, data: DataISO): Resolvido<BasisPoints> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: basisPoints(r.resolvida.vigencia.valor.aliquotaBp), resolvida: r.resolvida }
}

export interface EntradaMultaTransito {
  readonly natureza: NaturezaDaInfracao
  /** Fator multiplicador da infração, quando houver. Um significa multa simples. */
  readonly fatorMultiplicador: number
  readonly formaDePagamento: FormaDePagamento
  /** Pontos já acumulados nos últimos doze meses, antes desta infração. */
  readonly pontosAcumulados: number
  /** Infrações gravíssimas já constantes desses doze meses. */
  readonly gravissimasAcumuladas: number
  /** Condutor que exerce atividade remunerada ao veículo. */
  readonly atividadeRemunerada: boolean
}

export interface SaidaMultaTransito {
  readonly valorAPagar: Centavos
  readonly valorCheio: Centavos
  readonly desconto: Centavos
  readonly pontosDaInfracao: number
  readonly pontosTotais: number
  readonly limiteDePontos: number
  readonly atingiuOLimite: boolean
  /** Quantos pontos ainda cabem antes do limite. Zero quando já foi atingido. */
  readonly pontosAteOLimite: number
}

/** Teto de sanidade do fator multiplicador. Não é regra legal: é limite de entrada. */
// eslint-disable-next-line no-restricted-syntax -- limite de entrada, não parâmetro legal
const FATOR_MAXIMO = 100

export function calcularMultaTransito(
  entrada: EntradaMultaTransito,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaMultaTransito> {
  if (
    !Number.isInteger(entrada.fatorMultiplicador) ||
    entrada.fatorMultiplicador < 1 ||
    entrada.fatorMultiplicador > FATOR_MAXIMO
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O fator multiplicador precisa ser um inteiro de 1 em diante.' }
  }
  if (!Number.isInteger(entrada.pontosAcumulados) || entrada.pontosAcumulados < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os pontos acumulados precisam ser um inteiro sem sinal.' }
  }
  if (!Number.isInteger(entrada.gravissimasAcumuladas) || entrada.gravissimasAcumuladas < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O número de infrações gravíssimas precisa ser um inteiro sem sinal.' }
  }

  const valorBase = monetarioDe(registro, VALOR_POR_NATUREZA[entrada.natureza], dataReferencia)
  const pontos = inteiroDe(registro, PONTOS_POR_NATUREZA[entrada.natureza], dataReferencia)
  const limiteComDuas = inteiroDe(registro, 'suspensao-limite-com-duas-gravissimas', dataReferencia)
  const limiteComUma = inteiroDe(registro, 'suspensao-limite-com-uma-gravissima', dataReferencia)
  const limiteSem = inteiroDe(registro, 'suspensao-limite-sem-gravissima', dataReferencia)
  if (valorBase === null || pontos === null || limiteComDuas === null || limiteComUma === null || limiteSem === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há valores de multa cadastrados para a data informada.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([valorBase.resolvida.vigencia.id, pontos.resolvida.vigencia.id])

  // --- Valor ----------------------------------------------------------------
  const valorCheio =
    entrada.fatorMultiplicador === 1
      ? valorBase.valor
      : multiplicarPorInteiro(valorBase.valor, entrada.fatorMultiplicador)

  etapas.push({
    rotulo: `Multa de natureza ${NOME_DA_NATUREZA[entrada.natureza]}`,
    formula:
      entrada.fatorMultiplicador === 1
        ? reais(valorBase.valor)
        : `${reais(valorBase.valor)} × ${entrada.fatorMultiplicador} (fator multiplicador da infração)`,
    resultado: valorCheio,
    parametro: citar(valorBase.resolvida),
    ...(entrada.fatorMultiplicador > 1
      ? {
          justificativa:
            'O fator está no artigo que descreve a infração, e não numa tabela geral: por isso ele é informado, e não adivinhado.',
        }
      : {}),
  })

  // --- Desconto -------------------------------------------------------------
  let valorAPagar = valorCheio
  if (entrada.formaDePagamento !== 'integral') {
    const id =
      entrada.formaDePagamento === 'notificacao-eletronica'
        ? 'multa-desconto-notificacao-eletronica'
        : 'multa-desconto-vencimento'
    const fracao = percentualDe(registro, id, dataReferencia)
    if (fracao === null) {
      return { ok: false, motivo: 'vigencia_ausente', detalhe: 'O desconto escolhido não está cadastrado para a data informada.' }
    }
    vigencias.add(fracao.resolvida.vigencia.id)
    valorAPagar = aplicarAliquota(valorCheio, fracao.valor, POLITICA)
    etapas.push({
      rotulo:
        entrada.formaDePagamento === 'notificacao-eletronica'
          ? `Pagamento com adesão à notificação eletrônica — ${percentual(fracao.valor)} do valor`
          : `Pagamento até o vencimento — ${percentual(fracao.valor)} do valor`,
      formula: `${reais(valorCheio)} × ${percentual(fracao.valor)}`,
      resultado: valorAPagar,
      parametro: citar(fracao.resolvida),
      justificativa:
        entrada.formaDePagamento === 'notificacao-eletronica'
          ? 'Exige adesão ao sistema eletrônico antes do envio da notificação da autuação e renúncia a defesa prévia e recurso — reconhecer a infração é a condição do desconto maior.'
          : 'Basta pagar até a data de vencimento impressa na notificação. Pagar não impede questionar depois.',
    })
  }

  const desconto = centavos(valorCheio - valorAPagar)

  // --- Pontos ---------------------------------------------------------------
  const gravissimasTotais =
    entrada.gravissimasAcumuladas + (entrada.natureza === 'gravissima' ? 1 : 0)
  const pontosTotais = entrada.pontosAcumulados + pontos.valor

  const limiteEscolhido = entrada.atividadeRemunerada
    ? limiteSem
    : gravissimasTotais >= 2
      ? limiteComDuas
      : gravissimasTotais === 1
        ? limiteComUma
        : limiteSem
  vigencias.add(limiteEscolhido.resolvida.vigencia.id)

  etapas.push({
    rotulo: `Pontos da infração ${NOME_DA_NATUREZA[entrada.natureza]}`,
    formula: `${entrada.pontosAcumulados} já acumulados + ${pontos.valor}`,
    resultado: centavos(pontosTotais * CENTESIMOS_POR_UNIDADE),
    unidade: 'numero',
    parametro: citar(pontos.resolvida),
  })

  const atingiuOLimite = pontosTotais >= limiteEscolhido.valor
  etapas.push({
    rotulo: atingiuOLimite ? 'Limite de pontos atingido' : 'Limite de pontos para a suspensão',
    formula: `${pontosTotais} ${atingiuOLimite ? '≥' : '<'} ${limiteEscolhido.valor} pontos em doze meses`,
    resultado: centavos(limiteEscolhido.valor * CENTESIMOS_POR_UNIDADE),
    unidade: 'numero',
    parametro: citar(limiteEscolhido.resolvida),
    justificativa: entrada.atividadeRemunerada
      ? 'Para quem exerce atividade remunerada ao veículo, o limite é o mais alto, qualquer que seja a natureza das infrações.'
      : `O limite depende de quantas infrações gravíssimas constam do período: aqui, ${gravissimasTotais}.`,
  })

  const pontosAteOLimite = Math.max(0, limiteEscolhido.valor - pontosTotais)

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: {
      valorAPagar,
      valorCheio,
      desconto,
      pontosDaInfracao: pontos.valor,
      pontosTotais,
      limiteDePontos: limiteEscolhido.valor,
      atingiuOLimite,
      pontosAteOLimite,
    },
    traco,
  }
}
