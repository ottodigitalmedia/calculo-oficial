/**
 * CALC-019 — Comparador: modelo simplificado vs. completo.
 *
 * `docs/18` registrava que ela "é CALC-017 rodado duas vezes". **Não é**, e a
 * diferença importa: a apuração anual já calcula os dois modelos numa passagem
 * só, porque a lei manda adotar o de menor imposto. Rodar duas vezes seria
 * fazer o dobro do trabalho para chegar ao mesmo par de números.
 *
 * O que distingue esta calculadora de CALC-017 é o **recorte da pergunta**, não
 * a conta: lá o número grande é o saldo; aqui é a diferença entre os dois
 * modelos. Por isso ela não pede o imposto retido — retenção não muda qual
 * modelo compensa, só muda o saldo.
 *
 * É o mesmo desenho de `rescisao.ts`, que atende três modalidades com um motor:
 * duas telas sobre uma conta nunca divergem entre si.
 */

import { calcularIrpfAnual, PARAMETROS_IRPF_ANUAL } from '../engine/calculadoras/irpf-anual'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { IRPF_ANUAL } from '../params/data/irpf-anual'
import { construirRegistro } from '../params/registry'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

const registro = construirRegistro(IRPF_ANUAL)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularIrpfAnual(
    {
      rendimentosTributaveis: centavos(numero(valores, 'rendimentos')),
      inss: centavos(numero(valores, 'inss')),
      dependentes: numero(valores, 'dependentes'),
      instrucao: centavos(numero(valores, 'instrucao')),
      medicas: centavos(numero(valores, 'medicas')),
      pensao: centavos(numero(valores, 'pensao')),
      // A retenção não participa da comparação: ela desloca o saldo dos dois
      // modelos igualmente, e por isso não muda qual deles compensa.
      impostoRetido: centavos(0),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores
  const empate = v.economiaDoModelo === 0

  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Imposto pelo modelo completo', valor: v.impostoCompleto, sinal: 'neutro' },
    { rotulo: 'Imposto pelo modelo simplificado', valor: v.impostoSimplificado, sinal: 'neutro' },
  ]

  const destaques: Destaque[] = [
    {
      rotulo: 'Modelo mais vantajoso',
      valor: empate
        ? 'Empate — os dois pagam o mesmo'
        : v.modeloAdotado === 'simplificado'
          ? 'Simplificado'
          : 'Completo',
    },
    { rotulo: 'Total de deduções no completo', valor: formatarReal(v.deducoesCompleto) },
    { rotulo: 'Desconto simplificado', valor: formatarReal(v.descontoSimplificado) },
  ]

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.economiaDoModelo,
      detalhamento: linhas,
      destaques,
      notas: [
        empate
          ? 'Os dois modelos produzem o mesmo imposto. Nesse caso a declaração completa é a que ' +
            'descreve os fatos, com as despesas comprovadas — e é a que a calculadora adota.'
          : v.modeloAdotado === 'simplificado'
            ? 'O desconto simplificado supera a soma das suas deduções. Ele substitui TODAS elas: ' +
              'escolhendo o simplificado, nenhuma despesa é lançada, e é justamente por isso que ' +
              'ele compensa aqui.'
            : 'Suas deduções somam mais que o desconto simplificado. Cada uma delas precisa de ' +
              'comprovação, e é essa a contrapartida do modelo completo.',
        'A comparação vale para os rendimentos e deduções informados. Lançar uma despesa a mais ' +
          'ou a menos pode inverter o resultado — vale refazer a conta com os números finais ' +
          'antes de escolher o modelo na declaração.',
        'O desconto simplificado tem teto. A partir de certo rendimento ele para de crescer, e o ' +
          'modelo completo tende a vencer para quem tem despesas dedutíveis relevantes.',
        'A previdência privada (PGBL) não entra nesta conta, e ela pesa a favor do modelo ' +
          'completo. Quem tem PGBL deve considerar que a vantagem do completo é maior que a ' +
          'mostrada aqui.',
      ],
    },
  }
}

export const SIMPLIFICADO_OU_COMPLETO: DefinicaoCalculadora = {
  id: 'CALC-019',
  slug: 'simplificado-ou-completo',
  nome: 'Simplificado ou completo',
  linhaDeContexto: 'Qual modelo de declaração paga menos imposto, com os seus números.',
  descricaoSeo:
    'Compare o modelo simplificado e o completo da declaração do Imposto de Renda com os seus rendimentos e deduções, e veja quanto cada um paga e por quê.',

  campos: [
    {
      id: 'rendimentos',
      rotulo: 'Rendimentos tributáveis no ano',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000_000,
      ajuda:
        'Salários, pró-labore, aluguéis e aposentadoria recebidos no ano. Sem o 13º e sem rendimentos de aplicações.',
    },
    {
      id: 'inss',
      rotulo: 'Previdência oficial paga no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'INSS descontado em folha ou recolhido por carnê. Só conta no modelo completo.',
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
      id: 'medicas',
      rotulo: 'Despesas médicas no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'Suas e dos dependentes. Não têm teto legal, mas exigem comprovação.',
    },
    {
      id: 'instrucao',
      rotulo: 'Despesas com instrução no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'Ensino regular e superior, seus e dos dependentes. O teto é por pessoa.',
    },
    {
      id: 'pensao',
      rotulo: 'Pensão alimentícia judicial no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'Somente a fixada em decisão judicial ou acordo homologado. Sem teto.',
    },
  ],

  parametrosRequeridos: [...PARAMETROS_IRPF_ANUAL],
  rotuloResultado: 'Quanto o melhor modelo economiza',
  calcular,

  avisoAdicional:
    'A comparação considera apenas as deduções listadas nos campos. Previdência privada, livro-caixa e outras deduções específicas não entram, e todas elas pesam a favor do modelo completo.',

  faq: [
    {
      pergunta: 'O que exatamente é o desconto simplificado?',
      resposta:
        'É uma dedução de 20% dos rendimentos tributáveis, com teto, que substitui todas as demais deduções — art. 10 da Lei nº 9.250/1995 e seu § 1º. Quem opta por ele não lança despesa alguma: nem médicas, nem instrução, nem dependentes. Em troca, não precisa comprovar nada.',
    },
    {
      pergunta: 'Preciso escolher o modelo antes de preencher a declaração?',
      resposta:
        'Não. No programa da Receita você lança tudo o que tem e o próprio sistema indica qual modelo resulta em menos imposto. Esta calculadora antecipa essa resposta para você saber, antes de juntar recibos, se vale a pena reunir a documentação do modelo completo.',
    },
    {
      pergunta: 'Por que o simplificado deixa de compensar quando o salário sobe?',
      resposta:
        'Porque o desconto é 20% até um teto, e a partir de certo rendimento ele para de crescer enquanto os rendimentos continuam. Quem ganha acima desse ponto tem um desconto fixo em reais, enquanto as deduções reais — plano de saúde, escola, dependentes — costumam acompanhar o padrão de vida.',
    },
    {
      pergunta: 'Em caso de empate, qual modelo a calculadora adota?',
      resposta:
        'O completo. Sem diferença no imposto, a declaração que lança as despesas comprovadas é a que descreve os fatos — e é a que deixa rastro documental caso a declaração seja questionada depois.',
    },
    {
      pergunta: 'Por que só 2024 e 2025 aparecem no seletor de período?',
      resposta:
        'Porque a Lei nº 15.270/2025 revogou o artigo da tabela anual e criou um redutor novo a partir de 2026. A estrutura da apuração mudou, e não apenas os valores. Enquanto ela não for estudada e cadastrada com a norma correspondente, oferecer 2026 seria calcular por uma regra revogada.',
    },
  ],

  relacionadas: ['restituicao-irpf', 'irrf', 'salario-liquido', 'carne-leao'],
}
