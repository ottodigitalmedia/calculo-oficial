import type { Metadata } from 'next'

import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://calculoficial.com.br'),
  title: {
    default: 'Cálculo Oficial — calculadoras com a conta à mostra',
    template: '%s · Cálculo Oficial',
  },
  description:
    'Calculadoras trabalhistas, tributárias e financeiras. Cada resultado mostra o passo a passo, o parâmetro legal usado, a vigência e o link para a norma.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // lang="pt-BR" é requisito de acessibilidade (10-ux-ui-spec §6).
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col bg-[var(--color-surface)] text-[var(--color-text-primary)]">
        {/* Primeiro item na ordem de tabulação: quem navega por teclado não
            deve percorrer o cabeçalho inteiro em toda página (§6). */}
        <a href="#conteudo" className="pular-para-conteudo">
          Pular para o conteúdo
        </a>
        <Cabecalho />
        <div className="flex-1">{children}</div>
        <Rodape />
      </body>
    </html>
  )
}
