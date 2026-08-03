/**
 * CALC-041 — Rendimento da poupança.
 *
 * `03-functional-spec` não cobre esta calculadora; os textos foram escritos
 * junto com ela, seguindo os padrões de §1.
 *
 * **Ela não reimplementa a regra de remuneração da poupança, e isso é decisão.**
 * A fórmula que combina Selic e TR está em lei, e transcrevê-la aqui criaria uma
 * constante legal fora de `lib/params/` — o que `CLAUDE.md` regra 1 proíbe. O
 * caminho tomado é outro e é mais forte: o Banco Central **publica a taxa já
 * apurada**, mês a mês, na série 195, e é ela que a calculadora usa, com a data
 * do dado na tela.
 *
 * A consequência honesta disso está no texto: o que a conta projeta é o
 * rendimento **se a taxa se repetir**, e a taxa muda quando a Selic muda.
 *
 * Nenhum motor novo: é `calcularJurosCompostos` com a taxa vinda da série.
 */

import { calcularJurosCompostos } from '../engine/calculadoras/juros-compostos'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual } from '../format/moeda'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularJurosCompostos(
    {
      valorInicial: centavos(numero(valores, 'valorInicial')),
      aporteMensal: centavos(numero(valores, 'aporteMensal')),
      taxa: basisPoints(numero(valores, 'taxaMensal')),
      taxaAoAno: false,
      meses: numero(valores, 'meses'),
    },
    dataReferencia,
  )
  if (!r.ok) return r

  const v = r.valores

  return {
    ok: true,
    traco: r.traco,
    valores: {
      principal: v.montante,
      detalhamento: [
        { rotulo: 'Total depositado', valor: v.totalInvestido, sinal: 'neutro' },
        { rotulo: 'Rendimento no período', valor: v.totalJuros, sinal: 'credito' },
        { rotulo: 'Saldo ao fim', valor: v.montante, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Taxa mensal aplicada', valor: formatarPercentual(v.taxaMensalBp) },
        { rotulo: 'Prazo', valor: `${numero(valores, 'meses')} meses` },
      ],
      tabela: {
        titulo: 'Evolução ano a ano',
        colunas: ['Depositado', 'Rendimento', 'Saldo'],
        linhas: v.evolucao.map((l) => ({
          rotulo: `Ano ${l.ano}`,
          valores: [l.investido, l.juros, l.saldo],
        })),
      },
      notas: [
        'A taxa que abre no campo é a ÚLTIMA publicada pelo Banco Central, com a data ao lado. ' +
          'Ela não é fixa: a remuneração da poupança muda quando a taxa básica de juros muda, e ' +
          'o resultado supõe que a taxa atual se repita por todo o prazo.',
        'A poupança rende em aniversário mensal. O depósito só rende se completar o mês — sacar ' +
          'antes do aniversário faz perder o rendimento do período inteiro, e não uma parte ' +
          'proporcional. Esta conta considera meses completos.',
        'Esta calculadora aplica a taxa publicada e não apura imposto. Para comparar com uma ' +
          'aplicação de renda fixa tributada, a calculadora de IR sobre renda fixa mostra ' +
          'quanto o imposto tira do rendimento conforme o prazo.',
        'O aporte de cada mês entra depois da capitalização do saldo, que é a hipótese mais ' +
          'conservadora. A memória de cálculo mostra a ordem das operações.',
      ],
    },
  }
}

export const POUPANCA: DefinicaoCalculadora = {
  id: 'CALC-041',
  slug: 'rendimento-da-poupanca',
  nome: 'Rendimento da poupança',
  linhaDeContexto: 'Quanto a poupança rende no prazo — pela taxa que o Banco Central publicou.',
  descricaoSeo:
    'Calcule quanto seu dinheiro rende na poupança com a taxa mensal publicada pelo Banco Central, com ou sem depósitos mensais, e veja a evolução ano a ano.',

  campos: [
    {
      id: 'valorInicial',
      rotulo: 'Valor inicial',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 1_000_000_000,
    },
    {
      id: 'aporteMensal',
      rotulo: 'Depósito mensal',
      tipo: 'monetario',
      padrao: 0,
      minimo: 0,
      maximo: 100_000_000,
    },
    {
      id: 'taxaMensal',
      rotulo: 'Rendimento ao mês',
      tipo: 'percentual',
      obrigatorio: true,
      minimo: 1,
      maximo: 10_000,
      ajuda: 'Abre com a última taxa publicada pelo Banco Central. Ela muda quando a taxa básica de juros muda.',
    },
    {
      id: 'meses',
      rotulo: 'Prazo em meses',
      tipo: 'inteiro',
      obrigatorio: true,
      padrao: 12,
      minimo: 1,
      maximo: 600,
    },
  ],

  // Série econômica NÃO é parâmetro legal — `ADR-006`.
  parametrosRequeridos: [],

  /** `RF-012` — a taxa vem da série 195, já apurada e publicada pelo BCB. */
  sugestaoDeSerie: { campo: 'taxaMensal', serie: 'poupanca-mensal' },

  rotuloResultado: 'Saldo ao fim do prazo',

  calcular,

  faq: [
    {
      pergunta: 'De onde vem a taxa que aparece preenchida?',
      resposta:
        'Da série que o Banco Central publica com a remuneração da poupança já apurada, e a data do dado aparece ao lado do campo. A calculadora não recalcula a regra de remuneração: ela usa o número oficial. Se a taxa mudou depois da última coleta, o campo é editável.',
    },
    {
      pergunta: 'A poupança sempre rende isso?',
      resposta:
        'Não. A remuneração acompanha a taxa básica de juros, então ela muda ao longo do tempo — e o resultado desta conta supõe que a taxa atual se repita por todo o prazo, o que é uma simplificação. Em prazos longos, a diferença entre essa hipótese e o que de fato acontecer pode ser grande, para mais ou para menos.',
    },
    {
      pergunta: 'Por que perco o rendimento se sacar antes do aniversário?',
      resposta:
        'Porque a poupança credita rendimento em aniversário mensal: cada depósito rende quando completa um mês. Sacar no dia 25 um dinheiro depositado no dia 10 significa que aqueles quinze dias não rendem nada — não há proporcional. É a diferença mais prática entre ela e aplicações de liquidez diária, e a razão de o dia do depósito importar.',
    },
    {
      pergunta: 'A poupança rende mais que outras aplicações?',
      resposta:
        'Depende da taxa básica de juros e do produto comparado, e a resposta muda com o tempo. A comparação honesta usa o rendimento LÍQUIDO dos dois lados: aplicações de renda fixa tributadas rendem mais em bruto e menos depois do imposto, e a calculadora de IR sobre renda fixa mostra o tamanho dessa mordida conforme o prazo.',
    },
  ],

  relacionadas: ['juros-compostos', 'quanto-rende-por-mes', 'reserva-de-emergencia'],
}
