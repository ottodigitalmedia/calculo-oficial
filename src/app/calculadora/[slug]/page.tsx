import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Calculadora } from '@/components/Calculadora'
import {
  DadosEstruturados,
  dadosDaCalculadora,
  dadosDeFaq,
  dadosDeMigalhas,
} from '@/components/DadosEstruturados'
import { IconeSeta } from '@/components/Marca'
import { CALCULADORAS, porSlug } from '@/lib/calculadoras'
import { formularioDe } from '@/lib/calculadoras/tipos'
import { CREDITO } from '@/lib/params/data/credito'
import { INSS } from '@/lib/params/data/inss'
import { IRRF } from '@/lib/params/data/irrf'
import { TRABALHISTA } from '@/lib/params/data/trabalhista'
import { construirRegistro } from '@/lib/params/registry'
import { guiasDaCalculadora } from '@/lib/guias'

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

/**
 * O registro vive aqui, no SERVIDOR.
 *
 * É ele que resolve os anos disponíveis e o intervalo de cobertura que o
 * formulário exibe. Antes o componente de cliente o construía, e com isso as
 * tabelas de INSS, IRRF e trabalhistas entravam no pacote estático de toda
 * rota de calculadora — para produzir dois dados serializáveis.
 */
const registro = construirRegistro(INSS, IRRF, TRABALHISTA, CREDITO)

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
    openGraph: {
      type: 'website',
      title: `${c.nome} · Cálculo Oficial`,
      description: c.descricaoSeo,
      url: `/calculadora/${c.slug}`,
    },
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

  const relacionadas = definicao.relacionadas.map(porSlug).filter((c) => c !== undefined)
  const guias = guiasDaCalculadora(definicao.slug)

  return (
    <main id="conteudo" className="mx-auto max-w-5xl px-5 py-10">
      {/* O `FAQPage` sai do MESMO array que renderiza as perguntas abaixo, e o
          `WebApplication` do mesmo objeto que dá título à página. Marcar o que
          a página não mostra é a causa mais comum de penalização por dado
          estruturado — aqui não há como divergir. */}
      <DadosEstruturados
        dados={dadosDaCalculadora({
          nome: definicao.nome,
          descricao: definicao.descricaoSeo,
          caminho: `/calculadora/${definicao.slug}`,
        })}
      />
      <DadosEstruturados dados={dadosDeFaq(definicao.faq)} />
      <DadosEstruturados
        dados={dadosDeMigalhas([
          { nome: 'Início', caminho: '/' },
          { nome: definicao.nome, caminho: `/calculadora/${definicao.slug}` },
        ])}
      />

      {/* `py-1` não é estética: sem ele o alvo de toque fica com 19 px de
          altura, abaixo dos 24 px de WCAG 2.2 (2.5.8). */}
      <nav aria-label="Trilha de navegação" className="text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="inline-block py-1 hover:underline">
          Início
        </Link>
        <span aria-hidden="true"> › </span>
        <Link href="/#calculadoras" className="inline-block py-1 hover:underline">
          Calculadoras
        </Link>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-navy)] md:text-4xl">
          {definicao.nome}
        </h1>
        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
          {definicao.linhaDeContexto}
        </p>
      </header>

      {/* O formulário vai resolvido daqui, e não pelo slug: assim o pacote do
          navegador não precisa do registro — e, com ele, das definições, dos
          FAQ e dos motores de todas as calculadoras. Ver
          `calculadoras/tipos.ts`, `FormularioCalculadora`. */}
      <section className="mt-8">
        <Calculadora formulario={formularioDe(definicao, registro)} />
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

      {guias.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-navy)]">
            Entenda a conta
          </h2>
          <ul className="mt-4 space-y-3">
            {guias.map((guia) => (
              <li key={guia.slug}>
                <Link
                  href={`/guia/${guia.slug}`}
                  className="block rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-brand)]"
                >
                  <span className="font-semibold text-[var(--color-navy)]">{guia.titulo}</span>
                  <span className="mt-1 block text-sm text-[var(--color-text-muted)]">
                    {guia.subtitulo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Critério de aceite do T-104 — "quando rolo até o fim, vejo as
          relacionadas". As relacionadas estavam declaradas nas quatro
          calculadoras desde então e não eram renderizadas em lugar nenhum. */}
      {relacionadas.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-navy)]">
            Calculadoras relacionadas
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relacionadas.map((c) => (
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
    </main>
  )
}
