/**
 * CALC-010 — Aviso prévio proporcional (Lei nº 12.506/2011).
 *
 * **A contagem de dias vive aqui, e é a mesma que `rescisao.ts` usa.** Ela já
 * existia dentro do motor de rescisão; foi extraída em vez de copiada porque
 * duas implementações da mesma regra divergem na primeira manutenção — e esta
 * regra tem um ponto de interpretação declarado (a partir de qual ano o
 * acréscimo começa) que precisa ser respondido uma vez só.
 *
 * A lei é curta e o texto é o que decide:
 *
 *   Art. 1º  "O aviso prévio [...] será concedido na proporção de 30 (trinta)
 *            dias aos empregados que contem até 1 (um) ano de serviço na mesma
 *            empresa."
 *   Par. ún. "Ao aviso prévio previsto neste artigo serão acrescidos 3 (três)
 *            dias por ano de serviço prestado na mesma empresa, até o máximo de
 *            60 (sessenta) dias, perfazendo um total de até 90 (noventa) dias."
 */

import { anosCompletos, compararDatas, escreverData, lerData, somarDias } from '../datas'
import { aplicarAliquota, proporcao } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CLT_ART_487 } from '../../params/data/fontes'

/** `RN-007`: empate para cima, como no restante do motor. */
const POLITICA = 'meio_para_cima' as const

/** Divisor do salário-dia — CLT, art. 64. Ver a nota em `rescisao.ts`. */
const DIAS_DO_MES_COMERCIAL = 30

/**
 * Escala das etapas em unidade `'numero'` — ver `Unidade` em `traco.ts`.
 *
 * Definição de unidade, não constante legal: BV-10 existe para impedir tabela
 * legal escrita à mão dentro do motor, não para proibir a base decimal.
 */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/** 100% em basis points (`ADR-004` A-2). Unidade, não parâmetro legal. */
// eslint-disable-next-line no-restricted-syntax -- denominador do basis point, não parâmetro legal
const BP_INTEIRO = 10_000

/**
 * Quem deve o aviso. Decide se o acréscimo proporcional entra.
 *
 * A Lei nº 12.506/2011 acresce dias ao aviso **concedido ao empregado**. Quando
 * é o trabalhador quem pede demissão, o aviso é devido POR ele, e o prazo é o do
 * art. 487, II, da CLT — trinta dias. Aplicar o acréscimo contra ele inverteria
 * o sentido da lei.
 */
export type QuemAvisa = 'empregador' | 'empregado'

/**
 * Dias de aviso prévio devidos.
 *
 * Função pura e sem traço de propósito: é peça compartilhada, e quem registra a
 * etapa é o chamador, que sabe o contexto em que ela aparece.
 *
 * **O ponto de interpretação.** A lei não diz a partir de qual ano o acréscimo
 * começa. Adotamos o primeiro ano completo — 1 ano de casa já soma 3 dias —,
 * que é o entendimento consolidado na Justiça do Trabalho. A escolha é
 * declarada na memória de cálculo, nunca escondida no código.
 */
export function diasDeAvisoPrevio(
  anos: number,
  base: number,
  porAno: number,
  maximo: number,
  quemAvisa: QuemAvisa,
): number {
  if (quemAvisa === 'empregado') return base
  return Math.min(base + porAno * anos, maximo)
}

export interface EntradaAvisoPrevio {
  readonly admissao: DataISO
  readonly desligamento: DataISO
  readonly salario: Centavos
  readonly quemAvisa: QuemAvisa
  /** `true` quando o aviso é indenizado — o único caso que vira verba própria. */
  readonly indenizado: boolean
  /**
   * Fração devida do aviso indenizado, em basis points. Cheia na dispensa
   * comum; metade na extinção por acordo (`CLT` art. 484-A, I, "a").
   */
  readonly fracaoBp: BasisPoints
}

export interface SaidaAvisoPrevio {
  readonly anosCompletos: number
  readonly diasBase: number
  readonly diasAcrescidos: number
  readonly diasTotais: number
  readonly atingiuTeto: boolean
  /** Valor cheio dos dias apurados, antes de qualquer fração. */
  readonly valorCheio: Centavos
  /** O que de fato é devido, já aplicada a fração. */
  readonly valorDevido: Centavos
  /** Data até onde o aviso indenizado projeta o contrato. */
  readonly dataProjetada: DataISO
}

export function calcularAvisoPrevio(
  entrada: EntradaAvisoPrevio,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaAvisoPrevio> {
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

  const resolvidas = {
    base: registro.resolver('aviso-previo-dias-base', dataReferencia),
    porAno: registro.resolver('aviso-previo-dias-por-ano', dataReferencia),
    maximo: registro.resolver('aviso-previo-dias-maximo', dataReferencia),
  }

  for (const r of Object.values(resolvidas)) {
    if (!r.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: r.detalhe }
    if (r.resolvida.vigencia.valor.tipo !== 'inteiro') {
      return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os parâmetros de aviso prévio não são inteiros.' }
    }
  }
  // Estreitado pelo laço acima; o compilador não acompanha a narrativa.
  const valorDe = (r: (typeof resolvidas)['base']) =>
    r.ok && r.resolvida.vigencia.valor.tipo === 'inteiro' ? r.resolvida.vigencia.valor.valor : 0

  const base = valorDe(resolvidas.base)
  const porAno = valorDe(resolvidas.porAno)
  const maximo = valorDe(resolvidas.maximo)

  const etapas: Etapa[] = []
  const vigencias = new Set<string>()
  for (const r of Object.values(resolvidas)) {
    if (r.ok) vigencias.add(r.resolvida.vigencia.id)
  }

  const anos = anosCompletos(admissao, desligamento)
  const diasTotais = diasDeAvisoPrevio(anos, base, porAno, maximo, entrada.quemAvisa)
  const diasAcrescidos = diasTotais - base
  const atingiuTeto = entrada.quemAvisa === 'empregador' && base + porAno * anos > maximo

  etapas.push({
    rotulo: 'Tempo de serviço na mesma empresa',
    formula: `De ${escreverData(admissao)} a ${escreverData(desligamento)} — ${anos} ano(s) completo(s)`,
    resultado: centavos(anos * CENTESIMOS_POR_UNIDADE),
    unidade: 'numero',
  })

  if (entrada.quemAvisa === 'empregado') {
    etapas.push({
      rotulo: 'Dias de aviso prévio',
      formula: `${base} dias — CLT, art. 487, II`,
      resultado: centavos(diasTotais * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      ...(resolvidas.base.ok ? { parametro: citar(resolvidas.base.resolvida) } : {}),
      justificativa:
        'O acréscimo de 3 dias por ano é concedido AO EMPREGADO. Quem pede demissão deve o ' +
        'aviso, e o prazo que a CLT lhe impõe é o de trinta dias.',
    })
  } else {
    etapas.push({
      rotulo: 'Dias de aviso prévio',
      formula: atingiuTeto
        ? `${base} + ${porAno} × ${anos} ano(s) = ${base + porAno * anos} dias, limitado a ${maximo}`
        : `${base} dias + ${porAno} × ${anos} ano(s) = ${diasTotais} dias`,
      resultado: centavos(diasTotais * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      ...(resolvidas.base.ok ? { parametro: citar(resolvidas.base.resolvida) } : {}),
      justificativa: atingiuTeto
        ? `O acréscimo alcançaria ${base + porAno * anos} dias, mas a lei limita o total a ${maximo}. ` +
          `O teto é atingido a partir de ${Math.ceil((maximo - base) / porAno)} anos de casa.`
        : 'A lei fixa 30 dias e acrescenta 3 por ano de serviço, até 90. Ela não diz a partir ' +
          'de qual ano o acréscimo começa; adotamos o primeiro ano completo, conforme ' +
          'entendimento consolidado da Justiça do Trabalho.',
    })
  }

  const valorCheio = proporcao(entrada.salario, diasTotais, DIAS_DO_MES_COMERCIAL, POLITICA)
  const fracaoCheia = entrada.fracaoBp >= BP_INTEIRO

  etapas.push({
    rotulo: 'Valor de um dia de aviso',
    formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} dias`,
    resultado: proporcao(entrada.salario, 1, DIAS_DO_MES_COMERCIAL, POLITICA),
    justificativa:
      'O salário-dia do mensalista sai da divisão por trinta, na forma do art. 64 da CLT.',
  })

  etapas.push({
    rotulo: 'Valor do aviso prévio',
    formula: `${reais(entrada.salario)} ÷ ${DIAS_DO_MES_COMERCIAL} × ${diasTotais} dias`,
    resultado: valorCheio,
  })

  const valorDevido = fracaoCheia
    ? valorCheio
    : aplicarAliquota(valorCheio, entrada.fracaoBp, POLITICA)

  const projetada = entrada.indenizado ? somarDias(desligamento, diasTotais) : desligamento

  if (entrada.indenizado) {
    etapas.push({
      rotulo: 'Projeção do aviso prévio indenizado',
      formula: `${escreverData(desligamento)} + ${diasTotais} dias = ${escreverData(projetada)}`,
      resultado: ZERO,
      fundamento: fundamentar(CLT_ART_487),
      justificativa:
        'O período do aviso indenizado integra o tempo de serviço para todos os efeitos, e por ' +
        'isso conta avos de 13º e de férias — mesmo sem trabalho no período.',
    })
  } else {
    etapas.push({
      rotulo: 'Aviso trabalhado — não é verba separada',
      formula: 'Pago como salário durante o período trabalhado',
      resultado: ZERO,
      justificativa:
        'Quando o aviso é cumprido, o valor acima já entra na folha do período como salário. ' +
        'Ele aparece aqui para dimensionar o prazo, não como parcela a receber na rescisão.',
    })
  }

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: [...vigencias],
  }

  return {
    ok: true,
    valores: {
      anosCompletos: anos,
      diasBase: base,
      diasAcrescidos,
      diasTotais,
      atingiuTeto,
      valorCheio,
      valorDevido,
      dataProjetada: escreverData(projetada),
    },
    traco,
  }
}

export { basisPoints, centavos, percentual }
