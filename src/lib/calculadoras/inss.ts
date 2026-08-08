/**
 * CALC-016 — INSS mensal.
 *
 * Reaproveita o motor de T-102 sem duplicar uma linha de cálculo. A diferença
 * para CALC-001 é só a declaração: quais campos pedir e o que destacar.
 */

import { calcularInss } from '../engine/inss'
import { centavos } from '../engine/types'
import { formatarPercentual } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

import { INSS } from '../params/data/inss'
import { construirRegistro } from '../params/registry'

/**
 * Registro montado aqui, e não recebido de fora.
 *
 * Vive no módulo ADIADO: as tabelas legais só entram no navegador junto com o
 * cálculo que as usa, e não no pacote estático de toda rota. Ver
 * `tipos.ts`, `FuncaoCalculo`.
 */
const registro = construirRegistro(INSS)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const salario = centavos(numero(valores, 'salarioContribuicao'))
  const r = calcularInss({ salarioContribuicao: salario }, dataReferencia, registro)
  if (!r.ok) return r

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: r.valores.contribuicao,
      detalhamento: [
        { rotulo: 'Salário de contribuição', valor: salario, sinal: 'credito' },
        ...(r.valores.limitadaPeloTeto
          ? ([
              {
                rotulo: 'Base limitada ao teto previdenciário',
                valor: r.valores.baseAplicada,
                sinal: 'neutro',
              },
            ] as const)
          : []),
        { rotulo: 'Contribuição', valor: r.valores.contribuicao, sinal: 'debito' },
      ],
      destaques: [
        {
          rotulo: 'Alíquota efetiva',
          valor: formatarPercentual(r.valores.aliquotaEfetiva),
        },
      ],
      notas: r.valores.limitadaPeloTeto
        ? ['A contribuição não incide sobre a parcela do salário que excede o teto.']
        : [],
    },
  }
}

export const INSS_MENSAL: DefinicaoCalculadora = {
  id: 'CALC-016',
  slug: 'inss',
  nome: 'INSS mensal',
  linhaDeContexto:
    'Quanto é descontado de contribuição previdenciária — faixa a faixa, com a alíquota efetiva.',
  descricaoSeo:
    'Calcule o desconto de INSS do empregado com a tabela progressiva vigente. Veja faixa a faixa, a alíquota efetiva, a vigência e o link para a portaria.',

  campos: [
    {
      id: 'salarioContribuicao',
      rotulo: 'Salário de contribuição',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'A remuneração do mês sobre a qual incide a contribuição.',
    },
    {
      id: 'tipoSegurado',
      rotulo: 'Tipo de segurado',
      tipo: 'selecao',
      padrao: 'empregado',
      opcoes: [
        { valor: 'empregado', rotulo: 'Empregado, doméstico ou avulso' },
        /**
         * Declarados como indisponíveis em vez de omitidos: não sugerir que a
         * calculadora cobre casos que ela não cobre (`03-functional-spec` §3.9).
         *
         * **Mas a nota deixou de ser "Em breve".** Os dois casos estão cobertos
         * por CALC-050 desde que ela foi publicada, e a etiqueta continuava
         * anunciando como futuro o que já estava no ar — mandando embora
         * justamente o autônomo, que é quem mais precisa da conta. A calculadora
         * aparece agora também no fim da página, em `relacionadas`.
         */
        {
          valor: 'individual',
          rotulo: 'Contribuinte individual',
          indisponivel: true,
          nota: 'use a calculadora do autônomo',
        },
        {
          valor: 'facultativo',
          rotulo: 'Facultativo',
          indisponivel: true,
          nota: 'use a calculadora do autônomo',
        },
      ],
      ajuda: 'Esta calculadora cobre o desconto na folha, pela tabela progressiva. Autônomo, MEI e facultativo recolhem por conta própria, com regra diferente — a conta está em "INSS do autônomo e do facultativo", no fim desta página.',
    },
  ],

  parametrosRequeridos: ['inss-tabela-progressiva'],

  rotuloResultado: 'Contribuição previdenciária',

  calcular,

  faq: [
    {
      pergunta: 'Por que a alíquota efetiva é menor que a da minha faixa?',
      resposta:
        'Porque a tabela é progressiva: cada faixa incide apenas sobre a parcela do salário contida nela. Quem ganha R$ 5.000 não paga 14% sobre tudo — paga 7,5% sobre a primeira faixa, 9% sobre a segunda, e assim por diante. A alíquota efetiva é o resultado dessa soma dividido pelo salário, e é sempre menor que a alíquota da última faixa alcançada.',
    },
    {
      pergunta: 'O que é o teto do salário de contribuição?',
      resposta:
        'É o valor máximo sobre o qual a contribuição incide. Acima dele, o desconto para de crescer: quem ganha R$ 20.000 contribui o mesmo que quem ganha exatamente o teto. O teto é reajustado por portaria a cada exercício, e a memória de cálculo mostra qual foi aplicado.',
    },
    {
      pergunta: 'Este cálculo serve para autônomo ou MEI?',
      resposta:
        'Não, e a conta deles é outra: quem recolhe por conta própria usa alíquota única sobre a base do plano escolhido, e não a tabela progressiva da folha. A calculadora certa é "INSS do autônomo e do facultativo", que cobre o plano completo, o simplificado e o do facultativo de baixa renda — ela está listada no fim desta página.',
    },
    {
      pergunta: 'Posso calcular o desconto de um ano anterior?',
      resposta:
        'Pode. Escolha o período de referência e o cálculo passa a usar a tabela que valia na época. A memória mostra a vigência aplicada e o link para a portaria correspondente.',
    },
  ],

  // CALC-050 vem PRIMEIRO: é o destino de quem chegou aqui e descobriu que a
  // tabela progressiva não é a dele. Antes, a página não oferecia saída nenhuma.
  relacionadas: ['inss-autonomo-e-facultativo', 'salario-liquido', 'irrf'],
}
