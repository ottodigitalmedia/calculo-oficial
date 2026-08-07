/**
 * Vale-transporte — `RN-027`, em CALC-001.
 *
 * **Um parâmetro só, e ele não muda com o ano.** O percentual é o mesmo desde a
 * lei original de 1985, o que faz deste conjunto o oposto do de INSS ou IRRF:
 * não há tabela anual a acompanhar, não há portaria de janeiro, não há auditoria
 * de virada de exercício. Uma vigência aberta cobre todos os exercícios.
 *
 * POR QUE ELE FICOU CINCO DIAS NA LISTA DE "PRECISA DE PESQUISA"
 *
 * `ESTADO-DO-PROJETO` §5.1 registrava *"o percentual legal não foi localizado em
 * fonte oficial"* desde 31/07/2026. A norma está no Planalto, aberta, sem
 * autenticação, e o texto compilado traz o dispositivo inteiro. O que faltou foi
 * abrir a lei — é a mesma lição de §7.65, a porta da frente da fonte oficial
 * antes da máquina, e aqui nem máquina havia: havia uma linha numa tabela.
 *
 * **A ausência foi tratada certo enquanto durou**, e isso é o que importa: o
 * campo não existiu na calculadora, e nada foi estimado. O custo do erro foi
 * uma funcionalidade ausente, não um número errado — que é exatamente a troca
 * que `CLAUDE.md` manda fazer.
 *
 * A BASE É O QUE QUASE TODO MUNDO ERRA, E ELA NÃO ESTÁ NA LEI
 *
 * A lei fixa o número; o **regulamento** diz sobre o quê. O art. 114, I do
 * Decreto nº 10.854/2021 manda calcular sobre *"o salário básico ou vencimento,
 * excluídos quaisquer adicionais ou vantagens"*. Sem esse inciso, a base
 * plausível seria o salário bruto, e sobre quem recebe adicional noturno,
 * periculosidade ou horas extras isso **superestima** a cota do trabalhador.
 *
 * É a mesma classe de erro que `consignado.ts` documenta para a margem
 * consignável: o percentual é fácil de achar, a base é onde mora o defeito.
 *
 * A calculadora declara isso na tela, porque o campo que ela tem é "salário
 * bruto" — ver a nota em `calculadoras/salario-liquido.ts`.
 */

import type { ConjuntoDeParametros } from '../tipos'
import { DEC_10854_ART_114, LEI_7418_ART_4 } from './fontes'

export const VALE_TRANSPORTE: ConjuntoDeParametros = {
  fontes: [LEI_7418_ART_4, DEC_10854_ART_114],

  parametros: [
    {
      id: 'vale-transporte-cota-do-empregado',
      nome: 'Cota do empregado no vale-transporte',
      descricao:
        'Percentual do salário básico que o empregado custeia. O empregador arca com o que exceder essa parcela.',
      tipo: 'percentual',
    },
  ],

  vigencias: [
    {
      id: 'vale-transporte-cota-do-empregado-1985',
      parametroId: 'vale-transporte-cota-do-empregado',
      fonteId: 'lei-7418-1985-art-4',
      inicio: '1985-12-16',
      fim: null,
      valor: { tipo: 'percentual', aliquotaBp: 600 },
      observacao:
        'Percentual inalterado desde a lei original. O art. 114, I do Decreto nº 10.854/2021 o repete e define a base: salário básico ou vencimento, excluídos quaisquer adicionais ou vantagens. Não há reajuste anual — este parâmetro não entra na auditoria de virada de exercício.',
    },
  ],
}
