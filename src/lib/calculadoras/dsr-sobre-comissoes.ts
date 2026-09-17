/**
 * CALC-080 — DSR sobre comissões e remuneração variável.
 *
 * O comissionista tem repouso semanal e feriados remunerados (Súmula 27 do
 * TST), e o valor sai da própria comissão do mês: o ganho dividido pelos dias
 * trabalhados é o valor de um dia de repouso (Lei nº 605/1949, art. 7º, "c").
 *
 * Nenhum parâmetro com vigência — regra de lei desde 1949. Motor em
 * `engine/calculadoras/repouso.ts`.
 */

import { calcularDsrVariavel } from '../engine/calculadoras/repouso'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularDsrVariavel(
    {
      valorVariavel: centavos(numero(valores, 'valorVariavel')),
      diasUteis: numero(valores, 'diasUteis'),
      domingosEFeriados: numero(valores, 'domingosEFeriados'),
    },
    dataReferencia,
  )
  if (!r.ok) return r
  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.dsr,
      detalhamento: [
        { rotulo: 'Comissões e variáveis do mês', valor: centavos(numero(valores, 'valorVariavel')), sinal: 'neutro' },
        { rotulo: 'Repouso semanal remunerado', valor: v.dsr, sinal: 'credito' },
        { rotulo: 'Variável com o repouso', valor: v.totalComDsr, sinal: 'neutro' },
      ],
      destaques: [{ rotulo: 'Valor de um dia de repouso', valor: formatarReal(v.valorPorDia) }],
      notas: [
        'O repouso sobre a parte variável é pago além dela, e não descontado dela. Integra o salário e ' +
          'sofre INSS e imposto de renda junto com ele.',
      ],
    },
  }
}

export const DSR_SOBRE_COMISSOES: DefinicaoCalculadora = {
  id: 'CALC-080',
  slug: 'dsr-sobre-comissoes',
  nome: 'DSR sobre comissões',
  linhaDeContexto: 'O repouso semanal que as comissões e as horas extras do mês geram, além do valor delas.',
  descricaoSeo:
    'Calcule o DSR sobre comissões, horas extras e outras parcelas variáveis: o valor do mês dividido pelos dias úteis e multiplicado por domingos e feriados.',

  campos: [
    {
      id: 'valorVariavel',
      rotulo: 'Comissões ou variáveis do mês',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'Comissões, horas extras habituais ou outra parte variável do salário.',
    },
    {
      id: 'diasUteis',
      rotulo: 'Dias úteis no mês',
      tipo: 'inteiro',
      padrao: 25,
      minimo: 1,
      maximo: 27,
      ajuda: 'Na prática mais comum, de segunda a sábado, sem os feriados.',
    },
    {
      id: 'domingosEFeriados',
      rotulo: 'Domingos e feriados no mês',
      tipo: 'inteiro',
      padrao: 5,
      minimo: 0,
      maximo: 10,
    },
  ],

  parametrosRequeridos: [],

  rotuloResultado: 'Repouso semanal estimado',

  calcular,

  faq: [
    {
      pergunta: 'Quem ganha comissão também tem descanso semanal remunerado?',
      resposta:
        'Sim. A Súmula 27 do TST diz que a remuneração do repouso semanal e dos feriados é devida ao empregado comissionista, ainda que pracista. Para quem ganha só comissão, o repouso é calculado inteiro sobre ela; para quem tem salário fixo e comissão, o fixo já inclui o repouso e o cálculo é feito sobre a parte variável.',
    },
    {
      pergunta: 'Como se calcula o DSR sobre comissões?',
      resposta:
        'Divide-se o total variável do mês pelos dias úteis trabalhados e multiplica-se pelo número de domingos e feriados. É a forma da Lei nº 605/1949, art. 7º, "c": o ganho do período dividido pelos dias de serviço dá o valor de um dia de repouso. A calculadora faz a multiplicação antes da divisão, para arredondar uma vez só.',
    },
    {
      pergunta: 'O sábado conta como dia útil?',
      resposta:
        'Na contagem mais comum, sim: dias úteis são de segunda a sábado, excluídos os feriados, e o repouso é o domingo mais os feriados. Convenção coletiva ou a prática da empresa podem contar diferente, especialmente onde não há trabalho aos sábados — por isso os dois números são campos que você ajusta.',
    },
    {
      pergunta: 'Também vale para horas extras?',
      resposta:
        'Vale para as horas extras habituais, pela Súmula 172 do TST e pelo art. 7º da Lei nº 605/1949. A conta é a mesma: some o valor das horas no campo de variáveis. Se preferir que as horas extras sejam calculadas desde o salário, use a calculadora de horas extras, que já inclui o reflexo.',
    },
    {
      pergunta: 'Faltar sem justificativa afeta o DSR?',
      resposta:
        'Afeta. O art. 6º da Lei nº 605/1949 tira a remuneração do repouso da semana em que houve falta injustificada. A calculadora de desconto de faltas mostra quanto isso custa no salário.',
    },
  ],

  relacionadas: ['horas-extras', 'desconto-de-faltas', 'salario-liquido'],
}
