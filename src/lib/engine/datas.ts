/**
 * Aritmética de datas do motor — pura, sem relógio.
 *
 * **Por que não usar `Date`.** `ADR-003` C-M2 proíbe o motor de ler o relógio,
 * e `new Date('2026-03-15')` não é leitura de relógio, mas traz um problema
 * pior: a especificação manda interpretar a forma "só data" como **UTC**, e
 * qualquer operação subsequente em métodos locais desloca o dia em fuso
 * negativo — que é o do Brasil inteiro. Um contrato encerrado em 1º de março
 * viraria 28 de fevereiro, e o mês inteiro sumiria da contagem de avos.
 *
 * O erro não apareceria em teste rodando em UTC. Aqui a data é um registro de
 * três inteiros e a aritmética é feita à mão — determinística em qualquer
 * máquina, que é o que `C-M2` protege.
 */

import type { DataISO } from '../params/tipos'

export interface DataCivil {
  readonly ano: number
  readonly mes: number
  readonly dia: number
}

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/

// Definições de calendário, não parâmetros legais: a duração dos meses não
// muda por portaria. BV-10 existe para impedir tabela de INSS escrita à mão.
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/**
 * Constantes do calendário gregoriano, usadas por `paraDiaSerial`.
 *
 * Nomeadas em vez de literais no meio da conta por causa de BV-10: a regra
 * suspeita de todo número ≥ 100 dentro do motor, e ela está certa em suspeitar.
 * Aqui, nenhuma delas muda por portaria — são propriedades do calendário:
 *
 *   ANOS_POR_ERA      um ciclo completo do calendário gregoriano
 *   DIAS_POR_ERA      dias em 400 anos, já descontadas as regras de bissexto
 *   DIAS_POR_ANO_BASE ano comum
 *   REGRA_SECULAR     ano múltiplo de 100 não é bissexto, salvo múltiplo de 400
 *   PASSO_DO_MES      numerador da fórmula que dá o dia do ano sem tabela
 */
// eslint-disable-next-line no-restricted-syntax -- ciclo do calendário gregoriano
const ANOS_POR_ERA = 400
// eslint-disable-next-line no-restricted-syntax -- dias em 400 anos gregorianos
const DIAS_POR_ERA = 146_097
// eslint-disable-next-line no-restricted-syntax -- duração do ano comum
const DIAS_POR_ANO_BASE = 365
// eslint-disable-next-line no-restricted-syntax -- regra secular do bissexto
const REGRA_SECULAR = 100
// eslint-disable-next-line no-restricted-syntax -- numerador da fórmula de Hinnant
const PASSO_DO_MES = 153

export function ehBissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % REGRA_SECULAR !== 0) || ano % ANOS_POR_ERA === 0
}

export function diasNoMes(ano: number, mes: number): number {
  if (mes === 2 && ehBissexto(ano)) return 29
  return DIAS_POR_MES[mes - 1] ?? 30
}

/** Converte "AAAA-MM-DD" em data civil, ou `null` se a data não existe. */
export function lerData(iso: string): DataCivil | null {
  const m = FORMATO.exec(iso)
  if (!m) return null
  const ano = Number(m[1])
  const mes = Number(m[2])
  const dia = Number(m[3])
  if (mes < 1 || mes > 12) return null
  if (dia < 1 || dia > diasNoMes(ano, mes)) return null
  return { ano, mes, dia }
}

export function escreverData(d: DataCivil): DataISO {
  const mm = String(d.mes).padStart(2, '0')
  const dd = String(d.dia).padStart(2, '0')
  return `${d.ano}-${mm}-${dd}` as DataISO
}

/** Ordem cronológica: negativo se `a` vem antes de `b`. */
export function compararDatas(a: DataCivil, b: DataCivil): number {
  if (a.ano !== b.ano) return a.ano - b.ano
  if (a.mes !== b.mes) return a.mes - b.mes
  return a.dia - b.dia
}

/** Dias decorridos desde uma época fixa. Usado só para diferenças. */
function paraDiaSerial(d: DataCivil): number {
  // Algoritmo de Howard Hinnant: exato em inteiros, sem ponto flutuante e sem
  // fuso. A escolha do marco zero é irrelevante — só diferenças são usadas.
  const a = d.mes <= 2 ? d.ano - 1 : d.ano
  const era = Math.floor(a / ANOS_POR_ERA)
  const anoDaEra = a - era * ANOS_POR_ERA
  const diaDoAno = Math.floor((PASSO_DO_MES * (d.mes + (d.mes > 2 ? -3 : 9)) + 2) / 5) + d.dia - 1
  const diaDaEra =
    anoDaEra * DIAS_POR_ANO_BASE +
    Math.floor(anoDaEra / 4) -
    Math.floor(anoDaEra / REGRA_SECULAR) +
    diaDoAno
  return era * DIAS_POR_ERA + diaDaEra
}

/** Diferença em dias inteiros, `fim − inicio`. */
export function diasEntre(inicio: DataCivil, fim: DataCivil): number {
  return paraDiaSerial(fim) - paraDiaSerial(inicio)
}

/** Soma dias a uma data, atravessando meses e anos corretamente. */
export function somarDias(d: DataCivil, dias: number): DataCivil {
  let ano = d.ano
  let mes = d.mes
  let dia = d.dia + dias

  while (dia > diasNoMes(ano, mes)) {
    dia -= diasNoMes(ano, mes)
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }
  while (dia < 1) {
    mes -= 1
    if (mes < 1) {
      mes = 12
      ano -= 1
    }
    dia += diasNoMes(ano, mes)
  }
  return { ano, mes, dia }
}

/**
 * Anos completos entre duas datas.
 *
 * "Completo" é o aniversário alcançado: admitido em 10/03/2020 e desligado em
 * 09/03/2026 tem 5 anos, não 6. É o que a Lei nº 12.506/2011 chama de "ano de
 * serviço prestado".
 */
export function anosCompletos(inicio: DataCivil, fim: DataCivil): number {
  let anos = fim.ano - inicio.ano
  if (fim.mes < inicio.mes || (fim.mes === inicio.mes && fim.dia < inicio.dia)) anos -= 1
  return Math.max(0, anos)
}

/**
 * Avos por fração igual ou superior a 15 dias — `RN-015`.
 *
 * **As duas normas usam redações diferentes e descrevem o mesmo conjunto:**
 * a Lei nº 4.090/1962, art. 1º, § 2º, diz "fração **igual ou superior a 15**
 * dias"; a CLT, art. 146, parágrafo único, diz "fração **superior a 14** dias".
 * Em dias inteiros — e dia de serviço é sempre inteiro — "≥ 15" e "> 14" são o
 * mesmo. Por isso 13º e férias compartilham esta função.
 *
 * Não "corrija" uma das duas citações achando que é erro de transcrição: elas
 * estão certas e são diferentes. Ver `docs/19-incidencias-verbas-rescisorias.md` §7.
 *
 * Conta os meses do intervalo `[inicio, fim]`, inclusive nas duas pontas,
 * somando um avo por mês em que houve 15 dias ou mais de contrato.
 */
export function avosPorQuinzena(inicio: DataCivil, fim: DataCivil, teto: number): number {
  if (compararDatas(inicio, fim) > 0) return 0

  let avos = 0
  let ano = inicio.ano
  let mes = inicio.mes

  while (ano < fim.ano || (ano === fim.ano && mes <= fim.mes)) {
    const primeiroDoMes = ano === inicio.ano && mes === inicio.mes ? inicio.dia : 1
    const ultimoDoMes = ano === fim.ano && mes === fim.mes ? fim.dia : diasNoMes(ano, mes)
    // +1 porque as duas pontas são dias trabalhados.
    if (ultimoDoMes - primeiroDoMes + 1 >= 15) avos += 1

    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }

  return Math.min(avos, teto)
}

/**
 * Início do período aquisitivo de férias em curso na data informada.
 *
 * É o último aniversário de admissão que não ultrapassa `fim`. Períodos
 * aquisitivos anteriores já venceram e entram pelo campo de férias vencidas.
 */
export function inicioPeriodoAquisitivo(admissao: DataCivil, fim: DataCivil): DataCivil {
  const completos = anosCompletos(admissao, fim)
  const candidato = { ano: admissao.ano + completos, mes: admissao.mes, dia: admissao.dia }
  // 29 de fevereiro em ano não bissexto: o aniversário cai em 1º de março.
  if (candidato.dia > diasNoMes(candidato.ano, candidato.mes)) {
    return somarDias({ ...candidato, dia: diasNoMes(candidato.ano, candidato.mes) }, 1)
  }
  return candidato
}
