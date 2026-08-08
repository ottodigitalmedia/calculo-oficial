/**
 * CALC-012 — Rescisão do empregado doméstico (LC 150/2015).
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **O que muda em relação à CLT é uma coisa só, e é grande:** não existe multa
 * de 40%. O art. 22 da Lei Complementar nº 150/2015 afasta expressamente os
 * §§ 1º a 3º do art. 18 da Lei nº 8.036 e põe no lugar um fundo de 3,2% da
 * remuneração, depositado mês a mês em variação distinta da conta vinculada.
 *
 * Quem movimenta esse fundo depende do motivo da saída — § 1º —, e é isso que a
 * calculadora responde. Tudo o mais é idêntico, inclusive as incidências de
 * INSS e IRRF pesquisadas em `docs/19-incidencias-verbas-rescisorias.md`.
 */

import { calcularRescisao } from '../engine/calculadoras/rescisao'
import { centavos } from '../engine/types'
import { formatarData, formatarReal } from '../format/moeda'
import { numero, texto, type DefinicaoCalculadora, type Destaque, type FuncaoCalculo } from './tipos'

import { DOMESTICO } from '../params/data/domestico'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'

/** `TRABALHISTA` entra pela alíquota de FGTS, que é a mesma do art. 34, IV. */
const registro = construirRegistro(INSS, IRRF, TRABALHISTA, DOMESTICO)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const motivo = texto(valores, 'motivo')

  const r = calcularRescisao(
    {
      admissao: texto(valores, 'admissao'),
      desligamento: texto(valores, 'desligamento'),
      salario: centavos(numero(valores, 'salario')),
      modalidade: motivo === 'pedido-demissao' ? 'pedido-demissao' : 'sem-justa-causa',
      regime: 'domestico',
      avisoPrevio:
        motivo === 'pedido-demissao'
          ? texto(valores, 'avisoPrevio') === 'nao-cumprido'
            ? 'nao-cumprido'
            : 'cumprido'
          : texto(valores, 'avisoPrevio') === 'trabalhado'
            ? 'trabalhado'
            : 'indenizado',
      temFeriasVencidas: texto(valores, 'feriasVencidas') === 'sim',
      saldoFgtsInformado: centavos(numero(valores, 'saldoFgts')),
      dependentes: numero(valores, 'dependentes'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Aviso prévio', valor: `${v.diasAviso} dias` },
    {
      rotulo: 'Indenização compensatória (3,2%)',
      valor: v.indenizacaoLiberada
        ? formatarReal(v.indenizacaoCompensatoria)
        : 'Movimentada pelo empregador',
    },
    ...(v.dataProjetada !== texto(valores, 'desligamento')
      ? [{ rotulo: 'Tempo de serviço projetado até', valor: formatarData(v.dataProjetada) }]
      : []),
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.totalLiquido,
      detalhamento: [
        { rotulo: 'Saldo de salário', valor: v.saldoSalario, sinal: 'credito' },
        ...(v.avisoPrevioValor > 0
          ? ([{ rotulo: 'Aviso prévio indenizado', valor: v.avisoPrevioValor, sinal: 'credito' }] as const)
          : []),
        ...(v.descontoAvisoPrevio > 0
          ? ([
              {
                rotulo: 'Desconto de aviso não cumprido',
                valor: v.descontoAvisoPrevio,
                sinal: 'debito',
              },
            ] as const)
          : []),
        { rotulo: '13º salário proporcional', valor: v.decimoTerceiro, sinal: 'credito' },
        ...(v.feriasVencidas > 0
          ? ([{ rotulo: 'Férias vencidas + 1/3', valor: v.feriasVencidas, sinal: 'credito' }] as const)
          : []),
        { rotulo: 'Férias proporcionais + 1/3', valor: v.feriasProporcionais, sinal: 'credito' },
        { rotulo: 'Contribuição previdenciária (INSS)', valor: v.inss, sinal: 'debito' },
        { rotulo: 'Imposto de Renda retido na fonte', valor: v.irrf, sinal: 'debito' },
        { rotulo: 'Total líquido estimado', valor: v.totalLiquido, sinal: 'neutro' },
      ],
      destaques,
      notas: [
        v.indenizacaoLiberada
          ? 'A indenização compensatória não entra no total acima porque não é paga na rescisão: ' +
            'ela já está depositada na conta vinculada, em variação distinta, e é sacada por você ' +
            'na saída. O valor mostrado é uma estimativa dos 3,2% depositados mês a mês.'
          : 'No pedido de demissão, os 3,2% depositados ao longo do contrato são movimentados ' +
            'pelo empregador, pelo art. 22, § 1º, da Lei Complementar nº 150/2015. Eles não são ' +
            'perdidos por você — nunca foram seus nessa hipótese.',
        'No trabalho doméstico não existe multa de 40% do FGTS. Ela foi substituída por este ' +
          'fundo, formado mês a mês. Quem procurar por "multa de 40% doméstica" não vai achar, ' +
          'porque a lei fez outra escolha.',
        'A memória de cálculo mostra, verba a verba, se incide contribuição previdenciária e ' +
          'imposto de renda, com o link para a norma ou a tese que fundamenta cada decisão.',
      ],
    },
  }
}

export const RESCISAO_DOMESTICO: DefinicaoCalculadora = {
  id: 'CALC-012',
  slug: 'rescisao-domestico',
  nome: 'Rescisão — empregado doméstico',
  linhaDeContexto:
    'Quanto se recebe na saída do trabalho doméstico — sem multa de 40%, com o fundo de 3,2%.',
  descricaoSeo:
    'Calcule a rescisão do empregado doméstico pela LC nº 150/2015: saldo, aviso prévio, 13º, férias e a indenização que substitui a multa do FGTS.',

  campos: [
    {
      id: 'admissao',
      rotulo: 'Data de admissão',
      tipo: 'data',
      obrigatorio: true,
    },
    {
      id: 'desligamento',
      rotulo: 'Data do desligamento',
      tipo: 'data',
      obrigatorio: true,
    },
    {
      id: 'salario',
      rotulo: 'Último salário bruto',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'motivo',
      rotulo: 'Motivo da saída',
      tipo: 'selecao',
      padrao: 'sem-justa-causa',
      opcoes: [
        { valor: 'sem-justa-causa', rotulo: 'Dispensa sem justa causa' },
        { valor: 'pedido-demissao', rotulo: 'Pedido de demissão' },
      ],
      ajuda: 'É o motivo que decide quem movimenta o fundo de 3,2%.',
    },
    {
      id: 'avisoPrevio',
      rotulo: 'Aviso prévio',
      tipo: 'selecao',
      padrao: 'indenizado',
      opcoes: [
        { valor: 'indenizado', rotulo: 'Indenizado ou não cumprido' },
        { valor: 'trabalhado', rotulo: 'Trabalhado ou cumprido' },
      ],
    },
    {
      id: 'feriasVencidas',
      rotulo: 'Tem férias vencidas não gozadas?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não' },
        { valor: 'sim', rotulo: 'Sim' },
      ],
    },
    {
      id: 'saldoFgts',
      rotulo: 'Saldo do FGTS (se souber)',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Deixe em branco para estimar. O fundo de 3,2% fica em conta separada desta.',
    },
    {
      id: 'dependentes',
      rotulo: 'Número de dependentes',
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
    'fgts-aliquota-deposito',
    'domestico-indenizacao-compensatoria',
    'domestico-aviso-previo-dias-base',
  ],

  rotuloResultado: 'Total líquido estimado da rescisão',

  calcular,

  avisoAdicional:
    'A indenização compensatória de 3,2% e o saldo do FGTS ficam em contas vinculadas distintas e são sacados na rescisão — eles não entram no valor pago diretamente pelo empregador.',

  faq: [
    {
      pergunta: 'O doméstico tem direito à multa de 40% do FGTS?',
      resposta:
        'Não, e não é omissão: é escolha da lei. O art. 22 da Lei Complementar nº 150/2015 afasta expressamente os §§ 1º a 3º do art. 18 da Lei nº 8.036 — que são justamente os da multa — e cria no lugar um depósito mensal de 3,2% da remuneração, destinado à indenização pela perda do emprego. O dinheiro existe; ele só é formado ao longo do contrato, e não cobrado de uma vez na saída.',
    },
    {
      pergunta: 'Se eu pedir demissão, perco os 3,2%?',
      resposta:
        'Você não perde: eles nunca foram seus nessa hipótese. O art. 22, § 1º, determina que no pedido de demissão, na justa causa, no fim de contrato por prazo determinado, na aposentadoria e no falecimento, quem movimenta os valores é o empregador. Na culpa recíproca, o § 2º divide o fundo meio a meio.',
    },
    {
      pergunta: 'Por que a indenização não entra no total da rescisão?',
      resposta:
        'Porque ela não é paga pelo empregador na saída — já está depositada. Os 3,2% vão para a conta vinculada mês a mês, em variação distinta daquela do FGTS (art. 22, § 3º), e são movimentados na rescisão. O total desta calculadora é o que o empregador paga diretamente; o destaque mostra o fundo em separado.',
    },
    {
      pergunta: 'O aviso prévio do doméstico é proporcional?',
      resposta:
        'É. O art. 23, § 2º, acrescenta 3 dias por ano de serviço ao prazo de 30 dias, até o máximo de 90 — mesmo desenho da Lei nº 12.506/2011, com fundamento próprio. O acréscimo é do aviso devido AO empregado; quando é ele quem pede demissão, o prazo é o de trinta dias, e a falta de aviso dá ao empregador o direito de descontar os salários correspondentes (§ 4º).',
    },
    {
      pergunta: 'Quanto o empregador doméstico recolhe por mês?',
      resposta:
        'Pelo Simples Doméstico, do art. 34, o recolhimento único reúne a contribuição do empregado (8% a 11%), a contribuição patronal de 8%, 0,8% de seguro contra acidentes, 8% de FGTS, os 3,2% da indenização compensatória e o imposto de renda retido, se incidente. Repare que a patronal do doméstico é de 8%, e não os 20% do regime geral.',
    },
    {
      pergunta: 'O valor do FGTS aqui é exato?',
      resposta:
        'Não, é estimativa — e o fundo de 3,2% também. Os dois saldos reais incluem correção monetária e juros e constam apenas do extrato das contas vinculadas. Informar o saldo do FGTS torna essa parte exata; o fundo de 3,2% fica em conta separada e continua estimado a partir da remuneração.',
    },
  ],

  relacionadas: ['rescisao-sem-justa-causa', 'fgts', 'aviso-previo-proporcional'],
}
