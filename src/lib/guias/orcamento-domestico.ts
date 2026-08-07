/**
 * Guia — "Orçamento 50/30/20: uma régua, não uma lei".
 *
 * Bloco de casa e consumo (§11.3).
 *
 * NENHUM VALOR LEGAL NA PROSA (G-1) — e aqui não há norma nenhuma: a proporção
 * é convenção de educação financeira, não regra jurídica. O guia diz isso,
 * porque tratá-la como regra é o erro mais comum sobre ela.
 */

import type { Guia } from './tipos'

export const ORCAMENTO_DOMESTICO: Guia = {
  slug: 'orcamento-domestico',
  titulo: 'Orçamento 50/30/20: uma régua, não uma lei',
  subtitulo:
    'A proporção serve para diagnosticar, não para julgar — e o diagnóstico costuma ser mais útil que a meta.',
  descricaoSeo:
    'Como usar a divisão do orçamento doméstico em necessidades, escolhas e futuro, o que entra em cada grupo, e por que ela é ponto de partida e não regra a cumprir.',
  atualizadoEm: '2026-08-07',
  calculadoras: ['orcamento-domestico', 'plano-de-quitacao', 'reserva-de-emergencia'],

  secoes: [
    {
      id: 'os-tres-grupos',
      titulo: 'Os três grupos',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A régua divide a renda líquida em três destinos: o que é necessário, o que é escolha e o que constrói futuro. A utilidade dela está menos nas proporções e mais em obrigar a classificar cada despesa.',
        },
        {
          tipo: 'lista',
          itens: [
            'Necessidades: moradia, alimentação básica, transporte para o trabalho, saúde, contas da casa.',
            'Escolhas: lazer, restaurante, assinatura, viagem — o que melhora a vida sem ser indispensável.',
            'Futuro: investimento, reserva de emergência e amortização de dívida acima do mínimo.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A classificação é onde o exercício ensina. Muita despesa que entra automaticamente em "necessidade" é, olhando de perto, uma escolha — e reconhecer isso é o que abre espaço no orçamento.',
        },
        {
          tipo: 'chamada',
          slug: 'orcamento-domestico',
          texto: 'A calculadora distribui a renda informada e mostra a distância para a régua.',
        },
      ],
    },

    {
      id: 'nao-e-lei',
      titulo: 'Por que ela não é uma lei',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'A proporção nasceu como material didático, não como norma. Ela pressupõe uma realidade — renda estável, moradia proporcional, ausência de dívida cara — que não é a de todo mundo.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Para quem tem renda baixa, as necessidades ocupam naturalmente mais que a metade, e cobrar a régua nesse caso transforma diagnóstico em culpa. Para quem tem renda alta, ela permite folga onde caberia poupar bem mais.',
        },
        {
          tipo: 'destaque',
          texto:
            'A régua serve para mostrar onde você está, não para dizer que você está errado.',
        },
      ],
    },

    {
      id: 'a-ordem-das-prioridades',
      titulo: 'A ordem que costuma funcionar',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Quando o terceiro grupo é pequeno ou inexistente, há uma ordem que resolve mais rápido do que tentar cumprir a proporção de imediato.',
        },
        {
          tipo: 'lista',
          itens: [
            'Primeiro, sair do crédito caro: rotativo e cheque especial consomem mais do que qualquer aplicação rende.',
            'Depois, formar a reserva de emergência — sem ela, todo imprevisto vira dívida nova.',
            'Só então investir com objetivo de prazo mais longo.',
          ],
        },
        {
          tipo: 'chamada',
          slug: 'plano-de-quitacao',
          texto: 'Com dívidas, a calculadora de plano de quitação mostra por onde começar.',
        },
        {
          tipo: 'chamada',
          slug: 'reserva-de-emergencia',
          texto: 'E a de reserva de emergência dimensiona quanto guardar antes de investir.',
        },
      ],
    },
  ],
}
