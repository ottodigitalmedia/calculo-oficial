/**
 * CALC-003 — Rescisão por pedido de demissão.
 *
 * `03-functional-spec` §3.3: "mesma estrutura de CALC-002, com as diferenças".
 * São três, e o documento as escreve com o texto final:
 *
 *   1. `avisoPrevio` passa a "Vou cumprir" / "Não vou cumprir";
 *   2. não cumprindo, o aviso é **descontado** do trabalhador;
 *   3. não há multa de FGTS — e o bloco **não é exibido zerado**, para não
 *      sugerir erro de cálculo onde há ausência de direito.
 *
 * Compartilha o motor de CALC-002. As três diferenças vivem lá, atrás de
 * `modalidade`, porque duas implementações do mesmo cálculo divergem na
 * primeira manutenção — e aqui divergir significa publicar dois números
 * diferentes para a mesma verba.
 *
 * Regras: `RN-018`, `RN-019`.
 */

import { calcularRescisao } from '../engine/calculadoras/rescisao'
import { centavos } from '../engine/types'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'

/**
 * Registro montado aqui, e não recebido de fora.
 *
 * Vive no módulo ADIADO: as tabelas legais só entram no navegador junto com o
 * cálculo que as usa, e não no pacote estático de toda rota. Ver
 * `tipos.ts`, `FuncaoCalculo`.
 */
const registro = construirRegistro(INSS, IRRF, TRABALHISTA)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularRescisao(
    {
      admissao: texto(valores, 'admissao') as never,
      desligamento: texto(valores, 'desligamento') as never,
      salario: centavos(numero(valores, 'salario')),
      modalidade: 'pedido-demissao',
      avisoPrevio: texto(valores, 'avisoPrevio') === 'nao-cumprido' ? 'nao-cumprido' : 'cumprido',
      temFeriasVencidas: texto(valores, 'feriasVencidas') === 'sim',
      // O saldo do FGTS não entra: sem multa, ele não afeta nenhuma verba.
      saldoFgtsInformado: centavos(0),
      dependentes: numero(valores, 'dependentes'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.totalLiquido,
      detalhamento: [
        { rotulo: 'Saldo de salário', valor: v.saldoSalario, sinal: 'credito' },
        { rotulo: '13º salário proporcional', valor: v.decimoTerceiro, sinal: 'credito' },
        ...(v.feriasVencidas > 0
          ? ([{ rotulo: 'Férias vencidas + 1/3', valor: v.feriasVencidas, sinal: 'credito' }] as const)
          : []),
        { rotulo: 'Férias proporcionais + 1/3', valor: v.feriasProporcionais, sinal: 'credito' },
        // §3.3: rótulo literal, e em vermelho — `sinal: 'debito'` é o que
        // produz o sinal de menos E a cor, sem depender só da cor (§2.1).
        ...(v.descontoAvisoPrevio > 0
          ? ([
              {
                rotulo: 'Desconto de aviso prévio não cumprido',
                valor: v.descontoAvisoPrevio,
                sinal: 'debito',
              },
            ] as const)
          : []),
        { rotulo: 'Contribuição previdenciária (INSS)', valor: v.inss, sinal: 'debito' },
        { rotulo: 'Imposto de Renda retido na fonte', valor: v.irrf, sinal: 'debito' },
        { rotulo: 'Total líquido estimado', valor: v.totalLiquido, sinal: 'neutro' },
      ],
      destaques: [{ rotulo: 'Aviso prévio', valor: `${v.diasAviso} dias` }],
      notas: [
        // Texto final de §3.3.
        'No pedido de demissão não há multa de FGTS nem direito ao saque, salvo nas hipóteses previstas em lei.',
        'A memória de cálculo mostra, verba a verba, se incide contribuição previdenciária e ' +
          'imposto de renda, com o link para a norma ou a súmula que fundamenta cada decisão.',
      ],
    },
  }
}

export const RESCISAO_PEDIDO_DEMISSAO: DefinicaoCalculadora = {
  id: 'CALC-003',
  slug: 'rescisao-pedido-demissao',
  nome: 'Rescisão — pedido de demissão',
  linhaDeContexto:
    'Quanto você recebe ao pedir demissão — e o que é descontado se não cumprir o aviso.',
  descricaoSeo:
    'Calcule as verbas do pedido de demissão: saldo de salário, 13º proporcional, férias e o desconto do aviso não cumprido. Veja o passo a passo, com a norma de cada incidência.',

  campos: [
    { id: 'admissao', rotulo: 'Data de admissão', tipo: 'data', obrigatorio: true },
    { id: 'desligamento', rotulo: 'Data do desligamento', tipo: 'data', obrigatorio: true },
    {
      id: 'salario',
      rotulo: 'Último salário bruto',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'avisoPrevio',
      rotulo: 'Aviso prévio',
      tipo: 'selecao',
      padrao: 'cumprido',
      opcoes: [
        { valor: 'cumprido', rotulo: 'Vou cumprir' },
        { valor: 'nao-cumprido', rotulo: 'Não vou cumprir' },
      ],
      ajuda: 'Não cumprindo, o empregador pode descontar os dias correspondentes.',
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
      id: 'dependentes',
      rotulo: 'Número de dependentes',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
    },
  ],

  // Sem os parâmetros de FGTS: no pedido de demissão não há multa, e exigir a
  // vigência deles restringiria o período aceito sem nenhum ganho.
  parametrosRequeridos: [
    'inss-tabela-progressiva',
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
    'aviso-previo-dias-base',
  ],

  rotuloResultado: 'Total líquido estimado da rescisão',

  calcular,

  faq: [
    {
      pergunta: 'Pedindo demissão eu perco as férias proporcionais?',
      resposta:
        'Não. A Súmula 261 do TST firmou que o empregado que se demite antes de completar 12 meses de serviço tem direito a férias proporcionais — e, com mais de 12 meses, o direito decorre do próprio art. 146 da CLT. O cálculo inclui as férias proporcionais com o terço constitucional.',
    },
    {
      pergunta: 'E o 13º salário, é devido quando eu peço demissão?',
      resposta:
        'Sim. A Súmula 157 do TST firmou que a gratificação natalina da Lei nº 4.090/1962 é devida na resilição contratual de iniciativa do empregado. O cálculo apura os avos proporcionais, contando como avo integral o mês com 15 dias ou mais de contrato.',
    },
    {
      pergunta: 'Quanto é descontado se eu não cumprir o aviso prévio?',
      resposta:
        'O art. 487, § 2º, da CLT dá ao empregador o direito de descontar os salários correspondentes ao prazo do aviso. O cálculo usa 30 dias: o acréscimo de 3 dias por ano da Lei nº 12.506/2011 é concedido AO empregado, e no pedido de demissão o aviso é devido POR ele. A memória declara essa leitura.',
    },
    {
      pergunta: 'Por que não aparece a multa de 40% do FGTS?',
      resposta:
        'Porque ela não existe nesta modalidade. A Lei nº 8.036/1990, art. 18, § 1º, prevê a multa apenas na despedida pelo empregador sem justa causa. O bloco não é exibido zerado de propósito: um valor de R$ 0,00 ao lado das outras verbas se lê como erro de cálculo, e não como ausência de direito.',
    },
    {
      pergunta: 'Posso sacar o FGTS pedindo demissão?',
      resposta:
        'Em regra não. O saque é previsto para hipóteses específicas da lei — entre elas a dispensa sem justa causa —, e o pedido de demissão não está entre as ordinárias. Esta calculadora não estima saque; ela apura as verbas rescisórias devidas.',
    },
  ],

  relacionadas: ['rescisao-sem-justa-causa', 'salario-liquido', 'irrf'],
}
