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
    slug: 'amortizacao-extra',
    nome: 'Amortização extra — prazo ou parcela',
    linhaDeContexto:
      'O que rende mais com o mesmo dinheiro: encurtar o contrato ou baixar a prestação.',
  },
  {
    slug: 'rentabilidade-de-aluguel',
    nome: 'Rentabilidade de imóvel para locação',
    linhaDeContexto: 'Quanto o imóvel rende de verdade — depois da vacância, do IPTU e da taxa.',
  },
  {
    slug: 'quanto-rende-por-mes',
    nome: 'Quanto rende por mês',
    linhaDeContexto: 'Quanto um valor investido paga por mês — com o imposto dentro da conta.',
  },
  {
    slug: 'rendimento-da-poupanca',
    nome: 'Rendimento da poupança',
    linhaDeContexto: 'Quanto a poupança rende no prazo — pela taxa que o Banco Central publicou.',
  },
  {
    slug: 'tesouro-ipca-mais',
    nome: 'Tesouro IPCA+ — ganho real',
    linhaDeContexto: 'Quanto sobra de ganho real depois do imposto — que morde a correção também.',
  },
  {
    slug: 'reserva-de-emergencia',
    nome: 'Reserva de emergência',
    linhaDeContexto:
      'De quanto ela precisa ser, quanto falta e em quanto tempo o seu aporte fecha.',
  },
  {
    slug: 'independencia-financeira',
    nome: 'Meta de independência financeira',
    linhaDeContexto: 'Quanto patrimônio sustenta a renda que você quer — e quanto tempo até lá.',
  },
  {
    slug: 'precificacao-de-hora',
    nome: 'Precificação de hora',
    linhaDeContexto:
      'Quanto cobrar por hora para fechar a sua conta — com hora não faturável dentro.',
  },
  {
    slug: 'orcamento-domestico',
    nome: 'Orçamento doméstico 50/30/20',
    linhaDeContexto: 'Como dividir a renda do mês — com os percentuais no seu controle, não fixos.',
  },
  {
    slug: 'consumo-de-energia',
    nome: 'Consumo de energia por aparelho',
    linhaDeContexto: 'Quanto cada aparelho pesa na conta de luz — pela sua tarifa, não por média.',
  },
  {
    slug: 'correcao-por-indice',
    nome: 'Correção de valor por índice',
    linhaDeContexto: 'Quanto um valor de ontem vale hoje — por IPCA, INPC ou IGP-M, mês a mês.',
  },
  {
    slug: 'poder-de-compra',
    nome: 'Poder de compra ao longo do tempo',
    linhaDeContexto:
      'Quanto o dinheiro perdeu — e quanto seria preciso hoje para comprar o mesmo.',
  },
  {
    slug: 'valor-futuro-corrigido',
    nome: 'Valor futuro corrigido pela inflação',
    linhaDeContexto: 'Quanto será preciso ter lá na frente — e o que o dinheiro parado comprará.',
  },
  {
    slug: 'reajuste-de-salario',
    nome: 'Reajuste de salário pela inflação',
    linhaDeContexto:
      'Quanto o salário precisaria ser para manter o poder de compra — e o que a proposta representa.',
  },
  {
    slug: 'reajuste-de-aluguel',
    nome: 'Reajuste de aluguel',
    linhaDeContexto: 'Quanto o aluguel passa a ser pelo índice do contrato — com a conta à mostra.',
  },
  {
    slug: 'porcentagem',
    nome: 'Porcentagem',
    linhaDeContexto:
      'Parte, acréscimo, desconto, proporção e variação — com a conta aberta ao lado.',
  },
  {
    slug: 'regra-de-tres',
    nome: 'Regra de três',
    linhaDeContexto: 'Simples ou composta, direta ou inversa — com a proporção aberta ao lado.',
  },
  {
    slug: 'alcool-ou-gasolina',
    nome: 'Álcool ou gasolina',
    linhaDeContexto: 'Qual compensa no seu carro — pelo consumo real, não pela regra dos 70%.',
  },
  {
    slug: 'custo-de-viagem',
    nome: 'Custo de viagem de carro',
    linhaDeContexto: 'Quanto a viagem gasta de combustível e pedágio — ida, volta e por pessoa.',
  },
  {
    slug: 'custo-mensal-do-carro',
    nome: 'Custo mensal de ter um carro',
    linhaDeContexto: 'Quanto o carro custa por mês de verdade — não só o que sai no posto.',
  },
]
