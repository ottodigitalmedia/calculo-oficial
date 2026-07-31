/**
 * CALC-005 — 13º salário.
 *
 * Campos e microcopy de `03-functional-spec` §3.5, usados literalmente —
 * inclusive a nota fixa sobre a 1ª parcela.
 *
 * **A armadilha desta calculadora** está em `ESTADO-DO-PROJETO` §7.1: o §3º do
 * Art. 3º-A aplica a redução do imposto **também ao 13º**, cobrado
 * exclusivamente na fonte. O motor de IRRF já a implementa, e por isso ela
 * entra aqui sem tratamento especial — mas é a razão de o resultado poder ser
 * isento onde a tabela sozinha cobraria.
 *
 * Regras: `RN-010`, `RN-015`, `RN-016`.
 */

import { calcularDecimoTerceiro } from '../engine/calculadoras/ferias-e-decimo-terceiro'
import { centavos } from '../engine/types'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Registro montado no módulo adiado — ver a nota em `salario-liquido.ts`. */
const registro = construirRegistro(INSS, IRRF)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const escolha = texto(valores, 'parcela')
  const parcela = escolha === 'primeira' || escolha === 'segunda' ? escolha : 'total'

  const r = calcularDecimoTerceiro(
    {
      salario: centavos(numero(valores, 'salario')),
      mesesTrabalhados: numero(valores, 'mesesTrabalhados'),
      parcela,
      mediaVariaveis: centavos(numero(valores, 'mediaVariaveis')),
      dependentes: numero(valores, 'dependentes'),
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r

  const v = r.valores

  // O detalhamento muda com a parcela escolhida: mostrar desconto na 1ª parcela
  // contradiria a nota fixa, que diz que ela não os sofre.
  const detalhamento =
    parcela === 'primeira'
      ? ([
          { rotulo: '13º integral do período', valor: v.totalBruto, sinal: 'neutro' },
          { rotulo: '1ª parcela — adiantamento', valor: v.primeiraParcela, sinal: 'credito' },
        ] as const)
      : ([
          { rotulo: '13º integral do período', valor: v.totalBruto, sinal: 'credito' },
          ...(parcela === 'segunda'
            ? ([
                {
                  rotulo: '1ª parcela já recebida',
                  valor: v.primeiraParcela,
                  sinal: 'debito',
                },
              ] as const)
            : []),
          { rotulo: 'Contribuição previdenciária (INSS)', valor: v.inss, sinal: 'debito' },
          { rotulo: 'Imposto de Renda retido na fonte', valor: v.irrf, sinal: 'debito' },
          { rotulo: 'Valor líquido estimado', valor: v.aReceber, sinal: 'neutro' },
        ] as const)

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.aReceber,
      detalhamento: [...detalhamento],
      destaques: [{ rotulo: 'Avos', valor: `${v.avos}/12` }],
      notas: [
        // Texto final de §3.5.
        'A 1ª parcela é adiantamento e não sofre desconto de INSS nem de Imposto de Renda. Os descontos incidem na 2ª parcela, sobre o valor total do 13º.',
      ],
    },
  }
}

export const DECIMO_TERCEIRO: DefinicaoCalculadora = {
  id: 'CALC-005',
  slug: 'decimo-terceiro',
  nome: '13º salário',
  linhaDeContexto:
    'Quanto você recebe de 13º, por parcela — com os descontos no lugar em que a lei os cobra.',
  descricaoSeo:
    'Calcule o 13º salário proporcional, a 1ª e a 2ª parcela, com INSS e Imposto de Renda apurados em separado. Veja o passo a passo e a norma de cada etapa.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário bruto mensal',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
    },
    {
      id: 'mesesTrabalhados',
      rotulo: 'Meses trabalhados no ano',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 12,
      minimo: 1,
      maximo: 12,
      ajuda: 'Conta como mês integral aquele com 15 dias ou mais de trabalho.',
    },
    {
      id: 'parcela',
      rotulo: 'O que quer calcular',
      tipo: 'selecao',
      padrao: 'total',
      opcoes: [
        { valor: 'total', rotulo: 'Total do ano' },
        { valor: 'primeira', rotulo: '1ª parcela' },
        { valor: 'segunda', rotulo: '2ª parcela' },
      ],
    },
    {
      id: 'mediaVariaveis',
      rotulo: 'Média de horas extras e comissões',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
      ajuda: 'O que é habitual integra a base do 13º.',
    },
    {
      id: 'dependentes',
      rotulo: 'Número de dependentes',
      tipo: 'inteiro',
      padrao: 0,
      minimo: 0,
      maximo: 20,
    },
  ],

  parametrosRequeridos: [
    'inss-tabela-progressiva',
    'irrf-tabela-progressiva',
    'irrf-deducao-dependente',
    'irrf-desconto-simplificado',
  ],

  rotuloResultado: 'Valor líquido estimado do 13º',

  calcular,

  faq: [
    {
      pergunta: 'Por que a 2ª parcela é bem menor que a 1ª?',
      resposta:
        'Porque os descontos de INSS e de Imposto de Renda incidem sobre o valor TOTAL do 13º, e são cobrados de uma vez na 2ª parcela. A 1ª é adiantamento puro, sem desconto. Com poucos avos, a 2ª parcela pode chegar a zero — e isso não é erro de cálculo.',
    },
    {
      pergunta: 'O desconto de INSS do 13º soma com o do salário do mês?',
      resposta:
        'Não. O Regulamento da Previdência Social, art. 216, § 1º, manda calcular a contribuição sobre o 13º em separado, com aplicação própria da tabela progressiva. Somar as duas bases produziria um desconto maior que o devido — é um dos erros mais comuns do mercado.',
    },
    {
      pergunta: 'Horas extras e comissões entram no 13º?',
      resposta:
        'Entram, quando habituais. A Súmula 45 do TST firmou que a remuneração do serviço suplementar habitualmente prestado integra o cálculo da gratificação natalina. Informe a média no campo correspondente e ela passa a compor a base.',
    },
    {
      pergunta: 'Quanto é a 1ª parcela exatamente?',
      resposta:
        'A Lei nº 4.749/1965, art. 2º, fixa o adiantamento em metade do salário do mês anterior — e não em metade do 13º proporcional. Quando os avos são poucos, metade do salário pode superar o próprio 13º devido; nesse caso o cálculo limita o adiantamento ao valor devido, e a memória mostra o limite aplicado.',
    },
    {
      pergunta: 'O 13º pode ficar isento de Imposto de Renda?',
      resposta:
        'Pode. A redução do imposto do art. 3º-A da Lei nº 9.250/1995 alcança também o 13º salário, por força do seu § 3º. Como o 13º é tributado em separado, a redução é aplicada sobre ele isoladamente — e a memória de cálculo registra o valor da redução e a norma.',
    },
  ],

  relacionadas: ['ferias', 'salario-liquido', 'irrf'],
}
