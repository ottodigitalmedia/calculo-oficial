/**
 * CALC-072 — Dias úteis entre datas.
 *
 * **O que quase toda calculadora de dias úteis erra.** Carnaval, Sexta-feira
 * Santa e Corpus Christi não são feriados nacionais. A Lei nº 9.093/1995 diz
 * que feriados civis são os declarados em lei federal (art. 1º) e que a
 * Sexta-Feira da Paixão é feriado RELIGIOSO, declarado em lei municipal, dentro
 * de um limite de quatro (art. 2º). Carnaval e Corpus Christi são ponto
 * facultativo.
 *
 * Os nove nacionais estão em `params/data/feriados.ts`, cada um com sua lei e
 * sua vigência — porque três deles entraram depois, e contar 2020 com o feriado
 * de 2023 dentro seria errado.
 *
 * **Os móveis entram por escolha, e a escolha é do usuário.** Eles são
 * calculáveis com exatidão a partir da Páscoa, e a página oferece cada um com o
 * seu nome e a sua natureza declarada — em vez de somá-los em silêncio ou de
 * ignorá-los, que são as duas formas de errar aqui. Quem trabalha num município
 * onde a Sexta-feira Santa é feriado marca a caixa; quem não trabalha, não.
 *
 * A DATA DA PÁSCOA É ARITMÉTICA, NÃO FONTE
 *
 * O algoritmo abaixo é o cômputo gregoriano — o mesmo desde 1582, e o mesmo que
 * a Igreja usa para publicar o calendário litúrgico. Ele não tem fonte a citar
 * porque não é dado: é uma definição, como o calendário bissexto que
 * `datas.ts` já implementa.
 */

import {
  compararDatas,
  diasEntre,
  escreverData,
  lerData,
  somarDias,
  type DataCivil,
} from '../datas'
import { fundamentar, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_9093_1995 } from '../../params/data/fontes'
import { IDS_DOS_FERIADOS } from '../../params/data/feriados'

export const PARAMETROS_DIAS_UTEIS = IDS_DOS_FERIADOS

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/**
 * Domingo de Páscoa do ano, pelo cômputo gregoriano.
 *
 * Aritmética pura: mesma entrada, mesma saída, sem tabela e sem fonte externa.
 * Os números abaixo são as constantes do algoritmo, e não parâmetros legais.
 */
/* eslint-disable no-restricted-syntax -- constantes do cômputo gregoriano, não parâmetros */
export function domingoDePascoa(ano: number): DataCivil {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return { ano, mes, dia }
}
/* eslint-enable no-restricted-syntax */

/** Os móveis que a página oferece, todos derivados da Páscoa. */
export type FeriadoMovel = 'carnaval' | 'sexta-santa' | 'corpus-christi'

/** Deslocamento de cada móvel em relação ao domingo de Páscoa. */
const DESLOCAMENTO: Readonly<Record<FeriadoMovel, number>> = {
  // Terça-feira de carnaval: 47 dias antes da Páscoa.
  carnaval: -47,
  // Sexta-feira da Paixão: dois dias antes.
  'sexta-santa': -2,
  // Corpus Christi: sessenta dias depois.
  'corpus-christi': 60,
}

export function dataDoMovel(ano: number, qual: FeriadoMovel): DataCivil {
  return somarDias(domingoDePascoa(ano), DESLOCAMENTO[qual])
}

export interface EntradaDiasUteis {
  readonly inicio: DataISO
  readonly fim: DataISO
  /** Quais móveis contar como não úteis. Nenhum é feriado nacional. */
  readonly moveis: readonly FeriadoMovel[]
  /** Feriados municipais ou estaduais que caem em dia de semana no período. */
  readonly locaisEmDiaDeSemana: number
  /** Conta o sábado como dia útil — a jornada de seis dias ainda existe. */
  readonly sabadoEhUtil: boolean
}

export interface DiaNaoUtil {
  readonly data: DataISO
  readonly nome: string
  readonly nacional: boolean
}

export interface SaidaDiasUteis {
  readonly diasCorridos: number
  readonly diasUteis: number
  readonly fimDeSemana: number
  readonly feriadosEmDiaUtil: readonly DiaNaoUtil[]
  readonly locaisDescontados: number
}

const DIAS_NA_SEMANA = 7

/** Dia da semana: 0 é domingo. Deriva da contagem desde uma âncora conhecida. */
function diaDaSemana(d: DataCivil): number {
  // 2000-01-01 foi um sábado (6). A âncora é aritmética, não dado.
  // eslint-disable-next-line no-restricted-syntax -- âncora do calendário, não parâmetro
  const ancora: DataCivil = { ano: 2000, mes: 1, dia: 1 }
  const delta = diasEntre(ancora, d)
  return (((delta + 6) % DIAS_NA_SEMANA) + DIAS_NA_SEMANA) % DIAS_NA_SEMANA
}

export function calcularDiasUteis(
  entrada: EntradaDiasUteis,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaDiasUteis> {
  const inicio = lerData(entrada.inicio)
  const fim = lerData(entrada.fim)

  if (!inicio || !fim) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe as duas datas para ver o resultado.',
    }
  }
  if (compararDatas(inicio, fim) > 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A data final precisa ser igual ou posterior à inicial.',
    }
  }
  if (entrada.locaisEmDiaDeSemana < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A quantidade de feriados locais não pode ser negativa.',
    }
  }

  /**
   * **Cada dia pergunta ao registro se ele era feriado NAQUELE dia.**
   *
   * É a diferença entre contar certo e contar o passado com as leis de hoje. O
   * 20 de novembro só existe desde 22/12/2023, e o 21 de abril desde 20/12/2002
   * — quem pede os dias úteis de 2020 precisa da lista de 2020.
   *
   * Resolver por ANO seria mais barato e estaria errado na fronteira: em 2023 o
   * dia 20 de novembro é anterior à publicação da lei, e um cache por ano o
   * transformaria em feriado retroativo. A pergunta é por dia, e a resposta
   * também.
   */
  function feriadoNacionalDe(dia: DataCivil): string | null {
    const iso = escreverData(dia)
    for (const id of IDS_DOS_FERIADOS) {
      const r = registro.resolver(id, iso)
      if (!r.ok) continue
      const valor = r.resolvida.vigencia.valor
      if (valor.tipo !== 'data_fixa') continue
      if (valor.mes === dia.mes && valor.dia === dia.dia) return r.resolvida.parametro.nome
    }
    return null
  }

  /**
   * Um período inteiro anterior à primeira lei de feriados não é caso de
   * contagem: é `RN-003` bloqueando, e a página diz isso.
   */
  const algumFeriadoConhecido = IDS_DOS_FERIADOS.some(
    (id) => registro.resolver(id, escreverData(fim)).ok,
  )
  if (!algumFeriadoConhecido) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'O período informado é anterior à primeira lei de feriados nacionais cadastrada.',
    }
  }

  /** Os móveis escolhidos, resolvidos ano a ano dentro do intervalo. */
  const moveisPorAno = new Map<string, string>()
  for (let ano = inicio.ano; ano <= fim.ano; ano += 1) {
    for (const qual of entrada.moveis) {
      const d = dataDoMovel(ano, qual)
      moveisPorAno.set(escreverData(d), NOME_DO_MOVEL[qual])
    }
  }

  const diasCorridos = diasEntre(inicio, fim) + 1
  const feriadosEmDiaUtil: DiaNaoUtil[] = []
  let diasUteis = 0
  let fimDeSemana = 0

  for (let i = 0; i < diasCorridos; i += 1) {
    const dia = somarDias(inicio, i)
    const semana = diaDaSemana(dia)
    const ehFimDeSemana = semana === 0 || (semana === 6 && !entrada.sabadoEhUtil)

    if (ehFimDeSemana) {
      fimDeSemana += 1
      continue
    }

    const iso = escreverData(dia)
    const nacional = feriadoNacionalDe(dia)
    const movel = moveisPorAno.get(iso)

    if (nacional) {
      feriadosEmDiaUtil.push({ data: iso, nome: nacional, nacional: true })
      continue
    }
    if (movel) {
      feriadosEmDiaUtil.push({ data: iso, nome: movel, nacional: false })
      continue
    }

    diasUteis += 1
  }

  /**
   * Os locais entram como QUANTIDADE, e não como datas: são municipais e
   * estaduais, e `00-catalogo` §14 fecha a porta do dado hiperlocal. O usuário
   * sabe quantos caem no período dele; o produto não tem como saber.
   */
  const locaisDescontados = Math.min(entrada.locaisEmDiaDeSemana, diasUteis)
  diasUteis -= locaisDescontados

  const etapas: Etapa[] = [
    {
      rotulo: 'Dias corridos no período',
      formula: `de ${entrada.inicio} a ${entrada.fim}, incluindo os dois`,
      resultado: centavos(diasCorridos * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
    },
    {
      rotulo: entrada.sabadoEhUtil ? 'Domingos' : 'Sábados e domingos',
      formula: entrada.sabadoEhUtil
        ? 'dias que caem em domingo'
        : 'dias que caem em sábado ou domingo',
      resultado: centavos(fimDeSemana * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
    },
    {
      rotulo: 'Feriados que caem em dia de semana',
      formula:
        feriadosEmDiaUtil.length > 0
          ? feriadosEmDiaUtil.map((f) => f.nome).join(', ')
          : 'nenhum no período',
      resultado: centavos(feriadosEmDiaUtil.length * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      fundamento: fundamentar(LEI_9093_1995),
      justificativa:
        'Só entram como nacionais os declarados em lei federal. Carnaval, Sexta-feira Santa e ' +
        'Corpus Christi NÃO são feriados nacionais — a Sexta-Feira da Paixão é feriado religioso ' +
        'de lei municipal, e os outros dois são ponto facultativo. Eles só contam aqui se você ' +
        'marcou.',
    },
  ]

  if (locaisDescontados > 0) {
    etapas.push({
      rotulo: 'Feriados locais informados',
      formula: `${locaisDescontados} descontados dos dias de semana`,
      resultado: centavos(locaisDescontados * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      justificativa:
        'Feriado municipal e estadual varia de lugar para lugar, e este produto não publica dado ' +
        'hiperlocal. A quantidade é sua — o calendário da sua prefeitura é onde ela está.',
    })
  }

  etapas.push({
    rotulo: 'Dias úteis',
    formula: `${diasCorridos} corridos − ${fimDeSemana} de fim de semana − ${feriadosEmDiaUtil.length} feriados${locaisDescontados > 0 ? ` − ${locaisDescontados} locais` : ''}`,
    resultado: centavos(diasUteis * CENTESIMOS_POR_UNIDADE),
    unidade: 'numero',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      diasCorridos,
      diasUteis,
      fimDeSemana,
      feriadosEmDiaUtil,
      locaisDescontados,
    },
    traco,
  }
}

const NOME_DO_MOVEL: Readonly<Record<FeriadoMovel, string>> = {
  carnaval: 'Terça-feira de carnaval',
  'sexta-santa': 'Sexta-feira da Paixão',
  'corpus-christi': 'Corpus Christi',
}
