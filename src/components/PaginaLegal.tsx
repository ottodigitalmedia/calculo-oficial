import type { ReactNode } from 'react'

import { GRADE, LEITURA } from '@/lib/layout'

/**
 * Enquadramento comum das páginas legais — `03-functional-spec` §5.
 *
 * A moldura passou a ser `GRADE` + `LEITURA` em 08/08/2026. Era
 * `mx-auto max-w-3xl`, que centrava a coluna de leitura na tela e a deslocava
 * 192 px à direita do logotipo. Ver `lib/layout.ts`.
 */
export function PaginaLegal({
  titulo,
  resumo,
  children,
}: {
  readonly titulo: string
  readonly resumo: string
  readonly children: ReactNode
}) {
  return (
    <main id="conteudo" className={`${GRADE} py-14`}>
      <div className={LEITURA}>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-navy)] md:text-4xl">
          {titulo}
        </h1>
        <p className="mt-3 text-lg text-[var(--color-text-muted)]">{resumo}</p>
        <div className="mt-10 space-y-6 leading-relaxed [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
          {children}
        </div>
      </div>
    </main>
  )
}
