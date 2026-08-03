/**
 * CALC-052 — Limite de faturamento do MEI e desenquadramento.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A pergunta que traz gente aqui é "estourei, e agora?"** — e a lei tem dois
 * desfechos muito diferentes, separados por uma linha de 20%. Até lá, o
 * desenquadramento vale do ano seguinte; acima, ele RETROAGE ao começo do ano do
 * excesso e muda a tributação do ano inteiro.
 *
 * **O segundo erro mais comum é o limite proporcional.** Quem abre em outubro
 * não tem o teto cheio, e a lei conta fração de mês como mês inteiro.
 */

import { calcularLimiteMei } from '../engine/calculadoras/mei'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { MEI } from '../params/data/mei'
import { construirRegistro } from '../params/registry'
import {
  numero,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
  type LinhaDetalhamento,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(MEI)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularLimiteMei(
    {
      faturamentoNoAno: centavos(numero(valores, 'faturamento')),
      mesesDeAtividade: numero(valores, 'mesesDeAtividade'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  /** As linhas somam o limite exibido. */
  const linhas: LinhaDetalhamento[] =
    v.situacao === 'dentro'
      ? [
          { rotulo: 'Já faturado no ano', valor: v.faturamento, sinal: 'neutro' },
          { rotulo: 'Ainda cabe', valor: v.margem, sinal: 'neutro' },
          { rotulo: 'Limite do ano', valor: v.limite, sinal: 'neutro' },
        ]
      : [
          { rotulo: 'Limite do ano', valor: v.limite, sinal: 'neutro' },
          { rotulo: 'Quanto passou', valor: v.excesso, sinal: 'neutro' },
          { rotulo: 'Já faturado no ano', valor: v.faturamento, sinal: 'neutro' },
        ]

  const destaques: Destaque[] = [
    {
      rotulo: 'Situação',
      valor:
        v.situacao === 'dentro'
          ? 'Dentro do limite'
          : v.situacao === 'excedeu-ate-20'
            ? 'Passou do limite, em até 20%'
            : 'Passou do limite em mais de 20%',
    },
    { rotulo: 'Média mensal que cabe no limite', valor: formatarReal(v.mediaMensalDoLimite) },
    {
      rotulo: 'A linha dos 20%, em que o efeito retroage',
      valor: formatarReal(v.limiteComTolerancia),
    },
  ]

  if (v.situacao === 'dentro') {
    destaques.push({
      rotulo: 'Ainda cabe antes de o efeito retroagir',
      valor: formatarReal(v.margemAteRetroagir),
    })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.limite,
      detalhamento: linhas,
      destaques,
      notas: [
        ...(v.proRata
          ? [
              'O limite deste ano é PROPORCIONAL, porque a atividade começou no meio dele. Quem abre ' +
                'em outubro não tem o teto cheio — e a lei conta fração de mês como mês inteiro.',
            ]
          : []),
        'Ultrapassar o limite tem dois desfechos, e a diferença entre eles é grande. Até 20% de ' +
          'excesso, o desenquadramento vale a partir de 1º de janeiro do ano seguinte, e a ' +
          'diferença de tributos é recolhida junto com a apuração de janeiro. Acima de 20%, ele ' +
          'RETROAGE a 1º de janeiro do ano do excesso, e a tributação do ano inteiro é refeita.',
        ...(v.situacao === 'excedeu-acima-de-20'
          ? [
              'Pelos valores informados, o excesso passou dos 20%. É o desfecho em que a tributação ' +
                'do ano inteiro é refeita pelas regras gerais do Simples Nacional — vale procurar ' +
                'um contador antes do fim do prazo de comunicação.',
            ]
          : []),
        ...(v.situacao === 'excedeu-ate-20'
          ? [
              'Pelos valores informados, o excesso ficou dentro dos 20%. O desenquadramento vale a ' +
                'partir do ano seguinte, e a diferença é recolhida em parcela única com a apuração ' +
                'de janeiro.',
            ]
          : []),
        'O que conta é a RECEITA BRUTA do ano-calendário, e não o lucro: o que entrou pelas vendas ' +
          'e serviços, sem descontar despesa nenhuma.',
        'O desenquadramento não fecha a empresa. Ela passa a recolher pelas regras gerais do ' +
          'Simples Nacional, com obrigações diferentes — e é essa mudança, não o excesso em si, ' +
          'que muda o custo do negócio.',
      ],
    },
  }
}

export const LIMITE_DO_MEI: DefinicaoCalculadora = {
  id: 'CALC-052',
  slug: 'limite-do-mei',
  nome: 'Limite de faturamento do MEI',
  linhaDeContexto: 'Quanto ainda cabe no ano — e o que muda se você passar do teto.',
  descricaoSeo:
    'Descubra quanto ainda pode faturar como MEI neste ano, o limite proporcional de quem abriu no meio do ano e o que acontece ao ultrapassar o teto.',

  campos: [
    {
      id: 'faturamento',
      rotulo: 'Quanto você já faturou neste ano',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
      ajuda: 'Receita bruta: o que entrou por vendas e serviços, sem descontar despesa.',
    },
    {
      id: 'mesesDeAtividade',
      rotulo: 'Meses de atividade, se abriu neste ano',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 12,
      ajuda:
        'Deixe em zero se o CNPJ já existia em 1º de janeiro. Fração de mês conta como mês inteiro.',
    },
  ],

  parametrosRequeridos: [
    'mei-limite-receita-anual',
    'mei-limite-mensal-inicio',
    'mei-tolerancia-excesso',
  ],

  rotuloResultado: 'Limite de receita do ano',

  calcular,

  faq: [
    {
      pergunta: 'O que acontece se eu passar do limite?',
      resposta:
        'Depende de quanto você passou, e a diferença é grande. Até 20% de excesso, o desenquadramento vale a partir de 1º de janeiro do ano seguinte, e a diferença de tributos é recolhida em parcela única junto com a apuração de janeiro. Acima de 20%, o desenquadramento retroage a 1º de janeiro do ano em que houve o excesso, e a tributação do ano inteiro é refeita pelas regras gerais do Simples Nacional.',
    },
    {
      pergunta: 'Abri o CNPJ no meio do ano. O limite é o mesmo?',
      resposta:
        'Não, e esse é o engano mais comum. No ano de abertura o limite é proporcional aos meses de atividade, e a lei conta fração de mês como mês inteiro — quem abriu em outubro tem três meses, não um teto cheio. Informe os meses no campo e a calculadora aplica a proporção; deixe em zero se o CNPJ já existia em 1º de janeiro.',
    },
    {
      pergunta: 'O limite é sobre o lucro ou sobre o faturamento?',
      resposta:
        'Sobre a receita bruta, que é tudo o que entrou por vendas e serviços no ano-calendário, sem descontar nenhuma despesa. Comprar mercadoria, pagar frete ou alugar espaço não reduz o valor que conta para o limite. É por isso que um MEI com margem apertada pode estourar o teto sem ter ganhado muito.',
    },
    {
      pergunta: 'Se eu me desenquadrar, minha empresa fecha?',
      resposta:
        'Não. Ela deixa de recolher pelo valor fixo do MEI e passa a recolher pelas regras gerais do Simples Nacional, como microempresa. O CNPJ continua o mesmo. O que muda é o custo e as obrigações — a partir daí os tributos passam a ser um percentual do faturamento, com contabilidade e declarações próprias, e é aí que faz diferença ter um contador.',
    },
    {
      pergunta: 'Posso simplesmente parar de emitir nota em dezembro?',
      resposta:
        'A receita bruta é o que foi auferido, não o que foi documentado — deixar de emitir não faz o valor sair da conta, e omitir receita é outro problema, bem maior que o desenquadramento. O que dá para fazer legitimamente é planejar: acompanhar a média mensal que cabe no limite, que o resultado mostra, e organizar a agenda de faturamento ao longo do ano em vez de descobrir em dezembro.',
    },
  ],

  relacionadas: ['das-mei', 'precificacao-de-hora', 'inss-autonomo-e-facultativo'],
}
