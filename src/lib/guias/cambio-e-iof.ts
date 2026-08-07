/**
 * Guia — "Câmbio: por que a cotação do noticiário não é a sua".
 *
 * Bloco de índices e câmbio (§11.3).
 *
 * **O IOF é campo do usuário, não parâmetro** — e a razão está em
 * `ESTADO-DO-PROJETO` §7.33: a alíquota estava em alteração e a fonte oficial
 * não resolvia. O guia explica o mecanismo sem citar o número, que é
 * exatamente o que G-1 pede.
 */

import type { Guia } from './tipos'

export const CAMBIO_E_IOF: Guia = {
  slug: 'cambio-e-iof',
  titulo: 'Câmbio: por que a cotação do noticiário não é a sua',
  subtitulo:
    'Entre o dólar que aparece na tela e o que sai da sua conta há três camadas — e nenhuma delas é pequena.',
  descricaoSeo:
    'A diferença entre a cotação comercial e a que você paga: spread, IOF e a variação conforme a forma de pagamento — cartão, espécie ou transferência.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['conversor-de-moeda', 'custo-de-viagem'],

  secoes: [
    {
      id: 'tres-camadas',
      titulo: 'Três camadas entre a cotação e o seu extrato',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A cotação divulgada é a do mercado entre instituições financeiras — um preço de atacado. Quem compra moeda no varejo paga sobre ele três acréscimos, e só o último aparece com nome próprio na fatura.',
        },
        {
          tipo: 'lista',
          itens: [
            'O spread: a diferença entre a cotação de mercado e a que a casa de câmbio ou o banco pratica.',
            'A tarifa de serviço, quando houver, cobrada por operação.',
            'O tributo sobre operações de câmbio, cuja alíquota varia conforme a finalidade da operação.',
          ],
        },
        {
          tipo: 'destaque',
          texto:
            'O spread costuma ser a maior das três camadas, e é a única que não vem discriminada — ela já está embutida na cotação oferecida.',
        },
      ],
    },

    {
      id: 'a-forma-de-pagar',
      titulo: 'A forma de pagar muda o custo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A mesma compra sai por valores diferentes conforme o meio utilizado, e a diferença não é pequena. Vale conferir a alíquota aplicável a cada finalidade antes de decidir, porque ela muda com alguma frequência.',
        },
        {
          tipo: 'lista',
          itens: [
            'Cartão de crédito internacional: a conversão ocorre na data do fechamento da fatura, não na da compra.',
            'Cartão pré-pago em moeda estrangeira: a conversão ocorre na recarga, e trava o custo antecipadamente.',
            'Espécie: exige planejamento e traz risco de portar dinheiro.',
            'Transferência internacional: costuma ter tarifa própria, além do spread.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A escolha entre travar a cotação e deixá-la flutuar é uma aposta sobre o câmbio futuro, e não há resposta certa. O que dá para decidir com informação é o custo conhecido: spread, tarifa e tributo.',
        },
        {
          tipo: 'chamada',
          slug: 'conversor-de-moeda',
          texto:
            'A calculadora converte com o spread e a alíquota que você informar, e mostra o custo total.',
        },
      ],
    },

    {
      id: 'por-que-o-campo',
      titulo: 'Por que a alíquota é campo, e não valor fixo aqui',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A alíquota do tributo sobre câmbio muda por ato do Executivo e varia conforme a finalidade da operação. Fixá-la numa calculadora significaria exibir, com aparência de certeza, um número que pode ter mudado ontem.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Por isso ela é informada por quem calcula, com orientação de onde encontrá-la. É o mesmo critério aplicado em todo este site: quando a fonte oficial não resolve com segurança, o campo é de quem tem o dado — e o motivo fica escrito.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-de-viagem',
          texto:
            'Para uma viagem, vale somar o câmbio ao restante do custo — a calculadora de viagem faz a parte de estrada.',
        },
      ],
    },
  ],
}
