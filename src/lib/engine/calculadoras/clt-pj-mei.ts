/**
 * CALC-048 — Comparador CLT × PJ × MEI.
 *
 * A última do catálogo, e a que mais esperou. `ESTADO-DO-PROJETO` §7.49 a
 * bloqueou ao descobrir que a premissa universal desse tipo de comparador —
 * "dividendo é isento" — tinha deixado de valer; §10 registrou o que faltava
 * ler, e a leitura fechou em 07/08/2026.
 *
 * ## As quatro leituras que sustentam esta conta
 *
 * 1. **Anexos III e V do Simples**, com o fator R decidindo qual se aplica
 *    (LC nº 123/2006, art. 18, §§ 5º-J e 5º-K).
 * 2. **A alíquota EFETIVA**, que não é a nominal da faixa — a parcela a deduzir
 *    existe para que a nominal possa incidir sobre a receita inteira.
 * 3. **Art. 6º-A da Lei nº 9.250/1995**: dividendo acima do limite mensal sofre
 *    retenção sobre o TOTAL. Degrau, não rampa.
 * 4. **A janela fecha em 2026**, porque o art. 519 da LC nº 214/2025 substitui
 *    os anexos a partir de 2027.
 *
 * ## O que fica de fora, e a tela declara
 *
 * - **A tributação mínima do art. 16-A** — alcança quem soma mais de R$ 600 mil
 *   de rendimentos no ano, com alíquota que cresce até 10%, e o art. 16-B traz
 *   um redutor que depende da tributação efetiva dos lucros na PJ. Acima desse
 *   patamar o lado PJ desta conta fica **otimista**, e o resultado avisa.
 * - **Contabilidade, contribuição sindical, ISS fixo de sociedade uniprofissional
 *   e o custo de abrir e manter a empresa.** O honorário contábil entra como
 *   campo, porque quem compara já tem a proposta na mão.
 * - **Anexo IV**, cujo INSS patronal é pago por fora do DAS. As atividades dele
 *   (construção, advocacia, vigilância) seguem regra própria.
 *
 * ## Uma escolha de desenho que muda o resultado
 *
 * O lado CLT soma **FGTS e as provisões de 13º e de férias com o terço**. Sem
 * elas a comparação é desonesta com a CLT: são valores que o trabalhador
 * recebe, apenas não no mesmo mês. A memória mostra cada uma em separado, para
 * quem quiser comparar só o dinheiro que cai na conta.
 */

import { calcularInss } from '../inss'
import { calcularIrrf } from '../irrf'
import { calcularDasMei, calcularLimiteMei, type AtividadeDoMei } from './mei'
import {
  aplicarAliquota,
  dividirPorInteiro,
  multiplicarPorInteiro,
  naoNegativo,
  proporcao,
  somar,
  subtrair,
} from '../money'
import { ConstrutorDeTraco, percentual, reais, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

/** Meses do ano, para anualizar. Unidade, não parâmetro legal. */
const MESES = 12

/** Denominador do basis point (`ADR-004` A-2). Unidade. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point, não parâmetro legal
const BP_INTEIRO = 10_000

/** O terço constitucional das férias — CF, art. 7º, XVII. */
const DIVISOR_DO_TERCO = 3

export const PARAMETROS_CLT_PJ_MEI = [
  'inss-tabela-progressiva',
  'irrf-tabela-progressiva',
  'irrf-deducao-dependente',
  'irrf-desconto-simplificado',
  'fgts-aliquota-deposito',
  'simples-anexo-iii',
  'simples-anexo-v',
  'simples-fator-r-limite',
  'dividendos-retencao-limite-mensal',
  'dividendos-retencao-aliquota',
  'irpf-minima-limite-anual',
  'mei-inss-percentual',
  'mei-icms-valor-fixo',
  'mei-iss-valor-fixo',
  'mei-ibs-cbs-valor-fixo',
  'salario-minimo',
  'mei-limite-receita-anual',
  'mei-limite-mensal-inicio',
  'mei-tolerancia-excesso',
] as const

export type AnexoDoSimples = 'III' | 'V'

export interface EntradaComparador {
  /** Salário bruto mensal na proposta CLT. */
  readonly salarioClt: Centavos
  /** Faturamento mensal na proposta PJ. Também usado no cenário MEI. */
  readonly faturamento: Centavos
  /** Pró-labore mensal que o sócio retira. */
  readonly proLabore: Centavos
  /**
   * Folha mensal total da empresa, **incluído o pró-labore**.
   *
   * É o numerador do fator R. Campo do usuário porque o § 24 manda somar
   * remunerações, contribuição patronal e FGTS efetivamente recolhidos — e só
   * quem tem a folha na mão sabe o que entrou.
   */
  readonly folhaMensal: Centavos
  /** Honorário contábil e demais custos fixos mensais da PJ. */
  readonly custoContabil: Centavos
  readonly dependentes: number
  /** Qual tributo o MEI recolheria além do INSS. */
  readonly atividadeMei: AtividadeDoMei
}

export interface LadoDoComparador {
  readonly liquido: Centavos
  readonly descontos: Centavos
}

export interface SaidaComparador {
  /** Quanto sobra por mês em cada regime. */
  readonly clt: Centavos
  readonly pj: Centavos
  /** `null` quando o faturamento não cabe no MEI. */
  readonly mei: Centavos | null

  readonly cltLiquidoNaConta: Centavos
  readonly cltFgts: Centavos
  readonly cltProvisoes: Centavos
  readonly cltInss: Centavos
  readonly cltIrrf: Centavos

  readonly fatorRBp: BasisPoints
  readonly anexo: AnexoDoSimples
  readonly aliquotaEfetivaBp: BasisPoints
  readonly das: Centavos
  readonly inssProLabore: Centavos
  readonly irrfProLabore: Centavos
  readonly lucroDistribuido: Centavos
  readonly retencaoDividendos: Centavos
  readonly dasMei: Centavos
  readonly meiCabe: boolean

  /** Verdadeiro quando o ano projetado passa do alcance declarado da conta. */
  readonly acimaDaFronteira: boolean
}

function valorMonetario(r: VigenciaResolvida): Centavos {
  return r.vigencia.valor.tipo === 'valor_monetario' ? centavos(r.vigencia.valor.centavos) : ZERO
}

function percentualDe(r: VigenciaResolvida): BasisPoints {
  return r.vigencia.valor.tipo === 'percentual' ? basisPoints(r.vigencia.valor.aliquotaBp) : basisPoints(0)
}

/**
 * A alíquota EFETIVA do Simples, que é a que se paga.
 *
 * `efetiva = (RBT12 × nominal − parcela) ÷ RBT12`
 *
 * Aplicar a nominal direto sobre o faturamento é o erro mais comum das
 * planilhas de comparação, e ele sempre cobra a mais.
 */
function aliquotaEfetiva(rbt12: Centavos, tabela: VigenciaResolvida): BasisPoints | null {
  if (tabela.vigencia.valor.tipo !== 'tabela_faixas' || rbt12 <= 0) return null
  const faixas = tabela.vigencia.valor.faixas

  const faixa =
    faixas.find((f) => f.limiteSuperiorCentavos === null || rbt12 <= f.limiteSuperiorCentavos) ??
    faixas[faixas.length - 1]
  if (!faixa) return null

  const bruto = aplicarAliquota(rbt12, basisPoints(faixa.aliquotaBp), POLITICA)
  const aposDeducao = naoNegativo(subtrair(bruto, centavos(faixa.parcelaDeduzirCentavos ?? 0)))
  // De volta a basis points sobre a receita: (valor ÷ RBT12) × 10.000.
  return basisPoints(Math.round((aposDeducao * BP_INTEIRO) / rbt12))
}

export function calcularComparador(
  entrada: EntradaComparador,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaComparador> {
  const naoNegativos = [
    entrada.salarioClt,
    entrada.faturamento,
    entrada.proLabore,
    entrada.folhaMensal,
    entrada.custoContabil,
  ]
  if (naoNegativos.some((v) => v < 0)) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Valores não podem ser negativos.' }
  }
  if (!Number.isInteger(entrada.dependentes) || entrada.dependentes < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O número de dependentes deve ser inteiro e não negativo.',
    }
  }
  if (entrada.proLabore > entrada.faturamento) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O pró-labore não pode ser maior que o faturamento.',
    }
  }

  const fgtsAliquota = registro.resolver('fgts-aliquota-deposito', dataReferencia)
  const anexoIII = registro.resolver('simples-anexo-iii', dataReferencia)
  const anexoV = registro.resolver('simples-anexo-v', dataReferencia)
  const limiteFatorR = registro.resolver('simples-fator-r-limite', dataReferencia)
  const limiteDiv = registro.resolver('dividendos-retencao-limite-mensal', dataReferencia)
  const aliqDiv = registro.resolver('dividendos-retencao-aliquota', dataReferencia)

  for (const r of [fgtsAliquota, anexoIII, anexoV, limiteFatorR, limiteDiv, aliqDiv]) {
    if (!r.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: r.detalhe }
  }
  if (!fgtsAliquota.ok || !anexoIII.ok || !anexoV.ok || !limiteFatorR.ok || !limiteDiv.ok || !aliqDiv.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Parâmetro indisponível.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)

  // ---------------------------------------------------------------- CLT ----
  const inssClt = calcularInss({ salarioContribuicao: entrada.salarioClt }, dataReferencia, registro)
  if (!inssClt.ok) return inssClt
  const irrfClt = calcularIrrf(
    {
      rendimentoBruto: entrada.salarioClt,
      inss: inssClt.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: ZERO,
    },
    dataReferencia,
    registro,
  )
  if (!irrfClt.ok) return irrfClt

  const cltLiquidoNaConta = naoNegativo(
    subtrair(entrada.salarioClt, somar(inssClt.valores.contribuicao, irrfClt.valores.imposto)),
  )
  traco.passo(
    'CLT — líquido na conta',
    `${reais(entrada.salarioClt)} − ${reais(inssClt.valores.contribuicao)} de INSS − ${reais(irrfClt.valores.imposto)} de IR`,
    cltLiquidoNaConta,
  )

  const cltFgts = aplicarAliquota(entrada.salarioClt, percentualDe(fgtsAliquota.resolvida), POLITICA)
  traco.passoComParametro(
    'CLT — FGTS do mês',
    `${reais(entrada.salarioClt)} × ${percentual(percentualDe(fgtsAliquota.resolvida))}`,
    cltFgts,
    fgtsAliquota.resolvida,
    'Não sai do salário: é depósito do empregador em conta vinculada, e por isso soma no comparativo.',
  )

  // Um doze avos de 13º, mais um doze avos de férias com o terço.
  const provisao13 = dividirPorInteiro(entrada.salarioClt, MESES, POLITICA)
  const feriasComTerco = somar(
    entrada.salarioClt,
    proporcao(entrada.salarioClt, 1, DIVISOR_DO_TERCO, POLITICA),
  )
  const provisaoFerias = dividirPorInteiro(feriasComTerco, MESES, POLITICA)
  const cltProvisoes = somar(provisao13, provisaoFerias)
  traco.passo(
    'CLT — provisão de 13º e de férias',
    `${reais(provisao13)} + ${reais(provisaoFerias)} por mês`,
    cltProvisoes,
  )

  const clt = somar(cltLiquidoNaConta, cltFgts, cltProvisoes)
  traco.passo('CLT — total por mês', `${reais(cltLiquidoNaConta)} + ${reais(cltFgts)} + ${reais(cltProvisoes)}`, clt)

  // ----------------------------------------------------------------- PJ ----
  // O fator R usa doze meses de folha sobre doze de receita; com valores
  // mensais estáveis a razão é a mesma, e a tela declara a suposição.
  const fatorRBp =
    entrada.faturamento > 0
      ? basisPoints(Math.round((entrada.folhaMensal * BP_INTEIRO) / entrada.faturamento))
      : basisPoints(0)
  const limiar = percentualDe(limiteFatorR.resolvida)
  const anexo: AnexoDoSimples = fatorRBp >= limiar ? 'III' : 'V'

  traco.passoComParametro(
    `PJ — fator R de ${percentual(fatorRBp)} leva ao Anexo ${anexo}`,
    `${reais(entrada.folhaMensal)} de folha ÷ ${reais(entrada.faturamento)} de receita`,
    ZERO,
    limiteFatorR.resolvida,
    anexo === 'III'
      ? 'Igual ou acima do limiar, o serviço é tributado pelo Anexo III, que é bem mais barato.'
      : 'Abaixo do limiar, o serviço cai no Anexo V. Aumentar o pró-labore pode mudar o anexo — e o resultado.',
  )

  const rbt12 = multiplicarPorInteiro(entrada.faturamento, MESES)
  const tabela = anexo === 'III' ? anexoIII.resolvida : anexoV.resolvida
  const efetiva = aliquotaEfetiva(rbt12, tabela)
  if (efetiva === null) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Tabela do Simples sem faixas.' }
  }

  const das = aplicarAliquota(entrada.faturamento, efetiva, POLITICA)
  traco.passoComParametro(
    `PJ — DAS pela alíquota efetiva de ${percentual(efetiva)}`,
    `${reais(entrada.faturamento)} × ${percentual(efetiva)}`,
    das,
    tabela,
    'A alíquota da faixa não é a que se paga: a parcela a deduzir a reduz. Aplicar a nominal direto cobraria muito a mais.',
  )

  const inssPl = calcularInss({ salarioContribuicao: entrada.proLabore }, dataReferencia, registro)
  if (!inssPl.ok) return inssPl
  const irrfPl = calcularIrrf(
    {
      rendimentoBruto: entrada.proLabore,
      inss: inssPl.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: ZERO,
    },
    dataReferencia,
    registro,
  )
  if (!irrfPl.ok) return irrfPl

  if (entrada.proLabore > 0) {
    traco.passo(
      'PJ — INSS e IR sobre o pró-labore',
      `${reais(inssPl.valores.contribuicao)} + ${reais(irrfPl.valores.imposto)}`,
      somar(inssPl.valores.contribuicao, irrfPl.valores.imposto),
    )
  }

  // O que sobra depois do DAS, do pró-labore e do custo fixo é lucro.
  const lucroDistribuido = naoNegativo(
    subtrair(entrada.faturamento, somar(das, entrada.proLabore, entrada.custoContabil)),
  )

  const limiteDividendos = valorMonetario(limiteDiv.resolvida)
  const aliquotaDividendos = percentualDe(aliqDiv.resolvida)
  const retencaoDividendos =
    lucroDistribuido > limiteDividendos
      ? aplicarAliquota(lucroDistribuido, aliquotaDividendos, POLITICA)
      : ZERO

  traco.passoComParametro(
    retencaoDividendos > 0
      ? 'PJ — retenção sobre os dividendos'
      : 'PJ — dividendos sem retenção',
    retencaoDividendos > 0
      ? `${reais(lucroDistribuido)} × ${percentual(aliquotaDividendos)} — sobre o TOTAL, não sobre o excedente`
      : `${reais(lucroDistribuido)} ≤ ${reais(limiteDividendos)} no mês`,
    retencaoDividendos,
    limiteDiv.resolvida,
    retencaoDividendos > 0
      ? 'Passou do limite mensal, a alíquota incide sobre tudo. Um real a mais custa a retenção inteira.'
      : 'Até o limite mensal por sócio e por empresa, não há retenção.',
  )

  const pj = naoNegativo(
    subtrair(
      entrada.faturamento,
      somar(
        das,
        entrada.custoContabil,
        inssPl.valores.contribuicao,
        irrfPl.valores.imposto,
        retencaoDividendos,
      ),
    ),
  )
  traco.passo(
    'PJ — total por mês',
    `${reais(entrada.faturamento)} − ${reais(das)} de DAS − ${reais(entrada.custoContabil)} de custo fixo − impostos do pró-labore − retenção`,
    pj,
  )

  // ---------------------------------------------------------------- MEI ----
  // Reaproveita CALC-047 inteiro. Reescrever a conta do DAS aqui faria as duas
  // divergirem na primeira mudança do salário mínimo — é a razão de `rescisao.ts`
  // atender três modalidades com um motor só.
  const receitaAnual = multiplicarPorInteiro(entrada.faturamento, MESES)

  const limite = calcularLimiteMei(
    { faturamentoNoAno: receitaAnual, mesesDeAtividade: MESES },
    dataReferencia,
    registro,
  )
  if (!limite.ok) return limite

  let mei: Centavos | null = null
  let dasMei: Centavos = ZERO
  const meiCabe = limite.valores.situacao === 'dentro'

  if (meiCabe) {
    const das = calcularDasMei({ atividade: entrada.atividadeMei }, dataReferencia, registro)
    if (!das.ok) return das
    dasMei = das.valores.total
    mei = naoNegativo(subtrair(entrada.faturamento, dasMei))
    traco.passo(
      'MEI — total por mês',
      `${reais(entrada.faturamento)} − ${reais(dasMei)} de DAS`,
      mei,
    )
  } else {
    traco.passo(
      'MEI — não cabe',
      `${reais(receitaAnual)} por ano passa do limite de ${reais(limite.valores.limite)}`,
      ZERO,
    )
  }

  // ------------------------------------------------- a fronteira declarada --
  const limiteMinima = registro.resolver('irpf-minima-limite-anual', dataReferencia)
  if (!limiteMinima.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: limiteMinima.detalhe }
  }
  const acimaDaFronteira = receitaAnual > valorMonetario(limiteMinima.resolvida)
  if (acimaDaFronteira) {
    traco.passoComParametro(
      'Acima da fronteira desta conta',
      `${reais(receitaAnual)} por ano`,
      ZERO,
      limiteMinima.resolvida,
      'A tributação mínima do art. 16-A passa a incidir, e ela NÃO está calculada aqui. O lado PJ acima está otimista.',
    )
  }

  return {
    ok: true,
    valores: {
      clt,
      pj,
      mei,
      cltLiquidoNaConta,
      cltFgts,
      cltProvisoes,
      cltInss: inssClt.valores.contribuicao,
      cltIrrf: irrfClt.valores.imposto,
      fatorRBp,
      anexo,
      aliquotaEfetivaBp: efetiva,
      das,
      inssProLabore: inssPl.valores.contribuicao,
      irrfProLabore: irrfPl.valores.imposto,
      lucroDistribuido,
      retencaoDividendos,
      dasMei,
      meiCabe,
      acimaDaFronteira,
    },
    traco: traco.construir(),
  }
}
