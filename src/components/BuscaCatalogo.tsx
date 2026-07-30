'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { IconeSeta } from '@/components/Marca'
import { CALCULADORAS } from '@/lib/calculadoras'

/**
 * Busca local no catálogo — `RF-007`, `03-functional-spec` §2.1.
 *
 * **Sem rede.** O catálogo inteiro já veio no pacote da página; filtrar é
 * trabalho de memória. Além de instantâneo, isso mantém a promessa: o termo
 * que a pessoa digita não sai do navegador.
 *
 * `> ⚠️ Quando a análise de uso entrar (adiada por ADR-008), instrumentar aqui
 * o evento `busca_sem_resultado` — é a única exceção de RN-031.1 e a
 * informação mais valiosa para decidir a próxima calculadora.`
 */

/** Termos que as pessoas usam e que não estão no nome da calculadora. */
const SINONIMOS: Readonly<Record<string, readonly string[]>> = {
  'salario-liquido': ['holerite', 'contracheque', 'salario liquido', 'desconto folha', 'quanto vou receber'],
  inss: ['previdencia', 'aposentadoria', 'contribuicao', 'desconto inss'],
  irrf: ['imposto de renda', 'ir', 'leao', 'retencao', 'imposto na fonte'],
  'juros-compostos': ['investimento', 'render', 'rendimento', 'poupanca', 'aporte'],
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function BuscaCatalogo() {
  const [termo, setTermo] = useState('')

  const resultados = useMemo(() => {
    const t = normalizar(termo)
    if (t === '') return CALCULADORAS
    return CALCULADORAS.filter((c) => {
      const alvo = normalizar(`${c.nome} ${c.linhaDeContexto} ${(SINONIMOS[c.slug] ?? []).join(' ')}`)
      return alvo.includes(t)
    })
  }, [termo])

  return (
    <div>
      <label htmlFor="busca" className="sr-only">
        Buscar calculadora
      </label>
      <input
        id="busca"
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar calculadora…"
        className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base"
      />

      <div aria-live="polite" className="mt-6">
        {resultados.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">
            Não encontramos nada com esse termo.{' '}
            <button
              type="button"
              onClick={() => setTermo('')}
              className="text-[var(--color-brand)] underline"
            >
              Veja todas as calculadoras.
            </button>
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/calculadora/${c.slug}`}
                  className="block h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[var(--color-brand)]"
                >
                  <h3 className="font-semibold">{c.nome}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{c.linhaDeContexto}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand)]">
                    Usar calculadora <IconeSeta />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
