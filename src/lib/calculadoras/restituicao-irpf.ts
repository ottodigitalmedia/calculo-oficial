/**
 * CALC-017 — Restituição estimada do IRPF.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Ficou bloqueada de 01/08 a 06/08/2026 por fonte, e não por código.** O que
 * faltava era a tabela ANUAL do ano-calendário 2025, e a busca anterior tinha
 * parado na página do exercício corrente da Receita — que traz a de 2026. A
 * história está em `ESTADO-DO-PROJETO` §6.6.2.
 *
 * **O resultado é um saldo com SINAL.** Positivo restitui, negativo paga. Foi
 * decidido assim em vez de exibir o módulo com um rótulo ao lado: quem abre
 * esperando restituição e encontra imposto a pagar precisa ver isso no número
 * grande, não numa legenda. O padrão é o de CALC-034.
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

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(IRPF_ANUAL)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const retido = centavos(numero(valores, 'retido'))

  const r = calcularIrpfAnual(
    {
      rendimentosTributaveis: centavos(numero(valores, 'rendimentos')),
      inss: centavos(numero(valores, 'inss')),
      dependentes: numero(valores, 'dependentes'),
      instrucao: centavos(numero(valores, 'instrucao')),
      medicas: centavos(numero(valores, 'medicas')),
      pensao: centavos(numero(valores, 'pensao')),
      impostoRetido: retido,
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores
  const aRestituir = v.saldo > 0

  const linhas: LinhaDetalhamento[] = [
    { rotulo: 'Imposto retido na fonte no ano', valor: retido, sinal: 'neutro' },
    { rotulo: 'Imposto devido no ajuste', valor: v.impostoDevido, sinal: 'debito' },
  ]

  const destaques: Destaque[] = [
    {
      rotulo: 'Modelo mais vantajoso',
      valor: v.modeloAdotado === 'simplificado' ? 'Simplificado' : 'Completo',
    },
    { rotulo: 'Imposto devido', valor: formatarReal(v.impostoDevido) },
    { rotulo: 'Base de cálculo adotada', valor: formatarReal(
      v.modeloAdotado === 'simplificado' ? v.baseSimplificado : v.baseCompleto,
    ) },
  ]

  if (v.economiaDoModelo > 0) {
    destaques.push({
      rotulo: 'Economia por escolher esse modelo',
      valor: formatarReal(v.economiaDoModelo),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.saldo,
      detalhamento: linhas,
      destaques,
      notas: [
        aRestituir
          ? 'Saldo positivo significa que foi retido mais imposto do que o devido, e a diferença ' +
            'volta como restituição. O valor e o lote dependem da data de entrega e das ' +
            'prioridades legais, que esta conta não conhece.'
          : 'Saldo negativo significa imposto A PAGAR: o retido ao longo do ano ficou abaixo do ' +
            'devido. Não é erro da folha — acontece com quem teve mais de uma fonte de renda, ' +
            'porque cada uma retém como se fosse a única.',
        'Só entram aqui os rendimentos TRIBUTÁVEIS. Décimo terceiro, aplicações financeiras e ' +
          'demais rendimentos de tributação exclusiva têm imposto definitivo e não voltam ao ' +
          'ajuste — somá-los aqui distorce o resultado para pior.',
        'A previdência privada (PGBL) NÃO entra nesta conta. Ela é dedutível dentro de um limite ' +
          'legal que ainda não foi conferido em fonte oficial para este projeto, e preferimos ' +
          'omitir a estimar. Quem tem PGBL tende a pagar menos que o calculado aqui.',
        'O teto da despesa com instrução é por pessoa. A calculadora recebe a soma e aplica o ' +
          'limite multiplicado pelo número de pessoas — o que coincide com a lei quando ninguém ' +
          'isoladamente ultrapassou o próprio teto. A memória de cálculo mostra o limite aplicado.',
      ],
    },
  }
}

export const RESTITUICAO_IRPF: DefinicaoCalculadora = {
  id: 'CALC-017',
  slug: 'restituicao-irpf',
  nome: 'Restituição do Imposto de Renda',
  linhaDeContexto: 'Se você tem imposto a restituir ou a pagar na declaração anual.',
  descricaoSeo:
    'Estime a restituição ou o imposto a pagar na Declaração de Ajuste Anual, com dependentes, instrução e despesas médicas, e veja qual modelo compensa. Com a tabela anual e a norma de cada dedução.',

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
      ajuda: 'INSS descontado em folha ou recolhido por carnê. Dedutível sem teto.',
    },
    {
      id: 'retido',
      rotulo: 'Imposto retido na fonte no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'A soma do IRRF descontado ao longo do ano. Está no informe de rendimentos.',
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
      ajuda:
        'Ensino regular e superior, seus e dos dependentes. Cursos livres e material escolar não entram.',
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
  rotuloResultado: 'Saldo do ajuste anual',
  calcular,

  avisoAdicional:
    'Esta é uma estimativa do ajuste anual, e não substitui o programa da Receita. Ela não trata previdência privada, rendimentos de tributação exclusiva, ganho de capital nem rendimentos recebidos do exterior.',

  faq: [
    {
      pergunta: 'Por que deu imposto a pagar se todo mês já descontaram na folha?',
      resposta:
        'Porque cada fonte pagadora retém como se fosse a única. Com dois empregos, ou emprego mais aposentadoria, cada uma aplica a tabela desde a primeira faixa — e a soma no ano cai numa faixa mais alta do que qualquer uma delas isoladamente. O ajuste anual cobra essa diferença, e é a causa mais comum de saldo a pagar.',
    },
    {
      pergunta: 'O que é o modelo simplificado, e quando ele compensa?',
      resposta:
        'É um desconto de 20% sobre os rendimentos tributáveis, com teto, que substitui TODAS as demais deduções — art. 10 da Lei nº 9.250/1995. Ele compensa quando as deduções reais somam menos que esse desconto, que é o caso de quem tem poucas despesas dedutíveis. A calculadora apura os dois modelos e adota o de menor imposto; a memória mostra os dois números lado a lado.',
    },
    {
      pergunta: 'Despesa médica tem limite?',
      resposta:
        'Não. O art. 8º, II, "a", da Lei nº 9.250/1995 enumera o que é dedutível e não fixa teto algum, ao contrário da instrução, que tem valor máximo por pessoa. A contrapartida é a comprovação: a despesa precisa ser sua ou de dependente declarado, com recibo identificando quem prestou e quem pagou.',
    },
    {
      pergunta: 'Por que a calculadora não aceita o ano-calendário de 2026?',
      resposta:
        'Porque a Lei nº 15.270/2025 revogou o artigo que fixava a tabela anual e criou um redutor novo para rendimentos mais altos, com produção de efeitos a partir de 2026. A apuração deixou de ser a mesma conta com outros números. Aplicar a tabela de 2025 a 2026 produziria um valor errado com aparência de exato — preferimos bloquear e dizer por quê.',
    },
    {
      pergunta: 'A restituição sai no valor calculado aqui?',
      resposta:
        'O saldo é o ponto de partida. O valor efetivamente restituído é corrigido pela taxa Selic entre a data prevista de entrega e o pagamento do lote, e o lote depende da data de entrega e das prioridades legais. Esta conta estima o saldo, não a data nem a correção.',
    },
  ],

  relacionadas: ['simplificado-ou-completo', 'irrf', 'carne-leao', 'salario-liquido'],
}
