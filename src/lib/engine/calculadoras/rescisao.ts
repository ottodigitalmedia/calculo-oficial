/**
 * CALC-002 — Rescisão por demissão sem justa causa.
 *
 * **A calculadora de maior busca do catálogo, e a de maior risco.** O risco não
 * está na aritmética — está em decidir, verba a verba, se incide contribuição
 * previdenciária, se incide imposto de renda e se entra na base do FGTS. É onde
 * as calculadoras concorrentes mais divergem entre si, e `CLAUDE.md` proíbe
 * copiar de qualquer uma delas.
 *
 * Cada decisão de incidência aqui vem de norma ou de tese vinculante, lida no
 * texto original. A pesquisa está transcrita em
 * `docs/19-incidencias-verbas-rescisorias.md`, e **toda etapa que decide
 * incidência cita o fundamento no traço** — a memória de cálculo mostra o link.
 *
 * Não reimplementa INSS nem IRRF: chama os motores de T-102, já conferidos
 * contra os exemplos oficiais da Receita.
 *
 * Regras: `RN-015` a `RN-023`.
 */

import {
  anosCompletos,
  avosPorQuinzena,
  compararDatas,
  escreverData,
  inicioPeriodoAquisitivo,
  lerData,
  somarDias,
  type DataCivil,
} from '../datas'
import { diasDeAvisoPrevio, type QuemAvisa } from './aviso-previo'
import { calcularInss } from '../inss'
import { calcularIrrf } from '../irrf'
import { aplicarAliquota, naoNegativo, proporcao, somar, subtrair } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import {
  CLT_ART_484A_SAQUE,
  CLT_ART_487,
  LEI_8036_ART_18,
  LEI_8212_ART_28,
  RIR_ART_35,
  RPS_ART_216,
  STJ_SUMULA_386,
  STJ_TEMA_478,
  TST_OJ_SDI1_42,
  TST_SUMULA_305,
} from '../../params/data/fontes'

/** `RN-007`: empate para cima, como no restante do motor. */
const POLITICA = 'meio_para_cima' as const

/**
 * Divisor do salário-dia — **CLT, art. 64**: o salário-hora do mensalista sai
 * "dividindo-se o salário mensal [...] por 30 (trinta) vezes o número de horas".
 * O 30 é da norma, não convenção de mercado.
 */
const DIAS_DO_MES_COMERCIAL = 30

/** Avos de um ano. Unidade, não parâmetro legal. */
const AVOS_NO_ANO = 12

/** 100% em basis points (`ADR-004` A-2). Unidade, não parâmetro legal. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point, não parâmetro legal
const BP_INTEIRO = 10_000

/**
 * Quem rompeu o contrato. Muda três coisas, e só três — por isso os dois casos
 * dividem o mesmo motor em vez de existirem duas implementações que divergem
 * na primeira manutenção.
 *
 *   sem-justa-causa   aviso indenizado é RECEBIDO e projeta o tempo de serviço
 *   pedido-demissao   aviso não cumprido é DESCONTADO e não projeta; não há
 *                     multa de FGTS
 *   acordo-mutuo      aviso indenizado e multa de FGTS pela METADE (CLT art.
 *                     484-A, I); demais verbas integrais (II); saque limitado a
 *                     80% (§ 1º) e sem seguro-desemprego (§ 2º)
 *
 * A terceira entrou em CALC-008. Ela é a prova de que dividir o motor foi a
 * decisão certa: o acordo muda DUAS frações e um limite de saque — e nada mais.
 * Uma implementação separada teria copiado as incidências de `docs/19`, que são
 * a parte cara e a que não pode divergir.
 */
export type Modalidade = 'sem-justa-causa' | 'pedido-demissao' | 'acordo-mutuo'

/**
 * `indenizado` e `trabalhado` valem para a dispensa; `cumprido` e
 * `nao-cumprido`, para o pedido de demissão. A combinação inválida não é
 * possível na tela, e o motor trata qualquer valor inesperado como o caso mais
 * conservador — sem verba e sem desconto.
 */
export type ModalidadeAviso = 'indenizado' | 'trabalhado' | 'cumprido' | 'nao-cumprido'

export interface EntradaRescisao {
  readonly admissao: DataISO
  readonly desligamento: DataISO
  readonly salario: Centavos
  readonly modalidade: Modalidade
  readonly avisoPrevio: ModalidadeAviso
  readonly temFeriasVencidas: boolean
  /** Saldo real da conta vinculada. Zero significa "estimar" (`RN-023`). */
  readonly saldoFgtsInformado: Centavos
  readonly dependentes: number
}

export interface SaidaRescisao {
  readonly totalLiquido: Centavos
  readonly saldoSalario: Centavos
  readonly avisoPrevioValor: Centavos
  /** `RN-018` — desconto do aviso não cumprido pelo empregado. Nunca negativo. */
  readonly descontoAvisoPrevio: Centavos
  readonly decimoTerceiro: Centavos
  readonly feriasVencidas: Centavos
  readonly feriasProporcionais: Centavos
  readonly multaFgts: Centavos
  readonly inss: Centavos
  readonly irrf: Centavos
  readonly totalBruto: Centavos
  readonly diasAviso: number
  readonly dataProjetada: DataISO
  /** Verdadeiro quando o saldo do FGTS foi estimado, não informado. */
  readonly fgtsEstimado: boolean
  readonly baseFgts: Centavos
  /** Fração do aviso indenizado de fato devida. 10.000 bp fora do acordo. */
  readonly fracaoAvisoBp: BasisPoints
  /** Percentual da multa aplicado, conforme a modalidade. */
  readonly multaBp: BasisPoints
  /** Quanto da conta vinculada pode ser movimentado. */
  readonly saqueDisponivel: Centavos
  readonly limiteSaqueBp: BasisPoints
}

function inteiro(registro: Registro, id: string, data: DataISO): number | null {
  const r = registro.resolver(id, data)
  if (!r.ok) return null
  return r.resolvida.vigencia.valor.tipo === 'inteiro' ? r.resolvida.vigencia.valor.valor : null
}

export function calcularRescisao(
  entrada: EntradaRescisao,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaRescisao> {
  // -------------------------------------------------------------------------
  // Entrada
  // -------------------------------------------------------------------------
  const admissao = lerData(entrada.admissao)
  const desligamento = lerData(entrada.desligamento)

  if (!admissao || !desligamento) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe as duas datas para ver o resultado.' }
  }
  if (compararDatas(admissao, desligamento) > 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A data de admissão é posterior à do desligamento.' }
  }
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o último salário bruto para ver o resultado.' }
  }

  const base = inteiro(registro, 'aviso-previo-dias-base', dataReferencia)
  const porAno = inteiro(registro, 'aviso-previo-dias-por-ano', dataReferencia)
  const maximo = inteiro(registro, 'aviso-previo-dias-maximo', dataReferencia)
  const aliquotaFgts = registro.resolver('fgts-aliquota-deposito', dataReferencia)
  /**
   * Qual multa, decidido pela modalidade — e não uma constante com desconto
   * aplicado depois. O art. 484-A, I, "b" diz "por metade", mas quem guarda o
   * valor dessa metade é `lib/params/`, com vigência e fonte próprias. Calcular
   * 40% ÷ 2 aqui dentro seria constante legal fora de `params` por outra porta.
   */
  const idDaMulta =
    entrada.modalidade === 'acordo-mutuo'
      ? 'fgts-multa-acordo-mutuo'
      : 'fgts-multa-sem-justa-causa'
  const multaFgts = registro.resolver(idDaMulta, dataReferencia)

  if (base === null || porAno === null || maximo === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há parâmetros de aviso prévio para a data informada.' }
  }
  if (!aliquotaFgts.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: aliquotaFgts.detalhe }
  if (!multaFgts.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: multaFgts.detalhe }
  if (
    aliquotaFgts.resolvida.vigencia.valor.tipo !== 'percentual' ||
    multaFgts.resolvida.vigencia.valor.tipo !== 'percentual'
  ) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os parâmetros de FGTS não são percentuais.' }
  }

  const traco = new (class {
    readonly etapas: Etapa[] = []
    readonly vigencias = new Set<string>()
  })()

  const registrar = (e: Etapa) => {
    traco.etapas.push(e)
  }

  // -------------------------------------------------------------------------
  // 1. Tempo de serviço e aviso prévio — Lei nº 12.506/2011
  // -------------------------------------------------------------------------
  const anos = anosCompletos(admissao, desligamento)

  /**
   * O acréscimo proporcional vale para o aviso **concedido ao empregado**.
   *
   * A Lei nº 12.506/2011, art. 1º, diz que o aviso "será concedido na proporção
   * de 30 dias AOS EMPREGADOS que contem até 1 ano", e o parágrafo único
   * acrescenta 3 dias por ano a esse aviso. No pedido de demissão quem deve o
   * aviso é o trabalhador, e o prazo que a CLT lhe impõe é o do art. 487, II —
   * trinta dias. Aplicar o acréscimo contra ele inverteria o sentido da lei.
   *
   * A leitura está declarada na memória, não escondida no código.
   */
  const quemAvisa: QuemAvisa =
    entrada.modalidade === 'pedido-demissao' ? 'empregado' : 'empregador'
  const proporcional = quemAvisa === 'empregador'
  const diasAviso = diasDeAvisoPrevio(anos, base, porAno, maximo, quemAvisa)

  const resolvidaBase = registro.resolver('aviso-previo-dias-base', dataReferencia)
  if (resolvidaBase.ok) traco.vigencias.add(resolvidaBase.resolvida.vigencia.id)

  registrar({
    rotulo: 'Tempo de serviço',
    formula: `De ${escreverData(admissao)} a ${escreverData(desligamento)} — ${anos} ano(s) completo(s)`,
    resultado: ZERO,
  })

  registrar({
    rotulo: 'Dias de aviso prévio',
    formula: proporcional
      ? `${base} dias + ${porAno} × ${anos} ano(s) = ${diasAviso} dias (limite de ${maximo})`
      : `${base} dias — CLT, art. 487, II`,
    resultado: ZERO,
    ...(resolvidaBase.ok
      ? {
          parametro: {
            parametroId: 'aviso-previo-dias-base',
            nome: resolvidaBase.resolvida.parametro.nome,
            vigenciaInicio: resolvidaBase.resolvida.vigencia.inicio,
            vigenciaFim: resolvidaBase.resolvida.vigencia.fim,
            norma: resolvidaBase.resolvida.fonte.norma,
            ...(resolvidaBase.resolvida.fonte.dispositivo === undefined
              ? {}
              : { dispositivo: resolvidaBase.resolvida.fonte.dispositivo }),
            url: resolvidaBase.resolvida.fonte.url,
          },
        }
      : {}),
    justificativa: proporcional
      ? 'A lei fixa 30 dias e acrescenta 3 por ano de serviço, até 90. Ela não diz a partir ' +
        'de qual ano o acréscimo começa; adotamos o primeiro ano completo, conforme ' +
        'entendimento consolidado da Justiça do Trabalho.'
      : 'O acréscimo de 3 dias por ano é concedido AO EMPREGADO. No pedido de demissão o ' +
        'aviso é devido POR ele, e o prazo é o de 30 dias do art. 487, II, da CLT.',
  })

  // `RN-019` — a projeção do aviso indenizado integra o tempo de serviço.
  const avisoIndenizado =
    entrada.modalidade !== 'pedido-demissao' && entrada.avisoPrevio === 'indenizado'
  const avisoNaoCumprido =
    entrada.modalidade === 'pedido-demissao' && entrada.avisoPrevio === 'nao-cumprido'

  const projetada: DataCivil = avisoIndenizado ? somarDias(desligamento, diasAviso) : desligamento

  if (avisoIndenizado) {
    registrar({
      rotulo: 'Projeção do aviso prévio indenizado',
      formula: `${escreverData(desligamento)} + ${diasAviso} dias = ${escreverData(projetada)}`,
      resultado: ZERO,
      fundamento: fundamentar(CLT_ART_487),
      justificativa:
        'O período do aviso indenizado integra o tempo de serviço para todos os efeitos, ' +
        'e por isso conta avos de 13º e de férias.',
    })
  }

  // -------------------------------------------------------------------------
  // 2. Verbas
  // -------------------------------------------------------------------------
  const saldoSalario = proporcao(entrada.salario, desligamento.dia, DIAS_DO_MES_COMERCIAL, POLITICA)
  registrar({
    rotulo: 'Saldo de salário',
    formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${desligamento.dia} dia(s) trabalhado(s)`,
    resultado: saldoSalario,
  })

  const valorCheioDoAviso = proporcao(
    entrada.salario,
    diasAviso,
    DIAS_DO_MES_COMERCIAL,
    POLITICA,
  )

  /**
   * `CLT` art. 484-A, I, "a" — na extinção por acordo, "por metade: o aviso
   * prévio, **se indenizado**".
   *
   * O que a norma reduz é a VERBA, não o PRAZO. Os dias continuam sendo os da
   * Lei nº 12.506/2011, e é por isso que a projeção adiante usa `diasAviso`
   * cheio: o art. 487, § 1º integra ao tempo de serviço "o período do aviso
   * prévio", e o período não foi encurtado.
   *
   * É o ponto em que rescisões por acordo mais divergem entre si na prática, e
   * por isso a leitura está declarada na memória de cálculo — com o link para
   * o dispositivo — em vez de escondida aqui.
   */
  const fracaoDoAviso = registro.resolver('aviso-previo-fracao-acordo', dataReferencia)
  const avisoPelaMetade =
    entrada.modalidade === 'acordo-mutuo' &&
    fracaoDoAviso.ok &&
    fracaoDoAviso.resolvida.vigencia.valor.tipo === 'percentual'

  const fracaoAvisoBp = basisPoints(
    avisoPelaMetade && fracaoDoAviso.ok && fracaoDoAviso.resolvida.vigencia.valor.tipo === 'percentual'
      ? fracaoDoAviso.resolvida.vigencia.valor.aliquotaBp
      : BP_INTEIRO,
  )

  const valorDoAviso = avisoPelaMetade
    ? aplicarAliquota(valorCheioDoAviso, fracaoAvisoBp, POLITICA)
    : valorCheioDoAviso

  const avisoPrevioValor = avisoIndenizado ? valorDoAviso : ZERO
  // `RN-018` — guardado POSITIVO; quem lhe dá sinal é a apresentação.
  const descontoAvisoPrevio = avisoNaoCumprido ? valorDoAviso : ZERO

  if (avisoIndenizado && avisoPelaMetade && fracaoDoAviso.ok) {
    traco.vigencias.add(fracaoDoAviso.resolvida.vigencia.id)
    registrar({
      rotulo: 'Aviso prévio indenizado — cheio',
      formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${diasAviso} dias`,
      resultado: valorCheioDoAviso,
    })
    registrar({
      rotulo: 'Aviso prévio indenizado — devido no acordo',
      formula: `${reais(valorCheioDoAviso)} × 50,00%`,
      resultado: avisoPrevioValor,
      parametro: citar(fracaoDoAviso.resolvida),
      justificativa:
        'A norma reduz a VERBA, não o PRAZO: os dias continuam sendo os da Lei nº ' +
        '12.506/2011, e é o período inteiro que integra o tempo de serviço pelo art. 487, ' +
        '§ 1º. É o ponto em que rescisões por acordo mais divergem entre si na prática.',
    })
  } else if (avisoIndenizado) {
    registrar({
      rotulo: 'Aviso prévio indenizado',
      formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${diasAviso} dias`,
      resultado: avisoPrevioValor,
    })
  } else if (avisoNaoCumprido) {
    registrar({
      rotulo: 'Desconto de aviso prévio não cumprido',
      formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${diasAviso} dias`,
      resultado: descontoAvisoPrevio,
      fundamento: fundamentar(CLT_ART_487),
      justificativa:
        'A falta de aviso prévio por parte do empregado dá ao empregador o direito de ' +
        'descontar os salários correspondentes ao prazo respectivo.',
    })
  } else {
    registrar({
      rotulo: 'Aviso prévio trabalhado',
      formula: 'Pago como salário durante o período trabalhado',
      resultado: ZERO,
      justificativa:
        'O aviso trabalhado não é verba separada da rescisão: é salário do período, ' +
        'já recebido mês a mês.',
    })
  }

  // --- 13º proporcional (Lei nº 4.090/1962) ---
  const inicio13: DataCivil =
    admissao.ano === projetada.ano ? admissao : { ano: projetada.ano, mes: 1, dia: 1 }
  const avos13 = avosPorQuinzena(inicio13, projetada, AVOS_NO_ANO)
  const decimoTerceiro = proporcao(entrada.salario, avos13, AVOS_NO_ANO, POLITICA)

  registrar({
    rotulo: '13º salário proporcional',
    formula: `${reais(entrada.salario)} × ${avos13}/12 avos`,
    resultado: decimoTerceiro,
    justificativa: 'Conta como avo integral o mês com 15 dias ou mais de contrato.',
  })

  // --- Férias vencidas + terço (CLT art. 146) ---
  const feriasVencidasBase = entrada.temFeriasVencidas ? entrada.salario : ZERO
  const tercoVencidas = proporcao(feriasVencidasBase, 1, 3, POLITICA)
  const feriasVencidas = somar(feriasVencidasBase, tercoVencidas)

  if (entrada.temFeriasVencidas) {
    registrar({
      rotulo: 'Férias vencidas + 1/3',
      formula: `${reais(feriasVencidasBase)} + ${reais(tercoVencidas)} (terço constitucional)`,
      resultado: feriasVencidas,
    })
  }

  // --- Férias proporcionais + terço ---
  const inicioAquisitivo = inicioPeriodoAquisitivo(admissao, projetada)
  const avosFerias = avosPorQuinzena(inicioAquisitivo, projetada, AVOS_NO_ANO)
  const feriasProporcionaisBase = proporcao(entrada.salario, avosFerias, AVOS_NO_ANO, POLITICA)
  const tercoProporcionais = proporcao(feriasProporcionaisBase, 1, 3, POLITICA)
  const feriasProporcionais = somar(feriasProporcionaisBase, tercoProporcionais)

  registrar({
    rotulo: 'Férias proporcionais + 1/3',
    formula:
      `${reais(entrada.salario)} × ${avosFerias}/12 avos = ${reais(feriasProporcionaisBase)}` +
      ` + ${reais(tercoProporcionais)} (terço)`,
    resultado: feriasProporcionais,
    justificativa: `Período aquisitivo em curso desde ${escreverData(inicioAquisitivo)}.`,
  })

  // -------------------------------------------------------------------------
  // 3. FGTS — Lei nº 8.036/1990
  // -------------------------------------------------------------------------
  const aliquotaDeposito = basisPoints(aliquotaFgts.resolvida.vigencia.valor.aliquotaBp)
  const aliquotaMulta = basisPoints(multaFgts.resolvida.vigencia.valor.aliquotaBp)
  traco.vigencias.add(aliquotaFgts.resolvida.vigencia.id)
  traco.vigencias.add(multaFgts.resolvida.vigencia.id)

  const fgtsEstimado = entrada.saldoFgtsInformado <= 0

  let baseFgts: Centavos
  if (fgtsEstimado) {
    // `RN-023` — estimativa declarada, nunca apresentada como saldo real. Conta
    // 13 remunerações por ano (12 meses + gratificação natalina), porque o
    // art. 15 inclui a Gratificação de Natal na base.
    const mesesDeContrato =
      (desligamento.ano - admissao.ano) * AVOS_NO_ANO + (desligamento.mes - admissao.mes)
    const remuneracaoTotal = proporcao(
      entrada.salario,
      Math.max(0, mesesDeContrato) * (AVOS_NO_ANO + 1),
      AVOS_NO_ANO,
      POLITICA,
    )
    baseFgts = aplicarAliquota(remuneracaoTotal, aliquotaDeposito, POLITICA)

    registrar({
      rotulo: 'Depósitos de FGTS — estimativa',
      formula: `${Math.max(0, mesesDeContrato)} meses × ${reais(entrada.salario)} (+ 13º) × 8,00%`,
      resultado: baseFgts,
      parametro: {
        parametroId: 'fgts-aliquota-deposito',
        nome: aliquotaFgts.resolvida.parametro.nome,
        vigenciaInicio: aliquotaFgts.resolvida.vigencia.inicio,
        vigenciaFim: aliquotaFgts.resolvida.vigencia.fim,
        norma: aliquotaFgts.resolvida.fonte.norma,
        ...(aliquotaFgts.resolvida.fonte.dispositivo === undefined
          ? {}
          : { dispositivo: aliquotaFgts.resolvida.fonte.dispositivo }),
        url: aliquotaFgts.resolvida.fonte.url,
      },
      justificativa:
        'ESTIMATIVA. O saldo real inclui correção monetária e juros e só consta do extrato ' +
        'da conta vinculada. Informe o saldo para um resultado exato.',
    })
  } else {
    baseFgts = entrada.saldoFgtsInformado
    registrar({
      rotulo: 'Saldo do FGTS informado',
      formula: `Informado pelo usuário: ${reais(baseFgts)}`,
      resultado: baseFgts,
    })
  }

  /**
   * `RN-018` — no pedido de demissão não há multa.
   *
   * O bloco não é exibido **nem zerado**: multa de R$ 0,00 ao lado das demais
   * verbas lê-se como defeito de cálculo, não como ausência de direito
   * (`03-functional-spec` §3.3). A nota fixa explica a ausência.
   */
  const temMulta = entrada.modalidade !== 'pedido-demissao'
  const multa = temMulta ? aplicarAliquota(baseFgts, aliquotaMulta, POLITICA) : ZERO

  if (!temMulta) {
    registrar({
      rotulo: 'Sem multa de FGTS',
      formula: 'A multa de 40% é devida na despedida pelo empregador sem justa causa',
      resultado: ZERO,
      fundamento: fundamentar(LEI_8036_ART_18),
      justificativa:
        'No pedido de demissão não há multa de FGTS nem direito ao saque, salvo nas ' +
        'hipóteses previstas em lei.',
    })
  }

  if (temMulta) registrar({
    rotulo:
      entrada.modalidade === 'acordo-mutuo'
        ? 'Multa do FGTS — metade, por ser acordo'
        : 'Multa rescisória do FGTS',
    // O percentual sai do parâmetro RESOLVIDO. Escrito à mão, "40,00%" apareceria
    // ao lado de uma multa de 20% assim que a modalidade de acordo entrasse — a
    // fórmula contradizendo o próprio resultado, na memória de cálculo.
    formula: `${reais(baseFgts)} × ${percentual(aliquotaMulta)}`,
    resultado: multa,
    parametro: {
      parametroId: idDaMulta,
      nome: multaFgts.resolvida.parametro.nome,
      vigenciaInicio: multaFgts.resolvida.vigencia.inicio,
      vigenciaFim: multaFgts.resolvida.vigencia.fim,
      norma: multaFgts.resolvida.fonte.norma,
      ...(multaFgts.resolvida.fonte.dispositivo === undefined
        ? {}
        : { dispositivo: multaFgts.resolvida.fonte.dispositivo }),
      url: multaFgts.resolvida.fonte.url,
    },
  })

  /**
   * `CLT` art. 484-A, § 1º e § 2º — o que o acordo permite e o que ele impede.
   *
   * O § 1º limita a movimentação da conta a 80% dos depósitos; os 20% restantes
   * NÃO se perdem, ficam na conta vinculada. E o § 2º veda o seguro-desemprego,
   * que não produz número nenhum e é a informação que mais muda a decisão de
   * quem está avaliando a proposta de acordo — por isso é etapa da memória, com
   * link para o dispositivo, e não linha de rodapé.
   */
  let saqueDisponivel: Centavos = temMulta ? baseFgts : ZERO
  let limiteSaqueBp = basisPoints(BP_INTEIRO)

  if (entrada.modalidade === 'acordo-mutuo') {
    const limite = registro.resolver('fgts-saque-acordo-mutuo', dataReferencia)
    if (limite.ok && limite.resolvida.vigencia.valor.tipo === 'percentual') {
      limiteSaqueBp = basisPoints(limite.resolvida.vigencia.valor.aliquotaBp)
      saqueDisponivel = aplicarAliquota(baseFgts, limiteSaqueBp, POLITICA)
      traco.vigencias.add(limite.resolvida.vigencia.id)

      registrar({
        rotulo: 'Quanto do FGTS pode ser sacado',
        formula: `${reais(baseFgts)} × ${percentual(limiteSaqueBp)} dos depósitos`,
        resultado: saqueDisponivel,
        parametro: citar(limite.resolvida),
        justificativa:
          'Os 20% restantes não se perdem: continuam na conta vinculada e podem ser sacados ' +
          'nas hipóteses gerais da Lei nº 8.036/1990.',
      })
    }

    registrar({
      rotulo: 'Sem seguro-desemprego',
      formula: 'A extinção por acordo não autoriza o ingresso no Programa',
      resultado: ZERO,
      fundamento: fundamentar(CLT_ART_484A_SAQUE),
      justificativa:
        'É o custo menos visível do acordo, e ele não aparece no valor da rescisão: quem ' +
        'aceita abre mão das parcelas do seguro-desemprego a que teria direito na dispensa ' +
        'sem justa causa.',
    })
  }

  if (avisoIndenizado) {
    registrar({
      rotulo: 'A projeção do aviso não entra na base da multa',
      formula: 'Base da multa = saldo na data do pagamento das verbas',
      resultado: ZERO,
      fundamento: fundamentar(TST_OJ_SDI1_42),
      justificativa:
        'O FGTS incide sobre o aviso prévio, trabalhado ou não (Súmula 305 do TST), mas a ' +
        'multa é calculada sobre o saldo existente no pagamento, desconsiderada a projeção.',
    })
  }

  // -------------------------------------------------------------------------
  // 4. Incidências — o núcleo do risco desta calculadora
  // -------------------------------------------------------------------------

  // 4.1 INSS sobre as verbas salariais do mês.
  //     O aviso INDENIZADO fica de fora por força do Tema 478 do STJ.
  const baseInssMensal = saldoSalario
  const previdencia = calcularInss({ salarioContribuicao: baseInssMensal }, dataReferencia, registro)
  if (!previdencia.ok) return previdencia
  for (const e of previdencia.traco.etapas) registrar(e)
  for (const v of previdencia.traco.vigenciasAplicadas) traco.vigencias.add(v)

  if (entrada.avisoPrevio === 'indenizado' && avisoPrevioValor > 0) {
    registrar({
      rotulo: 'Aviso prévio indenizado — sem contribuição previdenciária',
      formula: `${reais(avisoPrevioValor)} fora da base do INSS`,
      resultado: ZERO,
      fundamento: fundamentar(STJ_TEMA_478),
      justificativa:
        'Tese firmada: "Não incide contribuição previdenciária sobre os valores pagos a título ' +
        'de aviso prévio indenizado, por não se tratar de verba salarial." A letra da Lei nº ' +
        '8.212/1991 não o exclui expressamente — há divergência, e o cálculo segue a tese ' +
        'vinculante do STJ.',
    })
  }

  // 4.2 INSS sobre o 13º, apurado EM SEPARADO (RPS, art. 216, § 1º e § 3º).
  const previdencia13 = calcularInss({ salarioContribuicao: decimoTerceiro }, dataReferencia, registro)
  if (!previdencia13.ok) return previdencia13
  registrar({
    rotulo: 'Contribuição previdenciária sobre o 13º — apurada em separado',
    formula: `${reais(decimoTerceiro)} com tabela própria = ${reais(previdencia13.valores.contribuicao)}`,
    resultado: previdencia13.valores.contribuicao,
    fundamento: fundamentar(RPS_ART_216),
    justificativa:
      'Na rescisão, a parcela da gratificação natalina é computada em separado — não se soma ' +
      'ao saldo de salário para efeito da tabela progressiva.',
  })
  for (const v of previdencia13.traco.vigenciasAplicadas) traco.vigencias.add(v)

  // 4.3 Verbas indenizadas: fora do INSS por lei expressa.
  const indenizadas = somar(feriasVencidas, feriasProporcionais, multa)
  if (indenizadas > 0) {
    registrar({
      rotulo: 'Férias indenizadas e multa do FGTS — sem contribuição previdenciária',
      formula: `${reais(indenizadas)} fora da base do INSS`,
      resultado: ZERO,
      fundamento: fundamentar(LEI_8212_ART_28),
      justificativa:
        'A lei exclui do salário-de-contribuição as férias indenizadas com o respectivo ' +
        'adicional constitucional e a indenização do art. 10, I, do ADCT — a multa rescisória.',
    })
  }

  const inssTotal = somar(previdencia.valores.contribuicao, previdencia13.valores.contribuicao)

  // 4.4 IRRF sobre o saldo de salário.
  const imposto = calcularIrrf(
    {
      rendimentoBruto: saldoSalario,
      inss: previdencia.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: ZERO,
    },
    dataReferencia,
    registro,
  )
  if (!imposto.ok) return imposto
  for (const e of imposto.traco.etapas) registrar(e)
  for (const v of imposto.traco.vigenciasAplicadas) traco.vigencias.add(v)

  // 4.5 IRRF sobre o 13º, exclusivamente na fonte e em separado.
  const imposto13 = calcularIrrf(
    {
      rendimentoBruto: decimoTerceiro,
      inss: previdencia13.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: ZERO,
    },
    dataReferencia,
    registro,
  )
  if (!imposto13.ok) return imposto13
  registrar({
    rotulo: 'Imposto de renda sobre o 13º — tributação exclusiva na fonte',
    formula: `Base ${reais(subtrair(decimoTerceiro, previdencia13.valores.contribuicao))} = ${reais(imposto13.valores.imposto)}`,
    resultado: imposto13.valores.imposto,
    justificativa:
      'O 13º é tributado em separado dos demais rendimentos, e a redução do imposto do ' +
      'art. 3º-A alcança essa tributação.',
  })
  for (const v of imposto13.traco.vigenciasAplicadas) traco.vigencias.add(v)

  // 4.6 Verbas isentas de imposto de renda.
  const isentas = somar(avisoPrevioValor, feriasVencidas, feriasProporcionais, multa)
  if (isentas > 0) {
    registrar({
      rotulo: 'Aviso indenizado, férias indenizadas e FGTS — isentos de imposto de renda',
      formula: `${reais(isentas)} fora da base do IRRF`,
      resultado: ZERO,
      fundamento: fundamentar(RIR_ART_35),
      justificativa:
        'A indenização e o aviso prévio pagos por rescisão, e os depósitos do FGTS, são ' +
        'isentos por norma expressa. Para as férias indenizadas e o terço, a isenção é a da ' +
        `${STJ_SUMULA_386.norma}: o adicional assume a mesma natureza do pagamento principal.`,
    })
  }

  const irrfTotal = somar(imposto.valores.imposto, imposto13.valores.imposto)

  // -------------------------------------------------------------------------
  // 5. Total
  // -------------------------------------------------------------------------
  const totalBruto = somar(
    saldoSalario,
    avisoPrevioValor,
    decimoTerceiro,
    feriasVencidas,
    feriasProporcionais,
    multa,
  )
  const totalLiquido = naoNegativo(
    subtrair(totalBruto, somar(inssTotal, irrfTotal, descontoAvisoPrevio)),
  )

  registrar({
    rotulo: 'Total líquido estimado da rescisão',
    formula:
      `${reais(totalBruto)} − ${reais(inssTotal)} (INSS) − ${reais(irrfTotal)} (IRRF)` +
      (descontoAvisoPrevio > 0 ? ` − ${reais(descontoAvisoPrevio)} (aviso não cumprido)` : ''),
    resultado: totalLiquido,
  })

  const tracoFinal: Traco = {
    etapas: traco.etapas,
    dataReferencia,
    vigenciasAplicadas: [...traco.vigencias],
  }

  return {
    ok: true,
    valores: {
      totalLiquido,
      saldoSalario,
      avisoPrevioValor,
      descontoAvisoPrevio,
      decimoTerceiro,
      feriasVencidas,
      feriasProporcionais,
      multaFgts: multa,
      inss: inssTotal,
      irrf: irrfTotal,
      totalBruto,
      diasAviso,
      dataProjetada: escreverData(projetada),
      fgtsEstimado,
      baseFgts,
      fracaoAvisoBp,
      multaBp: aliquotaMulta,
      saqueDisponivel,
      limiteSaqueBp,
    },
    traco: tracoFinal,
  }
}

export { centavos, TST_SUMULA_305 }
