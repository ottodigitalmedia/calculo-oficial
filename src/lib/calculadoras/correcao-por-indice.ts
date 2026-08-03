/**
 * CALC-060 — Correção de valor por índice.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A primeira que consome série econômica.** O que ela usa é a forma compacta
 * gerada por `npm run fetch:serie` — um mês inicial e um vetor de inteiros —, e
 * não o cache completo: aquele tem 60 kB de objetos e mora no servidor, este
 * cabe no pacote da rota. Ver `ADR-006` e `docs/20`.
 *
 * **Selic e TR aparecem desabilitadas, com "Em breve".** As duas são séries
 * diárias na origem, e transformá-las em fator mensal exige uma decisão de
 * convenção que ainda não foi tomada. `OpcaoSelecao.indisponivel` existe
 * exatamente para isto: declarar o que falta em vez de sugerir cobertura que
 * não há.
 */

import { corrigirPorIndice } from '../engine/calculadoras/indices'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { SERIES_COMPACTAS } from '../series/dados/compacto'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type FuncaoCalculo,
} from './tipos'

const INDICES: Readonly<Record<string, { readonly serie: string; readonly nome: string }>> = {
  ipca: { serie: 'ipca-mensal', nome: 'IPCA' },
  inpc: { serie: 'inpc-mensal', nome: 'INPC' },
  igpm: { serie: 'igpm-mensal', nome: 'IGP-M' },
}

const VAZIA = { inicio: '', valores: [] as readonly number[] }

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const escolhido = INDICES[texto(valores, 'indice')] ?? INDICES.ipca
  if (!escolhido) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Escolha um índice.' }
  }

  // O campo de data entrega `AAAA-MM-DD`; a série é mensal, e o dia não existe
  // nela. Recortar aqui evita fingir uma precisão que o índice não tem.
  const de = texto(valores, 'de').slice(0, 7)
  const ate = texto(valores, 'ate').slice(0, 7)

  const r = corrigirPorIndice(
    {
      valorOriginal: centavos(numero(valores, 'valorOriginal')),
      de,
      ate,
      serie: SERIES_COMPACTAS[escolhido.serie] ?? VAZIA,
      nomeDoIndice: escolhido.nome,
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorCorrigido,
      /** Valor de partida mais correção é exatamente o valor corrigido. */
      detalhamento: [
        { rotulo: 'Valor original', valor: centavos(numero(valores, 'valorOriginal')), sinal: 'neutro' },
        { rotulo: 'Correção no período', valor: v.correcao, sinal: 'credito' },
        { rotulo: 'Valor corrigido', valor: v.valorCorrigido, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Variação acumulada', valor: formatarPercentual(v.variacaoBp) },
        {
          rotulo: 'Meses aplicados',
          valor: `${v.mesesAplicados}`,
        },
        { rotulo: 'Último mês publicado', valor: v.ultimoMesDisponivel },
        { rotulo: 'Correção', valor: formatarReal(v.correcao) },
      ],
      notas: [
        `O índice do mês inicial não entra na conta: ele mede a variação ocorrida durante ` +
          `aquele mês, que já está dentro do valor de partida. Foram aplicados os índices de ` +
          `${v.primeiroMesAplicado} a ${v.ultimoMesAplicado}.`,
        'Índices se multiplicam, não se somam. Doze meses de 1% não dão 12%, dão 12,68% — e a ' +
          'diferença cresce com o prazo.',
        'Índices são publicados com defasagem de cerca de um mês, e cada um sai no seu próprio ' +
          'calendário. O último mês publicado aparece no resultado; não há como corrigir para ' +
          'um mês que ainda não foi divulgado.',
        'Esta é uma correção por índice, e não um cálculo judicial. Débitos em processo seguem ' +
          'a tabela e os critérios do tribunal, que costumam incluir juros e ter regras próprias ' +
          'de marco inicial.',
      ],
    },
  }
}

export const CORRECAO_POR_INDICE: DefinicaoCalculadora = {
  id: 'CALC-060',
  slug: 'correcao-por-indice',
  nome: 'Correção de valor por índice',
  linhaDeContexto: 'Quanto um valor de ontem vale hoje — por IPCA, INPC ou IGP-M, mês a mês.',
  descricaoSeo:
    'Corrija um valor pela inflação entre dois meses usando IPCA, INPC ou IGP-M. Veja a variação acumulada, quantos meses entraram na conta e o valor atualizado.',

  campos: [
    {
      id: 'valorOriginal',
      rotulo: 'Valor a corrigir',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'indice',
      rotulo: 'Índice',
      tipo: 'selecao',
      padrao: 'ipca',
      opcoes: [
        { valor: 'ipca', rotulo: 'IPCA — a inflação oficial' },
        { valor: 'inpc', rotulo: 'INPC — usado em reajuste salarial' },
        { valor: 'igpm', rotulo: 'IGP-M — usado em aluguel' },
        { valor: 'selic', rotulo: 'Selic', indisponivel: true },
        { valor: 'tr', rotulo: 'TR', indisponivel: true },
      ],
      ajuda: 'O IPCA é o índice oficial de inflação. O INPC mede famílias de renda mais baixa; o IGP-M é o mais usado em contrato de aluguel.',
    },
    {
      id: 'de',
      rotulo: 'Data do valor original',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Só o mês importa: índices são mensais, e o dia não muda o resultado.',
    },
    {
      id: 'ate',
      rotulo: 'Corrigir até',
      tipo: 'data',
      obrigatorio: true,
    },
  ],

  // Série econômica NÃO é parâmetro legal — `ADR-006`. Nada aqui tem vigência.
  parametrosRequeridos: [],

  rotuloResultado: 'Valor corrigido',

  calcular,

  faq: [
    {
      pergunta: 'Qual índice devo usar?',
      resposta:
        'Depende do que o valor representa. Se há contrato, o índice é o que está escrito nele — aluguel costuma usar IGP-M, e cada vez mais IPCA. Para saber quanto um valor perdeu de poder de compra em geral, o IPCA é o índice oficial de inflação do país. O INPC mede a cesta de famílias com renda de um a cinco salários mínimos e é o mais usado em reajuste salarial de acordo coletivo.',
    },
    {
      pergunta: 'Por que o índice do mês inicial não entra?',
      resposta:
        'Porque ele mede a variação que aconteceu durante aquele mês, e essa variação já está embutida no valor que você informou como sendo daquele mês. Incluí-lo contaria um mês a mais. Corrigir de março para julho aplica os índices de abril, maio, junho e julho — quatro meses. O resultado mostra quais meses entraram, para você conferir.',
    },
    {
      pergunta: 'Por que a variação não é a soma dos percentuais?',
      resposta:
        'Porque índices se multiplicam. Cada mês incide sobre o valor já corrigido pelos meses anteriores, exatamente como juros compostos. Doze meses de 1% não dão 12%, dão 12,68%, e em intervalos longos a diferença entre somar e multiplicar fica grande. A memória de cálculo mostra o fator acumulado.',
    },
    {
      pergunta: 'Por que não consigo corrigir até o mês atual?',
      resposta:
        'Porque o índice daquele mês ainda não foi publicado. Os institutos divulgam com defasagem de cerca de um mês, e cada índice tem o seu próprio calendário — é comum o IGP-M já ter saído e o IPCA do mesmo mês, não. O resultado mostra qual é o último mês publicado do índice escolhido.',
    },
    {
      pergunta: 'Serve para atualizar dívida em processo judicial?',
      resposta:
        'Não como número final. Correção judicial segue a tabela e os critérios do tribunal, que definem o índice, o marco inicial e quase sempre somam juros de mora — coisas que variam por matéria e por vara. Esta calculadora faz a correção pelo índice puro, que serve para estimar e para conferir a parte inflacionária, não para substituir o cálculo do processo.',
    },
  ],

  relacionadas: ['juros-compostos', 'porcentagem', 'independencia-financeira'],
}
