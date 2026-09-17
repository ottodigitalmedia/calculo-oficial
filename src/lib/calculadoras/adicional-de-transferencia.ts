/**
 * CALC-090 — Adicional de transferência.
 *
 * Conta curta, regra com duas armadilhas que a página declara: o percentual da
 * lei é piso ("nunca inferior a"), e o adicional só existe enquanto a
 * transferência durar — mudança definitiva não o gera.
 *
 * Motor em `engine/calculadoras/disponibilidade.ts`.
 */

import { calcularTransferencia } from '../engine/calculadoras/disponibilidade'
import { basisPoints, centavos } from '../engine/types'
import { formatarPercentual } from '../format/moeda'
import { DISPONIBILIDADE } from '../params/data/disponibilidade'
import { construirRegistro } from '../params/registry'
import { numero, type DefinicaoCalculadora, type FuncaoCalculo } from './tipos'

const registro = construirRegistro(DISPONIBILIDADE)

export const calcular: FuncaoCalculo = (valores, dataReferencia) => {
  const r = calcularTransferencia(
    {
      salario: centavos(numero(valores, 'salario')),
      percentualInformado: basisPoints(numero(valores, 'percentual')),
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
      principal: v.adicional,
      detalhamento: [
        { rotulo: 'Adicional de transferência', valor: v.adicional, sinal: 'credito' },
        { rotulo: 'Salário com o adicional', valor: v.salarioComAdicional, sinal: 'neutro' },
      ],
      destaques: [
        { rotulo: 'Percentual aplicado', valor: formatarPercentual(v.aliquota) },
        { rotulo: 'Mínimo legal', valor: formatarPercentual(v.minimoLegal) },
      ],
      notas: [
        'O adicional é devido enquanto durar a transferência. Quando ela acaba, ou se torna definitiva, o ' +
          'pagamento deixa de ser devido.',
        'As despesas da mudança correm por conta do empregador e são reembolso à parte, fora desta conta.',
      ],
    },
  }
}

export const ADICIONAL_DE_TRANSFERENCIA: DefinicaoCalculadora = {
  id: 'CALC-090',
  slug: 'adicional-de-transferencia',
  nome: 'Adicional de transferência',
  linhaDeContexto: 'O pagamento suplementar de quem é transferido para outra cidade por necessidade do serviço.',
  descricaoSeo:
    'Calcule o adicional de transferência da CLT sobre o salário da localidade de origem, pelo mínimo legal ou pelo percentual combinado.',

  campos: [
    {
      id: 'salario',
      rotulo: 'Salário na localidade de origem',
      tipo: 'monetario',
      obrigatorio: true,
      minimo: 1,
      maximo: 100_000_000,
      ajuda: 'O salário que você recebia antes da transferência.',
    },
    {
      id: 'percentual',
      rotulo: 'Percentual combinado (opcional)',
      tipo: 'percentual',
      padrao: 0,
      minimo: 0,
      maximo: 10_000,
      ajuda: 'Só se o contrato ou a convenção preveem mais que o mínimo legal. Deixe zero para usar o mínimo.',
    },
  ],

  parametrosRequeridos: ['transferencia-adicional-minimo'],

  rotuloResultado: 'Adicional de transferência estimado',

  calcular,

  faq: [
    {
      pergunta: 'Quando o adicional de transferência é devido?',
      resposta:
        'Quando o empregador, por necessidade de serviço, transfere o empregado para localidade diferente da prevista no contrato, com mudança de domicílio. O art. 469, § 3º, da CLT obriga a um pagamento suplementar enquanto durar essa situação — por isso a transferência provisória gera o adicional e a definitiva, não.',
    },
    {
      pergunta: 'Mudar de bairro ou de unidade na mesma cidade conta?',
      resposta:
        'Não. O caput do art. 469 não considera transferência a mudança que não acarreta necessariamente a mudança de domicílio do empregado. Sem mudança de domicílio, não há adicional.',
    },
    {
      pergunta: 'Quem tem cargo de confiança recebe o adicional?',
      resposta:
        'O § 1º do art. 469 permite transferir sem anuência quem exerce cargo de confiança e quem tem a transferência prevista no contrato, desde que haja real necessidade de serviço. O § 3º não exclui esses empregados do pagamento suplementar: o texto liga o adicional à transferência por necessidade de serviço e à sua duração. Como a aplicação a cada caso é tema de jurisprudência, confira a situação concreta antes de contar com o valor.',
    },
    {
      pergunta: 'Sobre qual salário o adicional é calculado?',
      resposta:
        'Sobre os salários que o empregado recebia na localidade de origem, como diz o texto do § 3º. O percentual da lei é o mínimo: contrato ou convenção coletiva podem prever um percentual maior, e a calculadora aceita esse valor.',
    },
    {
      pergunta: 'As despesas da mudança são pagas à parte?',
      resposta:
        'Sim. O art. 470 da CLT atribui ao empregador as despesas resultantes da transferência. Elas são reembolso, e não se confundem com o adicional, que é pagamento pelo período em que o empregado permanece transferido.',
    },
  ],

  relacionadas: ['salario-liquido', 'periculosidade', 'custo-do-funcionario'],
}
