import Link from 'next/link'

import { Logotipo } from '@/components/Marca'

/**
 * Rodapé — `03-functional-spec` §5.
 *
 * Sem captura de e-mail, ao contrário da referência: newsletter está fora de
 * escopo (`01-prd` §6) e coletar e-mail criaria tratamento de dado pessoal
 * onde hoje não existe nenhum.
 */
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
        </div>

        <div>
          <h2 className="text-sm font-semibold">Calculadoras</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-75">
            <li>
              <Link href="/calculadora/salario-liquido" className="hover:underline">
                Salário líquido
              </Link>
            </li>
            <li>INSS — em breve</li>
            <li>Imposto de Renda — em breve</li>
            <li>Juros compostos — em breve</li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Como funciona</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-75">
            <li>
              <Link href="/#como-funciona" className="hover:underline">
                Memória de cálculo
              </Link>
            </li>
            <li>
              <Link href="/#calculadoras" className="hover:underline">
                Cálculo por período
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-75">
            <li>
              <Link href="/aviso-legal" className="hover:underline">
                Aviso legal
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:underline">
                Privacidade
              </Link>
            </li>
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
