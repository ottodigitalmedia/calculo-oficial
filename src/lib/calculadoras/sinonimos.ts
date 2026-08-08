/**
 * Termos que as pessoas usam e que não estão no nome da calculadora.
 *
 * ## ESTE MAPA FICOU PARA TRÁS, E ISSO CUSTA TRÁFEGO EM SILÊNCIO
 *
 * Ele foi escrito no lançamento, com **quatro** calculadoras. O catálogo fechou
 * em 76 e o mapa continuou com as mesmas quatro até 08/08/2026 — quem digitasse
 * "demissão", "acerto", "financiamento da casa" ou "quanto rende meu dinheiro"
 * recebia *"Não encontramos nada com esse termo"* em cima de um catálogo que
 * tinha a resposta.
 *
 * **É o modo de falha mais caro possível numa busca**, porque não deixa
 * vestígio: nenhum erro, nenhum teste vermelho, e o visitante vai embora
 * convencido de que o site não faz aquilo.
 *
 * ## O CRITÉRIO PARA ENTRAR AQUI
 *
 * Só palavra que a pessoa **digitaria** e que **não está** no nome nem na linha
 * de contexto — porque o filtro já casa contra esses dois. Sinônimo que repete o
 * nome não faz nada e ainda dá a impressão de cobertura.
 *
 * Sem acento, porque `normalizar` remove os do termo digitado antes de comparar.
 *
 * > ⚠️ Quando a análise de uso ganhar evento de produto, instrumentar aqui o
 * > `busca_sem_resultado` — é a informação mais valiosa para decidir a próxima
 * > calculadora, e é ela que distingue "falta cobertura" de "falta canal" no
 * > critério de MR-3 (`11-roadmap` §6). **Ela carrega o termo digitado**, então
 * > é exceção a `RN-031` e precisa de decisão do mantenedor, não de commit.
 */
/**
 * Exportado só para `tests/unit/busca.test.ts`.
 *
 * A chave é um slug, e slug errado aqui **não faz nada** — não quebra, não
 * avisa, e o sinônimo simplesmente nunca casa. Setenta e seis chaves escritas à
 * mão sem verificação é o mesmo material de que era feito o rodapé que anunciou
 * "em breve" calculadoras publicadas.
 */
export const SINONIMOS: Readonly<Record<string, readonly string[]>> = {
  // Trabalhista
  'salario-liquido': ['holerite', 'contracheque', 'desconto folha', 'quanto vou receber'],
  'rescisao-sem-justa-causa': ['demitido', 'mandado embora', 'acerto', 'verbas rescisorias', 'fui demitido'],
  'rescisao-pedido-demissao': ['pedi as contas', 'sair do emprego', 'me demitir'],
  'rescisao-acordo-mutuo': ['demissao acordada', 'demissao consensual', '484-a'],
  'acordo-ou-dispensa': ['vale a pena o acordo', 'acordo ou demissao', 'comparar acordo'],
  'rescisao-domestico': ['diarista', 'empregada domestica', 'domestica', 'babá', 'caseiro'],
  'aviso-previo-proporcional': ['aviso trabalhado', 'aviso indenizado', '30 dias'],
  'seguro-desemprego': ['parcelas do seguro', 'auxilio desemprego', 'desempregado'],
  'custo-do-funcionario': ['quanto custa contratar', 'contratar clt', 'folha de pagamento'],
  ferias: ['abono pecuniario', 'vender ferias', 'terco de ferias', 'recesso'],
  'decimo-terceiro': ['decimo terceiro', 'gratificacao natalina', 'primeira parcela'],
  'horas-extras': ['hora extra', 'dsr', 'sobreaviso'],
  'banco-de-horas': ['compensacao de jornada', 'horas negativas', 'saldo de horas'],
  'contrato-intermitente': ['bico', 'trabalho por hora', '452-a'],
  fgts: ['fundo de garantia', 'multa de 40', 'saldo fgts', 'saque'],

  // Tributos e previdência
  inss: ['aposentadoria', 'desconto inss'],
  'inss-autonomo-e-facultativo': ['contribuinte individual', 'gps', 'carne do inss', 'do lar', 'desempregado contribuir'],
  irrf: ['leao', 'retencao', 'imposto na fonte'],
  'ir-renda-fixa': ['tabela regressiva', 'imposto no investimento', 'come cotas'],
  'restituicao-irpf': ['malha fina', 'imposto a pagar', 'ajuste anual'],
  'simplificado-ou-completo': ['desconto simplificado', 'qual modelo declarar', 'deducao legal'],
  'imposto-sobre-criptoativos': ['bitcoin', 'criptomoeda', 'exchange'],
  'carne-leao': ['recibo', 'autonomo imposto', 'aluguel recebido imposto'],
  'ganho-de-capital-imovel': ['vender imovel imposto', 'lucro na venda', 'isencao de 5 anos'],

  // Crédito e dívidas
  'juros-compostos': ['investimento', 'render', 'rendimento', 'poupanca'],
  'cet-custo-efetivo-total': ['custo do emprestimo', 'taxa real', 'quanto vou pagar de juros'],
  'amortizacao-sac-price': ['tabela price', 'parcelas do financiamento', 'sistema de amortizacao'],
  'rotativo-do-cartao': ['divida do cartao', 'nao paguei o cartao', 'parcelamento da fatura'],
  'cheque-especial': ['limite da conta', 'saldo negativo'],
  'plano-de-quitacao': ['sair das dividas', 'quitar dividas'],
  'quitacao-antecipada': ['antecipar parcelas', 'desconto de juros', 'quitar antes'],
  'portabilidade-de-credito': ['trocar de banco', 'transferir financiamento', 'juros menores'],
  'emprestimo-consignado': ['desconto em folha', 'margem consignavel', 'emprestimo aposentado'],

  // Imóveis
  'capacidade-de-financiamento': ['quanto consigo financiar', 'quanto de imovel cabe', 'aprovacao de credito'],
  'financiamento-imobiliario': ['casa propria', 'apartamento', 'financiar imovel', 'minha casa minha vida'],
  'custo-de-aquisicao-de-imovel': ['itbi', 'cartorio', 'escritura', 'custos da compra'],
  'amortizacao-extra': ['adiantar parcela', 'usar fgts no financiamento', 'reduzir prazo'],
  'rentabilidade-de-aluguel': ['imovel para alugar', 'renda de aluguel', 'yield do imovel'],
  'alugar-ou-comprar': ['vale a pena comprar', 'morar de aluguel', 'comprar ou alugar'],
  'financiamento-de-reforma': ['reformar a casa', 'material de construcao'],

  // Investimentos
  'quanto-rende-por-mes': ['viver de renda', 'renda passiva', 'um milhao'],
  'rendimento-da-poupanca': ['caderneta', 'poupanca rende quanto'],
  'cdb-lci-lca': ['renda fixa', 'aplicacao', 'banco rende'],
  'onde-render-mais': ['comparar investimentos', 'tesouro ou cdb', 'melhor investimento'],
  'tesouro-ipca-mais': ['tesouro direto', 'titulo publico', 'juro real'],
  'dividend-yield': ['acoes', 'dividendos', 'fii', 'fundo imobiliario'],
  'reserva-de-emergencia': ['quanto guardar', 'colchao', 'fundo de emergencia'],
  'independencia-financeira': ['aposentar cedo', 'liberdade financeira', 'fire', 'parar de trabalhar'],

  // Autônomo, MEI e PJ
  'precificacao-de-hora': ['valor da hora', 'freelancer', 'orcamento de servico'],
  'das-mei': ['boleto do mei', 'guia do mei'],
  'limite-do-mei': ['desenquadramento', 'estourei o mei'],
  'clt-ou-pj': ['pejotizacao', 'vale a pena ser pj', 'clt ou pj', 'comparar salario pj'],
  'pro-labore': ['retirada', 'distribuicao de lucros'],

  // Consumo, energia e veículos
  'orcamento-domestico': ['50 30 20', 'organizar as contas', 'planilha de gastos'],
  'consumo-de-energia': ['kwh', 'geladeira', 'chuveiro', 'ar condicionado'],
  'custo-do-botijao-de-gas': ['gas de cozinha', 'p13'],
  'conta-de-agua': ['metro cubico', 'saneamento'],
  'retorno-energia-solar': ['placa solar', 'painel solar', 'fotovoltaico', 'gerar energia'],
  'alcool-ou-gasolina': ['etanol', 'abastecer', '70 por cento', 'combustivel compensa'],
  'custo-de-viagem': ['gasto de viagem', 'quantos litros', 'estrada'],
  'custo-mensal-do-carro': ['manter um carro', 'gasto com carro', 'ipva seguro'],
  'eletrico-ou-combustao': ['hibrido', 'recarga'],
  'depreciacao-de-veiculo': ['desvalorizacao', 'quanto vale meu carro', 'revenda'],
  'financiamento-de-veiculo': ['financiar carro', 'parcela do carro', 'moto'],

  // Índices e utilitários
  'correcao-por-indice': ['corrigir valor', 'igpm', 'atualizacao monetaria', 'divida antiga'],
  'poder-de-compra': ['inflacao', 'valia quanto hoje', 'dinheiro antigo'],
  'conversor-de-moeda': ['cambio', 'viagem internacional'],
  'valor-futuro-corrigido': ['projecao', 'quanto valera'],
  'reajuste-de-salario': ['aumento', 'dissidio', 'reposicao da inflacao'],
  'reajuste-de-aluguel': ['aumento do aluguel', 'contrato de locacao', 'igpm aluguel'],
  porcentagem: ['aumento percentual', 'quanto por cento'],
  'regra-de-tres': ['regra de tres composta'],
  'dias-uteis-entre-datas': ['prazo', 'contagem de prazo'],
  'divisao-de-conta': ['rachar a conta', 'dividir despesa', 'vaquinha'],
  'media-ponderada': ['nota da prova', 'passei de ano'],
  'conversor-de-unidades': ['metro', 'quilo', 'polegada', 'litro', 'converter medida'],
}
