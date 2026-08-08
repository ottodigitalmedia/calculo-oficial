import Link from 'next/link'

import { Logotipo } from '@/components/Marca'
import { CALCULADORAS } from '@/lib/calculadoras'
import { GUIAS } from '@/lib/guias'

/**
 * Rodapé — `03-functional-spec` §5.
 *
 * Sem captura de e-mail, ao contrário da referência: newsletter está fora de
 * escopo (`01-prd` §6) e coletar e-mail criaria tratamento de dado pessoal
 * onde hoje não existe nenhum.
 *
 * Todo link daqui leva `inline-block py-1`: sem isso o alvo de toque fica com
 * 19 px de altura, abaixo dos 24 px que WCAG 2.2 (2.5.8) exige. A exceção de
 * "alvo em linha" não vale — estes links são itens de lista de navegação, não
 * palavras dentro de uma frase.
 *
 * **As listas vêm dos registros, não são escritas aqui.** Até o T-105 este
 * arquivo trazia INSS, Imposto de Renda e juros compostos marcados "em breve"
 * — as três já publicadas no T-104. É a desonestia que a home cometeu ao
 * contrário: esconder o que existe, em vez de prometer o que não existe.
 * Derivar do registro remove a possibilidade de a divergência voltar.
 *
 * **Mas derivar tudo escala mal, e escalou mal.** Com quatro calculadoras a
 * lista completa cabia; com setenta e quatro o rodapé virou uma parede de
 * links em toda página do site.
 *
 * O corte é **na exibição, não na fonte**: as listas continuam vindo dos
 * registros, e os números nas chamadas são `.length`, não constantes escritas
 * aqui. Se fossem escritos, envelheceriam — que é o defeito que este arquivo
 * inteiro existe para não repetir.
 *
 * **E o corte vale para as DUAS listas.** A primeira versão desta correção
 * encolheu só as calculadoras e deixou os dez guias inteiros, o que resolvia
 * metade do problema e deixava a outra metade crescendo pelo mesmo caminho:
 * guia novo, rodapé mais alto, em toda página. Um limite que se aplica a uma
 * lista e não à irmã dela não é limite, é adiamento.
 */

/**
 * Quantos itens por coluna. Exibição, não conteúdo.
 *
 * Quatro porque é o que mantém o rodapé na altura da coluna "Legal", que tem
 * quatro links fixos — nenhuma coluna puxa a altura sozinha, e o rodapé para
 * de crescer quando o catálogo cresce.
 */
const NO_RODAPE = 4
const LEGAIS = [
  { href: '/contato', rotulo: 'Contato' },
  { href: '/aviso-legal', rotulo: 'Aviso legal' },
  { href: '/privacidade', rotulo: 'Privacidade' },
  { href: '/termos', rotulo: 'Termos de uso' },
  { href: '/cookies', rotulo: 'Cookies' },
]

export function Rodape() {
  return (
    <footer className="mt-20 bg-[var(--color-navy)] text-[var(--color-text-inverse)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logotipo claro />
          <p className="mt-3 max-w-xs text-sm opacity-75">
            Calculadoras trabalhistas, tributárias e financeiras com a conta à mostra. Gratuito,
            sem cadastro.
          </p>
          <p className="mt-3 text-sm opacity-75">
            <Link href="/#como-funciona" className="inline-block py-1 hover:underline">
              Como funciona
            </Link>
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Calculadoras</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-75">
            {CALCULADORAS.slice(0, NO_RODAPE).map((c) => (
              <li key={c.slug}>
                <Link href={`/calculadora/${c.slug}`} className="inline-block py-1 hover:underline">
                  {c.nome}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#calculadoras" className="inline-block py-1 font-medium hover:underline">
                Ver todas as {CALCULADORAS.length} calculadoras
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Guias</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-75">
            {GUIAS.slice(0, NO_RODAPE).map((g) => (
              <li key={g.slug}>
                <Link href={`/guia/${g.slug}`} className="inline-block py-1 hover:underline">
                  {g.titulo}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/guias" className="inline-block py-1 font-medium hover:underline">
                Ver todos os {GUIAS.length} guias
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm opacity-75">
            {LEGAIS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-block py-1 hover:underline">
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-6 text-sm opacity-60">
          Ferramenta informativa e educacional. Os resultados são estimativas e não constituem
          aconselhamento jurídico, contábil ou financeiro.
        </p>
      </div>
    </footer>
  )
}
