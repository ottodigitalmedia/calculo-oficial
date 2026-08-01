/**
 * CALC-013 — Banco de horas e jornada acumulada.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **`RN-028` vale em dobro aqui**, e `docs/18` já avisava por quê: a regra de
 * compensação depende da norma coletiva da categoria, que este produto não
 * conhece. O prazo mostrado é o teto da lei; o do contrato pode ser menor.
 */

import { calcularBancoDeHoras } from '../engine/calculadoras/banco-de-horas'
import { basisPoints, centavos } from '../engine/types'
import { formatarNumero, formatarPercentual, formatarReal } from '../format/moeda'
import { BANCO_DE_HORAS as PARAMS } from '../params/data/banco-de-horas'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** `TRABALHISTA` entra pelo adicional de hora extra, que já era parâmetro. */
const registro = construirRegistro(PARAMS, TRABALHISTA)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const escolha = texto(valores, 'modalidade')
  const modalidade =
    escolha === 'individual-escrito'
      ? 'individual-escrito'
      : escolha === 'mesmo-mes'
        ? 'mesmo-mes'
        : 'coletivo'

  const r = calcularBancoDeHoras(
    {
      salario: centavos(numero(valores, 'salario')),
      jornadaSemanal: numero(valores, 'jornadaSemanal'),
      horasPositivas: numero(valores, 'horasPositivas'),
      horasNegativas: numero(valores, 'horasNegativas'),
      modalidade,
      adicionalPactuado: basisPoints(numero(valores, 'adicional')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores
  const positivo = v.saldoHoras > 0

  const destaques: Destaque[] = [
    {
      rotulo: positivo ? 'Saldo a seu favor' : v.saldoHoras < 0 ? 'Horas a cumprir' : 'Saldo',
      valor: `${formatarNumero(Math.abs(v.saldoHoras))} h`,
    },
    { rotulo: 'Prazo máximo para compensar', valor: `${v.prazoEmMeses} mês(es)` },
    { rotulo: 'Valor da hora com adicional', valor: formatarReal(v.valorHoraComAdicional) },
    { rotulo: 'Adicional aplicado', valor: formatarPercentual(v.adicionalAplicado) },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorSeNaoCompensado,
      detalhamento: [
        { rotulo: 'Valor da hora normal', valor: v.valorHoraNormal, sinal: 'neutro' },
        { rotulo: 'Valor da hora com adicional', valor: v.valorHoraComAdicional, sinal: 'neutro' },
        { rotulo: 'Saldo se pago em rescisão', valor: v.valorSeNaoCompensado, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        'O prazo acima é o TETO da lei. A convenção ou o acordo coletivo da sua categoria pode ' +
          'fixar prazo menor, limite diário distinto e adicional maior — e prevalece sobre o que ' +
          'está aqui. Este cálculo não conhece a sua norma coletiva.',
        ...(positivo
          ? [
              'Saldo positivo não compensado dentro do prazo não desaparece: na rescisão, o art. ' +
                '59, § 3º, da CLT manda pagá-lo sobre a remuneração da data da saída, com ' +
                'adicional. É esse o valor em destaque.',
            ]
          : v.saldoHoras < 0
            ? [
                'Saldo negativo é tempo a cumprir, não dívida em dinheiro. O art. 59-B limita a ' +
                  'consequência do descumprimento das exigências de compensação ao adicional, e ' +
                  'não à repetição das horas.',
              ]
            : []),
        'Prestar hora extra com habitualidade não descaracteriza o banco de horas — é o que diz o ' +
          'parágrafo único do art. 59-B, incluído pela Reforma Trabalhista.',
      ],
    },
  }
}

export const BANCO_DE_HORAS: DefinicaoCalculadora = {
  id: 'CALC-013',
  slug: 'banco-de-horas',
  nome: 'Banco de horas',
  linhaDeContexto: 'Quanto tempo você tem para compensar — e quanto o saldo vale se não compensar.',
  descricaoSeo:
    'Calcule o saldo do banco de horas, o prazo legal para compensá-lo conforme o tipo de acordo e quanto ele vale em dinheiro na rescisão, pelo art. 59 da CLT.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'jornadaSemanal',
      rotulo: 'Jornada semanal, em horas',
      tipo: 'inteiro',
      padrao: 44,
      minimo: 1,
      maximo: 44,
      ajuda: 'O divisor mensal é esta jornada multiplicada por 5.',
    },
    {
      id: 'horasPositivas',
      rotulo: 'Horas de crédito acumuladas',
      tipo: 'decimal',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000,
      ajuda: 'Horas que você trabalhou além da jornada. Use vírgula para a fração: 12,5.',
    },
    {
      id: 'horasNegativas',
      rotulo: 'Horas de débito acumuladas',
      tipo: 'decimal',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000,
      ajuda: 'Horas que você deve — faltas e saídas antecipadas lançadas no banco.',
    },
    {
      id: 'modalidade',
      rotulo: 'Como o banco de horas foi pactuado',
      tipo: 'selecao',
      padrao: 'coletivo',
      opcoes: [
        { valor: 'coletivo', rotulo: 'Acordo ou convenção coletiva — até 1 ano' },
        { valor: 'individual-escrito', rotulo: 'Acordo individual escrito — até 6 meses' },
        { valor: 'mesmo-mes', rotulo: 'Acordo individual tácito — no mesmo mês' },
      ],
    },
    {
      id: 'adicional',
      rotulo: 'Adicional da hora extra, se a norma coletiva fixar outro',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 30_000,
      ajuda: 'Em branco, o cálculo usa o mínimo legal de 50%.',
    },
  ],

  parametrosRequeridos: [
    'banco-horas-prazo-coletivo',
    'hora-extra-adicional-minimo',
  ],

  rotuloResultado: 'Saldo se pago em rescisão',

  calcular,

  avisoAdicional:
    'A norma coletiva da sua categoria pode fixar prazo de compensação menor e adicional maior que os da lei, e ela prevalece. Este cálculo não a conhece.',

  faq: [
    {
      pergunta: 'Qual é o prazo para compensar o banco de horas?',
      resposta:
        'Depende de como ele foi pactuado. Por acordo ou convenção coletiva, até um ano — art. 59, § 2º, da CLT. Por acordo individual escrito, até seis meses — § 5º, incluído pela Reforma Trabalhista. Por acordo individual tácito ou escrito para compensação simples, no mesmo mês — § 6º. Estes são os tetos legais; a norma da sua categoria pode ser mais restritiva.',
    },
    {
      pergunta: 'Perco as horas se o prazo acabar sem compensar?',
      resposta:
        'Não. Se o contrato terminar sem a compensação integral, o art. 59, § 3º, garante o pagamento das horas não compensadas, calculadas sobre a remuneração da data da rescisão e com o adicional. É por isso que o resultado principal desta calculadora é justamente esse valor.',
    },
    {
      pergunta: 'E se o saldo estiver negativo?',
      resposta:
        'Saldo negativo é tempo a cumprir, não dívida em dinheiro. O art. 59-B determina que o descumprimento das exigências legais de compensação não gera repetição do pagamento das horas, sendo devido apenas o adicional, desde que não ultrapassada a duração máxima semanal. Descontos de horas devidas em rescisão dependem do que a norma coletiva prevê.',
    },
    {
      pergunta: 'Fazer hora extra todo mês invalida o banco de horas?',
      resposta:
        'Não. O parágrafo único do art. 59-B é expresso: a prestação de horas extras habituais não descaracteriza o acordo de compensação de jornada nem o banco de horas. Antes da Reforma Trabalhista de 2017 essa era uma das discussões mais frequentes na Justiça do Trabalho.',
    },
    {
      pergunta: 'Por que o divisor é a jornada vezes cinco?',
      resposta:
        'Porque o mês comercial tem trinta dias e a semana da CLT tem seis dias úteis para efeito de cálculo: trinta dividido por seis dá cinco. Com jornada de 44 horas o divisor é 220; com 40 horas, 200 — que é exatamente o divisor da Súmula 431 do Tribunal Superior do Trabalho.',
    },
    {
      pergunta: 'O banco de horas pode ultrapassar dez horas por dia?',
      resposta:
        'Não. O art. 59, § 2º, condiciona a compensação a que não seja ultrapassado o limite máximo de dez horas diárias. O banco permite distribuir a jornada ao longo do período, não estender o dia sem limite. Esta calculadora trata do saldo acumulado e não verifica o limite diário.',
    },
  ],

  relacionadas: ['horas-extras', 'rescisao-sem-justa-causa', 'salario-liquido'],
}
