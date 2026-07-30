/**
 * Página inicial provisória (fatia F-0).
 *
 * A home definitiva é T-026 e depende do catálogo estar no ar. Esta existe
 * para que F-0 tenha o que verificar: um commit na branch principal aparece
 * no ar sem intervenção manual.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Cálculo Oficial</h1>

      <p className="text-lg text-neutral-700">
        Um número que você pode conferir: cada cálculo mostra o passo a passo, o
        parâmetro legal usado, a vigência dele e o link para a norma.
      </p>

      <p className="text-sm text-neutral-500">
        Em construção. Nenhuma calculadora publicada ainda.
      </p>
    </main>
  )
}
