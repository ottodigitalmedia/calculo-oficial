/**
 * Rotas indexáveis e endereços absolutos — insumo do sitemap (EP-013), do
 * `robots.txt` (EP-014) e dos dados estruturados.
 *
 * **Derivado, nunca escrito à mão.** As rotas de calculadora e de guia saem
 * dos respectivos registros. Uma lista paralela seria uma lista que envelhece:
 * publicaríamos uma calculadora e ela ficaria fora do sitemap, invisível para
 * o buscador, sem nada falhar.
 *
 * Busca orgânica é o único canal de aquisição do produto (`01-prd` §5), então
 * esse tipo de defeito silencioso é dos mais caros que existem aqui.
 */

import { CALCULADORAS } from './calculadoras'
import { GUIAS } from './guias'

/**
 * Origem pública do site.
 *
 * O padrão existe para o build local e para o teste não dependerem de
 * ambiente. Em produção a variável é definida (`13-deployment` §5).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://calculoficial.com.br'
).replace(/\/$/, '')

export const NOME_DO_SITE = 'Cálculo Oficial'

/** Rota relativa para URL absoluta. `/` vira a origem, sem barra final. */
export function absoluto(rota: string): string {
  const caminho = rota.startsWith('/') ? rota : `/${rota}`
  return caminho === '/' ? SITE_URL : `${SITE_URL}${caminho}`
}

/**
 * Rota indexável.
 *
 * `atualizadoEm` só existe quando há uma data real. As páginas sem revisão
 * datada não declaram nenhuma: informar ao buscador uma data de modificação
 * inventada — a data do build, por exemplo — faz o site alegar que tudo mudou
 * a cada deploy, e o buscador passa a ignorar o campo inteiro.
 */
export interface RotaIndexavel {
  readonly caminho: string
  readonly prioridade: number
  readonly atualizadoEm?: string
}

/** Institucionais e legais. `03-functional-spec` §5. */
const ROTAS_FIXAS: readonly RotaIndexavel[] = [
  { caminho: '/', prioridade: 1 },
  { caminho: '/guias', prioridade: 0.6 },
  { caminho: '/aviso-legal', prioridade: 0.3 },
  { caminho: '/privacidade', prioridade: 0.3 },
  { caminho: '/termos', prioridade: 0.3 },
  { caminho: '/cookies', prioridade: 0.3 },
]

/**
 * Todas as rotas indexáveis do site.
 *
 * **Nenhuma com query string.** Rota com query recebe `noindex` (`06-api-spec`
 * §2.1) porque a query carrega salário e dados de contrato; colocá-la no
 * sitemap convidaria o buscador a indexar exatamente o que `RN-030` protege.
 */
export function rotasIndexaveis(): readonly RotaIndexavel[] {
  return [
    ...ROTAS_FIXAS,
    ...CALCULADORAS.map((c) => ({ caminho: `/calculadora/${c.slug}`, prioridade: 0.9 })),
    ...GUIAS.map((g) => ({
      caminho: `/guia/${g.slug}`,
      prioridade: 0.7,
      atualizadoEm: g.atualizadoEm,
    })),
  ]
}
