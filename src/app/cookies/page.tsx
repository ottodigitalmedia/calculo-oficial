import type { Metadata } from 'next'
import Link from 'next/link'

import { PaginaLegal } from '@/components/PaginaLegal'

export const metadata: Metadata = {
  title: 'Cookies',
  description:
    'O Cálculo Oficial usa medição de audiência. Os valores que você digita nas calculadoras não são enviados junto.',
  alternates: { canonical: '/cookies' },
}

/**
 * `RF-010`. A página descreve o estado ATUAL, e por isso foi reescrita em
 * 14/08/2026.
 *
 * O texto anterior dizia "não grava cookies · não carrega script de terceiro ·
 * não há medição de audiência". Três afirmações, e as três deixaram de ser
 * verdade em datas diferentes: o GTM e o GA4 entraram em 07/08/2026, e o cookie
 * passou a ser gravado em 14/08/2026, quando o consentimento foi liberado por
 * omissão (`components/Medicao.tsx` registra a decisão e a base legal).
 *
 * Página legal que descreve um estado que o produto abandonou é pior que página
 * ausente: ela nega por escrito um tratamento em curso. Num produto cuja tese é
 * a auditabilidade, é a contradição mais cara possível.
 */
export default function Cookies() {
  return (
    <PaginaLegal titulo="Cookies" resumo="Usamos, para medir audiência — e não para ler o que você digita.">
      <h2>O que existe hoje</h2>
      <p>
        Este site usa o <strong>Google Analytics</strong>, carregado pelo Google Tag Manager, para
        medir audiência: quantas pessoas chegam, por quais páginas e de onde vieram. Para distinguir
        uma visita nova de um retorno, ele grava <strong>cookies próprios deste domínio</strong>{' '}
        (com nomes iniciados por <code>_ga</code>).
      </p>
      <p>
        <strong>Não há publicidade neste site hoje</strong>, e nenhuma rede de anúncio está
        carregada.
      </p>

      <h2>O que não é enviado — e por que isso não é uma promessa</h2>
      <p>
        Quando você preenche uma calculadora, os valores aparecem no endereço da página. É o que
        permite salvar e compartilhar um cálculo sem cadastro — e seria também o caminho mais fácil
        para esses valores escaparem numa ferramenta de medição, porque o padrão dessas ferramentas
        é reportar o endereço inteiro.
      </p>
      <p>
        Aqui o endereço é <strong>limpo antes</strong> de a medição carregar: o que sai é o caminho
        da página, nunca os valores. O mesmo vale para o site de onde você veio, reduzido ao domínio.
        Isso está no código que monta a página, não numa configuração de painel — e há testes
        automáticos que reprovam a publicação se essa limpeza for desfeita.
      </p>

      <h2>Por que não há banner</h2>
      <p>
        A medição de audiência é feita com base no <strong>legítimo interesse</strong> previsto na
        Lei Geral de Proteção de Dados, e não em consentimento. É uma medição de público, não de
        pessoa: não há cadastro, não há perfil, e nada do que você calcula é associado a você.
      </p>

      <h2>Como recusar</h2>
      <ul>
        <li>
          bloqueando cookies deste site nas configurações do seu navegador, ou navegando em janela
          anônima;
        </li>
        <li>
          instalando o complemento oficial de desativação do Google Analytics, disponível para os
          principais navegadores;
        </li>
        <li>
          usando qualquer bloqueador de rastreadores — <strong>o site funciona por inteiro</strong>{' '}
          com a medição bloqueada, porque o cálculo acontece no seu dispositivo.
        </li>
      </ul>

      <h2>Se a publicidade entrar</h2>
      <p>
        A publicidade está prevista como forma de sustentar o projeto, e ainda não existe. Quando
        entrar, esta página será atualizada no mesmo momento, descrevendo o que passa a existir e
        como recusar.
      </p>

      <p className="text-sm text-[var(--color-text-muted)]">
        Detalhes sobre o tratamento de dados na{' '}
        <Link href="/privacidade" className="text-[var(--color-brand)] underline">política de privacidade</Link>.
      </p>
    </PaginaLegal>
  )
}
