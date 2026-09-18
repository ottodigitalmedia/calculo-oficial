/**
 * CALC-118 — Abono salarial (PIS/Pasep).
 *
 * Duas perguntas, dois cálculos:
 *
 * 1. **a renda passa no critério?** A remuneração média mensal do ano-base
 *    precisa ficar até o limite do ano do pagamento — desde a EC nº 135/2024,
 *    dois salários mínimos de 2023 corrigidos pelo INPC (Constituição, art.
 *    239, § 3º). Para o pagamento de 2026 o limite é o publicado pelo
 *    Ministério do Trabalho;
 * 2. **quanto é?** Um doze avos do salário mínimo da DATA DO PAGAMENTO por mês
 *    trabalhado no ano-base (Lei nº 7.998/1990, art. 9º, § 2º), com a fração de
 *    15 dias contando como mês (§ 3º) e o total ARREDONDADO PARA CIMA até o
 *    real inteiro (§ 4º).
 *
 * **Uma divergência registrada:** a tabela publicada pelo Ministério para 2026
 * traz R$ 675,00 para cinco meses. Pela lei, R$ 1.621,00 × 5 ÷ 12 = R$ 675,42 e
 * o § 4º manda subir para R$ 676,00 — e é assim que os outros onze valores da
 * mesma tabela saem. Esta calculadora segue a lei (`ESTADO-DO-PROJETO` §7.91).
 *
 * **O que NÃO está aqui:** os requisitos que não são número — empregador
 * contribuinte do PIS/Pasep, dados informados no eSocial — e o piso do § 3º-A
 * (1,5 salário mínimo), que em 2026 fica abaixo do limite publicado.
 */

import { citar, fundamentar, reais, type Etapa, type Resultado } from '../traco'
import { centavos, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CF_ART_239_P3, LEI_7998_ART_9 } from '../../params/data/fontes'

/** Um real em centavos — o grão do arredondamento do § 4º. Unidade, não parâmetro. */
// eslint-disable-next-line no-restricted-syntax -- unidade monetária (ADR-004 A-1), não parâmetro legal
const CENTAVOS_POR_REAL = 100

const MESES_MAXIMO = 12

export const PARAMETROS_ABONO = ['abono-limite-remuneracao-media', 'abono-fracao-por-mes', 'salario-minimo'] as const

export interface EntradaAbono {
  /** Remuneração média mensal no ano-base, sem 13º e sem o terço de férias. */
  readonly remuneracaoMedia: Centavos
  /** Meses trabalhados no ano-base — a fração de 15 dias já contada como mês. */
  readonly meses: number
  /** Cadastrado no PIS/Pasep há pelo menos cinco anos. */
  readonly cadastroHaCincoAnos: boolean
}

export interface SaidaAbono {
  /** O valor pela conta da lei — mesmo quando algum critério não é atendido. */
  readonly valorPelaLei: Centavos
  readonly limiteDeRenda: Centavos
  readonly salarioMinimo: Centavos
  readonly atendeRenda: boolean
  readonly atendeCadastro: boolean
  readonly atendeTudo: boolean
}

export function calcularAbono(entrada: EntradaAbono, dataReferencia: DataISO, registro: Registro): Resultado<SaidaAbono> {
  if (!Number.isInteger(entrada.meses) || entrada.meses < 1 || entrada.meses > MESES_MAXIMO) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Os meses trabalhados no ano-base vão de 1 a 12 — a fração de 15 dias conta como mês.',
    }
  }
  if (entrada.remuneracaoMedia <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a remuneração média mensal do ano-base.' }
  }

  const limite = registro.resolver('abono-limite-remuneracao-media', dataReferencia)
  const fracao = registro.resolver('abono-fracao-por-mes', dataReferencia)
  const sm = registro.resolver('salario-minimo', dataReferencia)
  if (
    !limite.ok || limite.resolvida.vigencia.valor.tipo !== 'valor_monetario' ||
    !fracao.ok || fracao.resolvida.vigencia.valor.tipo !== 'fracao' ||
    !sm.ok || sm.resolvida.vigencia.valor.tipo !== 'valor_monetario'
  ) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe:
        'O limite de renda do abono é publicado pelo Ministério do Trabalho a cada ano de pagamento — não há limite cadastrado para o ano informado.',
    }
  }
  const limiteDeRenda = centavos(limite.resolvida.vigencia.valor.centavos)
  const salarioMinimo = centavos(sm.resolvida.vigencia.valor.centavos)
  const { numerador, denominador } = fracao.resolvida.vigencia.valor

  const atendeRenda = entrada.remuneracaoMedia <= limiteDeRenda
  const exato = salarioMinimo * entrada.meses * numerador // centavos × denominador
  const bruto = exato / denominador
  // § 4º: suplementa as partes decimais até o real inteiro imediatamente superior.
  const unidadesDeCentavo = CENTAVOS_POR_REAL * denominador
  const valorPelaLei = centavos(Math.ceil(exato / unidadesDeCentavo) * CENTAVOS_POR_REAL)

  const etapas: Etapa[] = [
    {
      rotulo: atendeRenda ? 'Renda dentro do limite' : 'Renda acima do limite',
      formula: `média de ${reais(entrada.remuneracaoMedia)} ${atendeRenda ? '≤' : '>'} ${reais(limiteDeRenda)}`,
      resultado: limiteDeRenda,
      parametro: citar(limite.resolvida),
      fundamento: fundamentar(CF_ART_239_P3),
      justificativa:
        'Desde a EC nº 135/2024 o limite é de dois salários mínimos de 2023 corrigidos pelo INPC, e não mais dois salários mínimos do próprio ano-base.',
    },
    {
      rotulo: `Valor — ${entrada.meses}/12 do salário mínimo do pagamento`,
      formula: `${reais(salarioMinimo)} × ${entrada.meses} ÷ ${denominador} = ${reais(centavos(Math.round(bruto)))}`,
      resultado: centavos(Math.round(bruto)),
      parametro: citar(fracao.resolvida),
    },
    {
      rotulo: 'Arredondado para o real inteiro de cima',
      formula: `${reais(centavos(Math.round(bruto)))} → ${reais(valorPelaLei)}`,
      resultado: valorPelaLei,
      fundamento: fundamentar(LEI_7998_ART_9),
      justificativa: 'O § 4º do art. 9º manda suplementar as partes decimais até a unidade inteira imediatamente superior.',
    },
  ]

  return {
    ok: true,
    valores: {
      valorPelaLei,
      limiteDeRenda,
      salarioMinimo,
      atendeRenda,
      atendeCadastro: entrada.cadastroHaCincoAnos,
      atendeTudo: atendeRenda && entrada.cadastroHaCincoAnos,
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [limite.resolvida.vigencia.id, fracao.resolvida.vigencia.id, sm.resolvida.vigencia.id],
    },
  }
}

