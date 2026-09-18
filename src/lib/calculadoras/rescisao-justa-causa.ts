/**
 * CALC-092 — Rescisão por justa causa.
 *
 * A página existe para responder a uma pergunta de conferência: "o acerto veio
 * muito menor, isso está certo?". Por isso o resultado mostra, com a mesma
 * clareza, o que é devido e o que a justa causa retira — cada exclusão com a
 * norma ao lado, na memória de cálculo.
 *
 * Motor em `engine/calculadoras/justa-causa.ts`.
 */

import { calcularJustaCausa } from '../engine/calculadoras/justa-causa'
import { centavos } from '../engine/types'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { FERIAS_FORA_DO_PRAZO } from '../params/data/ferias-fora-do-prazo'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

const registro = construirRegistro(INSS, IRRF, FERIAS_FORA_DO_PRAZO)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularJustaCausa(
    {
      desligamento: texto(valores, 'desligamento') as DataISO,
      salario: centavos(numero(valores, 'salario')),
      periodosVencidos: numero(valores, 'periodosVencidos'),
      periodosEmDobro: numero(valores, 'periodosEmDobro'),
      dependentes: numero(valores, 'dependentes'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const detalhamento: LinhaDetalhamento[] = [
    { rotulo: 'Saldo de salário', valor: v.saldoSalario, sinal: 'credito' },
    ...(v.feriasVencidas > 0
      ? ([{ rotulo: numero(valores, 'periodosEmDobro') > 0 ? 'Férias vencidas + 1/3, com a dobra' : 'Férias vencidas + 1/3', valor: v.feriasVencidas, sinal: 'credito' }] as const)
      : []),
    ...(v.inss > 0 ? ([{ rotulo: 'INSS sobre o saldo', valor: v.inss, sinal: 'debito' }] as const) : []),
    ...(v.irrf > 0 ? ([{ rotulo: 'Imposto de renda sobre o saldo', valor: v.irrf, sinal: 'debito' }] as const) : []),
    { rotulo: 'Total líquido', valor: v.totalLiquido, sinal: 'neutro' },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.totalLiquido,
      detalhamento,
      destaques: [
        { rotulo: 'Dias trabalhados no mês', valor: `${v.diasTrabalhados}` },
        { rotulo: 'Aviso prévio', valor: 'Não é devido' },
        { rotulo: '13º proporcional', valor: 'Não é devido' },
        { rotulo: 'Férias proporcionais', valor: 'Não são devidas' },
        { rotulo: 'Multa e saque do FGTS', valor: 'Não há' },
      ],
      notas: [
        'A justa causa precisa estar enquadrada em uma das hipóteses do art. 482 da CLT e ser comprovada ' +
          'pelo empregador. Discordando do motivo, o caminho é a Justiça do Trabalho — e a reversão ' +
          'restabelece as verbas da dispensa sem justa causa.',
        'Os depósitos do FGTS continuam na conta vinculada: não há multa nem saque agora, mas o saldo pode ' +
          'ser movimentado nas outras hipóteses da lei.',
        'Não há seguro-desemprego: o programa é do trabalhador dispensado sem justa causa.',
      ],
    },
  }
}

export const RESCISAO_JUSTA_CAUSA: DefinicaoCalculadora = {
  id: 'CALC-092',
  slug: 'rescisao-justa-causa',
  nome: 'Rescisão por justa causa',
  linhaDeContexto: 'O que ainda é devido quando a dispensa é por justa causa — e o que deixa de ser.',
  descricaoSeo:
    'Calcule o acerto da demissão por justa causa: saldo de salário e férias vencidas, com o que a justa causa retira e a norma de cada exclusão.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Último salário bruto',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'desligamento',
      rotulo: 'Data do desligamento',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'O dia do mês decide o saldo de salário.',
    },
    {
      id: 'periodosVencidos',
      rotulo: 'Períodos de férias vencidas',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 5,
      ajuda: 'Períodos de doze meses já completados e ainda não gozados. Zero é o caso mais comum.',
    },
    {
      id: 'periodosEmDobro',
      rotulo: 'Desses, quantos já passaram do prazo para serem tirados',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 5,
      ajuda: 'A empresa tem doze meses, depois de completado cada período, para conceder as férias. Passado o prazo, aquele período é pago em dobro.',
    },
    {
      id: 'dependentes',
      rotulo: 'Dependentes para o imposto de renda',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
    },
  ],

  parametrosRequeridos: [
    'inss-tabela-progressiva',
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
  ],

  rotuloResultado: 'Total líquido estimado',

  calcular,

  faq: [
    {
      pergunta: 'O que o empregado recebe na demissão por justa causa?',
      resposta:
        'O saldo dos dias trabalhados no mês e as férias já adquiridas e não gozadas, com o terço constitucional — o art. 146 da CLT manda pagá-las qualquer que seja a causa da cessação do contrato. Salário e verbas atrasadas continuam devidos normalmente.',
    },
    {
      pergunta: 'Por que não há 13º proporcional nem férias proporcionais?',
      resposta:
        'O art. 3º da Lei nº 4.090/1962 prevê a gratificação proporcional na rescisão "sem justa causa". E a Súmula 171 do TST, que garante as férias proporcionais mesmo com período aquisitivo incompleto, abre exceção expressa para a dispensa por justa causa. São duas exclusões previstas em norma, e não prática de empresa.',
    },
    {
      pergunta: 'O FGTS é perdido?',
      resposta:
        'Não. Os depósitos continuam na conta vinculada. O que não existe é a multa rescisória e o saque agora: o art. 20 da Lei nº 8.036/1990 lista as hipóteses de movimentação, e a dispensa por justa causa não está entre elas. O saldo pode ser movimentado nas demais hipóteses — aposentadoria, doença grave, compra da casa própria, saque-aniversário.',
    },
    {
      pergunta: 'Tem direito a seguro-desemprego?',
      resposta:
        'Não. O art. 3º da Lei nº 7.998/1990 concede o benefício ao trabalhador dispensado sem justa causa. Quem é dispensado por justa causa fica fora do programa.',
    },
    {
      pergunta: 'Quais são as hipóteses de justa causa?',
      resposta:
        'Estão no art. 482 da CLT: ato de improbidade, mau procedimento, negociação habitual sem permissão, condenação criminal transitada em julgado, desídia, embriaguez habitual ou em serviço, violação de segredo da empresa, ato de indisciplina ou de insubordinação, abandono de emprego, ofensas físicas, lesão à honra e prática constante de jogos de azar, entre outras. O enquadramento e a prova são do empregador.',
    },
    {
      pergunta: 'E se a justa causa for injusta?',
      resposta:
        'O caminho é a Justiça do Trabalho. Reconhecida a nulidade, a rescisão passa a ser tratada como dispensa sem justa causa, com aviso prévio, 13º e férias proporcionais, multa do FGTS e liberação do saque. Compare os dois cenários: a diferença entre esta calculadora e a de rescisão sem justa causa é exatamente o que está em discussão.',
    },
  ],

  relacionadas: ['rescisao-sem-justa-causa', 'rescisao-pedido-demissao', 'ferias', 'fgts'],
}
