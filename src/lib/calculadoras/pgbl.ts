/**
 * CALC-121 — PGBL: quanto economiza no imposto de renda.
 *
 * "Vale a pena fazer PGBL?" A pergunta de fim de ano, e a que mais se responde
 * errado com "você recupera 27,5% do que aplicar". Isso só vale para quem
 * declara pelo modelo completo, está na última faixa e contribui ao INSS — e,
 * desde 2026, para quem ganha acima de R$ 88,2 mil no ano, porque abaixo disso
 * a redução do art. 11-A já leva parte do imposto e o PGBL rende menos.
 *
 * A página roda a apuração anual duas vezes, sem e com a contribuição, cada uma
 * no melhor modelo, e mostra a diferença. Motor em
 * `engine/calculadoras/irpf-anual.ts`.
 */

import {
  calcularEconomiaPgbl,
  PARAMETROS_IRPF_ANUAL,
  PARAMETROS_REDUCAO_ANUAL,
} from '../engine/calculadoras/irpf-anual'
import { centavos } from '../engine/types'
import { formatarReal } from '../format/moeda'
import { IRPF_ANUAL } from '../params/data/irpf-anual'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(IRPF_ANUAL)

const NOME_DO_MODELO = { completo: 'completo', simplificado: 'simplificado' } as const

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularEconomiaPgbl(
    {
      rendimentosTributaveis: centavos(numero(valores, 'rendimentos')),
      inss: centavos(numero(valores, 'inss')),
      dependentes: numero(valores, 'dependentes'),
      instrucao: centavos(numero(valores, 'instrucao')),
      medicas: centavos(numero(valores, 'medicas')),
      pensao: centavos(numero(valores, 'pensao')),
      previdenciaPrivada: centavos(numero(valores, 'contribuicao')),
      contribuiParaRegime: texto(valores, 'regime') !== 'nao',
    },
    dataReferencia,
    registro,
  )
  if (!r.ok) return r
  const v = r.valores
  const simulouOLimite = numero(valores, 'contribuicao') === 0

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.economia,
      detalhamento: [
        { rotulo: 'Imposto anual sem o PGBL', valor: v.impostoSem, sinal: 'neutro' },
        { rotulo: 'Imposto anual com o PGBL', valor: v.impostoCom, sinal: 'neutro' },
        { rotulo: 'Economia', valor: v.economia, sinal: 'credito' },
      ],
      destaques: [
        {
          rotulo: simulouOLimite ? 'Contribuição simulada — o limite de 12%' : 'Contribuição informada',
          valor: formatarReal(v.contribuicao),
        },
        { rotulo: 'Parte dedutível', valor: formatarReal(v.dedutivel) },
        { rotulo: 'Limite de 12% dos rendimentos', valor: formatarReal(v.limite) },
        {
          rotulo: 'Modelo mais vantajoso',
          valor:
            v.modeloSem === v.modeloCom
              ? NOME_DO_MODELO[v.modeloCom]
              : `${NOME_DO_MODELO[v.modeloSem]} sem o PGBL; ${NOME_DO_MODELO[v.modeloCom]} com ele`,
        },
      ],
      notas: [
        'O PGBL só deduz no modelo completo. Se o simplificado continuar valendo mais mesmo com a contribuição, a economia é zero — é o caso de quem tem poucas deduções e contribui pouco.',
        'A partir do ano-calendário de 2026, a redução do art. 11-A zera o imposto de quem tem rendimentos tributáveis até R$ 60 mil, e o diminui até R$ 88,2 mil. Nessa faixa o PGBL economiza menos, ou nada.',
        'A dedução não é isenção: o imposto fica para o resgate ou para a renda, quando o valor acumulado é tributado inteiro — pela tabela progressiva ou pela regressiva, conforme a opção feita no plano.',
        'A dedução exige contribuição também ao INSS ou a regime próprio, salvo aposentados e pensionistas (Lei nº 9.532/1997, art. 11). VGBL não é dedutível.',
      ],
    },
  }
}

export const PGBL: DefinicaoCalculadora = {
  id: 'CALC-121',
  slug: 'pgbl-imposto-de-renda',
  nome: 'PGBL no Imposto de Renda',
  linhaDeContexto: 'Quanto a contribuição ao PGBL reduz o imposto da declaração — e quando não reduz nada.',
  descricaoSeo:
    'Calcule quanto o PGBL economiza no imposto de renda: o limite de 12% da renda, o modelo completo e a redução de 2026, com e sem a contribuição.',

  campos: [
    {
      id: 'rendimentos',
      rotulo: 'Rendimentos tributáveis no ano',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000_000,
      ajuda: 'Salários, pró-labore, aluguéis e aposentadoria. Sem o 13º e sem rendimentos de aplicações.',
    },
    {
      id: 'contribuicao',
      rotulo: 'Contribuição ao PGBL no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'Deixe em zero para simular o máximo dedutível: 12% dos rendimentos tributáveis.',
    },
    {
      id: 'regime',
      rotulo: 'Você contribui ao INSS ou a regime próprio, ou é aposentado?',
      tipo: 'selecao',
      padrao: 'sim',
      opcoes: [
        { valor: 'sim', rotulo: 'Sim' },
        { valor: 'nao', rotulo: 'Não' },
      ],
      ajuda: 'Sem isso, a contribuição ao PGBL não é dedutível.',
    },
    {
      id: 'inss',
      rotulo: 'Previdência oficial paga no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'INSS descontado em folha ou recolhido por carnê.',
    },
    { id: 'dependentes', rotulo: 'Dependentes', tipo: 'inteiro', padrao: 0, minimo: 0, maximo: 20 },
    {
      id: 'medicas',
      rotulo: 'Despesas médicas no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
    },
    {
      id: 'instrucao',
      rotulo: 'Despesas com instrução no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
      ajuda: 'O teto é por pessoa.',
    },
    {
      id: 'pensao',
      rotulo: 'Pensão alimentícia judicial no ano',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000_000,
    },
  ],

  parametrosRequeridos: [...PARAMETROS_IRPF_ANUAL],
  parametrosOpcionais: [...PARAMETROS_REDUCAO_ANUAL],

  rotuloResultado: 'Economia de imposto com o PGBL',

  calcular,

  faq: [
    {
      pergunta: 'Quanto posso deduzir de PGBL?',
      resposta:
        'Até 12% dos rendimentos tributáveis do ano, e só no modelo completo da declaração (Lei nº 9.532/1997, art. 11). Quem ganha R$ 100 mil tributáveis pode deduzir até R$ 12 mil; o que passar disso não reduz o imposto daquele ano.',
    },
    {
      pergunta: 'Todo mundo que faz PGBL paga menos imposto?',
      resposta:
        'Não. É preciso declarar pelo completo, e o completo com o PGBL precisa valer mais que o simplificado. Também é preciso contribuir ao INSS ou a regime próprio, salvo aposentados e pensionistas. E, desde 2026, quem tem rendimentos tributáveis até R$ 60 mil já tem o imposto anual zerado pela redução do art. 11-A — para essa pessoa, o PGBL não economiza nada.',
    },
    {
      pergunta: 'A economia é sempre 27,5% da contribuição?',
      resposta:
        'Só no melhor caso: modelo completo, a base de cálculo na faixa de 27,5% com e sem a dedução, e renda acima de R$ 88,2 mil, onde não há redução. Com renda menor, a alíquota que a dedução "tira" é menor, e na faixa da redução de 2026 parte do imposto já é abatida. A calculadora apura a declaração com e sem o PGBL e mostra a diferença real.',
    },
    {
      pergunta: 'O PGBL isenta o imposto?',
      resposta:
        'Não, ele o adia. O valor deduzido hoje é tributado no resgate ou na renda — e sobre o total acumulado, não só sobre o rendimento —, pela tabela progressiva ou pela regressiva, conforme a opção feita no plano. A vantagem está no adiamento e, na tabela regressiva, na alíquota menor para prazos longos.',
    },
    {
      pergunta: 'E o VGBL?',
      resposta:
        'O VGBL não é dedutível na declaração. Em compensação, no resgate o imposto incide só sobre o rendimento. Costuma servir a quem declara pelo simplificado ou já usou todo o limite de 12% do PGBL.',
    },
  ],

  relacionadas: ['simplificado-ou-completo', 'restituicao-irpf', 'resgate-de-previdencia-privada', 'irrf'],
}
