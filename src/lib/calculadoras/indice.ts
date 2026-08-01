/**
 * Índice leve do catálogo — só o que a busca da home precisa exibir.
 *
 * **Por que um segundo arquivo.** `index.ts` importa as quatro definições, e
 * cada definição importa o motor e, por ele, as tabelas legais. A busca da home
 * é componente de cliente: importar dali fazia a página inicial baixar o motor
 * de cálculo inteiro e os parâmetros de INSS e IRRF para filtrar uma lista de
 * quatro nomes. Eram 11 kB comprimidos gastos em nada, com `RNF-004` medindo
 * 1,8 kB de folga na rota vizinha.
 *
 * **O risco que isso cria, e como ele é contido.** Duas listas do mesmo
 * conjunto divergem — foi o que aconteceu com o rodapé, que ficou anunciando
 * "em breve" três calculadoras já publicadas. Aqui a divergência é impossível
 * de passar: `tests/unit/catalogo.test.ts` compara este índice com as
 * definições campo a campo e falha se um nome, um slug ou uma linha de contexto
 * sair de sincronia.
 *
 * Não é a solução mais elegante — a elegante seria a definição separar
 * metadado de cálculo. É a que custa um arquivo e um teste, em vez de refazer
 * o molde.
 */

export interface ItemDoCatalogo {
  readonly slug: string
  readonly nome: string
  readonly linhaDeContexto: string
}

export const CATALOGO: readonly ItemDoCatalogo[] = [
  {
    slug: 'salario-liquido',
    nome: 'Salário líquido',
    linhaDeContexto:
      'Quanto sobra do seu salário depois dos descontos legais — com a conta à mostra.',
  },
  {
    slug: 'rescisao-sem-justa-causa',
    nome: 'Rescisão — demissão sem justa causa',
    linhaDeContexto:
      'Quanto você tem a receber na demissão sem justa causa — verba a verba, com as incidências à mostra.',
  },
  {
    slug: 'rescisao-pedido-demissao',
    nome: 'Rescisão — pedido de demissão',
    linhaDeContexto:
      'Quanto você recebe ao pedir demissão — e o que é descontado se não cumprir o aviso.',
  },
  {
    slug: 'rescisao-acordo-mutuo',
    nome: 'Rescisão — acordo mútuo',
    linhaDeContexto:
      'Quanto se recebe na extinção por acordo — e o que se abre mão para ter esse valor.',
  },
  {
    slug: 'rescisao-domestico',
    nome: 'Rescisão — empregado doméstico',
    linhaDeContexto:
      'Quanto se recebe na saída do trabalho doméstico — sem multa de 40%, com o fundo de 3,2%.',
  },
  {
    slug: 'aviso-previo-proporcional',
    nome: 'Aviso prévio proporcional',
    linhaDeContexto:
      'Quantos dias de aviso prévio o seu tempo de casa garante — e quanto eles valem.',
  },
  {
    slug: 'seguro-desemprego',
    nome: 'Seguro-desemprego',
    linhaDeContexto: 'Quantas parcelas você tem direito a receber, e de quanto é cada uma.',
  },
  {
    slug: 'custo-do-funcionario',
    nome: 'Custo real do funcionário',
    linhaDeContexto: 'Quanto um salário custa de verdade — com encargos e provisões na conta.',
  },
  {
    slug: 'ferias',
    nome: 'Férias',
    linhaDeContexto:
      'Quanto você recebe nas férias — com o terço, o abono e os descontos separados.',
  },
  {
    slug: 'decimo-terceiro',
    nome: '13º salário',
    linhaDeContexto:
      'Quanto você recebe de 13º, por parcela — com os descontos no lugar em que a lei os cobra.',
  },
  {
    slug: 'horas-extras',
    nome: 'Horas extras',
    linhaDeContexto:
      'Quanto valem suas horas extras, o adicional noturno e o reflexo no descanso semanal.',
  },
  {
    slug: 'banco-de-horas',
    nome: 'Banco de horas',
    linhaDeContexto:
      'Quanto tempo você tem para compensar — e quanto o saldo vale se não compensar.',
  },
  {
    slug: 'fgts',
    nome: 'FGTS — saldo e multa',
    linhaDeContexto:
      'Quanto deve ter na sua conta do FGTS e quanto é a multa, conforme o motivo da saída.',
  },
  {
    slug: 'inss',
    nome: 'INSS mensal',
    linhaDeContexto:
      'Quanto é descontado de contribuição previdenciária — faixa a faixa, com a alíquota efetiva.',
  },
  {
    slug: 'irrf',
    nome: 'Imposto de Renda na fonte',
    linhaDeContexto:
      'Quanto é retido de IRRF no mês — com a escolha entre deduções legais e desconto simplificado à mostra.',
  },
  {
    slug: 'ir-renda-fixa',
    nome: 'IR sobre renda fixa',
    linhaDeContexto: 'Quanto o imposto tira do seu rendimento — e quanto o prazo devolve.',
  },
  {
    slug: 'juros-compostos',
    nome: 'Juros compostos',
    linhaDeContexto: 'Quanto um valor rende ao longo do tempo, com aportes mensais.',
  },
  {
    slug: 'cet-custo-efetivo-total',
    nome: 'CET — custo efetivo total',
    linhaDeContexto:
      'Quanto o empréstimo custa de verdade — com tarifas e seguros dentro da conta.',
  },
  {
    slug: 'amortizacao-sac-price',
    nome: 'Amortização — SAC vs. Price',
    linhaDeContexto:
      'Quanto muda entre parcela fixa e parcela decrescente — no bolso e no total.',
  },
  {
    slug: 'rotativo-do-cartao',
    nome: 'Rotativo do cartão — custo real',
    linhaDeContexto:
      'Quanto custa não pagar a fatura inteira — e qual é o teto que a lei impõe à cobrança.',
  },
  {
    slug: 'cheque-especial',
    nome: 'Cheque especial — custo real',
    linhaDeContexto: 'Quanto custam os dias no vermelho — e qual é o teto que a lei impõe.',
  },
  {
    slug: 'capacidade-de-financiamento',
    nome: 'Capacidade de financiamento',
    linhaDeContexto: 'Quanto de financiamento a sua renda sustenta — e quanto ele custa no total.',
  },
  {
    slug: 'financiamento-imobiliario',
    nome: 'Financiamento imobiliário',
    linhaDeContexto:
      'Quanto a prestação custa de verdade — com os seguros e a tarifa dentro da conta.',
  },
  {
    slug: 'quitacao-antecipada',
    nome: 'Quitação antecipada — economia de juros',
    linhaDeContexto:
      'Quanto custa quitar hoje, com os juros reduzidos na proporção que a lei manda.',
  },
  {
    slug: 'porcentagem',
    nome: 'Porcentagem',
    linhaDeContexto:
      'Parte, acréscimo, desconto, proporção e variação — com a conta aberta ao lado.',
  },
  {
    slug: 'alcool-ou-gasolina',
    nome: 'Álcool ou gasolina',
    linhaDeContexto: 'Qual compensa no seu carro — pelo consumo real, não pela regra dos 70%.',
  },
]
