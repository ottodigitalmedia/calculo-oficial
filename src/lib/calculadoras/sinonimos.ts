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
  'horas-extras': ['hora extra', 'dsr'],
  'banco-de-horas': ['compensacao de jornada', 'horas negativas', 'saldo de horas'],
  'adicional-noturno': ['trabalho noturno', 'madrugada', 'turno da noite', 'plantao noturno'],
  insalubridade: ['insalubre', 'laudo', 'ambiente insalubre'],
  periculosidade: ['perigoso', 'motoboy', 'vigilante', 'eletricista', 'inflamavel'],
  'dsr-sobre-comissoes': ['descanso semanal remunerado', 'repouso remunerado', 'comissionista', 'vendedor'],
  'desconto-de-faltas': ['falta injustificada', 'perda do dsr', 'atestado', 'faltei'],
  'vale-transporte': ['passagem', 'onibus', 'metro', 'vt'],
  'jovem-aprendiz': ['menor aprendiz', 'primeiro emprego', 'programa de aprendizagem'],
  'recesso-de-estagio': ['estagiario', 'ferias do estagiario', 'bolsa de estagio'],
  'imposto-sobre-plr': ['lucros e resultados', 'ppr', 'bonus anual'],
  'licenca-maternidade': ['gestante', 'gravida', 'salario maternidade', '180 dias'],
  'licenca-paternidade': ['pai', 'nascimento do filho', 'salario paternidade', '20 dias'],
  'salario-familia': ['cota por filho', 'beneficio por filho', 'baixa renda'],
  'pensao-por-morte': ['viuva', 'falecimento', 'dependentes do inss', 'obito'],
  'auxilio-por-incapacidade': ['auxilio doenca', 'afastado pelo inss', 'pericia', 'encostado'],
  'salario-maternidade-do-inss': ['maternidade autonoma', 'mei gestante', 'rural gestante', 'desempregada gravida'],
  'aposentadoria-por-pontos': ['quando posso me aposentar', 'regra 86 96', 'transicao', 'tempo de contribuicao'],
  'aposentadoria-idade-progressiva': ['idade minima que sobe', '56 61', 'escada de idade'],
  'aposentadoria-pedagio-50': ['pedagio cinquenta', 'fator previdenciario', 'faltava dois anos'],
  'aposentadoria-pedagio-100': ['pedagio cem', '57 60 anos', 'pedagio integral'],
  'aposentadoria-por-idade': ['62 anos', '65 anos', 'quinze anos de contribuicao', 'regra permanente'],
  'valor-da-aposentadoria': ['quanto vou receber', 'renda mensal inicial', 'rmi', 'coeficiente 60'],
  'auxilio-acidente': ['lesao permanente', 'acidente de trabalho', 'indenizacao inss', 'reducao da capacidade'],
  'aposentadoria-do-professor': ['escola', 'lecionar', 'docente', 'educacao infantil'],
  'ganho-de-capital-na-venda-de-bens': ['vendi meu carro', 'venda de moto', 'venda de joia', 'isencao 35 mil'],
  'imposto-sobre-aluguel': ['locador', 'inquilino', 'renda de aluguel', 'recebo aluguel'],
  'juros-simples': ['montante', 'sem capitalizacao', 'juro simples', 'taxa proporcional'],
  'escala-12x36': ['12x36', '12 por 36', 'escala de plantao', 'plantonista', 'calendario de plantao'],
  'abono-salarial-pis': ['pis pasep', 'abono do pis', 'pis 2026', 'quem recebe pis', 'calendario pis'],
  'das-simples-nacional': ['anexo iii', 'fator r', 'imposto da empresa', 'pgdas', 'rbt12'],
  'dae-do-empregador-domestico': ['esocial domestico', 'guia da empregada', 'faxineira registrada', 'simples domestico'],
  'horas-trabalhadas': ['calculadora de horas', 'ponto eletronico', 'jornada diaria', 'cartao de ponto'],
  'ferias-em-dobro': ['ferias nao tiradas', 'periodo concessivo', 'sumula 81', 'ferias atrasadas'],
  'regras-de-aposentadoria': ['qual regra', 'comparar regras', 'reforma da previdencia', 'melhor regra'],
  'consorcio-ou-financiamento': ['carta de credito', 'lance', 'administradora', 'grupo de consorcio'],
  'come-cotas': ['sumiram cotas', 'imposto semestral', 'multimercado', 'antecipacao de imposto'],
  'multa-de-transito': ['cnh', 'perdi a carteira', 'detran', 'radar', 'alcool', 'autuacao'],
  'ir-em-fundos-imobiliarios': ['fii', 'fiagro', 'dividendos de fii', 'renda passiva', 'tijolo e papel'],
  'saque-aniversario-do-fgts': ['antecipacao fgts', 'sacar fgts todo ano', 'aniversario fgts', 'adesao'],
  'resgate-de-previdencia-privada': ['pgbl', 'vgbl', 'tabela regressiva', 'aposentadoria privada', 'resgatar plano'],
  'ir-em-bolsa-de-valores': ['acoes', 'renda variavel', 'b3', '20 mil', 'imposto sobre lucro de acoes', 'swing trade'],
  'rescisao-justa-causa': ['482', 'demitido por justa causa', 'perdi tudo', 'abandono de emprego'],
  'rescisao-contrato-de-experiencia': ['479', 'contrato temporario', 'demitido na experiencia', '45 dias', '90 dias'],
  'adicional-de-transferencia': ['mudanca de cidade', 'mudar de estado', 'ajuda de custo'],
  'sobreaviso-e-prontidao': ['on call', 'celular da empresa', 'escala de espera', 'de guarda'],
  'contrato-intermitente': ['bico', 'trabalho por hora', '452-a'],
  fgts: ['fundo de garantia', 'multa de 40', 'saldo fgts', 'saque'],

  // Tributos e previdência
  inss: ['aposentadoria', 'desconto inss'],
  'inss-autonomo-e-facultativo': ['contribuinte individual', 'gps', 'carne do inss', 'do lar', 'desempregado contribuir'],
  irrf: ['leao', 'retencao', 'imposto na fonte'],
  'ir-renda-fixa': ['tabela regressiva', 'imposto no investimento', 'come cotas'],
  'restituicao-irpf': ['malha fina', 'imposto a pagar', 'ajuste anual'],
  'tesouro-prefixado': ['ltn', 'tesouro direto', 'titulo publico', 'prefixado 2029'],
  'pgbl-imposto-de-renda': ['previdencia privada', 'vgbl', 'deducao de 12', 'plano de previdencia'],
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
