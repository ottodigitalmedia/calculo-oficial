/**
 * CALC-051 — Pró-labore e encargos do sócio.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A página mostra de onde vêm os 11%**, que nenhuma norma escreve: são os 20%
 * do art. 21 menos os 9% de teto da dedução do art. 30, § 4º. Um número que
 * ninguém sabe de onde vem é um número que ninguém audita — e a memória de
 * cálculo existe exatamente para isso.
 *
 * **Se a patronal é recolhida por fora ou está no DAS é campo do usuário**, e
 * não uma classificação que a calculadora faça: depende do anexo do Simples, da
 * atividade e do fator R. Quem sabe é o contador.
 */

import { calcularProLabore } from '../engine/calculadoras/pro-labore'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { INSS } from '../params/data/inss'
import { INSS_INDIVIDUAL } from '../params/data/inss-individual'
import { IRRF } from '../params/data/irrf'
import { construirRegistro } from '../params/registry'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(INSS, INSS_INDIVIDUAL, IRRF)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const proLabore = centavos(numero(valores, 'proLabore'))

  const r = calcularProLabore(
    {
      proLabore,
      patronalPorFora: texto(valores, 'patronal') === 'fora',
      dependentes: numero(valores, 'dependentes'),
      pensao: centavos(numero(valores, 'pensao')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o pró-labore bruto. */
  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Pró-labore bruto', valor: proLabore, sinal: 'credito' },
    { rotulo: `INSS — ${formatarPercentual(v.aliquotaDoSocioBp)}`, valor: v.inssDoSocio, sinal: 'debito' },
    { rotulo: 'IRRF', valor: v.irrf, sinal: 'debito' },
    { rotulo: 'Líquido do sócio', valor: v.liquidoDoSocio, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    { rotulo: 'Custo para a empresa', valor: formatarReal(v.custoDaEmpresa) },
    { rotulo: 'Custo em doze meses', valor: formatarReal(v.custoAnual) },
    {
      rotulo: 'Do que a empresa gasta, chega ao sócio',
      valor: formatarPercentual(v.parteQueChegaBp),
    },
  ]

  if (v.patronal > 0) {
    destaques.push({ rotulo: 'Patronal recolhida por fora', valor: formatarReal(v.patronal) })
  }
  if (v.limitadoPeloTeto) {
    destaques.push({ rotulo: 'Base do INSS limitada ao teto', valor: formatarReal(v.baseInss) })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.liquidoDoSocio,
      detalhamento: linhas,
      destaques,
      notas: [
        'Os 11% que a empresa desconta não estão escritos em norma nenhuma. São os 20% que o ' +
          'contribuinte individual deve, menos a dedução de 45% da contribuição patronal, que a ' +
          'lei limita a 9% do salário-de-contribuição. A memória de cálculo mostra a subtração.',
        'Quem desconta e recolhe o INSS do sócio é a EMPRESA, junto com a parcela a cargo dela. O ' +
          'sócio não emite guia por essa parte — diferente do autônomo que atende pessoas físicas.',
        ...(v.patronal > 0
          ? [
              'A patronal de 20% incide sobre o pró-labore INTEIRO, sem teto. O desconto do sócio, ' +
                'esse, para no limite máximo do salário-de-contribuição — e é por isso que os dois ' +
                'não crescem juntos.',
            ]
          : [
              'Você informou que a contribuição patronal está dentro do DAS do Simples, e por isso ' +
                'ela não aparece como custo separado. Se a sua empresa recolhe os 20% por fora, ' +
                'mude a opção: o custo total muda bastante.',
            ]),
        'O pró-labore é obrigatório quando há sócio trabalhando na empresa, e é ele que sustenta ' +
          'a contagem para os benefícios do INSS. Distribuição de lucros não conta tempo de ' +
          'contribuição, por mais alta que seja.',
        'Esta conta é só do pró-labore. O que o sócio recebe como distribuição de lucros tem ' +
          'regra própria de tributação, que mudou em 2026 — não some as duas coisas aqui.',
      ],
    },
  }
}

export const PRO_LABORE: DefinicaoCalculadora = {
  id: 'CALC-051',
  slug: 'pro-labore',
  nome: 'Pró-labore e encargos do sócio',
  linhaDeContexto: 'Quanto sobra para o sócio e quanto custa para a empresa — com os 11% explicados.',
  descricaoSeo:
    'Calcule o líquido do pró-labore com INSS e IRRF, e o custo total para a empresa com a contribuição patronal. Veja de onde vêm os 11% descontados do sócio.',

  campos: [
    {
      id: 'proLabore',
      rotulo: 'Pró-labore bruto do mês',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'patronal',
      rotulo: 'Como a empresa recolhe a contribuição patronal?',
      tipo: 'selecao',
      padrao: 'das',
      opcoes: [
        { valor: 'das', rotulo: 'Está dentro do DAS do Simples Nacional' },
        { valor: 'fora', rotulo: 'Recolhe os 20% por fora' },
      ],
      ajuda:
        'Depende do anexo em que a empresa é tributada. Na dúvida, o seu contador sabe — e a diferença no custo é grande.',
    },
    {
      id: 'dependentes',
      rotulo: 'Dependentes para o IRRF',
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
    },
  ],

  parametrosRequeridos: [
    'inss-individual-aliquota-completa',
    'inss-patronal-contribuinte-individual',
    'inss-individual-deducao-maxima',
    'inss-tabela-progressiva',
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
  ],

  rotuloResultado: 'Líquido do sócio',

  calcular,

  faq: [
    {
      pergunta: 'De onde vêm os 11% descontados do pró-labore?',
      resposta:
        'De uma subtração que nenhuma norma escreve pronta. O contribuinte individual deve 20% sobre o salário-de-contribuição; a empresa recolhe outros 20% sobre a remuneração que paga a ele; e a lei permite ao segurado deduzir 45% da contribuição da empresa, limitada essa dedução a 9% do salário-de-contribuição. Como 45% de 20% dão exatamente 9%, o teto é alcançado e a contribuição do sócio cai de 20% para 11%. A memória de cálculo mostra a subtração passo a passo.',
    },
    {
      pergunta: 'A empresa paga 20% além do pró-labore?',
      resposta:
        'Depende do regime. Empresas do Simples Nacional em determinados anexos têm a contribuição patronal incluída no DAS, e nesse caso não há recolhimento separado. Em outros anexos e nos regimes de lucro presumido e real, os 20% são recolhidos por fora e entram no custo. Como isso depende da atividade e do fator R, a calculadora pergunta em vez de adivinhar — e a diferença no custo total é grande.',
    },
    {
      pergunta: 'O desconto do sócio tem teto?',
      resposta:
        'Tem. O INSS descontado do sócio para no limite máximo do salário-de-contribuição, como o do empregado. A contribuição patronal, essa, incide sobre o pró-labore inteiro e não tem teto — por isso os dois deixam de crescer juntos a partir de certo valor, e o custo da empresa continua subindo depois que o desconto do sócio estacionou.',
    },
    {
      pergunta: 'Posso pagar só distribuição de lucros e não pró-labore?',
      resposta:
        'O pró-labore é devido ao sócio que trabalha na empresa, e é ele que sustenta a contagem de tempo para os benefícios do INSS — distribuição de lucros não conta tempo de contribuição, por mais alta que seja. Zerar o pró-labore de quem efetivamente trabalha costuma ser questionado pela fiscalização, e a decisão sobre o valor adequado é do contador, não desta página.',
    },
    {
      pergunta: 'Esta conta inclui a distribuição de lucros?',
      resposta:
        'Não. Ela é só do pró-labore, que é remuneração pelo trabalho. A distribuição de lucros tem regra de tributação própria, e ela mudou a partir de janeiro de 2026 — pagamentos acima de determinado valor mensal, da mesma empresa ao mesmo sócio, passaram a sofrer retenção na fonte. Somar as duas coisas aqui daria um número errado.',
    },
  ],

  relacionadas: ['inss-autonomo-e-facultativo', 'irrf', 'das-mei'],
}
