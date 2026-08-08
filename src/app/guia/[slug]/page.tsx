import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DadosEstruturados, dadosDeMigalhas, dadosDoGuia } from '@/components/DadosEstruturados'
import { CorpoDoGuia } from '@/components/Guia'
import { IconeSeta } from '@/components/Marca'
import { porSlug } from '@/lib/calculadoras'
import { GUIAS, guiaPorSlug } from '@/lib/guias'
import { formatarData } from '@/lib/format/moeda'
import { GRADE, LEITURA } from '@/lib/layout'

/**
 * EP-006 — `/guia/{slug}`.
 *
 * Uma rota para todos os guias (`ADR-009`). Publicar um guia é acrescentar uma
 * entrada em `lib/guias`; nenhum arquivo de rota é criado, e ele entra no
 * sitemap no mesmo commit porque `lib/seo` deriva as rotas do registro.
 */

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guia = guiaPorSlug(slug)
  if (!guia) return {}
  return {
    title: guia.titulo,
    description: guia.descricaoSeo,
    alternates: { canonical: `/guia/${guia.slug}` },
    openGraph: {
      type: 'article',
      title: guia.titulo,
      description: guia.descricaoSeo,
      url: `/guia/${guia.slug}`,
      modifiedTime: guia.atualizadoEm,
    },
  }
}

export default async function PaginaGuia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guia = guiaPorSlug(slug)
  if (!guia) notFound()

  const calculadoras = guia.calculadoras.map(porSlug).filter((c) => c !== undefined)

  return (
    <main id="conteudo" className={`${GRADE} py-12`}>
      {/* Coluna de leitura dentro da grade — ver `lib/layout.ts`. */}
      <div className={LEITURA}>
      <DadosEstruturados
        dados={dadosDoGuia({
          titulo: guia.titulo,
          descricao: guia.descricaoSeo,
          caminho: `/guia/${guia.slug}`,
          atualizadoEm: guia.atualizadoEm,
        })}
      />
      <DadosEstruturados
        dados={dadosDeMigalhas([
          { nome: 'Início', caminho: '/' },
          { nome: 'Guias', caminho: '/guias' },
          { nome: guia.titulo, caminho: `/guia/${guia.slug}` },
        ])}
      />

      {/* Migalhas visíveis, e não só marcadas: quem chega da busca direto aqui
          precisa entender onde está (`10-ux-ui-spec` §8). */}
      {/* `py-1` não é estética: sem ele o alvo de toque fica com 19 px de
          altura, abaixo dos 24 px de WCAG 2.2 (2.5.8). */}
      <nav aria-label="Trilha de navegação" className="text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="inline-block py-1 hover:underline">Início</Link>
        <span aria-hidden="true"> › </span>
        <Link href="/guias" className="inline-block py-1 hover:underline">Guias</Link>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--color-navy)] md:text-4xl">
          {guia.titulo}
        </h1>
        <p className="mt-3 text-lg text-[var(--color-text-muted)]">{guia.subtitulo}</p>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Texto revisado em{' '}
          <time dateTime={guia.atualizadoEm}>{formatarData(guia.atualizadoEm)}</time>. Os valores
          legais abaixo vêm dos parâmetros cadastrados e acompanham a norma que os fixa.
        </p>
      </header>

      <CorpoDoGuia guia={guia} />

      {calculadoras.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-navy)]">
            Calculadoras deste guia
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {calculadoras.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/calculadora/${c.slug}`}
                  className="flex h-full flex-col rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-brand)]"
                >
                  <span className="font-semibold text-[var(--color-navy)]">{c.nome}</span>
                  <span className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {c.linhaDeContexto}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand)]">
                    Calcular <IconeSeta />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      </div>
    </main>
  )
}
