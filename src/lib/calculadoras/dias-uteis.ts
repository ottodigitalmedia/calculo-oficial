/**
 * CALC-072 — Dias úteis entre datas.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **A página corrige um erro que quase todas as concorrentes cometem.** Carnaval,
 * Sexta-feira Santa e Corpus Christi não são feriados nacionais — a Lei nº
 * 9.093/1995 é explícita, e a Sexta-Feira da Paixão é feriado religioso de lei
 * MUNICIPAL. Somá-los em silêncio dá um número errado para quem trabalha em
 * cidade que não os declara; ignorá-los dá errado para quem trabalha em cidade
 * que declara. A saída é oferecê-los **por escolha, com a natureza declarada**.
 */

import {
  calcularDiasUteis,
  type FeriadoMovel,
} from '../engine/calculadoras/dias-uteis'
import { centavos } from '../engine/types'
import { FERIADOS, IDS_DOS_FERIADOS } from '../params/data/feriados'
import { construirRegistro } from '../params/registry'
import type { DataISO } from '../params/tipos'
import {
  numero,
  texto,
  type DefinicaoCalculadora,
  type Destaque,
  type FuncaoCalculo,
} from './tipos'

/** Registro montado no módulo adiado — ver a nota em `inss.ts`. */
const registro = construirRegistro(FERIADOS)

/** Cada móvel é um campo de sim/não — o padrão é NÃO contar. */
const MOVEIS: readonly { readonly id: string; readonly qual: FeriadoMovel }[] = [
  { id: 'carnaval', qual: 'carnaval' },
  { id: 'sextaSanta', qual: 'sexta-santa' },
  { id: 'corpusChristi', qual: 'corpus-christi' },
]

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const escolhidos = MOVEIS.filter((m) => texto(valores, m.id) === 'sim').map((m) => m.qual)

  const r = calcularDiasUteis(
    {
      inicio: texto(valores, 'inicio') as DataISO,
      fim: texto(valores, 'fim') as DataISO,
      moveis: escolhidos,
      locaisEmDiaDeSemana: numero(valores, 'locais'),
      sabadoEhUtil: texto(valores, 'sabado') === 'sim',
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  const destaques: Destaque[] = [
    { rotulo: 'Dias corridos', valor: `${v.diasCorridos}` },
    { rotulo: 'Fins de semana', valor: `${v.fimDeSemana}` },
    { rotulo: 'Feriados em dia de semana', valor: `${v.feriadosEmDiaUtil.length}` },
  ]

  if (v.locaisDescontados > 0) {
    destaques.push({ rotulo: 'Feriados locais informados', valor: `${v.locaisDescontados}` })
  }

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: centavos(v.diasUteis),
      unidade: 'numero',
      casasDecimais: 0,
      /**
       * Vazia: dias úteis é uma contagem, não a decomposição de um total em
       * parcelas de dinheiro. O caminho está na memória e na tabela.
       */
      detalhamento: [],
      destaques,
      ...(v.feriadosEmDiaUtil.length > 0
        ? {
            tabela: {
              titulo: 'Os feriados que caíram em dia de semana',
              colunas: ['Data'],
              linhas: v.feriadosEmDiaUtil.map((f) => ({
                rotulo: `${f.nome}${f.nacional ? '' : ' (não é feriado nacional)'}`,
                valores: [],
              })),
            },
          }
        : {}),
      notas: [
        'Carnaval, Sexta-feira Santa e Corpus Christi NÃO são feriados nacionais, e por isso não ' +
          'vêm marcados. A Sexta-Feira da Paixão é feriado religioso declarado em lei MUNICIPAL, ' +
          'e Carnaval e Corpus Christi são ponto facultativo. Marque os que valem na sua cidade.',
        'Feriado municipal e estadual varia demais para ser publicado aqui, e por isso entra como ' +
          'quantidade: conte quantos caem em dia de semana dentro do período, pelo calendário da ' +
          'sua prefeitura, e informe o número.',
        'Os dois extremos entram na conta: o dia inicial e o dia final são contados. É a ' +
          'contagem que a maioria dos prazos comerciais usa, e não a de prazo processual, que ' +
          'tem regra própria.',
        'A lista de feriados nacionais respeita a data que você escolheu no período de ' +
          'referência: o feriado de 20 de novembro só entra a partir de 2023, e os de 21 de ' +
          'abril e 2 de novembro a partir de 2002 — foi quando as leis que os criaram passaram a ' +
          'valer.',
        'Se a sua jornada inclui sábado, marque a opção. Muita escala de comércio e de serviço ' +
          'trabalha seis dias, e nesse caso o sábado não é folga.',
      ],
    },
  }
}

export const DIAS_UTEIS: DefinicaoCalculadora = {
  id: 'CALC-072',
  slug: 'dias-uteis-entre-datas',
  nome: 'Dias úteis entre datas',
  linhaDeContexto: 'Quantos dias úteis há no período — com os feriados nacionais de verdade.',
  descricaoSeo:
    'Conte os dias úteis entre duas datas com os feriados nacionais corretos, e escolha se Carnaval, Sexta-feira Santa e Corpus Christi contam no seu caso.',

  campos: [
    {
      id: 'inicio',
      rotulo: 'Data inicial',
      tipo: 'data',
      obrigatorio: true,
    },
    {
      id: 'fim',
      rotulo: 'Data final',
      tipo: 'data',
      obrigatorio: true,
      ajuda: 'Os dois dias entram na contagem.',
    },
    {
      id: 'sabado',
      rotulo: 'O sábado é dia útil na sua jornada?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não — trabalho de segunda a sexta' },
        { valor: 'sim', rotulo: 'Sim — trabalho aos sábados' },
      ],
    },
    {
      id: 'carnaval',
      rotulo: 'Contar a terça-feira de carnaval?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não — é ponto facultativo, não feriado' },
        { valor: 'sim', rotulo: 'Sim — não trabalho nesse dia' },
      ],
    },
    {
      id: 'sextaSanta',
      rotulo: 'Contar a Sexta-feira da Paixão?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não' },
        { valor: 'sim', rotulo: 'Sim — é feriado no meu município' },
      ],
      ajuda: 'É feriado religioso declarado em lei municipal, e não em lei federal.',
    },
    {
      id: 'corpusChristi',
      rotulo: 'Contar Corpus Christi?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não — é ponto facultativo, não feriado' },
        { valor: 'sim', rotulo: 'Sim — não trabalho nesse dia' },
      ],
    },
    {
      id: 'locais',
      rotulo: 'Feriados municipais ou estaduais no período',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 60,
      ajuda: 'Quantos caem em dia de semana. O calendário da sua prefeitura é onde eles estão.',
    },
  ],

  parametrosRequeridos: [...IDS_DOS_FERIADOS],

  rotuloResultado: 'Dias úteis no período',

  calcular,

  faq: [
    {
      pergunta: 'Carnaval é feriado nacional?',
      resposta:
        'Não. A lista de feriados nacionais está em lei federal e não inclui o Carnaval — ele é ponto facultativo, o que significa que órgãos públicos podem suspender o expediente, mas a empresa privada não é obrigada a fazer o mesmo. O mesmo vale para Corpus Christi. Se na sua cidade ou no seu contrato eles não se trabalha, marque a opção e eles entram na conta; do contrário, ficam de fora.',
    },
    {
      pergunta: 'E a Sexta-feira Santa?',
      resposta:
        'É feriado religioso, e a lei atribui a declaração ao município: cada um pode declarar até quatro dias de guarda, e a Sexta-Feira da Paixão está incluída nesse limite. Ou seja, ela é feriado onde a lei municipal disser que é — o que na prática abrange a maior parte do país, mas não decorre de lei federal. Por isso a calculadora pergunta em vez de decidir por você.',
    },
    {
      pergunta: 'Por que não posso escolher o feriado da minha cidade pelo nome?',
      resposta:
        'Porque são mais de cinco mil municípios, cada um com o seu calendário e as suas datas magnas estaduais, e este produto não publica dado hiperlocal que não pode confirmar. O campo pede a quantidade de feriados locais que caem em dia de semana dentro do período — o número você tira do calendário da prefeitura, e a conta desconta.',
    },
    {
      pergunta: 'A contagem inclui o primeiro e o último dia?',
      resposta:
        'Inclui os dois. É a contagem usada na maior parte dos prazos comerciais e de entrega. Prazo processual tem regra própria — costuma excluir o dia do começo e incluir o do vencimento, além de contar só dias úteis em processo civil — e para isso esta calculadora serve como apoio, não como resposta.',
    },
    {
      pergunta: 'Os feriados mudaram ao longo dos anos?',
      resposta:
        'Mudaram, e a calculadora respeita isso. O 20 de novembro só virou feriado nacional pela lei de 2023; o 21 de abril e o 2 de novembro entraram na lista pela lei de 2002; o 12 de outubro é de 1980. Contar um período antigo com feriados que ainda não existiam daria um número errado, e por isso cada um tem a sua vigência registrada, com a lei que o criou.',
    },
  ],

  relacionadas: ['banco-de-horas', 'ferias', 'horas-extras'],
}
