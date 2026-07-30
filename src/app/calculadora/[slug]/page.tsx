import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Calculadora } from '@/components/Calculadora'
import { CALCULADORAS, porSlug } from '@/lib/calculadoras'

/**
 * EP-004 — `/calculadora/{slug}`.
 *
 * **Uma rota para todas as calculadoras** (`ADR-008` E-1). Adicionar uma
 * calculadora é acrescentar uma definição ao registro; nenhum arquivo de rota
 * é criado.
 *
 * A entrada dominante é a busca externa direto aqui, não a home — então esta
 * página precisa funcionar como página de chegada, com contexto suficiente
 * para quem nunca viu o site (`10-ux-ui-spec` §8).
 */

export function generateStaticParams() {
  return CALCULADORAS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const c = porSlug(slug)
  if (!c) return {}
  return {
    title: c.nome,
    description: c.descricaoSeo,
    alternates: { canonical: `/calculadora/${c.slug}` },
  }
}

export default async function PaginaCalculadora({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const definicao = porSlug(slug)
  if (!definicao) notFound()

  return (
    <main id="conteudo" className="mx-auto max-w-5xl px-5 py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-navy)] md:text-4xl">
          {definicao.nome}
        </h1>
        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
          {definicao.linhaDeContexto}
        </p>
      </header>

      <section className="mt-8">
        <Calculadora slug={definicao.slug} />
      </section>

      {/* O slot de anúncio ficaria AQUI: abaixo do resultado e da memória,
          nunca acima, nunca dentro da memória (MC-5, `10-ux-ui-spec` §9).
          Não entra no lançamento — `ADR-008`. */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--color-navy)]">Perguntas frequentes</h2>
        <dl className="mt-4 space-y-5">
          {definicao.faq.map((item) => (
            <div key={item.pergunta}>
              <dt className="font-medium">{item.pergunta}</dt>
              <dd className="mt-1 text-[var(--color-text-secondary)]">{item.resposta}</dd>
            </div>
          ))}
        </dl>
      </section>

    </main>
  )
}
