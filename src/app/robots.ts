import type { MetadataRoute } from 'next'

import { absoluto } from '@/lib/seo'

/**
 * EP-014 — `/robots.txt`.
 *
 * Libera o site inteiro e bloqueia apenas `/api/`, que existe só para a
 * verificação de saúde (EP-016) e já responde `x-robots-tag: noindex`. Os dois
 * mecanismos são complementares e não redundantes: `robots.txt` evita a
 * varredura, o cabeçalho evita a indexação de quem varreu assim mesmo.
 *
 * **Não há regra bloqueando query string aqui, e é deliberado.** `Disallow`
 * impede o rastreamento, e uma página que o buscador não rastreia é uma página
 * cujo `noindex` ele nunca lê — o efeito seria manter indexada uma URL com
 * salário dentro. O `noindex` da página é que resolve (`06-api-spec` §2.1).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }],
    sitemap: absoluto('/sitemap.xml'),
    host: absoluto('/'),
  }
}
