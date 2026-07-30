import type { Metadata } from 'next'
import Link from 'next/link'

import { PaginaLegal } from '@/components/PaginaLegal'

export const metadata: Metadata = {
  title: 'Privacidade',
  description:
    'O que você digita nas calculadoras não sai do seu navegador. Não há cadastro, não há banco de dados e não guardamos dados de cálculo.',
  alternates: { canonical: '/privacidade' },
}

/**
 * `RF-010`, `RN-030`, `07-security` §11.
 *
 * O texto descreve o estado ATUAL do produto, não o planejado. Anúncio,
 * consentimento e análise de uso foram adiados por `ADR-008`; quando entrarem,
 * esta página muda no mesmo commit — política que descreve o que o site não faz
 * ainda é tão inútil quanto política que esconde o que ele faz.
 */
export default function Privacidade() {
  return (
    <PaginaLegal
      titulo="Privacidade"
      resumo="A resposta curta: o que você digita não sai do seu navegador."
    >
      <h2>O cálculo acontece no seu dispositivo</h2>
      <p>
        Salário, dependentes, datas e qualquer outro valor que você informe são processados
        inteiramente no seu navegador. Não existe endereço para onde esses dados sejam enviados,
        porque o cálculo não passa por servidor algum — as tabelas legais vêm junto com a página, e
        a conta é feita aí mesmo.
      </p>
      <p>
        Isso não é uma promessa de conduta: é uma propriedade da construção.{' '}
        <strong>Não há banco de dados neste site.</strong> Não existe lugar onde um dado de cálculo
        pudesse ser guardado, nem por engano.
      </p>

      <h2>Não há cadastro</h2>
      <p>
        Não pedimos nome, e-mail, telefone ou documento em nenhum ponto. Não existe conta, sessão
        nem login. Você não pode se identificar aqui, e isso é deliberado.
      </p>

      <h2>O link que você compartilha</h2>
      <p>
        Ao preencher uma calculadora, o endereço da página passa a conter os valores informados —
        é o que permite salvar ou enviar um cálculo sem precisar de conta. Como esse endereço
        carrega seus dados, ele:
      </p>
      <ul>
        <li>não é indexado por buscadores;</li>
        <li>não é transmitido a nenhum terceiro;</li>
        <li>
          deve ser compartilhado apenas com quem você quer que veja esses valores — o link contém o
          que você preencheu.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        Este site <strong>não usa cookies</strong> e não carrega script de terceiro. Não há
        publicidade, não há medição de audiência e não há rastreamento entre sessões.
      </p>
      <p>
        Quando a publicidade for introduzida, ela será precedida de pedido de consentimento, nada de
        terceiro carregará antes da sua decisão, e esta página será atualizada descrevendo
        exatamente o que passa a existir.
      </p>

      <h2>Registros do servidor</h2>
      <p>
        O servidor que entrega as páginas registra, como qualquer servidor web, o endereço IP, a
        página solicitada e o horário. Esses registros servem à operação e à segurança, ficam
        retidos por 30 dias e não são cruzados com nada — não há nada com que cruzá-los.
      </p>

      <h2>Seus direitos</h2>
      <p>
        A Lei Geral de Proteção de Dados assegura acesso, correção e eliminação dos seus dados
        pessoais. Como não há cadastro nem base de titulares, a maior parte desses pedidos já está
        atendida de antemão: não guardamos nada a que você pudesse pedir acesso.
      </p>
      <p>
        A portabilidade você já tem: o endereço do seu cálculo carrega o cenário completo e é
        copiável.
      </p>

      <p className="text-sm text-[var(--color-text-muted)]">
        Ver também o <Link href="/aviso-legal" className="text-[var(--color-brand)] underline">aviso legal</Link>{' '}
        e os <Link href="/termos" className="text-[var(--color-brand)] underline">termos de uso</Link>.
      </p>
    </PaginaLegal>
  )
}
