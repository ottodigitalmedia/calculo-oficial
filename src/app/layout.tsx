import type { Metadata } from 'next'

import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'
import { NOME_DO_SITE, SITE_URL } from '@/lib/seo'

import './globals.css'

const DESCRICAO =
  'Calculadoras trabalhistas, tributárias e financeiras. Cada resultado mostra o passo a passo, o parâmetro legal usado, a vigência e o link para a norma.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Cálculo Oficial — calculadoras com a conta à mostra',
    template: '%s · Cálculo Oficial',
  },
  description: DESCRICAO,
  applicationName: NOME_DO_SITE,
  // Herdado por toda rota; cada página sobrescreve título, descrição e `url`.
  openGraph: {
    type: 'website',
    siteName: NOME_DO_SITE,
    locale: 'pt_BR',
    title: 'Cálculo Oficial — calculadoras com a conta à mostra',
    description: DESCRICAO,
    url: '/',
  },
  // `max-snippet` e `max-image-preview` sem limite: o conteúdo é o produto, e
  // trecho maior no resultado de busca ajuda quem procura uma explicação.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
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
