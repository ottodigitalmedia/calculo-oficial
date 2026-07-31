import type { MetadataRoute } from 'next'

import { absoluto, rotasIndexaveis } from '@/lib/seo'

/**
 * EP-013 — `/sitemap.xml`, gerado no build.
 *
 * As rotas vêm de `lib/seo`, que as deriva dos registros de calculadoras e de
 * guias. Publicar uma calculadora a coloca no sitemap no mesmo commit, sem
 * ninguém lembrar de fazê-lo.
 *
 * `lastModified` aparece só onde existe data real de revisão — hoje, os guias.
 * Carimbar a data do build em tudo faria o site alegar, a cada deploy, que
 * todas as páginas mudaram; o buscador aprende a desconsiderar o campo e
 * perde-se o sinal justamente onde ele seria verdadeiro.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return rotasIndexaveis().map((rota) => ({
    url: absoluto(rota.caminho),
    priority: rota.prioridade,
    ...(rota.atualizadoEm === undefined ? {} : { lastModified: rota.atualizadoEm }),
  }))
}
