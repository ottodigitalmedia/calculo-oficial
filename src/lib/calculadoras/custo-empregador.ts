/**
 * CALC-011 — Custo real do funcionário.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A única do catálogo escrita do lado do empregador**, e a que mais perto
 * passa da fronteira que `00-catalogo` §14 fechou. O que a mantém do lado certo
 * está explicado no motor: só entram alíquotas do corpo da Lei nº 8.212/1991, e
 * a de terceiros é campo do usuário — que é o que o próprio §14 prescreve.
 */

import { calcularCustoEmpregador } from '../engine/calculadoras/custo-empregador'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { EMPREGADOR } from '../params/data/empregador'
import { TRABALHISTA } from '../params/data/trabalhista'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** `TRABALHISTA` entra pelo FGTS, que já era parâmetro do sistema. */
const registro = construirRegistro(EMPREGADOR, TRABALHISTA)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const escolha = texto(valores, 'grauDeRisco')
  const grauDeRisco = escolha === 'grave' ? 'grave' : escolha === 'medio' ? 'medio' : 'leve'

  const r = calcularCustoEmpregador(
    {
      salario: centavos(numero(valores, 'salario')),
      grauDeRisco,
      terceiros: basisPoints(numero(valores, 'terceiros')),
      beneficios: centavos(numero(valores, 'beneficios')),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores
  const salario = centavos(numero(valores, 'salario'))
  const beneficios = centavos(numero(valores, 'beneficios'))

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.custoMensal,
      detalhamento: [
        { rotulo: 'Salário contratado', valor: salario, sinal: 'neutro' },
        { rotulo: 'Contribuição patronal (20%)', valor: v.patronal, sinal: 'debito' },
        { rotulo: 'RAT', valor: v.rat, sinal: 'debito' },
        ...(v.terceiros > 0
          ? ([{ rotulo: 'Terceiros (Sistema S)', valor: v.terceiros, sinal: 'debito' }] as const)
          : []),
        { rotulo: 'FGTS', valor: v.fgts, sinal: 'debito' },
        { rotulo: 'Provisão de 13º', valor: v.provisaoDecimoTerceiro, sinal: 'debito' },
        { rotulo: 'Provisão de férias + 1/3', valor: v.provisaoFerias, sinal: 'debito' },
        { rotulo: 'Encargos sobre as provisões', valor: v.encargosSobreProvisoes, sinal: 'debito' },
        ...(beneficios > 0
          ? ([{ rotulo: 'Benefícios informados', valor: beneficios, sinal: 'debito' }] as const)
          : []),
        { rotulo: 'Custo mensal total', valor: v.custoMensal, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Acréscimo sobre o salário', valor: formatarPercentual(v.acrescimoBp) },
        { rotulo: 'Custo em 12 meses', valor: formatarReal(v.custoAnual) },
        { rotulo: 'Alíquota total de encargos', valor: formatarPercentual(v.aliquotaDeEncargosBp) },
      ],
      notas: [
        'O cálculo cobre o regime geral. Simples Nacional, desoneração da folha e ' +
          'substituição da contribuição patronal ficam de fora — nesses regimes a patronal de ' +
          '20% pode não ser devida sobre a folha, e o custo é bem menor.',
        ...(v.terceiros === 0
          ? [
              'A alíquota de terceiros (Sistema S) não foi informada e por isso não entrou na ' +
                'conta. Ela varia conforme o código FPAS da atividade, costuma ficar entre 3% e ' +
                '5,8%, e o custo real será maior que o mostrado acima.',
            ]
          : []),
        'O RAT pode ser multiplicado pelo FAP, um fator entre 0,5 e 2,0 calculado a partir do ' +
          'histórico de acidentes da empresa. Esta conta usa a alíquota base.',
      ],
    },
  }
}

export const CUSTO_EMPREGADOR: DefinicaoCalculadora = {
  id: 'CALC-011',
  slug: 'custo-do-funcionario',
  nome: 'Custo real do funcionário',
  linhaDeContexto: 'Quanto um salário custa de verdade — com encargos e provisões na conta.',
  descricaoSeo:
    'Calcule o custo real de um funcionário CLT: contribuição patronal, RAT, terceiros, FGTS e as provisões de 13º e férias, com a norma de cada encargo.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário contratado',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'grauDeRisco',
      rotulo: 'Grau de risco da atividade (RAT)',
      tipo: 'selecao',
      padrao: 'leve',
      opcoes: [
        { valor: 'leve', rotulo: 'Leve — 1%' },
        { valor: 'medio', rotulo: 'Médio — 2%' },
        { valor: 'grave', rotulo: 'Grave — 3%' },
      ],
      ajuda: 'É o da atividade preponderante da empresa, definida no enquadramento por CNAE.',
    },
    {
      id: 'terceiros',
      rotulo: 'Alíquota de terceiros (Sistema S)',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 2_000,
      ajuda:
        'Varia pelo código FPAS da atividade e não é parâmetro deste sistema. Em branco, fica fora da conta.',
    },
    {
      id: 'beneficios',
      rotulo: 'Benefícios mensais',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'Vale-transporte, plano de saúde e afins. Entram pelo valor, sem encargos.',
    },
  ],

  parametrosRequeridos: [
    'contribuicao-patronal',
    'rat-risco-leve',
    'fgts-aliquota-deposito',
  ],

  rotuloResultado: 'Custo mensal total',

  calcular,

  avisoAdicional:
    'O cálculo cobre o regime geral. Simples Nacional, desoneração da folha e FAP não entram — em qualquer um deles o custo muda, e a diferença não é pequena.',

  faq: [
    {
      pergunta: 'Por que o custo é tão maior que o salário?',
      resposta:
        'Porque o salário é só a parte que o funcionário vê. Sobre ele incidem a contribuição patronal de 20% (Lei nº 8.212/1991, art. 22, I), o RAT de 1% a 3% (art. 22, II) e o FGTS de 8%. E além disso correm as provisões: o 13º e as férias com o terço são devidos mês a mês, ainda que pagos depois — e sofrem os mesmos encargos.',
    },
    {
      pergunta: 'Por que a alíquota de terceiros não vem preenchida?',
      resposta:
        'Porque ela varia conforme o código FPAS da atividade da empresa e depende de tabela mantida por outro órgão. Inventar um valor médio produziria um número com aparência de exato — este projeto não faz isso. Se você souber a alíquota da sua empresa, informe; se deixar em branco, o resultado sai declarado como incompleto naquela parte.',
    },
    {
      pergunta: 'O terço de férias sofre contribuição patronal?',
      resposta:
        'Sim, desde 15 de setembro de 2020. Até então prevalecia a tese do Superior Tribunal de Justiça, firmada em repetitivo de 2014, de que o terço tinha natureza indenizatória. O Supremo Tribunal Federal decidiu o contrário no Tema 985 da Repercussão Geral, com modulação: a cobrança vale a partir daquela data. É a mudança que mais mexeu no custo de folha na última década.',
    },
    {
      pergunta: 'Serve para empresa do Simples Nacional?',
      resposta:
        'Não sem ressalva. Na maior parte dos anexos do Simples a contribuição patronal de 20% não é recolhida sobre a folha, e o custo cai bastante. Este cálculo cobre o regime geral. Tributação por regime empresarial está fora do escopo do projeto, e essa decisão está registrada no catálogo.',
    },
    {
      pergunta: 'E o FAP?',
      resposta:
        'O Fator Acidentário de Prevenção multiplica a alíquota do RAT por um fator entre 0,5 e 2,0, conforme o histórico de acidentes da empresa. Ele é apurado anualmente e informado à empresa; esta conta usa a alíquota base, sem o fator. Se o seu FAP for conhecido, o RAT real é a alíquota base multiplicada por ele.',
    },
    {
      pergunta: 'As provisões são dinheiro que sai todo mês?',
      resposta:
        'Não saem da conta todo mês, mas são devidas todo mês. Provisionar um doze avos de 13º e de férias é o que impede o caixa de parecer confortável em março e apertado em dezembro. Do ponto de vista de custo — que é o que esta calculadora mede — elas são custo do mês em que o trabalho aconteceu.',
    },
  ],

  relacionadas: ['salario-liquido', 'fgts', 'rescisao-sem-justa-causa'],
}
