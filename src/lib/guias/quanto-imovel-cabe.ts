/**
 * Guia — "Quanto imóvel cabe no seu bolso".
 *
 * Bloco de imóveis (§11.3). Cobre a capacidade de financiamento e o custo de
 * aquisição — o que separa o preço anunciado do dinheiro que a compra exige.
 *
 * Sem valor legal: comprometimento de renda é política de crédito, não norma.
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const QUANTO_IMOVEL_CABE: Guia = {
  slug: 'quanto-imovel-cabe',
  titulo: 'Quanto imóvel cabe no seu bolso',
  subtitulo:
    'O banco aprova pela renda; o orçamento aprova pelo que sobra. Os dois números raramente coincidem.',
  descricaoSeo:
    'Como se calcula a capacidade de financiamento de um imóvel, por que o valor aprovado pelo banco não é o valor que cabe no seu orçamento, e o que a entrada precisa cobrir além do preço.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['capacidade-de-financiamento', 'custo-de-aquisicao-de-imovel', 'financiamento-imobiliario'],

  secoes: [
    {
      id: 'dois-limites',
      titulo: 'Existem dois limites, e eles não são o mesmo',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O primeiro limite é o do banco: ele fixa uma fração da renda que a prestação pode ocupar e, a partir dela, calcula o maior financiamento que aprova. É um critério de risco do credor, não uma recomendação de orçamento.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'O segundo é o seu: quanto sobra por mês depois de tudo o que já existe, incluindo o que a compra vai acrescentar. Quem usa o primeiro como se fosse o segundo assume a maior prestação que consegue, e descobre o resto depois.',
        },
        {
          tipo: 'destaque',
          texto:
            'A aprovação do banco responde "quanto você consegue pagar sem quebrar". O orçamento responde "quanto você consegue pagar sem parar de viver".',
        },
        {
          tipo: 'chamada',
          slug: 'capacidade-de-financiamento',
          texto:
            'A calculadora mostra o valor de imóvel compatível com a renda e com a entrada informadas.',
        },
      ],
    },

    {
      id: 'a-entrada',
      titulo: 'A entrada precisa cobrir mais que a entrada',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O financiamento cobre uma parte do valor do imóvel; o resto sai do bolso. Só que a compra exige dinheiro além dessa diferença, e é aí que muita negociação trava na última semana.',
        },
        {
          tipo: 'lista',
          itens: [
            'O imposto de transmissão, cobrado pelo município sobre a operação.',
            'O registro em cartório, sem o qual o imóvel não passa a ser seu.',
            'A avaliação do bem e as tarifas do contrato de financiamento.',
            'A mudança, a reforma inicial e a mobília — que não são taxa, mas são despesa certa.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Esses custos somam uma parcela relevante do valor do imóvel e, em regra, não podem ser financiados. Quem calcula a entrada olhando apenas a diferença entre preço e financiamento chega ao fechamento sem o dinheiro do cartório.',
        },
        {
          tipo: 'chamada',
          slug: 'custo-de-aquisicao-de-imovel',
          texto: 'A calculadora soma os custos de aquisição a partir do valor do imóvel.',
        },
      ],
    },

    {
      id: 'a-prestacao-nao-e-so-juros',
      titulo: 'A prestação não é só juros e amortização',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A parcela do financiamento imobiliário traz, além das duas partes que todo mundo espera, os seguros obrigatórios e a taxa de administração. Eles não são grandes isoladamente, mas atravessam o contrato inteiro.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'E depois da parcela vem o custo de ser dono: condomínio, imposto anual sobre a propriedade e manutenção. Nenhum deles aparece na simulação do financiamento, e todos aparecem no extrato.',
        },
        {
          tipo: 'lista',
          itens: [
            'Some à prestação o condomínio e o imposto anual dividido por doze.',
            'Reserve algo por mês para manutenção — o valor não é fixo, mas a despesa é certa.',
            'Compare esse total, e não a prestação, com o que sobra no seu orçamento.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'financiamento-imobiliario',
          texto:
            'A calculadora de financiamento monta a parcela completa, com seguros e taxa de administração.',
        },
      ],
    },

    {
      id: 'prazo-e-entrada',
      titulo: 'Prazo longo e entrada pequena cobram caro depois',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Esticar o prazo derruba a prestação e aumenta bastante o total pago, porque o saldo devedor rende juros por mais tempo. Entrada maior faz o contrário: reduz o saldo financiado e o custo do contrato inteiro.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Isso não significa que prazo curto seja sempre melhor. Significa que a escolha do prazo é uma decisão de custo, e não apenas de caber na parcela — e que quem escolhe o prazo mais longo deve considerar amortizar depois, quando o orçamento permitir.',
        },
        {
          tipo: 'chamada',
          slug: 'amortizacao-extra',
          texto:
            'A calculadora de amortização extra mostra quanto cada aporte antecipado economiza.',
        },
      ],
    },
  ],
}
