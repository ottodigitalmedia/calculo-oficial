import type { Metadata } from 'next'
import Link from 'next/link'

import { PaginaLegal } from '@/components/PaginaLegal'

export const metadata: Metadata = {
  title: 'Termos de uso',
  description:
    'Condições de uso do Cálculo Oficial: natureza informativa, ausência de vínculo e limitação de responsabilidade.',
  alternates: { canonical: '/termos' },
}

/** `RF-010`, `03-functional-spec` §5. */
export default function Termos() {
  return (
    <PaginaLegal
      titulo="Termos de uso"
      resumo="Condições de uso, em linguagem que dá para ler."
    >
      <h2>Natureza do serviço</h2>
      <p>
        O Cálculo Oficial oferece calculadoras de uso livre e gratuito, de caráter informativo e
        educacional. Não há cadastro, cobrança, plano ou assinatura.
      </p>

      <h2>Ausência de vínculo</h2>
      <p>
        O uso deste site não cria relação de consultoria, assessoria ou representação. Não somos
        seu contador, seu advogado nem seu empregador, e nenhum resultado aqui produz efeito
        jurídico.
      </p>

      <h2>Sobre os parâmetros legais</h2>
      <p>
        As tabelas usadas são transcritas de fonte oficial, com norma, dispositivo e vigência
        declarados ao lado de cada valor, e são revisadas periodicamente. Ainda assim, normas mudam
        e transcrições podem conter erro. A fonte citada prevalece sobre o que este site mostra —
        e é por isso que o link para ela está sempre à mão.
      </p>

      <h2>Limitação de responsabilidade</h2>
      <p>
        Os resultados são estimativas calculadas a partir do que você informa. Decisões tomadas com
        base neles são de sua responsabilidade. Não respondemos por divergência entre a estimativa
        e o valor efetivamente pago ou devido, que depende de fatores que este site não conhece —
        convenções coletivas, cláusulas contratuais e ocorrências da folha, entre outros.
      </p>

      <h2>Disponibilidade</h2>
      <p>
        O serviço é oferecido no estado em que se encontra. Podemos alterar, suspender ou
        descontinuar calculadoras — inclusive por não conseguirmos mantê-las atualizadas, caso em
        que retirá-las é preferível a deixá-las no ar com dado velho.
      </p>

      <h2>Uso indevido</h2>
      <p>
        É vedado reproduzir o site de forma a induzir alguém a crer que se trata de serviço oficial
        de órgão público, ou apresentar seus resultados como documento com validade legal.
      </p>

      <p className="text-sm text-[var(--color-text-muted)]">
        Ver também o{' '}
        <Link href="/aviso-legal" className="text-[var(--color-brand)] underline">aviso legal</Link>{' '}
        e a{' '}
        <Link href="/privacidade" className="text-[var(--color-brand)] underline">política de privacidade</Link>.
      </p>
    </PaginaLegal>
  )
}
