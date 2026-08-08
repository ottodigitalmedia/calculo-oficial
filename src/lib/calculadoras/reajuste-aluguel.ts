/**
 * CALC-037 — Reajuste de aluguel por índice contratual.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **É a primeira calculadora deste projeto que tem correspondente no projeto
 * irmão** — `reajuste-aluguel`, no ar desde 26/07/2026. `ESTADO-DO-PROJETO` §6.4
 * decidiu construir assim mesmo, com o argumento que vale para CALC-002 e vale
 * aqui: domínio de marca com profundidade temática e memória de cálculo
 * auditável é a posição mais forte em busca orgânica. A decisão fica sujeita ao
 * que os 90 dias de MR-2 mostrarem.
 *
 * **O índice é o do CONTRATO, e a calculadora não escolhe por ninguém.** O IGP-M
 * é o padrão histórico do setor e por isso é o padrão do campo, mas contratos
 * migraram para IPCA em massa depois de 2020, quando o IGP-M disparou. Quem
 * responde qual dos dois vale é o contrato assinado — e o texto de tela diz
 * isso em vez de sugerir que existe um índice "correto".
 */

import { corrigirPorIndice } from '../engine/calculadoras/indices'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { indiceEscolhido, mesDe, OPCOES_DE_INDICE, serieDoIndice } from './indices-comuns'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const MESES_NO_ANO = 12

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const chave = texto(valores, 'indice')
  const aluguelAtual = centavos(numero(valores, 'aluguel'))

  const r = corrigirPorIndice(
    {
      valorOriginal: aluguelAtual,
      de: mesDe(texto(valores, 'de')),
      ate: mesDe(texto(valores, 'ate')),
      serie: serieDoIndice(chave),
      nomeDoIndice: indiceEscolhido(chave).nome,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores
  const diferencaAnual = v.correcao * MESES_NO_ANO

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorCorrigido,
      detalhamento: [
        { rotulo: 'Aluguel atual', valor: aluguelAtual, sinal: 'neutro' },
        { rotulo: 'Reajuste do período', valor: v.correcao, sinal: 'credito' },
        { rotulo: 'Novo aluguel', valor: v.valorCorrigido, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Variação do índice', valor: formatarPercentual(v.variacaoBp) },
        { rotulo: 'Meses no período', valor: `${v.mesesAplicados}` },
        { rotulo: 'Diferença em doze meses', valor: formatarReal(centavos(diferencaAnual)) },
        { rotulo: 'Último mês publicado', valor: v.ultimoMesDisponivel },
      ],
      notas: [
        'O índice e a periodicidade do reajuste são os que estão no CONTRATO. O IGP-M é o padrão ' +
          'histórico do setor, mas muitos contratos passaram a usar IPCA. Confira qual foi ' +
          'pactuado antes de usar o resultado.',
        'O IGP-M e o IPCA podem divergir muito num mesmo período — o IGP-M pesa preços no ' +
          'atacado e o câmbio, e chega a andar em direção oposta à inflação ao consumidor. Vale ' +
          'rodar a conta com os dois para ver o tamanho da diferença.',
        'O índice do mês do último reajuste não entra: ele mede a variação ocorrida durante ' +
          'aquele mês, que já está embutida no aluguel vigente.',
        'Reajuste por índice é diferente de revisão do valor de mercado. O que esta conta faz é ' +
          'aplicar o índice pactuado ao aluguel vigente; discutir se o valor está acima ou abaixo ' +
          'do praticado na região é outra conversa, e ela não é aritmética.',
      ],
    },
  }
}

export const REAJUSTE_ALUGUEL: DefinicaoCalculadora = {
  id: 'CALC-037',
  slug: 'reajuste-de-aluguel',
  nome: 'Reajuste de aluguel',
  linhaDeContexto: 'Quanto o aluguel passa a ser pelo índice do contrato — com a conta à mostra.',
  descricaoSeo:
    'Calcule o reajuste do aluguel pelo IGP-M, IPCA ou INPC entre o último reajuste e o mês do novo. Veja a variação acumulada e o novo valor.',

  campos: [
    {
      id: 'aluguel',
      rotulo: 'Aluguel atual',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'O valor que vem sendo pago desde o último reajuste.',
    },
    {
      id: 'indice',
      rotulo: 'Índice do contrato',
      tipo: 'selecao',
      padrao: 'igpm',
      opcoes: OPCOES_DE_INDICE,
      ajuda: 'O que estiver escrito no contrato. O IGP-M é o padrão histórico; muitos contratos passaram a usar IPCA.',
    },
    {
      id: 'de',
      rotulo: 'Data do último reajuste',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Ou a data de início do contrato, se ainda não houve reajuste.',
    },
    {
      id: 'ate',
      rotulo: 'Reajustar até',
      tipo: 'data',
      obrigatorio: true,
    },
  ],

  // Série econômica NÃO é parâmetro legal — `ADR-006`.
  parametrosRequeridos: [],

  rotuloResultado: 'Novo aluguel',

  calcular,

  faq: [
    {
      pergunta: 'Qual índice o meu contrato usa?',
      resposta:
        'Só o contrato responde isso, e a cláusula costuma estar junto das disposições sobre prazo e pagamento. O IGP-M foi por muito tempo o padrão do setor, mas depois de 2020, quando ele disparou bem acima da inflação ao consumidor, muitos contratos passaram a adotar IPCA. Rodar a conta com os dois mostra o tamanho da diferença, e ela pode ser grande.',
    },
    {
      pergunta: 'Por que o IGP-M às vezes é tão diferente do IPCA?',
      resposta:
        'Porque medem coisas diferentes. O IPCA acompanha preços ao consumidor final. O IGP-M é uma composição que pesa fortemente preços no atacado e é sensível ao câmbio e a commodities — por isso ele oscila mais e chega a andar em direção oposta à inflação sentida no varejo. Em períodos de dólar em alta, a diferença entre os dois pode ser de vários pontos.',
    },
    {
      pergunta: 'O índice do mês do reajuste entra na conta?',
      resposta:
        'Não. O índice de um mês mede a variação ocorrida durante aquele mês, e essa variação já está dentro do aluguel que vigorou nele. Reajustando de janeiro para janeiro do ano seguinte, aplicam-se os índices de fevereiro a janeiro — doze meses. O resultado mostra quais meses entraram, para conferência.',
    },
    {
      pergunta: 'O proprietário pode reajustar quando quiser?',
      resposta:
        'A periodicidade é a que o contrato estabelece, e a prática no país é anual. Esta calculadora não avalia se o reajuste é devido nem se o prazo foi cumprido — ela aplica o índice ao período que você informar. Divergência sobre prazo, índice ou valor é questão contratual, e não aritmética.',
    },
    {
      pergunta: 'Reajuste é a mesma coisa que revisão do aluguel?',
      resposta:
        'Não. Reajuste é a aplicação do índice pactuado, que é o que esta conta faz. Revisão é a discussão sobre o valor de mercado do imóvel, que segue regras próprias e costuma exigir acordo entre as partes ou medida judicial. Um é aritmética sobre o contrato; o outro é negociação sobre o preço.',
    },
  ],

  relacionadas: ['rentabilidade-de-aluguel', 'correcao-por-indice', 'poder-de-compra'],
}
