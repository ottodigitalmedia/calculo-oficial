import type { Metadata } from 'next'
import Link from 'next/link'

import { PaginaLegal } from '@/components/PaginaLegal'

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'O Cálculo Oficial não utiliza cookies nem carrega scripts de terceiro.',
  alternates: { canonical: '/cookies' },
}

/**
 * `RF-010`. Página curta de propósito: descreve o estado atual, que é a
 * ausência de cookies. Quando o anúncio entrar (adiado por `ADR-008`), ela
 * cresce no mesmo commit que o introduz.
 */
export default function Cookies() {
  return (
    <PaginaLegal titulo="Cookies" resumo="Não usamos.">
      <h2>Situação atual</h2>
      <p>
        Este site <strong>não grava cookies</strong>, não usa armazenamento local para identificar
        você e não carrega script de terceiro. Não há publicidade, não há medição de audiência e
        não há rastreamento entre visitas.
      </p>
      <p>
        Como não existe tratamento a consentir, também não existe banner pedindo consentimento — o
        aviso que a maioria dos sites exibe só faz sentido quando há algo a autorizar.
      </p>

      <h2>Quando isso mudar</h2>
      <p>
        A publicidade está prevista como forma de sustentar o projeto. Quando entrar:
      </p>
      <ul>
        <li>nenhum script de terceiro carregará antes da sua decisão;</li>
        <li>o pedido de consentimento virá antes, não depois;</li>
        <li>esta página será atualizada descrevendo o que passa a existir e como revogar.</li>
      </ul>

      <p className="text-sm text-[var(--color-text-muted)]">
        Detalhes sobre o tratamento de dados na{' '}
        <Link href="/privacidade" className="text-[var(--color-brand)] underline">política de privacidade</Link>.
      </p>
    </PaginaLegal>
  )
}
