'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Google Tag Manager e GA4 — `INT-005`, revisto pelo mantenedor em 07/08/2026.
 *
 * ## O QUE FOI DECIDIDO, E CONTRA O QUE
 *
 * A versão anterior de `INT-005` dizia *"análise de uso autohospedada, sempre,
 * sem cookie"*, e `07-security` §176 afirmava *"a análise de uso não usa
 * cookie"*. O mantenedor optou por GTM e GA4 sabendo disso, e as duas linhas
 * foram corrigidas em vez de deixadas mentindo — a lição de §7.41 aplicada a
 * documento em vez de a código.
 *
 * ## O QUE NÃO MUDA, E É A RAZÃO DESTE ARQUIVO EXISTIR
 *
 * **`RN-030` continua inviolável: nenhum valor digitado sai do navegador.** E
 * aqui isso não é retórica — `RF-006` escreve o estado do formulário na query,
 * então `location.search` DE FATO contém o salário de quem está usando o site.
 * Um GA4 padrão envia `page_location` com a URL inteira. Ligá-lo sem cuidado
 * exportaria salário, pensão e saldo de FGTS para o Google, em toda navegação.
 *
 * Por isso a sanitização mora **aqui, no código, antes de o contêiner carregar**,
 * e não numa caixa de texto do painel:
 *
 *   1. `page_location` e `page_path` entram no `dataLayer` já sem query,
 *      montados a partir de `pathname`;
 *   2. `page_referrer` entra reduzido à origem, pela mesma razão — o `Referer`
 *      já foi vetor de vazamento real neste projeto, no T-107;
 *   3. `url_passthrough` desligado, para o próprio Google não recolar
 *      parâmetros;
 *   4. o consentimento entra **concedido por omissão** (Consent Mode v2) —
 *      revisto pelo mantenedor em 14/08/2026, ver abaixo.
 *
 * ## O CONSENTIMENTO CONCEDIDO POR OMISSÃO — DECISÃO DE 14/08/2026
 *
 * Até aqui este arquivo negava tudo por omissão, esperando uma plataforma de
 * consentimento (`INT-002`) que nunca foi construída. O efeito medido em
 * produção em 14/08/2026: o hit saía com `gcs=G100`, isto é, **ping sem
 * cookie** — que o GA4 recebe e **não reporta** como usuário nem sessão, porque
 * a modelagem comportamental exige limiares de tráfego que um site recém-lançado
 * não atinge. Quinze dias no ar, zero visita no relatório, com a coleta
 * funcionando o tempo todo.
 *
 * O mantenedor determinou liberar a medição por omissão. A base é o legítimo
 * interesse de medição de audiência da LGPD, que não exige coleta prévia de
 * consentimento como o RGPD europeu exige.
 *
 * **O que isso muda:** o GA4 passa a gravar cookie de primeira parte e a contar
 * usuário e sessão de verdade.
 *
 * **O que isso NÃO muda, e é a razão de este arquivo continuar existindo:**
 * `RN-030` segue inviolável. A sanitização abaixo é independente do
 * consentimento — `page_location` continua sendo montado sem query, e
 * `page_referrer` continua reduzido à origem. Consentimento decide se há
 * cookie; ele nunca decidiu, e não decide agora, o que vai dentro do hit.
 * Nenhum valor digitado sai do navegador em nenhum dos dois estados.
 *
 * `url_passthrough` **continua desligado** de propósito: ele repassa parâmetro
 * de clique pela URL entre páginas, e com cookie liberado é redundante. Ligá-lo
 * seria devolver ao Google a chance de recolar parâmetro na query — que é onde
 * `RF-006` guarda o salário.
 *
 * ## O LIMITE HONESTO DESTA IMPLEMENTAÇÃO
 *
 * **O que o contêiner faz com esses valores é configurado fora daqui.** Um GTM
 * pode injetar qualquer script, e nenhum teste deste repositório consegue
 * provar o que ele carregará amanhã. A varredura de `tests/leak` continua
 * cobrando que NADA saia com marcador — e ela só alcança o que este código
 * envia, mais o que o contêiner enviar durante a execução do teste.
 *
 * A etiqueta do GA4 no painel precisa usar as variáveis de `dataLayer` acima em
 * vez de `Page URL`. Se alguém apontar a etiqueta para a URL da página, a
 * sanitização daqui é contornada — e o site volta a exportar salário sem que
 * nada neste repositório mude. Está registrado em `07-security` §4.3.
 *
 * ## SEM IDENTIFICADOR, NADA CARREGA
 *
 * Ausente a variável de ambiente, este componente não renderiza nada e o site
 * segue com zero terceiros. Não é conveniência de teste: é `RNF-007` — o
 * produto funciona integralmente com toda integração bloqueada — e é o que
 * mantém o ambiente de desenvolvimento e o de teste livres do contêiner.
 */

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? ''

/** `AAAA-1234567` ou `GTM-XXXXXXX`. Recusa qualquer outra coisa. */
const FORMATO_DE_CONTAINER = /^GTM-[A-Z0-9]{6,9}$/

interface JanelaComDataLayer extends Window {
  dataLayer?: unknown[]
}

/**
 * A localização **sem query**, que é a única forma que pode ser reportada.
 *
 * `07-security` C-04 já exigia isto quando a análise era autohospedada, e a
 * exigência não mudou de dono ao mudar de ferramenta.
 */
function localizacaoSegura(pathname: string): { location: string; path: string } {
  const origem = typeof window === 'undefined' ? '' : window.location.origin
  return { location: `${origem}${pathname}`, path: pathname }
}

/** O referenciador reduzido à origem — nunca o caminho, nunca a query. */
function referenciadorSeguro(): string {
  if (typeof document === 'undefined' || document.referrer === '') return ''
  try {
    return new URL(document.referrer).origin
  } catch {
    return ''
  }
}

function empurrar(evento: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  const janela = window as JanelaComDataLayer
  janela.dataLayer = janela.dataLayer ?? []
  janela.dataLayer.push(evento)
}

export function Medicao() {
  const pathname = usePathname()
  const habilitado = FORMATO_DE_CONTAINER.test(GTM_ID)

  /**
   * A visualização de página é enviada por nós, a cada troca de ROTA.
   *
   * Não a cada mudança de query: a query muda a cada tecla digitada
   * (`replaceState`), e reportá-la seria tanto ruído quanto vazamento. Trocar de
   * calculadora troca o `pathname`, que é o que interessa medir.
   */
  useEffect(() => {
    if (!habilitado) return
    const { location, path } = localizacaoSegura(pathname)
    empurrar({
      event: 'pagina_vista',
      page_location: location,
      page_path: path,
      page_referrer: referenciadorSeguro(),
    })
  }, [pathname, habilitado])

  if (!habilitado) return null

  return (
    <>
      {/*
        UM SCRIPT SÓ, E ISSO NÃO É ECONOMIA — É A GARANTIA DE ORDEM.

        A declaração de consentimento precisa estar no `dataLayer` ANTES de
        qualquer etiqueta rodar; depois já não adianta. A primeira versão usava
        dois blocos, um `beforeInteractive` e outro `afterInteractive`, e
        dependia de o carregador respeitar a ordem entre eles — suposição que o
        próprio verificador do Next apontou.

        Num bloco único a ordem é sequência de instruções, e não promessa de
        ferramenta. O contêiner é a última linha, depois de o consentimento e a
        sanitização já estarem postos.
      */}
      <Script id="medicao-gtm" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          /*
            CONCEDIDO POR OMISSÃO — decisão do mantenedor em 14/08/2026.

            "wait_for_update" saiu junto, e a saída é o ponto: ele mandava o
            gtag segurar os hits por 500 ms esperando uma atualização de
            consentimento vinda de uma plataforma que não existe. Sem nada a
            esperar, esperar é só atrasar a primeira medição da visita — que é
            exatamente a que mais se perde, porque o visitante pode sair antes.
          */
          gtag('consent', 'default', {
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
            analytics_storage: 'granted',
            functionality_storage: 'granted',
            personalization_storage: 'granted',
            security_storage: 'granted'
          });
          gtag('set', 'url_passthrough', false);
          gtag('set', 'ads_data_redaction', false);

          /*
            A SANITIZAÇÃO QUE NÃO DEPENDE DO PAINEL.

            Medido em 07/08/2026, lendo o contêiner publicado: a etiqueta do GA4
            saiu como um "__googtag" pelado, só com o identificador de medição e
            sem sobrescrita nenhuma de parâmetro. Assim, ela usa
            "document.location" — que neste site carrega salário, pensão e saldo
            de FGTS, porque RF-006 põe o formulário na query.

            A versão anterior deste arquivo empurrava os valores limpos para o
            dataLayer e CONFIAVA que a etiqueta fosse lê-los. Duas falhas nisso:
            a etiqueta dispara em "gtm.init", antes deste empurrão, e ler o
            dataLayer exige configuração no painel que ninguém garante.

            "gtag('set', ...)" resolve as duas: entra na fila ANTES de o
            contêiner subir, e o gtag.js aplica os parâmetros a todo evento
            seguinte, independentemente do que o painel diga. É a diferença
            entre uma promessa e um mecanismo.
          */
          gtag('set', {
            page_location: location.origin + location.pathname,
            page_referrer: (function () {
              try {
                return document.referrer ? new URL(document.referrer).origin : '';
              } catch (e) {
                return '';
              }
            })()
          });

          (function(w,d,s,l,i){w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>

      {/*
        O `noscript` do GTM é deliberadamente OMITIDO.
        Ele é um iframe que dispara com a URL da página — com query, portanto com
        salário — e não há como sanitizá-lo, porque não há JavaScript para
        interceptá-lo. Medir quem navega sem JavaScript não vale exportar dado de
        formulário, e este site calcula no cliente: sem JavaScript não há o que
        medir de qualquer modo.
      */}
    </>
  )
}
