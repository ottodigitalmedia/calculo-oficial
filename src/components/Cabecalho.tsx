import Link from 'next/link'

import { Logotipo } from '@/components/Marca'

/**
 * Cabeçalho — navegação e busca (`03-functional-spec` §1.1).
 *
 * SEM "Entrar" nem "Criar Conta", ao contrário da referência de design:
 * `ADR-002` decidiu que não há autenticação, e a ausência não é um vazio a
 * preencher — é propriedade de segurança do sistema (`07-security` §2).
 */
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="Cálculo Oficial — página inicial">
          <Logotipo />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 text-sm md:flex">
          <Link href="/#calculadoras" className="hover:text-[var(--color-brand)]">
            Calculadoras
          </Link>
          <Link href="/#como-funciona" className="hover:text-[var(--color-brand)]">
            Como funciona
          </Link>
          <Link href="/guias" className="hover:text-[var(--color-brand)]">
            Guias
          </Link>
          <Link href="/aviso-legal" className="hover:text-[var(--color-brand)]">
            Aviso legal
          </Link>
        </nav>

        <Link
          href="/calculadora/salario-liquido"
          className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
        >
          Calcular agora
        </Link>
      </div>
    </header>
  )
}
