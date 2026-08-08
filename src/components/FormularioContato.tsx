'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { LIMITES, ROTULO_DO_MOTIVO, type MotivoDeContato } from '@/lib/contato/mensagem'

/**
 * Formulário de contato — `EP-017`.
 *
 * ## O QUE ELE NÃO FAZ, E É O PONTO
 *
 * **Não lê a URL, não lê o referenciador, não lê o `localStorage`.** A única
 * coisa que ele pode mandar sobre a origem é o `slug` da calculadora, recebido
 * como propriedade do servidor. `RF-006` põe salário e saldo de FGTS na query,
 * então "anexar a página de onde veio" — o reflexo natural de quem quer ajudar a
 * depurar — mandaria o holerite de quem escreveu.
 *
 * ## AS DUAS ARMADILHAS DE ROBÔ
 *
 * Um campo invisível que humano não preenche, e o tempo entre montar e enviar.
 * As duas moram aqui porque precisam do navegador; a decisão sobre elas é do
 * servidor, em `lib/contato/mensagem.ts`, que é onde dá para testar.
 *
 * O campo-armadilha usa `aria-hidden` e `tabIndex={-1}` além do posicionamento:
 * escondê-lo só com CSS o deixaria no caminho de quem navega por teclado ou
 * leitor de tela, e um teste de acessibilidade que passasse assim estaria
 * passando por cima de um usuário real.
 */

const CLASSE_ENTRADA =
  'mt-1 block w-full rounded border px-3 py-2 text-base bg-[var(--color-surface)] ' +
  'border-[var(--color-border)] focus:border-[var(--color-brand)]'

type Estado =
  | { readonly tipo: 'editando' }
  | { readonly tipo: 'enviando' }
  | { readonly tipo: 'enviada' }
  | { readonly tipo: 'erro'; readonly erros: readonly string[]; readonly indisponivel: boolean }

const MOTIVOS = Object.keys(ROTULO_DO_MOTIVO) as MotivoDeContato[]

export function FormularioContato({
  calculadora = '',
  enderecoDireto,
}: {
  readonly calculadora?: string
  readonly enderecoDireto: string
}) {
  const idMotivo = useId()
  const idMensagem = useId()
  const idEmail = useId()
  const idAjudaEmail = useId()
  const idErros = useId()

  /**
   * O instante da montagem, registrado em efeito e não na renderização.
   *
   * `useRef(Date.now())` chamaria uma função impura durante o render, o que o
   * compilador do React reprova com razão: renderização é idempotente, e um
   * valor que muda a cada passagem não pertence a ela.
   *
   * Zero até o efeito rodar significa "decorreu muito tempo", ou seja, a
   * armadilha falha para o lado de ACEITAR. É a direção certa: o custo de
   * deixar passar um robô é um e-mail; o de barrar uma pessoa é perder o relato
   * de um erro de cálculo, que é o que esta página existe para receber.
   */
  const montadoEm = useRef(0)
  useEffect(() => {
    montadoEm.current = Date.now()
  }, [])
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' })
  const [texto, setTexto] = useState('')

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (estado.tipo === 'enviando') return
    setEstado({ tipo: 'enviando' })

    const dados = new FormData(evento.currentTarget)
    try {
      const resposta = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          motivo: dados.get('motivo'),
          mensagem: dados.get('mensagem'),
          email: dados.get('email'),
          site: dados.get('site'),
          calculadora,
          decorridoMs: Date.now() - montadoEm.current,
        }),
      })
      const corpo = (await resposta.json()) as {
        ok?: boolean
        erros?: string[]
        indisponivel?: boolean
      }

      if (corpo.ok) {
        setEstado({ tipo: 'enviada' })
        return
      }
      setEstado({
        tipo: 'erro',
        erros: corpo.erros ?? ['Não foi possível enviar.'],
        indisponivel: corpo.indisponivel === true,
      })
    } catch {
      setEstado({
        tipo: 'erro',
        erros: ['Não foi possível falar com o servidor. Verifique sua conexão.'],
        indisponivel: true,
      })
    }
  }

  if (estado.tipo === 'enviada') {
    return (
      <div
        role="status"
        className="rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5"
      >
        <p className="font-medium text-[var(--color-text-primary)]">Mensagem enviada.</p>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Se você informou um e-mail, a resposta vai para lá. Relatos de erro em cálculo são os
          primeiros a serem lidos — e, quando procedem, viram correção com o caso de teste que
          impede a repetição.
        </p>
      </div>
    )
  }

  const falhou = estado.tipo === 'erro'

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <div>
        <label
          htmlFor={idMotivo}
          className="block text-sm font-medium text-[var(--color-text-primary)]"
        >
          Assunto
        </label>
        <select id={idMotivo} name="motivo" defaultValue="erro-de-calculo" className={CLASSE_ENTRADA}>
          {MOTIVOS.map((m) => (
            <option key={m} value={m}>
              {ROTULO_DO_MOTIVO[m]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={idMensagem}
          className="block text-sm font-medium text-[var(--color-text-primary)]"
        >
          Mensagem
        </label>
        <textarea
          id={idMensagem}
          name="mensagem"
          rows={7}
          required
          maxLength={LIMITES.mensagemMaxima}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-describedby={falhou ? idErros : undefined}
          aria-invalid={falhou ? true : undefined}
          className={CLASSE_ENTRADA}
          placeholder="Descreva o que aconteceu. Se for erro em um cálculo, diga qual calculadora, os dados que informou e o valor que esperava."
        />
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {texto.trim().length < LIMITES.mensagemMinima
            ? `Mínimo de ${LIMITES.mensagemMinima} caracteres.`
            : `${texto.length} de ${LIMITES.mensagemMaxima} caracteres.`}
        </p>
      </div>

      <div>
        <label
          htmlFor={idEmail}
          className="block text-sm font-medium text-[var(--color-text-primary)]"
        >
          Seu e-mail <span className="font-normal text-[var(--color-text-secondary)]">(opcional)</span>
        </label>
        <input
          id={idEmail}
          name="email"
          type="email"
          autoComplete="email"
          aria-describedby={idAjudaEmail}
          className={CLASSE_ENTRADA}
        />
        <p id={idAjudaEmail} className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Só serve para responder. Sem ele a mensagem chega do mesmo jeito — e você não se
          identifica de forma alguma.
        </p>
      </div>

      {/*
        CAMPO-ARMADILHA. Fora da tela, fora da tabulação e fora do leitor de
        tela: escondê-lo só com CSS o deixaria no caminho de quem navega por
        teclado, e o teste de acessibilidade que passasse assim estaria passando
        por cima de um usuário real.
      */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="site-contato">Não preencha este campo</label>
        <input id="site-contato" name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {falhou && (
        <div id={idErros} role="alert" className="text-sm text-[var(--color-negative)]">
          {estado.erros.map((e) => (
            <p key={e}>{e}</p>
          ))}
          {estado.indisponivel && (
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Você também pode escrever direto para{' '}
              <a className="underline" href={`mailto:${enderecoDireto}`}>
                {enderecoDireto}
              </a>
              .
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={estado.tipo === 'enviando'}
        className="min-h-[2.75rem] rounded bg-[var(--color-brand)] px-5 font-medium text-white disabled:opacity-60"
      >
        {estado.tipo === 'enviando' ? 'Enviando…' : 'Enviar mensagem'}
      </button>
    </form>
  )
}
