'use client'

import Link from 'next/link'

import { GRADE, LEITURA } from '@/lib/layout'

/**
 * Fronteira de erro — irmã da 404, e encontrada com ela em 08/08/2026.
 *
 * Sem este arquivo, um erro de renderização cai na página padrão do Next:
 * inglês, sem contêiner, sem o layout do site. Mesmo defeito de `not-found`,
 * num momento pior — a pessoa estava no meio de um cálculo.
 *
 * ## O QUE ESTA PÁGINA NÃO FAZ, E É O PONTO
 *
 * **Não mostra `error.message`, e não registra nada em lugar nenhum.**
 *
 * Isso não é economia de informação: é `RN-030`. A rota de calculadora tem
 * salário, pensão e saldo de FGTS **na query** (`RF-006`), e mensagens de erro
 * e pilhas de execução arrastam contexto — `07-security` C-02 já manda a
 * ferramenta de erro remover query string e conteúdo de campo antes de enviar
 * qualquer coisa. A forma mais segura de cumprir isso é não haver envio, e é o
 * que este arquivo faz: nenhum `console`, nenhuma telemetria, nenhum terceiro.
 *
 * `TC-041` cobra justamente isto — *"erro provocado não transporta valor de
 * campo nem query"* — e passa hoje. Acrescentar um relatório de erro aqui, um
 * dia, exige reescrever aquele teste no mesmo commit.
 *
 * ## `reset` ANTES DE MANDAR EMBORA
 *
 * O primeiro botão tenta renderizar de novo, o que resolve falha transitória
 * sem custar o cenário digitado — recarregar a página perderia o que a pessoa
 * preencheu. O link para a home é a saída, não a primeira oferta.
 */
export default function Erro({ reset }: { readonly error: Error; readonly reset: () => void }) {
  return (
    <main id="conteudo" className={`${GRADE} py-14`}>
      <div className={LEITURA}>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-navy)] md:text-4xl">
          Alguma coisa quebrou aqui
        </h1>

        <p className="mt-3 text-lg text-[var(--color-text-muted)]">
          O erro é nosso, não seu — e nada do que você digitou foi enviado a lugar nenhum.
        </p>

        <p className="mt-6 leading-relaxed">
          Tentar de novo costuma resolver, e mantém o que você já preencheu. Se insistir, o relato
          é útil: diga qual calculadora e o que você estava fazendo.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--color-brand)] px-5 py-2.5 font-medium text-white hover:bg-[var(--color-brand-hover)]"
          >
            Tentar de novo
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--color-border)] px-5 py-2.5 font-medium hover:border-[var(--color-brand)]"
          >
            Voltar ao início
          </Link>
        </div>

        <p className="mt-10 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-text-secondary)]">
          <Link href="/contato" className="underline">
            Relatar o problema
          </Link>{' '}
          — o formulário não lê a página de onde você veio, então descreva com suas palavras.
        </p>
      </div>
    </main>
  )
}
