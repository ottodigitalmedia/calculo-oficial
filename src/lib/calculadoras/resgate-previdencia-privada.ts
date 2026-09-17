/**
 * CALC-094 — Imposto no resgate da previdência privada.
 *
 * Duas escolhas antigas decidem o imposto de hoje: o regime de tributação e o
 * tipo de plano. A página põe as duas em campos, e a memória mostra qual delas
 * pesou mais.
 *
 * Motor em `engine/calculadoras/previdencia-privada.ts`.
 */

import {
  calcularResgatePrevidencia,
  type RegimeDeTributacao,
  type TipoDePlano,
} from '../engine/calculadoras/previdencia-privada'
import { centavos } from '../engine/types'
import { formatarPercentual, formatarReal } from '../format/moeda'
import { PREVIDENCIA_PRIVADA } from '../params/data/previdencia-privada'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(PREVIDENCIA_PRIVADA)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularResgatePrevidencia(
    {
      tipoDePlano: texto(valores, 'tipoDePlano') === 'vgbl' ? 'vgbl' : ('pgbl' as TipoDePlano),
      regime: texto(valores, 'regime') === 'progressivo' ? 'progressivo' : ('regressivo' as RegimeDeTributacao),
      valorResgate: centavos(numero(valores, 'valorResgate')),
      totalAportado: centavos(numero(valores, 'totalAportado')),
      anosDeAcumulacao: numero(valores, 'anos'),
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
      principal: v.liquido,
      detalhamento: [
        { rotulo: 'Base de cálculo do imposto', valor: v.base, sinal: 'neutro' },
        { rotulo: 'Imposto retido na fonte', valor: v.imposto, sinal: 'debito' },
        { rotulo: 'Líquido a receber', valor: v.liquido, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Alíquota aplicada', valor: formatarPercentual(v.aliquota) },
        {
          rotulo: 'Natureza do imposto',
          valor: v.impostoDefinitivo ? 'Definitivo' : 'Antecipação — ajusta na declaração',
        },
        ...(v.rendimento > 0 ? [{ rotulo: 'Rendimento do plano', valor: formatarReal(v.rendimento) }] : []),
      ],
      notas: [
        'O prazo de acumulação é contado de cada aporte até o pagamento, e não da abertura do plano. Quem ' +
          'aportou ao longo de vários anos tem prazos diferentes convivendo no mesmo saldo — esta estimativa ' +
          'trata um prazo por vez.',
        ...(v.impostoDefinitivo
          ? [
              'No regime regressivo o imposto é definitivo: o valor retido não volta a ser ajustado na ' +
                'declaração anual.',
            ]
          : [
              'No regime progressivo a retenção é antecipação. Na declaração anual, o resgate entra com os ' +
                'demais rendimentos e a tabela progressiva decide o imposto real — que pode ser maior ou menor.',
            ]),
      ],
    },
  }
}

export const RESGATE_PREVIDENCIA_PRIVADA: DefinicaoCalculadora = {
  id: 'CALC-094',
  slug: 'resgate-de-previdencia-privada',
  nome: 'Imposto no resgate da previdência privada',
  linhaDeContexto: 'Quanto o imposto leva do resgate, conforme o regime escolhido e o tipo de plano.',
  descricaoSeo:
    'Calcule o imposto no resgate de PGBL e VGBL nos regimes regressivo e progressivo, com a alíquota do prazo de acumulação e o valor líquido.',

  campos: [
    {
      id: 'tipoDePlano',
      rotulo: 'Tipo de plano',
      tipo: 'selecao',
      padrao: 'pgbl',
      opcoes: [
        { valor: 'pgbl', rotulo: 'PGBL (ou FAPI)' },
        { valor: 'vgbl', rotulo: 'VGBL' },
      ],
      ajuda: 'No PGBL o imposto incide sobre o resgate inteiro; no VGBL, só sobre o rendimento.',
    },
    {
      id: 'regime',
      rotulo: 'Regime de tributação escolhido',
      tipo: 'selecao',
      padrao: 'regressivo',
      opcoes: [
        { valor: 'regressivo', rotulo: 'Regressivo (por prazo)' },
        { valor: 'progressivo', rotulo: 'Progressivo (tabela anual)' },
      ],
      ajuda: 'A escolha é feita na contratação e consta da proposta do plano.',
    },
    {
      id: 'valorResgate',
      rotulo: 'Valor do resgate',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 1_000_000_000,
    },
    {
      id: 'totalAportado',
      rotulo: 'Total aportado no plano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
      ajuda: 'Soma das contribuições. Necessário no VGBL, para separar o rendimento.',
    },
    {
      id: 'anos',
      rotulo: 'Prazo de acumulação, em anos',
      tipo: 'inteiro',
      padrao: 10,
      minimo: 0,
      maximo: 60,
      ajuda: 'Tempo entre o aporte e o resgate. Só o regime regressivo usa este campo.',
      visivelSe: { campo: 'regime', em: ['regressivo'] },
    },
  ],

  parametrosRequeridos: [
    'previdencia-regressiva-ate-2-anos',
    'previdencia-regressiva-2-a-4-anos',
    'previdencia-regressiva-4-a-6-anos',
    'previdencia-regressiva-6-a-8-anos',
    'previdencia-regressiva-8-a-10-anos',
    'previdencia-regressiva-acima-de-10-anos',
    'previdencia-regressiva-degrau-anos',
    'previdencia-regressiva-ultimo-degrau-anos',
    'previdencia-progressiva-antecipacao',
  ],

  rotuloResultado: 'Líquido estimado do resgate',

  calcular,

  faq: [
    {
      pergunta: 'Qual a diferença entre PGBL e VGBL no resgate?',
      resposta:
        'A base do imposto. No PGBL o imposto incide sobre o valor resgatado inteiro, porque as contribuições foram deduzidas da base do imposto de renda na declaração. No VGBL incide apenas sobre o rendimento, como diz o art. 3º, II, da Lei nº 11.053/2004 — as contribuições não foram deduzidas.',
    },
    {
      pergunta: 'Como funciona a tabela regressiva?',
      resposta:
        'A alíquota cai conforme o prazo de acumulação: começa na faixa mais alta para recursos com até dois anos e chega à menor acima de dez anos, conforme os incisos I a VI do art. 1º da Lei nº 11.053/2004. O imposto retido é definitivo — não volta a ser ajustado na declaração anual.',
    },
    {
      pergunta: 'O prazo conta desde quando abri o plano?',
      resposta:
        'Não. O § 3º do art. 1º define prazo de acumulação como o tempo entre o APORTE e o pagamento. Cada contribuição tem o seu prazo, e um saldo formado ao longo de anos resgata com alíquotas diferentes para cada parcela. A calculadora trata um prazo por vez.',
    },
    {
      pergunta: 'No regime progressivo, os 15% retidos são o imposto final?',
      resposta:
        'Não. O art. 3º diz que a retenção é antecipação do devido na declaração de ajuste. O valor resgatado soma-se aos demais rendimentos do ano e a tabela progressiva decide o imposto real: quem tem renda baixa pode receber parte de volta na restituição, e quem tem renda alta pode ter imposto a pagar.',
    },
    {
      pergunta: 'Posso trocar de regime depois?',
      resposta:
        'A opção pelo regime regressivo é feita na contratação ou no prazo que a lei fixou para os planos antigos, e é irretratável. A migração possível é a do progressivo para o regressivo, nas condições da norma — mas ela não devolve o tempo já corrido do jeito que muita gente espera. Confirme com a entidade antes de contar com uma alíquota menor.',
    },
    {
      pergunta: 'Quanto posso deduzir das contribuições do PGBL?',
      resposta:
        'A dedução do PGBL na declaração completa é limitada a uma fração da renda bruta tributável anual, e exige contribuição ao INSS ou a regime próprio. É o outro lado da conta: o que se deduziu na entrada é o que será tributado na saída. Esta calculadora trata apenas do resgate.',
    },
  ],

  relacionadas: ['ir-renda-fixa', 'simplificado-ou-completo', 'restituicao-irpf', 'independencia-financeira'],
}
