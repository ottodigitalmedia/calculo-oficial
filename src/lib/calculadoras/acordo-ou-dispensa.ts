/**
 * CALC-076 — Acordo mútuo ou dispensa sem justa causa.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1 — o mesmo caminho de CALC-008 e
 * CALC-060.
 *
 * **Entrou no catálogo por decisão do mantenedor, em 07/08/2026.** Estava
 * listada em `ESTADO-DO-PROJETO` §8.6 como pendente de decisão, porque não tinha
 * ID atribuído, e `CLAUDE.md` reserva isso ao mantenedor.
 *
 * **Não colide com `§14`.** A categoria jurídico-documental excluída é a de
 * *gerar* documentos — contratos, distratos, acordos. Calcular o valor de uma
 * rescisão por acordo já está no ar desde CALC-008; comparar dois cálculos é a
 * mesma classe, e não a excluída.
 *
 * **O aviso próprio existe por uma razão que não é de cálculo.** O acordo do
 * art. 484-A depende das duas partes: não é opção que o trabalhador exerce
 * sozinho. E combinar uma dispensa para registrá-la como acordo — ou o inverso —
 * é fraude contra o FGTS e contra o Programa do Seguro-Desemprego. Uma tela que
 * põe dois números lado a lado convida à leitura de "qual escolher", e a
 * resposta honesta é que a escolha não está inteira na mão de quem pergunta.
 */

import { calcularAcordoOuDispensa } from '../engine/calculadoras/acordo-ou-dispensa'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { SEGURO_DESEMPREGO } from '../params/data/seguro-desemprego'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'

/** Registro montado no módulo adiado — ver a nota em `rescisao-sem-justa-causa.ts`. */
const registro = construirRegistro(INSS, IRRF, TRABALHISTA, SEGURO_DESEMPREGO)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const solicitacao = texto(valores, 'solicitacaoSeguro')

  const r = calcularAcordoOuDispensa(
    {
      admissao: texto(valores, 'admissao'),
      desligamento: texto(valores, 'desligamento'),
      salario: centavos(numero(valores, 'salario')),
      avisoPrevio: texto(valores, 'avisoPrevio') === 'trabalhado' ? 'trabalhado' : 'indenizado',
      temFeriasVencidas: texto(valores, 'feriasVencidas') === 'sim',
      saldoFgtsInformado: centavos(numero(valores, 'saldoFgts')),
      dependentes: numero(valores, 'dependentes'),
      solicitacaoSeguro:
        solicitacao === 'segunda' || solicitacao === 'terceira-ou-mais'
          ? solicitacao
          : 'primeira',
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
      principal: v.diferenca,
      detalhamento: [
        {
          rotulo: 'Dispensa — rescisão líquida',
          valor: v.dispensa.rescisaoLiquida,
          sinal: 'credito',
        },
        {
          rotulo: `Dispensa — FGTS liberado (${formatarPercentual(v.dispensa.detalhe.limiteSaqueBp)})`,
          valor: v.dispensa.fgtsSacavel,
          sinal: 'credito',
        },
        ...(v.seguro
          ? ([
              {
                rotulo: `Dispensa — seguro-desemprego (${v.seguro.numeroDeParcelas} parcelas)`,
                valor: v.dispensa.seguroDesemprego,
                sinal: 'credito',
              },
            ] as const)
          : []),
        { rotulo: 'Dispensa — total disponível', valor: v.dispensa.total, sinal: 'neutro' },
        {
          rotulo: 'Acordo — rescisão líquida',
          valor: v.acordo.rescisaoLiquida,
          sinal: 'credito',
        },
        {
          rotulo: `Acordo — FGTS liberado (${formatarPercentual(v.acordo.detalhe.limiteSaqueBp)})`,
          valor: v.acordo.fgtsSacavel,
          sinal: 'credito',
        },
        { rotulo: 'Acordo — total disponível', valor: v.acordo.total, sinal: 'neutro' },
        { rotulo: 'Diferença', valor: v.diferenca, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Dispensa sem justa causa', valor: formatarReal(v.dispensa.total) },
        { rotulo: 'Acordo mútuo', valor: formatarReal(v.acordo.total) },
        {
          rotulo: 'Seguro-desemprego no acordo',
          valor: 'Vedado pelo art. 484-A, § 2º',
        },
        {
          rotulo: 'Aviso prévio',
          valor: `${v.dispensa.detalhe.diasAviso} dias nos dois caminhos`,
        },
      ],
      notas: [
        'O acordo depende das DUAS partes. Ele não é uma opção que o trabalhador exerce ' +
          'sozinho, e combinar uma dispensa para registrá-la como acordo — ou o contrário — é ' +
          'fraude contra o FGTS e contra o Programa do Seguro-Desemprego.',
        ...(v.seguro
          ? [
              /**
               * CALCULADA, e não generalizada.
               *
               * A divisão entre as duas parcelas INVERTE conforme o salário — o
               * seguro-desemprego tem teto e as reduções não —, e a primeira
               * versão desta nota afirmava que o benefício era sempre a maior
               * parte. Medido, isso é falso já em R$ 8.000,00 de salário. A
               * tela tem os dois números; usá-los custa menos que acertar a
               * generalização.
               */
              v.dispensa.seguroDesemprego > v.reducaoNasVerbas
                ? `Neste caso a maior parte da diferença — ${formatarReal(v.dispensa.seguroDesemprego)} ` +
                  `de ${formatarReal(v.diferenca)} — é o seguro-desemprego, e não as verbas. ` +
                  'Ele não aparece em nenhuma linha da rescisão, e é o custo do acordo que passa ' +
                  'mais despercebido.'
                : `Neste caso a maior parte da diferença — ${formatarReal(v.reducaoNasVerbas)} de ` +
                  `${formatarReal(v.diferenca)} — está nas verbas e no FGTS retido, e não no ` +
                  'seguro-desemprego. O benefício tem teto, então ele pesa relativamente menos ' +
                  'conforme o salário sobe.',
            ]
          : [
              'O vínculo apurado não alcança o mínimo legal para o seguro-desemprego, então o ' +
                'benefício não entra em nenhum dos dois caminhos — e a vedação do acordo deixa ' +
                'de pesar nesta comparação. Se você teve outros vínculos nos últimos três anos, ' +
                'use a calculadora de seguro-desemprego, onde os meses são campo próprio.',
            ]),
        `Os ${formatarReal(v.fgtsRetidoNoAcordo)} do FGTS que ficam retidos no acordo NÃO se ` +
          'perdem: continuam na conta vinculada e podem ser sacados nas hipóteses gerais da ' +
          'Lei nº 8.036/1990.',
        'O FGTS liberado não é dinheiro novo — é saldo que já era seu. O que muda entre os ' +
          'caminhos é o acesso, e por isso ele entra nos dois totais.',
        ...(v.fgtsEstimado
          ? [
              'O saldo do FGTS foi ESTIMADO a partir do salário informado. O saldo real inclui ' +
                'correção monetária e juros e consta do extrato da conta vinculada — informe-o ' +
                'para um resultado exato.',
            ]
          : []),
      ],
    },
  }
}

export const ACORDO_OU_DISPENSA: DefinicaoCalculadora = {
  id: 'CALC-076',
  slug: 'acordo-ou-dispensa',
  nome: 'Acordo mútuo ou dispensa',
  linhaDeContexto:
    'Quanto entra em cada caminho — com o seguro-desemprego, que é onde mora a maior diferença.',
  descricaoSeo:
    'Compare a rescisão por acordo mútuo (art. 484-A da CLT) com a dispensa sem justa causa: verbas, multa do FGTS, limite de saque e o seguro-desemprego que o acordo veda.',

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
      id: 'avisoPrevio',
      rotulo: 'Aviso prévio',
      tipo: 'selecao',
      padrao: 'indenizado',
      opcoes: [
        { valor: 'indenizado', rotulo: 'Indenizado — não vou trabalhar o aviso' },
        { valor: 'trabalhado', rotulo: 'Trabalhado' },
      ],
      ajuda:
        'No acordo, o aviso INDENIZADO é devido pela metade (art. 484-A, I, "a"). O trabalhado é integral nos dois caminhos.',
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
      rotulo: 'Saldo do FGTS (opcional)',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda:
        'Está no extrato da conta vinculada. Se ficar em branco, o saldo é estimado a partir do salário — e o resultado fica aproximado.',
    },
    {
      id: 'solicitacaoSeguro',
      rotulo: 'Seguro-desemprego — qual solicitação seria',
      tipo: 'selecao',
      padrao: 'primeira',
      opcoes: [
        { valor: 'primeira', rotulo: 'Primeira — nunca recebi' },
        { valor: 'segunda', rotulo: 'Segunda' },
        { valor: 'terceira-ou-mais', rotulo: 'Terceira ou mais' },
      ],
      ajuda: 'O número de parcelas e o tempo mínimo de vínculo mudam conforme a solicitação.',
    },
    {
      id: 'dependentes',
      rotulo: 'Número de dependentes',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
      ajuda: 'Cada dependente reduz a base do Imposto de Renda sobre as verbas tributáveis.',
    },
  ],

  /**
   * A UNIÃO dos três conjuntos que a comparação consulta — não a interseção.
   *
   * A cobertura combinada é o que decide os anos que o seletor oferece e o que
   * bloqueia por `RN-003`. Declarar de menos abriria um ano em que um dos lados
   * não calcula; declarar parâmetro inexistente passaria despercebido e mediria
   * cobertura errada em silêncio. A lista abaixo é a de CALC-002 mais a de
   * CALC-008 mais a de CALC-009, conferida contra os três arquivos.
   */
  parametrosRequeridos: [
    'inss-tabela-progressiva',
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
    'fgts-aliquota-deposito',
    'fgts-multa-sem-justa-causa',
    'fgts-multa-acordo-mutuo',
    'fgts-saque-acordo-mutuo',
    'aviso-previo-dias-base',
    'aviso-previo-fracao-acordo',
    'seguro-desemprego-faixa-1-limite',
    'seguro-desemprego-faixa-2-limite',
    'seguro-desemprego-teto',
    'seguro-desemprego-meses-minimos-1a',
    'salario-minimo',
  ],

  rotuloResultado: 'Diferença a favor da dispensa',

  calcular,

  faq: [
    {
      pergunta: 'Por que a diferença é maior do que a soma das reduções das verbas?',
      resposta:
        'Porque há uma quarta perda que não aparece em verba nenhuma. O acordo reduz duas coisas visíveis — o aviso prévio indenizado e a multa do FGTS, ambos pela metade — e limita o saque do fundo a 80%. Mas ele também veda o seguro-desemprego, e esse valor não está em nenhuma linha da rescisão. Qual das duas partes pesa mais depende do salário: o seguro-desemprego tem teto, e as reduções do FGTS crescem junto com a remuneração. Em salários mais baixos o benefício costuma ser a maior parte da diferença; em salários altos, as verbas. O resultado desta calculadora diz qual é o seu caso, com os dois números separados.',
    },
    {
      pergunta: 'Eu posso escolher entre acordo e dispensa?',
      resposta:
        'Não sozinho. O acordo do art. 484-A da CLT depende das duas partes: empregado e empregador precisam concordar em encerrar o contrato dessa forma. A dispensa sem justa causa é decisão do empregador. Esta calculadora mostra quanto entra em cada caminho para você avaliar uma proposta que já esteja na mesa, e não para escolher um deles à vontade.',
    },
    {
      pergunta: 'E se combinarmos uma dispensa e registrarmos como acordo, ou o contrário?',
      resposta:
        'É fraude. Registrar como acordo uma dispensa real libera 20% a mais de FGTS e reduz a multa devida pelo empregador; registrar como dispensa um acordo real dá acesso indevido ao seguro-desemprego. Nos dois sentidos há prejuízo ao FGTS e ao Programa do Seguro-Desemprego, com responsabilidade para as duas partes. Esta calculadora existe para comparar caminhos legítimos, não para escolher a etiqueta mais conveniente.',
    },
    {
      pergunta: 'Os 20% do FGTS que não posso sacar no acordo são perdidos?',
      resposta:
        'Não. O art. 484-A, § 1º, da CLT limita a movimentação da conta a 80% dos depósitos, mas o restante continua na conta vinculada, com correção. Ele pode ser sacado nas hipóteses gerais da Lei nº 8.036/1990 — aposentadoria, compra de imóvel, doença grave, entre outras, e também numa dispensa sem justa causa futura. O que o acordo faz é adiar o acesso, não eliminar o valor.',
    },
    {
      pergunta: 'Por que o FGTS entra no total se ele já era meu?',
      resposta:
        'Porque o que muda entre os dois caminhos é justamente o acesso a ele. O total desta calculadora responde "quanto dinheiro fica disponível agora", e nessa pergunta um saldo bloqueado e um saldo liberado não valem a mesma coisa. O detalhamento separa as três correntes — rescisão, FGTS liberado e seguro-desemprego — para você somar só o que fizer sentido no seu caso.',
    },
    {
      pergunta: 'A comparação vale para empregado doméstico?',
      resposta:
        'Não. Esta calculadora trata do contrato regido pela CLT. O empregado doméstico segue a Lei Complementar nº 150/2015, que afasta a multa de 40% e põe no lugar um fundo próprio de 3,2%, formado mês a mês — o que muda a conta dos dois lados. Para esse caso, use a calculadora de rescisão do empregado doméstico.',
    },
  ],

  relacionadas: ['rescisao-sem-justa-causa', 'rescisao-acordo-mutuo', 'seguro-desemprego', 'fgts'],
}
