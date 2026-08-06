/**
 * CALC-021 — Imposto de renda sobre criptoativos.
 *
 * ## A regra que quase foi outra
 *
 * A **Medida Provisória nº 1.303/2025** acabaria com a isenção mensal e poria
 * alíquota única de 17,5% a partir de 01/01/2026. Ela **caducou em 08/10/2025**
 * sem conversão, e o texto consolidado da Lei nº 9.250/1995 marca as duas
 * remissões a ela — no inciso II e no parágrafo único do art. 22 — com
 * *"Vigência encerrada"*.
 *
 * É a armadilha de `ESTADO-DO-PROJETO` §7.61 no mesmo formato: um regime
 * inteiro, coerente e amplamente noticiado, que **nunca chegou a valer**. A
 * única diferença visível no texto é a marca entre parênteses.
 *
 * ## O que este motor faz, e a fronteira que ele declara
 *
 * Cobre criptoativo **custodiado ou negociado no Brasil**, cujas regras a
 * Receita declara não terem sido alteradas (resposta 653 do "Perguntas e
 * Respostas IRPF 2026"):
 *
 *   - isenção quando o **total alienado no mês** não passa do teto;
 *   - acima disso, ganho de capital pelas alíquotas progressivas do art. 21 da
 *     Lei nº 8.981/1995 — a mesma tabela de CALC-020, reaproveitada.
 *
 * **Fica de fora, e a tela diz:** criptoativo custodiado no exterior, que desde
 * 01/01/2024 segue os arts. 3º e 4º da Lei nº 14.754/2023 como aplicação
 * financeira no exterior, e para o qual *"não há previsão legal de isenção"*.
 * O motor pede o total vendido lá porque **ele conta para o teste do teto** —
 * mas não calcula o imposto daquele regime.
 *
 * ## Três coisas que o cálculo precisa acertar, e que quase toda planilha erra
 *
 * 1. **O teste é sobre o TOTAL VENDIDO, não sobre o ganho.** Quem vendeu
 *    R$ 200.000,00 com R$ 1.000,00 de lucro não é isento.
 * 2. **O teto é um DEGRAU, não uma dedução.** Ultrapassado, o ganho inteiro do
 *    mês é tributado — não apenas a parte acima do teto.
 * 3. **O conjunto soma todos os tipos** — Bitcoin, altcoins, stablecoins, NFTs
 *    —, e soma o que foi vendido no Brasil com o que foi vendido no exterior.
 */

import { naoNegativo, somarAliquotasPorFaixa, somar, subtrair } from '../money'
import { ConstrutorDeTraco, reais, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'

const POLITICA = 'meio_para_cima' as const

export const PARAMETROS_CRIPTO = [
  'ganho-capital-tabela',
  'ganho-capital-isencao-pequeno-valor',
] as const

export interface EntradaCripto {
  /** Total vendido no mês em instituições no Brasil. */
  readonly alienadoBrasil: Centavos
  /**
   * Total vendido no mês no exterior.
   *
   * Entra **apenas no teste do teto**, porque a Receita manda observar o
   * conjunto alienado "no Brasil ou no exterior". O imposto dessas vendas segue
   * a Lei nº 14.754/2023 e não é apurado aqui.
   */
  readonly alienadoExterior: Centavos
  /** Custo de aquisição do que foi vendido no Brasil. */
  readonly custoAquisicao: Centavos
}

export interface SaidaCripto {
  readonly imposto: Centavos
  readonly ganho: Centavos
  /** Soma que o teto observa — Brasil mais exterior. */
  readonly totalAlienadoNoMes: Centavos
  readonly tetoIsencao: Centavos
  readonly isento: boolean
  /** Quanto ainda cabe no mês sem perder a isenção. Zero quando já passou. */
  readonly folgaAteOTeto: Centavos
  readonly liquido: Centavos
  /** Verdadeiro quando houve venda no exterior — a tela alerta sobre o regime. */
  readonly temExterior: boolean
}

export function calcularCripto(
  entrada: EntradaCripto,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaCripto> {
  if (entrada.alienadoBrasil < 0 || entrada.alienadoExterior < 0 || entrada.custoAquisicao < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Valores não podem ser negativos.' }
  }

  const tabela = registro.resolver('ganho-capital-tabela', dataReferencia)
  const teto = registro.resolver('ganho-capital-isencao-pequeno-valor', dataReferencia)
  for (const r of [tabela, teto]) {
    if (!r.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: r.detalhe }
  }
  if (!tabela.ok || !teto.ok) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Parâmetro indisponível.' }
  }
  if (tabela.resolvida.vigencia.valor.tipo !== 'tabela_faixas') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Tabela sem faixas.' }
  }
  if (teto.resolvida.vigencia.valor.tipo !== 'valor_monetario') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Teto de isenção inválido.' }
  }

  const traco = new ConstrutorDeTraco(dataReferencia)
  const tetoIsencao = centavos(teto.resolvida.vigencia.valor.centavos)

  const totalAlienadoNoMes = somar(entrada.alienadoBrasil, entrada.alienadoExterior)
  traco.passo(
    'Total alienado no mês',
    entrada.alienadoExterior > 0
      ? `${reais(entrada.alienadoBrasil)} no Brasil + ${reais(entrada.alienadoExterior)} no exterior`
      : reais(entrada.alienadoBrasil),
    totalAlienadoNoMes,
  )

  // O ganho pode ser negativo — prejuízo. Ele não gera imposto, e este motor
  // não o compensa entre meses: a compensação de perdas em ganho de capital tem
  // regra própria, e inventá-la aqui seria pior que omiti-la.
  const ganhoBruto = subtrair(entrada.alienadoBrasil, entrada.custoAquisicao)
  const ganho = naoNegativo(ganhoBruto)
  traco.passo(
    'Ganho nas vendas no Brasil',
    `${reais(entrada.alienadoBrasil)} − ${reais(entrada.custoAquisicao)}`,
    ganhoBruto,
  )

  const isento = totalAlienadoNoMes <= tetoIsencao
  const folgaAteOTeto = isento ? subtrair(tetoIsencao, totalAlienadoNoMes) : ZERO

  traco.passoComParametro(
    isento ? 'Isento — o total do mês não passou do teto' : 'Tributado — o total do mês passou do teto',
    `${reais(totalAlienadoNoMes)} ${isento ? '≤' : '>'} ${reais(tetoIsencao)}`,
    isento ? ZERO : ganho,
    teto.resolvida,
    isento
      ? 'A isenção observa o TOTAL VENDIDO no mês, somados todos os tipos de criptoativo, no Brasil e no exterior — não o lucro.'
      : 'Ultrapassado o teto, o ganho de TODAS as alienações do mês é tributado — o teto é degrau, não dedução.',
  )

  if (isento || ganho === ZERO) {
    traco.passo('Imposto devido', isento ? 'isento' : 'sem ganho a tributar', ZERO)
    return {
      ok: true,
      valores: {
        imposto: ZERO,
        ganho: ganhoBruto,
        totalAlienadoNoMes,
        tetoIsencao,
        isento,
        folgaAteOTeto,
        liquido: ganhoBruto,
        temExterior: entrada.alienadoExterior > 0,
      },
      traco: traco.construir(),
    }
  }

  // --- A tabela progressiva, por parcela de faixa --------------------------
  // Mesma forma de CALC-020: a lei diz "sobre a parcela dos ganhos que…", então
  // cada alíquota alcança só o pedaço do ganho contido na sua faixa.
  const faixas = tabela.resolvida.vigencia.valor.faixas
  const parcelas = faixas
    .map((faixa) => {
      const piso = faixa.limiteInferiorCentavos
      const teto2 = faixa.limiteSuperiorCentavos ?? ganho
      const naFaixa = Math.min(ganho, teto2) - piso + (piso === 0 ? 0 : 1)
      return {
        base: centavos(Math.max(0, Math.min(naFaixa, ganho))),
        aliquota: basisPoints(faixa.aliquotaBp),
      }
    })
    .filter((p) => p.base > 0)

  const imposto = somarAliquotasPorFaixa(parcelas, POLITICA)
  traco.passoComParametro(
    'Imposto sobre o ganho',
    `${reais(ganho)} pelas faixas de 15% a 22,5%`,
    imposto,
    tabela.resolvida,
    'Cada alíquota incide só sobre a parcela do ganho contida na sua faixa. Aplicar a alíquota da faixa alcançada ao ganho inteiro cobraria muito a mais.',
  )

  const liquido = subtrair(ganho, imposto)
  traco.passo('Ganho depois do imposto', `${reais(ganho)} − ${reais(imposto)}`, liquido)

  return {
    ok: true,
    valores: {
      imposto,
      ganho: ganhoBruto,
      totalAlienadoNoMes,
      tetoIsencao,
      isento,
      folgaAteOTeto,
      liquido,
      temExterior: entrada.alienadoExterior > 0,
    },
    traco: traco.construir(),
  }
}
