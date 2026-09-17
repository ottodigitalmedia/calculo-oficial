/**
 * CALC-078 — Adicional de insalubridade.
 *
 * O erro que esta calculadora existe para evitar: aplicar o percentual sobre o
 * salário do empregado. A base legal é o salário mínimo (CLT, art. 192), e o
 * grau — máximo, médio ou mínimo — vem do laudo, não de escolha.
 *
 * Motor em `engine/calculadoras/adicionais.ts`.
 */

import { calcularInsalubridade, type GrauInsalubridade } from '../engine/calculadoras/adicionais'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { ADICIONAIS } from '../params/data/adicionais'
import { INSS } from '../params/data/inss'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(INSS, ADICIONAIS)

function grauDe(valor: string): GrauInsalubridade {
  return valor === 'maximo' || valor === 'minimo' ? valor : 'medio'
}

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const outraBase = texto(valores, 'base') === 'outra'
  const r = calcularInsalubridade(
    {
      grau: grauDe(texto(valores, 'grau')),
      baseInformada: centavos(outraBase ? numero(valores, 'baseInformada') : 0),
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
      principal: v.adicional,
      detalhamento: [
        { rotulo: v.baseEhSalarioMinimo ? 'Salário mínimo (base)' : 'Base informada', valor: v.base, sinal: 'neutro' },
        { rotulo: 'Adicional de insalubridade', valor: v.adicional, sinal: 'credito' },
      ],
      destaques: [
        { rotulo: 'Percentual do grau', valor: formatarPercentual(v.aliquota) },
        { rotulo: 'Salário mínimo vigente', valor: formatarReal(v.salarioMinimo) },
      ],
      notas: [
        'O adicional integra a remuneração enquanto é pago: sofre INSS e imposto de renda junto com o ' +
          'salário e reflete em férias, 13º e FGTS.',
        'Insalubridade e periculosidade não se acumulam. Quem tem direito às duas escolhe uma.',
      ],
    },
  }
}

export const INSALUBRIDADE: DefinicaoCalculadora = {
  id: 'CALC-078',
  slug: 'insalubridade',
  nome: 'Adicional de insalubridade',
  linhaDeContexto: 'Quanto rende o adicional em cada grau, calculado sobre a base que a lei manda usar.',
  descricaoSeo:
    'Calcule o adicional de insalubridade nos graus máximo, médio e mínimo sobre o salário mínimo vigente, ou sobre o piso da sua convenção.',

  campos: [
    {
      id: 'grau',
      rotulo: 'Grau de insalubridade',
      tipo: 'selecao',
      padrao: 'medio',
      opcoes: [
        { valor: 'maximo', rotulo: 'Máximo' },
        { valor: 'medio', rotulo: 'Médio' },
        { valor: 'minimo', rotulo: 'Mínimo' },
      ],
      ajuda: 'O grau é definido no laudo técnico do ambiente de trabalho.',
    },
    {
      id: 'base',
      rotulo: 'Base de cálculo',
      tipo: 'selecao',
      padrao: 'salario-minimo',
      opcoes: [
        { valor: 'salario-minimo', rotulo: 'Salário mínimo (regra da lei)' },
        { valor: 'outra', rotulo: 'Outra base, prevista em convenção ou contrato' },
      ],
    },
    {
      id: 'baseInformada',
      rotulo: 'Base prevista na convenção ou no contrato',
      tipo: 'monetario',
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'Como o piso da categoria. Não pode ser menor que o salário mínimo.',
      visivelSe: { campo: 'base', em: ['outra'] },
    },
  ],

  parametrosRequeridos: [
    'salario-minimo',
    'insalubridade-grau-maximo',
    'insalubridade-grau-medio',
    'insalubridade-grau-minimo',
  ],

  rotuloResultado: 'Adicional de insalubridade estimado',

  calcular,

  faq: [
    {
      pergunta: 'O adicional é calculado sobre o meu salário?',
      resposta:
        'Pela regra da lei, não. O art. 192 da CLT calcula o adicional sobre o salário mínimo, qualquer que seja o salário do empregado. Uma convenção coletiva ou o contrato podem prever uma base maior, como o piso da categoria — nesse caso, escolha "outra base" e informe o valor.',
    },
    {
      pergunta: 'Quem define o grau da insalubridade?',
      resposta:
        'O grau vem da classificação do agente insalubre nas normas do Ministério do Trabalho, verificada por laudo técnico no ambiente de trabalho. Não é escolha do empregado nem do empregador, e a calculadora não tem como defini-lo: informe o grau que consta do laudo.',
    },
    {
      pergunta: 'Posso receber insalubridade e periculosidade juntas?',
      resposta:
        'Não. O art. 193, § 2º, da CLT permite ao empregado exposto às duas condições optar pela insalubridade, e os dois adicionais não se acumulam. A calculadora de periculosidade compara os dois valores para mostrar qual é maior no seu caso.',
    },
    {
      pergunta: 'O adicional entra nas férias e no 13º?',
      resposta:
        'Segundo a Súmula 139 do TST, enquanto é pago o adicional integra a remuneração para todos os efeitos legais. Por isso ele entra na base das férias, do 13º e do FGTS, e sofre INSS e imposto de renda junto com o salário do mês.',
    },
    {
      pergunta: 'Por que o valor mudou de um ano para o outro?',
      resposta:
        'Porque a base é o salário mínimo, reajustado todo ano por decreto. O percentual do grau é o mesmo; o que muda é o salário mínimo sobre o qual ele incide. Troque o período de referência para ver o valor de cada ano.',
    },
  ],

  relacionadas: ['periculosidade', 'salario-liquido', 'adicional-noturno'],
}
