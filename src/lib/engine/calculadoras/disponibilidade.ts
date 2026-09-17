/**
 * CALC-089 — Rescisão antecipada do contrato a prazo · CALC-090 — Adicional de
 * transferência · CALC-091 — Sobreaviso e prontidão.
 *
 * Três regras curtas da CLT, no mesmo arquivo pela razão de `adicionais.ts`.
 *
 * **O que cada uma tem de armadilha:**
 *
 * - contrato a prazo: a indenização do art. 479 é METADE do que o empregado
 *   receberia até o fim do contrato, e só existe quando o contrato não tem
 *   cláusula de rescisão antecipada (art. 481). No sentido inverso — o empregado
 *   que sai antes — a lei manda indenizar prejuízos, mas o teto que existia (§ 1º
 *   do art. 480) foi revogado: não há número a calcular;
 * - transferência: o percentual é piso ("nunca inferior a") e o adicional dura
 *   "enquanto durar essa situação" — transferência definitiva não o gera;
 * - sobreaviso e prontidão: as horas não são pagas como horas normais, e sim a
 *   um terço e a dois terços do valor da hora.
 */

import { aplicarAliquota, proporcao, somar } from '../money'
import { diasEntre, lerData } from '../datas'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CLT_ART_64, TST_SUMULA_428, TST_SUMULA_431 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

/**
 * O dia do mensalista é um trinta avos do salário — CLT, art. 64, a mesma base
 * de `repouso.ts` e `jornada-e-fgts.ts`.
 */
const DIAS_DO_MES_COMERCIAL = 30

/** Divisor mensal = jornada semanal × 5 — a derivação de `adicionais.ts`. */
const DIAS_UTEIS_POR_MES_SOBRE_SEMANA = 5

/** As horas chegam em centésimos, como todo campo decimal. Unidade. */
// eslint-disable-next-line no-restricted-syntax -- escala do campo decimal (centésimos), não constante legal
const CENTESIMOS = 100

type Fracao = { readonly numerador: number; readonly denominador: number; readonly resolvida: VigenciaResolvida } | null

function resolverFracao(registro: Registro, id: string, data: DataISO): Fracao {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'fracao') return null
  const v = r.resolvida.vigencia.valor
  return { numerador: v.numerador, denominador: v.denominador, resolvida: r.resolvida }
}

type Percentual = { readonly valor: BasisPoints; readonly resolvida: VigenciaResolvida } | null

function resolverPercentual(registro: Registro, id: string, data: DataISO): Percentual {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: basisPoints(r.resolvida.vigencia.valor.aliquotaBp), resolvida: r.resolvida }
}

function fracaoTexto(f: { readonly numerador: number; readonly denominador: number }): string {
  return `${f.numerador}/${f.denominador}`
}

/** "7,50h" a partir de 750 centésimos. */
function horas(centesimos: number): string {
  const inteiro = Math.trunc(centesimos / CENTESIMOS)
  const fracao = centesimos % CENTESIMOS
  return fracao === 0 ? `${inteiro}h` : `${inteiro},${String(fracao).padStart(2, '0')}h`
}

// ---------------------------------------------------------------------------
// CALC-089 — Rescisão antecipada do contrato por prazo determinado
// ---------------------------------------------------------------------------

export interface EntradaContratoAPrazo {
  readonly salario: Centavos
  /** Média mensal da parte variável — comissões, adicionais habituais. Zero se não há. */
  readonly mediaVariavel: Centavos
  /** Último dia trabalhado. */
  readonly dataRescisao: DataISO
  /** Data em que o contrato terminaria. */
  readonly dataTermo: DataISO
}

export interface SaidaContratoAPrazo {
  readonly indenizacao: Centavos
  readonly remuneracaoAteOTermo: Centavos
  readonly remuneracaoMensal: Centavos
  readonly diasRestantes: number
}

export function calcularContratoAPrazo(
  entrada: EntradaContratoAPrazo,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaContratoAPrazo> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário mensal.' }
  }
  if (entrada.mediaVariavel < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A média da parte variável não pode ser negativa.' }
  }
  const rescisao = lerData(entrada.dataRescisao)
  const termo = lerData(entrada.dataTermo)
  if (!rescisao || !termo) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a data da dispensa e a data prevista para o fim do contrato.' }
  }
  const diasRestantes = diasEntre(rescisao, termo)
  if (diasRestantes <= 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O fim previsto do contrato precisa ser posterior à data da dispensa. Contrato que chegou ao termo não gera esta indenização.',
    }
  }

  const fracao = resolverFracao(registro, 'contrato-prazo-indenizacao-fracao', entrada.dataRescisao)
  if (fracao === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há regra de indenização cadastrada para a data informada.' }
  }

  const etapas: Etapa[] = []
  const remuneracaoMensal = somar(entrada.salario, entrada.mediaVariavel)
  etapas.push({
    rotulo: 'Remuneração mensal considerada',
    formula:
      entrada.mediaVariavel > 0
        ? `${reais(entrada.salario)} de salário + ${reais(entrada.mediaVariavel)} de média variável`
        : reais(entrada.salario),
    resultado: remuneracaoMensal,
    ...(entrada.mediaVariavel > 0
      ? {
          justificativa:
            'A parte variável entra pela média, como manda o parágrafo único do art. 479 ao remeter à indenização do contrato por prazo indeterminado.',
        }
      : {}),
  })

  const remuneracaoAteOTermo = proporcao(remuneracaoMensal, diasRestantes, DIAS_DO_MES_COMERCIAL, POLITICA)
  etapas.push({
    rotulo: 'Remuneração que seria recebida até o fim do contrato',
    formula: `${reais(remuneracaoMensal)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'} restantes`,
    resultado: remuneracaoAteOTermo,
    fundamento: fundamentar(CLT_ART_64),
    justificativa: 'O dia do mensalista é um trinta avos do salário, qualquer que seja o número de dias do mês.',
  })

  const indenizacao = proporcao(
    remuneracaoMensal,
    diasRestantes * fracao.numerador,
    DIAS_DO_MES_COMERCIAL * fracao.denominador,
    POLITICA,
  )
  etapas.push({
    rotulo: 'Indenização do art. 479 — metade',
    formula: `${reais(remuneracaoMensal)} × ${diasRestantes} ÷ ${DIAS_DO_MES_COMERCIAL} × ${fracaoTexto(fracao)}`,
    resultado: indenizacao,
    parametro: citar(fracao.resolvida),
    justificativa:
      'A conta é feita de uma vez sobre o salário mensal, sem arredondar a remuneração do período no caminho. ' +
      'Não vale se o contrato tem cláusula que permite a qualquer das partes encerrá-lo antes: nesse caso, ' +
      'aplicam-se os princípios da rescisão do contrato por prazo indeterminado (art. 481).',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [fracao.resolvida.vigencia.id] }
  return {
    ok: true,
    valores: { indenizacao, remuneracaoAteOTermo, remuneracaoMensal, diasRestantes },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-090 — Adicional de transferência
// ---------------------------------------------------------------------------

export interface EntradaTransferencia {
  readonly salario: Centavos
  /** Percentual maior previsto em contrato ou convenção. Zero = o mínimo legal. */
  readonly percentualInformado: BasisPoints
}

export interface SaidaTransferencia {
  readonly adicional: Centavos
  readonly salarioComAdicional: Centavos
  readonly aliquota: BasisPoints
  readonly minimoLegal: BasisPoints
}

export function calcularTransferencia(
  entrada: EntradaTransferencia,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaTransferencia> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário recebido na localidade de origem.' }
  }
  const minimo = resolverPercentual(registro, 'transferencia-adicional-minimo', dataReferencia)
  if (minimo === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há adicional de transferência cadastrado para a data informada.' }
  }
  if (entrada.percentualInformado < 0 || (entrada.percentualInformado > 0 && entrada.percentualInformado < minimo.valor)) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `O percentual combinado não pode ser menor que o mínimo legal de ${percentual(minimo.valor)}.`,
    }
  }

  const etapas: Etapa[] = []
  const usaMinimo = entrada.percentualInformado <= 0
  const aliquota = usaMinimo ? minimo.valor : entrada.percentualInformado

  const adicional = aplicarAliquota(entrada.salario, aliquota, POLITICA)
  etapas.push({
    rotulo: usaMinimo
      ? `Adicional de transferência — mínimo legal de ${percentual(aliquota)}`
      : `Adicional de transferência — ${percentual(aliquota)} combinados`,
    formula: `${reais(entrada.salario)} × ${percentual(aliquota)}`,
    resultado: adicional,
    parametro: citar(minimo.resolvida),
    justificativa:
      'Calculado sobre o salário que o empregado recebia na localidade de origem, e devido enquanto durar a ' +
      'transferência. Mudança definitiva de local não gera o adicional.',
  })

  const salarioComAdicional = somar(entrada.salario, adicional)
  etapas.push({
    rotulo: 'Salário com o adicional',
    formula: `${reais(entrada.salario)} + ${reais(adicional)}`,
    resultado: salarioComAdicional,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [minimo.resolvida.vigencia.id] }
  return {
    ok: true,
    valores: { adicional, salarioComAdicional, aliquota, minimoLegal: minimo.valor },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-091 — Sobreaviso e prontidão
// ---------------------------------------------------------------------------

export interface EntradaSobreaviso {
  readonly salario: Centavos
  readonly jornadaSemanal: number
  /** Horas de sobreaviso no mês, em centésimos. */
  readonly horasSobreavisoCentesimos: number
  /** Horas de prontidão no mês, em centésimos. */
  readonly horasProntidaoCentesimos: number
}

export interface SaidaSobreaviso {
  readonly total: Centavos
  readonly sobreaviso: Centavos
  readonly prontidao: Centavos
  readonly valorHoraNormal: Centavos
  readonly divisor: number
}

export function calcularSobreaviso(
  entrada: EntradaSobreaviso,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaSobreaviso> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário mensal.' }
  }
  if (entrada.jornadaSemanal <= 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Informe a jornada semanal.' }
  }
  if (entrada.horasSobreavisoCentesimos < 0 || entrada.horasProntidaoCentesimos < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'As horas não podem ser negativas.' }
  }
  if (entrada.horasSobreavisoCentesimos === 0 && entrada.horasProntidaoCentesimos === 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe as horas de sobreaviso, de prontidão ou as duas.' }
  }

  const fracaoSobreaviso = resolverFracao(registro, 'sobreaviso-fracao', dataReferencia)
  const fracaoProntidao = resolverFracao(registro, 'prontidao-fracao', dataReferencia)
  if (fracaoSobreaviso === null || fracaoProntidao === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há regra de sobreaviso e prontidão cadastrada para a data informada.' }
  }

  const etapas: Etapa[] = []
  const vigencias: string[] = []

  const divisor = entrada.jornadaSemanal * DIAS_UTEIS_POR_MES_SOBRE_SEMANA
  const valorHoraNormal = proporcao(entrada.salario, 1, divisor, POLITICA)
  etapas.push({
    rotulo: 'Valor da hora normal',
    formula: `${reais(entrada.salario)} ÷ ${divisor} (jornada de ${entrada.jornadaSemanal}h × 5)`,
    resultado: valorHoraNormal,
    fundamento: fundamentar(entrada.jornadaSemanal === 40 ? TST_SUMULA_431 : CLT_ART_64),
  })

  // As duas contas partem do salário mensal, e não da hora arredondada acima:
  // salário × horas × fração ÷ (divisor × 100 × denominador), um arredondamento só.
  let sobreaviso: Centavos = ZERO
  if (entrada.horasSobreavisoCentesimos > 0) {
    vigencias.push(fracaoSobreaviso.resolvida.vigencia.id)
    sobreaviso = proporcao(
      entrada.salario,
      entrada.horasSobreavisoCentesimos * fracaoSobreaviso.numerador,
      divisor * CENTESIMOS * fracaoSobreaviso.denominador,
      POLITICA,
    )
    etapas.push({
      rotulo: `Horas de sobreaviso a ${fracaoTexto(fracaoSobreaviso)} da hora`,
      formula: `${reais(valorHoraNormal)} × ${fracaoTexto(fracaoSobreaviso)} × ${horas(entrada.horasSobreavisoCentesimos)}`,
      resultado: sobreaviso,
      parametro: citar(fracaoSobreaviso.resolvida),
      fundamento: fundamentar(TST_SUMULA_428),
      justificativa:
        'Sobreaviso é ficar à distância, fora do local de trabalho, aguardando chamado. Ter celular da empresa, ' +
        'sozinho, não caracteriza; a súmula exige plantão ou escala sob controle do empregador.',
    })
  }

  let prontidao: Centavos = ZERO
  if (entrada.horasProntidaoCentesimos > 0) {
    vigencias.push(fracaoProntidao.resolvida.vigencia.id)
    prontidao = proporcao(
      entrada.salario,
      entrada.horasProntidaoCentesimos * fracaoProntidao.numerador,
      divisor * CENTESIMOS * fracaoProntidao.denominador,
      POLITICA,
    )
    etapas.push({
      rotulo: `Horas de prontidão a ${fracaoTexto(fracaoProntidao)} da hora`,
      formula: `${reais(valorHoraNormal)} × ${fracaoTexto(fracaoProntidao)} × ${horas(entrada.horasProntidaoCentesimos)}`,
      resultado: prontidao,
      parametro: citar(fracaoProntidao.resolvida),
      justificativa:
        'Prontidão é ficar nas dependências do empregador aguardando ordens. O texto da CLT é dos ferroviários; ' +
        'fora dessa categoria, confira a convenção coletiva.',
    })
  }

  const total = somar(sobreaviso, prontidao)
  etapas.push({
    rotulo: 'Total de sobreaviso e prontidão',
    formula: `${reais(sobreaviso)} + ${reais(prontidao)}`,
    resultado: total,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: vigencias }
  return {
    ok: true,
    valores: { total, sobreaviso, prontidao, valorHoraNormal, divisor },
    traco,
  }
}
