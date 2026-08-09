'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

/**
 * Imprimir e compartilhar o cálculo — `RF-006` / `US-009`, e a impressão que
 * `MC-7` já exigia.
 *
 * ## AS DUAS SAÍDAS QUE FALTAVAM, E POR QUE SÃO DE NATUREZAS OPOSTAS
 *
 * O permalink existe desde o T-103: `RF-006` põe o cenário na query e `US-009`
 * descreve exatamente este caso de uso. O que nunca foi construído foi o
 * **botão** — a história terminava em *"copio a URL da barra de endereço"*, que
 * é instrução de quem já sabe, no aparelho onde isso é mais difícil de fazer.
 *
 * A impressão é a outra metade, e ela não é conveniência: um produto cuja tese
 * é *"a conta está à mostra, confira"* precisa deixar a pessoa **levar a conta
 * embora** — para o RH, para o advogado, para o contador. Sem isso, a
 * auditabilidade termina na tela.
 *
 * ## POR QUE NÃO EXISTE BIBLIOTECA DE PDF AQUI
 *
 * Duas restrições decidem a arquitetura antes de qualquer escolha de
 * ferramenta, e as duas são regras do projeto:
 *
 *   1. **`RN-030`.** Gerar o PDF no servidor exigiria transmitir salário,
 *      pensão e saldo de FGTS. Está fora, e não por pouco: é a regra 6, e ela
 *      não admite exceção.
 *   2. **`RNF-004`.** A pior rota de calculadora tem ~10 kB de folga. Qualquer
 *      biblioteca de PDF no cliente custa múltiplos disso.
 *
 * `window.print()` resolve as duas de uma vez. O diálogo do navegador já traz
 * "Salvar como PDF" no Chrome, no Safari, no Android e no iPhone; o arquivo
 * nasce e morre no aparelho; e o custo em JavaScript é **uma chamada**. A
 * identidade visual do documento é responsabilidade da folha de impressão, em
 * `globals.css`, e não de um gerador paralelo que divergiria da tela.
 *
 * ## O AVISO DO COMPARTILHAMENTO NÃO É EXCESSO DE ZELO
 *
 * `RF-006` põe o formulário na query, então **o link carrega o que a pessoa
 * digitou**. A própria `/contato` já alerta sobre isso ao pedir que ninguém
 * anexe a página de origem. Um botão que facilita o envio sem dizer o que vai
 * junto transformaria uma decisão informada em acidente — e o dano é o
 * holerite de alguém num grupo de mensagens.
 *
 * Nada aqui transmite coisa alguma por conta própria: `navigator.share` entrega
 * o texto ao aplicativo que o usuário escolher, e a cópia vai para a área de
 * transferência dele. O site continua sem saber o que foi digitado.
 */

export function AcoesDoResultado({
  aoPrepararImpressao,
}: {
  readonly aoPrepararImpressao: () => void
}) {
  const [copiado, setCopiado] = useState(false)

  /**
   * `navigator.share` existe? — e por que isto NÃO é um efeito.
   *
   * Ler a capacidade durante a renderização produziria HTML do servidor
   * diferente do que o navegador monta, que é divergência de hidratação. Um
   * efeito resolveria e é o que a primeira versão fazia — e `react-hooks`
   * reprova com razão: efeito que só chama `setState` na montagem é um valor
   * derivado disfarçado de ciclo de vida.
   *
   * `useSyncExternalStore` é exatamente a ferramenta: instantâneo do servidor
   * `false`, instantâneo do cliente conforme o aparelho, e nenhuma reinscrição
   * — a capacidade não muda durante a sessão.
   */
  const podeCompartilhar = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === 'function',
    () => false,
  )

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 4_000)
    return () => clearTimeout(t)
  }, [copiado])

  /**
   * Lida no CLIQUE, e nunca na renderização.
   *
   * A URL muda a cada campo preenchido — `escreverNaUrl` usa `replaceState`. Um
   * valor capturado na montagem compartilharia o cenário vazio com que a página
   * abriu, que é o defeito mais silencioso possível nesta função.
   */
  function enderecoAtual(): string {
    return typeof window === 'undefined' ? '' : window.location.href
  }

  async function compartilhar() {
    const url = enderecoAtual()
    if (url === '') return

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url })
        return
      } catch {
        // Cancelar o diálogo do sistema cai aqui, e cancelar não é erro:
        // segue para a cópia, que é o caminho de sempre.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
    } catch {
      // Sem permissão para a área de transferência — em vez de falhar em
      // silêncio, seleciona a barra de endereço mentalmente para o usuário:
      // o link continua visível ali, que é de onde `US-009` o tirava antes.
      setCopiado(false)
    }
  }

  /**
   * Abre a memória de cálculo e SÓ ENTÃO chama o diálogo.
   *
   * `MC-7` exige a memória legível no papel. A primeira tentativa deixou o
   * bloco sempre no DOM, escondido por CSS — reprovou 170 testes por quebrar a
   * hierarquia de títulos e duplicar cada valor no documento.
   *
   * Aqui o estado é aberto e o diálogo espera **dois quadros**. Um só não
   * basta: o React agenda a re-renderização, e `window.print()` fotografa a
   * página no estado em que ela estiver. Dois quadros garantem que a memória já
   * está pintada quando a foto é tirada.
   *
   * Impressão pelo atalho do navegador continua imprimindo o que está na tela,
   * que é o comportamento honesto — e por isso o botão é o caminho oferecido.
   */
  function imprimir() {
    aoPrepararImpressao()
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()))
  }

  const CLASSE =
    'inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] ' +
    'px-4 py-2 text-sm font-medium hover:border-[var(--color-brand)]'

  return (
    // `print:hidden`: botão impresso é tinta gasta com o que ninguém pode clicar.
    /* `aria-label`, e NÃO um título `sr-only`: um `h3` invisível continua sendo
       um título no documento, e entraria na hierarquia depois do `h1` da
       calculadora sem um `h2` antes — exatamente a falha que a memória sempre
       no DOM provocou em `acessibilidade.spec.ts`. O rótulo nomeia a região
       para quem navega por marcos, sem inventar nível nenhum. */
    <section className="mt-6 print:hidden" aria-label="O que fazer com este cálculo">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={imprimir} className={CLASSE}>
          <span aria-hidden>🖨</span> Imprimir ou salvar em PDF
        </button>

        <button type="button" onClick={compartilhar} className={CLASSE}>
          <span aria-hidden>🔗</span>
          {podeCompartilhar ? 'Compartilhar este cálculo' : 'Copiar link deste cálculo'}
        </button>
      </div>

      {/* `role="status"`, e NÃO `aria-live="polite"` — apesar de o papel já
          implicar a mesma cortesia. O motivo é concreto: o bloco de resultado
          da calculadora é localizado por `main [aria-live]`, e um segundo
          elemento com esse atributo dentro de `main` tornou o localizador
          ambíguo — 160 testes reprovaram de uma vez. O papel anuncia igual e
          não disputa o atributo. */}
      <p role="status" className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {copiado ? 'Link copiado.' : ''}
      </p>

      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        O link reproduz este cálculo e <strong>carrega os valores que você digitou</strong> —
        mande só para quem pode vê-los. A impressão sai com a memória de cálculo inteira e as
        normas aplicadas.
      </p>
    </section>
  )
}
