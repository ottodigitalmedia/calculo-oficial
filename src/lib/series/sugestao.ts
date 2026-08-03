/**
 * Aplicação da sugestão de série ao formulário — `RF-012`.
 *
 * **Existe como módulo próprio por causa de `RNF-004`.** O lugar natural desta
 * função seria `formularioDe`, em `calculadoras/tipos.ts` — e ali estaria
 * errado: aquele módulo é importado pelo componente de CLIENTE, e importar o
 * cache de séries de dentro dele traria dezenas de quilobytes de histórico para
 * o pacote de toda rota de calculadora, para preencher um campo de uma.
 *
 * A página é componente de servidor e chama esta função depois de
 * `formularioDe`. O que atravessa a fronteira continua sendo um objeto pequeno
 * e serializável.
 */

import { sugestaoDe } from './index'
import type { SerieId } from './tipos'
import type { DefinicaoCalculadora, FormularioCalculadora } from '../calculadoras/tipos'

const IDS_CONHECIDOS: readonly SerieId[] = [
  'selic-ao-ano',
  'ipca-mensal',
  'igpm-mensal',
  'inpc-mensal',
  'poupanca-mensal',
  'tr-mensal',
]

/**
 * Devolve o formulário com a sugestão resolvida, ou **o mesmo formulário** se
 * não houver dado.
 *
 * Ausência de série nunca vira erro nem mensagem: `06-api-spec` §4.2 é
 * explícito de que, sem valor em cache, o campo simplesmente fica sem sugestão.
 */
export function aplicarSugestao(
  formulario: FormularioCalculadora,
  definicao: DefinicaoCalculadora,
): FormularioCalculadora {
  const pedido = definicao.sugestaoDeSerie
  if (!pedido) return formulario

  const serie = IDS_CONHECIDOS.find((id) => id === pedido.serie)
  if (!serie) return formulario

  const sugestao = sugestaoDe(pedido.campo, serie)
  return sugestao ? { ...formulario, sugestao } : formulario
}
