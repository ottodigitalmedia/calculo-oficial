/**
 * CALC-097 — Multa de trânsito: valor, desconto e pontos.
 *
 * Quem acaba de receber a notificação faz duas perguntas ao mesmo tempo —
 * quanto vou pagar e quanto falta para perder a carteira. A página responde as
 * duas, com a norma de cada número na memória de cálculo.
 *
 * Motor em `engine/calculadoras/transito.ts`.
 */

import {
  calcularMultaTransito,
  type FormaDePagamento,
  type NaturezaDaInfracao,
} from '../engine/calculadoras/transito'
import { TRANSITO } from '../params/data/transito'
import { construirRegistro } from '../params/registry'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

const registro = construirRegistro(TRANSITO)

const NATUREZAS: readonly NaturezaDaInfracao[] = ['gravissima', 'grave', 'media', 'leve']
const FORMAS: readonly FormaDePagamento[] = ['integral', 'ate-vencimento', 'notificacao-eletronica']

function naturezaDe(valor: string): NaturezaDaInfracao {
  return NATUREZAS.find((n) => n === valor) ?? 'gravissima'
}

function formaDe(valor: string): FormaDePagamento {
  return FORMAS.find((f) => f === valor) ?? 'integral'
}

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularMultaTransito(
    {
      natureza: naturezaDe(texto(valores, 'natureza')),
      fatorMultiplicador: numero(valores, 'fator') || 1,
      formaDePagamento: formaDe(texto(valores, 'pagamento')),
      pontosAcumulados: numero(valores, 'pontosAcumulados'),
      gravissimasAcumuladas: numero(valores, 'gravissimas'),
      atividadeRemunerada: texto(valores, 'remunerada') === 'sim',
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores

  const detalhamento: LinhaDetalhamento[] = [
    { rotulo: 'Valor da multa', valor: v.valorCheio, sinal: 'neutro' },
    ...(v.desconto > 0 ? ([{ rotulo: 'Desconto', valor: v.desconto, sinal: 'credito' }] as const) : []),
    { rotulo: 'Valor a pagar', valor: v.valorAPagar, sinal: 'debito' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Pontos desta infração', valor: `${v.pontosDaInfracao}` },
    { rotulo: 'Pontos em doze meses', valor: `${v.pontosTotais}` },
    { rotulo: 'Limite para suspensão', valor: `${v.limiteDePontos}` },
    {
      rotulo: v.atingiuOLimite ? 'Situação' : 'Pontos até o limite',
      valor: v.atingiuOLimite ? 'Limite atingido' : `${v.pontosAteOLimite}`,
    },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.valorAPagar,
      detalhamento,
      destaques,
      notas: [
        'A contagem de pontos é dos últimos doze meses e considera as infrações com condutor identificado. ' +
          'Consulte o extrato de pontuação no aplicativo oficial ou no órgão de trânsito do seu estado.',
        'Muitas infrações têm fator multiplicador próprio, previsto no artigo que as descreve. Quando a ' +
          'notificação trouxer valor diferente do calculado aqui, é quase sempre isso — informe o fator.',
        ...(v.atingiuOLimite
          ? [
              'Com o limite atingido, o órgão de trânsito instaura processo de suspensão do direito de dirigir. ' +
                'Há defesa e recurso, com prazos próprios na notificação.',
            ]
          : []),
      ],
    },
  }
}

export const MULTA_DE_TRANSITO: DefinicaoCalculadora = {
  id: 'CALC-097',
  slug: 'multa-de-transito',
  nome: 'Multa de trânsito e pontos na carteira',
  linhaDeContexto: 'O valor com e sem desconto, e quanto a infração aproxima da suspensão.',
  descricaoSeo:
    'Calcule o valor da multa de trânsito por natureza da infração, o desconto por pagamento antecipado e os pontos que ela soma na carteira.',

  campos: [
    {
      id: 'natureza',
      rotulo: 'Natureza da infração',
      tipo: 'selecao',
      padrao: 'media',
      opcoes: [
        { valor: 'gravissima', rotulo: 'Gravíssima' },
        { valor: 'grave', rotulo: 'Grave' },
        { valor: 'media', rotulo: 'Média' },
        { valor: 'leve', rotulo: 'Leve' },
      ],
      ajuda: 'Está escrita na notificação, ao lado do código da infração.',
    },
    {
      id: 'fator',
      rotulo: 'Fator multiplicador',
      tipo: 'inteiro',
      padrao: 1,
      minimo: 1,
      maximo: 100,
      ajuda: 'Algumas infrações multiplicam a multa — dirigir sob efeito de álcool é o exemplo mais conhecido. Sem multiplicador, deixe 1.',
    },
    {
      id: 'pagamento',
      rotulo: 'Como vai pagar',
      tipo: 'selecao',
      padrao: 'ate-vencimento',
      opcoes: [
        { valor: 'ate-vencimento', rotulo: 'Até o vencimento' },
        { valor: 'notificacao-eletronica', rotulo: 'Com adesão à notificação eletrônica' },
        { valor: 'integral', rotulo: 'Depois do vencimento, valor cheio' },
      ],
    },
    {
      id: 'pontosAcumulados',
      rotulo: 'Pontos já acumulados nos últimos 12 meses',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 200,
      ajuda: 'Sem contar esta infração.',
    },
    {
      id: 'gravissimas',
      rotulo: 'Infrações gravíssimas nesses 12 meses',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 50,
      ajuda: 'Também sem contar esta. É o número que decide qual limite de pontos vale para você.',
    },
    {
      id: 'remunerada',
      rotulo: 'Exerce atividade remunerada ao veículo?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não' },
        { valor: 'sim', rotulo: 'Sim — motorista profissional' },
      ],
    },
  ],

  parametrosRequeridos: [
    'multa-gravissima-valor',
    'multa-grave-valor',
    'multa-media-valor',
    'multa-leve-valor',
    'multa-gravissima-pontos',
    'multa-grave-pontos',
    'multa-media-pontos',
    'multa-leve-pontos',
    'suspensao-limite-com-duas-gravissimas',
    'suspensao-limite-com-uma-gravissima',
    'suspensao-limite-sem-gravissima',
    'multa-desconto-vencimento',
  ],

  rotuloResultado: 'Valor estimado a pagar',

  calcular,

  faq: [
    {
      pergunta: 'Quanto custa cada tipo de multa?',
      resposta:
        'O art. 258 do Código de Trânsito fixa quatro valores, um para cada natureza de infração — gravíssima, grave, média e leve. Sobre esse valor pode incidir o fator multiplicador previsto no artigo da infração específica, o que a lei chama de multa agravada.',
    },
    {
      pergunta: 'Qual o desconto por pagar antes?',
      resposta:
        'Pagando até a data do vencimento impressa na notificação, o art. 284 do Código permite quitar por 80% do valor. Com adesão ao sistema de notificação eletrônica e renúncia a defesa prévia e recurso, o § 1º do mesmo artigo reduz para 60% — e essa adesão precisa ser anterior ao envio da notificação da autuação.',
    },
    {
      pergunta: 'Pagar a multa significa aceitar a infração?',
      resposta:
        'No desconto de 80%, não: o § 2º do art. 284 diz que o recolhimento do valor não implica renúncia ao questionamento administrativo. Já o desconto maior, o de 60%, exige justamente o reconhecimento da infração e a renúncia a defesa e recurso.',
    },
    {
      pergunta: 'Com quantos pontos a carteira é suspensa?',
      resposta:
        'Depende de quantas infrações gravíssimas constam dos últimos doze meses. O art. 261, I, fixa três limites: o mais baixo quando há duas ou mais gravíssimas, um intermediário quando há uma, e o mais alto quando não há nenhuma. Quem exerce atividade remunerada ao veículo tem sempre o limite mais alto, qualquer que seja a natureza das infrações.',
    },
    {
      pergunta: 'Os pontos somem depois de um ano?',
      resposta:
        'A contagem do art. 261 é feita no período de doze meses, de modo que a infração antiga deixa de pesar quando esse período passa. O extrato oficial de pontuação é o lugar de conferir a sua contagem atual — esta calculadora usa o número que você informar.',
    },
    {
      pergunta: 'A multa entra no custo do carro?',
      resposta:
        'Entra, e costuma ser o custo esquecido. Somada a licenciamento, seguro, combustível e manutenção, ela muda o gasto anual do veículo — a calculadora de custo mensal do carro mostra o efeito no orçamento.',
    },
  ],

  relacionadas: ['custo-mensal-do-carro', 'depreciacao-de-veiculo', 'orcamento-domestico'],
}
