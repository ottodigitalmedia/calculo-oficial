/**
 * CALC-089 — Rescisão antecipada do contrato de experiência e de outros
 * contratos por prazo determinado.
 *
 * O slug fala de experiência porque é assim que a pergunta chega: quase todo
 * contrato a prazo que alguém encerra antes do fim é o de experiência. A regra —
 * CLT, art. 479 — vale para todos, e a página diz isso.
 *
 * O que a calculadora NÃO faz, e declara: a conta inversa (art. 480, empregado
 * que sai antes), porque a lei manda indenizar prejuízos sem fixar valor e o
 * teto que existia foi revogado; e as demais verbas da rescisão — saldo de
 * salário, férias e 13º proporcionais —, que dependem de outras entradas.
 *
 * Motor em `engine/calculadoras/disponibilidade.ts`.
 */

import { calcularContratoAPrazo } from '../engine/calculadoras/disponibilidade'
import { centavos } from '../engine/types'
import { DISPONIBILIDADE } from '../params/data/disponibilidade'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(DISPONIBILIDADE)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularContratoAPrazo(
    {
      salario: centavos(numero(valores, 'salario')),
      mediaVariavel: centavos(numero(valores, 'mediaVariavel')),
      dataRescisao: texto(valores, 'dataRescisao') as DataISO,
      dataTermo: texto(valores, 'dataTermo') as DataISO,
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
      principal: v.indenizacao,
      detalhamento: [
        { rotulo: 'Remuneração que seria recebida até o fim do contrato', valor: v.remuneracaoAteOTermo, sinal: 'neutro' },
        { rotulo: 'Indenização do art. 479 — metade', valor: v.indenizacao, sinal: 'credito' },
      ],
      destaques: [{ rotulo: 'Dias que faltavam para o fim do contrato', valor: `${v.diasRestantes}` }],
      notas: [
        'A indenização é somada às demais verbas da rescisão — saldo de salário, férias e 13º proporcionais —, ' +
          'que esta calculadora não inclui.',
        'Se o contrato tem cláusula que permite a qualquer das partes encerrá-lo antes do prazo, esta ' +
          'indenização não se aplica: valem as regras da dispensa de contrato por prazo indeterminado.',
        'Quando é o empregado que sai antes do prazo, a lei manda indenizar os prejuízos que a saída causar ' +
          'ao empregador, sem fixar um valor. Não há conta padrão para esse caso.',
      ],
    },
  }
}

export const RESCISAO_CONTRATO_DE_EXPERIENCIA: DefinicaoCalculadora = {
  id: 'CALC-089',
  slug: 'rescisao-contrato-de-experiencia',
  nome: 'Rescisão antecipada do contrato de experiência',
  linhaDeContexto: 'A indenização de metade dos dias que faltavam, quando a empresa encerra o contrato a prazo antes do fim.',
  descricaoSeo:
    'Calcule a indenização do art. 479 da CLT quando a empresa encerra o contrato de experiência, ou outro contrato a prazo, antes da data final.',

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
      id: 'mediaVariavel',
      rotulo: 'Média mensal da parte variável',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Comissões ou adicionais pagos com habitualidade. Deixe zero se não houver.',
    },
    {
      id: 'dataRescisao',
      rotulo: 'Último dia trabalhado',
      tipo: 'data',
      obrigatorio: true,
    },
    {
      id: 'dataTermo',
      rotulo: 'Data prevista para o fim do contrato',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'A data final escrita no contrato ou na prorrogação.',
    },
  ],

  parametrosRequeridos: ['contrato-prazo-indenizacao-fracao'],

  rotuloResultado: 'Indenização estimada',

  calcular,

  faq: [
    {
      pergunta: 'A empresa pode encerrar o contrato de experiência antes do prazo?',
      resposta:
        'Pode, mas, sem justa causa, o art. 479 da CLT a obriga a pagar ao empregado, como indenização, metade da remuneração a que ele teria direito até o fim do contrato. A regra vale para o contrato de experiência e para os demais contratos por prazo determinado.',
    },
    {
      pergunta: 'Quando essa indenização não é devida?',
      resposta:
        'Quando a dispensa é por justa causa, quando o contrato chega à data final, e quando o contrato tem cláusula assecuratória do direito recíproco de rescisão antecipada. Nesse último caso, o art. 481 manda aplicar os princípios da rescisão do contrato por prazo indeterminado, e a Súmula 163 do TST confirma o aviso prévio no lugar desta indenização.',
    },
    {
      pergunta: 'E se for o empregado que pedir para sair antes?',
      resposta:
        'O art. 480 da CLT diz que o empregado deve indenizar o empregador pelos prejuízos que a saída causar. A lei não fixa um valor, e o parágrafo que limitava essa indenização foi revogado em 1978. O desconto precisa corresponder a um prejuízo real, e por isso não existe uma conta padrão.',
    },
    {
      pergunta: 'Como são contados os dias que faltavam?',
      resposta:
        'Do dia seguinte ao último dia trabalhado até a data prevista para o fim do contrato. O valor de cada dia é um trinta avos da remuneração mensal, a mesma base do art. 64 da CLT para o empregado mensalista, qualquer que seja o número de dias do mês.',
    },
    {
      pergunta: 'Qual o prazo máximo do contrato de experiência?',
      resposta:
        'O art. 445, parágrafo único, da CLT limita o contrato de experiência a noventa dias, e a Súmula 188 do TST admite a prorrogação dentro desse limite. Os demais contratos por prazo determinado podem durar até dois anos (art. 445), e o contrato prorrogado mais de uma vez passa a vigorar sem prazo (art. 451).',
    },
  ],

  relacionadas: ['rescisao-sem-justa-causa', 'rescisao-pedido-demissao', 'aviso-previo-proporcional'],
}
