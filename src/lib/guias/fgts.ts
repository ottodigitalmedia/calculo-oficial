/**
 * Guia — "FGTS: depósitos, multa e o que é saldo real"
 * (`03-functional-spec` §4). Ligado a CALC-007.
 *
 * A parte que o guia não pode errar é a **base da indenização**: o art. 18,
 * § 1º, da Lei nº 8.036/1990 fala em todos os depósitos realizados na conta
 * vinculada, atualizados monetariamente e acrescidos de juros — e não no saldo
 * que está lá no dia da saída. Quem sacou antes vê os dois números divergirem.
 *
 * NENHUM VALOR LEGAL NA PROSA (`ADR-009` G-1).
 */

import type { Guia } from './tipos'

export const FGTS_GUIA: Guia = {
  slug: 'fgts-deposito-multa-e-saldo',
  titulo: 'FGTS: depósitos, multa e o que é saldo real',
  subtitulo:
    'O depósito não sai do seu salário, e a indenização da dispensa não incide sobre o saldo que aparece hoje no extrato.',
  descricaoSeo:
    'Como o depósito mensal do FGTS é formado, por que ele não reduz o salário líquido, sobre o que incide a multa rescisória e por que a estimativa fica abaixo do saldo real do extrato.',
  atualizadoEm: '2026-08-06',
  calculadoras: ['fgts', 'rescisao-sem-justa-causa', 'rescisao-acordo-mutuo'],

  secoes: [
    {
      id: 'nao-sai-do-salario',
      titulo: 'O depósito não sai do seu salário',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O valor do FGTS aparece informado no holerite e por isso é lido, com frequência, como mais um desconto. Não é: o depósito é obrigação do empregador, calculado sobre a remuneração e recolhido em conta vinculada no nome do trabalhador.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'fgts-aliquota-deposito',
          legenda: 'Depósito mensal do empregador, calculado sobre a remuneração do trabalhador.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'Somar esse valor aos descontos do holerite é um dos motivos mais comuns de a conta feita em casa não fechar com o líquido recebido.',
        },
        {
          tipo: 'destaque',
          texto:
            'A gratificação natalina entra na base do depósito. Por isso o ano tem treze depósitos, e não doze.',
        },
      ],
    },

    {
      id: 'o-saldo-estimado',
      titulo: 'Saldo estimado e saldo real não são a mesma coisa',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Uma estimativa de saldo parte do salário informado e do tempo de contrato. O saldo real do extrato é outra coisa, e quase sempre maior, por três razões:',
        },
        {
          tipo: 'lista',
          itens: [
            'Os depósitos são atualizados monetariamente e rendem juros desde a data de cada um.',
            'O salário mudou ao longo do contrato, e cada depósito foi feito sobre a remuneração daquele mês.',
            'Faltas, afastamentos e saques anteriores alteram a conta, e nenhuma estimativa tem como conhecê-los.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'A estimativa serve para conferir a ordem de grandeza — se o extrato estiver muito distante dela, vale investigar recolhimento em atraso ou ausente. Ela não substitui o extrato.',
        },
        {
          tipo: 'chamada',
          slug: 'fgts',
          texto:
            'A calculadora deixa esse limite declarado no próprio resultado, e permite incluir ou não a gratificação na base.',
        },
      ],
    },

    {
      id: 'a-multa',
      titulo: 'A indenização da dispensa, e sobre o que ela incide',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'Na dispensa sem justa causa o empregador paga uma indenização calculada sobre os depósitos do contrato. Ela é paga ao trabalhador junto do acerto, e não sai da conta vinculada.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'fgts-multa-sem-justa-causa',
          legenda: 'Indenização na dispensa sem justa causa, sobre o montante dos depósitos.',
        },
        {
          tipo: 'destaque',
          texto:
            'A base é o total dos depósitos do contrato, atualizado — não o saldo que está na conta no dia da saída. Quem sacou antes tem saldo menor e base intacta.',
        },
        {
          tipo: 'paragrafo',
          texto:
            'É a origem da divergência mais comum sobre este tema: a pessoa aderiu ao saque-aniversário, viu o saldo cair, e concluiu que a indenização cairia junto. Ela não cai — o que muda é o que resta para sacar.',
        },
      ],
    },

    {
      id: 'os-tres-caminhos-de-saida',
      titulo: 'O que muda conforme o motivo da saída',
      blocos: [
        {
          tipo: 'paragrafo',
          texto:
            'O motivo do desligamento decide duas coisas: se há indenização e quanto da conta pode ser movimentado.',
        },
        {
          tipo: 'lista',
          itens: [
            'Dispensa sem justa causa: indenização integral e liberação do saldo para saque.',
            'Acordo entre as partes: indenização pela metade e movimentação parcial da conta, sem seguro-desemprego.',
            'Pedido de demissão: sem indenização e sem liberação do saldo pela regra geral.',
          ],
        },
        {
          tipo: 'valorVigente',
          parametroId: 'fgts-multa-acordo-mutuo',
          legenda: 'Indenização na extinção por acordo entre as partes.',
        },
        {
          tipo: 'valorVigente',
          parametroId: 'fgts-saque-acordo-mutuo',
          legenda: 'Parte do saldo que pode ser movimentada na extinção por acordo.',
        },
        {
          tipo: 'chamada',
          slug: 'rescisao-acordo-mutuo',
          texto:
            'A calculadora de acordo mútuo aplica as duas frações e mostra o saque disponível ao lado do acerto.',
        },
      ],
    },

    {
      id: 'o-que-a-conta-nao-alcanca',
      titulo: 'O que esta conta não alcança',
      blocos: [
        {
          tipo: 'lista',
          itens: [
            'As hipóteses de saque fora do desligamento, que seguem requisitos próprios.',
            'A adesão ao saque-aniversário e o efeito dela sobre o que resta disponível na dispensa.',
            'Contratos regidos por estatuto próprio, como o do trabalhador doméstico, cuja indenização tem norma distinta.',
            'Recolhimentos em atraso ou não realizados, que só o extrato revela.',
          ],
        },
        {
          tipo: 'paragrafo',
          texto:
            'Para o valor exato da indenização, o caminho é informar o saldo do extrato na calculadora de rescisão — assim a base parte do número real, e não da estimativa.',
        },
        {
          tipo: 'chamada',
          slug: 'rescisao-sem-justa-causa',
          texto:
            'Na calculadora de rescisão há campo para o saldo informado, e a memória mostra a base usada na indenização.',
        },
      ],
    },
  ],
}
