/**
 * CALC-118 — Abono salarial (PIS/Pasep).
 *
 * "Tenho direito ao PIS? De quanto?" — a página não afirma direito (`RN-028`):
 * mostra se a renda informada fica dentro do limite do ano do pagamento e qual
 * é o valor pela conta da lei. Quem identifica o direito é o Ministério do
 * Trabalho, com os dados do eSocial.
 *
 * Motor em `engine/calculadoras/abono-salarial.ts`.
 */

import { PARAMETROS_ABONO, calcularAbono } from '../engine/calculadoras/abono-salarial'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { ABONO_SALARIAL } from '../params/data/abono-salarial'
import { INSS } from '../params/data/inss'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(ABONO_SALARIAL, INSS)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularAbono(
    {
      remuneracaoMedia: centavos(numero(valores, 'remuneracaoMedia')),
      meses: numero(valores, 'meses'),
      cadastroHaCincoAnos: texto(valores, 'cadastro') !== 'nao',
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
      principal: v.atendeTudo ? v.valorPelaLei : centavos(0),
      detalhamento: [{ rotulo: 'Valor pela conta da lei', valor: v.valorPelaLei, sinal: 'neutro' }],
      destaques: [
        { rotulo: 'Critério de renda', valor: v.atendeRenda ? `atendido — até ${formatarReal(v.limiteDeRenda)}` : `não atendido — o limite é ${formatarReal(v.limiteDeRenda)}` },
        { rotulo: 'Cadastro há cinco anos', valor: v.atendeCadastro ? 'atendido' : 'não atendido' },
        { rotulo: 'Salário mínimo do pagamento', valor: formatarReal(v.salarioMinimo) },
      ],
      notas: [
        'A estimativa é para o pagamento de 2026 — o do trabalho de 2024 —, o único cujo limite de renda já foi publicado pelo Ministério do Trabalho.',
        'A remuneração média não inclui o 13º nem o terço de férias. A fração de quinze dias ou mais de trabalho no mês conta como mês inteiro.',
        'Também é preciso ter trabalhado ao menos trinta dias no ano-base para empregador que contribui para o PIS ou o Pasep, e que ele tenha informado os dados no eSocial.',
        'O valor é arredondado para cima, até o real inteiro. A tabela do Ministério para 2026 traz R$ 675,00 para cinco meses; a lei manda R$ 676,00, e é o que esta estimativa mostra.',
      ],
    },
  }
}

export const ABONO_SALARIAL_PIS: DefinicaoCalculadora = {
  id: 'CALC-118',
  slug: 'abono-salarial-pis',
  nome: 'Abono salarial do PIS',
  linhaDeContexto: 'Se a sua renda fica no limite do ano e quanto seria o abono pelos meses trabalhados.',
  descricaoSeo:
    'Calcule o abono salarial do PIS/Pasep: o limite de renda do ano, pela regra da EC 135/2024, e o valor proporcional aos meses trabalhados no ano-base.',

  campos: [
    {
      id: 'remuneracaoMedia',
      rotulo: 'Remuneração média mensal no ano-base',
      tipo: 'monetario',
      obrigatorio: true,
      padrao: 200_000,
      minimo: 0,
      maximo: 10_000_000,
      ajuda: 'A média dos meses trabalhados, sem 13º e sem o terço de férias.',
    },
    {
      id: 'meses',
      rotulo: 'Meses trabalhados no ano-base',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 12,
      minimo: 1,
      maximo: 12,
      ajuda: 'Quinze dias ou mais de trabalho no mês contam como mês inteiro.',
    },
    {
      id: 'cadastro',
      rotulo: 'Está cadastrado no PIS/Pasep há pelo menos cinco anos?',
      tipo: 'selecao',
      padrao: 'sim',
      opcoes: [
        { valor: 'sim', rotulo: 'Sim' },
        { valor: 'nao', rotulo: 'Não' },
      ],
      ajuda: 'Contados da admissão no primeiro emprego com empregador contribuinte.',
    },
  ],

  parametrosRequeridos: [...PARAMETROS_ABONO],

  rotuloResultado: 'Abono estimado',

  calcular,

  faq: [
    {
      pergunta: 'Qual é o limite de renda para receber o abono?',
      resposta:
        'Para o pagamento de 2026, remuneração média de até R$ 2.766,00 no ano-base 2024, segundo o Ministério do Trabalho. Desde a Emenda Constitucional nº 135/2024, o limite deixou de ser dois salários mínimos do próprio ano-base: são dois salários mínimos de 2023, corrigidos a cada ano pelo INPC.',
    },
    {
      pergunta: 'Qual é o valor do abono?',
      resposta:
        'Um doze avos do salário mínimo vigente na data do pagamento por mês trabalhado no ano-base, arredondado para cima até o real inteiro (Lei nº 7.998/1990, art. 9º, §§ 2º e 4º). Doze meses dão um salário mínimo inteiro.',
    },
    {
      pergunta: 'O abono de 2026 é de qual ano de trabalho?',
      resposta:
        'Do ano-base 2024. O abono paga o trabalho de dois anos antes, e o calendário começa em 15 de fevereiro, pelo mês de nascimento.',
    },
    {
      pergunta: 'Quais são os outros requisitos?',
      resposta:
        'Ter trabalhado pelo menos trinta dias no ano-base para empregador que contribui para o PIS ou o Pasep, estar cadastrado há pelo menos cinco anos e ter os dados informados pelo empregador no eSocial.',
    },
    {
      pergunta: 'O limite vai continuar caindo?',
      resposta:
        'Ele é corrigido pelo INPC, e não mais pelo salário mínimo, que costuma subir mais. Medido em salários mínimos, o limite tende a encolher — até o piso de 1,5 salário mínimo que a Constituição garante (art. 239, § 3º-A).',
    },
  ],

  relacionadas: ['seguro-desemprego', 'salario-liquido', 'decimo-terceiro', 'fgts'],
}
