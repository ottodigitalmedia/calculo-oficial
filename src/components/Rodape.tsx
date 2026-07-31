import Link from 'next/link'

import { Logotipo } from '@/components/Marca'
import { CALCULADORAS } from '@/lib/calculadoras'
import { GUIAS } from '@/lib/guias'

/**
 * Rodapé — `03-functional-spec` §5.
 *
 * Sem captura de e-mail, ao contrário da referência: newsletter está fora de
 * escopo (`01-prd` §6) e coletar e-mail criaria tratamento de dado pessoal
 * onde hoje não existe nenhum.
 *
 * **As listas vêm dos registros, não são escritas aqui.** Até o T-105 este
 * arquivo trazia INSS, Imposto de Renda e juros compostos marcados "em breve"
 * — as três já publicadas no T-104. É a desonestia que o comentário da home
 * descreve, ao contrário: esconder o que existe, em vez de prometer o que não
 * existe. Derivar do registro remove a possibilidade de a divergência voltar.
 */
const LEGAIS = [
  { href: '/aviso-legal', rotulo: 'Aviso legal' },
  { href: '/privacidade', rotulo: 'Privacidade' },
  { href: '/termos', rotulo: 'Termos de uso' },
  { href: '/cookies', rotulo: 'Cookies' },
]

export function Rodape() {
  return (
    <footer className="mt-20 bg-[var(--color-navy)] text-[var(--color-text-inverse)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logotipo claro />
          <p className="mt-3 max-w-xs text-sm opacity-75">
            Calculadoras trabalhistas, tributárias e financeiras com a conta à mostra. Gratuito,
            sem cadastro.
          </p>
          <p className="mt-3 text-sm opacity-75">
            <Link href="/#como-funciona" className="hover:underline">
              Como funciona
            </Link>
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Calculadoras</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-75">
            {CALCULADORAS.map((c) => (
              <li key={c.slug}>
                <Link href={`/calculadora/${c.slug}`} className="hover:underline">
                  {c.nome}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Guias</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-75">
            {GUIAS.map((g) => (
              <li key={g.slug}>
                <Link href={`/guia/${g.slug}`} className="hover:underline">
                  {g.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-75">
            {LEGAIS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline">
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-6 text-sm opacity-60">
          Ferramenta informativa e educacional. Os resultados são estimativas e não constituem
          aconselhamento jurídico, contábil ou financeiro.
        </p>
      </div>
    </footer>
  )
}
