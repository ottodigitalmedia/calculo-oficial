import Link from 'next/link'

import { IconeSeta } from '@/components/Marca'
import { porSlug } from '@/lib/calculadoras'
import type { Bloco, Guia as TipoGuia } from '@/lib/guias/tipos'
import { formatarPercentual, formatarPeriodo, formatarReal } from '@/lib/format/moeda'
import { INSS } from '@/lib/params/data/inss'
import { IRRF } from '@/lib/params/data/irrf'
import { construirRegistro } from '@/lib/params/registry'
import type { Faixa, VigenciaResolvida } from '@/lib/params/tipos'

/**
 * Renderização de guia — `ADR-009`.
 *
 * Os blocos de parâmetro leem `lib/params/` na montagem da página, no build.
 * É o que garante G-1: nenhum valor legal foi digitado na prosa, e atualizar a
 * portaria atualiza o guia no mesmo commit.
 *
 * A vigência exibida é sempre a **mais recente cadastrada**, não a da data do
 * build (G-4) — dois builds do mesmo commit produzem o mesmo HTML.
 */

const registro = construirRegistro(INSS, IRRF)

// ---------------------------------------------------------------------------
// Procedência — some junto de todo valor legal
// ---------------------------------------------------------------------------

/**
 * A linha de fonte.
 *
 * Não é enfeite: é a mesma promessa da memória de cálculo (`RN-029`) aplicada
 * ao conteúdo. Um número sem norma, vigência e link neste site é um número
 * fora do padrão da casa.
 */
function Procedencia({ resolvida }: { readonly resolvida: VigenciaResolvida }) {
  const { fonte, vigencia } = resolvida
  return (
    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
      {fonte.norma}
      {fonte.dispositivo ? `, ${fonte.dispositivo}` : ''} · vigente{' '}
      {formatarPeriodo(vigencia.inicio, vigencia.fim)} ·{' '}
      <a
        href={fonte.url}
        className="text-[var(--color-brand)] underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        ver a norma
      </a>
    </p>
  )
}

/** Bloco de parâmetro ausente do registro. Não deveria acontecer: o teste
 *  `guias.test.ts` verifica cada `parametroId`. Se acontecer, some em silêncio
 *  em vez de derrubar a página — texto faltando é melhor que erro 500. */
function Ausente() {
  return null
}

// ---------------------------------------------------------------------------
// Tabela de faixas
// ---------------------------------------------------------------------------

function descreverIntervalo(faixa: Faixa): string {
  const de = faixa.limiteInferiorCentavos
  const ate = faixa.limiteSuperiorCentavos
  if (de === 0) return `Até ${formatarReal(ate ?? 0)}`
  if (ate === null) return `Acima de ${formatarReal(de - 1)}`
  return `De ${formatarReal(de)} a ${formatarReal(ate)}`
}

function TabelaDeFaixas({ parametroId, legenda }: { readonly parametroId: string; readonly legenda: string }) {
  const resolvida = registro.maisRecente(parametroId)
  if (!resolvida || resolvida.vigencia.valor.tipo !== 'tabela_faixas') return <Ausente />

  const faixas = resolvida.vigencia.valor.faixas
  const temParcela = faixas.some((f) => f.parcelaDeduzirCentavos !== undefined)

  return (
    <figure className="my-7">
      <figcaption className="text-sm text-[var(--color-text-muted)]">{legenda}</figcaption>
      {/* A tabela rola sozinha em tela estreita; a página nunca rola na
          horizontal (`10-ux-ui-spec` §5). */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{legenda}</caption>
          <thead className="bg-[var(--color-surface-tint)]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Faixa</th>
              <th scope="col" className="px-4 py-3 font-semibold">Alíquota</th>
              {temParcela ? (
                <th scope="col" className="px-4 py-3 font-semibold">Parcela a deduzir</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {faixas.map((faixa) => (
              <tr key={faixa.ordem} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-3">{descreverIntervalo(faixa)}</td>
                <td className="px-4 py-3 tabular-nums">
                  {faixa.aliquotaBp === 0 ? 'Isento' : formatarPercentual(faixa.aliquotaBp)}
                </td>
                {temParcela ? (
                  <td className="px-4 py-3 tabular-nums">
                    {faixa.parcelaDeduzirCentavos ? formatarReal(faixa.parcelaDeduzirCentavos) : '—'}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Procedencia resolvida={resolvida} />
    </figure>
  )
}

// ---------------------------------------------------------------------------
// Valor único
// ---------------------------------------------------------------------------

function ValorVigente({ parametroId, legenda }: { readonly parametroId: string; readonly legenda: string }) {
  const resolvida = registro.maisRecente(parametroId)
  if (!resolvida) return <Ausente />

  const valor = resolvida.vigencia.valor
  const exibicao =
    valor.tipo === 'valor_monetario'
      ? formatarReal(valor.centavos)
      : valor.tipo === 'percentual'
        ? formatarPercentual(valor.aliquotaBp)
        : valor.tipo === 'inteiro'
          ? String(valor.valor)
          : null

  if (exibicao === null) return <Ausente />

  return (
    <figure className="my-7 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-tint)] p-5">
      <figcaption className="text-sm text-[var(--color-text-muted)]">{legenda}</figcaption>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-navy)]">{exibicao}</p>
      <Procedencia resolvida={resolvida} />
    </figure>
  )
}

// ---------------------------------------------------------------------------
// Blocos
// ---------------------------------------------------------------------------

function Chamada({ slug, texto }: { readonly slug: string; readonly texto: string }) {
  const calculadora = porSlug(slug)
  if (!calculadora) return <Ausente />

  return (
    <aside className="my-7 rounded-xl border border-[var(--color-brand)] bg-[var(--color-brand-soft)] p-5">
      <p>{texto}</p>
      <Link
        href={`/calculadora/${calculadora.slug}`}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 font-medium text-white hover:bg-[var(--color-brand-hover)]"
      >
        Abrir a calculadora de {calculadora.nome.toLowerCase()} <IconeSeta />
      </Link>
    </aside>
  )
}

function RenderBloco({ bloco }: { readonly bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'paragrafo':
      return <p className="mt-4 leading-relaxed">{bloco.texto}</p>
    case 'lista':
      return (
        <ul className="mt-4 space-y-2">
          {bloco.itens.map((item) => (
            <li key={item} className="ml-5 list-disc leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )
    case 'destaque':
      return (
        <p className="my-6 border-l-4 border-[var(--color-brand)] bg-[var(--color-surface-tint)] px-5 py-4 font-medium">
          {bloco.texto}
        </p>
      )
    case 'tabelaDeFaixas':
      return <TabelaDeFaixas parametroId={bloco.parametroId} legenda={bloco.legenda} />
    case 'valorVigente':
      return <ValorVigente parametroId={bloco.parametroId} legenda={bloco.legenda} />
    case 'chamada':
      return <Chamada slug={bloco.slug} texto={bloco.texto} />
  }
}

// ---------------------------------------------------------------------------
// Guia
// ---------------------------------------------------------------------------

export function CorpoDoGuia({ guia }: { readonly guia: TipoGuia }) {
  return (
    <>
      {/* Sumário: além de útil em texto longo, cada âncora é um alvo que o
          buscador pode oferecer direto no resultado. */}
      <nav aria-label="Nesta página" className="mt-10 rounded-xl bg-[var(--color-surface-sunken)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Nesta página
        </h2>
        <ol className="mt-3 space-y-1.5">
          {guia.secoes.map((secao) => (
            <li key={secao.id}>
              <a href={`#${secao.id}`} className="text-[var(--color-brand)] hover:underline">
                {secao.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {guia.secoes.map((secao) => (
        <section key={secao.id} id={secao.id} className="mt-12 scroll-mt-20">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-navy)]">{secao.titulo}</h2>
          {secao.blocos.map((bloco, i) => (
            <RenderBloco key={`${secao.id}-${i}`} bloco={bloco} />
          ))}
        </section>
      ))}

      {/* RN-028: nunca linguagem prescritiva de direito. O aviso fecha o
          guia porque texto explicativo lido isoladamente é onde a confusão
          entre "explicação" e "orientação jurídica" mais acontece. */}
      <p className="mt-14 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-5 text-sm">
        Este guia é informativo e educacional. Descreve como o cálculo é feito com base nas normas
        citadas e não constitui aconselhamento jurídico, contábil ou financeiro. Situações
        específicas de contrato, convenção coletiva ou acordo individual podem alterar o resultado.
      </p>
    </>
  )
}
