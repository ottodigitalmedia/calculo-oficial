/**
 * A última linha entre uma exceção do motor e a tela.
 *
 * **Nasceu da auditoria de 24/09/2026 (§7.99).** `Calculadora.tsx` chamava o
 * cálculo dentro de um `useMemo`, sem proteção: uma exceção ali derrubava a
 * página inteira. O motor só lança em dois casos, e os dois chegavam à tela da
 * mesma forma — o que não podia ser:
 *
 * - **Estouro do inteiro seguro.** Não é defeito: é a guarda de `A-3` recusando
 *   uma conta que não sairia exata, porque o resultado passa de R$ 90 trilhões.
 *   A tela tem de dizer isso, e dizer o que fazer.
 * - **Qualquer outra exceção.** É defeito (`C-M3` de `ADR-003`: *"exceção
 *   significa defeito"*). A página não pode cair por ele, mas também não pode
 *   escondê-lo — `tests/unit/robustez.test.ts` reprova toda calculadora cujo
 *   formulário válido chegue aqui.
 *
 * Nenhum valor digitado sai desta função, nem em log (regra 6).
 */

import type { Resultado } from '../engine/traco'
import type { DataISO } from '../params/tipos'
import type { FuncaoCalculo, SaidaCalculadora, ValoresFormulario } from './tipos'

export const MENSAGEM_DE_ESTOURO =
  'Os valores informados levam a um resultado grande demais para ser calculado com exatidão ao centavo. Confira se algum deles não foi digitado com zeros a mais.'

export const MENSAGEM_DE_FALHA =
  'Esta combinação de valores não pôde ser calculada. Revise os campos; se os valores estiverem certos, conte para nós pela página de contato.'

/**
 * Pelo nome, e não por `instanceof`: o motor chega em pedaços carregados sob
 * demanda, e a identidade da classe entre pedaços é detalhe de empacotador em
 * que a correção não deve se apoiar.
 */
function ehEstouro(erro: unknown): boolean {
  return erro instanceof RangeError && erro.name === 'EstouroDoInteiroSeguro'
}

export function calcularComGuarda(
  calcular: FuncaoCalculo,
  valores: ValoresFormulario,
  dataReferencia: DataISO,
): Resultado<SaidaCalculadora> {
  try {
    return calcular(valores, dataReferencia)
  } catch (erro) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: ehEstouro(erro) ? MENSAGEM_DE_ESTOURO : MENSAGEM_DE_FALHA,
    }
  }
}
