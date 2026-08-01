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

## Ciclo de 01/08/2026

Quatro calculadoras: CALC-026, CALC-070, CALC-054 e CALC-023. A última trouxe o
primeiro parâmetro legal do bloco de crédito.

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
