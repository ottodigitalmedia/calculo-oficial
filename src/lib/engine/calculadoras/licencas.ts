/**
 * CALC-086 — Licença-maternidade · CALC-087 — Licença-paternidade.
 *
 * Calendário, e não dinheiro: quantos dias, qual o último dia e quando é a volta.
 * O salário do período não muda — a empregada recebe o salário-maternidade, que
 * para a empregada é a remuneração integral, e é isso que a calculadora NÃO
 * estima, porque não há conta a fazer sobre ela.
 *
 * **A duração é resolvida pela data do fato, e não pela data de referência.**
 * Um filho nascido em 30/12/2026 dá cinco dias de licença ao pai; um nascido
 * dois dias depois, dez. Resolver pela data de referência da página daria a
 * mesma duração aos dois — mesmo cuidado de CALC-072, que pergunta ao registro
 * se cada dia era feriado NAQUELE dia.
 *
 * **Convenção de contagem.** O dia do início é o primeiro dia da licença; o
 * último é `início + dias − 1`, e o retorno é o dia seguinte. Para a
 * paternidade a partir de 2027, a Lei nº 15.371/2026 (art. 2º, § 1º) manda
 * contar "da data de nascimento"; antes disso, o ADCT fixa só o prazo, e a
 * calculadora aplica a mesma contagem, declarando isso na nota.
 */

import { compararDatas, escreverData, lerData, somarDias, type DataCivil } from '../datas'
import { citar, fundamentar, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LEI_15371_ART_11 } from '../../params/data/fontes'

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

type Dias = { readonly dias: number; readonly resolvida: VigenciaResolvida } | null

function resolverDias(registro: Registro, id: string, data: DataISO): Dias {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { dias: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

/** "dd/mm/aaaa" — o motor não importa `format/` (`ADR-003`). */
function dataBr(d: DataCivil): string {
  return `${String(d.dia).padStart(2, '0')}/${String(d.mes).padStart(2, '0')}/${d.ano}`
}

function emDias(dias: number) {
  return centavos(dias * CENTESIMOS_POR_UNIDADE)
}

export interface SaidaLicenca {
  readonly diasLicenca: number
  readonly diasProrrogacao: number
  readonly totalDias: number
  readonly inicio: DataISO
  /** Último dia da licença obrigatória. */
  readonly fimLicenca: DataISO
  /** Último dia da prorrogação da Empresa Cidadã, quando pedida. */
  readonly fimProrrogacao: DataISO | null
  /** Primeiro dia de volta ao trabalho. */
  readonly retorno: DataISO
}

interface Comum {
  readonly inicio: DataCivil
  readonly empresaCidada: boolean
  readonly idLicenca: string
  readonly idProrrogacao: string
  readonly rotuloLicenca: string
  readonly etapaInicial: Etapa
  /** Vigências já usadas antes da contagem, como a janela de início da maternidade. */
  readonly vigenciasAnteriores: readonly string[]
  readonly semVigencia: string
  readonly semProrrogacao: string
}

/** O caminho é o mesmo nas duas licenças; o que muda são os parâmetros e o texto. */
function contar(c: Comum, dataReferencia: DataISO, registro: Registro): Resultado<SaidaLicenca> {
  const inicioIso = escreverData(c.inicio)
  const licenca = resolverDias(registro, c.idLicenca, inicioIso)
  if (licenca === null) return { ok: false, motivo: 'vigencia_ausente', detalhe: c.semVigencia }

  const prorrogacao = c.empresaCidada ? resolverDias(registro, c.idProrrogacao, inicioIso) : null
  if (c.empresaCidada && prorrogacao === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: c.semProrrogacao }
  }

  const etapas: Etapa[] = [c.etapaInicial]
  const vigencias = [...c.vigenciasAnteriores, licenca.resolvida.vigencia.id]

  const fimLicenca = somarDias(c.inicio, licenca.dias - 1)
  etapas.push({
    rotulo: c.rotuloLicenca,
    formula: `de ${dataBr(c.inicio)} a ${dataBr(fimLicenca)}, contando o primeiro dia`,
    resultado: emDias(licenca.dias),
    unidade: 'numero',
    parametro: citar(licenca.resolvida),
  })

  let fimProrrogacao: DataCivil | null = null
  const diasProrrogacao = prorrogacao?.dias ?? 0
  if (prorrogacao !== null) {
    vigencias.push(prorrogacao.resolvida.vigencia.id)
    fimProrrogacao = somarDias(fimLicenca, prorrogacao.dias)
    etapas.push({
      rotulo: 'Prorrogação da Empresa Cidadã',
      formula: `de ${dataBr(somarDias(fimLicenca, 1))} a ${dataBr(fimProrrogacao)}, logo após a licença`,
      resultado: emDias(prorrogacao.dias),
      unidade: 'numero',
      parametro: citar(prorrogacao.resolvida),
      justificativa:
        'Só existe se a empresa aderiu ao Programa Empresa Cidadã e a prorrogação foi pedida no prazo da lei. ' +
        'Durante ela, é proibido exercer atividade remunerada.',
    })
  }

  const totalDias = licenca.dias + diasProrrogacao
  const ultimoDia = fimProrrogacao ?? fimLicenca
  const retorno = somarDias(ultimoDia, 1)
  etapas.push({
    rotulo: 'Total de dias de afastamento',
    formula:
      prorrogacao === null
        ? `${licenca.dias} dias · retorno em ${dataBr(retorno)}`
        : `${licenca.dias} + ${diasProrrogacao} dias · retorno em ${dataBr(retorno)}`,
    resultado: emDias(totalDias),
    unidade: 'numero',
  })

  // A data da memória é a que decidiu as vigências — a do fato —, e não a de
  // referência da página, que nestas duas calculadoras não escolhe nada.
  void dataReferencia
  const traco: Traco = { etapas, dataReferencia: inicioIso, vigenciasAplicadas: vigencias }
  return {
    ok: true,
    valores: {
      diasLicenca: licenca.dias,
      diasProrrogacao,
      totalDias,
      inicio: inicioIso,
      fimLicenca: escreverData(fimLicenca),
      fimProrrogacao: fimProrrogacao === null ? null : escreverData(fimProrrogacao),
      retorno: escreverData(retorno),
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-086 — Licença-maternidade
// ---------------------------------------------------------------------------

export interface EntradaLicencaMaternidade {
  /** Primeiro dia de afastamento. */
  readonly inicio: DataISO
  /** Data do parto, quando já conhecida — só para conferir a janela do art. 392, § 1º. */
  readonly parto: DataISO | ''
  readonly empresaCidada: boolean
}

/** A janela do § 1º do art. 392 começa alguns dias antes do parto — quantos, é parâmetro. */
function ehDentroDaJanela(inicio: DataCivil, parto: DataCivil, diasAntes: number): boolean {
  return compararDatas(inicio, somarDias(parto, -diasAntes)) >= 0 && compararDatas(inicio, parto) <= 0
}

export function calcularLicencaMaternidade(
  entrada: EntradaLicencaMaternidade,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaLicenca> {
  const inicio = lerData(entrada.inicio)
  if (!inicio) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a data de início da licença.' }
  }

  const janela = resolverDias(registro, 'licenca-maternidade-inicio-antes-do-parto', entrada.inicio)
  if (janela === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há regra de início da licença cadastrada para a data informada.' }
  }

  let etapaInicial: Etapa = {
    rotulo: 'Início do afastamento',
    formula: dataBr(inicio),
    resultado: emDias(1),
    unidade: 'numero',
    parametro: citar(janela.resolvida),
    justificativa:
      `O afastamento pode começar entre o ${janela.dias}º dia antes do parto e o dia do parto, mediante atestado ` +
      'médico. O dia de início conta como o primeiro dia da licença.',
  }

  if (entrada.parto !== '') {
    const parto = lerData(entrada.parto)
    if (!parto) {
      return { ok: false, motivo: 'entrada_invalida', detalhe: 'A data do parto informada não existe.' }
    }
    if (!ehDentroDaJanela(inicio, parto, janela.dias)) {
      return {
        ok: false,
        motivo: 'entrada_invalida',
        detalhe:
          `O início precisa estar entre o ${janela.dias}º dia antes do parto e o dia do parto (CLT, art. 392, § 1º). ` +
          'Se o parto já ocorreu antes do afastamento, informe a data do parto como início.',
      }
    }
    etapaInicial = {
      ...etapaInicial,
      formula: `${dataBr(inicio)}, dentro da janela de ${dataBr(somarDias(parto, -janela.dias))} a ${dataBr(parto)}`,
    }
  }

  return contar(
    {
      inicio,
      empresaCidada: entrada.empresaCidada,
      idLicenca: 'licenca-maternidade-dias',
      idProrrogacao: 'empresa-cidada-maternidade-dias',
      rotuloLicenca: 'Licença-maternidade',
      etapaInicial,
      vigenciasAnteriores: [janela.resolvida.vigencia.id],
      semVigencia: 'Não há duração de licença-maternidade cadastrada para a data informada.',
      semProrrogacao:
        'A prorrogação da Empresa Cidadã está cadastrada para licenças iniciadas a partir de 2025.',
    },
    dataReferencia,
    registro,
  )
}

// ---------------------------------------------------------------------------
// CALC-087 — Licença-paternidade
// ---------------------------------------------------------------------------

export interface EntradaLicencaPaternidade {
  /** Data do nascimento, da adoção ou da guarda judicial para fins de adoção. */
  readonly nascimento: DataISO
  readonly empresaCidada: boolean
}

export function calcularLicencaPaternidade(
  entrada: EntradaLicencaPaternidade,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaLicenca> {
  const nascimento = lerData(entrada.nascimento)
  if (!nascimento) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a data do nascimento, da adoção ou da guarda.',
    }
  }

  const vigente = resolverDias(registro, 'licenca-paternidade-dias', entrada.nascimento)
  const leiNova = vigente?.resolvida.vigencia.fonteId === LEI_15371_ART_11.id
  const etapaInicial: Etapa = {
    rotulo: 'Início da contagem',
    formula: `${dataBr(nascimento)} — data do nascimento, da adoção ou da guarda`,
    resultado: emDias(1),
    unidade: 'numero',
    ...(leiNova
      ? {
          fundamento: fundamentar(LEI_15371_ART_11),
          justificativa: 'A lei manda contar o período a partir da data do nascimento, da adoção ou da guarda.',
        }
      : {
          justificativa:
            'Até 2026 as normas fixam o prazo em dias consecutivos, sem dizer o dia inicial. A contagem aqui começa ' +
            'na data informada, que é a regra expressa da lei que vale a partir de 2027.',
        }),
  }

  return contar(
    {
      inicio: nascimento,
      empresaCidada: entrada.empresaCidada,
      idLicenca: 'licenca-paternidade-dias',
      idProrrogacao: 'empresa-cidada-paternidade-dias',
      rotuloLicenca: 'Licença-paternidade',
      etapaInicial,
      vigenciasAnteriores: [],
      semVigencia:
        'Para nascimentos a partir de 2029, a duração ainda depende de meta fiscal (Lei nº 15.371/2026, art. 11) ' +
        'e não pode ser calculada com segurança.',
      semProrrogacao:
        'A prorrogação da Empresa Cidadã está cadastrada para nascimentos a partir de 2025.',
    },
    dataReferencia,
    registro,
  )
}
