/**
 * CALC-014 — Acerto do contrato intermitente (CLT, art. 452-A).
 *
 * O QUE A MP 808/2017 LEVOU EMBORA AO CADUCAR
 *
 * O catálogo chama esta calculadora de "rescisão", e a pesquisa mostrou por que
 * ela não pode ser só isso. **O regime de rescisão do contrato intermitente não
 * está em vigor.** Ele existiu nos arts. 452-B a 452-H, todos criados pela
 * Medida Provisória nº 808/2017 e todos marcados "(Vigência encerrada)" no
 * texto consolidado — a MP caducou em 23/04/2018 sem conversão. Com ela caíram:
 *
 *   art. 452-E   aviso prévio indenizado e multa do FGTS pela METADE
 *   art. 452-F   verbas e aviso calculados pela MÉDIA dos valores recebidos
 *   art. 452-D   rescisão automática após um ano sem convocação
 *
 * Sobrou o art. 452-A da Lei nº 13.467/2017, e o que ele manda calcular é o
 * **acerto de cada período de prestação** — § 6º. É isso que esta calculadora
 * faz, e é a conta que o trabalhador intermitente precisa conferir a cada
 * convocação, não uma vez na vida.
 *
 * **O aviso prévio fica de fora, declarado.** Sem o art. 452-F, não há norma
 * dizendo sobre qual base calculá-lo num contrato sem salário fixo. Publicar
 * uma média de doze meses aqui seria publicar a regra de uma MP caduca com
 * aparência de lei vigente. Omitir erra para MENOS, e por isso a tela diz.
 *
 * POR QUE 1/12 DA REMUNERAÇÃO DO PERÍODO, E NÃO A REGRA DOS 15 DIAS
 *
 * A Lei nº 4.090/1962 conta o 13º por mês de serviço, tratando como mês inteiro
 * a fração de 15 dias ou mais. Aplicada literalmente a um período de convocação
 * de três dias, ela daria ZERO — e tornaria impossível o pagamento que o § 6º
 * manda fazer **ao final de cada período**. Entre uma leitura que anula o
 * comando expresso e uma que lhe dá efeito, o motor segue a segunda: um avo da
 * remuneração do período, que é a proporção que o § 6º chama de "proporcional".
 * O mesmo vale para as férias do art. 130.
 *
 * O REPOUSO SEMANAL É CAMPO DO USUÁRIO, E ISSO É UMA DECISÃO
 *
 * O § 6º, IV manda pagar repouso semanal remunerado, mas a Lei nº 605/1949, no
 * art. 7º, "b", diz que para quem trabalha por hora ele corresponde "à sua
 * jornada normal de trabalho" — e o intermitente **não tem jornada normal**. A
 * norma não responde. Seguindo o precedente de `RN-027`, na dúvida a
 * calculadora não inventa o número: ela pergunta quanto o recibo trouxe, e
 * explica por quê.
 */

import { calcularInss } from '../inss'
import { calcularIrrf } from '../irrf'
import { aplicarAliquota, proporcao, somar, subtrair } from '../money'
import { ConstrutorDeTraco, fundamentar, percentual, reais, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CF_ART_7_XVII, CLT_ART_452A, LEI_8212_ART_28 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const
/** Um avo por mês — CLT art. 130 e Lei nº 4.090/1962, art. 1º. */
const AVOS_NO_ANO = 12
/** O terço constitucional é 1/3 — CF, art. 7º, XVII. */
const DIVISOR_DO_TERCO = 3

export const PARAMETROS_INTERMITENTE = [
  'inss-tabela-progressiva',
  'irrf-tabela-progressiva',
  'fgts-aliquota-deposito',
] as const

export interface EntradaIntermitente {
  /** Valor da hora fixado no contrato — art. 452-A, caput. */
  readonly valorDaHora: Centavos
  /** Horas efetivamente prestadas no período de convocação. */
  readonly horas: number
  /** Repouso semanal remunerado e adicionais legais, como vieram no recibo. */
  readonly repousoEAdicionais: Centavos
  readonly dependentes: number
}

export interface SaidaIntermitente {
  readonly remuneracao: Centavos
  readonly baseDosProporcionais: Centavos
  readonly decimoTerceiro: Centavos
  readonly feriasProporcionais: Centavos
  readonly tercoDeFerias: Centavos
  readonly totalBruto: Centavos
  readonly inss: Centavos
  readonly irrf: Centavos
  readonly liquido: Centavos
  readonly fgtsDepositado: Centavos
  readonly fgtsAliquotaBp: BasisPoints
  /** Quanto o líquido representa da hora contratada — a hora que de fato entra. */
  readonly valorHoraLiquidoEfetivo: Centavos
}

export function calcularIntermitente(
  entrada: EntradaIntermitente,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaIntermitente> {
  if (entrada.valorDaHora <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o valor da hora previsto no contrato para ver o resultado.',
    }
  }
  if (entrada.horas <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe as horas trabalhadas no período para ver o resultado.',
    }
  }

  const fgts = registro.resolver('fgts-aliquota-deposito', dataReferencia)
  if (!fgts.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: fgts.detalhe }
  if (fgts.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O parâmetro do FGTS não é percentual.' }
  }
  const fgtsAliquotaBp = basisPoints(fgts.resolvida.vigencia.valor.aliquotaBp)

  /** Resolvida aqui só para CITAR vigência e fonte nos passos — quem calcula é `calcularInss`. */
  const tabelaInss = registro.resolver('inss-tabela-progressiva', dataReferencia)
  if (!tabelaInss.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: tabelaInss.detalhe }
  const tabelaIrrf = registro.resolver('irrf-tabela-progressiva', dataReferencia)
  if (!tabelaIrrf.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: tabelaIrrf.detalhe }

  const traco = new ConstrutorDeTraco(dataReferencia)

  // --- § 6º, I — a remuneração das horas prestadas -------------------------
  const remuneracao = traco.passoComFundamento(
    'Remuneração das horas',
    `${reais(entrada.valorDaHora)} × ${entrada.horas} horas`,
    proporcao(entrada.valorDaHora, entrada.horas, 1, POLITICA),
    fundamentar(CLT_ART_452A),
    'O contrato intermitente precisa ser escrito e fixar o valor da hora, que não pode ser ' +
      'inferior ao horário do salário mínimo nem ao dos demais empregados da mesma função.',
  )

  // --- § 6º, IV e V — o que veio no recibo ---------------------------------
  const base = somar(remuneracao, entrada.repousoEAdicionais)
  if (entrada.repousoEAdicionais > 0) {
    traco.passo(
      'Repouso semanal remunerado e adicionais, conforme informado',
      `${reais(remuneracao)} + ${reais(entrada.repousoEAdicionais)}`,
      base,
    )
  }

  // --- § 6º, III — 13º proporcional ----------------------------------------
  const decimoTerceiro = traco.passoComFundamento(
    'Décimo terceiro proporcional',
    `${reais(base)} ÷ ${AVOS_NO_ANO}`,
    proporcao(base, 1, AVOS_NO_ANO, POLITICA),
    fundamentar(CLT_ART_452A),
    'Um avo da remuneração do período. A regra dos 15 dias da Lei nº 4.090/1962 daria zero num ' +
      'período curto e tornaria impossível o pagamento que o § 6º manda fazer ao fim de CADA ' +
      'período de prestação.',
  )

  // --- § 6º, II — férias proporcionais com o terço -------------------------
  const feriasProporcionais = traco.passoComFundamento(
    'Férias proporcionais',
    `${reais(base)} ÷ ${AVOS_NO_ANO}`,
    proporcao(base, 1, AVOS_NO_ANO, POLITICA),
    fundamentar(CLT_ART_452A),
  )

  const tercoDeFerias = traco.passoComFundamento(
    'Terço constitucional',
    `${reais(feriasProporcionais)} ÷ ${DIVISOR_DO_TERCO}`,
    proporcao(feriasProporcionais, 1, DIVISOR_DO_TERCO, POLITICA),
    fundamentar(CF_ART_7_XVII),
  )

  const totalBruto = traco.passo(
    'Total bruto do período',
    `${reais(base)} + ${reais(decimoTerceiro)} + ${reais(feriasProporcionais)} + ${reais(tercoDeFerias)}`,
    somar(base, decimoTerceiro, feriasProporcionais, tercoDeFerias),
  )

  // -------------------------------------------------------------------------
  // As incidências, verba a verba
  //
  // As férias pagas SEM o gozo são indenizadas, e o art. 28, § 9º, "d" da Lei
  // nº 8.212/1991 as exclui do salário-de-contribuição junto com o terço. O 13º
  // tem base própria, apurada em separado do salário do mês.
  // -------------------------------------------------------------------------
  const previdencia = calcularInss({ salarioContribuicao: base }, dataReferencia, registro)
  if (!previdencia.ok) return previdencia
  traco.passoComParametro(
    'INSS sobre a remuneração e o repouso',
    `${reais(base)} pela tabela progressiva`,
    previdencia.valores.contribuicao,
    tabelaInss.resolvida,
  )

  const previdencia13 = calcularInss(
    { salarioContribuicao: decimoTerceiro },
    dataReferencia,
    registro,
  )
  if (!previdencia13.ok) return previdencia13
  traco.passoComParametro(
    'INSS sobre o décimo terceiro — base própria',
    `${reais(decimoTerceiro)} pela tabela progressiva`,
    previdencia13.valores.contribuicao,
    tabelaInss.resolvida,
    'O décimo terceiro não se soma ao salário do mês para efeito de contribuição: tem base ' +
      'própria, apurada em separado.',
  )

  const indenizadas = somar(feriasProporcionais, tercoDeFerias)
  traco.passoComFundamento(
    'Férias proporcionais e terço — sem contribuição previdenciária',
    `${reais(indenizadas)} fora da base do INSS`,
    ZERO,
    fundamentar(LEI_8212_ART_28),
    'Pagas sem o gozo, as férias são indenizadas, e a lei exclui do salário-de-contribuição as ' +
      'férias indenizadas com o respectivo adicional constitucional.',
  )

  const inss = somar(previdencia.valores.contribuicao, previdencia13.valores.contribuicao)

  const imposto = calcularIrrf(
    {
      rendimentoBruto: base,
      inss: previdencia.valores.contribuicao,
      dependentes: entrada.dependentes,
      pensao: ZERO,
    },
    dataReferencia,
    registro,
  )
  if (!imposto.ok) return imposto

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

  const irrf = somar(imposto.valores.imposto, imposto13.valores.imposto)
  if (irrf > 0) {
    traco.passoComParametro(
      'Imposto de renda na fonte',
      `${reais(imposto.valores.imposto)} sobre o período + ${reais(imposto13.valores.imposto)} sobre o 13º`,
      irrf,
      tabelaIrrf.resolvida,
      'O décimo terceiro é tributado exclusivamente na fonte, em separado do restante.',
    )
  }

  const liquido = traco.passo(
    'Líquido a receber no período',
    `${reais(totalBruto)} − ${reais(inss)} (INSS) − ${reais(irrf)} (IRRF)`,
    subtrair(totalBruto, somar(inss, irrf)),
  )

  // --- § 8º — o depósito do FGTS, que não sai do bolso do trabalhador ------
  const fgtsDepositado = traco.passoComParametro(
    'FGTS depositado pelo empregador',
    `${reais(base)} × ${percentual(fgtsAliquotaBp)}`,
    aplicarAliquota(base, fgtsAliquotaBp, POLITICA),
    fgts.resolvida,
    'Não é desconto: entra na conta vinculada além do que o trabalhador recebe. O § 8º manda ' +
      'recolher com base nos valores pagos no período mensal e entregar o comprovante.',
  )

  return {
    ok: true,
    traco: traco.construir(),
    valores: {
      remuneracao,
      baseDosProporcionais: base,
      decimoTerceiro,
      feriasProporcionais,
      tercoDeFerias,
      totalBruto,
      inss,
      irrf,
      liquido,
      fgtsDepositado,
      fgtsAliquotaBp,
      valorHoraLiquidoEfetivo: centavos(
        proporcao(liquido, 1, entrada.horas, POLITICA),
      ),
    },
  }
}
