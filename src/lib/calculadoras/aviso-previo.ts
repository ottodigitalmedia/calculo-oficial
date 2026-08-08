/**
 * CALC-010 — Aviso prévio proporcional (Lei nº 12.506/2011).
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Ela já existia dentro de CALC-002 e não era encontrável.** A contagem
 * proporcional é feita na rescisão desde T-105, mas quem procura "quantos dias
 * de aviso prévio eu tenho" não quer preencher salário, FGTS e dependentes para
 * descobrir. A regra é a mesma peça de motor — `diasDeAvisoPrevio` —, exposta
 * numa tela que responde a pergunta que a pessoa fez.
 */

import { calcularAvisoPrevio } from '../engine/calculadoras/aviso-previo'
import { basisPoints, centavos } from '../engine/types'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'
import { subtrair } from '../engine/money'
import { formatarData } from '../format/moeda'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Registro montado no módulo adiado — ver a nota em `salario-liquido.ts`. */
const registro = construirRegistro(TRABALHISTA)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const indenizado = texto(valores, 'tipoAviso') !== 'trabalhado'

  const r = calcularAvisoPrevio(
    {
      admissao: texto(valores, 'admissao'),
      desligamento: texto(valores, 'desligamento'),
      salario: centavos(numero(valores, 'salario')),
      quemAvisa: texto(valores, 'quemAvisa') === 'empregado' ? 'empregado' : 'empregador',
      indenizado,
      // Aqui o aviso é sempre integral. A metade do art. 484-A é da extinção
      // por acordo, e mora em CALC-008 — misturar as duas nesta tela faria a
      // calculadora responder uma pergunta que ninguém fez.
      fracaoBp: basisPoints(10_000),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  /**
   * A parcela do acréscimo sai por SUBTRAÇÃO, e não por uma segunda proporção.
   *
   * `proporcao(salario, 30, 30)` mais `proporcao(salario, 15, 30)` pode diferir
   * de `proporcao(salario, 45, 30)` em um centavo de arredondamento — e o
   * detalhamento deixaria de fechar. Ver `ESTADO-DO-PROJETO` §7.12.
   */
  const valorBase = centavos(
    Math.round((v.valorCheio * v.diasBase) / Math.max(1, v.diasTotais)),
  )
  const valorAcrescimo = subtrair(v.valorCheio, valorBase)

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorDevido,
      detalhamento: [
        { rotulo: `Prazo base — ${v.diasBase} dias`, valor: valorBase, sinal: 'neutro' },
        ...(v.diasAcrescidos > 0
          ? ([
              {
                rotulo: `Acréscimo por tempo de casa — ${v.diasAcrescidos} dias`,
                valor: valorAcrescimo,
                sinal: 'neutro',
              },
            ] as const)
          : []),
        { rotulo: 'Valor do aviso prévio', valor: v.valorDevido, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Dias de aviso prévio', valor: `${v.diasTotais} dias` },
        { rotulo: 'Tempo de casa', valor: `${v.anosCompletos} ano(s) completo(s)` },
        ...(indenizado
          ? [{ rotulo: 'Contrato projetado até', valor: formatarData(v.dataProjetada) }]
          : []),
      ],
      notas: [
        ...(v.atingiuTeto
          ? [
              'Você já alcançou o teto legal: o acréscimo de 3 dias por ano cresce até somar ' +
                '90 dias no total, e a partir daí o prazo não aumenta mais, por mais tempo de ' +
                'casa que se tenha.',
            ]
          : []),
        ...(indenizado
          ? [
              'O período do aviso indenizado integra o tempo de serviço para todos os efeitos. ' +
                'É por isso que ele empurra a data de saída e faz diferença nos avos de 13º e ' +
                'de férias — às vezes um avo inteiro a mais.',
            ]
          : [
              'No aviso trabalhado o valor acima não é uma parcela extra da rescisão: ele já é ' +
                'pago como salário do período. A calculadora o mostra para dimensionar o prazo.',
            ]),
      ],
    },
  }
}

export const AVISO_PREVIO: DefinicaoCalculadora = {
  id: 'CALC-010',
  slug: 'aviso-previo-proporcional',
  nome: 'Aviso prévio proporcional',
  linhaDeContexto:
    'Quantos dias de aviso prévio o seu tempo de casa garante — e quanto eles valem.',
  descricaoSeo:
    'Calcule os dias de aviso prévio proporcional pela Lei nº 12.506/2011, com o valor, a projeção do contrato e a norma aplicada no passo a passo.',

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
      id: 'quemAvisa',
      rotulo: 'Quem está avisando',
      tipo: 'selecao',
      padrao: 'empregador',
      opcoes: [
        { valor: 'empregador', rotulo: 'A empresa — dispensa sem justa causa' },
        { valor: 'empregado', rotulo: 'Eu — pedido de demissão' },
      ],
      ajuda: 'O acréscimo por tempo de casa é concedido AO empregado, não contra ele.',
    },
    {
      id: 'tipoAviso',
      rotulo: 'O aviso será',
      tipo: 'selecao',
      padrao: 'indenizado',
      opcoes: [
        { valor: 'indenizado', rotulo: 'Indenizado — não se trabalha o período' },
        { valor: 'trabalhado', rotulo: 'Trabalhado — cumprido normalmente' },
      ],
    },
  ],

  parametrosRequeridos: [
    'aviso-previo-dias-base',
    'aviso-previo-dias-por-ano',
    'aviso-previo-dias-maximo',
  ],

  rotuloResultado: 'Valor do aviso prévio',

  calcular,

  faq: [
    {
      pergunta: 'Como funciona o aviso prévio proporcional?',
      resposta:
        'A Lei nº 12.506/2011 fixa 30 dias para quem tem até um ano de casa e acrescenta 3 dias por ano de serviço na mesma empresa, até o máximo de 90 dias. O teto é alcançado com 20 anos de casa: 30 dias base mais 60 de acréscimo.',
    },
    {
      pergunta: 'O acréscimo vale quando eu peço demissão?',
      resposta:
        'Não. O texto da lei diz que o aviso "será concedido na proporção de 30 dias AOS EMPREGADOS", e o parágrafo único acrescenta dias a esse aviso. Quando é o trabalhador quem pede demissão, o aviso é devido POR ele, e o prazo é o de trinta dias do art. 487, II, da CLT. Aplicar o acréscimo contra quem a lei quis proteger inverteria o sentido dela.',
    },
    {
      pergunta: 'A partir de qual ano começa a contar o acréscimo?',
      resposta:
        'A lei não diz. Este cálculo adota o primeiro ano completo — quem tem 1 ano de casa já soma 3 dias, totalizando 33 —, conforme o entendimento consolidado na Justiça do Trabalho. A memória de cálculo declara essa escolha em vez de escondê-la, porque é o ponto onde calculadoras diferentes divergem.',
    },
    {
      pergunta: 'Por que o aviso indenizado muda a data de saída?',
      resposta:
        'Porque o art. 487, § 1º, da CLT determina que o período do aviso integra o tempo de serviço para todos os efeitos legais. O contrato é projetado até o fim do prazo, mesmo sem trabalho no período — e essa projeção conta avos de 13º e de férias, o que às vezes acrescenta um avo inteiro.',
    },
    {
      pergunta: 'E se o contrato for extinto por acordo?',
      resposta:
        'Aí o aviso prévio indenizado é devido pela metade, pelo art. 484-A, I, "a", da CLT — mas só a verba é reduzida, não o prazo. Use a calculadora de rescisão por acordo mútuo, que já aplica a redução e mostra também a multa do FGTS pela metade e o limite de saque.',
    },
  ],

  relacionadas: ['rescisao-sem-justa-causa', 'rescisao-acordo-mutuo', 'rescisao-pedido-demissao'],
}
