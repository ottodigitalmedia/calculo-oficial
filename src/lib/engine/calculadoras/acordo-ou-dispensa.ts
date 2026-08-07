/**
 * CALC-076 — Acordo mútuo ou dispensa sem justa causa.
 *
 * A calculadora que `CALC-008` pedia por escrito. A última nota do resultado
 * dela diz, literalmente: *"Compare o total acima com o da dispensa sem justa
 * causa antes de assinar."* Isto é essa comparação, feita pelo site em vez de à
 * mão em duas abas.
 *
 * ## Por que ela não é um terceiro motor
 *
 * `calcularRescisao` já recebe `modalidade`. Comparar é chamá-lo duas vezes com
 * a mesma entrada e modalidades diferentes — e é isso que garante que os dois
 * lados usem as MESMAS incidências de INSS e IRRF, pesquisadas em
 * `docs/19-incidencias-verbas-rescisorias.md`. Um comparador com aritmética
 * própria teria dois lugares para a mesma regra, e eles divergiriam.
 *
 * ## A DIFERENÇA QUE DECIDE NÃO ESTÁ NA RESCISÃO
 *
 * As três reduções do acordo são visíveis e pequenas: aviso indenizado pela
 * metade, multa do FGTS pela metade, saque limitado a 80%. A quarta não aparece
 * em verba nenhuma — o § 2º do art. 484-A **veda o seguro-desemprego** —, e em
 * salário baixo com vínculo longo ela sozinha costuma valer mais que as outras
 * três somadas.
 *
 * Um comparador que somasse só as verbas rescisórias mostraria o acordo perdendo
 * pouco, e estaria errado pela omissão mais cara possível. Por isso o
 * seguro-desemprego entra na conta, e por isso este motor depende de três
 * motores e não de dois.
 *
 * ## O que "total" significa aqui, e o cuidado que ele exige
 *
 * Três correntes de dinheiro, somadas por caminho:
 *
 *   1. **rescisão líquida** — já traz a multa do FGTS como crédito e desconta
 *      INSS e IRRF;
 *   2. **FGTS liberado para saque** — fração do saldo de DEPÓSITOS, e por isso
 *      não recontabiliza a multa da corrente 1;
 *   3. **seguro-desemprego** — zero no acordo, por vedação legal.
 *
 * A corrente 2 não é dinheiro novo: é saldo que já era do trabalhador. O que
 * muda entre os caminhos é o **acesso** — e os 20% retidos no acordo não se
 * perdem, ficam na conta vinculada. A tela diz isso; sem essa ressalva o número
 * pareceria uma perda que não é.
 *
 * ## O que este motor NÃO decide
 *
 * Qual caminho "vale a pena". `RN-028` proíbe linguagem de direito, e aqui há
 * uma razão a mais: **o acordo depende de acordo.** Ele não é uma opção que o
 * trabalhador escolhe sozinho, e simular dispensa como acordo para liberar FGTS
 * é fraude contra o FGTS e contra o Programa do Seguro-Desemprego. O motor
 * entrega dois totais e a diferença; a leitura é de quem decide.
 */

import { diasEntre, lerData } from '../datas'
import { naoNegativo, somar, subtrair } from '../money'
import { reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type Centavos } from '../types'
import { calcularRescisao, type EntradaRescisao, type SaidaRescisao } from './rescisao'
import {
  calcularSeguroDesemprego,
  type SaidaSeguroDesemprego,
  type Solicitacao,
} from './seguro-desemprego'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'

/**
 * A janela do art. 3º da Lei nº 7.998/1990 conta meses **nos 36 anteriores**.
 *
 * Não é constante legal escondida: é o recorte da própria pergunta que o motor
 * do seguro-desemprego faz — o campo dele se chama "meses de vínculo nos 36
 * anteriores à dispensa". Informar 120 meses de um contrato longo responderia
 * outra pergunta.
 */
const MESES_DA_JANELA = 36

/** Dias médios num mês, para converter duração de contrato em meses. */
const DIAS_POR_MES = 30

export interface EntradaAcordoOuDispensa {
  readonly admissao: DataISO
  readonly desligamento: DataISO
  readonly salario: Centavos
  readonly avisoPrevio: 'indenizado' | 'trabalhado'
  readonly temFeriasVencidas: boolean
  readonly saldoFgtsInformado: Centavos
  readonly dependentes: number
  readonly solicitacaoSeguro: Solicitacao
}

/** O que cada caminho entrega, na mesma forma, para a tela não tratar dois casos. */
export interface Caminho {
  readonly rescisaoLiquida: Centavos
  readonly fgtsSacavel: Centavos
  readonly seguroDesemprego: Centavos
  readonly total: Centavos
  readonly detalhe: SaidaRescisao
}

export interface SaidaAcordoOuDispensa {
  readonly dispensa: Caminho
  readonly acordo: Caminho
  /** Sempre ≥ 0: a dispensa nunca entrega menos, e o motor não inventa o contrário. */
  readonly diferenca: Centavos
  /**
   * A parte da diferença que NÃO é o seguro-desemprego: as reduções no aviso e
   * na multa, mais o FGTS que fica retido.
   *
   * Existe porque a divisão entre as duas parcelas **inverte** conforme o
   * salário, e a tela não pode generalizar. O seguro-desemprego tem teto; as
   * reduções crescem com o salário. Medido em 07/08/2026, com cinco anos de
   * casa: no salário mínimo o seguro vale R$ 8.105,00 contra R$ 4.587,43 de
   * reduções; em R$ 8.000,00 ele vale R$ 12.593,25 contra R$ 22.640,00.
   */
  readonly reducaoNasVerbas: Centavos
  /** Nulo quando o vínculo não alcança o mínimo legal de meses. */
  readonly seguro: SaidaSeguroDesemprego | null
  /** Por que não há seguro-desemprego, quando não há. */
  readonly motivoSemSeguro: string | null
  readonly fgtsEstimado: boolean
  /** Quanto do FGTS fica retido no acordo — não se perde, fica na conta. */
  readonly fgtsRetidoNoAcordo: Centavos
}

export function calcularAcordoOuDispensa(
  entrada: EntradaAcordoOuDispensa,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaAcordoOuDispensa> {
  const base: Omit<EntradaRescisao, 'modalidade'> = {
    admissao: entrada.admissao,
    desligamento: entrada.desligamento,
    salario: entrada.salario,
    regime: 'clt',
    avisoPrevio: entrada.avisoPrevio,
    temFeriasVencidas: entrada.temFeriasVencidas,
    saldoFgtsInformado: entrada.saldoFgtsInformado,
    dependentes: entrada.dependentes,
  }

  const dispensa = calcularRescisao({ ...base, modalidade: 'sem-justa-causa' }, dataReferencia, registro)
  if (!dispensa.ok) return dispensa

  const acordo = calcularRescisao({ ...base, modalidade: 'acordo-mutuo' }, dataReferencia, registro)
  if (!acordo.ok) return acordo

  /**
   * O seguro-desemprego, e o único erro dele que NÃO se propaga.
   *
   * Vínculo curto demais devolve `entrada_invalida` — e isso não é falha da
   * comparação, é um resultado dela: quem não alcança o mínimo legal não perde
   * seguro nenhum ao aceitar o acordo, e a diferença entre os caminhos encolhe.
   * Propagar aqui bloquearia a tela justamente para quem mais precisa saber
   * disso.
   *
   * Qualquer outro motivo — cobertura de vigência ausente, sobretudo — continua
   * bloqueando, porque aí o número sairia errado em vez de ausente (`RN-003`).
   */
  const meses = mesesDeVinculo(entrada.admissao, entrada.desligamento)
  const seguroBruto = calcularSeguroDesemprego(
    {
      salarios: [entrada.salario, entrada.salario, entrada.salario],
      mesesTrabalhados: meses,
      solicitacao: entrada.solicitacaoSeguro,
    },
    dataReferencia,
    registro,
  )

  let seguro: SaidaSeguroDesemprego | null = null
  let motivoSemSeguro: string | null = null

  if (seguroBruto.ok) {
    seguro = seguroBruto.valores
  } else if (seguroBruto.motivo === 'entrada_invalida') {
    motivoSemSeguro = seguroBruto.detalhe
  } else {
    return seguroBruto
  }

  const totalSeguro = seguro ? seguro.total : ZERO

  const caminhoDispensa: Caminho = {
    rescisaoLiquida: dispensa.valores.totalLiquido,
    fgtsSacavel: dispensa.valores.saqueDisponivel,
    seguroDesemprego: totalSeguro,
    total: somar(dispensa.valores.totalLiquido, dispensa.valores.saqueDisponivel, totalSeguro),
    detalhe: dispensa.valores,
  }

  const caminhoAcordo: Caminho = {
    rescisaoLiquida: acordo.valores.totalLiquido,
    fgtsSacavel: acordo.valores.saqueDisponivel,
    // Art. 484-A, § 2º. Não é zero por arredondamento: é vedação.
    seguroDesemprego: ZERO,
    total: somar(acordo.valores.totalLiquido, acordo.valores.saqueDisponivel),
    detalhe: acordo.valores,
  }

  const diferenca = naoNegativo(subtrair(caminhoDispensa.total, caminhoAcordo.total))
  const reducaoNasVerbas = naoNegativo(subtrair(diferenca, totalSeguro))
  const fgtsRetidoNoAcordo = naoNegativo(
    subtrair(dispensa.valores.saqueDisponivel, acordo.valores.saqueDisponivel),
  )

  // -------------------------------------------------------------------------
  // A memória — as duas inteiras, rotuladas, e a comparação no fim
  // -------------------------------------------------------------------------

  /**
   * As duas rescisões produzem etapas de mesmo nome ("Saldo de salário" em
   * ambas). Sem o prefixo, a memória mostraria a mesma linha duas vezes com
   * valores diferentes e nada explicaria por quê — que é o oposto de auditável.
   */
  const prefixar = (etapas: readonly Etapa[], caminho: string): Etapa[] =>
    etapas.map((e) => ({ ...e, rotulo: `${caminho} · ${e.rotulo}` }))

  const etapas: Etapa[] = [
    ...prefixar(dispensa.traco.etapas, 'Dispensa'),
    ...prefixar(acordo.traco.etapas, 'Acordo'),
  ]

  if (seguro) {
    etapas.push({
      rotulo: 'Seguro-desemprego · total das parcelas',
      formula: `${seguro.numeroDeParcelas} parcelas de ${reais(seguro.parcela)}`,
      resultado: seguro.total,
      justificativa:
        'Só existe no caminho da dispensa. O art. 484-A, § 2º, da CLT veda o ingresso no ' +
        'Programa do Seguro-Desemprego a quem encerra o contrato por acordo.',
    })
  } else {
    etapas.push({
      rotulo: 'Seguro-desemprego · não alcançado',
      formula: `${meses} meses de vínculo apurados`,
      resultado: ZERO,
      justificativa:
        `${motivoSemSeguro ?? 'O vínculo não alcança o mínimo legal.'} Sem direito ao ` +
        'benefício em nenhum dos caminhos, a vedação do acordo deixa de pesar na comparação.',
    })
  }

  etapas.push({
    rotulo: 'Dispensa sem justa causa · total disponível',
    formula:
      `${reais(caminhoDispensa.rescisaoLiquida)} de rescisão + ` +
      `${reais(caminhoDispensa.fgtsSacavel)} de FGTS sacável + ` +
      `${reais(caminhoDispensa.seguroDesemprego)} de seguro-desemprego`,
    resultado: caminhoDispensa.total,
  })

  etapas.push({
    rotulo: 'Acordo mútuo · total disponível',
    formula:
      `${reais(caminhoAcordo.rescisaoLiquida)} de rescisão + ` +
      `${reais(caminhoAcordo.fgtsSacavel)} de FGTS sacável, sem seguro-desemprego`,
    resultado: caminhoAcordo.total,
  })

  etapas.push({
    rotulo: 'Diferença entre os caminhos',
    formula: `${reais(caminhoDispensa.total)} − ${reais(caminhoAcordo.total)}`,
    resultado: diferenca,
    justificativa:
      `Dela, ${reais(totalSeguro)} são o seguro-desemprego e ${reais(reducaoNasVerbas)} são as ` +
      'reduções nas verbas e no FGTS retido. Qual das duas pesa mais depende do salário: o ' +
      'benefício tem teto, e as reduções crescem sem ele. A comparação é de dinheiro ' +
      'disponível, e não de qual caminho convém — o acordo depende das duas partes.',
  })

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: [
      ...new Set([
        ...dispensa.traco.vigenciasAplicadas,
        ...acordo.traco.vigenciasAplicadas,
        ...(seguroBruto.ok ? seguroBruto.traco.vigenciasAplicadas : []),
      ]),
    ],
  }

  return {
    ok: true,
    valores: {
      dispensa: caminhoDispensa,
      acordo: caminhoAcordo,
      diferenca,
      reducaoNasVerbas,
      seguro,
      motivoSemSeguro,
      fgtsEstimado: dispensa.valores.fgtsEstimado,
      fgtsRetidoNoAcordo,
    },
    traco,
  }
}

/**
 * Meses de vínculo, limitados à janela que o motor do seguro-desemprego pergunta.
 *
 * Assume contrato ÚNICO e contínuo entre as duas datas, que é o caso da tela —
 * quem teve vínculos separados nos últimos três anos tem a calculadora de
 * seguro-desemprego, onde os meses são campo próprio. A tela declara isso.
 */
function mesesDeVinculo(admissao: DataISO, desligamento: DataISO): number {
  const inicio = lerData(admissao)
  const fim = lerData(desligamento)
  if (!inicio || !fim) return 0

  const dias = diasEntre(inicio, fim)
  if (dias <= 0) return 0

  return Math.min(Math.floor(dias / DIAS_POR_MES), MESES_DA_JANELA)
}

/** Zero tipado, para composição de entradas ausentes. */
export const SEM_VALOR: Centavos = ZERO
export { centavos }
