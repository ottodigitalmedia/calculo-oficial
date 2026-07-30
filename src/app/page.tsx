import Link from 'next/link'

import {
  IconeCheque,
  IconeFonte,
  IconePassos,
  IconePeriodo,
  IconePrivacidade,
  IconeSeta,
} from '@/components/Marca'
import { CALCULADORAS } from '@/lib/calculadoras'

/**
 * Página inicial — `03-functional-spec` §2.1, com a estrutura da referência de
 * design: herói → diferenciais → como funciona → grade → chamada → rodapé.
 *
 * O QUE A REFERÊNCIA TEM E AQUI NÃO ENTRA, e por quê:
 *
 *   "Entrar" / "Criar Conta"  → `ADR-002`: não há autenticação
 *   "Preços"                  → monetização é anúncio; o produto é gratuito
 *   Depoimentos e "10.000+"   → não temos usuários. Prova social inventada é
 *                               propaganda enganosa, e num produto cuja tese é
 *                               confiabilidade seria autodestrutivo
 *   Newsletter                → fora de escopo (`01-prd` §6); coletar e-mail
 *                               criaria tratamento de dado pessoal onde hoje
 *                               não existe nenhum
 *
 * O que a referência NÃO tem, e é o centro daqui: a memória de cálculo.
 */

const DIFERENCIAIS = [
  {
    icone: <IconePassos />,
    cor: 'var(--color-tile-blue)',
    titulo: 'Cálculo aberto',
    texto: 'Veja cada etapa da conta, não só o resultado.',
  },
  {
    icone: <IconeFonte />,
    cor: 'var(--color-tile-green)',
    titulo: 'Parâmetro com fonte',
    texto: 'Cada tabela usada vem com a norma e a vigência.',
  },
  {
    icone: <IconePeriodo />,
    cor: 'var(--color-tile-amber)',
    titulo: 'Qualquer período',
    texto: 'Recalcule com a tabela que valia na época.',
  },
  {
    icone: <IconePrivacidade />,
    cor: 'var(--color-tile-violet)',
    titulo: 'Nada sai do navegador',
    texto: 'O que você digita não é enviado nem guardado.',
  },
]

const PASSOS = [
  { n: 1, titulo: 'Escolha a calculadora', texto: 'Sem cadastro, sem instalar nada.' },
  { n: 2, titulo: 'Informe seus dados', texto: 'O resultado aparece enquanto você digita.' },
  { n: 3, titulo: 'Abra a memória', texto: 'Cada etapa, com a fórmula e os valores.' },
  { n: 4, titulo: 'Confira na norma', texto: 'Siga o link e leia a fonte oficial.' },
]

const EM_BREVE = [
  { nome: 'INSS', texto: 'Contribuição mensal, faixa a faixa, com a alíquota efetiva.' },
  { nome: 'Imposto de Renda', texto: 'IRRF na fonte, com desconto simplificado e redutor.' },
  { nome: 'Juros compostos', texto: 'Evolução mês a mês, com aportes.' },
]

const PROMESSAS = [
  'Passo a passo de cada conta',
  'Norma e vigência em cada valor',
  'Cálculo de anos anteriores',
  'Seus dados não saem do navegador',
]

export default function Home() {
  return (
    <main id="conteudo">
      {/* -------------------------------------------------------- herói -- */}
      <section className="bg-[var(--color-surface-tint)]">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-sm font-medium text-[var(--color-brand)]">
            Gratuito · sem cadastro
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-[var(--color-navy)] md:text-5xl">
            Um número que você
            <br />
            pode conferir.
          </h1>

          <p className="mt-5 max-w-xl text-lg text-[var(--color-text-muted)]">
            Calculadoras trabalhistas, tributárias e financeiras em que cada resultado mostra o
            passo a passo, o parâmetro legal usado, a vigência dele e o link para a norma.
          </p>

          <ul className="mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
            {PROMESSAS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <span className="text-[var(--color-brand)]">
                  <IconeCheque />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/calculadora/salario-liquido"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 font-medium text-white hover:bg-[var(--color-brand-hover)]"
            >
              Calcular salário líquido <IconeSeta />
            </Link>
            <Link
              href="#como-funciona"
              className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-3 font-medium hover:border-[var(--color-brand)]"
            >
              Como funciona
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- diferenciais -- */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DIFERENCIAIS.map((d) => (
            <div key={d.titulo}>
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-navy)]"
                style={{ background: d.cor }}
              >
                {d.icone}
              </span>
              <h2 className="mt-3 font-semibold">{d.titulo}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{d.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ como funciona -- */}
      <section id="como-funciona" className="bg-[var(--color-surface-tint)]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--color-navy)]">
            Como funciona
          </h2>
          <p className="mt-2 text-center text-[var(--color-text-muted)]">
            Quatro passos — e o terceiro é o que nos diferencia.
          </p>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PASSOS.map((p) => (
              <li key={p.n}>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] font-semibold text-white">
                  {p.n}
                </span>
                <h3 className="mt-3 font-semibold">{p.titulo}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------- calculadoras - */}
      <section id="calculadoras" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--color-navy)]">Calculadoras</h2>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Poucas e auditadas, em vez de muitas e abandonadas.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULADORAS.map((c) => (
            <Link
              key={c.slug}
              href={`/calculadora/${c.slug}`}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[var(--color-brand)]"
            >
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-navy)]"
                style={{ background: 'var(--color-tile-blue)' }}
              >
                <IconePassos />
              </span>
              <h3 className="mt-4 font-semibold">{c.nome}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{c.linhaDeContexto}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand)]">
                Usar calculadora <IconeSeta />
              </span>
            </Link>
          ))}

          {/* Declarado como "em breve" em vez de omitido: dizer o que ainda
              não existe é mais honesto que sugerir cobertura que não temos. */}
          {EM_BREVE.map((c) => (
            <div
              key={c.nome}
              className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-6"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[var(--color-border-strong)]">
                <IconePassos />
              </span>
              <h3 className="mt-4 font-semibold text-[var(--color-text-muted)]">{c.nome}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{c.texto}</p>
              <span className="mt-4 inline-block text-sm font-medium text-[var(--color-text-muted)]">
                Em breve
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- chamada - */}
      <section className="mx-auto max-w-6xl px-5 pb-4">
        <div className="rounded-2xl bg-[var(--color-navy)] px-8 py-12 text-[var(--color-text-inverse)] md:px-12">
          <h2 className="max-w-lg text-3xl font-bold tracking-tight">
            Confira seu holerite em menos de um minuto.
          </h2>
          <p className="mt-3 max-w-xl opacity-80">
            Sem cadastro, sem instalar nada, e com a conta à mostra para você comparar com o que
            veio descontado.
          </p>
          <Link
            href="/calculadora/salario-liquido"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-[var(--color-navy)] hover:bg-[var(--color-brand-soft)]"
          >
            Calcular salário líquido <IconeSeta />
          </Link>
        </div>
      </section>
    </main>
  )
}
