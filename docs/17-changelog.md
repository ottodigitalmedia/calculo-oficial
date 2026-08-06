---
doc: 17-changelog
projeto: Cálculo Oficial
versao: 1.0
status: draft
depende_de: [05-data-model]
---

# Changelog

Registro de mudanças do produto. Sem datas absolutas: as versões são a unidade de tempo.

Este documento tem uma seção que a maioria dos changelogs não tem — **correções de parâmetro legal** — e ela existe porque, neste produto, um valor errado é o incidente mais grave possível, e ocultá-lo custaria mais do que o próprio erro.

## Convenções

| Categoria | Uso |
|---|---|
| `Adicionado` | Calculadora, guia ou funcionalidade nova |
| `Alterado` | Mudança de comportamento existente |
| `Corrigido` | Defeito de software |
| **`Parâmetro`** | Nova vigência de parâmetro legal — rotina esperada |
| **`Correção de parâmetro`** | **Valor publicado estava incorreto.** Sempre com exposição declarada |
| `Auditoria` | Registro de auditoria periódica, mesmo sem divergência |
| `Removido` | Funcionalidade ou calculadora descontinuada |
| `Segurança` | Correção de segurança ou de privacidade |

**Regra obrigatória.** Toda entrada de `Correção de parâmetro` declara: o que estava errado, desde quando, quais calculadoras foram afetadas, qual a correção e qual caso-ouro foi adicionado para impedir a repetição. Sem exceção, sem eufemismo.

---

## Ciclo de 06/08/2026

### Adicionado · CALC-020 · ganho de capital, com os fatores que quase ninguém aplica

Os fatores de redução do art. 40 da Lei nº 11.196/2005 são a parte que quase
nenhuma calculadora do mercado aplica, e num imóvel dos anos 1990 eles derrubam a
base pela metade ou mais. Ignorá-los produz um imposto muito maior que o devido —
**errar para mais também é errar**, e um caso-ouro mede que a diferença passa do
dobro.

O § 2º do artigo tem um detalhe que muda tudo em imóvel antigo: para quem comprou
até 1995, o primeiro fator conta a partir de **janeiro de 1996**, e não da compra.

A tabela é progressiva por faixa — 15% até R$ 5 milhões, chegando a 22,5% — e o
art. 21 da Lei nº 8.981/1995 aparece com **três redações empilhadas**. A da MP nº
692/2015 traz faixas completamente diferentes, com corte em R$ 1 milhão, e não é
a vigente. Quem para na primeira ocorrência cadastra uma tabela inteira que não
vale.

As isenções são afirmações do usuário, não deduções da página: ser o único
imóvel, não ter havido outra alienação em cinco anos, pretender reinvestir. A do
reinvestimento é **proporcional** ao que for aplicado.

**O que ficou de fora, declarado na tela:** a redução do art. 18 da Lei nº
7.713/1988, para imóveis adquiridos até 1988. Como não aplicá-la faz o imposto
sair maior que o devido, a página avisa quando a data de aquisição é anterior a
1989.

### Corrigido · os fatores perdiam precisão ao virar basis points

A primeira versão do motor calculava o fator, convertia para basis points e
aplicava. Basis points têm resolução de 0,0001 — sobre um ganho de oitocentos mil
reais isso é mais de cem reais de base.

Os fatores passaram a ser aplicados em inteiro grande, e a conversão para basis
points ficou só para exibição. Quem revelou foi um caso-ouro que pedia quatro
casas decimais e falhava por 7×10⁻⁵: a leitura preguiçosa seria afrouxar a
tolerância, e a certa foi perguntar por que o número não era exato.

### Adicionado · CALC-014 · contrato intermitente, e a regra que caducou

O catálogo pedia uma calculadora de **rescisão** do contrato intermitente, e a
pesquisa mostrou que ela não pode existir hoje. O regime de rescisão —
aviso prévio e multa do FGTS pela metade, calculados pela média dos valores
recebidos — estava nos arts. 452-B a 452-H, todos criados pela **Medida
Provisória nº 808/2017 e todos com "(Vigência encerrada)"**. A MP caducou em
23/04/2018 sem virar lei, e nada a substituiu.

O que ficou em vigor é o § 6º do art. 452-A: o pagamento imediato ao fim de
**cada** período de prestação — remuneração, férias proporcionais com o terço,
décimo terceiro proporcional, repouso semanal e adicionais. É a conta que o
trabalhador intermitente confere toda semana, e é ela que a calculadora faz,
com o INSS e o imposto verba a verba e o FGTS que o empregador deposita por
fora.

**O aviso prévio fica de fora, declarado na tela.** Como omiti-lo erra para
menos, a página diz que o devido tende a ser maior.

**O repouso semanal é campo do usuário**, e também isso é dito: a Lei nº
605/1949 manda calculá-lo pela "jornada normal de trabalho", e o intermitente
não tem jornada normal. A norma não responde, e a calculadora não inventa.

O 13º e as férias, ao contrário, são calculados — um avo da remuneração do
período. A regra dos 15 dias daria zero num período curto e tornaria impossível
o pagamento que o § 6º manda fazer.

### Corrigido · a memória de cálculo mostrava um passo que não se reproduzia

A memória da CALC-020 dizia `R$ 800.000,00 × 65,78% = R$ 526.297,54`, e quem
conferisse na calculadora chegava a R$ 526.240,00 — cinquenta e sete reais de
diferença dentro da tela que existe para o usuário conferir.

Nenhum número estava errado: o fator exibido é arredondado a quatro casas, e o
aplicado é a divisão exata. Os dois estão certos e não se multiplicam um pelo
outro. O passo passou a ser escrito como a lei o escreve — `÷ 1,0060^70` — e o
caso-ouro que guarda isso refaz a conta do jeito que alguém faria numa
calculadora comum.

### Adicionado · CALC-027 · consignado, com a margem sobre a base certa

Todo mundo cita os 40%, e quase ninguém cita sobre o quê. A lei diz "40% da
**remuneração disponível**", e define disponível como o salário "descontadas as
consignações compulsórias" — o líquido de INSS e IRRF, não o bruto. A diferença
cresce com o salário, porque os descontos obrigatórios crescem junto, e um
caso-ouro trava essa progressão.

A página parte do bruto e deduz, reaproveitando os motores de INSS e IRRF que já
existem e já são conferidos — pedir o líquido seria mais simples e menos
confiável. E mostra os dois números lado a lado, para que o engano fique visível.

O valor do empréstimo sai do valor presente da margem livre: a margem limita a
PARCELA, não o valor tomado, e por isso prazo maior aumenta o quanto cabe **e** o
total pago. As duas consequências aparecem juntas.

**Um recorte que a pesquisa obrigou.** O cabeçalho da lei traz "(Vide Medida
Provisória nº 1.355, de 2026)". Ela altera o artigo dos aposentados e
pensionistas do INSS — não o do empregado CLT. Como MP pode não ser convertida,
a calculadora cobre o CLT e declara na tela que as outras categorias têm regra
própria. Mesmo critério do IOF em CALC-062.

### Adicionado · CALC-051 · pró-labore, e os 11% que ninguém sabe de onde vêm

Todo sócio vê 11% de INSS no recibo, e nenhuma norma escreve "11%". É o encontro
de dois dispositivos: a empresa recolhe 20% sobre a remuneração paga a
contribuinte individual (art. 22, III da Lei nº 8.212/1991), e o segurado deduz
45% dessa contribuição da sua, "limitada a dedução a nove por cento do respectivo
salário-de-contribuição" (art. 30, § 4º). Como 45% de 20% dão exatamente 9%, os
20% do caput viram 11%.

**Cadastrar 11% direto caberia no contrato e passaria em tudo** — e custaria a
única coisa que este produto vende. Quem abrisse a memória veria "11%, art. 21" e
não teria como conferir, porque o art. 21 diz 20%. Foram cadastrados a patronal e
o teto da dedução, e a subtração aparece na memória com etapa própria.

A página também mostra a diferença que mais surpreende quem compara com salário:
**o desconto do sócio tem teto e a patronal não**. A partir do limite máximo do
salário-de-contribuição os dois deixam de crescer juntos.

Se a patronal é recolhida por fora ou está no DAS é campo do usuário: depende do
anexo do Simples, da atividade e do fator R. Quem sabe é o contador.

### Adicionado · CALC-072 · dias úteis, com os feriados nacionais de verdade

O bloqueio "D-5: o calendário de feriados" sugeria uma fonte de dados a obter e
manter. Não havia: os feriados nacionais estão em **três leis federais** e são
nove, e os móveis derivam da Páscoa — cômputo gregoriano, aritmética pura, sem
fonte a citar.

**O que o bloqueio escondia era uma questão de produto.** Carnaval, Sexta-feira
Santa e Corpus Christi NÃO são feriados nacionais: a Lei nº 9.093/1995 diz que
feriados civis são os declarados em lei federal, e que a Sexta-Feira da Paixão é
feriado RELIGIOSO de lei MUNICIPAL, dentro de um limite de quatro. Os outros dois
são ponto facultativo.

Quase toda calculadora do gênero os soma como nacionais. Somá-los erra para quem
trabalha onde não são feriado; ignorá-los erra para quem trabalha onde são. Eles
entram **por escolha, com a natureza declarada no rótulo**.

**`ValorParametro` ganhou `data_fixa`.** Codificar um feriado como inteiro
(`421` para 21 de abril) caberia no contrato atual, e seria o encoding que este
projeto já registrou como caminho errado. Feriado precisa de vigência: três dos
nove entraram depois — 21/4 e 2/11 em 2002, 20/11 em 2023 — e contar 2020 com o
feriado de 2023 seria errado.

**Os feriados são resolvidos na data de CADA DIA contado**, e não na data de
referência da calculadora: os dias úteis de 2020 se contam com os feriados de
2020, mesmo perguntando hoje. Uma versão intermediária resolvia por ano com
cache, e os testes pegaram o erro na fronteira — as três leis foram publicadas em
dezembro, e o cache por ano tornava 20/11/2023 feriado retroativo.

### Adicionado · CALC-038 · financiamento de reforma — e o fim do bloco sem pesquisa

Era a última calculadora do catálogo que não dependia de pesquisa em norma, e a
que mais corria risco de não merecer existir: financiar reforma é tomar crédito,
e CALC-024 já calcula isso.

**O que a salvou foi mudar a pergunta.** O CET simula uma operação, para quem já
escolheu onde tomar. Quem vai reformar tem o orçamento na mão e várias portas
abertas, com taxas que se separam por um fator de cinco. A página compara as
modalidades **para a mesma obra** — garantia de imóvel, consignado, pessoal,
cartão — e acrescenta a alternativa que não aparece na mesa do banco: esperar e
pagar à vista.

Modalidade em branco não vira linha: campo vazio significa "não tenho essa
opção", e uma linha com taxa zero seria a mais barata de todas, inventando uma
porta inexistente. O rendimento da alternativa de esperar começa em zero, porque
supor rendimento otimista enviesaria a comparação.

**Com ela, nenhuma das dez pendentes dispensa pesquisa em norma.** O próximo
passo do projeto deixou de ser código.

### Adicionado · CALC-053 · carnê-leão

**Sem parâmetro legal novo:** a tabela é a mesma do IRRF mensal, já cadastrada e
conferida, e o motor é o mesmo de CALC-015. Um caso-ouro compara os dois lado a
lado em oito combinações — se divergirem, um está errado.

O que a página acrescenta é o que o carnê-leão tem de próprio. A primeira coisa
não é a conta: é o "isto vale para mim?". Ele alcança o que se recebe de outra
PESSOA FÍSICA ou do exterior — quem atende empresa já tem retenção na fonte, e
somar os dois faria recolher duas vezes sobre a mesma renda.

E a regra que quase ninguém aproveita, do § 3º do art. 6º da Lei nº 8.134/1990:
o livro-caixa não pode exceder a receita do mês, **mas o excesso não se perde** —
ele é computado nos meses seguintes, até dezembro. A calculadora tem campo para o
excesso vindo de trás e mostra o que sobra para a frente.

### Bloqueado · CALC-048 · a isenção de dividendos acabou em janeiro de 2026

Fui construir o comparador CLT vs. PJ vs. MEI e parei na premissa de partida.
Distribuição de lucros era isenta desde 1996; a **Lei nº 15.270/2025** mudou o
art. 10 da Lei nº 9.249/1995 e, pelo art. 6º-A da Lei nº 9.250/1995, dividendos
acima de R$ 50.000,00 por mês, da mesma empresa ao mesmo sócio, passaram a sofrer
retenção de 10% **sobre o total** — não sobre o excedente.

Um comparador com a premissa antiga superestima o lado PJ exatamente na faixa em
que a comparação interessa. Está registrado em §7.49, com o que falta pesquisar.

### Corrigido · a data deste ciclo estava três dias adiantada

Todo o trabalho deste ciclo foi datado **03/08/2026** na documentação e em duas
mensagens de commit de parâmetro. A data real é **06/08/2026** — a de 03/08 é a
do ciclo anterior, e foi assumida por continuidade em vez de conferida.

Parece detalhe, e não é: `Verificado contra: textos do Planalto lidos em <data>`
é uma afirmação de trilha de auditoria, e o histórico do Git é a única trilha que
este projeto tem (`05-data-model` §5). Quem for reconstituir de onde veio uma
alíquota precisa da data certa.

As datas na documentação foram corrigidas. **As duas mensagens de commit não** —
`params(inss-individual-aliquotas)` e `params(mei)` seguem dizendo 03/08/2026, e
reescrever histórico empurrado é destrutivo (`RB-06`: corrija para a frente).
Esta entrada é a correção, e é ela que vale.

Duas passagens NÃO foram alteradas, porque estavam certas: a medição do dólar em
§7.34 e a leitura do art. 15-B do Decreto nº 6.306/2007 aconteceram mesmo em
03/08/2026, no ciclo anterior.

### Adicionado · o campo de LISTA · CALC-073, CALC-075 e CALC-028

O contrato de `Campo` modelava **um valor por campo**, e três calculadoras
publicáveis dependiam de grupo repetido. Como registra o critério de crescimento
do molde — duas que precisam é medida, uma é palpite —, com três o contrato
cresceu.

`TipoCampo` ganhou `'lista'`; `Campo` ganhou `colunas`, `linhasIniciais` e
`maximoDeLinhas`. **O valor continua sendo uma string serializável para a URL**
(`RF-006`), no formato `nota,peso;nota,peso` — sem isso o permalink deixaria de
funcionar justamente nas calculadoras em que ele é mais útil, porque redigitar
oito linhas é pior que redigitar um campo.

Três decisões que a implementação fixou:

- **Linha em branco não entra na conta.** O campo abre com linhas prontas para
  preencher, e o usuário deixa linhas sobrando o tempo todo. Uma linha de zeros
  que entrasse dividiria a conta por gente que não existe ou mediria uma nota
  que ninguém tirou. `listaVazia` também não deixa essas linhas fazerem o
  formulário parecer preenchido — o estado pendente continua correto.
- **Célula que não é dígito puro vale zero.** Ver a correção abaixo.
- **A remoção de linha tem alvo de 2,5 rem**, por WCAG 2.2 2.5.8.

**CALC-073 · divisão de conta.** Dividir o total por N resolve o caso fácil e
erra o real: quase nunca todo mundo consome igual, e é aí que a conta vira
discussão. A gorjeta é distribuída **na proporção do consumo**, e o que é de
todos divide igual. A sobra do arredondamento fica com a **última pessoa**, e a
tela diz isso — é a única forma de a soma das partes fechar com o total ao
centavo, que é o defeito que alguém confere na mesa do restaurante. Caso-ouro
verifica o fechamento em quatro conjuntos que não dividem exato, com três
percentuais de gorjeta.

**CALC-075 · média ponderada.** A pergunta que traz gente à página não é "qual é
a minha média", é "quanto preciso tirar na última prova". A nota necessária
arredonda **para cima**: para baixo, tirar exatamente o valor devolvido deixaria
a média abaixo da pedida — o único erro que essa conta não pode cometer. Há
caso-ouro varrendo quatro médias desejadas por quatro pesos restantes. Avaliação
com peso zero não entra: é assim que se marca o que ainda não aconteceu.

**CALC-028 · plano de quitação.** A comparação entre bola de neve e avalanche só
é honesta porque **o desembolso mensal é o mesmo nas duas**. Se uma gastasse
mais por mês, quitaria antes por gastar mais, e a página estaria medindo a
carteira em vez da ordem. O que varia é apenas qual dívida recebe a sobra.

A avalanche sempre custa menos ou igual — aritmética, e a página diz. O que a
página se recusa a dizer é que ela é sempre a melhor escolha: a bola de neve
entrega uma dívida a menos na lista mais cedo, e desistir no meio custa mais que
a diferença de juros.

### Adicionado · CALC-047 e CALC-052 — o MEI, e a transição que quase passou batido

As duas leem o mesmo artigo — o 18-A da LC 123/2006 — e a leitura dele **não se
resolve só nele**.

**CALC-047 · DAS-MEI.** O valor é a soma de parcelas FIXAS, e faturar mil ou seis
mil no mês não muda a guia. A página não tem campo de faturamento de propósito:
ele sugeriria uma relação que não existe, e um caso-ouro trava a decisão. O que
ela explica, e quase nenhuma página explica, é por que a guia sobe todo ano — a
maior parcela dela é percentual do salário mínimo.

**CALC-052 · limite do MEI.** A pergunta que traz gente é "estourei, e agora?", e
a lei tem dois desfechos separados por uma linha de 20%: até lá o
desenquadramento vale do ano seguinte; acima, ele RETROAGE ao começo do ano e a
tributação inteira é refeita. Casos-ouro travam as três fronteiras no centavo.

O segundo engano mais comum é o limite proporcional: quem abre em outubro não tem
o teto cheio, e a lei conta fração de mês como mês inteiro.

**A transição da reforma tributária.** As alíneas com R$ 1,00 de ICMS e R$ 5,00
de ISS carregam a marca "(Vide Lei Complementar nº 214, de 2025)", e o texto
consolidado não diz o que muda nem quando. A LC 214 substitui essas alíneas por
remissões a um Anexo VII — e é o próprio Anexo que declara a vigência de cada
linha, a primeira começando em **1º/1/2027**. Os valores atuais valem até
31/12/2026.

A tabela inteira até 2033 chegou a ser cadastrada, e foi **removida** antes de
esta entrada ser escrita — ver a correção abaixo.

**Dois detalhes que mereciam errar e não erraram:**

O Anexo discrimina CBS de R$ 0,994 e IBS de R$ 0,006 — três casas decimais, que
não cabem no invariante de centavos. A soma é exatamente R$ 1,00, e é ela que se
paga; a divisão entre os dois é repartição entre entes federativos.

E a alínea que fixa o INSS do MEI diz **R$ 45,65**, valor de 2008 que ninguém
paga. É o § 11 que manda reajustá-lo mantendo equivalência com os 5% sobre o
limite mínimo — cadastrado o percentual, e não o valor.

### Corrigido · o DAS-MEI abria em 2033 e calculava com o mínimo de 2026

As vigências do Anexo VII da LC 214/2025, de 2027 a 2033, tinham sido
cadastradas. O seletor de período de uma calculadora é derivado das vigências dos
parâmetros que ela usa — e com ICMS e ISS até 2033 e o salário mínimo até 2026, a
página abria em 2033, anunciava "parâmetros legais vigentes em 15/06/2033" e
calculava o INSS com o mínimo de 2026, porque vigência aberta resolve qualquer
data futura.

Nenhuma regra foi violada, e mesmo assim a página afirmou um ano e usou outro. É
a extrapolação que `RN-003` impede, entrando pela porta dos fundos.

As vigências futuras saíram e voltam quando o salário mínimo dos anos
correspondentes existir. Encontrado rodando a calculadora em produção, pelo
segundo dia seguido.

### Corrigido · CALC-050 negava o fundamento legal que usa

Ela foi ao ar calculando certo e exibindo, abaixo do resultado, o aviso de *"esta
calculadora não consulta parâmetro legal com vigência"*. Consulta quatro.

O registro do servidor — o que resolve a cobertura de vigências — era montado com
os conjuntos enumerados à mão dentro da página, e o conjunto novo não estava lá.
Sem cobertura resolvida, o componente escolhe a redação de calculadora sem
fundamento legal.

`Calculadora.tsx` já registrava ter corrigido duas vezes o erro INVERSO — alegar
parâmetro legal onde não havia. Este é o mesmo dano na direção oposta, e passou
por toda a suíte porque os casos-ouro conferem o número, não a frase ao lado
dele.

Encontrado rodando a calculadora em produção, que é o passo 7 do roteiro de
parâmetro legal.

A lista virou uma só, em `params/data/todos.ts`, e um teste novo cobra que toda
calculadora com `parametrosRequeridos` tenha cobertura resolvível e que todo
conjunto em disco esteja na lista. Ele foi verificado reprovando antes de ser
aceito.

### Adicionado · CALC-050 · INSS do autônomo e do facultativo

**A primeira calculadora do projeto que exigiu pesquisa em norma desde o
lançamento**, e a pesquisa foi de uma tarde: o texto consolidado da Lei nº
8.212/1991 no Planalto traz o art. 21 inteiro, com as três alíquotas.

Cadastrados quatro parâmetros novos, com dispositivo e vigência:

| Parâmetro | Valor | Dispositivo | Vigência desde |
|---|---|---|---|
| Plano completo | 20% sobre o declarado | Art. 21, caput | 1º/03/2000 |
| Plano simplificado | 11% sobre o mínimo | Art. 21, § 2º, I | 1º/09/2011 |
| Facultativo de baixa renda | 5% sobre o mínimo | Art. 21, § 2º, II, "b" | 1º/09/2011 |
| Complementação | diferença até 20% | Art. 21, § 3º | 1º/09/2011 |

As datas de início vêm das cláusulas de vigência das próprias leis: a Lei nº
12.470/2011 tem art. 5º com efeitos escalonados, e a Lei nº 9.876/1999 manda
contar os efeitos de majoração de contribuição do primeiro dia do mês seguinte
ao nonagésimo dia da publicação.

**A confusão que a página desfaz:** a tabela progressiva de 7,5% a 14% é a do
segurado EMPREGADO. Quem recolhe por conta própria paga alíquota única, e nos
planos reduzidos a base é fixa no salário mínimo — não acompanha a renda. Isso
produz um comportamento que parece defeito: no plano simplificado, mudar a renda
não muda o valor a pagar. A página afirma isso em três lugares, e um caso-ouro
trava a propriedade.

**O que ela recusa a fazer.** A complementação do § 3º sai SEM os juros
moratórios, que dependem da Selic acumulada da competência. Exibir a diferença de
alíquota chamando-a de valor a pagar erraria para menos — ela é exibida com o
nome do que é.

O teto não foi cadastrado de novo: é o limite superior da última faixa da tabela
que já vive em `inss.ts`, e duplicá-lo seria convidar os dois a divergirem.

### Adicionado · CALC-056, CALC-029 e CALC-033 — e o que sobra deixou de ser código

Três de crédito e imóvel, todas sem parâmetro legal, todas sobre o motor de taxa
interna que `credito.ts` já anunciava no cabeçalho desde CALC-024.

**CALC-056 · financiamento de veículo.** Parte do preço do carro e da entrada,
que é como a decisão é tomada na loja — e não do valor liberado, que é o começo
de CALC-024. As tarifas entram DENTRO do valor financiado, porque é o que
acontece na prática, e é uma das razões de o CET ficar acima da taxa anunciada.
O IOF entra como valor digitado, não como alíquota: mesma decisão de CALC-062.

Além do CET, a página responde o que a simulação da concessionária não responde:
quanto o carro custa no fim, e em qual parcela o que já saiu do bolso ultrapassa
o preço à vista.

**CALC-029 · portabilidade de crédito.** A armadilha não é a taxa, é o **prazo**:
parcela menor com prazo maior custa mais no total, mesmo com taxa menor. Quando a
proposta alonga a dívida, o resultado mostra separadamente o que a taxa nova
entregaria **sem** alongar — é o que separa ganho de juros de alívio de caixa.

A taxa do contrato atual é descoberta pela busca, a partir do saldo devedor, da
parcela e das parcelas que faltam. Quase ninguém sabe qual é, e é ela que a
proposta precisa bater.

**CALC-033 · custo de aquisição de imóvel.** Nenhum custo aqui pode ser
cadastrado, e isso é o §14 do catálogo funcionando: o ITBI tem alíquota municipal
e os emolumentos seguem tabela estadual. O que a página entrega é o número que
trava negócio — quanto precisa estar em DINHEIRO no dia, que não é a entrada, é a
entrada mais os custos, e eles não podem ser financiados junto com o imóvel.

**O que sobra do catálogo mudou de natureza.** Das 15 pendentes, só CALC-038
dispensa pesquisa em norma. O trecho do levantamento que falava em 33
calculadoras sem dependência valia quando foi escrito — elas foram construídas.

### Corrigido · o documento de estado listava como pendentes calculadoras no ar

`indice.ts` existe porque duas listas do mesmo conjunto divergem, e
`catalogo.test.ts` existe para provar que não divergiram. O `ESTADO-DO-PROJETO`
violava essa lição em três seções ao mesmo tempo, com contagens paralelas
mantidas à mão.

As tabelas listavam CALC-011, CALC-012, CALC-013, CALC-039, CALC-040 e CALC-041
como pendentes — todas publicadas. A lista virou uma só, com o comando que a
confere contra as definições ao lado.

### Adicionado · CALC-074, CALC-067 e CALC-059 — e o bloco A acabou

Com estas três, **nenhuma calculadora do bloco A continua pendente por falta de
código**: as duas que sobram no nome do bloco têm impedimento próprio e
declarado.

**CALC-074 · conversor de unidades.** Cada unidade é declarada por uma fração de
inteiros — a polegada é 254 ÷ 10 mm, exatos, por acordo internacional de 1959 —,
e a conversão é feita com aritmética de inteiro grande. Decimal aproximado
acumularia erro numa cadeia de multiplicações e divisões por fatores como
453,59237.

Temperatura tem caminho próprio, porque não é fator: zero grau Celsius não é zero
Fahrenheit. A tela mostra o que a maioria dos conversores confunde — 1 °C de
LEITURA são 33,8 °F, mas 1 °C de VARIAÇÃO são 1,8 °F.

As unidades e as suas razões foram para `src/lib/unidades/`, fora do motor. Não
são parâmetro legal e por isso não cabiam em `lib/params/`; são quarenta números
grandes e por isso não cabiam sob `BV-10`. O que varia por região está no rótulo:
o alqueire paulista e o mineiro são áreas diferentes com o mesmo nome.

**CALC-067 · conta de água.** A tarifa é progressiva por faixa, como o INSS, e a
conta que a maioria faz — consumo × tarifa — cobra a mais, com a diferença
crescendo junto com o consumo. As faixas são campo do usuário, pela premissa do
catálogo §14: tarifa de água varia por concessionária e por município, e o
produto não estima tarifa por região.

O número que muda comportamento não é o custo médio: é **quanto custa o próximo
metro cúbico**, que é o que a economia devolve. Numa tarifa progressiva ele é
sempre o da faixa mais alta alcançada, com o esgoto por cima. Os dois aparecem
lado a lado.

O consumo mínimo faturado existe como campo porque é ele que explica a conta não
zerar de quem viajou o mês inteiro.

**CALC-059 · depreciação de veículo.** O levantamento registrava a dúvida sobre
ela existir: sem a tabela FIPE, o caminho fácil seria pedir ao usuário a taxa de
depreciação — ou seja, pedir a resposta.

Ela não pede. Pergunta quanto a pessoa pagou, quanto o carro vale hoje (consulta
gratuita na própria FIPE) e há quanto tempo, e **descobre a taxa real daquele
carro** por bisseção — melhor que qualquer média de mercado, porque é a dele. O
destaque principal é a perda por mês: o custo que não tem boleto, costuma ser
maior que o combustível, e por isso quase ninguém o soma.

### Alterado · a escala do resultado passou a ser declarada pelo cálculo

Todo valor do sistema é inteiro escalado por cem, e para dinheiro isso é exato.
Conversão de unidade não cabe nessa premissa: um milímetro em quilômetros é
0,000001, e com duas casas fixas a página imprimiria **0,00** para uma pergunta
legítima — zero é a forma mais convincente de estar errado.

`SaidaCalculadora` ganhou `casasDecimais`. A escala continua declarada; a
diferença é que agora quem declara é o cálculo, e não o tipo.

A regra de escolha da escala foi corrigida durante a construção. A primeira
versão usava "casas suficientes para quatro algarismos" e mostrava a libra como
453,59 g, escondendo cinco algarismos que a definição da unidade garante. A regra
publicada mostra o número que a conversão **tem**: se a fração termina em cinco
casas, são cinco casas; quando não termina, aí sim a régua passa a ser
legibilidade.

### Corrigido · `Number()` aceitava o que a tela nunca produz

O leitor da lista usava `Number(celula)` com teste de finitude e sinal. Não
basta: `Number('1e9')` são um bilhão, `Number('0x10')` são dezesseis,
`Number(' 5 ')` são cinco. Nada disso sai do editor — sai de URL colada ou
editada à mão, que é a única entrada do sistema que vem do mundo.

Encontrado por teste: `1e9` entrou como saldo de um bilhão de centavos em
CALC-028 e os juros o multiplicaram até **estourar o inteiro seguro**, com
exceção no lugar de resposta. Agora só dígito puro vale, que é exatamente o que
a escrita produz e o que a validação de URL aceita — as três formas coincidem de
propósito.

### Corrigido · a simulação de quitação divergia em vez de parar

`simularPlano` tinha teto de 600 meses e uma guarda de "sem progresso" que olhava
o valor disponível. As duas eram insuficientes: com pagamento abaixo dos juros
**há** progresso — paga-se algo todo mês — e o saldo cresce assim mesmo. Medido
com R$ 10.000,00 a 15% ao mês e parcela de R$ 1,00: exceção.

A guarda passou a olhar o **saldo somado**. Se ele terminou o mês igual ou maior
do que começou, o plano não anda e a simulação para, e a página responde "esse
valor por mês não quita as dívidas" — que é a resposta útil e a única honesta.

Teto de iterações protege contra laço infinito, não contra divergência.

### Alterado · vinte ramos defensivos viraram um

`listas.ts` tinha 23 ocorrências de `?? 0` para índice de linha, cada uma um ramo
que teste nenhum alcança — `lerLista` já entrega toda linha completada. Elas
derrubaram a cobertura de ramos do projeto abaixo do limite de 90%, o que é o
verificador funcionando: ele mediu que a métrica estava sendo diluída por código
inalcançável. Concentradas numa função `celula`, a garantia é a mesma e a medida
volta a medir o que deve.

---

## Ciclo de 02/08/2026

### Adicionado · CALC-046, CALC-058 e CALC-068

Três do bloco A, e as três com o mesmo cuidado: **declarar o recorte em vez de
fingir cobertura**.

**CALC-046 · dividend yield.** A armadilha aqui é de leitura, não de conta: o
yield olha para trás — divide o que já foi pago pelo preço de hoje — e **sobe
quando a ação cai**. Um produto que apresentasse o número como renda garantida
induziria justamente o erro que a métrica provoca. A página nomeia o que ele é
em todo lugar em que ele aparece, e um caso-ouro trava que preço menor com o
mesmo provento eleva o yield.

O arredondamento da renda alvo é **para cima**, de propósito: para baixo, a
quantidade de ações devolvida renderia menos que a renda pedida — errada
exatamente no sentido que decepciona. Caso-ouro sobre três alvos.

**CALC-058 · elétrico ou combustão.** Compara **energia por quilômetro, e só
isso**. Manutenção, seguro e perda de valor diferem entre os dois e ficam fora —
os dois primeiros o usuário informa em CALC-057, para cada carro, e o terceiro
não tem série pública confiável no mercado brasileiro. Incluir estimativa dos
três daria ao resultado uma aparência de completude que ele não teria.

A unidade do elétrico é **km/kWh**, e a ajuda do campo traz a conversão: as duas
formas circulam, e trocá-las erra por um fator de cem. E a calculadora admite
que o elétrico pode sair mais caro — com energia cara e consumo ruim o sinal
inverte, e há caso-ouro para isso.

**CALC-068 · botijão de gás.** Parte da **duração observada**, e não da potência
do fogão: a alternativa exigiria kcal/h dos queimadores, dado que ninguém mede.
Quanto durou o último botijão, essa a pessoa sabe — mesma escolha de CALC-057
com o IPVA.

O número que dá utilidade à página é o **custo por quilo**, porque botijões de
tamanhos diferentes não se comparam pelo preço: o de 8 kg mais barato costuma
sair mais caro por quilo. Caso-ouro verifica com os dois preços informados.

### Adicionado · CALC-062 · conversor de moeda — e a fonte que não resolveu

**A alíquota de IOF não entrou em `lib/params/`, e não foi por falta de
pesquisa.** §7.20 já registrava que a fonte oficial precisa ser a versão
**consolidada**. Esta calculadora encontrou o caso seguinte: a consolidada também
pode não responder.

O texto do art. 15-B do Decreto nº 6.306/2007 no Planalto, lido em 03/08/2026,
exibe **ao mesmo tempo** a redação do Decreto nº 12.499/2025 marcada como
*sustada* pelo Decreto Legislativo nº 176/2025, a redação anterior marcada como
*restabelecida* pelo mesmo ato, e um *Vide ADC nº 96*. O Congresso sustou o
decreto do Executivo, o Executivo levou ao Supremo, e a página oficial mostra as
três camadas sem dizer qual vige. Não é ambiguidade de leitura — é disputa em
curso.

**O IOF virou campo**, pelo caminho que `00-catalogo` §14 prescreve para dado que
o produto não pode fundamentar — o mesmo de CALC-011 com terceiros e de CALC-057
com o IPVA. O FAQ explica a disputa citando exatamente o que o texto consolidado
mostra, e não afirma alíquota nenhuma. Um caso-ouro trava isso: a etapa do
imposto não pode ter `parametro`, e o traço não aplica vigência.

E há um segundo motivo que sobreviveria mesmo sem a disputa: a alíquota não é a
mesma para espécie, cartão, transferência e remessa. Número único para todas
seria errado de qualquer jeito.

**A página continua útil sem o valor**, e é isso que autoriza publicá-la: o que
ela existe para mostrar é a **cotação efetiva** — quanto se pagou de fato por
dólar, com spread, imposto e tarifa dentro —, e esse número não depende de qual
alíquota vige. É comum a casa com a melhor cotação de tela ter a pior efetiva.

**Ela também não usa série econômica**, e isso ficou declarado em §7.34: cotação
é preço, e a máquina de séries é feita para percentual. Medido no mesmo dia, o
dólar vem com quatro casas decimais e o euro com **sete** — o normalizador
recusaria o segundo, corretamente. Encaixar preço ali é ampliação de contrato, e
§7.8 manda esperar a segunda calculadora que precise.

### Adicionado · CALC-034 · alugar ou comprar

A mais composta do catálogo, e a que mais depende de premissa — **três chutes
sobre o futuro** entram nela: valorização do imóvel, rendimento da carteira e
reajuste do aluguel. Nenhum vem embutido, e o texto diz que são do usuário.

**O que se compara não é prestação contra aluguel** — essa é a comparação que
engana. Ela ignora que quem compra constrói patrimônio a cada amortização, e que
quem aluga tem a entrada e os custos de aquisição rendendo desde o primeiro mês.
O modelo compara **patrimônio ao fim do prazo**, e a diferença mensal anda nos
**dois sentidos**: entra na carteira de quem aluga quando o aluguel é mais
barato, sai dela quando é mais caro. Modelar só um sentido daria vantagem
sistemática ao aluguel, que é o viés clássico deste tipo de conta.

**O número em destaque é a valorização de equilíbrio** — quanto o imóvel
precisaria valorizar ao ano para as duas pontas empatarem. Ele troca uma pergunta
que depende de três premissas por uma que depende de uma só, sobre a qual a
pessoa tem opinião. Um caso-ouro roda a comparação **com** essa valorização e
exige empate; sem isso o destaque seria decorativo.

### Corrigido · a afirmação sobre prazo estava errada, e foi a segunda do dia

O FAQ e a ajuda do campo diziam que *"prazos curtos costumam favorecer alugar,
por causa dos custos de aquisição"*. É o que se repete sobre o assunto, e como
afirmação geral é falso.

**Medido:** com a carteira rendendo 10% ao ano e o imóvel valorizando 4%, alugar
ganha em **3, 5, 10, 20 e 30 anos** — e a vantagem **cresce** com o prazo, porque
a diferença entre as duas taxas é composta. O prazo não inverte nada ali.

O efeito dos custos de aquisição é real e é de **segunda ordem**: ele só decide
quando as duas taxas são próximas. Com ambas a 6%, alugar sai à frente aos três
anos e comprar assume aos dez — e é esse caso, isolado, que o caso-ouro agora
trava.

**É o segundo texto corrigido por medição no mesmo dia**, depois da nota de
CALC-039 sobre isento contra tributado. Os dois erros têm a mesma forma: uma
intuição plausível sobre composição de taxas, escrita sem rodar a conta. Vale
como padrão — **afirmação sobre o mundo, neste projeto, se mede antes de
publicar**.

### Adicionado · CALC-040 · Tesouro Selic, CDB ou poupança

Nenhum motor novo: as três pernas saem de `calcularRendaFixa` e
`calcularJurosCompostos`. O que ela acrescenta é a comparação, feita pelo valor
**líquido** — comparar percentual do CDI com rendimento da poupança é comparar
coisas diferentes, e é assim que a poupança costuma parecer melhor do que é.

**A poupança não é campo, e isso é modelagem.** As outras duas são ofertas:
existe CDB a 98% e a 112% do CDI, e o usuário sabe qual recebeu. Poupança não tem
oferta — rende o mesmo em qualquer banco. Um campo ali fingiria uma escolha que
não existe, então ela entra como dado, com a data da publicação ao lado.

**A guarda do gerador compacto trabalhou.** A poupança foi primeiro posta na
lista das séries mensais, e o gerador a recusou na hora: *"buraco no calendário —
esperava 2026-08, veio 2026-07-10"*. Estava certo, a série 195 é **diária**, e um
vetor posicional por mês não a representa. Entrou pela forma certa, `ULTIMAS_TAXAS`,
que carrega um ponto só — que é tudo de que a comparação precisa.

### Adicionado · CALC-039 · CDB, LCI e LCA

**Nenhum motor novo, e nenhuma tabela nova.** O imposto é o de CALC-018, cujos
parâmetros já estão em `lib/params/` com vigência e fonte. O que ela acrescenta é
a porta de entrada que o mercado de fato usa: ninguém oferece "um CDB a 15,56% ao
ano" — oferece **"110% do CDI"**, e converter isso em rendimento é o atrito que a
página remove. O CDI abre sugerido pela Selic (`RF-012`), com a aproximação
declarada em vez de tratada como identidade.

### Corrigido · a nota sobre isento contra tributado estava errada

A nota dizia que um título isento a 95% do CDI supera um tributado a 105% **"em
prazo curto, quando a alíquota é a mais alta"**, e mandava o usuário procurar o
ponto de virada. A frase é a intuição comum do assunto, e ela é falsa.

**Medido, com CDI a 10% ao ano:** o isento ganha em 3, 6, 12, 24, 48 **e 120
meses**, e a vantagem dele **cresce** em reais ao longo de todo esse intervalo. A
virada só aparece entre dez e vinte anos.

O erro é de raciocínio, e vale registrar qual: a alíquota do imposto de fato cai
com o prazo, e a intuição para aí. O que ela esquece é que a **base** sobre a
qual o imposto incide cresce mais rápido do que a alíquota cai — então a mordida
em reais aumenta, e com ela a distância entre os dois.

Foi um caso-ouro que pegou. A primeira versão dele afirmava o mesmo que a nota,
falhou, e a medição corrigiu **os dois** — o teste e o texto de tela. É a régua
de `CLAUDE.md`: quando o teste e o produto discordam, descubra qual dos dois está
errado antes de mexer em qualquer um; aqui os dois estavam.

### Adicionado · CALC-064 e CALC-045 · as duas primeiras que PROJETAM

**São as primeiras do catálogo cujo resultado não é verificável contra nada.**
Não existe fonte para o futuro, e isso mudou o texto antes de mudar o código: a
inflação é premissa do usuário, e a página diz isso em vez de deixar o número
parecer medição. O que a série entrega é **referência** — quanto o índice de
fato acumulou nos últimos doze meses, com o mês ao lado —, exibida junto da
premissa sem virar previsão do produto.

Motor separado de `corrigirPorIndice` de propósito. Aquele aplica índices
**publicados** e recusa mês que ainda não saiu, porque o passado é dado; aqui a
taxa é hipótese. Juntá-los faria a projeção herdar a aparência de lastro que só
a correção tem.

**CALC-064 · valor futuro.** Dois números, e a diferença entre eles é o assunto:
quanto será preciso TER lá na frente, e o que a mesma quantia COMPRARÁ se ficar
parada. Dez anos a 4,5% não somam 45%, dão 55,3%.

**CALC-045 · Tesouro IPCA+.** O que ela existe para mostrar cabe em uma frase: o
imposto incide sobre o rendimento **nominal**, inclusive sobre a parte que apenas
repôs a inflação — dinheiro que não é ganho, e sim manutenção de poder de compra.
Quem olha "IPCA + 6%" e imagina 6% de ganho real depois do imposto erra, e erra
mais quanto maior a inflação. O resultado separa as duas parcelas e um caso-ouro
trava que inflação maior corrói mais o ganho real **só quando há imposto**.

E a taxa nominal não é a soma: inflação de 10% com juro real de 10% dão 21%, e
não 20%.

### Corrigido · o ganho real líquido saía um centésimo abaixo

A bisseção que resolve a taxa anual equivalente convergia para o maior inteiro
cujo fator ainda é **menor** que o alvo. Quando o alvo cai exatamente sobre um
inteiro — o caso trivial de 10% de juro real sem imposto —, aquele inteiro ia
para o teto e o piso ficava um abaixo: a tela mostrava **9,99%** onde a resposta
é 10,00%, num campo cuja função é justamente ser comparado com a taxa contratada.

Passou a escolher, entre os dois vizinhos, o que erra menos — que é o que
`taxaInternaMensal` já fazia em `financeira.ts`. Pego por caso-ouro antes de ir
ao ar.

### Adicionado · CALC-042 e CALC-041 · as duas de investimento com série

**CALC-042 · quanto rende por mês.** A pergunta que a categoria mais recebe, e a
que mais é respondida errado — de duas formas, e a calculadora ataca as duas.
Dividir a taxa anual por doze superestima: 12% ao ano são **0,95% ao mês**, não
1,00%, porque o rendimento de cada mês rende nos seguintes. E projetar pelo bruto
superestima de novo, porque renda fixa é tributada.

A conversão **não foi reescrita**: `taxaMensalEquivalente` passou a ser exportada
de `juros-compostos.ts`. Refazê-la aqui criaria duas verdades sobre a
aproximação em ponto flutuante que aquele motor declara — e elas divergiriam na
primeira vez que alguém mexesse em uma.

A alíquota é campo, e o motivo está no motor: quem apura a tabela regressiva é
CALC-018, que já tem os parâmetros cadastrados com vigência. Duplicar a tabela
aqui seria uma segunda cópia de constante legal, que a regra 1 impede.

**CALC-041 · rendimento da poupança.** Ela **não reimplementa a regra de
remuneração**, e isso é decisão: a fórmula que combina Selic e TR está em lei, e
transcrevê-la criaria constante legal fora de `lib/params/`. O caminho tomado é
mais forte — o Banco Central **publica a taxa já apurada**, mês a mês, na série
195, e é ela que abre no campo, com a data ao lado.

A consequência honesta disso está no texto: o que a conta projeta é o rendimento
**se a taxa se repetir**, e ela muda quando a taxa básica muda.

Nenhum motor novo: é `calcularJurosCompostos` com a taxa vinda da série. As duas
usam `sugestaoDeSerie`, que era o caso de uso original de `RF-012` e agora serve
três calculadoras.

### Adicionado · CALC-061, CALC-063 e CALC-037 · o bloco de índices

As três primeiras que o `ADR-006` destravou depois de CALC-060, e as três
reaproveitam `corrigirPorIndice` inteiro. O que cada uma acrescenta é o recorte,
e é nele que está o valor.

**CALC-061 · poder de compra.** Ela existe para desfazer uma confusão, e por isso
mostra os **dois sentidos juntos**: R$ 1.000,00 de 2015 *equivalem a* R$ 1.600,00
hoje, e R$ 1.000,00 de hoje *compram o que* R$ 625,00 compravam em 2015. Os dois
números saem do mesmo fator — um multiplica, o outro divide — e trocá-los é o
erro clássico do assunto.

**E a perda de poder de compra não é o simétrico da inflação:** 60% de inflação
são **37,5%** de perda, porque o poder de compra vira um dividido por 1,6. Um
caso-ouro trava exatamente esse número.

**CALC-063 · reajuste de salário.** O risco aqui é de linguagem, não de conta:
`RN-028` proíbe dizer a alguém a que tem direito, e reajuste se negocia. O texto
diz o que a conta é — a medida do salário que manteria o poder de compra — e o
que ela não é. O campo do reajuste oferecido é o que a torna útil na conversa, e
**a comparação é feita em reais**: comparar percentuais direto ("ofereceram 4%,
a inflação foi 5%") sugere uma perda de 1% que não é a real.

**CALC-037 · reajuste de aluguel.** A primeira com correspondente no projeto
irmão — `reajuste-aluguel`, no ar lá desde 26/07/2026. `ESTADO-DO-PROJETO` §6.4
já decidiu construir assim mesmo, e a decisão segue sujeita ao que os 90 dias de
MR-2 mostrarem. O índice é o do **contrato**, e o texto diz isso em vez de
sugerir que existe um "correto": o IGP-M é o padrão histórico e é o padrão do
campo, mas contratos migraram para IPCA em massa depois de 2020.

**O mapa de índices vive num lugar só** (`indices-comuns.ts`). Quatro
calculadoras montando a própria lista seriam quatro listas do mesmo conjunto — e
`indice.ts` é o registro vivo de que duas listas do mesmo conjunto divergem.

### Adicionado · CALC-060 · correção de valor por índice

A primeira que consome série econômica, e a que estabelece o padrão para as
outras de índice — CALC-061, CALC-063, CALC-064 e CALC-037.

**O orçamento foi o problema de desenho, e não a conta.** A correção calcula no
NAVEGADOR, sobre o intervalo que o usuário escolhe: não há como resolvê-la no
servidor como se faz com a sugestão de taxa. E o cache completo tem 60 kB de
objetos `{data, valor}`, o que sozinho estouraria os 30 kB de parte variável que
`RNF-004` permite a uma rota.

A saída foi uma **segunda forma da mesma série**, gerada pelo coletor: um mês
inicial e um vetor posicional de inteiros. As três séries mensais couberam em
5,2 kB de fonte, e a rota fechou em **115,3 kB — 2,4 kB de parte variável**, com
vinte anos de IPCA, INPC e IGP-M dentro. O gerador percorre o calendário e
**recusa gravar** se a origem pular um mês: vetor posicional com buraco sairia
deslocado, errado por um número plausível.

**A convenção da janela está declarada porque muda o resultado.** Corrigir de
março para julho aplica os índices de abril a julho — quatro meses, não cinco. O
índice de março mede a variação ocorrida *durante* março, que já está no valor de
março. A memória nomeia o primeiro e o último mês aplicados e diz quantos foram,
para que a conferência não dependa de acreditar na nota.

**Selic e TR aparecem desabilitadas, com "Em breve".** As duas são séries diárias
na origem, e convertê-las em fator mensal exige uma decisão de convenção que
ainda não foi tomada. `OpcaoSelecao.indisponivel` existe para isto: declarar o
que falta em vez de sugerir cobertura que não há.

Os casos-ouro usam série **sintética**, de meses de 1% exatos. Índice real muda a
cada coleta, e caso-ouro que dependesse dele falharia sozinho todo mês — o que
ensina a ignorar vermelho. O dado real é coberto à parte, por invariantes que não
fixam valor nenhum.

### Adicionado · `ADR-006` implementado · a série econômica do Banco Central

A dependência de maior alcance que restava no projeto. **Uma implementação
destrava doze calculadoras** — CALC-034, CALC-037, CALC-039 a CALC-042, CALC-045
e CALC-060 a CALC-064.

**O endpoint foi medido, e não copiado.** `06-api-spec` §4.1 exige isso em letras
maiúsculas, e `ESTADO-DO-PROJETO` §6.0 registra que a ficha do projeto irmão é
ponteiro, nunca fonte. A medição de 02/08/2026 está em `docs/20-fonte-bcb-sgs.md`
e resultou em: três armadilhas da ficha **confirmadas**, uma **corrigida** e
**duas novas**.

| # | Armadilha | Situação |
|---|---|---|
| 1 | `valor` é string com ponto decimal | ✅ confirmada |
| 2 | `data` em `dd/MM/aaaa` | ✅ confirmada |
| 3 | Defasagem de ~1 mês | ✅ confirmada — e **desigual entre séries** |
| 4 | **A ordem difere por série** | ⚠️ nova |
| 5 | **O schema não é uniforme** (`dataFim`) | ⚠️ nova |
| 6 | "Janela de 10 anos" | ❌ **errada como regra geral** |

**A quarta é a que teria custado um defeito em produção.** As séries `4189` e
`433` voltam em ordens **opostas** na mesma chamada `ultimos/N`. Ler o último
item do array como "o mais recente" acerta numa e erra na outra — devolvendo o
valor de um mês vizinho, plausível e errado. O coletor ordena por data antes de
gravar, e um caso-ouro roda as duas capturas reais.

**A sexta derrubou a primeira execução do coletor**, com 400 nas seis séries: o
`ultimos/N` tem teto de vinte, e o serviço diz isso em texto no corpo do erro. Em
compensação, o endpoint por intervalo aceitou **20 anos** de série mensal sem
reclamar — 246 pontos numa requisição. O limite acompanha a quantidade de
pontos, não a de anos.

**A escala não é basis point, e isso é decisão.** A TR e a poupança são
divulgadas com quatro casas — 0,1729% —, e arredondá-las a basis point mudaria o
valor em até 3%. É o mesmo problema de §7.30, com a saída que aquele caso não
permitia: como a grandeza é **publicada** e não digitada, a escala pode
acompanhar a publicação. O valor é o percentual vezes 10.000, e `paraBasisPoints`
converte com política declarada.

**O que o plano de falha entregou, verificado na prática:** quando as seis séries
falharam com 400, o script registrou aviso, manteve o cache e **encerrou com
código zero**. Foi a regra R-3 funcionando antes de alguém precisar dela.

### Corrigido · a sugestão de série quase tirou uma calculadora do índice

`RF-012` faz a taxa de juros compostos abrir preenchida com a Selic corrente. O
valor **não** está em `campo.padrao` — é resolvido no servidor a cada build —, e
`escreverNaUrl` comparava só com o padrão declarado. Com isso a página nasceria
com `?taxa=1415`, e query implica `noindex`.

A calculadora sairia do índice **sozinha e em silêncio**, no único canal de
aquisição que o produto tem. É a mesma classe de defeito que §7.2 registra sobre
o `ref=`, por um caminho novo — e por isso ganhou um teste irmão em
`permalink.spec.ts`, que também verifica que o campo está de fato preenchido: um
teste que passasse por não haver sugestão nenhuma seria a forma mais fácil de
mentir aqui.

`escreverNaUrl` passou a receber o estado com que o formulário abriu, e a omitir
o que não mudou em relação a ele.

Três calculadoras — CALC-043, CALC-065 e CALC-069 — e a correção de um limite do
próprio verificador de orçamento.

### Adicionado · CALC-049 · precificação de hora

`docs/18` §3.6 nomeou o risco antes de a calculadora existir: *"o risco é a
calculadora parecer prescritiva"*. Ela não diz quanto alguém vale nem quanto o
mercado paga — resolve uma **conta de cobertura** sobre premissas que o usuário
informa, e a nota de tela declara que as duas perguntas são diferentes.

**Duas coisas separam esta conta da divisão ingênua**, e as duas aparecem lado a
lado no resultado, de propósito:

1. **A hora faturável.** Prospecção, orçamento, retrabalho, emissão de nota e
   administração ocupam expediente e ninguém paga por elas. O percentual é campo
   obrigatório, não premissa escondida — com 100%, a conta desta calculadora vira
   a ingênua, e um caso-ouro exige exatamente essa coincidência.
2. **O imposto por dentro.** Faturar e pagar 12% não deixa 88% de sobra útil:
   para sobrar R$ 8.800,00 é preciso faturar R$ 10.000,00, e não R$ 9.856,00. Um
   caso-ouro compara os dois caminhos e trava a diferença.

A alíquota é digitada, e o motivo está declarado no motor: as faixas do Simples
dependem do anexo da atividade e da receita bruta acumulada, que é `docs/18` D-3
— pesquisa que este módulo não faz e **não finge fazer**.

### Adicionado · CALC-043, CALC-065 e CALC-069

**CALC-043 · meta de independência financeira.** A terceira do catálogo a tratar
um número de bolso como campo, depois dos 30% de CALC-032 e dos seis meses de
CALC-044. A regra dos 4% vem de um estudo sobre carteiras americanas do século
passado, que mediu quanto uma retirada anual sobreviveu aos piores trinta anos
daquela série — não é lei, não é garantia, e não foi medida sobre juro
brasileiro. É o padrão declarado do campo, e a memória diz que a escolha foi do
usuário.

O laço de acumulação **não foi duplicado**: `acumularAte` saiu de dentro de
CALC-044 e passou a ser função compartilhada em `reserva.ts`. As duas fazem a
mesma pergunta em escalas diferentes — uma acumula meses de despesa, a outra o
patrimônio que sustenta a despesa —, e duas cópias do mesmo laço divergiriam na
primeira manutenção.

**CALC-065 · consumo de energia por aparelho.** A tarifa é campo por regra do
catálogo, não por escolha: `00-catalogo` §12 determina que ela venha da fatura,
com instrução de onde achá-la, e **proíbe estimativa por região**. O FAQ traz o
atalho que melhora a estimativa — dividir o valor total da fatura pelo consumo do
mês, com o que bandeira, tributos e iluminação pública já entram no número — e
declara o limite da conta: aparelho com termostato não consome potência cheia
vezes tempo.

**CALC-069 · orçamento 50/30/20.** A quarta a tratar regra de bolso como campo. O
50/30/20 vem de um livro, e os três percentuais são editáveis: quem precisa de 70
para necessidades informa 70, e a conta acompanha em vez de dar veredito. Somar
acima de cem por cento é recusado, com o total informado na mensagem.

**A linha "ainda sem destino" é o que faz a coluna fechar.** As três fatias são
arredondadas ao centavo uma a uma, e a diferença para a renda informada aparece
nomeada — seja porque os percentuais somam menos de cem, seja pelos centavos da
divisão. Sem ela, a soma da tela ficaria alguns centavos abaixo da renda, que é o
defeito de §7.12 em miniatura. Um caso-ouro roda doze combinações de renda e
divisão e exige a identidade em todas.

### Corrigido · o verificador de orçamento estourou o próprio recorte

`verificar-orcamento.ts` lia o mapa de hashes do runtime do empacotador dentro de
uma janela fixa de **2.000 caracteres** a partir de `.u=`. O primeiro dicionário
daquele trecho — o dos nomes de pedaço — cresce uma entrada por calculadora, e
com trinta e cinco publicadas o segundo dicionário, o dos hashes, caiu fora da
janela.

**O script fez exatamente o que devia: falhou alto**, com a mensagem certa sobre
não conseguir ler o mapa. Só que o motivo da falha era ele, e não o build — e
diagnosticar isso custa uma sessão olhando para o lugar errado.

O recorte passou a ir de `.u=` até o `".js"` que fecha a própria função, que é um
limite **estrutural** e não estimado. É a lição de §7.5 com um giro: verificador
que falha por limite próprio não é tão perigoso quanto o que passa por deixar de
olhar, mas ainda custa caro.

---

## Ciclo de 01/08/2026

Quatorze calculadoras: CALC-026, CALC-070, CALC-054, CALC-023, CALC-010, CALC-008,
CALC-009, CALC-030, CALC-011, CALC-012, CALC-018, CALC-013, CALC-032 e CALC-031.
O bloco de desligamento fechou, e o de crédito chegou a cinco.
CALC-023 trouxe o primeiro parâmetro legal do bloco de crédito.

### Adicionado · CALC-071, CALC-055 e CALC-057 · aritmética e veículos

**CALC-071 · regra de três, simples e composta.** Entrou no módulo de
`aritmetica.ts`, ao lado de porcentagem e álcool-ou-gasolina, pela razão que o
cabeçalho daquele arquivo já dava: elas compartilham a peça que as torna
possíveis, que é a declaração de unidade de `traco.ts`.

A conta é trivial e **a armadilha não é**: nenhuma calculadora descobre sozinha
se mais operários significam menos tempo ou mais tempo. Isso está no enunciado do
problema, não na aritmética, e escolher errado devolve um número plausível — a
forma mais cara de errar. O sentido de cada grandeza é **campo**, com os dois
casos nomeados em linguagem comum, e a memória declara qual foi aplicado. Na
composta, cada grandeza entra separadamente e o **valor intermediário aparece**,
que é onde se confere se o sentido escolhido fazia sentido.

**CALC-055 · custo de viagem.** O erro mais comum ao estimar uma viagem não é de
aritmética: é contar só a ida. Ida e volta é campo com padrão declarado, e a
duplicação é etapa própria da memória. O custo do combustível é derivado dos
**litros já arredondados**, e não de uma fórmula direta que os ignoraria: quem
confere "50 litros × R$ 6,00" no celular precisa chegar ao número da tela.

**CALC-057 · custo mensal de ter um carro.** Ela existe para desmontar a frase
"o carro já está aí mesmo" — o custo que se tem em mente ao dizê-la é o do posto,
e o resultado mostra que o mês custa mais que o dobro disso quando IPVA, seguro,
licenciamento, manutenção e perda de valor entram. IPVA e licenciamento são dado
estadual, que `00-catalogo` §14 exclui: entram como valor digitado, tirado do
documento que o usuário tem em mãos, que é a saída que a própria exclusão
prescreve.

**A decisão que mais afeta o resultado dela** está no motor e tem caso-ouro
próprio: cada custo anual é dividido por doze **já arredondado**, e o total é a
soma das linhas mensais. Somar tudo e dividir no fim daria um total alguns
centavos distante da coluna exibida — "cada número certo, a soma errada", que
`ESTADO-DO-PROJETO` §7.12 registra como o pior defeito que este produto pode
publicar.

Rotas novas entre 114,0 e 114,4 kB. Parte variável máxima do catálogo inalterada,
em 16,2 kB de 30.

### Adicionado · CALC-036, CALC-035 e CALC-044 · a fila do bloco A começou

As três primeiras do **bloco A do v3** — o conjunto que `docs/18` §1 identificou
como "não depende de nada que não exista hoje". Com o v2 esgotado até onde ia sem
dependência externa (§4.2 de `ESTADO-DO-PROJETO`), é esta a fila que continua.

**CALC-036 · amortização extra: prazo ou parcela.** Ela preenche um buraco real
de CALC-026, e não é repetição dela. A quitação antecipada parte do **valor da
parcela** e deduz o saldo devedor a valor presente — o que pressupõe parcela
constante, ou seja, sistema francês. Num financiamento no SAC as prestações não
se repetem, e o caminho não serve; o extrato, por outro lado, já traz o **saldo
devedor**, que é por onde esta começa. E as duas escolhas aparecem **juntas**,
sem o usuário ter de optar antes de ver o resultado: a escolha é o que ele veio
decidir, e o banco costuma oferecer uma das duas sem mencionar a outra.

O caso-ouro foi montado para ser conferível de cabeça: R$ 200.000,00 em 200
prestações no SAC amortizam R$ 1.000,00 por mês, então R$ 20.000,00 de extra
eliminam exatamente vinte prestações. A afirmação que a página faz — encurtar o
prazo economiza mais que baixar a prestação — é **testada nos dois sistemas**, e
não afirmada.

**CALC-035 · rentabilidade de imóvel para locação.** O que ela existe para
mostrar é a distância entre dois números: a rentabilidade bruta, que é a do
anúncio, e a líquida, que é a que chega. A conta é feita **em um ano**, e não em
um mês, porque três dos quatro custos são anuais ou intermitentes — mensalizar
antes de somar obrigaria a inventar um duodécimo para a vacância, que não
acontece todo mês. O IPTU varia por município, e `00-catalogo` §14 exclui dado
hiperlocal: ele entra como campo, que é o que a própria exclusão prescreve.

Ficam **declaradamente** de fora a valorização do imóvel — que é expectativa, não
dado, e projetá-la daria a uma previsão a mesma aparência de solidez do resto da
página — e o imposto de renda sobre o aluguel, que é conta sobre a pessoa e não
sobre o imóvel.

**CALC-044 · reserva de emergência.** Mesmo tratamento que CALC-032 deu aos "30%
da renda": os seis meses que todo mundo repete **não estão em norma nenhuma**, e
por isso são campo com padrão declarado como praxe — a memória de cálculo diz, na
etapa, que a escolha foi do usuário. A calculadora estima valor e prazo e
**declina** a pergunta seguinte: onde guardar é decisão que ela não toma.

Sem aporte informado, ela diz que não há prazo a estimar em vez de devolver o
teto do laço de simulação. Um "1.200 meses" seria lido como cálculo, e é limite
de guarda — o mesmo erro de categoria que §7.5 registra sobre verificador que
sempre passa.

Rotas novas em 113,5 a 114,2 kB, todas com parte variável abaixo de 2 kB.

### Adicionado · CALC-031 · financiamento imobiliário, com os encargos dentro

O que a separa de CALC-025 não é a amortização — é o que o banco cobra ao lado
dela. Seguro de morte e invalidez, seguro de danos ao imóvel e tarifa mensal de
administração não aparecem na taxa anunciada, entram em toda prestação e, num
contrato de trinta anos, respondem por uma fatia que surpreende quem só olhou o
percentual. A calculadora existe para exibir essa fatia, e o resultado a declara
em número e em proporção do total pago.

**Nenhum dos três é estimado.** `docs/18` §3.2 já registrava o motivo — os
prêmios variam por seguradora, por banco e pela idade do tomador, e não há fonte
oficial que os fixe. São campos, preenchidos com o que está na simulação do
banco. Com eles em branco, o resultado mostra apenas amortização e juros, e
nenhuma linha de seguro aparece: não há zero a explicar.

**A única modelagem assumida, e onde ela está declarada.** O MIP incide sobre o
saldo devedor e o DFI sobre o valor de avaliação do imóvel. O primeiro cai a cada
mês junto com o saldo; o segundo não muda, porque a base dele não muda. Como o
que o usuário tem em mãos é o prêmio da **primeira** prestação, o dos meses
seguintes sai pela proporção do saldo — que é o que "incide sobre o saldo
devedor" significa. Nenhuma alíquota é inferida e exibida como se fosse do
contrato: o que entra na conta é a proporção, e ela está na memória de cálculo,
na nota e no FAQ.

**O que a calculadora declara não fazer**, em vez de deixar o usuário descobrir
depois: o saldo devedor não é corrigido por índice, e contratos do sistema
financeiro da habitação costumam corrigi-lo mês a mês; o prêmio do seguro não é
reajustado pela idade do segurado; e os custos de aquisição — ITBI, cartório,
avaliação — ficam fora, porque são pagos uma vez e fora da prestação.

**Conferência por concordância, não por tabela de terceiro.** Sem parâmetro legal
e sem fonte contra a qual comparar, os casos-ouro se apoiam em duas coisas: a
identidade *total = financiado + juros + seguros + tarifa*, que quebra se
qualquer mês estiver errado, e a exigência de que, com os encargos zerados, este
motor reproduza `calcularAmortizacao` **centavo a centavo** nos dois sistemas.
São duas implementações independentes da mesma amortização, e a coincidência pega
o erro que nenhuma das duas pegaria sozinha.

O detalhamento decompõe o total em quatro linhas que somam a última — e um
caso-ouro roda a função da **definição**, não a do motor, para travar isso.
É o defeito de `ESTADO-DO-PROJETO` §7.12: em CALC-023 cada número estava certo e
a coluna não fechava, porque a escolha de quais valores exibir acontece fora do
motor.

Rota nova em 114,5 kB, com 1,9 kB de parte variável. Nenhuma rota existente se
moveu — o motor é arquivo próprio, e não uma ampliação de `credito.ts`, que teria
engordado CALC-024, CALC-025 e CALC-026 sem benefício para elas.

### Adicionado · `cartao-teto-juros-encargos` · a partir de 2024-01-03

**Valor:** 100% (10.000 basis points) do valor original da dívida.

**Fonte:** Lei nº 14.690, de 3 de outubro de 2023, art. 28, § 1º —
*"o total cobrado em cada caso a título de juros e encargos financeiros não
poderá exceder o valor original da dívida"*.
`https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/L14690.htm`

**Verificado contra:** o texto compilado do Planalto, lido na íntegra em
01/08/2026, e a versão consolidada da Resolução CMN nº 4.549/2017 publicada pelo
Banco Central em `normativos.bcb.gov.br`, que traz as alterações da Resolução CMN
nº 5.112/2023 marcadas dispositivo a dispositivo.

**Por que a vigência começa em 03/01/2024 e não na publicação.** O art. 28, § 1º
condiciona o teto ao decurso de 90 dias sem aprovação dos limites de
autorregulação. A Resolução CMN nº 4.549/2017, art. 2º-D (incluído pela 5.112),
declara que o teto *"se aplica somente às operações realizadas após o prazo de 90
(noventa) dias"*. Registrar a data de publicação aplicaria o limite a três meses
em que ele não existia — e `RN-002` resolve por data, então o erro produziria
número errado com aparência de certo em toda fatura do último trimestre de 2023.

**Casos-ouro afetados:** `tests/golden/rotativo.test.ts`, inclusive um caso que
exige `vigencia_ausente` em 30/11/2023 — a data anterior à eficácia precisa
**bloquear** o cálculo, nunca extrapolar.

### Adicionado · CALC-023 · rotativo do cartão

A conta intuitiva do rotativo está errada por estrutura, não por aritmética.
A Resolução CMN nº 4.549/2017 limita o rotativo a **um ciclo** (art. 1º) e obriga
a migração para um parcelamento mais barato (art. 2º); simular doze meses de
rotativo descreve algo proibido desde 2017. E o teto do art. 28, § 1º da Lei
14.690/2023 vale para a cadeia inteira: na migração, o valor original continua
sendo o montante inicial do rotativo e os juros são contados desde o início dele.

Aviso contextual próprio, como `00-catalogo` §6 exige da categoria de crédito.

**Recusado por falta de fonte:** uma pergunta do FAQ afirmava que o pagamento
mínimo de 15% foi revogado em 2017. Não foi possível confirmar em fonte oficial;
a pergunta foi substituída por outra, não suavizada. Regra 10.

### Adicionado · CALC-026 · quitação antecipada

Art. 52, § 2º do Código de Defesa do Consumidor: a liquidação antecipada se dá
*"mediante redução proporcional dos juros e demais acréscimos"*. O saldo devedor
de hoje é o **valor presente** das parcelas que faltam, não a soma delas.

### Adicionado · CALC-070 · porcentagem · e CALC-054 · álcool ou gasolina

As duas primeiras cujo resultado nem sempre é dinheiro. Exigiram a declaração de
unidade em `Etapa` e em `SaidaCalculadora`, e o tipo de campo `decimal`.

CALC-054 **não usa a regra dos 70%**: ela é a razão média de rendimento entre os
combustíveis e varia por veículo. O consumo real é entrada obrigatória, e o preço
de equilíbrio calculado a partir dele é a régua que substitui a regra decorada.

### Adicionado · prazos do banco de horas · a partir de 2001-08-24 e 2017-11-11

**Valores:** 12 meses por norma coletiva; 6 meses por acordo individual escrito;
1 mês por acordo individual tácito.

**Fonte:** CLT, art. 59, § 2º (redação da MP nº 2.164-41/2001) e §§ 5º e 6º
(incluídos pela Lei nº 13.467/2017).
`https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm`

**Verificado contra:** o texto compilado do Planalto, lido em 01/08/2026.

**Duas vigências, e a diferença conta uma história.** O prazo de um ano por norma
coletiva existe desde 2001. Os outros dois são criação da Reforma Trabalhista —
antes dela o banco de horas só podia ser pactuado coletivamente. Registrar os
três com a mesma data apagaria isso e daria resposta errada para contrato
encerrado antes de novembro de 2017. Um caso-ouro trava a fronteira.

### Adicionado · CALC-013 · banco de horas · e CALC-032 · capacidade de financiamento

CALC-013 responde a pergunta que importa, que é sobre dinheiro: o art. 59, § 3º
manda pagar o saldo não compensado na rescisão, sobre a remuneração da data da
saída e com adicional. Saldo negativo é tratado pelo que é — tempo a cumprir, não
dívida —, com o art. 59-B citado.

CALC-032 é a conta de CALC-024 lida de trás para frente: parte da renda e chega
ao valor financiável, com `valorPresenteDeSerie`. **O percentual de
comprometimento não virou parâmetro legal**, porque não é lei nenhuma — é
política de crédito. Ele é campo, e a memória de cálculo declara isso na etapa.

### Corrigido · CALC-019 foi sugerida por engano

Foi anunciada como próxima com a justificativa de que "não esbarra no
ano-calendário problemático". `docs/18` registra o contrário: ela **é CALC-017
rodado duas vezes** — compara os dois modelos da declaração ANUAL e depende da
mesma tabela não localizada. Fica bloqueada junto com a 017.

### Adicionado · `ir-renda-fixa-*` · a partir de 2005-01-01

**Valores:** 22,5% até 180 dias; 20% de 181 a 360; 17,5% de 361 a 720; 15% acima
de 720.

**Fonte:** Lei nº 11.033, de 21 de dezembro de 2004, art. 1º, I a IV. A vigência
sai do próprio caput — "relativamente às aplicações e operações realizadas a
partir de 1º de janeiro de 2005".
`https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm`

**Verificado contra:** o texto compilado do Planalto, e a página da Medida
Provisória nº 1.303/2025, ambos lidos em 01/08/2026.

⚠️ **UMA MP QUASE MUDOU TUDO ISSO, E CADUCOU.** A MP nº 1.303, de junho de 2025,
propunha substituir a tabela regressiva por alíquota única e tributar os títulos
hoje isentos. O texto compilado traz "(Vide Medida Provisória nº 1.303, de 2025)"
ao lado de quase todo dispositivo, o que assusta na primeira leitura — mas a
etiqueta seguinte é **"Vigência encerrada"**, e ela está também no cabeçalho da
própria MP. A tabela da Lei nº 11.033 vale exatamente como escrita.

Segundo caso do dia, depois do art. 2º da Resolução CMN nº 4.765: norma que
existe no texto e não vale mais.

**Os prazos entraram como parâmetro junto com as alíquotas.** A fronteira dos 180
dias é tão legal quanto os 22,5%, e uma alíquota sem o prazo que a delimita não
significa nada. O tipo `tabela_faixas` não serviu: ele mede limites em centavos, e
estes são medidos em dias.

### Adicionado · CALC-018 · IR sobre renda fixa

Reaproveita o motor de CALC-022 inteiro — capitalização com conversão de taxa
anual em mensal equivalente — e acrescenta a mordida do imposto. Mostra também
quanto se ganha esperando a faixa seguinte, que é a informação acionável: a
alíquota alcançada incide sobre TODO o rendimento acumulado, não sobre o do
último período.

### Alterado · `RNF-004` revisado de 135 para 150 kB, com um guarda-corpo novo

As três rescisões subiram 5,6 kB numa única sessão — o motor compartilhado ganhou
a extinção por acordo e o regime doméstico — e a folga caiu de 11,5 para 5,9 kB.
A próxima calculadora a tocar aquele motor estouraria sem ter feito nada errado.

**Subir o teto sozinho seria puro afrouxamento.** O propósito de `RNF-004` não é
desempenho — quem mede a experiência é `TC-049` (LCP) —, é guarda-corpo contra
crescimento por descuido, e um guarda-corpo que se afasta toda vez que alguém
encosta nele não é guarda-corpo.

Entrou junto um segundo limite: a **parte variável** de cada rota, medida contra
a rota mais leve, com teto de 30 kB. O piso é o mesmo em toda rota e não cresce
com o catálogo; o que varia é o motor e as tabelas de cada calculadora, e é aí
que uma dependência indevida apareceria. Hoje: 16,7 kB de 30, na rescisão
doméstica.

### Adicionado · parâmetros do trabalho doméstico · a partir de 2015-06-02

**Valores:** indenização compensatória de 3,2%; aviso prévio de 30 dias, mais 3
por ano, até 90.

**Fonte:** Lei Complementar nº 150, de 1º de junho de 2015, art. 22 e art. 23.
Vigência pelo art. 47 — data da publicação, DOU de 2.6.2015.
`https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm`

**Verificado contra:** o texto do Planalto, lido na íntegra em 01/08/2026.

**A remissão negativa é o ponto.** O art. 22 diz que o depósito de 3,2% se
destina à indenização pela perda do emprego *"não se aplicando ao empregado
doméstico o disposto nos §§ 1º a 3º do art. 18 da Lei nº 8.036"* — e esses
parágrafos são justamente os da multa de 40%. No doméstico ela **não existe**.

**Os parâmetros de aviso prévio são duplicados de propósito.** Repetem os números
da Lei nº 12.506/2011 com fundamento próprio, porque o contrato doméstico não é
regido por ela. Reaproveitar os da CLT faria a memória citar uma lei que não rege
aquele contrato. Um caso-ouro trava a citação nos dois regimes.

### Adicionado · CALC-012 · rescisão do empregado doméstico

Entrou como `regime`, eixo **ortogonal** à modalidade — e não como uma quarta
modalidade. Um doméstico também pode ser dispensado, pedir demissão ou fazer
acordo; empilhar "doméstico" naquele eixo criaria combinações impossíveis.

O campo é obrigatório, e o compilador cobrou de todo chamador: seis literais de
entrada, em três definições e três arquivos de caso-ouro, pararam de compilar até
declararem o regime. Nada passou a ser doméstico ou celetista por omissão.

### Adiado · CALC-017 · restituição do IRPF anual, por fonte

A página de tabelas da Receita traz a progressiva ANUAL do ano-calendário 2026 —
e a declaração que se entrega hoje é a do ano-calendário 2025, ano em que a
tabela mensal mudou em maio. A anual de 2025 é um conjunto próprio de números,
que não foi localizado. Construir sobre a tabela do ano errado produziria
exatamente o dano que o projeto existe para evitar.

### Adicionado · `cheque-especial-teto-juros-mes` · a partir de 2020-01-06

**Valor:** 8% ao mês.

**Fonte:** Resolução CMN nº 4.765, de 27 de novembro de 2019, art. 3º —
*"as taxas de juros remuneratórios cobradas sobre o valor utilizado do cheque
especial estão limitadas a, no máximo, 8% (oito por cento) ao mês"*. Vigência
pelo art. 6º.
`https://normativos.bcb.gov.br/Lists/Normativos/Attachments/50875/Res_4765_v2_P.pdf`

**Verificado contra:** o PDF **consolidado** do Banco Central, lido em
01/08/2026.

⚠️ **O art. 2º da mesma resolução NÃO vale mais, e quase virou parâmetro.** Ele
admitia tarifa de até 0,25% ao mês sobre o limite que excedesse R$ 500,00, e foi
revogado a partir de 1º/11/2021 pela Resolução CMN nº 4.962/2021 — além de
declarado inconstitucional pelo STF na ADI 6.407-DF. Toda descrição secundária
que circula ainda cita a tarifa, porque descreve o texto de 2019. Só o PDF
consolidado traz a tarja.

**Corolário para a próxima auditoria:** a fonte oficial precisa ser a versão
CONSOLIDADA. O texto original publicado no DOU traria o artigo vivo, sem nenhuma
marca de que ele morreu depois.

### Adicionado · `contribuicao-patronal` e RAT · a partir de 1999-11-26 e 1998-12-11

**Valores:** 20% de contribuição patronal; RAT de 1%, 2% e 3%.

**Fonte:** Lei nº 8.212, de 24 de julho de 1991, art. 22, I e II, com a redação
das Leis nº 9.876/1999 e nº 9.732/1998.
`https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm`

**Verificado contra:** o texto compilado do Planalto, lido em 01/08/2026.

A alíquota de **terceiros** (Sistema S) NÃO entrou como parâmetro: varia por
código FPAS e depende de tabela mantida por outro órgão. Virou campo do usuário,
que é o que `00-catalogo` §14 prescreve para dado indispensável e hiperlocal.

### Adicionado · `STF_TEMA_985` como fundamento

*"É legítima a incidência de contribuição social sobre o valor satisfeito a
título de terço constitucional de férias."* RE 1.072.485, com modulação a partir
de 15/09/2020 — reverte a tese anterior do STJ, de 2014, que dava natureza
indenizatória ao terço. É a decisão que mais mexeu no custo de folha na década, e
CALC-011 a cita na etapa dos encargos sobre provisões.

### Adicionado · CALC-030 · cheque especial · e CALC-011 · custo do funcionário

CALC-030 é a prima do rotativo: mesmo argumento, mesmo aviso contextual. O número
que ela existe para mostrar é o anual — 8% ao mês, capitalizados, passam de 150%
ao ano. O teto é alto, não baixo.

CALC-011 é a primeira do catálogo escrita do lado do empregador, e a que mais
perto passa da fronteira do §14. O que a mantém do lado certo: só alíquotas do
corpo da Lei nº 8.212/1991, terceiros como campo, e Simples Nacional, desoneração
e FAP declarados como fora — em nota, no aviso e no FAQ.

### Corrigido · markdown vazando para o texto de tela

`**Simples Nacional**` foi ao ar em CALC-011 com os asteriscos à mostra. Notas,
destaques, FAQ e ajuda são renderizados como texto puro, por decisão de
`ADR-009`. `catalogo.test.ts` passou a varrer todo texto de tela de toda
calculadora publicada e a reprovar asterisco de ênfase e acento grave.

### Corrigido · dois casos-ouro errados, pelo mesmo motivo

`R$ 2.000,00 × 0,8 = R$ 1.600,00` em CALC-009 ignorava o piso do salário mínimo;
`1,08^12 − 1 = 15.182` em CALC-030 ignorava que `anualizar` trunca a divisão
inteira do `BigInt`, devolvendo 15.181. Nos dois o código estava certo.

Pôr arredondamento em `anualizar` teria movido um número que CALC-024 publica
desde 31/07/2026, por sete milésimos de ponto percentual. Não foi feito.

### Adicionado · parâmetros do seguro-desemprego · CALC-009

**Duas naturezas, e a diferença está declarada no código.**

*Número de parcelas* — Lei nº 7.998/1990, art. 4º, § 2º, com a redação da Lei nº
13.134/2015, lida no Planalto. Vigência a partir de 17/06/2015.
`https://www.planalto.gov.br/ccivil_03/leis/l7998.htm`

*Valor da parcela* — o art. 5º fixa o método e expressa os limites em **BTN**,
moeda extinta em 1991. Os valores em reais vêm da tabela anual do Ministério do
Trabalho e Emprego, com vigência a partir de 11/01/2026:

| Faixa de salário médio | Cálculo |
|---|---|
| Até R$ 2.222,17 | média × 0,8 |
| De R$ 2.222,18 a R$ 3.703,99 | (média − R$ 2.222,17) × 0,5 + R$ 1.777,74 |
| Acima de R$ 3.703,99 | R$ 2.518,65 (teto) |

Piso: o salário mínimo, pelo art. 5º, § 2º — parâmetro que já existia.

⚠️ **A FONTE MAIS FRACA DO PROJETO, E ISSO ESTÁ DITO.** A portaria que formaliza
a tabela não foi localizada: foram tentados a busca do DOU por período e por
órgão, o JSON diário de 09 a 14/01/2026 e a página de serviço do MTE. O que se
tem é a divulgação no portal do próprio órgão emissor, publicada em 13/01/2026.

Conferência cruzada que aumenta a confiança: o piso declarado ali, R$ 1.621,00,
coincide com `salario-minimo` de 2026, conferido no PDF da Portaria
Interministerial MPS/MF nº 13/2026.

**A fazer na próxima auditoria:** localizar a portaria e trocar a URL pelo texto
com força normativa, como foi feito com o INSS em 31/07/2026.

### Adicionado · CALC-009 · seguro-desemprego

Fecha a pergunta que CALC-008 deixa aberta: a rescisão por acordo avisa que o
trabalhador perde o seguro-desemprego e não diz quanto isso vale. As duas se
citam.

**Um caso-ouro reprovou por estar errado, e virou o melhor caso do arquivo.**
`R$ 2.000,00 × 0,8 = R$ 1.600,00` falhou porque R$ 1.600,00 fica abaixo do
salário mínimo e o § 2º eleva ao piso. O caso foi movido para o bloco do piso,
onde revela o que a calculadora tem de mais útil: como o fator da 1ª faixa é 0,8,
o benefício só ultrapassa o mínimo a partir de uma média de R$ 2.026,25 — abaixo
disso, todo mundo recebe o mesmo valor.

### Adicionado · `aviso-previo-fracao-acordo` e `fgts-saque-acordo-mutuo` · a partir de 2017-11-11

**Valores:** 50% do aviso prévio indenizado; 80% de limite de movimentação da
conta vinculada.

**Fonte:** CLT, art. 484-A, I, "a" e § 1º, com a redação da Lei nº 13.467, de
2017 — *"I - por metade: a) o aviso prévio, se indenizado"* e *"§ 1º [...]
limitada até 80% (oitenta por cento) do valor dos depósitos"*.
`https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm`

**Verificado contra:** o texto compilado do Planalto, lido na íntegra em
01/08/2026, incluindo o § 2º, que veda o ingresso no Seguro-Desemprego.

**Casos-ouro afetados:** `tests/golden/aviso-e-acordo.test.ts`.

**A palavra que decide.** O inciso I diz "por metade: a) o aviso prévio, **se
indenizado**". O "se" exclui o aviso trabalhado — que é salário do período — e o
que a norma reduz é a **verba**, não o **prazo**: os dias continuam sendo os da
Lei nº 12.506/2011, e o art. 487, § 1º integra ao tempo de serviço "o período do
aviso prévio", que não foi encurtado. Por isso a projeção e os avos de 13º e
férias não mudam. É o ponto em que rescisões por acordo mais divergem na prática,
e a leitura está declarada na memória de cálculo com link para o dispositivo.

### Adicionado · CALC-008 · rescisão por acordo mútuo · e CALC-010 · aviso prévio proporcional

CALC-008 é uma terceira `Modalidade` do motor de rescisão, e não um motor
próprio: o acordo muda três coisas — aviso e multa pela metade, saque limitado a
80% —, e tudo o mais, inclusive as incidências de INSS e IRRF pesquisadas em
`docs/19`, é idêntico à dispensa. Os casos-ouro afirmam cada item do art. 484-A
**por comparação com a dispensa rodada com a mesma entrada**, o que também trava
o inverso: nenhuma outra verba pode mudar.

CALC-010 expõe uma regra que já existia dentro de CALC-002 e não era encontrável.
A contagem de dias foi **extraída** para peça compartilhada, não copiada.

### Corrigido · dois defeitos latentes que só apareceram com a terceira modalidade

Os dois pela mesma causa — constante escrita à mão onde havia parâmetro:

- a fórmula da multa do FGTS trazia `40,00%` fixo, e exibiria isso ao lado de uma
  multa de 20% no instante em que o acordo entrasse;
- o `parametroId` da etapa era sempre `fgts-multa-sem-justa-causa`, e o link da
  memória levaria ao art. 18 da Lei 8.036 numa etapa fundamentada no art. 484-A.

Nenhum dos dois quebrava nada antes de CALC-008.

### Alterado · o passo de deploy repete e falha quando o webhook não responde

O webhook do EasyPanel devolveu HTTP 000 e o job terminou `success` com o deploy
não tendo acontecido; a correção ficou uma hora parada em produção. Três
tentativas com 15 s de intervalo, e falha se todas caírem. O aviso silencioso
continua correto para o caso em que o webhook **não está configurado** — que já
era separado pelo `if` do próprio passo.

### Corrigido · a data projetada aparecia em ISO, não em pt-BR

`Tempo de serviço projetado até: 2026-08-29` estava assim desde que CALC-002 foi
ao ar. Não é erro de cálculo: é a única data do produto que escapava de
`formatarData`, porque `Destaque.valor` é texto livre e não passa pela formatação
do componente. Afetava CALC-002, e teria afetado CALC-008 e CALC-010.

### Corrigido · o detalhamento de CALC-023 não fechava quando o teto cortava

Encontrado à mão em produção, minutos depois do deploy. A tela abria os juros
**sem teto** por operação ao lado de um total **já limitado**: cada número certo
isoladamente, a soma não batendo. Quando o teto corta, o detalhamento passa a
mostrar a cobrança efetiva, e a abertura por operação vive na nota e na memória.

Travado por teste que roda a função da definição, não a do motor — nenhum
caso-ouro do motor pegaria, porque o motor devolvia os dois valores corretamente.

### Corrigido · o aviso de estimativa citava uma data que ninguém escolheu

O FGTS anunciava "parâmetros legais vigentes em 15/06/1990". Verdadeiro — a
alíquota de 8% vige desde 1990 — e lido como produto abandonado. Quando há um só
exercício disponível, o seletor de período já fica escondido e a data não é
escolha do usuário; o aviso passa a citar o intervalo de vigência. Afetava
CALC-006, CALC-007 e CALC-023.

### Corrigido · o aviso de estimativa alegava fundamento legal onde não havia

A frase única dizia *"parâmetros legais vigentes em <data>"* também no CET, na
amortização e nos juros compostos, que não consultam parâmetro legal nenhum.
Agora são duas redações, escolhidas pela cobertura de vigências.

---

## Pós-lançamento — 31/07/2026

Primeiro ciclo depois do MR-2. Duas pendências que o lançamento deixou
registradas, ambas fechadas.

### Segurança · `Strict-Transport-Security` ativado

`13-deployment` §7 condicionava a ativação à estabilidade do TLS, e a condição
foi satisfeita **por evidência**: o certificado foi substituído sozinho em
30/07/2026, sem intervenção.

Valor: `max-age=31536000; includeSubDomains`.

**`preload` fica de fora, deliberadamente.** A entrada na lista de pré-carga é
praticamente irreversível — a remoção leva meses e depende do navegador, não de
nós — e exige que `www` responda em HTTPS, o que ainda não acontece. Enquanto o
domínio não estiver completo, `preload` compraria risco permanente por uma
proteção que só vale para a primeira visita de quem nunca esteve no site.

Os cabeçalhos passaram a ter verificação própria, em
`tests/e2e/cabecalhos.spec.ts`. Até aqui só o `Referrer-Policy` era coberto, e
por via indireta. A asserção é de **valor exato**: `max-age` zerado ou
`includeSubDomains` perdido numa edição deixa o cabeçalho presente e a proteção
ausente. Há também um teste que reprova se `preload` aparecer sem que a
condição do `www` tenha sido revista.

### Alterado · a fonte do INSS 2026 passou a ser o texto da portaria

`inss-tabela-progressiva` de 2026 citava a **página institucional do INSS**. A
justificativa registrada era que o PDF da portaria é digitalizado e não tem
camada de texto — `pdftotext` sobre ele devolve vazio, o que levou à conclusão
de que ele era inconferível.

**A conclusão estava errada.** Rasterizar a página e ler a imagem funciona. O
Anexo II foi conferido assim, faixa a faixa:

| Cadastrado | Anexo II da portaria | |
|---|---|---|
| até 1.621,00 · 7,50% | até 1.621,00 · 7,5% | ✅ |
| 1.621,01 a 2.902,84 · 9,00% | de 1.621,01 até 2.902,84 · 9% | ✅ |
| 2.902,85 a 4.354,27 · 12,00% | de 2.902,85 até 4.354,27 · 12 % | ✅ |
| 4.354,28 a 8.475,55 · 14,00% | de 4.354,28 até 8.475,55 · 14% | ✅ |

Salário mínimo de R$ 1.621,00 confirmado no Art. 2º e no Art. 3º, I.

**Nenhum valor mudou** — não é correção de parâmetro. O que mudou é a URL que o
usuário abre ao auditar: agora o texto com força normativa, publicado no DOU de
12/01/2026, edição 7, seção 1, página 58, em vez da transcrição institucional.
`CLAUDE.md`: *"Abrir a fonte oficial. Não o site que diz o que a fonte oficial
diz."*

O link da Portaria nº 6/2025 foi reverificado no mesmo passo: responde 200, tem
camada de texto e o Anexo II confere com as quatro faixas cadastradas.

> **Nota de método, para a próxima auditoria.** Os dois PDFs recusam requisição
> sem cabeçalho de navegador (403) e o de 2026 recusa `HEAD`. Um verificador de
> link que use `HEAD` cru vai reportar as duas fontes como quebradas, e elas não
> estão.

### Adicionado · CALC-004 · férias · e CALC-005 · 13º salário

Ficam no mesmo motor porque **o 13º aparece dentro das férias**: a Lei nº
4.749/1965, art. 2º, § 2º, permite receber o adiantamento ao ensejo das férias,
e `03-functional-spec` §3.4 tem o campo para isso.

**A diferença de incidência é o que mais engana**, e é oposta à da rescisão:

| Verba | INSS | IRRF | Norma |
|---|---|---|---|
| Férias **gozadas** + terço | **incide** | tributável | RPS, art. 214, § 4º |
| Férias **indenizadas** + terço | não incide | isento | Lei 8.212, art. 28, § 9º "d" |
| Abono pecuniário + terço | não incide | isento | CLT, art. 143 e 144 |
| 1ª parcela do 13º | não incide agora | — | RPS, art. 216, § 1º |

Há um caso-ouro dedicado a essa oposição: gozadas e indenizadas lado a lado, no
mesmo arquivo, porque trocá-las produz um número plausível e errado.

**Dois achados no texto da lei:**

1. **A 1ª parcela é metade do SALÁRIO, não metade do 13º proporcional.** A Lei
   nº 4.749/1965, art. 2º, diz "metade do salário recebido no mês anterior".
   Com poucos avos isso ultrapassaria o devido — o cálculo limita ao 13º
   apurado e a memória mostra o limite aplicado.
2. **A média de variáveis integra a base do 13º** (Súmula 45 do TST: "a
   remuneração do serviço suplementar, habitualmente prestado, integra o
   cálculo da gratificação natalina").

**O §3º do Art. 3º-A entrou em produção.** Descoberto na auditoria de T-108 e
registrado desde então: a redução do imposto alcança também o 13º, cobrado
exclusivamente na fonte. O motor de IRRF já a implementava, então ela vale aqui
sem tratamento especial — e há caso-ouro exigindo que a memória **mostre a
redução**, não apenas o imposto zerado.

**Primeiro uso real de `visivelSe`.** O campo de meses do período aquisitivo só
aparece com "Proporcionais". O contrato tinha o campo desde o T-103 e nenhuma
calculadora o usava; ele virou dado em 31/07/2026 e agora tem consumidor.

### Adicionado · CALC-003 · pedido de demissão

Compartilha o motor de CALC-002 atrás de `modalidade`. Duas implementações do
mesmo cálculo divergem na primeira manutenção — e divergir aqui significa
publicar dois números diferentes para a mesma verba.

As três diferenças de `03-functional-spec` §3.3, com o texto final do documento:
o aviso passa a "Vou cumprir" / "Não vou cumprir"; não cumprindo, é
**descontado**; e **não há multa de FGTS** — com o bloco não exibido em vez de
exibido zerado, porque R$ 0,00 ao lado das outras verbas lê-se como erro de
cálculo e não como ausência de direito.

O que continua devido, confirmado no compêndio oficial do TST:

| | |
|---|---|
| **Súmula 157** | o 13º *"é devida na resilição contratual de iniciativa do empregado"* |
| **Súmula 261** | quem se demite antes de 12 meses *"tem direito a férias proporcionais"* |
| **CLT art. 487, § 2º** | fundamenta o desconto do aviso não cumprido |

**Um ponto interpretativo, declarado na memória.** O desconto é de **30 dias**,
não do aviso proporcional: a Lei nº 12.506/2011 concede o acréscimo *"aos
empregados"*, e no pedido de demissão o aviso é devido **por** ele. Aplicar o
proporcional contra o trabalhador inverteria o sentido da lei.

### Corrigido · o orçamento de JavaScript estava medindo menos do que o navegador baixa

**Duas vezes no mesmo dia, e a segunda foi introduzida ao corrigir a primeira.**

A versão nova localizava o pedaço adiado pelo NOME (`calc-<slug>.js`). Quando a
segunda calculadora de rescisão entrou, o empacotador extraiu o motor
compartilhado para um pedaço anônimo — e o relatório mostrou a rota **caindo**
de 118,2 para 113,7 kB enquanto o navegador continuava baixando a mesma coisa.
Melhora aparente por deixar de olhar: o defeito que `TC-051` existe para
impedir, cometido dentro dele.

A medição agora segue o **grafo real** de dependências, e resolve o nome do
arquivo de cada pedaço pelo **runtime do empacotador** — a fonte de verdade do
próprio navegador. Falha alto se parar de reconhecer o formato.

**O que a medição correta revelou:** a rota de rescisão pesa 121,8 kB, e
CALC-002 foi para produção acima do orçamento de 120 kB. O portão aprovou sobre
uma medição falsa.

### Alterado · `RNF-004` revisado de 120 para 135 kB, com medição

O limite foi escrito na fundação documental, antes de existir build — e
portanto antes de se saber quanto custa o piso:

    piso do framework (React + Next)   100,5 kB    84% do orçamento antigo
    nosso código estático                8,0 kB
    adiado da calculadora mais rica     13,3 kB
                                       --------
                                       121,8 kB

Sobravam 19,5 kB para o produto inteiro — componente, campos, memória de
cálculo, motores e tabelas legais de seis calculadoras. Não era um orçamento
apertado: era um orçamento consumido por dependência que não se escolhe por
rota.

**O propósito não mudou.** Quem mede a experiência é `TC-049` (LCP ≤ 2,0s),
sobre o que o usuário sente, não sobre o byte. Este limite continua sendo o
guarda-corpo contra crescimento por descuido, e 135 kB deixa ~13 kB de folga —
suficiente para as trabalhistas que faltam, insuficiente para uma biblioteca
inteira entrar sem ninguém notar.

Junto veio uma redução real: as tabelas legais e o registro saíram do pacote
**estático**. `FuncaoCalculo` deixou de receber o registro e cada definição
monta o seu, dentro do módulo adiado; o formulário recebe do servidor apenas os
anos disponíveis e o intervalo de cobertura. Juros compostos caiu para 111,0 kB
e INSS para 114,0.

### Adicionado · CALC-002 · rescisão sem justa causa

**A de maior busca do catálogo**, e a quinta publicada. O risco dela nunca foi
a aritmética: é decidir, verba a verba, se incide contribuição previdenciária,
imposto de renda e FGTS. É onde as calculadoras concorrentes mais divergem, e
`CLAUDE.md` proíbe copiar de qualquer uma.

Toda decisão de incidência foi lida no texto original e está transcrita em
`docs/19-incidencias-verbas-rescisorias.md`. **A memória de cálculo cita o
fundamento de cada uma, com link** — foi preciso um campo novo no traço,
`fundamento`, porque súmula e tese não têm vigência nem valor numérico e não
cabiam em `CitacaoParametro`.

| Verba | INSS | IRRF | Fundamento |
|---|---|---|---|
| Saldo de salário, 13º | incide | tributável | regra geral |
| Aviso prévio indenizado | **não incide** | isento | STJ, Tema 478 · RIR art. 35 |
| Férias indenizadas + ⅓ | não incide | **isento** | Lei 8.212 art. 28 §9º "d" · Súmula 386 do STJ |
| Multa de 40% | não incide | isento | Lei 8.212 art. 28 §9º "e.1" · RIR art. 35 |

**Três achados que mudam o número:**

1. **O INSS do 13º é apurado em separado** (RPS, art. 216, §1º e §3º). Somá-lo
   ao saldo de salário empurraria a base para faixas superiores.
2. **A projeção do aviso indenizado não entra na base da multa do FGTS**
   (TST, OJ-SDI1 42, II), embora o depósito de 8% incida sobre ele
   (Súmula 305 do TST). Quem soma a projeção paga a mais.
3. **A divergência do aviso prévio é declarada, não escondida.** A letra da Lei
   nº 8.212/1991 não o exclui — a alínea que fazia isso foi substituída em 1997.
   O cálculo segue a tese vinculante do STJ e diz isso na memória.

**O molde cresceu duas vezes, sem ser contornado** (`ESTADO` §7.4):

- `TipoCampo` ganhou `data`. É a primeira calculadora cuja entrada é um
  **período**, não um valor. Valor interno em texto ISO, `<input type="date">`
  nativo — que já é acessível e traduzido.
- `Etapa` ganhou `fundamento`, para regra normativa sem valor próprio.

**`engine/datas.ts` não usa `Date`.** A forma "só data" é interpretada como UTC
pela especificação, e qualquer método local desloca o dia em fuso negativo — o
do Brasil inteiro. Um contrato encerrado em 1º de março viraria 28 de fevereiro
e o mês sumiria da contagem de avos, sem erro visível e sem falhar em CI
rodando em UTC.

**Casos-ouro: origem declarada.** Não existe exemplo oficial resolvido de
rescisão publicado por órgão público. Os 33 casos são **derivados da norma**,
com o dispositivo citado ao lado de cada valor esperado — nenhum número veio de
calculadora concorrente. Onde depende de INSS ou IRRF, quem calcula é o motor
já conferido contra os exemplos da Receita.

O portão de cobertura reprovou duas vezes antes de passar, e estava certo:
`datas.ts` entrou com 67% de ramos, e é o módulo onde um defeito desloca um mês
inteiro em silêncio. Foram 38 testes só de fronteira de data — 14 contra 15
dias, véspera de aniversário, 29 de fevereiro, a regra secular do bissexto.

Orçamento: a rota de rescisão fica em **118,2 kB de 120**. As demais subiram
~1,9 kB porque o campo de data e os parâmetros trabalhistas entraram no casco
compartilhado.

### Adicionado · `www` passou a ser servido, e redireciona para o ápice

`13-deployment` §7 pedia "escolher um e manter", e `www.calculoficial.com.br`
não era servido — quem digitasse chegava a erro de certificado.

**O DNS nunca foi o problema:** o `CNAME` de `www` para o ápice já existia. O
que faltava era o domínio na lista do serviço no EasyPanel, que é o que faz o
Traefik pedir o certificado ao Let's Encrypt. Cadastrado por API; certificado
emitido em menos de dois minutos, porque o nome já resolvia.

Escolhido o **ápice** como endereço canônico. `www` responde **308**,
preservando caminho e query. A regra vive em `next.config.ts`, por condição de
`host`, e não no painel — assim é versionada, revisável e testável. As
canônicas já apontavam para o ápice e sozinhas resolveriam a indexação; o
redirecionamento é melhor porque canônica é dica e redirecionamento é
instrução, e porque consolida num só endereço os links que outros sites fizerem
para `www`. Com busca orgânica como único canal de aquisição, essa consolidação
é o ativo.

Dois testes em `tests/e2e/cabecalhos.spec.ts`, com `Host` forjado: `www`
redireciona preservando o caminho, e o ápice **não** redireciona — a segunda
asserção existe porque a regra escrita errada vira laço infinito, que derruba o
site inteiro.

### Alterado · o orçamento de JavaScript deixou de crescer com o catálogo

`RNF-004` limita cada rota de calculadora a 120 kB comprimidos, e a folga estava
em 2,4 kB. A medição explicou por quê:

| Cenário medido | Pedaço da rota | Total |
|---|---|---|
| Só juros compostos — o "casco" | 9,7 kB | 113,1 kB |
| Só salário líquido | 11,0 kB | 114,4 kB |
| As quatro, como estava | 14,1 kB | **117,6 kB** |

O casco custa 9,7 kB e **cada calculadora acrescentava ~1,1 kB ao pacote de
todas as rotas**. CALC-002 levaria a ~118,7 kB e CALC-003 estouraria — com 71
calculadoras por publicar. O limite não é decorativo: o produto é consumido
majoritariamente em rede móvel.

Três mudanças, todas na mesma direção — a rota carrega o que aquela rota usa:

1. **O formulário chega resolvido do servidor.** O componente de calculadora é
   de cliente e resolvia o slug no registro, arrastando as quatro definições
   para o pacote. Agora recebe `FormularioCalculadora` — campos, rótulos e
   parâmetros requeridos, nada mais. FAQ, descrição de SEO e relacionadas
   deixaram de ser baixadas: só o servidor as renderiza.
2. **A função de cálculo é adiada, uma por calculadora** (`lib/calculadoras/calculo.ts`).
   O pedido sai na montagem, não na primeira tecla — o usuário ainda vai
   digitar, e é nessa folga que o pedaço viaja.
3. **`calcular` virou exportação de topo** em cada definição, com
   `webpackExports` no import adiado. Sem isso o pedaço carregava o objeto
   inteiro: o do salário líquido caiu de 3,3 para 2,3 kB só com a diretiva.

| Rota | Antes | Depois | Folga |
|---|---|---|---|
| `/calculadora/juros-compostos` | 117,6 kB | **113,4 kB** | 6,6 kB |
| `/calculadora/salario-liquido` | 117,6 kB | **113,1 kB** | 6,9 kB |
| `/calculadora/irrf` | 117,6 kB | **112,9 kB** | 7,1 kB |
| `/calculadora/inss` | 117,6 kB | **111,3 kB** | 8,7 kB |

O ganho que interessa não é o de hoje: é que **a próxima calculadora só afeta a
própria rota**. O total passou a ser casco + uma calculadora, e para de crescer
com o catálogo.

**`visivelSe` deixou de ser função e virou dado** (`CondicaoVisibilidade`).
Função não atravessa a fronteira servidor→cliente. Não houve perda de
capacidade em uso: o campo estava declarado desde o T-103 e nenhuma das quatro
calculadoras publicadas o usava. Era contrato especulativo, e o formato
declarativo cobre o caso real que vem a seguir — campo que aparece conforme uma
seleção, como o tipo de aviso prévio em CALC-002.

**O que NÃO mudou, e era a condição para mexer nisso:** o formulário continua
saindo pronto no HTML estático. Quatro `<input>` no HTML gerado de
`/calculadora/salario-liquido`, antes e depois. Nenhuma etapa de hidratação
precisa acontecer para ele aparecer.

#### O verificador teve de aprender a enxergar o que foi adiado

Pedaço adiado **não consta do manifesto da rota**. Medido do jeito antigo,
`TC-051` mostraria a rota caindo de 117,6 para 110,9 kB e não contaria os 2 a
3,5 kB que o navegador baixa em seguida para a calculadora funcionar. Seria um
orçamento que passa por deixar de olhar — a mesma falha do `echo` do T-003 e do
`--passWithNoTests` do T-107.

`verificar-orcamento.ts` passou a emitir **uma linha por calculadora publicada**,
somando o pedaço próprio, e a **reprovar** quando uma calculadora publicada não
tem pedaço correspondente — o que acontece se alguém remover ou renomear o
`webpackChunkName`. Provado por mutação: apagando `calc-inss.*.js` do build, o
script sai com código 1 e diz qual calculadora ficou sem medição.

A regra virou **lint**, não recomendação: `REGISTRO_FORA_DO_CLIENTE` impede que
componente de cliente importe o registro de calculadoras. A volta é um import de
uma linha e nenhum teste funcional a pegaria — tudo continuaria funcionando, só
mais pesado, até o orçamento estourar meses depois sem culpado óbvio. Provado
por mutação: reintroduzindo o import em `Calculadora.tsx`, o lint reprova
citando `RNF-004`.

`catalogo.test.ts` ganhou a terceira lista a conferir: o mapa de carga adiada.
Calculadora publicada sem entrada nele renderizaria o formulário inteiro e nunca
sairia de "Calculando…". A asserção é de **identidade** de função, não de
existência — trocar duas entradas de lugar produziria a calculadora errada na
rota certa, que é o defeito mais caro que este projeto pode publicar.

---

## Lançamento — 31/07/2026

**MR-2 alcançado.** Produto público em `https://calculoficial.com.br`. Começa a
contagem dos 90 dias de medição.

**No ar:** 4 calculadoras · 3 guias · busca · permalink · memória de cálculo
auditável · 4 páginas legais · sitemap e robots.

### Conferência pós-deploy em produção

Passo 7 de "Ao atualizar um parâmetro legal" (`CLAUDE.md`). Salário bruto de
R$ 5.000,00, refeito à mão a partir dos números da **fonte**, não do código:

| Etapa | À mão | Produção |
|---|---|---|
| INSS faixa 1 · 1.621,00 × 7,5% | 121,58 | |
| INSS faixa 2 · 1.281,84 × 9% | 115,37 | |
| INSS faixa 3 · 1.451,43 × 12% | 174,17 | |
| INSS faixa 4 · 645,73 × 14% | 90,40 | |
| **INSS total** | **501,51** | **R$ 501,51** ✅ |
| IRRF · desconto simplificado, base 3.891,29 | 200,05 | |
| IRRF · deduções legais, base 4.498,49 | 336,67 — descartado, pior | |
| Redutor, §1º: min(312,89 ; 200,05) | 200,05 | |
| **IRRF devido** | **0,00** | **R$ 0,00** ✅ |
| **Líquido** | **4.498,49** | **R$ 4.498,49** ✅ |

A memória de cálculo em produção cita as três normas corretas: Portaria MPS/MF
13/2026, Lei 15.191/2025 e o Art. 3º-A na redação da Lei 15.270/2025.

A tabela do guia de INSS é renderizada a partir de `lib/params/` e traz o link
oficial ao lado (`ADR-009` G-2), confirmando que o conteúdo não tem valor legal
digitado à mão.

### Cabeçalhos verificados no ar

`Referrer-Policy: strict-origin` · `X-Content-Type-Options: nosniff` ·
`X-Frame-Options: DENY` · `Permissions-Policy`. As 16 rotas respondem 200.

### O que ficou de fora, com o motivo

| O quê | Por quê |
|---|---|
| `Content-Security-Policy` | Depende das origens exatas do provedor de anúncio; curinga anularia a proteção contra AM-02 |
| `Strict-Transport-Security` | `13-deployment` §7 condiciona à estabilidade do TLS. Ativar no próximo ciclo — HSTS mal configurado tira o site do ar por meses |
| Deploy automático | Decisão registrada em `13-deployment` §4 |
| `www.calculoficial.com.br` | Não servido pelo EasyPanel |
| Vale-transporte (`RN-027`) | Percentual legal não localizado em fonte oficial |
| Anúncio, análise de uso, série do Banco Central | `ADR-008` |

---

## Auditoria de parâmetros — 31/07/2026

- **Ciclo:** pré-lançamento (T-108)
- **Escopo:** os 9 parâmetros com vigência aberta
- **Divergências encontradas:** 0
- **Links de fonte verificados:** 5 · quebrados e corrigidos: 0
- **Tempo gasto:** ~0,4 h — insumo para `HIP-04`

Conferência dígito a dígito contra a fonte oficial, não contra o que outra
página diz que a fonte oficial contém.

### `inss-tabela-progressiva` · a partir de 2026-01-01

Fonte: Portaria Interministerial MPS/MF nº 13, de 09/01/2026, Anexo II.
Conferido na página institucional do INSS, que atribui os valores expressamente
a essa portaria e informa aplicação a partir da competência janeiro/2026 — o
PDF da portaria é digitalizado, sem camada de texto.

> Ainda no mesmo dia, o Anexo II foi conferido **no próprio PDF**, rasterizando
> a página. Mesmos quatro valores, agora contra o texto com força normativa.
> Ver "Pós-lançamento — 31/07/2026". Este registro fica como está: descreve o
> que a auditoria de T-108 de fato fez.

| Cadastrado | Fonte oficial | |
|---|---|---|
| até 1.621,00 · 7,50% | Até R$ 1.621,00 · 7,5% | ✅ |
| 1.621,01 a 2.902,84 · 9,00% | De R$ 1.621,01 a R$ 2.902,84 · 9% | ✅ |
| 2.902,85 a 4.354,27 · 12,00% | De R$ 2.902,85 até R$ 4.354,27 · 12% | ✅ |
| 4.354,28 a 8.475,55 · 14,00% | De R$ 4.354,28 até R$ 8.475,55 · 14% | ✅ |

### `salario-minimo` · a partir de 2026-01-01

Cadastrado R$ 1.621,00. A mesma página o usa como salário de contribuição do
contribuinte individual, facultativo e MEI. ✅

### `irrf-tabela-progressiva` · a partir de 2025-05-01

Fonte: Lei nº 15.191, de 11/08/2025. Conferido na tabela publicada pela Receita
Federal para 2026, que cita essa lei.

| Cadastrado | Fonte oficial | |
|---|---|---|
| até 2.428,80 · isento | Até R$ 2.428,80 · — | ✅ |
| 2.428,81 a 2.826,65 · 7,50% · deduzir 182,16 | idem | ✅ |
| 2.826,66 a 3.751,05 · 15,00% · deduzir 394,16 | idem | ✅ |
| 3.751,06 a 4.664,68 · 22,50% · deduzir 675,49 | idem | ✅ |
| acima de 4.664,68 · 27,50% · deduzir 908,73 | idem | ✅ |

### `irrf-deducao-dependente` e `irrf-desconto-simplificado` · a partir de 2025-05-01

R$ 189,59 e R$ 607,20. Ambos conferem com a mesma página da Receita. ✅

### Redutor do Art. 3º-A · a partir de 2026-01-01

Fonte: Lei nº 9.250/1995 com a redação da Lei nº 15.270, de 26/11/2025.
Conferido contra o texto publicado no Legin da Câmara.

| Parâmetro | Cadastrado | Texto da norma | |
|---|---|---|---|
| `irrf-reducao-limite-integral` | R$ 5.000,00 | "até R$ 5.000,00" | ✅ |
| `irrf-reducao-valor-maximo` | R$ 312,89 | "até R$ 312,89 (de modo que o imposto devido seja zero)" | ✅ |
| `irrf-reducao-constante` | R$ 978,62 | "R$ 978,62 − (0,133145 × rendimentos…)" | ✅ |
| `irrf-reducao-coeficiente` | 133145/1000000 | "0,133145" | ✅ |
| `irrf-reducao-limite-aplicacao` | R$ 7.350,00 | §2º "superior a R$ 7.350,00 … não terão redução" | ✅ |

O §1º — redução limitada ao imposto determinado pela tabela — confere com
`RN-013.1` e com o comportamento verificado por mutação no T-102.

**Achado sem divergência, para o backlog.** O §3º estende a redução ao imposto
do décimo terceiro salário. Não afeta nenhuma calculadora publicada; precisa
ser considerado quando CALC-005 for construída.

### Links de fonte

As 5 URLs distintas respondem 200 e carregam a norma correta. Todas em domínio
oficial, conforme `BV-07`.

### TLS

Certificado de `calculoficial.com.br` emitido por Let's Encrypt em 30/07/2026,
válido até 28/10/2026. **A renovação automática está confirmada por evidência**,
não por configuração: o certificado anterior foi substituído sozinho, sem
intervenção.

---

## [Não lançado]

### Adicionado
- Fundação documental do projeto: catálogo, PRD, arquitetura, modelo de dados, segurança, testes, deploy, observabilidade, runbook e seis registros de decisão arquitetural.
- `RN-031.1` — exceção única e exaustiva a `RN-031`, cobrindo o evento `busca_sem_resultado`. Antes a exceção existia apenas em `14-observability` §4.3, sem contrapartida no PRD nem no critério de TC-042.
- `00-catalogo-calculadoras` §17 — registro das nove calculadoras que não satisfazem a regra 4 de crescimento do catálogo, com regra de resolução antes da abertura de cada fase.
- `EP-016` `/api/health` — rota de verificação de saúde, exigida pela regra D-4 de `13-deployment` §3 e consumida pelo passo pós-deploy que dispara o rollback automático. Única rota não estática do sistema; registrada em `06-api-spec` §2.2 e na matriz de autorização de `07-security` §3, porque rota nova precisa ser alteração visível na documentação e não acréscimo silencioso.
- Ferramental (T-001) e empacotamento em contêiner (T-002): as regras invioláveis de `CLAUDE.md` passam a ser verificadas mecanicamente por lint, e a imagem de produção é construída em múltiplos estágios, sem código-fonte nem dependência de desenvolvimento, com processo sem privilégio.
- Pipeline de integração e entrega (T-003), na ordem de `13-deployment` §4, com a assimetria de R-3 preservada: parâmetro legal inválido interrompe antes do build; falha da série econômica prossegue com aviso.
- `ADR-007` — unidade `fracao` para coeficiente legal que não cabe em basis points. O redutor do Art. 3º-A da Lei nº 9.250/1995 usa `0,133145`, que em basis points seria `1331,45` — não inteiro. Emenda a `ADR-004`, que permanece válido em tudo o mais.
- `ADR-008` — escopo enxuto para o lançamento. O plano anterior contradizia o próprio marco MR-1: declarava a tese demonstrável ao fim da primeira calculadora e construía mais nove antes de lançar.
- `RN-013.1` — forma exata do redutor do imposto mensal, conferida contra o texto do art. 3º-A. A redação genérica anterior não capturava que a faixa de até R$ 5.000 usa teto fixo e não a fórmula, divergência de R$ 133 num rendimento de R$ 4.000.
- `ADR-009` — guia é dado declarativo em `lib/guias/`, não MDX. A decisão não é de formato: um valor legal escrito na prosa de um guia é constante legal fora de `lib/params/` (regra inviolável nº 1) e produz o pior modo de falha do projeto — a portaria nova entra, a calculadora passa a usá-la, e o guia segue exibindo a tabela velha, com aparência de correto e sem nada falhar. Regra **G-1** proíbe; `tests/unit/guias.test.ts` verifica.
- **Regra inviolável nº 11** em `CLAUDE.md`, decorrente de G-1.
- **EP-005, EP-006, EP-013 e EP-014** (T-106): `/guias`, `/guia/{slug}`, `/sitemap.xml` e `/robots.txt`. As rotas do sitemap são derivadas dos registros de calculadoras e de guias — publicar uma calculadora a coloca no sitemap no mesmo commit. Uma calculadora publicada e ausente do sitemap seria invisível para o único canal de aquisição do produto, sem nada quebrar.
- **Três guias**: como o INSS é calculado · imposto de renda na folha · salário bruto e líquido. As tabelas e valores exibidos vêm de `lib/params/`, com norma, vigência e link ao lado de cada um.
- **Dados estruturados** `WebSite`, `WebApplication`, `FAQPage`, `Article` e `BreadcrumbList`, montados a partir dos mesmos objetos que a página renderiza — não há como o marcado divergir do exibido. Registrada em `DadosEstruturados.tsx` a pendência de contemplar o `<script>` por hash quando a política de segurança de conteúdo entrar.
- **TC-040 e TC-041 implementados** (`tests/leak/vazamento.spec.ts`) — o controle C-07 de `07-security` §4.2, único mecanismo que torna `RN-030` executável. Marcadores nos quatro formulários, todo o tráfego interceptado, e a busca por eles em URL, corpo, cabeçalhos e Base64. TC-042 e TC-043 não têm objeto (`ADR-008` adiou análise e anúncio) e foram substituídos por um teste de linha de base que **reprova no dia em que o objeto surgir**.
- **Cabeçalhos de segurança** em `next.config.ts`: `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options` e `Permissions-Policy`. `Content-Security-Policy` e `Strict-Transport-Security` continuam adiadas, cada uma com o motivo registrado.
- **Auditoria de acessibilidade** (`tests/e2e/acessibilidade.spec.ts`): varredura A e AA em 13 rotas e no estado com resultado na tela, mais os percursos que ferramenta nenhuma vê — ordem de tabulação, ausência de armadilha de foco, indicador visível de foco, região dinâmica cortês, associação de erro ao campo e alvo de toque.
- **BV-12 implementado** (`npm run validate:commits`): formato convencional com escopo obrigatório para todo commit, e os quatro campos de fonte exigidos em commit de parâmetro legal. Era a única verificação estrutural declarada e sem execução.

### Alterado
- **`11-roadmap` e `BACKLOG` reescritos na versão 2.0** por `ADR-008`: lançamento com 4 calculadoras em ~12 dias-dev, contra 10 calculadoras em 36,75 dias. 40 tickets viraram 8. Nada removido do projeto — reordenado, com o que foi adiado declarado no ADR.
- Estrutura de arquivos restaurada para a forma que `CLAUDE.md` e `docs/README.md` assumem: documentos em `docs/`, ADRs em `docs/16-adr/`. Estavam achatados na raiz, o que quebrava todos os links relativos entre documentos.
- `README.md` da raiz passa a ser o README do produto; o índice da documentação volta para `docs/README.md`. Os dois estavam trocados.
- `00-catalogo-calculadoras` §15 — quebra por fase corrigida de 10/16/25/24 para **10/17/28/20**, conferida contra a coluna `Fase` das tabelas §4 a §13. O total (75) já estava correto.
- `04-architecture` §9 — o ponto de quebra de auditoria deixa de afirmar que o catálogo cabe no limite. Contagem real de calculadoras com parâmetro versionado, acumulada por fase: 9 · 16 · 24 · **29**, contra um teto declarado de ~25. O limite é cruzado em v4.
- `12-test-plan` §7 — TC-042 passa a admitir `busca_sem_resultado` e a verificar que ela é a única exceção; escopo dos marcadores de TC-040 e TC-043 restrito aos formulários de calculadora. Como estava, o teste bloqueador reprovava comportamento especificado.
- **`Referrer-Policy` corrigida de `strict-origin-when-cross-origin` para `strict-origin`.** O valor documentado em `07-security` §5 **não** mitigava a ameaça que ele mesmo declarava: preserva a URL completa em requisição de mesma origem, e aqui todas as requisições de recurso são de mesma origem. Encontrado por TC-040 — ao digitar o salário, `replaceState` o punha na query e o `Referer` o levava ao registro de acesso do servidor.
- **`--color-text-secondary` corrigida de `#55607190` para `#556071`.** Os dois dígitos finais eram 56% de transparência; sobre branco o contraste caía para **2,5:1** contra os 4,5:1 de `RNF-006`. Reprovava na linha de contexto, no detalhamento, no texto de ajuda de campo e em todas as respostas do FAQ — ou seja, em toda a prosa secundária do site.
- **`--color-accent` nunca existiu.** Três usos apontavam para um token inexistente, incluindo a borda de foco dos campos e a cor do link para a norma dentro da memória de cálculo. Trocados por `--color-brand`.
- **Alvo de toque das migalhas e do rodapé** subiu de 19 px para 28 px — WCAG 2.2 (2.5.8) exige 24.
- **`--passWithNoTests` removido** de `test:golden`, `test:e2e` e `test:leak`. Era a máscara que permitiria a suíte inteira desaparecer sem o pipeline notar.
- **TC-051 passou a medir** (`npm run check:orcamento`). Do T-003 ao T-105 o passo era um `echo` justificado por "ainda não há rota de calculadora para medir" — havia desde o T-103, e o `echo` continuou passando, que é exatamente o que o comentário ao lado dele advertia. Hoje soma o JavaScript comprimido por rota a partir do manifesto do build e bloqueia acima de 120 kB. Rota de calculadora: **117,6 kB**, folga de 2,4 kB.
- **`relacionadas` passou a ser renderizado** na página de calculadora. Era critério de aceite do T-104: as quatro calculadoras declaravam relacionadas desde então e nenhuma página as exibia.
- **Rodapé** deixou de anunciar como "em breve" INSS, Imposto de Renda e juros compostos — as três publicadas no T-104. Passou a derivar do registro; a divergência não tem como voltar.
- **Home 7,6 kB mais leve** (112,6 → 105,0 kB comprimidos). A busca importava o registro completo de calculadoras e, por ele, o motor de cálculo e as tabelas de INSS e IRRF, para filtrar quatro nomes. Passou a usar `calculadoras/indice.ts`, mantido em sincronia por `tests/unit/catalogo.test.ts`.
- **Deploy manual passou a ser estado esperado, não falha.** O webhook do EasyPanel só é alcançável pelo domínio do painel, que é configuração do servidor inteiro — e a VPS hospeda outros projetos, com o painel já em domínio próprio. O passo tenta e avisa; falhar deixaria o pipeline permanentemente vermelho por condição esperada, e vermelho permanente ensina a ignorar vermelho.
- `13-deployment` §5 — acrescentadas `NEXT_PUBLIC_AD_SLOT_ID`, `NEXT_PUBLIC_CMP_ID`, `BCB_API_BASE_URL` e `BCB_TIMEOUT_MS`, que existiam em `.env.example` e não na tabela, mais a regra de sincronia entre os dois.

---

## Modelo de entrada

Ao lançar cada versão, copiar a estrutura abaixo e preencher apenas as seções aplicáveis.

```markdown
## [v1.0] — Lançamento

### Adicionado
- CALC-001 Salário líquido, com memória de cálculo e seletor de vigência
- ... demais calculadoras do v1
- 10 guias em MDX

### Parâmetro
- Tabela progressiva do imposto — vigência a partir de {periodo}
  Fonte: {norma} · {url}
  Verificado contra: {como foi conferido}
  Casos-ouro: {ids}

### Auditoria
- Auditoria completa de parâmetros. Divergências: nenhuma.
```

---

## Modelo de correção de parâmetro

```markdown
### Correção de parâmetro

**{Nome do parâmetro} — valor incorreto na vigência {periodo}**

- **O que estava errado:** {descrição objetiva}
- **Publicado desde:** {versão}
- **Corrigido em:** {versão}
- **Calculadoras afetadas:** {ids}
- **Impacto estimado no resultado:** {faixa de divergência}
- **Correção:** {o que foi alterado}
- **Fonte conferida:** {norma} · {url}
- **Caso-ouro adicionado:** {id} — teria detectado este erro
- **Por que não foi detectado antes:** {análise honesta da lacuna}
```

O último campo é o mais importante. Sem ele, a correção conserta o valor e preserva a falha de processo que o produziu.

---

## Modelo de registro de auditoria

Registrado a cada ciclo, **mesmo quando nada muda**. "Auditado, sem divergência" é informação: prova que a verificação aconteceu e mantém `M-3` mensurável.

```markdown
### Auditoria

- **Ciclo:** {trimestral | virada de exercício}
- **Escopo:** {parâmetros com vigência aberta}
- **Divergências encontradas:** {número}
- **Links de fonte verificados:** {número} · quebrados e corrigidos: {número}
- **Tempo gasto:** {horas} — insumo para HIP-04
```

---

## Nota sobre versionamento

O produto usa versionamento semântico adaptado:

| Componente | Muda quando |
|---|---|
| Maior | Mudança que altera resultados de forma incompatível, ou remoção de calculadora |
| Menor | Calculadora nova, funcionalidade nova, nova vigência de parâmetro |
| Correção | Defeito de software, ajuste de conteúdo, correção de parâmetro |

**Observação deliberada.** Nova vigência de parâmetro é versão *menor*, não *correção* — porque o resultado para uma mesma data de referência não muda. É essa propriedade que `RF-004` garante e que os casos-ouro das vigências anteriores protegem (regra MG-2 de `13-deployment`).
