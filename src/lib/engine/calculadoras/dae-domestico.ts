/**
 * CALC-117 — DAE do empregador doméstico: o que vai na guia e quanto custa.
 *
 * O Simples Doméstico (LC nº 150/2015, art. 34) junta seis valores num
 * documento só:
 *
 * - descontados do empregado: o INSS, pela tabela progressiva, e o imposto de
 *   renda retido, se houver;
 * - pagos pelo empregador: 8% de contribuição patronal e 0,8% de seguro contra
 *   acidentes, sobre o salário de contribuição; 8% de FGTS e 3,2% da
 *   indenização compensatória (art. 22), sobre a remuneração.
 *
 * **Salário de contribuição tem teto; remuneração, não.** A patronal e o
 * seguro-acidente incidem sobre a base do INSS, limitada ao teto; o FGTS e os
 * 3,2%, sobre o salário inteiro.
 *
 * **O que NÃO está aqui:** o mês do 13º e o das férias, que entram na mesma
 * guia com regras próprias, e o vale-transporte.
 */

import { calcularInss } from '../inss'
import { calcularIrrf } from '../irrf'
import { aplicarAliquota, somar, subtrair } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado } from '../traco'
import { ZERO, basisPoints, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { LC_150_ART_34 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

export const PARAMETROS_DAE = [
  'inss-tabela-progressiva',
  'domestico-contribuicao-patronal',
  'domestico-seguro-acidente',
  'fgts-aliquota-deposito',
  'domestico-indenizacao-compensatoria',
] as const

type Resolvido = { readonly valor: BasisPoints; readonly resolvida: VigenciaResolvida } | null

function percentualDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: basisPoints(r.resolvida.vigencia.valor.aliquotaBp), resolvida: r.resolvida }
}

export interface EntradaDae {
  readonly salario: Centavos
  readonly dependentes: number
}

export interface SaidaDae {
  readonly dae: Centavos
  readonly inssEmpregado: Centavos
  readonly irrf: Centavos
  readonly patronal: Centavos
  readonly seguroAcidente: Centavos
  readonly fgts: Centavos
  readonly indenizacao: Centavos
  /** Salário mais o que o empregador paga além dele. */
  readonly custoDoEmpregador: Centavos
  readonly liquidoDoEmpregado: Centavos
  readonly baseLimitadaPeloTeto: boolean
}

export function calcularDae(entrada: EntradaDae, dataReferencia: DataISO, registro: Registro): Resultado<SaidaDae> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário do empregado doméstico.' }
  }

  const patronalBp = percentualDe(registro, 'domestico-contribuicao-patronal', dataReferencia)
  const acidenteBp = percentualDe(registro, 'domestico-seguro-acidente', dataReferencia)
  const fgtsBp = percentualDe(registro, 'fgts-aliquota-deposito', dataReferencia)
  const indenizacaoBp = percentualDe(registro, 'domestico-indenizacao-compensatoria', dataReferencia)
  if (patronalBp === null || acidenteBp === null || fgtsBp === null || indenizacaoBp === null) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'O Simples Doméstico vale a partir de 01/10/2015 — não há parâmetros para a data informada.',
    }
  }

  const inss = calcularInss({ salarioContribuicao: entrada.salario }, dataReferencia, registro)
  if (!inss.ok) return inss
  const irrf = calcularIrrf(
    { rendimentoBruto: entrada.salario, inss: inss.valores.contribuicao, dependentes: entrada.dependentes, pensao: ZERO },
    dataReferencia,
    registro,
  )
  if (!irrf.ok) return irrf

  const base = inss.valores.baseAplicada
  const patronal = aplicarAliquota(base, patronalBp.valor, POLITICA)
  const seguroAcidente = aplicarAliquota(base, acidenteBp.valor, POLITICA)
  const fgts = aplicarAliquota(entrada.salario, fgtsBp.valor, POLITICA)
  const indenizacao = aplicarAliquota(entrada.salario, indenizacaoBp.valor, POLITICA)

  const doEmpregado = somar(inss.valores.contribuicao, irrf.valores.imposto)
  const doEmpregador = somar(patronal, seguroAcidente, fgts, indenizacao)
  const dae = somar(doEmpregado, doEmpregador)

  const etapas: Etapa[] = [
    ...inss.traco.etapas,
    ...irrf.traco.etapas,
    {
      rotulo: `Contribuição patronal — ${percentual(patronalBp.valor)}`,
      formula: `${reais(base)} × ${percentual(patronalBp.valor)}${inss.valores.limitadaPeloTeto ? ' (base limitada ao teto)' : ''}`,
      resultado: patronal,
      parametro: citar(patronalBp.resolvida),
      fundamento: fundamentar(LC_150_ART_34),
    },
    {
      rotulo: `Seguro contra acidentes — ${percentual(acidenteBp.valor)}`,
      formula: `${reais(base)} × ${percentual(acidenteBp.valor)}`,
      resultado: seguroAcidente,
      parametro: citar(acidenteBp.resolvida),
    },
    {
      rotulo: `FGTS — ${percentual(fgtsBp.valor)}`,
      formula: `${reais(entrada.salario)} × ${percentual(fgtsBp.valor)}`,
      resultado: fgts,
      parametro: citar(fgtsBp.resolvida),
      justificativa: 'Sobre a remuneração inteira — o FGTS não tem teto.',
    },
    {
      rotulo: `Indenização compensatória — ${percentual(indenizacaoBp.valor)}`,
      formula: `${reais(entrada.salario)} × ${percentual(indenizacaoBp.valor)}`,
      resultado: indenizacao,
      parametro: citar(indenizacaoBp.resolvida),
      justificativa: 'Uma reserva para a multa da dispensa sem justa causa — depositada todo mês, em vez de paga no fim.',
    },
    {
      rotulo: 'DAE do mês',
      formula: `${reais(doEmpregado)} descontados do empregado + ${reais(doEmpregador)} do empregador`,
      resultado: dae,
      fundamento: fundamentar(LC_150_ART_34),
    },
  ]

  const vigencias = new Set<string>([
    ...inss.traco.vigenciasAplicadas,
    ...irrf.traco.vigenciasAplicadas,
    patronalBp.resolvida.vigencia.id,
    acidenteBp.resolvida.vigencia.id,
    fgtsBp.resolvida.vigencia.id,
    indenizacaoBp.resolvida.vigencia.id,
  ])

  return {
    ok: true,
    valores: {
      dae,
      inssEmpregado: inss.valores.contribuicao,
      irrf: irrf.valores.imposto,
      patronal,
      seguroAcidente,
      fgts,
      indenizacao,
      custoDoEmpregador: somar(entrada.salario, doEmpregador),
      liquidoDoEmpregado: subtrair(entrada.salario, doEmpregado),
      baseLimitadaPeloTeto: inss.valores.limitadaPeloTeto,
    },
    traco: { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] },
  }
}
