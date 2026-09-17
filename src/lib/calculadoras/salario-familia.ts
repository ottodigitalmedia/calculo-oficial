/**
 * CALC-088 — Salário-família.
 *
 * Tudo ou nada: dentro do limite de remuneração, uma cota por filho; um centavo
 * acima, nenhuma. A página mostra a folga até o limite, que é a informação que
 * decide se um aumento pequeno vale menos do que parece.
 *
 * Motor em `engine/calculadoras/salario-familia.ts`.
 */

import { calcularSalarioFamilia } from '../engine/calculadoras/salario-familia'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { SALARIO_FAMILIA } from '../params/data/salario-familia'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(SALARIO_FAMILIA)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularSalarioFamilia(
    {
      remuneracao: centavos(numero(valores, 'remuneracao')),
      filhos: numero(valores, 'filhos'),
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
      principal: v.total,
      detalhamento: v.elegivel
        ? [{ rotulo: 'Cotas de salário-família', valor: v.total, sinal: 'credito' }]
        : [],
      destaques: [
        { rotulo: 'Valor da cota por filho', valor: formatarReal(v.cota) },
        { rotulo: 'Limite de remuneração', valor: formatarReal(v.limite) },
        v.elegivel
          ? { rotulo: 'Folga até o limite', valor: formatarReal(v.folga) }
          : { rotulo: 'Acima do limite em', valor: formatarReal(-v.folga) },
      ],
      notas: [
        'O 13º salário e o adicional de férias não entram na remuneração comparada com o limite.',
        'No mês de admissão e no de demissão a cota é proporcional aos dias trabalhados. A norma não fixa ' +
          'o divisor dessa proporção, e por isso esta estimativa mostra o mês cheio.',
        'O pagamento depende da certidão de nascimento e da apresentação anual do atestado de vacinação ' +
          'obrigatória e da comprovação de frequência à escola.',
      ],
    },
  }
}

export const SALARIO_FAMILIA_CALC: DefinicaoCalculadora = {
  id: 'CALC-088',
  slug: 'salario-familia',
  nome: 'Salário-família',
  linhaDeContexto: 'Se a remuneração cabe no limite, e quanto as cotas por filho somam no mês.',
  descricaoSeo:
    'Calcule o salário-família do mês pela remuneração e pelo número de filhos, com a cota e o limite de renda da portaria do ano.',

  campos: [
    {
      id: 'remuneracao',
      rotulo: 'Remuneração mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'Salário bruto do mês, sem 13º e sem o adicional de férias.',
    },
    {
      id: 'filhos',
      rotulo: 'Filhos até 14 anos ou inválidos',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 1,
      minimo: 1,
      maximo: 20,
      ajuda: 'Enteado e menor sob tutela ou guarda judicial contam como filho, nas condições da lei.',
    },
  ],

  parametrosRequeridos: ['salario-familia-cota', 'salario-familia-limite'],

  rotuloResultado: 'Salário-família estimado no mês',

  calcular,

  faq: [
    {
      pergunta: 'Quem tem direito ao salário-família?',
      resposta:
        'O art. 65 da Lei nº 8.213/1991 garante o benefício ao segurado empregado, inclusive o doméstico, e ao trabalhador avulso, na proporção do número de filhos ou equiparados. A remuneração mensal precisa estar dentro do limite fixado a cada ano pela portaria interministerial que reajusta os benefícios.',
    },
    {
      pergunta: 'Até que idade o filho dá direito à cota?',
      resposta:
        'Até 14 anos, ou em qualquer idade se o filho for inválido. O enteado, o menor sob tutela e o menor sob guarda judicial equiparam-se a filho, mediante declaração do segurado e desde que não tenham condições suficientes para o próprio sustento e educação (Lei nº 8.213/1991, art. 16, § 2º).',
    },
    {
      pergunta: 'Se eu ganhar um pouco acima do limite, recebo uma parte?',
      resposta:
        'Não. O benefício não diminui aos poucos: dentro do limite, a cota é inteira; um centavo acima, não há cota nenhuma. É por isso que a calculadora mostra quanto falta, ou quanto sobra, em relação ao limite.',
    },
    {
      pergunta: 'Quem paga o salário-família?',
      resposta:
        'A empresa, ou o empregador doméstico, paga as cotas junto com o salário do mês e depois compensa o valor no recolhimento das contribuições à Previdência, como prevê o art. 68 da Lei nº 8.213/1991.',
    },
    {
      pergunta: 'O salário-família desconta INSS ou imposto de renda?',
      resposta:
        'É um benefício previdenciário pago junto com o salário, e não parte dele: o art. 70 da Lei nº 8.213/1991 diz que a cota não se incorpora, para qualquer efeito, ao salário. Por isso aparece em linha própria no contracheque, fora da base de cálculo dos descontos.',
    },
  ],

  relacionadas: ['salario-liquido', 'licenca-maternidade', 'inss'],
}
