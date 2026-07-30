import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Cálculo Aberto',
    template: '%s · Cálculo Aberto',
  },
  description:
    'Calculadoras trabalhistas, tributárias e financeiras com memória de cálculo auditável: cada resultado mostra a conta, o parâmetro legal, a vigência e a fonte.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // lang="pt-BR" é requisito de acessibilidade (10-ux-ui-spec §6).
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  )
}
