import type { Metadata } from 'next'
import Link from 'next/link'

import { DadosEstruturados, dadosDeMigalhas } from '@/components/DadosEstruturados'
import { IconeSeta } from '@/components/Marca'
import { GUIAS } from '@/lib/guias'
import { GRADE, LEITURA } from '@/lib/layout'

/** EP-005 — índice dos guias. */

export const metadata: Metadata = {
  title: 'Guias',
  description:
    'Explicações diretas de como cada cálculo funciona: o desconto do INSS, o imposto de renda na folha e a diferença entre salário bruto e líquido.',
  alternates: { canonical: '/guias' },
}

export default function PaginaGuias() {
  return (
    <main id="conteudo" className={`${GRADE} py-12`}>
      <DadosEstruturados
        dados={dadosDeMigalhas([
          { nome: 'Início', caminho: '/' },
          { nome: 'Guias', caminho: '/guias' },
        ])}
      />

      {/* A coluna de leitura vive DENTRO da grade — ver `lib/layout.ts`. É o
          que alinha o "G" de Guias com o logotipo do cabeçalho. */}
      <div className={LEITURA}>
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-navy)] md:text-4xl">
          Guias
        </h1>
        <p className="mt-3 text-lg text-[var(--color-text-muted)]">
          Entender a conta é o que permite conferir o resultado. Cada guia explica o mecanismo e
          mostra as tabelas em vigor com a norma ao lado.
        </p>
      </header>

      <ul className="mt-10 space-y-5">
        {GUIAS.map((guia) => (
          <li key={guia.slug}>
            <Link
              href={`/guia/${guia.slug}`}
              className="block rounded-xl border border-[var(--color-border)] p-6 hover:border-[var(--color-brand)]"
            >
              <h2 className="text-xl font-semibold text-[var(--color-navy)]">{guia.titulo}</h2>
              <p className="mt-2 text-[var(--color-text-muted)]">{guia.subtitulo}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand)]">
                Ler o guia <IconeSeta />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Os sete guias restantes são `03-functional-spec` §4 e estão suspensos
          até depois do lançamento (`ADR-008`). Não são anunciados aqui: uma
          lista de "em breve" numa página de conteúdo só dilui o que existe. */}
      </div>
    </main>
  )
}
