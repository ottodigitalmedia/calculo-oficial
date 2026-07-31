'use client'

import { useId } from 'react'

import { formatarReal, formatarTaxa } from '@/lib/format/moeda'
import type { Campo } from '@/lib/calculadoras/tipos'

/**
 * Campos de formulário — `10-ux-ui-spec` §3, `03-functional-spec` §1.3 e §1.4.
 *
 * As mensagens de validação são as do documento, **literais**: ele declara que
 * todo texto entre aspas ali é microcopy final.
 */

interface Props {
  readonly campo: Campo
  readonly valor: number | string
  readonly erro?: string
  readonly onChange: (valor: number | string) => void
}

function Rotulo({ id, campo }: { id: string; campo: Campo }) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)]">
      {campo.rotulo}
      {/* O asterisco é MARCA VISUAL, não informação: `aria-hidden` impede que
          o leitor de tela anuncie "Prazo asterisco". A obrigatoriedade é
          transmitida por `aria-required` no próprio campo — que é o que os
          leitores anunciam como "obrigatório". */}
      {campo.obrigatorio ? (
        <span aria-hidden className="text-[var(--color-negative)]">
          {' '}
          *
        </span>
      ) : null}
    </label>
  )
}

function Mensagem({ id, erro, ajuda }: { id: string; erro?: string; ajuda?: string }) {
  if (erro) {
    return (
      // Vinculado ao campo por aria-describedby e anunciado ao surgir (§6).
      <p id={id} role="alert" className="mt-1 text-sm text-[var(--color-negative)]">
        {erro}
      </p>
    )
  }
  if (ajuda) {
    return (
      <p id={id} className="mt-1 text-sm text-[var(--color-text-secondary)]">
        {ajuda}
      </p>
    )
  }
  return null
}

const CLASSE_ENTRADA =
  'mt-1 block w-full rounded border px-3 py-2 text-base bg-[var(--color-surface)] ' +
  'border-[var(--color-border)] focus:border-[var(--color-brand)]'

export function CampoFormulario({ campo, valor, erro, onChange }: Props) {
  const id = useId()
  const idMensagem = `${id}-msg`

  if (campo.tipo === 'selecao') {
    return (
      <div>
        <Rotulo id={id} campo={campo} />
        <select
          id={id}
          value={String(valor)}
          aria-describedby={idMensagem}
          aria-invalid={erro ? true : undefined}
          aria-required={campo.obrigatorio ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={CLASSE_ENTRADA}
        >
          {campo.opcoes?.map((o) => (
            <option key={o.valor} value={o.valor} disabled={o.indisponivel}>
              {o.rotulo}
              {o.indisponivel ? ' — Em breve' : ''}
            </option>
          ))}
        </select>
        <Mensagem id={idMensagem} {...(erro ? { erro } : {})} {...(campo.ajuda ? { ajuda: campo.ajuda } : {})} />
      </div>
    )
  }

  if (campo.tipo === 'inteiro') {
    return (
      <div>
        <Rotulo id={id} campo={campo} />
        <input
          id={id}
          type="text"
          // Teclado numérico no celular, sem as setas do type=number que
          // permitem alterar o valor por engano ao rolar a página.
          inputMode="numeric"
          value={valor === 0 ? '0' : String(valor)}
          aria-describedby={idMensagem}
          aria-invalid={erro ? true : undefined}
          aria-required={campo.obrigatorio ? true : undefined}
          onChange={(e) => {
            const so = e.target.value.replace(/\D/g, '')
            onChange(so === '' ? 0 : Number(so))
          }}
          className={CLASSE_ENTRADA}
        />
        <Mensagem id={idMensagem} {...(erro ? { erro } : {})} {...(campo.ajuda ? { ajuda: campo.ajuda } : {})} />
      </div>
    )
  }

  if (campo.tipo === 'percentual') {
    // Valor interno em BASIS POINTS inteiros (`ADR-004` A-2), pela mesma razão
    // do monetário: nunca existe um momento em que a taxa vive como decimal.
    const bp = typeof valor === 'number' ? valor : 0
    return (
      <div>
        <Rotulo id={id} campo={campo} />
        <div className="relative">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={bp === 0 ? '' : formatarTaxa(bp)}
            placeholder="0,00"
            aria-describedby={idMensagem}
            aria-invalid={erro ? true : undefined}
            aria-required={campo.obrigatorio ? true : undefined}
            onChange={(e) => {
              const digitos = e.target.value.replace(/\D/g, '')
              onChange(digitos === '' ? 0 : Number(digitos))
            }}
            className={`${CLASSE_ENTRADA} tabular pr-9 text-right`}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          >
            %
          </span>
        </div>
        <Mensagem id={idMensagem} {...(erro ? { erro } : {})} {...(campo.ajuda ? { ajuda: campo.ajuda } : {})} />
      </div>
    )
  }

  // Monetário. O valor interno é sempre CENTAVOS inteiros (`RN-005`): o que o
  // usuário digita é interpretado como centavos e formatado de volta, então
  // não existe momento em que o valor vive como decimal.
  const centavos = typeof valor === 'number' ? valor : 0
  return (
    <div>
      <Rotulo id={id} campo={campo} />
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={centavos === 0 ? '' : formatarReal(centavos)}
        placeholder="R$ 0,00"
        aria-describedby={idMensagem}
        aria-invalid={erro ? true : undefined}
        aria-required={campo.obrigatorio ? true : undefined}
        onChange={(e) => {
          const digitos = e.target.value.replace(/\D/g, '')
          onChange(digitos === '' ? 0 : Number(digitos))
        }}
        className={`${CLASSE_ENTRADA} tabular text-right`}
      />
      <Mensagem id={idMensagem} {...(erro ? { erro } : {})} {...(campo.ajuda ? { ajuda: campo.ajuda } : {})} />
    </div>
  )
}

/** Mensagens de validação — texto final de `03-functional-spec` §1.4. */
export function validar(campo: Campo, valor: number | string): string | undefined {
  if (campo.tipo === 'selecao') return undefined
  const n = typeof valor === 'number' ? valor : 0

  if (campo.obrigatorio && n === 0) return 'Preencha este campo para ver o resultado.'
  if (n < 0) return 'Informe um valor igual ou maior que zero.'
  if (campo.maximo !== undefined && n > campo.maximo) {
    if (campo.tipo === 'monetario') return `Informe um valor de até ${formatarReal(campo.maximo)}.`
    if (campo.tipo === 'percentual') return `Informe uma taxa de até ${formatarTaxa(campo.maximo)}%.`
    return `Informe um número entre ${campo.minimo ?? 0} e ${campo.maximo}.`
  }
  return undefined
}
