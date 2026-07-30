import type { Metadata } from 'next'

import { PaginaLegal } from '@/components/PaginaLegal'

export const metadata: Metadata = {
  title: 'Aviso legal',
  description:
    'O Cálculo Oficial é ferramenta informativa. Os resultados são estimativas e não constituem aconselhamento jurídico, contábil ou financeiro.',
  alternates: { canonical: '/aviso-legal' },
}

/**
 * `RF-010` e `RN-028`. O texto principal abaixo é o de `03-functional-spec`
 * §5, **literal** — o documento declara que todo texto entre aspas ali é
 * microcopy final.
 */
export default function AvisoLegal() {
  return (
    <PaginaLegal
      titulo="Aviso legal"
      resumo="O que este site é, o que ele não é, e o que fazer com o número que ele mostra."
    >
      <p className="rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-5">
        O Cálculo Oficial é uma ferramenta informativa e educacional. Os resultados são estimativas
        produzidas a partir dos dados que você informa e dos parâmetros legais vigentes no período
        selecionado. Não constituem aconselhamento jurídico, contábil ou financeiro, nem substituem
        a orientação de um profissional habilitado. Para decisões que envolvam direitos, contratos
        ou dinheiro, procure um profissional.
      </p>

      <h2>Sobre o nome</h2>
      <p>
        &quot;Oficial&quot; no nome se refere à origem dos parâmetros: toda tabela usada aqui é
        transcrita de fonte oficial, com a norma e a vigência declaradas ao lado de cada valor.{' '}
        <strong>
          Este site não é órgão público, não tem vínculo com o governo e não emite documento com
          validade oficial.
        </strong>{' '}
        O cálculo que vale é o do seu empregador, no holerite, ou o da autoridade competente.
      </p>

      <h2>O que o cálculo considera</h2>
      <p>
        Apenas os dados que você digita e os parâmetros legais de aplicação nacional vigentes no
        período escolhido. A memória de cálculo mostra, etapa por etapa, quais foram usados e onde
        estão publicados.
      </p>

      <h2>O que ele não considera</h2>
      <ul>
        <li>Convenções e acordos coletivos da sua categoria</li>
        <li>Cláusulas próprias do seu contrato de trabalho</li>
        <li>Adiantamentos, faltas, atrasos e outras ocorrências da folha</li>
        <li>Verbas variáveis que dependem de registro que este site não vê</li>
        <li>Tributos e taxas municipais ou estaduais</li>
      </ul>
      <p>
        Por isso o resultado é sempre apresentado como <strong>estimativa</strong>, e nunca como
        valor devido.
      </p>

      <h2>Se você encontrar uma divergência</h2>
      <p>
        Um parâmetro incorreto publicado aqui é o erro mais grave que este site pode cometer, e o
        único que causa dano real. Se um valor não bater com a fonte oficial citada, avise: a
        correção é publicada e registrada no histórico de mudanças, com o que estava errado, desde
        quando, e quais calculadoras foram afetadas.
      </p>
    </PaginaLegal>
  )
}
