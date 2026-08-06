/**
 * CALC-053 — Carnê-leão.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A primeira coisa que a página precisa resolver não é a conta, é o "isto vale
 * para mim?".** O carnê-leão alcança o que se recebe de outra PESSOA FÍSICA ou
 * do exterior. Quem atende empresa tem retenção na fonte e não recolhe carnê-leão
 * pela mesma renda — e essa confusão manda gente pagar duas vezes ou não pagar.
 *
 * **Sem parâmetro legal novo:** a tabela é a mesma do IRRF mensal, e o motor é o
 * mesmo de CALC-015. Reaproveitar em vez de reescrever é o que garante que os
 * dois caminhos nunca divirjam.
 */

import { calcularCarneLeao, liquidoDoMes } from '../engine/calculadoras/carne-leao'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { construirRegistro } from '../params/registry'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(IRRF, INSS)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularCarneLeao(
    {
      rendimento: centavos(numero(valores, 'rendimento')),
      livroCaixa: centavos(numero(valores, 'livroCaixa')),
      excessoAnterior: centavos(numero(valores, 'excessoAnterior')),
      inss: centavos(numero(valores, 'inss')),
      dependentes: numero(valores, 'dependentes'),
      pensao: centavos(numero(valores, 'pensao')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o rendimento recebido. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Imposto do mês', valor: v.imposto, sinal: 'debito' },
    { rotulo: 'Sobra depois do imposto', valor: liquidoDoMes(v), sinal: 'neutro' },
    { rotulo: 'Recebido no mês', valor: v.rendimento, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Quanto o imposto leva do que entrou', valor: formatarPercentual(v.mordidaBp) },
    { rotulo: 'Base de cálculo', valor: formatarReal(v.baseCalculo) },
    {
      rotulo: 'Base adotada',
      valor:
        v.baseEscolhida === 'desconto_simplificado'
          ? 'Desconto simplificado'
          : 'Deduções legais',
    },
  ]

  if (v.livroCaixaAplicado > 0) {
    destaques.push({ rotulo: 'Livro-caixa aplicado', valor: formatarReal(v.livroCaixaAplicado) })
  }
  if (v.excessoATransportar > 0) {
    destaques.push({
      rotulo: 'Livro-caixa que sobra para o mês seguinte',
      valor: formatarReal(v.excessoATransportar),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.imposto,
      detalhamento: linhas,
      destaques,
      notas: [
        'O carnê-leão alcança o que você recebe de PESSOA FÍSICA ou do exterior, sem imposto ' +
          'retido no Brasil. O que vem de empresa já tem retenção na fonte e não entra nesta ' +
          'conta — somar os dois faria você pagar duas vezes sobre a mesma renda.',
        'O recolhimento é mensal, no mês seguinte ao recebimento, e o valor apurado aqui não ' +
          'encerra o assunto: ele é antecipação do imposto do ano, e a declaração anual acerta a ' +
          'diferença para mais ou para menos.',
        ...(v.excessoATransportar > 0
          ? [
              'O livro-caixa passou da receita deste mês. O excesso NÃO se perde: informe-o no ' +
                'campo de excesso ao calcular o mês seguinte, e assim por diante até dezembro. É o ' +
                'que a lei permite, e é o que quase ninguém aproveita.',
            ]
          : []),
        'No livro-caixa entram a remuneração paga a terceiros com vínculo e os encargos, os ' +
          'emolumentos pagos a terceiros e as despesas de custeio necessárias à atividade. Ficam ' +
          'de fora depreciação, arrendamento e — salvo representante comercial autônomo — ' +
          'locomoção e transporte.',
        'A calculadora compara as deduções legais com o desconto simplificado e adota a base ' +
          'menor, que é a que produz menos imposto. Qual das duas prevaleceu está no destaque ' +
          'acima e na memória de cálculo.',
      ],
    },
  }
}

export const CARNE_LEAO: DefinicaoCalculadora = {
  id: 'CALC-053',
  slug: 'carne-leao',
  nome: 'Carnê-leão',
  linhaDeContexto: 'Quanto recolher no mês sobre o que você recebeu de pessoas físicas.',
  descricaoSeo:
    'Calcule o carnê-leão do mês sobre rendimentos recebidos de pessoas físicas, com livro-caixa, dependentes e a comparação com o desconto simplificado.',

  campos: [
    {
      id: 'rendimento',
      rotulo: 'Recebido de pessoas físicas no mês',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
      ajuda:
        'Só o que veio de pessoa física ou do exterior. O que vem de empresa já teve imposto retido.',
    },
    {
      id: 'livroCaixa',
      rotulo: 'Despesas do livro-caixa',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda:
        'Custeio necessário à atividade, salários de terceiros e encargos, emolumentos pagos a terceiros.',
    },
    {
      id: 'excessoAnterior',
      rotulo: 'Livro-caixa que sobrou dos meses anteriores',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'O excesso pode ser usado nos meses seguintes do mesmo ano, até dezembro.',
    },
    {
      id: 'inss',
      rotulo: 'INSS pago no mês',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'A contribuição que você recolheu como contribuinte individual.',
    },
    {
      id: 'dependentes',
      rotulo: 'Dependentes',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
    },
    {
      id: 'pensao',
      rotulo: 'Pensão alimentícia judicial',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Só a fixada em decisão judicial, acordo homologado ou escritura pública.',
    },
  ],

  parametrosRequeridos: [
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
  ],

  rotuloResultado: 'Carnê-leão do mês',

  calcular,

  faq: [
    {
      pergunta: 'Quem precisa recolher o carnê-leão?',
      resposta:
        'Quem recebe de outra pessoa física, ou de fontes no exterior, rendimentos que não tiveram imposto retido no Brasil. É o caso do profissional que atende pessoas físicas, do aluguel recebido de inquilino pessoa física e da pensão alimentícia recebida. Quem presta serviço a empresa já tem o imposto retido na fonte por ela, e essa renda não entra nesta conta.',
    },
    {
      pergunta: 'Recebo de empresas e de pessoas físicas. Como fica?',
      resposta:
        'Só a parte recebida de pessoas físicas entra no carnê-leão. A parte recebida de empresas já teve retenção na fonte feita por elas. Somar as duas aqui faria você recolher duas vezes sobre a mesma renda. Na declaração anual as duas se juntam, e é lá que a conta do ano fecha — o que foi retido e o que foi recolhido por carnê-leão são abatidos do imposto devido.',
    },
    {
      pergunta: 'O que posso deduzir no livro-caixa?',
      resposta:
        'A remuneração paga a terceiros com vínculo empregatício e os respectivos encargos, os emolumentos pagos a terceiros e as despesas de custeio necessárias à percepção da receita e à manutenção da fonte produtora. A lei exclui expressamente depreciação de instalações, máquinas e equipamentos, despesas de arrendamento e, salvo no caso do representante comercial autônomo, despesas de locomoção e transporte. Tudo precisa estar escriturado e comprovado por documentação idônea.',
    },
    {
      pergunta: 'Minhas despesas passaram do que recebi no mês. Perdi a dedução?',
      resposta:
        'Não. A dedução não pode exceder a receita do mês, mas o excesso é computado nos meses seguintes, até dezembro. Informe-o no campo de excesso ao calcular o próximo mês. O que restar em dezembro é que não passa para o ano seguinte — e é por isso que vale acompanhar o saldo ao longo do ano em vez de descobrir em janeiro.',
    },
    {
      pergunta: 'Pagar o carnê-leão encerra o imposto do ano?',
      resposta:
        'Não. Ele é antecipação: o imposto definitivo é apurado na declaração anual, somando todos os rendimentos do ano e abatendo o que já foi recolhido por carnê-leão e retido na fonte. Pode sobrar imposto a pagar ou gerar restituição. Recolher em dia evita acréscimos e é o que mantém a declaração consistente.',
    },
  ],

  relacionadas: ['irrf', 'inss-autonomo-e-facultativo', 'precificacao-de-hora'],
}
