/**
 * CALC-062 — Conversão de moeda com IOF, spread e tarifa.
 *
 * **A alíquota de IOF NÃO é parâmetro deste sistema, e a razão está registrada
 * em `ESTADO-DO-PROJETO` §7.33.** Em resumo: o texto consolidado do Decreto nº
 * 6.306/2007 no Planalto exibe, ao mesmo tempo, a redação do art. 15-B dada pelo
 * Decreto nº 12.499/2025 marcada como **sustada** pelo Decreto Legislativo nº
 * 176/2025, a redação anterior marcada como **restabelecida** pelo mesmo decreto
 * legislativo, e um **Vide ADC nº 96** — ação em curso no Supremo. A fonte
 * oficial não resolve qual texto vige, e `CLAUDE.md` regra 10 é clara sobre o
 * que fazer nessa situação: a afirmação não existe.
 *
 * A saída é a que `00-catalogo` §14 prescreve para dado que o produto não pode
 * fundamentar — *"onde o dado é indispensável, ele entra como campo preenchido
 * pelo usuário"*. É o mesmo caminho de CALC-011 com as alíquotas de terceiros e
 * de CALC-057 com o IPVA.
 *
 * O QUE A CALCULADORA EXISTE PARA MOSTRAR
 *
 * A **cotação efetiva**. Ninguém compra moeda pela cotação que vê no jornal: o
 * que sai da conta é a cotação mais o spread da casa de câmbio, mais o IOF,
 * mais a tarifa. A distância entre os dois números costuma passar de dez por
 * cento, e é ela que a página coloca em destaque.
 */

import { aplicarAliquota, proporcao, somar } from '../money'
import { percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

const POLITICA = 'meio_para_cima' as const

/** Formata centésimos como "1.234,56", só para compor `formula`. */
function numero(valor: Centavos): string {
  const abs = Math.abs(valor)
  const inteiro = Math.trunc(abs / CENTESIMOS_POR_UNIDADE)
  const frac = abs % CENTESIMOS_POR_UNIDADE
  const comSeparador = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${valor < 0 ? '−' : ''}${comSeparador},${String(frac).padStart(2, '0')}`
}

export interface EntradaCambio {
  /** Quanto se quer comprar, em centésimos da moeda estrangeira. */
  readonly valorEmMoeda: number
  /** Cotação em reais por unidade da moeda. */
  readonly cotacao: Centavos
  /** Spread da casa de câmbio, sobre a cotação. */
  readonly spreadBp: BasisPoints
  /** Alíquota de IOF da operação — informada, e não cadastrada. Ver o cabeçalho. */
  readonly iofBp: BasisPoints
  readonly tarifa: Centavos
}

export interface SaidaCambio {
  readonly valorPelaCotacao: Centavos
  readonly spread: Centavos
  readonly iof: Centavos
  readonly custoTotal: Centavos
  /** Quanto se pagou, de fato, por unidade da moeda. */
  readonly cotacaoEfetiva: Centavos
  /** Quanto a cotação efetiva ficou acima da nominal. */
  readonly acrescimoBp: BasisPoints
}

export function calcularCambio(
  entrada: EntradaCambio,
  dataReferencia: DataISO,
): Resultado<SaidaCambio> {
  if (entrada.valorEmMoeda <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quanto você quer comprar em moeda estrangeira.',
    }
  }
  if (entrada.cotacao <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a cotação da moeda para ver o resultado.',
    }
  }
  if (entrada.spreadBp < 0 || entrada.iofBp < 0 || entrada.tarifa < 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Spread, IOF e tarifa não podem ser negativos.',
    }
  }

  const etapas: Etapa[] = []

  /**
   * A conversão pela cotação nua.
   *
   * `valorEmMoeda` vem em centésimos e `cotacao` em centavos, então o produto
   * sai em centésimos de centavo — daí a divisão por cem. Inteiro do começo ao
   * fim, como manda `ADR-004`.
   */
  const valorPelaCotacao = proporcao(
    entrada.cotacao,
    entrada.valorEmMoeda,
    CENTESIMOS_POR_UNIDADE,
    POLITICA,
  )

  etapas.push({
    rotulo: 'Convertido pela cotação',
    formula: `${numero(centavos(entrada.valorEmMoeda))} × ${reais(entrada.cotacao)}`,
    resultado: valorPelaCotacao,
    justificativa:
      'Esta é a conta que quase ninguém paga. É a cotação de tela, sem o spread da casa de ' +
      'câmbio, sem imposto e sem tarifa.',
  })

  const spread = aplicarAliquota(valorPelaCotacao, entrada.spreadBp, POLITICA)
  if (spread > 0) {
    etapas.push({
      rotulo: 'Spread da casa de câmbio',
      formula: `${reais(valorPelaCotacao)} × ${percentual(entrada.spreadBp)}`,
      resultado: spread,
      justificativa:
        'A diferença entre a cotação de mercado e a que a casa de câmbio pratica. Ela costuma ' +
        'estar embutida na cotação oferecida, e não discriminada — compare a cotação que lhe ' +
        'ofereceram com a de referência para descobrir a sua.',
    })
  }

  const baseDoImposto = somar(valorPelaCotacao, spread)
  const iof = aplicarAliquota(baseDoImposto, entrada.iofBp, POLITICA)

  if (iof > 0) {
    etapas.push({
      rotulo: 'IOF sobre a operação',
      formula: `${reais(baseDoImposto)} × ${percentual(entrada.iofBp)}`,
      resultado: iof,
      justificativa:
        'A alíquota é a que VOCÊ informou, e não uma cadastrada aqui. O art. 15-B do Decreto ' +
        'nº 6.306/2007 está em disputa: o texto consolidado do Planalto exibe uma redação ' +
        'sustada por decreto legislativo, a anterior restabelecida pelo mesmo ato, e uma ação ' +
        'em curso no Supremo. Este produto não publica valor legal que não consegue fundamentar.',
    })
  }

  const custoTotal = somar(baseDoImposto, iof, entrada.tarifa)
  etapas.push({
    rotulo: 'Custo total em reais',
    formula: `${reais(baseDoImposto)} + ${reais(iof)} de IOF + ${reais(entrada.tarifa)} de tarifa`,
    resultado: custoTotal,
  })

  /**
   * A cotação efetiva: o total dividido pela quantidade de moeda.
   *
   * É o número que a página existe para mostrar. Ele responde "quanto eu paguei
   * por dólar", que é a pergunta que a cotação de tela não responde.
   */
  const cotacaoEfetiva = proporcao(
    custoTotal,
    CENTESIMOS_POR_UNIDADE,
    entrada.valorEmMoeda,
    POLITICA,
  )

  etapas.push({
    rotulo: 'Cotação que você pagou de fato',
    formula: `${reais(custoTotal)} ÷ ${numero(centavos(entrada.valorEmMoeda))} unidades`,
    resultado: cotacaoEfetiva,
  })

  const acrescimoBp =
    entrada.cotacao > 0
      ? (Math.round(
          ((cotacaoEfetiva - entrada.cotacao) * CENTESIMOS_POR_UNIDADE * CENTESIMOS_POR_UNIDADE) /
            entrada.cotacao,
        ) as BasisPoints)
      : (0 as BasisPoints)

  etapas.push({
    rotulo: 'Quanto isso é acima da cotação de tela',
    formula: `${reais(cotacaoEfetiva)} contra ${reais(entrada.cotacao)}`,
    resultado: centavos(acrescimoBp),
    unidade: 'percentual',
    justificativa:
      'É a distância entre o número que se vê anunciado e o que sai da conta. Compare esse ' +
      'percentual entre duas casas de câmbio: ele resume spread, imposto e tarifa num só ' +
      'número, e é o único que permite comparação honesta.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      valorPelaCotacao,
      spread,
      iof,
      custoTotal,
      cotacaoEfetiva,
      acrescimoBp,
    },
    traco,
  }
}
