/**
 * CALC-004 — Férias.
 *
 * Campos e microcopy de `03-functional-spec` §3.4, usados literalmente.
 *
 * **Primeiro uso real de `visivelSe`.** O campo de meses do período aquisitivo
 * só aparece com "Proporcionais", conforme a habilitação declarada na spec. O
 * contrato tinha o campo desde o T-103 e nenhuma calculadora o usava.
 */

import { calcularFerias } from '../engine/calculadoras/ferias-e-decimo-terceiro'
import { centavos } from '../engine/types'
import { INSS } from '../params/data/inss'
import { IRRF } from '../params/data/irrf'
import { construirRegistro } from '../params/registry'
import { numero, texto, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

/** Registro montado no módulo adiado — ver a nota em `salario-liquido.ts`. */
const registro = construirRegistro(INSS, IRRF)

/** Exportação de topo — ver a nota em `salario-liquido.ts`. */
export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const tipo = texto(valores, 'tipo') === 'proporcionais' ? 'proporcionais' : 'integrais'
  const r = calcularFerias(
    {
      salario: centavos(numero(valores, 'salario')),
      tipo,
      mesesTrabalhados: tipo === 'integrais' ? 12 : numero(valores, 'mesesTrabalhados'),
      diasGozados: numero(valores, 'diasGozados'),
      abonoPecuniario: texto(valores, 'abonoPecuniario') === 'sim',
      adiantar13: texto(valores, 'adiantar13') === 'sim',
      dependentes: numero(valores, 'dependentes'),
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
        { rotulo: 'Remuneração das férias', valor: v.remuneracaoFerias, sinal: 'credito' },
        { rotulo: 'Terço constitucional', valor: v.terco, sinal: 'credito' },
        ...(v.abono > 0
          ? ([
              { rotulo: 'Abono pecuniário', valor: v.abono, sinal: 'credito' },
              { rotulo: 'Terço sobre o abono', valor: v.tercoDoAbono, sinal: 'credito' },
            ] as const)
          : []),
        ...(v.adiantamento13 > 0
          ? ([
              {
                rotulo: 'Adiantamento da 1ª parcela do 13º',
                valor: v.adiantamento13,
                sinal: 'credito',
              },
            ] as const)
          : []),
        { rotulo: 'Contribuição previdenciária (INSS)', valor: v.inss, sinal: 'debito' },
        { rotulo: 'Imposto de Renda retido na fonte', valor: v.irrf, sinal: 'debito' },
        { rotulo: 'Valor líquido estimado', valor: v.liquido, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Dias de direito', valor: `${v.diasDeDireito} dias` },
        { rotulo: 'Dias em descanso', valor: `${v.diasGozados} dias` },
        ...(v.diasDeAbono > 0
          ? [{ rotulo: 'Dias vendidos', valor: `${v.diasDeAbono} dias` }]
          : []),
      ],
      notas: [
        'O abono pecuniário e o adiantamento do 13º não sofrem desconto de INSS nem de ' +
          'Imposto de Renda. Já as férias gozadas e o terço sofrem — a memória mostra a norma ' +
          'de cada uma.',
      ],
    },
  }
}

export const FERIAS: DefinicaoCalculadora = {
  id: 'CALC-004',
  slug: 'ferias',
  nome: 'Férias',
  linhaDeContexto:
    'Quanto você recebe nas férias — com o terço, o abono e os descontos separados.',
  descricaoSeo:
    'Calcule as férias com o terço constitucional, a venda de 1/3 (abono) e o adiantamento do 13º. Veja o passo a passo, a norma de cada incidência e a vigência aplicada.',

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
      id: 'tipo',
      rotulo: 'Tipo de férias',
      tipo: 'selecao',
      padrao: 'integrais',
      opcoes: [
        { valor: 'integrais', rotulo: 'Integrais (30 dias)' },
        { valor: 'proporcionais', rotulo: 'Proporcionais' },
      ],
    },
    {
      id: 'mesesTrabalhados',
      rotulo: 'Meses trabalhados no período aquisitivo',
      tipo: 'inteiro',
      padrao: 12,
      minimo: 1,
      maximo: 12,
      // Habilitação de §3.4: só aparece com "Proporcionais".
      visivelSe: { campo: 'tipo', em: ['proporcionais'] },
    },
    {
      id: 'diasGozados',
      rotulo: 'Dias de férias que vai tirar',
      tipo: 'inteiro',
      padrao: 30,
      minimo: 5,
      maximo: 30,
    },
    {
      id: 'abonoPecuniario',
      rotulo: 'Vender 1/3 das férias (abono)?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não' },
        { valor: 'sim', rotulo: 'Sim' },
      ],
      ajuda: 'A CLT permite converter até 1/3 do período em dinheiro.',
    },
    {
      id: 'adiantar13',
      rotulo: 'Adiantar a 1ª parcela do 13º?',
      tipo: 'selecao',
      padrao: 'nao',
      opcoes: [
        { valor: 'nao', rotulo: 'Não' },
        { valor: 'sim', rotulo: 'Sim' },
      ],
      ajuda: 'Possível quando requerido em janeiro do mesmo ano.',
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

  rotuloResultado: 'Valor líquido estimado a receber',

  calcular,

  faq: [
    {
      pergunta: 'Por que as férias têm desconto de INSS se as da rescisão não têm?',
      resposta:
        'Porque são coisas diferentes para a lei. O Regulamento da Previdência Social, art. 214, § 4º, diz que a remuneração adicional de férias integra o salário-de-contribuição — férias gozadas têm natureza salarial. Já as férias indenizadas na rescisão são excluídas expressamente pela Lei nº 8.212/1991. A memória de cálculo mostra a norma nos dois casos.',
    },
    {
      pergunta: 'O que é vender 1/3 das férias?',
      resposta:
        'É o abono pecuniário do art. 143 da CLT: o empregado pode converter até um terço do período a que tem direito em dinheiro, recebendo o valor dos dias correspondentes em vez de descansá-los. O pedido é feito até 15 dias antes do fim do período aquisitivo.',
    },
    {
      pergunta: 'O abono paga imposto?',
      resposta:
        'Não. O art. 144 da CLT diz que o abono não integra a remuneração para efeito da legislação do trabalho e da previdência social, e a jurisprudência consolidada afasta também o imposto de renda. Por isso ele aparece no resultado sem desconto, e a memória registra isso.',
    },
    {
      pergunta: 'Posso receber o 13º junto com as férias?',
      resposta:
        'Pode, se requerer no mês de janeiro do ano correspondente. É o que prevê o art. 2º, § 2º, da Lei nº 4.749/1965: o adiantamento da gratificação é pago ao ensejo das férias. Como é adiantamento, não sofre desconto agora — os descontos incidem no pagamento da última parcela.',
    },
    {
      pergunta: 'Por que o terço aumenta o desconto de INSS?',
      resposta:
        'Porque ele entra na base. Como o terço integra o salário-de-contribuição, a base do INSS das férias é a remuneração do período mais o terço — o que pode empurrar o cálculo para uma faixa superior da tabela progressiva. A memória mostra faixa a faixa.',
    },
  ],

  relacionadas: ['decimo-terceiro', 'salario-liquido', 'rescisao-sem-justa-causa'],
}
