import type { Metadata } from 'next'
import Link from 'next/link'

import { FormularioContato } from '@/components/FormularioContato'
import { PaginaLegal } from '@/components/PaginaLegal'

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'Fale com o Cálculo Oficial: aponte um erro em um cálculo, trate de assunto comercial ou envie qualquer outra mensagem.',
  alternates: { canonical: '/contato' },
}

/**
 * Canal de contato — decidido pelo mantenedor em 07/08/2026.
 *
 * **O relato de erro em cálculo é o motivo de esta página existir.** Os outros
 * assuntos pegam carona. Um site cuja tese é "a conta está à mostra para você
 * conferir" precisa de um lugar para onde mandar a conferência quando ela não
 * fecha — sem isso, a promessa de auditabilidade termina no botão de expandir a
 * memória.
 *
 * O endereço direto aparece **junto** do formulário, e não escondido: quem
 * prefere o próprio programa de e-mail não deveria ter que preencher campo
 * nenhum, e é ele que também atende quando o envio está fora do ar.
 */
/**
 * Trocado em 08/08/2026, por decisão do mantenedor: era um endereço de Gmail,
 * passou a ser o do domínio próprio.
 *
 * **Ele aparece na tela, e não é o mesmo que recebe o formulário.** Quem recebe
 * é `CONTATO_DESTINO`, variável de ambiente lida em `api/contato`. Os dois
 * podem divergir sem que nada quebre — e é por isso que a troca de um pede a
 * conferência do outro no painel.
 */
const ENDERECO = 'contato@ottodigitalmedia.com'

export default function Contato() {
  return (
    <PaginaLegal
      titulo="Contato"
      resumo="Achou um erro em um cálculo? É a mensagem que mais nos interessa receber."
    >
      <h2>Erro em um cálculo</h2>
      <p>
        Este site existe para que a conta possa ser conferida. Se você conferiu e o número não
        fecha, queremos saber — e o relato mais útil traz três coisas: <strong>qual
        calculadora</strong>, <strong>os dados que você informou</strong> e <strong>o valor que
        você esperava</strong>, de preferência com a fonte em que se baseou.
      </p>
      <p>
        Quando o relato procede, a correção vem acompanhada de um caso de teste que impede o erro
        de voltar, e a mudança fica registrada no{' '}
        <Link href="/aviso-legal">histórico do projeto</Link>.
      </p>

      <h2>O que enviar não é preciso</h2>
      <p>
        <strong>Não peça para anexar a página em que você estava.</strong> O endereço de uma
        calculadora preenchida carrega os valores que você digitou — salário, pensão, saldo de
        FGTS. O formulário abaixo não lê a URL, não lê de onde você veio e não tem campo para
        isso, de propósito. Descreva os números na mensagem, se quiser, e mande só o que você
        escolher mandar.
      </p>

      <h2>Assunto comercial e demais</h2>
      <p>
        Propostas, parcerias e qualquer outro assunto usam o mesmo formulário — é só escolher no
        campo de assunto.
      </p>

      <h2>Prefere e-mail direto?</h2>
      <p>
        Escreva para{' '}
        <a className="underline" href={`mailto:${ENDERECO}`}>
          {ENDERECO}
        </a>
        . Não é preciso usar o formulário.
      </p>

      <h2>O que acontece com a sua mensagem</h2>
      <ul>
        <li>ela é enviada por e-mail e não fica guardada neste site;</li>
        <li>o e-mail é opcional e serve só para responder;</li>
        <li>não pedimos nome, telefone nem documento;</li>
        <li>
          não registramos seu endereço de rede junto da mensagem — ver{' '}
          <Link href="/privacidade">a página de privacidade</Link>.
        </li>
      </ul>

      <div className="mt-10 rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 md:p-6">
        <FormularioContato enderecoDireto={ENDERECO} />
      </div>
    </PaginaLegal>
  )
}
