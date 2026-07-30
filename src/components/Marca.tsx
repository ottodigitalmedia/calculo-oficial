/**
 * Marca e ícones — SVG em linha.
 *
 * Sem biblioteca de ícones: são poucos, e uma dependência que executa no
 * cliente é cadeia a mais para comprometer (`07-security` §8) num produto que
 * promete não tocar no dado do usuário. Sete ícones não justificam isso.
 */

export function Logotipo({ claro = false }: { readonly claro?: boolean }) {
  const cor = claro ? 'var(--color-text-inverse)' : 'var(--color-navy)'
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden focusable="false">
        <rect width="28" height="28" rx="7" fill="var(--color-brand)" />
        <rect x="6" y="6" width="16" height="4.5" rx="1.5" fill="#fff" opacity=".95" />
        <rect x="6" y="13" width="4.5" height="4" rx="1.2" fill="#fff" opacity=".8" />
        <rect x="11.75" y="13" width="4.5" height="4" rx="1.2" fill="#fff" opacity=".8" />
        <rect x="17.5" y="13" width="4.5" height="4" rx="1.2" fill="#fff" opacity=".8" />
        <rect x="6" y="19" width="4.5" height="3" rx="1.2" fill="#fff" opacity=".8" />
        <rect x="11.75" y="19" width="10.25" height="3" rx="1.2" fill="#fff" opacity=".95" />
      </svg>
      <span className="text-lg font-semibold tracking-tight" style={{ color: cor }}>
        Cálculo Oficial
      </span>
    </span>
  )
}

const TRACO = {
  fill: 'none',
  stroke: 'currentColor',
  // eslint-disable-next-line no-restricted-syntax -- espessura de traço de SVG, não valor monetário (BV-11)
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconePassos() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path {...TRACO} d="M4 7h9M4 12h13M4 17h7" />
      <circle {...TRACO} cx="19" cy="17" r="2.6" />
    </svg>
  )
}

export function IconeFonte() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path {...TRACO} d="M6 4h9l4 4v12H6z" />
      <path {...TRACO} d="M14 4v5h5M9 13h6M9 16.5h4" />
    </svg>
  )
}

export function IconePeriodo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
      <rect {...TRACO} x="4" y="5.5" width="16" height="14" rx="2.5" />
      <path {...TRACO} d="M4 10h16M9 3.5v4M15 3.5v4" />
    </svg>
  )
}

export function IconePrivacidade() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path {...TRACO} d="M12 3.5l7 3v5.2c0 4.3-2.9 7.6-7 9.3-4.1-1.7-7-5-7-9.3V6.5z" />
      <path {...TRACO} d="M9.3 12.2l1.9 1.9 3.5-3.7" />
    </svg>
  )
}

export function IconeCheque() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="9.5" fill="currentColor" opacity=".14" />
      <path {...TRACO} d="M8 12.3l2.7 2.7L16 9.5" />
    </svg>
  )
}

export function IconeSeta() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path {...TRACO} d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />
    </svg>
  )
}
