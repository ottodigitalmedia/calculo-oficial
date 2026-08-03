/**
 * CALC-055 — Custo de viagem por combustível · CALC-057 — Custo mensal de ter um carro.
 *
 * As duas partem do mesmo par de grandezas — consumo em km/l e preço do litro —
 * e por isso dividem módulo, como férias e 13º dividem o deles. A aritmética é a
 * de `aritmetica.ts`: inteiros escalados por cem, arredondamento declarado,
 * nenhum ponto flutuante (`ADR-004`).
 *
 * NENHUMA NORMA, E ISSO ESTÁ DECLARADO
 *
 * Não há parâmetro legal aqui. O IPVA tem alíquota estadual e o licenciamento é
 * taxa estadual — `00-catalogo` §14 fechou a porta do dado hiperlocal, e a saída
 * que a própria exclusão prescreve é a que está aqui: os dois entram como valor
 * digitado, tirado do documento que o usuário tem em mãos.
 *
 * A DECISÃO QUE MAIS AFETA O RESULTADO DE CALC-057
 *
 * Custos anuais são mensalizados **um a um, já arredondados**, e o total é a soma
 * das linhas mensais. Somar tudo e dividir no fim daria um total até alguns
 * centavos diferente da soma do que está na tela — e "cada número certo, a soma
 * errada" é o defeito que `ESTADO-DO-PROJETO` §7.12 registra como o pior que este
 * produto pode publicar.
 */

import { dividirPorInteiro, multiplicarPorInteiro, proporcao, somar, subtrair } from '../money'
import { reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, centavos, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'

const MESES_NO_ANO = 12

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/** `100 × 100`: converte quilômetro inteiro para centésimos de litro. */
// eslint-disable-next-line no-restricted-syntax -- composição de escalas, não parâmetro legal
const ESCALA_DE_LITROS = 10_000

/** Ver a nota sobre política em `aritmetica.ts`. */
const POLITICA = 'meio_para_cima' as const

/** Formata centésimos como "1.234,56", só para compor `formula`. */
function numero(valor: Centavos): string {
  const abs = Math.abs(valor)
  const inteiro = Math.trunc(abs / CENTESIMOS_POR_UNIDADE)
  const frac = abs % CENTESIMOS_POR_UNIDADE
  const comSeparador = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${valor < 0 ? '−' : ''}${comSeparador},${String(frac).padStart(2, '0')}`
}

/**
 * Litros necessários para percorrer `km`, em centésimos de litro.
 *
 * `consumo` vem em centésimos de km/l: 12,5 km/l é `1250`.
 */
function litrosPara(km: number, consumo: number): Centavos {
  return proporcao(centavos(km), ESCALA_DE_LITROS, consumo, POLITICA)
}

/**
 * Custo dos litros ao preço informado.
 *
 * Derivado dos **litros já arredondados**, e não da fórmula direta, para que a
 * multiplicação que aparece na tela feche: quem confere "40 litros × R$ 6,00"
 * precisa chegar ao mesmo número que a calculadora mostra.
 */
function custoDosLitros(litros: Centavos, precoLitro: Centavos): Centavos {
  return proporcao(precoLitro, litros, CENTESIMOS_POR_UNIDADE, POLITICA)
}

// ---------------------------------------------------------------------------
// CALC-055 — Custo de viagem
// ---------------------------------------------------------------------------

export interface EntradaViagem {
  /** Percurso de ida, em quilômetros inteiros. */
  readonly distancia: number
  /** Consumo em km/l, em centésimos: 12,5 km/l é `1250`. */
  readonly consumo: number
  readonly precoLitro: Centavos
  readonly idaEVolta: boolean
  readonly pedagios: Centavos
  /** Entre quantas pessoas o custo é dividido. */
  readonly pessoas: number
}

export interface SaidaViagem {
  readonly distanciaTotal: number
  /** Em centésimos de litro. */
  readonly litros: Centavos
  readonly custoCombustivel: Centavos
  readonly custoTotal: Centavos
  readonly custoPorPessoa: Centavos
  readonly custoPorQuilometro: Centavos
}

export function calcularViagem(
  entrada: EntradaViagem,
  dataReferencia: DataISO,
): Resultado<SaidaViagem> {
  if (entrada.distancia <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a distância para ver o resultado.',
    }
  }
  if (entrada.consumo <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o consumo do veículo para ver o resultado.',
    }
  }
  if (entrada.precoLitro <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o preço do combustível para ver o resultado.',
    }
  }
  if (entrada.pessoas <= 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A viagem precisa de pelo menos uma pessoa para dividir o custo.',
    }
  }

  const etapas: Etapa[] = []
  const distanciaTotal = entrada.idaEVolta ? entrada.distancia * 2 : entrada.distancia

  if (entrada.idaEVolta) {
    etapas.push({
      rotulo: 'Distância percorrida',
      formula: `${entrada.distancia} km de ida × 2`,
      resultado: centavos(distanciaTotal * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      justificativa: 'A volta gasta o mesmo que a ida, e é a metade que costuma ser esquecida.',
    })
  }

  const litros = litrosPara(distanciaTotal, entrada.consumo)
  etapas.push({
    rotulo: 'Combustível necessário',
    formula: `${distanciaTotal} km ÷ ${numero(centavos(entrada.consumo))} km/l`,
    resultado: litros,
    unidade: 'numero',
  })

  const custoCombustivel = custoDosLitros(litros, entrada.precoLitro)
  etapas.push({
    rotulo: 'Custo do combustível',
    formula: `${numero(litros)} litros × ${reais(entrada.precoLitro)}`,
    resultado: custoCombustivel,
  })

  const custoTotal = somar(custoCombustivel, entrada.pedagios)
  if (entrada.pedagios > 0) {
    etapas.push({
      rotulo: 'Com os pedágios',
      formula: `${reais(custoCombustivel)} + ${reais(entrada.pedagios)}`,
      resultado: custoTotal,
    })
  }

  const custoPorPessoa = dividirPorInteiro(custoTotal, entrada.pessoas, POLITICA)
  if (entrada.pessoas > 1) {
    etapas.push({
      rotulo: 'Dividido entre os viajantes',
      formula: `${reais(custoTotal)} ÷ ${entrada.pessoas} pessoas`,
      resultado: custoPorPessoa,
    })
  }

  const custoPorQuilometro = proporcao(custoTotal, 1, distanciaTotal, POLITICA)
  etapas.push({
    rotulo: 'Custo por quilômetro',
    formula: `${reais(custoTotal)} ÷ ${distanciaTotal} km`,
    resultado: custoPorQuilometro,
    justificativa:
      'Serve para comparar com outras formas de fazer o mesmo trajeto — e para estimar ' +
      'qualquer outro percurso no mesmo carro.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      distanciaTotal,
      litros,
      custoCombustivel,
      custoTotal,
      custoPorPessoa,
      custoPorQuilometro,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-057 — Custo mensal de ter um carro
// ---------------------------------------------------------------------------

export interface EntradaCustoDoCarro {
  /** Quilômetros rodados por mês. */
  readonly kmPorMes: number
  readonly consumo: number
  readonly precoLitro: Centavos
  readonly ipvaAnual: Centavos
  readonly seguroAnual: Centavos
  readonly licenciamentoAnual: Centavos
  readonly manutencaoAnual: Centavos
  readonly depreciacaoAnual: Centavos
  readonly estacionamentoMensal: Centavos
}

export interface SaidaCustoDoCarro {
  readonly litrosPorMes: Centavos
  readonly combustivelMensal: Centavos
  readonly ipvaMensal: Centavos
  readonly seguroMensal: Centavos
  readonly licenciamentoMensal: Centavos
  readonly manutencaoMensal: Centavos
  readonly depreciacaoMensal: Centavos
  readonly custoMensal: Centavos
  readonly custoAnual: Centavos
  readonly custoPorQuilometro: Centavos
}

export function calcularCustoDoCarro(
  entrada: EntradaCustoDoCarro,
  dataReferencia: DataISO,
): Resultado<SaidaCustoDoCarro> {
  if (entrada.kmPorMes <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quantos quilômetros você roda por mês para ver o resultado.',
    }
  }
  if (entrada.consumo <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o consumo do veículo para ver o resultado.',
    }
  }
  if (entrada.precoLitro <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o preço do combustível para ver o resultado.',
    }
  }

  const etapas: Etapa[] = []

  const litrosPorMes = litrosPara(entrada.kmPorMes, entrada.consumo)
  const combustivelMensal = custoDosLitros(litrosPorMes, entrada.precoLitro)

  etapas.push({
    rotulo: 'Combustível do mês',
    formula:
      `${entrada.kmPorMes} km ÷ ${numero(centavos(entrada.consumo))} km/l = ` +
      `${numero(litrosPorMes)} litros × ${reais(entrada.precoLitro)}`,
    resultado: combustivelMensal,
  })

  /**
   * Cada custo anual vira mensal **separadamente**, e o total é a soma das
   * linhas. Ver a nota do cabeçalho: é a soma da tela que precisa fechar.
   */
  const mensalizar = (anual: Centavos): Centavos =>
    anual > 0 ? dividirPorInteiro(anual, MESES_NO_ANO, POLITICA) : ZERO

  const ipvaMensal = mensalizar(entrada.ipvaAnual)
  const seguroMensal = mensalizar(entrada.seguroAnual)
  const licenciamentoMensal = mensalizar(entrada.licenciamentoAnual)
  const manutencaoMensal = mensalizar(entrada.manutencaoAnual)
  const depreciacaoMensal = mensalizar(entrada.depreciacaoAnual)

  const somaAnual = somar(
    entrada.ipvaAnual,
    entrada.seguroAnual,
    entrada.licenciamentoAnual,
    entrada.manutencaoAnual,
    entrada.depreciacaoAnual,
  )

  if (somaAnual > 0) {
    etapas.push({
      rotulo: 'Custos anuais, divididos por doze',
      formula: `${reais(somaAnual)} ÷ 12 meses`,
      resultado: somar(
        ipvaMensal,
        seguroMensal,
        licenciamentoMensal,
        manutencaoMensal,
        depreciacaoMensal,
      ),
      justificativa:
        'IPVA, seguro, licenciamento, manutenção e perda de valor não chegam todo mês, e é ' +
        'exatamente por isso que somem da conta de quem tenta estimar o custo de um carro ' +
        'olhando só para o posto.',
    })
  }

  const custoMensal = somar(
    combustivelMensal,
    ipvaMensal,
    seguroMensal,
    licenciamentoMensal,
    manutencaoMensal,
    depreciacaoMensal,
    entrada.estacionamentoMensal,
  )

  etapas.push({
    rotulo: 'Custo de um mês',
    formula: `Soma de tudo o que o carro custa em um mês típico`,
    resultado: custoMensal,
  })

  const custoAnual = multiplicarPorInteiro(custoMensal, MESES_NO_ANO)
  etapas.push({
    rotulo: 'Custo de doze meses',
    formula: `${reais(custoMensal)} × 12`,
    resultado: custoAnual,
  })

  const custoPorQuilometro = proporcao(custoMensal, 1, entrada.kmPorMes, POLITICA)
  etapas.push({
    rotulo: 'Custo por quilômetro rodado',
    formula: `${reais(custoMensal)} ÷ ${entrada.kmPorMes} km`,
    resultado: custoPorQuilometro,
    justificativa:
      'Este é o número que compara com aplicativo de transporte, e ele costuma ser bem maior ' +
      'que o custo por quilômetro só de combustível — que é o que se tem em mente ao dizer ' +
      '"o carro já está aí mesmo".',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      litrosPorMes,
      combustivelMensal,
      ipvaMensal,
      seguroMensal,
      licenciamentoMensal,
      manutencaoMensal,
      depreciacaoMensal,
      custoMensal,
      custoAnual,
      custoPorQuilometro,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-058 — Elétrico vs. combustão
// ---------------------------------------------------------------------------

/**
 * A comparação é de **energia por quilômetro**, e só disso.
 *
 * Manutenção, seguro e depreciação diferem entre os dois e não entram aqui: os
 * dois primeiros o usuário informa em CALC-057, para cada carro, e o terceiro é
 * o dado que o mercado brasileiro menos publica de forma confiável. Uma
 * comparação que fingisse cobrir tudo seria pior que uma que declara o recorte.
 *
 * **A unidade do elétrico é km/kWh, e não kWh/100 km.** As duas circulam, e
 * misturá-las inverte o resultado por um fator de cem — daí o rótulo do campo
 * dizer a unidade e o `ajuda` dar a conversão.
 */
export interface EntradaEletricoVsCombustao {
  readonly kmPorMes: number
  /** Consumo do carro a combustão, em km/l e em centésimos. */
  readonly consumoCombustao: number
  readonly precoLitro: Centavos
  /** Consumo do elétrico, em km/kWh e em centésimos. */
  readonly consumoEletrico: number
  readonly tarifaKwh: Centavos
  /** Quanto o elétrico custa a mais na compra. Zero para ignorar. */
  readonly diferencaDePreco: Centavos
}

export interface SaidaEletricoVsCombustao {
  readonly custoMensalCombustao: Centavos
  readonly custoMensalEletrico: Centavos
  readonly economiaMensal: Centavos
  readonly economiaAnual: Centavos
  readonly custoPorKmCombustao: Centavos
  readonly custoPorKmEletrico: Centavos
  /** Meses para a economia cobrir a diferença de preço. Zero quando não há. */
  readonly mesesParaPagarADiferenca: number
}

export function compararEletricoVsCombustao(
  entrada: EntradaEletricoVsCombustao,
  dataReferencia: DataISO,
): Resultado<SaidaEletricoVsCombustao> {
  if (entrada.kmPorMes <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe quantos quilômetros você roda por mês para ver o resultado.',
    }
  }
  if (entrada.consumoCombustao <= 0 || entrada.precoLitro <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o consumo e o preço do combustível para ver o resultado.',
    }
  }
  if (entrada.consumoEletrico <= 0 || entrada.tarifaKwh <= 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe o consumo do elétrico e a tarifa de energia para ver o resultado.',
    }
  }

  const etapas: Etapa[] = []

  const litros = litrosPara(entrada.kmPorMes, entrada.consumoCombustao)
  const custoMensalCombustao = custoDosLitros(litros, entrada.precoLitro)
  etapas.push({
    rotulo: 'Combustível no mês',
    formula:
      `${entrada.kmPorMes} km ÷ ${numero(centavos(entrada.consumoCombustao))} km/l = ` +
      `${numero(litros)} litros × ${reais(entrada.precoLitro)}`,
    resultado: custoMensalCombustao,
  })

  /**
   * O elétrico usa a mesma mecânica: distância dividida pelo rendimento dá a
   * quantidade de energia, e ela multiplica o preço da unidade. Trocam-se
   * litros por quilowatt-hora e nada mais muda.
   */
  const kwh = proporcao(centavos(entrada.kmPorMes), ESCALA_DE_LITROS, entrada.consumoEletrico, POLITICA)
  const custoMensalEletrico = custoDosLitros(kwh, entrada.tarifaKwh)
  etapas.push({
    rotulo: 'Energia no mês',
    formula:
      `${entrada.kmPorMes} km ÷ ${numero(centavos(entrada.consumoEletrico))} km/kWh = ` +
      `${numero(kwh)} kWh × ${reais(entrada.tarifaKwh)}`,
    resultado: custoMensalEletrico,
    justificativa:
      'A tarifa é a da sua fatura, e ela muda por distribuidora e por bandeira. Carregar em ' +
      'eletroposto costuma custar bem mais que carregar em casa — se é esse o seu caso, use o ' +
      'preço do posto.',
  })

  const economiaMensal = subtrair(custoMensalCombustao, custoMensalEletrico)
  etapas.push({
    rotulo: economiaMensal >= 0 ? 'Economia por mês com o elétrico' : 'Custo a mais do elétrico',
    formula: `${reais(custoMensalCombustao)} − ${reais(custoMensalEletrico)}`,
    resultado: economiaMensal,
  })

  const economiaAnual = multiplicarPorInteiro(economiaMensal, MESES_NO_ANO)
  const custoPorKmCombustao = proporcao(custoMensalCombustao, 1, entrada.kmPorMes, POLITICA)
  const custoPorKmEletrico = proporcao(custoMensalEletrico, 1, entrada.kmPorMes, POLITICA)

  etapas.push({
    rotulo: 'Custo por quilômetro',
    formula: `${reais(custoPorKmCombustao)} a combustão contra ${reais(custoPorKmEletrico)} elétrico`,
    resultado: subtrair(custoPorKmCombustao, custoPorKmEletrico),
  })

  /**
   * Quantos meses a economia leva para cobrir a diferença de preço na compra.
   *
   * Só existe quando há economia: com o elétrico saindo mais caro para rodar, a
   * diferença nunca se paga, e devolver um número aqui diria o contrário.
   */
  const mesesParaPagarADiferenca =
    entrada.diferencaDePreco > 0 && economiaMensal > 0
      ? Math.ceil(entrada.diferencaDePreco / economiaMensal)
      : 0

  if (mesesParaPagarADiferenca > 0) {
    etapas.push({
      rotulo: 'Meses até a economia cobrir a diferença de preço',
      formula: `${reais(entrada.diferencaDePreco)} ÷ ${reais(economiaMensal)} por mês`,
      resultado: centavos(mesesParaPagarADiferenca * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      justificativa:
        'A conta considera só a economia de energia. Diferenças de manutenção, seguro e perda ' +
        'de valor não entram, e as três costumam pesar mais que o combustível.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }

  return {
    ok: true,
    valores: {
      custoMensalCombustao,
      custoMensalEletrico,
      economiaMensal,
      economiaAnual,
      custoPorKmCombustao,
      custoPorKmEletrico,
      mesesParaPagarADiferenca,
    },
    traco,
  }
}
