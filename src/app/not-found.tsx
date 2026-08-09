import type { Metadata } from 'next'
import Link from 'next/link'

import { GRADE, LEITURA } from '@/lib/layout'

/**
 * Página 404 — descoberta pela auditoria de layout em 08/08/2026.
 *
 * ## O QUE ESTAVA NO AR ATÉ AQUI
 *
 * Nada. Sem `not-found.tsx`, o Next serve a dele: um `404` com
 * *"This page could not be found."*, em **inglês**, com estilo embutido e sem
 * contêiner — renderizada entre o cabeçalho e o rodapé do site, que são
 * estilizados. O resultado parece uma página quebrada, e foi assim que ela
 * apareceu: o mantenedor notou "margens erradas" em alguma página e era esta.
 *
 * Num site brasileiro de cálculo trabalhista e tributário, uma página pública
 * em inglês não é detalhe de acabamento — é a única página do domínio que não
 * fala com quem chegou nela.
 *
 * ## POR QUE ELA IMPORTA MAIS AQUI DO QUE NA MÉDIA
 *
 * A entrada dominante deste produto é busca externa direto na calculadora
 * (`10-ux-ui-spec` §8), e não a home. Isso significa que o 404 recebe
 * **resultado de busca velho, link de terceiro quebrado e endereço digitado
 * errado** — gente com intenção clara, a um passo da ferramenta certa. Mandá-la
 * embora com uma frase em inglês desperdiça o único canal de aquisição que o
 * projeto tem.
 *
 * Por isso a página não se desculpa: ela oferece os dois caminhos que
 * resolvem — o catálogo e os guias — e o canal para relatar o link quebrado.
 *
 * O status HTTP 404 é do Next, e ele já o devolve. Não há canônica nem entrada
 * no sitemap, de propósito: `rotasIndexaveis` lista o que existe.
 */

export const metadata: Metadata = {
  title: 'Página não encontrada',
  description: 'O endereço não corresponde a nenhuma calculadora ou guia deste site.',
  robots: { index: false, follow: true },
}

export default function NaoEncontrada() {
  return (
    <main id="conteudo" className={`${GRADE} py-14`}>
      <div className={LEITURA}>
        <p className="text-sm font-semibold text-[var(--color-brand)]">Erro 404</p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-navy)] md:text-4xl">
          Esta página não existe
        </h1>

        <p className="mt-3 text-lg text-[var(--color-text-muted)]">
          O endereço não corresponde a nenhuma calculadora nem a nenhum guia. Pode ser um link
          antigo, um resultado de busca desatualizado ou um endereço digitado com um caractere a
          mais.
        </p>

        <p className="mt-6 leading-relaxed">
          O que você procura provavelmente está no catálogo — são 76 calculadoras, com a memória de
          cálculo à mostra em todas.
        </p>

        {/* Dois caminhos, e não uma lista de tudo: quem cai aqui quer voltar ao
            fluxo, não escolher entre opções. */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/#calculadoras"
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--color-brand)] px-5 py-2.5 font-medium text-white hover:bg-[var(--color-brand-hover)]"
          >
            Ver todas as calculadoras
          </Link>
          <Link
            href="/guias"
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--color-border)] px-5 py-2.5 font-medium hover:border-[var(--color-brand)]"
          >
            Ler os guias
          </Link>
        </div>

        <p className="mt-10 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-text-secondary)]">
          Chegou aqui por um link de dentro do site? <Link href="/contato" className="underline">Avise
          a gente</Link> — link quebrado é defeito, e a correção vem com o caso de teste que impede
          o erro de voltar.
        </p>
      </div>
    </main>
  )
}
