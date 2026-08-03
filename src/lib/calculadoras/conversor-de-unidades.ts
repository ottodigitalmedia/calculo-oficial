/**
 * CALC-074 — Conversor de unidades.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **As unidades de origem e destino mudam com a categoria, e o molde já sabia
 * fazer isso.** Cada categoria tem o seu par de campos de seleção, e `visivelSe`
 * mostra só o par da categoria escolhida — o mesmo mecanismo do tipo de aviso
 * prévio em CALC-002. A alternativa seria fazer o contrato crescer com opções
 * que dependem de outro campo, e §7.8 é explícito: uma calculadora que precisa é
 * palpite, não medida.
 *
 * **O que esta página faz que um conversor comum não faz: mostra a conta.** O
 * valor passa pela unidade base da categoria, e a memória de cálculo exibe esse
 * passo. Quem confere polegada para centímetro confere o milímetro no meio.
 */

import { converterUnidade } from '../engine/calculadoras/unidades'
import { formatarComCasas } from '../format/moeda'
import { CATEGORIAS } from '../unidades/tabela'
import {
  numero,
  texto,
  type Campo,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type OpcaoSelecao,
} from './tipos'

/** `de-comprimento`, `para-massa`… um par de campos por categoria. */
function idDoCampo(prefixo: 'de' | 'para', categoriaId: string): string {
  return `${prefixo}-${categoriaId}`
}

function opcoes(categoriaId: string): readonly OpcaoSelecao[] {
  const categoria = CATEGORIAS.find((c) => c.id === categoriaId)
  return (categoria?.unidades ?? []).map((u) => ({ valor: u.id, rotulo: u.nome }))
}

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const categoriaId = texto(valores, 'categoria')

  const r = converterUnidade(
    {
      categoriaId,
      deId: texto(valores, idDoCampo('de', categoriaId)),
      paraId: texto(valores, idDoCampo('para', categoriaId)),
      valor: numero(valores, 'valor'),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores
  const ehTemperatura = v.categoria.id === 'temperatura'

  const destaques: Destaque[] = [
    {
      rotulo: ehTemperatura ? 'Cada grau a mais equivale a' : `1 ${v.de.simbolo} equivale a`,
      valor: `${formatarComCasas(v.fator, v.casasDoFator)} ${v.para.simbolo}`,
    },
  ]

  if (!ehTemperatura) {
    destaques.push({
      rotulo: `1 ${v.para.simbolo} equivale a`,
      valor: `${formatarComCasas(v.fatorInverso, v.casasDoInverso)} ${v.de.simbolo}`,
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.resultado,
      unidade: 'numero',
      casasDecimais: v.casasDecimais,
      /**
       * Vazia, como em CALC-070 e CALC-071: conversão não decompõe um total em
       * parcelas, e a coluna do resultado é a forma que o produto usa para isso.
       * O caminho da conta está na memória de cálculo, que é onde ele pertence.
       */
      detalhamento: [],
      destaques,
      notas: [
        `O resultado está em ${v.para.nome.toLowerCase()}. A memória de cálculo mostra o valor ` +
          `em ${v.categoria.base}, que é a unidade por onde a conversão passa — é ali que se ` +
          'confere o número do meio.',
        'A conta é feita com frações exatas e aritmética inteira, não com decimais aproximados. ' +
          'A polegada não é "25,4 mm mais ou menos": é 254 ÷ 10 mm, e a diferença aparece quando ' +
          'o valor é grande.',
        'As casas decimais exibidas variam conforme o tamanho do resultado: um número pequeno ' +
          'ganha mais casas para não virar zero. Zeros à direita não aparecem.',
        ...(ehTemperatura
          ? [
              'Temperatura não converte por fator, e é o engano mais comum: 1 °C não vira 33,8 °C ' +
                'de DIFERENÇA. Uma variação de um grau Celsius equivale a 1,8 grau Fahrenheit, e a ' +
                'leitura de 1 °C equivale a 33,8 °F — são coisas diferentes, e o destaque acima ' +
                'mostra a variação.',
            ]
          : []),
        ...(v.categoria.id === 'dados'
          ? [
              'Quilobyte e kibibyte não são a mesma coisa: kB são 1.000 bytes e KiB são 1.024. É ' +
                'por isso que um disco vendido como 500 GB aparece como 465 GiB no computador — ' +
                'nada sumiu, as duas contagens é que são diferentes.',
            ]
          : []),
        ...(v.categoria.id === 'area'
          ? [
              'O alqueire muda de tamanho conforme a região, e por isso aparecem dois: o paulista ' +
                'tem 2,42 hectares e o mineiro tem 4,84 — o dobro. Usar o errado dobra ou reduz ' +
                'pela metade o resultado.',
            ]
          : []),
      ],
    },
  }
}

/**
 * Um par de campos de seleção por categoria, visível só quando ela é a
 * escolhida. Ver a nota de topo sobre por que o contrato não cresceu.
 */
const CAMPOS_DE_UNIDADE: readonly Campo[] = CATEGORIAS.flatMap((categoria) => {
  const primeira = categoria.unidades[0]?.id ?? ''
  const segunda = categoria.unidades[1]?.id ?? primeira
  return [
    {
      id: idDoCampo('de', categoria.id),
      rotulo: 'De',
      tipo: 'selecao' as const,
      padrao: primeira,
      opcoes: opcoes(categoria.id),
      visivelSe: { campo: 'categoria', em: [categoria.id] },
    },
    {
      id: idDoCampo('para', categoria.id),
      rotulo: 'Para',
      tipo: 'selecao' as const,
      padrao: segunda,
      opcoes: opcoes(categoria.id),
      visivelSe: { campo: 'categoria', em: [categoria.id] },
    },
  ]
})

export const CONVERSOR_DE_UNIDADES: DefinicaoCalculadora = {
  id: 'CALC-074',
  slug: 'conversor-de-unidades',
  nome: 'Conversor de unidades',
  linhaDeContexto: 'Comprimento, massa, volume, área, temperatura e mais — com a conta à mostra.',
  descricaoSeo:
    'Converta unidades de comprimento, massa, volume, área, velocidade, tempo, dados e temperatura. Veja o fator de conversão e a conta passo a passo.',

  campos: [
    {
      id: 'valor',
      rotulo: 'Valor a converter',
      tipo: 'decimal',
      obrigatorio: true,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Aceita duas casas decimais.',
    },
    {
      id: 'categoria',
      rotulo: 'O que você está convertendo',
      tipo: 'selecao',
      padrao: 'comprimento',
      opcoes: CATEGORIAS.map((c) => ({ valor: c.id, rotulo: c.nome })),
    },
    ...CAMPOS_DE_UNIDADE,
  ],

  // Sem parâmetro legal: as razões entre unidades são definições, não normas.
  parametrosRequeridos: [],

  rotuloResultado: 'Resultado da conversão',

  calcular,

  faq: [
    {
      pergunta: 'Por que quilobyte e kibibyte dão números diferentes?',
      resposta:
        'Porque contam de formas diferentes. O quilobyte segue o prefixo decimal — 1.000 bytes — e o kibibyte segue o binário, 1.024 bytes. Fabricantes de disco usam o decimal e sistemas operacionais costumam usar o binário, e é daí que vem a impressão de que um disco de 500 GB "chegou com menos": ele aparece como 465 GiB. Nada sumiu; são duas contagens do mesmo número de bytes.',
    },
    {
      pergunta: 'Um grau Celsius são 33,8 graus Fahrenheit?',
      resposta:
        'A leitura, sim; a variação, não. Uma temperatura de 1 °C corresponde a 33,8 °F, mas um aumento de 1 °C corresponde a um aumento de apenas 1,8 °F. As duas escalas não partem do mesmo zero, e por isso a conversão de temperatura não é uma multiplicação: é uma reta com deslocamento. O resultado mostra a leitura convertida, e o destaque mostra quanto vale a variação.',
    },
    {
      pergunta: 'Qual alqueire eu devo usar?',
      resposta:
        'Depende do estado, e a diferença é grande: o alqueire paulista tem 2,42 hectares e o mineiro tem 4,84 — exatamente o dobro. O paulista é o mais usado em São Paulo, Paraná e Santa Catarina; o mineiro predomina em Minas Gerais, Rio de Janeiro, Goiás e boa parte do Centro-Oeste. Existem outras medidas locais com o mesmo nome, e por isso a escritura ou o CAR do imóvel é a referência que decide.',
    },
    {
      pergunta: 'Por que o número de casas decimais muda?',
      resposta:
        'Porque duas casas fixas apagariam respostas legítimas. Um milímetro em quilômetros é 0,000001, e com duas casas a página imprimiria 0,00 — um número errado com cara de certo. A calculadora usa duas casas quando bastam e desce mais quando o resultado é pequeno, até o limite em que a conta ainda é exata. Zeros à direita são omitidos para não sugerir precisão que a conta não tem.',
    },
    {
      pergunta: 'A conversão é exata?',
      resposta:
        'A conta é. Cada unidade é declarada por uma fração de inteiros — a polegada é 254 ÷ 10 milímetros, a libra é 45.359.237 ÷ 100 miligramas — e a conversão é feita com aritmética inteira, sem decimal aproximado no caminho. O que se arredonda é só a exibição, na última casa mostrada. Conversões cujo resultado não caberia com exatidão são recusadas em vez de arredondadas em silêncio.',
    },
  ],

  relacionadas: ['regra-de-tres', 'porcentagem', 'media-ponderada'],
}
