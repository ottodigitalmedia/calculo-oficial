/**
 * CALC-112 — Férias concedidas fora do prazo, pagas em dobro.
 *
 * A conta tem três datas e uma regra:
 *
 * 1. o período AQUISITIVO: doze meses de contrato (CLT, art. 130);
 * 2. o período CONCESSIVO: os doze meses seguintes, dentro dos quais o
 *    empregador precisa conceder as férias (art. 134);
 * 3. as férias gozadas: os dias que caírem DEPOIS do concessivo são pagos em
 *    dobro (art. 137), dia a dia (Súmula 81 do TST).
 *
 * Férias que começam dentro do prazo e terminam fora têm só os dias de fora em
 * dobro — é a Súmula 81 que impede tanto dobrar tudo quanto não dobrar nada.
 *
 * **A dobra incide sobre a remuneração de férias, que inclui o terço
 * constitucional** (CF, art. 7º, XVII): cada dia fora do prazo vale duas vezes
 * o dia de férias com o terço.
 *
 * **O que NÃO está aqui:** a dobra por PAGAMENTO fora do prazo do art. 145, que
 * é outra discussão, e as médias de adicionais variáveis (art. 142), que entram
 * no salário informado.
 */

import { proporcao, somar } from '../money'
import { citar, fundamentar, reais, type Etapa, type Resultado } from '../traco'
import { centavos, type Centavos } from '../types'
import { compararDatas, diasEntre, diasNoMes, escreverData, lerData, somarDias, type DataCivil } from '../datas'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CF_ART_7_XVII, TST_SUMULA_81 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

/** Mês comercial de trinta dias — a mesma convenção de CALC-004. */
const DIAS_DO_MES_COMERCIAL = 30

/** O terço constitucional é 1/3 — CF, art. 7º, XVII. Mesma constante de CALC-004. */
const DIVISOR_DO_TERCO = 3

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

function dataBr(d: DataCivil): string {
  return `${String(d.dia).padStart(2, '0')}/${String(d.mes).padStart(2, '0')}/${d.ano}`
}

/** Limite de entrada: um período de férias tem no máximo trinta dias (art. 130, I). */
const DIAS_MAXIMO = 30

type Resolvido<T> = { readonly valor: T; readonly resolvida: VigenciaResolvida } | null

function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido<number> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

function fracaoDe(registro: Registro, id: string, data: DataISO): Resolvido<{ numerador: number; denominador: number }> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'fracao') return null
  const { numerador, denominador } = r.resolvida.vigencia.valor
  return { valor: { numerador, denominador }, resolvida: r.resolvida }
}

/**
 * A data `meses` depois, no mesmo dia do mês. Dia que não existe no mês de
 * chegada — 29, 30 ou 31 — vira o primeiro dia do mês seguinte, como em
 * `inicioPeriodoAquisitivo`.
 */
function mesesDepois(d: DataCivil, meses: number): DataCivil {
  const indice = d.ano * 12 + (d.mes - 1) + meses
  const ano = Math.floor(indice / 12)
  const mes = (indice % 12) + 1
  if (d.dia > diasNoMes(ano, mes)) return somarDias({ ano, mes, dia: diasNoMes(ano, mes) }, 1)
  return { ano, mes, dia: d.dia }
}

export interface EntradaFeriasEmDobro {
  /** Remuneração mensal, com as médias de adicionais — art. 142. */
  readonly salario: Centavos
  /** Primeiro dia do período aquisitivo: a admissão ou o aniversário do contrato. */
  readonly inicioDoAquisitivo: string
  /** Primeiro dia das férias gozadas. */
  readonly inicioDasFerias: string
  /** Dias de férias gozados, até trinta. */
  readonly dias: number
}

export interface SaidaFeriasEmDobro {
  readonly fimDoAquisitivo: DataISO
  /** Último dia em que as férias podiam ser gozadas sem dobra. */
  readonly fimDoConcessivo: DataISO
  readonly diasSimples: number
  readonly diasEmDobro: number
  readonly valorSimples: Centavos
  readonly valorEmDobro: Centavos
  readonly total: Centavos
  /** Quanto a dobra acrescentou ao que seria pago dentro do prazo. */
  readonly acrescimoDaDobra: Centavos
}

/** Remuneração de `dias` de férias com o terço. */
function comTerco(salario: Centavos, dias: number): { base: Centavos; terco: Centavos; total: Centavos } {
  const base = proporcao(salario, dias, DIAS_DO_MES_COMERCIAL, POLITICA)
  const terco = proporcao(base, 1, DIVISOR_DO_TERCO, POLITICA)
  return { base, terco, total: somar(base, terco) }
}

export function calcularFeriasEmDobro(
  entrada: EntradaFeriasEmDobro,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaFeriasEmDobro> {
  const inicioAquisitivo = lerData(entrada.inicioDoAquisitivo)
  const inicioFerias = lerData(entrada.inicioDasFerias)
  if (entrada.salario <= 0 || inicioAquisitivo === null || inicioFerias === null) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o salário, o início do período aquisitivo e o primeiro dia das férias.',
    }
  }
  if (!Number.isInteger(entrada.dias) || entrada.dias < 1 || entrada.dias > DIAS_MAXIMO) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os dias de férias vão de 1 a 30.' }
  }

  const aquisitivo = inteiroDe(registro, 'ferias-periodo-aquisitivo-meses', dataReferencia)
  const concessivo = inteiroDe(registro, 'ferias-periodo-concessivo-meses', dataReferencia)
  const fator = fracaoDe(registro, 'ferias-fora-do-prazo-fator', dataReferencia)
  if (aquisitivo === null || concessivo === null || fator === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há regras de férias cadastradas para a data informada.' }
  }

  // O direito é adquirido no dia seguinte ao fim do aquisitivo; o concessivo
  // são os doze meses a partir dali.
  const adquireEm = mesesDepois(inicioAquisitivo, aquisitivo.valor)
  const fimDoAquisitivo = somarDias(adquireEm, -1)
  const fimDoConcessivo = somarDias(mesesDepois(adquireEm, concessivo.valor), -1)

  if (compararDatas(inicioFerias, adquireEm) < 0) {
    return {
      ok: false,
      motivo: 'inconsistencia_temporal',
      detalhe: `As férias começam antes de o período aquisitivo se completar, em ${dataBr(fimDoAquisitivo)}. Férias antecipadas não são o caso desta conta.`,
    }
  }

  // Dias de férias depois do fim do concessivo — Súmula 81.
  const ultimoDia = somarDias(inicioFerias, entrada.dias - 1)
  const diasEmDobro =
    compararDatas(ultimoDia, fimDoConcessivo) <= 0
      ? 0
      : Math.min(entrada.dias, diasEntre(fimDoConcessivo, ultimoDia))
  const diasSimples = entrada.dias - diasEmDobro

  const simples = comTerco(entrada.salario, diasSimples)
  const dobroBase = comTerco(entrada.salario, diasEmDobro)
  const valorEmDobro = proporcao(dobroBase.total, fator.valor.numerador, fator.valor.denominador, POLITICA)
  const total = somar(simples.total, valorEmDobro)
  const dentroDoPrazo = comTerco(entrada.salario, entrada.dias).total
  const acrescimoDaDobra = centavos(total - dentroDoPrazo)

  const etapas: Etapa[] = [
    {
      rotulo: 'Fim do período aquisitivo',
      formula: `${aquisitivo.valor} meses a partir de ${dataBr(inicioAquisitivo)}: termina em ${dataBr(fimDoAquisitivo)}`,
      resultado: centavos(aquisitivo.valor * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(aquisitivo.resolvida),
    },
    {
      rotulo: 'Fim do período concessivo — o prazo para conceder',
      formula: `${concessivo.valor} meses depois: termina em ${dataBr(fimDoConcessivo)}`,
      resultado: centavos(concessivo.valor * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(concessivo.resolvida),
      justificativa: 'Férias gozadas até esta data são pagas de forma simples; depois dela, em dobro.',
    },
    {
      rotulo: `Dias fora do prazo — ${diasEmDobro} de ${entrada.dias}`,
      formula: `férias de ${dataBr(inicioFerias)} a ${dataBr(ultimoDia)}`,
      resultado: centavos(diasEmDobro * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      fundamento: fundamentar(TST_SUMULA_81),
      justificativa: 'Só os dias gozados após o período concessivo são dobrados — não as férias inteiras.',
    },
  ]
  if (diasSimples > 0) {
    etapas.push({
      rotulo: `${diasSimples} dias dentro do prazo, com o terço`,
      formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${diasSimples} = ${reais(simples.base)}; + ⅓ = ${reais(simples.total)}`,
      resultado: simples.total,
      fundamento: fundamentar(CF_ART_7_XVII),
    })
  }
  if (diasEmDobro > 0) {
    etapas.push({
      rotulo: `${diasEmDobro} dias em dobro, com o terço`,
      formula: `(${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${diasEmDobro} + ⅓) × ${fator.valor.numerador} = ${reais(valorEmDobro)}`,
      resultado: valorEmDobro,
      parametro: citar(fator.resolvida),
      justificativa: 'A dobra incide sobre a remuneração de férias, que já inclui o terço constitucional.',
    })
  }
  etapas.push({
    rotulo: 'Total das férias',
    formula: diasEmDobro > 0 ? `${reais(simples.total)} + ${reais(valorEmDobro)}` : 'sem dias fora do prazo',
    resultado: total,
  })

  return {
    ok: true,
    valores: {
      fimDoAquisitivo: escreverData(fimDoAquisitivo),
      fimDoConcessivo: escreverData(fimDoConcessivo),
      diasSimples,
      diasEmDobro,
      valorSimples: simples.total,
      valorEmDobro,
      total,
      acrescimoDaDobra,
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [aquisitivo.resolvida.vigencia.id, concessivo.resolvida.vigencia.id, fator.resolvida.vigencia.id],
    },
  }
}
