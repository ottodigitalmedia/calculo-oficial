'use client'

import { useState } from 'react'

import { formatarPeriodo, formatarReal } from '@/lib/format/moeda'
import type { Traco } from '@/lib/engine/traco'

/**
 * A memória de cálculo — `10-ux-ui-spec` §4.
 *
 * **É o produto, não um detalhe dele.** Regras MC-1 a MC-8:
 *
 *   MC-1  etapas numeradas em ordem, sem agrupamento que esconda passo
 *   MC-2  fórmula com os valores já substituídos, não algébrica
 *   MC-3  toda etapa com parâmetro legal exibe vigência e fonte
 *   MC-4  valores em monoespaçada, alinhados à direita
 *   MC-5  nenhum anúncio aqui dentro, em nenhuma circunstância
 *   MC-6  expandir não recalcula: o traço já está em memória
 *   MC-7  legível impressa ou capturada, sem depender de interação
 *   MC-8  valores idênticos aos do detalhamento
 */

export function MemoriaCalculo({ traco }: { readonly traco: Traco }) {
  const [aberta, setAberta] = useState(false)

  // Parâmetro E fundamento: numa rescisão, metade das normas aplicadas decide
  // incidência e não tem valor numérico. Listar só as do parâmetro deixaria o
  // rodapé omitindo justamente as que o leitor mais desconfia.
  const normas = [
    ...new Set(
      traco.etapas
        .flatMap((e) => [e.parametro?.norma, e.fundamento?.norma])
        .filter((n): n is string => typeof n === 'string'),
    ),
  ]

  return (
    <section className="mt-6">
      {/* Acionador de largura total, com afordância clara. Não é um link
          discreto; é um convite (§4). */}
      <button
        type="button"
        onClick={() => setAberta((a) => !a)}
        aria-expanded={aberta}
        aria-controls="memoria-de-calculo"
        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-4 py-3 text-left text-base font-medium hover:border-[var(--color-brand)]"
      >
        {aberta ? 'Recolher memória de cálculo' : 'Ver como este valor foi calculado'}
        <span aria-hidden className="float-right text-[var(--color-text-secondary)]">
          {aberta ? '−' : '+'}
        </span>
      </button>

      {aberta ? (
        <div
          id="memoria-de-calculo"
          className="mt-2 rounded border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-4"
        >
          <h3 className="text-lg font-semibold">Como chegamos a este valor</h3>

          {/* MC-1: lista ORDENADA, para que leitor de tela anuncie a sequência. */}
          <ol className="mt-4 space-y-4">
            {traco.etapas.map((etapa, i) => (
              <li
                key={`${etapa.rotulo}-${i}`}
                className="border-t border-[var(--color-border)] pt-3 first:border-t-0 first:pt-0"
              >
                <p className="font-medium">
                  {i + 1}. {etapa.rotulo}
                </p>

                {/* MC-2: valores já substituídos. */}
                <p className="tabular mt-1 text-sm text-[var(--color-text-secondary)]">
                  {etapa.formula}
                </p>

                {etapa.justificativa ? (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {etapa.justificativa}
                  </p>
                ) : null}

                {/* MC-3: vigência e fonte, sempre que houver parâmetro legal. */}
                {etapa.parametro ? (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Parâmetro: {etapa.parametro.nome} ·{' '}
                    {formatarPeriodo(etapa.parametro.vigenciaInicio, etapa.parametro.vigenciaFim)}
                    <br />
                    Fonte:{' '}
                    <a
                      href={etapa.parametro.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-brand)] underline"
                    >
                      {etapa.parametro.norma}
                      {etapa.parametro.dispositivo ? `, ${etapa.parametro.dispositivo}` : ''}
                    </a>{' '}
                    <span aria-hidden>↗</span>
                  </p>
                ) : null}

                {/* MC-3, para regra normativa sem valor próprio — decisão de
                    incidência. Sem isto a memória diria "não incide" sem dizer
                    por quê, que é o oposto do que o produto se propõe. */}
                {etapa.fundamento ? (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Fundamento:{' '}
                    <a
                      href={etapa.fundamento.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-brand)] underline"
                    >
                      {etapa.fundamento.norma}
                      {etapa.fundamento.dispositivo ? `, ${etapa.fundamento.dispositivo}` : ''}
                    </a>{' '}
                    <span aria-hidden>↗</span>
                  </p>
                ) : null}

                {/* MC-4: monoespaçada, à direita. */}
                <p className="tabular mt-1 text-right font-medium">
                  = {formatarReal(etapa.resultado)}
                </p>
              </li>
            ))}
          </ol>

          {normas.length > 0 ? (
            <p className="mt-4 border-t border-[var(--color-border)] pt-3 text-sm text-[var(--color-text-secondary)]">
              Fontes: {normas.join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
