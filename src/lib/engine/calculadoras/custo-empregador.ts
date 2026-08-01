/**
 * CALC-011 — Custo real do funcionário: encargos e provisões.
 *
 * **A única calculadora do catálogo escrita do lado do empregador**, e a que
 * mais perto passa de uma fronteira que `00-catalogo` §14 fechou em definitivo:
 * o tributário empresarial complexo.
 *
 * A fronteira é respeitada assim:
 *
 * - Entram apenas as alíquotas que estão **no corpo da Lei nº 8.212/1991** —
 *   patronal de 20% (art. 22, I) e RAT de 1, 2 ou 3% (art. 22, II) — mais o FGTS
 *   de 8%, que já era parâmetro do sistema.
 * - A alíquota de **terceiros** (Sistema S) varia por código FPAS e depende de
 *   tabela mantida por outro órgão. Ela é **campo preenchido pelo usuário**, que
 *   é o que o próprio §14 prescreve para dado indispensável e hiperlocal.
 * - Simples Nacional, desoneração da folha, FAP e substituição tributária ficam
 *   **fora**, declarados como fora.
 *
 * O QUE ELA CALCULA, E POR QUE É ISSO QUE IMPORTA
 *
 * O salário não é o custo. Sobre ele incidem encargos mensais, e além deles
 * correm **provisões**: o 13º e as férias com o terço são devidos ao longo do
 * ano, mês a mês, mesmo que só sejam pagos depois. Um doze avos de cada,
 * provisionado todo mês, é o que transforma "contratei por R$ 3.000" no número
 * verdadeiro.
 *
 * E os encargos incidem sobre as provisões também — inclusive sobre o terço
 * constitucional, por força do **Tema 985 do STF**, que virou o entendimento
 * anterior do STJ. É a decisão que mais mexeu no custo de folha na última
 * década, e a memória de cálculo a cita.
 */

import { aplicarAliquota, dividirPorInteiro, proporcao, somar } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CF_ART_7_XVII, LEI_4090_ART_1, STF_TEMA_985 } from '../../params/data/fontes'

/** `RN-007`: empate para cima. */
const POLITICA = 'meio_para_cima' as const

/** Avos de um ano. Unidade, não parâmetro legal. */
const AVOS_NO_ANO = 12

/** Meses de um ano, para o custo anual. Mesma unidade. */
const MESES_NO_ANO = 12

/** 100% em basis points (`ADR-004` A-2). Unidade, não parâmetro legal. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point, não parâmetro legal
const BP_INTEIRO = 10_000

export type GrauDeRisco = 'leve' | 'medio' | 'grave'

export interface EntradaCustoEmpregador {
  readonly salario: Centavos
  readonly grauDeRisco: GrauDeRisco
  /** Alíquota de terceiros (Sistema S). Zero quando não informada. */
  readonly terceiros: BasisPoints
  /** Benefícios sem natureza salarial: vale-transporte, plano de saúde. */
  readonly beneficios: Centavos
}

export interface SaidaCustoEmpregador {
  readonly patronal: Centavos
  readonly rat: Centavos
  readonly terceiros: Centavos
  readonly fgts: Centavos
  readonly provisaoDecimoTerceiro: Centavos
  readonly provisaoFerias: Centavos
  readonly encargosSobreProvisoes: Centavos
  readonly custoMensal: Centavos
  readonly custoAnual: Centavos
  /** Quanto o custo total supera o salário, em basis points. */
  readonly acrescimoBp: BasisPoints
  readonly aliquotaDeEncargosBp: BasisPoints
}

function taxaDe(registro: Registro, id: string, data: DataISO) {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { bp: basisPoints(r.resolvida.vigencia.valor.aliquotaBp), resolvida: r.resolvida }
}

export function calcularCustoEmpregador(
  entrada: EntradaCustoEmpregador,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaCustoEmpregador> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário para ver o resultado.' }
  }
  if (entrada.terceiros < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A alíquota de terceiros não pode ser negativa.' }
  }

  const idDoRat =
    entrada.grauDeRisco === 'grave'
      ? 'rat-risco-grave'
      : entrada.grauDeRisco === 'medio'
        ? 'rat-risco-medio'
        : 'rat-risco-leve'

  const patronal = taxaDe(registro, 'contribuicao-patronal', dataReferencia)
  const rat = taxaDe(registro, idDoRat, dataReferencia)
  const fgts = taxaDe(registro, 'fgts-aliquota-deposito', dataReferencia)

  if (!patronal || !rat || !fgts) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'Não há parâmetros de encargos para a data informada.',
    }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([
    patronal.resolvida.vigencia.id,
    rat.resolvida.vigencia.id,
    fgts.resolvida.vigencia.id,
  ])

  // -------------------------------------------------------------------------
  // 1. Encargos sobre o salário do mês
  // -------------------------------------------------------------------------
  const valorPatronal = aplicarAliquota(entrada.salario, patronal.bp, POLITICA)
  etapas.push({
    rotulo: 'Contribuição previdenciária patronal',
    formula: `${reais(entrada.salario)} × ${percentual(patronal.bp)}`,
    resultado: valorPatronal,
    parametro: citar(patronal.resolvida),
  })

  const valorRat = aplicarAliquota(entrada.salario, rat.bp, POLITICA)
  etapas.push({
    rotulo: `RAT — risco ${entrada.grauDeRisco}`,
    formula: `${reais(entrada.salario)} × ${percentual(rat.bp)}`,
    resultado: valorRat,
    parametro: citar(rat.resolvida),
    justificativa:
      'O grau de risco é o da atividade preponderante da empresa. O FAP pode multiplicar esta ' +
      'alíquota por fator entre 0,5 e 2,0 conforme o histórico de acidentes, o que esta conta ' +
      'não estima.',
  })

  const valorTerceiros = aplicarAliquota(entrada.salario, entrada.terceiros, POLITICA)
  if (entrada.terceiros > 0) {
    etapas.push({
      rotulo: 'Terceiros (Sistema S)',
      formula: `${reais(entrada.salario)} × ${percentual(entrada.terceiros)}`,
      resultado: valorTerceiros,
      justificativa:
        'Alíquota INFORMADA POR VOCÊ. Ela varia conforme o código FPAS da atividade e não é ' +
        'parâmetro deste sistema — consulte o enquadramento da empresa.',
    })
  }

  const valorFgts = aplicarAliquota(entrada.salario, fgts.bp, POLITICA)
  etapas.push({
    rotulo: 'FGTS',
    formula: `${reais(entrada.salario)} × ${percentual(fgts.bp)}`,
    resultado: valorFgts,
    parametro: citar(fgts.resolvida),
  })

  const encargosDoSalario = somar(valorPatronal, valorRat, valorTerceiros, valorFgts)
  const aliquotaDeEncargosBp = basisPoints(patronal.bp + rat.bp + entrada.terceiros + fgts.bp)

  // -------------------------------------------------------------------------
  // 2. Provisões — o que se deve mesmo sem pagar neste mês
  // -------------------------------------------------------------------------
  const provisaoDecimoTerceiro = dividirPorInteiro(entrada.salario, AVOS_NO_ANO, POLITICA)
  etapas.push({
    rotulo: 'Provisão de 13º salário',
    formula: `${reais(entrada.salario)} ÷ ${AVOS_NO_ANO} meses`,
    resultado: provisaoDecimoTerceiro,
    fundamento: fundamentar(LEI_4090_ART_1),
    justificativa:
      'O 13º é devido na proporção do tempo trabalhado. Provisionar um doze avos por mês é o ' +
      'que impede a conta de parecer barata em janeiro e cara em dezembro.',
  })

  /**
   * Férias com o terço: um doze avos do salário acrescido de um terço.
   *
   * `proporcao(salario, 4, 3 × 12)` e não duas operações encadeadas — a divisão
   * única preserva a fração até o arredondamento final, como em toda parte do
   * motor onde há avos.
   */
  const provisaoFerias = proporcao(entrada.salario, 4, 3 * AVOS_NO_ANO, POLITICA)
  etapas.push({
    rotulo: 'Provisão de férias + 1/3',
    formula: `${reais(entrada.salario)} × 4 ÷ ${3 * AVOS_NO_ANO} (um doze avos, acrescido de um terço)`,
    resultado: provisaoFerias,
    fundamento: fundamentar(CF_ART_7_XVII),
  })

  // -------------------------------------------------------------------------
  // 3. Encargos sobre as provisões — inclusive sobre o terço (Tema 985)
  // -------------------------------------------------------------------------
  const baseDasProvisoes = somar(provisaoDecimoTerceiro, provisaoFerias)
  const encargosSobreProvisoes = aplicarAliquota(baseDasProvisoes, aliquotaDeEncargosBp, POLITICA)

  etapas.push({
    rotulo: 'Encargos sobre as provisões',
    formula: `${reais(baseDasProvisoes)} × ${percentual(aliquotaDeEncargosBp)}`,
    resultado: encargosSobreProvisoes,
    fundamento: fundamentar(STF_TEMA_985),
    justificativa:
      'O 13º e as férias integram a base das contribuições, e o terço constitucional também — ' +
      'o STF firmou no Tema 985 que é legítima a incidência sobre ele, revertendo o ' +
      'entendimento anterior do STJ. A cobrança vale a partir de 15/09/2020.',
  })

  // -------------------------------------------------------------------------
  // 4. Totais
  // -------------------------------------------------------------------------
  const custoMensal = somar(
    entrada.salario,
    encargosDoSalario,
    provisaoDecimoTerceiro,
    provisaoFerias,
    encargosSobreProvisoes,
    entrada.beneficios,
  )

  if (entrada.beneficios > 0) {
    etapas.push({
      rotulo: 'Benefícios informados',
      formula: `Informado: ${reais(entrada.beneficios)}`,
      resultado: entrada.beneficios,
      justificativa:
        'Entram no custo pelo valor informado. Vale-transporte e plano de saúde, nas condições ' +
        'usuais, não integram o salário de contribuição — por isso não sofrem os encargos acima.',
    })
  }

  etapas.push({
    rotulo: 'Custo mensal total',
    formula:
      `${reais(entrada.salario)} (salário) + ${reais(encargosDoSalario)} (encargos) + ` +
      `${reais(baseDasProvisoes)} (provisões) + ${reais(encargosSobreProvisoes)} (encargos das provisões)` +
      (entrada.beneficios > 0 ? ` + ${reais(entrada.beneficios)} (benefícios)` : ''),
    resultado: custoMensal,
  })

  const custoAnual = proporcao(custoMensal, MESES_NO_ANO, 1, POLITICA)
  const acrescimoBp = basisPoints(
    Math.round(((custoMensal - entrada.salario) * BP_INTEIRO) / entrada.salario),
  )

  etapas.push({
    rotulo: 'Quanto o custo supera o salário',
    formula: `(${reais(custoMensal)} − ${reais(entrada.salario)}) ÷ ${reais(entrada.salario)}`,
    resultado: ZERO,
    justificativa: `Resultado: ${percentual(acrescimoBp)} acima do salário contratado.`,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }

  return {
    ok: true,
    valores: {
      patronal: valorPatronal,
      rat: valorRat,
      terceiros: valorTerceiros,
      fgts: valorFgts,
      provisaoDecimoTerceiro,
      provisaoFerias,
      encargosSobreProvisoes,
      custoMensal,
      custoAnual,
      acrescimoBp,
      aliquotaDeEncargosBp,
    },
    traco,
  }
}
