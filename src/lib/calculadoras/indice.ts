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
    slug: 'acordo-ou-dispensa',
    nome: 'Acordo mútuo ou dispensa',
    linhaDeContexto:
      'Quanto entra em cada caminho — com o seguro-desemprego, que é onde mora a maior diferença.',
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
    linhaDeContexto: 'Quantas parcelas e de quanto é cada uma, pela regra do programa.',
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
    slug: 'adicional-noturno',
    nome: 'Adicional noturno',
    linhaDeContexto:
      'Quanto vale o trabalho à noite, na cidade ou no campo, com a hora noturna de cada regra.',
  },
  {
    slug: 'insalubridade',
    nome: 'Adicional de insalubridade',
    linhaDeContexto:
      'Quanto rende o adicional em cada grau, calculado sobre a base que a lei manda usar.',
  },
  {
    slug: 'periculosidade',
    nome: 'Adicional de periculosidade',
    linhaDeContexto:
      'O adicional sobre o salário básico, e a comparação com a insalubridade quando cabem os dois.',
  },
  {
    slug: 'dsr-sobre-comissoes',
    nome: 'DSR sobre comissões',
    linhaDeContexto:
      'O repouso semanal que as comissões e as horas extras do mês geram, além do valor delas.',
  },
  {
    slug: 'desconto-de-faltas',
    nome: 'Desconto de faltas no salário',
    linhaDeContexto:
      'Quanto uma falta sem justificativa tira do salário, contando o dia e o descanso semanal.',
  },
  {
    slug: 'vale-transporte',
    nome: 'Desconto do vale-transporte',
    linhaDeContexto:
      'Quanto sai do seu salário pelo vale-transporte, e quanto o empregador paga do resto.',
  },
  {
    slug: 'jovem-aprendiz',
    nome: 'Salário do jovem aprendiz',
    linhaDeContexto:
      'Quanto o aprendiz recebe pela jornada contratada, com os descontos e o FGTS da aprendizagem.',
  },
  {
    slug: 'recesso-de-estagio',
    nome: 'Recesso de estágio',
    linhaDeContexto:
      'Quantos dias de recesso o estágio já garantiu, e quanto eles valem quando há bolsa.',
  },
  {
    slug: 'imposto-sobre-plr',
    nome: 'Imposto sobre a PLR',
    linhaDeContexto:
      'Quanto de imposto sai da participação nos lucros, pela tabela própria da PLR.',
  },
  {
    slug: 'licenca-maternidade',
    nome: 'Licença-maternidade',
    linhaDeContexto:
      'Quando a licença termina e quando é a volta ao trabalho, com ou sem a prorrogação da Empresa Cidadã.',
  },
  {
    slug: 'licenca-paternidade',
    nome: 'Licença-paternidade',
    linhaDeContexto:
      'Quantos dias de licença pela data do nascimento, com a lei nova de 2027 e a Empresa Cidadã.',
  },
  {
    slug: 'salario-familia',
    nome: 'Salário-família',
    linhaDeContexto:
      'Se a remuneração cabe no limite, e quanto as cotas por filho somam no mês.',
  },
  {
    slug: 'rescisao-contrato-de-experiencia',
    nome: 'Rescisão antecipada do contrato de experiência',
    linhaDeContexto:
      'A indenização de metade dos dias que faltavam, quando a empresa encerra o contrato a prazo antes do fim.',
  },
  {
    slug: 'adicional-de-transferencia',
    nome: 'Adicional de transferência',
    linhaDeContexto:
      'O pagamento suplementar de quem é transferido para outra cidade por necessidade do serviço.',
  },
  {
    slug: 'sobreaviso-e-prontidao',
    nome: 'Sobreaviso e prontidão',
    linhaDeContexto:
      'Quanto valem as horas de plantão à distância e as horas de espera no local de trabalho.',
  },
  {
    slug: 'rescisao-justa-causa',
    nome: 'Rescisão por justa causa',
    linhaDeContexto:
      'O que ainda é devido quando a dispensa é por justa causa — e o que deixa de ser.',
  },
  {
    slug: 'ir-em-bolsa-de-valores',
    nome: 'Imposto sobre ganhos em bolsa',
    linhaDeContexto:
      'Se há DARF a pagar no mês, com a isenção das vendas, o day trade à parte e o prejuízo compensado.',
  },
  {
    slug: 'resgate-de-previdencia-privada',
    nome: 'Imposto no resgate da previdência privada',
    linhaDeContexto:
      'Quanto o imposto leva do resgate, conforme o regime escolhido e o tipo de plano.',
  },
  {
    slug: 'saque-aniversario-do-fgts',
    nome: 'Saque-aniversário do FGTS',
    linhaDeContexto:
      'Quanto sai da conta no seu mês de aniversário — e quanto fica preso lá dentro.',
  },
  {
    slug: 'ir-em-fundos-imobiliarios',
    nome: 'Imposto em fundos imobiliários',
    linhaDeContexto:
      'Quando o rendimento é mesmo isento, e quanto o ganho na venda de cotas paga.',
  },
  {
    slug: 'multa-de-transito',
    nome: 'Multa de trânsito e pontos na carteira',
    linhaDeContexto:
      'O valor com e sem desconto, e quanto a infração aproxima da suspensão.',
  },
  {
    slug: 'come-cotas',
    nome: 'Come-cotas do fundo de investimento',
    linhaDeContexto:
      'Quanto a retenção de maio e novembro leva, e quanto ainda falta pagar no resgate.',
  },
  {
    slug: 'consorcio-ou-financiamento',
    nome: 'Consórcio ou financiamento',
    linhaDeContexto:
      'O total de cada caminho, o custo embutido e quando o bem chega em cada um.',
  },
  {
    slug: 'pensao-por-morte',
    nome: 'Pensão por morte do INSS',
    linhaDeContexto:
      'Quanto a família recebe, pela cota familiar mais as cotas de cada dependente.',
  },
  {
    slug: 'auxilio-por-incapacidade',
    nome: 'Auxílio por incapacidade temporária',
    linhaDeContexto:
      'Quanto o antigo auxílio-doença paga, com o limite que quase ninguém conhece.',
  },
  {
    slug: 'salario-maternidade-do-inss',
    nome: 'Salário-maternidade pago pelo INSS',
    linhaDeContexto:
      'Quanto recebe quem não é empregada com carteira: doméstica, autônoma, MEI ou desempregada.',
  },
  {
    slug: 'aposentadoria-por-pontos',
    nome: 'Aposentadoria pela regra de pontos',
    linhaDeContexto:
      'Se a soma de idade e contribuição já basta — e, se não basta, em que ano vai bastar.',
  },
  {
    slug: 'aposentadoria-idade-progressiva',
    nome: 'Aposentadoria pela idade progressiva',
    linhaDeContexto:
      'A idade mínima sobe seis meses por ano — em que mês você a alcança, com o tempo de contribuição exigido.',
  },
  {
    slug: 'aposentadoria-pedagio-50',
    nome: 'Aposentadoria pelo pedágio de 50%',
    linhaDeContexto:
      'Para quem estava perto de completar o tempo em 2019: o pedágio, o total exigido e o mês de cumprimento.',
  },
  {
    slug: 'aposentadoria-pedagio-100',
    nome: 'Aposentadoria pelo pedágio de 100%',
    linhaDeContexto:
      'Idade mínima menor, em troca de contribuir o dobro do que faltava em 2019 — e em que mês isso se cumpre.',
  },
  {
    slug: 'aposentadoria-por-idade',
    nome: 'Aposentadoria por idade',
    linhaDeContexto:
      'A idade e o tempo mínimo exigidos de quem já contribuía antes da reforma — e de quem começou depois.',
  },
  {
    slug: 'regras-de-aposentadoria',
    nome: 'Comparador de regras de aposentadoria',
    linhaDeContexto:
      'Todas as regras da reforma lado a lado — e qual delas se cumpre primeiro no seu caso.',
  },
  {
    slug: 'valor-da-aposentadoria',
    nome: 'Valor da aposentadoria',
    linhaDeContexto:
      'Quanto a aposentadoria paga depois da reforma: o percentual da média e os limites do INSS.',
  },
  {
    slug: 'auxilio-acidente',
    nome: 'Auxílio-acidente',
    linhaDeContexto:
      'Metade do salário de benefício, somada ao salário — para quem ficou com sequela de acidente.',
  },
  {
    slug: 'aposentadoria-do-professor',
    nome: 'Aposentadoria do professor',
    linhaDeContexto:
      'As regras do magistério depois da reforma — com cinco anos a menos — e qual se cumpre primeiro.',
  },
  {
    slug: 'ferias-em-dobro',
    nome: 'Férias vencidas em dobro',
    linhaDeContexto:
      'Tirou férias depois do prazo? Os dias de fora do prazo são pagos em dobro, com o terço.',
  },
  {
    slug: 'ganho-de-capital-na-venda-de-bens',
    nome: 'Imposto na venda de carro e outros bens',
    linhaDeContexto:
      'Vendeu com lucro um carro, joias ou cotas de empresa? Se o preço passou do teto, há imposto sobre o ganho.',
  },
  {
    slug: 'imposto-sobre-aluguel',
    nome: 'Imposto de renda sobre aluguel',
    linhaDeContexto:
      'Quanto de imposto sai do aluguel que você recebe — depois de tirar IPTU, condomínio e a taxa da imobiliária.',
  },
  {
    slug: 'horas-trabalhadas',
    nome: 'Horas trabalhadas e intervalo',
    linhaDeContexto:
      'Da entrada, da saída e do almoço: as horas do dia e da semana, o intervalo mínimo e o descanso entre jornadas.',
  },
  {
    slug: 'das-simples-nacional',
    nome: 'DAS do Simples Nacional',
    linhaDeContexto:
      'Quanto a empresa paga de Simples no mês: o anexo, a faixa e a alíquota efetiva — menor que a da tabela.',
  },
  {
    slug: 'dae-do-empregador-domestico',
    nome: 'DAE do empregador doméstico',
    linhaDeContexto:
      'O que vai na guia mensal de quem contrata doméstica, babá ou cuidador — e quanto ela custa de verdade.',
  },
  {
    slug: 'abono-salarial-pis',
    nome: 'Abono salarial do PIS',
    linhaDeContexto:
      'Se a sua renda fica no limite do ano e quanto seria o abono pelos meses trabalhados.',
  },
  {
    slug: 'contrato-intermitente',
    nome: 'Contrato intermitente — o acerto de cada convocação',
    linhaDeContexto:
      'Quanto entra a cada chamada, com o 13º e as férias que a lei manda pagar na hora.',
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
    slug: 'inss-autonomo-e-facultativo',
    nome: 'INSS do autônomo e do facultativo',
    linhaDeContexto:
      'Quanto recolher por conta própria — e por que a tabela do empregado não vale.',
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
    slug: 'custo-de-aquisicao-de-imovel',
    nome: 'Custo total de aquisição de imóvel',
    linhaDeContexto: 'Quanto precisa estar em dinheiro no dia — que não é só a entrada.',
  },
  {
    slug: 'ganho-de-capital-imovel',
    nome: 'IR sobre ganho de capital na venda de imóvel',
    linhaDeContexto:
      'Quanto de imposto na venda — com os fatores de redução que quase ninguém aplica.',
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
    slug: 'plano-de-quitacao',
    nome: 'Plano de quitação de dívidas',
    linhaDeContexto:
      'Bola de neve ou avalanche: com o mesmo dinheiro por mês, qual ordem sai mais barata.',
  },
  {
    slug: 'portabilidade-de-credito',
    nome: 'Portabilidade de crédito',
    linhaDeContexto:
      'Se a proposta compensa de verdade — comparada pelo total, não pela parcela.',
  },
  {
    slug: 'financiamento-de-reforma',
    nome: 'Financiamento de reforma',
    linhaDeContexto:
      'A mesma obra por cada porta de crédito — e quanto custa esperar em vez disso.',
  },
  {
    slug: 'emprestimo-consignado',
    nome: 'Empréstimo consignado — margem e parcela',
    linhaDeContexto: 'Quanto cabe na sua margem — calculada sobre o líquido, como manda a lei.',
  },
  {
    slug: 'rentabilidade-de-aluguel',
    nome: 'Rentabilidade de imóvel para locação',
    linhaDeContexto: 'Quanto o imóvel rende de verdade — depois da vacância, do IPTU e da taxa.',
  },
  {
    slug: 'alugar-ou-comprar',
    nome: 'Alugar ou comprar',
    linhaDeContexto:
      'Qual constrói mais patrimônio no seu prazo — e quanto o imóvel teria que valorizar para empatar.',
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
    slug: 'cdb-lci-lca',
    nome: 'CDB, LCI e LCA — rendimento líquido',
    linhaDeContexto: 'Quanto sobra de "110% do CDI" depois do imposto — e quando o isento ganha.',
  },
  {
    slug: 'onde-render-mais',
    nome: 'Tesouro Selic, CDB ou poupança',
    linhaDeContexto:
      'Qual das três entrega mais no seu prazo — comparadas pelo líquido, não pela taxa.',
  },
  {
    slug: 'tesouro-ipca-mais',
    nome: 'Tesouro IPCA+ — ganho real',
    linhaDeContexto: 'Quanto sobra de ganho real depois do imposto — que morde a correção também.',
  },
  {
    slug: 'dividend-yield',
    nome: 'Dividend yield e renda passiva',
    linhaDeContexto:
      'Quanto os proventos rendem sobre o preço — e quanto seria preciso para viver deles.',
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
    slug: 'das-mei',
    nome: 'DAS-MEI — valor mensal',
    linhaDeContexto: 'Quanto o MEI paga por mês — valor fixo, que não muda com o faturamento.',
  },
  {
    slug: 'limite-do-mei',
    nome: 'Limite de faturamento do MEI',
    linhaDeContexto: 'Quanto ainda cabe no ano — e o que muda se você passar do teto.',
  },
  {
    slug: 'carne-leao',
    nome: 'Carnê-leão',
    linhaDeContexto: 'Quanto recolher no mês sobre o que você recebeu de pessoas físicas.',
  },
  {
    slug: 'restituicao-irpf',
    nome: 'Restituição do Imposto de Renda',
    linhaDeContexto: 'Se você tem imposto a restituir ou a pagar na declaração anual.',
  },
  {
    slug: 'simplificado-ou-completo',
    nome: 'Simplificado ou completo',
    linhaDeContexto: 'Qual modelo de declaração paga menos imposto, com os seus números.',
  },
  {
    slug: 'imposto-sobre-criptoativos',
    nome: 'Imposto sobre criptoativos',
    linhaDeContexto: 'Se as suas vendas do mês passaram do teto de isenção, e quanto pagar.',
  },
  {
    slug: 'retorno-energia-solar',
    nome: 'Retorno de energia solar',
    linhaDeContexto: 'Em quanto tempo o sistema se paga, já com a cobrança do Fio B.',
  },
  {
    slug: 'clt-ou-pj',
    nome: 'CLT, PJ ou MEI',
    linhaDeContexto: 'Qual regime deixa mais dinheiro no seu bolso, com os seus números.',
  },
  {
    slug: 'pro-labore',
    nome: 'Pró-labore e encargos do sócio',
    linhaDeContexto:
      'Quanto sobra para o sócio e quanto custa para a empresa — com os 11% explicados.',
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
    slug: 'custo-do-botijao-de-gas',
    nome: 'Custo do botijão de gás',
    linhaDeContexto:
      'Quanto o gás pesa por mês — e quanto você paga por quilo, que é o que compara.',
  },
  {
    slug: 'conta-de-agua',
    nome: 'Conta de água',
    linhaDeContexto: 'Quanto a água custa com a tarifa progressiva — e quanto custa o próximo m³.',
  },
  {
    slug: 'correcao-por-indice',
    nome: 'Correção de valor por índice',
    linhaDeContexto: 'Quanto um valor de ontem vale hoje — por IPCA, INPC, IGP-M ou Selic, mês a mês.',
  },
  {
    slug: 'poder-de-compra',
    nome: 'Poder de compra ao longo do tempo',
    linhaDeContexto:
      'Quanto o dinheiro perdeu — e quanto seria preciso hoje para comprar o mesmo.',
  },
  {
    slug: 'conversor-de-moeda',
    nome: 'Conversor de moeda com IOF',
    linhaDeContexto:
      'Quanto você paga de verdade por dólar ou euro — com spread, IOF e tarifa dentro.',
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
    slug: 'dias-uteis-entre-datas',
    nome: 'Dias úteis entre datas',
    linhaDeContexto: 'Quantos dias úteis há no período — com os feriados nacionais de verdade.',
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
  {
    slug: 'eletrico-ou-combustao',
    nome: 'Carro elétrico ou a combustão',
    linhaDeContexto: 'Quanto cada um custa por quilômetro — pela sua tarifa e pelo seu consumo.',
  },
  {
    slug: 'depreciacao-de-veiculo',
    nome: 'Depreciação de veículo',
    linhaDeContexto:
      'Quanto o carro perde por mês — o custo que não tem boleto — e quanto valerá.',
  },
  {
    slug: 'financiamento-de-veiculo',
    nome: 'Financiamento de veículo',
    linhaDeContexto: 'Quanto fica a parcela — e quanto o carro custa no fim, com o CET à mostra.',
  },
  {
    slug: 'divisao-de-conta',
    nome: 'Divisão de conta',
    linhaDeContexto:
      'Quanto cada um paga quando o consumo foi diferente — com gorjeta na proporção.',
  },
  {
    slug: 'media-ponderada',
    nome: 'Média ponderada e média escolar',
    linhaDeContexto: 'Qual é a sua média com os pesos — e quanto falta tirar no que resta.',
  },
  {
    slug: 'conversor-de-unidades',
    nome: 'Conversor de unidades',
    linhaDeContexto:
      'Comprimento, massa, volume, área, temperatura e mais — com a conta à mostra.',
  },
]
