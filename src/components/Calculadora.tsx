'use client'

import { useDeferredValue, useMemo, useState } from 'react'

import { CampoFormulario, validar } from '@/components/campos'
import { MemoriaCalculo } from '@/components/MemoriaCalculo'
import { porSlug } from '@/lib/calculadoras'
import type { SaidaCalculadora, ValoresFormulario } from '@/lib/calculadoras/tipos'
import type { Resultado } from '@/lib/engine/traco'
import { formatarData, formatarReal } from '@/lib/format/moeda'
import { INSS } from '@/lib/params/data/inss'
import { IRRF } from '@/lib/params/data/irrf'
import { construirRegistro } from '@/lib/params/registry'

/**
 * A página genérica de calculadora — `ADR-008` E-1.
 *
 * Renderiza **qualquer** definição que satisfaça o contrato de
 * `calculadoras/tipos.ts`. Adicionar uma calculadora não passa por aqui.
 *
 * Estados de `03-functional-spec` §1.5, com os textos literais do documento.
 */

const registro = construirRegistro(INSS, IRRF)

type Estado =
  | { readonly tipo: 'vazio' }
  | { readonly tipo: 'pendente'; readonly faltando: readonly string[] }
  | { readonly tipo: 'calculado'; readonly resultado: Resultado<SaidaCalculadora> }

export function Calculadora({ slug }: { readonly slug: string }) {
  const definicao = porSlug(slug)

  const cobertura = useMemo(
    () => (definicao ? registro.coberturaCombinada(definicao.parametrosRequeridos) : null),
    [definicao],
  )

  const anos = useMemo(
    () => (definicao ? registro.anosDisponiveis(definicao.parametrosRequeridos) : []),
    [definicao],
  )

  /**
   * Abre no ano mais recente que sabemos calcular.
   *
   * Nunca `hoje`: o motor não lê relógio (`C-M2`), e se hoje estivesse fora da
   * cobertura a calculadora abriria bloqueada — correto, porém inútil.
   *
   * Derivado de `anosDisponiveis`, e não do fim da cobertura. Usar o fim da
   * cobertura era um DEFEITO: com a vigência mais recente aberta, `fim` é nulo,
   * o seletor listava só o primeiro ano e a data efetiva era outra — a tela
   * dizia 2025 e a memória citava parâmetros de 2026.
   */
  const dataInicial = anos.length > 0 ? `${anos[0]}-06-15` : '2026-01-01'

  const [dataReferencia, setDataReferencia] = useState(dataInicial)
  const [valores, setValores] = useState<ValoresFormulario>(() =>
    Object.fromEntries((definicao?.campos ?? []).map((c) => [c.id, c.padrao ?? (c.tipo === 'selecao' ? '' : 0)])),
  )

  const camposVisiveis = useMemo(
    () => (definicao?.campos ?? []).filter((c) => c.visivelSe?.(valores) ?? true),
    [definicao, valores],
  )

  const erros = useMemo(() => {
    const m = new Map<string, string>()
    for (const campo of camposVisiveis) {
      // Campo obrigatório vazio não é "erro de digitação": é estado pendente.
      if (campo.obrigatorio && (valores[campo.id] ?? 0) === 0) continue
      const e = validar(campo, valores[campo.id] ?? 0)
      if (e) m.set(campo.id, e)
    }
    return m
  }, [camposVisiveis, valores])

  /**
   * O estado é DERIVADO, não guardado.
   *
   * `03-functional-spec` §1.2 pede 300ms de espera após a última tecla. O
   * propósito ali é não recalcular a cada tecla — preocupação de cálculo caro
   * ou com rede. Aqui o cálculo é puro e roda em microssegundos (`RNF-005`
   * pede ≤50ms e decorre da arquitetura, não de otimização).
   *
   * O que a espera ainda protege é a região dinâmica: sem ela, o leitor de
   * tela anunciaria um resultado novo a cada dígito. `useDeferredValue` resolve
   * isso sem efeito e sem estado duplicado — e estado duplicado é como um
   * resultado velho fica na tela ao lado de um formulário novo.
   */
  const valoresAdiados = useDeferredValue(valores)
  const dataAdiada = useDeferredValue(dataReferencia)

  const estado: Estado = useMemo(() => {
    if (!definicao) return { tipo: 'vazio' }

    const faltando = camposVisiveis
      .filter((c) => c.obrigatorio && (valoresAdiados[c.id] ?? 0) === 0)
      .map((c) => c.rotulo)

    if (faltando.length > 0) {
      const tudoVazio = Object.values(valoresAdiados).every((v) => v === 0 || v === '')
      return tudoVazio ? { tipo: 'vazio' } : { tipo: 'pendente', faltando }
    }
    // §1.2: entrada inválida limpa o resultado anterior. Como o estado é
    // derivado, isso acontece por construção — não há resultado velho a limpar.
    if (erros.size > 0) return { tipo: 'pendente', faltando: [] }

    return { tipo: 'calculado', resultado: definicao.calcular(valoresAdiados, dataAdiada, registro) }
  }, [definicao, valoresAdiados, dataAdiada, camposVisiveis, erros])

  if (!definicao) return null

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ---------------------------------------------------------------- */}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Calculadora sem parâmetro legal não tem período a escolher — é o
            caso de juros compostos, cuja taxa é digitada. */}
        <div className={anos.length > 0 ? '' : 'hidden'}>
          <label htmlFor="ref" className="block text-sm font-medium">
            Período de referência
          </label>
          <select
            id="ref"
            value={dataReferencia}
            onChange={(e) => setDataReferencia(e.target.value)}
            className="mt-1 block w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base"
          >
            {anos.map((a) => (
              <option key={a} value={`${a}-06-15`}>
                {a}
              </option>
            ))}
          </select>
          {cobertura ? (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Temos os parâmetros legais de {formatarData(cobertura.inicio)}
              {cobertura.fim ? ` a ${formatarData(cobertura.fim)}` : ' em diante'}.
            </p>
          ) : null}
        </div>

        {camposVisiveis.map((campo) => (
          <CampoFormulario
            key={campo.id}
            campo={campo}
            valor={valores[campo.id] ?? 0}
            {...(erros.get(campo.id) ? { erro: erros.get(campo.id) as string } : {})}
            onChange={(v) => setValores((atual) => ({ ...atual, [campo.id]: v }))}
          />
        ))}
      </form>

      {/* ---------------------------------------------------------------- */}
      {/* Região dinâmica cortês: anuncia o resultado sem interromper quem
          está digitando (§6). */}
      <div aria-live="polite" aria-atomic="false">
        <Resultado
          estado={estado}
          rotulo={definicao.rotuloResultado}
          dataReferencia={dataReferencia}
          {...(definicao.avisoAdicional ? { avisoAdicional: definicao.avisoAdicional } : {})}
        />
      </div>
    </div>
  )
}

function Resultado({
  estado,
  rotulo,
  dataReferencia,
  avisoAdicional,
}: {
  readonly estado: Estado
  readonly rotulo: string
  readonly dataReferencia: string
  readonly avisoAdicional?: string
}) {
  // Altura mínima reservada: nenhum estado empurra o que está abaixo
  // (`RNF-002`, regra transversal de §5).
  const caixa =
    'min-h-56 rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5'

  if (estado.tipo === 'vazio') {
    return (
      <div className={caixa}>
        <p className="text-[var(--color-text-secondary)]">
          Preencha os campos ao lado para ver o resultado.
        </p>
      </div>
    )
  }

  if (estado.tipo === 'pendente') {
    return (
      <div className={caixa}>
        <p className="text-[var(--color-text-secondary)]">
          {estado.faltando.length > 0
            ? `Falta preencher: ${estado.faltando.join(', ')}.`
            : 'Corrija os campos destacados para ver o resultado.'}
        </p>
      </div>
    )
  }

  const r = estado.resultado

  if (!r.ok) {
    return (
      <div className={caixa}>
        <p className="font-medium text-[var(--color-negative)]">Não foi possível calcular</p>
        <p className="mt-2 text-[var(--color-text-secondary)]">{r.detalhe}</p>
      </div>
    )
  }

  return (
    <div>
      <div className={caixa}>
        <p className="text-sm text-[var(--color-text-secondary)]">{rotulo}</p>
        {/* O maior elemento da página: o resultado é o herói (princípio 1). */}
        <p className="tabular mt-1 text-4xl font-semibold tracking-tight">
          {formatarReal(r.valores.principal)}
        </p>

        <dl className="mt-5 space-y-2 border-t border-[var(--color-border)] pt-4">
          {r.valores.detalhamento.map((linha) => (
            <div key={linha.rotulo} className="flex items-baseline justify-between gap-4">
              <dt className="text-sm">{linha.rotulo}</dt>
              {/* Sinal E rótulo distinguem crédito de débito, não só cor —
                  cor sozinha exclui quem não a percebe (§2.1). */}
              <dd
                className={`tabular text-sm ${
                  linha.sinal === 'debito'
                    ? 'text-[var(--color-negative)]'
                    : linha.sinal === 'credito'
                      ? 'text-[var(--color-positive)]'
                      : 'font-semibold'
                }`}
              >
                {linha.sinal === 'debito' ? '− ' : linha.sinal === 'credito' ? '+ ' : ''}
                {formatarReal(linha.valor)}
              </dd>
            </div>
          ))}
        </dl>

        {/* RN-028: aviso de estimativa na MESMA dobra do resultado. */}
        <p className="mt-5 rounded border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-3 text-sm">
          Estimativa com base nos dados informados e nos parâmetros legais vigentes em{' '}
          {formatarData(dataReferencia)}. O valor final pode variar conforme acordos, convenções
          coletivas e particularidades do seu contrato.
          {avisoAdicional ? ` ${avisoAdicional}` : ''}
        </p>

        {r.valores.destaques && r.valores.destaques.length > 0 ? (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--color-border)] pt-4">
            {r.valores.destaques.map((d) => (
              <div key={d.rotulo} className="text-sm">
                <dt className="inline text-[var(--color-text-muted)]">{d.rotulo}: </dt>
                <dd className="tabular inline font-semibold">{d.valor}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {r.valores.notas?.map((nota) => (
          <p key={nota} className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {nota}
          </p>
        ))}
      </div>

      {r.valores.tabela ? (
        <section className="mt-6 overflow-x-auto rounded border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <caption className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-4 py-3 text-left font-semibold">
              {r.valores.tabela.titulo}
            </caption>
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  Período
                </th>
                {r.valores.tabela.colunas.map((c) => (
                  <th key={c} scope="col" className="px-4 py-2 text-right font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.valores.tabela.linhas.map((linha) => (
                <tr key={linha.rotulo} className="border-b border-[var(--color-border)] last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    {linha.rotulo}
                  </th>
                  {linha.valores.map((v, i) => (
                    <td key={i} className="tabular px-4 py-2 text-right">
                      {formatarReal(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <MemoriaCalculo traco={r.traco} />
    </div>
  )
}
